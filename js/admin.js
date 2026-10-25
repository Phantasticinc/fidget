// Moderation console (not linked from the app). Every action is enforced server-side: admin_queue()/admin_act() check is_admin() (RLS + admins table).
import { LB } from './lb/config.js';
const $ = id => document.getElementById(id), K = 'fidget.admin';
let S = JSON.parse(sessionStorage.getItem(K) || 'null');
const H = () => ({ apikey: LB.anonKey, Authorization: `Bearer ${S.access_token}`, 'Content-Type': 'application/json' });
const err = t => { $('err').textContent = t || ''; };
async function rpc(fn, body) { const r = await fetch(`${LB.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: H(), body: JSON.stringify(body) }); if (r.status === 401) { signOut(); throw new Error('Session expired'); } if (!r.ok) throw new Error((await r.text()) || r.status); return r.json(); }
async function signIn() {
  err(); const r = await fetch(`${LB.url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: LB.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('em').value.trim(), password: $('pw').value }) });
  if (!r.ok) return err('Sign-in failed'); S = await r.json(); sessionStorage.setItem(K, JSON.stringify(S)); $('pw').value = ''; show();
}
function signOut() { S = null; sessionStorage.removeItem(K); show(); }
const ACT = [['approve', 'Approve (restore)', 'ok'], ['hide', 'Hide', 'warn'], ['delete', 'Delete entry', 'bad'], ['ban_device', 'Ban install', 'bad'], ['ban_nick', 'Ban nickname', 'bad']];
async function load() {
  const L = $('list'); L.textContent = 'Loading…'; let rows;
  try { rows = await rpc('admin_queue', { p_status: $('st').value }); } catch (e) { L.textContent = ''; return err(String(e.message || e)); }
  L.textContent = rows.length ? '' : 'Nothing to review 🎉';
  for (const x of rows) {
    const c = document.createElement('div'); c.className = 'card';
    c.innerHTML = '<div class="row"><b class="nk"></b><span class="tag st"></span><span class="dim inf"></span></div><p class="msg"></p><p class="dim rs"></p><div class="row acts"></div>';
    c.querySelector('.nk').textContent = x.nick || '(deleted)';
    const t = c.querySelector('.st'); t.textContent = x.state + (x.banned ? ' · banned' : ''); t.classList.add(x.state);
    c.querySelector('.inf').textContent = `${x.metric} · ${x.value ?? '—'} · ${x.reports} report(s) · install ${x.device.slice(0, 8)} · since ${new Date(x.first_at).toLocaleString()}`;
    c.querySelector('.msg').textContent = x.msg ? `“${x.msg}”` : '(no message)';
    c.querySelector('.rs').textContent = x.reasons && x.reasons.length ? 'Reasons: ' + x.reasons.join(', ') : '';
    for (const [a, label, cls] of ACT) { const b = document.createElement('button'); b.textContent = label; b.className = cls; b.dataset.act = a;
      b.onclick = async () => { if (a !== 'approve' && a !== 'hide' && !confirm(`${label} for ${x.nick}?`)) return; try { err(); await rpc('admin_act', { p_device: x.device, p_metric: x.metric, p_action: a }); load(); } catch (e) { err(String(e.message || e)); } };
      c.querySelector('.acts').appendChild(b); }
    L.appendChild(c);
  }
}
function show() {
  if (!LB.url) { $('login').innerHTML = '<p>Online leaderboard is not configured (js/lb/config.js is empty).</p>'; return; }
  $('login').hidden = !!S; $('app').hidden = !S; if (S) { $('who').textContent = S.user && S.user.email || ''; load(); }
}
$('go').onclick = signIn; $('pw').onkeydown = e => { if (e.key === 'Enter') signIn(); };
$('out').onclick = signOut; $('rf').onclick = load; $('st').onchange = load;
show();
