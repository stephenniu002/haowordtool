import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://haowordtool.com';
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'affiliate-products.json'), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const positions = ['50% 34%', '34% 42%', '68% 40%', '44% 64%', '72% 66%', '25% 70%', '58% 52%', '82% 42%', '18% 48%', '50% 78%'];
const channels = ['Pinterest comparison Pin', 'YouTube Shorts demo', 'TikTok problem-solution clip', 'SEO buyer guide', 'Instagram Reel'];
const hooks = [
  'Lead with one visible problem, then reveal the product as the practical fix.',
  'Build a three-scene comparison: old setup, product moment, improved routine.',
  'Turn the most useful feature into a fifteen-second tutorial with captions.',
  'Answer one buyer objection, then invite viewers into a focused follow-up page.',
  'Use a checklist or setup guide to earn the click before showing the offer.'
];

const products = data.categories.flatMap((category, categoryIndex) => category.products.map((name, index) => ({
  rank: categoryIndex * 10 + index + 1,
  name,
  categoryId: category.id,
  category: category.label,
  image: category.image,
  why: category.why,
  channel: channels[(categoryIndex + index) % channels.length],
  hook: hooks[index % hooks.length],
  position: positions[index]
})));

const productHref = product => `/affiliate-marketing.html?product=${encodeURIComponent(product.name)}&utm_source=affiliate_products&utm_medium=content&utm_campaign=ai_product_100`;
const amazonHref = product => {
  const asin = data.amazonAsins?.[product.name];
  return asin ? `https://www.amazon.com/dp/${encodeURIComponent(asin)}?tag=${encodeURIComponent(data.amazonTag)}` : '';
};

function productCard(product) {
  const amazonUrl = amazonHref(product);
  const amazonAction = amazonUrl
    ? `<a class="amazon-link" href="${amazonUrl}" target="_blank" rel="sponsored noopener">View product on Amazon <span aria-hidden="true">↗</span></a>`
    : `<span class="amazon-link pending">Amazon ASIN required</span>`;
  return `<article class="product-card" id="${slug(product.name)}" data-affiliate-product>
    <a class="product-media" href="${productHref(product)}" aria-label="Promote ${escape(product.name)} with AI">
      <img src="${product.image}" alt="Editorial product setup representing ${escape(product.category)}" loading="lazy" width="1200" height="900" style="object-position:${product.position}">
      <span class="pick-badge">AI PROMOTABLE</span>
    </a>
    <div class="product-info">
      <p class="product-kicker">#${String(product.rank).padStart(3, '0')} · ${escape(product.category)}</p>
      <h4>${escape(product.name)}</h4>
      <p>${escape(product.why)}</p>
      <p class="product-hook"><strong>Content angle:</strong> ${escape(product.hook)}</p>
      <p class="product-channel"><strong>Best first channel:</strong> ${escape(product.channel)}</p>
      <div class="product-actions">
        <a class="button primary" href="${productHref(product)}">Promote this with AI <span aria-hidden="true">→</span></a>
        ${amazonAction}
      </div>
    </div>
  </article>`;
}

const categorySections = data.categories.map(category => {
  const categoryProducts = products.filter(product => product.categoryId === category.id);
  const number = String(data.categories.indexOf(category) + 1).padStart(2, '0');
  return `<section class="category-block" id="${category.id}" data-product-category>
    <div class="category-heading">
      <p class="category-number">${number}</p>
      <div><h3>${escape(category.label)}</h3><p>${escape(category.why)}</p></div>
    </div>
    <div class="product-grid">${categoryProducts.map(productCard).join('\n')}</div>
  </section>`;
}).join('\n');

const categoryCards = data.categories.map((category, index) => `<a href="#${category.id}" data-category-jump>
  <img src="${category.image}" alt="${escape(category.label)} product collection" loading="lazy" width="1200" height="900" style="object-position:${positions[index]}">
  <span>${String(index + 1).padStart(2, '0')}</span><strong>${escape(category.label)}</strong><small>10 product ideas</small>
</a>`).join('\n');

