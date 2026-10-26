// Galaxy signature mechanic: a black hole opens above the sand, bends light, and drags every particle on screen
// into a spiralling accretion disk before swallowing it. Cosmetic only.
import { all, burst, rnd } from '../particles.js?v=5';
import { glow, add } from './env.js?v=1';
import { snd, hap } from '../skins/kit.js?v=6';
let H0 = null;
export const hole = () => H0;
export function open(x, y, dur = 6, big = 1) {
  H0 = { x, y, t: 0, dur, R: 26 * big, eat: 0 };
  snd((s, t, k) => { s.tone(t, 70, 30, dur * 0.6, 0.16 * k, 'sine'); s.tone(t, 140, 61, dur * 0.5, 0.05 * k, 'sawtooth'); s.nz(t, dur * 0.6, 'lowpass', 220, 0.7, 0.12 * k, 0.5); }); hap([40, 60, 40, 60, 120]);
}
export function step(dt, W, H, calm) {
  const h = H0; if (!h) return; h.t += dt; if (h.t > h.dur) { H0 = null; burst(calm ? 10 : 50, { kind: 'glow', x: h.x, y: h.y, life: 1.4, size: 5 }, () => { const a = rnd(0, 6.28), v = rnd(150, 520); return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, col: ['#b49bff', '#ff8fe0', '#8fdcff', '#fff'][(Math.random() * 4) | 0] }; }); return; }
  const k = Math.min(1, h.t / 0.8) * Math.min(1, (h.dur - h.t) / 0.6), G = 90000 * k;
  for (const p of all()) { const dx = h.x - p.x, dy = h.y - p.y, d2 = dx * dx + dy * dy + 400, d = Math.sqrt(d2);
    if (d < h.R * 0.8) { p.life = p.t; h.eat++; continue; }
    const f = G / d2 * dt; p.vx += (dx / d) * f * 60 - (dy / d) * f * 35; p.vy += (dy / d) * f * 60 + (dx / d) * f * 35; p.g = 0; p.floor = null; if (p.life - p.t < 0.6) p.life += 0.5; }
  if (!calm && Math.random() < 0.6 * k) { const a = rnd(0, 6.28), r = Math.max(W, H) * 0.6; burst(1, { kind: 'glow', x: h.x + Math.cos(a) * r, y: h.y + Math.sin(a) * r, life: 4, size: rnd(2, 5), drag: 1 }, () => ({ vx: -Math.sin(a) * 80, vy: Math.cos(a) * 80, col: ['#b49bff', '#ff8fe0', '#8fdcff'][(Math.random() * 3) | 0] })); }
}
export function draw(g, t) {
  const h = H0; if (!h) return; const k = Math.min(1, h.t / 0.8) * Math.min(1, (h.dur - h.t) / 0.6), R = h.R * (0.6 + 0.4 * k) * (1 + Math.min(0.6, h.eat / 400));
  add(g, () => { glow(g, h.x, h.y, R * 7, `rgba(140,90,255,${0.25 * k})`);
    for (let i = 0; i < 3; i++) { g.save(); g.translate(h.x, h.y); g.rotate(t * (1.6 - i * 0.4) + i); g.scale(1, 0.32);
      const gr = g.createRadialGradient(0, 0, R, 0, 0, R * (3.2 - i * 0.5)); gr.addColorStop(0, `rgba(255,240,210,${0.9 * k})`); gr.addColorStop(0.3, `rgba(255,140,220,${0.55 * k})`); gr.addColorStop(1, 'rgba(80,60,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R * (3.2 - i * 0.5), 0, 7); g.fill(); g.restore(); } });
  g.fillStyle = '#000'; g.beginPath(); g.arc(h.x, h.y, R, 0, 7); g.fill(); // event horizon
  g.strokeStyle = `rgba(255,230,200,${0.8 * k})`; g.lineWidth = 1.5; g.beginPath(); g.arc(h.x, h.y, R * 1.12, 0, 7); g.stroke(); // photon ring
}
