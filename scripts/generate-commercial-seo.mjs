import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const ads = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4489946300243174" crossorigin="anonymous"></script>';
const header = '<header class="site-top"><a class="logo" href="/en/"><img src="/assets/hao-logo.svg?v=4" alt="HaoWordStudio" width="236" height="46" style="display:block;width:min(236px,50vw);height:auto"></a><nav aria-label="Main navigation"><a href="/en/">Workspace</a><a href="/en/learn/">Tutorials</a><a href="/contact.html">Contact</a></nav></header>';
const footer = '<footer class="site-footer"><span>HaoWord Studio · Practical tutorials</span><nav><a href="/privacy.html">Privacy</a><a href="/contact.html">Contact</a></nav></footer>';
const shop = `<section class="commerce-entry" id="template-packs"><p class="eyebrow">TEMPLATE PACKS</p><h2>Start with working source code</h2><p>Download the free example now, or request a custom HTML template pack for your project. Paid self-service packs are being prepared; no payment is collected on this page.</p><div class="actions"><a class="button primary" href="mailto:love6598878593@gmail.com?subject=HaoWordStudio%20template%20pack">Request a template pack</a><a class="button" href="/en/?utm_source=seo_guide&amp;utm_medium=internal&amp;utm_campaign=template_pack">Open the free workspace</a></div><p class="status">Clear delivery status: free examples work now. A price and delivery list will be sent before any custom order is accepted.</p></section>`;

