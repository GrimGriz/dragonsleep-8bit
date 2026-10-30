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
  iso.setWall = function (w) { WALL = w; iso.WALL = w; }; // (&hscale: the far walls rise with the heights -- js/main.js, 10-08)

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
    return rampPick0(ramp, v, px, py);
  }
  function mix(a, b, t) { return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; } // (two colours, t of the way from the first)
  function rampPick0(ramp, v, px, py) {
    var f = D.clamp(v, 0, 0.9999) * (ramp.length - 1), i = Math.floor(f), t = f - i;
    return ramp[Math.min(ramp.length - 1, i + (t > dith(px, py) ? 1 : 0))];
  }
  iso.noise = { vnoise: vnoise, fbm: fbm, dith: dith, rampPick: rampPick, h2: h2 };

  // ------------------------------------------------------------------ the map
  var OPEN = { '.': 1, '=': 1, 'r': 1, '~': 1, 'L': 1, '/': 1, 'P': 1, 'c': 1, ',': 1, 'g': 1, 'T': 1, 'W': 1, 'V': 1, 'k': 1, 'f': 1, 'w': 1, 'D': 1, 'y': 1, 'G': 1, 'd': 1, 'o': 1, 'K': 1, 'S': 1 }; // (o: a floor of boards, K: a counter, S: shelves -- a town's rooms, 10-20) (G: a roof of glass -- the Edifice's skylights, walkable, the orchard seen through it: bake, 10-04 night; d: a door's threshold, dressed stone, the doorway painted on the face above it)
  // (the Settling, 09-30: D deep water, the landlord's under the fall; y a cradle, the crawler pens' timber crib. A map's `deepWater`
  // names the water nothing walks in -- grid.js lets only what lives there (bound to it, or a swimmer) in)
  // set design (09-27, Griz: "proceed with set design"): the things a square can hold that stand in the way -- not walked
  // through, half cover, like a stalagmite (grid.js names them in the cover's reason). b is a built wall: rock to the rules.
  //   ,  a road (packed dirt, rutted)   g  grass   T  a tree   W  a wagon under its cover (squares side by side make one)
  //   V  a wagon's open bed (lower; a fight's `riders` stand in it)
  //   k  a woodpile or crates   f  a rail or fence (posts and bars)   w  a well   b  a building's wall
  var STANDS = { P: 'a stalagmite', T: 'a tree', W: 'the wagon', V: 'the wagon', k: 'the woodpile', f: 'the rail', w: 'the well', y: 'the cradle', K: 'the counter', S: 'the shelves' };
  iso.load = function (def) {
    // heights at D.hscale (RULED 10-14, Griz: "now want that default across the board for grid mappings"; js/main.js sets it, 2 unless &hscale= says): a map's
    // `step` is its own number in data/maps.js (kept as `step0`) times D.hscale, done here so a map made at runtime takes it too. The rules read feet through
    // `step` (js/grid.js G.dist, G.LAYER, the falls), so only the picture changes. A map made from another's def copies its `step0`, never its scaled `step`
    if (def.step) { if (def.step0 == null) def.step0 = def.step; def.step = Math.max(1, Math.round(def.step0 * (D.hscale || 1))); }
    // and a flooded map's water sheet with it (10-30, his "the top 4 stairs don't seem to be flooded": the Keeper's stair kept its 39 px while the steps doubled), kept as `waterLevel0`
    if (def.waterLevel != null) { if (def.waterLevel0 == null) def.waterLevel0 = def.waterLevel; def.waterLevel = Math.round(def.waterLevel0 * (D.hscale || 1)); }
    var m = { def: def, w: def.rows[0].length, h: def.rows.length, sq: [] };
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
      var ch = def.rows[y][x];
      m.sq.push({
        x: x, y: y, ch: ch, open: !!OPEN[ch],
        walk: !!OPEN[ch] && ch !== 'c' && !STANDS[ch] && (def.deepWater || '').indexOf(ch) < 0, // (deep water: grid.js walkable lets its own in)
        difficult: ch === 'r' || ch === '~', deep: (def.deepWater || '').indexOf(ch) >= 0,
        gz: def.heights ? (parseInt(def.heights[y][x], 36) || 0) * def.step : ch === 'L' ? def.step * 2 : ch === '/' ? def.step : 0, // (a map's `heights`: a digit a square, in steps -- the Flooded Stair's flight, 10-02)
        pillar: !!STANDS[ch], stands: STANDS[ch] || null, cocoon: ch === 'c', tree: ch === 'T', block: 'WVkfwyKS'.indexOf(ch) >= 0 ? ch : null
      });
    }
    m.at = function (x, y) { return (x < 0 || y < 0 || x >= m.w || y >= m.h) ? null : m.sq[y * m.w + x]; };
    if (def.ropeBucket) { var rb = m.at(def.ropeBucket[0], def.ropeBucket[1]); if (rb) rb.stands = 'the rope bucket'; }
    if (def.torchBarrel) { var tb = m.at(def.torchBarrel[0], def.torchBarrel[1]); if (tb) tb.stands = 'the torch barrel'; } // (the Edifice's barrel of torches behind the houses: battle.js, 10-05 night) // (Fountain Street's bucket of rope and grapples: battle.js, 10-04 night)
    (def.falls || []).forEach(function (q) { var fs = m.at(q[0], q[1]); if (fs) fs.falls = true; }); // (a waterfall down a wall's face: rockCanvas paints it -- the Edifice's back wall, 10-04 night)
    (def.spouts || []).forEach(function (q) { var sp = m.at(q[0], q[1]); if (sp) sp.spout = q[2] || 10; }); // (a fountain's spout: a hole flush in the square's +gy face that many feet up, the water pouring from it -- the Edifice's four, 10-04 night)
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
    // a map's `page` (10-20, the Silverton roam seat: the town at true scale, 474 x 310 squares, is a picture 24,000 px wide -- past what a browser will make, and half a
    // minute to paint): the floor painted in pieces of PAGE px as the camera comes to them, each square into every piece it touches (iso.draw, m.bake.paged). Off, as before
    var paged = !!m.def.page, cv = document.createElement('canvas');
    if (paged) { cv.width = HW * 2; cv.height = TH * 2; } else { cv.width = maxX - minX; cv.height = maxY - minY; }
    var ctx = cv.getContext('2d');
    var stone = iso.ramp('stone'), silver = iso.ramp('silver'), blue = iso.ramp('blue'), violet = iso.ramp('violet'), moss = iso.ramp('moss');
    // an open-air map (ground: 'earth', 09-27: the road, the gnolls' country, the bridge) lays its raw floor as packed dirt
    // and grass instead of cave stone; the rock round it stands as the cutting's walls
    var earth = m.def.ground === 'earth', leather = iso.ramp('leather');
    var seed = D.hash(m.def.name);
    // a door shut in its doorway (the Edifice's vault, 10-05, Griz, with the 8-bit Edifice's picture: "those doorways are good if we can put those doors over them as closed"): the
    // 8-bit's leaf -- planked wood, a dark X of braces corner to corner, a gold ring on a dark boss at its middle, a stud at each corner; u across the leaf (0..18), v down it from the
    // arch's top (1..39). doorOpen keeps the doorway's open look for the same pixels, made into the square's second canvas after its faces (s.tileOpen)
    var gold = iso.ramp('gold'), doorOpen = [];
    function doorLeaf(u, v, ru) { // (ru: where the ring sits across the leaf -- by the seam on a double door, 10-05)
      if (v <= 1 || v >= 38 || u <= 0 || u >= 17 || (v <= 4 && (u <= 2 || u >= 15))) return leather[0];
      var rB = Math.hypot(u - (ru || 8.5), (v - 21) * 0.9);
      if (rB < 1.6) return leather[0];
      if (rB < 3.4) return v < 21 ? gold[4] : gold[3];
      if (rB < 4.4) return leather[0];
      var sl = 35 / 15, nl = Math.sqrt(1 + sl * sl), dX = Math.min(Math.abs((v - 2) - sl * (u - 1)), Math.abs((v - 2) - sl * (16 - u))) / nl;
      if (dX < 1.1) return leather[1];
      if (dX < 1.7) return gold[1];
      if ((u === 2 || u === 15) && (v === 6 || v === 35)) return gold[3];
      if (u % 4 === 0) return leather[2];
      var wn = vnoise(u * 0.4 + 3.1, v * 0.15, seed + 33);
      return wn > 0.62 ? mix(leather[3], gold[2], 0.5) : wn < 0.3 ? leather[2] : leather[3];
    }
    var W, H, px, sqc, pb = null, PGW = 0; // the current square's buffer (pb: a page's own pixels, written straight -- a paged floor, below)
    function put(ix, iy, c) {
      if (pb) { ix -= dx0; iy -= dy0; if (ix < 0 || iy < 0 || ix >= PGW || iy >= PGW) return; var q = (iy * PGW + ix) * 4; pb[q] = c[0]; pb[q + 1] = c[1]; pb[q + 2] = c[2]; pb[q + 3] = 255; return; }
      ix -= sqc.x0; iy -= sqc.y0; if (ix < 0 || iy < 0 || ix >= W || iy >= H) return; var o = (iy * W + ix) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
    }
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
    var dst = ctx, dx0 = 0, dy0 = 0; // (where a square's picture goes: the one floor canvas, or the page being painted, offset by its corner)
    var paintSq = function (s) {
      var c = iso.center(s.x, s.y, s.gz), ox = c.x - minX, oy = c.y - minY;
      // (no rock within reach of any of its pixels' look-round -- three squares, the pixel's own square one off the square's at the rhombus edge: nearRock is 9 for each, so skip
      // its 25 looks a pixel; the same pixels, for the town's streets and plazas a fifth of the time -- 10-20)
      var rockNear = false; for (var ry = -3; ry <= 3 && !rockNear; ry++) for (var rx = -3; rx <= 3; rx++) { var rq = m.at(s.x + rx, s.y + ry); if (rq && !rq.open) { rockNear = true; break; } }
      // the square's own canvas: its top, and its faces down to the lower neighbours in front of it -- only as tall as the tallest face it shows (a square inside a
      // plateau shows none and is 32 px tall, not 32 + its height: the Edifice's deck was 16 MB of mostly blank canvas -- 10-04 night, the huge maps)
      var faceH = 0; if (s.gz) [[1, 0], [0, 1]].forEach(function (d) { var nz = m.isOpen(s.x + d[0], s.y + d[1]) ? m.gz(s.x + d[0], s.y + d[1]) : 0; faceH = Math.max(faceH, s.gz - nz); });
      W = TW; H = TH + faceH; sqc = { x0: ox - HW, y0: oy - HH };
      var sqImg = pb ? null : ctx.createImageData(W, H); px = sqImg ? sqImg.data : null;
      for (var dy = -HH; dy < HH; dy++) {
        var half = HW - Math.abs(dy + 0.5) * 2;
        for (var dx = -Math.floor(half); dx < half; dx++) {
          var ix = ox + dx, iy = oy + dy;
          // back to world ground coords for continuous texture
          var wx = (c.x + dx + 0.5), wy = (c.y + dy + 0.5 + s.gz);
          var gx = (wx / HW + wy / HH) / 2 - 0.5, gy = (wy / HH - wx / HW) / 2 - 0.5;
          var n = fbm(gx * 1.3, gy * 1.3, seed), fine = vnoise(gx * 9, gy * 9, seed + 3);
          var shade = 0.18 + n * 0.42 + (fine - 0.5) * 0.12;
          var rock = rockNear ? nearRock(gx + 0.5, gy + 0.5) : 9;
          shade -= Math.max(0, 0.9 - rock) * 0.22;             // darker where the floor meets the wall
          if (s.gz) shade += 0.08;                                // the ledge catches a little more light
          var col;
          if (s.ch === '=' || s.ch === 'd') {                     // dressed stone: cold, with slab seams (d: a door's threshold, the same stone)
            var fx = gx + 0.5 - Math.floor(gx + 0.5), fy = gy + 0.5 - Math.floor(gy + 0.5);
            var seam = fx < 0.04 || fy < 0.04 || (fx > 0.49 && fx < 0.53 && (Math.floor(gy + 0.5) % 2));
            col = seam ? silver[1] : rampPick(silver, 0.25 + n * 0.35, ix, iy);
          } else if (s.ch === '~' || s.ch === 'D') {                              // the still pool: black water, the cave's colour in it, a rare glint
            var edge = Math.min(nearOpen(m, gx, gy, s.ch), 1); // (D, the deep water, drawn as the pool is)
            var sheen = vnoise(gx * 2 + 0.3, gy * 5, seed + 9), glint = h2(Math.floor(gx * 11), Math.floor(gy * 22), seed + 8) > 0.992;
            col = edge < 0.1 ? stone[2] : edge < 0.2 ? stone[1] : glint ? silver[5] : sheen > 0.8 ? violet[2] : rampPick(blue, n * 0.22 + (1 - Math.min(1, edge * 2)) * 0.12, ix, iy);
          } else if (s.ch === 'G') {                              // a roof of glass (the Edifice, 10-04 night, Griz: "the skylight glass that should make up the majority of the 4th floor/3rd floor
            // ceiling" -- then: "can we do semi transparent and put the orchard under it? thin silver on the glass tile edges over the hole"): the orchard on the floor below is painted
            // first -- grass as the grass tile has it, the round dark crown of a tree, the Sunshaft's hole (`shaft`) with its stone rim -- and the glass over it as a thin tint, a
            // gloss across the panes, and each tile's edge in thin silver, over the hole as well, so the glass reads as one sheet across it
            var gx0 = gx + 0.5, gy0 = gy + 0.5, fx2 = gx0 - Math.floor(gx0), fy2 = gy0 - Math.floor(gy0);
            var sh = m.def.shaft, shD = sh ? Math.hypot(gx0 - sh[0], gy0 - sh[1]) : 9, inShaft = sh && shD < sh[2], rimS = sh && !inShaft && shD < sh[2] + 0.22;
            var under = fbm(gx0 * 0.8, gy0 * 0.8, seed + 77), tn = vnoise(gx0 * 1.4, gy0 * 1.4, seed + 91), crown = tn > 0.68, crownRim = tn > 0.62 && !crown;
            var pebG = h2(Math.floor(gx0 * 14), Math.floor(gy0 * 14), seed + 5) > 0.985;
            var floor = inShaft ? (shD < sh[2] - 0.5 ? stone[0] : stone[1]) : rimS ? stone[3] : crown ? moss[1] : crownRim ? moss[0] : pebG ? stone[4] : rampPick(moss, 0.15 + under * 0.6 + (fine - 0.5) * 0.15, ix, iy);
            // the hall's walls under the glass (10-05, Griz: "the walls supporting the west and north roof glass - seems to me making 12 & 2 appear like walls behind/under glass would make the
            // glass look a floor above (supposed to be 15 ft walls, but we can look first if that feels weird)"): a glass tile with no glass to its north (x, y - 1) or to its west (x - 1, y)
            // gives its far 58% on that side -- fy2 under 0.58 for the north, fx2 under 0.58 for the west, the two back edges on the screen -- to the inner face of the wall, in the stone
            // ramp, lighter at the glass and darker toward the floor, a darker course every 0.19 of a square running along the wall; the north face lit a step over the west, as a raised
            // square's two faces are; a corner tile shows both, the nearer wall at each pixel. The tint, the gloss and the silver edge below go over it as over the orchard; a tile touching
            // the Sunshaft's circle and its rim keeps what it had
            var nbN = m.at(s.x, s.y - 1), nbW = m.at(s.x - 1, s.y), nbN2 = m.at(s.x, s.y - 2), nbW2 = m.at(s.x - 2, s.y), wB = 1.16 * (D.hscale || 1); // (&hscale: as deep again, so it still reads as 15 ft under heights drawn N times as tall -- 10-08, Griz: "make the 3rd floor orchard look like a 3rd floor orchard under glass") (the band runs two rows deep: a 15 ft wall, where one row read as 7.5 -- 10-05, Griz: "sonnet had the notion right, but that looks at most 7.5 ft, aiming for 15")
            var isG = function (t) { return !!(t && t.ch === 'G'); };
            var back = function (dx, dy, f) { for (var k = 1; k <= 5; k++) if (!isG(m.at(s.x - dx * k, s.y - dy * k))) return k - 1 + f; return 9; }; // (rows back to the wall, up to five for a deeper band)
            var dN = back(0, 1, fy2), dW = back(1, 0, fx2); // (tiles from the wall, the pixel's own fraction in: the edge row 0..1, the second 1..2, and on)
            var wNd = dN < wB ? dN / wB : 9, wWd = dW < wB ? dW / wB : 9, wD = Math.min(wNd, wWd);
            var shNx = sh ? Math.max(s.x - sh[0], 0, sh[0] - s.x - 1) : 9, shNy = sh ? Math.max(s.y - sh[1], 0, sh[1] - s.y - 1) : 9;
            if (wD < 1 && !inShaft && !rimS && (!sh || Math.hypot(shNx, shNy) >= sh[2] + 0.22)) {
              var wIsN = wNd <= wWd, wE = wIsN ? dN : dW, wV = (wIsN ? 0.62 : 0.5) - wD * 0.32 + (fine - 0.5) * 0.08;
              if (wE > 0.08 && (wE / 0.19) % 1 < 0.34) wV -= 0.2;
              floor = rampPick(stone, wV, ix, iy);
            }
            col = mix(floor, blue[3], inShaft ? 0.1 : 0.2);
            var gloss = ((gx0 - gy0 * 0.5) % 6 + 6) % 6 < 0.35; if (gloss && dith(ix, iy) < 0.45) col = mix(col, silver[5], 0.4);
            if ((fx2 < 0.035 || fy2 < 0.035) && dith(ix, iy) < 0.65) col = silver[3];
          } else {
            var crack = Math.abs(vnoise(gx * 2.2, gy * 2.2, seed + 21) - 0.5) < 0.012;
            var pebble = h2(Math.floor(gx * 14), Math.floor(gy * 14), seed + 5) > 0.985;
            var mossy = fbm(gx * 0.7, gy * 0.7, seed + 40) > 0.66 && rock < 0.6;
            if (s.ch === ',') {                                   // the road: packed dirt, two ruts along it, no grass
              var rx = gx + 0.5 - Math.floor(gx + 0.5), ry = gy + 0.5 - Math.floor(gy + 0.5), rut = (m.def.road === 'y' ? Math.abs(rx - 0.3) < 0.05 || Math.abs(rx - 0.7) < 0.05 : Math.abs(ry - 0.3) < 0.05 || Math.abs(ry - 0.7) < 0.05);
              col = rut ? leather[0] : pebble ? stone[5] : rampPick(leather, 0.12 + n * 0.4 + (fine - 0.5) * 0.15, ix, iy);
            } else if (s.ch === 'o') {                            // a floor of boards (a town's rooms, 10-20): planks along the grid's x, their seams and pegs, worn paler down the middle
              var bx = gx + 0.5 - Math.floor(gx + 0.5), by = gy + 0.5 - Math.floor(gy + 0.5), board = Math.floor(by * 4), seamB = (by * 4) % 1 < 0.1 || ((bx + board * 0.37) % 1) < 0.03;
              col = seamB ? leather[0] : rampPick(leather, 0.45 + (h2(Math.floor(gx + 0.5) * 4 + board, Math.floor(gy + 0.5), seed + 11) - 0.5) * 0.3 + n * 0.25 - Math.max(0, 0.9 - rock) * 0.3, ix, iy);
            } else if (s.ch === 'g') {                            // grass, all of it
              col = pebble ? stone[4] : rampPick(moss, 0.12 + n * 0.75 + (fine - 0.5) * 0.2 - Math.max(0, 0.9 - rock) * 0.3, ix, iy);
            } else if (m.def.ground === 'sand' && s.ch === '.') {                // the Hex's sand (js/hex.js HX.field): raked gold, trodden darker, a stone in it now and then
              col = pebble ? stone[5] : rampPick(gold, 0.3 + n * 0.25 + (fine - 0.5) * 0.12 - Math.max(0, 0.9 - rock) * 0.2, ix, iy);
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
          var nb = m.at(s.x + d[0], s.y + d[1]), doorF = !right && nb && nb.ch === 'd', dL = doorF ? m.at(s.x - 1, s.y + 1) : null, dR = doorF ? m.at(s.x + 1, s.y + 1) : null, pairL = !!(dL && dL.ch === 'd'), pairR = !!(dR && dR.ch === 'd'), kL = pairL ? 0 : 6, kR = pairR ? HW - 1 : 25, kA = kL + (pairL ? 0 : 1), kB = kR - (pairR ? 0 : 1), ringU = pairR ? 13.5 : pairL ? 3.5 : 8.5, fallF = !right && s.falls, spoutF = !right && s.spout ? Math.round(s.spout / 2.5) * m.def.step : 0; // (a doorway on the +gy face above a threshold tile; a fall down the whole face; a spout: a hole that many px up the face, the water from it down -- 10-04 night)
          for (var k = 0; k < HW; k++) {
            var fx0 = right ? ox + k : ox - HW + k;
            var ytop = right ? oy + HH - Math.floor(k / 2) : oy + Math.floor(k / 2);
            for (var j = 0; j < drop; j++) {
              if (spoutF && j > drop - spoutF - 8) { // the fountain's spout: a dark hole flush in the face at its height over the floor (j runs down from the face's top, so the hole is at drop - spoutF), the water below it in a narrow fall to the pool (10-05: it had counted from the top -- the hole near the roof, the water running up to it)
                var jH = drop - spoutF, hr = Math.hypot(k - 16, j - jH), inHole = hr < 6, onRim = hr >= 6 && hr < 7.5;
                if (inHole) { put(fx0, ytop + j, stone[0]); continue; }
                if (onRim) { put(fx0, ytop + j, silver[3]); continue; }
                if (j > jH && k >= 11 && k <= 21) { var strkS = vnoise(k * 0.9 + s.x * 13, (ytop + j) * 0.05, seed + 5), wvS = 0.5 + (strkS - 0.5) * 0.9, wcS = rampPick(blue, D.clamp(wvS, 0, 0.99), fx0, ytop + j); if (j >= drop - 6 && dith(fx0, ytop + j) < (j - drop + 7) / 7) wcS = silver[5]; else if (wvS > 0.74 || k === 11 || k === 21) wcS = silver[4]; put(fx0, ytop + j, wcS); continue; }
              }
              if (fallF) { // the water out of the arch's face, a tiny fall into the basin below (the back wall's falls are rockCanvas's)
                var strkF = vnoise(k * 0.7 + s.x * 13, (ytop + j) * 0.05, seed + 5), wvF = 0.5 + (strkF - 0.5) * 0.9 + (vnoise(k * 2.1, (ytop + j) * 0.35, seed + 6) - 0.5) * 0.3, wcF = rampPick(blue, D.clamp(wvF, 0, 0.99), fx0, ytop + j);
                if (j >= drop - 6 && dith(fx0, ytop + j) < (j - drop + 7) / 7) wcF = silver[5]; else if (wvF > 0.78) wcF = silver[4]; else if (wvF > 0.66) wcF = silver[2];
                put(fx0, ytop + j, wcF); continue;
              }
              var v = (right ? 0.32 : 0.5) + (vnoise(k * 0.3 + s.x * 9, j * 0.12, seed + 60) - 0.5) * 0.3 - (j / drop) * 0.15;
              if (j === 0) v += 0.2;
              if (doorF && k >= kL && k <= kR && j >= drop - 40) { // the doorway: dark within, a dressed frame, an arch at the top -- and its door shut in it (the open look kept for when it stands open); two doorways side by side are a double door, the leaves meeting at the seam and the frame on the outer edges only (10-05, Griz: "make the doors big enough that they're double doors touching")
                var fr = (!pairL && k === kL) || (!pairR && k === kR) || j === drop - 40 || (j >= drop - 40 && j < drop - 36 && ((!pairL && k < kL + 3) || (!pairR && k > kR - 3)));
                if (fr) { put(fx0, ytop + j, silver[3]); continue; }
                put(fx0, ytop + j, doorLeaf(Math.round((k - kA) / Math.max(1, kB - kA) * 17), j - (drop - 40), ringU));
                doorOpen.push([fx0, ytop + j, j > drop - 4 ? stone[2] : stone[0]]); continue;
              }
              put(fx0, ytop + j, rampPick(stone, v, fx0, ytop + j));
            }
          }
        });
      }
      if (pb) { doorOpen = []; return; } // (a page's pixels, written straight: no square's own canvas, no raised square's tile -- a paged floor's heights fall away from the eye, so nothing behind them is lower)
      var tc = document.createElement('canvas'); tc.width = W; tc.height = H;
      tc.getContext('2d').putImageData(sqImg, 0, 0);
      dst.drawImage(tc, sqc.x0 - dx0, sqc.y0 - dy0);
      if (s.gz) s.tile = { canvas: tc, ax: HW, ay: HH };
      if (doorOpen.length) { // the same square with its door standing open: the doorway dark within (iso.draw shows it while the map's doorsOpen is set -- battle.js)
        var oImg = ctx.createImageData(W, H); oImg.data.set(sqImg.data);
        doorOpen.forEach(function (q) { var ix2 = q[0] - sqc.x0, iy2 = q[1] - sqc.y0; if (ix2 < 0 || iy2 < 0 || ix2 >= W || iy2 >= H) return; var o2 = (iy2 * W + ix2) * 4; oImg.data[o2] = q[2][0]; oImg.data[o2 + 1] = q[2][1]; oImg.data[o2 + 2] = q[2][2]; oImg.data[o2 + 3] = 255; });
        var tcO = document.createElement('canvas'); tcO.width = W; tcO.height = H; tcO.getContext('2d').putImageData(oImg, 0, 0);
        s.tileOpen = { canvas: tcO, ax: HW, ay: HH }; doorOpen = [];
      }
    };
    if (!paged) { order.forEach(paintSq); m.bake = { canvas: cv, x: minX, y: minY }; return; }
    // paged: each page's squares, back to front as above (a square is in every page its picture touches: its top, and the faces below it as tall as they drop)
    var PG = iso.PAGE, cols = Math.ceil((maxX - minX) / PG), rows = Math.ceil((maxY - minY) / PG), pages = [];
    for (var pi = 0; pi < cols * rows; pi++) pages.push({ c: pi % cols, r: Math.floor(pi / cols), list: [], cv: null, used: 0 });
    order.forEach(function (s, k) {
      var c = iso.center(s.x, s.y, s.gz), x0 = c.x - minX - HW, y0 = c.y - minY - HH, fh = 0;
      if (s.gz) [[1, 0], [0, 1]].forEach(function (d) { var nz = m.isOpen(s.x + d[0], s.y + d[1]) ? m.gz(s.x + d[0], s.y + d[1]) : 0; fh = Math.max(fh, s.gz - nz); });
      for (var r = Math.max(0, Math.floor(y0 / PG)); r <= Math.min(rows - 1, Math.floor((y0 + TH + fh) / PG)); r++) for (var cc = Math.max(0, Math.floor(x0 / PG)); cc <= Math.min(cols - 1, Math.floor((x0 + TW) / PG)); cc++) pages[r * cols + cc].list.push(k);
    });
    m.bake = { canvas: { width: maxX - minX, height: maxY - minY }, x: minX, y: minY, paged: true, cols: cols, rows: rows, pages: pages, baked: 0, frame: 0,
      // a page painted whole (budget none), or as much as `budget` ms allow, carried on next time (the pages just outside the view, a frame at a time): true when done
      paint: function (p, budget) {
        if (!p.pim) { p.pc = document.createElement('canvas'); p.pc.width = PG; p.pc.height = PG; p.pim = p.pc.getContext('2d').createImageData(PG, PG); p.k = 0; }
        pb = p.pim.data; PGW = PG; dx0 = p.c * PG; dy0 = p.r * PG;
        var t0 = budget ? performance.now() : 0;
        while (p.k < p.list.length) { paintSq(order[p.list[p.k++]]); if (budget && (p.k & 15) === 0 && performance.now() - t0 > budget) break; }
        pb = null; dx0 = dy0 = 0;
        if (p.k < p.list.length) return false;
        p.pc.getContext('2d').putImageData(p.pim, 0, 0); p.cv = p.pc; p.pim = p.pc = null; this.baked++; return true;
      } };
  }
  iso.PAGE = 1024; iso.PAGES_KEPT = 48; iso.PAGE_MS = 6; // (a page's px; the pages kept painted at once, the least lately seen let go past that -- 4 MB each)
  // the paged floor on the canvas being drawn: the pages in view painted now, one more a frame from those just outside it, and the least lately seen let go
  function drawPages(ctx, b, o, vw, vh) {
    var PG = iso.PAGE, f = ++b.frame, near = null;
    for (var r = 0; r < b.rows; r++) for (var c = 0; c < b.cols; c++) {
      var x = o.x + c * PG, y = o.y + r * PG, p = b.pages[r * b.cols + c];
      if (!p.list.length) continue;
      var inView = x < vw && y < vh && x + PG > 0 && y + PG > 0, nearView = x < vw + PG && y < vh + PG && x + PG > -PG && y + PG > -PG;
      if (inView) { if (!p.cv) b.paint(p); p.used = f; ctx.drawImage(p.cv, x, y); }
      else if (nearView && !p.cv && (!near || (p.pim && !near.pim))) near = p; // (one begun first)
    }
    if (near) { b.paint(near, iso.PAGE_MS); near.used = f; } // (a few ms of it a frame: walking never waits on a page)
    if (b.baked > iso.PAGES_KEPT) {
      var held = b.pages.filter(function (p) { return p.cv && p.used < f; }).sort(function (a, z) { return a.used - z.used; });
      for (var i = 0; i < held.length && b.baked > iso.PAGES_KEPT; i++) { held[i].cv = null; b.baked--; }
    }
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
    var RF = m.def.roofs;
    m.roofTop = RF ? Math.max.apply(null, Object.keys(RF).map(function (k) { return iso.roofPx(m, k); })) : 0; // (the tallest roof: iso.draw's bound on what may still show from below the view)
    m.sq.forEach(function (s) {
      if (s.rock === 'far' || s.rock === 'near' || (RF && !s.open && RF[s.ch])) m.props.push({ kind: 'rock', sq: s, depth: s.x + s.y, gz: 0 }); // (a roofed square stands whole, its roof seen: every one, not only the edges -- roofCanvas)
      if (s.tile) m.props.push({ kind: 'tile', sq: s, depth: s.x + s.y, gz: s.gz, layer: -1, img: s.tile, imgOpen: s.tileOpen || null }); // (imgOpen: a door's square standing open -- iso.draw, m.doorsOpen)
      // (on a paged floor each picture is made when it is first drawn, as a rock's is: the town has thousands of stalls, rails and wells -- iso.draw, p.make)
      var lazy = !!m.def.page, mk = function (p, f) { if (lazy) p.make = f; else p.img = f(); m.props.push(p); };
      if (s.ch === 'P') mk({ kind: 'pillar', sq: s, depth: s.x + s.y + 0.5, gz: s.gz }, function () { return D.art.stalagmite(D.hash('p' + s.x + ',' + s.y)); });
      if (s.tree) mk({ kind: 'tree', sq: s, depth: s.x + s.y + 0.5, gz: s.gz }, function () { return D.art.tree(D.hash('t' + s.x + ',' + s.y)); });
      if (s.block) mk({ kind: 'block', sq: s, depth: s.x + s.y + 0.5, gz: 0 }, function () { return blockCanvas(m, s); });
      if (s.cocoon) mk({ kind: 'cocoon', sq: s, depth: s.x + s.y + 0.5, gz: s.gz }, function () { return D.art.cocoon(D.hash('c' + s.x + ',' + s.y)); });
      // (a rough square's stones stand at its own height -- on a raised square they had sunk under it: the Gnoll Hills' scrub showed no rough ground, 10-08)
      if (s.ch === 'r') {
        for (var k = 0; k < 3; k++) {
          var r = h2(s.x * 7 + k, s.y * 13, seed);
          if (r < 0.45) continue;
          var ox = (h2(s.x, s.y + k * 3, seed + 1) - 0.5) * 0.7, oy = (h2(s.x + k * 5, s.y, seed + 2) - 0.5) * 0.7;
          (function (k2) { mk({ kind: 'stone', sq: s, fx: s.x + 0.5 + ox, fy: s.y + 0.5 + oy, depth: s.x + s.y + 0.5 + ox + oy, gz: s.gz || 0 }, function () { return D.art.rubble(D.hash('r' + s.x + ',' + s.y + ',' + k2)); }); })(k);
        }
      }
    });
    m.rockImgs = {};
  }

  // ------------------------------------------------------------------ the blocks: a box on the square, its faces toward +gx and +gy only where
  // the same block doesn't carry on (so a wagon two squares wide by four long is one box), lit as the rock is
  var BLOCK = { W: { h: 24, side: 'leather', top: 'silver', planks: true, wheels: true }, V: { h: 12, side: 'leather', top: 'leather', planks: true, wheels: true, bed: true }, k: { h: 14, side: 'leather', top: 'leather', planks: true, logs: true },
    f: { h: 11, side: 'leather', top: 'leather', rail: true }, w: { h: 11, side: 'stone', top: 'stone', well: true },
    y: { h: 13, side: 'leather', top: 'leather', rail: true }, // (a cradle: a timber crib, slats and a bar -- the rail's drawing, taller)
    // a town's rooms (10-20, the Silverton roam seat; Griz: "We're going to need slightly varied 16 bit shop interiors for the vendors"): a shop's counter, waist-high boards;
    // shelves to the head, boards every course and the trade's goods on them in the map's `goods` ramp (js/town.js T.room)
    K: { h: 18, side: 'red', top: 'stone', planks: true, counter: true }, S: { h: 40, side: 'leather', top: 'leather', shelves: true } }; // (the counter a darker wood than a board floor, its top worn pale: it stands out of the room)
  function blockCanvas(m, s) {
    var b = BLOCK[s.ch], hgt = b.h, W = TW, H = TH + hgt + 2, ox = HW, oy = hgt + HH;
    var same = function (x, y) { var n = m.at(x, y); return !!(n && n.ch === s.ch); };
    var seed = D.hash(m.def.name) + s.x * 31 + s.y * 17, side = iso.ramp(b.side), top = iso.ramp(b.top), stone = iso.ramp('stone'), goods = b.shelves && m.def.goods ? iso.ramp(m.def.goods) : null;
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
          if (b.shelves) { // a shelf's board every ten px, and between them the goods: jars, bolts, ledgers, in the trade's colours (the map's `goods`)
            if (j % 10 === 0 || k % 16 === 0) col = rampPick(side, 0.62, fx, y);
            else { var gk = h2((k >> 2) + s.x * 17, (j / 10 | 0) + s.y * 13, seed + 3), gr = goods || side; col = gk > 0.35 && (j % 10) > 1 && (j % 10) < 9 - ((k >> 2) % 3) ? rampPick(gr, 0.25 + gk * 0.7, fx, y) : rampPick(side, 0.08, fx, y); }
          }
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
        if (b.counter) v2 = (Math.abs(((dx + dy * 2) % 10 + 10) % 10) < 1 ? 0.2 : 0.55) + (vnoise(dx * 0.3, dy * 0.6, seed) - 0.5) * 0.15; // the counter's top, worn boards
        if (s.ch === 'W') v2 = 0.3 + 0.28 * Math.abs(Math.sin((dx + dy * 2 + s.x * 13) * 0.35)) + (half - Math.abs(dx + 0.5) < 2 ? -0.18 : 0); // the cover's folds: dusky canvas at night
        put(tx, ty, rampPick(top, v2, tx, ty));
      }
    }
    cx.putImageData(img, 0, 0);
    return { canvas: cv, ax: ox, ay: oy };
  }

  // ------------------------------------------------------------------ a town's buildings (a map's `roofs`: { ch: { h: feet, roof: ramp, wall: ramp } } -- 10-20, the Silverton roam seat:
  // the cave's rock -- walls fading up into the dark, the inside black -- read as pits in a town). A roofed square stands its height whole: its roof on top, its walls toward
  // +gx and +gy where the building ends, lime-washed timber courses, a window band on the upper floor; cut to a stub while the party is behind it (js/roam.js R.occlude, s.occCut).
  // One picture for each look (which faces show, cut or not, three roofs), not one a square: the town has thirty-six thousand of them
  iso.roofPx = function (m, ch) { var r = m.def.roofs && m.def.roofs[ch]; return r ? Math.round(r.h / 2.5 * m.def.step) : 0; };
  function roofCanvas(m, s) {
    var RF = m.def.roofs[s.ch], isR = function (x, y) { var n = m.at(x, y); return !!(n && !n.open && n.ch === s.ch); }; // (a wall shows where this building ends -- the next one along another height, its own)
    var fR = !isR(s.x + 1, s.y), fL = !isR(s.x, s.y + 1), cut = !!s.occCut, v0 = h2(s.x, s.y, 41) * 3 | 0;
    var side = m.def.slope ? +m.def.slope[s.y].charAt(s.x) || 0 : 0; if (side > 3) side -= 3; // (the roof's side: 1 toward the light, 2 away, 3 the ridge -- a map's `slope`, js/town.js; 4-6 the same with the ridge north-south)
    var key = s.ch + (fR ? 'R' : '') + (fL ? 'L' : '') + (cut ? 'c' : '') + v0 + 's' + side;
    m.roofImgs = m.roofImgs || {}; if (m.roofImgs[key]) return m.roofImgs[key];
    var top = cut ? STUB : iso.roofPx(m, s.ch), W = TW, H = TH + top + 2, ox = HW, oy = top + HH;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var cx = cv.getContext('2d'), img = cx.createImageData(W, H), px = img.data, wall = iso.ramp(RF.wall || 'stone'), roof = iso.ramp(RF.roof || 'red'), seed = 913 + v0 * 31;
    function put(ix, iy, c) { if (ix < 0 || iy < 0 || ix >= W || iy >= H) return; var o = (iy * W + ix) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255; }
    [['R', fR], ['L', fL]].forEach(function (f) {
      if (!f[1]) return;
      var right = f[0] === 'R';
      for (var k = 0; k < HW; k++) {
        var fx = right ? ox + k : ox - HW + k, yb = right ? oy + HH - Math.floor(k / 2) : oy + Math.floor(k / 2);
        for (var j = 0; j < top; j++) {
          var y = yb - j - 1, up = j / Math.max(1, top), v = (right ? 0.42 : 0.62) + (vnoise(k * 0.4 + v0 * 7, j * 0.3, seed) - 0.5) * 0.12;
          if (j < 3) v -= 0.18;                                          // the footing
          if (!cut && (k % 16 === 0 || Math.abs(up - 0.5) < 0.02)) v -= 0.22; // the timbers: posts and the floor's beam
          if (!cut && up > 0.62 && up < 0.82 && (k % 16) > 5 && (k % 16) < 11) v = 0.08; // the upper floor's windows
          if (j === top - 1) v += cut ? 0.25 : -0.1;
          put(fx, y, rampPick(wall, D.clamp(v, 0, 0.99), fx, y));
        }
      }
    });
    for (var dy = -HH; dy < HH; dy++) { // the roof (or the cut's section, lighter)
      var half = HW - Math.abs(dy + 0.5) * 2;
      for (var dx = -Math.floor(half); dx < half; dx++) {
        var tile = ((dx + dy * 2 + 512) % 8) < 1, edge = half - Math.abs(dx + 0.5) < 1.5;
        var v2 = cut ? 0.55 : 0.4 + [0, 0.14, -0.1, -0.22][side] + (vnoise((dx + v0 * 64) * 0.15, dy * 0.3, seed + 9) - 0.5) * 0.25 - (tile ? 0.14 : 0) - (edge ? 0.1 : 0);
        put(ox + dx, oy - top + dy, rampPick(cut ? wall : roof, D.clamp(v2, 0, 0.99), ox + dx, oy - top + dy));
      }
    }
    cx.putImageData(img, 0, 0);
    return (m.roofImgs[key] = { canvas: cv, ax: ox, ay: oy });
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
    var stone = iso.ramp('stone'), outline = iso.ramp('outline')[0], blueR = iso.ramp('blue'), silverR = iso.ramp('silver');
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
          if (s.falls && far) { // a waterfall down the face (10-04 night, Griz: "can we waterfall wall 31, 0 to 28, 0"): white water in streaks, foam where it meets the floor
            var strk = vnoise(k * 0.6 + s.x * 13, y * 0.04, seed + 5), wv = 0.5 + (strk - 0.5) * 0.9 + (vnoise(k * 2.1, y * 0.35, seed + 6) - 0.5) * 0.3, wc = rampPick(blueR, D.clamp(wv, 0, 0.99), fx, y);
            if (j < 8 && dith(fx, y) < (8 - j) / 9) wc = silverR[5]; else if (wv > 0.78) wc = silverR[4]; else if (wv > 0.66) wc = silverR[2];
            put(fx, y, wc); continue;
          }
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
    if (b.paged) drawPages(ctx, b, o, iso.inWorld ? D.W / iso.zoom : D.W, iso.inWorld ? D.H / iso.zoom : D.H); // (a floor too big for one picture: js/town.js's Silverton)
    else ctx.drawImage(b.canvas, o.x, o.y);
    if (overlay) overlay(ctx);
    if (!m.sorted || m.sortedN !== m.props.length) { m.sorted = m.props.slice().sort(byDepth); m.sortedN = m.props.length; }
    var A = m.sorted, Bl = (objs || []).slice().sort(byDepth), list = [], i = 0, j = 0, iEnd = A.length;
    var vw = iso.inWorld ? D.W / iso.zoom : D.W, vh = iso.inWorld ? D.H / iso.zoom : D.H;
    if (b.paged) { // (a paged floor: only the props in the depth band the view can show -- the town has tens of thousands, the props sorted by depth, x + y)
      var y0d = iso.toScreen(iso.center(0, 0, 0).x, iso.center(0, 0, 0).y).y, kd = iso.toScreen(iso.center(1, 0, 0).x, iso.center(1, 0, 0).y).y - y0d, upH = Math.max(WALL, m.roofTop || 0) + (m.maxGz || 0) + 60;
      var dLo = (-TH - y0d) / kd - 2, dHi = (vh + upH - y0d) / kd + 2, lo = 0, hi = A.length;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (A[mid].depth < dLo) lo = mid + 1; else hi = mid; }
      i = lo; while (iEnd > i && A[iEnd - 1].depth > dHi) iEnd--;
    }
    while (i < iEnd || j < Bl.length) list.push(j >= Bl.length || (i < iEnd && byDepth(A[i], Bl[j]) <= 0) ? A[i++] : Bl[j++]);
    for (var k = 0; k < list.length; k++) {
      var p = list[k];
      if (p.draw) { p.draw(ctx); continue; }
      var rock = p.kind === 'rock', c = rock ? iso.center(p.sq.x, p.sq.y, m.def.roofs && m.def.roofs[p.sq.ch] ? p.sq.gz : 0) : iso.center(p.fx != null ? p.fx - 0.5 : p.sq.x, p.fy != null ? p.fy - 0.5 : p.sq.y, p.gz), s = iso.toScreen(c.x, c.y);
      if (p.make && !p.img) { if (s.x + TW < 0 || s.x - TW > vw || s.y + TH < 0 || s.y - 120 > vh) continue; p.img = p.make(); } // (a paged floor's prop, its picture made the first time it is near the view)
      var img = rock ? null : p.imgOpen && m.doorsOpen ? p.imgOpen : p.img, x0 = s.x - (rock ? HW : img.ax), y0 = s.y - (rock ? 0 : img.ay); // (a door baked shut stands open while the map says so: the Edifice's vault as the party comes out -- battle.js arrive)
      if (rock) { if (x0 >= vw || x0 + TW <= 0 || s.y - Math.max(WALL, m.roofTop || 0) - (m.maxGz || 0) - 60 >= vh || s.y + TH <= 0) continue; img = m.def.roofs && m.def.roofs[p.sq.ch] ? roofCanvas(m, p.sq) : rockCanvas(m, p.sq); x0 = s.x - img.ax; y0 = s.y - img.ay; } // (a town's building: its roof -- roofCanvas) // (a far wall can rise WALL above a raised neighbour's floor: the bound before its canvas is made)
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
  // (`prefZ`, 10-04 night, Griz: "can we have it determine by the square you're moving onto the covered area from?": where a raised square and a lower one behind it both
  // lie under the point, the one at the height the cursor came from wins -- the cursor keeps its level, the roof from the roof, the street from the street; with no such
  // square, the front-most as before)
  iso.pick = function (sx, sy, prefZ) {
    var m = iso.map, best = null, bd = -1, bestZ = null, bdZ = -1, z = iso.inWorld ? 1 : iso.zoom, stP = (m.def && m.def.step) || 10;
    for (var i = 0; i < m.sq.length; i++) {
      var s = m.sq[i];
      if (!s.open) continue;
      var c = iso.center(s.x, s.y, s.gz), p = iso.toScreen(c.x, c.y);
      var dx = Math.abs(sx + 0.5 - p.x), dy = Math.abs(sy + 0.5 - p.y);
      if (dx / (HW * z) + dy / (HH * z) > 1) continue;
      if (s.x + s.y > bd) { bd = s.x + s.y; best = s; }
      if (prefZ != null && Math.abs(s.gz - prefZ) <= stP && s.x + s.y > bdZ) { bdZ = s.x + s.y; bestZ = s; }
    }
    return bestZ || best;
  };

  // the square under a screen point on the plane at height z (flight at a height, 10-08: a flier's move at a layer): each open square at z, or at its own height where that is
  // higher (a roof above the layer is a roof), front-most wins
  iso.pickAt = function (sx, sy, z0) {
    var m = iso.map, best = null, bd = -1, z = iso.inWorld ? 1 : iso.zoom;
    for (var i = 0; i < m.sq.length; i++) {
      var s = m.sq[i];
      if (!s.open) continue;
      var c = iso.center(s.x, s.y, Math.max(z0, s.gz)), p = iso.toScreen(c.x, c.y);
      if (Math.abs(sx + 0.5 - p.x) / (HW * z) + Math.abs(sy + 0.5 - p.y) / (HH * z) > 1) continue;
      if (s.x + s.y > bd) { bd = s.x + s.y; best = s; }
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
