// Cube: one face of a fidget cube, opened flat. Five soft musical dome buttons (pentatonic), a flip toggle, a detented dial,
// a spring-back joystick, and a ratcheting roller you can flick and let spin down. Mechanical switches live in Click.
// Looks (paid, each its own product): RGB (colour-cycling, neon edge, sparks), Brass (steampunk metal, rivets, gold flakes + steam),
// Frost (translucent ice, frosted panels, snowflakes + shards). Tap the empty space around the cube to switch owned looks.
import { snd, buzz, opts, rich, lookId, ownedLooks, setLook, previewing, CUBE_LOOKS, previewLookId } from './kit2.js?v=3';
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
  const NOTES = [523.25, 587.33, 659.25, 783.99, 880];
  const L = () => opts.calm ? null : CUBE_LOOKS[lookId()] || (previewing('cube') ? CUBE_LOOKS[previewLookId] : null);
  const ev = (k, x, y) => { n++; const look = L(); emit('cube', { x, y, k, toy: 'cube', rich: !!look || rich('cube'), look }); if (look && k !== 'dial') snd.ting(look, k === 'btn' ? 880 : 660); };
  let flash = 0;
  function btnAt(x, y) { const [bx, by] = cell(0, 0); for (const b of btn) { const [cx, cy] = bpos(b, bx, by); if (Math.hypot(x - cx, y - cy) < cs * 0.15) return b; } return null; }
  function bpos(b, bx, by) { const k = b.i; const pos = [[0.3, 0.3], [0.7, 0.3], [0.5, 0.52], [0.3, 0.74], [0.7, 0.74]][k]; return [bx + pos[0] * cs, by + pos[1] * cs]; }
  return {
    resize(w, h) { W = w; H = h; layout(); },
    label: 'Cube: a fidget cube face with five musical squishy buttons, a toggle switch, a dial with clicks, a joystick and a roller',
    hud: () => `${n} fidget${n === 1 ? "" : "s"}`,
    down(id, x, y) {
      const z = hit(x, y), f = { z, x, y, sx: x, sy: y }; F.set(id, f);
      if (z === null) { const o = ownedLooks(); if (o.length) { const cur = lookId(), all = [...o, null], nx = all[(all.indexOf(cur) + 1) % all.length]; setLook(nx); flash = 1; snd.toggle(true); buzz(8); } return; }
      if (z === 'btn') { const b = btnAt(x, y); if (b) { f.b = b; b.p = true; snd.boop(NOTES[b.i]); buzz([6, 20, 4]); ev('btn', x, y); } }
      else if (z === 'tog') { tog.on = !tog.on; snd.toggle(tog.on); buzz(14); ev('tog', x, y); }
      else if (z === 'dial') { const [cx, cy] = cell(0.5, 1.5); f.a = Math.atan2(y - cy - cs * 0.0, x - cx - cs * 0.0); }
      else if (z === 'joy') { joy.held = f; }
    },
    move(id, x, y) { const f = F.get(id); if (!f) return; const dx = x - f.x, dy = y - f.y; f.x = x; f.y = y;
      if (f.z === 'dial') { const [cx, cy] = [x0 + cs * 0.5, y0 + cs * 1.5], a = Math.atan2(y - cy, x - cx); let d = a - f.a; d = Math.atan2(Math.sin(d), Math.cos(d)); f.a = a; dial.a += d;
        const k = Math.round(dial.a / (Math.PI / 8)); if (k !== dial.last) { dial.last = k; snd.detent(1); buzz(3); ev('dial', x, y); } }
      else if (f.z === 'btn' && !f.b && Math.abs(dy) > 0) { roll.v += dy * 0.6 / cs * 60; f.roll = true; } },
    up(id) { const f = F.get(id); if (!f) return; F.delete(id); if (f.b) { f.b.p = false; snd.boop(NOTES[f.b.i] * 2, 0.15); } if (joy.held === f) joy.held = null; },
    step(dt) {
      t += dt; flash = Math.max(0, flash - dt * 1.5);
      for (const b of btn) b.d += ((b.p ? 1 : 0) - b.d) * Math.min(1, dt * 40);
      tog.a += ((tog.on ? 1 : 0) - tog.a) * Math.min(1, dt * 28);
      if (joy.held) { const cx = x0 + cs * 1.5, cy = y0 + cs * 1.5, r = cs * 0.28; let jx = (joy.held.x - cx) / r, jy = (joy.held.y - cy) / r; const l = Math.hypot(jx, jy); if (l > 1) { jx /= l; jy /= l; } joy.x = jx; joy.y = jy; joy.vx = joy.vy = 0;
        const e = l > 0.95; if (e && !joy.edge) { snd.clack(0.7, 0.35); buzz(6); ev('joy', cx, cy); } joy.edge = e; }
      else { joy.vx += (-joy.x * 900 - joy.vx * 14) * dt; joy.vy += (-joy.y * 900 - joy.vy * 14) * dt; joy.x += joy.vx * dt; joy.y += joy.vy * dt; joy.edge = false; }
      roll.a += roll.v * dt; roll.v *= Math.pow(0.35, dt); const k = Math.floor(roll.a / 0.5); if (k !== roll.last) { roll.last = k; snd.roll(Math.min(1, Math.abs(roll.v) / 20)); if (Math.abs(roll.v) < 30) buzz(2); }
    },
    draw(g) {
      g.shadowOffsetX = g.shadowOffsetY = 0; g.shadowBlur = 0; g.shadowColor = 'transparent';
      if (flash > 0) { const nm = { rgb: 'RGB', brass: 'Brass', frost: 'Frost' }[CUBE_LOOKS[lookId()]] || 'Classic'; g.globalAlpha = Math.min(1, flash * 2); g.fillStyle = '#fff'; g.font = '700 15px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText(nm + ' look', W / 2, y0 - 18); g.globalAlpha = 1; }
      const calm = opts.calm, look = L(), lux = look === 'rgb', h0 = (t * 30) % 360;
      const body = calm ? '#4a524e' : lux ? `hsl(${h0},40%,22%)` : look === 'brass' ? '#2a2a22' : look === 'frost' ? 'rgba(200,230,255,.18)' : '#2b3340';
      const panel = calm ? '#5a635e' : lux ? `hsl(${h0},45%,30%)` : look === 'brass' ? null : look === 'frost' ? 'rgba(220,240,255,.16)' : '#394456';
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 6, y0 + 10, S, S, S * 0.12); g.fill();
      g.fillStyle = body; rr(g, x0, y0, S, S, S * 0.12); g.fill();
      if (lux) { g.strokeStyle = `hsla(${h0 + 180},100%,65%,.8)`; g.lineWidth = 3; g.shadowOffsetX = g.shadowOffsetY = 0; g.shadowColor = g.strokeStyle; g.shadowBlur = 16; rr(g, x0, y0, S, S, S * 0.12); g.stroke(); g.shadowBlur = 0; g.shadowColor = 'transparent'; }
      if (look === 'frost') { const fg = g.createLinearGradient(x0, y0, x0 + S, y0 + S); fg.addColorStop(0, 'rgba(255,255,255,.35)'); fg.addColorStop(0.5, 'rgba(160,210,255,.08)'); fg.addColorStop(1, 'rgba(255,255,255,.22)'); g.fillStyle = fg; rr(g, x0, y0, S, S, S * 0.12); g.fill(); g.strokeStyle = 'rgba(230,248,255,.85)'; g.lineWidth = 2; rr(g, x0, y0, S, S, S * 0.12); g.stroke();
        g.save(); rr(g, x0, y0, S, S, S * 0.12); g.clip(); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1; for (let i = 0; i < 7; i++) { const a = i * 2.4 + 0.3, cx = x0 + S * ((i * 0.37) % 1), cy = y0 + S * ((i * 0.61) % 1), r = S * 0.05; for (let j = 0; j < 6; j++) { const b = a + j * 1.047; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(b) * r, cy + Math.sin(b) * r); g.stroke(); } } g.restore(); }
      if (look === 'brass') { g.strokeStyle = '#b8893a'; g.lineWidth = 4; rr(g, x0 + 2, y0 + 2, S - 4, S - 4, S * 0.11); g.stroke(); for (const [u, v] of [[0.05, 0.05], [0.95, 0.05], [0.05, 0.95], [0.95, 0.95], [0.5, 0.03], [0.5, 0.97], [0.03, 0.5], [0.97, 0.5]]) { const rg = g.createRadialGradient(x0 + S * u - 1, y0 + S * v - 1, 0, x0 + S * u, y0 + S * v, 5); rg.addColorStop(0, '#fff3c4'); rg.addColorStop(1, '#8a6420'); g.fillStyle = rg; g.beginPath(); g.arc(x0 + S * u, y0 + S * v, 4.5, 0, 7); g.fill(); } }
      for (let i = 0; i < 4; i++) { const [px, py] = cell(i % 2, i >> 1); if (look === 'brass') { const bg = g.createLinearGradient(px, py, px + cs, py + cs); bg.addColorStop(0, '#d9b45a'); bg.addColorStop(0.5, '#8f6a26'); bg.addColorStop(1, '#c49a45'); g.fillStyle = bg; } else g.fillStyle = panel; rr(g, px + cs * 0.06, py + cs * 0.06, cs * 0.88, cs * 0.88, cs * 0.1); g.fill(); if (look === 'brass') { g.strokeStyle = 'rgba(60,40,10,.6)'; g.lineWidth = 1.5; g.stroke(); } }
      const acc = i => calm ? '#9aa59f' : lux ? `hsl(${(h0 + i * 50) % 360},90%,62%)` : look === 'brass' ? ['#3d5c4a', '#5a2f22', '#2f3f5a', '#5a4a22', '#3a2a4a'][i] : look === 'frost' ? ['#bfe6ff', '#d6f4ff', '#a8d8ff', '#e6f7ff', '#c9e2ff'][i] : ['#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#c77dff'][i];
      // buttons
      const [bx, by] = cell(0, 0); for (const b of btn) { const [cx, cy] = bpos(b, bx, by), r = cs * 0.12; g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(cx, cy + 3, r, 0, 7); g.fill(); if (look === 'brass') { g.fillStyle = '#e0bd6a'; g.beginPath(); g.arc(cx, cy, r * 1.18, 0, 7); g.fill(); g.strokeStyle = '#6b4c18'; g.lineWidth = 1; g.stroke(); } g.fillStyle = acc(b.i); g.beginPath(); g.ellipse(cx, cy + b.d * 3, r * (1 + b.d * 0.12), r * (1 - b.d * 0.16), 0, 0, 7); g.fill(); if (look === 'frost') { g.strokeStyle = `rgba(255,255,255,${0.6 + b.d * 0.4})`; g.lineWidth = 1.5; g.stroke(); if (b.d > 0.3) { g.fillStyle = `rgba(200,240,255,${b.d * 0.35})`; g.beginPath(); g.arc(cx, cy, r * 1.7, 0, 7); g.fill(); } } g.fillStyle = `rgba(255,255,255,${0.35 - b.d * 0.2})`; g.beginPath(); g.arc(cx - r * 0.3, cy - r * 0.3 + b.d * 3, r * 0.35, 0, 7); g.fill(); if (lux && b.d > 0.3) { g.fillStyle = `hsla(${h0},100%,80%,${b.d * 0.4})`; g.beginPath(); g.arc(cx, cy, r * 1.6, 0, 7); g.fill(); } }
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
