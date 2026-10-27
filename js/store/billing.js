// Google Play Billing inside the TWA via Digital Goods API + Payment Request API.
// On the open web this is unavailable -> UI shows "available in the Android app".
import { CATALOG } from './catalog.js';
import { set, grant, markPlayApp } from './ent.js?v=9';
import { ACK_URL } from './ackconfig.js?v=2';
const PLAY = 'https://play.google.com/billing';
let svc = null, details = {};
export const available = () => !!svc;
export async function init() {
  if (!('getDigitalGoodsService' in window)) return false;
  try { svc = await window.getDigitalGoodsService(PLAY); } catch (_) { svc = null; return false; }
  markPlayApp();
  try { for (const d of await svc.getDetails(CATALOG.map(p => p.id))) details[d.itemId] = d; } catch (_) {}
  try { await restore(); } catch (_) {}
  // Re-sync when returning to the app (e.g. after redeeming a promo code in the Play Store).
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') restore().catch(() => {}); });
  return true;
}
export function price(id) { const d = details[id]; if (!d || !d.price) return null; try { return new Intl.NumberFormat(navigator.language, { style: 'currency', currency: d.price.currency }).format(d.price.value); } catch (_) { return null; } }
export async function restore() {
  if (!svc) return false;
  const list = await svc.listPurchases();
  set(list.map(p => p.itemId));
  // Covers promo codes redeemed in the Play Store and any earlier ack that failed (Play refunds unacknowledged purchases after 3 days).
  for (const p of list) ack(p.itemId, p.purchaseToken);
  return true;
}
export async function buy(id) {
  if (!svc || !window.PaymentRequest) throw new Error('unavailable');
  const req = new PaymentRequest([{ supportedMethods: PLAY, data: { sku: id } }], { total: { label: 'Total', amount: { currency: 'USD', value: '0' } } });
  const res = await req.show();
  const { purchaseToken } = res.details;
  await res.complete('success'); grant(id);
  ack(id, purchaseToken); // fire-and-forget; restore() retries on next launch
  return true;
}
// Acknowledgement must happen server-side: the Digital Goods API v2 has no acknowledge() and
// android-browser-helper does not auto-acknowledge. See PLAY-ACK.md. No-op while ACK_URL is empty.
const ACKED = 'fidget.acked';
const acked = () => { try { return JSON.parse(localStorage.getItem(ACKED)) || []; } catch (_) { return []; } };
export async function ack(sku, token, url = ACK_URL) {
  if (!url || !token || acked().includes(token)) return false;
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sku, token }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) { try { localStorage.setItem(ACKED, JSON.stringify(acked().concat(token).slice(-50))); } catch (_) {} return true; }
  } catch (_) {}
  return false;
}
