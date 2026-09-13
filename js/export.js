(function(){
'use strict';
var U=App.U, D=App.DB.DATA, T=App.t, A=App.A;

function download(name,content,mime){
  var blob=new Blob([content],{type:mime||'text/plain'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a'); a.href=url; a.download=name;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); },300);
}
function csvCell(v){
  var s=String(v==null?'':v);
  if(s.indexOf(',')>=0||s.indexOf('"')>=0||s.indexOf('\n')>=0) s='"'+s.replace(/"/g,'""')+'"';
  return s;
}

function researchCSV(cases){
  var head=['CaseID','CaseName','PatientName','Age','Sex','OperationDate','Procedure','Site','Side','TraumaNonTrauma','EmergencyElective','PrimaryRevision','OpenClosed','FractureClassification','ImplantUsed','ImplantType','DurationMin','OperatingRoom','Surgeon','Team','RiskFactors','Prophylaxis','ProphylaxisProblem','DaysToInfection','InfectionDiagnosed','InfectionType','Symptoms','CulturePerformed','CultureDate','Specimen','CultureNegative','CulturePending','Organism','Sensitivity','Resistance','ESBL','MRSA','VRE','MDR','OtherResistance','Treatment','AntibioticDuration','Outcome','FinalOutcome','Status'];
  var rows=[head.join(',')];
  cases.forEach(function(c){
    var team=(A.teamFlat(c)||[]).map(function(i){ return U.nameOf(i,D.staff,i); }).join('; ');
    var risks=(c.riskFactors?c.riskFactors.medical.concat(c.riskFactors.local):[]).map(App.riskLabel).join('; ');
    var infTypes=((c.infection&&c.infection.types)||[]).map(function(i){ return U.nameOf(i,D.infectionTypes,i); }).join('; ');
    var symptoms=[];
    var inf=c.infection||{};
    if(inf.fever)symptoms.push(T('inf_fever')); if(inf.discharge)symptoms.push(T('inf_discharge'));
    if(inf.erythema)symptoms.push(T('inf_erythema')); if(inf.pain)symptoms.push(T('inf_pain'));
    if(inf.crp)symptoms.push(T('inf_crp')); if(inf.esr)symptoms.push(T('inf_esr')); if(inf.leuko)symptoms.push(T('inf_leuko'));
    if(inf.imaging)symptoms.push(inf.imaging);
    var treats=[];
    var tr=c.treatment||{};
    ['debridement','repeatDebridement','implantRetention','implantRemoval','revisionFixation','externalFixation','abCement','abBeads','stimulan','ivAntibiotics','oralAntibiotics'].forEach(function(k,i){ if(tr[k]) treats.push(k); });
    var outc=[];
    var oc=c.outcome||{};
    ['controlled','persistent','recurrence','repeatOp','implantRetained','implantRemoved','amputation','death','lost'].forEach(function(k){ if(oc[k]) outc.push(k); });
    var cDates=(c.cultures||[]).map(function(x){ return x.date; }).filter(Boolean).join('; ');
    var daysTo=(function(){ if(c.opDate&&c.infectionDiagnosedDate) return U.daysBetween(c.opDate,c.infectionDiagnosedDate); return c.infection&&c.infection.days!=null?c.infection.days:''; })();
    var orgRows=(c.cultures||[]).length?(function(){
      var out=[];
      (c.cultures||[]).forEach(function(cu){
        var orgs=cu.organisms||[];
        if(orgs.length===0){
          out.push([cu]);
        } else {
          orgs.forEach(function(o){ out.push([cu,o]); });
        }
      });
      return out;
    })():[[null]];
    orgRows.forEach(function(pair){
      var cu=pair[0], o=pair[1];
      var row=[c.id,c.caseName||'',c.ptName||'',c.age,U.nameOf(c.sex,[{id:'M',name:T('sex_m'),label:T('sex_m')},{id:'F',name:T('sex_f'),label:T('sex_f')}],c.sex),c.opDate,
        U.nameOf(c.procedure,D.procedures,c.procedure),c.site,c.side,
        c.trauma==='yes'?T('yes'):(c.trauma==='no'?T('no'):''),
        c.emergency==='yes'?T('yes'):(c.emergency==='no'?T('no'):''),
        c.primaryRevision||'',c.openClosed||'',c.fxClass||'',
        c.implantUsed==='yes'?'yes':'',c.implantType||'',c.duration||'',
        (c.or&&U.nameOf(c.or.room,D.rooms,c.or.room))||'',(c.team&&U.nameOf((c.team.surgeons||[])[0],D.staff,''))||'',
        team,risks,
        c.prophylaxis&&c.prophylaxis.antibiotic?U.nameOf(c.prophylaxis.antibiotic,D.antibiotics,c.prophylaxis.antibiotic):(c.prophylaxis&&c.prophylaxis.antibioticText||''),
        c.prophylaxis&&c.prophylaxis.problem?T('proph_'+c.prophylaxis.problem):'',
        daysTo,c.infectionDiagnosedDate,infTypes,symptoms.join('; '),
        c.cultures&&c.cultures.length?'yes':'',(cu&&cu.date)||'',(cu&&U.nameOf(cu.specimen,SPEC,cu.specimen))||'',
        (cu&&(cu.negative?'yes':''))||'',(cu&&(cu.pending?'yes':''))||'',
        (o&&U.nameOf(o.organismId,D.organisms,o.organismId))||'',
        (o&&o.sensitivity)||'',
        (o&&((o.resistance||[]).join('; ')||''))||'',
        (o&&(o.esbl?'yes':''))||'',(o&&(o.mrsa?'yes':''))||'',(o&&(o.vre?'yes':''))||'',(o&&(o.mdr?'yes':''))||'',
        (o&&o.otherRes)||'',
        treats.join('; '),tr.antibioticDuration||'',outc.join('; '),oc.finalOutcome||'',c.status];
      rows.push(row.map(csvCell).join(','));
    });
  });
  return '\ufeff'+rows.join('\r\n');
}
var SPEC=[{id:'swab',name:'swab'},{id:'deep',name:'deep tissue'},{id:'pus',name:'pus'},{id:'bone',name:'bone'},{id:'blood',name:'blood'},{id:'implant',name:'implant'},{id:'other',name:'other'}];

function backupJSON(){
  return Promise.all(App.DB.STORES.map(function(s){
    return App.DB.all(s).then(function(rows){ return [s,rows]; });
  })).then(function(pairs){
    var stores={}; pairs.forEach(function(p){ stores[p[0]]=p[1]; });
    return JSON.stringify({app:'ortho-inf-surv',version:1,exportedAt:U.now(),stores:stores},null,2);
  });
}
function importJSONText(text){
  var data;
  try{ data=JSON.parse(text); }catch(e){ throw new Error('Invalid JSON'); }
  if(!data||data.app!=='ortho-inf-surv'||!data.stores) throw new Error('Not a valid backup file');
  var todo=App.DB.STORES.filter(function(s){ return data.stores[s]; });
  return App.DB.open().then(function(){
    return Promise.all(todo.map(function(s){ return App.DB.clear(s); }))
      .then(function(){
        return Promise.all(todo.map(function(s){ return App.DB.putMany(s,data.stores[s]); }));
      });
  });
}
function wipeAll(){
  return App.DB.open().then(function(){
    return Promise.all(App.DB.STORES.map(function(s){ return App.DB.clear(s); }))
      .then(function(){ return App.DB.put('settings',{id:'seq',n:0}); });
  });
}

function tableFrom(list,labelFn){
  if(!list.length) return '<p class="muted small">—</p>';
  var rows=list.map(function(it){
    return '<tr><td>'+labelFn(it)+'</td><td style="text-align:end;font-weight:700">'+it.count+'</td></tr>';
  }).join('');
  return '<table><tr><th>'+T('res_group')+'</th><th>'+T('res_counts')+'</th></tr>'+rows+'</table>';
}
function countsFrom(m,labelFn){
  return Object.keys(m).map(function(k){ return {key:k,count:m[k]}; }).sort(function(a,b){ return b.count-a.count; }).map(function(it){ return {key:it.key,label:labelFn(it.key),count:it.count}; });
}
function riskCounts(cases){
  var m={};
  cases.forEach(function(c){ (A.riskOf(c)||[]).forEach(function(k){ m[k]=(m[k]||0)+1; }); });
  return m;
}

function monthlyReportHTML(month,cases){
  var list=cases.filter(function(c){ return U.monthKey(A.cDiag(c))===month; });
  var s=App.A.stats(list);
  var h='<div class="report">';
  h+='<h1>'+U.esc(T('rep_month_report')+' — '+((App.CONFIG.hospital||'').trim()?App.CONFIG.hospital:App.t('app_name')))+'</h1>';
  h+='<p class="meta">'+U.esc(U.monthLabel(month))+' · '+U.esc(T('rep_word'))+' · '+U.fmt(U.today())+'</p>';
  h+='<div class="neutralbox">'+T('rep_meta_lin')+'</div>';
  h+='<h2>'+T('rep_total')+'</h2><p class="big" style="font-size:26px;font-weight:800">'+s.total+'</p>';
  h+='<h2>'+T('rep_types')+'</h2>'+tableFrom(countsFrom(counts(list,function(c){return ((c.infection&&c.infection.types)||[])[0];}),function(k){return U.nameOf(k,D.infectionTypes,k);}),function(it){ return it.label; });
  h+='<h2>'+T('rep_procs')+'</h2>'+tableFrom(countsFrom(counts(list,function(c){return c.procedure;}),function(k){return U.nameOf(k,D.procedures,k);}),function(it){return it.label;});
  h+='<h2>'+T('rep_rooms')+'</h2>'+tableFrom(countsFrom(counts(list,function(c){return c.or&&c.or.room;}),function(k){return U.nameOf(k,D.rooms,k);}),function(it){return it.label;});
  h+='<h2>'+T('rep_surgeons')+'</h2>'+tableFrom(countsFrom(counts(list,function(c){return ((c.team||{}).surgeons||[])[0];}),function(k){return U.nameOf(k,D.staff,k);}),function(it){return it.label;});
  h+='<h2>'+T('rep_orgs')+'</h2>'+tableFrom(countsFrom(countsOrg(list),function(k){return U.nameOf(k,D.organisms,k);}),function(it){return it.label;});
  h+='<h2>'+T('rep_risk')+'</h2>'+tableFrom(countsFrom(riskCounts(list),App.riskLabel),function(it){return App.riskLabel(it.key);});
  var clus=App.A.clustersOf(list,App.CONFIG,{from:month+'-01',to:month+'-31'});
  h+='<h2>'+T('rep_clusters')+'</h2>'+(clus.length?(clus.map(function(cl){
    return '<div class="warnbox"><b>'+U.esc(T('rep_danger_cluster'))+'</b><br>'+U.esc(cl.title)+' — '+cl.count+' '+T('cl_cases')+' ('+U.fmt(cl.from)+' → '+U.fmt(cl.to)+')</div>';
  }).join('')):'<p class="muted small">—</p>');
  h+='<p class="meta mt">'+T('storage_note')+'</p>';
  h+='</div>';
  return h;
}
function counts(list,keyFn){
  var m={};
  list.forEach(function(c){ var k=keyFn(c); if(k==null||k==='') return; m[k]=(m[k]||0)+1; });
  return m;
}
function countsOrg(list){
  var m={};
  list.forEach(function(c){ A.orgsOf(c).forEach(function(o){ m[o]=(m[o]||0)+1; }); });
  return m;
}

function clusterReportHTML(cluster,cases){
  var sel=cases.filter(function(c){ return cluster.ids.indexOf(c.id)>=0; });
  var cmp=App.A.compareCases(cluster.ids,cases);
  var h='<div class="report">';
  h+='<h1>'+T('rep_inv_title')+'</h1>';
  h+='<p class="meta">'+U.fmt(U.today())+'</p>';
  h+='<div class="warnbox"><b>'+T('cluster_banner')+'</b><br>'+U.esc(cluster.title)+'</div>';
  h+='<div class="neutralbox">'+T('rep_neutral')+'</div>';
  h+='<h2>'+T('cl_cases')+' ('+sel.length+')</h2><table><tr><th>'+T('case_id')+'</th><th>'+T('op_date')+'</th><th>'+T('procedure')+'</th><th>'+T('or_room')+'</th><th>'+T('rep_orgs')+'</th></tr>';
  sel.sort(function(a,b){ return A.cDiag(a)<A.cDiag(b)?-1:1; }).forEach(function(c){
    h+='<tr><td>'+U.esc(c.id)+'</td><td>'+U.fmt(c.opDate)+'</td><td>'+U.esc(U.nameOf(c.procedure,D.procedures,c.procedure))+'</td><td>'+U.esc(U.nameOf(c.or&&c.or.room,D.rooms,''))+'</td><td>'+U.esc(A.orgsOf(c).map(function(o){return U.nameOf(o,D.organisms,o);}).join(', '))+'</td></tr>';
  });
  h+='</table>';
  h+='<h2>'+T('cl_period')+'</h2><p>'+U.fmt(cluster.from)+' → '+U.fmt(cluster.to)+' ('+cluster.span+' '+T('days_s')+')</p>';
  h+='<h2>'+T('rep_inv_common')+'</h2>';
  if(cmp.shared.length){
    h+='<table><tr><th>'+T('compare_dim')+'</th><th>'+T('compare_val')+'</th><th>'+T('compare_n')+'</th></tr>';
    cmp.shared.slice(0,12).forEach(function(sh){
      h+='<tr><td>'+U.esc(sh.label)+'</td><td>'+U.esc(fmtSharedVal(sh.dim,sh.value))+'</td><td style="text-align:end">'+sh.count+' / '+cmp.selected.length+'</td></tr>';
    });
    h+='</table>';
    h+='<div class="neutralbox"><b>'+T('compare_banner')+'</b></div>';
  } else {
    h+='<p class="muted">'+T('compare_none')+'</p>';
  }
  h+='<h2>'+T('sta_rooms')+'</h2><p>'+U.esc(Object.keys(countsFrom(counts(sel,function(c){return c.or&&c.or.room;}),function(k){return U.nameOf(k,D.rooms,k);})).slice(0,8).join(' · ')||'—')+'</p>';
  h+='<h2>'+T('rep_inv_expo')+'</h2><p class="muted small">'+T('rep_inv_none')+'</p>';
  h+='<p class="meta mt">'+T('storage_note')+'</p>';
  h+='</div>';
  return h;
}
function fmtSharedVal(dim,val){
  if(dim==='room') return U.nameOf(val,D.rooms,val);
  if(dim==='proc') return U.nameOf(val,D.procedures,val);
  if(dim==='org') return U.nameOf(val,D.organisms,val);
  if(dim==='surg') return U.nameOf(val,D.staff,val);
  if(dim==='proph') return T('proph_'+val)!=('proph_'+val)?T('proph_'+val):val;
  return val;
}

function printHTML(html,title){
  var w=window.open('','_blank');
  if(!w) { U.toast('Blocked','err'); return; }
  w.document.write('<!doctype html><html lang="'+App.LANG+'" dir="'+(App.LANG==='ar'?'rtl':'ltr')+'"><head><meta charset="utf-8"><title>'+U.esc(title||'Report')+'</title><link rel="stylesheet" href="./css/style.css"></head><body style="background:#fff"><div class="app" style="max-width:820px">'+html+'</div><div class="noprint" style="text-align:center;padding:20px"><button class="btn" onclick="window.print()">'+U.esc(T('print')+' / PDF')+'</button></div><script>window.onload=function(){window.focus();}<\/script></body></html>');
  w.document.close();
  return w;
}

App.Exp={download:download,researchCSV:researchCSV,backupJSON:backupJSON,importJSONText:importJSONText,wipeAll:wipeAll,monthlyReportHTML:monthlyReportHTML,clusterReportHTML:clusterReportHTML,printHTML:printHTML};
})();