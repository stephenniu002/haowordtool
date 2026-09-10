import {createServer} from 'node:http';
import {randomBytes,randomUUID,scryptSync,timingSafeEqual,createHmac,createHash} from 'node:crypto';
import {mkdirSync,createReadStream,createWriteStream,statSync,unlinkSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {pipeline} from 'node:stream/promises';
import {Transform} from 'node:stream';
import {openStore,vault,hash,rateLimit,transaction} from './store.mjs';
import {PLATFORMS,platformById,readiness} from './platforms.mjs';
import {createMeta} from './meta.mjs';
import {enqueue} from './queue.mjs';
import {adspowerStatus} from './adspower-status.mjs';

export function passwordHash(password,salt=randomBytes(16).toString('hex')){return `${salt}:${scryptSync(password,salt,64).toString('hex')}`;}
function validPassword(password,stored){const [salt]=stored.split(':');const actual=Buffer.from(passwordHash(password,salt));const expected=Buffer.from(stored);return actual.length===expected.length&&timingSafeEqual(actual,expected);}
export function mediaSignature(key,id,expires){return createHmac('sha256',key).update(`${id}:${expires}`).digest('hex');}
export function createApp(env=process.env,{meta:providedMeta}={}){
  const origin=new URL(env.PUBLIC_ORIGIN||'http://localhost:8789').origin;
  if(env.PUBLIC_ORIGIN&&env.PUBLIC_ORIGIN!==origin)throw new Error('PUBLIC_ORIGIN must be an origin without a path or trailing slash');
  const dataDir=resolve(env.PUBLISHER_DATA_DIR||'./data');mkdirSync(join(dataDir,'media'),{recursive:true,mode:0o700});
  const db=openStore(dataDir),crypt=vault(env.PUBLISHER_ENCRYPTION_KEY);
  const meta=providedMeta||(readiness(PLATFORMS[0],env)?createMeta({env}):null);
  if(env.PUBLISHER_ADMIN_EMAIL&&env.PUBLISHER_ADMIN_PASSWORD){
    if(env.PUBLISHER_ADMIN_PASSWORD.length<14)throw new Error('Admin password must have at least 14 characters');
    db.prepare('INSERT OR IGNORE INTO users VALUES(?,?,?,?)').run(randomUUID(),env.PUBLISHER_ADMIN_EMAIL.toLowerCase(),passwordHash(env.PUBLISHER_ADMIN_PASSWORD),Date.now());
  }
  const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  async function body(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>16384)throw new Error('Request too large');}return JSON.parse(text||'{}');}
  const accountList=user=>db.prepare('SELECT id,platform,label,status FROM accounts WHERE user_id=? ORDER BY created').all(user);
  const server=createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    try{
      const url=new URL(req.url,origin),path=url.pathname;
      if(path==='/healthz'&&req.method==='GET'){
        db.prepare('SELECT 1').get();
        return json(res,200,{ok:true});
      }
      if(!['GET','HEAD'].includes(req.method)&&req.headers.origin!==origin)return json(res,403,{error:'Origin rejected'});
      if(path.startsWith('/api/publisher/media/')&&req.method==='GET'){
        const id=path.split('/').at(-1),expires=Number(url.searchParams.get('expires')),sig=url.searchParams.get('sig')||'';
        const expected=mediaSignature(env.PUBLISHER_ENCRYPTION_KEY,id,expires);
        if(!/^[a-f0-9]{64}$/.test(sig)||!Number.isFinite(expires)||expires<Date.now()||expires>Date.now()+86400000||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return json(res,403,{error:'Expired media URL'});
        const asset=db.prepare("SELECT * FROM assets WHERE id=? AND status='ready'").get(id);if(!asset)return json(res,404,{error:'Media unavailable'});
        const file=join(dataDir,'media',asset.id+'.mp4'),size=statSync(file).size;
        let start=0,end=size-1,status=200;
        if(req.headers.range){const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!range)return json(res,416,{error:'Invalid range'});start=Number(range[1]);end=range[2]?Number(range[2]):end;if(start>end||end>=size)return json(res,416,{error:'Invalid range'});status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);}
        res.writeHead(status,{'Content-Type':'video/mp4','Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'private, no-store'});await pipeline(createReadStream(file,{start,end}),res);return;
      }
      const rawToken=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('publisher_session='))?.slice(18)||'';
      const token=hash(rawToken),session=db.prepare('SELECT * FROM sessions WHERE token=? AND expires>?').get(token,Date.now());
      if(path==='/api/publisher/login'&&req.method==='POST'){
        rateLimit(db,`login:${req.socket.remoteAddress}`,10,15*60000);
        const b=await body(req),email=String(b.email||'').toLowerCase();if(typeof b.password!=='string'||b.password.length>1024)throw new Error('Invalid login');
        const user=db.prepare('SELECT * FROM users WHERE email=?').get(email);
        if(!user||!validPassword(b.password,user.password))return json(res,401,{error:'Invalid login'});
        const tokenValue=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(tokenValue),user.id,Date.now()+86400000);
        res.setHeader('Set-Cookie',`publisher_session=${tokenValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${origin.startsWith('https:')?'; Secure':''}`);return json(res,200,{ok:true});
      }
      if(path==='/api/publisher/oauth/meta/callback'&&req.method==='GET'){
        if(!meta||!session)return json(res,401,{error:'Sign in again'});
        const state=hash(url.searchParams.get('state')||'');
        const match=transaction(db,()=>{const row=db.prepare('SELECT * FROM oauth WHERE state=? AND user_id=? AND session_token=? AND expires>?').get(state,session.user_id,token,Date.now());if(row)db.prepare('DELETE FROM oauth WHERE state=?').run(state);return row;});
        if(!match||!url.searchParams.get('code'))return json(res,400,{error:'Authorization cancelled or expired'});
        const accounts=await meta.exchange(url.searchParams.get('code'));
        transaction(db,()=>{for(const a of accounts){
          const old=db.prepare('SELECT id FROM accounts WHERE user_id=? AND platform=? AND remote_id=?').get(session.user_id,a.platform,a.remoteId),id=old?.id||randomUUID(),now=Date.now();
          db.prepare('INSERT INTO accounts VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,platform,remote_id) DO UPDATE SET label=excluded.label,status=excluded.status,secret=excluded.secret,updated=excluded.updated').run(id,session.user_id,a.platform,a.remoteId,a.label,'ready',crypt.seal(a.secret,id),now,now);
        }});
        res.writeHead(303,{Location:'/publisher.html'});return res.end();
      }
      if(path.startsWith('/api/publisher/')){
        if(!session)return json(res,401,{error:'Sign in first'});
        const user=session.user_id;
        if(path==='/api/publisher/adspower/status'&&req.method==='GET')return json(res,200,await adspowerStatus(env));
        if(path==='/api/publisher/state'&&req.method==='GET')return json(res,200,{accounts:accountList(user),platforms:PLATFORMS.map(p=>({...p,available:readiness(p,env)}))});
        if(path==='/api/publisher/logout'&&req.method==='POST'){db.prepare('DELETE FROM sessions WHERE token=?').run(token);res.setHeader('Set-Cookie','publisher_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');return json(res,200,{ok:true});}
        if(path==='/api/publisher/oauth/meta'&&req.method==='POST'){
          if(!meta)return json(res,503,{error:'Meta is not configured on the server'});
          const state=randomBytes(32).toString('hex');db.prepare('INSERT INTO oauth VALUES(?,?,?,?)').run(hash(state),user,Date.now()+600000,token);return json(res,200,{url:meta.authorize(state)});
        }
        if(path==='/api/publisher/connect'&&req.method==='POST'){
          const b=await body(req),p=platformById(b.platform);
          if(!p||p.driver!=='browser'||!readiness(p,env))throw new Error('Platform worker is not configured');
          rateLimit(db,`connect:${user}`,5,600000);
          const id=randomUUID(),now=Date.now();
          db.prepare('INSERT INTO accounts VALUES(?,?,?,?,?,?,?,?,?)').run(id,user,p.id,id,String(b.label||p.name).slice(0,80),'connecting',null,now,now);
          db.prepare('INSERT INTO connects VALUES(?,?,?,?,?,?)').run(randomUUID(),user,id,'queued',null,now);
          return json(res,202,{id,message:'Complete login in the browser on the worker computer'});
        }
        if(path==='/api/publisher/upload'&&req.method==='POST'){
          const max=Number(env.PUBLISHER_MAX_UPLOAD_BYTES||536870912),size=Number(req.headers['content-length']);
          if(req.headers['content-type']!=='video/mp4'||!Number.isSafeInteger(size)||size<12||size>max)return json(res,413,{error:'Upload an MP4 within the size limit'});
          rateLimit(db,`upload:${user}`,30,3600000);
          const id=randomUUID(),file=join(dataDir,'media',id+'.mp4');
          transaction(db,()=>{const used=db.prepare('SELECT coalesce(sum(size),0) AS n FROM assets WHERE user_id=?').get(user).n;if(used+size>Number(env.PUBLISHER_USER_QUOTA_BYTES||5368709120))throw new Error('Storage quota reached; ask administrator to remove old media');db.prepare('INSERT INTO assets VALUES(?,?,?,?,?,?,?)').run(id,user,'video.mp4',size,null,'uploading',Date.now());});
          let count=0,header=Buffer.alloc(0);const sha=createHash('sha256');
          try{
            await pipeline(req,new Transform({transform(chunk,encoding,callback){count+=chunk.length;sha.update(chunk);if(header.length<12)header=Buffer.concat([header,chunk]).subarray(0,12);callback(count>size?new Error('Upload too large'):null,chunk);}}),createWriteStream(file,{flags:'wx',mode:0o600}));
            if(count!==size||header.toString('ascii',4,8)!=='ftyp')throw new Error('Invalid MP4 container');
            db.prepare("UPDATE assets SET status='ready',sha=? WHERE id=?").run(sha.digest('hex'),id);return json(res,201,{id,size});
          }catch(error){try{unlinkSync(file);}catch{}db.prepare('DELETE FROM assets WHERE id=?').run(id);throw error;}
        }
        if(path==='/api/publisher/jobs'&&req.method==='POST'){rateLimit(db,`publish:${user}`,30,3600000);const id=enqueue(db,user,await body(req));return json(res,202,{id});}
        if(path==='/api/publisher/jobs'&&req.method==='GET')return json(res,200,{targets:db.prepare('SELECT t.id,t.status,t.result,t.error,a.label,a.platform,j.created FROM targets t JOIN jobs j ON j.id=t.job_id JOIN accounts a ON a.id=t.account_id WHERE j.user_id=? ORDER BY j.created DESC LIMIT 100').all(user)});
        return json(res,404,{error:'Not found'});
      }
      if(req.method==='GET'&&['/','/publisher.html','/assets/publisher.js','/assets/publisher.css'].includes(path)){
        const name=path==='/'?'publisher.html':path.slice(1);const file=resolve(fileURLToPath(new URL('..',import.meta.url)),name);
        res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
        res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html; charset=utf-8');return res.end(readFileSync(file));
      }
      return json(res,404,{error:'Not found'});
    }catch(error){if(!res.headersSent&&!res.destroyed)json(res,error.status||400,{error:error.name==='ProviderError'?error.message:'Request failed. Check your input and server configuration.'});else res.destroy();}
  });
  server.requestTimeout=15*60000;
  return {server,db,dataDir};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const {server}=createApp();server.listen(Number(process.env.PORT||8789),process.env.HOST||'127.0.0.1',()=>console.log('Publisher listening (credentials omitted)'));
}
