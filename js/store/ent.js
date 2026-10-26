// Entitlements cache (source of truth is Play Billing; refreshed on restore/launch in the Android app).
import { CATALOG, PREMIUM } from './catalog.js';
const K = 'fidget.ent', subs = new Set();
let owned = new Set((() => { try { return JSON.parse(localStorage.getItem(K) || '[]'); } catch (_) { return JSON.parse('[]'); } })());
// ?devunlock turns on a tester unlock that survives reloads / PWA launches; ?devlock turns it off.
// Never in the Play app (TWA): detected by the android-app:// referrer, a sticky flag, or Play Billing actually connecting (markPlayApp, from billing.js).
// Note: mere presence of window.getDigitalGoodsService is NOT proof — Chrome on Android exposes it in normal tabs too (it then rejects with "unsupported context").
const qs = new URLSearchParams(location.search), DK = 'fidget.devunlock', TK = 'fidget.twa';
if (document.referrer.startsWith('android-app://') || qs.get('src') === 'twa') localStorage.setItem(TK, '1');
export let inPlayApp = localStorage.getItem(TK) === '1';
if (inPlayApp) localStorage.removeItem(DK);
else { if (qs.has('devunlock')) localStorage.setItem(DK, '1'); if (qs.has('devlock')) localStorage.removeItem(DK); }
let dev = !inPlayApp && localStorage.getItem(DK) === '1';
if (dev) owned = new Set(CATALOG.map(p => p.id)); // testing only; real purchases are never overwritten
export let isDev = dev;
// Called when Play Billing connects: we're definitely in the Play app -> sticky flag, tester unlock off, back to real (cached) purchases.
export function markPlayApp() { localStorage.setItem(TK, '1'); inPlayApp = true; if (!dev) return; localStorage.removeItem(DK); dev = isDev = false; owned = new Set((() => { try { return JSON.parse(localStorage.getItem(K) || '[]'); } catch (_) { return JSON.parse('[]'); } })()); subs.forEach(f => f()); }
// Share gift: ONE free upgrade per install, stored apart from Play purchases (restore never touches it).
const GK = 'fidget.gift', SK = 'fidget.shared';
let gift = localStorage.getItem(GK);
export const gifted = () => gift;
export const shared = () => localStorage.getItem(SK) === '1';
export function markShared() { localStorage.setItem(SK, '1'); }
export function setGift(id) { if (gift || !shared() || !CATALOG.some(p => p.id === id && p.toy)) return false; gift = id; localStorage.setItem(GK, id); subs.forEach(f => f()); return true; }
export const has = id => owned.has(id) || gift === id;
export const premium = () => owned.has(PREMIUM);
export function onChange(fn) { subs.add(fn); }
export function set(ids) { owned = new Set(dev ? CATALOG.map(p => p.id) : ids); if (!dev) localStorage.setItem(K, JSON.stringify([...owned])); subs.forEach(f => f()); }
export function grant(id) { set([...owned, id]); }
