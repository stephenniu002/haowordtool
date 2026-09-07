// Adapter only: no network requests, cookies, identifiers, code or form content.
// Connect the site's approved analytics provider to haoword:metric to collect events.
const allowed=new Set(['workspace_open','example_import','project_import','preview_run','preview_mobile','project_export']);
export function metric(event){if(!allowed.has(event))return;const query=new URLSearchParams(location.search);const clean=value=>(value||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48);const detail={event,source:clean(query.get('utm_source'))||'direct',medium:clean(query.get('utm_medium'))||'none',campaign:clean(query.get('utm_campaign'))||'none',page:location.pathname};document.dispatchEvent(new CustomEvent('haoword:metric',{detail}));}
