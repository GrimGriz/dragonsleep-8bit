/* DEEP16 -- THE HEX, INSIDE: Silverton's Hexagon walked top-down, north up, its three floors (10-22, the Hex interior seat, started by the lanes desk). His
   words to the desk, 10-22: "start a Silverton Hex interior job, let it request it's own tile sheet as needed"; 10-21: "Inside of the hex will probably be N/S tile
   map rather than grid, though the sand fights can eligible for simplified encounter" and "Can we get some diagonal looking tiles to try and make the hex look
   better?". To the seat's four questions: "1 - build all 3, where 3 can be just the meeting room and the offices upstairs and currently turned off for player access
   / 2-3 - match the 8-bit and let me know where you have to vary / 4 - let's see how that comes out".

   The building is the walkable's measured register (the-lab/hex-fps-build/hex-geometry.json, harvested 09-16 -- the realm's the-hex.md "The building as built": a
   vertex due north, 64 ft sides, the sand a 27.6 ft hexagon with a board lip and two tiers stepping down to it, the four bars, the Wall of Boxes behind the SSE bar,
   the two spirals by the pulled north point, the guard stations at the north door, Mama's premises and the cold-food concession walled off in the north-east and
   north-west corners; up the spirals the gambling floor round the opening over the sand, its rail bowed out between the north logs; on the third floor the town
   meeting lounge under the Big Window, Urtusk's office east and the Armory west) laid at true scale, 5 ft a square, as the shops' rooms are (js/town.js T.room). Its
   squares are the grid's; what stands is drawn by code on the true lines -- the six faces' diagonals, the tiers' rings: one picture of each floor painted under the
   pages (js/topview.js paintPage, a def's `underlay`), and every standing piece cut in strips a square wide, each strip sorted by its own south edge among the
   figures, so a figure goes behind the far end of a bar on the slant and in front of its near end.

   Its people, their words and its fights are the first game's (content/maps/hex.json and hex2.json; content/npcs.json; js/events.js S.hexCard, S.warda, S.vairseat;
   content/text.json hex.*): Korvin at the slate with the card's five bouts, each opening the next, five silver in and ten out, the crowd fronting a stranger's five;
   one hero takes the sand alone and gets up at 1 if they go down; the champion and the card's hired blade each a point of renown the first time. A bout is the
   simple screen by default (his "sand is 'hex' fights, silverton internal"; js/simple.js), ON THE GRID the other way, on the Hex's own sand with the tiers and a crowd
   round it (HX.field) and the rest of the party watching from the rail. The third floor was built and shut (the spirals up
   Warda's, the first game's own line); since 10-28 the spiral goes up to it -- the lounge, Urtusk's office, the Armory -- with Warda there and its rooms still hers
   (Griz: "there's no reason the player can't go up to the town meeting and urtusk office 3rd floor"). The test door deep16/?roam=hex&floor=3 shows it. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, T = D.town, TV = D.topview, iso = D.iso;
  if (!T || !TV || !iso) return;
  var NZ = iso.noise, HX = D.hex = {}, A = Math.sqrt(3) / 2;

  // ---------------------------------------------------------------- the frame: 24 x 27 squares, the centre on a square's edge across (the tip doors two squares wide)
  // and a square's middle down (the east and west doors one)
  HX.SQ = 5; HX.W = 24; HX.H = 27; HX.CX = 12; HX.CY = 13.5;
  // the register's measures in feet (hex-geometry.json, metres x 3.2808): the shell's vertex 64 ft, its wall 1.4 ft; the sand, the tiers, the rail and the inside
  // balcony by their vertex radii; the carved tips 6 ft each side of the point (the town's hexCanvas carves the ground floor's tips flat for straight N/S doors:
  // 10-21, Griz, "those doors should be double doors at the southern tip (carved away so the doors are straight n/s) - the point isn't carved out on the upper floors")
  HX.G = { R: 64, WALL: 1.4, SAND: 27.6, LIP: 2, TIER2: 32.8, TIER1: 38.1, RAIL: 40, BAL: 45.8, CARVE: 6 };
  var G = HX.G, AP = { inn: G.R * A - G.WALL, out: G.R * A, sand: G.SAND * A, lip: G.SAND * A - G.LIP * A, tier2: G.TIER2 * A, tier1: G.TIER1 * A, rail: G.RAIL * A, bal: G.BAL * A };
  var ZC = (AP.inn - G.CARVE / 2) / A; // (the carved tip's inner face, |z|)
  HX.AP = AP;
  function hd(x, z) { var ax = Math.abs(x); return Math.max(ax, ax * 0.5 + Math.abs(z) * A); } // (the apothem's measure: a hexagon of vertex r is hd < r * A)
  var N6 = [[1, 0], [0.5, A], [-0.5, A], [-1, 0], [-0.5, -A], [0.5, -A]]; // (the faces' normals: E, SSE, SSW, W, NNW, NNE)
  function face(x, z) { var k = 0, b = -1e9; for (var i = 0; i < 6; i++) { var d = x * N6[i][0] + z * N6[i][1]; if (d > b) { b = d; k = i; } } return k; }
  function along(x, z, k) { return -x * N6[k][1] + z * N6[k][0]; }
  function fr(v) { return v - Math.floor(v); } // (a fraction that keeps to 0..1 on both sides of zero)
  HX.hd = hd;
  var TSZ = TV.TS;
  function PX(x) { return (x / HX.SQ + HX.CX) * TSZ; }
  function PY(z) { return (z / HX.SQ + HX.CY) * TSZ; }
  function FX(p) { return (p / TSZ - HX.CX) * HX.SQ; }
  function FZ(p) { return (p / TSZ - HX.CY) * HX.SQ; }
  HX.mid = function (sx, sy) { return [(sx + 0.5 - HX.CX) * HX.SQ, (sy + 0.5 - HX.CY) * HX.SQ]; };
  HX.sqAt = function (x, z) { return [Math.floor(x / HX.SQ + HX.CX), Math.floor(z / HX.SQ + HX.CY)]; };
  function inShell(lv, x, z) { return hd(x, z) < AP.inn && (lv > 1 || Math.abs(z) < ZC); }

  // ---------------------------------------------------------------- what stands, in feet (the register; the third floor's furniture the seat's draft, invented.json hex-third-floor)
  function rect(c, len, d, a) { var u = [Math.cos(a), Math.sin(a)], n = [-u[1], u[0]], l = len / 2, h = d / 2; return [[c[0] - u[0] * l - n[0] * h, c[1] - u[1] * l - n[1] * h], [c[0] + u[0] * l - n[0] * h, c[1] + u[1] * l - n[1] * h], [c[0] + u[0] * l + n[0] * h, c[1] + u[1] * l + n[1] * h], [c[0] - u[0] * l + n[0] * h, c[1] - u[1] * l + n[1] * h]]; }
  function seg(a, b, th) { var dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); return rect([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], L, th, Math.atan2(dz, dx)); }
  function disc(c, r, n) { var o = []; n = n || 14; for (var i = 0; i < n; i++) { var t = (i + 0.5) / n * Math.PI * 2; o.push([c[0] + Math.cos(t) * r, c[1] + Math.sin(t) * r]); } return o; }
  // the four bars (the register's `bars`: the SSE and SSW long on their faces, a shelf behind each, the Wall of Boxes above the SSE's; the E and W moved north off the door
  // centres to kiss their interior log, the bartender's station behind) -- `gap`: the bartender's place, between the bar and what is behind it
  HX.BARS = [
    { c: [23.4, 40.6], len: 26.2, d: 2.5, a: 2.618, shelf: { c: [26.7, 46.2], len: 23.6, d: 1.3 }, boxes: true, who: 'bartenderBoxes' },
    { c: [-23.4, 40.6], len: 26.2, d: 2.5, a: 3.665, shelf: { c: [-26.7, 46.2], len: 23.6, d: 1.3 }, who: 'bartenderS' },
    { c: [43.1, -19.7], len: 13.1, d: 2.5, a: -0.209, station: [46.0, -23.5], who: 'bartenderE' },
    { c: [-43.1, -19.7], len: 13.1, d: 2.5, a: -2.932, station: [-46.0, -23.5] }
  ];
  HX.LOGS = [[34.64, 20], [-34.64, 20], [34.64, -20], [-34.64, -20], [17.32, -30], [-17.32, -30]]; // (the interior logs that carry the roof ring, through every floor; 3 ft)
  HX.SPIRALS = [[-8.66, -35], [8.66, -35]]; // (6 ft spirals on the rail line, 10 ft either side of the pulled north point)
  HX.BOARDS = [[18.6, -45], [-18.6, -45]]; // (a table that is not a gambling table in each north notch)
  HX.STATIONS = [{ a: [9.15, -58.7], b: [9.15, -44.8], box: true }, { a: [-9.15, -58.7], b: [-9.15, -44.8] }]; // (the guard stations at the north door; the east carries the contraband box)
  HX.MAMA = [[29.4, -47.0], [19.4, -29.7], [35.4, -20.5], [55.4, -32.0]]; // (Mama's Pharmakaiea in the NNE face: walled, its concourse door sealed -- she trades from her booth outside, js/town.js T.MAMA)
  HX.CONC = [[-29.4, -47.0], [-19.4, -29.7], [-35.4, -20.5], [-55.4, -32.0]]; // (the cold-food concession in the NNW, entered only from inside; unnamed, his)
  HX.FELT = [[-45, 0], [-39.1, -29.4], [-18.1, -41.6], [18.1, -41.6], [39.1, -29.4], [45, 0]]; // (the gambling floor's six felt tables: the feel test he asked for, not a count)
  HX.BOW = { c: [0, -42.6], r: 21.4 }; // (the second floor's rail and the lounge above it bowed out over the sand, log to log)
  HX.MIDWALL = [[17.32, -30], [27.7, -48.0]]; HX.MIDDOOR = 0.62; // (the third floor's walls between the lounge and the office and Armory; their 6 ft doors at 0.62 of the way out)
  HX.SECRET = [[34.64, -20], [55.43, -32]]; // (the office's and the Armory's back walls, the squeeze through them by the balcony's dead end)
  function inCircle(x, z) { return Math.hypot(x - HX.BOW.c[0], z - HX.BOW.c[1]) <= HX.BOW.r; }
  function crossOf(a, b, x, z) { return (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]); }
  function segDist(a, b, x, z) { var vx = b[0] - a[0], vz = b[1] - a[1], L = vx * vx + vz * vz, t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / L)); return { d: Math.hypot(x - a[0] - t * vx, z - a[1] - t * vz), t: t }; }
  function inPoly(P, x, z) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var xi = P[i][0], zi = P[i][1], xj = P[j][0], zj = P[j][1]; if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) c = !c; } return c; }
  function polyDist(P, x, z) { var b = 1e9; for (var i = 0; i < P.length; i++) b = Math.min(b, segDist(P[i], P[(i + 1) % P.length], x, z).d); return inPoly(P, x, z) ? -b : b; }
  // the third floor's rooms: the lounge between the midwalls and north of the rail (with the bow), the office east of the NNE midwall and north of the secret wall
  function mirror(x) { return Math.abs(x); }
  function inLounge(x, z) { return inShell(3, x, z) && crossOf(HX.MIDWALL[0], HX.MIDWALL[1], mirror(x), z) <= 0 && (hd(x, z) >= AP.rail || inCircle(x, z)); }
  function inOffice(x, z) { return x > 0 && inShell(3, x, z) && crossOf(HX.MIDWALL[0], HX.MIDWALL[1], x, z) > 0 && crossOf(HX.SECRET[0], HX.SECRET[1], x, z) < 0 && hd(x, z) >= AP.rail; }
  function inArmory(x, z) { return x < 0 && inOffice(-x, z); }
  HX.inLounge = inLounge; HX.inOffice = inOffice; HX.inArmory = inArmory;
  // the third floor's furniture (the seat's draft): the council's long table under the Big Window, Urtusk's desk and strongbox, the Armory's racks and chest
  HX.THIRD = {
    table: rect([0, -49], 18, 4, 0), desk: rect([38.5, -37.5], 5, 2.5, 0.5236), strongbox: rect([46.5, -35.5], 2.5, 1.8, 0.5236),
    racks: [rect([-36.5, -41], 7, 1.2, -0.5236), rect([-47, -35], 6, 1.2, -0.5236)], chest: rect([-30, -36], 3, 2, -0.5236)
  };
  // the owners' lounge on the second floor's south block (SSE + SSW): seating, no tables -- two benches along each face, 3 ft off the wall
  HX.BENCHES = [1, 2].reduce(function (o, k) { var n = N6[k], t = [-n[1], n[0]], a0 = AP.inn - 3.2, m = [n[0] * a0, n[1] * a0]; [-10, 10].forEach(function (s) { o.push(rect([m[0] + t[0] * s, m[1] + t[1] * s], 13, 2, Math.atan2(t[1], t[0]))); }); return o; }, []);

  // ---------------------------------------------------------------- the squares, a floor at a time
  // '#' closed (the shell, the sand, the opening, a wall, a bar, a table, a spiral -- each drawn by the floor's own picture or a piece), 'o' boards, 'd' a way out (a door)
  HX.DOORS = { back: [[11, 1], [12, 1]], front: [[11, 25], [12, 25]], east: [[23, 13]], west: [[0, 13]] };
  HX.ENTRY = { back: [[11, 2], [0, 1]], front: [[11, 24], [0, -1]], east: [[22, 13], [-1, 0]], west: [[1, 13], [1, 0]] };
  function solidAt(lv, x, z) {
    var m = 0.9, i;
    if (lv === 1) {
      for (i = 0; i < HX.BARS.length; i++) { var b = HX.BARS[i]; if (polyDist(rect(b.c, b.len, b.d, b.a), x, z) < m) return true; if (b.shelf && polyDist(rect(b.shelf.c, b.shelf.len, b.shelf.d, b.a), x, z) < m) return true; }
      for (i = 0; i < HX.BOARDS.length; i++) if (polyDist(rect(HX.BOARDS[i], 5, 3, 0), x, z) < m) return true;
      for (i = 0; i < HX.STATIONS.length; i++) if (segDist(HX.STATIONS[i].a, HX.STATIONS[i].b, x, z).d < 1.8) return true;
      if (polyDist(HX.MAMA, x, z) < 1.2 || polyDist(HX.CONC, x, z) < 1.2) return true;
      if (Math.hypot(x - 7, z - 40) < 2.2) return true; // (Korvin's slate)
    }
    if (lv === 2) {
      for (i = 0; i < HX.FELT.length; i++) if (Math.hypot(x - HX.FELT[i][0], z - HX.FELT[i][1]) < 2.6 + m) return true;
      for (i = 0; i < HX.BENCHES.length; i++) if (polyDist(HX.BENCHES[i], x, z) < m) return true;
      var vc = HX.mid(HX.CHAIR[0], HX.CHAIR[1]); if (Math.hypot(x - vc[0], z - vc[1]) < 2.2) return true; // (Vair's empty chair)
    }
    if (lv === 3) {
      var TH = HX.THIRD; if ([TH.table, TH.desk, TH.strongbox, TH.chest].concat(TH.racks).some(function (P) { return polyDist(P, x, z) < m; })) return true;
      var ax = mirror(x), mw = segDist(HX.MIDWALL[0], HX.MIDWALL[1], ax, z), sw = segDist(HX.SECRET[0], HX.SECRET[1], ax, z), dh = 3 / Math.hypot(HX.MIDWALL[1][0] - HX.MIDWALL[0][0], HX.MIDWALL[1][1] - HX.MIDWALL[0][1]);
      if (mw.d < 1.6 && Math.abs(mw.t - HX.MIDDOOR) > dh) return true;
      if (sw.d < 1.6) return true;
    }
    for (i = 0; i < HX.LOGS.length; i++) if (Math.hypot(x - HX.LOGS[i][0], z - HX.LOGS[i][1]) < 1.5 + m) return true;
    return false;
  }
  HX.cell = function (lv, x, z) {
    if (!inShell(lv, x, z)) return '#';
    var h = hd(x, z);
    if (HX.SPIRALS.some(function (s) { return Math.hypot(x - s[0], z - s[1]) < 3; })) return '#'; // (a spiral: a USE, HX.stair -- never a square a walk crosses)
    if (lv === 1 && h < AP.sand) return '#';                                    // (the sand: reached only through the slate)
    if (lv === 2 && h < AP.rail && !inCircle(x, z)) return '#';                 // (the opening over the sand)
    if (lv === 3 && !inLounge(x, z) && !inOffice(x, z) && !inArmory(x, z)) return '#'; // (the inside balcony and the fifteen rooms: not built, Warda's)
    return solidAt(lv, x, z) ? '#' : 'o';
  };
  HX.rows = function (lv) {
    var g = [];
    for (var y = 0; y < HX.H; y++) { var r = []; for (var x = 0; x < HX.W; x++) { var p = HX.mid(x, y); r.push(HX.cell(lv, p[0], p[1])); } g.push(r); }
    if (lv === 1) Object.keys(HX.DOORS).forEach(function (k) { HX.DOORS[k].forEach(function (q) { g[q[1]][q[0]] = 'd'; }); });
    return g.map(function (r) { return r.join(''); });
  };
  HX.spiralSq = function () { return HX.SPIRALS.map(function (s) { return HX.sqAt(s[0], s[1]); }); };

  // ---------------------------------------------------------------- the people (the first game's, by their ids: content/maps/hex.json, hex2.json), where the register puts them
  // at: a square aimed for (the nearest open one if the floor took it); face; kind: their figure where the grid has one
  HX.PEOPLE = {
    1: [{ id: 'korvinSlate', at: [12, 21], face: [0, 1], fig: 'korvin' }, { id: 'talmok', at: [12, 7], face: [0, 1], kind: 'talmok' },
      { id: 'barleyBench', at: [15, 20], face: [0, 1], sheet: 'barley_p1', hire: 'barley' }, { id: 'lymenHex', at: [17, 14], face: [-1, 0], sheet: 'lymen_p1', hire: 'lymen' },
      { id: 'bartenderS', at: [6, 22], face: [1, -1] }, { id: 'bartenderE', at: [21, 8], face: [0, 1] }, { id: 'warrenspete', at: [5, 18], face: [1, 0] },
      { id: 'hexpatron1', at: [5, 12], face: [1, 0] }, { id: 'hexpatron2', at: [19, 10], face: [-1, 1] }, // (the drinker a square off Mama's hatch since 10-28: not stood in front of Higertha)
      // (10-28, Griz: "we need Higertha in the window on mama's side and consider a concessions vendor"): Higertha at Mama's hatch onto the concourse (the realm's the-hex.md:
      // "Higertha works the arena-side window -- a serving hatch in the front wall onto the concourse"), and a hired town youth at the cold-food concession's (its counter-hand
      // unnamed, the faces change: CANON 09-16b) -- each `inside` their walled room, seen through the hatch, a word had at the hatch (`hatch`) or by a click on them
      // (10-28 later, Griz: "higertha has the pocket DM version": her figure the Pocket DM's own -- `named`, D.npc.lookOf of her NPC.NAMED spec, js/classes.js -- and she stands
      // behind the hatch's middle, the hatch west of the roof's log at its end, so no post stands in front of her; the wall itself her hatch, a word had across it)
      { id: 'higertha', name: 'Higertha', at: [17, 8], face: [0, 1], inside: true, named: 'higertha' },
      { id: 'concession', name: 'the concession\'s hand', at: [6, 7], hatch: [6, 8], face: [1, 1], inside: true, kind: 'crewman' }],
    2: [{ id: 'gambler1', at: [5, 7], face: [-1, 0] }, { id: 'gambler2', at: [19, 13], face: [1, 0] }],
    // the third floor open to the party (10-28, Griz: "there's no reason the player can't go up to the town meeting and urtusk office 3rd floor"; "consider if we should have
    // NPC on the 3rd floor where the council meet when it's not a council meeting though"): Warda, who keeps it and the ring of keys, in the lounge on an ordinary day
    3: [{ id: 'warda', at: [12, 5], face: [0, 1] }]
  };
  HX.CHAIR = [19, 6]; // (Vair's empty chair, by the NE felt table: the first game's `vairseat`, a chair with no one in it -- js/events.js S.vairseat)
  HX.SLATE = [13, 21]; // (Korvin's odds-board beside him)

  // ---------------------------------------------------------------- the floor's def (js/roam.js reads it as a room's: T.room's shape, with `hexIn` its floor)
  HX.SUB = { 1: 'the sand and the bars', 2: 'the gambling floor', 3: 'the meeting room and the offices' };
  HX.HELLO = { 1: 'E: a word. Korvin at the slate: the card. E at a spiral: up. The doors: back to the street.', 2: 'E: a word. E at a spiral: down, or on up.', 3: 'The council\'s lounge under the Big Window, Urtusk\'s office east, the Armory west; the rooms round the balcony are Warda\'s. E at a spiral: down.' };
  HX.LINES = { warda3: 'Warda keeps the third floor and the ring of keys. The rooms round the balcony are not for you.' }; // (the first game's hex.warda, the stairs open now: invented.json hex-third-floor-open)
  HX.def = function (lv, R0) {
    var rows = HX.rows(lv), trig = [], ways = [], f = (R0 && R0.flags) || {}, holds = function () { return false; };
    var open = function (q) { return q && rows[q[1]] && 'o'.indexOf(rows[q[1]].charAt(q[0])) >= 0; };
    if (lv === 1) Object.keys(HX.DOORS).forEach(function (k) { HX.DOORS[k].forEach(function (q) { ways.push(q.slice()); }); });
    HX.spiralSq().forEach(function (q) { trig.push({ id: 'hex:spiral', on: 'use', rect: [q[0], q[1], 1, 1], town: 'hex', stair: true }); });
    // the people: their first-game conditions on the floor's flags; one who walks with the party is not also standing here (as the town hides them: T.people)
    var party = R0 ? R0.members.map(function (u) { return String((u.src && (u.src.key || u.src.id)) || u.id || '').toLowerCase(); }) : [];
    var map8 = ((DS.DATA || {}).maps || {})[lv === 1 ? 'hex' : 'hex2'] || {}, n8 = {}; (map8.npcs || []).forEach(function (n) { n8[n.id] = n; });
    var people = [], used = {};
    (HX.PEOPLE[lv] || []).forEach(function (p) {
      var n = n8[p.id] || {}; if (n.cond && !T.cond(n.cond, f, holds)) return;
      if (p.hire && party.indexOf(p.hire) >= 0) return;
      var q = p.inside ? p.at.slice() : HX.near(rows, p.at, used); if (!q) return; used[q[0] + ',' + q[1]] = 1; // (inside: on their own square behind a wall, as placed)
      var shN = p.named && D.npc && D.npc.NAMED && D.npc.NAMED[p.named] ? D.npc.lookOf(D.npc.NAMED[p.named]) : null; // (a named one of the Pocket DM's: the figure it gives them)
      people.push({ id: p.id, at: q, face: p.face, kind: p.kind || T.KIND[n.look] || 'bandit', sheet: shN || p.sheet || null, fig: p.fig || null, look: n.look, name: p.name || null, hire: p.hire || null }); // (hire: dressed as the town dresses them, HX.lay)
      trig.push({ id: 'talk:' + p.id, on: 'use', rect: [q[0], q[1], 1, 1], town: 'talk', npc: p.id });
      if (p.hatch) trig.push({ id: 'talk:' + p.id, on: 'use', rect: [p.hatch[0], p.hatch[1], 1, 1], town: 'talk', npc: p.id, hatch: true }); // (the hatch in the wall: E at it from the concourse)
    });
    if (lv === 1) {
      trig.push({ id: 'talk:korvinSlate', on: 'use', rect: [HX.SLATE[0], HX.SLATE[1], 1, 1], town: 'talk', npc: 'korvinSlate' }); // (the slate itself: Korvin's)
      // the Wall of Boxes: the first game's sign (content/maps/hex.json signs), E at its shelf
      var sign8 = (map8.signs || [])[0];
      for (var y = 0; y < HX.H; y++) for (var x = 0; x < HX.W; x++) { var p0 = HX.mid(x, y), b0 = HX.BARS[0]; if (polyDist(rect(b0.shelf.c, b0.shelf.len, b0.shelf.d, b0.a), p0[0], p0[1]) < 0.9 && sign8) trig.push({ id: 'sign:boxes', on: 'use', rect: [x, y, 1, 1], town: 'hex', sign: sign8.text }); }
    }
    if (lv === 2) {
      var map1 = ((DS.DATA || {}).maps || {}).hex2 || {}, sign2 = (map1.signs || [])[0];
      trig.push({ id: 'talk:vairseat', on: 'use', rect: [HX.CHAIR[0], HX.CHAIR[1], 1, 1], town: 'talk', npc: 'vairseat' });
      // the rail: its sign on every square of the opening beside the floor
      for (var y2 = 0; y2 < HX.H; y2++) for (var x2 = 0; x2 < HX.W; x2++) {
        var c2 = rows[y2].charAt(x2), m2 = HX.mid(x2, y2); if (c2 !== '#' || !(hd(m2[0], m2[1]) < AP.rail) || inCircle(m2[0], m2[1]) || !sign2) continue; // (the opening's own squares: not the bow, not a spiral)
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (o) { return open([x2 + o[0], y2 + o[1]]); })) trig.push({ id: 'sign:rail', on: 'use', rect: [x2, y2, 1, 1], town: 'hex', sign: sign2.text });
      }
    }
    var id = function (a, b) { return [a, b]; };
    var def = {
      name: 'The Hex', sub: HX.SUB[lv], key: 'hex' + lv, room: 'hex', hexIn: lv, town: true, wet: false, dark: false, step: 10, ground: 'earth',
      view: 'top', rows: rows, w: HX.W, h: HX.H, entry: [[11, 24]], face: [0, -1], doors: ways, stairUp: [], foes: [], marks: {}, people: people, keeper: null,
      src8: { id: 'hex' + lv, rows: [], legend: {}, triggers: trig, warps: [], chests: [], zones: [], save: false }, from8: id, to8: id, sig: '', zone8: null,
      music: 'hex', hud: 'the Hex: ' + HX.SUB[lv], hello: ['{y}THE HEX{/} -- ' + HX.SUB[lv] + '.', '{g}' + HX.HELLO[lv] + '{/}'], // (the floor's own words when it is the first: js/roam.js R.script)
      underlay: function (cx, x0, y0) { cx.drawImage(HX.picture(lv), -x0, -y0); }, // (the floor's own picture under the pages: js/topview.js paintPage)
      onArt: function (m) { HX.dress(m, lv); }, // (the atlases landed, or the switch turned: the things that stand made again -- js/topview.js TV.repaint)
      where: function () { return HX.SUB[lv]; }
    };
    return def;
  };
  // the open square nearest the one aimed for, not one taken
  HX.near = function (rows, at, used) {
    for (var r = 0; r < 4; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      var x = at[0] + dx, y = at[1] + dy; if (rows[y] && rows[y].charAt(x) === 'o' && !(used && used[x + ',' + y])) return [x, y];
    }
    return null;
  };

  // ---------------------------------------------------------------- the floor's picture: every pixel by where it lies (the walkable's lines), painted once a floor
  var RAMP = {}, RP = function (n) { return RAMP[n] || (RAMP[n] = iso.ramp(n)); }, pick = NZ.rampPick; // (the palette's ramps, asked once: a floor's picture asks a million times)
  function shade(c, k) { return [Math.min(255, c[0] * k) | 0, Math.min(255, c[1] * k) | 0, Math.min(255, c[2] * k) | 0]; }
  function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0]; }
  // a riser shows where a tier steps down toward the camera: on the north faces (NNW, NNE), the step's face looking south
  function risers(x, z) { var k = face(x, z); return k === 4 || k === 5; }
  // THE ART (10-28, the second cutter seat, on the lanes desk's order from Griz's "spin up a second cutter, more landing in fresh"): the art desk's ART-115 floors
  // (deep16-art-wanted.md section 23, HEAD 1), cut by tools/hextiles-sheet.py into hextiles_p1 and sampled as the sand is, 48 px a variant (each row of them slid along by chance and each variant picked by chance, so the boards' ends and knots fall in no grid) -- the tiers' timber
  // and the lip's boards along their own face (their planks follow it, as the code's do), the concourse's boards, the rugs' lattice and the council's boards on
  // the grid's lines. What the art has no fill for (the risers, the steps' lips, the rugs' gold borders, the opening's rim) the code draws as before
  HX.TXN = { plank: 'hx_plank', hi: 'hx_tier_hi', lo: 'hx_tier_lo', lip: 'hx_lip', council: 'hx_council', red: 'hx_rug_red', blue: 'hx_rug_blue' };
  HX.texOf = function () { var o = {}, any = false; Object.keys(HX.TXN).forEach(function (k) { var P = TV.piecePx(HX.TXN[k], 'hex'); if (P) { o[k] = P; any = true; } }); return any ? o : null; };
  var PXFT = TSZ / HX.SQ;
  function tex(k, u, v) { var P = HX.TX && HX.TX[k]; if (!P) return null; v = Math.floor(v); var w = 48, h = P[0].length / 4 / w, cv = Math.floor(v / h); u = Math.floor(u + NZ.h2(cv, 7, 961) * w); var cu = Math.floor(u / w), p = P[Math.floor(NZ.h2(cu, cv, 962) * P.length) % P.length], o = ((((v % h) + h) % h) * w + (((u % w) + w) % w)) * 4; return [p[o], p[o + 1], p[o + 2]]; }
  function texFace(k, x, z) { var f = face(x, z); return tex(k, along(x, z, f) * PXFT, hd(x, z) * PXFT); } // (along the face, and across it)
  // the ground floor: the sand raked in rings, the board lip, the two tiers, the concourse's boards running east-west, the premises' floors, the doorways
  HX.ground = function (x, z, X, Y) {
    var h = hd(x, z), n = NZ.vnoise(X * 0.05, Y * 0.05, 901), fine = NZ.h2(X, Y, 902), L = RP('leather'), Gd = RP('gold'), S = RP('stone'), k = face(x, z), s = along(x, z, k);
    if (h < AP.lip) {
      var rake = ((h * 1.3) % 1) < 0.13, trod = NZ.vnoise(X * 0.011, Y * 0.011, 903), rise = risers(x, z) && h > AP.lip - 0.7;
      if (rise) return pick(L, 0.3 + n * 0.08 - (fr(s * 1.3) < 0.12 ? 0.12 : 0), X, Y); // (the lip's face over the sand, a half metre down)
      if (HX.sandPx) { var sp = HX.sandPx[(((X / 48) | 0) + ((Y / 48) | 0) * 3) % HX.sandPx.length], so = ((Y % 48) * 48 + (X % 48)) * 4; return [sp[so], sp[so + 1], sp[so + 2]]; }
      return pick(Gd, 0.36 + n * 0.16 - (rake ? 0.07 : 0) - (trod > 0.62 ? (trod - 0.62) * 0.6 : 0) + (fine > 0.975 ? 0.12 : 0) - (fine < 0.02 ? 0.12 : 0), X, Y);
    }
    if (h < AP.sand) { // the board lip: planks across the ring
      if (!risers(x, z) && h < AP.lip + 0.22) return L[0];
      if (risers(x, z) && h > AP.sand - 0.7) return pick(L, 0.62 + n * 0.08 - (fr(s * 1.2) < 0.1 ? 0.18 : 0), X, Y);
      var tl = texFace('lip', x, z); if (tl) return tl;
      return pick(L, 0.5 + n * 0.1 - (fr(s * 0.7) < 0.1 ? 0.22 : 0), X, Y);
    }
    if (h < AP.tier1) { // the two tiers, stepping down to the lip
      var lo = h < AP.tier2, top = lo ? AP.tier2 : AP.tier1, w = h - (lo ? AP.sand : AP.tier2);
      if (risers(x, z) && h > top - 0.75) return pick(L, (lo ? 0.5 : 0.6) + n * 0.08 - (fr(s * 1.2) < 0.1 ? 0.16 : 0), X, Y); // (the step's face, lit, its planks upright)
      if (!risers(x, z) && w < 0.25) return S[0]; // (the step's lip in shadow, on the faces turned away)
      var tt = texFace(lo ? 'lo' : 'hi', x, z); if (tt) return tt;
      var seam = fr(w * 0.95) < 0.11 || fr((s + Math.floor(w * 0.95) * 2.3) / 7) < 0.017;
      return pick(L, (lo ? 0.3 : 0.42) + n * 0.12 - (seam ? 0.16 : 0), X, Y);
    }
    if (inPoly(HX.MAMA, x, z) || inPoly(HX.CONC, x, z)) return tex('lo', X, Y) || pick(L, 0.24 + n * 0.08 - ((Y % 10) < 1 ? 0.1 : 0), X, Y); // (the premises' floors, walled off)
    // the concourse: the off-night flooring's boards along the grid's x, their ends staggered; darker by the walls
    var row = Math.floor(Y / 9.6), sm = (Y % 9.6) < 1 || ((X + NZ.h2(row, 0, 904) * 200) % 96) < 1, ao = AP.inn - h < 1.4 ? 0.12 * (1 - (AP.inn - h) / 1.4) : 0;
    var tc = tex('plank', X, Y); if (tc) return ao > 0.05 ? TV.palStep(tc, -1) : tc; // (darker by the walls, a step down its ramp)
    return pick(L, 0.46 + (NZ.h2(row, Math.floor((X + NZ.h2(row, 0, 904) * 200) / 96), 905) - 0.5) * 0.2 + n * 0.12 - (sm ? 0.2 : 0) - ao, X, Y);
  };
  // the second floor: the rug round the ring (red; the owners' lounge on the south block blue), boards by the walls and over the bow, the opening down to the sand
  HX.gambling = function (x, z, X, Y) {
    var h = hd(x, z), n = NZ.vnoise(X * 0.05, Y * 0.05, 911), L = RP('leather'), S = RP('stone'), k = face(x, z), s = along(x, z, k);
    if (h < AP.rail && !inCircle(x, z)) { // the opening: the sand and the tiers below, in the floor's shadow; the floor's edge dark at the rim
      var rim = Math.min(AP.rail - h, HX.BOW.r < Math.hypot(x - HX.BOW.c[0], z - HX.BOW.c[1]) ? Math.hypot(x - HX.BOW.c[0], z - HX.BOW.c[1]) - HX.BOW.r : 99);
      if (rim < 0.9) return S[0];
      return mixc(shade(HX.ground(x, z, X, Y), 0.5), S[1], 0.18);
    }
    var lounge = (k === 1 || k === 2) && h >= AP.rail, rug = h > AP.rail + 1.6 && h < AP.inn - 2.6 && !(h < AP.rail);
    if (rug) {
      var w = h - (AP.rail + 1.6), wid = AP.inn - 2.6 - AP.rail - 1.6, Rr = RP(lounge ? 'blue' : 'red'), Gd = RP('gold');
      if (w < 0.35 || wid - w < 0.35) return Gd[1];
      if (w < 0.7 || wid - w < 0.7) return pick(Rr, 0.2, X, Y);
      var tr = tex(lounge ? 'blue' : 'red', X, Y); if (tr) return tr;
      var lat = fr((s + w) / 3.2) < 0.07 || fr((s - w) / 3.2) < 0.07;
      return lat ? pick(Gd, 0.25, X, Y) : pick(Rr, 0.38 + n * 0.12, X, Y);
    }
    var row = Math.floor(Y / 9.6), sm = (Y % 9.6) < 1 || ((X + NZ.h2(row, 0, 914) * 200) % 96) < 1, ao = AP.inn - h < 1.4 ? 0.12 * (1 - (AP.inn - h) / 1.4) : 0;
    var tb = tex('plank', X, Y); if (tb) return ao > 0.05 ? TV.palStep(tb, -1) : tb;
    return pick(L, 0.4 + n * 0.12 - (sm ? 0.2 : 0) - ao, X, Y);
  };
  // the third floor: the lounge's boards and its long rug, the office and the Armory, the shut balcony and rooms (not built), the opening three floors down
  HX.third = function (x, z, X, Y) {
    var h = hd(x, z), n = NZ.vnoise(X * 0.05, Y * 0.05, 921), L = RP('leather'), S = RP('stone'), Rd = RP('red');
    var lo = inLounge(x, z), of = inOffice(x, z) || inArmory(x, z);
    if (lo || of) {
      if (lo && Math.abs(x) < 12 && z > -54 && z < -44) { var e = Math.min(12 - Math.abs(x), z + 54, -44 - z); return e < 0.4 ? RP('gold')[1] : tex('red', X, Y) || pick(Rd, 0.3 + n * 0.1, X, Y); } // (the long rug under the council's table)
      var tq = tex('council', X, Y); if (tq) return of ? TV.palStep(tq, -1) : tq; // (the office and the Armory a step darker)
      var row = Math.floor(Y / 9.6), sm = (Y % 9.6) < 1 || ((X + NZ.h2(row, 0, 924) * 200) % 96) < 1;
      return pick(L, (of ? 0.34 : 0.4) + n * 0.12 - (sm ? 0.2 : 0), X, Y);
    }
    if (h < AP.rail) { var rim = AP.rail - h; if (rim < 0.9) return S[0]; return mixc(shade(HX.ground(x, z, X, Y), 0.34), S[0], 0.25); }
    if (h < AP.bal) return shade(tex('plank', X, Y) || pick(L, 0.36 + n * 0.1 - ((Y % 9.6) < 1 ? 0.2 : 0), X, Y), 0.55); // (the inside balcony: shut)
    return pick(S, 0.1 + n * 0.06, X, Y); // (the rooms: shut, not built)
  };
  HX.pics = {};
  HX.picture = function (lv) {
    var art = !!(TV.artOn && TV.artOn()), key = lv + (art ? 'a' : 'c'); // (painted again when the atlases land: js/topview.js repaints the pages)
    if (HX.pics[key]) return HX.pics[key];
    RAMP = {}; HX.sandPx = art && TV.piecePx ? TV.piecePx('hex_sand') : null; HX.TX = art && TV.piecePx ? HX.texOf() : null;
    var W = HX.W * TSZ, H = HX.H * TSZ, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var cx = cv.getContext('2d'), img = cx.createImageData(W, H), px = img.data, fn = lv === 1 ? HX.ground : lv === 2 ? HX.gambling : HX.third, S = RP('stone');
    var doors = lv === 1 ? [].concat(HX.DOORS.back, HX.DOORS.front, HX.DOORS.east, HX.DOORS.west) : [];
    for (var Y = 0; Y < H; Y++) for (var X = 0; X < W; X++) {
      var x = FX(X + 0.5), z = FZ(Y + 0.5), c = null;
      if (inShell(lv, x, z)) c = fn(x, z, X, Y);
      else if (doors.some(function (q) { return X >= q[0] * TSZ && X < (q[0] + 1) * TSZ && Y >= q[1] * TSZ && Y < (q[1] + 1) * TSZ; })) c = pick(S, 0.38 + NZ.vnoise(X * 0.1, Y * 0.1, 931) * 0.2 - ((X % 24) < 1 || (Y % 24) < 1 ? 0.15 : 0), X, Y); // (a doorway's sill)
      if (!c) continue;
      var o = (Y * W + X) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    return (HX.pics[key] = cv);
  };

  // ---------------------------------------------------------------- the standing pieces: a footprint in feet (convex), `h` px tall, its top raised by h and its south face
  // under it, both coloured by code; cut into strips a square wide, each sorted by its own south edge (or `depth` for the shell's walls: the back behind everything,
  // the front stub over it all)
  HX.WALLH = 56; HX.STUB = 8; HX.INWALL = 44;
  function block(foot, h, top, faceC, o) {
    o = o || {};
    var P = foot.map(function (p) { return [PX(p[0]), PY(p[1])]; }), xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; });
    var x0 = Math.floor(Math.min.apply(null, xs)), x1 = Math.ceil(Math.max.apply(null, xs)), yTop = Math.floor(Math.min.apply(null, ys)) - h, yBot = Math.ceil(Math.max.apply(null, ys));
    var W = Math.max(1, x1 - x0), H = Math.max(1, yBot - yTop), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var cx = cv.getContext('2d'), img = cx.createImageData(W, H), px = img.data, ybs = [];
    for (var X = x0; X < x1; X++) {
      var xc = X + 0.5, lo = 1e9, hi = -1e9;
      for (var i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; if ((a[0] <= xc && b[0] > xc) || (b[0] <= xc && a[0] > xc)) { var yy = a[1] + (xc - a[0]) * (b[1] - a[1]) / (b[0] - a[0]); lo = Math.min(lo, yy); hi = Math.max(hi, yy); } }
      ybs.push(hi > lo ? hi : null); if (!(hi > lo)) continue;
      var ya = Math.round(lo), yb = Math.round(hi);
      for (var Y = ya - h; Y < yb; Y++) {
        var c = Y < yb - h ? top(FX(xc), FZ(Y + h + 0.5), X, Y, (Y + h - ya) / Math.max(1, yb - ya)) : faceC ? faceC(Y - (yb - h), h, X, Y, FX(xc)) : null;
        if (!c) continue;
        var q = ((Y - yTop) * W + (X - x0)) * 4; if (q < 0 || q >= px.length) continue; px[q] = c[0]; px[q + 1] = c[1]; px[q + 2] = c[2]; px[q + 3] = 255;
      }
    }
    cx.putImageData(img, 0, 0);
    var strips = [];
    for (var col = Math.floor(x0 / TSZ); col * TSZ < x1; col++) {
      var s0 = Math.max(x0, col * TSZ), s1 = Math.min(x1, (col + 1) * TSZ), yb2 = -1e9;
      for (var X2 = s0; X2 < s1; X2++) { var v = ybs[X2 - x0]; if (v != null) yb2 = Math.max(yb2, v); }
      if (yb2 < -1e8) continue;
      strips.push({ s0: s0, s1: s1, depth: o.depth != null ? o.depth : yb2 / TSZ });
    }
    return { cv: cv, x0: x0, y0: yTop, strips: strips, tag: o.tag || null };
  }
  HX.block = block;
  // a thing that stands, the art desk's (ART-115 HEAD 3 and 4, hextiles_p1) where it has come: its drawing stood on its footprint's south edge, centred across it, and
  // cut in strips a square wide as a block is; null while the atlas is on its way or with &tiles=code (the block drawn instead -- the code kept as the fallback).
  // The footprint stays the code's, so the squares it closes are as they were
  function artPiece(name, foot, o) {
    if (!HX.artOn) return null;
    var p = TV.piece(name, 0, 'hex'); if (!p) return null;
    o = o || {};
    var xs = foot.map(function (q) { return PX(q[0]); }), ys = foot.map(function (q) { return PY(q[1]); });
    var cxp = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, yS = Math.max.apply(null, ys);
    var x0 = Math.round(cxp - p.ax), y0 = Math.round(yS - p.ay), cv = document.createElement('canvas'); cv.width = p.w; cv.height = p.h;
    var cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false; cx.drawImage(p.im, p.x, p.y, p.w, p.h, 0, 0, p.w, p.h);
    var strips = [];
    for (var col = Math.floor(x0 / TSZ); col * TSZ < x0 + p.w; col++) strips.push({ s0: Math.max(x0, col * TSZ), s1: Math.min(x0 + p.w, (col + 1) * TSZ), depth: o.depth != null ? o.depth : yS / TSZ });
    return { cv: cv, x0: x0, y0: y0, strips: strips, tag: o.tag || null, art: name };
  }
  HX.artPiece = artPiece;
  // the colours of the things that stand
  function wood(t) { return function (x, z, X, Y) { return pick(RP('leather'), t + NZ.vnoise(X * 0.2, Y * 0.2, 941) * 0.1 - ((X + Y) % 11 === 0 ? 0.08 : 0), X, Y); }; }
  function woodFace(t) { return function (j, h, X, Y) { return pick(RP('leather'), t - (X % 8 === 0 ? 0.12 : 0) - (j > h - 2 ? 0.14 : 0) + (j < 1 ? 0.12 : 0), X, Y); }; }
  function logFace(j, h, X, Y) { var L = RP('leather'); if (j < 2) return L[4]; return pick(L, 0.24 - ((j | 0) % 7 === 0 ? 0.14 : 0) + ((j | 0) % 7 === 1 ? 0.1 : 0) + NZ.vnoise(X * 0.15, j * 0.3, 942) * 0.08 - (j > h - 3 ? 0.14 : 0), X, Y); } // (the logs laid in courses, lit along the top: the diagonal his eye asked for)
  function logTop(x, z, X, Y) { var L = RP('leather'); return pick(L, 0.12 + NZ.vnoise(X * 0.3, Y * 0.3, 943) * 0.1, X, Y); }
  function stoneTop(x, z, X, Y) { var S = RP('stone'); return pick(S, 0.45 + NZ.vnoise(X * 0.2, Y * 0.2, 944) * 0.15, X, Y); }
  HX.pieces = function (lv) {
    RAMP = {}; HX.artOn = !!(TV.artOn && TV.artOn());
    var out = [], S = RP('stone'), L = RP('leather'), Gd = RP('gold'), Sv = RP('silver'), Rd = RP('red'), Mo = RP('moss'), Bl = RP('blue');
    // the shell: each face a band from the inner line to the outer; the back faces (NNW, NNE, E, W) a full wall, their logs' south face seen; the front (SSE, SSW) a stub
    var V = [0, 1, 2, 3, 4, 5].map(function (i) { var a = Math.PI / 180 * (60 * i - 90); return [Math.cos(a), Math.sin(a)]; }); // (the vertices: N, NE, SE, S, SW, NW)
    var vIn = V.map(function (v) { return [v[0] * (G.R - G.WALL / A), v[1] * (G.R - G.WALL / A)]; }), vOut = V.map(function (v) { return [v[0] * G.R, v[1] * G.R]; });
    var cut = function (a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
    // a face from vertex i to i+1, between t0 and t1 of its length
    var band = function (i, t0, t1) { var j = (i + 1) % 6; return [cut(vOut[i], vOut[j], t0), cut(vOut[i], vOut[j], t1), cut(vIn[i], vIn[j], t1), cut(vIn[i], vIn[j], t0)]; };
    var tipT = G.CARVE / (G.R * A); // (the carved tip's share of a face: 6 ft of its 55.4 across)
    var big = lv === 3 ? 15 / G.R : 0; // (the Big Window: 15 ft each side of the north log)
    var backFace = function (window0) { return function (j, h, X, Y, x) { var up = 1 - j / h, win = window0 && Math.abs(x) / A < 15 && up > 0.2 && up < 0.9; if (win) { var mull = (Math.round(Math.abs(x) * 9.6) % 22) < 2 || Math.abs(up - 0.55) < 0.03; return mull ? L[1] : pick(Bl, 0.55 + up * 0.25 + (NZ.h2(X >> 2, Y >> 3, 945) > 0.8 ? 0.1 : 0), X, Y); } return logFace(j, h, X, Y); }; };
    // NE face (vertex 0 to 1 is N to NE: the NNE face), and the NW (vertex 5 to 0)
    var t0 = lv === 1 ? tipT : 0;
    out.push(block(band(0, t0, 1), HX.WALLH, logTop, backFace(lv === 3), { depth: -1000 }));
    out.push(block(band(5, 0, 1 - t0), HX.WALLH, logTop, backFace(lv === 3), { depth: -1000 }));
    // the E and W faces (vertex 1 to 2, 4 to 5), full height to their south ends; a gap for the ground's E and W doors
    var dT = 2 / G.R;
    if (lv === 1) { out.push(block(band(1, 0, 0.5 - dT), HX.WALLH, logTop, logFace, { depth: -1000 })); out.push(block(band(1, 0.5 + dT, 1), HX.WALLH, logTop, logFace, { depth: -1000 })); out.push(block(band(4, 0, 0.5 - dT), HX.WALLH, logTop, logFace, { depth: -1000 })); out.push(block(band(4, 0.5 + dT, 1), HX.WALLH, logTop, logFace, { depth: -1000 })); }
    else { out.push(block(band(1, 0, 1), HX.WALLH, logTop, logFace, { depth: -1000 })); out.push(block(band(4, 0, 1), HX.WALLH, logTop, logFace, { depth: -1000 })); }
    // the front: SSE (vertex 2 to 3) and SSW (3 to 4), a stub so the floor shows
    out.push(block(band(2, 0, 1 - t0), HX.STUB, logTop, logFace, { depth: 1e5 }));
    out.push(block(band(3, t0, 1), HX.STUB, logTop, logFace, { depth: 1e5 }));
    if (lv === 1) {
      // the carved tips: the north's flat wall over its double doors (the leaves drawn in its face, the great log between them), the south's a stub with the doorway open
      var zN = -ZC, zN2 = -ZC - G.WALL;
      var leaf = function (j, h, X, Y, x) { var up = 1 - j / h, ax = Math.abs(x), fr = ax > G.CARVE - 0.5 || ax < 0.45 || up > 0.86, open = up < 0.86 && ax < G.CARVE - 0.5; return fr ? Sv[3] : open ? pick(L, 0.24 + ((X % 4) === 0 ? -0.1 : 0) + (Math.abs(up - 0.4) < 0.04 ? 0.25 : 0), X, Y) : logFace(j, h, X, Y); };
      out.push(block([[-G.CARVE, zN2], [G.CARVE, zN2], [G.CARVE, zN], [-G.CARVE, zN]], HX.WALLH, logTop, leaf, { depth: -1000 }));
      [-1, 1].forEach(function (sd) { out.push(block([[sd * G.CARVE - 0.6, ZC], [sd * G.CARVE + 0.6, ZC], [sd * G.CARVE + 0.6, ZC + G.WALL], [sd * G.CARVE - 0.6, ZC + G.WALL]], HX.STUB + 6, stoneTop, function (j, h, X, Y) { return Sv[2]; }, { depth: 1e5 })); }); // (the south doorway's jambs)
    }
    // the interior logs (through every floor), a post 3 ft round, a wall's height
    HX.LOGS.forEach(function (c) { out.push((lv === 1 && artPiece('hx_post', disc(c, 1.5, 12))) || block(disc(c, 1.5, 12), lv === 1 ? HX.WALLH + 8 : HX.WALLH, function (x, z, X, Y) { var r = Math.hypot(x - c[0], z - c[1]); return pick(L, 0.2 + (Math.round(r * 6) % 2 ? 0.08 : 0), X, Y); }, function (j, h, X, Y, x) { var sd = (x - c[0]) / 1.5; return pick(L, 0.42 - sd * 0.18 - (j > h - 3 ? 0.12 : 0) + ((X % 3) === 0 ? -0.06 : 0), X, Y); })); });
    // the spirals: the steps winding round the newel, and the newel itself
    HX.SPIRALS.forEach(function (c) {
      var sp = artPiece('hx_spiral', disc(c, 3, 16)); if (sp) { out.push(sp); return; } // (the art's steps and newel in one)
      out.push(block(disc(c, 3, 16), 8, function (x, z, X, Y) { var dx = x - c[0], dz = z - c[1], r = Math.hypot(dx, dz), a = (Math.atan2(dz, dx) / (Math.PI * 2) + 1) % 1, step = Math.floor(a * 12); if (r > 2.7) return L[1]; if (r < 0.6) return L[0]; return pick(L, 0.25 + step / 12 * 0.5 - ((a * 12) % 1 < 0.1 ? 0.15 : 0), X, Y); }, woodFace(0.3)));
      out.push(block(disc(c, 0.55, 8), 30, function (x, z, X, Y) { return Gd[2]; }, function (j, h, X, Y) { return pick(L, 0.3 - (j > h - 2 ? 0.1 : 0), X, Y); }));
    });
    if (lv === 1) {
      // the bars: the counter's worn top, the planks of its face; the shelves behind the south pair, the Wall of Boxes above the SSE's (27 iron boxes, nine across)
      HX.BARS.forEach(function (b) {
        out.push(block(rect(b.c, b.len, b.d, b.a), TV.BLOCK.K, function (x, z, X, Y, v) { return pick(S, (X + Y * 2) % 10 === 0 ? 0.3 : 0.62 + NZ.vnoise(X * 0.1, Y * 0.1, 946) * 0.12, X, Y); }, function (j, h, X, Y) { return pick(Rd, (X % 8 === 0 ? 0.15 : 0.45) - (j > h - 3 ? 0.15 : 0), X, Y); }));
        if (b.shelf) out.push(block(rect(b.shelf.c, b.shelf.len, b.shelf.d, b.a), b.boxes ? 22 : 14, b.boxes ? function (x, z, X, Y) { var u = (x - b.shelf.c[0]) * Math.cos(b.a) + (z - b.shelf.c[1]) * Math.sin(b.a), k = Math.floor((u / b.shelf.len + 0.5) * 9), fr = ((u / b.shelf.len + 0.5) * 9) % 1; return fr < 0.08 || fr > 0.92 ? S[0] : (NZ.h2(k, 1, 947) > 0.86 && (X + Y) % 5 === 0) ? Sv[4] : pick(S, 0.3 + (fr > 0.4 && fr < 0.6 ? 0.12 : 0), X, Y); } : wood(0.3), function (j, h, X, Y) { return pick(L, 0.2 - (j % 6 === 0 ? 0.08 : 0), X, Y); }));
      });
      // the tables in the north notches: boards on trestles
      HX.BOARDS.forEach(function (c) { out.push(artPiece('hx_trestle', rect(c, 5, 3, 0)) || block(rect(c, 5, 3, 0), 10, function (x, z, X, Y) { return pick(L, 0.5 + ((Y % 8) === 0 ? -0.15 : 0) + NZ.vnoise(X * 0.2, Y * 0.2, 948) * 0.1, X, Y); }, woodFace(0.3))); });
      // the guard stations at the north door, the contraband box on the east one
      HX.STATIONS.forEach(function (st) { out.push(block(seg(st.a, st.b, 1.1), 30, wood(0.36), woodFace(0.34))); if (st.box) out.push(artPiece('hx_box', rect([st.b[0] - 1.6, st.b[1] - 1], 2.2, 1.6, 0)) || block(rect([st.b[0] - 1.6, st.b[1] - 1], 2.2, 1.6, 0), 10, function (x, z, X, Y) { return (X + Y) % 6 === 0 ? Sv[4] : pick(S, 0.25, X, Y); }, function (j, h, X, Y) { return pick(S, 0.18, X, Y); })); });
      // Mama's premises and the concession: their walls (the sealed door, the hatches shut), the concession's divider
      var wallTop = function (x, z, X, Y) { return pick(L, 0.16 + NZ.vnoise(X * 0.2, Y * 0.2, 949) * 0.08, X, Y); };
      // (a hatch: open since 10-28 -- Higertha in Mama's, the concession's hand in its own -- the one behind it seen through the gap over a board sill, its shutters folded back
      // either side; his "we need Higertha in the window on mama's side and consider a concessions vendor")
      var plaster = function (hatch) { return function (j, h, X, Y, x) { var up = 1 - j / h; if (hatch && hatch(x) && up > 0.3 && up < 0.94) { var sill = up < 0.36, frame = up > 0.88 || !hatch(x - 0.9) || !hatch(x + 0.9); /* (a serving window up to the lintel: the one behind it seen face and all -- 10-28 later) */ return sill ? pick(L, 0.62, X, Y) : frame ? L[0] : null; } return logFace(j, h, X, Y); }; };
      [[HX.MAMA, function (x) { return x > 25.0 && x < 30.2; }], [HX.CONC, function (x) { return x < -22.8 && x > -28.0; }]].forEach(function (pr) { // (Mama's hatch west of the log at 34.6 since 10-28: Higertha behind it, the post clear)
        var P = pr[0]; [0, 1, 2].forEach(function (i) { out.push(block(seg(P[i], P[i + 1], 0.8), HX.INWALL, wallTop, plaster(i === 1 ? pr[1] : null))); });
      });
      out.push(block(seg([-45.0, -38.0], [-35.0, -20.7], 0.6), HX.INWALL, wallTop, plaster(null)));
      // Korvin's slate: a board on legs, its face chalked with the card
      out.push(artPiece('hx_slate', rect([7, 40], 4, 0.6, 0)) || block(rect([7, 40], 4, 0.6, 0), 30, wood(0.3), function (j, h, X, Y, x) { var up = 1 - j / h; if (up < 0.18) return (X % 6) < 2 ? L[1] : null; if (up > 0.95) return L[2]; var sl = pick(S, 0.08, X, Y), chalk = (Math.round(up * 30) % 5 === 0 && NZ.h2(X >> 1, Math.round(up * 30), 951) > 0.35) || ((X % 9) === 0 && up > 0.3 && up < 0.8 && NZ.h2(X, 7, 952) > 0.5); return chalk ? RP('bone')[2] : sl; }));
    }
    if (lv === 2) {
      // the rail round the opening: the straight runs and the bow, a timber rail on its balusters
      var rv = [0, 1, 2, 3, 4, 5].map(function (i) { var a = Math.PI / 180 * (60 * i - 90); return [Math.cos(a) * G.RAIL, Math.sin(a) * G.RAIL]; });
      var runs = [[[17.32, -30], rv[1]], [rv[1], rv[2]], [rv[2], rv[3]], [rv[3], rv[4]], [rv[4], rv[5]], [rv[5], [-17.32, -30]]];
      var a0 = Math.atan2(-30 - HX.BOW.c[1], -17.32), a1 = Math.atan2(-30 - HX.BOW.c[1], 17.32), arc = [];
      for (var k = 0; k <= 10; k++) { var t = a0 + (a1 - a0) * k / 10; arc.push([HX.BOW.c[0] + Math.cos(t) * HX.BOW.r, HX.BOW.c[1] + Math.sin(t) * HX.BOW.r]); }
      for (k = 0; k < 10; k++) runs.push([arc[k], arc[k + 1]]);
      runs.forEach(function (r) { out.push(block(seg(r[0], r[1], 0.6), 14, function (x, z, X, Y) { return pick(L, 0.55, X, Y); }, function (j, h, X, Y) { return j < 2 ? L[3] : (X % 5) < 2 ? pick(L, 0.35, X, Y) : null; })); });
      // the six felt tables, their stools; the owners' benches; Vair's empty chair
      HX.FELT.forEach(function (c) {
        out.push(artPiece('hx_felt', disc(c, 2.6, 16)) || block(disc(c, 2.6, 16), 12, function (x, z, X, Y) { var r = Math.hypot(x - c[0], z - c[1]); return r > 2.2 ? pick(L, 0.4, X, Y) : pick(Mo, 0.25 + NZ.vnoise(X * 0.2, Y * 0.2, 953) * 0.1, X, Y); }, woodFace(0.3)));
        [0, 1, 2, 3].forEach(function (i) { var a = i / 4 * Math.PI * 2 + 0.4; var st0 = disc([c[0] + Math.cos(a) * 3.6, c[1] + Math.sin(a) * 3.6], 0.7, 8); out.push(artPiece('hx_stool', st0) || block(st0, 8, wood(0.45), woodFace(0.3))); });
      });
      HX.BENCHES.forEach(function (P) { out.push(block(P, 10, function (x, z, X, Y) { return pick(RP('violet'), 0.35 + NZ.vnoise(X * 0.2, Y * 0.2, 954) * 0.1, X, Y); }, woodFace(0.25))); });
      var ch = HX.mid(HX.CHAIR[0], HX.CHAIR[1]);
      out.push(artPiece('hx_chair_fine', rect([ch[0], ch[1]], 2, 2, 0)) || block(rect([ch[0], ch[1]], 2, 2, 0), 12, function (x, z, X, Y, v) { return v < 0.3 ? pick(L, 0.2, X, Y) : pick(Rd, 0.35, X, Y); }, woodFace(0.3)));
    }
    if (lv === 3) {
      // the midwalls (a 6 ft door each), the secret walls behind the office and the Armory, the lounge's bow over the sand, the shut ring's room fronts
      var inTop = function (x, z, X, Y) { return pick(L, 0.16 + NZ.vnoise(X * 0.2, Y * 0.2, 955) * 0.08, X, Y); };
      var inFace = logFace; // (the inner walls in the same logs as the shell: plaster read as glare)
      [1, -1].forEach(function (sd) {
        var m0 = [HX.MIDWALL[0][0] * sd, HX.MIDWALL[0][1]], m1 = [HX.MIDWALL[1][0] * sd, HX.MIDWALL[1][1]], Lm = Math.hypot(m1[0] - m0[0], m1[1] - m0[1]), dh = 3 / Lm;
        out.push(block(seg(m0, cut(m0, m1, HX.MIDDOOR - dh), 0.8), HX.INWALL, inTop, inFace));
        out.push(block(seg(cut(m0, m1, HX.MIDDOOR + dh), m1, 0.8), HX.INWALL, inTop, inFace));
        out.push(block(seg([HX.SECRET[0][0] * sd, HX.SECRET[0][1]], [HX.SECRET[1][0] * sd, HX.SECRET[1][1]], 0.8), HX.INWALL, inTop, inFace));
      });
      var a2 = Math.atan2(-30 - HX.BOW.c[1], -17.32), a3 = Math.atan2(-30 - HX.BOW.c[1], 17.32), arc2 = [];
      for (var k2 = 0; k2 <= 10; k2++) { var t2 = a2 + (a3 - a2) * k2 / 10; arc2.push([HX.BOW.c[0] + Math.cos(t2) * HX.BOW.r, HX.BOW.c[1] + Math.sin(t2) * HX.BOW.r]); }
      for (k2 = 0; k2 < 10; k2++) out.push(block(seg(arc2[k2], arc2[k2 + 1], 0.6), 14, function (x, z, X, Y) { return pick(L, 0.55, X, Y); }, function (j, h, X, Y) { return j < 2 ? L[3] : (X % 5) < 2 ? pick(L, 0.35, X, Y) : null; }));
      // the rooms' fronts on the shut ring (E, SSE, SSW, W): a wall's top
      var bv = [0, 1, 2, 3, 4, 5].map(function (i) { var a = Math.PI / 180 * (60 * i - 90); return [Math.cos(a) * G.BAL, Math.sin(a) * G.BAL]; });
      [[1, 2], [2, 3], [3, 4], [4, 5]].forEach(function (e) { out.push(block(seg(bv[e[0]], bv[e[1]], 0.8), 30, inTop, inFace)); });
      // the furniture (the seat's draft): the council's long table and its chairs, Urtusk's desk and strongbox, the Armory's racks and chest
      var TH = HX.THIRD;
      out.push(artPiece('hx_table_council', TH.table) || block(TH.table, 12, function (x, z, X, Y) { return pick(L, 0.32 + ((X % 14) === 0 ? -0.1 : 0) + NZ.vnoise(X * 0.2, Y * 0.2, 956) * 0.1, X, Y); }, woodFace(0.22)));
      for (var cxh = -7.5; cxh <= 7.5; cxh += 3.75) [-52, -46].forEach(function (cz) { out.push(artPiece('hx_chair_council', rect([cxh, cz], 1.6, 1.6, 0)) || block(rect([cxh, cz], 1.6, 1.6, 0), 12, function (x, z, X, Y, v) { return v < 0.35 ? pick(L, 0.2, X, Y) : pick(Rd, 0.32, X, Y); }, woodFace(0.25))); });
      out.push(artPiece('hx_desk', TH.desk) || block(TH.desk, 12, wood(0.34), woodFace(0.24)));
      out.push(artPiece('hx_strongbox', TH.strongbox) || block(TH.strongbox, 12, function (x, z, X, Y) { return (X + Y) % 7 === 0 ? Sv[4] : pick(S, 0.22, X, Y); }, function (j, h, X, Y) { return (X % 6) === 0 ? Sv[3] : pick(S, 0.15, X, Y); }));
      TH.racks.forEach(function (P) { out.push(block(P, 30, wood(0.3), function (j, h, X, Y) { var up = 1 - j / h; return (X % 7) < 2 && up > 0.25 ? (up > 0.85 ? Sv[4] : pick(L, 0.45, X, Y)) : (up < 0.2 ? pick(L, 0.25, X, Y) : null); })); });
      out.push(artPiece('hx_chest', TH.chest) || block(TH.chest, 12, function (x, z, X, Y) { return (Y % 7) === 0 ? Sv[3] : pick(L, 0.28, X, Y); }, function (j, h, X, Y) { return (X % 8) === 0 ? Sv[3] : pick(L, 0.22, X, Y); }));
    }
    return out;
  };
  // the pieces on the loaded map: the topview's own stand props let go (every square here is drawn by the picture or a piece), each strip a prop sorted with the figures
  HX.dress = function (m, lv) {
    if (!m || !m.top) return;
    m.top.props = [];
    var made = HX.pieces(lv);
    m.props = (m.props || []).filter(function (p) { return !p.hexPiece; });
    made.forEach(function (pc) { pc.strips.forEach(function (st) { m.props.push({ hexPiece: true, depth: st.depth, draw: stripDraw(pc, st.s0, st.s1) }); }); });
    m.hexPieces = made; m.sorted = null;
  };
  function stripDraw(pc, s0, s1) {
    return function (ctx) {
      var z = iso.inWorld ? 1 : iso.zoom, a = iso.toScreen(s0, pc.y0);
      ctx.drawImage(pc.cv, s0 - pc.x0, 0, s1 - s0, pc.cv.height, a.x, a.y, (s1 - s0) * z, pc.cv.height * z);
    };
  }

  // ---------------------------------------------------------------- in and out, and between the floors
  // in at a door from the town's floor: the street set aside (as js/town.js T.goIn sets it), the ground floor laid, the party just inside the door it used
  HX.goIn = function* (B, side) {
    var R = D.roam, R0 = B.roam, t = R0.token;
    if (!B.townAway) B.townAway = { map: B.map, def: R.def, at: [t.x, t.y], fw: R0.fw.slice(), folk: B.units.filter(function (u) { return u.npc; }) };
    B.townAway.hexSide = side;
    var en = HX.ENTRY[side] || HX.ENTRY.front;
    HX.lay(B, 1, en[0], en[1]);
    D.music('hex');
    B.card(R.wrap(R.def.hello), 360);
    D.sfx('popup'); yield 10;
  };
  // a floor laid: its people stood, the party on `at` facing `face`
  HX.lay = function (B, lv, at, face) {
    var R = D.roam, R0 = B.roam, t = R0.token, def = HX.def(lv, R0);
    B.units = B.units.filter(function (u) { return !u.npc; });
    R.def = def; D.MAPS[def.key] = def; B.map = D.iso.load(def); HX.dress(B.map, lv);
    t.x = at[0]; t.y = at[1]; t.tween = null; R0.fw = face.slice(); t.facing = D.spr.facingFor(face[0], face[1]); t.anim = 'idle'; t.animT = B.t; R0.path = null;
    var kinds = [];
    def.people.forEach(function (p, i) {
      var N = ((DS.DATA || {}).npcs || {})[p.id] || {}, kind = D.FOES[p.kind] ? p.kind : 'bandit';
      var u = B.makeFoe({ id: 'hexfolk' + i, kind: kind, at: p.at.slice(), side: 'party', ally: true });
      u.name = N.name || p.name || p.id; u.look = true; u.npc = p.id; u.attacks = {}; u.multi = 1; u.hp = u.maxhp = 4; u.lvl = 1;
      if (p.sheet && D.SHEETS && D.SHEETS[p.sheet]) u.sheet = p.sheet;
      // one of the four for hire in their own figure, as the town dresses them (10-28, his "Barley and Lymen using drawn characters instead of sprites in the hex": js/save.js
      // SV.look -- js/company.js T.people), the register's stand-in only where the look has no sheet
      var lkH = p.hire && D.save && D.save.look ? D.save.look(p.hire, null, null) : null; if (lkH && lkH.sheet && D.SHEETS && D.SHEETS[lkH.sheet]) u.sheet = lkH.sheet;
      u.facing = D.spr.facingFor(p.face[0], p.face[1]); u.anim = 'idle'; u.animT = 0;
      if (D.counter) D.counter.dress(u, p.fig || p.id); // (one with a figure of their own wears it: Korvin's, js/counter.js C.FIG)
      B.units.push(u); if (u.sheet && kinds.indexOf(u.sheet) < 0) kinds.push(u.sheet);
    });
    if (D.spr.prefetch) D.spr.prefetch(kinds);
    R.famPlace(B, true); B.cache = null; B.exits = []; D.grid.setup(B.map, B.units); B.focus(t);
    return def;
  };
  // a spiral: up from the ground, down from the third; from the second, DOWN or UP (up was shut till 10-28 -- his 10-22 "currently turned off for player access" -- and
  // opened on his 10-28 word below: the lounge, the office and the Armory walked; the rooms round the balcony stay Warda's)
  HX.stair = function* (B, q) {
    var R = D.roam, R0 = B.roam, lv = R.def.hexIn, to = lv === 1 ? 2 : lv - 1, k = HX.spiralSq().map(function (s) { return s[0] + ',' + s[1]; }).indexOf(q[0] + ',' + q[1]);
    if (lv === 2) { // (UP open since 10-28, Griz: "there's no reason the player can't go up to the town meeting and urtusk office 3rd floor"; no outside stairs -- "we don't need
      // to add the outside stairs unless we use the hex in a combat map, since we're not really adding those services to the game")
      var a = yield { prompt: { who: R0.token, title: 'THE SPIRAL', lines: R.wrap(['The spiral winds down to the sand and on up to the third floor.']), opts: [{ label: 'DOWN', value: 0 }, { label: 'UP', value: 1 }, { label: 'STAY', value: 2 }] } };
      if (a === 1) to = 3; else if (a !== 0) { yield 20; return; }
    }
    B.card(['{y}The Hex{/} -- ' + HX.SUB[to] + '.'], 60); D.sfx('stairs'); yield 20;
    var sp = HX.spiralSq()[Math.max(0, k)], rows = HX.rows(to), at = HX.near(rows, [sp[0], sp[1] + 1]) || HX.near(rows, sp);
    HX.lay(B, to, at, [0, 1]);
    B.card(R.wrap(R.def.hello), 300);
  };
  // out a door to the street: the square outside that door on the town's floor, facing away from the Hex
  HX.SIDEFACE = { front: [0, 1], back: [0, -1], east: [1, 0], west: [-1, 0] };
  HX.goOut = function* (B, side, goOut0) {
    var o = B.townAway; if (!o) return;
    var M = o.def.marks || {}, sq = side === 'front' ? (M.hexFront || [])[0] : side === 'back' ? (M.hexBack || [])[0] : side === 'east' ? M.hexEast : M.hexWest;
    if (sq) o.at = sq.slice();
    var f = HX.SIDEFACE[side] || [0, 1]; o.fw = [-f[0], -f[1]]; // (T.goOut faces the party back the way it came in: the reverse of o.fw)
    D.music(o.def.music || 'town');
    yield* goOut0(B);
  };
  HX.sideOf = function (x, y) { var hit = null; Object.keys(HX.DOORS).forEach(function (k) { if (HX.DOORS[k].some(function (q) { return q[0] === x && q[1] === y; })) hit = k; }); return hit; };

  // ---------------------------------------------------------------- the town's floor: the Hex's four doors (the tip doors at marks.hexFront / hexBack; the east and west at
  // their faces' middles) a USE, in
  var floor0 = T.floor;
  T.floor = function (q, flags) {
    var def = floor0.apply(this, arguments), M = def.marks || {}, inW = function (p) { return !!p && p[0] >= 0 && p[1] >= 0 && p[0] < def.w && p[1] < def.h; };
    var hx = def.hexagon, side = function (dir) { // (the open square just outside the face's middle, straight out east or west)
      if (!hx) return null; var y = Math.floor(hx.y), x0 = hx.x + dir * hx.r * A;
      for (var k = 0; k < 4; k++) { var x = Math.floor(x0 + dir * (0.5 + k)), r = def.rows[y]; if (r && '.,='.indexOf(r.charAt(x)) >= 0) return [x, y]; }
      return null;
    };
    M.hexEast = side(1); M.hexWest = side(-1);
    [['front', M.hexFront], ['back', M.hexBack], ['east', M.hexEast ? [M.hexEast] : []], ['west', M.hexWest ? [M.hexWest] : []]].forEach(function (p) {
      (p[1] || []).forEach(function (sq) { if (inW(sq)) def.src8.triggers.push({ id: 'hex:' + p[0], on: 'use', rect: [sq[0], sq[1], 1, 1], town: 'door', door: { id: 'hex:' + p[0], name: 'The Hex' } }); });
    });
    return def;
  };
  var fire0 = T.fire, goOutT = T.goOut;
  T.fire = function* (B, trig, at) {
    var def = D.roam && D.roam.def;
    if (trig.town === 'door' && /^hex:/.test(trig.id || '')) { yield* HX.goIn(B, trig.id.slice(4)); return; }
    if (trig.town === 'hex') { yield* HX.fire(B, trig); return; }
    if (trig.town === 'talk' && def && def.hexIn && HX.SCENES[trig.npc]) { yield* HX.SCENES[trig.npc](B, trig); return; }
    yield* fire0.apply(this, arguments);
  };
  T.goOut = function* (B) {
    var def = D.roam && D.roam.def; if (!def || !def.hexIn) { yield* goOutT.apply(this, arguments); return; }
    var t = B.roam.token, sd = HX.sideOf(t.x, t.y);
    if (sd) yield* HX.goOut(B, sd, goOutT);
  };
  HX.fire = function* (B, trig) {
    if (trig.sign) { B.card(D.roam.wrap([trig.sign]), 360); D.sfx('popup'); yield 20; return; }
    if (trig.stair) { yield* HX.stair(B, trig.rect.slice(0, 2)); return; }
  };


  // ---------------------------------------------------------------- the first game's scripted people (js/events.js): Warda, Vair's chair, Korvin's slate
  HX.SCENES = {
    warda: function* (B, trig) { var R = D.roam, u = B.units.filter(function (x) { return x.npc === 'warda'; })[0], t = B.roam.token; if (u) u.facing = D.spr.facingFor(t.x - u.x, t.y - u.y); B.card(R.wrap(['{y}Warda{/}', R.def.hexIn === 3 ? HX.LINES.warda3 : D.counter.L('hex.warda')]), 360); D.sfx('popup'); yield 20; }, // (on the third floor, the stairs open: her line of its rooms)
    vairseat: function* (B) { B.card(D.roam.wrap(['{y}An empty chair{/}', D.counter.L('hex.vairseat')]), 360); D.sfx('popup'); yield 20; },
    korvinSlate: function* (B) { var u = B.units.filter(function (x) { return x.npc === 'korvinSlate'; })[0], t = B.roam.token; if (u && !u.holdFacing) u.facing = D.spr.facingFor(t.x - u.x, t.y - u.y); yield* HX.card(B); } // (drawn all round since 10-28, ART-121: he turns to the one at his slate)
  };
  // THE CARD (js/events.js CARD: the first game's five, each opening the next; stake in, the win out)
  HX.CARD = [
    { id: 'brawl', label: 'BRAWL IN THE SMALL SAND', foe: 'brawler', stake: 0, win: 4, need: null },
    { id: 'freeman', label: 'FREEMAN CHALLENGE', foe: 'stablefighter', stake: 5, win: 10, need: 'hex:brawl' },
    { id: 'card', label: 'THE CARD: A HIRED BLADE', foe: 'merc', stake: 5, win: 10, need: 'hex:freeman' },
    { id: 'talmok', label: 'TALMOK, THE CHAMPION', foe: 'talmok', stake: 5, win: 10, need: 'hex:card' },
    { id: 'festival', label: 'FESTIVAL: A VISITING BARBARIAN', foe: 'berserker', stake: 5, win: 10, need: 'hex:talmok' }
  ];
  HX.lead = function (B) { var H = D.house; if (H && H.playing && H.cur && H.cur.lead) return H.cur.lead; var t = B.roam.token; return String((t.src && (t.src.key || t.src.id)) || t.id || '').toLowerCase(); };
  // Korvin's screen: the slate, who takes the sand, the stake (or the crowd's five), FIGHT or the other way; then the bout, then his word on it -- on his portrait
  // (ART-95, pt_korvin) with its faces: attentive at the slate, counting the stake into the ledger, skeptical at a stranger's empty purse, welcoming or concerned after
  HX.card = function* (B) {
    var C = D.counter, L = C.L, pickR = null;
    var talk = function* (script) { var res = null, sc = new C.Counter(B, { id: C.PT.korvin ? 'korvin' : 'korvinSlate', name: 'Korvin', place: 'The Hex', what: 'the slate', script: function (s) { return (function* () { res = yield* script(s); })(); } }); D.push(sc); while (!sc.done) yield 1; return res; };
    pickR = yield* talk(function* (sc) {
      var st = sc.st, f = st.flags; f.heardHex = 1;
      var open = HX.CARD.filter(function (c) { return !c.need || f[c.need]; });
      var a = yield sc.ask(L('hex.korvin'), open.map(function (c) { return (f['hex:' + c.id] ? '* ' : '') + c.label + ' -- ' + (c.stake ? c.stake + ' IN' : 'FLOOR'); }).concat(['LEAVE']), 'attentive');
      if (a == null || a >= open.length) return null;
      var c = open[a], able = B.roam.members.filter(function (u) { return u.hp > 0 && !u.dead && u.src; });
      if (!able.length) { yield sc.say(L('hex.nobody'), 'concerned'); return null; }
      var who = able[0];
      if (able.length > 1) { var w = yield sc.ask('WHO TAKES THE SAND?', able.map(function (u) { return u.name + ' L' + (u.src.lvl || u.lvl) + ' ' + u.hp + '/' + u.maxhp; }).concat(['NOT NOW']), 'attentive'); if (w == null || w >= able.length) return null; who = able[w]; }
      var fronted = false, paid = false;
      if (c.stake) { if (st.silver() >= c.stake) { st.silver(-c.stake); D.sfx('coin'); paid = true; } else { fronted = true; yield sc.say(L(HX.lead(B) === 'lymen' ? 'hex.frontedLymen' : 'hex.fronted'), 'skeptical'); } }
      var simple0 = !!D.simple && D.simple.on(), how = yield sc.ask(L('hex.intro.' + c.id, { name: who.name }), ['FIGHT', simple0 ? 'ON THE GRID' : 'SIMPLE'], paid ? 'work' : 'attentive');
      return { c: c, u: who, fronted: fronted, simple: how === 1 ? !simple0 : simple0 };
    });
    if (!pickR) return;
    var res = yield* HX.bout(B, pickR);
    yield* talk(function* (sc) { var lines = HX.settle(B, pickR, res); for (var i = 0; i < lines.length; i++) yield sc.say(lines[i], i ? null : res === 'won' ? 'welcoming' : 'concerned'); });
    if (res === 'lost') yield* HX.toDavos(B, pickR.u);
  };
  // a bout lost (10-28 later, Griz: "kick the party to krenn if a fighter falls (out of the hex and at his shop door - but already serviced)"): the one who fell stitched to half,
  // as Davos stitches a fallen hero for his five (js/counter.js C.leech) -- here on the house, the sand's blood the mother's (hex.stitched) -- and the party out of the Hex on the
  // threshold of his leech-house, facing its door (Barley's bout at his hire the same: js/company.js CO.bout)
  HX.LINES.davos = '{y}Davos Kren\'s door{/}: out of the Hex with {name}, stitched and standing ({hp}/{max}).';
  HX.toDavos = function* (B, u) {
    if (u) { u.ko = false; u.dead = false; u.hp = Math.max(u.hp, Math.max(1, Math.floor(u.maxhp / 2))); if (u.src) { u.src.ko = false; u.src.hp = u.hp; } }
    var o = B.townAway, dq = o && o.def && o.def.marks && o.def.marks.doors && o.def.marks.doors['leech:davos'];
    if (o && dq) { // (the test door, no town under the Hex: stitched where they stand)
      o.at = dq.slice(); o.fw = [0, 1]; // (T.goOut faces the party back the way it came in, the reverse of o.fw: north, at his door)
      D.music(o.def.music || 'town');
      yield* goOutT(B);
    }
    yield* HX.davosSays(B, u, !!(o && dq));
    if (o && dq) B.card(D.roam.wrap([HX.LINES.davos.replace('{name}', u ? u.name : 'the one who fell').replace('{hp}', u ? u.hp : '').replace('{max}', u ? u.maxhp : '')]), 300);
  };
  // the stitching said on Davos Kren's own face (10-29, Griz: "Davos Krenn stitches is said while the first guy's image is still up - seems it should show Krenn when it
  // delivers the stitching line"): no longer the last of Korvin's words (HX.settle) or after Barley's (js/company.js CO.bout), but its own screen, on pt_davos (js/counter.js C.PT)
  HX.davosSays = function* (B, u, atDoor) {
    var C = D.counter, sc = new C.Counter(B, { id: 'davos', name: 'Davos Kren', place: atDoor ? 'Davos Kren\'s leech-house' : 'The Hex', what: 'the fight-night chair',
      script: function (s) { return (function* () { yield s.say(C.L('hex.stitched', { name: u ? u.name : 'the one who fell' })); })(); } });
    D.push(sc); while (!sc.done) yield 1;
  };

  // ---------------------------------------------------------------- the bout: one hero on the Hex's own sand, the rest at the rail (js/roam.js R.pullIn0's shape: the floor's sheets in, back out)
  HX.bout = function* (B, r) {
    var R = D.roam, R0 = B.roam, u0 = r.u, c = r.c, done = null, simple = !!(D.simple && r.simple);
    var fld = HX.field(simple), mates = R0.members.filter(function (u) { return u !== u0 && u.sheet; }).map(function (u) { return { sheet: u.sheet, name: u.name }; });
    var F = { id: 'hexbout', map: 'hex-sand', level: u0.src.lvl || u0.lvl, name: 'The Hex', sub: c.label.toLowerCase(), dark: false, intro: D.counter.L('hex.intro.' + c.id, { name: u0.name }),
      won: 'THE ROOM ROARS.', lost: 'DOWN ON THE SAND.', foes: [{ id: 'hx-' + c.id, kind: c.foe, at: fld.foe }], wave: null, fliers: false, hexCrowd: { mates: mates } };
    var o = Object.assign({}, R.party0, { fightDef: F, simple: simple, house: R.house(), backTo: 'the Hex', onDone: function (res) { done = res || 'out'; }, record: { fight: 'hexbout', name: 'The Hex: ' + c.label, level: F.level, simple: simple } });
    delete o.embed;
    var base0 = o.ladder ? D.save.fixture(Math.min(9, R.party0.level || 5)) : R.emb ? R.emb.save : D.save.load().data; delete o.ladder;
    o.data = JSON.parse(JSON.stringify(base0));
    o.data.party = [JSON.parse(JSON.stringify(u0.src))]; o.data.guests = [];
    o.data.inv = JSON.parse(JSON.stringify(B.inv || []));
    o.data.flags = Object.assign({}, o.data.flags || {}, R0.flags); delete o.data.flags.familiar; // (alone on the sand: no familiar)
    o.data.kills = JSON.parse(JSON.stringify(R0.kills || {})); o.data.silver = R0.silver;
    var watch = /[?&]watch\b/.test(R.q || ''), b = new D.Battle(o), e0 = b.enter;
    b.enter = function () {
      e0.apply(this, arguments);
      this.units.forEach(function (u) {
        if (u.side === 'party' && u.id === u0.id) { u.hp = Math.min(u.maxhp, u0.hp); u.slots = (u0.slots || []).slice(); u.feats = JSON.parse(JSON.stringify(u0.feats || {})); Object.assign(u.conds, R.lasting(u0.conds)); if (watch) { u.guest = true; u.classAI = true; } }
        var f = simple ? D.simple.FACE[u.side === 'party' ? 0 : 1] : [u.side === 'party' ? -1 : 1, 0]; u.facing = D.spr.facingFor(f[0], f[1]); // (the two face each other)
      });
      this.roamInv0 = R.counts(this.inv); // (the pack as the bout holds it at the start: what comes back is the change -- R.packBack)
      this.takesParty = function () { return false; }; // (no running from the sand: the first game's bouts, canRun false -- the simple fight's RUN greyed, js/simple.js)
    };
    HX.last = { b: b };
    var zoom0 = D.iso.zoom; // (the floor's zoom, put back after, as the floor's fights do: js/roam.js R.pullIn0)
    D.push(b);
    while (!done) yield 1; // (the floor waits under it)
    // the bout's play record closed with its result (10-29, the lanes desk's find in his play record: every bout read 'unfinished' -- a fight with an onDone closes its own, js/record.js P.finish)
    if (b.rec && D.rec && D.rec.finish) { try { D.rec.finish(b, done); } catch (eR) { /* (the record must never stop the way back) */ } }
    D.battle = B; D.grid.setup(B.map, B.units); D.iso.map = B.map; D.iso.zoom = zoom0;
    B.focus(R0.token); // (the camera back on the party -- 10-28, Griz: "when the fight ends the focus is up by the stairs for some reason": it stayed where the sand's camera left it)
    B.logEntries = (B.logEntries || []).concat((b.logEntries || []).map(function (e) { return { id: null, text: String(e.text || e).replace(/^(R\d+ )/, '$1[the Hex] ') }; }));
    B.log = B.logEntries.map(function (e) { return e.text; });
    // the hero as the bout left them; down, up at 1 on the house (the first game: "if (fighter.ko || fighter.hp <= 0) { fighter.ko = false; fighter.hp = 1; }")
    var bu = (b.units || []).filter(function (u) { return u.side === 'party' && u.id === u0.id; })[0];
    if (bu) {
      u0.hp = Math.max(1, Math.min(u0.maxhp, bu.hp)); u0.ko = false; u0.conds = R.lasting(bu.conds); u0.slots = (bu.slots || []).slice(); u0.feats = JSON.parse(JSON.stringify(bu.feats || {}));
      if (R.exhaustBack) { R.exhaustBack(u0, bu); if (!(u0.src && u0.src.dead)) { u0.hp = Math.max(1, u0.hp); u0.ko = false; } } // (a level of exhaustion the bout laid on, onto the sheet: js/roam.js R.exhaustBack -- up at 1 still)
      if (u0.src && bu.src && bu.src.equip) ['weapon', 'shield', 'armor'].forEach(function (k) { if (k in bu.src.equip) u0.src.equip[k] = bu.src.equip[k]; });
      if (u0.src && u0.src.equip) (bu.rustGone || []).forEach(function (id) { ['weapon', 'offhand', 'shield', 'armor'].forEach(function (k) { if (u0.src.equip[k] === id) u0.src.equip[k] = null; }); }); // (a thing the rust monster rusted through in the bout stays gone: js/monsterrules.js, RULED 10-28)
    }
    R.packBack(B, b); R.regear(B);
    D.music('hex');
    HX.last.res = done;
    return done;
  };
  // after the bout, Korvin's word on it (the first game's lines, in its order), the purse, the flags, the renown, and the XP and spoils of a won bout (the hero's alone, as the first game's solo)
  HX.settle = function (B, r, res) {
    var C = D.counter, L = C.L, R = D.roam, R0 = B.roam, st = C.state(B), f = st.flags, c = r.c, u = r.u, out = [];
    if (res === 'won') {
      st.silver(c.win); D.sfx('coin');
      var first = !f['hex:' + c.id]; f['hex:' + c.id] = 1;
      out.push(L('hex.won', { name: u.name, n: c.win }));
      var id8 = c.foe, m8 = R.mon8 ? R.mon8(id8) : null;
      if (m8) {
        window.DS.R.tally(R0.kills, [id8]);
        var pay = HX.payOne(B, u, m8.xp || 0); if (pay.length) out.push(pay.join(' '));
        var sp = R.spoils(B, [{ m: m8, id: id8 }]); if (sp && sp.length) out.push(sp.join(' '));
      }
      if (c.id === 'talmok' && first) { f.talmokBeaten = 1; out.push(L('hex.talmokDown')); out = out.concat(C.renown(st, 1, 'renown.talmok')); }
      else if (c.id === 'card' && first) out = out.concat(C.renown(st, 1, 'renown.card'));
    } else {
      out.push(L(r.fronted ? (HX.lead(B) === 'lymen' ? 'hex.lostFrontedLymen' : 'hex.lostFronted') : 'hex.lost', { name: u.name })); // (the stitching is Davos's to say: HX.toDavos)
    }
    return out;
  };
  // the XP of a won bout, to the one who fought it (js/roam.js R.pay's way, for one): in the house banked for the long rest, else paid and levelled now
  HX.payOne = function (B, u, xp) {
    var R = D.roam, R0 = B.roam; if (!(xp > 0) || !u.src) return [];
    if (R.house() && D.house && D.house.bank) { var bk = D.house.bank(xp, [u.src]); return bk.line ? [bk.line] : []; }
    var lv = u.src.lvl, fe = JSON.parse(JSON.stringify(u.src.feats || {})), sx = window.DS.R.shareXP(xp, [u.src], 0);
    if (u.src.lvl !== lv && R.relevel) { R.relevel(B, u, fe); R0.picksDue = (R0.picksDue || []).concat([u]); }
    var o = sx.each ? [sx.line] : []; if (sx.ups && sx.ups.length) { D.sfx('levelup'); o = o.concat(sx.ups); }
    return o;
  };

  // ---------------------------------------------------------------- the sand: the bout's field -- the simple fight's own lineup (js/simple.js S.fieldOpts), the Hex's sand a hexagon round
  // its middle, two tiers of boards stepping up from it and the crowd's ring above them (ground 'sand': js/iso.js)
  HX.SANDR = 4.6; HX.TIERS = [5.6, 6.6];
  HX.field = function (simple) {
    var S = D.simple, o = S ? S.fieldOpts() : { w: 16, h: 16, entry: [[10, 7]] }, w = o.w, h = o.h, C = S ? S.C : [8, 7], rows = [], hts = [];
    for (var y = 0; y < h; y++) {
      var r = '', ht = '';
      for (var x = 0; x < w; x++) {
        var d = hd(x + 0.5 - (C[0] + 0.5), (y + 0.5 - (C[1] + 0.5)));
        if (d <= HX.SANDR) { r += '.'; ht += '0'; } else if (d <= HX.TIERS[0]) { r += 'o'; ht += '1'; } else if (d <= HX.TIERS[1]) { r += 'o'; ht += '2'; } else { r += 'o'; ht += '3'; }
      }
      rows.push(r); hts.push(ht);
    }
    var hero = (S && S.PARTY && S.PARTY[1]) || o.entry[0], seat = S ? (S.seat(['brawler'])[0] || {}).at : [6, 7];
    D.MAPS['hex-sand'] = { name: 'The Hex', sub: 'the sand', step: 10, ground: 'sand', rows: rows, heights: hts, entry: [hero.slice()].concat((o.entry || []).filter(function (q) { return q !== hero; })), foes: [], wave: null };
    return { def: D.MAPS['hex-sand'], hero: hero, foe: seat || [6, 7], C: C };
  };
  // the crowd: the top tier's squares (every other, by a hash) standing the town's plain folk, the party's three at the rail nearest the hero; each facing the sand
  HX.crowd = function (B) {
    var F = B.fight, m = B.map; if (!F || !F.hexCrowd || !m) return [];
    if (F.hexCrowd.at) return F.hexCrowd.at;
    var C = (D.simple && D.simple.C) || [8, 7], folk = ['crewman', 'bandit', 'brawler', 'guard'].map(function (k) { return D.FOES[k] && D.FOES[k].sheet; }).filter(Boolean), out = [], mates = F.hexCrowd.mates || [];
    var ring = []; for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) { var d = hd(x - C[0], y - C[1]); if (d > HX.TIERS[1] && d <= HX.TIERS[1] + 1.6) ring.push([x, y, d]); }
    var hero = B.units.filter(function (u) { return u.side === 'party'; })[0];
    if (hero) ring.sort(function (a, b) { return Math.hypot(a[0] - hero.x, a[1] - hero.y) - Math.hypot(b[0] - hero.x, b[1] - hero.y); });
    ring.forEach(function (q, i) {
      if (i < mates.length) { out.push({ at: [q[0], q[1]], sheet: mates[i].sheet, mate: true }); return; }
      if (NZ.h2(q[0], q[1], 961) > 0.55 && folk.length) out.push({ at: [q[0], q[1]], sheet: folk[(q[0] * 7 + q[1] * 3) % folk.length], mate: false, ph: NZ.h2(q[0], q[1], 962) * 6.28 });
    });
    F.hexCrowd.at = out;
    if (D.spr.prefetch) D.spr.prefetch(out.map(function (p) { return p.sheet; }));
    return out;
  };
  if (D.looks && D.looks.props) {
    var props0 = D.looks.props;
    D.looks.props = function (B) {
      var r = props0.apply(this, arguments); if (!B || !B.fight || !B.fight.hexCrowd || !B.map) return r;
      var C = (D.simple && D.simple.C) || [8, 7];
      return (r || []).concat(HX.crowd(B).map(function (p) {
        return { depth: p.at[0] + p.at[1] + 0.4, gz: B.map.gz(p.at[0], p.at[1]), draw: function (ctx) {
          var gz = B.map.gz(p.at[0], p.at[1]), c = iso.center(p.at[0], p.at[1], gz), s = iso.toScreen(c.x, c.y), z = iso.inWorld ? 1 : iso.zoom, bob = p.mate ? 0 : Math.round(Math.max(0, Math.sin((B.t || 0) * 0.12 + p.ph)) * 2);
          ctx.save(); if (z !== 1) { ctx.translate(s.x, s.y); ctx.scale(z, z); ctx.translate(-s.x, -s.y); }
          D.spr.draw(ctx, p.sheet, 'idle', D.spr.facingFor(C[0] - p.at[0], C[1] - p.at[1]), B.t || 0, s.x, s.y - bob, { alpha: p.mate ? 1 : 0.92 });
          ctx.restore();
        } };
      }));
    };
  }

  // the HUD's word for a USE beside the token (js/roam.js R.USE_NAME)
  if (D.roam && D.roam.USE_NAME) ['front', 'back', 'east', 'west'].forEach(function (k) { D.roam.USE_NAME['hex:' + k] = 'the Hex\'s ' + (k === 'front' ? 'front doors' : k === 'back' ? 'back doors' : k + ' door'); });
  if (D.roam && D.roam.USE_NAME) Object.assign(D.roam.USE_NAME, { 'hex:spiral': 'the spiral stair', 'sign:boxes': 'the Wall of Boxes', 'sign:rail': 'the rail' });

  // ---------------------------------------------------------------- the test door: deep16/?roam=hex (&floor=2|3): Silverton's floor with the party in at the Hex's front doors
  if (D.roam && D.roam.make) {
    var make0 = D.roam.make;
    D.roam.make = function (q, emb) {
      if (!/[?&]roam=hex\b/.test(q || '')) return make0.apply(this, arguments);
      var lv = Math.max(1, Math.min(3, +((/[?&]floor=(\d)/.exec(q) || [])[1] || 1))), B = make0.call(this, q.replace(/roam=hex\b/, 'roam=silverton'), emb), en = B.enter;
      B.enter = function () {
        en.apply(this, arguments);
        var R0 = this.roam, t = R0.token, R = D.roam;
        this.townAway = { map: this.map, def: R.def, at: [t.x, t.y], fw: R0.fw.slice(), folk: this.units.filter(function (u) { return u.npc; }), hexSide: 'front' };
        if (lv === 1) HX.lay(this, 1, HX.ENTRY.front[0], HX.ENTRY.front[1]);
        else { var sp = HX.spiralSq()[0], rows = HX.rows(lv); HX.lay(this, lv, HX.near(rows, [sp[0], sp[1] + 1]) || HX.near(rows, sp), [0, 1]); }
        // (its words and its tune: the roam's script opens on the floor laid here -- R.def.hello, R.def.music)
      };
      return B;
    };
  }
})();
