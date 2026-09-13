(function(){
'use strict';
var DB=null;
var DB_NAME='ortho-inf-surv';
var DB_VER=1;
var STORES=['settings','staff','rooms','procedures','organisms','antibiotics','infectionTypes','cases','exposures'];

function open(){
  return new Promise(function(res,rej){
    if(DB) return res(DB);
    var rq=indexedDB.open(DB_NAME,DB_VER);
    rq.onupgradeneeded=function(){
      var db=rq.result;
      STORES.forEach(function(s){
        if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:'id'});
      });
    };
    rq.onsuccess=function(){ DB=rq.result; res(DB); };
    rq.onerror=function(){ rej(rq.error); };
    rq.onblocked=function(){ rej(new Error('blocked')); };
  });
}
function store(name,mode){
  return DB.transaction(name,mode).objectStore(name);
}
function all(name){
  return open().then(function(){
    return new Promise(function(res,rej){
      var r=store(name,'readonly').getAll();
      r.onsuccess=function(){ res(r.result||[]); };
      r.onerror=function(){ rej(r.error); };
    });
  });
}
function get(name,id){
  return open().then(function(){
    return new Promise(function(res,rej){
      var r=store(name,'readonly').get(String(id));
      r.onsuccess=function(){ res(r.result); };
      r.onerror=function(){ rej(r.error); };
    });
  });
}
function put(name,val){
  return open().then(function(){
    return new Promise(function(res,rej){
      var r=store(name,'readwrite').put(val);
      r.onsuccess=function(){ res(val); };
      r.onerror=function(){ rej(r.error); };
    });
  });
}
function del(name,id){
  return open().then(function(){
    return new Promise(function(res,rej){
      var t=store(name,'readwrite');
      var r=t.delete(String(id));
      r.onsuccess=function(){ res(); };
      r.onerror=function(){ rej(r.error); };
    });
  });
}
function clear(name){
  return open().then(function(){
    return new Promise(function(res,rej){
      var t=store(name,'readwrite');
      var r=t.clear();
      r.onsuccess=function(){ res(); };
      r.onerror=function(){ rej(r.error); };
    });
  });
}
function count(name){
  return open().then(function(){
    return new Promise(function(res,rej){
      var r=store(name,'readonly').count();
      r.onsuccess=function(){ res(r.result||0); };
      r.onerror=function(){ rej(r.error); };
    });
  });
}
function putMany(name,rows){
  return open().then(function(){
    return new Promise(function(res,rej){
      var t=store(name,'readwrite');
      rows.forEach(function(row){ t.put(row); });
      t.oncomplete=function(){ res(rows); };
      t.onerror=function(){ rej(t.error); };
    });
  });
}

var CONFIG_DEFAULTS={ id:'config', lang:'ar', hospital:'', clusterMin:3, clusterWindow:45, officerName:'', seedLoaded:false };
function loadConfig(){
  return get('settings','config').then(function(c){
    var cfg=Object.assign({},CONFIG_DEFAULTS,c||{});
    cfg.id='config';
    return put('settings',cfg).then(function(){ return cfg; });
  });
}
var _seqCached=null;
function nextCaseId(){
  return get('settings','seq').then(function(s){
    var n=(s&&s.n)||0; n++;
    var y=new Date().getFullYear();
    var id='CTF-'+y+'-'+('0000'+n).slice(-4);
    return put('settings',{id:'seq',n:n}).then(function(){ return id; });
  });
}

var DATA={cached:false,staff:[],rooms:[],procedures:[],organisms:[],antibiotics:[],infectionTypes:[]};
function loadData(force){
  if(DATA.cached&&!force) return Promise.resolve(DATA);
  return Promise.all([
    all('staff'),all('rooms'),all('procedures'),all('organisms'),all('antibiotics'),all('infectionTypes')
  ]).then(function(r){
    DATA.staff=r[0]; DATA.rooms=r[1]; DATA.procedures=r[2]; DATA.organisms=r[3]; DATA.antibiotics=r[4]; DATA.infectionTypes=r[5];
    DATA.cached=true;
    return DATA;
  });
}
function activeDict(arr){ return arr.filter(function(x){ return !x.inactive; }); }
function optList(arr){ return arr.map(function(x){ return {id:x.id,name:x.name,label:x.name}; }); }

App.DB={
  open:open, all:all, get:get, put:put, del:del, clear:clear, count:count, putMany:putMany,
  STORES:STORES,
  loadConfig:loadConfig,
  nextCaseId:nextCaseId,
  loadData:loadData,
  activeDict:activeDict,
  optList:optList,
  DATA:DATA
};
})();