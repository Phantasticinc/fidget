// Premium worlds: the Premium aura used on any toy without an equipped upgrade.
import { sky, glow, add, motes, bands, vignette } from './env.js?v=1';
import { burst, rnd } from '../particles.js?v=5';
const prism = (g, W, H, t, e, a) => { add(g, () => bands(g, W, H, t * 0.6, [(t * 30) % 360, (t * 30 + 120) % 360, (t * 30 + 240) % 360], { y0: 0.08, amp: 30, a: a + e * 0.1, h: 0.4 })); motes(g, W, H, t, { count: 30, col: '255,255,255', vy: -8, size: 1.3, sway: 20 }); };
const rainbow = c => burst(80, { kind: 'confetti', g: 300, drag: 0.99, life: 3, size: 4, add: false }, () => ({ x: rnd(0, c.W), y: -10, vx: rnd(-50, 50), vy: rnd(60, 240), vr: rnd(-10, 10), col: `hsl(${rnd(0, 360)},90%,65%)` }));
export default {
  _premium: { name: 'Premium', hue: '#ffd23f', titles: ['ON FIRE', 'UNSTOPPABLE', 'LEGENDARY', 'GODLIKE'],
    back(g, W, H, t, e) { if (e > 0.02) prism(g, W, H, t, e, 0.02); }, milestone(lv, c) { rainbow(c); } },
};
