// Gentle, user-initiated upsell on the v2 toys: a small chip that previews the rich look for 8 s (once per toy per day),
// then offers the shop. No timers on prices, no nagging: it never opens anything by itself.
import { owns, preview, previewLeft, previewing } from '../toys/kit2.js?v=1';
import * as ent from '../store/ent.js?v=9';
import * as shop from './shop.js?v=21';
const V2 = ['popit', 'slime', 'squish', 'cube', 'switch'], K = 'fidget.pv.';
let el, cur = null, iv = 0;
const today = () => new Date().toISOString().slice(0, 10);
const used = t => { try { return localStorage.getItem(K + t) === today(); } catch (_) { return false; } };
function render() {
  if (!el) return; const t = cur;
  if (!t || !V2.includes(t) || owns(t)) { el.hidden = true; return; }
  el.hidden = false;
  if (previewing(t)) { el.textContent = `✨ Premium look · ${Math.ceil(previewLeft(t))}s`; el.setAttribute('aria-label', 'Previewing the Premium look'); }
  else if (used(t)) { el.textContent = '✨ Get the Premium look'; el.setAttribute('aria-label', 'See Premium in the shop'); }
  else { el.textContent = '✨ Preview Premium look'; el.setAttribute('aria-label', 'Preview the Premium look for 8 seconds'); }
}
export function show(toy) { cur = toy; if (!el) { el = document.createElement('button'); el.id = 'upsell'; el.className = 'upsell'; el.hidden = true; document.getElementById('app').appendChild(el);
  el.onclick = () => { const t = cur; if (!t) return; if (previewing(t)) return; if (used(t)) { shop.open(); return; } try { localStorage.setItem(K + t, today()); } catch (_) {} preview(t, 8000); clearInterval(iv); iv = setInterval(() => { render(); if (!previewing(cur)) clearInterval(iv); }, 250); render(); };
  ent.onChange(render); }
  render(); }
