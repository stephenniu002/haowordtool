# haowordtool.com AdSense 低价值内容整改审计报告

> 审计日期：2026-10-12
> 背景：Google 以"低价值内容"拒绝 haowordtool.com 的 AdSense 申请（pub-4489946300243174）
> 用户指令：联盟页加观点、砍搬运页、收多语言
> 审计范围：~/workspace/haowordtool/ 全站（223MB）
> 说明：本报告只做审计，不修改任何文件

---

## 一、联盟页审计

### 1.1 带联盟链接页面清单

| 页面 | 大小/词数 | 联盟链接数 | 联盟类型 | 原创观点？ |
|------|-----------|-----------|----------|-----------|
| reviews.html | 7008 词 | 60 | Amazon（tag=haowordstudio-20） | ❌ 有评分结构但声明"未经实测" |
| affiliate-products.html | 6182 词 | 0（跳转到 affiliate-marketing.html，Amazon ASIN required 未激活） | Amazon（待激活） | ❌ 100 产品全模板话术 |
| top-100-products-2026.html | 6328 词 | 7 | Fiverr（bta=1176043） | ❌ 100 产品全模板话术 |
| fiverr-ai-services.html | 861 词 | 12 | Fiverr（bta=1176043） | ❌ 服务列表，无观点 |
| fiverr-services.html | 873 词 | 6 | Fiverr（bta=1176043） | ❌ 服务列表，无观点 |
| fiverr-affiliate-program.html | 805 词 | 1 | Fiverr 招募链接 | ⚠️ 通用计划介绍，无个人经验 |
| affiliate-marketing.html | 477 词 | 0（内部跳转页） | — | ❌ 薄落地页，无实质内容 |
| links.html | — | 1 | Amazon 首页 | ✅ 链接聚合页，6 按钮真实 |

### 1.2 "只有参数无观点"页面清单（核心问题）

1. **affiliate-products.html**（100 个产品）
   - 每个产品卡片只有三句模板话术："Highly visual products work well in comparison clips…" + 轮换的 "Content angle" + "Best first channel"
   - 内容讲的是"怎么推广这个产品"，而不是"这个产品怎么样"——零产品评价、零优缺点、零个人观点
   - "Amazon ASIN required"：购买链接根本没激活，是个半成品
   - 部分产品名疑似 hallucination（如 "Apple MacBook Neo"——苹果从未出过该产品线）
   - Schema 标记为 ItemList，Google 会将其识别为联盟聚合页

2. **top-100-products-2026.html**（100 个产品）
   - 同 affiliate-products.html 的模板化问题
   - 7 个 Fiverr 联盟链接已激活（bta=1176043）
   - "Content angle" 全是推广套路，无产品本身观点

3. **reviews.html**（⚠️ 最高风险）
   - 表面有评测结构（Our pick / What we like / What we don't / 8.9/10 评分卡）
   - 但页面自己声明："The examples below have not been verified through independent product testing"（未经独立产品测试）、"not a hands-on test"（非实测）、"Editorial draft · Not a published test"（编辑草稿·非正式评测）
   - **编造评分 + 60 个亚马逊联盟链接 = Google 明确打击的"虚假评测"类型**，这是低价值内容拒因中最致命的一种
   - 必须优先处理

4. **fiverr-ai-services.html / fiverr-services.html**
   - 861/873 词，纯服务列表 + 联盟链接，无任何"为什么推荐"的观点

### 1.3 结论

全站联盟页**没有一篇**包含真实产品观点、实测体验或编辑推荐语。Google 政策原文点名的第一类违规就是"内容贫乏的联属营销网页"——本站联盟页正中此条。

---

## 二、搬运页 / 薄内容页识别

### 2.1 ai/ 目录（11 个文件）

