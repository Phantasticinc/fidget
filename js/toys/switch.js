// Switch: a wall of chunky light switches. Each flick has a crisp snap and lights its lamp; flick them all on
// for a warm glow, or sweep a finger across the row to flick several in one stroke.
import { snd, buzz, opts, rich } from './kit2.js?v=1';
import { rr } from '../render.js?v=1';
import { emit } from '../bus.js';
const LAMP = [42, 28, 190, 320, 130, 260];
export function create() {
  let W, H, sw = [], cols, rows, pw, ph, t = 0, n = 0, F = new Map(), allOn = false;
  function layout() { cols = W > 600 ? 4 : 3; rows = 3; pw = Math.min((W - 40) / cols, 140); ph = Math.min(pw * 1.45, (H * 0.72) / rows); const ox = (W - pw * cols) / 2, oy = H * 0.46 - (ph * rows) / 2; const old = sw; sw = []; for (let i = 0; i < cols * rows; i++) sw.push({ x: ox + (i % cols) * pw, y: oy + Math.floor(i / cols) * ph, on: old[i] ? old[i].on : false, a: old[i] ? old[i].a : 0, l: old[i] ? old[i].l : 0, h: LAMP[i % LAMP.length] }); }
  const at = (x, y) => sw.find(s => x >= s.x && x < s.x + pw && y >= s.y && y < s.y + ph);
  function flick(s, on) { if (s.on === on) return; s.on = on; snd.toggle(on); snd.hum(on); buzz(on ? 14 : 10); n++; emit('switch', { x: s.x + pw / 2, y: s.y + ph / 2, on, toy: 'switch', rich: rich('switch') });
    const a = sw.every(q => q.on); if (a && !allOn) emit('switchAll', { x: W / 2, y: H / 2, toy: 'switch', rich: rich('switch') }); allOn = a; }
  return {
    resize(w, h) { W = w; H = h; layout(); },
    label: 'Switch: a wall of light switches. Flick up to switch a lamp on, down to switch it off, or swipe across several',
    hud: () => `${sw.filter(s => s.on).length}/${sw.length} on · ${n} flicks`,
    down(id, x, y) { const s = at(x, y); F.set(id, { x, y, s, done: false }); },
    move(id, x, y) { const f = F.get(id); if (!f) return; const dy = y - f.y; const s = at(x, y);
      if (s && s !== f.s) { f.s = s; f.y = y; f.done = false; }
      if (f.s && !f.done && Math.abs(dy) > 14) { flick(f.s, dy < 0); f.done = true; } },
    up(id) { const f = F.get(id); F.delete(id); if (f && f.s && !f.done) flick(f.s, !f.s.on); },
    step(dt) { t += dt; for (const s of sw) { s.a += ((s.on ? 1 : 0) - s.a) * Math.min(1, dt * 30); s.l += ((s.on ? 1 : 0) - s.l) * Math.min(1, dt * (s.on ? 9 : 4)); } },
    draw(g, W_, H_) {
      const calm = opts.calm, lux = rich('switch') && !calm, lit = sw.reduce((a, s) => a + s.l, 0) / sw.length;
      // room warms up as lamps come on
      g.fillStyle = calm ? `rgba(200,210,190,${lit * 0.08})` : `rgba(255,190,110,${lit * 0.14})`; g.fillRect(0, 0, W, H);
      for (const s of sw) { const cx = s.x + pw / 2, cy = s.y + ph / 2, plw = pw * 0.62, plh = ph * 0.78, hue = lux ? (s.h + t * 40) % 360 : s.h;
        if (s.l > 0.01) { const r = pw * (0.7 + (lux ? 0.3 * Math.sin(t * 3 + s.h) : 0)); const lg = g.createRadialGradient(cx, cy - plh * 0.62, 0, cx, cy - plh * 0.62, r); lg.addColorStop(0, calm ? `rgba(220,230,210,${0.35 * s.l})` : `hsla(${lux ? hue : 42},${lux ? 100 : 95}%,70%,${0.55 * s.l})`); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = lg; g.fillRect(cx - r, cy - plh * 0.62 - r, r * 2, r * 2); }
        g.fillStyle = calm ? '#666' : `hsla(${lux ? hue : 42},90%,${30 + s.l * 45}%,1)`; g.beginPath(); g.arc(cx, s.y + ph * 0.06 + 4, 5, 0, 7); g.fill();
        g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, cx - plw / 2 + 3, cy - plh / 2 + 6, plw, plh, 8); g.fill();
        g.fillStyle = calm ? '#c9cec9' : '#ece8df'; rr(g, cx - plw / 2, cy - plh / 2, plw, plh, 8); g.fill();
        g.fillStyle = 'rgba(0,0,0,.18)'; for (const sy of [-1, 1]) { g.beginPath(); g.arc(cx, cy + sy * plh * 0.4, 2.5, 0, 7); g.fill(); }
        const rw = plw * 0.42, rh = plh * 0.5; g.fillStyle = '#b9b3a6'; rr(g, cx - rw / 2, cy - rh / 2, rw, rh, 5); g.fill();
        const k = s.a * 2 - 1, lw = rw * 0.62, lh = rh * 0.62; // lever: tilts up (on) or down (off)
        g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, cx - lw / 2, cy - lh / 2 + (k < 0 ? 4 : 0) - k * lh * 0.12, lw, lh, 4); g.fill();
        const lgd = g.createLinearGradient(0, cy - lh / 2, 0, cy + lh / 2); lgd.addColorStop(0, k > 0 ? '#fff' : '#d8d2c4'); lgd.addColorStop(1, k > 0 ? '#d8d2c4' : '#fff'); g.fillStyle = lux && s.on ? `hsl(${hue},80%,78%)` : lgd; rr(g, cx - lw / 2, cy - lh / 2 - k * lh * 0.18, lw, lh * (0.8 + 0.2 * Math.abs(k)), 4); g.fill(); }
    },
  };
}
