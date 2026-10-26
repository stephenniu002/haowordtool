# 多语言收录闸门报告

> 生成：2026-10-26 08:42:45 UTC
> 判据：`scripts/i18n-gate.mjs` 顶部注释。只有 PASS 的页面允许移除 noindex。

## 汇总

| locale | 总 | 工具页 | 索引页 | 内容页 | PASS | FAIL | 已放开 | ⚠️放开但不达标 | 可再放开 |
|---|---|---|---|---|---|---|---|---|---|
| de | 24 | 14 | 2 | 8 | 13 | 11 | 13 | - | - |
| es | 48 | 14 | 2 | 32 | 14 | 34 | 14 | - | - |
| fr | 33 | 0 | 1 | 32 | 1 | 32 | 1 | - | - |
| ja | 15 | 14 | 1 | 0 | 11 | 4 | 11 | - | - |
| ko | 8 | 0 | 0 | 8 | 0 | 8 | 0 | - | - |
| zh | 10 | 0 | 0 | 10 | 1 | 9 | 1 | - | - |

## de

**PASS 13 页**（可放开 / 维持放开）

| 页面 | 类型 | 词数 | 英文残留 | 段落 | 结构比 | noindex |
|---|---|---|---|---|---|---|
| de/tools/age-calculator.html | tool | 57 | 0% | 4 | - | 已放开 |
| de/tools/bmi-calculator.html | tool | 74 | 2.7% | 4 | - | 已放开 |
| de/tools/calculator.html | tool | 71 | 1.4% | 8 | - | 已放开 |
| de/tools/currency-converter.html | tool | 106 | 1% | 5 | - | 已放开 |
| de/tools/image-compressor.html | tool | 60 | 0% | 4 | - | 已放开 |
| de/tools/mortgage-calculator.html | tool | 76 | 1.4% | 5 | - | 已放开 |
| de/tools/password-generator.html | tool | 56 | 0% | 4 | - | 已放开 |
| de/tools/qr-code-generator.html | tool | 67 | 0% | 4 | - | 已放开 |
| de/tools/resize-image.html | tool | 62 | 0% | 4 | - | 已放开 |
| de/tools/timer.html | tool | 49 | 0% | 4 | - | 已放开 |
| de/tools/unit-converter.html | tool | 68 | 0% | 4 | - | 已放开 |
| de/tools/word-counter.html | tool | 63 | 0% | 4 | - | 已放开 |
| de/tools/world-clock.html | tool | 54 | 0% | 4 | - | 已放开 |

**FAIL 11 页**（保持 / 回加 noindex）

| 页面 | 类型 | 词数 | 英文残留 | 未通过 |
|---|---|---|---|---|
| de/index.html | nav | 40 | 0% | thin-nav:40<80 |
| de/premium-digital/annual-budget.html | content | 134 | 0% | thin:134<300 |
| de/premium-digital/dimple-dumpling.html | content | 133 | 1.6% | thin:133<300 |
| de/premium-digital/finance-dashboard.html | content | 130 | 0% | thin:130<300 |
| de/premium-digital/ghost-granny-square.html | content | 131 | 0% | thin:131<300 |
| de/premium-digital/momo-shelf-ghost.html | content | 134 | 0.8% | thin:134<300 |
| de/premium-digital/wedding-planner.html | content | 134 | 0% | thin:134<300 |
| de/premium-digital/willow-market-bag.html | content | 134 | 0% | thin:134<300 |
| de/premium-digital-products.html | content | 82 | 1.3% | thin:82<300, struct:36%<45% |
| de/tools/index.html | nav | 38 | 2.6% | thin-nav:38<80 |
| de/tools/what-is-my-ip.html | tool | 70 | 1.5% | not-functional:1<2 |

## es

**PASS 14 页**（可放开 / 维持放开）

