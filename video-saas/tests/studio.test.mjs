import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openStore,activateOrder} from '../store.mjs';
import {createApp} from '../server.mjs';
import {draftFromText,validateProject,alignedCaptions,srt,hyperframeHtml} from '../../assets/video-core.mjs';
test('storyboards reject oversized workloads and export inert HTML',()=>{
  const p=draftFromText('你好，世界！这是第二个镜头。');assert.equal(p.scenes.length,2);
  assert.throws(()=>validateProject({...p,ratio:'bad'}));assert.throws(()=>validateProject({...p,scenes:[{heading:'x',narration:'x',duration:Infinity}]}));
  p.scenes[0].heading='<script>alert(1)</script>';assert.ok(hyperframeHtml(p).includes('&lt;script&gt;'));assert.ok(!hyperframeHtml(p).includes('<script>'));
});
test('captions preserve provider timing, offset and valid SRT',()=>{
  const captions=alignedCaptions({characters:['你','好','。'],character_start_times_seconds:[0,.2,.4],character_end_times_seconds:[.2,.4,.6]},3);
  assert.equal(captions[0].start,3);assert.equal(captions[0].end,3.6);assert.match(srt(captions),/00:00:03,000 --> 00:00:03,600/);
  assert.throws(()=>alignedCaptions({characters:['a'],character_start_times_seconds:[-1],character_end_times_seconds:[0]}));
});
test('payment activation is idempotent and transaction IDs cannot be reused',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'haoword-billing-')),db=openStore(dir);
  try{
    db.prepare('INSERT INTO users(id,email,password,created) VALUES(?,?,?,?)').run('u','a@b.co','unused',1);
    const insert=id=>db.prepare('INSERT INTO orders(id,user_id,method,status,amount,currency,created) VALUES(?,?,?,?,?,?,?)').run(id,'u','usdt','review',30000000,'USDT',1);
    insert('a');insert('b');const a=activateOrder(db,'a','chain:tx1','verified',1000);assert.equal(a.expires,1000+30*86400000);
    assert.equal(activateOrder(db,'a','chain:tx1','verified',2000).alreadyPaid,true);
    assert.throws(()=>activateOrder(db,'b','chain:tx1','reused',3000));
    assert.equal(db.prepare('SELECT status FROM orders WHERE id=?').get('b').status,'review');
    assert.equal(activateOrder(db,'b','chain:tx2','verified',4000).expires,1000+60*86400000);
  }finally{db.close();await rm(dir,{recursive:true,force:true});}
});
test('HTTP requires authentication, prevents CSRF and isolates orders and videos',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'haoword-api-')),db=openStore(dir),origin='http://localhost:8787';
  const app=createApp({db,env:{PUBLIC_ORIGIN:origin,DATA_DIR:dir}});await new Promise(r=>app.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${app.address().port}`;
  const post=(path,data={},cookie='',source=origin)=>fetch(base+'/api/video'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:source,Cookie:cookie},body:JSON.stringify(data)});
  try{
    assert.equal((await fetch(base+'/api/video/me')).status,401);
    assert.equal((await post('/register',{email:'test@example.com',password:'safe password 123'},'','https://evil.test')).status,403);
    const login=await post('/register',{email:'test@example.com',password:'safe password 123'});assert.equal(login.status,200);
    const cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly/);
    assert.equal((await post('/jobs',{project:draftFromText('这是一个测试。')},cookie)).status,402);
    assert.equal((await post('/orders',{method:'usdt',amount:1},cookie)).status,400);
    const ownUser=db.prepare('SELECT id FROM users WHERE email=?').get('test@example.com');
    const ownOrder='c'.repeat(32);
    db.prepare('INSERT INTO orders(id,user_id,method,status,amount,currency,created) VALUES(?,?,?,?,?,?,?)').run(ownOrder,ownUser.id,'usdt','pending',30000000,'USDT',1);
    assert.equal((await post(`/orders/${ownOrder}/proof`,{hash:'d'.repeat(64)},cookie)).status,200);
    assert.equal(db.prepare('SELECT expires FROM users WHERE id=?').get(ownUser.id).expires,0);
    assert.equal(db.prepare('SELECT status FROM orders WHERE id=?').get(ownOrder).status,'review');
    db.prepare('INSERT INTO users(id,email,password,created) VALUES(?,?,?,?)').run('other','other@b.co','unused',1);
    const oid='a'.repeat(32),jid='11111111-1111-1111-1111-111111111111';
    db.prepare('INSERT INTO orders(id,user_id,method,status,amount,currency,created) VALUES(?,?,?,?,?,?,?)').run(oid,'other','usdt','pending',30000000,'USDT',1);
    db.prepare('INSERT INTO jobs(id,user_id,status,project,created,updated) VALUES(?,?,?,?,?,?)').run(jid,'other','done','{}',1,1);
    assert.equal((await post(`/orders/${oid}/proof`,{hash:'b'.repeat(64)},cookie)).status,404);
    assert.equal((await fetch(base+`/api/video/jobs/${jid}/video`,{headers:{Cookie:cookie}})).status,404);
    assert.equal((await fetch(base+'/video-saas/.env')).status,404);
    assert.equal((await fetch(base+'/video-studio.html')).status,200);
    await post('/logout',{},cookie);assert.equal((await fetch(base+'/api/video/me',{headers:{Cookie:cookie}})).status,401);
  }finally{await new Promise(r=>app.close(r));db.close();await rm(dir,{recursive:true,force:true});}
});
