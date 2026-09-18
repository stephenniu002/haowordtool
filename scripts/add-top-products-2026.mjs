import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://haowordtool.com';
const affiliateOffers = JSON.parse(fs.readFileSync(path.join(root, 'data', 'affiliate-offers.json'), 'utf8'));

const categories = [
  ['smart-home', 'Smart Home', 'Low-friction upgrades people understand in one glance.'],
  ['kitchen', 'Kitchen', 'Daily-use products that work well in short demos.'],
  ['cleaning', 'Cleaning', 'Problem-solution items with visible before-and-after hooks.'],
  ['wellness', 'Wellness', 'Comfort and recovery products with careful, non-medical claims.'],
  ['beauty', 'Beauty', 'Routine-friendly items for visual tutorials and gift guides.'],
  ['travel', 'Travel', 'Packable products with clear convenience angles.'],
  ['creator', 'Creator Gear', 'Tools that help solo creators film, edit and publish faster.'],
  ['pet', 'Pet', 'Owner-friendly products with repeatable content angles.'],
  ['outdoor', 'Outdoor', 'Portable gear for seasonal and emergency-prep content.'],
  ['office', 'Home Office', 'Desk upgrades for remote workers and small teams.']
];

const productNames = {
  'smart-home': ['Matter smart plug bundle', 'Video doorbell chime kit', 'Smart leak detector', 'Wi-Fi air quality monitor', 'Compact security camera', 'Smart garage controller', 'Motion-sensing night light', 'Smart thermostat sensor', 'Key finder tracker pack', 'Energy monitoring outlet'],
  kitchen: ['Countertop nugget ice maker', 'Compact air fryer oven', 'Cordless milk frother', 'Glass meal-prep containers', 'Under-sink water filter', 'Digital kitchen scale', 'Silicone freezer trays', 'Electric gooseneck kettle', 'Vacuum food sealer', 'Magnetic spice rack'],
  cleaning: ['Cordless handheld vacuum', 'Robot mop starter kit', 'Portable upholstery cleaner', 'Reusable lint roller set', 'Steam cleaning brush', 'Microfiber mop system', 'Mini dishwasher tablets case', 'Pet hair removal broom', 'Cordless window vacuum', 'Laundry scent booster organizer'],
  wellness: ['Weighted cooling blanket', 'Neck and shoulder heating pad', 'Massage gun mini', 'Sunrise alarm clock', 'Blue-light reading lamp', 'Walking pad desk treadmill', 'Ergonomic sleep pillow', 'Foot bath massager', 'Reusable gel cold pack', 'Noise-masking sleep speaker'],
  beauty: ['LED vanity mirror', 'Heatless curl set', 'Travel makeup brush kit', 'Silicone facial cleansing brush', 'Scalp massager brush', 'Mini skincare fridge', 'Refillable perfume atomizer', 'Hair dryer brush', 'Nail care organizer', 'Makeup sponge washer'],
  travel: ['Compression packing cubes', 'Magnetic phone travel mount', 'USB-C travel charger', 'RFID passport wallet', 'Collapsible water bottle', 'Carry-on toiletry kit', 'Luggage cup holder', 'Travel laundry sheets', 'Airplane foot hammock', 'Portable white-noise machine'],
  creator: ['Phone tripod with light', 'Wireless lav mic pair', 'Desktop product photo box', 'Portable teleprompter', 'Creator desk light bar', 'Short-form video remote', 'USB-C capture card', 'Foldable green screen', 'Podcast boom arm kit', 'SSD backup drive'],
  pet: ['Automatic pet feeder', 'Pet water fountain', 'Car seat cover for dogs', 'Cat litter mat', 'Slow feeder bowl', 'Pet grooming vacuum brush', 'GPS pet tracker holder', 'Calming pet bed', 'Portable paw cleaner', 'Pet camera treat dispenser'],
  outdoor: ['Portable power station', 'Solar lantern set', 'Insulated picnic backpack', 'Rechargeable hand warmer', 'Compact fireproof document bag', 'Emergency weather radio', 'Foldable camping table', 'Waterproof dry bag', 'Mosquito repellent device', 'Inflatable sleeping pad'],
  office: ['Adjustable laptop stand', 'Cable management tray', 'Desk walking mat', 'USB-C docking station', 'Monitor light bar', 'Vertical mouse', 'Desk drawer organizer', 'Acoustic desk divider', 'Whiteboard wall calendar', 'Webcam privacy light']
};

