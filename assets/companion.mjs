import {setupTools} from './companion-tools.mjs';
import {setupModels} from './companion-models.mjs';
import {moreProfiles,setupLibrary} from './companion-library.mjs';
import {setupInstall} from './companion-install.mjs';
import {setupIdle} from './companion-idle.mjs';
import {setupUploads,updateAvatar,clearUploads,mediaMetadata} from './companion-uploads.mjs';
const $=s=>document.querySelector(s),profiles=[{name:'月见',type:'AI 女友',personality:'温柔、好奇，喜欢电影、音乐与周末散步。',scenario:'在安静的咖啡馆聊聊彼此的一天。',icon:'月'},{name:'林川',type:'AI 男友',personality:'开朗、耐心，喜欢做饭、旅行与摄影。',scenario:'计划一次轻松的周末旅行。',icon:'川'},{name:'我的朋友',type:'自定义朋友',personality:'请写下你希望朋友拥有的性格、兴趣和说话方式。',scenario:'从今天的一件小事开始聊天。',icon:'友'}];let selected=0;
function bubble(text,user=false){const div=document.createElement('div');div.className='bubble'+(user?' user':'');const label=document.createElement('small');label.textContent=user?'你':$('#chat-name').textContent+' · 示例回复';div.append(label,document.createTextNode(text));$('#messages').append(div);div.scrollIntoView({block:'nearest'});}
const greetings={zh:'你好，欢迎来这里。你想从今天的一件小事聊起吗？',en:'Hello! What small moment from today would you like to share?',ja:'こんにちは。今日の小さな出来事から話してみませんか？',fr:'Bonjour ! Quel petit moment de ta journée aimerais-tu partager ?',es:'¡Hola! ¿Qué pequeño momento de tu día te gustaría compartir?'};
const replies={zh:'这是固定示例回复。正式 AI 聊天尚未接通；你可以继续调整角色性格和故事设定，或导出角色卡。',en:'This is a preset demo reply. Live AI chat is not connected yet. You can customize or export your character card.',ja:'これは固定のデモ返信です。AI チャットは未接続です。キャラクターを編集・エクスポートできます。',fr:'Ceci est une réponse de démonstration prédéfinie. Le chat IA n’est pas encore connecté. Vous pouvez personnaliser ou exporter le personnage.',es:'Esta es una respuesta de demostración predefinida. La IA aún no está conectada. Puedes personalizar o exportar el personaje.'};
function data(){return Object.fromEntries(new FormData($('#profile')));}
function apply(){const b=data();$('#chat-name').textContent=b.name;$('#avatar').textContent=b.name.slice(0,1);updateAvatar();$('#messages').replaceChildren();bubble(greetings[b.language]);}
function select(i){clearUploads();selected=i;const p=profiles[i];for(const k of ['name','personality','scenario'])$('#profile').elements[k].value=p[k];document.querySelectorAll('.character').forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));apply();}
profiles.splice(2,0,...moreProfiles);
profiles.forEach((p,i)=>{const b=document.createElement('button');b.className='character';b.type='button';const title=document.createElement('strong');title.textContent=p.name+' · '+p.type;const subtitle=document.createElement('small');subtitle.textContent=p.personality;b.append(title,subtitle);b.onclick=()=>select(i);$('#characters').append(b);});
$('#profile').onsubmit=e=>{e.preventDefault();apply();$('#status').textContent='角色设定已应用，示例对话已重置。';};
$('#composer').onsubmit=e=>{e.preventDefault();const input=$('#message'),text=input.value.trim();if(!text)return;bubble(text,true);input.value='';bubble(replies[data().language]);};
$('#clear').onclick=()=>{$('#messages').replaceChildren();$('#status').textContent='当前对话已清空。';};
$('#export').onclick=()=>{if(!$('#profile').reportValidity())return;const url=URL.createObjectURL(new Blob([JSON.stringify({version:2,fictional:true,type:profiles[selected].type,...data(),media:mediaMetadata()},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='haoword-character.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);};setupUploads();select(0);setupIdle();setupLibrary(profiles);setupInstall();setupModels();setupTools();




