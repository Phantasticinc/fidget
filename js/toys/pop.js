// Pop: bubble wrap with springy domes, finger-roll popping, neighbour jiggle and endless sheets.
import { sfx, buzz } from '../feel.js?v=4';
import { opts } from '../feel.js?v=4';
import { sprite, rr, DPR, hsl } from '../render.js?v=1';
import { emit } from '../bus.js';
import { look } from '../look.js';
const TINTS = [[205, 30], [32, 55], [150, 22], [345, 35], [265, 25]];
export function create() {
  let W, H, sx, sy, sw, sh, R, B = [], sheet = 0, popped = 0, total = 0, slide = 0, spr = {}, fingers = new Map(), streak = 0, lastPop = 0, phase = 0, vel = 0;
  function build() {
    const cols = 6; R = Math.min(W * 0.84, 380) / (cols * 2 + 1) * 1.02;
    sw = R * (cols * 2 + 1); const rows = Math.floor(Math.min(H * 0.6, sw * 1.35) / (R * 1.78));
    sh = rows * R * 1.78 + R * 0.6; sx = (W - sw) / 2; sy = (H - sh) / 2 - 10;
    B = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols - (r % 2); c++) {
      const x = sx + R * 1.5 + c * R * 2 + (r % 2 ? R : 0), y = sy + R * 1.2 + r * R * 1.78;
      B.push({ x, y, d: 0, v: 0, popped: false, held: 0, wob: 0, wv: 0 });
    }
    total = B.length; popped = 0; paint();
  }
  function paint() {
    const [h, s] = opts.calm ? [150, 8] : (look.pop ? look.pop.tint : TINTS[sheet % TINTS.length]), d = DPR(), S = R * 2.4;
    spr.dome = sprite(S, d, (g, z) => {
      const c = z / 2, r = R * 0.92;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(c + r * 0.06, c + r * 0.16, r, r * 0.95, 0, 0, 7); g.filter = 'blur(3px)'; g.fill(); g.filter = 'none';
      let gr = g.createRadialGradient(c - r * .35, c - r * .4, r * .1, c, c, r);
      gr.addColorStop(0, hsl(h, s, 92, .55)); gr.addColorStop(.55, hsl(h, s, 70, .28)); gr.addColorStop(.9, hsl(h, s + 10, 45, .42)); gr.addColorStop(1, hsl(h, s, 85, .55));
      g.fillStyle = gr; g.beginPath(); g.arc(c, c, r, 0, 7); g.fill();
      g.strokeStyle = hsl(h, s, 90, .35); g.lineWidth = 1; g.stroke();
      gr = g.createRadialGradient(c - r * .38, c - r * .42, 0, c - r * .38, c - r * .42, r * .42);
      gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.35, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(c - r * .38, c - r * .42, r * .42, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = r * 0.07; g.lineCap = 'round';
      g.beginPath(); g.arc(c, c, r * .8, Math.PI * .15, Math.PI * .45); g.stroke();
    });
    spr.flat = sprite(S, d, (g, z) => {
      const c = z / 2, r = R * 0.9; g.translate(c, c);
      g.fillStyle = hsl(h, s, 60, .12); g.strokeStyle = hsl(h, s, 85, .22); g.lineWidth = 1;
      g.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, rr = r * (0.78 + Math.random() * 0.2); i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 5; i++) { const a = Math.random() * 6.28; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * .7, Math.sin(a) * r * .7); g.stroke(); }
    });
    spr.sheet = document.createElement('canvas'); spr.sheet.width = (sw + 80) * d; spr.sheet.height = (sh + 80) * d;
    const q = spr.sheet.getContext('2d'); q.scale(d, d); q.translate(40, 40);
    const gr = q.createLinearGradient(0, 0, sw, sh); gr.addColorStop(0, hsl(h, s, 70, .10)); gr.addColorStop(1, hsl(h, s, 40, .06));
    q.shadowColor = 'rgba(0,0,0,.5)'; q.shadowBlur = 30; q.shadowOffsetY = 12; rr(q, 0, 0, sw, sh, R * 0.7); q.fillStyle = gr; q.fill(); q.shadowColor = 'transparent';
    q.strokeStyle = 'rgba(255,255,255,.09)'; q.lineWidth = 1; q.stroke();
    spr.h = h; spr.s = s;
  }
  function hit(x, y) { for (const b of B) if (!b.popped && (x - b.x) ** 2 + (y - b.y - slide) ** 2 < (R * 0.95) ** 2) return b; return null; }
  function pop(b, f) {
    b.popped = true; popped++; const now = performance.now(); streak = now - lastPop < 260 ? streak + 1 : 0; lastPop = now;
    sfx.pop(Math.random() * 0.4 + 0.3, f); emit('pop', { x: b.x, y: b.y + slide, r: R, streak, h: spr.h, s: spr.s }); buzz(14 + Math.random() * 6);
    for (const n of B) { const dd = Math.hypot(n.x - b.x, n.y - b.y); if (n !== b && dd < R * 4.5) n.wv += (R * 4.5 - dd) / R * 1.6; }
    if (popped === total) setTimeout(next, 650);
  }
  function next() { emit('sheet', {}); phase = 1; vel = 0; sfx.chime(440 + sheet * 30); }
  function press(id, x, y) {
    const b = hit(x, y); const f = fingers.get(id) || {}; if (b && f.b !== b) { if (f.b) f.b.held = 0; b.held = 1; sfx.press(); }
    f.b = b; f.t = performance.now(); fingers.set(id, f);
  }
  return {
    resize(w, h) { W = w; H = h; build(); },
    enter() {}, hud: () => phase ? 'Fresh sheet' : `${popped} / ${total}${streak > 3 ? ` · ${streak + 1}× roll` : ''}`,
    down(id, x, y) { press(id, x, y); },
    move(id, x, y) { press(id, x, y); },
    up(id) { const f = fingers.get(id); if (f && f.b && !f.b.popped) pop(f.b, 0.7); fingers.delete(id); },
    step(dt) {
      if (phase === 1) { vel += dt * H * 9; slide -= vel * dt; if (slide < -H) { sheet++; build(); slide = H; phase = 2; } }
      else if (phase === 2) { slide += (0 - slide) * Math.min(1, dt * 9); if (slide < 0.5) { slide = 0; phase = 0; } }
      const now = performance.now();
      for (const b of B) {
        // dome spring: held bubbles compress, pop when compression completes (~70ms)
        const tgt = b.popped ? 1 : b.held ? 1 : 0; b.v += ((tgt - b.d) * 900 - b.v * 32) * dt; b.d += b.v * dt;
        if (!b.popped && b.held && b.d > 0.82) { b.held = 0; pop(b, 1); for (const f of fingers.values()) if (f.b === b) f.b = null; }
        b.wv += (-b.wob * 520 - b.wv * 14) * dt; b.wob += b.wv * dt;
      }
    },
    draw(g) {
      const oy = slide;
      g.save(); g.translate(0, oy);
      g.drawImage(spr.sheet, sx - 40, sy - 40, sw + 80, sh + 80);
      const S = R * 2.4;
      for (const b of B) {
        const s = b.popped ? 1 : 1 - b.d * 0.16 + b.wob * 0.02, sq = b.popped ? 1 : 1 + b.d * 0.06;
        if (b.popped) { g.globalAlpha = 1; g.drawImage(spr.flat, b.x - S / 2, b.y - S / 2, S, S); continue; }
        g.globalAlpha = 1 - b.d * 0.35;
        g.drawImage(spr.dome, b.x - S * sq / 2, b.y - S * s / 2 + b.d * R * 0.08, S * sq, S * s);
      }
      g.globalAlpha = 1; g.restore();
    },
  };
}
