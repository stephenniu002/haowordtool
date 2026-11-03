// supabase/functions/stripe-webhook/index.ts
// ============================================================
// Stripe → Supabase 会员开通
//
// 部署（Supabase CLI）：
//   supabase functions deploy stripe-webhook --no-verify-jwt
//   supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
//   supabase secrets set RESEND_API_KEY=re_xxx          # 可选，不配就不发信
//   supabase secrets set MAIL_FROM="HaoWordTool <hi@haowordtool.com>"
//
// Stripe 后台 → Developers → Webhooks → Add endpoint：
//   URL: https://mhxmfhdluzebptfmxgpe.supabase.co/functions/v1/stripe-webhook
//   事件: checkout.session.completed, invoice.paid,
//         customer.subscription.updated, customer.subscription.deleted,
//         charge.refunded
//
// 为什么 --no-verify-jwt：Stripe 不带 Supabase JWT。鉴权靠下面的
// HMAC 签名校验，这是 Stripe 官方的验签方式，等价强度。
//
// 幂等：所有写入都按 (provider, provider_ref) 唯一约束 upsert，
// 同一个事件重投不会重复开会员。
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const MAIL_FROM = Deno.env.get('MAIL_FROM') || 'HaoWordTool <hi@haowordtool.com>';

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* ---------------- Stripe 验签 ---------------- */

// 实现参考 Stripe 文档：signed_payload = f"{t}.{raw_body}"，HMAC-SHA256，hex 比对。
// 容忍 300 秒时钟漂移，防重放。
async function verifyStripeSignature(rawBody: string, sigHeader: string, secret: string): Promise<boolean> {
  const items = sigHeader.split(',');
  let timestamp = '';
  const signatures: string[] = [];

  for (const item of items) {
    const idx = item.indexOf('=');
    if (idx < 0) continue;
    const k = item.slice(0, idx).trim();
    const v = item.slice(idx + 1).trim();
    if (k === 't') timestamp = v;
    else if (k === 'v1') signatures.push(v);
  }

  if (!timestamp || !signatures.length) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp, 10));
  if (!Number.isFinite(age) || age > 300) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');

  // 常量时间比较，防时序侧信道
  let match = false;
  for (const sig of signatures) {
    if (sig.length !== expected.length) continue;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    if (diff === 0) match = true;
  }
  return match;
}

/* ---------------- 套餐映射 ---------------- */

// Stripe Price ID → 内部套餐。上线前把 price_xxx 换成真实 ID。
// 读环境变量，避免把价格 ID 写死在代码里。
function planFromPriceId(priceId: string | undefined): string {
  const map: Record<string, string> = {
    [Deno.env.get('PRICE_MONTH') || 'price_month']: 'pro-month',
    [Deno.env.get('PRICE_YEAR') || 'price_year']: 'pro-year',
  };
  return map[priceId || ''] || 'pro-month';
}

const PLAN_DAYS: Record<string, number | null> = {
  'pro-month': 31,
  'pro-year': 366,
  lifetime: null,
};

/* ---------------- 会员写入 ---------------- */

async function upsertMember(opts: {
  email: string;
  plan: string;
  provider: string;
  providerRef: string;
  expiresAt: string | null;
  status?: string;
}) {
  const email = opts.email.trim().toLowerCase();
  if (!email) throw new Error('empty email');

  const { error } = await sb
    .from('pro_members')
    .upsert(
      {
        email,
        plan: opts.plan,
        status: opts.status || 'active',
        provider: opts.provider,
        provider_ref: opts.providerRef,
        expires_at: opts.expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'provider,provider_ref' },
    );

  if (error) throw error;
}

/** 已有会员则在其到期时间上叠加，否则从现在起算 */
async function extendMember(email: string, plan: string, days: number, providerRef: string) {
  const { data: existing } = await sb
    .from('pro_members')
    .select('expires_at')
    .ilike('email', email)
    .eq('plan', plan)
    .maybeSingle();

  const base =
    existing?.expires_at && new Date(existing.expires_at) > new Date()
      ? new Date(existing.expires_at)
      : new Date();

  base.setUTCDate(base.getUTCDate() + days);
  await upsertMember({ email, plan, provider: 'stripe', providerRef, expiresAt: base.toISOString() });
}

/* ---------------- 发信 ---------------- */

