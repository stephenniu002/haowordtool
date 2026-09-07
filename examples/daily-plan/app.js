const list=document.getElementById('tasks'),form=document.getElementById('task-form'),input=document.getElementById('task-input');
function update(){const tasks=list.querySelectorAll('input[type=checkbox]');document.getElementById('count').textContent=[...tasks].filter(t=>t.checked).length+' / '+tasks.length;}
list.addEventListener('change',update);
form.addEventListener('submit',event=>{event.preventDefault();const text=input.value.trim();if(!text)return;const li=document.createElement('li'),label=document.createElement('label'),check=document.createElement('input'),span=document.createElement('span');check.type='checkbox';span.textContent=text;label.append(check,span);li.append(label);list.append(li);input.value='';input.focus();update();});
update();
