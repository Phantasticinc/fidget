// Kinetic-sand heightfield with cohesion. h = height [0..~1.5], gl = glossy freshly-cut/compressed face [0..1].
// Cohesive rules: material holds steep (cut) walls, slowly oozes above the repose angle, and only slumps when a wall is far too tall.
export const SHAPES = ['brick', 'dome', 'heart', 'tower'];
export function makeGrid(gw, gh) {
  const n = gw * gh, grain = new Float32Array(n);
  for (let i = 0; i < n; i++) grain[i] = Math.random();
  return { gw, gh, h: new Float32Array(n), gl: new Float32Array(n), grain };
}
export function mold(G, shape) {
  const { gw, gh, h } = G, cx = gw / 2, cy = gh / 2, R = Math.min(gw, gh) * 0.42; G.gl.fill(0);
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
const inb = (G, i, j) => i > 0 && j > 0 && i < G.gw - 1 && j < G.gh - 1;
export function add(G, x, y, amt) { const i = Math.round(x), j = Math.round(y); if (inb(G, i, j)) G.h[j * G.gw + i] += amt; }
export const deposit = add;
export function at(G, x, y) { const i = Math.round(x), j = Math.round(y); return inb(G, i, j) ? G.h[j * G.gw + i] : 0; }
// soft gaussian deposit (splats, re-merging clumps)
export function blob(G, x, y, r, amt) {
  let w = 0; const cells = [];
  for (let j = Math.floor(y - r); j <= Math.ceil(y + r); j++) for (let i = Math.floor(x - r); i <= Math.ceil(x + r); i++) {
    const d = Math.hypot(i - x, j - y); if (d > r || !inb(G, i, j)) continue; const k = Math.cos(d / r * 1.5708) ** 2; cells.push(j * G.gw + i, k); w += k; }
  for (let c = 0; c < cells.length; c += 2) G.h[cells[c]] += amt * cells[c + 1] / (w || 1);
}
// remove material inside a disc; returns mass removed
export function take(G, x, y, r, max = 9) {
  let rem = 0;
  for (let j = Math.floor(y - r); j <= Math.ceil(y + r); j++) for (let i = Math.floor(x - r); i <= Math.ceil(x + r); i++) {
    const d = Math.hypot(i - x, j - y); if (d > r || !inb(G, i, j)) continue; const k = j * G.gw + i, t = Math.min(G.h[k], max * (1 - (d / r) ** 2 * 0.4)); G.h[k] -= t; rem += t; }
  return rem;
}
export const carve = (G, x, y, r, depth) => take(G, x, y, r, depth);
// clean slice: the blade displaces sand to both sides (raised lips), leaving straight, glossy, compacted walls
export function slice(G, a, b, c, d, r) {
  const L = Math.hypot(c - a, d - b), n = Math.max(1, Math.ceil(L * 2)), nx = -(d - b) / (L || 1), ny = (c - a) / (L || 1); let moved = 0;
  for (let s = 1; s <= n; s++) {
    const x = a + (c - a) * s / n, y = b + (d - b) * s / n;
    for (let j = Math.floor(y - r); j <= Math.ceil(y + r); j++) for (let i = Math.floor(x - r); i <= Math.ceil(x + r); i++) {
      if (!inb(G, i, j)) continue; const dx = i - x, dy = j - y, dd = Math.hypot(dx, dy); if (dd > r) continue;
      const k = j * G.gw + i, t = G.h[k] * 0.85; if (t < 0.002) continue; G.h[k] -= t; moved += t;
      const side = dx * nx + dy * ny >= 0 ? 1 : -1; add(G, x + nx * side * (r + 1), y + ny * side * (r + 1), t * 0.62); add(G, x + nx * side * (r + 2), y + ny * side * (r + 2), t * 0.38);
    }
    for (const side of [-1, 1]) for (let o = r; o <= r + 2.2; o += 0.8) { const i = Math.round(x + nx * side * o), j = Math.round(y + ny * side * o); if (inb(G, i, j)) G.gl[j * G.gw + i] = 1; }
  }
  return moved;
}
// press: fingertip dent, volume pushed into a bulging rim; compacted (glossy) floor
export function press(G, x, y, r, amt) {
  const rem = take(G, x, y, r, amt);
  for (let a = 0; a < 6.283; a += 0.39) blob(G, x + Math.cos(a) * (r + 1.6), y + Math.sin(a) * (r + 1.6), 2.2, rem / 16.1);
  for (let j = Math.floor(y - r); j <= y + r; j++) for (let i = Math.floor(x - r); i <= x + r; i++) if (inb(G, i, j) && Math.hypot(i - x, j - y) < r) G.gl[j * G.gw + i] = Math.max(G.gl[j * G.gw + i], 0.6);
  return rem;
}
// sticky drag: material clings and travels with the finger, leaving a groove with ridged edges
export function smear(G, x0, y0, x1, y1, r, carry) {
  const got = take(G, x0, y0, r, 0.09); const drop = carry * 0.06;
  blob(G, x1, y1, r * 0.9, drop); for (const s of [-1, 1]) { const L = Math.hypot(x1 - x0, y1 - y0) || 1; blob(G, x0 - (y1 - y0) / L * s * (r + 1), y0 + (x1 - x0) / L * s * (r + 1), 1.6, got * 0.25); }
  return got * 0.5 - drop;
}
// cohesive ooze: slow creep above repose, collapse only past the slump threshold; gloss dries slowly
export function relax(G, repose = 0.5, rate = 0.012, slump = 1.25) {
  const { gw, gh, h, gl } = G; let moved = 0;
  for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
    const i = y * gw + x, a = h[i]; if (gl[i] > 0) gl[i] = Math.max(0, gl[i] - 0.0016); if (a < 0.02) continue;
    for (const j of [i + 1, i - 1, i + gw, i - gw]) {
      const d = a - h[j]; if (d > repose) { const m = (d - repose) * (d > slump ? 0.25 : rate); h[i] -= m; h[j] += m; moved += m; }
    }
  }
  return moved;
}
