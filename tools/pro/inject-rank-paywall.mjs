#!/usr/bin/env node
/**
 * inject-rank-paywall.mjs
 * 把 ai-tools/rank/index.html 改成付费墙版本。
 *
 * 改法：
 *   · 前 FREE_ROWS 行保持静态完整（SEO 索引 + 免费钩子）
 *   · 之后的行的三个指标列清空，打上 data-pro-cell 标记，
 *     由 /assets/rank-pro.mjs 在 Pro 状态下从 Supabase 补
 *   · 表格下方插入解锁条，head 加样式，body 尾加脚本
 *
 * 幂等：重复跑不会叠加。已经注入过的标记会被识别并跳过。
 *
 * 用法:
 *   node tools/pro/inject-rank-paywall.mjs            # 就地改写（自动 .bak 备份）
 *   node tools/pro/inject-rank-paywall.mjs --dry      # 只打印将要改什么
 *   node tools/pro/inject-rank-paywall.mjs --revert   # 从 .bak 还原
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const TARGET = resolve(ROOT, 'ai-tools/rank/index.html');
const BAK = TARGET + '.bak';

const FREE_ROWS = 10;

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const REVERT = args.includes('--revert');

/* ---------- 还原 ---------- */

if (REVERT) {
  if (!existsSync(BAK)) {
    console.error('[x] 没有备份文件 ' + BAK);
    process.exit(1);
  }
  copyFileSync(BAK, TARGET);
  console.log('[ok] 已从备份还原');
  process.exit(0);
}

/* ---------- 工具 ---------- */

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ---------- 主流程 ---------- */

let html = readFileSync(TARGET, 'utf8');

if (html.includes('data-pro-cell') && html.includes('/assets/rank-pro.mjs')) {
  console.log('[=] 已经注入过，跳过。要重做先 --revert');
  process.exit(0);
}

// 1. 备份
if (!DRY && !existsSync(BAK)) {
  copyFileSync(TARGET, BAK);
  console.log('[ok] 备份 → ai-tools/rank/index.html.bak');
}

/* --- 2. 重写 tbody --- */

const tbMatch = html.match(/(<tbody[^>]*id="tb"[^>]*>)([\s\S]*?)(<\/tbody>)/);
if (!tbMatch) {
  console.error('[x] 未找到 tbody#tb');
  process.exit(1);
}

const trRe = /<tr\b([^>]*)>([\s\S]*?)<\/tr>/g;
const rows = [];
let m;
while ((m = trRe.exec(tbMatch[2])) !== null) rows.push({ attrs: m[1], inner: m[2] });

/** 取第 n 个 td 的整体标签 */
function setCell(inner, index, newHtml) {
  let i = 0;
  return inner.replace(/<td\b([^>]*)>([\s\S]*?)<\/td>/g, (full) => {
    const cur = i++;
    return cur === index ? newHtml : full;
  });
}

function getCell(inner, index) {
  const cells = [...inner.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/g)];
  return cells[index] ? cells[index][2] : '';
}

const newRows = rows.map((r, idx) => {
  const rankNo = idx + 1;
  const isFree = rankNo <= FREE_ROWS;
  const domain = (getCell(r.inner, 1).match(/class="dom"[^>]*>([^<]+)</) || [])[1] || '';

  if (isFree) {
    // 免费行：原样，只补 data-free 标记
    return `<tr${r.attrs} data-free="1">${r.inner}</tr>`;
  }

  // 付费行：指标列清空，打标记；域名/简介保留给 SEO
  // 占位符用「——」而不是假数字：模糊态下看着像被遮住，但源码里不会有可被误读为真值的内容
  let inner = r.inner;
  inner = setCell(inner, 3, `<td class="num" data-pro-cell="visits" data-domain="${esc(domain)}"><span class="pro-blur">——</span></td>`);
  inner = setCell(inner, 4, `<td class="up" data-pro-cell="growth" data-domain="${esc(domain)}"><span class="pro-blur">——</span></td>`);
  inner = setCell(inner, 5, `<td class="num st" data-pro-cell="type" data-domain="${esc(domain)}"><span class="pro-blur">——</span></td>`);

  return `<tr${r.attrs} data-free="0" data-domain="${esc(domain)}">${inner}</tr>`;
});

html = html.replace(tbMatch[0], tbMatch[1] + '\n\n      ' + newRows.join('\n\n      ') + '\n    ' + tbMatch[3]);

/* --- 3. head 加样式 --- */

if (!html.includes('/assets/pro-gate.css')) {
  html = html.replace('</head>', `<link rel="stylesheet" href="/assets/pro-gate.css">\n</head>`);
}

/* --- 4. 表格下方插入解锁条 --- */

const lockBar = `
  <div class="pro-lockbar" data-pro-hidden>
    <div class="pro-lockbar-txt">
      <strong>还有 9 行被锁住了</strong>
      <span>免费给前 10 行的增速。绝对访问量、环比精确值、站点类型和逐期快照属于 Pro。</span>
    </div>
    <div class="pro-lockbar-act">
      <a class="pro-btn pro-btn-amber" href="/zh/pricing/">看 Pro 方案</a>
      <button type="button" class="pro-btn" data-pro-login>已购买，登录</button>
    </div>
  </div>
  <div class="pro-lockbar" data-pro-only hidden style="background:#f0f9f4;border-color:#c6e6d4">
    <div class="pro-lockbar-txt">
      <strong style="color:#0a8754">Pro 已解锁 · 全部 19 行</strong>
      <span>数据来自本页最新一期快照。导出功能在方案页。</span>
    </div>
    <div class="pro-lockbar-act">
      <a class="pro-btn" href="/zh/pricing/#order">管理订阅</a>
    </div>
  </div>`;

const anchor = '</tbody>\n  </table>';
if (!html.includes('pro-lockbar') && html.includes(anchor)) {
  html = html.replace(anchor, '</tbody>\n  </table>\n' + lockBar);
} else if (!html.includes('pro-lockbar')) {
  // 容错：表格闭合形态不一致时插在 </section> 前
  const secEnd = html.indexOf('</section>', html.indexOf('id="tb"'));
  if (secEnd > 0) html = html.slice(0, secEnd) + lockBar + '\n' + html.slice(secEnd);
}

/* --- 5. body 尾加脚本 --- */

if (!html.includes('/assets/rank-pro.mjs')) {
  html = html.replace('</body>',
    `<script type="module" src="/assets/pro-gate.mjs"></script>\n<script type="module" src="/assets/rank-pro.mjs"></script>\n</body>`);
}

/* --- 6. 写回 --- */

if (DRY) {
  console.log('[dry] 免费行 ' + FREE_ROWS + ' / 锁定行 ' + (rows.length - FREE_ROWS));
  console.log('--- 前 2 个锁定行预览 ---');
  newRows.slice(FREE_ROWS, FREE_ROWS + 2).forEach((r) => console.log(r.slice(0, 340).replace(/\s+/g, ' ') + '\n'));
  process.exit(0);
}

writeFileSync(TARGET, html, 'utf8');
console.log('[ok] 已改写 ai-tools/rank/index.html');
console.log('     免费行 ' + FREE_ROWS + ' / 锁定行 ' + (rows.length - FREE_ROWS));
