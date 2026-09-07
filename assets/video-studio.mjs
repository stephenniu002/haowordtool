import {draftFromText,validateProject,hyperframeHtml,escapeHtml as h} from './video-core.mjs';
import {getLanguage,initI18n} from './video-i18n.mjs?v=studio2';
const $=id=>document.getElementById(id);
if(new URLSearchParams(location.search).get('native')==='1'){
  $('plans').hidden=true;$('apps').hidden=true;
  document.querySelectorAll('a[href="#plans"],a[href="#apps"]').forEach(a=>a.hidden=true);
}
let project=null,user=null,config=null,current=0,playing=false,clock=0,playStarted=0,tick=0;
let pollTimer,messageTimer;
const apiBase=()=>String(window.HAOWORD_VIDEO_API||'').replace(/\/$/,'');
const notify=text=>{clearTimeout(messageTimer);$('message').textContent=text;messageTimer=setTimeout(()=>$('message').textContent='',7000);};
async function api(path,options={}){
  const r=await fetch(`${apiBase()}/api/video${path}`,{...options,credentials:'include',headers:{'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(path==='/storyboard'?70000:30000)});
  if(!r.headers.get('Content-Type')?.includes('application/json'))throw new Error('制作服务尚未连接，当前可拆分脚本和导出分镜工程');
  const data=await r.json();if(!r.ok)throw new Error(data.error||'请求未完成');return data;
}
const post=(path,data={})=>api(path,{method:'POST',body:JSON.stringify(data)});
async function action(button,fn){button.disabled=true;try{await fn();}catch(e){notify(e.message||'操作失败');}finally{button.disabled=false;}}
function settings(){return {title:$('title').value.trim(),language:getLanguage(),ratio:$('ratio').value,engine:$('engine').value,captions:$('captions').checked};}
function readProject(){
  if(!project)throw new Error('请先生成分镜');
  const scenes=[...$('scenes').querySelectorAll('.scene-card')].map(el=>({heading:el.querySelector('[data-field=heading]').value,narration:el.querySelector('[data-field=narration]').value,duration:Number(el.querySelector('[data-field=duration]').value)}));
  project=validateProject({...project,...settings(),scenes});return project;
}
function loadProject(p){stop();project=p;current=0;clock=0;$('title').value=p.title;$('ratio').value=p.ratio;$('engine').value=p.engine;
  $('preview-heading').dataset.noI18n='';$('preview-narration').dataset.noI18n='';
  $('scenes').innerHTML=p.scenes.map((s,i)=>`<article class="scene-card${i===0?' active':''}" data-index="${i}"><div class="scene-top"><button class="text-button" data-select="${i}">镜头 ${String(i+1).padStart(2,'0')} · 预览 ↗</button><span>${i===0?'开场':i===p.scenes.length-1?'收尾':'展开'}</span></div><label>画面标题<input data-field="heading" maxlength="60" value="${h(s.heading)}"></label><label>旁白<textarea data-field="narration" maxlength="300" rows="2">${h(s.narration)}</textarea></label><label>计划时长（秒）<input class="duration" data-field="duration" type="number" min="2" max="30" step="1" value="${s.duration}"></label></article>`).join('');
  $('scene-count').textContent=`${p.scenes.length} 个镜头`;preview();
}
const stamp=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s)%60).padStart(2,'0')}`;
function preview(){if(!project)return;const s=project.scenes[current],total=project.scenes.reduce((n,s)=>n+s.duration,0);$('preview-heading').textContent=s.heading;$('preview-narration').textContent=s.narration;$('preview-number').textContent=`${String(current+1).padStart(2,'0')} / ${String(project.scenes.length).padStart(2,'0')}`;
  const ratio=project.ratio;$('preview').style.aspectRatio=ratio.replace(':','/');$('preview').style.width=ratio==='9:16'?'min(100%,252px)':'100%';$('preview-heading').style.fontSize=ratio==='9:16'?'28px':'24px';
  $('time').textContent=`${stamp(clock)} / ${stamp(total)}`;$('timeline-fill').style.width=`${Math.min(100,clock/total*100)}%`;
  $('scenes').querySelectorAll('.scene-card').forEach((el,i)=>el.classList.toggle('active',i===current));
}
function stop(){playing=false;cancelAnimationFrame(tick);$('play').textContent='▶';$('play').setAttribute('aria-label','播放分镜预览');}
function animate(){if(!playing)return;clock=(performance.now()-playStarted)/1000;const total=project.scenes.reduce((n,s)=>n+s.duration,0);if(clock>=total){clock=total;preview();stop();return;}let at=0;current=project.scenes.findIndex(s=>{at+=s.duration;return clock<at;});preview();tick=requestAnimationFrame(animate);}
function download(name,body,type){const url=URL.createObjectURL(new Blob([body],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function refreshUser(u){user=u;const active=!!u?.active;const native=new URLSearchParams(location.search).get('native')==='1';$('apps').hidden=!active||native;for(const kind of ['android','ios']){const a=$(kind+'-link');const ready=active&&config?.downloads?.[kind];if(ready){a.href=apiBase()+'/api/video/apps/'+kind;a.querySelector('small').textContent=({en:'Download purchased app',ja:'購入済みアプリをダウンロード',fr:'Télécharger l’application achetée',es:'Descargar la aplicación comprada'})[getLanguage()]||'下载已购 App';}else a.removeAttribute('href');a.setAttribute('aria-disabled',String(!ready));} $('account-button').textContent=u?`${u.email.split('@')[0]} · 退出`:'登录 / 注册';$('membership').textContent=u?(u.active?`订阅有效至 ${new Date(u.expires).toLocaleString(getLanguage())}`:'尚未开通 / 订阅已到期'):'尚未登录';}
function requireUser(){if(!config)throw new Error('制作服务尚未连接，请先使用免费分镜工具');if(!user){$('auth-dialog').showModal();throw new Error('请先登录账号');}}
$('prompt').addEventListener('input',()=>$('char-count').textContent=`${$('prompt').value.length} / 1800`);
const examples={
  'zh-CN':['从想法到视频','一个想法，如何变成一条视频？先把故事拆成清晰的分镜。给每个镜头配上自然的旁白。再让字幕跟随声音，重点一眼可见。选择竖屏或横屏，导出你的第一条视频。'],
  en:['From idea to video','How does an idea become a video? Start with a clear storyboard. Give each scene a natural voice. Let captions follow the narration. Choose your format and export your first video.'],
  ja:['アイデアから動画へ','ひとつのアイデアが、どう動画になるのでしょうか？まず物語をシーンに分けます。それぞれに自然なナレーションを付けます。声に合わせて字幕を表示します。画面比率を選んで、最初の動画を書き出しましょう。'],
  fr:['D’une idée à une vidéo','Comment une idée devient-elle une vidéo ? Commencez par un storyboard clair. Ajoutez une voix naturelle à chaque scène. Synchronisez les sous-titres avec la narration. Choisissez le format et exportez votre vidéo.'],
  es:['De una idea a un vídeo','¿Cómo se convierte una idea en vídeo? Empieza con un storyboard claro. Añade una voz natural a cada escena. Sincroniza los subtítulos con la narración. Elige el formato y exporta tu primer vídeo.']
};
$('example').onclick=()=>{const [title,text]=examples[getLanguage()];$('prompt').value=text;$('title').value=title;$('prompt').dispatchEvent(new Event('input'));loadProject(draftFromText(text,settings()));};
$('split').onclick=()=>{try{loadProject(draftFromText($('prompt').value,settings()));notify('分镜已拆分，可逐个修改标题、旁白和时长。');}catch(e){notify(e.message);}};
$('ai').onclick=()=>action($('ai'),async()=>{requireUser();if(!config.ai)throw new Error('AI 起稿尚未开通，可以先粘贴口播稿拆分');const result=await post('/storyboard',{prompt:$('prompt').value,...settings()});loadProject(result.project);notify('AI 分镜已生成，请核对内容后制作。');});
$('scenes').addEventListener('click',e=>{const btn=e.target.closest('[data-select]');if(!btn)return;try{readProject();stop();current=Number(btn.dataset.select);clock=project.scenes.slice(0,current).reduce((n,s)=>n+s.duration,0);preview();}catch(e){notify(e.message);}});
$('scenes').addEventListener('change',()=>{try{stop();readProject();preview();}catch(e){notify(e.message);}});
for(const id of ['ratio','engine','captions'])$(id).addEventListener('change',()=>{if(project){try{stop();readProject();preview();}catch(e){notify(e.message);}}});
$('play').onclick=()=>{if(playing){stop();return;}try{readProject();const total=project.scenes.reduce((n,s)=>n+s.duration,0);if(clock>=total)clock=0;playing=true;playStarted=performance.now()-clock*1000;$('play').textContent='Ⅱ';$('play').setAttribute('aria-label','暂停预览');animate();}catch(e){notify(e.message);}};
$('export-json').onclick=()=>{try{download('haoword-storyboard.json',JSON.stringify(readProject(),null,2),'application/json');}catch(e){notify(e.message);}};
$('export-html').onclick=()=>{try{download('index.html',hyperframeHtml(readProject()),'text/html');notify('已导出无声 HTML 分镜工程，可用 HyperFrames CLI 继续制作。');}catch(e){notify(e.message);}};
$('account-button').onclick=()=>action($('account-button'),async()=>{if(user){await post('/logout');refreshUser(null);clearTimeout(pollTimer);$('jobs').textContent='登录后查看制作任务。';$('orders').textContent='登录后查看订单。';}else $('auth-dialog').showModal();});
document.querySelectorAll('.close-dialog').forEach(el=>el.onclick=()=>el.closest('dialog').close());
$('auth-form').onsubmit=async e=>{e.preventDefault();const button=e.submitter;button.disabled=true;$('auth-error').textContent='';try{const r=await post(`/${button.value}`,{email:$('email').value,password:$('password').value});$('password').value='';refreshUser(r.user);$('auth-dialog').close();await Promise.all([refreshJobs(),refreshOrders()]);}catch(e){$('auth-error').textContent=e.message;}finally{button.disabled=false;}};
$('render').onclick=()=>action($('render'),async()=>{const p=readProject();requireUser();if(!config.render)throw new Error('配音与渲染尚未开通，当前可先下载分镜工程');await post('/jobs',{project:p});notify('已加入制作队列，成片完成后可下载。');await refreshJobs();});
const statusName={queued:'等待制作',running:'制作中',done:'已完成',failed:'未完成',creating:'创建中',pending:'待付款',review:'待审核',paid:'已开通'};
async function refreshJobs(){clearTimeout(pollTimer);if(!user)return;const {jobs}=await api('/jobs');$('jobs').innerHTML=jobs.length?jobs.map(j=>{const p=JSON.parse(j.project);return `<div class="job"><div><p>${h(p.title)}</p><small>${h(j.id.slice(0,8))} · ${h(new Date(j.created).toLocaleString(getLanguage()))}</small>${j.error?`<p class="error">${h(j.error)}</p>`:''}</div><div><span>${statusName[j.status]||h(j.status)} ${j.status==='running'?`${j.progress}%`:''}</span>${j.status==='done'?`<button class="text-button" data-download="${j.id}/video">MP4 ↓</button>　<button class="text-button" data-download="${j.id}/captions">SRT ↓</button>`:`<progress value="${j.progress}" max="100" aria-label="制作进度"></progress>`}</div></div>`;}).join(''):'<p class="muted">还没有制作任务。完成分镜后，点击“开始制作视频”。</p>';
  if(jobs.some(j=>['running','queued'].includes(j.status)))pollTimer=setTimeout(()=>refreshJobs().catch(e=>notify(e.message)),5000);
}
$('jobs').onclick=e=>{const button=e.target.closest('[data-download]');if(!button)return;action(button,async()=>{const r=await fetch(`${apiBase()}/api/video/jobs/${button.dataset.download}`,{credentials:'include'});if(!r.ok)throw new Error('下载未完成，请刷新任务状态');const blob=await r.blob();download(button.dataset.download.endsWith('video')?'haoword-video.mp4':'haoword-captions.srt',blob,blob.type);});};
$('refresh-jobs').onclick=()=>action($('refresh-jobs'),refreshJobs);
async function refreshOrders(){if(!user)return;const {orders}=await api('/orders');$('orders').innerHTML=orders.length?orders.map(o=>`<div class="order-row"><div><p>${({alipay:'支付宝',wechat:'微信',usdt:'USDT'})[o.method]} · ${o.currency==='USDT'?`${o.amount/1000000} USDT`:`${(o.amount/100).toFixed(2)} CNY`}</p><small>${h(o.id)} · ${h(new Date(o.created).toLocaleDateString(getLanguage()))}</small></div><button class="text-button" data-order="${o.id}">${statusName[o.status]||h(o.status)} →</button></div>`).join(''):'<p class="muted">暂无订单。选择已开通的支付渠道购买 30 天订阅。</p>';}
function showOrder(order){const details=JSON.parse(order.details);$('payment-content').innerHTML=`<p class="muted">订单 ${h(order.id)}</p><p>状态：<strong>${statusName[order.status]||h(order.status)}</strong></p>${order.status==='paid'?'<p>订阅已开通。返回工作台开始制作。</p>':order.method==='usdt'?`<p>支付 <strong>${h(String(order.amount/1000000))} USDT</strong> · 网络 <strong>${h(details.network||'')}</strong></p><p class="address">${h(details.address||'')}</p><p class="hint">只使用上方网络。付款后提交哈希，人工核实金额、地址和确认数后开通；提交哈希本身不会开通订阅。</p><form id="proof-form"><label for="tx-hash">交易哈希</label><input id="tx-hash" required pattern="(0x)?[a-fA-F0-9]{64}" value="${h(order.proof||'')}" autocomplete="off"><button class="button primary full" style="margin-top:16px">提交到账审核</button></form>`:`<p>支付金额：<strong>¥ ${(order.amount/100).toFixed(2)}</strong></p>${details.qrImage?`<img class="payment-qr" src="${h(details.qrImage)}" alt="订单付款二维码">`:'<p>该订单未生成付款码，请新建订单。</p>'}<p class="hint">请用${order.method==='wechat'?'微信':'支付宝'}扫描支付。完成后核实到账。</p>`}<button id="check-payment" class="button secondary full" style="margin-top:16px">刷新并核实订单</button><p id="payment-error" class="error" role="alert"></p>`;
  if(!$('payment-dialog').open)$('payment-dialog').showModal();
  const proof=$('proof-form');if(proof)proof.onsubmit=async e=>{e.preventDefault();await action(proof.querySelector('button'),async()=>{const r=await post(`/orders/${order.id}/proof`,{hash:$('tx-hash').value.trim()});showOrder(r.order);await refreshOrders();});};
  $('check-payment').onclick=()=>action($('check-payment'),async()=>{try{const r=await post(`/orders/${order.id}/check`);refreshUser(r.user);showOrder(r.order);await refreshOrders();}catch(e){$('payment-error').textContent=e.message;}});
}
document.querySelectorAll('[data-pay]').forEach(b=>b.onclick=()=>action(b,async()=>{requireUser();const {order}=await post('/orders',{method:b.dataset.pay});showOrder(order);await refreshOrders();}));
$('orders').onclick=e=>{const b=e.target.closest('[data-order]');if(b)action(b,async()=>showOrder((await api(`/orders/${b.dataset.order}`)).order));};
$('refresh-orders').onclick=()=>action($('refresh-orders'),refreshOrders);
async function init(){
  try{config=await api('/config');$('connection').textContent=config.render?'制作服务已连接 · 完成分镜后可提交配音和渲染':'编辑模式 · 配音 / 渲染服务尚未开通，可免费拆分脚本、编辑和下载分镜工程';
    document.querySelectorAll('[data-pay]').forEach(b=>b.disabled=!config.payments[b.dataset.pay]);
    if(config.cnyFen)$('cny-price').textContent=`支付宝 / 微信：¥ ${(config.cnyFen/100).toFixed(2)} / 30 天（运营方设定）`;
    try{refreshUser((await api('/me')).user);await Promise.all([refreshJobs(),refreshOrders()]);}catch{refreshUser(null);}
  }catch{$('connection').textContent='免费分镜工具可用 · 制作服务尚未连接，AI 起稿、账号、配音、付款和成片下载暂不可用';}
}
$('import-storyboard').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>100000)throw new Error('分镜文件不能超过 100 KB');const parsed=JSON.parse(await file.text());loadProject(validateProject(parsed));notify('分镜已导入，可继续编辑。');}catch(err){notify(err.message||'分镜文件格式不正确');}finally{e.target.value='';}};
initI18n();
init();
