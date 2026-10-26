#!/usr/bin/env node
/**
 * fix-head-signals.mjs —— 修 canonical / hreflang 的 error 级错误
 * ---------------------------------------------------------------
 * 只修 seo-consistency.mjs 报出的 error 级问题，不碰正文、不碰样式、不碰脚本。
 * 保留原文件换行符（CRLF/LF）与 BOM。
 *
 * 修复动作：
 *   HL_BROKEN          删除指向本地不存在目标的 <link hreflang> 条目
 *   HL_LANG_UNSUPPORTED 删除已弃用语种（ar/ru 等）的条目，即便目标存在
 *   HL_DUP             同 hreflang 值只保留第一条
 *   CANON_FOREIGN      canonical 改为自指
 *   CANON_MISSING      路径含 /examples/ 的页面插入 noindex,follow（演示页不该收录）
 *
 * 不修（留给下一步）：
 *   HL_NO_SELF / HL_NO_XDEFAULT / HL_NOT_CLOSED —— 需要重建语言集群，单独一轮做，
 *   避免这一轮把不该连的页面连一起。
 *
 * 用法：
 *   node scripts/fix-head-signals.mjs                    # dry-run，只打印
 *   node scripts/fix-head-signals.mjs --write            # 落盘，原文件备份到 .head-backup/
 *   node scripts/fix-head-signals.mjs --write --no-backup
 *   node scripts/fix-head-signals.mjs --only CANON_FOREIGN,HL_DUP
 *   node scripts/fix-head-signals.mjs --dry-run --verbose
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = 'https://haowordtool.com';
const LIVE_LOCALES = ['en', 'de', 'es', 'fr', 'ja', 'ko', 'zh'];
const BACKUP_DIR = path.join(ROOT, '.head-backup');

import { SKIP_DIRS } from './lib/site-walker.mjs';

/* ============================================================
   URL 工具（与 seo-consistency.mjs 保持一致）
   ============================================================ */
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(path.join(dir, e.name), out);
    } else if (e.name.endsWith('.html')) out.push(path.join(dir, e.name));
  }
  return out;
}

function fileToUrlPath(file) {
  return '/' + path.relative(ROOT, file).split(path.sep).join('/');
}