async function sendMail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log('[mail] 未配置 RESEND_API_KEY，跳过发信 →', to);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, html }),
  });
  if (!res.ok) console.error('[mail] 发送失败', res.status, (await res.text()).slice(0, 200));
}

function welcomeHTML(email: string, plan: string, expiresAt: string | null) {
  const until = expiresAt
    ? new Date(expiresAt).toISOString().slice(0, 10)
    : '永久';
  return `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:540px;color:#0d131a;line-height:1.65">
  <h2 style="color:#021530;font-size:20px">Pro 已开通</h2>
  <p>${email} 的 ${plan} 已生效，有效期至 <strong>${until}</strong>。</p>
  <p>直接打开榜单页就能看到全部 19 行：<br>
  <a href="https://haowordtool.com/ai-tools/rank/" style="color:#1a89c5">https://haowordtool.com/ai-tools/rank/</a></p>
  <p style="color:#5a6474;font-size:13px">登录用同一个邮箱（Google 登录）。有任何问题直接回这封邮件。</p>
  <p style="color:#8a94a6;font-size:12px;border-top:1px solid #e6e9ef;padding-top:12px;margin-top:24px">HaoWordTool · 免费工具与 AI 工具增长情报</p>
</div>`;
}

/* ---------------- 事件处理 ---------------- */

async function handleEvent(event: any) {
  const type = event.type as string;
  const obj = event.data?.object || {};

  switch (type) {
    // 首次结账
    case 'checkout.session.completed': {
      const email = obj.customer_details?.email || obj.customer_email;
      if (!email) {
        console.warn('[skip] checkout 无 email', obj.id);
        return;
      }
      const plan = planFromPriceId(obj.line_items?.[0]?.price?.id);
      const days = PLAN_DAYS[plan];
      const expiresAt = days === null ? null : new Date(Date.now() + days * 86400_000).toISOString();

      await upsertMember({ email, plan, provider: 'stripe', providerRef: obj.id, expiresAt });
      await sendMail(email, 'HaoWordTool Pro 已开通', welcomeHTML(email, plan, expiresAt));
      break;
    }

    // 订阅续费成功
    case 'invoice.paid': {
      const email = obj.customer_email;
      const subId = obj.subscription;
      if (!email || !subId) return;
      // 首期在 checkout.session.completed 已写入，这里只处理续期
      if (obj.billing_reason === 'subscription_create') return;

      const plan = planFromPriceId(obj.lines?.data?.[0]?.price?.id);
      await extendMember(email, plan, PLAN_DAYS[plan] ?? 31, `${subId}:${obj.id}`);
      break;
    }

    // 订阅状态变化（取消预约、欠费等）
    case 'customer.subscription.updated': {
      const email = obj.customer_email;
      if (!email) return;
      const status = obj.status === 'active' || obj.status === 'trialing' ? 'active' : 'past_due';
      const { error } = await sb
        .from('pro_members')
        .update({
          status,
          expires_at: obj.current_period_end
            ? new Date(obj.current_period_end * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .ilike('email', email)
        .eq('provider', 'stripe');
      if (error) throw error;
      break;
    }

    // 订阅终止
    case 'customer.subscription.deleted': {
      const email = obj.customer_email;
      if (!email) return;
      const { error } = await sb
        .from('pro_members')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .ilike('email', email)
        .eq('provider', 'stripe');
      if (error) throw error;
      break;
    }

    // 退款
    case 'charge.refunded': {
      const email = obj.billing_details?.email || obj.receipt_email;
      if (!email) return;
      const { error } = await sb
        .from('pro_members')
        .update({ status: 'refunded', updated_at: new Date().toISOString() })
        .ilike('email', email);
      if (error) throw error;
      break;
    }

    default:
      console.log('[skip] 未处理事件类型', type);
  }
}

/* ---------------- 入口 ---------------- */

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('missing signature', { status: 400 });

  const raw = await req.text();

  if (!(await verifyStripeSignature(raw, sig, STRIPE_WEBHOOK_SECRET))) {
    return new Response('invalid signature', { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  try {
    await handleEvent(event);
    // 返回 200 是给 Stripe 的确认，让它别再重投
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[err] 处理失败', event?.type, e?.message || e);
    // 5xx 让 Stripe 重投，避免漏单
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500 });
  }
});
