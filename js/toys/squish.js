// Squish: palm-sized pressure soft body (position-based dynamics). Poke it from outside, grab & fling from inside,
// pinch with two fingers. Volume is conserved, so dents bulge elsewhere.
import { sfx, buzz, opts } from '../feel.js?v=1';
const N = 56;
export function create() {
  let W, H, R, hx, hy, px = new Float32Array(N), py = new Float32Array(N), ox = new Float32Array(N), oy = new Float32Array(N);
  let rest = 0, area0 = 0, F = new Map(), sqAcc = 0, lastSq = 0, hue = 330, wall = false;
  function reset() { for (let i = 0; i < N; i++) { const t = i / N * 6.2832; px[i] = ox[i] = hx + Math.cos(t) * R; py[i] = oy[i] = hy + Math.sin(t) * R; } rest = 2 * Math.PI * R / N; area0 = area(); }
  function area() { let a = 0; for (let i = 0, j = N - 1; i < N; j = i++) a += (px[j] + px[i]) * (py[j] - py[i]); return a / 2; }
  function centroid() { let x = 0, y = 0; for (let i = 0; i < N; i++) { x += px[i]; y += py[i]; } return [x / N, y / N]; }
  function inside(x, y) { let c = false; for (let i = 0, j = N - 1; i < N; j = i++) if ((py[i] > y) !== (py[j] > y) && x < (px[j] - px[i]) * (y - py[i]) / (py[j] - py[i]) + px[i]) c = !c; return c; }
  return {
    resize(w, h) { W = w; H = h; R = Math.min(W * 0.24, 120); hx = W / 2; hy = H * 0.47; reset(); },
    hud: () => 'poke · pinch · fling',
    down(id, x, y) {
      if (inside(x, y)) { // grab: weight nearby boundary points
        const wts = []; for (let i = 0; i < N; i++) { const d = Math.hypot(px[i] - x, py[i] - y); wts.push(Math.max(0, 1 - d / (R * 1.8)) ** 1.5); }
        F.set(id, { x, y, grab: true, wts, lx: x, ly: y }); buzz(8); sfx.squish(0.3);
      } else F.set(id, { x, y, grab: false });
    },
    move(id, x, y) { const f = F.get(id); if (f) { f.x = x; f.y = y; } },
    up(id) { F.delete(id); },
    step(dt) {
      const damp = 0.992, d2 = dt * dt;
      const [cx, cy] = centroid();
      for (let i = 0; i < N; i++) {
        const vx = (px[i] - ox[i]) * damp, vy = (py[i] - oy[i]) * damp; ox[i] = px[i]; oy[i] = py[i];
        // soft home spring keeps it centred on the table
        px[i] += vx + (hx - cx) * 1.5 * d2; py[i] += vy + (hy - cy) * 1.5 * d2;
      }
      for (const f of F.values()) if (f.grab) {
        const dx = f.x - f.lx, dy = f.y - f.ly; f.lx = f.x; f.ly = f.y;
        for (let i = 0; i < N; i++) if (f.wts[i]) { px[i] += dx * f.wts[i]; py[i] += dy * f.wts[i]; }
      }
      for (let it = 0; it < 8; it++) {
        // edges
        for (let i = 0; i < N; i++) { const j = (i + 1) % N, dx = px[j] - px[i], dy = py[j] - py[i], d = Math.hypot(dx, dy) || 1, k = (d - rest) / d * 0.5 * 0.9; px[i] += dx * k; py[i] += dy * k; px[j] -= dx * k; py[j] -= dy * k; }
        // pressure (area preservation) along vertex normals
        const A = area(), err = (area0 - A) / (N * rest) * 0.5;
        for (let i = 0; i < N; i++) { const a = (i + N - 1) % N, b = (i + 1) % N; let nx = py[b] - py[a], ny = -(px[b] - px[a]); const l = Math.hypot(nx, ny) || 1; const q = err * Math.sign(area0); px[i] += nx / l * q; py[i] += ny / l * q; }
        // shape memory (gentle) so it slowly returns to round
        const [mx, my] = centroid(), sm = F.size ? 0.0002 : 0.0012;
        for (let i = 0; i < N; i++) { const t = i / N * 6.2832; px[i] += (mx + Math.cos(t) * R - px[i]) * sm; py[i] += (my + Math.sin(t) * R - py[i]) * sm; }
        // external fingers are rigid discs
        for (const f of F.values()) if (!f.grab) { const fr = 26; for (let i = 0; i < N; i++) { const dx = px[i] - f.x, dy = py[i] - f.y, d = Math.hypot(dx, dy); if (d < fr && d > 0) { px[i] = f.x + dx / d * fr; py[i] = f.y + dy / d * fr; } } }
        // walls
        const m = 12, top = 110, bot = H - 100; let hitW = false;
        for (let i = 0; i < N; i++) { if (px[i] < m) { px[i] = m; hitW = true; } if (px[i] > W - m) { px[i] = W - m; hitW = true; } if (py[i] < top) { py[i] = top; hitW = true; } if (py[i] > bot) { py[i] = bot; hitW = true; } }
        if (it === 0) { if (hitW && !wall) { let sp = 0; for (let i = 0; i < N; i++) sp += Math.hypot(px[i] - ox[i], py[i] - oy[i]); sp /= N; if (sp > 3) { sfx.squish(Math.min(1, sp / 12)); buzz(10 + Math.min(20, sp)); } } wall = hitW; }
      }
      // deformation-rate driven squelch
      let def = 0; for (let i = 0; i < N; i++) def += Math.abs(Math.hypot(px[i] - cx, py[i] - cy) - R); def /= N * R;
      sqAcc += Math.abs(def - lastSq); lastSq = def;
      if (sqAcc > 0.05) { sfx.squish(Math.min(1, sqAcc * 4)); if (sqAcc > 0.09) buzz(6); sqAcc = 0; }
    },
    draw(g) {
      const calm = opts.calm, [cx, cy] = centroid();
      const path = () => { g.beginPath(); for (let i = 0; i <= N; i++) { const a = i % N, b = (i + 1) % N, mx = (px[a] + px[b]) / 2, my = (py[a] + py[b]) / 2; i ? g.quadraticCurveTo(px[a], py[a], mx, my) : g.moveTo(mx, my); } g.closePath(); };
      // contact shadow
      g.save(); g.translate(0, R * 0.18); path(); g.fillStyle = 'rgba(0,0,0,.45)'; g.filter = 'blur(14px)'; g.fill(); g.filter = 'none'; g.restore();
      const h = calm ? 155 : hue, s = calm ? 18 : 70;
      const bg = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R * 1.35);
      bg.addColorStop(0, `hsl(${h},${s}%,78%)`); bg.addColorStop(0.55, `hsl(${h},${s}%,58%)`); bg.addColorStop(1, `hsl(${h},${s + 5}%,30%)`);
      path(); g.fillStyle = bg; g.fill();
      // subsurface rim light
      g.save(); path(); g.clip(); g.lineWidth = R * 0.18; g.strokeStyle = `hsla(${h},${s}%,85%,.18)`; g.filter = 'blur(6px)'; g.translate(0, R * 0.08); path(); g.stroke(); g.filter = 'none'; g.restore();
      // transmitted light pooling on the far side (gummy translucency)
      g.save(); path(); g.clip(); const cg = g.createRadialGradient(cx + R * 0.35, cy + R * 0.45, 0, cx + R * 0.35, cy + R * 0.45, R * 0.7);
      cg.addColorStop(0, `hsla(${h},${s + 10}%,82%,.55)`); cg.addColorStop(1, `hsla(${h},${s}%,60%,0)`); g.fillStyle = cg; g.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4); g.restore();
      // specular (stretches with the body's top-left region)
      let tx = 0, ty = 0, c = 0; for (let i = 0; i < N; i++) { const t = i / N * 6.2832; if (Math.cos(t + 2.4) > 0.6) { tx += px[i]; ty += py[i]; c++; } }
      tx = tx / c * 0.55 + cx * 0.45; ty = ty / c * 0.55 + cy * 0.45;
      const sg = g.createRadialGradient(tx, ty, 0, tx, ty, R * 0.38); sg.addColorStop(0, 'rgba(255,255,255,.85)'); sg.addColorStop(0.3, 'rgba(255,255,255,.25)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = sg; g.beginPath(); g.arc(tx, ty, R * 0.38, 0, 7); g.fill();
      path(); g.strokeStyle = `hsla(${h},${s}%,20%,.35)`; g.lineWidth = 1; g.stroke();
    },
  };
}
