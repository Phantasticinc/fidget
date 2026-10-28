// Shared bits for the v2 toys (Pop It, Slime, Squish, Cube, Switch): premium gating, timed previews, synth voices.
// Free base is fully playable; the "rich" look (glow, glitter, colour, particles) needs Premium or that toy's own upgrade.
import { synth, buzz, buzzPattern, opts } from '../feel.js?v=6';
import * as ent from '../store/ent.js?v=9';
export { buzz, opts };
export const UPGRADE = { popit: 'upgrade_popit', slime: 'upgrade_slime', squish: 'upgrade_squish', cube: 'upgrade_cube', switch: 'upgrade_switch' };
const until = {}; // toy -> preview end time (ms)
export const previewing = toy => (until[toy] || 0) > performance.now();
export const owns = toy => ent.premium() || ent.has(UPGRADE[toy]);
export const rich = toy => owns(toy) || previewing(toy);
export function preview(toy, ms = 8000) { until[toy] = performance.now() + ms; }
export const previewLeft = toy => Math.max(0, ((until[toy] || 0) - performance.now()) / 1000);
const jit = (x, a = 0.06) => x * (1 + (Math.random() * 2 - 1) * a);
function v(fn) { if (synth.ok()) fn(synth, synth.t(), synth.cm()); }
export const hap = p => buzzPattern(opts.calm ? (Array.isArray(p) ? p.map(x => Math.max(1, x * 0.5)) : p * 0.5) : p);
export const snd = {
  // silicone pop-it dome snapping through: dull rubbery "thup" (lower and softer than bubble wrap)
  thup(up = false, size = 0.5) { v((s, t, k) => { s.nz(t, 0.04, 'bandpass', jit(up ? 900 : 650) * (1.2 - size * 0.4), 2.2, 0.55 * k); s.tone(t, jit(up ? 330 : 240), up ? 160 : 110, 0.07, 0.32 * k); s.nz(t + 0.004, 0.05, 'lowpass', 420, 1, 0.25 * k); }); },
  flip() { v((s, t, k) => { s.nz(t, 0.25, 'bandpass', 500, 0.8, 0.12 * k, 0.05); s.tone(t + 0.18, 180, 90, 0.12, 0.2 * k); }); },
  // slime: wet squelch, stretchy creak, tiny air-bubble pops
  squelch(a = 0.5) { v((s, t, k) => { s.nz(t, 0.14 + a * 0.14, 'bandpass', jit(620 - a * 220, 0.2), 4.5, (0.1 + a * 0.24) * k, 0.012); s.tone(t, jit(170), 65, 0.13, 0.08 * a * k); }); },
  stretch(a = 0.5) { v((s, t, k) => { s.nz(t, 0.08, 'bandpass', jit(300 + a * 900, 0.3), 8, 0.05 * a * k, 0.02); }); },
  blip(a = 0.5) { v((s, t, k) => { s.nz(t, 0.02, 'bandpass', jit(2400 + a * 1500, 0.25), 3, 0.18 * k); s.tone(t, jit(900), 1800, 0.03, 0.05 * k); }); },
  // foam stress ball: soft airy compression + slow exhale on release
  foam(a = 0.5) { v((s, t, k) => { s.nz(t, 0.18 + a * 0.2, 'lowpass', 260 + a * 500, 0.9, (0.06 + a * 0.16) * k, 0.03); }); },
  exhale(a = 0.5) { v((s, t, k) => { s.nz(t, 0.5 + a * 0.4, 'bandpass', 900, 0.6, 0.035 * a * k, 0.15); }); },
  // cube + switch: precise plastic mechanisms
  clack(p = 1, a = 1) { v((s, t, k) => { s.nz(t, 0.016, 'bandpass', jit(3600 * p), 3, 0.75 * a * k); s.nz(t + 0.008, 0.035, 'bandpass', jit(1400 * p), 2.5, 0.4 * a * k); }); },
  detent(p = 1) { v((s, t, k) => { s.nz(t, 0.01, 'highpass', jit(5200 * p), 0.8, 0.22 * k); }); },
  roll(a = 0.5) { v((s, t, k) => { s.nz(t, 0.03, 'bandpass', jit(1800 + a * 1200, 0.3), 1.5, (0.04 + a * 0.08) * k); }); },
  toggle(on = true) { v((s, t, k) => { s.nz(t, 0.012, 'bandpass', jit(on ? 3000 : 2500), 4, 0.9 * k); s.nz(t + 0.004, 0.06, 'bandpass', on ? 950 : 800, 3, 0.5 * k); s.tone(t + 0.004, on ? 210 : 180, 120, 0.05, 0.22 * k); }); },
  hum(on) { v((s, t, k) => { if (on) s.tone(t + 0.03, 120, 120, 0.35, 0.025 * k); }); },
};
