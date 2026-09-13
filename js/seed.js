(function(){
'use strict';
var U=App.U;

var INF={ref:'infection'};

function mkList(rows){ return rows.map(function(r){ return Object.assign({inactive:false},r); }); }

var STAFF=mkList([
  {id:'st-karim',name:'Dr. Karim Nasser',role:'surgeon'},
  {id:'st-ahmed',name:'Dr. Ahmed Al-Rashidi',role:'surgeon'},
  {id:'st-sara',name:'Dr. Sara Haddad',role:'surgeon'},
  {id:'st-omar',name:'Dr. Omar Mansour',role:'surgeon'},
  {id:'st-lina',name:'Dr. Lina Saeed',role:'surgeon'},
  {id:'st-majid',name:'Dr. Majid Aziz',role:'surgeon'},
  {id:'st-yous',name:'Dr. Youssef Karam',role:'resident'},
  {id:'st-huda',name:'Dr. Huda Fares',role:'resident'},
  {id:'st-bilal',name:'Dr. Bilal Omar',role:'resident'},
  {id:'st-ayah',name:'Ayah Hassan (RN)',role:'nurse'},
  {id:'st-rana',name:'Rana Khalil (RN)',role:'nurse'},
  {id:'st-samer',name:'Samer Jaber (RN)',role:'nurse'},
  {id:'st-nawal',name:'Nawal Amin (RN)',role:'nurse'},
  {id:'st-khalid',name:'Dr. Khaled Nouri',role:'anesthesia'},
  {id:'st-dima',name:'Dr. Dima Saleh',role:'anesthesia'},
  {id:'st-farid',name:'Farid Alwan',role:'worker'},
  {id:'st-nadim',name:'Nadim Saad',role:'other'},
  {id:'st-hiba',name:'Dr. Hiba Diab',role:'surgeon',inactive:true}
]);

var ROOMS=mkList([
  {id:'r1',name:'الطابق 2 · OR 1'},{id:'r2',name:'الطابق 2 · OR 2'},{id:'r3',name:'الطابق 2 · OR 3'},{id:'r4',name:'الطابق 2 · OR 4'},
  {id:'r5',name:'الطابق 3 · OR 1'},{id:'r6',name:'الطابق 3 · OR 2'},{id:'r7',name:'الطابق 3 · OR 3'},{id:'r8',name:'الطابق 3 · OR 4'}
]);

var PROCEDURES=mkList([
  {id:'p_orifti',name:'ORIF tibia'},{id:'p_orifank',name:'ORIF ankle'},
  {id:'p_oriffem',name:'ORIF femur'},{id:'p_dhs',name:'DHS / hip screws'},
  {id:'p_tka',name:'Total knee arthroplasty (TKA)'},{id:'p_tha',name:'Total hip arthroplasty (THA)'},
  {id:'p_imti',name:'Intramedullary nail tibia'},{id:'p_orifrad',name:'ORIF radius'},
  {id:'p_extfix',name:'External fixation'},{id:'p_spine',name:'Spinal fixation'},
  {id:'p_aclr',name:'ACL reconstruction'},{id:'p_deb',name:'Surgical debridement'}
]);

var ORGANISMS=mkList([
  {id:'o_sa',name:'Staphylococcus aureus'},{id:'o_mrsa',name:'MRSA'},{id:'o_cns',name:'Coagulase-negative staphylococcus'},
  {id:'o_kp',name:'Klebsiella pneumoniae'},{id:'o_pa',name:'Pseudomonas aeruginosa'},{id:'o_ec',name:'Escherichia coli'},
  {id:'o_ent',name:'Enterococcus faecalis'},{id:'o_ab',name:'Acinetobacter baumannii'},{id:'o_sp',name:'Streptococcus pyogenes'},
  {id:'o_pm',name:'Proteus mirabilis'}
]);

var ANTIBIOTICS=mkList([
  {id:'ab_cz',name:'Cefazolin'},{id:'ab_cx',name:'Cefuroxime'},{id:'ab_ctx',name:'Ceftriaxone'},
  {id:'ab_vanc',name:'Vancomycin'},{id:'ab_clin',name:'Clindamycin'},{id:'ab_amox',name:'Amoxicillin/clavulanate'},
  {id:'ab_pip',name:'Piperacillin/tazobactam'},{id:'ab_mero',name:'Meropenem'}
]);

var INFECTION_TYPES=mkList([
  {id:'it_superf',name:'Superficial incisional SSI'},{id:'it_deep',name:'Deep incisional SSI'},
  {id:'it_organ',name:'Organ-space infection'},{id:'it_implant',name:'Implant-associated infection'},
  {id:'it_osteo',name:'Osteomyelitis'},{id:'it_pji',name:'Prosthetic joint infection'},
  {id:'it_dehis',name:'Wound dehiscence'},{id:'it_other',name:'Other'}
]);

var PROC_SITE={p_orifti:'Tibia',p_orifank:'Ankle',p_oriffem:'Femur',p_dhs:'Proximal femur',p_tka:'Knee',p_tha:'Hip',p_imti:'Tibia',p_orifrad:'Radius',p_extfix:'Lower limb',p_spine:'Lumbar spine',p_aclr:'Knee',p_deb:'Lower limb'};
var PROC_IMPL={p_orifti:'Plate & screws',p_orifank:'Plate & screws',p_oriffem:'Plate & screws',p_dhs:'DHS',p_tka:'Total knee prosthesis',p_tha:'Total hip prosthesis',p_imti:'Intramedullary nail',p_orifrad:'Plate & screws',p_extfix:'External fixator',p_spine:'Posterior instrumentation',p_aclr:'No implant',p_deb:'None'};

function culturesFrom(cfg){
  if(cfg.pend) return [{removed:false,date:cfg.op,specimen:'deep',samples:1,negative:false,pending:true,organisms:[]}];
  if(cfg.neg) return [{removed:false,date:cfg.diag||cfg.op,specimen:'swab',samples:1,negative:true,pending:false,organisms:[]}];
  var orgs=(cfg.orgs||['o_sa']).map(function(o){
    var r={organismId:o,sensitivity:'',resistance:[],mrsa:false,esbl:false,vre:false,mdr:false,otherRes:''};
    if(o==='o_mrsa'){ r.mrsa=true; r.resistance=['Cefazolin','Amoxicillin/clavulanate']; }
    if(o==='o_kp'){ r.esbl=true; r.resistance=['Ceftriaxone']; }
    if(o==='o_pa'){ r.resistance=['Cefuroxime']; r.mdr=(cfg.mdr?true:false); }
    if(o==='o_ent'){ r.vre=cfg.vre?true:false; }
    if(cfg.sens) r.sensitivity=cfg.sens;
    return r;
  });
  return [{removed:false,date:cfg.diag||cfg.op,specimen:cfg.spec||'deep',samples:cfg.samples||1,negative:false,pending:false,organisms:orgs}];
}

function buildCase(cfg,n){
  var op=cfg.op, diag=cfg.diag||U.addDays(op,(cfg.diagD==null?7:cfg.diagD));
  var site=cfg.site||PROC_SITE[cfg.proc]||'Lower limb';
  var impl=cfg.impl!==false?(cfg.impl||PROC_IMPL[cfg.proc]||''):'';
  return {
    id:'',status:cfg.draft?'draft':'complete',
    createdAt:new Date(op+'T10:00:00').toISOString(),updatedAt:new Date(diag+'T10:00:00').toISOString(),
    mrn:cfg.mrn||('DEMO-'+(1000+n)),
    age:cfg.age==null?48:cfg.age, sex:cfg.sex||'M',
    weight:cfg.weight||'', bmi:cfg.bmi||'',
    opDate:op, infectionSuspectedDate:cfg.susp||'', infectionDiagnosedDate:diag,
    procedure:cfg.proc, site:site, side:cfg.side||'Right',
    trauma:cfg.trauma||'no', emergency:cfg.em||'unknown',
    primaryRevision:cfg.pr||'primary', openClosed:cfg.oc||'closed',
    fxClass:cfg.fx||'', implantUsed:impl?'yes':'no',
    implantType:impl, boneSite:site,
    duration:cfg.dur||110, ebl:cfg.ebl||'',
    tourniquetUse:cfg.tq||'unknown', tourniquetDur:cfg.tqd||'', drainUsed:cfg.drain||'unknown',
    prophylaxis:{given:cfg.prophG!==false?'yes':'no',antibiotic:cfg.ab||'ab_cz',dose:cfg.dose||'2 g',
      time:cfg.pt||'pre60',redosingRequired:cfg.rdreq||'unknown',redosingPerformed:cfg.rddone||'unknown',
      problem:cfg.prophProb||'correct'},
    or:{room:cfg.room||'r1',date:op,startTime:cfg.st||'08:00',endTime:cfg.et||'10:00',previousCase:cfg.prev||'',prevCount:cfg.prevc||'',envProblem:cfg.env||'',sterilityBreak:cfg.ster||'unknown',instrumentProblem:cfg.inst||'',packagingProblem:cfg.pk||'',other:cfg.orOther||''},
    team:{surgeons:cfg.sf?s[cfg.sf]:[],assistants:cfg.assist||[],residents:cfg.res||[],scrub:cfg.scrub||[],circulating:cfg.circ||[],instrument:cfg.instrN||[],otherNursing:cfg.othN||[],anesthesiaDoc:cfg.anesd?[cfg.anesd]:[],anesthesiaTeam:cfg.anest||[],worker:cfg.worker||[],otherStaff:cfg.oth||[]},
    riskFactors:{medical:cfg.rmed||[],local:cfg.rlocal||[],unknown:cfg.runknown||false},
    infection:{types:cfg.it||['it_deep'],days:cfg.days!=null?cfg.days:(U.daysBetween(op,diag)||''),fever:cfg.fever||false,discharge:cfg.discharge!==false,erythema:cfg.erythema!==false,pain:cfg.pain||false,crp:cfg.crp!==false,esr:cfg.esr||false,leuko:cfg.leuko||false,imaging:cfg.img||'',other:cfg.clinOther||''},
    cultures:cfg.neg||cfg.pend?culturesFrom(cfg):culturesFrom(cfg),
    treatment:{debridement:cfg.tDeb!=null?cfg.tDeb:true,repeatDebridement:cfg.tRep||false,implantRetention:cfg.tRet||false,implantRemoval:cfg.tRem||false,revisionFixation:cfg.tRev||false,externalFixation:cfg.tExt||false,abCement:cfg.tCem||false,abBeads:cfg.tBead||false,stimulan:cfg.tStim||false,ivAntibiotics:cfg.tIv!==false,oralAntibiotics:cfg.tOral!==false,antibioticDuration:cfg.abd||'6 weeks',other:cfg.tOther||''},
    outcome:{controlled:cfg.oCon!==false,persistent:cfg.oPers||false,recurrence:cfg.oRec||false,repeatOp:cfg.oRep||false,implantRetained:cfg.oKeep||false,implantRemoved:cfg.oRem||false,amputation:cfg.oAmp||false,death:cfg.oDeath||false,lost:cfg.oLost||false,followUpDuration:cfg.fu||'6 weeks',finalOutcome:cfg.final||'',notes:cfg.notes||''}
  };
}
function s(dd){ return {st_karim:['st-karim'],st_ahmed:['st-ahmed'],st_sara:['st-sara'],st_omar:['st-omar'],st_lina:['st-lina'],st_majid:['st-majid']}[dd]; }

var CASES_CFG=[
  /* --- Cluster A: OR2 / ORIF tibia / Dr. Karim / S. aureus --- */
  {op:'2026-03-12',diagD:7,proc:'p_orifti',room:'r2',sf:'st_karim',orgs:['o_sa'],it:['it_deep'],dur:135,prev:'ORIF ankle',prevc:1,assist:['st-omar'],res:['st-yous'],scrub:['st-ayah'],circ:['st-rana'],worker:['st-farid'],rmed:['smoking'],st:'08:00',et:'10:15'},
  {op:'2026-03-30',diagD:9,proc:'p_orifti',room:'r2',sf:'st_karim',orgs:['o_sa'],it:['it_deep','it_implant'],dur:120,prevc:2,res:['st-yous'],scrub:['st-ayah'],circ:['st-rana'],rmed:['diabetes'],tRem:true,tRev:true,final:'Recovered after implant removal',fu:'2 months'},
  {op:'2026-04-19',diagD:7,proc:'p_orifti',room:'r2',sf:'st_karim',orgs:['o_sa','o_kp'],it:['it_deep'],dur:150,prev:'DHS',prevc:1,scrub:['st-ayah'],worker:['st-farid'],rmed:['obesity']},
  {op:'2026-04-28',diagD:8,proc:'p_orifti',room:'r2',sf:'st_karim',orgs:['o_sa'],it:['it_organ','it_implant'],dur:165,prevc:0,rlocal:['hematoma'],oKeep:true,tDeb:true,oCon:false,oPers:true,final:'Under treatment',fu:'1 month'},
  {op:'2026-05-12',diagD:8,proc:'p_orifti',room:'r2',sf:'st_karim',orgs:['o_sa'],it:['it_deep'],dur:140,prev:'IM nail',prevc:2,assist:['st-majid'],res:['st-huda'],rmed:['smoking']},
  {op:'2026-05-27',diagD:7,proc:'p_orifti',room:'r2',sf:'st_karim',orgs:['o_sa','o_pa'],it:['it_implant'],dur:160,rlocal:['coverage'],tRem:true,oRem:true,fu:'2 months',final:'Resolved after removal & beads'},
  /* --- Cluster B: TKA / scrub Ayah / Klebsiella --- */
  {op:'2026-06-10',diagD:12,proc:'p_tka',room:'r1',sf:'st_sara',orgs:['o_kp'],it:['it_pji','it_implant'],dur:150,scrub:['st-ayah'],circ:['st-samer'],res:['st-bilal'],rmed:['diabetes']},
  {op:'2026-06-24',diagD:11,proc:'p_tka',room:'r1',sf:'st_sara',orgs:['o_kp','o_ec'],it:['it_pji'],dur:145,scrub:['st-ayah'],rmed:['obesity']},
  {op:'2026-07-08',diagD:11,proc:'p_tka',room:'r1',sf:'st_lina',orgs:['o_kp'],it:['it_pji','it_implant'],dur:155,scrub:['st-ayah'],anest:['st-dima'],oKeep:true,final:'Retention protocol',fu:'4 months'},
  /* --- Random spread --- */
  {op:'2026-01-14',diagD:6,proc:'p_orifank',room:'r3',sf:'st_ahmed',orgs:['o_sa'],it:['it_superf'],dur:80,site:'Ankle',side:'Left',rmed:['smoking']},
  {op:'2026-01-22',diagD:5,proc:'p_dhs',room:'r3',sf:'st_omar',orgs:['o_cns'],it:['it_superf'],dur:95},
  {op:'2026-02-05',diagD:10,proc:'p_tha',room:'r4',sf:'st_lina',orgs:['o_ec'],it:['it_organ','it_pji'],dur:180,tRem:true,oRem:true,final:'Staged revision',fu:'3 months'},
  {op:'2026-02-13',diagD:9,proc:'p_oriffem',room:'r1',sf:'st_sara',orgs:['o_mrsa'],it:['it_deep'],dur:150,rmed:['diabetes','obesity'],tRem:true},
  {op:'2026-02-25',diagD:7,proc:'p_orifrad',room:'r2',sf:'st_ahmed',orgs:['o_sa'],it:['it_superf'],dur:70,site:'Radius',side:'Left'},
  {op:'2026-03-04',diagD:8,proc:'p_dhs',room:'r2',sf:'st_majid',orgs:['o_cns'],it:['it_deep'],dur:100,rlocal:['deadspace'],tRep:true},
  {op:'2026-03-18',diagD:6,proc:'p_extfix',room:'r3',sf:'st_karim',orgs:['o_pa'],it:['it_deep','it_implant'],dur:90,trauma:'yes',em:'yes',oc:'open',fx:'Gustilo IIIB',impl:'External fixator',rmed:['smoking']},
  {op:'2026-04-07',diagD:14,proc:'p_imti',room:'r4',sf:'st_omar',orgs:['o_kp'],it:['it_osteo'],dur:135,trauma:'yes',em:'yes',oc:'open',fx:'Gustilo IIIC',impl:'Intramedullary nail',rlocal:['soft_tissue','coverage']},
  {op:'2026-04-15',diagD:8,proc:'p_aclr',room:'r4',sf:'st_lina',orgs:['o_sa'],it:['it_superf'],dur:70,prophProb:'correct'},
  {op:'2026-05-03',diagD:7,proc:'p_orifank',room:'r2',sf:'st_ahmed',neg:true,it:['it_superf'],dur:75,site:'Ankle',side:'Left',prophProb:'delayed'},
  {op:'2026-05-19',diagD:9,proc:'p_oriffem',room:'r1',sf:'st_karim',orgs:['o_ab'],it:['it_deep'],dur:160,trauma:'yes',em:'yes',oc:'open',fx:'Gustilo IIIA',rlocal:['soft_tissue']},
  {op:'2026-06-02',diagD:8,proc:'p_dhs',room:'r3',sf:'st_sara',orgs:['o_ec'],it:['it_organ','it_pji'],dur:150,prophProb:'delayed',rmed:['renal']},
  {op:'2026-06-18',diagD:7,proc:'p_dhs',room:'r3',sf:'st_majid',orgs:['o_sa'],it:['it_superf'],dur:95,rmed:['smoking']},
  {op:'2026-07-02',diagD:10,proc:'p_oriffem',room:'r4',sf:'st_omar',orgs:['o_pm'],it:['it_deep'],dur:130,trauma:'yes',oc:'open',fx:'Gustilo II',rlocal:['prev_surg','prev_inf'],impl:'Plate & screws'},
  {op:'2026-07-16',diagD:6,proc:'p_orifrad',room:'r1',sf:'st_ahmed',neg:true,it:['it_superf'],dur:65,site:'Radius'},
  {op:'2026-07-29',diagD:8,proc:'p_extfix',room:'r1',sf:'st_lina',orgs:['o_sa'],it:['it_deep'],dur:85,trauma:'yes',em:'yes',oc:'open',fx:'Gustilo IIIB'},
  {op:'2026-08-06',diagD:8,proc:'p_orifti',room:'r3',sf:'st_sara',orgs:['o_mrsa'],it:['it_deep'],dur:130,rmed:['immunosuppression'],tRep:true,oPers:true},
  {op:'2026-08-14',diagD:7,proc:'p_dhs',room:'r2',sf:'st_ahmed',orgs:['o_cns'],it:['it_superf'],dur:90,oCon:false,oRec:true,final:'Recurrence — reassessment'},
  {op:'2026-08-21',diagD:9,proc:'p_tha',room:'r4',sf:'st_lina',orgs:['o_ent','o_ec'],it:['it_pji','it_implant'],dur:185,res:['st-bilal'],tRem:true,oRem:true,final:'Resolved after two-stage',fu:'4 months'},
  {op:'2026-09-02',diagD:8,proc:'p_orifank',room:'r1',sf:'st_lina',orgs:['o_sa'],it:['it_superf'],dur:70,side:'Right',fu:'3 weeks',final:'Healed'},
  {op:'2026-09-08',diagD:5,proc:'p_oriffem',room:'r2',sf:'st_karim',orgs:['o_sa'],it:['it_superf'],dur:140,anest:['st-khalid']},
  {op:'2026-05-08',diagD:8,proc:'p_orifti',room:'r1',sf:'st_majid',draft:true,orgs:['o_sa'],it:['it_deep'],dur:120},
  {op:'2026-06-28',diagD:8,proc:'p_orifank',room:'r4',sf:'st_ahmed',draft:true,orgs:['o_kp'],it:['it_deep'],dur:90}
];

function load(){
  return App.DB.open().then(function(){
    return Promise.all([
      App.DB.putMany('staff',STAFF),
      App.DB.putMany('rooms',ROOMS),
      App.DB.putMany('procedures',PROCEDURES),
      App.DB.putMany('organisms',ORGANISMS),
      App.DB.putMany('antibiotics',ANTIBIOTICS),
      App.DB.putMany('infectionTypes',INFECTION_TYPES)
    ]);
  }).then(function(){
    var seq=CASES_CFG.map(function(){ return 1; });
    var pending=CASES_CFG.map(function(cfg,i){
      return App.DB.nextCaseId().then(function(id){
        var c=buildCase(cfg,i+1); c.id=id; return App.DB.put('cases',c);
      });
    });
    return Promise.all(pending);
  }).then(function(){
    return App.DB.putMany('exposures',[
      {id:'e1',type:'surgeon',targetId:'st-karim',name:'Dr. Karim Nasser',from:'2026-01-01',to:'2026-08-31',den:186,note:'All orthopedic operations performed as primary surgeon',numerator:null},
      {id:'e2',type:'room',targetId:'r2',name:'OR 2',from:'2026-01-01',to:'2026-08-31',den:122,note:'All operations in OR 2',numerator:null},
      {id:'e3',type:'procedure',targetId:'p_orifti',name:'ORIF tibia',from:'2026-01-01',to:'2026-08-31',den:85,note:'All ORIF tibia procedures',numerator:null},
      {id:'e4',type:'surgeon',targetId:'st-ahmed',name:'Dr. Ahmed Al-Rashidi',from:'2026-01-01',to:'2026-08-31',den:210,note:'All operations as primary surgeon',numerator:null}
    ]);
  });
}

App.SEED={load:load, has:function(){ return App.DB.all('cases'); }};
})();