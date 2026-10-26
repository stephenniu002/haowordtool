#!/usr/bin/env node
/**
 * i18n-gate.mjs —— 多语言页面「可否放开收录」闸门 v2
 * ---------------------------------------------------------------
 * 用途：给 /de /es /fr /ja /ko /zh 每个 HTML 打分，只有 PASS 的页面
 *       才允许移除 <meta name="robots" content="noindex...">。
 *
 * v2 改动（v1 的误判教训）：
 *   - 按页面类型分档：工具页「功能即内容」，不按词数卡；内容页才卡词数。
 *   - 英文残留改为硬判据（v1 用目标语言虚词率当门槛，工具页术语多、正文短，
 *     天然低分，导致零英文残留的干净德语页被判 FAIL）。
 *   - 跨语言对照改用 hreflang 反查（各语种文件名本地化：calculadora / rechner…），
 *     路径同名映射会失配。
 *
 * 页面类型：
 *   tool     路径含 /tools/ 且非 index   → 看功能元素 + 语言正确
 *   nav      index.html                  → 看内链质量
 *   content  其它                        → 看词数 + 段落 + 结构完整度
 *
 * 用法：
 *   node scripts/i18n-gate.mjs                    # 终端汇总
 *   node scripts/i18n-gate.mjs --md               # Markdown 报告
 *   node scripts/i18n-gate.mjs --json             # JSON
 *   node scripts/i18n-gate.mjs --out docs/i18n-gate
 *   node scripts/i18n-gate.mjs --locale de
 *   node scripts/i18n-gate.mjs --verbose          # 每页一行明细
 *   node scripts/i18n-gate.mjs --strict           # 有不达标但已放开的页面则退出码 1
 *
 * 复杂度 O(总字节)，单遍，362 页 < 1.5s。
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOCALES = ['de', 'es', 'fr', 'ja', 'ko', 'zh'];
const CJK = new Set(['ja', 'ko', 'zh']);

/* ============================================================
   阈值 —— 只改这里
   ============================================================ */
const CFG = {
  // 英文残留（拉丁语种）上限。英文原版页基线约 26.6%，翻译干净的页面实测 0%。
  enLeakMaxLatin: 0.08,
  // CJK 语种里拉丁字母占比上限（品牌名/工具名允许存在）
  latinMaxCJK: 0.18,

  minWordsTool: 40,     // 工具页：够标签+说明即可
  minWordsNav: 80,      // 栏目索引页
  minWordsContent: 300, // 内容页

  minParasContent: 4,
  minLinksNav: 8,       // 索引页至少 8 条站内链，否则只是一块招牌
  minLinksAny: 2,       // 任何页至少 2 条，避免孤岛

  structRatioMin: 0.45, // 内容页段落数 / 英文对应页
  minFnElements: 2,     // 工具页至少 2 种交互元素
};

const EN_MARKERS = new Set(
  'the and is are of to for with this that you your can will from not have was our use a an be by it as at on or click enter free online tool all more than what how why when which'.split(
    ' '
  )
);

const DOORWAY_PATTERNS = [
  [/Open\s+English\s+landing\s+page/i, 'en-redirect-pitch'],
  [/Redirecting\s+to\s+\//i, 'redirect-stub'],
  [/本页与主页保持相同主题/, 'zh-stub'],
  [/このページはメインページと同じテーマと入口を保ち/, 'ja-stub'],
  [/please\s+visit\s+the\s+English\s+version/i, 'en-redirect-pitch'],
  [/see\s+the\s+English\s+page/i, 'en-redirect-pitch'],
  [/lorem\s+ipsum/i, 'placeholder'],
  [/coming\s+soon/i, 'placeholder'],
];

const LANG_PREFIX = {
  de: ['de'],
  es: ['es'],
  fr: ['fr'],
  ja: ['ja'],
  ko: ['ko'],
  zh: ['zh', 'cmn'],
};

/* ============================================================
   抽取
   ============================================================ */
function stripNonContent(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(nav|footer|header)\b[\s\S]*?<\/\1>/gi, ' ');
}

