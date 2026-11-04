/* DEEP16 -- THE HALFWAY INN ON THE GRID (11-04, the Inn build seat, started by the lanes desk on Griz's word; ..\handoff-2026-10-30-the-halfway-inn-and-the-lake.md, its
   item 1, re-cut 11-04 on his word). Griz, 11-04, to the desk: "alright, did a story-plot review for the inn, we're ready to start adding it back to the world"; then, relayed:
   "I'd like to try to have the inn exist only as an iso - if we can properly manage the interior interaction (perma transparent walls when party-token inside?)" and "then it
   can build the interior around the dinner scene, make the inn a more proper place than conversion of an 8bit stab"; and "Inn lady needs a name" (Gennet Waterby, the realm's).

   ONE PLACE ON THE DIAMONDS: the seat's own floor (In.ROWS, 44 x 54), laid from the realm's drawn battle map (TarlynsPit/battle-maps/halfway-inn-battlemap-drawn-2026-08-27.jpg,
   module-halfway-inn.md §2): the Pit road along the top -- its left end south to the Pit, its right end north to the Gulch, so the map's top is the realm's west and the lake
   below it east -- the yard with the well, the hitching rail, the stable and its cart, the woodpile; the long stone inn (the common room with its long table and the hearth on
   the road wall, the serving counter, the hall and its stair up, the pantry, the family room, the kitchen with its hearth, its tub and its fish); the lake door, the path down
   the grass, the point with its flat stone, its lantern post and the rowboat, and the deep. It rides the top levels' floors (js/mines.js M.FLOORS: `own`, `iso`).
   THE WALLS SEE-THROUGH INSIDE (his "perma transparent walls when party-token inside"): the inn is laid two ways by where the token stands. From the yard it is a building
   under its roof, its rooms closed; a step into either doorway lays it again with its rooms open, its people standing in them, and every wall cut to a knee-high stub (In.STUB)
   -- the whole house seen from above for as long as the party is in it, and a step out roofs it again (In.lay, js/mines.js M.relay).
   THE MEAL (the lane's 11-04 §4, the Inn seat's design, built with the interior on his "build the interior around the dinner scene"): the first room taken of the inn lady,
   supper at the long table before the night -- what the road has told the house by the day the party comes (In.day: the moot; the one-eyed chief and the mirror-eyed beasts;
   the Snoot's reach north; the Snoot at the Pit), each word true or heard wrong by the party's History, shown; the house read by its silent Insight; Doran's drovers asked by
   Persuasion and the traveler's mirror by Religion, shown. The dice in the play record (js/house.js H.trail).
   THE SNOOT'S DOOR (the lane's 11-04 §8.2 lean standing; RULED 10-15, Griz: "we're going to move that to the half-way inn and start the snoot from there"): from the Snoot's
   day (In.SNOOT_DAY) a runner off the Pit road by the well; his word opens the Snoot's own page (snoot-mode/?from=inn, its BACK TO THE INN home again).
   The seat's words here are invented.json halfway-inn-floor and halfway-inn-meal. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, M = D.mines, T = D.town, W = D.world, In = D.inn = {};
  if (!M || !T || !W) return;
  var L = function (k, o) { return D.counter.L(k, o); };
  In.KEY = 'halfway'; In.SITE = 'inn';
  In.SNOOT_DAY = 14;          // (the runner from this day of the house's clock: the Snoot at the Pit -- the Snoot mode's own first day)
  In.PRICE = 5;               // (a room, silver a head: the first game's S.gennet)
  In.RATE = { squaresPerHour: 500, fightHours: 0.25 }; // (on the diamonds the walk spends nothing -- js/mines.js THE ROAM CLOCK BY THE VIEW -- a fight its quarter hour)
  In.HOUSE = [8, 18, 34, 26]; // (the inn's walls, x0 y0 x1 y1: inside them the house is laid open)
  In.DOORS = { front: [20, 18], lake: [30, 26] }; // (the front door on the yard, the lake door from the kitchen passage)
  In.STUB = 1;                // (the walls' height while the party is inside, a roof's own measure: a knee-high stub -- js/iso.js roofCanvas)
  In.ROOF = 'b';              // (the inn under red tile from the yard; the stable under shingle)
  In.inHouse = function (x, y) { var h = In.HOUSE; return x >= h[0] && x <= h[2] && y >= h[1] && y <= h[3]; };

  // ---------------------------------------------------------------- the floor (the seat's, laid from the realm's battle map): 44 x 54, the road along the top, the lake below
  In.ROWS = [
    '""""""""""""""""""""""""""""""""""""""""""""', ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,', ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '""""""".............................."""""""', '""""".................................."""""',
    '""""....................................""""', '""t".......................ssssssss.....""""',
    '"""".......................ssssssss.....""""', '""""........q..............ssssssss....."t""',
    '"""".......................ssssssss.....""""', '"""".......................ssssssss.....""""',
    '"t"".........................cc.........""""', '""""............||||....................""""',
    '""""....................................""""', '""""....................................""""',
    '""""....................................""t"', '""""..www...............................""""',
    '""".....BBBBBBBBBBBBDBBBBBBBBBBBBBB......"""', '""""....BcoohhoooooBouBHHHBoHHHoooB.....""""',
    '""t"....BooooooooKoBooooooooooooooB.....""""', '""""....BooooooooKoBooBoocBoooooohB.....""""',
    '""""....BooKKKKKoKooooBBBBBooKKoohB.....t"""', '""""....BooooooooKooooBoozBoooooooB.....""""',
    '""""....BooooooooKoBooooooooooooooB.....""""', '""""....BccooooooooBooBzozBooooTocB.....""""',
    '"t""....BBBBBBBBBBBBBBBBBBBBBBDBBBB.....""t"', '""""..........................,.........""""',
    '""""".........................,........"""""', '""""".........................,........"""""',
    '""""""........................,.......""""""', '""t"""""".....................,..."""""""t""',
    '""""""""""""""""""""""""""""",""""""""""""""', '""""""""""""""""""""""""""""","""""t""""""""',
    '"""""""""""""""""""t""""""""",""""""""""""""', '""""""""""""""""""""""""""""",""""""""""""""',
    '""""""""""""""""""""""""""""",""""""""""""""', '"""t"""""""""""""""""""""""","""""""""""t"""',
    '"""""""""""""""""""""""""""","""""""""""""""', '"""""""""""""t"""""""""""""","""""""""""""""',
    '"""""""""""""""""""""""""""","""""""""""""""', '""""""t""""""""""""""""""""","""""""""""""""',
    '"""""""""""""""""""""""""""",""""""""t""""""', '"""""""""""""""""""""""""""",""l""""""""""""',
    '""""""""""""""""""""""""rrrrrrrr""""""""""""', 'nneeeeeeennnnnnnnnnnnnnnrrriirrrnnnneeeeeeen',
    'WWWWWWWWWWWWWWWWWWWWWWWWrrrrrrrrWbWWWWWWWWWW', 'WWWWWWWWWWWWWWWWWWWWWWYYWWWWWWWWWYYWWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWYYYYYYYYYYYYYYYWWWWWWWW', 'WWWWWWWWWWWWWWWWWWWWWYYYYYYYYYYYYYYYWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWYYYYYYYYYYYYYYYWWWWWWWW', 'WWWWWWWWWWWWWWWWWWWWWYYYYYYYYYYYYYYYWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWYYYYYYYYYYYYYYYWWWWWWWW', 'WWWWWWWWWWWWWWWWWWWWWYYYYYYYYYYYYYYYWWWWWWWW'
  ];
  In.LEGEND = { '"': 'grassT', '.': 'earth', ',': 'road', t: 'tree', q: 'well', '|': 'fence', w: 'woodpile', c: 'crate', s: 'roofS', B: 'innWall', o: 'floorWood',
    D: 'doorway', K: 'table', H: 'shelf', z: 'bed', h: 'firepit', u: 'stairsUp', T: 'tub', n: 'sand', i: 'flatstone', r: 'rocks', l: 'lamp', e: 'reeds', W: 'water', Y: 'deep', b: 'boat' };
  // the names the top levels' floors had not needed, as the grid's squares (js/mines.js M.LAY; a roof by M.ROOF)
  Object.assign(M.LAY, { grassT: ['g'], earth: ['.'], woodpile: ['k'], floorWood: ['o'], doorway: ['d'], table: ['K'], shelf: ['S'], bed: ['y'], tub: ['w'], sand: ['.'],
    flatstone: ['.'], rocks: ['r'], boat: ['k'] });
  M.ROOF.innRoof = In.ROOF; M.ROOF.innWall = 'v';
  // where the people stand, by the hour and the floor's flags (the first game's conditions): the yard's by day, the house's inside it -- seen while the party is in
  In.FOLK = [
    { id: 'doranYard', at: [9, 16], look: 'worker', dir: 'down', cond: '!flag:doranAway', when: 'day', out: true },
    { id: 'orrin', at: [26, 44], look: 'kid', dir: 'down', cond: '!flag:dueSeen', when: 'light', out: true },
    { id: 'pell', at: [21, 44], look: 'kid', dir: 'right', cond: '!flag:dueSeen', when: 'light', out: true },
    { id: 'adoptedKid', at: [34, 44], look: 'girl', dir: 'left', cond: 'flag:kidAtInn & !flag:dueSeen', when: 'light', out: true },
    { id: 'doranIn', at: [18, 21], look: 'worker', dir: 'left', cond: '!flag:doranAway', when: 'evening' },
    { id: 'gennet', at: [14, 20], look: 'innlady', dir: 'down', cond: '!flag:lakeDone' },
    { id: 'gennetGrief', at: [11, 21], look: 'innlady', dir: 'down', cond: 'flag:lakeDone' },
    { id: 'elsbeth', at: [31, 24], look: 'elsbeth', dir: 'down', cond: '!flag:postgame' },
    { id: 'katarina', at: [10, 20], look: 'kat', dir: 'right', cond: '!flag:katGone' }
  ];
  In.RUNNER = [13, 10];       // (the Snoot's runner by the well)
  In.KINDS = { doranYard: 'commoner', doranIn: 'commoner', gennet: 'commonerwoman', gennetGrief: 'commonerwoman', elsbeth: 'commonerwoman', katarina: 'commonerwoman',
    orrin: 'commonerchild', pell: 'commonerchild', adoptedKid: 'commonerchild', snootRunner: 'commoner' }; // (the townsfolk's figures till the art desk's come back: deep16-art-wanted.md §35)
  In.when = function (w, h) { var tod = W.todAt ? W.todAt(h) : (M.night(h) ? 'night' : 'day'); return !w || (w === 'day' ? h >= 7 && h < 17 : w === 'evening' ? !(h >= 7 && h < 17) : w === 'light' ? tod !== 'night' : true); };
  In.named = function (f) { return f && f.gennetNamed ? 'Gennet Waterby' : 'The inn lady'; };
  In.NAME = { gennet: In.named, gennetGrief: In.named, snootRunner: function () { return 'A runner from the Pit'; } };
  In.LINES = {
    arrive: ['The Halfway Inn: the only well on the Pit road, a long day and a half from either end. A long low stone house between the road and the water.',
      'Halfway Lake is older than the inn and named it. Knee-shallow forty paces out; then, off the point, it goes.'],
    hello: 'The Pit road runs along the top, the lake below; the inn in the yard between, its front door on the yard and its lake door on the path to the point. Any edge: back to the world map.',
    inside: 'Inside the Halfway Inn: the common room, the hall and its stair, the pantry and the family room, the kitchen through the back.',
    name: '"Gennet. Waterby, since the wedding. The lake\'s older than either."',
    bed: 'A room under the eaves. Nobody stands a watch at the Halfway Inn: the house keeps its own door.',
    morning: 'Morning on Halfway Lake: mist off the water, the well\'s chain, the boys already down at the shore.',
    night: 'Night at the Halfway Inn. The lamps are lit in the common room; past the point the lake is black.',
    day: 'Morning comes up over Halfway Lake.',
    runner: ['A runner off the Pit road, mud to the knee, drinking at the well like he means to empty it.',
      '"The Snoot\'s come down on the Pit -- the whole of it, gnolls past counting. The Pit\'s asking for every blade on the road. South, if you\'re going."'],
    runnerAsk: 'THE SNOOT is a page of its own: the war on the hexes round the Pit. What is not saved here stays behind.',
    stair: 'The stair up to the guest rooms. The room over the kitchen has its door shut.'
  };
  In.line = function (h) { return M.night(h) ? In.LINES.night : In.LINES.day; };
  // the house's day (THE WORLD's clock), or a test door's &day=
  In.day = function (q) { var m = /[?&]day=(\d+)/.exec(q || ''); if (m) return +m[1]; var S = W.state && W.state(); return S && S.t != null ? Math.floor(S.t / 24) + 1 : 1; };
  In.snootOn = function (q) { return In.day(q) >= In.SNOOT_DAY; };
  In.q = ''; In.inside = false;

  // the floor in the first game's shape (js/mines.js M.floor reads it): the inn laid open or roofed, the people by the hour, the squares' words
  In.map = function (hour, flags) {
    var inside = In.inside, rows = In.ROWS.map(function (r, y) {
      if (y < In.HOUSE[1] || y > In.HOUSE[3]) return r;
      return r.split('').map(function (c, x) { return !inside && In.inHouse(x, y) && c !== 'D' ? 'R' : c; }).join(''); // (from the yard: the house under its roof but its two doorways)
    });
    var npcs = In.FOLK.filter(function (p) { return (inside || p.out) && In.when(p.when, hour); }).map(function (p) { return { id: p.id, x: p.at[0], y: p.at[1], look: p.look, dir: p.dir, cond: p.cond }; });
    if (In.snootOn(In.q)) npcs.push({ id: 'snootRunner', x: In.RUNNER[0], y: In.RUNNER[1], look: 'worker', dir: 'down' });
    var trig = [{ id: 'flatstone', rect: [27, 45, 2, 1], on: 'step', script: 'inn:pointStep' }, { id: 'thedeep', rect: [21, 47, 15, 7], on: 'use', script: 'inn:point' },
      { id: 'lanternpost', rect: [31, 43, 1, 1], on: 'use', script: 'inn:sign', text: 'A lantern post by the flat stone. Nobody swims here. Nobody draws from the lake. The well is for that.' }];
    if (inside) trig.push({ id: 'stair', rect: [21, 19, 1, 1], on: 'step', script: 'inn:stair' });
    var lights = inside ? [[12, 19], [13, 19], [33, 21], [33, 22]].map(function (q, i) { return { id: 'hearth' + i, kind: 'map', x: q[0], y: q[1], bright: 10, dim: 10, color: 'fire', flame: true, seep: true }; }) : null;
    return { id: 'halfway', name: 'The Halfway Inn', rows: rows, legend: Object.assign({ R: 'innRoof' }, In.LEGEND, inside ? {} : { B: 'innRoof' }), music: inside ? 'inn' : 'lake', exits: { north: 1, south: 1, east: 1, west: 1 }, dark: false,
      lights: lights, npcs: npcs, triggers: trig, chests: [] };
  };
  M.FLOORS[In.KEY] = { src: 'halfway', own: true, map: In.map, door: In.SITE, place: 'The Halfway Inn', sub: 'the yard and the shore', save: true, out: 'world', outdoors: true,
    clock: true, edges: true, iso: true, rate: In.RATE, phase: M.seepPhase, phaseLine: In.line,
    gates: { south: [1, 2, [1, 0]], north: [42, 2, [-1, 0]], west: [20, 1, [0, 1]] } }; // (the Pit road in at its south end and its north, and off the hills over it)
  // the map's sides as the realm's (its top is the west): the way out by a side, and its words
  In.SIDE = { north: 'west', east: 'north', south: 'east', west: 'south' };
  var sideOf0 = M.sideOf;
  M.sideOf = function (def, sq) { var s = sideOf0.apply(this, arguments); return def && def.key === In.KEY ? In.SIDE[s] || s : s; };
  In.qInside = function (q) { var a = /[?&]at=(\d+),(\d+)/.exec(q || ''); return /[?&]inside\b/.test(q || '') || (!!a && In.inHouse(+a[1], +a[2])); };
  var floor0 = M.floor;
  M.floor = function (key, q, flags, hour) {
    if (key !== In.KEY) return floor0.apply(this, arguments);
    In.inside = In.state != null ? In.state : In.qInside(q); In.q = q || '';
    var h = hour != null ? hour : M.hourNow(q), def = floor0.call(this, key, q, flags, h); flags = flags || {};
    def.inside = In.inside; def.sub = In.inside ? 'the common room and the rooms' : 'the yard and the shore'; def.hud = 'the Halfway Inn: ' + def.sub;
    def.roofs = Object.assign({}, def.roofs, { v: { h: In.STUB, roof: 'leather', wall: 'stone' } }); // (the walls cut low while the party is in)
    def.people.forEach(function (p) { if (In.KINDS[p.id]) p.kind = In.KINDS[p.id]; });
    def.skyLights = (def.skyLights || []).concat([[20, 17], [30, 27]].map(function (q2) { return { x: q2[0], y: q2[1], door: 'inn' }; }), In.inside ? [[12, 20], [33, 21], [14, 22], [30, 23], [21, 22]].map(function (q2) { return { x: q2[0], y: q2[1], door: 'hearth' }; }) : []); // (a lamp over each door; inside, the hearths and the lamps on the tables -- the night's pools, js/mines.js M.paintSky)
    var first = !flags.reachedInn; flags.reachedInn = 1;
    def.hello = ['{y}THE HALFWAY INN{/} -- ' + def.sub + ', on the grid\'s diamonds (' + def.w + ' x ' + def.h + ' squares), ' + (W.todAt ? W.todAt(h) : '') + '.']
      .concat(first ? In.LINES.arrive : [], [In.inside ? In.LINES.inside : In.LINES.hello, '{g}Click to walk, or the arrows. E: a word, a door. O: the formation. L: the floor map.{/}']);
    return def;
  };
  // a floor laid again (the hour's phase, or the house opened or roofed): the house as it stood unless In.lay says otherwise
  var relay0 = M.relay;
  M.relay = function (B, hour, restand) {
    var keep = In.relaying != null ? In.relaying : D.roam.def && D.roam.def.key === In.KEY ? !!D.roam.def.inside : null;
    In.state = keep; try { relay0.apply(this, arguments); } finally { In.state = null; }
  };
  // a step into a doorway or out of the house: the house laid open or roofed under the party, on the same square
  In.lay = function (B, inside) {
    In.relaying = inside; try { M.relay(B, null, true); } finally { In.relaying = null; }
    var t = B.roam.token; t.tween = null; B.roam.path = null; D.grid.setup(B.map, B.units); B.focus(t); B.cache = null; B.map.occKey = null;
    if (inside) B.card(D.roam.wrap(['{y}The Halfway Inn{/} -- ' + In.LINES.inside]), 200);
  };
  var arrive0 = D.roam.arrive;
  D.roam.arrive = function* (B) {
    var ev = yield* arrive0.apply(this, arguments), def = D.roam.def, t = B.roam && B.roam.token;
    if (!ev && def && def.key === In.KEY && t && D.battle === B && In.inHouse(t.x, t.y) !== !!def.inside) In.lay(B, In.inHouse(t.x, t.y));
    return ev;
  };
  // the plates: THE INN LADY till she gives her name
  var people0 = T.people;
  T.people = function (B) {
    people0.apply(this, arguments);
    var def = D.roam && D.roam.def; if (!def || def.key !== In.KEY) return;
    var f = (B.roam && B.roam.flags) || {};
    B.units.forEach(function (u) { if (typeof u.npc === 'string' && In.NAME[u.npc]) u.name = In.NAME[u.npc](f); });
  };
  // a SAVE in the house stands the party in the yard a step out from the front door, as a room's on Silverton's street (js/house.js H.atOf)
  var atOf0 = D.house && D.house.atOf;
  if (atOf0) D.house.atOf = function (B) { var def = D.roam.def, t = B && B.roam && B.roam.token; if (def && def.key === In.KEY && t && In.inHouse(t.x, t.y)) return { town: In.SITE, gate: 'north', sq: [In.DOORS.front[0], In.DOORS.front[1] - 1], dir: 'up' }; return atOf0.apply(this, arguments); };

  // ---------------------------------------------------------------- THE MEAL: supper at the long table, the first room taken (the lane's 11-04 §4-5)
  // the news by the day the party comes (the inn the road's ear): each word true or heard wrong by the party's History, shown; the line under the line by its silent Insight
  In.MEAL = {
    open: 'Supper is lake fish at the long table. The Waterbys eat with their guests; it is that kind of house. Elsbeth carries and does not sit.',
    bands: [ // (from the day: 1 the moot, 4 the one-eyed chief and the mirror-eyed beasts, 8 the Snoot's reach north, 14 the Snoot at the Pit)
      { day: 1, id: 'heardMoot', who: 'Doran', ok: '"Gnolls held a moot up in the hills. Every tribe under one moon. Their king told the Dominion no, and they say he burned for it."',
        wrong: '"Gnolls had a moot in the hills. Fought among themselves, the drovers say, and the old king lost. Good riddance to him."' },
      { day: 4, id: 'heardChief', who: 'Gennet', ok: '"A drover at the well told me the one-eyed chief came down out of the hills after. His fur\'s gone black, and his eye is like the bottom of a well."',
        wrong: '"One of their chiefs came through the hills, a drover said. Blind in an eye, painted black for his mourning, I\'d guess."' },
      { day: 4, id: 'heardMirror', who: 'Doran', ok: '"And things off the hills since. Dogs, or something like. Eyes that throw your own face back at you."' },
      { day: 8, id: 'heardReach', who: 'Doran', ok: '"The Snoot\'s moving. North past the Gulch. The silk-cutters have pulled in off the webs."',
        wrong: '"Some gnoll band is raiding down south. It won\'t come this far. It never has."' },
      { day: 8, id: 'heardHarbinger', who: 'Gennet', ok: '"Three men at that well this week told me of the same thing, and not one of them would put a name to it."' },
      { day: 14, id: 'heardPit', who: 'Doran', ok: '"The Snoot\'s at the Pit. The road south is shut. Hessle in Silverton is paying gold for a true word of it."',
        wrong: '"There\'s trouble at the Pit, something with the gnolls. It\'ll blow over. It always does."' }
    ],
    rich: '{c}(insight) The house is too well kept for the traffic on this road. Somebody pays for it.{/}',
    wrong: '{c}(insight) Something is wrong in this house. The girl in the kitchen has counted you twice.{/}',
    drover: { label: 'ASK DORAN ABOUT THE DROVERS', ok: '"All right." He sets his cup down. "The drover saw the chief at the ford with a pack behind him, every one with the same eyes. His dogs wouldn\'t go near the water after. He sold them in Silverton for what he could get."',
      no: 'Doran shrugs. "Drovers talk."' },
    mirror: { label: 'ASK THE TRAVELER ABOUT HER MIRROR', ok: '{y}The hand-mirror on her belt is a Dominion mender\'s: the glass they set bones by.{/} She sees you see it, and eats no more.',
      no: 'A small mirror on her belt, the kind a careful woman carries. She covers it with her hand.' },
    bed: 'TO BED',
    close: 'The fire is let down. Gennet takes the lamp from its hook by the lake door and hangs it again, the way a person touches wood.',
    DC: { History: 10, Insight: 12, wrong: 15, Persuasion: 12, Religion: 13 }
  };
  In.AB = { History: 'int', Insight: 'wis', Persuasion: 'cha', Religion: 'int' };
  In.pinned = null; // (a show's dice, pinned: js/inn.js In.BEATS)
  In.d20 = function () { return In.pinned && In.pinned.length ? In.pinned.shift() : D.roll('1d20').total; };
  In.best = function (st, skill) { var R = DS.R, b = null; st.party.forEach(function (h) { if (h.dead || h.ko) return; var v = R.skill(h, skill, In.AB[skill]); if (!b || v > b.v) b = { h: h, v: v }; }); return b; };
  In.trail = function (s) { if (D.house && D.house.trail) D.house.trail('check', 'THE MEAL: ' + s); };
  // a shown check: the party's best at it rolls, the die in the bubble (the Inn seat's "Vivian: Insight 14 + 4 = 18")
  In.check = function (st, skill, dc, who) {
    var b = who || In.best(st, skill); if (!b) return { ok: false, line: '' };
    var r = In.d20(), tot = r + b.v, nm = b.h.name || b.h.id, ok = tot >= dc;
    In.trail(nm + ' ' + skill + ' ' + r + (b.v >= 0 ? ' + ' : ' - ') + Math.abs(b.v) + ' = ' + tot + ' vs DC ' + dc + (ok ? ', made' : ', missed'));
    return { ok: ok, line: '{y}' + nm + ': ' + skill + ' ' + r + (b.v >= 0 ? ' + ' : ' - ') + Math.abs(b.v) + ' = ' + tot + '{/}' };
  };
  // a silent read: the party's best passive score against the DC, nothing on the screen but what it opens
  In.read = function (st, skill, dc) { var b = In.best(st, skill), p = b ? 10 + b.v : 0, ok = p >= dc; In.trail('passive ' + skill + ' ' + p + ' vs DC ' + dc + (ok ? ', read' : ', not read')); return ok; };
  In.meal = function* (sc, B) {
    var st = sc.st, f = st.flags, d = In.day(D.roam.q), MD = In.MEAL;
    f.mealHad = 1; f.mealDay = d;
    yield sc.say(MD.open);
    var hist = In.check(st, 'History', MD.DC.History), heard = [];
    MD.bands.forEach(function (b) { if (d >= b.day) heard.push(b); });
    for (var i = 0; i < heard.length; i++) {
      var b = heard[i], line = b.who + ': ' + (hist.ok || !b.wrong ? b.ok : b.wrong); f[b.id] = hist.ok || !b.wrong ? 'true' : 'wrong';
      yield sc.say(i === 0 ? [hist.line, line] : [line]);
    }
    if (In.read(st, 'Insight', MD.DC.Insight)) yield sc.say(MD.rich);
    if (In.read(st, 'Insight', MD.DC.wrong)) { f.mealWrong = 1; yield sc.say(MD.wrong); }
    var kat = !f.katGone && (B.units || []).some(function (u) { return u.npc === 'katarina'; }), asked = {};
    for (var k = 0; k < 3; k++) {
      var opts = [], acts = [];
      if (d >= 4 && !asked.drover) { opts.push(MD.drover.label); acts.push('drover'); }
      if (kat && !asked.mirror) { opts.push(MD.mirror.label); acts.push('mirror'); }
      opts.push(MD.bed); acts.push('bed');
      if (acts.length === 1) break;
      var a = acts[yield sc.ask('At the table.', opts)];
      if (a === 'bed' || a == null) break;
      asked[a] = 1;
      if (a === 'drover') { var pe = In.check(st, 'Persuasion', MD.DC.Persuasion); f.heardDrover = pe.ok ? 1 : 0; yield sc.say([pe.line, pe.ok ? MD.drover.ok : MD.drover.no]); }
      if (a === 'mirror') {
        var barley = st.party.filter(function (h) { return (h.key || h.id) === 'barley' && !h.dead && !h.ko; })[0]; // (Barley knows a Dominion mender's glass without a roll: he was one of theirs)
        var re = barley ? { ok: true, line: '{y}Barley knows it on sight.{/}' } : In.check(st, 'Religion', MD.DC.Religion); if (re.ok) f.katMirror = 1;
        yield sc.say([re.line, re.ok ? MD.mirror.ok : MD.mirror.no]);
      }
    }
    yield sc.say(MD.close);
  };

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
    if (!f.mealHad) yield* In.meal(sc, B); // (the first room taken: supper first)
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
    if (!f.dishes && !f.mealWrong) { // (THE MEAL's hard Insight opens her first tier without the dishes: the lane's 11-04 §4)
      var a = yield sc.ask(L('inn.elsbethDishes'), ['HELP WITH THE DISHES', 'LEAVE HER BE']);
      if (a !== 0) return;
    }
    if (!f.dishes) { f.dishes = 1; yield sc.say(L('inn.elsbeth1')); return; }
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
    if (def && def.key === In.KEY && trig.town === 'talk' && (trig.npc === 'gennet' || trig.npc === 'snootRunner')) {
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
    else if (s === 'inn:stair') {
      if (f.katRode && !f.katBookTaken && !In.has(st, 'katbook')) { f.katBookTaken = 1; D.counter.give(st, 'katbook', 1); D.sfx('chest'); say = [L('inn.drawerBook'), L('g.got', { item: DS.DATA.items.katbook.name })]; } // (she rode out with the wagon: the book left in the drawer -- the lane's item 10)
      else say = [In.LINES.stair];
    }
    if (!say.length) return;
    D.sfx('popup'); B.card(D.roam.wrap([].concat.apply([], say)), 320); yield 20;
  };

  // ---------------------------------------------------------------- THE WORLD: the site 'inn' a door (the Pit road through it north and south, the hills west)
  W.DOORS[In.SITE] = { roam: In.KEY, gates: { north: [0, -1], south: [0, 1], west: [-1, 0] } };
  W.APPROACH[In.SITE] = { mi: 4, z: Infinity }; // (down to the area's closest zoom as the party nears, as every door's: js/world.js W.closeZ)

  // ---------------------------------------------------------------- THE HALFWAY INN, shown (deep16/?innshow -- the eyes rows' door): a NEW GAME's four staged on the floor by the beat
  In.BEATS = [
    { id: 'yard', label: 'THE YARD BY DAY, in off the Pit road', note: 'Ten in the morning on the road by the yard: the well, the rail, the stable and its cart, Doran by the woodpile, the boys down at the point. The inn under its roof. Walk to the front door.', key: In.KEY, at: [21, 15], hour: 10 },
    { id: 'door', label: 'THROUGH THE FRONT DOOR: the walls go see-through', note: 'A step short of the front door. One step into the doorway: the roof comes off and every wall drops to a stub -- the whole house seen from above, its people in it. A step back out roofs it again.', key: In.KEY, at: [20, 17], hour: 18 },
    { id: 'room', label: 'THE COMMON ROOM at dusk: the inn lady\'s room and THE MEAL', note: 'Inside at six in the evening, day 2. The inn lady by the hearth (plated THE INN LADY till she gives her name), Doran at the counter, the traveler by the fire, Elsbeth at the kitchen tub. E on the inn lady: a room at five silver a head, then supper at the long table -- the moot, true or heard wrong by your History, shown; then the night.', key: In.KEY, at: [14, 21], hour: 18, day: 2, inside: true, dice: [14, 12, 15] },
    { id: 'meal8', label: 'THE MEAL ON DAY 10: the Snoot moving north', note: 'The same supper eight days later: the moot, the one-eyed chief, the mirror-eyed beasts, the Snoot past the Gulch, the thing three men would not name. A low History die: every word heard wrong. Ask Doran about the drovers (Persuasion, shown), the traveler about her mirror (Religion).', key: In.KEY, at: [14, 21], hour: 18, day: 10, inside: true, dice: [3, 15, 16] },
    { id: 'meal14', label: 'THE MEAL ON DAY 15: the Snoot at the Pit', note: 'Supper on day 15: everything the road has said, and the worst of it -- the Snoot at the Pit, the road south shut. The dice high.', key: In.KEY, at: [14, 21], hour: 18, day: 15, inside: true, dice: [18, 17, 17] },
    { id: 'night', label: 'THE YARD BY NIGHT', note: 'Ten at night by the lake door: the house dark on the yard, lamps at its doors, the lantern post on the point, the lake black. The boys are in.', key: In.KEY, at: [30, 28], hour: 22 },
    { id: 'snoot', label: 'DAY 14: THE SNOOT\'S RUNNER by the well', note: 'The Snoot at the Pit: a runner off the Pit road by the well. E on him: TO THE SNOOT opens the Snoot\'s own page (its BACK TO THE INN comes home), or NOT NOW.', key: In.KEY, at: [13, 11], hour: 10, day: 14 },
    { id: 'world', label: 'THE WORLD AT THE INN: its door', note: 'A NEW GAME on THE WORLD on the inn\'s hex. E: the inn\'s door -- GO IN by the gate the party faces.', world: true, hour: 15 }
  ];
  In.play = function (bt) {
    var H = D.house, R = D.roam, rec = H.fresh(); rec.at = { town: null }; rec.flags = Object.assign({}, bt.flags || {}); rec.silver = Math.max(rec.silver || 0, 60);
    var site = bt.world ? ((W.map && W.index && W.index() && W.map('world')) || { sites: [] }).sites.filter(function (s) { return s.id === In.SITE; })[0] : null;
    H.begin(rec, 0, site ? '?world&at=' + site.hex[0] + ',' + site.hex[1] : null);
    var S = W.state && W.state(); if (S && bt.hour != null) S.t = (bt.day ? (bt.day - 1) * 24 : Math.floor((S.t || 0) / 24) * 24) + bt.hour;
    if (bt.world) return;
    In.pinned = bt.dice ? bt.dice.slice() : null;
    var nb = R.make('?roam=' + bt.key + (bt.inside ? '&inside' : ''), { save: H.living(H.cur), opts: { at8: bt.at.slice() }, house: true });
    D.push(nb);
  };
  In.show = function (q) { return new D.roam.WetShow(q, { kind: 'innshow', beats: In.BEATS, play: In.play, title: '{y}THE HALFWAY INN, 11-04{/} -- one place on the diamonds, the walls see-through inside, THE MEAL (a show)' }); };
})();
