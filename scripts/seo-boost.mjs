#!/usr/bin/env node
/**
 * seo-boost.mjs — sitewide technical SEO improvements (idempotent).
 *
 * For every *.html page it:
 *  1. Injects JSON-LD (Organization + WebSite, auto BreadcrumbList,
 *     FAQPage when <details> Q&A blocks are found) when missing.
 *  2. Adds og:image + Twitter card tags when og:image is missing.
 *  3. Adds hreflang alternates across locale variants
 *     (root, en/, es/, fr/, ja/, zh/) when missing.
 *
 * Usage: node scripts/seo-boost.mjs [--dry-run]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DRY = process.argv.includes('--dry-run');
const SITE = 'https://haowordtool.com';
const OG_IMAGE = `${SITE}/assets/og-image.png`;
const LOCALES = ['en', 'es', 'fr', 'ja', 'zh'];
const MARK = 'seo-boost';

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!['docs', 'examples'].includes(e.name)) walk(p, out); }
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = s => s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const titleOf = html => (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || '';
const descOf = html => (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1] || '';
const langOf = html => (html.match(/<html[^>]*\blang="([^"]+)"/i) || [])[1] || 'en';
const langCode = l => ({ en: 'en', es: 'es', fr: 'fr', ja: 'ja', zh: 'zh', 'zh-cn': 'zh' }[l.toLowerCase()] || 'en');
const relUrl = file => SITE + '/' + relative(ROOT, file).split(sep).join('/');

function breadcrumbs(file, html) {
  const rel = relative(ROOT, file).split(sep).join('/');
  if (rel === 'index.html') return null;
  const parts = rel.replace(/\.html$/, '').split('/');
  const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }];
  let path = '';
  parts.forEach((seg, i) => {
    if (i === 0 && LOCALES.includes(seg)) { path += seg + '/'; return; } // skip locale prefix
    path += seg + (i === parts.length - 1 ? '.html' : '/');
    const name = i === parts.length - 1
      ? stripTags(titleOf(html)).split('|')[0].split('—')[0].trim().slice(0, 60) || seg
      : seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    items.push({ '@type': 'ListItem', position: items.length + 1, name, item: SITE + '/' + path });
  });
  return items.length > 1 ? { '@type': 'BreadcrumbList', itemListElement: items } : null;
}

function faqEntities(html) {
  const out = [];
  const re = /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;
  let m;
  while ((m = re.exec(html)) && out.length < 20) {
    const q = stripTags(m[1]).replace(/\?+$/, '') + '?';
    const a = stripTags(m[2]).slice(0, 500);
    if (q.length > 8 && a.length > 10) {
      out.push({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } });
    }
  }
  return out;
}

function hreflangs(file) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const stripped = rel.replace(/^(en|es|fr|ja|zh)\//, '');
  const variants = [];
  const canon = u => u.replace(/\/index\.html$/, '/');
  for (const prefix of ['', ...LOCALES.map(l => l + '/')]) {
    const cand = join(ROOT, prefix + stripped);
    if (existsSync(cand) && statSync(cand).isFile()) {
      const h = readFileSync(cand, 'utf8');
      variants.push({ code: langCode(langOf(h)), url: canon(SITE + '/' + prefix + stripped) });
    }
  }
  const seen = new Set(), uniq = [];
  for (const v of variants) if (!seen.has(v.code)) { seen.add(v.code); uniq.push(v); }
  if (uniq.length < 2) return null;
  const def = uniq.find(v => v.url === SITE + '/' + stripped) || uniq[0];
  return { uniq, def };
}

let jsonldN = 0, ogN = 0, hrefN = 0, faqN = 0, skipped = 0;
for (const file of walk(ROOT)) {
  let html = readFileSync(file, 'utf8');
  if (!/<\/head>/i.test(html)) { skipped++; continue; }
  const headClose = html.search(/<\/head>/i);
  let head = html.slice(0, headClose);
  const injections = [];

  // 1. JSON-LD
  if (!/application\/ld\+json/i.test(head) && !head.includes(MARK)) {
    const graph = [
      { '@type': 'Organization', '@id': SITE + '/#org', name: 'HaoWordTool', url: SITE + '/',
        logo: { '@type': 'ImageObject', url: OG_IMAGE } },
      { '@type': 'WebSite', '@id': SITE + '/#site', url: SITE + '/', name: 'HaoWordTool',
        publisher: { '@id': SITE + '/#org' }, inLanguage: langCode(langOf(html)) },
    ];
    const bc = breadcrumbs(file, html);
    if (bc) graph.push(bc);
    const faqs = faqEntities(html);
    if (faqs.length >= 3) { graph.push({ '@type': 'FAQPage', mainEntity: faqs }); faqN++; }
    injections.push(`<!-- ${MARK}: structured data -->\n<script type="application/ld+json">\n` +
      JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2) + `\n</script>`);
    jsonldN++;
  }

  // 2. og:image + twitter
  if (!/og:image/i.test(head)) {
    const t = esc(stripTags(titleOf(html)).slice(0, 90));
    const d = esc(descOf(html).slice(0, 160));
    injections.push(`<!-- ${MARK}: social cards -->\n` +
      `<meta property="og:image" content="${OG_IMAGE}">\n` +
      `<meta property="og:image:width" content="1200">\n` +
      `<meta property="og:image:height" content="630">\n` +
      `<meta name="twitter:card" content="summary_large_image">\n` +
      (t ? `<meta name="twitter:title" content="${t}">\n` : '') +
      (d ? `<meta name="twitter:description" content="${d}">\n` : ''));
    ogN++;
  }

  // 3. hreflang
  if (!/hreflang/i.test(head)) {
    const h = hreflangs(file);
    if (h) {
      injections.push(`<!-- ${MARK}: hreflang -->\n` +
        h.uniq.map(v => `<link rel="alternate" hreflang="${v.code}" href="${v.url}">`).join('\n') +
        `\n<link rel="alternate" hreflang="x-default" href="${h.def.url}">`);
      hrefN++;
    }
  }

  if (injections.length) {
    const block = injections.join('\n') + '\n';
    html = html.slice(0, headClose) + block + html.slice(headClose);
    if (!DRY) writeFileSync(file, html);
  }
}

console.log(JSON.stringify({ dryRun: DRY, jsonldAdded: jsonldN, faqPages: faqN, ogAdded: ogN, hreflangAdded: hrefN, skipped }, null, 2));
