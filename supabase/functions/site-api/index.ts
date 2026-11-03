// supabase/functions/site-api/index.ts
// ============================================================
// site-api — 对外 REST 接口（Pro API Key 鉴权）
// ============================================================
// 路由（前缀 /functions/v1/site-api 之后）：
//   GET  /v1/site/{domain}              单站详情 + 逐月序列
//   GET  /v1/rank                       全量榜单 JSON
//   GET  /v1/rank?format=csv           全量榜单 CSV
//   GET  /v1/health                     存活探测，不消耗配额
//
// 鉴权：Authorization: Bearer hwt_live_xxx
//   库内只存 sha256，这里算完哈希去 api_lookup() 比对。
//   配额按自然月计，超了返回 429 并带 reset 时间。
//
// 限流：60 次/分钟/key，用 api_usage 表的最近 60 秒计数。
//   和月配额是两层：月配额防滥用额度，分钟限流防打爆。
//
// 部署：
//   supabase functions deploy site-api --no-verify-jwt
//   --no-verify-jwt 是必须的 —— 这里不用 Supabase JWT，用自发的 API Key，
//   让平台层先拦一道 JWT 会把所有 API 调用挡在门外。
// ============================================================

const RATE_LIMIT_PER_MIN = 60;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const enc = new TextEncoder();

/* ---------------- 工具 ---------------- */

async function sha256hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}

function fail(error: string, status: number, extra: Record<string, unknown> = {}) {
  return json({ ok: false, error, ...extra }, status);
}

/** 用户可控文本进 CSV 必须防公式注入：Excel 会把 = + - @ 开头的单元格当公式执行 */
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCsv(rows: Record<string, unknown>[], cols: string[]): string {
  const head = cols.join(',');
  const body = rows.map((r) => cols.map((c) => csvCell(r[c])).join(',')).join('\n');
  return head + '\n' + body + '\n';
}

/* ---------------- 数据库 ---------------- */

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`rpc ${fn} ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function restGet<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`rest ${path} ${res.status}`);
  return res.json() as Promise<T>;
}

async function countRecentCalls(keyHash: string): Promise<number> {
  const since = new Date(Date.now() - 60_000).toISOString();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/api_usage?key_hash=eq.${encodeURIComponent(keyHash)}&created_at=gte.${encodeURIComponent(since)}&select=id`,
    {
      method: 'HEAD',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'count=exact',
      },
    },
  );
  const cr = res.headers.get('content-range'); // "0-9/42"
  const total = cr?.split('/')[1];
  return total ? Number(total) : 0;
}

function logCall(keyHash: string, endpoint: string, domain: string | null, status: number, ip: string | null) {
  // 不 await —— 日志失败不该影响响应
  fetch(`${SUPABASE_URL}/rest/v1/api_usage`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ key_hash: keyHash, endpoint, domain, status, ip }),
  }).catch(() => {});
}