| 页面 | 类型 | 词数 | 英文残留 | 段落 | 结构比 | noindex |
|---|---|---|---|---|---|---|
| es/index.html | nav | 99 | 1% | 6 | - | 已放开 |
| es/tools/calculadora-de-edad.html | tool | 71 | 1.4% | 4 | - | 已放开 |
| es/tools/calculadora-hipotecaria.html | tool | 94 | 1.1% | 5 | - | 已放开 |
| es/tools/calculadora-imc.html | tool | 98 | 3.1% | 4 | - | 已放开 |
| es/tools/calculadora.html | tool | 73 | 4.2% | 8 | - | 已放开 |
| es/tools/compresor-de-imagenes.html | tool | 70 | 2.9% | 4 | - | 已放开 |
| es/tools/contador-de-palabras.html | tool | 74 | 2.7% | 4 | - | 已放开 |
| es/tools/conversor-de-monedas.html | tool | 116 | 1.8% | 5 | - | 已放开 |
| es/tools/conversor-de-unidades.html | tool | 70 | 2.9% | 4 | - | 已放开 |
| es/tools/generador-de-contrasenas.html | tool | 65 | 1.5% | 4 | - | 已放开 |
| es/tools/generador-qr.html | tool | 71 | 2.9% | 4 | - | 已放开 |
| es/tools/redimensionar-imagen.html | tool | 59 | 1.7% | 4 | - | 已放开 |
| es/tools/reloj-mundial.html | tool | 62 | 3.2% | 4 | - | 已放开 |
| es/tools/temporizador.html | tool | 52 | 1.9% | 4 | - | 已放开 |

**FAIL 34 页**（保持 / 回加 noindex）

| 页面 | 类型 | 词数 | 英文残留 | 未通过 |
|---|---|---|---|---|
| es/about.html | content | 162 | 0% | thin:162<300 |
| es/affiliate-marketing.html | content | 44 | 0% | doorway:en-redirect-pitch, thin:44<300, few-paras:3<4, struct:14%<45% |
| es/ai-companion.html | content | 146 | 0% | thin:146<300 |
| es/app-builder.html | content | 147 | 0% | thin:147<300 |
| es/blog.html | content | 142 | 0% | thin:142<300, struct:12%<45% |
| es/contact.html | content | 146 | 0% | thin:146<300 |
| es/custom-web-design.html | content | 149 | 0% | thin:149<300, struct:26%<45% |
| es/editorial-standards.html | content | 140 | 0% | thin:140<300 |
| es/faq.html | content | 140 | 0% | thin:140<300 |
| es/how-it-works.html | content | 138 | 0% | thin:138<300 |
| es/ielts-course.html | content | 150 | 0% | thin:150<300, struct:35%<45% |
| es/local-ai.html | content | 144 | 0% | thin:144<300, struct:30%<45% |
| es/media-downloader.html | content | 139 | 0% | thin:139<300 |
| es/order.html | content | 149 | 0% | thin:149<300, struct:44%<45% |
| es/premium-digital/annual-budget.html | content | 163 | 0% | thin:163<300 |
| es/premium-digital/dimple-dumpling.html | content | 157 | 1.3% | thin:157<300 |
| es/premium-digital/finance-dashboard.html | content | 155 | 0% | thin:155<300 |
| es/premium-digital/ghost-granny-square.html | content | 159 | 0.6% | thin:159<300 |
| es/premium-digital/momo-shelf-ghost.html | content | 160 | 0.6% | thin:160<300 |
| es/premium-digital/wedding-planner.html | content | 156 | 0% | thin:156<300 |
| es/premium-digital/willow-market-bag.html | content | 158 | 0.6% | thin:158<300 |
| es/premium-digital-products.html | content | 113 | 0.9% | thin:113<300, struct:36%<45% |
| es/pricing.html | content | 143 | 0% | thin:143<300 |
| es/privacy.html | content | 143 | 0% | thin:143<300 |
| es/publisher.html | content | 143 | 0% | thin:143<300 |
| es/share.html | content | 143 | 0% | thin:143<300 |
| es/social-publisher.html | content | 148 | 0% | thin:148<300, struct:37%<45% |
| es/templates.html | content | 148 | 0% | thin:148<300, struct:13%<45% |
| es/terms.html | content | 143 | 0% | thin:143<300 |
| es/tools/index.html | nav | 45 | 4.4% | thin-nav:45<80 |
| es/tools/mi-direccion-ip.html | tool | 75 | 1.4% | not-functional:1<2 |
| es/unscrambler.html | content | 148 | 0% | thin:148<300, struct:37%<45% |
| es/video-studio.html | content | 141 | 0% | thin:141<300, struct:30%<45% |
| es/videos.html | content | 147 | 1.4% | thin:147<300 |

