(function(){
'use strict';
var U={};

U.esc = function(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };

U.qs = function(s){ return document.querySelector(s); };
U.qsa = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };

U.today = function(){ var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); };
U.toISO = function(d){ if(!d) return ''; return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); };
U.addDays = function(iso,n){ if(!iso) return iso; var d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return U.toISO(d); };
U.daysBetween = function(a,b){ if(!a||!b) return null; var x=new Date(a+'T00:00:00'), y=new Date(b+'T00:00:00'); return Math.round((y-x)/86400000); };
U.monthKey = function(iso){ return iso?iso.slice(0,7):''; };
U.fmt = function(iso){ if(!iso) return '—'; var p=String(iso).split('-'); if(p.length!==3) return String(iso); return p[2]+'/'+p[1]+'/'+p[0]; };
U.monthLabel = function(key){ if(!key) return ''; var p=key.split('-'); if(p.length<2) return key; var d=new Date(+p[0],+p[1]-1,1); var m=d.toLocaleDateString('en-GB',{month:'short'}); return m+' '+p[0]; };
U.now = function(){ return new Date().toISOString(); };
U.num = function(v){ var n=parseFloat(v); return isNaN(n)?0:n; };
U.pct = function(n,d){ if(d==null||!U.num(d)||U.num(d)<=0) return null; var r=(U.num(n)/U.num(d)*100); return (Math.round(r*10)/10).toFixed(1).replace(/\.0$/,'')+'%'; };

U.uid = function(){ return Math.random().toString(36).slice(2,10)+Date.now().toString(36); };

U.lsGet = function(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
U.lsSet = function(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };

U.toast = function(msg,type){ var box=document.getElementById('toasts'); if(!box) return; var el=document.createElement('div'); el.className='toast'+(type?' '+type:''); el.textContent=msg; box.appendChild(el); setTimeout(function(){ el.classList.add('out'); setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); },400); },2800); };
U.confirm = function(msg){ return window.confirm(msg); };

U.img = function(s,w){ return s==null?'0':String(s); };

/* ---- reusable field markup helpers ---- */
U.ff = function(label,control,hint){
  return '<div class="fld"><span class="fl">'+label+'</span>'+control+(hint?'<div class="hint">'+hint+'</div>':'')+'</div>';
};
U.inp = function(name,val,ph,type,extra){
  type=type||'text';
  return '<input class="inp" type="'+type+'" name="'+U.esc(name||'')+'" value="'+U.esc(val==null?'':val)+'"'+(ph?' placeholder="'+U.esc(ph)+'"':'')+(extra||'')+'>';
};
U.tarea = function(name,val,ph){ return '<textarea class="inp" name="'+U.esc(name||'')+'"'+(ph?' placeholder="'+U.esc(ph)+'"':'')+'>'+U.esc(val||'')+'</textarea>'; };
U.date = function(name,val){ return U.inp(name,val,'','date'); };
U.time = function(name,val){ return U.inp(name,val,'','time'); };
U.numf = function(name,val,step,min){ return U.inp(name,val,'','number',' inputmode="decimal"'+(step?' step="'+String(step)+'"':'')+(min!=null?' min="'+String(min)+'"':'')); };
U.sel = function(name,options,value,anyLabel){
  var h='<select class="inp" name="'+U.esc(name||'')+'">';
  if(anyLabel) h+='<option value="">'+U.esc(anyLabel)+'</option>';
  (options||[]).forEach(function(o){ h+='<option value="'+U.esc(String(o.v))+'">'+U.esc(o.l)+'</option>'; });
  return h+'</select>';
};
U.ckb = function(name,value,label,checked){
  return '<label class="ck"><input type="checkbox" name="'+U.esc(name)+'" value="'+U.esc(value)+'"'+(checked?' checked':'')+'><span>'+label+'</span></label>';
};
U.rd = function(name,value,label,checked){
  return '<label class="rd"><input type="radio" name="'+U.esc(name)+'" value="'+U.esc(value)+'"'+(checked?' checked':'')+'>'+label+'</label>';
};
U.rdg = function(name,items,value){ return '<div class="rdg">'+(items||[]).map(function(it){ return U.rd(name,it.v,it.l,String(it.v)===String(value==null?'':value)); }).join('')+'</div>'; };
U.ckg = function(name,items,values){ values=values||[]; return '<div class="ckg">'+(items||[]).map(function(it){ return U.ckb(name,it.v,it.l,values.indexOf(it.v)>=0); }).join('')+'</div>'; };
U.sec = function(title,subtitle,content){ return '<section class="card sec"><h3 class="sec-t">'+title+'</h3>'+(subtitle?'<p class="sec-s">'+subtitle+'</p>':'')+content+'</section>'; };
U.btn = function(label,act,params,cls){
  var ps=''; if(params) for(var k in params) ps+=' data-'+k+'="'+U.esc(String(params[k]))+'"';
  return '<button class="btn '+(cls||'')+'" data-act="'+U.esc(act)+'"'+ps+'>'+label+'</button>';
};
U.chip = function(label,cls){ return '<span class="chip '+(cls||'')+'">'+label+'</span>'; };
U.card = function(inner,cls){ return '<div class="card'+(cls?' '+cls:'')+'">'+inner+'</div>'; };
U.empty = function(msg){ return '<div class="empty">'+msg+'</div>'; };

