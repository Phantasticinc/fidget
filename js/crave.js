// "Ride it out": cravings typically crest and fade within minutes. 3:00 timer + 4-6 breathing pacer.
import { sfx, buzzPattern } from './feel.js?v=4';
export function initCrave() {
  const box = document.getElementById('crave'), btn = document.getElementById('craveBtn');
  const arc = document.getElementById('craveArc'), tm = document.getElementById('craveTime'), br = document.getElementById('craveBreath');
  const hud = document.getElementById('hud');
  let t0 = 0, timer = 0; const DUR = 180, C = 289;
  function stop(done) {
    clearInterval(timer); box.hidden = true; hud.style.visibility = ''; btn.textContent = done ? 'You rode it out ✓' : 'Ride it out · 3:00';
    if (done) { sfx.chime(523); setTimeout(() => sfx.chime(784), 400); buzzPattern([30, 80, 30]); setTimeout(() => btn.textContent = 'Ride it out · 3:00', 6000); }
  }
  function tick() {
    const el = (performance.now() - t0) / 1000, left = Math.max(0, DUR - el);
    tm.textContent = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`;
    arc.style.strokeDashoffset = C * (1 - left / DUR);
    const c = el % 10; br.textContent = c < 4 ? 'Breathe in' : 'Breathe out'; // 4s in, 6s out
    if (left <= 0) stop(true);
  }
  btn.onclick = () => { if (!box.hidden) return stop(false); t0 = performance.now(); box.hidden = false; hud.style.visibility = 'hidden'; btn.textContent = 'Fidget while it passes'; tick(); timer = setInterval(tick, 250); };
  document.getElementById('craveStop').onclick = () => stop(false);
  document.getElementById('craveStop').style.pointerEvents = 'auto';
}
