#!/usr/bin/env node
/**
 * apply-noindex.mjs —— 按 i18n-gate 的结论批量开关 noindex
 * ---------------------------------------------------------------
 * 分两步，默认只做第一步（降风险，无争议）：
 *
 *   1. 回加（默认）：gate=FAIL 且当前未 noindex → 加 noindex,follow
 *      为什么：已放开但不达标的页面正在被 Google 抓，直接拉低整站质量分。
 *      这一步不改变任何页面的「可被收录」期望，只是把口子收回来。
 *
 *   2. 放开（需显式 --open）：gate=PASS 且当前 noindex → 移除 noindex
 *      为什么单独一步：这是外部可见动作，Google 会实际开始收录。
 *      收录后再撤回要等重新抓取，代价比加上去高一个量级。
 *
 * 前置：必须先跑 node scripts/i18n-gate.mjs --out docs/i18n-gate
 *
 * 用法：
 *   node scripts/apply-noindex.mjs                       # dry-run，列出回加清单
 *   node scripts/apply-noindex.mjs --write                # 执行回加
 *   node scripts/apply-noindex.mjs --open                 # 连同放开一起预览
 *   node scripts/apply-noindex.mjs --open --write          # 回加 + 放开都执行
 *   node scripts/apply-noindex.mjs --locale de --write     # 只处理一个语种
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const GATE = path.join(ROOT, 'docs', 'i18n-gate.json');
const BACKUP_DIR = path.join(ROOT, '.head-backup');

if (!fs.existsSync(GATE)) {
  console.error('缺少 docs/i18n-gate.json，先跑：node scripts/i18n-gate.mjs --out docs/i18n-gate');
  process.exit(2);
}

const args = process.argv.slice(2);
const write = args.includes('--write');
const allowOpen = args.includes('--open');
const locIdx = args.indexOf('--locale');
const onlyLocale = locIdx > -1 ? args[locIdx + 1] : null;

const { results } = JSON.parse(fs.readFileSync(GATE, 'utf8'));
const pool = onlyLocale ? results.filter((r) => r.locale === onlyLocale) : results;

const ROBOTS_RE = /<meta\b[^>]*name=["']robots["'][^>]*>/i;

/** 把 robots meta 设成指定值；没有就插在 canonical 之后或 </head> 之前 */
function setRobots(html, value) {
  if (ROBOTS_RE.test(html)) {
    return html.replace(ROBOTS_RE, (m) => {
      if (/content=["'][^"']*["']/i.test(m)) {
        return m.replace(/content=["'][^"']*["']/i, `content="${value}"`);
      }
      return m.replace(/>$/, ` content="${value}">`);
    });
  }
  const tag = `<meta name="robots" content="${value}">`;
  const canon = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>\s*\r?\n?/i);
  if (canon) {
    const i = canon.index + canon[0].length;
    return html.slice(0, i) + tag + '\n' + html.slice(i);
  }
  return html.replace(/<\/head>/i, tag + '\n</head>');
}

/** 移除 noindex，保留 follow 等其它指令；没有其它指令就整条删掉 */
function clearNoindex(html) {
  const m = html.match(ROBOTS_RE);
  if (!m) return html;
  const content = (m[0].match(/content=["']([^"']*)["']/i) || [])[1] || '';
  const rest = content
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !/^noindex$/i.test(s) && !/^none$/i.test(s));

  if (!rest.length) {
    return html.replace(new RegExp(m[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\r?\\n?', 'i'), '');
  }
  return html.replace(ROBOTS_RE, m[0].replace(/content=["'][^"']*["']/i, `content="${rest.join(',')}"`));
}

const plan = { add: [], remove: [] };
for (const r of pool) {
  if (r.verdict === 'FAIL' && !r.noindex) plan.add.push(r);
  if (r.verdict === 'PASS' && r.noindex) plan.remove.push(r);
}

function show(label, list, note) {
  if (!list.length) return;
  console.log(`\n${label}（${list.length} 页）${note ? ' — ' + note : ''}`);
  for (const r of list) {
    console.log(`  ${r.rel.padEnd(48)} ${r.type.padEnd(8)} ${r.reasons.length ? '[' + r.reasons.join(', ') + ']' : ''}`);
  }
}

show('① 回加 noindex', plan.add, '已放开但不达标，收口子');
if (allowOpen) show('② 放开 noindex', plan.remove, '已达标，可被收录');

let nAdd = 0;
let nRemove = 0;

if (write) {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  for (const r of plan.add) {
    const file = path.join(ROOT, r.rel);
    if (!fs.existsSync(file)) continue;
    const before = fs.readFileSync(file, 'utf8');
    const after = setRobots(before, 'noindex,follow');
    if (after === before) continue;
    const bpath = path.join(BACKUP_DIR, r.rel);
    fs.mkdirSync(path.dirname(bpath), { recursive: true });
    fs.writeFileSync(bpath, before, 'utf8');
    const tmp = file + '.tmp-ni';
    fs.writeFileSync(tmp, after, 'utf8');
    fs.renameSync(tmp, file);
    nAdd++;
  }

  if (allowOpen) {
    for (const r of plan.remove) {
      const file = path.join(ROOT, r.rel);
      if (!fs.existsSync(file)) continue;
      const before = fs.readFileSync(file, 'utf8');
      const after = clearNoindex(before);
      if (after === before) continue;
      const bpath = path.join(BACKUP_DIR, r.rel);
      fs.mkdirSync(path.dirname(bpath), { recursive: true });
      fs.writeFileSync(bpath, before, 'utf8');
      const tmp = file + '.tmp-ni';
      fs.writeFileSync(tmp, after, 'utf8');
      fs.renameSync(tmp, file);
      nRemove++;
    }
  }
}

console.log('');
console.log('─'.repeat(60));
if (write) {
  console.log(`已回加 noindex：${nAdd} 页`);
  if (allowOpen) console.log(`已放开：${nRemove} 页`);
  else console.log('放开未执行（加 --open 才做）');
  console.log('复验：node scripts/i18n-gate.mjs');
} else {
  console.log('dry-run，未改动文件。加 --write 落盘。');
  if (!allowOpen && plan.remove.length) {
    console.log(`另有 ${plan.remove.length} 页已达标可放开，加 --open 预览。`);
  }
}
