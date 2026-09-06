(function(root) {
  'use strict';
  const SHA256='3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89';
  // Cache only a successful load; concurrent searches share the same request.
  function createLoader({fetchFile=root.fetch.bind(root),digest=bytes=>root.crypto.subtle.digest('SHA-256',bytes),indexWords,timeout=20000}={}) {
    let pending;
    return function load() {
      if(!pending) pending=(async()=>{
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
        try {
          const response=await fetchFile('/assets/enable1.txt',{signal:controller.signal});
          if(!response.ok) throw Error('Dictionary unavailable');
          const bytes=await response.arrayBuffer();
          const hash=Array.from(new Uint8Array(await digest(bytes)),byte=>byte.toString(16).padStart(2,'0')).join('');
          if(hash!==SHA256) throw Error('Dictionary integrity check failed');
          return indexWords(new TextDecoder().decode(bytes));
        } finally {clearTimeout(timer);}
      })().catch(error=>{pending=undefined;throw error;});
      return pending;
    };
  }
  if(typeof module!=='undefined'&&module.exports) module.exports={createLoader};else root.LetterDictionary={createLoader};
})(typeof globalThis!=='undefined'?globalThis:this);