U.nameOf = function(id, list, fallback){
  if(!id) return '';
  var it=list||[];
  for(var i=0;i<it.length;i++) if(String(it[i].id)===String(id)) return it[i].name||'';
  if(String(id).indexOf('NEW:')===0) return String(id).slice(4);
  return fallback!=null?fallback:String(id);
};

/* ---- multi-select widget ---- */
U.msHTML = function(name,label,options,selected,role){
  var opt=U.esc(JSON.stringify(options||[]));
  var sel=U.esc(JSON.stringify((selected||[]).filter(function(x){ return x!==''; })));
  return '<div class="fld"><span class="fl">'+label+'</span><div class="ms" data-ms="'+U.esc(name)+'"'+(role?' data-role="'+U.esc(role)+'"':'')+' data-opts="'+opt+'" data-val="'+sel+'"><div class="ms-chips"></div><input class="ms-input" type="text" autocomplete="off" placeholder="'+U.esc(label)+' …"><div class="ms-list"></div><input type="hidden" name="'+U.esc(name)+'"></div></div>';
};
U.ssHTML = function(name,label,options,selected,role){
  var opt=U.esc(JSON.stringify(options||[]));
  return '<div class="fld"><span class="fl">'+label+'</span><div class="ss" data-ss="'+U.esc(name)+'"'+(role?' data-role="'+U.esc(role)+'"':'')+' data-opts="'+opt+'" data-val="'+U.esc(String(selected||''))+'"><input class="ss-input" type="text" autocomplete="off" placeholder="'+U.esc(label)+' …"><input type="hidden" name="'+U.esc(name)+'"></div></div>';
};

function findOpts(optsEl){ try{ return JSON.parse(optsEl.getAttribute('data-opts')); }catch(e){ return []; } }

