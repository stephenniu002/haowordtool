#!/usr/bin/env node
/**
 * extract-rank.mjs
 * 从 ai-tools/rank/index.html 的静态表格里抽出榜单数据，输出结构化 JSON。
 *
 * 为什么从 HTML 抽而不是另外维护一份数据文件：
 * 榜单页是现有唯一的手工维护入口，再引入第二份数据源必然漂移。抽一次生成
 * Supabase 种子，之后新一期榜单由新的 HTML 覆盖生成即可。
 *
 * 用法:
 *   node tools/pro/extract-rank.mjs                       # 输出到 data/ai-growth-index.json
 *   node tools/pro/extract-rank.mjs --src x.html --out y.json
 *   node tools/pro/extract-rank.mjs --sql sql/02-seed.sql  # 同时生成入库 SQL
 *
 * 复杂度: O(n)，n 为表格行数（当前 19）。
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/* ---------- 参数 ---------- */

function parseArgs(argv) {
  const out = { src: 'ai-tools/rank/index.html', out: 'data/ai-growth-index.json', sql: null, snapshot: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--src') out.src = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--sql') out.sql = argv[++i];
    else if (a === '--snapshot') out.snapshot = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log('用法: node tools/pro/extract-rank.mjs [--src <html>] [--out <json>] [--sql <sql>] [--snapshot YYYY-MM-DD]');
      process.exit(0);
    }
  }
  return out;
}

/* ---------- 数值归一 ---------- */

// "3.7K" → 3700, "113.3K" → 113300, "1.2M" → 1200000, "—" → null
function expandVisits(text) {
  const t = (text || '').trim();
  if (!t || t === '—' || t === '-') return null;
  const m = t.match(/^([\d.]+)\s*([KkMm]?)$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!isFinite(n)) return null;
  const unit = (m[2] || '').toUpperCase();
  const mult = unit === 'K' ? 1e3 : unit === 'M' ? 1e6 : 1;
  return Math.round(n * mult);
}

// "+1243%" → 1243 ; "—" → null
function parseGrowth(text) {
  const t = (text || '').trim();
  if (!t || t === '—') return null;
  const m = t.match(/^([+-]?[\d.]+)\s*%$/);
  return m ? parseFloat(m[1]) : null;
}

// 转义 SQL 单引号
function sqlStr(s) {
  if (s === null || s === undefined) return 'null';
  return `'${String(s).replace(/'/g, "''")}'`;
}

function sqlNum(n) {
  return n === null || n === undefined || !isFinite(n) ? 'null' : String(n);
}

/* ---------- 解析 ---------- */

function extractRows(html) {
  // 只取 <tbody id="tb"> 到 </tbody> 之间的行，避免抓到页面其他表格
  const body = html.match(/<tbody[^>]*id="tb"[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!body) throw new Error('未找到 <tbody id="tb">，页面结构可能已变');

  const rows = [];
  const trRe = /<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi;
  let m;

  while ((m = trRe.exec(body[1])) !== null) {
    const attrs = m[1];
    const inner = m[2];
    const catAttr = (attrs.match(/data-cat="([^"]*)"/) || [])[1] || null;

    const cells = [...inner.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]);
    if (cells.length < 6) continue;

    const text = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

    const rank = parseInt(text(cells[0]), 10);
    if (!isFinite(rank)) continue;

    const domain = (cells[1].match(/class="dom"[^>]*>([^<]+)</) || [])[1];
    const name = (cells[1].match(/class="dname"[^>]*>([^<]*)</) || [])[1];
    const desc = (cells[1].match(/class="desc"[^>]*>([^<]*)</) || [])[1];

    // 分类单元格可能是 "图像生成/视频制作"，拆成主分类 + 副分类
    const catFull = text(cells[2]);
    const catParts = catFull.split('/').map((s) => s.trim()).filter(Boolean);

    rows.push({
      rank,
      domain: (domain || '').trim(),
      name: (name || '').trim() || null,
      description: (desc || '').trim() || null,
      category: catParts[0] || catAttr || null,
      category_extra: catParts.length > 1 ? catParts.slice(1).join('/') : null,
      visits_label: text(cells[3]),
      monthly_visits: expandVisits(text(cells[3])),
      mom_growth_pct: parseGrowth(text(cells[4])),
      site_type: text(cells[5]) === '—' ? null : text(cells[5]),
    });
  }

  if (!rows.length) throw new Error('表格解析出 0 行');
  return rows;
}

