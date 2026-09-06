'use strict';
document.addEventListener('DOMContentLoaded',()=>{
  const menu=document.querySelector('.menu');
  menu?.addEventListener('click',()=>menu.setAttribute('aria-expanded',String(Boolean(document.querySelector('.nav-links')?.classList.toggle('open')))));
  const form=document.querySelector('#solverForm'); if(!form) return;
  const input=document.querySelector('#letters'),output=document.querySelector('#results'),min=document.querySelector('#minLength'),max=document.querySelector('#maxLength'),exact=document.querySelector('#exact'),submit=form.querySelector('[type="submit"]');
  let dictionary,generation=0,found=[],shown=0;
  const message=text=>{const p=document.createElement('p');p.className='notice';p.textContent=text;output.replaceChildren(p);};
  const syncMode=()=>{min.disabled=max.disabled=exact.checked;}; exact.addEventListener('change',syncMode);
  async function loadDictionary() {
    if(!dictionary) dictionary=(async()=>{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
      try {
        const response=await fetch('/assets/enable1.txt',{signal:controller.signal});
        if(!response.ok) throw Error('Dictionary unavailable');
        const index=LetterSolver.indexWords(await response.text());
        if(index.flat().length<100000) throw Error('Incomplete dictionary');
        return index;
      } finally {clearTimeout(timer);}
    })().catch(error=>{dictionary=undefined;throw error;});
    return dictionary;
  }
  function appendPage() {
    const list=output.querySelector('ul'),end=Math.min(shown+60,found.length),fragment=document.createDocumentFragment();
    for(const result of found.slice(shown,end)) {
      const item=document.createElement('li'),word=document.createElement('span'),score=document.createElement('span');word.className='word';score.className='score';
      for(let i=0;i<result.word.length;i++) {const letter=document.createElement(result.blankPositions.includes(i)?'mark':'span');letter.textContent=result.word[i].toUpperCase();word.append(letter);}
      const blanks=result.blankPositions.map(i=>result.word[i].toUpperCase()).join(', ');
      word.setAttribute('aria-label',result.word.toUpperCase()+(blanks?'; blank tiles: '+blanks:''));
      score.textContent=result.score+' pts';item.append(word,score);fragment.append(item);
    }
    list.append(fragment);shown=end;
    output.querySelector('.result-count').textContent=`Showing ${shown} of ${found.length} matches.`;
    output.querySelector('.more-results').hidden=shown===found.length;
  }
  function render(rack) {
    output.replaceChildren();const heading=document.createElement('h2'),note=document.createElement('p');
    heading.textContent=`${found.length} words from ${rack.toUpperCase()}`;note.className='tool-help';
    note.textContent='Sorted by length, then base tile score. Highlighted letters use zero-point blanks. Board bonuses are not included. ENABLE is not an official current game dictionary.';output.append(heading,note);
    if(!found.length) {const empty=document.createElement('p');empty.className='notice';empty.textContent='No match in this word list with these settings. Check repeated letters and the length range, or turn off exact mode. A missing result does not prove a word is invalid.';output.append(empty);return;}
    const count=document.createElement('p'),list=document.createElement('ul'),more=document.createElement('button');
    count.className='result-count';count.setAttribute('role','status');list.className='word-list';more.type='button';more.className='more-results';more.textContent='Show 60 more';more.addEventListener('click',appendPage);output.append(count,list,more);shown=0;appendPage();
  }
  async function solve(event) {
    event?.preventDefault();const request=++generation;let settings,rack;
    try {settings={min:Number(min.value),max:Number(max.value),exact:exact.checked};rack=LetterSolver.options(input.value,settings).rack;input.removeAttribute('aria-invalid');}
    catch(error) {input.setAttribute('aria-invalid','true');message(error.message);return;}
    submit.disabled=true;output.setAttribute('aria-busy','true');message('Loading the word list… Your search is processed on this device.');
    try {const index=await loadDictionary();if(request!==generation)return;found=LetterSolver.search(index,rack,settings);render(rack);}
    catch {if(request===generation)message('The word list could not be loaded. Check your connection and select Find words to retry.');}
    finally {if(request===generation){submit.disabled=false;output.removeAttribute('aria-busy');}}
  }
  form.addEventListener('submit',solve);
  form.addEventListener('input',()=>{generation++;submit.disabled=false;output.removeAttribute('aria-busy');message('Settings changed. Select Find words to update the results.');});
  const params=new URLSearchParams(location.search);
  if(params.has('letters')) {
    input.value=params.get('letters');
    for(const [key,field] of [['min',min],['max',max]]) if(params.has(key)) {const value=params.get(key);if(!/^(?:[2-9]|1[0-5])$/.test(value)){message('This example link has an invalid length. Choose new settings and search again.');return;}field.value=value;}
    exact.checked=params.get('exact')==='1';syncMode();solve();
  } else syncMode();
});
