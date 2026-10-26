#!/usr/bin/env node
/**
 * 本地静态预览服务。
 * 只绑 127.0.0.1，不对外监听。
 *
 *   node scripts/serve.mjs            # 默认 8787
 *   node scripts/serve.mjs --port 9000
 *
 * 目录列表行为与 GitHub Pages 一致：
 *   /tools/text-diff      → tools/text-diff.html（文件优先）
 *   /tools/text-diff/     → tools/text-diff/index.html（目录优先）
 * 这样本地预览能复现线上解析规则，避免「本地好、线上 404」。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const PORT = Number(arg('port', 8787));
const HOST = '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
};

function resolveTarget(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  // 防目录穿越：规范化后必须仍在 ROOT 之内
  const rel = path.normalize(clean).replace(/^([/\\])+/, '');
  const abs = path.resolve(ROOT, rel);
  if (!abs.startsWith(ROOT)) return null;

  if (clean.endsWith('/')) {
    const idx = path.join(abs, 'index.html');
    return fs.existsSync(idx) ? idx : null;
  }
  // 无斜杠：先按文件，再按目录 index.html（与 GitHub Pages 一致）
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  const asFile = abs + '.html';
  if (fs.existsSync(asFile)) return asFile;
  const asIndex = path.join(abs, 'index.html');
  if (fs.existsSync(asIndex)) return asIndex;
  return null;
}

const server = http.createServer((req, res) => {
  const target = resolveTarget(req.url || '/');
  if (!target) {
    const p404 = path.join(ROOT, '404.html');
    if (fs.existsSync(p404)) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(fs.readFileSync(p404));
    } else {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('404');
    }
    return;
  }
  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, {
    'content-type': TYPES[ext] || 'application/octet-stream',
    'cache-control': 'no-store', // 本地预览永远拿最新文件，避免改完看不到变化
  });
  fs.createReadStream(target).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`本地预览: http://${HOST}:${PORT}/`);
  console.log(`站点根目录: ${ROOT}`);
});
