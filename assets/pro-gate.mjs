/**
 * pro-gate.mjs — Pro 付费墙前端控制
 *
 * 职责边界（重要）：
 *   这个文件只负责「显示/隐藏」和「发起登录/兑换请求」。
 *   它不判断用户是不是 Pro —— 判断在 Supabase 的 is_pro() 函数里，
 *   数据也在 RLS 后面。前端改这段代码只会看到自己的锁，拿不到数据。
 *
 * 用法：
 *   <script type="module" src="/assets/pro-gate.mjs"></script>
 *   <div data-pro-lock>...</div>          ← 非 Pro 时被遮罩
 *   <div data-pro-only hidden>...</div>   ← 非 Pro 时隐藏，Pro 时显示
 *   <button data-pro-login>登录</button>  ← 触发 Google 登录
 *   <form data-pro-redeem>...</form>      ← 兑换激活码
 *
 * 事件：
 *   window.addEventListener('hwt:pro', e => e.detail.isPro)
 */

const SUPABASE_URL = 'https://mhxmfhdluzebptfmxgpe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8o_fYc5QQT1E70dmjV2msA_571HyTkg';

const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

/* ---------------- 状态 ---------------- */

const state = {
  client: null,
  session: null,
  isPro: false,
  plan: null,
  expiresAt: null,
  loading: true,
};

const listeners = new Set();

function emit() {
  const detail = { ...state, client: undefined, session: state.session };
  for (const fn of listeners) {
    try { fn(detail); } catch (e) { console.warn('[pro-gate] listener error', e); }
  }
  window.dispatchEvent(new CustomEvent('hwt:pro', { detail }));
  render();
}

/* ---------------- 初始化 ---------------- */

async function init() {
  const { createClient } = await import(CDN);

  state.client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  const { data } = await state.client.auth.getSession();
  state.session = data.session;

  await refreshPro();

  state.client.auth.onAuthStateChange(async (_evt, session) => {
    state.session = session;
    await refreshPro();
  });

  state.loading = false;
  emit();
  wire();
}

/**
 * 查当前 Pro 状态。
 * 走 RPC 而不是查表 —— is_pro() 是 security definer，返回布尔，
 * 不给前端任何会员表的结构信息。
 */
async function refreshPro() {
  if (!state.client) return;
  if (!state.session) {
    state.isPro = false;
    state.plan = null;
    state.expiresAt = null;
    return;
  }
  try {
    const { data, error } = await state.client.rpc('pro_plan');
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    state.isPro = !!row;
    state.plan = row?.plan ?? null;
    state.expiresAt = row?.expires_at ?? null;
  } catch (e) {
    console.warn('[pro-gate] pro_plan 查询失败', e?.message || e);
    state.isPro = false;
  }
}

/* ---------------- DOM 渲染 ---------------- */

function render() {
  // 锁定区块
  for (const el of document.querySelectorAll('[data-pro-lock]')) {
    el.classList.toggle('is-locked', !state.isPro);
    el.setAttribute('aria-hidden', state.isPro ? 'false' : 'true');
    let mask = el.querySelector(':scope > .pro-mask');
    if (!state.isPro) {
      if (!mask) {
        mask = document.createElement('div');
        mask.className = 'pro-mask';
        mask.innerHTML = maskHTML();
        el.appendChild(mask);
        mask.querySelector('[data-pro-login]')?.addEventListener('click', login);
        mask.querySelector('[data-pro-goto-pricing]')?.addEventListener('click', () => {
          location.href = '/zh/pricing/';
        });
      }
    } else if (mask) {
      mask.remove();
    }
  }

  // 仅 Pro 可见
  for (const el of document.querySelectorAll('[data-pro-only]')) {
    el.hidden = !state.isPro;
  }

  // 仅非 Pro 可见
  for (const el of document.querySelectorAll('[data-pro-hidden]')) {
    el.hidden = state.isPro;
  }

  // 用户邮箱 / 退出
  for (const el of document.querySelectorAll('[data-pro-email]')) {
    el.textContent = state.session?.user?.email || '';
  }

  // 状态徽标
  for (const el of document.querySelectorAll('[data-pro-badge]')) {
    if (state.isPro) {
      const d = state.expiresAt ? new Date(state.expiresAt) : null;
      const when = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '永久';
      el.textContent = `Pro 已开通 · 到期 ${when}`;
      el.dataset.state = 'on';
    } else if (state.session) {
      el.textContent = '已登录 · 未开通 Pro';
      el.dataset.state = 'free';
    } else {
      el.textContent = '';
      el.dataset.state = 'anon';
    }
  }
}

