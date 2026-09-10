import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomBytes,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
export const hash = value => createHash('sha256').update(value).digest('hex');
export function vault(key) {
  const bytes=Buffer.from(key||'', 'base64');
  if(bytes.length!==32) throw new Error('PUBLISHER_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  return {
    seal(value, aad='') {const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',bytes,iv);cipher.setAAD(Buffer.from(aad));const data=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64');},
    open(value, aad='') {const b=Buffer.from(value,'base64'),dec=createDecipheriv('aes-256-gcm',bytes,b.subarray(0,12));dec.setAAD(Buffer.from(aad));dec.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([dec.update(b.subarray(28)),dec.final()]).toString());}
  };
}
export function openStore(dataDir) {
  mkdirSync(dataDir,{recursive:true,mode:0o700});
  const db=new DatabaseSync(resolve(dataDir,'publisher.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,n INTEGER NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),name TEXT,size INTEGER,sha TEXT,status TEXT,created INTEGER);
    CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),platform TEXT,remote_id TEXT,label TEXT,status TEXT,secret TEXT,created INTEGER,updated INTEGER,UNIQUE(user_id,platform,remote_id));
    CREATE TABLE IF NOT EXISTS oauth(state TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),expires INTEGER,session_token TEXT);
    CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),request_key TEXT,request_hash TEXT,created INTEGER,UNIQUE(user_id,request_key));
    CREATE TABLE IF NOT EXISTS targets(id TEXT PRIMARY KEY,job_id TEXT REFERENCES jobs(id),account_id TEXT REFERENCES accounts(id),asset_id TEXT REFERENCES assets(id),payload TEXT,status TEXT,result TEXT,error TEXT,updated INTEGER,UNIQUE(job_id,account_id));
    CREATE TABLE IF NOT EXISTS connects(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),account_id TEXT REFERENCES accounts(id),status TEXT,error TEXT,updated INTEGER);
    CREATE INDEX IF NOT EXISTS target_status ON targets(status,updated);
  `);
  return db;
}
export function transaction(db, fn) {db.exec('BEGIN IMMEDIATE');try {const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}
export function rateLimit(db,key,max,windowMs) {
  return transaction(db,()=>{const now=Date.now(),r=db.prepare('SELECT * FROM limits WHERE key=?').get(key);if(!r||r.expires<now)db.prepare('INSERT OR REPLACE INTO limits VALUES(?,?,?)').run(key,1,now+windowMs);else {if(r.n>=max)throw Object.assign(new Error('Too many requests. Try later.'),{status:429});db.prepare('UPDATE limits SET n=n+1 WHERE key=?').run(key);}});
}
