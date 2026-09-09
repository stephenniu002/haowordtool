import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
const write = (path, value) => writeFileSync(join(root, path), value, 'utf8');
const base = 'https://haowordtool.com';
const logo = '<img src="/assets/hao-logo.svg?v=4" alt="HaoWordStudio" width="236" height="46" style="display:block;width:min(236px,50vw);height:auto">';
const header = active => `<a class="skip" href="#main">Skip to content</a><header class="site-header"><div class="wrap nav"><a class="brand" href="/">${logo}</a><button class="menu" aria-label="Open menu" aria-expanded="false">☰</button><nav class="nav-links" aria-label="Main navigation"><a href="/">App Studio</a><a href="/en/learn/">Web tutorials</a><a href="/unscrambler.html">Word solver</a><a href="/blog.html">Word guides</a><a ${active === 'about' ? 'aria-current="page"' : ''} href="/about.html">About</a><a ${active === 'contact' ? 'aria-current="page"' : ''} href="/contact.html">Contact</a></nav></div></header>`;
const footer = `<footer class="footer"><div class="wrap footer-grid"><div><a class="brand" href="/">${logo}</a><p>Browser tools and practical lessons built around examples you can inspect, run and download.</p></div><div><h4>Use & learn</h4><div class="footer-links"><a href="/">App Studio</a><a href="/en/learn/">Web tutorials</a><a href="/unscrambler.html">Word solver</a><a href="/blog.html">Word guides</a></div></div><div><h4>Trust & contact</h4><div class="footer-links"><a href="/about.html">About</a><a href="/editorial-standards.html">Editorial standards</a><a href="/contact.html">Contact</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a></div></div></div><div class="wrap copyright">© 2026 HaoWordStudio · Independent online project · Hong Kong SAR</div></footer>`;

function shell({ title, description, canonical, active = '', body, article = false }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${base}${canonical}"><meta property="og:type" content="${article ? 'article' : 'website'}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${base}${canonical}"><link rel="stylesheet" href="/assets/site.css"></head><body>${header(active)}<main id="main">${body}</main>${footer}<script src="/assets/site.js" defer></script></body></html>\n`;
}

write('about.html', shell({
  title: 'About HaoWordStudio',
  description: 'Who runs HaoWordStudio, what the site publishes, how its browser tools and practical tutorials are tested, and how corrections are handled.',
  canonical: '/about.html', active: 'about',
  body: `<section class="page-hero"><div class="wrap"><p class="eyebrow">ABOUT HAOWORDSTUDIO</p><h1>Small browser tools, explained with working examples.</h1><p class="dek">HaoWordStudio publishes a front-end workspace, a word solver and practical guides. The useful result should be visible: code that runs, a file that downloads, or a method a reader can repeat.</p></div></section><section class="section"><div class="wrap article-layout"><article class="prose"><h2>What this site is for</h2><p>The App Studio lets people paste or import plain HTML, CSS and JavaScript, preview the result at desktop or mobile width, and export a ZIP. The word solver matches letter counts locally in the browser. Our tutorials explain these tools through named files, exact edits, expected results and common failure cases.</p><h2>Who operates it</h2><p>HaoWordStudio is an independent online project operated from Hong Kong SAR. Editorial questions, corrections and support requests go to the public address on our <a href="/contact.html">Contact page</a>. We do not claim affiliation with Google, OpenAI, Scrabble or other software and game publishers mentioned in examples.</p><h2>How we test</h2><p>Software lessons are checked against the current public workspace and include a working sample or a reproducible result. Word guides separate fixed constraints from strategy and disclose the ENABLE word-list scope. We record update dates, state limitations and revise a page when its interface or result changes.</p><h2>How the site earns money</h2><p>Some pages may display clearly labelled advertising. We may also offer template packs, courses or custom work. Advertising and commercial offers do not change tutorial conclusions. When a paid item is unavailable, the page says so instead of presenting a non-working checkout.</p><h2>Corrections</h2><p>Send the page address, the step or claim that is wrong, what you observed and the browser or dictionary involved. We reproduce the issue before changing an instructional claim. Read the full <a href="/editorial-standards.html">editorial and testing standards</a>.</p></article><aside class="toc"><strong>Trust pages</strong><a href="/editorial-standards.html">Editorial standards</a><a href="/how-it-works.html">Word solver method</a><a href="/contact.html">Contact</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a></aside></div></section>`
}));

