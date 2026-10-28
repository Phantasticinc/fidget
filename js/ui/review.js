// "Enjoying it?" card, only inside the Play app (TWA). Shown at a calm moment: just after a finished craving timer,
// or after 5+ sessions once you've been idle for a few seconds. Never mid-play, at most once per 30 days, never after "Rate".
import * as ent from '../store/ent.js?v=9';
const K = 'fidget.review', URL = 'https://play.google.com/store/apps/details?id=com.phantasticvanguard.fidget', DAY = 864e5;
const st = () => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (_) { return {}; } };
const save = s => { try { localStorage.setItem(K, JSON.stringify(s)); } catch (_) {} };
let lastTouch = performance.now(), shown = false;
export function eligible(now = Date.now()) { const s = st(); return ent.inPlayApp && !s.rated && (!s.last || now - s.last > 30 * DAY) && !shown; }
export function show() {
  if (!eligible()) return false; shown = true; const s = st(); s.last = Date.now(); save(s);
  const d = document.createElement('div'); d.id = 'review'; d.className = 'review'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Rate Fidget');
  d.innerHTML = '<p><b>Enjoying Fidget?</b><br>A quick rating helps other people find a calm, ad-free fidget app.</p><div><button class="pill" id="rvNo">Not now</button><a class="buy" id="rvYes" target="_blank" rel="noopener"></a></div>';
  d.querySelector('#rvYes').href = URL; d.querySelector('#rvYes').textContent = 'Rate on Play';
  d.querySelector('#rvNo').onclick = () => d.remove();
  d.querySelector('#rvYes').onclick = () => { const s = st(); s.rated = 1; save(s); setTimeout(() => d.remove(), 300); };
  document.getElementById('app').appendChild(d); return true;
}
export function init() {
  const s = st(); s.n = (s.n || 0) + 1; save(s);
  addEventListener('pointerdown', () => { lastTouch = performance.now(); }, true);
  addEventListener('fidget:crave', e => { if (e.detail && e.detail.done) setTimeout(() => { if (performance.now() - lastTouch > 3000) show(); }, 7000); });
  if (s.n >= 5) { const t0 = performance.now(), iv = setInterval(() => { const now = performance.now(); if (shown || now - t0 > 600e3) return clearInterval(iv); if (now - t0 > 90e3 && now - lastTouch > 6000 && document.getElementById('sheet').hidden && document.getElementById('shop').hidden) { clearInterval(iv); show(); } }, 2000); }
}
window.__review = { show, eligible };
