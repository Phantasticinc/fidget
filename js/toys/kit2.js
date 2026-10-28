// Shared bits for the Cube toy: premium gating, timed previews, synth voices.
// Free base is fully playable; the "rich" look (glow, glitter, colour, particles) needs Premium or that toy's own upgrade.
import { synth, buzz, buzzPattern, opts } from '../feel.js?v=6';
import * as ent from '../store/ent.js?v=9';
export { buzz, opts };
// Cube looks: each is its own product. Owners of the retired Sand upgrades keep equal value: each Sand pack unlocks one cube look.
export const CUBE_LOOKS = { upgrade_cube: 'rgb', cube_brass: 'brass', cube_frost: 'frost' };
export const LEGACY = { upgrade_cube: 'sand_galaxy', cube_brass: 'sand_goldrush', cube_frost: 'sand_glowtide' };
export const UPGRADE = { cube: Object.keys(CUBE_LOOKS) };
export const hasLook = id => ent.premium() || ent.has(id) || ent.has(LEGACY[id]);
export const ownedLooks = () => Object.keys(CUBE_LOOKS).filter(hasLook);
const LK = 'fidget.cubeLook';
export function setLook(id) { try { localStorage.setItem(LK, id || 'classic'); } catch (_) {} }
export function lookId() { let s = null; try { s = localStorage.getItem(LK); } catch (_) {} const o = ownedLooks(); if (s === 'classic' && o.length) return null; return o.includes(s) ? s : o[0] || null; }
const until = {}; // toy -> preview end time (ms)
export const previewing = toy => (until[toy] || 0) > performance.now();
export const owns = toy => ent.premium() || (UPGRADE[toy] || []).some(hasLook);
export const rich = toy => owns(toy) || previewing(toy);
export function preview(toy, ms = 8000) { until[toy] = performance.now() + ms; }
export const previewLeft = toy => Math.max(0, ((until[toy] || 0) - performance.now()) / 1000);
const jit = (x, a = 0.06) => x * (1 + (Math.random() * 2 - 1) * a);
function v(fn) { if (synth.ok()) fn(synth, synth.t(), synth.cm()); }
export const hap = p => buzzPattern(opts.calm ? (Array.isArray(p) ? p.map(x => Math.max(1, x * 0.5)) : p * 0.5) : p);
export const snd = {
  // cube dome buttons: soft rubber, each tuned to a pentatonic note (musical, not mechanical: that's the Clicker's job)
  boop(f = 440, a = 1) { v((s, t, k) => { s.nz(t, 0.03, 'lowpass', 500, 0.8, 0.25 * a * k); s.tone(t, f * 1.03, f, 0.22, 0.16 * a * k, 'sine'); s.tone(t, f * 2, f * 2, 0.08, 0.03 * a * k, 'sine'); }); },
  // per-look accents
  ting(look, f = 880) { v((s, t, k) => {
    if (look === 'brass') { s.tone(t, f * 0.75, f * 0.75, 0.35, 0.05 * k, 'triangle'); s.tone(t, f * 1.5 * 1.004, f * 1.5, 0.25, 0.025 * k, 'sine'); s.nz(t, 0.05, 'bandpass', 2400, 6, 0.06 * k); }
    else if (look === 'frost') { s.tone(t, f * 2, f * 2, 0.5, 0.03 * k, 'sine'); s.tone(t + 0.03, f * 3, f * 3, 0.4, 0.018 * k, 'sine'); s.nz(t, 0.02, 'highpass', 7000, 1, 0.05 * k); }
    else if (look === 'rgb') { s.tone(t, f, f * 2, 0.06, 0.04 * k, 'square'); }
  }); },
  // cube: precise plastic mechanisms
  clack(p = 1, a = 1) { v((s, t, k) => { s.nz(t, 0.016, 'bandpass', jit(3600 * p), 3, 0.75 * a * k); s.nz(t + 0.008, 0.035, 'bandpass', jit(1400 * p), 2.5, 0.4 * a * k); }); },
  detent(p = 1) { v((s, t, k) => { s.nz(t, 0.01, 'highpass', jit(5200 * p), 0.8, 0.22 * k); }); },
  roll(a = 0.5) { v((s, t, k) => { s.nz(t, 0.03, 'bandpass', jit(1800 + a * 1200, 0.3), 1.5, (0.04 + a * 0.08) * k); }); },
  toggle(on = true) { v((s, t, k) => { s.nz(t, 0.012, 'bandpass', jit(on ? 3000 : 2500), 4, 0.9 * k); s.nz(t + 0.004, 0.06, 'bandpass', on ? 950 : 800, 3, 0.5 * k); s.tone(t + 0.004, on ? 210 : 180, 120, 0.05, 0.22 * k); }); },
  hum(on) { v((s, t, k) => { if (on) s.tone(t + 0.03, 120, 120, 0.35, 0.025 * k); }); },
};
