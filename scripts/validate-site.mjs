import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=[];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['.git','node_modules','data','www','android','ios','build'].includes(e.name))continue;const p=path.join(d,e.name);e.isDirectory()?walk(p):e.name.endsWith('.html')&&files.push(p)}}walk(root);
const errors=[];const titles=new Map();let words=0;for(const f of files){const html=fs.readFileSync(f,'utf8');const rel=path.relative(root,f).replaceAll('\\','/');const title=html.match(/<title>(.*?)<\/title>/s)?.[1];if(!title)errors.push(`${rel}: missing title`);else if(titles.has(title))errors.push(`${rel}: duplicate title with ${titles.get(title)}`);else titles.set(title,rel);if(!/meta name="description"/.test(html))errors.push(`${rel}: missing description`);if(/href=["']#["']/.test(html))errors.push(`${rel}: empty hash link`);if(/pub-5075958362002617/.test(html))errors.push(`${rel}: old publisher id`);const text=html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&\w+;/g,' ');const wc=(text.match(/[A-Za-zÀ-ÿ]+/g)||[]).length;words+=wc;if(rel.startsWith('guides/')&&wc<260)errors.push(`${rel}: thin guide (${wc} words)`);for(const m of html.matchAll(/href=["'](\/[A-Za-z0-9_./-]+(?:\.html)?)(?:#[^"']*)?["']/g)){let target=m[1];if(target.endsWith('/'))target+= 'index.html';else if(target==='/')target='/index.html';const abs=path.join(root,target.slice(1));if(!fs.existsSync(abs))errors.push(`${rel}: broken link ${m[1]}`)}}
const sitemapPath=path.join(root,'sitemap.xml');
if(fs.existsSync(sitemapPath)){
  const sitemap=fs.readFileSync(sitemapPath,'utf8');
  const locs=[...sitemap.matchAll(/<loc>https:\/\/haowordtool\.com\/(.*?)<\/loc>/g)].map(m=>m[1]);
  const seen=new Set();
  for(const loc of locs){
    if(seen.has(loc))errors.push(`sitemap.xml: duplicate URL /${loc}`);seen.add(loc);
    const rel=loc===''?'index.html':loc.endsWith('/')?`${loc}index.html`:loc;
    const abs=path.join(root,rel);
    if(!fs.existsSync(abs)){errors.push(`sitemap.xml: missing file for /${loc}`);continue}
    if(/<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(fs.readFileSync(abs,'utf8')))errors.push(`${rel}: sitemap/noindex conflict`);
  }
}
console.log(`${files.length} HTML files; ${words} visible words; ${errors.length} validation errors.`);if(errors.length){console.error(errors.join('\n'));process.exit(1)}