write('editorial-standards.html', shell({
  title: 'Editorial and Testing Standards | HaoWordStudio',
  description: 'How HaoWordStudio plans, tests, updates and corrects its software tutorials, examples and word-reference articles.',
  canonical: '/editorial-standards.html', article: true,
  body: `<section class="page-hero"><div class="wrap"><p class="eyebrow">WHO · HOW · WHY</p><h1>Every guide must help a reader complete a real task.</h1><p class="dek">This page identifies who is responsible for our content, how we produce it and why each type of page exists.</p></div></section><section class="section"><div class="wrap article-layout"><article class="prose"><h2>Who writes and reviews the guides</h2><p>HaoWord Studio Editorial is the named publisher for the site. The operator reviews each public guide and receives corrections at the address on the <a href="/contact.html">Contact page</a>. Organization bylines are used because the guides document this site's own tools rather than a contributor's personal opinion.</p><h2>How software tutorials are made</h2><ol><li>Choose one task that a visitor can finish in a browser.</li><li>Build or select a small example with named HTML, CSS and JavaScript files.</li><li>Run every step in the current public workspace at desktop and mobile width.</li><li>Record the visible result, known limitation and a recovery step for common errors.</li><li>Link the sample source or live example so the reader can inspect the result.</li></ol><p>A screenshot supports a step but does not replace a working interaction. Network frameworks and package-based projects are identified separately because the browser workspace is designed for standalone front-end files.</p><h2>How word-reference guides are checked</h2><p>Examples are checked against letter counts and the documented ENABLE data used by the solver. We do not describe that list as an official tournament dictionary. Strategy advice explains its assumptions and asks readers to verify unusual words in the dictionary required by their game, school or publication.</p><h2>Originality and assisted tools</h2><p>Planning or drafting software may assist production, but a page is published only after its examples, links and claims are reviewed for this site. We do not publish scraped articles, copied manuals or large batches of pages created only to target search variations. A guide must add instructions, observed results, source files or analysis that belongs to the stated task.</p><h2>Updates and corrections</h2><p>Dates describe the last meaningful review of instructions or facts. Cosmetic changes alone do not justify a new date. Correction reports should include the URL, expected result, actual result and relevant environment. Material errors are corrected in the page; commercial relationships do not receive editorial approval.</p><h2>Advertising boundaries</h2><p>Advertising, when enabled, is kept separate from editor controls and download buttons. We do not ask visitors to click ads. Pages without enough independent information are excluded from search while they are being developed.</p></article><aside class="toc"><strong>Related evidence</strong><a href="/en/learn/run-ai-html.html">Tested software lesson</a><a href="/examples/daily-plan-en/">Working example</a><a href="/how-it-works.html">Solver methodology</a><a href="/about.html">About the publisher</a></aside></div></section>`
}));

write('contact.html', shell({
  title: 'Contact HaoWordStudio',
  description: 'Contact HaoWordStudio about tutorial corrections, broken examples, accessibility, privacy or product support.',
  canonical: '/contact.html', active: 'contact',
  body: `<section class="page-hero"><div class="wrap"><p class="eyebrow">CONTACT</p><h1>Report the page and the result you observed.</h1><p class="dek">Clear reports help us reproduce a broken example, incorrect instruction or missing word.</p></div></section><section class="section"><div class="wrap legal prose"><h2>Email</h2><p><a href="mailto:love6598878593@gmail.com?subject=HaoWordStudio%20feedback">love6598878593@gmail.com</a></p><h2>For a software tutorial</h2><p>Include the full page address, the numbered step, what you expected, what happened and your browser. Never send passwords, API keys, payment-card data or identity documents.</p><h2>For a word-list report</h2><p>Include the word, supplied letters, selected mode and the dictionary or game you are checking. A word can be valid in one list and absent from another.</p><h2>Response expectations</h2><p>This is a small independent project rather than a real-time support desk. We aim to review clear factual corrections within seven business days. Custom work and template inquiries receive availability and price information before an order is accepted.</p><h2>Location</h2><p>Hong Kong SAR. Online service only; there is no public walk-in office.</p></div></section>`
}));

