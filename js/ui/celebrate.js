// Record celebration: full-screen fireworks + confetti, trophy reveal, rank climb, fanfare + haptics; Calm = gentle version.
// Then a ≤40-char victory message (presets + filter) that appears next to the score on the leaderboard.
import { on } from '../bus.js';
import { synth, buzzPattern, opts } from '../feel.js?v=6';
import * as msg from '../lb/msg.js';
import { rank, resend, online } from '../lb/adapter.js?v=3';
const R = () => Math.min(2, window.devicePixelRatio || 1); // cap full-screen confetti canvas cost on 3x phones
const $ = id => document.getElementById(id);
let shareFn = null; export const setShare = f => { shareFn = f; };
let last = 0, cv, g, raf = 0, parts = [], rockets = [], T0 = 0, cur = null, W = 0, H = 0;
const rnd = (a, b) => a + Math.random() * (b - a), PAL = ['#ffd54a', '#ff6b6b', '#6be3ff', '#b28cff', '#7dffa8', '#ffffff', '#ff9f43'];
function el() {
  if ($('celeb')) return;
  const d = document.createElement('div'); d.id = 'celeb'; d.hidden = true;
  d.innerHTML = `<canvas id="celebCv"></canvas><div class="cb-top"><div class="cb-title" id="cbTitle"></div><div class="cb-val" id="cbVal"></div><div class="cb-rank" id="cbRank"></div></div>
  <div class="cb-panel" id="cbPanel" hidden><div class="cb-lbl">Leave a victory message <span id="cbCount"></span></div>
  <div class="cb-in"><input id="cbIn" maxlength="${msg.MAX}" autocomplete="off" placeholder="Shown next to your score" aria-label="Victory message"><button class="buy" id="cbSave">Post</button></div><p class="cb-rules" id="cbRules"></p>
  <div class="cb-err" id="cbErr"></div><div class="chips" id="cbChips"></div>
  <div class="cb-row"><button class="buy eq" id="cbShare" hidden>Share my record</button><button class="buy eq" id="cbClose">Done</button></div>
  <p class="note">Nickname + message only. No links or contact info. Others can hide messages they don't like.</p></div>`;
  document.body.appendChild(d); cv = $('celebCv'); g = cv.getContext('2d');
  $('cbRules').textContent = msg.RULES;
  for (const p of msg.PRESETS) { const b = document.createElement('button'); b.className = 'chip'; b.textContent = p; b.onclick = () => { $('cbIn').value = p; count(); }; $('cbChips').appendChild(b); }
  $('cbIn').oninput = count; $('cbIn').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); save(); } }; $('cbSave').onclick = save; $('cbClose').onclick = close;
  $('cbShare').onclick = () => shareFn && shareFn({ record: cur, canvas: snap() });
}
const count = () => { const n = [...msg.clean($('cbIn').value)].length; $('cbCount').textContent = `${n}/${msg.MAX}`; $('cbErr').textContent = ''; };
function save() { const e = msg.setMine(cur.metric, $('cbIn').value); $('cbErr').textContent = e || 'Posted ✓ — it shows next to your score.'; if (!e) { resend().catch(() => {}); setTimeout(close, 700); } }
function close() { $('celeb').hidden = true; cancelAnimationFrame(raf); raf = 0; parts = []; rockets = []; }
function snap() { const c = document.createElement('canvas'); c.width = 720; c.height = 720; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 720); gr.addColorStop(0, '#1d1630'); gr.addColorStop(1, '#07060c'); x.fillStyle = gr; x.fillRect(0, 0, 720, 720);
  trophy(x, 360, 300, 1.6, 1); x.textAlign = 'center'; x.fillStyle = '#ffd54a'; x.font = '900 54px system-ui,sans-serif'; x.fillText($('cbTitle').textContent, 360, 560);
  x.fillStyle = '#fff'; x.font = '700 34px system-ui,sans-serif'; x.fillText($('cbVal').textContent, 360, 615); x.fillStyle = 'rgba(255,255,255,.6)'; x.font = '500 24px system-ui,sans-serif'; x.fillText('Fidget — phantasticinc.github.io/fidget', 360, 680); return c; }
