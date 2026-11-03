/* DEEP16 — THE FINE LAND (10-21 night, the world map seat; a trial behind deep16/?world&fine till 10-22, when his "The 330 ft land, raised is best" made it
   THE WORLD's look by default -- F.start below; F switches to the hex tops, the choice kept). Griz: "Rather than shading the tops of the big hexes, can we actually draw the 330
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
  // THE LAND BY DEFAULT (10-22, his verdict on the trial: "The 330 ft land, raised is best"): THE WORLD opens on it, in the game and on the bare door alike; F switches to
  // the hex tops and back, the choice kept (F.KEY); &tops opens on the tops, &fine on the land. Where the file cannot come (a page opened from the disk: the benches') the
  // hex tops draw, as before
  F.KEY = 'deep16.world.land';
  F.start = function (q) {
    var s = (q || '') + (typeof location !== 'undefined' ? location.search : '');
    F.asked = /[?&]fine\b/.test(s); F.on = /[?&]tops\b/.test(s) ? false : F.asked ? true : (D.store && D.store.get(F.KEY)) !== 'tops';
    if (F.on) F.load(); return F.on;
  };
  F.flip = function () { F.on = !F.on; if (F.on) F.load(); if (D.store) D.store.set(F.KEY, F.on ? 'land' : 'tops'); return F.on; };
  F.showLabel = function (since) { return (F.on && F.st === 'loading') || (F.st === 'fail' && F.asked) || since < 150; }; // (since: frames since F)
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
    var dv = new DataView(ab), hl = dv.getUint32(0, true), hd = JSON.parse(new TextDecoder().decode(new Uint8Array(ab, 4, hl))), o = 4 + hl, M = W.Mworld ? W.Mworld() : W.M(); // (THE WORLD's hexes say where the land is, whichever map the party is on)
    var n = hd.w * hd.h, hn = hd.hw * hd.hh, T = new Uint8Array(ab, o, n), lo = new Uint8Array(ab, o + n, hn), hi = new Uint8Array(ab, o + n + hn, hn), H = new Float32Array(hn);
    for (var j = 0; j < hd.hh; j++) { var s = 0; for (var i = 0; i < hd.hw; i++) { var k = i + j * hd.hw, d = lo[k] | hi[k] << 8; if (d & 0x8000) d -= 0x10000; s += d; H[k] = s; } }
    // each eighth of a mile's colour: its four grounds' (the hex map's toneRGB, as THE LOOK's), lit by the eighth's own slope, snowed where high
    var base = hd.keys.map(function (k) { return M.col[k] || [90, 82, 68]; }), water = hd.keys.map(function (k) { return k === 'sea' || k === 'lake'; }), woods = hd.keys.indexOf('woods');
    var hw = hd.hw, hh = hd.hh, ds = hd.mi * hd.hs, kk = F.LIT / 5280, C = new Uint32Array(hn), CW = new Uint32Array(hn), WF = new Float32Array(hn), SL = new Float32Array(hn), hs = hd.hs, w = hd.w, n4 = hs * hs;
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
      C[i0] = pack(Math.min(255, r), Math.min(255, g), Math.min(255, b)); CW[i0] = pack(wr / n4, wg / n4, wb / n4); WF[i0] = nw0 / n4; SL[i0] = sl;
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
    var inWorld = function (x, y) { var a = (W.worldHexOf || W.hexOf)(x, y), qi = a[0] - qs[0], ri = a[1] - rs[0]; return qi >= 0 && ri >= 0 && qi < qn && ri <= rs[1] - rs[0] && IN[qi + ri * qn] === 1; };
    var hmin = 1e9, hmax = -1e9; for (var hi2 = 0; hi2 < hn; hi2++) { if (H[hi2] < hmin) hmin = H[hi2]; if (H[hi2] > hmax) hmax = H[hi2]; }
    L.forEach(function (lv) { lv.IN = new Uint8Array(lv.w * lv.h); for (var y3 = 0; y3 < lv.h; y3++) for (var x3 = 0; x3 < lv.w; x3++) if (inWorld(hd.x0 + (x3 + 0.5) * lv.ds, hd.y0 + (y3 + 0.5) * lv.ds)) lv.IN[x3 + y3 * lv.w] = 1; });
    return { hd: hd, T: T, L: L, x0: hd.x0, y0: hd.y0, hmin: hmin, hmax: hmax, SL: SL, base: base, water: water, woods: woods, dap: dap };
  }
  // THE CLOSER ZOOM (10-21 night, his add: "build that alternate at one zoom closer as well"): one step past THE WORLD's nearest (12 px a mile), only while the
  // land is drawn; there a 330 ft ground is about a pixel, so each is drawn as itself -- its own colour, lit by its eighth of a mile's slope, at the height
  // between the eighths' (a wood's canopy dappled 330 ft by 330 ft)
  F.ZOOMS = W.ZOOMS.concat([17]);
  function colour16(i, j, k0, h) {
    var t = G.T[i + j * G.hd.w], ti = t & 127, c = G.base[ti] || G.base[0], sl = G.SL[k0], m = sl, r = c[0], g = c[1], b = c[2];
    if (G.water[ti]) m = 1;
    else if (t & 128) { r = r * 0.5 + 35; g = g * 0.5 + 66; b = b * 0.5 + 64; m = 0.9 + (sl - 1) * 0.3; }
    else if (ti === G.woods) m *= 1 + 0.3 * G.dap(i, j);
    r *= m; g *= m; b *= m;
    var sn = G.water[ti] ? 0 : Math.max(0, Math.min(0.75, (h - 7000) / 2600)); if (sn) { r += (236 - r) * sn; g += (238 - g) * sn; b += (246 - b) * sn; }
    return pack(Math.min(255, r), Math.min(255, g), Math.min(255, b));
  }

  // ---------------------------------------------------------------- the hero's hexes: the hex the party stands on and its two rings, today's columns
  // the rings shrink as the camera comes in (10-28, the maps window; his "5 - do 40 and 56 variant", on the seat's lean): two rings to 28 px a mile, one at 40,
  // the party's own hex alone at 56 -- so his 330 ft paint shows up to the party at the area's closest zooms
  // and at the area's closest zoom none (11-03, his "The two rings thing would ideally bring them to this level of zoom as they approached locations", on the seat's
  // "the party's own hex is about 40% of the screen tall, so it has to be drawn as land as well"): the party's hex the land too, the banner on the ground
  F.ringsAt = function (z) { return W.M() && W.M().near && W.closeZ && z >= W.closeZ() - 0.01 ? -1 : z > 40 ? 0 : z > 28 ? 1 : F.RINGS; };
  var NEAR = {}, NEARAT = '', NEARC = [0, 0];
  function nearOf(at, R) {
    var k = W.M().key + ':' + at[0] + ',' + at[1] + ':' + R; if (k === NEARAT) return NEAR; // (keyed by the map too: THE WORLD's or the Silverton area's; and the rings)
    NEAR = {}; NEARAT = k; NEARC = W.hc(at[0], at[1]); var M = W.M();
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
    var k = W.M().key + ':' + e.q + ',' + e.r; if (TONES[k]) return TONES[k];
    var t = [W.tone(e, e.t === 'sea' || e.t === 'lake' ? 1 : e.lit), W.tone(e, 0.62, true), W.tone(e, 0.82, true)].map(function (s) { var c = rgbOf(s); return pack(c[0], c[1], c[2]); });
    return (TONES[k] = t);
  }

  // ---------------------------------------------------------------- the land, drawn
  var CV = null, IMG = null, BUF = null, DEPTH = null, LASTCAM = null;
  function level(cam) { var fy = 1 / (cam.z * W.TILT), lv = G.L[0]; for (var i = 0; i < G.L.length; i++) if (G.L[i].ds <= fy * 1.001) lv = G.L[i]; return lv; }
  function render(cam, at, c0, c1) { // (c0, c1: only these columns drawn again -- the party's rings moved, nothing else)
    var Wd = cam.W, Hd = cam.H, part = c0 != null;
    if (!CV || CV.width !== Wd || CV.height !== Hd) { CV = document.createElement('canvas'); CV.width = Wd; CV.height = Hd; IMG = CV.getContext('2d').createImageData(Wd, Hd); BUF = new Uint32Array(IMG.data.buffer); DEPTH = new Float32Array(Wd * Hd); }
    var M = W.M(), near = nearOf(at, F.ringsAt(cam.z)), lp = lookPx(), zy = cam.z * W.TILT, rise = cam.z * cam.E / 5280, BG = pack(0x1b, 0x24, 0x33);
    var f16 = 1 / zy < G.L[0].ds * 0.8, lv = f16 ? G.L[0] : level(cam), ds = f16 ? G.hd.mi : lv.ds, gw = f16 ? G.hd.w : lv.w, gh = f16 ? G.hd.h : lv.h; // (f16: THE CLOSER ZOOM, the 330 ft grounds themselves)
    if (!part) { BUF.fill(BG); DEPTH.fill(NaN); c0 = 0; c1 = Wd; } else { c0 = Math.max(0, c0); c1 = Math.min(Wd, c1); for (var py0c = 0; py0c < Hd; py0c++) { var o0 = py0c * Wd; for (var cx0 = c0; cx0 < c1; cx0++) { BUF[o0 + cx0] = BG; DEPTH[o0 + cx0] = NaN; } } }
    var ySouth = cam.cy + (Hd / 2 + Math.max(G.hmax, 0) * rise) / zy + ds, yNorth = cam.cy - (Hd / 2 - Math.min(G.hmin, 0) * rise) / zy - ds;
    var j0 = Math.min(gh - 1, Math.floor((ySouth - G.y0) / ds)), j1 = Math.max(0, Math.floor((yNorth - G.y0) / ds)), topLen = Math.max(1, Math.ceil(ds * zy));
    for (var sx = c0; sx < c1; sx++) {
      var gx = cam.cx + (sx + 0.5 - Wd / 2) / cam.z, ci = Math.floor((gx - G.x0) / ds); if (ci < 0 || ci >= gw) continue;
      var ybuf = Hd, nearCol = Math.abs(gx - NEARC[0]) <= 14, edge = true;
      for (var cj = j0; cj >= j1 && ybuf > 0; cj--) {
        var k = f16 ? (ci >> 1) + (cj >> 1) * lv.w : ci + cj * lv.w; if (!lv.IN[k]) { edge = true; continue; }
        var gy = G.y0 + (cj + 0.5) * ds, e = nearCol ? nearAt(gx, gy) : null, h, col, wall = 0;
        if (e) { // a hex of the hero's: its column, today's top on it and its south walls under it
          h = e.h; var tn = tonesOf(e); wall = gx > W.hc(e.q, e.r)[0] ? tn[1] : tn[2];
          if (lp && e.t !== 'sea' && e.t !== 'lake') { var lx = Math.floor((gx - lp.m.x0) / lp.m.mi), ly = Math.floor((gy - lp.m.y0) / lp.m.mi); col = lx >= 0 && ly >= 0 && lx < lp.m.w && ly < lp.m.h ? lp.d[lx + ly * lp.m.w] : tn[0]; }
          else col = tn[0];
        } else if (f16) { h = hL0(gx, gy); col = 0; wall = lv.CW[k]; } // (its colour only if it is drawn, below)
        else { h = lv.H[k]; col = lv.C[k]; wall = lv.CW[k]; }
        if (edge) { ybuf = Math.min(ybuf, Math.ceil((gy + ds / 2 - cam.cy) * zy + Hd / 2 - (Math.min(0, h) - 400) * rise)); edge = false; } // (the world's edge: a wall down to 400 ft under the sea, as THE WORLD's edge columns)
        var top = Math.ceil((gy - cam.cy) * zy + Hd / 2 - h * rise); if (top >= ybuf) continue;
        if (f16 && !e) col = colour16(ci, cj, k, h);
        var py0 = Math.max(0, top), pyT = Math.min(ybuf, top + topLen + (e ? 0 : 1)); // (the land's face starts a pixel lower: a gentle rise keeps its own light)
        for (var py = py0; py < ybuf; py++) { var o = py * Wd + sx; BUF[o] = wall && py >= pyT ? wall : col; DEPTH[o] = gy; }
        ybuf = py0;
      }
    }
    if (c1 > c0) CV.getContext('2d').putImageData(IMG, 0, 0, c0, 0, c1 - c0, Hd);
  }
  // the far woods' trees: today's tops carry a hex's few by the hex; the land carries them by its own ground -- a tree on a scatter about ten pixels
  // apart wherever the 330 ft ground under it is woods, north to south, each hidden where nearer ground covers its foot
  function hash2(i, j, s) { var h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function th0(s) { return Math.max(3, Math.min(13, Math.round(6 * s))); } // (a tree's height: today's tops', no taller than THE WORLD's nearest zoom draws them)
  function trees(g, cam, hexW) {
    var s = cam.z * hexW / 30, hd = G.hd, wi = hd.keys.indexOf('woods'), L0 = G.L[0]; if (s < 0.45 || wi < 0) return;
    var sp = Math.max(10, th0(s)) / cam.z, zy = cam.z * W.TILT, th = th0(s), x0 = cam.cx - cam.W / 2 / cam.z - sp, x1 = cam.cx + cam.W / 2 / cam.z + sp, y0 = cam.cy - cam.H / 2 / zy - sp, y1 = cam.cy + (cam.H / 2 + Math.max(0, G.hmax) * cam.E / 5280 * cam.z) / zy + sp;
    for (var j = Math.floor(y0 / sp); j <= Math.ceil(y1 / sp); j++) for (var i = Math.floor(x0 / sp); i <= Math.ceil(x1 / sp); i++) {
      var x = (i + 0.1 + 0.8 * hash2(i, j, 11)) * sp, y = (j + 0.1 + 0.8 * hash2(i, j, 12)) * sp, ti = Math.floor((x - G.x0) / hd.mi), tj = Math.floor((y - G.y0) / hd.mi);
      if (ti < 0 || tj < 0 || ti >= hd.w || tj >= hd.h || (G.T[ti + tj * hd.w] & 127) !== wi || !L0.IN[(ti / hd.hs | 0) + (tj / hd.hs | 0) * L0.w] || nearAt(x, y)) continue;
      var p = W.proj(cam, x, y, F.groundH(x, y)), px = Math.round(p[0]), py = Math.round(p[1]); if (px < -8 || px > cam.W + 8 || py < 0 || py >= cam.H) continue;
      var d = depthAt(Math.max(0, Math.min(cam.W - 1, px)), py); if (d !== d || d > y + 0.4) continue; // (its foot behind nearer ground)
      g.fillStyle = '#3a2410'; g.fillRect(px, py - 1, 1, 2); g.fillStyle = hash2(i, j, 13) < 0.5 ? '#2f5a2a' : '#3d6e30';
      g.beginPath(); g.moveTo(px + 0.5, py - th); g.lineTo(px + 0.5 + th * 0.45, py); g.lineTo(px + 0.5 - th * 0.45, py); g.closePath(); g.fill();
    }
  }
  // THE BUILT SQUARES (11-03, the hex map and world session; his note 25, "enter worldmap at maximum zoom if leaving location + attempt code draw of structures
  // appropriate scale to maximum zoom (only at maximum zoom)"; then "the edifice is the bundle at the top marked town, the hex building is the hex marked town, and
  // the curved row of town hexes is my estimate of town size based on 330' hexes as measuring tool"; "Yes to all leans, lets see what comes out"): at the area's
  // closest zoom only, drawn by code on the land from his 330 ft paint (data/world.js `built`, every hex he painted town or farmland, by its key). Round a city or a
  // town: the block of his town hexes its mark stands on is its keep (Silverton's the Edifice, a glass roof against the mountain), a lone one a landmark (the Hex,
  // glowing hexagonal in the valley), any longer run its stockade, and roofs fill the ground between them. Farmland is furrowed, a farmhouse on some. A place with
  // none of his squares has its kind's: tents at a camp, a headframe at the Galleries' mouth, the inn, a signpost at a junction. Each stands on the ground at its
  // own height, hidden where nearer ground covers its foot, drawn north to south; F.lights puts their windows and fires on after the sky at night
  var BLT = null, HD6 = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  function hc16(w, q, r) { return [w * (q + r / 2), w * SQ3 / 2 * r]; }
  function hullOf(P) { // (the convex hull, monotone chain)
    var p = P.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; }), cr = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }, lo = [], up = [];
    p.forEach(function (q) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
    for (var i = p.length - 1; i >= 0; i--) { var q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    lo.pop(); up.pop(); return lo.concat(up);
  }
  function inHull(H, x, y) { if (H.length < 3) return false; for (var i = 0; i < H.length; i++) { var a = H[i], b = H[(i + 1) % H.length]; if ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) < -1e-9) return false; } return true; }
  function builtPlan() {
    var M = W.M(), B = D.WORLD && D.WORLD.built; if (!M || !B) return null;
    if (BLT && BLT.key === M.key) return BLT;
    var w = B.mi, T = {}, items = [], gH = function (x, y) { return G ? F.groundH(x, y) : 0; }; // (no land unpacked -- the benches' page -- no heights: the plan alone)
    (B.town || []).forEach(function (p) { T[p[0] + ',' + p[1]] = 1; });
    var seen = {}, comps = [];
    Object.keys(T).forEach(function (k) { // (his town hexes in blocks: the six neighbours)
      if (seen[k]) return; var c = [], st = [k]; seen[k] = 1;
      while (st.length) { var a = st.pop(), qr = a.split(',').map(Number); c.push(qr); HD6.forEach(function (d) { var n = (qr[0] + d[0]) + ',' + (qr[1] + d[1]); if (T[n] && !seen[n]) { seen[n] = 1; st.push(n); } }); }
      comps.push(c.map(function (qr) { return { q: qr[0], r: qr[1], c: hc16(w, qr[0], qr[1]) }; }));
    });
    var used = {};
    (M.sites || []).forEach(function (s) {
      if (!/^(city|town|hamlet)$/.test(s.kind)) return;
      var tw = s.town || [s.x, s.y], mine = comps.filter(function (c) { return c.some(function (h) { return Math.hypot(h.c[0] - tw[0], h.c[1] - tw[1]) < 1.6 || Math.hypot(h.c[0] - s.x, h.c[1] - s.y) < 1.6; }); });
      if (!mine.length) return;
      var dm = function (c) { return Math.min.apply(null, c.map(function (h) { return Math.hypot(h.c[0] - s.x, h.c[1] - s.y); })); };
      var keep = mine.filter(function (c) { return c.length >= 3; }).sort(function (a, b) { return dm(a) - dm(b); })[0]; if (keep && dm(keep) > 0.25) keep = null;
      var all = [], hs = [];
      mine.forEach(function (c) {
        c.forEach(function (h) { all.push(h.c); used[h.q + ',' + h.r] = 1; hs.push(gH(h.c[0], h.c[1])); });
        if (c === keep) items.push({ y: Math.min.apply(null, c.map(function (h) { return h.c[1]; })), k: 'keep', hexes: c, id: s.id });
        else if (c.length === 1) items.push({ y: c[0].c[1], k: 'landmark', h: c[0], id: s.id });
        else items.push({ y: Math.min.apply(null, c.map(function (h) { return h.c[1]; })), k: 'wall', hexes: c });
      });
      hs.sort(function (a, b) { return a - b; }); var h0 = hs[hs.length >> 1], H = hullOf(all);
      var xs = all.map(function (p) { return p[0]; }), ys = all.map(function (p) { return p[1]; }), r0 = Math.floor(Math.min.apply(null, ys) / (w * SQ3 / 2)) - 1, r1 = Math.ceil(Math.max.apply(null, ys) / (w * SQ3 / 2)) + 1;
      for (var r = r0; r <= r1; r++) for (var q = Math.floor(Math.min.apply(null, xs) / w - r / 2) - 1; q <= Math.ceil(Math.max.apply(null, xs) / w - r / 2) + 1; q++) {
        var k = q + ',' + r, c = hc16(w, q, r); if (T[k] || !inHull(H, c[0], c[1])) continue;
        if (gH(c[0], c[1]) > h0 + 300) continue; // (the town on its own ground: not up the slopes the hull crosses)
        items.push({ y: c[1], k: 'roofs', c: c, q: q, r: r });
      }
    });
    (B.farms || []).forEach(function (p) { var c = hc16(w, p[0], p[1]); items.push({ y: c[1], k: 'field', c: c, q: p[0], r: p[1] }); });
    Object.keys(T).forEach(function (k) { if (used[k]) return; var qr = k.split(',').map(Number), c = hc16(w, qr[0], qr[1]); items.push({ y: c[1], k: 'roofs', c: c, q: qr[0], r: qr[1] }); }); // (his town hexes far from any town: roofs)
    var hasPlan = {}; items.forEach(function (it) { if (it.id) hasPlan[it.id] = 1; });
    (M.sites || []).forEach(function (s) { // (a place with none of his squares: its kind's)
      if (hasPlan[s.id]) return;
      var k = s.id === 'mouth' ? 'headframe' : s.id === 'warrens' || s.id === 'glowseep' ? 'camp' : s.kind === 'inn' ? 'inn' : s.kind === 'junction' ? 'sign' : /^(town|hamlet|city)$/.test(s.kind) ? 'hamlet' : s.kind === 'castle' ? 'keepS' : s.kind === 'cave' ? 'cave' : s.kind === 'school' || s.kind === 'seat' ? 'tower' : null;
      if (k) items.push({ y: s.y, k: k, c: [s.x, s.y], id: s.id });
    });
    items.sort(function (a, b) { return a.y - b.y; });
    var ids = {}; items.forEach(function (it) { if (it.id) ids[it.id] = 1; });
    BLT = { key: M.key, w: w, items: items, ids: ids }; return BLT;
  }
  F.builtPlan = builtPlan; // (for the seat's probes)
  F.drawnIds = function (cam) { if (!F.live() || F.ringsAt(cam.z) >= 0) return null; var P = builtPlan(); return P ? P.ids : null; }; // (the places whose own buildings stand for their icons)
  function gp(cam, x, y) { return W.proj(cam, x, y, F.groundH(x, y)); }
  function seen(cam, p, y) { return p[0] > -24 && p[0] < cam.W + 24 && p[1] > -24 && p[1] < cam.H + 40 && F.vis(p, y); }
  function hexPts(cam, c, w, lift) { var gh = F.groundH(c[0], c[1]); return W.HCO.map(function (o) { var p = W.proj(cam, c[0] + o[0] * w, c[1] + o[1] * w, gh); return [p[0], p[1] - lift]; }); }
  function poly(g, P, fill) { g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1]); g.closePath(); g.fillStyle = fill; g.fill(); }
  function block(g, cam, c, w, lift, top, wallE, wallW) { // (a raised hex: its two south walls, then its top)
    var G0 = hexPts(cam, c, w, 0), G1 = hexPts(cam, c, w, lift);
    poly(g, [G0[0], G0[1], G1[1], G1[0]], wallE); poly(g, [G0[1], G0[2], G1[2], G1[1]], wallW); poly(g, G1, top); return G1;
  }
  function house(g, x, y, s, roof) { var bw = Math.max(2, Math.round(3 * s)), bh = Math.max(1, Math.round(2 * s)); g.fillStyle = '#d8ccb0'; g.fillRect(x - (bw >> 1), y - bh, bw, bh); g.fillStyle = roof; g.fillRect(x - (bw >> 1) - 1, y - bh - Math.max(1, Math.round(s)), bw + 2, Math.max(1, Math.round(s))); }
  var ROOFS = ['#a8442e', '#8a3a2a', '#6a5a48', '#94503a'];
  F.built = function (g, cam) {
    var P = builtPlan(); if (!P) return 0; var w = P.w, s = Math.max(0.8, Math.min(3, cam.z / 69)), n = 0;
    P.items.forEach(function (it) {
      var c = it.c || (it.h && it.h.c) || it.hexes[0].c, p0 = gp(cam, c[0], c[1]);
      if (it.k === 'keep') { // the Edifice: one raised slab of stone across his squares, its roof glass, two spires on its north side
        var vis = it.hexes.some(function (h) { return seen(cam, gp(cam, h.c[0], h.c[1]), h.c[1]); }); if (!vis) return;
        var hx = it.hexes.slice().sort(function (a, b) { return a.c[1] - b.c[1] || a.c[0] - b.c[0]; }), lift = Math.round(5 * s);
        hx.forEach(function (h, i) { var T2 = block(g, cam, h.c, w * 1.02, lift, (h.q + h.r) & 1 ? '#9ccfe0' : '#86bcd2', '#8a7f6c', '#a89c86'); if (i % 3 === 0) { g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(Math.round(T2[4][0]), Math.round(T2[4][1] + 1), 1, 1); } });
        var nw = hx[0], ne = hx.filter(function (h) { return h.c[1] === nw.c[1]; }).pop();
        [nw, ne].forEach(function (h) { var q = gp(cam, h.c[0], h.c[1]), x = Math.round(q[0]), y = Math.round(q[1]) - lift, th = Math.round(7 * s); g.fillStyle = '#a89c86'; g.fillRect(x - 1, y - th, 2, th); g.fillStyle = '#5a6a78'; g.beginPath(); g.moveTo(x - 2, y - th); g.lineTo(x, y - th - Math.round(3 * s)); g.lineTo(x + 2, y - th); g.closePath(); g.fill(); });
        n++; return;
      }
      if (it.k === 'wall') { // the stockade along his run of squares: posts and the rail between neighbours
        var ks = {}; it.hexes.forEach(function (h) { ks[h.q + ',' + h.r] = h; });
        g.strokeStyle = '#5a3a1a'; g.lineWidth = 1;
        it.hexes.forEach(function (h) {
          var a = gp(cam, h.c[0], h.c[1]); if (!seen(cam, a, h.c[1])) return;
          HD6.slice(0, 3).forEach(function (d) { var o = ks[(h.q + d[0]) + ',' + (h.r + d[1])]; if (!o) return; var b = gp(cam, o.c[0], o.c[1]); g.beginPath(); g.moveTo(a[0], a[1] - 1.5 * s); g.lineTo(b[0], b[1] - 1.5 * s); g.stroke(); });
          g.fillStyle = '#4a2e14'; g.fillRect(Math.round(a[0]), Math.round(a[1] - 3 * s), 1, Math.max(2, Math.round(3 * s))); n++;
        });
        return;
      }
      if (!seen(cam, p0, c[1])) return; n++;
      var x = Math.round(p0[0]), y = Math.round(p0[1]), hh2 = hash2(it.q || Math.round(c[0] * 100), it.r || Math.round(c[1] * 100), 31);
      if (it.k === 'landmark') { // the Hex: a hexagonal hall, its walls warm and lit
        var T3 = block(g, cam, c, w * 0.9, Math.round(6 * s), '#7a4a2a', '#b07a40', '#c89a5a');
        g.fillStyle = '#ffd86a'; var gq = hexPts(cam, c, w * 0.9, 0); for (var i = 0; i < 3; i++) { var u = (i + 0.5) / 3, wx = gq[0][0] + (gq[2][0] - gq[0][0]) * u, wy = Math.max(gq[0][1], gq[2][1]) - 3 * s; g.fillRect(Math.round(wx), Math.round(wy), 1, 1); }
        g.fillStyle = 'rgba(255,200,90,.18)'; g.beginPath(); g.arc(x, y - 3 * s, 6 * s, 0, 7); g.fill();
      } else if (it.k === 'roofs') { var nh = hh2 < 0.15 ? 0 : hh2 < 0.6 ? 1 : 2; for (var j = 0; j < nh; j++) { var ox = (hash2(it.q, it.r, 40 + j) - 0.5) * w * 0.7, oy = (hash2(it.q, it.r, 50 + j) - 0.5) * w * 0.6, hp = gp(cam, c[0] + ox, c[1] + oy); house(g, Math.round(hp[0]), Math.round(hp[1]), s, ROOFS[(hash2(it.q, it.r, 60 + j) * 4) | 0]); } }
      else if (it.k === 'field') { // furrows across the square; a farmhouse on some
        g.strokeStyle = 'rgba(110,80,36,.6)'; g.lineWidth = 1; var fw = w * 0.42, sl = hash2(it.q, it.r, 70) < 0.5 ? 0.25 : -0.25;
        for (var f = -1; f <= 1; f++) { var a1 = gp(cam, c[0] - fw, c[1] + f * w * 0.24 - sl * fw), b1 = gp(cam, c[0] + fw, c[1] + f * w * 0.24 + sl * fw); g.beginPath(); g.moveTo(a1[0], a1[1]); g.lineTo(b1[0], b1[1]); g.stroke(); }
        if (hh2 < 0.22) { house(g, x, y, s, '#8a2a1a'); }
      } else if (it.k === 'camp') { for (var t = 0; t < 3; t++) { var tx = x + Math.round((t - 1) * 5 * s), ty = y + (t === 1 ? -2 : 0), tw2 = Math.round(2 * s) + 1; g.fillStyle = '#d8ccb0'; g.beginPath(); g.moveTo(tx - tw2, ty); g.lineTo(tx, ty - Math.round(3 * s) - 1); g.lineTo(tx + tw2, ty); g.closePath(); g.fill(); g.fillStyle = '#3a2410'; g.fillRect(tx, ty - 1, 1, 1); } g.fillStyle = '#ff9a3a'; g.fillRect(x, y + 2, 1, 1); }
      else if (it.k === 'headframe') { var hf = Math.round(7 * s); g.fillStyle = '#1a1410'; g.fillRect(x - 2, y - 2, 4, 2); g.strokeStyle = '#5a3a1a'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x, y - hf); g.lineTo(x + 3, y); g.moveTo(x - 2, y - hf / 2); g.lineTo(x + 2, y - hf / 2); g.stroke(); g.beginPath(); g.arc(x, y - hf, Math.max(1.5, 1.5 * s), 0, 7); g.stroke(); }
      else if (it.k === 'cave') { g.fillStyle = '#1a1410'; g.beginPath(); g.arc(x, y, Math.max(1.5, 2 * s), Math.PI, 0); g.fill(); }
      else if (it.k === 'inn') { house(g, x - 2, y, s * 1.4, '#6a3a22'); house(g, x + 3, y + 1, s, '#6a5a48'); g.fillStyle = '#ffd86a'; g.fillRect(x - 2, y - 1, 1, 1); g.fillStyle = '#5a3a1a'; g.fillRect(x + 6, y - 4, 1, 4); }
      else if (it.k === 'sign') { g.fillStyle = '#5a3a1a'; g.fillRect(x, y - 4, 1, 4); g.fillRect(x - 1, y - 4, 3, 1); }
      else if (it.k === 'hamlet') { for (var m2 = 0; m2 < 4; m2++) { var hp2 = gp(cam, c[0] + (hash2(m2, 7, 80) - 0.5) * w * 3, c[1] + (hash2(m2, 7, 81) - 0.5) * w * 2); house(g, Math.round(hp2[0]), Math.round(hp2[1]), s, ROOFS[m2 & 3]); } }
      else if (it.k === 'keepS' || it.k === 'tower') { var kt = Math.round((it.k === 'keepS' ? 7 : 5) * s); g.fillStyle = '#8a7f6c'; g.fillRect(x - 2, y - kt, 4, kt); g.fillStyle = '#5a6a78'; g.fillRect(x - 3, y - kt - 1, 6, 1); }
    });
    return n;
  };
  F.lights = function (g, cam, tod) { // (after the sky: windows and fires at night, the Hex aglow)
    if (!(tod === 'night' || tod === 'dusk' || tod === 'dawn')) return; var P = builtPlan(); if (!P) return; var w = P.w, s = Math.max(0.8, Math.min(3, cam.z / 69));
    P.items.forEach(function (it) {
      var c = it.c || (it.h && it.h.c); if (!c) return; var p0 = gp(cam, c[0], c[1]); if (!seen(cam, p0, c[1])) return; var x = Math.round(p0[0]), y = Math.round(p0[1]);
      if (it.k === 'landmark') { g.fillStyle = 'rgba(255,190,80,.35)'; g.beginPath(); g.arc(x, y - 3 * s, 7 * s, 0, 7); g.fill(); g.fillStyle = '#ffe08a'; g.fillRect(x - 1, y - Math.round(3 * s), 3, 1); }
      else if (it.k === 'roofs' && hash2(it.q, it.r, 90) < 0.45) { g.fillStyle = '#ffd86a'; g.fillRect(x, y - 1, 1, 1); }
      else if (it.k === 'camp' || it.k === 'inn') { g.fillStyle = 'rgba(255,150,60,.4)'; g.beginPath(); g.arc(x, y + 1, 3 * s, 0, 7); g.fill(); g.fillStyle = '#ffb04a'; g.fillRect(x, y + 1, 1, 1); }
    });
  };
  // THE LAND SLID (10-22, when it became the default look: a walk moved the camera every frame and the land was drawn again each time -- 18 ms a frame at the
  // opening zoom in the pane, 66 at the closest): a camera's move is the picture's own shift, so the land is drawn F.MARGIN px wider all round and slid under the
  // screen, drawn again only past the margin, at another zoom, or when the party's hex (the rings) changes. RC: the camera it was drawn for; OX, OY: its offset
  F.MARGIN = 48; var RC = null, OX = 0, OY = 0;
  function depthAt(sx, sy) { var x = sx - OX, y = sy - OY; return RC && x >= 0 && y >= 0 && x < RC.W && y < RC.H ? DEPTH[y * RC.W + x] : NaN; }
  F.draw = function (g, cam, hi, at) {
    var M = W.M(), m = F.MARGIN, key = [W.M().key, cam.z, cam.W, cam.H, cam.E, !!lookPx(), F.LIT].join('|'), atk = at[0] + ',' + at[1], ox = RC ? (RC.cx - cam.cx) * cam.z : 0, oy = RC ? (RC.cy - cam.cy) * cam.z * W.TILT : 0;
    if (key !== F.key || !RC || Math.abs(ox) > m - 1 || Math.abs(oy) > m - 1) { var t0 = performance.now(); RC = { cx: cam.cx, cy: cam.cy, z: cam.z, W: cam.W + 2 * m, H: cam.H + 2 * m, E: cam.E }; render(RC, at); F.key = key; F.atk = atk; F.ms = performance.now() - t0; F.renders = (F.renders || 0) + 1; ox = oy = 0; }
    else if (atk !== F.atk && F.ringsAt(cam.z) < 0) F.atk = atk; // (no rings at the closest zoom: the land is the same under any hex of the party's)
    else if (atk !== F.atk) { // (the party a hex on: only the columns its rings stood in and stand in now -- each screen column is drawn whole, so the rest stand as they were)
      var t1 = performance.now(), c0x = NEARC[0], half = (F.ringsAt(cam.z) + 1) * M.w, cn = W.hc(at[0], at[1])[0], lo = Math.min(c0x, cn) - half, hi2 = Math.max(c0x, cn) + half;
      render(RC, at, Math.floor((lo - RC.cx) * RC.z + RC.W / 2) - 1, Math.ceil((hi2 - RC.cx) * RC.z + RC.W / 2) + 1); F.atk = atk; F.ms = performance.now() - t1; F.parts = (F.parts || 0) + 1;
    }
    OX = Math.round(ox) - m; OY = Math.round(oy) - m;
    LASTCAM = cam; g.drawImage(CV, OX, OY);
    trees(g, cam, W.Mworld ? W.Mworld().w : M.w); // (the land's trees at THE WORLD's scale on either map; the built squares after the roads and rivers, World.draw)
    // the hero's hexes as today: their outlines when the zoom is close, their decorations, north to south; and the way and the pointer's hex on any hex
    var near = nearOf(at, F.ringsAt(cam.z)), ks = Object.keys(near).sort(function (a, b) { return near[a].r - near[b].r || near[a].q - near[b].q; }), w = M.w, outline = w * cam.z >= 22;
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
  F.groundH = function (x, y) { var e = nearAt(x, y); return e ? e.h : hL0(x, y); };
  function hL0(x, y) { // (the eighths' heights, between them)
    var lv = G.L[0], fx = (x - G.x0) / lv.ds - 0.5, fy = (y - G.y0) / lv.ds - 0.5, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
    var nw = lv.w - 1, nh = lv.h - 1, I0 = i < 0 ? 0 : i > nw ? nw : i, I1 = i + 1 < 0 ? 0 : i + 1 > nw ? nw : i + 1, J0 = (j < 0 ? 0 : j > nh ? nh : j) * lv.w, J1 = (j + 1 < 0 ? 0 : j + 1 > nh ? nh : j + 1) * lv.w;
    return (lv.H[J0 + I0] * (1 - u) + lv.H[J0 + I1] * u) * (1 - v) + (lv.H[J1 + I0] * (1 - u) + lv.H[J1 + I1] * u) * v;
  };
  // a point on the ground is seen unless ground two miles and more nearer covers its pixel (the drawn land keeps, for each pixel, how far north the
  // ground that drew it lies): a ridge hides the road beyond it, but a river in its own cut, or a road over a rise, still reads
  F.HIDE = 2;
  F.vis = function (s, y) {
    if (!DEPTH || !LASTCAM) return true; var px = Math.round(s[0]), py = Math.round(s[1]); if (px < 0 || py < 0 || px >= LASTCAM.W || py >= LASTCAM.H) return true;
    var d = depthAt(px, py); return d !== d || d <= y + Math.max(F.HIDE, 3 * level(LASTCAM).ds);
  };
  F.pick = function (mx, my) { // the hex under the pointer's pixel
    if (!DEPTH || !LASTCAM) return null; var px = Math.floor(mx), py = Math.floor(my); if (px < 0 || py < 0 || px >= LASTCAM.W || py >= LASTCAM.H) return null;
    var d = depthAt(px, py); if (d !== d) return null;
    return W.hexOf(LASTCAM.cx + (px + 0.5 - LASTCAM.W / 2) / LASTCAM.z, d);
  };
  F.data = function () { return G; }; // (for the seat's probes)
  F.label = function () { return !F.on ? 'THE HEX TOPS  F: the land, raised' : F.st === 'fail' ? 'THE LAND: ' + F.err : F.st !== 'ok' ? 'THE LAND, RAISED: unpacking...' : 'THE LAND, RAISED  F: the hex tops'; };
})();
