/* The realm's hex map (10-16, the maps lane; tools/hexmap.html says how to serve it). Griz, 10-15: "at each zoom level I can select the hex and
   change the terrain type in order to reconstruct the corridor-silver-pit"; "1 B"; "I'll need to be able to move the cities and roads around as well".

   THREE LEVELS of pointy-top hexes, nested by their centres: 5 mi (OD&D Book III's wilderness hex, the Snoot's), 1 mi (25 to a 5-mile hex; Silverton
   environs v3's mile squares), 1/16 mi = 330 ft (256 to a mile hex: a city block, RULED 07-24 "a block ~ 300 ft", about 66 grid squares -- one DEEP16
   map). A hex at level k+1 belongs to the hex at level k its centre lies in, so every parent owns exactly n*n children and its outline at the finer
   level zig-zags. A hex shows its own terrain if painted, else its parent's: paint the country at 5 mi, then go in only where it matters.

   THE PLANE is in miles, x east and y south, (0, 0) the corridor map v3's top-left corner. Version 2 (10-20, the world map seat): Silverton to the
   Pit is four wagon-days, 68 mi by the road (RULED 10-17, his "4 days by wagon sounds just right"); version 1 drew v3 at 35 mi badge to badge, where
   his road measured 37.65 mi, so v3 is drawn GROW times larger and a version 1 map grows with it on load (grow(), below). Places and roads are free
   of the grid; a road's point may be bound to a place (it moves with it). Level 1 hex (0, 0) is centred on that corner; a hex's name is its offset
   column and row (odd rows half a hex right, as the Snoot's map). What he paints lives in this browser (localStorage); EXPORT is the save (RULED
   10-20, his "Export is save"). */
