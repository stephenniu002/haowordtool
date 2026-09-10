import {randomUUID} from 'node:crypto';
import {hash,transaction} from './store.mjs';
import {platformById} from './platforms.mjs';
export function enqueue(db,user,body) {
  if(body.confirmPublic!==true)throw new Error('Confirm public publishing first');
  if(!/^[\w-]{8,100}$/.test(body.key||''))throw new Error('Invalid request key');
  if(!Array.isArray(body.accounts)||!body.accounts.length||body.accounts.length>30||new Set(body.accounts).size!==body.accounts.length)throw new Error('Select distinct accounts');
  const digest=hash(JSON.stringify(body));
  return transaction(db,()=>{
    const previous=db.prepare('SELECT * FROM jobs WHERE user_id=? AND request_key=?').get(user,body.key);
    if(previous){if(previous.request_hash!==digest)throw new Error('Request key already used');return previous.id;}
    const id=randomUUID(),now=Date.now();
    db.prepare('INSERT INTO jobs VALUES(?,?,?,?,?)').run(id,user,body.key,digest,now);
    for(const accountId of body.accounts){
      const account=db.prepare('SELECT * FROM accounts WHERE id=? AND user_id=?').get(accountId,user);
      if(!account||account.status!=='ready')throw new Error('Account unavailable; reconnect first');
      const language=platformById(account.platform)?.language;
      const variant=body.variants?.[language]||body.variants?.default;
      if(!variant||typeof variant.title!=='string'||!variant.title.trim()||variant.title.length>100||typeof variant.description!=='string'||variant.description.length>2200)throw new Error('Supply video, title (1–100), and caption (up to 2200) for each language');
      const asset=db.prepare('SELECT * FROM assets WHERE id=? AND user_id=? AND status=\'ready\'').get(variant.assetId,user);
      if(!asset)throw new Error('Upload not available');
      db.prepare('INSERT INTO targets VALUES(?,?,?,?,?,?,?,?,?)').run(randomUUID(),id,account.id,asset.id,JSON.stringify({title:variant.title,description:variant.description,tags:[]}), 'queued',null,null,now);
    }
    return id;
  });
}
export function claim(db){return transaction(db,()=>{
  const row=db.prepare("SELECT * FROM targets WHERE status='queued' ORDER BY updated LIMIT 1").get();
  if(row)db.prepare("UPDATE targets SET status='publishing',updated=? WHERE id=?").run(Date.now(),row.id);
  return row;
});}
