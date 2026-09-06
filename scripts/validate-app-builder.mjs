import assert from 'node:assert/strict';
import {starter,zipFiles} from '../assets/app-builder-core.mjs';
const sample=starter({name:'<script>alert(1)</script>',features:'A & B',language:'ja'});
assert(!sample.html.includes('<script>alert(1)'));assert(sample.html.includes('&lt;script&gt;'));assert(sample.html.includes('lang="ja"'));
const expected={'index.html':sample.html,'styles.css':sample.css,'app.js':sample.js,'中文.txt':'日本語 Français Español'};
const data=new Uint8Array(await zipFiles(expected).arrayBuffer()),view=new DataView(data.buffer);let offset=0;
for(const [name,value]of Object.entries(expected)){assert.equal(view.getUint32(offset,true),0x04034b50);const length=view.getUint32(offset+18,true),namesize=view.getUint16(offset+26,true);assert.equal(new TextDecoder().decode(data.slice(offset+30,offset+30+namesize)),name);assert.equal(new TextDecoder().decode(data.slice(offset+30+namesize,offset+30+namesize+length)),value);offset+=30+namesize+length;}
assert.equal(view.getUint32(offset,true),0x02014b50);assert.equal(view.getUint32(data.length-22,true),0x06054b50);assert.equal(view.getUint16(data.length-14,true),4);
console.log('App template escaping, language, ZIP entries and directory checks passed.');
