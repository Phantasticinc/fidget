// Spin: machined tri-lobe spinner. Direct-grab rotation, real inertia + bearing friction,
// detent clicks at low speed, bearing whir at high speed, fixed studio lighting over a rotating body.
import { sfx, buzz, opts } from '../feel.js?v=3';
import { sprite, DPR } from '../render.js?v=1';
import { emit } from '../bus.js';
import { look } from '../look.js';
export function create() {
  let W, H, cx, cy, R, body, off, og, a = 0, w = 0, grab = null, best = +(localStorage.getItem('fidget.rpm') || 0), lastDet = 0, hist = [];
  const DET = 2 * Math.PI / 18;
  function paint() {
    const d = DPR(), S = R * 2;
    body = sprite(S, d, (g, z) => {
      const c = z / 2, lr = R * 0.33, lo = R * 0.62;
      g.translate(c, c);
      const shape = () => { g.beginPath(); g.arc(0, 0, R * 0.36, 0, 7); for (let i = 0; i < 3; i++) { const t = i * 2.094 - 1.571; g.moveTo(Math.cos(t) * lo + lr, Math.sin(t) * lo); g.arc(Math.cos(t) * lo, Math.sin(t) * lo, lr, 0, 7); } };
      // web between lobes
      g.beginPath(); for (let i = 0; i < 3; i++) { const t = i * 2.094 - 1.571; const x = Math.cos(t) * lo, y = Math.sin(t) * lo; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath();
      g.lineJoin = 'round'; g.lineWidth = lr * 1.3; g.strokeStyle = '#000'; g.stroke(); g.fillStyle = '#000'; g.fill();
      shape(); g.fill();
      g.globalCompositeOperation = 'source-atop';
      const base = opts.calm ? ['#5d6661', '#2c312e'] : (look.spin ? look.spin.base : ['#6b6f76', '#2a2c31']);
      const lg = g.createLinearGradient(-R, -R, R, R); lg.addColorStop(0, base[0]); lg.addColorStop(1, base[1]); g.fillStyle = lg; g.fillRect(-R, -R, S, S);
      // brushed texture: concentric lines
      g.lineWidth = 0.6; for (let r = 4; r < R; r += 1.6) { g.strokeStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.04})`; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); }
      g.globalCompositeOperation = 'source-over';
      // lobe bearings/weights: polished steel discs with recess
      for (let i = 0; i < 3; i++) {
        const t = i * 2.094 - 1.571, x = Math.cos(t) * lo, y = Math.sin(t) * lo, r = lr * 0.68;
        g.fillStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.arc(x, y, r + 2.5, 0, 7); g.fill();
        const rg = g.createRadialGradient(x - r * .3, y - r * .3, 0, x, y, r); const dk = (!opts.calm && look.spin) ? look.spin.disc : ['#f3f3f1', '#9a9da3', '#3b3d42']; rg.addColorStop(0, dk[0]); rg.addColorStop(.5, dk[1]); rg.addColorStop(1, dk[2]);
        g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (let k = 1; k < 4; k++) { g.beginPath(); g.arc(x, y, r * k / 4, 0, 7); g.stroke(); }
      }
      // index mark so rotation is legible
      g.fillStyle = opts.calm ? '#9fb4a8' : '#ff7a45'; g.beginPath(); g.arc(0, -R * 0.62 - lr * 0.84, 2.4, 0, 7); g.fill();
    });
    off = document.createElement('canvas'); off.width = off.height = Math.ceil(S * d); og = off.getContext('2d');
  }
  const ang = (x, y) => Math.atan2(y - cy, x - cx);
  return {
    repaint() { paint(); },
    resize(w_, h) { W = w_; H = h; cx = W / 2; cy = H * 0.47; R = Math.min(W * 0.4, H * 0.28, 210); paint(); },
    leave() { sfx.whir(0); },
    hud() { const rpm = Math.abs(w) * 60 / 6.283; return `${Math.round(rpm)} rpm · best ${Math.round(best)}`; },
    down(id, x, y) { if (grab || Math.hypot(x - cx, y - cy) > R * 1.15) return; grab = { id, off: ang(x, y) - a }; hist = [[performance.now(), a]]; w = 0; grab.ts = 1; buzz(6); },
    move(id, x, y, _p, ts) { // event timestamps keep flick speed honest even when a frame is slow
      if (!grab || grab.id !== id) return; let t = ang(x, y) - grab.off;
      while (t - a > Math.PI) t -= 6.283; while (t - a < -Math.PI) t += 6.283; a = t;
      const now = ts || performance.now(); hist.push([now, a]); while (hist.length > 2 && now - hist[0][0] > 70) hist.shift();
    },
    up(id) {
      if (!grab || grab.id !== id) return; grab = null;
      if (hist.length > 1) { const [t0, a0] = hist[0], [t1, a1] = hist[hist.length - 1]; if (t1 - t0 > 5) w = (a1 - a0) / ((t1 - t0) / 1000); }
      w = Math.max(-260, Math.min(260, w));
    },
    step(dt) {
      if (!grab) {
        const s = Math.sign(w), dec = (look.spin && look.spin.drag || 1) * (0.35 + 0.012 * Math.abs(w) + 0.00004 * w * w); // coulomb + viscous + air
        const nw = w - s * dec * dt; w = Math.sign(nw) === s ? nw : 0; a += w * dt;
      } else if (hist.length > 1) { const [t0, a0] = hist[0], [t1, a1] = hist[hist.length - 1]; w = t1 > t0 ? (a1 - a0) / ((t1 - t0) / 1000) : 0; }
      const det = Math.floor(a / DET);
      if (det !== lastDet) { lastDet = det; const sp = Math.abs(w); if (sp < 40) { sfx.tick(sp / 40); if (sp < 18) buzz(4); } }
      const rpm = Math.abs(w) * 9.549; if (!grab) emit('rpm', rpm); if (!grab && rpm > best) { best = rpm; localStorage.setItem('fidget.rpm', Math.round(best)); }
      sfx.whir(Math.min(1, Math.abs(w) / 160));
    },
    draw(g) {
      const S = R * 2, d = DPR();
      // contact shadow
      const sg = g.createRadialGradient(cx, cy + R * 0.12, R * 0.2, cx, cy + R * 0.12, R * 1.2);
      sg.addColorStop(0, 'rgba(0,0,0,.55)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(cx - R * 1.3, cy - R * 1.2, R * 2.6, R * 2.6);
      og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, off.width, off.height); og.translate(off.width / 2, off.height / 2);
      const sp = Math.abs(w), ghosts = sp > 25 ? Math.min(6, Math.floor(sp / 25)) : 0, frameA = w / 60;
      for (let i = ghosts; i >= 0; i--) { og.save(); og.rotate(a - frameA * i / (ghosts || 1)); og.globalAlpha = i ? 0.5 / (ghosts + 1) : 1; og.drawImage(body, -off.width / 2, -off.height / 2); og.restore(); }
      // fixed key light sheen (doesn't rotate)
      og.setTransform(1, 0, 0, 1, 0, 0); og.globalCompositeOperation = 'source-atop';
      const cg = og.createConicGradient ? og.createConicGradient(-0.6, off.width / 2, off.height / 2) : null;
      if (cg) { cg.addColorStop(0, 'rgba(255,255,255,.22)'); cg.addColorStop(.12, 'rgba(255,255,255,0)'); cg.addColorStop(.5, 'rgba(255,255,255,.16)'); cg.addColorStop(.62, 'rgba(255,255,255,0)'); cg.addColorStop(1, 'rgba(255,255,255,.22)'); og.fillStyle = cg; og.fillRect(0, 0, off.width, off.height); }
      og.globalCompositeOperation = 'source-over';
      g.drawImage(off, cx - R, cy - R, S, S);
      // centre bearing cap (static)
      const r = R * 0.22, rg = g.createRadialGradient(cx - r * .35, cy - r * .4, 0, cx, cy, r);
      rg.addColorStop(0, '#fafaf8'); rg.addColorStop(.45, '#b9bcc2'); rg.addColorStop(1, '#4a4c52');
      g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 8; g.shadowOffsetY = 3; g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.shadowColor = 'transparent';
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, r * 0.6, 0, 7); g.stroke();
      emit('spinDraw', { g, cx, cy, R, a, w });
      if (!sp && !grab) { g.fillStyle = 'rgba(236,235,232,.35)'; g.font = '13px system-ui'; g.textAlign = 'center'; g.fillText('flick to spin', cx, cy + R * 1.35); }
    },
  };
}
