// Upgrade worlds: each equipped upgrade transforms the whole scene — an environment behind the toy (back),
// lighting/overlay in front (front), its own signature mechanic, and screen-wide milestone events.
// Cosmetic only: worlds never touch toy physics, timers or scores (leaderboard fairness).
// Calm mode: every layer is drawn at reduced alpha, milestones become a soft glow + quiet chime, no flashes.
import { snd, hap, calm } from './skins/kit.js?v=5';
import { burst, rnd, all as pAll } from './particles.js?v=5';
import { now } from './worlds/env.js?v=1';
import POP from './worlds/pop.js?v=1';
import SPIN from './worlds/spin.js?v=1';
import CLICK from './worlds/click.js?v=1';
import SAND from './worlds/sand.js?v=1';
import PREM from './worlds/premium.js?v=1';
export const WORLDS = { ...POP, ...SPIN, ...CLICK, ...SAND, ...PREM };
const STEPS = [12, 30, 60, 100, 160, 250, 400];
const ACTION = { pop: 1, key: 1, mold: 2, tear: 2, ball: 3, splat: 1, grab: 1, press: 0.5, sheet: 3 };
let id = null, W = 0, H = 0, energy = 0, count = 0, next = 0, ban = null, flash = null, revs = 0;
export const state = { get energy() { return energy; }, get count() { return count; } };
const ctx = { get W() { return W; }, get H() { return H; }, get calm() { return calm(); }, milestone: lv => milestone(lv) };
const dimA = () => (calm() ? 0.3 : 1);
export function use(skinId) { if (skinId === id) return; id = skinId; count = 0; next = 0; energy = 0; revs = 0; const w = WORLDS[id]; w && w.enter && w.enter(ctx); }
export const active = () => id && WORLDS[id] || null;
export function event(e, d) {
  const w = active(); if (!w) return;
  if (e === 'spinDraw') { revs += Math.abs(d.w) / 6.283 / 60; if (revs >= 10) { revs -= 10; bump(1); } } // ~1 action per 10 turns
  else if (ACTION[e]) bump(ACTION[e]); else if (e === 'cut' && Math.random() < 0.08) bump(1);
  energy = Math.min(1, energy + (e === 'spinDraw' ? Math.min(0.02, Math.abs(d.w) / 6000) : e === 'cut' ? 0.01 : 0.08));
  w.on && w.on[e] && w.on[e](d, ctx);
}
function bump(k) { count += k; const goal = next < STEPS.length ? STEPS[next] : STEPS[STEPS.length - 1] + (next - STEPS.length + 1) * 200; if (count >= goal) { next++; milestone(next); } }
function milestone(lv) {
  const w = active(); if (!w) return; const c = calm(), col = w.hue || '#fff';
  ban = { text: (w.titles && w.titles[(lv - 1) % w.titles.length]) || 'MILESTONE', sub: `${w.name} · level ${lv}`, t: 0, col };
  if (!c) { flash = { t: 0, col }; hap([20, 40, 20, 40, 60]); } else hap(10);
  snd((s, t, k) => { const v = c ? 0.03 : 0.07; [0, 4, 7, 12, 16].slice(0, c ? 3 : 5).forEach((n, i) => { const f = 392 * Math.pow(2, (n + (lv % 3) * 2) / 12); s.tone(t + i * 0.09, f, f, c ? 1.4 : 0.9, v * k, c ? 'sine' : 'triangle'); }); if (!c) s.nz(t, 0.6, 'highpass', 6000, 0.7, 0.03 * k, 0.05); });
  if (!c) burst(70, { kind: 'confetti', g: 260, drag: 0.99, life: 3, size: 4, add: false }, () => ({ x: rnd(0, W), y: -10, vx: rnd(-50, 50), vy: rnd(60, 240), vr: rnd(-10, 10), col: (w.confetti || [col, '#fff'])[(Math.random() * (w.confetti || [0, 0]).length) | 0] }));
  w.milestone && w.milestone(lv, ctx);
}
export function back(g, w0, h0, dt) {
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.shadowBlur = 0; g.shadowColor = 'transparent';
  W = w0; H = h0; energy *= Math.pow(0.6, dt); const w = active(); if (!w || !w.back) return;
  g.save(); w.back(g, W, H, now(), energy, ctx, dt); g.restore();
  if (calm()) { g.fillStyle = 'rgba(6,8,7,.62)'; g.fillRect(0, 0, W, H); } // Calm: same world, dimmed and muted
}
export function front(g, dt) {
  const w = active(); if (!w) return; const c = calm();
  if (w.front) { g.save(); g.globalAlpha = dimA(); w.front(g, W, H, now(), energy, ctx, dt); g.restore(); }
  if (flash) { flash.t += dt; const k = 1 - flash.t / 0.6; if (k <= 0) flash = null; else { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 * k * k; g.fillStyle = flash.col; g.fillRect(0, 0, W, H); g.restore(); } }
  if (ban) { ban.t += dt; const T = 2.4, t = ban.t; if (t > T) { ban = null; return; }
    const k = Math.min(1, t / 0.25) * Math.min(1, (T - t) / 0.5), sc = c ? 1 : 1 + 0.25 * Math.max(0, 1 - t / 0.3), y = H * 0.16;
    g.save(); g.globalAlpha = k * (c ? 0.6 : 1); g.textAlign = 'center'; g.translate(W / 2, y); g.scale(sc, sc);
    g.shadowColor = ban.col; g.shadowBlur = c ? 6 : 24; g.fillStyle = '#fff'; g.font = '900 30px system-ui,sans-serif'; g.fillText(ban.text, 0, 0);
    g.shadowBlur = 0; g.font = '600 12px system-ui,sans-serif'; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText(ban.sub.toUpperCase(), 0, 22); g.restore(); }
}
if (typeof window !== 'undefined') window.__world = { use, event, milestone: lv => milestone(lv), active, state, particles: () => pAll() };
