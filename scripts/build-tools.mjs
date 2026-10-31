#!/usr/bin/env node
/**
 * build-tools.mjs —— 从 spec 生成工具页
 * ---------------------------------------------------------------
 * 为什么要有生成器：
 *   100 个工具手写就是 100 份重复的外壳（head 12 行、header 20 行、footer 15 行、
 *   JSON-LD 30 行）。改一个 canonical 要改 100 遍，改漏一遍就是一条错信号。
 *   所以壳只写一次，工具只描述「输入什么、算什么、输出什么」。
 *
 * spec 里 compute 是**真函数**，不是字符串。生成时用 toString() 落到页面里，
 * 同时在构建期直接调用它算示例——示例里的数字是被同一个函数算出来的，
 * 不是写死的。改了逻辑忘了改示例这种事，从结构上就不可能发生。
 *
 * 用法：
 *   node scripts/build-tools.mjs            # 生成 / 覆盖所有 spec 里的工具页
 *   node scripts/build-tools.mjs --check    # 只校验，不写盘
 *   node scripts/build-tools.mjs --list      # 打印清单与总数
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const SITE = 'https://haowordtool.com';
const SPEC_DIR = path.join(ROOT, 'scripts/tool-specs');
const OUT_DIR = path.join(ROOT, 'tools');

const CHECK = process.argv.includes('--check');
const LIST = process.argv.includes('--list');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 载入全部 spec：每个文件导出 default 数组 */
async function loadSpecs() {
  const all = [];
  const seen = new Map();
  for (const f of fs.readdirSync(SPEC_DIR).filter((x) => x.endsWith('.mjs')).sort()) {
    const mod = await import(pathToFileURL(path.join(SPEC_DIR, f)).href + `?t=${Date.now()}`);
    for (const s of mod.default || []) {
      if (!s.slug) throw new Error(`${f}: 有工具缺 slug`);
      if (seen.has(s.slug)) throw new Error(`slug 重复：${s.slug}（${f} 与 ${seen.get(s.slug)}）`);
      seen.set(s.slug, f);
      all.push(s);
    }
  }
  return all;
}

/**
 * 已经手工存在的工具，生成器不碰——避免覆盖带多语言 hreflang 的旧页。
 *
 * 但生成器自己产出的页必须允许重跑覆盖，否则改一次模板就再也生成不了第二次。
 * 用一份清单记住哪些是自己写的，其余一律视为手写。
 */
const MANIFEST = path.join(OUT_DIR, '.generated.json');
function ownGenerated() {
  try {
    return new Set(JSON.parse(fs.readFileSync(MANIFEST, 'utf8')));
  } catch {
    return new Set();
  }
}

