-- ============================================================
-- 03-site-detail.sql  ·  站点详情 + 逐月走势 + API Key
-- ============================================================
-- 依赖：01-pro-gate.sql（需要 is_pro() / pro_members / ai_growth_index）
--
-- 设计要点：
--   1. 详情页分两层。免费层（名称/简介/分类/排名/月访问/环比/评分）
--      静态渲染进 HTML，给 SEO 和转化钩子；Pro 层（收款信号、转化率、
--      支付渠道、流量结构、国家分布、逐月序列、解读、竞品）
--      只在这两张表里，RLS 挡在 is_pro() 后面。
--   2. 非 Pro 调 site_detail() 也能拿到免费字段 —— 一个 RPC 出两种形态，
--      前端不用写两套逻辑，也不会因为「忘了过滤」漏数据：
--      漏数据的前提是数据先下发了，这里根本没下发。
--   3. api_keys 只存 sha256 明文哈希，不存明文。即使库被拖，
--      拿到的 key 也不能直接拿去调接口。
--
-- 执行：Supabase Dashboard → SQL Editor，整份粘贴。幂等。
-- ============================================================

-- ------------------------------------------------------------
-- 1. 站点详情（一行一域名，最新一期）
-- ------------------------------------------------------------
create table if not exists public.ai_site_detail (
  domain           text primary key,
  snapshot_date    date not null,

  -- 免费层：同时静态渲染进 HTML
  name             text,
  description      text,
  category         text,
  site_type        text,
  rank             int,
  monthly_visits   int,
  mom_growth_pct   numeric(10,2),
  visits_label     text,
  growth_score     numeric(5,1),          -- 自研综合评分 0-100，见 build-detail.mjs

  -- Pro 层
  revenue_signal        int,               -- 收款信号（月）
  revenue_mom_pct       numeric(10,2),     -- 收款环比
  conversion_pct        numeric(5,2),      -- 付款转化率 = 收款 / 访问
  revenue_month         text,              -- 收款最高月份，如 '2026-09'
  payment_provider      text,              -- stripe / dodopayments / paddle / lemonsqueezy
  checkout_host         text,              -- checkout.stripe.com
  traffic_direct_pct    numeric(5,2),
  traffic_referral_pct  numeric(5,2),
  traffic_search_pct    numeric(5,2),
  traffic_social_pct    numeric(5,2),
  geo                   jsonb,             -- [{"country":"China","pct":43.9}, ...]
  insight               text,              -- 解读正文（段落，\n 分隔）
  competitors           jsonb,             -- [{"domain":"x.com","visits":12000,"rank":3}]

  -- 数据可信度
  data_source      text default 'manual',  -- manual / series_derived / api
  estimated        boolean not null default false,  -- true = 部分字段为推算值
  updated_at       timestamptz not null default now()
);

create index if not exists ai_site_detail_snapshot_idx on public.ai_site_detail (snapshot_date desc);
create index if not exists ai_site_detail_category_idx on public.ai_site_detail (category);

comment on table public.ai_site_detail is 'AI 工具站详情。免费层同时静态渲染，Pro 层仅经 RLS 下发。';
comment on column public.ai_site_detail.estimated is 'true 表示推理字段（走势/评分）为算法派生，非实测。前端必须显示标记。';

-- ------------------------------------------------------------
-- 2. 逐月走势
-- ------------------------------------------------------------
create table if not exists public.ai_site_series (
  domain         text not null,
  month          date not null,            -- 月初
  visits         int,
  revenue_signal int,
  derived        boolean not null default false,  -- 由环比反推，非实测
  primary key (domain, month)
);

create index if not exists ai_site_series_domain_idx on public.ai_site_series (domain, month);

comment on table public.ai_site_series is '逐月访问与收款序列。derived=true 的行是从当期环比反推的估算值。';

-- ------------------------------------------------------------
-- 3. API Key
-- ------------------------------------------------------------
create table if not exists public.api_keys (
  key_hash      text primary key,           -- sha256(明文 key) 的 hex
  key_prefix    text not null,              -- 明文前 12 位，仅供人工辨认 'hwt_live_a1b2'
  email         text not null,
  plan          text not null default 'pro-month',
  tier          text not null default 'pro' check (tier in ('free', 'pro')),
  monthly_quota int  not null default 5000,
  used_month    text not null,              -- 'YYYY-MM'，跨月自动归零
  used_count    int  not null default 0,
  status        text not null default 'active' check (status in ('active', 'revoked')),
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);

create index if not exists api_keys_email_idx on public.api_keys (lower(email));

comment on table public.api_keys is 'API 凭证。只存 sha256 哈希，明文仅在生成时输出一次。';

