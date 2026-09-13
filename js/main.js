(function(){
'use strict';
var U=App.U, T=App.t;

var NAV=[
  {v:'dashboard',k:'nav_dashboard'},
  {v:'add',k:'nav_add'},
  {v:'cases',k:'nav_cases'},
  {v:'analytics',k:'nav_analytics'},
  {v:'clusters',k:'nav_clusters'},
  {v:'exposure',k:'nav_exposure'},
  {v:'organisms',k:'nav_organisms'},
  {v:'reports',k:'nav_reports'},
  {v:'backup',k:'nav_backup'},
  {v:'settings',k:'nav_settings'}
];
NAV.forEach(function(n){ n.icon=iconSvg(n.v); });
function iconSvg(name){
  var m={
    dashboard:'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
    add:'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    cases:'M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z',
    analytics:'M5 20h2V10H5v10zm6 0h2V4h-2v16zm6 0h2v-7h-2v7zM3 20h18v2H3v-2z',
    clusters:'M12 2 1 21h22L12 2zm1 14h-2v2h2v-2zm0-7h-2v5h2V9z',
    exposure:'M12 2a10 10 0 100 20 10 10 0 000-20zm0 16a6 6 0 110-12 6 6 0 010 12zm0-8a2 2 0 100 4 2 2 0 000-4z',
    organisms:'M17 3a4 4 0 100 8 4 4 0 000-8zM5 13a3 3 0 100 6 3 3 0 000-6zm8 2c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4zM5 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
    reports:'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 16h8v2H8v-2zm0-4h8v2H8v-2z',
    backup:'M11 5v8.2l-3-3-1.4 1.4L12 17l5.4-5.4L16 13.2l-3-3V5h-2zM4 19h16v2H4v-2z',
    settings:'M19.1 12.9c.1-.3.1-.6.1-.9s0-.6-.1-.9l2.1-1.6-2-3.5-2.5 1a7 7 0 00-1.6-.9L14.8 3h-4l-.3 2.9c-.6.2-1.1.5-1.6.9l-2.5-1-2 3.5 2.1 1.6c-.1.3-.1.6-.1.9s0 .6.1.9L4.4 14.5l2 3.5 2.5-1c.5.4 1 .7 1.6.9l.3 3.1h4l.3-3.1c.6-.2 1.1-.5 1.6-.9l2.5 1 2-3.5-2.1-1.6zM12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7z'
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(m[name]||m.dashboard)+'"/></svg>';
}

function buildNav(){
  var nav=document.getElementById('mainnav');
  if(!nav) return;
  nav.innerHTML='<div class="nav-scroll">'+NAV.map(function(n){ return '<button class="nav-item" data-act="nav" data-view="'+n.v+'"><span class="nic">'+n.icon+'</span><span class="nl">'+T(n.k)+'</span></button>'; }).join('')+'</div>';
}
function applyLang(lang){
  App.LANG=lang==='en'?'en':'ar';
  var root=document.documentElement;
  root.setAttribute('lang',App.LANG);
  root.setAttribute('dir',App.LANG==='ar'?'rtl':'ltr');
  var bn=document.getElementById('brand-name'); if(bn) bn.textContent='CATCH THE FLY';
  var lb=document.getElementById('langbtn'); if(lb) lb.textContent=App.LANG==='ar'?'EN':'عربي';
  var t=document.querySelector('title'); if(t) t.textContent='CATCH THE FLY';
  buildNav();
}
function setNet(){
  var el=document.getElementById('netstate');
  if(!el) return;
  var on=navigator.onLine;
  el.className='netstate'+(on?'':' off');
  el.textContent=on?'●':'◌';
  el.title=on?T('online'):T('offline');
}

function parseHash(){
  var h=location.hash.replace(/^#\/?/,'');
  var p=h.split('/');
  var name=p[0]||'dashboard';
  var valid=['dashboard','add','cases','case','analytics','clusters','exposures','exposure','organisms','reports','backup','settings','compare'];
  if(valid.indexOf(name)<0) name='dashboard';
  return {name:name,arg:p[1]};
}

var routeSeq=0;
function route(){
  var p=parseHash();
  var my=++routeSeq;
  return App.DB.loadData().then(function(){
    return App.DB.all('cases');
  }).then(function(cs){
    if(my!==routeSeq) return;
    var D=App.DB.DATA;
    D.cases=cs;
    D.casesById={};
    cs.forEach(function(c){ D.casesById[c.id]=c; });
    return App.DB.all('exposures');
  }).then(function(ex){
    if(my!==routeSeq) return;
    App.exposures=ex;
    ex.forEach(function(e){ e.auto=App.A.matchExposure(e,App.DB.DATA.cases).length; });
    return App.DB.loadConfig();
  }).then(function(cfg){
    if(my!==routeSeq) return;
    App.CONFIG=cfg;
    App.DB.DATA.demoData=!!cfg.seedLoaded;
    applyLang(cfg.lang||'ar');
    var p=parseHash();
    var mapName={case:'caseDetail',exposure:'exposures'};
    var view=mapName[p.name]||p.name;
    var arg = null;
    if(p.name==='case') arg=p.arg;
    if(p.name==='add'){ arg=p.arg||null; App.editId=arg; }
    var html;
    try{
      html=App.views[view](arg);
    }catch(err){
      console.error(err);
      html=U.empty(T('not_found'));
    }
    var app=document.getElementById('app');
    app.innerHTML=html;
    postRender(p.name,arg);
  }).catch(function(err){ console.error(err); U.toast('Error: '+err.message,'err'); });
}

function postRender(view,arg){
  U.initFields(document.getElementById('app'));
  var nav=document.querySelectorAll('#mainnav .nav-item');
  var key=(view==='caseDetail'||view==='compare')?'cases':(view==='add'&&arg?'cases':view);
  key=view==='exposures'?'exposure':key;
  key=view==='add'?'add':key;
  nav.forEach(function(b){ b.classList.toggle('active',b.getAttribute('data-view')===key); });
  var fab=document.getElementById('fab');
  if(fab) fab.classList.toggle('hide',view==='add');
  var cmp=document.getElementById('cmpOut');
  if(cmp) renderCompareOut(document.getElementById('exA'),document.getElementById('exB'));
}

function renderCompareOut(elA,elB){
  var out=document.getElementById('cmpOut');
  if(!out) return;
  if(!elA||!elB||!elA.value||!elB.value){ out.innerHTML=''; return; }
  var e1=App.exposures.filter(function(e){return String(e.id)===String(elA.value);})[0];
  var e2=App.exposures.filter(function(e){return String(e.id)===String(elB.value);})[0];
  if(!e1||!e2) return;
  var r=App.A.statCompare(e1,e2);
  if(r.error){ out.innerHTML=U.empty(T('exp_no_rate')); return; }
  function fmt(x,d){ return x==null?'—':(d===undefined?Math.round(x*100)/100:x); }
  var rows='';
  rows+='<table class="report" style="width:100%"><tr><th></th><th>A</th><th>B</th></tr>'+
    '<tr><td>'+T('cl_cases')+'</td><td class="ltr">'+r.c1+'</td><td class="ltr">'+r.c2+'</td></tr>'+
    '<tr><td>'+T('exp_count')+'</td><td class="ltr">'+r.n1+'</td><td class="ltr">'+r.n2+'</td></tr>'+
    '<tr><td>'+T('cmp_rr')+'</td><td class="ltr" colspan="2">'+fmtRR(r.rr)+'</td></tr>'+
    '<tr><td>'+T('cmp_ci')+' (RR)</td><td class="ltr" colspan="2">'+fmtCI(r.rrLo,r.rrHi)+'</td></tr>'+
    '<tr><td>'+T('cmp_or')+'</td><td class="ltr" colspan="2">'+fmt(r.or,2)+'</td></tr>'+
    '<tr><td>'+T('cmp_ci')+' (OR)</td><td class="ltr" colspan="2">'+fmtCI(r.orLo,r.orHi)+'</td></tr>'+
    '<tr><td>'+T('cmp_p')+'</td><td class="ltr" colspan="2">'+r.p.toFixed(4)+' ('+(r.method==='fisher'?T('cmp_fisher'):T('cmp_chi'))+')</td></tr>'+
  '</table>';
  out.innerHTML='<div class="mt">'+rows+(r.caution?'<div class="warnbox">'+T('cmp_caution')+'</div>':'')+'<p class="small muted">'+T('cmp_note')+'</p></div>';
  function fmtRR(x){ return x==null?'—':(x===Infinity?'∞':Math.round(x*100)/100); }
  function fmtCI(lo,hi){ return (lo==null||hi==null)?'—':Math.round(lo*100)/100+' – '+Math.round(hi*100)/100; }
}

/* ---------------- actions ---------------- */
var _temp={};
var actions={
  nav:function(el,d){ goto(d.view); },
  'toggle-lang':function(){ var next=App.LANG==='ar'?'en':'ar'; App.CONFIG.lang=next; App.DB.put('settings',App.CONFIG).then(function(){ route(); }); },
  'open-case':function(el,d){ goto('case/'+d.id); },
  'edit-case':function(el,d){ App.editId=d.id; goto('add/'+d.id); },
  'del-case':function(el,d){ if(!U.confirm(T('confirm_delete_case'))) return; App.DB.del('cases',d.id).then(function(){ U.toast(T('deleted'),'ok'); goto('cases'); }); },
  'save-case':function(el,d){ saveCase(d.mode); },
  'add-culture':function(){
    var box=document.getElementById('cultBox'); if(!box) return;
    var is=[].slice.call(box.querySelectorAll('[data-cultbox]')).map(function(b){ return Number(b.getAttribute('data-cultbox')); });
    var next=(is.length?Math.max.apply(null,is):-1)+1;
    var wrap=document.createElement('div'); wrap.innerHTML=App.ViewUtil.cultBlockHTML(null,next); box.appendChild(wrap);
    U.initFields(box);
  },
  'del-culture':function(el,d){ var b=document.querySelector('[data-cultbox="'+d.i+'"]'); if(b) b.parentNode.removeChild(b); },
  'add-org':function(el,d){
    var cc=d.c; var boxEl=document.querySelector('[data-cultbox="'+cc+'"] [data-orgs="'+cc+'"]'); if(!boxEl) return;
    var js=[].slice.call(boxEl.querySelectorAll('[data-orgrow]')).map(function(r){ return Number(r.getAttribute('data-orgrow').split('_')[1]); });
    var j=(js.length?Math.max.apply(null,js):-1)+1;
    var wrap=document.createElement('div'); wrap.innerHTML=App.ViewUtil.orgRowHTML(cc,j,null); boxEl.appendChild(wrap);
    U.initFields(boxEl);
  },
  'del-org':function(el,d){ var row=document.querySelector('[data-cultbox="'+d.c+'"] [data-orgrow="'+d.c+'_'+d.j+'"]'); if(row) row.parentNode.removeChild(row); },
  'toggle-compare':function(){ App.compareMode=!App.compareMode; U.lsSet('ctf_cmpmode',App.compareMode); route(); },
  'compare':function(){ if(App.selectedCompare&&App.selectedCompare.length) goto('compare'); },
  'clear-compare':function(){ App.selectedCompare=[]; U.lsSet('ctf_cmp',[]); route(); },
  'apply-case-filters':function(){ App.caseFilters=remapFilter(['q','status'],{fRoom:'room',fProc:'procedure',fSurgeon:'surgeon',fOrg:'organism'}); U.lsSet('ctf_casef',App.caseFilters); route(); },
  'reset-case-filters':function(){ App.caseFilters={}; U.lsSet('ctf_casef',{}); route(); },
  'apply-ana-filters':function(){ App.anaFilters=remapFilter(null,{aFrom:'from',aTo:'to',aRoom:'room',aProc:'procedure',aSurgeon:'surgeon',aOrg:'organism',aInfType:'inftype',aImplant:'implant',aEmergency:'emergency',aTrauma:'trauma',aRisk:'risk'}); U.lsSet('ctf_anaf',App.anaFilters); route(); },
  'reset-ana-filters':function(){ App.anaFilters={}; U.lsSet('ctf_anaf',{}); route(); },
  'apply-clus-filters':function(){ App.clusFilters=remapFilter(null,{clFrom:'from',clTo:'to'}); U.lsSet('ctf_clusf',App.clusFilters); route(); },
  'reset-clus-filters':function(){ App.clusFilters={}; U.lsSet('ctf_clusf',{}); route(); },
  'gen-month':function(){
    var mv=document.getElementById('repMonth'); if(!mv) return;
    var html=App.Exp.monthlyReportHTML(mv.value,App.DB.DATA.cases);
    document.getElementById('repOut').innerHTML='<div class="noprint" style="margin-bottom:10px">'+U.btn(T('print'),'print-rep',{sel:'#repOut .report'})+'</div>'+html;
  },
  'gen-inv':function(){
    var sel=document.getElementById('clSel'); if(!sel||sel.value==='') return;
    var clus=App.A.clustersOf(App.DB.DATA.cases||[],App.CONFIG,null)[Number(sel.value)];
    if(!clus){ U.toast(T('not_found'),'err'); return; }
    var html=App.Exp.clusterReportHTML(clus,App.DB.DATA.cases);
    document.getElementById('invOut').innerHTML='<div class="noprint" style="margin-bottom:10px">'+U.btn(T('print'),'print-rep',{sel:'#invOut .report'})+'</div>'+html;
  },
  'print-rep':function(el,d){
    var node=document.querySelector(d.sel||'#repOut .report');
    if(!node) return;
    App.Exp.printHTML(node.outerHTML,T('rep_title'));
  },
  'inv-report':function(el,d){
    var data;
    try{ data=JSON.parse(d.key); }catch(e){ return; }
    var clus={ids:data.ids,title:data.title,from:'',to:'',span:''};
    var html=App.Exp.clusterReportHTML(clus,App.DB.DATA.cases);
    App.Exp.printHTML(html,T('rep_inv_title'));
  },
  'view-cluster-cases':function(el,d){
    App.selectedCompare=d.ids?d.ids.split(','):[];
    U.lsSet('ctf_cmp',App.selectedCompare);
    goto('compare');
  },
  'add-exposure':async function(){
    var type=valOf('exType');
    var target=exposureTargetVal();
    var from=valOf('exFrom'), to=valOf('exTo'), den=parseInt(valOf('exCount'),10)||0;
    if(!den){ U.toast(T('required_alert'),'err'); return; }
    var rec={id:'e'+U.uid(),type:type,targetId:target.id,name:target.name,from:from,to:to,den:den,note:valOf('exNote'),numerator:null};
    await App.DB.put('exposures',rec);
    U.toast(T('saved'),'ok');
    goto('exposures');
  },
  'del-exposure':function(el,d){ if(!U.confirm(T('exp_delete'))) return; App.DB.del('exposures',d.id).then(function(){ route(); }); },
  'run-compare':function(el,d){ renderCompareOut(document.getElementById('exA'),document.getElementById('exB')); },
  'exp-json':function(){ App.Exp.backupJSON().then(function(json){ App.Exp.download('ortho-backup-'+U.today().replace(/-/g,'')+'.json',json,'application/json'); }).then(function(){ U.toast(T('export'),'ok'); }); },
  'exp-csv':function(){ var csv=App.Exp.researchCSV(App.DB.DATA.cases||[]); App.Exp.download('ortho-research-'+U.today().replace(/-/g,'')+'.csv',csv,'text/csv;charset=utf-8'); U.toast(T('export'),'ok'); },
  'import-json':async function(){
    if(!_temp.impFile){ U.toast(T('bk_import_file'),'err'); return; }
    if(!U.confirm(T('confirm_import'))) return;
    try{ await App.Exp.importJSONText(_temp.impText); }catch(e){ U.toast(e.message,'err'); return; }
    await refreshAfterDataChange();
    U.toast(T('import_ok'),'ok');
    goto('dashboard');
  },
  'load-demo':async function(){ if(!U.confirm(T('confirm_demo'))) return; await App.DB.open(); await App.Exp.wipeAll(); App.CONFIG.seedLoaded=true; await App.DB.put('settings',App.CONFIG); await App.SEED.load(); await refreshAfterDataChange(); U.toast(T('saved'),'ok'); goto('dashboard'); },
  'wipe-all':async function(){ if(!U.confirm(T('confirm_wipe'))) return; await App.DB.open(); await App.Exp.wipeAll(); App.CONFIG.seedLoaded=false; await App.DB.put('settings',App.CONFIG); await refreshAfterDataChange(); U.toast(T('deleted'),'ok'); goto('dashboard'); },
  'save-settings':async function(){
    App.CONFIG.hospital=valOf('cfgHospital');
    App.CONFIG.clusterMin=Math.max(2,parseInt(valOf('cfgClMin'),10)||3);
    App.CONFIG.clusterWindow=Math.max(1,parseInt(valOf('cfgClWin'),10)||45);
    var lang=valOf('cfgLang')||App.LANG;
    App.CONFIG.lang=lang;
    await App.DB.put('settings',App.CONFIG);
    await refreshAfterDataChange();
    applyLang(lang);
    U.toast(T('set_saved'),'ok');
    route();
  },
  'add-org-item':async function(){ var n=valOf('newOrg'); if(!n) return; await App.DB.put('organisms',{id:'o-'+U.uid(),name:n,inactive:false}); await refreshAfterDataChange(); route(); },
  'del-org-item':async function(el,d){ if(!U.confirm(T('confirm_delete_case'))) return; await App.DB.del('organisms',d.id); await refreshAfterDataChange(); route(); },
  'set-add-item':async function(el,d){
    var name=valOf('seName'); if(!name) return;
    var rec={id:(d.kind==='staff'?'st':'x')+'-'+U.uid(),name:name,inactive:false};
    if(d.kind==='staff') rec.role=valOf('seRole')||'other';
    var store={staff:'staff',rooms:'rooms',procedures:'procedures',organisms:'organisms',antibiotics:'antibiotics',inftypes:'infectionTypes'}[d.kind];
    await App.DB.put(store,rec);
    await refreshAfterDataChange();
    route();
  },
  'set-edit-item':async function(el,d){
    var store={staff:'staff',rooms:'rooms',procedures:'procedures',organisms:'organisms',antibiotics:'antibiotics',inftypes:'infectionTypes'}[d.kind];
    var item=await App.DB.get(store,d.id);
    if(!item) return;
    var nn=prompt(T('set_edit'),item.name);
    if(nn==null||!nn.trim()) return;
    item.name=nn.trim();
    await App.DB.put(store,item);
    await refreshAfterDataChange();
    route();
  },
  'set-toggle-item':async function(el,d){
    var store={staff:'staff',rooms:'rooms',procedures:'procedures',organisms:'organisms',antibiotics:'antibiotics',inftypes:'infectionTypes'}[d.kind];
    var item=await App.DB.get(store,d.id);
    if(!item) return;
    item.inactive=!item.inactive;
    await App.DB.put(store,item);
    await refreshAfterDataChange();
    route();
  },
  'set-del-item':async function(el,d){
    if(!U.confirm(T('confirm_delete_case'))) return;
    var store={staff:'staff',rooms:'rooms',procedures:'procedures',organisms:'organisms',antibiotics:'antibiotics',inftypes:'infectionTypes'}[d.kind];
    await App.DB.del(store,d.id);
    await refreshAfterDataChange();
    route();
  }
};

function remapFilter(passNames,map){
  var out={};
  if(passNames) passNames.forEach(function(n){ var el=document.querySelector('[name="'+n+'"]'); if(el&&el.value!=null) out[n]=String(el.value).trim(); });
  Object.keys(map).forEach(function(n){
    var el=document.querySelector('[name="'+n+'"]');
    if(el&&el.value!=null&&String(el.value).trim()!=='') out[map[n]]=String(el.value).trim();
  });
  return out;
}
function valOf(n){ var el=document.querySelector('[name="'+n+'"]'); return el?String(el.value||'').trim():''; }
function goto(view){ location.hash='#/'+view; }
async function refreshAfterDataChange(){ await App.DB.loadData(true); }
function exe(el){
  var act=el.getAttribute('data-act');
  var h=actions[act]; if(!h) return;
  var d={};
  for(var i=0;i<el.attributes.length;i++){
    var a=el.attributes[i];
    if(a.name.indexOf('data-')===0&&a.name!=='data-act') d[a.name.slice(5)]=a.value;
  }
  return h(el,d);
}

function saveCase(mode){
  var coll=App.ViewUtil.collectCaseForm();
  var d=coll.data;
  if(mode==='full'&&(!d.procedure||!d.opDate)){ U.toast(T('required_alert'),'err'); return; }
  var existing=App.editId?App.DB.DATA.casesById[App.editId]:null;
  var seqPromise=existing?Promise.resolve(existing.id):App.DB.nextCaseId();
  seqPromise.then(function(id){
    d.id=id;
    d.status=mode==='full'?'complete':'draft';
    d.createdAt=existing?existing.createdAt:U.now();
    d.updatedAt=U.now();
    var keys=Object.keys(coll.patches).filter(function(k){ return coll.patches[k].length; });
    var prep=keys.map(function(k){ return App.DB.putMany(k,coll.patches[k]); });
    return Promise.all(prep).then(function(){ return App.DB.put('cases',d); });
  }).then(function(){
    return refreshAfterDataChange();
  }).then(function(){
    U.toast(mode==='draft'?T('draft_saved'):T('saved'),'ok');
    App.editId=null;
    goto('case/'+d.id);
  }).catch(function(e){ console.error(e); U.toast(e.message,'err'); });
}

function exposureTargetVal(){
  var type=valOf('exType');
  var el=document.querySelector('#exTargetWrap select, #exTargetWrap input');
  if(!el) return {id:'',name:''};
  var val=(el.value||'').trim();
  var list=type==='surgeon'||type==='team'?'staff':type==='room'?'rooms':type==='procedure'?'procedures':null;
  if(list){
    var match=App.DB.DATA[list].filter(function(x){ return String(x.id)===String(val); })[0];
    return match?{id:match.id,name:match.name}:{id:'',name:''};
  }
  return {id:val,name:val};
}

/* wire change delegation */
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.getAttribute&&t.getAttribute('data-num')){
    var id=t.getAttribute('data-num');
    var ex=App.exposures.filter(function(x){return x.id===id;})[0];
    if(ex){ ex.den=parseInt(t.value,10)||0; App.DB.put('exposures',ex).then(function(){ refreshExposureLine(id,'den'); }); }
    return;
  }
  if(t.getAttribute&&t.getAttribute('data-ovr')){
    var id2=t.getAttribute('data-ovr');
    var ex2=App.exposures.filter(function(x){return x.id===id2;})[0];
    if(ex2){ ex2.numerator=t.value===''?null:parseInt(t.value,10); App.DB.put('exposures',ex2).then(function(){ refreshExposureLine(id2,'num'); }); }
    return;
  }
  if(t.id==='exType'){ buildExTarget(t.value); return; }
  if(t.id==='impFile'){
    _temp.impFile=t.files[0];
    _temp.impText=null;
    var btn=document.getElementById('impBtn');
    if(btn) btn.disabled=true;
    if(_temp.impFile){
      var r=new FileReader();
      r.onload=function(){ _temp.impText=r.result; if(btn) btn.disabled=false; };
      r.onerror=function(){ _temp.impText=null; };
      r.readAsText(_temp.impFile,'utf-8');
    }
    return;
  }
});
document.addEventListener('input',function(e){
  var t=e.target;
  if(t.getAttribute&&t.getAttribute('data-orgfilter')){
    var q=t.value.toLowerCase();
    document.querySelectorAll('[data-org-row]').forEach(function(row){
      row.style.display=String(row.getAttribute('data-org-row')).indexOf(q)>=0?'':'none';
    });
  }
  if(t.id==='clSel'){}
});
function refreshExposureLine(){
  route();
}
function buildExTarget(type){
  var wrap=document.getElementById('exTargetWrap'); if(!wrap) return;
  var opts=[];
  if(type==='surgeon'||type==='team') opts=App.DB.DATA.staff.map(function(s){return {v:s.id,l:s.name};});
  else if(type==='room') opts=App.DB.DATA.rooms.map(function(r){return {v:r.id,l:r.name};});
  else if(type==='procedure') opts=App.DB.DATA.procedures.map(function(p){return {v:p.id,l:p.name};});
  else { wrap.innerHTML='<div class="fld"><span class="fl">'+T('exp_target')+'</span><input class="inp" name="exTarget">'; return; }
  wrap.innerHTML=U.ff(T('exp_target'),U.sel('exTarget',opts,''));
}

/* document click delegation */
document.addEventListener('click',function(e){
  var actEl=e.target.closest?e.target.closest('[data-act]'):null;
  if(actEl){
    e.preventDefault();
    exe(actEl);
    return;
  }
  var item=e.target.closest?e.target.closest('.case-item'):null;
  if(item&&item.getAttribute('data-case-click')){
    e.preventDefault();
    if(App.compareMode){
      var id=item.getAttribute('data-case-click');
      var sel=App.selectedCompare||[];
      var idx=sel.indexOf(id);
      if(idx>=0) sel.splice(idx,1); else sel.push(id);
      App.selectedCompare=sel;
      U.lsSet('ctf_cmp',sel);
      item.classList.toggle('sel',idx<0);
    } else {
      goto('case/'+item.getAttribute('data-case-click'));
    }
  }
});

/* boot */
function boot(){
  App.caseFilters=U.lsGet('ctf_casef',{});
  App.anaFilters=U.lsGet('ctf_anaf',{});
  App.clusFilters=U.lsGet('ctf_clusf',{});
  App.selectedCompare=U.lsGet('ctf_cmp',[]);
  App.compareMode=!!U.lsGet('ctf_cmpmode',false);
  setNet();
  window.addEventListener('online',setNet);
  window.addEventListener('offline',setNet);
  window.addEventListener('hashchange',function(){ route(); });
  App.DB.open().then(function(){
    return App.DB.loadConfig();
  }).then(function(cfg){
    App.CONFIG=cfg;
    applyLang(cfg.lang||'ar');
    return App.DB.count('cases');
  }).then(function(n){
    if(n===0){
      var wantDemo=false;
      try{ wantDemo=window.confirm(App.LANG==='ar'?'لا توجد بيانات بعد. تحميل البيانات التجريبية التركيبية؟':'No data found. Load synthetic demo data?'); }catch(e){}
      if(wantDemo){
        return App.SEED.load().then(function(){
          App.CONFIG.seedLoaded=true;
          return App.DB.put('settings',App.CONFIG);
        });
      }
    }
    return null;
  }).then(function(){ route(); }).catch(function(e){ console.error(e); });
  if('serviceWorker' in navigator){
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('sw.js').catch(function(e){ console.warn('SW:',e); });
    });
  }
}
App._boot=boot;
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
else boot();
})();