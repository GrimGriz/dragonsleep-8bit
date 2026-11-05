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
  var IP = D.innprops = {}, SHEET = 'innprops_p1', HW = 32, HH = 16;
  IP.on = !/[?&]props=code\b/.test(typeof location !== 'undefined' ? location.search || '' : '');
  function sheet() {
    var sh = D.SHEETS && D.SHEETS[SHEET]; if (!sh) return null;
    var im = D.images && D.images[sh.image]; if (!im && D.spr && D.spr.load) D.spr.load(sh.image);
    return im && im.naturalWidth ? { sh: sh, im: im } : null;
  }
  var BOX = {}, CUT = {};
  function boxes(name) { var S = sheet(); if (!S || !S.sh.tiles[name]) return null; return BOX[name] || (BOX[name] = S.sh.tiles[name].split(' ').map(function (b) { return b.split(',').map(Number); })); }
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
    var S = sheet(), bx = boxes(name); if (!bx) return null;
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
    var S = sheet(), bx = boxes(name); if (!bx) return;
    var q = bx[f % bx.length], c = iso.center(gx, gy, 0), s = iso.toScreen(c.x, c.y - HH);
    ctx.drawImage(S.im, q[0], q[1], q[2], q[3], Math.round(s.x - q[4]), Math.round(s.y - q[5]), q[2], q[3]);
  }
  function now() { return (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000; }

  // where each piece stands, found on the floor's rows by its glyphs: [name, gx, gy, a, b] (a squares along x, b along y), and the fires over their hearths
  IP.find = function (rows, up) { // (up: the floor upstairs -- its chimney page 9's, not cut yet; its hearth the small one's copy, 11-05)
    var at = function (x, y) { var r = rows[y]; return r ? r.charAt(x) : ''; }, out = [], flames = [], H = rows.length, Wd = rows[0].length;
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
        if (n === 6) { out.push(['inn_longtable', x, y, 3, 2]); out.push(['inn_longtable', x + 3, y, 3, 2]); } // (two sections end to end: the drawing at a figure's scale is half the six)
        else if (n === 1 && at(x - 1, y) === 'm' && at(x + 1, y) === 'm') { out.push(['inn_table2', x, y, 1, 1]); out.push(['inn_chairA', x - 1, y, 1, 1]); out.push(['inn_chairB', x + 1, y, 1, 1]); }
      }
      if (c === 'b' && at(x, y - 1) !== 'b' && at(x, y + 1) === 'b') out.push(['inn_settle', x, y, 1, 2]);
    }
    return { pieces: out, flames: flames };
  };

  // the pieces laid on the loaded floor: each square of each a prop of its own, sorted with the figures; the code's block and the chimney's rock under them let go
  IP.dress = function (m) {
    if (!IP.on || !D.SHEETS || !D.SHEETS[SHEET]) return;
    var up = m.def && m.def.key === In.UP, got = IP.find(up ? In.UPROWS : In.ROWS, up), mine = {};
    m.props = m.props.filter(function (p) { return !p.innProp; });
    got.pieces.forEach(function (pc) {
      for (var i = 0; i < pc[3]; i++) for (var j = 0; j < pc[4]; j++) (function (i, j) {
        var sq = m.at(pc[1] + i, pc[2] + j); if (!sq) return;
        mine[sq.x + ',' + sq.y] = 1;
        m.props.push({ innProp: true, kind: 'innprop', sq: sq, depth: sq.x + sq.y + 0.5, gz: 0, draw: function (ctx) {
          var sl = IP.slices(pc[0], 0, pc[3], pc[4], pc[5]), p = sl && sl[i + ',' + j]; if (!p) return;
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
    m.props = m.props.filter(function (p) { return p.innProp || !(p.sq && mine[p.sq.x + ',' + p.sq.y] && (p.kind === 'block' || p.kind === 'rock')); });
    if (m.isoFire) m.isoFire = m.isoFire.filter(function (q) { return !mine[q[0] + ',' + q[1]]; });
    m.sorted = null; IP.laid = got;
  };
  var load0 = iso.load;
  iso.load = function (def) { var m = load0.apply(this, arguments); if (def && ((def.key === In.KEY && def.inside === 'inn') || def.key === In.UP)) IP.dress(m); return m; };
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
