// Google Play Billing inside the TWA via Digital Goods API + Payment Request API.
// On the open web this is unavailable -> UI shows "available in the Android app".
import { CATALOG } from './catalog.js';
import { set, grant } from './ent.js?v=7';
const PLAY = 'https://play.google.com/billing';
let svc = null, details = {};
export const available = () => !!svc;
export async function init() {
  if (!('getDigitalGoodsService' in window)) return false;
  try { svc = await window.getDigitalGoodsService(PLAY); } catch (_) { svc = null; return false; }
  try { for (const d of await svc.getDetails(CATALOG.map(p => p.id))) details[d.itemId] = d; } catch (_) {}
  await restore(); return true;
}
export function price(id) { const d = details[id]; if (!d || !d.price) return null; try { return new Intl.NumberFormat(navigator.language, { style: 'currency', currency: d.price.currency }).format(d.price.value); } catch (_) { return null; } }
export async function restore() {
  if (!svc) return false;
  const list = await svc.listPurchases(); set(list.map(p => p.itemId));
  return true;
}
export async function buy(id) {
  if (!svc || !window.PaymentRequest) throw new Error('unavailable');
  const req = new PaymentRequest([{ supportedMethods: PLAY, data: { sku: id } }], { total: { label: 'Total', amount: { currency: 'USD', value: '0' } } });
  const res = await req.show();
  const { purchaseToken } = res.details;
  // Non-consumable: Play requires acknowledgement within 3 days or it auto-refunds.
  try { if (svc.acknowledge) await svc.acknowledge(purchaseToken, 'onetime'); } catch (_) {}
  await res.complete('success'); grant(id); return true;
}
