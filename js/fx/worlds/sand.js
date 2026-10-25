// Sand upgrade worlds: Galaxy (deep space + BLACK HOLE that swallows particles), Glow Tide (moonlit bioluminescent beach,
// tide surges), Gold Rush (golden-hour canyon, pinch nuggets out of the sand into your stash, mother-lode showers).
import { sky, glow, add, motes, bands, rays, vignette, stars, S } from './env.js?v=1';
import { burst, rnd } from '../particles.js?v=5';
import * as BH from './blackhole.js?v=1';
import * as AU from './gold.js?v=1';
let tide = 0, tears = 0;
export default {
  sand_galaxy: { name: 'Galaxy Sand', hue: '#9d7bff', confetti: ['#b49bff', '#ff8fe0', '#8fdcff', '#ffffff'], titles: ['EVENT HORIZON', 'SUPERNOVA', 'SINGULARITY', 'COSMIC DUST'],
    back(g, W, H, t, e, c, dt) { sky(g, W, H, '#07051a', '#010006'); add(g, () => { bands(g, W, H, t * 0.3, [270, 310, 220], { y0: 0.2, amp: 60, a: 0.07 + e * 0.08, h: 0.6, lit: 55 }); glow(g, W * 0.2, H * 0.25, W * 0.5, 'rgba(255,80,200,.08)'); glow(g, W * 0.85, H * 0.7, W * 0.5, 'rgba(70,140,255,.08)'); });
      stars(g, W, H, t, 220, '230,235,255', 3); BH.step(dt, W, H, c.calm); },
    front(g, W, H, t) { BH.draw(g, t); vignette(g, W, H, 0.4); },
    on: { tear() { if (++tears % 3 === 0 && !BH.hole()) BH.open(innerWidth / 2, innerHeight * 0.2, 5, 0.8); }, mold() { if (!BH.hole()) BH.open(innerWidth / 2, innerHeight * 0.2, 3.5, 0.6); } },
    milestone(lv, c) { BH.open(c.W / 2, c.H * 0.2, 7, 1 + Math.min(1, lv * 0.15)); } },
  sand_glowtide: { name: 'Glow Tide', hue: '#5fffe0', confetti: ['#5fffe0', '#9ffff0', '#ffffff'], titles: ['HIGH TIDE', 'MOONRISE', 'PLANKTON BLOOM', 'NIGHT SURF'],
    back(g, W, H, t, e) { tide *= 0.985; sky(g, W, H, '#03101c', '#010507'); stars(g, W, H * 0.5, t, 90, '220,240,255', 1); glow(g, W * 0.78, H * 0.12, 90, 'rgba(230,245,255,.35)'); g.fillStyle = '#eaf6ff'; g.beginPath(); g.arc(W * 0.78, H * 0.12, 18, 0, 7); g.fill();
      for (let b = 0; b < 4; b++) { const y = H * (0.8 + b * 0.05) - tide * 50; g.fillStyle = `rgba(6,${30 + b * 10},${45 + b * 8},.9)`; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 14) g.lineTo(x, y + Math.sin(x / 60 + t * (1 + b * 0.3) + b) * 6); g.lineTo(W, H); g.fill();
        add(g, () => { g.strokeStyle = `rgba(90,255,225,${0.25 + e * 0.4 + tide * 0.5})`; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= W; x += 14) g.lineTo(x, y + Math.sin(x / 60 + t * (1 + b * 0.3) + b) * 6); g.stroke(); }); }
      motes(g, W, H * 0.8, t, { count: 30, col: '120,255,200', vy: -6, size: 1.6, sway: 30 }); },
    front(g, W, H) { vignette(g, W, H, 0.45); },
    on: { splat() { tide = Math.min(1, tide + 0.15); } },
    milestone(lv, c) { tide = 1.6; burst(60, { kind: 'glow', life: 2.2, size: 5, drag: 0.98, g: -40 }, () => ({ x: rnd(0, c.W), y: c.H * rnd(0.75, 1), vx: rnd(-30, 30), vy: rnd(-200, -60), col: '#5fffe0' })); } },
  sand_goldrush: { name: 'Gold Rush', hue: '#ffd76a', confetti: ['#ffd76a', '#fff2b8', '#c8922a'], titles: ['MOTHER LODE', 'EUREKA!', 'GOLD FEVER', 'BONANZA'],
    back(g, W, H, t, e) { sky(g, W, H, '#3a1e0b', '#0e0603'); add(g, () => { rays(g, W * 0.5, H * 0.05, W, H, t, 'rgba(255,200,110,A)', 0.8 + e, 11); glow(g, W / 2, H * 0.05, W * 0.6, 'rgba(255,190,90,.25)'); });
      g.fillStyle = '#1d0e05'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 8) g.lineTo(x, H * 0.86 - Math.abs(Math.sin(x * 0.018)) * 50 - (x % 40 < 20 ? 6 : 0)); g.lineTo(W, H); g.fill(); // canyon mesas
      motes(g, W, H, t, { count: 50, col: '255,215,120', vy: -6, size: 1.3, sway: 26 }); },
    front(g, W, H, t, e, c, dt) { AU.draw(g, W, H, t, dt, c.calm); vignette(g, W, H, 0.35); },
    on: { grab: AU.onGrab, tear: AU.onTear },
    milestone(lv, c) { AU.collect(3 + Math.min(7, lv), c.W / 2, c.H * 0.5); burst(80, { kind: 'confetti', g: 500, drag: 0.98, life: 2.4, size: 3, add: false }, () => ({ x: c.W / 2, y: c.H * 0.5, vx: rnd(-500, 500), vy: rnd(-800, -200), vr: rnd(-14, 14), col: Math.random() < .5 ? '#ffd76a' : '#fff2b8' })); } },
};
