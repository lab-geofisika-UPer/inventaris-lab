// Cache aplikasi supaya tetap bisa dibuka tanpa sinyal di lab/lapangan.
// Ambil dari jaringan dulu (selalu versi terbaru bila online), cache hanya cadangan saat offline.
const C='inventaris-lab-v1';
const F=['./','index.html','qrcode.min.js','fotoscan.js','logo.png','manifest.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c))}return r})
  .catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
