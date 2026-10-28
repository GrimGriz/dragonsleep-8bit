/* DEEP16 -- WEB GULCH ON THE GRID (10-28, the gulch seat, started by the lanes desk; ..\handoff-2026-10-03-the-road-and-its-rewards.md, its 10-28 section). The first
   of the road's legs as grid maps (HELD 10-21, "still later, we have to finish replacing the 8 bit first"). Griz, 10-28: "I think we're ready to build the gulch roam. The
   8bit one wasn't bad, but we want this one to slow down time progression greatly (compared to road) and run basically N-S ish like it looks like on the map (8 bit was
   kinda east to west)"; on the seat's five leans, "Gulch's leans look good" (RULED 10-28, all five):
     1 IN AND OUT: the Pit road's gulch hexes on the Silverton area are the floor -- the road walked into them from either end takes the party down onto it ("if you make it
       through the gulch, you get to the inn", wiki/web-gulch.md); out by the far mouth onto the road beyond; any other rim square asks "Return to the world map?" onto the
       bank top that side; going round on the bank tops stays the march.
     2 THE RATE: 300 squares an hour on the floor (the Glowseep's 150, Silverton's 500), a fight fifteen minutes as everywhere, the spider table at its own rate.
     3 THE FIRST GAME'S BEATS: the silk-cutters' camp and the drummer boy at the north mouth, the snared lad off the road midway (the grid's `snared`), the braiding
       ettercap up a side gully near the south end (the grid's `ettercap` on its webbed map; Hessle's board pays the fangs), the two chests, the gulch's spider table on
       fields cut from the floor.
     4 THE NOON: 11 to 14 the cutters out at the webs and the boy drumming, the fights half as often ("the spiders sulk"); by night twice as often, as the Glowseep's.
     5 A BED: none here -- the party sleeps on THE WORLD, or goes back up a mouth to camp.
   The floor is the seat's own (Gu.ROWS, 40 x 112, north up), laid along his paint's line: the Pit road down the bed from the fork's end, bending a little east as it
   goes south as his road does (the cut's paint is the 10-20 seed, `seeded.gulch1020`: mile hexes within 0.75 mi of the road, 350 ft under its banks). It rides the
   top levels' floors (js/mines.js M.FLOORS, `own` with its map; M.tick's clock by its rate, M.light by its phases) and THE WORLD's step (js/world.js W.onStep). */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, M = D.mines, T = D.town, W = D.world, Gu = D.gulch = {};
  if (!M || !T || !W) return;
  var L = function (k, o) { return D.counter.L(k, o); };
  Gu.KEY = 'webgulch'; // (the floor's key and THE WORLD's site: D.MAPS.gulch is the strung end's fight map, js/data/maps.js)
  // the clock (his lean 2) and the hours' fights (lean 4)
  Gu.RATE = {
    squaresPerHour: 300, // (walked on the floor: an hour of THE WORLD's clock -- straight down the road, about 112 squares, is 22 minutes)
    fightHours: 0.25,    // (each fight: fifteen minutes, as js/world.js W.FIGHT_HOURS)
    noonRate: 2,         // (11 to 14 the spiders sulk: the table's count between fights doubled)
    nightRate: 0.5       // (by night the count halved: twice as often)
  };
  Gu.NOON = [11, 14];

  // ---------------------------------------------------------------- the floor (the seat's draft, his paint later): 40 x 112, north up
  Gu.ROWS = [
    '################.,,..###################', '##############...,,....#################', '############......,,.....###############', '###########"......,,......##############',
    '##########."......,,........############', '########""."......,,..........##########', '#######."""....."",,............########', '#####...........".,,.............#######',
    '######...k..k..."",,.............#######', '######.........."",,....".........######', ':::::::::...o...".,,...."........#######', ':::::::::.........,,...".........#######',
    '#####.....c...c...,,..."".........######', '#####""...........,,...."".....""#######', '#####""............,,..b......""""######', '######".....x......,,.........""."######',
    '######"......x.....,,.........".""######', '#####......".".....,,.........."..######', '#####x....x".".....,,............#######', '######.....""".....,,............#######',
    '#######..x."""x....,,........xx..#######', '######....."".....",,............#######', '#######x....x.x...",,"....x.....########', '#######...x.x.....",,"..........########',
    '#######..x..x.x...",,.....".....########', '#######.x..x....x..,,..xx.""...x########', '########..x.x......,,...."x"...#########', '########.x.xx...x..,,......""..#########',
    '#########x.xxx..x..,,......"...#########', '########xxxx....x..,,....x....##########', '########".x........,,.....x..x##########', '##########.....x...,,.........##########',
    '##########....x."..,,..t......##########', '#########...."""...,,........###########', '###########.."""...,,........###########', '###########.."""...,,""...tx############',
    '##########.........,,"""....############', '##########x...x....,,"""...#############', '############.......,,".".x.#############', '###########........,,""....#############',
    '############.......,,......#############', '###########.......,,......##############', '###########....x..,,.......#############', '###########x.t....,,......##############',
    '###########"......,,......##############', '###########"......,,.......#############', '###########.......,,......##############', '###########....."",,.......#############',
    '###########x...."",,...t..##############', '###########.....".,,......##############', '###########x...."",,...."."#############', '############......,,...xx""#############',
    '###########.......,,...""."#############', '###########........,,.xxx"..############', '###########........,,.tQt.b.############', '###########........,,.x.x...############',
    '##########.........,,........###########', '###########..".....,,........###########', '##########.""."....,,.......############', '##########.."".....,,........:::::::::::',
    '#########..""".x...,,........:::::::::::', '##########.........,,".......###########', '##########........",,..t.....t##########', '##########......x.",,"..x.....##########',
    '#########......t..",,......xx.##########', '#########....bx....,,.....x"".##########', '#########..x.......,,...x""""..#########', '########..x..xx.x..,,....".""...########',
    '#########x..........,,...."x....########', '#########"..........,,...x.....#########', '#########"....x..x..,,......xx..########', '##########..x.......,,.....x...#########',
    '#########.....t"x...,,...x....x.########', '##########.xx..""...,,.......x..########', '###########..""."...,,.......b...#######', '##########...""".x..,,""..x..x..########',
    '###########x........,,"".t...xx..#######', '################.....,,".....x...#######', '################.....,,"...x....########', '################.....,,......x""########',
    '################.....,,..x..".."########', '#####.x.x.######x.x..,,.....""xx########', '####.x.xxxx#####x.x..,,...x."..#########', '###x.xxxx.xx####.....,,.....x"x#########',
    '##.xbxx.x.xx.###.....,,..x.....#########', '##.xx....x.x.###.....,,........#########', '##x.......x......""..,,.......x#########', '##xx........b..."x""..,,......##########',
    '##..x.x.x........"x"..,,.......#########', '##xxxbxx.x.x.###"""...,,.......#########', '###.xxx..bxx####""....,,"""....#########', '####x..x..x#####......,,"."...##########',
    '#####xx.x.#######.....,,""....##########', '################...x..,,""....##########', '#################.....,,"..x...#########', '#################..x..,,......##########',
    '##################....,,....x.##########', '#################.....,,...xx..#########', '##################....,,......##########', '#################.....,,......##########',
    '##################....,,......##########', '##################.".",,.......#########', '#################."."",,.......#########', '#################."..",,.......#########',
    '#################x."".,,...""..#########', '#################x."..,,.."""..#########', '##################....,,..".".##########', '##################....,,..""".##########',
    '##################....,,...".###########', '###################...,,.....###########', '###################...,,....############', '#####################.,,..##############'
  ];
  // the first game's names for the squares (js/mines.js M.LAY lays each, js/topview.js draws it: gravel the bed, the old webbing, the rock banks, pine for the stunted trees)
  Gu.LEGEND = { '#': 'cliff', '.': 'gravel', ',': 'road', '"': 'grass', x: 'webFloor', t: 'tree', k: 'tent', c: 'crate', o: 'firepit', b: 'bones', Q: 'cocoon', ':': 'dirt' };
  M.LAY.cocoon = ['k']; // (the snared lad, silk-wrapped between two stunted trees: a thing standing there -- js/topview.js draws it as a bundle)
  Gu.FIRE = [12, 10];        // the silk-cutters' fire, inside the north mouth
  Gu.SNARE = [23, 54];       // the snared lad (the first game's S.snared)
  Gu.ETTERCAP = [7, 86];     // its shelf at the back of the strung end, the side gully off the west bank
  Gu.STRUNG = [9, 85, 4, 4]; // the strung end's way in: a step there and it sees you (the first game's step trigger round its stump)
  Gu.ZONE = [0, 15, 40, 97]; // the spiders' ground: all but the camp at the north mouth ("The boy drums so nothing surprises anyone")
  Gu.CHESTS = [{ x: 9, y: 83, item: 'potion', n: 1 }, { x: 28, y: 74, item: 'kit', n: 2 }]; // (the first game's two: a potion by the ettercap, two kits off the bed)
  // the cutter and the boy where the hour puts them: at the camp, out at the near webs at noon, by the fire at night
  Gu.PEOPLE = [{ id: 'silkcutter', look: 'worker', day: [11, 9], noon: [13, 27], night: [11, 11], dir: { day: 'right', noon: 'left', night: 'right' } },
    { id: 'drummer', look: 'boy', day: [11, 12], noon: [14, 28], night: [13, 11], dir: { day: 'left', noon: 'left', night: 'left' } }];
  Gu.KINDS = { drummer: 'commonerchild', ettercap8: 'ettercap' }; // (the boy a child's figure; the ettercap its own, braiding till it is woken -- js/ui.js)
  Gu.phase = function (h) { return M.night(h) ? 'night' : h >= Gu.NOON[0] && h < Gu.NOON[1] ? 'noon' : 'day'; };
  Gu.LINES = { // (the seat's: invented.json web-gulch-floor)
    noon: 'Noon in the gulch: the silk-cutters go out to the webs, and the boy starts drumming. The spiders sulk in the heat.',
    after: 'The cutters come in off the webs with their skeins, and the drumming stops. Out in the silk, the spiders stir.',
    morning: 'Morning comes down the gulch. The cutters stir round their fire.',
    night: 'Night in the gulch. The cutters bank their fire; out in the silk, things wake.',
    mouthN: 'The Pit road, up out of the cut: north to the fork.', mouthS: 'The Pit road, up out of the cut: south toward the Halfway Inn.',
    hello: 'The Pit road runs down its bed: north up out of it to the fork, south to the Halfway Inn. The banks are a way up where they open.'
  };
  Gu.line = function (h) { var p = Gu.phase(h); return p === 'day' ? (h < Gu.NOON[0] ? Gu.LINES.morning : Gu.LINES.after) : Gu.LINES[p]; };
  // the first game's shape of a map for the hour (js/mines.js M.floor reads it as it reads theirs): the people where the hour puts them, the fights by the hour, the dark by night
  Gu.map = function (hour, flags) {
    flags = flags || {}; var ph = Gu.phase(hour), rows = Gu.ROWS.slice();
    if (flags['trig:snared']) rows[Gu.SNARE[1]] = rows[Gu.SNARE[1]].slice(0, Gu.SNARE[0]) + 'x' + rows[Gu.SNARE[1]].slice(Gu.SNARE[0] + 1); // (cut down: the silk left between the trees)
    var npcs = Gu.PEOPLE.map(function (p) { return { id: p.id, x: p[ph][0], y: p[ph][1], look: p.look, dir: p.dir[ph] }; });
    if (Gu.alive(flags)) npcs.push({ id: 'ettercap8', x: Gu.ETTERCAP[0], y: Gu.ETTERCAP[1], look: 'ettercap', dir: 'right' });
    var trig = [];
    if (!flags['trig:snared']) trig.push({ id: 'snared', rect: [Gu.SNARE[0], Gu.SNARE[1], 1, 1], on: 'use', script: 'gulchSnared', once: true });
    if (Gu.alive(flags)) trig.push({ id: 'ettercap', rect: Gu.STRUNG.slice(), on: 'step', script: 'gulchEttercap' });
    return { id: 'gulch', name: 'Web Gulch', rows: rows, legend: Gu.LEGEND, music: 'dungeon', exits: { north: 1, south: 1, east: 1, west: 1 }, dark: ph === 'night',
      lights: [{ id: 'gulchfire', kind: 'map', x: Gu.FIRE[0], y: Gu.FIRE[1], bright: 10, dim: 10, color: 'fire', flame: true, seep: true }],
      npcs: npcs, triggers: trig, zones: [{ zone: ph === 'day' ? 'gulch' : 'gulch_' + ph, rect: Gu.ZONE.slice() }], chests: Gu.CHESTS.map(function (c) { return Object.assign({}, c); }) };
  };
  Gu.alive = function (flags) { return !flags.ettercapDone && !flags['trig:ettercap']; }; // (the first game's '!flag:ettercapDone & !has:ettercapfangs': beaten here, or its fangs paid at Hessle's)
  // the gulch's fights by the hour (content/encounters.json gulch: wolf spiders to a giant spider): at noon half as often, by night twice
  (function () {
    var E = (DS.DATA && DS.DATA.encounters) || {}, Z = E.gulch; if (!Z) return;
    E.gulch_noon = Object.assign({}, Z, { rate: Z.rate.map(function (r) { return Math.round(r * Gu.RATE.noonRate); }) });
    E.gulch_night = Object.assign({}, Z, { rate: Z.rate.map(function (r) { return Math.max(4, Math.round(r * Gu.RATE.nightRate)); }) });
  })();
  M.FLOORS[Gu.KEY] = { src: 'gulch', own: true, map: Gu.map, door: Gu.KEY, place: 'Web Gulch', sub: 'the road down the cut', save: false, out: 'world', clock: true, edges: true,
    rate: Gu.RATE, phase: Gu.phase, phaseLine: Gu.line, // (save: false, as the first game's gulch -- no bed here, his lean 5)
    gates: { north: [17, 1, [0, 1]], south: [22, 110, [0, -1]], west: [1, 10, [1, 0]], east: [38, 59, [-1, 0]] } }; // (the road's two mouths; the silk-cutters' descent west, a way up the east bank)
  var floor0 = M.floor;
  M.floor = function (key) {
    var def = floor0.apply(this, arguments); if (key !== Gu.KEY) return def;
    def.people.forEach(function (p) { if (Gu.KINDS[p.id]) p.kind = Gu.KINDS[p.id]; });
    def.hello = ['{y}WEB GULCH{/} -- the road down the cut, north up (' + def.w + ' x ' + def.h + ' squares), ' + (W.todAt ? W.todAt(def.hour) : '') + '.', Gu.LINES.hello,
      '{g}Click to walk, or the arrows. E: a word, a door. O: the formation. L: the floor map.{/}'];
    return def;
  };
  var ground0 = M.groundOf;
  M.groundOf = function (def) { return def && def.key === Gu.KEY ? 'gulch' : ground0.apply(this, arguments); }; // (a field's rim the banks' rock, open to the sky: js/mines.js M.cut, M.fieldDef)
  // a field cut from the gulch carries the floor's webs in it (the grid's web hazard, js/battle.js: DEX or restrained, fire burns them) at a giant spider's DC
  var fieldDef0 = M.fieldDef;
  M.fieldDef = function (def) {
    var F = fieldDef0.apply(this, arguments); if (!def || def.key !== Gu.KEY) return F;
    var md = D.MAPS['mine-field'], c = md && md.cut, n8 = def.names8, webs = [];
    if (c && n8) for (var y = 0; y < def.h; y++) for (var x = 0; x < def.w; x++) {
      if (n8.legend[n8.rows[y].charAt(x)] !== 'webFloor') continue;
      var p = c.to(x, y); if (p[0] >= 0 && p[1] >= 0 && p[0] < md.rows[0].length && p[1] < md.rows.length && md.rows[p[1]].charAt(p[0]) === '.') webs.push(p);
    }
    if (webs.length) { F.webs = webs; F.webDC = 12; } // (SRD 5.1 Giant Spider, Web: DC 12 Strength to burst it)
    return F;
  };

  // ---------------------------------------------------------------- the beats: the snared lad and the braiding ettercap, the grid's own fights pulled in from the floor
  // (the first game's words first, on the encounter's card; FIGHT, or back away)
  Gu.set = function* (B, o) {
    var R = D.roam, R0 = B.roam, t = R0.token, F0 = D.fight && D.fight(o.fight); if (!F0) return;
    D.sfx('encounter'); t.anim = 'idle'; t.animT = B.t;
    var a = yield { prompt: { who: t, title: o.title, lines: R.wrap(o.lines), opts: [{ label: 'FIGHT', value: 0 }, { label: o.away, value: 1 }] } };
    if (a !== 0) { if (o.step) M.stepBack(B); return; }
    var F = Object.assign({}, F0, { level: (R.party0 && R.party0.level) || F0.level, noCards: true });
    R0.fights++; // (THE WORLD's hour counts it: M.tick)
    R.party0.backTo = R.def.sub;
    var rec = R.house() ? { fight: o.fight, name: 'Web Gulch: ' + F.name, level: ((R0.members[0] || {}).src || {}).lvl, simple: false } : null;
    yield* R.pullIn(B, 'field', { id: 'field', field: { F: F, simple: false, zone: 'gulch', flag: 'trig:' + o.trig, trig: o.trig, back: M.fieldBack, record: rec } }, [t.x, t.y]);
    delete R.party0.backTo;
    if (R0.pulled === 'won' && o.after) yield* o.after(B);
  };
  // the snared lad (S.snared): two wolf spiders and a giant spider coming for a shape in the silk; cut down, a few coins pressed on you
  Gu.snared = function* (B) {
    yield* Gu.set(B, { fight: 'snared', trig: 'snared', title: 'WEB GULCH', lines: [].concat(L('gulch.snared')), away: 'LEAVE IT',
      after: function* (B2) { D.counter.state(B2).silver(12); D.sfx('coin'); M.relay(B2); B2.card(D.roam.wrap([].concat(L('gulch.snaredFree'), [L('g.foundSilver', { n: 12 })])), 300); yield 30; } });
  };
  // the braiding ettercap (S.ettercap): it stops braiding when it sees you; won, its fangs for Hessle's board
  Gu.ettercap = function* (B, step) {
    var f = B.roam.flags; if (!Gu.alive(f)) return;
    yield* Gu.set(B, { fight: 'ettercap', trig: 'ettercap', title: 'THE STRUNG END', lines: [].concat(L('gulch.ettercap')), away: 'BACK AWAY', step: step,
      after: function* (B2) { D.counter.give(D.counter.state(B2), 'ettercapfangs', 1); D.sfx('chest'); M.relay(B2, null, true); B2.card(D.roam.wrap([].concat(L('gulch.fangs'))), 360); yield 30; } });
  };
  var trigger0 = M.trigger;
  M.trigger = function* (B, trig, at) {
    if (trig.script === 'gulchSnared') { yield* Gu.snared(B); return; }
    if (trig.script === 'gulchEttercap') { yield* Gu.ettercap(B, true); return; }
    yield* trigger0.apply(this, arguments);
  };
  var fire0 = T.fire;
  T.fire = function* (B, trig) { // (a word with the ettercap is the ettercap: E on it, or a click)
    var def = D.roam.def;
    if (def && def.key === Gu.KEY && trig.town === 'talk' && trig.npc === 'ettercap8') { yield* Gu.ettercap(B, false); return; }
    yield* fire0.apply(this, arguments);
  };

  // ---------------------------------------------------------------- IN: the Pit road's gulch hexes on the Silverton area (his lean 1)
  W.DOORS[Gu.KEY] = { roam: Gu.KEY, gates: { north: [-0.14, -1], south: [0.14, 1], west: [-1, 0], east: [1, 0] } }; // (the road's way through the cut: his paint's line)
  W.APPROACH[Gu.KEY] = { mi: 4, z: 40 };
  Gu.hc = function (m, q, r) { return [m.w * (q + r / 2), m.w * Math.sqrt(3) / 2 * r]; }; // (a hex's middle in miles on that map -- W.hc reads the map in use)
  Gu.site = function (m) { return ((m || W.M()).sites || []).filter(function (s) { return s.id === Gu.KEY; })[0] || null; };
  // the road's hexes through the cut, in the road's order from the Pit to the fork: the Pit road's hexes on this map that are the gulch's (W.zoneOf) near its site
  Gu.span = function (m) {
    m = m || W.M(); if (m.gulchSpan !== undefined) return m.gulchSpan;
    var site = Gu.site(m), P = (m.paths || []).filter(function (p) { return p.id === 'pitroad'; })[0], out = null;
    if (site && P && P.hexes) {
      var hx = P.hexes, idx = [];
      hx.forEach(function (h, i) { var e = m.hex[h[0] + ',' + h[1]], c = Gu.hc(m, h[0], h[1]); if (e && W.zoneOf(e) === 'gulch' && Math.hypot(c[0] - site.x, c[1] - site.y) < 4.5) idx.push(i); });
      if (idx.length) { var lo = Math.min.apply(null, idx), hi = Math.max.apply(null, idx); out = { hexes: hx.slice(lo, hi + 1), south: hx[lo - 1] || hx[lo], north: hx[hi + 1] || hx[hi], set: {} }; out.hexes.forEach(function (h) { out.set[h[0] + ',' + h[1]] = 1; }); }
    }
    return (m.gulchSpan = out);
  };
  // which way in, by the step: down the road from the fork's end, up it from the inn's, or off a bank top
  Gu.gateFrom = function (from, to) {
    var a = W.hc(from[0], from[1]), b = W.hc(to[0], to[1]), v = [a[0] - b[0], a[1] - b[1]], G = W.DOORS[Gu.KEY].gates, best = 'north', bd = -1e9;
    Object.keys(G).forEach(function (k) { var d = G[k][0] * v[0] + G[k][1] * v[1]; if (d > bd) { bd = d; best = k; } });
    return best;
  };
  Gu.enter = function (gate) {
    var site = Gu.site(); if (!site || !D.roam) return false;
    if (W.house()) { D.house.toTown(Gu.KEY, gate); return true; }
    W.inDoor = { site: site, gate: gate }; D.push(D.roam.make('?roam=' + Gu.KEY + '&gate=' + gate)); return true;
  };
  var step0 = W.onStep;
  W.onStep = function (scene, st) { // (THE WORLD's step and the top-down view's: true stops the walk)
    var m = W.M(), S = W.state(), sp = m && m.near ? Gu.span(m) : null; // (on the area only: THE WORLD alone keeps the site's door, offered where a walk ends)
    if (sp && S.from && sp.set[S.at[0] + ',' + S.at[1]]) { Gu.enter(Gu.gateFrom(S.from, S.at)); return true; }
    return step0.apply(this, arguments);
  };

  // ---------------------------------------------------------------- OUT: the road's two mouths onto the road beyond the cut; any other rim square asks, onto the bank top
  Gu.ptOut = function (def, sq) {
    var m = W.M(), sp = Gu.span(m), site = Gu.site(m); if (!site) return null;
    if (!sp) return [site.x, site.y];
    var n = Gu.hc(m, sp.hexes[sp.hexes.length - 1][0], sp.hexes[sp.hexes.length - 1][1]), s = Gu.hc(m, sp.hexes[0][0], sp.hexes[0][1]);
    if (sq[1] === 0) return Gu.hc(m, sp.north[0], sp.north[1]);
    if (sq[1] === def.h - 1) return Gu.hc(m, sp.south[0], sp.south[1]);
    var k = sq[1] / (def.h - 1), x = n[0] + (s[0] - n[0]) * k, y = n[1] + (s[1] - n[1]) * k, side = M.sideOf(def, sq);
    return [x + (side === 'west' ? -2.2 : side === 'east' ? 2.2 : 0), y]; // (the bank top that side, beyond the cut)
  };
  Gu.place = function (pt, line) {
    while (D.scenes.length && D.top() !== W.scene) D.pop();
    if (!W.scene) return;
    var S = W.state(); if (pt) { S.pos = pt.slice(); if (W.place(pt)) W.scene.onMap(); }
    var cl = W.hc(S.at[0], S.at[1]); W.scene.cam.cx = cl[0]; W.scene.cam.cy = cl[1];
    W.inDoor = null; if (W.house()) D.house.cur.at = { town: null }; W.save(); try { D.music('corridor'); } catch (e) { }
    W.scene.say(line + ' ' + W.timeOfDay().charAt(0).toUpperCase() + W.timeOfDay().slice(1) + '.');
  };
  Gu.out = function* (B, sq) {
    var R = D.roam, def = R.def, H = D.house, t = B.roam.token, sd = M.sideOf(def, sq), mouth = sq[1] === 0 || sq[1] === def.h - 1;
    D.sfx('popup'); t.anim = 'idle'; t.animT = B.t;
    if (mouth) { B.card(R.wrap(['{y}' + (sq[1] === 0 ? Gu.LINES.mouthN : Gu.LINES.mouthS) + '{/}', '{g}The world map takes the party on.{/}']), 90); yield 40; }
    else { var a = yield { prompt: { who: t, title: def.name.toUpperCase(), lines: R.wrap([M.LINES.edge]), opts: [{ label: 'RETURN', value: 0 }, { label: 'STAY', value: 1 }] } }; if (a !== 0) { M.stepBack(B); return; } }
    var R0 = B.roam, hr = M.hourNow(R.q, B), line = mouth ? 'Up out of Web Gulch by the ' + sd + ' mouth, on the Pit road.' : 'Up out of Web Gulch onto the ' + sd + ' bank.';
    if (W.active && W.inDoor && W.scene && D.scenes.indexOf(W.scene) >= 0) { if (R.house() && H && H.playing) H.fromFloor(B); M.carryClock(R0, hr); Gu.place(Gu.ptOut(def, sq), line); return; }
    var wm = W.index && W.index() && W.map('world'), site = wm && Gu.site(wm); // (the test door: THE WORLD opened at the site, the floor's clock carried onto it)
    if (!site || !W.make) { B.card(R.wrap(['{g}No world map on this page.{/}']), 160); M.stepBack(B); return; }
    var ws = W.make('?world&at=' + site.hex[0] + ',' + site.hex[1]), en = ws.enter;
    ws.enter = function () { en.apply(this, arguments); M.carryClock(R0, hr); W.inDoor = { site: Gu.site() || site, gate: sd }; Gu.place(Gu.ptOut(def, sq), line); };
    M.off(B); D.push(ws);
  };
  var edgeOut0 = M.edgeOut;
  M.edgeOut = function* (B, sq) { if (D.roam.def && D.roam.def.key === Gu.KEY) { yield* Gu.out(B, sq); return; } yield* edgeOut0.apply(this, arguments); };
})();
