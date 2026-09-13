(function(){
'use strict';
var U=App.U, D=App.DB.DATA, T=App.t, A=App.A;

function staffOpts(roles){
  var rl=roles||null;
  return App.DB.activeDict(D.staff).filter(function(s){ return !rl||(rl.indexOf(s.role)>=0); })
    .map(function(s){ return {id:s.id,name:s.name}; });
}
function allOpts(list){ return App.DB.activeDict(list).map(function(x){ return {id:x.id,name:x.name}; }); }
function optsOf(list){ return App.DB.activeDict(list).map(function(x){ return {v:x.id,l:x.name}; }); }
function anySelect(s,pname,label,opts,sel){ return U.ff(label,U.sel(pname,[{v:'',l:T('any')}].concat(opts),sel||'')); }
function ynu(v){ return U.rdg(v,[{v:'yes',l:T('yes')},{v:'no',l:T('no')},{v:'unknown',l:T('unknown')}],v||'unknown'); }
function ynuVal(name,label,val){ return U.ff(label,ynu(name),null); }
function cs(v){ return v==='yes'?T('yes'):(v==='no'?T('no'):T('unknown')); }
function sexL(v){ return v==='M'?T('sex_m'):(v==='F'?T('sex_f'):(v||'—')); }
function statCard(n,label,cls){ return '<div class="stat '+(cls||'')+'"><div class="n ltr" dir="ltr">'+n+'</div><div class="l">'+label+'</div></div>'; }
function rankRow(it,max){
  var w=max?Math.max(6,Math.round(it.count/max*100)):100;
  return '<div class="rank"><span class="pos"></span><span class="rn">'+U.esc(it.label||it.key)+'</span><span class="rc ltr" dir="ltr">'+it.count+'</span></div><div class="bar"><i style="width:'+w+'%"></i></div>';
}
function rankCard(title,items){
  if(!items||!items.length) return U.card('<h3 class="sec-t">'+title+'</h3>'+U.empty(T('no_clusters')));
  var max=items[0].count;
  return U.card('<h3 class="sec-t">'+title+'</h3><p class="small muted">'+T('count_label')+'</p>'+items.map(function(it){ return rankRow(it,max); }).join(''));
}
function orgChips(c){
  var o=A.orgsOf(c).map(function(id){ return U.chip(U.esc(U.nameOf(id,D.organisms,id)),'') ; });
  if(!o.length){
    var cult=(c.cultures||[]).filter(function(x){ return !x.removed; });
    if(cult.length&&cult.every(function(x){ return x.negative; })) o.push(U.chip(T('cneg'),'gray'));
    else if(cult.length&&cult.some(function(x){ return x.pending; })) o.push(U.chip(T('cpend'),'gray'));
  }
  return o.join('');
}
function caseRowHTML(c){
  var prim=U.nameOf(((c.team||{}).surgeons||[])[0],D.staff,'');
  var statCls=c.status==='draft'?'gray':'ok';
  return '<div class="case-item" data-case-click="'+U.esc(c.id)+'">'+
    '<div class="ci-main">'+
      '<div class="ci-title"><span class="ltr" dir="ltr">'+U.esc(c.id)+'</span>'+U.chip(T(c.status==='draft'?'draft_badge':'complete_badge'),statCls)+
        (c.caseName?'<span class="ci-name">'+U.esc(c.caseName)+'</span>':'')+
        (A.cDiag(c)?'<span class="small muted ltr" dir="ltr">'+U.fmt(A.cDiag(c))+'</span>':'')+
      '</div>'+
      '<div class="ci-org">'+orgChips(c)+'</div>'+
      '<div class="ci-meta">'+U.esc(U.nameOf(c.procedure,D.procedures,c.procedure))+ (prim?' · '+U.esc(prim):'')+'</div>'+
    '</div>'+
  '</div>';
}

function rankOf(type,items){ return items; }

/* ================= FORM ================= */
function emptyCase(){
  return {
    caseName:'',ptName:'',mrn:'',age:'',sex:'',weight:'',bmi:'',opDate:'',infectionSuspectedDate:'',infectionDiagnosedDate:'',
    procedure:'',site:'',side:'Right',trauma:'unknown',emergency:'unknown',primaryRevision:'primary',openClosed:'unknown',
    fxClass:'',implantUsed:'unknown',implantType:'',boneSite:'',duration:'',ebl:'',tourniquetUse:'unknown',tourniquetDur:'',drainUsed:'unknown',
    prophylaxis:{given:'yes',antibiotic:'',dose:'',time:'pre60',redosingRequired:'unknown',redosingPerformed:'unknown',problem:'correct'},
    or:{room:'',date:'',startTime:'',endTime:'',previousCase:'',prevCount:'',envProblem:'',sterilityBreak:'unknown',instrumentProblem:'',packagingProblem:'',other:''},
    team:{surgeons:[],assistants:[],otherSurgeons:[],residents:[],scrub:[],circulating:[],instrument:[],otherNursing:[],anesthesiaDoc:[],anesthesiaTeam:[],worker:[],otherStaff:[]},
    riskFactors:{medical:[],local:[],unknown:false},
    infection:{types:[],days:'',ct:false,fever:false,discharge:false,erythema:false,pain:false,crp:false,esr:false,leuko:false,imaging:'',other:''},
    cultures:[],treatment:{},outcome:{followUpDuration:'',finalOutcome:'',notes:''}
  };
}

var _cultSeq=0, _orgSeq=0;
function cultBlockHTML(cf,i){
  cf=cf||{date:'',specimen:'deep',samples:1,negative:false,pending:false,extras:[],organisms:[]};
  var extras=App.SPECIMENS.map(function(s){
    return U.ckb('cult_extras_'+i,s.id,T(s.k),(cf.extras||[]).indexOf(s.id)>=0);
  }).join('');
  var orgs=cf.organisms&&cf.organisms.length?cf.organisms:[{}];
  return '<div class="card" data-cultbox="'+i+'">'+
    '<div class="clus-head"><b>'+T('culture')+' '+(i+1)+'</b><span class="grow"></span><button class="btn danger-ghost sm" data-act="del-culture" data-i="'+i+'">'+T('remove')+'</button></div>'+
    '<div class="two">'+
      U.ff(T('culture_date'),U.date('cult_date_'+i,cf.date))+
      U.ff(T('culture_samples'),U.numf('cult_samples_'+i,cf.samples||1,1,0))+
    '</div>'+
    '<div class="two">'+
      U.ff(T('spec_type'),U.sel('cult_spec_'+i,App.SPECIMENS.map(function(s){return {v:s.id,l:T(s.k)};}),cf.specimen||'deep'))+
      '<div class="fld"><span class="fl">'+T('cneg')+' / '+T('cpend')+'</span><div class="ckg">'+
        U.ckb('cult_neg_'+i,'yes',T('cneg'),cf.negative)+U.ckb('cult_pend_'+i,'yes',T('cpend'),cf.pending)+'</div></div>'+
    '</div>'+
    U.ff(T('spec_type')+' — '+T('culture_samples'),'<div class="ckg">'+extras+'</div>')+
    '<div class="divider"></div><div class="fl">'+T('add_organism')+'</div>'+
    '<div data-orgs="'+i+'">'+
      orgs.map(function(o,j){ return orgRowHTML(i,j,o); }).join('')+
    '</div>'+
    U.btn(T('add_organism'),'add-org',{c:i},'sec sm')+
  '</div>';
}
function orgRowHTML(i,j,o){
  o=o||{organismId:'',sensitivity:'',resistance:[],mrsa:false,esbl:false,vre:false,mdr:false,otherRes:''};
  var resItems=[{v:'mrsa',l:T('mrsa')},{v:'esbl',l:T('esbl')},{v:'vre',l:T('vre')},{v:'mdr',l:T('mdr')}];
  return '<div class="fld" data-orgrow="'+i+'_'+j+'" style="background:var(--bg);border-radius:9px;padding:8px;border:1px solid var(--line)">'+
    U.ssHTML('cult_org_'+i+'_'+j,T('organism'),allOpts(D.organisms),o.organismId,'organism')+
    '<div class="two">'+U.ff(T('sensitivity'),U.inp('cult_sens_'+i+'_'+j,o.sensitivity,'S / R ...'))+
    U.ff(T('other_res'),U.inp('cult_other_'+i+'_'+j,o.otherRes))+'</div>'+
    U.ff(T('resistance'),U.ckg('org_res_'+i+'_'+j,resItems,o.resistance||[]))+
    U.btn(T('remove'),'del-org',{c:i,j:j},'danger-ghost sm')+
  '</div>';
}

function teamFieldHtml(c){
  var t=c.team||{};
  var surs=staffOpts(['surgeon','resident']);
  return U.sec(T('sec_team'),T('select_person'),
    U.ssHTML('teamPrimary',T('team_primary'),staffOpts(['surgeon','resident']),(t.surgeons||[])[0],'surgeon')+
    U.msHTML('teamAssistants',T('team_assist'),surs,t.assistants||[],'surgeon')+
    U.msHTML('teamOtherSurgeons',T('team_other_surgeon'),surs,t.otherSurgeons||[],'surgeon')+
    U.msHTML('teamResidents',T('team_res'),staffOpts(['resident','surgeon']),t.residents||[],'resident')+
    U.msHTML('teamScrub',T('team_scrub'),staffOpts(['nurse']),t.scrub||[],'nurse')+
    U.msHTML('teamCirculating',T('team_circ'),staffOpts(['nurse']),t.circulating||[],'nurse')+
    U.msHTML('teamInstrument',T('team_instr'),staffOpts(['nurse']),t.instrument||[],'nurse')+
    U.msHTML('teamOtherNursing',T('team_othnurse'),staffOpts(['nurse']),t.otherNursing||[],'nurse')+
    U.ssHTML('teamAnesDoc',T('team_anes_doc'),staffOpts(['anesthesia']),(t.anesthesiaDoc||[])[0],'anesthesia')+
    U.msHTML('teamAnesTeam',T('team_anes_team'),staffOpts(['anesthesia']),t.anesthesiaTeam||[],'anesthesia')+
    U.msHTML('teamWorker',T('team_worker'),staffOpts(['worker']),t.worker||[],'worker')+
    U.msHTML('teamOther',T('team_other'),staffOpts(null),t.otherStaff||[],'other')
  );
}

function caseFormHTML(c){
  var isNew=!c;
  c = c?c:emptyCase();
  var p=c.prophylaxis||{}, or=c.or||{}, t=c.team||{}, r=c.riskFactors||{}, inf=c.infection||{}, tr=c.treatment||{}, oc=c.outcome||{};
  var risKMed=App.RISK_MEDICAL.map(function(x){ return {v:x.id,l:T(x.k)}; });
  var risKLoc=App.RISK_LOCAL.map(function(x){ return {v:x.id,l:T(x.k)}; });
  var infTypes=optsOf(D.infectionTypes);
  var infSigns=App.INF_SIGNS.map(function(x){ return {v:x.id,l:T(x.k)}; });
  var treatItems=App.TREAT_ITEMS.map(function(x){ return {v:x.id,l:T(x.k)}; });
  var outItems=App.OUTCOME_ITEMS.map(function(x){ return {v:x.id,l:T(x.k)}; });
  var sexOpts=[{v:'M',l:T('sex_m')},{v:'F',l:T('sex_f')},{v:'',l:T('unknown')}];
  var sides=[{v:'Right',l:T('opt_right')},{v:'Left',l:T('opt_left')},{v:'Bilateral',l:T('opt_bilateral')}];
  var timeOpts=[{v:'pre60',l:T('pt_pre60')},{v:'pre60p',l:T('pt_pre60p')},{v:'incision',l:T('pt_incision')},{v:'post',l:T('pt_post')},{v:'unknown',l:T('unknown')}];
  var probOpts=[{v:'correct',l:T('proph_ok')},{v:'delayed',l:T('proph_delayed')},{v:'wrong',l:T('proph_wrong')},{v:'missed',l:T('proph_missed')},{v:'unknown',l:T('proph_unknown')}];
  var prOpts=[{v:'primary',l:T('opt_primary')},{v:'revision',l:T('opt_revision')},{v:'unknown',l:T('unknown')}];
  var ocOpts=[{v:'open',l:T('opt_open')},{v:'closed',l:T('opt_closed')},{v:'unknown',l:T('unknown')}];
  var siteSuggest='<datalist id="dl_sites">'+App.SITES.map(function(s){ return '<option value="'+U.esc(s)+'">'; }).join('')+'</datalist>';
  var implantSuggest='<datalist id="dl_implants">'+App.IMPLANTS.map(function(s){ return '<option value="'+U.esc(s)+'">'; }).join('')+'</datalist>';

  var h='<form id="caseform">';
  h+='<div class="screen-title"><h2>'+T(isNew?'add_title':'edit_title')+'</h2>'+(isNew?'':'<a class="link" data-act="open-case" data-id="'+U.esc(c.id)+'">'+T('view')+'</a>')+'</div>';
  h+='<div class="note">'+T('privacy_note')+'</div>';

  h+=U.sec(T('sec_case'),'',
    '<div class="two">'+
      U.ff(T('case_id'),'<div class="inp" style="background:var(--bg)">'+U.esc(isNew?'—':c.id)+'</div>')+
      U.ff(T('patient_name'),U.inp('ptName',c.ptName,T('optional')))+
    '</div>'+
    '<div class="two">'+
      U.ff(T('case_name'),U.inp('cName',c.caseName,T('optional')))+
      U.ff(T('mrn'),U.inp('mrn',c.mrn,T('optional')))+
    '</div>'+
    '<div class="three">'+
      U.ff(T('age'),U.numf('age',isNew?'':c.age))+
      U.ff(T('sex'),U.sel('sex',sexOpts,c.sex))+
      U.ff(T('bmi'),U.numf('bmi',isNew?'':c.bmi))+
    '</div>'+
    '<div class="two">'+
      U.ff(T('weight'),U.numf('weight',isNew?'':c.weight))+
      U.ff('','')+
    '</div>'+
    '<div class="two">'+
      U.ff(T('op_date'),U.date('opDate',c.opDate))+
      U.ff(T('suspicious_date'),U.date('suspDate',c.infectionSuspectedDate))+
    '</div>'+
    U.ff(T('diag_date'),U.date('diagDate',c.infectionDiagnosedDate))
  );

  h+=U.sec(T('sec_op'),'',
    U.ssHTML('procedure',T('procedure'),allOpts(D.procedures),c.procedure,'procedure')+siteSuggest+implantSuggest+
    '<div class="two">'+
      U.ff(T('site'),'<input class="inp" name="site" list="dl_sites" value="'+U.esc(c.site)+'">')+
      U.ff(T('side'),U.sel('side',sides,c.side))+
    '</div>'+
    '<div class="two">'+ynuVal('trauma',T('trauma'),c.trauma)+ynuVal('emergency',T('emergency'),c.emergency)+'</div>'+
    '<div class="two">'+
      U.ff(T('primary_rev'),U.sel('primaryRevision',prOpts,c.primaryRevision))+
      U.ff(T('open_closed'),U.sel('openClosed',ocOpts,c.openClosed))+
    '</div>'+
    '<div class="two">'+
      U.ff(T('fx_class'),U.inp('fxClass',c.fxClass,T('optional')))+
      U.ff(T('duration'),U.numf('duration',isNew?'':c.duration))+
    '</div>'+
    '<div class="two">'+
      ynuVal('implantUsed',T('implant_used'),c.implantUsed)+
      U.ff(T('ebl'),U.numf('ebl',isNew?'':c.ebl))+
    '</div>'+
    '<div class="two">'+
      U.ff(T('implant_type'),'<input class="inp" name="implantType" list="dl_implants" value="'+U.esc(c.implantType)+'">')+
      U.ff(T('bone_site'),UMon('boneSite',c.boneSite))+
    '</div>'+
    '<div class="two">'+ynuVal('tourniquetUse',T('tourniquet'),c.tourniquetUse)+U.ff(T('tourniquet_dur'),U.numf('tourniquetDur',isNew?'':c.tourniquetDur))+'</div>'+
    ynuVal('drainUsed',T('drain'),c.drainUsed)
  );

  h+=U.sec(T('sec_proph'),'',
    ynuVal('prophGiven',T('proph_given'),p.given)+
    U.ssHTML('prophAb',T('proph_ab'),allOpts(D.antibiotics),p.antibiotic,'antibiotic')+
    '<div class="two">'+
      U.ff(T('proph_dose'),U.inp('prophDose',p.dose,'2 g'))+
      U.ff(T('proph_time'),U.sel('prophTime',timeOpts,p.time))+
    '</div>'+
    '<div class="two">'+ynuVal('prophRedReq',T('proph_red_req'),p.redosingRequired)+ynuVal('prophRedDone',T('proph_red_done'),p.redosingPerformed)+'</div>'+
    U.ff(T('proph_problem'),U.sel('prophProblem',probOpts,p.problem))
  );

  h+=U.sec(T('sec_or'),'',
    U.ssHTML('orRoom',T('or_room'),[{id:'',name:T('or_none')}].concat(allOpts(D.rooms)),or.room,'room')+
    '<div class="three">'+
      U.ff(T('or_date'),U.date('orDate',or.date))+
      U.ff(T('or_start'),U.time('orStart',or.startTime))+
      U.ff(T('or_end'),U.time('orEnd',or.endTime))+
    '</div>'+
    '<div class="two">'+
      U.ff(T('or_prev'),U.inp('orPrev',or.previousCase,T('optional')))+
      U.ff(T('or_prevcount'),U.numf('orPrevCount',or.prevCount))+
    '</div>'+
    U.ff(T('or_env'),U.inp('orEnv',or.envProblem,T('optional')))+
    ynuVal('orSter',T('or_sterility'),or.sterilityBreak)+
    '<div class="two">'+
      U.ff(T('or_instr'),U.inp('orInstr',or.instrumentProblem,T('optional')))+
      U.ff(T('or_pack'),U.inp('orPack',or.packagingProblem,T('optional')))+
    '</div>'+
    U.ff(T('or_other'),U.inp('orOther',or.other,T('optional')))
  );

  h+=teamFieldHtml(c);

  h+=U.sec(T('sec_risk'),'',
    '<div><b>'+T('rf_medical')+'</b></div>'+U.ckg('riskMed',risKMed,r.medical||[])+
    '<div class="mt"><b>'+T('rf_local')+'</b></div>'+U.ckg('riskLocal',risKLoc,r.local||[])+
    '<div class="mt">'+U.ckb('riskUnknown','yes',T('rf_unknown'),!!r.unknown)+'</div>'
  );

  h+=U.sec(T('sec_inf'),'',
    U.ff(T('inf_type'),U.ckg('infType',infTypes,inf.types||[]))+
    U.ff(T('inf_days'),U.numf('infDays',inf.days==null?'':inf.days),'' )+
    U.ff(T('inf_signs'),U.ckg('infSign',infSigns,App.INF_SIGNS.filter(function(x){ return inf[x.id]; }).map(function(x){ return x.id; })))+
    U.ff(T('inf_imaging'),U.inp('infImaging',inf.imaging,T('optional')))+
    U.ff(T('inf_other'),'<div>'+U.tarea('infOther',inf.other,T('optional'))+'</div>')
  );

  h+=U.sec(T('sec_micro'),T('org_desc'),
    '<div id="cultBox">'+
    (c.cultures&&c.cultures.length?c.cultures.map(function(cf,i){ return cultBlockHTML(cf,i); }).join(''):cultBlockHTML(null,0))+
    '</div>'+U.btn(T('add_culture'),'add-culture',{},'sec')
  );

  h+=U.sec(T('sec_treat'),'',
    U.ff('',U.ckg('treatment',treatItems,Object.keys(tr).filter(function(k){ return tr[k] && App.TREAT_ITEMS.some(function(x){return x.id===k;}); })))+
    '<div class="two">'+
      U.ff(T('t_duration'),U.inp('tDur',tr.antibioticDuration||''))+
      U.ff(T('t_other'),U.inp('tOther',tr.other||''))+
    '</div>'
  );

  h+=U.sec(T('sec_out'),'',
    U.ff('',U.ckg('outcome',outItems,Object.keys(oc).filter(function(k){ return oc[k] && App.OUTCOME_ITEMS.some(function(x){return x.id===k;}); })))+
    '<div class="two">'+
      U.ff(T('fu_dur'),U.inp('fuDur',oc.followUpDuration||''))+
      U.ff(T('final_out'),U.inp('finalOut',oc.finalOutcome||''))+
    '</div>'+
    U.ff(T('clinical_note'),U.tarea('notes',oc.notes||''))+
    '<div class="note">'+T('storage_note')+'</div>'
  );

  h+='<div class="btnrow noprint">'+
    U.btn(T('save_draft'),'save-case',{mode:'draft'},'sec grow')+
    U.btn(T('save_full'),'save-case',{mode:'full'},'grow')+
    U.btn(T('cancel'),'nav',{view:isNew?'dashboard':'cases'},'grayb')+
  '</div>';
  h+='</form>';
  return h;
}
function UMon(name,val){ return '<input class="inp" name="'+name+'" value="'+U.esc(val||'')+'">'; }

/* ================= VIEWS ================= */
App.views={};

App.views.dashboard=function(){
  var cases=D.cases||[];
  var s=A.stats(cases);
  var recent=cases.slice().sort(function(a,b){ return A.cDiag(a)<A.cDiag(b)?1:-1; }).slice(0,5);
  var orgs=A.topOrganisms(cases,6);
  var procs=A.topProcedures(cases,6);
  var rooms=A.topRooms(cases,5);
  var surgs=A.topPrimarySurgeons(cases,6);
  var h='';
  if(D.demoData) h+='<div class="note">'+T('demo_note')+'</div>';
  h+='<div class="grid">'+
    statCard(s.total,T('dash_total'),'toned')+
    statCard(s.month,T('dash_month'))+
    statCard(s.year,T('dash_year'))+
    statCard(s.deep,T('dash_deep'),'dangerc')+
    statCard(s.superf,T('dash_superf'))+
    statCard(s.implant,T('dash_implant'),'warnc')+
    statCard(s.cpos,T('dash_cpos'),'okc')+
    statCard(s.cneg,T('dash_cneg'))+
  '</div>';
  if(!cases.length){
    h+=U.empty(T('no_data'))+'<div class="center mt">'+U.btn(T('add_title'),'nav',{view:'add'})+'</div>';
    return h;
  }
  h+='<div class="mt card">'+
    '<div class="list-head"><h3 class="sec-t">'+T('recent')+'</h3><span class="grow"></span>'+
    U.btn(T('see_analytics'),'nav',{view:'analytics'},'sec sm')+
    '</div>'+
    recent.map(caseRowHTML).join('')+
    '<a class="link" data-act="nav" data-view="cases">'+T('view')+' →</a>'+
  '</div>';
  h+='<div class="grid">'+
    rankCard(T('top_organisms'),orgs)+
    rankCard(T('top_procedures'),procs)+
    rankCard(T('top_rooms'),rooms)+
    rankCard(T('top_surgeons'),surgs)+
  '</div>';
  return h;
};

App.views.add=function(id){
  return caseFormHTML(id?D.casesById[id]:null);
};

App.views.cases=function(){
  var f=App.caseFilters||{};
  var cases=A.filter(D.cases||[],f).sort(function(a,b){ return A.cDiag(a)<A.cDiag(b)?1:-1; });
  var mode=App.compareMode;
  var h='<div class="screen-title"><h2>'+T('nav_cases')+' ('+cases.length+')</h2><span class="grow"></span>'+
    U.btn(mode?T('done'):T('compare_title'),'toggle-compare',{},mode?'okb':'sec sm')+
    (App.selectedCompare&&App.selectedCompare.length?U.btn(App.selectedCompare.length+' ⇄','compare',{},'dangerc sm'):'')+
  '</div>';
  h+='<details class="filters" open><summary class="f1">'+T('search')+'</summary>'+
    '<div class="two">'+
      U.ff(T('search'),U.inp('q',f.q||''))+
      U.ff(T('status'),U.sel('status',[{v:'all',l:T('all')},{v:'complete',l:T('complete_badge')},{v:'draft',l:T('draft_badge')}],f.status||'all'))+
    '</div>'+
    '<div class="two">'+
      anySelect('','fRoom',T('or_room'),optsOf(D.rooms),f.room)+
      anySelect('','fProc',T('procedure'),optsOf(D.procedures),f.procedure)+
    '</div>'+
    '<div class="two">'+
      anySelect('','fSurgeon',T('f_surgeon'),optsOf(D.staff),f.surgeon)+
      anySelect('','fOrg',T('organism'),optsOf(D.organisms),f.organism)+
    '</div>'+
    '<div class="btnrow mt">'+U.btn(T('apply'),'apply-case-filters',{},'sec')+U.btn(T('reset'),'reset-case-filters',{},'grayb')+'</div>'+
  '</details>';
  if(mode) h+='<div class="note info">'+T('compare_hint')+'</div>';
  if(!cases.length) h+=U.empty(T('no_match'));
  else h+=cases.map(caseRowHTML).join('');
  return h+'<div class="grow"></div>';
};

App.views.caseDetail=function(id){
  var c=D.casesById[id];
  if(!c) return U.empty(T('not_found'));
  var or=c.or||{}, t=c.team||{}, p=c.prophylaxis||{}, r=c.riskFactors||{}, inf=c.infection||{}, tr=c.treatment||{}, oc=c.outcome||{};
  var days;
  if(c.opDate&&c.infectionDiagnosedDate) days=U.daysBetween(c.opDate,c.infectionDiagnosedDate);
  else days=inf.days;
  var label=function(fn,html){ return '<div class="dg"><b>'+fn+'</b><span>'+(html||'—')+'</span></div>'; };
  function teamList(arr){ return (arr||[]).map(function(i){ return U.esc(U.nameOf(i,D.staff,i)); }).join('، ')||'—'; }
  var h='';
  h+='<div class="screen-title"><h2 class="ltr" dir="ltr">'+U.esc(c.id)+(c.caseName?' <span class="ltr-sep">·</span> '+U.esc(c.caseName):'')+'</h2><span class="grow"></span>'+
    U.chip(T(c.status==='draft'?'draft_badge':'complete_badge'),c.status==='draft'?'gray':'ok')+'</div>';
  h+='<div class="note info">'+T('storage_note')+'</div>';
  h+='<div class="card"><h3 class="sec-t">'+T('timeline')+'</h3><div class="tl">'+
    tlItem(T('tl_op'),c.opDate,U.nameOf(c.procedure,D.procedures,c.procedure),'')+
    tlItem(T('tl_first'),c.infectionSuspectedDate,days!=null?(days+' '+T('days_s')):'','')+
    tlItem(T('tl_diag'),c.infectionDiagnosedDate,((c.infection&&c.infection.types)||[]).map(function(i){return U.nameOf(i,D.infectionTypes,i);}).join('، '),'red')+
    tlItem(T('tl_culture'),(c.cultures&&c.cultures[0]&&c.cultures[0].date)||'',orgChips(c),'')+
    tlItem(T('tl_tx'),c.infectionDiagnosedDate||'',Object.keys(tr).filter(function(k){return tr[k];}).map(function(k){var it=App.TREAT_ITEMS.filter(function(x){return x.id===k;})[0]; return it?T(it.k):k;}).join('، '),'')+
    tlItem(T('tl_out'),'',oc.finalOutcome||T('o_'+ (oc.controlled?'controlled':'persistent')),'green')+
  '</div></div>';
  h+='<div class="card"><h3 class="sec-t">'+T('sec_case')+'</h3><div class="detail-grid">'+
    label(T('case_name'),U.esc(c.caseName||'—'))+
    label(T('patient_name'),U.esc(c.ptName||'—'))+
    label(T('mrn'),U.esc(c.mrn||'—'))+
    label(T('age'),U.esc(c.age||'—'))+
    label(T('sex'),U.esc(sexL(c.sex)))+
    label(T('weight')+' / '+T('bmi'),U.esc(c.weight||'—')+' / '+U.esc(c.bmi||'—'))+
    label(T('op_date'),U.fmt(c.opDate))+
    label(T('suspicious_date'),U.fmt(c.infectionSuspectedDate))+
    label(T('diag_date'),U.fmt(c.infectionDiagnosedDate))+
  '</div></div>';
  h+='<div class="card"><h3 class="sec-t">'+T('sec_op')+'</h3><div class="detail-grid">'+
    label(T('procedure'),U.esc(U.nameOf(c.procedure,D.procedures,c.procedure)))+
    label(T('site'),U.esc(c.site||'—'))+
    label(T('side'),U.esc(c.side||'—'))+
    label(T('trauma'),cs(c.trauma))+
    label(T('emergency'),cs(c.emergency))+
    label(T('primary_rev'),U.esc(c.primaryRevision||'—'))+
    label(T('open_closed'),cs(c.openClosed))+
    label(T('fx_class'),U.esc(c.fxClass||'—'))+
    label(T('implant_used'),cs(c.implantUsed))+
    label(T('implant_type'),U.esc(c.implantType||'—'))+
    label(T('duration'),c.duration?U.esc(c.duration+' min'):'—')+
    label(T('tourniquet'),cs(c.tourniquetUse))+
    label(T('drain'),cs(c.drainUsed))+
  '</div>'+
  '<div class="detail-grid">'+
    label(T('or_room'),U.esc(U.nameOf(or.room,D.rooms,or.room)))+
    label(T('or_start')+"–"+T('or_end'),U.esc((or.startTime||'—')+' → '+(or.endTime||'—')))+
    label(T('or_prev'),U.esc(or.previousCase||'—'))+
    label(T('or_sterility'),cs(or.sterilityBreak))+
    label(T('or_env'),U.esc(or.envProblem||'—'))+
    label(T('or_instr'),U.esc(or.instrumentProblem||'—'))+
    label(T('or_pack'),U.esc(or.packagingProblem||'—'))+
  '</div></div>';
  h+='<div class="card"><h3 class="sec-t">'+T('sec_team')+'</h3><div class="detail-grid">'+
    label(T('team_primary'),teamList(t.surgeons))+
    label(T('team_assist'),teamList(t.assistants))+
    label(T('team_res'),teamList(t.residents))+
    label(T('team_scrub'),teamList(t.scrub))+
    label(T('team_circ'),teamList(t.circulating))+
    label(T('team_instr'),teamList(t.instrument))+
    label(T('team_anes_doc'),teamList(t.anesthesiaDoc))+
    label(T('team_worker'),teamList(t.worker))+
  '</div></div>';
  h+='<div class="card"><h3 class="sec-t">'+T('sec_proph')+'</h3><div class="detail-grid">'+
    label(T('proph_given'),cs(p.given))+
    label(T('proph_ab'),U.esc(U.nameOf(p.antibiotic,D.antibiotics,p.antibioticText||'')))+
    label(T('proph_dose'),U.esc(p.dose||'—'))+
    label(T('proph_problem'),U.esc(p.problem?T('proph_'+p.problem)+'' : T('unknown')))+
  '</div></div>';
  h+='<div class="card"><h3 class="sec-t">'+T('sec_risk')+'</h3><div class="detail-grid">'+
    label(T('rf_medical'),U.esc((r.medical||[]).map(App.riskLabel).join('، ')||'—'))+
    label(T('rf_local'),U.esc((r.local||[]).map(App.riskLabel).join('، ')||'—'))+
  '</div></div>';
  h+='<div class="card"><h3 class="sec-t">'+T('sec_inf')+'</h3><div class="detail-grid">'+
    label(T('inf_type'),U.esc((inf.types||[]).map(function(i){return U.nameOf(i,D.infectionTypes,i);}).join('، ')))+
    label(T('inf_days'),U.esc(days!=null?days+' '+T('days_s'):'—'))+
    label(T('inf_signs'),U.esc(App.INF_SIGNS.filter(function(x){return inf[x.id];}).map(function(x){return T(x.k);}).join('، ')))+
    label(T('inf_imaging'),U.esc(inf.imaging||'—'))+
    label(T('inf_other'),U.esc(inf.other||'—'))+
  '</div></div>';
  if((c.cultures||[]).length){
    h+='<div class="card"><h3 class="sec-t">'+T('sec_micro')+'</h3>'+(c.cultures||[]).map(function(cu,ci){
      return '<div class="mb"><div class="fl">'+T('culture')+' '+(ci+1)+' — '+U.fmt(cu.date)+(cu.negative?' · '+U.chip(T('cneg'),'gray'):'')+(cu.pending?' · '+U.chip(T('cpend'),'warn'):'')+'</div>'+
      ((cu.organisms||[]).map(function(o){
        return '<div class="softbox small">'+U.esc(U.nameOf(o.organismId,D.organisms,o.organismId))+
          (o.sensitivity?' · '+U.esc(o.sensitivity):'')+
          (o.mrsa?' '+U.chip('MRSA','red'):'')+(o.esbl?' '+U.chip('ESBL','warn'):'')+(o.vre?' '+U.chip('VRE','red'):'')+(o.mdr?' '+U.chip('MDR','warn'):'')+
          ((o.resistance||[]).length?' · '+U.esc(o.resistance.join(', ')):'')+
        '</div>';
      }).join('')||U.chip(T('no_organs'),'gray'))+'</div>';
    }).join('')+'</div>';
  }
  h+='<div class="card"><h3 class="sec-t">'+T('sec_treat')+'</h3><div class="detail-grid">'+
    label(T('sec_treat'),U.esc(Object.keys(tr).filter(function(k){return tr[k];}).map(function(k){var it=App.TREAT_ITEMS.filter(function(x){return x.id===k;})[0]; return it?T(it.k):k;}).join('، ')||'—'))+
    label(T('t_duration'),U.esc(tr.antibioticDuration||'—'))+
  '</div></div>';
  h+='<div class="card"><h3 class="sec-t">'+T('sec_out')+'</h3><div class="detail-grid">'+
    label(T('sec_out'),U.esc(Object.keys(oc).filter(function(k){return oc[k];}).map(function(k){var it=App.OUTCOME_ITEMS.filter(function(x){return x.id===k;})[0]; return it?T(it.k):k;}).join('، ')||'—'))+
    label(T('fu_dur'),U.esc(oc.followUpDuration||'—'))+
    label(T('final_out'),U.esc(oc.finalOutcome||'—'))+
  '</div>'+(oc.notes?'<div class="softbox">'+U.esc(oc.notes)+'</div>':'')+'</div>';
  h+='<div class="btnrow noprint">'+
    U.btn(T('edit'),'edit-case',{id:c.id},'sec grow')+
    U.btn(T('delete'),'del-case',{id:c.id},'danger-ghost grow')+
    U.btn(T('back'),'nav',{view:'cases'},'grayb')+
  '</div>';
  return h;
};
function tlItem(t,d,n,cls){
  return '<div class="tl-item '+(cls||'')+'"><div class="tl-t">'+t+'</div>'+(d?'<div class="tl-d ltr" dir="ltr">'+U.fmt(d)+'</div>':(n?'<div class="tl-d">'+n+'</div>':'<div class="tl-d">'+T('unknown')+'</div>'))+'<div class="tl-n">'+n+'</div></div>';
}

App.views.analytics=function(){
  var f=App.anaFilters||{};
  var filtered=A.filter(D.cases||[],f);
  var s=A.stats(filtered);
  var risks=App.RISK_MEDICAL.concat(App.RISK_LOCAL).map(function(x){ return {v:x.id,l:T(x.k)}; });
  var h='<div class="screen-title"><h2>'+T('analytics_title')+' ('+filtered.length+')</h2></div>';
  h+='<details class="filters" open><summary class="f1">'+T('search')+' / '+T('analytics_title')+'</summary>'+
    '<div class="two">'+U.ff(T('f_from'),U.date('aFrom',f.from||''))+U.ff(T('f_to'),U.date('aTo',f.to||''))+'</div>'+
    '<div class="two">'+
      anySelect('','aRoom',T('or_room'),optsOf(D.rooms),f.room)+
      anySelect('','aProc',T('procedure'),optsOf(D.procedures),f.procedure)+
    '</div>'+
    '<div class="two">'+
      anySelect('','aSurgeon',T('f_surgeon'),optsOf(D.staff),f.surgeon)+
      anySelect('','aOrg',T('organism'),optsOf(D.organisms),f.organism)+
    '</div>'+
    '<div class="two">'+
      anySelect('','aInfType',T('inf_type'),optsOf(D.infectionTypes),f.inftype)+
      U.ff(T('f_implant'),U.sel('aImplant',[{v:'',l:T('any')},{v:'yes',l:T('yes')},{v:'no',l:T('no')}],f.implant||''))+
    '</div>'+
    '<div class="two">'+
      U.ff(T('f_emergency'),U.sel('aEmergency',[{v:'',l:T('any')},{v:'yes',l:T('yes')},{v:'no',l:T('no')}],f.emergency||''))+
      U.ff(T('f_trauma'),U.sel('aTrauma',[{v:'',l:T('any')},{v:'yes',l:T('yes')},{v:'no',l:T('no')}],f.trauma||''))+
    '</div>'+
    anySelect('','aRisk',T('f_risk'),risks,f.risk)+
    '<div class="btnrow mt">'+U.btn(T('apply'),'apply-ana-filters',{},'sec')+U.btn(T('reset'),'reset-ana-filters',{},'grayb')+'</div>'+
  '</details>';
  h+='<div class="note info">'+T('count_note')+'</div>';
  h+='<div class="card"><h3 class="sec-t">'+T('results_title')+'</h3><div class="grid">'+
    statCard(filtered.length,T('res_total'),'toned')+
    statCard(s.deep,T('dash_deep'))+
    statCard(s.superf,T('dash_superf'))+
    statCard(s.cpos,T('dash_cpos'),'okc')+
  '</div>';
  h+='<p class="small muted mt">'+T('res_percent')+'</p>';
  var n=filtered.length||1;
  function prop(count){ return Math.round(count/n*100)+'%'; }
  h+='<div class="rank-list mt">'+
    rankProp('implant',s.implant,T('prop_implant'))+
    rankProp('em',filtered.filter(function(c){return c.emergency==='yes';}).length,T('prop_em'))+
    rankProp('trauma',filtered.filter(function(c){return c.trauma==='yes';}).length,T('prop_trauma'))+
  '</div>';
  var trend=A.trends(filtered);
  if(trend.length){
    var mx=Math.max.apply(null,trend.map(function(t){return t.count;}));
    h+='<h3 class="sec-t mt">'+T('res_trend')+'</h3><ul class="barsh">'+trend.map(function(t){
      return '<li><span class="bl">'+U.esc(U.monthLabel(t.m))+'</span><span class="bw"><i style="width:'+Math.round(t.count/mx*100)+'%"></i></span><span class="bn ltr" dir="ltr">'+t.count+'</span></li>';
    }).join('')+'</ul>';
  }
  var cmb=A.combos(filtered,5);
  if(cmb.length){
    h+='<h3 class="sec-t mt">'+T('res_combos')+'</h3>';
    h+=cmb.map(function(cm){
      return '<div class="rank"><span class="pos">'+(cm.count)+'</span><span class="rn">'+U.esc(comboLabel(cm))+'</span><span class="rc ltr" dir="ltr">'+cm.count+'</span></div>';
    }).join('')+'<p class="small muted">'+T('count_note')+'</p>';
  }
  h+='</div>';
  return h;
  function rankProp(idLine,count,label){ count=count||0; return '<div class="rank"><span class="rn">'+label+'</span><span class="rc ltr" dir="ltr">'+count+' ('+prop(count)+')</span></div>'; }
};
function comboLabel(cm){
  function dimN(d){ return d.dim==='room'?U.nameOf(d.id,D.rooms,d.id):(d.dim==='proc'?U.nameOf(d.id,D.procedures,d.id):(d.dim==='org'?U.nameOf(d.id,D.organisms,d.id):U.nameOf(d.id,D.staff,d.id))); }
  var key=T('combo_room_proc');
  if(cm.a.dim==='room'&&cm.b.dim==='proc') key=T('combo_room_proc');
  else if(cm.a.dim==='proc'&&cm.b.dim==='org') key=T('combo_proc_org');
  else if(cm.a.dim==='surgeon'&&cm.b.dim==='room') key=T('combo_surg_room');
  else if(cm.a.dim==='org'&&cm.b.dim==='room') key=T('combo_org_room');
  else if(cm.a.dim==='surgeon'&&cm.b.dim==='proc') key=T('combo_proc_org');
  else if(cm.a.dim==='room'&&cm.b.dim==='org') key=T('combo_org_room');
  return key+': '+dimN(cm.a)+' × '+dimN(cm.b);
}

App.views.clusters=function(){
  var f=App.clusFilters||{};
  var cl=A.clustersOf(D.cases||[],App.CONFIG,f);
  var h='<div class="screen-title"><h2>'+T('cluster_title')+'</h2></div>';
  h+='<div class="note warn">'+T('cluster_note')+'</div>';
  h+='<details class="filters"><summary class="f1">'+T('search')+' / '+T('cluster_title')+'</summary>'+
    '<div class="two">'+U.ff(T('f_from'),U.date('clFrom',f.from||''))+U.ff(T('f_to'),U.date('clTo',f.to||''))+'</div>'+
    '<div class="btnrow mt">'+U.btn(T('apply'),'apply-clus-filters',{},'sec')+U.btn(T('reset'),'reset-clus-filters',{},'grayb')+'</div>'+
  '</details>';
  if(!cl.length){
    h+=U.empty(T('no_clusters'));
  } else {
    cl.slice(0,20).forEach(function(c){
      var sev=c.severity==='hi'?true:false;
      h+='<div class="card clus'+(sev?' hi':'')+'">'+
        '<div class="clus-head"><span class="clus-kind">'+U.esc(c.title)+'</span>'+U.chip(c.count+' '+T('cl_cases'),'warn')+U.chip(T('cl_period')+': '+U.fmt(c.from)+'→'+U.fmt(c.to),'gray')+'</div>'+
        '<p class="small muted">'+kindLabel(c.kind)+' · '+c.span+' '+T('days_s')+'</p>'+
        '<div class="warnbox">'+T('cluster_banner')+'</div>'+
        '<div class="btnrow"><button class="btn sec sm grow" data-act="inv-report" data-key="'+U.esc(JSON.stringify({ids:c.ids,title:c.title}))+'">'+T('inv_report')+'</button>'+
        '<button class="btn grayb sm grow" data-act="view-cluster-cases" data-ids="'+U.esc(c.ids.join(','))+'">'+T('view_cases')+'</button></div>'+
      '</div>';
    });
    h+='<div class="warnbox">'+T('warn_no_causation')+'</div>';
  }
  h+='<h3 class="sec-t mt">'+T('staff_analysis')+'</h3>'+U.card(staffAnalysisHTML(App.A.staffSummary(D.cases||[])));
  return h;
};
function kindLabel(k){
  var m={temporal:T('cl_temporal'),room:T('cl_room'),org:T('cl_org'),proc:T('cl_proc'),staff:T('cl_staff'),combo:T('cl_combo')};
  return m[k]||k;
}
function staffAnalysisHTML(sums){
  var html='';
  var order=App.DB.activeDict(D.staff).map(function(s){ return s; });
  order.forEach(function(st){
    var sm=sums[st.id];
    if(!sm||!sm.ids.length) return;
    var names=sm.ids.length;
    html+='<div class="mb" style="border-bottom:1px solid var(--line);padding-bottom:10px">'+
      '<div class="fl">'+U.esc(st.name)+' <span class="muted small">('+U.esc(st.role)+')</span></div>'+
      '<div class="rate-big ltr" dir="ltr">'+names+'</div><div class="rate-sub">'+T('cases_colon')+' · '+T('sta_period')+': '+U.esc(sm.from?U.fmt(sm.from)+' – '+U.fmt(sm.to):'—')+'</div>'+
      breakdownList(T('sta_rooms'),sm.rooms,D.rooms)+
      breakdownList(T('sta_procs'),sm.procs,D.procedures)+
      breakdownList(T('sta_orgs'),sm.orgs,D.organisms)+
      exposureLineFor(st.id)+
    '</div>';
  });
  if(!html) html=U.empty('—');
  return html;
}
function breakdownList(label,map,list){
  var k=Object.keys(map||{});
  if(!k.length) return '';
  var parts=k.slice(0,8).map(function(id){ return U.chip(U.esc(U.nameOf(id,list,id))+' ×'+map[id]); }).join(' ');
  return '<div class="small mt">'+label+': '+parts+'</div>';
}
function exposureLineFor(staffId){
  var exs=(App.exposures||[]).filter(function(e){ return e.type==='surgeon'&&e.targetId===staffId; });
  if(!exs.length) return '<div class="softbox small mt">'+T('sta_noexpo')+'</div>';
  return exs.map(function(e){
    var ci=e.numerator!=null?e.numerator:e.auto;
    var rate=U.pct(ci,e.den);
    return '<div class="neutralbox small mt">'+T('exp_rate_label')+': <b class="ltr" dir="ltr">'+ (e.auto||0)+' / '+e.den+' = '+(rate||'—')+'</b></div>';
  }).join('');
}

App.views.exposures=function(){
  var exs=App.exposures||[];
  var h='<div class="screen-title"><h2>'+T('exp_title')+'</h2></div>';
  h+='<div class="note info">'+T('exp_desc')+'</div>';
  h+=U.card(
    '<h3 class="sec-t">'+T('exp_add')+'</h3>'+
    '<div class="two">'+
      U.ff(T('exp_type'),U.sel('exType',[
        {v:'surgeon',l:T('et_surgeon')},{v:'room',l:T('et_room')},{v:'procedure',l:T('et_proc')},
        {v:'team',l:T('et_team')},{v:'implant',l:T('et_implant')},{v:'other',l:T('et_other')}
      ], ''))+
      '<div id="exTargetWrap">'+U.ff(T('exp_target'),U.sel('exTarget',[{v:'',l:''}],''))+'</div>'+
    '</div>'+
    '<div class="three">'+
      U.ff(T('exp_from'),U.date('exFrom',''))+
      U.ff(T('exp_to'),U.date('exTo',''))+
      U.ff(T('exp_count'),U.numf('exCount',''))+
    '</div>'+
    U.ff(T('exp_note'),U.inp('exNote','',T('optional')))+
    U.btn(T('save'),'add-exposure',{},'block')
  );
  exs.forEach(function(e){
    var rate=U.pct(e.numerator!=null?e.numerator:e.auto,e.den);
    h+='<div class="card">'+
      '<div class="clus-head"><b>'+U.esc(e.name||e.targetId)+'</b>'+U.chip(typeTitle(e.type),'')+U.chip(U.fmt(e.from)+' → '+U.fmt(e.to),'gray')+'<span class="grow"></span>'+
      '<button class="btn danger-ghost sm" data-act="del-exposure" data-id="'+U.esc(e.id)+'">'+T('delete')+'</button></div>'+
      '<div class="exp-auto small mt">'+T('exp_auto_note')+' <b class="ltr" dir="ltr">'+e.auto+'</b></div>'+
      '<div class="two mt">'+
        '<div class="fld"><span class="fl">'+T('exp_count')+'</span><input class="inp" data-num="'+U.esc(e.id)+'" type="number" value="'+e.den+'" min="0"></div>'+
        '<div class="fld"><span class="fl">'+T('exp_num_override')+'</span><input class="inp" data-ovr="'+U.esc(e.id)+'" type="number" placeholder="'+e.auto+'" min="0"></div>'+
      '</div>'+
      '<div class="neutralbox mt"><div class="rate-big ltr" dir="ltr">'+(e.numerator!=null?e.numerator:e.auto)+' / '+e.den+'</div><div class="rate-sub">'+T('exp_rate_label')+(rate?' ('+rate+')':'')+'</div>'+(e.den? '' : '<div class="small">'+T('exp_no_rate')+'</div>')+'</div>'+
      (e.note?'<div class="small muted mt">'+U.esc(e.note)+'</div>':'')+
    '</div>';
  });
  if(!exs.length) h+=U.empty(T('exp_none'));
  h+=U.card(
    '<h3 class="sec-t">'+T('research_compare')+'</h3><p class="small muted">'+T('cmp_note')+'</p>'+
    '<div class="two">'+U.ff(T('cmp_a'),U.sel('exA',exs.map(exOpt),''))+U.ff(T('cmp_b'),U.sel('exB',exs.map(exOpt),''))+'</div>'+
    U.btn(T('apply'),'run-compare',{},'sec block')+
    '<div id="cmpOut"></div>'
  );
  return h;
};
function typeTitle(t){ var m={surgeon:T('et_surgeon'),room:T('et_room'),procedure:T('et_proc'),team:T('et_team'),implant:T('et_implant'),other:T('et_other')}; return m[t]||t; }
function exOpt(e){ return {v:e.id,l:(e.name||'')+' ('+e.from+'→'+e.to+')'}; }

App.views.organisms=function(){
  var h='<div class="screen-title"><h2>'+T('org_title')+'</h2></div>';
  h+='<div class="note info">'+T('org_desc')+'</div>';
  var stats=A.topOrganisms(D.cases||[],100);
  var counts={}; stats.forEach(function(s){ counts[s.key]=s.count; });
  h+=U.card('<h3 class="sec-t">'+T('org_add')+'</h3><div class="two">'+U.ff(T('organism'),U.inp('newOrg',''))+U.btn(T('add'),'add-org-item',{},'sec')+'</div>');
  h+=U.card('<h3 class="sec-t">'+T('org_search')+'</h3><input class="inp" id="orgSearch" placeholder="'+T('org_search')+' (Ctrl+F)'+'" data-orgfilter="1">');
  h+='<div id="orgList">'+D.organisms.map(function(o){
    var cnt=counts[o.id]||0;
    return '<div class="case-item" data-org-row="'+U.esc(o.name.toLowerCase())+'">'+
      '<div class="ci-main"><div class="ci-title">'+U.esc(o.name)+(o.inactive?' '+U.chip(T('set_inactive'),'gray'):'')+'</div>'+
      '<div class="ci-meta">'+T('org_cases')+': <b class="ltr" dir="ltr">'+cnt+'</b></div></div>'+
      '<div class="cb-check"><button class="btn danger-ghost sm" data-act="del-org-item" data-id="'+U.esc(o.id)+'">'+T('delete')+'</button></div>'+
    '</div>';
  }).join('')+'</div>';
  return h;
};

App.views.reports=function(clusterArg){
  var h='<div class="screen-title"><h2>'+T('rep_title')+'</h2></div>';
  h+='<div class="card"><h3 class="sec-t">'+T('rep_month')+'</h3>'+
    '<div class="two">'+U.ff(T('rep_month_pick'),'<input class="inp" type="month" id="repMonth" value="'+U.today().slice(0,7)+'">')+U.ff('',U.btn(T('rep_gen'),'gen-month',{},'sec'))+'</div>'+
    '<div class="divider"></div><div id="repOut"><div class="empty">'+T('rep_new')+'</div></div>'+
  '</div>';
  h+='<div class="card"><h3 class="sec-t">'+T('rep_inv')+'</h3>'+
    U.ff(T('rep_inv_pick'),U.sel('clSel',App.A.clustersOf(D.cases||[],App.CONFIG,null).map(function(c,i){ return {v:i,l:c.title}; }),''))+
    U.btn(T('rep_gen_inv'),'gen-inv',{},'sec block')+
    '<div class="divider"></div><div id="invOut"></div>'+
  '</div>';
  return h;
};

App.views.backup=function(){
  var h='<div class="screen-title"><h2>'+T('backup_title')+'</h2></div>';
  h+='<div class="note">'+T('storage_note')+'</div>';
  h+='<div class="card"><h3 class="sec-t">'+T('backup_title')+'</h3><div class="btnrow mblock">'+
    '<button class="btn sec grow" data-act="exp-json">'+T('bk_json')+'</button>'+
    '<button class="btn sec grow" data-act="exp-csv">'+T('bk_csv')+'</button>'+
  '</div></div>';
  h+='<div class="card"><h3 class="sec-t">'+T('bk_import')+'</h3>'+
    '<input type="file" id="impFile" accept="application/json,.json" class="btn grayb block" style="padding:10px">'+
    '<p class="small muted mt">'+T('bk_import_file')+'</p>'+
    '<button class="btn okb block mt" data-act="import-json" disabled id="impBtn">'+T('import')+'</button>'+
  '</div>';
  h+='<div class="card"><h3 class="sec-t">'+T('bk_demo')+'</h3>'+
    '<button class="btn sec block" data-act="load-demo">'+T('bk_demo')+'</button><p class="small muted mt">'+T('demo_note')+'</p>'+
  '</div>';
  h+='<div class="card"><h3 class="sec-t">'+T('set_warning')+'</h3><p class="small">'+T('storage_note')+'</p>'+
    '<button class="btn dng block" data-act="wipe-all">'+T('bk_wipe')+'</button>'+
  '</div>';
  return h;
};

App.views.settings=function(){
  var cfg=App.CONFIG;
  var h='<div class="screen-title"><h2>'+T('set_title')+'</h2></div>';
  h+=U.card('<h3 class="sec-t">'+T('set_lang')+'</h3><div class="two">'+
    U.ff(T('set_lang'),U.sel('cfgLang',[{v:'ar',l:'العربية'},{v:'en',l:'English'}],App.LANG))+
    U.ff(T('set_hospital'),U.inp('cfgHospital',cfg.hospital))+ '</div>'+
    '<div class="two">'+U.ff(T('cluster_min'),U.numf('cfgClMin',cfg.clusterMin,1,1))+U.ff(T('cluster_win'),U.numf('cfgClWin',cfg.clusterWindow,1,1))+'</div>'+
    U.btn(T('set_save'),'save-settings',{},'block')
  );
  ['staff','rooms','procedures','organisms','antibiotics','inftypes'].forEach(function(k){ h+=listEditorHTML(k); });
  return h;
};
function listEditorHTML(kind){
  var titles={staff:T('set_staff'),rooms:T('set_rooms'),procedures:T('set_procs'),organisms:T('set_organisms'),antibiotics:T('set_antibiotics'),inftypes:T('set_inftypes')};
  var rows;
  var body;
  if(kind==='staff'){
    rows=D.staff;
    body='<select class="inp" id="seRole" style="flex:1">'+[
      {v:'surgeon',l:T('role_surgeon')},{v:'resident',l:T('role_resident')},{v:'nurse',l:T('role_nurse')},
      {v:'worker',l:T('role_worker')},{v:'anesthesia',l:T('role_anes')},{v:'other',l:T('role_other')}
    ].map(function(x){return '<option value="'+x.v+'">'+x.l+'</option>';}).join('')+'</select>';
  }
  var listName={staff:'staff',rooms:'rooms',procedures:'procedures',organisms:'organisms',antibiotics:'antibiotics',inftypes:'infectionTypes'}[kind];
  var items=D[listName]||[];
  var roleL={surgeon:'role_surgeon',resident:'role_resident',nurse:'role_nurse',worker:'role_worker',anesthesia:'role_anes',other:'role_other'};
  return U.card(
    '<h3 class="sec-t">'+titles[kind]+'</h3>'+
    '<div class="list-head">'+(kind==='staff'?body:'')+'<input class="inp" id="seName" style="flex:2" placeholder="'+T('set_add')+'"></div>'+
    '<div class="btnrow">'+U.btn(T('add'),'set-add-item',{kind:kind},'sec sm')+'</div>'+
    '<div class="mt">'+items.map(function(it){
      var roleLabel=kind==='staff'?(roleL[it.role]?T(roleL[it.role]):'')+' — ':'';
      return '<div class="case-item" style="align-items:center">'+
        '<div class="ci-main"><div class="ci-title">'+U.esc(roleLabel+it.name)+(it.inactive?' '+U.chip(T('set_inactive'),'gray'):'')+'</div></div>'+
        '<div class="cb-check" style="display:flex;gap:6px">'+
          '<button class="btn sec sm" data-act="set-edit-item" data-kind="'+kind+'" data-id="'+U.esc(it.id)+'">'+T('edit')+'</button>'+
          '<button class="btn '+(it.inactive?'okb sm':'grayb sm')+'" data-act="set-toggle-item" data-kind="'+kind+'" data-id="'+U.esc(it.id)+'">'+(it.inactive?T('set_activate'):T('set_deactivate'))+'</button>'+
          '<button class="btn danger-ghost sm" data-act="set-del-item" data-kind="'+kind+'" data-id="'+U.esc(it.id)+'">×</button>'+
        '</div>'+
      '</div>';
    }).join('')+'</div>'
  );
}

App.views.compare=function(){
  var ids=App.selectedCompare||[];
  var res=A.compareCases(ids,D.cases||[]);
  var h='<div class="screen-title"><h2>'+T('compare_title')+' ('+ids.length+')</h2><span class="grow"></span>'+
    '<button class="btn sec sm" data-act="nav" data-view="cases">'+T('compare_go')+'</button></div>';
  if(!ids.length){ h+=U.empty(T('compare_hint')); return h; }
  h+='<div class="card"><h3 class="sec-t">'+ids.length+' '+T('cl_cases')+'</h3>'+
    res.selected.map(caseRowHTML).join('')+'</div>';
  h+='<div class="card"><h3 class="sec-t">'+T('compare_shared')+'</h3>';
  if(res.shared.length){
    h+='<table class="report" style="width:100%"><tr><th>'+T('compare_dim')+'</th><th>'+T('compare_val')+'</th><th>'+T('compare_n')+'</th></tr>'+
      res.shared.slice(0,15).map(function(sh){
        return '<tr><td>'+U.esc(sh.label)+'</td><td>'+U.esc(shareValue(sh))+'</td><td class="ltr" dir="ltr">'+sh.count+' / '+ids.length+'</td></tr>';
      }).join('')+'</table>';
    h+='<div class="neutralbox mt"><b>'+T('compare_banner')+'</b></div>';
  } else {
    h+=U.empty(T('compare_none'));
  }
  h+='</div>';
  h+='<div class="btnrow noprint">'+U.btn(T('close'),'clear-compare',{},'grayb block')+'</div>';
  return h;
};
function shareValue(sh){
  if(sh.dim==='room') return U.nameOf(sh.value,D.rooms,sh.value);
  if(sh.dim==='proc') return U.nameOf(sh.value,D.procedures,sh.value);
  if(sh.dim==='org') return U.nameOf(sh.value,D.organisms,sh.value);
  if(sh.dim==='surg') return U.nameOf(sh.value,D.staff,sh.value);
  if(sh.dim==='proph') return T('proph_'+sh.value)!==('proph_'+sh.value)?T('proph_'+sh.value):sh.value;
  return sh.value;
}

/* ================= save ================= */
function collectCaseForm(){
  var form=document.getElementById('caseform');
  var fd=new FormData(form);
  function v(n){ var x=fd.get(n); return x==null?'':String(x).trim(); }
  function gv(n){ return fd.getAll(n); }
  function ck(n){ var x=fd.get(n); return x==='yes'; }

  var teamMap={surgeons:['teamPrimary','surgeon'],assistants:['teamAssistants','surgeon'],otherSurgeons:['teamOtherSurgeons','surgeon'],residents:['teamResidents','resident'],scrub:['teamScrub','nurse'],circulating:['teamCirculating','nurse'],instrument:['teamInstrument','nurse'],otherNursing:['teamOtherNursing','nurse'],anesthesiaDoc:['teamAnesDoc','anesthesia'],anesthesiaTeam:['teamAnesTeam','anesthesia'],worker:['teamWorker','worker'],otherStaff:['teamOther','other']};
  var patches={staff:[],rooms:[],procedures:[],organisms:[],antibiotics:[]};
  function rID(id,store,role){
    if(!id) return '';
    if(String(id).indexOf('NEW:')!==0) return id;
    var nm=String(id).slice(4);
    var use=patches[store].filter(function(x){return x.name===nm;})[0];
    if(use) return use.id;
    var sid=store==='staff'?('st-'+U.uid()):(store.slice(0,1)+'-'+U.uid());
    patches[store].push({id:sid,name:nm,inactive:false});
    if(store==='staff') patches.staff[patches.staff.length-1].role=role;
    return sid;
  }
  var team={};
  Object.keys(teamMap).forEach(function(k){
    var name=teamMap[k][0], role=teamMap[k][1];
    if(name.indexOf('teamPrimary')>=0||name.indexOf('teamAnesDoc')>=0){
      team[k]=[rID(v(name),'staff',role)].filter(Boolean);
    } else {
      team[k]=gv(name).map(function(id){ return rID(id,'staff',role); }).filter(Boolean);
    }
  });
  var infSigns=gv('infSign');
  var infSignObj={};
  App.INF_SIGNS.forEach(function(s){ infSignObj[s.id]=infSigns.indexOf(s.id)>=0; });
  var data={
    caseName:v('cName'),ptName:v('ptName'),mrn:v('mrn'),age:v('age'),sex:v('sex')?v('sex'):'',weight:v('weight'),bmi:v('bmi'),
    opDate:v('opDate'),infectionSuspectedDate:v('suspDate'),infectionDiagnosedDate:v('diagDate'),
    procedure:rID(v('procedure'),'procedures',''),site:v('site'),side:v('side'),
    trauma:v('trauma'),emergency:v('emergency'),primaryRevision:v('primaryRevision'),openClosed:v('openClosed'),
    fxClass:v('fxClass'),implantUsed:v('implantUsed'),implantType:v('implantType'),boneSite:v('boneSite')||v('site'),
    duration:v('duration'),ebl:v('ebl'),tourniquetUse:v('tourniquetUse'),tourniquetDur:v('tourniquetDur'),drainUsed:v('drainUsed'),
    prophylaxis:{given:v('prophGiven'),antibiotic:rID(v('prophAb'),'antibiotics',''),antibioticText:'',dose:v('prophDose'),time:v('prophTime'),redosingRequired:v('prophRedReq'),redosingPerformed:v('prophRedDone'),problem:v('prophProblem')},
    or:{room:rID(v('orRoom'),'rooms',''),date:v('orDate'),startTime:v('orStart'),endTime:v('orEnd'),previousCase:v('orPrev'),prevCount:v('orPrevCount'),envProblem:v('orEnv'),sterilityBreak:v('orSter'),instrumentProblem:v('orInstr'),packagingProblem:v('orPack'),other:v('orOther')},
    team:team,
    riskFactors:{medical:gv('riskMed'),local:gv('riskLocal'),unknown:ck('riskUnknown')},
    infection:{types:gv('infType'),days:v('infDays'),fever:infSignObj.fever||false,discharge:infSignObj.discharge||false,erythema:infSignObj.erythema||false,pain:infSignObj.pain||false,crp:infSignObj.crp||false,esr:infSignObj.esr||false,leuko:infSignObj.leuko||false,imaging:v('infImaging'),other:v('infOther')},
    cultures:collectCultures(fd,rID),
    treatment:{debridement:gv('treatment').indexOf('debridement')>=0,repeatDebridement:gv('treatment').indexOf('repeatDebridement')>=0,implantRetention:gv('treatment').indexOf('implantRetention')>=0,implantRemoval:gv('treatment').indexOf('implantRemoval')>=0,revisionFixation:gv('treatment').indexOf('revisionFixation')>=0,externalFixation:gv('treatment').indexOf('externalFixation')>=0,abCement:gv('treatment').indexOf('abCement')>=0,abBeads:gv('treatment').indexOf('abBeads')>=0,stimulan:gv('treatment').indexOf('stimulan')>=0,ivAntibiotics:gv('treatment').indexOf('ivAntibiotics')>=0,oralAntibiotics:gv('treatment').indexOf('oralAntibiotics')>=0,antibioticDuration:v('tDur'),other:v('tOther')},
    outcome:{controlled:gv('outcome').indexOf('controlled')>=0,persistent:gv('outcome').indexOf('persistent')>=0,recurrence:gv('outcome').indexOf('recurrence')>=0,repeatOp:gv('outcome').indexOf('repeatOp')>=0,implantRetained:gv('outcome').indexOf('implantRetained')>=0,implantRemoved:gv('outcome').indexOf('implantRemoved')>=0,amputation:gv('outcome').indexOf('amputation')>=0,death:gv('outcome').indexOf('death')>=0,lost:gv('outcome').indexOf('lost')>=0,followUpDuration:v('fuDur'),finalOutcome:v('finalOut'),notes:v('notes')}
  };
  return {data:data,patches:patches};
}
function collectCultures(fd,rID){
  var out=[];
  var boxes=document.querySelectorAll('[data-cultbox]');
  boxes.forEach(function(box){
    var i=Number(box.getAttribute('data-cultbox'));
    function v(n){ var x=fd.get('cult_'+n+'_'+i); return x==null?'':String(x).trim(); }
    var orgs=[];
    var oRows=box.querySelectorAll('[data-orgrow]');
    Array.prototype.forEach.call(oRows,function(row,j){
      var oid=rID(String(fd.get('cult_org_'+i+'_'+j)||'').trim(),'organisms','');
      if(!oid) return;
      var res=fd.getAll('org_res_'+i+'_'+j);
      orgs.push({
        organismId:oid,
        sensitivity:fd.get('cult_sens_'+i+'_'+j)||'',
        resistance:res.length?res.filter(function(x){return ['mrsa','esbl','vre','mdr'].indexOf(x)>=0;}):[],
        mrsa:res.indexOf('mrsa')>=0,esbl:res.indexOf('esbl')>=0,vre:res.indexOf('vre')>=0,mdr:res.indexOf('mdr')>=0,
        otherRes:fd.get('cult_other_'+i+'_'+j)||''
      });
    });
    var extraNames=['swab','deep','pus','bone','blood','implant','other'].filter(function(s){ return fd.getAll('cult_extras_'+i).indexOf(s)>=0; }).concat(fd.get('cult_spec_'+i)!==null?[fd.get('cult_spec_'+i)]:[]);
    out.push({
      removed:false,
      date:fd.get('cult_date_'+i)||'',
      specimen:fd.get('cult_spec_'+i)||'deep',
      samples:fd.get('cult_samples_'+i)||1,
      extras:Array.from(new Set(extraNames)).filter(Boolean),
      negative:fd.get('cult_neg_'+i)==='yes',
      pending:fd.get('cult_pend_'+i)==='yes',
      organisms:orgs
    });
  });
  return out;
}

App.ViewUtil={caseRowHTML:caseRowHTML,orgChips:orgChips,collectCaseForm:collectCaseForm,cultBlockHTML:cultBlockHTML,orgRowHTML:orgRowHTML}
})();