const categoryCopy = Object.fromEntries(categories);
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const products = categories.flatMap(([category, label], categoryIndex) => productNames[category].map((name, index) => {
  const rank = categoryIndex * 10 + index + 1;
  const channel = ['Pinterest idea pin', 'YouTube Shorts demo', 'TikTok problem-solution clip', 'SEO gift guide', 'Comparison review'][rank % 5];
  const buyer = ['busy parents', 'small apartment renters', 'solo creators', 'remote workers', 'gift shoppers'][rank % 5];
  const margin = ['Low', 'Medium', 'Medium-high', 'High'][rank % 4];
  return {
    rank,
    category,
    categoryLabel: label,
    name,
    buyer,
    channel,
    margin,
    hook: `Show how ${name.toLowerCase()} removes one daily annoyance for ${buyer}.`,
    angle: rank % 3 === 0 ? 'Best for visual before-and-after content.' : rank % 3 === 1 ? 'Best for quick comparison posts and gift guides.' : 'Best for short tutorials with a clear setup step.',
    caution: rank % 4 === 0 ? 'Avoid medical, income or guaranteed-performance claims.' : 'Compare real specifications before linking to an offer.',
    score: 70 + (rank * 7) % 27
  };
}));

function productCard(product) {
  return `<article class="product-card" id="${slug(product.name)}" data-product-card data-category="${product.category}">
    <div class="product-rank">#${String(product.rank).padStart(3, '0')}</div>
    <div class="product-visual"><span>${escape(product.categoryLabel)}</span><b>${escape(product.name.split(' ').slice(0, 2).join(' '))}</b></div>
    <div class="product-body">
      <p class="eyebrow">${escape(product.categoryLabel)} · Opportunity score ${product.score}</p>
      <h3>${escape(product.name)}</h3>
      <p>${escape(product.hook)}</p>
      <dl>
        <div><dt>Best channel</dt><dd>${escape(product.channel)}</dd></div>
        <div><dt>Buyer intent</dt><dd>${escape(product.buyer)}</dd></div>
        <div><dt>Margin signal</dt><dd>${escape(product.margin)}</dd></div>
      </dl>
      <p><strong>Content angle:</strong> ${escape(product.angle)}</p>
      <p class="product-caution"><strong>Watch:</strong> ${escape(product.caution)}</p>
    </div>
  </article>`;
}

const filterButtons = [['all', 'All'], ...categories.map(([id, label]) => [id, label])]
  .map(([id, label], index) => `<button type="button" data-category-filter="${id}" aria-pressed="${index === 0 ? 'true' : 'false'}">${escape(label)}</button>`)
  .join('');

