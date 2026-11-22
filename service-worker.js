/* All paths are relative to the deployed GitHub Pages repository subdirectory. */
const CACHE_NAME='russian-practice-v5';
const URLS=['./','./index.html','./assets/app.js','./assets/grammar.js','./assets/styles.css','./assets/icon.svg','./assets/icon-180.png','./assets/icon-192.png','./assets/icon-512.png','./data/exams.json','./data/converted-questions.json','./data/answer-key.json','./data/answer-key-template.json','./manifest.webmanifest'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(URLS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('russian-practice-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
 const requestURL=new URL(event.request.url);
 if(event.request.method!=='GET'||requestURL.origin!==self.location.origin)return;
 event.respondWith((async()=>{
   const cache=await caches.open(CACHE_NAME);
   try {
     const response=await fetch(event.request);
     if(response.ok && URLS.some(path => new URL(path,self.registration.scope).href === event.request.url)) {
       await cache.put(event.request,response.clone()).catch(() => {});
     }
     return response;
   }catch{
     return (await cache.match(event.request))|| (event.request.mode==='navigate'?await cache.match('./index.html'):Response.error());
   }
 })());
});
