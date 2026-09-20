(function(){
'use strict';

const MPW_VERSION='MP_WINDOWS_UI_V1_3_LAYOUT_POLISH_20260919';
let MPW_DATA=null;
let MPW_YEAR=0;
let MPW_BUSY=false;
let MPW_HIGHLIGHT=localStorage.getItem('ARMA_MP_WINDOWS_HIGHLIGHT')!=='0';

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

function exactTextElement(label){
  const target=norm(label);
  for(const e of qa('body *')){
    if(e.children.length>2)continue;
    if(norm(e.textContent)===target)return e;
  }
  return null;
}

function cardFromLabel(label){
  const e=exactTextElement(label);
  if(!e)return null;
  let p=e;
  for(let i=0;i<5&&p;i++,p=p.parentElement){
    const rect=p.getBoundingClientRect();
    const t=norm(p.textContent);
    if(rect.width>100&&rect.height>45&&rect.height<180&&t.includes(norm(label)))return p;
  }
  return e.parentElement;
}

function commonParent(nodes){
  const valid=nodes.filter(Boolean);
  if(valid.length<2)return valid[0]?valid[0].parentElement:null;
  let p=valid[0].parentElement;
  while(p&&p!==document.body){
    if(valid.every(n=>p.contains(n)))return p;
    p=p.parentElement;
  }
  return null;
}

function ensureStyle(){
  if(document.getElementById('mpw-style'))return;
  const s=document.createElement('style');
  s.id='mpw-style';
  s.textContent=`
  #mpwToolbar{display:none!important}
  .mpw-top-tools{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:nowrap;flex:0 0 520px;min-width:520px;min-height:68px;padding:9px 12px;background:#fff;border:1px solid #d7e2ee;border-radius:14px;box-shadow:0 4px 13px rgba(0,52,110,.08)}
  .mpw-action{border:0;border-radius:10px;height:38px;padding:0 10px;color:#fff;font-size:10.5px;font-weight:950;letter-spacing:.1px;cursor:pointer;white-space:nowrap;box-shadow:0 5px 13px rgba(0,52,110,.14);display:inline-flex;align-items:center;justify-content:center}
  .mpw-action.primary{background:linear-gradient(135deg,#006bb9,#00a8bd);flex:0 0 124px}
  .mpw-action.print{background:#344f6f;flex:0 0 88px}.mpw-action.pdf{background:#c82d3d;flex:0 0 112px}
  .mpw-action.toggle{flex:0 0 128px;min-width:128px}.mpw-action.toggle.on{background:#16a34a}.mpw-action.toggle.off{background:#64748b}
  .mpw-action:hover{filter:brightness(1.05)}.mpw-action:disabled{opacity:.6;cursor:wait}
  .mpw-kpi-parent{display:flex!important;align-items:stretch!important;justify-content:flex-end!important;gap:10px!important;flex-wrap:nowrap!important}
  .mpw-kpi-card{flex:1 1 0!important;min-width:0!important;max-width:none!important}
  .mpw-row-badge{display:inline-flex;margin-left:8px;padding:3px 7px;border-radius:999px;font-size:9px;font-weight:950;vertical-align:middle;cursor:pointer}
  .mpw-row-badge.ok{background:#dcfce7;color:#166534;border:1px solid #86efac}
  .mpw-row-badge.none{background:#eef2f7;color:#64748b;border:1px solid #d8e2ee}
  .mpw-row-badge.nomap{background:#fff7ed;color:#9a3412;border:1px solid #fed7aa}
  .mpw-row-badge.nocover{background:#fef9c3;color:#854d0e;border:1px solid #fde047}
  td.mpw-window-month{box-shadow:inset 0 0 0 3px #16a34a!important;background-image:linear-gradient(rgba(220,252,231,.38),rgba(220,252,231,.38))!important}
  .mpw-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,22,52,.62);display:none;align-items:flex-start;justify-content:center;padding:4vh 18px;overflow:auto}
  .mpw-overlay.open{display:flex}.mpw-modal{width:min(1260px,100%);background:#fff;border-radius:20px;box-shadow:0 25px 80px rgba(0,0,0,.28);overflow:hidden}
  .mpw-head{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:17px 20px;color:#fff;background:linear-gradient(135deg,#003b78,#006bb9,#00a8bd)}
  .mpw-head h2{margin:0;font-size:22px}.mpw-head p{margin:4px 0 0;font-size:11px;font-weight:800;opacity:.92}
  .mpw-close{border:0;background:#fff;color:#003b78;width:36px;height:36px;border-radius:50%;font-size:22px;font-weight:900;cursor:pointer}
  .mpw-body{padding:16px 18px 20px}.mpw-rule{padding:10px 12px;background:#eef8ff;border-left:4px solid #00a8bd;border-radius:10px;color:#23405f;font-size:11px;font-weight:800;margin-bottom:13px;line-height:1.55}
  .mpw-warning{padding:10px 12px;background:#fff7ed;border-left:4px solid #f59e0b;border-radius:10px;color:#7c2d12;font-size:11px;font-weight:800;margin-bottom:13px;line-height:1.55}
  .mpw-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-bottom:14px}
  .mpw-stat{padding:10px;border:1px solid #d9e5f1;border-radius:12px;background:#f8fbff}.mpw-stat span{display:block;font-size:9px;color:#64748b;font-weight:900}.mpw-stat strong{display:block;margin-top:4px;font-size:20px;color:#003b78}
  .mpw-section{margin-top:15px}.mpw-section h3{margin:0 0 8px;color:#003b78;font-size:14px}.mpw-table-wrap{overflow:auto;border:1px solid #dce6f0;border-radius:12px}
  .mpw-table{width:100%;border-collapse:collapse;font-size:11px}.mpw-table th{position:sticky;top:0;background:#075f9d;color:#fff;text-align:left;padding:9px;white-space:nowrap}.mpw-table td{padding:9px;border-bottom:1px solid #e6edf5;vertical-align:top}.mpw-table tr:last-child td{border-bottom:0}
  .mpw-pill{display:inline-flex;padding:3px 7px;border-radius:999px;font-size:9px;font-weight:950}.mpw-pill.match{background:#dcfce7;color:#166534}.mpw-pill.hist{background:#e0f2fe;color:#075985}
  .mpw-list{display:flex;gap:7px;flex-wrap:wrap}.mpw-chip{padding:6px 9px;border-radius:999px;background:#f1f5f9;border:1px solid #d8e2ee;font-size:10px;font-weight:850;color:#475569}.mpw-empty{padding:22px;text-align:center;color:#64748b;font-weight:850}
  @media(max-width:1250px){.mpw-kpi-parent{flex-wrap:wrap!important}.mpw-top-tools{flex:1 1 100%;min-width:100%;order:-1}.mpw-kpi-card{flex:1 1 calc(25% - 10px)!important;min-width:145px!important}}
  @media(max-width:800px){.mpw-stats{grid-template-columns:repeat(2,1fr)}.mpw-head h2{font-size:18px}.mpw-top-tools{flex-wrap:wrap;min-height:auto}.mpw-action.primary,.mpw-action.toggle,.mpw-action.print,.mpw-action.pdf{flex:1 1 46%;min-width:130px}.mpw-kpi-card{flex:1 1 calc(50% - 10px)!important}}
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

function ensureTopControls(){
  const old=document.getElementById('mpwToolbar');
  if(old)old.remove();

  const labels=['PROYECTOS AÑO','P4 PENDIENTES','P5 PENDIENTES','P4 VENCIDAS'];
  const cards=labels.map(cardFromLabel);
  const parent=commonParent(cards);
  if(!parent)return false;

  parent.classList.add('mpw-kpi-parent');
  cards.filter(Boolean).forEach(c=>c.classList.add('mpw-kpi-card'));

  let tools=document.getElementById('mpwTopTools');
  if(!tools){
    tools=document.createElement('div');
    tools.id='mpwTopTools';
    tools.className='mpw-top-tools';
    tools.innerHTML=
      '<button id="mpwButton" class="mpw-action primary" type="button">VENTANAS MTTO</button>'+ 
      '<button id="mpwToggle" class="mpw-action toggle" type="button"></button>'+ 
      '<button id="mpwPrint" class="mpw-action print" type="button">IMPRIMIR</button>'+ 
      '<button id="mpwPdf" class="mpw-action pdf" type="button">EXPORTAR PDF</button>';
    parent.insertBefore(tools,parent.firstChild);
    q('#mpwButton').addEventListener('click',()=>loadWindows(true));
    q('#mpwToggle').addEventListener('click',toggleHighlights);
    q('#mpwPrint').addEventListener('click',()=>printOrPdf(false));
    q('#mpwPdf').addEventListener('click',()=>printOrPdf(true));
  }else if(tools.parentElement!==parent){
    parent.insertBefore(tools,parent.firstChild);
  }
  updateToggleButton();
  return true;
}

function updateToggleButton(){
  const b=q('#mpwToggle');
  if(!b)return;
  b.classList.toggle('on',MPW_HIGHLIGHT);
  b.classList.toggle('off',!MPW_HIGHLIGHT);
  b.textContent=MPW_HIGHLIGHT?'RESALTADO ON':'RESALTADO OFF';
}

function toggleHighlights(){
  MPW_HIGHLIGHT=!MPW_HIGHLIGHT;
  localStorage.setItem('ARMA_MP_WINDOWS_HIGHLIGHT',MPW_HIGHLIGHT?'1':'0');
  updateToggleButton();
  qa('td.mpw-window-month').forEach(td=>td.classList.remove('mpw-window-month'));
  if(MPW_HIGHLIGHT&&MPW_DATA)decoratePortfolio(MPW_DATA);
}

async function callApi(action,payload){
  if(typeof window.api==='function')return await window.api(action,payload||{});
  if(typeof api==='function')return await api(action,payload||{});
  throw new Error('API DE CRONOGRAMAS MP NO DISPONIBLE');
}

async function fetchWindowsData(){
  const year=detectYear();
  if(MPW_DATA&&MPW_YEAR===year)return MPW_DATA;
  const d=await callApi('mpMaintenanceWindows',{year:year,minDays:2,safetyDays:10});
  if(!d||d.ok!==true)throw new Error((d&&d.error)||'RESPUESTA INVALIDA');
  MPW_DATA=d;
  MPW_YEAR=year;
  decoratePortfolio(d);
  return d;
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
    if(!MPW_HIGHLIGHT)return;
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

function buildPrintableHtml(data,pdfMode){
  const s=data.summary||{};
  const wr=windowRows(data.assets||[]);
  const rows=wr.map(x=>{
    const a=x.a,w=x.w;
    return '<tr>'+ 
      '<td><b>'+esc(a.NOMBRE_ACTIVO||a.ID_ACTIVO_MEL)+'</b><br><span>'+esc(a.CODIGO_TAG||'')+'</span></td>'+ 
      '<td>'+esc((a.CDG_MQN_DATAPEL||[]).join(' / ')||'--')+'</td>'+ 
      '<td>'+esc(fmtDate(w.DESDE))+'</td>'+ 
      '<td>'+esc(fmtDate(w.HASTA))+'</td>'+ 
      '<td class="n">'+esc(w.DIAS)+'</td>'+ 
      '<td>'+esc(originText(w))+'</td>'+ 
      '<td>'+esc(a.MESES_PLAN_TEXTO||'SIN MES MP')+'</td>'+ 
      '<td>'+esc(w.COINCIDE_MES_PLAN?'COINCIDE CON MES MP':'OPORTUNIDAD HISTORICA')+'</td>'+ 
      '</tr>';
  }).join('');
  const note=pdfMode?'<div class="pdfnote">PARA GUARDAR COMO PDF: EN EL DIALOGO DE IMPRESION SELECCIONE "GUARDAR COMO PDF".</div>':'';
  return '<!doctype html><html><head><meta charset="utf-8"><title>ARMA - Ventanas de Mantenimiento '+esc(data.year)+'</title>'+ 
    '<style>@page{size:A4 landscape;margin:9mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#0a2d57;margin:0}header{border-bottom:4px solid #00a8bd;padding:0 0 10px;margin-bottom:12px}h1{margin:0;font-size:22px;color:#003b78}header p{margin:5px 0 0;font-size:10px;font-weight:700;color:#52677f}.meta{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:10px 0 12px}.m{border:1px solid #cfddeb;border-radius:8px;padding:7px}.m span{display:block;font-size:8px;font-weight:700;color:#64748b}.m b{display:block;font-size:17px;margin-top:3px}.rule{font-size:9px;padding:8px;border-left:4px solid #00a8bd;background:#eef8ff;margin:8px 0 12px;line-height:1.4}table{width:100%;border-collapse:collapse;font-size:8px}th{background:#075f9d;color:#fff;padding:6px;text-align:left}td{border-bottom:1px solid #dfe8f1;padding:5px;vertical-align:top}.n{text-align:center;font-weight:bold}.pdfnote{padding:7px;background:#fff3cd;border:1px solid #f5d76e;font-size:9px;font-weight:bold;margin:8px 0}footer{margin-top:10px;font-size:8px;text-align:center;color:#66788c;font-weight:bold}@media print{.pdfnote{display:none}}</style></head><body>'+ 
    '<header><h1>A.R.M.A. // INFORME DE VENTANAS DE MANTENIMIENTO</h1><p>ANO '+esc(data.year)+' // CORTE '+esc(fmtDate(data.cutoff))+' // MARGEN DE SEGURIDAD '+esc(data.safetyDays)+' DIAS // FUENTE PRD_DIARIO + DATAPEL_MAQUINA_MAP</p></header>'+note+ 
    '<div class="meta"><div class="m"><span>ACTIVOS PORTAFOLIO</span><b>'+esc(s.assetsPortfolio||0)+'</b></div><div class="m"><span>ASOCIADOS DATAPEL</span><b>'+esc(s.assetsDatapelAssociated||0)+'</b></div><div class="m"><span>COBERTURA REAL</span><b>'+esc(s.assetsWithRealCoverage||0)+'</b></div><div class="m"><span>VENTANAS</span><b>'+esc(s.windows||0)+'</b></div><div class="m"><span>DIAS EN VENTANAS</span><b>'+esc(s.daysInWindows||0)+'</b></div></div>'+ 
    '<div class="rule">'+esc(data.criterio)+'<br>'+esc(data.dataRule)+'<br>'+esc(data.coverageRule)+'</div>'+ 
    '<table><thead><tr><th>ACTIVO</th><th>CDG DATAPEL</th><th>DESDE</th><th>HASTA</th><th>DIAS</th><th>ORIGEN SIN DATO</th><th>PLAN ANUAL</th><th>LECTURA</th></tr></thead><tbody>'+(rows||'<tr><td colspan="8">SIN VENTANAS DETECTADAS.</td></tr>')+'</tbody></table>'+ 
    '<footer>ARMA // ASSET RELIABILITY & MAINTENANCE ANALYTICS // INFORME GENERADO '+esc(new Date().toLocaleString())+'</footer></body></html>';
}

async function printOrPdf(pdfMode){
  let w=null;
  try{
    w=window.open('','_blank','width=1200,height=850');
    if(!w)throw new Error('EL NAVEGADOR BLOQUEO LA VENTANA DE IMPRESION.');
    w.document.write('<html><body style="font-family:Arial;padding:30px">GENERANDO INFORME ARMA...</body></html>');
    w.document.close();
    const data=await fetchWindowsData();
    w.document.open();
    w.document.write(buildPrintableHtml(data,pdfMode));
    w.document.close();
    setTimeout(()=>{w.focus();w.print()},450);
  }catch(e){
    if(w&&!w.closed)w.close();
    alert('ARMA // '+(e.message||e));
  }
}

async function loadWindows(open=true){
  if(MPW_BUSY)return MPW_DATA;
  MPW_BUSY=true;
  const b=q('#mpwButton');
  if(b){b.disabled=true;b.textContent='ANALIZANDO...'}
  try{
    const d=await fetchWindowsData();
    if(open)openModal(d,null);
    return d;
  }catch(e){
    ensureModal();
    q('#mpwBody').innerHTML='<div class="mpw-empty">ERROR CONSULTANDO VENTANAS: '+esc(e.message||e)+'</div>';
    q('#mpwOverlay').classList.add('open');
    throw e;
  }finally{
    MPW_BUSY=false;
    if(b){b.disabled=false;b.textContent='VENTANAS MTTO'}
  }
}

function install(){
  ensureStyle();
  ensureModal();
  ensureTopControls();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
else install();

let timer=0;
const observer=new MutationObserver(function(){
  clearTimeout(timer);
  timer=setTimeout(function(){
    ensureTopControls();
    if(MPW_DATA&&MPW_YEAR===detectYear())decoratePortfolio(MPW_DATA);
  },250);
});
observer.observe(document.documentElement,{childList:true,subtree:true});

window.ARMA_MP_MaintenanceWindows={
  version:MPW_VERSION,
  load:()=>loadWindows(true),
  print:()=>printOrPdf(false),
  pdf:()=>printOrPdf(true),
  toggle:toggleHighlights
};
})();
