#!/usr/bin/env node
/**
 * gen-codes.mjs — 批量生成 Pro 激活码
 *
 * 走 Supabase REST（service_role），不走 SDK，省掉一次依赖安装。
 * service_role key 只在本地/CI 用，绝不进前端。
 *
 * 用法：
 *   export SUPABASE_URL=https://mhxmfhdluzebptfmxgpe.supabase.co
 *   export SUPABASE_SERVICE_KEY=<service_role key>
 *   node tools/pro/gen-codes.mjs --plan pro-year --count 20 --out codes.csv
 *
 *   node tools/pro/gen-codes.mjs --plan pro-pass-month --count 5 --email a@b.com --note "支付宝 2026-11-03"
 *
 * 参数：
 *   --plan    必填。pro-month | pro-year | pro-pass-month | pro-pass-year | lifetime
 *   --count   生成数量，默认 1，上限 500
 *   --email   可选，预绑定邮箱。不填则谁先兑谁得
 *   --days    可选，覆盖套餐默认天数
 *   --note    可选，备注（订单号、渠道等）
 *   --out     CSV 输出路径；不填则只打印
 *
 * 退出码：0 成功，1 参数/网络错误。
 */

import { writeFileSync } from 'node:fs';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 去掉 0 O 1 I 等易混字符

const PLAN_DAYS = {
  'pro-month': 31,
  'pro-year': 366,
  'pro-pass-month': 30,
  'pro-pass-year': 365,
  lifetime: null,
};

const PLAN_PREFIX = {
  'pro-month': 'M',
  'pro-year': 'Y',
  'pro-pass-month': 'PM',
  'pro-pass-year': 'PY',
  lifetime: 'LT',
};

/* ---------- 参数 ---------- */

function parseArgs(argv) {
  const out = { plan: null, count: 1, email: null, days: undefined, note: null, out: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--plan') out.plan = argv[++i];
    else if (a === '--count') out.count = parseInt(argv[++i], 10);
    else if (a === '--email') out.email = argv[++i];
    else if (a === '--days') out.days = parseInt(argv[++i], 10);
    else if (a === '--note') out.note = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log('用法: node tools/pro/gen-codes.mjs --plan <plan> [--count N] [--email x] [--days N] [--note s] [--out f.csv]');
      console.log('plan: ' + Object.keys(PLAN_DAYS).join(' | '));
      process.exit(0);
    }
  }
  return out;
}

/* ---------- 码生成 ---------- */

// crypto.getRandomValues：浏览器和 Node 18+ 都有。用拒绝采样消除模偏差。
function randomChar() {
  const buf = new Uint8Array(1);
  const limit = 256 - (256 % ALPHABET.length);
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return ALPHABET[buf[0] % ALPHABET.length];
  }
}

function makeCode(plan) {
  const seg = (n) => Array.from({ length: n }, randomChar).join('');
  return `HWT-${PLAN_PREFIX[plan]}-${seg(4)}-${seg(4)}-${seg(4)}`;
}

/* ---------- 主流程 ---------- */

async function main() {
  const args = parseArgs(process.argv);

  if (!args.plan || !(args.plan in PLAN_DAYS)) {
    console.error('[x] --plan 必填，可选：' + Object.keys(PLAN_DAYS).join(' | '));
    process.exit(1);
  }
  if (!Number.isFinite(args.count) || args.count < 1 || args.count > 500) {
    console.error('[x] --count 需在 1..500');
    process.exit(1);
  }

  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!URL || !KEY) {
    console.error('[x] 缺环境变量 SUPABASE_URL / SUPABASE_SERVICE_KEY');
    console.error('    Supabase Dashboard → Project Settings → API → service_role');
    process.exit(1);
  }

  const days = args.days !== undefined ? args.days : PLAN_DAYS[args.plan];
  const rows = [];
  const seen = new Set();

  // 码空间 32^12，本地去重足够；数据库主键再兜一层
  while (rows.length < args.count) {
    const code = makeCode(args.plan);
    if (seen.has(code)) continue;
    seen.add(code);
    rows.push({
      code,
      plan: args.plan,
      days,
      email: args.email ? args.email.toLowerCase() : null,
      status: 'unused',
      note: args.note || null,
    });
  }

  const res = await fetch(`${URL}/rest/v1/pro_codes`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[x] 写入失败 HTTP ${res.status}: ${body.slice(0, 400)}`);
    process.exit(1);
  }

  const saved = await res.json();
  console.log(`[ok] 已入库 ${saved.length} 个 ${args.plan} 激活码（${days ?? '永久'} 天）`);

  if (args.out) {
    const header = 'code,plan,days,email,note,created_at';
    const lines = saved.map((r) =>
      [r.code, r.plan, r.days ?? '', r.email ?? '', (r.note ?? '').replace(/,/g, ';'), r.created_at].join(',')
    );
    writeFileSync(args.out, [header, ...lines].join('\n') + '\n', 'utf8');
    console.log(`[ok] CSV → ${args.out}`);
  } else {
    for (const r of saved) console.log('  ' + r.code);
  }
}

main().catch((e) => {
  console.error('[x] ' + (e?.message || e));
  process.exit(1);
});
