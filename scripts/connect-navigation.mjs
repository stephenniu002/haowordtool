import {readFile,writeFile} from 'node:fs/promises';
for(const path of ['ai-companion.html','app-builder.html','video-studio.html',...['en','ja','fr','es'].map(l=>`video-studio/${l}/index.html`)]){let h=await readFile(path,'utf8');if(!h.includes('/assets/video-navigation.css'))h=h.replace('</head>','<link rel="stylesheet" href="/assets/video-navigation.css"></head>');await writeFile(path,h);}
