// Signature layer: gives every upgrade one unmistakable twist on top of its finish —
// an ambient per-frame effect, a finger/rhythm interaction, a bespoke sound + haptic voice, and an equip reveal.
// Purely cosmetic: nothing here touches toy physics or scoring (leaderboard fairness).
import { add, burst, arc, rnd, snd, hap, glowDot, calm } from './kit.js?v=6';
import { q } from '../particles.js?v=5';
export const ptr = { x: 0, y: 0, down: false, t: 0 };
const now = () => performance.now();
const lim = n => Math.max(1, Math.round(n * q.scale * (calm() ? 0.4 : 1)));
let spin = null, pops = [], keys = [], beams = [], glyphs = [], rifts = [], veins = [], ripples = [], stage = 0, lastCr = 0, lastStage = 0, streakK = 0;
const spd = () => spin ? Math.min(1, Math.abs(spin.w) / 120) : 0;
const tips = (k = 1) => spin ? [0, 1, 2].map(i => { const t = i * 2.094 - 1.571 + spin.a; return [spin.cx + Math.cos(t) * spin.R * 0.62 * k, spin.cy + Math.sin(t) * spin.R * 0.62 * k]; }) : [];
const keepSpin = d => { spin = { cx: d.cx, cy: d.cy, R: d.R, a: d.a, w: d.w }; };
function chord(d) { // two+ keys inside 160 ms = a chord
  const t = now(); keys = keys.filter(k => t - k.t < 160); keys.push({ x: d.x, y: d.y, t }); return keys.length >= 2 ? keys.slice() : null;
}
function ring(x, y, col, r1, lw = 3, life = 0.7) { add({ kind: 'ring', x, y, size: 4, r1, col, lw, life }); }
const SIG = {
  // ---------- POP ----------
  pop_pack_liquidmetal: { hue: '#cfd8e6',
    frame(g, dt, W, H) { // travelling chrome reflection band across the sheet
      const x = ((now() / 2200) % 1.6 - 0.3) * W; const gr = g.createLinearGradient(x - 80, 0, x + 80, H * 0.3);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.10)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; },
    on: { pop(d) { // mercury beads splash, fall and pool into shiny puddles
      burst(lim(7), { kind: 'drop', x: d.x, y: d.y, g: 900, drag: 0.99, life: 2.4, add: false, fade: false, hi: '#ffffff', col: '#a9b4c2', lo: '#2b3036' }, () => ({ vx: rnd(-160, 160), vy: rnd(-320, -80), size: rnd(2.5, 5.5), floor: d.y + d.r * rnd(1.2, 2.6), onLand: p => { p.size *= 1.6; p.life = p.t + 1.4; } }));
      if (d.streak >= 4 && d.streak % 4 === 0) { ring(d.x, d.y, 'rgba(230,240,255,.9)', d.r * 5, 4, 0.9); hap([6, 30, 18]); }
      snd((s, t, k) => { s.tone(t, s.jit(900, 0.1), 180, 0.16, 0.10 * k, 'sine'); s.tone(t + 0.03, 1800, 600, 0.08, 0.03 * k, 'sine'); }); } },
    reveal(x, y) { burst(lim(40), { kind: 'drop', x, y, g: 700, life: 1.8, add: false, fade: false, hi: '#fff', col: '#a9b4c2', lo: '#2b3036' }, () => ({ vx: rnd(-420, 420), vy: rnd(-600, -100), size: rnd(3, 8) })); snd((s, t, k) => [0, .08, .16].forEach((o, i) => s.tone(t + o, 1200 - i * 300, 200, 0.3, 0.08 * k, 'sine'))); hap([10, 40, 10]); } },
  pop_pack_neonjelly: { hue: '#ff4dd2',
    on: { pop(d) { // pops in a streak chain together with neon laser links
      const t = now(); pops = pops.filter(p => t - p.t < 900); const col = d.streak % 2 ? '#3ff7ff' : '#ff4dd2';
      ring(d.x, d.y, col, d.r * (2.2 + Math.min(d.streak, 10) * 0.25), 4, 0.6);
      for (const p of pops.slice(-3)) beams.push({ k: 'link', x0: p.x, y0: p.y, x1: d.x, y1: d.y, t, col, life: 450 });
      pops.push({ x: d.x, y: d.y, t });
      snd((s, t, k) => { const f = 220 * Math.pow(2, Math.min(d.streak, 12) / 12); s.tone(t, f * 2, f, 0.18, 0.09 * k, 'triangle'); s.tone(t, f * 4, f * 3, 0.1, 0.03 * k, 'square'); });
      hap(d.streak > 6 ? [8, 20, 8] : 10); } },
    frame(g) { drawBeams(g, 'link'); },
    reveal(x, y) { for (let i = 0; i < 6; i++) setTimeout(() => ring(x, y, i % 2 ? '#3ff7ff' : '#ff4dd2', 260, 5, 0.8), i * 90); snd((s, t, k) => [0, 4, 7, 12].forEach((n, i) => s.tone(t + i * 0.07, 330 * Math.pow(2, n / 12), 330 * Math.pow(2, n / 12), 0.25, 0.06 * k, 'triangle'))); hap([8, 30, 8, 30, 8]); } },
  pop_pack_lava: { hue: '#ff6a00',
    frame(g, dt, W, H) { glowDot(g, W / 2, H * 0.95, W * 0.8, 'rgba(255,80,0,.16)'); },
    on: { pop(d) { // molten splash that lands, cools from white-hot to black crust
      const ramp = ['#fff6c0', '#ffd040', '#ff8a00', '#ff4a00', '#b52500', '#5a1d10', '#2d2120', '#2d2120'];
      burst(lim(9), { kind: 'glow', x: d.x, y: d.y, g: 800, drag: 0.985, life: 3.2, cols: ramp, add: true, fade: false }, () => ({ vx: rnd(-170, 170), vy: rnd(-340, -90), size: rnd(4, 8), floor: d.y + d.r * rnd(1, 2.4) }));
      burst(lim(5), { kind: 'drop', x: d.x, y: d.y, g: 800, life: 3.2, add: false, fade: false, hi: '#5a4a44', col: '#2d2120', lo: '#0e0807' }, () => ({ vx: rnd(-120, 120), vy: rnd(-260, -60), size: rnd(1.5, 3), floor: d.y + d.r * rnd(1, 2.4) }));
      snd((s, t, k) => { s.tone(t, 140, 55, 0.25, 0.14 * k, 'sine'); s.nz(t + 0.02, 0.5, 'highpass', 3500, 0.7, 0.04 * k, 0.05); });
      hap([20, 15, 6]); } },
    reveal(x, y) { burst(lim(60), { kind: 'glow', x, y, g: 600, life: 2.6, cols: ['#fff6c0', '#ffd040', '#ff8a00', '#b52500', '#2d2120'], fade: false }, () => ({ vx: rnd(-450, 450), vy: rnd(-650, -150), size: rnd(5, 11), floor: y + rnd(120, 260) })); snd((s, t, k) => { s.tone(t, 90, 40, 0.8, 0.2 * k, 'sine'); s.nz(t, 1.2, 'highpass', 3000, 0.7, 0.06 * k, 0.1); }); hap([40, 30, 20]); } },
  // ---------- SPIN ----------
  spin_plasma: { hue: '#9d7bff',
    on: { spinDraw: keepSpin },
    frame(g) { // arcs leap to your finger; crackle volume rises with RPM
      const sp = spd(); if (!spin) return;
      if (ptr.down || now() - ptr.t < 120) { const tt = tips(); for (const [x, y] of tt) if (Math.random() < 0.4 + sp * 0.6) arc(g, x, y, ptr.x + rnd(-8, 8), ptr.y + rnd(-8, 8), Math.random() < .5 ? '#e7ddff' : '#9d7bff', 1.2 + sp * 2.4, 14 + sp * 26, 0);
        glowDot(g, ptr.x, ptr.y, 26 + sp * 30, 'rgba(160,130,255,.55)'); }
      if (sp > 0.15 && now() - lastCr > 160 - sp * 120) { lastCr = now(); snd((s, t, k) => { s.nz(t, 0.03 + sp * 0.03, 'bandpass', s.jit(4200, 0.4), 3, (0.04 + sp * 0.18) * k); if (sp > 0.6) s.tone(t, 60, 58, 0.06, 0.05 * k * sp, 'sawtooth'); }); if (ptr.down) hap(sp > 0.6 ? 6 : 3); }
    },
    reveal(x, y) { for (let i = 0; i < 14; i++) setTimeout(() => { const a = Math.random() * 6.28; beams.push({ k: 'zap', x0: x, y0: y, x1: x + Math.cos(a) * 300, y1: y + Math.sin(a) * 300, t: now(), col: '#cfc2ff', life: 180 }); }, i * 50); snd((s, t, k) => { s.nz(t, 0.7, 'bandpass', 3000, 2, 0.12 * k); s.tone(t, 50, 120, 0.7, 0.08 * k, 'sawtooth'); }); hap([5, 10, 5, 10, 5, 10, 30]); } },
  spin_obsidian: { hue: '#ff7a1a',
    on: { spinDraw(d) { keepSpin(d); // magma veins in the glass heat up and glow with speed
      const sp = spd(), g = d.g; if (sp < 0.04) return; g.save(); g.translate(d.cx, d.cy); g.rotate(d.a); g.globalCompositeOperation = 'lighter';
      g.strokeStyle = `rgba(255,${120 + sp * 100},40,${0.25 + sp * 0.7})`; g.lineWidth = 1 + sp * 2; g.shadowColor = '#ff5a00'; g.shadowBlur = 6 + sp * 18;
      for (let i = 0; i < 9; i++) { const a = i * 0.698; g.beginPath(); g.moveTo(Math.cos(a) * d.R * 0.24, Math.sin(a) * d.R * 0.24); for (let j = 1; j < 5; j++) { const rr = d.R * (0.24 + j * 0.17), aa = a + Math.sin(i * 7 + j * 3) * 0.25; g.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } g.stroke(); }
      g.restore();
      if (sp > 0.5 && Math.random() < sp * 0.05) snd((s, t, k) => s.tone(t, 45, 38, 0.4, 0.09 * k * sp, 'sine')); } },
    frame(g, dt, W, H) { const sp = spd(); if (sp > 0.3) glowDot(g, W / 2, H * 0.47, W * (0.5 + sp * 0.3), `rgba(255,70,0,${0.12 * sp})`);
      if (spin && ptr.down && sp > 0.2) for (const [x, y] of tips(1.4)) if (Math.random() < sp * 0.5) { const a = Math.atan2(ptr.y - y, ptr.x - x); add({ kind: 'spark', x, y, vx: Math.cos(a) * 520 + rnd(-60, 60), vy: Math.sin(a) * 520 + rnd(-60, 60), g: 300, life: 0.5, size: 2, col: '#ffb060' }); } },
    reveal(x, y) { burst(lim(70), { kind: 'spark', x, y, g: 400, life: 1.2, size: 2 }, () => { const a = Math.random() * 6.28, v = rnd(200, 700); return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, col: Math.random() < .3 ? '#fff1c2' : '#ff7a1a' }; }); snd((s, t, k) => { s.tone(t, 70, 30, 1, 0.2 * k, 'sine'); s.nz(t, 0.4, 'highpass', 5000, 1, 0.05 * k); }); hap([30, 20, 50]); } },
  spin_aurora: { hue: '#7dffd8',
    on: { spinDraw: keepSpin },
    frame(g, dt, W, H) { // the whole sky lights up in aurora curtains as RPM builds; each new tier rings a chime
      const sp = spd(), t = now() / 1000; if (sp > 0.03) { g.globalCompositeOperation = 'lighter';
        for (let b = 0; b < 3; b++) { const gr = g.createLinearGradient(0, 0, 0, H * 0.55); const h = (t * 20 + b * 70) % 360; gr.addColorStop(0, `hsla(${h},90%,60%,0)`); gr.addColorStop(0.5, `hsla(${h},90%,60%,${0.12 * sp})`); gr.addColorStop(1, `hsla(${h},90%,60%,0)`); g.fillStyle = gr;
          g.beginPath(); g.moveTo(0, H * 0.5); for (let x = 0; x <= W; x += 24) g.lineTo(x, H * (0.12 + 0.06 * b) + Math.sin(x / 70 + t * (1 + b * 0.4) + b) * 30); g.lineTo(W, H * 0.5); g.fill(); }
        g.globalCompositeOperation = 'source-over'; }
      const st = Math.floor(sp * 4); if (st > lastStage && spin) { const n = [0, 4, 7, 12, 16][st]; snd((s, t, k) => { s.tone(t, 523 * Math.pow(2, n / 12), 523 * Math.pow(2, n / 12), 1.2, 0.05 * k, 'sine'); s.tone(t, 1046 * Math.pow(2, n / 12), 1046 * Math.pow(2, n / 12), 0.8, 0.02 * k, 'sine'); }); ring(spin.cx, spin.cy, `hsl(${st * 70 + 120},90%,70%)`, spin.R * 1.8, 3, 1); hap(8); }
      lastStage = st; },
    reveal(x, y) { lastStage = 0; for (let i = 0; i < 5; i++) setTimeout(() => ring(x, y, `hsl(${120 + i * 50},90%,70%)`, 300, 4, 1.2), i * 120); snd((s, t, k) => [0, 4, 7, 11, 14].forEach((n, i) => s.tone(t + i * 0.1, 523 * Math.pow(2, n / 12), 523 * Math.pow(2, n / 12), 1.4, 0.04 * k, 'sine'))); hap([6, 60, 6, 60, 6]); } },
  // ---------- CLICK ----------
  click_crystal: { hue: '#bfe9ff',
    on: { key(d) { const c = chord(d); burst(lim(6), { kind: 'glow', x: d.x, y: d.y, life: 0.6, size: 4 }, () => ({ vx: rnd(-90, 90), vy: rnd(-120, -20), col: `hsl(${rnd(180, 300)},90%,75%)` }));
      if (c) { beams.push({ k: 'prism', x0: c[0].x, y0: c[0].y, t: now(), life: 1100, a0: Math.random() * 6.28 }); snd((s, t, k) => c.slice(-3).forEach((p, i) => s.tone(t + i * 0.02, 1568 * [1, 1.26, 1.5][i], 1568 * [1, 1.26, 1.5][i], 1.1, 0.05 * k, 'sine'))); hap([6, 20, 6]); }
      else snd((s, t, k) => s.tone(t, s.jit(2093, 0.05), 2093, 0.35, 0.035 * k, 'sine')); } },
    frame(g, dt, W, H) { drawBeams(g, 'prism', W, H); },
    reveal(x, y) { beams.push({ k: 'prism', x0: x, y0: y, t: now(), life: 1600, a0: 0 }); snd((s, t, k) => [1, 1.26, 1.5, 2].forEach((m, i) => s.tone(t + i * 0.08, 1046 * m, 1046 * m, 1.4, 0.05 * k, 'sine'))); hap([6, 30, 6, 30, 6]); } },
  click_holo: { hue: '#3ff7ff',
    on: { key(d) { const c = chord(d); glyphs.push({ x: d.x, y: d.y - d.size * 0.6, t: now(), ch: '01ABXYZ#$%&<>/'[(Math.random() * 14) | 0] });
      if (c) { beams.push({ k: 'glitch', t: now(), life: 260 }); snd((s, t, k) => { s.tone(t, 1760, 220, 0.12, 0.06 * k, 'square'); s.nz(t, 0.08, 'bandpass', 6000, 3, 0.05 * k); }); hap([4, 8, 4, 8, 4]); }
      else snd((s, t, k) => s.tone(t, s.jit(1320, 0.08), 1980, 0.05, 0.04 * k, 'square')); } },
    frame(g, dt, W, H) { const t = now(); glyphs = glyphs.filter(p => t - p.t < 900); g.textAlign = 'center'; g.font = '700 22px ui-monospace,monospace';
      for (const p of glyphs) { if (t < p.t) continue; const k = (t - p.t) / 900, y = p.y - k * 70; g.globalAlpha = 1 - k; g.fillStyle = '#ff3fd2'; g.fillText(p.ch, p.x - 2, y); g.fillStyle = '#3ff7ff'; g.fillText(p.ch, p.x + 2, y); g.fillStyle = 'rgba(63,247,255,.25)'; g.fillRect(p.x - 14, y - 18 + ((t / 30) % 20), 28, 2); }
      g.globalAlpha = 1; drawBeams(g, 'glitch', W, H); },
    reveal(x, y) { beams.push({ k: 'glitch', t: now(), life: 900 }); for (let i = 0; i < 12; i++) glyphs.push({ x: x + rnd(-140, 140), y: y + rnd(-60, 80), t: now() + i * 40, ch: 'HOLO'[i % 4] }); snd((s, t, k) => [0, .06, .12, .18].forEach((o, i) => s.tone(t + o, 880 * (i + 1), 880 * (i + 1), 0.06, 0.05 * k, 'square'))); hap([4, 10, 4, 10, 20]); } },
  click_walnut: { hue: '#ffb870',
    on: { key(d) { streakK = Math.min(1, streakK + 0.08); burst(lim(4), { kind: 'confetti', x: d.x, y: d.y + d.size * 0.3, g: 260, drag: 0.97, life: 1.2, size: 1.6, add: false }, () => ({ vx: rnd(-50, 50), vy: rnd(-60, 0), vr: rnd(-8, 8), col: Math.random() < .5 ? '#c9925a' : '#8a5a32' }));
      const c = chord(d); if (c) { snd((s, t, k) => { s.tone(t, 392, 392, 1.6, 0.06 * k, 'sine'); s.tone(t, 588, 588, 1.4, 0.03 * k, 'sine'); s.tone(t, 1176, 1170, 0.8, 0.015 * k, 'sine'); }); hap([14, 30, 8]); }
      else snd((s, t, k) => { s.tone(t, s.jit(130, 0.1), 70, 0.09, 0.12 * k, 'sine'); s.nz(t, 0.03, 'lowpass', 1200, 0.8, 0.05 * k); }); } },
    frame(g, dt, W, H) { streakK *= Math.pow(0.6, dt); // a warm desk lamp that brightens the faster you type
      glowDot(g, W * 0.5, H * 0.18, W * (0.7 + streakK * 0.4), `rgba(255,180,90,${0.10 + streakK * 0.25})`); },
    reveal(x, y) { streakK = 1; burst(lim(40), { kind: 'confetti', x, y, g: 300, life: 1.6, size: 2, add: false }, () => ({ vx: rnd(-260, 260), vy: rnd(-380, -60), vr: rnd(-10, 10), col: Math.random() < .5 ? '#c9925a' : '#e8b878' })); snd((s, t, k) => { s.tone(t, 196, 196, 2, 0.08 * k, 'sine'); s.tone(t, 294, 294, 1.8, 0.04 * k, 'sine'); }); hap([20, 40, 20]); } },
};
function drawBeams(g, kind, W, H) {
  const t = now(); beams = beams.filter(b => t - b.t < b.life);
  for (const b of beams) { if (b.k !== kind) continue; const k = (t - b.t) / b.life, a = 1 - k; g.save(); g.globalCompositeOperation = 'lighter';
    if (kind === 'link' || kind === 'zap') arc(g, b.x0, b.y0, b.x1, b.y1, b.col, 2.5 * a + 0.5, 10);
    else if (kind === 'prism') { // refracted light beam sweeping the board, split into spectrum
      const ang = b.a0 + k * 2.6, L = Math.max(W, H) * 1.2; for (let i = 0; i < 6; i++) { const aa = ang + (i - 2.5) * 0.035; g.strokeStyle = `hsla(${i * 55},100%,65%,${0.55 * a})`; g.lineWidth = 10; g.beginPath(); g.moveTo(b.x0, b.y0); g.lineTo(b.x0 + Math.cos(aa) * L, b.y0 + Math.sin(aa) * L); g.stroke(); }
      glowDot(g, b.x0, b.y0, 60, `rgba(255,255,255,${0.8 * a})`); }
    else if (kind === 'glitch') { for (let i = 0; i < 8; i++) { const y = Math.random() * H, h = rnd(4, 26); g.globalAlpha = 0.5 * a; g.fillStyle = i % 2 ? '#ff3fd2' : '#3ff7ff'; g.fillRect(rnd(-30, 30), y, W, h); } }
    else if (kind === 'wave') { const x = k * W * 1.4 - W * 0.2, gr = g.createLinearGradient(x - 90, 0, x + 90, 0); gr.addColorStop(0, 'rgba(80,255,230,0)'); gr.addColorStop(.5, `rgba(80,255,230,${0.45 * a})`); gr.addColorStop(1, 'rgba(80,255,230,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    else if (kind === 'gleam') { const x = b.x0 + k * (b.w + 120) - 60; g.beginPath(); g.rect(b.x0, b.y0, b.w, b.h); g.clip(); const gr = g.createLinearGradient(x - 40, 0, x + 40, 0); gr.addColorStop(0, 'rgba(255,240,180,0)'); gr.addColorStop(.5, 'rgba(255,250,220,.75)'); gr.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = gr; g.fillRect(b.x0, b.y0, b.w, b.h); }
    g.restore(); }
}
export function sign(s) {
  const x = SIG[s.id]; if (!x) return; s.hue = x.hue; s.frame = x.frame; s.reveal = x.reveal;
  for (const e in x.on || {}) { const a = s.on[e], b = x.on[e]; s.on[e] = a && a !== b ? d => { a(d); b(d); } : b; }
}
