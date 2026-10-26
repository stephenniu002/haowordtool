# 外站链接建设方案

> 目标不是「有多少条外链」，是「有没有人能点进来」。
> 对 AdSense 复审真正起作用的是引荐流量和品牌搜索量——审稿人看不到外链，
> 但系统能看到这个站是不是有人在访问。批量提交的垃圾链对这两项都是零。

---

## 0. 先划掉不做的事

| 不做 | 原因 |
|---|---|
| 买链 / PBN / 链轮 | 2026 年仍是算法重点清理对象，且一旦命中就是整站降权 |
| 目录批量提交站（几百个目录一键提交） | 这些目录本身没有流量，出来的链是 nofollow，还会把站和垃圾站放进同一个邻域 |
| 博客评论区群发 | 全是 nofollow + 大量被判定为 spam 的邻域信号 |
| 交换链接页（links.html 那种 reciprocal 页） | 已被明确视为链接方案，站点现有 `/links.html` 建议一并 noindex |

---

## 1. 四层，按投入产出排

### L0 技术层 —— 今天就能跑完，不需要任何账号

| 动作 | 状态 | 说明 |
|---|---|---|
| IndexNow 推送 | ✅ 已实现 `scripts/indexnow.mjs` | 172 条 URL 推给 Bing / Yandex / Seznam / Naver。无需注册 |
| RSS feed | ✅ 已实现 `scripts/build-rss.mjs` → `/feed.xml` | 聚合站、Feedly、转推机器人只吃 RSS |
| Sitemap 提交到 GSC / Bing Webmaster | ⬜ 需你登录 | 这是收录的地基，比任何外链都重要 |
| archive.org Save Page Now | ⬜ 一条命令 | 留快照。被引用时对方可以链到快照，等于多一个可引用地址 |
| 品牌一致性（NAP） | ⬜ 需你确认 | GitHub 组织简介、所有 profile 的站名/URL 写法必须完全一致 |

### L1 可嵌入资产 —— 已交付，这是最省力的正向外链

`scripts/build-embed.mjs` 产出 19 个 `/embed/*.html`。别人在自己站上贴一段 iframe，
就得到一个能用的工具，外加一行回链。特征是：

- **编辑器手放的**，不是批量提交的
- **长期有效**，只要对方站还在
- **自带引荐流量**，用工具的人会点 Powered by 回来

分发路径（按成功率排）：

1. **教师 / 教程类站点**：calculator、unit-converter、word-counter 这类工具，
   ICT 教学、ESL 教学、homework help 站常年缺现成工具，直接问「要不要嵌一个」
2. **写「免费工具合集」的博客**：这类文章的商业模式就是列工具，收一个嵌入式工具比收一个纯链接对他们更划算
3. **WordPress / Ghost / Notion 模板作者**：他们的模板演示站需要真工具页
4. **同类工具站的「相关工具」页**：互嵌，等价交换，但要挑流量相当的，别和垃圾站互嵌

### L2 目录与社区 —— 需要账号，一次做完

按「有没有真实流量」排，不按 DR 排。

| 站点 | 提交入口 | 出链 | 门槛 | 优先级 |
|---|---|---|---|---|
| Hacker News (Show HN) | `news.ycombinator.com/submit` | nofollow | 需账号，发帖要真实可讨论 | 高（带来的是真流量） |
| Reddit r/InternetIsBeautiful | `reddit.com/r/InternetIsBeautiful/submit` | nofollow | 账号需有 karma，禁自推过频 | 高 |
| Reddit r/SideProject、r/webdev、r/artificial | 对应 subreddit | nofollow | 同上 | 中 |
| Product Hunt | `producthunt.com/posts/new` | dofollow | 需账号，最好有 hunter | 高（一次性发布，长期留页） |
| AlternativeTo | `alternativeto.net/manage/add-software` | nofollow | 需账号 | 中（能持续带来搜索流量） |
| SaaSHub | `saashub.com/submit` | nofollow | 需账号 | 中 |
| dev.to | `dev.to/new` | nofollow(ugc) | 需账号 | 中（把案例库三篇改写成英文长文发过去，正文里自然引回） |
| Medium | `medium.com/new-story` | nofollow | 需账号 | 低（现在流量差，但留个品牌页） |
| GitHub（awesome-* 仓库 PR） | 见下方模板 | nofollow | 需 GitHub 账号 | 高（能带来开发者流量，且长期不腐） |
| V2EX `/go/share` | `v2ex.com/new` | nofollow | 需账号+铜币 | 中（中文侧唯一还有真实流量的） |
| 掘金 | `juejin.cn/editor/drafts/new` | nofollow | 需账号 | 中（把 sitemap-index 那篇案例改写成技术文） |
| 阮一峰《科技爱好者周刊》 | 邮件投稿 | dofollow | 免费，被选中的话单条价值极高 | 高（但不可控，每期都投） |
| HelloGitHub | GitHub issue 投稿 | dofollow | 需项目有开源代码 | 中 |

