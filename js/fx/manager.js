// FX manager: owns equipped skins, routes toy events to premium fx + the equipped skin, steps/draws particles, adaptive quality.
import { on } from '../bus.js';
import { look } from '../look.js';
import * as P from './particles.js?v=5';
import * as prem from './premium.js';
import * as ent from '../store/ent.js?v=7';
import POP from './skins/pop.js';
import SPIN from './skins/spin.js';
import CLICK from './skins/click.js';
import SAND from './skins/sand.js';
import { sign, ptr as P0 } from './skins/sig.js?v=5';
import * as world from './world.js?v=1';
export const SKINS = { pop: POP, spin: SPIN, click: CLICK, sand: [...SAND, prem.RAINBOW] };
for (const t in SKINS) SKINS[t].forEach(sign); // signature layer: ambient frame fx, finger twists, reveal
let cur = null, rv = null, W = 0, H = 0;
export const setToy = t => { cur = t; };
export function ptr(x, y, down) { P0.x = x; P0.y = y; P0.down = !!down; P0.t = performance.now(); }
const K = 'fidget.equip';
const equipped = JSON.parse(localStorage.getItem(K) || '{}'), active = {};
let relook = () => {}, fpsAvg = 60;
export const canUse = s => s.premium ? ent.premium() : ent.has(s.id);
export const equippedId = toy => active[toy] ? active[toy].id : null;
export function equip(toy, id, persist = true) {
  const s = id && SKINS[toy].find(x => x.id === id && canUse(x)) || null;
  active[toy] = s; look[toy] = s ? s.look : null; look.rev++;
  if (persist) { equipped[toy] = s ? s.id : null; localStorage.setItem(K, JSON.stringify(equipped)); }
  relook(toy);
  if (persist && s) { rv = { s, t: 0 }; s.reveal && s.reveal(W / 2, H / 2, W, H); }
}
function revalidate() { for (const t in SKINS) equip(t, equipped[t], false); }
const EVENTS = ['pop', 'sheet', 'spinDraw', 'key', 'clickDraw', 'cut', 'crumble', 'mold', 'sandDraw', 'press', 'grab', 'stretch', 'tear', 'splat', 'ball'];
export function init(onRelook) {
  relook = onRelook; revalidate(); ent.onChange(revalidate);
  for (const e of EVENTS) on(e, d => {
    if (ent.premium() && prem.on[e]) prem.on[e](d);
    for (const t in active) { const s = active[t]; if (s && s.on[e]) s.on[e](d); }
    world.event(e, d);
  });
}
export function clear() { P.clear(); }
const worldId = () => { const a = active[cur]; return a ? a.id : ent.premium() ? '_premium' : null; };
// environment layer, drawn behind the toy
export function back(g, dt, w = W, h = H) { W = w; H = h; world.use(worldId()); world.back(g, W, H, dt); }
export function frame(g, dt, calm, w = W, h = H) {
  W = w; H = h;
  fpsAvg += ((1 / Math.max(dt, 1e-3)) - fpsAvg) * 0.05;
  const target = (calm ? 0.45 : 1) * (fpsAvg < 40 ? 0.5 : fpsAvg < 52 ? 0.75 : 1);
  P.q.scale += (target - P.q.scale) * 0.05;
  const a0 = active[cur]; if (a0 && a0.frame) a0.frame(g, dt, W, H);
  P.step(dt); if (calm) g.globalAlpha = 0.6; P.draw(g); g.globalAlpha = 1; world.front(g, dt);
  if (rv) { rv.t += dt; if (rv.t > 1.8) rv = null; else drawReveal(g, rv); }
  const s = prem.shake; s.on = opts_shake(); const a = s.amt; s.amt *= Math.pow(0.002, dt); if (s.amt < 0.05) s.amt = 0;
  return a ? [(Math.random() - 0.5) * a, (Math.random() - 0.5) * a] : null;
}
let shakeOpt = true; const opts_shake = () => shakeOpt && ent.premium();
export const setShake = v => { shakeOpt = v; };

// Equip reveal: dimmed stage, an expanding light ring in the skin's colour and its name, ~1.8 s.
function drawReveal(g, r) {
  const t = r.t, k = Math.min(1, t / 0.25) * Math.min(1, (1.8 - t) / 0.5), col = r.s.hue || '#fff', cx = W / 2, cy = H * 0.47;
  g.save(); g.globalAlpha = 0.45 * k; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = k;
  const rr = 30 + t * Math.max(W, H) * 0.7; g.strokeStyle = col; g.lineWidth = 6 * (1 - t / 1.8) + 1; g.shadowColor = col; g.shadowBlur = 24;
  g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, rr * 0.6, 0, 7); g.stroke(); g.shadowBlur = 0;
  g.globalCompositeOperation = 'source-over'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.shadowColor = col; g.shadowBlur = 18;
  const y = H * 0.2 + (1 - Math.min(1, t / 0.4)) * 20;
  g.font = '700 13px system-ui,sans-serif'; g.fillText('UPGRADE EQUIPPED', cx, y - 26);
  g.font = '800 30px system-ui,sans-serif'; g.fillText(r.s.name, cx, y + 6); g.restore();
}
