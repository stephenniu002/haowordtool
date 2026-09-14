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
  assert(landing.includes('/publisher.html#verification'));
  assert(!workspace.includes('YouTube 已接入 OAuth'));
  assert(script.includes("fetch('/publisher-platform-status.json'"));
});
