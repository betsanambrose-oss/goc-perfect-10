// Perfect 10: offline cache. Bump VERSION whenever any file changes so tablets pick up the update.
const VERSION = 'goc-p10-v13';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Page itself: network first so a fixed version shows on the next load; cache only when offline.
// Icons and the rest: cache first, refreshed in the background.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const save = res => {
    if (res && res.ok && new URL(e.request.url).origin === location.origin) {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(e.request.mode === 'navigate' ? './index.html' : e.request, copy));
    }
    return res;
  };
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then(save).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      const net = fetch(e.request).then(save).catch(() => hit);
      return hit || net;
    })
  );
});
