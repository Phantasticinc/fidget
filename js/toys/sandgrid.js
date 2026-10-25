// Heightfield for kinetic sand. h in [0..~1.3]; cohesive: only slopes above REPOSE creep, slowly.
export const SHAPES = ['brick', 'dome', 'heart', 'tower'];
export function makeGrid(gw, gh) {
  const h = new Float32Array(gw * gh), grain = new Float32Array(gw * gh);
  for (let i = 0; i < grain.length; i++) grain[i] = Math.random();
  return { gw, gh, h, grain, tmp: new Float32Array(gw * gh) };
}
export function mold(G, shape) {
  const { gw, gh, h } = G, cx = gw / 2, cy = gh / 2, R = Math.min(gw, gh) * 0.42;
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const dx = (x - cx) / R, dy = (y - cy) / R; let v = 0;
    if (shape === 'brick') { const e = Math.max(Math.abs(dx) / 1.05, Math.abs(dy) / 0.72); v = e < 1 ? Math.min(1, (1 - e) * 14) : 0; }
    else if (shape === 'dome') { const r = Math.hypot(dx, dy); v = r < 1 ? Math.sqrt(1 - r * r) * 1.1 : 0; }
    else if (shape === 'heart') { const X = dx * 1.15, Y = -dy * 1.15 + 0.25; const f = (X * X + Y * Y - 1) ** 3 - X * X * Y * Y * Y; v = f < 0 ? Math.min(1, -f * 6) : 0; }
    else if (shape === 'star') { const r = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + Math.PI / 2, k = 0.62 + 0.38 * Math.abs(Math.cos(a * 2.5)) ** 3; v = r < k ? Math.min(1, (k - r) * 9) : 0; }
    else if (shape === 'ring') { const d = Math.abs(Math.hypot(dx, dy) - 0.7); v = d < 0.26 ? Math.min(1, (0.26 - d) * 9) : 0; }
    else if (shape === 'planet') { const r = Math.hypot(dx, dy); const ry = Math.hypot(dx / 1.15, (dy - dx * 0.25) / 0.28); v = r < 0.62 ? Math.sqrt(1 - (r / 0.62) ** 2) * 1.1 : (ry > 0.85 && ry < 1.05 ? 0.45 : 0); }
    else { const r = Math.hypot(dx, dy) / 0.62; v = r < 1 ? Math.min(1, (1 - r) * 10) * (1 + 0.15 * Math.cos(Math.atan2(dy, dx) * 8)) : 0; }
    h[y * gw + x] = v;
  }
}
// one relaxation pass; returns amount moved
export function relax(G, repose = 0.32, rate = 0.12) {
  const { gw, gh, h } = G; let moved = 0;
  for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
    const i = y * gw + x, a = h[i]; if (a < 0.02) continue;
    for (const j of [i + 1, i - 1, i + gw, i - gw]) {
      const d = a - h[j]; if (d > repose) { const m = (d - repose) * rate; h[i] -= m; h[j] += m; moved += m; }
    }
  }
  return moved;
}
export function carve(G, x, y, r, depth) { // remove material in radius; returns removed
  const { gw, gh, h } = G; let rem = 0;
  for (let j = Math.max(1, Math.floor(y - r)); j <= Math.min(gh - 2, Math.ceil(y + r)); j++)
    for (let i = Math.max(1, Math.floor(x - r)); i <= Math.min(gw - 2, Math.ceil(x + r)); i++) {
      const d = Math.hypot(i - x, j - y); if (d > r) continue; const k = j * gw + i, t = Math.min(h[k], depth * (1 - d / r * 0.3)); h[k] -= t; rem += t;
    }
  return rem;
}
export function deposit(G, x, y, amt) { const i = Math.round(x), j = Math.round(y); if (i > 0 && j > 0 && i < G.gw - 1 && j < G.gh - 1) G.h[j * G.gw + i] += amt; }
