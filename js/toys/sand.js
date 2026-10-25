// Sand: kinetic-sand heightfield. Drag = slice, hold = dent, pinch = crumble, Mold = fresh shape.
import { sfx, buzz, opts } from '../feel.js?v=3';
import { makeGrid, mold, relax, carve, deposit, SHAPES } from './sandgrid.js?v=2';
import { makeRenderer, COLORS } from './sandrender.js?v=1';
import { rr, DPR } from '../render.js?v=1';
import { emit } from '../bus.js';
import { look } from '../look.js';
const GW = 110;
export function create() {
  let W, H, G, ren, bx, by, bw, bh, cs, n = 0, crumbs = [], F = new Map(), tick = 0, btn, settle = 0, cuts = 0;
  const toG = (x, y) => [(x - bx) / cs, (y - by) / cs];
  const shp = () => (look.sand && look.sand.shapes) || SHAPES;
  function fresh() { mold(G, shp()[n % shp().length]); crumbs = []; cuts = 0; }
  function spawn(gx, gy, amt, vx, vy) { // crumbs carry sand mass; they tumble then re-deposit
    const k = Math.min(6, Math.ceil(amt * 3));
    for (let i = 0; i < k && crumbs.length < 500; i++) crumbs.push({ x: gx + Math.random() - 0.5, y: gy + Math.random() - 0.5, vx: vx + (Math.random() - 0.5) * 6, vy: vy + (Math.random() - 0.5) * 6, z: 0.4 + Math.random() * 0.4, m: amt / k, s: 0.6 + Math.random() * 0.9 });
  }
  function slice(x0, y0, x1, y1, speed) {
    const [a, b] = toG(x0, y0), [c, d] = toG(x1, y1), L = Math.hypot(c - a, d - b), steps = Math.ceil(L * 4) || 1;
    const nx = -(d - b) / (L || 1), ny = (c - a) / (L || 1); let rem = 0;
    for (let s = 1; s <= steps; s++) {
      const gx = a + (c - a) * s / steps, gy = b + (d - b) * s / steps, r = carve(G, gx, gy, 1.5, 3); rem += r;
      if (r > 0.05) { const side = Math.random() < 0.5 ? 1 : -1; spawn(gx + nx * side * 2.6, gy + ny * side * 2.6, r * 0.9, nx * side * 9, ny * side * 9); }
    }
    if (rem > 0.05) { sfx.sand(Math.min(1, speed / 1.5)); buzz(5 + Math.min(10, rem * 2)); cuts++; emit('cut', { x: x1, y: y1, amt: rem, speed }); }
  }
  return {
    resize(w, h) {
      W = w; H = h; bw = Math.min(W * 0.92, 420); cs = bw / GW; const gh = Math.round(Math.min(H * 0.56, bw * 1.15) / cs); bh = gh * cs;
      bx = (W - bw) / 2; by = H * 0.47 - bh / 2; G = makeGrid(GW, gh); ren = makeRenderer(G, Math.min(1.5, DPR())); fresh();
      btn = { w: 112, h: 40, x: W / 2 - 56, y: by + bh + 14 };
    },
    hud: () => `${shp()[n % shp().length]} · slice · press · pinch`,
    down(id, x, y) {
      if (x > btn.x && x < btn.x + btn.w && y > btn.y && y < btn.y + btn.h) { n++; fresh(); emit('mold', { x: W / 2, y: by + bh / 2, w: bw, h: bh }); sfx.sand(0.9); setTimeout(() => sfx.sand(0.5), 70); buzz(25); return; }
      F.set(id, { x, y, sx: x, sy: y, t: performance.now(), lx: x, ly: y, cut: false, lt: performance.now() });
    },
    move(id, x, y) {
      const f = F.get(id); if (!f) return; const now = performance.now();
      if (!f.cut && Math.hypot(x - f.sx, y - f.sy) > 7 && F.size === 1) f.cut = true;
      if (f.cut) { const sp = Math.hypot(x - f.lx, y - f.ly) / Math.max(1, now - f.lt); slice(f.lx, f.ly, x, y, sp); }
      f.lx = x; f.ly = y; f.lt = now; f.x = x; f.y = y;
    },
    up(id) { F.delete(id); },
    step(dt) {
      tick++;
      // press: held finger sinks a fingertip-shaped dent, displaced sand rises on the rim
      const fs = [...F.values()];
      for (const f of fs) if (!f.cut && fs.length === 1 && performance.now() - f.t > 90) {
        const [gx, gy] = toG(f.x, f.y); const r = carve(G, gx, gy, 4.2, 0.004);
        if (r > 0) { for (let a = 0; a < 6.28; a += 0.5) deposit(G, gx + Math.cos(a) * 5, gy + Math.sin(a) * 5.4, r / 13); if (tick % 24 === 0) { sfx.sand(0.15); buzz(3); } }
      }
      // pinch: two fingers closing crumble the sand between them
      if (fs.length === 2) {
        const [p, q] = fs, d = Math.hypot(p.x - q.x, p.y - q.y); if (p.pd && d < p.pd - 0.5) {
          const [mx, my] = toG((p.x + q.x) / 2, (p.y + q.y) / 2), r = carve(G, mx + (Math.random() - .5) * d / cs * 0.5, my + (Math.random() - .5) * 3, 2.5, 0.06);
          if (r > 0.02) { emit('crumble', { x: bx + mx * cs, y: by + my * cs, amt: r }); spawn(mx, my, r, (Math.random() - .5) * 10, (Math.random() - .5) * 10); if (tick % 6 === 0) { sfx.sand(0.4); buzz(6); } }
        } p.pd = d;
      }
      if (tick % 3 === 0) { const m = relax(G, 0.3, 0.06); if (m > 0.4 && tick % 30 === 0) sfx.sand(0.1); }
      for (let i = crumbs.length - 1; i >= 0; i--) {
        const c = crumbs[i]; c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= 0.94; c.vy *= 0.94; c.z -= dt * 1.6;
        if (c.z <= 0 && Math.hypot(c.vx, c.vy) < 0.8) { deposit(G, c.x, c.y, c.m); crumbs.splice(i, 1); }
      }
    },
    draw(g) {
      // tray
      rr(g, bx - 10, by - 10, bw + 20, bh + 20, 26); g.fillStyle = 'rgba(255,255,255,.025)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1; g.stroke();
      const col = look.sand ? look.sand.colors[n % look.sand.colors.length] : COLORS[n % COLORS.length];
      ren.draw(g, bx, by, bw, bh, col, opts.calm); emit('sandDraw', { g, bx, by, cs, G });
      const [r0, g0, b0] = opts.calm ? [150, 160, 150] : col;
      for (const c of crumbs) { const s = 0.75 + c.s * 0.2; g.fillStyle = `rgb(${r0 * s | 0},${g0 * s | 0},${b0 * s | 0})`; const z = c.z * 6; g.fillRect(bx + c.x * cs - c.s, by + c.y * cs - c.s - z, c.s * 2, c.s * 2); }
      rr(g, btn.x, btn.y, btn.w, btn.h, 20); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.1)'; g.stroke();
      g.fillStyle = '#ecebe8'; g.font = '600 14px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Mold ↻', W / 2, btn.y + btn.h / 2 + 1);
    },
  };
}
