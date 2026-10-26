// Pop upgrade worlds: Liquid Metal (chrome studio + growing mirror pool), Neon Jelly (synthwave grid that beats with pops),
// Lava (volcanic cave: drops land molten, glow, cool and crack into obsidian; milestones erupt).
import { sky, glow, add, motes, rays, vignette, stars, S } from './env.js?v=1';
import { burst, rnd } from '../particles.js?v=5';
import { snd } from '../skins/kit.js?v=6';
let pool = 0, poolRip = [], beat = 0, rocks = [];
export default {
  pop_pack_liquidmetal: { name: 'Liquid Metal', hue: '#dfe8f5', confetti: ['#ffffff', '#c9d3e0', '#8a95a5'], titles: ['MERCURY RISING', 'CHROME FLOOD', 'QUICKSILVER', 'LIQUID MIRROR'],
    enter() { pool = 0; poolRip = []; },
    back(g, W, H, t, e) { sky(g, W, H, '#1b1f26', '#07080a');
      for (let i = 0; i < 7; i++) { const x = ((t * 40 + i * W / 6) % (W * 1.4)) - W * 0.2; const gr = g.createLinearGradient(x - 60, 0, x + 60, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(220,230,245,${0.035 + e * 0.05})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - 60, 0, 120, H); }
      motes(g, W, H, t, { count: 30, col: '210,220,235', vy: 60, size: 1.6, sway: 4, glowy: false }); },
    front(g, W, H, t, e, c, dt) { const ph = Math.min(H * 0.1, 8 + pool * 0.9), y = H - ph * 0.5; // mirror pool fills from the bottom as you pop
      const gr = g.createLinearGradient(0, H - ph, 0, H); gr.addColorStop(0, 'rgba(240,246,255,.55)'); gr.addColorStop(0.3, 'rgba(150,160,175,.55)'); gr.addColorStop(1, 'rgba(40,45,52,.7)'); g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 12) { let d = 0; for (const r of poolRip) d += Math.sin((x - r.x) / 14 - r.t * 10) * 4 * Math.exp(-Math.abs(x - r.x) / 90 - r.t * 2); g.lineTo(x, H - ph + d + Math.sin(x / 40 + t * 2) * 1.5); } g.lineTo(W, H); g.fill();
      poolRip = poolRip.filter(r => (r.t += dt || 1 / 60) < 2); vignette(g, W, H, 0.35); },
    on: { pop(d) { pool = Math.min(120, pool + 0.6); poolRip.push({ x: d.x, t: 0 }); if (poolRip.length > 6) poolRip.shift(); } },
    milestone(lv, c) { burst(90, { kind: 'drop', g: 900, drag: 0.99, life: 2.6, add: false, fade: false, hi: '#fff', col: '#b9c3d0', lo: '#2b3036' }, () => ({ x: rnd(0, c.W), y: -20, vx: rnd(-40, 40), vy: rnd(100, 400), size: rnd(3, 9), floor: c.H - rnd(4, 30) })); pool += 8; } },
  pop_pack_neonjelly: { name: 'Neon Jelly', hue: '#ff4dd2', confetti: ['#ff4dd2', '#3ff7ff', '#fff36b'], titles: ['JELLY JAM', 'NEON NIGHTS', 'SYNTH OVERDRIVE', 'LASER PARTY'],
    back(g, W, H, t, e, c, dt) { beat *= Math.pow(0.9, (dt || 1 / 60) * 60); sky(g, W, H, '#1a0633', '#05010d');
      const hy = H * 0.58; glow(g, W / 2, hy, W * 0.45, `rgba(255,80,200,${0.25 + e * 0.3})`); // synth sun
      g.save(); g.beginPath(); g.arc(W / 2, hy, W * 0.2, Math.PI, 0); g.clip(); const sg = g.createLinearGradient(0, hy - W * 0.2, 0, hy); sg.addColorStop(0, '#ffe36b'); sg.addColorStop(1, '#ff3fa0'); g.fillStyle = sg; g.fillRect(0, hy - W * 0.2, W, W * 0.2); g.fillStyle = '#1a0633'; for (let i = 0; i < 6; i++) g.fillRect(0, hy - i * 9 - 4, W, 2 + i * 0.6); g.restore();
      add(g, () => { g.strokeStyle = `rgba(63,247,255,${0.35 + beat * 0.5 + e * 0.2})`; g.lineWidth = 1 + beat * 2; g.beginPath();
        for (let i = -12; i <= 12; i++) { g.moveTo(W / 2 + i * 8, hy); g.lineTo(W / 2 + i * W * 0.18, H); }
        const off = (t * (0.6 + e * 2)) % 1; for (let j = 0; j < 12; j++) { const z = (j + off) / 12, y = hy + (H - hy) * z * z; g.moveTo(0, y); g.lineTo(W, y); } g.stroke(); });
      motes(g, W, H * 0.55, t, { count: 30, col: '255,120,230', vy: -10, size: 2, sway: 30 }); },
    front(g, W, H) { vignette(g, W, H, 0.4); },
    on: { pop() { beat = 1; } },
    milestone(lv, c) { const t0 = performance.now(); for (let i = 0; i < 8; i++) setTimeout(() => burst(14, { kind: 'spark', x: c.W / 2, y: c.H * 0.58, life: 0.9, size: 2.5, drag: 1 }, k => { const a = Math.PI + (k / 14) * Math.PI; return { vx: Math.cos(a) * 700, vy: Math.sin(a) * 700, col: i % 2 ? '#3ff7ff' : '#ff4dd2' }; }), i * 110); beat = 2; } },
  pop_pack_lava: { name: 'Lava', hue: '#ff6a00', confetti: ['#ffd040', '#ff8a00', '#ff3a00', '#2d2120'], titles: ['ERUPTION!', 'MAGMA SURGE', 'MOLTEN CORE', 'PYROCLASM'],
    enter() { rocks = []; },
    back(g, W, H, t, e) { sky(g, W, H, '#1c0603', '#050101');
      g.fillStyle = '#0b0302'; g.beginPath(); g.moveTo(0, H * 0.3); for (let x = 0; x <= W; x += 30) g.lineTo(x, H * 0.22 + Math.sin(x * 0.05) * 20 + Math.sin(x * 0.13) * 10); g.lineTo(W, 0); g.lineTo(0, 0); g.fill(); // cave ceiling
      add(g, () => { glow(g, W / 2, H * 1.02, W * (0.9 + e * 0.3), `rgba(255,${70 + e * 60},0,${0.35 + e * 0.25})`);
        for (let b = 0; b < 3; b++) { g.fillStyle = `rgba(255,${90 + b * 50},0,${0.18 - b * 0.04})`; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 16) g.lineTo(x, H * (0.92 - b * 0.02) + Math.sin(x / 50 + t * (1 + b) + b) * 6); g.lineTo(W, H); g.fill(); } });
      motes(g, W, H, t, { count: 50 + e * 40, col: '255,140,40', vy: -40, size: 1.6, sway: 24 }); },
    front(g, W, H, t, e, c, dt) { // molten drops on the floor: white-hot → orange → dark crust → cracked obsidian
      for (const r of rocks) { r.age += dt; const k = Math.min(1, r.age / 5), hot = 1 - k;
        g.fillStyle = k < 1 ? `rgb(${40 + 215 * hot | 0},${25 + 160 * hot * hot | 0},${15 + 80 * hot * hot * hot | 0})` : '#120c10';
        g.beginPath(); g.ellipse(r.x, r.y, r.r, r.r * 0.45, 0, 0, 7); g.fill();
        if (hot > 0.05) add(g, () => glow(g, r.x, r.y, r.r * 3, `rgba(255,120,0,${0.5 * hot})`));
        if (k > 0.6) { g.strokeStyle = `rgba(255,${80 + 80 * hot | 0},30,${Math.min(1, (k - 0.6) * 3) * (0.25 + 0.6 * hot)})`; g.lineWidth = 0.8; g.beginPath(); for (const [a, l] of r.cr) { g.moveTo(r.x, r.y); g.lineTo(r.x + Math.cos(a) * r.r * l, r.y + Math.sin(a) * r.r * 0.45 * l); } g.stroke();
          g.fillStyle = 'rgba(170,160,200,.35)'; g.beginPath(); g.ellipse(r.x - r.r * 0.3, r.y - r.r * 0.15, r.r * 0.25, r.r * 0.08, -0.2, 0, 7); g.fill(); } } // glassy obsidian glint
      vignette(g, W, H, 0.45); },
    on: { pop(d) { if (rocks.length > 45) rocks.shift(); rocks.push({ x: d.x + rnd(-d.r, d.r), y: d.y + d.r * rnd(1.1, 2.2), r: rnd(4, 9), age: 0, cr: Array.from({ length: 5 }, () => [rnd(0, 6.28), rnd(0.5, 1)]) }); } },
    milestone(lv, c) { for (let i = 0; i < 4; i++) setTimeout(() => burst(40, { kind: 'glow', x: c.W * rnd(0.3, 0.7), y: c.H, g: 700, drag: 0.99, life: 2.8, cols: ['#fff6c0', '#ffd040', '#ff8a00', '#b52500', '#2d2120'], fade: false }, () => ({ vx: rnd(-200, 200), vy: rnd(-1100, -600), size: rnd(4, 10) })), i * 160);
      snd((s, t, k) => { s.tone(t, 60, 28, 1.4, 0.25 * k, 'sine'); s.nz(t, 1.4, 'lowpass', 400, 0.7, 0.2 * k, 0.05); }); } },
};
