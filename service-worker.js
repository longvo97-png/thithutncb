/* All paths are relative to the deployed GitHub Pages repository subdirectory. */
const CACHE_NAME='russian-practice-v1';
const URLS=['./','./index.html','./assets/app.js','./assets/styles.css','./assets/icon.svg','./assets/icon-180.png','./assets/icon-192.png','./assets/icon-512.png','./data/exams.json','./manifest.webmanifest'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(URLS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
   const cache=await caches.open(CACHE_NAME);
   try {
     const response=await fetch(event.request);
     if(response.ok && new URL(event.request.url).pathname.endsWith('/data/exams.json'))await cache.put(event.request,response.clone());
     return response;
   }catch{
     return (await cache.match(event.request))|| (event.request.mode==='navigate'?await cache.match('./index.html'):Response.error());
   }
 })());
});
