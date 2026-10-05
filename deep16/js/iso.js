/* DEEP16 — iso: the dimetric 2:1 projection (Diablo's angle), the map, the baked floor, rock walls cut on the near side,
   painter's order by (gx + gy) then gz, the camera, and picking a square under the mouse.
   World grid -> world pixels:  x = (gx - gy) * TW/2,  y = (gx + gy) * TH/2 - gz   (TW 64, TH 32 at 1x). */
'use strict';
(function () {
  var D = window.D16;
  var TW = 64, TH = 32, HW = TW / 2, HH = TH / 2;
  var WALL = 84;       // how far a far wall rises above the floor it faces (px) before it goes into the dark
  var STUB = 9;        // the near walls, cut: Diablo's trick, so the room is seen through them
  var iso = D.iso = { TW: TW, TH: TH, WALL: WALL };

  // square centre in world pixels (the rhombus's middle), at elevation gz
  iso.center = function (gx, gy, gz) { return { x: (gx - gy) * HW, y: (gx + gy) * HH + HH - (gz || 0) }; };
  // world pixels -> the space being drawn in. The fight draws its world at 1:1 into a canvas W/zoom wide (iso.inWorld)
  // and lays it on the screen scaled by the zoom; everything else (menus, the ring, picking, the mouse) is screen space.
  // At zoom 1 the two are the same.
  iso.zoom = 1; iso.inWorld = false;
  iso.toScreen = function (wx, wy) {
    if (iso.inWorld) return { x: Math.round(wx - iso.cam.x + D.W / iso.zoom / 2), y: Math.round(wy - iso.cam.y + D.H / iso.zoom / 2) };
    return { x: Math.round((wx - iso.cam.x) * iso.zoom + D.W / 2), y: Math.round((wy - iso.cam.y) * iso.zoom + D.H / 2) };
  };
  iso.cam = { x: 0, y: 0 };

  // ------------------------------------------------------------------ palette (from palette.js, generated from palette.json)
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  iso.ramp = function (name) { if (name === 'stone' && iso.stoneOf()) return STONES[iso.stoneOf()](); return D.PAL.ramps[name].map(hex); };
  // a map's own stone (data/maps.js `stone`, 10-01e, Griz: "approve browser recolor with new field"): its rock -- the walls, the floor,
  // the stalagmites, the cocoons' stone -- drawn in it, and a creature made of that stone (js/sprites.js S.STONE: the roper) recoloured
  // to match. None named: brown, DEEP16's stone ramp. 'slate': the silver ramp, step for step (on the palette); 'grey': each brown
  // step's own lightness with the colour drained (eight greys off the palette: it has no neutral grey ramp)
  function lum(c) { return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; }
  var STONES = {
    slate: function () { var sv = D.PAL.ramps.silver.map(hex); return D.PAL.ramps.stone.map(function (c, i, a) { return sv[Math.round(i * (sv.length - 1) / (a.length - 1))]; }); },
    grey: function () { return D.PAL.ramps.stone.map(function (c) { var l = Math.round(lum(hex(c))); return [l, l, Math.min(255, l + 3)]; }); }
  };
  iso.stoneOf = function () { var s = iso.map && iso.map.def && iso.map.def.stone; return s && STONES[s] ? s : null; };

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
  var OPEN = { '.': 1, '=': 1, 'r': 1, '~': 1, 'L': 1, '/': 1, 'P': 1, 'c': 1, ',': 1, 'g': 1, 'T': 1, 'W': 1, 'V': 1, 'k': 1, 'f': 1, 'w': 1, 'D': 1, 'y': 1 };
  // (the Settling, 09-30: D deep water, the landlord's under the fall; y a cradle, the crawler pens' timber crib. A map's `deepWater`
  // names the water nothing walks in -- grid.js lets only what lives there (bound to it, or a swimmer) in)
  // set design (09-27, Griz: "proceed with set design"): the things a square can hold that stand in the way -- not walked
  // through, half cover, like a stalagmite (grid.js names them in the cover's reason). b is a built wall: rock to the rules.
  //   ,  a road (packed dirt, rutted)   g  grass   T  a tree   W  a wagon under its cover (squares side by side make one)
  //   V  a wagon's open bed (lower; a fight's `riders` stand in it)
  //   k  a woodpile or crates   f  a rail or fence (posts and bars)   w  a well   b  a building's wall
  var STANDS = { P: 'a stalagmite', T: 'a tree', W: 'the wagon', V: 'the wagon', k: 'the woodpile', f: 'the rail', w: 'the well', y: 'the cradle' };
  iso.load = function (def) {
    var m = { def: def, w: def.rows[0].length, h: def.rows.length, sq: [] };
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
      var ch = def.rows[y][x];
      m.sq.push({
        x: x, y: y, ch: ch, open: !!OPEN[ch],
        walk: !!OPEN[ch] && ch !== 'c' && !STANDS[ch] && (def.deepWater || '').indexOf(ch) < 0, // (deep water: grid.js walkable lets its own in)
        difficult: ch === 'r' || ch === '~', deep: (def.deepWater || '').indexOf(ch) >= 0,
        gz: def.heights ? (parseInt(def.heights[y][x], 36) || 0) * def.step : ch === 'L' ? def.step * 2 : ch === '/' ? def.step : 0, // (a map's `heights`: a digit a square, in steps -- the Flooded Stair's flight, 10-02)
        pillar: !!STANDS[ch], stands: STANDS[ch] || null, cocoon: ch === 'c', tree: ch === 'T', block: 'WVkfwy'.indexOf(ch) >= 0 ? ch : null
      });
    }
    m.at = function (x, y) { return (x < 0 || y < 0 || x >= m.w || y >= m.h) ? null : m.sq[y * m.w + x]; };
    m.isOpen = function (x, y) { var s = m.at(x, y); return !!(s && s.open); };
    m.gz = function (x, y) { var s = m.at(x, y); return s ? s.gz : 0; };
    iso.map = m;
    m.maxGz = 0; m.sq.forEach(function (s) { if (s.open) m.maxGz = Math.max(m.maxGz, s.gz); }); // (the highest floor: iso.draw's bound on a far wall's picture)
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
    // an open-air map (ground: 'earth', 09-27: the road, the gnolls' country, the bridge) lays its raw floor as packed dirt
    // and grass instead of cave stone; the rock round it stands as the cutting's walls
    var earth = m.def.ground === 'earth', leather = iso.ramp('leather');
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
      // the square's own canvas: its top, and its faces down to the lower neighbours in front of it -- only as tall as the tallest face it shows (a square inside a
      // plateau shows none and is 32 px tall, not 32 + its height: the Edifice's deck was 16 MB of mostly blank canvas -- 10-04 night, the huge maps)
      var faceH = 0; if (s.gz) [[1, 0], [0, 1]].forEach(function (d) { var nz = m.isOpen(s.x + d[0], s.y + d[1]) ? m.gz(s.x + d[0], s.y + d[1]) : 0; faceH = Math.max(faceH, s.gz - nz); });
      W = TW; H = TH + faceH; sqc = { x0: ox - HW, y0: oy - HH };
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
          } else if (s.ch === '~' || s.ch === 'D') {                              // the still pool: black water, the cave's colour in it, a rare glint
            var edge = Math.min(nearOpen(m, gx, gy, s.ch), 1); // (D, the deep water, drawn as the pool is)
            var sheen = vnoise(gx * 2 + 0.3, gy * 5, seed + 9), glint = h2(Math.floor(gx * 11), Math.floor(gy * 22), seed + 8) > 0.992;
            col = edge < 0.1 ? stone[2] : edge < 0.2 ? stone[1] : glint ? silver[5] : sheen > 0.8 ? violet[2] : rampPick(blue, n * 0.22 + (1 - Math.min(1, edge * 2)) * 0.12, ix, iy);
          } else {
            var crack = Math.abs(vnoise(gx * 2.2, gy * 2.2, seed + 21) - 0.5) < 0.012;
            var pebble = h2(Math.floor(gx * 14), Math.floor(gy * 14), seed + 5) > 0.985;
            var mossy = fbm(gx * 0.7, gy * 0.7, seed + 40) > 0.66 && rock < 0.6;
            if (s.ch === ',') {                                   // the road: packed dirt, two ruts along it, no grass
              var rx = gx + 0.5 - Math.floor(gx + 0.5), ry = gy + 0.5 - Math.floor(gy + 0.5), rut = (m.def.road === 'y' ? Math.abs(rx - 0.3) < 0.05 || Math.abs(rx - 0.7) < 0.05 : Math.abs(ry - 0.3) < 0.05 || Math.abs(ry - 0.7) < 0.05);
              col = rut ? leather[0] : pebble ? stone[5] : rampPick(leather, 0.12 + n * 0.4 + (fine - 0.5) * 0.15, ix, iy);
            } else if (s.ch === 'g') {                            // grass, all of it
              col = pebble ? stone[4] : rampPick(moss, 0.12 + n * 0.75 + (fine - 0.5) * 0.2 - Math.max(0, 0.9 - rock) * 0.3, ix, iy);
            } else if (earth) {
              var grass = fbm(gx * 0.45, gy * 0.45, seed + 40) + (fine - 0.5) * 0.25 > 0.5 && s.ch !== 'r';
              col = crack ? leather[0] : pebble ? stone[5] : grass ? rampPick(moss, 0.15 + n * 0.7 - Math.max(0, 0.9 - rock) * 0.3, ix, iy) : rampPick(leather, 0.2 + n * 0.5 + (fine - 0.5) * 0.15 - Math.max(0, 0.9 - rock) * 0.25, ix, iy);
              if (s.ch === 'r' && fine > 0.55) col = rampPick(stone, shade + 0.25, ix, iy);
            } else {
              col = crack ? stone[1] : pebble ? stone[6] : mossy && fine > 0.55 ? rampPick(moss, 0.3 + n * 0.4, ix, iy) : rampPick(stone, shade, ix, iy);
              if (s.ch === 'r' && fine > 0.6) col = rampPick(stone, shade + 0.18, ix, iy);
            }
          }
          // an open edge of the map (a road running on, the way out) fades into the dark, dithered
          var ed = Math.min(gx + 0.5, gy + 0.5, m.w - 0.5 - gx, m.h - 0.5 - gy);
          if (ed < 0.9 && dith(ix, iy) > ed / 0.9) col = stone[0];
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
      if (s.ch === 'P') m.props.push({ kind: 'pillar', sq: s, depth: s.x + s.y + 0.5, gz: s.gz, img: D.art.stalagmite(D.hash('p' + s.x + ',' + s.y)) });
      if (s.tree) m.props.push({ kind: 'tree', sq: s, depth: s.x + s.y + 0.5, gz: s.gz, img: D.art.tree(D.hash('t' + s.x + ',' + s.y)) });
      if (s.block) m.props.push({ kind: 'block', sq: s, depth: s.x + s.y + 0.5, gz: 0, img: blockCanvas(m, s) });
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

  // ------------------------------------------------------------------ the blocks: a box on the square, its faces toward +gx and +gy only where
  // the same block doesn't carry on (so a wagon two squares wide by four long is one box), lit as the rock is
  var BLOCK = { W: { h: 24, side: 'leather', top: 'silver', planks: true, wheels: true }, V: { h: 12, side: 'leather', top: 'leather', planks: true, wheels: true, bed: true }, k: { h: 14, side: 'leather', top: 'leather', planks: true, logs: true },
    f: { h: 11, side: 'leather', top: 'leather', rail: true }, w: { h: 11, side: 'stone', top: 'stone', well: true },
    y: { h: 13, side: 'leather', top: 'leather', rail: true } }; // (a cradle: a timber crib, slats and a bar -- the rail's drawing, taller)
  function blockCanvas(m, s) {
    var b = BLOCK[s.ch], hgt = b.h, W = TW, H = TH + hgt + 2, ox = HW, oy = hgt + HH;
    var same = function (x, y) { var n = m.at(x, y); return !!(n && n.ch === s.ch); };
    var seed = D.hash(m.def.name) + s.x * 31 + s.y * 17, side = iso.ramp(b.side), top = iso.ramp(b.top), stone = iso.ramp('stone');
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var cx = cv.getContext('2d'), img = cx.createImageData(W, H), px = img.data;
    function put(ix, iy, c) { if (ix < 0 || iy < 0 || ix >= W || iy >= H) return; var o = (iy * W + ix) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255; }
    [['R', !same(s.x + 1, s.y), !same(s.x, s.y - 1) || !same(s.x, s.y + 1)], ['L', !same(s.x, s.y + 1), !same(s.x - 1, s.y) || !same(s.x + 1, s.y)]].forEach(function (f) {
      if (!f[1]) return;
      var right = f[0] === 'R', wheel = b.wheels && f[2];
      for (var k = 0; k < HW; k++) {
        var fx = right ? ox + k : ox - HW + k, yb = right ? oy + HH - Math.floor(k / 2) : oy + Math.floor(k / 2);
        for (var j = 0; j < hgt; j++) {
          var y = yb - j - 1, v = (right ? 0.3 : 0.52) + (vnoise(k * 0.2 + s.x * 5, y * 0.3, seed) - 0.5) * 0.2;
          if (b.rail && !(k % 16 < 3 || j === 3 || j === 4 || j === 8 || j === 9)) continue;   // posts and two bars, the yard through them
          if (b.planks && !b.logs && k % 8 === 0) v -= 0.16;                                   // plank seams
          if (b.logs) { var ring = Math.hypot((k % 7) - 3, (j % 5) - 2); v = ring < 1.2 ? 0.7 : ring < 2.4 ? 0.45 : 0.18; } // log ends, stacked
          if (b.well && (j % 4 === 0 || (k + (j >> 2) * 4) % 8 === 0)) v -= 0.14;           // the well's courses
          if (j === 0) v -= 0.1;
          var col = rampPick(side, v, fx, y);
          if (wheel) { var d = Math.hypot(k - HW / 2, (j - 7) * 1.1); if (d < 7.5 && d > 5) col = stone[1]; else if (d < 1.6) col = stone[3]; else if (d < 5 && ((k + j) % 3 === 0)) col = stone[2]; }
          put(fx, y, col);
        }
      }
    });
    // the top: a wagon's canvas cover, the woodpile's bark, the rail's bar, the well's rim round the dark
    for (var dy = -HH; dy < HH; dy++) {
      var half = HW - Math.abs(dy + 0.5) * 2;
      for (var dx = -Math.floor(half); dx < half; dx++) {
        var tx = ox + dx, ty = oy - hgt + dy, v2 = 0.5 + (vnoise((dx + s.x * 64) * 0.12, (dy + s.y * 32) * 0.25, seed + 9) - 0.5) * 0.3;
        if (b.rail && Math.abs(dy) > 1) continue;
        if (b.well) { var r2 = Math.hypot(dx / HW, dy / HH); if (r2 < 0.5) { put(tx, ty, stone[0]); continue; } v2 = 0.42 + (r2 > 0.85 ? -0.1 : 0.08); }
        if (b.bed) v2 = (Math.abs(((dx - dy * 2) % 8 + 8) % 8) < 1 ? 0.12 : 0.36) + (vnoise(dx * 0.4, dy * 0.4, seed) - 0.5) * 0.15; // the bed's boards
        if (s.ch === 'W') v2 = 0.3 + 0.28 * Math.abs(Math.sin((dx + dy * 2 + s.x * 13) * 0.35)) + (half - Math.abs(dx + 0.5) < 2 ? -0.18 : 0); // the cover's folds: dusky canvas at night
        put(tx, ty, rampPick(top, v2, tx, ty));
      }
    }
    cx.putImageData(img, 0, 0);
    return { canvas: cv, ax: ox, ay: oy };
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
    var seed = D.hash(m.def.name) + s.x * 31 + s.y * 17, built = s.ch === 'b';
    if (built) stone = iso.ramp('silver');
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
          if (built) { var course = Math.floor((j + s.y * 3) / 5), joint = (k + (course % 2) * 6) % 12 === 0; v = (right ? 0.34 : 0.56) + (vnoise(k * 0.5 + course * 7, course, seed) - 0.5) * 0.18 - ((j % 5 === 0 || joint) ? 0.22 : 0); } // a building: coursed stone
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
  // The floor canvas is blitted (the canvas clips it); the props and the frame's objects are sorted and drawn -- the map's own props sorted once and kept (they never
  // move; wet.js adds and takes some, so the kept sort is redone when their count changes), the frame's objects sorted and merged in; a prop whose picture lies wholly
  // outside the canvas being drawn is skipped, and a rock's canvas is only ever made when it is seen (10-04 night, the huge maps: a 90x70 floor is thousands of rock and tile
  // canvases a frame, most of them off the screen)
  function byDepth(a, b2) { return a.depth - b2.depth || a.gz - b2.gz || (a.layer || 0) - (b2.layer || 0); }
  iso.draw = function (ctx, objs, overlay) {
    var m = iso.map, b = m.bake, o = iso.toScreen(b.x, b.y);
    ctx.drawImage(b.canvas, o.x, o.y);
    if (overlay) overlay(ctx);
    if (!m.sorted || m.sortedN !== m.props.length) { m.sorted = m.props.slice().sort(byDepth); m.sortedN = m.props.length; }
    var A = m.sorted, Bl = (objs || []).slice().sort(byDepth), list = [], i = 0, j = 0;
    while (i < A.length || j < Bl.length) list.push(j >= Bl.length || (i < A.length && byDepth(A[i], Bl[j]) <= 0) ? A[i++] : Bl[j++]);
    var vw = iso.inWorld ? D.W / iso.zoom : D.W, vh = iso.inWorld ? D.H / iso.zoom : D.H;
    for (var k = 0; k < list.length; k++) {
      var p = list[k];
      if (p.draw) { p.draw(ctx); continue; }
      var rock = p.kind === 'rock', c = rock ? iso.center(p.sq.x, p.sq.y, 0) : iso.center(p.fx != null ? p.fx - 0.5 : p.sq.x, p.fy != null ? p.fy - 0.5 : p.sq.y, p.gz), s = iso.toScreen(c.x, c.y);
      var img = rock ? null : p.img, x0 = s.x - (rock ? HW : img.ax), y0 = s.y - (rock ? 0 : img.ay);
      if (rock) { if (x0 >= vw || x0 + TW <= 0 || s.y - WALL - (m.maxGz || 0) - 60 >= vh || s.y + TH <= 0) continue; img = rockCanvas(m, p.sq); x0 = s.x - img.ax; y0 = s.y - img.ay; } // (a far wall can rise WALL above a raised neighbour's floor: the bound before its canvas is made)
      if (x0 >= vw || y0 >= vh || x0 + img.canvas.width <= 0 || y0 + img.canvas.height <= 0) continue;
      if (rock) { ctx.drawImage(img.canvas, x0, y0); continue; }
      ctx.globalAlpha = p.alpha == null ? 1 : p.alpha;
      ctx.drawImage(img.canvas, x0, y0);
      ctx.globalAlpha = 1;
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
    var m = iso.map, best = null, bd = -1, z = iso.inWorld ? 1 : iso.zoom;
    for (var i = 0; i < m.sq.length; i++) {
      var s = m.sq[i];
      if (!s.open) continue;
      var c = iso.center(s.x, s.y, s.gz), p = iso.toScreen(c.x, c.y);
      var dx = Math.abs(sx + 0.5 - p.x), dy = Math.abs(sy + 0.5 - p.y);
      if (dx / (HW * z) + dy / (HH * z) <= 1 && s.x + s.y > bd) { bd = s.x + s.y; best = s; }
    }
    return best;
  };

  // the keyboard cursor: one square a press along the grid's own axes, as on the 8-bit map (up is y-1, right x+1), so
  // on screen up runs up-right, right down-right, down down-left, left up-left (Griz, 09-27: "follow the grid version").
  // One axis at a time reaches every square; stepping x and y together once left half the floor, a checkerboard, out.
  iso.nudge = function (c, dir, w, h) {
    var d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir], x = c.x + d[0], y = c.y + d[1];
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    c.x = x; c.y = y;
    return true;
  };

  // snap the camera (16-bit games cut, they don't glide)
  iso.lookAt = function (gx, gy, gz) { var c = iso.center(gx, gy, gz || 0); iso.cam.x = Math.round(c.x); iso.cam.y = Math.round(c.y - 20); };
})();
