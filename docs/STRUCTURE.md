# 站点结构收敛方案

> 生成：2026-10-26 08:37:40 UTC
> 由 `scripts/build-redirect-map.mjs` 生成，改映射请改脚本里的 MAP 表。

## 目标结构

```
/                        首页：16 个工具，首屏即工具
/tools/                  工具索引 + 工具页
/ai-tools/               唯一辅助栏目：AI 工具情报
  ├ rank/                增长榜单
  ├ guides/              原创指南
  ├ signals/             每日信号
  └ cases/               案例拆解
/shop/                   唯一商业入口
  ├ services/            定制服务
  ├ digital/             数字商品
  ├ courses/             课程
  ├ affiliate/           联盟
  └ reviews/             实物测评
/guides/                 Word 工具配套长文（不占导航，工具页内链进入）
/about /privacy /terms /contact /faq   站点信息
```

## 迁移统计

| 目标区块 | 条数 |
|---|---|
| `/shop/services` | 17 |
| `/ai-tools/guides` | 14 |
| `/ai-tools/rank` | 11 |
| `/ai-tools/signals` | 9 |
| `/shop/affiliate` | 9 |
| `/ai-tools/cases` | 8 |
| `/shop/digital` | 8 |
| `/shop/reviews` | 5 |
| `/ai-tools/` | 2 |
| `/shop/courses` | 2 |
| `/ai-tools/en` | 1 |

合计 **86** 条规则，源路径缺失 0 条。

## 完整映射

