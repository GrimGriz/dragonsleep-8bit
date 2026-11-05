/* DEEP16 -- THE HALFWAY INN'S PROPS ON THE DIAMONDS (11-04, the props cutter seat, started by the lanes desk on Griz's "cutter is delaying on the props, start up a
   separate cutter for those"; ..\handoff-2026-10-30-the-halfway-inn-and-the-lake.md). The art desk's return of art-wanted section 36 (the ask on his note on the inn,
   "Prop request list for the art-department, wall tilings as needed as well"), cut by tools/innprops-sheet.py into deep16/art/innprops_p1 (an atlas of named pieces,
   each with its footprint and its anchor -- the back corner of the footprint on the ground).
   Laid on the inn's floor (js/inn.js In.ROWS) while the party is in the house: the big fire's hearth on the chimney's 2 x 4 (its long mouth to the kitchen, the face the
   camera sees, its fire playing in it), the small one between the bedrooms, the long table with its benches, the settle by the fire, the table for two and its chairs; the kitchen's
   tub, worktable and the fish on their racks, the crates and barrels, the beds -- and upstairs the beds, the crates and the table by the big room's bed.
   Each piece is found by its glyphs on the rows (the long table wherever its six K stand), so the floor can move under it; the code's own block on those squares
   (js/iso.js blockCanvas, the chimney's rock) gives way to it, and the squares' rules are the floor's as before.
   THE SORT: a piece over several squares is cut a square at a time -- each pixel to the front-most square whose column it stands over -- and each cut sorted at its own
   square, so a figure behind the long table stands behind it and one on the bench in front of it. `&props=code` draws the code's blocks instead (the art off). */
