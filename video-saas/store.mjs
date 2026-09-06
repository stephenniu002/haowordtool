import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
export function openStore(directory=process.env.DATA_DIR||'data') {
  mkdirSync(directory,{recursive:true});
  const db=new DatabaseSync(resolve(directory,'studio.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,expires INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),method TEXT NOT NULL,status TEXT NOT NULL,amount INTEGER NOT NULL,currency TEXT NOT NULL,details TEXT NOT NULL DEFAULT '{}',proof TEXT,transaction_id TEXT UNIQUE,created INTEGER NOT NULL,paid INTEGER);
    CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),status TEXT NOT NULL,project TEXT NOT NULL,progress INTEGER NOT NULL DEFAULT 0,error TEXT,created INTEGER NOT NULL,updated INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,action TEXT NOT NULL,object_id TEXT NOT NULL,note TEXT NOT NULL,created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL);
  `);
  return db;
}
export function transaction(db,fn){db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}
export function activateOrder(db,orderId,transactionId,note,now=Date.now()) {
  if(!transactionId||transactionId.length>200)throw new Error('缺少有效渠道交易编号');
  return transaction(db,()=>{
    const order=db.prepare('SELECT * FROM orders WHERE id=?').get(orderId);
    if(!order)throw new Error('订单不存在');
    if(order.status==='paid')return {alreadyPaid:true};
    if(!['pending','review'].includes(order.status))throw new Error('订单状态不可开通');
    const user=db.prepare('SELECT expires FROM users WHERE id=?').get(order.user_id);
    const expires=Math.max(user.expires,now)+30*86400000;
    db.prepare("UPDATE orders SET status='paid',transaction_id=?,paid=? WHERE id=?").run(transactionId,now,orderId);
    db.prepare('UPDATE users SET expires=? WHERE id=?').run(expires,order.user_id);
    db.prepare('INSERT INTO audit(action,object_id,note,created) VALUES(?,?,?,?)').run('subscription_activated',orderId,note,now);
    return {expires};
  });
}
export function rateLimit(db,key,max,windowMs,now=Date.now()){
  const row=db.prepare('SELECT * FROM limits WHERE key=?').get(key);
  if(row&&row.until>now&&row.count>=max){const e=new Error('请求过于频繁，请稍后再试');e.status=429;throw e;}
  db.prepare('INSERT INTO limits(key,count,until) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN until>? THEN count+1 ELSE 1 END,until=CASE WHEN until>? THEN until ELSE excluded.until END').run(key,now+windowMs,now,now);
  db.prepare('DELETE FROM limits WHERE until<?').run(now);
}
