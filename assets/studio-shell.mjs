import {initI18n,getLanguage} from './video-i18n.mjs?v=studio2';
if(document.body.dataset.studio!=='video')initI18n({preserveTitle:true});
const sources=new WeakMap();
function update(){const english=getLanguage()==='en';document.querySelectorAll('[data-en]').forEach(el=>{if(!sources.has(el))sources.set(el,el.textContent);el.textContent=english?el.dataset.en:getLanguage()==='zh-CN'?(el.dataset.zh||sources.get(el)):sources.get(el);});if(document.body.dataset.studio==='app')document.title=english?'HaoWord Studio | App Creation Workspace':location.pathname==='/'?'HaoWord Studio｜App 创作与视频工作台':'App 创作工作台 | HaoWord Studio';}
update();document.addEventListener('studio-languagechange',update);
const tabs=[...document.querySelectorAll('[data-editor]')];function activate(tab){tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById('editor-'+t.dataset.editor).hidden=!active;});}
tabs.forEach((tab,i)=>{tab.onclick=()=>activate(tab);tab.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=tabs[e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];activate(next);next.focus();};});
