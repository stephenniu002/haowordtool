#!/usr/bin/env node
/**
 * adsense-readiness.mjs —— AdSense 复审就绪度自查
 * ---------------------------------------------------------------
 * 为什么要有这个脚本：
 *   上一次被拒是「低价值内容」，但拒信不会指到具体页面。人工逐页看 365 个
 *   HTML 不现实，而且改完不知道有没有改干净。所以把拒因翻译成可计算的判据，
 *   每次改完跑一遍，红黄绿一眼看完。
 *
 * 判据来自 Google 官方三类点名违规 + 本次拒信的「低价值内容」：
 *   BLOCKER  会被直接判定违规，留着就别提交
 *     - 编造评分：出现评分制（x/10、ratingValue、星级）但同时自述未经实测
 *     - 门页：meta refresh 跳转，或正文 < 80 词只用来把人推向另一个页面
 *     - 自制 stub：正文里出现「查看英文版」这类导流句
 *     - 联盟页缺披露：有联盟链接但没有披露声明入口
 *   MAJOR    不会单独致命，但堆多了就是「低价值」
 *     - 可索引的薄页（正文低于该页面类型的下限）
 *     - 全站重复标题
 *   MINOR    加分项缺失
 *     - 无 404、无 ads.txt、缺政策页
 *
 * 用法：
 *   node scripts/adsense-readiness.mjs            # 终端汇总
 *   node scripts/adsense-readiness.mjs --out docs/adsense-readiness
 *   node scripts/adsense-readiness.mjs --json     # 只输出 JSON 路径
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = 'https://haowordtool.com';
const OUT = (() => {
  const i = process.argv.indexOf('--out');
  return i > -1 ? process.argv[i + 1] : null;
})();

const SKIP = new Set(['.git', 'node_modules', '.github', 'assets', 'scripts', 'data', 'locales', 'tests', 'docs', '.head-backup', '.tmp', 'www', 'android', 'ios', 'build', 'mobile']);

/** 各语言目录：这些目录下的页面独立判定，不套用主站阈值 */
const LOCALES = ['de', 'es', 'fr', 'ja', 'ko', 'zh'];

/**
 * 页面类型 → 正文字数下限。
 *
 * 工具页按「有没有真功能」判，不按字数。这是被实测打回来两次得出的结论：
 * de/tools/timer.html 只有 66 个词，但带 <button onclick> 和计时逻辑，用户
 * 点下去真的能用；es/tools/reloj-mundial.html 66 词，靠 Intl + setInterval
 * 跑世界时钟。拿 400 词门槛卡这类页面，等于把能用的工具判成空壳。
 *
 * 反过来，工具路径下但没有一个功能信号的，才是真空壳——这时按内容页卡字数。
 */
/**
 * 待 301 的源地址：docs/redirects.csv 里的 from 列。
 * 这些页面 canonical 指向新地址是**有意为之**（软迁移），不属于信号错误，
 * 但也不能算干净——301 一上就该消失。所以单列一档，不混进 MAJOR 里搅浑水。
 */
const redirectSources = new Set();
const csvPath = path.join(ROOT, 'docs/redirects.csv');
if (fs.existsSync(csvPath)) {
  for (const line of fs.readFileSync(csvPath, 'utf8').split('\n').slice(1)) {
    const from = (line.split(',')[0] || '').trim();
    if (!from) continue;
    let p = from.replace(/^https?:\/\/[^/]+/, '');
    if (!p.startsWith('/')) p = '/' + p;
    redirectSources.add(p);
  }
}

function minWords(rel, fnSignals) {
  // 政策页（含子目录写法，比如 contact/index.html）不设字数下限
  if (/(^|\/)(privacy|terms|contact|about|disclaimer|disclosure)(\/index)?\.html$/.test(rel)) return 0;
  const isTool = /(^|\/)tools\/[^/]+\.html$/.test(rel);
  if (isTool && fnSignals >= 2) return 0;
  if (isTool) return 300;
  if (rel.endsWith('index.html') || !rel.includes('/')) return 300;
  return 400;
}