function existingTools() {
  const mine = ownGenerated();
  const out = new Set();
  for (const e of fs.readdirSync(OUT_DIR, { withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith('.html') && e.name !== 'index.html') {
      const slug = e.name.replace(/\.html$/, '');
      if (!mine.has(slug)) out.add(slug);
    } else if (e.isDirectory()) {
      const slug = e.name;
      if (fs.existsSync(path.join(OUT_DIR, slug, 'index.html')) && !mine.has(slug)) out.add(slug);
    }
  }
  return out;
}

/** 字段 → 表单控件 */
function fieldHTML(f) {
  const id = `f_${f.k}`;
  const lab = `<label for="${id}">${f.label}${f.unit ? ` <span class="u">(${f.unit})</span>` : ''}</label>`;
  if (f.type === 'num') {
    return `<div class="fld">${lab}<input id="${id}" type="number" inputmode="decimal" step="${f.step ?? 'any'}" value="${f.val ?? ''}" ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''}></div>`;
  }
  if (f.type === 'text') {
    return `<div class="fld">${lab}<input id="${id}" type="text" value="${esc(f.val ?? '')}" placeholder="${esc(f.ph ?? '')}" spellcheck="false"></div>`;
  }
  if (f.type === 'area') {
    return `<div class="fld">${lab}<textarea id="${id}" rows="${f.rows ?? 6}" placeholder="${esc(f.ph ?? '')}" spellcheck="false">${esc(f.val ?? '')}</textarea></div>`;
  }
  if (f.type === 'sel') {
    const opts = f.opts.map((o) => {
      const [val, label] = Array.isArray(o) ? o : [o, o];
      return `<option value="${esc(val)}"${val === f.val ? ' selected' : ''}>${esc(label)}</option>`;
    }).join('');
    return `<div class="fld">${lab}<select id="${id}">${opts}</select></div>`;
  }
  if (f.type === 'file') {
    return `<div class="fld">${lab}<input id="${id}" type="file" accept="${f.accept || 'image/*'}"></div>`;
  }
  if (f.type === 'chk') {
    return `<div class="fld chk"><input id="${id}" type="checkbox"${f.val ? ' checked' : ''}><label for="${id}">${f.label}</label></div>`;
  }
  throw new Error(`未知字段类型 ${f.type}（${f.k}）`);
}

/** 输出容器 */
function outHTML(o) {
  if (o.type === 'img') {
    return `<div class="out-block"><div class="out-head"><span>${o.label}</span></div><img id="o_${o.k}" alt="" style="max-width:100%;display:block;background: repeating-conic-gradient(#1a2029 0% 25%, #131920 0% 50%) 50%/16px 16px"></div>`;
  }
  if (o.type === 'code' || o.type === 'text') {
    return `<div class="out-block"><div class="out-head"><span>${o.label}</span><button class="copy" data-copy="${o.k}">Copy</button></div><pre id="o_${o.k}">—</pre></div>`;
  }
  return `<div class="metric"><div class="metric-label">${o.label}</div><div class="metric-value" id="o_${o.k}">—</div></div>`;
}

/** 正文：把 body 数组拼成段落，'## x' 转 h2 */
function bodyHTML(s) {
  return s.body
    .map((p) => (p.startsWith('## ') ? `<h2>${esc(p.slice(3))}</h2>` : `<p>${p}</p>`))
    .join('\n');
}

function faqJSON(s) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (s.faq || []).map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

/** 相关工具：从全量里挑同类，凑 4 个，纯静态链接 */
function related(s, all) {
  const same = all.filter((x) => x.slug !== s.slug && x.cat === s.cat).slice(0, 3);
  const fill = all.filter((x) => x.slug !== s.slug && x.cat !== s.cat).slice(0, 4 - same.length);
  return [...same, ...fill].slice(0, 4);
}

const RUNTIME = `
const FIELDS = __FIELDS__;
const OUTS = __OUTS__;
const COMPUTE = __COMPUTE__;

const $ = (id) => document.getElementById(id);
const val = (f, el) => {
  if (f.type === 'chk') return el.checked;
  if (f.type === 'num') return el.value === '' ? NaN : Number(el.value);
  return el.value;
};

function readFile(el) {
  return new Promise((res, rej) => {
    const file = el.files && el.files[0];
    if (!file) return res('');
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error('Could not read the file'));
    r.readAsDataURL(file);
  });
}

async function collect() {
  const v = {};
  for (const f of FIELDS) {
    const el = $('f_' + f.k);
    v[f.k] = f.type === 'file' ? await readFile(el) : val(f, el);
  }
  return v;
}

function put(k, x) {
  const el = $('o_' + k);
  if (!el) return;
  if (el.tagName === 'IMG') { el.src = typeof x === 'string' ? x : ''; return; }
  if (typeof x === 'string' || typeof x === 'number') el.textContent = String(x);
  else if (x && typeof x === 'object' && 'text' in x) el.textContent = x.text;
  else el.textContent = JSON.stringify(x);
}

let timer = null;
async function run(now) {
  // 慢一点再算：textarea 每次按键都跑一遍，长文本上会卡
  if (!now) { clearTimeout(timer); timer = setTimeout(() => run(true), 120); return; }
  try {
    const res = await COMPUTE(await collect());
    for (const o of OUTS) put(o.k, res[o.k] === undefined ? '—' : res[o.k]);
    document.body.classList.remove('has-error');
  } catch (err) {
    for (const o of OUTS) put(o.k, '—');
    document.body.classList.add('has-error');
    const box = $('err');
    if (box) box.textContent = err && err.message ? err.message : String(err);
  }
}

for (const f of FIELDS) {
  const el = $('f_' + f.k);
  if (!el) continue;
  const evt = el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'file' ? 'change' : 'input';
  el.addEventListener(evt, () => run(false));
}

document.querySelectorAll('.copy').forEach((b) => {
  b.addEventListener('click', async () => {
    const el = $('o_' + b.dataset.copy);
    try { await navigator.clipboard.writeText(el.textContent); b.textContent = 'Copied'; }
    catch { b.textContent = 'Press Ctrl+C'; }
    setTimeout(() => (b.textContent = 'Copy'), 1400);
  });
});

run(true);
__TICK__
`;

function page(s, all) {
  const url = `${SITE}/tools/${s.slug}.html`;
  const rel = related(s, all);
  const faq = faqJSON(s);
  const app = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: s.name,
    url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: s.desc,
  };
  const crumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: `${SITE}/tools/` },
      { '@type': 'ListItem', position: 3, name: s.name, item: url },
    ],
  };

  // 替换必须传函数而不是字符串。compute 的源码里有 `$` 和反引号，
  // 字符串形式的 replace 会把 $` 当成「匹配位置之前的全部内容」，
  // 结果是把模板前半段插进了函数体里——生成出来的页面语法错误，但不报错。
  const runtime = RUNTIME
    .replace('__FIELDS__', () => JSON.stringify(s.fields.map(({ k, label, type, unit, opts }) => ({ k, label, type, unit, opts }))))
    .replace('__OUTS__', () => JSON.stringify(s.outs.map(({ k, label, type }) => ({ k, label, type }))))
    .replace('__COMPUTE__', () => s.compute.toString())
    // 有 tick 的工具（验证码、时钟）自己会走，不用用户再点一次
    .replace('__TICK__', () => (s.tick ? `setInterval(() => run(true), ${s.tick});` : ''));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4489946300243174" crossorigin="anonymous"></script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(s.title)}</title>
