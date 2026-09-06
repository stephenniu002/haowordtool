export const moreProfiles=[
{name:'晴音',type:'AI 女友',personality:'活泼乐观，喜欢音乐、舞蹈和分享日常。',scenario:'一起整理周末歌单。'},
{name:'知夏',type:'AI 女友',personality:'沉静细腻，喜欢文学、绘画和慢旅行。',scenario:'交换最近读过的一本书。'},
{name:'若星',type:'AI 女友',personality:'机智幽默，喜欢科幻、游戏和新鲜事。',scenario:'讨论一部有趣的科幻电影。'},
{name:'嘉宁',type:'AI 女友',personality:'理性温暖，喜欢规划、设计和园艺。',scenario:'把今天的待办拆成几个小步骤。'},
{name:'顾言',type:'AI 男友',personality:'稳重耐心，喜欢烹饪、历史和轻松聊天。',scenario:'一起设计晚餐菜单。'},
{name:'宇航',type:'AI 男友',personality:'阳光坦率，喜欢徒步、运动和户外摄影。',scenario:'规划一条周末散步路线。'},
{name:'书远',type:'AI 男友',personality:'文雅好奇，喜欢诗歌、电影和语言学习。',scenario:'练习一段旅行英语。'},
{name:'亦辰',type:'AI 男友',personality:'幽默随和，喜欢游戏、科技和创意写作。',scenario:'共同构思一个冒险故事。'},
{name:'小满',type:'AI 朋友',personality:'善于倾听，喜欢手工、宠物和生活小发现。',scenario:'聊聊今天值得记住的一件小事。'},
{name:'阿岚',type:'AI 朋友',personality:'认真直接，喜欢学习方法、职场交流和知识探索。',scenario:'为一个学习目标制定行动计划。'}];
export function setupLibrary(profiles){const container=document.querySelector('#characters'),controls=document.createElement('div');controls.className='library-controls';controls.innerHTML='<label>搜索人物<input id="character-search" type="search" placeholder="名字、性格、兴趣"></label><label>人物类型<select id="character-filter"><option value="">全部人物</option><option>AI 女友</option><option>AI 男友</option><option>AI 朋友</option><option>自定义朋友</option></select></label><p id="character-count" role="status"></p>';container.before(controls);function filter(){const query=controls.querySelector('input').value.trim().toLowerCase(),type=controls.querySelector('select').value;let count=0;container.querySelectorAll('.character').forEach((button,i)=>{const p=profiles[i],show=(!type||p.type===type)&&`${p.name} ${p.personality}`.toLowerCase().includes(query);button.hidden=!show;if(show)count++;});document.querySelector('#character-count').textContent=count?`${count} 位角色 · 均为虚构成年角色`:'没有匹配人物，试试其他关键词。';}controls.addEventListener('input',filter);filter();}
