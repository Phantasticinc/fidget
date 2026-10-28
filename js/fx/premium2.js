// Rich-look particle fx for the Cube. Gated per event by d.rich (Premium, a cube look, or a timed preview); d.look picks the effect.
import { burst, rnd } from './particles.js?v=5';
import { opts } from '../feel.js?v=6';
const k = () => (opts.calm ? 0.3 : 1), hue = () => `hsl(${(performance.now() / 12) % 360},100%,68%)`;
const ring = (d, r1, col) => burst(1, { kind: 'ring', x: d.x, y: d.y, size: 4, r1, life: 0.5, col, lw: 3 });
const spray = (d, n, o, vel = [150, 320]) => burst(n * k(), { x: d.x, y: d.y, ...o }, () => { const a = rnd(0, 6.28), v = rnd(vel[0], vel[1]); return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, ...(o.colf ? { col: o.colf() } : {}) }; });
export const on = {
  cube(d) {
    if (d.look === 'brass') { // gold flakes tumble down + a puff of steam
      burst(7 * k(), { kind: 'confetti', x: d.x, y: d.y, g: 520, drag: 0.97, life: 1.2, size: 2.6, add: false }, () => ({ vx: rnd(-120, 120), vy: rnd(-260, -80), vr: rnd(-12, 12), col: ['#ffd76a', '#e0b04a', '#fff1b8'][Math.floor(rnd(0, 3))] }));
      burst(4 * k(), { kind: 'glow', x: d.x, y: d.y - 10, drag: 0.96, life: 1.1, size: 9, g: -60, col: 'rgba(235,235,225,.5)' }, () => ({ vx: rnd(-30, 30), vy: rnd(-90, -30) }));
    } else if (d.look === 'frost') { // ice shards burst out, snowflakes drift down, a cold ring
      ring(d, 46, 'rgba(210,240,255,.9)');
      spray(d, 6, { kind: 'spark', drag: 0.88, life: 0.45, size: 2.2, col: '#e8f8ff' }, [200, 380]);
      burst(5 * k(), { kind: 'glow', x: d.x, y: d.y, g: 40, drag: 0.98, life: 2, size: 3, col: '#ffffff' }, () => ({ vx: rnd(-50, 50), vy: rnd(-40, 20) }));
    } else spray(d, 6, { kind: 'spark', drag: 0.9, life: 0.35, size: 2, colf: hue });
  },
};
