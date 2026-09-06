import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {openStore,transaction} from './store.mjs';
import {validateProject,alignedCaptions,srt,hyperframeHtml} from '../assets/video-core.mjs';
const here=dirname(fileURLToPath(import.meta.url)),db=openStore();
let stopping=false;
process.on('SIGTERM',()=>{stopping=true;});process.on('SIGINT',()=>{stopping=true;});
function run(file,args,cwd){return new Promise((ok,no)=>{const p=spawn(file,args,{cwd,stdio:['ignore','pipe','pipe'],shell:false});let tail='';p.stdout.on('data',d=>{tail=(tail+d).slice(-2000);});p.stderr.on('data',d=>{tail=(tail+d).slice(-2000);});const timer=setTimeout(()=>{p.kill();no(new Error('渲染超时'));},20*60000);p.on('error',e=>{clearTimeout(timer);no(e);});p.on('close',code=>{clearTimeout(timer);code===0?ok():no(new Error(`渲染器退出 ${code}: ${tail.slice(-500)}`));});});}
async function render(job){
  const project=validateProject(JSON.parse(job.project));
  const directory=resolve(process.env.DATA_DIR||'data','jobs',job.id);await mkdir(directory,{recursive:true});
  const progress=n=>db.prepare('UPDATE jobs SET progress=?,updated=? WHERE id=?').run(n,Date.now(),job.id);
  let cursor=0;project.alignment=[];
  for(let i=0;i<project.scenes.length;i++){
    const scene=project.scenes[i];
    const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(process.env.ELEVENLABS_VOICE_ID)}/with-timestamps`,{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY,'Content-Type':'application/json'},signal:AbortSignal.timeout(120000),body:JSON.stringify({text:scene.narration,model_id:process.env.ELEVENLABS_MODEL||'eleven_multilingual_v2'})});
    if(!r.ok)throw new Error('配音服务请求失败，请检查 ElevenLabs 配额和声音配置');
    const result=await r.json();if(typeof result.audio_base64!=='string'||result.audio_base64.length>15000000)throw new Error('配音文件无效或过大');
    const captions=alignedCaptions(result.normalized_alignment||result.alignment,cursor);
    const end=(result.normalized_alignment||result.alignment).character_end_times_seconds.at(-1);
    scene.duration=Math.max(scene.duration,Math.ceil((end+.35)*30)/30);
    cursor+=scene.duration;if(cursor>240)throw new Error('实际配音超过 4 分钟，请缩短脚本');
    scene.audio=`data:audio/mpeg;base64,${result.audio_base64}`;
    await writeFile(resolve(directory,`audio-${i}.mp3`),Buffer.from(result.audio_base64,'base64'));
    project.alignment.push(...captions);progress(Math.round((i+1)/project.scenes.length*40));
  }
  await writeFile(resolve(directory,'captions.srt'),srt(project.alignment),'utf8');
  await writeFile(resolve(directory,'index.html'),hyperframeHtml(project),'utf8');
  await writeFile(resolve(directory,'project.json'),JSON.stringify({...project,scenes:project.scenes.map((s,i)=>({...s,audio:`audio-${i}.mp3`}))},null,2));
  progress(45);
  if(project.engine==='hyperframes'){
    const pkg=JSON.parse(await readFile(resolve(here,'node_modules/hyperframes/package.json'),'utf8'));
    const bin=typeof pkg.bin==='string'?pkg.bin:pkg.bin.hyperframes;
    await run(process.execPath,[resolve(here,'node_modules/hyperframes',bin),'render','--output',resolve(directory,'video.mp4')],directory);
  }else{
    await writeFile(resolve(directory,'render-props.json'),JSON.stringify(project));
    await run(process.execPath,[resolve(here,'render-remotion.mjs'),directory],here);
  }
  if((await stat(resolve(directory,'video.mp4'))).size<100)throw new Error('渲染输出为空');
  db.prepare("UPDATE jobs SET status='done',progress=100,updated=? WHERE id=?").run(Date.now(),job.id);
}
console.log('Video worker started; stop gracefully before deploying.');
while(!stopping){
  // Stale work is failed, never automatically replayed (avoids charging voice APIs twice).
  db.prepare("UPDATE jobs SET status='failed',error='工作进程中断，请重新提交',updated=? WHERE status='running' AND updated<?").run(Date.now(),Date.now()-30*60000);
  const job=transaction(db,()=>{const j=db.prepare("SELECT * FROM jobs WHERE status='queued' ORDER BY created LIMIT 1").get();if(j)db.prepare("UPDATE jobs SET status='running',updated=? WHERE id=?").run(Date.now(),j.id);return j;});
  if(!job){await new Promise(r=>setTimeout(r,2000));continue;}
  const heartbeat=setInterval(()=>db.prepare('UPDATE jobs SET updated=? WHERE id=?').run(Date.now(),job.id),15000);
  try{await render(job);}catch(e){console.error(`Job ${job.id} failed: ${e.message}`);db.prepare("UPDATE jobs SET status='failed',error=?,updated=? WHERE id=?").run('制作未完成，请联系支持人员并提供任务编号，或稍后重新提交。',Date.now(),job.id);}finally{clearInterval(heartbeat);}
}
db.close();
