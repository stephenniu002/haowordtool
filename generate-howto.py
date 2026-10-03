#!/usr/bin/env python3
"""Generate 8 How to Play pages for haowordtool.com"""
import json
import os

CSS = """:root{--bg:#ffffff;--text:#1a1a2e;--muted:#6b7280;--border:#e5e7eb;--accent:#2563eb;--accent-hover:#1d4ed8;--panel:#f9fafb;--radius:10px;--max-w:820px}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"PingFang SC","Microsoft YaHei",sans-serif;color:var(--text);background:var(--bg);line-height:1.8;font-size:16px;-webkit-font-smoothing:antialiased}
.container{max-width:var(--max-w);margin:0 auto;padding:0 20px}
header{border-bottom:1px solid var(--border);padding:16px 0;background:#fff;position:sticky;top:0;z-index:100}
.header-inner{display:flex;align-items:center;justify-content:space-between;max-width:var(--max-w);margin:0 auto;padding:0 20px}
.logo{font-weight:700;font-size:18px;color:var(--text);text-decoration:none;letter-spacing:-0.01em}
.logo span{color:var(--accent)}
nav a{color:var(--muted);text-decoration:none;font-size:14px;margin-left:20px}
nav a:hover{color:var(--text)}
.breadcrumb{font-size:13px;color:var(--muted);padding:16px 0 0}
.breadcrumb a{color:var(--muted);text-decoration:none}
.breadcrumb a:hover{color:var(--accent)}
.breadcrumb span{margin:0 6px}
h1{font-size:28px;font-weight:700;line-height:1.4;letter-spacing:-0.02em;margin:20px 0 6px}
.subtitle{color:var(--muted);font-size:15px;margin-bottom:8px}
.update-date{color:#9ca3af;font-size:13px;margin-bottom:24px}
.ad-slot{background:var(--panel);border:1px dashed var(--border);border-radius:var(--radius);padding:20px;text-align:center;color:#9ca3af;font-size:12px;letter-spacing:0.05em;text-transform:uppercase;margin:24px 0;min-height:90px;display:flex;align-items:center;justify-content:center}
h2{font-size:21px;font-weight:700;margin:40px 0 14px;letter-spacing:-0.01em}
h3{font-size:17px;font-weight:600;margin:26px 0 10px}
p{margin-bottom:16px;color:#374151}
ul,ol{margin:0 0 16px 22px;color:#374151}
li{margin-bottom:8px}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.quick-facts{width:100%;border-collapse:collapse;margin:16px 0;font-size:15px}
.quick-facts th,.quick-facts td{border:1px solid var(--border);padding:10px 14px;text-align:left}
.quick-facts th{background:var(--panel);font-weight:600;width:35%}
.diff-table{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px}
.diff-table th,.diff-table td{border:1px solid var(--border);padding:10px 12px;text-align:left;vertical-align:top}
.diff-table th{background:var(--panel);font-weight:600}
.howto-step{display:flex;gap:16px;margin:18px 0;padding:16px;border:1px solid var(--border);border-radius:var(--radius);background:#fff}
.step-num{flex-shrink:0;width:36px;height:36px;border-radius:50%;background:var(--accent);color:#fff;font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center}
.step-content{flex:1}
.step-title{font-weight:600;font-size:16px;margin-bottom:4px;color:var(--text)}
.step-text{color:#4b5563;font-size:15px;margin:0}
.faq-item{border-bottom:1px solid var(--border);padding:16px 0}
.faq-item:last-child{border-bottom:none}
.faq-q{font-weight:600;font-size:16px;margin-bottom:6px;color:var(--text)}
.faq-a{color:#4b5563;font-size:15px;margin:0}
.related-games{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0 40px}
.related-games a{display:block;border:1px solid var(--border);border-radius:var(--radius);padding:16px;text-decoration:none;color:var(--text);transition:all 0.15s;position:relative}
.related-games a:hover{border-color:var(--accent);box-shadow:0 2px 8px rgba(37,99,235,0.08);text-decoration:none}
.related-games .r-title{font-weight:600;font-size:15px;margin-bottom:4px}
.related-games .r-desc{font-size:13px;color:var(--muted)}
.related-games .r-badge{display:inline-block;margin-top:8px;font-size:11px;font-weight:600;color:var(--accent);background:#eff6ff;padding:2px 8px;border-radius:4px}
.btn-primary{display:inline-block;background:var(--accent);color:#fff;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none}
.btn-primary:hover{background:var(--accent-hover);color:#fff;text-decoration:none}
footer{border-top:1px solid var(--border);padding:32px 0;margin-top:40px;font-size:13px;color:var(--muted)}
.footer-inner{max-width:var(--max-w);margin:0 auto;padding:0 20px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px}
.footer-inner a{color:var(--muted);text-decoration:none;margin-left:16px}
.footer-inner a:hover{color:var(--accent)}
@media (max-width:600px){h1{font-size:23px}h2{font-size:19px}.howto-step{flex-direction:column;gap:10px}nav a{margin-left:12px;font-size:13px}}"""

TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{TITLE}}</title>
<meta name="description" content="{{META_DESC}}">
<link rel="canonical" href="{{CANONICAL}}">
<meta property="og:title" content="{{H1}}">
<meta property="og:description" content="{{META_DESC}}">
<meta property="og:url" content="{{CANONICAL}}">
<meta property="og:type" content="article">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"HowTo","name":"{{H1}}","description":"{{META_DESC}}","totalTime":"PT10M","inLanguage":"zh-CN","step":{{HOWTO_STEPS_JSON}}}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","inLanguage":"zh-CN","mainEntity":{{FAQ_JSON}}}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
{"@type":"ListItem","position":1,"name":"首页","item":"https://haowordtool.com/"},
{"@type":"ListItem","position":2,"name":"游戏攻略","item":"https://haowordtool.com/games/"},
{"@type":"ListItem","position":3,"name":"{{GAME_NAME}}","item":"https://haowordtool.com{{GUIDE_URL}}"},
{"@type":"ListItem","position":4,"name":"How to Play","item":"{{CANONICAL}}"}
]}
</script>
<style>
""" + CSS + """
</style>
</head>
<body>
<header>
  <div class="header-inner">
    <a href="/" class="logo">hao<span>word</span>tool</a>
    <nav><a href="/tools/">工具</a><a href="/games/">游戏攻略</a><a href="/about/">关于</a></nav>
  </div>
