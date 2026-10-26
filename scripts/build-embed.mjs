#!/usr/bin/env node
/**
 * build-embed.mjs —— 把站内工具做成可嵌入 widget，产出 /embed/*.html
 * ---------------------------------------------------------------
 * 外链最省力的形态不是求人写文章，而是让别人**主动**把东西搬到自己站上。
 * 搬运的那一刻，回链就跟着过去了，而且这类链接是编辑器亲手放的，
 * 不是批量生成的垃圾链。
 *
 * 做法：每个工具页抽 <main>，去掉页头页脚、广告脚本、登录脚本，
 * 底部留一行 "Powered by" 指向工具原页。产出两个东西：
 *   embed/<slug>.html          可直接被 iframe 引用的裸页
 *   embed/index.html           嵌入代码一览，带一键复制
 *
 * 三个必须守住的点：
 *   1. 资源路径。工具页的资源本来就写成 /assets/ 绝对路径，所以 iframe 里不会断。
 *      脚本仍然扫一遍残余的 ../ ，有就报错——宁可构建失败也不发一张白页出去。
 *   2. embed 页与原页内容重复，所以 embed 页一律 noindex,follow，
 *      canonical 指回工具原页。被抓走的只有原页。
 *   3. 不嵌广告。广告放在别人站上的 iframe 里，既违反 AdSense 政策
 *      （广告不得置于无内容的框内），也拿不到展示。
 *
 * 用法：
 *   node scripts/build-embed.mjs            # 生成
 *   node scripts/build-embed.mjs --check    # 只校验，不写盘（给 CI 用）
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = 'https://haowordtool.com';
const OUT_DIR = path.join(ROOT, 'embed');
const CHECK_ONLY = process.argv.includes('--check');

/**
 * 工具页 → slug。
 *
 * 有四个工具同时存在 tools/x.html 和 tools/x/index.html。查过内容：.html 是英文版，
 * 目录版是 zh-CN 版——不是重复页，是两个语言版本挂在同一条路径上。嵌入只取英文版，
 * 因为嵌入方九成是英文站；同一个 slug 出现两次会让后面的覆盖前面的。
 */
