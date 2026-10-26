#!/usr/bin/env node
/**
 * fix-adsense-blockers.mjs —— 按 readiness 报出的致命项做确定性修复
 * ---------------------------------------------------------------
 * 只改三样东西，都是「删除虚假信号 / 补合规声明」方向，不改正文事实：
 *
 *   1. noindex 掉不该被索引的页面
 *      blog 索引页（正文 71-79 词）、es/fr 的 affiliate-marketing 门页、
 *      reviews.html（模板化联盟聚合页，未实测却打过分）。
 *
 *   2. 给有联盟链接但没有披露入口的页面补一条披露
 *      Google 与 FTC 都要求「有佣金关系就必须在用户看到链接前披露」。
 *
 *   3. reviews.html 去掉编造评分 + 去掉「草稿/未发布」自我标注
 *      原页一边写 "Editorial draft · Not a published test"、
 *      "have not been verified through independent product testing"，
 *      一边在源码里挂着 8.9/10、9.5/10 一堆分数。这是 Google 明确打击的
 *      「虚假评测」。分数整块删掉，改成如实的编制方法说明。
 *
 * 用法：
 *   node scripts/fix-adsense-blockers.mjs            # dry-run
 *   node scripts/fix-adsense-blockers.mjs --write    # 落盘
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const SITE = 'https://haowordtool.com';

const report = { noindex: [], disclosure: [], reviews: [] };

/** 把 head 里的 robots 换成 noindex，保留原有其他指令 */
function setNoindex(html, reason) {
  if (/<meta\b[^>]*name=["']robots["'][^>]*>/i.test(html)) {
    return html.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/i, '<meta name="robots" content="noindex,follow">');
  }
  return html.replace(/<\/head>/i, `<meta name="robots" content="noindex,follow"><!-- ${reason} --></head>`);
}

/** 站点级披露条：放在 body 开头，保证用户在看链接之前先看到 */
const DISCLOSURE_BAR = `<div class="affiliate-disclosure" style="max-width:1200px;margin:0 auto;padding:12px 20px;font-size:13px;line-height:1.6;color:#5a5a5a;border-bottom:1px solid #e2e2e2"><strong>披露：</strong>本页部分链接为推广链接，你通过它们下单我们可能获得佣金，价格不受影响。<a href="/services/disclosure.html">佣金与编辑独立性说明</a> · <a href="/privacy.html">隐私政策</a></div>`;

function addDisclosure(html, force = false) {
  if (!force && /href="[^"]*(disclosure|affiliate-disclosure)/i.test(html)) return html;
  if (force && /class="affiliate-disclosure"/i.test(html)) return html;
  const m = html.match(/<body\b[^>]*>/i);
  if (!m) return html;
  return html.replace(m[0], m[0] + '\n' + DISCLOSURE_BAR);
}

/** 删除一个 class 命中的 div 整块（含嵌套）。用于摘掉评分卡 */
function removeDivByClass(html, cls) {
  const open = new RegExp(`<div\\b[^>]*class=["'][^"']*\\b${cls}\\b[^"']*["'][^>]*>`, 'i');
  let out = html;
  let removed = 0;
  for (;;) {
    const m = open.exec(out);
    if (!m) break;
    let i = m.index + m[0].length;
    let depth = 1;
    while (i < out.length && depth > 0) {
      const nextOpen = out.indexOf('<div', i);
      const nextClose = out.indexOf('</div>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 4;
      } else {
        depth--;
        i = nextClose + 6;
      }
    }
    out = out.slice(0, m.index) + out.slice(i);
    removed++;
  }
  return { html: out, removed };
}

/* ---------- 1. noindex ---------- */
const NOINDEX = [
  ['blog/index.html', '博客索引页正文不足 80 词，且内容已归并到 /ai-tools/'],
  ['en/blog/index.html', '英文博客索引页正文不足 80 词，内容已归并到 /ai-tools/'],
  ['es/affiliate-marketing.html', '门页：把用户导向英文版，无独立价值'],
  ['fr/affiliate-marketing.html', '门页：把用户导向英文版，无独立价值'],
  ['reviews.html', '模板化联盟聚合页，未做实测，不适合作为审核期的索引内容'],
  ['es/index.html', '西语首页仅 126 词，是目录壳不是本地化内容，等真正本地化后再放开'],
  ['fr/index.html', '法语首页仅 121 词，是目录壳不是本地化内容，等真正本地化后再放开'],
];

for (const [rel, reason] of NOINDEX) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) continue;
  const before = fs.readFileSync(p, 'utf8');
  const after = setNoindex(before, reason);
  if (after !== before) {
    report.noindex.push(`${rel} — ${reason}`);
    if (WRITE) fs.writeFileSync(p, after, 'utf8');
  }
}

/**
 * 规则型 noindex：guides/ 下带 "Letter Solver Pro" 品牌且不足 400 词的页面。
 * 这批是外部写法搬进来的（品牌都不是本站），2026-10-12 的审计已经点过名，
 * 但一直没处理。留着它们等于把别人的品牌页挂在自家域名下收索引，
 * 是「低价值内容」里最容易举证的一类。
 */
