#!/usr/bin/env node
/**
 * build-rss.mjs —— 生成 /feed.xml
 * ---------------------------------------------------------------
 * 为什么需要 feed：外链和收录都缺一个「可订阅的入口」。
 * 聚合站、Feedly、Telegram 转推机器人、部分 newsletter 抓取器，
 * 都只吃 RSS。没有 feed，这些渠道连门都进不去。
 *
 * 条目来源与排序：git 提交时间倒序。不用文件 mtime——每次 clone 或检出
 * mtime 都会变，pubDate 就全乱，聚合站会把旧文当新文重推一遍。
 *
 * 用法：
 *   node scripts/build-rss.mjs
 *   node scripts/build-rss.mjs --check   # 校验现存 feed.xml 是否最新
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const SITE = 'https://haowordtool.com';
const OUT = path.join(ROOT, 'feed.xml');
const CHECK = process.argv.includes('--check');
const LIMIT = 40;

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 取单个文件的最后一次提交时间，拿不到就退到 mtime */
function commitDate(rel) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cI', '--', rel], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function text(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function describe(html) {
  const d = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  if (d && d[1].trim()) return d[1].trim();
  // 退路：正文首段前 200 字
  return text(html).slice(0, 200);
}

/** 收集候选：案例文章 + 工具页 + AI 栏目 */
function collect() {
  const items = [];
  const push = (rel, url, kind) => {
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const title = ((html.match(/<title>([^<]*)<\/title>/i) || [, ''])[1] || '').trim();
    if (!title) return;
    if (/noindex/i.test((html.match(/<meta\b[^>]*name=["']robots["'][^>]*>/i) || [''])[0])) return;
    items.push({ rel, url, title: title.split('|')[0].trim(), desc: describe(html), kind, date: commitDate(rel) });
  };

  for (const f of fs.readdirSync(path.join(ROOT, 'blog/cases'))) {
    if (f.endsWith('.html')) push(`blog/cases/${f}`, `${SITE}/blog/cases/${f}`, 'case');
  }
  if (fs.existsSync(path.join(ROOT, 'ai-tools/index.html'))) push('ai-tools/index.html', `${SITE}/ai-tools/`, 'signal');
  for (const f of fs.readdirSync(path.join(ROOT, 'tools'))) {
    if (f.endsWith('.html') && f !== 'index.html') push(`tools/${f}`, `${SITE}/tools/${f}`, 'tool');
  }

  return items
    .filter((i) => i.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, LIMIT);
}

const items = collect();
if (!items.length) {
  console.error('没有可用条目：git log 拿不到提交时间时脚本会空转，检查是否在仓库根目录运行');
  process.exit(1);
}

const newest = items[0].date;
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>HaoWordTool — new tools and field notes</title>
  <link>${SITE}/</link>
  <description>Free browser-based tools, plus write-ups of real SEO and site-engineering problems and how they were verified.</description>
  <language>en</language>
  <lastBuildDate>${new Date(newest).toUTCString()}</lastBuildDate>
  <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
${items
  .map(
    (i) => `  <item>
    <title>${esc(i.title)}</title>
    <link>${i.url}</link>
    <guid isPermaLink="true">${i.url}</guid>
    <pubDate>${new Date(i.date).toUTCString()}</pubDate>
    <category>${i.kind}</category>
    <description>${esc(i.desc)}</description>
  </item>`
  )
  .join('\n')}
</channel>
</rss>
`;

if (CHECK) {
  const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  const same = old.replace(/<lastBuildDate>[^<]*<\/lastBuildDate>/, '') === xml.replace(/<lastBuildDate>[^<]*<\/lastBuildDate>/, '');
  if (!same) {
    console.error('feed.xml 已过期，运行 node scripts/build-rss.mjs 重新生成');
    process.exit(1);
  }
  console.log('feed.xml 是最新的');
  process.exit(0);
}

fs.writeFileSync(OUT, xml);
console.log(`写入 feed.xml：${items.length} 条，最新 ${newest}`);
for (const i of items.slice(0, 5)) console.log(`  ${i.date.slice(0, 10)}  ${i.url}`);
