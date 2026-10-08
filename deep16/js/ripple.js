/* DEEP16 -- the mirror ripple, drawn in code over a figure's frame (10-08, Griz: "I was thinking of trying to have him ripple mirrors - see the way
   people described the first movie Mystique's transformation. Various obviously more than a gnoll if you live through seeing him that long"; and
   of the made gnoll, "a good test bed for the coded ripple effect (like down his mane or something, as he's a lesser fella)").
   The effect as Mystique's makers describe it: a moving edge crosses the body, the skin bunching just ahead of it, and at the edge each scale
   flips on its own, so the change happens on the side you can't see -- never a flat wipe. Here: a wave runs along a region of the frame (the
   mane, found by the sheet's own colours; or the whole figure), the fur just ahead of it lifting into the light; at its edge the pixels turn
   into small mirror scales, two pixels square, each flipping on its own beat (a little noise on each): edge-on (a dark line), face-on (a mirror
   showing the tones round him, a glint on the brightest), edge-on again, then fur. The tones are what the mirrors show -- the map's colours,
   passed by the caller (the game: the floor's ramp under him; tools/sheet-play.html: a palette ramp by name); a sheet's colours are baked, so
   the reflection is the code's. Read off the frame's own pixels, as js/looks.js LK.knit reads the troll's hide. No game dependencies:
   tools/sheet-play.html loads this file as it is (&ripple=mane); the game loads it before js/looks.js, whose LK.ripple decides who ripples,
   when, and what the mirrors show (the floor under the figure, read off the canvas). */
