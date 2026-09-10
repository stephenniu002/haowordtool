import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const file of ['index.html', 'en/index.html', 'pricing.html', 'templates.html']) {
  const location = path.join(root, file);
  if (!fs.existsSync(location)) continue;
  let html = fs.readFileSync(location, 'utf8');
  const english = file === 'en/index.html' || file === 'templates.html';
  if (!html.includes('data-social-publisher-nav')) {
    html = html.replace('</nav></header>', `<a href="/social-publisher.html" data-social-publisher-nav>${english ? 'Social Publisher' : '多平台发布'}</a></nav></header>`);
  }
  {
    html = html.replace(/<section id="social-publisher-offer"[\s\S]*?<\/section>/, '');
    const card = english
      ? '<section id="social-publisher-offer" class="lesson-download" style="margin:32px 0"><p class="eyebrow">CREATOR TOOLS</p><h2>Publish across your social channels.</h2><p>Request setup of social-auto-upload for Douyin, Xiaohongshu, Bilibili, YouTube and more. Platform availability is assessed before payment. Service plans: US$25 per month or US$299 per year.</p><a class="button primary" href="/social-publisher.html">Explore Social Publisher →</a></section>'
      : '<section id="social-publisher-offer" class="lesson-download" style="margin:32px 0"><p class="eyebrow">CREATOR TOOLS</p><h2>多平台内容发布工具</h2><p>抖音、小红书、B站、YouTube 等平台的安装配置服务。先评估账号与平台可用性，再确认价格和交付范围。服务套餐：每月 25 美元，或每年 299 美元。</p><a class="button primary" href="/social-publisher.html">查看产品与咨询配置 →</a></section>';
    if (file === 'en/index.html' || file === 'index.html') {
      html = html.replace('<div class="intro">', `${card}<div class="intro">`);
    } else html = html.replace('</main>', `${card}</main>`);
  }
  fs.writeFileSync(location, html);
}
const sitemapPath = path.join(root, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');
if (!sitemap.includes('https://haowordtool.com/social-publisher.html')) {
  sitemap = sitemap.replace('</urlset>', '<url><loc>https://haowordtool.com/social-publisher.html</loc><lastmod>2026-09-10</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n</urlset>');
  fs.writeFileSync(sitemapPath, sitemap);
}
console.log('Connected Social Publisher to homepages, store, pricing and sitemap.');
