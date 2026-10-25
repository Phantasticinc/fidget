// Click upgrade worlds: Crystal (geode cave of glowing shards that ring with each key), Holo (cyber data-rain + scan sweep),
// Walnut (cozy desk at night: lamp pool, dust in the beam, warm paper flurry at milestones).
import { sky, glow, add, motes, rays, vignette, S, n } from './env.js?v=1';
import { burst, rnd } from '../particles.js?v=5';
let ring = 0, scan = -1, lamp = 0;
const GL = 'アイウエオカキクケコ01ABCDEF<>/{}#';
export default {
  click_crystal: { name: 'Crystal', hue: '#bfe9ff', confetti: ['#bfe9ff', '#e2c6ff', '#ffffff'], titles: ['RESONANCE', 'PRISMATIC', 'GEODE HEART', 'CRYSTAL CHOIR'],
    back(g, W, H, t, e) { ring *= 0.92; sky(g, W, H, '#0a0f1f', '#020308');
      for (let i = 0; i < 16; i++) { const [u, v, p, s] = S[i], x = u * W, base = i % 2 ? 0 : H, h = H * (0.12 + s * 0.2), w = 14 + p * 22, up = base ? -1 : 1, hue = 190 + p * 100;
        g.fillStyle = `hsla(${hue},70%,${18 + ring * 30 + e * 10}%,.9)`; g.beginPath(); g.moveTo(x - w, base); g.lineTo(x + w * 0.2 * (v - 0.5), base + up * h); g.lineTo(x + w, base); g.fill();
        add(g, () => glow(g, x, base + up * h * 0.6, w * 2.5, `hsla(${hue},90%,70%,${0.08 + ring * 0.25})`)); }
      motes(g, W, H, t, { count: 40, col: '200,230,255', vy: -5, size: 1.2, sway: 10 }); },
    front(g, W, H) { vignette(g, W, H, 0.45); },
    on: { key() { ring = Math.min(1, ring + 0.35); } },
    milestone(lv, c) { ring = 1.5; burst(60, { kind: 'glow', x: c.W / 2, y: c.H * 0.47, life: 1.6, size: 5 }, () => { const a = rnd(0, 6.28), v = rnd(200, 600); return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, col: `hsl(${rnd(180, 300)},90%,75%)` }; }); } },
  click_holo: { name: 'Holo', hue: '#56f0ff', confetti: ['#56f0ff', '#b46bff', '#ff5ef0'], titles: ['ACCESS GRANTED', 'OVERCLOCK', 'SYSTEM SYNC', 'HYPERLINK'],
    back(g, W, H, t, e) { sky(g, W, H, '#020b14', '#010204'); g.font = '12px monospace'; const cols = n(Math.floor(W / 16));
      for (let i = 0; i < cols; i++) { const [u, v, p] = S[i % S.length], x = i * 16 + 4, sp = 40 + p * 120 + e * 160, y0 = (v * H + t * sp) % (H + 200) - 100;
        for (let j = 0; j < 10; j++) { const a = (1 - j / 10) * (0.35 + e * 0.4); g.fillStyle = j ? `rgba(86,240,255,${a})` : `rgba(220,255,255,${a + 0.3})`; g.fillText(GL[(i * 7 + j * 3 + Math.floor(t * 8)) % GL.length], x, y0 - j * 14); } }
      g.strokeStyle = 'rgba(86,240,255,.06)'; g.lineWidth = 1; g.beginPath(); for (let y = 0; y < H; y += 3) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke(); },
    front(g, W, H, t, e, c, dt) { if (scan >= 0) { scan += dt * 1.4; if (scan > 1.2) scan = -1; else add(g, () => { const y = scan * H; const gr = g.createLinearGradient(0, y - 60, 0, y + 6); gr.addColorStop(0, 'rgba(86,240,255,0)'); gr.addColorStop(1, 'rgba(86,240,255,.5)'); g.fillStyle = gr; g.fillRect(0, y - 60, W, 66); }); } vignette(g, W, H, 0.4); },
    milestone() { scan = 0; } },
  click_walnut: { name: 'Walnut', hue: '#ffbf73', confetti: ['#f3e3c3', '#e0c79a', '#ffbf73'], titles: ['CRAFTSMAN', 'TYPEWRITER', 'FINE GRAIN', 'MASTER KEYS'],
    back(g, W, H, t, e) { lamp *= 0.97; sky(g, W, H, '#1c120b', '#070403');
      g.fillStyle = 'rgba(70,42,22,.6)'; for (let i = 0; i < 18; i++) g.fillRect(0, H * 0.78 + i * 6, W, 1 + (i % 3)); // desk grain
      add(g, () => { rays(g, W * 0.82, -20, W, H, t, 'rgba(255,200,120,A)', 0.6 + lamp, 5); glow(g, W * 0.6, H * 0.5, W * (0.7 + lamp * 0.3), `rgba(255,170,90,${0.12 + lamp * 0.2 + e * 0.06})`); });
      motes(g, W, H, t, { count: 45, col: '255,220,170', vy: -4, size: 1.3, sway: 14 }); },
    front(g, W, H) { vignette(g, W, H, 0.55); },
    milestone(lv, c) { lamp = 1; burst(50, { kind: 'confetti', g: 140, drag: 0.985, life: 3.4, size: 5, add: false }, () => ({ x: rnd(0, c.W), y: -10, vx: rnd(-40, 40), vy: rnd(30, 120), vr: rnd(-4, 4), col: ['#f3e3c3', '#e9d6ae', '#fff7e6'][(Math.random() * 3) | 0] })); } },
};
