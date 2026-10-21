/* DEEP16 — THE FINE LAND (10-21 night, the world map seat; a TRIAL behind its own door: deep16/?world&fine, or &fine on any DEEP16 address, where F turns
   it on and off, named on screen; THE WORLD without it is as it was). Griz: "Rather than shading the tops of the big hexes, can we actually draw the 330
   terrain with the exception of the two hexes around the hero (build as trial alternate, don't break existing)"; asked which, "(a) but two rings" and "The
   land, raised". So past the hero's hex and the two rings round it the 5-mile columns give way to the land itself -- every eighth of a mile at its own
   height (the hex map's own ground and fractal), its colour the mean of its four 330 ft grounds (the finest paint, else THE FILL's: data/world-fine.bin,
   baked by tools/world-build.py), lit by its own slope from the north-west -- and the hero's nineteen hexes stand as today's columns with today's tops.
   Drawn a screen column at a time from the near edge back (a height map's painter: each spot fills from its top down to what nearer ground already
   covers), at the coarsest eighth, quarter, half or whole mile the zoom still shows a pixel of. The roads, the rivers and the places lie on the land and
   hide behind its ridges; a click finds the hex under the pixel. */
'use strict';
(function () {
  var D = window.D16 = window.D16 || {}, W = D.world; if (!W) return;
  var F = W.FINE = { on: false, st: null, err: null, LIT: 9, RINGS: 2 }; // (st: null, 'loading', 'ok', 'fail'; LIT: the slopes' exaggeration in the light; RINGS: his "two rings")
  var G = null, SQ3 = Math.sqrt(3);
  F.live = function () { return F.on && F.st === 'ok' && !!G && !!W.M(); };
  F.load = function () {
    if (F.st) return; F.st = 'loading';
    if (typeof DecompressionStream !== 'function' || typeof fetch !== 'function') { F.st = 'fail'; F.err = 'this browser cannot unpack it'; return; }
    fetch('data/world-fine.bin', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('data/world-fine.bin: ' + r.status); return new Response(r.body.pipeThrough(new DecompressionStream('deflate'))).arrayBuffer(); })
      .then(function (ab) { var t0 = Date.now(); G = unpack(ab); G.ms = Date.now() - t0; F.st = 'ok'; F.key = ''; })
      .catch(function (e) { F.st = 'fail'; F.err = String(e && e.message || e); });
  };

  // ---------------------------------------------------------------- the file, unpacked: the 330 ft grounds, the heights, and a pyramid of eighth, quarter, half and whole miles
  function rgbOf(s) { var m = /^rgb\((\d+),(\d+),(\d+)\)$/.exec(s); return m ? [+m[1], +m[2], +m[3]] : [200, 0, 200]; }
  function pack(r, g, b) { return (255 << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0; }
  function unpack(ab) {
    var dv = new DataView(ab), hl = dv.getUint32(0, true), hd = JSON.parse(new TextDecoder().decode(new Uint8Array(ab, 4, hl))), o = 4 + hl, M = W.M();
    var n = hd.w * hd.h, hn = hd.hw * hd.hh, T = new Uint8Array(ab, o, n), lo = new Uint8Array(ab, o + n, hn), hi = new Uint8Array(ab, o + n + hn, hn), H = new Float32Array(hn);
    for (var j = 0; j < hd.hh; j++) { var s = 0; for (var i = 0; i < hd.hw; i++) { var k = i + j * hd.hw, d = lo[k] | hi[k] << 8; if (d & 0x8000) d -= 0x10000; s += d; H[k] = s; } }
    // each eighth of a mile's colour: its four grounds' (the hex map's toneRGB, as THE LOOK's), lit by the eighth's own slope, snowed where high
    var base = hd.keys.map(function (k) { return M.col[k] || [90, 82, 68]; }), water = hd.keys.map(function (k) { return k === 'sea' || k === 'lake'; }), woods = hd.keys.indexOf('woods');
    var hw = hd.hw, hh = hd.hh, ds = hd.mi * hd.hs, kk = F.LIT / 5280, C = new Uint32Array(hn), CW = new Uint32Array(hn), WF = new Float32Array(hn), hs = hd.hs, w = hd.w, n4 = hs * hs;
    var dap = function (i, j) { var h = (Math.imul(i, 73856093) ^ Math.imul(j, 19349663)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h % 1000) / 1000 - 0.5; }; // (a wood's canopy, dappled)
    for (var y = 0; y < hh; y++) for (var x = 0; x < hw; x++) {
      var i0 = x + y * hw, xa = Math.max(0, x - 1), xb = Math.min(hw - 1, x + 1), ya = Math.max(0, y - 1), yb = Math.min(hh - 1, y + 1);
      var gx = (H[xb + y * hw] - H[xa + y * hw]) / ((xb - xa) * ds), gy = (H[x + yb * hw] - H[x + ya * hw]) / ((yb - ya) * ds);
      var nl = Math.sqrt(gx * gx * kk * kk + gy * gy * kk * kk + 1), sl = Math.max(0.42, Math.min(1.4, (0.503 * gx * kk + 0.503 * gy * kk + 0.704) / nl / 0.704));
      var r = 0, g = 0, b = 0, wr = 0, wg = 0, wb = 0, land = 0, nw0 = 0;
      for (var b2 = 0; b2 < hs; b2++) for (var a2 = 0; a2 < hs; a2++) {
        var t = T[x * hs + a2 + (y * hs + b2) * w], ti = t & 127, c = base[ti] || base[0], m = sl, cr = c[0], cg = c[1], cb = c[2];
        if (water[ti]) m = 1;
        else { land++; if (t & 128) { cr = cr * 0.5 + 35; cg = cg * 0.5 + 66; cb = cb * 0.5 + 64; m = 0.9 + (sl - 1) * 0.3; } else if (ti === woods) nw0++; } // (a thin sheet of water on the ground)
        r += cr * m; g += cg * m; b += cb * m;
        if (water[ti]) { wr += cr * 0.8; wg += cg * 0.8; wb += cb * 0.8; } else { wr += (cr * 0.6 + 92 * 0.4) * 0.72; wg += (cg * 0.6 + 74 * 0.4) * 0.72; wb += (cb * 0.6 + 56 * 0.4) * 0.72; } // (its face where the ground drops away: a column's wall)
      }
      r /= n4; g /= n4; b /= n4;
      var sn = land ? Math.max(0, Math.min(0.75, (H[i0] - 7000) / 2600)) * land / n4 : 0;
      if (sn) { r += (236 - r) * sn; g += (238 - g) * sn; b += (246 - b) * sn; }
      C[i0] = pack(Math.min(255, r), Math.min(255, g), Math.min(255, b)); CW[i0] = pack(wr / n4, wg / n4, wb / n4); WF[i0] = nw0 / n4;
    }
    var L = [{ ds: ds, w: hw, h: hh, H: H, C: C, CW: CW, WF: WF }];
    var mean4 = function (A, q0, q1, q2, q3) { var cs = [A[q0], A[q1], A[q2], A[q3]], rr = 0, gg = 0, bb = 0; for (var ci = 0; ci < 4; ci++) { rr += cs[ci] & 255; gg += cs[ci] >> 8 & 255; bb += cs[ci] >> 16 & 255; } return pack(rr >> 2, gg >> 2, bb >> 2); };
    while (L.length < 4) { // (each a quarter the cells: the mean of four heights, the mean of four colours)
      var p = L[L.length - 1], nw = p.w >> 1, nh = p.h >> 1, NH = new Float32Array(nw * nh), NC = new Uint32Array(nw * nh), NW = new Uint32Array(nw * nh), NF = new Float32Array(nw * nh);
      for (var y2 = 0; y2 < nh; y2++) for (var x2 = 0; x2 < nw; x2++) {
        var q0 = 2 * x2 + 2 * y2 * p.w, q1 = q0 + 1, q2 = q0 + p.w, q3 = q2 + 1, o2 = x2 + y2 * nw;
        NH[o2] = (p.H[q0] + p.H[q1] + p.H[q2] + p.H[q3]) / 4; NC[o2] = mean4(p.C, q0, q1, q2, q3); NW[o2] = mean4(p.CW, q0, q1, q2, q3); NF[o2] = (p.WF[q0] + p.WF[q1] + p.WF[q2] + p.WF[q3]) / 4;
      }
      L.push({ ds: p.ds * 2, w: nw, h: nh, H: NH, C: NC, CW: NW, WF: NF });
    }
    L.forEach(function (lv, li) { // (then each level's woods dappled on its own cells, so the canopy reads at every zoom)
      for (var o3 = 0; o3 < lv.C.length; o3++) { var f = lv.WF[o3]; if (!f) continue; var m3 = 1 + 0.34 * f * dap(o3 % lv.w + li * 7919, (o3 / lv.w | 0) + li * 104729), c3 = lv.C[o3]; lv.C[o3] = pack(Math.min(255, (c3 & 255) * m3), Math.min(255, (c3 >> 8 & 255) * m3), Math.min(255, (c3 >> 16 & 255) * m3)); }
    });
    // which world hex each cell's middle lies in (none: the dark past the map's edge, as THE WORLD draws it)
    var qs = [1e9, -1e9], rs = [1e9, -1e9]; Object.keys(M.hex).forEach(function (k2) { var e = M.hex[k2]; qs[0] = Math.min(qs[0], e.q); qs[1] = Math.max(qs[1], e.q); rs[0] = Math.min(rs[0], e.r); rs[1] = Math.max(rs[1], e.r); });
    var qn = qs[1] - qs[0] + 1, IN = new Uint8Array(qn * (rs[1] - rs[0] + 1));
    Object.keys(M.hex).forEach(function (k3) { var e = M.hex[k3]; IN[(e.q - qs[0]) + (e.r - rs[0]) * qn] = 1; });
    var inWorld = function (x, y) { var a = W.hexOf(x, y), qi = a[0] - qs[0], ri = a[1] - rs[0]; return qi >= 0 && ri >= 0 && qi < qn && ri <= rs[1] - rs[0] && IN[qi + ri * qn] === 1; };
    var hmin = 1e9, hmax = -1e9; for (var hi2 = 0; hi2 < hn; hi2++) { if (H[hi2] < hmin) hmin = H[hi2]; if (H[hi2] > hmax) hmax = H[hi2]; }
    L.forEach(function (lv) { lv.IN = new Uint8Array(lv.w * lv.h); for (var y3 = 0; y3 < lv.h; y3++) for (var x3 = 0; x3 < lv.w; x3++) if (inWorld(hd.x0 + (x3 + 0.5) * lv.ds, hd.y0 + (y3 + 0.5) * lv.ds)) lv.IN[x3 + y3 * lv.w] = 1; });
    return { hd: hd, T: T, L: L, x0: hd.x0, y0: hd.y0, hmin: hmin, hmax: hmax };
  }

  // ---------------------------------------------------------------- the hero's hexes: the hex the party stands on and its two rings, today's columns
  var NEAR = {}, NEARAT = '', NEARC = [0, 0];
  function nearOf(at) {
    var k = at[0] + ',' + at[1]; if (k === NEARAT) return NEAR;
    NEAR = {}; NEARAT = k; NEARC = W.hc(at[0], at[1]); var M = W.M(), R = F.RINGS;
    for (var dr = -R; dr <= R; dr++) for (var dq = -R; dq <= R; dq++) { if (Math.abs(dq + dr) > R) continue; var e = M.hex[(at[0] + dq) + ',' + (at[1] + dr)]; if (e) NEAR[e.q + ',' + e.r] = e; }
    return NEAR;
  }
  function nearAt(x, y) { // (the near hex a point lies in, or null)
    if (Math.abs(x - NEARC[0]) > 14 || Math.abs(y - NEARC[1]) > 14) return null;
    var a = W.hexOf(x, y); return NEAR[a[0] + ',' + a[1]] || null;
  }
  var LOOKPX = null; // today's tops: THE LOOK's pixels (data/world-look.png), as W.drawWorld lays them
  function lookPx() {
    var L = W.lookImg && W.lookImg(), mL = W.M().look; if (!L || !L.ok || !mL || L.v !== mL.v) return null;
    if (LOOKPX && LOOKPX.v === L.v) return LOOKPX;
    var c = document.createElement('canvas'); c.width = mL.w; c.height = mL.h; var g = c.getContext('2d'); g.drawImage(L.img, 0, 0);
    LOOKPX = { v: L.v, m: mL, d: new Uint32Array(g.getImageData(0, 0, mL.w, mL.h).data.buffer) }; return LOOKPX;
  }
  var TONES = {}; // (a near hex's top where THE LOOK has not come, and its two south walls, packed)
  function tonesOf(e) {
    var k = e.q + ',' + e.r; if (TONES[k]) return TONES[k];
    var t = [W.tone(e, e.t === 'sea' || e.t === 'lake' ? 1 : e.lit), W.tone(e, 0.62, true), W.tone(e, 0.82, true)].map(function (s) { var c = rgbOf(s); return pack(c[0], c[1], c[2]); });
    return (TONES[k] = t);
  }

  // ---------------------------------------------------------------- the land, drawn
  var CV = null, IMG = null, BUF = null, DEPTH = null, LASTCAM = null;
  function level(cam) { var fy = 1 / (cam.z * W.TILT), lv = G.L[0]; for (var i = 0; i < G.L.length; i++) if (G.L[i].ds <= fy * 1.001) lv = G.L[i]; return lv; }
  function render(cam, at) {
    var Wd = cam.W, Hd = cam.H;
    if (!CV || CV.width !== Wd || CV.height !== Hd) { CV = document.createElement('canvas'); CV.width = Wd; CV.height = Hd; IMG = CV.getContext('2d').createImageData(Wd, Hd); BUF = new Uint32Array(IMG.data.buffer); DEPTH = new Float32Array(Wd * Hd); }
    var M = W.M(), near = nearOf(at), lp = lookPx(), lv = level(cam), ds = lv.ds, zy = cam.z * W.TILT, rise = cam.z * cam.E / 5280, BG = pack(0x1b, 0x24, 0x33);
    BUF.fill(BG); DEPTH.fill(NaN);
    var ySouth = cam.cy + (Hd / 2 + Math.max(G.hmax, 0) * rise) / zy + ds, yNorth = cam.cy - (Hd / 2 - Math.min(G.hmin, 0) * rise) / zy - ds;
    var j0 = Math.min(lv.h - 1, Math.floor((ySouth - G.y0) / ds)), j1 = Math.max(0, Math.floor((yNorth - G.y0) / ds)), topLen = Math.max(1, Math.ceil(ds * zy));
    for (var sx = 0; sx < Wd; sx++) {
      var gx = cam.cx + (sx + 0.5 - Wd / 2) / cam.z, ci = Math.floor((gx - G.x0) / ds); if (ci < 0 || ci >= lv.w) continue;
      var ybuf = Hd, nearCol = Math.abs(gx - NEARC[0]) <= 14, edge = true;
      for (var cj = j0; cj >= j1 && ybuf > 0; cj--) {
        var k = ci + cj * lv.w; if (!lv.IN[k]) { edge = true; continue; }
        var gy = G.y0 + (cj + 0.5) * ds, e = nearCol ? nearAt(gx, gy) : null, h, col, wall = 0;
        if (e) { // a hex of the hero's: its column, today's top on it and its south walls under it
          h = e.h; var tn = tonesOf(e); wall = gx > W.hc(e.q, e.r)[0] ? tn[1] : tn[2];
          if (lp && e.t !== 'sea' && e.t !== 'lake') { var lx = Math.floor((gx - lp.m.x0) / lp.m.mi), ly = Math.floor((gy - lp.m.y0) / lp.m.mi); col = lx >= 0 && ly >= 0 && lx < lp.m.w && ly < lp.m.h ? lp.d[lx + ly * lp.m.w] : tn[0]; }
          else col = tn[0];
        } else { h = lv.H[k]; col = lv.C[k]; wall = lv.CW[k]; }
        if (edge) { ybuf = Math.min(ybuf, Math.ceil((gy + ds / 2 - cam.cy) * zy + Hd / 2 - (Math.min(0, h) - 400) * rise)); edge = false; } // (the world's edge: a wall down to 400 ft under the sea, as THE WORLD's edge columns)
        var top = Math.ceil((gy - cam.cy) * zy + Hd / 2 - h * rise); if (top >= ybuf) continue;
        var py0 = Math.max(0, top), pyT = Math.min(ybuf, top + topLen + (e ? 0 : 1)); // (the land's face starts a pixel lower: a gentle rise keeps its own light)
        for (var py = py0; py < ybuf; py++) { var o = py * Wd + sx; BUF[o] = wall && py >= pyT ? wall : col; DEPTH[o] = gy; }
        ybuf = py0;
      }
    }
    CV.getContext('2d').putImageData(IMG, 0, 0);
  }
  // the far woods' trees: today's tops carry a hex's few by the hex; the land carries them by its own ground -- a tree on a scatter about ten pixels
  // apart wherever the 330 ft ground under it is woods, north to south, each hidden where nearer ground covers its foot
  function hash2(i, j, s) { var h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function trees(g, cam, hexW) {
    var s = cam.z * hexW / 30, hd = G.hd, wi = hd.keys.indexOf('woods'), L0 = G.L[0]; if (s < 0.45 || wi < 0) return;
    var sp = 10 / cam.z, zy = cam.z * W.TILT, th = Math.max(3, Math.round(6 * s)), x0 = cam.cx - cam.W / 2 / cam.z - sp, x1 = cam.cx + cam.W / 2 / cam.z + sp, y0 = cam.cy - cam.H / 2 / zy - sp, y1 = cam.cy + (cam.H / 2 + Math.max(0, G.hmax) * cam.E / 5280 * cam.z) / zy + sp;
    for (var j = Math.floor(y0 / sp); j <= Math.ceil(y1 / sp); j++) for (var i = Math.floor(x0 / sp); i <= Math.ceil(x1 / sp); i++) {
      var x = (i + 0.1 + 0.8 * hash2(i, j, 11)) * sp, y = (j + 0.1 + 0.8 * hash2(i, j, 12)) * sp, ti = Math.floor((x - G.x0) / hd.mi), tj = Math.floor((y - G.y0) / hd.mi);
      if (ti < 0 || tj < 0 || ti >= hd.w || tj >= hd.h || (G.T[ti + tj * hd.w] & 127) !== wi || !L0.IN[(ti / hd.hs | 0) + (tj / hd.hs | 0) * L0.w] || nearAt(x, y)) continue;
      var p = W.proj(cam, x, y, F.groundH(x, y)), px = Math.round(p[0]), py = Math.round(p[1]); if (px < -8 || px > cam.W + 8 || py < 0 || py >= cam.H) continue;
      var d = DEPTH[py * cam.W + Math.max(0, Math.min(cam.W - 1, px))]; if (d !== d || d > y + 0.4) continue; // (its foot behind nearer ground)
      g.fillStyle = '#3a2410'; g.fillRect(px, py - 1, 1, 2); g.fillStyle = hash2(i, j, 13) < 0.5 ? '#2f5a2a' : '#3d6e30';
      g.beginPath(); g.moveTo(px + 0.5, py - th); g.lineTo(px + 0.5 + th * 0.45, py); g.lineTo(px + 0.5 - th * 0.45, py); g.closePath(); g.fill();
    }
  }
  F.draw = function (g, cam, hi, at) {
    var M = W.M(), key = [cam.cx, cam.cy, cam.z, cam.W, cam.H, at[0], at[1], !!lookPx(), F.LIT].join('|');
    if (key !== F.key) { var t0 = performance.now(); render(cam, at); F.key = key; F.ms = performance.now() - t0; }
    LASTCAM = cam; g.drawImage(CV, 0, 0);
    trees(g, cam, M.w);
    // the hero's hexes as today: their outlines when the zoom is close, their decorations, north to south; and the way and the pointer's hex on any hex
    var near = nearOf(at), ks = Object.keys(near).sort(function (a, b) { return near[a].r - near[b].r || near[a].q - near[b].q; }), w = M.w, outline = w * cam.z >= 22;
    var polyAt = function (e, drape) {
      var c = W.hc(e.q, e.r), P = [];
      for (var i = 0; i < 6; i++) {
        var A = W.HCO[i], B = W.HCO[(i + 1) % 6], n = drape ? 4 : 1;
        for (var s = 0; s < n; s++) { var x = c[0] + (A[0] + (B[0] - A[0]) * s / n) * w, y = c[1] + (A[1] + (B[1] - A[1]) * s / n) * w; P.push(W.proj(cam, x, y, drape ? F.groundH(x, y) : e.h)); }
      }
      g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (var j = 1; j < P.length; j++) g.lineTo(P[j][0], P[j][1]); g.closePath(); return P;
    };
    ks.forEach(function (k) {
      var e = near[k], c = W.hc(e.q, e.r), P = W.HCO.map(function (o) { return W.proj(cam, c[0] + o[0] * w, c[1] + o[1] * w, e.h); });
      if (outline) { polyAt(e, false); g.strokeStyle = 'rgba(20,12,6,.3)'; g.lineWidth = 0.6; g.stroke(); }
      if (W.decorate) W.decorate(g, cam, e, c, P);
    });
    if (hi) Object.keys(hi).forEach(function (k) { var e = M.hex[k]; if (!e) return; polyAt(e, !near[k]); g.strokeStyle = hi[k]; g.lineWidth = 1.5; g.stroke(); });
  };
  // the ground's height at a point (a hero's hex: its column's top), for the roads, the places and the pointer
  F.groundH = function (x, y) {
    var e = nearAt(x, y); if (e) return e.h;
    var lv = G.L[0], fx = (x - G.x0) / lv.ds - 0.5, fy = (y - G.y0) / lv.ds - 0.5, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
    var cl = function (a, n) { return a < 0 ? 0 : a >= n ? n - 1 : a; }, I0 = cl(i, lv.w), I1 = cl(i + 1, lv.w), J0 = cl(j, lv.h) * lv.w, J1 = cl(j + 1, lv.h) * lv.w;
    return (lv.H[J0 + I0] * (1 - u) + lv.H[J0 + I1] * u) * (1 - v) + (lv.H[J1 + I0] * (1 - u) + lv.H[J1 + I1] * u) * v;
  };
  // a point on the ground is seen unless ground two miles and more nearer covers its pixel (the drawn land keeps, for each pixel, how far north the
  // ground that drew it lies): a ridge hides the road beyond it, but a river in its own cut, or a road over a rise, still reads
  F.HIDE = 2;
  F.vis = function (s, y) {
    if (!DEPTH || !LASTCAM) return true; var px = Math.round(s[0]), py = Math.round(s[1]); if (px < 0 || py < 0 || px >= LASTCAM.W || py >= LASTCAM.H) return true;
    var d = DEPTH[py * LASTCAM.W + px]; return d !== d || d <= y + Math.max(F.HIDE, 3 * level(LASTCAM).ds);
  };
  F.pick = function (mx, my) { // the hex under the pointer's pixel
    if (!DEPTH || !LASTCAM) return null; var px = Math.floor(mx), py = Math.floor(my); if (px < 0 || py < 0 || px >= LASTCAM.W || py >= LASTCAM.H) return null;
    var d = DEPTH[py * LASTCAM.W + px]; if (d !== d) return null;
    return W.hexOf(LASTCAM.cx + (px + 0.5 - LASTCAM.W / 2) / LASTCAM.z, d);
  };
  F.data = function () { return G; }; // (for the seat's probes)
  F.label = function () { return F.st === 'fail' ? 'THE 330 FT LAND: ' + F.err : F.st !== 'ok' ? 'THE 330 FT LAND: unpacking...' : F.on ? 'THE 330 FT LAND (a trial)  F: today\'s tops' : 'TODAY\'S TOPS  F: the 330 ft land (a trial)'; };
})();
