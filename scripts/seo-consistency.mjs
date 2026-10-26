#!/usr/bin/env node
/**
 * seo-consistency.mjs —— 全站 canonical / hreflang 一致性诊断
 * ---------------------------------------------------------------
 * 为什么要有这个：多语言站放开收录前，必须先保证语言集群的信号是自洽的。
 * 实测 haowordtool.com 存在三类硬错误（踩过的坑，保留在判据里）：
 *   - ja/es 工具页 canonical 指向英文版 → 等于主动放弃收录
 *   - hreflang 指向 /ar/ /ru/ 目录，而这两个目录已不存在 → 指向 404
 *   - 同一页出现两条相同 hreflang（en/de/ja 重复）→ Google 视为冲突
 *
 * 检查项：
 *   CANON_MISSING     缺 canonical
 *   CANON_FOREIGN     canonical 指向其它语种
 *   CANON_BROKEN      canonical 指向本地不存在的文件
 *   CANON_TRAILING    canonical 与实际 URL 形式不一致（.html vs 目录）
 *   HL_BROKEN         hreflang 指向本地不存在的文件
 *   HL_DUP            同一 hreflang 出现多次
 *   HL_NO_SELF        缺自指 hreflang
 *   HL_NO_XDEFAULT    缺 x-default
 *   HL_NOT_CLOSED     A 页指向 B，但 B 未指回 A
 *   HL_LANG_MISMATCH  hreflang 值与目标页 <html lang> 不符
 *
 * 用法：
 *   node scripts/seo-consistency.mjs                 # 终端汇总
 *   node scripts/seo-consistency.mjs --md            # Markdown
 *   node scripts/seo-consistency.mjs --json
 *   node scripts/seo-consistency.mjs --out docs/seo-consistency
 *   node scripts/seo-consistency.mjs --only CANON_FOREIGN,HL_BROKEN
 *   node scripts/seo-consistency.mjs --strict        # 有 error 级问题则退出码 1
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = 'https://haowordtool.com';

// 有实际内容目录的语种。ar/ru 已删站但仍被 hreflang 引用，不在这个表里。
const LIVE_LOCALES = ['en', 'de', 'es', 'fr', 'ja', 'ko', 'zh'];

const SEVERITY = {
  CANON_MISSING: 'error',
  CANON_FOREIGN: 'error',
  CANON_BROKEN: 'error',
  CANON_TRAILING: 'warn',
  HL_BROKEN: 'error',
  HL_DUP: 'error',
  HL_NO_SELF: 'warn',
  HL_NO_XDEFAULT: 'warn',
  HL_NOT_CLOSED: 'warn',
  HL_LANG_MISMATCH: 'warn',
};

/* ============================================================
   文件 ↔ URL
   ============================================================ */
// .head-backup 必须排除：修复器把原文件备份在那里，扫进去会把「修好的备份」
// 当成待修页面，复验数字永远不降（实测踩过：362 → 449 页，error 反而涨到 176）
import { SKIP_DIRS } from './lib/site-walker.mjs';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(path.join(dir, e.name), out);
    } else if (e.name.endsWith('.html')) {
      out.push(path.join(dir, e.name));
    }
  }
  return out;
}

/** 本地文件 → 规范 URL 路径（/tools/calculator.html） */
function fileToPath(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  return '/' + rel;
}

