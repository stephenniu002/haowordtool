/**
 * site-detail-pro.mjs — 详情页 Pro 层渲染
 *
 * 数据只有一个来源：Supabase RPC site_detail(domain)。
 * 非 Pro 调用时服务端返回 market=null / series=[]，不是返回数据再让前端藏。
 * 所以这个文件里没有"权限判断"，只有"有数据就画，没有就留锁"。
 *
 * 静态 HTML 里免费层已经渲染好（SEO 需要），这里只补 Pro 区。
 */

const RPC_TIMEOUT = 8000;

/* ---------------- 格式化 ---------------- */

const fmtNum = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};

const fmtPct = (n, signed = false) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  const v = Number(n);
  const s = Number.isInteger(v) ? String(v) : v.toFixed(1);
  return (signed && v > 0 ? '+' : '') + s + '%';
};

const fmtDate = (s) => {
  if (!s) return '—';
  // 纯日期串直接返回。走 new Date('2026-11-03') 会按 UTC 解析，
  // 在 UTC-x 时区 getDate() 会退回前一天，快照日期显示成 11-02。
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(s);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const safe = (s) => String(s ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

/* ---------------- 走势图（无依赖 SVG） ---------------- */

/**
 * 单序列折线。点少（≤12）直接标点，多了只标首尾。
 * derived=true 的段用虚线 —— 那是从环比反推的估值，不能画成和实测一样的实线。
 */
function lineChart(series, { w = 640, h = 190, pad = { t: 18, r: 12, b: 26, l: 46 } } = {}) {
  if (!Array.isArray(series) || series.length < 2) {
    return '<p class="hint" style="padding:24px 0;text-align:center">走势数据积累中，本期不足两个月，下期更新。</p>';
  }

  const vals = series.map((d) => Number(d.visits) || 0);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const span = max - min || max || 1;
  // 上下各留 12% 余量，否则峰值贴顶看起来像被裁掉
  const top = max + span * 0.12;
  const bot = Math.max(0, min - span * 0.12);

  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const xAt = (i) => pad.l + (series.length === 1 ? iw / 2 : (i / (series.length - 1)) * iw);
  const yAt = (v) => pad.t + ih - ((v - bot) / (top - bot || 1)) * ih;

  const pts = series.map((d, i) => [xAt(i), yAt(Number(d.visits) || 0)]);

  // 折线按 derived 分段：实测段实线，估算段虚线
  const segs = [];
  let cur = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    cur.push(pts[i]);
    const nextDerived = series[i]?.derived;
    const isLast = i === pts.length - 1;
    if (nextDerived || isLast) {
      segs.push({ d: cur, dashed: !!nextDerived });
      // 下一段从当前点续上，保证不断线
      cur = [pts[i]];
    }
  }

  const paths = segs
    .filter((s) => s.d.length >= 2)
    .map((s) => `<path class="line" d="M${s.d.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L')}"${s.dashed ? ' stroke-dasharray="5 4" opacity=".72"' : ''}/>`)
    .join('');

  const areaD = `M${pts[0][0].toFixed(1)},${(pad.t + ih).toFixed(1)}` +
    pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') +
    `L${pts[pts.length - 1][0].toFixed(1)},${(pad.t + ih).toFixed(1)}Z`;

  // Y 轴 3 条参考线
  const grid = [0, 0.5, 1].map((r) => {
    const v = bot + (top - bot) * r;
    const y = yAt(v).toFixed(1);
    return `<line class="grid" x1="${pad.l}" y1="${y}" x2="${w - pad.r}" y2="${y}"/>` +
      `<text class="axis" x="${pad.l - 8}" y="${Number(y) + 3.5}" text-anchor="end">${fmtNum(Math.round(v))}</text>`;
  }).join('');

  // X 轴：点数 ≤8 全标，否则隔一个标
  const step = series.length <= 8 ? 1 : 2;
  const xlabels = series.map((d, i) => {
    if (i % step !== 0 && i !== series.length - 1) return '';
    return `<text class="axis" x="${xAt(i).toFixed(1)}" y="${h - 8}" text-anchor="middle">${safe(String(d.month || '').slice(2))}</text>`;
  }).join('');

  const dots = pts.map((p, i) =>
    `<circle class="${i === pts.length - 1 ? 'dot-last' : 'dot'}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === pts.length - 1 ? 4.5 : 3.5}"><title>${safe(series[i].month)}  ${fmtNum(series[i].visits)}</title></circle>`
  ).join('');

  const hasDerived = series.some((d) => d.derived);

  return `<svg class="d-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="月访问走势">
  <defs><linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1a89c5" stop-opacity=".22"/>
    <stop offset="100%" stop-color="#1a89c5" stop-opacity="0"/>
  </linearGradient></defs>
  ${grid}
  <path class="area" d="${areaD}"/>
  ${paths}
  ${dots}
  ${xlabels}
</svg>
<div class="d-chart-legend">
  <span><i></i>月访问（实测）</span>
  ${hasDerived ? '<span class="est"><i style="background:#8a94a4"></i>虚线段为按环比反推的估值</span>' : ''}
</div>`;
}

/* ---------------- 横向条 ---------------- */

function bars(items) {
  const rows = items.filter((x) => x && x.value !== null && x.value !== undefined && Number(x.value) > 0);
  if (!rows.length) return '<p class="hint" style="margin:0">本期未采集到分项数据。</p>';
  const max = Math.max(...rows.map((r) => Number(r.value)));
  return `<div class="d-bars">${rows.map((r) => `
  <div class="d-bar">
    <span class="lb">${safe(r.label)}</span>
    <span class="tr"><span class="fl" style="width:${Math.max(2, (Number(r.value) / max) * 100).toFixed(1)}%"></span></span>
    <span class="vl">${safe(r.text ?? fmtPct(r.value))}</span>
  </div>`).join('')}</div>`;
}

/* ---------------- 渲染 ---------------- */

function renderMarket(d) {
  const m = d.market || {};

  // 1. 指标卡
  const cards = [
    {
      k: '收款信号',
      v: m.revenue_signal !== null && m.revenue_signal !== undefined ? fmtNum(m.revenue_signal) : '—',
      s: m.revenue_month ? `${m.revenue_month} 为峰值月` : '未采集',
    },
    {
      k: '收款环比',
      v: fmtPct(m.revenue_mom_pct, true),
      s: Number(m.revenue_mom_pct) > 0 ? '付款跳转次数在涨' : '与上期持平或回落',
    },
    {
      k: '付款转化率',
      v: m.conversion_pct !== null && m.conversion_pct !== undefined ? fmtPct(m.conversion_pct) : '—',
      s: '收款信号 ÷ 月访问',
    },
  ];
  setHTML('market-cards', `<div class="d-mkt">${cards.map((c) => `
    <div class="d-mkt-card"><span>${c.k}</span><b>${c.v}</b><small>${safe(c.s)}</small></div>`).join('')}</div>`);

  // 2. 走势
  setHTML('market-chart', `<div class="d-chart-wrap">${lineChart(d.series || [])}</div>`);

  // 3. 支付渠道
  const prov = m.payment_provider;
  const host = m.checkout_host;
  setHTML('market-pay', prov || host
    ? `<div class="d-pay">
        <div class="ico">${safe((prov || '?').slice(0, 3).toUpperCase())}</div>
        <div class="meta">
          <b>${safe(prov || '未识别')}</b>
          ${host ? `<code>${safe(host)}</code>` : '<code>跳转域名未采集</code>'}
        </div>
      </div>`
    : '<p class="hint" style="margin:0">本期未识别到支付渠道。</p>');

  // 4. 流量结构
  const t = m.traffic || {};
  setHTML('market-traffic', bars([
    { label: '直接访问', value: t.direct },
    { label: '外链引荐', value: t.referral },
    { label: '自然搜索', value: t.search },
    { label: '社交媒体', value: t.social },
  ]));

  // 5. 国家分布
  const geo = Array.isArray(m.geo) ? m.geo : [];
  setHTML('market-geo', geo.length
    ? `<div class="d-bars">${geo.slice(0, 6).map((g) => `
        <div class="d-bar">
          <span class="lb">${safe(g.country || g.name || '—')}</span>
          <span class="tr"><span class="fl" style="width:${Math.max(2, Number(g.pct) || 0).toFixed(1)}%"></span></span>
          <span class="vl">${fmtPct(g.pct)}</span>
        </div>`).join('')}</div>`
    : '<p class="hint" style="margin:0">本期未采集到国家分布。</p>');

  // 6. 解读
  const insight = String(m.insight || '').trim();
  setHTML('market-insight', insight
    ? `<div class="d-insight">${insight.split(/\n{1,}/).filter(Boolean).map((p) => `<p>${p}</p>`).join('')}</div>`
    : '<p class="hint" style="margin:0">本期解读撰文中。</p>');

  // 7. 竞品
  const comp = Array.isArray(m.competitors) ? m.competitors : [];
  setHTML('market-comp', comp.length
    ? `<table class="d-comp"><thead><tr>
         <th class="rk">#</th><th>域名</th><th style="text-align:right">月访问</th>
         <th style="text-align:right" class="hide-sm">收款信号</th><th style="text-align:right">对比</th>
       </tr></thead><tbody>${comp.map((c) => {
         const base = Number(d.monthly_visits) || 0;
         const v = Number(c.visits) || 0;
         const ratio = base && v ? (v / base) : null;
         // 倍数要说清是谁比谁大。只写「3.4×」读者要自己猜方向。
         const cmp = ratio === null ? '—'
           : ratio > 1 ? `对方 ${ratio.toFixed(1)}×`
           : ratio < 1 ? `本页 ${(1 / ratio).toFixed(1)}×`
           : '持平';
         return `<tr>
           <td class="rk">${safe(c.rank ?? '—')}</td>
           <td><a href="/ai-tools/rank/${safe(c.domain)}/">${safe(c.domain)}</a></td>
           <td class="num">${fmtNum(v)}</td>
           <td class="num hide-sm">${c.revenue_signal != null ? fmtNum(c.revenue_signal) : '—'}</td>
           <td class="num">${cmp}</td>
         </tr>`;
       }).join('')}</tbody></table>`
    : '<p class="hint" style="margin:0">同分类暂无其他在榜站点。</p>');

  // 8. 数据可信度
  const est = !!m.estimated;
  for (const el of document.querySelectorAll('[data-d-est]')) el.hidden = !est;
  for (const el of document.querySelectorAll('[data-d-src]')) {
    el.textContent = m.data_source === 'series_derived' ? '走势为环比反推' : (m.data_source || '手工采集');
  }

  // 解锁 UI 切换
  for (const el of document.querySelectorAll('[data-d-lock]')) el.hidden = true;
  for (const el of document.querySelectorAll('[data-d-market]')) el.hidden = false;
}

function setHTML(id, html) {
  const el = document.querySelector(`[data-d-mount="${id}"]`);
  if (el) el.innerHTML = html;
}

function setStatus(text, state = '') {
  const el = document.querySelector('[data-d-status]');
  if (!el) return;
  el.textContent = text;
  el.dataset.state = state;
}

/* ---------------- 主流程 ---------------- */

async function run() {
  const root = document.querySelector('[data-d-root]');
  if (!root) return;
  const domain = root.dataset.domain;
  if (!domain) return;

  const waitPro = () =>
    new Promise((resolve) => {
      if (window.HWTPro && !window.HWTPro.state.loading) return resolve(window.HWTPro);
      const t = setTimeout(() => resolve(window.HWTPro || null), RPC_TIMEOUT);
      window.addEventListener('hwt:pro', function once(e) {
        if (e.detail && !e.detail.loading) {
          clearTimeout(t);
          window.removeEventListener('hwt:pro', once);
          resolve(window.HWTPro);
        }
      });
    });

  // 没 Pro 也要调一次 —— 免费层字段由服务端决定给什么，
  // 但静态 HTML 已经有了，这次调用只为确认状态；
  // 非 Pro 时提前返回，省一次往返。
  const pro = await waitPro();
  if (!pro) {
    setStatus('数据服务暂不可用，免费字段已在本页直接显示。');
    return;
  }
  if (!pro.isPro) {
    setStatus('免费视图 · 变现与收款、逐月走势、竞品对比需 Pro。');
    return;
  }

  setStatus('Pro 视图 · 正在载入完整数据…');

  let res;
  try {
    const { data, error } = await pro.state.client.rpc('site_detail', { p_domain: domain });
    if (error) throw error;
    res = data;
  } catch (e) {
    console.warn('[site-detail] RPC 失败', e?.message || e);
    setStatus('完整数据载入失败，稍后重试。', '');
    return;
  }

  if (!res || res.ok === false) {
    setStatus(res?.error === 'not_found' ? '这个域名不在本期榜单内。' : '数据读取失败。');
    return;
  }
  if (!res.market) {
    setStatus('免费视图 · 变现与收款、逐月走势、竞品对比需 Pro。');
    return;
  }

  renderMarket(res);
  const when = res.snapshot_date ? fmtDate(res.snapshot_date) : '';
  setStatus(`Pro 视图 · 快照 ${when}${res.market.estimated ? ' · 部分字段为推算值' : ''}`, 'on');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
