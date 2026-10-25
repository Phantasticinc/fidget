const V = 'fidget-v3';
const ASSETS = ['./', 'index.html', 'styles.css?v=1', 'manifest.json', 'privacy.html', 'js/main.js?v=3', 'js/feel.js?v=2', 'js/crave.js?v=1', 'js/render.js?v=1',
  'js/toys/pop.js?v=1', 'js/toys/spin.js?v=1', 'js/toys/click.js?v=1', 'js/toys/sand.js?v=2', 'js/toys/sandgrid.js?v=1', 'js/toys/sandrender.js?v=1', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cl = r.clone(); caches.open(V).then(c => c.put(e.request, cl)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: false }).then(r => r || caches.match('index.html'))));
});
