import './safestore.js?v=1';
import { opts, unlock, setVol } from './feel.js?v=6';
import { initCrave } from './crave.js?v=4';
import * as fx from './fx/manager.js?v=10';
import { THEMES } from './fx/premium.js';
import * as ent from './store/ent.js?v=9';
import * as bill from './store/billing.js?v=5';
import * as stats from './lb/stats.js';
import * as shop from './ui/shop.js?v=14';
import * as gift from './ui/sharegift.js?v=5';
import * as redeem from './store/redeem.js?v=3';
import * as board from './ui/board.js?v=4';
import * as record from './lb/record.js?v=2';
import * as celeb from './ui/celebrate.js?v=5';
import * as back from './ui/back.js?v=5';

const cv = document.getElementById('stage');
const g = cv.getContext('2d', { alpha: false, desynchronized: true });
const hud = document.getElementById('hud');
let W = 0, H = 0, DPR = 1, toy = null, toyName = '', bg = null;
const cache = {};
const loaders = {
  pop: () => import('./toys/pop.js?v=4'), spin: () => import('./toys/spin.js?v=5'),
  click: () => import('./toys/click.js?v=5'), sand: () => import('./toys/sand.js?v=6'),
};

function paintBg() {
  bg = document.createElement('canvas'); bg.width = W * DPR; bg.height = H * DPR;
  const b = bg.getContext('2d'); b.scale(DPR, DPR);
  const calm = opts.calm, th = (ent.premium() && THEMES.find(t => t.id === opts.theme)) || THEMES[0];
  const lg = b.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, calm ? '#121614' : th.top); lg.addColorStop(1, calm ? '#0a0c0b' : th.bot);
  b.fillStyle = lg; b.fillRect(0, 0, W, H);
  const rg = b.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.max(W, H) * 0.7);
  rg.addColorStop(0, calm ? 'rgba(150,180,160,.07)' : th.glow); rg.addColorStop(1, 'rgba(0,0,0,0)');
  b.fillStyle = rg; b.fillRect(0, 0, W, H);
  // film grain to kill gradient banding
  const id = b.getImageData(0, 0, bg.width, bg.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 5; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  b.putImageData(id, 0, 0);
}
// adaptive resolution: if frames stay slow, drop backing-store DPR (2 -> 1.5 -> 1). Persisted per device.
let dprCap = (() => { try { return +localStorage.getItem('fidget.dprCap') || 2; } catch (_) { return 2; } })(), slowT = 0, sampleT = 0;
function perf(dt) {
  if (dt > 0.5 || document.hidden || DPR <= 1) return;
  sampleT += dt; if (dt > 1 / 40) slowT += dt;
  if (sampleT >= 3) { if (slowT / sampleT > 0.6) { dprCap = DPR > 1.5 ? 1.5 : 1; try { localStorage.setItem('fidget.dprCap', dprCap); } catch (_) {} resize(); } sampleT = slowT = 0; }
}
function resize() {
  DPR = Math.min(dprCap, 2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); paintBg();
  toy && toy.resize(W, H);
}
addEventListener('resize', resize);

async function select(name) {
  if (name === toyName) return; const prev = toyName; toyName = name;
  document.querySelectorAll('#dock button').forEach(b => { b.classList.toggle('on', b.dataset.toy === name); b.setAttribute('aria-pressed', b.dataset.toy === name); });
  toy && toy.leave && toy.leave(); fx.clear();
  if (!cache[name]) {
    try { const m = await loaders[name](); cache[name] = m.create(); cache[name].resize(W, H); }
    catch (e) {  // flaky network on first open: don't get stuck on a toy that never loaded; let a re-tap retry
      console.warn('toy load failed', name, e);
      if (toyName === name) { toyName = ''; if (toy && prev) { toyName = prev; toy.enter && toy.enter(); } document.querySelectorAll('#dock button').forEach(b => { b.classList.toggle('on', b.dataset.toy === toyName); b.setAttribute('aria-pressed', b.dataset.toy === toyName); }); }
      return;
    }
  }
  if (toyName !== name) return;
  toy = cache[name]; fx.setToy(name); toy.resize(W, H); toy.enter && toy.enter(); localStorage.setItem('fidget.toy', name);
}
document.getElementById('dock').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { unlock(); select(b.dataset.toy); } });

