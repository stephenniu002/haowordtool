#!/usr/bin/env node
/**
 * build-detail.mjs
 * 为榜单里每个域名生成独立详情页，并输出详情表种子 SQL。
 *
 * 分层原则（和榜单页一致，不重复解释）：
 *   免费层 → 直接写进 HTML。名称、简介、排名、月访问、环比、评分、评分构成、
 *            同分类位置。这些给搜索引擎和落地页转化用。
 *   Pro 层 → 一个字都不写进 HTML。收款信号、转化率、支付渠道、流量结构、
 *            国家分布、逐月序列、解读、竞品对比，全部在 Supabase 里，
 *            由 site_detail() 按 is_pro() 决定下不下发。
 *
 * 逐月序列是反推的，不是实测 —— 所以:
 *   - 每行标 derived，页面用虚线画
 *   - 反推到月访问 < 100 就停（再往前推是个位数，没有参考价值）
 *   - 环比越高的站能推的月数越少，这是数学结果，不是缺数据
 *
 * 用法:
 *   node tools/pro/build-detail.mjs                    # 生成 HTML + 种子 SQL
 *   node tools/pro/build-detail.mjs --sql-only         # 只出 SQL
 *   node tools/pro/build-detail.mjs --html-only        # 只出 HTML
 *   node tools/pro/build-detail.mjs --out-dir /tmp/x   # 改输出目录（调试用）
 *
 * 复杂度: O(n·m)，n=站点数(19)，m=每月序列长度(≤6)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/* ============================================================
   参数
   ============================================================ */

function parseArgs(argv) {
  const out = {
    data: 'data/ai-growth-index.json',
    extra: 'data/ai-site-detail.json',
    outDir: 'ai-tools/rank',
    sql: 'sql/04-seed-detail.sql',
    sqlOnly: false,
    htmlOnly: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--data') out.data = argv[++i];
    else if (a === '--extra') out.extra = argv[++i];
    else if (a === '--out-dir') out.outDir = argv[++i];
    else if (a === '--sql') out.sql = argv[++i];
    else if (a === '--sql-only') out.sqlOnly = true;
    else if (a === '--html-only') out.htmlOnly = true;
    else if (a === '--help' || a === '-h') {
      console.log(`用法: node tools/pro/build-detail.mjs [选项]
  --data <json>     榜单数据（默认 data/ai-growth-index.json）
  --extra <json>    市场数据补充（默认 data/ai-site-detail.json，可不存在）
  --out-dir <dir>   详情页输出根目录（默认 ai-tools/rank）
  --sql <file>      种子 SQL 输出（默认 sql/04-seed-detail.sql）
  --sql-only        只生成 SQL
  --html-only       只生成 HTML`);
      process.exit(0);
    }
  }
  return out;
}

/* ============================================================
   工具函数
   ============================================================ */

const esc = (s) =>
  String(s ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));

const sqlStr = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const sqlNum = (n) => (n === null || n === undefined || Number.isNaN(Number(n)) ? 'null' : String(Number(n)));
const sqlBool = (b) => (b ? 'true' : 'false');
const sqlJson = (o) => (o === null || o === undefined ? 'null' : `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`);

