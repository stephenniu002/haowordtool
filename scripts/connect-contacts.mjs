import {readFile,writeFile} from 'node:fs/promises';
for(const path of ['app-builder.html','video-studio.html',...['en','ja','fr','es'].map(l=>`video-studio/${l}/index.html`)]){let html=await readFile(path,'utf8');if(!html.includes('/assets/video-contact.mjs'))html=html.replace('</body>','<script type="module" src="/assets/video-contact.mjs"></script></body>');await writeFile(path,html);}
