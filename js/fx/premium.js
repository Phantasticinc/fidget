// Premium base effects layered on every toy (all scale with q.scale and soften in Calm mode).
import { burst, add, rnd, glowDot, calm } from './skins/kit.js?v=5';
export const shake = { amt: 0, on: true };
const kick = a => { if (shake.on && !calm()) shake.amt = Math.min(10, shake.amt + a); };
const CONF = ['#ff5e7e', '#ffd23f', '#3fd9ff', '#7cff6b', '#c77dff', '#ffffff'];
let glowHue = 0;
export const RAINBOW = { id: 'premium_rainbow', toy: 'sand', premium: true, name: 'Rainbow Sand', blurb: 'Included with Premium: every new mold comes in the next rainbow colour.',
  look: { colors: [[235, 90, 110], [245, 170, 70], [240, 220, 90], [90, 200, 130], [80, 150, 235], [160, 110, 220]], shapes: ['heart', 'star', 'dome', 'ring'] }, on: {},
  preview(g, w, h) { const c = RAINBOW.look.colors; c.forEach((k, i) => { g.fillStyle = `rgb(${k})`; g.fillRect(w * 0.2, h * 0.2 + i * h * 0.1, w * 0.6, h * 0.1); }); } };
export const on = {
  pop(d) {
    burst(calm() ? 4 : 12, { kind: 'confetti', x: d.x, y: d.y, g: 700, drag: 0.97, life: 1.3, size: 3, add: false }, () => { const a = rnd(0, 6.28), v = rnd(120, 340); return { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, vr: rnd(-14, 14), col: CONF[(Math.random() * 6) | 0] }; });
    kick(1.6);
    if (d.streak && d.streak % 10 === 0) { burst(calm() ? 10 : 40, { kind: 'confetti', x: d.x, y: d.y, g: 600, drag: 0.98, life: 2, size: 3.5, add: false }, () => ({ vx: rnd(-420, 420), vy: rnd(-650, -200), vr: rnd(-16, 16), col: CONF[(Math.random() * 6) | 0] })); kick(5); }
  },
  sheet() { if (typeof innerWidth === 'number') burst(calm() ? 12 : 50, { kind: 'confetti', g: 300, drag: 0.99, life: 3, size: 4, add: false }, () => ({ x: rnd(0, innerWidth), y: -10, vx: rnd(-40, 40), vy: rnd(40, 200), vr: rnd(-8, 8), col: CONF[(Math.random() * 6) | 0] })); },
  spinDraw(d) {
    const sp = Math.abs(d.w); if (sp < 4) return;
    const n = Math.min(4, sp / 25) * (calm() ? 0.3 : 1);
    for (let i = 0; i < n; i++) { const a = d.a + rnd(0, 6.28), r = d.R * 0.95, tx = -Math.sin(a) * Math.sign(d.w), ty = Math.cos(a) * Math.sign(d.w), v = Math.min(600, sp * 6);
      add({ kind: 'spark', x: d.cx + Math.cos(a) * r, y: d.cy + Math.sin(a) * r, vx: tx * v, vy: ty * v, drag: 0.9, life: 0.4, size: 1.6, col: `hsl(${40 + Math.random() * 20},100%,70%)` }); }
    glowDot(d.g, d.cx, d.cy, d.R * (1.1 + Math.min(0.5, sp / 120)), 'rgba(255,200,120,.18)', Math.min(1, sp / 60));
  },
  clickDraw(d) { glowHue = (glowHue + 0.6) % 360; const k0 = d.keys[0], k8 = d.keys[8], cx = (k0.x + k8.x + d.size) / 2, cy = (k0.y + k8.y + d.size) / 2; glowDot(d.g, cx, cy, d.size * 2.4, `hsla(${glowHue},100%,60%,.22)`); for (const k of d.keys) if (k.t > 0.3) glowDot(d.g, k.x + d.size / 2, k.y + d.size / 2, d.size * 0.8, `hsla(${(glowHue + k.x) % 360},100%,65%,.5)`, k.t); },
  key(d) { const h = (glowHue + d.i * 40) % 360; burst(1, { kind: 'ring', x: d.x, y: d.y, size: d.size * 0.3, r1: d.size * 2.2, life: 0.55, col: `hsl(${h},100%,65%)`, lw: 3 }); kick(0.6); },
  cut(d) { if (Math.random() < 0.6) add({ kind: 'glow', x: d.x + rnd(-6, 6), y: d.y + rnd(-6, 6), vx: rnd(-20, 20), vy: rnd(-40, -10), drag: 0.95, life: 0.7, size: 3, col: `hsl(${rnd(0, 360)},100%,80%)` }); },
  crumble(d) { burst(calm() ? 1 : 3, { kind: 'glow', x: d.x, y: d.y, g: 120, drag: 0.96, life: 1, size: rnd(2, 5), add: false, col: 'rgba(230,210,180,.6)' }, () => ({ vx: rnd(-70, 70), vy: rnd(-90, -10) })); },
  mold() { kick(3); },
};
export const THEMES = [
  { id: 'default', name: 'Studio', top: '#141518', bot: '#0a0a0c', glow: 'rgba(255,240,220,.075)' },
  { id: 'midnight', name: 'Midnight', premium: true, top: '#0d1430', bot: '#04060f', glow: 'rgba(120,150,255,.14)' },
  { id: 'sunset', name: 'Sunset', premium: true, top: '#3a1630', bot: '#120812', glow: 'rgba(255,140,90,.16)' },
  { id: 'forest', name: 'Forest', premium: true, top: '#0f2419', bot: '#050c08', glow: 'rgba(140,255,170,.10)' },
  { id: 'neon', name: 'Neon', premium: true, top: '#1a0830', bot: '#05010c', glow: 'rgba(255,60,220,.16)' },
];