function initMS(el){
  var opts=findOpts(el);
  var initVal=[]; try{ initVal=JSON.parse(el.getAttribute('data-val')||'[]'); }catch(e){}
  var val=initVal.slice();
  var chipsEl=el.querySelector('.ms-chips'), input=el.querySelector('.ms-input'), list=el.querySelector('.ms-list'), hidden=el.querySelector('input[type=hidden]');
  hidden.value=JSON.stringify(val);
  function render(){
    chipsEl.innerHTML='';
    val.forEach(function(id){
      var raw=String(id).indexOf('NEW:')===0;
      var lab=raw?String(id).slice(4):U.nameOf(id,opts);
      var c=document.createElement('span'); c.className='chip'; c.innerHTML='<span>'+U.esc(lab)+'</span><span class="x" data-x="1">×</span>';
      c.querySelector('.x').addEventListener('click',function(){ val=val.filter(function(v){ return v!==id; }); hidden.value=JSON.stringify(val); render(); });
      chipsEl.appendChild(c);
    });
  }
  function close(){ list.className='ms-list'; }
  function open(){ list.className='ms-list open'; }
  function renderList(){
    var q=(input.value||'').trim().toLowerCase();
    list.innerHTML='';
    var shown=0;
    opts.forEach(function(o){
      if(val.indexOf(o.id)>=0) return;
      if(q && String(o.name||o.label||'').toLowerCase().indexOf(q)<0) return;
      shown++;
      var li=document.createElement('div'); li.className='ms-opt'; li.textContent=o.name||o.label||String(o.id);
      li.addEventListener('click',function(){ val.push(o.id); hidden.value=JSON.stringify(val); render(); close(); input.value=''; });
      list.appendChild(li);
    });
    if(q && !shown){
      var li=document.createElement('div'); li.className='ms-opt'; li.textContent='“'+q+'”';
      li.addEventListener('click',function(){ val.push('NEW:'+q); hidden.value=JSON.stringify(val); render(); close(); input.value=''; });
      list.appendChild(li);
    }
  }
  input.addEventListener('focus',function(){ renderList(); open(); });
  input.addEventListener('input',function(){ renderList(); open(); });
  input.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); var q=(input.value||'').trim(); if(!q) return; var match=null; for(var i=0;i<opts.length;i++){ if(String(opts[i].name||'').toLowerCase()===q.toLowerCase()){ match=opts[i].id; break; } } if(match) val.push(match); else val.push('NEW:'+q); hidden.value=JSON.stringify(val); render(); input.value=''; close(); } });
  document.addEventListener('click',function(e){ if(!el.contains(e.target)) close(); });
  render();
  return { get:function(){ return JSON.parse(hidden.value||'[]'); } };
}

function initSS(el){
  var opts=findOpts(el);
  var input=el.querySelector('.ss-input'), hidden=el.querySelector('input[type=hidden]');
  var dl=document.createElement('datalist'); dl.id='dl_'+U.uid();
  opts.forEach(function(o){ var d=document.createElement('option'); d.value=o.name||o.label||String(o.id); dl.appendChild(d); });
  document.body.appendChild(dl);
  input.setAttribute('list',dl.id);
  function setVal(v){
    if(v===undefined||v===''){ hidden.value=''; input.value=''; return; }
    var o=null;
    for(var i=0;i<opts.length;i++) if(String(opts[i].id)===String(v)){ o=opts[i]; break; }
    if(o) input.value=o.name||o.label||String(o.id);
    hidden.value=String(v);
  }
  function sync(){
    var q=(input.value||'').trim();
    if(!q){ hidden.value=''; return; }
    for(var i=0;i<opts.length;i++){ if(String(opts[i].name||'').toLowerCase()===q.toLowerCase()){ hidden.value=opts[i].id; return; } }
    hidden.value='NEW:'+q;
  }
  input.addEventListener('input',sync);
  input.addEventListener('change',sync);
  setVal(el.getAttribute('data-val'));
  return { set:setVal, get:function(){ return hidden.value||''; } };
}

U.initFields = function(root){
  (root||document).querySelectorAll('.ms').forEach(function(el){ initMS(el); });
  (root||document).querySelectorAll('.ss').forEach(function(el){ initSS(el); });
};

U.yesno = function(v, invert){ return String(v)==='yes'?true:(String(v)==='no'?false:null); };

App.U=U;

