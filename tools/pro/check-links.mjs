#!/usr/bin/env node
/**
 * check-links.mjs — 检查生成页面的站内链接是否都有落点
 *
 * 只查站内（以 / 开头）。外链不查 —— 那是别人的可用性，不是我们的 bug，
 * 而且查外链会让这个脚本在有网/无网时结果不一致。
 *
 * 路径映射规则和 GitHub Pages 一致：
 *   /foo/      → foo/index.html
 *   /foo       → foo.html 或 foo/index.html
 *   /foo.html  → foo.html
 *
 * 用法:
 *   node tools/pro/check-links.mjs
 *   node tools/pro/check-links.mjs --dir ai-tools/rank --verbose
 *
 * 退出码：0 全部可达，1 有断链。
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const argv = process.argv.slice(2);
const dirArg = argv.includes('--dir') ? argv[argv.indexOf('--dir') + 1] : 'ai-tools/rank';
const verbose = argv.includes('--verbose');

/* ---------- 收集页面 ---------- */

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const pages = walk(resolve(ROOT, dirArg));
if (!pages.length) {
  console.error(`[x] ${dirArg} 下没有 HTML`);
  process.exit(1);
}

/* ---------- 链接落点判定 ---------- */

function resolves(link) {
  // 去掉 query / hash
  const clean = link.split('#')[0].split('?')[0];
  if (!clean) return true; // 纯锚点，同页

  const rel = clean.replace(/^\//, '');
  const abs = resolve(ROOT, rel);

  const candidates = [];
  if (clean.endsWith('/')) {
    candidates.push(join(abs, 'index.html'));
  } else if (/\.[a-z0-9]{2,5}$/i.test(clean)) {
    candidates.push(abs);
  } else {
    candidates.push(abs + '.html', join(abs, 'index.html'));
  }
  return candidates.some((c) => existsSync(c));
}

/* ---------- 扫描 ---------- */

const broken = new Map(); // link → Set(来源页面)
let total = 0;
let checked = 0;

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

  for (const link of links) {
    total++;
    // 站内相对/绝对路径才查；外链、mailto、tel、data 跳过
    if (!link.startsWith('/')) continue;
    if (link.startsWith('//')) continue;
    checked++;
    if (!resolves(link)) {
      if (!broken.has(link)) broken.set(link, new Set());
      broken.get(link).add(relative(ROOT, page));
    }
  }
}

/* ---------- 报告 ---------- */

console.log(`扫描 ${pages.length} 个页面 / ${total} 个链接，其中站内 ${checked} 个`);

if (!broken.size) {
  console.log('✓ 站内链接全部可达');
  process.exit(0);
}

console.log(`\n断链 ${broken.size} 种：`);
for (const [link, sources] of [...broken].sort()) {
  console.log(`  ${link}   ← ${sources.size} 个页面引用`);
  if (verbose) for (const s of [...sources].slice(0, 3)) console.log(`      ${s}`);
}
process.exit(1);
