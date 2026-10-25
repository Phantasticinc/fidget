// Leaderboard adapter: Supabase REST when configured, else local-only (your own all-time + weekly bests).
import { LB } from './config.js';
import { METRICS, get as stats, week } from './stats.js';
import { get as nick } from './nick.js';
import { mine as myMsg } from './msg.js';
export const online = () => !!(LB.url && LB.anonKey);
const dev = () => { let d = localStorage.getItem('fidget.dev'); if (!d) { d = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); localStorage.setItem('fidget.dev', d); } return d; };
const H = () => ({ apikey: LB.anonKey, Authorization: `Bearer ${LB.anonKey}`, 'Content-Type': 'application/json' });
export async function top(metric, scope) {
  if (!online()) { const S = stats(), b = scope === 'week' ? S.week : S.all; return [{ nick: nick(), value: b[metric] || 0, me: true, msg: myMsg(metric), device: '' }]; }
  const view = scope === 'week' ? 'lb_week' : 'lb_all';
  const r = await fetch(`${LB.url}/rest/v1/${view}?metric=eq.${metric}&order=value.desc&limit=50`, { headers: H() });
  if (!r.ok) throw new Error('board ' + r.status);
  const me = dev(); return (await r.json()).map(x => ({ nick: x.nick, value: x.value, msg: x.msg || '', device: x.device, me: x.device === me.slice(0, 8) }));
}
let lastSent = {};
export async function sync() {
  if (!online()) return;
  const S = stats(), w = week();
  for (const m of METRICS) { const v = S.week[m.id] || 0; const k = m.id + w; if (!v || lastSent[k] === v) continue;
    const r = await fetch(`${LB.url}/rest/v1/rpc/submit_score`, { method: 'POST', headers: H(), body: JSON.stringify({ p_device: dev(), p_nick: nick(), p_metric: m.id, p_week: w, p_value: v, p_msg: myMsg(m.id) || null }) });
    if (r.ok) lastSent[k] = v; }
}
// Rank a value on a board (1 = top). Local board: you're always #1 on this device.
export async function rank(metric, scope, value) {
  if (!online()) return 1;
  const rows = await top(metric, scope); return 1 + rows.filter(r => !r.me && r.value > value).length;
}
export const resend = () => { lastSent = {}; return sync(); };
