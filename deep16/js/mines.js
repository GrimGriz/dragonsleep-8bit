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
    glowseep: { src: 'glowseep', own: true, door: 'glowseep', place: 'The Glowseep', sub: 'the light-crews\' ground by the mile', save: true, out: 'world', clock: true, edges: true,
      gates: { east: [38, 14, [-1, 0]], north: [35, 1, [0, 1]], south: [35, 26, [0, -1]], west: [1, 14, [1, 0]] } } // (edges: every square of its rim a way off, unmarked, asking -- M.edgeOut)
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
    var trig = [], marks = { doors: {}, gates: {} }, N = DS.DATA.npcs || {}, SH = DS.DATA.shops || {}, signs = {}, signDoor = {};
    (m8.triggers || []).forEach(function (t) {
      var r = t.rect ? t.rect.slice() : [t.x, t.y, 1, 1], th = doors8[r[0] + ',' + r[1]];
      if (/^(keeper|shop|inn):/.test(t.id) && th) {
        var arg = t.id.split(':')[1], inn = M.INNS[t.id], who = (inn && inn.name) || (SH[arg] && SH[arg].name) || (N[arg] && N[arg].name) || arg;
        trig.push({ id: t.id, on: 'use', rect: [th[0], th[1], 1, 1], town: 'door', door: { id: t.id, name: who } }); marks.doors[t.id] = th.slice();
        if (inn) { signs[th[0] + ',' + (th[1] - 1)] = 'bed'; signDoor[th[0] + ',' + (th[1] - 1)] = t.id; } // (a bed's sign over a bunkhouse's door, the first game's inn glyph: M.INNS)
        return;
      }
      if (t.script === 'roostDoor') return; // (Ottilie at the mouth: the warp asks it -- M.warp)
      trig.push(Object.assign({}, t, { rect: r, town: 'mine', walkOn: t.script === 'badAir' })); // (walkOn: the bad air coughs and the walk goes on through it -- js/roam.js R.landed; 10-28, his "lets you collect from 6 away")
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
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) { var sd = side(x, y); if (sd && (ex[sd] || F.edges) && (F.edges ? OPENCH.indexOf(g[y][x]) >= 0 && g[y][x] !== 'D' : walkable(g[y][x]))) { ways.push([x, y]); wayName[x + ',' + y] = F.edges ? 'the ' + sd + ' edge' : F.out === 'silverton' ? 'the feed track: back over the bridge to Silverton' : 'out to the ' + sd + ', onto the road'; } } // (the rim of an `edges` floor: every square the party can stand on, its shallow pools too)
    (m8.warps || []).forEach(function (wp) {
      warps.push({ at: [wp.x, wp.y], to: wp.to, tx: wp.tx, ty: wp.ty, dir: wp.dir, cond: wp.cond || null });
      if (!ways.some(function (q2) { return q2[0] === wp.x && q2[1] === wp.y; })) ways.push([wp.x, wp.y]);
      wayName[wp.x + ',' + wp.y] = 'the way to ' + (((DS.DATA.maps[wp.to] || {}).name) || wp.to).replace(/^The /, 'the ');
    });
    // (the ways' marks -- a pin and a name over each way within 20 squares, the hello's "Ways:" line, the ways green on the floor map -- came off 10-28, his eye on them: "excessive and
    // reveals the deep gallery - the tile edits are sufficient, I can see it's a path out of the first layer now"; the art desk's tiles show the ways: js/topview.js THE ART)
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
      view: 'top', ft: 30, roofs: T.roofsAt(30), slope: slope.map(function (r) { return r.join(''); }), look: lk.map(function (r) { return r.join(''); }), signs: signs, signDoor: signDoor, faceDoors: {},
      rows: rows, w: w, h: h, entry: [at], face: face, gate: gq || null, stairUp: [], doors: ways, marks: marks, people: people, foes: [], warps: warps, out: F.out || null, save: !!F.save,
      deepWater: 'D', music: m8.music || 'field', wayName: wayName, roost: !!m8.roost, edges: !!F.edges, // (roost: the first game's roosted ceiling -- the working gallery, the dens: M.fieldDef)
      names8: { rows: r8.slice(), legend: leg }, // (the first game's name of each square -- bones, webbing, a fence or a lamp, a tent or a stump: the art's piece for it, js/topview.js TV.ART)
      src8: { id: F.src, rows: [], legend: {}, triggers: trig, warps: [], chests: (m8.chests || []).slice(), zones: (m8.zones || []).slice(), save: !!F.save }, from8: id, to8: id, sig: '', // (zones: the first game's random fights where it has them -- the dens, the workings: each on a field of its own, M.fieldFight, its tables content/encounters.json)
      zone8: (m8.zones && m8.zones[0] && m8.zones[0].zone) || null,
      hud: F.place.replace(/^The /, 'the ') + ': ' + F.sub,
      hello: ['{y}' + F.place.toUpperCase() + '{/} -- ' + F.sub + ': ' + (F.own ? 'the second game\'s own floor' : 'the first game\'s floor') + ', north up as Silverton is (' + w + ' x ' + h + ' squares)' + (F.clock ? ', ' + W8tod(hour) : '') + '.',
        ].concat(F.edges ? ['Any edge of it: back to the world map.'] : [], M.bunkLine(marks.doors, flags), ['{g}Click to walk, or the arrows. E: a word, a door. O: the formation. L: the floor map.{/}']), // (no "Ways:" line since 10-28: the tiles show them)
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
  M.talk = function* (B, id, script, name, pic) { // (pic: a picture in the portrait's place -- js/counter.js o.pic)
    var C = D.counter, N = (DS.DATA.npcs || {})[id] || {}, done = null;
    var sc = new C.Counter(B, { id: id, name: name || N.name || id, place: D.roam.def.name, what: D.roam.def.sub, pic: pic || null, script: function (s) { return (function* () { done = yield* (script || M.SCENES[id])(s, B); })(); } });
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
    if (trig.script === 'pen') { yield* M.penShift(B, trig.arg); return; }
    if (trig.script === 'skarnGate') { yield* M.skarnGate(B); return; }
    if (trig.script === 'pit') { B.card(D.roam.wrap(['{y}A pit{/}: it drops to the deep gallery, the hole floor.'].concat(M.held('galleries_g4').slice(1))), 320); D.sfx('popup'); M.stepBack(B); yield 20; return; } // (the first game's S.pit drops the party there, 1d6 each: the hole floor is not the top levels' -- his ruling)
    if (trig.script === 'badAir') { yield* M.badAir(B); return; }
    if (trig.script === 'rescue') { yield* M.rescue(B, trig, at); return; }
    if (trig.script === 'seepFire') { yield* M.seepFire(B); return; }
    B.card(D.roam.wrap(['{y}' + trig.id + '{/}: the first game\'s scene (' + trig.script + ') -- not on the grid yet.']), 240); D.sfx('popup'); yield 20;
  };
  // a shift at the pens (S.pen): on the counter screen Edric's book first, the ask, who milks, the draught (M.penAsk); then the shift itself, THE CRADLE (deep16/js/cradle.js,
  // the grid's own scene with the first game's rules -- the lanes desk's ruling 10-22 on his "Crawler game needs rebuilt for this engine"; js/roam.js R.shiftPlay); then the pay at
  // the board on the counter, and Old Hob after the first shift (M.penPay). With no scene (a bench's D.cradle.STRAIGHT), the first game's own table rule, rolled straight
  // (M.shiftRoll): six draws, each a d20 and the milker's Animal Handling or Nature against 12, a 6 or less a CON save at 13 (the draught: the better of two) or the shift ends touched
  M.penShift = function* (B, n) {
    var nm = 'The pens, mouth ' + n, job = yield* M.talk(B, 'pen' + n, function (sc) { return M.penAsk(sc, B, n); }, nm);
    if (!job) return;
    var r = D.cradle && !D.cradle.STRAIGHT ? yield* D.roam.shiftPlay(B, job) : M.shiftRoll(job);
    yield* M.talk(B, 'pen' + n, function (sc) { return M.penPay(sc, B, job, r); }, nm);
  };
  M.penAsk = function* (sc, B, n) {
    var st = sc.st, f = st.flags, C = D.counter, Rr = DS.R;
    if (!f.tallyMet) { yield sc.say(L('w.penNoBook')); return null; }
    if ((yield sc.ask(L('w.penAsk'), ['WORK A SHIFT', 'LEAVE'])) !== 0) return null;
    var up = st.party.filter(function (hh) { return !hh.dead && !hh.ko && hh.hp > 0; }); if (!up.length) return null;
    var hh = up.length === 1 ? up[0] : up[yield sc.ask('WHO MILKS?', up.map(function (z) { return z.name; }))]; if (!hh) return null;
    var draught = C.count(st, 'draught') > 0; if (draught) C.take(st, 'draught', 1);
    var ah = Rr.skill(hh, 'Animal Handling', 'wis'), na = Rr.skill(hh, 'Nature', 'int');
    if (!f.shifts) yield sc.say(L('w.penHow'));
    return { n: n, hero: hh, skill: Math.max(ah, na), skillName: na > ah ? 'Nature' : 'Animal Handling', draught: draught, deep: false, mouth: +n || 2, shifts: f.shifts || 0 };
  };
  M.shiftRoll = function (job) {
    var hh = job.hero, Rr = DS.R, r = { got: 0, touched: false };
    for (var i = 0; i < 6 && !r.touched; i++) {
      var roll = M.d20() + job.skill;
      if (roll >= 12) r.got++;
      else if (roll <= 6) { var sv = M.d20() + Rr.saveBonus(hh, 'con'); if (job.draught) sv = Math.max(sv, M.d20() + Rr.saveBonus(hh, 'con')); if (sv < 13) r.touched = true; }
    }
    return r;
  };
  M.penPay = function* (sc, B, job, r) {
    var st = sc.st, f = st.flags, got = r.got || 0, lines = [];
    if (r.touched) lines.push(L('w.touched', { name: job.hero.name }));
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
  // THE FIELD CUT FROM THE FLOOR (10-27, his eye on the Glowseep by night: "the grid in the fights should pull from the roam itself", and the sizes, "The simple fight's grid seems
  // like the appropriate 'grid' sized fight and vice versa (simple with 6-8 width or whatever)" -- overruling the fix seat's call of 10-22, "drawn by kind, not cut from the floor"):
  // the grid's fight on a field 16 by 16, the road's lineup as the grid stands it in its middle rows (M.GRID); the simple fight's on its small one (js/simple.js S.fieldOpts(true));
  // either way its squares the floor's own round where the party stands, the party's square on the lineup's middle -- the window laid along the floor or across it and nudged
  // up to M.NUDGE squares, for the most of the lineup's squares open (M.cut) -- a building or a wall rock, and past the floor's edge its rim (M.FIELD's kinds: a cave's rock, the
  // bog's grass); made open ground only where the lineup stands and steps (the simple fight's square before each one, the grid's ground between the two sides); the floor's own
  // lights in it (the Glowseep's poles, moss and fire)
  M.GRID = { w: 16, h: 16, dx: 1, dy: 4, entry: [[8, 3], [8, 2], [8, 4], [9, 3], [9, 1], [9, 5], [8, 1], [8, 5]] }; // (the road's grid lineup, js/world.js W.seat, moved into the middle)
  M.NUDGE = 4;
  M.cutChar = function (c) { return c === 'd' || c === 'o' || c === '=' ? '.' : '.,gr~DkfwyTP'.indexOf(c) >= 0 ? c : '#'; }; // (a door's threshold or a bridge's boards ground; a building, a roof or a wall rock)
  M.cut = function (def, w, h, at, anchor, need, kind) {
    var ch = function (x, y) { return x >= 0 && y >= 0 && x < def.w && y < def.h ? M.cutChar(def.rows[y].charAt(x)) : null; }, open = function (c) { return c != null && '.,gr~'.indexOf(c) >= 0; };
    var best = null;
    [0, 1].forEach(function (turned) { // (the field's (fx, fy) the floor's (x0 + fx, y0 + fy), or turned across it (x0 + fy, y0 + fx))
      var bx = at[0] - anchor[turned], by = at[1] - anchor[1 - turned];
      for (var dy = -M.NUDGE; dy <= M.NUDGE; dy++) for (var dx = -M.NUDGE; dx <= M.NUDGE; dx++) {
        var x0 = bx + dx, y0 = by + dy, n = 0;
        need.forEach(function (q) { if (open(ch(x0 + q[turned], y0 + q[1 - turned]))) n++; });
        var s = n - 0.05 * (Math.abs(dx) + Math.abs(dy)) - 0.01 * turned;
        if (!best || s > best.s) best = { s: s, x0: x0, y0: y0, turned: turned };
      }
    });
    var rows = [], rim = kind === 'cave' ? '#' : 'g', isNeed = {}, carved = 0;
    need.forEach(function (q) { isNeed[q[0] + ',' + q[1]] = 1; });
    for (var fy = 0; fy < h; fy++) {
      var r = '';
      for (var fx = 0; fx < w; fx++) { var q2 = [fx, fy], c = ch(best.x0 + q2[best.turned], best.y0 + q2[1 - best.turned]); if (c == null) c = rim; if (isNeed[fx + ',' + fy] && !open(c)) { c = c === 'D' ? '~' : '.'; carved++; } r += c; }
      rows.push(r);
    }
    return { rows: rows, x0: best.x0, y0: best.y0, turned: best.turned, carved: carved, need: need.length,
      to: function (x, y) { var d = [x - best.x0, y - best.y0]; return [d[best.turned], d[1 - best.turned]]; } }; // (a floor square's place on the field)
  };
  M.fieldDef = function (def, list, simple, set, at) {
    var o = simple ? D.simple.fieldOpts(true) : null, kind = M.groundOf(def), Gd = M.GRID, w = o ? o.w : Gd.w, h = o ? o.h : Gd.h;
    var entry = o ? o.entry : Gd.entry.map(function (q) { return [q[0] + Gd.dx, q[1] + Gd.dy]; });
    var foes = simple ? D.simple.seat(list) : D.world.seat(list).map(function (f) { return Object.assign({}, f, { at: [f.at[0] + Gd.dx, f.at[1] + Gd.dy] }); });
    var foot = function (f) { var s = Math.max(1, Math.min(3, (D.FOES[f.kind] && D.FOES[f.kind].size) || 1)), out = []; for (var j = 0; j < s; j++) for (var i = 0; i < s; i++) out.push([f.at[0] + i, f.at[1] + j]); return out; };
    var stand = entry.concat([].concat.apply([], foes.map(foot))), need = [];
    if (simple) stand.forEach(function (q) { need.push(q, [q[0] + (q[0] > D.simple.C[0] ? -1 : 1), q[1]]); }); // (each one's square and the one before it toward the other side: a blow is struck from beside)
    else { var xs = stand.map(function (q) { return q[0]; }), ys = stand.map(function (q) { return q[1]; }); for (var y = Math.min.apply(null, ys); y <= Math.max.apply(null, ys); y++) for (var x = Math.min.apply(null, xs); x <= Math.max.apply(null, xs); x++) need.push([x, y]); } // (the ground between the two sides, walked)
    need = need.filter(function (q) { return q[0] >= 0 && q[1] >= 0 && q[0] < w && q[1] < h; });
    var anchor = simple ? [D.simple.PARTY[0][0], D.simple.C[1]] : entry[0], cut = M.cut(def, w, h, at || anchor, anchor, need, kind);
    D.MAPS['mine-field'] = { name: def.name, sub: def.sub, step: 10, ground: 'earth', rows: cut.rows, sky: kind === 'cave' ? 20 : null, // (a cave's ceiling 20 ft up, the Wet's: a darkmantle hangs from it)
      entry: entry, foes: [], wave: null, cut: cut };
    var lights = (def.ownLights || []).map(function (l) { if (!l || typeof l.x !== 'number') return null; var p = cut.to(l.x, l.y); return p[0] >= 0 && p[1] >= 0 && p[0] < w && p[1] < h ? [p[0], p[1], l.dim || l.bright || 5, l.color, l.bright ? 0 : 1] : null; }).filter(Boolean); // (js/battle.js's map light: [x, y, ft, colour, dim only])
    return { id: 'minefield', map: 'mine-field', level: (D.roam.party0 && D.roam.party0.level) || 5, name: def.name, sub: def.sub, dark: !!def.dark, lights: lights.length ? lights : null,
      intro: (set && set.line) || 'They come at the party out of the dark.', won: 'THE WAY IS CLEAR.', lost: 'THE DARK TAKES THEM.', noCards: true, // (no entry card: the encounter's card asked, and the four are the floor's -- its "walk in as the fixture" is not theirs, seen in the pane 10-22)
      foes: foes, wave: null, fliers: !simple, // (fliers: the SRD's fly on the grid, not in the simple fight's lineup -- js/world.js's)
      // THE ROOST (10-22, the lanes desk: the lane's 2c open 2 -- the grid's `roost` RULED 09-28, the one law canon): under a roosted floor its field is roosted too -- fire and
      // thunder greyed, a lantern hooded, and bright light (Light, Daylight, Sacred Weapon) brings the roof down, the fight's 'roost' (js/battle.js over); said as it opens,
      // the first game's own line (js/battle.js's 'Overhead, the roost'); the run's end after it, M.roostFail
      roost: !!def.roost, announce: def.roost ? [M.LINES.roost] : null };
  };
  M.LINES.roost = '{y}Overhead, the roost{/}: millions of sleeping wings. No fire. No bright light.';
  M.fieldBack = function (done) { return done === 'won' ? ['{y}The way is clear.{/}', '{g}Back where the party stood.{/}'] : done === 'escaped' ? ['{y}Away{/}: the party gets clear of them.', '{g}Back where it stood.{/}'] : ['{y}Back on the floor{/} (' + done + ').']; };
  // THE ROOST COMES DOWN (10-22, the lanes desk's call, standing for his overrule -- he was away -- on the seat's lean, "yes, match the first game"): a field fight that ends
  // 'roost' ends the run, as the first game's RoostFail does (RULED 09-24, Griz: "you wanted to make a name for yourself, but not this kind of name"): NOT THIS KIND OF NAME,
  // fail.roost's words, then CONTINUE FROM A SAVE or the title, and nothing saved (js/house.js H.lost's way). The test door: deep16/?roostfail
  M.roostFail = function* (B) {
    var H = D.house; D.sfx('error'); try { D.music('gameover'); } catch (e) { }
    if (H) { H.playing = false; H.cur = null; }
    D.scenes.length = 0; D.push(new RoostFail()); yield 1;
  };
  function RoostFail() { this.kind = 'roostfail'; this.opaque = true; this.t = 0; this.i = 0; this.bats = []; for (var k = 0; k < 220; k++) this.bats.push([Math.random() * D.W, Math.random() * D.H, (Math.random() - 0.5) * 3, -0.4 - Math.random() * 1.8, Math.random() * 8]); } // (Math.random: a picture's, never the fights' seeded dice)
  RoostFail.ROWS = [['CONTINUE FROM A SAVE', 'load'], ['TITLE', 'title']];
  RoostFail.prototype.enter = function () { this.any = [1, 2, 3].some(function (n) { return !!(D.house && D.house.read(n)); }); if (!this.any) this.i = 1; }; // (no save to go back to: TITLE first)
  RoostFail.prototype.go = function (v) {
    if (v === 'load') { if (!this.any) { D.sfx('error'); return; } D.sfx('confirm'); D.push(new D.house.Slots('load')); return; }
    D.sfx('confirm'); D.scenes.length = 0; D.push(new D.house.Title());
  };
  RoostFail.prototype.update = function () {
    this.t++; this.bats.forEach(function (b) { b[0] = (b[0] + b[2] + D.W) % D.W; b[1] += b[3]; if (b[1] < -6) b[1] += D.H + 12; b[4] += 0.35; });
    if (this.t < 150) return; // (the swarm, the words; then the choice -- the first game's beat)
    var m = D.input.mouse, R = RoostFail.ROWS, self = this;
    if (D.input.repeat('up') || D.input.repeat('down')) { this.i = 1 - this.i; D.sfx('cursor'); }
    if (m.inside) R.forEach(function (r, k) { var ry = 186 + k * 16; if (m.x >= D.W / 2 - 80 && m.x < D.W / 2 + 80 && m.y >= ry - 3 && m.y < ry + 12) { if (m.moved) self.i = k; if (m.click) { self.i = k; self.go(r[1]); } } });
    if (D.input.pressed('a')) this.go(R[this.i][1]);
  };
  RoostFail.prototype.draw = function (ctx) {
    ctx.fillStyle = '#060406'; ctx.fillRect(0, 0, D.W, D.H);
    var keep = Math.max(40, this.bats.length - this.t * 2); // (the swarm thins out as the words come up, as the first game's)
    ctx.fillStyle = '#2c2434'; this.bats.slice(0, keep).forEach(function (b) { var up = Math.sin(b[4]) > 0 ? 2 : 0; ctx.fillRect(b[0] - 3, b[1] - up, 3, 1); ctx.fillRect(b[0] + 1, b[1] - up, 3, 1); ctx.fillRect(b[0] - 1, b[1], 2, 2); });
    ctx.save(); ctx.globalAlpha = Math.min(1, Math.max(0, (this.t - 30) / 60));
    ctx.save(); ctx.translate(D.W / 2, 34); ctx.scale(2, 2); D.text(ctx, 'NOT THIS KIND', 0, 0, '#e8e0f0', 'center'); D.text(ctx, 'OF NAME', 0, 11, '#e8e0f0', 'center'); ctx.restore();
    D.wrap([].concat(L('fail.roost')).join(' '), D.W - 140).forEach(function (l, k) { D.text(ctx, l, D.W / 2, 100 + k * 11, '#c8d0e8', 'center'); });
    ctx.restore();
    if (this.t < 150) return;
    var self = this; RoostFail.ROWS.forEach(function (r, k) {
      var y = 186 + k * 16, on = k === self.i, dim = r[1] === 'load' && !self.any;
      if (on) { ctx.fillStyle = 'rgba(38,32,106,.85)'; ctx.fillRect(D.W / 2 - 80, y - 3, 160, 14); }
      D.text(ctx, (on ? '> ' : '') + r[0], D.W / 2, y, dim ? '#6c6c84' : on ? '#f8d878' : '#f8f8f8', 'center');
    });
  };
  M.RoostFail = RoostFail;
  // the roost broken and the fight WON with fire (the first game's other path, js/battle.js: usedFire under the roost on a win -- roostBroken): the grid greys fire and
  // thunder and fire's items there, and no way to it is known; kept for one that turns up (a party's fire damage dealt under the roost, the field's enter: M.fieldFight).
  // The floor's answer: the flag -- Sabeth's fired line and Ottilie's cold one after it (M.SCENES) -- and the first game's words, once
  M.roostBroke = function* (B) {
    var f = B.roam.flags; f.roostBroken = (f.roostBroken || 0) + 1;
    if (f.roostTold) return;
    f.roostTold = 1; D.sfx('error'); B.card(D.roam.wrap([].concat(L('g.roostBroken'))), 480); yield 60;
  };
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
    var F = M.fieldDef(R.def, list, simple, set, [t.x, t.y]);
    R.party0.backTo = R.def.sub; // (the fight's last card: E back to the dens -- js/battle.js o.backTo)
    var watch = /[?&]watch\b/.test(R.q || ''); // (the test door's &watch: the four run by the class AI in there too, as on the floor)
    var fb = null, enter = function (b) {
      fb = b; if (watch) b.units.forEach(function (u) { if (u.side === 'party') { u.guest = true; u.classAI = true; } });
      if (F.roost) { var hurt0 = b.hurt; b.hurt = function (u, amt, type) { if (type === 'fire' && this.active && this.active.side === 'party' && amt > 0) this.firedRoost = true; return hurt0.apply(this, arguments); }; } // (fire dealt by the party under the roost: M.roostBroke)
    };
    // its play record in the house, as the road's fights keep theirs (js/record.js; the house lane's 10-19 note 6, "the floor's fights keep no play record")
    var rec = R.house() ? { fight: 'minefield', name: R.def.name + ': ' + R.def.sub, level: ((R0.members[0] || {}).src || {}).lvl, simple: simple } : null;
    yield* R.pullIn(B, 'field', { id: 'field', field: { F: F, simple: simple, zone: zone, flag: set && set.flag, trig: set && set.trig, back: M.fieldBack, enter: enter, record: rec, ends: function (d) { return d === 'roost'; } } }, [t.x, t.y]);
    delete R.party0.backTo;
    if (R0.pulled === 'roost') { yield* M.roostFail(B); return; }
    if (R0.pulled === 'won' && fb && fb.firedRoost) yield* M.roostBroke(B);
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
  // a flop findable (10-28 later, Griz: "I didn't finish a shift but the available doors didn't look or talk about flophouse so I went back outside and camped"): the door named for
  // what it is, a bed's sign over it whose mouseover says the price (T.signName), and the floor's first card saying where to sleep (M.bunkLine)
  M.INNS['keeper:bunkhouse'].name = 'The Bunkhouse: a flop for the night'; M.INNS['keeper:pellambarn'].name = 'The Pellam Barns: bunks for the day-crews';
  M.priceLine = function (inn, f) { var p = inn.price(f || {}); return 'A bunk for the night, ' + (p ? p + ' sp (' : 'free (') + inn.why(f || {}) + '). No watch: the staff keep the door.'; };
  M.bunkLine = function (doors, f) { var ids = Object.keys(M.INNS).filter(function (k) { return doors[k]; }); return ids.map(function (k) { return '{y}' + M.INNS[k].name.split(':')[0] + '{/} (the bed sign): ' + M.priceLine(M.INNS[k], f).replace(/^A bunk/, 'a bunk'); }); };
  var signName0 = T.signName;
  T.signName = function (id) {
    var inn = M.INNS[id]; if (!inn) return signName0.apply(this, arguments);
    var B = D.battle, f = (B && B.roam && B.roam.flags) || {};
    return { name: inn.name, who: M.priceLine(inn, f).split('. ')[0] };
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
    fightHours: 0.25,    // (each fight: fifteen minutes since 10-28 later, his "fights should burn 15 minutes instead of an hour of worldtime" -- js/world.js W.FIGHT_HOURS)
    nightRate: 0.5,      // (by night the fights come twice as often: the table's rate halved)
    nightWeigh: 2,       // (by night the stirges and the wisp weigh twice)
    dayHour: 12,         // (the test door's hour, with no THE WORLD under it; &hour= sets it)
    restHours: 8         // (a long rest at the crews' fire: the SRD's eight hours on the clock, not on to the morning -- 10-27, his "I can't repeatedly sleep to get back to night time")
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
    fire: 'The Veterans keep Watch.', sleep: 'You sleep by the crews\' fire. Somebody comes in off the bog, and nobody wakes you.', morning: 'Morning over the seep. The moss has gone back to green.',
    noon: 'Day over the seep: the moss gone dull, and the crews in and asleep round the fire.', dark: 'Night over the seep: the moss lit, and the crews gone out with their poles.'
  }; // (invented.json toplevels-seep-crew)
  // what the party wakes to after a long rest by the clock (M.SEEP.restHours): the card's word and the seep's line by the hour (the morning's, js/house.js H.Morning's title)
  M.wakeAt = function (h) { return M.night(h) ? { title: 'NIGHT', line: M.LINES.seep.dark } : h < 11 ? { title: 'MORNING', line: M.LINES.seep.morning } : { title: h < 17 ? 'AFTERNOON' : 'DUSK', line: M.LINES.seep.noon }; };
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
  // the crews' fire where a keeper's portrait stands (the counter screen's box, js/counter.js o.pic): the bog round it by night, the moss lit on the mud, the fire's glow, and
  // the art desk's fire (ART-113's `campfire`, its four frames) three times up -- the code's own flames where the atlas is not in (a bench)
  M.FIREPIC = { k: 3, moss: [[0.12, 0.3], [0.24, 0.62], [0.08, 0.84], [0.8, 0.38], [0.9, 0.7], [0.7, 0.9], [0.36, 0.92], [0.6, 0.66], [0.18, 0.5], [0.86, 0.52]] };
  M.firePic = function (ctx, x, y, w, h, t, cy) {
    var mx = x + w / 2, fy = cy - 8, fl = 0.85 + 0.15 * Math.sin(t / 5) * Math.sin(t / 13), P = M.FIREPIC;
    var g = ctx.createLinearGradient(0, y, 0, cy); g.addColorStop(0, '#03040a'); g.addColorStop(1, '#0e1420'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#16110b'; ctx.fillRect(x, cy - 52, w, 52); // (the mud by the fire)
    P.moss.forEach(function (q, i) { var a = 0.35 + 0.25 * Math.sin(t / 40 + i * 1.7); ctx.fillStyle = 'rgba(126,224,138,' + a.toFixed(2) + ')'; ctx.fillRect(Math.round(x + q[0] * w), Math.round(cy - 52 + q[1] * 48), 3, 2); });
    var rg = ctx.createRadialGradient(mx, fy - 18, 4, mx, fy - 18, 96); rg.addColorStop(0, 'rgba(255,176,88,' + (0.5 * fl).toFixed(3) + ')'); rg.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = rg; ctx.fillRect(x, y, w, h);
    var p = D.topview && D.topview.piece ? D.topview.piece('campfire', Math.floor(t / 8) % 4, 'seep') : null;
    if (p) { var sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; ctx.drawImage(p.im, p.x, p.y, p.w, p.h, Math.round(mx - p.ax * P.k), Math.round(fy - p.ay * P.k), p.w * P.k, p.h * P.k); ctx.imageSmoothingEnabled = sm; return true; }
    ctx.fillStyle = '#5a4a3a'; [-30, -12, 12, 30].forEach(function (dx) { ctx.fillRect(mx + dx - 6, fy - 6, 12, 7); }); // (the ring of stones)
    [['#c83a12', 26, 50], ['#f08a1c', 18, 38], ['#ffe070', 9, 22]].forEach(function (f, i) { var hh = f[2] * fl + 4 * Math.sin(t / 3 + i); ctx.fillStyle = f[0]; ctx.beginPath(); ctx.moveTo(mx - f[1], fy); ctx.quadraticCurveTo(mx - f[1] * 0.4, fy - hh * 0.6, mx + Math.sin(t / 4 + i) * 3, fy - hh); ctx.quadraticCurveTo(mx + f[1] * 0.4, fy - hh * 0.6, mx + f[1], fy); ctx.closePath(); ctx.fill(); });
    return true;
  };
  // the crews' fire (his "watch-less camp location"): a long rest with no watch, free -- the house's night (M.sleep), and the light the morning brings. One box (10-27, his eye
  // on it: "Use a campfire where you're waiting for an NPC portrait and "the Veterans keep Watch" is cleaner version on the sleep text box. Call sleep long rest. 'ok' box is
  // superlative"): the fire in the portrait's place (M.firePic), his words over LONG REST and LEAVE, and no box before them to OK
  M.seepFire = function* (B) {
    var go = yield* M.talk(B, 'seepcrew1', function (sc) { return (function* () { return (yield sc.ask(M.LINES.seep.fire, ['LONG REST', 'LEAVE'])) === 0; })(); }, 'The crews\' fire', M.firePic);
    if (!go) return;
    B.card(D.roam.wrap([M.LINES.seep.sleep]), 200); yield 30;
    // a long rest by the clock (10-27, his "sleeping doesnt' seem to be a long rest, I can't repeatedly sleep to get back to night time"): the SRD's eight hours on THE WORLD's
    // clock (the test door's own), not on to the morning -- each sleep the long rest again, and three round to the hour it began, the night's fights with it
    var R0 = B.roam, house = !!(D.roam.house() && D.house && D.house.playing), h1 = (M.hourNow(D.roam.q, B) + M.SEEP.restHours) % 24, wk = M.wakeAt(h1);
    if (!house) R0.hour = h1;
    yield* D.house.sleepOnFloor(B, { line: wk.line, title: wk.title, music: 'inn', hours: M.SEEP.restHours });
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
    if (def && def.mine && trig.town === 'door' && M.INNS[trig.id]) { var inn = M.INNS[trig.id]; if (yield* M.talk(B, inn.id, function (sc) { return M.inn(sc, B, inn); }, inn.name)) yield* M.sleep(B); return; }
    if (def && def.mine && trig.town === 'talk' && M.SCENES[trig.npc]) { yield* M.talk(B, trig.npc); return; }
    yield* fire0(B, trig, at);
  };
  var way0 = T.wayOut; // (js/world.js's: a town's road off its floor onto THE WORLD)
  T.wayOut = function* (B, sq) {
    var def = D.roam.def || {}, k = sq[0] + ',' + sq[1];
    if (def.mine) {
      var wp = (def.warps || []).filter(function (z) { return z.at[0] === sq[0] && z.at[1] === sq[1]; })[0];
      if (wp) { yield* M.warp(B, wp); return; }
      if (def.edges) { yield* M.edgeOut(B, sq); return; }
      if (def.out === 'silverton') { yield* M.cross(B, 'silverton', 'east', [M.FEED[0] - 1, M.FEED[1]], M.LINES.toTown); return; }
    } else if (def.key === 'silverton' && !def.room && /feed track/.test((def.wayName || {})[k] || '')) { yield* M.cross(B, 'warrens', 'feed', null, M.LINES.toCamp); return; }
    yield* way0(B, sq);
  };
  // ANY EDGE (10-27, his eye on the Glowseep: "Edge to the west should kick you out back to the world map - don't label the road. Any edge walk "return to world map?""): a
  // floor with `edges` has every square of its rim a way off it, unmarked (M.floor), and a step onto one asks. RETURN: out onto THE WORLD (or the Silverton area's map) a step past
  // that side of the site, as a town's road hands the party out (js/world.js W.leaveTown) -- on the test door, with no THE WORLD under it, THE WORLD opened at the site; STAY: a
  // step back onto the floor
  M.sideOf = function (def, sq) { var d = [[sq[0], 'west'], [def.w - 1 - sq[0], 'east'], [sq[1], 'north'], [def.h - 1 - sq[1], 'south']].sort(function (a, b) { return a[0] - b[0]; }); return d[0][1]; };
  M.LINES.edge = 'Return to the world map?';
  // THE FLOOR'S CLOCK OUT ONTO THE WORLD (10-28, his "check day/march time - if they slept at the camp, make sure it's not handing the old travel used up when it returns to the
  // world map"): in the house THE WORLD's clock is the floor's own and a sleep there starts the day's march fresh (M.hourNow, js/house.js H.sleepOnFloor); outside it -- a test
  // door, THE WORLD's bare door -- the floor keeps an hour of its own, so going out it carries that hour onto THE WORLD's clock (forward only), and a night slept there starts
  // the march fresh (it had handed back THE WORLD's old hour and the day's march used up)
  M.carryClock = function (R0, hour) { // (hour: the floor's own now, a clocked floor's -- M.hourNow)
    var W = D.world, S = W && W.state && W.state(); if (!S || !R0 || (D.house && D.house.playing)) return;
    if (hour != null) { var t = Math.floor(S.t / 24) * 24 + hour; if (t < S.t) t += 24; S.t = t; }
    if (R0.slept) { S.today = 0; S.todayHex = 0; S.pushing = false; }
    W.save();
  };
  M.edgeOut = function* (B, sq) {
    var R = D.roam, def = R.def, W = D.world, H = D.house, t = B.roam.token, sd = M.sideOf(def, sq);
    D.sfx('popup'); t.anim = 'idle'; t.animT = B.t;
    var a = yield { prompt: { who: t, title: def.name.toUpperCase(), lines: R.wrap([M.LINES.edge]), opts: [{ label: 'RETURN', value: 0 }, { label: 'STAY', value: 1 }] } };
    if (a !== 0) { M.stepBack(B); return; }
    var R0 = B.roam, hr = def.clock ? M.hourNow(R.q, B) : null;
    if (W && W.active && W.inDoor && W.scene && D.scenes.indexOf(W.scene) >= 0) { if (R.house() && H && H.playing) H.fromFloor(B); M.carryClock(R0, hr); W.leaveTown(sd); return; } // (the floor's party, pack and purse back into the save first)
    var wm = W && W.index && W.index() && W.map('world'), site = wm && (wm.sites || []).filter(function (s) { return s.id === def.door; })[0]; // (W.index: THE WORLD's map read in, as its scene does on entering)
    if (!site || !W.make) { B.card(R.wrap(['{g}No world map on this page.{/}']), 160); M.stepBack(B); return; }
    var ws = W.make('?world&at=' + site.hex[0] + ',' + site.hex[1]), en = ws.enter;
    ws.enter = function () { en.apply(this, arguments); M.carryClock(R0, hr); var s2 = (W.M().sites || []).filter(function (s) { return s.id === def.door; })[0] || site; W.inDoor = { site: s2, gate: sd }; W.leaveTown(sd); }; // (out past that side once THE WORLD is in, the floor's clock on it)
    M.off(B); D.push(ws);
  };
  // the tally-house's counter: Edric's shop, the antitoxin draught (content/shops.json `tally`: it buys nothing) -- one line in the counter's vendor table
  if (D.counter && D.counter.VENDORS) D.counter.VENDORS.tally = D.counter.VENDORS.tally || { shop: 'tally', name: 'Edric Pellam' };
})();
