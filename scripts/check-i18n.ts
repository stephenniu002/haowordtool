#!/usr/bin/env tsx
/**
 * i18n Key 完整性检查
 * ------------------------------------------------------------
 * 功能：
 *   1. 递归对比所有语言包，找出缺失的 key
 *   2. 找出多余的 key（基准语言没有的）
 *   3. 找出空字符串值
 *   4. 找出同一 key 值相同的情况（可能是忘了翻译）
 *   5. 输出可读报告 + 支持 CI 模式
 *
 * 用法：
 *   node scripts/check-i18n.mjs            # 人类可读输出
 *   node scripts/check-i18n.mjs --ci       # CI 模式（退出码 1 表示失败）
 *   node scripts/check-i18n.mjs --fix      # 自动补齐缺失的 key（从 en 复制）
 *   node scripts/check-i18n.mjs --json     # 输出 JSON 格式（给其他工具用）
 */

import fs from 'node:fs';
import path from 'node:path';

/* ============================================================
   配置
   ============================================================ */
const LOCALES_DIR = path.resolve(process.cwd(), 'locales');
const BASE_LOCALE = 'en';                 // 基准语言
const IGNORE_UNTRANSLATED: string[] = [];

/* ============================================================
   类型
   ============================================================ */
type NestedObj = { [key: string]: string | NestedObj };

type Issue = {
  type: 'missing' | 'extra' | 'empty' | 'untranslated' | 'todo';
  locale: string;
  key: string;
  value?: string;
};

type Report = {
  summary: {
    localesChecked: number;
    totalKeysInBase: number;
    totalIssues: number;
    byLocale: Record<string, {
      missing: number;
      extra: number;
      empty: number;
      untranslated: number;
      completion: string;      // 例如 "92.5%"
    }>;
  };
  issues: Issue[];
};

/* ============================================================
   工具函数
   ============================================================ */

/** 把嵌套对象拍平成 { 'home.title': 'xxx' } */
function flatten(obj: NestedObj, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (key.includes('.') || ['__proto__','constructor','prototype'].includes(key)) throw new Error(`Unsupported key: ${fullKey}`);
    if (typeof value === 'string') {
      result[fullKey] = value;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value, fullKey));
    } else { throw new Error(`Expected a string or object at ${fullKey}`); }
  }
  return result;
}

/** 从扁平化路径写回嵌套对象 */
function unflatten(flat: Record<string, string>): NestedObj {
  const result: NestedObj = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current: NestedObj = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] === 'string') {
        current[part] = {};
      }
      current = current[part] as NestedObj;
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

/** 读取 JSON 文件 */
function readJSON(filePath: string): NestedObj {
  const content = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const parsed = JSON.parse(content);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`Invalid language object: ${filePath}`);
  return parsed;
}

