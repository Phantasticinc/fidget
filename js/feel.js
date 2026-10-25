// Sound + haptics, generated from physics events. No audio files.
export const opts = { sound: true, haptic: true, calm: false, vol: 0.8 };
let ctx, out, noise, comp;
function ac() {
  if (ctx) return ctx;
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
  ctx = new C({ latencyHint: 'interactive' });
  comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
  out = ctx.createGain(); out.gain.value = opts.vol; out.connect(comp); comp.connect(ctx.destination);
  const n = ctx.sampleRate; noise = ctx.createBuffer(1, n, n); const d = noise.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}
export function unlock() { const c = ac(); if (c && c.state !== 'running') c.resume(); }
export function setVol(v) { opts.vol = v; if (out) out.gain.value = v; }
function ok() { return opts.sound && ac() && ctx.state === 'running'; }
const cm = () => (opts.calm ? 0.45 : 1);

function nz(t, dur, type, f, q, g, att = 0.001) {
  const s = ctx.createBufferSource(); s.buffer = noise; s.playbackRate.value = 0.8 + Math.random() * 0.4;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const e = ctx.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + att);
  e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(e); e.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
function tone(t, f0, f1, dur, g, type = 'sine') {
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const e = ctx.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + 0.002);
  e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(e); e.connect(out); o.start(t); o.stop(t + dur + 0.02);
}
const jit = (x, a = 0.06) => x * (1 + (Math.random() * 2 - 1) * a);

export const sfx = {
  // bubble pop: air release crack + body thump. size 0..1
  pop(size = 0.5, force = 1) {
    if (!ok()) return; const t = ctx.currentTime, k = cm();
    nz(t, 0.035, 'bandpass', jit(opts.calm ? 1800 : 3200 - size * 1200), 1.4, 0.9 * k * force);
    nz(t, 0.09, 'lowpass', 900, 0.7, 0.35 * k * force);
    tone(t, jit(420 - size * 180), 90, 0.07, 0.35 * k * force);
  },
  press(size = 0.5) { if (!ok()) return; const t = ctx.currentTime; nz(t, 0.05, 'lowpass', 500, 1, 0.12 * cm()); },
  tick(speed = 0.5) {
    if (!ok()) return; const t = ctx.currentTime;
    nz(t, 0.012, 'highpass', 5000 + speed * 2000, 0.7, (0.12 + speed * 0.12) * cm());
  },
  whir(level) { // continuous bearing hum for spinner
    if (!ok()) return; if (!this._w) {
      const o = ctx.createBufferSource(); o.buffer = noise; o.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 6; const g = ctx.createGain(); g.gain.value = 0;
      o.connect(f); f.connect(g); g.connect(out); o.start(); this._w = { f, g };
    }
    const t = ctx.currentTime; this._w.f.frequency.setTargetAtTime(200 + level * 2400, t, 0.05);
    this._w.g.gain.setTargetAtTime(Math.min(0.12, level * 0.14) * cm(), t, 0.08);
  },
  // mechanical key: kind 'clicky' | 'tactile' | 'linear'; phase 'down'|'up'
  key(kind, phase, pitch = 1) {
    if (!ok()) return; const t = ctx.currentTime, k = cm();
    if (phase === 'down') {
      if (kind === 'clicky') { nz(t, 0.018, 'bandpass', jit(4200 * pitch), 3, 0.9 * k); nz(t + 0.006, 0.03, 'bandpass', 2600, 2, 0.5 * k); }
      nz(t + 0.012, 0.06, 'bandpass', jit(kind === 'linear' ? 900 : 1300) * pitch, 2.5, 0.55 * k); // bottom-out thock
      tone(t + 0.012, jit(260 * pitch), 140, 0.05, 0.25 * k);
    } else {
      nz(t, 0.03, 'bandpass', jit(1700 * pitch), 3, (kind === 'clicky' ? 0.45 : 0.25) * k);
    }
  },
  squish(amt) {
    if (!ok()) return; const t = ctx.currentTime;
    nz(t, 0.12 + amt * 0.1, 'lowpass', 300 + amt * 700, 3, Math.min(0.5, amt) * 0.6 * cm(), 0.02);
  },
  // kinetic sand: soft granular crunch; amt 0..1 (cut speed / crumble size)
  sand(amt = 0.5) {
    if (!ok()) return; const t = ctx.currentTime, k = cm();
    nz(t, 0.05 + amt * 0.06, 'bandpass', jit(1400 + amt * 1800, 0.25), 0.9, (0.08 + amt * 0.22) * k, 0.006);
    nz(t, 0.08, 'lowpass', 380, 0.8, 0.06 * amt * k, 0.01);
  },
  chime(f = 660) { if (!ok()) return; const t = ctx.currentTime; tone(t, f, f, 1.6, 0.12 * cm()); tone(t, f * 1.5, f * 1.5, 1.2, 0.05 * cm()); },
};

let lastBuzz = 0;
export function buzz(ms) {
  if (!opts.haptic || !navigator.vibrate) return;
  const now = performance.now(); if (now - lastBuzz < 18) return; lastBuzz = now;
  navigator.vibrate(Math.max(1, Math.round(ms * (opts.calm ? 0.5 : 1))));
}
export function buzzPattern(p) { if (opts.haptic && navigator.vibrate) navigator.vibrate(p); }
