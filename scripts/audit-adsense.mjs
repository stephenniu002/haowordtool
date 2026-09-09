import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publisher = 'pub-4489946300243174';
const adScript = 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
const blockedAdPages = new Set([
  'index.html',
  'app-builder.html',
  'unscrambler.html',
  'templates.html',
  'custom-web-design.html',
  'ielts-course.html',
  'pricing.html',
  'video-studio.html',
  'ai-companion.html',
  'media-downloader.html',
  'faq.html',
  'en/index.html',
  'en/ielts/index.html'
]);

const htmlFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'data', 'build', 'www', 'android', 'ios'].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (entry.name.endsWith('.html')) htmlFiles.push(target);
  }
}
walk(root);

const errors = [];
const enabled = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file).replaceAll('\\', '/');
  if (!html.includes(adScript)) continue;
  enabled.push(rel);
  if (!html.includes(`ca-${publisher}`)) errors.push(`${rel}: unexpected AdSense publisher`);
  if (blockedAdPages.has(rel)) errors.push(`${rel}: ads are blocked on interactive, checkout or short hub pages`);
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&\w+;/g, ' ');
  const words = (visible.match(/[A-Za-zÀ-ÿ]+/g) || []).length;
  if (words < 300) errors.push(`${rel}: AdSense page has only ${words} visible words`);
}

const adsTxt = fs.readFileSync(path.join(root, 'ads.txt'), 'utf8').trim();
const expectedAdsTxt = `google.com, ${publisher}, DIRECT, f08c47fec0942fa0`;
if (adsTxt !== expectedAdsTxt) errors.push('ads.txt: publisher declaration does not match the approved format');

console.log(`${enabled.length} content pages load the AdSense verification/auto-ads script; ${errors.length} audit errors.`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
