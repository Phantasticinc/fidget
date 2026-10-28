// Cube: one face of a fidget cube, opened flat. Clicky + silent buttons, a flip toggle, a detented dial,
// a spring-back joystick, and a ratcheting roller you can flick and let spin down.
import { snd, buzz, opts, rich } from './kit2.js?v=1';
import { rr } from '../render.js?v=1';
import { emit } from '../bus.js';
export function create() {
  let W, H, x0, y0, S, cs, t = 0, n = 0, F = new Map();
  const btn = [0, 1, 2, 3, 4].map(i => ({ i, d: 0, p: false, silent: i >= 3 })), tog = { on: false, a: 0 }, dial = { a: 0, last: 0 }, joy = { x: 0, y: 0, vx: 0, vy: 0, held: null, edge: false }, roll = { a: 0, v: 0, last: 0 };
  function layout() { S = Math.min(W - 32, H * 0.62, 460); x0 = (W - S) / 2; y0 = H * 0.46 - S / 2; cs = S / 2; }
  const cell = (cx, cy) => [x0 + cx * cs, y0 + cy * cs];
  function hit(x, y) {
    const u = (x - x0) / cs, v = (y - y0) / cs; if (u < 0 || v < 0 || u > 2 || v > 2) return null;
    if (v < 1 && u < 1) return 'btn'; if (v < 1) return 'tog'; if (u < 1) return 'dial'; return 'joy';
  }
  const ev = (k, x, y) => { n++; emit('cube', { x, y, k, toy: 'cube', rich: rich('cube') }); };
  function btnAt(x, y) { const [bx, by] = cell(0, 0); for (const b of btn) { const [cx, cy] = bpos(b, bx, by); if (Math.hypot(x - cx, y - cy) < cs * 0.15) return b; } return null; }
  function bpos(b, bx, by) { const k = b.i; const pos = [[0.3, 0.3], [0.7, 0.3], [0.5, 0.52], [0.3, 0.74], [0.7, 0.74]][k]; return [bx + pos[0] * cs, by + pos[1] * cs]; }
  return {
    resize(w, h) { W = w; H = h; layout(); },
    label: 'Cube: a fidget cube face with clicky and silent buttons, a toggle switch, a dial with clicks, a joystick and a roller',
    hud: () => `${n} fidgets`,
    down(id, x, y) {
      const z = hit(x, y), f = { z, x, y, sx: x, sy: y }; F.set(id, f);
      if (z === 'btn') { const b = btnAt(x, y); if (b) { f.b = b; b.p = true; b.silent ? snd.detent(0.6) : snd.clack(1.1 - b.i * 0.05, 1); buzz(b.silent ? 3 : 10); ev('btn', x, y); } }
      else if (z === 'tog') { tog.on = !tog.on; snd.toggle(tog.on); buzz(14); ev('tog', x, y); }
      else if (z === 'dial') { const [cx, cy] = cell(0.5, 1.5); f.a = Math.atan2(y - cy - cs * 0.0, x - cx - cs * 0.0); }
      else if (z === 'joy') { joy.held = f; }
    },
    move(id, x, y) { const f = F.get(id); if (!f) return; const dx = x - f.x, dy = y - f.y; f.x = x; f.y = y;
      if (f.z === 'dial') { const [cx, cy] = [x0 + cs * 0.5, y0 + cs * 1.5], a = Math.atan2(y - cy, x - cx); let d = a - f.a; d = Math.atan2(Math.sin(d), Math.cos(d)); f.a = a; dial.a += d;
        const k = Math.round(dial.a / (Math.PI / 8)); if (k !== dial.last) { dial.last = k; snd.detent(1); buzz(3); ev('dial', x, y); } }
      else if (f.z === 'btn' && !f.b && Math.abs(dy) > 0) { roll.v += dy * 0.6 / cs * 60; f.roll = true; } },
    up(id) { const f = F.get(id); if (!f) return; F.delete(id); if (f.b) { f.b.p = false; if (!f.b.silent) snd.clack(1.4, 0.4); } if (joy.held === f) joy.held = null; },
    step(dt) {
      t += dt;
      for (const b of btn) b.d += ((b.p ? 1 : 0) - b.d) * Math.min(1, dt * 40);
      tog.a += ((tog.on ? 1 : 0) - tog.a) * Math.min(1, dt * 28);
      if (joy.held) { const cx = x0 + cs * 1.5, cy = y0 + cs * 1.5, r = cs * 0.28; let jx = (joy.held.x - cx) / r, jy = (joy.held.y - cy) / r; const l = Math.hypot(jx, jy); if (l > 1) { jx /= l; jy /= l; } joy.x = jx; joy.y = jy; joy.vx = joy.vy = 0;
        const e = l > 0.95; if (e && !joy.edge) { snd.clack(0.7, 0.35); buzz(6); ev('joy', cx, cy); } joy.edge = e; }
      else { joy.vx += (-joy.x * 900 - joy.vx * 14) * dt; joy.vy += (-joy.y * 900 - joy.vy * 14) * dt; joy.x += joy.vx * dt; joy.y += joy.vy * dt; joy.edge = false; }
      roll.a += roll.v * dt; roll.v *= Math.pow(0.35, dt); const k = Math.floor(roll.a / 0.5); if (k !== roll.last) { roll.last = k; snd.roll(Math.min(1, Math.abs(roll.v) / 20)); if (Math.abs(roll.v) < 30) buzz(2); }
    },
    draw(g) {
      const calm = opts.calm, lux = rich('cube') && !calm, h0 = (t * 30) % 360;
      const body = calm ? '#4a524e' : lux ? `hsl(${h0},40%,22%)` : '#2b3340', panel = calm ? '#5a635e' : lux ? `hsl(${h0},45%,30%)` : '#394456';
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 6, y0 + 10, S, S, S * 0.12); g.fill();
      g.fillStyle = body; rr(g, x0, y0, S, S, S * 0.12); g.fill();
      if (lux) { g.strokeStyle = `hsla(${h0 + 180},100%,65%,.8)`; g.lineWidth = 3; g.shadowColor = g.strokeStyle; g.shadowBlur = 16; rr(g, x0, y0, S, S, S * 0.12); g.stroke(); g.shadowBlur = 0; }
      for (let i = 0; i < 4; i++) { const [px, py] = cell(i % 2, i >> 1); g.fillStyle = panel; rr(g, px + cs * 0.06, py + cs * 0.06, cs * 0.88, cs * 0.88, cs * 0.1); g.fill(); }
      const acc = i => calm ? '#9aa59f' : lux ? `hsl(${(h0 + i * 50) % 360},90%,62%)` : ['#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#c77dff'][i];
      // buttons
      const [bx, by] = cell(0, 0); for (const b of btn) { const [cx, cy] = bpos(b, bx, by), r = cs * 0.12; g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(cx, cy + 3, r, 0, 7); g.fill(); g.fillStyle = acc(b.i); g.beginPath(); g.arc(cx, cy + b.d * 3, r * (1 - b.d * 0.06), 0, 7); g.fill(); g.fillStyle = `rgba(255,255,255,${0.35 - b.d * 0.2})`; g.beginPath(); g.arc(cx - r * 0.3, cy - r * 0.3 + b.d * 3, r * 0.35, 0, 7); g.fill(); if (lux && b.d > 0.3) { g.fillStyle = `hsla(${h0},100%,80%,${b.d * 0.4})`; g.beginPath(); g.arc(cx, cy, r * 1.6, 0, 7); g.fill(); } }
      // roller strip along the button panel bottom edge
      g.save(); g.fillStyle = '#1c222b'; rr(g, bx + cs * 0.88, by + cs * 0.12, cs * 0.08, cs * 0.76, 4); g.fill(); g.clip(); g.strokeStyle = '#7d8796'; g.lineWidth = 2; for (let i = -1; i < 12; i++) { const yy = by + cs * 0.12 + ((i * cs * 0.08 + roll.a * 6) % (cs * 0.8) + cs * 0.8) % (cs * 0.8); g.beginPath(); g.moveTo(bx + cs * 0.88, yy); g.lineTo(bx + cs * 0.96, yy); g.stroke(); } g.restore();
      // toggle
      { const [px, py] = cell(1, 0), cx = px + cs / 2, cy = py + cs / 2, w = cs * 0.3, hh = cs * 0.5; g.fillStyle = '#1c222b'; rr(g, cx - w / 2, cy - hh / 2, w, hh, w / 2); g.fill(); const ky = cy + hh * 0.25 - tog.a * hh * 0.5; g.fillStyle = tog.on ? acc(2) : '#aab3c0'; g.beginPath(); g.arc(cx, ky, w * 0.42, 0, 7); g.fill(); if (tog.on && !calm) { g.fillStyle = acc(2); g.globalAlpha = 0.35; g.beginPath(); g.arc(cx, cy - hh * 0.75, 6, 0, 7); g.fill(); g.globalAlpha = 1; } }
      // dial
      { const cx = x0 + cs * 0.5, cy = y0 + cs * 1.5, r = cs * 0.3; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(cx + Math.cos(a) * r * 1.22, cy + Math.sin(a) * r * 1.22, 2, 0, 7); g.fill(); } const dg = g.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r); dg.addColorStop(0, '#d9dee6'); dg.addColorStop(1, '#6d7684'); g.fillStyle = dg; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); for (let i = 0; i < 24; i++) { const a = dial.a + i / 24 * 6.283; g.strokeStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.88, cy + Math.sin(a) * r * 0.88); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.stroke(); } g.fillStyle = acc(0); g.beginPath(); g.arc(cx + Math.cos(dial.a) * r * 0.62, cy + Math.sin(dial.a) * r * 0.62, r * 0.1, 0, 7); g.fill(); }
      // joystick
      { const cx = x0 + cs * 1.5, cy = y0 + cs * 1.5, r = cs * 0.28; g.fillStyle = '#1c222b'; g.beginPath(); g.arc(cx, cy, r * 1.1, 0, 7); g.fill(); const jx = cx + joy.x * r * 0.7, jy = cy + joy.y * r * 0.7; g.strokeStyle = '#555f6d'; g.lineWidth = r * 0.25; g.beginPath(); g.moveTo(cx, cy); g.lineTo(jx, jy); g.stroke(); const kg = g.createRadialGradient(jx - r * 0.15, jy - r * 0.15, 0, jx, jy, r * 0.5); kg.addColorStop(0, '#fff'); kg.addColorStop(1, acc(3)); g.fillStyle = kg; g.beginPath(); g.arc(jx, jy, r * 0.45, 0, 7); g.fill(); }
    },
  };
}