/* ---------- 派生统计 ---------- */

function buildSummary(rows) {
  const withGrowth = rows.filter((r) => r.mom_growth_pct !== null);
  const withVisits = rows.filter((r) => r.monthly_visits !== null);

  const byCat = {};
  for (const r of rows) {
    const k = r.category || '未分类';
    byCat[k] = byCat[k] || { count: 0, total_visits: 0, growth: [] };
    byCat[k].count++;
    if (r.monthly_visits) byCat[k].total_visits += r.monthly_visits;
    if (r.mom_growth_pct !== null && r.mom_growth_pct < 9900) byCat[k].growth.push(r.mom_growth_pct);
  }
  const categories = Object.entries(byCat)
    .map(([category, v]) => ({
      category,
      count: v.count,
      total_visits: v.total_visits,
      avg_growth_ex_capped: v.growth.length
        ? Math.round((v.growth.reduce((a, b) => a + b, 0) / v.growth.length) * 10) / 10
        : null,
    }))
    .sort((a, b) => b.count - a.count || b.total_visits - a.total_visits);

  const sortedGrowth = withGrowth.map((r) => r.mom_growth_pct).sort((a, b) => a - b);
  const median = sortedGrowth.length
    ? sortedGrowth[Math.floor(sortedGrowth.length / 2)]
    : null;

  return {
    total_sites: rows.length,
    total_visits: withVisits.reduce((a, r) => a + r.monthly_visits, 0),
    median_growth_pct: median,
    max_visits: withVisits.reduce((a, r) => Math.max(a, r.monthly_visits), 0),
    categories,
  };
}

/* ---------- 主流程 ---------- */

function main() {
  const args = parseArgs(process.argv);
  const srcPath = resolve(ROOT, args.src);
  const outPath = resolve(ROOT, args.out);
  const html = readFileSync(srcPath, 'utf8');

  const rows = extractRows(html);
  const summary = buildSummary(rows);
  const snapshot = args.snapshot || new Date().toISOString().slice(0, 10);

  // 免费层：前 10 行给完整指标（钩子），后 9 行只给域名与简介。
  // FREE_ROWS 是唯一的开关，改这一个数就能调整漏斗宽度。
  const FREE_ROWS = 10;
  const records = rows.map((r) => ({ ...r, snapshot_date: snapshot, is_free: r.rank <= FREE_ROWS }));

  const payload = {
    snapshot_date: snapshot,
    generated_at: new Date().toISOString(),
    source: args.src,
    free_rows: FREE_ROWS,
    summary,
    records,
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`[ok] ${records.length} 行 → ${args.out}`);
  console.log(`     免费 ${records.filter((r) => r.is_free).length} 行 / 付费 ${records.filter((r) => !r.is_free).length} 行`);
  console.log(`     站点总数 ${summary.total_sites} · 总月访问 ${summary.total_visits.toLocaleString()} · 增速中位数 ${summary.median_growth_pct}%`);

  if (args.sql) {
    const sqlPath = resolve(ROOT, args.sql);
    const lines = [];
    lines.push('-- 由 tools/pro/extract-rank.mjs 生成，勿手改');
    lines.push(`-- snapshot ${snapshot} · ${records.length} 行`);
    lines.push('begin;');
    lines.push(`delete from public.ai_growth_index where snapshot_date = date '${snapshot}';`);
    lines.push('insert into public.ai_growth_index');
    lines.push('  (snapshot_date, rank, domain, name, description, category, category_extra, monthly_visits, mom_growth_pct, visits_label, site_type, is_free)');
    lines.push('values');
    const vals = records.map((r) =>
      '  (' +
      [
        `date ${sqlStr(r.snapshot_date)}`,
        sqlNum(r.rank),
        sqlStr(r.domain),
        sqlStr(r.name),
        sqlStr(r.description),
        sqlStr(r.category),
        sqlStr(r.category_extra),
        sqlNum(r.monthly_visits),
        sqlNum(r.mom_growth_pct),
        sqlStr(r.visits_label),
        sqlStr(r.site_type),
        r.is_free ? 'true' : 'false',
      ].join(', ') +
      ')'
    );
    lines.push(vals.join(',\n') + ';');
    lines.push('commit;');
    mkdirSync(dirname(sqlPath), { recursive: true });
    writeFileSync(sqlPath, lines.join('\n') + '\n', 'utf8');
    console.log(`[ok] SQL → ${args.sql}`);
  }
}

main();
