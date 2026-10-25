// Pooled particle system. Kinds: glow (cached radial sprite), spark (velocity streak), ring, confetti, drop (shaded blob).
// Budget scales with quality + calm so mid phones stay at 60 fps.
const MAX = 700, P = [], glowCache = new Map();
export const q = { scale: 1 };
function glow(col) {
  let c = glowCache.get(col); if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
  const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, '#fff'); r.addColorStop(0.18, col); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 32, 32); glowCache.set(col, c); return c;
}
export function add(o) {
  if (P.length >= MAX * q.scale) return null;
  const p = Object.assign({ kind: 'glow', x: 0, y: 0, vx: 0, vy: 0, g: 0, drag: 0.98, life: 0.8, t: 0, size: 4, col: '#fff', rot: 0, vr: 0, add: true, a: 1 }, o);
  P.push(p); return p;
}
export function burst(n, base, fn) { n = Math.round(n * q.scale); for (let i = 0; i < n; i++) add(Object.assign({}, base, fn ? fn(i, n) : null)); }
export const count = () => P.length;
export function clear() { P.length = 0; }
export function step(dt) {
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i]; p.t += dt; if (p.t >= p.life) { P[i] = P[P.length - 1]; P.pop(); continue; }
    p.vx *= p.drag; p.vy = p.vy * p.drag + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    if (p.floor != null && p.y > p.floor) { p.y = p.floor; p.vy = 0; p.vx = 0; p.g = 0; if (!p.landed) { p.landed = 1; p.onLand && p.onLand(p); } }
  }
}
export function draw(g) {
  for (let pass = 0; pass < 2; pass++) {
    g.globalCompositeOperation = pass ? 'lighter' : 'source-over';
    for (const p of P) {
      if (p.add !== !!pass) continue;
      const k = 1 - p.t / p.life, a = p.a * (p.fade === false ? 1 : k);
      g.globalAlpha = a; if (p.cols) p.col = p.cols[Math.min(p.cols.length - 1, (p.t / p.life * p.cols.length) | 0)];
      if (p.kind === 'glow') { const s = p.size * (p.grow ? 1 + p.t / p.life * p.grow : 1); g.drawImage(glow(p.col), p.x - s, p.y - s, s * 2, s * 2); }
      else if (p.kind === 'spark') { g.strokeStyle = p.col; g.lineWidth = p.size; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); g.stroke(); }
      else if (p.kind === 'ring') { const r = p.size + (p.r1 - p.size) * (1 - k * k); g.strokeStyle = p.col; g.lineWidth = (p.lw || 2) * k + 0.3; g.beginPath(); g.arc(p.x, p.y, r, 0, 7); g.stroke(); }
      else if (p.kind === 'confetti') { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, Math.cos(p.rot * 1.7)); g.fillStyle = p.col; g.fillRect(-p.size, -p.size * 0.45, p.size * 2, p.size * 0.9); g.restore(); }
      else if (p.kind === 'drop') { const s = p.size * (0.6 + 0.4 * k), gr = g.createRadialGradient(p.x - s * .35, p.y - s * .35, 0, p.x, p.y, s); gr.addColorStop(0, p.hi || '#fff'); gr.addColorStop(0.45, p.col); gr.addColorStop(1, p.lo || '#222'); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, s, 0, 7); g.fill(); }
    }
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
// jagged electric arc between two points (drawn immediately, not pooled)
export function arc(g, x0, y0, x1, y1, col, w = 1.6, jag = 10, blur = 8) {
  const n = 7; g.globalCompositeOperation = 'lighter'; g.strokeStyle = col; g.lineWidth = w; if (blur) { g.shadowColor = col; g.shadowBlur = blur * q.scale; }
  g.beginPath(); g.moveTo(x0, y0);
  for (let i = 1; i < n; i++) { const t = i / n; g.lineTo(x0 + (x1 - x0) * t + (Math.random() - .5) * jag, y0 + (y1 - y0) * t + (Math.random() - .5) * jag); }
  g.lineTo(x1, y1); g.stroke(); g.shadowBlur = 0; g.globalCompositeOperation = 'source-over';
}
export const rnd = (a, b) => a + Math.random() * (b - a);
