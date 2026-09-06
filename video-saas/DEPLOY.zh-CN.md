# HaoWord 视频工作台：交付与开通

本次需求以最后确认的信息为准：**30 USDT / 30 天订阅**。支付宝、微信、USDT 每次购买延长 30 天；不自动扣款。不是 30U 永久授权，也不是按条收费。

## 已实现

- 原站新增 `/video-studio.html`，并进入导航和 sitemap；保留单词工具、媒体下载、CNAME 和广告配置。
- 免费脚本拆分、可编辑分镜、三种画幅、无声分镜预览、JSON 和 HyperFrames HTML 工程下载。
- 中文、英语、日语、法语、西班牙语界面切换；语言偏好保存在当前设备。AI 起稿使用所选语言，示例脚本也随语言变化。已有用户脚本不会因切换界面语言而被自动翻译或覆盖。
- xAI 脚本生成（服务端调用，模型可配置）。
- ElevenLabs 带时间戳配音，字幕与实际配音时间对齐；SRT 导出。
- 两个独立可选的成片引擎：Remotion 动画模板、HyperFrames HTML 模板。它们不是彼此串联，也不生成真实摄影素材；当前输出是文字动效视频。
- 独立持久化制作队列、后台 worker、失败状态、MP4 下载。
- 邮箱密码登录，scrypt 哈希、HttpOnly 会话、Origin 校验、用户作品隔离、限流。
- 支付宝当面付预下单和验签查账；微信 Native 下单、RSA 签名和响应验签查账；以服务端交易金额与订单匹配后开通。
- USDT 地址/网络显示、交易哈希提交、人工核实到账后开通；不会仅凭用户填入哈希开通。
- 同一订单只能开通一次，同一渠道交易号不能重复使用，提前续费顺延。
- Android/iOS Capacitor 打包配置和生成脚本，正式下载地址配置项。

## 尚需开通，不能当作已经上线

1. GitHub Pages 只托管静态网页，不能运行 Node、数据库、配音或渲染。需要一台能运行 Docker/Node + Chromium + FFmpeg 的服务器和 HTTPS。
2. 配置 xAI、ElevenLabs 的正式 API 密钥和可用声音 ID，核对套餐允许商业使用及当前 Remotion 商业许可要求。
3. 申请支付宝/微信对应商户产品权限，配置商户号、应用号、签名私钥和平台公钥。签名密钥只放在服务端环境中。
4. 填写 USDT **公开收款地址和准确网络**。本版 USDT 需要运营人员独立核对链上到账，不含自动链上索引、确认数监听或自动兑换。
5. 人民币定价用 `PLAN_CNY_FEN` 明确设定并向用户展示。本项目不会假装把 30 USDT 实时换算成人民币。
6. APK 需要 Android SDK/JDK 和发布签名；iOS 需要 macOS/Xcode、Apple 开发者账号、签名与 App Store/TestFlight 发布。下载按钮只读取真实 HTTPS 地址，未配置则不可点击。
7. Captions 官方 API 入口现为 Mirage 申请制，官方公开页面没有提供当前可用的具体请求契约。本版**没有声称已接入 Captions/Mirage**，同步字幕来自 ElevenLabs 时间戳。取得正式文档和权限后才可接入数字人口播等功能。
8. 生产上线前配置客服、数据保留与删除流程；当前账号无自助找回密码或邮箱验证。运营方应在正式向公众开放注册前接入邮件验证与找回。

## 本地运行

Node.js 24+，在 `video-saas` 目录安装依赖：

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm start
```

打开 `http://localhost:8787/video-studio.html`。在 `.env` 配置服务后分别启动：

```sh
pnpm worker
pnpm billing
```

`billing` 单独查账，避免长视频渲染阻塞订阅开通。即使用户关闭付款页面，查账仍可开通；微信通知只确认接收，不把通知内容直接当作已付款。

## 生产部署

在 `.env` 设置真实 `PUBLIC_ORIGIN=https://haowordtool.com`、`NODE_ENV=production` 和 API/支付配置。先完成实际测试，再设 `RENDER_ENABLED=true`。项目默认每用户一天最多提交 20 个制作任务，最多两个排队/制作中任务；这是防滥用限制，可通过 `DAILY_RENDER_LIMIT` 调整。单个请求最多 12 个镜头、1800 字、计划 180 秒，实际配音最多 240 秒。

