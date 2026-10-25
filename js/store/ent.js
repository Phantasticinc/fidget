// Entitlements cache (source of truth is Play Billing; refreshed on restore/launch in the Android app).
import { CATALOG, PREMIUM } from './catalog.js';
const K = 'fidget.ent', subs = new Set();
let owned = new Set(JSON.parse(localStorage.getItem(K) || '[]'));
const dev = new URLSearchParams(location.search).has('devunlock');
if (dev) owned = new Set(CATALOG.map(p => p.id)); // testing only, never persisted
export const isDev = dev;
export const has = id => owned.has(id);
export const premium = () => owned.has(PREMIUM);
export function onChange(fn) { subs.add(fn); }
export function set(ids) { owned = new Set(dev ? CATALOG.map(p => p.id) : ids); if (!dev) localStorage.setItem(K, JSON.stringify([...owned])); subs.forEach(f => f()); }
export function grant(id) { set([...owned, id]); }