/** 写入 JSON 文件（保持缩进和末尾换行） */
function writeJSON(filePath: string, data: NestedObj) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/** 获取所有语言文件 */
function getLocaleFiles(): { code: string; path: string }[] {
  if (!fs.existsSync(LOCALES_DIR)) {
    console.error(`❌ 找不到 locales 目录：${LOCALES_DIR}`);
    process.exit(1);
  }

  return fs
    .readdirSync(LOCALES_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => ({
      code: f.replace('.json', ''),
      path: path.join(LOCALES_DIR, f),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

/* ============================================================
   检查逻辑
   ============================================================ */
function check(): Report {
  const files = getLocaleFiles();
  const baseFile = files.find(f => f.code === BASE_LOCALE);

  if (!baseFile) {
    console.error(`❌ 找不到基准语言文件：${BASE_LOCALE}.json`);
    process.exit(1);
  }

  const baseFlat = flatten(readJSON(baseFile.path));
  const baseKeys = new Set(Object.keys(baseFlat));
  if (!baseKeys.size) throw new Error('Base locale must contain translation keys');

  const issues: Issue[] = [];
  const byLocale: Report['summary']['byLocale'] = {};

  for (const file of files) {
    const rawFlat = flatten(readJSON(file.path));
    for (const [key,value] of Object.entries(rawFlat)) if (/^\s*\[TODO\]/.test(value)) issues.push({type:'todo',locale:file.code,key,value});
    const stats = { missing: 0, extra: 0, empty: 0, untranslated: 0 };

    // 基准语言只检查空值
    if (file.code === BASE_LOCALE) {
      for (const [key, value] of Object.entries(baseFlat)) {
        if (!value.trim()) {
          issues.push({ type: 'empty', locale: file.code, key });
          stats.empty++;
        }
      }
      byLocale[file.code] = { ...stats, completion: ((Object.values(baseFlat).filter(v => v.trim() && !/^\s*\[TODO\]/.test(v)).length / baseKeys.size) * 100).toFixed(1) + '%' };
      continue;
    }

    const localeFlat = flatten(readJSON(file.path));
    const localeKeys = new Set(Object.keys(localeFlat));

    // 1. 缺失的 key
    for (const key of baseKeys) {
      if (!localeKeys.has(key)) {
        issues.push({
          type: 'missing',
          locale: file.code,
          key,
          value: baseFlat[key],
        });
        stats.missing++;
      }
    }

    // 2. 多余的 key
    for (const key of localeKeys) {
      if (!baseKeys.has(key)) {
        issues.push({
          type: 'extra',
          locale: file.code,
          key,
          value: localeFlat[key],
        });
        stats.extra++;
      }
    }

    // 3. 空值
    for (const [key, value] of Object.entries(localeFlat)) {
      if (!value.trim()) {
        issues.push({ type: 'empty', locale: file.code, key });
        stats.empty++;
      }
    }

    // 4. 未翻译（值 == 基准语言的值，且不在白名单）
    for (const [key, value] of Object.entries(localeFlat)) {
      if (
        baseFlat[key] &&
        value === baseFlat[key] &&
        !IGNORE_UNTRANSLATED.includes(key) &&
        // 过滤纯符号和数字
        /[a-zA-Z\u4e00-\u9fa5]/.test(value)
      ) {
        issues.push({
          type: 'untranslated',
          locale: file.code,
          key,
          value,
        });
        stats.untranslated++;
      }
    }

    // 计算完成度
    const totalBase = baseKeys.size;
    const translated = [...baseKeys].filter(key => localeKeys.has(key) && localeFlat[key].trim() && !/^\s*\[TODO\]/.test(localeFlat[key])).length;
    const completion = totalBase > 0
      ? ((translated / totalBase) * 100).toFixed(1) + '%'
      : '0.0%';

    byLocale[file.code] = { ...stats, completion };
  }

  return {
    summary: {
      localesChecked: files.length,
      totalKeysInBase: baseKeys.size,
      totalIssues: issues.length,
      byLocale,
    },
    issues,
  };
}

/* ============================================================
   输出格式化
   ============================================================ */

// 颜色（Windows 也支持，Node 17+）
const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function printHumanReadable(report: Report) {
  console.log('');
  console.log(`${c.bold}🌐 i18n Key 完整性检查${c.reset}`);
  console.log(`${c.gray}${'─'.repeat(60)}${c.reset}`);
  console.log('');

  // 概览
  console.log(
    `${c.bold}基准语言：${c.reset}${c.cyan}${BASE_LOCALE}${c.reset}` +
    `${c.gray} (${report.summary.totalKeysInBase} 个 key)${c.reset}`
  );
  console.log(
    `${c.bold}检查语言：${c.reset}${report.summary.localesChecked} 个`
  );
  console.log('');

  // 每个语言的完成度表格
  console.log(`${c.bold}完成度概览${c.reset}`);
  console.log(`${c.gray}${'─'.repeat(60)}${c.reset}`);
  console.log(
    `  ${'语言'.padEnd(8)}${'完成度'.padEnd(10)}${'缺失'.padEnd(8)}${'多余'.padEnd(8)}${'空值'.padEnd(8)}${'未翻译'}`
  );
  console.log(`${c.gray}${'─'.repeat(60)}${c.reset}`);

  for (const [locale, stats] of Object.entries(report.summary.byLocale)) {
    const isBase = locale === BASE_LOCALE;
    const localeLabel = isBase ? `${locale} ${c.gray}(基准)${c.reset}` : locale;

    const completionColor =
      parseFloat(stats.completion) === 100 ? c.green :
      parseFloat(stats.completion) >= 90 ? c.yellow : c.red;

    const pad = (str: string, len: number) => {
      // 去掉 ANSI 转义计算实际长度
      const visible = str.replace(/\x1b\[[0-9;]*m/g, '');
      return str + ' '.repeat(Math.max(0, len - visible.length));
    };

    console.log(
      `  ${pad(localeLabel, 12)}` +
      `${pad(completionColor + stats.completion + c.reset, 18)}` +
      `${pad(stats.missing > 0 ? c.red + stats.missing + c.reset : c.gray + '0' + c.reset, 16)}` +
      `${pad(stats.extra > 0 ? c.yellow + stats.extra + c.reset : c.gray + '0' + c.reset, 16)}` +
      `${pad(stats.empty > 0 ? c.red + stats.empty + c.reset : c.gray + '0' + c.reset, 16)}` +
      `${stats.untranslated > 0 ? c.magenta + stats.untranslated + c.reset : c.gray + '0' + c.reset}`
    );
  }
  console.log('');

  // 详情
  if (report.issues.length === 0) {
    console.log(`${c.green}${c.bold}✅ 所有语言包的 key 均完整！${c.reset}`);
    console.log('');
    return;
  }

  // 按语言分组显示
  const grouped = new Map<string, Issue[]>();
  for (const issue of report.issues) {
    if (!grouped.has(issue.locale)) grouped.set(issue.locale, []);
    grouped.get(issue.locale)!.push(issue);
  }

  for (const [locale, issues] of grouped) {
    if (locale === BASE_LOCALE && issues.every(i => i.type === 'empty')) {
      // 基准语言的空值已经单独统计
    }

    const missing = issues.filter(i => i.type === 'missing');
    const extra = issues.filter(i => i.type === 'extra');
    const empty = issues.filter(i => i.type === 'empty');
    const untranslated = issues.filter(i => i.type === 'untranslated');
    const todos = issues.filter(i => i.type === 'todo');
    if(todos.length) console.log(`  [TODO]: ${todos.map(i => i.key).join(', ')}`);

    console.log(`${c.bold}${c.blue}▸ ${locale}${c.reset} ${c.gray}(${issues.length} 个问题)${c.reset}`);

    if (missing.length > 0) {
      console.log(`  ${c.red}${c.bold}缺失 ${missing.length} 个 key：${c.reset}`);
      missing.slice(0, 20).forEach(i => {
        console.log(`    ${c.red}✗${c.reset} ${c.cyan}${i.key}${c.reset}`);
        if (i.value) {
          const preview = i.value.length > 60 ? i.value.slice(0, 57) + '...' : i.value;
          console.log(`      ${c.gray}→ ${preview}${c.reset}`);
        }
      });
      if (missing.length > 20) {
        console.log(`    ${c.gray}... 还有 ${missing.length - 20} 个${c.reset}`);
      }
    }

    if (extra.length > 0) {
      console.log(`  ${c.yellow}${c.bold}多余 ${extra.length} 个 key：${c.reset}`);
      extra.slice(0, 10).forEach(i => {
        console.log(`    ${c.yellow}⚠${c.reset} ${i.key}`);
      });
      if (extra.length > 10) {
        console.log(`    ${c.gray}... 还有 ${extra.length - 10} 个${c.reset}`);
      }
    }

    if (empty.length > 0) {
      console.log(`  ${c.red}${c.bold}空值 ${empty.length} 个 key：${c.reset}`);
      empty.slice(0, 10).forEach(i => {
        console.log(`    ${c.red}○${c.reset} ${i.key}`);
      });
      if (empty.length > 10) {
        console.log(`    ${c.gray}... 还有 ${empty.length - 10} 个${c.reset}`);
      }
    }

    if (untranslated.length > 0) {
      console.log(`  ${c.magenta}${c.bold}未翻译 ${untranslated.length} 个 key：${c.reset}`);
      untranslated.slice(0, 10).forEach(i => {
        console.log(`    ${c.magenta}≈${c.reset} ${i.key}`);
      });
      if (untranslated.length > 10) {
        console.log(`    ${c.gray}... 还有 ${untranslated.length - 10} 个${c.reset}`);
      }
    }

    console.log('');
  }

  console.log(`${c.gray}${'─'.repeat(60)}${c.reset}`);
  console.log(
    `${c.bold}共 ${report.summary.totalIssues} 个问题${c.reset} · ` +
    `${c.gray}运行 ${c.cyan}node scripts/check-i18n.mjs --fix${c.gray} 自动补齐缺失 key${c.reset}`
  );
  console.log('');
}

function printJSON(report: Report) {
  console.log(JSON.stringify(report, null, 2));
}

/* ============================================================
   自动修复（--fix）
   ============================================================ */
function fix() {
  console.log('');
  console.log(`${c.bold}🔧 自动补齐缺失的 key${c.reset}`);
  console.log(`${c.gray}${'─'.repeat(60)}${c.reset}`);
  console.log('');

  const files = getLocaleFiles();
  const baseFile = files.find(f => f.code === BASE_LOCALE);
  if (!baseFile) {
    console.error(`❌ 找不到基准语言：${BASE_LOCALE}`);
    process.exit(1);
  }

  const baseFlat = flatten(readJSON(baseFile.path));
  let totalFixed = 0;
  let totalFiles = 0;

  for (const file of files) {
    if (file.code === BASE_LOCALE) continue;

    const localeRaw = readJSON(file.path);
    const localeFlat = flatten(localeRaw);
    const missing = Object.keys(baseFlat).filter(k => !(k in localeFlat));

    if (missing.length === 0) {
      console.log(`  ${c.green}✓${c.reset} ${file.code} ${c.gray}无需修复${c.reset}`);
      continue;
    }

    // 从基准语言复制缺失的 key（值前面加 [TODO] 标记）
    for (const key of missing) {
      localeFlat[key] = `[TODO] ${baseFlat[key]}`;
    }

    // 写回文件
    for (const key of missing) {
      const parts = key.split('.'); let target = localeRaw;
      for (const part of parts.slice(0,-1)) {
        if (Object.hasOwn(target,part) && typeof target[part] === 'string') throw new Error('Structure conflict at ' + key);
        if (!Object.hasOwn(target,part)) target[part] = {};
        target = target[part] as NestedObj;
      }
      const leaf = parts.at(-1)!;
      if (Object.hasOwn(target,leaf)) throw new Error('Structure conflict at ' + key);
      target[leaf] = localeFlat[key];
    }
    writeJSON(file.path, localeRaw);
    console.log(
      `  ${c.green}✓${c.reset} ${file.code} ${c.gray}补齐 ${missing.length} 个 key（标记为 [TODO]）${c.reset}`
    );
    totalFixed += missing.length;
    totalFiles++;
  }

  console.log('');
  console.log(
    `${c.green}${c.bold}✅ 完成${c.reset} · ` +
    `修复 ${totalFiles} 个文件，共补齐 ${totalFixed} 个 key`
  );
  console.log('');
  console.log(
    `${c.yellow}提示：${c.reset}所有新增 key 都带有 ${c.yellow}[TODO]${c.reset} 前缀，`
  );
  console.log(
    `${c.yellow}      ${c.reset}搜索 ${c.cyan}[TODO]${c.reset} 就能找到需要翻译的内容。`
  );
  console.log('');
  console.log(
    `${c.gray}交给翻译公司前，先运行：${c.reset}`
  );
  console.log(
    `  ${c.cyan}rg '\\[TODO\\]' locales/ > translate-request.txt${c.reset}`
  );
  console.log('');
}

/* ============================================================
   主入口
   ============================================================ */
function main() {
  const args = process.argv.slice(2);
  const isCI = args.includes('--ci');
  const isJSON = args.includes('--json');
  const isFix = args.includes('--fix');

  if (isFix && isJSON) throw new Error('--fix and --json must be run separately');
  if (isFix) {
    fix();
    // 修复后自动跑一次检查
    console.log('');
    const report = check();
    printHumanReadable(report);
    process.exit(report.issues.some(i => ['missing','empty','todo'].includes(i.type)) ? 1 : 0);
  }

  const report = check();

  if (isJSON) {
    printJSON(report);
  } else {
    printHumanReadable(report);
  }

  if (isCI) {
    // CI 模式：有缺失或空值就失败
    const hasCritical = report.issues.some(
      i => ['missing','empty','todo'].includes(i.type)
    );
    process.exit(hasCritical ? 1 : 0);
  }

  process.exit(0);
}

main();
