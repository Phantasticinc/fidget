// FX manager: owns equipped skins, routes toy events to premium fx + the equipped skin, steps/draws particles, adaptive quality.
import { on } from '../bus.js';
import { look } from '../look.js';
import * as P from './particles.js';
import * as prem from './premium.js';
import * as ent from '../store/ent.js';
import POP from './skins/pop.js';
import SPIN from './skins/spin.js';
import CLICK from './skins/click.js';
import SAND from './skins/sand.js';
export const SKINS = { pop: POP, spin: SPIN, click: CLICK, sand: [...SAND, prem.RAINBOW] };
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
}
function revalidate() { for (const t in SKINS) equip(t, equipped[t], false); }
const EVENTS = ['pop', 'sheet', 'spinDraw', 'key', 'clickDraw', 'cut', 'crumble', 'mold', 'sandDraw'];
export function init(onRelook) {
  relook = onRelook; revalidate(); ent.onChange(revalidate);
  for (const e of EVENTS) on(e, d => {
    if (ent.premium() && prem.on[e]) prem.on[e](d);
    for (const t in active) { const s = active[t]; if (s && s.on[e]) s.on[e](d); }
  });
}
export function clear() { P.clear(); }
export function frame(g, dt, calm) {
  fpsAvg += ((1 / Math.max(dt, 1e-3)) - fpsAvg) * 0.05;
  const target = (calm ? 0.45 : 1) * (fpsAvg < 40 ? 0.5 : fpsAvg < 52 ? 0.75 : 1);
  P.q.scale += (target - P.q.scale) * 0.05;
  P.step(dt); P.draw(g);
  const s = prem.shake; s.on = opts_shake(); const a = s.amt; s.amt *= Math.pow(0.002, dt); if (s.amt < 0.05) s.amt = 0;
  return a ? [(Math.random() - 0.5) * a, (Math.random() - 0.5) * a] : null;
}
let shakeOpt = true; const opts_shake = () => shakeOpt && ent.premium();
export const setShake = v => { shakeOpt = v; };