'use strict';
(function () {
  var SQ3 = Math.sqrt(3);
  var LV = [null,
    { w: 5, n: 1, name: '5 mi', long: '5-mile hexes: the wilderness (the Snoot’s scale)', px: 46 },
    { w: 1, n: 5, name: '1 mi', long: 'mile hexes: 25 to a 5-mile hex', px: 40 },
    { w: 1 / 16, n: 16, name: '330 ft', long: '330 ft hexes: a city block, about 66 grid squares; 256 to a mile hex', px: 34 }];
  var V3_1 = Math.hypot(1560 - 1530, 1180 - 360) / 35; // version 1's px a mile on corridor v3: Silverton's badge (1530, 360) to the Pit's (1560, 1180) at 35 mi
  var GROW = 1.8062; // 68 / 37.649: his road, the Pit road and the mile, as drawn on 10-16 (his EXPORT 2306Z), reads 68.0 mi
  var V3 = V3_1 / GROW;
  var KEY = 'realm-hexmap-v2', KEY1 = 'realm-hexmap-v1', ZMIN = 1.2, ZMAX = 6000; // (version 1 is left as it was in the browser: grown, never written)
  var KINDS = ['city', 'town', 'castle', 'inn', 'cave', 'junction', 'seat', 'school', 'gulch', 'hamlet', 'mark']; // (school: a seat of the Doors, 10-20)
  var PKINDS = ['road', 'track', 'river'];
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // ---------------------------------------------------------------- the seed: corridor v3's places and roads (its own numbers, px on its canvas)
  function v3(x, y) { return [x / V3, y / V3]; }
  function seedTerr() {
    return [ // cost: Book III's going (a day's march counts a hill or a wood twice, a swamp or a mountain three times); 0 = no one walks it
      { k: 'plains', name: 'plains', color: '#c9a468', cost: 1 }, { k: 'verge', name: 'the Verge (grass)', color: '#9db06a', cost: 1 },
      { k: 'farms', name: 'farmland', color: '#dcc47e', cost: 1 }, { k: 'foothills', name: 'foothills', color: '#b88f58', cost: 2 },
      { k: 'hills', name: 'hills', color: '#a0733a', cost: 2 }, { k: 'woods', name: 'woods', color: '#4f7a3a', cost: 2 },
      { k: 'gulch', name: 'gulch / ravine', color: '#8c6b4a', cost: 2 }, { k: 'bog', name: 'bog / marsh', color: '#5d7040', cost: 3 },
      { k: 'black', name: 'black mountains', color: '#3a3240', cost: 3 }, { k: 'gray', name: 'gray mountains', color: '#7a6650', cost: 3 },
      { k: 'coastal', name: 'coastal range', color: '#5e5040', cost: 3 }, { k: 'town', name: 'town / built', color: '#9a9cb0', cost: 1 },
      { k: 'lake', name: 'lake', color: '#4a98a8', cost: 0 }, { k: 'sea', name: 'the sea', color: '#2b6d75', cost: 0 },
      { k: 'rift', name: 'the Rift / chasm', color: '#1c1612', cost: 0 }
    ];
  }
  function seedSites() {
    return [
      ['silverton', 'Silverton', 'city', 1530, 360], ['pit', "Tarlyn's Pit", 'city', 1560, 1180], ['castegut', 'Castegut', 'castle', 230, 590],
      ['inn', 'the Halfway Inn', 'inn', 1494.5, 811.5], ['mouth', "the Guano Galleries' mouth", 'cave', 1319.5, 396.5],
      ['fork', 'the fork', 'junction', 1430, 470], ['jct', 'the Galleries junction', 'junction', 1458, 402],
      ['moot', 'the moot ground', 'seat', 920, 950, "not on v3: the seat put it at the pocket's south-centre (wiki/gnoll-hills.md: the Gray Keeping's ground, 'three days' walk above the Halfway Inn')"],
      ['monks', 'the lone mountain (the stone monks)', 'mark', 430, 1130]
    ].map(function (s) { var p = v3(s[3], s[4]); return { id: s[0], name: s[1], kind: s[2], x: p[0], y: p[1], note: s[5] || '' }; });
  }
  function seedPaths() {
    var P = function (a) { return a.map(function (p) { return typeof p === 'string' ? p : v3(p[0], p[1]); }); };
    return [
      { id: 'pitroad', name: 'the Pit road', kind: 'road', pts: P(['pit', [1540, 1000], [1490, 860], [1470, 700], [1450, 560], 'fork']) },
      { id: 'mile', name: 'the mile (the fork to Silverton)', kind: 'road', pts: P(['fork', [1446, 436], 'jct', [1496, 378], 'silverton']) },
      // (v3's "up-mountain to the Doors" out of Silverton is not seeded: no road goes north out of Silverton, RULED 10-17 -- the Doors road, the
      // Coldridge Route, runs on from the Galleries junction, "you take a right to silverton instead of going to the doors")
      { id: 'galleries', name: 'the Galleries road', kind: 'track', pts: P(['jct', [1400, 406], 'mouth']) },
      { id: 'castegut', name: 'the Castegut road (the west road)', kind: 'track', pts: P(['fork', [1300, 510], [1100, 540], [900, 560], [700, 560], [520, 570], [380, 560], [300, 560], 'castegut']) },
      { id: 'pirate', name: 'the pirate road', kind: 'road', pts: P(['pit', [1800, 1120], [2100, 1080], [2400, 1040]]) },
      { id: 'newland', name: 'to Newland', kind: 'road', pts: P(['pit', [1600, 1300], [1650, 1416]]) },
      { id: 'river', name: 'the river (Silverton to the sea)', kind: 'river', pts: P([[1545, 362], [1660, 392], [1780, 408], [1900, 400], [2150, 370], [2330, 330]]) }
    ];
  }
  function seedUnder(sites) {
    var s = sites.filter(function (x) { return x.id === 'silverton'; })[0] || { x: 65, y: 15 };
    return [ // the two Silverton maps pinned by a guess (environs: its 'the Edifice' label; city: the dwarven gate) -- U drags one into place
      { id: 'corridor', name: 'corridor v3 (the road)', file: 'corridor-silverton-pit-v3.png', pxmi: V3, x0: 0, y0: 0, on: true, op: 0.75 },
      { id: 'environs', name: 'Silverton environs v3 (mile squares)', file: 'silverton-environs-v3.png', pxmi: 200, x0: s.x - 336 / 200, y0: s.y - 452 / 200, on: false, op: 0.8 },
      { id: 'city', name: 'Silverton city v6 (1 px = 1 ft)', file: 'silverton-city-map-v6.png', pxmi: 5280, x0: s.x - 1260 / 5280, y0: s.y - 470 / 5280, on: false, op: 0.8 }
    ];
  }
  // each terrain's ground for the altitude and the world map's going (10-20): [height ft, roughness ft, difficult by the SRD]. The heights are the
  // seat's draft (the realm names none), each his to change on the terrain. DIFFICULT is the SRD's (07-adventuring: "dense forests, deep swamps,
  // rubble-filled ruins, steep mountains, and ice-covered ground"; half the distance) -- RULED 10-20, his "SRD for world map and book III for
  // snoot-play": `cost` stays Book III's for the Snoot, `diff` is the world map's. A gulch and the Rift are ours (his "If DMG has rules SRD
  // doesn't, we can author our own fill in of the gap"); hills are not difficult (the SRD names none)
  // (10-20 later: [4] OWN, how much a hex's own ground wins over the blend -- a town sits on its own ground, his "1 yes"; a bog lies low and flat at a
  // range's foot; [5] CUT, a ground that is a cut below the land round it, not a height of its own -- a gulch, his "is a gulch where the land rises up on
  // your sides because you're in like a valley with walls?" -- yes: the gulch 350 ft under its banks, the Rift 1,800)
  var DEFT = { plains: [250, 60, 0], verge: [150, 40, 0], farms: [220, 30, 0], foothills: [1400, 600, 0], hills: [900, 650, 0], woods: [500, 150, 1],
    gulch: [60, 60, 1, 0.45, 350], bog: [60, 15, 1, 0.7], black: [6000, 2600, 1], gray: [5000, 2200, 1], coastal: [3200, 1500, 1], town: [300, 30, 0, 1], lake: [0, 0, 0],
    sea: [0, 0, 0], rift: [-1500, 300, 1, 0.45, 1800] };
  function terrDefaults(list) {
    list.forEach(function (t) {
      var d = DEFT[t.k] || [300, 80, 0];
      if (t.alt == null) t.alt = d[0]; if (t.rough == null) t.rough = d[1]; if (t.diff == null) t.diff = !!d[2];
      if (t.own == null) t.own = d[3] == null ? 0.45 : d[3];
      if (t.cut == null) { t.cut = d[4] || 0; if (t.cut && DEFT[t.k] && +t.rough > d[1]) t.rough = d[1]; } // (a cut's own roughness is its floor's)
    });
    return list;
  }
  function seedPeaks(sites) { // three named heights to start his lifts from (the seat's placing, his to move)
    var out = [], by = function (f) { return sites.filter(f)[0]; };
    var add = function (s, name, dx, dy, h, r) { if (s) out.push({ id: 'k' + out.length, name: name, x: s.x + dx, y: s.y + dy, h: h, r: r }); };
    add(by(function (s) { return s.id === 'monks'; }), 'the lone mountain', 0, 0, 5000, 5);
    add(by(function (s) { return /doors/i.test(s.name); }), 'the Doors’ heights', 0, -3, 3500, 9);
    add(by(function (s) { return s.id === 'silverton'; }), 'the Edifice’s mountain', 0, -2.2, 2500, 3);
    return out;
  }
  function fresh() {
    var sites = seedSites();
    return { v: 2, terr: terrDefaults(seedTerr()), paint: { 1: {}, 2: {}, 3: {} }, sites: sites, paths: seedPaths(), under: seedUnder(sites), peaks: seedPeaks(sites),
      pace: { foot: 24, cart: 17 }, opts: { paintOp: 0.7, grid: true, labels: true, terr: 'hills', brush: 0, tool: 'select', uSel: 'corridor',
        look: 'flat', exag: 6, contours: true, iso: true, liftR: 4, seed: 1, fill: true }, view: null };
  }

  // ---------------------------------------------------------------- hex math (axial q, r; pointy-top)
  function hc(L, q, r) { var w = LV[L].w; return [w * (q + r / 2), w * SQ3 / 2 * r]; }
  function round(qf, rf) {
    var x = qf, z = rf, y = -x - z, rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
    var dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
    return [rx + 0, rz + 0];
  }
  function at(L, x, y) { var w = LV[L].w, r = y / (w * SQ3 / 2); return round(x / w - r / 2, r); }
  // the parent at L-1 (the nudge breaks a tie on an edge the same way everywhere, so every parent owns n*n)
  function up(L, q, r) { var n = LV[L].n; return round(q / n + 1e-7, r / n + 2.3e-7); }
  var CH = {};
  function kids(n) {
    if (CH[n]) return CH[n];
    var out = [], m = n + 2;
    for (var dr = -m; dr <= m; dr++) for (var dq = -m; dq <= m; dq++) { var p = round(dq / n + 1e-7, dr / n + 2.3e-7); if (p[0] === 0 && p[1] === 0) out.push([dq, dr]); }
    return (CH[n] = out);
  }
  function K(q, r) { return q + ',' + r; }
  function unK(k) { var i = k.indexOf(','); return [+k.slice(0, i), +k.slice(i + 1)]; }
  function col(q, r) { return q + (r - (r & 1)) / 2; } // (odd-r offset: the Snoot's)
  var DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]], DANG = [0, -60, -120, 180, 120, 60];
  function hdist(a, b) { var dq = a[0] - b[0], dr = a[1] - b[1]; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }

  // ---------------------------------------------------------------- state
  var S, DC, TB = {}, SB = {}, UNDO = [], REDO = [], OP = null, VER = 0, LAYERKEY = '';
  var view = { cx: 54, cy: 30, z: 11, L: 1 };
  var SEL = { hex: null, site: null, path: null, vtx: -1 };
  var M = { pts: [], live: null, done: false }, DRAW = null, IMG = {};
  function reindex() { VER++; TB = {}; S.terr.forEach(function (t) { TB[t.k] = t; }); SB = {}; S.sites.forEach(function (s) { SB[s.id] = s; }); }
  function rebuildDC() { DC = { 1: new Map(), 2: new Map() }; [2, 3].forEach(function (L) { Object.keys(S.paint[L]).forEach(function (k) { bump(L, k, 1); }); }); }
  function bump(L, k, d) {
    var p = unK(k);
    for (var l = L; l > 1; l--) { p = up(l, p[0], p[1]); var pk = K(p[0], p[1]), v = (DC[l - 1].get(pk) || 0) + d; if (v > 0) DC[l - 1].set(pk, v); else DC[l - 1].delete(pk); }
  }
  var GREW = null;
  function load() {
    var raw = null, old = null;
    try { raw = localStorage.getItem(KEY); if (!raw) old = localStorage.getItem(KEY1); } catch (e) { /* (no storage: the page still works, EXPORT keeps it) */ }
    S = null; if (raw) try { S = JSON.parse(raw); } catch (e) { S = null; }
    if (!S && old) try { var o1 = JSON.parse(old); if (o1 && o1.v === 1 && o1.paint) { S = grow(o1); GREW = 'this browser’s version 1 map'; } } catch (e) { S = null; }
    if (!S || S.v !== 2) S = fresh();
    var f = fresh();
    ['paint', 'pace', 'opts', 'under', 'terr', 'sites', 'paths'].forEach(function (k) { if (!S[k]) S[k] = f[k]; });
    [1, 2, 3].forEach(function (L) { S.paint[L] = S.paint[L] || {}; });
    Object.keys(f.opts).forEach(function (k) { if (S.opts[k] == null) S.opts[k] = f.opts[k]; });
    terrDefaults(S.terr); if (!S.peaks) S.peaks = seedPeaks(S.sites);
    if (S.view) { view.cx = S.view.cx; view.cy = S.view.cy; view.z = S.view.z; view.L = S.view.L || 1; }
    reindex(); rebuildDC();
    S.paths.forEach(function (P) { if (/coldridge/i.test(P.name || '') && !P.drawn) SHAPED = shapeColdridge(P) || SHAPED; });
    if (!(S.seeded && S.seeded.doors1020) && S.sites.some(function (s) { return /doors/i.test(s.name); })) SEEDED = seedDoors();
    if (!(S.seeded && S.seeded.lake1020)) LAKED = seedLake();
    if (!(S.seeded && S.seeded.going1020)) WENT = seedGoing();
    if (!(S.seeded && S.seeded.gulch1020)) GULCHED = seedGulch();
    if (!(S.seeded && S.seeded.fork1022)) FORKED = seedFork();
    if (!(S.seeded && S.seeded.silverton1028)) SILVERED = seedSilverton();
    if (!(S.seeded && S.seeded.silverton1028b)) RESUNK = seedSinksOut();
    if (!(S.seeded && S.seeded.coldridge1031)) CLIMBED = seedColdridgeClimb();
    if (!(S.seeded && S.seeded.coldridge1031b)) HAIRPINNED = seedColdridgeHairpins();
    if (!(S.seeded && S.seeded.coldridge1031c)) REGRADED = seedColdridgeHisLine();
  }
  // THE COLDRIDGE CLIMB AND ITS SHELF (10-31, the Halloween desk; his words on the mile hex (112, 32) and the four round it: "Should essentially encompass the road leading
  // up to the road to the doors... like it's pretty decently mapped out road except for this section. I was wonder if you could do the shaping like the silverton fixes were
  // done, with the notion that somewhere around the altitude stabilization area will probably become an iso-roam"): once, on load. The Coldridge Route (the Doors road, the
  // wiki's "starts up the mountain") left the Galleries junction on his trough's floor and climbed unpainted land unevenly -- 10 ft to 4,400 in 6.6 mi, one mile of 1,000 ft
  // among gentler ones -- to where it levels near 5,400 ft. A level along the road (the Warrens' bench's way) grades the climb evenly from the floor to the shelf; a wider
  // level holds the shelf flat for some 2 mi (the iso roam to come); the unpainted mile hexes the road runs through are painted by the height they are given (foothills,
  // hills, gray mountains on the shelf). His paint, at the mile or the 5 miles, is kept, and his sinks and the switchbacks to the Doors with it.
  // THE CLIMB IN HAIRPINS (10-31, the Halloween desk, the same afternoon; his words on the first shaping: "don't worry about [his black-mountain hexes], worry about a
  // somewhat realistic path when people zoom in"): once, on load, after the first. The climb's straight runs up the face (his rough legs, a mile or two each at 750 ft a
  // mile) become hairpins across the slope -- ten legs about 0.8 mi wide, each climbing some 530 ft, near an 11% grade, the road some 2 mi longer -- cut into one smooth
  // face from the junction's floor to the shelf: a broad level along the climb's line for the face, a narrow one along the hairpins for the road's own ledge. The first
  // seed's even grade along the old legs is taken out; the shelf stays. Every mile hex on the face is painted by its height, his own black ones too (his word above).
  // THE CLIMB GRADED ALONG HIS OWN LINE (10-31, the Halloween desk, the same afternoon): he took the hairpins in hand and redrew them a mile west (his EXPORT
  // 1023Z), so the face and the ledge, cut along the desk's hairpins, no longer lay under his road -- it dipped 200 ft at 4.5 mi and pitched 2,750 ft a mile at 5.5.
  // His "Yes, both", to the desk's two: (1) the face and the ledge follow his road as he drew it, from the junction to where it reaches the shelf, graded evenly to
  // the shelf's height, the mile hexes beside it painted by that height; (2) his ten lifts by the shelf (kmvw8...), set at the tool's 4 mi spread, keep to the one
  // hex he crammed them into: a half mile each. Once, on load.
  var REGRADED = false, HIS_LIFTS = ['kmvw8j1mt', 'kmvw8q9yg', 'kmvw8qb70', 'kmvw8qcfw', 'kmvw8qfy0', 'kmvw8qnf6', 'kmvw8re90', 'kmvw8rg84', 'kmvw8rh5v', 'kmvw8rhws'];
  function seedColdridgeHisLine() {
    S.seeded = S.seeded || {}; S.seeded.coldridge1031c = true;
    var n = 0;
    (S.peaks || []).forEach(function (p) { if (HIS_LIFTS.indexOf(p.id) >= 0 && +p.r > 0.5) { p.r = 0.5; p.note = (p.note ? p.note + '; ' : '') + 'spread 4 mi to 0.5, 10-31 (his "Yes, both": the one hex)'; n++; } });
    var P = S.paths.filter(function (p) { return /coldridge/i.test(p.name || ''); })[0], shelf = S.peaks.filter(function (p) { return p.id === 'v-coldshelf'; })[0];
    if (!P || !shelf || !shelf.pts || shelf.pts.length < 2) { reindex(); return n > 0; }
    var pts = ptsOf(P); if (pts.length < 2) { reindex(); return n > 0; }
    var near = function (p) { var d = 1e9; for (var i = 0; i + 1 < shelf.pts.length; i++) d = Math.min(d, segD(p, shelf.pts[i], shelf.pts[i + 1])[0]); return d; };
    // his road from the junction, sampled every 0.1 mi, to its first sample within 0.3 mi of the shelf's line: the climb
    var climb = [pts[0].slice()], done = false;
    for (var i = 0; i + 1 < pts.length && !done; i++) {
      var a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(L / 0.1));
      for (var j = 1; j <= m; j++) { var q = [a[0] + (b[0] - a[0]) * j / m, a[1] + (b[1] - a[1]) * j / m]; if (near(q) <= 0.3) { climb.push(q); done = true; break; } if (j === m) climb.push(b.slice()); }
    }
    if (!done || climb.length < 2) { reindex(); return n > 0; }
    var len = 0; for (var k = 0; k + 1 < climb.length; k++) len += Math.hypot(climb[k + 1][0] - climb[k][0], climb[k + 1][1] - climb[k][1]);
    S.peaks = S.peaks.filter(function (p) { return p.id !== 'v-coldface' && p.id !== 'v-coldroad' && p.id !== 'v-coldclimb'; });
    var note = 'the Halloween desk 10-31, on his "Yes, both" (his own line, his EXPORT 1023Z)';
    S.peaks.push({ id: 'v-coldface', name: 'the Coldridge face', pts: climb, h: 0, level: [CLIMB_H0, SHELF_H[0]], r: 0.9, note: note + ': the face along his climb' });
    S.peaks.push({ id: 'v-coldroad', name: 'the Coldridge hairpins', pts: climb, h: 0, level: [CLIMB_H0, SHELF_H[0]], r: 0.22, note: note + ': the road\'s ledge, ' + len.toFixed(1) + ' mi at ' + Math.round((SHELF_H[0] - CLIMB_H0) / len) + ' ft a mile' });
    var along = function (p) { var d = 1e9, at0 = 0, acc = 0; for (var k = 0; k + 1 < climb.length; k++) { var sl = Math.hypot(climb[k + 1][0] - climb[k][0], climb[k + 1][1] - climb[k][1]), sg = segD(p, climb[k], climb[k + 1]); if (sg[0] < d) { d = sg[0]; at0 = acc + sg[1] * sl; } acc += sl; } return [d, acc ? at0 / acc : 0]; };
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, w2 = LV[2].w, hh2 = w2 * SQ3 / 2;
    climb.forEach(function (p) { x0 = Math.min(x0, p[0] - 1.2); x1 = Math.max(x1, p[0] + 1.2); y0 = Math.min(y0, p[1] - 1.2); y1 = Math.max(y1, p[1] + 1.2); });
    for (var r = Math.floor(y0 / hh2); r <= Math.ceil(y1 / hh2); r++) for (var qq = Math.floor(x0 / w2 - r / 2); qq <= Math.ceil(x1 / w2 - r / 2); qq++) {
      var c = hc(2, qq, r), al = along(c); if (al[0] > 0.75) continue;
      var hh = CLIMB_H0 + (SHELF_H[0] - CLIMB_H0) * al[1], tt = hh < 1500 ? 'foothills' : hh < 4000 ? 'hills' : 'gray';
      if (TB[tt]) { rawSet(2, K(qq, r), tt); n++; }
    }
    reindex(); return true;
  }
  var HAIRPINNED = false, HP_LEGS = 10, HP_HALF = 0.4;
  function seedColdridgeHairpins() {
    S.seeded = S.seeded || {}; S.seeded.coldridge1031b = true;
    var P = S.paths.filter(function (p) { return /coldridge/i.test(p.name || ''); })[0]; if (!P) return false;
    var pts = ptsOf(P); if (pts.length < 3) return false;
    // the climb's end on the old road: CLIMB_TO miles along it, and the index of the first point past it
    var acc = 0, end = null, past = -1;
    for (var i = 0; i + 1 < pts.length; i++) {
      var a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (acc + L >= CLIMB_TO) { var t = (CLIMB_TO - acc) / L; end = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; past = i + 1; break; }
      acc += L;
    }
    if (!end || past < 1) return false;
    var A = pts[0], dx = end[0] - A[0], dy = end[1] - A[1], D = Math.hypot(dx, dy), ux = dx / D, uy = dy / D, vx = -uy, vy = ux;
    // (first straight up the face a fifth of the way, so the hairpins swing clear of the mile's and the Galleries road's beds where they leave the junction: js bedAt
    // pulls the land within 0.45 mi of a road to that road's bed, and the first hairpins had taken the mile road's 650 ft)
    var F0 = 0.2, pins = [[+(A[0] + dx * F0).toFixed(3), +(A[1] + dy * F0).toFixed(3)]], side = 1;
    for (var k = 1; k <= HP_LEGS; k++) { var f = F0 + (1 - F0) * k / (HP_LEGS + 1); pins.push([+(A[0] + dx * f + vx * HP_HALF * side).toFixed(3), +(A[1] + dy * f + vy * HP_HALF * side).toFixed(3)]); side = -side; }
    var climb = [A.slice()].concat(pins, [end]);
    // the road: its first point (the junction, by name), the hairpins, the climb's end, then the rest as it was
    P.pts = [P.pts[0]].concat(pins, [[+end[0].toFixed(3), +end[1].toFixed(3)]], P.pts.slice(past));
    P.note = (P.note ? P.note + '; ' : '') + 'its climb from the junction in ten hairpins, 10-31 (his "a somewhat realistic path when people zoom in")';
    P.grade = 'even'; // (its bed even at its ends: buildBeds)
    var L2 = 0; for (var j = 0; j + 1 < climb.length; j++) L2 += Math.hypot(climb[j + 1][0] - climb[j][0], climb[j + 1][1] - climb[j][1]);
    S.peaks = S.peaks.filter(function (p) { return p.id !== 'v-coldclimb'; }); // (the first seed's grade along the old legs)
    var note = 'the Halloween desk 10-31, on his "worry about a somewhat realistic path when people zoom in"';
    S.peaks.push({ id: 'v-coldface', name: 'the Coldridge face', pts: [A.slice(), end.slice()], h: 0, level: [CLIMB_H0, SHELF_H[0]], r: 1.0, note: note + ': one smooth face from the junction to the shelf' });
    S.peaks.push({ id: 'v-coldroad', name: 'the Coldridge hairpins', pts: climb, h: 0, level: [CLIMB_H0, SHELF_H[0]], r: 0.22, note: note + ': the road\'s ledge, ' + L2.toFixed(1) + ' mi of hairpins at ' + Math.round((SHELF_H[0] - CLIMB_H0) / L2) + ' ft a mile' });
    var n = 0, w2 = LV[2].w, hh2 = w2 * SQ3 / 2, x0 = Math.min(A[0], end[0]) - 1.5, x1 = Math.max(A[0], end[0]) + 1.5, y0 = Math.min(A[1], end[1]) - 1.5, y1 = Math.max(A[1], end[1]) + 1.5;
    for (var r = Math.floor(y0 / hh2); r <= Math.ceil(y1 / hh2); r++) for (var q = Math.floor(x0 / w2 - r / 2); q <= Math.ceil(x1 / w2 - r / 2); q++) {
      var c = hc(2, q, r), sg = segD(c, A, end); if (sg[0] > HP_HALF + 0.35) continue;
      var hh = CLIMB_H0 + (SHELF_H[0] - CLIMB_H0) * sg[1], tt = hh < 1500 ? 'foothills' : hh < 4000 ? 'hills' : 'gray';
      if (TB[tt]) { rawSet(2, K(q, r), tt); n++; }
    }
    reindex(); return true;
  }
  var CLIMBED = false, CLIMB_TO = 7.1, SHELF_TO = 9.2, CLIMB_H0 = 10, SHELF_H = [5350, 5450]; // (miles along the road; feet -- 10 ft the trough's floor at the junction)
  function seedColdridgeClimb() {
    S.seeded = S.seeded || {}; S.seeded.coldridge1031 = true;
    var P = S.paths.filter(function (p) { return /coldridge/i.test(p.name || ''); })[0]; if (!P) return false;
    var pts = ptsOf(P); if (pts.length < 2) return false;
    var cut = function (from, to) { // (the road between two distances along it)
      var out = [], acc = 0;
      for (var i = 0; i + 1 < pts.length; i++) {
        var a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), t0 = Math.max(0, from - acc), t1 = Math.min(L, to - acc);
        if (L > 0 && t1 > t0) { if (!out.length) out.push([a[0] + (b[0] - a[0]) * t0 / L, a[1] + (b[1] - a[1]) * t0 / L]); out.push([a[0] + (b[0] - a[0]) * t1 / L, a[1] + (b[1] - a[1]) * t1 / L]); }
        acc += L;
      }
      return out;
    };
    var along = function (line, p) { // (the nearest point of a line: how far off, and how far along it, 0 to 1)
      var d = 1e9, at0 = 0, acc = 0;
      for (var i = 0; i + 1 < line.length; i++) { var sl = Math.hypot(line[i + 1][0] - line[i][0], line[i + 1][1] - line[i][1]), sg = segD(p, line[i], line[i + 1]); if (sg[0] < d) { d = sg[0]; at0 = acc + sg[1] * sl; } acc += sl; }
      return [d, acc ? at0 / acc : 0];
    };
    var climb = cut(0, CLIMB_TO), shelf = cut(CLIMB_TO, SHELF_TO); if (climb.length < 2 || shelf.length < 2) return false;
    var n = 0, has = {}; S.peaks.forEach(function (p) { has[p.id] = 1; });
    var note = 'the Halloween desk 10-31, on his "do the shaping like the silverton fixes ... the altitude stabilization area will probably become an iso-roam"';
    if (!has['v-coldclimb']) { S.peaks.push({ id: 'v-coldclimb', name: 'the Coldridge climb', pts: climb, h: 0, level: [CLIMB_H0, SHELF_H[0]], r: 0.45, note: note + ': the road graded evenly from the junction to the shelf' }); n++; }
    if (!has['v-coldshelf']) { S.peaks.push({ id: 'v-coldshelf', name: 'the Coldridge shelf', pts: shelf, h: 0, level: SHELF_H.slice(), r: 1.0, note: note + ': where the climb levels, held flat (the iso roam to come)' }); n++; }
    var all = climb.concat(shelf), x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, w2 = LV[2].w, hh2 = w2 * SQ3 / 2;
    all.forEach(function (p) { x0 = Math.min(x0, p[0] - 1.5); x1 = Math.max(x1, p[0] + 1.5); y0 = Math.min(y0, p[1] - 1.5); y1 = Math.max(y1, p[1] + 1.5); });
    for (var r = Math.floor(y0 / hh2); r <= Math.ceil(y1 / hh2); r++) for (var q = Math.floor(x0 / w2 - r / 2); q <= Math.ceil(x1 / w2 - r / 2); q++) {
      var k = K(q, r), c = hc(2, q, r), p1 = up(2, q, r); if (S.paint[2][k] || S.paint[1][K(p1[0], p1[1])]) continue; // (his paint, at the mile or the 5 miles: kept)
      var on = along(shelf, c), oc = along(climb, c), t = null;
      if (on[0] <= 0.6) t = 'gray';
      else if (oc[0] <= 0.45) { var hh = CLIMB_H0 + (SHELF_H[0] - CLIMB_H0) * oc[1]; t = hh < 1500 ? 'foothills' : hh < 4000 ? 'hills' : 'gray'; }
      if (t && TB[t]) { rawSet(2, k, t); n++; }
    }
    reindex(); return n > 0;
  }
  // SILVERTON AND THE WARRENS FIT TO THE REALM (10-28, the maps window; his words: "I'd like a window to use the map-making to adjust the elevations around
  // silverton and the warrens to fit the wiki re altitudes", then on the seat's read of his paint, "1 - show me what's there now, they're probably just me being
  // sloppy, and I think you're good to move and reshape things to add realism that fits the wiki (2-4)" and "9 yes"): once, on load. The realm
  // (TarlynsPit/wiki/silverton.md 21-22, the-warrens.md 16 and 28, city v6, environs v3): the town falls away south from the Edifice to the Hex in the valley,
  // the road rising near the mountain and slopes down in front of the Edifice; the river east, falls and ponds; the Warrens' six mouths in the chain's face on
  // the north bank 4 mi east, the camp and the bridge at the water, the feed track on the south bank. His two sinks beside the town (-900 and -500, 4 mi wide)
  // had taken it to -530 ft: they go 3 mi south-west (SINKS_OUT; 3 mi west had sunk the black range behind the town, 10-28b), into his trough's floor. The
  // Warrens' bank, the fill's gray mountain at 1,300-1,430 ft a step above his town paint, is brought to a bench (a level, 430 to 390 ft west to east) and its
  // unpainted mile hexes painted foothills; the camp is a place (environs v3's), the feed track a track from the town to it over the bridge
  var SILVERED = false;
  function seedSilverton() {
    S.seeded = S.seeded || {}; S.seeded.silverton1028 = true;
    var n = 0, was = { kmvhnmit9: [116.42059550242948, 28.660712080832063], kmvhnmkp4: [116.58860928427885, 28.85794565082916] };
    (S.peaks || []).forEach(function (p) {
      var w = was[p.id]; if (!w || Math.hypot(p.x - w[0], p.y - w[1]) > 0.05) return; // (only where his EXPORT of 10-21 had them: a sink he has moved since stays his)
      p.x += SINKS_OUT[0]; p.y += SINKS_OUT[1]; p.note = (p.note ? p.note + '; ' : '') + SINKS_NOTE; n++;
    });
    var BENCH = [[120.6, 28.3], [121.6, 28.33], [122.6, 28.42], [123.6, 28.55], [124.3, 28.62]];
    if (!S.peaks.some(function (p) { return p.id === 'v-warrens'; })) { S.peaks.push({ id: 'v-warrens', name: 'the Warrens’ bench', pts: BENCH, h: 0, level: [340, 300], r: 0.6, note: 'the mouths’ camp on the north bank over the river (the-warrens.md 28; environs v3), 10-28' }); n++; }
    var w2 = LV[2].w, hh2 = w2 * SQ3 / 2, bd = function (c) { var d = 1e9; for (var i = 0; i + 1 < BENCH.length; i++) d = Math.min(d, segD(c, BENCH[i], BENCH[i + 1])[0]); return d; };
    for (var r = Math.floor(27.2 / hh2); r <= Math.ceil(29.4 / hh2); r++) for (var q = Math.floor(119.8 / w2 - r / 2); q <= Math.ceil(125 / w2 - r / 2); q++) {
      var k = K(q, r), c = hc(2, q, r), p1 = up(2, q, r); if (S.paint[2][k] || S.paint[1][K(p1[0], p1[1])]) continue; // (his paint, at the mile or the 5 miles: kept)
      if (bd(c) <= 0.75) { rawSet(2, k, 'foothills'); n++; }
    }
    if (!SB.warrens) { S.sites.push({ id: 'warrens', name: 'the Crawler Warrens (the mouth camp)', kind: 'cave', x: 122.34, y: 28.43, note: 'placed 10-28 at environs v3’s mouth camp: six mouths in the chain’s face on the north bank, the bridge below (the-warrens.md 28); its door the Warrens’ top floor (deep16/js/mines.js); his “9 yes”' }); n++; }
    if (!pathBy('feedtrack') && SB.silverton) { S.paths.push({ id: 'feedtrack', name: 'the feed track (Silverton to the Warrens)', kind: 'track', pts: ['silverton', [118.4, 27.95], [119.4, 28.18], [120.6, 28.5], [121.7, 28.8], [122.45, 28.98], [122.48, 28.66]] }); n++; } // (over the bridge to the camp's foot: the camp a quarter mile up the bench)
    reindex(); return n > 0;
  }
  // THE SINKS OUT OF THE RANGE (10-28b, the maps window; his words on the first seed in his browser: "hex map link makes it look like all the mountains
  // behind silverton have been flattened"): 3 mi west had set his two sinks (4 mi across) under the black range north-west of the town, sinking it by as
  // much as 2,400 ft. Once, on load: where the first seed left them, they go on to 3 mi south-west of his own spots instead, into his trough's floor beside
  // his deeper sink (-1,950), where the land already lies at the floor. The range is back as he painted it, the town keeps its 765 ft, and the road
  // from the west climbs out of his trough to a 1,130 ft shoulder a mile out and down into the town (dev/bench16.js maps1028 reads the range)
  var SINKS_OUT = [-2.12, 2.12], SINKS_NOTE = 'moved 3 mi south-west 10-28 from beside Silverton (it had taken the town to -530 ft; his “good to move and reshape things”)', RESUNK = false;
  function seedSinksOut() {
    S.seeded = S.seeded || {}; S.seeded.silverton1028b = true;
    var n = 0, was = { kmvhnmit9: [116.42059550242948, 28.660712080832063], kmvhnmkp4: [116.58860928427885, 28.85794565082916] };
    (S.peaks || []).forEach(function (p) {
      var w = was[p.id]; if (!w || Math.hypot(p.x - (w[0] - 3), p.y - w[1]) > 0.05) return; // (only where the first seed set them: a sink he has moved since stays his)
      p.x = w[0] + SINKS_OUT[0]; p.y = w[1] + SINKS_OUT[1];
      p.note = (p.note || '').replace('moved 3 mi west 10-28 from beside Silverton (it had taken the town to -530 ft; his “good to move and reshape things”)', SINKS_NOTE.replace(/\)$/, '; 3 mi west had sunk the range behind it)')); n++;
    });
    return n > 0;
  }
  // THE FORK DRAGGED SOUTH (10-22, the world map seat; RULED, Griz: "3 - about 8-9 hours from the half-way inn is ideal, the fork can be on either side, but there
  // should be a thin row of plains between the gnoll hills and the bog that the road runs along, and the bog would all be north of it - it can be adjacent to the
  // fork or nearby", then "3 I haven't changed the painting, it may have to drag the fork south a bit"): once, on load. The fork goes down the Pit road to the
  // road's own bend 5.6 mi south (the Pit road ends there, the mile runs on from the fork's old place down to it); the west road leaves it west along that line
  // and rejoins its own near x 69; the Glowseep sits in the bog beside the fork, north of the road. And on mile hexes he has not painted (neither the hex nor its
  // 5-mile hex: THE FILL had made them bog), from the area's west edge to the fork: the bog down to the road, a thin row of plains along it, the gnoll hills
  // south of that down to his own, plains along the Pit road to Web Gulch and east of it, so all the bog lies north of the road
  var FORKED = false;
  function seedFork() {
    S.seeded = S.seeded || {}; S.seeded.fork1022 = true;
    var fork = SB.fork, glow = SB.glowseep, pit = pathBy('pitroad'), mile = pathBy('mile'), west = pathBy('castegut');
    if (!fork || !pit || !mile || !west || pit.pts[pit.pts.length - 1] !== 'fork' || mile.pts[0] !== 'fork' || west.pts[0] !== 'fork') return false;
    var bend = pit.pts[pit.pts.length - 2]; if (typeof bend === 'string' || Math.hypot(bend[0] - fork.x, bend[1] - fork.y) > 9) return false;
    var old = [fork.x, fork.y], j = 1; while (j < west.pts.length && (typeof west.pts[j] === 'string' || west.pts[j][0] > 75)) j++;
    if (j >= west.pts.length || typeof west.pts[j] === 'string') return false;
    fork.x = bend[0]; fork.y = bend[1]; fork.note = (fork.note ? fork.note + '; ' : '') + 'dragged 10-22 from (' + old[0].toFixed(2) + ', ' + old[1].toFixed(2) + ') down the Pit road to its bend (his “it may have to drag the fork south a bit”)';
    pit.pts.splice(pit.pts.length - 2, 1); mile.pts.splice(1, 0, old);
    var Y = fork.y, X0 = west.pts[j][0], Yj = west.pts[j][1];
    west.pts.splice(1, j - 1, [fork.x - 11.5, Y + 0.08], [fork.x - 27, Y + 0.03]);
    var rd = function (x) { return x >= fork.x ? Y : Y + (Yj - Y) * (fork.x - x) / (fork.x - X0); }; // (the west road's line, the fork to where it rejoins)
    if (glow) { glow.x = fork.x - 1.5; glow.y = fork.y - 1.6; glow.note = (glow.note ? glow.note + '; ' : '') + 'moved 10-22 beside the fork, north of the west road, in the bog (his “it can be adjacent to the fork or nearby”)'; }
    var pp = ptsOf(pit), pitD = function (c) { var d = 1e9; for (var i = 0; i + 1 < pp.length; i++) d = Math.min(d, segD(c, pp[i], pp[i + 1])[0]); return d; };
    var pitX = function (y) { var a = [fork.x, fork.y], b = pp[pp.length - 2]; return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); };
    var w = LV[2].w, hh2 = w * SQ3 / 2, n = 0;
    for (var r = Math.floor(30 / hh2); r <= Math.ceil(62 / hh2); r++) for (var q = Math.floor(60 / w - r / 2); q <= Math.ceil(120 / w - r / 2); q++) {
      var k = K(q, r), c = hc(2, q, r), p1 = up(2, q, r); if (S.paint[2][k] || S.paint[1][K(p1[0], p1[1])]) continue; // (his paint, at the mile or the 5 miles: kept)
      var x = c[0], y = c[1], ry = rd(x), t = null;
      if (x < 60 || x > 119) continue;
      if (x <= fork.x + 0.6) {
        if (y >= ry - 0.6 && y <= ry + 1.1) t = 'plains'; // (the thin row the road runs along)
        else if (y > 36.5 && y < ry - 0.6 && x <= fork.x - 0.6) t = 'bog'; // (north of it: the bog down to it, below his own band)
      }
      if (!t && y > ry + 1.1 && y <= 62) { // (south of the row)
        if (pitD(c) <= 1.4) t = 'plains'; // (along the Pit road, down past Web Gulch)
        else if (x < pitX(y)) { if (y <= 56) t = 'hills'; } // (the gnoll hills, down to his own)
        else if (x <= 118) t = 'plains'; // (east of the Pit road: no bog south of the west road)
      }
      if (t) { rawSet(2, k, t); n++; }
    }
    reindex(); return true;
  }
  // THE COLDRIDGE ROUTE'S GOING (10-20, his "1 yes" to the seat's lean): a road carries its own going, a number -- 1 a road, 2 the SRD's difficult, between them
  // ours (the weather, the switchbacks); the Coldridge Route's set once so his redrawn road (35.7 mi) reads the ruled three wagon-days
  var WENT = false, GULCHED = false;
  function seedGoing() {
    S.seeded = S.seeded || {}; S.seeded.going1020 = true; var n = 0;
    S.paths.forEach(function (P) {
      if (!/coldridge/i.test(P.name || '') || P.going != null) return;
      var pts = ptsOf(P), len = 0; for (var i = 0; i + 1 < pts.length; i++) len += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      if (len > 0) { P.going = Math.round(3 * (+S.pace.cart || 17) / len * 100) / 100; P.difficult = P.going >= 2; n++; }
    });
    return n > 0;
  }
  // WEB GULCH (10-20, his "gulch isn't gulching or a location"): the realm's (TarlynsPit/wiki/web-gulch.md: north of the Halfway Inn, between the fork and the
  // inn, the road running through it -- coming down from town you clear the gulch, then the inn; corridor v3's ellipse) -- once, on load: a place on the Pit road
  // where v3 draws it, and the mile hexes along the road there painted gulch: a cut, its banks rising either side, the road down through it
  function seedGulch() {
    S.seeded = S.seeded || {}; S.seeded.gulch1020 = true;
    if (S.sites.some(function (s) { return /web gulch/i.test(s.name); })) return false;
    var P = pathBy('pitroad'); if (!P) return false;
    var want = [1460 / V3, 640 / V3], pts = ptsOf(P), best = null, bd = 1e9, i;
    for (i = 0; i + 1 < pts.length; i++) { var sg = segD(want, pts[i], pts[i + 1]); if (sg[0] < bd) { bd = sg[0]; best = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * sg[1], pts[i][1] + (pts[i + 1][1] - pts[i][1]) * sg[1]]; } }
    if (!best || bd > 8) return false;
    S.sites.push({ id: 'webgulch', name: 'Web Gulch', kind: 'gulch', x: best[0], y: best[1], note: 'placed 10-20 where corridor v3 draws it, on the Pit road between the fork and the inn (wiki/web-gulch.md); its own roam to come' });
    var w = LV[2].w, hh2 = w * SQ3 / 2, n = 0;
    for (var r = Math.floor((best[1] - 4) / hh2); r <= Math.ceil((best[1] + 4) / hh2); r++) for (var q = Math.floor((best[0] - 4) / w - r / 2); q <= Math.ceil((best[0] + 4) / w - r / 2); q++) {
      var c = hc(2, q, r); if (Math.hypot(c[0] - best[0], c[1] - best[1]) > 3.2) continue;
      var dr = 1e9; for (i = 0; i + 1 < pts.length; i++) dr = Math.min(dr, segD(c, pts[i], pts[i + 1])[0]);
      if (dr > 0.75 || S.paint[2][K(q, r)] === 'lake') continue;
      rawSet(2, K(q, r), 'gulch'); n++;
    }
    reindex(); return true;
  }
  // HALFWAY LAKE (10-20; his "looked like the half way inn lake got moved over to the forest by sanctuary", then "it's been missing since the gulch questions, I
  // didn't paint it back where it goes"): never painted -- corridor v3's picture drew it -- so once, on load, its mile hexes painted lake inside v3's own outline
  // (the guess's LAKE, below, in v3's px), where no lake is painted within 4 mi of the inn; and a place by its name (the Snoot names it). The lake by the
  // Sanctuary woods is his own paint of 10-16 and is left as it is.
  var LAKED = false;
  function seedLake() {
    S.seeded = S.seeded || {}; S.seeded.lake1020 = true;
    var inn = S.sites.filter(function (s) { return s.id === 'inn'; })[0]; if (!inn) return false;
    for (var L = 1; L <= 3; L++) for (var k in S.paint[L]) if (S.paint[L][k] === 'lake') { var h = unK(k), c = hc(L, h[0], h[1]); if (Math.hypot(c[0] - inn.x, c[1] - inn.y) < 4) return false; }
    var poly = LAKE.map(function (p) { return [p[0] / V3, p[1] / V3]; }), xs = poly.map(function (p) { return p[0]; }), ys = poly.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(null, xs) - 1, x1 = Math.max.apply(null, xs) + 1, y0 = Math.min.apply(null, ys) - 1, y1 = Math.max.apply(null, ys) + 1, w = LV[2].w, hh2 = w * SQ3 / 2, n = 0, sx = 0, sy = 0;
    for (var r = Math.floor(y0 / hh2); r <= Math.ceil(y1 / hh2); r++) for (var q = Math.floor(x0 / w - r / 2); q <= Math.ceil(x1 / w - r / 2); q++) {
      var cc = hc(2, q, r); if (!inPoly(cc[0], cc[1], poly)) continue;
      rawSet(2, K(q, r), 'lake'); n++; sx += cc[0]; sy += cc[1];
    }
    if (n && !S.sites.some(function (s) { return s.id === 'halfwaylake'; })) { S.sites.push({ id: 'halfwaylake', name: 'Halfway Lake', kind: 'mark', x: sx / n, y: sy / n, note: 'painted 10-20 from corridor v3’s outline (the inn on its west shore; the Glowseep drains to it, the chuul sleeps in it)' }); reindex(); }
    return n > 0;
  }
  // THE DOORS' SCHOOLS AND THE MOUNTAIN-FOOT WATER (10-20, once, on load; the seat's placing in miles of version 2, his to move). His words: "please
  // place the doors schools - the one with 5 of the schools, and the rest solo amongst the black mountains, adjusting height as needed (a valley for
  // the 5 or something?) in reference locations we can move later but probably never will"; "can we lower a spot at the foot of the black mountains
  // so the bog and the glowseep have a thin layer all the way to the glowseep section we harvest". The realm (TarlynsPit/wiki/the-doors.md,
  // black-mountains.md 215-237, glowseep.md 17): the five-school valley -- Enchantment (keyholder), Transmutation, Divination, Illusion, Abjuration,
  // "the northernmost post of human civilization" -- and the farm valley beside it, the Council of Mages' demesne; Conjuration's hub is his The DOORS;
  // Thresholding Hold, the Necro school's seat, "the other frost-giant lair, west coast above the Black"; the Furnace, Evocation's seat "on the
  // geothermal seam, a day from Thresholding Hold"; the Sealward, Abjuration's cold station at the ice line; the Glowseep "against the range's
  // southern foot immediately below the Guano Galleries' block", its water draining south to Halfway Lake.
  var SEEDED = false;
  function seedDoors() {
    var has = {}, hasK = {}; S.sites.forEach(function (s) { has[s.id] = 1; }); S.peaks.forEach(function (p) { hasK[p.id] = 1; });
    var note = 'the seat’s placing 10-20 (his “reference locations we can move later but probably never will”); ';
    var site = function (id, name, kind, x, y, n) { if (!has[id]) S.sites.push({ id: id, name: name, kind: kind, x: x, y: y, note: note + n }); };
    var lift = function (o) { if (!hasK[o.id]) S.peaks.push(o); };
    // the five-school valley, its floor a livable 2,000-odd feet down among the black mountains, north-east of the hub toward the coast
    var V = [[97.5, 6.2], [103.5, 8.9], [110, 12.2]], at = function (t, off) {
      var L = t * 2, i = Math.min(1, Math.floor(L)), u = L - i, a = V[i], b = V[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy);
      return [a[0] + dx * u - dy / n * off, a[1] + dy * u + dx / n * off];
    };
    lift({ id: 'v-five', name: 'the five-school valley', pts: V, h: -3600, r: 2.6 });
    [['sch-abj', 'Abjuration', 0.08, 0.8], ['sch-trans', 'Transmutation', 0.29, -0.8], ['sch-ench', 'Enchantment (the keyholder)', 0.5, 0.7], ['sch-div', 'Divination', 0.71, -0.8], ['sch-ill', 'Illusion', 0.92, 0.8]]
      .forEach(function (s) { var p = at(s[2], s[3]); site(s[0], s[1], 'school', p[0], p[1], 'the five-school valley (the-doors.md 34)'); });
    lift({ id: 'v-farm', name: 'the farm valley', pts: [[103.6, 13.6], [106.4, 15.1], [109.2, 16.6]], h: -3000, r: 1.8 });
    site('farmvalley', 'the farm valley (the Granger)', 'hamlet', 106.4, 15.1, 'the Council of Mages’ demesne, coinless by design (the-doors.md 35)');
    // the solo seats
    site('thresholding', 'Thresholding Hold (Necromancy)', 'school', 24, 14, 'the west hold: the Necro school’s seat, the other frost-giant lair, west coast above the Black (black-mountains.md 215); Vindicar’s School of Thresholding');
    lift({ id: 'k-thresh', name: 'Thresholding Hold’s height', x: 24, y: 14, h: 1200, r: 2.5 });
    site('furnace', 'the Furnace (Evocation)', 'school', 35.2, 18, 'Evocation’s seat on the geothermal seam, a day from Thresholding Hold (black-mountains.md 224); the Galleries module’s “a day up the mountain” repaired to fit, 10-20 (his “module repair”)');
    lift({ id: 'k-furnace', name: 'the Furnace’s hollow', x: 35.2, y: 18, h: -900, r: 2 });
    site('sealward', 'the Sealward (Abjuration)', 'school', 60, 3, 'Abjuration’s cold station at the ice line, over the survivor giants’ country (black-mountains.md 225)');
    lift({ id: 'k-seal', name: 'the ice line', x: 60, y: 3, h: 2800, r: 3 });
    // the mountain-foot water: the bogs to the Glowseep, a shallow wet trough along the range's foot
    lift({ id: 'v-foot', name: 'the mountain-foot water', water: true, h: 0, level: [420, 320], r: 1.6, // (a water table falling east: the seep drains on south to Halfway Lake, lower still)
      pts: [[34, 28.5], [46, 27.5], [58, 28.5], [68, 30.5], [78, 31.2], [88, 31.2], [96, 31.5], [101, 32.6], [104, 34.2]] });
    site('glowseep', 'the Glowseep (the light-crews’ harvest)', 'mark', 103.2, 33.6, 'immediately below the Guano Galleries’ block, its water draining south to Halfway Lake (glowseep.md 17)');
    S.seeded = S.seeded || {}; S.seeded.doors1020 = true; reindex(); return true;
  }
  // THE COLDRIDGE ROUTE (10-20; his "the coldridge route I'm leaning on you the most for"): RULED 10-17 "3 days ... due to mountain and weather -
  // alternately the road i drew is inaccurate because of switchbacks". The seat's shaping, once, on load: the road is DIFFICULT (a steep mountain
  // road, the SRD's half pace -- ours, the SRD names no roads that are), and its climb to the Doors is drawn in switchbacks until it reads three
  // wagon-days, 25.5 mi at 17 a day counted twice. His own points are kept on the road as `drawn`.
  var SHAPED = false;
  function shapeColdridge(P) {
    var pts = ptsOf(P); if (pts.length < 2) return false;
    var len = 0, i; for (i = 0; i + 1 < pts.length; i++) len += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    var cart = +S.pace.cart || 17, want = 3 * cart / 2; // (three wagon-days of going, counted twice: the road's own length)
    P.drawn = P.pts.slice(); P.difficult = true;
    if (len >= want - 0.05) return true;
    // the switchbacks go on the climb: the last K miles to the Doors, each run s long, swinging a to either side (a found so the whole reads `want`)
    var K = Math.min(len - 1, Math.max(4, (want - len) * 2.6)), s = 0.45, from = len - K;
    var zig = function (a) {
      var out = [P.pts[0]], acc = 0, side = 1;
      for (var j = 0; j + 1 < pts.length; j++) {
        var A = pts[j], B = pts[j + 1], L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L, t = Math.max(0, from - acc);
        while (t + s < L - s * 0.5) { t += s; out.push([A[0] + ux * t - uy * a * side, A[1] + uy * t + ux * a * side]); side = -side; }
        acc += L; out.push(P.pts[j + 1]);
      }
      return out;
    };
    var lenOf = function (q) { var p = q.map(ptOf), n = 0; for (var j = 0; j + 1 < p.length; j++) n += Math.hypot(p[j + 1][0] - p[j][0], p[j + 1][1] - p[j][1]); return n; };
    var lo = 0, hi = 3;
    for (i = 0; i < 40; i++) { var mid = (lo + hi) / 2; if (lenOf(zig(mid)) < want) lo = mid; else hi = mid; }
    P.pts = zig((lo + hi) / 2); return true;
  }
  var saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 250); }
  function saveNow(viewOnly) {
    S.view = { cx: view.cx, cy: view.cy, z: view.z, L: view.L };
    if (!viewOnly) S.saved = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { msg('Could not keep it in this browser (' + e.message + ') -- EXPORT now.', true); }
  }
  var viewT = 0;
  function saveView() { clearTimeout(viewT); viewT = setTimeout(function () { saveNow(true); }, 400); }
  // undo: a paint stroke is its list of changes; anything else is the places, roads, terrains and underlays before and after
  function body() { return JSON.stringify({ terr: S.terr, sites: S.sites, paths: S.paths, under: S.under, peaks: S.peaks }); }
  function begin() { if (!OP) OP = { paint: [], b: body() }; }
  function rawSet(L, k, t) {
    var b = S.paint[L][k] || null; t = t || null; if (b === t) return b;
    VER++; if (t) S.paint[L][k] = t; else delete S.paint[L][k];
    if (L > 1 && !b && t) bump(L, k, 1); if (L > 1 && b && !t) bump(L, k, -1);
    return b;
  }
  function setPaint(L, k, t) { var b = S.paint[L][k] || null; if (b === (t || null)) return; rawSet(L, k, t); if (OP) OP.paint.push([L, k, b, t || null]); }
  function commit() {
    if (!OP) return;
    var a = body(), rec = { paint: OP.paint, b: OP.b !== a ? OP.b : null, a: OP.b !== a ? a : null }; OP = null;
    if (rec.paint.length || rec.b) { UNDO.push(rec); if (UNDO.length > 300) UNDO.shift(); REDO = []; save(); }
    panels(); draw();
  }
  function snap(j) { var o = JSON.parse(j); S.terr = o.terr; S.sites = o.sites; S.paths = o.paths; S.under = o.under; S.peaks = o.peaks || []; reindex(); }
  function undo() {
    var rec = UNDO.pop(); if (!rec) return msg('nothing to undo');
    for (var i = rec.paint.length - 1; i >= 0; i--) rawSet(rec.paint[i][0], rec.paint[i][1], rec.paint[i][2]);
    if (rec.b) snap(rec.b); REDO.push(rec); fixSel(); save(); panels(); draw();
  }
  function redo() {
    var rec = REDO.pop(); if (!rec) return msg('nothing to redo');
    rec.paint.forEach(function (c) { rawSet(c[0], c[1], c[3]); });
    if (rec.a) snap(rec.a); UNDO.push(rec); fixSel(); save(); panels(); draw();
  }
  function fixSel() { if (SEL.site && !SB[SEL.site]) SEL.site = null; if (SEL.path && !pathBy(SEL.path)) { SEL.path = null; SEL.vtx = -1; } }

  // the terrain a hex shows, and where it comes from
  function effIn(paint, L, q, r) {
    for (var l = L; l >= 1; l--) { var t = paint[l][K(q, r)]; if (t) return { t: t, L: l, q: q, r: r }; if (l > 1) { var p = up(l, q, r); q = p[0]; r = p[1]; } }
    return null;
  }
  function effAt(L, q, r) { return effIn(S.paint, L, q, r); }

  // ---------------------------------------------------------------- version 1 to 2: the road four wagon-days (RULED 10-17). Everything drawn over
  // corridor v3 grows GROW times about v3's corner: places, road points, the paint at all three levels. Each level keeps its look: a new hex takes
  // what the old map showed at its own level where its centre falls (centre / GROW), and is painted only where that differs from its new parent;
  // a mile hex is filled in 330 ft hexes only where the old map had 330 ft paint near it. The two Silverton maps are true scale: they keep their
  // size and move with Silverton (the seat's lean, 10-20).
  function grow(o) {
    var F = GROW, P1 = o.paint, sv = (o.sites || []).filter(function (s) { return s.id === 'silverton'; })[0];
    [1, 2, 3].forEach(function (L) { P1[L] = P1[L] || {}; });
    // his Coldridge Route, drawn before its two places were set: its ends bound to the Galleries junction and The DOORS (10-20, his "sounds like my
    // sloppy drawing being addressed")
    (o.paths || []).forEach(function (P) {
      if (!/coldridge/i.test(P.name || '') || P.pts.length < 2) return;
      var bind = function (i, test) {
        var p = P.pts[i]; if (typeof p === 'string') return;
        (o.sites || []).forEach(function (s) { if (test(s) && Math.hypot(s.x - p[0], s.y - p[1]) < 0.6) P.pts[i] = s.id; });
      };
      bind(0, function (s) { return s.id === 'jct'; }); bind(P.pts.length - 1, function (s) { return /doors/i.test(s.name); });
    });
    (o.under || []).forEach(function (u) {
      if (u.id === 'corridor') { u.pxmi /= F; u.x0 *= F; u.y0 *= F; }
      else if (sv) { u.x0 += sv.x * (F - 1); u.y0 += sv.y * (F - 1); } // (where it stood from Silverton, kept: Silverton has not grown yet here)
      else { u.x0 *= F; u.y0 *= F; }
    });
    (o.sites || []).forEach(function (s) { s.x *= F; s.y *= F; });
    (o.paths || []).forEach(function (P) { P.pts = P.pts.map(function (p) { return typeof p === 'string' ? p : [p[0] * F, p[1] * F]; }); });
    if (o.view) { o.view.cx *= F; o.view.cy *= F; o.view.z /= F; }
    // the paint: where the old map had any, a box around it, grown
    var box = [1e9, 1e9, -1e9, -1e9], in1 = {}, in2 = {};
    [1, 2, 3].forEach(function (L) {
      Object.keys(P1[L]).forEach(function (k) {
        var h = unK(k), c = hc(L, h[0], h[1]);
        box[0] = Math.min(box[0], c[0]); box[1] = Math.min(box[1], c[1]); box[2] = Math.max(box[2], c[0]); box[3] = Math.max(box[3], c[1]);
        if (L === 3) { var p2 = up(3, h[0], h[1]); in2[K(p2[0], p2[1])] = 1; }
      });
    });
    var N = { 1: {}, 2: {}, 3: {} };
    if (box[0] > box[2]) { o.paint = N; o.v = 2; o.grown = { from: 1, by: F, at: new Date().toISOString() }; return o; }
    var pad = 6, x0 = (box[0] - pad) * F, y0 = (box[1] - pad) * F, x1 = (box[2] + pad) * F, y1 = (box[3] + pad) * F;
    var old = function (L, c) { var h = at(L, c[0] / F, c[1] / F), e = effIn(P1, L, h[0], h[1]); return e ? e.t : null; };
    var w = LV[1].w, hh = w * SQ3 / 2, ones = [];
    for (var r = Math.floor(y0 / hh); r <= Math.ceil(y1 / hh); r++) for (var q = Math.floor(x0 / w - r / 2); q <= Math.ceil(x1 / w - r / 2); q++) {
      var t1 = old(1, hc(1, q, r)); if (t1) N[1][K(q, r)] = t1; ones.push([q, r, t1]);
    }
    var k2 = kids(LV[2].n), k3 = kids(LV[3].n), R2 = LV[2].w / SQ3;
    ones.forEach(function (o1) {
      k2.forEach(function (d) {
        var q2 = LV[2].n * o1[0] + d[0], r2 = LV[2].n * o1[1] + d[1], c2 = hc(2, q2, r2), t2 = old(2, c2);
        if (t2 && t2 !== o1[2]) N[2][K(q2, r2)] = t2;
        var e2 = t2 || o1[2], near = false; // (330 ft paint in the old map under this mile hex: its centre or a corner)
        for (var i = -1; i < 6 && !near; i++) {
          var a = (30 + 60 * i) * Math.PI / 180, px = i < 0 ? c2[0] : c2[0] + R2 * Math.cos(a), py = i < 0 ? c2[1] : c2[1] + R2 * Math.sin(a), oh = at(2, px / F, py / F);
          if (in2[K(oh[0], oh[1])]) near = true;
        }
        if (!near) return;
        k3.forEach(function (d3) {
          var q3 = LV[3].n * q2 + d3[0], r3 = LV[3].n * r2 + d3[1], t3 = old(3, hc(3, q3, r3));
          if (t3 && t3 !== e2) N[3][K(q3, r3)] = t3;
        });
      });
    });
    o.paint = N; o.v = 2; o.grown = { from: 1, by: F, at: new Date().toISOString() };
    return o;
  }
  function terrAtMi(x, y) { var p = at(3, x, y), e = effAt(3, p[0], p[1]); return e ? e.t : null; }
  function pathBy(id) { for (var i = 0; i < S.paths.length; i++) if (S.paths[i].id === id) return S.paths[i]; return null; }
  function ptOf(p) { if (typeof p === 'string') { var s = SB[p]; return s ? [s.x, s.y] : null; } return p; }
  function ptsOf(P) { return P.pts.map(ptOf).filter(Boolean); }

  // ---------------------------------------------------------------- ALTITUDE (10-20, the world map seat; Griz: "Can you altitude the hexmap via html, i.e.
  // lift specific mountain and pull up nearby hexes through some kind of fractal map, hill the knoll hills etc - which we hope to visually use as the
  // world map?"; his "excellent" to LIFT and "precisely" to the two looks). A height in feet at any point: the ground his paint says (each terrain's
  // height and roughness, blended over a few miles so a range rises out of its foothills), a fractal on it (rolling noise on soft ground, ridges on
  // rough), his LIFTs (peaks kept in miles, like places: every level shows them), and the roads' beds (a road is graded along itself, a river cuts).
  function hash(i, j, s) { var h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function vnoise(x, y, s) {
    var i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    var a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
  }
  function fbm(x, y, s, oct) { var t = 0, amp = 0.5, f = 1, n = 0; for (var o = 0; o < oct; o++) { t += amp * vnoise(x * f, y * f, s + o * 17); n += amp; amp *= 0.5; f *= 2.03; } return t / n; }
  function ridged(x, y, s, oct) {
    var t = 0, amp = 0.5, f = 1, n = 0, w = 1;
    for (var o = 0; o < oct; o++) { var r = 1 - Math.abs(vnoise(x * f, y * f, s + o * 31)); r *= r * w; w = Math.min(1, r * 2); t += amp * r; n += amp; amp *= 0.5; f *= 2.1; }
    return t / n;
  }
  var isWet = function (t) { return t === 'sea' || t === 'lake'; };
  // the blended ground: a raster over the paint, 0.6 mi a cell, each terrain's height and roughness box-blurred three times (about 2.7 mi)
  var AR = null, ARV = -1, ART = 0, arT = 0;
  function boxLine(a, off, st, n, r, tmp) {
    var s = 0, i; for (i = -r; i <= r; i++) s += a[off + st * Math.min(n - 1, Math.max(0, i))];
    for (i = 0; i < n; i++) { tmp[i] = s / (2 * r + 1); s += a[off + st * Math.min(n - 1, i + r + 1)] - a[off + st * Math.max(0, i - r)]; }
    for (i = 0; i < n; i++) a[off + st * i] = tmp[i];
  }
  function blur(a, nx, ny, r) { var tmp = new Float32Array(Math.max(nx, ny)); for (var p = 0; p < 3; p++) { for (var j = 0; j < ny; j++) boxLine(a, j * nx, 1, nx, r, tmp); for (var i = 0; i < nx; i++) boxLine(a, i, nx, ny, r, tmp); } }
  function buildAR() {
    var b = [1e9, 1e9, -1e9, -1e9];
    [1, 2, 3].forEach(function (L) { for (var k in S.paint[L]) { var h = unK(k), c = hc(L, h[0], h[1]); if (c[0] < b[0]) b[0] = c[0]; if (c[1] < b[1]) b[1] = c[1]; if (c[0] > b[2]) b[2] = c[0]; if (c[1] > b[3]) b[3] = c[1]; } });
    if (b[0] > b[2]) b = [0, 0, 100, 60];
    var cs = 0.6, x0 = b[0] - 12, y0 = b[1] - 12, nx = Math.ceil((b[2] + 12 - x0) / cs), ny = Math.ceil((b[3] + 12 - y0) / cs), n = nx * ny;
    var A = new Float32Array(n), R = new Float32Array(n), W = new Float32Array(n);
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
      var t = terrAtMi(x0 + (i + 0.5) * cs, y0 + (j + 0.5) * cs), T = t && TB[t], o = j * nx + i, w = !T ? 0.3 : t === 'lake' || +T.cut ? 0.02 : 1; // (a lake or a cut takes the land round it)
      W[o] = w; A[o] = (T ? +T.alt || 0 : 200) * w; R[o] = (T ? +T.rough || 0 : 50) * w;
    }
    blur(A, nx, ny, 4); blur(R, nx, ny, 4); blur(W, nx, ny, 4);
    for (var o2 = 0; o2 < n; o2++) { var ww = W[o2] || 1e-6; A[o2] /= ww; R[o2] /= ww; }
    AR = { x0: x0, y0: y0, cs: cs, nx: nx, ny: ny, A: A, R: R };
  }
  function ar() { // (rebuilt when the paint changes, at most every 0.6 s while he paints; the view catches up after)
    if (!AR || (ARV !== VER && Date.now() - ART > 600)) { buildAR(); ARV = VER; ART = Date.now(); }
    else if (ARV !== VER && !arT) arT = setTimeout(function () { arT = 0; HSIG = ''; LAYERKEY = ''; draw(); }, 650);
    return AR;
  }
  function bil(a, x, y) {
    var g = AR, fx = (x - g.x0) / g.cs - 0.5, fy = (y - g.y0) / g.cs - 0.5, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
    var cl = function (k, n) { return k < 0 ? 0 : k >= n ? n - 1 : k; }, I0 = cl(i, g.nx), I1 = cl(i + 1, g.nx), J0 = cl(j, g.ny) * g.nx, J1 = cl(j + 1, g.ny) * g.nx;
    return (a[J0 + I0] * (1 - u) + a[J0 + I1] * u) * (1 - v) + (a[J1 + I0] * (1 - u) + a[J1 + I1] * u) * v;
  }
  // a lift is a point (x, y) or a LINE (pts: a valley, a ridge, a trough along a range's foot): h ft over r mi either side; a sink has a flat floor
  // and calms the ground's fractal on it (a livable valley floor), and a WET one holds a thin sheet of water on its floor
  function liftBox(p) {
    if (!p.pts) return [p.x - p.r * 1.5, p.y - p.r * 1.5, p.x + p.r * 1.5, p.y + p.r * 1.5];
    var b = [1e9, 1e9, -1e9, -1e9]; p.pts.forEach(function (q) { b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); });
    var m = p.r * 1.5; return [b[0] - m, b[1] - m, b[2] + m, b[3] + m];
  }
  function liftMid(p) { if (!p.pts) return [p.x, p.y]; var a = p.pts[Math.floor((p.pts.length - 1) / 2)], b = p.pts[Math.ceil((p.pts.length - 1) / 2)]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
  var PW = 0, PC = 0, PL = []; // (the last point's wet, calm and levels, read by hRaw and hexH)
  function lvlOf(p) { return Array.isArray(p.level) ? p.level : [+p.level, +p.level]; }
  function peaksAt(x, y) { // his LIFTs: each a height over a spread, its edge and its spurs fractal ("pull up nearby hexes through some kind of fractal map")
    var h = 0, P = S.peaks || []; PW = 0; PC = 0; PL = [];
    for (var i = 0; i < P.length; i++) {
      var p = P[i], r = +p.r || 1, hh = +p.h || 0, d, s = 0;
      if (p.pts) {
        var bx = liftBox(p); if (x < bx[0] || y < bx[1] || x > bx[2] || y > bx[3]) continue;
        d = 1e9; var acc = 0, tot = 0, at0 = 0;
        for (var j = 0; j + 1 < p.pts.length; j++) {
          var sl = Math.hypot(p.pts[j + 1][0] - p.pts[j][0], p.pts[j + 1][1] - p.pts[j][1]), sg = segD([x, y], p.pts[j], p.pts[j + 1]);
          if (sg[0] < d) { d = sg[0]; at0 = acc + sg[1] * sl; } acc += sl;
        }
        tot = acc; s = tot ? at0 / tot : 0; // (how far along the line: a level runs from its first end to its last)
      } else { if (Math.abs(x - p.x) > r * 1.5 || Math.abs(y - p.y) > r * 1.5) continue; d = Math.hypot(x - p.x, y - p.y); }
      var warp = 1 + 0.3 * fbm(x / r * 1.3 + 7.1 * i, y / r * 1.3, 77, 4), u = d / (r * warp); if (u >= 1) continue;
      var sink = hh < 0 || p.level != null, fl = sink ? 0.35 : 0, f = u <= fl ? 1 : 1 - Math.pow((u - fl) / (1 - fl), 2); f *= f;
      if (p.level != null) { var lv = lvlOf(p); PL.push([lv[0] + (lv[1] - lv[0]) * s, f]); } // (a level: the ground brought to it, a water table)
      else h += hh * f * (hh < 0 ? 1 : 0.7 + 0.6 * ridged(x / r * 2.5, y / r * 2.5, 300 + i, 5));
      if (sink) PC = Math.max(PC, f * 0.9);
      if (p.water && f > 0.62) PW = 1;
    }
    return h;
  }
  function hRaw(x, y, tk) {
    ar(); if (tk === undefined) tk = terrAtMi(x, y);
    var b = bil(AR.A, x, y), rr = bil(AR.R, x, y);
    if (tk === 'sea') { PW = 0; return 0; }
    if (tk === 'lake') { PW = 0; return Math.max(0, b - 40); } // (a lake lies flat a little under the land round it)
    var T = tk && TB[tk], sd = +S.opts.seed || 1, h, R;
    if (T && +T.cut) { h = b - +T.cut; R = +T.rough || 0; } // (a cut: under the land round it, its banks rising on either side)
    else { var own = T ? +T.own : 0.45, la = T ? +T.alt : b, lr = T ? +T.rough : rr; h = b + own * (la - b); R = rr + own * (lr - rr); }
    var lift = peaksAt(x, y), m = Math.max(0, Math.min(1, (R - 400) / 1600));
    h += (1 - PC) * R * ((1 - m) * fbm(x / 4.5, y / 4.5, sd, 8) + m * (2.2 * ridged(x / 11, y / 11, sd + 101, 8) - 0.9)); // (rolling hills a few miles across; ridges on the rough)
    h += lift;
    for (var k = 0; k < PL.length; k++) h += (PL[k][0] - h) * PL[k][1];
    PLIFT = lift;
    return tk === 'rift' || (T && +T.cut) ? h : Math.max(10, h);
  }
  // the roads' beds: a road or track graded along itself (its heights smoothed over about two miles each way), a river a little under the lowest
  // ground near it; the land within a few hundred yards eased toward the bed. So a road climbs to a pass, and the Coldridge Route's switchbacks
  // climb as one grade.
  var BEDS = null;
  function buildBeds() {
    var g = { cell: 0.5, grid: new Map() };
    S.paths.forEach(function (P) {
      var pts = ptsOf(P); if (pts.length < 2) return;
      var river = P.kind === 'river', smp = [];
      for (var i = 0; i + 1 < pts.length; i++) {
        var A = pts[i], B = pts[i + 1], L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.ceil(L / 0.2));
        for (var j = 0; j < n; j++) { var t = j / n, x = A[0] + (B[0] - A[0]) * t, y = A[1] + (B[1] - A[1]) * t; smp.push([x, y, cityOn(x, y, hRaw(x, y))]); }
      }
      var e = pts[pts.length - 1]; smp.push([e[0], e[1], cityOn(e[0], e[1], hRaw(e[0], e[1]))]); // (graded on the ground a town sits on, 10-28: the raw mountain front behind Silverton had lifted the roads out of it)
      // (a road graded `even` -- the Coldridge's hairpins, 10-31 -- keeps its window even at its ends, so it starts and ends on its own ground: a window cut short at an
      // end had lifted the junction's end of the climb to the average of the two miles above it, some 560 ft)
      var W = river ? 4 : 10, sym = P.grade === 'even', bed = smp.map(function (s, i) {
        var w = sym ? Math.min(W, i, smp.length - 1 - i) : W;
        var a = 0, n = 0, lo = 1e9; for (var k = Math.max(0, i - w); k <= Math.min(smp.length - 1, i + w); k++) { a += smp[k][2]; n++; if (smp[k][2] < lo) lo = smp[k][2]; }
        return river ? lo - 60 : a / n;
      });
      // a river only runs downhill (10-28, the maps window, on his "you're good to move and reshape things to add realism that fits the wiki"; the realm's river
      // "runs east to the sea, falls and ponds", TarlynsPit/wiki/silverton.md): from its higher end to its lower, its bed never climbs -- level where the land
      // would lift it (a pond), dropping where the land falls away (a fall) -- and never under the sea
      if (river && bed.length > 1) {
        var dn = bed[0] >= bed[bed.length - 1], i0 = dn ? 0 : bed.length - 1, st = dn ? 1 : -1, m = Math.max(0, bed[i0]);
        for (var ri = i0; ri >= 0 && ri < bed.length; ri += st) { m = Math.max(0, Math.min(m, bed[ri])); bed[ri] = m; }
      }
      smp.forEach(function (s, i) {
        var gk = Math.floor(s[0] / g.cell) + ',' + Math.floor(s[1] / g.cell), list = g.grid.get(gk); if (!list) g.grid.set(gk, list = []);
        list.push([s[0], s[1], bed[i], river]);
      });
    });
    BEDS = g;
  }
  function bedAt(x, y, h) {
    var g = BEDS; if (!g) return h;
    var ci = Math.floor(x / g.cell), cj = Math.floor(y / g.cell), best = null, bd = 0.45;
    for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) {
      var L = g.grid.get((ci + di) + ',' + (cj + dj)); if (!L) continue;
      for (var k = 0; k < L.length; k++) { var e = L[k], d = Math.hypot(e[0] - x, e[1] - y); if (d < bd) { bd = d; best = e; } }
    }
    if (!best) return h;
    var w = 1 - bd / (best[3] ? 0.3 : 0.45); if (w <= 0) return h;
    if (best[3]) { w = Math.min(1, w * 1.25); return Math.min(h, h + (best[2] - h) * w * w); } // (a river's own line is its bed, 10-28: it had kept a tenth of the land beside it)
    w = w * w * 0.9; return h + (best[2] - h) * w;
  }
  var PLIFT = 0;
  // a city sits on its own ground (his "1 yes", 10-20): the land within a mile brought to the town ground's height, with the lifts it is under
  // (a city only: a place of kind town is any new place's kind, and the Doors' hub stands up the mountain). PLIFT is the lifts at the point hRaw read last
  function cityOn(x, y, h) {
    var TT = TB.town, ta = Math.max(10, (TT ? +TT.alt : 300) + PLIFT); // (never under the sea: 10-28, a sink beside Silverton had taken it to -530 ft)
    for (var si = 0; si < S.sites.length; si++) {
      var st = S.sites[si]; if (st.kind !== 'city') continue;
      var R0 = 1.1, dd = Math.hypot(x - st.x, y - st.y); if (dd >= R0) continue;
      var w = dd < R0 * 0.45 ? 1 : 1 - Math.pow((dd - R0 * 0.45) / (R0 * 0.55), 2); h += (ta - h) * w * w * 0.95;
    }
    return h;
  }
  function hAt(x, y, tk) {
    if (tk === undefined) tk = terrAtMi(x, y);
    var h = hRaw(x, y, tk); if (isWet(tk)) return h;
    var pl = PLIFT; h = bedAt(x, y, h); PLIFT = pl;
    return cityOn(x, y, h);
  }
  // the caches: a hex's height and its shown ground, cleared when the paint, the roads, the lifts or the seed change
  var HC = new Map(), DT = new Map(), HSIG = '';
  function sigOf() { return VER + '|' + S.opts.seed + '|' + JSON.stringify(S.peaks) + '|' + JSON.stringify(S.paths) + '|' + JSON.stringify(S.sites); }
  function hcheck() { var s = sigOf(); if (s !== HSIG) { HC.clear(); DT.clear(); HSIG = s; LAYERKEY = ''; buildBeds(); } }
  function dirtyAround(x, y, R) { // (a lift dragged: only the hexes it reaches are measured again)
    HC.forEach(function (v, k) { if (Math.abs(v[1] - x) < R && Math.abs(v[2] - y) < R) HC.delete(k); });
    HSIG = sigOf(); LAYERKEY = '';
  }
  function dirtyLift(p) { var b = liftBox(p), m = 1; HC.forEach(function (v, k) { if (v[1] > b[0] - m && v[2] > b[1] - m && v[1] < b[2] + m && v[2] < b[3] + m) HC.delete(k); }); HSIG = sigOf(); LAYERKEY = ''; }
  function domT(L, q, r) { // the ground a hex shows: its own (or its parent's), or where he painted finer inside it, the most of what is there
    var k = K(q, r);
    if (L < 3 && DC[L].get(k)) {
      var ck = L + '|' + k, v = DT.get(ck); if (v !== undefined) return v;
      var n = LV[L + 1].n, cnt = {}, best = null, bn = 0;
      kids(n).forEach(function (c) { var t = domT(L + 1, n * q + c[0], n * r + c[1]); if (t) { cnt[t] = (cnt[t] || 0) + 1; if (cnt[t] > bn) { bn = cnt[t]; best = t; } } });
      DT.set(ck, best); return best;
    }
    var e = effAt(L, q, r); return e ? e.t : null;
  }
  function hexE(L, q, r) { // [height, x, y, wet]
    var k = L + '|' + q + ',' + r, v = HC.get(k); if (v) return v;
    var c = hc(L, q, r), t = domT(L, q, r); if (!t && S.opts.fill && FL) t = fillAt(FL, c[0], c[1]); // (FILL: an unpainted hex stands at the height the bake gives it)
    var h = hAt(c[0], c[1], t); v = [h, c[0], c[1], PW]; HC.set(k, v); return v;
  }
  function hexH(L, q, r) { return hexE(L, q, r)[0]; }
  function shadeOf(L, q, r, ex) { // light from the north-west, high: 1 on the flat
    var w = LV[L].w, gx = (hexH(L, q + 1, r) - hexH(L, q - 1, r)) / (2 * w), gy = (hexH(L, q, r + 1) + hexH(L, q - 1, r + 1) - hexH(L, q + 1, r - 1) - hexH(L, q, r - 1)) / (2 * w * SQ3);
    var k = ex / 5280, nl = Math.sqrt(gx * gx * k * k + gy * gy * k * k + 1), d = (0.503 * gx * k + 0.503 * gy * k + 0.704) / nl / 0.704;
    return Math.round(Math.max(0.42, Math.min(1.4, d)) * 16) / 16;
  }
  var RGB = {};
  function rgbOf(c, deep) {
    if (RGB[c]) return RGB[c];
    var m = /^#([0-9a-f]{6})$/i.exec(c);
    if (!m) { if (deep) return [255, 0, 255]; var g = document.createElement('canvas').getContext('2d'); g.fillStyle = '#ff00ff'; g.fillStyle = c; return (RGB[c] = rgbOf(g.fillStyle, true)); }
    var n = parseInt(m[1], 16); return (RGB[c] = [n >> 16, (n >> 8) & 255, n & 255]);
  }
  function tone(t, s, h, wall, wet) { // a hex's colour lit: its terrain's, shaded, snow on the highest; a wall the same ground darker and earthier; a wet floor filmed
    var c = toneRGB(t, s, h, wall, wet); return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  }
  function toneRGB(t, s, h, wall, wet) { // (tone's numbers: the world's look image is baked from them)
    var T = TB[t], c = rgbOf(T ? T.color : t ? '#ff00ff' : '#5a5244'), r = c[0], g = c[1], b = c[2]; // (no paint: a dim ground, so the world reads whole)
    if (wall) { r = r * 0.6 + 92 * 0.4; g = g * 0.6 + 74 * 0.4; b = b * 0.6 + 56 * 0.4; }
    if (wet) { r = r * 0.5 + 70 * 0.5; g = g * 0.5 + 132 * 0.5; b = b * 0.5 + 128 * 0.5; s = 0.9 + (s - 1) * 0.3; } // (a thin sheet of water: the ground under it shows)
    r *= s; g *= s; b *= s;
    var sn = wall ? 0 : Math.round(Math.max(0, Math.min(0.75, (h - 7000) / 2600)) * 8) / 8;
    if (sn) { r += (236 - r) * sn; g += (238 - g) * sn; b += (246 - b) * sn; }
    var cl = function (v) { return v < 0 ? 0 : v > 255 ? 255 : v | 0; };
    return [cl(r), cl(g), cl(b)];
  }
  // THE WORLD LOOK: the map tilted, each hex a column at its height, lit, drawn north to south (painter's order); a cam is any window on it --
  // the WORLD view itself, or the iso preview inset over the flat ones (his "if a preview of isometric when working on the flat would probably be great")
  var TILT = 0.62;
  function exagAt(z) { return (+S.opts.exag || 6) * Math.min(1, Math.pow(8 / z, 0.35)); } // (heights drawn taller when far out, nearer true when close in)
  function wlev(z) { for (var L = 3; L >= 1; L--) if (LV[L].w * z >= 13) return L; return 1; }
  function camMain() { return { cx: view.cx, cy: view.cy, z: view.z, W: Wd, H: Ht, E: exagAt(view.z) }; }
  function wproj(cam, x, y, h) { return [(x - cam.cx) * cam.z + cam.W / 2, (y - cam.cy) * cam.z * TILT + cam.H / 2 - h / 5280 * cam.z * cam.E]; }
  var HCO = []; for (var hci = 0; hci < 6; hci++) { var hca = (30 + 60 * hci) * Math.PI / 180; HCO.push([Math.cos(hca) / SQ3, Math.sin(hca) / SQ3]); }
  function worldDraw(g, cam) {
    ar(); var L = wlev(cam.z), w = LV[L].w, hh = w * SQ3 / 2, lmax = 15000 / 5280 * cam.z * cam.E, outline = w * cam.z >= 9;
    var y0 = cam.cy - (cam.H / 2) / (cam.z * TILT) - w, y1 = cam.cy + (cam.H / 2 + lmax) / (cam.z * TILT) + w, x0 = cam.cx - cam.W / 2 / cam.z - w, x1 = cam.cx + cam.W / 2 / cam.z + w;
    var poly = function (path, P) { path.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length; i++) path.lineTo(P[i][0], P[i][1]); path.closePath(); };
    for (var r = Math.floor(y0 / hh); r <= Math.ceil(y1 / hh); r++) {
      var groups = {}, tops = outline ? new Path2D() : null, add = function (col, P) { poly(groups[col] || (groups[col] = new Path2D()), P); };
      for (var q = Math.floor(x0 / w - r / 2); q <= Math.ceil(x1 / w - r / 2); q++) {
        var t = domT(L, q, r), c = hc(L, q, r), fl = !t && S.opts.fill ? fillAt(fillNow(), c[0], c[1]) : null; if (fl) t = fl; // (FILL: the world's ground where he has not painted, a shade darker)
        if (!t && (c[0] < AR.x0 || c[1] < AR.y0 || c[0] > AR.x0 + AR.nx * AR.cs || c[1] > AR.y0 + AR.ny * AR.cs)) continue; // (unpainted ground drawn dim, near the paint)
        var h = hexH(L, q, r), wet = isWet(t), dk = fl ? 0.82 : 1;
        var P = HCO.map(function (o) { return wproj(cam, c[0] + o[0] * w, c[1] + o[1] * w, h); });
        if (!wet) [[0, 1, q, r + 1, 0.62], [1, 2, q - 1, r + 1, 0.82]].forEach(function (f) { // the two south faces, down to the neighbour's top
          var hn = hexH(L, f[2], f[3]); if (hn >= h - 1) return;
          var a = HCO[f[0]], b = HCO[f[1]];
          add(tone(t, f[4] * dk, 0, true), [P[f[0]], P[f[1]], wproj(cam, c[0] + b[0] * w, c[1] + b[1] * w, hn), wproj(cam, c[0] + a[0] * w, c[1] + a[1] * w, hn)]);
        });
        add(tone(t, (wet ? 1 : shadeOf(L, q, r, cam.E)) * dk, h, false, !wet && hexE(L, q, r)[3]), P); if (tops) poly(tops, P);
      }
      Object.keys(groups).forEach(function (col) { g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 0.6; g.fill(groups[col]); g.stroke(groups[col]); });
      if (tops) { g.strokeStyle = 'rgba(20,12,6,.28)'; g.lineWidth = 0.7; g.stroke(tops); }
    }
  }
  function worldMarks(g, cam) { // (the inset's roads and places, on the ground)
    var L = wlev(cam.z), hp = function (x, y) { var a = at(L, x, y); return wproj(cam, x, y, hexH(L, a[0], a[1])); };
    S.paths.forEach(function (P) {
      var pts = ptsOf(P); if (pts.length < 2) return; var st = PSTYLE[P.kind] || PSTYLE.road; g.beginPath();
      for (var i = 0; i + 1 < pts.length; i++) {
        var A = pts[i], B = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) / (LV[L].w * 0.5)));
        for (var j = 0; j <= n; j++) { var s = hp(A[0] + (B[0] - A[0]) * j / n, A[1] + (B[1] - A[1]) * j / n); if (!i && !j) g.moveTo(s[0], s[1]); else g.lineTo(s[0], s[1]); }
      }
      g.setLineDash([]); g.strokeStyle = st.c; g.lineWidth = Math.max(1.2, st.w * 0.6); g.lineJoin = 'round'; g.stroke();
    });
    g.font = 'italic 11px Georgia, serif';
    S.sites.forEach(function (st) {
      var s = hp(st.x, st.y); if (s[0] < -40 || s[0] > cam.W + 40 || s[1] < -20 || s[1] > cam.H + 20) return;
      g.fillStyle = '#efe0b8'; g.strokeStyle = '#2a180a'; g.lineWidth = 1.5; g.beginPath(); g.arc(s[0], s[1], 3.5, 0, 7); g.fill(); g.stroke();
      if (st.kind === 'city' || st.kind === 'castle' || st.kind === 'inn' || st.kind === 'town' || st.kind === 'seat' || st.kind === 'school') { g.lineWidth = 3; g.strokeStyle = 'rgba(30,16,6,.85)'; g.strokeText(st.name, s[0] + 6, s[1] + 4); g.fillStyle = '#f6e9c5'; g.fillText(st.name, s[0] + 6, s[1] + 4); }
    });
  }

  // ---------------------------------------------------------------- the view
  var cv = $('c'), ctx = cv.getContext('2d'), layer = document.createElement('canvas'), lctx = layer.getContext('2d');
  var Wd = 0, Ht = 0, DPR = 1, drawQ = 0;
  function resize() {
    var r = cv.parentNode.getBoundingClientRect(); DPR = window.devicePixelRatio || 1; Wd = r.width; Ht = r.height;
    cv.width = layer.width = Math.max(1, Math.round(Wd * DPR)); cv.height = layer.height = Math.max(1, Math.round(Ht * DPR)); LAYERKEY = ''; draw();
  }
  function isW() { return S.opts.look === 'world'; }
  function zy() { return view.z * (isW() ? TILT : 1); } // (a drag's screen y in miles: the world look is tilted)
  function ptH(x, y) { var L = wlev(view.z), a = at(L, x, y); return hexH(L, a[0], a[1]); } // (the world look's ground under a point: its column's top)
  function toS(x, y, h) {
    if (!isW()) return [(x - view.cx) * view.z + Wd / 2, (y - view.cy) * view.z + Ht / 2];
    return wproj(camMain(), x, y, h == null ? ptH(x, y) : h);
  }
  function toM(sx, sy) {
    if (!isW()) return [(sx - Wd / 2) / view.z + view.cx, (sy - Ht / 2) / view.z + view.cy];
    var E = exagAt(view.z), x = (sx - Wd / 2) / view.z + view.cx, y = 0, h = 0; // (the ground under the cursor: walk the height in, a few times)
    for (var i = 0; i < 5; i++) { y = (sy - Ht / 2 + h / 5280 * view.z * E) / (view.z * TILT) + view.cy; h = ptH(x, y); }
    return [x, y];
  }
  function hexPx(L) { return LV[L].w * view.z; }
  function autoLevel() { // (the level is the zoom's, the same both ways, and the world look draws the same level: his "zoom ... 5 steps in to get to
    // level 2, then stays level 2 as I zoom 5 steps out - hard to know what you're referencing", 10-20)
    var L0 = view.L; view.L = wlev(view.z);
    if (view.L !== L0) { if (SEL.hex && SEL.hex.L !== view.L) SEL.hex = null; panels(); }
  }
  function zoomTo(z, cx, cy) { view.z = Math.max(ZMIN, Math.min(ZMAX, z)); if (cx != null) { view.cx = cx; view.cy = cy; } autoLevel(); draw(); saveView(); }
  function setLevel(L, focus) {
    var c = focus || (SEL.hex ? hc(SEL.hex.L, SEL.hex.q, SEL.hex.r) : [view.cx, view.cy]);
    view.L = L; view.z = Math.max(ZMIN, Math.min(ZMAX, LV[L].px / LV[L].w)); view.cx = c[0]; view.cy = c[1];
    if (SEL.hex && SEL.hex.L !== L) SEL.hex = null; panels(); draw(); saveView();
  }
  function into(h) { // a hex's own level, one finer, centred on it
    if (h.L >= 3) return;
    var c = hc(h.L, h.q, h.r); view.L = h.L + 1; view.z = 300 / LV[h.L].w; view.cx = c[0]; view.cy = c[1]; autoLevel();
    var p = at(view.L, c[0], c[1]); SEL.hex = { L: view.L, q: p[0], r: p[1] }; SEL.site = null; SEL.path = null; SEL.vtx = -1; panels(); draw(); saveView();
  }
  function outOf() {
    if (view.L <= 1) return;
    var c = [view.cx, view.cy];
    if (SEL.hex && SEL.hex.L > 1) { var p = up(SEL.hex.L, SEL.hex.q, SEL.hex.r); SEL.hex = { L: SEL.hex.L - 1, q: p[0], r: p[1] }; c = hc(SEL.hex.L, p[0], p[1]); }
    setLevel(view.L - 1, c);
  }

  function draw() { if (!drawQ) drawQ = requestAnimationFrame(drawNow); }
  function hexPath(c2, L, q, r, grow) {
    var c = hc(L, q, r), i;
    if (isW()) { // (on the column's top)
      var cam = camMain(), h = hexH(L, q, r), w = LV[L].w;
      for (i = 0; i < 6; i++) { var p = wproj(cam, c[0] + HCO[i][0] * w, c[1] + HCO[i][1] * w, h); if (i) c2.lineTo(p[0], p[1]); else c2.moveTo(p[0], p[1]); }
      c2.closePath(); return;
    }
    var s = toS(c[0], c[1]), R = LV[L].w / SQ3 * view.z + (grow || 0);
    for (i = 0; i < 6; i++) { var a = (30 + 60 * i) * Math.PI / 180, x = s[0] + R * Math.cos(a), y = s[1] + R * Math.sin(a); if (i) c2.lineTo(x, y); else c2.moveTo(x, y); }
    c2.closePath();
  }
  function onScreen(L, q, r) { var c = hc(L, q, r), s = toS(c[0], c[1]), rad = LV[L].w * view.z; return s[0] > -rad && s[0] < Wd + rad && s[1] > -rad && s[1] < Ht + rad; }
  function visit(L, fn) {
    var w = LV[L].w, h = w * SQ3 / 2, m0 = toM(0, 0), m1 = toM(Wd, Ht), pad = w;
    var r0 = Math.floor((m0[1] - pad) / h), r1 = Math.ceil((m1[1] + pad) / h);
    for (var r = r0; r <= r1; r++) { var q0 = Math.floor((m0[0] - pad) / w - r / 2), q1 = Math.ceil((m1[0] + pad) / w - r / 2); for (var q = q0; q <= q1; q++) fn(q, r); }
  }
  function drawUnder(u) {
    var rec = IMG[u.id]; if (!u.on || !rec || !rec.ok) return;
    var iw = rec.el.naturalWidth, ih = rec.el.naturalHeight, m0 = toM(0, 0), m1 = toM(Wd, Ht);
    var sx0 = Math.max(0, (m0[0] - u.x0) * u.pxmi), sy0 = Math.max(0, (m0[1] - u.y0) * u.pxmi);
    var sx1 = Math.min(iw, (m1[0] - u.x0) * u.pxmi), sy1 = Math.min(ih, (m1[1] - u.y0) * u.pxmi);
    if (sx1 <= sx0 || sy1 <= sy0) return;
    var a = toS(u.x0 + sx0 / u.pxmi, u.y0 + sy0 / u.pxmi), b = toS(u.x0 + sx1 / u.pxmi, u.y0 + sy1 / u.pxmi);
    ctx.globalAlpha = u.op; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; // (a painting traced, not pixels: v3 under a 330 ft hex is 47 px a pixel)
    ctx.drawImage(rec.el, sx0, sy0, sx1 - sx0, sy1 - sy0, a[0], a[1], b[0] - a[0], b[1] - a[1]); ctx.globalAlpha = 1;
  }
  function fills() {
    var key = [S.opts.look, S.opts.exag, view.cx, view.cy, view.z, Wd, Ht, DPR, VER].join();
    if (key !== LAYERKEY) { LAYERKEY = key; if (isW()) { lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, layer.width, layer.height); lctx.setTransform(DPR, 0, 0, DPR, 0, 0); worldDraw(lctx, camMain()); } else fillLayer(); }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = isW() ? 1 : S.opts.paintOp; ctx.drawImage(layer, 0, 0); ctx.restore();
  }
  function fillLayer() {
    lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, layer.width, layer.height); lctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var groups = {}, rel = S.opts.look === 'relief';
    if (S.opts.fill) fillUnder();
    var walk = function (L, q, r, inh) {
      var k = K(q, r), t = S.paint[L][k] || inh;
      if (L < 3 && DC[L].get(k) && hexPx(L + 1) >= 2.5) {
        var n = LV[L + 1].n, ch = kids(n);
        for (var i = 0; i < ch.length; i++) { var cq = n * q + ch[i][0], cr = n * r + ch[i][1]; if (onScreen(L + 1, cq, cr)) walk(L + 1, cq, cr, t); }
      } else if (t) { var g = rel ? tone(t, isWet(t) ? 1 : shadeOf(L, q, r, 14), hexH(L, q, r), false, !isWet(t) && hexE(L, q, r)[3]) : t; (groups[g] = groups[g] || []).push([L, q, r]); } // (relief: lit from the north-west)
    };
    visit(1, function (q, r) { walk(1, q, r, null); });
    Object.keys(groups).forEach(function (t) {
      var c = rel ? t : TB[t] ? TB[t].color : '#ff00ff'; lctx.fillStyle = c; lctx.strokeStyle = c; lctx.lineWidth = 1; lctx.beginPath();
      groups[t].forEach(function (h) { hexPath(lctx, h[0], h[1], h[2]); }); lctx.fill(); lctx.stroke();
    });
  }
  var HATCH = null;
  function fillUnder() { // (FILL on, the flat looks: each 5-mile hex's ground as the bake gives it, dim and hatched under his paint -- seen where he has not painted)
    var F = fillNow(), groups = {};
    visit(1, function (q, r) { var t = F.g[K(q, r)]; if (t) (groups[t] = groups[t] || []).push([q, r]); });
    if (!HATCH) { var c = document.createElement('canvas'); c.width = c.height = 8; var g = c.getContext('2d'); g.strokeStyle = 'rgba(20,12,6,.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-1, 9); g.lineTo(9, -1); g.stroke(); HATCH = lctx.createPattern(c, 'repeat'); }
    lctx.save(); lctx.globalAlpha = 0.55;
    Object.keys(groups).forEach(function (t) { var p = new Path2D(); groups[t].forEach(function (h) { hexPath(p, 1, h[0], h[1]); }); lctx.fillStyle = TB[t] ? TB[t].color : '#ff00ff'; lctx.fill(p); lctx.fillStyle = HATCH; lctx.fill(p); });
    lctx.restore();
  }
  function contours() { // (relief: a line along each hex edge where the height crosses a step -- 1000 ft at 5 mi, 500 at a mile, 100 at 330 ft; every fifth bold)
    var A = view.L; if (S.opts.look !== 'relief' || !S.opts.contours || hexPx(A) < 5) return;
    var CI = [0, 1000, 500, 100][A], minor = new Path2D(), major = new Path2D(), R = LV[A].w / SQ3 * view.z;
    visit(A, function (q, r) {
      if (!domT(A, q, r)) return;
      var c = hc(A, q, r), s = toS(c[0], c[1]), b = Math.floor(hexH(A, q, r) / CI);
      for (var d = 0; d < 3; d++) {
        var nq = q + DIRS[d][0], nr = r + DIRS[d][1]; if (!domT(A, nq, nr)) continue;
        var bn = Math.floor(hexH(A, nq, nr) / CI); if (bn === b) continue;
        var into = Math.floor(b / 5) !== Math.floor(bn / 5) ? major : minor, a = corner(s, R, DANG[d] - 30), e = corner(s, R, DANG[d] + 30);
        into.moveTo(a[0], a[1]); into.lineTo(e[0], e[1]);
      }
    });
    ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(52,26,8,.5)'; ctx.lineWidth = 1; ctx.stroke(minor);
    ctx.strokeStyle = 'rgba(40,18,4,.9)'; ctx.lineWidth = 2; ctx.stroke(major); ctx.lineCap = 'butt';
  }
  function isoInset() { // the iso preview over the flat looks: the world look under the cursor (or the view's middle), at the view's scale
    if (isW() || !S.opts.iso) return;
    var iw = Math.round(Math.min(440, Wd * 0.38)), ih = Math.round(Math.min(280, Ht * 0.36)), x = Wd - iw - 14, y = Ht - ih - 46;
    if (iw < 120 || ih < 80) return;
    var f = HOV || [view.cx, view.cy], cam = { cx: f[0], cy: f[1], z: view.z, W: iw, H: ih, E: exagAt(view.z) };
    ctx.save(); ctx.fillStyle = '#1b1915'; ctx.fillRect(x, y, iw, ih); ctx.beginPath(); ctx.rect(x, y, iw, ih); ctx.clip(); ctx.translate(x, y);
    worldDraw(ctx, cam); worldMarks(ctx, cam);
    var L = wlev(cam.z), a = at(L, f[0], f[1]), m = wproj(cam, f[0], f[1], hexH(L, a[0], a[1]));
    ctx.strokeStyle = '#ffd23c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(m[0] - 6, m[1]); ctx.lineTo(m[0] + 6, m[1]); ctx.moveTo(m[0], m[1] - 6); ctx.lineTo(m[0], m[1] + 6); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = '#6b5a3c'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 0.5, y - 0.5, iw + 1, ih + 1);
    ctx.font = '11px ui-monospace, Consolas, monospace'; ctx.fillStyle = '#f6e9c5'; ctx.fillText('ISO PREVIEW · I hides it', x + 6, y + 14);
  }
  function corner(s, R, deg) { var a = deg * Math.PI / 180; return [s[0] + R * Math.cos(a), s[1] + R * Math.sin(a)]; }
  function gridLines() {
    var A = view.L; if (!S.opts.grid || hexPx(A) < 6 || isW()) return; // (the world look outlines its own hexes)
    var thin = new Path2D(), mid = new Path2D(), thick = new Path2D(), R = LV[A].w / SQ3 * view.z;
    visit(A, function (q, r) {
      var c = hc(A, q, r), s = toS(c[0], c[1]);
      var p1 = A > 1 ? up(A, q, r) : null, p0 = A > 2 ? up(2, p1[0], p1[1]) : null;
      for (var d = 0; d < 3; d++) {
        var nq = q + DIRS[d][0], nr = r + DIRS[d][1], a = corner(s, R, DANG[d] - 30), b = corner(s, R, DANG[d] + 30), into = thin;
        if (A > 1) {
          var n1 = up(A, nq, nr);
          if (n1[0] !== p1[0] || n1[1] !== p1[1]) {
            into = mid;
            if (A > 2) { var n0 = up(2, n1[0], n1[1]); if (n0[0] !== p0[0] || n0[1] !== p0[1]) into = thick; }
          }
        }
        into.moveTo(a[0], a[1]); into.lineTo(b[0], b[1]);
      }
    });
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,246,226,.30)'; ctx.lineWidth = A === 1 ? 1.1 : 0.8; ctx.stroke(thin);
    ctx.strokeStyle = 'rgba(28,14,4,.80)'; ctx.lineWidth = A === 2 ? 2.2 : 1.6; ctx.stroke(mid);
    ctx.strokeStyle = 'rgba(28,14,4,.95)'; ctx.lineWidth = 3.2; ctx.stroke(thick);
    ctx.lineCap = 'butt';
  }
  var PSTYLE = { road: { c: 'rgba(110,32,16,.95)', w: 4, d: [14, 8] }, track: { c: 'rgba(110,32,16,.9)', w: 2.5, d: [7, 6] }, river: { c: '#4fa3c4', w: 3.5, d: [] } };
  function paths() {
    S.paths.forEach(function (P) {
      var pts = ptsOf(P); if (pts.length < 2) return;
      var st = PSTYLE[P.kind] || PSTYLE.road, sel = SEL.path === P.id;
      if (isW()) { // (on the ground: each leg walked in half-hexes over the columns)
        var dn = [pts[0]], step = LV[wlev(view.z)].w * 0.5;
        for (var i = 0; i + 1 < pts.length; i++) { var A = pts[i], B = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) / step)); for (var j = 1; j <= n; j++) dn.push([A[0] + (B[0] - A[0]) * j / n, A[1] + (B[1] - A[1]) * j / n]); }
        pts = dn;
      }
      ctx.beginPath(); pts.forEach(function (p, i) { var s = toS(p[0], p[1]); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); });
      if (sel) { ctx.setLineDash([]); ctx.strokeStyle = 'rgba(255,214,60,.45)'; ctx.lineWidth = st.w + 8; ctx.lineJoin = 'round'; ctx.stroke(); }
      ctx.setLineDash(st.d); ctx.strokeStyle = st.c; ctx.lineWidth = st.w; ctx.lineJoin = 'round'; ctx.stroke(); ctx.setLineDash([]);
      if (sel) P.pts.forEach(function (p, i) {
        var q = ptOf(p); if (!q) return; var s = toS(q[0], q[1]);
        ctx.fillStyle = i === SEL.vtx ? '#ffd23c' : (typeof p === 'string' ? '#7ad37a' : '#f6e9c5'); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2;
        ctx.beginPath(); if (typeof p === 'string') ctx.arc(s[0], s[1], 6, 0, 7); else ctx.rect(s[0] - 4, s[1] - 4, 8, 8); ctx.fill(); ctx.stroke();
      });
    });
  }
  function glyph(s, kind, on) {
    var x = s[0], y = s[1];
    ctx.lineWidth = 2; ctx.strokeStyle = on ? '#ffd23c' : '#2a180a'; ctx.fillStyle = '#efe0b8'; ctx.beginPath();
    if (kind === 'city') ctx.rect(x - 7, y - 7, 14, 14);
    else if (kind === 'castle') { ctx.moveTo(x, y - 9); ctx.lineTo(x + 8, y + 6); ctx.lineTo(x - 8, y + 6); ctx.closePath(); }
    else if (kind === 'inn') ctx.rect(x - 5, y - 5, 10, 10);
    else if (kind === 'cave') { ctx.arc(x, y + 3, 7, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#2a180a'; }
    else if (kind === 'junction') { ctx.moveTo(x, y - 6); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 6, y); ctx.closePath(); }
    else if (kind === 'seat') { ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y + 5); ctx.lineTo(x - 7, y + 5); ctx.closePath(); ctx.fillStyle = '#b5452a'; }
    else if (kind === 'gulch') { ctx.moveTo(x - 7, y - 5); ctx.lineTo(x - 2, y + 6); ctx.lineTo(x + 2, y + 6); ctx.lineTo(x + 7, y - 5); ctx.lineTo(x + 3, y - 5); ctx.lineTo(x, y + 2); ctx.lineTo(x - 3, y - 5); ctx.closePath(); ctx.fillStyle = '#5a3e26'; } // (a ravine)
    else if (kind === 'school') { ctx.moveTo(x, y - 10); ctx.lineTo(x + 4, y - 4); ctx.lineTo(x + 4, y + 6); ctx.lineTo(x - 4, y + 6); ctx.lineTo(x - 4, y - 4); ctx.closePath(); ctx.fillStyle = '#9b84d0'; } // (a tower)
    else if (kind === 'mark') { ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6); ctx.moveTo(x + 6, y - 6); ctx.lineTo(x - 6, y + 6); ctx.stroke(); return; }
    else ctx.arc(x, y, kind === 'hamlet' ? 4 : 6, 0, 7);
    ctx.fill(); ctx.stroke();
  }
  function sites() {
    S.sites.forEach(function (st) {
      var s = toS(st.x, st.y); if (s[0] < -200 || s[0] > Wd + 200 || s[1] < -40 || s[1] > Ht + 40) return;
      glyph(s, st.kind, SEL.site === st.id);
      if (!S.opts.labels) return;
      var big = st.kind === 'city' || st.kind === 'castle', small = st.kind === 'junction' || st.kind === 'mark' || st.kind === 'cave' || st.kind === 'hamlet';
      // (every place named at every level -- the small ones smaller: his "views that say their 1 hex per 5 mile don't show the guano mine entrance", 10-20)
      ctx.font = (big ? 'italic bold 16px' : small && view.z < 24 ? 'italic 11px' : 'italic 13px') + ' Georgia, serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(30,16,6,.85)'; ctx.fillStyle = '#f6e9c5';
      ctx.strokeText(st.name, s[0] + 11, s[1] + 5); ctx.fillText(st.name, s[0] + 11, s[1] + 5);
    });
  }
  function brushHexes(L, h) { var out = [], R = S.opts.brush; for (var dq = -R; dq <= R; dq++) for (var dr = -R; dr <= R; dr++) if (Math.abs(dq + dr) <= R) out.push([h[0] + dq, h[1] + dr]); return out; }
  function marks() {
    if (SEL.hex) { ctx.beginPath(); hexPath(ctx, SEL.hex.L, SEL.hex.q, SEL.hex.r); ctx.strokeStyle = '#ffd23c'; ctx.lineWidth = 3; ctx.stroke(); }
    if (HOV && (S.opts.tool === 'paint' || S.opts.tool === 'erase' || S.opts.tool === 'select') && hexPx(view.L) >= 4) {
      var hh = at(view.L, HOV[0], HOV[1]), list = S.opts.tool === 'select' ? [hh] : brushHexes(view.L, hh);
      ctx.beginPath(); list.forEach(function (h) { hexPath(ctx, view.L, h[0], h[1]); });
      ctx.strokeStyle = S.opts.tool === 'erase' ? 'rgba(255,90,80,.9)' : 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    var mp = M.pts.concat(M.live && !M.done ? [M.live] : []);
    if (mp.length) {
      ctx.strokeStyle = '#ff5ad2'; ctx.fillStyle = '#ff5ad2'; ctx.lineWidth = 2.5; ctx.beginPath();
      mp.forEach(function (p, i) { var s = toS(p[0], p[1]); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke();
      mp.forEach(function (p) { var s = toS(p[0], p[1]); ctx.beginPath(); ctx.arc(s[0], s[1], 3.5, 0, 7); ctx.fill(); });
      if (mp.length > 1) {
        var last = toS(mp[mp.length - 1][0], mp[mp.length - 1][1]), m = measure(mp);
        ctx.font = 'bold 13px ui-monospace, Consolas, monospace'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.fillStyle = '#ffd6f4';
        var t = m.mi.toFixed(1) + ' mi · foot ' + (m.go / S.pace.foot).toFixed(1) + ' d'; ctx.strokeText(t, last[0] + 10, last[1] - 10); ctx.fillText(t, last[0] + 10, last[1] - 10);
      }
    }
    if (DRAW && DRAW.pts.length) {
      var dp = DRAW.pts.map(ptOf).filter(Boolean).concat(HOV ? [HOV] : []);
      ctx.setLineDash([6, 5]); ctx.strokeStyle = '#ffd23c'; ctx.lineWidth = 2; ctx.beginPath();
      dp.forEach(function (p, i) { var s = toS(p[0], p[1]); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke(); ctx.setLineDash([]);
    }
    if (S.opts.tool === 'lift' || SEL.peak) (S.peaks || []).forEach(function (pk) { // the lifts: a triangle (down for a sink), its height, its spread when chosen
      var mid = liftMid(pk), s = toS(mid[0], mid[1]), on = SEL.peak === pk.id, up = pk.level == null && (+pk.h || 0) >= 0;
      if (pk.pts) { // (a line lift: its line, dashed; its width when chosen)
        ctx.setLineDash([7, 5]); ctx.strokeStyle = on ? 'rgba(255,214,60,.9)' : pk.water ? 'rgba(120,200,210,.8)' : 'rgba(246,233,197,.7)'; ctx.lineWidth = on ? 2.5 : 1.6; ctx.beginPath();
        pk.pts.forEach(function (q, i) { var a = toS(q[0], q[1]); if (i) ctx.lineTo(a[0], a[1]); else ctx.moveTo(a[0], a[1]); }); ctx.stroke();
        if (on) { ctx.setLineDash([]); ctx.strokeStyle = '#ffd23c'; ctx.lineWidth = 2 * pk.r * view.z; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 0.16; ctx.stroke(); ctx.globalAlpha = 1; ctx.lineCap = 'butt'; }
        ctx.setLineDash([]);
      } else if (on) { ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(255,214,60,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(s[0], s[1], pk.r * view.z, pk.r * zy(), 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
      ctx.beginPath(); ctx.moveTo(s[0], s[1] + (up ? -9 : 9)); ctx.lineTo(s[0] + 8, s[1] + (up ? 5 : -5)); ctx.lineTo(s[0] - 8, s[1] + (up ? 5 : -5)); ctx.closePath();
      ctx.fillStyle = on ? '#ffd23c' : up ? '#f6e9c5' : '#8fd0e0'; ctx.strokeStyle = '#2a180a'; ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke();
      var lv = pk.level != null ? lvlOf(pk) : null;
      var t = (pk.pts && pk.name ? pk.name + ' · ' : '') + (lv ? 'level ' + Math.round(lv[0]) + (lv[1] !== lv[0] ? '–' + Math.round(lv[1]) : '') + ' ft' : (up ? '+' : '') + Math.round(+pk.h || 0).toLocaleString() + ' ft') + (on ? ' · ' + (+pk.r) + ' mi' : '');
      ctx.font = '12px ui-monospace, Consolas, monospace'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.fillStyle = on ? '#ffd23c' : '#f6e9c5';
      ctx.strokeText(t, s[0] + 11, s[1] + 4); ctx.fillText(t, s[0] + 11, s[1] + 4);
    });
  }
  function scaleBar() {
    var want = 140 / view.z, steps = [1 / 64, 1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 5, 10, 20, 50], len = steps[0];
    steps.forEach(function (s) { if (s <= want) len = s; });
    var px = len * view.z, x = Wd - px - 18, y = Ht - 18;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x - 6, y - 18, px + 12, 24);
    ctx.strokeStyle = '#f6e9c5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y); ctx.lineTo(x + px, y); ctx.lineTo(x + px, y - 4); ctx.stroke();
    ctx.font = '12px ui-monospace, Consolas, monospace'; ctx.fillStyle = '#f6e9c5'; ctx.textAlign = 'center';
    ctx.fillText(len >= 1 ? len + ' mi' : Math.round(len * 5280) + ' ft', x + px / 2, y - 6); ctx.textAlign = 'start';
  }
  function drawNow() {
    drawQ = 0;
    hcheck();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = isW() ? '#141a1f' : '#24211d'; ctx.fillRect(0, 0, Wd, Ht);
    if (!isW()) S.under.forEach(drawUnder);
    fills(); gridLines(); contours(); paths(); sites(); marks(); isoInset(); scaleBar();
    $('lvl').innerHTML = '<b>LEVEL ' + view.L + '</b> · ' + esc(LV[view.L].long);
  }

  // ---------------------------------------------------------------- hit tests
  function hitSite(sx, sy) { for (var i = S.sites.length - 1; i >= 0; i--) { var s = toS(S.sites[i].x, S.sites[i].y); if (Math.hypot(s[0] - sx, s[1] - sy) <= 10) return S.sites[i]; } return null; }
  function hitVtx(P, sx, sy) { for (var i = P.pts.length - 1; i >= 0; i--) { var q = ptOf(P.pts[i]); if (!q) continue; var s = toS(q[0], q[1]); if (Math.hypot(s[0] - sx, s[1] - sy) <= 8) return i; } return -1; }
  function segD(p, a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0; return [Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy), t]; }
  function hitSeg(P, sx, sy) { // the segment under the cursor: [index of its first point, distance px]
    var best = null;
    for (var i = 0; i + 1 < P.pts.length; i++) {
      var a = ptOf(P.pts[i]), b = ptOf(P.pts[i + 1]); if (!a || !b) continue;
      var d = segD([sx, sy], toS(a[0], a[1]), toS(b[0], b[1]))[0]; if (d <= 7 && (!best || d < best[1])) best = [i, d];
    }
    return best;
  }
  function hitPath(sx, sy) { for (var i = S.paths.length - 1; i >= 0; i--) { var h = hitSeg(S.paths[i], sx, sy); if (h) return S.paths[i]; } return null; }

  // ---------------------------------------------------------------- the measure: the SRD's going (RULED 10-20, his "SRD for world map and book III for
  // snoot-play"): a mile of difficult ground counts two, anything else one; a road or track counts one, a road marked difficult two (the Coldridge
  // Route). Wagons: the SRD moves them at the walkers' paces; the road register's 17 a wagon-day is ours (his "we can author our own fill in")
  function roadGoing(P) { return P.going != null ? +P.going : P.difficult ? 2 : 1; } // (a road's own going: 1 a road, 2 the SRD's difficult, between ours -- 10-20)
  function onRoad(x, y) {
    var hit = null;
    for (var i = 0; i < S.paths.length; i++) {
      var P = S.paths[i]; if (P.kind === 'river') continue; var pts = ptsOf(P);
      for (var j = 0; j + 1 < pts.length; j++) if (segD([x, y], pts[j], pts[j + 1])[0] < 0.25) { if (roadGoing(P) <= 1) return P; hit = P; break; }
    }
    return hit; // (an easy road wins where two meet)
  }
  function measure(pts) {
    var mi = 0, go = 0, wet = false, road = 0;
    for (var i = 0; i + 1 < pts.length; i++) {
      var a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(len / 0.05)), seg = len / n;
      for (var j = 0; j < n; j++) {
        var t = (j + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, cost, rd = onRoad(x, y);
        if (rd) { cost = roadGoing(rd); road += seg; } else { var k = terrAtMi(x, y), T = k && TB[k]; cost = !T ? 1 : !+T.cost ? 0 : T.diff ? 2 : 1; if (!cost) { wet = true; cost = 1; } }
        go += seg * cost; mi += seg;
      }
    }
    return { mi: mi, go: go, wet: wet, road: road };
  }
  function measureText() {
    var mp = M.pts.concat(M.live && !M.done ? [M.live] : []);
    if (mp.length < 2) return 'M, then click along a way (double-click ends; Esc clears)';
    var m = measure(mp), f = +S.pace.foot || 24, c = +S.pace.cart || 17;
    return m.mi.toFixed(1) + ' mi (' + m.road.toFixed(1) + ' on a road) · ' + m.go.toFixed(1) + ' mi of going\n' +
      'on foot ' + (m.go / f).toFixed(2) + ' days at ' + f + '/day\nby wagon ' + (m.go / c).toFixed(2) + ' days at ' + c + '/day' +
      (m.wet ? '\nit crosses water or the impassable (counted as plain)' : '') +
      '\n(the SRD’s going: a mile of difficult ground counts two; a road or track its own going, 1 unless set)';
  }

  // ---------------------------------------------------------------- the mouse
  var HOV = null, drag = null, space = false;
  function evPt(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function paintAt(m) {
    if (hexPx(view.L) < 4) return msg('zoom in to paint level ' + view.L);
    var t = S.opts.tool === 'erase' ? null : S.opts.terr, h = at(view.L, m[0], m[1]);
    brushHexes(view.L, h).forEach(function (b) { setPaint(view.L, K(b[0], b[1]), t); });
  }
  function strokeTo(m) { // between two mouse points, every hex the brush crosses
    var a = drag.last, d = Math.hypot(m[0] - a[0], m[1] - a[1]), st = LV[view.L].w / 3, n = Math.max(1, Math.ceil(d / st));
    for (var i = 1; i <= n; i++) paintAt([a[0] + (m[0] - a[0]) * i / n, a[1] + (m[1] - a[1]) * i / n]);
    drag.last = m;
  }
  function snapSite(sx, sy, not) { for (var i = 0; i < S.sites.length; i++) { var st = S.sites[i]; if (st.id === not) continue; var s = toS(st.x, st.y); if (Math.hypot(s[0] - sx, s[1] - sy) <= 12) return st; } return null; }
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  var LIFTR = [0.5, 1, 2, 4, 8, 15], FTPX = 25; // (a lift's spreads in miles; a drag of a pixel up is 25 ft)
  function hitPeak(sx, sy) { var P = S.peaks || []; for (var i = P.length - 1; i >= 0; i--) { var m = liftMid(P[i]), s = toS(m[0], m[1]); if (Math.hypot(s[0] - sx, s[1] - sy) <= 12) return P[i]; } return null; }
  function peakBy(id) { return (S.peaks || []).filter(function (p) { return p.id === id; })[0] || null; }
  cv.addEventListener('mousedown', function (e) {
    hcheck();
    var p = evPt(e), m = toM(p[0], p[1]), tool = S.opts.tool;
    if (e.button === 1 || e.button === 2 || space) { drag = { kind: 'pan', p: p, c: [view.cx, view.cy] }; e.preventDefault(); return; }
    if (e.button !== 0) return;
    if (DRAW) { // a new road or river: each click a point, on a place it binds (a line lift's points stay free)
      var hs = DRAW.kind === 'liftline' ? null : snapSite(p[0], p[1]); DRAW.pts.push(hs ? hs.id : m); draw(); return;
    }
    if (tool === 'lift') { // LIFT: drag up to raise (down to sink) a height, or a chosen one; Shift-drag moves it
      var pk = hitPeak(p[0], p[1]); begin();
      if (!pk) { pk = { id: 'k' + Date.now().toString(36), name: 'a height', x: m[0], y: m[1], h: 0, r: S.opts.liftR }; S.peaks.push(pk); drag = { kind: 'lift', pk: pk, p: p, h0: 0, o: [m[0], m[1]], fresh: true }; }
      else drag = { kind: 'lift', pk: pk, p: p, h0: +pk.h || 0, lv0: pk.level != null ? lvlOf(pk).slice() : null, o: pk.pts ? JSON.parse(JSON.stringify(pk.pts)) : [pk.x, pk.y], move: e.shiftKey };
      SEL.peak = pk.id; panels(); draw(); return;
    }
    if (tool === 'paint' || tool === 'erase') { begin(); drag = { kind: 'paint', last: m }; paintAt(m); draw(); return; }
    if (tool === 'measure') { if (M.done) { M.pts = []; M.done = false; } M.pts.push(m); panelsMeasure(); draw(); return; }
    if (tool === 'under') { var u = underSel(); if (u) { begin(); drag = { kind: 'under', u: u, p: p, o: [u.x0, u.y0] }; } return; }
    if (tool === 'places' || tool === 'roads') {
      var P = SEL.path && tool === 'roads' ? pathBy(SEL.path) : null;
      if (P) {
        var vi = hitVtx(P, p[0], p[1]);
        if (vi >= 0) {
          SEL.vtx = vi; begin();
          if (typeof P.pts[vi] === 'string') { var bs = SB[P.pts[vi]]; drag = { kind: 'site', s: bs, p: p, o: [bs.x, bs.y] }; }
          else drag = { kind: 'vtx', P: P, i: vi, p: p, o: P.pts[vi].slice() };
          panels(); draw(); return;
        }
      }
      var st = hitSite(p[0], p[1]);
      if (st) { SEL.site = st.id; if (tool === 'places') { SEL.path = null; SEL.vtx = -1; } begin(); drag = { kind: 'site', s: st, p: p, o: [st.x, st.y] }; panels(); draw(); return; }
      if (P) { var sg = hitSeg(P, p[0], p[1]); if (sg) { begin(); P.pts.splice(sg[0] + 1, 0, m); SEL.vtx = sg[0] + 1; drag = { kind: 'vtx', P: P, i: sg[0] + 1, p: p, o: m.slice() }; panels(); draw(); return; } }
      if (tool === 'roads') { var hp = hitPath(p[0], p[1]); if (hp) { SEL.path = hp.id; SEL.vtx = -1; SEL.site = null; panels(); draw(); return; } }
    }
    if (tool === 'select') { var ss = hitSite(p[0], p[1]); if (ss) { SEL.site = ss.id; SEL.path = null; SEL.hex = null; panels(); draw(); return; } }
    drag = { kind: 'click', p: p, c: [view.cx, view.cy], m: m }; // a click, or a pan once it moves
  });
  window.addEventListener('mousemove', function (e) {
    hcheck(); var p = evPt(e), m = toM(p[0], p[1]); HOV = (p[0] >= 0 && p[1] >= 0 && p[0] <= Wd && p[1] <= Ht) ? m : null;
    if (M.pts.length && !M.done) { M.live = m; panelsMeasure(); }
    status(m);
    if (!drag) { if (HOV) draw(); return; }
    if (drag.kind === 'click' && Math.hypot(p[0] - drag.p[0], p[1] - drag.p[1]) > 4) drag.kind = 'pan';
    if (drag.kind === 'pan') { view.cx = drag.c[0] - (p[0] - drag.p[0]) / view.z; view.cy = drag.c[1] - (p[1] - drag.p[1]) / zy(); }
    else if (drag.kind === 'paint') strokeTo(m);
    else if (drag.kind === 'site') { drag.s.x = drag.o[0] + (p[0] - drag.p[0]) / view.z; drag.s.y = drag.o[1] + (p[1] - drag.p[1]) / zy(); }
    else if (drag.kind === 'vtx') drag.P.pts[drag.i] = [drag.o[0] + (p[0] - drag.p[0]) / view.z, drag.o[1] + (p[1] - drag.p[1]) / zy()];
    else if (drag.kind === 'under') { drag.u.x0 = drag.o[0] + (p[0] - drag.p[0]) / view.z; drag.u.y0 = drag.o[1] + (p[1] - drag.p[1]) / view.z; }
    else if (drag.kind === 'lift') {
      var pk = drag.pk, dx = (p[0] - drag.p[0]) / view.z, dy = (p[1] - drag.p[1]) / zy();
      if (drag.move) {
        dirtyLift(pk);
        if (pk.pts) pk.pts = drag.o.map(function (q) { return [q[0] + dx, q[1] + dy]; }); else { pk.x = drag.o[0] + dx; pk.y = drag.o[1] + dy; }
      } else if (drag.lv0) { var dl = Math.round((drag.p[1] - p[1]) * FTPX / 10) * 10; pk.level = [drag.lv0[0] + dl, drag.lv0[1] + dl]; } // (a level: the whole water table up or down)
      else pk.h = Math.round((drag.h0 + (drag.p[1] - p[1]) * FTPX) / 50) * 50;
      dirtyLift(pk); panels();
    }
    draw();
  });
  window.addEventListener('mouseup', function (e) {
    if (!drag) return;
    var d = drag; drag = null; var p = evPt(e);
    if (d.kind === 'lift') { // (a click that lifted nothing leaves no height behind)
      if (d.fresh && Math.abs(+d.pk.h || 0) < 50) { S.peaks = S.peaks.filter(function (x) { return x !== d.pk; }); SEL.peak = null; }
      HSIG = ''; commit(); return;
    }
    if (d.kind === 'click') {
      var tool = S.opts.tool;
      if (tool === 'select') { var h = at(view.L, d.m[0], d.m[1]); SEL.hex = { L: view.L, q: h[0], r: h[1] }; SEL.site = null; SEL.path = null; }
      else if (tool === 'places') { SEL.site = null; }
      else if (tool === 'roads') { SEL.path = null; SEL.vtx = -1; SEL.site = null; }
      panels(); draw(); return;
    }
    if (d.kind === 'pan') { saveView(); return; }
    if (d.kind === 'vtx') { var s = snapSite(p[0], p[1]); if (s) d.P.pts[d.i] = s.id; } // (dropped on a place, the point binds to it)
    commit();
  });
  cv.addEventListener('dblclick', function (e) {
    var p = evPt(e), m = toM(p[0], p[1]), tool = S.opts.tool;
    if (DRAW) return endDraw();
    if (tool === 'measure') { M.pts.pop(); M.done = true; M.live = null; panelsMeasure(); draw(); return; }
    if (tool === 'places' && !hitSite(p[0], p[1])) {
      begin(); var st = { id: 's' + Date.now().toString(36), name: 'a new place', kind: 'town', x: m[0], y: m[1], note: '' };
      S.sites.push(st); reindex(); SEL.site = st.id; commit(); var nm = $('ed-name'); if (nm) { nm.focus(); nm.select(); } return;
    }
    if (tool === 'select') { var h = at(view.L, m[0], m[1]); into({ L: view.L, q: h[0], r: h[1] }); }
  });
  cv.addEventListener('wheel', function (e) {
    e.preventDefault(); hcheck();
    var p = evPt(e), m = toM(p[0], p[1]); view.z = Math.max(ZMIN, Math.min(ZMAX, view.z * Math.exp(-e.deltaY * 0.0015)));
    var m2 = toM(p[0], p[1]); view.cx += m[0] - m2[0]; view.cy += m[1] - m2[1]; autoLevel(); draw(); saveView();
  }, { passive: false });
  window.addEventListener('keydown', function (e) {
    var tag = e.target && e.target.tagName; if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    var k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); return e.shiftKey ? redo() : undo(); }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); return redo(); }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (k === ' ') { space = true; e.preventDefault(); return; }
    if (k === '1' || k === '2' || k === '3') return setLevel(+k);
    var T = { s: 'select', b: 'paint', e: 'erase', c: 'places', r: 'roads', m: 'measure', u: 'under', l: 'lift' };
    if (T[k]) return setTool(T[k]);
    if (k === 'v') return setLook(LOOKS[(LOOKS.indexOf(S.opts.look) + 1) % LOOKS.length]);
    if (k === 'i') { S.opts.iso = !S.opts.iso; panels(); draw(); save(); return; }
    if ((k === '[' || k === ']') && S.opts.tool === 'lift') { // (a lift's spread: the next one's, and the chosen one's)
      var li = LIFTR.indexOf(+S.opts.liftR); li = Math.max(0, Math.min(LIFTR.length - 1, (li < 0 ? 3 : li) + (k === ']' ? 1 : -1))); S.opts.liftR = LIFTR[li];
      var spk = peakBy(SEL.peak); if (spk) { begin(); dirtyLift(spk); spk.r = LIFTR[li]; dirtyLift(spk); commit(); }
      panels(); draw(); save(); return;
    }
    if (k === '[') { S.opts.brush = Math.max(0, S.opts.brush - 1); panels(); draw(); return; }
    if (k === ']') { S.opts.brush = Math.min(3, S.opts.brush + 1); panels(); draw(); return; }
    if (k === 'backspace') { e.preventDefault(); return outOf(); }
    if (k === 'enter') { if (DRAW) return endDraw(); if (M.pts.length) { M.done = true; M.live = null; panelsMeasure(); draw(); } return; }
    if (k === 'escape') { if (DRAW) { DRAW = null; msg('the new way dropped'); draw(); return; } if (M.pts.length) { M.pts = []; M.live = null; M.done = false; panelsMeasure(); draw(); return; } SEL.hex = null; SEL.site = null; SEL.path = null; SEL.vtx = -1; SEL.peak = null; panels(); draw(); return; }
    if (k === 'delete') return delSel();
  });
  window.addEventListener('keyup', function (e) { if (e.key === ' ') space = false; });

  function delSel() {
    if (SEL.peak) { var pk = peakBy(SEL.peak); if (pk) { begin(); S.peaks = S.peaks.filter(function (x) { return x !== pk; }); SEL.peak = null; HSIG = ''; commit(); } return; }
    if (SEL.path && SEL.vtx >= 0) { var P = pathBy(SEL.path); if (P && P.pts.length > 2) { begin(); P.pts.splice(SEL.vtx, 1); SEL.vtx = -1; commit(); } else msg('a way keeps two points at least (delete the way in the panel)'); return; }
    if (SEL.site) return delSite(SEL.site);
  }
  function delSite(id) {
    var st = SB[id]; if (!st) return; begin();
    S.paths.forEach(function (P) { P.pts = P.pts.map(function (q) { return q === id ? [st.x, st.y] : q; }); }); // (its roads keep the point where it stood)
    S.sites = S.sites.filter(function (s) { return s.id !== id; }); reindex(); SEL.site = null; commit();
  }
  function endDraw() {
    var d = DRAW; DRAW = null; if (!d) return;
    var same = function (a, b) { return typeof a === 'string' || typeof b === 'string' ? a === b : Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6; };
    var pts = d.pts.filter(function (p, i) { return !i || !same(p, d.pts[i - 1]); }); // (a double-click's two clicks land one point twice)
    if (pts.length < 2) { msg('a way needs two points'); draw(); return; }
    begin();
    if (d.kind === 'liftline') { // a valley (or, dragged up, a ridge) along the line
      var lk = { id: 'k' + Date.now().toString(36), name: 'a valley', pts: pts, h: -1500, r: S.opts.liftR };
      S.peaks.push(lk); SEL.peak = lk.id; HSIG = ''; commit(); setTool('lift'); SEL.peak = lk.id; panels(); draw();
      msg('a valley along your line, 1,500 ft down: drag its marker up or down, Shift-drag moves it, [ ] its width'); return;
    }
    if (d.keep && pathBy(d.keep)) { pathBy(d.keep).pts = pts; SEL.path = d.keep; }
    else { var P = { id: 'p' + Date.now().toString(36), name: d.kind === 'river' ? 'a new river' : 'a new road', kind: d.kind, pts: pts }; S.paths.push(P); SEL.path = P.id; }
    SEL.vtx = -1; commit(); setTool('roads');
  }
  function setTool(t) { // (a tool keeps only its own kind of selection)
    S.opts.tool = t; if (t !== 'measure') M.live = null;
    if (t !== 'select') SEL.hex = null; if (t !== 'roads') { SEL.path = null; SEL.vtx = -1; } if (t !== 'places' && t !== 'roads' && t !== 'select') SEL.site = null;
    if (t !== 'lift') SEL.peak = null;
    panels(); draw(); save();
  }
  var LOOKS = ['flat', 'relief', 'world'];
  function setLook(l) { // (the world look keeps the same middle of the map on screen)
    S.opts.look = l; LAYERKEY = ''; panels(); draw(); save();
    msg(l === 'world' ? 'WORLD: the map tilted, each hex a column at its height (V for the next look; the height slider stands them taller)' : l === 'relief' ? 'RELIEF: lit from the north-west, with contour lines' : 'FLAT: the painted map');
  }
  function underSel() { var u = S.under.filter(function (x) { return x.id === S.opts.uSel; })[0]; return u || null; }

  // ---------------------------------------------------------------- guess a level from corridor v3 (rough: he fixes it by hand)
  var REF = {
    sea: [0x2b6d75, 0x27616a, 0x35777f, 0x3d8289, 0x245a63, 0x2f6f78],
    land: [0xc9a468, 0xd2b075, 0xc39a5e, 0xb98f52, 0xd9b97f, 0xa8803f, 0xe0c48c, 0xa67a3e, 0xb8925a, 0x9a8a50],
    bog: [0x556b3a, 0x6f7a45, 0x8a864f],
    black: [0x241f26, 0x5b4e5d, 0x2c2630, 0x66576a, 0x3a3340],
    brown: [0x5a4a38, 0x4f4438, 0x3e352c, 0x35302c, 0x6a5844],
    ink: [0xf6e9c5, 0xe9d9ae, 0xffe9b8, 0xf2e0b2, 0x2a180a, 0x321c0c, 0x5a1e0f, 0x3b2412, 0x5aa9c0, 0x1e1a2e, 0xa83232, 0x8a8fa8, 0xbfe0d8]
  };
  var REFL = []; Object.keys(REF).forEach(function (c) { REF[c].forEach(function (v) { REFL.push([c, v >> 16, (v >> 8) & 255, v & 255]); }); });
  function inPoly(x, y, P) { var o = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) o = !o; } return o; }
  var LAKE = [[1502, 790], [1546, 776], [1586, 800], [1578, 838], [1536, 852], [1498, 828]], RIFT = [[300, 1290], [420, 1270], [560, 1300], [520, 1340], [360, 1350]];
  function classify(D, cx, cy, rad, L) {
    var cnt = { sea: 0, land: 0, bog: 0, black: 0, brown: 0 }, tot = 0, g = L === 1 ? 7 : 5;
    for (var i = 0; i < g; i++) for (var j = 0; j < g; j++) {
      var x = Math.round(cx + rad * (2 * (i + 0.5) / g - 1)), y = Math.round(cy + rad * (2 * (j + 0.5) / g - 1));
      if (x < 0 || y < 0 || x >= D.width || y >= D.height) continue;
      if (x >= 40 && x <= 940 && y >= 40 && y <= 256) continue; // (v3's title box)
      var o = (y * D.width + x) * 4, R = D.data[o], G = D.data[o + 1], B = D.data[o + 2], best = null, bd = 1e9;
      for (var k = 0; k < REFL.length; k++) { var f = REFL[k], dd = (R - f[1]) * (R - f[1]) + (G - f[2]) * (G - f[2]) + (B - f[3]) * (B - f[3]); if (dd < bd) { bd = dd; best = f[0]; } }
      if (best === 'ink') continue; cnt[best]++; tot++;
    }
    if (!tot) return null;
    if (cnt.sea / tot > 0.5) return inPoly(cx, cy, LAKE) ? 'lake' : 'sea';
    if (cnt.black / tot > 0.2) return 'black';
    if (cnt.brown / tot > 0.2) return cx < 1000 ? 'coastal' : 'gray';
    if (cnt.bog / tot > 0.25) return 'bog';
    if (inPoly(cx, cy, RIFT)) return 'rift';
    if (Math.pow((cx - 920) / 420, 2) + Math.pow((cy - 800) / 250, 2) <= 1) return 'hills'; // (v3's gnoll pocket, its hatching drawn in this ellipse)
    if (cx > 1700 && cy > 600) return 'verge'; // (v3's plains grass east)
    if (cx > 1620 && cx < 2150 && cy > 330 && cy < 470) return 'farms'; // (v3's farms east of Silverton)
    return 'plains';
  }
  function guess() {
    var L = view.L, u = S.under.filter(function (x) { return x.id === 'corridor'; })[0], rec = IMG.corridor;
    if (L === 3) return msg('v3 is too coarse for level 3 (a 330 ft hex is a pixel and a half of it): paint level 3 by hand.', true);
    if (!u || !rec || !rec.ok) return msg('the corridor v3 underlay is not loaded', true);
    if (!rec.data) {
      var c = document.createElement('canvas'); c.width = rec.el.naturalWidth; c.height = rec.el.naturalHeight; var g = c.getContext('2d'); g.drawImage(rec.el, 0, 0);
      try { rec.data = g.getImageData(0, 0, c.width, c.height); } catch (e) { return msg('this browser will not let the page read the picture (' + e.message + ')', true); }
    }
    var D = rec.data, w = LV[L].w, h = w * SQ3 / 2, x1 = u.x0 + D.width / u.pxmi, y1 = u.y0 + D.height / u.pxmi, n = 0, skip = 0;
    begin();
    for (var r = Math.floor(u.y0 / h); r <= Math.ceil(y1 / h); r++) for (var q = Math.floor(u.x0 / w - r / 2) - 1; q <= Math.ceil(x1 / w - r / 2) + 1; q++) {
      var cc = hc(L, q, r), px = (cc[0] - u.x0) * u.pxmi, py = (cc[1] - u.y0) * u.pxmi;
      if (px < 0 || py < 0 || px >= D.width || py >= D.height) continue;
      var k = K(q, r); if (S.paint[L][k]) { skip++; continue; } // (his own paint at this level stays)
      var t = classify(D, px, py, w * u.pxmi * 0.42, L); if (!t) continue;
      if (L > 1) { var pp = up(L, q, r), e = effAt(L - 1, pp[0], pp[1]); if (e && e.t === t) continue; }
      setPaint(L, k, t); n++;
    }
    commit(); msg(n + ' hexes guessed at level ' + L + (skip ? ' (' + skip + ' of yours kept)' : '') + '. It is a guess from the picture: fix it by hand, or undo.');
  }

  // ---------------------------------------------------------------- underlay pictures (served from TarlynsPit/map by the they-live preview; from the
  // dragonsleep preview, :8923, the they-live one is asked for them -- shown, but the guess cannot read a picture from another address)
  function loadUnder(u) {
    if (IMG[u.id]) return;
    var rec = IMG[u.id] = { ok: false, trying: true, el: new Image() }, i = 0;
    var bases = ['/TarlynsPit/map/', '../../TarlynsPit/map/', '../../../../../TarlynsPit/map/', 'http://localhost:8931/TarlynsPit/map/', 'http://localhost:8932/TarlynsPit/map/'];
    var next = function () { if (i >= bases.length) { rec.trying = false; rec.fail = true; panels(); return; } rec.el.src = bases[i++] + u.file; };
    rec.el.onload = function () { rec.ok = true; rec.trying = false; rec.fail = false; panels(); draw(); };
    rec.el.onerror = next; next();
  }
  var pickFor = null;
  $('imgfile').onchange = function () {
    var f = this.files[0]; if (!f || !pickFor) return; var rec = IMG[pickFor] = { ok: false, el: new Image() };
    rec.el.onload = function () { rec.ok = true; panels(); draw(); }; rec.el.src = URL.createObjectURL(f); this.value = '';
  };

  // ---------------------------------------------------------------- the side panel
  function msg(t, warn) { $('msg').innerHTML = warn ? '<b class="warn">' + esc(t) + '</b>' : esc(t); }
  function status(m) {
    var L = view.L, h = at(L, m[0], m[1]), e = effAt(L, h[0], h[1]), f = !e && S.opts.fill ? fillAt(fillNow(), m[0], m[1]) : null;
    $('status').textContent = 'level ' + L + ' hex (' + col(h[0], h[1]) + ', ' + h[1] + ') · ' + (e ? (TB[e.t] ? TB[e.t].name : e.t) + (e.L !== L ? ' (from level ' + e.L + ')' : '') : 'unpainted' + (f ? ' (the fill: ' + (TB[f] ? TB[f].name : f) + ')' : '')) +
      ' · ' + Math.round(hexH(L, h[0], h[1])).toLocaleString() + ' ft\n' + m[0].toFixed(2) + ' mi east, ' + m[1].toFixed(2) + ' mi south of v3’s corner';
  }
  function btn(label, on, fn, title) { var b = document.createElement('button'); b.textContent = label; if (on) b.className = 'on'; if (title) b.title = title; b.onclick = fn; return b; }
  function panels() {
    var lv = $('levels'); lv.innerHTML = '';
    [1, 2, 3].forEach(function (L) { lv.appendChild(btn(L + ' · ' + LV[L].name, view.L === L, function () { setLevel(L); })); });
    $('lvlnote').textContent = LV[view.L].long + (hexPx(view.L) < 4 ? ' -- zoom in to paint' : '');
    var tl = $('tools'); tl.innerHTML = '';
    [['select', 'S select'], ['paint', 'B paint'], ['erase', 'E erase'], ['places', 'C places'], ['roads', 'R roads'], ['measure', 'M measure'], ['under', 'U underlay'], ['lift', 'L lift']].forEach(function (t) {
      tl.appendChild(btn(t[1], S.opts.tool === t[0], function () { setTool(t[0]); }, t[0] === 'lift' ? 'drag up to raise a height (down to sink one); Shift-drag moves it; [ ] its spread; Del drops it' : null));
    });
    var br = $('brushes'); br.innerHTML = '';
    [0, 1, 2, 3].forEach(function (R) { br.appendChild(btn(String(1 + 3 * R * (R + 1)), S.opts.brush === R, function () { S.opts.brush = R; panels(); draw(); save(); }, 'hexes in the brush')); });
    $('brushrow').style.display = S.opts.tool === 'paint' || S.opts.tool === 'erase' ? '' : 'none';
    var lr = $('liftrs'); lr.innerHTML = '';
    LIFTR.forEach(function (R) { lr.appendChild(btn(R + ' mi', +S.opts.liftR === R, function () { S.opts.liftR = R; var pk = peakBy(SEL.peak); if (pk) { begin(); dirtyLift(pk); pk.r = R; dirtyLift(pk); commit(); } panels(); draw(); save(); }, 'the spread of the next lift (and the chosen one)')); });
    $('liftrow').style.display = S.opts.tool === 'lift' ? '' : 'none';
    var lk = $('looks'); lk.innerHTML = '';
    [['flat', 'flat'], ['relief', 'relief'], ['world', 'world (iso)']].forEach(function (l) { lk.appendChild(btn(l[1], S.opts.look === l[0], function () { setLook(l[0]); }, 'V: the next look')); });
    $('exag').value = S.opts.exag; $('conton').checked = !!S.opts.contours; $('isoon').checked = !!S.opts.iso;
    terrPanel(); infoPanel(); listPanels(); panelsMeasure(); underPanel();
    $('pfoot').value = S.pace.foot; $('pcart').value = S.pace.cart; $('paintop').value = S.opts.paintOp; $('gridon').checked = !!S.opts.grid; $('labon').checked = !!S.opts.labels; $('fillon').checked = !!S.opts.fill;
  }
  function used(k) { var n = 0; [1, 2, 3].forEach(function (L) { for (var x in S.paint[L]) if (S.paint[L][x] === k) n++; }); return n; }
  function terrPanel() {
    var box = $('terrs'); box.innerHTML = '';
    S.terr.forEach(function (t) {
      var d = document.createElement('div'); d.className = 'sw' + (S.opts.terr === t.k ? ' on' : '');
      d.innerHTML = '<i style="background:' + esc(t.color) + '"></i>' + esc(t.name) + '<small>' + (!+t.cost ? '—' : t.diff ? '×2' : '×1') + '</small>';
      d.title = t.name + ' -- ' + (!+t.cost ? 'no one walks it' : t.diff ? 'difficult (the SRD: half pace)' : 'easy going') + '; Book III (the Snoot) x' + t.cost + '; ' + Math.round(+t.alt).toLocaleString() + ' ft, rough ' + Math.round(+t.rough) + '. Click to paint with it; with a hex selected, it sets that hex.';
      d.onclick = function () {
        S.opts.terr = t.k;
        if (SEL.hex && S.opts.tool === 'select') { begin(); setPaint(SEL.hex.L, K(SEL.hex.q, SEL.hex.r), t.k); commit(); }
        else if (S.opts.tool !== 'paint') setTool('paint');
        panels(); save();
      };
      d.ondblclick = function () { S.opts.terr = t.k; EDT = t.k; panels(); };
      box.appendChild(d);
    });
    if (EDT && TB[EDT]) {
      var t = TB[EDT], ed = document.createElement('div'); ed.className = 'box'; ed.style.gridColumn = '1 / 3';
      ed.innerHTML = '<div class="row"><input type="text" id="te-name"></div><div class="row"><input type="color" id="te-color"><label><input type="checkbox" id="te-diff"> difficult (SRD)</label></div>' +
        '<div class="row"><span class="dim">Book III ×</span><input type="number" id="te-cost" min="0" step="1"><span class="dim">(the Snoot; 0: no one walks it)</span></div>' +
        '<div class="row"><span class="dim">height</span><input type="number" id="te-alt" step="100" style="width:76px"><span class="dim">ft · rough</span><input type="number" id="te-rough" min="0" step="50" style="width:64px"></div>' +
        '<div class="row" title="a cut sits this far under the land round it, its banks rising on either side (a gulch); 0: a height of its own"><span class="dim">or a cut</span><input type="number" id="te-cut" min="0" step="50" style="width:64px"><span class="dim">ft under its banks</span></div>' +
        '<div class="row"><button id="te-del">delete</button><button id="te-done">done</button><span class="dim" id="te-used"></span></div>';
      box.appendChild(ed);
      $('te-name').value = t.name; $('te-color').value = t.color; $('te-cost').value = t.cost; $('te-used').textContent = used(t.k) + ' hexes painted with it';
      $('te-diff').checked = !!t.diff; $('te-alt').value = Math.round(+t.alt); $('te-rough').value = Math.round(+t.rough); $('te-cut').value = Math.round(+t.cut || 0);
      $('te-cut').onchange = edit(function (v) { t.cut = Math.max(0, +v || 0); VER++; });
      var edit = function (f) { return function () { begin(); f(this.value); commit(); }; };
      $('te-name').onchange = edit(function (v) { t.name = v; }); $('te-cost').onchange = edit(function (v) { t.cost = Math.max(0, +v || 0); });
      $('te-diff').onchange = function () { begin(); t.diff = this.checked; commit(); };
      $('te-alt').onchange = edit(function (v) { t.alt = +v || 0; VER++; }); $('te-rough').onchange = edit(function (v) { t.rough = Math.max(0, +v || 0); VER++; });
      $('te-color').oninput = function () { begin(); t.color = this.value; VER++; draw(); }; $('te-color').onchange = function () { t.color = this.value; VER++; commit(); };
      $('te-done').onclick = function () { EDT = null; panels(); };
      $('te-del').onclick = function () {
        var n = used(t.k); if (n) return msg(n + ' hexes are painted ' + t.name + ': repaint them first (or keep it)', true);
        begin(); S.terr = S.terr.filter(function (x) { return x.k !== t.k; }); reindex(); EDT = null; commit();
      };
    }
  }
  var EDT = null;
  function infoPanel() {
    var info = $('info'), ed = $('edit'); ed.innerHTML = '';
    if (SEL.site && SB[SEL.site]) {
      var st = SB[SEL.site];
      info.textContent = st.kind + ' · ' + st.x.toFixed(2) + ', ' + st.y.toFixed(2) + ' mi' + (st.note ? '\n' + st.note : '');
      ed.innerHTML = '<div class="row"><input type="text" id="ed-name"></div><div class="row"><select id="ed-kind"></select><button id="ed-del">delete</button><button id="ed-go">centre</button></div>' +
        '<div class="row"><input type="text" id="ed-note" placeholder="a note"></div>';
      $('ed-name').value = st.name; $('ed-note').value = st.note || '';
      KINDS.forEach(function (k) { var o = document.createElement('option'); o.value = o.textContent = k; if (k === st.kind) o.selected = true; $('ed-kind').appendChild(o); });
      $('ed-name').oninput = function () { st.name = this.value; draw(); }; $('ed-name').onfocus = begin; $('ed-name').onchange = commit;
      $('ed-note').onfocus = begin; $('ed-note').onchange = function () { st.note = this.value; commit(); };
      $('ed-kind').onchange = function () { begin(); st.kind = this.value; commit(); };
      $('ed-del').onclick = function () { delSite(st.id); };
      $('ed-go').onclick = function () { zoomTo(view.z, st.x, st.y); };
      return;
    }
    if (SEL.peak && peakBy(SEL.peak)) { // a lift
      var pk = peakBy(SEL.peak);
      var plv = pk.level != null ? lvlOf(pk) : null;
      info.textContent = (pk.pts ? 'a line lift' : 'a lift') + ' · ' + (plv ? 'the ground brought to ' + Math.round(plv[0]) + (plv[1] !== plv[0] ? '–' + Math.round(plv[1]) : '') + ' ft' : ((+pk.h >= 0 ? '+' : '') + Math.round(+pk.h).toLocaleString()) + ' ft') + ' over ' + pk.r + ' mi\ndrag it up or down; Shift-drag moves it; [ ] its spread; Del drops it';
      ed.innerHTML = '<div class="row"><input type="text" id="ed-name"></div><div class="row"><span class="dim">height</span><input type="number" id="ed-h" step="100" style="width:80px"><span class="dim">ft · spread</span><input type="number" id="ed-r" min="0.2" step="0.5" style="width:56px"><span class="dim">mi</span></div>' +
        (pk.pts ? '<div class="row"><label title="a thin sheet of water on its floor"><input type="checkbox" id="ed-wet"> wet floor</label></div>' : '') +
        '<div class="row"><button id="ed-del">delete</button><button id="ed-go">centre</button></div>';
      $('ed-name').value = pk.name || ''; $('ed-h').value = Math.round(+pk.h); $('ed-r').value = pk.r;
      if ($('ed-wet')) { $('ed-wet').checked = !!pk.water; $('ed-wet').onchange = function () { begin(); pk.water = this.checked; dirtyLift(pk); commit(); }; }
      $('ed-name').onfocus = begin; $('ed-name').onchange = function () { pk.name = this.value; commit(); };
      $('ed-h').onchange = function () { begin(); pk.h = +this.value || 0; dirtyLift(pk); commit(); };
      $('ed-r').onchange = function () { var v = Math.max(0.2, +this.value || 1); begin(); dirtyLift(pk); pk.r = v; dirtyLift(pk); commit(); };
      $('ed-del').onclick = delSel; $('ed-go').onclick = function () { var c = liftMid(pk); zoomTo(view.z, c[0], c[1]); };
      return;
    }
    if (SEL.path && pathBy(SEL.path)) {
      var P = pathBy(SEL.path), pts = ptsOf(P), len = 0; for (var i = 0; i + 1 < pts.length; i++) len += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      var pm = P.kind === 'river' ? null : measure(pts);
      info.textContent = P.kind + ' · ' + len.toFixed(1) + ' mi · ' + P.pts.length + ' points' + (pm ? '\n' + (roadGoing(P) !== 1 ? 'going ×' + roadGoing(P) + ' · ' : '') + 'by wagon ' + (pm.go / (+S.pace.cart || 17)).toFixed(1) + ' days, on foot ' + (pm.go / (+S.pace.foot || 24)).toFixed(1) : '') +
        '\ndrag a point; drag a line to add one; Del drops the yellow one;\na point dropped on a place binds to it (green) and moves with it';
      ed.innerHTML = '<div class="row"><input type="text" id="ed-name"></div><div class="row"><select id="ed-kind"></select><button id="ed-del">delete the way</button><button id="ed-rev">extend</button></div>' +
        (P.kind === 'river' ? '' : '<div class="row"><span class="dim" title="how hard the road is going: 1 a road, 2 the SRD\'s difficult terrain (half pace), between them ours -- weather, switchbacks">going ×</span><input type="number" id="ed-going" min="1" step="0.05" style="width:60px">' + (P.drawn ? '<button id="ed-drawn" title="put back the points as you drew them (before the seat\'s switchbacks)">as you drew it</button>' : '') + '</div>');
      $('ed-name').value = P.name;
      if ($('ed-going')) { $('ed-going').value = roadGoing(P); $('ed-going').onchange = function () { var v = Math.max(1, +this.value || 1); begin(); P.going = v; P.difficult = v >= 2; commit(); }; }
      if ($('ed-drawn')) $('ed-drawn').onclick = function () { begin(); P.pts = P.drawn.slice(); commit(); msg('the Coldridge Route as you drew it (its switchbacks gone; it stays difficult)'); };
      PKINDS.forEach(function (k) { var o = document.createElement('option'); o.value = o.textContent = k; if (k === P.kind) o.selected = true; $('ed-kind').appendChild(o); });
      $('ed-name').oninput = function () { P.name = this.value; }; $('ed-name').onfocus = begin; $('ed-name').onchange = function () { commit(); };
      $('ed-kind').onchange = function () { begin(); P.kind = this.value; commit(); };
      $('ed-del').onclick = function () { begin(); S.paths = S.paths.filter(function (x) { return x.id !== P.id; }); SEL.path = null; SEL.vtx = -1; commit(); };
      $('ed-rev').title = 'add points past its last end (click on the map; Enter or double-click ends)';
      $('ed-rev').onclick = function () { DRAW = { kind: P.kind, pts: P.pts.slice(), keep: P.id }; msg('click to go on from its last point; Enter or double-click ends, Esc leaves it as it was'); draw(); };
      return;
    }
    if (SEL.hex) {
      var hx = SEL.hex, k = K(hx.q, hx.r), own = S.paint[hx.L][k], e = effAt(hx.L, hx.q, hx.r), inside = hx.L < 3 ? (DC[hx.L].get(k) || 0) : 0;
      var nm = function (t) { return TB[t] ? TB[t].name : t; };
      info.textContent = 'level ' + hx.L + ' hex (' + col(hx.q, hx.r) + ', ' + hx.r + '), ' + LV[hx.L].name + ' across\n' +
        (own ? 'painted ' + nm(own) : e ? 'shows ' + nm(e.t) + ', from its level ' + e.L + ' hex (' + col(e.q, e.r) + ', ' + e.r + ')' : 'unpainted') +
        (inside ? '\n' + inside + ' finer hexes painted inside it' : '') + fillNote(hx, k) + '\nclick a terrain to set it';
      ed.appendChild(btn('inherit (clear it)', false, function () { begin(); setPaint(hx.L, k, null); commit(); }));
      if (inside) ed.appendChild(btn('clear the finer paint inside', false, function () { begin(); clearInside(hx.L, hx.q, hx.r); commit(); }));
      if (hx.L < 3) ed.appendChild(btn('into it ↓', false, function () { into(hx); }));
      if (hx.L > 1) ed.appendChild(btn('up ↑', false, outOf));
      return;
    }
    info.textContent = 'nothing selected';
  }
  function fillNote(hx, k) { // (a 5-mile hex the fill grounds: what the world gives it)
    if (hx.L !== 1 || !S.opts.fill) return '';
    var F = fillNow(), t = F.g[k], mine = domT(1, hx.q, hx.r); if (!t || F.own[k]) return '';
    return '\nthe world fills it ' + (TB[t] ? TB[t].name : t) + ', ' + F.ring[k] + ' hex' + (F.ring[k] > 1 ? 'es' : '') + ' from the paint beside it' + (mine ? ' (your ' + (TB[mine] ? TB[mine].name : mine) + ' in a corner of it: its second)' : '');
  }
  function clearInside(L, q, r) {
    var n = LV[L + 1].n; kids(n).forEach(function (c) { var cq = n * q + c[0], cr = n * r + c[1], ck = K(cq, cr); if (L + 1 < 3 && DC[L + 1].get(ck)) clearInside(L + 1, cq, cr); setPaint(L + 1, ck, null); });
  }
  function listPanels() {
    var sl = $('sites'); sl.innerHTML = '';
    S.sites.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).forEach(function (st) {
      var d = document.createElement('div'); d.textContent = st.name + '  · ' + st.kind; if (SEL.site === st.id) d.className = 'on';
      d.onclick = function () { SEL.site = st.id; SEL.path = null; SEL.hex = null; zoomTo(view.z, st.x, st.y); panels(); }; sl.appendChild(d);
    });
    var pl = $('paths'); pl.innerHTML = '';
    S.paths.forEach(function (P) {
      var d = document.createElement('div'); d.textContent = P.name + '  · ' + P.kind; if (SEL.path === P.id) d.className = 'on';
      d.onclick = function () { SEL.path = P.id; SEL.vtx = -1; SEL.site = null; SEL.hex = null; var q = ptsOf(P); if (q.length) zoomTo(view.z, q[0][0], q[0][1]); setTool('roads'); }; pl.appendChild(d);
    });
  }
  function panelsMeasure() { $('measure').textContent = measureText(); }
  function underPanel() {
    var box = $('unders'); box.innerHTML = '';
    S.under.forEach(function (u) {
      var rec = IMG[u.id], d = document.createElement('div'); d.className = 'box';
      var state = !rec ? '' : rec.ok ? '' : rec.trying ? ' (loading)' : ' (not found)';
      d.innerHTML = '<div class="row"><label><input type="checkbox"' + (u.on ? ' checked' : '') + '> ' + esc(u.name) + '</label><span class="dim">' + state + '</span></div>' +
        '<div class="row"><input type="range" min="0" max="1" step="0.05" value="' + u.op + '"><span class="dim">px/mi</span><input type="number" step="any" value="' + (+u.pxmi).toFixed(3) + '" style="width:84px"></div>';
      var row = d.querySelectorAll('.row')[1];
      row.appendChild(btn('move', S.opts.tool === 'under' && S.opts.uSel === u.id, function () { S.opts.uSel = u.id; u.on = true; loadUnder(u); setTool('under'); }, 'drag it on the map to align it'));
      if (rec && rec.fail) row.appendChild(btn('pick the file…', false, function () { pickFor = u.id; $('imgfile').click(); }, u.file + ' (from TarlynsPit/map)'));
      var ins = d.querySelectorAll('input');
      ins[0].onchange = function () { begin(); u.on = this.checked; if (u.on) loadUnder(u); commit(); };
      ins[1].oninput = function () { u.op = +this.value; draw(); }; ins[1].onchange = function () { save(); };
      ins[2].onchange = function () { var v = +this.value; if (v > 0) { begin(); u.pxmi = v; commit(); } };
      box.appendChild(d);
    });
  }

  // ---------------------------------------------------------------- the buttons
  $('addterr').onclick = function () {
    begin(); var k = 't' + Date.now().toString(36), hue = Math.floor(Math.random() * 360);
    var c = 'hsl(' + hue + ',45%,50%)', cvs = document.createElement('canvas').getContext('2d'); cvs.fillStyle = c; // (to #rrggbb for the colour input)
    S.terr.push({ k: k, name: 'a new terrain', color: cvs.fillStyle, cost: 1 }); reindex(); S.opts.terr = k; EDT = k; commit();
    var nm = $('te-name'); if (nm) { nm.focus(); nm.select(); }
  };
  $('guess').onclick = guess;
  $('newroad').onclick = function () { DRAW = { kind: 'road', pts: [] }; SEL.path = null; msg('click along the new road (on a place it binds); Enter or double-click ends, Esc drops it'); draw(); };
  $('newline').onclick = function () { DRAW = { kind: 'liftline', pts: [] }; SEL.path = null; msg('click along the valley (or ridge) to be; Enter or double-click ends, Esc drops it'); draw(); };
  $('newriver').onclick = function () { DRAW = { kind: 'river', pts: [] }; SEL.path = null; msg('click along the new river; Enter or double-click ends, Esc drops it'); draw(); };
  $('pfoot').onchange = function () { S.pace.foot = Math.max(1, +this.value || 24); panelsMeasure(); draw(); save(); };
  $('pcart').onchange = function () { S.pace.cart = Math.max(1, +this.value || 17); panelsMeasure(); draw(); save(); };
  $('paintop').oninput = function () { S.opts.paintOp = +this.value; draw(); }; $('paintop').onchange = save;
  $('gridon').onchange = function () { S.opts.grid = this.checked; draw(); save(); };
  $('labon').onchange = function () { S.opts.labels = this.checked; draw(); save(); };
  $('fillon').onchange = function () { S.opts.fill = this.checked; HC.clear(); LAYERKEY = ''; panels(); draw(); save(); };
  $('exag').oninput = function () { S.opts.exag = +this.value; LAYERKEY = ''; draw(); }; $('exag').onchange = save;
  $('conton').onchange = function () { S.opts.contours = this.checked; draw(); save(); };
  $('isoon').onchange = function () { S.opts.iso = this.checked; draw(); save(); };
  $('undo').onclick = undo; $('redo').onclick = redo;
  function stamp() { var d = new Date(); return d.toISOString().slice(0, 16).replace(/[:]/g, '').replace('T', '-') + 'Z'; }
  function download(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }
  function outObj() {
    var o = JSON.parse(JSON.stringify(S));
    o.exported = new Date().toISOString();
    o.about = 'the realm hex map (dragonsleep-8bit tools/hexmap.html, the maps lane): levels 1-3 are pointy-top hexes 5 mi, 1 mi and 1/16 mi across the flats, axial "q,r" keys, a level-k+1 hex the child of the level-k hex its centre lies in; x/y in miles east/south of corridor v3\'s top-left corner (v3 at ' + V3.toFixed(3) + ' px a mile; version 2, Silverton to the Pit 68 mi by the road); terr[].alt/rough feet and diff (the SRD\'s difficult), cost Book III\'s; peaks: his lifts, h ft over r mi';
    return o;
  }
  $('export').onclick = function () { saveNow(); download(new Blob([JSON.stringify(outObj(), null, 1)], { type: 'application/json' }), 'realm-hexmap-' + stamp() + '.json'); msg('exported'); };
  $('import').onclick = function () { $('file').click(); };
  function takeIn(text, name) { // a hex map file in place of this browser's copy (a version 1 file grows on the way in)
    var o; try { o = JSON.parse(text); } catch (e) { msg('not a hex map file: ' + e.message, true); return false; }
    if (!o || (o.v !== 1 && o.v !== 2) || !o.paint) { msg('not a hex map file (no v: 1 or 2)', true); return false; }
    var was1 = o.v === 1; delete o.exported; delete o.about; if (was1) o = grow(o); S = o; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* (shown on the next save) */ }
    UNDO = []; REDO = []; SEL = { hex: null, site: null, path: null, vtx: -1 }; load(); S.under.forEach(function (u) { if (u.on) loadUnder(u); }); panels(); draw();
    msg('took in ' + name + (was1 ? ' (a version 1 map, grown ×' + GROW + ' to the four-wagon-day road)' : ''));
    return true;
  }
  $('file').onchange = function () {
    var f = this.files[0]; this.value = ''; if (!f) return; var rd = new FileReader();
    rd.onload = function () { takeIn(rd.result, f.name); }; rd.readAsText(f);
  };
  // (SAVE TO A FILE, Chromium's file pickers, was dropped 10-20 on his "Export is save": Brave hides the pickers, and the file it linked was never
  // written -- the maps lane §2e)
  $('png').onclick = function () { drawNow(); cv.toBlob(function (b) { if (b) download(b, 'realm-hexmap-view-' + stamp() + '.png'); else msg('the browser would not make a picture', true); }); };
  var armed = 0;
  $('reset').onclick = function () {
    if (Date.now() - armed > 4000) { armed = Date.now(); this.textContent = 'sure? click again'; var b = this; setTimeout(function () { b.textContent = 'start over'; }, 4000); return; }
    S = fresh(); UNDO = []; REDO = []; SEL = { hex: null, site: null, path: null, vtx: -1 }; reindex(); rebuildDC(); saveNow(); this.textContent = 'start over'; armed = 0;
    S.under.forEach(loadUnder); setLevel(1, [54 * GROW, 30 * GROW]); msg('started over from corridor v3’s places and roads');
  };

  // ---------------------------------------------------------------- THE BAKE: the second game's world map from this map (10-20, RULED his "go on all leans": the
  // world is baked from his EXPORT by this page's own engine -- tools/world-build.py opens it headless and writes deep16/data/world.js). The walked level is
  // the 5-mile one (his "only the 5-mile level is walked"): each painted hex its ground (the most of what is in it), its height and wet floor as the world
  // look draws it, and its second ground with its share (a hex mostly plain with some woods); the places; the roads and rivers as the hexes they run through
  // (a 5-mile hex he has not painted takes THE FILL's ground, below -- since 10-21; it was corridor v3's guess. Each hex's [8]: 1 the fill's, 2 the fill's
  // ground with his paint under half of it its second, 0 his; [7], the guess, is 0 now)
  //
  // THE FILL (10-21, RULED his "all the unpainted hexes should take on paint of adjacent regions", the world fill seat): every 5-mile hex in the bake's box
  // he has not painted takes the paint of the regions beside it, ring by ring outward from his paint -- each the most of its six neighbours already
  // grounded (his, or the fill's a ring nearer, so the order within a ring does not matter); a tie by the nearer (the ground whose own painted hex is
  // fewest hexes away), then the lower ground (its terrain's alt), then its key. A lake, a cut (the gulch, the Rift) and a town are places, not regions:
  // the fill spreads from the regions alone, as the heights' blend lets a lake or a cut take the land round it (else Halfway Lake, winning its ties as
  // the lowest ground and the only paint beside the road's holes, grew over the Pit road); a place fills only a hole it walls in. The sea is a region.
  // A hex is his wherever he painted it or anything in it, its ground the most of what he painted, as the world look shows it (a mile hex counted
  // where it or any 330 ft hex in it is painted) -- save a place painted under half of it (Halfway Lake in its corner, the gulch's cut along the road):
  // that one is filled like the rest and keeps his place as its second ground. The fill is the bake's and the flat looks' (FILL), never written to his
  // paint; corridor v3's guess (classify) stays GUESS's, paint he chooses to take.
  function paintBox() {
    var b = [1e9, 1e9, -1e9, -1e9];
    [1, 2, 3].forEach(function (l) { for (var k in S.paint[l]) { var h = unK(k), c = hc(l, h[0], h[1]); b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); } });
    return b;
  }
  function milesIn(q, r) { var n = LV[2].n, m = 0; kids(n).forEach(function (d) { if (domT(2, n * q + d[0], n * r + d[1])) m++; }); return m; } // (its mile hexes painted, finer paint counted)
  function fillOf(b) {
    hcheck();
    var w = LV[1].w, hh = w * SQ3 / 2, half = Math.ceil(kids(LV[2].n).length / 2), F = { g: {}, ring: {}, own: {}, box: [], n: 0 }, inB = {}, src = {};
    var place = function (t) { return !TB[t] || t === 'lake' || t === 'town' || +TB[t].cut > 0; };
    for (var r = Math.floor(b[1] / hh) - 1; r <= Math.ceil(b[3] / hh) + 1; r++) for (var q = Math.floor(b[0] / w - r / 2) - 1; q <= Math.ceil(b[2] / w - r / 2) + 1; q++) {
      var k = K(q, r), t = domT(1, q, r); F.box.push(k); inB[k] = 1;
      if (t && (!place(t) || S.paint[1][k] || milesIn(q, r) >= half)) { F.g[k] = t; F.ring[k] = 0; F.own[k] = 1; (src[t] = src[t] || []).push([q, r]); }
    }
    var alt = function (t) { return TB[t] ? +TB[t].alt || 0 : 0; }, near = function (h, t) { var d = 1e9; (src[t] || []).forEach(function (s) { d = Math.min(d, hdist(h, s)); }); return d; };
    var spread = function (front) {
      for (var ring = 1; front.length; ring++) {
        var cand = {}, got = [];
        front.forEach(function (k) { var h = unK(k); DIRS.forEach(function (o) { var kk = K(h[0] + o[0], h[1] + o[1]); if (inB[kk] && !F.g[kk]) cand[kk] = 1; }); });
        Object.keys(cand).forEach(function (k) {
          var h = unK(k), n = {}, best = null;
          DIRS.forEach(function (o) { var t = F.g[K(h[0] + o[0], h[1] + o[1])]; if (t) n[t] = (n[t] || 0) + 1; });
          if (Object.keys(n).some(function (t) { return !place(t); })) Object.keys(n).forEach(function (t) { if (place(t)) delete n[t]; });
          Object.keys(n).forEach(function (t) {
            if (!best || n[t] > n[best]) { best = t; return; }
            if (n[t] < n[best]) return;
            var a = near(h, t), c = near(h, best); if (a !== c) { if (a < c) best = t; return; }
            if (alt(t) !== alt(best)) { if (alt(t) < alt(best)) best = t; return; }
            if (t < best) best = t;
          });
          got.push([k, best]);
        });
        got.forEach(function (e) { F.g[e[0]] = e[1]; F.ring[e[0]] = ring; F.n++; });
        front = got.map(function (e) { return e[0]; });
      }
    };
    spread(Object.keys(F.own).filter(function (k) { return !place(F.g[k]); })); // (the regions)
    if (F.n + Object.keys(F.own).length < F.box.length) spread(Object.keys(F.g)); // (a hole a place walls in)
    return F;
  }
  var FL = null, FLV = -1, FLT = 0, flT = 0;
  function fillNow() { // (the looks': rebuilt when the paint changes, at most every 0.6 s while he paints, as ar())
    if (!FL || (FLV !== VER && Date.now() - FLT > 600)) { FL = fillOf(paintBox()); FLV = VER; FLT = Date.now(); }
    else if (FLV !== VER && !flT) flT = setTimeout(function () { flT = 0; HC.clear(); LAYERKEY = ''; draw(); }, 650);
    return FL;
  }
  function fillAt(F, x, y) { // (a point he has not painted: its 5-mile hex's ground as baked; past the box's edge, the nearest hex's)
    var h = at(1, x, y), t = F.g[K(h[0], h[1])], bd = 1e9;
    if (t) return t;
    for (var dr = -3; dr <= 3; dr++) for (var dq = -3; dq <= 3; dq++) { var d = hdist([0, 0], [dq, dr]), tt = F.g[K(h[0] + dq, h[1] + dr)]; if (tt && d < bd) { bd = d; t = tt; } }
    return t || null;
  }
  async function bake() {
    hcheck(); ar();
    var L = 1, out = { v: 1, baked: new Date().toISOString(), hexMi: LV[1].w, saved: S.saved || null, terr: {}, hexes: [], sites: [], paths: [], guessed: 0, filled: 0, parted: 0 };
    S.terr.forEach(function (t) { out.terr[t.k] = { name: t.name, color: t.color, cost: +t.cost, diff: !!t.diff, alt: +t.alt, cut: +t.cut || 0 }; });
    var b = paintBox(), F = fillOf(b), nk = kids(LV[2].n).length; FINE0 = { F: F, b: b }; // (THE FINE LAND, below, bakes on the same box and fill)
    F.box.forEach(function (k) {
      var h = unK(k), q = h[0], r = h[1], t = F.g[k], mine = domT(L, q, r), cc = hc(L, q, r), fill = 0;
      if (!t) return; // (no paint anywhere)
      if (!F.own[k]) fill = mine && mine !== t ? 2 : mine ? 0 : 1; // (painted under half with the ground the fill gives it: his, as it was)
      var e = fill ? [hAt(cc[0], cc[1], t), cc[0], cc[1], PW] : hexE(L, q, r), t2 = null, sh = 0;
      if (fill === 1) out.filled++;
      if (fill === 2) { out.parted++; t2 = mine; sh = Math.round(milesIn(q, r) / nk * 100) / 100; }
      else if (!fill && DC[1].get(k)) { // (its second ground: the next most of its mile hexes)
        var cnt = {}, n = 0; kids(LV[2].n).forEach(function (d) { var tt = domT(2, 5 * q + d[0], 5 * r + d[1]); if (tt) { cnt[tt] = (cnt[tt] || 0) + 1; n++; } });
        Object.keys(cnt).forEach(function (tt) { if (tt !== t && cnt[tt] > sh) { sh = cnt[tt]; t2 = tt; } }); sh = n ? Math.round(sh / n * 100) / 100 : 0;
      }
      out.hexes.push([q, r, t, Math.round(e[0]), e[3] ? 1 : 0, t2, sh, 0, fill]);
    });
    out.tiles = bakeTiles(F, b); out.look = bakeLook();
    S.sites.forEach(function (s) { var h = at(1, s.x, s.y); out.sites.push({ id: s.id, name: s.name, kind: s.kind, x: +s.x.toFixed(3), y: +s.y.toFixed(3), hex: [h[0], h[1]], note: s.note || '' }); });
    S.paths.forEach(function (P) {
      var pts = ptsOf(P); if (pts.length < 2) return;
      var hexes = [], last = null, len = 0;
      for (var i = 0; i + 1 < pts.length; i++) {
        var A = pts[i], B2 = pts[i + 1], sl = Math.hypot(B2[0] - A[0], B2[1] - A[1]), n2 = Math.max(1, Math.ceil(sl / 0.25)); len += sl;
        for (var j = 0; j <= n2; j++) { var hx = at(1, A[0] + (B2[0] - A[0]) * j / n2, A[1] + (B2[1] - A[1]) * j / n2), hk = K(hx[0], hx[1]); if (hk !== last) { hexes.push([hx[0], hx[1]]); last = hk; } }
      }
      out.paths.push({ id: P.id, name: P.name, kind: P.kind, difficult: !!P.difficult, going: roadGoing(P), mi: +len.toFixed(2), pts: pts.map(function (p) { return [+p[0].toFixed(3), +p[1].toFixed(3)]; }), hexes: hexes,
        ends: [typeof P.pts[0] === 'string' ? P.pts[0] : null, typeof P.pts[P.pts.length - 1] === 'string' ? P.pts[P.pts.length - 1] : null] });
    });
    return out;
  }

  // THE TILES (10-20, his "let's yes the 1-4 above and see what comes out": the world as half-mile tiles, a 16-bit top-down walk, its heights as ledges): every
  // half mile its ground (the finest he painted, else THE FILL's for its 5-mile hex), its height's band (500 ft a ledge), its road, track or river. Run-length
  // rows, a char a ground; the bands one char a tile (0-9a-z)
  var TCH = { plains: '.', verge: ',', farms: 'f', foothills: 'h', hills: 'H', woods: 'T', gulch: 'g', bog: 'b', black: 'M', gray: 'G', coastal: 'C', town: 't', lake: 'l', sea: 's', rift: 'R' };
  function bakeTiles(F, b) {
    var mi = 0.5, x0 = Math.floor((b[0] - 6) / mi) * mi, y0 = Math.floor((b[1] - 6) / mi) * mi, w = Math.ceil((b[2] + 6 - x0) / mi), h = Math.ceil((b[3] + 6 - y0) / mi);
    var chars = {}, used = {}, pool = 'ABDEFIJKLNOPQSUVXYZcdeijkmnopqruvxyz'.split(''), chOf = function (k) {
      if (chars[k]) return chars[k]; var c = TCH[k]; if (!c || used[c]) c = pool.shift() || '?'; chars[k] = c; used[c] = k; return c;
    };
    var B36 = '0123456789abcdefghijklmnopqrstuvwxyz', rle = function (arr) { var o = [], i = 0; while (i < arr.length) { var j = i; while (j < arr.length && arr[j] === arr[i]) j++; o.push(arr[i] + (j - i)); i = j; } return o.join(' '); };
    var roadAt = {}; // (each road's, track's and river's tiles, sampled every eighth of a mile)
    S.paths.forEach(function (P) {
      var pts = ptsOf(P), code = P.kind === 'river' ? '3' : roadGoing(P) > 1 ? '4' : P.kind === 'track' ? '2' : '1'; // (4: a mountain road, its own roam -- not walked on the world map)
      for (var i = 0; i + 1 < pts.length; i++) {
        var A = pts[i], B2 = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(B2[0] - A[0], B2[1] - A[1]) / 0.125));
        for (var j = 0; j <= n; j++) { var tx = Math.floor((A[0] + (B2[0] - A[0]) * j / n - x0) / mi), ty = Math.floor((A[1] + (B2[1] - A[1]) * j / n - y0) / mi), k = tx + ',' + ty; if (!roadAt[k] || (roadAt[k] === '3' && code !== '3')) roadAt[k] = code; }
      }
    });
    var tRows = [], bRows = [], rRows = [], wet = [];
    LK = { mi: mi, x0: x0, y0: y0, w: w, h: h, H: new Float32Array(w * h), T: [], W: new Uint8Array(w * h) }; // (the same samples light THE LOOK, below)
    for (var ty = 0; ty < h; ty++) {
      var tr = [], br = '', rr = [];
      for (var tx = 0; tx < w; tx++) {
        var x = x0 + (tx + 0.5) * mi, y = y0 + (ty + 0.5) * mi, t = terrAtMi(x, y);
        if (!t) t = fillAt(F, x, y);
        if (!t) t = 'plains';
        var hv = hAt(x, y, t), bd = Math.max(0, Math.min(35, Math.floor(hv / 500)));
        if (PW && t !== 'lake' && t !== 'sea') { wet.push(tx + ty * w); LK.W[tx + ty * w] = 1; }
        LK.H[tx + ty * w] = hv; LK.T[tx + ty * w] = t;
        tr.push(chOf(t)); br += B36.charAt(bd); rr.push(roadAt[tx + ',' + ty] || '.');
      }
      tRows.push(rle(tr)); bRows.push(br); rRows.push(rle(rr));
    }
    var key = {}; Object.keys(chars).forEach(function (k) { key[chars[k]] = k; });
    return { mi: mi, x0: x0, y0: y0, w: w, h: h, key: key, t: tRows, b: bRows, r: rRows, wet: wet };
  }

  // THE LOOK (10-21, RULED his "agree with lean" to the desk's mosaic, then his "it seems to me the second image could look more like the first with a
  // clever paintjob": the 5-mile columns read as blocks, the 330 ft preview as rolling relief). Every half mile of the world as the finest view lights it:
  // its ground the finest paint there (330 ft, else 1 mile, else the hex's own, else THE FILL's), its height the tool's own ground and fractal, lit by
  // its own slope from the north-west, filmed where wet, snowed where high -- one small picture, deep16/data/world-look.png (tools/world-build.py), that
  // THE WORLD lays on each hex's top. LOOKE: the heights' exaggeration in the lighting (the 5-mile columns light at 6 across 5 miles; a half mile's
  // slopes are gentler, so more)
  var LK = null, LOOKE = 14;
  function bakeLook() {
    var L = LK, w = L.w, h = L.h, k = LOOKE / 5280, c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data, H = L.H;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var i = x + y * w, t = L.T[i], s = 1;
      if (!isWet(t)) {
        var xa = Math.max(0, x - 1), xb = Math.min(w - 1, x + 1), ya = Math.max(0, y - 1), yb = Math.min(h - 1, y + 1);
        var gx = (H[xb + y * w] - H[xa + y * w]) / ((xb - xa) * L.mi), gy = (H[x + yb * w] - H[x + ya * w]) / ((yb - ya) * L.mi);
        var nl = Math.sqrt(gx * gx * k * k + gy * gy * k * k + 1); s = (0.503 * gx * k + 0.503 * gy * k + 0.704) / nl / 0.704;
        s = Math.round(Math.max(0.42, Math.min(1.4, s)) * 16) / 16;
      }
      var col = toneRGB(t, s, H[i], false, !!L.W[i]); d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return { mi: L.mi, x0: L.x0, y0: L.y0, w: w, h: h, png: c.toDataURL('image/png') };
  }

  // THE FINE LAND (10-21 night, the world map seat; a TRIAL, Griz: "Rather than shading the tops of the big hexes, can we actually draw the 330 terrain with
  // the exception of the two hexes around the hero (build as trial alternate, don't break existing)", then "(a) but two rings" and "The land, raised"): every
  // 330 ft of the world its ground (the finest paint there, else THE FILL's) and a wet floor's mark, and every eighth of a mile its height (the mean of its
  // four 330 ft points, the tool's own ground and fractal) -- one buffer that tools/world-build.py packs into deep16/data/world-fine.bin, raised as the land
  // itself by deep16/js/worldfine.js. Called after bake(), on its box and its fill; it leaves bake()'s own output as it was.
  var FINE0 = null;
  function bakeFine() {
    hcheck(); ar();
    var F = FINE0 ? FINE0.F : fillOf(paintBox()), mi = 1 / 16, hs = 2, b = [1e9, 1e9, -1e9, -1e9], hw1 = LV[1].w; // (hs: 330 ft points to a height's side)
    F.box.forEach(function (k) { if (!F.g[k]) return; var q = unK(k), c = hc(1, q[0], q[1]); b[0] = Math.min(b[0], c[0] - hw1); b[1] = Math.min(b[1], c[1] - hw1); b[2] = Math.max(b[2], c[0] + hw1); b[3] = Math.max(b[3], c[1] + hw1); }); // (the box: every hex the bake keeps, a hex round)
    var x0 = Math.floor(b[0] / 0.5) * 0.5, y0 = Math.floor(b[1] / 0.5) * 0.5, hw = Math.ceil((b[2] - x0) / (mi * hs)), hh = Math.ceil((b[3] - y0) / (mi * hs)), w = hw * hs, h = hh * hs;
    var keys = S.terr.map(function (t) { return t.k; }), ix = {}; keys.forEach(function (k, i) { ix[k] = i; }); if (ix.plains === undefined) { ix.plains = keys.length; keys.push('plains'); }
    var T = new Uint8Array(w * h), H = new Int16Array(hw * hh), acc = new Float64Array(hw), t0 = Date.now();
    for (var y = 0; y < h; y++) {
      if (!(y % hs)) acc.fill(0);
      for (var x = 0; x < w; x++) {
        var px = x0 + (x + 0.5) * mi, py = y0 + (y + 0.5) * mi, t = terrAtMi(px, py);
        if (!t) t = fillAt(F, px, py);
        if (!t || ix[t] === undefined) t = 'plains';
        var hv = hAt(px, py, t);
        T[x + y * w] = ix[t] | (PW && t !== 'lake' && t !== 'sea' ? 128 : 0); // (128: a thin sheet of water on the ground, a wet LIFT's floor)
        acc[(x / hs) | 0] += hv;
      }
      if (y % hs === hs - 1) for (var i = 0; i < hw; i++) H[i + ((y / hs) | 0) * hw] = Math.max(-32000, Math.min(32000, Math.round(acc[i] / (hs * hs))));
    }
    var u8 = new Uint8Array(T.length + H.length * 2); u8.set(T, 0); u8.set(new Uint8Array(H.buffer), T.length); // (the heights little-endian, as every PC and browser keeps them)
    var bin = '', CH = 0x8000; for (var o = 0; o < u8.length; o += CH) bin += String.fromCharCode.apply(null, u8.subarray(o, o + CH));
    return { v: 1, mi: mi, x0: x0, y0: y0, w: w, h: h, hs: hs, hw: hw, hh: hh, keys: keys, ms: Date.now() - t0, b64: btoa(bin) };
  }

  // ---------------------------------------------------------------- go
  load();
  window.HEXMAP = { S: function () { return S; }, view: view, at: at, up: up, kids: kids, hc: hc, effAt: effAt, measure: measure, LV: LV, GROW: GROW, grow: grow, hAt: function (x, y) { hcheck(); return hAt(x, y); }, hexH: hexH, // (for the seat's probes)
    dbg: function (x, y) { hcheck(); var t = terrAtMi(x, y), raw = hRaw(x, y, t), lift = peaksAt(x, y); return { t: t, blend: bil(AR.A, x, y), raw: raw, lift: lift, bed: bedAt(x, y, raw) }; },
    bake: bake, bakeFine: bakeFine, fill: function () { return fillOf(paintBox()); },
    redraw: function () { LAYERKEY = ''; drawNow(); } };
  window.addEventListener('resize', resize);
  S.under.forEach(function (u) { if (u.on) loadUnder(u); });
  if (!S.view) { view.L = 1; view.cx = 54 * GROW; view.cy = 30 * GROW; view.z = 11 / GROW; }
  resize(); panels();
  $('origin').textContent = 'this browser keeps its copy for ' + location.host + ' (another port is another copy)';
  if (GREW) { saveNow(); msg('Your version 1 map has grown ×' + GROW + ' to the four-wagon-day road (Silverton to the Pit 68 mi). Version 1 is still kept in this browser, untouched. EXPORT is the save.'); }
  else if (SHAPED || SEEDED || LAKED || WENT || GULCHED || FORKED || SILVERED || RESUNK || CLIMBED || HAIRPINNED || REGRADED) { saveNow(); msg((REGRADED ? 'The Coldridge climb is graded along your own line: the face and the road\'s ledge follow your hairpins from the junction to the shelf, evenly; your ten lifts by the shelf keep to their hex (a half-mile spread). ' : '') + (HAIRPINNED ? 'The Coldridge climb is in hairpins now: ten legs across one smooth face from the junction to the shelf, near an 11% grade, the road some 2 mi longer; the face\'s mile hexes painted by height. ' : '') + (CLIMBED ? 'The Coldridge climb is shaped: the road out of the Galleries junction graded evenly up to its shelf at about 5,400 ft, the shelf held flat for some 2 mi (the iso roam to come), the road\'s unpainted mile hexes painted by height (L shows the two levels). ' : '') + (RESUNK && !SILVERED ? 'The mountains behind Silverton are back: your two sinks, moved 3 mi west, had sunk the black range, so they lie 3 mi south-west of your spots now, in your trough’s floor. ' : '') + (SILVERED ? 'Silverton is fit to the realm: your two sinks beside it are moved 3 mi south-west (the town had sat at -530 ft), the Warrens’ bank is a bench over the river, the camp is a place, and the feed track runs to it (L shows the lifts). ' : '') + (FORKED ? 'The fork is dragged 5.6 mi down the Pit road (your “drag the fork south a bit”): the west road leaves it along a thin row of plains, the bog north of it, the gnoll hills south, the Glowseep beside it. ' : '') + (LAKED ? 'Halfway Lake is painted back at the inn, from corridor v3’s outline. ' : '') + (WENT ? 'The Coldridge Route goes at its own going now: three wagon-days. ' : '') + (GULCHED ? 'Web Gulch is a place on the Pit road, its mile hexes painted gulch. ' : '') + (SHAPED ?'The Coldridge Route is a difficult road now, its climb to the Doors in switchbacks: three wagon-days (its panel puts back your drawing). ' : '') + (SEEDED ? 'The Doors’ schools are placed (the five in their valley, the rest solo), and the mountain-foot water runs from the bogs to the Glowseep (L shows the lifts). ' : '') + 'EXPORT is the save.'); }
  else msg('Kept in this browser as you go; EXPORT is the save.');
})();