const guidesDir = path.join(ROOT, 'guides');
if (fs.existsSync(guidesDir)) {
  for (const f of fs.readdirSync(guidesDir).filter((x) => x.endsWith('.html'))) {
    const p = path.join(guidesDir, f);
    const html = fs.readFileSync(p, 'utf8');
    if (!/Letter Solver Pro/.test(html)) continue;
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');
    const words = (text.match(/[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9'’-]*/g) || []).length;
    if (words >= 400) continue;
    const after = setNoindex(html, `他站品牌 Letter Solver Pro + 正文 ${words} 词`);
    if (after !== html) {
      report.noindex.push(`guides/${f} — 他站品牌 + ${words} 词`);
      if (WRITE) fs.writeFileSync(p, after, 'utf8');
    }
  }
}

/* ---------- 1b. 重复的联系页：canonical 归并到 /contact.html ---------- */
const contactDup = path.join(ROOT, 'contact/index.html');
if (fs.existsSync(contactDup)) {
  let h = fs.readFileSync(contactDup, 'utf8');
  const before = h;
  // 133 个页面链 /contact.html，只有 9 个链 /contact/，正本选前者
  h = h.replace(/<link\b[^>]*rel=["']canonical["'][^>]*href=["'][^"']*["'][^>]*>/i, '<link rel="canonical" href="https://haowordtool.com/contact.html">');
  if (h !== before) {
    report.reviews.push('contact/index.html canonical 归并到 /contact.html');
    if (WRITE) fs.writeFileSync(contactDup, h, 'utf8');
  }
}

/* ---------- 2. reviews.html 去虚假评分 ---------- */
const reviewsPath = path.join(ROOT, 'reviews.html');
if (fs.existsSync(reviewsPath)) {
  let h = fs.readFileSync(reviewsPath, 'utf8');
  const orig = h;

  const card = removeDivByClass(h, 'score-card');
  h = card.html;
  if (card.removed) report.reviews.push(`删除评分卡 ${card.removed} 块`);

  // 评分制的残余文本（x/10、Illustrative scorecard）
  const beforeSlash = (h.match(/\d(?:\.\d)?\s*\/\s*10\b/g) || []).length;
  h = h.replace(/<span class="score-row">[\s\S]*?<\/span>\s*<\/div>/g, '');
  if (beforeSlash) report.reviews.push(`清理 x/10 计分文本 ${beforeSlash} 处`);

  // 「REVIEW PREVIEW / 草稿 / 未发布」自我标注 → 如实的方法说明
  const swaps = [
    [/<span class="article-kicker">REVIEW PREVIEW<\/span>/g, '<span class="article-kicker">CATEGORY GUIDE</span>'],
    [
      /<p class="article-deck">A draft comparison layout for this category\. The examples below have not been verified through independent product testing\.<\/p>/g,
      '<p class="article-deck">本页按品类整理可选商品与公开参数：规格取自厂商公开页面，使用反馈汇总自买家评价；本站未对这些产品做实验室实测，因此不给出评分。</p>',
    ],
    [
      /<div class="article-byline">HaoWordTool · Editorial draft · Not a published test<\/div>/g,
      '<div class="article-byline">HaoWordTool · 编辑整理 · 未做实验室实测 · <a href="/services/disclosure.html">佣金披露</a></div>',
    ],
  ];
  for (const [re, to] of swaps) {
    const n = (h.match(re) || []).length;
    if (n) {
      h = h.replace(re, to);
      report.reviews.push(`替换草稿标注 ${n} 处`);
    }
  }

  // 标题同步：不再自称 Reviews
  const oldTitle = '<title>HaoWordTool Reviews — Product and AI Guide Previews</title>';
  if (h.includes(oldTitle)) {
    h = h.replace(oldTitle, '<title>品类选购清单 — 公开参数与买家反馈汇总 · HaoWordTool</title>');
    report.reviews.push('标题改为「品类选购清单」');
  }

  // 这一页 120 个链接全是自家 Shopify 商品，披露必须显式出现在正文前，
  // 不能只靠页脚那条指向他页的链接算数。放在变更判断之前，保证可重跑。
  const withBar = addDisclosure(h, true);
  if (withBar !== h) {
    h = withBar;
    report.reviews.push('正文前插入佣金披露条');
  }

  if (h !== orig) {
    if (WRITE) fs.writeFileSync(reviewsPath, h, 'utf8');
  }
}

/* ---------- 3. 联盟披露 ---------- */
const AFFILIATE_RE = /amazon\.[a-z.]+|tag=haowordstudio|bta=1176043|fiverr\.com\/[^"']*bta=/i;
const SKIP = new Set(['.git', 'node_modules', '.github', 'assets', 'scripts', 'data', 'locales', 'tests', 'docs', '.head-backup', '.tmp', 'www', 'android', 'ios', 'build', 'mobile']);
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) files.push(path.relative(ROOT, p).replaceAll('\\', '/'));
  }
})(ROOT);

for (const rel of files) {
  const p = path.join(ROOT, rel);
  const html = fs.readFileSync(p, 'utf8');
  if (!AFFILIATE_RE.test(html)) continue;
  if (/href="[^"]*(disclosure|affiliate-disclosure)/i.test(html)) continue;
  const after = addDisclosure(html);
  if (after !== html) {
    report.disclosure.push(rel);
    if (WRITE) fs.writeFileSync(p, after, 'utf8');
  }
}

/* ---------- 输出 ---------- */
console.log(`\n${WRITE ? '已落盘' : 'dry-run（加 --write 落盘）'}`);
console.log(`\nnoindex  ${report.noindex.length} 个`);
for (const f of report.noindex) console.log(`  ${f}`);
console.log(`\n补披露  ${report.disclosure.length} 个`);
for (const f of report.disclosure) console.log(`  ${f}`);
console.log(`\nreviews.html 处理`);
for (const f of report.reviews) console.log(`  ${f}`);
if (!report.reviews.length) console.log('  （无改动）');