| 页面 | 词数 | 问题 |
|------|------|------|
| ai/best-heated-shawls-winter-2026.html | 1325 | ✅ 相对实在（购买指南结构），暂无联盟链接，可保留加观点 |
| ai/heated-shawl-power-bank-hours.html | 1040 | ✅ 有真实计算内容，可保留 |
| ai/heated-shawl-price-breakdown-40-vs-80.html | 1007 | ✅ 价格分析实在，可保留 |
| ai/heated-shawl-usb-power-pitfall.html | 849 | ✅ 故障排查实在，可保留 |
| ai/get-muse-ai-setup-help.html | 1027 | ⚠️ 蹭"Muse AI"品牌名的服务页（Muse 是 Meta 的 AI 助手），有商标碰瓷风险，建议删除 |
| ai/social-media-extract.html | 278 | ❌ 薄落地页，中英混杂，需重写加厚 |
| ai/index.html | 104 | ❌ 薄索引页，需加厚或合并 |

### 2.2 ai-tools.html（根目录，13.7KB / 463 词）

- 文件名误导：实际是 "AI Studio" 服务销售页（卖 AI 产品图/视频/配音服务），不是 AI 工具目录
- 463 词全是定价和套餐说明，无工具评测内容
- 如保留，需改名或重写为真正的工具介绍

### 2.3 guides/ 目录（30 个文件）

**Word/Anagram 类（约 20 篇，每篇 399–722 词）：**
- anagram-solver-vs-word-finder.html（722 词）、q-words-without-u-explained.html（399 词）、scrabble-letter-values-explained.html（403 词）等
- ⚠️ 品牌为 **"Letter Solver Pro"**，与主站 HaoWordTool 品牌不一致——疑似批量生成的 SEO 内容或外部搬运
- 每篇 400–700 词，内容浅，模板感强
- 建议：统一品牌后重写，或删除

**AI 动画类（6 篇，每篇约 1300 词，2026-09-30 生成）：**
- ai-animation-tools-beginners-guide.html、why-ai-animation-is-exploding.html 等
- 内容相对完整，品牌一致，可保留

### 2.4 重定向 stub 页（9 个，全站门页）

| 页面 | 词数 | 内容 |
|------|------|------|
| games/sprunki-guide.html | 10 | "Redirecting to /games/sprunki/ …" |
| games/phantom-blade-zero-guide.html | 12 | 同上 |
| games/block-blast-guide.html | 11 | 同上 |
| games/gta-6-guide.html | — | 同上 |
| games/subway-surfers-guide.html | — | 同上 |
| games/ludo-king-guide.html | — | 同上 |
| games/castlevania-belmonts-curse-guide.html | — | 同上 |
| games/cod-modern-warfare-4-guide.html | — | 同上 |
| tools/word-counter/index.html | — | 同上 |

- 10–12 个词的纯跳转页，**典型门页（doorway pages）**，Google 政策原文点名的第三类违规
- 全部删除（保留目标页即可）

### 2.5 tools/ 目录（25 个文件）

- 计算器、转换器等功能页（calculator、bmi-calculator、qr-code-generator 等）
- 功能本身就是内容，文字少（45–65 词）可以接受
- ✅ 保留，无需处理

---

## 三、多语言审计

### 3.1 量化统计（HTML 页面）

| 语言 | HTML 数 | 平均词数 | <100 词页面 | <50 词页面 | 评级 |
|------|---------|----------|-------------|------------|------|
| ja（日语） | 48 | 60 | 39 | 32 | 🔴 最差，全是门页 stub |
| zh（中文） | 35 | 67 | 26 | 25 | 🔴 极差，门页 stub |
| ar（阿拉伯语） | 15 | 91 | 11 | 0 | 🟠 薄 |
| ru（俄语） | 23 | 124 | 12 | 0 | 🟠 薄 |
| de（德语） | 24 | 122 | 13 | 0 | 🟠 薄（但用户要求德语线继续） |
| es（西班牙语） | 48 | 153 | 12 | 0 | 🟡 部分薄 |
| fr（法语） | 33 | 180 | 1 | 0 | 🟢 相对较好 |
| ko（韩语） | 19 | 510 | 0 | 0 | 🟢 好（游戏内容实在） |
| en（英语） | 96 | 626 | 0 | 0 | 🟢 主内容 |