> 说明：nofollow 不等于没用。这类链接的价值在于**引荐流量**和**品牌搜索量**，
> 这两项是 AdSense 复审和 Google 判断站点真实性的间接信号。真正喂权重的
> dofollow 链，只有别人主动写文章引用时才拿得到——那只能靠 L1 和 L3。

### L3 内容外联 —— 唯一能拿到 dofollow 的路

逻辑很简单：**你得先有别人需要引用的东西。**

站点现在手上真正稀缺的素材：

1. **AI 工具增长榜**（`/ai-tools/rank/`）—— 原创榜单。榜单是最容易被引用的内容形态，
   因为写「AI 工具推荐」的人需要数据支撑。要做的是让它**可引用**：
   - 每条上榜工具给出可核查的抓取口径（何时抓、抓什么指标、怎么算的）
   - 提供一段可复制的引用格式（作者名 + 站名 + 链接 + 抓取日期）
   - 提供 CSV 下载，附来源要求
2. **案例库三篇**（`/blog/cases/`）—— sitemap 少一个斜杠导致 189 条 URL 全废、
   canonical 全指英文版导致 30 页放弃收录、Shopify 域名验证的 429 干扰项。
   这三篇是真实的排错记录，SEO / 独立开发者社区里这类内容稀缺，改写英文后
   投 dev.to、HN、Reddit 都有机会被二次引用。
3. **19 个免费工具** —— 本身就是可嵌入的引用单元。

外联动作（每周 5 封，手写，不群发）：

- 找到最近 90 天写过「免费在线工具」「文字游戏求解」「AI 工具盘点」的博客
- 只提一件事：他文中缺的那个工具我有，可以嵌，也可以只放链接
- 不做「求链接」式请求，做「补你文章里缺的那一块」

---

## 2. 30 天排期

| 周 | 动作 | 产出 |
|---|---|---|
| W1 | L0 全部跑完：IndexNow 推送、feed 上线、GSC/Bing 提交 sitemap、archive 快照 | 收录通道打通 |
| W2 | Product Hunt 发布 + AlternativeTo / SaaSHub 提交 + Show HN | 3–5 条长期页 + 一波真实流量 |
| W3 | 案例库三篇改写英文投 dev.to + HN；中文两篇投 V2EX / 掘金 | 4 篇外站长文，正文带链 |
| W4 | 嵌入式工具外联 20 封；awesome-list PR 3 个 | 2–5 条编辑器手放的外链 |

---

## 3. 怎么判断有没有用

不看「外链数」，看三个数：

1. **GSC → 链接报告**里新增的引用域（每周一次）
2. **引荐流量**：GA4 里 `session_source` 为 referral 的会话数，以及具体来源域
3. **品牌搜索量**：GSC 里含 "haowordtool" 的查询数。这一项涨了，说明外链真的在起作用

第一周大概率是 0，这正常。外链生效周期是 2–8 周。

---

## 4. 与 AdSense 复审的关系（别搞混）

外链**不解决**「低价值内容」。复审看的是站内内容本身。
当前站内自查状态：

- BLOCKER 0 / MAJOR 2 / MINOR 3（`node scripts/adsense-readiness.mjs`）
- 可索引 180 页，其中 49 页正文不足 300 词——多数是带真实功能的工具页，
  按功能判是合格的，但**审稿人不点按钮，只看页面**
- 政策页齐备：隐私政策 737 词（含 AdSense Cookie 披露与 opt-out）、条款 575 词、
  关于 460 词、编辑标准 464 词

所以顺序应该是：**先让站内 49 个短页里有内容价值的那些补到 300 词以上，
再提交复审**。外链同期做，两条线互不阻塞。
