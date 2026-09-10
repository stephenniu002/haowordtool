import {getLanguage,t} from './video-i18n.mjs?v=companion2';
const $=id=>document.getElementById(id);
const profiles=[{name:'月见',personality:'温柔、好奇，喜欢电影与周末散步。',scenario:'在咖啡馆分享今天的小事。',trait:'温柔与好奇',icon:'月'},{name:'林川',personality:'开朗、耐心，喜欢旅行、做饭与摄影。',scenario:'一起计划下一次周末旅行。',trait:'开朗与耐心',icon:'川'},{name:'新朋友',personality:'写下你想要的性格与兴趣。',scenario:'从一句问候开始。',trait:'自由定制',icon:'+'}];
let selected=0,custom=false;
function bubble(message,user=false){const node=document.createElement('div');node.className='bubble'+(user?' user':'');const label=document.createElement('small');label.textContent=user?t('你'):($('chat-name').textContent+' · '+t('示例回复'));node.append(label,document.createTextNode(message));$('messages').append(node);$('messages').scrollTop=$('messages').scrollHeight;}
function fill(){const p=profiles[selected],form=$('profile');form.elements.name.value=t(p.name);form.elements.personality.value=t(p.personality);form.elements.scenario.value=t(p.scenario);$('chat-name').textContent=form.elements.name.value;$('avatar').textContent=p.icon;}
function clear(){ $('messages').replaceChildren();bubble(t('欢迎来到角色体验。你想从今天的一件小事聊起吗？'));}
function cards(){ $('characters').replaceChildren();profiles.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='character-choice'+(i===selected?' active':'');b.setAttribute('aria-pressed',String(i===selected));const avatar=document.createElement('span');avatar.className='avatar-circle';avatar.textContent=p.icon;const copy=document.createElement('span');copy.textContent=t(p.name);const small=document.createElement('small');small.textContent=t(p.trait);copy.append(small);b.append(avatar,copy);b.onclick=()=>{selected=i;custom=false;cards();fill();clear();};$('characters').append(b);});}
$('profile').onsubmit=e=>{e.preventDefault();custom=true;$('chat-name').textContent=$('profile').elements.name.value;$('companion-status').textContent=t('角色设定已应用到当前预览。');};
$('composer').onsubmit=e=>{e.preventDefault();const value=$('chat-input').value.trim();if(!value)return;bubble(value,true);$('chat-input').value='';bubble(t('这是一条固定示例回复，不是 AI 生成的回答。你可以先定制角色、导出角色卡，实时聊天将在服务接通后开放。'));};
$('clear-chat').onclick=clear;
$('export-character').onclick=()=>{if(!$('profile').reportValidity())return;const settings=Object.fromEntries(new FormData($('profile')));const data={format:'haoword-character',version:1,...settings,language:getLanguage(),fictionalAdult:true};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='haoword-character.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
const metadata={
  'zh-CN':['AI 伴侣 · 角色创作 | HaoWord Studio','选择虚构成年角色、定制性格与故事、导出角色卡。当前提供明确标识的示例对话。'],
  en:['AI Companion & Character Creator | HaoWord Studio','Choose a fictional adult companion, customize personality and story, and export a character card with clearly labeled sample conversations.'],
  ja:['AIコンパニオン・キャラクター作成 | HaoWord Studio','架空の成人キャラクターを選び、性格や物語を設定し、サンプル会話付きのキャラクターカードを書き出せます。'],
  fr:['Compagnon IA et création de personnage | HaoWord Studio','Choisissez un personnage adulte fictif, personnalisez sa personnalité et son histoire, puis exportez sa fiche avec des conversations d’exemple clairement identifiées.'],
  es:['Compañero de IA y creador de personajes | HaoWord Studio','Elige un personaje adulto ficticio, personaliza su personalidad y su historia, y exporta su ficha con conversaciones de ejemplo claramente identificadas.']
};
function localize(resetChat=false){cards();if(!custom)fill();if(resetChat)clear();$('chat-input').placeholder=t('写下你想说的话…');const [title,description]=metadata[getLanguage()];document.title=title;document.querySelector('meta[name="description"]')?.setAttribute('content',description);document.querySelector('meta[property="og:title"]')?.setAttribute('content',title);document.querySelector('meta[property="og:description"]')?.setAttribute('content',description);}
document.addEventListener('studio-languagechange',()=>localize(true));cards();fill();clear();localize();
