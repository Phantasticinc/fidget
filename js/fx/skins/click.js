// Click upgrades: keycap material (look), per-frame key lighting + press effect, distinct switch voice.
import { burst, add, rnd, snd, hap, glowDot, calm } from './kit.js?v=6';
const ripples = [];
function keyRect(g, k, s, fill) { g.beginPath(); g.roundRect ? g.roundRect(k.x + 2, k.y + 2 + k.t * s * 0.07, s - 4, s - 4, s * 0.16) : g.rect(k.x, k.y, s, s); g.fillStyle = fill; g.fill(); }
export default [
  { id: 'click_crystal', toy: 'click', name: 'Crystal Keys', blurb: 'Clear quartz caps that refract a moving rainbow. Each press rings a glass chime and a light ripple.',
    look: { cap: [195, 30], accent: [280, 60], L: 92, pitch: 1.3 },
    on: {
      clickDraw(d) {
        const t = performance.now() / 1000, g = d.g; g.globalCompositeOperation = 'lighter';
        for (const k of d.keys) { const ph = (t * 0.5 + (k.x + k.y) / 400) % 1; const gr = g.createLinearGradient(k.x, k.y, k.x + d.size, k.y + d.size); gr.addColorStop(Math.max(0, ph - 0.15), 'rgba(0,0,0,0)'); gr.addColorStop(ph, `hsla(${ph * 360},100%,70%,.35)`); gr.addColorStop(Math.min(1, ph + 0.15), 'rgba(0,0,0,0)'); keyRect(g, k, d.size, gr); }
        g.globalCompositeOperation = 'source-over';
      },
      key(d) {
        burst(1, { kind: 'ring', x: d.x, y: d.y, size: d.size * 0.2, r1: d.size * 1.6, life: 0.6, col: 'rgba(200,240,255,.9)', lw: 2 });
        burst(calm() ? 3 : 8, { kind: 'glow', x: d.x, y: d.y, drag: 0.9, life: 0.6 }, () => { const a = rnd(0, 6.28); return { vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, size: 5, col: `hsl(${rnd(0, 360)},100%,75%)` }; });
        const f = [1047, 1175, 1319, 1568, 1760][d.i % 5]; snd((s, t, k) => { s.tone(t, f, f, 0.9, 0.06 * k, 'sine'); s.tone(t, f * 2.01, f * 2, 0.5, 0.02 * k, 'sine'); }); hap(6);
      } },
    preview(g, w, h, t) { for (let i = 0; i < 3; i++) { const x = w * 0.17 + i * w * 0.24, s = w * 0.2, y = h / 2 - s / 2; g.fillStyle = 'rgba(200,230,255,.25)'; g.fillRect(x, y, s, s); const ph = (t * 0.5 + i * 0.2) % 1; const gr = g.createLinearGradient(x, y, x + s, y + s); gr.addColorStop(Math.max(0, ph - .2), 'rgba(0,0,0,0)'); gr.addColorStop(ph, `hsla(${ph * 360},100%,70%,.8)`); gr.addColorStop(Math.min(1, ph + .2), 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y, s, s); } } },
  { id: 'click_holo', toy: 'click', name: 'Holo Glitch', blurb: 'Translucent cyber caps with scanlines. Presses fire a digital glitch burst and a synth blip.',
    look: { cap: [175, 70], accent: [320, 90], L: 30, pitch: 1.1 },
    on: {
      clickDraw(d) {
        const g = d.g, t = performance.now() / 1000; g.globalCompositeOperation = 'lighter';
        for (const k of d.keys) { const y0 = k.y + ((t * 60 + k.x) % d.size); g.fillStyle = 'rgba(0,255,220,.10)'; for (let y = k.y + 4; y < k.y + d.size - 4; y += 4) g.fillRect(k.x + 6, y, d.size - 12, 1); g.fillStyle = 'rgba(0,255,220,.35)'; g.fillRect(k.x + 6, y0, d.size - 12, 2); }
        while (ripples.length && performance.now() - ripples[0].t > 220) ripples.shift();
        for (const r of ripples) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,0,200' : '0,255,220'},.5)`; for (let i = 0; i < 4; i++) g.fillRect(r.x - r.s / 2 + rnd(-r.s * .4, r.s * .4), r.y + rnd(-r.s / 2, r.s / 2), rnd(8, r.s * .8), rnd(2, 5)); }
        g.globalCompositeOperation = 'source-over';
      },
      key(d) {
        ripples.push({ x: d.x, y: d.y, s: d.size, t: performance.now() });
        burst(calm() ? 3 : 10, { kind: 'spark', x: d.x, y: d.y, drag: 0.9, life: 0.35, size: 2 }, () => ({ vx: rnd(-300, 300), vy: rnd(-40, 40), col: Math.random() < .5 ? '#ff2bd6' : '#00ffd5' }));
        snd((s, t, k) => { s.tone(t, 880, 440, 0.08, 0.08 * k, 'square'); s.tone(t + 0.03, 1760, 1760, 0.04, 0.03 * k, 'square'); }); hap([4, 15, 4]);
      } },
    preview(g, w, h, t) { for (let i = 0; i < 3; i++) { const x = w * 0.17 + i * w * 0.24, s = w * 0.2, y = h / 2 - s / 2; g.fillStyle = 'rgba(0,80,80,.6)'; g.fillRect(x, y, s, s); g.fillStyle = 'rgba(0,255,220,.25)'; for (let yy = y; yy < y + s; yy += 3) g.fillRect(x, yy, s, 1); g.fillStyle = '#00ffd5'; g.fillRect(x, y + (t * 40 + i * 9) % s, s, 2); if ((t * 3 + i) % 2 < 0.2) { g.fillStyle = '#ff2bd6'; g.fillRect(x - 4, y + s * 0.4, s * 0.7, 3); } } } },
  { id: 'click_walnut', toy: 'click', name: 'Walnut & Brass', blurb: 'Hand-oiled walnut caps on heavy brass. Deep wooden thock that kicks up warm sawdust motes.',
    look: { cap: [26, 45], accent: [42, 70], L: 38, pitch: 0.72 },
    on: {
      clickDraw(d) { const g = d.g; g.globalAlpha = 0.12; g.strokeStyle = '#2a1608'; g.lineWidth = 1; for (const k of d.keys) { const yo = k.t * d.size * 0.07; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(k.x + 8, k.y + yo + d.size * i / 6); g.bezierCurveTo(k.x + d.size * .4, k.y + yo + d.size * i / 6 - 4, k.x + d.size * .6, k.y + yo + d.size * i / 6 + 4, k.x + d.size - 8, k.y + yo + d.size * i / 6); g.stroke(); } } g.globalAlpha = 1; },
      key(d) {
        burst(calm() ? 4 : 12, { kind: 'glow', x: d.x, y: d.y + d.size * 0.45, g: 60, drag: 0.94, life: 1.2, add: false, col: 'rgba(214,170,110,.7)' }, () => ({ vx: rnd(-90, 90), vy: rnd(-120, -30), size: rnd(1.5, 3.5) }));
        snd((s, t, k) => { s.nz(t, 0.09, 'lowpass', 420, 1.5, 0.45 * k); s.tone(t, s.jit(150), 90, 0.1, 0.3 * k, 'sine'); }); hap(22);
      } },
    preview(g, w, h, t) { for (let i = 0; i < 3; i++) { const x = w * 0.17 + i * w * 0.24, s = w * 0.2, y = h / 2 - s / 2 + (Math.sin(t * 3 + i) > 0.8 ? 3 : 0); const gr = g.createLinearGradient(x, y, x, y + s); gr.addColorStop(0, '#8a5a32'); gr.addColorStop(1, '#4a2c14'); g.fillStyle = gr; g.fillRect(x, y, s, s); g.strokeStyle = 'rgba(30,15,5,.4)'; for (let j = 1; j < 5; j++) { g.beginPath(); g.moveTo(x, y + s * j / 5); g.quadraticCurveTo(x + s / 2, y + s * j / 5 - 3, x + s, y + s * j / 5); g.stroke(); } g.fillStyle = '#c9a24a'; g.fillRect(x, y + s, s, 3); } } },
];
