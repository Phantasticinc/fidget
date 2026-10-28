// Rich-look particle fx for the v2 toys. Gated per event by d.rich (Premium, that toy's upgrade, or a timed preview).
import { burst, rnd } from './particles.js?v=5';
import { opts } from '../feel.js?v=6';
const k = () => (opts.calm ? 0.3 : 1), hue = () => `hsl(${(performance.now() / 12) % 360},100%,68%)`;
const ring = (d, r1, col) => burst(1, { kind: 'ring', x: d.x, y: d.y, size: 4, r1, life: 0.5, col, lw: 3 });
export const on = {
  popit(d) { burst(8 * k(), { kind: 'glow', x: d.x, y: d.y, drag: 0.9, life: 0.5, size: 7 }, () => { const a = rnd(0, 6.28), v = rnd(60, 200); return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, col: `hsl(${d.h || 0},100%,70%)` }; }); ring(d, d.r * 1.8, `hsl(${d.h || 0},100%,75%)`); },
  popitFlip(d) { burst(40 * k(), { kind: 'confetti', g: 500, drag: 0.98, life: 1.8, size: 3.5, add: false }, () => ({ x: rnd(0, innerWidth), y: -10, vx: rnd(-60, 60), vy: rnd(60, 260), vr: rnd(-10, 10), col: hue() })); },
  slime(d) { burst(10 * k(), { kind: 'glow', x: d.x, y: d.y, drag: 0.93, life: 0.9, size: 3 }, () => { const a = rnd(0, 6.28), v = rnd(30, 160); return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, col: hue() }; }); },
  slimePop(d) { ring(d, 26, '#fff'); burst(6 * k(), { kind: 'spark', x: d.x, y: d.y, drag: 0.9, life: 0.3, size: 1.5, col: '#fff' }, () => { const a = rnd(0, 6.28); return { vx: Math.cos(a) * 220, vy: Math.sin(a) * 220 }; }); },
  squish(d) { ring(d, d.r * 1.25, hue()); burst(12 * k(), { kind: 'glow', x: d.x, y: d.y, drag: 0.94, life: 1.1, size: 5 }, () => { const a = rnd(0, 6.28), v = rnd(40, 180); return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, col: hue() }; }); },
  cube(d) { burst(6 * k(), { kind: 'spark', x: d.x, y: d.y, drag: 0.9, life: 0.35, size: 2, col: hue() }, () => { const a = rnd(0, 6.28), v = rnd(150, 320); return { vx: Math.cos(a) * v, vy: Math.sin(a) * v }; }); },
  switch(d) { if (d.on) { ring(d, 70, hue()); burst(8 * k(), { kind: 'glow', x: d.x, y: d.y - 30, drag: 0.95, life: 1, size: 6, g: -40 }, () => ({ vx: rnd(-50, 50), vy: rnd(-80, -10), col: hue() })); } },
  switchAll() { burst(60 * k(), { kind: 'confetti', g: 400, drag: 0.98, life: 2.2, size: 3.5, add: false }, () => ({ x: rnd(0, innerWidth), y: -10, vx: rnd(-60, 60), vy: rnd(60, 240), vr: rnd(-10, 10), col: hue() })); },
};
