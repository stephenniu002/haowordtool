import { readFileSync, writeFileSync } from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const write=(path,value)=>writeFileSync(path,value,'utf8');
const url='/en/ielts/academic-writing-task-2-plan.html';

let course=read('ielts-course.html');
if(!course.includes(`href="${url}"`)){
  const sample='<section class="lesson-download"><p class="eyebrow">FREE SAMPLE LESSON</p><h2>Plan an IELTS Academic Writing Task 2 essay</h2><p>Complete an original opinion-question exercise, build two focused body paragraphs and check the plan before writing.</p><a class="button primary" href="/en/ielts/academic-writing-task-2-plan.html">Start the free lesson</a></section>';
  course=course.replace('<section><h2>How buying and delivery work</h2>',sample+'<section><h2>How buying and delivery work</h2>');
  write('ielts-course.html',course);
}

let tutorials=read('en/learn/index.html');
if(!tutorials.includes(`href="${url}"`)){
  const card='<article class="lesson-card"><small>FREE IELTS LESSON</small><h2><a href="/en/ielts/academic-writing-task-2-plan.html">IELTS Academic Writing Task 2 essay planning</a></h2><p>Turn an opinion question into a clear position and two developed body paragraphs.</p></article>';
  tutorials=tutorials.replace('</div><section class="lesson-download"><h2>Use the free working examples</h2>',card+'</div><section class="lesson-download"><h2>Use the free working examples</h2>');
  tutorials=tutorials.replace('Seven focused guides.','Eight focused guides.').replaceAll('Seven hands-on guides','Eight hands-on guides');
  write('en/learn/index.html',tutorials);
}
tutorials=read('en/learn/index.html').replaceAll('Seven hands-on guides','Eight hands-on guides');
write('en/learn/index.html',tutorials);

let sitemap=read('sitemap.xml');
if(!sitemap.includes(`<loc>https://haowordtool.com${url}</loc>`)){
  sitemap=sitemap.replace('</urlset>',`  <url><loc>https://haowordtool.com${url}</loc><lastmod>2026-09-10</lastmod><changefreq>monthly</changefreq><priority>.8</priority></url>\n</urlset>`);
  write('sitemap.xml',sitemap);
}
console.log('Connected the free IELTS lesson to the course, tutorial center and sitemap.');
