import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const verification = '<meta name="google-site-verification" content="V5m3Ygpe6VRjGSpzT7cTDbs60OFmx-hJfBzwGmgUzRQ">';
const account = '<meta name="google-adsense-account" content="ca-pub-4489946300243174">';

for (const relative of ['index.html', join('scripts','redesign-studios.mjs')]) {
  const path = join(root,relative);
  const source = readFileSync(path,'utf8');
  if (!source.includes(verification)) throw new Error(`Verification marker missing in ${relative}`);
  if (!source.includes(account)) writeFileSync(path,source.replace(verification,verification + account),'utf8');
}

console.log('Added the AdSense account meta tag to the homepage and its generator.');
