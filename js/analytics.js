(function(){
'use strict';
var U=App.U, D=App.DB.DATA, T=App.t;

function cDiag(c){ return c.infectionDiagnosedDate||c.opDate||c.createdDate||''; }
function cOp(c){ return c.opDate||c.infectionDiagnosedDate||c.createdDate||''; }
function teamFlat(c){
  var t=c.team||{}, out=[];
  var ks=['surgeons','assistants','residents','scrub','circulating','instrument','otherNursing','anesthesiaDoc','anesthesiaTeam','worker','otherStaff'];
  ks.forEach(function(k){ (t[k]||[]).forEach(function(id){ if(id) out.push(id); }); });
  return out;
}
function orgsOf(c){ var s=new Set(); (c.cultures||[]).forEach(function(cu){ (cu.organisms||[]).forEach(function(o){ if(o.organismId) s.add(o.organismId); }); }); return Array.from(s); }
function riskOf(c){ var r=c.riskFactors||{}; return (r.medical||[]).concat(r.local||[]); }

function staffName(id){ return U.nameOf(id,D.staff,String(id)); }

function stats(cases){
  var out={total:0,month:0,year:0,deep:0,superf:0,implant:0,cpos:0,cneg:0,ncult:0,draft:0};
  var ym=U.today().slice(0,7), yr=U.today().slice(0,4);
  cases.forEach(function(c){
    out.total++;
    if(c.status==='draft') out.draft++;
    var d=cDiag(c);
    if(d.slice(0,7)===ym) out.month++;
    if(d.slice(0,4)===yr) out.year++;
    var its=(c.infection&&c.infection.types)||[];
    var itsj=its.join(',');
    if(itsj.indexOf('deep')>=0||itsj.indexOf('organ')>=0||itsj.indexOf('implant')>=0||itsj.indexOf('osteo')>=0||itsj.indexOf('pji')>=0) out.deep++;
    if(its.indexOf('superf')>=0) out.superf++;
    if((c.implantUsed==='yes')||its.indexOf('implant')>=0) out.implant++;
    var cult=(c.cultures||[]).filter(function(x){ return !x.removed; });
    out.ncult += cult.length;
    var anyNeg=cult.some(function(x){ return x.negative; });
    var anyPos=cult.some(function(x){ return !x.negative && !x.pending && (x.organisms||[]).length>0; });
    if(anyPos) out.cpos++;
    if(anyNeg) out.cneg++;
  });
  return out;
}

function topByLabel(cases,keyFn,labelFn,limit){
  var m={};
  cases.forEach(function(c){ var k=keyFn(c); if(k==null||k==='') return; m[k]=(m[k]||0)+1; });
  return Object.keys(m).map(function(k){ return {key:k,label:labelFn(k),count:m[k]}; }).sort(function(a,b){ return b.count-a.count; }).slice(0,limit||5);
}
function topOrganisms(cases,limit){
  var m={};
  cases.forEach(function(c){ orgsOf(c).forEach(function(id){ m[id]=(m[id]||0)+1; }); });
  return Object.keys(m).map(function(k){ return {key:k,label:U.nameOf(k,D.organisms,k),count:m[k]}; }).sort(function(a,b){ return b.count-a.count; }).slice(0,limit||5);
}
function topProcedures(cases,limit){ return topByLabel(cases,function(c){ return c.procedure; },function(k){ return U.nameOf(k,D.procedures,k); },limit); }
function topRooms(cases,limit){ return topByLabel(cases,function(c){ return c.or&&c.or.room; },function(k){ return U.nameOf(k,D.rooms,k); },limit); }
function topPrimarySurgeons(cases,limit){
  var m={};
  cases.forEach(function(c){ var s=((c.team||{}).surgeons||[])[0]; if(!s) return; m[s]=(m[s]||0)+1; });
  return Object.keys(m).map(function(k){ return {key:k,label:U.nameOf(k,D.staff,k),count:m[k]}; }).sort(function(a,b){ return b.count-a.count; }).slice(0,limit||5);
}

function filter(cases,f){
  f=f||{};
  return cases.filter(function(c){
    if(f.from&&cDiag(c)<f.from) return false;
    if(f.to&&cDiag(c)>f.to) return false;
    if(f.status&&f.status!=='all'&&c.status!==f.status) return false;
    if(f.surgeon&&teamFlat(c).indexOf(f.surgeon)<0) return false;
    if(f.room&&!(c.or&&c.or.room===f.room)) return false;
    if(f.procedure&&c.procedure!==f.procedure) return false;
    if(f.organism&&orgsOf(c).indexOf(f.organism)<0) return false;
    if(f.inftype&&((c.infection&&c.infection.types)||[]).indexOf(f.inftype)<0) return false;
    if(f.implant==='yes'&&c.implantUsed!=='yes') return false;
    if(f.implant==='no'&&c.implantUsed==='yes') return false;
    if(f.emergency&&c.emergency!==f.emergency) return false;
    if(f.trauma&&c.trauma!==f.trauma) return false;
    if(f.risk&&riskOf(c).indexOf(f.risk)<0) return false;
    if(f.q){
      var q=f.q.toLowerCase();
      var cid=String(c.id).toLowerCase(), mrn=String(c.mrn||'').toLowerCase(), pt=String(c.ptName||'').toLowerCase();
      var proc=U.nameOf(c.procedure,D.procedures).toLowerCase();
      var surg=teamFlat(c).map(function(i){ return U.nameOf(i,D.staff); }).join(' ').toLowerCase();
      if(cid.indexOf(q)<0&&mrn.indexOf(q)<0&&pt.indexOf(q)<0&&proc.indexOf(q)<0&&surg.indexOf(q)<0) return false;
    }
    return true;
  });
}

function trends(cases){
  var m={};
  cases.forEach(function(c){ var k=U.monthKey(cDiag(c)); if(!k) return; m[k]=(m[k]||0)+1; });
  return Object.keys(m).map(function(k){ return {m:k,count:m[k]}; }).sort(function(a,b){ return a.m<b.m?-1:1; });
}

function valOf(c,dim){
  if(dim==='room') return c.or&&c.or.room;
  if(dim==='proc') return c.procedure;
  if(dim==='surgeon') return ((c.team||{}).surgeons||[])[0];
  if(dim==='org'){ var o=orgsOf(c); return o[0]; }
  return null;
}
function combos(cases,limit){
  var res=[];
  var dims=[['room','proc'],['proc','org'],['surgeon','room'],['org','room'],['surgeon','proc'],['room','org']];
  dims.forEach(function(d){
    var m={};
    cases.forEach(function(c){
      var a=valOf(c,d[0]), b=valOf(c,d[1]);
      if(a==null||a===''||b==null||b==='') return;
      var key=d[0]+'\u0001'+a+'\u0002'+d[1]+'\u0001'+b;
      m[key]=(m[key]||0)+1;
    });
    var rows=Object.keys(m).map(function(k){ return {key:k,c:m[k]}; })
      .sort(function(x,y){ return y.c-x.c; }).slice(0,limit||4);
    rows.forEach(function(r){
      var p=r.key.split('\u0001');
      res.push({count:r.c,a:{dim:d[0],id:p[1].split('\u0002')[0]},b:{dim:d[1],id:p[1].split('\u0002')[1]||p[2]}});
    });
  });
  return res;
}

function clustersOf(cases,cfg,range){
  var min=cfg.clusterMin||3, win=cfg.clusterWindow||45, out=[], seen={};
  var list=cases.filter(function(c){ return c.status!=='draft'; });
  if(range){
    if(range.from) list=list.filter(function(c){ return cDiag(c)>=range.from; });
    if(range.to) list=list.filter(function(c){ return cDiag(c)<=range.to; });
  }
  if(!list.length) return [];
  function push(kind,title,arr,sev){
    var ids=arr.map(function(c){ return c.id; }).sort().join('|');
    if(seen[ids]&&seen[ids]===kind) return;
    seen[ids]=kind;
    var dates=arr.map(cDiag).filter(Boolean).sort();
    var from=dates[0]||'', to=dates[dates.length-1]||'';
    var span=dates.length>1?Math.max(1,U.daysBetween(from,to)+1):1;
    out.push({kind:kind,title:title,count:arr.length,ids:arr.map(function(c){return c.id;}),from:from,to:to,span:span,severity:sev||'normal'});
  }
  var sorted=list.slice().sort(function(a,b){ return cDiag(a)<cDiag(b)?-1:1; });
  for(var i=0;i<sorted.length;i++){
    var g=[sorted[i]], t=cDiag(sorted[i]);
    for(var j=i+1;j<sorted.length;j++){
      if(U.daysBetween(t,cDiag(sorted[j]))<=win) g.push(sorted[j]); else break;
    }
    if(g.length>=min) push('temporal',T('cl_temporal'),g,'hi');
  }
  function dim(kf,kind,labelFn,labels){
    var m={};
    list.forEach(function(c){ var k=kf(c); if(k==null||k==='') return; (m[k]=(m[k]||[])).push(c); });
    Object.keys(m).forEach(function(k){ if(m[k].length>=min) push(kind,labelFn(k),m[k]); });
  }
  dim(function(c){ return c.or&&c.or.room; },'room',function(k){ return U.nameOf(k,D.rooms,k); });
  dim(function(c){ return c.procedure; },'proc',function(k){ return U.nameOf(k,D.procedures,k); });
  dim(function(c){ var o=orgsOf(c); return o[0]; },'org',function(k){ return U.nameOf(k,D.organisms,k); });
  dim(function(c){ return teamFlat(c).join(','); },'staff',function(k){ return k.split(',').filter(Boolean).map(staffName).join(' + '); });
  var comb={};
  list.forEach(function(c){
    var room=c.or&&c.or.room, proc=c.procedure;
    orgsOf(c).forEach(function(o){
      var k=[room||'',proc||'',o].join('|');
      if(room&&proc&&o) (comb[k]=(comb[k]||[])).push(c);
    });
  });
  Object.keys(comb).forEach(function(k){
    if(comb[k].length>=min){
      var p=k.split('|');
      var parts=[U.nameOf(p[0],D.rooms,p[0]),U.nameOf(p[1],D.procedures,p[1]),U.nameOf(p[2],D.organisms,p[2])];
      push('combo',parts.join(' · '),comb[k],'hi');
    }
  });
  out.sort(function(a,b){ return b.count-a.count||(a.span-b.span)||(a.title<b.title?-1:1); });
  return out;
}

function staffSummary(cases){
  var m={};
  cases.forEach(function(c){
    teamFlat(c).forEach(function(id){
      var s=m[id]||(m[id]={ids:[],rooms:{},procs:{},orgs:{},from:'',to:''});
      if(s.ids.indexOf(c.id)<0) s.ids.push(c.id);
      var r=c.or&&c.or.room; if(r) s.rooms[r]=(s.rooms[r]||0)+1;
      if(c.procedure) s.procs[c.procedure]=(s.procs[c.procedure]||0)+1;
      orgsOf(c).forEach(function(o){ s.orgs[o]=(s.orgs[o]||0)+1; });
      var d=cDiag(c);
      if(d){ if(!s.from||d<s.from) s.from=d; if(!s.to||d>s.to) s.to=d; }
      m[id]=s;
    });
  });
  return m;
}

function compareCases(ids,cases){
  var sel=cases.filter(function(c){ return ids.indexOf(c.id)>=0; });
  var out=[];
  function add(dim,label,fn){
    var m={};
    sel.forEach(function(c){ fn(c).forEach(function(v){ if(v==null||v==='') return; m[v]=(m[v]||0)+1; }); });
    var thr=Math.max(2,Math.ceil(sel.length/2));
    Object.keys(m).forEach(function(k){ if(m[k]>=thr) out.push({dim:dim,label:label,value:k,count:m[k]}); });
  }
  add('room',T('share_room'),function(c){ return [c.or&&c.or.room]; });
  add('proc',T('share_proc'),function(c){ return [c.procedure]; });
  add('org',T('share_org'),function(c){ return orgsOf(c); });
  add('surg',T('share_surg'),function(c){ return ((c.team||{}).surgeons||[]).slice(0,1); });
  add('implant',T('share_implant'),function(c){ return c.implantUsed==='yes'?[T('yes')]:[]; });
  add('proph',T('share_proph'),function(c){ return (c.prophylaxis&&c.prophylaxis.problem&&c.prophylaxis.problem!=='unknown')?[c.prophylaxis.problem]:[]; });
  add('em',T('share_em'),function(c){ return c.emergency==='yes'?[T('yes')]:[]; });
  add('trauma',T('share_trauma'),function(c){ return c.trauma==='yes'?[T('yes')]:[]; });
  out.sort(function(a,b){ return b.count-a.count; });
  return {selected:sel,shared:out};
}

function matchExposure(exposure,cases){
  var ids=[];
  cases.forEach(function(c){
    if(c.status==='draft') return;
    var d=cOp(c);
    if(exposure.from&&d<exposure.from) return;
    if(exposure.to&&d>exposure.to) return;
    var match=false;
    if(exposure.type==='surgeon'||exposure.type==='team'){
      match=teamFlat(c).indexOf(exposure.targetId)>=0;
    } else if(exposure.type==='room'){
      match=!!(c.or&&c.or.room===exposure.targetId);
    } else if(exposure.type==='procedure'){
      match=c.procedure===exposure.targetId;
    } else if(exposure.type==='implant'){
      match=!!(c.implantType&&String(c.implantType).toLowerCase().indexOf(String(exposure.targetId||'').toLowerCase())>=0&&c.implantUsed==='yes');
    }
    if(match) ids.push(c.id);
  });
  return ids;
}

function lgamma(z){
  if(z<0.5) return Math.log(Math.PI/Math.sin(Math.PI*z))-lgamma(1-z);
  z-=1;
  var a=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  var t=z+a.length-1.5;
  var x=a[0];
  for(var i=1;i<a.length;i++) x+=a[i]/(z+i);
  return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(x);
}
function hyperProb(a,b,c,d){
  var n=a+b+c+d;
  var lp=(lgamma(a+b+1)-lgamma(a+1)-lgamma(b+1))
        +(lgamma(c+d+1)-lgamma(c+1)-lgamma(d+1))
        -(lgamma(n+1)-lgamma(a+c+1)-lgamma(b+d+1));
  return Math.exp(lp);
}
function fisherTwoTail(a,b,c,d){
  var p0=hyperProb(a,b,c,d);
  var R1=a+b,R2=c+d,C1=a+c;
  var sum=0;
  var aMin=Math.max(0,C1-R2), aMax=Math.min(R1,C1);
  for(var aa=aMin;aa<=aMax;aa++){
    var bb=R1-aa, cc=C1-aa, dd=R2-cc;
    if(bb<0||cc<0||dd<0) continue;
    var p=hyperProb(aa,bb,cc,dd);
    if(p<=p0*(1+1e-9)) sum+=p;
  }
  return Math.min(1,sum);
}
function erfc(x){
  var t=1/(1+0.3275911*x);
  var y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);
  return y;
}
function statCompare(e1,e2){
  var N1=e1.den||0, N2=e2.den||0;
  var x1=(e1.numerator!=null)?e1.numerator:(e1.auto||0);
  var x2=(e2.numerator!=null)?e2.numerator:(e2.auto||0);
  x1=Math.min(x1,N1); x2=Math.min(x2,N2);
  var a=x1,b=N1-x1,c=x2,d=N2-x2,tot=N1+N2;
  var out={n1:N1,n2:N2,c1:x1,c2:x2,caution:(Math.min(N1,N2)<30)};
  if(!N1||!N2){ out.error='den'; return out; }
  var p1=a/N1, p2=c/N2;
  out.rr=(p2===0?(p1===0?null:Infinity):p1/p2);
  var oa=a,ob=b,oc=c,od=d;
  if(a===0||b===0||c===0||d===0){ oa+=0.5; ob+=0.5; oc+=0.5; od+=0.5; }
  out.or=(oa*od)/(ob*oc);
  if(out.rr!=null&&isFinite(out.rr)&&out.rr>0){
    var wr=Math.log(out.rr);
    var se=Math.sqrt((1/Math.max(1,a))-(1/N1)+(1/Math.max(1,c))-(1/N2));
    if(isFinite(se)){
      out.rrLo=Math.exp(wr-1.96*se); out.rrHi=Math.exp(wr+1.96*se);
    }
  }
  var seo=Math.sqrt(1/oa+1/ob+1/oc+1/od);
  out.orLo=Math.exp(Math.log(out.or)-1.96*seo); out.orHi=Math.exp(Math.log(out.or)+1.96*seo);
  var E11=(N1*(a+c))/tot, E12=(N1*(b+d))/tot, E21=(N2*(a+c))/tot, E22=(N2*(b+d))/tot;
  var minExp=Math.min(E11,E12,E21,E22);
  if(minExp<5||Math.min(N1,N2)<10){
    out.method='fisher';
    out.p=fisherTwoTail(a,b,c,d);
  } else {
    var chi=(Math.pow(Math.abs(a*d-b*c)-tot/2,2)*tot)/((a+b)*(c+d)*(a+c)*(b+d));
    out.method='chi';
    out.chi=chi;
    out.p=erfc(Math.sqrt(chi/2));
  }
  out.caution=out.caution||minExp<5;
  return out;
}

App.A={
  cDiag:cDiag, cOp:cOp, teamFlat:teamFlat, orgsOf:orgsOf, riskOf:riskOf,
  stats:stats, topOrganisms:topOrganisms, topProcedures:topProcedures,
  topRooms:topRooms, topPrimarySurgeons:topPrimarySurgeons,
  filter:filter, trends:trends, combos:combos,
  clustersOf:clustersOf, staffSummary:staffSummary, compareCases:compareCases,
  matchExposure:matchExposure, statCompare:statCompare
};
})();