#!/usr/bin/env node
/**
 * build-sitemap.mjs —— 按页面实际状态生成 sitemap
 * ---------------------------------------------------------------
 * 为什么不用手写 sitemap：
 *   实测发现线上 sitemap.xml 里同时存在 /ai-tools.html（已归并到
 *   /shop/services/ai-studio.html）和 /ai-rank/（已归并到 /ai-tools/rank/），
 *   还包含一批已加 noindex 的页面。sitemap 和真实索引状态打架，
 *   等于主动给 Google 递错误信号。
 *
 * 收录规则（三条同时满足才进 sitemap）：
 *   1. 没有 noindex
 *   2. canonical 自指（canonical 指向别处的说明这是副本，不该单独收录）
 *   3. 不在排除清单（流程页、示例页、备份）
 *
 * 输出：
 *   sitemap.xml              主站（非语种目录）
 *   <locale>/sitemap.xml     各语种，有内容才生成
 *   sitemap-index.xml        汇总
 *
 * 用法：
 *   node scripts/build-sitemap.mjs            # 预览统计
 *   node scripts/build-sitemap.mjs --write    # 写文件
 *   node scripts/build-sitemap.mjs --write --list   # 同时列出每条 URL
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = 'https://haowordtool.com';
const LOCALES = ['de', 'es', 'fr', 'ja', 'ko', 'zh'];

const SKIP_DIRS = new Set(['.git', 'node_modules', '.github', 'assets', 'scripts', 'data', 'locales', 'tests', 'docs', '.head-backup', '.tmp']);

/** 这些路径无论 robots 怎么写都不进 sitemap */
const NEVER = [
  /^\/examples\//,
  /^\/checkout\.html$/,
  /^\/order\.html$/,
  /^\/account\.html$/,
  /^\/delivery\.html$/,
  /^\/start\.html$/,
  /^\/affiliate-dashboard\.html$/,
  /^\/share\.html$/,
  /^\/pricing\.html$/,
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(path.join(dir, e.name), out);
    } else if (e.name.endsWith('.html')) out.push(path.join(dir, e.name));
  }
  return out;
}

function urlOf(file) {
  const rel = '/' + path.relative(ROOT, file).split(path.sep).join('/');
  return rel.endsWith('/index.html') ? rel.replace(/index\.html$/, '') : rel;
}

