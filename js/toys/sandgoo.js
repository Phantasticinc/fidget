// Cohesive clumps + sticky strands, in screen px. A lump is a soft blob with mass m (grid-height units), lift z [0..1].
// Held lumps follow fingers; a pinch lump has two lobes joined by a gooey bridge that thins, drips and tears.
// Free lumps fall, splat into the heightfield and re-merge. Strands are short-lived sagging threads that peel and snap back.
export function makeGoo() {
  const lumps = [], strands = [], crumbs = [];
  const rOf = m => 6 + Math.cbrt(m) * 3.6;
  return {
    lumps, strands, crumbs, rOf,
    lump(o) { const L = Object.assign({ x: 0, y: 0, z: 0, vz: 0, vx: 0, vy: 0, m: 1, held: null, spin: 0, sq: 0, ball: false, born: performance.now() }, o); lumps.push(L); return L; },
    strand(x0, y0, x1, y1, w, life = 0.35, snap = true) { strands.push({ x0, y0, x1, y1, w, t: 0, life, snap }); },
    crumb(x, y, vx, vy, m, z = 0.5) { if (crumbs.length < 400) crumbs.push({ x, y, vx, vy, z, vz: 0, m, s: 0.8 + Math.random() }); },
    step(dt, onSplat, onCrumb) {
      for (let i = lumps.length - 1; i >= 0; i--) {
        const L = lumps[i]; L.sq *= Math.pow(0.02, dt);
        if (L.held) { L.z += (L.ball ? 0.15 - L.z : 1 - L.z) * Math.min(1, dt * 9); continue; }
        if (L.ball && L.z <= 0.16) { L.x += L.vx * dt; L.y += L.vy * dt; L.vx *= Math.pow(0.08, dt); L.vy *= Math.pow(0.08, dt); L.spin += Math.hypot(L.vx, L.vy) * dt / rOf(L.m); L.z = 0.15; continue; }
        L.vz -= 9 * dt; L.z += L.vz * dt; L.x += L.vx * dt; L.y += L.vy * dt;
        if (L.z <= 0) { lumps.splice(i, 1); onSplat(L); }
      }
      for (let i = crumbs.length - 1; i >= 0; i--) {
        const c = crumbs[i]; c.x += c.vx * dt; c.y += c.vy * dt; const f = Math.pow(0.93, dt * 60); c.vx *= f; c.vy *= f; c.vz -= 6 * dt; c.z += c.vz * dt;
        if (c.z <= 0) { c.z = 0; if (Math.hypot(c.vx, c.vy) < 25) { crumbs.splice(i, 1); onCrumb(c); } }
      }
      for (let i = strands.length - 1; i >= 0; i--) { const s = strands[i]; s.t += dt; if (s.t > s.life) strands.splice(i, 1); }
    },
    draw(g, col, calm, extra) {
      const [r, gg, b] = calm ? [150, 160, 150] : col, C = (k, a = 1) => `rgba(${r * k | 0},${gg * k | 0},${b * k | 0},${a})`;
      for (const c of crumbs) { g.fillStyle = C(0.75 + c.s * 0.15); const s = c.s * 1.3; g.fillRect(c.x - s, c.y - s - c.z * 10, s * 2, s * 2); }
      for (const s of strands) { // sagging thread that thins; if snap, it recoils toward the anchor
        const k = s.t / s.life, w = s.w * (1 - k); if (w < 0.2) continue; const ex = s.snap ? s.x1 + (s.x0 - s.x1) * k * k : s.x1, ey = s.snap ? s.y1 + (s.y0 - s.y1) * k * k : s.y1;
        g.strokeStyle = C(0.82); g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(s.x0, s.y0); g.quadraticCurveTo((s.x0 + ex) / 2, (s.y0 + ey) / 2 + 10 * (1 - k), ex, ey); g.stroke(); }
      for (const L of lumps) if (!L.pair) drawLump(g, L, rOf(L.m), C, extra);
    },
    drawPair(g, A, B, col, calm, thin) { // two lobes + concave gooey bridge (thin: 0 fat .. 1 about to tear)
      const [r, gg, b] = calm ? [150, 160, 150] : col, C = (k, a = 1) => `rgba(${r * k | 0},${gg * k | 0},${b * k | 0},${a})`;
      const ra = rOf(A.m), rb = rOf(B.m), lift = A.z * 12;
      const ax = A.x, ay = A.y - lift, bx = B.x, by = B.y - lift, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      const w = Math.max(1.2, Math.min(ra, rb) * (1 - thin) * 0.9), mx = (ax + bx) / 2, my = (ay + by) / 2 + 8 * thin;
      // shadow
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(A.x + 6 + lift * 0.8, A.y + 8 + lift, ra, ra * 0.6, 0, 0, 7); g.ellipse(B.x + 6 + lift * 0.8, B.y + 8 + lift, rb, rb * 0.6, 0, 0, 7); g.fill();
      const gr = g.createLinearGradient(mx + nx * 20, my + ny * 20, mx - nx * 20, my - ny * 20); gr.addColorStop(0, C(1.12)); gr.addColorStop(1, C(0.62));
      g.fillStyle = gr; g.beginPath();
      g.moveTo(ax + nx * ra * 0.8, ay + ny * ra * 0.8); g.quadraticCurveTo(mx + nx * w, my + ny * w, bx + nx * rb * 0.8, by + ny * rb * 0.8);
      g.lineTo(bx - nx * rb * 0.8, by - ny * rb * 0.8); g.quadraticCurveTo(mx - nx * w, my - ny * w, ax - nx * ra * 0.8, ay - ny * ra * 0.8); g.closePath(); g.fill();
      // stringy fibres when stretched
      if (thin > 0.25) { g.strokeStyle = C(0.9, 0.7); g.lineWidth = 0.8; for (let i = -2; i <= 2; i++) { const o = i * w * 0.35; g.beginPath(); g.moveTo(ax + nx * o, ay + ny * o); g.quadraticCurveTo(mx + nx * o * 0.6, my + ny * o * 0.6 + 4 * thin, bx + nx * o, by + ny * o); g.stroke(); } }
      drawLump(g, A, ra, C, null, true); drawLump(g, B, rb, C, null, true);
    },
  };
}
function drawLump(g, L, R, C, extra, noShadow) {
  const lift = L.z * 12, s = 1 + L.z * 0.12, x = L.x, y = L.y - lift, sq = L.sq, rx = R * s * (1 + sq * 0.35), ry = R * s * (1 - sq * 0.3);
  if (!noShadow) { g.fillStyle = `rgba(0,0,0,${0.32 - L.z * 0.12})`; g.beginPath(); g.ellipse(L.x + 5 + lift * 0.8, L.y + 7 + lift, rx * 1.05, ry * 0.62, 0, 0, 7); g.fill(); }
  const gr = g.createRadialGradient(x - rx * 0.35, y - ry * 0.45, R * 0.1, x, y, Math.max(rx, ry));
  gr.addColorStop(0, C(1.22)); gr.addColorStop(0.55, C(0.95)); gr.addColorStop(1, C(0.58));
  g.fillStyle = gr; g.beginPath();
  // lumpy outline (not a perfect circle): kinetic sand clumps are irregular
  for (let a = 0; a <= 6.3; a += 0.42) { const k = 1 + 0.07 * Math.sin(a * 3 + L.born) + 0.05 * Math.sin(a * 5 + L.born * 1.7); g.lineTo(x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k); }
  g.fill();
  if (L.ball) { g.fillStyle = C(0.7, 0.55); for (let i = 0; i < 9; i++) { const a = i * 2.4 + L.spin, rr = R * 0.6 * ((i * 37 % 10) / 10); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.9; if (Math.cos(L.spin + i) > -0.3) g.fillRect(px - 1, py - 1, 2, 2); } g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(x - rx * 0.35, y - ry * 0.4, rx * 0.25, ry * 0.15, -0.6, 0, 7); g.fill(); }
  if (extra) extra(g, L, x, y, rx, ry);
}
