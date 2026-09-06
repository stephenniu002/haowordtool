const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const core=require('../assets/solver-core.js');
const data=fs.readFileSync(path.join(root,'assets/enable1.txt'),'utf8');
const index=core.indexWords(data);
const search=(rack,options)=>core.search(index,rack,options);
test('dictionary is complete, reproducible and broad',()=>{
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'),'3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89');
  assert.ok(index.flat().length>160000);
});
test('documented subset examples actually appear',()=>{
  const words=search('AELRST').map(r=>r.word);
  for(const word of ['rat','rate','tale','alert','alter','later','stale','steal','slate','tales']) assert.ok(words.includes(word),word);
});
test('exact mode uses every tile and overrides the range',()=>{
  const results=search('AELRST',{exact:true,min:2,max:3});
  assert.ok(results.some(r=>r.word==='alerts'));
  assert.ok(results.every(r=>r.word.length===6));
  assert.ok(search('LISTEN',{exact:true}).some(r=>r.word==='silent'));
  assert.ok(!search('LISTEN',{exact:true}).some(r=>r.word==='list'));
});
test('blanks contribute zero and report their positions',()=>{
  const cat=search('CA?',{exact:true}).find(r=>r.word==='cat');
  assert.deepEqual(cat,{word:'cat',score:4,blankPositions:[2]});
  for(const word of ['crate','actor','track','carts','craft']) {
    const result=search('CART?',{exact:true}).find(r=>r.word===word);
    assert.ok(result,word);assert.equal(result.score,6,word);assert.equal(result.blankPositions.length,1);
  }
  assert.equal(search('LET*',{exact:true}).find(r=>r.word==='tell').score,3);
});
test('duplicate letters cannot be reused',()=>{
  assert.equal(core.match('abb','aab'),null);
  assert.deepEqual(core.match('abb','aab?'),{word:'abb',score:4,blankPositions:[2]});
  assert.equal(core.match('letter','listen'),null);
  assert.equal(core.match('tell','let'),null);
});
test('normalization is explicit without dropping or truncating tiles',()=>{
  assert.equal(core.parseRack(' A e L R S T '),'aelrst');
  for(const input of ['','a','cat2','café','<script>','abcdefghijklmnop']) assert.throws(()=>search(input));
  assert.throws(()=>search('abc',{min:5,max:3}));
  assert.throws(()=>search('abc',{min:NaN,max:15}));
  assert.deepEqual(search('abc',{min:7,max:7}),[]);
});
test('length seven is selectable and dictionary coverage extends beyond demos',()=>{
  const results=search('READING',{min:7,max:7});
  assert.ok(results.some(r=>r.word==='reading'));assert.ok(results.every(r=>r.word.length===7));
  for(const word of ['banana','bottle','computer','education','puzzle']) assert.ok(search(word,{exact:true}).some(r=>r.word===word));
});
test('all-blank searches remain complete, sorted and zero-scoring',()=>{
  const results=search('????',{exact:true});assert.equal(results.length,index[4].length);
  assert.ok(results.every(r=>r.score===0&&r.blankPositions.length===4));
  assert.deepEqual(results.map(r=>r.word),results.map(r=>r.word).sort());
});
test('generated tool pages load the core first and provide every length',()=>{
  for(const file of ['index.html','unscrambler.html']) {
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.ok(html.indexOf('/assets/solver-core.js')<html.indexOf('/assets/site.js'));
    assert.ok(html.indexOf('/assets/dictionary-loader.js')>html.indexOf('/assets/solver-core.js'));
    assert.ok(html.indexOf('/assets/dictionary-loader.js')<html.indexOf('/assets/site.js'));
    assert.ok(!html.includes('maxlength="15"'));
    for(const id of ['minLength','maxLength']) {
      const select=html.match(new RegExp(`<select id="${id}">([\\s\\S]*?)</select>`))[1];
      assert.deepEqual([...select.matchAll(/<option[^>]*>(\d+)<\/option>/g)].map(m=>+m[1]),Array.from({length:14},(_,i)=>i+2));
    }
    assert.ok(html.includes('<noscript>'));
    assert.ok(html.includes('https://haowordtool.com/'+(file==='index.html'?'':file)));
  }
});
test('each candidate starts from a fresh inventory',()=>{
  const words=['aab','aba','abb','baa','bab','bba','bbb'];
  const forward=core.indexWords(words.join('\n')),reverse=core.indexWords([...words].reverse().join('\n'));
  assert.deepEqual(core.search(forward,'aab?'),core.search(reverse,'aab?'));
  assert.deepEqual(core.search(forward,'aab?'),core.search(forward,'aab?'));
  const results=core.search(forward,'aab?');
  assert.equal(results.find(r=>r.word==='abb').score,4);
  assert.ok(!results.some(r=>r.word==='bbb'));
});
