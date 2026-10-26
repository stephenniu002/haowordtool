#!/usr/bin/env node
/**
 * indexnow.mjs —— IndexNow 推送：把 URL 变更立刻告知 Bing / Yandex / Seznam / Naver
 * ---------------------------------------------------------------
 * 这是少数几个**不需要注册账号、不需要 OAuth、当天就能生效**的收录通道。
 * Google 不在 IndexNow 联盟里，但 Bing 的索引被 ChatGPT Search、Copilot、
 * DuckDuckGo 复用，对有 AI 爬虫流量的站点来说这条线不白推。
 *
 * 协议只有三条：
 *   1. 在站点根放一个 <key>.txt，内容就是 key 本身
 *   2. POST JSON 到 https://api.indexnow.org/indexnow
 *   3. 主机名必须与 key 文件所在主机一致
 *
 * 用法：
 *   node scripts/indexnow.mjs --gen-key        # 生成 key 并写入根目录 <key>.txt
 *   node scripts/indexnow.mjs --submit         # 推 sitemap.xml 里的全部 URL
 *   node scripts/indexnow.mjs --submit --dry   # 只打印，不发请求
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const HOST = 'haowordtool.com';
const SITE = `https://${HOST}`;
/** 共享端点会分发给所有参与的引擎，另两个直连用来确认各自收到 */
const ENDPOINTS = ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow', 'https://yandex.com/indexnow'];

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);

/** 找现成的 key 文件：根目录下一个 8-128 位十六进制命名的 .txt，内容与文件名一致 */
function findKey() {
  for (const f of fs.readdirSync(ROOT)) {
    if (!/^[a-f0-9]{8,128}\.txt$/i.test(f)) continue;
    const k = f.replace(/\.txt$/, '');
    if (fs.readFileSync(path.join(ROOT, f), 'utf8').trim() === k) return k;
  }
  return null;
}

function genKey() {
  const k = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(path.join(ROOT, `${k}.txt`), k);
  console.log(`已生成 key：${k}`);
  console.log(`文件：${k}.txt（内容就是 key，部署后应可通过 ${SITE}/${k}.txt 访问）`);
  return k;
}

/**
 * 抽 URL。别只读 sitemap.xml——主 sitemap 只覆盖 134 条，
 * 多语言那 46 条在 de/es/ja/zh 各自的 sitemap 里，走 sitemap-index 才能收全。
 */
function urlsFromSitemap() {
  const set = new Set();
  const read = (rel) => {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) return '';
    return fs.readFileSync(p, 'utf8');
  };

  const index = read('sitemap-index.xml');
  const children = [...index.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)]
    .map((m) => m[1])
    .map((u) => u.replace(/^https?:\/\/[^/]+\//, ''))
    .filter(Boolean);
  const files = children.length ? children : ['sitemap.xml'];

  for (const f of files) {
    const xml = read(f);
    for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
      const u = m[1];
      // 跳过 sitemap 自身与别家域名
      if (!/^https?:\/\/haowordtool\.com\//i.test(u)) continue;
      if (/\.xml$/i.test(u)) continue;
      set.add(u);
    }
  }
  return [...set];
}

async function post(endpoint, payload) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const body = (await res.text()).slice(0, 300);
  return { status: res.status, body };
}

const key = has('--gen-key') ? genKey() : findKey();
if (!key) {
  console.error('根目录没有有效的 IndexNow key。先跑：node scripts/indexnow.mjs --gen-key');
  process.exit(1);
}

if (has('--submit')) {
  const urls = urlsFromSitemap();
  if (!urls.length) {
    console.error('sitemap.xml 里没抽到 URL');
    process.exit(1);
  }
  // 单次最多 10000 条，超出要分批。这里够用，仍写成分片以免以后踩坑。
  const chunks = [];
  for (let i = 0; i < urls.length; i += 10000) chunks.push(urls.slice(i, i + 10000));
  console.log(`待推 ${urls.length} 条 URL，分 ${chunks.length} 批，key=${key}`);

  if (has('--dry')) {
    for (const u of urls.slice(0, 10)) console.log('  ' + u);
    console.log(`  ...（共 ${urls.length} 条，未发送）`);
    process.exit(0);
  }

  let failed = 0;
  for (const [i, chunk] of chunks.entries()) {
    const payload = { host: HOST, key, keyLocation: `${SITE}/${key}.txt`, urlList: chunk };
    for (const ep of ENDPOINTS) {
      try {
        const r = await post(ep, payload);
        // 200/202 = 接受；422 = key 不匹配或 URL 不属于该 host；403 = key 文件取不到
        const ok = r.status === 200 || r.status === 202;
        console.log(`${ok ? 'OK  ' : 'FAIL'} ${ep}  batch=${i + 1}  ${r.status}  ${r.body}`);
        if (!ok) failed++;
      } catch (err) {
        console.log(`ERR  ${ep}  ${err.message}`);
        failed++;
      }
    }
  }
  process.exit(failed ? 1 : 0);
}

console.log(`可用 key：${key}`);
console.log('下一步：node scripts/indexnow.mjs --submit');
