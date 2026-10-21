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
  T.SLOPE = [560, 620]; T.DROP = 30;

  T.lay = function (V, F0) {
    V = V || D.TOWN_V6;
    var F = F0 || T.FT, w = Math.round((T.X1 - T.X0) / F), h = Math.round((T.Y1 - T.Y0) / F), g = new Array(w * h), sl = new Uint8Array(w * h); // (sl: a roof's side -- 1 the half toward the light, 2 the other, 3 the ridge: js/iso.js roofCanvas)
    var cx = function (gx) { return T.X0 + (gx + 0.5) * F; }, cy = function (gy) { return T.Y0 + (gy + 0.5) * F; };
    var gxOf = function (x) { return Math.floor((x - T.X0) / F); }, gyOf = function (y) { return Math.floor((y - T.Y0) / F); };
    var set = function (gx, gy, ch, only) { if (gx < 0 || gy < 0 || gx >= w || gy >= h) return; var i = gy * w + gx; if (only && only.indexOf(g[i]) < 0) return; g[i] = ch; };
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
    V.shack.forEach(function (s, k) { rect(s[0], s[1], -s[2] / 2, -s[3] / 2, s[2], s[3], s[4], 'hj'.charAt((k * 5 + (k >> 1)) % 2), null, true); });
    V.bldg.forEach(function (b, k) { rect(b[0] + b[2] / 2, b[1] + b[3] / 2, -b[2] / 2, -b[3] / 2, b[2], b[3], b[4], 'bnu'.charAt((k * 7 + (k >> 2)) % 3), null, true); });
    var hx = V.hexagon, hexP = []; for (var k = 0; k < 6; k++) { var an = Math.PI / 180 * (60 * k - 90); hexP.push([hx[0] + hx[2] * Math.cos(an), hx[1] + hx[2] * Math.sin(an)]); }
    poly(hexP, 'B');
    fill(V.EDW[0], T.Y0, V.EDW[1], V.EDBOT, function () { return true; }, '#'); // (the Edifice: the dwarves' facade in the mountain's face, drawn as the cliff it stands in)
    // the fountains at the Edifice's foot: a pool in a dressed rim (v6: the basin 30 ft across the rim, 22 the water)
    V.FOUNT.forEach(function (x) { ellipse(x, V.EDBOT + 26, Math.max(30, F * 0.75), Math.max(30, F * 0.75), '='); ellipse(x, V.EDBOT + 26, Math.max(22, F * 0.55), Math.max(22, F * 0.55), '~'); });
    // the headframes: the spoil heap, the mouth on it
    V.headframe.forEach(function (f) { var s = f[2]; ellipse(f[0] + 26 * s, f[1] + 16 * s, 44 * s, 24 * s, 'r', OPEN); ellipse(f[0], f[1] + 16 * s, Math.max(7, 15 * s, F * 0.55), Math.max(5, 8 * s, F * 0.55), 'w', OPEN); });
    // the stalls in the open ground (v6 turns each about its corner)
    V.stall.forEach(function (s) { rect(s[0], s[1], 0, 0, s[2], s[3], s[4], 'k', '.,='); });
    // the tower: its foot, a round of built stone (v6 draws it standing, 22 ft across)
    ellipse(V.tower[0], V.tower[1] - 8, Math.max(14, F * 0.55), Math.max(14, F * 0.55), 'B');
    // the stockade, a rail, open at the gates between two posts
    var gates = V.gate.map(function (q) { return { x: q[0], y: q[1] }; }), nearGate = function (x, y) { return gates.some(function (q) { return Math.hypot(x - q.x, y - q.y) < 30; }); };
    for (var j = 0; j + 1 < V.stockade.length; j++) (function (a, b) {
      var r = Math.max(8, F), hw = Math.max(3.6, F * 0.55); fill(Math.min(a[0], b[0]) - r, Math.min(a[1], b[1]) - r, Math.max(a[0], b[0]) + r, Math.max(a[1], b[1]) + r, function (x, y) { return segD(x, y, a, b) <= hw && !nearGate(x, y); }, 'f', OPEN);
    })(V.stockade[j], V.stockade[j + 1]);
    gates.forEach(function (q) { // (the posts: the stockade's squares just past the opening on either side)
      for (var j2 = 0; j2 + 1 < V.stockade.length; j2++) { var a = V.stockade[j2], b = V.stockade[j2 + 1]; if (segD(q.x, q.y, a, b) > 20) continue; var L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L; [-1, 1].forEach(function (sg) { set(gxOf(q.x + sg * 32 * ux), gyOf(q.y + sg * 32 * uy), 'b'); set(gxOf(q.x + sg * 37 * ux), gyOf(q.y + sg * 37 * uy), 'b'); }); }
    });
    // Bloodsnout's compound: a stone wall round a yard, the barracks along the back (east), the gate on the plaza side shut -- drawn, never entered
    var C = T.COMPOUND, cg0 = gxOf(C.x), cg1 = gxOf(C.x + C.w), ch0 = gyOf(C.y), ch1 = gyOf(C.y + C.h), bk = Math.max(1, Math.round(25 / F));
    for (var yy = ch0; yy <= ch1; yy++) for (var xx = cg0; xx <= cg1; xx++) set(xx, yy, xx > cg1 - bk ? 'b' : (yy === ch0 || yy === ch1 || xx === cg0) ? 'q' : '.'); // (q: its wall, 10 ft; b: the barracks, 25 ft deep along the back)
    if (F <= 10) for (yy = gyOf(C.y + 20); yy <= gyOf(C.y + 40); yy++) for (xx = gxOf(C.x + 20); xx <= gxOf(C.x + 50); xx++) set(xx, yy, 'b'); // (the master's house in the yard's north-west corner: too small to show at a town's scale)

    // ---------------------------------------------------------------- the marks
    var marks = { gates: {}, pins: {}, doors: {} };
    var nearestOpen = function (x, y, maxFt, skip) { // the open square nearest a point in feet, within maxFt (a pin sits on its building; its door is the street square nearest it), not one in `skip`
      var g0 = gxOf(x), g1 = gyOf(y), best = null, bd = 1e9, maxR = Math.max(2, Math.ceil((maxFt || 150) / F));
      for (var dy = -maxR; dy <= maxR; dy++) for (var dx = -maxR; dx <= maxR; dx++) { var t = at(g0 + dx, g1 + dy); if (t == null || OPEN.indexOf(t) < 0 || t === '~' || t === 'r' || (skip && skip[(g0 + dx) + ',' + (g1 + dy)])) continue; var d = Math.hypot(cx(g0 + dx) - x, cy(g1 + dy) - y); if (d < bd) { bd = d; best = [g0 + dx, g1 + dy]; } }
      return best;
    };
    var GATE = { 0: 'south', 1: 'west', 2: 'east' }; // (v6's gateposts in its own order: the south gate track, THE road's west gate, the east road to the farms)
    V.gate.forEach(function (q, k) { marks.gates[GATE[k] || 'g' + k] = nearestOpen(q[0] + (k === 1 ? 14 : 0), q[1] + (k === 1 ? -14 : 0)); }); // (the west gate's mark a step inside, where the road from the fork arrives)
    V.PINS.forEach(function (p) { marks.pins[p[2]] = nearestOpen(p[0], p[1]); });
    // the ground the streets reach from the west gate (a door or a person in a yard closed in by houses would be out of reach: at a town's scale a block's back yards close up)
    var reach = new Uint8Array(w * h), WALK = '.,=dr~', qq = [marks.gates.west]; reach[marks.gates.west[1] * w + marks.gates.west[0]] = 1;
    for (var qi = 0; qi < qq.length; qi++) { var c1 = qq[qi]; for (var ddy = -1; ddy <= 1; ddy++) for (var ddx = -1; ddx <= 1; ddx++) { var nx = c1[0] + ddx, ny = c1[1] + ddy; if ((!ddx && !ddy) || nx < 0 || ny < 0 || nx >= w || ny >= h || reach[ny * w + nx] || WALK.indexOf(g[ny * w + nx]) < 0) continue; if (ddx && ddy && (WALK.indexOf(at(c1[0] + ddx, c1[1])) < 0 || WALK.indexOf(at(c1[0], c1[1] + ddy)) < 0)) continue; reach[ny * w + nx] = 1; qq.push([nx, ny]); } }
    var out = {}; for (var ri = 0; ri < g.length; ri++) if (!reach[ri] && OPEN.indexOf(g[ri]) >= 0) out[(ri % w) + ',' + Math.floor(ri / w)] = 1;
    marks.compound = nearestOpen(C.x - 6, C.y + C.h / 2, 30, out); // (outside its shut gate)
    // the Hexagon's doors (v6: black at 62 and 118 degrees -- the front, south, to the Arena Plaza -- and at -62 and -118, the back to the falls): the square outside each
    var hexDoor = function (deg) { var a = Math.PI / 180 * deg; var o2 = hx[2] + Math.max(6, F * 0.6); return nearestOpen(hx[0] + Math.cos(a) * o2, hx[1] + Math.sin(a) * o2, 20); };
    marks.hexFront = [hexDoor(62), hexDoor(118)]; marks.hexBack = [hexDoor(-62), hexDoor(-118)];
    // the vault door: its threshold across the Gate Plaza's foot of the Edifice, v6's door 128 ft wide
    var vy = gyOf(V.EDBOT) + 1; for (var vx = gxOf(V.AX - 64); vx <= gxOf(V.AX + 64); vx++) set(vx, vy, 'd');
    marks.vault = [gxOf(V.AX), vy];
    // the doors of the shops and the keepers (the 8-bit's trigger at each, content/maps/silverton.json, by its slot's pin): a threshold 'd' on the street, marked, not built
    var taken = Object.assign({}, out), tk = function (q) { for (var dy2 = -1; dy2 <= 1; dy2++) for (var dx2 = -1; dx2 <= 1; dx2++) taken[(q[0] + dx2) + ',' + (q[1] + dy2)] = 1; };
    marks.doors = {};
    T.DOORS.forEach(function (d) {
      var p = V.PINS.filter(function (q) { return q[2] === d.pin; })[0]; if (!p) return;
      var q = null, g0 = gxOf(p[0]), g1 = gyOf(p[1]), c0 = at(g0, g1);
      if (c0 && T.ROOFS[c0]) { var y5 = g1; while (at(g0, y5 + 1) === c0 && y5 - g1 < 8) y5++; var below = at(g0, y5 + 1); if (below && '.,='.indexOf(below) >= 0 && !taken[g0 + ',' + (y5 + 1)]) q = [g0, y5 + 1]; } // (straight south of the pin, past its own building, onto the ground: the door in its south wall)
      if (!q) q = nearestOpen(p[0], p[1], 150, taken); if (!q) return;
      tk(q); set(q[0], q[1], 'd'); marks.doors[d.id] = q;
    });
    var v6pins = {}; V.PINS.forEach(function (p) { v6pins[p[2]] = [p[0], p[1]]; });
    var heights = []; for (var y4 = 0; y4 < h; y4++) { var fy = cy(y4), e = fy <= T.SLOPE[0] ? T.DROP : fy >= T.SLOPE[1] ? 0 : T.DROP * (T.SLOPE[1] - fy) / (T.SLOPE[1] - T.SLOPE[0]), dg = Math.round(e * T.FT / F / 2.5); heights.push(new Array(w + 1).join(dg.toString(36))); } // (in the grid's steps, 2.5 ft, at the square's scale)
    for (var si = 0; si < g.length; si++) if (!T.ROOFS[g[si]]) sl[si] = 0; // (a side only where a roof still stands: the streets, the doors and the yard laid over some)
    var slope = []; for (var y3 = 0; y3 < h; y3++) { var sr = ''; for (var x3 = 0; x3 < w; x3++) sr += sl[y3 * w + x3]; slope.push(sr); }
    return { w: w, h: h, rows: (function () { var out = []; for (var y2 = 0; y2 < h; y2++) out.push(g.slice(y2 * w, y2 * w + w).join('')); return out; })(), slope: slope, heights: heights, reach: reach, marks: marks, v6pins: v6pins, F: F };
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
    { id: 'keeper:tam', pin: '40' }, { id: 'shop:lucia', pin: '42' },
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
    // the ways off the floor: the roads where they run off its edge (the world map takes the party on there, later)
    var ways = [];
    for (var y1 = 0; y1 < h; y1++) for (var x1 = 0; x1 < w; x1++) if ((x1 === 0 || y1 === 0 || x1 === w - 1 || y1 === h - 1) && rows[y1][x1] === ',') ways.push([x1, y1]);
    var trig = [];
    Object.keys(M.doors).forEach(function (id) { var d = M.doors[id], dd = T.DOORS.filter(function (z) { return z.id === id; })[0]; if (inW(d)) trig.push({ id: id, on: 'step', rect: to(d).concat([1, 1]), town: 'door', door: dd }); });
    var people = [], npc8 = (((window.DS || {}).DATA || {}).maps || {}).silverton, used = {};
    [M.gates.west, M.gates.south, M.gates.east, M.vault].concat(M.hexFront, M.hexBack, Object.keys(M.doors).map(function (k) { return M.doors[k]; })).forEach(function (q) { if (q) used[q[0] + ',' + q[1]] = 1; }); // (no one stands on a gate, a door or the Hexagon's doors -- at the town's scale a few feet off a mark is the mark)
    ((npc8 && npc8.npcs) || []).forEach(function (n) {
      var pl = T.PLACE[n.id]; if (!pl || !T.cond(n.cond, flags)) return;
      var p0 = pl.pin ? (L.v6pins[pl.pin] || null) : null, sq = null;
      if (pl.at === 'gate:west') sq = M.gates.west; else if (pl.at === 'hexFront') sq = M.hexFront[0];
      if (sq) p0 = [T.X0 + (sq[0] + 0.5) * L.F, T.Y0 + (sq[1] + 0.5) * L.F];
      if (!p0) return;
      sq = T.openNear(L, p0[0] + ((pl.d || [])[0] || 0), p0[1] + ((pl.d || [])[1] || 0), used); if (!sq || !inW(sq)) return;
      used[sq[0] + ',' + sq[1]] = 1;
      var s = to(sq); people.push({ id: n.id, at: s, kind: T.KIND[n.look] || 'bandit', face: T.FACE[n.dir] || [0, 1], look: n.look, hire: n.hire || null });
      trig.push({ id: 'talk:' + n.id, on: 'use', rect: s.concat([1, 1]), town: 'talk', npc: n.id });
    });
    var mk = function (p) { return Array.isArray(p) && Array.isArray(p[0]) ? p.map(to) : to(p); }, marks = {};
    Object.keys(M).forEach(function (k) { var v = M[k]; marks[k] = v && !Array.isArray(v) ? Object.keys(v).reduce(function (a, k2) { a[k2] = to(v[k2]); return a; }, {}) : mk(v); });
    var id = function (x, y) { return [x, y]; }, V = D.TOWN_V6, ft = function (p) { return [T.X0 + (p[0] + ox + 0.5) * L.F, T.Y0 + (p[1] + oy + 0.5) * L.F]; };
    var wayName = {}; ways.forEach(function (p) { var f = ft(p), best = 0, bd = 1e9; V.road.forEach(function (r, k) { for (var i = 0; i + 1 < r[0].length; i++) { var a = r[0][i], b = r[0][i + 1], vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy, t = L2 ? Math.max(0, Math.min(1, ((f[0] - a[0]) * vx + (f[1] - a[1]) * vy) / L2)) : 0, d = Math.hypot(f[0] - a[0] - t * vx, f[1] - a[1] - t * vy); if (d < bd) { bd = d; best = k; } } }); wayName[p[0] + ',' + p[1]] = T.ROADS[best] || 'the road'; });
    var districts = (V.label || []).filter(function (l) { return /district/.test(l[3]) && !/S I L V E R T O N/.test(l[2]); });
    var def = D.MAPS.silverton = {
      name: 'Silverton', sub: 'the town, true scale from the city map v6', key: 'silverton', town: true, wet: false, dark: false, ground: 'earth', step: 10,
      view: /[?&]view=iso\b/.test(q) ? null : 'top', // (north up the screen -- 10-20, Griz: "the iso is too much for the town"; &view=iso the grid's diamonds: js/topview.js)
      heights: L.heights.slice(oy, oy + h).map(function (r) { return r.slice(ox, ox + w); }),
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
  T.ROOFS = { b: { h: 20, roof: 'red' }, n: { h: 16, roof: 'leather' }, u: { h: 24, roof: 'red' }, h: { h: 12, roof: 'leather' }, j: { h: 10, roof: 'stone' }, B: { h: 35, roof: 'stone' }, q: { h: 10, roof: 'silver', wall: 'silver' } };
  T.HOUSES = 'bnu'; T.SHACKS = 'hj';
  T.roofsAt = function (F) { if (F === T.FT) return T.ROOFS; var o = {}; Object.keys(T.ROOFS).forEach(function (k) { o[k] = Object.assign({}, T.ROOFS[k], { h: T.ROOFS[k].h * T.FT / F }); }); return o; }; // (the heights shrink with the squares: the town as if the party stood F / 5 times taller)
  T.ROADS = ['the south gate track', 'THE road west: a mile to the fork', 'the road east: the farms and the coast', 'the old mine track', 'the feed track: the bridge and the Warrens mouths']; // (v6's roads in its own order)
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
    var kinds = [], party = ((B.roam && B.roam.members) || []).map(function (u) { return String(u.name || '').toLowerCase(); });
    def.people.forEach(function (p, i) {
      // (a hero who walks with the party is not also standing in town: the 8-bit's hire NPCs -- Vivian on vice row, Aurdin at the chapel -- as the 8-bit hides them once hired)
      if (p.hire && party.indexOf(p.hire) >= 0) { def.src8.triggers = def.src8.triggers.filter(function (t) { return t.npc !== p.id; }); return; }
      var n8 = ((window.DS.DATA || {}).npcs || {})[p.id] || {}, kind = D.FOES[p.kind] ? p.kind : 'bandit';
      var u = B.makeFoe({ id: 'town' + i, kind: kind, at: p.at.slice(), side: 'party', ally: true });
      u.name = n8.name || p.id; u.look = true; u.npc = p.id; u.attacks = {}; u.multi = 1; u.hp = u.maxhp = 4; u.lvl = 1;
      u.facing = D.spr.facingFor(p.face[0], p.face[1]); u.anim = 'idle'; u.animT = 0;
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
    var t = T.TRADE[id] || { size: 'm', floor: 'o', goods: 'leather' }, S = { s: [10, 8], m: [12, 10], l: [16, 12] }[t.size] || [12, 10], w = S[0], h = S[1], g = [];
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
    B.units.push(u); if (D.spr.prefetch && u.sheet) D.spr.prefetch([u.sheet]);
    R.famPlace(B, true); B.cache = null; B.exits = []; D.grid.setup(B.map, B.units); B.focus(t);
    B.card(D.roam.wrap(['{y}' + def.name + '{/}' + (def.name !== kp.name ? ' -- ' + kp.name + ' at the counter' : '') + '.', '{g}E at the counter: a word. The door behind you: back to the street.' + (kp.own ? ' (Griz\'s own: the room waits on his word.)' : '') + '{/}']), 360);
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
    if (trig.town === 'talk') {
      var u = B.units.filter(function (x) { return x.npc === trig.npc; })[0], t = R0.token;
      if (u) u.facing = D.spr.facingFor(t.x - u.x, t.y - u.y);
      var kp = R.def.room && R.def.keeper && R.def.keeper.id === trig.npc ? R.def.keeper : null, said = trig.npc === 'guard1' ? [T.LINE.guard1] : T.say(B, trig.npc);
      if (kp) said = (/^\{g\}\(Their scene/.test(said[0]) ? [] : said).concat(['{g}' + (kp.own ? 'Griz\'s own: the counter waits on his word.' : 'The counter -- buying and selling -- is to come.') + '{/}']); // (a room's keeper: the 8-bit's word where it has one, and the counter's screen to come)
      B.card(R.wrap(['{y}' + (u ? u.name : trig.npc) + '{/}'].concat(said)), 420);
      D.sfx('popup'); yield 20; return;
    }
    if (trig.town === 'door' && T.hasRoom(trig.id)) { yield* T.goIn(B, trig); return; } // (in: the room behind it -- T.room)
    if (trig.town === 'door') { // (a door with no room behind it: its keeper's word at the door, as the 8-bit's keeper card)
      var arg2 = trig.id.split(':')[1], N2 = ((window.DS.DATA || {}).npcs || {})[arg2] || {}, d2 = trig.door || {};
      B.card(R.wrap(['{y}' + (d2.name || N2.name || arg2) + '{/}' + (d2.what ? ' -- ' + d2.what : '')].concat(T.say(B, arg2))), 420); D.sfx('popup'); yield 10; return;
    }
  };
})();
