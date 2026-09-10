# HaoWord 多平台发布服务

网站入口为 `/publisher.html`。同一视频上传到本服务一次，由持久化队列分发到选中的账号；可提供英语、中文两个版本，按平台语言分配。工作台登录与现有静态站点账号独立。

## 已实现与尚待验证

* Facebook 公共主页：官方 Page Video API，返回视频 ID 后显示“已提交”。不支持个人主页 API 发布。
* Instagram：Facebook Login 授权关联的专业账号，创建 Reels 容器、查询处理状态、发布并返回帖子链接。
* 浏览器适配层：TikTok、YouTube、抖音、小红书、B站、视频号、快手、微博、百家号、支付宝生活号、虎扑调用固定版本的 social-auto-upload。浏览器完成只标为“已提交”，不能保证已公开。
* X 未实现，入口禁用。B站首次登录使用本机 CLI 后导入；其网页连接按钮仅提示本地流程。
* 自动化测试使用模拟提供方，不会真实发布。所有账号上线前都需要本人完成授权、核对身份和实际上传验收。平台审核、权限限制、页面变化可能影响发布。

## 启动

需要 Node.js 24。没有 npm 运行依赖。

1. 将 `.env.example` 复制为本地 `.env`；生成随机 32 字节密钥，填写 `PUBLISHER_ENCRYPTION_KEY`。保管密钥及数据备份，换密钥会使已有授权不可读。
2. 配置 `PUBLISHER_ADMIN_EMAIL` 和至少 14 字符随机密码（仅首次启动创建，不会重置已有密码）。本版本为管理员创建账号，不开放自助注册。
3. 在此目录运行 `node --env-file=.env server.mjs`，另一终端运行 `node --env-file=.env worker.mjs`。同一数据目录只能启动一个 worker；服务与 worker 必须在同一机器、共享配置和私有目录。
4. HTTPS 反向代理到 `127.0.0.1:8789`。`PUBLIC_ORIGIN` 精确等于外部域名，无末尾斜杠。代理需允许大文件上传且超时至少 15 分钟。
5. 若沿用 haowordtool.com，代理 `/api/publisher/*` 到服务，并发布静态 `/publisher.html`、`/assets/publisher.*`。GitHub Pages 本身不能运行 Node/Python 或保存账号授权；单独推送代码不等于后端已上线。

本地界面测试可使用 `PUBLIC_ORIGIN=http://localhost:8789`；Meta 必须使用可公开访问的 HTTPS 地址。服务默认只监听回环地址，真实密码、密钥仅放服务端。不要将服务数据、浏览器会话、访问日志中的 OAuth code 或带签名媒体地址公开。反向代理应对回调/媒体路径关闭查询参数日志。媒体签名链接有效 23 小时，只供平台取视频；请同步服务器时钟。

## Meta 配置

在已有 Meta 应用的 Facebook Login 设置回调：

`https://你的发布域名/api/publisher/oauth/meta/callback`

将 App ID、App Secret 和应用支持的 Graph API 版本填入服务端 `.env`。不要填写聊天、前端或 GitHub。所需权限：`pages_show_list`、`pages_read_engagement`、`pages_manage_posts`、`instagram_basic`、`instagram_content_publish`。实际权限/审核以 Meta 控制台为准；为其他客户提供授权可能需要应用审核、上线及业务验证。Instagram 专业账号需关联授权的 Facebook 公共主页。

工作台点 Facebook 或 Instagram“连接账号”，完成一次官方授权即可导入授权的主页及关联 Instagram。每次发布只使用勾选账号。撤销、过期或平台风控后需要重新授权，不能承诺永久免登录。

官方参考：
* https://github.com/fbsamples/reels_publishing_apis/tree/main/insta_reels_publishing_api_sample
* https://developers.facebook.com/docs/video-api/guides/publishing/
* https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api

## 国内平台与 TikTok/YouTube

使用 `https://github.com/dreammis/social-auto-upload` 的提交 `0012d2c355f88f683cc38dde2a2db209e14091bc`（MIT）；不得混入该项目的 cookies、账号数据库或原始录屏。

在服务电脑建立 Python 3.10–3.12 虚拟环境，安装该 checkout 的依赖及 `playwright==1.58.0`，再运行 `python -m patchright install chromium` 和 `python -m playwright install chromium`。设置 `SAU_ROOT` 和 `PUBLISHER_PYTHON` 为绝对路径。本仓库不自动下载和执行第三方安装程序。B站还需要上游 biliup 运行时；小红书等平台额外依赖按上游说明部署。

点“连接账号”会在 **worker 所在电脑** 打开浏览器，用户在那台电脑完成扫码/登录（TikTok 可能需在浏览器调试窗口点 Resume）。此版本没有远程浏览器串流或网页二维码转发；不应作为无需配置的多客户云服务宣传。

也可在本机通过上游 CLI 登录，再导入可信会话：

```text
node --env-file=.env admin.mjs import-session your@email.com bilibili C:/private/session.json "B站账号名称"
```

该命令对所有已列出的浏览器平台可用。导入后先在本机核对会话属于目标账号。会话以 AES-256-GCM 存储，并绑定账号 ID；执行时仅短暂解密到私有临时目录，结束即删除。进程异常退出可能留下临时文件，应在停止 worker 后检查并清理 `data/sessions`，在 Windows 上为数据目录配置仅服务用户可访问的 NTFS 权限（POSIX mode 不替代 ACL）。服务端应使用专用低权限用户。

## 运维与验收

* `node --test tests/*.test.mjs`：授权隔离、队列幂等、单次上传分发、异常结果、Meta 模拟流程。
* `queued → publishing → submitted/published/failed/review_required`。重启时进行中的任务变为待核对，不自动再次发布。失败也不会自动重试。
* 一个请求 key 绑定同一内容，浏览器网络重试沿用 key；修改内容会创建新请求。禁止在待核对时再点新任务。
* 视频默认每个最大 512 MiB，用户总配额 5 GiB。当前无自动删除/云对象存储，管理员需按保留政策管理媒体及数据库。保留被队列引用的媒体；不要直接删除正在发布的文件。
* MP4 入口检查容器标记；编码、时长、比例等由平台处理，不能把容器校验当成全面媒体验证。
* 发布实例不自动复用 AdsPower1；要沿用其账号，需通过相应平台授权或本机重新登录。未执行真实账号发布测试、未录制实际上传演示。
