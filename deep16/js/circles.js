/* DEEP16 — the dwarves' circles and the lamp towers (10-07). Griz: "The dwarves have put teleportation circles at the lamps, and we'll
   use this for the one at the third lamp they use to get to the battle at the edifice" -- and the big one is the entrance at the
   lobstamonkee lighthouse, "the room under the light ... with the big portal they jump into".

   A map's `circle: { at: [gx, gy], sheet, sign, state }` lays his zodiac wheel (tools/wheel-sheet.py: zodiacwheel_p1 five squares
   across, zodiacwheel3_p1 three) in the floor with its middle on `at`'s square: `flush` (the default) lies in the floor, dormant, its
   colours pulled to the floor's ("one without the edge that blends in with the surroundings"); `risen` stands on its ledge with the
   highlight lit. `sign` is the one under the highlight (the sheet's `signs`; Pisces unless named). The door `&circle=risen` shows a
   map's circle risen. It is drawn on the ground (under the walls, the props and everyone standing on it) and its squares are floor.

   A map's `tower: [gx, gy]` stands a lamp tower on that square (the 8-bit game's lampTower: Third Lamp's, "a tower burning"): dwarf-
   cut stone, its lamp lit at the top, half cover like a stalagmite. Its light is the map's own `lights` entry. */
