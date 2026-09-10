// Run on the trusted worker computer only. Never upload session files through Git.
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {openStore,vault} from './store.mjs';
import {platformById} from './platforms.mjs';
const [command,email,platform,file,label]=process.argv.slice(2);
if(command!=='import-session'||platformById(platform)?.driver!=='browser'||!file){console.error('Usage: node --env-file=.env admin.mjs import-session EMAIL PLATFORM /absolute/session.json "Account label"');process.exit(1);}
const db=openStore(process.env.PUBLISHER_DATA_DIR||'./data'),user=db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase());
if(!user)throw new Error('Create/sign in to this user first');
const session=JSON.parse(readFileSync(file,'utf8'));if(!session||typeof session!=='object')throw new Error('Invalid session');
const id=randomUUID(),now=Date.now();
db.prepare('INSERT INTO accounts VALUES(?,?,?,?,?,?,?,?,?)').run(id,user.id,platform,id,label||platform,'ready',vault(process.env.PUBLISHER_ENCRYPTION_KEY).seal(session,id),now,now);
console.log('Session imported. Confirm the account identity before publishing.');
