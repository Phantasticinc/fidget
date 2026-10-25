// Kinetic sand v2: cohesive heightfield + gooey lumps.
// Gestures (real multi-touch): drag = clean glossy slice · hold = press/squish (bulging rim) · hold then drag = sticky drag (sand clings and travels)
// · keep circling while dragging = roll a ball · two fingers close together = PINCH: grab a clump, lift, stretch into sticky strands, tear, drop to splat + re-merge
// · two fingers far apart then spread = pull the sand apart. Mold ↻ = fresh shape.
import { sfx, buzz, buzzPattern, opts } from '../feel.js?v=4';
import { makeGrid, mold, relax, slice, press, smear, take, blob, at, SHAPES } from './sandgrid.js?v=3';
import { makeRenderer, COLORS } from './sandrender.js?v=2';
import { makeGoo } from './sandgoo.js?v=1';
import { rr, DPR } from '../render.js?v=1';
import { emit } from '../bus.js';
import { look } from '../look.js';
const GW = 110, PINCH_MAX = 190;
export function create() {
  let W, H, G, ren, bx, by, bw, bh, cs, n = 0, tick = 0, btn, goo = makeGoo(), PIN = null, PULL = null, lastSnd = 0;
  const F = new Map();
  const toG = (x, y) => [(x - bx) / cs, (y - by) / cs], toP = (gx, gy) => [bx + gx * cs, by + gy * cs];
  const shp = () => (look.sand && look.sand.shapes) || SHAPES;
  const col = () => look.sand ? look.sand.colors[n % look.sand.colors.length] : COLORS[n % COLORS.length];
  const now = () => performance.now();
  const snd = (fn, gap = 90) => { const t = now(); if (t - lastSnd > gap) { lastSnd = t; fn(); } };
  function fresh() { mold(G, shp()[n % shp().length]); goo.lumps.length = 0; goo.crumbs.length = 0; goo.strands.length = 0; PIN = null; }
  function grabMass(x, y, rpx) { const [gx, gy] = toG(x, y); return take(G, gx, gy, rpx / cs, 0.9); }
  function splat(L) { // lump lands: flattens into the surface, squirts a few crumbs that roll and re-merge
    const [gx, gy] = toG(L.x, L.y), r = goo.rOf(L.m) / cs * 1.25; blob(G, gx, gy, r, L.m * 0.85);
    const k = Math.min(10, 2 + L.m * 2); for (let i = 0; i < k; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 90 * Math.min(2, -L.vz / 3 + 0.5); goo.crumb(L.x, L.y, Math.cos(a) * v, Math.sin(a) * v * 0.7, L.m * 0.15 / k, 0.2); }
    sfx.squelch(Math.min(1, 0.3 + L.m / 5)); buzzPattern(opts.calm ? [10] : [18, 25, 8]); emit('splat', { x: L.x, y: L.y, m: L.m, r: goo.rOf(L.m) });
  }
  function startPair(a, b) {
    const d = Math.hypot(a.x - b.x, a.y - b.y); a.mode = b.mode = 'pair';
    if (d < PINCH_MAX) { // grab between the fingertips
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, m = grabMass(mx, my, d / 2 + 14) + grabMass(a.x, a.y, 10) + grabMass(b.x, b.y, 10);
      const A = goo.lump({ x: a.x, y: a.y, m: m / 2, held: a.id, pair: true }), B = goo.lump({ x: b.x, y: b.y, m: m / 2, held: b.id, pair: true });
      PIN = { a: a.id, b: b.id, d0: Math.max(30, d), A, B, torn: false, m, lastDrip: 0, sq: 0 };
      if (m > 0.05) { sfx.squish(Math.min(1, m / 4)); buzz(14); emit('grab', { x: mx, y: my, m, r: d / 2 + 14, lumps: [A, B] }); }
    } else PULL = { a: a.id, b: b.id, d0: d, last: d };
  }
  function endPair(id) {
    if (PIN && (PIN.a === id || PIN.b === id)) {
      const mine = PIN.a === id ? PIN.A : PIN.B, other = PIN.a === id ? PIN.B : PIN.A, oid = PIN.a === id ? PIN.b : PIN.a, of = F.get(oid);
      if (!PIN.torn && of) { // still connected: the whole clump sticks to the remaining finger
        other.m += mine.m; mine.m = 0; goo.lumps.splice(goo.lumps.indexOf(mine), 1); goo.strand(other.x, other.y - 12, mine.x, mine.y - 12, 5, 0.3); sfx.peel(0.6); buzz(8);
        other.pair = false; of.mode = 'carry'; of.lump = other; PIN = null; return;
      }
      mine.held = null; mine.pair = false; mine.vz = 0; mine.vx = (mine.x - (mine.px || mine.x)) * 20; mine.vy = (mine.y - (mine.py || mine.y)) * 20;
      if (!of) { PIN = null; } else { if (PIN.a === id) PIN.a = null; else PIN.b = null; of.mode = 'carry'; of.lump = other; other.pair = false; PIN = null; }
    }
    if (PULL && (PULL.a === id || PULL.b === id)) { const of = F.get(PULL.a === id ? PULL.b : PULL.a); if (of) of.mode = 'spent'; PULL = null; }
  }
  return {
    resize(w, h) {
      W = w; H = h; bw = Math.min(W * 0.92, 420); cs = bw / GW; const gh = Math.round(Math.min(H * 0.56, bw * 1.15) / cs); bh = gh * cs;
      bx = (W - bw) / 2; by = H * 0.47 - bh / 2;
      if (!G || G.gh !== gh) { G = makeGrid(GW, gh); ren = makeRenderer(G, Math.min(1.5, DPR())); fresh(); }
      btn = { w: 112, h: 40, x: W / 2 - 56, y: by + bh + 14 };
    },
    get grid() { return G; }, get pin() { return PIN; }, get goo() { return goo; }, geom: () => ({ bx, by, cs, bw, bh }),
    hud: () => PIN ? (PIN.torn ? 'torn! release to drop' : 'stretch… pull apart to tear') : `${shp()[n % shp().length]} · slice · press · pinch · roll`,
    down(id, x, y) {
      if (x > btn.x && x < btn.x + btn.w && y > btn.y && y < btn.y + btn.h) { n++; fresh(); emit('mold', { x: W / 2, y: by + bh / 2, w: bw, h: bh }); sfx.sand(0.9); setTimeout(() => sfx.sand(0.5), 70); buzz(25); return; }
      const f = { id, x, y, sx: x, sy: y, t: now(), lx: x, ly: y, lt: now(), mode: '?', turn: 0, la: null, lump: null };
      // touching a resting ball picks it up
      const ball = goo.lumps.find(L => L.ball && !L.held && Math.hypot(L.x - x, L.y - y) < goo.rOf(L.m) + 14);
      if (ball) { ball.held = id; f.mode = 'carry'; f.lump = ball; f.rolling = true; }
      F.set(id, f);
      const others = [...F.values()].filter(o => o.id !== id && !o.lump && o.mode !== 'pair' && o.mode !== 'spent');
      if (!ball && others.length === 1 && !PIN && !PULL) startPair(others[0], f);
    },
    move(id, x, y, p, ts) {
      const f = F.get(id); if (!f) return; const t = ts || now(), dx = x - f.lx, dy = y - f.ly, step = Math.hypot(dx, dy);
      if (f.mode === '?' && Math.hypot(x - f.sx, y - f.sy) > 7) f.mode = now() - f.t > 260 ? 'drag' : 'slice';
      if (f.mode === 'press' && Math.hypot(x - f.sx, y - f.sy) > 9) f.mode = 'drag';
      if (f.mode === 'slice' && step > 0.5) {
        const [a, b] = toG(f.lx, f.ly), [c, d] = toG(x, y), m = slice(G, a, b, c, d, 1.3), sp = step / Math.max(1, t - f.lt);
        if (m > 0.03) { snd(() => sfx.sand(Math.min(1, 0.3 + sp / 1.5)), 45); buzz(4 + Math.min(8, m * 2)); emit('cut', { x, y, amt: m, speed: sp, dx, dy }); }
      }
      if ((f.mode === 'drag' || f.mode === 'carry') && step > 0.5) {
        if (!f.lump) { const m0 = grabMass(f.lx, f.ly, 11); f.lump = goo.lump({ x, y, m: Math.max(0.05, m0), held: id }); f.lump.z = 0.2; sfx.peel(0.3); }
        const L = f.lump, [a, b] = toG(f.lx, f.ly), [c, d] = toG(x, y);
        if (L.ball) { L.m += take(G, c, d, goo.rOf(L.m) / cs * 0.55, 0.012); L.spin += step / goo.rOf(L.m); }
        else if (!L.pair) L.m = Math.max(0.05, Math.min(9, L.m + smear(G, a, b, c, d, 2.2, L.m)));
        const ang = Math.atan2(dy, dx); if (f.la != null) { let da = ang - f.la; da = Math.atan2(Math.sin(da), Math.cos(da)); f.turn += da; } f.la = ang;
        if (!L.ball && Math.abs(f.turn) > 4 * Math.PI && L.m > 0.6) { L.ball = true; L.z = 0.15; sfx.squish(0.8); buzzPattern([10, 30, 10]); emit('ball', { x, y, r: goo.rOf(L.m) }); }
        if (tick % 4 === 0 && !L.ball) { goo.strand(x, y - 10, f.lx - dx * 3, f.ly - dy * 3, 2.2, 0.25, false); snd(() => sfx.peel(0.15), 140); }
        L.px = L.x; L.py = L.y; L.x = x; L.y = y;
      }
      f.lx = x; f.ly = y; f.lt = t; f.x = x; f.y = y;
    },
    up(id) {
      const f = F.get(id); if (!f) return; F.delete(id);
      if (f.mode === 'pair') return endPair(id);
      if (f.lump) { const L = f.lump; L.held = null; L.vx = (L.x - (L.px || L.x)) * 30; L.vy = (L.y - (L.py || L.y)) * 30; L.vz = 0;
        if (!L.ball) { goo.strand(L.x, L.y - 12, L.x + (Math.random() - .5) * 20, L.y - 40, 4, 0.35); goo.strand(L.x, L.y - 12, L.x + (Math.random() - .5) * 20, L.y - 36, 3, 0.3); sfx.peel(0.7); buzz(8); }
        else { L.z = 0.15; sfx.sand(0.3); } }
      else if (f.mode === 'press') { for (let i = 0; i < 4; i++) { const a = Math.random() * 6.28; goo.strand(f.x, f.y, f.x + Math.cos(a) * 14, f.y + Math.sin(a) * 14, 2, 0.25); } sfx.peel(0.4); buzz(5); }
    },
    step(dt) {
      tick++; const t = now();
      for (const f of F.values()) {
        if (f.mode === '?' && t - f.t > 120) f.mode = 'press';
        if (f.mode === 'press') { const [gx, gy] = toG(f.x, f.y); const r = press(G, gx, gy, 3.6, 0.01);
          if (r > 0.001) { if (tick % 30 === 0) { sfx.squish(0.35); buzz(4); } if (tick % 10 === 0) emit('press', { x: f.x, y: f.y, amt: r }); } }
      }
      if (PIN) { const a = F.get(PIN.a), b = F.get(PIN.b);
        if (a && b) {
          for (const [L, f] of [[PIN.A, a], [PIN.B, b]]) { L.px = L.x; L.py = L.y; L.x = f.x; L.y = f.y; }
          const d = Math.hypot(a.x - b.x, a.y - b.y), s = d / PIN.d0, tearS = 1.7 + Math.min(0.9, PIN.m / 8);
          PIN.thin = Math.max(0, Math.min(1, (s - 1) / (tearS - 1)));
          if (!PIN.torn && s < 0.75) { PIN.A.sq = PIN.B.sq = Math.min(1, (0.75 - s) * 3); snd(() => { sfx.squish(0.5); buzz(4); }, 200); }
          if (!PIN.torn && PIN.thin > 0.3) { // stretching: creak, sticky fibres, drips falling from the bridge
            snd(() => { sfx.peel(0.2 + PIN.thin * 0.4); buzz(3); }, 160 - PIN.thin * 100);
            if (t - PIN.lastDrip > 220 - PIN.thin * 150) { PIN.lastDrip = t; const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dm = Math.min(0.08, PIN.A.m * 0.04); if (dm > 0.005) { PIN.A.m -= dm / 2; PIN.B.m -= dm / 2; goo.crumb(mx + (Math.random() - .5) * 10, my, (Math.random() - .5) * 20, 10, dm, 0.9); emit('crumble', { x: mx, y: my, amt: dm }); } }
            if (tick % 6 === 0) emit('stretch', { x0: a.x, y0: a.y, x1: b.x, y1: b.y, thin: PIN.thin });
          }
          if (!PIN.torn && s > tearS) { PIN.torn = true; PIN.A.pair = PIN.B.pair = false; const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 12;
            for (let i = 0; i < 3; i++) { goo.strand(a.x, a.y - 12, mx + (Math.random() - .5) * 16, my + i * 4, 3 - i * 0.6, 0.35); goo.strand(b.x, b.y - 12, mx + (Math.random() - .5) * 16, my + i * 4, 3 - i * 0.6, 0.35); }
            for (let i = 0; i < 4; i++) goo.crumb(mx, my + 12, (Math.random() - .5) * 80, (Math.random() - .5) * 40, 0.01, 1);
            sfx.peel(1); buzzPattern(opts.calm ? [8] : [6, 20, 14]); emit('tear', { x: mx, y: my, m: PIN.m }); }
        }
      }
      if (PULL) { const a = F.get(PULL.a), b = F.get(PULL.b); if (a && b) { const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > PULL.last + 5) { const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, ux = (b.x - a.x) / d, uy = (b.y - a.y) / d, half = Math.min(140, PULL.d0 * 0.5);
          const [p0, p1] = toG(mx - uy * half, my + ux * half), [q0, q1] = toG(mx + uy * half, my - ux * half);
          const m = slice(G, p0, p1, q0, q1, 0.8 + Math.min(2.2, (d - PULL.d0) / cs * 0.08)); PULL.last = d;
          if (m > 0.05) { sfx.peel(0.5); sfx.sand(0.4); buzz(8); emit('tear', { x: mx, y: my, m }); emit('cut', { x: mx, y: my, amt: m, speed: 0.5, dx: -uy, dy: ux }); } } } }
      goo.step(dt, splat, c => { const [gx, gy] = toG(c.x, c.y); blob(G, gx, gy, 1.5, c.m); });
      if (tick % 3 === 0) relax(G);
    },
    draw(g) {
      rr(g, bx - 10, by - 10, bw + 20, bh + 20, 26); g.fillStyle = 'rgba(255,255,255,.025)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1; g.stroke();
      const c = col(), ls = look.sand; ren.draw(g, bx, by, bw, bh, c, opts.calm, ls && ls.tint);
      emit('sandDraw', { g, bx, by, cs, G, W, H });
      goo.draw(g, c, opts.calm, ls && ls.lump);
      if (PIN && !PIN.torn && PIN.A.m + PIN.B.m > 0.05) goo.drawPair(g, PIN.A, PIN.B, c, opts.calm, PIN.torn ? 1 : PIN.thin || 0);
      rr(g, btn.x, btn.y, btn.w, btn.h, 20); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.1)'; g.stroke();
      g.fillStyle = '#ecebe8'; g.font = '600 14px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Mold ↻', W / 2, btn.y + btn.h / 2 + 1);
    },
  };
}
