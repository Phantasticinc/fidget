// 2D soft body: ring of mass points with shape-matching spring, edge springs and area (pressure) preservation.
// Fingers can dent it (push points out of a disk) or grab points (stretch). Used by Slime and Squish.
export function body(o) {
  const N = o.N || 48, P = [];
  let cx = 0, cy = 0, R = 100, A0 = 0;
  const api = {
    P, N,
    get cx() { return cx; }, get cy() { return cy; }, get R() { return R; },
    place(x, y, r) { const s = P.length ? r / R : 1, ox = cx, oy = cy; cx = x; cy = y; R = r;
      if (!P.length) for (let i = 0; i < N; i++) { const a = i / N * 6.2832; P.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, vx: 0, vy: 0, ax: Math.cos(a), ay: Math.sin(a), g: null }); }
      else for (const p of P) { p.x = x + (p.x - ox) * s; p.y = y + (p.y - oy) * s; }
      A0 = Math.PI * r * r; },
    area() { let a = 0; for (let i = 0; i < N; i++) { const p = P[i], q = P[(i + 1) % N]; a += p.x * q.y - q.x * p.y; } return a / 2; },
    // returns max finger-induced deformation 0..1 this step (for sound/haptics)
    step(dt, fingers) {
      let mx = 0, my = 0; for (const p of P) { mx += p.x; my += p.y; } mx /= N; my /= N;
      // body stays anchored to its home (it's on a table), but can drift a little
      const hx = cx + (mx - cx) * (o.drift || 0), hy = cy + (my - cy) * (o.drift || 0);
      const A = api.area(), pr = (A0 * (1 + (api.swell || 0)) - A) / A0 * (o.pressure ?? 3), L = 2 * Math.PI * R / N;
      let def = 0;
      for (let i = 0; i < N; i++) {
        const p = P[i], a = P[(i + N - 1) % N], b = P[(i + 1) % N];
        let fx = (hx + p.ax * R - p.x) * o.kShape, fy = (hy + p.ay * R - p.y) * o.kShape;
        for (const q of [a, b]) { const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, e = (d - L) / d * o.kEdge; fx += dx * e; fy += dy * e; }
        const nx = b.y - a.y, ny = -(b.x - a.x), nl = Math.hypot(nx, ny) || 1; fx += nx / nl * pr * R * o.kShape * 2.2; fy += ny / nl * pr * R * o.kShape * 2.2;
        const damp = p.g ? 0 : (o.damp || 8) * (p.slow ? 3 : 1);
        p.vx += (fx - p.vx * damp) * dt; p.vy += (fy - p.vy * damp) * dt;
      }
      for (const p of P) {
        if (p.g) { const f = p.g; const tx = f.x + p.gx, ty = f.y + p.gy; p.vx = (tx - p.x) / Math.max(dt, 1e-3) * 0.5; p.vy = (ty - p.y) / Math.max(dt, 1e-3) * 0.5; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.slow = false;
        def = Math.max(def, Math.hypot(p.x - (cx + p.ax * R), p.y - (cy + p.ay * R)) / R);
      }
      // fingers on the rim push it in (point projected onto the fingertip disk boundary), so you can pinch/squeeze it
      for (const f of fingers) if (f.dent) for (const p of P) { if (p.g) continue; const dx = p.x - f.x, dy = p.y - f.y, d = Math.hypot(dx, dy); if (d < f.r && d > 1e-3) { const s = (f.r - d) / d; p.x += dx * s; p.y += dy * s; p.vx *= 0.5; p.vy *= 0.5; p.slow = true; } }
      return Math.min(1, def);
    },
    grab(f, r) { const got = []; for (const p of P) { const d = Math.hypot(p.x - f.x, p.y - f.y); if (d < r && !p.g) { p.g = f; p.gx = (p.x - f.x) * 0.6; p.gy = (p.y - f.y) * 0.6; got.push(p); } } return got; },
    release(f) { for (const p of P) if (p.g === f) p.g = null; },
    inside(x, y) { let c = false; for (let i = 0, j = N - 1; i < N; j = i++) { const a = P[i], b = P[j]; if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; },
    path(g) { g.beginPath(); for (let i = 0; i <= N; i++) { const p = P[i % N], q = P[(i + 1) % N], mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2; i ? g.quadraticCurveTo(p.x, p.y, mx, my) : g.moveTo(mx, my); } g.closePath(); },
  };
  return api;
}
