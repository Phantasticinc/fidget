// "Share Fidget" card: a share (or link copy) earns ONE free upgrade per install, picked with live previews,
// then revealed. Shares can't be verified (the OS share sheet doesn't say what happened) — this is a thank-you, not a contract.
import * as ent from '../store/ent.js?v=9';
import { byId } from '../store/catalog.js';
import { SKINS, equip } from '../fx/manager.js?v=10';
import * as celeb from './celebrate.js?v=6';
const $ = id => document.getElementById(id);
const LINK = 'https://phantasticinc.github.io/fidget/';
const TEXT = 'Fidget — pop, spin, click and squish sand to calm down. Free:';
let select = () => {}, refresh = () => {}, raf = 0, prev = [];
function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = t; $('app').appendChild(d); setTimeout(() => d.remove(), 2600); }
export const canShare = () => !!navigator.share;
async function copy() {
  try { await navigator.clipboard.writeText(`${TEXT} ${LINK}`); return true; }
  catch (_) { const t = document.createElement('textarea'); t.value = `${TEXT} ${LINK}`; document.body.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (_) {} t.remove(); return ok; }
}
// returns true once something was shared or copied
export async function share(canvas) {
  if (navigator.share) {
    const data = { title: 'Fidget', text: TEXT, url: LINK };
    if (canvas) try {
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const f = new File([blob], 'fidget-record.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) data.files = [f];
    } catch (_) {}
    try { await navigator.share(data); return true; } catch (e) { if (e && e.name === 'AbortError') return false; }
  }
  const ok = await copy(); toast(ok ? 'Link copied — paste it anywhere to share' : 'Couldn’t copy. Link: ' + LINK); return ok;
}
async function doShare(canvas) {
  if (!(await share(canvas))) return;
  if (ent.gifted()) return toast('Thanks for sharing!');
  ent.markShared(); refresh(); openPicker();
}
export function card() {
  const c = document.createElement('div'); c.className = 'gift-card'; c.id = 'giftCard';
  const g = ent.gifted();
  if (g) { c.innerHTML = '<h3>Thanks for sharing!</h3><p></p>'; c.querySelector('p').textContent = `Your free upgrade: ${byId(g).title}.`; return c; }
  c.innerHTML = '<h3>Share Fidget with a friend or on your socials</h3><p>Share once and pick <b>one upgrade free</b>, on us. One gift per install.</p>';
  const b = document.createElement('button'); b.className = 'buy'; b.id = 'giftShare'; b.style.width = '100%';
  if (ent.shared()) { b.textContent = 'Pick your free upgrade'; b.onclick = openPicker; }
  else { b.textContent = canShare() ? 'Share Fidget' : 'Copy link to share'; b.onclick = () => doShare(); }
  c.appendChild(b); return c;
}
function sheet() {
  let d = $('gift'); if (d) return d;
  d = document.createElement('div'); d.id = 'gift'; d.className = 'sheet'; d.hidden = true;
  d.innerHTML = '<div class="sh-card tall"><div class="sh-head"><h2>Pick your free upgrade</h2><button class="x" data-close aria-label="Close">✕</button></div><p class="note">Choose one. It’s yours on this device — you can still buy the others.</p><div class="items" id="giftList"></div></div>';
  d.onclick = e => { if (e.target === d || e.target.closest('[data-close]')) closePicker(); };
  $('app').appendChild(d); return d;
}
function loop(now) { const t = now / 1000; for (const p of prev) { const g = p.g; g.setTransform(p.d, 0, 0, p.d, 0, 0); g.clearRect(0, 0, p.w, p.h); try { p.fn(g, p.w, p.h, t); } catch (_) {} g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } raf = requestAnimationFrame(loop); }
function mount(c, fn) { const d = Math.min(2, devicePixelRatio || 1), w = c.clientWidth || 96, h = c.clientHeight || 72; c.width = w * d; c.height = h * d; prev.push({ c, fn, w, h, d, g: c.getContext('2d') }); }
export function openPicker() {
  if (ent.gifted()) return;
  const d = sheet(), L = $('giftList'); L.innerHTML = ''; prev = []; d.hidden = false;
  const items = [];
  for (const toy of ['pop', 'spin', 'click', 'sand']) for (const s of SKINS[toy]) if (!s.premium && !ent.has(s.id)) items.push([toy, s]);
  if (!items.length) { L.innerHTML = '<p class="note">You already own every upgrade — thank you!</p>'; return; }
  for (const [toy, s] of items) {
    const it = document.createElement('div'); it.className = 'item'; it.dataset.id = s.id;
    const c = document.createElement('canvas'); it.appendChild(c);
    const m = document.createElement('div'); m.className = 'meta'; m.innerHTML = '<h4></h4><p></p>'; m.firstChild.textContent = `${toy[0].toUpperCase() + toy.slice(1)}: ${s.name}`; m.lastChild.textContent = s.blurb; it.appendChild(m);
    const b = document.createElement('button'); b.className = 'buy eq'; b.textContent = 'Pick'; b.onclick = () => pick(toy, s); it.appendChild(b);
    L.appendChild(it); if (s.preview) requestAnimationFrame(() => mount(c, s.preview));
  }
  cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function closePicker() { const d = $('gift'); if (d) d.hidden = true; cancelAnimationFrame(raf); prev = []; }
function pick(toy, s) {
  if (!confirm(`Take ${s.name} for ${toy} as your free upgrade? You only get one.`)) return;
  if (!ent.setGift(s.id)) return toast('Gift already used');
  closePicker(); if ($('shop')) $('shop').hidden = true;
  equip(toy, s.id); select(toy); reveal(s); refresh();
}
function reveal(s) {
  let r = $('giftReveal');
  if (!r) { r = document.createElement('div'); r.id = 'giftReveal'; r.setAttribute('role', 'dialog'); r.setAttribute('aria-modal', 'true'); r.setAttribute('aria-label', 'Upgrade unlocked'); r.innerHTML = '<canvas></canvas><div class="gr-k">UNLOCKED</div><div class="gr-n"></div><button class="buy eq">Try it</button>'; $('app').appendChild(r); }
  r.querySelector('.gr-n').textContent = s.name; r.hidden = false; r.classList.remove('go'); void r.offsetWidth; r.classList.add('go');
  const c = r.querySelector('canvas'); prev = []; requestAnimationFrame(() => { mount(c, s.preview || (() => {})); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); });
  const btn = r.querySelector('button'), back = document.activeElement;
  btn.onclick = () => { r.hidden = true; cancelAnimationFrame(raf); prev = []; if (back && back.focus && document.contains(back)) back.focus(); };
  setTimeout(() => btn.focus(), 50);
}
export function init(o = {}) {
  select = o.select || select; refresh = o.refresh || refresh;
  celeb.setShare(({ canvas }) => { const d = $('celeb'); if (d) d.hidden = true; doShare(canvas); });
}
