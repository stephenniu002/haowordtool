#!/usr/bin/env node
/**
 * gen-apikey.mjs — 签发 API Key
 *
 * 明文只在生成时打印一次。库里存 sha256，之后谁也拿不回原文 ——
 * 包括我们自己。所以输出必须当场落盘或发给客户。
 *
 * 走 Supabase REST（service_role），不装 SDK。
 *
 * 用法：
 *   export SUPABASE_URL=https://mhxmfhdluzebptfmxgpe.supabase.co
 *   export SUPABASE_SERVICE_KEY=<service_role key>
 *
 *   node tools/pro/gen-apikey.mjs --email a@b.com --plan pro-year
 *   node tools/pro/gen-apikey.mjs --email a@b.com --plan pro-month --quota 1000 --out keys.csv
 *   node tools/pro/gen-apikey.mjs --email a@b.com --plan pro-month --revoke
 *
 * 参数：
 *   --email   必填。key 归属邮箱（和 pro_members 的 email 对得上，方便对账）
 *   --plan    默认 pro-month。pro-month | pro-year | pro-pass-month | pro-pass-year | lifetime
 *   --tier    pro（默认）| free。free 只能查免费层字段
 *   --quota   月调用配额，默认 5000，上限 1000000
 *   --count   一次签几把，默认 1，上限 50
 *   --prefix  自定义明文前缀，默认 hwt_live
 *   --out     CSV 追加写入
 *   --revoke  不给 --email 以外的东西，把该邮箱名下所有 key 置为 revoked
 *
 * 退出码：0 成功，1 参数/网络错误。
 */

import { writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';

/* ---------- 字母表 ---------- */

// 去掉 0 O 1 I L，避免人工转录出错
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const SEG_LEN = 8;
const SEG_COUNT = 4;

/* ---------- 参数 ---------- */

function parseArgs(argv) {
  const out = {
    email: null,
    plan: 'pro-month',
    tier: 'pro',
    quota: 5000,
    count: 1,
    prefix: 'hwt_live',
    out: null,
    revoke: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--email') out.email = argv[++i];
    else if (a === '--plan') out.plan = argv[++i];
    else if (a === '--tier') out.tier = argv[++i];
    else if (a === '--quota') out.quota = Number(argv[++i]);
    else if (a === '--count') out.count = Number(argv[++i]);
    else if (a === '--prefix') out.prefix = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--revoke') out.revoke = true;
    else if (a === '--help' || a === '-h') {
      console.log(`用法: node tools/pro/gen-apikey.mjs --email <邮箱> [选项]
  --plan   <套餐>   默认 pro-month
  --tier   <等级>   pro | free，默认 pro
  --quota  <次数>   月配额，默认 5000
  --count  <数量>   一次签几把，默认 1
  --prefix <前缀>   默认 hwt_live
  --out    <路径>   追加写 CSV
  --revoke          吊销该邮箱名下全部 key`);
      process.exit(0);
    }
  }
  return out;
}

/* ---------- 校验 ---------- */

const PLANS = ['pro-month', 'pro-year', 'pro-pass-month', 'pro-pass-year', 'lifetime'];
const TIERS = ['pro', 'free'];

function validate(o) {
  const errs = [];
  if (!o.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)) errs.push('--email 必填且要是合法邮箱');
  if (!PLANS.includes(o.plan)) errs.push(`--plan 必须是 ${PLANS.join(' | ')}`);
  if (!TIERS.includes(o.tier)) errs.push(`--tier 必须是 ${TIERS.join(' | ')}`);
  if (!Number.isInteger(o.count) || o.count < 1 || o.count > 50) errs.push('--count 必须是 1–50 的整数');
  if (!Number.isInteger(o.quota) || o.quota < 1 || o.quota > 1_000_000) errs.push('--quota 必须是 1–1000000 的整数');
  if (!/^[a-z][a-z0-9_]{2,15}$/.test(o.prefix)) errs.push('--prefix 只允许小写字母开头，含小写字母/数字/下划线，3–16 位');
  if (errs.length) {
    console.error('[x] 参数错误：');
    for (const e of errs) console.error('    ' + e);
    process.exit(1);
  }
}

