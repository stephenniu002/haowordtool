-- ============================================================
-- 04-seed-detail.sql  ·  站点详情 + 逐月序列种子
-- ============================================================
-- 由 tools/pro/build-detail.mjs 生成，不要手改 —— 重跑会覆盖。
-- 快照：2026-11-03   站点数：19
--
-- 依赖：03-site-detail.sql 已执行。
-- 幂等：先 delete 当期再 insert，可重复跑。
-- ============================================================

delete from public.ai_site_series where domain in ('gistra.io', 'yourmascot.ai', 'picvo.ai', 'aidetectors.cc', 'autoanalyst.ai', 'munchlog.ai', 'boppy.me', 'gethandler.ai', 'noumi.ai', 'mnogogpt.ru', 'careerpicai.com', 'photoshoot.app', 'aicartoon.app', 'pgsgrove.com', 'talya.app', 'musegen.ai', 'mathssolverai.com', 'speechyou.com', 'spiceform.com');
delete from public.ai_site_detail where snapshot_date = '2026-11-03';

insert into public.ai_site_detail (
  domain, snapshot_date, name, description, category, site_type, rank,
  monthly_visits, mom_growth_pct, visits_label, growth_score,
  revenue_signal, revenue_mom_pct, conversion_pct, revenue_month,
  payment_provider, checkout_host,
  traffic_direct_pct, traffic_referral_pct, traffic_search_pct, traffic_social_pct,
  geo, insight, competitors, data_source, estimated
) values
  ('gistra.io', '2026-11-03', 'Gistra', '把 YouTube 视频即时转成文字稿、笔记、闪卡和学习指南。', '文本生成', '生产力与办公', 1, 3300, 9900, '3.3K', 88.2, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"yourmascot.ai","name":"YourMascot","rank":2,"visits":4200,"revenue_signal":null},{"domain":"autoanalyst.ai","name":"AutoAnalyst","rank":5,"visits":4200,"revenue_signal":null},{"domain":"munchlog.ai","name":"MunchLog","rank":6,"visits":3700,"revenue_signal":null},{"domain":"photoshoot.app","name":"Photoshoot","rank":12,"visits":3100,"revenue_signal":null}]'::jsonb, 'manual', false),
  ('yourmascot.ai', '2026-11-03', 'YourMascot', 'AI 产品吉祥物生成工具，几分钟内创建风格一致的吉祥物形象。', '图像生成', null, 2, 4200, 9900, '4.2K', 88.9, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"careerpicai.com","name":"CareerPic AI","rank":11,"visits":113300,"revenue_signal":null},{"domain":"mnogogpt.ru","name":"MnogoGPT","rank":10,"visits":33500,"revenue_signal":null},{"domain":"aicartoon.app","name":"AICartoon","rank":13,"visits":4200,"revenue_signal":null},{"domain":"photoshoot.app","name":"Photoshoot","rank":12,"visits":3100,"revenue_signal":null}]'::jsonb, 'manual', false),
  ('picvo.ai', '2026-11-03', 'Picvo AI', '一站式 AI 创作平台，生成专业视频、图片、音乐与配音。', '视频制作', '音频与语音', 3, 5500, 6083, '5.5K', 86.2, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"gethandler.ai","name":"Handler","rank":8,"visits":8700,"revenue_signal":null},{"domain":"noumi.ai","name":"Noumi","rank":9,"visits":5000,"revenue_signal":null},{"domain":"yourmascot.ai","name":"YourMascot","rank":2,"visits":4200,"revenue_signal":null},{"domain":"autoanalyst.ai","name":"AutoAnalyst","rank":5,"visits":4200,"revenue_signal":null}]'::jsonb, 'manual', false),
  ('aidetectors.cc', '2026-11-03', 'AI Detectors', '免费检测文章是否 AI 撰写，并改写为更自然的韩语。', 'AI 检测与人性化', '生产力与办公', 4, 28300, 5176, '28.3K', 89.7, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"mnogogpt.ru","name":"MnogoGPT","rank":10,"visits":33500,"revenue_signal":null},{"domain":"pgsgrove.com","name":"Phoenix Grove","rank":14,"visits":28900,"revenue_signal":null},{"domain":"musegen.ai","name":"MuseGen","rank":16,"visits":24700,"revenue_signal":null},{"domain":"spiceform.com","name":"Spiceform","rank":19,"visits":22700,"revenue_signal":null}]'::jsonb, 'series_derived', true),
  ('autoanalyst.ai', '2026-11-03', 'AutoAnalyst', '面向数据分析的 AI 平台，自称 AI 数据科学家。', '生产力与办公', null, 5, 4200, 4400, '4.2K', 83.1, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"spiceform.com","name":"Spiceform","rank":19,"visits":22700,"revenue_signal":null},{"domain":"yourmascot.ai","name":"YourMascot","rank":2,"visits":4200,"revenue_signal":null},{"domain":"aicartoon.app","name":"AICartoon","rank":13,"visits":4200,"revenue_signal":null},{"domain":"munchlog.ai","name":"MunchLog","rank":6,"visits":3700,"revenue_signal":null}]'::jsonb, 'manual', false),
  ('munchlog.ai', '2026-11-03', 'MunchLog', '用语音或文字记录饮食、给出温和当日复盘的食物打卡工具。', '生活与娱乐', null, 6, 3700, 1243, '3.7K', 73.9, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"noumi.ai","name":"Noumi","rank":9,"visits":5000,"revenue_signal":null},{"domain":"yourmascot.ai","name":"YourMascot","rank":2,"visits":4200,"revenue_signal":null},{"domain":"autoanalyst.ai","name":"AutoAnalyst","rank":5,"visits":4200,"revenue_signal":null},{"domain":"gistra.io","name":"Gistra","rank":1,"visits":3300,"revenue_signal":null}]'::jsonb, 'series_derived', true),
  ('boppy.me', '2026-11-03', 'Boppy', '免费 AI 音乐生成站，文字描述即可生成带歌词的完整歌曲。', '音频与语音', null, 7, 67400, 1006, '67.4K', 80.7, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"careerpicai.com","name":"CareerPic AI","rank":11,"visits":113300,"revenue_signal":null},{"domain":"speechyou.com","name":"SpeechYou","rank":18,"visits":42000,"revenue_signal":null},{"domain":"mnogogpt.ru","name":"MnogoGPT","rank":10,"visits":33500,"revenue_signal":null},{"domain":"musegen.ai","name":"MuseGen","rank":16,"visits":24700,"revenue_signal":null}]'::jsonb, 'series_derived', true),
  ('gethandler.ai', '2026-11-03', 'Handler', '面向移动开发者的 TikTok 氛围营销 AI 代理。', '视频制作', '营销与销售', 8, 8700, 680, '8.7K', 72, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"talya.app","name":"Talya","rank":15,"visits":12600,"revenue_signal":null},{"domain":"mathssolverai.com","name":"Maths Solver AI","rank":17,"visits":11300,"revenue_signal":null},{"domain":"picvo.ai","name":"Picvo AI","rank":3,"visits":5500,"revenue_signal":null},{"domain":"noumi.ai","name":"Noumi","rank":9,"visits":5000,"revenue_signal":null}]'::jsonb, 'series_derived', true),
  ('noumi.ai', '2026-11-03', 'Noumi', '像同事一样理解上下文、管理任务并交付成果的 AI 个人助理。', '生活与娱乐', null, 9, 5000, 489, '5.0K', 68.1, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"picvo.ai","name":"Picvo AI","rank":3,"visits":5500,"revenue_signal":null},{"domain":"yourmascot.ai","name":"YourMascot","rank":2,"visits":4200,"revenue_signal":null},{"domain":"autoanalyst.ai","name":"AutoAnalyst","rank":5,"visits":4200,"revenue_signal":null},{"domain":"munchlog.ai","name":"MunchLog","rank":6,"visits":3700,"revenue_signal":null}]'::jsonb, 'series_derived', true),
  ('mnogogpt.ru', '2026-11-03', 'MnogoGPT', '俄语无 VPN 的一站式 AI 照片、视频与音乐创作工作室。', '图像生成', '音频与语音', 10, 33500, 488, '33.5K', 73.6, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"careerpicai.com","name":"CareerPic AI","rank":11,"visits":113300,"revenue_signal":null},{"domain":"yourmascot.ai","name":"YourMascot","rank":2,"visits":4200,"revenue_signal":null},{"domain":"aicartoon.app","name":"AICartoon","rank":13,"visits":4200,"revenue_signal":null},{"domain":"photoshoot.app","name":"Photoshoot","rank":12,"visits":3100,"revenue_signal":null}]'::jsonb, 'series_derived', true),
  ('careerpicai.com', '2026-11-03', 'CareerPic AI', '上传自拍，生成求职专业职业头像。', '图像生成', null, 11, 113300, 433, '113.3K', 76.2, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"mnogogpt.ru","name":"MnogoGPT","rank":10,"visits":33500,"revenue_signal":null},{"domain":"yourmascot.ai","name":"YourMascot","rank":2,"visits":4200,"revenue_signal":null},{"domain":"aicartoon.app","name":"AICartoon","rank":13,"visits":4200,"revenue_signal":null},{"domain":"photoshoot.app","name":"Photoshoot","rank":12,"visits":3100,"revenue_signal":null}]'::jsonb, 'series_derived', true),
  ('photoshoot.app', '2026-11-03', 'Photoshoot', '面向时尚、产品、人像场景的写真灵感与图片视频生成站。', '图像生成', '社交媒体', 12, 3100, 266, '3.1K', 62.5, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"careerpicai.com","name":"CareerPic AI","rank":11,"visits":113300,"revenue_signal":null},{"domain":"mnogogpt.ru","name":"MnogoGPT","rank":10,"visits":33500,"revenue_signal":null},{"domain":"yourmascot.ai","name":"YourMascot","rank":2,"visits":4200,"revenue_signal":null},{"domain":"aicartoon.app","name":"AICartoon","rank":13,"visits":4200,"revenue_signal":null}]'::jsonb, 'series_derived', true),
  ('aicartoon.app', '2026-11-03', 'AICartoon', '把文字或图片快速生成高清卡通视频的 AI 工具站。', '图像生成', null, 13, 4200, 251, '4.2K', 62.9, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"careerpicai.com","name":"CareerPic AI","rank":11,"visits":113300,"revenue_signal":null},{"domain":"mnogogpt.ru","name":"MnogoGPT","rank":10,"visits":33500,"revenue_signal":null},{"domain":"yourmascot.ai","name":"YourMascot","rank":2,"visits":4200,"revenue_signal":null},{"domain":"photoshoot.app","name":"Photoshoot","rank":12,"visits":3100,"revenue_signal":null}]'::jsonb, 'series_derived', true),
  ('pgsgrove.com', '2026-11-03', 'Phoenix Grove', '主打利他 AI/替代智能理念的自研 AI 平台。', '聊天与陪伴', null, 14, 28900, 215, '28.9K', 67.4, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"mnogogpt.ru","name":"MnogoGPT","rank":10,"visits":33500,"revenue_signal":null},{"domain":"aidetectors.cc","name":"AI Detectors","rank":4,"visits":28300,"revenue_signal":null},{"domain":"musegen.ai","name":"MuseGen","rank":16,"visits":24700,"revenue_signal":null},{"domain":"spiceform.com","name":"Spiceform","rank":19,"visits":22700,"revenue_signal":null}]'::jsonb, 'series_derived', true),
  ('talya.app', '2026-11-03', 'Talya', '法语 AI 求职副驾驶，匹配职位、定制简历、撰写求职信。', '招聘与人力', null, 15, 12600, 212, '12.6K', 64.9, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"musegen.ai","name":"MuseGen","rank":16,"visits":24700,"revenue_signal":null},{"domain":"spiceform.com","name":"Spiceform","rank":19,"visits":22700,"revenue_signal":null},{"domain":"mathssolverai.com","name":"Maths Solver AI","rank":17,"visits":11300,"revenue_signal":null},{"domain":"gethandler.ai","name":"Handler","rank":8,"visits":8700,"revenue_signal":null}]'::jsonb, 'series_derived', true),
  ('musegen.ai', '2026-11-03', 'MuseGen', 'AI 音乐生成器，文本或歌词生成带人声原创歌曲。', '音频与语音', null, 16, 24700, 193, '24.7K', 66.2, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"boppy.me","name":"Boppy","rank":7,"visits":67400,"revenue_signal":null},{"domain":"speechyou.com","name":"SpeechYou","rank":18,"visits":42000,"revenue_signal":null},{"domain":"aidetectors.cc","name":"AI Detectors","rank":4,"visits":28300,"revenue_signal":null},{"domain":"spiceform.com","name":"Spiceform","rank":19,"visits":22700,"revenue_signal":null}]'::jsonb, 'series_derived', true),
  ('mathssolverai.com', '2026-11-03', 'Maths Solver AI', '面向学生的在线 AI 数学解题站。', '教育', null, 17, 11300, 176, '11.3K', 63.3, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"spiceform.com","name":"Spiceform","rank":19,"visits":22700,"revenue_signal":null},{"domain":"talya.app","name":"Talya","rank":15,"visits":12600,"revenue_signal":null},{"domain":"gethandler.ai","name":"Handler","rank":8,"visits":8700,"revenue_signal":null},{"domain":"picvo.ai","name":"Picvo AI","rank":3,"visits":5500,"revenue_signal":null}]'::jsonb, 'series_derived', true),
  ('speechyou.com', '2026-11-03', 'SpeechYou', 'AI 语音转文字工具，支持 1700 种语言。', '音频与语音', null, 18, 42000, 159, '42.0K', 66.3, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"boppy.me","name":"Boppy","rank":7,"visits":67400,"revenue_signal":null},{"domain":"mnogogpt.ru","name":"MnogoGPT","rank":10,"visits":33500,"revenue_signal":null},{"domain":"pgsgrove.com","name":"Phoenix Grove","rank":14,"visits":28900,"revenue_signal":null},{"domain":"musegen.ai","name":"MuseGen","rank":16,"visits":24700,"revenue_signal":null}]'::jsonb, 'series_derived', true),
  ('spiceform.com', '2026-11-03', 'Spiceform', 'AI 原生表单构建器，提示词生成表单。', '生产力与办公', null, 19, 22700, 140, '22.7K', 63.7, null, null, null, null, null, null, null, null, null, null, null, null, '[{"domain":"pgsgrove.com","name":"Phoenix Grove","rank":14,"visits":28900,"revenue_signal":null},{"domain":"aidetectors.cc","name":"AI Detectors","rank":4,"visits":28300,"revenue_signal":null},{"domain":"musegen.ai","name":"MuseGen","rank":16,"visits":24700,"revenue_signal":null},{"domain":"autoanalyst.ai","name":"AutoAnalyst","rank":5,"visits":4200,"revenue_signal":null}]'::jsonb, 'series_derived', true)
