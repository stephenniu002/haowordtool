// Public presentation only. Never enable checkout from a browser-side flag.
const language=document.documentElement.lang.split('-')[0];
const copy={
zh:['计划开通的支付方式','暂未开通','银行卡','支付宝','微信支付','银行卡、Apple Pay、Google Pay 拟通过 Stripe 接入；钱包可用性取决于地区和设备。','支付服务尚未接通，当前无法付款，也不会自动扣款。USDT 收款网络和法币价格将在付款前明确显示。'],
en:['Planned payment methods','Not available yet','Bank card','Alipay','WeChat Pay','Cards, Apple Pay and Google Pay are planned via Stripe; wallet availability depends on region and device.','Checkout is not connected. No payment or automatic charge is available. The USDT network and fiat price will be shown before payment.'],
ja:['対応予定のお支払い方法','準備中','クレジット・デビットカード','Alipay','WeChat Pay','カード、Apple Pay、Google Pay は Stripe 経由を予定しています。利用可否は地域と端末によって異なります。','決済は未接続です。現在は支払いも自動請求も行われません。USDT のネットワークと法定通貨の金額は支払い前に表示します。'],
fr:['Moyens de paiement prévus','Bientôt disponible','Carte bancaire','Alipay','WeChat Pay','Cartes, Apple Pay et Google Pay sont prévus via Stripe, selon le pays et l’appareil.','Le paiement n’est pas connecté. Aucun paiement ni débit automatique n’est possible. Le réseau USDT et le prix en monnaie locale seront indiqués avant paiement.'],
es:['Métodos de pago previstos','Aún no disponible','Tarjeta bancaria','Alipay','WeChat Pay','Tarjetas, Apple Pay y Google Pay se prevén mediante Stripe, según el país y el dispositivo.','El pago aún no está conectado. No se realizan pagos ni cargos automáticos. La red USDT y el precio en moneda local se indicarán antes de pagar.']
}[language]||null;
const t=copy||['Planned payment methods','Not available yet','Bank card','Alipay','WeChat Pay','Cards and wallets planned via Stripe.','Checkout is not connected.'];
const host=document.querySelector('#plans,#subscription');
if(host){
const section=document.createElement('section');section.className='payment-options';section.setAttribute('aria-label',t[0]);section.setAttribute('data-no-i18n','');
const title=document.createElement('h3');title.textContent=t[0];section.append(title);
const list=document.createElement('ul');list.className='payment-options-grid';
for(const name of [t[2],t[3],t[4],'USDT','Apple Pay','Google Pay']){const item=document.createElement('li');const label=document.createElement('strong');label.textContent=name;const status=document.createElement('span');status.textContent=t[1];item.append(label,status);list.append(item);}section.append(list);
for(const text of [t[5],t[6]]){const p=document.createElement('p');p.textContent=text;section.append(p);}
host.after(section);
}
