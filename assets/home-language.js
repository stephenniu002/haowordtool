(() => {
  const select = document.getElementById('home-language');
  const bindings = [];
  for (const el of document.querySelectorAll('[data-i18n]')) bindings.push({el, key:el.dataset.i18n, original:el.textContent});
  for (const attr of ['aria-label','placeholder','alt']) for (const el of document.querySelectorAll(`[data-i18n-${attr}]`)) bindings.push({el,attr,key:el.getAttribute(`data-i18n-${attr}`),original:el.getAttribute(attr)});
  const status = document.createElement('span'); status.className='sr-only'; status.setAttribute('role','status'); select.after(status);
  const originalTitle=document.title;
  let request=0, current='en'; const cached={}; const supported=['en','zh-CN','ja','fr','de','es','ko','ru'];
  const read=(data,key)=>key.split('.').reduce((obj,k)=>obj?.[k],data);
  async function setLanguage(lang, updateURL=true){
    if(!supported.includes(lang)) lang='en';
    const id=++request;
    try {
      if(lang!=='en'&&!cached[lang]){const r=await fetch('/locales/'+lang+'.json?v=eight-languages-1');if(!r.ok)throw Error('Language unavailable');const data=await r.json();if(bindings.some(b=>typeof read(data,b.key)!=='string'))throw Error('Incomplete language');cached[lang]=data;}
      if(id!==request)return;
      for(const b of bindings){const value=lang==='en'?b.original:read(cached[lang],b.key);if(b.attr)b.el.setAttribute(b.attr,value);else b.el.textContent=value;}
      current=lang;select.value=lang;document.documentElement.lang=lang;
      document.title=lang==='en'?originalTitle:'HaoWordTool — '+document.querySelector('h1').textContent.trim();
      try{localStorage.setItem('hwt-home-language',lang)}catch{}
      if(updateURL){const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url);}
      status.textContent=select.options[select.selectedIndex].textContent;
      document.dispatchEvent(new CustomEvent('home-language-change',{detail:{language:lang}}));
    }catch{if(id!==request)return;select.value=current;status.textContent='Language could not be loaded. Please try again. / 语言暂时无法加载，请重试。';}
  }
  select.addEventListener('change',()=>setLanguage(select.value));
  document.querySelectorAll('[data-home-language]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();setLanguage(a.dataset.homeLanguage)}));
  function preferred(){const explicit=new URL(location.href).searchParams.get('lang');if(explicit)return explicit;try{return localStorage.getItem('hwt-home-language')||'en'}catch{return 'en'}}
  window.addEventListener('popstate',()=>setLanguage(preferred(),false));
  setLanguage(preferred(),false);
})();