function fmtVisits(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function fmtGrowth(p) {
  if (p === null || p === undefined) return '—';
  const s = Number.isInteger(Number(p)) ? String(p) : Number(p).toFixed(1);
  return (Number(p) > 0 ? '+' : '') + s + '%';
}

// 'YYYY-MM-DD' 必须按本地时区构造。new Date('2026-11-03') 是 UTC 午夜，
// 在 UTC-x 时区本地日期会退一天，月初时 setMonth 直接跨错月。
function parseDateLocal(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date();
}

function addMonths(base, delta) {
  const d = new Date(base.getTime());
  d.setMonth(d.getMonth() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/* ============================================================
   评分：为什么这么算
   ------------------------------------------------------------
   两个维度都取对数，因为这两个量都是长尾分布 —— 9900% 和 8000%
   在业务上没区别（都是"基期太小"），但线性打分会把它们拉开 20 分。
   对数压缩后，10 倍差距 = 固定分数差，符合人的直觉。
     增速分 = log10(1+g) / log10(1+10000) × 100，上限 100
     规模分 = log10(1+v) / log10(1+200000) × 100，上限 100
   权重 65/35：这个榜的定位是"找正在起量的"，不是"找最大的"。
   ============================================================ */

function growthScore(visits, growthPct) {
  const g = Math.max(0, Number(growthPct) || 0);
  const v = Math.max(0, Number(visits) || 0);
  const gs = Math.min(100, (Math.log10(1 + g) / Math.log10(10001)) * 100);
  const vs = Math.min(100, (Math.log10(1 + v) / Math.log10(200001)) * 100);
  return Math.round((gs * 0.65 + vs * 0.35) * 10) / 10;
}

/* ============================================================
   逐月序列反推
   ------------------------------------------------------------
   已知本月 visits 与环比 g，则上月 = 本月 / (1 + g/100)。
   再往前推时，环比按 0.55 衰减（增长在放缓的保守假设）——
   这是假设，不是数据，所以全部标 derived，页面画虚线。
   序列长度不由我们决定：反推到月访问 < 100 就停，
   个位数的"历史"没有参考价值，写出来是假精确。
   ============================================================ */

const SERIES_DECAY = 0.55;
const SERIES_MIN_VISITS = 100;
const SERIES_MAX_MONTHS = 6;

function deriveSeries(visits, growthPct, snapshotDate) {
  const v0 = Number(visits);
  const g = Math.max(0, Number(growthPct) || 0);
  if (!v0 || v0 <= 0) return [];

  const base = parseDateLocal(snapshotDate);
  const points = [{ month: addMonths(base, 0), visits: Math.round(v0), derived: false }];

  let cur = v0;
  let rate = g;
  for (let i = 1; i < SERIES_MAX_MONTHS; i++) {
    const prev = cur / (1 + rate / 100);
    if (!isFinite(prev) || prev < SERIES_MIN_VISITS) break;
    points.push({ month: addMonths(base, -i), visits: Math.round(prev), derived: true });
    cur = prev;
    rate = rate * SERIES_DECAY;
  }

  return points.reverse(); // 升序，图表直接画
}

/* ============================================================
   竞品：同分类优先，不足用流量最接近的补
   ============================================================ */

function pickCompetitors(rec, all, extraSites, n = 4) {
  const others = all.filter((x) => x.domain !== rec.domain);

  const same = others
    .filter((x) => x.category === rec.category)
    .sort((a, b) => (b.monthly_visits || 0) - (a.monthly_visits || 0));

  const picked = same.slice(0, n);

  if (picked.length < n) {
    // 用 log 距离而不是绝对差 —— 3K vs 5K 和 100K vs 102K 在绝对差上一样，
    // 业务上完全不同量级。对数尺度下才可比。
    const rest = others
      .filter((x) => !picked.includes(x))
      .sort((a, b) => {
        const d = (x) => Math.abs(Math.log10((x.monthly_visits || 1) + 1) - Math.log10((rec.monthly_visits || 1) + 1));
        return d(a) - d(b);
      });
    picked.push(...rest.slice(0, n - picked.length));
  }

  return picked
    .sort((a, b) => (b.monthly_visits || 0) - (a.monthly_visits || 0))
    .map((x) => ({
      domain: x.domain,
      name: x.name,
      rank: x.rank,
      visits: x.monthly_visits,
      // 竞品的收款信号从补充数据里取；没有就是 null，前端显示 —
      revenue_signal: extraSites[x.domain]?.revenue_signal ?? null,
    }));
}

/* ============================================================
   免费摘要：模板生成，不含任何 Pro 字段
   ============================================================ */

function growthBand(g) {
  const n = Number(g) || 0;
  if (n >= 1000) return { label: '爆发档', text: '增速超过 1000%，通常是一个新站切中了某个具体需求，或单一渠道突然起量。这一档的特点是不稳定——下一期可能继续翻倍，也可能直接掉出榜。' };
  if (n >= 300) return { label: '快速爬升', text: '增速在 300%–1000% 之间，属于已经验证了需求、正在放大获客的阶段。这一档的站值得看它的获客渠道，通常是可复制的方法。' };
  if (n >= 100) return { label: '稳定增长', text: '增速在 100%–300% 之间，增长已经过了最陡的一段但还在持续。这一档看的是留存和复购，而不是拉新速度。' };
  return { label: '温和增长', text: '增速低于 100%，在本期榜单里属于偏慢的。但要注意基数——大盘子涨 80% 的绝对增量，可能比小盘子涨 3000% 还多。' };
}

function buildSummary(rec, ctx) {
  const band = growthBand(rec.mom_growth_pct);
  const sameCat = ctx.all.filter((x) => x.category === rec.category);
  const catRank = sameCat.sort((a, b) => (a.rank || 999) - (b.rank || 999)).findIndex((x) => x.domain === rec.domain) + 1;

  const parts = [];

  parts.push(
    `<p><strong>${esc(rec.name || rec.domain)}</strong>（${esc(rec.domain)}）在本期 AI 工具站增长榜排第 <strong>${rec.rank}</strong> 名，` +
    `分类是${esc(rec.category)}${rec.category_extra ? '／' + esc(rec.category_extra) : ''}，` +
    `月访问 ${esc(rec.visits_label || fmtVisits(rec.monthly_visits))}，环比 ${esc(fmtGrowth(rec.mom_growth_pct))}，` +
    `综合评分 <strong>${rec.growth_score}</strong>。</p>`
  );

  if (rec.description) {
    parts.push(`<p>${esc(rec.description)}</p>`);
  }

  parts.push(`<p>增速属于<strong>${band.label}</strong>。${band.text}</p>`);

  if (sameCat.length > 1) {
    parts.push(
      `<p>同分类（${esc(rec.category)}）本期共 ${sameCat.length} 个站在榜，` +
      `它排第 ${catRank}。同类对比见下方竞品表。</p>`
    );
  }

  return parts.join('\n      ');
}

/* ============================================================
   HTML 模板
   ============================================================ */

const NAV = `<header><div class="wrap"><nav class="nav">
  <a class="logo" href="/zh/">Hao<span>WordTool</span></a>
  <div class="links">
    <a class="l" href="/ai-tools/">AI 工具</a>
    <a class="l on" href="/ai-tools/rank/">增长榜</a>
    <a class="l" href="/zh/pricing/">Pro</a>
    <a class="cta" href="/zh/pricing/">解锁数据</a>
  </div>
</nav></div></header>`;

const FOOTER = `<footer><div class="wrap">
  <span class="brand">HaoWordTool</span>
  <span>免费在线工具 · AI 工具增长情报</span>
  <span><a href="/about.html">关于</a> · <a href="/privacy.html">隐私</a> · <a href="/terms.html">条款</a> · <a href="/contact.html">联系</a></span>
</div></footer>`;

function lockBlock() {
  return `<div data-d-lock>
  <div class="d-empty">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
    <strong>这 6 项属于 Pro 数据</strong>
    <p>收款信号与付款转化率、逐月访问走势、流量来源结构、国家分布、支付渠道识别、同分类竞品对比。<br>免费部分已经把排名、规模、增速和评分给全了。</p>
    <div class="d-actions">
      <button type="button" class="d-btn primary" data-pro-login>用 Google 登录</button>
      <a class="d-btn" href="/zh/pricing/">看 Pro 方案</a>
    </div>
  </div>
</div>`;
}

function marketBlock() {
  return `<div data-d-market hidden>
  <section class="d-sec">
    <h2>变现与收款 <span class="pro-pill">PRO</span></h2>
    <p class="hint">收款信号 = 该站每月被观测到的付款跳转次数。转化率 = 收款信号 ÷ 月访问。</p>
    <div data-d-mount="market-cards"></div>
    <div style="margin-top:12px" data-d-mount="market-pay"></div>
  </section>

  <section class="d-sec">
    <h2>逐月访问走势 <span class="pro-pill">PRO</span></h2>
    <p class="hint">最近 6 个月。实线为实测，虚线为按环比反推的估值 —— 反推到月访问不足 100 就停止，再往前是假精确。</p>
    <div data-d-mount="market-chart"></div>
  </section>

  <section class="d-sec">
    <h2>流量来源结构 <span class="pro-pill">PRO</span></h2>
    <p class="hint">直接访问占比高说明有品牌或复访；搜索占比高说明吃的是 SEO；外链引荐高说明在被人推荐。</p>
    <div data-d-mount="market-traffic"></div>
  </section>

  <section class="d-sec">
    <h2>主要国家 <span class="pro-pill">PRO</span></h2>
    <p class="hint">访客来源地前六。决定定价币种和支付方式怎么选。</p>
    <div data-d-mount="market-geo"></div>
  </section>

  <section class="d-sec">
    <h2>这个站值得学什么 <span class="pro-pill">PRO</span></h2>
    <div data-d-mount="market-insight"></div>
  </section>

  <section class="d-sec" style="margin-bottom:0">
    <h2>同分类对比 <span class="pro-pill">PRO</span></h2>
    <p class="hint">同分类在榜站点的规模对照，用来判断这个细分还剩多少空间。</p>
    <div data-d-mount="market-comp"></div>
  </section>
</div>`;
}

function scoreBar(label, value, weight) {
  const pct = Math.max(0, Math.min(100, value));
  return `<div class="d-bar">
    <span class="lb">${esc(label)}</span>
    <span class="tr"><span class="fl" style="width:${pct.toFixed(1)}%"></span></span>
    <span class="vl">${(pct * weight).toFixed(1)}</span>
  </div>`;
}

function pageHTML(rec, ctx) {
  const title = `${rec.name || rec.domain}（${rec.domain}）增长情报 — 月访问、收款信号、流量结构 · HaoWordTool`;
  const desc = `${rec.name || rec.domain} 在 AI 工具站增长榜第 ${rec.rank} 名，月访问 ${rec.visits_label || fmtVisits(rec.monthly_visits)}，环比 ${fmtGrowth(rec.mom_growth_pct)}。含收款信号、付款转化率、逐月走势、流量结构与同分类对比。`;
  const url = `https://haowordtool.com/ai-tools/rank/${rec.domain}/`;
  const initial = (rec.name || rec.domain).replace(/[^A-Za-z\u4e00-\u9fa5]/g, '').slice(0, 2).toUpperCase() || rec.domain.slice(0, 2).toUpperCase();

  // 评分构成（免费展示，让人看懂分数哪来的）
  const g = Math.max(0, Number(rec.mom_growth_pct) || 0);
  const v = Math.max(0, Number(rec.monthly_visits) || 0);
  const gComp = Math.min(100, (Math.log10(1 + g) / Math.log10(10001)) * 100);
  const vComp = Math.min(100, (Math.log10(1 + v) / Math.log10(200001)) * 100);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${rec.name || rec.domain} 增长情报`,
    description: desc,
    url,
    creator: { '@type': 'Organization', name: 'HaoWordTool' },
    dateModified: ctx.snapshot,
    isAccessibleForFree: true,
    variableMeasured: ['月访问量', '环比增速', '增长评分'],
  };

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="zh-CN" href="${url}">
<link rel="alternate" hreflang="x-default" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=EB+Garamond:ital,wght@0,500;0,600;1,500&family=Noto+Serif+SC:wght@500;600&family=Noto+Sans+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site-detail.css">
<style>
:root{
  --abyss:#010b1e;--dusk:#021530;--sea:#1a89c5;--sky:#71c3ec;
  --amber:#fcbb00;--white:#fff;--ink:#0d131a;--mute:#5a6474;
  --line:#e6e9ef;--soft:#f6f8fa;--up:#0a8754;
  --font-display:'EB Garamond','Noto Serif SC','Songti SC',serif;
  --font-sans:'Inter','PingFang SC','Microsoft YaHei',system-ui,sans-serif;
  --font-mono:'Noto Sans Mono',ui-monospace,monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font-sans);color:var(--ink);background:var(--white);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}

header{position:sticky;top:0;background:var(--dusk);z-index:20;border-bottom:1px solid #16304f}
.nav{display:flex;align-items:center;gap:24px;height:60px}
.logo{font-family:var(--font-display);font-weight:600;font-size:19px;color:var(--white)}
.logo span{color:var(--sky)}
.nav .links{display:flex;gap:20px;margin-left:auto;align-items:center}
.nav a.l{color:#9fb3c8;font-size:14px;font-weight:500}
.nav a.l:hover{color:var(--white)}
.nav a.l.on{color:var(--white);font-weight:600}
.nav .cta{background:var(--amber);color:var(--dusk);font-weight:700;padding:8px 16px;border-radius:8px;font-size:13px}

@media(max-width:700px){
  .nav{gap:12px}
  .nav .links a.l{display:none}
  .nav .links .cta{display:inline-block}
}

footer{border-top:1px solid var(--line);background:var(--soft);margin-top:48px;padding:28px 0}
footer .wrap{display:flex;gap:18px;flex-wrap:wrap;font-size:13px;color:var(--mute)}
footer .brand{font-family:var(--font-display);font-weight:600;color:var(--dusk)}
footer a:hover{color:var(--sea)}
</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body data-d-root data-domain="${esc(rec.domain)}">
${NAV}

<section class="d-hero">
  <div class="wrap">
    <nav class="d-crumb" aria-label="面包屑">
      <a href="/zh/">首页</a><span class="sep">/</span>
      <a href="/ai-tools/">AI 工具</a><span class="sep">/</span>
      <a href="/ai-tools/rank/">增长榜</a><span class="sep">/</span>
      <span>${esc(rec.domain)}</span>
    </nav>

    <div class="d-head">
      <div class="d-avatar" aria-hidden="true">${esc(initial)}</div>
      <div class="d-title">
        <h1>${esc(rec.name || rec.domain)}</h1>
        <div class="dom">${esc(rec.domain)}</div>
        ${rec.description ? `<p class="desc">${esc(rec.description)}</p>` : ''}
        <div class="d-tags">
          <span class="d-tag rank">榜内第 ${rec.rank} 名</span>
          <span class="d-tag">${esc(rec.category)}${rec.category_extra ? '／' + esc(rec.category_extra) : ''}</span>
          ${rec.site_type ? `<span class="d-tag">${esc(rec.site_type)}</span>` : ''}
          <span class="d-tag est">快照 ${esc(ctx.snapshot)}</span>
        </div>
      </div>
    </div>

    <div class="d-stats">
      <div class="d-stat"><span>月访问</span><b>${esc(rec.visits_label || fmtVisits(rec.monthly_visits))}</b><small>最近一期</small></div>
      <div class="d-stat ${Number(rec.mom_growth_pct) >= 0 ? 'up' : 'down'}"><span>环比增速</span><b>${esc(fmtGrowth(rec.mom_growth_pct))}</b><small>对比上一期</small></div>
      <div class="d-stat"><span>增长评分</span><b>${rec.growth_score}</b><small>满分 100</small></div>
      <div class="d-stat"><span>榜内位置</span><b>${rec.rank} / ${ctx.total}</b><small>按增速降序</small></div>
    </div>
  </div>
</section>

<section class="d-body">
  <div class="wrap">
    <div class="d-status" data-d-status></div>

    <div class="d-grid">
      <div class="d-main">

        <section class="d-sec">
          <h2>这个站在做什么</h2>
          <div class="d-insight">
      ${buildSummary(rec, ctx)}
          </div>
        </section>

        <section class="d-sec">
          <h2>评分怎么来的</h2>
          <p class="hint">增速与规模各自取对数后加权，权重 65 : 35。取对数是因为这两个量都是长尾分布——线性打分会把"基期过小导致的 9900%"和真实的十倍增长拉成两回事。</p>
          <div class="d-bars">
            ${scoreBar('增速分 ×0.65', gComp, 0.65)}
            ${scoreBar('规模分 ×0.35', vComp, 0.35)}
          </div>
          <p class="hint" style="margin:14px 0 0">合计 ${rec.growth_score} 分。规模分以 20 万月访问为满分线，增速分以 10000% 为满分线。</p>
        </section>

        ${lockBlock()}

        ${marketBlock()}

      </div>

      <aside class="d-side">
        <div class="d-card cta">
          <h3>解锁这个站的完整情报</h3>
          <p>收款信号、转化率、逐月走势、流量结构、国家分布、支付渠道、同分类对比，19 个站全量。</p>
          <a class="d-btn amber" href="/zh/pricing/" data-pro-hidden>看 Pro 方案</a>
          <a class="d-btn" href="/zh/pricing/#order" data-pro-only hidden>管理订阅</a>
          <p class="fine" data-pro-hidden>月付 $19 · 年付 $149</p>
          <p class="fine" data-pro-only hidden>已解锁</p>
        </div>

        <div class="d-card">
          <h3>本期基础数据</h3>
          <div class="d-kv"><span>月访问</span><b class="mono">${esc(rec.visits_label || fmtVisits(rec.monthly_visits))}</b></div>
          <div class="d-kv"><span>环比</span><b class="mono">${esc(fmtGrowth(rec.mom_growth_pct))}</b></div>
          <div class="d-kv"><span>评分</span><b class="mono">${rec.growth_score}</b></div>
          <div class="d-kv"><span>分类</span><b>${esc(rec.category)}</b></div>
          <div class="d-kv"><span>站点类型</span><b>${esc(rec.site_type || '—')}</b></div>
          <div class="d-kv"><span>快照日期</span><b class="mono">${esc(ctx.snapshot)}</b></div>
          <div class="d-kv"><span>数据来源</span><b data-d-src>手工采集</b></div>
        </div>

        <div class="d-card">
          <h3>继续看</h3>
          <div class="d-links">
            <a href="/ai-tools/rank/">完整增长榜（19 个站）</a>
            <a href="/ai-tools/">AI 工具库</a>
            <a href="/zh/pricing/">Pro 方案与定价</a>
            <a href="https://${esc(rec.domain)}" target="_blank" rel="noopener nofollow">访问 ${esc(rec.domain)} ↗</a>
          </div>
        </div>

        <div class="d-card">
          <h3>口径说明</h3>
          <p style="font-size:12.5px;color:#5a6474;line-height:1.7;margin:0">
            月访问为第三方流量估计值，非站点真实后台数据。环比基数过小时百分比会失真，超过 9900% 统一按 9900% 计。
            榜单按增速排序，不代表站点质量或收入高低。
          </p>
        </div>
      </aside>
    </div>
  </div>
</section>

${FOOTER}

<script type="module" src="/assets/pro-gate.mjs"></script>
<script type="module" src="/assets/site-detail-pro.mjs"></script>
</body>
</html>
`;
}

/* ============================================================
   主流程
   ============================================================ */

function main() {
  const args = parseArgs(process.argv);

  const dataPath = resolve(ROOT, args.data);
  if (!existsSync(dataPath)) {
    console.error(`[x] 找不到榜单数据：${dataPath}`);
    console.error('    先跑 node tools/pro/extract-rank.mjs');
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(dataPath, 'utf8'));
  const records = raw.records || [];
  const snapshot = raw.snapshot_date || new Date().toISOString().slice(0, 10);

  if (!records.length) {
    console.error('[x] 榜单数据为空');
    process.exit(1);
  }

  // 市场数据补充（可选）
  let extra = { sites: {} };
  const extraPath = resolve(ROOT, args.extra);
  if (existsSync(extraPath)) {
    try {
      extra = JSON.parse(readFileSync(extraPath, 'utf8'));
    } catch (e) {
      console.warn(`[!] ${args.extra} 解析失败，按无补充数据处理：${e.message}`);
    }
  }
  const extraSites = extra.sites || {};

  const ctx = { snapshot, total: records.length, all: records };

  // 补齐派生字段
  for (const rec of records) {
    rec.growth_score = growthScore(rec.monthly_visits, rec.mom_growth_pct);
    rec.series = deriveSeries(rec.monthly_visits, rec.mom_growth_pct, snapshot);
    rec.market = extraSites[rec.domain] || null;
    // 竞品要在 market 赋值之后算 —— 里面要读 extraSites 拿竞品的收款信号
    rec.competitors = pickCompetitors(rec, records, extraSites);
  }

  /* ---------- HTML ---------- */

  const outRoot = resolve(ROOT, args.outDir);
  let written = 0;

  if (!args.sqlOnly) {
    for (const rec of records) {
      const dir = join(outRoot, rec.domain);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'index.html'), pageHTML(rec, ctx), 'utf8');
      written++;
    }
    console.log(`[ok] 生成 ${written} 个详情页 → ${args.outDir}/{域名}/index.html`);
  }

  /* ---------- SQL ---------- */

  if (!args.htmlOnly) {
    const lines = [];
    lines.push('-- ============================================================');
    lines.push('-- 04-seed-detail.sql  ·  站点详情 + 逐月序列种子');
    lines.push('-- ============================================================');
    lines.push('-- 由 tools/pro/build-detail.mjs 生成，不要手改 —— 重跑会覆盖。');
    lines.push(`-- 快照：${snapshot}   站点数：${records.length}`);
    lines.push('--');
    lines.push('-- 依赖：03-site-detail.sql 已执行。');
    lines.push('-- 幂等：先 delete 当期再 insert，可重复跑。');
    lines.push('-- ============================================================');
    lines.push('');
    lines.push(`delete from public.ai_site_series where domain in (${records.map((r) => sqlStr(r.domain)).join(', ')});`);
    lines.push(`delete from public.ai_site_detail where snapshot_date = ${sqlStr(snapshot)};`);
    lines.push('');
    lines.push('insert into public.ai_site_detail (');
    lines.push('  domain, snapshot_date, name, description, category, site_type, rank,');
    lines.push('  monthly_visits, mom_growth_pct, visits_label, growth_score,');
    lines.push('  revenue_signal, revenue_mom_pct, conversion_pct, revenue_month,');
    lines.push('  payment_provider, checkout_host,');
    lines.push('  traffic_direct_pct, traffic_referral_pct, traffic_search_pct, traffic_social_pct,');
    lines.push('  geo, insight, competitors, data_source, estimated');
    lines.push(') values');

    const rows = records.map((rec) => {
      const m = rec.market || {};
      const tr = m.traffic || {};
      const hasMarket = Object.keys(m).length > 0;
      const hasDerivedSeries = rec.series.some((s) => s.derived);
      // estimated 只在真有推算内容时为 true。
      // 全空的站如果 series 也没派生段，就不该在页面标「含推算值」——
      // 那是把「没采到」说成「估出来的」。
      const estimated = hasMarket
        ? (m.estimated !== undefined ? !!m.estimated : false)
        : hasDerivedSeries;
      const dataSource = m.data_source || (hasDerivedSeries ? 'series_derived' : 'manual');
      const insight = m.insight || null;

      return `  (${[
        sqlStr(rec.domain),
        sqlStr(snapshot),
        sqlStr(rec.name),
        sqlStr(rec.description),
        sqlStr(rec.category),
        sqlStr(rec.site_type),
        sqlNum(rec.rank),
        sqlNum(rec.monthly_visits),
        sqlNum(rec.mom_growth_pct),
        sqlStr(rec.visits_label),
        sqlNum(rec.growth_score),
        sqlNum(m.revenue_signal),
        sqlNum(m.revenue_mom_pct),
        sqlNum(m.conversion_pct),
        sqlStr(m.revenue_month),
        sqlStr(m.payment_provider),
        sqlStr(m.checkout_host),
        sqlNum(tr.direct ?? null),
        sqlNum(tr.referral ?? null),
        sqlNum(tr.search ?? null),
        sqlNum(tr.social ?? null),
        sqlJson(m.geo || null),
        sqlStr(insight),
        sqlJson(rec.competitors),
        sqlStr(dataSource),
        sqlBool(estimated),
      ].join(', ')})`;
    });

    lines.push(rows.join(',\n'));
    lines.push('on conflict (domain) do update set');
    lines.push('  snapshot_date = excluded.snapshot_date,');
    lines.push('  name = excluded.name, description = excluded.description,');
    lines.push('  category = excluded.category, site_type = excluded.site_type, rank = excluded.rank,');
    lines.push('  monthly_visits = excluded.monthly_visits, mom_growth_pct = excluded.mom_growth_pct,');
    lines.push('  visits_label = excluded.visits_label, growth_score = excluded.growth_score,');
    lines.push('  revenue_signal = excluded.revenue_signal, revenue_mom_pct = excluded.revenue_mom_pct,');
    lines.push('  conversion_pct = excluded.conversion_pct, revenue_month = excluded.revenue_month,');
    lines.push('  payment_provider = excluded.payment_provider, checkout_host = excluded.checkout_host,');
    lines.push('  traffic_direct_pct = excluded.traffic_direct_pct,');
    lines.push('  traffic_referral_pct = excluded.traffic_referral_pct,');
    lines.push('  traffic_search_pct = excluded.traffic_search_pct,');
    lines.push('  traffic_social_pct = excluded.traffic_social_pct,');
    lines.push('  geo = excluded.geo, insight = excluded.insight, competitors = excluded.competitors,');
    lines.push('  data_source = excluded.data_source, estimated = excluded.estimated,');
    lines.push('  updated_at = now();');
    lines.push('');

    // 逐月序列
    lines.push('-- 逐月序列（derived=true 表示按环比反推，非实测）');
    lines.push('insert into public.ai_site_series (domain, month, visits, revenue_signal, derived) values');
    const seriesRows = [];
    for (const rec of records) {
      for (const p of rec.series) {
        // 收款信号只在当前月有值（detail 里给的月峰值），历史月留空
        const rev = p.derived ? null : (rec.market?.revenue_signal ?? null);
        seriesRows.push(`  (${sqlStr(rec.domain)}, ${sqlStr(p.month)}, ${sqlNum(p.visits)}, ${sqlNum(rev)}, ${sqlBool(p.derived)})`);
      }
    }
    lines.push(seriesRows.join(',\n'));
    lines.push('on conflict (domain, month) do update set');
    lines.push('  visits = excluded.visits, revenue_signal = excluded.revenue_signal, derived = excluded.derived;');
    lines.push('');
    lines.push('-- 校验：');
    lines.push(`--   select count(*) from public.ai_site_detail;   -- 期望 ${records.length}`);
    lines.push(`--   select count(*) from public.ai_site_series;   -- 期望 ${seriesRows.length}`);
    lines.push('--   匿名调 site_detail() 应拿到 market = null');

    const sqlPath = resolve(ROOT, args.sql);
    mkdirSync(dirname(sqlPath), { recursive: true });
    writeFileSync(sqlPath, lines.join('\n') + '\n', 'utf8');
    console.log(`[ok] 种子 SQL → ${args.sql}  (${records.length} 行详情 / ${seriesRows.length} 行序列)`);
  }

  /* ---------- 摘要 ---------- */

  const withMarket = records.filter((r) => r.market).length;
  const avgSeries = (records.reduce((a, r) => a + r.series.length, 0) / records.length).toFixed(1);
  console.log('');
  console.log('统计：');
  console.log(`  有市场数据补充的站点：${withMarket} / ${records.length}`);
  console.log(`  平均走势点数：${avgSeries}（反推到月访问 < ${SERIES_MIN_VISITS} 停止）`);
  console.log(`  评分区间：${Math.min(...records.map((r) => r.growth_score))} – ${Math.max(...records.map((r) => r.growth_score))}`);
  if (withMarket === 0) {
    console.log('');
    console.log('提示：没有 data/ai-site-detail.json，Pro 区只有走势/竞品/评分三块有内容。');
    console.log('      要补收款信号等字段，复制 data/ai-site-detail.example.json 填好字段即可。');
  }
}

main();
