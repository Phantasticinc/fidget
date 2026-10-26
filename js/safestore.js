// Imported first by main.js. Storage full (QuotaExceeded) or blocked (cookies off -> SecurityError) must never brick the app:
// writes become best-effort, and a blocked localStorage is replaced by an in-memory one for this session.
try { window.localStorage.getItem('x'); } catch (_) {
  const m = new Map(), mem = { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), clear: () => m.clear(), key: i => [...m.keys()][i] ?? null, get length() { return m.size; } };
  try { Object.defineProperty(window, 'localStorage', { value: mem, configurable: true }); } catch (_) {}
}
const P = Storage.prototype, set = P.setItem, get = P.getItem;
P.setItem = function (k, v) { try { return set.call(this, k, v); } catch (e) { console.warn('storage write skipped', k, e && e.name); } };
P.getItem = function (k) { try { return get.call(this, k); } catch (_) { return null; } };
