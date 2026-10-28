// Cube tiers for the shop tab: same shape as the Pop/Spin/Click tiers (name, blurb, animated preview).
// In-game look, sound (kit2 snd.ting) and particles (fx/premium2.js) are keyed by the look name.
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); };
function cube(g, w, h, t, body, panel, dots, edge) {
  const s = Math.min(w, h) * 0.78, x = w / 2 - s / 2, y = h / 2 - s / 2; g.fillStyle = body; rr(g, x, y, s, s, s * 0.14); g.fill();
  if (edge) { g.strokeStyle = edge; g.lineWidth = 2; g.stroke(); }
  for (let i = 0; i < 4; i++) { const px = x + (i % 2) * s / 2, py = y + (i >> 1) * s / 2; g.fillStyle = typeof panel === 'function' ? panel(i) : panel; rr(g, px + s * 0.05, py + s * 0.05, s * 0.4, s * 0.4, s * 0.05); g.fill(); }
  dots.forEach((c, i) => { const px = x + s * (0.15 + (i % 3) * 0.1), py = y + s * 0.15 + (i > 2 ? s * 0.12 : 0), d = Math.sin(t * 4 + i) > 0.85 ? 1.5 : 0; g.fillStyle = c; g.beginPath(); g.arc(px, py + d, s * 0.045, 0, 7); g.fill(); });
  return [x, y, s];
}
export default [
  { id: 'upgrade_cube', look: 'rgb', name: 'RGB', blurb: 'Colour-cycling gamer cube with a neon edge glow. Every press fires a synth blip and a spark burst.',
    preview(g, w, h, t) { const h0 = t * 60 % 360; const [x, y, s] = cube(g, w, h, t, `hsl(${h0},40%,22%)`, i => `hsl(${(h0 + i * 40) % 360},45%,30%)`, [0, 1, 2, 3, 4].map(i => `hsl(${(h0 + i * 50) % 360},90%,62%)`), `hsl(${h0},100%,65%)`);
      g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const a = t * 3 + i; g.fillStyle = `hsl(${(h0 + i * 60) % 360},100%,70%)`; g.fillRect(x + s / 2 + Math.cos(a) * s * 0.6, y + s / 2 + Math.sin(a) * s * 0.6, 2, 2); } g.globalCompositeOperation = 'source-over'; } },
  { id: 'cube_brass', look: 'brass', name: 'Steampunk Brass', blurb: 'Polished brass panels and rivets, enamel buttons, a bell-like ting, tumbling gold flakes and puffs of steam.',
    preview(g, w, h, t) { const gp = i => { const s = ['#d9b45a', '#c49a45', '#b8893a', '#e0bd6a'][i]; return s; }; const [x, y, s] = cube(g, w, h, t, '#2a2a22', gp, ['#3d5c4a', '#5a2f22', '#2f3f5a', '#5a4a22', '#3a2a4a'], '#b8893a');
      for (let i = 0; i < 3; i++) { const p = (t * 0.6 + i / 3) % 1; g.fillStyle = `rgba(235,235,225,${0.4 * (1 - p)})`; g.beginPath(); g.arc(x + s * (0.3 + i * 0.2), y - p * h * 0.25, 4 + p * 6, 0, 7); g.fill(); } } },
  { id: 'cube_frost', look: 'frost', name: 'Frost', blurb: 'See-through ice with frosted panels and glowing buttons. Glassy chimes, ice shards and drifting snowflakes.',
    preview(g, w, h, t) { const [x, y, s] = cube(g, w, h, t, 'rgba(200,230,255,.22)', 'rgba(220,240,255,.18)', ['#bfe6ff', '#d6f4ff', '#a8d8ff', '#e6f7ff', '#c9e2ff'], 'rgba(230,248,255,.85)');
      g.fillStyle = '#fff'; for (let i = 0; i < 10; i++) { const p = (t * 0.15 + i * 0.1) % 1; g.globalAlpha = 0.8; g.beginPath(); g.arc((i * 37 % 100) / 100 * w, p * h, 1.3, 0, 7); g.fill(); } g.globalAlpha = 1; } },
];
