import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('publisher audit covers every advertised platform without claiming unverified connections',async()=>{
  const audit=JSON.parse(await readFile(new URL('../publisher-platform-status.json',import.meta.url),'utf8'));
  const ids=audit.platforms.map(item=>item.id);
  assert.equal(new Set(ids).size,14);
  for(const id of ['facebook','instagram','tiktok','youtube','douyin','xiaohongshu','bilibili','tencent','kuaishou','weibo','baijiahao','alipay','hupu','x'])assert(ids.includes(id),id);
  assert.equal(audit.platforms.filter(item=>item.status==='verified').length,0);
  assert.equal(audit.platforms.find(item=>item.id==='tiktok').status,'login_required');
  assert.equal(audit.platforms.find(item=>item.id==='x').status,'unsupported');
});

test('publisher pages link status evidence and avoid the old YouTube OAuth claim',async()=>{
  const [workspace,landing,script]=await Promise.all([
    readFile(new URL('../publisher.html',import.meta.url),'utf8'),
    readFile(new URL('../social-publisher.html',import.meta.url),'utf8'),
    readFile(new URL('../assets/publisher.js',import.meta.url),'utf8')
  ]);
  assert(workspace.includes('id="platformAuditRows"'));
  assert(workspace.includes('id="platformAuditCards"'));
  assert(workspace.includes('<summary>查看平台检查详情</summary>'));
  assert(landing.includes('/publisher.html#verification'));
  assert(!workspace.includes('YouTube 已接入 OAuth'));
  assert(script.includes("fetch('/publisher-platform-status.json'"));
  assert(script.includes("button.onclick=()=>directConnect(item.id,item.name)"));
  assert(script.includes("unsupported'?'暂不可用':'连接账号'"));
});

test('social publisher account buttons preserve the selected platform in the login flow',async()=>{
  const [landing,script]=await Promise.all([
    readFile(new URL('../social-publisher.html',import.meta.url),'utf8'),
    readFile(new URL('../assets/publisher.js',import.meta.url),'utf8')
  ]);
  for(const id of ['youtube','facebook','instagram','tiktok','douyin','xiaohongshu','bilibili','tencent','kuaishou','weibo','baijiahao','alipay','hupu']){
    assert(landing.includes(`/publisher.html?platform=${id}#login`),id);
  }
  assert(!landing.includes('/publisher.html?platform=x#login'));
  assert(landing.includes('<button class="button" type="button" disabled>Not available</button>'));
  assert(script.includes("new URL(location.href).searchParams.get('platform')"));
  assert(script.includes("sessionStorage.setItem(PENDING_PLATFORM_KEY,id)"));
  assert(script.includes("id==='facebook'||id==='tiktok'"));
});

test('publisher combines language selection with the local WhatsApp control surface',async()=>{
  const [workspace,script,css,server]=await Promise.all([
    readFile(new URL('../publisher.html',import.meta.url),'utf8'),
    readFile(new URL('../assets/publisher.js',import.meta.url),'utf8'),
    readFile(new URL('../assets/publisher.css',import.meta.url),'utf8'),
    readFile(new URL('../publisher-service/server.mjs',import.meta.url),'utf8')
  ]);
  for(const language of ['zh-CN','en','ja','fr','es'])assert(workspace.includes(`value="${language}"`),language);
  assert(workspace.includes('id="whatsappControl"'));
  assert(workspace.includes('href="http://127.0.0.1:8000/"'));
  assert(workspace.includes('href="http://localhost:8789/publisher.html"'));
  assert(script.includes("localStorage.setItem(LANGUAGE_KEY,publisherLanguage)"));
  assert(script.includes("frame.src=frame.dataset.src"));
  assert(script.includes("?location.origin:'https://haoword-publisher-service-production.up.railway.app'"));
  assert(css.includes('.whatsapp-embed iframe'));
  assert(server.includes('frame-src http://127.0.0.1:8000'));
  assert(server.includes("'/publisher-platform-status.json'"));
  assert(server.includes("path==='/healthz'"));
  assert(server.includes("path==='/api/publisher/adspower/status'"));
  assert(server.includes("path==='/api/publisher/local-status'"));
  assert(script.includes('loadPublicAudit().then(loadLocalServiceStatus)'));
});
