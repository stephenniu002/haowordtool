#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
zh-home-update.py — 更新 /zh/ 首页
  1. 导航加 Pro 入口
  2. 首页榜单改为「免费额度内的前 10 名」，与 rank 页一致（原来混入了第 11-19 名，等于泄露付费行）
  3. 榜单后插入「相关链接」区块

原子写：先写 .tmp 再 os.replace。
可复跑：已注入的标记会被跳过。
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HOME = os.path.join(ROOT, "zh", "index.html")
DATA = os.path.join(ROOT, "data", "ai-growth-index.json")

with open(HOME, encoding="utf-8") as f:
    html = f.read()

with open(DATA, encoding="utf-8") as f:
    data = json.load(f)

free_rows = [r for r in data["records"] if r.get("is_free")]


def esc(s):
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ---------- 1. 导航加 Pro ----------
if 'href="/zh/pricing/"' not in html.split("</header>")[0]:
    html = html.replace(
        '    <a class="l" href="/services/">服务</a>\n',
        '    <a class="l" href="/services/">服务</a>\n    <a class="l" href="/zh/pricing/">Pro</a>\n',
        1,
    )
    print("[ok] 导航加 Pro 入口")
else:
    print("[=] 导航已有 Pro 入口")

# ---------- 2. 重写首页榜单 tbody ----------
rows_html = []
for r in free_rows:
    tags = " ".join(
        '<span class="tag">%s</span>' % esc(t)
        for t in [r["category"]] + ([r["category_extra"]] if r.get("category_extra") else [])
        if t
    )
    growth = r.get("mom_growth_pct")
    growth_html = (
        '<td class="up">+%d%%</td>' % growth if growth is not None else '<td class="num">—</td>'
    )
    rows_html.append(
        '        <tr>\n'
        '          <td class="rk">%d</td>\n'
        '          <td>\n'
        '            <span class="dom">%s</span>\n'
        '            <span class="dname">%s</span>\n'
        '            <span class="desc">%s</span>\n'
        '          </td>\n'
        '          <td class="tags">%s</td>\n'
        '          <td class="num">%s</td>\n'
        '          %s\n'
        '        </tr>\n' % (
            r["rank"], esc(r["domain"]), esc(r["name"]), esc(r["description"]),
            tags, esc(r["visits_label"]), growth_html,
        )
    )

new_tbody = "<tbody>\n\n" + "\n".join(rows_html) + "    </tbody>"

# 只在 rank-sec 区间内替换。
# 正则带 ([ \t]*) 捕获原有的前导缩进：不带的话每跑一次就多叠 4 个空格，
# 跑三次 tbody 就飘到页面中间了。
sec_start = html.find('<section class="rank-sec">')
sec_end = html.find("</section>", sec_start)
if sec_start < 0 or sec_end < 0:
    sys.exit("[x] 未找到 rank-sec 区块")

segment = html[sec_start:sec_end]
new_segment, n = re.subn(
    r"[ \t]*<tbody[^>]*>[\s\S]*?</tbody>",
    lambda m: "    " + new_tbody,
    segment,
    count=1,
)
if n != 1:
    sys.exit("[x] 榜单 tbody 替换失败")

html = html[:sec_start] + new_segment + html[sec_end:]
print("[ok] 首页榜单改为前 %d 名（与免费额度一致）" % len(free_rows))

# ---------- 3. 榜单底部链接 ----------
old_more = '  <a class="more" href="/ai-tools/rank/">查看完整榜单 →</a>'
new_more = (
    '  <div class="rank-more">\n'
    '    <a class="more" href="/ai-tools/rank/">查看完整榜单（19 行）→</a>\n'
    '    <span class="rank-more-note">另有 %d 个站在 Pro 里，含绝对访问量与逐期快照 · <a href="/zh/pricing/">看方案</a></span>\n'
    '  </div>'
) % (data["summary"]["total_sites"] - len(free_rows))

if old_more in html:
    html = html.replace(old_more, new_more, 1)
    print("[ok] 榜单底部加 Pro 提示")
else:
    print("[=] 榜单底部链接已是新版本")

# ---------- 4. 相关链接区块 ----------
if "<!-- related-links:start -->" in html:
    print("[=] 相关链接区块已存在，跳过")
