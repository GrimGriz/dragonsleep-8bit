/* DEEP16 — iso: the dimetric 2:1 projection (Diablo's angle), the map, the baked floor, rock walls cut on the near side,
   painter's order by (gx + gy) then gz, the camera, and picking a square under the mouse.
   World grid -> world pixels:  x = (gx - gy) * TW/2,  y = (gx + gy) * TH/2 - gz   (TW 64, TH 32 at 1x). */
'use strict';
(function () {
  var D = window.D16;
  var TW = 64, TH = 32, HW = TW / 2, HH = TH / 2;
  var WALL = 84;       // how far a far wall rises above the floor it faces (px) before it goes into the dark
  var STUB = 9;        // the near walls, cut: Diablo's trick, so the room is seen through them
  var iso = D.iso = { TW: TW, TH: TH };

  // square centre in world pixels (the rhombus's middle), at elevation gz
  iso.center = function (gx, gy, gz) { return { x: (gx - gy) * HW, y: (gx + gy) * HH + HH - (gz || 0) }; };
  iso.toScreen = function (wx, wy) { return { x: Math.round(wx - iso.cam.x + D.W / 2), y: Math.round(wy - iso.cam.y + D.H / 2) }; };
  iso.cam = { x: 0, y: 0 };

  // ------------------------------------------------------------------ palette (from palette.js, generated from palette.json)
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  iso.ramp = function (name) { return D.PAL.ramps[name].map(hex); };

  // ------------------------------------------------------------------ noise (value noise, seeded per map), Bayer dither
  function h2(x, y, s) { var h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(x, y, s) {
    var x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = h2(x0, y0, s), b = h2(x0 + 1, y0, s), c = h2(x0, y0 + 1, s), d = h2(x0 + 1, y0 + 1, s);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function fbm(x, y, s) { return vnoise(x, y, s) * 0.55 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.15; }
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function dith(px, py) { return (BAYER[(py & 3) * 4 + (px & 3)] + 0.5) / 16; }
  // a value 0..1 onto a ramp with ordered dithering between neighbouring steps
  function rampPick(ramp, v, px, py) {
    var f = D.clamp(v, 0, 0.9999) * (ramp.length - 1), i = Math.floor(f), t = f - i;
    return ramp[Math.min(ramp.length - 1, i + (t > dith(px, py) ? 1 : 0))];
  }
  iso.noise = { vnoise: vnoise, fbm: fbm, dith: dith, rampPick: rampPick, h2: h2 };

  // ------------------------------------------------------------------ the map
  var OPEN = { '.': 1, '=': 1, 'r': 1, '~': 1, 'L': 1, '/': 1, 'P': 1, 'c': 1 };
  iso.load = function (def) {
    var m = { def: def, w: def.rows[0].length, h: def.rows.length, sq: [] };
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
      var ch = def.rows[y][x];
      m.sq.push({
        x: x, y: y, ch: ch, open: !!OPEN[ch],
        walk: !!OPEN[ch] && ch !== 'P' && ch !== 'c',
        difficult: ch === 'r' || ch === '~',
        gz: ch === 'L' ? def.step * 2 : ch === '/' ? def.step : 0,
        pillar: ch === 'P', cocoon: ch === 'c'
      });
    }
    m.at = function (x, y) { return (x < 0 || y < 0 || x >= m.w || y >= m.h) ? null : m.sq[y * m.w + x]; };
    m.isOpen = function (x, y) { var s = m.at(x, y); return !!(s && s.open); };
    m.gz = function (x, y) { var s = m.at(x, y); return s ? s.gz : 0; };
    iso.map = m;
    classifyRock(m);
    bake(m);
    buildProps(m);
    return m;
  };

  // A rock square is NEAR (cut to a stub) when open floor lies behind it, FAR (a full wall face) when open floor lies in
  // front of it, and dark filler otherwise.
  function classifyRock(m) {
    m.sq.forEach(function (s) {
      if (s.open) return;
      var x = s.x, y = s.y;
      if (m.isOpen(x - 1, y) || m.isOpen(x, y - 1) || m.isOpen(x - 1, y - 1)) s.rock = 'near';
      else if (m.isOpen(x + 1, y) || m.isOpen(x, y + 1) || m.isOpen(x + 1, y + 1)) s.rock = 'far';
      else s.rock = 'fill';
    });
  }

  // ------------------------------------------------------------------ bake: every open square rendered to its own canvas (top + the faces of a
  // raised square), composited back to front into one floor canvas. Raised squares also go in the sort as props, so a
  // wall behind the ledge can never paint over it.
  function bake(m) {
    var minX = -(m.h) * HW - HW, maxX = m.w * HW + HW, minY = -WALL - 60, maxY = (m.w + m.h) * HH + HH;
    var cv = document.createElement('canvas'); cv.width = maxX - minX; cv.height = maxY - minY;
    var ctx = cv.getContext('2d');
    var stone = iso.ramp('stone'), silver = iso.ramp('silver'), blue = iso.ramp('blue'), violet = iso.ramp('violet'), moss = iso.ramp('moss');
    var seed = D.hash(m.def.name);
    var W, H, px, sqc; // the current square's buffer
    function put(ix, iy, c) { ix -= sqc.x0; iy -= sqc.y0; if (ix < 0 || iy < 0 || ix >= W || iy >= H) return; var o = (iy * W + ix) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255; }
    // distance to the nearest rock square, for the floor's darkening at the walls
    function nearRock(gx, gy) {
      var best = 9;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
        var s = m.at(Math.floor(gx) + dx, Math.floor(gy) + dy);
        if (s && !s.open) {
          var cxs = Math.floor(gx) + dx + 0.5, cys = Math.floor(gy) + dy + 0.5;
          var d = Math.max(0, Math.max(Math.abs(gx - cxs), Math.abs(gy - cys)) - 0.5);
          if (d < best) best = d;
        }
      }
      return best;
    }
    // draw squares back to front so a raised square's faces cover the floor behind it
    var order = m.sq.filter(function (s) { return s.open; }).sort(function (a, b) { return (a.x + a.y) - (b.x + b.y) || a.gz - b.gz; });
    order.forEach(function (s) {
      var c = iso.center(s.x, s.y, s.gz), ox = c.x - minX, oy = c.y - minY;
      W = TW; H = TH + s.gz; sqc = { x0: ox - HW, y0: oy - HH };
      var sqImg = ctx.createImageData(W, H); px = sqImg.data;
      for (var dy = -HH; dy < HH; dy++) {
        var half = HW - Math.abs(dy + 0.5) * 2;
        for (var dx = -Math.floor(half); dx < half; dx++) {
          var ix = ox + dx, iy = oy + dy;
          // back to world ground coords for continuous texture
          var wx = (c.x + dx + 0.5), wy = (c.y + dy + 0.5 + s.gz);
          var gx = (wx / HW + wy / HH) / 2 - 0.5, gy = (wy / HH - wx / HW) / 2 - 0.5;
          var n = fbm(gx * 1.3, gy * 1.3, seed), fine = vnoise(gx * 9, gy * 9, seed + 3);
          var shade = 0.18 + n * 0.42 + (fine - 0.5) * 0.12;
          var rock = nearRock(gx + 0.5, gy + 0.5);
          shade -= Math.max(0, 0.9 - rock) * 0.22;             // darker where the floor meets the wall
          if (s.gz) shade += 0.08;                                // the ledge catches a little more light
          var col;
          if (s.ch === '=') {                                     // dressed stone: cold, with slab seams
            var fx = gx + 0.5 - Math.floor(gx + 0.5), fy = gy + 0.5 - Math.floor(gy + 0.5);
            var seam = fx < 0.04 || fy < 0.04 || (fx > 0.49 && fx < 0.53 && (Math.floor(gy + 0.5) % 2));
            col = seam ? silver[1] : rampPick(silver, 0.25 + n * 0.35, ix, iy);
          } else if (s.ch === '~') {                              // the still pool: black water, the cave's colour in it, a rare glint
            var edge = Math.min(nearOpen(m, gx, gy, '~'), 1);
            var sheen = vnoise(gx * 2 + 0.3, gy * 5, seed + 9), glint = h2(Math.floor(gx * 11), Math.floor(gy * 22), seed + 8) > 0.992;
            col = edge < 0.1 ? stone[2] : edge < 0.2 ? stone[1] : glint ? silver[5] : sheen > 0.8 ? violet[2] : rampPick(blue, n * 0.22 + (1 - Math.min(1, edge * 2)) * 0.12, ix, iy);
          } else {
            var crack = Math.abs(vnoise(gx * 2.2, gy * 2.2, seed + 21) - 0.5) < 0.012;
            var pebble = h2(Math.floor(gx * 14), Math.floor(gy * 14), seed + 5) > 0.985;
            var mossy = fbm(gx * 0.7, gy * 0.7, seed + 40) > 0.66 && rock < 0.6;
            col = crack ? stone[1] : pebble ? stone[6] : mossy && fine > 0.55 ? rampPick(moss, 0.3 + n * 0.4, ix, iy) : rampPick(stone, shade, ix, iy);
            if (s.ch === 'r' && fine > 0.6) col = rampPick(stone, shade + 0.18, ix, iy);
          }
          put(ix, iy, col);
        }
      }
      // the faces of a raised square, down to each lower neighbour in front of it (toward +gx and +gy)
      if (s.gz) {
        [[1, 0], [0, 1]].forEach(function (d) {
          var nz = m.isOpen(s.x + d[0], s.y + d[1]) ? m.gz(s.x + d[0], s.y + d[1]) : 0;
          var drop = s.gz - nz;
          if (drop <= 0) return;
          var right = d[0] === 1; // the +gx face shows lower-right, the +gy face lower-left
          for (var k = 0; k < HW; k++) {
            var fx0 = right ? ox + k : ox - HW + k;
            var ytop = right ? oy + HH - Math.floor(k / 2) : oy + Math.floor(k / 2);
            for (var j = 0; j < drop; j++) {
              var v = (right ? 0.32 : 0.5) + (vnoise(k * 0.3 + s.x * 9, j * 0.12, seed + 60) - 0.5) * 0.3 - (j / drop) * 0.15;
              if (j === 0) v += 0.2;
              put(fx0, ytop + j, rampPick(stone, v, fx0, ytop + j));
            }
          }
        });
      }
      var tc = document.createElement('canvas'); tc.width = W; tc.height = H;
      tc.getContext('2d').putImageData(sqImg, 0, 0);
      ctx.drawImage(tc, sqc.x0, sqc.y0);
      if (s.gz) s.tile = { canvas: tc, ax: HW, ay: HH };
    });
    m.bake = { canvas: cv, x: minX, y: minY };
  }
  function nearOpen(m, gx, gy, ch) { // distance from (gx,gy) to the edge of the region made of `ch`
    var best = 2;
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      var s = m.at(Math.floor(gx + 0.5) + dx, Math.floor(gy + 0.5) + dy);
      if (!s || s.ch !== ch) {
        var cxs = Math.floor(gx + 0.5) + dx, cys = Math.floor(gy + 0.5) + dy;
        var d = Math.max(Math.abs(gx + 0.5 - (cxs + 0.5)), Math.abs(gy + 0.5 - (cys + 0.5))) - 0.5;
        if (d < best) best = d;
      }
    }
    return Math.max(0, best);
  }

  // ------------------------------------------------------------------ props: rock walls, stalagmites, cocoons, rubble stones, as sorted objects
  function buildProps(m) {
    var seed = D.hash(m.def.name) + 77;
    m.props = [];
    m.sq.forEach(function (s) {
      if (s.rock === 'far' || s.rock === 'near') m.props.push({ kind: 'rock', sq: s, depth: s.x + s.y, gz: 0 });
      if (s.tile) m.props.push({ kind: 'tile', sq: s, depth: s.x + s.y, gz: s.gz, layer: -1, img: s.tile });
      if (s.pillar) m.props.push({ kind: 'pillar', sq: s, depth: s.x + s.y + 0.5, gz: s.gz, img: D.art.stalagmite(D.hash('p' + s.x + ',' + s.y)) });
      if (s.cocoon) m.props.push({ kind: 'cocoon', sq: s, depth: s.x + s.y + 0.5, gz: s.gz, img: D.art.cocoon(D.hash('c' + s.x + ',' + s.y)) });
      if (s.ch === 'r') {
        for (var k = 0; k < 3; k++) {
          var r = h2(s.x * 7 + k, s.y * 13, seed);
          if (r < 0.45) continue;
          var ox = (h2(s.x, s.y + k * 3, seed + 1) - 0.5) * 0.7, oy = (h2(s.x + k * 5, s.y, seed + 2) - 0.5) * 0.7;
          m.props.push({ kind: 'stone', sq: s, fx: s.x + 0.5 + ox, fy: s.y + 0.5 + oy, depth: s.x + s.y + 0.5 + ox + oy, gz: 0, img: D.art.rubble(D.hash('r' + s.x + ',' + s.y + ',' + k)) });
        }
      }
    });
    m.rockImgs = {};
  }

  // a cut stub stands a little above the highest open floor around it (so a stub beside the ledge is cut at the ledge)
  function stubTop(m, s) {
    var z = 0;
    [[-1, 0], [0, -1], [-1, -1], [1, 0], [0, 1]].forEach(function (d) { var n = m.at(s.x + d[0], s.y + d[1]); if (n && n.open) z = Math.max(z, n.gz); });
    return z + STUB;
  }
  // a rock square: the far wall's two faces rising into the dark, or the near wall cut to a stub with its section showing
  function rockCanvas(m, s) {
    var key = s.x + ',' + s.y;
    if (m.rockImgs[key]) return m.rockImgs[key];
    var stone = iso.ramp('stone'), outline = iso.ramp('outline')[0];
    var far = s.rock === 'far';
    // a face's foot: the open neighbour's floor, or the top of a cut stub in front of it; a face toward solid rock is never seen
    function foot(x, y) { var n = m.at(x, y); return !n ? null : n.open ? n.gz : n.rock === 'near' ? stubTop(m, n) : null; }
    var fR = foot(s.x + 1, s.y), fL = foot(s.x, s.y + 1);
    var top = far ? WALL + Math.max(fR || 0, fL || 0) : stubTop(m, s);
    var W = TW, H = TH + top + 2, ox = HW, oy = top + HH; // canvas-local centre of the square's ground rhombus
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var cx = cv.getContext('2d'), img = cx.createImageData(W, H), px = img.data;
    var seed = D.hash(m.def.name) + s.x * 31 + s.y * 17;
    function put(ix, iy, c, a) { if (ix < 0 || iy < 0 || ix >= W || iy >= H) return; var o = (iy * W + ix) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = a == null ? 255 : a; }
    // faces: the +gx face (lower-right) and the +gy face (lower-left), each from its neighbour's floor up to the top
    [['R', fR], ['L', fL]].forEach(function (f) {
      var right = f[0] === 'R';
      var base = far ? (f[1] == null ? (right ? fL : fR) || 0 : f[1]) : 0;
      if (far && f[1] == null) return; // a face toward more rock is never seen
      for (var k = 0; k < HW; k++) {
        var fx = right ? ox + k : ox - HW + k;
        var yb = (right ? oy + HH - Math.floor(k / 2) : oy + Math.floor(k / 2)) - base; // bottom edge of the face at this column
        var span = top - base;
        for (var j = 0; j < span; j++) {
          var y = yb - j - 1, up = j / Math.max(1, span);
          // strata: horizontal-ish bands, broken by noise; lit from the upper left
          var band = vnoise(k * 0.08 + s.x * 3.1, (y + s.y * 11) * 0.22, seed) * 0.5 + vnoise(k * 0.3, y * 0.05, seed + 4) * 0.5;
          var v = (right ? 0.26 : 0.46) + (band - 0.5) * 0.36;
          if (far) v -= Math.pow(up, 1.6) * 0.62;                 // into the dark above
          if (j === 0) v -= 0.12;                                  // the foot of the wall
          if (!far && j === span - 1) v += 0.18;                   // the cut edge catches the light
          if (v < 0.02 && far && up > 0.7) { if (dith(fx, y) < (up - 0.7) * 3) continue; }
          put(fx, y, rampPick(stone, v, fx, y));
        }
      }
    });
    // the near stub's top: the cut section, lighter, so the eye reads it as a wall cut away
    if (!far) {
      for (var dy = -HH; dy < HH; dy++) {
        var half = HW - Math.abs(dy + 0.5) * 2;
        for (var dx = -Math.floor(half); dx < half; dx++) {
          var edge = half - Math.abs(dx + 0.5) < 2;
          var v2 = 0.52 + (vnoise((dx + s.x * 64) * 0.1, (dy + s.y * 32) * 0.2, seed + 9) - 0.5) * 0.3;
          put(ox + dx, oy - top + dy, edge ? stone[2] : rampPick(stone, v2, ox + dx, oy - top + dy));
        }
      }
    }
    cx.putImageData(img, 0, 0);
    var out = { canvas: cv, ax: ox, ay: oy };
    m.rockImgs[key] = out;
    return out;
  }

  // ------------------------------------------------------------------ drawing: the floor layer, overlays, then everything sorted
  // objs: [{ depth, gz, draw(ctx) }] from the battle (units, effects); overlay(ctx) draws the grid under the sprites
  iso.draw = function (ctx, objs, overlay) {
    var m = iso.map, b = m.bake, o = iso.toScreen(b.x, b.y);
    ctx.drawImage(b.canvas, o.x, o.y);
    if (overlay) overlay(ctx);
    var list = [];
    m.props.forEach(function (p) { list.push(p); });
    (objs || []).forEach(function (p) { list.push(p); });
    list.sort(function (a, b2) { return a.depth - b2.depth || a.gz - b2.gz || (a.layer || 0) - (b2.layer || 0); });
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (p.draw) { p.draw(ctx); continue; }
      if (p.kind === 'rock') {
        var r = rockCanvas(m, p.sq), c = iso.center(p.sq.x, p.sq.y, 0), s = iso.toScreen(c.x, c.y);
        ctx.drawImage(r.canvas, s.x - r.ax, s.y - r.ay);
      } else {
        var cx = p.fx != null ? p.fx - 0.5 : p.sq.x, cy = p.fy != null ? p.fy - 0.5 : p.sq.y;
        var c2 = iso.center(cx, cy, p.gz), s2 = iso.toScreen(c2.x, c2.y);
        ctx.globalAlpha = p.alpha == null ? 1 : p.alpha;
        ctx.drawImage(p.img.canvas, s2.x - p.img.ax, s2.y - p.img.ay);
        ctx.globalAlpha = 1;
      }
    }
  };

  // a square's rhombus path at its elevation, in screen space (for the grid overlay)
  iso.rhombus = function (ctx, gx, gy, gz, inset) {
    var c = iso.center(gx, gy, gz), s = iso.toScreen(c.x, c.y), k = inset || 0;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - HH + k);
    ctx.lineTo(s.x + HW - 2 * k, s.y);
    ctx.lineTo(s.x, s.y + HH - k);
    ctx.lineTo(s.x - HW + 2 * k, s.y);
    ctx.closePath();
  };

  // the square under a screen point: test each open square's rhombus at its own height, front-most wins
  iso.pick = function (sx, sy) {
    var m = iso.map, best = null, bd = -1;
    for (var i = 0; i < m.sq.length; i++) {
      var s = m.sq[i];
      if (!s.open) continue;
      var c = iso.center(s.x, s.y, s.gz), p = iso.toScreen(c.x, c.y);
      var dx = Math.abs(sx + 0.5 - p.x), dy = Math.abs(sy + 0.5 - p.y);
      if (dx / HW + dy / HH <= 1 && s.x + s.y > bd) { bd = s.x + s.y; best = s; }
    }
    return best;
  };

  // snap the camera (16-bit games cut, they don't glide)
  iso.lookAt = function (gx, gy, gz) { var c = iso.center(gx, gy, gz || 0); iso.cam.x = Math.round(c.x); iso.cam.y = Math.round(c.y - 20); };
})();