function info(file) {
  const html = fs.readFileSync(file, 'utf8');
  const head = (html.match(/<head\b[\s\S]*?<\/head>/i) || [html])[0];
  const robots = ((head.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '').toLowerCase();
  const canonical = (head.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || [])[1] || null;
  const url = urlOf(file);
  const canonPath = canonical ? canonical.replace(/^https?:\/\/[^/]+/, '') : null;
  const selfRef =
    canonPath !== null &&
    (canonPath === url || canonPath === url + 'index.html' || canonPath.replace(/\/$/, '') === url.replace(/\/$/, ''));
  const lastmod = new Date(fs.statSync(file).mtime).toISOString().slice(0, 10);
  return { url, robots, canonical, selfRef, noindex: /noindex/i.test(robots), lastmod };
}

const files = walk(ROOT);
const buckets = { main: [] };
for (const l of LOCALES) buckets[l] = [];

const stats = { total: files.length, noindex: 0, notSelf: 0, never: 0, included: 0 };

for (const f of files) {
  const url = urlOf(f);
  if (NEVER.some((re) => re.test(url))) { stats.never++; continue; }
  const i = info(f);
  if (i.noindex) { stats.noindex++; continue; }
  if (!i.selfRef) { stats.notSelf++; continue; }

  const seg = url.split('/')[1] || '';
  const bucket = LOCALES.includes(seg) ? seg : 'main';
  buckets[bucket].push(i);
  stats.included++;
}

/**
 * 拼接绝对 URL 必须走这里。
 * 曾经的 bug：直接 ${SITE}${p} 拼接，SITE 结尾无斜杠、p 开头也无斜杠，
 * 生成出 https://haowordtool.comsitemap.xml —— 六条 loc 全废，
 * 线上 sitemap-index 等于指不到任何子 sitemap，189 条 URL 一条都送不到 Google。
 */
function abs(p) {
  return `${SITE}/${String(p).replace(/^\/+/, '')}`;
}

function xml(list) {
  // 不写 lastmod：来源只能是文件 mtime，而 mtime 是 checkout 时间，
  // 每次 CI 检出都变，等于天天告诉 Google「全站都更新了」。宁可省略。
  const rows = list
    .sort((a, b) => a.url.localeCompare(b.url))
    .map((i) => `  <url><loc>${abs(i.url)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

function indexXml(parts) {
  const rows = parts
    .map((p) => `  <sitemap><loc>${abs(p)}</loc></sitemap>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</sitemapindex>\n`;
}

/**
 * 落盘前的硬校验：任何一条 loc 不是 https://haowordtool.com/ 开头的合法 URL，
 * 直接抛错退出。sitemap 出错是静默失败——页面 200，Google 却什么都收不到，
 * 只能靠人肉 curl 才发现，所以必须在生成环节卡死。
 */
function assertLocs(s, label) {
  const locs = [...s.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  if (!locs.length) throw new Error(`${label}: 没有生成任何 <loc>`);
  const bad = locs.filter((u) => {
    if (!u.startsWith(`${SITE}/`)) return true;
    try {
      const url = new URL(u);
      return url.host !== 'haowordtool.com';
    } catch {
      return true;
    }
  });
  if (bad.length) {
    throw new Error(`${label}: ${bad.length} 条 loc 非法，例如 ${bad.slice(0, 3).join(' , ')}`);
  }
  return locs.length;
}

const args = process.argv.slice(2);
const write = args.includes('--write');
const check = args.includes('--check');
const list = args.includes('--list');

console.log('');
console.log(`扫描 ${stats.total} 个页面`);
console.log(`  排除 · noindex      ${stats.noindex}`);
console.log(`  排除 · canonical 非自指 ${stats.notSelf}`);
console.log(`  排除 · 流程/示例页   ${stats.never}`);
console.log(`  收录                ${stats.included}`);
console.log('');

const parts = [];
for (const [k, v] of Object.entries(buckets)) {
  if (!v.length) continue;
  const p = k === 'main' ? 'sitemap.xml' : `${k}/sitemap.xml`;
  parts.push(p);
  console.log(`  ${p.padEnd(24)} ${v.length} 条`);
  if (list) for (const i of v) console.log(`      ${i.url}`);
}

if (write) {
  let total = 0;
  for (const [k, v] of Object.entries(buckets)) {
    if (!v.length) continue;
    const p = k === 'main' ? path.join(ROOT, 'sitemap.xml') : path.join(ROOT, k, 'sitemap.xml');
    const body = xml(v);
    total += assertLocs(body, path.relative(ROOT, p));
    fs.writeFileSync(p, body, 'utf8');
  }
  const idx = indexXml(parts);
  const n = assertLocs(idx, 'sitemap-index.xml');
  fs.writeFileSync(path.join(ROOT, 'sitemap-index.xml'), idx, 'utf8');
  console.log('');
  console.log(`已写入 ${parts.length} 个 sitemap（${total} 条 URL）+ sitemap-index.xml（${n} 条子 sitemap）`);
  console.log('loc 校验：全部通过');
} else if (check) {
  // CI 用：磁盘上的 sitemap 必须和页面实际状态完全一致。
  // 页面加了 noindex、canonical 改了、目录搬了，这里立刻红。
  const drift = [];
  for (const [k, v] of Object.entries(buckets)) {
    if (!v.length) continue;
    const rel = k === 'main' ? 'sitemap.xml' : `${k}/sitemap.xml`;
    const p = path.join(ROOT, rel);
    const want = xml(v);
    assertLocs(want, rel);
    const have = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    if (have !== want) drift.push(rel);
  }
  const idxRel = 'sitemap-index.xml';
  const wantIdx = indexXml(parts);
  assertLocs(wantIdx, idxRel);
  const idxPath = path.join(ROOT, idxRel);
  if (!fs.existsSync(idxPath) || fs.readFileSync(idxPath, 'utf8') !== wantIdx) drift.push(idxRel);

  console.log('');
  if (drift.length) {
    console.error(`sitemap 与页面状态不一致：${drift.join(', ')}`);
    console.error('跑 node scripts/build-sitemap.mjs --write 重新生成');
    process.exit(1);
  }
  console.log('sitemap 与实际页面状态一致');
} else {
  console.log('');
  console.log('dry-run，未写入。加 --write 落盘。');
}
