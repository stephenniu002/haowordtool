const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {webcrypto}=require('node:crypto');
const {createLoader}=require('../assets/dictionary-loader.js');
const {indexWords}=require('../assets/solver-core.js');
const bytes=fs.readFileSync(path.join(__dirname,'../assets/enable1.txt'));
const digest=buffer=>webcrypto.subtle.digest('SHA-256',buffer);

test('concurrent requests share one verified dictionary, then reuse it',async()=>{
  let requests=0,indexed=0;
  const load=createLoader({digest,fetchFile:async()=>{requests++;return new Response(bytes);},indexWords:text=>{indexed++;return indexWords(text);}});
  const first=load(),second=load();assert.equal(first,second);
  const [a,b]=await Promise.all([first,second]);assert.equal(a,b);
  assert.equal(await load(),a);assert.equal(requests,1);assert.equal(indexed,1);
  assert.equal(a.flat().length,168551);
});
test('a large truncated file is rejected and a retry can recover',async()=>{
  let requests=0;
  const load=createLoader({digest,indexWords,fetchFile:async()=>new Response(++requests===1?bytes.subarray(0,bytes.length-30):bytes)});
  await assert.rejects(load(),/integrity/);
  assert.equal((await load()).flat().length,168551);assert.equal(requests,2);
});
test('HTTP failure is not cached as an empty successful result',async()=>{
  let requests=0;
  const load=createLoader({digest,indexWords,fetchFile:async()=>++requests===1?new Response('Unavailable',{status:503}):new Response(bytes)});
  await assert.rejects(load(),/unavailable/);
  assert.equal((await load()).flat().length,168551);
});
test('timeout aborts the request and allows retry',async()=>{
  let requests=0,aborted=false;
  const load=createLoader({digest,indexWords,timeout:10,fetchFile:async(url,{signal})=>{
    requests++;if(requests>1)return new Response(bytes);
    return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(Error('Aborted'));},{once:true}));
  }});
  await assert.rejects(load(),/Aborted/);assert.equal(aborted,true);
  assert.equal((await load()).flat().length,168551);
});
test('HTML error pages cannot be treated as a dictionary',async()=>{
  const load=createLoader({digest,indexWords,fetchFile:async()=>new Response('<html>Not found</html>')});
  await assert.rejects(load(),/integrity/);
});
