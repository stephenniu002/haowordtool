#!/usr/bin/env node
/**
 * link-rank-detail.mjs
 * 把榜单每一行链到对应的详情页，并补一条「情报」入口。
 *
 * 为什么要改 .dname 而不是加新列：
 *   表格已经有 6 列，再加列在 1120px 下会挤。站名原本是纯文本（span），
 *   改成链接不占新空间，同时给出一个带关键词的锚文本——详情页需要它。
 *   外链 .dom 保持原样指向真实站点，两条链接用途不同，不能合并。
 *
 * 幂等：靠 data-detail-link 标记判断，重跑不叠加。
 *
 * 用法:
 *   node tools/pro/link-rank-detail.mjs --dry
 *   node tools/pro/link-rank-detail.mjs
 *   node tools/pro/link-rank-detail.mjs --revert
 */

import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PAGE = resolve(ROOT, 'ai-tools/rank/index.html');

const argv = process.argv.slice(2);
const dry = argv.includes('--dry');
const revert = argv.includes('--revert');

let html = readFileSync(PAGE, 'utf8');
const before = html;

/* ---------- 样式常量（revert 和注入都要用，必须定义在使用之前） ---------- */

const STYLE_ANCHOR = '.dname{color:var(--mute);font-size:13px;margin-left:8px}';
const STYLE_NEW = `.dname{color:var(--mute);font-size:13px;margin-left:8px}
a.dname{color:var(--dusk);text-decoration:none;border-bottom:1px solid transparent}
a.dname:hover{color:var(--sea);border-bottom-color:var(--sea)}
.dlink{display:inline-block;margin-top:5px;font-size:12px;color:var(--sea);font-weight:600}
.dlink:hover{color:var(--dusk)}`;

/* ---------- 回滚 ---------- */

if (revert) {
  // 站名链接还原成 span
  html = html.replace(
    /<a class="dname" data-detail-link href="\/ai-tools\/rank\/[^"]+\/">([^<]*)<\/a>/g,
    '<span class="dname">$1</span>'
  );
  // 删掉情报入口
  html = html.replace(/\n\s*<a class="dlink" data-detail-link href="[^"]+">[^<]*<\/a>/g, '');
  // 撤掉补进去的样式，否则回滚不干净
  html = html.replace(STYLE_NEW, STYLE_ANCHOR);
  if (html === before) {
    console.log('没有需要回滚的改动');
  } else {
    const tmp0 = PAGE + '.tmp';
    writeFileSync(tmp0, html, 'utf8');
    renameSync(tmp0, PAGE);
    console.log('[ok] 已回滚（链接 + 样式）');
  }
  process.exit(0);
}

/* ---------- 注入 ---------- */

// 匹配 <td class="site"> 里的一整块：域名外链 + 站名 + 描述
const rowRe = /(<td class="site"><a class="dom" href="https?:\/\/([^"]+)"[^>]*>[^<]*<\/a>\s*)(<span class="dname">)([^<]*)(<\/span>)([\s\S]*?<\/td>)/g;

let changed = 0;
let already = 0;

html = html.replace(rowRe, (m, head, host, open, name, close, tail) => {
  const domain = host.replace(/^www\./, '').replace(/\/.*$/, '');

  // 已经改过：只补缺失的情报入口
  if (tail.includes('data-detail-link')) {
    already++;
    return m;
  }

  const href = `/ai-tools/rank/${domain}/`;
  const nameLink = `<a class="dname" data-detail-link href="${href}">${name}</a>`;

  // 描述后面插入情报入口。
  // tail 形如 '\n          <span class="desc">…</span></td>' —— </td> 在捕获组里，
  // 所以要锚定 '</span> 空白 </td>' 这个结尾，不能只锚 </span>。
  const withLink = tail.replace(
    /(<\/span>)(\s*)(<\/td>)$/,
    `$1\n          <a class="dlink" data-detail-link href="${href}">增长情报 →</a>$2$3`
  );

  changed++;
  return head + nameLink + withLink;
});

/* ---------- 样式 ---------- */

let styleAdded = false;
if (!html.includes('a.dname:hover') && html.includes(STYLE_ANCHOR)) {
  html = html.replace(STYLE_ANCHOR, STYLE_NEW);
  styleAdded = true;
}

/* ---------- 输出 ---------- */

console.log(`匹配并改写：${changed} 行`);
console.log(`已有链接跳过：${already} 行`);
console.log(`样式${styleAdded ? '已补' : '已存在或未找到锚点'}`);

if (dry) {
  console.log('\n[dry] 未写入。示例片段：');
  const i = html.indexOf('data-detail-link');
  if (i > 0) console.log(html.slice(Math.max(0, i - 220), i + 200));
  process.exit(0);
}

if (html === before) {
  console.log('内容无变化，不写文件');
  process.exit(0);
}

// 原子写：先落临时文件再替换，中途失败不会留下半截页面
const tmp = PAGE + '.tmp';
writeFileSync(tmp, html, 'utf8');
renameSync(tmp, PAGE);
console.log(`[ok] 已写入 ${PAGE.replace(ROOT + '\\', '').replace(ROOT + '/', '')}`);
