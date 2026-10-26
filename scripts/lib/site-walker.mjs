/**
 * 站点 HTML 遍历的唯一入口。
 *
 * 存在的理由：这些脚本各自维护一份跳过目录清单，已经因此踩过两次坑——
 * 一次是把备份目录 .head-backup 当成页面扫（重复标题假阳性），
 * 一次是新加的 content/deepen 片段目录被当成正式页面（凭空多出 11 个 error）。
 * 两处代码没变，变的是「谁有权决定扫哪里」。现在这个决定只在这一个文件里。
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * 不参与「正式页面」判定的目录：
 * - 版本库/依赖/CI：.git node_modules .github
 * - 非页面资产：assets data locales tests docs scripts
 * - 本地工作目录：.head-backup .tmp content
 * - 其他平台源码：www android ios build mobile
 *
 * 新增任何「存放 HTML 但不是线上页面」的目录，加到这里，不要在各脚本里各写一份。
 */
export const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  '.github',
  'assets',
  'data',
  'locales',
  'tests',
  'docs',
  'scripts',
  '.head-backup',
  '.tmp',
  'content',
  'www',
  'android',
  'ios',
  'build',
  'mobile',
]);

/** 递归列出仓库内所有 HTML 的相对路径（posix 分隔符，已排序） */
export function walkHtml(root, dir = '') {
  const out = [];
  const abs = path.join(root, dir);
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      out.push(...walkHtml(root, rel));
    } else if (e.name.endsWith('.html')) {
      out.push(rel);
    }
  }
  return out.sort();
}

/**
 * 按现有脚本的写法逐项 yield 目录项，便于不想改结构的地方直接用。
 * 用法：for (const e of readEntries(root)) ... 并在调用处用 SKIP_DIRS 判断。
 */
export function readEntries(root, dir = '') {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true });
}