## fr

**PASS 1 页**（可放开 / 维持放开）

| 页面 | 类型 | 词数 | 英文残留 | 段落 | 结构比 | noindex |
|---|---|---|---|---|---|---|
| fr/index.html | nav | 99 | 0% | 6 | - | 已放开 |

**FAIL 32 页**（保持 / 回加 noindex）

| 页面 | 类型 | 词数 | 英文残留 | 未通过 |
|---|---|---|---|---|
| fr/about.html | content | 169 | 0% | thin:169<300 |
| fr/affiliate-marketing.html | content | 42 | 0% | doorway:en-redirect-pitch, thin:42<300, few-paras:3<4, struct:14%<45% |
| fr/ai-companion.html | content | 158 | 0% | thin:158<300 |
| fr/app-builder.html | content | 155 | 0% | thin:155<300 |
| fr/blog.html | content | 158 | 0% | thin:158<300, struct:12%<45% |
| fr/contact.html | content | 165 | 0% | thin:165<300 |
| fr/custom-web-design.html | content | 158 | 0% | thin:158<300, struct:26%<45% |
| fr/editorial-standards.html | content | 154 | 0% | thin:154<300 |
| fr/faq.html | content | 150 | 0% | thin:150<300 |
| fr/how-it-works.html | content | 151 | 0% | thin:151<300 |
| fr/ielts-course.html | content | 162 | 0% | thin:162<300, struct:35%<45% |
| fr/local-ai.html | content | 158 | 0% | thin:158<300, struct:30%<45% |
| fr/media-downloader.html | content | 150 | 0% | thin:150<300 |
| fr/order.html | content | 155 | 0% | thin:155<300, struct:44%<45% |
| fr/premium-digital/annual-budget.html | content | 166 | 0% | thin:166<300 |
| fr/premium-digital/dimple-dumpling.html | content | 157 | 1.3% | thin:157<300 |
| fr/premium-digital/finance-dashboard.html | content | 162 | 0% | thin:162<300 |
| fr/premium-digital/ghost-granny-square.html | content | 161 | 0% | thin:161<300 |
| fr/premium-digital/momo-shelf-ghost.html | content | 159 | 0.7% | thin:159<300 |
| fr/premium-digital/wedding-planner.html | content | 155 | 0% | thin:155<300 |
| fr/premium-digital/willow-market-bag.html | content | 157 | 0% | thin:157<300 |
| fr/premium-digital-products.html | content | 111 | 1% | thin:111<300, struct:36%<45% |
| fr/pricing.html | content | 155 | 0% | thin:155<300 |
| fr/privacy.html | content | 149 | 0% | thin:149<300 |
| fr/publisher.html | content | 153 | 0% | thin:153<300 |
| fr/share.html | content | 153 | 0% | thin:153<300 |
| fr/social-publisher.html | content | 158 | 0% | thin:158<300, struct:37%<45% |
| fr/templates.html | content | 158 | 0% | thin:158<300, struct:13%<45% |
| fr/terms.html | content | 153 | 0% | thin:153<300 |
| fr/unscrambler.html | content | 160 | 0% | thin:160<300, struct:37%<45% |
| fr/video-studio.html | content | 148 | 0% | thin:148<300, struct:30%<45% |
| fr/videos.html | content | 156 | 0% | thin:156<300 |

## ja

**PASS 11 页**（可放开 / 维持放开）

