// Per-toy stats, all-time + current ISO week. Local first; adapter syncs bests when online board configured.
import { on } from '../bus.js';
export const METRICS = [
  { id: 'streak', toy: 'pop', name: 'Pop streak', unit: 'bubbles', mode: 'max' },
  { id: 'rpm', toy: 'spin', name: 'Best RPM', unit: 'rpm', mode: 'max' },
  { id: 'keys', toy: 'click', name: 'Keys clicked', unit: 'keys', mode: 'sum' },
  { id: 'cuts', toy: 'sand', name: 'Sand cuts', unit: 'cuts', mode: 'sum' },
];
export function week(d = new Date()) { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = t.getUTCFullYear(); return `${y}-W${String(Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7)).padStart(2, '0')}`; }
const K = 'fidget.stats';
const S = Object.assign({ all: {}, wk: '', week: {}, hist: {} }, (() => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (_) { return JSON.parse('{}'); } })());
let dirty = false;
function roll() { const w = week(); if (S.wk !== w) { if (S.wk) S.hist[S.wk] = S.week; const ks = Object.keys(S.hist).sort(); while (ks.length > 8) delete S.hist[ks.shift()]; S.wk = w; S.week = {}; } }
function rec(id, v, mode) { roll(); for (const b of [S.all, S.week]) b[id] = mode === 'max' ? Math.max(b[id] || 0, v) : (b[id] || 0) + v; dirty = true; }
export const get = () => { roll(); return S; };
export function save() { if (dirty) { localStorage.setItem(K, JSON.stringify(S)); dirty = false; } }
export function init() {
  on('pop', d => d.streak && rec('streak', d.streak, 'max'));
  // Compare against THIS WEEK's best (not all-time), otherwise the weekly RPM board never fills after a big all-time spin.
  on('rpm', r => { const v = Math.min(3000, Math.round(r)); if (v > (S.week.rpm || 0)) rec('rpm', v, 'max'); });
  on('key', () => rec('keys', 1, 'sum'));
  on('cut', () => rec('cuts', 1, 'sum'));
  setInterval(save, 5000); addEventListener('pagehide', save);
}