function maskHTML() {
  return `
    <div class="pro-mask-inner">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <strong>这 ${document.body.dataset.lockedCount || ''} 行属于 Pro 数据</strong>
      <p>完整榜单、绝对访问量、逐期快照对比与 CSV 导出，开通后立即解锁。</p>
      <div class="pro-mask-actions">
        <button type="button" data-pro-login class="pro-btn pro-btn-primary">用 Google 登录</button>
        <button type="button" data-pro-goto-pricing class="pro-btn">查看方案</button>
      </div>
      <span class="pro-mask-fine">已购买？<a href="/zh/pricing/#redeem">用激活码开通</a></span>
    </div>`;
}

/* ---------------- 交互 ---------------- */

async function login() {
  if (!state.client) return;
  const { error } = await state.client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.href.split('#')[0] },
  });
  if (error) alert('登录失败：' + error.message);
}

async function logout() {
  await state.client?.auth.signOut();
  location.reload();
}

async function redeem(code) {
  if (!state.session) {
    return { ok: false, error: '请先登录，再兑换激活码' };
  }
  const { data, error } = await state.client.rpc('redeem_pro_code', { p_code: code.trim() });
  if (error) return { ok: false, error: error.message };
  if (!data?.ok) {
    const map = {
      invalid_code: '激活码不存在',
      already_used: '这个码已经被用过了',
      email_mismatch: '这个码绑定的是另一个邮箱',
      not_authenticated: '请先登录',
      no_email: '当前账号没有邮箱，换一个登录方式',
    };
    return { ok: false, error: map[data?.error] || '兑换失败' };
  }
  await refreshPro();
  emit();
  return { ok: true, ...data };
}

function wire() {
  for (const btn of document.querySelectorAll('[data-pro-login]')) {
    btn.addEventListener('click', (e) => { e.preventDefault(); login(); });
  }
  for (const btn of document.querySelectorAll('[data-pro-logout]')) {
    btn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
  }
  for (const form of document.querySelectorAll('[data-pro-redeem]')) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[name="code"]');
      const out = form.querySelector('[data-redeem-msg]');
      if (!input) return;
      if (out) { out.textContent = '正在兑换…'; out.dataset.state = ''; }
      const r = await redeem(input.value);
      if (out) {
        out.textContent = r.ok ? `开通成功：${r.plan}` : r.error;
        out.dataset.state = r.ok ? 'ok' : 'err';
      }
      if (r.ok) input.value = '';
    });
  }
}

/* ---------------- 数据获取 ---------------- */

/**
 * 拉最新一期榜单。RLS 决定返回 10 行还是 19 行，
 * 前端不做任何过滤 —— 拿不到就是拿不到。
 */
async function fetchRank() {
  if (!state.client) throw new Error('not ready');
  const { data, error } = await state.client
    .from('ai_growth_latest')
    .select('rank,domain,name,description,category,category_extra,monthly_visits,mom_growth_pct,visits_label,site_type,is_free')
    .order('rank', { ascending: true });
  if (error) throw error;
  return data || [];
}

/* ---------------- 导出 ---------------- */

const api = {
  get state() { return { ...state, client: undefined }; },
  get isPro() { return state.isPro; },
  get session() { return state.session; },
  onChange(fn) { listeners.add(fn); if (!state.loading) fn({ ...state, client: undefined }); return () => listeners.delete(fn); },
  login, logout, redeem, fetchRank, refresh: async () => { await refreshPro(); emit(); },
};

window.HWTPro = api;
export default api;

init().catch((e) => {
  console.error('[pro-gate] 初始化失败', e);
  state.loading = false;
  emit();
});
