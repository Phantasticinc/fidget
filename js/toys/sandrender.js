// Shades the heightfield (top-left key light, AO, glossy cut faces with specular), then a crisp full-res grain layer + contact shadow.
export const COLORS = [[232, 120, 92], [96, 168, 190], [214, 180, 112], [150, 120, 200], [120, 176, 120]];
export function makeRenderer(G, dpr) {
  const c = document.createElement('canvas'); c.width = G.gw; c.height = G.gh;
  const g = c.getContext('2d'), img = g.createImageData(G.gw, G.gh);
  const out = document.createElement('canvas'), og = out.getContext('2d');
  const noise = document.createElement('canvas'); noise.width = noise.height = 128;
  const ng = noise.getContext('2d'), nd = ng.createImageData(128, 128);
  for (let i = 0; i < nd.data.length; i += 4) { const v = Math.random() < 0.5 ? 0 : 255; nd.data[i] = nd.data[i + 1] = nd.data[i + 2] = v; nd.data[i + 3] = 10 + Math.random() * 34; }
  ng.putImageData(nd, 0, 0);
  let pat = null, f = 0; const sh = document.createElement('canvas'); sh.width = G.gw + 16; sh.height = G.gh + 16; const sg = sh.getContext('2d');
  return {
    canvas: c,
    draw(dst, x, y, w, h, col, calm, tint) {
      const { gw, gh, h: H, grain, gl } = G, d = img.data;
      const [r0, g0, b0] = calm ? [150, 160, 150] : col;
      for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
        const k = j * gw + i, v = H[k], p = k * 4;
        if (v < 0.015) { d[p + 3] = 0; continue; }
        const l = i > 0 ? H[k - 1] : 0, r = i < gw - 1 ? H[k + 1] : 0, u = j > 0 ? H[k - gw] : 0, dn = j < gh - 1 ? H[k + gw] : 0;
        const nx = (l - r) * 3.2, ny = (u - dn) * 3.2, lit = nx * 0.6 + ny * 0.8;
        let s = 0.78 + lit * 0.55 + v * 0.12;
        const steep = Math.min(1, Math.hypot(nx, ny) * 0.6), gk = gl[k];
        s += (grain[k] - 0.5) * (0.07 + steep * 0.22) * (1 - gk * 0.7); // glossy faces are smoother
        let spec = gk > 0 ? gk * Math.max(0, lit) ** 2 * 0.9 + gk * 0.06 : 0; // wet sheen on fresh cuts
        s = Math.max(0.35, Math.min(1.35, s - gk * 0.08));
        let R = r0 * s + spec * 255, Gc = g0 * s + spec * 245, B = b0 * s + spec * 230;
        if (tint) { const t = tint(k, v); if (t) { R = R * (1 - t[3]) + t[0] * t[3]; Gc = Gc * (1 - t[3]) + t[1] * t[3]; B = B * (1 - t[3]) + t[2] * t[3]; } }
        d[p] = Math.min(255, R); d[p + 1] = Math.min(255, Gc); d[p + 2] = Math.min(255, B);
        d[p + 3] = Math.min(255, v * 2200);
      }
      g.putImageData(img, 0, 0);
      const W = Math.ceil(w * dpr), Hh = Math.ceil(h * dpr); if (out.width !== W || out.height !== Hh) { out.width = W; out.height = Hh; pat = null; }
      og.globalCompositeOperation = 'source-over'; og.clearRect(0, 0, W, Hh); og.imageSmoothingEnabled = true; og.imageSmoothingQuality = 'high';
      og.drawImage(c, 0, 0, W, Hh);
      og.globalCompositeOperation = 'source-atop'; pat = pat || og.createPattern(noise, 'repeat'); og.fillStyle = pat; og.fillRect(0, 0, W, Hh);
      og.globalCompositeOperation = 'source-over';
      if ((f = f + 1) % 4 === 1) { sg.clearRect(0, 0, sh.width, sh.height); sg.filter = 'blur(3px) brightness(0)'; sg.drawImage(c, 8, 8); sg.filter = 'none'; }
      const sc = w / G.gw; dst.globalAlpha = 0.5; dst.drawImage(sh, x - 8 * sc + 5, y - 8 * sc + 10, sh.width * sc, sh.height * sc); dst.globalAlpha = 1;
      dst.drawImage(out, x, y, w, h);
    },
  };
}
