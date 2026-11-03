-- 由 tools/pro/extract-rank.mjs 生成，勿手改
-- snapshot 2026-11-03 · 19 行
begin;
delete from public.ai_growth_index where snapshot_date = date '2026-11-03';
insert into public.ai_growth_index
  (snapshot_date, rank, domain, name, description, category, category_extra, monthly_visits, mom_growth_pct, visits_label, site_type, is_free)
values
  (date '2026-11-03', 1, 'gistra.io', 'Gistra', '把 YouTube 视频即时转成文字稿、笔记、闪卡和学习指南。', '文本生成', '教育', 3300, 9900, '3.3K', '生产力与办公', true),
  (date '2026-11-03', 2, 'yourmascot.ai', 'YourMascot', 'AI 产品吉祥物生成工具，几分钟内创建风格一致的吉祥物形象。', '图像生成', '设计', 4200, 9900, '4.2K', null, true),
  (date '2026-11-03', 3, 'picvo.ai', 'Picvo AI', '一站式 AI 创作平台，生成专业视频、图片、音乐与配音。', '视频制作', '图像生成', 5500, 6083, '5.5K', '音频与语音', true),
  (date '2026-11-03', 4, 'aidetectors.cc', 'AI Detectors', '免费检测文章是否 AI 撰写，并改写为更自然的韩语。', 'AI 检测与人性化', '文本生成', 28300, 5176, '28.3K', '生产力与办公', true),
  (date '2026-11-03', 5, 'autoanalyst.ai', 'AutoAnalyst', '面向数据分析的 AI 平台，自称 AI 数据科学家。', '生产力与办公', '图像生成', 4200, 4400, '4.2K', null, true),
  (date '2026-11-03', 6, 'munchlog.ai', 'MunchLog', '用语音或文字记录饮食、给出温和当日复盘的食物打卡工具。', '生活与娱乐', null, 3700, 1243, '3.7K', null, true),
  (date '2026-11-03', 7, 'boppy.me', 'Boppy', '免费 AI 音乐生成站，文字描述即可生成带歌词的完整歌曲。', '音频与语音', null, 67400, 1006, '67.4K', null, true),
  (date '2026-11-03', 8, 'gethandler.ai', 'Handler', '面向移动开发者的 TikTok 氛围营销 AI 代理。', '视频制作', '社交媒体', 8700, 680, '8.7K', '营销与销售', true),
  (date '2026-11-03', 9, 'noumi.ai', 'Noumi', '像同事一样理解上下文、管理任务并交付成果的 AI 个人助理。', '生活与娱乐', '聊天与陪伴', 5000, 489, '5.0K', null, true),
  (date '2026-11-03', 10, 'mnogogpt.ru', 'MnogoGPT', '俄语无 VPN 的一站式 AI 照片、视频与音乐创作工作室。', '图像生成', '视频制作', 33500, 488, '33.5K', '音频与语音', true),
  (date '2026-11-03', 11, 'careerpicai.com', 'CareerPic AI', '上传自拍，生成求职专业职业头像。', '图像生成', null, 113300, 433, '113.3K', null, false),
  (date '2026-11-03', 12, 'photoshoot.app', 'Photoshoot', '面向时尚、产品、人像场景的写真灵感与图片视频生成站。', '图像生成', '设计', 3100, 266, '3.1K', '社交媒体', false),
  (date '2026-11-03', 13, 'aicartoon.app', 'AICartoon', '把文字或图片快速生成高清卡通视频的 AI 工具站。', '图像生成', '视频制作', 4200, 251, '4.2K', null, false),
  (date '2026-11-03', 14, 'pgsgrove.com', 'Phoenix Grove', '主打利他 AI/替代智能理念的自研 AI 平台。', '聊天与陪伴', null, 28900, 215, '28.9K', null, false),
  (date '2026-11-03', 15, 'talya.app', 'Talya', '法语 AI 求职副驾驶，匹配职位、定制简历、撰写求职信。', '招聘与人力', '文本生成', 12600, 212, '12.6K', null, false),
  (date '2026-11-03', 16, 'musegen.ai', 'MuseGen', 'AI 音乐生成器，文本或歌词生成带人声原创歌曲。', '音频与语音', '文本生成', 24700, 193, '24.7K', null, false),
  (date '2026-11-03', 17, 'mathssolverai.com', 'Maths Solver AI', '面向学生的在线 AI 数学解题站。', '教育', null, 11300, 176, '11.3K', null, false),
  (date '2026-11-03', 18, 'speechyou.com', 'SpeechYou', 'AI 语音转文字工具，支持 1700 种语言。', '音频与语音', '生产力与办公', 42000, 159, '42.0K', null, false),
  (date '2026-11-03', 19, 'spiceform.com', 'Spiceform', 'AI 原生表单构建器，提示词生成表单。', '生产力与办公', null, 22700, 140, '22.7K', null, false);
commit;