/* ---------- 生成 ---------- */

/**
 * 拒绝采样：直接 byte % 30 会让前 16 个字符概率略高（256 % 30 = 16）。
 * 丢掉落在 [240, 255] 的字节，剩下的 240 个值整除 30，无偏差。
 */
function randomKey(prefix) {
  const lim = 256 - (256 % ALPHABET.length);
  const seg = () => {
    let s = '';
    while (s.length < SEG_LEN) {
      const b = randomBytes(SEG_LEN * 2);
      for (const x of b) {
        if (x >= lim) continue;
        s += ALPHABET[x % ALPHABET.length];
        if (s.length === SEG_LEN) break;
      }
    }
    return s;
  };
  return prefix + '_' + Array.from({ length: SEG_COUNT }, seg).join('-');
}

const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

/* ---------- 网络 ---------- */

const URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_KEY;

function needEnv() {
  if (!URL || !KEY) {
    console.error('[x] 缺环境变量：');
    console.error('    export SUPABASE_URL=https://<project>.supabase.co');
    console.error('    export SUPABASE_SERVICE_KEY=<service_role key>');
    process.exit(1);
  }
}

async function rest(method, path, body) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${method} ${path} → ${res.status} ${t.slice(0, 300)}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('json') ? res.json() : null;
}

/* ---------- 主流程 ---------- */

async function main() {
  const o = parseArgs(process.argv);
  validate(o);
  needEnv();

  const month = new Date().toISOString().slice(0, 7);

  /* ---------- 吊销 ---------- */

  if (o.revoke) {
    const rows = await rest('GET', `api_keys?email=eq.${encodeURIComponent(o.email)}&status=eq.active&select=key_prefix`);
    if (!rows?.length) {
      console.log(`该邮箱名下没有有效 key：${o.email}`);
      return;
    }
    await rest('PATCH', `api_keys?email=eq.${encodeURIComponent(o.email)}&status=eq.active`, { status: 'revoked' });
    console.log(`[ok] 已吊销 ${rows.length} 把 key：`);
    for (const r of rows) console.log('  ' + r.key_prefix + '…');
    return;
  }

  /* ---------- 签发 ---------- */

  const created = [];
  for (let i = 0; i < o.count; i++) {
    const plain = randomKey(o.prefix);
    const hash = sha256(plain);
    created.push({
      key_hash: hash,
      key_prefix: plain.slice(0, 16),
      email: o.email.toLowerCase(),
      plan: o.plan,
      tier: o.tier,
      monthly_quota: o.quota,
      used_month: month,
      used_count: 0,
      status: 'active',
    });
    // 明文只在这里出现一次，落盘供发送；库里只留哈希
    created[created.length - 1]._plain = plain;
  }

  const payload = created.map(({ _plain, ...rest }) => rest);
  await rest('POST', 'api_keys', payload);

  console.log(`[ok] 已签发 ${created.length} 把 key`);
  console.log(`     邮箱 ${o.email} · 套餐 ${o.plan} · 等级 ${o.tier} · 月配额 ${o.quota}`);
  console.log('');
  console.log('明文（只显示这一次，请立刻保存）：');
  console.log('');
  for (const c of created) {
    console.log('  ' + c._plain);
  }
  console.log('');

  if (o.out) {
    const header = 'email,plan,tier,quota,key,created_at\n';
    const lines = created
      .map((c) => [o.email, o.plan, o.tier, o.quota, c._plain, new Date().toISOString()].join(','))
      .join('\n');
    if (!existsSync(o.out)) writeFileSync(o.out, header, 'utf8');
    appendFileSync(o.out, lines + '\n', 'utf8');
    console.log(`已追加到 ${o.out}`);
  }

  console.log('调用示例：');
  console.log(`  curl -H "Authorization: Bearer ${created[0]._plain}" \\`);
  console.log(`       ${URL}/functions/v1/site-api/v1/site/careerpicai.com`);
}

main().catch((e) => {
  console.error('[x]', e.message);
  process.exit(1);
});
