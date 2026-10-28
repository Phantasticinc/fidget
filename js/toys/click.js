// Click: a 3x3 macro pad where every key does something different. Each key has modelled travel (actuation point,
// tactile bump, spring return) plus its own function, sound and haptic:
//  Clicky · Tactile · Silent / Latch · Charge · Double / Rapid · Rocker · Typewriter
import { sfx, synth, buzz, buzzPattern, opts } from '../feel.js?v=6';
import { rr, hsl } from '../render.js?v=1';
import { emit } from '../bus.js';
import { look } from '../look.js';
const STEM = { clicky: '#4d8dff', tactile: '#b07a4a', linear: '#e5484d' };
// f: function id, kind: switch voice family (also what upgrade skins key off), p: base pitch, g: glyph
export const KEYS = [
  { f: 'clicky', name: 'Clicky', kind: 'clicky', p: 1.05, g: '●' },
  { f: 'tactile', name: 'Tactile', kind: 'tactile', p: 0.95, g: '▲' },
  { f: 'silent', name: 'Silent', kind: 'linear', p: 0.8, g: '◌' },
  { f: 'latch', name: 'Latch', kind: 'clicky', p: 0.9, g: '⏻' },
  { f: 'charge', name: 'Charge', kind: 'linear', p: 0.75, g: '⚡' },
  { f: 'double', name: 'Double', kind: 'clicky', p: 1.15, g: '××' },
  { f: 'rapid', name: 'Rapid', kind: 'clicky', p: 1.25, g: '≫' },
  { f: 'rocker', name: 'Rocker', kind: 'tactile', p: 1, g: '◀▶' },
  { f: 'type', name: 'Typewriter', kind: 'tactile', p: 0.7, g: '⌨' },
];
const v = fn => { if (synth.ok()) fn(synth, synth.t(), synth.cm()); };
const hap = p => buzzPattern(opts.calm ? (Array.isArray(p) ? p.map(x => Math.max(1, x >> 1)) : Math.max(1, p >> 1)) : p);
const voice = {
  whisper() { v((s, t, k) => s.nz(t, 0.03, 'lowpass', 700, 0.7, 0.12 * k)); },
  latch(on) { v((s, t, k) => { s.nz(t, 0.012, 'bandpass', on ? 3200 : 2600, 4, 0.7 * k); s.nz(t + 0.05, 0.012, 'bandpass', on ? 2600 : 2000, 4, 0.45 * k); if (on) s.tone(t + 0.05, 1320, 1320, 0.05, 0.03 * k, 'sine'); }); },
  chirp() { v((s, t, k) => { s.tone(t, 900, 1800, 0.06, 0.07 * k, 'triangle'); s.tone(t + 0.07, 1350, 2700, 0.07, 0.06 * k, 'triangle'); }); },
  charge(a) { v((s, t, k) => s.tone(t, 90 + a * 500, 92 + a * 520, 0.07, 0.025 * k, 'sawtooth')); },
  thunk(a) { v((s, t, k) => { s.nz(t, 0.08 + a * 0.15, 'lowpass', 300 + a * 500, 0.9, (0.3 + a * 0.6) * k); s.tone(t, 160 + a * 60, 40, 0.18 + a * 0.3, (0.12 + a * 0.25) * k, 'sine'); }); },
  rocker(dir) { v((s, t, k) => { s.nz(t, 0.014, 'bandpass', dir < 0 ? 1700 : 2600, 5, 0.6 * k); s.tone(t, dir < 0 ? 330 : 495, dir < 0 ? 300 : 450, 0.04, 0.05 * k, 'triangle'); }); },
  type() { v((s, t, k) => { s.nz(t, 0.02, 'bandpass', s.jit(1200, 0.1), 2, 0.8 * k); s.nz(t + 0.012, 0.05, 'lowpass', 500, 0.8, 0.4 * k); }); },
  bell() { v((s, t, k) => { s.tone(t, 2093, 2093, 0.9, 0.08 * k, 'sine'); s.tone(t, 2093 * 2.76, 2093 * 2.76, 0.4, 0.025 * k, 'sine'); }); },
};
export function create() {
  let W, H, keys = [], size, n = 0, fingers = new Map(), last = '', now = 0;
  function layout() {
    size = Math.min((W * 0.74) / 3, 112); const gap = size * 0.1, tot = size * 3 + gap * 2;
    const x0 = (W - tot) / 2, y0 = H * 0.47 - tot / 2;
    const old = keys; keys = KEYS.map((K, i) => Object.assign(old[i] || { t: 0, v: 0, held: 0, act: false, on: false, charge: 0, lastAct: -9, flash: 0, rep: 0, repN: 0, tilt: 0, count: 0, note: '' }, { x: x0 + (i % 3) * (size + gap), y: y0 + Math.floor(i / 3) * (size + gap), K, kind: { k: K.kind }, accent: K.f === 'charge' }));
  }
  const at = (x, y) => keys.find(k => x >= k.x && x <= k.x + size && y >= k.y && y <= k.y + size);
  const fire = (k, extra) => { n++; emit('key', { x: k.x + size / 2, y: k.y + size / 2, size, kind: k.K.kind, fn: k.K.f, i: keys.indexOf(k), ...extra }); };
  const P = k => k.K.p * (look.click && look.click.pitch || 1);
  function actuate(k) { // fires once per press at the actuation point
    const f = k.K.f;
    if (f === 'latch') { k.on = !k.on; voice.latch(k.on); hap(k.on ? [10, 40, 6] : 8); k.note = k.on ? 'ON' : 'OFF'; fire(k, { on: k.on }); return; }
    if (f === 'double') { if (now - k.lastAct < 0.32) { voice.chirp(); hap([8, 30, 8]); k.flash = 1; k.note = 'DOUBLE!'; k.lastAct = -9; fire(k, { double: true }); return; } k.lastAct = now; }
    if (f === 'charge') { k.charge = 0; return; } // fires on release
    if (f === 'rapid') { k.rep = 0; k.repN = 0; }
    if (f === 'rocker') { voice.rocker(k.tilt); hap(k.tilt < 0 ? 6 : [4, 25, 4]); k.note = k.tilt < 0 ? '◀' : '▶'; }
    if (f === 'type') { k.count++; voice.type(); hap(12); if (k.count % 10 === 0) { voice.bell(); hap([10, 60, 30]); k.flash = 1; k.note = 'DING'; fire(k, { bell: true }); return; } k.note = String(k.count % 10); }
    if (f === 'clicky') hap(6);
    fire(k);
  }
  return {
    resize(w, h) { W = w; H = h; layout(); },
    label: 'Click: nine keys that each do something different: clicky, tactile, silent, latch, charge, double-click, rapid fire, rocker and typewriter',
    hud: () => `${last ? last + ' · ' : ''}${n} clicks`,
    down(id, x, y) { const k = at(x, y); if (!k) return; k.held++; fingers.set(id, k); last = k.K.name; if (k.K.f === 'rocker') k.tilt = x < k.x + size / 2 ? -1 : 1; },
    move() {},
    up(id) { const k = fingers.get(id); if (!k) return; k.held = Math.max(0, k.held - 1); fingers.delete(id);
      if (k.K.f === 'charge' && !k.held && k.act) { const a = Math.min(1, k.charge); voice.thunk(a); hap(a > 0.95 ? [20, 30, 60] : Math.round(10 + a * 40)); k.flash = a; k.note = a > 0.95 ? 'MAX!' : Math.round(a * 100) + '%'; fire(k, { charge: a }); k.charge = 0; } },
    step(dt) {
      now += dt;
      for (const k of keys) {
        const f = k.K.f, kind = k.K.kind;
        k.flash = Math.max(0, k.flash - dt * 2);
        // force model: finger 1.25, spring 0.45->0.7 over travel, tactile bump near 0.4 travel; latch holds the stem at 55% when on
        const finger = k.held ? 1.25 : 0, spring = 0.45 + 0.25 * k.t;
        let bump = 0; if (kind !== 'linear') bump = Math.exp(-(((k.t - 0.4) / 0.08) ** 2)) * (kind === 'clicky' ? 0.6 : 0.45);
        k.v += ((finger - spring - bump) * 260 - k.v * 18) * dt; k.t += k.v * dt;
        if (f === 'latch' && k.on && !k.held && k.t < 0.55) { k.t = 0.55; k.v = 0; }
        if (k.t > 1) { if (k.v > 2) { if (f === 'silent') { voice.whisper(); hap(3); } else if (f !== 'type' && f !== 'rocker') { sfx.key(kind, 'down', P(k)); if (f !== 'latch' && f !== 'double') buzz(kind === 'linear' ? 8 : 12); } } k.t = 1; k.v = 0; }
        if (k.t < 0) { if (k.v < -2 && f !== 'silent') sfx.key(kind, 'up', P(k) * 1.1); k.t = 0; k.v = 0; }
        const th = f === 'latch' && k.on ? 0.8 : 0.5;
        if (!k.act && k.t > th) { k.act = true; actuate(k); }
        if (k.act && (k.t < 0.35 || f === 'latch' && k.on && !k.held && k.t < 0.6)) k.act = false;
        if (f === 'charge' && k.held && k.act) { const was = k.charge; k.charge = Math.min(1.2, k.charge + dt / 1.2); if (Math.floor(was * 12) !== Math.floor(k.charge * 12) && k.charge <= 1) { voice.charge(k.charge); hap(2); } }
        if (f === 'rapid' && k.held && k.act) { k.rep += dt; const iv = Math.max(0.05, 0.16 - k.repN * 0.008); if (k.rep > iv) { k.rep = 0; k.repN++; sfx.key('clicky', 'down', P(k) * (1 + Math.min(0.3, k.repN * 0.01))); hap(4); k.t = 0.75; k.note = '×' + k.repN; fire(k, { rapid: k.repN }); } }
        if (f === 'rocker' && !k.held) k.tilt *= Math.pow(0.001, dt);
      }
    },
    draw(g) {
      const calm = opts.calm;
      const pad = size * 0.16, k0 = keys[0], k8 = keys[8];
      rr(g, k0.x - pad, k0.y - pad, k8.x + size - k0.x + pad * 2, k8.y + size - k0.y + pad * 2, size * 0.28);
      g.fillStyle = calm ? '#1b1f1d' : '#1b1c20'; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30; g.shadowOffsetY = 14; g.fill(); g.shadowColor = 'transparent';
      g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1; g.stroke();
      for (const k of keys) {
        const f = k.K.f, d = k.t * size * 0.07, s = size, x = k.x, y = k.y;
        rr(g, x + 3, y + 3, s - 6, s - 6, s * 0.16); g.fillStyle = '#0b0b0d'; g.fill();
        g.fillStyle = STEM[k.K.kind]; g.globalAlpha = 0.5; g.fillRect(x + s / 2 - 5, y + s - 10, 10, 4); g.globalAlpha = 1;
        g.save();
        if (f === 'rocker' && Math.abs(k.tilt) > 0.01) { const tl = k.tilt * (k.held ? 1 : Math.abs(k.tilt)); g.translate(x + s / 2, y + s / 2); g.transform(1, tl * 0.06, 0, 1, 0, 0); g.translate(-x - s / 2, -y - s / 2); }
        const lift = s * 0.07 - d; const cx = x + 2, cy = y + 2 + d, cw = s - 4, ch = s - 4;
        const cap = calm ? [150, 6] : look.click ? (k.accent ? look.click.accent : look.click.cap) : k.accent ? [18, 85] : f === 'type' ? [40, 18] : [40, 6];
        rr(g, cx, cy, cw, ch, f === 'type' ? s * 0.5 : s * 0.16); g.fillStyle = hsl(cap[0], cap[1], k.accent && !calm ? 40 : 68); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 4 + lift * 1.5; g.shadowOffsetY = lift * 0.9; g.fill(); g.shadowColor = 'transparent';
        const ix = cx + s * 0.11, iy = cy + s * 0.06, iw = cw - s * 0.22, ih = ch - s * 0.2;
        const tg = g.createLinearGradient(0, iy, 0, iy + ih);
        const L = !calm && look.click ? look.click.L : k.accent && !calm ? 55 : 86;
        tg.addColorStop(0, hsl(cap[0], cap[1], L + 4)); tg.addColorStop(1, hsl(cap[0], cap[1], L - 8));
        rr(g, ix, iy, iw, ih, f === 'type' ? iw / 2 : s * 0.12); g.fillStyle = tg; g.fill();
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(ix + s * .12, iy + 1); g.lineTo(ix + iw - s * .12, iy + 1); g.stroke();
        const ink = k.accent && !calm ? 'rgba(255,255,255,.92)' : 'rgba(40,38,35,.6)';
        g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `${s * (k.K.g.length > 1 ? 0.2 : 0.26)}px system-ui`; g.fillText(k.K.g, ix + iw / 2, iy + ih * 0.44 + 1);
        g.font = `600 ${Math.max(9, s * 0.1)}px system-ui`; g.globalAlpha = 0.8; g.fillText(k.K.name.toUpperCase(), ix + iw / 2, iy + ih * 0.82); g.globalAlpha = 1;
        // per-function indicators
        if (f === 'latch') { g.fillStyle = k.on ? (calm ? '#9fd' : '#5dff8a') : '#3a3a3a'; if (k.on && !calm) { g.shadowColor = '#5dff8a'; g.shadowBlur = 10; } g.beginPath(); g.arc(ix + iw - 8, iy + 8, 4, 0, 7); g.fill(); g.shadowBlur = 0; }
        if (f === 'charge' && k.charge > 0) { const a = Math.min(1, k.charge); g.strokeStyle = a >= 1 ? '#fff' : `hsl(${50 - a * 50},100%,60%)`; g.lineWidth = 4; g.beginPath(); g.arc(ix + iw / 2, iy + ih * 0.44, s * 0.3, -1.571, -1.571 + a * 6.283); g.stroke(); }
        if (f === 'type') { for (let i = 0; i < 10; i++) { g.fillStyle = i < k.count % 10 ? 'rgba(40,38,35,.7)' : 'rgba(40,38,35,.15)'; g.fillRect(ix + iw * 0.15 + i * iw * 0.07, iy + ih * 0.12, iw * 0.05, 3); } }
        if (f === 'rapid' && k.held && k.repN) { g.fillStyle = '#ff5d5d'; g.beginPath(); g.arc(ix + iw - 8, iy + 8, 4, 0, 7); g.fill(); }
        g.restore();
        if (k.flash > 0 && !calm) { g.globalAlpha = Math.min(1, k.flash); g.strokeStyle = f === 'type' ? '#ffd76a' : f === 'charge' ? '#ffb347' : '#7fd8ff'; g.lineWidth = 3; rr(g, x - 3 - (1 - k.flash) * 8, y - 3 - (1 - k.flash) * 8, s + 6 + (1 - k.flash) * 16, s + 6 + (1 - k.flash) * 16, s * 0.2); g.stroke(); g.globalAlpha = 1; }
        if (k.note && (k.flash > 0 || f === 'latch' || f === 'rapid' && k.held)) { g.fillStyle = 'rgba(255,255,255,.85)'; g.font = `700 ${Math.max(10, s * 0.12)}px system-ui`; g.textAlign = 'center'; g.fillText(k.note, x + s / 2, y - 8); }
      }
      emit('clickDraw', { g, keys, size });
    },
  };
}