从 `video-saas` 启动：

```sh
docker compose up -d --build
```

站点前的 HTTPS 反向代理将 **`/api/video/`** 转发到 `127.0.0.1:8787`，其他 HTML/资源保留既有托管。示例 Nginx location（放入已有 HTTPS server 内）：

```nginx
location /api/video/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 90s;
    client_max_body_size 64k;
}
```

单独域名部署可修改 `assets/video-config.js` 的 `HAOWORD_VIDEO_API` 为服务 HTTPS 源，并配置 `WEB_ORIGINS=https://haowordtool.com`；推荐同一主域下子域或同源代理，跨站第三方 Cookie 可能被浏览器阻止。API 使用实际连接 IP 限流，不盲目信任 X-Forwarded-For；代理后需在边缘增加按客户端 IP 的登录速率限制。

SQLite 与作品位于共享持久卷 `/data`，三种服务必须共享它。备份数据库及作品，单实例数据库不应放在不支持 SQLite 锁的网络文件系统上。停机时先优雅停止 worker，避免中断正在计费的配音。中断任务标记失败，不自动重放收费请求。

Chromium/FFmpeg 需要足够 CPU、内存、磁盘。Dockerfile 已安装系统依赖；Remotion/HyperFrames 可能还会在首次渲染下载专用浏览器，应在启用收费前完成一次实际渲染。普通 Cloudflare Worker/Sites 的运行限制不适合在进程内运行这些渲染器，本次不改变原站域名去发布另一个静态副本冒充完整 SaaS。

## USDT 审核

```sh
pnpm admin pending
pnpm admin confirm-usdt ORDER_ID TRANSACTION_HASH "TRC20, recipient address verified, 30 USDT received, confirmations verified"
```

必须先独立核实网络、正确 USDT 合约、收款地址、金额、交易成功状态与确认数。提交的哈希要与订单匹配；审核说明进入审计记录。不要仅根据截图或备注开通。续费从当前有效期与当前时间的较晚者起加 30 天。

## 移动端

在 `mobile` 目录：

```sh
pnpm install --frozen-lockfile
MOBILE_SERVER_ORIGIN=https://haowordtool.com node prepare.mjs
pnpm android
pnpm ios
pnpm sync
```

PowerShell 设置变量用 `$env:MOBILE_SERVER_ORIGIN='https://haowordtool.com'` 后执行 `node prepare.mjs`。

分别用 Android Studio、macOS 的 Xcode 打开生成的 `android`/`ios` 项目。构建和签名真实 APK，上传到你控制的 HTTPS 下载地址；iOS 发布到 TestFlight/App Store。将这两个真实链接配置到 `ANDROID_DOWNLOAD_URL`、`IOS_DOWNLOAD_URL`。

仓库附带手动触发的 `Build Video Studio Android APK` GitHub Actions 工作流，用于生成测试 APK 下载构件。测试 APK 不是正式签名发布版，Actions 构件会过期，不应填入面向消费者的正式下载地址。正式 APK 需要运营方提供自己的签名密钥，苹果版本仍需在 macOS/Xcode 上构建与签名。

移动容器通过服务端 `?native=1` 进入已部署工作台，隐藏外部购买和下载推广区；提供已购账号使用入口。数字服务付费的 Apple/Google 审核与支付规则取决于具体 storefront、分发方式和授权，发布前必须按对应平台流程适配，不能保证仅用网页封装就通过审核。当前未实现 StoreKit/Google Play Billing，不应把本版当作已获应用商店收款许可的客户端。

## 验证

```sh
node --test video-saas/tests/studio.test.mjs
node --test tests/solver.test.cjs tests/media.test.mjs
node scripts/validate-site.mjs
```

还需用实际商户测试订单跑通金额校验、关闭页面后的查账开通，以及不同账号不能下载对方视频。第三方真实付费调用必须使用已配置的运营账号；单元测试不代表真实商户已开通。

参考官方文档：

- HyperFrames: https://hyperframes.heygen.com/developers
- Remotion: https://www.remotion.dev/docs/renderer/render-media
- ElevenLabs: https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
- Captions/Mirage: https://captions.ai/help/api-reference/api
- 支付宝 SDK: https://github.com/alipay/alipay-sdk-nodejs-all
- 微信支付: https://pay.weixin.qq.com/doc/v3/merchant/4012791874
- Capacitor: https://capacitorjs.com/docs