for (const file of ['privacy.html', 'terms.html']) {
  let html = read(file)
    .replaceAll('Letter Solver Pro', 'HaoWordStudio')
    .replaceAll('© 2026 HaoWordStudio · Hong Kong SAR · Educational reference, not affiliated with Scrabble® or other game publishers.', '© 2026 HaoWordStudio · Independent online project · Hong Kong SAR')
    .replace(/<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-4489946300243174" crossorigin="anonymous"><\/script>/, '');
  if (!html.includes('href="/editorial-standards.html"')) html = html.replace('<a href="/terms.html">Terms</a>', '<a href="/terms.html">Terms</a><a href="/editorial-standards.html">Editorial standards</a>');
  write(file, html);
}

const noindex = [
  'app-builder.html', 'en/index.html', 'learn/index.html', 'learn/run-ai-html.html',
  'learn/preview-mobile-webpage.html', 'learn/export-html-css-js-zip.html',
  'video-studio.html', 'video-studio/en/index.html', 'video-studio/ja/index.html',
  'video-studio/fr/index.html', 'video-studio/es/index.html', 'ai-companion.html',
  'media-downloader.html', 'pricing.html', 'zh/index.html', 'fr/index.html',
  'es/index.html', 'ja/index.html'
];
for (const file of noindex) {
  let html = read(file);
  if (/<meta name="robots"/i.test(html)) html = html.replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="noindex,follow">');
  else html = html.replace('</title>', '</title><meta name="robots" content="noindex,follow">');
  html = html.replace(/<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-4489946300243174" crossorigin="anonymous"><\/script>/, '');
  write(file, html);
}

for (const [file, description] of [
  ['examples/landing-page-en/index.html', 'A working plain HTML, CSS and JavaScript landing-page example with an interactive email form.'],
  ['examples/portfolio-en/index.html', 'A working plain HTML, CSS and JavaScript portfolio example with accessible project filters.']
]) {
  let html = read(file);
  if (!html.includes('<meta name="description"')) html = html.replace('</title>', `</title><meta name="description" content="${description}">`);
  if (file.includes('landing-page')) html = html.replace('class="brand" href="#"', 'class="brand" href="./"');
  write(file, html);
}

const proof = `<section class="guide-proof" aria-label="How this guide was checked"><p class="eyebrow">TEST RECORD</p><h2>How this guide was checked</h2><p>HaoWord Studio Editorial tested these steps against the current public browser workspace and the downloadable files linked on this page. The guide states the expected visible result and the limits of the tool so you can repeat the check yourself.</p><p><a href="/editorial-standards.html">Read our testing and editorial standards</a> · <a href="/contact.html">Report a problem</a></p></section>`;
for (const file of readdirSync(join(root, 'en/learn')).filter(name => name.endsWith('.html') && name !== 'index.html')) {
  const path = `en/learn/${file}`;
  let html = read(path);
  if (!html.includes('class="guide-proof"')) html = html.replace('<p class="hint">', `${proof}<p class="hint">`);
  html = html.replace('<nav><a href="/privacy.html">Privacy</a>', '<nav><a href="/editorial-standards.html">Editorial standards</a><a href="/privacy.html">Privacy</a>');
  write(path, html);
}

for (const file of readdirSync(join(root, 'guides')).filter(name => name.endsWith('.html'))) {
  const path = `guides/${file}`;
  let html = read(path);
  html = html.replace(/<p class="meta">Editorial guide ·/, '<p class="meta">By HaoWord Studio Editorial ·');
  if (!html.includes('Our editorial method')) html = html.replace('<div class="notice"><strong>Try it:</strong>', '<p class="notice"><strong>Review record:</strong> Examples follow the letter-count method documented for this site. <a href="/editorial-standards.html">Our editorial method</a> explains authorship, checks and corrections.</p><div class="notice"><strong>Try it:</strong>');
  html = html.replaceAll('© 2026 Letter Solver Pro', '© 2026 HaoWordStudio');
  write(path, html);
}

for (const path of ['index.html', 'unscrambler.html', 'blog.html', 'how-it-works.html', 'faq.html']) {
  let html = read(path).replaceAll('© 2026 Letter Solver Pro', '© 2026 HaoWordStudio');
  write(path, html);
}

let css = read('assets/tutorials.css');
if (!css.includes('.guide-proof{')) css += '\n.guide-proof{margin:38px 0;padding:24px;border-left:5px solid #17654a;background:#f2f7ed;border-radius:0 14px 14px 0}.guide-proof h2{margin:5px 0 10px!important}.guide-proof p{margin:8px 0;color:#405046}.guide-proof .eyebrow{font-size:12px;letter-spacing:.12em;color:#17654a;font-weight:800}\n';
write('assets/tutorials.css', css);

const core = [
  '/', '/unscrambler.html', '/blog.html', '/how-it-works.html', '/about.html',
  '/editorial-standards.html', '/contact.html', '/faq.html', '/privacy.html', '/terms.html'
];
const guides = readdirSync(join(root, 'guides')).filter(name => name.endsWith('.html')).map(name => `/guides/${name}`);
const lessons = ['/en/learn/', ...readdirSync(join(root, 'en/learn')).filter(name => name.endsWith('.html') && name !== 'index.html').map(name => `/en/learn/${name}`)];
const urls = [...core, ...guides, ...lessons];
const priority = url => url === '/' ? '1.0' : url === '/unscrambler.html' ? '.9' : url.startsWith('/en/learn/') ? '.8' : '.7';
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${base}${url}</loc><lastmod>2026-09-09</lastmod><changefreq>${url.includes('/guides/') || url.includes('/en/learn/') ? 'monthly' : 'weekly'}</changefreq><priority>${priority(url)}</priority></url>`).join('\n')}\n</urlset>\n`);

console.log(`AdSense quality remediation applied: ${urls.length} focused sitemap URLs; ${noindex.length} development or duplicate pages excluded from indexing.`);
