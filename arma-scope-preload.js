/* A.R.M.A. SCOPE PRELOAD CLIENT V1 - 2026-08-17
 * Shared runtime context for ARMA HTML modules.
 * Backend authority remains mandatory for every write/action.
 */
(function(global){
  'use strict';

  const VERSION='ARMA_SCOPE_PRELOAD_CLIENT_V2_RECOVERY_20260820';
  const DEFAULT_API='https://script.google.com/macros/s/AKfycbyuMMeKzICtFnCnMA3xfmBj9hR1KHklRXytrod5Cj6FVOjjUBrem6bf7JW_Omd68X1FEQ/exec';
  const TTL=10*60*1000;

  function norm(v){
    return String(v==null?'':v).trim().toUpperCase();
  }

  function token(){
    return localStorage.getItem('ARMA_TOKEN') ||
           sessionStorage.getItem('ARMA_TOKEN') || '';
  }

  function session(){
    try{
      return JSON.parse(localStorage.getItem('ARMA_SESSION_CACHE')||'{}')||{};
    }catch(e){ return {}; }
  }

  function userName(explicit){
    return norm(explicit || session().user || '');
  }

  function key(user){
    return 'ARMA_SCOPE_PRELOAD_V2_'+userName(user);
  }

  function read(user){
    const u=userName(user);
    if(!u)return null;
    try{
      const raw=localStorage.getItem(key(u))||'';
      if(!raw)return null;
      const box=JSON.parse(raw);
      if(!box||!box.data)return null;
      if(Date.now()-Number(box.ts||0)>TTL)return null;
      return box.data;
    }catch(e){return null;}
  }

  function write(data){
    const u=userName(data&&data.context&&data.context.user);
    if(!u||!data||data.ok===false)return false;
    try{
      localStorage.setItem(key(u),JSON.stringify({
        ts:Date.now(),
        version:data.preloadVersion||'',
        data:data
      }));
      return true;
    }catch(e){return false;}
  }

  function clear(user){
    try{
      const u=userName(user);
      if(u)localStorage.removeItem(key(u));
    }catch(e){}
  }

  async function request(apiUrl,opts){
    opts=opts||{};
    const t=opts.token||token();
    if(!t)throw new Error('SIN_SESION_ACTIVA');

    const ctl=new AbortController();
    const timer=setTimeout(function(){ctl.abort();},Number(opts.timeoutMs||15000));

    try{
      const res=await fetch(apiUrl||DEFAULT_API,{
        method:'POST',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({
          action:'userScopePreload',
          token:t
        }),
        signal:ctl.signal,
        cache:'no-store'
      });
      const raw=await res.text();
      let data;
      try{data=JSON.parse(raw);}catch(e){
        throw new Error('RESPUESTA_SCOPE_PRELOAD_NO_JSON // HTTP '+res.status);
      }
      if(!data.ok)throw new Error(data.error||data.detail||'SCOPE_PRELOAD_ERROR');
      write(data);
      return data;
    }finally{
      clearTimeout(timer);
    }
  }

  async function boot(apiUrl,onData,opts){
    opts=opts||{};
    const s=session();
    const cached=read(s.user);
    if(cached&&typeof onData==='function'){
      try{onData(cached,{source:'LOCAL_CACHE'});}catch(e){}
    }
    try{
      const fresh=await request(apiUrl,opts);
      if(typeof onData==='function'){
        onData(fresh,{source:'BACKEND'});
      }
      return fresh;
    }catch(e){
      if(cached)return cached;
      throw e;
    }
  }

  function reportCatalog(data){
    data=data||{};
    const st=data.staticCatalog||{};
    const selectors=data.selectors||{};
    return {
      ok:true,
      source:'ARMA_SCOPE_PRELOAD_CLIENT',
      preloadVersion:data.preloadVersion||'',
      personasReporte:selectors.reportBTPeople||[],
      equipos:data.nodes||[],
      plantasMel:data.plants||[],
      plantas:data.plants||[],
      tiposTrabajo:st.tiposTrabajo||[],
      prioridades:st.prioridades||[],
      estados:st.estados||[]
    };
  }

  global.ARMA_SCOPE_PRELOAD={
    version:VERSION,
    token:token,
    session:session,
    read:read,
    write:write,
    clear:clear,
    request:request,
    boot:boot,
    reportCatalog:reportCatalog
  };
})(window);