| 页面 | 类型 | 词数 | 英文残留 | 段落 | 结构比 | noindex |
|---|---|---|---|---|---|---|
| ja/tools/age-calculator.html | tool | 140 | 0% | 5 | - | 已放开 |
| ja/tools/calculator.html | tool | 163 | 0% | 9 | - | 已放开 |
| ja/tools/currency-converter.html | tool | 131 | 0% | 5 | - | 已放开 |
| ja/tools/image-compressor.html | tool | 157 | 0% | 5 | - | 已放开 |
| ja/tools/mortgage-calculator.html | tool | 185 | 0% | 6 | - | 已放开 |
| ja/tools/password-generator.html | tool | 167 | 0% | 5 | - | 已放开 |
| ja/tools/resize-image.html | tool | 145 | 0% | 5 | - | 已放开 |
| ja/tools/timer.html | tool | 130 | 0% | 5 | - | 已放开 |
| ja/tools/unit-converter.html | tool | 134 | 0% | 5 | - | 已放开 |
| ja/tools/word-counter.html | tool | 494 | 0% | 27 | - | 已放开 |
| ja/tools/world-clock.html | tool | 137 | 0% | 5 | - | 已放开 |

**FAIL 4 页**（保持 / 回加 noindex）

| 页面 | 类型 | 词数 | 英文残留 | 未通过 |
|---|---|---|---|---|
| ja/tools/bmi-calculator.html | tool | 91 | 0% | latin:25%>18% |
| ja/tools/index.html | nav | 59 | 0% | thin-nav:59<80 |
| ja/tools/qr-code-generator.html | tool | 149 | 0% | latin:23%>18% |
| ja/tools/what-is-my-ip.html | tool | 201 | 0% | latin:18%>18% |

## ko

**FAIL 8 页**（保持 / 回加 noindex）

| 页面 | 类型 | 词数 | 英文残留 | 未通过 |
|---|---|---|---|---|
| ko/premium-digital/annual-budget.html | content | 171 | 0% | latin:24%>18%, thin:171<300 |
| ko/premium-digital/dimple-dumpling.html | content | 171 | 14.3% | latin:20%>18%, thin:171<300 |
| ko/premium-digital/finance-dashboard.html | content | 169 | 0% | latin:23%>18%, thin:169<300 |
| ko/premium-digital/ghost-granny-square.html | content | 172 | 0% | latin:20%>18%, thin:172<300 |
| ko/premium-digital/momo-shelf-ghost.html | content | 176 | 6.3% | latin:22%>18%, thin:176<300 |
| ko/premium-digital/wedding-planner.html | content | 168 | 0% | latin:19%>18%, thin:168<300 |
| ko/premium-digital/willow-market-bag.html | content | 172 | 0% | latin:21%>18%, thin:172<300 |
| ko/premium-digital-products.html | content | 117 | 3.4% | latin:48%>18%, thin:117<300, struct:27%<45% |

## zh

**PASS 1 页**（可放开 / 维持放开）

| 页面 | 类型 | 词数 | 英文残留 | 段落 | 结构比 | noindex |
|---|---|---|---|---|---|---|
| zh/dianre-pijian-xuangou.html | content | 703 | 2.8% | 14 | - | 已放开 |

**FAIL 9 页**（保持 / 回加 noindex）

| 页面 | 类型 | 词数 | 英文残留 | 未通过 |
|---|---|---|---|---|
| zh/heated-shawl.html | content | 284 | 0% | latin:20%>18%, thin:284<300 |
| zh/premium-digital/annual-budget.html | content | 144 | 0% | latin:33%>18%, thin:144<300 |
| zh/premium-digital/dimple-dumpling.html | content | 151 | 0% | latin:21%>18%, thin:151<300 |
| zh/premium-digital/finance-dashboard.html | content | 144 | 0% | latin:23%>18%, thin:144<300 |
| zh/premium-digital/ghost-granny-square.html | content | 148 | 0% | thin:148<300, struct:44%<45% |
| zh/premium-digital/momo-shelf-ghost.html | content | 156 | 5.6% | latin:23%>18%, thin:156<300 |
| zh/premium-digital/wedding-planner.html | content | 156 | 8.3% | thin:156<300 |
| zh/premium-digital/willow-market-bag.html | content | 148 | 0% | latin:19%>18%, thin:148<300 |
| zh/premium-digital-products.html | content | 99 | 0% | latin:27%>18%, thin:99<300, few-paras:2<4, struct:9%<45% |