/* ---------------- 主处理 ---------------- */

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'GET') return fail('method_not_allowed', 405);

  const url = new URL(req.url);
  // 去掉 /functions/v1/site-api 前缀，剩下 /v1/...
  const path = url.pathname.replace(/^.*\/site-api/, '') || '/';

  if (path === '/v1/health' || path === '/health') {
    return json({ ok: true, service: 'site-api', version: '1.0.0', time: new Date().toISOString() });
  }

  /* ---------- 鉴权 ---------- */

  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return fail('missing_key', 401, {
      hint: '在请求头加 Authorization: Bearer <你的 API Key>',
      docs: 'https://haowordtool.com/zh/pricing/#api',
    });
  }

  const rawKey = m[1].trim();
  const keyHash = await sha256hex(rawKey);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

  /* ---------- 分钟限流 ---------- */

  try {
    const n = await countRecentCalls(keyHash);
    if (n >= RATE_LIMIT_PER_MIN) {
      logCall(keyHash, path, null, 429, ip);
      return fail('rate_limited', 429, {
        limit: `${RATE_LIMIT_PER_MIN}/min`,
        retry_after_seconds: 60,
      });
    }
  } catch {
    // 计数失败不该挡住正常请求，放行并继续（月配额仍由 RPC 保证）
  }

  /* ---------- 路由 ---------- */

  try {
    // GET /v1/site/{domain}
    const siteMatch = path.match(/^\/v1\/site\/([^/]+)\/?$/);
    if (siteMatch) {
      const domain = decodeURIComponent(siteMatch[1]).toLowerCase().replace(/^www\./, '');
      if (!/^[a-z0-9][a-z0-9.-]{2,80}$/.test(domain)) {
        return fail('invalid_domain', 400);
      }

      const r = await rpc<Record<string, unknown>>('api_lookup', {
        p_key_hash: keyHash,
        p_domain: domain,
      });

      const status = r.ok ? 200 : Number(r.http) || 500;
      logCall(keyHash, '/v1/site', domain, status, ip);

      if (!r.ok) return fail(String(r.error), status, r.quota ? { quota: r.quota } : {});
      return json(r, 200, {
        'X-Quota-Limit': String((r.quota as Record<string, unknown>)?.limit ?? ''),
        'X-Quota-Used': String((r.quota as Record<string, unknown>)?.used ?? ''),
      });
    }

    // GET /v1/rank
    if (/^\/v1\/rank\/?$/.test(path)) {
      // 先验 key 有效性（api_lookup 需要 domain，这里借 rank_export 走另一条路）
      const keyRow = await restGet<Array<{ tier: string; status: string; used_count: number; monthly_quota: number; used_month: string }>>(
        `api_keys?key_hash=eq.${encodeURIComponent(keyHash)}&select=tier,status,used_count,monthly_quota,used_month`
      );

      if (!keyRow.length) {
        logCall(keyHash, '/v1/rank', null, 401, ip);
        return fail('invalid_key', 401);
      }
      const k = keyRow[0];
      if (k.status !== 'active') {
        logCall(keyHash, '/v1/rank', null, 403, ip);
        return fail('revoked_key', 403);
      }

      const month = new Date().toISOString().slice(0, 7);
      const used = k.used_month === month ? k.used_count : 0;
      if (used >= k.monthly_quota) {
        logCall(keyHash, '/v1/rank', null, 429, ip);
        return fail('quota_exceeded', 429, { quota: k.monthly_quota, used });
      }

      // 榜单导出算 1 次调用（不是按行算 —— 按行算会让批量拉取贵到没人用）
      await fetch(`${SUPABASE_URL}/rest/v1/api_keys?key_hash=eq.${encodeURIComponent(keyHash)}`, {
        method: 'PATCH',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(
          k.used_month === month
            ? { used_count: used + 1, last_used_at: new Date().toISOString() }
            : { used_month: month, used_count: 1, last_used_at: new Date().toISOString() }
        ),
      });

      const rows = await restGet<Record<string, unknown>[]>(
        'ai_site_detail?select=domain,name,description,category,site_type,rank,monthly_visits,mom_growth_pct,growth_score,revenue_signal,revenue_mom_pct,conversion_pct,revenue_month,payment_provider,checkout_host,traffic_direct_pct,traffic_referral_pct,traffic_search_pct,traffic_social_pct,geo,estimated,snapshot_date&order=rank.asc'
      );

      logCall(keyHash, '/v1/rank', null, 200, ip);

      if (url.searchParams.get('format') === 'csv') {
        const cols = [
          'rank', 'domain', 'name', 'category', 'site_type',
          'monthly_visits', 'mom_growth_pct', 'growth_score',
          'revenue_signal', 'revenue_mom_pct', 'conversion_pct', 'revenue_month',
          'payment_provider', 'checkout_host',
          'traffic_direct_pct', 'traffic_referral_pct', 'traffic_search_pct', 'traffic_social_pct',
          'snapshot_date',
        ];
        const csv = toCsv(rows, cols);
        return new Response(csv, {
          status: 200,
          headers: {
            ...CORS,
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="haowordtool-rank-${new Date().toISOString().slice(0, 10)}.csv"`,
            'X-Quota-Limit': String(k.monthly_quota),
            'X-Quota-Used': String(used + 1),
          },
        });
      }

      return json({
        ok: true,
        count: rows.length,
        quota: { limit: k.monthly_quota, used: used + 1, month },
        data: rows,
      });
    }

    logCall(keyHash, path, null, 404, ip);
    return fail('not_found', 404, {
      routes: ['GET /v1/site/{domain}', 'GET /v1/rank', 'GET /v1/rank?format=csv', 'GET /v1/health'],
    });
  } catch (e) {
    console.error('[site-api]', e);
    return fail('internal_error', 500);
  }
});
