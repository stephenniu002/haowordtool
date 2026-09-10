(() => {
  const form=document.getElementById('ai-inquiry');
  const status=document.getElementById('inquiry-status');
  function brief(){
    if(!form.reportValidity())return '';
    const d=new FormData(form);
    return `公司或称呼：${d.get('company')}\n咨询服务：${d.get('service')}\n电脑与业务场景：${d.get('brief')}\n\n请先确认可行性、交付范围、价格与时间。此邮件不是付款或订单承诺。`;
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();const body=brief();if(!body)return;
    location.href=`mailto:love6598878593@gmail.com?subject=${encodeURIComponent('HaoWord 本地 AI 部署咨询')}&body=${encodeURIComponent(body)}`;
    status.textContent='已准备邮件。请在邮件应用中检查并发送；若未打开，请使用“复制需求”。';
  });
  document.getElementById('copy-inquiry').addEventListener('click',async()=>{
    const body=brief();if(!body)return;
    try{await navigator.clipboard.writeText(body);status.textContent='需求已复制，请发送至 love6598878593@gmail.com。';}
    catch{status.textContent='无法访问剪贴板，请手动复制：\n'+body;}
  });
})();
