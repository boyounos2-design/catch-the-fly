/* ============================================================================
   CATCH THE FLY — Firebase Firestore sync layer
   - Optional: if js/firebase-config.js is filled in, every device mirrors its
     IndexedDB into one shared Firestore collection ("ctf"), both directions.
   - Entities are stored as documents:  {store}:{entityId}
   - Merge strategy: last write wins by entity "updatedAt" (epoch ms).
   - Local writes are queued (localStorage) and pushed with retry; remote
     changes are streamed in real time via onSnapshot listeners.
   ========================================================================== */
(function(){
'use strict';

var enabled=false, ready=false, applyingRemote=false;
var fb=null, fbs=null, col=null;
var queue=[];
var PUSH_KEY='ctf_pushqueue';
var pendingPackets=0;

function cfgRead(){ try{ return window.FIREBASE_CONFIG||{}; }catch(e){ return {}; } }
function cfgOk(c){ return !!(c && c.apiKey && c.projectId); }
function sdkReady(){ try{ return !!(window.firebase && window.firebase.firestore); }catch(e){ return false; } }

function docKey(store,id){ return store+':'+String(id); }
function splitKey(k){ var i=k.indexOf(':'); if(i<=0) return null; return {store:k.slice(0,i),id:k.slice(i+1)}; }
function deepClone(v){
  if(v===null||typeof v!=='object') return v;
  try{ return JSON.parse(JSON.stringify(v)); }catch(e){ return v; }
}
function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
function lsGet(k){ try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ return null; } }

function status(s){ App.Sync.status=s; if(App.Sync.onStatus) { try{ App.Sync.onStatus(s); }catch(e){} } }

/* ---------------------------------------------------------------- init --- */
function ensureSDK(){
  return new Promise(function(res){
    if(sdkReady()) return res(true);
    var tries=0;
    var iv=setInterval(function(){
      tries++;
      if(sdkReady()||tries>8){ clearInterval(iv); res(sdkReady()); }
    },125);
  });
}

function checkEnabled(){
  var c=cfgRead();
  if(!cfgOk(c)) return false;
  if(!sdkReady()) return false;
  try{
    fb=window.firebase.apps.length?window.firebase.app():window.firebase.initializeApp(c);
    fbs=fb.firestore();
    col=fbs.collection('ctf');
    enabled=true;
    return true;
  }catch(e){ console.error('Firebase init:',e); return false; }
}

/* ---------------------------------------------------------------- queue -- */
function saveQueue(){ lsSet(PUSH_KEY,queue.slice(-500)); }
function loadQueue(){ var q=lsGet(PUSH_KEY); queue=Array.isArray(q)?q:[]; }

function enqueue(op){
  if(!enabled||applyingRemote) return;
  queue.push(op);
  saveQueue();
  flush();
}

function flush(){
  if(!enabled||applyingRemote||!col||!queue.length) return;
  var batch=queue.slice(); queue=[]; saveQueue();
  batch.forEach(function(op){
    var p=op.type==='del'
      ? col.doc(docKey(op.store,op.id)).delete()
      : col.doc(docKey(op.store,op.id)).set(op.val);
    p.then(function(){ flush(); }).catch(function(err){ queue.push(op); saveQueue(); });
  });
}

/* ------------------------------------------------------------- generate -- */
function nextCaseIdRemote(){
  var ref=col.doc('meta:seq');
  return fbs.runTransaction(function(tx){
    return tx.get(ref).then(function(snap){
      var y=new Date().getFullYear();
      var cur=(snap.exists&&snap.data().year===y)?snap.data().n:0;
      var n=cur+1;
      tx.set(ref,{year:y,n:n});
      return {y:y,n:n};
    });
  }).then(function(r){ return 'CTF-'+r.y+'-'+('0000'+r.n).slice(-4); });
}
function nextCaseIdLocal(){
  return App.DB.get('settings','seq').then(function(s){
    var n=(s&&s.n)||0; n++;
    var y=new Date().getFullYear();
    var id='CTF-'+y+'-'+('0000'+n).slice(-4);
    return App.DB.put('settings',{id:'seq',n:n}).then(function(){ return id; });
  });
}

/* -------------------------------------------------------------- wrap DB -- */
function wrapDB(){
  var db=App.DB;
  if(db.__syncWrapped) return;
  db.__syncWrapped=true;
  var origPut=db.put, origPutMany=db.putMany, origDel=db.del, origClear=db.clear;

  db.put=function(name,val){
    if(!applyingRemote && val && typeof val==='object'){ val.updatedAt=Date.now(); }
    var res=origPut(name,val);
    if(!applyingRemote&&enabled&&!(name==='settings'&&(val&&val.id)==='seq')){
      enqueue({type:'set',store:name,id:String(val&&val.id),val:deepClone(val)});
    }
    return res;
  };

  db.putMany=function(name,rows){
    (rows||[]).forEach(function(r){
      if(!applyingRemote&&r&&typeof r==='object'){ r.updatedAt=Date.now(); }
      if(!applyingRemote&&enabled&&!(name==='settings'&&r.id==='seq')){
        enqueue({type:'set',store:name,id:String(r&&r.id),val:deepClone(r)});
      }
    });
    return origPutMany(name,rows);
  };

  db.del=function(name,id){
    if(!applyingRemote&&enabled){ enqueue({type:'del',store:name,id:String(id)}); }
    return origDel(name,id);
  };

  db.clear=function(name){
    var res=origClear(name);
    if(!applyingRemote&&enabled){ clearRemote(name); }
    return res;
  };
}

function clearRemote(store){
  if(!col) return Promise.resolve();
  return col.get().then(function(snap){
    var dels=snap.docs.filter(function(ds){ return splitKey(ds.id)&&splitKey(ds.id).store===store; })
      .map(function(ds){ return col.doc(ds.id).delete(); });
    return Promise.all(dels);
  }).catch(function(e){ console.error('clearRemote',store,e); });
}

/* ---------------------------------------------------------- pull (merge) -- */
function applyRemoteRow(store,r){
  return App.DB.get(store,String(r.id)).then(function(loc){
    var rv=r.updatedAt||0, lv=(loc&&loc.updatedAt)||0;
    if(!loc||rv>=lv){
      applyingRemote=true;
      return App.DB.put(store,diffUse(r,loc)).then(function(){ applyingRemote=false; },
        function(e){ applyingRemote=false; throw e; });
    }
    return null;
  });
}
/* merge keeps local-only fields (older local version may hold extra props) */
function diffUse(r,loc){
  var out=deepClone(r);
  if(loc&&typeof loc==='object'){
    Object.keys(loc).forEach(function(k){ if(out[k]===undefined) out[k]=deepClone(loc[k]); });
  }
  return out;
}

function pull(){
  if(!col) return Promise.resolve();
  status('connecting');
  return col.get().then(function(snap){
    var groups={};
    snap.docs.forEach(function(ds){
      var k=splitKey(ds.id);
      if(!k||k.store==='meta') return;
      if(k.store==='settings'&&k.id==='seq') return;
      (groups[k.store]=groups[k.store]||[]).push(ds.data());
    });
    var jobs=[];
    App.DB.STORES.forEach(function(s){
      var rows=groups[s]||[];
      rows.forEach(function(r){ if(r.id!==undefined) r.id=String(r.id); });
      jobs.push(Promise.all(rows.map(function(r){ return applyRemoteRow(s,r); })));
    });
    return Promise.all(jobs);
  }).then(function(){ ready=true; return true; });
}

/* ------------------------------------------------------------- listen ---- */
function listen(){
  if(!col) return;
  var timer=null;
  col.onSnapshot(function(snap){
    var toDel=[], toApply=[];
    snap.docChanges().forEach(function(ch){
      var k=splitKey(ch.doc.id);
      if(!k||k.store==='meta') return;
      if(k.store==='settings'&&k.id==='seq') return;
      if(ch.type==='removed'){ toDel.push(k); return; }
      toApply.push({id:ch.doc.id,k:k,data:ch.doc.data()});
    });
    var jobs=toDel.map(function(k){ applyingRemote=true; return App.DB.del(k.store,k.id).then(function(){ applyingRemote=false; },function(e){ applyingRemote=false; throw e; }); });
    jobs=jobs.concat(toApply.map(function(t){
      applyingRemote=true;
      return applyRemoteRow(t.k.store,t.data).then(function(){ applyingRemote=false; },function(e){ applyingRemote=false; throw e; });
    }));
    Promise.all(jobs).then(function(){
      if(!timer){ timer=setTimeout(function(){ timer=null; if(App.Sync.onRemoteChange){ App.Sync.onRemoteChange(); } },400); }
    }).catch(function(e){ console.error('sync apply',e); });
  },function(e){
    console.error('sync listener',e);
    status('error');
  });
}

/* -------------------------------------------------------------- public --- */
function installCaseIds(){
  App.DB.nextCaseId=function(){
    if(!enabled||!fbs||!navigator.onLine) return nextCaseIdLocal();
    return nextCaseIdRemote().catch(function(){ return nextCaseIdLocal(); });
  };
}

function init(){
  return ensureSDK().then(function(ok){
    if(!ok){ status('disabled'); return null; }
    if(!checkEnabled()){ status('disabled'); return null; }
    installCaseIds();
    loadQueue();
    return pull().then(function(){
      listen();
      status('online');
      flush();
      return true;
    }).catch(function(e){
      console.error('sync init',e);
      status('error');
      return null;
    });
  });
}

function pushAll(){
  if(!enabled) return Promise.resolve();
  var jobs=App.DB.STORES.map(function(s){
    return App.DB.all(s).then(function(rows){
      rows.forEach(function(r){
        if(s==='settings'&&r.id==='seq') return;
        if(r.updatedAt===undefined&&typeof r==='object'){ r.updatedAt=Date.now(); }
        enqueue({type:'set',store:s,id:String(r.id),val:deepClone(r)});
      });
    });
  });
  return Promise.all(jobs).then(function(){ flush(); });
}

App.Sync={
  enabled:function(){ return enabled; },
  ready:function(){ return ready; },
  status:'disabled',
  init:init,
  wrap:wrapDB,
  pull:function(){ return pull().then(function(){ if(App.Sync.onRemoteChange){ App.Sync.onRemoteChange(); } }); },
  pushAll:pushAll,
  flush:flush,
  pending:function(){ return queue.length; }
};
})();