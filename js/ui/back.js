// Android back button / back gesture (Play app = TWA): close the open sheet instead of leaving the app.
// While any overlay is open we keep one extra history entry; back pops it and we close the top overlay via its own close control.
const IDS = ['giftReveal', 'celeb', 'gift', 'shop', 'board', 'sheet']; // topmost first
const top = () => IDS.map(id => document.getElementById(id)).find(e => e && !e.hidden);
let pushed = false, lastTop = null, opener = null;
function closeEl(e) {
  const b = e.querySelector('[data-close], #sheetClose, #cbClose') || (e.id === 'giftReveal' && e.querySelector('button'));
  if (b) b.click(); else e.hidden = true;
}
function sync() {
  for (const id of IDS) { const e = document.getElementById(id); if (e && !e.getAttribute('role')) { e.setAttribute('role', 'dialog'); e.setAttribute('aria-modal', 'true'); const h = e.querySelector('h2, h3, [id$="Title"]'); e.setAttribute('aria-label', (h && h.textContent.trim()) || (e.id === 'celeb' ? 'New record' : e.id === 'giftReveal' ? 'Gift unlocked' : 'Dialog')); } }
  const o = top();
  if (o !== lastTop) {  // focus management: move focus into a newly opened sheet, give it back on close
    if (o && !lastTop) opener = document.activeElement;
    if (o) { const f = o.querySelector('[data-close], #sheetClose, #cbClose, button'); if (f && !o.contains(document.activeElement)) f.focus({ preventScroll: true }); }
    else if (opener && opener.isConnected) { opener.focus({ preventScroll: true }); opener = null; }
    lastTop = o;
  }
  if (o && !pushed) { history.pushState({ fidgetSheet: 1 }, ''); pushed = true; }
  else if (!o && pushed) { pushed = false; if (history.state && history.state.fidgetSheet) history.back(); }
}
export function init() {
  new MutationObserver(() => queueMicrotask(sync)).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });
  addEventListener('keydown', e => { if (e.key === 'Escape') { const o = top(); if (o) { e.preventDefault(); closeEl(o); } } });
  addEventListener('popstate', () => { if (!pushed) return; pushed = false; const o = top(); if (o) closeEl(o); });
}
