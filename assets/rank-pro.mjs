/**
 * rank-pro.mjs — 榜单页的 Pro 数据填充
 *
 * 页面上的 9 行锁定数据不在 HTML 里，只有域名。指标从 Supabase 拉，
 * RLS 决定返回几行：非 Pro 返回 0 行（is_free=true 的行本来就在 HTML 里），
 * Pro 返回全部。所以这里没有"判断权限"的代码，只有"填进去"的代码。
 */

const fmtVisits = (n, label) => {
  if (label) return label;
  if (n === null || n === undefined) return '—';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};

const fmtGrowth = (p) => {
  if (p === null || p === undefined) return '—';
  const s = Number.isInteger(p) ? String(p) : p.toFixed(1);
  return (p > 0 ? '+' : '') + s + '%';
};

function fillCell(cell, text) {
  const blur = cell.querySelector('.pro-blur');
  if (blur) blur.remove();
  let val = cell.querySelector('.pro-val');
  if (!val) {
    val = document.createElement('span');
    val.className = 'pro-val';
    cell.appendChild(val);
  }
  val.textContent = text;
  cell.classList.add('is-unlocked');
}

async function run() {
  const cells = document.querySelectorAll('td[data-pro-cell]');
  if (!cells.length) return;

  // 等 pro-gate.mjs 初始化完
  const waitPro = () =>
    new Promise((resolve) => {
      if (window.HWTPro && !window.HWTPro.state.loading) return resolve(window.HWTPro);
      const t = setTimeout(() => resolve(window.HWTPro || null), 6000);
      window.addEventListener('hwt:pro', function once(e) {
        if (e.detail && !e.detail.loading) {
          clearTimeout(t);
          window.removeEventListener('hwt:pro', once);
          resolve(window.HWTPro);
        }
      });
    });

  const pro = await waitPro();
  if (!pro || !pro.isPro) return;

  let rows;
  try {
    rows = await pro.fetchRank();
  } catch (e) {
    console.warn('[rank-pro] 拉取失败', e?.message || e);
    return;
  }

  // domain → row
  const byDomain = new Map(rows.map((r) => [r.domain, r]));

  for (const cell of cells) {
    const d = cell.dataset.domain;
    const row = byDomain.get(d);
    if (!row) continue;
    const kind = cell.dataset.proCell;
    if (kind === 'visits') fillCell(cell, fmtVisits(row.monthly_visits, row.visits_label));
    else if (kind === 'growth') fillCell(cell, fmtGrowth(row.mom_growth_pct));
    else if (kind === 'type') fillCell(cell, row.site_type || '—');
  }

  // 页面级兜底：黄条收、绿条放。
  // 不依赖 pro-gate 的 render —— 那个模块要是加载失败或被拦截，
  // 这里已经把数据填进去了，提示条却还写着「被锁住」就自相矛盾。
  for (const el of document.querySelectorAll('.pro-lockbar[data-pro-hidden]')) el.hidden = true;
  for (const el of document.querySelectorAll('.pro-lockbar[data-pro-only]')) el.hidden = false;

  // 顶部统计换成真实总量（Pro 才有全量，所以数字才对得上）
  const totalVisits = rows.reduce((a, r) => a + (r.monthly_visits || 0), 0);
  for (const el of document.querySelectorAll('[data-pro-stat="total-sites"]')) {
    el.textContent = String(rows.length);
  }
  for (const el of document.querySelectorAll('[data-pro-stat="total-visits"]')) {
    el.textContent = fmtVisits(totalVisits);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