const weeklyPicks = [products[0], products[18], products[45], products[62], products[90]].map((product, index) => `<article>
  <span class="deal-badge">${index === 0 ? 'EDITOR PICK' : 'TRENDING ANGLE'}</span>
  <h3>${escape(product.name)}</h3>
  <p>${escape(product.hook)}</p>
  <a href="${productHref(product)}">Generate AI promo <span aria-hidden="true">→</span></a>
</article>`).join('\n');

const comboCards = data.categories.map((category, index) => `<article>
  <span>${String(index + 1).padStart(2, '0')}</span>
  <div><h3>${escape(category.label)}</h3><p>${escape(channels[index % channels.length])} + AI video script + multi-platform publishing + lead follow-up.</p></div>
  <a href="/affiliate-marketing.html?category=${category.id}&utm_source=affiliate_products&utm_medium=editorial&utm_campaign=ai_combo_10" aria-label="Build the ${escape(category.label)} AI workflow">Build workflow →</a>
</article>`).join('\n');

const structuredProducts = products.map(product => ({
  '@type': 'ListItem',
  position: product.rank,
  name: product.name,
  url: `${base}/affiliate-products.html#${slug(product.name)}`
}));

function render({canonical, title, robots}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escape(title)}</title>
  <meta name="description" content="Browse 100 product ideas across 10 categories, each matched with an AI content, publishing and lead-follow-up workflow.">
  <meta name="robots" content="${robots}">
  <meta name="google-site-verification" content="V5m3Ygpe6VRjGSpzT7cTDbs60OFmx-hJfBzwGmgUzRQ">
  <meta name="p:domain_verify" content="7c64ba517a90ca07acc1a2e96cdd5b18">
  <meta name="google-adsense-account" content="ca-pub-4489946300243174">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="100 Products You Can Promote with AI">
  <meta property="og:description" content="A visual product-opportunity guide for Pinterest and short-form affiliate content.">
  <meta property="og:url" content="${canonical}">
  <link rel="stylesheet" href="/assets/studio-design.css?v=seo1">
  <script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'ItemList',name:'100 Products You Can Promote with AI',itemListElement:structuredProducts})}</script>
  <style>
    :root{--editor-blue:#1f5da8;--editor-green:#17654a;--editor-ink:#171717;--editor-muted:#626262;--editor-line:#d9d9d4;--editor-paper:#fff;--editor-warm:#f4f1e9;--editor-yellow:#f2cf63}
    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body.affiliate-products-page{margin:0;background:var(--editor-paper);color:var(--editor-ink);font-family:Georgia,'Times New Roman',serif;letter-spacing:0}
    .affiliate-products-page h1,.affiliate-products-page h2,.affiliate-products-page h3,.affiliate-products-page h4,.affiliate-products-page nav,.affiliate-products-page button,.affiliate-products-page input,.affiliate-products-page .eyebrow,.affiliate-products-page .button,.affiliate-products-page .product-kicker,.affiliate-products-page .pick-badge,.affiliate-products-page .deal-badge{font-family:Arial,'Helvetica Neue',sans-serif;letter-spacing:0}
    .site-top{max-width:1180px;margin:auto;border-bottom:2px solid var(--editor-ink);padding:18px 22px}
    .site-top nav{gap:20px}
    main{max-width:1180px;margin:auto;padding:0 22px 72px}
    .hero-search{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:56px;align-items:end;padding:66px 0 58px;border-bottom:1px solid var(--editor-line)}
    .hero-search h1{font-size:clamp(46px,7vw,82px);line-height:.96;margin:10px 0 24px;max-width:790px;font-weight:800}
    .hero-search .sub{max-width:720px;font-size:20px;line-height:1.55;color:#3d3d3d}
    .eyebrow{font-size:12px;font-weight:800;color:var(--editor-green);text-transform:uppercase}
    .search-panel{background:var(--editor-warm);border-top:5px solid var(--editor-yellow);padding:24px}
    .search-panel h2{font-size:24px;margin:0 0 10px}
    .search-panel p{color:var(--editor-muted);margin:0 0 18px}
    .search-box{display:flex;border:1px solid #94948f;background:#fff}
    .search-box input{min-width:0;flex:1;border:0;padding:14px;font-size:15px;background:#fff}
    .search-box button{border:0;background:var(--editor-blue);color:#fff;padding:14px 16px;font-weight:700;white-space:nowrap}
    .result-count{margin:12px 0 0;font:13px Arial,sans-serif;color:var(--editor-muted)}
    .disclosure{margin:18px 0 0;padding-left:13px;border-left:3px solid var(--editor-yellow);font-size:13px;line-height:1.55;color:#555}
    .section-wrap{padding:54px 0;border-bottom:1px solid var(--editor-line)}
    .section-heading{display:flex;justify-content:space-between;gap:32px;align-items:end;margin-bottom:24px}
    .section-heading h2{font-size:34px;line-height:1.05;margin:6px 0 0}
    .section-heading>p{max-width:500px;color:var(--editor-muted);margin:0}
    .deal-strip{display:grid;grid-template-columns:repeat(5,1fr);border-top:2px solid var(--editor-ink);border-bottom:1px solid var(--editor-line)}
    .deal-strip article{padding:18px 16px 20px;border-right:1px solid var(--editor-line);min-height:220px;display:flex;flex-direction:column}
    .deal-strip article:last-child{border-right:0}
    .deal-strip h3{font-size:17px;line-height:1.25;margin:12px 0 8px}
    .deal-strip p{font-size:14px;color:var(--editor-muted);margin:0 0 16px}
    .deal-strip a{color:var(--editor-blue);font:700 14px Arial,sans-serif;margin-top:auto}
    .deal-badge{font-size:10px;font-weight:800;color:#8b3e00;background:#fff1c7;align-self:flex-start;padding:4px 6px}
    .category-nav{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}
    .category-nav a{color:inherit;text-decoration:none;border-bottom:2px solid var(--editor-ink);padding-bottom:12px}
    .category-nav img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;margin-bottom:10px}
    .category-nav span,.category-nav small{display:block;font:11px Arial,sans-serif;color:var(--editor-muted)}
    .category-nav strong{display:block;font:700 16px/1.2 Arial,sans-serif;margin:4px 0}
    .combo-list{display:grid;grid-template-columns:1fr 1fr;border-top:2px solid var(--editor-ink)}
    .combo-list article{display:grid;grid-template-columns:36px 1fr auto;gap:14px;align-items:start;padding:18px 0;border-bottom:1px solid var(--editor-line)}
    .combo-list article:nth-child(odd){padding-right:22px;border-right:1px solid var(--editor-line)}
    .combo-list article:nth-child(even){padding-left:22px}
    .combo-list span{font:700 12px Arial,sans-serif;color:var(--editor-green)}
    .combo-list h3{font-size:18px;margin:0 0 5px}
    .combo-list p{font-size:14px;color:var(--editor-muted);margin:0}
    .combo-list a{font:700 13px Arial,sans-serif;color:var(--editor-blue);white-space:nowrap}
    .categories-title{padding:58px 0 22px;border-bottom:4px solid var(--editor-ink)}
    .categories-title h2{font-size:42px;margin:6px 0 8px}
    .categories-title p{max-width:700px;color:var(--editor-muted)}
    .category-block{padding:54px 0;border-bottom:4px solid var(--editor-ink);scroll-margin-top:20px}
    .category-heading{display:grid;grid-template-columns:80px minmax(0,1fr);gap:20px;margin-bottom:26px}
    .category-number{font:800 42px Arial,sans-serif;color:var(--editor-green);margin:0}
    .category-heading h3{font-size:34px;margin:0 0 8px}
    .category-heading p{max-width:720px;color:var(--editor-muted);margin:0}
    .product-grid{display:grid;grid-template-columns:1fr 1fr;gap:38px 24px}
    .product-card{display:grid;grid-template-rows:auto 1fr;border-bottom:1px solid var(--editor-line);padding-bottom:28px;min-width:0}
    .product-media{position:relative;display:block;overflow:hidden;background:#efeee9}
    .product-media img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;transition:transform .25s ease}
    .product-media:hover img{transform:scale(1.025)}
    .pick-badge{position:absolute;left:12px;bottom:12px;background:#fff;color:var(--editor-green);border:1px solid var(--editor-green);padding:5px 7px;font-size:10px;font-weight:800}
    .product-info{padding-top:15px;display:flex;flex-direction:column}
    .product-kicker{font-size:11px;font-weight:800;color:var(--editor-green);margin:0 0 7px;text-transform:uppercase}
    .product-info h4{font-size:24px;line-height:1.15;margin:0 0 10px}
    .product-info>p{font-size:15px;line-height:1.55;color:#555;margin:0 0 10px}
    .product-hook,.product-channel{font-size:14px!important}
    .product-actions{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:auto;padding-top:10px}
    .product-actions .button{border-radius:4px}
    .amazon-link{font:700 14px Arial,sans-serif;color:var(--editor-blue)}
    .amazon-link.pending{display:inline-flex;align-items:center;color:#8b3e00;background:#fff4cf;border:1px solid #e3c86a;border-radius:4px;padding:7px 9px;text-decoration:none}
    .empty-state{padding:40px;border:1px solid var(--editor-line);background:var(--editor-warm);font-size:18px}
    .final-cta{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:36px;align-items:center;background:#122c23;color:#fff;padding:38px;margin-top:58px}
    .final-cta h2{font-size:34px;margin:0 0 10px;color:#fff}
    .final-cta p{margin:0;color:#d8e8df;max-width:700px}
    .final-cta .button{background:var(--editor-yellow);color:#1c1c1c;border-color:var(--editor-yellow);border-radius:4px}
    @media(max-width:900px){.hero-search{grid-template-columns:1fr;gap:26px}.deal-strip{grid-template-columns:1fr 1fr}.deal-strip article{border-bottom:1px solid var(--editor-line)}.category-nav{grid-template-columns:repeat(2,1fr)}.combo-list{grid-template-columns:1fr}.combo-list article:nth-child(odd),.combo-list article:nth-child(even){padding:18px 0;border-right:0}.final-cta{grid-template-columns:1fr}}
    @media(max-width:640px){main{padding-left:16px;padding-right:16px}.site-top{padding-left:16px;padding-right:16px}.hero-search{padding:40px 0}.hero-search h1{font-size:48px}.hero-search .sub{font-size:18px}.search-box{display:block}.search-box input,.search-box button{width:100%}.section-heading{display:block}.section-heading>p{margin-top:12px}.deal-strip,.product-grid{grid-template-columns:1fr}.deal-strip article{border-right:0;min-height:0}.category-heading{grid-template-columns:1fr;gap:4px}.category-number{font-size:24px}.category-heading h3,.section-heading h2,.categories-title h2{font-size:30px}.product-info h4{font-size:22px}.combo-list article{grid-template-columns:28px 1fr}.combo-list article>a{grid-column:2}.final-cta{padding:26px 20px}}
  </style>
</head>
<body class="affiliate-products-page">
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-top">
    <a class="logo" href="/"><img src="/assets/hao-logo.svg?v=4" alt="HaoWordStudio" width="236" height="46" style="display:block;width:min(236px,50vw);height:auto"></a>
    <nav aria-label="Main navigation"><a href="/">App Studio</a><a href="/affiliate-dashboard.html">Product workspace</a><a href="/affiliate-products.html" aria-current="page">100 Products</a><a href="/affiliate-marketing.html">AI Affiliate Workflow</a><a href="/contact.html">Contact</a></nav>
  </header>
  <main id="main">
    <section class="hero-search">
      <div>
        <p class="eyebrow">AI + AFFILIATE MARKETING</p>
        <h1>100 products.<br>One AI workflow to promote them all.</h1>
        <p class="sub">Pick a product below. HaoWordTool connects the content path: AI video, multi-platform publishing, automatic replies, lead follow-up, and payment guidance.</p>
        <p class="disclosure"><strong>Disclosure:</strong> HaoWordTool may earn a commission from Amazon and Fiverr when you click links on this page. As an Amazon Associate, HaoWordTool earns from qualifying purchases. Amazon product buttons are enabled only after a specific ASIN is mapped to the item; no homepage or generic Amazon link is used on this page. This is an original product-opportunity guide and is not affiliated with Wirecutter or The New York Times.</p>
      </div>
      <aside class="search-panel">
        <p class="eyebrow">PRODUCT FINDER</p>
        <h2>Find a product to promote</h2>
        <p>Search a product, category, content angle, or channel.</p>
        <form class="search-box" role="search"><input id="affiliate-product-search" type="search" placeholder="Search products or categories…" aria-label="Search products"><button type="submit">Find idea →</button></form>
        <p class="result-count"><strong id="affiliate-product-count">100</strong> product ideas visible</p>
      </aside>
    </section>

    <section class="section-wrap">
      <div class="section-heading"><div><p class="eyebrow">THIS WEEK</p><h2>Five highly visual campaign ideas</h2></div><p>Editorial picks based on how clearly the product can be demonstrated in short-form content, not a promise of sales or income.</p></div>
      <div class="deal-strip">${weeklyPicks}</div>
    </section>

    <section class="section-wrap">
      <div class="section-heading"><div><p class="eyebrow">BROWSE</p><h2>Ten categories, ten products each</h2></div><p>Jump to the category that matches your audience, then use the product card to start an AI promotion workflow.</p></div>
      <nav class="category-nav" aria-label="Product categories">${categoryCards}</nav>
    </section>

    <section class="section-wrap">
      <div class="section-heading"><div><p class="eyebrow">EDITOR'S WORKFLOWS</p><h2>Ten product × AI combinations</h2></div><p>Each route connects a product idea to a channel, content format, publishing plan, and follow-up path.</p></div>
      <div class="combo-list">${comboCards}</div>
    </section>

    <section class="categories-title"><p class="eyebrow">THE FULL DIRECTORY</p><h2>All 100 product opportunities</h2><p>Product names are research starting points. HaoWordTool does not claim to have independently tested every item.</p></section>
    <p id="affiliate-product-empty" class="empty-state" hidden>No matching product found. Try a broader term such as “audio,” “home,” “fitness,” or “gaming.”</p>
    ${categorySections}

    <section class="final-cta">
      <div><p class="eyebrow">NEXT STEP</p><h2>Found a product you want to promote?</h2><p>Turn the product idea into an AI video brief, a multi-platform publishing plan, automatic replies, and tracked lead follow-up.</p></div>
      <a class="button primary" href="/affiliate-marketing.html?utm_source=affiliate_products&utm_medium=final_cta&utm_campaign=ai_product_100">Start the AI workflow →</a>
    </section>
  </main>
  <footer class="site-footer"><span>HaoWordTool · 100 AI-promotable product ideas</span><nav><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/contact.html">Contact</a></nav></footer>
  <script src="/assets/affiliate-products.js" defer></script>
</body>
</html>`;
}

const rootPage = render({
  canonical: `${base}/affiliate-products.html`,
  title: '100 Products You Can Promote with AI | HaoWordTool',
  robots: 'index,follow,max-image-preview:large'
});
const englishPage = render({
  canonical: `${base}/en/affiliate-products.html`,
  title: 'AI Affiliate Product Ideas: 100 Visual Campaigns | HaoWordTool',
  robots: 'noindex,follow'
}).replace('<meta name="robots" content="noindex,follow">', '<meta name="localization-status" content="entry-only"><meta name="robots" content="noindex,follow">');

fs.writeFileSync(path.join(root, 'affiliate-products.html'), rootPage);
fs.mkdirSync(path.join(root, 'en'), {recursive: true});
fs.writeFileSync(path.join(root, 'en', 'affiliate-products.html'), englishPage);

const sitemapPath = path.join(root, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  if (!sitemap.includes(`${base}/affiliate-products.html`)) {
    sitemap = sitemap.replace('</urlset>', `  <url><loc>${base}/affiliate-products.html</loc></url>\n</urlset>`);
    fs.writeFileSync(sitemapPath, sitemap);
  }
}

console.log(`Generated affiliate-products.html with ${products.length} image-backed product cards.`);