（总计 341 个 HTML，与任务描述一致）

### 3.2 门页实证

- **ja/about.html**（47 词）：全文是模板话术"このページはメインページと同じテーマと入口を保ち"（本页与主页保持相同主题和入口）——没有翻译任何实质内容
- **zh/affiliate-marketing.html**（27 词）：只有标题重复 + **"Open English landing page"**——明示用户去看英文版，纯粹为截获中文搜索流量
- **ja/affiliate-marketing.html**（25 词）、**es/affiliate-marketing.html**（57 词）：同类 stub
- 这些页面**符合 Google 对门页的定义**：为排名而存在、无独特价值、把用户推向实质相同的另一页面

### 3.3 各语言内容构成

- **ko/**：19 页，平均 510 词。ko/games/ 有 10 页韩语游戏攻略（GTA 6、Free Fire MAX 等，549–960 词/页），是实质翻译内容。✅ 保留
- **en/**：96 页，平均 626 词，主内容。✅ 保留
- **fr/**：33 页，平均 180 词，相对完整。⚠️ 可保留，逐步补强
- **es/**：48 页，平均 153 词，12 页偏薄。⚠️ 可保留，薄页合并或补强
- **de/**：24 页薄，但用户 2026-09-30 决定"德语线继续"。⚠️ 保留，列入重写计划
- **ja/**：48 页中 39 页是 stub。注意用户决定"日本线停止，不再新增；已发布的不动；**日语工具页除外（2026-10-12 重点投入）**"。→ ja/tools/（15 页）保留，其余 33 页 stub 删除
- **zh/**：35 页中 26 页是 stub。→ 删除 stub，保留 heated-shawl 相关等实质页（如 zh/heated-shawl.html、zh/dianre-pijian-xuangou.html）
- **ar/**、**ru/**：15/23 页，平均不足 130 词，无实质翻译。→ 删除

---

## 四、处理建议清单

### 4.1 🟢 保留 / 加观点

| 页面 | 处理 | 理由 |
|------|------|------|
| ai/best-heated-shawls-winter-2026.html | 加观点：补充编辑推荐语、"为什么选这款" | 已有 1325 词购买指南骨架，是全站最接近"有观点"的联盟潜力页 |
| ai/heated-shawl-power-bank-hours.html | 保留，可加产品观点 | 1040 词真实计算内容 |
| ai/heated-shawl-price-breakdown-40-vs-80.html | 保留 | 1007 词价格分析实在 |
| ai/heated-shawl-usb-power-pitfall.html | 保留 | 849 词故障排查实在 |
| guides/ AI 动画类 6 篇 | 保留 | 每篇约 1300 词，品牌一致、内容完整 |
| tools/ 25 个功能页 | 保留 | 功能即内容，无需处理 |
| games/ 实质攻略页、ko/games/ 10 页 | 保留 | 游戏是内容主线，韩语页 549–960 词/页 |
| en/ 96 页、fr/ 33 页 | 保留 | 主内容 / 相对完整 |
| ja/tools/ 15 页 | 保留 | 用户 2026-10-12 明确重点投入 |
| de/ 24 页 | 保留（列入补强计划） | 用户决定德语线继续 |

### 4.2 🟡 重写

| 页面 | 重写方向 | 理由 |
|------|----------|------|
| reviews.html | **最高优先级**：删除所有虚假评分卡；要么做真实测评重写，要么改为"选购指南"体（不打分、只讲选购要点）并明确标注未实测 | 60 个亚马逊联盟链接 + 编造评分 = Google 明确打击的虚假评测，AdSense 最大风险点 |
| affiliate-products.html | 100 个模板产品砍到 10–20 个，每个写 200+ 词真实观点（适合谁、不适合谁、与竞品对比）；删除不存在的产品名；激活或删除购买链接 | 模板化 affiliate 内容，无观点 |
| top-100-products-2026.html | 同上；或与 affiliate-products.html 二选一重写（见合并类） | 同上 |
| fiverr-affiliate-program.html | 加入个人使用 Fiverr 的真实经验、接单/放单案例 | 805 词通用介绍，无个人观点 |
| ai/social-media-extract.html | 扩充到 800+ 词：功能实测截图、真实用例 | 278 词薄落地页 |
| ai/index.html | 扩充或与 ai-tools 合并 | 104 词薄索引 |
| ai-tools.html | 改名（如 ai-studio.html）或重写为真正的 AI 工具评测目录 | 文件名与内容不符 |
| guides/ Word 类 20 篇 | 统一为 HaoWordTool 品牌，重写加深（或删除见 4.4） | 品牌不一致（Letter Solver Pro）、内容浅 |
| de/ 13 个薄页 | 补实质翻译内容 | 德语线继续，不能是 stub |

### 4.3 🔵 合并

| 页面 | 合并方案 | 理由 |
|------|----------|------|
| affiliate-products.html + top-100-products-2026.html | 二选一：留一个重写，另一个 301 跳转到保留页 | 两个 100 产品模板页内容重复、功能重叠 |
| fiverr-ai-services.html + fiverr-services.html | 合并为一页 "Fiverr 服务导航" | 861/873 词，主题重叠 |
| affiliate-marketing.html（根目录 477 词） | 合并到主站服务页，或删除 | 薄落地页，无独立价值 |
| es/ 12 个薄页 | 合并到对应英文页或补内容 | 平均 153 词，部分 stub |
| zh/ 实质页（heated-shawl 相关） | 合并为 1–2 页中文选购指南 | 分散的薄页不如一篇实的 |

### 4.4 🔴 删除

| 页面 | 理由 |
|------|------|
| 9 个重定向 stub（games/*-guide.html ×8、tools/word-counter/index.html） | 10–12 词纯跳转，典型门页 |
| ja/ 非工具页 33 个 stub（如 ja/about.html、ja/affiliate-marketing.html） | 25–60 词模板 stub，门页；保留 ja/tools/（用户重点投入） |
| zh/ 26 个 stub（如 zh/affiliate-marketing.html 27 词、zh/blog.html 41 词） | 门页 stub；"Open English landing page"实锤 |
| ar/ 15 页、ru/ 23 页 | 平均不足 130 词，无实质翻译 |
| ai/get-muse-ai-setup-help.html | 蹭"Muse AI"品牌名，有商标风险；且与网站主题无关 |
| 各语言 affiliate-marketing.html stub（es/fr/ja/zh） | 与根目录页重复的门页 |

### 4.5 删除/整改数量汇总

| 类别 | 页数 |
|------|------|
| 删除：重定向 stub | 9 |
| 删除：ja 门页 stub（保留 tools/） | ~33 |
| 删除：zh 门页 stub | ~26 |
| 删除：ar/ru 整站 | ~38 |
| 删除：品牌风险页 | 1 |
| **删除合计** | **约 107 页** |
| 重写：联盟/评测页 | 6 |
| 重写：guides Word 类 | ~20 |
| 重写：ai 薄页 | 3 |
| 合并 | 4 组 |

---

## 五、整改优先级（建议执行顺序）

1. **P0（AdSense 最大风险，立即处理）**：reviews.html 去虚假评分（重写或下架）；删除 9 个重定向 stub
2. **P1（门页清理）**：删除 ja/zh/ar/ru 的门页 stub（约 97 页），保留 ja/tools/、de/、ko/、en/、fr/
3. **P2（联盟页整改）**：affiliate-products.html 与 top-100-products-2026.html 二选一重写（100→15 个真实评测）；fiverr-affiliate-program.html 加个人经验
4. **P3（内容补强）**：ai/ 薄页扩充；guides Word 类统一品牌重写；de/ 薄页补翻译
5. **P4（合并）**：fiverr 两个服务页合并；affiliate-marketing.html 合并/删除

整改完成后：全站剩余约 230 页，其中实质内容页占比从 ~40% 提升到 ~75% 以上；联盟页全部带真实观点；零门页。再提交 AdSense。

---

*报告结束。未修改任何文件。*
