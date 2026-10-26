// Spin upgrade worlds: Plasma (storm sky whose lightning follows your RPM), Obsidian (forge with heat shimmer + ring of fire),
// Aurora (arctic night: curtains swell with speed, shooting stars at milestones).
import { sky, glow, add, motes, bands, vignette, stars, S } from './env.js?v=1';
import { arc, burst, rnd } from '../particles.js?v=5';
import { snd } from '../skins/kit.js?v=6';
let bolts = [], shoot = [], fire = 0;
function bolt(W, H, col) { bolts.push({ x0: rnd(0, W), y0: -10, x1: rnd(0, W), y1: H * rnd(0.3, 0.7), t: 0, col }); }
function mountains(g, W, H, col, y0, amp, f) { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 10) g.lineTo(x, H * y0 - Math.abs(Math.sin(x * f) * amp + Math.sin(x * f * 2.7) * amp * 0.4)); g.lineTo(W, H); g.fill(); }
export default {
  spin_plasma: { name: 'Plasma', hue: '#9d7bff', confetti: ['#cfc2ff', '#9d7bff', '#ffffff'], titles: ['SUPERCELL', 'THUNDERSTRUCK', 'ION STORM', 'TESLA OVERLOAD'],
    back(g, W, H, t, e, c, dt) { sky(g, W, H, '#140a2c', '#030108'); bands(g, W, H, t * 0.5, [265, 285, 250], { y0: 0.1, amp: 40, a: 0.08 + e * 0.1, sat: 50, lit: 40, h: 0.35 });
      if (Math.random() < (0.004 + e * 0.06) * (c.calm ? 0.15 : 1)) bolt(W, H, Math.random() < 0.5 ? '#e7ddff' : '#9d7bff');
      add(g, () => { for (const b of bolts) { b.t += dt; const k = 1 - b.t / 0.25; if (k > 0) { glow(g, b.x1, b.y1, 120 * k, `rgba(160,130,255,${0.4 * k})`); arc(g, b.x0, b.y0, b.x1, b.y1, b.col, 2.5 * k + 0.5, 40, 0); } } }); bolts = bolts.filter(b => b.t < 0.25);
      if (bolts.length && !c.calm) { g.fillStyle = `rgba(200,180,255,${0.05 * bolts.length})`; g.fillRect(0, 0, W, H); }
      motes(g, W, H, t, { count: 24, col: '200,180,255', vy: -6, size: 1.4, sway: 40 }); vignette(g, W, H, 0.5); },
    milestone(lv, c) { for (let i = 0; i < 10; i++) setTimeout(() => bolt(c.W, c.H, '#ffffff'), i * 70); snd((s, t, k) => { s.nz(t, 1.6, 'lowpass', 300, 0.7, 0.3 * k, 0.02); s.nz(t, 0.3, 'highpass', 3000, 1, 0.1 * k); }); } },
  spin_obsidian: { name: 'Obsidian', hue: '#ff7a1a', confetti: ['#ff7a1a', '#ffb060', '#1a1214'], titles: ['FORGED', 'WHITE HEAT', 'RING OF FIRE', 'VOLCANIC'],
    enter() { fire = 0; },
    back(g, W, H, t, e, c) { sky(g, W, H, '#170806', '#030101'); mountains(g, W, H, '#0c0505', 0.86, 40, 0.012);
      add(g, () => { glow(g, W / 2, H * 0.47, W * (0.6 + e * 0.5), `rgba(255,90,10,${0.1 + e * 0.3})`); bands(g, W, H, t * 2, [18, 28], { y0: 0.7, amp: 8, a: 0.05 + e * 0.12, h: 0.3 }); });
      motes(g, W, H, t, { count: c.calm ? 25 : 30 + e * 70, col: '255,150,50', vy: c.calm ? -20 : -30 - e * 120, size: 1.4, sway: 20 }); },
    front(g, W, H, t, e, c, dt) { if (fire > 0) { fire -= dt; const k = fire / 2.5, R = Math.min(W, H) * (0.55 - 0.15 * k); add(g, () => { for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283 + t, fl = 0.7 + 0.3 * Math.sin(t * 20 + i * 3); glow(g, W / 2 + Math.cos(a) * R, H * 0.47 + Math.sin(a) * R, 26 * fl * k + 6, `rgba(255,${100 + 80 * fl | 0},20,${0.6 * k})`); } }); } vignette(g, W, H, 0.5); },
    milestone() { fire = 2.5; snd((s, t, k) => { s.nz(t, 2, 'bandpass', 600, 0.6, 0.18 * k, 0.1); s.tone(t, 55, 40, 1.5, 0.2 * k, 'sine'); }); } },
  spin_aurora: { name: 'Aurora', hue: '#7dffd8', confetti: ['#7dffd8', '#8affb0', '#b48cff', '#ffffff'], titles: ['NORTHERN LIGHTS', 'SOLAR WIND', 'POLAR CROWN', 'CELESTIAL'],
    enter() { shoot = []; },
    back(g, W, H, t, e, c, dt) { sky(g, W, H, '#03121c', '#010407'); stars(g, W, H * 0.7, t, 150, '230,245,255', 1);
      add(g, () => bands(g, W, H, t, [150, 170, 280], { y0: 0.12, amp: 34 + e * 30, a: 0.06 + e * 0.22, h: 0.45 }));
      if (Math.random() < 0.002 + e * 0.01) shoot.push({ x: rnd(0, W), y: rnd(0, H * 0.3), t: 0 });
      add(g, () => { g.lineWidth = 2; for (const s of shoot) { s.t += dt; const k = 1 - s.t / 0.8, x = s.x + s.t * 500, y = s.y + s.t * 220; g.strokeStyle = `rgba(255,255,255,${k})`; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 60, y - 26); g.stroke(); } }); shoot = shoot.filter(s => s.t < 0.8);
      mountains(g, W, H, '#06141c', 0.9, 60, 0.01); mountains(g, W, H, '#0b1f2a', 0.95, 30, 0.02); motes(g, W, H, t, { count: 40, col: '235,245,255', vy: 18, size: 1.5, sway: 20, glowy: false }); },
    front(g, W, H) { vignette(g, W, H, 0.35); },
    milestone(lv, c) { for (let i = 0; i < 9; i++) setTimeout(() => shoot.push({ x: rnd(-100, c.W * 0.7), y: rnd(0, c.H * 0.3), t: 0 }), i * 90); } },
};
