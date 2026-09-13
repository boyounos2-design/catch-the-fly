var CACHE_NAME='ortho-inf-surv-v8';
var ASSETS=[
  './',
  './index.html',
  './css/style.css',
  './js/i18n.js',
  './js/core.js',
  './js/db.js',
  './js/sync.js',
  './js/analytics.js',
  './js/export.js',
  './js/seed.js',
  './js/views.js',
  './js/main.js',
  './js/firebase-config.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k!==CACHE_NAME; })
          .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch',function(e){
  var url;
  try{ url=new URL(e.request.url); }catch(err){ return; }
  if(e.request.method!=='GET') return;
  if(url.origin!==self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(function(res){
      if(res && res.status===200 && res.type==='basic'){
        var clone=res.clone();
        caches.open(CACHE_NAME).then(function(c){ c.put(e.request,clone); });
      }
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(hit){
        return hit || caches.match('./index.html');
      });
    })
  );
});