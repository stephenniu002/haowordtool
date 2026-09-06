export const PLAN = Object.freeze({name: '创作者月度订阅', usdt: 80, days: 30});
export const SCRIPT_LANGUAGES = Object.freeze({'zh-CN':'Chinese',en:'English',ja:'Japanese',fr:'French',es:'Spanish'});
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validateProject(input) {
  if (!input || typeof input !== 'object') throw new Error('项目格式不正确');
  const title = String(input.title || '').trim();
  if (!title || title.length > 80) throw new Error('标题需要 1–80 个字符');
  if (!['9:16','16:9','1:1'].includes(input.ratio)) throw new Error('请选择有效画幅');
  if (!['remotion','hyperframes'].includes(input.engine)) throw new Error('请选择渲染引擎');
  if (!Array.isArray(input.scenes) || !input.scenes.length || input.scenes.length > 12) throw new Error('分镜数量需要 1–12 个');
  const scenes = input.scenes.map((s, i) => {
    const narration = String(s.narration || '').trim();
    const heading = String(s.heading || `镜头 ${i+1}`).trim();
    const duration = Number(s.duration);
    if (!narration || narration.length > 300 || heading.length > 60 || !heading) throw new Error('每个镜头需要旁白（最多 300 字）和标题（最多 60 字）');
    if (!Number.isFinite(duration) || duration < 2 || duration > 30) throw new Error('镜头时长应为 2–30 秒');
    return {heading, narration, duration};
  });
  if (scenes.reduce((s,v)=>s+v.duration,0) > 180 || scenes.reduce((s,v)=>s+v.narration.length,0)>1800) throw new Error('单个视频最多 180 秒、1800 字');
  const language=input.language||'zh-CN';
  if(!Object.hasOwn(SCRIPT_LANGUAGES,language))throw new Error('请选择有效语言');
  return {title, language, ratio:input.ratio, engine:input.engine, captions:input.captions!==false, scenes};
}
export function draftFromText(text, settings = {}) {
  text = String(text).trim();
  if (text.length < 2 || text.length > 1800) throw new Error('请输入 2–1800 字脚本');
  const sentences = text.match(/[^。！？.!?\n]+[。！？.!?]?/g) || [text];
  const pieces = sentences.flatMap(s => [...s.trim()].reduce((a,c,i)=>{if(i%80===0)a.push('');a[a.length-1]+=c;return a;},[])).filter(Boolean);
  if (pieces.length>12) throw new Error('脚本过长，请缩短至 12 个镜头以内');
  return validateProject({title:settings.title || text.slice(0,30),language:settings.language||'zh-CN',ratio:settings.ratio||'9:16',engine:settings.engine||'remotion',captions:settings.captions,scenes:pieces.map((s,i)=>({heading:`${String(i+1).padStart(2,'0')} / ${s.slice(0,18)}`,narration:s,duration:Math.max(3,Math.min(30,Math.ceil(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(s)?s.length/4:s.split(/\s+/).length/2.4)))}))});
}
export const dimensions = ratio => ratio === '16:9' ? {width:1280,height:720} : ratio === '1:1' ? {width:1080,height:1080} : {width:720,height:1280};
export function alignedCaptions(alignment, offset = 0) {
  const {characters, character_start_times_seconds:starts, character_end_times_seconds:ends} = alignment || {};
  if (!Array.isArray(characters)||characters.length!==starts?.length||characters.length!==ends?.length||!characters.length) throw new Error('配音服务没有返回有效字幕时间轴');
  const captions=[];
  let text='',start=0,end=0,previous=0;
  characters.forEach((c,i)=>{
    if(typeof c!=='string'||!Number.isFinite(starts[i])||!Number.isFinite(ends[i])||starts[i]<previous||ends[i]<starts[i]) throw new Error('字幕时间轴不正确');
    previous=starts[i];
    if(!text)start=starts[i];
    text+=c;end=ends[i];
    if(text.length>=22||/[。！？.!?\n]/.test(c)||i===characters.length-1){if(text.trim())captions.push({text:text.trim(),start:offset+start,end:offset+Math.max(end,start+0.05)});text='';}
  });
  return captions;
}
export function srt(captions) {
  const time = seconds => {const ms=Math.round(seconds*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
  return captions.map((c,i)=>`${i+1}\n${time(c.start)} --> ${time(c.end)}\n${c.text.replace(/\r?\n/g,' ')}\n`).join('\n');
}
export function hyperframeHtml(project) {
  const {width,height}=dimensions(project.ratio);
  let cursor=0;
  const scenes=project.scenes.map((s,i)=>{const start=cursor;cursor+=s.duration;return `<section class="clip scene" data-start="${start}" data-duration="${s.duration}" data-track-index="1"><div class="orb"></div><small>HAOWORD / STUDIO · ${String(i+1).padStart(2,'0')}</small><h1>${escapeHtml(s.heading)}</h1><div class="rule"></div><p>${escapeHtml(s.narration)}</p></section>${s.audio?`<audio class="clip" src="audio-${i}.mp3" data-start="${start}" data-duration="${s.duration}" data-track-index="2"></audio>`:''}`;}).join('');
  const captions=project.captions?(project.alignment||[]).map(c=>`<div class="clip subtitle" data-start="${c.start}" data-duration="${c.end-c.start}" data-track-index="3">${escapeHtml(c.text)}</div>`).join(''):'';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(project.title)}</title><meta name="description" content="Video composition"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,"Noto Sans CJK SC",sans-serif;background:#10131b;color:white}.scene{position:absolute;inset:0;padding:${width*.08}px;background:#10131b;overflow:hidden}.orb{position:absolute;width:65%;aspect-ratio:1;border:2px solid #9dff6a;border-radius:50%;right:-22%;top:-8%;opacity:.3}small{color:#a4ff78;font-size:${width*.025}px;letter-spacing:4px}h1{position:relative;margin-top:22%;font-size:${width*.08}px;line-height:1.16;overflow-wrap:anywhere}.rule{height:8px;width:90px;background:#a4ff78}p{font-size:${width*.035}px;line-height:1.7;color:#bcc3d2;overflow-wrap:anywhere}.subtitle{position:absolute;bottom:9%;left:8%;width:84%;background:#030509e8;padding:18px;text-align:center;font-size:${width*.043}px;border-radius:12px;color:#a4ff78}</style></head><body><div id="root" data-composition-id="main" data-start="0" data-duration="${cursor}" data-width="${width}" data-height="${height}">${scenes}${captions}</div></body></html>`;
}
