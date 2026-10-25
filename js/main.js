import { opts, unlock, setVol } from './feel.js?v=3';
import { initCrave } from './crave.js?v=2';
import * as fx from './fx/manager.js';
import { THEMES } from './fx/premium.js';
import * as ent from './store/ent.js';
import * as bill from './store/billing.js';
import * as stats from './lb/stats.js';
import * as shop from './ui/shop.js';
import * as board from './ui/board.js';

const cv = document.getElementById('stage');
const g = cv.getContext('2d', { alpha: false, desynchronized: true });
const hud = document.getElementById('hud');
let W = 0, H = 0, DPR = 1, toy = null, toyName = '', bg = null;
const cache = {};
const loaders = {
  pop: () => import('./toys/pop.js?v=3'), spin: () => import('./toys/spin.js?v=3'),
  click: () => import('./toys/click.js?v=3'), sand: () => import('./toys/sand.js?v=3'),
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
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); paintBg();
  toy && toy.resize(W, H);
}
addEventListener('resize', resize);

async function select(name) {
  if (name === toyName) return; toyName = name;
  document.querySelectorAll('#dock button').forEach(b => b.classList.toggle('on', b.dataset.toy === name));
  toy && toy.leave && toy.leave(); fx.clear();
  if (!cache[name]) { const m = await loaders[name](); cache[name] = m.create(); cache[name].resize(W, H); }
  if (toyName !== name) return;
  toy = cache[name]; toy.resize(W, H); toy.enter && toy.enter(); localStorage.setItem('fidget.toy', name);
}
document.getElementById('dock').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { unlock(); select(b.dataset.toy); } });

// pointer input -> toy (multi-touch, coalesced for sub-frame precision)
const P = new Map();
cv.addEventListener('pointerdown', e => { unlock(); try { cv.setPointerCapture(e.pointerId); } catch (_) {} P.set(e.pointerId, 1); toy && toy.down(e.pointerId, e.clientX, e.clientY, e.pressure); e.preventDefault(); });
cv.addEventListener('pointermove', e => {
  if (!P.has(e.pointerId) || !toy) return;
  const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const c of (list.length ? list : [e])) toy.move(e.pointerId, c.clientX, c.clientY, c.pressure);
});
const end = e => { if (!P.delete(e.pointerId)) return; toy && toy.up(e.pointerId, e.clientX, e.clientY); };
cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
cv.addEventListener('contextmenu', e => e.preventDefault());

// fixed-step physics (120 Hz), render at display rate
const STEP = 1 / 120; let shk = null, acc = 0, last = performance.now(), hudTxt = '';
function frame(now) {
  let dt = (now - last) / 1000; last = now; if (dt > 0.1) dt = 0.1; acc += dt;
  if (toy) { while (acc >= STEP) { toy.step(STEP); acc -= STEP; } }
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(bg, 0, 0);
  g.setTransform(DPR, 0, 0, DPR, shk ? shk[0] * DPR : 0, shk ? shk[1] * DPR : 0);
  if (toy) { toy.draw(g, W, H); shk = fx.frame(g, dt, opts.calm); const t = toy.hud ? toy.hud() : ''; if (t !== hudTxt) { hud.textContent = hudTxt = t; } }
  requestAnimationFrame(frame);
}

// settings
const $ = id => document.getElementById(id);
const saved = JSON.parse(localStorage.getItem('fidget.opts') || '{}'); Object.assign(opts, saved);
$('optSound').checked = opts.sound; $('optHaptic').checked = opts.haptic; $('optCalm').checked = opts.calm; $('optVol').value = opts.vol;
document.body.classList.toggle('calm', opts.calm);
const save = () => localStorage.setItem('fidget.opts', JSON.stringify(opts));
$('optSound').onchange = e => { opts.sound = e.target.checked; save(); };
$('optHaptic').onchange = e => { opts.haptic = e.target.checked; save(); };
$('optCalm').onchange = e => { opts.calm = e.target.checked; document.body.classList.toggle('calm', opts.calm); paintBg(); toy && toy.resize(W, H); save(); };
$('optShake').checked = opts.shake !== false; fx.setShake(opts.shake !== false);
$('optShake').onchange = e => { opts.shake = e.target.checked; fx.setShake(opts.shake); save(); };
function themeChips() { const T = $('themes'); T.innerHTML = ''; for (const t of THEMES) { const b = document.createElement('button'); b.className = 'chip' + ((opts.theme || 'default') === t.id ? ' on' : ''); b.textContent = t.name; b.onclick = () => { opts.theme = t.id; save(); paintBg(); themeChips(); }; T.appendChild(b); } }
themeChips();
const premUI = () => { document.body.classList.toggle('premium', ent.premium()); paintBg(); };
ent.onChange(premUI);
document.body.classList.toggle('premium', ent.premium());
fx.init(t => { const c = cache[t]; if (c && W) c.resize(W, H); });
stats.init(); shop.init(); board.init(); bill.init().catch(() => {});
$('optVol').oninput = e => { setVol(+e.target.value); save(); };
$('setBtn').onclick = () => $('sheet').hidden = false;
$('sheetClose').onclick = () => $('sheet').hidden = true;
$('sheet').onclick = e => { if (e.target.id === 'sheet') $('sheet').hidden = true; };

initCrave();
resize();
const q = new URLSearchParams(location.search).get('toy');
select(loaders[q] ? q : (loaders[localStorage.getItem('fidget.toy')] ? localStorage.getItem('fidget.toy') : 'pop'));
requestAnimationFrame(frame);
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.__fidget = { select, fx, shop, get toy() { return toy; } };