-- ------------------------------------------------------------
-- 4. API 调用日志（限流 + 用量对账）
-- ------------------------------------------------------------
create table if not exists public.api_usage (
  id         bigserial primary key,
  key_hash   text not null,
  endpoint   text not null,
  domain     text,
  status     int not null,
  ip         text,
  created_at timestamptz not null default now()
);

create index if not exists api_usage_key_time_idx on public.api_usage (key_hash, created_at desc);

-- 按分钟限流用这个：统计最近 60 秒的调用数
create index if not exists api_usage_ratelimit_idx on public.api_usage (key_hash, created_at);

-- ------------------------------------------------------------
-- 5. site_detail() —— 一个 RPC，两种形态
-- ------------------------------------------------------------
-- 非 Pro：只返回免费字段（market 为 null）
-- Pro   ：返回全部
-- 前端拿到 null 就是 null，没有「前端过滤」这一层可以绕过。
create or replace function public.site_detail(p_domain text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_pro    boolean := public.is_pro();
  v_row    public.ai_site_detail%rowtype;
  v_base   jsonb;
  v_series jsonb;
begin
  select * into v_row
  from public.ai_site_detail
  where domain = lower(trim(p_domain))
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  -- 免费层：任何人都拿
  v_base := jsonb_build_object(
    'ok', true,
    'domain', v_row.domain,
    'name', v_row.name,
    'description', v_row.description,
    'category', v_row.category,
    'site_type', v_row.site_type,
    'rank', v_row.rank,
    'monthly_visits', v_row.monthly_visits,
    'mom_growth_pct', v_row.mom_growth_pct,
    'visits_label', v_row.visits_label,
    'growth_score', v_row.growth_score,
    'snapshot_date', v_row.snapshot_date,
    'is_pro', v_pro
  );

  if not v_pro then
    -- 关键：不是把 market 抹掉，是根本没查。序列也不下发。
    return v_base || jsonb_build_object('market', null, 'series', '[]'::jsonb);
  end if;

  select coalesce(jsonb_agg(
           jsonb_build_object('month', to_char(s.month, 'YYYY-MM'), 'visits', s.visits,
                              'revenue_signal', s.revenue_signal, 'derived', s.derived)
           order by s.month), '[]'::jsonb)
    into v_series
  from public.ai_site_series s
  where s.domain = v_row.domain;

  -- 注意 jsonb 的 || 在「数组 || 对象」时是追加元素，
  -- 所以必须 v_base（对象）在左，不能拿数组去拼对象
  return v_base || jsonb_build_object(
    'market', jsonb_build_object(
      'revenue_signal',     v_row.revenue_signal,
      'revenue_mom_pct',    v_row.revenue_mom_pct,
      'conversion_pct',     v_row.conversion_pct,
      'revenue_month',      v_row.revenue_month,
      'payment_provider',   v_row.payment_provider,
      'checkout_host',      v_row.checkout_host,
      'traffic', jsonb_build_object(
        'direct',   v_row.traffic_direct_pct,
        'referral', v_row.traffic_referral_pct,
        'search',   v_row.traffic_search_pct,
        'social',   v_row.traffic_social_pct
      ),
      'geo',         coalesce(v_row.geo, '[]'::jsonb),
      'insight',     v_row.insight,
      'competitors', coalesce(v_row.competitors, '[]'::jsonb),
      'data_source', v_row.data_source,
      'estimated',   v_row.estimated
    ),
    'series', v_series
  );
end;
$$;

revoke all on function public.site_detail(text) from public;
grant execute on function public.site_detail(text) to anon, authenticated;

-- ------------------------------------------------------------
-- 6. api_lookup() —— 给 Edge Function 用（service_role）
-- ------------------------------------------------------------
-- 做四件事：验 key、判配额、计数、返数据。一次往返。
-- 不在这里判限流（按分钟那条），那个在 Edge Function 里用 api_usage 算。
create or replace function public.api_lookup(p_key_hash text, p_domain text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_key   public.api_keys%rowtype;
  v_month text := to_char(now(), 'YYYY-MM');
  v_row   public.ai_site_detail%rowtype;
  v_series jsonb;
begin
  select * into v_key from public.api_keys where key_hash = p_key_hash for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_key', 'http', 401);
  end if;
  if v_key.status <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'revoked_key', 'http', 403);
  end if;

  -- 跨月归零
  if v_key.used_month <> v_month then
    update public.api_keys
       set used_month = v_month, used_count = 1, last_used_at = now()
     where key_hash = p_key_hash;
  else
    if v_key.used_count >= v_key.monthly_quota then
      return jsonb_build_object(
        'ok', false, 'error', 'quota_exceeded', 'http', 429,
        'quota', v_key.monthly_quota, 'used', v_key.used_count
      );
    end if;
    update public.api_keys
       set used_count = used_count + 1, last_used_at = now()
     where key_hash = p_key_hash;
  end if;

  select * into v_row from public.ai_site_detail
  where domain = lower(trim(p_domain)) limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found', 'http', 404);
  end if;

  select coalesce(jsonb_agg(
           jsonb_build_object('month', to_char(month, 'YYYY-MM'), 'visits', visits,
                              'revenue_signal', revenue_signal)
           order by month), '[]'::jsonb)
    into v_series
  from public.ai_site_series where domain = v_row.domain;

  return jsonb_build_object(
    'ok', true,
    'tier', v_key.tier,
    'quota', jsonb_build_object('limit', v_key.monthly_quota, 'used', v_key.used_count + 1, 'month', v_month),
    'data', jsonb_build_object(
      'domain', v_row.domain,
      'name', v_row.name,
      'description', v_row.description,
      'category', v_row.category,
      'site_type', v_row.site_type,
      'rank', v_row.rank,
      'monthly_visits', v_row.monthly_visits,
      'mom_growth_pct', v_row.mom_growth_pct,
      'growth_score', v_row.growth_score,
      'snapshot_date', v_row.snapshot_date,
      'revenue_signal', v_row.revenue_signal,
      'revenue_mom_pct', v_row.revenue_mom_pct,
      'conversion_pct', v_row.conversion_pct,
      'revenue_month', v_row.revenue_month,
      'payment_provider', v_row.payment_provider,
      'checkout_host', v_row.checkout_host,
      'traffic', jsonb_build_object(
        'direct',   v_row.traffic_direct_pct,
        'referral', v_row.traffic_referral_pct,
        'search',   v_row.traffic_search_pct,
        'social',   v_row.traffic_social_pct
      ),
      'geo', v_row.geo,
      'insight', v_row.insight,
      'competitors', v_row.competitors,
      'estimated', v_row.estimated,
      'series', v_series
    )
  );
end;
$$;

revoke all on function public.api_lookup(text, text) from public, anon, authenticated;
grant execute on function public.api_lookup(text, text) to service_role;

-- ------------------------------------------------------------
-- 7. 榜单批量导出（Pro 专属，CSV 导出走这个）
-- ------------------------------------------------------------
create or replace function public.rank_export()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_pro() then
    return jsonb_build_object('ok', false, 'error', 'pro_required');
  end if;
  return jsonb_build_object(
    'ok', true,
    'rows', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.rank)
      from (
        select domain, name, category, site_type, rank, monthly_visits,
               mom_growth_pct, growth_score, revenue_signal, conversion_pct,
               payment_provider, traffic_direct_pct, traffic_search_pct
        from public.ai_site_detail
        order by rank
      ) t
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.rank_export() from public;
grant execute on function public.rank_export() to authenticated;

-- ------------------------------------------------------------
-- 8. RLS
-- ------------------------------------------------------------
alter table public.ai_site_detail enable row level security;
alter table public.ai_site_series enable row level security;
alter table public.api_keys      enable row level security;
alter table public.api_usage     enable row level security;

-- 详情与走势：只给 Pro 直读。非 Pro 走 site_detail() 拿免费层。
-- 表直读一律关闭，避免「查表绕过 RPC」这条路。
drop policy if exists ai_site_detail_pro_read on public.ai_site_detail;
create policy ai_site_detail_pro_read on public.ai_site_detail
  for select to authenticated
  using (public.is_pro());

drop policy if exists ai_site_series_pro_read on public.ai_site_series;
create policy ai_site_series_pro_read on public.ai_site_series
  for select to authenticated
  using (public.is_pro());

-- key 与日志：谁都不能直读，只有 definer 函数碰
drop policy if exists api_keys_no_read on public.api_keys;
create policy api_keys_no_read on public.api_keys
  for select to anon, authenticated
  using (false);

drop policy if exists api_usage_no_read on public.api_usage;
create policy api_usage_no_read on public.api_usage
  for select to anon, authenticated
  using (false);

-- ============================================================
-- 校验（跑完手动执行）
-- ============================================================
-- 匿名：拿到免费层，market 为 null
--   select public.site_detail('gistra.io') -> 'market';     -- 期望 null
--   select public.site_detail('gistra.io') -> 'monthly_visits';  -- 期望 3300
--
-- 有 Pro 会员的登录态：market 非 null
--   select jsonb_pretty(public.site_detail('careerpicai.com'));
--
-- 表直读应被 RLS 挡：
--   set role anon; select count(*) from public.ai_site_detail;  -- 期望 0
