// Facebook Login route for Facebook Pages + linked professional Instagram accounts.
// Credentials never enter URLs returned to the browser, logs, or result payloads.
export class ProviderError extends Error {
  constructor(message,{auth=false,uncertain=false}={}) {super(message);this.auth=auth;this.uncertain=uncertain;}
}
export function createMeta({env, fetcher=fetch, sleep=ms=>new Promise(r=>setTimeout(r,ms))}) {
  const version=env.META_GRAPH_VERSION;
  if(!/^v\d+\.\d+$/.test(version||''))throw new Error('Set META_GRAPH_VERSION to a supported version in your Meta app');
  const graph=`https://graph.facebook.com/${version}`;
  async function request(path,token,params={},method='GET') {
    const url=new URL(`${graph}/${path}`),options={method,headers:{},signal:AbortSignal.timeout(60000),redirect:'error'};
    if(token)options.headers.Authorization=`Bearer ${token}`;
    if(method==='GET')for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
    else {options.headers['Content-Type']='application/x-www-form-urlencoded';options.body=new URLSearchParams(params);}
    let response;
    try{response=await fetcher(url,options);}catch{throw new ProviderError('Meta connection interrupted. Check the platform before retrying.',{uncertain:method==='POST'});}
    let data;try{data=await response.json();}catch{throw new ProviderError('Meta returned an unreadable response.',{uncertain:method==='POST'});}
    if(!response.ok||data.error)throw new ProviderError(`Meta request failed (code ${Number(data.error?.code)||response.status}).`,{auth:[190,102].includes(Number(data.error?.code)),uncertain:response.status>=500&&method==='POST'});
    return data;
  }
  const redirectUri=`${env.PUBLIC_ORIGIN}/api/publisher/oauth/meta/callback`;
  return {
    authorize(state) {const u=new URL(`https://www.facebook.com/${version}/dialog/oauth`);u.search=new URLSearchParams({client_id:env.META_APP_ID,redirect_uri:redirectUri,state,response_type:'code',scope:'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish'});return u.href;},
    async exchange(code) {
      // POST keeps the app secret and code out of URL/access logs.
      const short=await request('oauth/access_token',null,{client_id:env.META_APP_ID,client_secret:env.META_APP_SECRET,redirect_uri:redirectUri,code},'POST');
      const long=await request('oauth/access_token',null,{grant_type:'fb_exchange_token',client_id:env.META_APP_ID,client_secret:env.META_APP_SECRET,fb_exchange_token:short.access_token},'POST');
      const accounts=[];let after;
      for(let i=0;i<20;i++) {
        const pages=await request('me/accounts',long.access_token,{fields:'id,name,access_token,instagram_business_account{id,username}',limit:'100',...(after?{after}:{})});
        for(const page of pages.data||[]) {
          if(!page.access_token)continue;
          accounts.push({platform:'facebook',remoteId:page.id,label:page.name,secret:{token:page.access_token}});
          if(page.instagram_business_account)accounts.push({platform:'instagram',remoteId:page.instagram_business_account.id,label:page.instagram_business_account.username||page.name,secret:{token:page.access_token}});
        }
        if(!pages.paging?.next)break;after=pages.paging.cursors?.after;if(!after)break;
      }
      return accounts;
    },
    async check(account,secret) {await request(account.remote_id,secret.token,{fields:'id'});return true;},
    async publish(account,secret,assetUrl,payload) {
      const token=secret.token;
      if(account.platform==='facebook') {
        // Facebook Page Video API: accepted is not the same as fully processed/public.
        const video=await request(`${account.remote_id}/videos`,token,{file_url:assetUrl,title:payload.title,description:payload.description,published:'true'},'POST');
        if(!video.id)throw new ProviderError('Facebook did not return a video ID.',{uncertain:true});
        return {status:'submitted',remoteId:String(video.id),url:`https://www.facebook.com/${video.id}`,message:'Video accepted by Facebook. Processing/review may still be pending.'};
      }
      const container=await request(`${account.remote_id}/media`,token,{media_type:'REELS',video_url:assetUrl,caption:payload.description,share_to_feed:'true'},'POST');
      if(!container.id)throw new ProviderError('Instagram did not return a container ID.',{uncertain:true});
      for(let i=0;i<10;i++) {
        const status=await request(container.id,token,{fields:'status_code'});
        if(status.status_code==='FINISHED') {
          const published=await request(`${account.remote_id}/media_publish`,token,{creation_id:container.id},'POST');
          if(!published.id)throw new ProviderError('Instagram publish result is unknown.',{uncertain:true});
          let permalink;try{permalink=(await request(published.id,token,{fields:'permalink'})).permalink;}catch{/* The publish ID is already authoritative. */}
          return {status:'published',remoteId:String(published.id),url:permalink||null};
        }
        if(['ERROR','EXPIRED'].includes(status.status_code))throw new ProviderError('Instagram could not process this video. Check its format and account limits.');
        await sleep(60000);
      }
      throw new ProviderError('Instagram processing timed out. Check this container before another attempt.',{uncertain:true});
    }
  };
}