else:
    groups = [
        {
            "title": "免费工具",
            "desc": "16 个高频工具，纯浏览器运行",
            "links": [
                ("全部工具", "/tools/"),
                ("计算与换算", "/tools/calculator.html"),
                ("单位换算", "/tools/unit-converter.html"),
                ("字数统计", "/tools/word-counter.html"),
                ("图片压缩", "/tools/image-compressor.html"),
                ("开发调试", "/tools/json-formatter.html"),
            ],
        },
        {
            "title": "AI 工具情报",
            "desc": "增长榜、收入案例、每日观察",
            "links": [
                ("增长榜", "/ai-tools/rank/"),
                ("AI 工具库", "/ai-tools/"),
                ("收入案例拆解", "/ai/income.html"),
                ("每日观察", "/ai/daily-2026-10-17.html"),
                ("AI 导航", "/ai-nav.html"),
                ("一人公司指南", "/ai-one-person-company-guide.html"),
            ],
        },
        {
            "title": "指南与案例",
            "desc": "把方法写清楚，而不是只给结论",
            "links": [
                ("全部指南", "/guides/"),
                ("洞察与复盘", "/blog.html"),
                ("字母重排怎么解", "/guides/how-to-unscramble-letters-systematically.html"),
                ("正则表达式速查", "/tools/regex-tester.html"),
                ("JWT 解析", "/tools/jwt-decoder.html"),
                ("编辑方针", "/editorial-policy.html"),
            ],
        },
        {
            "title": "服务",
            "desc": "要人做的部分",
            "links": [
                ("全部服务", "/services/"),
                ("网页设计", "/en/services/website-design.html"),
                ("Logo 设计", "/en/services/logo-design.html"),
                ("视频剪辑", "/en/services/video-editing.html"),
                ("AI 工作室", "/ai-studio.html"),
                ("算力出海", "/suanli-chuhai.html"),
            ],
        },
        {
            "title": "站务",
            "desc": "规则、定价、怎么找到人",
            "links": [
                ("Pro 定价", "/zh/pricing/"),
                ("关于本站", "/about.html"),
                ("常见问题", "/faq.html"),
                ("工作方式", "/how-it-works.html"),
                ("联系我们", "/contact.html"),
                ("隐私与条款", "/privacy.html"),
            ],
        },
    ]

    cards = []
    for g in groups:
        lis = "".join(
            '<li><a href="%s">%s</a></li>' % (esc(href), esc(label))
            for label, href in g["links"]
        )
        cards.append(
            '    <div class="rl-card">\n'
            '      <h3>%s</h3>\n'
            '      <p>%s</p>\n'
            '      <ul>%s</ul>\n'
            '    </div>' % (esc(g["title"]), esc(g["desc"]), lis)
        )

    block = (
        '\n<!-- related-links:start -->\n'
        '<section class="related-links"><div class="wrap">\n'
        '  <div class="sec-head">\n'
        '    <h2>相关链接</h2>\n'
        '    <span class="hint">按用途分组 · 都在这个站内</span>\n'
        '  </div>\n'
        '  <div class="rl-grid">\n'
        + "\n".join(cards) + "\n"
        '  </div>\n'
        '</div></section>\n'
        '<!-- related-links:end -->\n'
    )

    # 插在榜单区块之后
    marker = html.find('<section class="rank-sec">')
    close = html.find("</section>", marker) + len("</section>")
    html = html[:close] + block + html[close:]
    print("[ok] 插入相关链接区块（5 组 %d 个链接）" % sum(len(g["links"]) for g in groups))

# ---------- 5. 样式 ----------
CSS = """
/* related links */
.related-links{padding:52px 0 56px;border-top:1px solid var(--line);background:var(--white)}
.related-links .sec-head h2{font-family:var(--font-display);font-size:28px;font-weight:600}
.rl-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
.rl-card{border:1px solid var(--line);border-radius:12px;padding:18px 18px 14px;background:var(--white)}
.rl-card h3{font-size:14px;font-weight:700;color:var(--dusk);margin:0 0 4px}
.rl-card p{font-size:12px;color:var(--mute);margin:0 0 12px;line-height:1.5}
.rl-card ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
/* 用 flex 而不是 inline-flex：inline-flex 的宽度由内容决定，
   卡片窄到 169px 时长文案（"增长榜（免费 10 行）"）会顶出卡片边界，不换行 */
.rl-card li a{font-size:13px;color:#2b3542;display:flex;align-items:flex-start;gap:5px;line-height:1.4;min-width:0;overflow-wrap:anywhere}
.rl-card li a::before{content:"→";color:var(--sea);font-size:11px;opacity:.55;flex:0 0 auto;margin-top:2px}
.rl-card li a:hover{color:var(--sea)}
.rank-more{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;margin-top:20px}
.rank-more .more{margin-top:0}
.rank-more-note{font-size:12.5px;color:var(--mute)}
.rank-more-note a{color:var(--sea);font-weight:600}
@media(max-width:900px){.rl-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:640px){.rl-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
"""

if "/* related links */" not in html:
    anchor = "@media(max-width:820px){.langbtn span.lbl{display:none}}"
    if anchor in html:
        html = html.replace(anchor, anchor + "\n" + CSS, 1)
    else:
        html = html.replace("</style>", CSS + "\n</style>", 1)
    print("[ok] 样式已注入")

# ---------- 原子写 ----------
tmp = HOME + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    f.write(html)
os.replace(tmp, HOME)
print("[ok] 写入 zh/index.html（%d 字节）" % len(html.encode("utf-8")))
