// Offline support: after a storm mobile data is often down, and the 72-hour clock, the rules
// and the report all run in the browser. Network first, so online users always get the current
// rules; the cache only answers when the network does not.
const CACHE = 'fns-v1';
const FILES = ['/', '/styles.css', '/app.js', '/rules.js', '/i18n.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok && FILES.includes(url.pathname)) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(url.pathname, copy));
      }
      return res;
    }).catch(() => caches.match(url.pathname, { ignoreSearch: true }).then((hit) => hit || Response.error())),
  );
});
