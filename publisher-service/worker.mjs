import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeFileSync,readFileSync,unlinkSync,mkdirSync} from 'node:fs';
import {openStore,vault} from './store.mjs';
import {createMeta} from './meta.mjs';
import {browserRun} from './browser.mjs';
import {claim} from './queue.mjs';
import {mediaSignature} from './server.mjs';
import {platformById,readiness} from './platforms.mjs';
export async function processTarget({db,crypt,env,dataDir,meta,browser=browserRun}){
  const target=claim(db);if(!target)return false;
  const account=db.prepare('SELECT * FROM accounts WHERE id=?').get(target.account_id);
  let dispatched=false;
  try{
    if(account.status!=='ready')throw new Error('Account needs reconnection');
    const secret=crypt.open(account.secret,account.id),payload=JSON.parse(target.payload);let result;
    if(platformById(account.platform).driver==='meta'){
      if(!meta)throw new Error('Meta not configured');
      await meta.check(account,secret);
      const expires=Date.now()+23*3600000,id=target.asset_id;
      const url=`${env.PUBLIC_ORIGIN}/api/publisher/media/${id}?expires=${expires}&sig=${mediaSignature(env.PUBLISHER_ENCRYPTION_KEY,id,expires)}`;
      dispatched=true;result=await meta.publish(account,secret,url,payload);
    }else{
      dispatched=true;const output=await browser(env,dataDir,{action:'publish',platform:account.platform,session:secret,video:join(dataDir,'media',target.asset_id+'.mp4'),payload});
      db.prepare('UPDATE accounts SET secret=?,updated=? WHERE id=?').run(crypt.seal(output.session,account.id),Date.now(),account.id);
      result={status:'submitted',message:'Browser flow completed. Verify the published post on the platform.'};
    }
    db.prepare('UPDATE targets SET status=?,result=?,updated=? WHERE id=?').run(result.status,JSON.stringify(result),Date.now(),target.id);
  }catch(error){
    if(error.auth)db.prepare("UPDATE accounts SET status='reauthorize',updated=? WHERE id=?").run(Date.now(),account.id);
    db.prepare('UPDATE targets SET status=?,error=?,updated=? WHERE id=?').run((error.uncertain||dispatched)?'review_required':'failed',error.auth?'Reconnect this account.':'Publishing did not confirm success. Check the platform before submitting again.',Date.now(),target.id);
  }
  return true;
}
async function run(){
  const env=process.env,dataDir=resolve(env.PUBLISHER_DATA_DIR||'./data');mkdirSync(dataDir,{recursive:true,mode:0o700});
  // One worker per data directory, so a saved browser session is never used concurrently.
  const lock=join(dataDir,'worker.lock');
  try{const pid=Number(readFileSync(lock,'utf8'));if(!Number.isInteger(pid)||pid<=0)throw new Error('Invalid worker lock; inspect it manually');let alive=true;try{process.kill(pid,0);}catch(e){if(e.code==='ESRCH')alive=false;else throw e;}if(alive)throw new Error('A worker is already running');unlinkSync(lock);}catch(e){if(e.code!=='ENOENT')throw e;}
  writeFileSync(lock,String(process.pid),{flag:'wx',mode:0o600});
  const cleanup=()=>{try{unlinkSync(lock);}catch{}};process.on('exit',cleanup);process.on('SIGINT',()=>process.exit(0));process.on('SIGTERM',()=>process.exit(0));
  const db=openStore(dataDir),crypt=vault(env.PUBLISHER_ENCRYPTION_KEY),meta=readiness(platformById('facebook'),env)?createMeta({env}):null;
  db.prepare("UPDATE targets SET status='review_required',error='Worker interrupted; check the platform before retrying.' WHERE status='publishing'").run();
  db.prepare("UPDATE accounts SET status='reauthorize' WHERE status='connecting' AND id IN (SELECT account_id FROM connects WHERE status='running')").run();
  db.prepare("UPDATE connects SET status='failed' WHERE status='running'").run();
  while(true){
    const connect=db.prepare("SELECT * FROM connects WHERE status='queued' ORDER BY updated LIMIT 1").get();
    if(connect){
      db.prepare("UPDATE connects SET status='running' WHERE id=?").run(connect.id);
      const account=db.prepare('SELECT * FROM accounts WHERE id=?').get(connect.account_id);
      try{
        const output=await browserRun(env,dataDir,{action:'login',platform:account.platform});
        db.prepare("UPDATE accounts SET secret=?,status='ready',updated=? WHERE id=?").run(crypt.seal(output.session,account.id),Date.now(),account.id);
        db.prepare("UPDATE connects SET status='complete' WHERE id=?").run(connect.id);
      }catch{db.prepare("UPDATE accounts SET status='reauthorize' WHERE id=?").run(account.id);db.prepare("UPDATE connects SET status='failed',error='Complete local login and import the saved session.' WHERE id=?").run(connect.id);}
      continue;
    }
    if(!await processTarget({db,crypt,env,dataDir,meta}))await new Promise(r=>setTimeout(r,2000));
  }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))run().catch(()=>{console.error('Worker stopped. Check configuration, lock and runtime.');process.exitCode=1;});
