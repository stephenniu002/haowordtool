import {openStore} from './store.mjs';
import {reconcileOrder} from './payments.mjs';
const db=openStore();let stop=false;
process.on('SIGTERM',()=>stop=true);process.on('SIGINT',()=>stop=true);
console.log('Billing reconciliation started.');
while(!stop){
  const pending=db.prepare("SELECT * FROM orders WHERE status='pending' AND method IN ('alipay','wechat') AND created>? ORDER BY created LIMIT 100").all(Date.now()-48*3600000);
  for(const order of pending){if(stop)break;try{await reconcileOrder(db,order);}catch{ /* Query failures remain pending; never infer successful payment. */ }}
  for(let i=0;i<30&&!stop;i++)await new Promise(r=>setTimeout(r,2000));
}
db.close();
