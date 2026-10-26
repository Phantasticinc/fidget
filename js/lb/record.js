// Detects personal records and emits 'record' once a run settles (so a climbing streak/RPM celebrates once, at its peak).
// max metrics (streak, rpm): beat your all-time best. sum metrics (keys, cuts): beat your best past week total (once per week).
import { on, emit } from '../bus.js';
import { METRICS, get } from './stats.js';
const MIN = { streak: 10, rpm: 120, keys: 200, cuts: 60 };   // ignore trivial first-run "records"
const pend = {}; let base = null, dirty = false, baseWk = '';
const bestWeek = (S, id) => Math.max(0, ...Object.values(S.hist || {}).map(w => w[id] || 0));
function snapshot() { const S = get(); baseWk = S.wk; base = {}; for (const m of METRICS) base[m.id] = m.mode === 'max' ? (S.all[m.id] || 0) : bestWeek(S, m.id); }
const K = 'fidget.recWeek';
function check() {
  if (get().wk !== baseWk) snapshot();  // app left open across a week boundary: re-base sum metrics (was stuck at Infinity)
  const S = get(), wk = S.wk, done = (() => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (_) { return JSON.parse('{}'); } })();
  for (const m of METRICS) {
    const v = m.mode === 'max' ? (S.all[m.id] || 0) : (S.week[m.id] || 0), prev = base[m.id];
    if (v <= prev || v < MIN[m.id]) continue;
    if (m.mode === 'sum') { if (done[m.id] === wk) continue; if (!prev) continue; }  // need a past week to beat
    if (!pend[m.id]) pend[m.id] = { prev, t: 0 };
    pend[m.id].v = v; pend[m.id].t = performance.now();
  }
}
function settle() {
  const t = performance.now();
  for (const id of Object.keys(pend)) { const p = pend[id]; if (t - p.t < 1500) continue; delete pend[id];
    const m = METRICS.find(x => x.id === id); base[id] = m.mode === 'max' ? p.v : Infinity;
    if (m.mode === 'sum') { const d = (() => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (_) { return JSON.parse('{}'); } })(); d[id] = get().wk; localStorage.setItem(K, JSON.stringify(d)); }
    emit('record', { metric: id, name: m.name, unit: m.unit, value: p.v, prev: p.prev }); }
}
export function init() {
  snapshot();
  for (const e of ['pop', 'rpm', 'key', 'cut']) on(e, () => { dirty = true; });
  setInterval(() => { if (dirty) { dirty = false; check(); } settle(); }, 250);
}
// test hook: force a record
export const fake = (metric = 'streak', value = 120, prev = 80) => { const m = METRICS.find(x => x.id === metric); emit('record', { metric, name: m.name, unit: m.unit, value, prev }); };
