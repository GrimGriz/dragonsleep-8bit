/* DEEP16 -- THE HALFWAY INN ON THE GRID (11-04, the Inn build seat, started by the lanes desk on Griz's word; ..\handoff-2026-10-30-the-halfway-inn-and-the-lake.md, its
   item 1). Griz, 11-04, to the desk: "alright, did a story-plot review for the inn, we're ready to start adding it back to the world"; 10-30: "The inn as potentially top-grid
   (usual) and synched iso-grid (night-fight) with night scripting attempted on iso - we'll need pose requests to replace willem and amara in combat as well as inn NPCs";
   11-04: "Inn lady needs a name and we'll need portrait requests" (Gennet Waterby, the realm's: TarlynsPit/wiki/halfway-inn-and-lake.md).

   The inn is two floors on the top levels' machinery (js/mines.js M.FLOORS, as Web Gulch and the Galleries are): the yard and the shore, and the common room inside -- the
   first game's own two maps (content/maps/halfway.json, halfway_in.json), read and never written, a square of theirs a square of the grid. THE WORLD's site 'inn' is its door
   (js/world.js W.DOORS); any edge of the yard asks to go back out onto the road. Its people stand where the first game stands them, by its flags, in the townsfolk's figures
   till the art desk's come back (deep16-art-wanted.md §35): Doran Waterby in the yard and behind the counter, his wife by the common room's hearth -- THE INN LADY on her
   plate till she gives her name (the lane's 11-04 §2) -- Elsbeth at the kitchen tub, the traveler by the fire, Orrin and Pell down at the shore. A room of the inn lady's,
   five silver a head as the first game had it, is the house's bed (js/house.js H.sleepOnFloor): to the morning, no watch.
   TWO VIEWS, ONE MAP (his 10-30 words above): the yard by day north up, as Silverton is; by night on the grid's diamonds (js/mines.js ON THE DIAMONDS) -- the same squares,
   so where the party stands on the one it stands on the other. The hour turning to night as they walk lays the yard again on the diamonds under them (M.lightNow, M.relay),
   and a morning lays it north up. The common room stays north up. &view=top or &view=iso on a door holds one view. The night's scripting (the wagon night, the lane's item
   2) runs on the diamonds.
   THE SNOOT'S DOOR (the lane's 11-04 §8.2, the Inn seat's lean standing; RULED 10-15, Griz: "we're going to move that to the half-way inn and start the snoot from there"):
   from the Snoot's day (In.SNOOT_DAY) a runner off the Pit road stands in the yard, and his word opens the Snoot's own page (snoot-mode/?from=inn, its BACK TO THE INN
   home again). Its four are the Snoot's own till the Snoot lane's §12.7.
   The seat's words here (the arrival, Gennet's name -- the Inn seat's draft, the bed, the runner) are invented.json halfway-inn-floor. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, M = D.mines, T = D.town, W = D.world, In = D.inn = {};
  if (!M || !T || !W) return;
  var L = function (k, o) { return D.counter.L(k, o); };
  In.KEY = 'halfway'; In.IN = 'halfway_in'; In.SITE = 'inn';
  In.SNOOT_DAY = 14;          // (the runner from this day of the house's clock: the Snoot at the Pit -- the Snoot mode's own first day, its DAY0)
  In.PRICE = 5;               // (a room, silver a head: the first game's S.gennet)
  In.RATE = { squaresPerHour: 500, fightHours: 0.25 }; // (north up the walk spends the hour at Silverton's street's pace -- js/mines.js THE ROAM CLOCK BY THE VIEW; on the diamonds, nothing)
  In.RUNNER = [5, 9];         // (the runner by the well, off the road)
  In.STEP = { west: [13, 12], east: [20, 12] }; // (each door's step, south of it in the inn's front wall: the way in)
  In.ROOM = 'inn:halfway';    // (the common room drawn as a room: its walls cut low, js/topview.js)
  In.INDOORS = { doranYard: 1, orrin: 1, pell: 1, adoptedKid: 1 }; // (the yard's people who are in by night)
  In.at = function (key) { return key === In.KEY || key === In.IN; };

  // the first game's names on these two maps that the top levels' floors had not needed, as the grid's squares and their looks (js/mines.js M.LAY)
  Object.assign(M.LAY, { grassT: ['g'], flowers: ['g'], cobble: ['='], sand: ['.', 'Y'], flatstone: ['.', 'C'], dock: ['o'],
    floorWood: ['o'], floorStone: ['='], rug: ['o'], counter: ['K'], bar: ['K'], table: ['K'], bed: ['y'], shelf: ['S'], hearth: ['w'], boxes: ['k'], pillar: ['#'],
    innWall: ['#'], doorway: ['d'] });
  M.KEY8.halfway = In.KEY; M.KEY8.halfway_in = In.IN;
  In.KINDS = { doranYard: 'commoner', doranIn: 'commoner', gennet: 'commonerwoman', gennetGrief: 'commonerwoman', elsbeth: 'commonerwoman', katarina: 'commonerwoman',
    orrin: 'commonerchild', pell: 'commonerchild', adoptedKid: 'commonerchild', snootRunner: 'commoner' }; // (the townsfolk's figures till §35's come back)
  In.named = function (f) { return f && f.gennetNamed ? 'Gennet Waterby' : 'The inn lady'; };
  In.NAME = { gennet: In.named, gennetGrief: In.named, snootRunner: function () { return 'A runner from the Pit'; } };
  In.LINES = {
    arrive: ['The Halfway Inn: the only well on the Pit road, a long day and a half from either end. A long low stone house between the road and the water.',
      'Halfway Lake is older than the inn and named it. Knee-shallow forty paces out; then, off the point, it goes.'],
    name: '"Gennet. Waterby, since the wedding. The lake\'s older than either."',
    bed: 'Lake fish for supper, and a room under the eaves. Nobody stands a watch at the Halfway Inn: the house keeps its own door.',
    morning: 'Morning on Halfway Lake: mist off the water, the well\'s chain, the boys already down at the shore.',
    night: 'Night at the Halfway Inn. The lamps are lit in the common room; past the point the lake is black.',
    day: 'Morning comes up over Halfway Lake.',
    nightIn: 'Night. The common room\'s lamps are lit, and the fire is built up.',
    dayIn: 'Morning. The shutters are open on the lake side.',
    runner: ['A runner off the Pit road, mud to the knee, drinking at the well like he means to empty it.',
      '"The Snoot\'s come down on the Pit -- the whole of it, gnolls past counting. The Pit\'s asking for every blade on the road. South, if you\'re going."'],
    runnerAsk: 'THE SNOOT is a page of its own: the war on the hexes round the Pit. What is not saved here stays behind.',
    hello: 'The Pit road runs down the yard\'s west side; the inn between it and the water, its two doors on the yard. Any edge: back to the world map.',
    helloIn: 'The common room: the hearth, the counter, the stair up; the kitchen through the back. The doors east and west go out to the yard.'
  };
  In.line = function (h) { return M.night(h) ? In.LINES.night : In.LINES.day; };
  In.lineIn = function (h) { return M.night(h) ? In.LINES.nightIn : In.LINES.dayIn; };
  // the house's day (THE WORLD's clock), or a test door's &day=
  In.day = function (q) { var m = /[?&]day=(\d+)/.exec(q || ''); if (m) return +m[1]; var S = W.state && W.state(); return S && S.t != null ? Math.floor(S.t / 24) + 1 : 1; };
  In.snootOn = function (q) { return In.day(q) >= In.SNOOT_DAY; };
  In.q = '';

  // ---------------------------------------------------------------- the two floors: the first game's maps, copied for the grid's needs (never written)
  var copy = function (o) { return JSON.parse(JSON.stringify(o)); };
  In.yardMap = function (hour, flags) {
    var m = copy(DS.DATA.maps.halfway);
    // each door's way in off its door square onto its step (M.floor draws the door in the wall over the step), and the people where the first game stands them
    m.warps = (m.warps || []).map(function (w) { return Object.assign({}, w, { y: w.y + 1 }); });
    m.triggers = (m.triggers || []).filter(function (t) { return t.id !== 'rowboat'; }).map(function (t) { return Object.assign({}, t, { script: 'inn:' + t.script }); }); // (the rowboat waits on the lake: the lane's item 7)
    (m.signs || []).forEach(function (s, i) { m.triggers.push({ id: 'innsign' + i, rect: [s.x, s.y, 1, 1], on: 'use', script: 'inn:sign', text: s.text }); });
    if (M.night(hour)) m.npcs = m.npcs.filter(function (n) { return !In.INDOORS[n.id]; }); // (by night the yard's own are in: the first game cleared them for its night's scenes)
    if (In.snootOn(In.q)) m.npcs.push({ id: 'snootRunner', x: In.RUNNER[0], y: In.RUNNER[1], look: 'worker', dir: 'left' });
    m.dark = false; // (outdoors: by night the sky's wash with the lamps' pools, js/mines.js M.paintSky -- the inn's lamps lit)
    return m;
  };
  In.roomMap = function () {
    var m = copy(DS.DATA.maps.halfway_in);
    m.legend = Object.assign({}, m.legend, { w: 'innWall', o: 'innWall', D: 'doorway', p: 'pillar' }); // (its walls a room's, its doors in the side walls a threshold to step through)
    m.triggers = (m.triggers || []).map(function (t) { return Object.assign({}, t, { script: 'inn:' + t.script }); });
    m.warps = (m.warps || []).map(function (w) { return Object.assign({}, w, { ty: w.ty + 1 }); }); // (out onto the yard a step south of the door's step: the yard's way in stands on the step)
    return m;
  };
  M.FLOORS[In.KEY] = { src: 'halfway', own: true, map: In.yardMap, door: In.SITE, place: 'The Halfway Inn', sub: 'the yard and the shore', save: true, out: 'world', outdoors: true,
    clock: true, edges: true, rate: In.RATE, phase: M.seepPhase, phaseLine: In.line,
    gates: { north: [1, 1, [0, 1]], south: [1, 24, [0, -1]], west: [3, 12, [1, 0]] } }; // (the Pit road in at either end of the yard's west side; off the hills by the yard)
  M.FLOORS[In.IN] = { src: 'halfway_in', own: true, map: In.roomMap, door: In.SITE, place: 'The Halfway Inn', sub: 'the common room', save: true, clock: true, rate: In.RATE,
    phase: M.seepPhase, phaseLine: In.lineIn };

  // the floor laid: on the diamonds by night (the yard), the people in their figures, the plate, the first arrival's words
  In.isoAt = function (key, h) { return key === In.KEY && M.night(h); };
  var floor0 = M.floor;
  M.floor = function (key, q, flags, hour) {
    if (!In.at(key)) return floor0.apply(this, arguments);
    var h = hour != null ? hour : M.hourNow(q), q2 = q || '';
    if (!/[?&]view=(top|iso)\b/.test(q2)) q2 += In.isoAt(key, h) ? '&view=iso' : '&view=top';
    In.q = q || ''; var def = floor0.call(this, key, q2, flags, h); flags = flags || {};
    def.people.forEach(function (p) { if (In.KINDS[p.id]) p.kind = In.KINDS[p.id]; });
    if (key === In.IN) { def.room = In.ROOM; def.hud = 'the Halfway Inn: the common room'; def.save = true; }
    else def.skyLights = (def.skyLights || []).concat([In.STEP.west, In.STEP.east].map(function (q) { return { x: q[0], y: q[1], door: 'inn' }; })); // (a lamp over each door's step, as the first game's yard: the night's pools, js/mines.js M.paintSky)
    var first = !flags.reachedInn; flags.reachedInn = 1;
    def.hello = ['{y}THE HALFWAY INN{/} -- ' + def.sub + ', ' + (def.iso ? 'on the grid\'s diamonds by night, north up the screen\'s right' : 'north up') + ' (' + def.w + ' x ' + def.h + ' squares), ' + (W.todAt ? W.todAt(h) : '') + '.']
      .concat(first ? In.LINES.arrive : [], [key === In.IN ? In.LINES.helloIn : In.LINES.hello, '{g}Click to walk, or the arrows. E: a word, a door. O: the formation. L: the floor map.{/}']);
    return def;
  };
  // the night's turn on the yard: the floor laid again on the other view where the party stands (M.relay keeps the token's square), the camera on them, the diamonds' zoom
  var relay0 = M.relay;
  M.relay = function (B, hour, restand) {
    var def0 = D.roam.def, was = def0 && def0.key === In.KEY ? !!def0.iso : null;
    if (was !== null && !/[?&]view=(top|iso)\b/.test(D.roam.q || '') && In.isoAt(In.KEY, hour != null ? hour : def0.hour) !== was) B.isoZoomed = false; // (the diamonds' own zoom as they open: js/mines.js T.people)
    relay0.apply(this, arguments);
    var def = D.roam.def; if (was === null || !def || def.key !== In.KEY || !!def.iso === was) return;
    if (restand !== true) { B.units = B.units.filter(function (u) { return !u.npc; }); T.people(B); }
    var t = B.roam && B.roam.token; if (t) { t.tween = null; B.roam.path = null; D.grid.setup(B.map, B.units); B.focus(t); }
    B.cache = null;
  };
  // the plates: THE INN LADY till she gives her name
  var people0 = T.people;
  T.people = function (B) {
    people0.apply(this, arguments);
    var def = D.roam && D.roam.def; if (!def || !In.at(def.key)) return;
    var f = (B.roam && B.roam.flags) || {};
    B.units.forEach(function (u) { if (typeof u.npc === 'string' && In.NAME[u.npc]) u.name = In.NAME[u.npc](f); });
  };
  // a SAVE in the common room stands the party in the yard a step out from the near door, as a room's on Silverton's street (js/house.js H.atOf)
  var atOf0 = D.house && D.house.atOf;
  if (atOf0) D.house.atOf = function (B) { var def = D.roam.def; if (def && def.key === In.IN) return { town: In.SITE, gate: 'west', sq: [In.STEP.west[0], In.STEP.west[1] + 1], dir: 'down' }; return atOf0.apply(this, arguments); };
  // the common room's doors: a room's door goes back to the street (js/roam.js R.landed, js/town.js T.goOut) -- here, the warp out onto the yard (js/mines.js M.warp)
  var goOut0 = T.goOut;
  T.goOut = function* (B) { var def = D.roam.def, t = B.roam && B.roam.token; if (!B.townAway && def && def.key === In.IN && t) { yield* T.wayOut(B, [t.x, t.y]); return; } yield* goOut0.apply(this, arguments); };

  // ---------------------------------------------------------------- the people: the inn lady's room, Elsbeth at the tub (the first game's S.gennet, S.elsbeth on the counter screen)
  In.has = function (st, id) { return D.counter.count(st, id) > 0 || st.party.some(function (h) { return h.equip && Object.keys(h.equip).some(function (s) { return h.equip[s] === id; }); }); };
  In.heads = function (B) { return ((B.roam && B.roam.members) || []).filter(function (u) { return u.src && !u.src.guest; }).length || 1; };
  In.gennet = function* (sc, B) {
    var st = sc.st, f = st.flags, cost = In.PRICE * In.heads(B);
    if (!f.gennetNamed) { f.gennetNamed = 1; yield sc.say([].concat(M.words(B, 'gennet'), [In.LINES.name])); }
    else yield sc.say(M.words(B, 'gennet'));
    var a = yield sc.ask(L('inn.stayAsk', { n: cost }), ['STAY THE NIGHT', 'NO']);
    if (a !== 0) return false;
    if (st.silver() < cost) { D.sfx('error'); yield sc.say(L('g.poor')); return false; }
    st.silver(-cost); D.sfx('coin');
    yield sc.say(In.LINES.bed);
    return true;
  };
  // the night: the house's bed to the morning (the first night's wagon is the lane's item 2), the floor laid at the morning's hour under the morning card
  In.sleep = function* (B) { yield* D.house.sleepOnFloor(B, { line: In.LINES.morning, music: 'inn', before: function () { M.lightNow(B); } }); };
  M.SCENES.elsbeth = function* (sc, B) {
    var st = sc.st, f = st.flags;
    if (f.lakeDone) { yield sc.say(L('inn.elsbethAfter')); return; }
    if (f.elsbethSilent) { yield sc.say(L('inn.elsbethSilent')); return; }
    if (f.doranAway && !In.has(st, 'ringofbinding')) { f.elsbethSent = 1; yield sc.say(L('inn.elsbethWinters')); return; }
    if (!f.dishes) {
      var a = yield sc.ask(L('inn.elsbethDishes'), ['HELP WITH THE DISHES', 'LEAVE HER BE']);
      if (a !== 0) return;
      f.dishes = 1; yield sc.say(L('inn.elsbeth1')); return;
    }
    if (!f.elsbethTold) { f.elsbethTold = 1; yield sc.say(L('inn.elsbeth2')); return; }
    yield sc.say(L(In.has(st, 'ringofbinding') ? 'inn.elsbethTonight' : 'inn.elsbeth3'));
  };
  // the Snoot's runner: his word, and the Snoot's page on TO THE SNOOT
  In.runnerScene = function* (sc) {
    yield sc.say(In.LINES.runner);
    var a = yield sc.ask(In.LINES.runnerAsk, ['TO THE SNOOT', 'NOT NOW']);
    return a === 0;
  };
  In.toSnoot = function () { In.left = '../snoot-mode/?from=inn'; if (!In.stay) window.location.href = In.left; }; // (In.stay: a bench's, the page kept)
  var fire0 = T.fire;
  T.fire = function* (B, trig, at) {
    var def = D.roam.def;
    if (def && In.at(def.key) && trig.town === 'talk' && (trig.npc === 'gennet' || trig.npc === 'snootRunner')) {
      if (trig.npc === 'gennet') {
        var slept = yield* M.talk(B, 'gennet', function (sc) { return In.gennet(sc, B); }, In.named(B.roam.flags));
        B.units.forEach(function (u) { if (u.npc === 'gennet') u.name = In.named(B.roam.flags); }); // (her name on her plate once she has given it)
        if (slept) yield* In.sleep(B);
        return;
      }
      if (yield* M.talk(B, 'snootRunner', function (sc) { return In.runnerScene(sc, B); }, 'A runner from the Pit')) In.toSnoot();
      return;
    }
    yield* fire0.apply(this, arguments);
  };
  // the squares: the point and its flat stone, the lantern post's sign, the stair to the room over the kitchen (the first game's S.point, S.pointStep, S.drawer)
  var trigger0 = M.trigger;
  M.trigger = function* (B, trig, at) {
    var s = trig.script; if (!/^inn:/.test(s || '')) { yield* trigger0.apply(this, arguments); return; }
    var f = B.roam.flags, st = D.counter.state(B), say = [];
    if (s === 'inn:pointStep') { if (f.lakeDone) say = [L('lake.quiet')]; else if (!f.pointSeen) { f.pointSeen = 1; say = [L('lake.pointDay')]; } } // (the due seen, the thing awake there: the lake's, the lane's item 7)
    else if (s === 'inn:point') say = [L(f.lakeDone ? 'lake.quiet' : 'lake.deep')];
    else if (s === 'inn:sign') say = [trig.text || ''];
    else if (s === 'inn:drawer') {
      if (f.katRode && !f.katBookTaken && !In.has(st, 'katbook')) { f.katBookTaken = 1; D.counter.give(st, 'katbook', 1); D.sfx('chest'); say = [L('inn.drawerBook'), L('g.got', { item: DS.DATA.items.katbook.name })]; } // (she rode out with the wagon: the book left in the drawer -- the lane's item 10)
      else say = [L('inn.stair')];
    }
    if (!say.length) return;
    D.sfx('popup'); B.card(D.roam.wrap([].concat.apply([], say)), 320); yield 20;
  };

  // ---------------------------------------------------------------- THE WORLD: the site 'inn' a door (the Pit road through it north and south, the hills west)
  W.DOORS[In.SITE] = { roam: In.KEY, gates: { north: [0, -1], south: [0, 1], west: [-1, 0] } };
  W.APPROACH[In.SITE] = { mi: 4, z: Infinity }; // (down to the area's closest zoom as the party nears, as every door's: js/world.js W.closeZ)

  // ---------------------------------------------------------------- THE HALFWAY INN, shown (deep16/?innshow -- the eyes rows' door): a NEW GAME's four staged on the floor by the beat
  In.BEATS = [
    { id: 'yard', label: 'THE YARD BY DAY, north up', note: 'Ten in the morning in the yard: Doran Waterby by the woodpile, the boys down at the shore, the lantern post on the point, the lake east. The step under the near door takes the party in. E on anyone: a word.', key: In.KEY, at: [12, 13], hour: 10 },
    { id: 'room', label: 'THE COMMON ROOM at dusk: the inn lady\'s room', note: 'The inn lady by the hearth (her plate THE INN LADY till she gives her name), Doran behind the counter, the traveler by the fire, Elsbeth at the kitchen tub through the back. E on the inn lady: her name, then a room at five silver a head -- the night, no watch, the morning.', key: In.IN, at: [4, 5], hour: 18 },
    { id: 'night', label: 'THE YARD BY NIGHT, on the diamonds', note: 'The same squares on the grid\'s diamonds, north up the screen\'s right: the inn\'s lamps, the lantern post by the flat stone, the lake black past the point. The path runs east to the flat stone.', key: In.KEY, at: [20, 13], hour: 22 },
    { id: 'turn', label: 'THE HOUR TURNS: dusk to night where the party stands', note: 'Dusk in the yard, north up, a step short of eight o\'clock. One step: night comes, and the yard is laid again on the diamonds under the party, on the same square.', key: In.KEY, at: [12, 14], hour: 19, prime: true },
    { id: 'top', label: 'THE YARD BY NIGHT held north up (&view=top)', note: 'The same night and the same spot drawn north up, to set beside the third.', key: In.KEY, at: [20, 13], hour: 22, view: 'top' },
    { id: 'snoot', label: 'DAY 14: THE SNOOT\'S RUNNER in the yard', note: 'The Snoot at the Pit: a runner off the Pit road by the well. E on him: TO THE SNOOT opens the Snoot\'s own page (its BACK TO THE INN comes home), or NOT NOW.', key: In.KEY, at: [6, 10], hour: 10, day: 14 },
    { id: 'world', label: 'THE WORLD AT THE INN: its door', note: 'A NEW GAME on THE WORLD on the inn\'s hex. E: the inn\'s door -- GO IN by the gate the party faces.', world: true, hour: 15 }
  ];
  In.play = function (bt) {
    var H = D.house, R = D.roam, rec = H.fresh(); rec.at = { town: null }; rec.flags = Object.assign({}, bt.flags || {}); rec.silver = Math.max(rec.silver || 0, 60);
    var site = bt.world ? ((W.map && W.index && W.index() && W.map('world')) || { sites: [] }).sites.filter(function (s) { return s.id === In.SITE; })[0] : null;
    H.begin(rec, 0, site ? '?world&at=' + site.hex[0] + ',' + site.hex[1] : null);
    var S = W.state && W.state(); if (S && bt.hour != null) S.t = (bt.day ? (bt.day - 1) * 24 : Math.floor((S.t || 0) / 24) * 24) + bt.hour;
    if (bt.world) return;
    var nb = R.make('?roam=' + bt.key + (bt.view ? '&view=' + bt.view : ''), { save: H.living(H.cur), opts: { at8: bt.at.slice() }, house: true }), en = nb.enter;
    nb.enter = function () { en.apply(this, arguments); if (bt.prime) this.roam.clockSq = In.RATE.squaresPerHour - 1; }; // (the next square walked the hour's last)
    D.push(nb);
  };
  In.show = function (q) { return new D.roam.WetShow(q, { kind: 'innshow', beats: In.BEATS, play: In.play, title: '{y}THE HALFWAY INN, 11-04{/} -- the yard and the common room, by day and by night (a show)' }); };
})();
