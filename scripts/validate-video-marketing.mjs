import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const draft=JSON.parse(await readFile('marketing/google-ads-draft.json','utf8'));
assert.equal(draft.dailyBudget,null);assert.equal(draft.launchAuthorized,false);
const units=s=>[...s].reduce((n,c)=>n+(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\uFF00-\uFFEF]/u.test(c)?2:1),0);
for(const group of draft.groups){
  assert.ok(group.headlines.length>=3&&group.headlines.length<=15);
  for(const headline of group.headlines)assert.ok(units(headline)<=30,`${group.language} headline: ${headline} (${units(headline)})`);
  for(const description of group.descriptions)assert.ok(units(description)<=90,`${group.language} description: ${description} (${units(description)})`);
}
for(const lang of ['en','ja','fr','es']){
  const html=await readFile(`video-studio/${lang}/index.html`,'utf8');
  assert.ok(html.includes(`<html lang="${lang}"`));
  assert.equal([...html.matchAll(/hreflang="x-default"/g)].length,1);
  assert.ok(html.includes(`rel="canonical" href="https://haowordtool.com/video-studio/${lang}/"`));
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema['@graph'][1].mainEntity.length,3);
}
console.log('Four language ad groups fit Google text limits; localized SEO pages and structured data validated. No paid campaign launched.');
