(function(root) {
  'use strict';
  const VALUES={a:1,b:3,c:3,d:2,e:1,f:4,g:2,h:4,i:1,j:8,k:5,l:1,m:3,n:1,o:1,p:3,q:10,r:1,s:1,t:1,u:1,v:4,w:4,x:8,y:4,z:10};
  function parseRack(input) {
    const rack=String(input).toLowerCase().replace(/\s/g,'');
    if (/[^a-z?*]/.test(rack)) throw Error('Use English letters A–Z, spaces, and ? or * for blanks. Other characters are not supported.');
    if(rack.length<2||rack.length>15) throw Error('Enter 2–15 tiles. Each ? or * counts as one tile.');
    return rack;
  }
  function match(word,rack) {
    const counts=Object.create(null),blankPositions=[]; let blanks=0,score=0;
    for(const ch of rack) {if(ch==='?'||ch==='*') blanks++; else counts[ch]=(counts[ch]||0)+1;}
    for(let i=0;i<word.length;i++) {
      const ch=word[i];
      if(counts[ch]) {counts[ch]--;score+=VALUES[ch];}
      else if(blanks) {blanks--;blankPositions.push(i);}
      else return null;
    }
    return {word,score,blankPositions};
  }
  function indexWords(text) {
    const index=Array.from({length:16},()=>[]);
    for(const word of new Set(text.split(/\s+/))) if(/^[a-z]{2,15}$/.test(word)) index[word.length].push(word);
    return index;
  }
  function options(input,{min=2,max=15,exact=false}={}) {
    const rack=parseRack(input);
    if(exact) min=max=rack.length;
    if(!Number.isInteger(min)||!Number.isInteger(max)||min<2||max>15||min>max) throw Error('Choose a length range from 2 to 15, with minimum no greater than maximum.');
    return {rack,min,max:Math.min(max,rack.length)};
  }
  function search(index,input,settings) {
    const {rack,min,max}=options(input,settings),results=[];
    for(let n=min;n<=max;n++) for(const word of index[n]) {const hit=match(word,rack);if(hit) results.push(hit);}
    return results.sort((a,b)=>b.word.length-a.word.length||b.score-a.score||(a.word<b.word?-1:a.word>b.word?1:0));
  }
  const api={parseRack,match,indexWords,options,search};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.LetterSolver=api;
})(typeof globalThis!=='undefined'?globalThis:this);
