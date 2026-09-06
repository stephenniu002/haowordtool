import {openStore,activateOrder} from './store.mjs';
const db=openStore();
const [command,id,tx,...note]=process.argv.slice(2);
if(command==='pending')console.table(db.prepare("SELECT id,user_id,method,amount,currency,proof,created FROM orders WHERE status IN ('pending','review')").all());
else if(command==='confirm-usdt'){
  const order=db.prepare('SELECT * FROM orders WHERE id=?').get(id);
  if(!order||order.method!=='usdt'||order.status!=='review')throw new Error('只能审核已经提交链上凭证的 USDT 订单');
  if(tx?.toLowerCase()!==order.proof||note.join(' ').trim().length<10)throw new Error('交易哈希必须匹配用户提交值，且需要审核说明（网络、收款地址、30 USDT 金额、确认数）');
  console.log(activateOrder(db,id,`usdt:${tx.toLowerCase().replace(/^0x/,'')}`,`Operator verified: ${note.join(' ')}`));
}else if(command!=='pending')console.log('Usage: node admin.mjs pending | confirm-usdt ORDER_ID TX_HASH "network, recipient, amount and confirmations verified"');
db.close();