on conflict (domain) do update set
  snapshot_date = excluded.snapshot_date,
  name = excluded.name, description = excluded.description,
  category = excluded.category, site_type = excluded.site_type, rank = excluded.rank,
  monthly_visits = excluded.monthly_visits, mom_growth_pct = excluded.mom_growth_pct,
  visits_label = excluded.visits_label, growth_score = excluded.growth_score,
  revenue_signal = excluded.revenue_signal, revenue_mom_pct = excluded.revenue_mom_pct,
  conversion_pct = excluded.conversion_pct, revenue_month = excluded.revenue_month,
  payment_provider = excluded.payment_provider, checkout_host = excluded.checkout_host,
  traffic_direct_pct = excluded.traffic_direct_pct,
  traffic_referral_pct = excluded.traffic_referral_pct,
  traffic_search_pct = excluded.traffic_search_pct,
  traffic_social_pct = excluded.traffic_social_pct,
  geo = excluded.geo, insight = excluded.insight, competitors = excluded.competitors,
  data_source = excluded.data_source, estimated = excluded.estimated,
  updated_at = now();

-- 逐月序列（derived=true 表示按环比反推，非实测）
insert into public.ai_site_series (domain, month, visits, revenue_signal, derived) values
  ('gistra.io', '2026-11-01', 3300, null, false),
  ('yourmascot.ai', '2026-11-01', 4200, null, false),
  ('picvo.ai', '2026-11-01', 5500, null, false),
  ('aidetectors.cc', '2026-10-01', 536, null, true),
  ('aidetectors.cc', '2026-11-01', 28300, null, false),
  ('autoanalyst.ai', '2026-11-01', 4200, null, false),
  ('munchlog.ai', '2026-10-01', 276, null, true),
  ('munchlog.ai', '2026-11-01', 3700, null, false),
  ('boppy.me', '2026-08-01', 231, null, true),
  ('boppy.me', '2026-09-01', 933, null, true),
  ('boppy.me', '2026-10-01', 6094, null, true),
  ('boppy.me', '2026-11-01', 67400, null, false),
  ('gethandler.ai', '2026-09-01', 235, null, true),
  ('gethandler.ai', '2026-10-01', 1115, null, true),
  ('gethandler.ai', '2026-11-01', 8700, null, false),
  ('noumi.ai', '2026-09-01', 230, null, true),
  ('noumi.ai', '2026-10-01', 849, null, true),
  ('noumi.ai', '2026-11-01', 5000, null, false),
  ('mnogogpt.ru', '2026-06-01', 238, null, true),
  ('mnogogpt.ru', '2026-07-01', 345, null, true),
  ('mnogogpt.ru', '2026-08-01', 625, null, true),
  ('mnogogpt.ru', '2026-09-01', 1546, null, true),
  ('mnogogpt.ru', '2026-10-01', 5697, null, true),
  ('mnogogpt.ru', '2026-11-01', 33500, null, false),
  ('careerpicai.com', '2026-06-01', 1133, null, true),
  ('careerpicai.com', '2026-07-01', 1582, null, true),
  ('careerpicai.com', '2026-08-01', 2722, null, true),
  ('careerpicai.com', '2026-09-01', 6286, null, true),
  ('careerpicai.com', '2026-10-01', 21257, null, true),
  ('careerpicai.com', '2026-11-01', 113300, null, false),
  ('photoshoot.app', '2026-06-01', 106, null, true),
  ('photoshoot.app', '2026-07-01', 132, null, true),
  ('photoshoot.app', '2026-08-01', 191, null, true),
  ('photoshoot.app', '2026-09-01', 344, null, true),
  ('photoshoot.app', '2026-10-01', 847, null, true),
  ('photoshoot.app', '2026-11-01', 3100, null, false),
  ('aicartoon.app', '2026-06-01', 164, null, true),
  ('aicartoon.app', '2026-07-01', 202, null, true),
  ('aicartoon.app', '2026-08-01', 286, null, true),
  ('aicartoon.app', '2026-09-01', 503, null, true),
  ('aicartoon.app', '2026-10-01', 1197, null, true),
  ('aicartoon.app', '2026-11-01', 4200, null, false),
  ('pgsgrove.com', '2026-06-01', 1568, null, true),
  ('pgsgrove.com', '2026-07-01', 1876, null, true),
  ('pgsgrove.com', '2026-08-01', 2547, null, true),
  ('pgsgrove.com', '2026-09-01', 4204, null, true),
  ('pgsgrove.com', '2026-10-01', 9175, null, true),
  ('pgsgrove.com', '2026-11-01', 28900, null, false),
  ('talya.app', '2026-06-01', 703, null, true),
  ('talya.app', '2026-07-01', 840, null, true),
  ('talya.app', '2026-08-01', 1136, null, true),
  ('talya.app', '2026-09-01', 1864, null, true),
  ('talya.app', '2026-10-01', 4038, null, true),
  ('talya.app', '2026-11-01', 12600, null, false),
  ('musegen.ai', '2026-06-01', 1661, null, true),
  ('musegen.ai', '2026-07-01', 1954, null, true),
  ('musegen.ai', '2026-08-01', 2582, null, true),
  ('musegen.ai', '2026-09-01', 4089, null, true),
  ('musegen.ai', '2026-10-01', 8430, null, true),
  ('musegen.ai', '2026-11-01', 24700, null, false),
  ('mathssolverai.com', '2026-06-01', 904, null, true),
  ('mathssolverai.com', '2026-07-01', 1050, null, true),
  ('mathssolverai.com', '2026-08-01', 1358, null, true),
  ('mathssolverai.com', '2026-09-01', 2080, null, true),
  ('mathssolverai.com', '2026-10-01', 4094, null, true),
  ('mathssolverai.com', '2026-11-01', 11300, null, false),
  ('speechyou.com', '2026-06-01', 4033, null, true),
  ('speechyou.com', '2026-07-01', 4619, null, true),
  ('speechyou.com', '2026-08-01', 5841, null, true),
  ('speechyou.com', '2026-09-01', 8651, null, true),
  ('speechyou.com', '2026-10-01', 16216, null, true),
  ('speechyou.com', '2026-11-01', 42000, null, false),
  ('spiceform.com', '2026-06-01', 2699, null, true),
  ('spiceform.com', '2026-07-01', 3045, null, true),
  ('spiceform.com', '2026-08-01', 3754, null, true),
  ('spiceform.com', '2026-09-01', 5344, null, true),
  ('spiceform.com', '2026-10-01', 9458, null, true),
  ('spiceform.com', '2026-11-01', 22700, null, false)
on conflict (domain, month) do update set
  visits = excluded.visits, revenue_signal = excluded.revenue_signal, derived = excluded.derived;

-- 校验：
--   select count(*) from public.ai_site_detail;   -- 期望 19
--   select count(*) from public.ai_site_series;   -- 期望 78
--   匿名调 site_detail() 应拿到 market = null
