const V = 'fidget-v48';
const ASSETS = ['./', 'index.html', 'styles.css?v=11', 'manifest.json', 'privacy.html', 'js/safestore.js?v=1', 'js/main.js?v=28', 'js/feel.js?v=6', 'js/crave.js?v=4', 'js/render.js?v=1',
  'js/toys/pop.js?v=4', 'js/toys/spin.js?v=5', 'js/toys/click.js?v=5', 'js/toys/sand.js?v=6', 'js/toys/sandgrid.js?v=3', 'js/toys/sandrender.js?v=2', 'js/toys/sandgoo.js?v=2',
  'js/bus.js', 'js/look.js', 'js/fx/particles.js?v=5', 'js/fx/premium.js', 'js/fx/manager.js?v=10', 'js/fx/skins/kit.js?v=6', 'js/fx/skins/pop.js', 'js/fx/skins/spin.js', 'js/fx/skins/click.js', 'js/fx/skins/sand.js', 'js/fx/skins/sig.js?v=6', 'js/fx/world.js?v=3', 'js/fx/worlds/env.js?v=1', 'js/fx/worlds/pop.js?v=3', 'js/fx/worlds/spin.js?v=2', 'js/fx/worlds/click.js?v=2', 'js/fx/worlds/sand.js?v=3', 'js/fx/worlds/premium.js?v=1', 'js/fx/worlds/blackhole.js?v=2', 'js/fx/worlds/gold.js?v=3',
  'js/store/catalog.js', 'js/store/ent.js?v=9', 'js/store/billing.js?v=5', 'js/lb/stats.js', 'js/lb/nick.js', 'js/lb/config.js', 'js/lb/adapter.js?v=3', 'js/lb/rules.js', 'js/ui/shop.js?v=14', 'js/store/redeem.js?v=3', 'js/ui/board.js?v=4', 'js/ui/celebrate.js?v=5', 'js/lb/msg.js', 'js/lb/record.js?v=2', 'js/ui/sharegift.js?v=5', 'js/ui/back.js?v=5',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.allSettled(ASSETS.map(a => c.add(new Request(a, { cache: 'reload' })))))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
let stalled = false; // set once the network stalls, so the rest of the module waterfall doesn't wait 4s per level
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return; // never cache leaderboard/billing calls
  // cache:'no-cache' revalidates with the server, so GitHub Pages' 10-minute HTTP cache can never serve an old build
  const net = fetch(e.request, { cache: 'no-cache' }).then(r => { stalled = false; if (r.ok) { const cl = r.clone(); caches.open(V).then(c => c.put(e.request, cl)); } return r; });
  const cached = () => caches.match(e.request).then(r => r || (e.request.mode === 'navigate' ? caches.match('index.html') : undefined));
  // lie-fi: if the network stalls >4s and we have a cached copy, serve it (the fetch still refreshes the cache in the background)
  const slow = new Promise(res => setTimeout(res, stalled ? 0 : 4000)).then(cached).then(r => { if (r) { stalled = true; return r; } return net; });
  e.waitUntil(net.catch(() => {})); slow.catch(() => {});
  e.respondWith(Promise.race([net, slow]).catch(() => cached().then(r => r || Response.error())));
});