// trophy drawn in canvas (no image assets)
function trophy(x, cx, cy, s, k) {
  x.save(); x.translate(cx, cy); x.scale(s * k, s * k);
  const gr = x.createLinearGradient(-60, -80, 60, 60); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.45, '#ffc93c'); gr.addColorStop(1, '#b26a00');
  x.shadowColor = 'rgba(255,200,60,.8)'; x.shadowBlur = 30; x.fillStyle = gr; x.strokeStyle = '#ffdf7a'; x.lineWidth = 7;
  x.beginPath(); x.arc(-62, -40, 26, Math.PI * 0.5, Math.PI * 1.5, false); x.stroke(); x.beginPath(); x.arc(62, -40, 26, Math.PI * 1.5, Math.PI * 0.5, false); x.stroke();
  x.beginPath(); x.moveTo(-60, -80); x.lineTo(60, -80); x.quadraticCurveTo(60, 10, 12, 28); x.lineTo(12, 55); x.lineTo(-12, 55); x.lineTo(-12, 28); x.quadraticCurveTo(-60, 10, -60, -80); x.fill();
  x.shadowBlur = 0; x.fillRect(-38, 55, 76, 14); x.fillStyle = '#5b3b10'; x.fillRect(-46, 69, 92, 20);
  x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(-28, -48, 9, 26, 0.25, 0, 7); x.fill();
  x.fillStyle = '#7a4a00'; x.font = '900 40px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText('★', 0, -22); x.restore();
}
function boom(x, y, n, col) { for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), v = rnd(60, 320); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(1, 1.8), t: 0, col: col || PAL[(Math.random() * PAL.length) | 0], k: 'spark' }); } }
function confetti(n, slow) { for (let i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(-H * 0.4, -10), vx: rnd(-40, 40), vy: rnd(slow ? 30 : 80, slow ? 70 : 240), r: rnd(0, 6), vr: rnd(-8, 8), life: slow ? 6 : 4.5, t: 0, col: PAL[(Math.random() * PAL.length) | 0], k: 'conf' }); }
function tick(now) {
  const t = (now - T0) / 1000, dt = Math.min(0.05, Math.max(0, (now - (last || now - 16.7)) / 1000)), calm = cur.calm; last = now; raf = requestAnimationFrame(tick); // real frame time: same speed on 60/90/120 Hz screens
  g.setTransform(R(), 0, 0, R(), 0, 0);
  g.fillStyle = calm ? 'rgba(8,10,9,.35)' : 'rgba(8,6,16,.28)'; g.fillRect(0, 0, W, H);   // trails
  if (!calm && t < 6 && Math.random() < (t < 2 ? 0.18 : 0.06)) rockets.push({ x: rnd(W * 0.1, W * 0.9), y: H, vy: -rnd(520, 760), top: rnd(H * 0.1, H * 0.4), col: PAL[(Math.random() * PAL.length) | 0] });
  g.globalCompositeOperation = 'lighter';
  rockets = rockets.filter(r => { r.y += r.vy * dt; g.fillStyle = r.col; g.beginPath(); g.arc(r.x, r.y, 2.5, 0, 7); g.fill(); if (r.y <= r.top) { boom(r.x, r.y, 70, r.col); boomSnd(); return false; } return true; });
  // god rays behind trophy
  const cy = H * 0.36, rk = Math.min(1, t / 0.6);
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + t * 0.25; g.fillStyle = `rgba(255,214,90,${(calm ? 0.04 : 0.08) * rk})`; g.beginPath(); g.moveTo(W / 2, cy); g.arc(W / 2, cy, Math.max(W, H), a, a + 0.12); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  parts = parts.filter(p => { p.t += dt; if (p.t > p.life) return false; const k = 1 - p.t / p.life;
    if (p.k === 'spark') { p.vx *= 0.985; p.vy = p.vy * 0.985 + 160 * dt; p.x += p.vx * dt; p.y += p.vy * dt; g.globalCompositeOperation = 'lighter'; g.fillStyle = p.col; g.globalAlpha = k; g.beginPath(); g.arc(p.x, p.y, 2.2 * k + 0.6, 0, 7); g.fill(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    else { p.x += p.vx * dt + Math.sin(p.t * 3 + p.r) * 0.8; p.y += p.vy * dt; p.r += p.vr * dt; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(1, Math.cos(p.t * 6 + p.r)); g.fillStyle = p.col; g.fillRect(-4, -2.5, 8, 5); g.restore(); }
    return true; });
  // trophy reveal: pops in with overshoot, then gently bobs
  const e = Math.min(1, t / 0.7), pop = calm ? e : 1 + Math.sin(e * Math.PI) * 0.25 * (1 - e) + (e < 1 ? -0.0 : 0);
  trophy(g, W / 2, cy + Math.sin(t * 2) * 4, Math.min(1.25, W / 330), pop * (calm ? Math.min(1, t / 1.2) : e));
  // rank climb: counts down from the old rank to the new one
  if (cur.r1 != null) { const k = Math.min(1, Math.max(0, (t - 0.8) / 1.4)), r = Math.round(cur.r0 + (cur.r1 - cur.r0) * (1 - Math.pow(1 - k, 3)));
    $('cbRank').textContent = cur.r0 > cur.r1 ? `Rank #${cur.r0} → #${r}` : `Rank #${r}`; }
  if (t > (calm ? 1.6 : 2.2) && $('cbPanel').hidden) { $('cbPanel').hidden = false; $('cbIn').value = msg.mine(cur.metric); count(); }
  if (t > 9 && !parts.length && !rockets.length) { cancelAnimationFrame(raf); raf = 0; }
}
function boomSnd() { if (!opts.sound || !synth.ok()) return; const s = synth, t = s.t(), k = s.cm(); s.nz(t, 0.5, 'lowpass', 900, 0.8, 0.18 * k, 0.005); s.nz(t + 0.05, 0.9, 'highpass', 5000, 0.7, 0.04 * k, 0.05); }
function fanfare(calm) { if (!opts.sound || !synth.ok()) return; const s = synth, t = s.t(), k = s.cm();
  const N = calm ? [[0, 523], [0.25, 659], [0.5, 784]] : [[0, 392], [0.12, 392], [0.24, 392], [0.36, 523], [0.75, 659], [0.95, 784], [1.15, 1047]];
  N.forEach(([d, f], i) => { s.tone(t + d, f, f, i === N.length - 1 ? 1.4 : 0.22, (calm ? 0.04 : 0.09) * k, calm ? 'sine' : 'triangle'); if (!calm) s.tone(t + d, f / 2, f / 2, 0.2, 0.04 * k, 'square'); }); }
export async function show(r) {
  el(); const calm = !!opts.calm; cur = { ...r, calm, r0: null, r1: null };
  const d = $('celeb'); d.hidden = false; d.classList.toggle('calm', calm); $('cbPanel').hidden = true; $('cbShare').hidden = !shareFn; $('cbErr').textContent = '';
  W = innerWidth; H = innerHeight; cv.width = W * R(); cv.height = H * R();
  let r0 = 1, r1 = 1, wk = 1; try { [r0, r1, wk] = await Promise.all([rank(r.metric, 'all', r.prev), rank(r.metric, 'all', r.value), rank(r.metric, 'week', r.value)]); } catch (_) {}
  cur.r0 = r0; cur.r1 = r1;
  $('cbTitle').textContent = !online() ? 'NEW RECORD!' : r1 === 1 ? '#1 ALL-TIME!' : wk === 1 ? '#1 THIS WEEK!' : 'NEW PERSONAL BEST!';
  $('cbVal').textContent = `${r.name}: ${r.value.toLocaleString()} ${r.unit}` + (r.prev ? `  (was ${r.prev.toLocaleString()})` : '');
  g.clearRect(0, 0, cv.width, cv.height); parts = []; rockets = [];
  if (calm) confetti(40, true); else { confetti(160); boom(W * 0.3, H * 0.25, 90); boom(W * 0.7, H * 0.2, 90); boomSnd(); }
  fanfare(calm); if (opts.haptic) buzzPattern(calm ? [15] : [30, 60, 30, 60, 30, 120, 90]);
  T0 = performance.now(); last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
}
// Cooldown: the full-screen show plays once per toy metric per session; later records that session get a small toast.
const shown = new Set();
function mini(r) { const d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = `🏆 New record! ${r.name}: ${r.value.toLocaleString()} ${r.unit}`;
  ($('app') || document.body).appendChild(d); setTimeout(() => d.remove(), 2600); if (opts.haptic) buzzPattern([15]); }
export function init() { on('record', r => { if ($('celeb') && !$('celeb').hidden) return; if (shown.has(r.metric)) return mini(r); shown.add(r.metric); show(r); }); }