'use strict';
(function () {
  var R = window.RIPPLE = {};
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  R.hex = hex;
  // the regions a ripple can run along: the made gnoll's mane is the palette's dark silver (deep16/palette.json silver 0-3, the colours his
  // cutter snapped it to); 'body' is the whole figure but its outline (Mr. Ripples, when his sheet comes)
  R.REGIONS = {
    mane: { cols: ['#14171e', '#20252f', '#313846', '#475061'].map(hex), top: true },
    body: { cols: null }
  };
  var CACHE = {}, cv = null;
  function near(c, r, g, b) { return Math.abs(c[0] - r) + Math.abs(c[1] - g) + Math.abs(c[2] - b) < 10; }
  function hash(x, y) { var n = (x * 374761393 + y * 668265263) | 0; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
  // a frame's region as scales: [{ x, y (the scale's top left, frame pixels), o (0..1 along the wave's line, its start at the region's top
  // end), v (0..1 top to bottom of the region), j (its own beat's offset), px: [[x, y, r, g, b]...] its pixels }], cached by key; null if too small
  function scales(img, sx, sy, w, h, which, key) {
    if (CACHE[key] !== undefined) return CACHE[key];
    if (!img || !(img.naturalWidth || img.width)) return null; // (not cached: the sheet is still on its way; a canvas is a frame too -- the roper's recoloured stone)
    if (!cv) cv = document.createElement('canvas');
    cv.width = w; cv.height = h; var x = cv.getContext('2d', { willReadFrequently: true }), d;
    x.clearRect(0, 0, w, h); x.drawImage(img, sx, sy, w, h, 0, 0, w, h);
    try { d = x.getImageData(0, 0, w, h).data; } catch (e) { return (CACHE[key] = null); }
    var reg = R.REGIONS[which] || R.REGIONS.body, pts = [], X, Y, ftop = h;
    for (Y = 0; Y < h; Y++) for (X = 0; X < w; X++) {
      var k = (Y * w + X) * 4, r = d[k], g = d[k + 1], b = d[k + 2];
      if (d[k + 3] < 200) continue;
      if (Y < ftop) ftop = Y; // (the figure's top: where its mane should start)
      var on = reg.cols ? reg.cols.some(function (c) { return near(c, r, g, b); }) : !(r < 16 && g < 16 && b < 24);
      if (on) pts.push([X, Y, r, g, b]);
    }
    if (pts.length < 12) return (CACHE[key] = null);
    if (reg.top) { // (the mane's colours shade his dark arms and legs too: of the stretches of them -- a one-pixel gap bridged -- keep the one that
      // scores best, its size less twice how far below the figure's top it starts. The topmost alone picked the arm he throws overhead in the
      // Pounce's leap (frames 3 and 4, every facing: the harbinger, 10-08); the largest, nudged up, is the mane in every frame of his sheet)
      var at = {}, seen = {}, best = null, bestSc = -1e9;
      pts.forEach(function (p, k) { at[p[0] + ',' + p[1]] = k; });
      for (var s0 = 0; s0 < pts.length; s0++) {
        if (seen[s0]) continue;
        var queue = [s0], keep = [], ymin = h; seen[s0] = 1;
        while (queue.length) {
          var q = pts[queue.pop()]; keep.push(q); if (q[1] < ymin) ymin = q[1];
          for (var oy = -2; oy <= 2; oy++) for (var ox = -2; ox <= 2; ox++) { var nk = at[(q[0] + ox) + ',' + (q[1] + oy)]; if (nk != null && !seen[nk]) { seen[nk] = 1; queue.push(nk); } }
        }
        var sc = keep.length - 2 * (ymin - ftop); if (sc > bestSc) { bestSc = sc; best = keep; }
      }
      pts = best || [];
      if (pts.length < 12) return (CACHE[key] = null);
    }
    // the region's long line (its principal axis, as LK.knit finds a body's), the wave's start at the end that stands higher
    var cx = 0, cy = 0, xx = 0, yy = 0, xy = 0, i;
    pts.forEach(function (p) { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length;
    pts.forEach(function (p) { var dx = p[0] - cx, dy = p[1] - cy; xx += dx * dx; yy += dy * dy; xy += dx * dy; });
    var ang = 0.5 * Math.atan2(2 * xy, xx - yy), ux = Math.cos(ang), uy = Math.sin(ang);
    var t = pts.map(function (p) { return (p[0] - cx) * ux + (p[1] - cy) * uy; }), t0 = Math.min.apply(null, t), t1 = Math.max.apply(null, t);
    var span = Math.max(1, t1 - t0), ya = 0, na = 0, yb = 0, nb = 0, y0 = h, y1 = 0;
    for (i = 0; i < pts.length; i++) {
      var f = (t[i] - t0) / span; if (f < 0.15) { ya += pts[i][1]; na++; } else if (f > 0.85) { yb += pts[i][1]; nb++; }
      if (pts[i][1] < y0) y0 = pts[i][1]; if (pts[i][1] > y1) y1 = pts[i][1];
    }
    var flip = na && nb && ya / na > yb / nb; // (the low end first? then run it the other way: down from the top)
    var cells = {}, out = [];
    for (i = 0; i < pts.length; i++) {
      var p = pts[i], ck = (p[0] >> 1) + ',' + (p[1] >> 1), c = cells[ck];
      if (!c) { c = cells[ck] = { x: p[0] & ~1, y: p[1] & ~1, o: 0, n: 0, px: [] }; out.push(c); }
      var o = (t[i] - t0) / span; c.o += flip ? 1 - o : o; c.n++; c.px.push(p);
    }
    out.forEach(function (c) { c.o /= c.n; c.v = (c.y - y0) / Math.max(1, y1 - y0); c.j = (hash(c.x, c.y) - 0.5) * 0.28; c.k = hash(c.y + 7, c.x + 3); }); // (its own beat, and its own tilt)
    return (CACHE[key] = out);
  }
  R.scales = scales;
  // where the wave is at time ms, on a cycle: a pass of `dur` ms every `every` ms (-0.5 .. 1.6 along the line while it runs, so the last
  // scale has turned back by its end), null between
  R.phase = function (ms, every, dur) { var q = ((ms % every) + every) % every; return q < dur ? -0.5 + 2.1 * q / dur : null; };
  // draw it: ctx at scale Z (1 in the game, the zoom in the sheet player), the frame's top left at (dx, dy) in ctx pixels.
  // o: { s (the wave, from R.phase), band (its width along the line, 0.36), tones ([[r,g,b]...] dark to light: what the mirrors show) }
  R.draw = function (ctx, img, sx, sy, w, h, dx, dy, Z, which, key, o) {
    if (o.s == null) return;
    var sc = scales(img, sx, sy, w, h, which, key); if (!sc) return;
    var band = o.band || 0.36, tones = o.tones && o.tones.length ? o.tones : R.SILVER, n = tones.length;
    var col = function (c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')'; };
    var put = function (x, y, c, a) { ctx.fillStyle = col(c, a); ctx.fillRect(dx + x * Z, dy + y * Z, Z, Z); };
    var DARK = [10, 8, 16], GLINT = [252, 252, 244];
    ctx.save();
    sc.forEach(function (c) {
      var u = (o.s - c.o - c.j) / band;
      if (u < -0.5 || u >= 1) return;
      if (u < 0) { // just ahead of the edge: the fur bunches up and lifts, its top edge raised a pixel into the light
        var lift = 1 + u / 0.5;
        c.px.forEach(function (p) { if ((p[1] & 1) === 0) put(p[0], p[1] - 1, [Math.min(255, p[2] + 48), Math.min(255, p[3] + 48), Math.min(255, p[4] + 54)], 0.7 * lift); });
        return;
      }
      // the scale turning, each at its own tilt (c.k): edge-on (0.1-0.26: a thin line, one rim catching the light), its mirror face (0.26-0.74),
      // edge-on again (0.74-0.9), then fur. What the face shows: the light above for the higher scales, the floor for the lower, tipped by its tilt
      var ti = Math.max(0, Math.min(n - 1, Math.round((1 - c.v) * (n - 1) * 0.7 + (c.k - 0.5) * (n - 1) * 0.7 + (n - 1) * 0.15))), lo = tones[Math.max(0, ti - 2)];
      c.px.forEach(function (p) {
        var top = (p[1] & 1) === 0, left = (p[0] & 1) === 0;
        if ((u >= 0.1 && u < 0.26) || (u >= 0.74 && u < 0.9)) { put(p[0], p[1], top ? (left === (u < 0.5) ? tones[n - 1] : DARK) : DARK); return; }
        if (u >= 0.26 && u < 0.74) {
          put(p[0], p[1], top ? tones[Math.min(n - 1, ti + 1)] : (left ? tones[ti] : lo));
          if (top && left && u > 0.4 && u < 0.6 && c.k > 0.72) put(p[0], p[1], GLINT, 0.95); // (a glint: the scales tipped toward the light, at their flattest)
        }
      });
    });
    ctx.restore();
  };
  // the mirrors with nothing passed: the palette's silver (deep16/palette.json)
  R.SILVER = ['#14171e', '#20252f', '#313846', '#475061', '#636e82', '#8a96aa', '#b8c3d4'].map(hex);
})();