| 现路径 | 目标路径 | 说明 | 源存在 |
|---|---|---|---|
| `/ai-rank/` | `/ai-tools/rank/` | 新榜单页，直接成为栏目主入口 | ✓ |
| `/ai/ai-rank.html` | `/ai-tools/rank/` | 旧榜单页并入 | ✓ |
| `/ai/ai-rank-en.html` | `/ai-tools/rank/en/` | 英文榜单独立 | ✓ |
| `/ai/pro.html` | `/ai-tools/rank/pro.html` | 榜单进阶视图 | ✓ |
| `/ai/pro-en.html` | `/ai-tools/rank/en/pro.html` |  | ✓ |
| `/ai/boards.html` | `/ai-tools/rank/boards.html` | 榜单看板 | ✓ |
| `/ai/boards-en.html` | `/ai-tools/rank/en/boards.html` |  | ✓ |
| `/ai/keywords.html` | `/ai-tools/rank/keywords.html` | 关键词维度的榜单 | ✓ |
| `/ai/keywords-en.html` | `/ai-tools/rank/en/keywords.html` |  | ✓ |
| `/ai/backlinks.html` | `/ai-tools/rank/backlinks.html` | 外链维度的榜单 | ✓ |
| `/ai/backlinks-zh.html` | `/ai-tools/rank/backlinks-zh.html` |  | ✓ |
| `/ai/daily-2026-10-17.html` | `/ai-tools/signals/daily-2026-10-17.html` | 每日信号 | ✓ |
| `/ai/daily-2026-10-17-en.html` | `/ai-tools/signals/en/daily-2026-10-17.html` |  | ✓ |
| `/ai/daily-2026-10-18.html` | `/ai-tools/signals/daily-2026-10-18.html` |  | ✓ |
| `/ai/trends.html` | `/ai-tools/signals/trends.html` | 趋势 | ✓ |
| `/ai/trends-en.html` | `/ai-tools/signals/en/trends.html` |  | ✓ |
| `/ai/models.html` | `/ai-tools/signals/models.html` | 模型动态 | ✓ |
| `/ai/models-en.html` | `/ai-tools/signals/en/models.html` |  | ✓ |
| `/ai/income.html` | `/ai-tools/signals/income.html` | 变现信号 | ✓ |
| `/ai/blog.html` | `/ai-tools/signals/` | 旧 blog 索引并入 signals 首页 | ✓ |
| `/ai-one-person-company-guide.html` | `/ai-tools/guides/one-person-company.html` | 一人公司指南 | ✓ |
| `/ai-workflow-systems.html` | `/ai-tools/guides/workflow-systems.html` | 工作流体系 | ✓ |
| `/ai-search-visibility.html` | `/ai-tools/guides/search-visibility.html` | AI 搜索可见性 | ✓ |
| `/ai-workspace.html` | `/ai-tools/guides/ai-workspace.html` | 工作台搭建 | ✓ |
| `/ai-companion.html` | `/ai-tools/guides/ai-companion.html` | AI 陪伴类工具观察 | ✓ |
| `/ai-glasses.html` | `/ai-tools/guides/ai-glasses.html` | AI 眼镜品类观察 | ✓ |
| `/ai-compute-export.html` | `/ai-tools/guides/compute-export.html` | 算力出海 | ✓ |
| `/ai-content-agency.html` | `/ai-tools/guides/content-agency.html` | 内容代运营模式 | ✓ |
| `/guides/ai-animation-tools-beginners-guide.html` | `/ai-tools/guides/animation-tools.html` | AI 动画入门 | ✓ |
| `/guides/ai-animation-shot-list-guide.html` | `/ai-tools/guides/animation-shot-list.html` |  | ✓ |
| `/guides/ai-animated-short-story-structure.html` | `/ai-tools/guides/animated-story-structure.html` |  | ✓ |
| `/guides/make-first-ai-animated-short-7-days.html` | `/ai-tools/guides/first-animated-short-7-days.html` |  | ✓ |
| `/guides/why-ai-animation-is-exploding.html` | `/ai-tools/guides/why-animation-exploding.html` |  | ✓ |
| `/guides/write-ai-animation-scripts-chatgpt.html` | `/ai-tools/guides/animation-scripts-chatgpt.html` |  | ✓ |
| `/ai/oil-painting-case.html` | `/ai-tools/cases/oil-painting.html` | 油画面案例 | ✓ |
| `/ai/oil-painting-case-en.html` | `/ai-tools/cases/en/oil-painting.html` |  | ✓ |
| `/ai/sunxue-15-points.html` | `/ai-tools/cases/sunxue-15-points.html` | 孙宇晨 15 点拆解 | ✓ |
| `/ai/infra-bubble-ai.html` | `/ai-tools/cases/infra-bubble.html` | AI 基建泡沫 | ✓ |
| `/ai/infra-bubble-ai-en.html` | `/ai-tools/cases/en/infra-bubble.html` |  | ✓ |
| `/ai-money-cases.html` | `/ai-tools/cases/money-cases.html` | AI 搞钱案例集 | ✓ |
| `/ai-money-cases-zh.html` | `/ai-tools/cases/money-cases-zh.html` |  | ✓ |
| `/ai/social-media-extract.html` | `/ai-tools/cases/social-extract.html` | 社媒内容提取（薄页，需加厚） | ✓ |
| `/ai/index.html` | `/ai-tools/` | 旧 /ai/ 索引 → 栏目首页 | ✓ |
| `/ai-nav.html` | `/ai-tools/` | AI 导航页并入栏目首页 | ✓ |
| `/ai-nav-en.html` | `/ai-tools/en/` |  | ✓ |
| `/services/` | `/shop/services/` | 服务总览 | ✓ |
| `/services/website-design.html` | `/shop/services/website-design.html` |  | ✓ |
| `/services/logo-design.html` | `/shop/services/logo-design.html` |  | ✓ |
| `/services/video-editing.html` | `/shop/services/video-editing.html` |  | ✓ |
| `/services/disclosure.html` | `/shop/services/disclosure.html` | 服务披露 | ✓ |
| `/custom-web-design.html` | `/shop/services/custom-web-design.html` |  | ✓ |
| `/app-builder.html` | `/shop/services/app-builder.html` |  | ✓ |
| `/video-studio.html` | `/shop/services/video-studio.html` |  | ✓ |
| `/ai-studio.html` | `/shop/services/ai-studio.html` |  | ✓ |
| `/ai-spokesperson.html` | `/shop/services/ai-spokesperson.html` |  | ✓ |
| `/social-publisher.html` | `/shop/services/social-publisher.html` |  | ✓ |
| `/media-downloader.html` | `/shop/services/media-downloader.html` |  | ✓ |
| `/publisher.html` | `/shop/services/publisher.html` |  | ✓ |
| `/landing-pages.html` | `/shop/services/landing-pages.html` |  | ✓ |
| `/templates.html` | `/shop/services/templates.html` |  | ✓ |
| `/skill-bank.html` | `/shop/services/skill-bank.html` |  | ✓ |
| `/ai-tools.html` | `/shop/services/ai-studio.html` | 命名冲突：此页实为 AI Studio 销售页，让出 /ai-tools/ | ✓ |
| `/premium-digital-products.html` | `/shop/digital/` | 数字商品总览 | ✓ |
| `/premium-digital/annual-budget.html` | `/shop/digital/annual-budget.html` |  | ✓ |
| `/premium-digital/dimple-dumpling.html` | `/shop/digital/dimple-dumpling.html` |  | ✓ |
| `/premium-digital/finance-dashboard.html` | `/shop/digital/finance-dashboard.html` |  | ✓ |
| `/premium-digital/ghost-granny-square.html` | `/shop/digital/ghost-granny-square.html` |  | ✓ |
| `/premium-digital/momo-shelf-ghost.html` | `/shop/digital/momo-shelf-ghost.html` |  | ✓ |
| `/premium-digital/wedding-planner.html` | `/shop/digital/wedding-planner.html` |  | ✓ |
| `/premium-digital/willow-market-bag.html` | `/shop/digital/willow-market-bag.html` |  | ✓ |
| `/courses.html` | `/shop/courses/` | 课程总览 | ✓ |
| `/ielts-course.html` | `/shop/courses/ielts.html` |  | ✓ |
| `/affiliate-products.html` | `/shop/affiliate/products.html` | 联盟页：需砍到 10-20 个并加真实观点 | ✓ |
| `/affiliate-marketing.html` | `/shop/affiliate/marketing.html` | 薄落地页，需重写 | ✓ |
| `/affiliate-dashboard.html` | `/shop/affiliate/dashboard.html` |  | ✓ |
| `/fiverr-affiliate-program.html` | `/shop/affiliate/fiverr-program.html` |  | ✓ |
| `/fiverr-ai-services.html` | `/shop/affiliate/fiverr-ai-services.html` |  | ✓ |
| `/fiverr-services.html` | `/shop/affiliate/fiverr-services.html` |  | ✓ |
| `/top-100-products-2026.html` | `/shop/affiliate/top-100-2026.html` | 模板化，需砍量加观点 | ✓ |
| `/reviews.html` | `/shop/affiliate/reviews.html` | 最高风险：编造评分，必须重写或降级为选购指南 | ✓ |
| `/links.html` | `/shop/affiliate/links.html` |  | ✓ |
| `/ai/best-heated-shawls-winter-2026.html` | `/shop/reviews/heated-shawls-2026.html` | 实物测评，不属于 AI 情报 | ✓ |
| `/ai/heated-shawl-power-bank-hours.html` | `/shop/reviews/heated-shawl-power-bank.html` |  | ✓ |
| `/ai/heated-shawl-price-breakdown-40-vs-80.html` | `/shop/reviews/heated-shawl-price.html` |  | ✓ |
| `/ai/heated-shawl-usb-power-pitfall.html` | `/shop/reviews/heated-shawl-usb.html` |  | ✓ |
| `/outfits.html` | `/shop/reviews/outfits.html` |  | ✓ |

## 执行顺序（关键）

301 必须先于文件移动生效，否则旧 URL 会 404，抓取预算和已有排名一起丢掉。

1. 在 Cloudflare 上传 `docs/redirects.csv`（Bulk Redirects），确认规则已激活
2. 用 curl 抽验 5 条旧 URL，确认返回 301 而不是 404
3. 建新目录、移动文件（`scripts/apply-structure.mjs`）
4. 改站内链接、更新 sitemap、提交 Search Console 改版
5. 7 天后复查 404 报告

## 不迁的页面

- `checkout` `order` `account` `pricing` `delivery` `start` `how-it-works`：流程页，挪路径会打断进行中的订单和已发出的邮件链接，原地保留并加 noindex
- `about` `privacy` `terms` `contact` `faq` `editorial-standards` `google-profile-help*`：站点信息，原路径就是最佳路径
- `/guides/` 下 22 篇拼字类长文：属于 Word 工具的内容集群，不是 AI 情报，留在原地、只从工具页内链