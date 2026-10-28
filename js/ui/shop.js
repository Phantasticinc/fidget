// Shop sheet: Premium card + per-toy upgrades with live animated previews. Honest pricing, no timers, no randomised rewards.
import { CATALOG, PREMIUM, byId } from '../store/catalog.js';
import { CATALOG_V2, V2_PRODUCTS } from '../store/catalog2.js?v=1';
import * as ent from '../store/ent.js?v=9';
import * as bill from '../store/billing.js?v=7';
import * as gift from './sharegift.js?v=10';
import * as redeem from '../store/redeem.js?v=5';
import { SKINS, equip, equippedId, canUse } from '../fx/manager.js?v=11';
const $ = id => document.getElementById(id);
const TOYS = [['pop', 'Pop'], ['spin', 'Spin'], ['click', 'Click'], ['sand', 'Sand']];
let tab = 'pop', raf = 0, previews = [];
export function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = t; $('app').appendChild(d); setTimeout(() => d.remove(), 2600); }
const priceOf = id => bill.price(id) || byId(id).price;
function premPreview(g, w, h, t) {
  for (let i = 0; i < 40; i++) { const p = (t * 0.35 + i / 40) % 1, x = (i * 97 % 100) / 100 * w, y = p * h; g.save(); g.translate(x, y); g.rotate(t * 3 + i); g.fillStyle = `hsl(${i * 37 % 360},90%,65%)`; g.fillRect(-4, -2, 8, 4); g.restore(); }
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h * 0.6); gr.addColorStop(0, `hsla(${t * 60 % 360},100%,70%,.5)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}
function canvasFor(fn) { const c = document.createElement('canvas'); previews.push({ c, fn }); return c; }
function btn(item) {
  const b = document.createElement('button'); b.className = 'buy';
  if (item.premium && !ent.premium()) { b.textContent = 'With Premium'; b.disabled = true; return b; }
  if (canUse(item)) { const on = equippedId(item.toy) === item.id; b.className = 'buy ' + (on ? 'using' : 'eq'); b.textContent = on ? 'Using' : 'Equip'; b.onclick = () => { equip(item.toy, on ? null : item.id); render(); }; return b; }
  b.textContent = priceOf(item.id); b.onclick = () => purchase(item.id); return b;
}
async function purchase(id) {
  if (!bill.available()) { toast('Purchases are available in the Fidget Android app on Google Play'); return; }
  try { await bill.buy(id); toast('Thanks! Unlocked ' + byId(id).title); const p = byId(id); if (p.toy) equip(p.toy, id); render(); }
  catch (e) {
    // e.g. Play says 'item already owned' (bought on another device / promo code): re-sync before reporting failure.
    try { await bill.restore(); } catch (_) {}
    if (ent.has(id)) { toast('Already yours — unlocked ' + byId(id).title); render(); return; }
    if (e && e.name !== 'AbortError') toast('Purchase not completed');
  }
}
function render() {
  const B = $('shopBody'), a = document.activeElement, it0 = a && B.contains(a) && a.closest('.item');
  // Re-rendering replaces every button; remember which one had focus so keyboard / screen-reader users don't get dropped to <body>.
  const fk = !a || !B.contains(a) ? null : a.dataset.tab ? `.tabs [data-tab="${a.dataset.tab}"]` : it0 ? `.item[data-id="${it0.dataset.id}"] button` : a.id ? '#' + a.id : null;
  previews = []; B.innerHTML = '';
  if (!bill.available()) { const n = document.createElement('p'); n.className = 'note'; n.textContent = ent.isDev ? 'Dev unlock active (?devunlock) — testing only, nothing is charged.' : 'Purchases are available in the Fidget Android app on Google Play. Everything you see here can be previewed for free.'; B.appendChild(n); }
  const pc = document.createElement('div'); pc.className = 'prem-card';
  pc.innerHTML = `<h3>Fidget Premium</h3><p>${byId(PREMIUM).desc} One-time purchase — no subscription.</p>`;
  pc.insertBefore(canvasFor(premPreview), pc.lastChild);
  const pb = document.createElement('button'); pb.className = 'buy'; pb.style.width = '100%';
  if (ent.premium()) { pb.textContent = 'Premium unlocked ✓'; pb.disabled = true; } else { pb.textContent = 'Unlock Premium · ' + priceOf(PREMIUM); pb.onclick = () => purchase(PREMIUM); }
  pc.appendChild(pb); B.appendChild(pc);
  B.appendChild(gift.card());
  const tabs = document.createElement('div'); tabs.className = 'tabs';
  for (const [id, nm] of TOYS) { const t = document.createElement('button'); t.textContent = nm; t.className = id === tab ? 'on' : ''; t.dataset.tab = id; t.setAttribute('aria-pressed', id === tab); t.onclick = () => { tab = id; render(); }; tabs.appendChild(t); }
  B.appendChild(tabs);
  const list = document.createElement('div'); list.className = 'items';
  const def = { id: null, toy: tab, name: 'Classic', blurb: 'The original free look.' };
  for (const s of [def, ...SKINS[tab]]) {
    const it = document.createElement('div'); it.className = 'item'; it.dataset.id = s.id || 'classic';
    if (s.preview) it.appendChild(canvasFor(s.preview)); else { const c = document.createElement('canvas'); it.appendChild(c); }
    const m = document.createElement('div'); m.className = 'meta'; m.innerHTML = `<h4></h4><p></p>`; m.firstChild.textContent = s.name; m.lastChild.textContent = s.blurb; it.appendChild(m);
    if (s.id) it.appendChild(btn(s)); else { const b = document.createElement('button'); const on = !equippedId(tab); b.className = 'buy ' + (on ? 'using' : 'eq'); b.textContent = on ? 'Using' : 'Equip'; b.onclick = () => { equip(tab, null); render(); }; it.appendChild(b); }
    list.appendChild(it);
  }
  B.appendChild(list);
  if (V2_PRODUCTS) { const h = document.createElement('h3'); h.textContent = 'New toy upgrades'; h.className = 'v2h'; B.appendChild(h); const l2 = document.createElement('div'); l2.className = 'items';
    for (const p of CATALOG_V2) { const it = document.createElement('div'); it.className = 'item'; it.dataset.id = p.id; const m = document.createElement('div'); m.className = 'meta'; m.innerHTML = '<h4></h4><p></p>'; m.firstChild.textContent = p.title; m.lastChild.textContent = p.desc; it.appendChild(m);
      const b = document.createElement('button'); const own = ent.premium() || ent.has(p.id); b.className = 'buy' + (own ? ' using' : ''); b.textContent = own ? 'Owned ✓' : priceOf(p.id); b.disabled = own; if (!own) b.onclick = () => purchase(p.id); it.appendChild(b); l2.appendChild(it); }
    B.appendChild(l2); }
  const r = document.createElement('button'); r.className = 'pill wide'; r.textContent = 'Restore purchases';
  r.onclick = async () => { if (!bill.available()) return toast('Restore works in the Android app'); try { await bill.restore(); toast('Purchases restored'); } catch (_) { toast('Couldn’t reach Google Play — try again'); } render(); };
  B.appendChild(r);
  const rc = document.createElement('button'); rc.className = 'pill wide'; rc.id = 'redeemShop'; rc.textContent = 'Redeem code';
  rc.onclick = () => redeem.ask(); B.appendChild(rc);
  const f = document.createElement('p'); f.className = 'note'; f.textContent = 'Upgrades are cosmetic and give no advantage on the leaderboard. No ads, no loot boxes.'; B.appendChild(f);
  if (fk) { const f = B.querySelector(fk); if (f) f.focus(); }
  for (const p of previews) { const d = Math.min(2, devicePixelRatio || 1), w = p.c.clientWidth || 96, h = p.c.clientHeight || 72; p.c.width = w * d; p.c.height = h * d; p.w = w; p.h = h; p.d = d; p.g = p.c.getContext('2d'); }
}
function loop(now) {
  const t = now / 1000;
  for (const p of previews) { const g = p.g; g.setTransform(p.d, 0, 0, p.d, 0, 0); g.clearRect(0, 0, p.w, p.h); try { p.fn(g, p.w, p.h, t); } catch (_) {} g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  raf = requestAnimationFrame(loop);
}
export function open(t) { if (t) tab = t; $('shop').hidden = false; render(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
export function close() { $('shop').hidden = true; cancelAnimationFrame(raf); previews = []; }
export function init() {
  $('shopBtn').onclick = () => open(localStorage.getItem('fidget.toy') || 'pop');
  $('shop').onclick = e => { if (e.target.id === 'shop' || e.target.closest('[data-close]')) close(); };
  redeem.onRestored(ok => toast(ok ? (ent.premium() ? 'Premium unlocked — thanks!' : 'Purchases refreshed') : 'Code redeemed on Play? Open the Fidget app to unlock'));
  ent.onChange(() => { if (!$('shop').hidden) render(); });
}
