const V = 'fidget-v6';
const ASSETS = ['./', 'index.html', 'styles.css?v=3', 'manifest.json', 'privacy.html', 'js/main.js?v=6', 'js/feel.js?v=4', 'js/crave.js?v=2', 'js/render.js?v=1',
  'js/toys/pop.js?v=3', 'js/toys/spin.js?v=4', 'js/toys/click.js?v=4', 'js/toys/sand.js?v=4', 'js/toys/sandgrid.js?v=3', 'js/toys/sandrender.js?v=2', 'js/toys/sandgoo.js?v=1',
  'js/bus.js', 'js/look.js', 'js/fx/particles.js?v=5', 'js/fx/premium.js', 'js/fx/manager.js?v=5', 'js/fx/skins/kit.js?v=5', 'js/fx/skins/pop.js', 'js/fx/skins/spin.js', 'js/fx/skins/click.js', 'js/fx/skins/sand.js', 'js/fx/skins/sig.js?v=5',
  'js/store/catalog.js', 'js/store/ent.js?v=5', 'js/store/billing.js', 'js/lb/stats.js', 'js/lb/nick.js', 'js/lb/config.js', 'js/lb/adapter.js', 'js/ui/shop.js?v=5', 'js/ui/board.js',
  'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.allSettled(ASSETS.map(a => c.add(new Request(a, { cache: 'reload' })))))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return; // never cache leaderboard/billing calls
  // cache:'no-cache' revalidates with the server, so GitHub Pages' 10-minute HTTP cache can never serve an old build
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) { const cl = r.clone(); caches.open(V).then(c => c.put(e.request, cl)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: false }).then(r => r || caches.match('index.html'))));
});