'use strict';
(function () {
  var D = window.D16, iso = D.iso, In = D.inn; if (!iso || !In) return;
  // (three atlases since 11-05: innprops_p2 holds pages 5, 6, 9A and 9B -- the barn, the yard and the shore, the kitchen's kettle and tools, upstairs' stair head and
  // chimney; innwalls_p1 pages 7, 8 and 9A's walls, roofs and lamps)
  var IP = D.innprops = {}, SHEETS = ['innprops_p1', 'innprops_p2', 'innwalls_p1'], SHEET = SHEETS[0], HW = 32, HH = 16;
  IP.on = !/[?&]props=code\b/.test(typeof location !== 'undefined' ? location.search || '' : '');
  function sheet(name) {
    var key = SHEET;
    if (name) { key = null; for (var k = 0; k < SHEETS.length; k++) { var s0 = D.SHEETS && D.SHEETS[SHEETS[k]]; if (s0 && s0.tiles[name]) { key = SHEETS[k]; break; } } }
    var sh = key && D.SHEETS && D.SHEETS[key]; if (!sh) return null;
    var im = D.images && D.images[sh.image]; if (!im && D.spr && D.spr.load) D.spr.load(sh.image);
    return im && im.naturalWidth ? { sh: sh, im: im } : null;
  }
  var BOX = {}, CUT = {};
  function boxes(name) { var S = sheet(name); if (!S || !S.sh.tiles[name]) return null; return BOX[name] || (BOX[name] = S.sh.tiles[name].split(' ').map(function (b) { return b.split(',').map(Number); })); }
  // a square's column over the piece: from its two lower edges (and a few px under, for the feet) up off the top; the outer squares take what overhangs past the sides
  function prism(cx, q, i, j, a, b) {
    var tx = q[4] + (i - j) * HW, ty = q[5] + (i + j) * HH, my = ty + HH + 6, by = ty + 2 * HH + 6;
    var lx = i === 0 && j === b - 1 ? -9999 : tx - HW, rx = i === a - 1 && j === 0 ? 9999 : tx + HW;
    cx.beginPath(); cx.moveTo(lx, -9999); cx.lineTo(rx, -9999);
    cx.lineTo(rx, rx > tx + HW ? 9999 : my); cx.lineTo(tx + HW, my); cx.lineTo(tx, by); cx.lineTo(tx - HW, my); cx.lineTo(lx, lx < tx - HW ? 9999 : my); cx.closePath();
  }
  // the piece's frame cut a square at a time: { 'i,j': { canvas, ax, ay } } with each cut's anchor its own square's middle
  // (mir: the drawing mirrored left for right -- a thing drawn along the grid's x laid along its y, its footprint a, b as laid; its back corner stays its back corner)
  IP.slices = function (name, f, a, b, mir) {
    var key = name + '|' + f + '|' + a + ',' + b + (mir ? '|m' : ''); if (CUT[key]) return CUT[key];
    var S = sheet(name), bx = boxes(name); if (!bx) return null;
    var q0 = bx[f % bx.length], q = mir ? [q0[0], q0[1], q0[2], q0[3], q0[2] - q0[4], q0[5]] : q0, out = {};
    for (var i = 0; i < a; i++) for (var j = 0; j < b; j++) {
      var cv = document.createElement('canvas'); cv.width = q[2]; cv.height = q[3]; var cx = cv.getContext('2d');
      cx.imageSmoothingEnabled = false;
      if (mir) { cx.save(); cx.translate(q[2], 0); cx.scale(-1, 1); }
      cx.drawImage(S.im, q[0], q[1], q[2], q[3], 0, 0, q[2], q[3]);
      if (mir) cx.restore();
      cx.globalCompositeOperation = 'destination-in'; prism(cx, q, i, j, a, b); cx.fill();
      cx.globalCompositeOperation = 'destination-out';
      for (var i2 = 0; i2 < a; i2++) for (var j2 = 0; j2 < b; j2++) if (i2 + j2 > i + j) { prism(cx, q, i2, j2, a, b); cx.fill(); }
      out[i + ',' + j] = { canvas: cv, ax: q[4] + (i - j) * HW, ay: q[5] + HH + (i + j) * HH };
    }
    return (CUT[key] = out);
  };
  // a frame whole (a fire's flame over its hearth), anchored on the footprint's back corner
  function frameAt(ctx, name, f, gx, gy) {
    var S = sheet(name), bx = boxes(name); if (!bx) return;
    var q = bx[f % bx.length], c = iso.center(gx, gy, 0), s = iso.toScreen(c.x, c.y - HH);
    ctx.drawImage(S.im, q[0], q[1], q[2], q[3], Math.round(s.x - q[4]), Math.round(s.y - q[5]), q[2], q[3]);
  }
  function now() { return (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000; }

  // where each piece stands, found on the floor's rows by its glyphs: [name, gx, gy, a, b] (a squares along x, b along y), and the fires over their hearths
  IP.find = function (rows, up, opt) { // (up: the floor upstairs -- its chimney page 9's; its hearth the small one's copy, 11-05) (opt.lit: the lamps lit)
    var at = function (x, y) { var r = rows[y]; return r ? r.charAt(x) : ''; }, out = [], flames = [], tables = [], H = rows.length, Wd = rows[0].length;
    var x, y, n, cn = 0;
    for (y = 0; y < H; y++) for (x = 0; x < Wd; x++) {
      var c = at(x, y);
      if (!up && c === 'C' && at(x - 1, y) !== 'C' && at(x, y - 1) !== 'C') { var a = 0, b = 0; while (at(x + a, y) === 'C') a++; while (at(x, y + b) === 'C') b++; if (a === 2 && b === 4) { out.push(['inn_hearth', x, y, 2, 4]); flames.push(['inn_flameC', x, y]); } }
      if (c === 'T') out.push(['inn_tub', x, y, 1, 1]);                                          // (Elsbeth's tub)
      if (c === 'z') out.push(['inn_bed', x, y, 1, 1]);
      if (c === 'Z') out.push(['inn_bed', x, y, 1, 1, true]);                                     // (the bed mirrored: along y, its head to the north wall -- the big room's three, 11-05)
      if (c === 'c') out.push([cn++ % 2 ? 'inn_barrel' : 'inn_crate', x, y, 1, 1]);              // (the crates, every other one a barrel)
      if (c === 'H' && at(x - 1, y) !== 'H') { n = 0; while (at(x + n, y) === 'H') n++; for (var h = 0; h + 2 <= n; h += 2) out.push(['inn_rack', x + h, y, 2, 1]); } // (the fish drying along the wall, a rack each two squares)
      if (c === 'K' && at(x - 1, y) !== 'K' && at(x + 1, y) === 'K' && at(x + 2, y) !== 'K') out.push(['inn_worktable', x, y, 2, 1]); // (the kitchen's two)
      if (up && c === 'K' && at(x - 1, y) !== 'K' && at(x + 1, y) !== 'K') out.push(['inn_bedside', x, y, 1, 1]); // (the table by the big room's bed: the drawer)
      if (c === 'f' && at(x, y - 1) === 'B' && at(x, y + 1) === 'B') { out.push(['inn_hearthS', x, y, 1, 1]); flames.push(['inn_flameS', x, y]); }
      if (c === 'K' && at(x - 1, y) !== 'K') {
        n = 0; while (at(x + n, y) === 'K') n++;
        if (n === 6) { out.push(['inn_longtable', x, y, 3, 2]); out.push(['inn_longtable', x + 3, y, 3, 2]); tables.push(['long', x, y, n]); } // (two sections end to end: the drawing at a figure's scale is half the six)
        else if (n === 1 && at(x - 1, y) === 'm' && at(x + 1, y) === 'm') { out.push(['inn_table2', x, y, 1, 1]); out.push(['inn_chairA', x - 1, y, 1, 1]); out.push(['inn_chairB', x + 1, y, 1, 1]); tables.push(['two', x, y, 1]); }
      }
      if (c === 'b' && at(x, y - 1) !== 'b' && at(x, y + 1) === 'b') out.push(['inn_settle', x, y, 1, 2]);
      // PAGES 5, 6, 9A AND 9B (11-05, the exteriors seat): the barn, the yard and the shore, the hearth's tools and kettle, upstairs' chimney and stair head
      if (up && c === 'C' && at(x, y - 1) !== 'C' && at(x, y + 1) === 'C') out.push(['up_chimney', x, y, 1, 2]);   // (the stack over the big fire, at the small hearth's back)
      if (up && c === 'D') out.push(['up_stairhead', x, y, 1, 1]);
      if (c === 'w' && at(x, y - 1) === 'A') out.push(['barn_stall', x, y, 2, 2, true]);                   // (the north row: mirrored, it opens +y onto the aisle, its manger on the north rail)
      if (c === 'w' && at(x, y + 1) === 'A') { out.push(['barn_stallsides', x, y - 1, 2, 2, true]); out.push(['yard_trough', x, y, 2, 1]); } // (the south row opens away from the camera: its two partitions, and a trough for its manger along the back)
      if (c === 'a') out.push(['barn_hay', x, y, 1, 1]);
      if (c === 'x' && at(x - 1, y) !== 'x') out.push(['yard_trough', x, y, 2, 1]);
      if (c === '|' && at(x - 1, y) !== '|' && at(x + 1, y) === '|') { n = 0; while (at(x + n, y) === '|') n++; for (var r2 = 0; r2 + 2 <= n; r2 += 2) out.push(['yard_rail', x + r2, y, 2, 1]); } // (the hitching rail, half its four squares a drawing)
      if (c === 'q') out.push(['yard_well', x, y, 1, 1]);
      if (c === 'k') out.push(['yard_woodpile', x, y, 1, 1]);
      if (c === 'p') out.push(['shore_boat', x, y, 1, 2]);
      if (c === 'l') out.push([opt && opt.lit ? 'yard_postlit' : 'yard_post', x, y, 1, 1]);                 // (the lantern post on the point: lit at dusk and by night)
      if (c === 'i' && at(x, y - 1) !== 'i' && at(x, y + 1) === 'i') out.push(['shore_stone', x, y, 1, 2]);   // (the flat stone, its cairn to the north)
      if (c === 'j') out.push([at(x, y + 1) === 'h' ? 'kitchen_tools' : 'kitchen_kettle', x, y, 1, 1]);      // (beside the kitchen mouth: the tools above it, the kettle below)
      if (c === 's') out.push(['yard_sign', x, y, 1, 1]);
    }
    if (!up) IP.FLOATS.forEach(function (q, k) { if (at(q[0], q[1]) === 'W') out.push(['shore_float', q[0], q[1], 1, 1, false, k * 0.37]); }); // (out on the shallows, bobbing: [7] the phase)
    return { pieces: out, flames: flames, tables: tables };
  };
  IP.FLOATS = [[45, 11], [45, 26], [47, 29]];
  // THE SUPPER ON THE TABLES (11-05, the exteriors seat; page 9A): while the party sits at THE MEAL (In.sit to In.rise -- the meal itself is the supper seat's), the long
  // spread's dishes along the long table's top, each where the page set it (innprops_p2 `spread`: along the table from its west end, across it from the far edge), and the
  // spread for two on the table for two. TABLE_TOP: the tops' height in px over the floor (the long table's drawn top, the table for two's)
  IP.supper = false; IP.TABLE_TOP = { long: 22, two: 17 };
  var sit0 = In.sit, rise0 = In.rise;
  if (sit0) In.sit = function () { IP.supper = true; return sit0.apply(this, arguments); };
  if (rise0) In.rise = function () { IP.supper = false; return rise0.apply(this, arguments); };
  IP.spread = function (tables) { // [name, frame, px, py, gz]: a dish at a point on the floor (square x spans px x..x+1), its height
    var S = D.SHEETS && D.SHEETS.innprops_p2, lay = S && S.spread || [], out = []; // (the layout from the sheet's own words: laid before its picture has come)
    tables.forEach(function (t) {
      if (t[0] === 'long') lay.forEach(function (d, f) { out.push(['supper_dish', f, t[1] + 0.3 + d[0] * (t[3] - 0.6), t[2] + 0.5 + d[1] * 0.2, IP.TABLE_TOP.long]); });
      else out.push(['supper_two', 0, t[1] + 0.5, t[2] + 0.5, IP.TABLE_TOP.two]);
    });
    return out;
  };

  // the pieces laid on the loaded floor: each square of each a prop of its own, sorted with the figures; the code's block and the chimney's rock under them let go
  IP.dress = function (m) {
    if (!IP.on || !D.SHEETS || !D.SHEETS[SHEET]) return;
    var up = m.def && m.def.key === In.UP, got = IP.find(up ? In.UPROWS : In.ROWS, up, { lit: !!(m.def && (m.def.night || m.def.dusk)) }), mine = {};
    // (a house roofed over -- the party outside it, or in another -- keeps its things under its roof: only what stands in the open or in the house the party is in)
    var ins = m.def && m.def.inside || null, seen = function (x, y) { if (up) return true; var b = In.inHouse(x, y); return !b || b === ins; };
    got.pieces = got.pieces.filter(function (pc) { return seen(pc[1], pc[2]); }); got.flames = got.flames.filter(function (fl) { return seen(fl[1], fl[2]); });
    m.props = m.props.filter(function (p) { return !p.innProp; });
    got.pieces.forEach(function (pc) {
      var anim = pc[6] != null, fps = anim ? ((sheet(pc[0]) || { sh: {} }).sh.fps || {})[pc[0]] || 3 : 0; // (a piece with a phase plays its frames: the floats' bob, 1-2-3)
      for (var i = 0; i < pc[3]; i++) for (var j = 0; j < pc[4]; j++) (function (i, j) {
        var sq = m.at(pc[1] + i, pc[2] + j); if (!sq) return;
        mine[sq.x + ',' + sq.y] = 1;
        m.props.push({ innProp: true, kind: 'innprop', sq: sq, depth: sq.x + sq.y + 0.5, gz: 0, draw: function (ctx) {
          var f = anim ? Math.floor(now() * fps + pc[6] * 3) % 3 : 0;
          var sl = IP.slices(pc[0], f, pc[3], pc[4], pc[5]), p = sl && sl[i + ',' + j]; if (!p) return;
          var c = iso.center(sq.x, sq.y, 0), s = iso.toScreen(c.x, c.y);
          ctx.drawImage(p.canvas, Math.round(s.x - p.ax), Math.round(s.y - p.ay));
        } });
      })(i, j);
    });
    got.flames.forEach(function (fl) { // (over the hearth's front square on its kitchen face, after its cut and before anyone standing there)
      var big = fl[0] === 'inn_flameC', fx = fl[1] + (big ? 1 : 0), fy = fl[2] + (big ? 3 : 0), S = D.SHEETS[SHEET], fps = (S.fps && S.fps[fl[0]]) || 8;
      [[fl[1] + (big ? 2 : 1), fl[2], big ? 2 : 1]].forEach(function (apr) { for (var k = 0; k < apr[2]; k++) mine[apr[0] + ',' + (apr[1] + 1 + k)] = 1; }); // (the hearthstone before the big mouth: its code fire gives way)
      m.props.push({ innProp: true, kind: 'innflame', depth: fx + fy + 0.5, gz: 0, layer: 0.5, draw: function (ctx) { var bx = boxes(fl[0]); if (bx) frameAt(ctx, fl[0], Math.floor(now() * fps + fl[1] * 0.7), fl[1], fl[2]); } });
    });
    IP.spread(got.tables.filter(function (t) { return seen(t[1], t[2]); })).forEach(function (d, k) { // (the supper: drawn only while they sit -- IP.supper)
      var fx = Math.floor(d[2]), fy = Math.floor(d[3]);
      m.props.push({ innProp: true, kind: 'innsupper', depth: fx + fy + 0.51 + (d[3] - fy) * 0.01 + k * 1e-4, gz: 0, draw: function (ctx) {
        if (!IP.supper) return; var bx = boxes(d[0]), S = sheet(d[0]); if (!bx || !S) return;
        var q = bx[d[1] % bx.length], c = iso.center(d[2] - 0.5, d[3] - 0.5, d[4]), s = iso.toScreen(c.x, c.y);
        ctx.drawImage(S.im, q[0], q[1], q[2], q[3], Math.round(s.x - q[4]), Math.round(s.y - q[5]), q[2], q[3]);
      } });
    });
    IP.walls(m, mine, up, ins);
    m.props = m.props.filter(function (p) { return p.innProp || !(p.sq && mine[p.sq.x + ',' + p.sq.y] && (p.kind === 'block' || p.kind === 'rock')); });
    if (m.isoFire) m.isoFire = m.isoFire.filter(function (q) { return !mine[q[0] + ',' + q[1]]; });
    m.sorted = null; IP.laid = got;
  };
  // THE WALLS AND THE ROOFS (11-05, the exteriors seat; art-wanted 36 pages 7, 8 and 9A, cut by tools/innwalls-sheet.py into innwalls_p1): a building the party is
  // not in is drawn by js/iso.js iso.house -- its walls a square at a time along the two faces the camera sees, a window every few squares (the house's on the
  // ground floor and upstairs by turns), its door where the floor's doorway is, the corner, a lamp by the door; its roof from page 8's pieces at its own pitch
  // (`R`, px over the walls: the wing's lower, as the page drew it) -- and cut a square at a time for the sort. Its windows and lamps lit at dusk and by night.
  // The house the party is in (and upstairs) has every wall square cut to the knee-high stub: page 7's stub along the square's middle, along x where the wall
  // runs along x and along y where it runs along y (both at a corner, each to the middle where the wall ends), on the boards (inn.js In.under)
  var WALLS = 'innwalls_p1';
  IP.HOUSE = {
    house: { R: 56, base: ['#9c3d2b', '#6a2a1e', '#7d3a29'], win: function (k) { return k % 4 === 1 ? 'win' : k % 4 === 3 ? 'winup' : null; } }, // (base: the near slope's, the far slope's and the gable's own colour under its pieces)
    wing: { R: 24, base: ['#9c3d2b', '#6a2a1e', '#7d3a29'], win: function (k) { return k % 3 === 1 ? 'win' : null; } },
    barn: { R: 34, base: ['#837d74', '#57534d', '#6f5c47'], win: function (k) { return k % 3 === 1 ? 'win' : null; } }
  };
  IP.PARTS = function () { return [['house', In.BUILDINGS.inn.parts[0].r, 'inn'], ['wing', In.BUILDINGS.inn.parts[1].r, 'inn'], ['barn', In.BUILDINGS.barn.parts[0].r, 'barn']]; };
  var HC = {};
  function wsheet() { var S = sheet('house_plain_x'); return S && S.sh.tiles && S; }
  // the modules of a building's two faces the camera sees, square by square: its door where the floor's doorway is, a window every few squares (lit at dusk and by
  // night), none at either end -> { south: [names along x], east: [names along y] }
  IP.faceNames = function (mat, r, lit) {
    var rows = In.ROWS, at = function (x, y) { var w = rows[y]; return w ? w.charAt(x) : ''; }, cfg = IP.HOUSE[mat], out = { south: [], east: [] };
    var kind = function (c, k, last) { if (c === 'D') return 'door'; var w = !last && k > 0 && cfg.win(k); return w ? w + (lit ? '_lit' : '') : 'plain'; };
    for (var x = r[0]; x <= r[2]; x++) out.south.push(mat + '_' + kind(at(x, r[3]), x - r[0], x === r[2]) + '_x');
    for (var y = r[1]; y <= r[3]; y++) out.east.push(mat + '_' + kind(at(r[2], y), y - r[1], y === r[3]) + '_y');
    return out;
  };
  IP.houseSpec = function (mat, r, lit) {
    var S = wsheet(); if (!S) return null;
    var H0 = (S.sh.height || {})[mat], rows = In.ROWS, at = function (x, y) { var w = rows[y]; return w ? w.charAt(x) : ''; }, cfg = IP.HOUSE[mat], fn = IP.faceNames(mat, r, lit);
    var lamps = [];
    for (var y = r[1]; y <= r[3]; y++) if (at(r[2], y) === 'D') lamps.push([(lit ? 'lamplit' : 'lamp') + '_y', r[2] + 1, y - 0.12, Math.round(H0 * (mat === 'barn' ? 0.62 : 0.5))]);
    return { x0: r[0], y0: r[1], x1: r[2], y1: r[3], H: H0, R: cfg.R, base: cfg.base,
      piece: function (nm) { var b = boxes(nm); if (!b) return null; var q = b[0]; return { img: S.im, x: q[0], y: q[1], w: q[2], h: q[3], ax: q[4], ay: q[5] }; },
      pts: function (nm) { var c = (S.sh.roofpts || {})[nm]; return c ? { minx: c.minx, maxx: c.maxx, miny: c.miny, maxy: c.maxy } : null; },
      south: function (x) { return fn.south[x - r[0]]; }, east: function (y) { return fn.east[y - r[1]]; },
      gable: function () { return mat + '_plain_y'; }, corner: [mat + '_cornerL', mat + '_cornerR'],
      roof: { slope: 'roof_' + mat + '_slope', shade: 'roof_' + mat + '_shade', ridge: 'roof_' + mat + '_ridge', gable: 'roof_' + mat + '_gableA' }, extras: lamps };
  };
  IP.house = function (mat, r, lit) { // its slices, made once a look
    var key = mat + (lit ? 'n' : 'd'); if (HC[key]) return HC[key];
    var sp = IP.houseSpec(mat, r, lit); if (!sp) return null;
    var pic = iso.house(sp);
    return (HC[key] = { pic: pic, slices: iso.slices(pic, r[2] - r[0] + 1, r[3] - r[1] + 1) });
  };
  IP.wallsWait = false;
  IP.walls = function (m, mine, up, ins) {
    if (!wsheet()) { // (its sheet not come yet: the code's walls and roofs this time, and the floor dressed again when it comes)
      var src = D.SHEETS && D.SHEETS[WALLS] && D.SHEETS[WALLS].image;
      if (src && D.spr && D.spr.load && !IP.wallsWait) { IP.wallsWait = true; D.spr.load(src).then(function () { IP.wallsWait = false; if (iso.map === m && wsheet()) IP.dress(m); }); }
      return;
    }
    var lit = !!(m.def && (m.def.night || m.def.dusk));
    if (!up) IP.PARTS().forEach(function (pt) {
      var mat = pt[0], r = pt[1]; if (pt[2] === ins) return;             // (the house the party is in: its stubs, below)
      var h = IP.house(mat, r, lit); if (!h) return;
      for (var x = r[0]; x <= r[2]; x++) for (var y = r[1]; y <= r[3]; y++) mine[x + ',' + y] = 1;
      Object.keys(h.slices).forEach(function (k) {
        var ij = k.split(',').map(Number), sq = m.at(r[0] + ij[0], r[1] + ij[1]), sl = h.slices[k]; if (!sq) return;
        m.props.push({ innProp: true, kind: 'innhouse', sq: sq, depth: sq.x + sq.y + 0.5, gz: 0, draw: function (ctx) {
          var c = iso.center(sq.x, sq.y, 0), s = iso.toScreen(c.x, c.y); ctx.drawImage(sl.canvas, Math.round(s.x - sl.ax), Math.round(s.y - sl.ay));
        } });
      });
    });
    // the stubs: every wall square of the house the party is in, or of the floor upstairs
    var rows = up ? In.UPROWS : In.ROWS, at = function (x, y) { var w = rows[y]; return w ? w.charAt(x) : ''; };
    for (var y = 0; y < rows.length; y++) for (var x = 0; x < rows[y].length; x++) {
      var c = at(x, y); if (c !== 'B' && c !== 'A') continue;
      if (!up && (!ins || In.inHouse(x, y) !== ins)) continue;
      var sq = m.at(x, y); if (!sq) continue;
      var mat = c === 'A' ? 'barn' : 'wing', runs = IP.stubRuns(rows, x, y);
      mine[x + ',' + y] = 1;
      (function (sq, mat, runs) {
        m.props.push({ innProp: true, kind: 'innstub', sq: sq, depth: sq.x + sq.y + 0.5, gz: 0, draw: function (ctx) {
          var S = wsheet(); if (!S) return;
          runs.forEach(function (rn) {
            var b = boxes(mat + '_stub_' + rn[0]); if (!b) return; var q = b[0];
            var pt = function (u) { var c = rn[0] === 'x' ? iso.center(sq.x + u - 0.5, sq.y, 0) : iso.center(sq.x, sq.y + u - 0.5, 0); return iso.toScreen(c.x, c.y); }; // (a point along the square's middle line)
            var a0 = pt(0), p0 = pt(rn[1]), p1 = pt(rn[2]), cx0, cx1;
            if (rn[0] === 'x') { cx0 = p0.x - (rn[1] ? 1 : 0); cx1 = p1.x + (rn[2] === 1 ? 14 : 1); } else { cx0 = p1.x - (rn[2] === 1 ? 14 : 1); cx1 = p0.x + (rn[1] ? 1 : 0); }
            ctx.save(); ctx.beginPath(); ctx.rect(cx0, -99999, cx1 - cx0, 199999); ctx.clip();
            ctx.drawImage(S.im, q[0], q[1], q[2], q[3], Math.round(a0.x - q[4]), Math.round(a0.y - q[5]), q[2], q[3]);
            ctx.restore();
          });
        } });
      })(sq, mat, runs);
    }
  };
  // a wall square's stub: along x where a wall (or a doorway, or the hearth in it) is east or west of it, along y where one is north or south, each from the
  // square's middle to the side that carries on -> [[axis, from, to]] along the square, 0..1
  IP.stubRuns = function (rows, x, y) {
    var at = function (x2, y2) { var w = rows[y2]; return w ? w.charAt(x2) : ''; }, wl = function (x2, y2) { var c = at(x2, y2); return c === 'B' || c === 'A' || c === 'D' || c === 'f'; };
    var nE = wl(x + 1, y), nW = wl(x - 1, y), nN = wl(x, y - 1), nS = wl(x, y + 1), runs = [];
    if (nE || nW || (!nN && !nS)) runs.push(['x', nW ? 0 : 0.5, nE ? 1 : 0.5]); if (nN || nS) runs.push(['y', nN ? 0 : 0.5, nS ? 1 : 0.5]);
    return runs;
  };
  IP.prefetch = function () { [WALLS, 'innprops_p2', SHEET].forEach(function (k) { var sh = D.SHEETS && D.SHEETS[k]; if (sh && D.spr && D.spr.load) D.spr.load(sh.image, true); }); };

  // THE GROUND TILES (11-05, the exteriors seat; page 9B): painted into the code's floor as it is baked (js/iso.js `groundArt`) -- the lake's shallows on its knee-deep
  // squares (W), the wagon ruts down the Pit road (its three columns, along y) and on the wagon's track off the road into the yard (along x, to where it stands on its night)
  IP.TRACK = { x0: 3, x1: 7, rows: [18, 19] };
  var GT = {};
  IP.groundTile = function (name, m) {
    if (GT[name] !== undefined) return GT[name];
    var S = sheet(name), bx = boxes(name);
    if (!S || !bx) { // (its sheet not come yet: the code's floor for now, and the floor baked again when it comes -- js/iso.js iso.rebake)
      var key = SHEETS.filter(function (k) { return D.SHEETS && D.SHEETS[k] && D.SHEETS[k].tiles[name]; })[0], src = key && D.SHEETS[key].image;
      if (m && src && D.spr && D.spr.load && !m.groundWait) { m.groundWait = true; D.spr.load(src).then(function () { m.groundWait = false; if (iso.map === m && sheet(name)) iso.rebake(m); }); }
      return null;
    }
    var q = bx[0], cv = document.createElement('canvas'); cv.width = q[2]; cv.height = q[3]; var cx = cv.getContext('2d'); cx.drawImage(S.im, q[0], q[1], q[2], q[3], 0, 0, q[2], q[3]);
    try { return (GT[name] = { data: cx.getImageData(0, 0, q[2], q[3]).data, w: q[2], h: q[3] }); } catch (e) { return (GT[name] = null); } // (a page that may not read the atlas's pixels -- a file opened without leave -- keeps the code's floor)
  };
  IP.groundAt = function (x, y) {
    var r = In.ROWS[y], c = r ? r.charAt(x) : '', T = IP.TRACK;
    if (c === 'W') return 'ground_shallows';
    if (c === ',' && x <= 2) return 'ground_ruts';
    if (c === '.' && x >= T.x0 && x <= T.x1 && T.rows.indexOf(y) >= 0) return 'ground_rutsX';
    return null;
  };
  var load0 = iso.load;
  iso.load = function (def) {
    if (def && (def.key === In.KEY || def.key === In.UP) && IP.on) IP.prefetch(); // (the inn's sheets asked for as its floor is first laid: walls, roofs and props come with it)
    if (def && def.key === In.KEY && IP.on) def.groundArt = function (x, y, m) { var nm = IP.groundAt(x, y); return nm ? IP.groundTile(nm, m) : null; };
    var m = load0.apply(this, arguments); if (def && (def.key === In.KEY || def.key === In.UP)) IP.dress(m); return m; // (the yard, the barn and the shore too since 11-05)
  };
  // ELSBETH AT HOME (11-04, Griz to this seat: "please wire in elsbeth and her tub"): at the inn she wears the art desk's figure of her at home (elsbethhome_p1, art-wanted
  // section 35 block 6, cut by cutter-1104 -- her alone, its tub-fused views held), standing at page 3's tub (inn_tub, the square east of hers, the way she faces), in place of
  // the townswoman stand-in; her name, her talk and her scenes as they were. Elsewhere (Silverton's street) she is still the candle girl
  IP.ELSBETH = 'elsbethhome_p1';
  var people0 = D.town && D.town.people;
  if (people0) D.town.people = function (B) {
    people0.apply(this, arguments);
    var def = D.roam && D.roam.def; if (!def || def.key !== In.KEY || !D.SHEETS || !D.SHEETS[IP.ELSBETH]) return;
    (B.units || []).forEach(function (u) { if (u.npc === 'elsbeth') u.sheet = IP.ELSBETH; });
  };
})();
