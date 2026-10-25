// Click: mechanical switches with modelled travel (4 mm), actuation point, tactile bump and spring return.
import { sfx, buzz, opts } from '../feel.js?v=3';
import { rr, hsl } from '../render.js?v=1';
import { emit } from '../bus.js';
import { look } from '../look.js';
const KINDS = [
  { k: 'clicky', name: 'Clicky', stem: '#4d8dff', pitch: 1.05, hue: 30 },
  { k: 'tactile', name: 'Tactile', stem: '#b07a4a', pitch: 0.95, hue: 30 },
  { k: 'linear', name: 'Linear', stem: '#e5484d', pitch: 0.85, hue: 30 },
];
const GLY = ['○', '△', '□', '◇', '✕', '☆', '◐', '♡', '✦'];
export function create() {
  let W, H, keys = [], size, n = 0, fingers = new Map(), last = '';
  function layout() {
    size = Math.min((W * 0.74) / 3, 112); const gap = size * 0.1, tot = size * 3 + gap * 2;
    const x0 = (W - tot) / 2, y0 = H * 0.47 - tot / 2;
    keys = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) keys.push({ x: x0 + c * (size + gap), y: y0 + r * (size + gap), kind: KINDS[r], gl: GLY[r * 3 + c], t: 0, v: 0, held: 0, act: false, accent: r === 0 && c === 1 });
  }
  const at = (x, y) => keys.find(k => x >= k.x && x <= k.x + size && y >= k.y && y <= k.y + size);
  return {
    resize(w, h) { W = w; H = h; layout(); },
    hud: () => `${last ? last + ' · ' : ''}${n} clicks`,
    down(id, x, y) { const k = at(x, y); if (k) { k.held++; fingers.set(id, k); last = k.kind.name; } },
    move() {},
    up(id) { const k = fingers.get(id); if (k) { k.held = Math.max(0, k.held - 1); fingers.delete(id); } },
    step(dt) {
      for (const k of keys) {
        // force model: finger pushes with 1.0, spring 0.45->0.7 over travel; tactile adds a bump near 0.45 travel
        const finger = k.held ? 1.25 : 0, spring = 0.45 + 0.25 * k.t;
        let bump = 0; if (k.kind.k !== 'linear') bump = Math.exp(-(((k.t - 0.4) / 0.08) ** 2)) * (k.kind.k === 'clicky' ? 0.6 : 0.45);
        k.v += ((finger - spring - bump) * 260 - k.v * 18) * dt; k.t += k.v * dt;
        if (k.t > 1) { if (k.v > 2) { sfx.key(k.kind.k, 'down', k.kind.pitch * (look.click && look.click.pitch || 1)); buzz(k.kind.k === 'linear' ? 8 : 12); } k.t = 1; k.v = 0; }
        if (k.t < 0) { if (k.v < -2) sfx.key(k.kind.k, 'up', k.kind.pitch * 1.1); k.t = 0; k.v = 0; }
        if (!k.act && k.t > 0.5) { k.act = true; n++; emit('key', { x: k.x + size / 2, y: k.y + size / 2, size, kind: k.kind.k, i: keys.indexOf(k) }); /* fire at actuation: quick phone taps never bottom out */ if (k.kind.k === 'clicky') buzz(6); }
        if (k.act && k.t < 0.35) k.act = false;
      }
    },
    draw(g) {
      const calm = opts.calm;
      // plate
      const pad = size * 0.16, k0 = keys[0], k8 = keys[8];
      rr(g, k0.x - pad, k0.y - pad, k8.x + size - k0.x + pad * 2, k8.y + size - k0.y + pad * 2, size * 0.28);
      g.fillStyle = calm ? '#1b1f1d' : '#1b1c20'; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30; g.shadowOffsetY = 14; g.fill(); g.shadowColor = 'transparent';
      g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1; g.stroke();
      for (const k of keys) {
        const d = k.t * size * 0.07, s = size, x = k.x, y = k.y;
        // well + switch stem peek
        rr(g, x + 3, y + 3, s - 6, s - 6, s * 0.16); g.fillStyle = '#0b0b0d'; g.fill();
        g.fillStyle = k.kind.stem; g.globalAlpha = 0.5; g.fillRect(x + s / 2 - 5, y + s - 10, 10, 4); g.globalAlpha = 1;
        // cap side (skirt)
        const lift = s * 0.07 - d; const cx = x + 2, cy = y + 2 + d, cw = s - 4, ch = s - 4;
        const cap = calm ? [150, 6] : look.click ? (k.accent ? look.click.accent : look.click.cap) : k.accent ? [18, 85] : [40, 6];
        rr(g, cx, cy, cw, ch, s * 0.16); g.fillStyle = hsl(cap[0], cap[1], k.accent && !calm ? 40 : 68); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 4 + lift * 1.5; g.shadowOffsetY = lift * 0.9; g.fill(); g.shadowColor = 'transparent';
        // dished top
        const ix = cx + s * 0.11, iy = cy + s * 0.06, iw = cw - s * 0.22, ih = ch - s * 0.2;
        const tg = g.createLinearGradient(0, iy, 0, iy + ih);
        const L = !calm && look.click ? look.click.L : k.accent && !calm ? 55 : 86;
        tg.addColorStop(0, hsl(cap[0], cap[1], L + 4)); tg.addColorStop(1, hsl(cap[0], cap[1], L - 8));
        rr(g, ix, iy, iw, ih, s * 0.12); g.fillStyle = tg; g.fill();
        const dg = g.createRadialGradient(ix + iw / 2, iy + ih * 0.65, 0, ix + iw / 2, iy + ih * 0.6, iw * 0.7);
        dg.addColorStop(0, 'rgba(0,0,0,.08)'); dg.addColorStop(1, 'rgba(255,255,255,.06)'); g.fillStyle = dg; g.fill();
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(ix + s * .12, iy + 1); g.lineTo(ix + iw - s * .12, iy + 1); g.stroke();
        g.fillStyle = k.accent && !calm ? 'rgba(255,255,255,.9)' : 'rgba(40,38,35,.55)'; g.font = `${s * 0.26}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(k.gl, ix + iw / 2, iy + ih / 2 + 1);
      }
      emit('clickDraw', { g, keys, size });
    },
  };
}
