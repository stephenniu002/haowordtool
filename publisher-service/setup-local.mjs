import {existsSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
const config=resolve(root,'.env');
if(existsSync(config))throw new Error('Local configuration already exists; refusing to overwrite credentials.');
mkdirSync(resolve(root,'data'),{recursive:true,mode:0o700});
writeFileSync(config,[
  'HOST=127.0.0.1','PORT=8789','PUBLIC_ORIGIN=http://localhost:8789',
  'PUBLISHER_DATA_DIR=./data',
  `PUBLISHER_ENCRYPTION_KEY=${randomBytes(32).toString('base64')}`,
  'PUBLISHER_ADMIN_EMAIL=admin@localhost',
  `PUBLISHER_ADMIN_PASSWORD=${randomBytes(24).toString('base64url')}`,
  'PUBLISHER_ADSPOWER_ONLY=1','',
].join('\n'),{flag:'wx',mode:0o600});
console.log('Local configuration created. Credentials are stored only in publisher-service/.env.');