const categoryRows = categories.map(([id, label, desc]) => `<article><b>${String(products.filter(p => p.category === id).length).padStart(2, '0')}</b><h3>${escape(label)}</h3><p>${escape(desc)}</p></article>`).join('');
const affiliateOfferCards = affiliateOffers.map(offer => `<article class="offer-card" data-network="${escape(offer.network.toLowerCase())}">
  <p class="eyebrow">${escape(offer.network)} · ${offer.tracking === 'active' ? 'Affiliate link' : 'Destination link'}</p>
  <h3>${escape(offer.name)}</h3>
  <p>${escape(offer.buyer)}</p>
  <p><strong>Content angle:</strong> ${escape(offer.angle)}</p>
  <a class="button${offer.network === 'Fiverr' ? ' primary' : ''}" href="${escape(offer.url)}" target="_blank" rel="sponsored noopener">Browse ${escape(offer.network)}</a>
</article>`).join('\n');
const productJson = products.map(product => ({
  '@type': 'ListItem',
  position: product.rank,
  name: product.name,
  url: `${base}/top-100-products-2026.html#${slug(product.name)}`
}));

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>2026 Top 100 Viral Products for Affiliate Marketing | HaoWordTool</title>
  <meta name="description" content="An original 2026 top 100 product-opportunity list for Pinterest, YouTube Shorts, TikTok and affiliate marketing content. Built for free-traffic testing and human-approved offers.">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${base}/top-100-products-2026.html">
  <meta property="og:type" content="website">
  <meta property="og:title" content="2026 Top 100 Viral Products for Affiliate Marketing">
  <meta property="og:description" content="A Wirecutter-inspired, original editorial product-opportunity hub for creator traffic and affiliate funnels.">
  <meta property="og:url" content="${base}/top-100-products-2026.html">
  <link rel="stylesheet" href="/assets/studio-design.css?v=seo1">
  <script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'ItemList',name:'2026 Top 100 Viral Product Opportunities',itemListElement:productJson})}</script>
  <style>
    .top-products-page main{max-width:1220px}
    .top-products-hero{padding:34px 0 50px;border-bottom:1px solid var(--line)}
    .top-products-hero h1{max-width:880px}
    .top-products-hero .muted{font-size:17px;line-height:1.9;max-width:780px}
    .editor-note{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px 20px;max-width:850px;color:#4e6257}
    .product-controls{position:sticky;top:0;z-index:3;background:#f7f8f2e8;backdrop-filter:blur(10px);padding:14px 0;border-bottom:1px solid var(--line)}
    .product-controls .search-row{display:flex;gap:12px;align-items:center}
    .product-controls input{max-width:420px;background:#fff}
    .category-filters{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .category-filters button{min-height:36px;padding:7px 12px;border-radius:7px;background:#fff}
    .category-filters [aria-pressed=true]{background:#17654a;color:#fff;border-color:#17654a}
    .category-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-top:26px}
    .category-grid article{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px}
    .category-grid b{font-size:26px;color:#8b9c7d;font-weight:400}
    .product-list{display:grid;gap:16px;margin-top:28px}
    .product-card{display:grid;grid-template-columns:78px 210px minmax(0,1fr);gap:18px;background:#fff;border:1px solid var(--line);border-radius:13px;padding:18px;align-items:stretch}
    .product-rank{font-size:18px;color:#17654a;font-weight:700;padding-top:4px}
    .product-visual{min-height:142px;border:1px solid #dae3d6;border-radius:10px;background:linear-gradient(145deg,#eff4e8,#fff);display:flex;flex-direction:column;justify-content:space-between;padding:15px}
    .product-visual span{font-size:10px;letter-spacing:.13em;color:#607166;text-transform:uppercase}
    .product-visual b{font-size:24px;line-height:1.2;color:#1f4635}
    .product-body h3{font-size:22px;margin:4px 0 8px}
    .product-body p{color:#52645a}
    .product-body dl{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}
    .product-body dl div{border:1px solid #e0e7d9;background:#f7f9f4;border-radius:8px;padding:10px}
    .product-body dt{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#72806f}
    .product-body dd{margin:4px 0 0;font-size:13px;color:#203e31}
    .product-caution{font-size:13px}
    .offer-section{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:42px 0;margin:18px 0 34px}
    .offer-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:22px}
    .offer-card{display:flex;flex-direction:column;align-items:flex-start;background:#fff;border:1px solid var(--line);border-radius:8px;padding:20px;min-height:260px}
    .offer-card h3{font-size:20px;margin:6px 0 8px}
    .offer-card p{color:#52645a}
    .offer-card .button{margin-top:auto}
    .tracking-note{font-size:13px;line-height:1.7;color:#52645a;max-width:920px}
    .affiliate-cta{margin-top:34px}
    @media(max-width:980px){.category-grid,.offer-grid{grid-template-columns:repeat(2,1fr)}.product-card{grid-template-columns:70px 1fr}.product-visual{grid-column:2}.product-body{grid-column:1/-1}}
    @media(max-width:600px){.product-controls .search-row{display:block}.product-controls input{max-width:none;margin-top:10px}.category-grid,.offer-grid,.product-body dl{grid-template-columns:1fr}.product-card{display:block}.product-rank{margin-bottom:10px}.product-visual{margin-bottom:14px}}
  </style>
</head>
<body class="top-products-page">
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-top">
    <a class="logo" href="/"><img src="/assets/hao-logo.svg?v=4" alt="HaoWordStudio" width="236" height="46" style="display:block;width:min(236px,50vw);height:auto"></a>
    <nav aria-label="Main navigation">
      <a href="/">App Studio</a>
      <a href="/top-100-products-2026.html" aria-current="page">Top 100 Products</a>
      <a href="/affiliate-marketing.html">Affiliate Funnel</a>
      <a href="/social-publisher.html">Social Publisher</a>
      <a href="/contact.html">Contact</a>
    </nav>
  </header>
  <main id="main">
    <section class="top-products-hero">
      <p class="eyebrow">2026 AFFILIATE PRODUCT RESEARCH</p>
      <h1>Top 100 viral product opportunities for Pinterest and short-form traffic.</h1>
      <p class="muted">This is an original HaoWordTool product-opportunity board for creators, solo founders and affiliate publishers. It borrows the clarity of editorial buying guides: a clear pick, who it fits, how to make content around it, and what claims to avoid.</p>
      <p class="editor-note"><strong>Disclosure:</strong> This page is not affiliated with Wirecutter or The New York Times and does not copy their rankings. Treat every item as a research starting point: verify price, commission, reviews, shipping, return policy and compliance before publishing affiliate links.</p>
      <div class="actions">
        <a class="button primary" href="/affiliate-marketing.html">Build a landing page funnel</a>
        <a class="button" href="/multi-platform-publishing-checklist.html">Get publishing checklist</a>
      </div>
    </section>

    <section class="home-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">EDITORIAL FRAMEWORK</p>
          <h2>Ten categories, one hundred content angles.</h2>
        </div>
        <p>Use this list to choose what to test first, then publish comparison posts, demos, gift guides and problem-solution Pins.</p>
      </div>
      <div class="category-grid">${categoryRows}</div>
    </section>

    <section class="offer-section" aria-labelledby="affiliate-offers-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">FIVERR + AMAZON PICKS</p>
          <h2 id="affiliate-offers-title">Match the content idea to a service or creator tool.</h2>
        </div>
        <p>Fiverr services solve production and marketing bottlenecks. Amazon products support filming, storage and home-office workflows.</p>
      </div>
      <div class="offer-grid">${affiliateOfferCards}</div>
      <p class="tracking-note"><strong>Affiliate disclosure:</strong> HaoWordTool may earn a commission from qualifying Fiverr marketplace purchases, Fiverr affiliate-program referrals, and Amazon purchases made through the marked links, at no extra cost to the visitor. As an Amazon Associate, HaoWordTool earns from qualifying purchases. Product availability, prices and program terms can change.</p>
    </section>

    <section class="product-controls" aria-label="Product filters">
      <div class="search-row">
        <strong><span id="visible-count">100</span> products visible</strong>
        <input id="product-search" type="search" placeholder="Search product, channel, buyer or category">
      </div>
      <div class="category-filters">${filterButtons}</div>
    </section>

    <section class="product-list" aria-label="Top 100 product opportunities">
      ${products.map(productCard).join('\n')}
    </section>

    <section class="home-banner affiliate-cta">
      <div>
        <p class="eyebrow">NEXT STEP</p>
        <h2>Do not send traffic straight to a store link.</h2>
        <p>Pick one product angle, create one short-form post, and send traffic to a focused landing page that collects channel, niche and pain point before you follow up.</p>
      </div>
      <a class="button primary" href="/affiliate-marketing.html">Create the funnel</a>
    </section>
  </main>
  <footer class="site-footer">
    <span>HaoWordTool · 2026 product opportunity board</span>
    <nav><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/contact.html">Contact</a></nav>
  </footer>
  <script src="/assets/top-products-2026.js" defer></script>
</body>
</html>`;

fs.writeFileSync(path.join(root, 'top-100-products-2026.html'), page);

const sitemapPath = path.join(root, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  if (!sitemap.includes(`${base}/top-100-products-2026.html`)) {
    sitemap = sitemap.replace('</urlset>', `  <url><loc>${base}/top-100-products-2026.html</loc><lastmod>2026-09-16</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n</urlset>`);
    fs.writeFileSync(sitemapPath, sitemap);
  }
}

for (const file of ['index.html', 'en/index.html', 'affiliate-marketing.html']) {
  const target = path.join(root, file);
  if (!fs.existsSync(target)) continue;
  let html = fs.readFileSync(target, 'utf8');
  if (!html.includes('data-top-products-entry')) {
    const card = `<section data-top-products-entry class="lesson-download" style="margin:32px 0"><p class="eyebrow">2026 PRODUCT RESEARCH</p><h2>Browse 100 product angles for affiliate content.</h2><p>Use the Top 100 board to choose products for Pinterest, YouTube Shorts, TikTok and buyer guides before sending traffic into a landing-page funnel.</p><div class="actions"><a class="button primary" href="/top-100-products-2026.html">Open the Top 100 board</a><a class="button" href="/affiliate-marketing.html">Build the funnel</a></div></section>`;
    html = html.replace('</main>', `${card}</main>`);
    fs.writeFileSync(target, html);
  }
}

console.log(`Generated top-100-products-2026.html with ${products.length} products.`);
