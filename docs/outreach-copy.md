# 外联文案（可直接粘贴）

> 全部按站点实际内容写：19 个纯浏览器工具 + AI 工具增长榜 + 三篇排错案例。
> 不要改数字。19 是 `/embed/` 里能嵌的数量，16 是首页展示的数量，别混用。

---

## A. 目录提交：短版（60 词，多数目录的字数上限）

```
HaoWordTool is a collection of 19 free browser-based tools — word counter,
text diff, QR codes, image compression, unit and currency conversion,
calculators, timers, a world clock. Everything runs client-side: no upload,
no account, no server round-trip. There is also a public tracker of AI tool
sites ranked by measured growth, updated from crawl data.
```

## B. 目录提交：长版（160 词）

```
HaoWordTool started as a word-game solver and grew into a small utilities
site. It now hosts 19 tools that all run entirely in the browser: a word
counter with reading-time estimates, a side-by-side text diff, QR code
generation, JPG/PNG compression and resizing, unit and currency converters,
BMI / age / mortgage calculators, a timer, a world clock, and a public-IP
checker. Nothing is uploaded — image work happens on a canvas in your tab,
so files never leave the device.

Alongside the tools there is a growth tracker for AI tool sites. It ranks
properties by measured traffic change rather than by who paid for placement,
and the crawl method plus capture dates are published on the page so the
numbers can be checked.

No sign-up, no paywall, no watermark. Tools can be embedded on other sites
via a copy-paste iframe snippet at /embed/.
```

## C. Show HN

**标题**（HN 标题别用形容词，直接说做了什么）：

```
Show HN: 19 browser-only utilities, no upload, no account
```

**正文**：

```
I kept needing small utilities and kept landing on pages that wanted an
account, or uploaded my file to a server to count words in it. So I built
the ones I actually use and kept them client-side.

What's there: word counter with reading time, text diff, QR generator,
image compressor and resizer (canvas, file never leaves the tab), unit and
currency converter, BMI / age / mortgage calculators, timer, world clock,
public IP check.

Things I got wrong along the way, in case it's useful:

- Serving /tools/text-diff and /tools/text-diff/ as two URLs while both
  declared themselves canonical. Two languages, no hreflang, so Google had
  no reason to pick either.
- A sitemap index where the loc values were missing a slash — 189 URLs
  resolved to a host that doesn't exist, and nothing errored. Search Console
  just showed zero discovered pages.
- Putting the tool's JS after </main>, then extracting only <main> for the
  embeddable version. Result: a page full of inputs that did nothing.

The iframe snippets at /embed/ are the honest version of "link to us" —
use the tool on your own page instead of linking to mine.

No tracking script inside the frames, no ads in them.
```

## D. Reddit r/InternetIsBeautiful

**标题**：

```
19 utilities that all run in your browser tab — word counter, text diff, image compressor, QR, converters
```

**正文**：

```
All client-side. The image compressor and resizer work on a canvas, so the
file never gets uploaded anywhere — you can watch it work with the network
tab open.

Direct links if you want to skip the index:
- /tools/text-diff.html — side-by-side diff, highlights changed lines
- /tools/image-compressor.html — JPG/PNG, quality slider
- /tools/word-counter.html — words, characters, reading time
- /tools/qr-code-generator.html — PNG download, no expiry
- /tools/unit-converter.html — length, weight, temperature

There's an embed page too (/embed/) if you'd rather have one of these on
your own site than a link.
```

> 发帖注意：这个 sub 对自推很敏感。先在别的帖子下有真实互动，发的时候
> 别用营销语气，别在标题里带站名。

## E. awesome-list PR 描述

适用于 `awesome-web-tools`、`awesome-selfhosted`（不收 SaaS，跳过）、
`awesome-productivity`、`awesome-developer-tools` 这类仓库。

**PR 标题**：

```
Add HaoWordTool — 19 browser-only utilities (no upload, no account)
```

**PR 正文**：

```
### What it is

A set of 19 small utilities that run entirely client-side: word counter,
text diff, QR generator, image compressor/resizer, unit and currency
converters, BMI/age/mortgage calculators, timer, world clock, IP check.

### Why it fits this list

- Every tool works without an account and without uploading data.
- Source of the tools is plain HTML/JS, readable in the page.
- Free, no paywall, no watermark on output.
- Tools can be embedded elsewhere via iframe, so it also works as a
  component rather than only as a destination.

### Category

Added under `Utilities` / `Text` (whichever the list uses).

### Note

One person's project. Happy to adjust the entry format to match the list's
conventions — just tell me which section you'd prefer.
```

## F. 嵌入式工具外联（邮件，一对一）

**主题**：

```
Your <post title> is missing a working <tool> — here's one you can embed
```

**正文**：

```
Hi <name>,

I read <post title> (<URL>) — the section on <specific thing they wrote about>
is the part I'd send people to.

You link to <competitor/tool> for <task>, but it asks for an account before
it does anything. I built a version that doesn't: <tool URL>. It runs in the
browser, nothing is uploaded.

If it's useful, there's a copy-paste iframe snippet here: <embed URL>. It
renders the tool inline on your page with a small attribution link. No
tracking script inside the frame, no ads.

If you'd rather just link, that works too. Either way, thanks for writing the
piece — the <specific detail> part answered a question I'd had for a while.

<your name>
```

> 三条纪律：
> 1. 第一段必须引用他文章里的**具体内容**，证明你真读了。群发的邮件在这一步就露馅。
> 2. 只提一个工具，不提「我们有一整套」。
> 3. 每封不超过 120 词。超过就没人看。

## G. AI 榜单的可引用格式

给写「AI 工具推荐」的人一段可以直接抄的引用块，降低引用成本：

```
Source: HaoWordTool AI Tool Growth Tracker, captured 2026-10-26.
Method: <crawl window and metric used>. Full table: https://haowordtool.com/ai-tools/rank/
```

配一个 CSV 下载（`/data/ai-tools-rank.csv`），首行写：

```
# Data by HaoWordTool (https://haowordtool.com/ai-tools/rank/), captured 2026-10-26. Please keep this line when redistributing.
```