function toText(html) {
  return stripNonContent(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function wordCount(text) {
  const cjk = (text.match(/[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/g) || []).length;
  const latin = (text.match(/[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'-]*/g) || []).length;
  return latin + Math.round(cjk / 2);
}

/** 英文残留词占比 */
function enLeak(text) {
  const tk = tokens(text).map((t) => t.toLowerCase().replace(/[^a-zà-ÿ']/g, '')).filter(Boolean);
  if (!tk.length) return 0;
  let hit = 0;
  for (const t of tk) if (EN_MARKERS.has(t)) hit++;
  return hit / tk.length;
}

/** CJK 语种里的拉丁字母占比（扣掉 HTML 属性已由 toText 处理） */
function latinRatio(text) {
  const s = text.replace(/[\s\d\p{P}]/gu, '');
  if (!s.length) return 0;
  const latin = (s.match(/[A-Za-z]/g) || []).length;
  return latin / s.length;
}

/**
 * 段落数：统计含实质文字的 p/li。
 * 门槛从 20 字符降到 12 —— 德语/日语短句常压在 15 字左右，20 会漏计。
 */
function paraCount(html) {
  const body = stripNonContent(html);
  const blocks = body.match(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi) || [];
  let n = 0;
  for (const b of blocks) {
    if (b.replace(/<[^>]+>/g, '').trim().length >= 12) n++;
  }
  return n;
}

/**
 * 工具页功能信号数。
 * 不能只认 input/button/addEventListener —— 实测踩过两个坑：
 *   1. what-is-my-ip 用 fetch() 拉 IP，没有 input
 *   2. word-counter 用 textarea.oninput = fn 绑定，没有 addEventListener
 * 所以把内联事件属性、网络请求、Intl、定时器都算作功能证据。
 */
function fnElements(html) {
  const checks = [
    /<input\b/i,
    /<button\b/i,
    /<textarea\b/i,
    /<select\b/i,
    /<canvas\b/i,
    /\bon(click|input|change|submit|keyup|keydown)\s*=/i,
    /addEventListener\s*\(/i,
    /\bfetch\s*\(/i,
    /XMLHttpRequest/i,
    /Intl\.[A-Z]/,
    /setInterval\s*\(/i,
  ];
  let n = 0;
  for (const re of checks) if (re.test(html)) n++;
  return n;
}

function attr(html, re) {
  const m = html.match(re);
  return m ? (m[1] || '').trim() : null;
}

/** 从 hreflang 里找英文版 URL，反查本地文件 */
function englishViaHreflang(html) {
  const links = html.match(/<link[^>]+hreflang=["']en["'][^>]*>/gi) || [];
  for (const l of links) {
    const href = (l.match(/href=["']([^"']+)["']/i) || [])[1];
    if (!href) continue;
    const rel = href.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '').split(/[?#]/)[0];
    const p = path.join(ROOT, rel, rel.endsWith('.html') ? '' : 'index.html');
    if (fs.existsSync(p)) return p;
    if (fs.existsSync(path.join(ROOT, rel))) return path.join(ROOT, rel);
  }
  return null;
}

function englishViaPath(file) {
  const parts = path.relative(ROOT, file).split(path.sep);
  parts.shift();
  const p = path.join(ROOT, ...parts);
  return fs.existsSync(p) ? p : null;
}

function pageType(rel) {
  if (/\/index\.html$/.test(rel)) return 'nav';
  if (/\/tools\//.test(rel) || /^[a-z]{2}\/tools\//.test(rel)) return 'tool';
  return 'content';
}

/* ============================================================
   单页判定
   ============================================================ */
function analyze(file, locale) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const text = toText(html);
  const words = wordCount(text);
  const paras = paraCount(html);
  const type = pageType(rel);

  const htmlLang = (attr(html, /<html[^>]*\blang=["']([^"']+)["']/i) || '').toLowerCase();
  const robots = attr(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
  const canonical = attr(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const hasHreflang = /hreflang=/i.test(html);

  const hrefs = (html.match(/href=["']([^"']+)["']/gi) || [])
    .map((h) => h.replace(/^href=["']|["']$/gi, ''))
    .filter((h) => h && !/^(#|https?:|mailto:|javascript:)/i.test(h));

  const reasons = [];
  const warns = [];

  // 1. lang 属性
  const okLang = (LANG_PREFIX[locale] || [locale]).some((p) => htmlLang.startsWith(p));
  if (!htmlLang) reasons.push('no-lang-attr');
  else if (!okLang) reasons.push(`lang-attr:${htmlLang}≠${locale}`);

  // 2. 语言残留
  const leak = enLeak(text);
  const latR = latinRatio(text);
  if (CJK.has(locale)) {
    if (latR > CFG.latinMaxCJK) reasons.push(`latin:${(latR * 100).toFixed(0)}%>${CFG.latinMaxCJK * 100}%`);
  } else if (leak > CFG.enLeakMaxLatin) {
    reasons.push(`en-leak:${(leak * 100).toFixed(0)}%>${CFG.enLeakMaxLatin * 100}%`);
  }

  // 3. 门页话术
  for (const [re, tag] of DOORWAY_PATTERNS) {
    if (re.test(text)) reasons.push(`doorway:${tag}`);
  }

  // 4. canonical
  if (!canonical) reasons.push('no-canonical');
  else {
    const tail = rel.replace(/\/index\.html$/, '/');
    const cpath = canonical.replace(/^https?:\/\/[^/]+/, '');
    if (!cpath.includes(tail.replace(/\.html$/, ''))) reasons.push('canonical-mismatch');
  }

  // 5. 类型专项
  const fn = fnElements(html);
  if (type === 'tool') {
    if (words < CFG.minWordsTool) reasons.push(`thin:${words}<${CFG.minWordsTool}`);
    if (fn < CFG.minFnElements) reasons.push(`not-functional:${fn}<${CFG.minFnElements}`);
  } else if (type === 'nav') {
    if (words < CFG.minWordsNav) reasons.push(`thin-nav:${words}<${CFG.minWordsNav}`);
    if (hrefs.length < CFG.minLinksNav) reasons.push(`few-links:${hrefs.length}<${CFG.minLinksNav}`);
  } else {
    if (words < CFG.minWordsContent) reasons.push(`thin:${words}<${CFG.minWordsContent}`);
    if (paras < CFG.minParasContent) reasons.push(`few-paras:${paras}<${CFG.minParasContent}`);
  }
  if (hrefs.length < CFG.minLinksAny) reasons.push(`orphan:${hrefs.length}links`);

  // 6. 结构完整度（仅内容页，且找到英文对照）
  let structRatio = null;
  if (type === 'content') {
    const cp = englishViaHreflang(html) || englishViaPath(file);
    if (cp && cp !== file) {
      const cpParas = paraCount(fs.readFileSync(cp, 'utf8'));
      if (cpParas > 0) {
        structRatio = paras / cpParas;
        if (structRatio < CFG.structRatioMin) {
          reasons.push(`struct:${(structRatio * 100).toFixed(0)}%<${CFG.structRatioMin * 100}%`);
        }
      }
    }
  }

  if (!hasHreflang) warns.push('no-hreflang');
  if (!robots) warns.push('no-robots-meta');

  return {
    rel,
    locale,
    type,
    verdict: reasons.length ? 'FAIL' : 'PASS',
    reasons,
    warns,
    words,
    paragraphs: paras,
    fnElements: type === 'tool' ? fn : null,
    enLeak: +(leak * 100).toFixed(1),
    latinRatio: +(latR * 100).toFixed(1),
    structRatio: structRatio === null ? null : +(structRatio * 100).toFixed(0),
    links: hrefs.length,
    htmlLang: htmlLang || null,
    canonical: canonical || null,
    noindex: /noindex/i.test(robots || ''),
    hreflang: hasHreflang,
  };
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '.git' || e.name === 'node_modules') continue;
      walk(p, out);
    } else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

/* ============================================================
   报告
   ============================================================ */
function summarize(results) {
  const by = {};
  for (const r of results) (by[r.locale] ||= []).push(r);
  const rows = [];
  for (const loc of Object.keys(by).sort()) {
    const arr = by[loc];
    const pass = arr.filter((r) => r.verdict === 'PASS');
    const fail = arr.filter((r) => r.verdict === 'FAIL');
    const open = arr.filter((r) => !r.noindex);
    rows.push({
      locale: loc,
      total: arr.length,
      pass: pass.length,
      fail: fail.length,
      open: open.length,
      wrongOpen: open.filter((r) => r.verdict === 'FAIL').length,
      canOpen: pass.filter((r) => r.noindex).length,
      byType: {
        tool: arr.filter((r) => r.type === 'tool').length,
        nav: arr.filter((r) => r.type === 'nav').length,
        content: arr.filter((r) => r.type === 'content').length,
      },
    });
  }
  return rows;
}

function mdReport(results) {
  const rows = summarize(results);
  const by = {};
  for (const r of results) (by[r.locale] ||= []).push(r);

  const L = [];
  L.push('# 多语言收录闸门报告');
  L.push('');
  L.push(`> 生成：${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`);
  L.push('> 判据：`scripts/i18n-gate.mjs` 顶部注释。只有 PASS 的页面允许移除 noindex。');
  L.push('');
  L.push('## 汇总');
  L.push('');
  L.push('| locale | 总 | 工具页 | 索引页 | 内容页 | PASS | FAIL | 已放开 | ⚠️放开但不达标 | 可再放开 |');
  L.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) {
    L.push(
      `| ${r.locale} | ${r.total} | ${r.byType.tool} | ${r.byType.nav} | ${r.byType.content} | ${r.pass} | ${r.fail} | ${r.open} | ${r.wrongOpen || '-'} | ${r.canOpen || '-'} |`
    );
  }
  L.push('');

  for (const loc of Object.keys(by).sort()) {
    const arr = by[loc];
    const pass = arr.filter((r) => r.verdict === 'PASS');
    const fail = arr.filter((r) => r.verdict === 'FAIL');

    L.push(`## ${loc}`);
    L.push('');
    if (pass.length) {
      L.push(`**PASS ${pass.length} 页**（可放开 / 维持放开）`);
      L.push('');
      L.push('| 页面 | 类型 | 词数 | 英文残留 | 段落 | 结构比 | noindex |');
      L.push('|---|---|---|---|---|---|---|');
      for (const r of pass) {
        L.push(
          `| ${r.rel} | ${r.type} | ${r.words} | ${r.enLeak}% | ${r.paragraphs} | ${r.structRatio ?? '-'} | ${r.noindex ? '有' : '已放开'} |`
        );
      }
      L.push('');
    }
    if (fail.length) {
      L.push(`**FAIL ${fail.length} 页**（保持 / 回加 noindex）`);
      L.push('');
      L.push('| 页面 | 类型 | 词数 | 英文残留 | 未通过 |');
      L.push('|---|---|---|---|---|');
      for (const r of fail) {
        L.push(`| ${r.rel} | ${r.type} | ${r.words} | ${r.enLeak}% | ${r.reasons.join(', ')} |`);
      }
      L.push('');
    }
  }
  return L.join('\n');
}

function termReport(results, verbose) {
  const rows = summarize(results);
  const pad = (s, n) => String(s).padEnd(n);
  console.log('');
  console.log(pad('locale', 8) + pad('总', 4) + pad('PASS', 6) + pad('FAIL', 6) + pad('已放开', 8) + '风险 / 可放开');
  console.log('-'.repeat(58));
  for (const r of rows) {
    const risk = [];
    if (r.wrongOpen) risk.push(`${r.wrongOpen} 页放开但不达标`);
    if (r.canOpen) risk.push(`${r.canOpen} 页可放开`);
    console.log(
      pad(r.locale, 8) + pad(r.total, 4) + pad(r.pass, 6) + pad(r.fail, 6) + pad(r.open, 8) + (risk.join('，') || '-')
    );
  }
  console.log('');

  if (verbose) {
    for (const r of results) {
      console.log(`${r.verdict === 'PASS' ? '✓' : '✗'} ${r.rel.padEnd(46)} ${r.type.padEnd(8)} w=${String(r.words).padEnd(4)} leak=${String(r.enLeak + '%').padEnd(6)} ${r.reasons.join(',')}`);
    }
    console.log('');
  }

  const bad = results.filter((r) => !r.noindex && r.verdict === 'FAIL');
  if (bad.length) {
    console.log('【已放开但不达标 → 需回加 noindex】');
    for (const r of bad) console.log(`  ${r.rel}  [${r.reasons.join(', ')}]`);
    console.log('');
  }
  const ready = results.filter((r) => r.noindex && r.verdict === 'PASS');
  if (ready.length) {
    console.log('【达标且当前 noindex → 可放开】');
    for (const r of ready) console.log(`  ${r.rel}  [${r.type}, ${r.words} 词]`);
    console.log('');
  }
}

/* ============================================================
   main
   ============================================================ */
const args = process.argv.slice(2);
const wantJson = args.includes('--json');
const wantMd = args.includes('--md');
const verbose = args.includes('--verbose');
const strict = args.includes('--strict');
const locIdx = args.indexOf('--locale');
const onlyLocale = locIdx > -1 ? args[locIdx + 1] : null;
const outIdx = args.indexOf('--out');
const outBase = outIdx > -1 ? args[outIdx + 1] : null;

const locales = onlyLocale ? [onlyLocale] : LOCALES;
const files = [];
for (const loc of locales) {
  const d = path.join(ROOT, loc);
  if (!fs.existsSync(d)) continue;
  for (const f of walk(d)) files.push({ f, loc });
}
if (!files.length) {
  console.error('没有找到任何语言目录的 html');
  process.exit(2);
}

const results = files.map(({ f, loc }) => analyze(f, loc));

if (outBase) {
  const abs = path.resolve(ROOT, outBase);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs + '.json', JSON.stringify({ generated: new Date().toISOString(), cfg: CFG, results }, null, 2));
  fs.writeFileSync(abs + '.md', mdReport(results));
  console.log(`已写入 ${outBase}.json / ${outBase}.md`);
}

if (wantJson) console.log(JSON.stringify({ generated: new Date().toISOString(), cfg: CFG, results }, null, 2));
else if (wantMd) console.log(mdReport(results));
else if (!outBase || verbose) termReport(results, verbose);

if (strict) {
  const bad = results.filter((r) => !r.noindex && r.verdict === 'FAIL');
  if (bad.length) {
    console.error(`\n[strict] ${bad.length} 个页面已放开收录但不达标`);
    process.exit(1);
  }
}
