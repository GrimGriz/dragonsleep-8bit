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
    galleries: { src: 'galleries_g1', door: 'mouth', place: 'The Guano Galleries', sub: 'the mouth', save: true, out: 'world',
      gates: { east: [34, 21, [-1, 0]], south: [17, 22, [0, -1]], west: [1, 21, [1, 0]] } }, // (THE WORLD's site: the road in from the junction east, a step inside each edge)
    galleries_g2: { src: 'galleries_g2', place: 'The Guano Galleries', sub: 'the working gallery', save: false }
  };
  M.KEY8 = { warrens_a: 'warrens', warrens_b: 'warrens_b', galleries_g1: 'galleries', galleries_g2: 'galleries_g2' };
  M.FEED = [78, 10]; // (Silverton's feed track where it runs off the town floor's east edge -- the bench checks it is still the feed track's: mode=toplevels1021)
  M.key = function (q) { var m = /[?&]roam=([a-z0-9_]+)/.exec(q || ''); return m && M.FLOORS[m[1]] ? m[1] : null; };

  // the first game's legend, by name, as the grid's squares (js/iso.js OPEN, STANDS) and the look under them (js/topview.js TV.LOOKS)
  M.LAY = {
    void: ['#'], caveWall: ['#'], timber: ['#'], mountain: ['#'], range: ['#'], cliff: ['#'], runeWall: ['#'], dwarfWall: ['#'], sealDoor: ['#'], chimney: ['#'],
    caveFloor: ['.', 'C'], bones: ['.', 'C'], webFloor: ['.', 'C'], dwarfFloor: ['='], rails: ['.', 'R'], railsH: ['.', 'H'], gravel: ['.', 'Y'], fungus: ['.', 'M'], glowmoss: ['.', 'M'],
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
  M.floor = function (key, q, flags) {
    q = q || ''; flags = flags || {};
    var F = M.FLOORS[key], m8 = DS.DATA.maps[F.src], leg = m8.legend, r8 = m8.rows, w = r8[0].length, h = r8.length;
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
    // where the party stands
    var gq = (/[?&]gate=([a-z]+)/.exec(q) || [])[1], aq = /[?&]at=(\d+),(\d+)/.exec(q), fq = /[?&]face=(-?\d),(-?\d)/.exec(q), at = null, face = [0, -1];
    if (aq) at = [+aq[1], +aq[2]];
    else { var gk = F.gates ? (F.gates[gq] ? gq : Object.keys(F.gates)[0]) : null, gt = gk && F.gates[gk]; if (gt) { at = [gt[0], gt[1]]; face = gt[2].slice(); gq = gk; } }
    if (!at && warps.length) { var w0 = warps[0]; at = [w0.at[0], w0.at[1] + (w0.at[1] === h - 1 ? -1 : 1)]; } // (a floor below, walked into by the test door: by its way up)
    if (fq) face = [+fq[1], +fq[2]];
    Object.keys(F.gates || {}).forEach(function (k) { marks.gates[k] = F.gates[k].slice(0, 2); });
    var rows = g.map(function (r) { return r.join(''); }), id = function (a, b) { return [a, b]; };
    var def = D.MAPS[key] = {
      name: F.place, sub: F.sub, key: key, door: F.door || null, mine: true, town: true, wet: false, dark: false, ground: 'earth', step: 10,
      view: 'top', ft: 30, roofs: T.roofsAt(30), slope: slope.map(function (r) { return r.join(''); }), look: lk.map(function (r) { return r.join(''); }), signs: {}, faceDoors: {},
      rows: rows, w: w, h: h, entry: [at], face: face, gate: gq || null, stairUp: [], doors: ways, marks: marks, people: people, foes: [], warps: warps, out: F.out || null, save: !!F.save,
      deepWater: 'D', music: m8.music || 'field', wayName: wayName,
      src8: { id: F.src, rows: [], legend: {}, triggers: trig, warps: [], chests: (m8.chests || []).slice(), zones: [], save: !!F.save }, from8: id, to8: id, sig: '', zone8: null,
      hud: F.place.replace(/^The /, 'the ') + ': ' + F.sub,
      hello: ['{y}' + F.place.toUpperCase() + '{/} -- ' + F.sub + ': the first game\'s floor, north up as Silverton is (' + w + ' x ' + h + ' squares).', '{g}Click to walk, or the arrows. E: a word, a door. O: the formation. L: the floor map.{/}'],
      where: function () { return F.sub; }
    };
    return def;
  };

  // ---------------------------------------------------------------- the ways: down and up between a place's floors, the dark floors waiting, out to THE WORLD or Silverton
  M.held = function (to) { var n8 = ((DS.DATA.maps[to] || {}).name || to); return ['{y}' + n8 + '{/}.', '{g}The dark floors below come onto the grid with its roam (the Wet is there already, held for the house). The party keeps to the lit floors for now.{/}']; };
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
  M.stepBack = function (B) { var t = B.roam.token, f = B.roam.fw; if (D.grid.canStand(t, t.x - f[0], t.y - f[1])) { t.x -= f[0]; t.y -= f[1]; t.tween = null; } };
  // to another of these floors: the house's party handed into the save and walked on (js/house.js H.fromFloor, as a town's door is); the test door's four carry the floor's flags
  M.go = function* (B, key, at, face, lines) {
    var R = D.roam, H = D.house, q = '?roam=' + key + '&at=' + at[0] + ',' + at[1] + (face ? '&face=' + face[0] + ',' + face[1] : ''), F = M.FLOORS[key];
    B.card(['{y}' + F.place + '{/} -- ' + F.sub + '.'], 60); D.sfx('stairs'); yield 20;
    var back = M.giveBack(B, key), nb;
    if (R.house() && H && H.playing) {
      H.fromFloor(B); M.off(B);
      if (F.save) H.cur.at = { town: F.door, gate: null, sq: null, dir: null };
      nb = R.make(q, { save: H.living(H.cur), opts: { at8: at.slice() }, house: true });
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
    nb.enter = function () { en.apply(this, arguments); this.inv = inv; this.roam.silver = sp; };
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
  // the floor's own squares (the first game's triggers): the pens' shifts, Skarn's gate
  M.trigger = function* (B, trig) {
    if (trig.script === 'pen') { yield* M.talk(B, 'pen' + trig.arg, function (sc) { return M.pen(sc, B, trig.arg); }, 'The pens, mouth ' + trig.arg); return; }
    if (trig.script === 'skarnGate') { yield* M.skarnGate(B); return; }
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
  M.relay = function (B) {
    var R = D.roam, old = R.def, def = M.floor(old.key, R.q, B.roam.flags);
    def.entry = old.entry; def.face = old.face; R.def = def;
    B.map = D.iso.load(def); D.grid.setup(B.map, B.units); R.layChests(B); B.cache = null;
  };

  // ---------------------------------------------------------------- the town's hooks (js/town.js): a word and a square on these floors, and their ways off
  var fire0 = T.fire;
  T.fire = function* (B, trig, at) {
    var def = D.roam.def;
    if (def && def.mine && trig.town === 'mine') { yield* M.trigger(B, trig, at); return; }
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
  // the tally-house's counter: Edric's shop, the antitoxin draught (content/shops.json `tally`: it buys nothing) -- one line in the counter's vendor table
  if (D.counter && D.counter.VENDORS) D.counter.VENDORS.tally = D.counter.VENDORS.tally || { shop: 'tally', name: 'Edric Pellam' };
})();
