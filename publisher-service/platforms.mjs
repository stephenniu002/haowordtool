export const PLATFORMS = [
  {id:'facebook', name:'Facebook', language:'en', driver:'meta', note:'Facebook Pages; personal profiles are not supported by this API.'},
  {id:'instagram', name:'Instagram', language:'en', driver:'meta', note:'Professional account linked to an authorized Facebook Page.'},
  {id:'tiktok', name:'TikTok', language:'en', driver:'browser'},
  {id:'youtube', name:'YouTube', language:'en', driver:'browser'},
  {id:'douyin', name:'抖音', language:'zh', driver:'browser'},
  {id:'xiaohongshu', name:'小红书', language:'zh', driver:'browser'},
  {id:'bilibili', name:'B站', language:'zh', driver:'browser'},
  {id:'tencent', name:'视频号 / WeChat Channels', language:'zh', driver:'browser'},
  {id:'kuaishou', name:'快手', language:'zh', driver:'browser'},
  {id:'weibo', name:'微博', language:'zh', driver:'browser'},
  {id:'baijiahao', name:'百家号', language:'zh', driver:'browser'},
  {id:'alipay', name:'支付宝生活号', language:'zh', driver:'browser'},
  {id:'hupu', name:'虎扑', language:'zh', driver:'browser'},
  {id:'x', name:'X / Twitter', language:'en', driver:'unavailable', note:'Not implemented. Cannot be selected for publishing.'}
];
export const platformById = id => PLATFORMS.find(p=>p.id===id);
export function readiness(p, env) {
  if(p.driver==='meta') return Boolean(env.META_APP_ID && env.META_APP_SECRET && env.META_GRAPH_VERSION && env.PUBLIC_ORIGIN?.startsWith('https://'));
  if(p.driver==='browser') return Boolean(env.SAU_ROOT && env.PUBLISHER_PYTHON);
  return false;
}
