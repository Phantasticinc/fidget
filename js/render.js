// Shared drawing helpers + sprite cache.
export function sprite(size, dpr, fn) {
  const c = document.createElement('canvas'); c.width = c.height = Math.ceil(size * dpr);
  const g = c.getContext('2d'); g.scale(dpr, dpr); fn(g, size); return c;
}
export function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
export const DPR = () => Math.min(2, window.devicePixelRatio || 1);
export function hsl(h, s, l, a = 1) { return `hsla(${h},${s}%,${l}%,${a})`; }
