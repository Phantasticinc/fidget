// Play promo codes: Fidget never checks codes itself (no app-side master code). We hand the code to Google Play's
// redeem page, then re-read purchases from Play Billing when the user comes back. Deep link: ?redeem=CODE
import * as bill from './billing.js?v=4';
const URL_ = 'https://play.google.com/redeem';
export const clean = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
let waiting = false, onDone = null;
export function onRestored(fn) { onDone = fn; }
export function url(code) { const c = clean(code); return c ? `${URL_}?code=${encodeURIComponent(c)}` : URL_; }
export function go(code) {
  waiting = true;
  const w = window.open(url(code), '_blank');   // no 'noopener' feature: it makes open() return null
  if (w) { try { w.opener = null; } catch (_) {} } else location.href = url(code);
  return url(code);
}
async function back() {
  if (!waiting || document.visibilityState !== 'visible') return; waiting = false;
  let ok = false; try { ok = await bill.restore(); } catch (_) {}
  onDone && onDone(ok);
}
export function ask(pre = '') {
  const c = window.prompt('Enter your Google Play promo code.\nYou\'ll finish redeeming on Google Play, then come back here — Premium unlocks automatically.', pre);
  if (c === null) return null;
  return go(c);
}
export function init() {
  document.addEventListener('visibilitychange', back); window.addEventListener('focus', back);
  const q = new URLSearchParams(location.search), c = q.get('redeem');
  if (c !== null) {
    q.delete('redeem'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
    setTimeout(() => ask(clean(c)), 400);   // needs a user OK (also avoids popup blocking)
  }
}
