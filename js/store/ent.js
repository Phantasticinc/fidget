// Entitlements cache (source of truth is Play Billing; refreshed on restore/launch in the Android app).
import { CATALOG, PREMIUM } from './catalog.js';
const K = 'fidget.ent', subs = new Set();
let owned = new Set(JSON.parse(localStorage.getItem(K) || '[]'));
// ?devunlock turns on a tester unlock that survives reloads / PWA launches; ?devlock turns it off.
const qs = new URLSearchParams(location.search), DK = 'fidget.devunlock';
if (qs.has('devunlock')) localStorage.setItem(DK, '1');
if (qs.has('devlock')) localStorage.removeItem(DK);
const dev = localStorage.getItem(DK) === '1';
if (dev) owned = new Set(CATALOG.map(p => p.id)); // testing only; real purchases are never overwritten
export const isDev = dev;
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
