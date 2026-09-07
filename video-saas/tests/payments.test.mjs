import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,verify} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openStore} from '../store.mjs';
import {reconcileOrder,paymentConfig} from '../payments.mjs';
test('WeChat signed queries verify merchant, amount, signature and duplicate settlement',async()=>{
  const pair=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  const settings={WECHAT_APP_ID:'test-app',WECHAT_MCH_ID:'test-merchant',WECHAT_SERIAL_NO:'merchant-key',WECHAT_PRIVATE_KEY:pair.privateKey,WECHAT_PLATFORM_PUBLIC_KEY:pair.publicKey,WECHAT_PLATFORM_SERIAL:'platform-key',PLAN_CNY_FEN:'22000'};
  const previous=Object.fromEntries(Object.keys(settings).map(k=>[k,process.env[k]]));Object.assign(process.env,settings);
  const originalFetch=globalThis.fetch,dir=await mkdtemp(join(tmpdir(),'haoword-pay-')),db=openStore(dir);
  let total=1,validSignature=true;
  try{
    assert.equal(paymentConfig().wechat,true);
    db.prepare('INSERT INTO users(id,email,password,created) VALUES(?,?,?,?)').run('u','pay@example.com','unused',1);
    db.prepare('INSERT INTO orders(id,user_id,method,status,amount,currency,created) VALUES(?,?,?,?,?,?,?)').run('order','u','wechat','pending',22000,'CNY',1);
    globalThis.fetch=async(url,options)=>{
      const fields=Object.fromEntries([...options.headers.Authorization.matchAll(/(\w+)="([^"]+)"/g)].map(m=>[m[1],m[2]]));
      const path=new URL(url).pathname+new URL(url).search;
      assert.equal(verify('RSA-SHA256',Buffer.from(`GET\n${path}\n${fields.timestamp}\n${fields.nonce_str}\n\n`),pair.publicKey,Buffer.from(fields.signature,'base64')),true);
      const raw=JSON.stringify({trade_state:'SUCCESS',out_trade_no:'order',mchid:'test-merchant',appid:'test-app',transaction_id:'provider-tx',amount:{total,currency:'CNY'}}),ts=String(Math.floor(Date.now()/1000)),nonce='test-nonce';
      const signature=sign('RSA-SHA256',Buffer.from(`${ts}\n${nonce}\n${raw}\n`),pair.privateKey).toString('base64');
      return new Response(raw,{headers:{'Wechatpay-Timestamp':ts,'Wechatpay-Nonce':nonce,'Wechatpay-Serial':'platform-key','Wechatpay-Signature':validSignature?signature:'invalid'}});
    };
    const order=()=>db.prepare('SELECT * FROM orders WHERE id=?').get('order');
    await reconcileOrder(db,order());assert.equal(order().status,'pending');
    total=22000;validSignature=false;await assert.rejects(()=>reconcileOrder(db,order()),/验签失败/);assert.equal(order().status,'pending');
    validSignature=true;await reconcileOrder(db,order());assert.equal(order().status,'paid');
    const expires=db.prepare('SELECT expires FROM users WHERE id=?').get('u').expires;
    await reconcileOrder(db,order());assert.equal(db.prepare('SELECT expires FROM users WHERE id=?').get('u').expires,expires);
  }finally{globalThis.fetch=originalFetch;for(const [k,v]of Object.entries(previous)){if(v===undefined)delete process.env[k];else process.env[k]=v;}db.close();await rm(dir,{recursive:true,force:true});}
});
