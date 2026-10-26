import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
import { SKIP_DIRS as SKIP } from './lib/site-walker.mjs';
const SITE = 'https://haowordtool.com';

const files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) files.push(p);
  }
}
walk(root);

const errors = [];

/** 页面自身对应的 URL 路径（相对仓库根，以 / 开头，目录页以 / 结尾） */
function urlPathOf(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel;
}

/**
 * 把 canonical 的 href 归一成路径，用来判断这页是不是「别名页」。
 * 别名页（canonical 指向别处）本来就是旧地址的副本，和正本标题相同是
 * 预期的，不该按重复标题报错；301 配好后这类页会整体消失。
 */
function canonicalPath(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (!m) return null;
  const h = m[0].match(/href=["']([^"']+)["']/i);
  if (!h) return null;
  let u = h[1].trim();
  if (u.startsWith(SITE)) u = u.slice(SITE.length) || '/';
  if (/^https?:\/\//i.test(u)) return { external: u };
  return { path: u };
}

const titles = new Map();
const aliasRels = new Set();
let words = 0;

// 第一遍：标出别名页，让第二遍的标题查重跳过它们
const htmlOf = new Map();
for (const f of files) {
  const rel = path.relative(root, f).replaceAll('\\', '/');
  const html = fs.readFileSync(f, 'utf8');
  htmlOf.set(rel, html);
  const c = canonicalPath(html);
  if (c && c.path && c.path.replace(/\/$/, '') !== urlPathOf(rel).replace(/\/$/, '')) aliasRels.add(rel);
}

for (const [rel, html] of htmlOf) {
  const isAlias = aliasRels.has(rel);

  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  if (!title) errors.push(`${rel}: missing title`);
  else if (!isAlias) {
    const norm = title.trim();
    if (titles.has(norm)) errors.push(`${rel}: duplicate title with ${titles.get(norm)}`);
    else titles.set(norm, rel);
  }

  if (!/meta name="description"/.test(html)) errors.push(`${rel}: missing description`);
  if (/href=["']#["']/.test(html)) errors.push(`${rel}: empty hash link`);
  if (/pub-5075958362002617/.test(html)) errors.push(`${rel}: old publisher id`);

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&\w+;/g, ' ');
  const wc = (text.match(/[A-Za-zÀ-ÿ]+/g) || []).length;
  words += wc;
  if (rel.startsWith('guides/') && wc < 260) errors.push(`${rel}: thin guide (${wc} words)`);

  for (const m of html.matchAll(/href=["'](\/[A-Za-z0-9_./-]+(?:\.html)?)(?:#[^"']*)?["']/g)) {
    let target = m[1];
    if (target.endsWith('/')) target += 'index.html';
    else if (target === '/') target = '/index.html';
    if (!fs.existsSync(path.join(root, target.slice(1)))) errors.push(`${rel}: broken link ${m[1]}`);
  }
}

const LOC_OK = /^https:\/\/haowordtool\.com\//;
const LOC_ANY = /<loc>([^<]*)<\/loc>/g;

/**
 * 历史 bug 卡点：SITE 结尾无斜杠、子 sitemap 名开头也无斜杠，直接拼接产出
 * https://haowordtool.comsitemap.xml。页面全 200，Google 一条都收不到，
 * 只有人肉 curl 才看得见，所以必须在静态校验里卡死。
 */
const sitemapPath = path.join(root, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  for (const m of sitemap.matchAll(LOC_ANY)) {
    if (!LOC_OK.test(m[1])) errors.push(`sitemap.xml: malformed loc ${m[1]}`);
  }
  const locs = [...sitemap.matchAll(/<loc>https:\/\/haowordtool\.com\/(.*?)<\/loc>/g)].map((m) => m[1]);
  const seen = new Set();
  for (const loc of locs) {
    if (seen.has(loc)) errors.push(`sitemap.xml: duplicate URL /${loc}`);
    seen.add(loc);
    const rel = loc === '' ? 'index.html' : loc.endsWith('/') ? `${loc}index.html` : loc;
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      errors.push(`sitemap.xml: missing file for /${loc}`);
      continue;
    }
    // 先剥掉 script/style 再判。工具页里会出现 noindex 这个字符串本身
    // （比如 meta 标签生成器的输出模板），那不是一个 meta 标签，只是代码里的字面量。
    // 不剥的话，把它收录进 sitemap 反而被报成"自相矛盾"。
    const rawPage = fs.readFileSync(abs, 'utf8')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '');
    if (/<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(rawPage)) {
      errors.push(`${rel}: sitemap/noindex conflict`);
    }
  }
}

const indexPath = path.join(root, 'sitemap-index.xml');
if (fs.existsSync(indexPath)) {
  const idx = fs.readFileSync(indexPath, 'utf8');
  let n = 0;
  for (const m of idx.matchAll(LOC_ANY)) {
    n++;
    if (!LOC_OK.test(m[1])) {
      errors.push(`sitemap-index.xml: malformed loc ${m[1]}`);
      continue;
    }
    const rel = m[1].replace('https://haowordtool.com/', '');
    if (!fs.existsSync(path.join(root, rel))) errors.push(`sitemap-index.xml: missing ${rel}`);
  }
  if (!n) errors.push('sitemap-index.xml: no <loc> entries');
}

console.log(
  `${files.length} HTML files; ${words} visible words; ${aliasRels.size} alias pages; ${errors.length} validation errors.`
);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
