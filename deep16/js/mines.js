/* DEEP16 -- THE TOP LEVELS: the Crawler Warrens' and the Guano Galleries' worked floors on the town's tiles (10-21 night, the top levels seat, started by the
   lanes desk; ..\handoff-2026-10-21-the-warrens-and-galleries-on-the-tiles.md). Griz, to the desk: "spin up a lane to convert the warrens top levels and the
   guano mines top levels from 18 bit onto the tiling engine we're using for silverton" (his "18 bit": the first game's 8-bit floors).

   Each floor is the first game's own map (content/maps/<id>.json, read from DS.DATA.maps and never written -- the first game keeps its floors), a square of it a
   square of the grid, drawn north up as Silverton is (js/topview.js, a def's `view: 'top'`): its mountain and cave walls rock, its roofs and walls buildings under
   the town's roofs (js/town.js T.ROOFS: blue slate for the first game's brown, grey shingle for its stone), each door's threshold the square south of it, a USE
   (js/town.js T.fire: the keeper's word at the door, a shop's shelves on the counter screen), its people where the first game stands them, by their ids, with their
   words (content/npcs.json: T.say, js/counter.js C.words), its scripted people on the counter screen by the first game's own scenes in its own words (js/events.js
   S.skarn, S.edric, S.pen, S.skarnGate, S.sabeth, S.ottilie, S.roostDoor, S.dace, S.wynn, js/deep.js S.hobHeir: M.SCENES; content/text.json), its flags the
   first game's names. The ground's looks (guano, the cave's floor, the cart rails, the fungus beds, a mouth's dark) ride a `look` layer beside the rows.

   The ways: a warp between a place's two floors walks the party down or up (M.go); a warp to a dark floor -- the abandoned workings, the Wet, the dens, the deep
   gallery -- says so and keeps the party (those wait for the grid's roam: the house lane holds the Wet). The Galleries' mouth opens off THE WORLD's site (js/world.js
   W.DOORS mouth) and its far squares lead back out to it; the Warrens have no site on THE WORLD (the realm's mouth camp is ~4 mi out of Silverton, over the bridge
   on the feed track -- TarlynsPit/wiki/the-warrens.md, CANON 09-09; the first game's quest: "out the east gate and over the bridge"), so Silverton's feed track off
   its floor's east edge opens the camp, and the camp's far squares take the party back up the feed track to Silverton. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, M = D.mines = {};
  var T = D.town;

  // the floors: the first game's map, the door they are saved by (js/world.js W.DOORS -- the house's save names it: js/roam.js R.canSave), where the party comes in by
  // each gate [x, y, facing], and whether a SAVE is had there (the first game's own rule: its mouths save, its worked floors below are `save: false`)
  M.FLOORS = {
    warrens: { src: 'warrens_a', door: 'warrens', place: 'The Crawler Warrens', sub: 'the mouth camp', save: true, out: 'silverton',
      gates: { feed: [20, 17, [0, -1]] } }, // (in off the feed track on the road below the bridge, where the first game's world warp sets the party down: content/maps/world.json)
    warrens_b: { src: 'warrens_b', place: 'The Crawler Warrens', sub: 'the stalls and the lit galleries', save: false },
    warrens_c: { src: 'warrens_c', place: 'The Crawler Warrens', sub: 'the abandoned workings', save: false },
    galleries: { src: 'galleries_g1', door: 'mouth', place: 'The Guano Galleries', sub: 'the mouth', save: true, out: 'world',
      gates: { east: [34, 21, [-1, 0]], south: [17, 22, [0, -1]], west: [1, 21, [1, 0]] } }, // (THE WORLD's site: the road in from the junction east, a step inside each edge)
    galleries_g2: { src: 'galleries_g2', place: 'The Guano Galleries', sub: 'the working gallery', save: false },
    galleries_g3: { src: 'galleries_g3', place: 'The Guano Galleries', sub: 'the dens', save: false },
    // the Glowseep (10-21 night, Griz to the desk: "Go on the Glowseep - run with its leans for all, including the time-slowing but that might be adjusted. Thematically
    // correct"): no first game's map -- the seat's own (M.SEEP), for his paint later; THE WORLD's site 'glowseep', in from the mile
    glowseep: { src: 'glowseep', own: true, door: 'glowseep', place: 'The Glowseep', sub: 'the light-crews\' ground by the mile', save: true, out: 'world', clock: true,
      gates: { east: [38, 14, [-1, 0]], north: [35, 1, [0, 1]], south: [35, 26, [0, -1]] } }
  };
  // (the top levels, RULED 10-21 night, Griz to the desk: "rather than the cloaker fight, that hole floor. above it are top levels" -- the Galleries' to the dens, the deep
  // gallery the hole floor below; the Warrens' to the abandoned workings, the Wet below them already the grid's own)
  M.KEY8 = { warrens_a: 'warrens', warrens_b: 'warrens_b', warrens_c: 'warrens_c', warrens_d: 'wet', galleries_g1: 'galleries', galleries_g2: 'galleries_g2', galleries_g3: 'galleries_g3' };
  // the floors below that are the grid's own roam, not these tiles: the Wet (js/roam.js R.wholeWet, the whole of warrens_d turned as the Settling's grid is), the house's floor
  // since 10-22 (the lanes desk, Griz: "yeah, work the wet - we have second game saves matching the first now, everything should be there it needs for handoff") -- in by the
  // stalls' stair and the workings', out by them again (js/roam.js R.landed); no SAVE there, as the first game has none
  M.ROAMS = { wet: { place: 'The Crawler Warrens', sub: 'the Wet', save: false } };
  M.FEED = [78, 10]; // (Silverton's feed track where it runs off the town floor's east edge -- the bench checks it is still the feed track's: mode=toplevels1021)
  M.key = function (q) { var m = /[?&]roam=([a-z0-9_]+)/.exec(q || ''); return m && M.FLOORS[m[1]] ? m[1] : null; };

  // the first game's legend, by name, as the grid's squares (js/iso.js OPEN, STANDS) and the look under them (js/topview.js TV.LOOKS)
  M.LAY = {
    void: ['#'], caveWall: ['#'], timber: ['#'], mountain: ['#'], range: ['#'], cliff: ['#'], runeWall: ['#'], dwarfWall: ['#'], sealDoor: ['#'], chimney: ['#'],
    caveFloor: ['.', 'C'], bones: ['.', 'C'], webFloor: ['.', 'C'], dwarfFloor: ['='], rails: ['.', 'R'], railsH: ['.', 'H'], gravel: ['.', 'Y'], fungus: ['.', 'M'], glowmoss: ['.', 'N'],
    mud: ['.', 'A'], reeds: ['.', 'E'], stump: ['k'], firepit: ['w'],
    guano: ['.', 'U'], guanoDeep: ['r', 'Q'], ladder: ['.', 'Z'], pool: ['~'], ooze: ['~'], deep: ['D'], water: ['D'],
    stairsDown: ['d', 'X'], stairsUp: ['d', 'X'], holeDown: ['d', 'X'], drownStair: ['d', 'X'],
    gate: ['f'], fence: ['f'], lamp: ['f'], minecart: ['k'], crateCave: ['k'], crate: ['k'], tent: ['k'], stalag: ['k'], tree: ['k'], cradle: ['y'], well: ['w'], headframe: ['w'],
    dirt: [','], road: [','], grass: ['g'], bridgeV: ['o']
  };
  M.ROOF = { roofB: 'n', roofS: 'h' }; M.WALL = { wall: 1, wallWin: 1, door: 1 }; // (a wall's building takes the roof above it in its column)
  M.MOUTH = { stairsDown: 1, stairsUp: 1, holeDown: 1, drownStair: 1 };
  var OPENCH = '.,gr~do=';
  M.FACE = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  // ---------------------------------------------------------------- a floor from the first game's map: deep16/?roam=<key> (js/roam.js R.make)
  // &gate=<one of the floor's gates> or &at=x,y (&face=dx,dy): where the party stands
  M.floor = function (key, q, flags, hour) {
    q = q || ''; flags = flags || {};
    var F = M.FLOORS[key]; if (hour == null) hour = M.hourNow(q);
    var m8 = F.own ? M.seepMap(hour) : DS.DATA.maps[F.src], leg = m8.legend, r8 = m8.rows, w = r8[0].length, h = r8.length;
    var nm = function (x, y) { return x < 0 || y < 0 || x >= w || y >= h ? 'void' : leg[r8[y].charAt(x)] || 'void'; };
    var g = [], lk = [], y, x;
    for (y = 0; y < h; y++) { g.push([]); lk.push([]); for (x = 0; x < w; x++) { var n = nm(x, y), L = M.LAY[n] || (M.ROOF[n] || M.WALL[n] ? ['B'] : n === 'lantern' ? ['l'] : ['#']); g[y].push(L[0]); lk[y].push(L[1] || ' '); } }
    // the buildings: a roof its own look, a wall the roof above it in its column (two roofs side by side over one wall row read as two buildings)
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      if (g[y][x] !== 'B') continue;
      var n2 = nm(x, y), ch = M.ROOF[n2] || null;
      for (var yu = y - 1; !ch && yu >= 0 && g[yu][x] === 'B'; yu--) ch = M.ROOF[nm(x, yu)] || null;
      g[y][x] = ch || 'n';
    }
    // a door's threshold: the square south of it, dressed stone (js/topview.js draws the door in the wall above it)
    var doors8 = {};
    for (y = 0; y < h - 1; y++) for (x = 0; x < w; x++) if (nm(x, y) === 'door' && OPENCH.indexOf(g[y + 1][x]) >= 0) { g[y + 1][x] = 'd'; lk[y + 1][x] = ' '; doors8[x + ',' + y] = [x, y + 1]; }
    // a lantern: a post where it stands free in a gallery, the rock it hangs on where it is in a wall
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (g[y][x] === 'l') { var free = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(function (o) { var r = g[y + o[1]]; return r && OPENCH.indexOf(r[x + o[0]]) >= 0; }); g[y][x] = free ? 'f' : '#'; }
    // a mine's mouth in the mountain's face: the first game's stair a square out from the rock gets the rock behind it (so the face above the stair shows the way in)
    for (y = 2; y < h; y++) for (x = 0; x < w; x++) if (M.MOUTH[nm(x, y)] && nm(x, y - 1) === 'caveFloor' && g[y - 2][x] === '#') { g[y - 1][x] = '#'; lk[y - 1][x] = ' '; }
    // the flag tiles (Skarn's gate open): the gallery's floor, its look the square's north of it
    (m8.flagTiles || []).forEach(function (ft) { if (ft.tile === 'gateOpen' && T.cond(ft.cond, flags)) { g[ft.y][ft.x] = '.'; lk[ft.y][ft.x] = ft.y > 0 ? lk[ft.y - 1][ft.x] : 'C'; } });
    // the roofs' ridges, along each building's longer side (js/town.js's `slope`: 1 the side toward the light, 2 away, 3 the ridge; 4-6 the same, the ridge north-south)
    var slope = [], seen = {};
    for (y = 0; y < h; y++) slope.push(new Array(w + 1).join('0').split(''));
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      if (!T.ROOFS[g[y][x]] || seen[x + ',' + y]) continue;
      var c0 = g[y][x], q0 = [[x, y]], comp = [], x0 = x, x1 = x, y0 = y, y1 = y; seen[x + ',' + y] = 1;
      while (q0.length) { var p = q0.pop(); comp.push(p); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (o) { var a = p[0] + o[0], b = p[1] + o[1]; if (a >= 0 && b >= 0 && a < w && b < h && g[b][a] === c0 && !seen[a + ',' + b]) { seen[a + ',' + b] = 1; q0.push([a, b]); } }); }
      var ew = x1 - x0 >= y1 - y0;
      comp.forEach(function (p) { var k = ew ? p[1] - y0 : p[0] - x0, mid = ((ew ? y1 - y0 : x1 - x0)) / 2, s = k < mid ? 1 : k > mid ? 2 : 3; slope[p[1]][p[0]] = String(ew ? s : s + 3); });
    }
    // the triggers: a keeper's or a shop's door a USE at its threshold; the floor's own (the pens, Skarn's gate) its scenes (M.trigger); the mouth's light rule the warp's
    var trig = [], marks = { doors: {}, gates: {} }, N = DS.DATA.npcs || {}, SH = DS.DATA.shops || {};
    (m8.triggers || []).forEach(function (t) {
      var r = t.rect ? t.rect.slice() : [t.x, t.y, 1, 1], th = doors8[r[0] + ',' + r[1]];
      if (/^(keeper|shop|inn):/.test(t.id) && th) {
        var arg = t.id.split(':')[1], who = (SH[arg] && SH[arg].name) || (N[arg] && N[arg].name) || arg;
        trig.push({ id: t.id, on: 'use', rect: [th[0], th[1], 1, 1], town: 'door', door: { id: t.id, name: who } }); marks.doors[t.id] = th.slice(); return;
      }
      if (t.script === 'roostDoor') return; // (Ottilie at the mouth: the warp asks it -- M.warp)
      trig.push(Object.assign({}, t, { rect: r, town: 'mine' }));
    });
    // the people where the first game stands them, by its conditions on the floor's flags
    var people = [];
    (m8.npcs || []).forEach(function (n) {
      if (n.prop || !T.cond(n.cond, flags)) return;
      people.push({ id: n.id, at: [n.x, n.y], kind: T.KIND[n.look] || 'bandit', face: T.FACE[n.dir] || [0, 1], look: n.look, hire: null });
      trig.push({ id: 'talk:' + n.id, on: 'use', rect: [n.x, n.y, 1, 1], town: 'talk', npc: n.id });
    });
    // the ways off: the far squares on each side the first game leaves by (its `exits`), and every warp
    var ways = [], wayName = {}, warps = [], ex = m8.exits || {}, side = function (x2, y2) { return x2 === 0 ? 'west' : x2 === w - 1 ? 'east' : y2 === h - 1 ? 'south' : y2 === 0 ? 'north' : null; };
    var walkable = function (c) { return OPENCH.indexOf(c) >= 0 && c !== 'D' && c !== '~'; };
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) { var sd = side(x, y); if (sd && ex[sd] && walkable(g[y][x])) { ways.push([x, y]); wayName[x + ',' + y] = F.out === 'silverton' ? 'the feed track: back over the bridge to Silverton' : 'out to the ' + sd + ', onto the road'; } }
    (m8.warps || []).forEach(function (wp) {
      warps.push({ at: [wp.x, wp.y], to: wp.to, tx: wp.tx, ty: wp.ty, dir: wp.dir, cond: wp.cond || null });
      if (!ways.some(function (q2) { return q2[0] === wp.x && q2[1] === wp.y; })) ways.push([wp.x, wp.y]);
      wayName[wp.x + ',' + wp.y] = 'the way to ' + (((DS.DATA.maps[wp.to] || {}).name) || wp.to).replace(/^The /, 'the ');
    });
    // the ways marked (10-22, his eye on the Galleries' mouth: "couldn't find the east passage the the combat area"): each run of a way's squares one mark at its middle,
    // named by where it goes -- drawn on the floor while the party is near (M.paintWays), green on the floor map (L), said in the hello
    var short = function (x2, y2) { var wp = (m8.warps || []).filter(function (z) { return z.x === x2 && z.y === y2; })[0]; if (!wp) return F.out === 'silverton' ? 'the feed track' : 'the road'; var k8 = M.KEY8[wp.to], f8 = k8 && (M.FLOORS[k8] || M.ROAMS[k8]); return f8 ? f8.sub : String(((DS.DATA.maps[wp.to] || {}).name) || wp.to).split(' — ').pop() + ' (held)'; };
    var isWay = {}, gone = {}, wayMarks = []; ways.forEach(function (q2) { isWay[q2[0] + ',' + q2[1]] = short(q2[0], q2[1]); });
    ways.forEach(function (q2) {
      var k0 = q2[0] + ',' + q2[1]; if (gone[k0]) return; gone[k0] = 1;
      var run = [q2], i0 = 0, sd0 = side(q2[0], q2[1]); while (i0 < run.length) { var c0 = run[i0++]; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (o) { var x1 = c0[0] + o[0], y1 = c0[1] + o[1], k1 = x1 + ',' + y1; if (!gone[k1] && isWay[k1] === isWay[k0] && side(x1, y1) === sd0) { gone[k1] = 1; run.push([x1, y1]); } }); } // (one mark a side: the road off the west edge and off the south edge two ways)
      run.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
      var mid = run[run.length >> 1], sd2 = side(mid[0], mid[1]);
      wayMarks.push({ at: mid.slice(), name: isWay[k0], side: sd2, n: run.length });
    });
    // where the party stands
    var gq = (/[?&]gate=([a-z]+)/.exec(q) || [])[1], aq = /[?&]at=(\d+),(\d+)/.exec(q), fq = /[?&]face=(-?\d),(-?\d)/.exec(q), at = null, face = [0, -1];
    if (aq) at = [+aq[1], +aq[2]];
    else { var gk = F.gates ? (F.gates[gq] ? gq : Object.keys(F.gates)[0]) : null, gt = gk && F.gates[gk]; if (gt) { at = [gt[0], gt[1]]; face = gt[2].slice(); gq = gk; } }
    if (!at && warps.length) { var w0 = warps[0]; at = [[0, -1], [0, 1], [1, 0], [-1, 0]].map(function (o) { return [w0.at[0] + o[0], w0.at[1] + o[1]]; }).filter(function (q) { return g[q[1]] && walkable(g[q[1]][q[0]] || '#') && !ways.some(function (z) { return z[0] === q[0] && z[1] === q[1]; }); })[0] || w0.at.slice(); } // (a floor below, walked into by the test door: a step in from its way up)
    if (fq) face = [+fq[1], +fq[2]];
    Object.keys(F.gates || {}).forEach(function (k) { marks.gates[k] = F.gates[k].slice(0, 2); });
    var rows = g.map(function (r) { return r.join(''); }), id = function (a, b) { return [a, b]; };
    var def = D.MAPS[key] = {
      name: F.place, sub: F.sub, key: key, door: F.door || null, mine: true, town: true, wet: false, dark: !!m8.dark, ground: 'earth', step: 10, // (dark: the dens and the workings, the party's own light -- js/light.js; the Glowseep by night)
      clock: !!F.clock, hour: hour, ownLights: m8.lights || null, // (the Glowseep: THE WORLD's clock moves as the party walks and fights there -- M.SEEP; its poles and moss lit by night)
      view: 'top', ft: 30, roofs: T.roofsAt(30), slope: slope.map(function (r) { return r.join(''); }), look: lk.map(function (r) { return r.join(''); }), signs: {}, faceDoors: {},
      rows: rows, w: w, h: h, entry: [at], face: face, gate: gq || null, stairUp: [], doors: ways, marks: marks, people: people, foes: [], warps: warps, out: F.out || null, save: !!F.save,
      deepWater: 'D', music: m8.music || 'field', wayName: wayName, wayMarks: wayMarks,
      names8: { rows: r8.slice(), legend: leg }, // (the first game's name of each square -- bones, webbing, a fence or a lamp, a tent or a stump: the art's piece for it, js/topview.js TV.ART)
      src8: { id: F.src, rows: [], legend: {}, triggers: trig, warps: [], chests: (m8.chests || []).slice(), zones: (m8.zones || []).slice(), save: !!F.save }, from8: id, to8: id, sig: '', // (zones: the first game's random fights where it has them -- the dens, the workings: each on a field of its own, M.fieldFight, its tables content/encounters.json)
      zone8: (m8.zones && m8.zones[0] && m8.zones[0].zone) || null,
      hud: F.place.replace(/^The /, 'the ') + ': ' + F.sub,
      hello: ['{y}' + F.place.toUpperCase() + '{/} -- ' + F.sub + ': ' + (F.own ? 'the second game\'s own floor' : 'the first game\'s floor') + ', north up as Silverton is (' + w + ' x ' + h + ' squares)' + (F.clock ? ', ' + W8tod(hour) : '') + '.',
        'Ways: ' + wayMarks.map(function (k) { return (k.side || 'at ' + k.at.join(',')) + ', ' + k.name; }).filter(function (s, i, a) { return a.indexOf(s) === i; }).join('; ') + '.', '{g}Click to walk, or the arrows. E: a word, a door. O: the formation. L: the floor map.{/}'], // (the ways each once: the Glowseep's road and grass edges are runs of their own)
      where: function () { return F.sub; }
    };
    return def;
  };

  // ---------------------------------------------------------------- the ways: down and up between a place's floors, the dark floors waiting, out to THE WORLD or Silverton
  M.held = function (to) { var n8 = ((DS.DATA.maps[to] || {}).name || to); return ['{y}' + n8 + '{/}.', '{g}The dark floors below come onto the grid with its roam. The party keeps to the floors it has for now.{/}']; };
  // what is always lit on the party (the first game's EV.alight('always'): the Sunshaft Staff, a Continual Flame -- worn, wielded, or in the pack)
  M.alight = function (st) {
    var out = [], lit = function (id) { var it = id && DS.DATA.items[id]; return !!(it && it.light && it.light.when === 'always'); };
    st.party.forEach(function (hh) { Object.keys(hh.equip || {}).forEach(function (s) { if (s !== 'torch' && lit(hh.equip[s])) out.push({ id: hh.equip[s], h: hh, slot: s }); }); });
    st.inv.forEach(function (s) { if (s.n > 0 && lit(s.id)) out.push({ id: s.id, h: null }); });
    st.party.forEach(function (hh) { var cf = hh.conds && hh.conds.continualFlame; if (!cf || typeof cf !== 'string' || !DS.DATA.items[cf]) return; var sl = Object.keys(hh.equip || {}).filter(function (s) { return hh.equip[s] === cf; })[0]; if (sl) out.push({ id: cf, h: hh, slot: sl }); else if (D.counter.count(st, cf)) out.push({ id: cf, h: null }); });
    return out;
  };
  M.warp = function* (B, wp) {
    var key = M.KEY8[wp.to];
    if (!key) { B.card(D.roam.wrap(M.held(wp.to)), 320); D.sfx('popup'); yield 20; return; }
    if (key === 'galleries_g2' && D.roam.def.key === 'galleries') { // (Ottilie at the mouth: nothing always lit goes into the roost -- the first game's S.roostDoor)
      var st = D.counter.state(B), lit = M.alight(st);
      if (lit.length) { var ok = yield* M.talk(B, 'ottilie', function (sc) { return M.roostDoor(sc, B, lit); }); if (!ok) { M.stepBack(B); return; } }
    }
    yield* M.go(B, key, [wp.tx, wp.ty], M.FACE[wp.dir] || null);
  };
  // the token a step back off a way it did not take
  M.stepBack = function (B) { var R0 = B.roam, t = R0.token, f = R0.fw; if (D.grid.canStand(t, t.x - f[0], t.y - f[1])) { t.x -= f[0]; t.y -= f[1]; t.tween = null; R0.path = null; D.grid.setup(B.map, B.units); B.focus(t); } };
  // to another of these floors: the house's party handed into the save and walked on (js/house.js H.fromFloor, as a town's door is); the test door's four carry the floor's flags
  M.go = function* (B, key, at, face, lines) {
    var R = D.roam, H = D.house, q = '?roam=' + key + '&at=' + at[0] + ',' + at[1] + (face ? '&face=' + face[0] + ',' + face[1] : ''), F = M.FLOORS[key] || M.ROAMS[key];
    B.card(['{y}' + F.place + '{/} -- ' + F.sub + '.'], 60); D.sfx('stairs'); yield 20;
    var back = M.giveBack(B, key), nb;
    // (into the Wet: the first game's way it faces, by name -- the Wet's grid is turned, and js/roam.js R.setup reads the 8-bit's compass off it)
    var dir8 = M.ROAMS[key] && face ? Object.keys(M.FACE).filter(function (k) { return M.FACE[k][0] === face[0] && M.FACE[k][1] === face[1]; })[0] || null : null;
    if (R.house() && H && H.playing) {
      H.fromFloor(B); M.off(B);
      if (F.save) H.cur.at = { town: F.door, gate: null, sq: null, dir: null };
      nb = R.make(q, { save: H.living(H.cur), opts: dir8 ? { at8: at.slice(), dir: dir8 } : { at8: at.slice() }, house: true });
    } else nb = M.testMake(B, key, q);
    var say = (lines || []).concat(back), en = nb.enter;
    if (say.length) nb.enter = function () { en.apply(this, arguments); this.card(R.wrap(say), 300); }; // (said as the floor comes up -- it may bake first: core.js D.push)
    D.push(nb);
    return nb;
  };
  M.off = function (B) { while (D.scenes.length && D.top() !== B) D.pop(); if (D.top() === B) D.pop(); }; // (the floor and anything over it)
  // the test door's next floor (no house): a fresh four, the floor's flags carried over whole (js/roam.js R.flags0) and the floor laid again by them, its pack and purse with it
  M.testMake = function (B, key, q) {
    var R = D.roam, fl = JSON.parse(JSON.stringify(B.roam.flags || {})), inv = JSON.parse(JSON.stringify(B.inv || [])), sp = B.roam.silver || 0, watch = /[?&]watch\b/.test(R.q || '') ? '&watch' : '';
    M.off(B);
    var nb = R.make(q + watch), en = nb.enter; R.flags0 = fl;
    if (M.FLOORS[key]) R.def = M.floor(key, q + watch, fl);
    var a8 = M.ROAMS[key] ? /[?&]at=(\d+),(\d+)/.exec(q) : null;
    if (key === 'wet') R.def = R.wholeWet(fl); // (the Wet laid by the flags it is walked into with: the drained stair's tiles)
    nb.enter = function () {
      en.apply(this, arguments); this.inv = inv; this.roam.silver = sp;
      if (a8) { var t = this.roam.token, e8 = R.def.from8(+a8[1], +a8[2]); if (D.grid.canStand(t, e8[0], e8[1])) { t.x = e8[0]; t.y = e8[1]; D.grid.setup(this.map, this.units); this.focus(t); } } // (on the first game's square the stair sets them down on, as the house's floor is: R.setup's at8)
    };
    return nb;
  };
  // what Ottilie kept at the mouth, back in the pack as the party comes out of the roost (the first game's S['enter:galleries_g1'])
  M.giveBack = function (B, key) {
    var f = B.roam.flags, held = f.ottilieHolds; if (key !== 'galleries' || !held || !held.length) return [];
    var st = D.counter.state(B); held.forEach(function (id) { D.counter.give(st, id, 1); }); delete f.ottilieHolds; D.sfx('confirm');
    return [D.counter.L('g1.ottilieLightBack', { item: held.map(function (id) { return DS.DATA.items[id].name; }).join(', ') })];
  };
  // the Warrens' camp and Silverton, by the feed track (in the house: the floor's party into the save, the next floor from THE WORLD's scene as a door's is)
  M.cross = function* (B, toKey, gate, at, lines) {
    var R = D.roam, H = D.house, W = D.world, nb;
    B.card(R.wrap(lines), 90); D.sfx('popup'); yield 40;
    if (R.house() && H && H.playing) {
      H.fromFloor(B); while (D.scenes.length && D.top() !== W.scene) D.pop();
      H.toTown(toKey, gate, at || null, null); return;
    }
    nb = M.testMake(B, (W.DOORS[toKey] || {}).roam, '?roam=' + (W.DOORS[toKey] || {}).roam + '&gate=' + gate + (at ? '&at=' + at[0] + ',' + at[1] : '')); D.push(nb);
  };
  M.LINES = { // (the seat's, the realm's way there: invented.json toplevels-feed-track)
    toCamp: ['{y}The feed track{/}, out past the east gate and over the bridge: the Crawler Warrens\' mouth camp.'],
    toTown: ['{y}The feed track{/}, back over the bridge to Silverton\'s east side.']
  };

  // ---------------------------------------------------------------- the scenes: the first game's (js/events.js) on the counter screen, its words (content/text.json)
  var L = function (k, o) { return D.counter.L(k, o); };
  M.talk = function* (B, id, script, name) {
    var C = D.counter, N = (DS.DATA.npcs || {})[id] || {}, done = null;
    var sc = new C.Counter(B, { id: id, name: name || N.name || id, place: D.roam.def.name, what: D.roam.def.sub, script: function (s) { return (function* () { done = yield* (script || M.SCENES[id])(s, B); })(); } });
    D.push(sc); while (!sc.done) yield 1;
    if (sc.regear && D.roam.regear) D.roam.regear(B);
    return done;
  };
  // a talk entry of theirs (the first game's EV.dialog: the first whose condition holds, with its doing), as lines
  M.words = function (B, id) { return D.counter.words(B, id); };
  var kills = function (B, k) { return ((B.roam && B.roam.kills) || {})[k] || 0; };
  M.SCENES = {
    // Skarn, the Warrener (js/events.js S.skarn): the first word and how the party comes -- as free hands or as someone's; paid out after Pete's five
    skarn: function* (sc, B) {
      var st = sc.st, f = st.flags;
      if (f.fiveDone && !f.skarnPaid) { f.skarnPaid = 1; yield sc.say(L(f.stockDead ? 'w.skarnAfterDead' : 'w.skarnAfter')); if (!f.stockDead) { st.silver(60); D.sfx('coin'); yield sc.say(L('g.foundSilver', { n: 60 })); } return; }
      if (!f.skarnOk) {
        yield sc.say(L('w.skarnFirst'));
        var a = yield sc.ask(L('w.skarnHow'), [L('w.skarnAsMan'), L('w.skarnAsSlave')]);
        if (a === 1) { yield sc.say(L('w.skarnChampion')); return; }
        f.skarnOk = 1; f.heardPete = 1; yield sc.say(L('w.skarnQuestion')); return;
      }
      yield sc.say(L('w.skarnAgain'));
    },
    // Edric Pellam at the tally-house (S.edric): the book that counts the party in -- and Pete's five, brought home
    edric: function* (sc, B) {
      var st = sc.st, f = st.flags, C = D.counter; f.tallyMet = 1;
      if (C.count(st, 'fivetokens') > 0) {
        C.take(st, 'fivetokens', 1); f.fiveDone = 1;
        yield sc.say(L('w.edricFive')); st.silver(50); D.sfx('coin'); yield sc.say(L('g.foundSilver', { n: 50 }));
        yield sc.say(L('w.edricPage')); C.give(st, 'sheet_grease', 1); D.sfx('chest'); yield sc.say(L('g.got', { item: DS.DATA.items.sheet_grease.name }));
        yield sc.say(C.renown(st, 1, 'renown.five')); return;
      }
      yield sc.say(L(f.fiveKnown ? 'w.edricAgain' : 'w.edricFirst')); f.fiveKnown = 1; f.heardPete = 1;
    },
    // Old Hob by the kitchen (js/deep.js S.hobHeir): Asmund's heir asked after, his hint; else his own words
    hobCamp: function* (sc, B) { var f = sc.st.flags; if (f.heirAsked && !f.heirHint) { f.heirHint = 1; yield sc.say(L('deep.heirHob')); return; } yield sc.say(M.words(B, 'hobCamp')); },
    // the line at the bridge, after the stock (S.dunmoreLine)
    dunmoreLine: function* (sc) { yield sc.say(L('w.lineHolds')); },
    // Sabeth Pollard (S.sabeth): the cull, the one law, paid by the head -- the bats and darkmantles of the dens (the first game's kill tally by its floor)
    sabeth: function* (sc, B) {
      var st = sc.st, f = st.flags;
      if (f.roostBroken) { yield sc.say(L('g1.sabethFired')); return; }
      if (!f.cullHired) {
        yield sc.say(L('g1.sabethHire'));
        var a = yield sc.ask(L('g1.sabethAsk'), ['TAKE THE WORK', 'NOT NOW']);
        if (a === 0) { f.cullHired = 1; f.paidBats = kills(B, 'g3:giantbat'); f.paidMantles = kills(B, 'g3:darkmantle'); yield sc.say(L('g1.sabethLaw')); }
        return;
      }
      var bats = kills(B, 'g3:giantbat') - (f.paidBats || 0), mantles = kills(B, 'g3:darkmantle') - (f.paidMantles || 0);
      if (bats > 0 || mantles > 0) { var pay = bats * 3 + mantles * 10; f.paidBats = (f.paidBats || 0) + bats; f.paidMantles = (f.paidMantles || 0) + mantles; st.silver(pay); D.sfx('coin'); yield sc.say(L('g1.sabethPay', { b: bats, m: mantles, n: pay })); }
      else yield sc.say(L('g1.sabethNothing'));
    },
    // Ottilie Skerrow, the house's final word (S.ottilie)
    ottilie: function* (sc) { var f = sc.st.flags; yield sc.say(L(f.roostBroken ? 'g1.ottilieCold' : f.rescued ? 'g1.ottilieRespect' : 'g1.ottilie')); },
    // Old Wynn Pollard (S.wynn): sending Dace home is the escort's -- his own words till then
    wynn: function* (sc, B) { yield sc.say(M.words(B, 'wynn')); },
    // Corwen Dace (S.dace): always talking someone into the deep gallery. The escort walks below, with the dark galleries and the house's guests: till then he waits
    dace: function* (sc, B) {
      var st = sc.st, f = st.flags; f.daceLight = 1;
      if (f.daceDone) { yield sc.say(M.words(B, 'dace')); return; }
      var after = !!(f.cloakerKilled || f.cloakerDone || D.counter.count(st, 'cloakertail'));
      if (!after) yield sc.say(M.words(B, 'dace'));
      var a = yield sc.ask(L(after ? 'dace.askAfter' : 'dace.ask'), ['TAKE HIM', 'NOT TODAY']);
      if (a !== 0) { yield sc.say(L('dace.notToday')); return; }
      yield sc.say([].concat(L('dace.join'), [M.LINES.daceWaits]));
    }
  };
  M.LINES.daceWaits = '{g}(Dace walks with the party when the dark galleries below come onto the grid and the house takes guests. Till then he waits by the beam.){/}'; // (invented.json toplevels-dace-waits)
  // Ottilie at the mouth, a light that is always lit on the party (S.roostDoor): left with her, or the party turns back. True when it goes in
  M.roostDoor = function* (sc, B, all) {
    var st = sc.st, f = st.flags, x = all[0], it = DS.DATA.items[x.id];
    yield sc.say(L(x.h ? 'g1.ottilieLightWield' : 'g1.ottilieLightCarry', { item: it.name, name: x.h ? x.h.name : (st.party[0] || {}).name }));
    if ((yield sc.ask(L('g1.ottilieLightAsk'), ['LEAVE IT WITH HER', 'TURN BACK'])) !== 0) return false;
    var held = f.ottilieHolds = f.ottilieHolds || [];
    all.forEach(function (y) { if (y.h) { y.h.equip[y.slot] = null; sc.regear = true; } else D.counter.take(st, y.id, 1); held.push(y.id); });
    D.sfx('confirm'); yield sc.say(L('g1.ottilieLightKept'));
    return true;
  };
  // the floor's own squares (the first game's triggers): the pens' shifts, Skarn's gate, the dens' pits, their bad air, the rescue
  M.trigger = function* (B, trig, at) {
    if (trig.script === 'pen') { yield* M.talk(B, 'pen' + trig.arg, function (sc) { return M.pen(sc, B, trig.arg); }, 'The pens, mouth ' + trig.arg); return; }
    if (trig.script === 'skarnGate') { yield* M.skarnGate(B); return; }
    if (trig.script === 'pit') { B.card(D.roam.wrap(['{y}A pit{/}: it drops to the deep gallery, the hole floor.'].concat(M.held('galleries_g4').slice(1))), 320); D.sfx('popup'); M.stepBack(B); yield 20; return; } // (the first game's S.pit drops the party there, 1d6 each: the hole floor is not the top levels' -- his ruling)
    if (trig.script === 'badAir') { yield* M.badAir(B); return; }
    if (trig.script === 'rescue') { yield* M.rescue(B, trig, at); return; }
    if (trig.script === 'seepFire') { yield* M.seepFire(B); return; }
    B.card(D.roam.wrap(['{y}' + trig.id + '{/}: the first game\'s scene (' + trig.script + ') -- not on the grid yet.']), 240); D.sfx('popup'); yield 20;
  };
  // a shift at the pens (S.pen): Edric's book first; who milks; the draught if there is one; then the first game's own table rule for the shift, rolled straight -- its
  // cradle scene is the first game's picture (js/cradle.js): six draws, each a d20 and the milker's Animal Handling or Nature against 12, a 6 or less a CON save at 13 (the
  // draught: the better of two) or the shift ends touched
  M.pen = function* (sc, B, n) {
    var st = sc.st, f = st.flags, C = D.counter, Rr = DS.R;
    if (!f.tallyMet) { yield sc.say(L('w.penNoBook')); return; }
    if ((yield sc.ask(L('w.penAsk'), ['WORK A SHIFT', 'LEAVE'])) !== 0) return;
    var up = st.party.filter(function (hh) { return !hh.dead && !hh.ko && hh.hp > 0; }); if (!up.length) return;
    var hh = up.length === 1 ? up[0] : up[yield sc.ask('WHO MILKS?', up.map(function (z) { return z.name; }))]; if (!hh) return;
    var draught = C.count(st, 'draught') > 0; if (draught) C.take(st, 'draught', 1);
    var ah = Rr.skill(hh, 'Animal Handling', 'wis'), na = Rr.skill(hh, 'Nature', 'int'), best = Math.max(ah, na);
    if (!f.shifts) yield sc.say(L('w.penHow'));
    var got = 0, touched = false;
    for (var i = 0; i < 6 && !touched; i++) {
      var roll = M.d20() + best;
      if (roll >= 12) got++;
      else if (roll <= 6) { var sv = M.d20() + Rr.saveBonus(hh, 'con'); if (draught) sv = Math.max(sv, M.d20() + Rr.saveBonus(hh, 'con')); if (sv < 13) touched = true; }
    }
    var lines = []; if (touched) lines.push(L('w.touched', { name: hh.name }));
    if (got) { st.silver(got); D.sfx('coin'); }
    f.shifts = (f.shifts || 0) + 1; lines.push(L('w.shiftPaid', { n: got }));
    yield sc.say(lines);
    if (f.shifts === 1) { f.hobMet = 1; f['heard:r-promised'] = 1; yield sc.say(['{y}Old Hob{/}'].concat(L('w.hobAtCradle'))); }
  };
  M.d20 = function () { return D.d(20); }; // (the shift's die: the bench pins it)
  // Skarn's gate in the stalls (S.skarnGate): shut till Skarn has taken the party on; then it swings back and stays open -- the floor laid again with it open
  M.skarnGate = function* (B) {
    var R = D.roam, f = B.roam.flags;
    if (!f.skarnOk) { B.card(R.wrap(['{y}Skarn{/}'].concat(L('w.gateShut'))), 300); D.sfx('popup'); yield 20; return; }
    D.sfx('door'); f.skarnGateOpen = 1;
    M.relay(B);
    D.sfx('confirm'); B.card(R.wrap([].concat(L('w.gateOpens'))), 260); yield 20;
  };
  // the floor laid again from its flags where the party stands (a flag tile changed): its map swapped as a room's is (js/town.js T.goOut), its people and chests kept
  // (restand: the people stood again where the floor now has them -- the Glowseep's crew, day or night -- with its lights; and the dark as the floor now is)
  M.relay = function (B, hour, restand) {
    var R = D.roam, old = R.def, def = M.floor(old.key, R.q, B.roam.flags, hour != null ? hour : old.hour);
    def.entry = old.entry; def.face = old.face; R.def = def;
    B.map = D.iso.load(def); D.grid.setup(B.map, B.units); R.layChests(B); B.cache = null;
    B.dark = def.dark; if (B.fight) B.fight.dark = def.dark;
    if (restand) { B.units = B.units.filter(function (u) { return !u.npc; }); T.people(B); }
  };

  // the dens' low gallery (S.badAir): each standing hero a CON save at 12 or 1d4, never below 1; not again for three steps
  M.badAir = function* (B) {
    var R0 = B.roam, Rr = DS.R; if (R0.airAt != null && R0.steps - R0.airAt < 3) return; R0.airAt = R0.steps;
    var hurt = []; R0.members.forEach(function (u) { if (u.hp > 0 && u.src && D.d(20) + Rr.saveBonus(u.src, 'con') < 12) { u.hp = Math.max(1, u.hp - D.roll('1d4').total); hurt.push(u.name); } });
    if (hurt.length) { D.sfx('poison'); B.card(D.roam.wrap([L('g3.badAir', { names: hurt.join(', ') })]), 260); yield 20; }
  };
  // the rescue (S.rescue, Sabeth's cull taken): a drive gone wrong down the side gallery -- four giant bats, a set fight on its own field as the floor's random ones are
  // (M.fieldFight); won, the driver up, the cull done, and the mine's hands saw it
  M.rescue = function* (B, trig, at) {
    var R = D.roam, f = B.roam.flags;
    B.card(R.wrap([].concat(L('g3.rescue1'))), 320); yield 60;
    yield* R.encounter(B, 'set', { list: ['giantbat', 'giantbat', 'giantbat', 'giantbat'], at: at, flag: 'rescued', line: [].concat(L('g3.rescueIntro'))[0], how: 'under the roost' });
    if (!f.rescued) return;
    f.cullDone = 1;
    B.card(R.wrap([].concat(L('g3.rescue2'), D.counter.renown(D.counter.state(B), 1, 'renown.rescue'))), 360); yield 30;
  };

  // ---------------------------------------------------------------- THE FLOORS' FIGHTS ON A FIELD OF THEIR OWN (10-22, his eye on the floors: the Glowseep by night, "combat turns
  // the whole zone into a fight and the stirges kill npc"; the dens, "not a grid fight"). A random fight here goes as THE WORLD's road fights go (js/world.js
  // World.prototype.encounter and .fight): its card, FIGHT the way OPTIONS' RANDOM FIGHTS says (simple by default, js/simple.js) or the other way for this one, on a field cut
  // to the floor's ground -- the party as it walks (js/roam.js R.pullIn0's field: hit points, slots, lights, pack in and back), the floor's people not in it and unhurt -- and
  // back on the floor on the square it stood, the tally by the floor's zone (Sabeth's cull), THE WORLD's hour on the Glowseep, the floor's tune again
  M.FIELD = { // a floor's ground: [the edge's chances, the inside's] as [char, under this roll] in turn, else '.' (js/world.js FIELD's way)
    cave: [[['#', 0.7], ['r', 0.9]], [['#', 0.05], ['r', 0.18]]],
    bog: [[['~', 0.4], ['g', 0.62]], [['~', 0.25], ['g', 0.45]]]
  };
  M.groundOf = function (def) { return def.key === 'glowseep' ? 'bog' : 'cave'; };
  M.fieldDef = function (def, list, simple, set) {
    var o = simple ? D.simple.fieldOpts() : null, kind = M.groundOf(def), P = M.FIELD[kind], w = (o && o.w) || 16, h = (o && o.h) || 7, rows = [];
    var inLane = (o && o.lane) || function (x, y) { return x >= 3 && x <= 10 && y >= 1 && y <= 5; };
    for (var y = 0; y < h; y++) {
      var row = '';
      for (var x = 0; x < w; x++) {
        var r0 = D.rand(), ch = '.', edge = y === 0 || y === h - 1 || x === 0 || x === w - 1; // (a cave's field walled all round: no road runs through it)
        if (edge || !inLane(x, y)) { var E = P[edge ? 0 : 1]; for (var i = 0; i < E.length; i++) if (r0 < E[i][1]) { ch = E[i][0]; break; } }
        else if (kind === 'bog' && r0 < 0.12) ch = '~';
        row += ch;
      }
      rows.push(row);
    }
    D.MAPS['mine-field'] = { name: def.name, sub: def.sub, step: 10, ground: 'earth', rows: rows, sky: kind === 'cave' ? 20 : null, // (a cave's ceiling 20 ft up, the Wet's: a darkmantle hangs from it)
      entry: (o && o.entry) || [[8, 3], [8, 2], [8, 4], [9, 3], [9, 1], [9, 5], [8, 1], [8, 5]], foes: [], wave: null };
    var moss = kind === 'bog' && def.dark ? [[1, 1, 10, 'glow', 1], [w - 2, h - 2, 10, 'glow', 1], [w - 2, 1, 10, 'glow', 1], [1, h - 2, 10, 'glow', 1]] : null; // (the Glowseep by night: its moss, dim)
    return { id: 'minefield', map: 'mine-field', level: (D.roam.party0 && D.roam.party0.level) || 5, name: def.name, sub: def.sub, dark: !!def.dark, lights: moss,
      intro: (set && set.line) || 'They come at the party out of the dark.', won: 'THE WAY IS CLEAR.', lost: 'THE DARK TAKES THEM.', noCards: true, // (no entry card: the encounter's card asked, and the four are the floor's -- its "walk in as the fixture" is not theirs, seen in the pane 10-22)
      foes: simple ? D.simple.seat(list) : D.world.seat(list), wave: null, fliers: !simple }; // (fliers: the SRD's fly on the grid, not in the simple fight's lineup -- js/world.js's)
  };
  M.fieldBack = function (done) { return done === 'won' ? ['{y}The way is clear.{/}', '{g}Back where the party stood.{/}'] : done === 'escaped' ? ['{y}Away{/}: the party gets clear of them.', '{g}Back where it stood.{/}'] : ['{y}Back on the floor{/} (' + done + ').']; };
  M.fieldFight = function* (B, why, set) {
    var R = D.roam, R0 = B.roam, t = R0.token, zone = set ? null : R.zoneAt(B, t.x, t.y) || R.def.zone8;
    var p = set ? { list: set.list, grp: {} } : R.pick(zone, R0.flags);
    if (!p || !p.list.length) return;
    if (p.grp.flee && D.rand() < p.grp.flee) { B.card(['{g}Something scuttles off into the dark.{/}'], 200); yield 30; return; }
    var list = p.list.filter(function (k) { return D.FOES && D.FOES[k]; }).slice(0, 8); if (!list.length) return;
    R0.fights++; // (THE WORLD's hour on the Glowseep counts it: M.tick)
    var cnt = {}; list.forEach(function (k) { cnt[k] = (cnt[k] || 0) + 1; });
    var who = Object.keys(cnt).map(function (k) { var nm = (D.FOES[k].name || k).toLowerCase(); return cnt[k] > 1 ? cnt[k] + ' ' + nm.replace(/y$/, 'ie').replace(/(s|x|ch|sh)$/, '$1e') + 's' : 'a ' + nm; }).join(', ');
    R0.last = { why: why, who: who, kinds: list.slice(), at: [t.x, t.y], field: true }; R0.log.push(R0.last);
    var simple = !D.simple || D.simple.on();
    D.sfx('encounter'); t.anim = 'idle'; t.animT = B.t;
    var a = yield { prompt: { who: t, title: 'ENCOUNTER', lines: R.wrap([(set && set.line) || ('{r}' + who.charAt(0).toUpperCase() + who.slice(1) + '{/}, out of the dark.')]),
      opts: [{ label: 'FIGHT', value: 0 }].concat(D.simple ? [{ label: simple ? 'ON THE GRID' : 'SIMPLE', value: 1 }] : []) } };
    if (a === 1) simple = !simple; // (the other way, for this fight alone -- the road's card, RULED 10-21, Griz: "yes")
    var F = M.fieldDef(R.def, list, simple, set);
    R.party0.backTo = R.def.sub; // (the fight's last card: E back to the dens -- js/battle.js o.backTo)
    var watch = /[?&]watch\b/.test(R.q || ''); // (the test door's &watch: the four run by the class AI in there too, as on the floor)
    var enter = function (b) { if (watch) b.units.forEach(function (u) { if (u.side === 'party') { u.guest = true; u.classAI = true; } }); };
    yield* R.pullIn(B, 'field', { id: 'field', field: { F: F, simple: simple, zone: zone, flag: set && set.flag, trig: set && set.trig, back: M.fieldBack, enter: enter } }, [t.x, t.y]);
    delete R.party0.backTo;
  };
  var enc0 = D.roam.encounter;
  D.roam.encounter = function* (B, why, set) { if (D.roam.def && D.roam.def.mine) { yield* M.fieldFight(B, why, set); return; } yield* enc0.apply(this, arguments); };

  // ---------------------------------------------------------------- THE BUNKHOUSES (RULED 10-21 night, Griz to the desk: "the bunkhouses wouldn't need watching (watched by
  // staff) - free/cheap inn function"): a bed for the night and no watches -- the Warrens' bunkhouse at the mouth camp, the resident core's (free to the party once it has
  // worked a shift at the cradles: crew; a silver otherwise), and the Pellam barns at the south landing, which bunk the day-crews for rent paid in thimbles (a thimble a silver,
  // Skarn's board). The night is the house's long rest (js/house.js H.longRest: the clock to the morning, every sheet whole, the levels banked and their picks -- on the floor),
  // the floor's figures given their rested sheets where they stand (js/roam.js R.resheet)
  M.INNS = {
    'keeper:bunkhouse': { id: 'bunkhouse', price: function (f) { return f.shifts ? 0 : 1; }, why: function (f) { return f.shifts ? 'crew sleep free' : 'a silver for a stranger'; } },
    'keeper:pellambarn': { id: 'pellambarn', price: function () { return 1; }, why: function () { return 'rent paid in thimbles: a silver'; } }
  };
  M.LINES.bunk = { ask: 'A bunk for the night? ', sleep: 'The bunks fill with the shift coming off; somebody snores through the lot. Nobody stands a watch -- the staff keep the door.', morning: 'Morning, and the camp\'s bell.', poor: 'Not without the silver.' }; // (invented.json toplevels-bunkhouses)
  M.inn = function* (sc, B, inn) {
    var st = sc.st, f = st.flags, p = inn.price(f);
    yield sc.say(M.words(B, inn.id));
    var a = yield sc.ask(M.LINES.bunk.ask + '(' + (p ? p + ' sp, ' : 'free, ') + inn.why(f) + ')', [p ? 'A BUNK, ' + p + ' SP' : 'A BUNK', 'LEAVE']);
    if (a !== 0) return false;
    if (p && st.silver() < p) { D.sfx('error'); yield sc.say(M.LINES.bunk.poor); return false; }
    if (p) { st.silver(-p); D.sfx('coin'); }
    yield sc.say(M.LINES.bunk.sleep);
    return true;
  };
  // the night slept, on the house's one sleep for a floor (js/house.js H.sleepOnFloor -- 10-22, Griz: "3 move to whole mornings"): in the house the floor's party into the
  // save, THE WORLD's clock to the morning and the long rest on the save; on the test door the four rested in place; then the first game's whole morning -- the picks, the
  // night's bonds, the day's spells, the save where the floor keeps one -- with this place's own morning on its card
  M.sleep = function* (B) { yield* D.house.sleepOnFloor(B, { line: M.LINES.bunk.morning, music: 'inn' }); };

  // ---------------------------------------------------------------- THE GLOWSEEP (10-21 night, Griz to the desk, on the top levels seat's five leans: "Go on the Glowseep - run with
  // its leans for all, including the time-slowing but that might be adjusted. Thematically correct"; his first word on it, "he hung out with them where they worked and they walked
  // together after, possible watch-less camp location with roam (with associated timeslow) that allows player grinding"). The light-crews' ground by the mile (TarlynsPit/wiki/
  // glowseep.md): the bog's margin, its moss beds and the drain south to Halfway Lake, the three veterans' camp by the road. A camp with no watch (the crews' fire, free); the
  // Glowseep's own fights (content/encounters.json glowseep) at the floor's rate, never run out, more by night and the wisp only by night; THE WORLD's clock moving as the party
  // walks and fights there. Its tuning, one place:
  M.SEEP = {
    squaresPerHour: 150, // (walked on the floor: an hour of THE WORLD's clock)
    fightHours: 1,       // (each fight: an hour)
    nightRate: 0.5,      // (by night the fights come twice as often: the table's rate halved)
    nightWeigh: 2,       // (by night the stirges and the wisp weigh twice)
    dayHour: 12          // (the test door's hour, with no THE WORLD under it; &hour= sets it)
  };
  // the seat's draft of the ground (his paint later): 40 x 28, north up, the mile down the east side (in and out by it north, south and east), the camp by it
  M.SEEP_ROWS = [
    '~~~rrrww~~~~::::""""*""""":::::""",,""""', '~~~::::ww~~~::::"""""""""":::::""",,""""', '~~~:*::ww~~:::::::*"""""""***""""",,""""', '~~~:::::ww~:r"""rrr::r:::::"*""""",,""""',
    '~~~::rrrww~r*"""r:~::::rrr""*""""",,""""', '~~~r::rrww:r:"""r:~~:::rrr""*""""",,""""', '~~~r::**wwrr:"I":::rr::rr"""*""""",,""""', '~rrrr:**wwrr*::::::::""""""""""""",,""""',
    '::**rr**wwrrr**:rr""""""""","""",",,""""', 'rrr:rr*:wwr:rrrrr"""""I""",k"""k"",,""""', 'rrr:::::wwr:rrrrr"*""""""""""",""",,""""', 'rr::::::ww:rrr::rrrr""*""""""o,,,I,,""""',
    '::::::*r~~::r::::::rr**"""I",",,,,,,""""', '::*::::r~~:::::::rrr::rr""",""""k",,""""', 'r**::::r:ww::::::rrr::r:"","""t,"",,""""', 'rrrr::::rww::::::rr:r:::""""I",""",,""""',
    'rrrr::*:rww::rr****:r:"""***"""""",,""""', '::r:rr::rww:""""":*I""""""*""""""",,""""', '**r:rr::rrww""""""*"""""""*""""""",,""""', '~rr:rr::*rww""""":::"""""""""""""",,""""',
    '~~rrrr::*r*wwrrrrrrrrrrr"""""""""",,""""', '~~r:::::"""ww:::::::::::rrr"*""""",,""""', '~~~:rr::"""Iwwr:::*:::rr::**r**""",,""""', '~~~:rr::"""rwwr:::*::::::::*r**""",,""""',
    '~~~~rrr:r"*r*ww:::*:rr::rrrr*""""",,""""', '~~~~~rrr:rr::ww::rr:::rrrrrr:""""",,""""', '~~~~~~~r::*::ww:***"""*""""""""""",,""""', '~~~~~~~~r:::::ww:"""""*""""""""""",,""""'
  ];
  M.SEEP_LEGEND = { '~': 'pool', 'w': 'deep', ':': 'mud', 'r': 'reeds', '*': 'glowmoss', '"': 'grass', ',': 'road', 'k': 'tent', 'I': 'lamp', 't': 'stump', 'o': 'firepit' };
  M.SEEP_FIRE = [29, 11]; M.SEEP_BOG = [0, 0, 26, 28]; // (the crews' fire pit; the bog the fights come in -- not the camp, not the road)
  // the three veterans (their names OPEN by his ruling, 09-09): at the camp by day, asleep or near it; out at the moss beds with their poles by night (invented.json toplevels-seep-crew)
  M.CREW = [{ id: 'seepcrew1', name: 'The eldest of the three', day: [28, 12], night: [15, 7] }, { id: 'seepcrew2', name: 'A pole-hand', day: [31, 12], night: [21, 10] }, { id: 'seepcrew3', name: 'The quiet one', day: [30, 13], night: [18, 17] }];
  M.NAMES = {}; M.CREW.forEach(function (c) { M.NAMES[c.id] = c.name; });
  var W8tod = function (h) { return D.world && D.world.todAt ? D.world.todAt(h) : (h < 5 || h >= 20 ? 'night' : 'day'); };
  M.night = function (h) { return W8tod(h) === 'night'; };
  // the hour now: THE WORLD's clock under the house (or a door from THE WORLD), else the test door's own (&hour=, kept on the floor as it passes)
  M.hourNow = function (q, B) { var W = D.world, S = W && W.state && W.state(); if (S && S.t != null && D.house && D.house.playing) return W.hour(); var R0 = B && B.roam, m = /[?&]hour=(\d+)/.exec(q || ''); return R0 && R0.hour != null ? R0.hour : m ? (+m[1]) % 24 : M.SEEP.dayHour; };
  // the first game's shape of a map (M.floor reads it as it reads theirs) for the hour: the crew where the hour puts them, the bog's fights by day or by night, by night the dark and its lights
  M.seepMap = function (hour) {
    var nt = M.night(hour), lights = [{ id: 'seepfire', kind: 'map', x: M.SEEP_FIRE[0], y: M.SEEP_FIRE[1], bright: 10, dim: 10, color: 'fire', flame: true, seep: true }];
    if (nt) M.SEEP_ROWS.forEach(function (r, y) { for (var x = 0; x < r.length; x++) { var c = r.charAt(x); if (c === 'I') lights.push({ id: 'seeppole' + x + '_' + y, kind: 'map', x: x, y: y, bright: 5, dim: 10, color: 'fire', flame: true, seep: true }); else if (c === '*' && (x + y) % 3 === 0) lights.push({ id: 'seepmoss' + x + '_' + y, kind: 'map', x: x, y: y, bright: 0, dim: 5, color: 'glow', flame: false, seep: true }); } });
    return { id: 'glowseep', name: 'The Glowseep', rows: M.SEEP_ROWS, legend: M.SEEP_LEGEND, music: 'field', exits: { north: 1, east: 1, south: 1 }, dark: nt, lights: lights,
      npcs: M.CREW.map(function (c) { var p = nt ? c.night : c.day; return { id: c.id, x: p[0], y: p[1], look: 'oldhand', dir: 'down' }; }),
      triggers: [{ id: 'seepfire', rect: [M.SEEP_FIRE[0], M.SEEP_FIRE[1], 1, 1], on: 'use', script: 'seepFire' }],
      zones: [{ zone: nt ? 'glowseep_night' : 'glowseep_day', rect: M.SEEP_BOG.slice() }], chests: [] };
  };
  // the Glowseep's fights by the hour: its table by day without the wisp; by night all of it, the stirges and the wisp weighed up, coming faster (M.SEEP)
  (function () {
    var E = (DS.DATA && DS.DATA.encounters) || {}, Z = E.glowseep; if (!Z) return;
    var wisp = function (g) { return g.e.some(function (x) { return x[0] === 'wisp'; }); }, up = function (g) { return g.e.some(function (x) { return x[0] === 'wisp' || x[0] === 'stirge'; }); };
    E.glowseep_day = Object.assign({}, Z, { groups: Z.groups.filter(function (g) { return !wisp(g); }) });
    E.glowseep_night = Object.assign({}, Z, { rate: Z.rate.map(function (r) { return Math.max(4, Math.round(r * M.SEEP.nightRate)); }), groups: Z.groups.map(function (g) { return up(g) ? Object.assign({}, g, { w: (g.w || 1) * M.SEEP.nightWeigh }) : g; }) });
  })();
  M.LINES.seep = {
    night: 'Night comes down on the Glowseep: the moss lights, and the crews go out with their poles.', day: 'Day on the Glowseep: the moss goes dull, and the crews come in to sleep.',
    fire: 'The crews\' fire. The veterans keep it; nobody stands a watch here.', sleep: 'You sleep by the crews\' fire. Somebody comes in off the bog before dawn, and nobody wakes you.', morning: 'Morning over the seep. The moss has gone back to green.'
  }; // (invented.json toplevels-seep-crew)
  M.CREW_LINES = { // (the seat's drafts: invented.json toplevels-seep-crew -- the laugh is the realm's, Aurdin I: "And don't go into debt," all three laughing)
    seepcrew1: { day: ['"Day\'s for sleeping. The moss doesn\'t show till dark, and the bog\'s worse by day than it looks."'], night: ['"Pole up, not out. You hold it over the moss and it tells you where it\'s thick."'],
      aurdin: ['"The evoker! You walked up the mile with us, the morning after the dark. Still got all your fingers?"'] },
    seepcrew2: { day: ['"Rillo buys at his shed in town, by the clean warehouse. Tell him the seep sent you and he\'ll weigh you honest."'], night: ['"That light out past the far pool? Not one of ours. Don\'t go after it."', 'He doesn\'t look at it again.'] },
    seepcrew3: { day: ['"Nobody owns a crop till it\'s picked. That\'s the whole of it."', '"And don\'t go into debt." The other two laugh; nobody says why.'], night: ['The quiet one keeps working, and only nods.'] }
  };
  M.CREW.forEach(function (c) {
    M.SCENES[c.id] = function* (sc, B) {
      var Ls = M.CREW_LINES[c.id], nt = M.night(D.roam.def.hour), au = sc.st.party.some(function (hh) { return (hh.key || hh.id) === 'aurdin' && !hh.dead; });
      yield sc.say((au && Ls.aurdin && !nt ? Ls.aurdin : []).concat(nt ? Ls.night : Ls.day));
    };
  });
  // the crews' fire (his "watch-less camp location"): a long rest with no watch, free -- the house's night (M.sleep), and the light the morning brings
  M.seepFire = function* (B) {
    var go = yield* M.talk(B, 'seepcrew1', function (sc) { return (function* () { yield sc.say(M.LINES.seep.fire); return (yield sc.ask('Sleep at the fire?', ['SLEEP HERE', 'LEAVE'])) === 0; })(); }, 'The crews\' fire');
    if (!go) return;
    B.card(D.roam.wrap([M.LINES.seep.sleep]), 200); yield 30;
    var R0 = B.roam; if (!(D.roam.house() && D.house && D.house.playing)) R0.hour = 7; // (the test door's morning; the house's is THE WORLD's camp, M.sleep)
    M.LINES.bunk.morningWas = M.LINES.bunk.morning; M.LINES.bunk.morning = M.LINES.seep.morning;
    try { yield* M.sleep(B); } finally { M.LINES.bunk.morning = M.LINES.bunk.morningWas; }
    yield* M.light(B);
  };
  // THE WORLD's clock on the floor: an hour each M.SEEP.squaresPerHour squares walked and each fight; the floor laid again when day turns to night or back
  M.tick = function* (B) {
    var R0 = B.roam, C = M.SEEP, hrs = 0;
    R0.clockSq = (R0.clockSq || 0) + 1; if (R0.clockSq >= C.squaresPerHour) { R0.clockSq = 0; hrs++; }
    if ((R0.fights || 0) > (R0.clockFights || 0)) { hrs += ((R0.fights || 0) - (R0.clockFights || 0)) * C.fightHours; R0.clockFights = R0.fights; }
    if (hrs) yield* M.pass(B, hrs);
  };
  M.pass = function* (B, hrs) {
    var W = D.world, S = W && W.state && W.state(), R0 = B.roam;
    if (D.roam.house() && S && S.t != null) { S.t += hrs; W.save(); } else R0.hour = ((R0.hour != null ? R0.hour : D.roam.def.hour) + hrs) % 24;
    yield* M.light(B);
  };
  // day or night as the hour now has it: if it changed, the floor laid again (its dark, its lights, its fights, the crew where the hour puts them) and said
  M.light = function* (B) {
    var def = D.roam.def, h = M.hourNow(D.roam.q, B); if (!def.clock || M.night(h) === M.night(def.hour)) { def.hour = h; return; }
    M.relay(B, h, true);
    D.sfx('popup'); B.card(D.roam.wrap([M.night(h) ? M.LINES.seep.night : M.LINES.seep.day]), 300); yield 20;
  };
  var arrive0 = D.roam.arrive;
  D.roam.arrive = function* (B) { var ev = yield* arrive0(B); if (!ev && D.roam.def && D.roam.def.clock && B.roam && D.battle === B) yield* M.tick(B); return ev; };
  // the floor's people named where the first game's npcs have no line of theirs (the Glowseep's crew), and a floor's own lights laid (its poles, its moss, the fire)
  var people0 = T.people;
  T.people = function (B) {
    people0.apply(this, arguments);
    var def = D.roam && D.roam.def; if (!def || !def.mine) return;
    B.units.forEach(function (u) { if (u.npc && M.NAMES[u.npc]) u.name = M.NAMES[u.npc]; });
    B.lights = (B.lights || []).filter(function (l) { return !l.seep; }).concat(def.ownLights || []); // (ownLights: not a map def's `lights`, which battle.js reads as [x, y, r, colour])
  };

  // ---------------------------------------------------------------- the town's hooks (js/town.js): a word and a square on these floors, and their ways off
  var fire0 = T.fire;
  T.fire = function* (B, trig, at) {
    var def = D.roam.def;
    if (def && def.mine && trig.town === 'mine') { yield* M.trigger(B, trig, at); return; }
    if (def && def.mine && trig.town === 'door' && M.INNS[trig.id]) { var inn = M.INNS[trig.id]; if (yield* M.talk(B, inn.id, function (sc) { return M.inn(sc, B, inn); })) yield* M.sleep(B); return; }
    if (def && def.mine && trig.town === 'talk' && M.SCENES[trig.npc]) { yield* M.talk(B, trig.npc); return; }
    yield* fire0(B, trig, at);
  };
  var way0 = T.wayOut; // (js/world.js's: a town's road off its floor onto THE WORLD)
  T.wayOut = function* (B, sq) {
    var def = D.roam.def || {}, k = sq[0] + ',' + sq[1];
    if (def.mine) {
      var wp = (def.warps || []).filter(function (z) { return z.at[0] === sq[0] && z.at[1] === sq[1]; })[0];
      if (wp) { yield* M.warp(B, wp); return; }
      if (def.out === 'silverton') { yield* M.cross(B, 'silverton', 'east', [M.FEED[0] - 1, M.FEED[1]], M.LINES.toTown); return; }
    } else if (def.key === 'silverton' && !def.room && /feed track/.test((def.wayName || {})[k] || '')) { yield* M.cross(B, 'warrens', 'feed', null, M.LINES.toCamp); return; }
    yield* way0(B, sq);
  };
  // the ways marked on the floor (M.floor's wayMarks): within M.WAYNEAR squares of the token, a pale pin on the way's middle square and its name over it
  M.WAYNEAR = 20;
  M.paintWays = function (ctx, B) {
    var def = D.roam.def, R0 = B.roam, t = R0 && R0.token; if (!def || !def.mine || !t || R0.mode !== 'walk' || B.menu) return;
    var iso = D.iso, shown = [];
    (def.wayMarks || []).forEach(function (k) {
      if (Math.max(Math.abs(k.at[0] - t.x), Math.abs(k.at[1] - t.y)) > M.WAYNEAR) return;
      var c = iso.center(k.at[0], k.at[1], (B.map && B.map.gz ? B.map.gz(k.at[0], k.at[1]) : 0) + 20), s = iso.toScreen(c.x, c.y), x = Math.round(s.x), y = Math.round(s.y + Math.sin(B.t / 12) * 1.5);
      if (x < -40 || x > D.W + 40 || y < -20 || y > D.H + 20) return;
      var label = k.name.toUpperCase(), w = D.textWidth(label) + 8;
      ctx.save();
      ctx.fillStyle = '#0c1a10'; ctx.beginPath(); ctx.moveTo(x - 6, y - 7); ctx.lineTo(x + 6, y - 7); ctx.lineTo(x, y + 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8ee89a'; ctx.beginPath(); ctx.moveTo(x - 4, y - 6); ctx.lineTo(x + 4, y - 6); ctx.lineTo(x, y + 1); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.8; ctx.fillStyle = '#05080a'; ctx.fillRect(x - w / 2, y - 19, w, 10); ctx.globalAlpha = 1;
      D.text(ctx, label, x, y - 18, '#8ee89a', 'center');
      ctx.restore(); shown.push(k.name);
    });
    M.waysShown = shown; // (the bench reads what was drawn)
  };
  var over0 = D.roam.paintOver;
  D.roam.paintOver = function (ctx, B) { over0.apply(this, arguments); if (!D.roam.showMap) M.paintWays(ctx, B); };
  // and on the floor map (L): the ways green, as the Wet's map greens its ways out
  var map0 = D.roam.paintMap;
  D.roam.paintMap = function (ctx, B, x0, y0, s) { map0.apply(this, arguments); var def = D.roam.def; if (!def || !def.mine) return; ctx.save(); ctx.fillStyle = '#60e070'; (def.doors || []).forEach(function (q) { ctx.fillRect(x0 + q[0] * s, y0 + q[1] * s, s, s); }); ctx.restore(); };
  // the tally-house's counter: Edric's shop, the antitoxin draught (content/shops.json `tally`: it buys nothing) -- one line in the counter's vendor table
  if (D.counter && D.counter.VENDORS) D.counter.VENDORS.tally = D.counter.VENDORS.tally || { shop: 'tally', name: 'Edric Pellam' };
})();
