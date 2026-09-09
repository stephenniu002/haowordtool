import { readFileSync,writeFileSync } from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const write=(p,v)=>writeFileSync(p,v,'utf8');
let templates=read('templates.html');
templates=templates.replace('href="mailto:love6598878593@gmail.com?subject=Custom%20website%20quote&amp;body=Business%20type%3A%0APages%20needed%3A%0ADeadline%3A%0ABudget%3A"','href="/custom-web-design.html"');
if(!templates.includes('href="/custom-web-design.html">Custom service</a>')) templates=templates.replace('<a href="/contact.html">Contact</a>','<a href="/custom-web-design.html">Custom service</a><a href="/contact.html">Contact</a>');
write('templates.html',templates);
for(const path of ['index.html','app-builder.html','en/index.html']){
  let html=read(path);
  if(!html.includes('data-service-nav')) html=html.replace('<a href="/templates.html" data-store-nav>',`<a href="/custom-web-design.html" data-service-nav>${path==='en/index.html'?'Custom service':'定制网站'}</a><a href="/templates.html" data-store-nav>`);
  write(path,html);
}
console.log('Connected the custom website service from the store and app workspaces.');
