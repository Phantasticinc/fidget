// Pop It: silicone push-pop. Bistable domes snap through with a rubbery thup; press all and the board flips over for a fresh side.
import { snd, buzz, opts, rich } from './kit2.js?v=1';
import { rr, hsl } from '../render.js?v=1';
import { emit } from '../bus.js';
const ROWS = [[0, 78], [28, 85], [52, 88], [130, 55], [205, 70], [275, 55]]; // rainbow silicone (hue, sat)
export function create() {
  let W, H, R, D = [], bx, by, bw, bh, fingers = new Map(), pushed = 0, sides = 0, flip = 0, flipping = false, t = 0, streak = 0, lastT = 0;
  function layout() {
    const n = 6; R = Math.min(W * 0.84, 400, H * 0.6) / (n * 2.3); bw = R * 2.3 * n + R * 0.7; bh = bw; bx = (W - bw) / 2; by = H * 0.47 - bh / 2;
    const keep = D.length === n * n ? D : null; D = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const o = keep && keep[r * n + c]; D.push({ x: bx + R * 0.35 + R * 1.15 + c * R * 2.3, y: by + R * 0.35 + R * 1.15 + r * R * 2.3, row: r, d: o ? o.d : 0, v: 0, p: o ? o.p : false, held: 0 }); }
  }
  const hit = (x, y) => D.find(d => (x - d.x) ** 2 + (y - d.y) ** 2 < (R * 1.1) ** 2);
  function press(id, x, y) { if (flipping) return; const d = hit(x, y), f = fingers.get(id); if (f && f !== d) f.held = 0; if (d && !d.p) d.held = 1; fingers.set(id, d); }
  function snap(d) {
    d.p = true; pushed++; const now = performance.now(); streak = now - lastT < 300 ? streak + 1 : 0; lastT = now;
    snd.thup(false, 0.5); buzz(10); const [h, s] = ROWS[d.row]; emit('popit', { x: d.x, y: d.y, r: R, h, s, streak, toy: 'popit', rich: rich('popit') });
    for (const o of D) { const dd = Math.hypot(o.x - d.x, o.y - d.y); if (o !== d && dd < R * 3) o.v -= (R * 3 - dd) / R * 0.6; }
    if (pushed === D.length) setTimeout(() => { flipping = true; flip = 0; snd.flip(); }, 450);
  }
  return {
    resize(w, h) { W = w; H = h; layout(); },
    hud: () => `${pushed} / ${D.length}${sides ? ` · ${sides} flip${sides > 1 ? 's' : ''}` : ''}${streak > 3 ? ` · ${streak + 1}× roll` : ''}`,
    label: 'Pop It: press each silicone bubble; press them all and the board flips over',
    down(id, x, y) { press(id, x, y); },
    move(id, x, y) { press(id, x, y); },
    up(id) { const d = fingers.get(id); if (d) d.held = 0; fingers.delete(id); },
    step(dt) {
      t += dt;
      if (flipping) { flip += dt / 0.55; if (flip >= 0.5 && pushed) { for (const d of D) { d.p = false; d.d = 0; d.v = 0; } pushed = 0; sides++; emit('popitFlip', { toy: 'popit', rich: rich('popit') }); buzz(18); } if (flip >= 1) { flipping = false; flip = 0; } }
      for (const d of D) {
        // bistable snap-through: finger load vs dome stiffness; past ~55% travel it snaps the rest of the way
        const tgt = d.p ? 1 : d.held ? 0.7 : 0; d.v += ((tgt - d.d) * 700 - d.v * 26) * dt; d.d += d.v * dt;
        if (!d.p && d.held && d.d > 0.55) { d.held = 0; d.v = 9; snap(d); }
      }
    },
    draw(g) {
      const calm = opts.calm, lux = rich('popit') && !calm, sx = flipping ? Math.abs(Math.cos(flip * Math.PI)) : 1;
      g.save(); g.translate(W / 2, by + bh / 2); g.scale(Math.max(0.02, sx), 1 + (1 - sx) * 0.06); g.translate(-W / 2, -(by + bh / 2));
      rr(g, bx, by, bw, bh, R * 1.2); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 28; g.shadowOffsetY = 12;
      const bg = g.createLinearGradient(bx, by, bx, by + bh);
      ROWS.forEach(([h, s], i) => { const c = calm ? hsl(150, 8, 40) : lux ? hsl((h + t * 40) % 360, 95, 52) : hsl(h, s, 62); bg.addColorStop(i / 6, c); bg.addColorStop((i + 1) / 6 - 0.001, c); });
      g.fillStyle = bg; g.fill(); g.shadowColor = 'transparent';
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; g.stroke();
      if (lux) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = hsl((t * 90) % 360, 100, 70, 0.6); g.lineWidth = 3; g.shadowColor = g.strokeStyle; g.shadowBlur = 18; rr(g, bx - 2, by - 2, bw + 4, bh + 4, R * 1.25); g.stroke(); g.restore(); }
      for (const d of D) {
        const [h, s] = ROWS[d.row], L = calm ? 42 : lux ? 55 : 64, hh = calm ? 150 : lux ? (h + t * 40) % 360 : h, ss = calm ? 8 : lux ? 95 : s, k = d.d, r = R;
        // rim shadow ring
        g.fillStyle = hsl(hh, ss, L - 18, 0.55); g.beginPath(); g.arc(d.x, d.y + 1.5, r * 1.02, 0, 7); g.fill();
        // dome: raised = light top-left; pushed = concave (light bottom-right, dark top-left)
        const lx = d.x + r * (-0.35 + 0.7 * k), ly = d.y + r * (-0.4 + 0.8 * k);
        const gr = g.createRadialGradient(lx, ly, r * 0.05, d.x, d.y, r);
        gr.addColorStop(0, hsl(hh, ss, Math.min(92, L + 26 - k * 10))); gr.addColorStop(0.6, hsl(hh, ss, L - k * 6)); gr.addColorStop(1, hsl(hh, ss, L - 16 - k * 6));
        g.fillStyle = gr; g.beginPath(); g.arc(d.x, d.y, r * (1 - k * 0.05), 0, 7); g.fill();
        if (k > 0.5) { g.strokeStyle = hsl(hh, ss, L - 25, 0.5); g.lineWidth = r * 0.12; g.beginPath(); g.arc(d.x, d.y, r * 0.86, Math.PI * 1.05, Math.PI * 1.75); g.stroke(); }
        else { g.fillStyle = `rgba(255,255,255,${0.45 * (1 - k)})`; g.beginPath(); g.ellipse(d.x - r * 0.38, d.y - r * 0.42, r * 0.22, r * 0.13, -0.6, 0, 7); g.fill(); }
        if (lux && d.p) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = hsl(hh, 100, 60, 0.18 + 0.1 * Math.sin(t * 4 + d.x)); g.beginPath(); g.arc(d.x, d.y, r * 0.8, 0, 7); g.fill(); g.restore(); }
      }
      g.restore();
    },
  };
}
