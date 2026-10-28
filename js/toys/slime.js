// Slime: a glossy, stretchy blob. Grab near the edge and pull to stretch it (it peels off your finger when you let go),
// poke the middle to dent it, pop the little air bubbles trapped inside. Tap outside to change colour.
import { snd, buzz, opts, rich } from './kit2.js?v=1';
import { emit } from '../bus.js';
import { body } from './soft.js?v=1';
const COLS = [[160, 70, 62], [320, 75, 70], [200, 80, 62], [48, 95, 62]];
export function create() {
  let W, H, B = body({ N: 64, kShape: 38, kEdge: 600, damp: 3.2, pressure: 5, drift: 0.15 }), F = new Map(), ci = 0, t = 0, n = 0, bub = [], glit = [], lastS = 0, maxS = 0;
  function layout() { B.place(W / 2, H * 0.47, Math.min(W * 0.34, H * 0.22, 160)); if (!bub.length) for (let i = 0; i < 7; i++) bub.push(nb()); if (!glit.length) for (let i = 0; i < 70; i++) glit.push({ a: Math.random() * 6.28, r: Math.sqrt(Math.random()) * 0.9, s: Math.random() }); }
  const nb = () => ({ a: Math.random() * 6.28, r: Math.sqrt(Math.random()) * 0.7, s: 0.04 + Math.random() * 0.05, g: 0 });
  // positions follow the blob: map polar (a, r) through the nearest rim point so bubbles stretch with the slime
  function at(a, r) { const i = Math.round(((a % 6.2832) + 6.2832) % 6.2832 / 6.2832 * B.N) % B.N, p = B.P[i], mx = cen(); return [mx[0] + (p.x - mx[0]) * r, mx[1] + (p.y - mx[1]) * r]; }
  function cen() { let x = 0, y = 0; for (const p of B.P) { x += p.x; y += p.y; } return [x / B.N, y / B.N]; }
  return {
    resize(w, h) { W = w; H = h; layout(); },
    label: 'Slime: pull the edge to stretch it, poke the middle, pop the air bubbles. Tap outside to change colour',
    hud: () => `${n} squishes`,
    down(id, x, y) {
      for (const b of bub) { const [bx, by] = at(b.a, b.r); if (b.g >= 1 && Math.hypot(x - bx, y - by) < B.R * b.s * 1.6 + 10) { snd.blip(b.s * 10); buzz(6); emit('slimePop', { x: bx, y: by, toy: 'slime', rich: rich('slime') }); Object.assign(b, nb()); return; } }
      const f = { x, y, r: B.R * 0.26, dent: false }; F.set(id, f);
      if (!B.inside(x, y)) { const near = B.P.some(p => Math.hypot(p.x - x, p.y - y) < B.R * 0.35); if (!near) { ci = (ci + 1) % COLS.length; snd.squelch(0.2); F.delete(id); return; } }
      const got = B.grab(f, B.R * 0.42); if (got.length) { f.grab = true; snd.squelch(0.6); buzz(12); n++; emit('slime', { x, y, r: B.R, toy: 'slime', rich: rich('slime') }); } else { f.dent = true; snd.squelch(0.35); buzz(8); n++; }
    },
    move(id, x, y) { const f = F.get(id); if (f) { f.x = x; f.y = y; } },
    up(id) { const f = F.get(id); if (!f) return; F.delete(id); if (f.grab) { // peel: let go of points one by one over ~120 ms
      const ps = B.P.filter(p => p.g === f); ps.forEach((p, i) => setTimeout(() => { if (p.g === f) p.g = null; }, i * 12)); snd.stretch(Math.min(1, maxS)); setTimeout(() => snd.squelch(Math.min(1, maxS * 0.8)), 90); maxS = 0; } },
    step(dt) {
      t += dt; const def = B.step(dt, [...F.values()].filter(f => f.dent)); maxS = Math.max(maxS, def);
      if (def > 0.35 && t - lastS > 0.18 && [...F.values()].some(f => f.grab)) { lastS = t; snd.stretch(def); if (def > 0.8) buzz(4); }
      for (const b of bub) b.g = Math.min(1, b.g + dt * 0.6);
    },
    draw(g) {
      const calm = opts.calm, lux = rich('slime') && !calm, [h, s, l] = calm ? [150, 12, 52] : COLS[ci], [mx, my] = cen(), R = B.R;
      g.save(); g.fillStyle = 'rgba(0,0,0,.35)'; g.filter = 'blur(10px)'; g.translate(5, 12); B.path(g); g.fill(); g.filter = 'none'; g.restore();
      B.path(g);
      const gr = g.createRadialGradient(mx - R * 0.3, my - R * 0.35, R * 0.1, mx, my, R * 1.4);
      if (lux) { const k = t * 30; gr.addColorStop(0, `hsla(${(h + k) % 360},100%,85%,.92)`); gr.addColorStop(0.45, `hsla(${(h + 60 + k) % 360},90%,62%,.8)`); gr.addColorStop(1, `hsla(${(h + 140 + k) % 360},85%,38%,.9)`); }
      else { gr.addColorStop(0, `hsla(${h},${s}%,${l + 18}%,.95)`); gr.addColorStop(0.6, `hsla(${h},${s}%,${l}%,.9)`); gr.addColorStop(1, `hsla(${h},${s}%,${l - 22}%,.95)`); }
      g.fillStyle = gr; g.fill();
      g.save(); g.clip();
      if (lux) { g.globalCompositeOperation = 'lighter'; for (const q of glit) { const [x, y] = at(q.a, q.r), tw = 0.5 + 0.5 * Math.sin(t * 5 + q.s * 40); g.fillStyle = `hsla(${(q.s * 360 + t * 60) % 360},100%,80%,${0.35 + tw * 0.6})`; g.fillRect(x - 1.2, y - 1.2, 2.4, 2.4); } g.globalCompositeOperation = 'source-over'; }
      for (const b of bub) { if (b.g <= 0) continue; const [x, y] = at(b.a, b.r), r = R * b.s * b.g; g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, 7); g.fill(); }
      // glossy wet highlights that slide as it deforms
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = R * 0.06; g.lineCap = 'round'; g.beginPath();
      for (let i = Math.round(B.N * 0.55); i < Math.round(B.N * 0.7); i++) { const p = B.P[i], x = mx + (p.x - mx) * 0.8, y = my + (p.y - my) * 0.8; i === Math.round(B.N * 0.55) ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      g.restore();
      g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(mx - R * 0.3, my - R * 0.42, R * 0.13, R * 0.07, -0.6, 0, 7); g.fill();
    },
  };
}
