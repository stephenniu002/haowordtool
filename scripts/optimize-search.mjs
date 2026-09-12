import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://haowordtool.com';
const locales = ['zh', 'en', 'ja', 'fr', 'es'];
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1];
const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || [];
const canonicalOf = html => attr(tags(html, 'link').find(t => attr(t, 'rel') === 'canonical') || '', 'href');
const noindex = html => tags(html, 'meta').some(t => /^(robots|googlebot)$/i.test(attr(t, 'name') || '') && /\b(noindex|none)\b/i.test(attr(t, 'content') || ''));
const urlOf = file => origin + '/' + file.replace(/(^|\/)index\.html$/, '$1');

// Only reviewed, equivalent content belongs in a language cluster.
const groups = [
  {'zh-CN': 'index.html', en: 'en/index.html'},
  ...['index.html', 'run-ai-html.html', 'preview-mobile-webpage.html', 'export-html-css-js-zip.html'].map(file => ({'zh-CN': `learn/${file}`, en: `en/learn/${file}`})),
  {'zh-CN': 'video-studio.html', ...Object.fromEntries(['en', 'ja', 'fr', 'es'].map(code => [code, `video-studio/${code}/index.html`]))}
];

export function optimize(pages) {
  const output = new Map();
  for (const [file, html] of pages) {
    const provisional = /<meta name="localization-status" content="entry-only">/.test(html);
    output.set(file, html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i, head => {
      // Remove stale language declarations; rebuild only eligible reciprocal groups below.
      head = head.replace(/<link\b[^>]*>/gi, tag => attr(tag, 'hreflang') ? '' : tag);
      if (provisional || file === 'share.html') {
        head = head.replace(/<meta\b[^>]*>/gi, tag => attr(tag, 'name') === 'robots' ? '' : tag);
        head = head.replace('</head>', '<meta name="robots" content="noindex,follow"></head>');
      }
      if (!canonicalOf(head)) head = head.replace('</head>', `<link rel="canonical" href="${urlOf(file)}"></head>`);
      return head;
    }));
  }
  for (const group of groups) {
    const eligible = Object.entries(group).filter(([, file]) => output.has(file) && !noindex(output.get(file)) && canonicalOf(output.get(file)) === urlOf(file));
    if (eligible.length < 2) continue;
    const fallback = eligible.find(([lang]) => lang === 'en') || eligible[0];
    const links = [...eligible, ['x-default', fallback[1]]].map(([lang, file]) => `<link rel="alternate" hreflang="${lang}" href="${urlOf(file)}">`).join('');
    for (const [, file] of eligible) output.set(file, output.get(file).replace('</head>', `${links}</head>`));
  }
  const urls = [...output].filter(([file, html]) => !noindex(html) && canonicalOf(html) === urlOf(file)).map(([file]) => urlOf(file)).sort();
  // Omit lastmod instead of manufacturing a content-update date on every build.
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`;
  return {pages: output, sitemap, urls};
}

export function run({check = false} = {}) {
  const pages = new Map();
  function readDirectory(dir, recursive) {
    for (const entry of fs.readdirSync(path.join(root, dir), {withFileTypes: true})) {
      const file = path.posix.join(dir, entry.name);
      if (entry.isDirectory() && recursive) readDirectory(file, true);
      else if (entry.isFile() && file.endsWith('.html')) pages.set(file, fs.readFileSync(path.join(root, file), 'utf8'));
    }
  }
  readDirectory('', false);
  for (const dir of [...locales, 'guides', 'learn', 'video-studio']) readDirectory(dir, true);
  const result = optimize(pages);
  const changes = [...result.pages].filter(([file, html]) => pages.get(file) !== html);
  if (fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8') !== result.sitemap) changes.push(['sitemap.xml', result.sitemap]);
  if (!check) for (const [file, html] of changes) fs.writeFileSync(path.join(root, file), html);
  console.log(`SEO: ${pages.size} pages checked; ${result.urls.length} indexable canonical URLs; ${changes.length} ${check ? 'pending' : 'updated'} files.`);
  if (check && changes.length) throw new Error(`Run node scripts/optimize-search.mjs: ${changes.map(([file]) => file).join(', ')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run({check: process.argv.includes('--check')});
