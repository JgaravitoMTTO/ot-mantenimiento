(function(){
'use strict';

const MPW_VERSION='MP_WINDOWS_UI_V1_1_NODATA_20260920';
let MPW_DATA=null;
let MPW_YEAR=0;
let MPW_BUSY=false;

function q(s,r){return (r||document).querySelector(s)}
function qa(s,r){return Array.from((r||document).querySelectorAll(s))}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function norm(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
function fmtDate(v){const s=String(v||'');const m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:s}
function validYear(v){const n=Number(v);return Number.isInteger(n)&&n>=2024&&n<=2100?n:0}

function detectYear(){
  const ids=['yearSelect','yearFilter','filterYear','anio','anioSelect','mpYear','year'];
  for(const id of ids){const e=document.getElementById(id);if(e){const y=validYear(e.value);if(y)return y}}
  for(const e of qa('select,input')){
    const y=validYear(e.value);
    if(!y)continue;
    const ctx=norm((e.id||'')+' '+(e.name||'')+' '+((e.previousElementSibling&&e.previousElementSibling.textContent)||''));
    if(ctx.includes('ANIO')||ctx.includes('ANO')||ctx.includes('YEAR'))return y;
  }
  return new Date().getFullYear();
}

function findPortfolioTable(){
  const tables=qa('table');
  for(const t of tables){
    const hs=qa('thead th',t).map(x=>norm(x.textContent));
    if(!hs.length)continue;
    const hasAsset=hs.some(x=>x==='ACTIVO'||x.includes('ACTIVO'));
    const hasMonth=hs.some(x=>['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'].includes(x));
    if(hasAsset&&hasMonth)return t;
  }
  return null;
}

function ensureStyle(){
  if(document.getElementById('mpw-style'))return;
  const s=document.createElement('style');
  s.id='mpw-style';
  s.textContent=`
  .mpw-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:10px 0 12px;padding:11px 13px;border:1px solid #cfe0f2;border-radius:14px;background:linear-gradient(180deg,#f8fbff,#eef7ff)}
  .mpw-toolbar-note{color:#53657a;font-size:11px;font-weight:800}
  .mpw-btn{border:0;border-radius:12px;padding:11px 16px;background:linear-gradient(135deg,#006bb9,#00a8bd);color:#fff;font-weight:950;letter-spacing:.2px;cursor:pointer;box-shadow:0 8px 18px rgba(0,75,155,.18)}
  .mpw-btn:hover{filter:brightness(1.04)}.mpw-btn:disabled{opacity:.65;cursor:wait}
  .mpw-row-badge{display:inline-flex;margin-left:8px;padding:3px 7px;border-radius:999px;font-size:9px;font-weight:950;vertical-align:middle;cursor:pointer}
  .mpw-row-badge.ok{background:#dcfce7;color:#166534;border:1px solid #86efac}
  .mpw-row-badge.none{background:#eef2f7;color:#64748b;border:1px solid #d8e2ee}
  .mpw-row-badge.nomap{background:#fff7ed;color:#9a3412;border:1px solid #fed7aa}
  .mpw-row-badge.nocover{background:#fef9c3;color:#854d0e;border:1px solid #fde047}
  td.mpw-window-month{box-shadow:inset 0 0 0 3px #16a34a!important;background-image:linear-gradient(rgba(220,252,231,.38),rgba(220,252,231,.38))!important}
  .mpw-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,22,52,.62);display:none;align-items:flex-start;justify-content:center;padding:4vh 18px;overflow:auto}
  .mpw-overlay.open{display:flex}
  .mpw-modal{width:min(1260px,100%);background:#fff;border-radius:20px;box-shadow:0 25px 80px rgba(0,0,0,.28);overflow:hidden}
  .mpw-head{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:17px 20px;color:#fff;background:linear-gradient(135deg,#003b78,#006bb9,#00a8bd)}
  .mpw-head h2{margin:0;font-size:22px}.mpw-head p{margin:4px 0 0;font-size:11px;font-weight:800;opacity:.92}
  .mpw-close{border:0;background:#fff;color:#003b78;width:36px;height:36px;border-radius:50%;font-size:22px;font-weight:900;cursor:pointer}
  .mpw-body{padding:16px 18px 20px}
  .mpw-rule{padding:10px 12px;background:#eef8ff;border-left:4px solid #00a8bd;border-radius:10px;color:#23405f;font-size:11px;font-weight:800;margin-bottom:13px;line-height:1.55}
  .mpw-warning{padding:10px 12px;background:#fff7ed;border-left:4px solid #f59e0b;border-radius:10px;color:#7c2d12;font-size:11px;font-weight:800;margin-bottom:13px;line-height:1.55}
  .mpw-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-bottom:14px}
  .mpw-stat{padding:10px;border:1px solid #d9e5f1;border-radius:12px;background:#f8fbff}.mpw-stat span{display:block;font-size:9px;color:#64748b;font-weight:900}.mpw-stat strong{display:block;margin-top:4px;font-size:20px;color:#003b78}
  .mpw-section{margin-top:15px}.mpw-section h3{margin:0 0 8px;color:#003b78;font-size:14px}
  .mpw-table-wrap{overflow:auto;border:1px solid #dce6f0;border-radius:12px}
  .mpw-table{width:100%;border-collapse:collapse;font-size:11px}.mpw-table th{position:sticky;top:0;background:#075f9d;color:#fff;text-align:left;padding:9px;white-space:nowrap}.mpw-table td{padding:9px;border-bottom:1px solid #e6edf5;vertical-align:top}.mpw-table tr:last-child td{border-bottom:0}
  .mpw-pill{display:inline-flex;padding:3px 7px;border-radius:999px;font-size:9px;font-weight:950}.mpw-pill.match{background:#dcfce7;color:#166534}.mpw-pill.hist{background:#e0f2fe;color:#075985}
  .mpw-list{display:flex;gap:7px;flex-wrap:wrap}.mpw-chip{padding:6px 9px;border-radius:999px;background:#f1f5f9;border:1px solid #d8e2ee;font-size:10px;font-weight:850;color:#475569}
  .mpw-empty{padding:22px;text-align:center;color:#64748b;font-weight:850}
  @media(max-width:800px){.mpw-stats{grid-template-columns:repeat(2,1fr)}.mpw-head h2{font-size:18px}}
  `;
  document.head.appendChild(s);
}

function ensureModal(){
  if(document.getElementById('mpwOverlay'))return;
  const d=document.createElement('div');
  d.id='mpwOverlay';
  d.className='mpw-overlay';
  d.innerHTML='<div class="mpw-modal"><div class="mpw-head"><div><h2>VENTANAS DE MANTENIMIENTO</h2><p id="mpwSubtitle">AUSENCIA HISTORICA DE DATO DATAPEL</p></div><button class="mpw-close" id="mpwClose" type="button">X</button></div><div class="mpw-body" id="mpwBody"></div></div>';
  document.body.appendChild(d);
  q('#mpwClose').addEventListener('click',()=>d.classList.remove('open'));
  d.addEventListener('click',e=>{if(e.target===d)d.classList.remove('open')});
}

function ensureToolbar(){
  const table=findPortfolioTable();
  if(!table)return false;
  if(document.getElementById('mpwToolbar'))return true;
  const bar=document.createElement('div');
  bar.id='mpwToolbar';
  bar.className='mpw-toolbar';
  bar.innerHTML='<div><button id="mpwButton" class="mpw-btn" type="button">VENTANAS DE MANTENIMIENTO</button></div><div class="mpw-toolbar-note">2+ DIAS SIN DATO // ASOCIACION DATAPEL CONFIRMADA // SOLO FECHAS HASTA HOY-10 DIAS</div>';
  table.parentNode.insertBefore(bar,table);
  q('#mpwButton').addEventListener('click',()=>loadWindows());
  return true;
}

async function callApi(action,payload){
  if(typeof window.api==='function')return await window.api(action,payload||{});
  if(typeof api==='function')return await api(action,payload||{});
  throw new Error('API DE CRONOGRAMAS MP NO DISPONIBLE');
}

function assetAliases(a){
  return [a.NOMBRE_ACTIVO,a.CODIGO_TAG,a.ID_ACTIVO_MEL].concat(a.ALIASES||[]).map(norm).filter(Boolean);
}

function matchAssetFromCell(text,data){
  const n=norm(text);
  let best=null,bestLen=0;
  for(const a of (data.assets||[])){
    for(const x of assetAliases(a)){
      if(x.length<2)continue;
      if(n===x)return a;
      if((n.includes(x)||x.includes(n))&&Math.min(n.length,x.length)>bestLen){best=a;bestLen=Math.min(n.length,x.length)}
    }
  }
  return best;
}

function monthIndexes(table){
  const out={};
  const th=qa('thead th',table);
  th.forEach((h,i)=>{
    const n=norm(h.textContent).slice(0,3);
    const m=['','ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'].indexOf(n);
    if(m>0)out[m]=i;
  });
  return out;
}

function statusBadge(a){
  if(a.CANTIDAD_VENTANAS)return {cls:'ok',txt:'VENTANA '+a.VENTANA_MAS_LARGA_DIAS+'D'};
  if(a.ESTADO==='SIN_ASOCIACION_DATAPEL')return {cls:'nomap',txt:'SIN ASOC. DATAPEL'};
  if(a.ESTADO==='ASOCIADO_SIN_COBERTURA_REAL')return {cls:'nocover',txt:'SIN COBERTURA REAL'};
  return {cls:'none',txt:'SIN VENTANA >1D'};
}

function decoratePortfolio(data){
  const table=findPortfolioTable();
  if(!table)return;
  const mi=monthIndexes(table);
  qa('tbody tr',table).forEach(tr=>{
    qa('.mpw-row-badge',tr).forEach(x=>x.remove());
    qa('td.mpw-window-month',tr).forEach(x=>x.classList.remove('mpw-window-month'));
    const cells=qa('td',tr);
    if(!cells.length)return;
    const a=matchAssetFromCell(cells[0].textContent,data);
    if(!a)return;
    const sb=statusBadge(a);
    const b=document.createElement('span');
    b.className='mpw-row-badge '+sb.cls;
    b.textContent=sb.txt;
    b.title='VER VENTANAS DE MANTENIMIENTO';
    b.addEventListener('click',e=>{e.stopPropagation();openModal(data,a)});
    cells[0].appendChild(b);
    const months=new Set();
    (a.VENTANAS||[]).forEach(w=>(w.MESES||[]).forEach(m=>months.add(Number(m))));
    months.forEach(m=>{
      const idx=mi[m];
      if(idx==null||!cells[idx])return;
      cells[idx].classList.add('mpw-window-month');
      const ws=(a.VENTANAS||[]).filter(w=>(w.MESES||[]).map(Number).includes(m));
      cells[idx].title='SIN DATO DATAPEL: '+ws.map(w=>fmtDate(w.DESDE)+' - '+fmtDate(w.HASTA)+' ('+w.DIAS+' DIAS)').join(' | ');
    });
  });
}

function windowRows(assets){
  const rows=[];
  for(const a of assets){
    for(const w of (a.VENTANAS||[]))rows.push({a,w});
  }
  return rows;
}

function originText(w){
  if(w.ORIGEN_SIN_DATO==='SIN_FILA')return 'SIN FILA PRD_DIARIO';
  if(w.ORIGEN_SIN_DATO==='LEGADO_0_0_SIN_REGISTRO')return 'LEGADO 0/0, NRO_REGISTROS=0';
  return 'MIXTA: SIN FILA + LEGADO 0/0';
}

function openModal(data,onlyAsset){
  ensureModal();
  const assets=onlyAsset?[onlyAsset]:(data.assets||[]);
  const wr=windowRows(assets);
  const s=data.summary||{};
  q('#mpwSubtitle').textContent='ANIO '+data.year+' // CORTE '+fmtDate(data.cutoff)+' // SEGURIDAD '+data.safetyDays+' DIAS';
  let h='<div class="mpw-rule">'+esc(data.criterio)+'<br>'+esc(data.dataRule)+'<br>'+esc(data.zeroRule)+'<br>'+esc(data.coverageRule)+'</div>';
  h+='<div class="mpw-warning">CONTROL DE CALIDAD: LOS 0/0 LEGADOS CON NRO_REGISTROS=0 SE TRATAN COMO SIN DATO. UN 0/0 CON NRO_REGISTROS&gt;0 ES DATO REAL Y NO CREA VENTANA. LA VENTANA NO REPROGRAMA NADA AUTOMATICAMENTE.</div>';
  h+='<div class="mpw-stats">';
  h+='<div class="mpw-stat"><span>ACTIVOS PORTAFOLIO</span><strong>'+esc(s.assetsPortfolio||0)+'</strong></div>';
  h+='<div class="mpw-stat"><span>ASOCIADOS DATAPEL</span><strong>'+esc(s.assetsDatapelAssociated||0)+'</strong></div>';
  h+='<div class="mpw-stat"><span>CON COBERTURA REAL</span><strong>'+esc(s.assetsWithRealCoverage||0)+'</strong></div>';
  h+='<div class="mpw-stat"><span>VENTANAS</span><strong>'+esc(s.windows||0)+'</strong></div>';
  h+='<div class="mpw-stat"><span>DIAS EN VENTANAS</span><strong>'+esc(s.daysInWindows||0)+'</strong></div>';
  h+='</div>';
  h+='<div class="mpw-section"><h3>VENTANAS DETECTADAS</h3>';
  if(!wr.length)h+='<div class="mpw-empty">NO HAY VENTANAS DE 2 O MAS DIAS PARA EL ALCANCE SELECCIONADO.</div>';
  else{
    h+='<div class="mpw-table-wrap"><table class="mpw-table"><thead><tr><th>ACTIVO</th><th>CDG DATAPEL</th><th>DESDE</th><th>HASTA</th><th>DIAS</th><th>ORIGEN SIN DATO</th><th>SIN FILA</th><th>0/0 LEGADO</th><th>PLAN ANUAL</th><th>LECTURA</th></tr></thead><tbody>';
    for(const x of wr){
      const a=x.a,w=x.w;
      h+='<tr><td><strong>'+esc(a.NOMBRE_ACTIVO||a.ID_ACTIVO_MEL)+'</strong><br><small>'+esc(a.CODIGO_TAG||'')+'</small></td><td>'+esc((a.CDG_MQN_DATAPEL||[]).join(' / ')||'--')+'</td><td>'+esc(fmtDate(w.DESDE))+'</td><td>'+esc(fmtDate(w.HASTA))+'</td><td><strong>'+esc(w.DIAS)+'</strong></td><td>'+esc(originText(w))+'</td><td>'+esc(w.DIAS_SIN_FILA||0)+'</td><td>'+esc(w.DIAS_CERO_LEGADO||0)+'</td><td>'+esc(a.MESES_PLAN_TEXTO||'SIN MES MP')+'</td><td><span class="mpw-pill '+(w.COINCIDE_MES_PLAN?'match':'hist')+'">'+(w.COINCIDE_MES_PLAN?'COINCIDE CON MES MP':'OPORTUNIDAD HISTORICA')+'</span></td></tr>';
    }
    h+='</tbody></table></div>';
  }

  const noWin=assets.filter(a=>a.ESTADO==='SIN_VENTANAS_MAYORES_1D');
  if(noWin.length)h+='<div class="mpw-section"><h3>ASOCIADOS DATAPEL, SIN VENTANA &gt; 1 DIA</h3><div class="mpw-list">'+noWin.map(a=>'<span class="mpw-chip">'+esc(a.NOMBRE_ACTIVO||a.CODIGO_TAG)+'</span>').join('')+'</div></div>';

  const noMap=assets.filter(a=>a.ESTADO==='SIN_ASOCIACION_DATAPEL');
  if(noMap.length)h+='<div class="mpw-section"><h3>SIN ASOCIACION DATAPEL CONFIRMADA</h3><div class="mpw-list">'+noMap.map(a=>'<span class="mpw-chip">'+esc(a.NOMBRE_ACTIVO||a.CODIGO_TAG)+'</span>').join('')+'</div></div>';

  const noCover=assets.filter(a=>a.ESTADO==='ASOCIADO_SIN_COBERTURA_REAL');
  if(noCover.length)h+='<div class="mpw-section"><h3>ASOCIADOS, PERO SIN PRIMER DATO REAL PARA ANCLAR HISTORIA</h3><div class="mpw-list">'+noCover.map(a=>'<span class="mpw-chip">'+esc(a.NOMBRE_ACTIVO||a.CODIGO_TAG)+'</span>').join('')+'</div></div>';

  q('#mpwBody').innerHTML=h;
  q('#mpwOverlay').classList.add('open');
}

async function loadWindows(){
  if(MPW_BUSY)return;
  MPW_BUSY=true;
  ensureModal();
  const b=q('#mpwButton');
  const year=detectYear();
  MPW_YEAR=year;
  if(b){b.disabled=true;b.textContent='ANALIZANDO AUSENCIA DE DATOS...'}
  q('#mpwBody').innerHTML='<div class="mpw-empty">CRUZANDO PORTAFOLIO '+esc(year)+' + DATAPEL_MAQUINA_MAP + PRD_DIARIO...</div>';
  q('#mpwOverlay').classList.add('open');
  try{
    const d=await callApi('mpMaintenanceWindows',{year:year,minDays:2,safetyDays:10});
    if(!d||d.ok!==true)throw new Error((d&&d.error)||'RESPUESTA INVALIDA');
    MPW_DATA=d;
    decoratePortfolio(d);
    openModal(d,null);
  }catch(e){
    q('#mpwBody').innerHTML='<div class="mpw-empty">ERROR CONSULTANDO VENTANAS: '+esc(e.message||e)+'</div>';
  }finally{
    MPW_BUSY=false;
    if(b){b.disabled=false;b.textContent='VENTANAS DE MANTENIMIENTO'}
  }
}

function install(){
  ensureStyle();
  ensureModal();
  ensureToolbar();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
else install();

let timer=0;
const observer=new MutationObserver(function(){
  clearTimeout(timer);
  timer=setTimeout(function(){
    ensureToolbar();
    if(MPW_DATA&&MPW_YEAR===detectYear())decoratePortfolio(MPW_DATA);
  },250);
});
observer.observe(document.documentElement,{childList:true,subtree:true});

window.ARMA_MP_MaintenanceWindows={version:MPW_VERSION,load:loadWindows};
})();