</header>
<main class="container">
  <div class="breadcrumb"><a href="/">首页</a><span>›</span><a href="/games/">游戏攻略</a><span>›</span><a href="{{GUIDE_URL}}">{{GAME_NAME}}</a><span>›</span>How to Play</div>
  <h1>{{H1}}</h1>
  <p class="subtitle">{{SUBTITLE}}</p>
  <p class="update-date">最后更新：2026 年 10 月 3 日</p>
  <div class="ad-slot">Advertisement</div>
  <h2>开始之前</h2>
  <p>{{INTRO}}</p>
  <h2>怎么玩 — 分步指南</h2>
  {{HOWTO_STEPS_HTML}}
  <div class="ad-slot">Advertisement</div>
  <h2>操作说明</h2>
  <table class="quick-facts">
    {{CONTROLS_ROWS}}
  </table>
  <h2>核心机制</h2>
  {{CORE_MECHANICS_HTML}}
  <h2>新手技巧</h2>
  <ol>
    {{BEGINNER_TIPS_HTML}}
  </ol>
  <h2>常见新手错误</h2>
  <table class="diff-table">
    <tr><th>错误</th><th>后果</th><th>修正</th></tr>
    {{MISTAKES_ROWS}}
  </table>
  <div class="ad-slot">Advertisement</div>
  <h2>常见问题 FAQ</h2>
  {{FAQ_ITEMS_HTML}}
  <h2>继续阅读</h2>
  <div class="related-games">
    <a href="{{GUIDE_URL}}">
      <div class="r-title">{{GAME_NAME}} 攻略</div>
      <div class="r-desc">发售日、平台、版本对比与完整信息</div>
      <span class="r-badge">Hub</span>
    </a>
    {{RELATED_CARDS}}
  </div>
  <div class="ad-slot">Advertisement</div>
</main>
<footer>
  <div class="footer-inner">
    <div>© 2026 haowordtool.com</div>
    <div><a href="/about/">关于</a><a href="/privacy/">隐私政策</a><a href="/contact/">联系我们</a></div>
  </div>