<meta name="description" content="${esc(s.desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${url}">
<link rel="alternate" hreflang="x-default" href="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/tools.css">
<meta property="og:title" content="${esc(s.title)}">
<meta property="og:description" content="${esc(s.desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<script type="application/ld+json">
${JSON.stringify(app, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(faq, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(crumb, null, 2)}
</script>
<style>
.fld { margin-bottom: 14px; }
.fld label { display:block; font-size:13px; color:var(--muted); margin-bottom:6px; }
.fld .u { color:var(--muted-2); }
.fld input[type=text], .fld input[type=number], .fld select, .fld textarea {
  width:100%; box-sizing:border-box; background:rgba(255,255,255,.04); color:var(--text,#e6edf3);
  border:1px solid var(--border-strong,rgba(255,255,255,.14)); border-radius:10px; padding:10px 12px;
  font-size:14px; font-family:inherit;
}
.fld textarea { font-family:var(--mono,ui-monospace,monospace); font-size:13px; line-height:1.6; resize:vertical; }
.fld.chk { display:flex; align-items:center; gap:8px; }
.fld.chk label { margin:0; font-size:14px; color:var(--text,#e6edf3); }
.out-grid { display:grid; gap:10px; margin-top:6px; }
.metric { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
  padding:12px 14px; border-radius:10px; background:rgba(79,209,197,.06); border:1px solid rgba(79,209,197,.18); }
.metric-label { font-size:13px; color:var(--muted); }
.metric-value { font-size:18px; font-weight:700; color:#4fd1c5; font-variant-numeric:tabular-nums; }
.out-block { margin-top:12px; border:1px solid var(--border-strong,rgba(255,255,255,.14)); border-radius:10px; overflow:hidden; }
.out-head { display:flex; align-items:center; justify-content:space-between; padding:8px 12px;
  background:rgba(255,255,255,.03); font-size:12.5px; color:var(--muted); }
.out-block pre { margin:0; padding:12px; font-family:var(--mono,ui-monospace,monospace); font-size:12.5px;
  line-height:1.7; white-space:pre-wrap; word-break:break-word; max-height:340px; overflow:auto; }
.copy { background:none; border:1px solid var(--border-strong,rgba(255,255,255,.16)); color:var(--muted);
  border-radius:6px; padding:2px 8px; font-size:11.5px; cursor:pointer; font-family:inherit; }
.copy:hover { color:#4fd1c5; border-color:rgba(79,209,197,.4); }
#err { color:#fca5a5; font-size:13px; margin-top:10px; min-height:18px; }
.example { margin:20px 0; padding:14px 16px; border-left:3px solid rgba(79,209,197,.5);
  background:rgba(79,209,197,.05); border-radius:0 10px 10px 0; }
.example h3 { margin:0 0 6px; font-size:14px; }
.example p { margin:0; font-size:13.5px; color:var(--muted); }
.example code { color:#7de8dc; }
.related-tools { margin-top:28px; }
.related-tools ul { list-style:none; padding:0; display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:10px; }
.related-tools a { display:block; padding:12px 14px; border:1px solid var(--border-strong,rgba(255,255,255,.1));
  border-radius:10px; text-decoration:none; color:var(--text,#e6edf3); font-size:14px; }
.related-tools a:hover { border-color:rgba(79,209,197,.4); }
</style>
</head>
<body>
<div class="bg"><div class="orb orb-1"></div><div class="orb orb-2"></div></div>
<header id="header">
  <div class="wrap">
    <nav class="nav">
      <a href="index.html" class="logo"><img src="/assets/haowordtool-logo.png" alt="HaoWordTool" style="height:38px;width:auto;"></a>
      <div class="nav-right"><a href="index.html" class="back" style="font-size:13px;color:var(--muted);text-decoration:none">← All tools</a></div>
    </nav>
  </div>
</header>
<main>
  <div class="wrap tool-page">
    <h1 style="margin-top:16px">${esc(s.h1 || s.name)}</h1>
    <p class="lead">${esc(s.lead)}</p>

    <div class="card">
      ${s.fields.map(fieldHTML).join('\n      ')}
      <div class="out-grid">
        ${s.outs.map(outHTML).join('\n        ')}
      </div>
      <div id="err"></div>
    </div>

    ${s.example ? `<div class="example"><h3>Worked example</h3><p>${s.example}</p></div>` : ''}

    <div class="seo-content">
${bodyHTML(s)}
    </div>

    <div class="related-tools">
      <h2>Related tools</h2>
      <ul>
        ${rel.map((r) => `<li><a href="${r.slug}.html">${esc(r.name)}</a></li>`).join('\n        ')}
      </ul>
    </div>
  </div>
</main>
<footer style="padding:32px 0;margin-top:40px;border-top:1px solid rgba(255,255,255,.07)">
  <div class="wrap" style="font-size:13px;color:var(--muted)">
    <a href="/" style="color:var(--muted)">HaoWordTool</a> ·
    <a href="/tools/" style="color:var(--muted)">All tools</a> ·
    <a href="/privacy.html" style="color:var(--muted)">Privacy</a> ·
    <a href="/terms.html" style="color:var(--muted)">Terms</a> ·
    <a href="/contact.html" style="color:var(--muted)">Contact</a>
    <p style="margin:10px 0 0">Every tool on this site runs entirely in your browser. Nothing you type or upload is sent to a server.</p>
  </div>
</footer>
<script>
${runtime}
</script>
<script type="application/json" id="relatedData">${JSON.stringify(rel.map((r) => r.slug))}</script>
<script src="/assets/related-tools.js" defer></script>
</body>
</html>
`;
}

/**
 * 重建 tools/index.html 里的工具数组和分类标签。
 *
 * 手写 100 条 {cat,name,desc,icon,link} 是纯体力活，而且漏一条就是一条死链。
 * 这里以 spec 为唯一来源，索引页跟工具页永远同源。
 *
 * 19 个原工具没有 spec（它们带多语言 hreflang，不能重新生成），
 * 所以单独列在这里，只补索引信息。
 */
const HAND = [
  ['currency-converter', 'Currency Converter', 'Real-time rates, 30+ currencies', 'convert', 'Convert'],
  ['calculator', 'Calculator', 'Basic arithmetic, keyboard-friendly', 'convert', 'Convert'],
  ['mortgage-calculator', 'Mortgage Calculator', 'Monthly payment & total interest', 'convert', 'Convert'],
  ['unit-converter', 'Unit Converter', 'Length, weight, temperature, area', 'convert', 'Convert'],
  ['image-compressor', 'Image Compressor', 'Compress JPG / PNG in your browser', 'image', 'Image'],
  ['resize-image', 'Resize Image', 'Custom dimensions, keep aspect ratio', 'image', 'Image'],
  ['qr-code-generator', 'QR Code Generator', 'URL or text to QR, downloadable', 'life', 'Everyday'],
  ['word-counter', 'Word Counter', 'Characters, words, paragraphs, read time', 'life', 'Everyday'],
  ['bmi-calculator', 'BMI Calculator', 'Body mass index with health ranges', 'life', 'Everyday'],
  ['age-calculator', 'Age Calculator', 'Exact age & birthday countdown', 'life', 'Everyday'],
  ['timer', 'Timer / Stopwatch', 'Countdown and count-up', 'life', 'Everyday'],
  ['world-clock', 'World Clock', 'Current time in major cities', 'life', 'Everyday'],
  ['what-is-my-ip', 'What Is My IP', 'Public IP, location & ISP', 'network', 'Network'],
  ['speed-test', 'Internet Speed Test', 'Download, upload, ping & jitter', 'network', 'Network'],
  ['password-generator', 'Password Generator', 'Custom length, generated locally', 'network', 'Network'],
  ['text-diff', 'Text Diff', 'Compare two texts side by side', 'text', 'Text'],
  ['case-converter', 'Case Converter', 'UPPER, lower, Title, Sentence', 'text', 'Text'],
  ['character-counter', 'Character Counter', 'Characters, with and without spaces', 'text', 'Text'],
  ['remove-line-breaks', 'Remove Line Breaks', 'Strip line breaks and extra spaces', 'text', 'Text'],
];

/** spec 的 cat 到索引页分组 */
const GROUP = {
  security: ['security', 'Security'],
  text: ['text', 'Text'],
  math: ['convert', 'Convert'],
  health: ['life', 'Everyday'],
  media: ['image', 'Image'],
  dev: ['network', 'Network'],
};

const ICON = {
  convert: '<path d="M4 7h16M4 12h10M4 17h7"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  life: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  network: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
  security: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  text: '<path d="M4 7h16M4 12h10M4 17h16"/>',
};

function rebuildIndex(specs) {
  const file = path.join(OUT_DIR, 'index.html');
  const html = fs.readFileSync(file, 'utf8');

  const rows = [];
  for (const [slug, name, desc, cat, catName] of HAND) {
    rows.push({ slug, name, desc, cat, catName });
  }
  for (const s of specs) {
    const [cat, catName] = GROUP[s.cat] || ['life', 'Everyday'];
    rows.push({ slug: s.slug, name: s.name, desc: s.desc.length > 46 ? s.desc.slice(0, 44).replace(/[,;.\s]+$/, '') + '…' : s.desc, cat, catName });
  }
  rows.sort((a, b) => a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name));

  const arr = 'const tools = [\n' + rows.map((r) => {
    const icon = ICON[r.cat] || ICON.life;
    const esc2 = (x) => x.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `  {cat:"${r.cat}",catName:"${r.catName}",name:"${esc2(r.name)}",desc:"${esc2(r.desc)}",icon:'${icon}',link:"${r.slug}.html"}`;
  }).join(',\n') + '\n];';

  const start = html.indexOf('const tools = [');
  const end = html.indexOf('\n];', start);
  if (start < 0 || end < 0) throw new Error('tools/index.html 里找不到 const tools 数组');
  let out = html.slice(0, start) + arr + html.slice(end + 3);

  // 分类标签按现有分组生成，顺序固定，避免每次构建顺序漂移
  const order = ['convert', 'text', 'image', 'network', 'life', 'security'];
  const seen = new Map();
  for (const r of rows) seen.set(r.cat, r.catName);
  const tabs = ['<button class="tab active" data-cat="all">All</button>']
    .concat(order.filter((c) => seen.has(c)).map((c) => `<button class="tab" data-cat="${c}">${seen.get(c)}</button>`))
    .join('\n      ');
  out = out.replace(/(<div class="tabs" id="tabs">\s*)[\s\S]*?(\s*<\/div>)/, `$1\n      ${tabs}$2`);

  fs.writeFileSync(file, out);
  const counts = order.filter((c) => seen.has(c)).map((c) => `${seen.get(c)} ${rows.filter((r) => r.cat === c).length}`).join(' / ');
  console.log(`索引重建：${rows.length} 个工具（${counts}）`);
}

// ---- main ----
const specs = await loadSpecs();
const existing = existingTools();

if (LIST) {
  const byCat = {};
  for (const s of specs) (byCat[s.cat] ||= []).push(s);
  for (const [c, arr] of Object.entries(byCat)) {
    console.log(`\n[${c}] ${arr.length}`);
    for (const s of arr) console.log(`  ${s.slug.padEnd(30)} ${s.name}`);
  }
  console.log(`\nspec 合计 ${specs.length} 个；已有 ${existing.size} 个；生成后总计 ${existing.size + specs.filter((s) => !existing.has(s.slug)).length}`);
  process.exit(0);
}

const problems = [];
const written = [];
for (const s of specs) {
  for (const k of ['slug', 'name', 'title', 'desc', 'lead', 'cat', 'fields', 'outs', 'compute', 'body']) {
    if (s[k] === undefined) problems.push(`${s.slug}: 缺 ${k}`);
  }
  if (!s.desc || s.desc.length > 165) problems.push(`${s.slug}: desc 长度 ${s.desc?.length}（>165 会被截断）`);
  if (typeof s.compute !== 'function') problems.push(`${s.slug}: compute 不是函数`);
  if (existing.has(s.slug)) { problems.push(`${s.slug}: 与已有工具重名，拒绝覆盖`); continue; }
  if (problems.length) continue;

  // 构建期真跑一遍 compute，确认不抛错、且输出键都齐。
  // 依赖 canvas / FileReader / DOMParser 的（图片处理类）在 Node 里跑不了，
  // 用 probe:false 显式跳过，而不是让它们靠 try/catch 混过去。
  try {
    if (s.probe === false) throw { skip: true };
    const probe = {};
    for (const f of s.fields) probe[f.k] = f.val !== undefined ? f.val : f.type === 'chk' ? false : f.type === 'num' ? 1 : '';
    const res = s.compute(probe);
    if (res && typeof res.then === 'function') res.then(() => {}).catch((e) => problems.push(`${s.slug}: compute 异步报错 ${e.message}`));
    else if (res && typeof res === 'object') {
      for (const o of s.outs) if (!(o.k in res)) problems.push(`${s.slug}: compute 没返回 ${o.k}`);
    }
  } catch (err) {
    if (!err || !err.skip) problems.push(`${s.slug}: compute 抛错 ${err && err.message}`);
  }

  const html = page(s, specs);

  // 内联脚本必须能解析。这一步是补出来的：`$` 在 String.replace 里有特殊含义，
  // 曾把模板前半段插进函数体，生成出来的页面点按钮没反应，而构建全程"通过"。
  // 静态检查一秒就能抓住这种问题。
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (!inline.length) problems.push(`${s.slug}: 页面里没有内联脚本，工具不会动`);
  else {
    try {
      new Function(inline.join('\n;\n'));
    } catch (err) {
      problems.push(`${s.slug}: 内联脚本语法错误 — ${err.message}`);
    }
  }

  written.push({ slug: s.slug, html });
}

if (problems.length) {
  console.error('构建失败：');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

if (!CHECK) {
  for (const w of written) fs.writeFileSync(path.join(OUT_DIR, `${w.slug}.html`), w.html);
  fs.writeFileSync(MANIFEST, JSON.stringify([...ownGenerated(), ...written.map((w) => w.slug)].sort(), null, 1) + '\n');
}

if (!CHECK) rebuildIndex(specs);

console.log(`${CHECK ? '校验' : '生成'}通过：${written.length} 个工具页${CHECK ? '' : '已写入 tools/'}`);
console.log(`工具总数：${existing.size} + ${written.length} = ${existing.size + written.length}`);