function collectTools() {
  const toolsDir = path.join(ROOT, 'tools');
  const bySlug = new Map();
  for (const e of fs.readdirSync(toolsDir, { withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith('.html')) {
      if (e.name === 'index.html') continue;
      const slug = e.name.replace(/\.html$/, '');
      bySlug.set(slug, { slug, rel: `tools/${e.name}`, rank: 0 });
    } else if (e.isDirectory()) {
      const idx = path.join(toolsDir, e.name, 'index.html');
      if (!fs.existsSync(idx)) continue;
      // rank 1 = 目录版（zh），只有在没有同名 .html 时才用它
      if (!bySlug.has(e.name)) bySlug.set(e.name, { slug: e.name, rel: `tools/${e.name}/index.html`, rank: 1 });
    }
  }
  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * 从工具页里剥出可嵌入的部分。
 *
 * 踩过的坑：工具的功能脚本写在 </main> 之后（第 150 行左右），只抽 <main>
 * 会得到一张只有输入框、点了没反应的死页。所以脚本从整个文档里单独收。
 */
function extract(html, rel, slug) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (!main) throw new Error(`${rel}: 找不到 <main>，无法确定嵌入范围`);

  // 页面自带的 <style> 必须带上，否则工具在别人站上会变形
  const styles = [...html.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].map((m) => m[0]);

  const title = (html.match(/<title>([^<]*)<\/title>/i) || [, ''])[1].trim();

  // 功能脚本：排除广告、登录、站内推荐、统计、结构化数据
  const DROP = /adsbygoogle|googletagmanager|gtag\/js|google-analytics|supabase-auth|related-tools|application\/ld\+json/i;
  const scripts = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)]
    .map((m) => m[0])
    .filter((s) => !DROP.test(s));

  // 站内相对链接：在 /embed/ 下会全部 404。统一改成 /tools/ 绝对路径。
  // （../assets/ 这类不用动，/embed/../assets 正好落到 /assets）
  const body = main[1]
    .replace(/<ins\b[^>]*class=["'][^"']*adsbygoogle[^"']*["'][\s\S]*?<\/ins>/gi, '')
    .replace(/<script\b[^>]*(?:related-tools|supabase-auth)[^>]*>\s*<\/script>/gi, '')
    .replace(/<div\b[^>]*class=["'][^"']*related-tools[^"']*["'][\s\S]*?<\/div>/gi, '')
    .replace(/\bhref=(["'])(index|[a-z0-9-]+)\.html\1/gi, (_m, q, name) => `href=${q}/tools/${name}.html${q}`);

  return { body, styles, scripts, title };
}

function page({ slug, body, styles, scripts, title }) {
  const canonical = `${SITE}/tools/${slug}.html`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Embeddable</title>
<!-- 嵌入页与原页同内容，一律 noindex，权重只归原页 -->
<meta name="robots" content="noindex, follow">
<meta name="description" content="Embeddable ${title.replace(/"/g, '&quot;')} widget — runs entirely in the browser, no sign-up, no upload.">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/assets/tools.css">
${styles.join('\n')}
<style>
  /* 嵌入态：去掉页边距，压掉大标题，只留工具本体 */
  html,body{margin:0;padding:0;background:#0b0f14}
  body{font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#e6edf3}
  .embed-wrap{padding:14px 14px 0}
  .embed-wrap h1{font-size:18px;margin:0 0 10px;line-height:1.3}
  .embed-wrap > p:first-of-type{font-size:13px;color:#8b9bb0;margin:0 0 14px}
  .embed-credit{display:flex;align-items:center;justify-content:space-between;gap:12px;
    padding:10px 14px;margin-top:14px;border-top:1px solid rgba(255,255,255,.08);
    font-size:12px;color:#8b9bb0;background:#0b0f14}
  .embed-credit a{color:#4fd1c5;text-decoration:none;font-weight:600}
  .embed-credit a:hover{text-decoration:underline}
</style>
</head>
<body>
<div class="embed-wrap">
${body}
</div>
<div class="embed-credit">
  <span>Free, browser-based, no sign-up.</span>
  <a href="${canonical}" target="_blank" rel="noopener">${title.split('—')[0].trim()} by HaoWordTool →</a>
</div>
${scripts.join('\n')}
</body>
</html>
`;
}

function indexPage(tools) {
  const rows = tools
    .map((t) => {
      const code = `<iframe src="${SITE}/embed/${t.slug}.html" width="100%" height="${t.h}" style="border:0;border-radius:12px;overflow:hidden" loading="lazy" title="${t.title.replace(/"/g, '&quot;')}"></iframe>`;
      return `    <tr>
      <td><strong>${t.title.split('—')[0].trim()}</strong><br><span class="u">/tools/${t.slug}.html</span></td>
      <td><textarea readonly rows="3" onclick="this.select()">${code.replace(/</g, '&lt;')}</textarea></td>
    </tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Embed these tools — free widgets for your site | HaoWordTool</title>
<meta name="description" content="Copy-paste iframe snippets for ${tools.length} free browser-based tools: calculators, converters, image compressors, text diff, timers. No sign-up, no tracking inside the widget.">
<link rel="canonical" href="${SITE}/embed/">
<meta name="robots" content="index, follow">
<link rel="stylesheet" href="/assets/tools.css">
<style>
  body{background:#0b0f14;color:#e6edf3;font-family:Inter,system-ui,sans-serif;margin:0}
  .wrap{max-width:960px;margin:0 auto;padding:40px 20px 80px}
  h1{font-size:30px;margin:0 0 12px}
  .lede{color:#8b9bb0;font-size:15px;line-height:1.7;margin:0 0 28px}
  table{width:100%;border-collapse:collapse}
  td{border-top:1px solid rgba(255,255,255,.08);padding:14px 8px;vertical-align:top;font-size:14px}
  .u{color:#8b9bb0;font-size:12px;font-family:ui-monospace,monospace}
  textarea{width:100%;box-sizing:border-box;background:#111823;color:#9fe8df;border:1px solid rgba(255,255,255,.12);
    border-radius:8px;padding:8px 10px;font-family:ui-monospace,monospace;font-size:11.5px;resize:vertical}
  ol{color:#8b9bb0;font-size:14px;line-height:1.9;padding-left:20px}
  a{color:#4fd1c5}
</style>
</head>
<body>
<div class="wrap">
<h1>Embed a tool on your site</h1>
<p class="lede">${tools.length} free tools that run entirely in the browser. Paste one snippet, get a working widget.
No sign-up, no API key, no tracking script inside the frame. Attribution link is included in the snippet — keep it if you can, it is the only thing we ask for.</p>
<ol>
  <li>Copy the snippet for the tool you want.</li>
  <li>Paste it where an iframe is allowed (most CMSs, WordPress Custom HTML block, Ghost, Notion embed, plain HTML).</li>
  <li>Height is a suggestion — resize it to fit your column width.</li>
</ol>
<table>
${rows}
</table>
</div>
</body>
</html>
`;
}

// ---- main ----
const tools = collectTools();
const built = [];
const problems = [];

for (const t of tools) {
  const html = fs.readFileSync(path.join(ROOT, t.rel), 'utf8');
  let parts;
  try {
    parts = extract(html, t.rel);
  } catch (err) {
    problems.push(err.message);
    continue;
  }
  const out = page({ slug: t.slug, ...parts });

  // 残余相对链接 = 在 /embed/ 下会 404，必须挡在构建阶段。
  // 只放行三种：绝对站内 /xxx、带协议的、纯锚点。
  const leftovers = [...out.matchAll(/(?:src|href)="([^"]*)"/g)]
    .map((m) => m[1])
    .filter((u) => u && !/^(?:[a-z]+:)?\/\//i.test(u) && !u.startsWith('/') && !u.startsWith('#'));
  if (leftovers.length) problems.push(`${t.rel}: 残留相对链接 ${[...new Set(leftovers)].slice(0, 3).join(', ')}`);
  if (/adsbygoogle|supabase-auth|googletagmanager/.test(out)) problems.push(`${t.rel}: 不该进 iframe 的脚本没清干净`);
  if (!/<script/i.test(out)) problems.push(`${t.rel}: 没有脚本，工具是死的`);
  // what-is-my-ip / world-clock 没有输入控件，靠脚本自己渲染结果显示，属于正常
  if (!/<(?:input|button|textarea|select|canvas)\b/i.test(out) && !/textContent|innerHTML|createElement/i.test(out)) {
    problems.push(`${t.rel}: 既无可交互控件，也没有渲染逻辑`);
  }

  // 高度按正文体量估，避免 iframe 内出现双滚动条
  const h = /\bcalculator\b|converter|word-counter|character-counter|text-diff|remove-line-breaks/.test(t.slug) ? 720 : 620;
  built.push({ slug: t.slug, rel: t.rel, title: parts.title, html: out, h });
}

if (problems.length) {
  console.error('构建失败：');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

if (!CHECK_ONLY) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const b of built) fs.writeFileSync(path.join(OUT_DIR, `${b.slug}.html`), b.html);
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexPage(built));
}

console.log(`${CHECK_ONLY ? '校验' : '生成'}通过：${built.length} 个嵌入页`);
for (const b of built) console.log(`  /embed/${b.slug}.html  ←  ${b.rel}`);
