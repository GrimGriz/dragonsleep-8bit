/* DEEP16 — THE TOWN: Silverton on the grid, true scale from the realm's city map v6 (the Silverton roam seat, 10-20; Griz, to the lanes desk: "yes v6 -
   but the orc with the fighting slaves needs a proper compound on the map not currently on the map (not accessible to game)", then of the compound "drawn but
   not enterable - it'll be larger than a house somewhat"). v6 draws itself by code at 1 px = 1 ft; tools/silverton_v6.py runs that code and writes what it
   drew to data/silverton-v6.js (D.TOWN_V6, in feet). Here the shapes become squares, 5 ft a square, the grid's x along v6's x (east) and its y along v6's y
   (south) -- the Edifice's face toward the grid's +y, the side the eye sees, as the Skylights' map has it (data/maps.js edifice).

   What each shape lays (later over earlier):
     the ground '.'; the mountain '#' above the cliff's foot (v6 y 352); the river 'D'; the Gate Plaza, Fountain Street and Gate Avenue dressed stone '='
     (the dwarves' ordered city); the other streets, the Arena Plaza and the roads packed dirt ','; the houses, the Shaft Rows' shacks, the Hexagon and the
     Edifice built stone 'b'; the fountains' water '~' in a stone rim '='; the stockade a rail 'f', open at its three gates between two posts 'b'; a
     headframe's mouth a well 'w' on its spoil 'r'; the stalls 'k'; the tower 'b'; Bloodsnout's compound 'b', walled, no way in.
   And the marks a later caller reads (T.lay's `marks`, each a square): the three gates, the vault door, every pin of v6's key by its number, and the
   shops' doors by the 8-bit's names -- marked, not built (the buy/sell screens are a later seat's: ART-78 to ART-82 wait in deep16/_src/Fresh). */
