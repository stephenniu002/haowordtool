#!/usr/bin/env node
/**
 * build-redirect-map.mjs —— 结构收敛映射表 → 301 规则
 * ---------------------------------------------------------------
 * 目标结构（用户拍板）：
 *
 *   /                      首页：16 个工具，首屏即工具，不掺别的
 *   /tools/                工具索引 + 工具页
 *   /ai-tools/             唯一的辅助栏目：AI 工具情报
 *     ├ rank/              增长榜单（原 /ai-rank/、/ai/ai-rank、pro/boards/keywords/backlinks）
 *     ├ guides/            原创指南（AI 动画 6 篇 + 一人公司/工作流/可见性）
 *     ├ signals/           每日信号（daily-*、trends、models）
 *     └ cases/             案例拆解（油画面、孙宇晨 15 点、基建泡沫、AI 搞钱案例）
 *   /shop/                 唯一的商业入口
 *     ├ services/          定制服务（网站/设计/视频/AI Studio/代言人）
 *     ├ digital/           数字商品（premium-digital 全套）
 *     ├ courses/           课程（雅思等）
 *     ├ affiliate/         联盟（Fiverr / Amazon / 榜单）
 *     └ reviews/           实物测评（加热披肩 4 篇、服装）
 *   /guides/               Word 工具配套长文：不占导航，只从工具页内链进入
 *   /(about|privacy|terms|contact|faq)  站点信息
 *
 * 为什么必须走 Cloudflare 而不是仓库内配置：
 *   haowordtool.com 托管在 GitHub Pages（CNAME + 无 netlify/_redirects），
 *   静态托管不支持 301，只能靠 meta refresh，那本身是门页，反而加重低价值判定。
 *   域名在 Cloudflare，用 Redirect Rules / Bulk Redirects 发 301 是唯一干净路径。
 *
 * 用法：
 *   node scripts/build-redirect-map.mjs                # 输出映射统计 + 校验目标页
 *   node scripts/build-redirect-map.mjs --write        # 写 docs/STRUCTURE.md / redirects.csv / redirects.nginx.conf
 *   node scripts/build-redirect-map.mjs --md           # 只打印 Markdown 映射表
 *   node scripts/build-redirect-map.mjs --check        # 只校验：目标目录规划里缺哪些页面
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = 'https://haowordtool.com';

/* ============================================================
   映射表
   from = 现路径，to = 目标路径，note = 归位理由（评审用）
   ============================================================ */
