import {createContactCards} from './video-contact-card.mjs';
import {contacts} from './video-contact-config.mjs';
function render(){
document.querySelector('#contact-support')?.remove();
const number=contacts.whatsapp.replace(/[\s()+-]/g,'');
const whatsapp=/^[1-9]\d{6,14}$/.test(number),wechat=contacts.wechat.trim();
if(whatsapp||wechat||contacts.whatsappQr||contacts.wechatQr){
  const language=document.documentElement.lang.split('-')[0];
  const labels={en:['Contact us','Copy WeChat ID','Copied','Copy unavailable; select the ID above'],fr:['Nous contacter','Copier l’identifiant WeChat','Copié','Sélectionnez l’identifiant ci-dessus'],ja:['お問い合わせ','WeChat ID をコピー','コピーしました','上の ID を選択してください'],es:['Contacto','Copiar ID de WeChat','Copiado','Selecciona el ID de arriba'],zh:['联系我们','复制微信号','已复制','请手动选择上方微信号']}[language]||['Contact us','Copy WeChat ID','Copied','Select the ID above'];
  const section=document.createElement('section');section.id='contact-support';section.setAttribute('aria-label',labels[0]);section.style.cssText='margin:24px auto;padding:24px;max-width:1450px;border:1px solid #425168;border-radius:14px;display:flex;flex-wrap:wrap;gap:18px;align-items:center;background:#141b26;color:#eff2f7';
  const title=document.createElement('h2');title.textContent=labels[0];title.style.cssText='font-size:18px;margin:0';section.append(title);
  if(whatsapp){const a=document.createElement('a');a.href=`https://wa.me/${number}`;a.target='_blank';a.rel='noopener noreferrer';a.textContent=`WhatsApp +${number} ↗`;a.style.color='#c8ff73';section.append(a);}
  if(wechat){const id=document.createElement('span');id.textContent=`WeChat: ${wechat}`;id.style.userSelect='all';const button=document.createElement('button');button.type='button';button.textContent=labels[1];button.style.cssText='padding:10px 14px;border-radius:8px;cursor:pointer';const status=document.createElement('span');status.setAttribute('role','status');button.onclick=async()=>{try{await navigator.clipboard.writeText(wechat);status.textContent=labels[2];}catch{status.textContent=labels[3];}};section.append(id,button,status);}
  createContactCards(section,contacts,language);
  (document.querySelector('main')||document.body).append(section);
}


}
render();document.addEventListener('studio-languagechange',render);
