// Android back button / back gesture (Play app = TWA): close the open sheet instead of leaving the app.
// While any overlay is open we keep one extra history entry; back pops it and we close the top overlay via its own close control.
const IDS = ['giftReveal', 'celeb', 'gift', 'shop', 'board', 'sheet']; // topmost first
const top = () => IDS.map(id => document.getElementById(id)).find(e => e && !e.hidden);
let pushed = false;
function closeEl(e) {
  const b = e.querySelector('[data-close], #sheetClose, #cbClose') || (e.id === 'giftReveal' && e.querySelector('button'));
  if (b) b.click(); else e.hidden = true;
}
function sync() {
  const o = top();
  if (o && !pushed) { history.pushState({ fidgetSheet: 1 }, ''); pushed = true; }
  else if (!o && pushed) { pushed = false; if (history.state && history.state.fidgetSheet) history.back(); }
}
export function init() {
  new MutationObserver(() => queueMicrotask(sync)).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });
  addEventListener('popstate', () => { if (!pushed) return; pushed = false; const o = top(); if (o) closeEl(o); });
}