const MAP = [
  /* ---------- AI 情报 → /ai-tools/rank/（榜单与信号） ---------- */
  ['/ai-rank/', '/ai-tools/rank/', '新榜单页，直接成为栏目主入口'],
  ['/ai/ai-rank.html', '/ai-tools/rank/', '旧榜单页并入'],
  ['/ai/ai-rank-en.html', '/ai-tools/rank/en/', '英文榜单独立'],
  ['/ai/pro.html', '/ai-tools/rank/pro.html', '榜单进阶视图'],
  ['/ai/pro-en.html', '/ai-tools/rank/en/pro.html', ''],
  ['/ai/boards.html', '/ai-tools/rank/boards.html', '榜单看板'],
  ['/ai/boards-en.html', '/ai-tools/rank/en/boards.html', ''],
  ['/ai/keywords.html', '/ai-tools/rank/keywords.html', '关键词维度的榜单'],
  ['/ai/keywords-en.html', '/ai-tools/rank/en/keywords.html', ''],
  ['/ai/backlinks.html', '/ai-tools/rank/backlinks.html', '外链维度的榜单'],
  ['/ai/backlinks-zh.html', '/ai-tools/rank/backlinks-zh.html', ''],

  /* ---------- AI 情报 → /ai-tools/signals/（每日信号） ---------- */
  ['/ai/daily-2026-10-17.html', '/ai-tools/signals/daily-2026-10-17.html', '每日信号'],
  ['/ai/daily-2026-10-17-en.html', '/ai-tools/signals/en/daily-2026-10-17.html', ''],
  ['/ai/daily-2026-10-18.html', '/ai-tools/signals/daily-2026-10-18.html', ''],
  ['/ai/trends.html', '/ai-tools/signals/trends.html', '趋势'],
  ['/ai/trends-en.html', '/ai-tools/signals/en/trends.html', ''],
  ['/ai/models.html', '/ai-tools/signals/models.html', '模型动态'],
  ['/ai/models-en.html', '/ai-tools/signals/en/models.html', ''],
  ['/ai/income.html', '/ai-tools/signals/income.html', '变现信号'],
  ['/ai/blog.html', '/ai-tools/signals/', '旧 blog 索引并入 signals 首页'],

  /* ---------- AI 情报 → /ai-tools/guides/（原创指南） ---------- */
  ['/ai-one-person-company-guide.html', '/ai-tools/guides/one-person-company.html', '一人公司指南'],
  ['/ai-workflow-systems.html', '/ai-tools/guides/workflow-systems.html', '工作流体系'],
  ['/ai-search-visibility.html', '/ai-tools/guides/search-visibility.html', 'AI 搜索可见性'],
  ['/ai-workspace.html', '/ai-tools/guides/ai-workspace.html', '工作台搭建'],
  ['/ai-companion.html', '/ai-tools/guides/ai-companion.html', 'AI 陪伴类工具观察'],
  ['/ai-glasses.html', '/ai-tools/guides/ai-glasses.html', 'AI 眼镜品类观察'],
  ['/ai-compute-export.html', '/ai-tools/guides/compute-export.html', '算力出海'],
  ['/ai-content-agency.html', '/ai-tools/guides/content-agency.html', '内容代运营模式'],
  ['/guides/ai-animation-tools-beginners-guide.html', '/ai-tools/guides/animation-tools.html', 'AI 动画入门'],
  ['/guides/ai-animation-shot-list-guide.html', '/ai-tools/guides/animation-shot-list.html', ''],
  ['/guides/ai-animated-short-story-structure.html', '/ai-tools/guides/animated-story-structure.html', ''],
  ['/guides/make-first-ai-animated-short-7-days.html', '/ai-tools/guides/first-animated-short-7-days.html', ''],
  ['/guides/why-ai-animation-is-exploding.html', '/ai-tools/guides/why-animation-exploding.html', ''],
  ['/guides/write-ai-animation-scripts-chatgpt.html', '/ai-tools/guides/animation-scripts-chatgpt.html', ''],

  /* ---------- AI 情报 → /ai-tools/cases/（案例拆解） ---------- */
  ['/ai/oil-painting-case.html', '/ai-tools/cases/oil-painting.html', '油画面案例'],
  ['/ai/oil-painting-case-en.html', '/ai-tools/cases/en/oil-painting.html', ''],
  ['/ai/sunxue-15-points.html', '/ai-tools/cases/sunxue-15-points.html', '孙宇晨 15 点拆解'],
  ['/ai/infra-bubble-ai.html', '/ai-tools/cases/infra-bubble.html', 'AI 基建泡沫'],
  ['/ai/infra-bubble-ai-en.html', '/ai-tools/cases/en/infra-bubble.html', ''],
  ['/ai-money-cases.html', '/ai-tools/cases/money-cases.html', 'AI 搞钱案例集'],
  ['/ai-money-cases-zh.html', '/ai-tools/cases/money-cases-zh.html', ''],
  ['/ai/social-media-extract.html', '/ai-tools/cases/social-extract.html', '社媒内容提取（薄页，需加厚）'],
  ['/ai/index.html', '/ai-tools/', '旧 /ai/ 索引 → 栏目首页'],
  ['/ai-nav.html', '/ai-tools/', 'AI 导航页并入栏目首页'],
  ['/ai-nav-en.html', '/ai-tools/en/', ''],

  /* ---------- 商业 → /shop/services/ ---------- */
  ['/services/', '/shop/services/', '服务总览'],
  ['/services/website-design.html', '/shop/services/website-design.html', ''],
  ['/services/logo-design.html', '/shop/services/logo-design.html', ''],
  ['/services/video-editing.html', '/shop/services/video-editing.html', ''],
  ['/services/disclosure.html', '/shop/services/disclosure.html', '服务披露'],
  ['/custom-web-design.html', '/shop/services/custom-web-design.html', ''],
  ['/app-builder.html', '/shop/services/app-builder.html', ''],
  ['/video-studio.html', '/shop/services/video-studio.html', ''],
  ['/ai-studio.html', '/shop/services/ai-studio.html', ''],
  ['/ai-spokesperson.html', '/shop/services/ai-spokesperson.html', ''],
  ['/social-publisher.html', '/shop/services/social-publisher.html', ''],
  ['/media-downloader.html', '/shop/services/media-downloader.html', ''],
  ['/publisher.html', '/shop/services/publisher.html', ''],
  ['/landing-pages.html', '/shop/services/landing-pages.html', ''],
  ['/templates.html', '/shop/services/templates.html', ''],
  ['/skill-bank.html', '/shop/services/skill-bank.html', ''],
  // 关键一步：原 /ai-tools.html 腾位置给栏目，内容归 services
  ['/ai-tools.html', '/shop/services/ai-studio.html', '命名冲突：此页实为 AI Studio 销售页，让出 /ai-tools/'],

  /* ---------- 商业 → /shop/digital/ ---------- */
  ['/premium-digital-products.html', '/shop/digital/', '数字商品总览'],
  ['/premium-digital/annual-budget.html', '/shop/digital/annual-budget.html', ''],
  ['/premium-digital/dimple-dumpling.html', '/shop/digital/dimple-dumpling.html', ''],
  ['/premium-digital/finance-dashboard.html', '/shop/digital/finance-dashboard.html', ''],
  ['/premium-digital/ghost-granny-square.html', '/shop/digital/ghost-granny-square.html', ''],
  ['/premium-digital/momo-shelf-ghost.html', '/shop/digital/momo-shelf-ghost.html', ''],
  ['/premium-digital/wedding-planner.html', '/shop/digital/wedding-planner.html', ''],
  ['/premium-digital/willow-market-bag.html', '/shop/digital/willow-market-bag.html', ''],

  /* ---------- 商业 → /shop/courses/ ---------- */
  ['/courses.html', '/shop/courses/', '课程总览'],
  ['/ielts-course.html', '/shop/courses/ielts.html', ''],

  /* ---------- 商业 → /shop/affiliate/ ---------- */
  ['/affiliate-products.html', '/shop/affiliate/products.html', '联盟页：需砍到 10-20 个并加真实观点'],
  ['/affiliate-marketing.html', '/shop/affiliate/marketing.html', '薄落地页，需重写'],
  ['/affiliate-dashboard.html', '/shop/affiliate/dashboard.html', ''],
  ['/fiverr-affiliate-program.html', '/shop/affiliate/fiverr-program.html', ''],
  ['/fiverr-ai-services.html', '/shop/affiliate/fiverr-ai-services.html', ''],
  ['/fiverr-services.html', '/shop/affiliate/fiverr-services.html', ''],
  ['/top-100-products-2026.html', '/shop/affiliate/top-100-2026.html', '模板化，需砍量加观点'],
  ['/reviews.html', '/shop/affiliate/reviews.html', '最高风险：编造评分，必须重写或降级为选购指南'],
  ['/links.html', '/shop/affiliate/links.html', ''],

  /* ---------- 商业 → /shop/reviews/（实物测评） ---------- */
  ['/ai/best-heated-shawls-winter-2026.html', '/shop/reviews/heated-shawls-2026.html', '实物测评，不属于 AI 情报'],
  ['/ai/heated-shawl-power-bank-hours.html', '/shop/reviews/heated-shawl-power-bank.html', ''],
  ['/ai/heated-shawl-price-breakdown-40-vs-80.html', '/shop/reviews/heated-shawl-price.html', ''],
  ['/ai/heated-shawl-usb-power-pitfall.html', '/shop/reviews/heated-shawl-usb.html', ''],
  ['/outfits.html', '/shop/reviews/outfits.html', ''],

  /* ---------- 商业功能页（保留路径，加 noindex，不做 301） ---------- */
  // checkout / order / account / pricing / delivery / start / how-it-works
  // 这些是流程页，挪路径会打断正在进行中的订单与已发出的链接，原地保留。

  /* ---------- 站点信息（原地不动） ---------- */
  // about privacy terms contact faq editorial-standards google-profile-help*
  // privacy/ about/ contact/ 三个目录是其目录版，一并保留。

  /* ---------- 待定（本次不迁，需人工判断） ---------- */
  // suanli-chuhai.html       —— 与 ai-compute-export 主题重叠，建议合并后再迁
  // local-ai.html            —— 待判定是工具还是服务
  // multi-platform-publishing-checklist.html —— 可并入 /ai-tools/guides/
  // share.html blog.html     —— 待定
];

