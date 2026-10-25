// Sand upgrades: sand colours + molds (look), per-frame surface effect sampled from the heightfield, cut/crumble fx + voice.
import { burst, add, rnd, snd, hap, glowDot, calm } from './kit.js';
const STARS = Array.from({ length: 140 }, () => [Math.random(), Math.random(), Math.random() * 6.28, 0.6 + Math.random() * 1.6]);
const trail = [];
function onSand(d, u, v) { const x = (u * d.G.gw) | 0, y = (v * d.G.gh) | 0; return d.G.h[y * d.G.gw + x] > 0.12; }
export default [
  { id: 'sand_galaxy', toy: 'sand', name: 'Galaxy Sand', blurb: 'Deep-space sand full of twinkling stars. Cuts release swirling nebula dust; molds include a ringed planet.',
    look: { colors: [[52, 34, 96], [24, 40, 92], [80, 26, 84]], shapes: ['planet', 'star', 'dome', 'ring'] },
    on: {
      sandDraw(d) { const g = d.g, t = performance.now() / 1000; g.globalCompositeOperation = 'lighter';
        for (const [u, v, p, s] of STARS) if (onSand(d, u, v)) { const a = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.5 + p)); g.globalAlpha = a; g.fillStyle = s > 1.8 ? '#ffe9c4' : '#cfe0ff'; g.fillRect(d.bx + u * d.G.gw * d.cs, d.by + v * d.G.gh * d.cs, s, s); }
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; },
      cut(d) { burst(calm() ? 1 : 3, { kind: 'glow', x: d.x, y: d.y, drag: 0.97, life: 1.6, a: 0.45 }, () => ({ vx: rnd(-40, 40), vy: rnd(-40, 40), size: rnd(10, 22), grow: 1.5, col: ['#7b4dff', '#ff4dc4', '#4dc3ff'][(Math.random() * 3) | 0] })); if (Math.random() < 0.3) snd((s, t, k) => s.tone(t, s.jit(2400, 0.2), 3200, 0.4, 0.02 * k, 'sine')); },
      crumble(d) { burst(calm() ? 1 : 2, { kind: 'glow', x: d.x, y: d.y, life: 1.2, size: 6, col: '#fff' }, () => ({ vx: rnd(-80, 80), vy: rnd(-80, 80) })); },
      mold() { hap([10, 40, 10]); snd((s, t, k) => { s.tone(t, 330, 660, 0.8, 0.05 * k, 'sine'); s.tone(t + 0.1, 495, 990, 0.7, 0.03 * k, 'sine'); }); },
    },
    preview(g, w, h, t) { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h * 0.5); gr.addColorStop(0, '#4a2f8a'); gr.addColorStop(1, '#140c2e'); g.fillStyle = gr; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.4, h * 0.38, 0, 0, 7); g.fill(); for (let i = 0; i < 40; i++) { const [u, v, p] = STARS[i]; g.globalAlpha = Math.abs(Math.sin(t * 2 + p)); g.fillStyle = '#fff'; g.fillRect(w * (0.15 + u * 0.7), h * (0.18 + v * 0.64), 1.6, 1.6); } g.globalAlpha = 1; glowDot(g, w * 0.7, h * 0.4, h * 0.3, 'rgba(255,77,196,.35)'); } },
  { id: 'sand_glowtide', toy: 'sand', name: 'Glow Tide', blurb: 'Bioluminescent beach sand: every cut glows cyan and slowly fades like a night tide, with a soft watery fizz.',
    look: { colors: [[30, 70, 80], [20, 52, 70]], shapes: ['dome', 'brick', 'ring', 'heart'] },
    on: {
      sandDraw(d) { const g = d.g, now = performance.now(); g.globalCompositeOperation = 'lighter';
        while (trail.length && now - trail[0].t > 2600) trail.shift(); if (trail.length > 400) trail.splice(0, trail.length - 400);
        for (const p of trail) { const k = 1 - (now - p.t) / 2600; glowDot(g, p.x, p.y, 14 * (0.5 + k), `rgba(80,255,230,${0.5 * k})`); }
        g.globalCompositeOperation = 'source-over'; },
      cut(d) { trail.push({ x: d.x, y: d.y, t: performance.now() }); if (Math.random() < 0.4) snd((s, t, k) => s.nz(t, 0.12, 'bandpass', s.jit(2600, 0.3), 6, 0.04 * k, 0.02)); },
      crumble(d) { burst(calm() ? 1 : 3, { kind: 'glow', x: d.x, y: d.y, g: 40, life: 1.1, size: 5, col: '#5fffe0' }, () => ({ vx: rnd(-60, 60), vy: rnd(-60, 20) })); },
      mold() { hap(18); snd((s, t, k) => s.nz(t, 0.5, 'lowpass', 700, 0.8, 0.08 * k, 0.15)); },
    },
    preview(g, w, h, t) { g.fillStyle = '#123a44'; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.4, h * 0.36, 0, 0, 7); g.fill(); for (let i = 0; i < 14; i++) { const p = i / 14, x = w * (0.2 + p * 0.6), y = h * (0.5 + Math.sin(p * 6 + t) * 0.15); glowDot(g, x, y, 12, `rgba(80,255,230,${0.2 + 0.6 * ((p + t * 0.3) % 1)})`); } } },
  { id: 'sand_goldrush', toy: 'sand', name: 'Gold Rush', blurb: 'Glittering gold sand with star and ring molds. Crumbles shower sparkling flakes with a bright tinkle.',
    look: { colors: [[214, 168, 64], [196, 140, 54], [230, 196, 110]], shapes: ['star', 'ring', 'brick', 'heart'] },
    on: {
      sandDraw(d) { const g = d.g, t = performance.now() / 1000; g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 70; i++) { const [u, v, p] = STARS[i]; const tw = Math.sin(t * 4 + p * 3); if (tw < 0.85 || !onSand(d, u, v)) continue; const x = d.bx + u * d.G.gw * d.cs, y = d.by + v * d.G.gh * d.cs, s = (tw - 0.85) * 40; g.strokeStyle = 'rgba(255,245,200,.9)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x + s, y); g.moveTo(x, y - s); g.lineTo(x, y + s); g.stroke(); }
        g.globalCompositeOperation = 'source-over'; },
      cut(d) { if (Math.random() < 0.5) add({ kind: 'confetti', x: d.x, y: d.y, vx: rnd(-80, 80), vy: rnd(-160, -60), g: 500, drag: 0.98, life: 1, size: 2.5, vr: rnd(-12, 12), add: false, col: '#ffd76a' }); },
      crumble(d) { burst(calm() ? 2 : 6, { kind: 'confetti', x: d.x, y: d.y, g: 500, drag: 0.98, life: 1.2, size: 2.5, add: false }, () => ({ vx: rnd(-140, 140), vy: rnd(-240, -60), vr: rnd(-14, 14), col: Math.random() < .5 ? '#ffd76a' : '#fff2b8' })); snd((s, t, k) => s.tone(t, s.jit(3000, 0.2), 2800, 0.15, 0.03 * k, 'triangle')); },
      mold() { hap([8, 20, 8, 20, 8]); snd((s, t, k) => [0, 0.06, 0.12].forEach((o, i) => s.tone(t + o, 1568 * (1 + i * 0.25), 1568 * (1 + i * 0.25), 0.5, 0.04 * k, 'triangle'))); },
    },
    preview(g, w, h, t) { const gr = g.createLinearGradient(0, h * 0.2, 0, h * 0.8); gr.addColorStop(0, '#f0cf78'); gr.addColorStop(1, '#a8741e'); g.fillStyle = gr; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * 0.628 - 1.57, r = i % 2 ? h * 0.18 : h * 0.4; g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } g.fill(); for (let i = 0; i < 6; i++) { const a = t * 2 + i, s = 3 + 3 * Math.abs(Math.sin(a * 1.7)); const x = w / 2 + Math.cos(a) * h * 0.25, y = h / 2 + Math.sin(a * 1.3) * h * 0.2; g.strokeStyle = '#fff6d0'; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x + s, y); g.moveTo(x, y - s); g.lineTo(x, y + s); g.stroke(); } } },
];
