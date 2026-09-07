import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
const origin=process.env.MOBILE_SERVER_ORIGIN;
if(!origin||new URL(origin).protocol!=='https:')throw new Error('Set MOBILE_SERVER_ORIGIN to the deployed HTTPS studio origin.');
await mkdir('www/assets',{recursive:true});
let html=await readFile('../video-studio.html','utf8');
// Ship the editor locally, with server APIs on the verified deployment domain.
// The iOS companion is sign-in only; subscription purchase is omitted from the binary.
html=html.replace('<section id="plans"', '<section hidden id="plans"').replace(/<a href="#plans">订阅<\/a>/,'');
html=html.replace(/href="\/(?!assets\/)/g,`href="${new URL(origin).origin}/`);
await writeFile('www/index.html',html);
for(const name of ['video-core.mjs','video-studio.mjs','video-i18n.mjs','video-studio.css','video-icon.svg'])await copyFile(`../assets/${name}`,`www/assets/${name}`);
await writeFile('www/assets/video-config.js',`window.HAOWORD_VIDEO_API = ${JSON.stringify(new URL(origin).origin)};\n`);
// Use the deployed first-party origin for authenticated cookies inside the app.
// Local web assets provide a packaged fallback; server.url requires an active deployment.
const config=JSON.parse(await readFile('capacitor.config.json','utf8'));
config.server={url:`${new URL(origin).origin}/video-studio.html?native=1`,cleartext:false};
await writeFile('capacitor.config.json',JSON.stringify(config,null,2)+'\n');
console.log('Mobile web assets prepared. Generate native projects using cap add android / cap add ios.');