/** URL 路径 → 可能的本地文件 */
function resolveLocal(urlPath) {
  let p = urlPath.replace(/^https?:\/\/[^/]+/, '').split(/[?#]/)[0];
  if (!p.startsWith('/')) p = '/' + p;
  const candidates = [];
  if (p.endsWith('/')) {
    candidates.push(p + 'index.html');
  } else if (p.endsWith('.html')) {
    candidates.push(p);
    // 极少数页面同时存在 foo.html 与 foo/index.html
    candidates.push(p.replace(/\.html$/, '/index.html'));
  } else {
    candidates.push(p + '/index.html', p + '.html');
  }
  for (const c of candidates) {
    const abs = path.join(ROOT, c.slice(1));
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

/** 从 URL 判断语种（/de/... → de，/tools/... → en） */
function localeOfUrl(urlPath) {
  const p = urlPath.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '');
  const first = p.split('/')[0] || '';
  return LIVE_LOCALES.includes(first) && first !== 'en' ? first : 'en';
}

/* ============================================================
   抽取 head 信号
   ============================================================ */
function parsePage(file) {
  const html = fs.readFileSync(file, 'utf8');
  const head = (html.match(/<head\b[\s\S]*?<\/head>/i) || [html])[0];

  const canonicals = [...head.matchAll(/<link[^>]+rel=["']canonical["'][^>]*>/gi)].map((m) => {
    const h = m[0].match(/href=["']([^"']+)["']/i);
    return h ? h[1].trim() : null;
  }).filter(Boolean);

  const hreflangs = [...head.matchAll(/<link[^>]+hreflang=["']([^"']+)["'][^>]*>/gi)].map((m) => {
    const href = m[0].match(/href=["']([^"']+)["']/i);
    return { lang: m[1].toLowerCase().trim(), href: href ? href[1].trim() : null };
  });

  const htmlLang = ((html.match(/<html[^>]*\blang=["']([^"']+)["']/i) || [])[1] || '').toLowerCase();
  const robots = ((html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '').toLowerCase();

  return { html, head, canonicals, hreflangs, htmlLang, robots };
}

/* ============================================================
   主检查
   ============================================================ */
const files = walk(ROOT);
const pages = new Map(); // urlPath -> {file, data}

for (const f of files) {
  pages.set(fileToPath(f), { file: f, data: parsePage(f) });
}

const issues = [];
const push = (code, urlPath, detail) => issues.push({ code, severity: SEVERITY[code], page: urlPath, detail });

for (const [urlPath, { data }] of pages) {
  const { canonicals, hreflangs, htmlLang } = data;
  const selfLocale = localeOfUrl(urlPath);

  /* --- canonical --- */
  // noindex 页面不需要 canonical：它们的正确状态是被排除在索引外，
  // 补 canonical 反而会跟 noindex 打架。示例/演示页走这条。
  const isNoindex = /noindex/i.test(data.robots || '');
  if (!canonicals.length) {
    if (!isNoindex) push('CANON_MISSING', urlPath, '未声明 canonical');
  } else {
    if (canonicals.length > 1) {
      push('CANON_DUP', urlPath, `声明了 ${canonicals.length} 条 canonical`);
    }
    const c = canonicals[0].replace(/^https?:\/\/[^/]+/, '');
    const cLocale = localeOfUrl(c);

    if (cLocale !== selfLocale) {
      push('CANON_FOREIGN', urlPath, `canonical 指向 ${c}（${cLocale} 语种），本页属 ${selfLocale}`);
    }
    const target = resolveLocal(c);
    if (!target) {
      push('CANON_BROKEN', urlPath, `canonical 目标不存在：${c}`);
    } else {
      // 形式一致性：源是 .html 但目标落到 index.html（或反之）
      const cNorm = c.replace(/\/$/, '/index.html');
      if (cNorm !== urlPath && cNorm !== urlPath.replace(/index\.html$/, '')) {
        push('CANON_TRAILING', urlPath, `canonical 形式与页面对不上：${c} vs ${urlPath}`);
      }
    }
  }

  /* --- hreflang --- */
  if (!hreflangs.length) {
    // 非英文页缺 hreflang 是重灾区，但单页不算 error；只在汇总里体现
    push('HL_NO_SELF', urlPath, '整页无任何 hreflang');
  } else {
    const seen = new Map();
    for (const { lang, href } of hreflangs) {
      if (!href) continue;
      seen.set(lang, (seen.get(lang) || 0) + 1);

      const target = resolveLocal(href);
      if (!target) {
        push('HL_BROKEN', urlPath, `hreflang="${lang}" → ${href} 本地不存在`);
        continue;
      }
      // 语言值与目标页 lang 属性是否匹配
      const tp = pages.get(fileToPath(target));
      if (tp && tp.data.htmlLang && lang !== 'x-default') {
        if (!tp.data.htmlLang.startsWith(lang)) {
          push('HL_LANG_MISMATCH', urlPath, `hreflang="${lang}" 但 ${href} 的 lang=${tp.data.htmlLang}`);
        }
      }
    }
    for (const [lang, n] of seen) {
      if (n > 1) push('HL_DUP', urlPath, `hreflang="${lang}" 重复 ${n} 次`);
    }
    if (!seen.has('x-default')) push('HL_NO_XDEFAULT', urlPath, '缺 x-default');

    const selfEntry = [...seen.keys()].some((l) => l === selfLocale);
    if (!selfEntry) push('HL_NO_SELF', urlPath, `缺自指 hreflang="${selfLocale}"`);
  }
}

/* --- 闭合性：A→B 则 B→A --- */
const edges = new Map();
for (const [urlPath, { data }] of pages) {
  const outs = new Set();
  for (const { href } of data.hreflangs) {
    if (!href) continue;
    const t = resolveLocal(href);
    if (t) outs.add(fileToPath(t));
  }
  edges.set(urlPath, outs);
}
for (const [from, outs] of edges) {
  for (const to of outs) {
    if (to === from) continue;
    const back = edges.get(to);
    if (!back) continue; // 目标页不在本次扫描范围
    if (!back.has(from)) {
      push('HL_NOT_CLOSED', from, `指向 ${to}，但对方未指回`);
    }
  }
}

/* ============================================================
   报告
   ============================================================ */
function summarize() {
  const byCode = {};
  for (const i of issues) byCode[i.code] = (byCode[i.code] || 0) + 1;
  const bySeverity = { error: 0, warn: 0 };
  for (const i of issues) bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;

  // 按目录聚合，方便定位问题集中的区块
  const byDir = {};
  for (const i of issues) {
    const d = i.page.split('/')[1] || '(root)';
    byDir[d] = byDir[d] || { error: 0, warn: 0 };
    byDir[d][i.severity]++;
  }
  return { pages: pages.size, byCode, bySeverity, byDir };
}

function mdReport() {
  const s = summarize();
  const L = [];
  L.push('# 全站 canonical / hreflang 一致性报告');
  L.push('');
  L.push(`> 生成：${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`);
  L.push(`> 扫描 ${s.pages} 个页面 · error ${s.bySeverity.error} · warn ${s.bySeverity.warn}`);
  L.push('');
  L.push('## 问题分布');
  L.push('');
  L.push('| 目录 | error | warn |');
  L.push('|---|---|---|');
  for (const [d, v] of Object.entries(s.byDir).sort((a, b) => b[1].error - a[1].error)) {
    L.push(`| ${d} | ${v.error} | ${v.warn} |`);
  }
  L.push('');
  L.push('## 按类型');
  L.push('');
  L.push('| 代码 | 级别 | 数量 | 含义 |');
  L.push('|---|---|---|---|');
  const MEAN = {
    CANON_MISSING: '缺 canonical',
    CANON_FOREIGN: 'canonical 指向其它语种（=放弃收录）',
    CANON_BROKEN: 'canonical 目标 404',
    CANON_DUP: '多条 canonical',
    CANON_TRAILING: 'canonical URL 形式不一致',
    HL_BROKEN: 'hreflang 目标 404',
    HL_DUP: 'hreflang 重复',
    HL_NO_SELF: '缺自指 hreflang',
    HL_NO_XDEFAULT: '缺 x-default',
    HL_NOT_CLOSED: 'hreflang 不闭合',
    HL_LANG_MISMATCH: 'hreflang 与目标页 lang 不符',
  };
  for (const [c, n] of Object.entries(s.byCode).sort((a, b) => b[1] - a[1])) {
    L.push(`| ${c} | ${SEVERITY[c]} | ${n} | ${MEAN[c] || ''} |`);
  }
  L.push('');

  for (const code of Object.keys(s.byCode).sort()) {
    const list = issues.filter((i) => i.code === code);
    L.push(`### ${code}（${list.length}）`);
    L.push('');
    for (const i of list.slice(0, 60)) L.push(`- \`${i.page}\` — ${i.detail}`);
    if (list.length > 60) L.push(`- …其余 ${list.length - 60} 条见 JSON`);
    L.push('');
  }
  return L.join('\n');
}

function termReport() {
  const s = summarize();
  console.log('');
  console.log(`扫描 ${s.pages} 个页面  ·  error ${s.bySeverity.error}  ·  warn ${s.bySeverity.warn}`);
  console.log('');
  const pad = (x, n) => String(x).padEnd(n);
  console.log(pad('code', 18) + pad('级别', 7) + '数量');
  console.log('-'.repeat(36));
  for (const [c, n] of Object.entries(s.byCode).sort((a, b) => b[1] - a[1])) {
    console.log(pad(c, 18) + pad(SEVERITY[c], 7) + n);
  }
  console.log('');
  console.log('按目录：');
  for (const [d, v] of Object.entries(s.byDir).sort((a, b) => b[1].error - a[1].error)) {
    console.log(`  ${pad(d, 20)} error ${pad(v.error, 5)} warn ${v.warn}`);
  }
  console.log('');
}

/* ============================================================
   main
   ============================================================ */
const args = process.argv.slice(2);
const wantJson = args.includes('--json');
const wantMd = args.includes('--md');
const strict = args.includes('--strict');
const outIdx = args.indexOf('--out');
const outBase = outIdx > -1 ? args[outIdx + 1] : null;
const onlyIdx = args.indexOf('--only');
const only = onlyIdx > -1 ? args[onlyIdx + 1].split(',').map((s) => s.trim()) : null;

const filtered = only ? issues.filter((i) => only.includes(i.code)) : issues;

if (outBase) {
  const abs = path.resolve(ROOT, outBase);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs + '.json', JSON.stringify({ generated: new Date().toISOString(), summary: summarize(), issues }, null, 2));
  fs.writeFileSync(abs + '.md', mdReport());
  console.log(`已写入 ${outBase}.json / ${outBase}.md`);
}

if (wantJson) console.log(JSON.stringify({ generated: new Date().toISOString(), summary: summarize(), issues: filtered }, null, 2));
else if (wantMd) console.log(mdReport());
else if (!outBase) termReport();

if (only && !wantJson && !wantMd && outBase) {
  console.log(`--only ${only.join(',')} 命中 ${filtered.length} 条`);
}

if (strict) {
  const errs = issues.filter((i) => i.severity === 'error');
  if (errs.length) {
    console.error(`\n[strict] ${errs.length} 个 error 级问题`);
    process.exit(1);
  }
}