</footer>
</body>
</html>"""

# All 8 games data (from user's spec)
GAMES = [
{
  "slug": "how-to-play-gta-6",
  "game_name": "GTA 6",
  "guide_url": "/games/gta-6/",
  "canonical": "https://haowordtool.com/games/how-to-play-gta-6/",
  "title": "How to Play GTA 6 — Controls, Characters & Beginner Guide (2026)",
  "meta_desc": "GTA 6 怎么玩？双主角切换、操作说明、核心玩法、新手入门技巧。2026 年 11 月 19 日发售后可用。",
  "h1": "How to Play GTA 6 — 操作、角色与新手入门",
  "subtitle": "双主角切换、操作说明、核心机制、新手技巧全解析。",
  "intro": "GTA 6 是系列首款双主角开放世界游戏，玩家可随时在 Jason 和 Lucia 之间切换。发售后，本页面会补充实际操作方法。目前先基于官方公布信息整理已知的操作和机制。",
  "howto_steps": [
    ["启动游戏", "PS5 或 Xbox Series X|S 主机上启动 GTA 6，完成首次启动的亮度、HDR 和字幕设置。"],
    ["完成开场教程", "游戏从序章开始，会引导你熟悉基础移动、射击和驾驶操作。跟随提示完成即可。"],
    ["学习角色切换", "双主角设定下，可在自由探索时随时切换 Jason 和 Lucia。切换点通常在两人距离较近或剧情允许时可用。"],
    ["熟悉移动操作", "左摇杆控制移动，右摇杆控制视角。按住加速键冲刺，下蹲键进入潜行。"],
    ["熟悉驾驶操作", "进入任何车辆后，RT/R2 加速，LT/L2 刹车/倒车，左摇杆转向。手柄震动会提示路况。"],
    ["学习射击系统", "LT/L2 进入瞄准，RT/R2 开火。掩体系统按 LB/L1 贴靠，可以盲射或探头射击。"],
    ["管理通缉星级", "犯罪会触发通缉星级，最高 6 星。逃脱方式包括离开警察视野、换车、进入地铁或藏匿点。"],
    ["打开手机和地图", "手机用于接收任务、拍照、直播。地图可以设置导航点、查看任务标记和收藏地点。"],
    ["完成支线活动", "健身房、台球、餐厅、共享出行等是核心支线，影响角色属性和关系发展。"],
    ["记录进度", "游戏支持自动存档，也可以在安全屋手动存档。建议在重大任务前手动存一次。"]
  ],
  "controls": [
    ["移动", "左摇杆 / WASD"],
    ["视角", "右摇杆 / 鼠标"],
    ["冲刺", "按住 L3 / Shift"],
    ["跳跃", "X / 空格"],
    ["下蹲/潜行", "L3 或 R3 / Ctrl"],
    ["瞄准", "LT / 右键"],
    ["射击", "RT / 左键"],
    ["换武器", "方向键 / 数字键"],
    ["互动/拾取", "△ / E"],
    ["打开手机", "↑ / 滚轮"],
    ["打开地图", "触摸板 / M"],
    ["切换主角", "长按 ↓ / 长按 Tab"]
  ],
  "core_mechanics": [
    ["双主角系统", "Jason 和 Lucia 各有独立属性、技能和装备。某些任务只能由特定主角触发。"],
    ["通缉星级", "最高 6 星。星级越高，追捕的警力和手段越强。"],
    ["动态天气", "包含局部降雨、热带风暴、飓风、积水残留和彩虹。"],
    ["角色体型", "在健身房增肌或在餐厅过量进食都会影响体型，进而影响耐力和外观。"],
    ["直播系统", "可以为自己举办完整的直播，观众反应会影响游戏内收益。"],
    ["共享出行", "召唤车辆时可与 NPC 共乘，触发随机对话和社交事件。"]
  ],
  "beginner_tips": [
    "先完成序章教程，熟悉移动和驾驶手感再进入自由探索。",
    "早期优先升级车辆和武器，钱不要全花在服装上。",
    "双主角切换时留意任务提示，部分任务会锁定当前角色。",
    "遇到 3 星以上通缉时，换车、进隧道、进地铁是最快的脱身方式。",
    "支线活动和随机事件会影响角色关系和后期剧情选项。"
  ],
  "mistakes": [
    ["忽略双主角切换", "错过特定任务和剧情分支", "定期切换主角查看可用任务"],
    ["一上来就冲主线", "错过大量支线收益和道具", "主线间隔期做支线和随机事件"],
    ["被通缉时硬刚", "星级快速上升，逃脱难度大", "换车 + 进地下 + 离开视野"],
    ["把钱全花在装饰上", "武器和车辆升级跟不上", "优先升级车辆和武器"],
    ["不手动存档", "任务失败后重复进度", "重大任务前手动存一次"]
  ],
  "faq": [
    ["GTA 6 怎么切换主角？", "自由探索时长按方向键下（或长按 Tab）打开角色切换界面，选择 Jason 或 Lucia。任务中通常锁定当前角色。"],
    ["GTA 6 怎么逃脱通缉？", "换车、进入地铁隧道、离开警察视野、进入藏匿点都可以降低通缉星级。"],
    ["GTA 6 有新手教程吗？", "有。序章会引导你熟悉移动、射击和驾驶。"],
    ["GTA 6 支持中文吗？", "支持。包含简体中文和繁体中文。"],
    ["GTA 6 能离线玩吗？", "单人战役可以离线游玩。在线模式发售后才会上线。"],
    ["GTA 6 手柄和键盘都能用吗？", "PS5 和 Xbox 用主机手柄，PC 版未官宣。目前官方未公布 PC 操作方案。"]
  ]
},
{
  "slug": "how-to-play-phantom-blade-zero",
  "game_name": "Phantom Blade Zero",
  "guide_url": "/games/phantom-blade-zero/",
  "canonical": "https://haowordtool.com/games/how-to-play-phantom-blade-zero/",
  "title": "How to Play Phantom Blade Zero — Combat, Weapons & Difficulty Guide",
  "meta_desc": "影之刃零怎么玩？战斗系统、武器重铸、难度模式、新手入门技巧全解析。2026 年 10 月 29 日发售。",
  "h1": "How to Play Phantom Blade Zero — 战斗、武器与难度指南",
  "subtitle": "Kungfupunk 战斗、30+ 主武器、四档难度、新手技巧全解析。",
  "intro": "《影之刃零》是第三人称武侠动作 RPG，主打快节奏剑术和电影化武术。核心不是魂类高惩罚，而是「高速战斗 + 深度养成」。",
  "howto_steps": [
    ["选择难度模式", "首次启动时选择：Wayfarer（电影化，战斗轻松）、Pathbreaker（平衡）、Hellwalker（高难）或六十六日模式（永久死亡）。新手建议 Wayfarer。"],
    ["完成序章战斗", "序章会教你基础攻击、闪避和格挡。跟随提示完成即可。"],
    ["熟悉武器切换", "主武器和副武器「影之武」可以随时切换。切换时注意武器动画和冷却。"],
    ["学习武器重铸", "升级错武器不用担心。找到重铸功能，取回全部材料，重新投资到新武器上。"],
    ["掌握副武器系统", "25 种「影之武」包括大斧、弓箭、喷火狮子头等。部分副武器可以远程发射。"],
    ["练习闪避和格挡", "敌人攻击前有预警动作。闪避到敌人背后可以进行背刺，格挡可以反击。"],
    ["探索影境世界", "八个地点包括庞镇和幻境。支线任务可能开启新故事路径和稀有物品。"],
    ["使用召唤系统", "战斗中可召唤协助，也可从远处击倒敌人。Boss 战时尤其有用。"],
    ["管理 66 天设定", "主线剧情与「66 天」设定相关。部分模式死亡会消耗天数，归零即永久死亡。"],
    ["记录进度", "游戏支持手动存档。建议在 Boss 战前存一次，避免反复重来。"]
  ],
  "controls": [
    ["移动", "左摇杆 / WASD"],
    ["视角", "右摇杆 / 鼠标"],
    ["轻攻击", "□ / 左键"],
    ["重攻击", "△ / 右键"],
    ["副武器", "R1 / Q"],
    ["闪避", "○ / 空格"],
    ["格挡/招架", "L1 / Shift"],
    ["切换主武器", "方向键上 / 数字键 1-3"],
    ["使用召唤", "R2 / E"],
    ["互动/拾取", "△ / F"]
  ],
  "core_mechanics": [
    ["Kungfupunk 战斗", "传统剑术 + 快节奏武术 + 现代摇滚音乐。战斗包含血条和杀气槽机制。"],
    ["武器重铸", "升级错武器可以取回全部材料，重新投资。鼓励尝试不同武器组合。"],
    ["Apex 配件", "武器满级后解锁，提供独特效果，不占用常规配件槽。"],
    ["影之武副武器", "25 种副武器，包括大斧、弓箭、喷火狮子头等。部分可远程发射。"],
    ["四档难度", "Wayfarer、Pathbreaker、Hellwalker、六十六日模式。六十六日模式死亡会消耗生命天数。"],
    ["召唤系统", "战斗中召唤协助，也可以从远处击倒敌人。"]
  ],
  "beginner_tips": [
    "新手从 Wayfarer 模式开始，先熟悉剧情和战斗节奏。",
    "不要害怕换武器。重铸系统允许取回全部材料。",
    "每把武器升到满级再决定是否重铸，这样能最大化材料利用。",
    "探索支线任务会开启新故事路径和稀有物品，不要只冲主线。",
    "Boss 战前手动存档，避免反复重来。"
  ],
  "mistakes": [
    ["直接选最高难度", "挫败感强，体验差", "从 Wayfarer 开始"],
    ["不敢换武器", "错过更适合的打法", "用重铸系统取回材料"],
    ["忽略支线任务", "错过故事路径和稀有物品", "探索时多与 NPC 互动"],
    ["不用召唤系统", "战斗手段单一", "善用召唤协助"],
    ["Boss 战前不存档", "失败后重复进度", "重大战斗前手动存一次"]
  ],
  "faq": [
    ["Phantom Blade Zero 怎么玩？", "第三人称武侠动作 RPG，操作主角「魂」在影境世界中战斗和探索。战斗以快节奏剑术和副武器切换为核心。"],
    ["Phantom Blade Zero 是魂类游戏吗？", "不是。开发团队明确表示它是武侠动作 RPG，不是 Soulslike。"],
    ["Phantom Blade Zero 怎么换武器？", "主武器和副武器可以随时切换。升级错的武器可以通过重铸取回材料。"],
    ["Phantom Blade Zero 有几个难度？", "四档：Wayfarer、Pathbreaker、Hellwalker、六十六日模式。"],
    ["Phantom Blade Zero 有新手教程吗？", "有。序章会引导你熟悉基础攻击、闪避和格挡。"],
    ["Phantom Blade Zero 支持中文吗？", "支持。包含简体中文和繁体中文。"]
  ]
},
{
  "slug": "how-to-play-cod-modern-warfare-4",
  "game_name": "COD: Modern Warfare 4",
  "guide_url": "/games/cod-modern-warfare-4/",
  "canonical": "https://haowordtool.com/games/how-to-play-cod-modern-warfare-4/",
  "title": "How to Play COD: Modern Warfare 4 — Controls, Maps & Loadouts",
  "meta_desc": "现代战争4怎么玩？操作说明、12 张多人地图、DMZ 模式、33 种武器、Gunny 配枪系统与新手入门技巧。",
  "h1": "How to Play COD: Modern Warfare 4 — 操作、地图与配枪",
  "subtitle": "操作说明、多人地图、DMZ 模式、Gunny 配枪与新手技巧全解析。",
  "intro": "《现代战争4》回归扎实的 6v6 地面战斗，采用全新「弹道机制」，移除随机扩散，每一枪都真实。首发包含战役、多人和 DMZ 三大模式。",
  "howto_steps": [
    ["完成训练关", "首次启动会进入训练关，熟悉基础移动、射击、瞄准和投掷。"],
    ["选择模式", "主菜单有战役、多人和 DMZ 三个入口。新手建议先打战役熟悉手感。"],
    ["完成战役第一章", "战役设定在朝鲜半岛，你扮演年轻韩国士兵朴玄俊。第一章会教你掩体、探头和基础战术。"],
    ["进入多人模式", "选择 Team Deathmatch 或 Domination 熟悉地图。首发有 12 张全新 6v6 地图。"],
    ["配置武器", "进入枪匠界面，选择主武器和副武器。用 Gunny 一键切换近距离/均衡/远距离配置。"],
    ["测试武器", "在射击场测试新武器，比较配件和性能，再进入对局。"],
    ["熟悉地图", "Kill Block 每回合重新配置布局，其他地图也有动态元素。多打几局熟悉路线。"],
    ["尝试 DMZ 模式", "DMZ 设定在 Khajin 禁区。支持单人或小队部署，目标是完成目标并撤离。"],
    ["解锁 Apex 配件", "武器满级后解锁 Apex 配件，提供独特效果，不占用常规配件槽。"],
    ["调整设置", "根据习惯调整灵敏度、视野范围、按键布局和辅助瞄准。"]
  ],
  "controls": [
    ["移动", "左摇杆 / WASD"],
    ["视角", "右摇杆 / 鼠标"],
    ["射击", "RT / 左键"],
    ["瞄准", "LT / 右键"],
    ["换弹", "□ / R"],
    ["换武器", "△ / Q"],
    ["近战", "R3 / V"],
    ["投掷", "R1 / G"],
    ["战术冲刺", "双击 L3 / 双击 Shift"],
    ["下蹲/滑铲", "○ / Ctrl"],
    ["卧倒", "长按 ○ / Z"],
    ["使用连杀奖励", "方向键 / 数字键"]
  ],
  "core_mechanics": [
    ["弹道机制", "移除随机扩散，腰射更直接、更可预测，准确对应武器指向。"],
    ["Gunny 系统", "一键切换近距离、均衡、远距离三种武器配置。"],
    ["12 张 6v6 地图", "首发包含 12 张全新地图，Kill Block 每回合重新配置布局。"],
    ["DMZ 撤离模式", "设定在 Khajin 禁区，系列历史上最大的地图之一。支持单人或小队部署。"],
    ["Apex 配件", "武器满级后解锁，提供独特效果，不占用常规配件槽。"],
    ["33 种首发武器", "涵盖突击步枪、冲锋枪、轻机枪、狙击枪、手枪、霰弹枪等。"]
  ],
  "beginner_tips": [
    "先打战役熟悉手感，再进多人。",
    "选五把喜欢的武器集中升级，不要试图练满 33 把。",
    "用 Gunny 快速切换配置，不需要每次手动配枪。",
    "每次解锁新武器先去射击场试一下。",
    "近距离交火时切副武器往往比换弹更快。"
  ],
  "mistakes": [
    ["试图练满所有武器", "精力分散，没有一把精通", "选五把，集中升级"],
    ["忽略射击场", "不了解武器手感就进对局", "每次解锁新武器先去射击场"],
    ["不用 Gunny", "配枪效率低", "用 Gunny 快速切换配置"],
    ["DMZ 单排硬冲", "高难度，容易被伏击", "先组队熟悉机制"],
    ["不看地图动态变化", "Kill Block 每回合变布局，容易迷路", "每回合重新评估路线"]
  ],
  "faq": [
    ["COD: Modern Warfare 4 怎么玩？", "首发包含战役、多人和 DMZ 三大模式。战役设定在朝鲜半岛，多人回归 6v6 地面战斗，DMZ 是撤离模式。"],
    ["Modern Warfare 4 支持 Switch 2 吗？", "支持。这是 Call of Duty 系列 13 年来首次回归任天堂平台。"],
    ["Modern Warfare 4 有几个难度？", "战役支持多个难度，多人模式难度由对局匹配决定。"],
    ["Modern Warfare 4 怎么配枪？", "进入枪匠界面手动配置，或用 Gunny 一键切换近距离、均衡、远距离三种配置。"],
    ["Modern Warfare 4 有新手教程吗？", "有。首次启动会进入训练关，战役第一章也有教学。"],
    ["Modern Warfare 4 能离线玩吗？", "战役可以离线游玩。多人和 DMZ 需要联网。"]
  ]
},
{
  "slug": "how-to-play-castlevania-belmonts-curse",
  "game_name": "Castlevania: Belmont's Curse",
  "guide_url": "/games/castlevania-belmonts-curse/",
  "canonical": "https://haowordtool.com/games/how-to-play-castlevania-belmonts-curse/",
  "title": "How to Play Castlevania: Belmont's Curse — Combat, Weapons & Tips",
  "meta_desc": "恶魔城贝尔蒙特的诅咒怎么玩？操作说明、神圣之光格挡、鞭子探索、武器系统与新手技巧全解析。",
  "h1": "How to Play Castlevania: Belmont's Curse — 战斗、武器与入门",
  "subtitle": "神圣之光格挡、鞭子探索、武器系统、新手技巧全解析。",
  "intro": "《贝尔蒙特的诅咒》是 18 年来首款 2D 主线恶魔城，主角是 Trevor Belmont 的女儿 Rose Belmont。核心是 Metroidvania 探索 + 神圣之光格挡。",
  "howto_steps": [
    ["选择难度", "首次启动时选择标准模式、地狱行者模式或六十六日模式。新手建议标准。"],
    ["完成开场教学", "序章会教你基础移动、攻击、跳跃和格挡。"],
    ["练习神圣之光格挡", "这是游戏最核心的防御机制。敌人攻击前有提示，及时格挡可以免伤并反击。"],
    ["学习鞭子三种用法", "鞭子可以攻击、牵引和摆荡。牵引用于拉近距离，摆荡用于到达跳跃无法抵达的平台。"],
    ["收集主武器", "游戏包含超过 30 种主武器，包括鞭子、剑、大锤等。捡到新武器时长按即可装备。"],
    ["学习副武器「影之武」", "超过 25 种副武器，包括大斧、弓箭、喷火狮子头等。"],
    ["使用逆炼符", "升级错武器不用怕。逆炼符可以重置升级并取回全部材料。"],
    ["装备魔导器", "魔导器提供被动加成，最多同时装备 3 个。"],
    ["探索隐藏区域", "用鞭子的牵引和摆荡到达常规跳跃无法抵达的平台。"],
    ["收集勇者之心与智者之心碎片", "这些碎片提供永久加成，建议每张地图都尽量收集。"]
  ],
  "controls": [
    ["移动", "左摇杆 / 方向键"],
    ["跳跃", "A / 空格"],
    ["攻击", "X / J"],
    ["副武器", "Y / K"],
    ["神圣之光格挡", "L1 / Shift"],
    ["闪避/鬼步", "R1 / L"],
    ["切换主武器", "方向键 / 数字键"],
    ["使用魔导器", "R2 / E"],
    ["互动/拾取", "A / E"],
    ["打开地图", "触摸板 / M"]
  ],
  "core_mechanics": [
    ["神圣之光格挡", "敌人攻击前有预警。成功格挡可以免伤并反击，是核心防御机制。"],
    ["鞭子三种用法", "攻击、牵引与摆荡。牵引用于战斗，摆荡用于探索。"],
    ["武器系统", "超过 30 种主武器和 25 种副武器。捡到新武器时长按直接装备。"],
    ["逆炼符", "重置已升级武器并取回全部材料，鼓励尝试不同武器组合。"],
    ["魔导器", "提供被动加成，最多同时装备 3 个。"],
    ["六十六日模式", "更高挑战难度，死亡后损失进度。"]
  ],
  "beginner_tips": [
    "先练熟神圣之光格挡，这是体验版中最重要的防御机制。",
    "鞭子的牵引和摆荡是探索核心，多用它找隐藏区域。",
    "捡到新武器时长按即可直接装备，不需要进菜单。",
    "逆炼符可以重置升级并取回材料，放心尝试不同武器。",
    "魔导器最多同时装备 3 个，根据敌人类型切换。"
  ],
  "mistakes": [
    ["忽略神圣之光格挡", "战斗中承受过多伤害", "优先练熟格挡"],
    ["只用鞭子攻击不用牵引", "错过隐藏区域和捷径", "多用鞭子探索"],
    ["不敢换武器", "错过更适合的打法", "用逆炼符重置升级"],
    ["不收集碎片", "缺少被动加成", "限时内规划路线收集"],
    ["忽略阿爾克那挑战", "错过奖励法术", "完成「救济之道」挑战"]
  ],
  "faq": [
    ["Castlevania: Belmont's Curse 怎么玩？", "2D 探索型动作游戏（Metroidvania）。操作主角 Rose Belmont 在巴黎和德古拉城堡中探索，核心是神圣之光格挡和鞭子战斗。"],
    ["Belmont's Curse 有几个难度？", "包含标准模式、地狱行者模式和六十六日模式。"],
    ["Belmont's Curse 支持中文吗？", "支持。包含简体中文、繁体中文、日语、韩语和英语字幕。"],
    ["Belmont's Curse 有体验版吗？", "有。2026 年 10 月 1 日推出体验版，存档可继承至正式版。"],
    ["Belmont's Curse 怎么换武器？", "捡到新武器时长按即可直接装备，不需要进菜单。"],
    ["Belmont's Curse 是 Metroidvania 吗？", "是的。它是 2D 探索型动作游戏，也是 18 年来首款 2D 主线恶魔城。"]
  ]
},
{
  "slug": "how-to-play-block-blast",
  "game_name": "Block Blast!",
  "guide_url": "/games/block-blast/",
  "canonical": "https://haowordtool.com/games/how-to-play-block-blast/",
  "title": "How to Play Block Blast! — Controls, Combos & Beginner Tips",
  "meta_desc": "Block Blast! 怎么玩？8×8 棋盘规则、连击机制、3×3 预留、新手技巧与常见错误全解析。",
  "h1": "How to Play Block Blast! — 操作、连击与入门",
  "subtitle": "8×8 棋盘规则、连击机制、3×3 预留、新手技巧全解析。",
  "intro": "Block Blast! 是一款 8×8 方块消除游戏。规则简单，但高分关键不是大消除，而是保持连击乘数。",
  "howto_steps": [
    ["打开游戏", "iOS 或 Android 应用商店下载，或直接打开网页版。无需注册。"],
    ["认识棋盘", "棋盘是 8×8 的方格，初始为空。"],
    ["放置方块", "每轮获得三个不同形状的方块。拖动方块到棋盘上的位置放下。"],
    ["填满整行或整列", "填满任意一行或一列，该行/列会自动消除。"],
    ["继续放完三个方块", "必须放完当前三个方块，才会刷新下一组。"],
    ["保持连击", "连续多个回合至少消除一次，连击乘数上升。"],
    ["避免断连", "一旦某个回合没有消除任何行或列，连击乘数归零。"],
    ["预留 3×3 空间", "3×3 正方形是最大的威胁。始终在棋盘上留一个干净的 3×3 区域。"],
    ["控制占用率", "把棋盘保持在约 25% 的占用率，既有空间又有连击基础。"],
    ["游戏结束条件", "当手中剩余的方块无法在任何位置放置时，游戏结束。"]
  ],
  "controls": [
    ["拖动方块", "手指拖动 / 鼠标拖动"],
    ["放置方块", "松手 / 松开鼠标"],
    ["预览位置", "拖动时棋盘上会显示预览"],
    ["撤销", "不可撤销，放置前请规划好"],
    ["旋转方块", "不支持旋转"],
    ["翻转方块", "不支持翻转"]
  ],
  "core_mechanics": [
    ["8×8 棋盘", "棋盘固定为 8×8 格，共 64 格。"],
    ["每轮三个方块", "每轮获得三个不可旋转的方块，全部放完才刷新下一组。"],
    ["行/列消除", "填满整行或整列立即消除。"],
    ["连击乘数", "连续多个回合至少消除一次，乘数上升。断一次归零。"],
    ["3×3 威胁", "3×3 正方形需要 9 个连通空格，没有预留会直接结束游戏。"],
    ["无时间限制", "游戏没有计时器，可以慢慢规划。"]
  ],
  "beginner_tips": [
    "每轮至少消除一次，保持连击比一次大消除更重要。",
    "棋盘保持在约 25% 占用率，不要太满也不要太空。",
    "永远预留一个干净的 3×3 空区。",
    "从边缘向中心填充，优先处理角落。",
    "放置前规划所有三个方块，再动手。"
  ],
  "mistakes": [
    ["立刻填满中间区域", "后期大块无处可放", "中心区域只做临时使用"],
    ["只追求一次大消除", "连击断档，乘数归零", "每轮至少消一行"],
    ["把棋盘清得干干净净", "无法开始新连击", "保持约 25% 占用率"],
    ["不预留 3×3 空间", "3×3 方块出现时直接结束", "永远留一个干净的 3×3 区域"],
    ["凭感觉快速放置", "无谓死亡，分数上不去", "先看三个方块再动手"]
  ],
  "faq": [
    ["Block Blast! 怎么玩？", "在 8×8 棋盘上放置三个方块，填满整行或整列消除。全部放完三个方块后才会刷新下一组。"],
    ["Block Blast! 可以旋转方块吗？", "不能。方块不能旋转，也不能翻转。这是游戏的核心限制。"],
    ["Block Blast! 怎么得高分？", "核心是保持连击乘数。每轮至少消除一次，比偶尔一次大消除更重要。"],
    ["Block Blast! 有排行榜吗？", "没有官方全球排行榜。Hungry Studio 有意把它设计成休闲游戏。"],
    ["Block Blast! 有几种难度？", "没有难度选项。游戏难度随连击和棋盘状态动态变化。"],
    ["Block Blast! 免费吗？", "免费。iOS 和 Android 都可以免费下载，无内购强制。"]
  ]
},
{
  "slug": "how-to-play-sprunki",
  "game_name": "Sprunki",
  "guide_url": "/games/sprunki/",
  "canonical": "https://haowordtool.com/games/how-to-play-sprunki/",
  "title": "How to Play Sprunki — Characters, Phases & Controls Guide",
  "meta_desc": "Sprunki 怎么玩？角色拖拽、混音叠加、恐怖阶段触发、角色搭配与新手技巧全解析。",
  "h1": "How to Play Sprunki — 角色、阶段与混音指南",
  "subtitle": "角色拖拽、混音叠加、恐怖阶段触发、新手技巧全解析。",
  "intro": "Sprunki 是一款粉丝自制的音乐混音网页游戏，玩法基于 Incredibox。核心是把不同角色拖到舞台上，叠加节拍、旋律和人声，创作自己的混音。",
  "howto_steps": [
    ["打开游戏", "在 sprunki.com 等粉丝站直接打开，无需下载或注册。"],
    ["选择阶段", "游戏通常从正常版开始。不同版本和 mod 有不同阶段。"],
    ["认识角色", "常见角色包括 Oren、Raddy、Clukr、Fun Bot、Vineria、Gray 等。每个角色代表一种声音。"],
    ["拖动角色到舞台", "把角色从下方拖到舞台上，角色开始播放自己的声音。"],
    ["叠加多个角色", "在舞台上叠加多个角色，形成完整的混音。"],
    ["静音或移除角色", "点击舞台上的角色可以静音或移除。"],
    ["尝试特定组合", "特定角色组合会触发阶段变化或隐藏彩蛋。"],
    ["触发恐怖阶段", "部分组合会进入恐怖/黑化阶段，画面、声音和角色外观都会变化。"],
    ["录制你的混音", "录屏分享到 TikTok、YouTube Shorts，容易获得自然流量。"],
    ["尝试不同 mod", "Sprunki 有大量 mod 版本，包括 Phase 3、Phase 4、Wenda Treatment 等。"]
  ],
  "controls": [
    ["拖动角色", "手指拖动 / 鼠标拖动"],
    ["放置角色", "松手 / 松开鼠标"],
    ["静音角色", "点击角色"],
    ["移除角色", "再次点击或拖出舞台"],
    ["选择阶段", "页面顶部或菜单"],
    ["重置混音", "页面上的重置按钮"],
    ["录制", "使用系统录屏或第三方录屏工具"]
  ],
  "core_mechanics": [
    ["角色声音系统", "每个角色代表一种声音：节拍、旋律、人声或效果。"],
    ["混音叠加", "多个角色同时播放，形成完整混音。"],
    ["阶段变化", "特定组合触发阶段变化，包括恐怖/黑化阶段。"],
    ["隐藏彩蛋", "某些角色组合会触发隐藏效果。"],
    ["Mod 版本", "大量粉丝自制 mod，每个 mod 有不同角色和声音。"]
  ],
  "beginner_tips": [
    "先单独听每个角色的声音，再决定搭配。",
    "保持节奏平衡，不要一次堆满所有角色。",
    "留一个角色做变化，制造段落感。",
    "尝试触发隐藏阶段，这是短视频传播的核心看点。",
    "录屏分享到 TikTok、YouTube Shorts，容易获得自然流量。"
  ],
  "mistakes": [
    ["一上来堆满角色", "声音混乱，没有层次", "先放节拍，再加旋律"],
    ["忽略角色节奏匹配", "混音不协调", "同类声音放一起"],
    ["不敢尝试恐怖阶段", "错过最大传播点", "主动触发黑化阶段"],
    ["以为必须下载", "增加门槛", "浏览器直接玩"],
    ["不录屏分享", "错过病毒传播", "录下最爽组合"]
  ],
  "faq": [
    ["Sprunki 怎么玩？", "把不同角色拖到舞台上，叠加节拍、旋律和人声，创作自己的混音。点击角色可以静音或移除。"],
    ["Sprunki 免费吗？", "通常免费，浏览器直接玩。"],
    ["Sprunki 可以在手机上玩吗？", "可以，多数版本支持手机浏览器。"],
    ["Sprunki 适合小孩吗？", "正常阶段适合，但恐怖阶段可能吓到小孩。"],
    ["Sprunki 怎么触发恐怖阶段？", "特定角色组合会触发恐怖/黑化阶段。不同 mod 触发条件不同。"],
    ["Sprunki 和 Incredibox 一样吗？", "玩法相似，但 Sprunki 是粉丝自制，不是官方 Incredibox。"]
  ]
},
{
  "slug": "how-to-play-subway-surfers",
  "game_name": "Subway Surfers",
  "guide_url": "/games/subway-surfers/",
  "canonical": "https://haowordtool.com/games/how-to-play-subway-surfers/",
  "title": "How to Play Subway Surfers — Controls, Hoverboards & Tips",
  "meta_desc": "地铁跑酷怎么玩？滑动操作、滑板使用、金币收集、秘密之星路线与新手技巧全解析。",
  "h1": "How to Play Subway Surfers — 操作、滑板与入门",
  "subtitle": "滑动操作、滑板使用、金币收集、秘密之星路线全解析。",
  "intro": "Subway Surfers 是 SYBO 开发的无尽跑酷游戏。玩家控制角色在地铁轨道上躲避障碍、收集金币和道具。核心是得分倍率和滑板续航。",
  "howto_steps": [
    ["启动游戏", "iOS 或 Android 应用商店下载，无需注册。"],
    ["选择角色", "新手推荐特雷（Tricky），可以一边赚金币一边熟悉泡泡糖用法。"],
    ["开始第一局", "游戏自动开始。角色向前奔跑，你需要躲避障碍。"],
    ["学习滑动操作", "左右滑动切换轨道，上滑跳跃，下滑翻滚或快速下落。"],
    ["收集金币", "金币用于购买角色、滑板和升级道具。"],
    ["使用滑板", "滑板是「第二条命」，撞到障碍物时会替你挡一次。"],
    ["了解跳跃取消", "跳跃时向下滑动可以取消跳跃、提前落地，用于抢金币和道具。"],
    ["升级得分倍率", "通过升级角色、完成每日任务、装备道具提高得分倍率。"],
    ["收集秘密之星", "秘密之星必须亲自碰到才算，一局最多 3 颗。"],
    ["游戏结束条件", "撞到障碍物且没有滑板时，游戏结束。"]
  ],
  "controls": [
    ["切换轨道", "左右滑动 / 左右方向键"],
    ["跳跃", "上滑 / 上方向键"],
    ["翻滚或快速下落", "下滑 / 下方向键"],
    ["使用滑板", "双击屏幕 / 空格"],
    ["暂停", "点击暂停按钮 / Esc"],
    ["使用道具", "点击道具图标"]
  ],
  "core_mechanics": [
    ["无尽跑酷", "游戏没有终点，跑得越远分数越高。"],
    ["三轨道系统", "三条轨道间左右切换，上滑跳跃，下滑翻滚。"],
    ["滑板系统", "滑板充当第二条命，撞到障碍物时消耗滑板而非结束游戏。"],
    ["得分倍率", "通过升级角色、完成每日任务、装备道具提升，最高可达 124 倍。"],
    ["秘密之星", "每局最多 3 颗，必须亲自碰到才算。"],
    ["世界巡回", "定期更新不同城市主题，如巴厘岛、特兰西瓦尼亚等。"]
  ],
  "beginner_tips": [
    "先熟悉滑动操作，再追求高分。",
    "用下滑取消跳跃提前落地，抢金币和道具。",
    "滑板不要一有就开，保留到高速段或连续障碍时使用。",
    "前期以金币效率为核心，升级关键道具比追求高分更划算。",
    "每局尽量收集 3 颗秘密之星。"
  ],
  "mistakes": [
    ["盲目追求高分忽略金币", "等级上不去，倍率低", "前期以金币效率为核心"],
    ["一有滑板就立刻使用", "关键时刻没有第二条命", "保留滑板直到需要时再用"],
    ["只在地面跑不上屋顶", "障碍多、逃生路线少", "尽量保持高空路线"],
    ["不练习下滑取消跳跃", "错过金币和道具", "每次跳下平台都快速下滑"],
    ["忽略秘密之星", "错过大量额外分数", "每局尽量收集 3 颗秘密之星"]
  ],
  "faq": [
    ["Subway Surfers 怎么玩？", "左右滑动切换轨道，上滑跳跃，下滑翻滚。收集金币和道具，躲避障碍，跑得越远分数越高。"],
    ["Subway Surfers 新手用什么角色好？", "推荐特雷（Tricky），可以一边赚金币一边熟悉泡泡糖的用法。"],
    ["Subway Surfers 滑板怎么用最好？", "滑板是「第二条命」，不要一有就开。保留到高速段或连续障碍时使用。"],
    ["Subway Surfers 秘密之星怎么拿？", "秘密之星必须亲自碰到才算，泡泡糖吸不起来。通常一局最多 3 颗。"],
    ["Subway Surfers 有几种模式？", "主要是无尽跑酷模式。定期有世界巡回更新和限时活动。"],
    ["Subway Surfers 免费吗？", "免费。iOS 和 Android 都可以免费下载，有内购但不强制。"]
  ]
},
{
  "slug": "how-to-play-ludo-king",
  "game_name": "Ludo King",
  "guide_url": "/games/ludo-king/",
  "canonical": "https://haowordtool.com/games/how-to-play-ludo-king/",
  "title": "How to Play Ludo King — Rules, Dice & Beginner Strategy",
  "meta_desc": "Ludo King 怎么玩？掷骰子规则、安全格、代币管理、路障战术与新手入门技巧全解析。",
  "h1": "How to Play Ludo King — 规则、骰子与入门策略",
  "subtitle": "掷骰子规则、安全格、代币管理、路障战术全解析。",
  "intro": "Ludo King 是 Gametion 开发的经典飞行棋手游，基于印度古代 Pachisi 棋。玩家掷骰子移动代币，先将全部四个代币送入终点者获胜。",
  "howto_steps": [
    ["选择模式", "首次启动时选择经典模式或快速模式。新手建议经典模式，熟悉完整节奏。"],
    ["选择人数", "支持 2–6 人在线对战、离线 AI 对战和本地多人模式。"],
    ["掷骰子", "点击骰子按钮掷骰子。掷出 6 才能将代币从基地移出。"],
    ["移出代币", "掷出 6 时，点击基地中的代币将其移到起始格。"],
    ["移动代币", "点击棋盘上的代币，按骰子点数移动。"],
    ["掷出 6 获得额外回合", "掷出 6 可以额外获得一次投掷机会。"],
    ["吃对手代币", "代币落在对手代币所在格时，对手代币被送回基地。"],
    ["利用安全格", "星标安全格和彩色起始格可以保护代币不被吃。"],
    ["建造路障", "两个同色代币叠在同一格形成路障，对手无法通过。"],
    ["将四个代币送入终点", "先将全部四个代币送入终点者获胜。"]
  ],
  "controls": [
    ["掷骰子", "点击骰子按钮"],
    ["选择代币", "点击代币"],
    ["移动代币", "自动按骰子点数移动"],
    ["查看规则", "菜单中的规则按钮"],
    ["聊天", "聊天按钮（支持文字和语音）"],
    ["退出对局", "菜单中的退出按钮"]
  ],
  "core_mechanics": [
    ["掷骰子", "掷出 6 才能移出代币，掷出 6 额外获得一次投掷机会。"],
    ["吃代币", "落在对手代币所在格，对手代币回基地。"],
    ["安全格", "星标安全格和彩色起始格，代币停在上面不会被吃。"],
    ["路障", "两个同色代币叠在同一格，对手无法通过。"],
    ["终点通道", "代币必须精确点数进入终点，超出会反弹。"],
    ["快速模式", "缩短动画和游戏时长，适合快速对局。"]
  ],
  "beginner_tips": [
    "分散代币，不要只推一个。",
    "掷到 6 大多数情况优先开新代币。",
    "优先吃进度最远的对手代币。",
    "把路障放在对手必经之路上。",
    "根据骰子结果切换攻防，不要死守一个策略。"
  ],
  "mistakes": [
    ["只推一个代币", "被吃一次损失全部进度", "分散代币，保持灵活"],
    ["不利用安全格", "代币暴露，容易被吃", "优先落到安全格上"],
    ["掷到 6 不开新代币", "棋盘上代币太少", "大多数情况优先开新代币"],
    ["吃刚出基地的代币", "对手损失很小", "优先吃进度最远的代币"],
    ["不造路障", "缺少防守手段", "两个同色代币叠在一起"]
  ],
  "faq": [
    ["Ludo King 怎么玩？", "掷骰子移动代币，先将全部四个代币送入终点者获胜。掷出 6 才能移出代币，掷出 6 额外获得一次投掷机会。"],
    ["Ludo King 有几个玩家？", "支持 2–6 人在线对战、离线 AI 对战和本地多人模式。"],
    ["Ludo King 安全格在哪里？", "棋盘上有星标的安全格，代币停在上面不会被吃。彩色起始格也是安全格。"],
    ["Ludo King 快速模式和经典模式有什么区别？", "快速模式缩短了动画和游戏时长，适合快速对局。经典模式保持完整的游戏节奏。"],
    ["Ludo King 锦标赛怎么参加？", "Ludo King 支持 8 人锦标赛模式，赢家可获得最高 6 倍入场金币的奖励。"],
    ["Ludo King 免费吗？", "免费。iOS、Android 和 PC 都可以免费下载，有内购但不强制。"]
  ]
}
]

ALL_HOWTO = {
  'how-to-play-gta-6': {'title': 'GTA 6 怎么玩', 'desc': '操作、角色与入门', 'badge': '开放世界'},
  'how-to-play-phantom-blade-zero': {'title': 'Phantom Blade Zero 怎么玩', 'desc': '战斗、武器与难度', 'badge': '动作RPG'},
  'how-to-play-cod-modern-warfare-4': {'title': 'COD: MW4 怎么玩', 'desc': '操作、地图与配枪', 'badge': 'FPS'},
  'how-to-play-castlevania-belmonts-curse': {'title': 'Castlevania 怎么玩', 'desc': '战斗、武器与入门', 'badge': 'Metroidvania'},
  'how-to-play-block-blast': {'title': 'Block Blast! 怎么玩', 'desc': '操作、连击与入门', 'badge': '益智'},
  'how-to-play-sprunki': {'title': 'Sprunki 怎么玩', 'desc': '角色、阶段与混音', 'badge': '音乐'},
  'how-to-play-subway-surfers': {'title': 'Subway Surfers 怎么玩', 'desc': '操作、滑板与入门', 'badge': '跑酷'},
  'how-to-play-ludo-king': {'title': 'Ludo King 怎么玩', 'desc': '规则、骰子与入门', 'badge': '棋牌'}
}

def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

for game in GAMES:
    # HowTo steps JSON
    steps_json = json.dumps([
        {"@type": "HowToStep", "position": i+1, "name": name, "text": text}
        for i, (name, text) in enumerate(game["howto_steps"])
    ], ensure_ascii=False)

    # HowTo steps HTML
    steps_html = "\n".join([
        f'''  <div class="howto-step">
    <div class="step-num">{i+1}</div>
    <div class="step-content">
      <div class="step-title">{esc(name)}</div>
      <p class="step-text">{esc(text)}</p>
    </div>
  </div>'''
        for i, (name, text) in enumerate(game["howto_steps"])
    ])

    # FAQ JSON
    faq_json = json.dumps([
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
        for q, a in game["faq"]
    ], ensure_ascii=False)

    # FAQ HTML
    faq_html = "\n".join([
        f'''  <div class="faq-item">
    <div class="faq-q">{esc(q)}</div>
    <p class="faq-a">{esc(a)}</p>
  </div>'''
        for q, a in game["faq"]
    ])

    # Controls rows
    controls_rows = "\n    ".join([
        f"<tr><th>{esc(k)}</th><td>{esc(v)}</td></tr>"
        for k, v in game["controls"]
    ])

    # Core mechanics HTML
    mechanics_html = "\n".join([
        f"  <h3>{esc(t)}</h3>\n  <p>{esc(d)}</p>"
        for t, d in game["core_mechanics"]
    ])

    # Beginner tips HTML
    tips_html = "\n    ".join([f"<li>{esc(t)}</li>" for t in game["beginner_tips"]])

    # Mistakes rows
    mistakes_rows = "\n    ".join([
        f"<tr><td>{esc(a)}</td><td>{esc(b)}</td><td>{esc(c)}</td></tr>"
        for a, b, c in game["mistakes"]
    ])

    # Related cards (other 7 How to Play pages)
    related_cards = "\n".join([
        f'''    <a href="/games/{slug}/">
      <div class="r-title">{g["title"]}</div>
      <div class="r-desc">{g["desc"]}</div>
      <span class="r-badge">{g["badge"]}</span>
    </a>'''
        for slug, g in ALL_HOWTO.items() if slug != game["slug"]
    ])

    html = TEMPLATE
    html = html.replace("{{TITLE}}", esc(game["title"]))
    html = html.replace("{{META_DESC}}", esc(game["meta_desc"]))
    html = html.replace("{{CANONICAL}}", game["canonical"])
    html = html.replace("{{GAME_NAME}}", esc(game["game_name"]))
    html = html.replace("{{GUIDE_URL}}", game["guide_url"])
    html = html.replace("{{H1}}", esc(game["h1"]))
    html = html.replace("{{SUBTITLE}}", esc(game["subtitle"]))
    html = html.replace("{{INTRO}}", esc(game["intro"]))
    html = html.replace("{{HOWTO_STEPS_JSON}}", steps_json)
    html = html.replace("{{HOWTO_STEPS_HTML}}", steps_html)
    html = html.replace("{{CONTROLS_ROWS}}", controls_rows)
    html = html.replace("{{CORE_MECHANICS_HTML}}", mechanics_html)
    html = html.replace("{{BEGINNER_TIPS_HTML}}", tips_html)
    html = html.replace("{{MISTAKES_ROWS}}", mistakes_rows)
    html = html.replace("{{FAQ_JSON}}", faq_json)
    html = html.replace("{{FAQ_ITEMS_HTML}}", faq_html)
    html = html.replace("{{RELATED_CARDS}}", related_cards)

    out_dir = os.path.join("games", game["slug"])
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✓ Generated: /games/{game['slug']}/ ({len(html)} bytes)")

print("\nDone! 8 How to Play pages generated.")