/** 功能信号：和 i18n-gate.mjs 用同一套，保证两个脚本不会互相打架 */
function fnSignals(html) {
  const checks = [
    /<input\b/i,
    /<button\b/i,
    /<textarea\b/i,
    /<select\b/i,
    /<canvas\b/i,
    /onclick=|addEventListener\(/i,
    /oninput=|onchange=/i,
    /setInterval\(|setTimeout\(/i,
    /Intl\./i,
    /fetch\(|XMLHttpRequest/i,
  ];
  let n = 0;
  for (const re of checks) if (re.test(html)) n++;
  return n;
}

const htmlFiles = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) htmlFiles.push(path.relative(ROOT, p).replaceAll('\\', '/'));
  }
}
walk(ROOT);

const ATTR = (tag, name) => (tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i')) || [])[1] || '';
const META = (html) => html.match(/<meta\b[^>]*>/gi) || [];

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(t) {
  const latin = (t.match(/[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9'’-]*/g) || []).length;
  // CJK 按 1.7 字≈1 词折算，跟常见字数统计口径接近
  const cjk = (t.match(/[\u3400-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/g) || []).length;
  return Math.round(latin + cjk / 1.7);
}

const AFFILIATE_RE = /amazon\.[a-z.]+|tag=haowordstudio|fiverr\.com\/[^"']*bta=|bta=1176043|shareasale|impact\.com|cj\.com/i;
const RATING_RE = /(\d(?:\.\d)?)\s*\/\s*10\b|ratingValue|★{3,}|aria-label="[^"]*out of 5/i;
const UNTESTED_RE = /not been verified|not a hands-on|Editorial draft|not independently tested|未实测|未经实测/i;
const DOORWAY_RE = /http-equiv=["']refresh|Redirecting to \/|Open English landing page|查看英文版|このページはメインページと/i;
const DISCLOSURE_RE = /href="[^"]*(disclosure|affiliate-disclosure|advertising|how-we-test)[^"]*"/i;

const pages = [];
const titleMap = new Map();
const aliasPages = new Set();
const blockers = [];
const majors = [];
const minors = [];

for (const rel of htmlFiles) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const text = visibleText(html);
  const words = wordCount(text);

  const metaTags = META(html);
  const robotsTag = metaTags.find((t) => /name=["'](robots|googlebot)["']/i.test(t));
  const robots = ATTR(robotsTag || '', 'content').toLowerCase();
  const indexable = !/noindex|none/.test(robots);

  const canonTag = (html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i) || [''])[0];
  const canonical = ATTR(canonTag, 'href');
  const selfRef = canonical && canonical.replace(/\/$/, '') === `https://haowordtool.com/${rel.replace(/(^|\/)index\.html$/, '$1')}`.replace(/\/$/, '');

  const affiliateLinks = (html.match(new RegExp(AFFILIATE_RE.source, 'gi')) || []).length;
  const rating = RATING_RE.test(html);
  const untested = UNTESTED_RE.test(html);
  const doorway = DOORWAY_RE.test(html);
  const disclosure = DISCLOSURE_RE.test(html);
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1].trim();

  const rec = { rel, words, indexable, selfRef: !!selfRef, affiliateLinks, rating, untested, doorway, disclosure, title };
  pages.push(rec);

  const floor = minWords(rel, fnSignals(html));
  const isToolPage = /(^|\/)tools\/[^/]+\.html$/.test(rel) && fnSignals(html) >= 2;

  // --- BLOCKER ---
  if (rating && untested) {
    blockers.push({ rel, code: 'FAKE_REVIEW', detail: `出现评分制且自述未经实测（${words} 词，${affiliateLinks} 个联盟链接）` });
  }
  if (doorway && indexable) {
    blockers.push({ rel, code: 'DOORWAY', detail: `门页特征且可索引：跳转/导流语句，正文 ${words} 词` });
  } else if (doorway) {
    // 已 noindex 的门页不是当前审核风险，但仍是待清理项（301 到目标页后删除）
    majors.push({ rel, code: 'DOORWAY_NOINDEXED', detail: `门页但已 noindex，正文 ${words} 词，等 301 就绪后删除` });
  }
  if (indexable && words < 80 && !isToolPage) {
    blockers.push({ rel, code: 'STUB', detail: `可索引但正文仅 ${words} 词` });
  }
  if (indexable && affiliateLinks > 0 && !disclosure) {
    blockers.push({ rel, code: 'NO_DISCLOSURE', detail: `${affiliateLinks} 个联盟链接但没有披露声明入口` });
  }

  // --- MAJOR ---
  if (indexable && floor > 0 && words < floor) {
    majors.push({ rel, code: 'THIN', detail: `${words} 词 < ${floor} 词下限` });
  }
  if (indexable && !selfRef) {
    const asPath = '/' + rel.replace(/(^|\/)index\.html$/, '$1');
    const target = (canonical || '').replace(SITE, '').replace(/^\//, '');
    const targetExists =
      !!target && (fs.existsSync(path.join(ROOT, target)) || fs.existsSync(path.join(ROOT, target, 'index.html')));
    if (redirectSources.has(asPath) || redirectSources.has('/' + rel)) {
      minors.push({ rel, code: 'REDIRECT_PENDING', detail: `canonical 指向新地址（软迁移），等 301 配好后本页应消失` });
    } else if (targetExists) {
      // canonical 指向站内一个真实存在的页面：这是有意的去重，不是信号错误
      minors.push({ rel, code: 'CANON_ALIAS', detail: `与 ${canonical} 重复，已用 canonical 归并` });
      aliasPages.add(rel);
    } else {
      majors.push({ rel, code: 'CANON_NOT_SELF', detail: `可索引但 canonical ${canonical || '缺失'}（目标不存在）` });
    }
  }
  if (indexable && title) {
    const asPath = '/' + rel.replace(/(^|\/)index\.html$/, '$1');
    const pendingRedirect = redirectSources.has(asPath) || redirectSources.has('/' + rel);
    if (aliasPages.has(rel) || pendingRedirect) {
      // 别名页 / 待 301 的旧地址与正本同标题是预期的，不按重复报
    } else if (titleMap.has(title)) {
      majors.push({ rel, code: 'DUP_TITLE', detail: `与 ${titleMap.get(title)} 同标题` });
    } else titleMap.set(title, rel);
  }
  // 联盟密度：每 100 词超过 1.5 个联盟链接，属于联盟堆砌
  if (indexable && affiliateLinks >= 10 && words > 0 && affiliateLinks / (words / 100) > 1.5) {
    majors.push({ rel, code: 'AFFILIATE_DENSITY', detail: `${affiliateLinks} 链接 / ${words} 词 = ${(affiliateLinks / (words / 100)).toFixed(1)} 个每百词` });
  }
}

// --- MINOR：站点级 ---
if (!fs.existsSync(path.join(ROOT, '404.html'))) minors.push({ rel: '(site)', code: 'NO_404', detail: '没有自定义 404 页' });
if (!fs.existsSync(path.join(ROOT, 'ads.txt'))) minors.push({ rel: '(site)', code: 'NO_ADS_TXT', detail: '缺 ads.txt' });
for (const p of ['privacy.html', 'terms.html', 'about.html', 'contact.html']) {
  if (!fs.existsSync(path.join(ROOT, p))) minors.push({ rel: '(site)', code: 'NO_POLICY', detail: `缺 ${p}` });
}

// --- 汇总 ---
const indexable = pages.filter((p) => p.indexable);
const byLocale = {};
for (const p of pages) {
  const l = LOCALES.find((x) => p.rel.startsWith(x + '/')) || 'main';
  byLocale[l] ||= { total: 0, indexable: 0, words: 0, thin: 0 };
  byLocale[l].total++;
  if (p.indexable) byLocale[l].indexable++;
  byLocale[l].words += p.words;
}
for (const [l, v] of Object.entries(byLocale)) v.avg = Math.round(v.words / v.total);

/**
 * 结论口径：
 *   BLOCKED  有致命项——留着一定被同样的理由再拒一次
 *   READY    致命项 0，可索引页面里薄页占比 ≤ 10%，且主要项 ≤ 15
 *   RISKY    介于两者之间
 * 用占比而不是绝对条数：审核看的是整体厚度，200 页里 20 个薄页和 40 页里
 * 20 个薄页，观感完全不同。绝对条数会被页面规模稀释。
 */
const thinCount = majors.filter((m) => m.code === 'THIN').length;
const thinRatio = indexable.length ? thinCount / indexable.length : 0;
const verdict = blockers.length ? 'BLOCKED' : thinRatio <= 0.1 && majors.length <= 15 ? 'READY' : 'RISKY';

const lines = [];
const push = (s = '') => lines.push(s);
push('# AdSense 复审就绪度报告');
push();
push(`生成时间：${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`);
push(`扫描页面：${pages.length} 个（可索引 ${indexable.length} 个）`);
push();
push(`## 结论：${verdict}`);
push();
if (verdict === 'BLOCKED') push(`有 **${blockers.length}** 个致命项，改完再提交。`);
else if (verdict === 'RISKY') push(`无致命项，但有 **${majors.length}** 个待处理项，属于「低价值内容」的构成要素，建议先清到 20 以下。`);
else push('致命项与主要项均已清零，可以提交复审。');
push();
push(`| 级别 | 数量 |`);
push(`|---|---|`);
push(`| BLOCKER 致命 | ${blockers.length} |`);
push(`| MAJOR 主要 | ${majors.length} |`);
push(`| MINOR 次要 | ${minors.length} |`);
push();

if (blockers.length) {
  push('## BLOCKER');
  push();
  push('| 页面 | 代码 | 说明 |');
  push('|---|---|---|');
  for (const b of blockers.sort((a, b) => a.rel.localeCompare(b.rel))) push(`| \`${b.rel}\` | ${b.code} | ${b.detail} |`);
  push();
}

if (majors.length) {
  push('## MAJOR');
  push();
  const byCode = {};
  for (const m of majors) (byCode[m.code] ||= []).push(m);
  for (const [code, list] of Object.entries(byCode)) {
    push(`### ${code}（${list.length}）`);
    push();
    push('| 页面 | 说明 |');
    push('|---|---|');
    for (const m of list.slice(0, 40)) push(`| \`${m.rel}\` | ${m.detail} |`);
    if (list.length > 40) push(`| … | 另有 ${list.length - 40} 条 |`);
    push();
  }
}

if (minors.length) {
  push('## MINOR');
  push();
  for (const m of minors) push(`- \`${m.rel}\` ${m.code}：${m.detail}`);
  push();
}

push('## 语言分布');
push();
push('| 目录 | 页面 | 可索引 | 平均词数 |');
push('|---|---|---|---|');
for (const [l, v] of Object.entries(byLocale)) push(`| ${l} | ${v.total} | ${v.indexable} | ${v.avg} |`);
push();

const md = lines.join('\n');

console.log(`\n扫描 ${pages.length} 个页面（可索引 ${indexable.length}）`);
console.log(`BLOCKER ${blockers.length} / MAJOR ${majors.length} / MINOR ${minors.length}`);
console.log(`结论：${verdict}\n`);

if (blockers.length) {
  console.log('致命项：');
  for (const b of blockers.slice(0, 25)) console.log(`  ${b.code.padEnd(15)} ${b.rel}  — ${b.detail}`);
  if (blockers.length > 25) console.log(`  … 另有 ${blockers.length - 25} 条`);
  console.log('');
}
const majorCodes = {};
for (const m of majors) majorCodes[m.code] = (majorCodes[m.code] || 0) + 1;
console.log('主要项构成：');
for (const [k, v] of Object.entries(majorCodes).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(18)} ${v}`);

if (OUT) {
  fs.mkdirSync(path.dirname(path.join(ROOT, OUT)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, OUT + '.md'), md, 'utf8');
  fs.writeFileSync(
    path.join(ROOT, OUT + '.json'),
    JSON.stringify({ generated: new Date().toISOString(), verdict, pages, blockers, majors, minors, byLocale }, null, 2),
    'utf8'
  );
  console.log(`\n已写入 ${OUT}.md / ${OUT}.json`);
}
