// Tiny event bus: toys emit physical events; fx, skins and stats listen. Toys never import fx.
const L = {};
export const on = (t, fn) => (L[t] = L[t] || []).push(fn);
export const emit = (t, d) => { const a = L[t]; if (a) for (const f of a) { try { f(d); } catch (e) { console.warn(e); } } };
