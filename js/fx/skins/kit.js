// Shared helpers for skin modules: sound voices, haptics, preview drawing primitives.
import { synth, buzzPattern, opts } from '../../feel.js?v=3';
export { burst, add, arc, rnd } from '../particles.js';
export const calm = () => opts.calm;
export function snd(fn) { if (synth.ok()) fn(synth, synth.t(), synth.cm()); }
export const hap = p => buzzPattern(opts.calm ? (Array.isArray(p) ? p.map(v => v * 0.5) : p * 0.5) : p);
export function orb(g, x, y, r, hi, mid, lo) {
  const gr = g.createRadialGradient(x - r * .35, y - r * .4, 0, x, y, r); gr.addColorStop(0, hi); gr.addColorStop(.5, mid); gr.addColorStop(1, lo);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
}
export function glowDot(g, x, y, r, col, a = 1) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