'use strict';
(function () {
  var D = window.D16 = window.D16 || {};
  var T = D.town = {};
  T.FT = 5;                               // a square at true scale
  // the town's square by default: drawn as if the party stood 30 ft tall (10-20, Griz, on his first look at the true-scale town: "Immediate impression is to render it
  // as if the player token is 30 feet tall...") -- v6's town six times smaller round a figure of the same size, as an RPG's town is; &ft=5 the true scale. The rooms behind the
  // doors stay true scale (T.room)
  T.SCALE = 30;
  T.X0 = 100; T.Y0 = 330; T.X1 = 2470; T.Y1 = 1880; // the floor's window on v6, in feet: the tower and THE road's way west to the river's bend east, the cliff's foot to past the south gate
  T.CLIFF = 352;                          // v6's cliff base: the mountain north of it
  // Bloodsnout's compound (10-20, his words above): the seat's draft -- behind the fighters' stables (19) and the arena family's house (24), on the open
  // ground east of the Arena Plaza against the stockade, its gate to the plaza; walled stone, a barracks along its back, the yard between, shut (invented.json bloodsnout-compound)
  T.COMPOUND = { x: 1560, y: 1582, w: 115, h: 90, gate: 'w' };
  // the town's one slope (10-20, Griz: "slope once off of fountain street, then leveled"): Fountain Street, the Gate Plaza's head and the Edifice's foot up on their level, the
  // ground falling DROP ft southward between SLOPE[0] and SLOPE[1] (v6's feet: the first sixty feet off the street), and level from there to the south gate
  var T_MAMA = [1435, 1295, 24]; // (Mama's booth, in v6's feet: its middle and its side -- outside the Hex's north-east, by the plaza)
  T.MAMA = T_MAMA; T.ZOOMSTEP = 1; T.OWNFT = 20; T.BOOTH = 24; // (OWNFT: how near v6's house a pin stands to be that house's door; BOOTH: the side of a booth for a pin with none, as Mama's)
  // the buildings of their own for the pins v6 sets in open ground, sized by what each is (10-22, the desk's calls standing for Griz's overrule: "a building of its own at
  // each pin with its door in the south wall. Size each by what it is, per the wiki"): Vilar the show-armorer's forge-booth on Mama's pattern; Davos Kren's leech-house, the
  // arena's own surgery (the-hex.md's fighter trade), a small house round the room of cots the game builds behind its door (T.TRADE), the pin a square inside its south
  // wall. Any other pin with no house gets Mama's booth. invented.json vilar-forge-booth, davos-leech-house
  T.PINHOUSE = { 'shop:vilar': { booth: true, ch: 'n' }, 'leech:davos': { room: true, ch: 'b' } };
  T.ROOMSIZE = { s: [10, 8], m: [12, 10], l: [16, 12] }; // (a room's size by its trade, in squares at T.FT: T.room)
  T.pinHouse = function (id) {
    var o = T.PINHOUSE[id] || { booth: true, ch: 'n' }, t = o.room && T.TRADE[id], S = t && T.ROOMSIZE[t.size];
    if (!S) return { w: T.BOOTH, h: T.BOOTH, dy: 0, ch: o.ch }; // (a booth, centred on its pin as Mama's is)
    return { w: S[0] * T.FT, h: S[1] * T.FT, dy: -S[1] * T.FT / 2 + T.FT, ch: o.ch };
  };
  // (ZOOMSTEP: the town's own zoom, a step out from the closest -- his "default zoom one step further out")
  T.SLOPE = [560, 620]; T.DROP = 30; T.FRONT = 60; T.RUN = 30; T.SHUT = 0.08; // (SHUT: the share of houses showing a shut door) // (FRONT: how far south of the street the first houses may begin; RUN: the fall behind them, inside the lane)

  T.lay = function (V, F0) {
    V = V || D.TOWN_V6;
    var F = F0 || T.FT, w = Math.round((T.X1 - T.X0) / F), h = Math.round((T.Y1 - T.Y0) / F), g = new Array(w * h), sl = new Uint8Array(w * h); // (sl: a roof's side -- 1 the half toward the light, 2 the other, 3 the ridge: js/iso.js roofCanvas)
    var cx = function (gx) { return T.X0 + (gx + 0.5) * F; }, cy = function (gy) { return T.Y0 + (gy + 0.5) * F; };
    var gxOf = function (x) { return Math.floor((x - T.X0) / F); }, gyOf = function (y) { return Math.floor((y - T.Y0) / F); };
    var own = new Array(w * h), tag = null; // (whose each square is: 'b<k>' v6's house k, 's<k>' its shack k, 'mama', 'booth:<door>' -- the building a door goes in, T.DOORS below)
    var set = function (gx, gy, ch, only) { if (gx < 0 || gy < 0 || gx >= w || gy >= h) return; var i = gy * w + gx; if (only && only.indexOf(g[i]) < 0) return; g[i] = ch; own[i] = tag; };
    var at = function (gx, gy) { return gx < 0 || gy < 0 || gx >= w || gy >= h ? null : g[gy * w + gx]; };
    // every square whose middle the test holds, over a box in feet
    var fill = function (x0, y0, x1, y1, test, ch, only) {
      for (var gy = Math.max(0, gyOf(y0)); gy <= Math.min(h - 1, gyOf(y1)); gy++) for (var gx = Math.max(0, gxOf(x0)); gx <= Math.min(w - 1, gxOf(x1)); gx++) if (test(cx(gx), cy(gy))) set(gx, gy, ch, only);
    };
    // a box turned by `a` about the point (px, py), its corner offset from that point by (ox, oy) before the turn
    var rect = function (px, py, ox, oy, bw, bh, a, ch, only, gable) {
      var c = Math.cos(a), s = Math.sin(a), r = Math.hypot(Math.abs(ox) + bw, Math.abs(oy) + bh) + F;
      fill(px - r, py - r, px + r, py + r, function (x, y) {
        var dx = x - px, dy = y - py, u = dx * c + dy * s - ox, v = -dx * s + dy * c - oy, inside = u >= 0 && u < bw && v >= 0 && v < bh;
        if (inside && gable) { var across = bw >= bh ? v : u, span = bw >= bh ? bh : bw, gx2 = gxOf(x), gy2 = gyOf(y); if (gx2 >= 0 && gy2 >= 0 && gx2 < w && gy2 < h) sl[gy2 * w + gx2] = (bw >= bh ? 0 : 3) + (span >= 3 * F && Math.abs(across - span / 2) < F / 2 ? 3 : across < span / 2 ? 1 : 2); } // (1-3: the ridge east-west; 4-6: north-south -- js/topview.js reads the way) // (the ridge along the long way)
        return inside;
      }, ch, only);
    };
    var segD = function (x, y, a, b) { var vx = b[0] - a[0], vy = b[1] - a[1], L = vx * vx + vy * vy, t = L ? Math.max(0, Math.min(1, ((x - a[0]) * vx + (y - a[1]) * vy) / L)) : 0; return Math.hypot(x - a[0] - t * vx, y - a[1] - t * vy); };
    var line = function (pts, width, ch, only) {
      for (var i = 0; i + 1 < pts.length; i++) {
        var a = pts[i], b = pts[i + 1], hw = Math.max(width, F * 0.9) / 2, r = hw + F; // (never thinner than a square: a road stays unbroken at any scale)
        fill(Math.min(a[0], b[0]) - r, Math.min(a[1], b[1]) - r, Math.max(a[0], b[0]) + r, Math.max(a[1], b[1]) + r, function (x, y) { return segD(x, y, a, b) <= hw; }, ch, only);
      }
    };
    var pip = function (x, y, poly) { var c = false; for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) { var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; };
    var poly = function (P, ch, only) { var xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; }); fill(Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys), function (x, y) { return pip(x, y, P); }, ch, only); };
    var ellipse = function (ex, ey, rx, ry, ch, only) { fill(ex - rx, ey - ry, ex + rx, ey + ry, function (x, y) { var u = (x - ex) / rx, v = (y - ey) / ry; return u * u + v * v <= 1; }, ch, only); };
    var OPEN = '.,=g~r';

    // the ground, the mountain, the river
    for (var i = 0; i < g.length; i++) g[i] = '.';
    fill(T.X0, T.Y0, T.X1, T.CLIFF, function () { return true; }, '#');
    line(V.river, 42, 'D');
    // the plazas, the streets, the roads (v6's order: plazas over the streets' ends, the roads out last)
    V.plaza.forEach(function (p, k) { fill(p[0], p[1], p[0] + p[2], p[1] + p[3], function () { return true; }, k === 0 ? '=' : ','); }); // (v6's first plaza is the Gate Plaza, its second the Arena Plaza)
    V.street.forEach(function (s) { var dressed = s[1] >= 72; line(s[0], s[1], dressed ? '=' : ',', dressed ? null : '.,'); }); // (Fountain Street, 72, and Gate Avenue, 86: dressed stone; the rest packed dirt)
    V.road.forEach(function (r) { line(r[0], r[1] >= 9 ? 15 : 10, ',', '.'); }); // (THE road three squares wide, the tracks two)
    // the Shaft Rows' shacks, the houses, the Hexagon, the Edifice
    // (each house one of three heights and roofs, each shack one of two, by its place in v6's order: houses that touch read as two -- the step between their roofs)
    var BOX = V.shack.map(function (s, k) { return { tag: 's' + k, ch: 'hj'.charAt((k * 5 + (k >> 1)) % 2), b: [s[0], s[1], -s[2] / 2, -s[3] / 2, s[2], s[3], s[4]] }; })
      .concat(V.bldg.map(function (b, k) { return { tag: 'b' + k, ch: 'bnu'.charAt((k * 7 + (k >> 2)) % 3), b: [b[0] + b[2] / 2, b[1] + b[3] / 2, -b[2] / 2, -b[3] / 2, b[2], b[3], b[4]] }; }));
    BOX.forEach(function (o) { tag = o.tag; rect(o.b[0], o.b[1], o.b[2], o.b[3], o.b[4], o.b[5], o.b[6], o.ch, null, true); }); tag = null;
    var hx = V.hexagon, hexP = []; for (var k = 0; k < 6; k++) { var an = Math.PI / 180 * (60 * k - 90); hexP.push([hx[0] + hx[2] * Math.cos(an), hx[1] + hx[2] * Math.sin(an)]); }
    poly(hexP, 'B');
    // Mama's Pharmakaiea out of the Hex, a booth beside its north-east face (10-21, Griz: "mama's shop may have to come out adjacent like the 8 bit did it, as the door is
    // technically on the north face and will be invis to players"): a low roof, its door south of it on the street (T.DOORS shop:lucia `at`)
    tag = 'mama'; rect(T.MAMA[0], T.MAMA[1], -T.MAMA[2] / 2, -T.MAMA[2] / 2, T.MAMA[2], T.MAMA[2], 0, 'n', null, true); tag = null;
    // whose building each door is (10-22, the desk's relay, on the house seat's open: "A door goes on the keeper's own building, never the next house along"): v6's house
    // or shack its pin stands in, or within T.OWNFT of (a pin set on the street at its front: Cassia's, Kess's); Mama's booth for hers; and a pin with no house that near
    // -- Vilar's and Davos Kren's, out in the Arena Plaza among the stalls -- a building of its own at the pin, sized by what it is (T.PINHOUSE), its door in the south wall
    var pinOf = function (d) { return d.at ? [d.at[0], d.at[1], d.pin] : V.PINS.filter(function (q) { return q[2] === d.pin; })[0]; }; // (`at`: a door moved off v6's pin -- Mama's booth)
    var boxFt = function (b, X, Y) { var c = Math.cos(b[6]), s = Math.sin(b[6]), dx = X - b[0], dy = Y - b[1], u = dx * c + dy * s - b[2], v = -dx * s + dy * c - b[3]; return Math.hypot(Math.max(0, -u, u - b[4]), Math.max(0, -v, v - b[5])); }; // (feet from the box, 0 inside)
    var whose = {};
    T.DOORS.forEach(function (d) {
      var p = pinOf(d); if (!p) return;
      if (d.at) { whose[d.id] = 'mama'; return; }
      var best = null, bd = 1e9; BOX.forEach(function (o) { var f = boxFt(o.b, p[0], p[1]); if (f <= bd) { bd = f; best = o; } }); // (<=: the one laid last, on top, where two hold the pin)
      if (best && bd <= T.OWNFT) { whose[d.id] = best.tag; return; }
      var ph = T.pinHouse(d.id); whose[d.id] = tag = 'pin:' + d.id; rect(p[0], p[1] + ph.dy, -ph.w / 2, -ph.h / 2, ph.w, ph.h, 0, ph.ch, null, true); tag = null;
    });
    // a door's building too small to hold a square's middle at this scale stands its middle square (on open ground only: never over another's)
    var sqOf = function () { var o = {}; for (var i2 = 0; i2 < g.length; i2++) if (own[i2] && T.ROOFS[g[i2]]) (o[own[i2]] = o[own[i2]] || []).push(i2); return o; }, have = sqOf();
    T.DOORS.forEach(function (d) {
      var tg = whose[d.id]; if (!tg || have[tg]) return;
      var o = BOX.filter(function (z) { return z.tag === tg; })[0], ph = o ? null : T.pinHouse(d.id), m = o ? o.b : [pinOf(d)[0], pinOf(d)[1] + ph.dy], gx = gxOf(m[0]), gy = gyOf(m[1]); // (a box's middle; a pin's own building's)
      if ('.,='.indexOf(at(gx, gy) || '#') >= 0) { tag = tg; set(gx, gy, o ? o.ch : ph.ch); tag = null; sl[gy * w + gx] = 3; } // (one square: all ridge)
    });
    fill(V.EDW[0], T.Y0, V.EDW[1], V.EDBOT, function () { return true; }, '#'); // (the Edifice: the dwarves' building in the mountain's face, its squares closed as rock -- drawn whole as the building since 10-28, def.edifice: js/topview.js TV.edStrip)
    // the fountains at the Edifice's foot: a pool in a dressed rim (v6: the basin 30 ft across the rim, 22 the water)
    V.FOUNT.forEach(function (x) { ellipse(x, V.EDBOT + 26, Math.max(30, F * 0.75), Math.max(30, F * 0.75), '='); ellipse(x, V.EDBOT + 26, Math.max(22, F * 0.55), Math.max(22, F * 0.55), '~'); });
    // the headframes: the spoil heap, the mouth on it
    V.headframe.forEach(function (f) { var s = f[2]; ellipse(f[0] + 26 * s, f[1] + 16 * s, 44 * s, 24 * s, 'r', OPEN); ellipse(f[0], f[1] + 16 * s, Math.max(7, 15 * s, F * 0.55), Math.max(5, 8 * s, F * 0.55), 'w', OPEN); });
    // the stalls in the open ground (v6 turns each about its corner)
    V.stall.forEach(function (s) { rect(s[0], s[1], 0, 0, s[2], s[3], s[4], 'k', '.,='); });
    // MARTA VENN'S COOK-STALL (10-28, Griz: "she needs a vender stall rather than a crate"): a stall of her own, two squares wide -- two 'k' in a run, the town's market
    // stall (js/topview.js propOf's market_stall) -- on the ground south of where she stands (T.PLACE marta), she behind it facing the plaza, the crates that stood
    // round her cleared off and her own square open; E at the stall, or a click on it, is a word with her (T.floor). invented.json marta-cook-stall
    var stall = {}; Object.keys(T.STALL).forEach(function (id) {
      var pl = T.PLACE[id], p = pl && V.PINS.filter(function (q) { return q[2] === pl.pin; })[0]; if (!p) return;
      var sx = gxOf(p[0] + ((pl.d || [])[0] || 0)), sy = gyOf(p[1] + ((pl.d || [])[1] || 0)), n = T.STALL[id];
      for (var oy0 = -1; oy0 <= 2; oy0++) for (var ox0 = -1; ox0 <= n; ox0++) if (at(sx + ox0, sy + oy0) === 'k') set(sx + ox0, sy + oy0, ','); // (the plaza's crates round her, cleared)
      if ('.,='.indexOf(at(sx, sy) || '#') < 0) return;
      for (var k0 = 0; k0 < n; k0++) set(sx + k0, sy + 1, 'k', '.,=');
      stall[id] = [sx, sy + 1];
    });
    // the tower: its foot, a round of built stone (v6 draws it standing, 22 ft across)
    ellipse(V.tower[0], V.tower[1] - 8, Math.max(14, F * 0.55), Math.max(14, F * 0.55), 'B');
    // (v6's stockade is not laid: 10-21, Griz, of the rail that fenced the floor's edges: "I think they're the stockade fences" -- "seem superfluous". The gates stay as marks)
    // Bloodsnout's compound: a stone wall round a yard, the barracks along the back (east), the gate on the plaza side shut -- drawn, never entered
    var C = T.COMPOUND, cg0 = gxOf(C.x), cg1 = gxOf(C.x + C.w), ch0 = gyOf(C.y), ch1 = gyOf(C.y + C.h), bk = Math.max(1, Math.round(25 / F));
    for (var yy = ch0; yy <= ch1; yy++) for (var xx = cg0; xx <= cg1; xx++) set(xx, yy, xx > cg1 - bk ? 'b' : (yy === ch0 || yy === ch1 || xx === cg0) ? 'q' : '.'); // (q: its wall, 10 ft; b: the barracks, 25 ft deep along the back)
    if (F <= 10) for (yy = gyOf(C.y + 20); yy <= gyOf(C.y + 40); yy++) for (xx = gxOf(C.x + 20); xx <= gxOf(C.x + 50); xx++) set(xx, yy, 'b'); // (the master's house in the yard's north-west corner: too small to show at a town's scale)

    // ---------------------------------------------------------------- the marks
    var marks = { gates: {}, pins: {}, doors: {}, stall: stall }; // (stall: a keeper's stall on the street by their id, its west square -- Marta's)
    var nearestOpen = function (x, y, maxFt, skip) { // the open square nearest a point in feet, within maxFt (a pin sits on its building; its door is the street square nearest it), not one in `skip`
      var g0 = gxOf(x), g1 = gyOf(y), best = null, bd = 1e9, maxR = Math.max(2, Math.ceil((maxFt || 150) / F));
      for (var dy = -maxR; dy <= maxR; dy++) for (var dx = -maxR; dx <= maxR; dx++) { var t = at(g0 + dx, g1 + dy); if (t == null || OPEN.indexOf(t) < 0 || t === '~' || t === 'r' || (skip && skip[(g0 + dx) + ',' + (g1 + dy)])) continue; var d = Math.hypot(cx(g0 + dx) - x, cy(g1 + dy) - y); if (d < bd) { bd = d; best = [g0 + dx, g1 + dy]; } }
      return best;
    };
    var GATE = { 0: 'south', 1: 'west', 2: 'east' }; // (v6's gateposts in its own order: the south gate track, THE road's west gate, the east road to the farms)
    V.gate.forEach(function (q, k) { marks.gates[GATE[k] || 'g' + k] = nearestOpen(q[0] + (k === 1 ? 14 : 0), q[1] + (k === 1 ? -14 : 0)); }); // (the west gate's mark a step inside, where the road from the fork arrives)
    V.PINS.forEach(function (p) { marks.pins[p[2]] = nearestOpen(p[0], p[1]); });
    // the ground the streets reach from the west gate (a door or a person in a yard closed in by houses would be out of reach: at a town's scale a block's back yards close up)
    var reach = new Uint8Array(w * h), WALK = '.,=dr~', out = {};
    var walkReach = function () { // (walked again once a way to a door is cut: T.DOORS below)
      reach.fill(0); var qq = [marks.gates.west]; reach[marks.gates.west[1] * w + marks.gates.west[0]] = 1;
      for (var qi = 0; qi < qq.length; qi++) { var c1 = qq[qi]; for (var ddy = -1; ddy <= 1; ddy++) for (var ddx = -1; ddx <= 1; ddx++) { var nx = c1[0] + ddx, ny = c1[1] + ddy; if ((!ddx && !ddy) || nx < 0 || ny < 0 || nx >= w || ny >= h || reach[ny * w + nx] || WALK.indexOf(g[ny * w + nx]) < 0) continue; if (ddx && ddy && (WALK.indexOf(at(c1[0] + ddx, c1[1])) < 0 || WALK.indexOf(at(c1[0], c1[1] + ddy)) < 0)) continue; reach[ny * w + nx] = 1; qq.push([nx, ny]); } }
      out = {}; for (var ri = 0; ri < g.length; ri++) if (!reach[ri] && OPEN.indexOf(g[ri]) >= 0) out[(ri % w) + ',' + Math.floor(ri / w)] = 1;
    };
    walkReach();
    marks.compound = nearestOpen(C.x - 6, C.y + C.h / 2, 30, out); // (outside its shut gate)
    // the Hexagon's doors (v6: black at 62 and 118 degrees -- the front, south, to the Arena Plaza -- and at -62 and -118, the back to the falls): the square outside each
    var hexDoor = function (deg) { var a = Math.PI / 180 * deg; var o2 = hx[2] + Math.max(6, F * 0.6); return nearestOpen(hx[0] + Math.cos(a) * o2, hx[1] + Math.sin(a) * o2, 20); };
    // (10-21, Griz: "those doors should be double doors at the southern tip (carved away so the doors are straight n/s)" -- the wiki's corner double doors at the north and
    // south points: the front at the south tip, the back at the north; at the town's scale one square each, finer two)
    var tipDoors = function (deg) { var q = [hexDoor(deg - 5), hexDoor(deg + 5)].filter(Boolean); return q.length === 2 && q[0][0] === q[1][0] && q[0][1] === q[1][1] ? [q[0]] : q; };
    marks.hexFront = tipDoors(90); marks.hexBack = tipDoors(-90);
    // the vault door: its threshold across the Gate Plaza's foot of the Edifice, v6's door 128 ft wide
    var vy = gyOf(V.EDBOT) + 1; for (var vx = gxOf(V.AX - 64); vx <= gxOf(V.AX + 64); vx++) set(vx, vy, 'd');
    marks.vault = [gxOf(V.AX), vy];
    // the doors of the shops and the keepers (the 8-bit's trigger at each, content/maps/silverton.json, by its slot's pin): a threshold 'd' on the street, marked, not built
    var hard, taken, fixed = [marks.gates.west, marks.gates.south, marks.gates.east].concat(marks.hexFront, marks.hexBack).filter(Boolean); // (no door on a gate or the Hex's)
    var tk = function (q) { hard[q[0] + ',' + q[1]] = 1; for (var dy2 = -1; dy2 <= 1; dy2++) for (var dx2 = -1; dx2 <= 1; dx2++) taken[(q[0] + dx2) + ',' + (q[1] + dy2)] = 1; };
    var reserve = function () { hard = Object.assign({}, out); taken = Object.assign({}, out); fixed.forEach(function (q) { hard[q[0] + ',' + q[1]] = taken[q[0] + ',' + q[1]] = 1; }); Object.keys(marks.doors).forEach(function (k) { tk(marks.doors[k]); }); };
    marks.doors = {}; reserve();
    // every door in its own building's wall (10-22, the house seat; Griz: "A lot of the buildings (cassia) are still floor tile entry with no south-facing door", and 10-21 night
    // "still have floor tile entrancing on a lot"; then the desk: "A door goes on the keeper's own building, never the next house along"): a door's threshold is the ground at
    // the foot of its building's south wall (whose, above), so the door is drawn in that wall (js/topview.js) and clicked there (T.doorClick) -- the foot nearest the pin, with
    // the street in front where it has one, a square clear of any other door where it can; the doors with the fewest feet placed first. At the town's 30 ft a keeper's house
    // can stand back to back with the next row, or face a yard the coarse squares close up (Brennan's, Marin's, Venn Hale's, Mela's, the factor house's): there the way to its
    // south wall is cut (cutWay). Only a building with no way at all would take the open square nearest its pin, as before, and say so (the lay's doorMiss)
    var mine = sqOf(), ground = function (x, y) { var c = at(x, y); return !!c && '.,='.indexOf(c) >= 0; };
    var feet = function (tg, way, loose) { var o = [], block = loose ? hard : taken; (mine[tg] || []).forEach(function (i) { var x = i % w, y = (i - x) / w; if (own[(y + 1) * w + x] === tg || !ground(x, y + 1) || block[x + ',' + (y + 1)]) return; if (way && (!ground(x, y + 2) || out[x + ',' + (y + 2)])) return; o.push([x, y + 1]); }); return o; };
    var nearest = function (list, p) { var best = null, bd = 1e9; list.forEach(function (q) { var d = Math.hypot(cx(q[0]) - p[0], cy(q[1] - 1) - p[1]); if (d < bd) { bd = d; best = q; } }); return best; }; // (by its wall's square: the pin's own end of the house)
    var place = function (d, q) { tk(q); set(q[0], q[1], 'd'); marks.doors[d.id] = q; };
    var doorMiss = [], cut = [], keeperOwn = {}; Object.keys(whose).forEach(function (k) { keeperOwn[whose[k]] = 1; });
    // the way cut to a house's south wall: from every square in reach, four ways, the fewest squares of a plain house or shack (never a keeper's, a door, the Hex, water or
    // the mountain) to a square at the foot of the house's south wall, up to CUTMAX; those squares laid as packed dirt, a lane. Then the reach walked again
    var cutWay = function (tg, p) {
      var N = w * h, cost = new Int16Array(N).fill(-1), prev = new Int32Array(N).fill(-1), bk = [[], [], [], []], CUTMAX = 3, goal = {};
      (mine[tg] || []).forEach(function (i) { var j = i + w; if (j < N && own[j] !== tg && !fixed.some(function (q) { return q[1] * w + q[0] === j; })) goal[j] = 1; });
      var pass = function (j) { var c = g[j]; if ('.,='.indexOf(c) >= 0) return 0; return (T.HOUSES + T.SHACKS).indexOf(c) >= 0 && !keeperOwn[own[j]] ? 1 : -1; };
      for (var i = 0; i < N; i++) if (reach[i] && '.,='.indexOf(g[i]) >= 0) { cost[i] = 0; bk[0].push(i); }
      for (var c = 0; c <= CUTMAX; c++) for (var k2 = 0; k2 < bk[c].length; k2++) {
        var j0 = bk[c][k2]; if (cost[j0] !== c) continue; var x0 = j0 % w;
        [x0 > 0 ? j0 - 1 : -1, x0 < w - 1 ? j0 + 1 : -1, j0 - w, j0 + w].forEach(function (j) { if (j < 0 || j >= N) return; var pc = pass(j); if (pc < 0) return; var nc = c + pc; if (nc > CUTMAX || (cost[j] >= 0 && cost[j] <= nc)) return; cost[j] = nc; prev[j] = j0; bk[nc].push(j); });
      }
      var best = -1, bestD = 1e9; Object.keys(goal).forEach(function (s) { var j = +s; if (cost[j] < 0) return; var d = Math.hypot(cx(j % w) - p[0], cy((j - j % w) / w - 1) - p[1]); if (best < 0 || cost[j] < cost[best] || (cost[j] === cost[best] && d < bestD)) { best = j; bestD = d; } });
      if (best < 0) return false;
      for (var j1 = best; j1 >= 0 && cost[j1] > 0; j1 = prev[j1]) if (pass(j1) === 1) { set(j1 % w, (j1 - j1 % w) / w, ','); sl[j1] = 0; cut.push([j1 % w, (j1 - j1 % w) / w]); }
      walkReach(); reserve(); return true;
    };
    T.DOORS.filter(function (d) { return whose[d.id]; }).map(function (d, k) { return { d: d, k: k, n: feet(whose[d.id]).length }; }).sort(function (a, b) { return a.n - b.n || a.k - b.k; }).forEach(function (e) {
      var d = e.d, p = pinOf(d), tg = whose[d.id], foot = function () { return nearest(feet(tg, true), p) || nearest(feet(tg), p) || nearest(feet(tg, false, true), p); }; // (the last: beside another door in the one wall -- the factor houses' two)
      var q = foot() || (cutWay(tg, p) && foot());
      if (!q) { q = nearestOpen(p[0], p[1], 150, taken); doorMiss.push(d.id); }
      if (q) place(d, q);
    });
    var inOrder = {}; T.DOORS.forEach(function (d) { if (marks.doors[d.id]) inOrder[d.id] = marks.doors[d.id]; }); marks.doors = inOrder; // (in T.DOORS' order, as before)
    var v6pins = {}; V.PINS.forEach(function (p) { v6pins[p[2]] = [p[0], p[1]]; });
    // the slope by the column (10-21, Griz: "the buildings facing fountain street would be on the same level as fountain street, the houses behind them on the worn down
    // dirt that ends up a little lower"): a column keeps the street's level through the first houses south of it (begun within T.FRONT ft of SLOPE[0]) and falls behind
    // them over T.RUN ft; a column with none there (a gap, a road south) takes the line from the houses on either side, else falls where the old band began
    var RUN = F >= T.RUN ? T.RUN : Math.max(T.RUN, T.DROP * T.FT / 2.5), ends = []; // (a step of the grid's height a square at most: at the true scale the fall takes 60 ft)
    for (var x6 = 0; x6 < w; x6++) {
      var y6 = Math.max(0, gyOf(T.SLOPE[0])), seen = false, end = null;
      for (; y6 < h; y6++) { var roofed = !!T.ROOFS[at(x6, y6)]; if (!seen && cy(y6) > T.SLOPE[0] + T.FRONT) break; if (roofed) seen = true; else if (seen) { end = cy(y6) - F / 2; break; } } // (the first houses, followed to their back wall)
      ends.push(seen ? (end == null ? T.Y0 + h * F : end) : null);
    }
    var near6 = function (x, d) { for (var k = 1; k < w; k++) { var q = x + d * k; if (q < 0 || q >= w) return null; if (ends[q] != null) return { x: q, e: ends[q] }; } return null; };
    var endAt = ends.map(function (e, x) { if (e == null) { var l = near6(x, -1), r = near6(x, 1); e = l && r ? l.e + (r.e - l.e) * (x - l.x) / (r.x - l.x) : l ? l.e : r ? r.e : T.SLOPE[0]; } return T.Y0 + Math.round((e - T.Y0) / F) * F; }); // (on a square's edge: the fall a step a square)
    if (F < T.RUN) { // (at the fine scales the line moves a square at most from one column to the next, both ways: no cliff across the lane; at the town's 30 ft a square is the whole fall)
      for (var xs = 1; xs < w; xs++) endAt[xs] = Math.max(endAt[xs - 1] - F, Math.min(endAt[xs - 1] + F, endAt[xs]));
      for (xs = w - 2; xs >= 0; xs--) endAt[xs] = Math.max(endAt[xs + 1] - F, Math.min(endAt[xs + 1] + F, endAt[xs]));
    }
    var hg = []; for (var y4 = 0; y4 < h; y4++) { var fy = cy(y4); for (var x4 = 0; x4 < w; x4++) { var e0 = endAt[x4], e = fy <= e0 ? T.DROP : fy >= e0 + RUN ? 0 : T.DROP * (e0 + RUN - fy) / RUN; hg[y4 * w + x4] = Math.round(e * T.FT / F / 2.5); } } // (in the grid's steps, 2.5 ft, at the square's scale)
    for (var x5 = 0; x5 < w; x5++) for (var y5b = 1; y5b < h; y5b++) if (T.ROOFS[at(x5, y5b)] && T.ROOFS[at(x5, y5b - 1)]) hg[y5b * w + x5] = hg[(y5b - 1) * w + x5]; // (a building stands on one level: never split by the fall)
    var heights = []; for (var y9 = 0; y9 < h; y9++) { var hr = ''; for (var x9 = 0; x9 < w; x9++) hr += hg[y9 * w + x9].toString(36); heights.push(hr); }
    // the south doors are the stores' (their threshold 'd': js/topview.js draws the door and the 8-bit's sign over it), and a few houses' shut doors, plainly not a way in
    // (10-21, Griz: "have only the stores have south-facing doors, or mix it up some and have a couple on houses that are clearly different (you can't go in) doors"):
    // the middle of a house's south wall where the hash picks it, T.SHUT of them (before, every building had one -- his "all the buildings have south doors", re-cut)
    var faceDoors = {}, pick7 = function (a, b) { var q = (a * 374761393 + b * 668265263) | 0; q = Math.imul(q ^ (q >>> 13), 1274126177); return ((q ^ (q >>> 16)) >>> 0) / 4294967296; };
    for (var y7 = 0; y7 < h; y7++) for (var x7 = 0; x7 < w; ) {
      var c7 = at(x7, y7), isFace = function (x) { var c = at(x, y7), s = at(x, y7 + 1); return c === c7 && s != null && s !== c7 && OPEN.indexOf(s) >= 0 && s !== '~'; };
      if (!c7 || T.HOUSES.indexOf(c7) < 0 || !isFace(x7)) { x7++; continue; }
      var x8 = x7, hasD = false; while (x8 < w && isFace(x8)) { if (at(x8, y7 + 1) === 'd') hasD = true; x8++; }
      var mid = Math.floor((x7 + x8 - 1) / 2); if (!hasD && pick7(Math.floor(cx(mid)), Math.floor(cy(y7))) < T.SHUT) faceDoors[mid + ',' + y7] = 1; // (by the place in feet: the same houses at any scale)
      x7 = x8;
    }
    for (var si = 0; si < g.length; si++) if (!T.ROOFS[g[si]]) sl[si] = 0; // (a side only where a roof still stands: the streets, the doors and the yard laid over some)
    var slope = []; for (var y3 = 0; y3 < h; y3++) { var sr = ''; for (var x3 = 0; x3 < w; x3++) sr += sl[y3 * w + x3]; slope.push(sr); }
    return { own: own, doorOwner: whose, doorMiss: doorMiss, cut: cut, w: w, h: h, rows: (function () { var out = []; for (var y2 = 0; y2 < h; y2++) out.push(g.slice(y2 * w, y2 * w + w).join('')); return out; })(), slope: slope, heights: heights, reach: reach, marks: marks, v6pins: v6pins, F: F, faceDoors: faceDoors };
  };

  // the doors: the 8-bit's Silverton triggers (content/maps/silverton.json: shop, keeper, inn, leech, chapel, warp) at their slot's pin in v6's key (the wiki's slots are
  // v6's pins: TarlynsPit/wiki/silverton-people.md). `art`: the art desk's sheets for the buy/sell screen that waits for them (deep16/_src/Fresh, 10-20)
  T.DOORS = [
    { id: 'keeper:casper', pin: '4', art: 'ART-79' }, { id: 'keeper:androit', pin: '5', art: 'ART-80' }, { id: 'keeper:hessle', pin: '6', art: 'ART-81' },
    { id: 'keeper:falstaff', pin: '7' }, { id: 'keeper:aldric', pin: '7', art: 'ART-82', name: 'Aldric Vest', what: 'the Newland wool-and-grain factor' }, // (7b: the factor houses' second door -- not in the 8-bit)
    { id: 'shop:kessler', pin: '8' }, { id: 'shop:calla', pin: '9' }, { id: 'keeper:barber', pin: '10' }, { id: 'inn:cassia', pin: '11' }, { id: 'keeper:mela', pin: '12' },
    { id: 'keeper:marin', pin: '13' }, { id: 'keeper:brennan', pin: '14' }, { id: 'shop:marko', pin: '15' }, { id: 'shop:kasten', pin: '16' }, { id: 'keeper:venhale', pin: '19' },
    { id: 'shop:vilar', pin: '20' }, { id: 'leech:davos', pin: '21' }, { id: 'keeper:kess', pin: '29' }, { id: 'chapel:aldwin', pin: '30' }, { id: 'keeper:mical', pin: '32' },
    { id: 'shop:lisbet', pin: '33' }, { id: 'keeper:merrick', pin: '34' }, { id: 'warp:winters', pin: '35', art: 'ART-78' }, { id: 'warp:percy', pin: '38' },
    { id: 'keeper:tam', pin: '40' }, { id: 'shop:lucia', pin: '42', at: [T_MAMA[0], T_MAMA[1]] },
    { id: 'keeper:sylvia', pin: '37', name: 'Sylvia Swann', what: 'the fortune-teller\'s booth', art: 'ART-SYLVIA-SWANN' } // (10-20, Griz: "sylvia will get one" -- not in the 8-bit's doors: its sign says she isn't in)
  ];
  // the doors with rooms behind them (10-20, Griz: "just vendors and interactions (sylvia will get one)"): the 8-bit's shops, the five of the new buy/sell screens, the inn, the
  // leech, the chapel, the lantern house's window, and Sylvia. The rest are doors whose keeper speaks at the door (T.fire)
  T.ROOMS = ['shop:kessler', 'shop:calla', 'shop:marko', 'shop:kasten', 'shop:vilar', 'shop:lisbet', 'shop:lucia', 'warp:winters', 'warp:percy', 'keeper:casper', 'keeper:androit',
    'keeper:hessle', 'keeper:aldric', 'inn:cassia', 'leech:davos', 'chapel:aldwin', 'keeper:merrick', 'keeper:sylvia'];
  T.hasRoom = function (id) { return T.ROOMS.indexOf(id) >= 0; };
  // the people: the 8-bit's Silverton NPCs (their list and conditions read from its own data, DS.DATA.maps.silverton.npcs), each where v6 and the wiki put them -- by
  // their slot's pin, a few feet off it (d: feet east, south), or a mark (at). Standing, facing as the 8-bit has them; their stand-in figures the plain sheets the
  // Skylights' townsfolk wear (battle.js townsfolk) until the art desk's townsfolk are cut (ART-52), the gate hand a guard
  T.PLACE = {
    guard1: { at: 'gate:west', d: [10, 10] }, marta: { pin: '22', d: [-10, 0] }, gull: { pin: '25' }, kael: { pin: '26' }, brennock: { pin: '27' }, vera: { pin: '28' },
    oldhob: { pin: '25', d: [25, 15] }, papa: { at: 'hexFront', d: [-12, 8] }, vivian: { pin: '23', d: [0, -20] }, aurdinChapel: { pin: '30', d: [10, 0] }, pete: { pin: '18' },
    idony: { pin: '5', d: [20, 10] }, signy: { pin: '26', d: [-30, 25] }, elsbethCandles: { pin: '23', d: [40, -15] },
    towns1: { pin: '11', d: [0, -50] }, towns2: { pin: '12', d: [-20, -60] }, towns3: { pin: '14', d: [0, -40] }, towns4: { pin: '32', d: [-40, 0] },
    towns5: { pin: '28', d: [30, 30] }, towns6: { pin: '24', d: [-40, 0] }, towns7: { pin: '35', d: [0, -60] }, towns8: { pin: '16', d: [0, 40] }
  };
  T.STALL = { marta: 2 }; // (a keeper's stall on the street, squares wide: T.lay -- Marta's cook-stall, 10-28)
  T.KIND = { guard: 'guard', merchant: 'crewman', noble: 'crewman', clerk: 'crewman', worker: 'brawler', worker2: 'brawler', oldhand: 'brawler', papa: 'thug' }; // (the rest: 'bandit')
  T.FACE = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  // ---------------------------------------------------------------- the floor the roam walks: deep16/?roam=silverton (js/roam.js R.make)
  // &gate=west|south|east: where the party arrives (the west gate by default, where the road from the fork comes in -- a later caller, the world map, drops the party there);
  // &cut=x,y,w,h: a window of the town, in squares (the whole town is 474 x 310)
  T.floor = function (q, flags) {
    q = q || ''; flags = flags || {};
    var F = +((/[?&]ft=(\d+)/.exec(q) || [])[1] || T.SCALE), L = (T.laidF = T.laidF || {})[F] || (T.laidF[F] = T.lay(null, F)), cut = /[?&]cut=(\d+),(\d+),(\d+),(\d+)/.exec(q), ox = 0, oy = 0, w = L.w, h = L.h;
    if (cut) { ox = +cut[1]; oy = +cut[2]; w = Math.min(+cut[3], L.w - ox); h = Math.min(+cut[4], L.h - oy); }
    var inW = function (p) { return !!p && p[0] >= ox && p[1] >= oy && p[0] < ox + w && p[1] < oy + h; }, to = function (p) { return p ? [p[0] - ox, p[1] - oy] : null; };
    var rows = L.rows.slice(oy, oy + h).map(function (r) { return r.slice(ox, ox + w); }), M = L.marks;
    var gate = (/[?&]gate=([a-z]+)/.exec(q) || [])[1] || 'west', at = M.gates[gate] || M.gates.west, face = { west: [1, 0], south: [0, -1], east: [-1, 0] }[gate] || [1, 0];
    var at0 = /[?&]at=(\d+),(\d+)/.exec(q); if (at0) at = [+at0[1], +at0[2]];
    if (!inW(at)) { for (var y = 0; y < h && !inW(at); y++) for (var x = 0; x < w; x++) if (rows[y][x] === ',' || rows[y][x] === '=') { at = [x + ox, y + oy]; break; } } // (a window without the gate in it: its first street square)
    // the ways off the floor: every open square of its west, south and east edges (10-21, Griz: "leaving the far tile on west, south or E should kick you out of
    // town"), and a road where it runs off the north (the world map takes the party on there -- js/world.js)
    var ways = [], offEdge = {};
    for (var y1 = 0; y1 < h; y1++) for (var x1 = 0; x1 < w; x1++) {
      var c1 = rows[y1][x1], side1 = x1 === 0 ? 'west' : x1 === w - 1 ? 'east' : y1 === h - 1 ? 'south' : null;
      if (c1 === ',' && (side1 || y1 === 0)) ways.push([x1, y1]);
      else if (side1 && '.=dr'.indexOf(c1) >= 0) { ways.push([x1, y1]); offEdge[x1 + ',' + y1] = side1; }
    }
    var trig = [];
    Object.keys(M.doors).forEach(function (id) { var d = M.doors[id], dd = T.DOORS.filter(function (z) { return z.id === id; })[0]; if (inW(d)) trig.push({ id: id, on: 'use', rect: to(d).concat([1, 1]), town: 'door', door: dd }); }); // (a click on the door, or E beside it -- not a step onto it: 10-21, Griz: "swap the stand on this tile to go in the shop to clicking on the door")
    var people = [], npc8 = (((window.DS || {}).DATA || {}).maps || {}).silverton, used = {};
    [M.gates.west, M.gates.south, M.gates.east, M.vault].concat(M.hexFront, M.hexBack, Object.keys(M.doors).map(function (k) { return M.doors[k]; })).forEach(function (q) { if (q) used[q[0] + ',' + q[1]] = 1; }); // (no one stands on a gate, a door or the Hexagon's doors -- at the town's scale a few feet off a mark is the mark)
    // (nor on the way up to a door: the square in front of it, or for a door on a lane between two houses the lane's squares beside it -- 10-22, a door in a nook had one)
    var noStand = Object.create(used), openSq = function (x, y) { var r = L.rows[y]; return !!r && '.,='.indexOf(r.charAt(x)) >= 0; };
    Object.keys(M.doors).forEach(function (k) { var q = M.doors[k]; if (openSq(q[0], q[1] + 1)) noStand[q[0] + ',' + (q[1] + 1)] = 1; else [-1, 1].forEach(function (o) { if (openSq(q[0] + o, q[1])) noStand[(q[0] + o) + ',' + q[1]] = 1; }); });
    ((npc8 && npc8.npcs) || []).forEach(function (n) {
      var pl = T.PLACE[n.id]; if (!pl || !T.cond(n.cond, flags)) return;
      var p0 = pl.pin ? (L.v6pins[pl.pin] || null) : null, sq = null;
      if (pl.at === 'gate:west') sq = M.gates.west; else if (pl.at === 'hexFront') sq = M.hexFront[0];
      if (sq) p0 = [T.X0 + (sq[0] + 0.5) * L.F, T.Y0 + (sq[1] + 0.5) * L.F];
      if (!p0) return;
      sq = T.openNear(L, p0[0] + ((pl.d || [])[0] || 0), p0[1] + ((pl.d || [])[1] || 0), noStand); if (!sq || !inW(sq)) return;
      used[sq[0] + ',' + sq[1]] = 1;
      var s = to(sq); people.push({ id: n.id, at: s, kind: T.KIND[n.look] || 'bandit', face: T.FACE[n.dir] || [0, 1], look: n.look, hire: n.hire || null });
      trig.push({ id: 'talk:' + n.id, on: 'use', rect: s.concat([1, 1]), town: 'talk', npc: n.id });
      var st0 = M.stall && M.stall[n.id]; if (st0 && inW(st0)) trig.push({ id: 'talk:' + n.id, on: 'use', rect: to(st0).concat([T.STALL[n.id], 1]), town: 'talk', npc: n.id, stall: true }); // (her stall: E at it, or a click on it, a word with her across it)
    });
    // the keepers with no room who now have a figure of their own stand beside their door on the street, facing south (js/counter.js C.AT_DOOR -- 10-21, Griz:
    // "Got south idles for several existing shopkeeps in Fresh"): Marin Voss, Venn the barber
    // (10-21 night, Mela Sorris and Mical: a door may open north -- the Stew's, its street above it -- or onto a lane one square wide -- the warehouse's -- so every side
    // is tried, and a square that would wall the door off from the west gate is passed over: the reach walked again with the figure standing there, as T.lay walks it)
    var WALK = '.,=dr~', reachedWith = function (dq, cand) {
      var seen = {}, qq = [L.marks.gates.west], key = function (x, y) { return x + ',' + y; }, ok = function (x, y) { var r = L.rows[y]; return !!r && x >= 0 && x < r.length && WALK.indexOf(r.charAt(x)) >= 0 && (x === dq[0] && y === dq[1] || r.charAt(x) === 'd' || !used[key(x, y)]) && !(x === cand[0] && y === cand[1]); }; // (a threshold is walked over, though no one stands on it: 10-22, a lane past two doors to Mela's)
      seen[key(qq[0][0], qq[0][1])] = 1;
      for (var i = 0; i < qq.length; i++) { var c = qq[i]; if (c[0] === dq[0] && c[1] === dq[1]) return true;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var nx = c[0] + dx, ny = c[1] + dy; if ((!dx && !dy) || seen[key(nx, ny)] || !ok(nx, ny)) continue; if (dx && dy && (!ok(c[0] + dx, c[1]) || !ok(c[0], c[1] + dy))) continue; seen[key(nx, ny)] = 1; qq.push([nx, ny]); } }
      return false;
    };
    ((D.counter && D.counter.AT_DOOR) || []).forEach(function (k) {
      var dq = M.doors[k.door]; if (!dq || !inW(dq)) return;
      var fits = function (q) { var r = L.rows[q[1]]; return r && '.,='.indexOf(r.charAt(q[0])) >= 0 && !used[q[0] + ',' + q[1]] && inW(q) && (!L.reach || L.reach[q[1] * L.w + q[0]]) && reachedWith(dq, q); };
      var sq = [[1, 0], [-1, 0], [1, 1], [-1, 1], [0, 1], [0, -1], [1, -1], [-1, -1]].map(function (o) { return [dq[0] + o[0], dq[1] + o[1]]; }).filter(fits)[0];
      // (a door at the dead end of a lane, at 30 ft -- Mela's, Marin's since their doors went on their own houses, 10-22: every square beside it is the way in, so the keeper
      // stands beside their own house, the square nearest the door that leaves the way clear (its front on the street: Mela's, Marin's); else the nearest within four)
      var byDoor = function (a, b) { return Math.hypot(a[0] - dq[0], a[1] - dq[1]) - Math.hypot(b[0] - dq[0], b[1] - dq[1]); }, tgK = L.doorOwner && L.doorOwner[k.door];
      if (!sq && tgK) { var byHouse = {}; for (var io = 0; io < L.own.length; io++) if (L.own[io] === tgK) for (var oy3 = -1; oy3 <= 1; oy3++) for (var ox3 = -1; ox3 <= 1; ox3++) byHouse[(io % L.w + ox3) + ',' + (Math.floor(io / L.w) + oy3)] = 1; sq = Object.keys(byHouse).map(function (s) { return s.split(',').map(Number); }).sort(byDoor).filter(fits)[0]; }
      if (!sq) { var near4 = []; for (var oy4 = -4; oy4 <= 4; oy4++) for (var ox4 = -4; ox4 <= 4; ox4++) near4.push([dq[0] + ox4, dq[1] + oy4]); sq = near4.sort(byDoor).filter(fits)[0]; }
      if (!sq) return;
      used[sq[0] + ',' + sq[1]] = 1;
      var s = to(sq); people.push({ id: k.id, at: s, kind: 'crewman', face: [0, 1], look: null, hire: null });
      trig.push({ id: 'talk:' + k.id, on: 'use', rect: s.concat([1, 1]), town: 'talk', npc: k.id });
    });
    var mk = function (p) { return Array.isArray(p) && Array.isArray(p[0]) ? p.map(to) : to(p); }, marks = {};
    Object.keys(M).forEach(function (k) { var v = M[k]; marks[k] = v && !Array.isArray(v) ? Object.keys(v).reduce(function (a, k2) { a[k2] = to(v[k2]); return a; }, {}) : mk(v); });
    var id = function (x, y) { return [x, y]; }, V = D.TOWN_V6, ft = function (p) { return [T.X0 + (p[0] + ox + 0.5) * L.F, T.Y0 + (p[1] + oy + 0.5) * L.F]; };
    var wayName = {}; ways.forEach(function (p) { if (offEdge[p[0] + ',' + p[1]]) { wayName[p[0] + ',' + p[1]] = 'out of town to the ' + offEdge[p[0] + ',' + p[1]]; return; } var f = ft(p), best = 0, bd = 1e9; V.road.forEach(function (r, k) { for (var i = 0; i + 1 < r[0].length; i++) { var a = r[0][i], b = r[0][i + 1], vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy, t = L2 ? Math.max(0, Math.min(1, ((f[0] - a[0]) * vx + (f[1] - a[1]) * vy) / L2)) : 0, d = Math.hypot(f[0] - a[0] - t * vx, f[1] - a[1] - t * vy); if (d < bd) { bd = d; best = k; } } }); wayName[p[0] + ',' + p[1]] = T.ROADS[best] || 'the road'; });
    var districts = (V.label || []).filter(function (l) { return /district/.test(l[3]) && !/S I L V E R T O N/.test(l[2]); });
    var def = D.MAPS.silverton = {
      name: 'Silverton', sub: 'the town, true scale from the city map v6', key: 'silverton', town: true, wet: false, dark: false, ground: 'earth', step: 10,
      view: /[?&]view=iso\b/.test(q) ? null : 'top', // (north up the screen -- 10-20, Griz: "the iso is too much for the town"; &view=iso the grid's diamonds: js/topview.js)
      heights: L.heights.slice(oy, oy + h).map(function (r) { return r.slice(ox, ox + w); }),
      signDoor: (function () { var o = {}, ic = {}; ((npc8 && npc8.triggers) || []).forEach(function (t) { if (t.icon) ic[t.id] = 1; }); Object.keys(M.doors).forEach(function (id) { var q = M.doors[id]; if (!q || !ic[id]) return; var x = q[0] - ox, y = q[1] - 1 - oy; if (x >= 0 && y >= 0 && x < w && y < h) o[x + ',' + y] = id; }); return o; })(), // (whose door each sign hangs over: its store named on a mouseover, T.signName)
      signs: (function () { var o = {}, ic = {}; ((npc8 && npc8.triggers) || []).forEach(function (t) { if (t.icon) ic[t.id] = t.icon; }); Object.keys(M.doors).forEach(function (id) { var q = M.doors[id]; if (!q || !ic[id]) return; var x = q[0] - ox, y = q[1] - 1 - oy; if (x >= 0 && y >= 0 && x < w && y < h) o[x + ',' + y] = ic[id]; }); return o; })(), // (the 8-bit's sign over each door that had one, on the wall above the threshold: js/topview.js)
      edifice: (function () { var V6 = D.TOWN_V6, F6 = L.F, e = { x0: Math.floor((V6.EDW[0] - T.X0) / F6) - ox, y0: -oy, x1: Math.floor((V6.EDW[1] - T.X0) / F6) - ox, y1: Math.floor((V6.EDBOT - T.Y0) / F6) - oy }; if (e.x1 < 0 || e.x0 >= w || e.y1 < 0) return null; e.fx0 = T.X0 + (e.x0 + ox) * F6; e.ax = V6.AX; e.fount = V6.FOUNT.slice(); return e; })(), // (the Edifice's squares, drawn whole as the building: js/topview.js TV.edStrip -- 10-28)
      hexagon: (function () { var hx6 = D.TOWN_V6.hexagon; return { x: (hx6[0] - T.X0) / L.F - ox, y: (hx6[1] - T.Y0) / L.F - oy, r: hx6[2] / L.F }; })(), // (the Hex drawn whole: js/topview.js hexCanvas)
      faceDoors: (function () { var o = {}; Object.keys(L.faceDoors || {}).forEach(function (k) { var a = k.split(','), x = +a[0] - ox, y = +a[1] - oy; if (x >= 0 && y >= 0 && x < w && y < h) o[x + ',' + y] = 1; }); return o; })(), // (every building's south door, drawn: js/topview.js)
      ft: L.F, roofs: T.roofsAt(L.F), slope: L.slope.slice(oy, oy + h).map(function (r) { return r.slice(ox, ox + w); }), // (its buildings stand whole under their roofs, two sides and a ridge: js/iso.js roofCanvas)
      rows: rows, w: w, h: h, cut: cut ? [ox, oy, w, h] : null, page: w * h > 12000, // (page: a floor too big to paint as one picture, painted in pieces as the camera comes to them -- js/iso.js)
      entry: [to(at)], face: face, gate: gate, stairUp: [], doors: ways, marks: marks, people: people, foes: [],
      src8: { id: 'silverton16', rows: [], legend: {}, triggers: trig, warps: [], chests: [], zones: [], save: false }, from8: id, to8: id, sig: '', zone8: null,
      wayName: wayName, music: (npc8 && npc8.music) || 'town', // (the 8-bit's Silverton's own tune: content/maps/silverton.json)
      where: function (x, y) { var f = ft([x, y]), best = null, bd = 1e9; districts.forEach(function (l) { var d = Math.hypot(f[0] - l[0], f[1] - l[1]); if (d < bd) { bd = d; best = l[2]; } }); return best ? best.replace(/^THE /, 'the ').toLowerCase().replace(/^the gate plaza & arena quarter$/, 'the Gate Plaza and the arena quarter') : ''; } // (the HUD's line: the nearest of v6's district names)
    };
    return def;
  };
  // the buildings' heights and looks (rock to the rules, every one): the houses two floors under red tile (v6's roofs), the Shaft Rows' shacks one under old
  // timber, the Hexagon and the tower taller, Bloodsnout's yard wall a man and a half
  // (10-21, Griz: "The roof brown and the road brown are too close together": the brown roofs went -- the low houses' blue slate, the shacks' grey shingle; silver is the paving's)
  T.ROOFS = { b: { h: 20, roof: 'red' }, n: { h: 16, roof: 'blue' }, u: { h: 24, roof: 'red' }, h: { h: 12, roof: 'stone' }, j: { h: 10, roof: 'stone' }, B: { h: 35, roof: 'stone' }, q: { h: 10, roof: 'silver', wall: 'silver' } };
  T.HOUSES = 'bnu'; T.SHACKS = 'hj';
  T.roofsAt = function (F) { if (F === T.FT) return T.ROOFS; var o = {}; Object.keys(T.ROOFS).forEach(function (k) { o[k] = Object.assign({}, T.ROOFS[k], { h: T.ROOFS[k].h * T.FT / F }); }); return o; }; // (the heights shrink with the squares: the town as if the party stood F / 5 times taller)
  T.ROADS = ['the south gate track', 'THE road west: a mile to the fork', 'the road east: the farms and the coast', 'the old mine track', 'the feed track: the bridge and the Warrens mouths']; // (v6's roads in its own order)
  // a click on a door where it is drawn, in the wall of the building north of its threshold (10-21, Griz: "swap the stand on this tile to go in the shop to clicking on the
  // door"): the door's trigger and its threshold square, or null. (A click on the threshold itself finds the door by js/roam.js R.useAt, as a click on any USE square)
  T.doorClick = function (B, sx, sy) {
    var def = D.roam && D.roam.def, m = D.iso.map; if (!def || !def.town || !m || !m.top || !D.topview) return null;
    var TS = D.topview.TS, z = D.iso.inWorld ? 1 : D.iso.zoom, hw = D.iso.inWorld ? D.W / D.iso.zoom / 2 : D.W / 2, hh = D.iso.inWorld ? D.H / D.iso.zoom / 2 : D.H / 2;
    var wx = (sx + 0.5 - hw) / z + D.iso.cam.x, wy = (sy + 0.5 - hh) / z + D.iso.cam.y, gx = Math.floor(wx / TS), R0 = B.roam;
    var ds = (def.src8.triggers || []).filter(function (t) { return t.town === 'door' && t.on === 'use' && t.rect[0] === gx && D.roam.cond(t.cond, (R0 && R0.flags) || {}); });
    for (var i = 0; i < ds.length; i++) {
      var dx = ds[i].rect[0], dy = ds[i].rect[1], b = m.at(dx, dy - 1); if (!b || b.open) continue;
      var bz = b.gz || 0, top = (dy - 1) * TS - bz - (D.iso.roofPx(m, b.ch) || 0), bot = dy * TS - bz; // (the building's raised top and its wall down to its own ground: the door is in that wall)
      if (wy >= top && wy < bot) return { trig: ds[i], sq: [dx, dy] };
    }
    return null;
  };
  // where the party stands, for the floor's first card (10-22, the house seat, on the services seat's Found: "A CONTINUE (or the show) that stands the party at a door still
  // opens the floor on its 'in at the west gate' card"): on the gate it came in by, in at it; on a door's threshold, at that door; on the Hex's, at the Hex's doors; anywhere
  // else, the district v6 names there
  // the stores' names on their signs (10-28, Griz: "store names popup on sign mouseover"): the first game's shop's name where it has one (content/shops.json), the
  // realm's where it has none (silverton-people.md: 6 the Weigh-House, 21 the leech-house, 30 the mission chapel); the keeper under it where the name is not theirs
  T.SIGNNAME = { 'keeper:hessle': 'The Weigh-House', 'leech:davos': 'The Leech-House', 'chapel:aldwin': 'The Mission Chapel' };
  T.signName = function (id) {
    var arg = id.split(':')[1], sh = (((window.DS || {}).DATA || {}).shops || {})[arg], who = T.doorName(id), nm = T.SIGNNAME[id] || (sh && sh.name) || who;
    return { name: nm, who: nm.indexOf(who) >= 0 ? null : who };
  };
  T.doorName = function (id) { var d = T.DOORS.filter(function (z) { return z.id === id; })[0] || {}, arg = id.split(':')[1], N = (((window.DS || {}).DATA || {}).npcs || {})[arg]; return d.name || T.KEEPER[id] || (N && N.name) || arg; };
  T.whereAt = function (def, x, y) {
    var M = def.marks || {}, on = function (q) { return !!q && q[0] === x && q[1] === y; }, e = def.entry && def.entry[0];
    if (on(e)) return 'in at the ' + def.gate + ' gate';
    var dr = Object.keys(M.doors || {}).filter(function (k) { return on(M.doors[k]); })[0]; if (dr) return 'at ' + T.doorName(dr) + '\'s door';
    if ([].concat(M.hexFront || [], M.hexBack || []).some(on)) return 'at the Hex\'s doors';
    var gt = Object.keys(M.gates || {}).filter(function (k) { return on(M.gates[k]); })[0]; if (gt) return 'in at the ' + gt + ' gate';
    var wh = def.where ? def.where(x, y) : ''; return wh ? 'in ' + wh : 'in the town';
  };
  T.wayOut = function* (B, sq) { // a road running off the floor: the world map takes the party on there, later (the world map seat's: how a hex opens into a grid floor)
    var nm = (D.roam.def.wayName || {})[sq[0] + ',' + sq[1]] || 'the road';
    B.card(D.roam.wrap(['{y}' + nm.charAt(0).toUpperCase() + nm.slice(1) + '{/}.', '{g}The world map takes the party on from here, when it is built. The town keeps you for now.{/}']), 300);
    D.sfx('popup'); yield 10;
  };
  // the open square nearest a point in feet, not one of `used` (on the laid town)
  T.openNear = function (L, x, y, used) {
    var F = L.F || T.FT, R = Math.max(3, Math.round(60 / F)), g0 = Math.floor((x - T.X0) / F), g1 = Math.floor((y - T.Y0) / F), best = null, bd = 1e9;
    for (var dy = -R; dy <= R; dy++) for (var dx = -R; dx <= R; dx++) {
      var gx = g0 + dx, gy = g1 + dy, row = L.rows[gy]; if (!row || gx < 0 || gx >= row.length || '.,='.indexOf(row.charAt(gx)) < 0 || (used && used[gx + ',' + gy]) || (L.reach && !L.reach[gy * L.w + gx])) continue; // (never on a door's threshold, nor out of the streets' reach)
      var d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = [gx, gy]; }
    }
    return best;
  };
  // the 8-bit's conditions on the floor's flags: flag:x, !flag:x, & and | (js/roam.js R.cond's reading); has:, hired:, lead: read off the party (T.holds)
  T.cond = function (c, flags, holds) {
    if (!c) return true;
    return String(c).split('|').some(function (any) { return any.split('&').every(function (t) { t = t.trim(); var neg = t.charAt(0) === '!'; if (neg) t = t.slice(1); var m = /^(flag|has|hired|lead):(.+)$/.exec(t), v = !m ? true : m[1] === 'flag' ? !!flags[m[2]] : !!(holds && holds(m[1], m[2])); return neg ? !v : v; }); });
  };

  // ---------------------------------------------------------------- on the floor: the people stood, a door stepped on, a word with someone
  T.people = function (B) {
    var def = D.roam && D.roam.def; if (!def || !def.town) return;
    if (!def.room && D.ui && D.ui.zooms) { var Lz = D.ui.zooms(); D.iso.zoom = Lz[Math.min(T.ZOOMSTEP, Lz.length - 1)]; } // (the town's one zoom, a step out: 10-21, Griz, "try default zoom one step further out" -- the zoom is held there, js/ui.js)
    var kinds = [], party = ((B.roam && B.roam.members) || []).map(function (u) { return String(u.name || '').toLowerCase(); });
    def.people.forEach(function (p, i) {
      // (a hero who walks with the party is not also standing in town: the 8-bit's hire NPCs -- Vivian on vice row, Aurdin at the chapel -- as the 8-bit hides them once hired)
      if (p.hire && party.indexOf(p.hire) >= 0) { def.src8.triggers = def.src8.triggers.filter(function (t) { return t.npc !== p.id; }); return; }
      var n8 = ((window.DS.DATA || {}).npcs || {})[p.id] || {}, kind = D.FOES[p.kind] ? p.kind : 'bandit';
      var u = B.makeFoe({ id: 'town' + i, kind: kind, at: p.at.slice(), side: 'party', ally: true });
      u.name = n8.name || p.id; u.look = true; u.npc = p.id; u.attacks = {}; u.multi = 1; u.hp = u.maxhp = 4; u.lvl = 1;
      u.facing = D.spr.facingFor(p.face[0], p.face[1]); u.anim = 'idle'; u.animT = 0;
      if (D.counter) D.counter.dress(u, p.id); // (a keeper with a figure of their own wears it: js/counter.js C.FIG)
      B.units.push(u); if (u.sheet && kinds.indexOf(u.sheet) < 0) kinds.push(u.sheet);
    });
    if (D.spr.prefetch) D.spr.prefetch(kinds);
    D.grid.setup(D.grid.map, B.units);
  };
  T.say = function (B, id) { // a person's word: the 8-bit's first talk whose condition holds (content/npcs.json), else a rumour of theirs, else their name
    var N = ((window.DS.DATA || {}).npcs || {})[id] || {}, R0 = B.roam, f = (R0 && R0.flags) || {};
    var holds = function (k, v) {
      if (k === 'has') return (B.inv || []).some(function (s) { return s.id === v && s.n > 0; });
      var who = (R0 ? R0.members : []).map(function (u) { return String(u.name || '').toLowerCase(); });
      return k === 'hired' ? who.indexOf(v) >= 0 : k === 'lead' ? who[0] === v : false;
    };
    var t = (N.talk || []).filter(function (e) { return T.cond(e['if'], f, holds); })[0];
    if (t && t.say) return t.say.slice();
    var rs = ((window.DS.DATA || {}).rumors) || [], rid = (N.rumors || [])[0], r = rid && (Array.isArray(rs) ? rs.filter(function (z) { return z.id === rid; })[0] : rs[rid]);
    if (r) return [r.t || String(r)];
    return [T.LINE[id] || '{g}(Their scene is the 8-bit\'s; on the grid it is to come.){/}'];
  };
  T.LINE = { // the floor's own words where the 8-bit's would be wrong here (invented.json silverton16-gate-hand)
    guard1: 'West gate. The road runs a mile to the fork: the Tower north of it, the Pit south down the long road. East gate\'s the farms and the coast. Nobody bothers the dwarves.'
  };
  // ---------------------------------------------------------------- the rooms behind the doors (10-20, Griz, to the lanes desk: "We're going to need slightly varied 16 bit
  // shop interiors for the vendors"): one shop's shape -- walls of built stone, the door in the front wall (the grid's +y, the side the eye sees through: the near walls cut
  // low), shelves along the back wall with the trade's goods on them, a counter across with the keeper behind it, the floor between -- varied by the trade (the town's register,
  // TarlynsPit/silverton-personae.md, by v6's slot): its size (s 10 x 8, m 12 x 10, l 16 x 12 squares), its floor (o boards, = flags, . beaten earth), the goods' colour, the
  // counter's run (across; short; a grille; a long bar; none), shelves down the side too, and what stands about. Built from what the grid has: crates, the cots, a campfire for
  // a forge, water, a counter and shelves drawn in code (js/iso.js BLOCK K and S). Griz's own (the magic-item shop's proprietor, 35; Mama's Pharmakaiea, 42) get the shape and
  // nothing of their particulars. Walked in through the door on the street and out by the same door
  T.TRADE = {
    'keeper:casper': { size: 's', floor: '=', goods: 'gold', counter: 'grille', dress: ['bench'] },          // the moneychanger and his assay bench
    'keeper:androit': { size: 'm', floor: 'o', goods: 'bone', side: true, dress: ['desks'] },                 // the notary's scriptorium: ledgers and copy-desks
    'keeper:hessle': { size: 'l', floor: '=', goods: 'silver', dress: ['scale'] },                           // the Weigh-House: its weights, the beam's floor
    'keeper:falstaff': { size: 'm', floor: '=', goods: 'violet', dress: ['desks'] },                         // the wizard-nation factor's clerk
    'keeper:aldric': { size: 'm', floor: 'o', goods: 'leather', dress: ['sacks'] },                          // the wool-and-grain factor: sacks and bales
    'shop:kessler': { size: 'm', floor: 'o', goods: 'stone', counter: 'grille', side: true, dress: ['crates', 'clutter'] }, // the pawnbroker: pledges everywhere
    'shop:calla': { size: 's', floor: 'o', goods: 'glow', side: true },                                     // the apothecary: jars in ranks
    'keeper:barber': { size: 's', floor: 'o', goods: 'red', counter: 'short', dress: ['chair'] },           // the barber-surgeon's chair
    'inn:cassia': { size: 'l', floor: 'o', goods: 'red', counter: 'bar', dress: ['tables'] },               // the coaching inn and wine arcade
    'keeper:mela': { size: 'l', floor: '=', goods: 'blue', counter: 'short', door: 3, dress: ['pool'] },     // the stew: the bath
    'keeper:marin': { size: 'm', floor: 'o', goods: 'red', side: true, dress: ['crates'] },                  // cloth and the dyer's bolts
    'keeper:brennan': { size: 'l', floor: '.', goods: 'silver', counter: 'none', dress: ['forge', 'crates'] }, // the smithy's forge
    'shop:marko': { size: 'm', floor: 'o', goods: 'leather', dress: ['crates', 'sacks'] },                  // the provisioner: the road's stores
    'shop:kasten': { size: 's', floor: 'o', goods: 'gold' },                                                // the chandler: tallow and wicks
    'keeper:venhale': { size: 'l', floor: '.', goods: 'leather', counter: 'short', dress: ['stalls'] },     // the fighters' stables
    'shop:vilar': { size: 'm', floor: '.', goods: 'silver', side: true, dress: ['crates'] },               // the show-armorer's racks
    'leech:davos': { size: 'm', floor: 'o', goods: 'red', counter: 'short', dress: ['cots'] },              // the leech-house's beds
    'keeper:kess': { size: 'm', floor: '.', goods: 'stone', counter: 'none', dress: ['cots'] },            // the flop-cellar's doss beds
    'chapel:aldwin': { size: 'l', floor: '=', goods: 'gold', counter: 'short', dress: ['pews'] },          // the mission chapel: bread at six
    'keeper:mical': { size: 'l', floor: '.', goods: 'leather', counter: 'short', dress: ['crates', 'sacks'] }, // the riverside warehouse
    'shop:lisbet': { size: 's', floor: 'o', goods: 'violet' },                                              // charms and warding chalk
    'keeper:merrick': { size: 'm', floor: '=', goods: 'gold', counter: 'grille' },                         // the message-lantern house and its window
    'warp:winters': { size: 'm', floor: '=', goods: 'glow', own: true },                                   // the magic-item shop: Griz's own proprietor
    'warp:percy': { size: 's', floor: 'o', goods: 'glow', side: true },                                    // Percy's Particulars: jars in ranks, the counter (invented.json percy-interior)
    'keeper:tam': { size: 'm', floor: 'o', goods: 'violet', counter: 'none', dress: ['cots'] },            // the dream-smoke den's couches
    'shop:lucia': { size: 's', floor: 'o', goods: 'moss', own: true },                                     // Mama's Pharmakaiea: Griz's own
    'keeper:sylvia': { size: 's', floor: 'o', goods: 'violet', counter: 'short', own: true }                // Sylvia Swann's booth: Griz's own (the vice-row fortune-teller)
  };
  T.KEEPER = { 'shop:kessler': 'Kessler', 'shop:calla': 'Calla Voss', 'shop:marko': 'Marko Thorne', 'shop:kasten': 'Kasten Wheal', 'shop:vilar': 'Vilar', 'shop:lisbet': 'Lisbet Crane', 'inn:cassia': 'Cassia', 'leech:davos': 'Davos Kren', 'warp:percy': 'Percy', 'warp:winters': 'Ambrose Winters', 'shop:lucia': 'Mama', 'keeper:aldric': 'Aldric Vest', 'keeper:sylvia': 'Sylvia Swann' }; // (the shops' keepers by the register; the keepers' own names come from the 8-bit's npcs)
  T.room = function (id, door) {
    var t = T.TRADE[id] || { size: 'm', floor: 'o', goods: 'leather' }, S = T.ROOMSIZE[t.size] || [12, 10], w = S[0], h = S[1], g = [];
    for (var y = 0; y < h; y++) { g.push([]); for (var x = 0; x < w; x++) g[y].push(x === 0 || y === 0 || x === w - 1 || y === h - 1 ? 'b' : t.floor); }
    var set = function (x, y, c) { if (x > 0 && y > 0 && x < w - 1 && y < h - 1) g[y][x] = c; }, dx = t.door != null ? t.door : Math.floor(w / 2);
    g[h - 1][dx] = 'd';
    for (x = 1; x < w - 1; x++) set(x, 1, 'S');                                              // the shelves along the back wall
    if (t.side) for (y = 2; y < h - 3; y++) set(1, y, 'S');                                   // and down the side
    var cr = t.counter || 'across', c0 = t.side ? 3 : 2, c1 = cr === 'short' ? Math.min(w - 3, c0 + 3) : w - 3, keep = [Math.floor((c0 + c1) / 2), 2];
    if (cr !== 'none') for (x = c0; x <= c1; x++) set(x, 3, 'K');                             // the counter across, the keeper's way round its far end
    if (cr === 'grille') set(c1, 3, 'f');                                                     // (a grille: the rail at its end -- the moneychanger's, the pawnbroker's, the lantern window)
    if (cr === 'bar') for (y = 4; y < h - 4; y++) set(c1, y, 'K');                            // (a bar: down the side too)
    if (cr === 'none') keep = [dx + 2, 4];
    var free = function (x, y) { return x > 0 && y > 4 && x < w - 1 && y < h - 2 && g[y][x] === t.floor && Math.abs(x - dx) > 1; }, put = function (x, y, c) { if (free(x, y)) g[y][x] = c; };
    var extra = {};
    (t.dress || []).forEach(function (d) {
      if (d === 'crates') [[2, h - 3], [3, h - 3], [2, h - 4], [w - 3, h - 3], [w - 4, h - 3]].forEach(function (q) { put(q[0], q[1], 'k'); });
      if (d === 'sacks') for (y = 5; y < h - 2; y++) put(t.side ? 2 : 1, y, 'k');
      if (d === 'clutter') for (y = 5; y < h - 2; y++) for (x = 2; x < w - 2; x++) if (((x * 7 + y * 13) % 5) === 0) put(x, y, 'k');
      if (d === 'desks' || d === 'bench') [[2, 6], [3, 6], [w - 4, 6], [w - 3, 6]].slice(0, d === 'bench' ? 2 : 4).forEach(function (q) { put(q[0], q[1], 'K'); });
      if (d === 'tables') [[3, 6], [4, 6], [3, 7], [4, 7], [w - 5, 6], [w - 4, 6], [w - 5, 7], [w - 4, 7]].forEach(function (q) { put(q[0], q[1], 'K'); });
      if (d === 'scale') for (y = 6; y <= 7; y++) for (x = 3; x <= 6; x++) put(x, y, 'K');
      if (d === 'chair') put(w - 3, 6, 'K');
      if (d === 'pool') for (y = 5; y <= 8; y++) for (x = dx + 3; x <= w - 3; x++) put(x, y, '~');
      if (d === 'cots') { for (y = 5; y < h - 2; y += 2) [2, 3, w - 4, w - 3].forEach(function (x2) { put(x2, y, 'y'); }); extra.cots = { sheet: 'gsbed_p1' }; }
      if (d === 'forge') { put(3, 5, '.'); extra.fire = [3, 6]; [[2, 5], [4, 5]].forEach(function (q) { put(q[0], q[1], 'k'); }); }
      if (d === 'stalls') for (y = 5; y < h - 2; y++) if (y % 3 !== 1) { put(2, y, 'f'); put(w - 3, y, 'f'); }
      if (d === 'pews') for (y = 6; y < h - 2; y += 2) for (x = 2; x < w - 2; x++) put(x, y, 'K');
    });
    var arg = id.split(':')[1], N = ((window.DS && window.DS.DATA) || {}).npcs || {}, Sh = ((window.DS && window.DS.DATA) || {}).shops || {};
    var nm = (door && door.name) || T.KEEPER[id] || (N[arg] && N[arg].name) || arg, shopNm = (Sh[arg] && Sh[arg].name) || null;
    var trig = [], k0 = keep;
    for (x = 1; x < w - 1; x++) if (g[3][x] === 'K' || g[3][x] === 'f') trig.push({ id: 'talk:' + arg, on: 'use', rect: [x, 3, 1, 1], town: 'talk', npc: arg }); // (E at the counter: a word with the keeper behind it)
    trig.push({ id: 'talk:' + arg, on: 'use', rect: [k0[0], k0[1], 1, 1], town: 'talk', npc: arg });
    var id2 = function (x2, y2) { return [x2, y2]; };
    return Object.assign({
      name: shopNm || nm, sub: 'a room on the Silverton floor', key: 'room', room: id, town: true, wet: false, dark: false, step: 10, goods: t.goods,
      view: 'top', // (north up, as the street outside: 10-20, Griz, asked whether the rooms stay on the diamonds, "1 north up" -- js/topview.js)
      rows: g.map(function (r) { return r.join(''); }), entry: [[dx, h - 2]], face: [0, -1], doors: [[dx, h - 1]], stairUp: [], foes: [], marks: {}, people: [],
      keeper: { id: arg, name: nm, at: keep, own: !!t.own, art: door && door.art || null },
      across: g[3][keep[0]] === 'K' && '.,=o'.indexOf(g[4][keep[0]]) >= 0 ? [keep[0], 4] : null, // (the customer's spot, across the counter from the keeper: where a word is had -- T.fire)
      src8: { id: 'room:' + id, rows: [], legend: {}, triggers: trig, warps: [], chests: [], zones: [], save: false }, from8: id2, to8: id2, sig: '', zone8: null
    }, extra);
  };
  // in at a door: the floor set aside (its map kept as it stands, its people with it) and the room laid; the token just inside the door, facing in, the keeper behind the counter
  T.goIn = function* (B, trig) {
    var R = D.roam, R0 = B.roam, t = R0.token, def = T.room(trig.id, trig.door), N = ((window.DS.DATA || {}).npcs || {})[def.keeper.id];
    B.townAway = { map: B.map, def: R.def, at: [t.x, t.y], fw: R0.fw.slice(), folk: B.units.filter(function (u) { return u.npc; }) };
    B.units = B.units.filter(function (u) { return !u.npc; });
    R.def = def; D.MAPS.room = def; B.map = D.iso.load(def);
    t.x = def.entry[0][0]; t.y = def.entry[0][1]; t.tween = null; R0.fw = def.face.slice(); t.facing = D.spr.facingFor(R0.fw[0], R0.fw[1]); t.anim = 'idle'; t.animT = B.t; R0.path = null;
    var kp = def.keeper, u = B.makeFoe({ id: 'keeper', kind: T.KIND[(N && N.look) || ''] || 'crewman', at: kp.at.slice(), side: 'party', ally: true });
    u.name = kp.name; u.look = true; u.npc = kp.id; u.attacks = {}; u.multi = 1; u.hp = u.maxhp = 4; u.lvl = 1; u.facing = D.spr.facingFor(0, 1); u.anim = 'idle'; u.animT = 0;
    if (D.counter) D.counter.dress(u, kp.id); // (the keeper behind the counter in their own figure, facing south: js/counter.js C.FIG)
    B.units.push(u); if (D.spr.prefetch && u.sheet) D.spr.prefetch([u.sheet]);
    // who stands behind the counter beside them (js/counter.js C.BESIDE -- Ned Halloway beside Percy, 10-21 evening): on the floor at the keeper's side, facing south, no word
    // of their own at the counter (the counter's E is the keeper's)
    ((D.counter && D.counter.BESIDE[kp.id]) || []).forEach(function (bid, i) {
      var sq = [[1, 0], [-1, 0], [2, 0], [-2, 0]].map(function (o) { return [kp.at[0] + o[0], kp.at[1] + o[1]]; }).filter(function (q) { var r = def.rows[q[1]]; return r && '.,=o'.indexOf(r.charAt(q[0])) >= 0 && !B.units.some(function (x) { return x.x === q[0] && x.y === q[1]; }); })[0];
      if (!sq) return;
      var N2 = ((window.DS.DATA || {}).npcs || {})[bid], b = B.makeFoe({ id: 'keeper' + (i + 2), kind: T.KIND[(N2 && N2.look) || ''] || 'crewman', at: sq, side: 'party', ally: true });
      b.name = (N2 && N2.name) || bid; b.look = true; b.npc = bid; b.attacks = {}; b.multi = 1; b.hp = b.maxhp = 4; b.lvl = 1; b.facing = D.spr.facingFor(0, 1); b.anim = 'idle'; b.animT = 0;
      D.counter.dress(b, bid); B.units.push(b); if (D.spr.prefetch && b.sheet) D.spr.prefetch([b.sheet]);
      // one with a scene of their own (Ned, 10-21 night: js/counter.js C.ned) takes the word at the counter in front of them and on their own square, had from the
      // spot across the counter as the keeper's is (T.fire); and Ned's rat sits on that counter (his "on counter on floor screen if possible": the grid's rat
      // familiar, js/familiar.js fam_rat, at its own half scale, lifted onto the counter's top)
      var V = D.counter.VENDORS[bid] || {}; def.beside = def.beside || {}; def.beside[bid] = { at: sq.slice(), across: null };
      if (V.script) {
        var trs = def.src8.triggers, ky = sq[1] + 1;
        trs.forEach(function (tr) { if (tr.town === 'talk' && tr.rect[0] === sq[0] && tr.rect[1] === ky) { tr.id = 'talk:' + bid; tr.npc = bid; } });
        trs.push({ id: 'talk:' + bid, on: 'use', rect: [sq[0], sq[1], 1, 1], town: 'talk', npc: bid });
        var ka = def.rows[ky] && def.rows[ky].charAt(sq[0]), kb = def.rows[ky + 1] && def.rows[ky + 1].charAt(sq[0]);
        if (ka === 'K' && kb && '.,=o'.indexOf(kb) >= 0) def.beside[bid].across = [sq[0], ky + 1];
      }
      var pet = D.counter.PETS && D.counter.PETS[bid];
      if (pet && D.FOES['fam_' + pet] && def.rows[sq[1] + 1] && def.rows[sq[1] + 1].charAt(sq[0]) === 'K') {
        var F = window.DS.R.FAMILIARS[pet], rr = B.makeFoe({ id: bid + 'pet', kind: 'fam_' + pet, at: [sq[0], sq[1] + 1], side: 'party', ally: true });
        rr.name = (b.name || bid) + '\'s ' + F.name; rr.look = true; rr.npc = bid + 'pet'; rr.attacks = {}; rr.multi = 0; rr.hp = rr.maxhp = 1; rr.lvl = 0; rr.cls = null; rr.drawScale = F.scale || 1;
        rr.facing = D.spr.facingFor(0, 1); rr.anim = 'idle'; rr.animT = 0; rr.onCounter = true; rr.lift = (D.topview && D.topview.BLOCK && D.topview.BLOCK.K) || 16; rr.holdFacing = true; B.units.push(rr); if (D.spr.prefetch) D.spr.prefetch([F.sheet]);
      }
    });
    R.famPlace(B, true); B.cache = null; B.exits = []; D.grid.setup(B.map, B.units); B.focus(t);
    B.card(D.roam.wrap(['{y}' + def.name + '{/}' + (def.name !== kp.name ? ' -- ' + kp.name + ' at the counter' : '') + '.', '{g}E at the counter: a word. The door behind you: back to the street.' + (kp.own && !(D.counter && D.counter.SHOPS[kp.id]) ?' (Griz\'s own: the room waits on his word.)' : '') + '{/}']), 360);
    D.sfx('popup'); yield 10;
  };
  // out by the door: the room let go, the floor as it was, the party on the door's square facing the street
  T.goOut = function* (B) {
    var R = D.roam, R0 = B.roam, t = R0.token, o = B.townAway; if (!o) return;
    B.units = B.units.filter(function (u) { return !u.npc; }).concat(o.folk);
    R.def = o.def; D.MAPS[o.def.key] = o.def; B.map = o.map; D.iso.map = o.map; o.map.occKey = null;
    t.x = o.at[0]; t.y = o.at[1]; t.tween = null; R0.fw = [-o.fw[0], -o.fw[1]]; t.facing = D.spr.facingFor(R0.fw[0], R0.fw[1]); t.anim = 'idle'; t.animT = B.t; R0.path = null;
    R.famPlace(B, true); B.cache = null; B.exits = []; D.grid.setup(o.map, B.units); B.focus(t); B.townAway = null;
    D.sfx('popup'); yield 6;
  };
  T.fire = function* (B, trig) {
    var R = D.roam, R0 = B.roam;
    var acK = trig.town === 'talk' && R.def.room && R.def.keeper ? (trig.npc === R.def.keeper.id ? R.def.across : ((R.def.beside || {})[trig.npc] || {}).across) : null; // (the keeper's, or one beside them with a word of their own: Ned)
    if (acK) { // (10-21, Griz: "the spot across from them at the counter should be the
      // interact, with 'other side of the counter' response if they interact in the current method"): from behind the counter the keeper sends you round; from the customer's
      // side anywhere, the party walks to the spot across from the keeper and the word is had there, facing the counter
      var ac = acK, tk = R0.token;
      if (tk.y < ac[1]) { var ku = B.units.filter(function (x) { return x.npc === trig.npc; })[0]; if (ku && !ku.holdFacing) ku.facing = D.spr.facingFor(tk.x - ku.x, tk.y - ku.y); B.card(R.wrap(['{y}' + (ku ? ku.name : trig.npc) + '{/}', '"Other side of the counter."']), 240); D.sfx('popup'); yield 20; return; }
      if ((tk.x !== ac[0] || tk.y !== ac[1]) && !(yield* R.walkTo(B, ac))) return;
      R0.fw = [0, -1]; tk.facing = D.spr.facingFor(0, -1);
    }
    if (trig.town === 'talk') {
      var u = B.units.filter(function (x) { return x.npc === trig.npc; })[0], t = R0.token;
      if (u && !u.holdFacing) u.facing = D.spr.facingFor(t.x - u.x, t.y - u.y); // (a keeper drawn facing south only stays facing south: js/counter.js C.dress)
      if (D.counter && D.counter.takes(trig.npc)) { yield* D.counter.talk(B, trig.npc, trig.door); return; } // (a keeper with a portrait, and Winters: the counter's screen -- js/counter.js, 10-21)
      var kp = R.def.room && R.def.keeper && R.def.keeper.id === trig.npc ? R.def.keeper : null, said = trig.npc === 'guard1' ? [T.LINE.guard1] : D.counter ? D.counter.words(B, trig.npc) : T.say(B, trig.npc); // (the word with its doing: an errand's seal or signature -- js/counter.js C.words)
      if (kp) said = (/^\{g\}\(Their scene/.test(said[0]) ? [] : said).concat(['{g}' + (kp.own ? 'Griz\'s own: the counter waits on his word.' : 'The counter -- buying and selling -- is to come.') + '{/}']); // (a room's keeper: the 8-bit's word where it has one, and the counter's screen to come)
      B.card(R.wrap(['{y}' + (u ? u.name : trig.npc) + '{/}'].concat(said)), 420);
      D.sfx('popup'); yield 20; return;
    }
    if (trig.town === 'door' && T.hasRoom(trig.id)) { yield* T.goIn(B, trig); return; } // (in: the room behind it -- T.room)
    if (trig.town === 'door') { // (a door with no room behind it: its keeper's word at the door, as the 8-bit's keeper card)
      var arg2 = trig.id.split(':')[1], N2 = ((window.DS.DATA || {}).npcs || {})[arg2] || {}, d2 = trig.door || {};
      if (D.counter && D.counter.takes(arg2)) { yield* D.counter.talk(B, arg2, d2); return; } // (a keeper at the door with a portrait: Venn the barber)
      B.card(R.wrap(['{y}' + (d2.name || N2.name || arg2) + '{/}' + (d2.what ? ' -- ' + d2.what : '')].concat(D.counter ? D.counter.words(B, arg2) : T.say(B, arg2))), 420); D.sfx('popup'); yield 10; return;
    }
  };
})();
