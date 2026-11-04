/* DEEP16 -- THE HALFWAY INN ON THE GRID (11-04, the Inn build seat, started by the lanes desk on Griz's word; ..\handoff-2026-10-30-the-halfway-inn-and-the-lake.md, its
   item 1, re-cut 11-04 on his word). Griz, 11-04, to the desk: "alright, did a story-plot review for the inn, we're ready to start adding it back to the world"; then, relayed:
   "I'd like to try to have the inn exist only as an iso - if we can properly manage the interior interaction (perma transparent walls when party-token inside?)" and "then it
   can build the interior around the dinner scene, make the inn a more proper place than conversion of an 8bit stab"; and "Inn lady needs a name" (Gennet Waterby, the realm's).

   ONE PLACE ON THE DIAMONDS: the seat's own floor (In.ROWS, 50 x 40, north up the screen's right as Web Gulch's), first laid from the realm's drawn battle map
   (TarlynsPit/battle-maps/halfway-inn-battlemap-drawn-2026-08-27.jpg, module-halfway-inn.md §2) and re-laid 11-04 on his note on eyes-halfwayinn-iso-1104: the Pit road
   down the west side, the lake east; the yard with the well, the hitching rail, the barn for six horses, the woodpile; the inn two stories over the token -- the big fire in
   the middle, the common room on the road side of it (the long table across the north wall, the bench by the fire, a table for two, the bar counter under the stair) and the
   kitchen on the other (its hearth the fire's other face, the tub, the fish) -- and a one-story wing past the kitchen, two bedrooms with a small fireplace between them; the
   lake door, the path, the point with its flat stone, its lantern post and the rowboat, and the deep. Upstairs, small rooms over the common room and the big room on the
   kitchen side over the lake. It rides the top levels' floors (js/mines.js M.FLOORS: `own`, `iso`).
   THE WALLS SEE-THROUGH INSIDE (his "perma transparent walls when party-token inside"; RULED 11-04, his "Leans stand": stubs, not a fade): each building (In.BUILDINGS: the
   house and its wing, the barn) is laid two ways by where the token stands. From the yard it stands under its roof, its rooms closed; a step into its doorway lays it again
   with its rooms open, its people standing in them, and every wall cut to a knee-high stub (In.STUB) -- the whole building seen from above for as long as the party is in it,
   and a step out roofs it again (In.lay, js/mines.js M.relay).
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
  // THE BUILDINGS (re-laid 11-04 on his note on eyes-halfwayinn-iso-1104: "When outside, it looks like a one-story building with roofs shorter than the player token avatar"; "There
  // should be a big fire in the center, with the common room on the road side of it and the kitchen on the other ... Two bedrooms with a small fireplace on the other end of the
  // kitchen (a one-story part of the building) - barn big enough to house 6 horses"): each laid open from its own doorway, walls x0 y0 x1 y1 by part, each part its roof
  In.BUILDINGS = {
    inn: { parts: [{ r: [19, 13, 36, 24], roof: 'R' }, { r: [29, 25, 36, 30], roof: 'X' }], walls: 'B' },   // (the house two stories; the wing of two bedrooms one)
    barn: { parts: [{ r: [5, 3, 14, 9], roof: 'Q' }], walls: 'A' }                                           // (the barn: six stalls either side of an aisle)
  };
  In.HOUSE = In.BUILDINGS.inn.parts[0].r; // (the house's main block, for the upstairs over it)
  In.DOORS = { front: [19, 18], lake: [36, 18], barn: [14, 6] }; // (the front door on the yard and the road, the lake door from the kitchen, the barn's on the yard)
  In.STEP = { front: [18, 18, 'left'], lake: [37, 18, 'right'], barn: [15, 6, 'right'] }; // (a step out of each, and the way it faces)
  In.STUB = 1;                // (the walls' height while the party is inside, a roof's own measure: a knee-high stub -- js/iso.js roofCanvas)
  In.ROOFS = { I: { h: 9, roof: 'red', wall: 'stone' }, J: { h: 4.5, roof: 'red', wall: 'stone' }, Z: { h: 6, roof: 'stone', wall: 'leather' } }; // (the house two stories over the token, the wing one, the barn a high single; js/iso.js roofPx)
  In.inHouse = function (x, y) { // (the building a square is in, or null)
    var ids = Object.keys(In.BUILDINGS);
    for (var i = 0; i < ids.length; i++) if (In.BUILDINGS[ids[i]].parts.some(function (p) { return x >= p.r[0] && x <= p.r[2] && y >= p.r[1] && y <= p.r[3]; })) return ids[i];
    return null;
  };
  In.roofAt = function (b, x, y) { var ps = In.BUILDINGS[b].parts; for (var i = ps.length - 1; i >= 0; i--) { var r = ps[i].r; if (x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3] && (i === 0 || y > ps[0].r[3])) return ps[i].roof; } return ps[0].roof; };

  // ---------------------------------------------------------------- the floor (the seat's, laid from the realm's battle map; re-laid 11-04 on his "it feels like the road should
  // be running the same way the gulch does over on the left side of the screen instead of the top"): 50 x 40, north up the screen's right as the Gulch's -- the Pit road down
  // the west side (north to the Gulch, south to the Pit), the yard and the barn, the inn, the grass and the path to the point, the lake east
  In.ROWS = [
    ',,,"""""""""t""""""""""""""""""""""""""""""nWWWWWW', ',,,".............."""""""""""""""""""""""""nWWWWWW',
    ',,,................""""""""""""""""""""""""eWWWWWW', ',,,..AAAAAAAAAA....""""""""""""""""""""""""eWWWWWW',
    ',,,..Awo|wo|woA...."""t""""""""""""""""""""eWWWWWW', ',,,..Aoo|oo|ooA...."""""""""""t""""""""""""eWWWWWW',
    ',,,..AooooooooD...."""""""""""""""""""t""""eWWWWWW', ',,,..Aoo|oo|ooA....""""""""""""""""""""""""eWWWWWW',
    ',,,..Awo|wo|woA....""""""""""""""""""""""""eWWWWWW', ',,,..AAAAAAAAAA....""""""t"""""""""""""""""eWWWWWW',
    ',,,................"""""""""""""""t""""""""nWWYYYY', ',,,................""""""""""""""""""""""""nWWYYYY',
    ',,,..||||.........."""""""""""""""""""""t""nWWYYYY', ',,,................BBBBBBBBBBBBBBBBBB""""""nWYYYYY',
    ',,,................BcKKKKKKcoooHHHHoB""""""nWYYYYY', ',,,........q.......BooooooooooooooooB"""""lnWWYYYY',
    ',,,................BooooooooooooKKooB"""""rrrrYYYY', ',,,................BooooooooCCooooooB"""""rrrrYYYY',
    ',,,................DooooobohCChoooooD,,,,,rrirYYYY', ',,,................BooooobohCChoooooB"""""rrirYYYY',
    ',,,................BoomKmoooCCooooooB"""""rrrrYYYY', ',,,................BooooooooooooooToB"""""rrrrYYYY',
    ',,,................BoKKKKoooooooooooB""""""nWpYYYY', ',,,................BuSSSSSooooooooocB""""""nWWYYYY',
    ',,,................BBBBBBBBBBBBoBBoBB""""""nWYYYYY', ',,,................""""""""""BoocBooB""t"""nWYYYYY',
    ',,,..............kk""""""""""BoooBooB""""""nWWYYYY', ',,,..............kk"""""t""""BooofooB""""""eWWYYYY',
    ',,,................"t""""""""BoooBooB""""""eWWYYYY', ',,,................""""""""""BzooBozB""""""eWWWWWW',
    ',,,................""""""""""BBBBBBBB""""""eWWWWWW', ',,,................"""""""""""""""""""""t""eWWWWWW',
    ',,,................""""""""""""""""""""""""eWWWWWW', ',,,................""t"""""""""""""""""""""eWWWWWW',
    ',,,................""""""""""""""""t"""""""eWWWWWW', ',,,................""""""""t"""""""""""""""eWWWWWW',
    ',,,................""""""""""""""""""""""""eWWWWWW', ',,,................""""""""""""""""""""""""nWWWWWW',
    ',,,".............."""""""""""""""""""""""""nWWWWWW', ',,,"""""t"""""""t""""""""""""""""""""""""""nWWWWWW'
  ];
  In.LEGEND = { '"': 'grassT', '.': 'earth', ',': 'road', t: 'tree', q: 'well', '|': 'fence', k: 'woodpile', w: 'manger', c: 'crate', B: 'innWall', A: 'barnWall', o: 'floorWood',
    D: 'doorway', K: 'table', b: 'bench', m: 'chair', C: 'chimney', H: 'shelf', z: 'bed', h: 'firepit', f: 'firepit', u: 'stairsUp', T: 'tub', n: 'sand', i: 'flatstone', r: 'rocks',
    l: 'lamp', e: 'reeds', W: 'water', Y: 'deep', p: 'boat', R: 'innRoof', X: 'wingRoof', Q: 'barnRoof', S: 'stairRun' };
  // the names the top levels' floors had not needed, as the grid's squares (js/mines.js M.LAY; a roof by M.ROOF)
  Object.assign(M.LAY, { grassT: ['g'], earth: ['.'], woodpile: ['k'], manger: ['k'], floorWood: ['o'], doorway: ['d'], table: ['K'], bench: ['K'], chair: ['k'], shelf: ['S'], bed: ['y'],
    tub: ['w'], sand: ['.'], flatstone: ['.'], rocks: ['r'], boat: ['k'], stairRun: ['o'] }); // (the stair's run: walked as the floor till art-wanted section 36's stair comes back)
  Object.assign(M.ROOF, { innRoof: 'I', wingRoof: 'J', barnRoof: 'Z', innWall: 'v', barnWall: 'v' });
  // where the people stand, by the hour and the floor's flags (the first game's conditions): the yard's by day, the house's inside it -- seen while the party is in
  In.FOLK = [
    { id: 'doranYard', at: [16, 26], look: 'worker', dir: 'right', cond: '!flag:doranAway', when: 'day', out: true },   // (by the woodpile)
    { id: 'orrin', at: [43, 20], look: 'kid', dir: 'right', cond: '!flag:dueSeen', when: 'light', out: true },           // (the stone stack at the point)
    { id: 'pell', at: [43, 24], look: 'kid', dir: 'right', cond: '!flag:dueSeen', when: 'light', out: true },            // (skimming stones off the shore)
    { id: 'adoptedKid', at: [43, 12], look: 'girl', dir: 'right', cond: 'flag:kidAtInn & !flag:dueSeen', when: 'light', out: true },
    { id: 'doranIn', at: [24, 23], look: 'worker', dir: 'up', cond: '!flag:doranAway', when: 'evening' },                // (behind the bar, under the stair's high end, where the headroom is)
    { id: 'gennet', at: [24, 16], look: 'innlady', dir: 'down', cond: '!flag:lakeDone' },
    { id: 'gennetGrief', at: [21, 18], look: 'innlady', dir: 'down', cond: 'flag:lakeDone' },
    { id: 'elsbeth', at: [33, 21], look: 'elsbeth', dir: 'right', cond: '!flag:postgame' },                              // (at the tub, her back to the room)
    { id: 'katarina', at: [26, 20], look: 'kat', dir: 'right', cond: '!flag:katGone' }                                   // (writing by the fire)
  ];
  In.RUNNER = [12, 16];       // (the Snoot's runner by the well)
  In.WAGONAT = [8, 18];       // (THE WAGON NIGHT: the wagon pulled in on the yard's ring, its cover three squares and its open bed at the tail, two rows)
  In.YARDFOLK = [
    { id: 'amaraYard', at: [7, 18], look: 'amara', dir: 'right' }, { id: 'willemYard', at: [7, 19], look: 'willem', dir: 'right' },
    { id: 'wagonGoblin', at: [12, 19], look: 'goblin', dir: 'left' }, { id: 'gennetYard', at: [17, 18], look: 'innlady', dir: 'left' }, { id: 'katYard', at: [17, 20], look: 'kat', dir: 'left' }
  ];
  Object.assign(M.LAY, { wagon: ['W'], wagonBed: ['V'] });
  In.KINDS = { doranYard: 'commoner', doranIn: 'commoner', gennet: 'commonerwoman', gennetGrief: 'commonerwoman', elsbeth: 'commonerwoman', katarina: 'commonerwoman',
    orrin: 'commonerchild', pell: 'commonerchild', adoptedKid: 'commonerchild', snootRunner: 'commoner',
    amaraYard: 'amara', willemYard: 'willem', wagonGoblin: 'goblin', gennetYard: 'commonerwoman', katYard: 'commonerwoman' }; // (the townsfolk's figures till the art desk's come back: deep16-art-wanted.md §35)
  In.when = function (w, h) { var tod = W.todAt ? W.todAt(h) : (M.night(h) ? 'night' : 'day'); return !w || (w === 'day' ? h >= 7 && h < 17 : w === 'evening' ? !(h >= 7 && h < 17) : w === 'light' ? tod !== 'night' : true); };
  In.named = function (f) { return f && f.gennetNamed ? 'Gennet Waterby' : 'The inn lady'; };
  In.NAME = { gennet: In.named, gennetGrief: In.named, gennetYard: In.named, snootRunner: function () { return 'A runner from the Pit'; },
    amaraYard: function () { return 'Amara'; }, willemYard: function () { return 'Willem Glass'; }, katYard: function () { return 'A traveler'; },
    wagonGoblin: function (f) { return f.glamourSeen ? 'A child, chained' : 'A goblin, chained'; } };
  In.LINES = {
    arrive: ['The Halfway Inn: the only well on the Pit road, a long day and a half from either end. A long low stone house between the road and the water.',
      'Halfway Lake is older than the inn and named it. Knee-shallow forty paces out; then, off the point, it goes.'],
    hello: 'The Pit road runs down the west side, the lake to the east; the yard and the barn between, the inn\'s front door on the yard and its lake door on the path to the point. Any edge: back to the world map.',
    inside: 'Inside the Halfway Inn: the common room round the big fire, the bar under the stair, the kitchen beyond the fire, two bedrooms off the kitchen.',
    barn: 'The barn: six stalls either side of the aisle, mangers at their heads.',
    name: '"Gennet. Waterby, since the wedding. The lake\'s older than either."',
    bed: 'A room under the eaves. Nobody stands a watch at the Halfway Inn: the house keeps its own door.',
    morning: 'Morning on Halfway Lake: mist off the water, the well\'s chain, the boys already down at the shore.',
    night: 'Night at the Halfway Inn. The lamps are lit in the common room; past the point the lake is black.',
    day: 'Morning comes up over Halfway Lake.',
    runner: ['A runner off the Pit road, mud to the knee, drinking at the well like he means to empty it.',
      '"The Snoot\'s come down on the Pit -- the whole of it, gnolls past counting. The Pit\'s asking for every blade on the road. South, if you\'re going."'],
    runnerAsk: 'THE SNOOT is a page of its own: the war on the hexes round the Pit. What is not saved here stays behind.',
    stair: 'The stair up to the guest rooms. The room over the kitchen has its door shut.',
    upstairs: 'Upstairs: three small guest rooms over the common room, and the big room on the kitchen side with the lake under its window. The stair down is in the passage.',
    drawerShut: 'The room over the kitchen: two nights paid, a farm woman\'s things folded on the chair. The drawer by the bed is shut, and you leave it shut.',
    drawerEmpty: 'The drawer by the bed is empty.'
  };
  In.line = function (h) { return M.night(h) ? In.LINES.night : In.LINES.day; };
  // the house's day (THE WORLD's clock), or a test door's &day=
  In.day = function (q) { // (a test door's &day= holds across its floors -- up the stair and down -- till another door names one; the house's own clock always wins)
    var m = /[?&]day=(\d+)/.exec(q || ''); if (m) return (In.testDay = +m[1]);
    var S = W.state && W.state(), house = D.house && D.house.playing; if (house && S && S.t != null) return Math.floor(S.t / 24) + 1;
    if (In.testDay) return In.testDay; return S && S.t != null ? Math.floor(S.t / 24) + 1 : 1;
  };
  In.INDOORS = { doranYard: 1, orrin: 1, pell: 1, adoptedKid: 1 }; // (the yard's own, in while the wagon stands in the yard)
  In.snootOn = function (q) { return In.day(q) >= In.SNOOT_DAY; };
  // THE WAGON ON THE CALENDAR (the lane's 11-04 §3, RULED 11-04, his "in on your above leans as well": the first WAGON DAY 6, then every 28 -- his numbers to move):
  // Amara's wagon reaches the inn at dusk on a WAGON DAY; a room taken that evening is THE WAGON NIGHT (In.wagonNight). Katarina is at the inn the day before and the
  // day of the first (Marek paid two nights and walked north); after it she has ridden out with the wagon or walked south, her book in the drawer unless she gave it
  In.WAGON = { first: 6, every: 28 };
  In.isWagonDay = function (d) { return d >= In.WAGON.first && (d - In.WAGON.first) % In.WAGON.every === 0; };
  In.cycle = function (d) { return Math.floor((d - In.WAGON.first) / In.WAGON.every); };
  In.wagonTonight = function (f, d) { return In.isWagonDay(d) && f.wagonCycle !== In.cycle(d); };
  In.katHere = function (f, d) { return !f.katGone && !f.katRode && d >= In.WAGON.first - 1 && d <= In.WAGON.first; };
  In.bookInDrawer = function (f, d, st) { return !f.katBookTaken && !f.katGave && !(st && In.has(st, 'katbook')) && (!!f.katRode || d > In.WAGON.first); };
  In.q = ''; In.inside = false;

  // the floor in the first game's shape (js/mines.js M.floor reads it): the inn laid open or roofed, the people by the hour, the squares' words
  In.map = function (hour, flags) {
    var inside = In.inside || null, rows = In.ROWS.map(function (r, y) { // (every building roofed but the one the party is in, and its doorways open)
      return r.split('').map(function (c, x) { var b = In.inHouse(x, y); return b && b !== inside && c !== 'D' ? In.roofAt(b, x, y) : c; }).join('');
    });
    var dd = In.day(In.q), npcs = In.FOLK.filter(function (p) { return (inside === 'inn' || p.out) && In.when(p.when, hour) && (p.id !== 'katarina' || In.katHere(flags || {}, dd)) && !(flags && flags.wagonIn && In.INDOORS[p.id]); }).map(function (p) { return { id: p.id, x: p.at[0], y: p.at[1], look: p.look, dir: p.dir, cond: p.cond }; });
    if (flags && flags.wagonIn) { // (THE WAGON NIGHT staged in the yard: the wagon pulled in, the pair by its team, the one at its tail, the inn lady with her lantern, the traveler come down)
      rows = rows.map(function (r, y) { var w = In.WAGONAT; if (y < w[1] || y > w[1] + 1) return r; return r.split('').map(function (c, x) { return x >= w[0] && x < w[0] + 3 ? 'U' : x === w[0] + 3 ? 'V' : c; }).join(''); });
      // (the yard's people -- the pair, the one at the tail, the inn lady with her lantern, the traveler -- are stood and moved by the night's script, In.wagonNight: In.YARDFOLK keeps their squares)
    }
    if (In.snootOn(In.q)) npcs.push({ id: 'snootRunner', x: In.RUNNER[0], y: In.RUNNER[1], look: 'worker', dir: 'down' });
    var trig = [{ id: 'flatstone', rect: [44, 18, 1, 2], on: 'step', script: 'inn:pointStep' }, { id: 'thedeep', rect: [46, 10, 4, 19], on: 'use', script: 'inn:point' },
      { id: 'lanternpost', rect: [42, 15, 1, 1], on: 'use', script: 'inn:sign', text: 'A lantern post by the flat stone. Nobody swims here. Nobody draws from the lake. The well is for that.' }];
    if (inside === 'inn') trig.push({ id: 'stair', rect: [In.STAIR[0], In.STAIR[1], 1, 1], on: 'step', script: 'inn:stair' });
    var lights = inside === 'inn' ? In.FIRES.map(function (q, i) { return { id: 'hearth' + i, kind: 'map', x: q[0], y: q[1], bright: 10, dim: 10, color: 'fire', flame: true, seep: true }; }) : null;
    return { id: 'halfway', name: 'The Halfway Inn', rows: rows, legend: Object.assign({ U: 'wagon', V: 'wagonBed' }, In.LEGEND), music: inside === 'inn' ? 'inn' : 'lake', exits: { north: 1, south: 1, east: 1, west: 1 }, dark: false,
      lights: lights, npcs: npcs, triggers: trig, chests: [] };
  };
  In.STAIR = [20, 23];        // (the stair's foot, at the bar's west end; its run S rises east along the south wall to its head at 25,23 by the fire -- 11-04, Griz at the pane: "move the stairs to ascend from 20, 23 toward 25, 23 (such that headroom behind the bar is nearer the fire)"; the barman stands under its high end)
  In.FIRES = [[27, 18], [27, 19], [30, 18], [30, 19], [33, 27]]; // (the big fire's two faces, the common room's and the kitchen's, and the small one between the two bedrooms)
  M.FLOORS[In.KEY] = { src: 'halfway', own: true, map: In.map, door: In.SITE, place: 'The Halfway Inn', sub: 'the yard and the shore', save: true, out: 'world', outdoors: true,
    clock: true, edges: true, iso: true, rate: In.RATE, phase: M.seepPhase, phaseLine: In.line,
    gates: { north: [1, 1, [0, 1]], south: [1, 38, [0, -1]], west: [1, 20, [1, 0]] } }; // (the Pit road in at its north end and its south, and off the hills over it)
  In.qInside = function (q) { var a = /[?&]at=(\d+),(\d+)/.exec(q || ''); return /[?&]inside\b/.test(q || '') ? 'inn' : a ? In.inHouse(+a[1], +a[2]) : null; };
  // UPSTAIRS (the module's N, the battle map's inset; the lanes desk's reading of his iso-only word, "the yard, the common room and the rooms upstairs are all on the iso
  // grid"; re-laid 11-04 on his note, "One big room on the kitchen side of the fire (overlooking the lake ...) and small rooms over the common room"): its own small floor on
  // the diamonds over the house's main block, its walls stubs -- three small guest rooms over the common room, the big room on the kitchen side (Katarina's, the drawer by
  // the bed), the big fire's chimney rising through the middle, the passage and the stair head over the bar
  In.UP = 'halfway_up';
  In.UPROWS = [
    'BBBBBBBBBBBBBBBBBB',
    'BzoBzoBzoccBoooozB',
    'BooBooBooccBooooKB',
    'BooBooBooBBBoooooB',
    'BooBooBooCCBoooooB',
    'BBoBBoBBoCCBoooooB',
    'BooooooooCCBoooooB',
    'BooooooooCCBoooooB',
    'BooooooooooooooooB',
    'BooooooooooBoooooB',
    'BoooooDooooBoooooB',
    'BBBBBBBBBBBBBBBBBB'
  ];
  In.UPSTAIR = [6, 10]; In.DRAWER = [16, 2]; // (the stair head in the passage, over the top of the bar's stair (25,23); the bedside table in the big room; the big room's door off the passage at 11,8)
  In.upMap = function () {
    return { id: In.UP, name: 'The Halfway Inn', rows: In.UPROWS.slice(), legend: { B: 'innWall', o: 'floorWood', z: 'bed', K: 'table', c: 'crate', C: 'chimney', D: 'stairsDown' }, music: 'inn', exits: {}, dark: false, npcs: [],
      triggers: [{ id: 'stairdown', rect: [In.UPSTAIR[0], In.UPSTAIR[1], 1, 1], on: 'step', script: 'inn:down' }, { id: 'drawer', rect: [In.DRAWER[0], In.DRAWER[1], 1, 1], on: 'use', script: 'inn:drawer' }], chests: [] };
  };
  M.FLOORS[In.UP] = { src: In.UP, own: true, map: In.upMap, door: In.SITE, place: 'The Halfway Inn', sub: 'upstairs: the guest rooms', save: true, clock: true, iso: true, rate: In.RATE, phase: M.seepPhase, phaseLine: In.line,
    gates: { stair: [In.UPSTAIR[0], In.UPSTAIR[1] - 1, [0, -1]] } }; // (in at the stair head whatever the door: a floor laid with no square of its own to stand on had no entry -- the house's show, 11-04)
  var floor0 = M.floor;
  M.floor = function (key, q, flags, hour) {
    if (key === In.UP) {
      var du = floor0.apply(this, arguments);
      du.roofs = Object.assign({}, du.roofs, { v: { h: In.STUB, roof: 'leather', wall: 'stone' } }); du.hud = 'the Halfway Inn';
      du.hello = ['{y}THE HALFWAY INN{/} -- upstairs, on the grid\'s diamonds (' + du.w + ' x ' + du.h + ' squares).', In.LINES.upstairs, '{g}Click to walk, or the arrows. E: a word, a door. O: the formation. L: the floor map.{/}'];
      return du;
    }
    if (key !== In.KEY) return floor0.apply(this, arguments);
    In.inside = In.state !== undefined ? In.state : In.qInside(q); In.q = q || '';
    var h = hour != null ? hour : M.hourNow(q), def = floor0.call(this, key, q, flags, h); flags = flags || {};
    def.inside = In.inside || null; def.sub = In.inside === 'inn' ? 'the common room and the rooms' : In.inside === 'barn' ? 'the barn' : 'the yard and the shore'; def.hud = 'the Halfway Inn'; def.where = function () { return def.sub; }; // (the HUD's place line by the lay, not the floor's one sub)
    def.roofs = Object.assign({}, def.roofs, In.ROOFS, { v: { h: In.STUB, roof: 'leather', wall: 'stone' } }); // (the house two stories from the yard, the wing and the barn their own; the walls cut low while the party is in)
    def.people.forEach(function (p) { if (In.KINDS[p.id]) p.kind = In.KINDS[p.id]; if (p.id === 'wagonGoblin' && flags.glamourSeen) p.kind = 'commonerchild'; }); // (the chained one a child once the glamour is seen through)
    def.skyLights = (def.skyLights || []).concat(['front', 'lake', 'barn'].map(function (k) { var q2 = In.STEP[k]; return { x: q2[0], y: q2[1], door: k === 'barn' ? 'barn' : 'inn' }; }), In.inside === 'inn' ? [[26, 18], [31, 18], [24, 15], [23, 21], [33, 26]].map(function (q2) { return { x: q2[0], y: q2[1], door: 'hearth' }; }) : []); // (a lamp over each door; inside, the fires and the lamps on the tables -- the night's pools, js/mines.js M.paintSky)
    var first = !flags.reachedInn; flags.reachedInn = 1;
    def.hello = ['{y}THE HALFWAY INN{/} -- ' + def.sub + ', on the grid\'s diamonds (' + def.w + ' x ' + def.h + ' squares), ' + (W.todAt ? W.todAt(h) : '') + '.']
      .concat(first ? In.LINES.arrive : [], [In.inside === 'inn' ? In.LINES.inside : In.inside === 'barn' ? In.LINES.barn : In.LINES.hello, '{g}Click to walk, or the arrows. E: a word, a door. O: the formation. L: the floor map.{/}']);
    return def;
  };
  // a floor laid again (the hour's phase, or a building opened or roofed): the buildings as they stood unless In.lay says otherwise
  var relay0 = M.relay;
  M.relay = function (B, hour, restand) {
    var keep = In.relaying !== undefined ? In.relaying : D.roam.def && D.roam.def.key === In.KEY ? D.roam.def.inside || null : undefined;
    In.state = keep; try { relay0.apply(this, arguments); } finally { In.state = undefined; }
  };
  // a step into a doorway or out of a building: that building laid open or roofed under the party, on the same square
  In.lay = function (B, inside, quiet) {
    In.relaying = inside || null; try { M.relay(B, null, true); } finally { In.relaying = undefined; }
    var t = B.roam.token; t.tween = null; B.roam.path = null; D.grid.setup(B.map, B.units); B.focus(t); B.cache = null; B.map.occKey = null; if (In.teamBlock) In.teamBlock(B);
    if (inside && !quiet) B.card(D.roam.wrap(['{y}' + (inside === 'barn' ? 'The barn' : 'The Halfway Inn') + '{/} -- ' + (inside === 'barn' ? In.LINES.barn : In.LINES.inside)]), 200);
  };
  var arrive0 = D.roam.arrive;
  D.roam.arrive = function* (B) {
    var ev = yield* arrive0.apply(this, arguments), def = D.roam.def, t = B.roam && B.roam.token, b = t ? In.inHouse(t.x, t.y) : null;
    if (!ev && def && def.key === In.KEY && t && D.battle === B && b !== (def.inside || null)) In.lay(B, b);
    if (!ev && def && def.key === In.KEY && t && D.battle === B && B.roam.flags && B.roam.flags.wagonBrought && !B.roam.flags.wagonDelivered) yield* In.wagonIn(B); // (the wagon in off the road: js/wagon.js)
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
  // a SAVE in a building stands the party a step out of its door, as a room's on Silverton's street (js/house.js H.atOf): the house's and upstairs the front door's, the barn's its own
  var atOf0 = D.house && D.house.atOf;
  if (atOf0) D.house.atOf = function (B) {
    var def = D.roam.def, t = B && B.roam && B.roam.token, b = def && t && def.key === In.KEY ? In.inHouse(t.x, t.y) : null, st = def && def.key === In.UP ? In.STEP.front : b ? In.STEP[b === 'barn' ? 'barn' : 'front'] : null;
    if (st) return { town: In.SITE, gate: 'west', sq: [st[0], st[1]], dir: st[2] };
    return atOf0.apply(this, arguments);
  };

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
    more: '"Eat. Ask what you like; the whole road comes through this door."',
    close: 'The fire is let down. Gennet takes the lamp from its hook by the lake door and hangs it again, the way a person touches wood.',
    DC: { History: 10, Insight: 12, wrong: 15, Persuasion: 12, Religion: 13 }
  };
  In.AB = { History: 'int', Insight: 'wis', Persuasion: 'cha', Religion: 'int' };
  In.pinned = null; // (a show's dice, pinned: js/inn.js In.BEATS)
  // THE MEAL'S TABLE (11-04, the lanes desk; Griz at the pane: "Have the dinner reworked. It's returned to the default solid blue background and boxes. The council scene and
  // lymen/papa conversations look better", then "it's showing me 'doran' talking with the inn lady picture and aurdin's rolls in the main box" and "we want to show the main
  // room with people seated for dinner, and maybe decide what side the portrait shows while they're talking based on what side they're on in the background"): supper plays
  // on the open screen (js/counter.js THE OPEN SCREEN, its sides) over the common room as the camera has it -- the Waterbys and the party sat along the long table's open
  // side, the traveler at the table for two -- the one speaking top left or top right by their seat, the hero whose die it was bottom on theirs with the die in their bubble
  In.TABLE = { seats: [[22, 15], [23, 15], [25, 15], [26, 15]], doran: [21, 15], gennet: [24, 15], kat: [22, 20], focus: [20, 13], mid: 23.5 }; // (the four's places at the long table, the host at its west end, the inn lady in the middle; the camera north-west of the table so the table sits in the screen's lower half, under the words' boxes)
  In.sideOf = function (x) { return x <= In.TABLE.mid ? 'left' : 'right'; };
  In.sit = function (B) { // (everyone to the table; what to put back after)
    var R0 = B.roam, G = D.grid, kept = [], put = function (u, q, face) { if (!u) return; kept.push({ u: u, x: u.x, y: u.y, facing: u.facing }); u.x = q[0]; u.y = q[1]; u.tween = null; u.facing = D.spr.facingFor(face[0], face[1]); u.anim = 'idle'; u.animT = B.t; };
    var folk = {}; B.units.forEach(function (u) { if (typeof u.npc === 'string') folk[u.npc] = u; }); folk.gennet = folk.gennet || folk.gennetGrief;
    var four = [R0.token].concat(R0.rest || []).filter(function (u) { return u && u.src && !u.src.guest && u.hp > 0; }).slice(0, 4);
    four.forEach(function (u, i) { put(u, In.TABLE.seats[i], [0, -1]); });
    put(folk.doranIn, In.TABLE.doran, [1, 0]); put(folk.gennet, In.TABLE.gennet, [0, 1]); put(folk.katarina, In.TABLE.kat, [1, 0]);
    var added = four.filter(function (u) { return B.units.indexOf(u) < 0; }); B.units = B.units.concat(added); // (the three who walk inside the token on a roam stand at their seats for the picture -- js/roam.js R.riding)
    R0.path = null; G.setup(B.map, B.units); B.focus({ x: In.TABLE.focus[0], y: In.TABLE.focus[1], size: 1 });
    return { four: four, folk: folk, kept: kept, added: added };
  };
  In.rise = function (B, seat) { seat.kept.forEach(function (k) { k.u.x = k.x; k.u.y = k.y; k.u.facing = k.facing; k.u.tween = null; }); B.units = B.units.filter(function (u) { return seat.added.indexOf(u) < 0; }); D.grid.setup(B.map, B.units); B.focus(B.roam.token); };
  In.roomShot = function (B) { // (the common room as the camera has it, live under the screen and dimmed -- js/hours.js H16.streetShot's way)
    return function (ctx, x, y, w, h, behind) {
      if (behind || !D.ui || !D.ui.drawBattle) return false;
      var cards0 = B.cards; B.cards = [];
      ctx.save(); try { D.ui.drawBattle(ctx, B); } catch (e) { ctx.restore(); B.cards = cards0; return false; } ctx.restore(); B.cards = cards0;
      ctx.fillStyle = (D.hours && D.hours.SHOT && D.hours.SHOT.dim) || 'rgba(8,10,28,0.2)'; ctx.fillRect(0, 0, D.W, D.H); return true;
    };
  };
  In.heroOf = function (u) { var k = u.src ? (u.src.key || u.src.id) : u.id; return { id: k, key: k, name: u.name }; };
  In.unitOf = function (seat, h) { return h ? seat.four.filter(function (u) { return u.src === h || (u.src && (u.src.key || u.src.id) === (h.key || h.id)); })[0] : null; };
  In.speaker = function (seat, id) { var u = seat.folk[id]; return { name: id === 'doranIn' ? 'Doran' : id === 'gennet' ? In.named(seat.flags) : 'The traveler', unit: u || null, side: u ? In.sideOf(u.x) : 'right' }; };
  In.mealScene = function* (B) { // (the first room taken: supper on the open screen over the room, then the bed)
    var C = D.counter, seat = In.sit(B), st = C.state(B); seat.flags = st.flags;
    if (D.house && D.house.trail) D.house.trail('talk', 'meal');
    var sc = new C.Counter(B, { id: 'meal', name: 'The Waterbys', place: 'The Halfway Inn', what: 'supper at the long table', room: true, open: true, bg: In.roomShot(B), script: function (s) { return In.meal(s, B, seat); } });
    D.push(sc); while (!sc.done) yield 1;
    In.rise(B, seat);
  };
  In.d20 = function () { return In.pinned && In.pinned.length ? In.pinned.shift() : D.roll('1d20').total; };
  In.best = function (st, skill) { var R = DS.R, b = null; st.party.forEach(function (h) { if (h.dead || h.ko) return; var v = R.skill(h, skill, In.AB[skill]); if (!b || v > b.v) b = { h: h, v: v }; }); return b; };
  In.trail = function (s) { if (D.house && D.house.trail) D.house.trail('check', 'THE MEAL: ' + s); };
  // a shown check: the party's best at it rolls, the die in the bubble (the Inn seat's "Vivian: Insight 14 + 4 = 18")
  In.check = function (st, skill, dc, who) {
    var b = who || In.best(st, skill); if (!b) return { ok: false, line: '' };
    var r = In.d20(), tot = r + b.v, nm = b.h.name || b.h.id, ok = tot >= dc;
    In.trail(nm + ' ' + skill + ' ' + r + (b.v >= 0 ? ' + ' : ' - ') + Math.abs(b.v) + ' = ' + tot + ' vs DC ' + dc + (ok ? ', made' : ', missed'));
    return { ok: ok, line: '{y}' + nm + ': ' + skill + ' ' + r + (b.v >= 0 ? ' + ' : ' - ') + Math.abs(b.v) + ' = ' + tot + '{/}', h: b.h };
  };
  // a silent read: the party's best passive score against the DC, nothing on the screen but what it opens
  In.read = function (st, skill, dc) { var b = In.best(st, skill), p = b ? 10 + b.v : 0, ok = p >= dc; In.trail('passive ' + skill + ' ' + p + ' vs DC ' + dc + (ok ? ', read' : ', not read')); return ok; };
  In.meal = function* (sc, B, seat) {
    var st = sc.st, f = st.flags, d = In.day(D.roam.q), MD = In.MEAL, who = function (id) { return In.speaker(seat, id); }, lead = seat.four[0] || null;
    var roll = function (chk) { var u = In.unitOf(seat, chk.h) || lead; if (!u) return; sc.hero = In.heroOf(u); sc.heroSide = In.sideOf(u.x); sc.echo = chk.line ? [chk.line] : null; }; // (the die in the bubble of the one who rolled, on their side)
    var quiet = function () { sc.hero = lead ? In.heroOf(lead) : null; sc.heroSide = lead ? In.sideOf(lead.x) : 'left'; sc.echo = null; };
    f.mealHad = 1; f.mealDay = d;
    yield sc.narr([MD.open]);
    var hist = In.check(st, 'History', MD.DC.History), heard = [];
    MD.bands.forEach(function (b) { if (d >= b.day) heard.push(b); });
    for (var i = 0; i < heard.length; i++) {
      var b = heard[i], line = hist.ok || !b.wrong ? b.ok : b.wrong; f[b.id] = hist.ok || !b.wrong ? 'true' : 'wrong';
      if (i === 0) roll(hist); else quiet();
      yield sc.by(who(b.who === 'Doran' ? 'doranIn' : 'gennet'), [line]);
    }
    quiet();
    if (In.read(st, 'Insight', MD.DC.Insight)) yield sc.narr([MD.rich]);
    if (In.read(st, 'Insight', MD.DC.wrong)) { f.mealWrong = 1; yield sc.narr([MD.wrong]); }
    var kat = !f.katGone && !!seat.folk.katarina, asked = {};
    for (var k = 0; k < 3; k++) {
      var opts = [], acts = [];
      if (d >= 4 && !asked.drover) { opts.push(MD.drover.label); acts.push('drover'); }
      if (kat && !asked.mirror) { opts.push(MD.mirror.label); acts.push('mirror'); }
      opts.push(MD.bed); acts.push('bed');
      if (acts.length === 1) break;
      quiet(); var a = acts[yield sc.askBy(who('gennet'), [MD.more], opts)];
      if (a === 'bed' || a == null) break;
      asked[a] = 1;
      if (a === 'drover') { var pe = In.check(st, 'Persuasion', MD.DC.Persuasion); f.heardDrover = pe.ok ? 1 : 0; roll(pe); yield sc.by(who('doranIn'), [pe.ok ? MD.drover.ok : MD.drover.no]); }
      if (a === 'mirror') {
        var barley = st.party.filter(function (h) { return (h.key || h.id) === 'barley' && !h.dead && !h.ko; })[0]; // (Barley knows a Dominion mender's glass without a roll: he was one of theirs)
        var re = barley ? { ok: true, line: '{y}Barley knows it on sight.{/}', h: barley } : In.check(st, 'Religion', MD.DC.Religion); if (re.ok) f.katMirror = 1;
        roll(re); yield sc.by(who('katarina'), [re.ok ? MD.mirror.ok : MD.mirror.no]);
      }
    }
    sc.hero = null; sc.echo = null;
    yield sc.narr([MD.close, In.LINES.bed]);
  };

  // ---------------------------------------------------------------- the people: the inn lady's room, Elsbeth at the tub (the first game's S.gennet, S.elsbeth on the counter screen)
  In.has = function (st, id) { return D.counter.count(st, id) > 0 || st.party.some(function (h) { return h.equip && Object.keys(h.equip).some(function (s) { return h.equip[s] === id; }); }); };
  In.heads = function (B) { return ((B.roam && B.roam.members) || []).filter(function (u) { return u.src && !u.src.guest; }).length || 1; };
  In.gennet = function* (sc, B) {
    var st = sc.st, f = st.flags, cost = In.PRICE * In.heads(B);
    var d = In.day(D.roam.q), soon = !In.isWagonDay(d) && f.wagonCycle == null && !f.wagonNamed ? [In.WN.soon] : []; // (any other night: the month's wagon named without being named -- the lane's 11-04 §3 (d))
    if (soon.length) f.wagonNamed = 1;
    if (!f.gennetNamed) { f.gennetNamed = 1; yield sc.say([].concat(M.words(B, 'gennet'), [In.LINES.name], soon)); }
    else yield sc.say([].concat(M.words(B, 'gennet'), soon));
    var a = yield sc.ask(L('inn.stayAsk', { n: cost }), ['STAY THE NIGHT', 'NO']);
    if (a !== 0) return false;
    if (st.silver() < cost) { D.sfx('error'); yield sc.say(L('g.poor')); return false; }
    st.silver(-cost); D.sfx('coin');
    if (f.mealHad) { yield sc.say(In.LINES.bed); return 'bed'; }
    return 'meal'; // (the first room taken: supper first, on its own screen over the room -- In.mealScene, then the bed line there)
  };
  // the night: the house's bed to the morning (the first night's wagon is the lane's item 2), the floor laid at the morning's hour under the morning card
  In.sleep = function* (B, line) { yield* D.house.sleepOnFloor(B, { line: line || In.LINES.morning, music: 'inn', before: function () { M.lightNow(B); } }); };
  // a night at the inn: THE WAGON NIGHT on a WAGON DAY's evening, else the bed
  In.night = function* (B) {
    var f = B.roam.flags, d = In.day(D.roam.q); if (In.wagonTonight(f, d)) { yield* In.wagonNight(B, d); return; }
    yield* In.sleep(B);
    if (f.wagonGift) yield* M.talk(B, 'elsbeth', function (sc) { return In.gift(sc, B); }); // (the morning after the wagon came in off the road, stopped by day: js/wagon.js, In.wagonIn)
  };
  // the wagon brought in off the road (js/wagon.js: a day's fight on the Pit road, the pair down or away on the greys, the wagon turned for the nearest roof): the yard's
  // own ending as the night's has it -- Doran drives the children to Newland that same night, the inn lady keeps one, Elsbeth's gift the morning after
  In.wagonIn = function* (B) {
    var f = B.roam.flags, Wg = D.wagon; f.wagonDelivered = 1; f.doranAway = 1; f.kidAtInn = 1; f.wagonGift = 1;
    yield* In.say(B, Wg && Wg.LINES ? (f.wagonBroughtN === 7 ? Wg.LINES.broughtN : Wg.LINES.brought) : [L('wagon.doranTakes')], 'THE YARD');
    M.relay(B, null, true);
  };

  // ---------------------------------------------------------------- THE WAGON NIGHT (the lane's item 2: the first game's S.wagonNight, its words content/text.json wagon.*, the
  // second game's way -- the night as talk on the counter screen over the yard on the diamonds, the yard fight the grid's `wagonnight` on its own map, the traces as RULED 11-04 §1)
  In.WN = {
    fledHorses: 'They have the team loose and are away north up the road on the greys, into the dark toward Web Gulch.',
    fledFoot: 'They are away north up the road on foot, into the dark toward Web Gulch.',
    fledYard: 'In the yard the wagon stands where they left it.',
    book: 'On Willem Glass, a book in a fair hand: his spells, and at the back, the glamour he laid over the children, worked out line by line.',
    soon: '"End of the month there\'s a wagon through," Gennet says. "Good custom."',
    // the night played on the floor (11-04 later, his words at the pane: the seat's drafts, invented.json halfway-wagon-night-played)
    feeling: '"I\'d set a watch tonight," Lymen says, and will not say why. "Call it a feeling. I\'d sleep easier knowing who has the window."',
    feelingLead: '{name} has a feeling about the road tonight, and says so: a watch, turn and turn about, and whoever has the window keeps an eye on the yard.',
    turnsIn: '{y}{name}{/}, at the window on the second watch: a wagon turns in off the road. One big wagon, a woman on the bench with the reins and a fair-haired man beside her. Chained in the back, goblins.',
    suspect: '{c}(insight) The one she takes is not walking like a goblin walks.{/}',
    lieYard: '"Goblins for the mine across the lake. The house takes one a month off our hands; they work hard for their board."',
    abandoned: 'The wagon stands in the yard, the team still in its traces, half the buckles undone. In the back, chained, seven children. Real, and very quiet. The eighth went in with the inn lady.',
    abandonedLoose: 'The wagon stands in the yard, the traces cut, the team gone north with them. In the back, chained, seven children. Real, and very quiet. The eighth went in with the inn lady.',
    bribeTaken: 'Amara counts it into your hand. "Sleep well," she says. The wagon does not stay the night.',
    bribeGone: 'The young woman from upstairs comes down with a bag over her shoulder and climbs up on the bench beside Amara. The wagon turns in the yard and is gone up the road.',
    back: 'Back in by the front door, and up to bed.'
  };
  // the wagon's tail on the counter screen in the portrait's place: what is chained there to the eye -- goblins, till the glamour breaks (RULED 09-24: no words; the player sees it)
  In.tailPic = function (B) {
    return function (ctx, x, y, w, h, t) {
      var f = (B.roam && B.roam.flags) || {}, sh = f.glamourSeen ? 'kid1_p0' : 'goblin_p2', sh2 = f.glamourSeen ? 'kid2_p0' : 'goblin_p2';
      ctx.fillStyle = '#0c0e22'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#3a2a1c'; ctx.fillRect(x + 8, y + h * 0.62, w - 16, h * 0.12); // (the wagon's bed, its boards)
      try { if (D.spr && D.spr.draw && D.SHEETS[sh]) { D.spr.draw(ctx, sh, 'idle', D.spr.facingFor(0, 1), t, x + w * 0.36, y + h * 0.66, {}); D.spr.draw(ctx, sh2, 'idle', D.spr.facingFor(0, 1), t + 9, x + w * 0.64, y + h * 0.66, {}); } } catch (e) { }
      ctx.fillStyle = '#f8d878'; ctx.font = '10px monospace'; ctx.fillText('the wagon\'s tail', x + 10, y + 16);
    };
  };
  In.who = function (name, line) { return '{y}' + name + ':{/} ' + line; };
  In.perceives = function (h, dc, bonus) { var r = In.d20(), v = DS.R.skill(h, 'Perception', 'wis') + (bonus || 0), ok = r + v >= dc; In.trail((h.name || h.id) + ' Perception ' + r + ' + ' + v + ' vs DC ' + dc + (ok ? ', saw' : ', did not')); return ok; };
  In.saw = function (st, f) { if (f.glamourSeen) return false; f.glamourSeen = 1; D.sfx('magic'); return true; };
  // the confrontation, the glamour seen through (the road's by day -- js/wagon.js, on the counter screen): Lymen's word and steel; else the word, Amara's gold or steel
  // (noBribe: a cycle whose gold was taken on the road already gets no second offer)
  In.confront = function* (sc, st, f, outside, noBribe) {
    var ly = outside.filter(function (h) { return (h.key || h.id) === 'lymen'; })[0];
    if (ly) { yield sc.say(In.who('Lymen', L('wagon.lymen'))); return { how: 'fight', outside: outside }; }
    yield sc.say(In.who(outside[0].name, L('wagon.confront')));
    if (!noBribe) {
      var b = yield sc.ask(In.who('Amara', L('wagon.bribe')), ['TAKE THE GOLD', 'REFUSE']);
      if (b === 0) return { how: 'bribe', outside: outside };
      yield sc.say(In.who(outside[0].name, L('wagon.refuse')));
    }
    return { how: 'fight', outside: outside };
  };
  In.say = function* (B, lines, title) { var done = false; yield* M.talk(B, 'wagonNight', function (sc) { return (function* () { yield sc.say(lines); done = true; })(); }, title || 'THE WAGON NIGHT', In.tailPic(B)); return done; };
  In.stage = function (B, at, inside) { var t = B.roam.token; t.x = at[0]; t.y = at[1]; t.tween = null; B.roam.path = null; In.lay(B, inside, true); };

  // ---------------------------------------------------------------- THE WAGON NIGHT, PLAYED ON THE FLOOR (11-04 later, Griz at the pane on ?innshow, relayed by the lanes desk:
  // "Review how the 8-bit did the wagon fight, this one is all menu interaction and feels like a downgrade"; "battle map for the fight needs to be re-worked for a finalized inn --
  // they're using different walls at present"; "add a story item at the end of the dinner (or just on wagon night) that Lymen requests they set up watch as he has a feeling, then
  // use the standard watch interface for camping in the wilderness rather than the text 'who was on watch'"). The first game's S.wagonNight the model (first/js/events.js): the
  // figures move in the yard on the inn's own floor, the cards on the map's camera, a menu only where the first game asked a choice, the fight where they stand -- on the floor's
  // own squares, one map for the floor and the fight (the roam's own fight, js/roam.js R.engage, the yard's rules on it: Willem at the traces, the pair run when he is hit, either
  // on the road ends it, three turns unbothered and the team is loose). THE HANDOVER AT THE GREETING (RULED 11-04, the lane's §10.9 lean 1): one lifted down and led inside before
  // the watcher's choice -- the due has its offering whatever the yard does, and the yard fight is over the seven still in the bed
  In.PACE = 8; // (a figure's step, in frames: js/roam.js STEP)
  In.unit = function (B, o) { // (a figure stood on the floor: the townsfolk's shape, js/town.js T.people -- a foe's when o.foe; no `npc`, so a relay keeps it -- js/mines.js M.relay)
    var kind = D.FOES[o.kind] ? o.kind : 'bandit', spec = { id: o.id, kind: kind, at: o.at.slice() };
    if (!o.foe) { spec.side = 'party'; spec.ally = true; } if (o.traces) spec.traces = true;
    var u = B.makeFoe(spec);
    u.name = o.name || u.name; u.scripted = o.id; u.conds = u.conds || {}; u.reaction = 1;
    if (!o.foe) { u.look = true; u.attacks = {}; u.multi = 1; u.hp = u.maxhp = 4; u.lvl = 1; } else u.flees = false; // (the pair stand till the yard's rule starts them running: ai.js, B.fight.runWhenHurt)
    u.facing = D.spr.facingFor(o.face ? o.face[0] : -1, o.face ? o.face[1] : 0); u.anim = 'idle'; u.animT = B.t;
    if (o.lantern) { u.torch = D.light.make('lantern', false); D.light.regrip(u); }
    B.units.push(u); D.grid.setup(B.map, B.units); B.cache = null;
    return u;
  };
  In.gone = function (B, u) { if (!u) return; B.units = B.units.filter(function (x) { return x !== u; }); D.grid.setup(B.map, B.units); B.cache = null; };
  In.walk = function* (B, u, to, face) { // (a figure along the floor to a square, a step a time; no way there, it is set there)
    if (!u) return;
    var p = u.x === to[0] && u.y === to[1] ? [] : D.Battle.route(u, to, false);
    if (!p) { u.x = to[0]; u.y = to[1]; u.tween = null; }
    else while (p.length) { var nx = p.shift(); u.tween = { fx: u.x, fy: u.y, fz: D.grid.gzAt(u, u.x, u.y), t: 0, dur: In.PACE, mode: null }; u.facing = D.spr.facingFor(nx[0] - u.x, nx[1] - u.y); if (u.anim !== 'walk') { u.anim = 'walk'; u.animT = B.t; } u.x = nx[0]; u.y = nx[1]; D.grid.setup(B.map, B.units); yield In.PACE; }
    u.anim = 'idle'; u.animT = B.t; if (face) u.facing = D.spr.facingFor(face[0], face[1]); B.cache = null;
  };
  In.cam = function* (B, at, ticks) { yield* B.camTo({ gx: at[0], gy: at[1], gz: 0 }, D.iso.zoom, ticks || 24); };
  In.card = function* (B, lines, hold) { hold = hold || 360; B.card(D.roam.wrap([].concat(lines)), hold); yield Math.max(20, hold - 60); };
  In.ask = function* (B, title, lines, opts) { D.sfx('popup'); return yield { prompt: { who: B.roam.token, title: title, lines: D.roam.wrap([].concat(lines)), opts: opts.map(function (l, i) { return { label: l, value: i }; }) } }; };
  In.lead = function (B, u) { // (one of the four to the front of the token: the watcher goes out alone, as ORDER's "the leader to lead" -- js/roam.js)
    var R0 = B.roam, t = R0.token; if (!u || u === t) return;
    u.x = t.x; u.y = t.y; u.facing = t.facing; u.tween = null; R0.token = u; R0.members = [u].concat(R0.members.filter(function (m) { return m !== u; })); R0.rest = R0.members.slice(1);
    D.grid.setup(B.map, B.units); B.focus(u);
  };
  In.teamBlock = function (B) { (B.riders || []).forEach(function (r) { if (!r.team) return; for (var j = 0; j < r.foot[1]; j++) for (var i = 0; i < r.foot[0]; i++) { var s = B.map.at(r.x + i, r.y + j); if (s) s.walk = false; } }); }; // (the greys hold their squares, as a fight's riders do)
  // THE WORLD's camp picker on the floor (his word): who stands which watch -- js/house.js H.Watches, with these sheets; null if backed out of
  In.watches = function* (B, party) {
    var H = D.house, w = Object.create(H.Watches.prototype), out = null, done = false;
    w.kind = 'housewatches'; w.opaque = false; w.scene = null; w.party = party; w.asg = H.watchDefault(party); w.i = 0; w.t = 0;
    w.go = function (what) { if (D.top() === w) D.pop(); out = what === 'begin' ? this.asg : null; done = true; };
    D.push(w); while (!done) yield 1;
    return out;
  };
  // the lie-down to the second watch (the first game's, Griz 09-25: "long-rest before the wagon rolls in"): the rest's mechanics with no morning page -- the sheets whole, the clock
  // on to the watch's middle, the floor laid for the hour -- and the dark card; the morning page comes at the real morning (In.sleep)
  In.lieDown = function* (B, hours, title, line) {
    var R = D.roam, R0 = B.roam, H = D.house, W = D.world, house = !!(R.house() && H.playing), sheets;
    if (house) { H.fromFloor(B); var S = W.state(); S.t += hours; S.today = 0; S.todayHex = 0; S.pushing = false; W.save(); H.longRest(null); sheets = H.cur.party; }
    else { R0.hour = ((R0.hour != null ? R0.hour : M.hourNow(R.q, B)) + hours) % 24; sheets = R0.members.filter(function (u) { return u.src; }).map(function (u) { var sh = JSON.parse(JSON.stringify(u.src)); sh.hp = Math.max(0, u.hp); sh.slots = (u.slots || sh.slots || []).slice(); return sh; }); H.restSheets(sheets); }
    var byKey = {}; sheets.forEach(function (h) { byKey[h.key || h.id] = h; });
    R0.members.forEach(function (u) { var sh = u.src && byKey[u.src.key || u.src.id]; if (sh) { u.src.conds = JSON.parse(JSON.stringify(sh.conds || {})); R.resheet(B, u, sh); } }); R.regear(B);
    R0.slept = (R0.slept || 0) + 1;
    M.lightNow(B);
    yield* In.card(B, ['{y}' + title + '{/}', line], 420);
  };
  // the yard's cast: the pair down off the bench by the wagon, Willem at the greys' heads; the two in the bed and the team as riders (drawn where they stand, js/ui.js); the traveler come down
  In.yardCast = function (B, f) {
    var w = In.WAGONAT, seen = !!(f.glamourSeen || f.glamourBroken), Y = {};
    Y.riders = [{ x: w[0] + 3, y: w[1], sheet: seen ? 'kid1_p0' : 'goblin_p2', after: 'kid1_p0', facing: 3, gz: 12, foot: [1, 1], anim: 'idle', animT: 0 },
      { x: w[0] + 3, y: w[1] + 1, sheet: seen ? 'kid2_p0' : 'goblin_p2', after: 'kid2_p0', facing: 3, gz: 12, foot: [1, 1], anim: 'idle', animT: 0 },
      { x: w[0] - 2, y: w[1], sheet: 'horse_p1', facing: 3, gz: 0, foot: [2, 1], team: true, blocks: true, anim: 'idle', animT: 0 },
      { x: w[0] - 2, y: w[1] + 1, sheet: 'horsegrey_p1', facing: 3, gz: 0, foot: [2, 1], team: true, blocks: true, anim: 'idle', animT: 0 }];
    B.riders = (B.riders || []).filter(function (r) { return !r.yard; }).concat(Y.riders.map(function (r) { r.yard = true; return r; })); In.teamBlock(B);
    Y.amara = In.unit(B, { id: 'amaraYard', kind: 'amara', at: [w[0] + 1, w[1] - 1], name: 'Amara', face: [1, 0], foe: true });
    Y.willem = In.unit(B, { id: 'willemYard', kind: 'willem', at: [w[0] - 3, w[1]], name: 'Willem Glass', face: [-1, 0], foe: true, traces: true });
    Y.kat = f.katYard ? In.unit(B, { id: 'katYard', kind: 'commonerwoman', at: In.YARDFOLK[4].at.slice(), name: 'A traveler', face: [-1, 0] }) : null;
    return Y;
  };
  In.yardClear = function (B, Y) { ['amara', 'willem', 'kat', 'gennet', 'kid'].forEach(function (k) { if (Y[k] && B.units.indexOf(Y[k]) >= 0) In.gone(B, Y[k]); Y[k] = null; }); B.riders = (B.riders || []).filter(function (r) { return !r.yard; }); };
  // seen through: the two in the bed are children (RULED 09-24: no words; the player sees it)
  In.breakGlamour = function* (B, st, f, Y) {
    if (!In.saw(st, f)) return;
    (B.riders || []).forEach(function (r) { if (r.yard && r.after) { r.sheet = r.after; if (D.fx) D.fx.sparkle({ x: r.x, y: r.y, size: 1 }, 'gold', 14); } });
    if (Y && Y.kid && B.units.indexOf(Y.kid) >= 0) { var kd = D.FOES.commonerchild; if (kd) { Y.kid.sheet = kd.sheet; Y.kid.kind = 'commonerchild'; Y.kid.name = 'A child, chained'; if (D.fx) D.fx.sparkle(Y.kid, 'gold', 14); } }
    yield 40;
  };
  // the due's walk, the night's cutscene on the map's camera (the first game's EV.dueWalk): the inn lady out of the lake door with her lantern and the one she took, down the path to the point, the lake flat; only she comes back
  In.dueWalk = function* (B, look) {
    var f = B.roam.flags, lake = In.DOORS.lake, stone = [43, 18];
    var lady = In.unit(B, { id: 'dueLady', kind: 'commonerwoman', at: [lake[0] + 1, lake[1]], name: In.named(f), face: [1, 0], lantern: true });
    var kid = In.unit(B, { id: 'dueKid', kind: look === 'goblin' ? 'goblin' : 'commonerchild', at: [lake[0] + 1, lake[1] + 1], name: look === 'goblin' ? 'A goblin' : 'A child', face: [1, 0] });
    yield* In.cam(B, [40, 18], 40);
    yield* In.card(B, [L(look === 'goblin' ? 'due.walkGoblin' : 'due.walk')], 360);
    yield* In.walk(B, lady, [stone[0], stone[1] + 1], [1, 0]); yield* In.walk(B, kid, [stone[0] + 1, stone[1]], [1, 0]);
    yield 40;
    yield* In.card(B, [L('due.water')], 360); D.sfx('splash'); if (D.fx) D.fx.sparkle(kid, 'blue', 24); yield 30;
    In.gone(B, kid); yield 50;
    yield* In.walk(B, lady, [lake[0] + 1, lake[1]], [-1, 0]); In.gone(B, lady);
    yield* In.card(B, [L('due.back')], 360);
    f.dueSeen = 1;
  };
  In.wagonNight = function* (B, d) {
    var R = D.roam, R0 = B.roam, f = R0.flags, st = D.counter.state(B), H = D.house, W = D.world;
    f.wagonCycle = In.cycle(d); delete f.glamourSeen;
    var party = R0.members.filter(function (u) { return u.src && !u.src.guest && u.hp > 0 && !u.dead; }), lead = party[0] || R0.token;
    var keyOf = function (u) { return u.src ? (u.src.key || u.src.id) : u.id; };
    // 1. Lymen's feeling, and the watches (his word, 11-04): the camp's picker; the one on the second watch has the window
    var ly = party.filter(function (u) { return keyOf(u) === 'lymen'; })[0];
    yield* In.card(B, [ly ? In.who('Lymen', In.WN.feeling) : In.WN.feelingLead.split('{name}').join(lead.name)], 420);
    var sheets = party.map(function (u) { return { key: keyOf(u), name: u.name, hp: u.hp, maxhp: u.maxhp }; });
    var asg = (yield* In.watches(B, sheets)) || H.watchDefault(sheets);
    var watcher = party.filter(function (u) { return asg[keyOf(u)] === 2; })[0] || party[0];
    In.trail('the watches: ' + Object.keys(asg).map(function (k) { return k + ' ' + asg[k]; }).join(', ') + '; ' + watcher.name + ' at the window');
    // 2. the lie-down to the second watch: the rest's mechanics, the clock to the watch's middle, the dark
    yield* In.lieDown(B, (W.REST || 8) / (H.WATCHES || 3) * 1.5, 'THE SECOND WATCH', L('wagon.night'));
    // 3. the yard: the wagon in, the party at the window, the figures; the inn lady out to meet it with her lantern; the greetings
    var paid = !!(D.wagon && f.wagonBribed === 'c' + In.cycle(d)); // (Amara's gold taken on the road that day: the night kept to the room, as paid -- js/wagon.js)
    f.wagonIn = 1; if (In.katHere(f, d)) f.katYard = 1;
    In.stage(B, [In.DOORS.front[0] + 1, In.DOORS.front[1]], 'inn');
    var Y = In.yardCast(B, f), w = In.WAGONAT;
    yield* In.cam(B, [w[0] + 2, w[1]], 30);
    yield* In.card(B, [In.WN.turnsIn.split('{name}').join(watcher.name)], 420);
    Y.gennet = In.unit(B, { id: 'gennetYard', kind: 'commonerwoman', at: [In.DOORS.front[0] - 1, In.DOORS.front[1]], name: In.named(f), face: [-1, 0], lantern: true });
    yield* In.walk(B, Y.gennet, [w[0] + 5, w[1]], [-1, 0]);
    yield* In.card(B, [In.who('The inn lady', L('wagon.greet1'))], 300);
    yield* In.card(B, [In.who('Amara', L('wagon.greet2'))], 300);
    yield* In.card(B, [In.who('The inn lady', L('wagon.greet3'))], 300);
    // BEAT 0 (the lane's §10.3, RULED): the handover at the greeting -- one lifted down and led inside by the hand; its read from the window
    Y.kid = In.unit(B, { id: 'wagonKid', kind: 'goblin', at: [w[0] + 4, w[1] + 1], name: 'A goblin, chained', face: [1, 0] });
    yield* In.walk(B, Y.kid, [w[0] + 4, w[1]], [1, 0]); yield 10;
    yield* In.card(B, [L('wagon.handover')], 360);
    f.dueTonight = 1; f.kidTaken = 1;
    if (In.read(st, 'Insight', 13)) { f.glamourSuspect = 1; yield* In.card(B, [In.WN.suspect], 300); }
    yield* In.walk(B, Y.gennet, [In.DOORS.front[0] - 1, In.DOORS.front[1]]); yield* In.walk(B, Y.kid, [In.DOORS.front[0] - 1, In.DOORS.front[1] + 1]);
    In.gone(B, Y.gennet); Y.gennet = null; In.gone(B, Y.kid); Y.kid = null; yield 10;
    // the watcher's look from the window (the first game's Perception 15; the handover's read sharpens it)
    if (!paid && In.perceives(watcher.src, 15, f.glamourSuspect ? 5 : 0)) yield* In.breakGlamour(B, st, f, Y);
    // 4. the choice, as the first game asked it: INVESTIGATE, WAKE THE PARTY, KEEP WATCH (a night already paid for on the road keeps to the room)
    var a = paid ? 2 : yield* In.ask(B, 'THE SECOND WATCH', [L('wagon.ask', { name: watcher.name })], ['INVESTIGATE', 'WAKE THE PARTY', 'KEEP WATCH']);
    var how = 'quiet', outside = [], morning = null;
    if (a !== 2) {
      outside = a === 0 ? [watcher] : party.slice();
      if (a === 0 && watcher !== R0.token) In.lead(B, watcher); // (the watcher's figure goes out alone: the token is the watcher's from here)
      yield* In.card(B, [L(a === 0 ? 'wagon.investigate' : 'wagon.wake', { name: watcher.name })], 300);
      yield* R.walkTo(B, [w[0] + 6, w[1]]); // (out the front door into the yard: a step out roofs the house as ever)
      if (!f.glamourSeen && outside.some(function (u) { return In.perceives(u.src, 12, f.glamourSuspect ? 5 : 0); })) yield* In.breakGlamour(B, st, f, Y);
      if (!f.glamourSeen) {
        yield* In.card(B, [In.who('Amara', In.WN.lieYard)], 360);
        if (outside.some(function (u) { var r = In.d20(), v = DS.R.skill(u.src, 'Insight', 'wis'), ok = r + v >= 13; In.trail(u.name + ' Insight ' + r + ' + ' + v + ' vs DC 13 at the lie' + (ok ? ', heard' : ', not')); return ok; })) {
          yield* In.card(B, [L('wagon.insight')], 360);
          if (outside.some(function (u) { return In.perceives(u.src, 12, 5); })) yield* In.breakGlamour(B, st, f, Y);
        }
      }
      if (!f.glamourSeen) { yield* In.card(B, [L('wagon.nothing')], 360); yield* R.walkTo(B, [In.DOORS.front[0] + 1, In.DOORS.front[1]]); }
      else {
        var ly2 = outside.filter(function (u) { return keyOf(u) === 'lymen'; })[0];
        if (ly2) { yield* In.card(B, [In.who('Lymen', L('wagon.lymen'))], 420); how = 'fight'; }
        else {
          yield* In.card(B, [In.who(outside[0].name, L('wagon.confront'))], 360);
          var b = yield* In.ask(B, 'AMARA', [In.who('Amara', L('wagon.bribe'))], ['TAKE THE GOLD', 'REFUSE']);
          if (b === 0) how = 'bribe'; else { yield* In.card(B, [In.who(outside[0].name, L('wagon.refuse'))], 300); how = 'fight'; }
        }
      }
    }
    if (how === 'quiet') {
      var seen = !!f.glamourSeen || paid; f.wagonOutcome = 'quiet'; f.katGone = 1; f.katRode = 1; if (seen) f.glamourBroken = 1;
      if (Y.kat) { yield* In.walk(B, Y.kat, [In.DOORS.front[0] - 1, In.DOORS.front[1]]); In.gone(B, Y.kat); Y.kat = null; }
      In.gone(B, Y.amara); In.gone(B, Y.willem); Y.amara = Y.willem = null;
      yield* In.card(B, [paid && D.wagon ? D.wagon.LINES.paidNight : L('wagon.quietNight')], 360);
      yield* In.dueWalk(B, seen ? 'kid' : 'goblin');
      morning = L('wagon.morning.' + (seen ? 'quietSeen' : 'quiet'));
    } else if (how === 'bribe') {
      st.silver(500); D.sfx('coin'); f.wagonOutcome = 'bribe'; f.glamourBroken = 1; f.elsbethSilent = 1; f.katGone = 1; f.katRode = 1; f.kidAtInn = 1;
      yield* In.card(B, [L('g.foundSilver', { n: 500 }), In.WN.bribeTaken], 360);
      if (!Y.kat) Y.kat = In.unit(B, { id: 'katYard', kind: 'commonerwoman', at: [In.DOORS.front[0] - 1, In.DOORS.front[1]], name: 'A traveler', face: [-1, 0] });
      yield* In.walk(B, Y.kat, [w[0] + 2, w[1] - 1], [-1, 0]); yield 20;
      In.yardClear(B, Y); delete f.wagonIn; In.lay(B, null, true); // (the wagon gone up the road: the yard laid without it)
      yield* In.card(B, [In.WN.bribeGone], 360);
      yield* R.walkTo(B, [In.DOORS.front[0] + 1, In.DOORS.front[1]]);
      yield* In.dueWalk(B, 'kid');
      morning = L('wagon.morning.bribe');
    } else {
      if (Y.kat) { yield* In.walk(B, Y.kat, [In.DOORS.front[0] - 1, In.DOORS.front[1]]); In.gone(B, Y.kat); Y.kat = null; } // (she is inside before the first blade clears, Griz 09-25)
      if (f.katYard) { delete f.katYard; f.katGone = 1; }
      var out = yield* In.yardFight(B, Y);
      if (out === 'lost') return;
      f.glamourBroken = 1; f.wagonStopped = 'c' + In.cycle(d); // (this wagon runs no road north: its mark on THE WORLD stops -- js/wagon.js)
      yield* In.breakGlamour(B, st, f, Y);
      if (out === 'fled') { f.wagonOutcome = 'fled'; f.wagonFled = In.lastFight.loose ? 'horses' : 'foot'; yield* In.card(B, [f.wagonFled === 'horses' ? In.WN.fledHorses : In.WN.fledFoot, In.WN.fledYard], 420); } // (the catch on the Gulch roam comes here: the lane's item 3)
      else f.wagonOutcome = 'inn';
      if (In.lastFight.willemDead && !In.has(st, 'willembook')) { D.counter.give(st, 'willembook', 1); D.sfx('chest'); yield* In.card(B, [In.WN.book, L('g.got', { item: DS.DATA.items.willembook.name })], 420); } // (his book when the party kills him, not when he yields or runs: the house lane's item 7, 09-30c)
      st.silver(600); D.counter.give(st, 'wagonorder', 1); D.sfx('chest'); f.doranAway = 1; f.kidAtInn = 1; f.wagonGift = 1;
      yield* In.card(B, [In.lastFight.loose ? In.WN.abandonedLoose : In.WN.abandoned], 420);
      yield* In.card(B, [L('wagon.strongbox'), L('g.foundSilver', { n: 600 }), L('g.got', { item: DS.DATA.items.wagonorder.name })], 420);
      yield* In.card(B, D.counter.renown(st, 1, 'renown.wagon').concat([L('wagon.doranTakes')]), 480);
      morning = L('wagon.morning.inn');
      yield* R.walkTo(B, [In.DOORS.front[0] + 1, In.DOORS.front[1]]);
    }
    if (how !== 'fight' && In.has(st, 'ringofbinding')) morning = morning + ' ' + L('wagon.ringCold');
    delete f.wagonIn; delete f.katYard; In.yardClear(B, Y);
    In.stage(B, [24, 17], 'inn'); // (to bed: the morning in the common room)
    yield* In.sleep(B, morning);
    if (f.wagonGift) yield* M.talk(B, 'elsbeth', function (sc) { return In.gift(sc, B); });
  };
  // the yard fight on the floor's own squares (one map for the floor and the fight): the roam's fight with the yard's rules laid on the floor's fight def for its length --
  // Willem at the traces, the pair run when he is hit (runWhenHurt), either on the road ends it (fledEnds; the road down the west edge the ways off), three turns unbothered
  // and the team is loose (RULED 11-04 §1; js/ai.js traces). The result as the floor's fights leave it (js/roam.js R.after); the record kept with the others
  In.lastFight = {};
  In.yardFight = function* (B, Y) {
    var R = D.roam, R0 = B.roam, F = B.fight, keep = {}, exits = [];
    ['runWhenHurt', 'fledEnds', 'loosen', 'exit', 'noFlee'].forEach(function (k) { keep[k] = F[k]; });
    for (var y = 0; y < R.def.h; y++) for (var x = 0; x < 3; x++) exits.push([x, y]);
    F.runWhenHurt = 'willem'; F.fledEnds = true; F.loosen = 3; F.exit = exits; F.noFlee = false; B.hitAtTraces = false; B.teamLoose = false;
    var foes = [Y.amara, Y.willem].filter(function (u) { return u && B.units.indexOf(u) >= 0; });
    foes.forEach(function (u) { u.flees = false; delete u.roamAside; });
    In.lastFight = { foes: foes.length, hp: foes.map(function (u) { return u.hp; }), onFloor: [Y.amara, Y.willem].map(function (u) { return !!u && B.units.indexOf(u) >= 0; }) }; R0.fights++; R0.lastOutcome = null;
    try { D.music('boss'); } catch (e) { }
    yield* R.engage(B, { foes: foes, why: 'yard', zone: null, flag: 'wagonFought', trig: 'wagonnight' }, false, 'yard');
    var o = R0.lastOutcome; In.lastFight.outcome = o; In.lastFight.round = B.round;
    In.lastFight.loose = !!B.teamLoose; In.lastFight.willemDead = !!(Y.willem && Y.willem.hp <= 0 && !Y.willem.fled);
    Object.keys(keep).forEach(function (k) { if (keep[k] === undefined) delete F[k]; else F[k] = keep[k]; });
    Y.amara = Y.willem = null;
    return o === 'won' ? 'won' : /^(lost|lose|dead|ko)$/.test(String(o)) ? 'lost' : 'fled';
  };
  // what a fight at the inn left behind: who lay dead (his book), whether the team came loose
  var finish0 = D.Battle && D.Battle.prototype.finish;
  if (finish0) D.Battle.prototype.finish = function* (o) {
    if (this.fight && /^(wagonnight|roadcatch1|roadcatch2|roadday)$/.test(this.fight.id || '')) In.lastFight.willemDead = In.lastFight.willemDead || this.units.some(function (u) { return u.kind === 'willem' && u.side === 'foe' && u.hp <= 0 && !u.fled && !u.gone; });
    yield* finish0.apply(this, arguments);
  };
  // Elsbeth's gift, the morning after the wagon was stopped (the first game's EV.wagonGift): the lead's armour one better, or a ring of protection
  In.giftId = function (st) { var lead = st.party[0], arm = lead && lead.equip && lead.equip.armor; return arm && DS.DATA.items[arm + '1'] ? arm + '1' : 'ringofprotection'; };
  In.gift = function* (sc, B) {
    var st = sc.st, f = st.flags; delete f.wagonGift;
    var id = In.giftId(st); yield sc.say(L('wagon.gift'));
    D.counter.give(st, id, 1); D.sfx('chest'); f.lakeGiftGot = 1;
    yield sc.say(L('g.got', { item: DS.DATA.items[id].name }));
    if (!In.has(st, 'ringofbinding')) { f.elsbethSent = 1; yield sc.say(L('inn.elsbethWinters')); }
  };
  // Willem Glass's book (the lane's item 5; the house lane's item 7, 09-30c: a drop when the party kills him): the seat's draft, invented.json halfway-wagon-night
  if (DS && DS.DATA && DS.DATA.items && !DS.DATA.items.willembook) DS.DATA.items.willembook = { name: 'Willem\'s Book', kind: 'key', price: 0, noSell: true,
    desc: 'Willem Glass\'s spellbook: an illusionist\'s, in a fair hand -- and at the back, worked out line by line, the glamour he laid over the children on Amara\'s wagon.', src: 'invented.json halfway-wagon-night' };
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
        if (slept === 'meal') yield* In.mealScene(B);
        if (slept) yield* In.night(B);
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
    else if (s === 'inn:stair') { yield* M.go(B, In.UP, [In.UPSTAIR[0], In.UPSTAIR[1] - 1], [0, -1]); return; } // (up to the guest rooms, a step off the stair head)
    else if (s === 'inn:down') { yield* M.go(B, In.KEY, [In.STAIR[0], In.STAIR[1] - 1], [0, -1]); return; } // (down by the bar, a step off the stair's foot into the room: the house laid open, js/inn.js In.qInside)
    else if (s === 'inn:drawer') {
      if (In.bookInDrawer(f, In.day(D.roam.q), st)) { f.katBookTaken = 1; D.counter.give(st, 'katbook', 1); D.sfx('chest'); say = [L('inn.drawerBook'), L('g.got', { item: DS.DATA.items.katbook.name })]; } // (she rode out with the wagon: the book left in the drawer -- the lane's item 10)
      else say = [In.katHere(f, In.day(D.roam.q)) ? In.LINES.drawerShut : In.LINES.drawerEmpty]; // (her room while she has it; after, the book if she left it, else nothing)
    }
    if (!say.length) return;
    D.sfx('popup'); B.card(D.roam.wrap([].concat.apply([], say)), 320); yield 20;
  };

  // ---------------------------------------------------------------- THE WORLD: the site 'inn' a door (the Pit road through it north and south, the hills west)
  W.DOORS[In.SITE] = { roam: In.KEY, gates: { north: [0, -1], south: [0, 1], west: [-1, 0] } };
  W.APPROACH[In.SITE] = { mi: 4, z: Infinity }; // (down to the area's closest zoom as the party nears, as every door's: js/world.js W.closeZ)

  // ---------------------------------------------------------------- THE HALFWAY INN, shown (deep16/?innshow -- the eyes rows' door): a NEW GAME's four staged on the floor by the beat
  In.BEATS = [
    { id: 'yard', label: 'THE YARD BY DAY, in off the Pit road', note: 'Ten in the morning in the yard off the Pit road (the road down the west side, as the Gulch\'s): the well, the hitching rail, the barn for six horses, Doran by the woodpile, the boys down at the point. The inn two stories under its roof, its one-story wing behind. Walk to the front door.', key: In.KEY, at: [10, 22], hour: 10 },
    { id: 'door', label: 'THROUGH THE FRONT DOOR: the walls go see-through', note: 'A step short of the front door. One step into the doorway: the roofs come off the house and its wing and every wall drops to a stub -- the common room round the big fire, the bar under the stair, the kitchen beyond, the two bedrooms, its people in them. A step back out roofs it again. The barn does the same at its own door.', key: In.KEY, at: [18, 18], hour: 18 },
    { id: 'room', label: 'THE COMMON ROOM at dusk: the inn lady\'s room and THE MEAL at the long table', note: 'Inside at six in the evening, day 5. The inn lady by the hearth (plated THE INN LADY till she gives her name), Doran behind the bar under the stair\'s high end, the traveler by the fire (she is here days 5 and 6), Elsbeth at the kitchen tub. E on the inn lady: a room at five silver a head, then supper -- everyone sits along the long table, the traveler at the table for two, and the talk plays over the room: the one speaking on the side they sit, the hero whose die it was on theirs with the die in their bubble. The moot, the one-eyed chief and the mirror-eyed beasts, true or heard wrong by your History; ask Doran about the drovers, the traveler about her mirror; then the night.', key: In.KEY, at: [24, 17], hour: 18, day: 5, inside: true, dice: [14, 12, 15] },
    { id: 'meal8', label: 'THE MEAL ON DAY 10: the Snoot moving north', note: 'The same supper eight days later: the moot, the one-eyed chief, the mirror-eyed beasts, the Snoot past the Gulch, the thing three men would not name. A low History die: every word heard wrong. Ask Doran about the drovers (Persuasion, shown); the traveler is gone south by now.', key: In.KEY, at: [24, 17], hour: 18, day: 10, inside: true, dice: [3, 15, 16] },
    { id: 'meal14', label: 'THE MEAL ON DAY 15: the Snoot at the Pit', note: 'Supper on day 15: everything the road has said, and the worst of it -- the Snoot at the Pit, the road south shut. The dice high.', key: In.KEY, at: [24, 17], hour: 18, day: 15, inside: true, dice: [18, 17, 17] },
    { id: 'wagon', label: 'DAY 6: THE WAGON NIGHT', note: 'The first WAGON DAY, six in the evening in the common room, the traveler by the fire. E on the inn lady: a room, supper, then the second watch -- Amara\'s wagon turns in, goblins chained in the back. Who had the watch? INVESTIGATE, WAKE THE PARTY or KEEP WATCH; the gold, or steel: the yard fight on the grid, Willem at the traces (three turns unbothered and the team is loose).', key: In.KEY, at: [24, 17], hour: 18, day: 6, inside: true },
    { id: 'upstairs', label: 'UPSTAIRS: the guest rooms and the room over the kitchen', note: 'At the head of the stair in the passage. Three small guest rooms over the common room, the big fire\'s chimney through the middle, and the big room on the kitchen side over the lake, its door off the passage past the chimney: E at the table by its bed -- the drawer. The stair down sets you by the bar.', key: In.UP, at: [6, 9], hour: 18 },
    { id: 'night', label: 'THE YARD BY NIGHT', note: 'Ten at night on the path from the lake door: the house dark on the yard, lamps at its doors and the barn\'s, the lantern post on the point, the lake black. The boys are in.', key: In.KEY, at: [38, 18], hour: 22 },
    { id: 'snoot', label: 'DAY 14: THE SNOOT\'S RUNNER by the well', note: 'The Snoot at the Pit: a runner off the Pit road by the well. E on him: TO THE SNOOT opens the Snoot\'s own page (its BACK TO THE INN comes home), or NOT NOW.', key: In.KEY, at: [13, 16], hour: 10, day: 14 },
    { id: 'world', label: 'THE WORLD AT THE INN: its door', note: 'A NEW GAME on THE WORLD on the inn\'s hex. E: the inn\'s door -- GO IN by the gate the party faces.', world: true, hour: 15 }
  ];
  In.play = function (bt) {
    var H = D.house, R = D.roam, rec = H.fresh(); rec.at = { town: null }; rec.flags = Object.assign({ councilNotice: 1, councilSeen: 1 }, bt.flags || {}); rec.silver = Math.max(rec.silver || 0, 60); // (Silverton's council night sat already: a show of the inn -- 11-04, his "these previews are all firing the council discussion")
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
