/* Comix Stash service worker.
   Strategy: NETWORK-FIRST for everything.
   We always try the live server first so you never get stuck on an old version
   (this app has been bitten by stale caches before). The cache is only used as
   a fallback when you're fully offline. */
const CACHE = "comix-stash-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // Only handle same-origin GETs; let Firebase/CDN requests pass through untouched.
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
