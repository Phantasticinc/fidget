// Squish: memory-foam stress ball. Press in and it dimples under your finger and bulges out sideways;
// let go and it rises back slowly. Pinch the rim between two fingers to squeeze it.
import { snd, buzz, opts, rich } from './kit2.js?v=1';
import { sprite, DPR } from '../render.js?v=1';
import { emit } from '../bus.js';
import { body } from './soft.js?v=1';
export function create() {
  let W, H, B = body({ N: 56, kShape: 140, kEdge: 900, damp: 9, pressure: 4 }), F = new Map(), dims = [], tex = null, t = 0, n = 0, beads = [];
  function layout() { const r = Math.min(W * 0.36, H * 0.25, 170); B.place(W / 2, H * 0.47, r); paint(); if (!beads.length) for (let i = 0; i < 14; i++) beads.push({ a: Math.random() * 6.28, r: Math.sqrt(Math.random()) * 0.75, x: 0, y: 0, vx: 0, vy: 0 }); }
  function paint() { // foam texture: tiny pores
    const R = B.R; tex = sprite(R * 2.6, DPR(), (g, z) => { for (let i = 0; i < 900; i++) { const x = Math.random() * z, y = Math.random() * z; g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.09})`; g.beginPath(); g.arc(x, y, Math.random() * 1.6 + 0.3, 0, 7); g.fill(); } });
  }
  const ins = (x, y) => Math.hypot(x - B.cx, y - B.cy) < B.R * 0.92;
  return {
    resize(w, h) { W = w; H = h; layout(); },
    label: 'Squish: memory-foam stress ball. Press to dimple it, pinch the edge to squeeze, let go and it slowly rises back',
    hud: () => `${n} squeezes`,
    down(id, x, y, pr) { const f = { x, y, r: B.R * 0.3, dent: !ins(x, y), d: 0, p: pr > 0 && pr < 1 ? 0.6 + pr * 0.6 : 1 }; F.set(id, f); if (!f.dent) { const dm = { x: x - B.cx, y: y - B.cy, d: 0, f }; dims.push(dm); f.dm = dm; } },
    move(id, x, y, pr) { const f = F.get(id); if (!f) return; f.x = x; f.y = y; if (pr > 0 && pr < 1) f.p = 0.6 + pr * 0.6; if (f.dm) { f.dm.x = x - B.cx; f.dm.y = y - B.cy; if (!ins(x, y)) { f.dm.f = null; f.dm = null; f.dent = true; } } else if (ins(x, y) && !f.dent) {} },
    up(id) { const f = F.get(id); if (!f) return; F.delete(id); if (f.dm) { f.dm.f = null; snd.exhale(f.dm.d); } },
    step(dt) {
      t += dt; let sw = 0;
      for (const d of dims) { if (d.f) { const was = d.d; d.d += (d.f.p - d.d) * Math.min(1, dt * 9); if (was < 0.5 && d.d >= 0.5) { n++; snd.foam(d.d); buzz(16); emit('squish', { x: B.cx + d.x, y: B.cy + d.y, r: B.R, toy: 'squish', rich: rich('squish') }); } }
        else d.d *= Math.pow(0.25, dt); /* memory foam: slow rise */ sw += d.d; }
      dims = dims.filter(d => d.f || d.d > 0.01);
      B.swell = Math.min(0.35, sw * 0.16);
      const pinch = [...F.values()].filter(f => f.dent && Math.hypot(f.x - B.cx, f.y - B.cy) < B.R * 1.35);
      const def = B.step(dt, pinch);
      if (pinch.length >= 2 && def > 0.25 && !this._p) { this._p = 1; n++; snd.foam(def); buzz(20); emit('squish', { x: B.cx, y: B.cy, r: B.R, toy: 'squish', rich: rich('squish') }); } else if (def < 0.12) this._p = 0;
      for (const b of beads) { // gel beads drift away from presses (premium look)
        let fx = (Math.cos(b.a) * b.r * B.R - b.x) * 6, fy = (Math.sin(b.a) * b.r * B.R - b.y) * 6;
        for (const d of dims) { const dx = b.x - d.x, dy = b.y - d.y, l = Math.hypot(dx, dy) + 8; fx += dx / l * d.d * 900 / l * 8; fy += dy / l * d.d * 900 / l * 8; }
        b.vx += (fx - b.vx * 5) * dt; b.vy += (fy - b.vy * 5) * dt; b.x += b.vx * dt; b.y += b.vy * dt; }
    },
    draw(g) {
      const calm = opts.calm, lux = rich('squish') && !calm, R = B.R, cx = B.cx, cy = B.cy;
      g.save(); g.fillStyle = 'rgba(0,0,0,.4)'; g.filter = 'blur(14px)'; g.beginPath(); g.ellipse(cx + 6, cy + R * 0.9, R * (1 + (B.swell || 0)), R * 0.25, 0, 0, 7); g.fill(); g.filter = 'none'; g.restore();
      B.path(g);
      const gr = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.15);
      if (calm) { gr.addColorStop(0, '#9fb3a8'); gr.addColorStop(1, '#3d4a43'); }
      else if (lux) { const h = (t * 25) % 360; gr.addColorStop(0, `hsla(${h + 40},100%,82%,.95)`); gr.addColorStop(0.5, `hsla(${h + 280},85%,45%,.85)`); gr.addColorStop(1, `hsla(${h + 230},90%,18%,.95)`); }
      else { gr.addColorStop(0, '#ffd08a'); gr.addColorStop(0.55, '#ff9a3c'); gr.addColorStop(1, '#a3480f'); }
      g.fillStyle = gr; g.fill();
      g.save(); g.clip();
      if (!lux) { g.globalAlpha = 0.9; g.drawImage(tex, cx - R * 1.3, cy - R * 1.3, R * 2.6, R * 2.6); g.globalAlpha = 1; }
      else { g.globalCompositeOperation = 'lighter'; for (const b of beads) { const x = cx + b.x, y = cy + b.y, br = R * 0.07; const bg = g.createRadialGradient(x, y, 0, x, y, br * 2.5); bg.addColorStop(0, 'rgba(255,255,255,.9)'); bg.addColorStop(0.3, `hsla(${(t * 40 + b.a * 60) % 360},100%,70%,.6)`); bg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = bg; g.fillRect(x - br * 2.5, y - br * 2.5, br * 5, br * 5); } g.globalCompositeOperation = 'source-over'; }
      // dimples: dark crescent on the light side, bright lip on the far side
      for (const d of dims) { const x = cx + d.x, y = cy + d.y, r = R * (0.22 + d.d * 0.12), k = d.d;
        const dg = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r * 1.4); dg.addColorStop(0, `rgba(0,0,0,${0.45 * k})`); dg.addColorStop(0.6, `rgba(0,0,0,${0.18 * k})`); dg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = dg; g.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3);
        g.strokeStyle = `rgba(255,255,255,${0.25 * k})`; g.lineWidth = r * 0.18; g.beginPath(); g.arc(x, y, r * 1.05, 0.1, 1.6); g.stroke(); }
      g.restore();
      g.fillStyle = `rgba(255,255,255,${lux ? 0.45 : 0.28})`; g.beginPath(); g.ellipse(cx - R * 0.38, cy - R * 0.45, R * 0.28, R * 0.15, -0.6, 0, 7); g.fill();
    },
  };
}
