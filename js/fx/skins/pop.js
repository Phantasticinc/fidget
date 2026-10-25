// Pop upgrades. Each: own bubble material (look), own burst effect, own sound + haptic.
import { burst, rnd, snd, hap, orb, glowDot, calm } from './kit.js?v=5';
export default [
  { id: 'pop_pack_liquidmetal', toy: 'pop', name: 'Liquid Metal', blurb: 'Mercury bubbles that burst into chrome droplets with a bright metallic ping.',
    look: { tint: [215, 6] },
    on: { pop(d) {
      burst(calm() ? 5 : 14, { kind: 'drop', x: d.x, y: d.y, g: 900, drag: 0.985, life: 0.9, add: false, col: '#a9b0ba', hi: '#ffffff', lo: '#2a2e35' }, () => { const t = rnd(0, 6.28), v = rnd(120, 420); return { vx: Math.cos(t) * v, vy: Math.sin(t) * v - 160, size: rnd(2, d.r * 0.28) }; });
      burst(1, { kind: 'ring', x: d.x, y: d.y, size: d.r * 0.4, r1: d.r * 1.8, life: 0.35, col: 'rgba(230,240,255,.8)', lw: 2.5 });
      snd((s, t, k) => { s.tone(t, s.jit(1900), 1500, 0.35, 0.09 * k, 'sine'); s.tone(t, s.jit(2850), 2400, 0.22, 0.04 * k, 'triangle'); }); hap([10, 20, 6]);
    } },
    preview(g, w, h, t) { for (let i = 0; i < 3; i++) orb(g, w * (0.28 + i * 0.22), h * 0.5 + Math.sin(t * 2 + i) * 4, h * 0.18, '#fff', '#9aa3ae', '#1d2026'); for (let i = 0; i < 6; i++) { const a = t * 3 + i; orb(g, w * 0.72 + Math.cos(a) * h * 0.3, h * 0.5 + Math.sin(a * 1.3) * h * 0.25, 3, '#fff', '#aab', '#333'); } } },
  { id: 'pop_pack_neonjelly', toy: 'pop', name: 'Neon Jelly', blurb: 'Glowing jelly domes that pop into neon rings and sparkles with a bouncy boing.',
    look: { tint: [300, 85] },
    on: { pop(d) {
      const hue = (performance.now() / 20) % 360;
      for (let i = 0; i < 3; i++) burst(1, { kind: 'ring', x: d.x, y: d.y, size: d.r * 0.3, r1: d.r * (1.4 + i * 0.7), life: 0.45 + i * 0.12, col: `hsl(${hue + i * 50},100%,65%)`, lw: 3 });
      burst(calm() ? 4 : 12, { kind: 'glow', x: d.x, y: d.y, drag: 0.93, life: 0.7, col: `hsl(${hue},100%,60%)` }, () => { const a = rnd(0, 6.28), v = rnd(80, 260); return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, size: rnd(4, 9) }; });
      snd((s, t, k) => s.tone(t, s.jit(180), 520, 0.18, 0.16 * k, 'sine')); hap([6, 30, 10]);
    } },
    preview(g, w, h, t) { for (let i = 0; i < 3; i++) { const x = w * (0.28 + i * 0.22), hue = (t * 60 + i * 60) % 360; glowDot(g, x, h * 0.5, h * 0.36, `hsla(${hue},100%,60%,.6)`); orb(g, x, h * 0.5, h * 0.17, `hsl(${hue},100%,90%)`, `hsl(${hue},90%,55%)`, `hsl(${hue},80%,25%)`); } } },
  { id: 'pop_pack_lava', toy: 'pop', name: 'Lava Blisters', blurb: 'Molten bubbles that crack open in embers and rising smoke, with a hot sizzle.',
    look: { tint: [18, 95] },
    on: { pop(d) {
      burst(calm() ? 6 : 18, { kind: 'spark', x: d.x, y: d.y, g: -60, drag: 0.96, life: 0.9, col: '#ffb347' }, () => { const a = rnd(-2.8, -0.3), v = rnd(140, 380); return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, size: rnd(1, 2.4) }; });
      burst(calm() ? 2 : 5, { kind: 'glow', x: d.x, y: d.y, vy: -40, drag: 0.99, life: 1.4, add: false, col: 'rgba(60,50,45,.5)', grow: 2.5 }, () => ({ vx: rnd(-20, 20), size: rnd(6, 12) }));
      burst(1, { kind: 'glow', x: d.x, y: d.y, life: 0.25, size: d.r * 1.6, col: '#ff5a1f' });
      snd((s, t, k) => { s.nz(t, 0.35, 'highpass', 3500, 0.6, 0.1 * k, 0.01); s.nz(t, 0.08, 'lowpass', 300, 1, 0.3 * k); }); hap([18, 40, 8, 40, 5]);
    } },
    preview(g, w, h, t) { for (let i = 0; i < 3; i++) { const x = w * (0.28 + i * 0.22); glowDot(g, x, h * 0.5, h * 0.3, 'rgba(255,90,30,.5)'); orb(g, x, h * 0.5, h * 0.17, '#ffe08a', '#ff6a1f', '#5a1000'); } for (let i = 0; i < 8; i++) { const p = (t * 0.6 + i / 8) % 1; glowDot(g, w * (0.2 + (i * 0.37) % 0.6), h * (0.8 - p * 0.7), 4, '#ffb347', 1 - p); } } },
];
