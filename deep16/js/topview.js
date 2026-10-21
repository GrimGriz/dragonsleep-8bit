/* DEEP16 — THE TOWN'S VIEW, north up (10-20, the Silverton roam seat). Griz, on the town drawn on the grid's diamonds: "the iso is too much for the town", and asked
   whether by "N/S" he meant doors on the north and south walls or the town turned, "North up the screen". A map whose def says `view: 'top'` is drawn from above
   and a little to the south, as a 16-bit town is: square tiles, north up the screen, each roof seen from above with its south wall under it, a figure standing on
   its tile. Only the drawing changes -- the squares, the rules, the walk and the doors are the grid's own -- so while such a map is the one loaded (iso.map.top),
   iso.center, iso.pick, iso.rhombus, iso.cornerW, iso.draw and the sprites' facings answer for this view, and every other map is drawn as ever.
   Painted as tiles: a few of each kind made once in code and laid by the square (the floor in pages of PAGE px as the camera comes, as js/iso.js pages a big one),
   the buildings' roofs and walls one picture a look. Heights stand as the grid's do: a square's top raised by its height, and a south face down to its neighbour. */
'use strict';
(function () {
  var D = window.D16, iso = D.iso, NZ = iso.noise;
  var TV = D.topview = {};
  TV.TS = 48;        // a square's px across and down
  TV.PAGE = 1024;    // a page of the floor's px
  TV.CLIFF = 64;     // a rock's face where open ground lies south of it (the mountain's foot, the Edifice's front), px
  TV.ROOMWALL = 40;  // a room's wall (js/town.js T.room): its back wall's face over the floor; the front wall a stub, so the floor and the door show (10-20, Griz: "1 north up", the rooms too)
  TV.BLOCK = { k: 10, f: 12, w: 8, K: 16, S: 40, y: 6 }; // (a block's px: a crate or a stall, a rail, a well, a shop's counter and its shelves, a cot's frame)
  var on = function () { return !!(iso.map && iso.map.top); };

  // ------------------------------------------------------------------ the view's geometry, while a top map is loaded
  var center0 = iso.center, pick0 = iso.pick, rhombus0 = iso.rhombus, draw0 = iso.draw, load0 = iso.load, facing0 = D.spr.facingFor;
  iso.center = function (gx, gy, gz) { if (!on()) return center0(gx, gy, gz); return { x: (gx + 0.5) * TV.TS, y: (gy + 0.5) * TV.TS - (gz || 0) }; };
  iso.cornerW = function (gx, gy) { return on() ? { x: gx * TV.TS, y: gy * TV.TS } : { x: (gx - gy) * iso.TW / 2, y: (gx + gy) * iso.TH / 2 }; }; // (a square's top-left corner in world px: js/roam.js's box and ground lines)
  iso.rhombus = function (ctx, gx, gy, gz, inset) {
    if (!on()) return rhombus0(ctx, gx, gy, gz, inset);
    var T = TV.TS, k = (inset || 0) * 0.6, z = iso.inWorld ? 1 : iso.zoom, a = iso.toScreen(gx * T, gy * T - (gz || 0));
    ctx.beginPath(); ctx.rect(a.x + k * z, a.y + k * z, (T - 2 * k) * z, (T - 2 * k) * z);
  };
  iso.pick = function (sx, sy, prefZ) {
    if (!on()) return pick0(sx, sy, prefZ);
    var m = iso.map, T = TV.TS, z = iso.inWorld ? 1 : iso.zoom, hw = iso.inWorld ? D.W / iso.zoom / 2 : D.W / 2, hh = iso.inWorld ? D.H / iso.zoom / 2 : D.H / 2;
    var wx = (sx + 0.5 - hw) / z + iso.cam.x, wy = (sy + 0.5 - hh) / z + iso.cam.y, gx = Math.floor(wx / T), best = null;
    for (var gy = Math.floor(wy / T); gy <= Math.floor(wy / T) + 8; gy++) { var s = m.at(gx, gy); if (s && s.open && wy >= gy * T - s.gz && wy < (gy + 1) * T - s.gz) best = s; } // (the front-most square whose raised top is under the point)
    return best;
  };
  // the figures' facings by the screen: up the screen is north here (the grid's -y), where on the diamonds it is the grid's -x -y
  var TOPSTEP = { '0,1': 0, '-1,1': 1, '-1,0': 2, '-1,-1': 3, '0,-1': 4, '1,-1': 5, '1,0': 6, '1,1': 7 };
  D.spr.facingFor = function (dx, dy) { if (!on()) return facing0(dx, dy); var k = Math.sign(dx) + ',' + Math.sign(dy); return TOPSTEP[k] == null ? 0 : TOPSTEP[k]; };
  TV.arrows = function (held) { return [(held.right ? 1 : 0) - (held.left ? 1 : 0), (held.down ? 1 : 0) - (held.up ? 1 : 0)]; }; // (the arrows the screen's ways: js/roam.js)

  // ------------------------------------------------------------------ the map: loaded as the grid loads it (its squares, its heights, the rules' reading), then its picture made here
  iso.load = function (def) {
    if (def && def.view === 'top') def.page = true; // (the diamonds' picture is never painted for it: their pages only listed)
    var m = load0.apply(this, arguments);
    if (def && def.view === 'top') TV.prepare(m);
    return m;
  };
  TV.prepare = function (m) {
    var T = TV.TS, maxZ = 0; m.sq.forEach(function (s) { maxZ = Math.max(maxZ, s.gz || 0); });
    var top = Math.max(TV.CLIFF, Math.max.apply(null, Object.keys(m.def.roofs || { x: 1 }).map(function (k) { return iso.roofPx ? iso.roofPx(m, k) : 0; }))) + maxZ + 8;
    var W = m.w * T, H = m.h * T + top, cols = Math.ceil(W / TV.PAGE), rows = Math.ceil(H / TV.PAGE), pages = [];
    for (var i = 0; i < cols * rows; i++) pages.push({ c: i % cols, r: Math.floor(i / cols), cv: null, used: 0 });
    m.top = { y0: -top, cols: cols, rows: rows, pages: pages, tiles: {}, props: [], baked: 0, frame: 0 };
    m.bake = { canvas: { width: W, height: H }, x: 0, y: -top, top: true }; // (the camera's bounds and the zoom steps read its size: js/ui.js)
    // the standing things: every rock and roofed square, every block (crates, the stockade's posts, wells), one prop a square, sorted by row
    m.sq.forEach(function (s) { if ((!s.open || s.block) && !(s.ch === 'y' && m.def.cots)) m.top.props.push({ sq: s, depth: s.y + 0.5 + s.x * 1e-4 }); });
    m.top.props.sort(function (a, b) { return a.depth - b.depth; });
  };

  // ------------------------------------------------------------------ the tiles: a few of each ground made once, in code (iso.noise, the palette's ramps)
  var R = function (n) { return iso.ramp(n); };
  function tileKey(m, s) {
    var ch = s.ch, v = NZ.h2(s.x * 3 + 1, s.y * 5 + 2, 71) * 4 | 0, kind = ch;
    if (ch === '.' && !m.def.room) kind = NZ.fbm(s.x * 0.13, s.y * 0.13, 77) > 0.52 ? 'g' : '.'; // (the ground: grass in patches over the dirt -- not in a room)
    if (s.block || !s.open) kind = '.';
    var n = m.at(s.x, s.y - 1), shade = n && (!n.open || n.block) ? 1 : 0; // (a building or a rock to the north: its shadow on the top of this one)
    return kind + v + (shade ? 's' : '');
  }
  function tileCanvas(m, s) {
    var key = tileKey(m, s), T = TV.TS; if (m.top.tiles[key]) return m.top.tiles[key];
    var cv = document.createElement('canvas'); cv.width = T; cv.height = T;
    var cx = cv.getContext('2d'), img = cx.createImageData(T, T), px = img.data, kind = key.charAt(0), v0 = +key.charAt(1), seed = 300 + v0 * 17 + kind.charCodeAt(0);
    var leather = R('leather'), moss = R('moss'), stone = R('stone'), silver = R('silver'), blue = R('blue'), violet = R('violet');
    for (var y = 0; y < T; y++) for (var x = 0; x < T; x++) {
      var u = x / T, w = y / T, n = NZ.vnoise(u * 3 + v0 * 7, w * 3, seed), fine = NZ.h2(x, y, seed + 3), col;
      if (kind === '=' || kind === 'd') { var seam = x % (T / 2) === 0 || y % (T / 2) === 0 || (y % (T / 4) === 0 && ((x / (T / 2)) | 0) % 2); col = seam ? silver[1] : NZ.rampPick(silver, 0.3 + n * 0.3 + (kind === 'd' ? 0.15 : 0), x, y); }
      else if (kind === 'o') { var bd = (y / 8) | 0, sm = y % 8 === 0 || (x + bd * 19) % 32 === 0; col = sm ? leather[0] : NZ.rampPick(leather, 0.42 + (NZ.h2(bd, ((x + bd * 19) / 32) | 0, seed + 4) - 0.5) * 0.25 + n * 0.15, x, y); } // (boards along the row, their ends staggered)
      else if (kind === 'g') col = fine > 0.985 ? stone[4] : NZ.rampPick(moss, 0.2 + n * 0.65, x, y);
      else if (kind === ',') col = fine > 0.99 ? stone[5] : NZ.rampPick(leather, 0.45 + n * 0.3, x, y);
      else if (kind === '~' || kind === 'D') { var gl = NZ.h2(x >> 1, y, seed + 8) > 0.985; col = gl ? silver[5] : NZ.rampPick(blue, (kind === 'D' ? 0.15 : 0.4) + n * 0.25, x, y); if (!gl && NZ.vnoise(u * 2, w * 6, seed + 9) > 0.8) col = violet[2]; }
      else if (kind === 'r') { var st = NZ.vnoise(u * 5, w * 5, seed + 5); col = st > 0.62 ? NZ.rampPick(stone, 0.35 + (st - 0.62) * 1.2, x, y) : NZ.rampPick(leather, 0.25 + n * 0.3, x, y); }
      else col = fine > 0.985 ? stone[5] : NZ.rampPick(leather, 0.22 + n * 0.4, x, y); // (beaten earth)
      if (key.indexOf('s') > 0 && w < 0.22) col = [col[0] * 0.62 | 0, col[1] * 0.6 | 0, col[2] * 0.66 | 0]; // (the shadow of what stands to the north)
      var o = (y * T + x) * 4; px[o] = col[0]; px[o + 1] = col[1]; px[o + 2] = col[2]; px[o + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    return (m.top.tiles[key] = cv);
  }
  // a page of the floor: each open square's tile at its height, a raised one's south face down to the square below it
  function paintPage(m, p) {
    var T = TV.TS, PG = TV.PAGE, top = m.top, cv = document.createElement('canvas'); cv.width = PG; cv.height = PG;
    var cx = cv.getContext('2d'), x0 = p.c * PG, y0 = p.r * PG + top.y0, stone = R('stone');
    var gx0 = Math.max(0, Math.floor(x0 / T)), gx1 = Math.min(m.w - 1, Math.floor((x0 + PG) / T)), gy0 = Math.max(0, Math.floor(y0 / T)), gy1 = Math.min(m.h - 1, Math.floor((y0 + PG) / T) + 8);
    for (var gy = gy0; gy <= gy1; gy++) for (var gx = gx0; gx <= gx1; gx++) {
      var s = m.at(gx, gy); if (!s) continue;
      var x = gx * T - x0, y = gy * T - s.gz - y0;
      if (y > PG || y + T < 0) continue;
      if (s.open || s.block) cx.drawImage(tileCanvas(m, s), x, y); // (a built square's top is its roof, drawn standing; its bank below is still the page's)
      var sb = m.at(gx, gy + 1), drop = sb ? s.gz - sb.gz : 0; // (a raised square's face toward the lower one south of it, open or built on: the town's slope off Fountain Street)
      if (drop > 0) { var bank = R('leather'); for (var j = 0; j < drop; j++) { cx.fillStyle = 'rgb(' + (j === 0 ? stone[5] : bank[j < drop / 3 ? 3 : j < drop * 2 / 3 ? 2 : 1]).join(',') + ')'; cx.fillRect(x, y + T + j, T, 1); } } // (a bank of the worn dirt, lit at its lip, darker down to the lower ground -- it read as a black band)
    }
    p.cv = cv; m.top.baked++;
  }

  // ------------------------------------------------------------------ the standing things: a roof seen from above with its wall below, a rock's top and its face, a block
  function standCanvas(m, s) {
    var RF = m.def.roofs && m.def.roofs[s.ch], T = TV.TS, sb = m.at(s.x, s.y + 1), same = function (q) { return !!(q && !q.open && q.ch === s.ch); };
    var rock = !RF && !s.open, face = RF ? !same(sb) : rock ? !!(sb && (sb.open || sb.block)) : true, door = !!(sb && sb.ch === 'd') || !!(m.def.faceDoors && m.def.faceDoors[s.x + ',' + s.y]), side = m.def.slope ? +m.def.slope[s.y].charAt(s.x) || 0 : 0, v0 = NZ.h2(s.x, s.y, 41) * 3 | 0;
    var inRoom = rock && !!m.def.room, front = inRoom && s.y === m.h - 1;
    var hgt = RF ? iso.roofPx(m, s.ch) : inRoom ? (front ? 6 : TV.ROOMWALL) : rock ? TV.CLIFF : (TV.BLOCK[s.ch] || 8); // (the lift: a roof its height, every rock the cliff's -- one plane -- a room's wall its own, a block its own)
    var key = s.ch + side + (face ? 'F' : '') + (door ? 'D' : '') + v0 + ':' + hgt + (inRoom ? 'r' : '') + (s.ch === 'S' ? m.def.goods || '' : '');
    m.top.stand = m.top.stand || {}; if (m.top.stand[key]) return m.top.stand[key];
    var Hh = T + (face ? hgt : 0), cv = document.createElement('canvas'); cv.width = T; cv.height = Hh;
    var cx = cv.getContext('2d'), img = cx.createImageData(T, Hh), px = img.data, seed = 600 + v0 * 13 + s.ch.charCodeAt(0);
    var roof = R((RF && RF.roof) || 'red'), wall = R((RF && RF.wall) || 'stone'), stone = R('stone'), leather = R('leather'), silver = R('silver'), red = R('red'), goods = R(m.def.goods || 'gold');
    var put = function (x, y, c) { if (x < 0 || y < 0 || x >= T || y >= Hh) return; var o = (y * T + x) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255; };
    var ns = side > 3, sd = ns ? side - 3 : side; // (the ridge: 1-3 a roof whose ridge runs east-west, 4-6 north-south -- js/town.js)
    for (var y = 0; y < T; y++) for (var x = 0; x < T; x++) { // the top
      var u = x / T, w = y / T, n = NZ.vnoise(u * 3 + v0 * 5, w * 3, seed), c;
      if (RF) {
        var row = ns ? x : y, along = ns ? y : x, lit = sd === 1 ? 0.14 : sd === 2 ? -0.1 : 0;
        var course = row % 6 === 0, joint = (along + ((row / 6 | 0) % 2) * 4) % 8 === 0, ridge = sd === 3 && Math.abs((ns ? u : w) - 0.5) < 0.12;
        c = NZ.rampPick(roof, Math.max(0.02, 0.42 + lit + n * 0.2 - (course ? 0.16 : 0) - (joint ? 0.08 : 0) - (ridge ? 0.18 : 0)), x, y);
      } else if (inRoom) c = NZ.rampPick(leather, 0.12 + n * 0.1 + (x % 12 === 0 ? -0.08 : 0), x, y); // (a room's wall from above: its timber cap)
      else if (rock) c = NZ.rampPick(stone, 0.12 + n * 0.3 + (NZ.h2(x, y, seed) > 0.97 ? 0.2 : 0), x, y);
      else if (s.ch === 'K') { if (w < 0.18 || w > 0.82) continue; c = NZ.rampPick(stone, (x + y * 2) % 10 === 0 ? 0.3 : 0.62 + n * 0.12, x, y); } // (the counter's top, worn pale)
      else if (s.ch === 'S') { if (w > 0.4) continue; c = NZ.rampPick(leather, 0.25 + n * 0.1, x, y); } // (the shelves' top, a board against the wall)
      else if (s.ch === 'w') { var rr = Math.hypot(u - 0.5, w - 0.5); if (rr > 0.42) continue; c = rr < 0.26 ? stone[0] : NZ.rampPick(stone, 0.5 + n * 0.2, x, y); }
      else if (s.ch === 'f') { if (x % 12 > 3 && !(w > 0.4 && w < 0.6)) continue; c = NZ.rampPick(leather, 0.55 + n * 0.2, x, y); } // (the stockade's posts and its rail)
      else { if (u < 0.12 || u > 0.88 || w < 0.12 || w > 0.88) continue; c = NZ.rampPick(leather, (x + y) % 9 === 0 ? 0.2 : 0.5 + n * 0.2, x, y); } // (a crate or a stall)
      put(x, y + (face || rock ? 0 : 0), c);
    }
    if (face) for (var j = 0; j < hgt; j++) for (var x2 = 0; x2 < T; x2++) { // the south face, under the top
      var y2 = T + j, up = 1 - j / Math.max(1, hgt), c2;
      if (RF) {
        var post = x2 % 16 === 0, beam = Math.abs(up - 0.5) < 0.06, win = up > 0.6 && up < 0.85 && x2 % 16 > 4 && x2 % 16 < 11;
        c2 = NZ.rampPick(wall, (j > hgt - 3 ? 0.3 : 0.6) - (post || beam ? 0.25 : 0) + (NZ.vnoise(x2 * 0.3, j * 0.2, seed + 2) - 0.5) * 0.1, x2, y2);
        if (win && !door) c2 = stone[0];
        if (door && x2 >= T / 2 - 9 && x2 <= T / 2 + 8 && up < 0.92) { var fr = x2 === T / 2 - 9 || x2 === T / 2 + 8 || up > 0.86; c2 = fr ? silver[4] : up > 0.8 ? leather[1] : NZ.rampPick(leather, 0.35 + ((x2 - T / 2) % 4 === 0 ? -0.15 : 0), x2, y2); } // (a door: a frame, planks, plain to see -- his "obvious doors on the shops")
      } else if (inRoom) { var pst = x2 % 16 === 0, skirt = j > hgt - 5, rail = Math.abs(up - 0.62) < 0.05; c2 = NZ.rampPick(R('bone').length ? stone : stone, (skirt ? 0.25 : 0.62) - (pst || rail ? 0.22 : 0) + (NZ.vnoise(x2 * 0.3, j * 0.2, seed + 2) - 0.5) * 0.08, x2, y2); } // (plaster between timbers, a skirting at the floor)
      else if (s.ch === 'K') { if (x2 === 0 || x2 === T - 1) { put(x2, y2, red[0]); continue; } c2 = NZ.rampPick(red, (x2 % 8 === 0 ? 0.15 : 0.45) - (j > hgt - 3 ? 0.15 : 0), x2, y2); } // (the counter's front, planks)
      else if (s.ch === 'S') { var shelf = j % 10 === 0 || x2 % 16 === 0, gk = NZ.h2((x2 >> 2) + s.x * 17, (j / 10 | 0) + s.y * 13, seed + 3); c2 = shelf ? NZ.rampPick(leather, 0.6, x2, y2) : gk > 0.35 && (j % 10) > 1 && (j % 10) < 9 - ((x2 >> 2) % 3) ? NZ.rampPick(goods, 0.25 + gk * 0.7, x2, y2) : NZ.rampPick(leather, 0.08, x2, y2); } // (the shelves' face: boards, and the trade's goods on them)
      else if (rock) { var band = NZ.vnoise(x2 * 0.08 + s.x * 3, (j + s.y * 11) * 0.2, seed); c2 = NZ.rampPick(stone, 0.3 + (band - 0.5) * 0.35 - up * 0.15, x2, y2); if (door && x2 > 6 && x2 < T - 6 && up < 0.7) c2 = (x2 % 8 === 0 || up > 0.66) ? silver[3] : NZ.rampPick(leather, 0.3, x2, y2); }
      else c2 = NZ.rampPick(s.ch === 'w' ? stone : leather, 0.3, x2, y2);
      if (s.ch === 'f' && x2 % 12 > 3) continue;
      if (s.ch === 'w' && Math.abs(x2 - T / 2) > T * 0.42) continue;
      if ((s.ch === 'k') && (x2 < T * 0.12 || x2 > T * 0.88)) continue;
      put(x2, y2, c2);
    }
    cx.putImageData(img, 0, 0);
    return (m.top.stand[key] = { canvas: cv, h: hgt, face: face });
  }

  // ------------------------------------------------------------------ the drawing: the floor's pages in view (and one more nearby a frame), then everything standing, by row
  iso.draw = function (ctx, objs, overlay) {
    if (!on()) return draw0.apply(this, arguments);
    var m = iso.map, top = m.top, T = TV.TS, PG = TV.PAGE, f = ++top.frame, vw = iso.inWorld ? D.W / iso.zoom : D.W, vh = iso.inWorld ? D.H / iso.zoom : D.H, z = iso.inWorld ? 1 : iso.zoom, near = null;
    var o = iso.toScreen(0, top.y0);
    for (var i = 0; i < top.pages.length; i++) {
      var p = top.pages[i], x = o.x + p.c * PG * z, y = o.y + p.r * PG * z;
      var inView = x < vw && y < vh && x + PG * z > 0 && y + PG * z > 0, nearV = x < vw + PG && y < vh + PG && x + PG * z > -PG && y + PG * z > -PG;
      if (inView) { if (!p.cv) paintPage(m, p); p.used = f; if (z === 1) ctx.drawImage(p.cv, x, y); else ctx.drawImage(p.cv, x, y, PG * z, PG * z); }
      else if (nearV && !p.cv && !near) near = p;
    }
    if (near) { paintPage(m, near); near.used = f; }
    if (top.baked > 40) { var held = top.pages.filter(function (q) { return q.cv && q.used < f; }).sort(function (a, b) { return a.used - b.used; }); for (var k = 0; k < held.length && top.baked > 40; k++) { held[k].cv = null; top.baked--; } }
    if (overlay) overlay(ctx);
    // the standing things in the rows the view shows (a tall one below the view may reach up into it), the map's own props and the frame's figures among them by row
    var g0 = iso.toScreen(0, 0), gyLo = Math.floor((-g0.y / z) / T) - 1, gyHi = Math.ceil(((vh - g0.y) / z + TV.CLIFF + 80) / T) + 1;
    var list = [];
    top.props.forEach(function (pp) { if (pp.sq.y >= gyLo && pp.sq.y <= gyHi) list.push({ d: pp.depth, stand: pp.sq }); });
    (m.props || []).forEach(function (pp) { if (pp.draw || (pp.img && pp.kind !== 'rock' && pp.kind !== 'block' && pp.kind !== 'stone' && pp.kind !== 'tile')) list.push({ d: pp.sq ? pp.sq.y + 0.55 + pp.sq.x * 1e-4 : pp.depth, prop: pp }); });
    (objs || []).forEach(function (ob) { var u = ob.unit; list.push({ d: u ? u.y + 0.6 + u.x * 1e-4 + (ob.depth % 1) * 1e-3 : ob.depth != null && ob.depth < 0 ? -1 : 1e6 + (ob.depth || 0), obj: ob }); });
    list.sort(function (a, b) { return a.d - b.d; });
    list.forEach(function (it) {
      if (it.obj) { it.obj.draw(ctx); return; }
      if (it.prop) { var pp = it.prop; if (pp.draw) { pp.draw(ctx); return; } var c0 = iso.center(pp.sq.x, pp.sq.y, pp.gz || 0), s0 = iso.toScreen(c0.x, c0.y); ctx.drawImage(pp.img.canvas, s0.x - pp.img.ax * z, s0.y - pp.img.ay * z, pp.img.canvas.width * z, pp.img.canvas.height * z); return; }
      var s = it.stand, pic = standCanvas(m, s), a = iso.toScreen(s.x * T, s.y * T - s.gz - pic.h);
      var wpx = T * z, hpx = pic.canvas.height * z; if (a.x >= vw || a.y >= vh || a.x + wpx <= 0 || a.y + hpx <= 0) return;
      if (z === 1) ctx.drawImage(pic.canvas, a.x, a.y); else ctx.drawImage(pic.canvas, a.x, a.y, wpx, hpx);
    });
  };
})();
