// Leaderboard sheet: per-toy metric, weekly / all-time, nickname editor, ≤40-char victory messages (filtered; Report sends an entry for review, online only). No chat.
import { METRICS } from '../lb/stats.js';
import * as nick from '../lb/nick.js';
import { top, online, sync, report, reported } from '../lb/adapter.js?v=3';
import * as M from '../lb/msg.js';
const $ = id => document.getElementById(id);
let metric = 'streak', scope = 'week';
async function render() {
  const B = $('boardBody'); B.innerHTML = '';
  const n = document.createElement('div'); n.className = 'nick';
  n.innerHTML = '<input id="nickIn" maxlength="16" autocomplete="off" aria-label="Nickname"><button class="buy eq" id="nickSave">Save</button>';
  B.appendChild(n); $('nickIn').value = nick.get();
  const msg = document.createElement('p'); msg.className = 'note'; msg.textContent = online() ? 'Nickname only — never use your real name. ' + M.RULES + '.' : 'Local board (this device). Online rankings turn on when the server is configured.'; B.appendChild(msg);
  $('nickSave').onclick = () => { const e = nick.set($('nickIn').value); msg.textContent = e || 'Saved'; if (!e) render(); };
  for (const [list, cur, set] of [[METRICS.map(m => [m.id, m.name]), metric, v => metric = v], [[['week', 'This week'], ['all', 'All-time']], scope, v => scope = v]]) {
    const t = document.createElement('div'); t.className = 'tabs';
    for (const [id, nm] of list) { const b = document.createElement('button'); b.textContent = nm; b.className = id === cur ? 'on' : ''; b.onclick = () => { set(id); render(); }; t.appendChild(b); }
    B.appendChild(t);
  }
  const box = document.createElement('div'); B.appendChild(box); box.textContent = 'Loading…';
  try { await sync(); } catch (_) {}
  let rows; try { rows = await top(metric, scope); } catch (_) { box.textContent = 'Offline — showing nothing right now.'; return; }
  box.textContent = ''; const unit = METRICS.find(m => m.id === metric).unit;
  rows.forEach((r, i) => { const d = document.createElement('div'); d.className = 'lb-row' + (r.me ? ' me' : ''); d.innerHTML = '<span class="rk"></span><span class="nm"></span><span class="v"></span>'; d.children[0].textContent = i + 1; d.children[1].textContent = r.nick; d.children[2].textContent = `${r.value.toLocaleString()} ${unit}`;
    const showMsg = r.msg && !M.check(r.msg) && !M.hidden(r.device, r.msg);
    if (showMsg) { const m = document.createElement('div'); m.className = 'lb-msg'; const q = document.createElement('span'); q.textContent = `“${r.msg}”`; m.appendChild(q); d.appendChild(m); }
    if (online() && !r.me && r.device) { const b = document.createElement('button'); b.className = 'rep'; b.dataset.dev = r.device;
      const done = reported(r.device, metric); b.textContent = done ? 'Reported' : 'Report'; b.disabled = done;
      b.onclick = async () => { if (!confirm(`Report ${r.nick}${r.msg ? ' and their message' : ''} for review? Hidden on this device now; a moderator will check it.`)) return;
        b.disabled = true; b.textContent = 'Sending…';
        try { await report(r.device, metric, r.msg ? 'message' : 'nickname'); if (r.msg) M.report(r.device, r.msg); b.textContent = 'Reported ✓'; if (r.msg) setTimeout(render, 600); }
        catch (_) { b.disabled = false; b.textContent = 'Report (retry)'; } };
      (d.querySelector('.lb-msg') || d).appendChild(b); }
    box.appendChild(d); });
}
export function init() {
  $('lbBtn').onclick = () => { $('board').hidden = false; const t = localStorage.getItem('fidget.toy'); const m = METRICS.find(x => x.toy === t); if (m) metric = m.id; render(); };
  $('board').onclick = e => { if (e.target.id === 'board' || e.target.closest('[data-close]')) $('board').hidden = true; };
}
