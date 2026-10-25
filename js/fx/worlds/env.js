// Environment helpers for upgrade worlds: cheap procedural layers (no allocation per frame).
// Every layer is deterministic from seeds + time, so it costs a few hundred fillRects at most and scales with q.
import { q } from '../particles.js?v=5';
export const now = () => performance.now() / 1000;
const seeds = n => Array.from({ length: n }, (_, i) => { const r = k => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }; return [r(1), r(2), r(3), r(4), r(5)]; });
export const S = seeds(260);
export const n = k => Math.max(8, Math.round(k * q.scale));
export function sky(g, W, H, top, bot) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
export function glow(g, x, y, r, col) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
export function add(g, fn) { g.globalCompositeOperation = 'lighter'; fn(); g.globalCompositeOperation = 'source-over'; }
// twinkling stars, three parallax depths, optional pull toward (cx,cy)
export function stars(g, W, H, t, count = 160, col = '255,255,255', drift = 4) {
  const N = Math.min(S.length, n(count));
  for (let i = 0; i < N; i++) { const [u, v, p, s, d] = S[i], z = 0.3 + d * 0.7, x = (u * W + t * drift * z) % W, y = v * H, a = 0.25 + 0.75 * Math.abs(Math.sin(t * (0.6 + p * 2) + p * 9));
    g.fillStyle = `rgba(${col},${a * z})`; const sz = 0.6 + s * 1.8 * z; g.fillRect(x, y, sz, sz); }
}
// soft floating motes (dust, embers, bubbles, petals) rising (vy<0) or falling
export function motes(g, W, H, t, { count = 50, col = '255,220,180', vy = -14, size = 2.5, sway = 18, glowy = true, off = 0 } = {}) {
  const N = Math.min(S.length, n(count));
  for (let i = 0; i < N; i++) { const [u, v, p, s, d] = S[(i + off) % S.length], z = 0.4 + d * 0.6; let y = (v * H + t * vy * z) % H; if (y < 0) y += H;
    const x = u * W + Math.sin(t * 0.7 + p * 7) * sway * z, r = size * (0.5 + s) * z, a = (0.3 + 0.5 * Math.abs(Math.sin(t + p * 5))) * z;
    if (glowy) glow(g, x, y, r * 4, `rgba(${col},${a * 0.5})`); g.fillStyle = `rgba(${col},${a})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
}
// wavy translucent curtain bands (aurora / nebula / heat)
export function bands(g, W, H, t, hues, { y0 = 0.15, amp = 30, a = 0.12, sat = 90, lit = 60, h = 0.5 } = {}) {
  hues.forEach((hu, b) => { const gr = g.createLinearGradient(0, H * (y0 - 0.1), 0, H * (y0 + h)); gr.addColorStop(0, `hsla(${hu},${sat}%,${lit}%,0)`); gr.addColorStop(0.5, `hsla(${hu},${sat}%,${lit}%,${a})`); gr.addColorStop(1, `hsla(${hu},${sat}%,${lit}%,0)`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, H * (y0 + h)); for (let x = 0; x <= W + 24; x += 24) g.lineTo(x, H * (y0 + b * 0.06) + Math.sin(x / 80 + t * (0.6 + b * 0.3) + b * 2) * amp); g.lineTo(W, H * (y0 + h)); g.fill(); });
}
// god rays from a point
export function rays(g, x, y, W, H, t, col, k = 1, count = 9) {
  for (let i = 0; i < count; i++) { const a = i / count * 6.283 + t * 0.05, w = 0.06 + 0.05 * Math.sin(t + i), L = Math.max(W, H) * 1.2;
    const gr = g.createRadialGradient(x, y, 0, x, y, L); gr.addColorStop(0, col.replace('A', 0.18 * k)); gr.addColorStop(1, col.replace('A', 0)); g.fillStyle = gr;
    g.beginPath(); g.moveTo(x, y); g.arc(x, y, L, a - w, a + w); g.closePath(); g.fill(); }
}
export function vignette(g, W, H, a = 0.55) { const gr = g.createRadialGradient(W / 2, H * 0.47, Math.min(W, H) * 0.3, W / 2, H * 0.47, Math.max(W, H) * 0.8); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
