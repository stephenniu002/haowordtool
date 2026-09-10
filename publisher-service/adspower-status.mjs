export async function adspowerStatus(env,fetcher=fetch){
  if(!env.ADSPOWER_API_KEY||!env.ADSPOWER_PROFILE_ID)return {configured:false,active:false,reason:'Missing local API key or profile ID'};
  const url=new URL(env.ADSPOWER_API_BASE||'http://127.0.0.1:50326');
  // Never send the locally stored key to an external host or follow redirects.
  if(url.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('AdsPower API must be a loopback origin');
  url.pathname='/api/v1/browser/active';url.searchParams.set('user_id',env.ADSPOWER_PROFILE_ID);
  try{
    const response=await fetcher(url,{headers:{Authorization:`Bearer ${env.ADSPOWER_API_KEY}`},redirect:'error',signal:AbortSignal.timeout(5000)});
    const result=await response.json();
    return {configured:true,active:response.ok&&result.code===0&&result.data?.status==='Active',profileId:env.ADSPOWER_PROFILE_ID,reason:result.code===0?null:'AdsPower API authentication or profile check failed',publishingVerified:false};
  }catch{return {configured:true,active:false,reason:'AdsPower Local API unavailable',publishingVerified:false};}
}
