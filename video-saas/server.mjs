import {createServer} from 'node:http';
import {randomBytes,randomUUID,scrypt as scryptCallback,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openStore,rateLimit} from './store.mjs';
import {paymentConfig,createPayment,reconcileOrder} from './payments.mjs';
import {PLAN,validateProject,SCRIPT_LANGUAGES} from '../assets/video-core.mjs';
const scrypt=promisify(scryptCallback),root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sha=s=>createHash('sha256').update(s).digest('hex');
export function createApp({db=openStore(),env=process.env}={}){
  const origin=env.PUBLIC_ORIGIN||'http://localhost:8787';
  if(env.NODE_ENV==='production'&&!origin.startsWith('https://'))throw new Error('生产环境 PUBLIC_ORIGIN 必须是 HTTPS');
  const allowed=new Set([origin,...(env.WEB_ORIGINS||'').split(',').filter(Boolean)]);
  const secure=origin.startsWith('https://');
  const cookie=(token,maxAge)=>`video_session=${token}; Path=/api/video; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure?'; Secure':''}`;
  const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  async function body(req){let length=0,chunks=[];for await(const c of req){length+=c.length;if(length>65536)throw Object.assign(new Error('请求过大'),{status:413});chunks.push(c);}try{return JSON.parse(Buffer.concat(chunks).toString()||'{}');}catch{throw new Error('请求格式不正确');}}
  function auth(req){const token=req.headers.cookie?.match(/(?:^|;\s*)video_session=([a-f0-9]{64})(?:;|$)/)?.[1];const u=token&&db.prepare('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?').get(sha(token),Date.now());if(!u)throw Object.assign(new Error('请先登录'),{status:401});return u;}
  const userData=u=>({email:u.email,expires:u.expires,active:u.expires>Date.now()});
  function subscriber(u){if(u.expires<=Date.now())throw Object.assign(new Error('请先开通月度订阅'),{status:402});}
  return createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    if(req.headers.origin&&allowed.has(req.headers.origin)){res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Access-Control-Allow-Credentials','true');res.setHeader('Vary','Origin');}
    try{
      const url=new URL(req.url,origin),p=url.pathname;
      if(req.method==='OPTIONS'){if(!allowed.has(req.headers.origin))return send(res,403,{error:'不允许的来源'});res.writeHead(204,{'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return res.end();}
      if(!p.startsWith('/api/video/')){
        const rel=p==='/'?'video-studio.html':p.slice(1)+(p.endsWith('/')?'index.html':'');
        if(!/^(video-studio\.html|assets\/video-[a-z0-9.-]+|video-studio\/(?:en|ja|fr|es)\/index\.html|video-studio\/manifest\.webmanifest)$/.test(rel)||!['GET','HEAD'].includes(req.method))return send(res,404,{error:'Not found'});
        const data=await readFile(resolve(root,rel));
        const types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
        res.writeHead(200,{'Content-Type':types[extname(rel)]||'application/octet-stream','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"});return res.end(req.method==='HEAD'?undefined:data);
      }
      // Acknowledge notifications without trusting them. Signed provider queries are authoritative.
      if(p==='/api/video/payments/wechat-notify'&&req.method==='POST'){req.resume();res.writeHead(204);return res.end();}
      if(req.method!=='GET'&&(!req.headers.origin||!allowed.has(req.headers.origin)))return send(res,403,{error:'请求来源校验失败'});
      const ip=req.socket.remoteAddress||'unknown';
      if(p==='/api/video/config'&&req.method==='GET')return send(res,200,{plan:PLAN,cnyFen:Number(env.PLAN_CNY_FEN)||null,payments:paymentConfig(env),render:env.RENDER_ENABLED==='true'&&!!env.ELEVENLABS_API_KEY&&!!env.ELEVENLABS_VOICE_ID,ai:!!(env.XAI_API_KEY&&env.XAI_MODEL),android:validLink(env.ANDROID_DOWNLOAD_URL),ios:validLink(env.IOS_DOWNLOAD_URL),captionsMirage:false});
      if(['/api/video/register','/api/video/login'].includes(p)&&req.method==='POST'){
        rateLimit(db,`auth:${ip}`,15,900000);
        const b=await body(req),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||password.length<12||password.length>128)throw new Error('请填写有效邮箱和 12–128 位密码');
        let u=db.prepare('SELECT * FROM users WHERE email=?').get(email);
        if(p.endsWith('/register')){
          if(u)throw new Error('无法注册，请检查邮箱或尝试登录');
          const salt=randomBytes(16).toString('hex'),hash=(await scrypt(password,salt,64)).toString('hex');
          const id=randomUUID();db.prepare('INSERT INTO users(id,email,password,created) VALUES(?,?,?,?)').run(id,email,`${salt}:${hash}`,Date.now());u=db.prepare('SELECT * FROM users WHERE id=?').get(id);
        }else{
          const [salt,hash]=(u?.password||`${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
          const actual=await scrypt(password,salt,64);
          if(!timingSafeEqual(actual,Buffer.from(hash,'hex'))||!u)throw Object.assign(new Error('邮箱或密码不正确'),{status:401});
        }
        const token=randomBytes(32).toString('hex');
        db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
        db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(sha(token),u.id,Date.now()+7*86400000);
        res.setHeader('Set-Cookie',cookie(token,604800));return send(res,200,{user:userData(u)});
      }
      const u=auth(req);
      if(p==='/api/video/me'&&req.method==='GET')return send(res,200,{user:userData(u)});
      if(p==='/api/video/logout'&&req.method==='POST'){const t=req.headers.cookie?.match(/video_session=([a-f0-9]{64})/)?.[1];if(t)db.prepare('DELETE FROM sessions WHERE token=?').run(sha(t));res.setHeader('Set-Cookie',cookie('',0));return send(res,200,{ok:true});}
      if(p==='/api/video/storyboard'&&req.method==='POST'){
        subscriber(u);rateLimit(db,`ai:${u.id}`,30,86400000);
        if(!env.XAI_API_KEY||!env.XAI_MODEL)throw Object.assign(new Error('AI 脚本服务尚未配置，可先使用脚本拆分'),{status:503});
        const b=await body(req);if(typeof b.prompt!=='string'||b.prompt.length<2||b.prompt.length>1800)throw new Error('主题需要 2–1800 字');
        const language=b.language||'zh-CN';if(!Object.hasOwn(SCRIPT_LANGUAGES,language))throw new Error('请选择有效语言');
        const r=await fetch('https://api.x.ai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${env.XAI_API_KEY}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(60000),body:JSON.stringify({model:env.XAI_MODEL,messages:[{role:'system',content:`Write a concise ${SCRIPT_LANGUAGES[language]} video storyboard based only on the user brief. All title, heading and narration text must be in ${SCRIPT_LANGUAGES[language]}. Do not invent factual product claims. Return JSON object with title (1-80 characters) and scenes array of 3-6 objects: heading (max 30 characters), narration (max 80 characters), duration (integer seconds, 3-20). No markdown.`},{role:'user',content:b.prompt}],response_format:{type:'json_object'},max_tokens:1800})});
        if(!r.ok)throw Object.assign(new Error('AI 脚本生成暂时失败，请稍后重试'),{status:502});
        const answer=await r.json();const project=validateProject({...JSON.parse(answer.choices[0].message.content),language,ratio:b.ratio||'9:16',engine:b.engine||'remotion'});return send(res,200,{project});
      }
      if(p==='/api/video/orders'&&req.method==='GET')return send(res,200,{orders:db.prepare('SELECT id,method,status,amount,currency,created,paid FROM orders WHERE user_id=? ORDER BY created DESC LIMIT 20').all(u.id)});
      if(p==='/api/video/orders'&&req.method==='POST'){
        rateLimit(db,`orders:${u.id}`,10,3600000);
        const b=await body(req);if(!['usdt','alipay','wechat'].includes(b.method)||!paymentConfig(env)[b.method])throw new Error('该支付渠道尚未开通');
        const pending=db.prepare("SELECT id FROM orders WHERE user_id=? AND method=? AND status IN ('pending','review') AND created>? ORDER BY created DESC LIMIT 1").get(u.id,b.method,Date.now()-1800000);
        if(pending)return send(res,200,{order:db.prepare('SELECT * FROM orders WHERE id=?').get(pending.id)});
        const id=randomBytes(16).toString('hex'),amount=b.method==='usdt'?30000000:Number(env.PLAN_CNY_FEN),currency=b.method==='usdt'?'USDT':'CNY';
        db.prepare('INSERT INTO orders(id,user_id,method,status,amount,currency,created) VALUES(?,?,?,?,?,?,?)').run(id,u.id,b.method,'creating',amount,currency,Date.now());
        try{
          const details=await createPayment({id,method:b.method,amount});
          if(details.qr){const QRCode=(await import('qrcode')).default;details.qrImage=await QRCode.toDataURL(details.qr,{width:256,margin:2});}
          db.prepare("UPDATE orders SET details=?,status='pending' WHERE id=?").run(JSON.stringify(details),id);
        }catch(e){db.prepare("UPDATE orders SET status='failed' WHERE id=?").run(id);throw e;}
        return send(res,201,{order:db.prepare('SELECT * FROM orders WHERE id=?').get(id)});
      }
      const om=p.match(/^\/api\/video\/orders\/([a-f0-9]{32})(\/proof|\/check)?$/);
      if(om){
        const order=db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(om[1],u.id);if(!order)return send(res,404,{error:'订单不存在'});
        if(om[2]==='/proof'&&req.method==='POST'){
          if(order.method!=='usdt'||!['pending','review'].includes(order.status))throw new Error('订单不可提交凭证');
          const b=await body(req);if(!/^(0x)?[a-fA-F0-9]{64}$/.test(b.hash||''))throw new Error('请输入完整链上交易哈希');
          db.prepare("UPDATE orders SET status='review',proof=? WHERE id=?").run(b.hash.toLowerCase(),order.id);
        }else if(om[2]==='/check'&&req.method==='POST'){rateLimit(db,`check:${u.id}`,30,60000);await reconcileOrder(db,order);}
        else if(om[2]||req.method!=='GET')return send(res,405,{error:'Method not allowed'});
        return send(res,200,{order:db.prepare('SELECT * FROM orders WHERE id=?').get(order.id),user:userData(db.prepare('SELECT * FROM users WHERE id=?').get(u.id))});
      }
      if(p==='/api/video/jobs'&&req.method==='GET')return send(res,200,{jobs:db.prepare('SELECT id,status,progress,error,project,created FROM jobs WHERE user_id=? ORDER BY created DESC LIMIT 30').all(u.id)});
      if(p==='/api/video/jobs'&&req.method==='POST'){
        subscriber(u);if(env.RENDER_ENABLED!=='true'||!env.ELEVENLABS_API_KEY||!env.ELEVENLABS_VOICE_ID)throw Object.assign(new Error('配音和渲染服务尚未开通，当前可编辑、导出分镜工程'),{status:503});
        const project=validateProject((await body(req)).project);
        if(db.prepare("SELECT count(*) n FROM jobs WHERE user_id=? AND status IN ('queued','running')").get(u.id).n>=2)throw new Error('已有任务制作中，请等待完成');
        rateLimit(db,`render:${u.id}`,Number(env.DAILY_RENDER_LIMIT)||20,86400000);
        const id=randomUUID(),now=Date.now();db.prepare('INSERT INTO jobs(id,user_id,status,project,created,updated) VALUES(?,?,?,?,?,?)').run(id,u.id,'queued',JSON.stringify(project),now,now);return send(res,202,{id});
      }
      const jm=p.match(/^\/api\/video\/jobs\/([a-f0-9-]{36})(\/(video|captions))?$/);
      if(jm&&req.method==='GET'){
        const j=db.prepare('SELECT * FROM jobs WHERE id=? AND user_id=?').get(jm[1],u.id);if(!j)return send(res,404,{error:'任务不存在'});
        if(!jm[3])return send(res,200,{job:j});
        if(j.status!=='done')throw new Error('任务尚未完成');
        const filename=jm[3]==='video'?'video.mp4':'captions.srt',file=resolve(env.DATA_DIR||'data','jobs',j.id,filename),info=await stat(file);
        res.writeHead(200,{'Content-Type':jm[3]==='video'?'video/mp4':'application/x-subrip; charset=utf-8','Content-Length':info.size,'Content-Disposition':`attachment; filename="haoword-${j.id}.${jm[3]==='video'?'mp4':'srt'}"`,'Cache-Control':'private, no-store'});createReadStream(file).on('error',()=>res.destroy()).pipe(res);return;
      }
      return send(res,404,{error:'接口不存在'});
    }catch(e){if(res.headersSent){res.destroy();return;}const status=e.status||400;return send(res,status,{error:e.code==='ENOENT'?'文件暂不可用':e.code?.startsWith('SQLITE')?'操作未完成，请刷新重试':e.message||'请求失败'});}
  });
}
function validLink(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;}}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT)||8787;createApp().listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`Video Studio: http://localhost:${port}/video-studio.html`));}
