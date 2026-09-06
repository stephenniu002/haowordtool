import {randomBytes,sign,verify} from 'node:crypto';
import {activateOrder} from './store.mjs';
const pem=s=>s?.replaceAll('\\n','\n');
export function paymentConfig(env=process.env){
  const cny=Number(env.PLAN_CNY_FEN);
  return {usdt:!!(env.USDT_ADDRESS&&env.USDT_NETWORK),alipay:!!(Number.isSafeInteger(cny)&&cny>0&&env.ALIPAY_APP_ID&&env.ALIPAY_PRIVATE_KEY&&env.ALIPAY_PUBLIC_KEY),wechat:!!(Number.isSafeInteger(cny)&&cny>0&&env.WECHAT_APP_ID&&env.WECHAT_MCH_ID&&env.WECHAT_SERIAL_NO&&env.WECHAT_PRIVATE_KEY&&env.WECHAT_PLATFORM_PUBLIC_KEY&&env.WECHAT_PLATFORM_SERIAL)};
}
async function alipay(method,bizContent){
  const {AlipaySdk}=await import('alipay-sdk');
  const sdk=new AlipaySdk({appId:process.env.ALIPAY_APP_ID,privateKey:pem(process.env.ALIPAY_PRIVATE_KEY),alipayPublicKey:pem(process.env.ALIPAY_PUBLIC_KEY),signType:'RSA2'});
  const result=await sdk.exec(method,{bizContent},{validateSign:true});
  if(result.code!=='10000')throw new Error('支付宝暂时无法处理，请稍后重试');
  return result;
}
async function wechat(method,path,data){
  const body=data?JSON.stringify(data):'';
  const timestamp=String(Math.floor(Date.now()/1000)),nonce=randomBytes(16).toString('hex');
  const signature=sign('RSA-SHA256',Buffer.from(`${method}\n${path}\n${timestamp}\n${nonce}\n${body}\n`),pem(process.env.WECHAT_PRIVATE_KEY)).toString('base64');
  const authorization=`WECHATPAY2-SHA256-RSA2048 mchid="${process.env.WECHAT_MCH_ID}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${process.env.WECHAT_SERIAL_NO}",signature="${signature}"`;
  const response=await fetch(`https://api.mch.weixin.qq.com${path}`,{method,headers:{Authorization:authorization,Accept:'application/json','Content-Type':'application/json'},body:body||undefined,signal:AbortSignal.timeout(20000)});
  const raw=await response.text();
  if(!response.ok)throw new Error('微信支付暂时无法处理，请稍后重试');
  const ts=response.headers.get('Wechatpay-Timestamp'),n=response.headers.get('Wechatpay-Nonce'),sig=response.headers.get('Wechatpay-Signature'),serial=response.headers.get('Wechatpay-Serial');
  if(!ts||!n||!sig||serial!==process.env.WECHAT_PLATFORM_SERIAL||Math.abs(Date.now()/1000-Number(ts))>300||!verify('RSA-SHA256',Buffer.from(`${ts}\n${n}\n${raw}\n`),pem(process.env.WECHAT_PLATFORM_PUBLIC_KEY),Buffer.from(sig,'base64')))throw new Error('微信支付响应验签失败');
  return JSON.parse(raw);
}
export async function createPayment(order){
  if(!paymentConfig()[order.method])throw new Error('该渠道尚未开通');
  if(order.method==='usdt')return {address:process.env.USDT_ADDRESS,network:process.env.USDT_NETWORK,amount:'30',verification:'manual',message:'转账后提交交易哈希，核实到账后开通。请勿重复付款。'};
  if(order.method==='alipay'){
    const r=await alipay('alipay.trade.precreate',{out_trade_no:order.id,total_amount:(order.amount/100).toFixed(2),subject:'HaoWord 视频工作台 30天订阅',timeout_express:'30m'});
    return {qr:r.qrCode||r.qr_code};
  }
  const r=await wechat('POST','/v3/pay/transactions/native',{appid:process.env.WECHAT_APP_ID,mchid:process.env.WECHAT_MCH_ID,description:'HaoWord 视频工作台 30天订阅',out_trade_no:order.id,notify_url:`${process.env.PUBLIC_ORIGIN}/api/video/payments/wechat-notify`,amount:{total:order.amount,currency:'CNY'}});
  return {qr:r.code_url};
}
export async function reconcileOrder(db,order){
  if(order.status==='paid'||order.method==='usdt')return;
  if(order.method==='alipay'){
    const r=await alipay('alipay.trade.query',{out_trade_no:order.id});
    if(['TRADE_SUCCESS','TRADE_FINISHED'].includes(r.tradeStatus)&&r.outTradeNo===order.id&&Math.round(Number(r.totalAmount)*100)===order.amount)activateOrder(db,order.id,`alipay:${r.tradeNo}`,'Verified signed Alipay query');
  }else if(order.method==='wechat'){
    const r=await wechat('GET',`/v3/pay/transactions/out-trade-no/${encodeURIComponent(order.id)}?mchid=${encodeURIComponent(process.env.WECHAT_MCH_ID)}`);
    if(r.trade_state==='SUCCESS'&&r.out_trade_no===order.id&&r.mchid===process.env.WECHAT_MCH_ID&&r.appid===process.env.WECHAT_APP_ID&&r.amount?.total===order.amount&&r.amount.currency==='CNY')activateOrder(db,order.id,`wechat:${r.transaction_id}`,'Verified signed WeChat query');
  }
}
