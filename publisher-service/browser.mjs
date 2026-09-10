import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ProviderError} from './meta.mjs';
export async function browserRun(env,dataDir,request){
  const root=join(dataDir,'sessions');await mkdir(root,{recursive:true,mode:0o700});
  const dir=await mkdtemp(join(root,'run-'));
  try{
    const file=join(dir,'request.json');await writeFile(file,JSON.stringify(request),{mode:0o600});
    await new Promise((resolve,reject)=>{
      const child=spawn(env.PUBLISHER_PYTHON,[fileURLToPath(new URL('./browser-bridge.py',import.meta.url)),file],{env,cwd:dir,windowsHide:true,stdio:'ignore'});
      const timer=setTimeout(()=>{child.kill();reject(new Error('timeout'));},20*60*1000);
      child.on('error',()=>{clearTimeout(timer);reject(new Error('worker unavailable'));});
      child.on('exit',code=>{clearTimeout(timer);code===0?resolve():reject(new Error('worker failed'));});
    });
    return JSON.parse(await readFile(join(dir,'result.json'),'utf8'));
  }catch{let auth=false;try{auth=JSON.parse(await readFile(join(dir,'error.json'),'utf8')).auth===true;}catch{}throw new ProviderError('Browser operation did not confirm completion. Check the platform and login on the worker computer.',{auth,uncertain:request.action==='publish'&&!auth});}
  finally{await rm(dir,{recursive:true,force:true});}
}
