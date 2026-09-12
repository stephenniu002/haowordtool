import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Keep the working publisher entry when the marketing site is regenerated.
const publisherPage = path.join(root, 'social-publisher.html');
if (fs.existsSync(publisherPage)) {
  let product = fs.readFileSync(publisherPage, 'utf8');
  const workspace = '<section data-publisher-workspace><h2>Open the publishing workspace</h2><p>Connect Facebook Pages, Instagram professional accounts and configured browser-based platforms. First-time use requires the publishing service to be deployed and accounts to be authorized.</p><a class="button primary" href="/publisher.html">Open publishing workspace →</a></section>';
  product = product.includes('data-publisher-workspace')
    ? product.replace(/<section data-publisher-workspace>[\s\S]*?<\/section>/, workspace)
    : product.replace('</main>', `${workspace}</main>`);
  fs.writeFileSync(publisherPage, product);
}
function i18nSpan(zh, en, english) {
  return `<span data-no-i18n data-zh="${zh}" data-en="${en}">${english ? en : zh}</span>`;
}
function socialNav(english) {
  return i18nSpan('多平台发布', 'Social Publisher', english);
}
function socialCard(english) {
  return `<section id="social-publisher-offer" class="lesson-download" style="margin:32px 0"><p class="eyebrow">CREATOR TOOLS</p><h2>${i18nSpan('多平台内容发布工具', 'Publish across your social channels.', english)}</h2><p>${i18nSpan('国内抖音、TikTok（国际平台）、小红书、B站、YouTube 等平台的安装配置服务。先评估账号与平台可用性，再确认价格和交付范围。服务套餐：每月 25 美元，或每年 299 美元。', 'Request setup of social-auto-upload for Douyin, TikTok, Xiaohongshu, Bilibili, YouTube and more. Platform availability is assessed before payment. Service plans: US$25 per month or US$299 per year.', english)}</p><a class="button primary" href="/social-publisher.html">${i18nSpan('查看产品与咨询配置 →', 'Explore Social Publisher →', english)}</a></section>`;
}
for (const file of ['index.html', 'en/index.html', 'pricing.html', 'templates.html']) {
  const location = path.join(root, file);
  if (!fs.existsSync(location)) continue;
  let html = fs.readFileSync(location, 'utf8');
  const english = /<html\s+lang="en"/.test(html);
  html = html.replace(
    /<a href="\/social-publisher\.html" data-social-publisher-nav>[\s\S]*?<\/a>/,
    `<a href="/social-publisher.html" data-social-publisher-nav>${socialNav(english)}</a>`
  );
  if (!html.includes('data-social-publisher-nav')) {
    html = html.replace('</nav></header>', `<a href="/social-publisher.html" data-social-publisher-nav>${socialNav(english)}</a></nav></header>`);
  }
  {
    html = html.replace(/<section id="social-publisher-offer"[\s\S]*?<\/section>/, '');
    if (file === 'en/index.html' || file === 'index.html') {
      html = html.replace('<div class="intro">', `${socialCard(english)}<div class="intro">`);
    } else html = html.replace('</main>', `${socialCard(english)}</main>`);
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