// pointer input -> toy (multi-touch, coalesced for sub-frame precision)
const P = new Map();
cv.addEventListener('pointerdown', e => { unlock(); try { cv.setPointerCapture(e.pointerId); } catch (_) {} P.set(e.pointerId, 1); fx.ptr(e.clientX, e.clientY, 1); toy && toy.down(e.pointerId, e.clientX, e.clientY, e.pressure); e.preventDefault(); });
cv.addEventListener('pointermove', e => {
  if (!P.has(e.pointerId) || !toy) return;
  const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  fx.ptr(e.clientX, e.clientY, 1);
  for (const c of (list.length ? list : [e])) toy.move(e.pointerId, c.clientX, c.clientY, c.pressure, c.timeStamp || e.timeStamp);
});
const end = e => { if (!P.delete(e.pointerId)) return; if (!P.size) fx.ptr(e.clientX, e.clientY, 0); toy && toy.up(e.pointerId, e.clientX, e.clientY, e.timeStamp); };
cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end); cv.addEventListener('lostpointercapture', end);
// no browser gestures on the stage: no pinch-zoom, double-tap zoom, iOS gesture events or scroll stealing a second finger
for (const t of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(t, e => e.preventDefault(), { passive: false });
cv.addEventListener('touchstart', e => e.preventDefault(), { passive: false }); cv.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
cv.addEventListener('contextmenu', e => e.preventDefault());

// fixed-step physics (120 Hz), render at display rate
const STEP = 1 / 120; let shk = null, acc = 0, last = performance.now(), hudTxt = '';
function frame(now) {
  requestAnimationFrame(frame);  // schedule first: one bad frame must never freeze the app
  try {
  let dt = (now - last) / 1000; last = now; perf(dt); if (dt > 0.1) dt = 0.1; acc += dt;
  if (toy) { while (acc >= STEP) { toy.step(STEP); acc -= STEP; } }
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(bg, 0, 0);
  g.setTransform(DPR, 0, 0, DPR, shk ? shk[0] * DPR : 0, shk ? shk[1] * DPR : 0);
  if (toy) { fx.back(g, dt, W, H); toy.draw(g, W, H); shk = fx.frame(g, dt, opts.calm, W, H); const t = toy.hud ? toy.hud() : ''; if (t !== hudTxt) { hud.textContent = hudTxt = t; } }
  } catch (e) { acc = 0; if (!frame.warned) { frame.warned = 1; console.warn('frame error', e); } }
}

// settings
const $ = id => document.getElementById(id);
export const VERSION = '1.2.6', BUILD = 12;
$('ver').textContent = `Version ${VERSION} (build ${BUILD})` + (ent.isDev ? ' · tester unlock ON — open ?devlock to turn off' : '');
const saved = (() => { try { return JSON.parse(localStorage.getItem('fidget.opts') || '{}'); } catch (_) { return JSON.parse('{}'); } })(); Object.assign(opts, saved);
$('optSound').checked = opts.sound; $('optHaptic').checked = opts.haptic; $('optCalm').checked = opts.calm; $('optVol').value = opts.vol;
document.body.classList.toggle('calm', opts.calm);
const save = () => localStorage.setItem('fidget.opts', JSON.stringify(opts));
$('optSound').onchange = e => { opts.sound = e.target.checked; save(); };
$('optHaptic').onchange = e => { opts.haptic = e.target.checked; save(); };
$('optCalm').onchange = e => { opts.calm = e.target.checked; document.body.classList.toggle('calm', opts.calm); paintBg(); toy && toy.resize(W, H); save(); };
$('optShake').checked = opts.shake !== false; fx.setShake(opts.shake !== false);
$('optShake').onchange = e => { opts.shake = e.target.checked; fx.setShake(opts.shake); save(); };
function themeChips() { const T = $('themes'); T.innerHTML = ''; for (const t of THEMES) { const b = document.createElement('button'); b.className = 'chip' + ((opts.theme || 'default') === t.id ? ' on' : ''); b.setAttribute('aria-pressed', (opts.theme || 'default') === t.id); b.dataset.th = t.id; b.textContent = t.name; b.onclick = () => { opts.theme = t.id; save(); paintBg(); themeChips(); const f = T.querySelector(`[data-th="${t.id}"]`); if (f) f.focus(); }; T.appendChild(b); } }
themeChips();
const premUI = () => { document.body.classList.toggle('premium', ent.premium()); paintBg(); };
ent.onChange(premUI);
document.body.classList.toggle('premium', ent.premium());
fx.init(t => { const c = cache[t]; if (c && W) c.resize(W, H); });
back.init(); stats.init(); record.init(); celeb.init(); shop.init(); board.init(); redeem.init(); gift.init({ select, refresh: () => { if (!document.getElementById('shop').hidden) shop.open(); } }); bill.init().catch(() => {});
$('optVol').oninput = e => { setVol(+e.target.value); save(); };
$('redeemSet').onclick = () => redeem.ask();
$('setBtn').onclick = () => $('sheet').hidden = false;
$('sheetClose').onclick = () => $('sheet').hidden = true;
$('sheet').onclick = e => { if (e.target.id === 'sheet') $('sheet').hidden = true; };

initCrave();
resize();
const q = new URLSearchParams(location.search).get('toy');
select(loaders[q] ? q : (loaders[localStorage.getItem('fidget.toy')] ? localStorage.getItem('fidget.toy') : 'pop'));
requestAnimationFrame(frame);
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {});
window.__fidget = { select, fx, shop, record, celeb, gift, get toy() { return toy; } };