/* ============================================================
   校验
   ============================================================ */
function exists(p) {
  const abs = path.join(ROOT, p.replace(/^\//, ''));
  if (fs.existsSync(abs)) return true;
  // /ai-rank/ 形式
  if (p.endsWith('/')) return fs.existsSync(path.join(ROOT, p.replace(/^\//, ''), 'index.html'));
  return false;
}

const rows = MAP.map(([from, to, note]) => ({
  from,
  to,
  note,
  fromExists: exists(from),
}));

const missingSource = rows.filter((r) => !r.fromExists);
const byTarget = {};
for (const r of rows) {
  const top = r.to.split('/').slice(0, 3).join('/');
  byTarget[top] = (byTarget[top] || 0) + 1;
}

/* ============================================================
   输出
   ============================================================ */
function mdStructure() {
  const L = [];
  L.push('# 站点结构收敛方案');
  L.push('');
  L.push(`> 生成：${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`);
  L.push('> 由 `scripts/build-redirect-map.mjs` 生成，改映射请改脚本里的 MAP 表。');
  L.push('');
  L.push('## 目标结构');
  L.push('');
  L.push('```');
  L.push('/                        首页：16 个工具，首屏即工具');
  L.push('/tools/                  工具索引 + 工具页');
  L.push('/ai-tools/               唯一辅助栏目：AI 工具情报');
  L.push('  ├ rank/                增长榜单');
  L.push('  ├ guides/              原创指南');
  L.push('  ├ signals/             每日信号');
  L.push('  └ cases/               案例拆解');
  L.push('/shop/                   唯一商业入口');
  L.push('  ├ services/            定制服务');
  L.push('  ├ digital/             数字商品');
  L.push('  ├ courses/             课程');
  L.push('  ├ affiliate/           联盟');
  L.push('  └ reviews/             实物测评');
  L.push('/guides/                 Word 工具配套长文（不占导航，工具页内链进入）');
  L.push('/about /privacy /terms /contact /faq   站点信息');
  L.push('```');
  L.push('');
  L.push('## 迁移统计');
  L.push('');
  L.push('| 目标区块 | 条数 |');
  L.push('|---|---|');
  for (const [k, v] of Object.entries(byTarget).sort((a, b) => b[1] - a[1])) {
    L.push(`| \`${k}\` | ${v} |`);
  }
  L.push('');
  L.push(`合计 **${rows.length}** 条规则，源路径缺失 ${missingSource.length} 条。`);
  L.push('');
  L.push('## 完整映射');
  L.push('');
  L.push('| 现路径 | 目标路径 | 说明 | 源存在 |');
  L.push('|---|---|---|---|');
  for (const r of rows) {
    L.push(`| \`${r.from}\` | \`${r.to}\` | ${r.note || ''} | ${r.fromExists ? '✓' : '✗ 缺失'} |`);
  }
  L.push('');
  L.push('## 执行顺序（关键）');
  L.push('');
  L.push('301 必须先于文件移动生效，否则旧 URL 会 404，抓取预算和已有排名一起丢掉。');
  L.push('');
  L.push('1. 在 Cloudflare 上传 `docs/redirects.csv`（Bulk Redirects），确认规则已激活');
  L.push('2. 用 curl 抽验 5 条旧 URL，确认返回 301 而不是 404');
  L.push('3. 建新目录、移动文件（`scripts/apply-structure.mjs`）');
  L.push('4. 改站内链接、更新 sitemap、提交 Search Console 改版');
  L.push('5. 7 天后复查 404 报告');
  L.push('');
  L.push('## 不迁的页面');
  L.push('');
  L.push('- `checkout` `order` `account` `pricing` `delivery` `start` `how-it-works`：流程页，挪路径会打断进行中的订单和已发出的邮件链接，原地保留并加 noindex');
  L.push('- `about` `privacy` `terms` `contact` `faq` `editorial-standards` `google-profile-help*`：站点信息，原路径就是最佳路径');
  L.push('- `/guides/` 下 22 篇拼字类长文：属于 Word 工具的内容集群，不是 AI 情报，留在原地、只从工具页内链');
  return L.join('\n');
}

/** Cloudflare Bulk Redirects CSV */
function cfCsv() {
  const head = 'source_url,target_url,status_code,preserve_query_string,include_subdomains,subpath_matching,preserve_path_suffix';
  const lines = rows.map((r) => `${SITE}${r.from},${SITE}${r.to},301,true,false,false,false`);
  return [head, ...lines].join('\n') + '\n';
}

/** nginx（换托管时备用） */
function nginxConf() {
  return rows
    .map((r) => {
      const from = r.from.endsWith('/') ? r.from : r.from;
      return `location = ${from} { return 301 ${r.to}; }`;
    })
    .join('\n') + '\n';
}

/* ============================================================
   main
   ============================================================ */
const args = process.argv.slice(2);
const write = args.includes('--write');
const md = args.includes('--md');
const check = args.includes('--check');

if (md) {
  console.log(mdStructure());
  process.exit(0);
}

if (check) {
  console.log(`规则 ${rows.length} 条，源路径缺失 ${missingSource.length} 条`);
  for (const r of missingSource) console.log(`  ✗ ${r.from}（目标 ${r.to}）`);
  process.exit(missingSource.length ? 1 : 0);
}

if (write) {
  const docs = path.join(ROOT, 'docs');
  fs.mkdirSync(docs, { recursive: true });
  fs.writeFileSync(path.join(docs, 'STRUCTURE.md'), mdStructure());
  fs.writeFileSync(path.join(docs, 'redirects.csv'), cfCsv());
  fs.writeFileSync(path.join(docs, 'redirects.nginx.conf'), nginxConf());
  console.log('已写入 docs/STRUCTURE.md / docs/redirects.csv / docs/redirects.nginx.conf');
}

console.log('');
console.log(`映射规则 ${rows.length} 条，源路径缺失 ${missingSource.length} 条`);
console.log('');
const pad = (s, n) => String(s).padEnd(n);
console.log('目标区块分布：');
for (const [k, v] of Object.entries(byTarget).sort((a, b) => b[1] - a[1])) {
  const bar = '█'.repeat(Math.round(v / 2));
  console.log(`  ${pad(k, 22)} ${pad(v, 4)} ${bar}`);
}
if (missingSource.length) {
  console.log('');
  console.log('源路径不存在（规则会空转，需核对）：');
  for (const r of missingSource) console.log(`  ✗ ${r.from}`);
}
