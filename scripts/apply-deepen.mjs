#!/usr/bin/env node
/**
 * 把 content/deepen/*.html 的内容段注入到对应页面。
 *
 *   node scripts/apply-deepen.mjs            # 预览
 *   node scripts/apply-deepen.mjs --write    # 落盘
 *
 * 设计约束：
 * 1. 幂等 —— 用 <!-- deepen:start --> / <!-- deepen:end --> 包裹，重跑只替换中间段。
 * 2. 不改原有 DOM —— 只在 </main> 之前插一段 <section>，其余一字不动。
 *    （没有 <main> 的页面插在 footer 之前。）
 * 3. 样式独立 —— 只引入 /assets/deepen.css，不依赖各页原有 class，
 *    因此同一个片段可以安全放到三套不同主题的页面上。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content', 'deepen');
const WRITE = process.argv.includes('--write');
const START = '<!-- deepen:start -->';
const END = '<!-- deepen:end -->';
const CSS_TAG = '<link rel="stylesheet" href="/assets/deepen.css">';

/** 片段文件 → 目标页面 */
const MAP = {
  'ai-companion.html': 'ai-companion.html',
  'ai-workspace.html': 'ai-workspace.html',
  'delivery.html': 'delivery.html',
  'en-app-builder.html': 'en/app-builder.html',
  'en-ielts.html': 'en/ielts/index.html',
  'en-learn.html': 'en/learn/index.html',
  'faq.html': 'faq.html',
  'media-downloader.html': 'media-downloader.html',
  'multi-platform-publishing-checklist.html': 'multi-platform-publishing-checklist.html',
  'share.html': 'share.html',
  'suanli-chuhai.html': 'suanli-chuhai.html',
};

/**
 * 与 adsense-readiness.mjs 完全一致的口径：
 * 拉丁词按空格切，CJK 按 1.7 字折算成 1 词。
 * 两边口径必须相同，否则「我加厚了」和「闸门说还薄」会打架。
 */
function words(html) {
  const t = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const latin = (t.match(/[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9'’-]*/g) || []).length;
  const cjk = (t.match(/[\u3400-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/g) || []).length;
  return Math.round(latin + cjk / 1.7);
}

function inject(html, block) {
  const wrapped = `${START}\n${block.trim()}\n${END}`;

  // 已有标记 → 替换中间段
  if (html.includes(START) && html.includes(END)) {
    const s = html.indexOf(START);
    const e = html.indexOf(END) + END.length;
    return html.slice(0, s) + wrapped + html.slice(e);
  }

  // 新插入：优先 </main>，其次 footer 结构，最后 </body>
  let at = html.lastIndexOf('</main>');
  if (at < 0) at = html.search(/<(div|footer)\b[^>]*class="[^"]*footer/i);
  if (at < 0) at = html.lastIndexOf('</body>');
  if (at < 0) return null;

  return html.slice(0, at) + wrapped + '\n' + html.slice(at);
}

function ensureCss(html) {
  if (html.includes('/assets/deepen.css')) return html;
  const at = html.lastIndexOf('</head>');
  if (at < 0) return html;
  return html.slice(0, at) + CSS_TAG + '\n' + html.slice(at);
}

let ok = 0;
const rows = [];
for (const [frag, rel] of Object.entries(MAP)) {
  const fragPath = path.join(CONTENT, frag);
  const pagePath = path.join(ROOT, rel);
  if (!fs.existsSync(fragPath)) {
    rows.push({ rel, status: '片段缺失', before: '-', after: '-', added: 0 });
    continue;
  }
  if (!fs.existsSync(pagePath)) {
    rows.push({ rel, status: '页面缺失', before: '-', after: '-', added: 0 });
    continue;
  }
  const block = fs.readFileSync(fragPath, 'utf8');
  const before = fs.readFileSync(pagePath, 'utf8');
  // 原词数：若页面上已有旧片段，先把它剥掉，避免重复注入时虚高
  const stripBlock = (s) => s.replace(new RegExp(`${START}[\\s\\S]*?${END}`, 'g'), ' ');
  const beforeWords = words(stripBlock(before));

  let after = inject(before, block);
  if (after === null) {
    rows.push({ rel, status: '无插入点', before: beforeWords, after: '-', added: 0 });
    continue;
  }
  after = ensureCss(after);
  const added = words(block);
  // 新词数按落盘后的真实内容算（含片段），这才是闸门会看到的数
  const afterWords = words(after);

  if (WRITE && after !== before) fs.writeFileSync(pagePath, after, 'utf8');
  if (after !== before) ok++;
  rows.push({ rel, status: after === before ? '已是最新' : '待写入', before: beforeWords, after: afterWords, added });
}

const pad = (s, n) => String(s).padEnd(n);
console.log(pad('页面', 46) + pad('原词数', 9) + pad('片段词数', 10) + pad('新词数', 9) + '状态');
console.log('-'.repeat(88));
for (const r of rows) {
  console.log(pad(r.rel, 46) + pad(r.before, 9) + pad(r.added || '-', 10) + pad(r.after, 9) + r.status);
}
console.log('-'.repeat(88));
console.log(`${rows.length} 页，${ok} 页有改动${WRITE ? '' : '（预览，未落盘；加 --write 生效）'}`);