'use strict';
(function () {
  var D = window.D16, iso = D.iso;
  var C = D.circles = {};

  function P(r, i) { return D.PAL.ramps[r][i]; }
  function sheet(c) { return D.SHEETS && D.SHEETS[c.sheet]; }

  // the rise rows that match the floor it lies in: dressed stone (the dwarves' cut floors, drawn in silver) or the cave's brown
  C.riseOf = function (c, sh) {
    var q = iso.map && iso.map.at(c.at[0], c.at[1]), dressed = c.floor ? c.floor === 'dressed' : !!(q && (q.ch === '=' || q.ch === 'd'));
    return dressed && sh.anims.riseDressed ? 'riseDressed' : 'rise';
  };

  // ------------------------------------------------------------------ the circle in a fight: its state, and set going
  // B.circle (made on first sight of a map's `circle`): state 'flush' | 'rising' | 'risen' | 'spinning' | 'sinking'; `a` the angle it
  // stands at (degrees clockwise, 30 a sign: rest[k] under the highlight at 30k); `i` the rise row. The time is the wall clock's, so a
  // beat plays at its own pace whatever the fight's frame rate (the storyboard's motion, tools/wheel-play.html).
  var RISE_FPS = 12;
  function now() { return performance.now() / 1000; }
  C.run = function (B) {
    var c = B && B.map && B.map.def && B.map.def.circle; if (!c) return null;
    if (!B.circle) {
      var sh = sheet(c), q = new URLSearchParams(location.search).get('circle'), k = sh ? Math.max(0, sh.rest.indexOf(c.sign || 'pisces')) : 0;
      B.circle = { c: c, state: q === 'risen' ? 'risen' : c.state || 'flush', a: 30 * k, i: 0, v: 0 };
    }
    return B.circle;
  };
  C.sign = function (B) { var r = C.run(B), sh = r && sheet(r.c); return sh ? sh.rest[((Math.round(r.a / 30) % 12) + 12) % 12] : null; };
  C.rise = function (B, done) { var r = C.run(B); if (!r) return done && done(); r.state = 'rising'; r.t0 = now(); r.done = done; };
  C.sink = function (B, done) { var r = C.run(B); if (!r) return done && done(); r.state = 'sinking'; r.t0 = now(); r.done = done; };
  // a spin to `sign` (null: the one it is on): a kick to speed in a quarter second, then slowing to a stop; o.dir -1 counter-clockwise
  // (the same frames played the other way), o.turns whole turns first, o.T its seconds
  C.spin = function (B, sign, o, done) {
    var r = C.run(B); if (!r) return done && done();
    o = o || {}; var sh = sheet(r.c), dir = o.dir || 1, t1 = 0.25, T = o.T || 3.6, turns = o.turns == null ? 3 : o.turns;
    var want = 30 * Math.max(0, sh.rest.indexOf(sign || C.sign(B))), d = ((dir * (want - r.a)) % 360 + 360) % 360 + 360 * turns;
    r.sp = { t0: now(), from: r.a, d: d, dir: dir, T: T, t1: t1, vmax: d / (t1 / 2 + (T - t1) / 3) }; r.state = 'spinning'; r.done = done;
  };
  // set going from flush: rise, then spin
  C.wake = function (B, sign, o, done) { var r = C.run(B); if (!r) return done && done(); if (r.state === 'flush') C.rise(B, function () { C.spin(B, sign, o, done); }); else C.spin(B, sign, o, done); };
  C.busy = function (B) { var r = B && B.circle; return !!(r && (r.state === 'rising' || r.state === 'sinking' || r.state === 'spinning')); };
  function step(r) {
    var sh = sheet(r.c), R = sh ? sh.anims.rise.frames : 8, t = now() - r.t0, fin = null;
    r.v = 0;
    if (r.state === 'rising') { r.i = Math.min(R - 1, Math.floor(t * RISE_FPS)); if (t * RISE_FPS >= R) { r.state = 'risen'; fin = r.done; } }
    else if (r.state === 'sinking') { r.i = Math.max(0, R - 1 - Math.floor(t * RISE_FPS)); if (t * RISE_FPS >= R) { r.state = 'flush'; r.i = 0; fin = r.done; } }
    else if (r.state === 'spinning') {
      var s = r.sp, tt = now() - s.t0, u;
      if (tt >= s.T) { r.a = ((s.from + s.dir * s.d) % 360 + 360) % 360; r.state = 'risen'; fin = r.done; }
      else if (tt < s.t1) { r.a = s.from + s.dir * s.vmax * tt * tt / (2 * s.t1); r.v = s.vmax * tt / s.t1; }
      else { u = (s.T - tt) / (s.T - s.t1); r.a = s.from + s.dir * s.vmax * (s.t1 / 2 + (s.T - s.t1) / 3 * (1 - u * u * u)); r.v = s.vmax * u * u; }
    }
    if (fin) { r.done = null; fin(); }
  }
  // the sheet cell to draw now: flush, rising and sinking are the rise rows for the floor; risen and spinning a spin frame (the blur
  // row above 400 degrees a second -- sharp frames stepped faster than half a cell a tick read as the wheel going backwards)
  C.cell = function (r) {
    var sh = sheet(r.c); if (!sh) return null;
    var k = ((Math.round(r.a / 30) % 12) + 12) % 12;
    if (r.state === 'flush' || r.state === 'rising' || r.state === 'sinking') return { sh: sh, sx: k * sh.fw, sy: (sh.anims[C.riseOf(r.c, sh)].row + (r.state === 'flush' ? 0 : r.i)) * sh.fh };
    var n = sh.anims.spin.frames, f = ((Math.round(r.a / sh.degPerFrame) % n) + n) % n, row = r.v > 400 ? sh.anims.blur.row : sh.anims.spin.row;
    return { sh: sh, sx: (f % sh.cols) * sh.fw, sy: (row + Math.floor(f / sh.cols)) * sh.fh };
  };
  C.draw = function (ctx, B) {
    var r = C.run(B); if (!r) return;
    step(r);
    var cell = C.cell(r); if (!cell) return;
    var im = D.images && D.images[cell.sh.image]; if (!im || !im.naturalWidth) { if (D.spr && !im) D.spr.load(cell.sh.image); return; }   // (a sheet no figure asked for: fetched now, drawn when it lands)
    var c = r.c, p = iso.center(c.at[0], c.at[1], iso.map ? iso.map.gz(c.at[0], c.at[1]) : 0), s = iso.toScreen(p.x, p.y);
    ctx.drawImage(im, cell.sx, cell.sy, cell.sh.fw, cell.sh.fh, Math.round(s.x - cell.sh.ax), Math.round(s.y - cell.sh.ay), cell.sh.fw, cell.sh.fh);
  };
  // the hub, the hole they go in and out by: its middle on the risen face (screen px) and its half-axes
  C.hub = function (B) {
    var r = C.run(B); if (!r) return null;
    var sh = sheet(r.c), c = r.c, p = iso.center(c.at[0], c.at[1], iso.map ? iso.map.gz(c.at[0], c.at[1]) : 0), s = iso.toScreen(p.x, p.y), A = 142 / 316 * sh.squares * 32 * Math.SQRT2 / 2 * (iso.inWorld ? 1 : iso.zoom);
    return { x: s.x, y: s.y - (r.state === 'flush' ? 0 : sh.lift), A: A, B: A / 2 };
  };

  // ------------------------------------------------------------------ the lamp tower
  var TOWER = null;
  function towerCanvas() {           // the stone, drawn once: a plinth, a banded shaft, a capital, the lamp's cage (its glass and flame per frame)
    if (TOWER) return TOWER;
    var w = 40, h = 92, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var x = cv.getContext('2d'), cx = w / 2, by = h - 6;
    function r(col, x0, y0, ww, hh) { x.fillStyle = col; x.fillRect(x0, y0, ww, hh); }
    // the plinth: a low block on the square, its top lit from the upper left
    for (var i = 0; i < 6; i++) { r(P('silver', 2), cx - 16 + i, by - 2 + Math.floor(i / 2), 1, 6); }
    r(P('silver', 3), cx - 14, by - 4, 14, 6); r(P('silver', 2), cx, by - 4, 14, 6); r(P('silver', 4), cx - 14, by - 5, 28, 1);
    // the shaft: dwarf-cut blocks, a lit face and a shadowed one, a mortar line every seven
    var top = 22;
    r(P('silver', 4), cx - 8, top, 8, by - 5 - top); r(P('silver', 3), cx, top, 8, by - 5 - top);
    for (var y = by - 12; y > top; y -= 7) { r(P('silver', 2), cx - 8, y, 16, 1); r(P('silver', 2), cx + ((y / 7) % 2 ? -3 : 2), y - 6, 1, 6); }
    r(P('silver', 5), cx - 8, top, 1, by - 5 - top);                                           // the lit edge
    // the capital: a wider ledge the lamp sits on
    r(P('silver', 5), cx - 11, top - 3, 22, 1); r(P('silver', 4), cx - 11, top - 2, 11, 3); r(P('silver', 2), cx, top - 2, 11, 3);
    // the cage: four posts and a roof, the glass left for the flame
    r(P('outline', 0), cx - 7, top - 17, 14, 1); r(P('outline', 0), cx - 5, top - 19, 10, 2); r(P('gold', 1), cx - 1, top - 21, 2, 2);
    r(P('outline', 0), cx - 7, top - 16, 1, 13); r(P('outline', 0), cx + 6, top - 16, 1, 13); r(P('outline', 0), cx - 1, top - 16, 1, 13);
    r(P('outline', 0), cx - 7, top - 4, 14, 1);
    TOWER = { canvas: cv, ax: cx, ay: by, top: top };
    return TOWER;
  }
  function towerProp(m, at, B) {
    var sq = m.at(at[0], at[1]);
    return { kind: 'tower', sq: sq, depth: at[0] + at[1] + 0.5, gz: sq.gz, draw: function (ctx) {
      var T = towerCanvas(), p = iso.center(at[0], at[1], sq.gz), s = iso.toScreen(p.x, p.y), x0 = Math.round(s.x - T.ax), y0 = Math.round(s.y - T.ay);
      ctx.drawImage(T.canvas, x0, y0);
      var t = Date.now() / 16, fl = Math.sin(t / 5 + at[0]) + Math.sin(t / 3.1);
      var gx = x0 + T.ax, gy = y0 + T.top - 16;                                                  // the glass: gold, the flame in it
      if (D.battle && D.battle.lampOut) { ctx.fillStyle = P('silver', 1); ctx.fillRect(gx - 6, gy, 12, 12); return; }   // (out: the game show's end, js/gameshow.js)
      ctx.fillStyle = P('gold', 3); ctx.fillRect(gx - 6, gy, 5, 12); ctx.fillRect(gx, gy, 6, 12);
      ctx.fillStyle = P('gold', 4); ctx.fillRect(gx - 6, gy, 1, 12);
      ctx.fillStyle = P('fire', 1); ctx.fillRect(gx - 3, gy + 4 - (fl > 0.8 ? 1 : 0), 6, 7);
      ctx.fillStyle = P('fire', 2); ctx.fillRect(gx - 2, gy + 6 - (fl > 0.3 ? 1 : 0), 4, 4);
      ctx.fillStyle = P('bone', 2); ctx.fillRect(gx - 1, gy + 8, 2, 2);
      ctx.globalAlpha = 0.18 + 0.06 * fl; ctx.fillStyle = P('fire', 2);                       // its glow round the cage
      ctx.beginPath(); ctx.ellipse(gx, gy + 6, 16, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    } };
  }

  // a map's tower: on its square at load, standing (not walked through; half cover, as a stalagmite)
  var load0 = iso.load;
  iso.load = function (def) {
    var m = load0.apply(this, arguments);
    if (def.tower) { var sq = m.at(def.tower[0], def.tower[1]); if (sq) { sq.walk = false; sq.pillar = true; sq.stands = 'the lamp tower'; m.props.push(towerProp(m, def.tower)); m.sorted = null; } }
    return m;
  };

  // the circle on the ground, under the spell grounds and the rings (js/looks.js LK.ground, drawn after the floor and before anyone standing)
  if (D.looks && D.looks.ground) {
    var ground0 = D.looks.ground;
    D.looks.ground = function (ctx, B, onSq) { C.draw(ctx, B); return ground0.apply(this, arguments); };
  }
})();