function resolveLocal(urlPath) {
  let p = urlPath.replace(/^https?:\/\/[^/]+/, '').split(/[?#]/)[0];
  if (!p.startsWith('/')) p = '/' + p;
  const cands = [];
  if (p.endsWith('/')) cands.push(p + 'index.html');
  else if (p.endsWith('.html')) cands.push(p, p.replace(/\.html$/, '/index.html'));
  else cands.push(p + '/index.html', p + '.html');
  for (const c of cands) {
    const abs = path.join(ROOT, c.slice(1));
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

function localeOfUrl(u) {
  const p = u.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '');
  const first = p.split('/')[0] || '';
  return LIVE_LOCALES.includes(first) && first !== 'en' ? first : 'en';
}

/** 页面自身的规范 URL（index.html 收敛为目录形式） */
function selfUrl(urlPath) {
  if (urlPath.endsWith('/index.html')) return SITE + urlPath.replace(/index\.html$/, '');
  return SITE + urlPath;
}

/* ============================================================
   单文件处理
   ============================================================ */
function processFile(file) {
  const urlPath = fileToUrlPath(file);
  let src = fs.readFileSync(file, 'utf8');
  const changes = [];
  const orig = src;

  const headM = src.match(/<head\b[\s\S]*?<\/head>/i);
  if (!headM) return { urlPath, file, changes, skipped: 'no-head' };
  const headStart = headM.index;
  let head = headM[0];

  /* ---------- 1. hreflang：删坏边 / 删弃用语种 / 去重 ---------- */
  const tagRe = /[ \t]*<link\b[^>]*hreflang=["']([^"']+)["'][^>]*>[ \t]*\r?\n?/gi;
  const kept = new Set();
  let removed = 0;
  let dedup = 0;
  head = head.replace(tagRe, (full, langRaw) => {
    const lang = langRaw.toLowerCase().trim();
    const hrefM = full.match(/href=["']([^"']+)["']/i);
    const href = hrefM ? hrefM[1].trim() : null;

    // 弃用语种。带地区码的标签要取主语言比较：zh-cn / pt-BR / zh-Hant 都是合法写法，
    // 直接拿整串跟 LIVE_LOCALES 比会把它们误删（v1 就这么删掉了 video-studio 的 zh-cn）
    const primary = lang.split('-')[0];
    if (lang !== 'x-default' && !LIVE_LOCALES.includes(primary)) {
      removed++;
      changes.push(`- 删 hreflang="${lang}"（语种已弃用）`);
      return '';
    }
    // 目标不存在
    if (!href || !resolveLocal(href)) {
      removed++;
      changes.push(`- 删 hreflang="${lang}" → ${href || '(无 href)'}（目标不存在）`);
      return '';
    }
    // 重复
    if (kept.has(lang)) {
      dedup++;
      changes.push(`- 删重复 hreflang="${lang}"`);
      return '';
    }
    kept.add(lang);
    return full;
  });

  /* ---------- 2. canonical ---------- */
  const canonRe = /<link\b[^>]*rel=["']canonical["'][^>]*>/i;
  const canonM = head.match(canonRe);
  const want = selfUrl(urlPath);

  if (!canonM) {
    if (/\/examples\//.test(urlPath)) {
      // 演示页：不声明 canonical（避免和真实页抢），直接 noindex
      const robotsRe = /<meta\b[^>]*name=["']robots["'][^>]*>/i;
      if (robotsRe.test(head)) {
        head = head.replace(robotsRe, (m) =>
          /noindex/i.test(m) ? m : m.replace(/content=["'][^"']*["']/i, 'content="noindex,follow"')
        );
        changes.push('~ robots 改为 noindex,follow');
      } else {
        head = head.replace(/<\/head>/i, `<meta name="robots" content="noindex,follow">\n</head>`);
        changes.push('+ 插入 robots noindex,follow');
      }
    } else {
      changes.push(`+ 补 canonical ${want}`);
      head = head.replace(/<\/head>/i, `<link rel="canonical" href="${want}">\n</head>`);
    }
  } else {
    const cur = (canonM[0].match(/href=["']([^"']+)["']/i) || [])[1] || '';
    const curLocale = localeOfUrl(cur);
    const selfLocale = localeOfUrl(urlPath);

    if (curLocale !== selfLocale) {
      head = head.replace(canonRe, `<link rel="canonical" href="${want}">`);
      changes.push(`~ canonical ${cur} → ${want}（原指向 ${curLocale} 语种）`);
    } else if (!resolveLocal(cur)) {
      head = head.replace(canonRe, `<link rel="canonical" href="${want}">`);
      changes.push(`~ canonical ${cur} → ${want}（原目标 404）`);
    } else if (rewriteableForm(cur, want)) {
      head = head.replace(canonRe, `<link rel="canonical" href="${want}">`);
      changes.push(`~ canonical 形式统一 ${cur} → ${want}`);
    }
  }

  if (head !== headM[0]) {
    src = src.slice(0, headStart) + head + src.slice(headStart + headM[0].length);
  }

  return {
    urlPath,
    file,
    changes,
    changed: src !== orig,
    src,
    srcBefore: orig,
    stats: { removed, dedup },
  };
}

/** index.html 的 canonical 应写成目录形式；其余保持原形式，只在明显不一致时改 */
function rewriteableForm(cur, want) {
  const curP = cur.replace(/^https?:\/\/[^/]+/, '');
  const wantP = want.replace(/^https?:\/\/[^/]+/, '');
  if (curP === wantP) return false;
  // 只处理 index.html 与目录形式的差异，其它（如 .html vs 无扩展名）不动
  const norm = (s) => s.replace(/\/index\.html$/, '/');
  return norm(curP) === norm(wantP) && curP !== wantP;
}

/* ============================================================
   main
   ============================================================ */
const args = process.argv.slice(2);
const write = args.includes('--write');
const noBackup = args.includes('--no-backup');
const verbose = args.includes('--verbose');
const onlyIdx = args.indexOf('--only');
const only = onlyIdx > -1 ? args[onlyIdx + 1].split(',').map((s) => s.trim()) : null;

const files = walk(ROOT);
const results = [];

for (const f of files) {
  const r = processFile(f);
  if (r.skipped) continue;
  if (!r.changes.length) continue;
  if (only) {
    // 按代码过滤：从 changes 文本推断
    const codes = new Set();
    for (const c of r.changes) {
      if (c.includes('canonical')) codes.add('CANON');
      if (c.includes('hreflang')) codes.add('HL');
      if (c.includes('robots')) codes.add('CANON_MISSING');
    }
    if (![...codes].some((c) => only.some((o) => o.startsWith(c) || c.startsWith(o)))) continue;
  }
  results.push(r);
}

let touched = 0;
for (const r of results) {
  const rel = r.urlPath.replace(/^\//, '');
  console.log(`\n${r.urlPath}`);
  for (const c of r.changes) console.log('  ' + c);

  if (write && r.changed) {
    if (!noBackup) {
      const bpath = path.join(BACKUP_DIR, rel);
      fs.mkdirSync(path.dirname(bpath), { recursive: true });
      fs.writeFileSync(bpath, r.srcBefore, 'utf8');
    }
    // 原子写：先写临时文件再替换，避免中途失败留下半截文件
    const tmp = r.file + '.tmp-fix';
    fs.writeFileSync(tmp, r.src, 'utf8');
    fs.renameSync(tmp, r.file);
    touched++;
  }
}

const totalChanges = results.reduce((n, r) => n + r.changes.length, 0);
console.log('');
console.log('─'.repeat(60));
console.log(`命中页面 ${results.length} 个，改动 ${totalChanges} 处`);
if (write) {
  console.log(`已写入 ${touched} 个文件${noBackup ? '' : `，原文件备份在 .head-backup/`}`);
  console.log('下一步：node scripts/seo-consistency.mjs 复验');
} else {
  console.log('这是 dry-run，未改动任何文件。加 --write 落盘。');
}