App.RISK_MEDICAL=[
  {id:'diabetes',k:'rf_diabetes'},{id:'smoking',k:'rf_smoking'},{id:'obesity',k:'rf_obesity'},
  {id:'malnutrition',k:'rf_malnutrition'},{id:'immunosuppression',k:'rf_immuno'},{id:'steroid',k:'rf_steroid'},
  {id:'renal',k:'rf_renal'},{id:'liver',k:'rf_liver'},{id:'pvd',k:'rf_pvd'},{id:'neuropathy',k:'rf_neuro'},
  {id:'other_med',k:'rf_other_med'}
];
App.RISK_LOCAL=[
  {id:'open_fx',k:'rf_openfx'},{id:'soft_tissue',k:'rf_sti'},{id:'prev_surg',k:'rf_prev_surg'},
  {id:'prev_inf',k:'rf_prev_inf'},{id:'prev_hosp',k:'rf_prev_hosp'},{id:'deadspace',k:'rf_deadspace'},
  {id:'hematoma',k:'rf_hematoma'},{id:'coverage',k:'rf_coverage'},{id:'other_local',k:'rf_local_other'}
];
App.riskItem = function(id){ var all=App.RISK_MEDICAL.concat(App.RISK_LOCAL); for(var i=0;i<all.length;i++) if(all[i].id===id) return all[i]; return null; };
App.riskLabel = function(id){ var it=App.riskItem(id); return it?App.t(it.k):String(id); };

App.SITES=['Femur','Tibia','Fibula','Ankle','Foot','Hip','Pelvis / Acetabulum','Upper femur','Knee','Patella','Humerus','Radius','Ulna','Elbow','Hand / Wrist','Clavicle','Scapula','Spine','Shoulder','Other'];
App.IMPLANTS=['Plate & screws','Screws only','Intramedullary nail','DHS / DCS','External fixator','K-wires','Total hip prosthesis','Total knee prosthesis','Shoulder prosthesis','Hemiarthroplasty','Cement spacer','Cerclage / wire','None'];
App.SPECIMENS=[{id:'swab',k:'spec_swab'},{id:'deep',k:'spec_deep'},{id:'pus',k:'spec_pus'},{id:'bone',k:'spec_bone'},{id:'blood',k:'spec_blood'},{id:'implant',k:'spec_implant'},{id:'other',k:'spec_other'}];
App.INF_SIGNS=[{id:'fever',k:'inf_fever'},{id:'discharge',k:'inf_discharge'},{id:'erythema',k:'inf_erythema'},{id:'pain',k:'inf_pain'},{id:'crp',k:'inf_crp'},{id:'esr',k:'inf_esr'},{id:'leuko',k:'inf_leuko'}];
App.TREAT_ITEMS=[
  {id:'debridement',k:'t_deb'},{id:'repeatDebridement',k:'t_rep_deb'},{id:'implantRetention',k:'t_retain'},
  {id:'implantRemoval',k:'t_remove'},{id:'revisionFixation',k:'t_revfix'},{id:'externalFixation',k:'t_extfix'},
  {id:'abCement',k:'t_abc'},{id:'abBeads',k:'t_beads'},{id:'stimulan',k:'t_stimulan'},
  {id:'ivAntibiotics',k:'t_iv'},{id:'oralAntibiotics',k:'t_oral'}
];
App.OUTCOME_ITEMS=[
  {id:'controlled',k:'o_controlled'},{id:'persistent',k:'o_persist'},{id:'recurrence',k:'o_recurr'},
  {id:'repeatOp',k:'o_repeat'},{id:'implantRetained',k:'o_keep'},{id:'implantRemoved',k:'o_removed'},
  {id:'amputation',k:'o_amp'},{id:'death',k:'o_death'},{id:'lost',k:'o_lost'}
];
App.teamKeyLabel = function(k){
  var km={surgeons:'team_primary',assistants:'team_assist',residents:'team_res',scrub:'team_scrub',circulating:'team_circ',instrument:'team_instr',otherNursing:'team_othnurse',anesthesiaDoc:'team_anes_doc',anesthesiaTeam:'team_anes_team',worker:'team_worker',otherStaff:'team_other'};
  return App.t(km[k]||'team_other');
};
})();