const $=id=>document.getElementById(id);let state,requestKey=null;
const cachedUploads=new Map();
function notice(text){$('notice').textContent=text;}
async function api(path,options={}){const res=await fetch(`/api/publisher/${path}`,{credentials:'same-origin',...options});let b;try{b=await res.json();}catch{throw new Error('发布服务尚未接入此域名，请管理员配置后端及反向代理。');}if(!res.ok)throw new Error(b.error||'Request failed');return b;}
const post=(path,value)=>api(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
function el(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
async function refresh(){state=await api('state');$('login').hidden=true;$('workspace').hidden=false;$('platforms').replaceChildren();
  for(const p of state.platforms){const card=el('div');card.className='platform';card.append(el('b',p.name));const b=el('button',p.available?'连接账号':'尚未配置');b.disabled=!p.available;b.onclick=()=>connect(p);card.append(b);card.append(el('small',p.driver==='meta'?'官方授权':p.driver==='browser'?'本机浏览器登录':'暂未支持'));$('platforms').append(card);}
  const selected=new Set([...document.querySelectorAll('#accounts input:checked')].map(n=>n.value));$('accounts').replaceChildren(el('h3','选择发布账号'));
  for(const a of state.accounts){const label=el('label'),check=el('input');check.type='checkbox';check.value=a.id;check.disabled=a.status!=='ready';check.checked=selected.has(a.id);check.onchange=()=>{requestKey=null;};label.append(check,document.createTextNode(`${a.label} · ${a.platform} · ${a.status}`));$('accounts').append(label);}
  await results();
}
async function connect(p){try{if(p.driver==='meta'){location.assign((await post('oauth/meta',{})).url);return;}await post('connect',{platform:p.id,label:p.name});notice('请在发布服务电脑上打开的浏览器中完成登录，然后刷新状态。');await refresh();}catch(e){notice(e.message);}}
async function results(){const {targets}=await api('jobs');$('results').replaceChildren();const labels={queued:'排队中',publishing:'发布中',submitted:'已提交，待平台确认',published:'已发布',review_required:'待核对，请勿重复发布',failed:'失败'};for(const t of targets){const item=el('article');item.append(el('strong',`${t.label} · ${labels[t.status]||t.status}`));if(t.error)item.append(el('p',t.error));if(t.result){const r=JSON.parse(t.result);if(r.url&&/^https:\/\/(www\.)?(facebook|instagram)\.com\//.test(r.url)){const link=el('a','查看平台帖子');link.href=r.url;link.target='_blank';link.rel='noopener noreferrer';item.append(link);}}$('results').append(item);}}
async function upload(file){if(cachedUploads.has(file))return cachedUploads.get(file);notice(`正在上传 ${file.name}…`);const {id}=await api('upload',{method:'POST',headers:{'Content-Type':'video/mp4'},body:file});cachedUploads.set(file,id);return id;}
$('loginForm').onsubmit=async e=>{e.preventDefault();try{const f=new FormData(e.target);await post('login',{email:f.get('email'),password:f.get('password')});e.target.reset();notice('');await refresh();}catch(e){notice(e.message);}};
$('publishForm').oninput=()=>{requestKey=null;};
$('publishForm').onsubmit=async e=>{e.preventDefault();$('publishButton').disabled=true;try{
  const accounts=[...document.querySelectorAll('#accounts input:checked')].map(n=>n.value);if(!accounts.length)throw new Error('请先选择账号');
  const en=$('enVideo').files[0],zh=$('zhVideo').files[0];if(zh&&!$('zhTitle').value.trim())throw new Error('请填写中文版标题');
  const variants={en:{assetId:await upload(en),title:$('enTitle').value,description:$('enDescription').value}};if(zh)variants.zh={assetId:await upload(zh),title:$('zhTitle').value,description:$('zhDescription').value};variants.default=variants.en;
  requestKey ||= crypto.randomUUID();await post('jobs',{key:requestKey,accounts,variants,confirmPublic:$('confirm').checked});notice('任务已加入队列。请刷新查看各平台结果。');await results();
}catch(e){notice(e.message);}finally{$('publishButton').disabled=false;}};
$('refresh').onclick=()=>refresh().catch(e=>notice(e.message));$('logout').onclick=async()=>{await post('logout',{});location.reload();};
refresh().catch(e=>{
  if(e.message==='Sign in first')return;
  notice('工作台页面已上线，发布服务尚未连接。当前可浏览平台和流程，暂不能上传或发布。');
  $('login').hidden=true;$('workspace').hidden=false;
  const names=['Facebook','Instagram','TikTok','YouTube','抖音','小红书','B站','视频号 / WeChat Channels','快手','微博','百家号','支付宝生活号','虎扑','X / Twitter'];
  $('platforms').replaceChildren();for(const name of names){const card=el('div');card.className='platform';card.append(el('b',name));const button=el('button',name==='X / Twitter'?'暂未支持':'尚未配置');button.disabled=true;card.append(button);$('platforms').append(card);}
  for(const field of document.querySelectorAll('#publishForm input,#publishForm textarea,#publishForm button'))field.disabled=true;
  $('logout').hidden=true;$('refresh').hidden=true;$('results').append(el('p','发布服务连接后，将在这里显示真实发布记录。'));
});
