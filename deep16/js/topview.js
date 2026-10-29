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
  TV.SEE = 0.38; TV.SEETOWN = { silverton: 1 }; // (SEETOWN: the town floors whose houses are seen through too -- Silverton's streets, 10-28)     // a standing thing in front of the party on the mines' floors, drawn this faint (iso.draw; TV.seen counts them drawn so -- the bench's)
  TV.HALL = 2;       // a hallway's entrance on the mines' floors: the rock over its first squares from where it leaves a crossing, drawn faint always (TV.hallways)
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
    if (m.def.edifice) top = Math.max(top, Math.max(TV.edH(m), TV.FACEPX.tall * TV.EDFT / 20) - m.def.edifice.y0 * T + maxZ + 8); // (the Edifice's facade over the map's top rows, at either face setting)
    var W = m.w * T, H = m.h * T + top, cols = Math.ceil(W / TV.PAGE), rows = Math.ceil(H / TV.PAGE), pages = [];
    for (var i = 0; i < cols * rows; i++) pages.push({ c: i % cols, r: Math.floor(i / cols), cv: null, used: 0 });
    m.top = { y0: -top, cols: cols, rows: rows, pages: pages, tiles: {}, props: [], baked: 0, frame: 0, art: TV.artOn() };
    TV.artLoad(); // (the atlases fetched now, if they are not here yet: the floor drawn by the code till they land)
    m.bake = { canvas: { width: W, height: H }, x: 0, y: -top, top: true }; // (the camera's bounds and the zoom steps read its size: js/ui.js)
    // the standing things: every rock and roofed square, every block (crates, the stockade's posts, wells), one prop a square, sorted by row
    m.sq.forEach(function (s) { if ((!s.open || s.block) && !(s.ch === 'y' && m.def.cots) && !TV.isHexSq(m, s) && !TV.isEdSq(m, s)) m.top.props.push({ sq: s, depth: s.y + 0.5 + s.x * 1e-4 }); });
    if (m.def.hexagon) m.top.props.push({ hex: true, depth: m.def.hexagon.y + 0.5 }); // (the Hex, one picture: hexCanvas)
    if (m.def.edifice) m.top.props.push({ ed: true, depth: m.def.edifice.y1 + 0.5 }); // (the Edifice, one picture in strips: TV.edStrip)
    m.top.props.sort(function (a, b) { return a.depth - b.depth; });
  };

  // ------------------------------------------------------------------ the tiles: a few of each ground made once, in code (iso.noise, the palette's ramps)
  var R = function (n) { return iso.ramp(n); };
  function tileKind(m, s) {
    var ch = s.ch, kind = ch;
    if (ch === '.' && !m.def.room) kind = NZ.fbm(s.x * 0.13, s.y * 0.13, 77) > 0.52 ? 'g' : '.'; // (the ground: grass in patches over the dirt -- not in a room)
    if (s.block || !s.open) kind = '.';
    var lk = m.def.look && m.def.look[s.y] ? m.def.look[s.y].charAt(s.x) : ' '; if (lk && lk !== ' ') kind = lk; // (a floor's own ground under its squares: the Warrens' and the Galleries' -- js/mines.js, TV.LOOKS)
    return kind;
  }
  function tileKey(m, s) {
    var v = NZ.h2(s.x * 3 + 1, s.y * 5 + 2, 71) * 4 | 0, kind = tileKind(m, s);
    var n = m.at(s.x, s.y - 1), shade = n && (!n.open || n.block) ? 1 : 0; // (a building or a rock to the north: its shadow on the top of this one)
    return kind + v + (shade ? 's' : '');
  }
  function tileCanvas(m, s) {
    if (TV.artOn()) { var at = artTile(m, s); if (at) return m.top.tiles[at.key] || (m.top.tiles[at.key] = artCanvas(at)); } // (the art desk's tile where it has one: THE ART, below)
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
      else if (TV.LOOKS[kind]) col = TV.LOOKS[kind](u, w, n, fine, x, y, seed);
      else col = fine > 0.985 ? stone[5] : NZ.rampPick(leather, 0.22 + n * 0.4, x, y); // (beaten earth)
      if (key.indexOf('s') > 0 && w < 0.22) col = [col[0] * 0.62 | 0, col[1] * 0.6 | 0, col[2] * 0.66 | 0]; // (the shadow of what stands to the north)
      var o = (y * T + x) * 4; px[o] = col[0]; px[o + 1] = col[1]; px[o + 2] = col[2]; px[o + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    return (m.top.tiles[key] = cv);
  }
  // the mines' grounds (10-21 night, the top levels seat: the Warrens' and the Galleries' worked floors on these tiles -- js/mines.js): a floor's `look` names one a
  // square, by a letter that is no square's own. C the cave's floor, U guano's crust, Q the deep guano, R / H the cart rails north-south / east-west, Y gravel, M the
  // fungus beds, X a mine's dark mouth, Z a ladder laid on the guano. Each (u, w: the tile's fraction across and down; n its noise; fine a per-pixel hash) a colour
  TV.LOOKS = {
    C: function (u, w, n, fine, x, y) { var st = R('stone'); return fine > 0.975 ? st[5] : NZ.rampPick(st, 0.16 + n * 0.28, x, y); },
    U: function (u, w, n, fine, x, y, seed) { var bn = R('bone'), st = R('stone'), cr = NZ.vnoise(u * 7, w * 7, seed + 11); return fine > 0.95 ? bn[fine > 0.985 ? 1 : 0] : fine < 0.03 ? st[2] : cr > 0.68 ? NZ.rampPick(bn, 0.1 + n * 0.3, x, y) : NZ.rampPick(st, 0.58 + n * 0.32, x, y); }, // (a dusty brown crust, chalk-white where it has dried)
    Q: function (u, w, n, fine, x, y, seed) { var st = R('stone'), sv = R('silver'); return fine > 0.97 ? sv[4] : NZ.rampPick(st, 0.2 + n * 0.25 + (NZ.vnoise(u * 4, w * 4, seed + 12) > 0.65 ? 0.08 : 0), x, y); },
    R: function (u, w, n, fine, x, y) { return TV.rails(u, w, n, fine, x, y, false); },
    H: function (u, w, n, fine, x, y) { return TV.rails(w, u, n, fine, x, y, true); },
    Y: function (u, w, n, fine, x, y) { var st = R('stone'); return fine > 0.9 ? st[6] : fine < 0.08 ? st[1] : NZ.rampPick(st, 0.32 + n * 0.25, x, y); },
    M: function (u, w, n, fine, x, y, seed) { var mo = R('moss'), vi = R('violet'), bn = R('bone'), cap = NZ.h2(x >> 2, y >> 2, seed + 13); return cap > 0.93 ? (fine > 0.5 ? bn[0] : vi[4]) : cap > 0.86 ? vi[3] : NZ.rampPick(mo, 0.25 + n * 0.5, x, y); },
    X: function (u, w, n, fine, x, y) { var st = R('stone'); return NZ.rampPick(st, 0.02 + w * 0.14 + n * 0.05, x, y); },
    A: function (u, w, n, fine, x, y, seed) { var le = R('leather'), st = R('stone'), bl = R('blue'), wet = NZ.vnoise(u * 3, w * 3, seed + 14); return fine > 0.985 ? bl[3] : wet > 0.66 ? NZ.rampPick(st, 0.12 + n * 0.12, x, y) : NZ.rampPick(le, 0.1 + n * 0.35, x, y); }, // (bog mud: dark and wet, a glint of water)
    E: function (u, w, n, fine, x, y, seed) { var mo = R('moss'), le = R('leather'), stalk = (x + (NZ.h2(x >> 2, 0, seed + 15) * 6 | 0)) % 6 === 0 && NZ.h2(x, y >> 3, seed + 16) > 0.3; return stalk ? NZ.rampPick(le, 0.55 + n * 0.3, x, y) : NZ.rampPick(mo, 0.15 + n * 0.45, x, y); }, // (reeds: stalks standing out of the green)
    N: function (u, w, n, fine, x, y, seed) { var mo = R('moss'), gl = R('glow'), sp = NZ.h2(x >> 1, y >> 1, seed + 17); return sp > 0.94 ? gl[sp > 0.98 ? 2 : 1] : sp > 0.88 ? gl[0] : NZ.rampPick(mo, 0.35 + n * 0.5, x, y); }, // (the Glowseep's moss: green, flecked with its light)
    Z: function (u, w, n, fine, x, y) { var le = R('leather'), side = Math.abs(u - 0.28) < 0.05 || Math.abs(u - 0.72) < 0.05, rung = u > 0.28 && u < 0.72 && (Math.floor(w * 48) % 12) < 3; return side || rung ? NZ.rampPick(le, side ? 0.7 : 0.5, x, y) : TV.LOOKS.U(u, w, n, fine, x, y, 0); }
  };
  // a cart track: two iron rails along it (a, the across fraction; b, the along), sleepers under them every quarter, the cave's floor between
  TV.rails = function (a, b, n, fine, x, y) {
    var sv = R('silver'), le = R('leather'), rail = Math.abs(a - 0.3) < 0.035 || Math.abs(a - 0.7) < 0.035, tie = (Math.floor(b * 48) % 12) < 3 && a > 0.2 && a < 0.8;
    if (rail) return Math.abs(a - 0.3) < 0.015 || Math.abs(a - 0.7) < 0.015 ? sv[5] : sv[3];
    if (tie) return NZ.rampPick(le, 0.35 + n * 0.2, x, y);
    return TV.LOOKS.C(a, b, n, fine, x, y);
  };
  // a page of the floor: each open square's tile at its height, a raised one's south face down to the square below it
  function paintPage(m, p) {
    var T = TV.TS, PG = TV.PAGE, top = m.top, cv = document.createElement('canvas'); cv.width = PG; cv.height = PG;
    var cx = cv.getContext('2d'), x0 = p.c * PG, y0 = p.r * PG + top.y0, stone = R('stone');
    var gx0 = Math.max(0, Math.floor(x0 / T)), gx1 = Math.min(m.w - 1, Math.floor((x0 + PG) / T)), gy0 = Math.max(0, Math.floor(y0 / T)), gy1 = Math.min(m.h - 1, Math.floor((y0 + PG) / T) + 8);
    for (var gy = gy0; gy <= gy1; gy++) for (var gx = gx0; gx <= gx1; gx++) {
      var s = m.at(gx, gy); if (!s) continue;
      var x = gx * T - x0, y = gy * T - s.gz - y0;
      if (y > PG || y + T < 0) continue;
      if (s.open || s.block || TV.isHexSq(m, s)) cx.drawImage(tileCanvas(m, s), x, y); // (a built square's top is its roof, drawn standing; its bank below is still the page's -- the Hex's squares the ground round its picture)
      var sb = m.at(gx, gy + 1), drop = sb ? s.gz - sb.gz : 0; // (a raised square's face toward the lower one south of it, open or built on: the town's slope off Fountain Street)
      if (drop > 0 && TV.artOn() && TV.place(m) === 'town') { artBank(m, cx, gx, gy, x, y + T, drop); continue; } // (the art desk's bank: its stone lip and its timbered face)
      if (drop > 0) { var bank = R('leather'); for (var j = 0; j < drop; j++) { cx.fillStyle = 'rgb(' + (j === 0 ? stone[5] : bank[j < drop / 3 ? 3 : j < drop * 2 / 3 ? 2 : 1]).join(',') + ')'; cx.fillRect(x, y + T + j, T, 1); } } // (a bank of the worn dirt, lit at its lip, darker down to the lower ground -- it read as a black band)
    }
    if (TV.artOn() && m.def.edifice && TV.place(m) === 'town') TV.basins(m, cx, x0, y0); // (the fountains' basins at the Edifice's foot, whole: THE ART, TV.basins)
    if (m.def.underlay) m.def.underlay(cx, x0, y0); // (a floor's own picture over its tiles, drawn on its true lines: the Hex's inside, js/hex.js)
    p.cv = cv; m.top.baked++;
  }

  // ------------------------------------------------------------------ the standing things: a roof seen from above with its wall below, a rock's top and its face, a block
  function standCanvas(m, s) {
    if (TV.artOn()) { var ap = artStand(m, s); if (ap) return ap; } // (the art desk's roof, face, rock or prop where it has one: THE ART, below)
    return standCode(m, s);
  }
  function standCode(m, s) {
    var RF = m.def.roofs && m.def.roofs[s.ch], T = TV.TS, sb = m.at(s.x, s.y + 1), same = function (q) { return !!(q && !q.open && q.ch === s.ch); };
    var rock = !RF && !s.open, face = RF ? !same(sb) : rock ? !!(sb && (sb.open || sb.block)) : true, door = !!(sb && sb.ch === 'd'), shut = !door && !!(m.def.faceDoors && m.def.faceDoors[s.x + ',' + s.y]), sign = (RF && m.def.signs && m.def.signs[s.x + ',' + s.y]) || '', side = m.def.slope ? +m.def.slope[s.y].charAt(s.x) || 0 : 0, v0 = NZ.h2(s.x, s.y, 41) * 3 | 0;
    var inRoom = rock && !!m.def.room, front = inRoom && s.y === m.h - 1;
    var hgt = RF ? iso.roofPx(m, s.ch) : inRoom ? (front ? 6 : TV.ROOMWALL) : rock ? TV.CLIFF : (TV.BLOCK[s.ch] || 8); // (the lift: a roof its height, every rock the cliff's -- one plane -- a room's wall its own, a block its own)
    var key = s.ch + side + (face ? 'F' : '') + (door ? 'D' : '') + (shut ? 'X' : '') + (sign ? 'S' + sign : '') + v0 + ':' + hgt + (inRoom ? 'r' : '') + (s.ch === 'S' ? m.def.goods || '' : '');
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
        else if (shut && x2 >= T / 2 - 7 && x2 <= T / 2 + 6 && up < 0.84) { var bar = Math.abs(up - 0.42) < 0.08, edge = x2 === T / 2 - 7 || x2 === T / 2 + 6 || up > 0.78; c2 = bar ? leather[3] : edge ? stone[0] : NZ.rampPick(stone, 0.1 + ((x2 + 1) % 4 === 0 ? -0.06 : 0), x2, y2); } // (a house's shut door: a dark slab with a plank nailed across, no frame -- "clearly different (you can't go in)")
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
    if (sign) { var NS = 8 * TV.SIGNX + 4; TV.signPx(put, T / 2 - NS / 2, T - NS + 3, sign); } // (the store's sign hung over its door, from the eave)
    cx.putImageData(img, 0, 0);
    return (m.top.stand[key] = { canvas: cv, h: hgt, face: face });
  }

  // ------------------------------------------------------------------ the stores' signs (10-21, Griz: "do versions of the shop icons from the 8bit outside the stores"): the
  // 8-bit's door signs (js/world.js SIGNS, its 8x8 glyphs, one a store by content/maps/silverton.json's trigger `icon`) at twice the size on a 16-bit board -- each glyph
  // square two by two, lit at its top-left, a shadow at its foot; the board's planks framed dark, its top edge catching the light, two chains up to the eave
  TV.SIGNS = {
    ring: ['........', '..oooo..', '.o....o.', 'o......o', 'o......o', '.o....o.', '..oooo..', '........'],
    scales: ['...##...', 'oooooooo', 'o..##..o', 'o..##..o', 'ooo##ooo', '...##...', '...##...', '.######.'],
    coin: ['..oooo..', '.o#oo#o.', 'o#oooo#o', 'o#oooo#o', 'o#oooo#o', 'o#oooo#o', '.o#oo#o.', '..oooo..'],
    potion: ['...##...', '...ww...', '...ww...', '..rrrr..', '.rrrrrr.', '.rrwrrr.', '.rrrrrr.', '..rrrr..'],
    bed: ['........', '#.......', '#ww.....', '#wwbbbbb', '#bbbbbbb', '########', '#......#', '........'],
    star: ['...o....', '...o....', 'ooooooo.', '.ooooo..', '..ooo...', '.oo.oo..', '.o...o..', '........'],
    pack: ['..####..', '.#oooo#.', '#oooooo#', '#o####o#', '#oooooo#', '#oooooo#', '#oooooo#', '.######.'],
    candle: ['...o....', '..ooo...', '...o....', '..www...', '..www...', '..www...', '..www...', '.#####..'],
    sword: ['......w.', '.....w..', '....w...', '...w....', '#.w.....', '.#......', 'o.#.....', '........'],
    stitch: ['...rr...', '...rr...', '.rrrrrr.', '.rrrrrr.', '...rr...', '...rr...', '...rr...', '........'],
    sun: ['o..o..o.', '.o.o.o..', '..ooo...', 'oooooooo', '..ooo...', '.o.o.o..', 'o..o..o.', '........'],
    mortar: ['.....#..', '....#...', '...#....', 'ogggggo.', '.ooooo..', '.ooooo..', '..ooo...', '.#####..'],
    jar: ['..####..', '..#ww#..', '.#gggg#.', '#gg#ggg#', '#ggg#gg#', '#gggggg#', '.######.', '........']
  };
  TV.signPx = function (put, x0, y0, kind) {
    var g = TV.SIGNS[kind]; if (!g) return;
    var lea = R('leather'), gold = R('gold'), red = R('red'), bone = R('bone'), orc = R('orc'), blue = R('blue'), ink = [16, 16, 24];
    var COL = { '#': [ink, ink], o: [gold[4], gold[3]], w: [bone[2], bone[0]], r: [red[4], red[3]], g: [orc[3], orc[2]], b: [blue[3], blue[2]] };
    var S = TV.SIGNX, N = 8 * S + 4; // (the glyph's square S px; the board N across and down)
    for (var cy = 0; cy < 2; cy++) { put(x0 + 5, y0 - 2 + cy, ink); put(x0 + N - 6, y0 - 2 + cy, ink); } // (the chains)
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) put(x0 + x, y0 + y, x === 0 || y === 0 || x === N - 1 || y === N - 1 ? lea[0] : y === 1 ? lea[3] : (y - 2) % 7 === 6 ? lea[1] : lea[2]); // (the board: frame, lit edge, planks)
    for (var gy = 0; gy < 8; gy++) for (var gx = 0; gx < 8; gx++) {
      var c = COL[g[gy].charAt(gx)]; if (!c) continue;
      for (var j = 0; j < S; j++) for (var i = 0; i < S; i++) put(x0 + 2 + gx * S + i, y0 + 2 + gy * S + j, i === 0 && j === 0 ? c[0] : (j === 0 || i === 0) && c[0] !== c[1] ? c[0] : c[1]); // (lit along its top and left)
      var below = g[gy + 1] && COL[g[gy + 1].charAt(gx)]; if (!below && gy < 7) for (var i2 = 0; i2 < S; i2++) put(x0 + 3 + gx * S + i2, y0 + 2 + (gy + 1) * S, lea[1]); // (its shadow on the board)
    }
  };
  TV.SIGNX = 3;
  // the store's name on its sign (10-28, Griz: "store names popup on sign mouseover"): a sign hangs at the eave of the square over its door (js/town.js signs, signDoor);
  // the mouse on the sign, or on the face and the door under it, names the store in a box over the screen (TV.signTip, from js/roam.js R.screenOver)
  TV.faceOf = function (m, s) { return TV.artOn() && TV.ROOFART[s.ch] && TV.ART.tall ? (/[buB]/.test(s.ch) ? TV.FACEPX.tall : TV.FACEPX.low) : iso.roofPx(m, s.ch); }; // (a roof's south face, px: as artRoof and standCode stand it)
  TV.signAt = function (m, sx, sy) {
    if (!m || !m.top || !m.def.signs) return null;
    var T = TV.TS, out = null;
    Object.keys(m.def.signs).forEach(function (k) {
      var a = k.split(','), x = +a[0], y = +a[1], s = m.at(x, y); if (!s) return;
      var bot = (y + 1) * T - (s.gz || 0), p0 = iso.toScreen(x * T + T * 0.1, bot - TV.faceOf(m, s) - 28), p1 = iso.toScreen(x * T + T * 0.9, bot); // (the board at the eave, the face and the door under it)
      if (sx >= p0.x && sx < p1.x && sy >= p0.y && sy < p1.y) out = { key: k, door: (m.def.signDoor || {})[k] || null, x: (p0.x + p1.x) / 2, y: p0.y };
    });
    return out;
  };
  TV.signTip = function (ctx, m, sx, sy) {
    var hit = TV.signAt(m, sx, sy), nm = hit && hit.door && D.town && D.town.signName ? D.town.signName(hit.door) : null; if (!nm) return null;
    var lines = [nm.name].concat(nm.who ? [nm.who] : []), w = Math.max.apply(null, lines.map(function (l) { return D.textWidth(l); })) + 10, h = lines.length * 10 + 5;
    var x = Math.max(2, Math.min(D.W - w - 2, Math.round(hit.x - w / 2))), y = Math.max(2, Math.round(hit.y - h - 2));
    ctx.fillStyle = 'rgba(10,12,34,0.9)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(232,208,112,0.85)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    D.text(ctx, lines[0], x + 5, y + 3, '#e8d070'); if (lines[1]) D.text(ctx, lines[1], x + 5, y + 13, '#b4b4c8');
    return { door: hit.door, lines: lines };
  };

  // ------------------------------------------------------------------ the Hex, drawn whole (10-21, Griz: "Can we get some diagonal looking tiles to try and make the hex look
  // better?" -- "The hex has an arena with a sand floor inside it. It is in silverton"): Silverton's Hexagon is one picture, not its squares' stair-steps -- pointy-top, a vertex
  // due north, its roof a ring open to the sky over the sand (the realm wiki's the-hex.md, CANON 09-12), the roof's courses running along each face, the tiers stepping down
  // to the sand, the two south faces' log walls hanging under it with the front doors where the town's marks are (js/town.js marks.hexFront). The squares stay the grid's
  TV.isHexSq = function (m, s) { var hx = m.def.hexagon; return !!hx && s.ch === 'B' && Math.hypot(s.x + 0.5 - hx.x, s.y + 0.5 - hx.y) <= hx.r + 1; };
  TV.HEXIN = 0.625; TV.HEXTIER = [0.6, 0.51]; TV.HEXSAND = 0.43; TV.HEXCARVE = 0.42; // (HEXCARVE: half the carved tip's width, in squares) // (the roof's opening: the rail hexagon's 40 ft side of 64; the tiers and the sand, 38.1 and 32.8 ft, 27.6 ft -- the wiki's)
  function hexCanvas(m) {
    if (m.top.hex) return m.top.hex;
    var hx = m.def.hexagon, T = TV.TS, R0 = hx.r * T, ap = R0 * Math.cos(Math.PI / 6), wall = iso.roofPx(m, 'B') || 24, pad = 2;
    var W = Math.ceil(2 * ap) + 2 * pad, H = Math.ceil(2 * R0 + wall) + 2 * pad, ox = W / 2, oy = pad + R0; // (the roof's centre in the picture)
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var cx = cv.getContext('2d'), img = cx.createImageData(W, H), px = img.data;
    var sandPx = TV.artOn() ? TV.piecePx('hex_sand') : null, ringPx = TV.artOn() ? TV.piecePx('roof_stone_C') : null; // (the art desk's raked sand and pale stone roof, where they have come: THE ART)
    var dp0 = TV.artOn() ? TV.piece('hx_doors_south', 0) : null, doorPx = dp0 ? TV.piecePx('hx_doors_south')[0] : null; // (the south tip's double doors, the art desk's ART-115 HEAD 5: js/hex.js)
    var stone = R('stone'), leather = R('leather'), gold = R('gold'), silver = R('silver'), N6 = [0, 60, 120, 180, 240, 300].map(function (d) { var a = d * Math.PI / 180; return [Math.cos(a), Math.sin(a)]; });
    var hexD = function (x, y) { var best = -1e9, k = 0; for (var i = 0; i < 6; i++) { var d = x * N6[i][0] + y * N6[i][1]; if (d > best) { best = d; k = i; } } return { d: best, k: k }; }; // (the apothem's measure, and the face it is nearest)
    var lit = [0.0, -0.06, -0.1, 0.0, 0.12, 0.08]; // (the faces by the light from the north-west: E, SSE, SSW, W, NNW, NNE)
    var put = function (x, y, c) { var o = (y * W + x) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255; };
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var dx = x + 0.5 - ox, dy = y + 0.5 - oy, h = hexD(dx, dy), n = NZ.vnoise(x * 0.07, y * 0.07, 811), c = null;
      if (h.d <= ap * TV.HEXIN) { // the open centre: the ground a wall's height down -- the inner logs, the tiers, the sand
        var g = hexD(dx, dy - wall).d, rr = g / ap;
        if (rr <= TV.HEXSAND && sandPx) { var sp = sandPx[(((x / 48) | 0) + ((y / 48) | 0) * 3) % sandPx.length], so = ((y % 48) * 48 + (x % 48)) * 4; c = [sp[so], sp[so + 1], sp[so + 2]]; }
        else if (rr <= TV.HEXSAND) c = NZ.rampPick(gold, 0.3 + n * 0.2 + (NZ.h2(x, y, 812) > 0.93 ? 0.1 : 0) - (NZ.h2(x, y, 813) > 0.95 ? 0.1 : 0), x, y); // (the sand, raked and trodden)
        else if (rr <= TV.HEXSAND + 0.015) c = leather[2]; // (the board lip at the pit's edge)
        else if (rr <= TV.HEXTIER[1]) c = NZ.rampPick(leather, 0.42 + n * 0.12 - ((g | 0) % 6 === 0 ? 0.15 : 0), x, y);
        else if (rr <= TV.HEXTIER[0]) c = NZ.rampPick(leather, 0.55 + n * 0.1 - ((g | 0) % 6 === 0 ? 0.15 : 0), x, y);
        else c = NZ.rampPick(leather, 0.18 + n * 0.1 - ((y % 6) === 0 ? 0.1 : 0), x, y); // (the inner wall: logs, in the roof's shadow)
      } else if (h.d <= ap) { // the roof's ring: courses along its face, the hips between the faces
        var into = ap - h.d, hd = hexD(dx, dy), second = -1e9; for (var i2 = 0; i2 < 6; i2++) if (i2 !== hd.k) second = Math.max(second, dx * N6[i2][0] + dy * N6[i2][1]);
        var hip = h.d - second < 1.6, course = (into | 0) % 7 === 0, joint = ((((dx * -N6[h.k][1] + dy * N6[h.k][0]) | 0) + ((into / 7 | 0) % 2) * 5) % 10 + 10) % 10 === 0;
        c = NZ.rampPick(stone, Math.max(0.04, 0.5 + lit[h.k] + n * 0.18 - (course ? 0.18 : 0) - (joint ? 0.08 : 0) - (hip ? 0.22 : 0) - (into < 2 || h.d > ap - 0.5 ? 0.25 : 0) - (h.d - ap * TV.HEXIN < 2 ? 0.2 : 0)), x, y);
        if (ringPx) { // the art's pale stone, its courses along each face; each face lit by the light from the north-west, the hips and the lips a step down its ramp
          var ua = ((Math.round(dx * -N6[h.k][1] + dy * N6[h.k][0]) % 48) + 48) % 48, ub = (Math.round(into) % 48 + 48) % 48, po = (ub * 48 + ua) * 4, rp = ringPx[h.k % ringPx.length];
          var st = (lit[h.k] > 0.05 ? 1 : lit[h.k] < -0.05 ? -1 : 0) - (hip ? 2 : 0) - (into < 2 || h.d > ap - 0.5 || h.d - ap * TV.HEXIN < 2 ? 1 : 0);
          c = TV.palStep([rp[po], rp[po + 1], rp[po + 2]], st);
        }
      } else if (Math.abs(dx) <= ap) { // under the two south faces: their log walls, a wall's height
        var yb = R0 - Math.abs(dx) * Math.tan(Math.PI / 6), j = dy - yb, cw = T * TV.HEXCARVE, ybc = R0 - cw * Math.tan(Math.PI / 6);
        if (Math.abs(dx) < cw) { // the south tip carved flat at the ground floor, its double doors straight south (10-21, Griz: "those doors should be double doors at the southern
          // tip (carved away so the doors are straight n/s) - the point isn't carved out on the upper floors") -- the roof keeps its point; the flat wall shows under it
          var jc = dy - ybc;
          if (dy > yb && jc <= wall) {
            var upc = 1 - jc / wall, leaf = Math.abs(dx) < cw - 2 && upc < 0.8 && jc > 0, frame = leaf && (Math.abs(dx) >= cw - 4 || Math.abs(dx) < 1 || upc > 0.74);
            c = frame ? silver[3] : leaf ? NZ.rampPick(leather, 0.24 + ((x % 4) === 0 ? -0.1 : 0) + (Math.abs(upc - 0.4) < 0.04 ? 0.25 : 0), x, y) : NZ.rampPick(leather, 0.2 + n * 0.08 - ((jc | 0) % 6 === 0 ? 0.1 : 0), x, y); // (two leaves, the great log between; the recess in shadow)
            if (doorPx) { var du = Math.floor((dx + cw) / (2 * cw) * dp0.w), dv = Math.floor(jc / wall * dp0.h); if (du >= 0 && du < dp0.w && dv >= 0 && dv < dp0.h) { var dq = (dv * dp0.w + du) * 4; if (doorPx[dq + 3] > 0) c = [doorPx[dq], doorPx[dq + 1], doorPx[dq + 2]]; } } // (the art's doors and their stone frame, filling the carved tip's flat wall)
          }
        } else if (j > 0 && j <= wall) c = NZ.rampPick(leather, (dx > 0 ? 0.45 : 0.36) + n * 0.12 - ((j | 0) % 6 === 0 ? 0.16 : 0) - (j > wall - 2 ? 0.15 : 0), x, y); // (the logs follow the slant: the diagonal his eye asked for)
      }
      if (c) put(x, y, c);
    }
    cx.putImageData(img, 0, 0);
    return (m.top.hex = { canvas: cv, ox: ox, oy: oy, wall: wall });
  }

  // ------------------------------------------------------------------ the Edifice, drawn whole (10-28, Griz, of Silverton from above: "edifice looks like a mountain flattened
  // at 10 ft tall"): the dwarves' building as the realm has it (deepholm-and-the-edifice.md, "The face, as the game builds it": three dwarven floors of 15 ft, the facade some
  // 45 ft; arches every four columns along its foot, their tops at 15 ft; the fountains along the wall; the two vault doors at its foot -- planked wood, a dark X of braces
  // corner to corner, a gold ring on a dark boss; the roof skylight glass with a stone rim and merlons, the third-floor orchard seen through it, the falls run down its middle
  // in a channel), in place of the cliff it was drawn as. Its squares stay rock to the rules (js/town.js def.edifice). Its height is the houses' by the foot -- 45 ft where a
  // two-floor house's face is 20 (TV.faceOf), on any face setting -- and it is painted in strips as the camera comes to them (at 5 ft a square it is 12,000 px wide)
  TV.EDFT = 45; TV.EDSTRIP = 512;
  TV.isEdSq = function (m, s) { var e = m.def.edifice; return !!e && s.ch === '#' && s.x >= e.x0 && s.x <= e.x1 && s.y >= e.y0 && s.y <= e.y1; };
  TV.edH = function (m) { return Math.round(TV.faceOf(m, { ch: 'b' }) * TV.EDFT / ((D.town && D.town.ROOFS && D.town.ROOFS.b.h) || 20)); };
  TV.edStrip = function (m, i) {
    var top = m.top, ed = top.ed = top.ed || {}; if (ed[i]) return ed[i];
    var e = m.def.edifice, T = TV.TS, F = m.def.ft || 30, Hf = TV.edH(m), Wt = (e.x1 - e.x0 + 1) * T, sx0 = i * TV.EDSTRIP, w = Math.max(1, Math.min(TV.EDSTRIP, Wt - sx0)), rowsH = (e.y1 - e.y0 + 1) * T, H = rowsH + Hf;
    var cv = document.createElement('canvas'); cv.width = w; cv.height = H;
    var cx = cv.getContext('2d'), img = cx.createImageData(w, H), px = img.data, kx = T / F, kv = Hf / TV.EDFT, L = e.fx0, Rr = e.fx0 + Wt / kx;
    var stone = R('stone'), silver = R('silver'), moss = R('moss'), blue = R('blue'), leather = R('leather'), gold = R('gold');
    var put = function (x, y, c) { var o = (y * w + x) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255; };
    var mix = function (a, b, t) { return [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0]; };
    var sun = [e.ax - 260, rowsH / kx / 2], vaultR = 64; // (the Sunshaft's round west of the falls, half way back; the vault's arch v6's 128 ft)
    for (var Y = 0; Y < H; Y++) for (var X = 0; X < w; X++) {
      var gx = sx0 + X, u = L + gx / kx, c, n = NZ.h2(gx >> 1, Y >> 1, 1301);
      if (Y < rowsH) { // the roof from above: the rim and its merlons, the glass over the orchard, the falls' channel down the middle, the Sunshaft's round
        var d = (rowsH - Y) / kx, de = Math.min(u - L, Rr - u);
        if (d < 6 || de < 6) { var mer = d < 6 && Math.floor(u / 6) % 2 === 0; c = NZ.rampPick(silver, (mer ? 0.62 : 0.32) + n * 0.1 - (d < 6 && d > 4.8 ? 0.2 : 0) - (de < 6 && de > 4.8 ? 0.2 : 0), gx, Y); } // (the stone rim, the merlons along its front)
        else if (Math.abs(u - e.ax) < 5) c = NZ.h2(gx, Y, 1302) > 0.97 ? silver[5] : NZ.rampPick(blue, 0.3 + NZ.vnoise(u * 0.3, d * 0.6, 1303) * 0.3, gx, Y); // (the falls, run down the orchard)
        else if (Math.abs(u - e.ax) < 6.5) c = NZ.rampPick(stone, 0.45, gx, Y); // (the channel's banks)
        else {
          var sd = Math.hypot(u - sun[0], d - sun[1]), cu = Math.floor(u / 20), cd = Math.floor(d / 20), jt = NZ.h2(cu, cd, 1304), tu = cu * 20 + 10 + (jt - 0.5) * 4, td = cd * 20 + 10 + (NZ.h2(cd, cu, 1305) - 0.5) * 4;
          var du = u - tu, dd = d - td, tr = 6 + jt * 1.5, td2 = Math.hypot(du, dd), under; // (the orchard: a tree to each 20 ft, in rows, its crown lit from the north-west)
          under = sd < 12 ? stone[0] : sd < 14 ? stone[3] : td2 < tr ? (td2 > tr - 1 / kx ? moss[0] : du - dd < -tr * 0.35 ? mix(moss[2], gold[3], 0.25) : du - dd > tr * 0.45 ? moss[0] : moss[1]) : td2 < tr + 1.5 && du - dd > 0 ? moss[0] : mix(NZ.rampPick(moss, 0.55 + NZ.vnoise(u * 0.04, d * 0.04, 1306) * 0.4, gx, Y), gold[2], 0.12); // (the Sunshaft's hole and its rim; a crown, its shade on the grass; the grass)
          c = mix(under, silver[3], 0.2); // (the glass over it, a pale tint)
          var pane = Math.max(4, Math.round(12 * kx)); if (gx % pane === 0 || Y % pane === 0) c = mix(c, silver[4], 0.5); // (each pane's edge, thin silver)
          if (((gx + Y) % 160) < 3) c = mix(c, silver[5], 0.3); // (a gloss across the panes)
        }
      } else { // the facade: ashlar, pilasters, two string courses, the arcade at its foot, the windows, the merlons, the vault's doors, the fountains' spouts
        var j = Y - rowsH, h = (Hf - j) / kv, b = Math.floor((u - L) / 24), bu = (u - L) - b * 24, mid = L + b * 24 + 12, dv = u - e.ax;
        var course = (h % 3) < 1 / kv, joint = ((bu + (Math.floor(h / 3) % 2) * 3) % 6) < 1 / kx; // (the ashlar's courses every 3 ft, its joints staggered: a pixel's line)
        c = NZ.rampPick(silver, 0.5 + n * 0.08 - (course || joint ? 0.14 : 0) - (1 - h / TV.EDFT) * 0.12, gx, Y);
        if (bu < 2.5) c = NZ.rampPick(silver, bu > 2 ? 0.3 : 0.66, gx, Y); // (a pilaster, its shadowed edge east)
        if (Math.abs(h - 15) < 0.7 || Math.abs(h - 30) < 0.7) c = h > 15 && h < 15.3 || h > 30 && h < 30.3 ? silver[5] : NZ.rampPick(silver, 0.25, gx, Y); // (the string courses)
        if (h > 41) { var mr = Math.floor(u / 6) % 2 === 0; c = mr ? NZ.rampPick(silver, h > 44 ? 0.7 : 0.55, gx, Y) : NZ.rampPick(stone, 0.3, gx, Y); } // (the merlons along the top)
        var wy = h > 19 && h < 26 ? [19, 26] : h > 33 && h < 39 ? [33, 39] : null; // (a window on the second floor and the third, its frame)
        if (wy && bu > 10 && bu < 14) c = bu < 10 + 1 / kx || bu > 14 - 1 / kx || h < wy[0] + 1 / kv || h > wy[1] - 1 / kv ? silver[2] : NZ.rampPick(blue, 0.12 + ((gx + Y) % 7 === 0 ? 0.2 : 0), gx, Y);
        if (b % 4 === 2 && bu > 2.5 && Math.abs(dv) > vaultR + 4) { var rr = Math.abs(u - mid) / 9.5; if (h < 15 - 4 * rr * rr) c = h > 14.2 - 4 * rr * rr ? silver[5] : NZ.rampPick(stone, 0.05 + (h / 15) * 0.1, gx, Y); } // (an arch of the arcade at the foot, every fourth bay)
        if (Math.abs(dv) < vaultR) { // the vault's great arch and its two doors
          var vr = Math.abs(dv) / vaultR, archTop = 30 - 8 * vr * vr;
          if (h < archTop) {
            c = h > archTop - 1 ? silver[5] : NZ.rampPick(stone, 0.06, gx, Y);
            var lf = Math.abs(dv) > 3 && Math.abs(dv) < 52 && h < 24; if (lf) {
              var la = dv < 0 ? -52 : 3, lb = dv < 0 ? -3 : 52, fu = (dv - la) / (lb - la), fh = h / 24, brace = Math.abs(fu - fh) < 0.035 || Math.abs(fu - (1 - fh)) < 0.035, cu = (la + lb) / 2, ring = Math.hypot(dv - cu, h - 12);
              c = brace ? leather[0] : NZ.rampPick(leather, 0.32 + ((Math.abs(dv) % 3) < 0.35 ? -0.18 : 0) + n * 0.06, gx, Y); // (planks, the X of braces)
              if (ring < 1.3) c = stone[0]; else if (ring < 2.6 && ring > 1.9) c = gold[4]; // (a gold ring on a dark boss)
            }
          }
        }
        e.fount.forEach(function (fx) { // a fountain: a spout in a carved boss at 12 ft, its water poured down the wall into the basin at the foot
          var df = Math.abs(u - fx); if (df > 8) return;
          if (Math.hypot(u - fx, h - 12) < 3.2) c = Math.hypot(u - fx, h - 12) < 1.1 ? stone[0] : silver[5];
          else if (df < 1.4 && h < 11) c = NZ.h2(gx, Y >> 1, 1306) > 0.9 ? silver[5] : NZ.rampPick(blue, 0.45 + (df < 0.5 ? 0.25 : 0), gx, Y);
          if (h < 2.2 && df < 7) c = h > 1.7 ? silver[5] : NZ.rampPick(stone, 0.4, gx, Y);
        });
      }
      put(X, Y, c);
    }
    cx.putImageData(img, 0, 0);
    return (ed[i] = cv);
  };

  // ------------------------------------------------------------------ THE ART (10-22, the top tiles seat, on Griz's "art 111-113 are in to see if we can give the top down
  // something to work with"): the art desk's tiles and props for Silverton, the Guano Mine's top levels and the Glowseep (deep16-art-wanted.md section 21), cut by
  // tools/toptiles-sheet.py, minetiles-sheet.py and seeptiles-sheet.py into three atlases (data/sprites.js: each piece's box by its name, `tiles`). A square takes the
  // art's piece where there is one and the code's drawing above where there is none -- the code's drawing stays whole, the fallback. While the atlases are on their
  // way, and with &tiles=code on the page's address, the code draws everything as before (the switch to compare). The houses' south faces stand at the art's own
  // heights (a low house 32 px, a tall one 48) -- the default since 10-28 (RULED, Griz: "1 yes to both", tall faces and the see-through on the streets); &faces=low the
  // town's own, 7 to 23 px at its 30-ft squares (js/town.js T.SCALE), as before
  var QS = typeof location !== 'undefined' ? location.search || '' : '';
  TV.ART = { on: !/[?&]tiles=code\b/.test(QS), tall: !/[?&]faces=low\b/.test(QS), sheets: ['toptiles_p1', 'minetiles_p1', 'seeptiles_p1', 'hextiles_p1', 'fountains_p1'] }; // (hextiles_p1: the Hex's, ART-115 -- js/hex.js; fountains_p1: the fountains' basins, ART-124 -- TV.basins)
  TV.FACEPX = { low: 32, tall: 48 };
  function atlases() { // the three atlases, loaded; null while any is still on its way (or never fetched: the benches)
    var out = [];
    for (var i = 0; i < TV.ART.sheets.length; i++) { var sh = D.SHEETS && D.SHEETS[TV.ART.sheets[i]], im = sh && D.images && D.images[sh.image]; if (!sh) continue; if (!im || !im.naturalWidth) return null; out.push({ name: TV.ART.sheets[i], sh: sh, im: im }); }
    return out.length ? out : null;
  }
  TV.artOn = function () { return TV.ART.on && !!atlases(); };
  TV.artLoad = function () { if (!TV.ART.on || !D.spr || !D.spr.load) return; TV.ART.sheets.forEach(function (n) { var sh = D.SHEETS && D.SHEETS[n]; if (sh) D.spr.load(sh.image); }); };
  TV.repaint = function (m) { var t = m.top; t.pages.forEach(function (p) { p.cv = null; }); t.baked = 0; t.tiles = {}; t.stand = {}; t.hex = null; t.ed = null; t.kinds = null; if (m.def.onArt) m.def.onArt(m); }; // (onArt: a floor's own things made again -- the Hex's, js/hex.js)
  // the place's own atlas first (Silverton's cliff and the mines' share a name)
  TV.place = function (m) { var d = m.def; return d.room ? 'room' : d.key === 'glowseep' ? 'seep' : d.mine ? 'mine' : 'town'; };
  var FIRST = { town: 'toptiles_p1', room: 'toptiles_p1', mine: 'minetiles_p1', seep: 'seeptiles_p1' }, PC = {};
  TV.piece = function (name, v, place) {
    var A = atlases(); if (!A) return null;
    var pk = name + '|' + (place || ''), hit = PC[pk];
    if (hit === undefined) {
      hit = null; var first = FIRST[place] || '';
      A.slice().sort(function (a, b) { return (b.name === first) - (a.name === first); }).forEach(function (a) { var t = !hit && a.sh.tiles && a.sh.tiles[name]; if (t && t.length) hit = { name: a.name, t: unpack(t) }; });
      PC[pk] = hit;
    }
    if (!hit) return null;
    var im = A.filter(function (a) { return a.name === hit.name; })[0].im, b = hit.t[((v || 0) % hit.t.length + hit.t.length) % hit.t.length];
    return { im: im, x: b[0], y: b[1], w: b[2], h: b[3], ax: b[4], ay: b[5], n: hit.t.length };
  };
  var unpack = function (t) { return typeof t === 'string' ? t.split(' ').map(function (b) { return b.split(',').map(Number); }) : t; }; // (the cutter packs a name's boxes into one string: 'x,y,w,h,ax,ay x,y,...')
  var ES = {};
  TV.edgeSet = function (set) {
    if (ES[set]) return ES[set]; var A = atlases(); if (!A) return null;
    for (var i = 0; i < A.length; i++) { var d = A[i].sh.dual && A[i].sh.dual[set]; if (d) { var mk = {}; Object.keys(d.mask).forEach(function (k) { mk[k] = unpack(d.mask[k])[0]; }); return (ES[set] = { im: A[i].im, mask: mk }); } }
    return null;
  };
  var STEP = null;
  TV.palStep = function (c, k) { // a colour k steps lighter (or darker, k < 0) along its own ramp of the palette -- still one of the 64 (the accents, no ramp, stay)
    if (!STEP) { STEP = {}; var rs = (D.PAL && D.PAL.ramps) || {}; Object.keys(rs).forEach(function (nm) { if (nm === 'accent' || nm === 'outline') return; var r = rs[nm].map(function (h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }); r.forEach(function (cc, i) { STEP[cc.join(',')] = { r: r, i: i }; }); }); }
    var e = STEP[c[0] + ',' + c[1] + ',' + c[2]]; if (!e || !k) return c;
    return e.r[Math.max(0, Math.min(e.r.length - 1, e.i + k))];
  };
  var PX = {};
  TV.piecePx = function (name, place) { // a piece's pixels, every variant (the Hex's sand, read as hexCanvas paints; a fringe's other ground)
    var pk = name + '|' + (place || ''); if (PX[pk]) return PX[pk];
    var out = [], p0 = TV.piece(name, 0, place); if (!p0) return null;
    for (var i = 0; i < p0.n; i++) { var p = TV.piece(name, i, place), cv = document.createElement('canvas'); cv.width = p.w; cv.height = p.h; var cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(p.im, p.x, p.y, p.w, p.h, 0, 0, p.w, p.h); out.push(cx.getImageData(0, 0, p.w, p.h).data); }
    return (PX[pk] = out);
  };
  // the fountains of Fountain Street (10-29, the cutter seat of 10-29: the art desk's ART-124 HEAD 3, deep16-art-wanted.md section 28, on Griz's 10-28 "we'll probably need
  // custom fountain tiles, this looks like spilled waterfall water"): each basin laid whole on the floor's pages at its fountain, under the Edifice's spout -- its middle and
  // its rim where js/town.js lays them (T.FOUNT), so the Edifice's drawn front stands over its north part -- built from the art's pieces by quarters: its squares those of a
  // circle n across (two at the town's 30-ft squares, six at 10, twelve at true scale), each quarter of a square the fill, an edge, an outer corner or an inner corner by the
  // two squares beside that quarter and the one between them. HEADs 1 and 2, the whole fountains with a pedestal and a spout of their own, never came; the spout is the
  // Edifice's (TV.edStrip). The town's water squares under it take the art's calm fill (TV.GROUND), and the code's drawing stays with &tiles=code
  var BASIN = {};
  TV.basin = function (n) {
    if (BASIN[n] !== undefined) return BASIN[n];
    var T = TV.TS, H = T / 2, r = n / 2, inn = function (i, j) { var u = i + 0.5 - r, v = j + 0.5 - r; return i >= 0 && j >= 0 && i < n && j < n && u * u + v * v <= r * r; };
    if (!TV.piece('basin_water', 0, 'town') || !TV.piece('basin_inner_se', 0, 'town')) return null;
    var c = canvasOf(n * T, n * T), cx = c.cx;
    for (var j = 0; j < n; j++) for (var i = 0; i < n; i++) {
      if (!inn(i, j)) continue;
      for (var q = 0; q < 4; q++) {
        var dx = q & 1 ? 1 : -1, dy = q >> 1 ? 1 : -1, ns = dy < 0 ? 'n' : 's', we = dx < 0 ? 'w' : 'e', ve = inn(i, j + dy), ho = inn(i + dx, j), di = inn(i + dx, j + dy);
        var nm = !ve && !ho ? 'basin_outer_' + ns + we : !ve ? 'basin_edge_' + ns : !ho ? 'basin_edge_' + we : !di ? 'basin_inner_' + ns + we : 'basin_water';
        var p = TV.piece(nm, nm === 'basin_water' ? NZ.h2(i, j, 89) * 4 | 0 : 0, 'town'); if (!p) continue;
        cx.drawImage(p.im, p.x + (q & 1) * H, p.y + (q >> 1) * H, H, H, i * T + (q & 1) * H, j * T + (q >> 1) * H, H, H);
      }
    }
    return (BASIN[n] = c.cv);
  };
  TV.basins = function (m, cx, x0, y0) { // (on a floor's page: x0, y0 its corner in world px)
    var e = m.def.edifice, Tn = D.town, V6 = D.TOWN_V6; if (!e || !e.fount || !Tn || !Tn.FOUNT || !V6) return;
    var T = TV.TS, F = m.def.ft || Tn.SCALE || 30, FB = Tn.FOUNT(F), R = FB.rim / F * T, n = Math.max(2, Math.round(2 * R / T)), im = TV.basin(n); if (!im) return;
    var wy = ((V6.EDBOT + FB.dy - Tn.Y0) / F + e.y0) * T; // (the fountains' middle: v6's feet to the floor's px -- e.y0 the floor's cut, js/town.js def.edifice)
    e.fount.forEach(function (fx) {
      var wx = e.x0 * T + (fx - e.fx0) * T / F, s = m.at(Math.floor(wx / T), e.y1 + 1), z = s ? s.gz || 0 : 0; // (the ground's height at the Edifice's foot: Fountain Street is on its level)
      if (wx + R < x0 || wx - R > x0 + TV.PAGE || wy - z + R < y0 || wy - z - R > y0 + TV.PAGE) return;
      cx.drawImage(im, Math.round(wx - R - x0), Math.round(wy - z - R - y0), Math.round(2 * R), Math.round(2 * R));
    });
  };
  function name8(m, x, y) { var n8 = m.def.names8, r = n8 && n8.rows[y]; return r ? n8.legend[r.charAt(x)] || '' : ''; } // (the first game's name of the square: js/mines.js)
  function canvasOf(w, h, read) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; var cx = cv.getContext('2d', read ? { willReadFrequently: true } : undefined); cx.imageSmoothingEnabled = false; return { cv: cv, cx: cx }; } // (read: its pixels read back -- kept on the CPU, or each read waits on the GPU: 4 s for the Glowseep's first view, 10-22)

  // the grounds: each ground kind's tile, by the place (a kind is a square's own letter or its floor's look, as tileKind reads it)
  TV.GROUND = {
    town: { '.': 'earth', g: 'grass', ',': 'road', '=': 'dressed_stone', d: 'threshold', '~': 'basin_water', D: 'river_water', r: 'spoil' }, // ('~' the fountains' water: the art desk's calm basin fill since 10-29, ART-124 -- ART-111's bright fountain_water read as spilled falls)
    room: { o: 'room_floor_plank', '=': 'room_floor_flagstone', '.': 'room_floor_earth', d: 'threshold', '~': 'fountain_water' },
    mine: { C: 'cave_floor', U: 'guano', Q: 'deep_guano', Y: 'gravel', M: 'fungus_bed', Z: 'ladder_slope', X: 'stair_down', '.': 'earth', g: 'grass', ',': 'road', '=': 'dressed_stone', d: 'threshold', D: 'river_frame', '~': 'river_frame', r: 'spoil' },
    seep: { A: 'mud', E: 'reeds', N: 'moss_day', g: 'tussock', '~': 'still_pool_fill', D: 'drain_fill', ',': 'road', '.': 'mud', d: 'threshold', r: 'reeds' }
  };
  // the edges, a dual grid (tools/toptiles-sheet.py, its head): at each corner where four squares meet, when they are two grounds of one set, the edge tile the cutter
  // named for that arrangement is centred on the corner and each square draws its own quarter of it. fg: the ground the edge tile's bits mean; bg: what it meets
  TV.EDGES = {
    town: [{ set: 'stone', fg: '=', bg: ',.' }, { set: 'river', fg: 'D', bg: '.g,r' }], // (the grass's edges are cut but not laid: drawn as thick turf against a fill of sparse tufts on earth, they rimmed each patch like a hedge)
    room: [],
    mine: [{ set: 'guano', fg: 'U', bg: 'CY' }, { set: 'deep', fg: 'Q', bg: 'U' }, { set: 'mriver', fg: 'D', bg: '.g,' }],
    seep: [{ set: 'mudgrass', fg: 'AEN.', bg: 'g' }, { set: 'pool', fg: '~', bg: 'AEN.' }, { set: 'drain', fg: 'D', bg: 'AEN.' }]
  };
  function groundKind(m, x, y) { // (kept by the square: the edges and the roads ask a square's neighbours many times over)
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return null;
    var K = m.top.kinds || (m.top.kinds = {}), i = y * m.w + x; if (i in K) return K[i];
    var q = m.at(x, y); return (K[i] = !q || q.block || !q.open ? null : tileKind(m, q)); // (a building, a rock, a block, the Hex: no ground of their own here)
  }
  // a cart track's piece by the rails beside it: straight, a bend (turned), an end (turned) -- the art desk drew one of each
  TV.railPiece = function (m, s, kind) {
    var lk = function (x, y) { var r = m.def.look && m.def.look[y], c = r ? r.charAt(x) : ' '; return c === 'R' || c === 'H'; }, inb = function (x, y) { return !!m.at(x, y); };
    var n = lk(s.x, s.y - 1), so = lk(s.x, s.y + 1), e = lk(s.x + 1, s.y), w = lk(s.x - 1, s.y), c = n + so + e + w;
    if (c === 2 && (n || so) && (e || w)) return ['rails_bend_n_e', n && e ? 0 : e && so ? 1 : so && w ? 2 : 3];
    if (c === 1) { if (n && inb(s.x, s.y + 1)) return ['rails_end_s', 2]; if (so && inb(s.x, s.y - 1)) return ['rails_end_s', 0]; if (e && inb(s.x - 1, s.y)) return ['rails_end_s', 3]; if (w && inb(s.x + 1, s.y)) return ['rails_end_s', 1]; }
    return [(c ? (e || w) && !(n || so) : kind === 'H') ? 'rails_ew' : 'rails_ns', 0];
  };
  function artTile(m, s) {
    var P = TV.place(m), kind = tileKind(m, s), G = TV.GROUND[P] || {}, nm = G[kind], rot = 0, n8 = P === 'mine' || P === 'seep' ? name8(m, s.x, s.y) : '';
    if (P === 'mine') {
      if (kind === 'C' && n8 === 'bones') nm = 'bones'; else if (kind === 'C' && n8 === 'webFloor') nm = 'old_webbing';
      else if (kind === 'X') nm = n8 === 'holeDown' ? 'pit' : 'stair_down';
      else if (kind === 'R' || kind === 'H') { var rp = TV.railPiece(m, s, kind); nm = rp[0]; rot = rp[1]; }
      else if (kind === 'o') { var up = (m.at(s.x, s.y - 1) || {}).ch === 'o', dn = (m.at(s.x, s.y + 1) || {}).ch === 'o'; nm = !up ? 'bridge_w_end' : !dn ? 'bridge_e_end' : 'bridge_middle'; rot = 1; } // (the first game's bridge runs north-south: the art's, turned)
    }
    if (P === 'seep' && kind === 'N' && m.def.dark) nm = 'moss_night'; // (the moss by night, its own tile: js/mines.js lays the floor for the hour)
    if (P === 'town' && kind === '~' && m.def.edifice && TV.basin(2)) nm = 'dressed_stone'; // (a fountain's water squares: its basin is drawn whole over them, TV.basins -- the street's stone round it, where a square's corner shows past the rim)
    if (!nm || !TV.piece(nm, 0, P)) return null;
    var v = NZ.h2(s.x * 3 + 1, s.y * 5 + 2, 71) * 4 | 0;
    if (kind === ',') { // a road's ruts along it where it is a road through other ground: turned where it runs east-west, one variant down its length so the ruts run on
      // unbroken. Where the packed dirt is most of the open ground about it (a plaza, a crossing, a street between houses), the road with no ruts -- tiled every way
      // across a plaza, the ruts read as a ploughed field
      var rd = function (x, y) { return groundKind(m, x, y) === ','; }, ext = function (dx, dy) { var n = 1, k; for (k = 1; k <= 4 && rd(s.x + dx * k, s.y + dy * k); k++) n++; for (k = 1; k <= 4 && rd(s.x - dx * k, s.y - dy * k); k++) n++; return n; };
      var gr = 0, rr = 0; for (var py = -3; py <= 3; py++) for (var px = -3; px <= 3; px++) { var gk = groundKind(m, s.x + px, s.y + py); if (gk) { gr++; if (gk === ',') rr++; } }
      var ew = ext(1, 0), ns = ext(0, 1);
      if ((rr >= gr * 0.8 || ew === ns) && TV.piece('road_plain', 0, P)) nm = 'road_plain';
      else if (ew > ns) { rot = 1; v = NZ.h2(0, s.y, 73) * 4 | 0; } else v = NZ.h2(s.x, 0, 73) * 4 | 0;
    }
    var nq = m.at(s.x, s.y - 1), shade = !!(nq && !nq.open && !nq.block && !TV.isHexSq(m, nq)), E = TV.EDGES[P] || [], q = [];
    for (var qi = 0; qi < 4; qi++) { // each quarter by the corner it touches: the four squares round that corner, this one at the corner's opposite quarter
      var vx = s.x + (qi & 1), vy = s.y + (qi >> 1), ks = [[vx - 1, vy - 1], [vx, vy - 1], [vx - 1, vy], [vx, vy]].map(function (p) { return groundKind(m, p[0], p[1]) || kind; }), hit = null;
      for (var e = 0; e < E.length && !hit; e++) {
        var es = E[e], mask = 0, all = true;
        for (var b = 0; b < 4; b++) { if (es.fg.indexOf(ks[b]) >= 0) mask |= 1 << b; else if (es.bg.indexOf(ks[b]) < 0) all = false; }
        if (all && mask && mask !== 15) { var set = TV.edgeSet(es.set); if (set && set.mask[mask]) hit = [es.set, mask]; }
      }
      q.push(hit);
    }
    // the soft fringe: where two plain grounds meet along a side with no edge art between them (the road and the earth, the gravel and the cave floor), each
    // takes a dither of the other's pixels in the FRINGE px nearest the side, half at the line and none at FRINGE in -- the art desk drew no edges for these
    var fr = [], base = function (k) { var f = k === ',' ? 'road_plain' : G[k]; return f && TV.SOFT[f] ? f : null; }, mine = base(kind);
    [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(function (o) {
      var nk = groundKind(m, s.x + o[0], s.y + o[1]), nf = nk && nk !== kind ? base(nk) : null;
      if (nf && mine && nf !== mine && !E.some(function (es) { return (es.fg.indexOf(kind) >= 0 && es.bg.indexOf(nk) >= 0) || (es.bg.indexOf(kind) >= 0 && es.fg.indexOf(nk) >= 0); })) fr.push(nf); else fr.push(null);
    });
    return { key: 'A' + nm + rot + ':' + v + ':' + q.map(function (h) { return h ? h[0] + h[1] : '-'; }).join(',') + (shade ? 's' : '') + '|' + fr.join(','), nm: nm, rot: rot, v: v, q: q, shade: shade, place: P, fr: fr };
  }
  TV.FRINGE = 7; // (px)
  TV.ROCKDARK = 2; // (the mines' rock tops, steps down the palette's ramps)
  TV.SOFT = { earth: 1, grass: 1, road: 1, road_plain: 1, spoil: 1, mud: 1, tussock: 1, reeds: 1, moss_day: 1, moss_night: 1, cave_floor: 1, gravel: 1, bones: 1, old_webbing: 1, fungus_bed: 1, room_floor_earth: 1 }; // (the grounds that fray into each other)
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  TV.artAt = function (m, x, y) { var s = m.at(x, y); return s ? artTile(m, s) : null; }; // (what the art lays on a square: the look's probes)
  function artCanvas(a) {
    var T = TV.TS, H = T / 2, c = canvasOf(T, T, a.fr && a.fr.some(Boolean)), cx = c.cx, p = TV.piece(a.nm, a.v, a.place);
    if (a.rot) { cx.save(); cx.translate(H, H); cx.rotate(a.rot * Math.PI / 2); cx.drawImage(p.im, p.x, p.y, p.w, p.h, -H, -H, T, T); cx.restore(); }
    else cx.drawImage(p.im, p.x, p.y, p.w, p.h, 0, 0, T, T);
    if (a.fr && a.fr.some(Boolean)) {
      var img = cx.getImageData(0, 0, T, T), px = img.data, F = TV.FRINGE;
      a.fr.forEach(function (nf, side) {
        if (!nf) return; var src = TV.piecePx(nf, a.place); if (!src) return; src = src[a.v % src.length];
        for (var d = 0; d < F; d++) for (var t = 0; t < T; t++) {
          var x = side === 1 ? T - 1 - d : side === 3 ? d : t, y = side === 0 ? d : side === 2 ? T - 1 - d : t;
          if (BAYER[(y & 3) * 4 + (x & 3)] / 16 < 0.5 * (1 - d / F)) { var o = (y * T + x) * 4; px[o] = src[o]; px[o + 1] = src[o + 1]; px[o + 2] = src[o + 2]; }
        }
      });
      cx.putImageData(img, 0, 0);
    }
    a.q.forEach(function (hit, qi) { if (!hit) return; var set = TV.edgeSet(hit[0]), b = set.mask[hit[1]], oq = 3 - qi; cx.drawImage(set.im, b[0] + (oq & 1) * H, b[1] + (oq >> 1) * H, H, H, (qi & 1) * H, (qi >> 1) * H, H, H); });
    if (a.shade) { cx.fillStyle = 'rgba(0,0,0,0.38)'; cx.fillRect(0, 0, T, Math.round(T * 0.22)); } // (the shadow of a building or a rock to the north, as the code's -- not a crate's or a stall's: the art's props stand in their squares)
    return c.cv;
  }
  // the town's bank down the slope off Fountain Street (js/town.js T.DROP): the art's stone lip and timbered face, the band of its bank tile stretched down the drop
  function artBank(m, cx, gx, gy, x, y, drop) {
    var dropAt = function (ax) { var a = m.at(ax, gy), b = m.at(ax, gy + 1); return !!(a && b && a.gz - b.gz > 0); };
    var p = TV.piece('bank', !dropAt(gx - 1) ? 0 : !dropAt(gx + 1) ? 2 : 1, 'town'); if (!p) return;
    cx.drawImage(p.im, p.x, p.y + 13, p.w, 24, x, y - 3, TV.TS, drop + 3); // (the lip rides 3 px up onto the higher ground)
  }

  // the standing things: a roof as nine pieces, its south face, a door, a sign; a rock's top and its cliff; a prop on its square
  TV.ROOFART = { b: 'roof_clay_', u: 'roof_clay_', n: 'roof_slate_', h: 'roof_shingle_', j: 'roof_shingle_', B: 'roof_stone_', q: 'wallwalk_' };
  TV.SIGNART = { ring: 'sign_ring', scales: 'sign_scales', coin: 'sign_coin', potion: 'sign_potion', bed: 'sign_bed', star: 'sign_star', pack: 'sign_pack', candle: 'sign_candle', sword: 'sign_sword', stitch: 'sign_needle_thread', jar: 'sign_jar', sun: 'sign_sun', mortar: 'sign_mortar_pestle' };
  function artStand(m, s) {
    var P = TV.place(m), RF = m.def.roofs && m.def.roofs[s.ch], rock = !RF && !s.open;
    if (RF && TV.ROOFART[s.ch]) return artRoof(m, s, P, RF);
    if (rock && m.def.room) return artRoomWall(m, s);
    if (rock) return artRock(m, s, P);
    if (s.block) return artProp(m, s, P);
    return null;
  }
  function stash(m, key, make) { m.top.stand = m.top.stand || {}; return m.top.stand[key] || (m.top.stand[key] = make()); }
  function artRoof(m, s, P, RF) {
    var T = TV.TS, at = function (dx, dy) { return m.at(s.x + dx, s.y + dy); }, same = function (q) { return !!(q && !q.open && q.ch === s.ch); }, sb = at(0, 1);
    var sd = m.def.slope ? +m.def.slope[s.y].charAt(s.x) || 0 : 0, ns = sd > 3, s3 = ns ? sd - 3 : sd;
    var eN = !same(at(0, -1)), eS = !same(sb), eW = !same(at(-1, 0)), eE = !same(at(1, 0));
    var a0 = ns ? eW : eN, a1 = ns ? eE : eS, b0 = ns ? eN : eW, b1 = ns ? eS : eE; // (a: across the ridge, its eaves; b: along it, its ends -- a ridge north-south the same, turned)
    var row = a0 && a1 ? 'M' : a0 ? 'N' : a1 ? 'S' : s3 === 1 ? 'N' : s3 === 2 ? 'S' : 'M', col = b0 && b1 ? 'C' : b0 ? 'W' : b1 ? 'E' : 'C';
    var pc = a0 && a1 && b0 && b1 ? 'single' : row === 'M' ? col : col === 'C' ? row : row + col, roof = TV.piece(TV.ROOFART[s.ch] + pc, 0, P);
    var hgt = TV.ART.tall ? (/[buB]/.test(s.ch) ? TV.FACEPX.tall : TV.FACEPX.low) : iso.roofPx(m, s.ch), door = !!(sb && sb.ch === 'd'), shut = !door && !!(m.def.faceDoors && m.def.faceDoors[s.x + ',' + s.y]);
    var sign = (m.def.signs && m.def.signs[s.x + ',' + s.y]) || '', v = NZ.h2(s.x, s.y, 41) * 4 | 0;
    var wall = P === 'mine' ? 'bunkhouse_wall' : /[Bq]/.test(s.ch) ? 'face_stone_' : 'face_' + ['plaster', 'plaster', 'shutter', 'lit_window'][v] + '_', size = hgt > 26 ? 'tall' : 'low';
    var pos = eW && eE ? 1 : eW ? 0 : eE ? 2 : 1, wn = P === 'mine' ? (door ? 'bunkhouse_door' : 'bunkhouse_wall') : wall + size, wp = TV.piece(wn, P === 'mine' ? 0 : pos, P);
    if (!roof || (eS && !wp)) return null;
    var key = 'R' + s.ch + pc + (ns ? 't' : '') + (eS ? 'F' + wn + pos : '') + (door ? 'D' : '') + (shut ? 'X' : '') + sign + ':' + hgt;
    return stash(m, key, function () {
      var c = canvasOf(T, T + (eS ? hgt : 0)), cx = c.cx;
      if (ns) { cx.save(); cx.setTransform(0, 1, 1, 0, 0, 0); cx.drawImage(roof.im, roof.x, roof.y, roof.w, roof.h, 0, 0, T, T); cx.restore(); } // (turned over its diagonal: the north eave to the west, the light still from the upper left)
      else cx.drawImage(roof.im, roof.x, roof.y, roof.w, roof.h, 0, 0, T, T);
      if (eS) {
        cx.drawImage(wp.im, wp.x, wp.y, wp.w, wp.h, 0, T, T, hgt);
        var dn = P === 'mine' ? null : door ? 'door_store_open' : shut ? 'door_shut_barred' : null, dp = dn && TV.piece(dn, 0, P);
        if (dp) { var dw = Math.max(18, Math.min(T, hgt)); cx.drawImage(dp.im, dp.x, dp.y, dp.w, dp.h, (T - dw) / 2 | 0, T, dw, hgt); }
      }
      var sp = sign && TV.piece(TV.SIGNART[sign], 0, P);
      if (sp) cx.drawImage(sp.im, sp.x, sp.y, sp.w, sp.h, (T - sp.w) / 2 | 0, T + 3 - sp.h, sp.w, sp.h); // (hung over the door from the eave, as the code's)
      return { canvas: c.cv, h: hgt, face: eS };
    });
  }
  function artRoomWall(m, s) { // a room's back wall: the code's timber cap, the art's plaster and timbers under it
    var T = TV.TS, sb = m.at(s.x, s.y + 1), face = !!(sb && (sb.open || sb.block)) && s.y !== m.h - 1; if (!face) return null;
    var v = NZ.h2(s.x, s.y, 41) * 4 | 0, kind = v === 1 ? 'room_wall_window' : 'room_wall_plain', pos = s.x <= 1 ? 0 : s.x >= m.w - 2 ? 2 : 1, wp = TV.piece(kind, pos, 'room'); if (!wp) return null;
    return stash(m, 'W' + kind + pos + ':' + TV.ROOMWALL, function () {
      var code = standCode(m, s), c = canvasOf(T, code.canvas.height); c.cx.drawImage(code.canvas, 0, 0);
      c.cx.drawImage(wp.im, wp.x, wp.y, wp.w, wp.h, 0, T, T, code.h);
      return { canvas: c.cv, h: code.h, face: true };
    });
  }
  function artRock(m, s, P) {
    var T = TV.TS, H = TV.CLIFF, sb = m.at(s.x, s.y + 1), faceAt = function (x) { var q = m.at(x, s.y), b = m.at(x, s.y + 1); return !!(q && !q.open && !(m.def.roofs && m.def.roofs[q.ch]) && b && (b.open || b.block)); };
    var face = faceAt(s.x), door = !!(sb && sb.ch === 'd'), n8 = name8(m, s.x, s.y), v = NZ.h2(s.x * 7 + 3, s.y * 3 + 1, 43) * 4 | 0;
    var top = TV.piece(P === 'town' ? 'mountain_rock' : 'rock_top', v, P); if (!top) return null;
    var fn = !face ? '' : door ? (P === 'town' ? 'cliff_vault_door' : 'outside_mouth') : ({ timber: 'shored_face', runeWall: 'rune_wall', chimney: 'chimney', sealDoor: 'mine_door' })[n8] || (!faceAt(s.x - 1) && !faceAt(s.x + 1) ? 'cliff_middle' : !faceAt(s.x - 1) ? 'cliff_left' : !faceAt(s.x + 1) ? 'cliff_right' : 'cliff_middle');
    var fp = fn && TV.piece(fn, 0, P), lamp = face && n8 === 'lantern' ? TV.piece('wall_lantern_lit', 0, 'mine') : null; if (face && !fp) return null;
    return stash(m, 'K' + P + v + fn + (lamp ? 'L' : ''), function () {
      var c = canvasOf(T, T + (face ? H : 0), P !== 'town'), cx = c.cx;
      cx.drawImage(top.im, top.x, top.y, top.w, top.h, 0, 0, T, T);
      if (P !== 'town') { // (in the mines the rock's top two shades down its ramps: the art desk drew it like the cave floor, and the tunnels went into their walls)
        var id = cx.getImageData(0, 0, T, T), d = id.data; for (var o = 0; o < d.length; o += 4) { var c2 = TV.palStep([d[o], d[o + 1], d[o + 2]], -TV.ROCKDARK); d[o] = c2[0]; d[o + 1] = c2[1]; d[o + 2] = c2[2]; } cx.putImageData(id, 0, 0);
      }
      if (face) cx.drawImage(fp.im, fp.x, fp.y, fp.w, fp.h, 0, T, T, H);
      if (lamp) cx.drawImage(lamp.im, lamp.x, lamp.y, lamp.w, lamp.h, (T - lamp.w) / 2 | 0, T + H - 12 - lamp.h, lamp.w, lamp.h); // (a lantern hung on the face, where the first game's map has one in the wall)
      return { canvas: c.cv, h: H, face: face };
    });
  }
  // a prop's piece: the first game's name of the square where the floor is the mines' or the Glowseep's; the town's and the rooms' by the square's letter, where it stands
  // and what the room is dressed with (js/town.js T.TRADE). A slice: a two-square piece's left, middle or right square along a run of the same, or the whole squeezed (W)
  function propOf(m, s, P) {
    var at = function (dx, dy) { return m.at(s.x + dx, s.y + dy); }, is = function (q, chs) { return !!(q && chs.indexOf(q.ch) >= 0); }, v = NZ.h2(s.x * 5 + 2, s.y * 7 + 1, 47) * 4 | 0;
    var run = function () { var x0 = s.x, x1 = s.x; while (is(m.at(x0 - 1, s.y), s.ch)) x0--; while (is(m.at(x1 + 1, s.y), s.ch)) x1++; return x0 === x1 ? 'W' : s.x === x0 ? 'L' : s.x === x1 ? 'R' : 'M'; };
    var fence = function () { var f = function (q) { return is(q, 'fb') && !(q.open); }, n = f(at(0, -1)) && at(0, -1).ch === 'f', so = f(at(0, 1)) && at(0, 1).ch === 'f', e = f(at(1, 0)), w = f(at(-1, 0)); return { nm: (n || so) && (e || w) ? 'stockade_corner' : (n || so) ? 'stockade_ns' : 'stockade_ew', flat: true }; };
    if (P === 'mine' || P === 'seep') {
      var n8 = name8(m, s.x, s.y);
      if (n8 === 'fence') return fence();
      if (n8 === 'gate') return { nm: 'stockade_gate', flat: true };
      var by = { crate: 'crate', crateCave: 'crate', minecart: 'mine_cart', tent: 'tent_open', stump: 'offering_stump', tree: 'pine_tree', well: 'well', headframe: 'mine_headframe', cradle: 'milking_cradle', firepit: 'campfire', cocoon: 'sacks', lamp: P === 'seep' ? 'light_pole_lit' : 'lantern_post_lit', lantern: 'lantern_post_lit' }[n8];
      return by ? { nm: by } : null;
    }
    if (P === 'town') {
      if (s.ch === 'k') { var x0 = s.x; while (is(m.at(x0 - 1, s.y), 'k')) x0--; var off = s.x - x0; if (off % 2 === 0 && is(at(1, 0), 'k')) return { nm: 'market_stall', span: 2 }; if (off % 2) return { skip: true }; return { nm: ['crate', 'barrel', 'sacks', 'crate'][v] }; } // (the stalls two squares a stall from the west end of a run, a lone square a crate, a barrel or sacks)
      if (s.ch === 'w') return { nm: 'mine_headframe' }; // (a headframe's mouth on its spoil: js/town.js)
      if (s.ch === 'f') return fence();
      return null;
    }
    if (P === 'room') {
      var tr = (D.town && D.town.TRADE && D.town.TRADE[m.def.room]) || {}, dr = tr.dress || [], has = function (d) { return dr.indexOf(d) >= 0; };
      if (s.ch === 'S') return { nm: 'room_shelves', slice: s.y === 1 ? run() : 'M' };
      if (s.ch === 'K') {
        if (s.y === 3) return { nm: tr.counter === 'grille' ? 'room_grille' : 'room_counter', slice: run() };
        if (tr.counter === 'bar' && !is(at(-1, 0), 'K') && !is(at(1, 0), 'K')) return { nm: 'room_counter', slice: 'M' };
        if (has('chair')) return { nm: 'room_barber_chair' };
        if (has('desks') || has('bench')) return { nm: 'room_desk' };
        if (has('pews')) return { nm: 'room_pew', slice: run() };
        return { nm: 'room_table', slice: run() };
      }
      if (s.ch === 'k') return { nm: has('sacks') && s.x === (tr.side ? 2 : 1) ? 'room_sacks' : ['crate', 'room_barrel', 'crate', 'room_sacks'][v] };
      if (s.ch === 'f' && has('stalls')) return { nm: 'room_stable_stall', slice: 'M' };
      return null;
    }
    return null;
  }
  // THE HALLWAYS' ENTRANCES (10-28, his eye on the Warrens' stalls: "transluce the hallway entrance tiles by default to make it easier to tell the hallways in the part of the
  // galleries with the gate"): a hallway a square tall running east-west lies under the raised top of the rock south of it, so it read as rock from anywhere but beside it. On
  // the mines' floors the rock over its first TV.HALL squares from where it leaves a crossing -- a square of it with open ground north or south: the shaft, a wider gallery --
  // is drawn faint always (TV.SEE), its mouth seen from across the floor; the rest of it as before (the window round the party)
  TV.hallways = function (m) {
    var out = {}, open = function (x, y) { var q = m.at(x, y); return !!(q && q.open); };
    for (var y = 2; y < m.h; y++) for (var x = 0; x < m.w; x++) {
      var s = m.at(x, y); if (!s || s.open || s.ch !== '#' || !open(x, y - 1) || open(x, y - 2)) continue; // (a rock whose raised top lies over a hallway's square: open, rock north of it)
      for (var d = -1; d <= 1; d += 2) for (var k = 1; k <= TV.HALL; k++) { // (a crossing within TV.HALL squares along the hallway, the run between open)
        var x2 = x + d * k; if (!open(x2, y - 1)) break;
        if (open(x2, y - 2) || open(x2, y)) { out[x + ',' + y] = 1; break; }
      }
    }
    return out;
  };
  TV.FIRE = 140; // (the campfire's frame, ms)
  function artProp(m, s, P) {
    var T = TV.TS, o = propOf(m, s, P); if (!o) return null;
    if (o.skip) return { canvas: null, h: 0, skip: true };
    var fr = o.nm === 'campfire' ? ((typeof performance !== 'undefined' ? performance.now() : Date.now()) / TV.FIRE | 0) % 4 : 0, p = TV.piece(o.nm, fr, P); if (!p) return null;
    return stash(m, 'P' + o.nm + fr + (o.slice || '') + (o.span || '') + (o.flat ? 'f' : ''), function () {
      if (o.flat) { var f = canvasOf(T, T); f.cx.drawImage(p.im, p.x, p.y, p.w, p.h, 0, 0, T, T); return { canvas: f.cv, h: 0, face: false }; } // (a stockade's square, its earth drawn with it)
      var sx = 0, sw = p.w, dw = p.w;
      if (o.slice === 'L') sw = Math.min(p.w, T); else if (o.slice === 'R') { sx = Math.max(0, p.w - T); sw = p.w - sx; } else if (o.slice === 'M') { sx = Math.max(0, (p.w - T) / 2 | 0); sw = Math.min(p.w, T); }
      dw = o.slice === 'W' ? Math.min(p.w, T) : sw;
      var foot = 3, span = (o.span || 1) * T, cw = Math.max(span, dw), ch = Math.max(T, p.h + foot), c = canvasOf(cw, ch);
      c.cx.drawImage(p.im, p.x + sx, p.y, sw, p.h, o.slice ? 0 : (cw - dw) / 2 | 0, ch - foot - p.h, dw, p.h);
      return { canvas: c.cv, h: ch - T, face: true, ox: o.span ? 0 : (cw - T) / 2 | 0 };
    });
  }

  // ------------------------------------------------------------------ the drawing: the floor's pages in view (and one more nearby a frame), then everything standing, by row
  iso.draw = function (ctx, objs, overlay) {
    if (!on()) return draw0.apply(this, arguments);
    var m = iso.map, top = m.top, T = TV.TS, PG = TV.PAGE, f = ++top.frame, vw = iso.inWorld ? D.W / iso.zoom : D.W, vh = iso.inWorld ? D.H / iso.zoom : D.H, z = iso.inWorld ? 1 : iso.zoom, near = null;
    var artNow = TV.artOn(); if (artNow !== !!top.art) { TV.repaint(m); top.art = artNow; } // (the atlases landed, or the switch turned: every picture made again)
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
    top.props.forEach(function (pp) { if (pp.hex) list.push({ d: pp.depth, hex: true }); else if (pp.ed) list.push({ d: pp.depth, ed: true }); else if (pp.sq.y >= gyLo && pp.sq.y <= gyHi) list.push({ d: pp.depth, stand: pp.sq }); });
    (m.props || []).forEach(function (pp) { if (pp.draw || (pp.img && pp.kind !== 'rock' && pp.kind !== 'block' && pp.kind !== 'stone' && pp.kind !== 'tile')) list.push({ d: pp.sq ? pp.sq.y + 0.55 + pp.sq.x * 1e-4 : pp.depth, prop: pp }); });
    (objs || []).forEach(function (ob) { var u = ob.unit; list.push({ d: u ? u.y + 0.6 + u.x * 1e-4 + (ob.depth % 1) * 1e-3 : ob.depth != null && ob.depth < 0 ? -1 : 1e6 + (ob.depth || 0), obj: ob }); });
    list.sort(function (a, b) { return a.d - b.d; });
    // SEEN THROUGH (10-22, his eye on the dens: "too often hidden behind walls that should probably transluce"): on the mines' floors a standing thing drawn in front of one of
    // the party -- the rock's raised top over the gallery north of it, a tent, a stall -- is drawn faint where it covers them, so the party shows through it (TV.SEE); and on
    // Silverton's streets since 10-28, a house in front of them (RULED, Griz: "1 yes to both" -- his "we transluce if they walk on the street blocked by the houses?")
    var see = m.def.mine || TV.SEETOWN[m.def.key] ? (objs || []).filter(function (ob) { var u = ob.unit; return u && u.side === 'party' && !u.dead && !u.riding; }).map(function (ob) {
      var u = ob.unit, c = iso.center(u.x, u.y, m.at(u.x, u.y) ? m.at(u.x, u.y).gz : 0), p = iso.toScreen(c.x, c.y);
      return { d: u.y + 0.6, x0: p.x - T * 0.4 * z, x1: p.x + T * 0.4 * z, y0: p.y - T * 1.5 * z, y1: p.y + T * 0.4 * z };
    }) : [];
    var hall = m.def.mine ? (top.hall || (top.hall = TV.hallways(m))) : null;
    list.forEach(function (it) {
      if (it.obj) { it.obj.draw(ctx); return; }
      if (it.ed) { // (the Edifice: its strips in view, the picture's foot on its last row's south edge)
        var e = m.def.edifice, Hf = TV.edH(m), eW = (e.x1 - e.x0 + 1) * T, gq0 = m.at(Math.max(0, Math.min(m.w - 1, Math.round((e.x0 + e.x1) / 2))), Math.max(0, e.y1)), eg = gq0 ? gq0.gz : 0;
        for (var si = 0; si * TV.EDSTRIP < eW; si++) {
          var ea = iso.toScreen(e.x0 * T + si * TV.EDSTRIP, e.y0 * T - eg - Hf), esw = Math.min(TV.EDSTRIP, eW - si * TV.EDSTRIP) * z; if (ea.x >= vw || ea.x + esw <= 0 || ea.y >= vh) continue;
          var stp = TV.edStrip(m, si); ctx.drawImage(stp, ea.x, ea.y, stp.width * z, stp.height * z);
        }
        return;
      }
      if (it.hex) { var hx = m.def.hexagon, hp = hexCanvas(m), gq = m.at(Math.floor(hx.x), Math.floor(hx.y)), hg = gq ? gq.gz : 0, ha = iso.toScreen(hx.x * T - hp.ox, hx.y * T - hg - hp.wall - hp.oy); ctx.drawImage(hp.canvas, ha.x, ha.y, hp.canvas.width * z, hp.canvas.height * z); return; }
      if (it.prop) { var pp = it.prop; if (pp.draw) { pp.draw(ctx); return; } var c0 = iso.center(pp.sq.x, pp.sq.y, pp.gz || 0), s0 = iso.toScreen(c0.x, c0.y); ctx.drawImage(pp.img.canvas, s0.x - pp.img.ax * z, s0.y - pp.img.ay * z, pp.img.canvas.width * z, pp.img.canvas.height * z); return; }
      var s = it.stand, pic = standCanvas(m, s); if (pic.skip) return; var a = iso.toScreen(s.x * T - (pic.ox || 0), s.y * T - s.gz - pic.h); // (ox: a prop wider than its square, the art's)
      var wpx = pic.canvas.width * z, hpx = pic.canvas.height * z; if (a.x >= vw || a.y >= vh || a.x + wpx <= 0 || a.y + hpx <= 0) return;
      var over = see.filter(function (b) { return it.d > b.d && a.x < b.x1 && a.x + wpx > b.x0 && a.y < b.y1 && a.y + hpx > b.y0; });
      var put = function () { if (z === 1) ctx.drawImage(pic.canvas, a.x, a.y); else ctx.drawImage(pic.canvas, a.x, a.y, wpx, hpx); };
      if (hall && hall[s.x + ',' + s.y]) { TV.hallSeen = (TV.hallSeen || 0) + 1; ctx.save(); ctx.globalAlpha = TV.SEE; put(); ctx.restore(); return; } // (a hallway's entrance: faint always -- TV.hallways)
      if (!over.length) { put(); return; }
      // (a window round each of them: the picture whole outside it, faint inside)
      TV.seen = (TV.seen || 0) + 1;
      ctx.save(); ctx.beginPath(); ctx.rect(a.x, a.y, wpx, hpx); over.forEach(function (b) { ctx.rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); }); ctx.clip('evenodd'); put(); ctx.restore();
      ctx.save(); ctx.beginPath(); over.forEach(function (b) { ctx.rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); }); ctx.clip(); ctx.globalAlpha = TV.SEE; put(); ctx.restore();
    });
  };
})();