function page({slug,title,description,image,imageAlt,body,related}) {
  const url = `https://haowordtool.com/en/learn/${slug}.html`;
  const json = JSON.stringify({'@context':'https://schema.org','@type':'TechArticle',headline:title,description,inLanguage:'en',datePublished:'2026-09-09',dateModified:'2026-09-09',author:{'@type':'Organization',name:'HaoWord Studio',url:'https://haowordtool.com'},mainEntityOfPage:url});
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | HaoWord Studio</title><meta name="description" content="${description}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://haowordtool.com${image}"><link rel="stylesheet" href="/assets/studio-design.css?v=seo1"><link rel="stylesheet" href="/assets/tutorials.css?v=2">${ads}</head><body>${header}<main class="lesson"><p class="eyebrow">PRACTICAL GUIDE · SEPTEMBER 9, 2026</p><h1>${title}</h1><p class="lesson-lead">${description}</p><figure><img src="${image}" alt="${imageAlt}" width="1600" height="900" loading="eager"><figcaption>Actual HaoWordStudio interface used for the steps in this guide.</figcaption></figure><article>${body}</article>${shop}<h2>Related practical guides</h2><ul>${related.map(([href,label])=>`<li><a href="${href}">${label}</a></li>`).join('')}</ul><p class="hint">Written and tested by HaoWord Studio against the current browser workspace and included examples.</p><script type="application/ld+json">${json}</script></main>${footer}</body></html>`;
}

const articles = [
  {
    slug:'html-css-javascript-online-editor',
    title:'HTML, CSS and JavaScript online editor: a practical workflow',
    description:'Use a browser editor to separate three files, run a real interactive page, diagnose common errors and export the result safely.',
    image:'/marketing/demo-en/03-edit.png',
    imageAlt:'HaoWordStudio HTML CSS and JavaScript editor with code and live preview',
    body:`<p>An online editor is useful when you have a small static project and want to see a result without installing a build system. HaoWordStudio keeps HTML, CSS and JavaScript in separate tabs and renders them together in an isolated preview. This guide uses the included daily-plan example, so every check has a visible result.</p>
<h2>Load three real files</h2><ol><li><a href="/examples/daily-plan-en.zip" download>Download the daily-plan ZIP</a> and extract it.</li><li>Open the <a href="/en/?utm_source=editor_guide&amp;utm_medium=internal&amp;utm_campaign=english_seo">English workspace</a>.</li><li>Choose <strong>Import HTML / CSS / JS</strong> and select <code>index.html</code>, <code>styles.css</code> and <code>app.js</code> together.</li><li>Run the project. You should see three tasks and a counter that reads 0 / 3.</li></ol>
<h2>Edit one layer at a time</h2><p>Change the HTML heading first and run the project. Then change a color in CSS and run it again. Finally, change the label created by JavaScript. Testing one layer at a time makes the source of a failure obvious.</p><pre><code>&lt;h1&gt;My study plan&lt;/h1&gt;

h1 { color: #17654a; }

addButton.textContent = 'Add task';</code></pre>
<h2>Use a repeatable test</h2><p>A page that looks correct can still be broken. Check the first task and confirm that the counter changes. Add a new task and confirm that both the list and total update. These two interactions test event listeners, DOM updates and the relationship between the HTML IDs and JavaScript selectors.</p>
<h2>Know what this workflow supports</h2><table><thead><tr><th>Project</th><th>Works directly?</th><th>Reason</th></tr></thead><tbody><tr><td>Plain HTML, CSS and JavaScript</td><td>Yes</td><td>The browser can execute it without compilation.</td></tr><tr><td>React component</td><td>No</td><td>It normally needs packages and a build step.</td></tr><tr><td>Node server</td><td>No</td><td>Server code cannot run inside a static browser preview.</td></tr><tr><td>External API application</td><td>Partial</td><td>Network access, keys and CORS require a suitable environment.</td></tr></tbody></table>
<h2>Export only after testing</h2><p>Run the project after your last edit, test the interactions again, then export the ZIP. Extract the download into a new folder and open <code>index.html</code>. That final check catches missing files before you publish or deliver the project.</p>`,
    related:[['/en/learn/run-ai-html.html','How to run AI-generated HTML'],['/en/learn/export-html-css-js-zip.html','Export HTML, CSS and JavaScript as ZIP']]
  },
  {
    slug:'ai-website-templates',
    title:'AI website templates: how to choose, test and customize one',
    description:'Evaluate AI-generated website templates by structure, responsive behavior, interactions and export quality before using them for a real project.',
    image:'/marketing/demo-en/02-import.png',
    imageAlt:'Importing an AI website template into HaoWordStudio',
    body:`<p>An AI-generated template is useful only when you can understand, edit and deliver it. A polished screenshot is not enough. Before choosing a template, inspect its files, test its main action and check whether it still works on a phone.</p>
<h2>Use this five-part checklist</h2><ol><li><strong>Complete structure:</strong> look for a heading, navigation, main content and footer.</li><li><strong>Separate files:</strong> prefer an <code>index.html</code>, stylesheet and JavaScript file that have clear names.</li><li><strong>Real action:</strong> test the form, menu or button that matters to the page.</li><li><strong>Responsive layout:</strong> inspect the page at about 390 pixels wide.</li><li><strong>Portable export:</strong> extract the ZIP and open it outside the editor.</li></ol>
<h2>Ask AI for a deliverable format</h2><p>A clear prompt reduces repair work. Ask for a standalone static project with no build step, three named files, accessible labels and responsive CSS. Also ask the AI to explain any external dependency before it adds one.</p><pre><code>Create a responsive landing page as three files:
index.html, styles.css and app.js.
Use no framework and no build step.
Include a working mobile menu and form validation.
Return each complete file in a separate code block.</code></pre>
<h2>Test the template before changing the design</h2><p>Import all files into HaoWordStudio and run the untouched version first. Record what works. Then replace the brand name, heading and colors. Run the same checks after every group of changes. If the original version fails, ask the AI to repair that exact failure instead of adding new features.</p>
<h2>Avoid template traps</h2><ul><li>A React fragment pasted into an HTML file is not a complete website.</li><li>A contact form without a server or form provider cannot send messages.</li><li>Placeholder testimonials should not be presented as real customer statements.</li><li>Remote images may disappear or have licensing restrictions.</li><li>An exported ZIP is source code, not a hosted website or signed mobile app.</li></ul>
<h2>Try two working examples</h2><p>Use the <a href="/examples/landing-page-en/">landing-page demo</a> for a product page and the <a href="/examples/portfolio-en/">portfolio demo</a> for a personal site. Both are plain static projects designed for editing and export.</p>`,
    related:[['/en/learn/landing-page-html-template.html','Build a landing-page HTML template'],['/en/learn/portfolio-website-source-code.html','Build a portfolio from source code']]
  },
  {
    slug:'landing-page-html-template',
    title:'Landing page HTML template: build and test a working example',
    description:'Create a responsive product landing page with semantic HTML, focused CSS and a working email validation interaction.',
    image:'/marketing/demo-en/04-mobile.png',
    imageAlt:'Mobile-width preview of a responsive website in HaoWordStudio',
    body:`<p>This example is a small product landing page with a clear headline, feature cards and an email interest form. It uses no library and makes no network request. The form validates an address in the browser and displays a confirmation message, which gives you a real interaction to test.</p>
<h2>Open the finished example</h2><div class="actions"><a class="button primary" href="/examples/landing-page-en.zip" download>Download landing-page ZIP</a><a class="button" href="/examples/landing-page-en/">Open live demo</a></div>
<iframe src="/examples/landing-page-en/" title="Working landing-page HTML template demo" loading="lazy"></iframe>
<h2>Build the page in three layers</h2><p>HTML defines the promise and page order. CSS creates the responsive layout. JavaScript validates the only interactive element. Keeping those jobs separate makes the template easier to reuse.</p><pre><code>&lt;form id="interest-form" novalidate&gt;
  &lt;label for="email"&gt;Work email&lt;/label&gt;
  &lt;input id="email" type="email" required&gt;
  &lt;button&gt;Request access&lt;/button&gt;
  &lt;p id="form-message" role="status"&gt;&lt;/p&gt;
&lt;/form&gt;</code></pre>
<h2>Run four acceptance checks</h2><ol><li>The main heading explains the product without relying on the image.</li><li>All feature cards stack into one column on a narrow screen.</li><li>An invalid email produces a helpful message.</li><li>A valid email produces a local confirmation without claiming that data was sent.</li></ol>
<h2>Connect a real form later</h2><p>The example does not collect or transmit an email address. To accept real submissions, connect a form service or your own backend, add a privacy explanation and test failure states. Never imply that a browser-only confirmation means a lead was stored.</p>
<h2>Customize without breaking it</h2><p>Replace the product name, one-sentence promise, three benefits and call to action. Keep the label connected to the email input and preserve the status message. After every change, repeat the invalid and valid email tests at desktop and mobile widths.</p>`,
    related:[['/en/learn/preview-mobile-webpage.html','Preview a webpage at mobile width'],['/en/learn/html-css-javascript-online-editor.html','Use an online HTML, CSS and JavaScript editor']]
  },
  {
    slug:'portfolio-website-source-code',
    title:'Portfolio website source code: build a responsive personal site',
    description:'Download and customize a complete portfolio example with project cards, accessible navigation and a working category filter.',
    image:'/marketing/demo-en/05-export.png',
    imageAlt:'Exporting HTML CSS and JavaScript website source code as a ZIP',
    body:`<p>A useful portfolio should tell a visitor what you do, show a small number of relevant projects and provide a clear contact route. This example includes all three. Its category buttons filter project cards in the browser, so you can verify that the JavaScript works before you export it.</p>
<h2>Open the source and demo</h2><div class="actions"><a class="button primary" href="/examples/portfolio-en.zip" download>Download portfolio ZIP</a><a class="button" href="/examples/portfolio-en/">Open live demo</a></div>
<iframe src="/examples/portfolio-en/" title="Working portfolio website source-code demo" loading="lazy"></iframe>
<h2>Change the identity first</h2><ol><li>Replace the sample name and role in the hero section.</li><li>Write a specific one-sentence description of the work you want.</li><li>Replace the email link with an address you monitor.</li><li>Update each project title, result and category.</li></ol>
<h2>Keep project cards factual</h2><p>Each card should state the problem, your contribution and a result you can support. Remove invented metrics and client names. If a project is a practice exercise, label it clearly. Honest context makes a small portfolio stronger than vague claims.</p><pre><code>&lt;article class="project" data-category="web"&gt;
  &lt;p class="tag"&gt;Web&lt;/p&gt;
  &lt;h2&gt;Accessible event page&lt;/h2&gt;
  &lt;p&gt;A practice build focused on keyboard navigation.&lt;/p&gt;
&lt;/article&gt;</code></pre>
<h2>Test the filter and keyboard flow</h2><p>Select each category and confirm that only matching cards remain visible. Then use the Tab key from the top of the page. The navigation, filter buttons and contact link should receive focus in a logical order. Repeat the test at mobile width and confirm that headings do not overflow.</p>
<h2>Export and publish</h2><p>Export the project as a ZIP, extract it and open <code>index.html</code>. A ZIP is ready to hand to a static host, but it is not online until you deploy it. Keep a clean copy of the exported source before adding analytics, forms or third-party scripts.</p>`,
    related:[['/en/learn/export-html-css-js-zip.html','Export a static project as ZIP'],['/en/learn/ai-website-templates.html','Evaluate AI website templates']]
  }
];

for (const article of articles) writeFileSync(join(root,'en','learn',`${article.slug}.html`),page(article),'utf8');

const exampleRoot = join(root,'examples');
const landingDir = join(exampleRoot,'landing-page-en');
const portfolioDir = join(exampleRoot,'portfolio-en');
mkdirSync(landingDir,{recursive:true});
mkdirSync(portfolioDir,{recursive:true});

writeFileSync(join(landingDir,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Northstar — landing-page example</title><link rel="stylesheet" href="styles.css"></head><body><header><a class="brand" href="#">Northstar</a><a href="#interest">Request access</a></header><main><section class="hero"><p class="eyebrow">A SMALL, WORKING TEMPLATE</p><h1>Plan the work that matters.</h1><p>Northstar turns a scattered project list into one clear weekly view.</p><a class="primary" href="#interest">See how it works</a></section><section class="features" aria-label="Product benefits"><article><h2>One weekly view</h2><p>Keep priorities, owners and due dates together.</p></article><article><h2>Visible progress</h2><p>See what moved without another status meeting.</p></article><article><h2>Clean handoff</h2><p>Export a simple summary for clients and teammates.</p></article></section><section id="interest" class="form-card"><h2>Request early access</h2><form id="interest-form" novalidate><label for="email">Work email</label><div><input id="email" type="email" required placeholder="you@example.com"><button>Request access</button></div><p id="form-message" role="status"></p></form><small>Demo only. This example does not send or store your address.</small></section></main><footer>Northstar demo · Built with plain HTML, CSS and JavaScript</footer><script src="app.js"></script></body></html>`,'utf8');
writeFileSync(join(landingDir,'styles.css'),`:root{font-family:Inter,Arial,sans-serif;color:#163c2a;background:#f7f8f1}*{box-sizing:border-box}body{margin:0}header,main,footer{max-width:1040px;margin:auto;padding:24px}header{display:flex;justify-content:space-between;align-items:center}.brand{font-size:24px;font-weight:800;color:#163c2a;text-decoration:none}header>a:last-child,.primary,button{background:#f2c94c;color:#163c2a;border:0;border-radius:10px;padding:12px 18px;font-weight:800;text-decoration:none}.hero{padding:80px 0 55px;max-width:720px}.eyebrow{font-weight:800;color:#56735e}.hero h1{font-size:clamp(42px,8vw,82px);line-height:1;margin:.2em 0}.hero>p:not(.eyebrow){font-size:20px;line-height:1.6;margin-bottom:32px}.features{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.features article,.form-card{background:white;border:1px solid #d8e1d2;border-radius:16px;padding:24px}.form-card{margin:60px 0}.form-card div{display:flex;gap:10px}input{flex:1;padding:13px;border:1px solid #a9b9a6;border-radius:10px;font:inherit}#form-message{min-height:24px;font-weight:700}footer{color:#627064;border-top:1px solid #d8e1d2}@media(max-width:650px){.features{grid-template-columns:1fr}.form-card div{display:block}.form-card input,.form-card button{width:100%;margin-top:8px}.hero{padding-top:45px}}`,'utf8');
writeFileSync(join(landingDir,'app.js'),`const form=document.querySelector('#interest-form');const email=document.querySelector('#email');const message=document.querySelector('#form-message');form.addEventListener('submit',event=>{event.preventDefault();if(!email.validity.valid){message.textContent='Enter a valid email address to test the form.';email.focus();return;}message.textContent='Validation works. This demo did not send or store the address.';form.reset();});`,'utf8');

writeFileSync(join(portfolioDir,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Alex Chen — portfolio example</title><link rel="stylesheet" href="styles.css"></head><body><header><a href="#top" class="brand">AC</a><nav><a href="#work">Work</a><a href="mailto:hello@example.com">Contact</a></nav></header><main id="top"><section class="hero"><p>DESIGNER + FRONT-END BUILDER</p><h1>Useful interfaces, explained clearly.</h1><p>I design and build small web products with accessible interaction and maintainable code.</p></section><section id="work"><div class="section-head"><h2>Selected work</h2><div class="filters" aria-label="Filter projects"><button class="active" data-filter="all">All</button><button data-filter="web">Web</button><button data-filter="design">Design</button></div></div><div class="grid"><article class="project" data-category="web"><p class="tag">Web</p><h2>Accessible event page</h2><p>A practice build focused on keyboard navigation and readable schedules.</p></article><article class="project" data-category="design"><p class="tag">Design</p><h2>Local library identity</h2><p>A concept system for events, signage and community reading lists.</p></article><article class="project" data-category="web"><p class="tag">Web</p><h2>Weekly planning tool</h2><p>A static prototype that turns project tasks into one focused view.</p></article></div></section></main><footer><strong>Available for small web projects.</strong><a href="mailto:hello@example.com">hello@example.com</a></footer><script src="app.js"></script></body></html>`,'utf8');
writeFileSync(join(portfolioDir,'styles.css'),`:root{font-family:Arial,sans-serif;color:#18261f;background:#f6f1e7}*{box-sizing:border-box}body{margin:0}header,main,footer{max-width:1050px;margin:auto;padding:24px}header,nav,footer,.section-head{display:flex;align-items:center;justify-content:space-between;gap:20px}a{color:inherit}.brand{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:#1d4f3a;color:#ffd34f;text-decoration:none;font-weight:900}nav a{font-weight:700}.hero{padding:100px 0;max-width:800px}.hero>p:first-child,.tag{font-size:13px;font-weight:900;letter-spacing:.12em;color:#52705e}.hero h1{font-size:clamp(44px,8vw,86px);line-height:1;margin:.22em 0}.hero>p:last-child{font-size:20px;line-height:1.6;max-width:670px}.filters{display:flex;gap:8px}.filters button{border:1px solid #95a698;background:transparent;border-radius:999px;padding:9px 16px}.filters button.active{background:#1d4f3a;color:white}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin:24px 0 90px}.project{min-height:230px;background:white;border-radius:16px;padding:25px;border:1px solid #ded6c6}.project[hidden]{display:none}.project h2{font-size:26px}.project p:last-child{line-height:1.6;color:#52615a}footer{border-top:1px solid #d7cdbb;margin-top:40px}@media(max-width:700px){.grid{grid-template-columns:1fr}.section-head,footer{align-items:flex-start;flex-direction:column}.hero{padding:60px 0}}`,'utf8');
writeFileSync(join(portfolioDir,'app.js'),`const buttons=[...document.querySelectorAll('[data-filter]')];const cards=[...document.querySelectorAll('[data-category]')];buttons.forEach(button=>button.addEventListener('click',()=>{buttons.forEach(item=>item.classList.remove('active'));button.classList.add('active');cards.forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter;});}));`,'utf8');

const lessons = [
  ['LESSON 1','/en/learn/run-ai-html.html','How to run AI-generated HTML, CSS and JavaScript','Identify a static project, import three files and prove that its interactions work.'],
  ['LESSON 2','/en/learn/html-css-javascript-online-editor.html','HTML, CSS and JavaScript online editor workflow','Edit one layer at a time, diagnose failures and verify the exported project.'],
  ['LESSON 3','/en/learn/preview-mobile-webpage.html','How to preview a webpage at mobile width','Test wrapping, controls and long labels at a narrow viewport.'],
  ['LESSON 4','/en/learn/export-html-css-js-zip.html','How to export HTML, CSS and JavaScript as ZIP','Extract the download and verify that every file and interaction survived.'],
  ['BUYER GUIDE','/en/learn/ai-website-templates.html','How to choose and test AI website templates','Evaluate structure, responsive behavior, interactions and delivery quality.'],
  ['WORKING TEMPLATE','/en/learn/landing-page-html-template.html','Landing-page HTML template','Download a real product page with responsive CSS and form validation.'],
  ['WORKING TEMPLATE','/en/learn/portfolio-website-source-code.html','Portfolio website source code','Customize and test a personal site with accessible category filters.']
];
const cards = lessons.map(([kind,href,label,copy])=>`<article class="lesson-card"><small>${kind}</small><h2><a href="${href}">${label}</a></h2><p>${copy}</p></article>`).join('');
const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Practical HTML, CSS and JavaScript tutorials | HaoWord Studio</title><meta name="description" content="Seven hands-on guides with working HTML, CSS and JavaScript examples, mobile testing, ZIP exports and downloadable templates."><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="https://haowordtool.com/en/learn/"><meta property="og:type" content="website"><meta property="og:title" content="Practical HTML, CSS and JavaScript tutorials"><meta property="og:description" content="Seven hands-on guides with working examples and downloadable source code."><meta property="og:url" content="https://haowordtool.com/en/learn/"><link rel="stylesheet" href="/assets/studio-design.css?v=seo1"><link rel="stylesheet" href="/assets/tutorials.css?v=2">${ads}</head><body>${header}<main class="lesson"><p class="eyebrow">LEARN BY BUILDING</p><h1>Build, test and export a real web project.</h1><p class="lesson-lead">Seven focused guides. Every important step has a visible result, a working example or a downloadable source project.</p><div class="lesson-grid">${cards}</div><section class="lesson-download"><h2>Use the free working examples</h2><p>Download, modify and test these static projects. No external libraries and no account required.</p><div class="actions"><a class="button primary" href="/examples/daily-plan-en.zip" download>Daily-plan ZIP</a><a class="button" href="/examples/landing-page-en.zip" download>Landing-page ZIP</a><a class="button" href="/examples/portfolio-en.zip" download>Portfolio ZIP</a><a class="button" href="/en/?utm_source=tutorial_index&amp;utm_medium=internal&amp;utm_campaign=english_seo">Open workspace</a></div></section>${shop}<section class="lesson-download"><h2>Watch the 45-second demonstration</h2><video controls playsinline preload="none" poster="/marketing/demo-en/cover.jpg" style="width:100%;max-height:600px;background:#edf3e7"><source src="/marketing/demo-en/haoword-english-voice-45s.mp4" type="video/mp4"></video><p>Actual interface screenshots edited into a captioned demonstration with English synthesized narration.</p></section></main>${footer}</body></html>`;
writeFileSync(join(root,'en','learn','index.html'),index,'utf8');

for (const file of ['run-ai-html.html','preview-mobile-webpage.html','export-html-css-js-zip.html']) {
  const target = join(root,'en','learn',file);
  let html = readFileSync(target,'utf8');
  if (!html.includes('pagead2.googlesyndication.com')) html = html.replace('</head>',`${ads}</head>`);
  if (!html.includes('commerce-entry')) html = html.replace('<h2>Continue practising</h2>',`${shop}<h2>Continue practising</h2>`);
  html = html.replace('<section class="commerce-entry">','<section class="commerce-entry" id="template-packs">');
  html = html.replaceAll('UPDATED SEPTEMBER 7, 2026','UPDATED SEPTEMBER 9, 2026').replaceAll('"dateModified":"2026-09-07"','"dateModified":"2026-09-09"');
  writeFileSync(target,html,'utf8');
}

const urls = articles.map(article=>`  <url><loc>https://haowordtool.com/en/learn/${article.slug}.html</loc><lastmod>2026-09-09</lastmod><changefreq>monthly</changefreq><priority>.8</priority></url>`).join('\n');
const sitemapPath = join(root,'sitemap.xml');
let sitemap = readFileSync(sitemapPath,'utf8');
if (!sitemap.includes('/en/learn/html-css-javascript-online-editor.html')) sitemap = sitemap.replace('</urlset>',`${urls}\n</urlset>`);
sitemap = sitemap.replaceAll('<lastmod>2026-09-07</lastmod></url><url><loc>https://haowordtool.com/en/learn/','<lastmod>2026-09-09</lastmod></url><url><loc>https://haowordtool.com/en/learn/');
writeFileSync(sitemapPath,sitemap,'utf8');

console.log('Generated four commercial-intent guides, two working examples, updated index and sitemap.');
