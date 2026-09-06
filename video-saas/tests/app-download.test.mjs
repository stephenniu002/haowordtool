import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {createApp} from '../server.mjs';
import {openStore} from '../store.mjs';
test('App package requires authenticated active subscription and never exposes source URL',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'haoword-package-')),db=openStore(dir),file=join(dir,'private.apk');await writeFile(file,'test-package');
 const server=createApp({db,env:{PUBLIC_ORIGIN:'http://localhost',ANDROID_PACKAGE_FILE:file,ANDROID_DOWNLOAD_URL:'https://private.invalid/package.apk'}});server.listen(0,'127.0.0.1');await once(server,'listening');const base='http://127.0.0.1:'+server.address().port;
 const token='a'.repeat(64),hash=createHash('sha256').update(token).digest('hex'),headers={cookie:'video_session='+token};
 try{
  const config=await (await fetch(base+'/api/video/config')).json();assert.equal(config.android,undefined);assert.equal(JSON.stringify(config).includes('private.invalid'),false);
  assert.equal((await fetch(base+'/api/video/apps/android')).status,401);
  db.prepare('INSERT INTO users(id,email,password,expires,created) VALUES(?,?,?,?,?)').run('u','u@example.test','unused',0,1);
  db.prepare('INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)').run(hash,'u',Date.now()+60000);
  assert.equal((await fetch(base+'/api/video/apps/android',{headers})).status,402);
  db.prepare('UPDATE users SET expires=? WHERE id=?').run(Date.now()+60000,'u');
  const paid=await fetch(base+'/api/video/apps/android',{headers});assert.equal(paid.status,200);assert.equal(await paid.text(),'test-package');assert.equal(paid.headers.get('cache-control'),'private, no-store');
  assert.equal((await fetch(base+'/api/video/apps/ios',{headers})).status,503);
  db.prepare('UPDATE users SET expires=0 WHERE id=?').run('u');assert.equal((await fetch(base+'/api/video/apps/android',{headers})).status,402);
 }finally{await new Promise(r=>server.close(r));db.close();await rm(dir,{recursive:true,force:true});}
});
