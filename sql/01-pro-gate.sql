-- ============================================================
-- 01-pro-gate.sql  ·  HaoWordTool Pro 付费墙（Supabase）
-- ============================================================
-- 设计要点：
--   1. 付费数据的真值只存这张表，页面上不出现任何未授权指标。
--      静态站 curl 到的是 HTML，HTML 里只有免费行 —— 这是唯一靠得住的拦法。
--   2. RLS 按 is_pro() 判定，判定在数据库内完成，前端改 JS 无效。
--   3. 会员状态由支付 webhook（02 号文件的 Edge Function）写入，
--      用户侧只能 select 自己那一行，不能 insert/update。
--
-- 执行：Supabase Dashboard → SQL Editor，整份粘贴运行。
-- 幂等：全部 if not exists / drop policy if exists，可重复执行。
-- ============================================================

-- ------------------------------------------------------------
-- 1. 会员表
-- ------------------------------------------------------------
create table if not exists public.pro_members (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  email         text not null,
  plan          text not null check (plan in ('pro-month', 'pro-year', 'pro-pass-month', 'pro-pass-year', 'lifetime', 'trial')),
  status        text not null default 'active' check (status in ('active', 'expired', 'refunded', 'canceled', 'past_due')),
  provider      text,                          -- stripe / lemonsqueezy / alipay / manual
  provider_ref  text,                          -- 支付平台订单号，唯一约束防重复入账
  started_at    timestamptz not null default now(),
  expires_at    timestamptz,                   -- null + lifetime = 永久
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.pro_members is 'Pro 会员台账。只由服务端（webhook / service_role）写入。';
comment on column public.pro_members.expires_at is '到期时刻。lifetime 计划为 null。';

create unique index if not exists pro_members_email_plan_uidx
  on public.pro_members (lower(email), plan);
create index if not exists pro_members_user_idx  on public.pro_members (user_id);
create index if not exists pro_members_email_idx on public.pro_members (lower(email));
create unique index if not exists pro_members_provider_ref_uidx
  on public.pro_members (provider, provider_ref)
  where provider_ref is not null;

-- ------------------------------------------------------------
-- 2. Pro 判定函数
-- ------------------------------------------------------------
-- security definer：绕过 pro_members 的 RLS 做内部查询。
-- set search_path：防 search_path 注入。
create or replace function public.is_pro()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.pro_members m
    where (m.user_id = auth.uid()
           or lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
      and m.status = 'active'
      and (m.expires_at is null or m.expires_at > now())
  );
$$;

revoke all on function public.is_pro() from public;
grant execute on function public.is_pro() to anon, authenticated;

comment on function public.is_pro() is '当前会话是否为有效 Pro 会员。前端无权篡改。';

-- 当前会话的套餐名，用于前端显示到期时间
create or replace function public.pro_plan()
returns table (plan text, expires_at timestamptz, status text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.plan, m.expires_at, m.status
  from public.pro_members m
  where (m.user_id = auth.uid()
         or lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    and m.status = 'active'
    and (m.expires_at is null or m.expires_at > now())
  order by (m.expires_at is null) desc, m.expires_at desc
  limit 1;
$$;

revoke all on function public.pro_plan() from public;
grant execute on function public.pro_plan() to anon, authenticated;

-- ------------------------------------------------------------
-- 3. 榜单数据表
-- ------------------------------------------------------------
create table if not exists public.ai_growth_index (
  id              bigserial primary key,
  snapshot_date   date not null,
  rank            int  not null,
  domain          text not null,
  name            text,
  description     text,
  category        text,
  category_extra  text,
  monthly_visits  int,                          -- 绝对月访问，付费字段
  mom_growth_pct  numeric(10,2),                -- 环比增速，付费字段
  visits_label    text,                         -- 原始显示值 "3.7K"
  site_type       text,
  is_free         boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (snapshot_date, rank)
);

create index if not exists ai_growth_index_snapshot_idx on public.ai_growth_index (snapshot_date desc, rank);
create index if not exists ai_growth_index_free_idx     on public.ai_growth_index (is_free) where is_free;

comment on table public.ai_growth_index is 'AI 工具站增长榜逐期快照。is_free=true 的行匿名可读，其余需 Pro。';

-- ------------------------------------------------------------
-- 4. 激活码（支付宝/手动收款走这条）
-- ------------------------------------------------------------
create table if not exists public.pro_codes (
  code         text primary key,                -- HWT-XXXX-XXXX-XXXX
  plan         text not null check (plan in ('pro-month', 'pro-year', 'pro-pass-month', 'pro-pass-year', 'lifetime')),
  days         int,                             -- 时长；lifetime 为 null
  email        text,                            -- 预绑定邮箱，null = 谁兑谁得
  status       text not null default 'unused' check (status in ('unused', 'redeemed', 'void')),
  redeemed_by  uuid references auth.users(id) on delete set null,
  redeemed_at  timestamptz,
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists pro_codes_status_idx on public.pro_codes (status);

comment on table public.pro_codes is '一次性激活码。由后台批量生成，用户在 /zh/pricing/ 兑换。';

-- 兑换函数：原子操作，防并发重复兑换
create or replace function public.redeem_pro_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row      public.pro_codes%rowtype;
  v_email    text;
  v_uid      uuid := auth.uid();
  v_expires  timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_email = '' then
    return jsonb_build_object('ok', false, 'error', 'no_email');
  end if;

  -- for update 锁行，防同一码并发兑换
  select * into v_row from public.pro_codes where code = upper(trim(p_code)) for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;
  if v_row.status <> 'unused' then
    return jsonb_build_object('ok', false, 'error', 'already_used');
  end if;
  if v_row.email is not null and lower(v_row.email) <> v_email then
    return jsonb_build_object('ok', false, 'error', 'email_mismatch');
  end if;

  v_expires := case when v_row.days is null then null else now() + (v_row.days || ' days')::interval end;

  update public.pro_codes
     set status = 'redeemed', redeemed_by = v_uid, redeemed_at = now()
   where code = v_row.code;

  insert into public.pro_members (user_id, email, plan, status, provider, provider_ref, expires_at)
  values (v_uid, v_email, v_row.plan, 'active', 'code', v_row.code, v_expires)
  on conflict (lower(email), plan) do update
    set status = 'active',
        expires_at = greatest(coalesce(public.pro_members.expires_at, now()), now())
                     + case when v_row.days is null then interval '100 years' else (v_row.days || ' days')::interval end,
        user_id = v_uid,
        updated_at = now();

  return jsonb_build_object('ok', true, 'plan', v_row.plan, 'expires_at', v_expires);
end;
$$;

revoke all on function public.redeem_pro_code(text) from public;
grant execute on function public.redeem_pro_code(text) to authenticated;

-- ------------------------------------------------------------
-- 5. RLS
-- ------------------------------------------------------------
alter table public.pro_members     enable row level security;
alter table public.ai_growth_index enable row level security;
alter table public.pro_codes       enable row level security;

-- 会员表：本人只读自己，写入一律走 service_role（webhook），用户侧无写策略
drop policy if exists pro_members_self_read on public.pro_members;
create policy pro_members_self_read on public.pro_members
  for select to authenticated
  using (user_id = auth.uid()
         or lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- 榜单：匿名/未付费 → 只给 is_free；Pro → 全量
drop policy if exists ai_growth_index_free_read on public.ai_growth_index;
create policy ai_growth_index_free_read on public.ai_growth_index
  for select to anon, authenticated
  using (is_free = true);

drop policy if exists ai_growth_index_pro_read on public.ai_growth_index;
create policy ai_growth_index_pro_read on public.ai_growth_index
  for select to authenticated
  using (public.is_pro());

-- 激活码：谁都不能直接读（只有 redeem_pro_code 这个 definer 函数能碰）
drop policy if exists pro_codes_no_read on public.pro_codes;
create policy pro_codes_no_read on public.pro_codes
  for select to anon, authenticated
  using (false);

-- ------------------------------------------------------------
-- 6. 视图：一次拿到当前有效快照（供前端直接查）
-- ------------------------------------------------------------
create or replace view public.ai_growth_latest
with (security_invoker = true) as
select *
from public.ai_growth_index
where snapshot_date = (select max(snapshot_date) from public.ai_growth_index);

comment on view public.ai_growth_latest is '最新一期榜单。走 invoker 权限，RLS 照常生效。';

grant select on public.ai_growth_latest to anon, authenticated;

-- ============================================================
-- 校验（跑完可手动执行确认）
-- ============================================================
-- 匿名视角应只看到 10 行：
--   set role anon; select count(*) from public.ai_growth_latest;  -- 期望 10
-- Pro 视角应看到 19 行（需先有会员记录）：
--   select count(*) from public.ai_growth_latest;                 -- 期望 19
