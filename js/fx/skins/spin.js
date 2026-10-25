// Spin upgrades: finish (look), speed-driven effect drawn around the live body, own sound/haptic character.
import { add, arc, rnd, snd, hap, orb, glowDot, calm } from './kit.js?v=5';
const tips = (d, k = 1) => [0, 1, 2].map(i => { const t = i * 2.094 - 1.571 + d.a; return [d.cx + Math.cos(t) * d.R * 0.62 * k, d.cy + Math.sin(t) * d.R * 0.62 * k, t]; });
let lastZap = 0;
export default [
  { id: 'spin_plasma', toy: 'spin', name: 'Plasma Core', blurb: 'A glowing reactor core throws electric arcs to the weights. Faster spin, wilder lightning and crackle.',
    look: { base: ['#1a1440', '#07051a'], disc: ['#e9e2ff', '#7a5cff', '#1a0f5a'], drag: 1 },
    on: { spinDraw(d) {
      const sp = Math.min(1, Math.abs(d.w) / 120), g = d.g, now = performance.now();
      glowDot(d.g, d.cx, d.cy, d.R * (0.45 + sp * 0.35), `rgba(140,110,255,${0.35 + sp * 0.4})`, calm() ? 0.4 : 1);
      const n = calm() ? 1 : 1 + Math.round(sp * 3);
      for (const [x, y] of tips(d)) for (let i = 0; i < n; i++) if (Math.random() < 0.35 + sp * 0.6) arc(g, d.cx, d.cy, x + rnd(-6, 6), y + rnd(-6, 6), i ? 'rgba(200,180,255,.6)' : '#cfc2ff', 1 + sp, 8 + sp * 16);
      if (sp > 0.25 && now - lastZap > 140 - sp * 80) { lastZap = now; snd((s, t, k) => s.nz(t, 0.04, 'bandpass', s.jit(5200, 0.3), 4, 0.05 * k * sp)); if (sp > 0.8) hap(3); }
    } },
    preview(g, w, h, t) { const cx = w / 2, cy = h / 2; glowDot(g, cx, cy, h * 0.45, 'rgba(140,110,255,.6)'); for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.094; arc(g, cx, cy, cx + Math.cos(a) * h * 0.38, cy + Math.sin(a) * h * 0.38, '#cfc2ff', 1.4, 9); orb(g, cx + Math.cos(a) * h * 0.38, cy + Math.sin(a) * h * 0.38, h * 0.1, '#fff', '#7a5cff', '#1a0f5a'); } orb(g, cx, cy, h * 0.12, '#fff', '#b9a8ff', '#3a2a9a'); } },
  { id: 'spin_obsidian', toy: 'spin', name: 'Obsidian Ember', blurb: 'Volcanic black glass with dark tungsten-look weights. Throws glowing ember sparks off every lobe.',
    look: { base: ['#24201f', '#050404'], disc: ['#ffd9a0', '#c2410c', '#2a0a00'], drag: 1 },
    on: { spinDraw(d) {
      const sp = Math.min(1, Math.abs(d.w) / 120); if (sp < 0.08) return;
      const dir = Math.sign(d.w);
      for (const [x, y, t] of tips(d, 1.45)) if (Math.random() < sp * (calm() ? 0.25 : 0.9)) {
        const v = 220 + sp * 380; add({ kind: 'spark', x, y, vx: -Math.sin(t) * v * dir + rnd(-40, 40), vy: Math.cos(t) * v * dir + rnd(-40, 40), g: 500, drag: 0.97, life: rnd(0.4, 0.9), size: rnd(1, 2.2), col: Math.random() < 0.3 ? '#fff1c2' : '#ff8a2b' });
      }
      glowDot(d.g, d.cx, d.cy, d.R * 0.3, `rgba(255,120,40,${0.15 + sp * 0.35})`);
      if (Math.random() < sp * 0.15) snd((s, t, k) => s.nz(t, 0.02, 'highpass', 6000, 1, 0.04 * k));
    } },
    preview(g, w, h, t) { const cx = w / 2, cy = h / 2; orb(g, cx, cy, h * 0.36, '#4a4240', '#151110', '#000'); for (let i = 0; i < 10; i++) { const p = (t * 0.9 + i / 10) % 1, a = i * 0.63 + t; glowDot(g, cx + Math.cos(a) * h * (0.35 + p * 0.5), cy + Math.sin(a) * h * (0.35 + p * 0.3), 5, '#ff8a2b', 1 - p); } } },
  { id: 'spin_aurora', toy: 'spin', name: 'Aurora Ribbon', blurb: 'Pearl-white body that paints flowing aurora ribbons as it turns, with a soft glassy shimmer.',
    look: { base: ['#d8dde6', '#6f7889'], disc: ['#ffffff', '#9fe7d6', '#3a5d7a'], drag: 1 },
    on: { spinDraw(d) {
      const sp = Math.min(1, Math.abs(d.w) / 100); if (sp < 0.05) return;
      const hue = (performance.now() / 15) % 360;
      for (const [x, y] of tips(d, 1.2)) if (Math.random() < (calm() ? 0.3 : 1)) add({ kind: 'glow', x, y, life: 0.5 + sp * 0.5, size: 7 + sp * 8, col: `hsl(${(hue + x) % 360},90%,60%)`, a: 0.55 });
      if (Math.random() < sp * 0.04) snd((s, t, k) => s.tone(t, s.jit(1320 + sp * 600), 1320, 0.6, 0.03 * k, 'triangle'));
    } },
    preview(g, w, h, t) { const cx = w / 2, cy = h / 2; for (let j = 0; j < 30; j++) { const a = t * 3 - j * 0.07; for (let i = 0; i < 3; i++) glowDot(g, cx + Math.cos(a + i * 2.094) * h * 0.38, cy + Math.sin(a + i * 2.094) * h * 0.38, 7, `hsla(${(t * 80 + j * 8 + i * 90) % 360},90%,60%,.5)`, 1 - j / 30); } orb(g, cx, cy, h * 0.16, '#fff', '#c9d2e0', '#6f7889'); } },
];
