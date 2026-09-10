import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
fs.copyFileSync(path.join(root,'scripts/templates/local-ai.template'),path.join(root,'local-ai.html'));
for(const name of ['index.html','app-builder.html','pricing.html']){
 const file=path.join(root,name);let html=fs.readFileSync(file,'utf8');
 if(!html.includes('href="/local-ai.html"'))html=html.replace('</nav>','<a href="/local-ai.html"><span data-no-i18n data-zh="企业本地 AI" data-en="Local AI for business">企业本地 AI</span></a></nav>');
 fs.writeFileSync(file,html);
}
const sitemap=path.join(root,'sitemap.xml');let xml=fs.readFileSync(sitemap,'utf8');
if(!xml.includes('https://haowordtool.com/local-ai.html'))xml=xml.replace('</urlset>','<url><loc>https://haowordtool.com/local-ai.html</loc><lastmod>2026-09-10</lastmod></url></urlset>');
fs.writeFileSync(sitemap,xml);
console.log('Built local AI service page and navigation.');
