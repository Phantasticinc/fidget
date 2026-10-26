// Gold Rush signature mechanic: nuggets hide in the sand. Pinch a clump and lift it — a nugget may come up with it;
// pull it high (or tear the clump) to pry it loose and it flies into your stash. Purely cosmetic, stored locally.
import { burst, rnd } from '../particles.js?v=5';
import { add, glow } from './env.js?v=1';
import { snd, hap } from '../skins/kit.js?v=5';
const K = 'fidget.gold';
let stash = +localStorage.getItem(K) || 0, held = [], fly = [], pulse = 0;
export const total = () => stash;
const save = () => localStorage.setItem(K, stash);
export function onGrab(d) { for (const L of d.lumps || []) if (L && Math.random() < 0.45 + Math.min(0.3, L.m / 300)) { held.push({ L, r: rnd(4, 7), seed: rnd(0, 6) }); snd((s, t, k) => s.tone(t, 2400, 3000, 0.2, 0.04 * k, 'triangle')); break; } }
export function collect(n, x, y) { for (let i = 0; i < n; i++) fly.push({ x: x + rnd(-20, 20), y: y + rnd(-20, 20), t: -i * 0.06, r: rnd(4, 7) }); }
function take(h) { fly.push({ x: h.L.x, y: h.L.y - h.L.z * 12, t: 0, r: h.r }); burst(18, { kind: 'confetti', x: h.L.x, y: h.L.y - 10, g: 500, drag: 0.98, life: 1, size: 2.5, add: false }, () => ({ vx: rnd(-160, 160), vy: rnd(-260, -60), vr: rnd(-14, 14), col: Math.random() < .5 ? '#ffd76a' : '#fff2b8' }));
  snd((s, t, k) => [0, 0.07, 0.14].forEach((o, i) => s.tone(t + o, 1568 * (1 + i * 0.26), 1568 * (1 + i * 0.26), 0.35, 0.06 * k, 'triangle'))); hap([8, 20, 8]); }
export function onTear() { for (const h of held) take(h); held = []; }
function nug(g, x, y, r, a = 1) { g.globalAlpha *= a; const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x, y, r * 1.2); gr.addColorStop(0, '#fff6c8'); gr.addColorStop(0.4, '#ffc93c'); gr.addColorStop(1, '#8a5a0e'); g.fillStyle = gr;
  g.beginPath(); for (let i = 0; i < 7; i++) { const t = i / 7 * 6.283, rr = r * (0.8 + 0.25 * Math.sin(i * 2.3)); g.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr * 0.85); } g.closePath(); g.fill(); g.globalAlpha /= a; }
export function draw(g, W, H, t, dt, calm) {
  const cx = W - 58, cy = 74; pulse *= Math.pow(0.9, (dt || 1 / 60) * 60);
  held = held.filter(h => { const L = h.L; if (!L.held && L.z < 0.3) return false; if (L.z > 0.75) { take(h); return false; } add(g, () => glow(g, L.x, L.y - L.z * 12, 20, 'rgba(255,210,80,.7)')); nug(g, L.x + Math.cos(h.seed) * 5, L.y - L.z * 12 - 4, h.r); return true; });
  fly = fly.filter(f => { f.t += dt; if (f.t < 0) return true; const k = Math.min(1, f.t / 0.7), e = k * k * (3 - 2 * k), x = f.x + (cx - f.x) * e, y = f.y + (cy - f.y) * e - Math.sin(k * Math.PI) * 80;
    nug(g, x, y, f.r * (1 - 0.4 * k)); if (k >= 1) { stash++; save(); pulse = 1; snd((s, t, kk) => s.tone(t, 2093, 2093, 0.25, 0.05 * kk, 'sine')); return false; } return true; });
  if (stash || held.length || fly.length) { g.save(); g.globalAlpha = calm ? 0.5 : 1; const s = 1 + pulse * 0.25; g.translate(cx, cy); g.scale(s, s);
    g.fillStyle = 'rgba(40,26,6,.7)'; g.beginPath(); g.roundRect ? g.roundRect(-44, -14, 88, 28, 14) : g.rect(-44, -14, 88, 28); g.fill(); g.strokeStyle = 'rgba(255,210,90,.6)'; g.lineWidth = 1; g.stroke();
    nug(g, -28, 0, 7); g.fillStyle = '#ffe6a0'; g.font = '800 14px system-ui,sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(String(stash), -14, 1); g.restore(); }
}
