# 上线后的真实搜索流量工作

本次保留原有页面地址、canonical、robots 与 sitemap。已有页面包含这些设置，不能把重复添加标签当作流量增长。实质修改的教程同步可见日期和 Article.dateModified，sitemap 只更新实质变化的页面。不要批量创建输入字母组合页面。

## 第一步：确认上线和收录

1. 在已有 Search Console 域名资源中验证 haowordtool.com 的所有权；若尚未验证，使用其提供的实际记录，不要填写示例验证码。
2. 提交 https://haowordtool.com/sitemap.xml。用网址检查确认首页、工具页、空白牌教程、精确匹配教程能抓取，且 Google 选择的规范网址正确。
3. 记录发布日和最近 28 天的展示、点击、CTR；按查询、页面、国家和设备拆分。没有数据时写“暂无数据”，不能填估算流量。

## 第二步：围绕实际任务改善已有页面

- 空白牌：CART? 和 LET?，展示空白替代位置、得分推导、可点击例题和练习答案。
- 完整匹配：LISTEN 与 LIST，区分“使用全部字母”和“只要指定长度”。
- 后续内容优先依据搜索查询和使用反馈完善重复字母、词库差异、单词含义验证。不要为了固定篇数或字数生产内容。

## 第三步：每月用数据决定下一步

比较最近 28 天与前 28 天：有展示但点击低的页面，核对标题是否准确回答该查询；有点击但无法解题的页面，先修工具或例题；未收录页面先检查抓取、重复内容和真实信息价值。低样本不推断成效。提交 sitemap 并不保证收录或排名。

可向已有相关受众分享具体教程，但应遵守所在社区规则并说明用途；此仓库不会自动发帖、造外链、刷访问或点击广告。本文件是执行说明，没有创建周期自动任务。

官方参考：
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/monitor-debug/search-console-start
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
