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
    ',,,..AaoooooooD...."""""""""""""""""""t""""eWWWWWW', ',,,..Aoo|oo|ooA....""""""""""""""""""""""""eWWWWWW',
    ',,,..Awo|wo|woA....""""""""""""""""""""""""eWWWWWW', ',,,..AAAAAAAAAA....""""""t"""""""""""""""""eWWWWWW',
    ',,,................"""""""""""""""t""""""""nWWYYYY', ',,,................""""""""""""""""""""""""nWWYYYY',
    ',,,..||||.........."""""""""""""""""""""t""nWWYYYY', ',,,...xx...........BBBBBBBBBBBBBBBBBB""""""nWYYYYY',
    ',,,................BcoooooocoooHHHHoB""""""nWYYYYY', ',,,........q.......BoKKKKKKoooooooooB"""""lnWWYYYY',
    ',,,................BooooooooooooKKooB"""""rrrrYYYY', ',,,s...............BooooooooCCjoooooB"""""rrrrYYYY',
    ',,,................DooooobohCChoooooD,,,,,rrirYYYY', ',,,................BooooobohCChoooooB"""""rrirYYYY',
    ',,,................BoomKmoooCCjoooooB"""""rrrrYYYY', ',,,................BooooooooooooooToB"""""rrrrYYYY',
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
    l: 'lamp', e: 'reeds', W: 'water', Y: 'deep', p: 'boat', R: 'innRoof', X: 'wingRoof', Q: 'barnRoof', S: 'stairRun',
    a: 'hay', x: 'trough', j: 'tools', s: 'sign' }; // (11-05, the exteriors seat: the barn's hay, the trough by the rail, the hearth's tools and kettle, the sign by the road -- js/innprops.js)
  // the names the top levels' floors had not needed, as the grid's squares (js/mines.js M.LAY; a roof by M.ROOF)
  Object.assign(M.LAY, { grassT: ['g'], earth: ['.'], woodpile: ['k'], manger: ['k'], floorWood: ['o'], doorway: ['d'], table: ['K'], bench: ['K'], chair: ['k'], shelf: ['S'], bed: ['y'],
    tub: ['w'], sand: ['.'], flatstone: ['.'], rocks: ['r'], boat: ['k'], stairRun: ['o'], hay: ['k'], trough: ['w'], tools: ['k'], sign: ['f'] }); // (the stair's run: walked as the floor till art-wanted section 36's stair comes back)
  Object.assign(M.ROOF, { innRoof: 'I', wingRoof: 'J', barnRoof: 'Z', innWall: 'v', barnWall: 'v' });
  // where the people stand, by the hour and the floor's flags (the first game's conditions): the yard's by day, the house's inside it -- seen while the party is in
  In.FOLK = [
    { id: 'doranYard', at: [16, 26], look: 'worker', dir: 'right', cond: '!flag:doranAway & !flag:doranDead', when: 'day', out: true },   // (by the woodpile)
    { id: 'orrin', at: [43, 20], look: 'kid', dir: 'right', cond: '!flag:dueSeen', when: 'light', out: true },           // (the stone stack at the point)
    { id: 'pell', at: [43, 24], look: 'kid', dir: 'right', cond: '!flag:dueSeen', when: 'light', out: true },            // (skimming stones off the shore)
    { id: 'adoptedKid', at: [43, 12], look: 'girl', dir: 'right', cond: 'flag:kidAtInn & !flag:dueSeen', when: 'light', out: true },
    { id: 'doranIn', at: [24, 23], look: 'worker', dir: 'up', cond: '!flag:doranAway & !flag:doranDead', when: 'evening' },                // (behind the bar, under the stair's high end, where the headroom is)
    { id: 'gennet', at: [24, 16], look: 'innlady', dir: 'down', cond: '!flag:lakeDone & !flag:gennetDead' },
    { id: 'gennetGrief', at: [21, 18], look: 'innlady', dir: 'down', cond: 'flag:lakeDone & !flag:gennetDead' },
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
    bed: 'A room under the eaves.', // (its watch line cut 11-04, Griz: "The nobody stands watch can just go unmentioned since we violate it on wagon night")
    morning: 'Morning on Halfway Lake: mist off the water, the well\'s chain, the boys already down at the shore.',
    night: 'Night at the Halfway Inn. The lamps are lit in the common room; past the point the lake is black.',
    day: 'Morning comes up over Halfway Lake.',
    runner: ['A runner off the Pit road, mud to the knee, drinking at the well like he means to empty it.',
      '"The Snoot\'s come down on the Pit -- the whole of it, gnolls past counting. The Pit\'s asking for every blade on the road. South, if you\'re going."'],
    runnerAsk: 'THE SNOOT is a page of its own: the war on the hexes round the Pit. What is not saved here stays behind.',
    stair: 'The stair up to the guest rooms. The room over the kitchen has its door shut.',
    upstairs: 'Upstairs: three small guest rooms over the common room, and the big room on the kitchen side with the lake under its window. The stair down is in the passage.',
    drawerShut: 'The room over the kitchen: paid ahead, a farm woman\'s things folded on the chair. The drawer by the bed is shut, and you leave it shut.', // (11-05: her stay from day 4, not two nights -- invented.json halfway-katarina)
    drawerEmpty: 'The drawer by the bed is empty.',
    // the inn's rest hours (11-05, In.REST): supper with the room from three, the kitchen cold after ten, before three a word about supper (the seat's drafts, invented.json halfway-inn-rest)
    dinnerAt8: '"Dinner is at eight." A room for the night after it is {n} silver.',
    opts: { short: 'SHORT REST', wait: 'WAIT TIL DINNER', notNow: 'NOT NOW' },
    shortRest: 'An hour by the fire with your boots off.',
    waited: 'The afternoon goes by the fire. At eight, supper.',
    dinner: 'Supper at the long table -- lake fish, bread, the road\'s talk -- and then a room under the eaves.',
    late: 'The kitchen is cold this late. A room under the eaves, and no supper.'
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
  // THE WAGON ON THE CALENDAR (the lane's 11-04 §3, RULED 11-04, his "in on your above leans as well": the first WAGON DAY then every 28 -- his numbers to move):
  // Amara's wagon reaches the inn at dusk on a WAGON DAY; a room taken that evening is THE WAGON NIGHT (In.wagonNight).
  // MOVED 11-05 (the Katarina seat, kat-1105; RULED 11-05, Griz to the lanes desk, "Yes, the leans", on "I'm predicting we'll have to move wagon night back and keep kat
  // waiting at the inn longer (based on recent playthroughs)", and his 10-16 "we can have the party get to the inn later than day 4, and have had kat waiting longer"): the
  // first WAGON DAY 12, not 6 (his 10-31 save was still in Silverton on day 9). KATARINA waits at the inn from her arrival on day 4 (the clock lane's "inn night = Day 4",
  // RULED 10-13) through the first WAGON DAY; she rides out with the wagon, or walks south the morning after when the wagon was stopped (her last day, In.katLast: the book
  // given, the first game's "the day after"); her book in the drawer after unless she gave it
  In.WAGON = { first: 12, every: 28 };
  In.KAT = { from: 4 };       // (her arrival: the fourth morning after the moot, her finished book in hand)
  In.isWagonDay = function (d) { return d >= In.WAGON.first && (d - In.WAGON.first) % In.WAGON.every === 0; };
  In.cycle = function (d) { return Math.floor((d - In.WAGON.first) / In.WAGON.every); };
  In.wagonTonight = function (f, d) { return In.isWagonDay(d) && f.wagonCycle !== In.cycle(d); };
  In.katLast = function (f, d) { return !f.katGone && !f.katRode && d === In.WAGON.first + 1 && f.wagonStopped === 'c0'; }; // (the first wagon stopped -- in the yard or on the road: no ride, so she walks south the morning after, and gives the book)
  In.katHere = function (f, d) { return !f.katGone && !f.katRode && ((d >= In.KAT.from && d <= In.WAGON.first) || In.katLast(f, d)); };
  In.bookInDrawer = function (f, d, st) { return !f.katBookTaken && !f.katGave && !(st && In.has(st, 'katbook')) && (!!f.katRode || d > In.WAGON.first + (In.katLast(f, d) ? 1 : 0)); };
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
  // (11-05, the exteriors seat, his notes at the pane: "copy the small fireplace and position upstairs over the chimney on the first floor / add a bed to each of the 3 front
  // rooms and 3 beds to the backroom / move the nice bed and nightstand to the northern wall as far from the fireplace on that wall": the small hearth f in the big room's
  // wall on the chimney, its mouth into the room; a second bed z in each small room along its west wall; the big room's three Z along its north wall, heads to it; the good bed
  // and its table to the hearth's own wall at its far end, the room's top corner; and the chimney upstairs the stack page 9 drew, a 1 x 2 at the hearth's back, the rest of
  // the big fire's 2 x 4 the passage and room 3's corner)
  In.UPROWS = [
    'BBBBBBBBBBBBBBBBBB',
    'BzoBzoBzoccBzoZZZB',
    'BooBooBooccBKooooB',
    'BzoBzoBzoBBBoooooB',
    'BooBooBooBBBoooooB',
    'BBoBBoBBoBCBoooooB',
    'BoooooooooCfoooooB',
    'BooooooooooBoooooB',
    'BooooooooooooooooB',
    'BooooooooooBoooooB',
    'BoooooDooooBoooooB',
    'BBBBBBBBBBBBBBBBBB'
  ];
  In.UPSTAIR = [6, 10]; In.DRAWER = [12, 2]; In.UPFIRE = [11, 6]; // (the stair head in the passage, over the top of the bar's stair (25,23); the bedside table in the big room; the big room's door off the passage at 11,8; its hearth)
  In.upMap = function () {
    return { id: In.UP, name: 'The Halfway Inn', rows: In.UPROWS.slice(), legend: { B: 'innWall', o: 'floorWood', z: 'bed', Z: 'bed', K: 'table', c: 'crate', C: 'chimney', D: 'stairsDown', f: 'firepit' }, music: 'inn', exits: {}, dark: false, npcs: [],
      lights: [{ id: 'hearthUp', kind: 'map', x: In.UPFIRE[0], y: In.UPFIRE[1], bright: 10, dim: 10, color: 'fire', flame: true, seep: true }],
      triggers: [{ id: 'stairdown', rect: [In.UPSTAIR[0], In.UPSTAIR[1], 1, 1], on: 'step', script: 'inn:down' }, { id: 'drawer', rect: [In.DRAWER[0], In.DRAWER[1], 1, 1], on: 'use', script: 'inn:drawer' }], chests: [] };
  };
  M.FLOORS[In.UP] = { src: In.UP, own: true, map: In.upMap, door: In.SITE, place: 'The Halfway Inn', sub: 'upstairs: the guest rooms', save: true, clock: true, iso: true, rate: In.RATE, phase: M.seepPhase, phaseLine: In.line,
    gates: { stair: [In.UPSTAIR[0], In.UPSTAIR[1] - 1, [0, -1]] } }; // (in at the stair head whatever the door: a floor laid with no square of its own to stand on had no entry -- the house's show, 11-04)
  // THE FLOOR UNDER THE THINGS INSIDE (11-05, the exteriors seat, on Griz's "it looks like all the props are drawn on code-drawn dirt instead of interior floor" and, again,
  // "the props appear to be drawn on the code-drawn dirt tile despite being inside"): a square that holds a thing -- a bed, a crate, a table, the tub, a stall's rail -- is
  // laid as the thing, and the open air's earth was painted under it. Every square in a house that is not its wall, a doorway, its chimney or its stair takes the house's
  // boards under it, a hearth's own square and the stone before its mouth dressed stone (js/iso.js `under`)
  In.UNDER = { h: '=', f: '=' };
  In.under = function (rows, inside, open) { // (open(x, y): the square's house is the one the party is in -- its walls cut to stubs stand on its boards, js/innprops.js, 11-05)
    return rows.map(function (r, y) { return r.split('').map(function (c, x) { return !inside(x, y) || 'DCoSu'.indexOf(c) >= 0 ? ' ' : c === 'B' || c === 'A' ? (open && open(x, y) ? 'o' : ' ') : In.UNDER[c] || 'o'; }).join(''); });
  };
  var floor0 = M.floor;
  M.floor = function (key, q, flags, hour) {
    if (key === In.UP) {
      var du = floor0.apply(this, arguments);
      du.under = In.under(In.UPROWS, function () { return true; }, function () { return true; });
      du.roofs = Object.assign({}, du.roofs, { v: { h: In.STUB, roof: 'leather', wall: 'stone' } }); du.hud = 'the Halfway Inn';
      du.hello = ['{y}THE HALFWAY INN{/} -- upstairs, on the grid\'s diamonds (' + du.w + ' x ' + du.h + ' squares).', In.LINES.upstairs, '{g}Click to walk, or the arrows. E: a word, a door. O: the formation. L: the floor map.{/}'];
      return du;
    }
    if (key !== In.KEY) return floor0.apply(this, arguments);
    In.inside = In.state !== undefined ? In.state : In.qInside(q); In.q = q || '';
    var h = hour != null ? hour : M.hourNow(q), def = floor0.call(this, key, q, flags, h); flags = flags || {};
    def.under = In.under(In.ROWS, In.inHouse, function (x, y) { return !!In.inside && In.inHouse(x, y) === In.inside; }); // (the boards under the things inside, and under the walls of the house the party is in: In.under)
    def.inside = In.inside || null; def.sub =In.inside === 'inn' ? 'the common room and the rooms' : In.inside === 'barn' ? 'the barn' : 'the yard and the shore'; def.hud = 'the Halfway Inn'; def.where = function () { return def.sub; }; // (the HUD's place line by the lay, not the floor's one sub)
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
    B.units.forEach(function (u) { if (u.npc === 'katarina') In.katSits(u); });
  };
  // KATARINA SAT WRITING BY THE FIRE (11-05, the Katarina seat, on cutter-1105's offer: her figure katarina_p1 has a sit row all round, "writing on a bench; the bench is drawn
  // with her"): on her square by the big fire (In.FOLK, 26,20, bare boards) she sits and writes, facing the hearth; spoken to, she turns to whoever speaks and stays sat
  // (js/town.js T.fire turns a figure drawn all round). Without the sheet, the stand-in as before
  In.KAT_FIRE = [27, 19];     // (the hearth's common-room face she writes toward)
  In.katSits = function (u) {
    var sh = u.sheet && D.SHEETS && D.SHEETS[u.sheet]; if (!sh || !sh.anims || !sh.anims.sit) return false;
    u.anim = 'sit'; u.animT = 0; u.facing = D.spr.facingFor(In.KAT_FIRE[0] - u.x, In.KAT_FIRE[1] - u.y); return true;
  };
  // a SAVE in a building stands the party a step out of its door, as a room's on Silverton's street (js/house.js H.atOf): the house's and upstairs the front door's, the barn's its own
  var atOf0 = D.house && D.house.atOf;
  if (atOf0) D.house.atOf = function (B) {
    var def = D.roam.def, t = B && B.roam && B.roam.token, b = def && t && def.key === In.KEY ? In.inHouse(t.x, t.y) : null, st = def && def.key === In.UP ? In.STEP.front : b ? In.STEP[b === 'barn' ? 'barn' : 'front'] : null;
    if (st) return { town: In.SITE, gate: 'west', sq: [st[0], st[1]], dir: st[2] };
    return atOf0.apply(this, arguments);
  };

  // ---------------------------------------------------------------- THE MEAL: supper at the long table, the first room taken (the lane's 11-04 §4-5)
  // the news by the day the party comes (the inn the road's ear): each word true or heard wrong by the asker's History, shown
  // THE SUPPER BY WHOSE EYES (11-05, the supper seat, on his word -- the inn lane's 2026-11-05 section, items 1-15): a turned conversation, five turns, the opener and four; at each
  // of the party's openings the player flips through the four (js/counter.js THE FLIP) and picks who answers and what; each hero's own silent reads (passives) above that hero's
  // answers that turn; one answer warms or cools the table (warm, civil, cold; cold ends supper), and the warmth lets the Waterbys go deepest; Lymen's tasked focus the gnolls
  In.MEAL = {
    open: 'Supper is lake fish at the long table. The Waterbys eat with their guests; it is that kind of house. Elsbeth carries and does not sit.',
    bands: [ // (RULED 11-05, his "rumors about the dominion involvement and the tribe movements before day 10": the Dominion at the moot, the tribes moving, the farmers harried
      // (RULED 11-04, days 7-9); from day 10 the farmers' stories of the made things (his "stories from farmers who found them staring at them when they woke"). RETIRED: the
      // one-eyed chief "came down out of the hills" on day 4 and the drover's "pack behind him, every one with the same eyes" -- he walks a beeline 26 mi off (the clock lane 11-05);
      // the day-8 reach re-cut to his "They've never snooted this far north" (Web Gulch is north of the inn: the Snoot north of it is the rumor heard wrong)
      { day: 1, id: 'heardMoot', who: 'Doran', ok: '"Gnolls held a moot up in the hills. Every tribe under one moon. Their king told the Dominion no, and they say he burned for it."',
        wrong: '"Gnolls had a moot in the hills. Fought among themselves, the drovers say, and the old king lost. Good riddance to him."' },
      { day: 2, id: 'heardDominion', who: 'Gennet', ok: '"They say there were Dominion people at that moot. Up there among them, under the moon. Nobody can tell me why."',
        wrong: '"Some say the Dominion paid the gnolls to fight each other. Drovers will say anything."' },
      { day: 4, id: 'heardTribes', who: 'Doran', ok: '"The tribes broke up after. One lot went south in a hurry, toward the Pit road. The rest went back up into the hills."',
        wrong: '"The tribes have all gone home, the drovers say. Back up into the hills, and good."' },
      { day: 7, id: 'heardFarmers', who: 'Doran', ok: '"Farmers off the edge farms came through, everything on one cart. Gnolls in the barley, they said. Young ones, and no chief with them."',
        wrong: '"Farmers running from wolves, by the sound of it. Farm folk would."' },
      { day: 8, id: 'heardReach', who: 'Doran', ok: '"The snooting parties are all going south now, toward the Pit. The silk-cutters at the Gulch have pulled in off the webs anyway."',
        wrong: '"A gnoll band is raiding up past the Gulch, they say. The silk-cutters have pulled in off the webs."' },
      { day: 8, id: 'heardHarbinger', who: 'Gennet', ok: '"Three men at that well this week told me of the same thing, and not one of them would put a name to it."' },
      { day: 10, id: 'heardMade', who: 'Doran', ok: '"Farm folk up Silverton way woke to find things standing over their beds. Like big dogs, they say, with eyes that throw your own face back at you. Just staring. The ones they stared at can barely stand."' },
      { day: 14, id: 'heardPit', who: 'Doran', ok: '"The Snoot\'s at the Pit. The road south is shut. Hessle in Silverton is paying gold for a true word of it."',
        wrong: '"There\'s trouble at the Pit, something with the gnolls. It\'ll blow over. It always does."' }
    ],
    mirror: { ok: '{y}The hand-mirror on her belt is a Dominion mender\'s: the glass they set bones by.{/} She sees you see it, and eats no more.',
      no: 'A small mirror on her belt, the kind a careful woman carries. She covers it with her hand.' },
    bed: 'TO BED',
    opener: '"What brings you down the road?"', // (RULED 11-05, the lean: his "one of the innkeeps asking why the party is coming")
    more: ['"Eat. Ask what you like; the whole road comes through this door."', '"More fish? There\'s plenty."', '"There\'s bread, if the fish is done."'], // (when the last answer ends on no one speaking)
    tell: { cool: 'Gennet\'s smile stays where it was.', warm: 'Gennet fills the cups again.', cold: '"You\'ll want your beds. It\'s an early road, whichever way you\'re going."' }, // (the warmth shown by a line, never a number)
    close: 'The fire is let down. Gennet takes the lamp from its hook by the lake door and hangs it again, the way a person touches wood.',
    TURNS: 5, CAP: 4, // (five turns, the opener and four; four answers a hero at most, and TO BED)
    DC: { History: 10, Persuasion: 12, Religion: 13, Arcana: 13, lie: 11 } // (lie: Gennet's passive Insight, WIS 13 -- data/foes.js gennet)
  };
  In.AB = { History: 'int', Insight: 'wis', Persuasion: 'cha', Religion: 'int', Perception: 'wis', Deception: 'cha', Arcana: 'int' };
  In.pinned = null; // (a show's dice, pinned: js/inn.js In.BEATS)
  // THE MEAL'S TABLE (11-04, the lanes desk; Griz at the pane: "Have the dinner reworked. It's returned to the default solid blue background and boxes. The council scene and
  // lymen/papa conversations look better", then "it's showing me 'doran' talking with the inn lady picture and aurdin's rolls in the main box" and "we want to show the main
  // room with people seated for dinner, and maybe decide what side the portrait shows while they're talking based on what side they're on in the background"): supper plays
  // on the open screen (js/counter.js THE OPEN SCREEN, its sides) over the common room as the camera has it -- the Waterbys and the party sat at the long table, the
  // traveler at the table for two -- the one speaking top left or top right by their seat, the hero whose die it was bottom on theirs with the die in their bubble.
  // THE TABLE OFF THE WALL (11-04, the Opus lanes desk; Griz after the supper on main: "Table is crammed up against a wall and everyone is on one side"): the long
  // table a row down (row 15, x 21-26) and sat on both sides, staggered -- the north side faces the camera (the lead, the inn lady in the middle, the second), the
  // south side shows its backs (the third, the fourth), the host at the west end; Gennet's own square by day (24,16) and the room beat's (24,17) stay free
  In.TABLE = { y: 15, seats: [[22, 14], [26, 14], [23, 16], [25, 16]], doran: [20, 15], gennet: [24, 14], kat: [22, 20], focus: [21.5, 13], mid: 23.5 }; // (the four's places, the north side first; the camera north-west of the table so the table sits in the screen's lower half, under the words' boxes, the six centred across the screen)
  In.sideOf = function (x) { return x <= In.TABLE.mid ? 'left' : 'right'; };
  In.sit = function (B) { // (everyone to the table; what to put back after)
    var R0 = B.roam, G = D.grid, kept = [], put = function (u, q, face) { if (!u) return; kept.push({ u: u, x: u.x, y: u.y, facing: u.facing }); u.x = q[0]; u.y = q[1]; u.tween = null; u.facing = D.spr.facingFor(face[0], face[1]); u.anim = 'idle'; u.animT = B.t; };
    var folk = {}; B.units.forEach(function (u) { if (typeof u.npc === 'string') folk[u.npc] = u; }); folk.gennet = folk.gennet || folk.gennetGrief;
    var four = [R0.token].concat(R0.rest || []).filter(function (u) { return u && u.src && !u.src.guest && u.hp > 0; }).slice(0, 4);
    four.forEach(function (u, i) { var q = In.TABLE.seats[i]; put(u, q, [0, q[1] < In.TABLE.y ? 1 : -1]); }); // (each faces the table: the north side south, the south side north)
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
  In.speaker = function (seat, id) { var u = seat.folk[id], SO = D.counter && D.counter.SHEETOF; return { name: id === 'doranIn' ? 'Doran' : id === 'gennet' ? In.named(seat.flags) : 'The traveler', unit: u || null, side: u ? In.sideOf(u.x) : 'right', sheet: (SO && SO[id] && SO[id]({ flags: seat.flags || {} })) || null }; }; // (sheet: the one speaking's drawn face where they have one -- js/counter.js C.SHEETOF, Doran's and Gennet's, Katarina's by In.FACE -- else their figure's, as before: 11-05, cutter-1105, on the lanes desk's word)
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
  // THE SUPPER'S READS: silent passives -- a hero whose 10 + skill reaches the DC sees it above that hero's answers the turn it comes (RULED 11-05: "would appear above vivian's
  // conversation options for that turn"); it opens that hero's follow-up (`opens`), and puts its mark on the save (`fx`) only if the player flipped to that hero while it showed.
  // The words are DRAFTS but where the game had them (the inn lane's 2026-11-05 section): his to cut in the show
  In.SUP = { FOUR: ['lymen', 'aurdin', 'vivian', 'barley'] };
  In.SUP.READS = {
    counted: { skill: 'Perception', dc: 15, opens: 'girl', text: '(perception) The girl in the kitchen doorway has counted you twice.', fx: function (S) { S.f.mealWrong = 1; } }, // (RULED 11-05: Perception 15, Vivian's 16 -- it was Insight 15, which no hero reached; Elsbeth at the tub without the dishes, M.SCENES.elsbeth)
    rich: { skill: 'Insight', dc: 12, opens: 'regular', text: '(insight) The house is too well kept for the traffic on this road. Somebody pays for it.' }, // (the game's, 11-04, as it was)
    coin: { skill: 'Perception', dc: 14, opens: 'coin', text: '(perception) Gennet\'s change for the rooms was old coin, older than any mint on this road.' }, // (the green purse, the lake's founding gift: TarlynsPit/wiki/halfway-inn-and-lake.md)
    pen: { skill: 'Insight', dc: 12, kat: true, text: '(insight) At "write it down right", the woman at the table for two stops her pen.', fx: function (S) { S.f.katPenSeen = 1; } }, // (his: "an insight regarding her if Aurdin says 'someone should write it down right'")
    years: { skill: 'Insight', dc: 13, opens: 'before', text: '(insight) Doran\'s story goes from the well to the wedding. There were years in between he leaves out.' },
    ring: { skill: 'Perception', dc: 14, opens: 'ring', text: '(perception) The ring on Gennet\'s hand is old, and was cut for a smaller finger.' }, // (Anwen's ring on Gennet's hand: the realm's, CANON 08-26)
    rite: { skill: 'Religion', dc: 13, opens: 'rite', text: '(religion) "The lake gives back" is not a saying. It is a response: the line a congregation says back.' } // (the lane's "Gennet's it gives back is theology, not talk")
  };
  // THE SUPPER'S ANSWERS: `turn1` the opener's alone, else the turns after; `who` the heroes who may say it (none: any); `say` the words by hero (`any` for one not of the four;
  // a function of the state for words that change); `read` a follow-up opened by that read, for the hero who read it; `when` open by the state; `first` put at the head of the
  // hero's list; `check` the asker's own die (`auto` a hero who needs none); `run` what the Waterbys say back (S.by, S.narr, S.reads, S.f); `warm` the step it moves the table.
  // Lymen's tasked focus (his: "always asking about the gnoll stuff"): the gnolls' answers are his, and the news anyone's
  In.SUP.ASK = [
    { id: 'council', turn1: true, who: ['lymen'], say: { lymen: 'Papa\'s council wants a true word on the gnolls. I\'m to carry it home.' },
      run: function (S) { S.f.mealTold = 'council'; S.by('doranIn', '"A true word." He sets his cup down. "There\'s none at this table. Rumors, all you like."'); } },
    { id: 'trade', turn1: true, who: ['vivian'], say: { vivian: 'We trade. Rope and cloth, down to the Pit and back. (deception)' }, check: { skill: 'Deception', dc: 'lie' },
      run: function (S, e, ok) { S.f.mealLie = ok ? 'held' : 'caught'; S.by('gennet', ok ? '"Traders. The Pit\'s good custom, when it\'s quiet."' : '"Traders." She looks at the swords, then at you. "Of course."'); }, warm: function (S, ok) { return ok ? 0 : -1; } },
    { id: 'work', turn1: true, who: ['barley'], say: { barley: 'Work. Wherever it is.' },
      run: function (S) { S.by('doranIn', '"Then you\'ve come down the wrong road." He likes the answer, all the same.'); } },
    { id: 'write', turn1: true, who: ['aurdin'], say: { aurdin: 'The moot. Someone should write it down right.' },
      run: function (S) { S.by('doranIn', '"Write it down? You\'d want the drovers, then, and no two of them tell it the same."'); S.reads(['pen']); } },
    { id: 'pass', turn1: true, say: { any: 'Passing through.' }, when: function (S, e) { return In.SUP.FOUR.indexOf(e.key) < 0; }, run: function (S) { S.by('gennet', '"Most do."'); } },
    // the gnolls: the road's news by the day (the asker's History: Lymen's or Aurdin's), then Lymen's steps
    { id: 'news', who: ['lymen', 'aurdin'], say: { lymen: 'What does the road say about the gnolls? (history)', aurdin: 'What do the drovers say of the hills since the moot? (history)' }, // (Lymen's focus, Aurdin's History: flip to the one who knows the hills to hear it right)
      check: { skill: 'History', dc: 'History' }, run: function (S, e, ok) { In.MEAL.bands.forEach(function (b) { if (S.d < b.day) return; var t = ok || !b.wrong; S.f[b.id] = t ? 'true' : 'wrong'; S.by(b.who === 'Doran' ? 'doranIn' : 'gennet', t ? b.ok : b.wrong); }); } },
    { id: 'come', who: ['lymen'], say: { lymen: 'Will they come this far?' }, when: function (S) { return !!S.asked.news; },
      run: function (S) { S.by('doranIn', S.d >= 14 ? '"They\'re at the Pit. They\'ve never come this far north, and now they\'ve less reason than ever."' : S.d >= 8 ? '"They\'ve never come this far north. It\'s the farms round the Pit they harry, and it\'s all south now, more every week."' : '"They\'ve never come this far north. It\'s the farms round the Pit they harry; there\'s more of them down there."'); S.by('gennet', '"The lake keeps us safe."'); } }, // (his: "They've never snooted this far north ... that gets increasingly true over time, the lake will keep us safe")
    { id: 'take', who: ['lymen'], say: { lymen: 'And if they do come?' }, when: function (S) { return !!S.asked.come && S.warm >= 2; },
      run: function (S) { S.f.heardLakeTake = 1; S.by('gennet', '"If they come, the lake will take them."'); S.narr('Doran looks at his plate.'); } }, // (his deepest: "if they come the lake will take them")
    { id: 'word', who: ['lymen'], say: { lymen: 'Papa\'s council wants a true word on the Snoot. Where do I get one?' },
      run: function (S, e) { S.f.pointedSouth = 1; S.by('doranIn', S.d >= 14 ? '"The road south is shut. If there\'s a true word, it\'s inside the Pit, and the Pit\'s asking for every blade."' : S.d >= 8 ? '"South. The drovers up from the Pit don\'t stop to water any more. That\'s your true word: they don\'t stop."' : '"Not here, not yet. Whatever\'s true comes up from the Pit first, and the Pit\'s a long day south. Go and look, if your father wants it true."'); } }, // (RULED 11-04: the council's true word south past the inn; Doran backs it)
    { id: 'mend', who: ['lymen'], say: { lymen: 'Forgive us. It\'s a long road, and we\'ve forgotten our table manners. (persuasion)' }, first: function () { return true; }, when: function (S) { return S.warm < 2; }, check: { skill: 'Persuasion', dc: 'Persuasion' },
      run: function (S, e, ok) { S.asked.mend = 0; if (ok) S.by('gennet', '"There\'s nothing to forgive. Eat."'); else S.by('doranIn', '"Mm."'); }, warm: function (S, ok) { return ok ? 1 : 0; } }, // (his: "maybe he gets a persuasion response if the 'innkeeper friendly' starts to drift south"; asked again whenever it drifts)
    { id: 'eyes', who: ['aurdin'], say: { aurdin: 'Eyes that throw your face back? That isn\'t a dog. (arcana)' }, when: function (S) { return S.f.heardMade === 'true'; }, check: { skill: 'Arcana', dc: 'Arcana' },
      run: function (S, e, ok) { if (ok) { S.f.eyesMade = 1; S.narr('{c}(arcana) Eyes that give your own face back are not an animal\'s. Something was made, or made over.{/}'); S.by('gennet', '"Not on this side of the water."'); } else S.narr('Nobody at the table has an answer for that.'); } },
    // the inn: the house, then what the reads open (his: "they 'could' find out about him losing his wife and son, the lake providing a new wife, her way with 'local spirits'")
    { id: 'girl', read: 'counted', say: { vivian: 'Your girl counts heads.', any: 'Your girl keeps a tally of us.' },
      run: function (S) { S.f.mealWrong = 1; S.by('gennet', '"She counts plates."'); S.narr('Elsbeth takes the plates through to the tub and stays there. Alone, she might say more.'); } }, // (RULED 11-05: she counts who will be in the house the night the wagon comes; the tub is where she says it)
    { id: 'coin', read: 'coin', say: { vivian: 'Old silver, that change. Where\'s it from?', any: 'Old coin, that. Where\'s it from?' },
      run: function (S) { S.f.heardCoin = 1; S.by('gennet', '"The lake gives back."'); S.reads(['rite']); } },
    { id: 'ring', read: 'ring', say: { vivian: 'That\'s an old ring.', any: 'That\'s an old ring you wear.' },
      run: function (S) { S.f.heardRing = 1; S.by('gennet', '"It came back out of the lake. The lake gives back."'); if (S.warm >= 2) S.by('gennet', '"It was his first wife\'s. It came up on the flat stone the morning after the wedding."'); S.reads(['rite']); } },
    { id: 'before', read: 'years', say: { barley: 'You\'ve lost someone.', any: 'There was someone before Gennet.' },
      run: function (S) { S.f.heardAnwen = 1; S.by('doranIn', '"Anwen. My first. Gone the third night." He drinks. "And our Tobin. Fourteen."'); if (S.warm >= 2) { S.f.heardLakeWife = 1; S.by('gennet', 'Her hand on his. "The lake took them. And it gave him me."'); } } }, // (Anwen and Tobin the realm's, CANON 08-26; the lake giving him a wife his, 11-05)
    { id: 'rite', read: 'rite', say: { aurdin: 'That\'s a response, "it gives back." What do you say it to?', any: 'You say that like a prayer.' },
      run: function (S) { S.f.heardRite = 1; S.by('gennet', '"Someone has to speak to the spirits here, or they speak to you."'); if (S.warm >= 2) { S.f.heardLamp = 1; S.by('gennet', '"The lamp by the lake door is for it. On its nights, we light it."'); } } }, // (the Due's lantern: the realm's, CANON 08-27)
    // the traveler (his: "questions pointed at Kat cool the conversation"): her mirror, the game's, at the cost of a step -- ahead of the house and the Dominion in a hero's four
    { id: 'mirror', who: ['barley', 'aurdin', 'vivian'], say: { barley: 'That glass on your belt. You\'re with the Dominion.', aurdin: 'Is that a scrying glass on your belt? (religion)', vivian: 'Nice glass. Not a vain woman\'s, though. (religion)', any: 'That\'s a fine glass on your belt. (religion)' },
      when: function (S) { return S.kat; }, check: { skill: 'Religion', dc: 'Religion' }, auto: function (S, e) { return e.key === 'barley' ? '{y}Barley knows it on sight.{/}' : null; }, // (Barley knows a Dominion mender's glass: he was one of theirs)
      run: function (S, e, ok) { if (ok) S.f.katMirror = 1; S.by('katarina', ok ? In.MEAL.mirror.ok : In.MEAL.mirror.no); }, warm: -1 },
    { id: 'house', who: ['barley', 'aurdin', 'vivian'], say: { barley: 'Good stone. Who built the place?', aurdin: 'How old is the house?', vivian: 'How long have you kept the place?', any: 'Tell us about the inn.' },
      run: function (S) { S.by('doranIn', '"The lake was here first, and named the place. The only well on the road: everyone stops."'); S.by('gennet', '"Waterby, since the wedding."'); S.reads(['years', 'ring']); } },
    // the Dominion (his: "met with all become naught but travelers at the half-way inn, or they aren't welcomed back - to deepest arrangements are sometimes made with repeat guests on schedules")
    { id: 'dom', who: ['barley', 'aurdin', 'vivian'], say: { barley: 'I was one of theirs, once. Does the Dominion stop here?', aurdin: 'There were Dominion at the moot, they say. Any come this way?', vivian: 'Any Dominion custom out here?', any: 'Does the Dominion come through here?' },
      run: function (S, e) { S.by('gennet', '"There\'s no Dominion under this roof, and no Hex. All are naught but travelers at the Halfway Inn, or they\'re not welcome back."'); if (e.key === 'barley' && S.kat) { S.f.katHeardBarley = 1; S.narr('At the table for two, the traveler\'s pen stops.'); } } },
    { id: 'regular', who: ['barley', 'aurdin', 'vivian'], say: function (S, e) { return !S.asked.dom ? 'Somebody keeps this house in coin.' : e.key === 'vivian' ? 'Not even the ones who pay?' : 'Not even the regulars?'; },
      when: function (S, e) { return !!S.asked.dom || !!(S.opened[e.key] || {}).regular; }, first: function (S, e) { return !S.asked.dom; },
      run: function (S) { if (S.warm >= 2) { S.f.heardArrangements = 1; S.by('doranIn', '"Arrangements get made, sometimes. With guests who come back regular, on a schedule."'); S.narr('Gennet looks at him, and he says no more.'); } else S.by('doranIn', '"Travelers do. Everyone stops at the only well."'); } }
  ];
  In.passive = function (h, skill) { return 10 + DS.R.skill(h, skill, In.AB[skill]); };
  In.meal = function* (sc, B, seat) {
    var st = sc.st, f = st.flags, d = In.day(D.roam.q), MD = In.MEAL, SU = In.SUP, who = function (id) { return In.speaker(seat, id); };
    var four = seat.four.filter(function (u) { return u.src && !u.src.dead && !u.src.ko; }).map(function (u) { return { u: u, h: u.src, key: u.src.key || u.src.id, hero: In.heroOf(u), side: In.sideOf(u.x) }; });
    var S = { f: f, d: d, warm: 2, asked: {}, opened: {}, cur: ['counted', 'rich', 'coin'], out: [], kat: In.katHere(f, d) && !!seat.folk.katarina, at: 0, turn: 0, done: {} };
    S.by = function (id, line) { S.out.push({ by: id, line: line }); }; S.narr = function (line) { S.out.push({ narr: line }); }; S.reads = function (ids) { S.cur = S.cur.concat(ids); };
    f.mealHad = 1; f.mealDay = d;
    yield sc.narr([MD.open]);
    var readsOf = function (e) { // (this turn's reads that hero sees; each opens its follow-up for that hero)
      return S.cur.map(function (id) { return { id: id, r: SU.READS[id] }; }).filter(function (x) { return x.r && (!x.r.kat || S.kat) && In.passive(e.h, x.r.skill) >= x.r.dc; })
        .map(function (x) { if (x.r.opens) (S.opened[e.key] = S.opened[e.key] || {})[x.r.opens] = 1; return x; });
    };
    var optsOf = function (e) { // (the hero's answers this turn: the follow-ups first, at most MD.CAP, then TO BED)
      var ok = SU.ASK.filter(function (o) {
        if (!!o.turn1 !== (S.turn === 1) || S.asked[o.id]) return false;
        if (o.who && o.who.indexOf(e.key) < 0) return false;
        if (o.read && !(S.opened[e.key] || {})[o.id]) return false; // (opened by its read: READS[o.read].opens is this answer's id)
        if (o.when && !o.when(S, e)) return false;
        return !!(typeof o.say === 'function' ? o.say(S, e) : o.say[e.key] || o.say.any);
      });
      var lead = ok.filter(function (o) { return o.read || (o.first && o.first(S, e)); }), rest = ok.filter(function (o) { return lead.indexOf(o) < 0; });
      return lead.concat(rest).slice(0, MD.CAP).map(function (o) { return { o: o, label: typeof o.say === 'function' ? o.say(S, e) : o.say[e.key] || o.say.any }; }).concat([{ o: null, label: MD.bed }]);
    };
    var prompt = { by: 'gennet', line: MD.opener }, fill = 0;
    for (S.turn = 1; S.turn <= MD.TURNS && four.length; S.turn++) {
      var list = four.map(function (e) { var rs = readsOf(e); return { e: e, rs: rs, hero: e.hero, side: e.side, key: e.key, reads: rs.map(function (x) { return x.r.text; }), opts: [] }; });
      list.forEach(function (x) { x.ops = optsOf(x.e); x.opts = x.ops.map(function (p) { return p.label; }); x.ids = x.ops.map(function (p) { return p.o ? p.o.id : 'bed'; }); }); // (ids: a bench's 'hero:id' pick -- dev/bench16.js flipPick)
      list.forEach(function (x) { x.rs.forEach(function (y) { In.trail(x.e.hero.name + ' passive ' + y.r.skill + ' ' + In.passive(x.e.h, y.r.skill) + ' vs DC ' + y.r.dc + ', read: ' + y.id); }); });
      var pk = yield sc.flip(who(prompt.by), [prompt.line], list, S.at), x = list[pk && pk.at != null ? pk.at : S.at] || list[0], p = x.ops[pk && pk.k != null ? pk.k : x.ops.length - 1] || x.ops[x.ops.length - 1];
      ((pk && pk.seen) || [S.at]).forEach(function (i) { (list[i] ? list[i].rs : []).forEach(function (y) { if (y.r.fx && !S.done[y.id]) { S.done[y.id] = 1; y.r.fx(S); } }); }); // (a read's mark only where the player looked)
      S.at = list.indexOf(x); S.cur = [];
      if (!p.o) break; // (TO BED: the turns left are lost)
      var o = p.o, e = x.e, ok = true; S.asked[o.id] = 1; S.out = []; sc.hero = e.hero; sc.heroSide = e.side;
      In.trail(e.hero.name + ': ' + D.counter.flipSaid(p.label));
      if (o.check) {
        var au = o.auto && o.auto(S, e), ck = o.check, dc = typeof ck.dc === 'string' ? MD.DC[ck.dc] : ck.dc;
        var chk = au ? { ok: true, line: au } : In.check(st, ck.skill, dc, { h: e.h, v: DS.R.skill(e.h, ck.skill, In.AB[ck.skill]) });
        ok = chk.ok; sc.echo = (sc.echo || []).concat(chk.line ? [chk.line] : []); // (the die in the bubble under the hero's words)
      }
      o.run(S, e, ok);
      var dw = typeof o.warm === 'function' ? o.warm(S, ok, e) : (o.warm || 0), w0 = S.warm; S.warm = Math.max(0, Math.min(2, S.warm + dw));
      if (S.warm !== w0) { In.trail('the table ' + ['cold', 'civil', 'warm'][S.warm]); if (S.warm > 0) S.narr(S.warm > w0 ? MD.tell.warm : MD.tell.cool); }
      f.mealWarm = S.warm;
      var last = S.turn < MD.TURNS && S.warm > 0 && !o.check && S.out.length && S.out[S.out.length - 1].by ? S.out.pop() : null; // (the last word the next turn's question, the reads on it -- but a die's answer said whole, the die in the bubble beside it)
      for (var i = 0; i < S.out.length; i++) yield S.out[i].narr ? sc.narr([S.out[i].narr]) : sc.by(who(S.out[i].by), [S.out[i].line]);
      if (S.warm <= 0) { sc.echo = null; yield sc.by(who('gennet'), [MD.tell.cold]); break; } // (cold: supper ends early)
      prompt = last || { by: 'gennet', line: MD.more[fill++ % MD.more.length] };
    }
    sc.hero = null; sc.echo = null;
    yield sc.narr([MD.close, In.LINES.bed]);
  };

  // ---------------------------------------------------------------- the people: the inn lady's room, Elsbeth at the tub (the first game's S.gennet, S.elsbeth on the counter screen)
  In.has = function (st, id) { return D.counter.count(st, id) > 0 || st.party.some(function (h) { return h.equip && Object.keys(h.equip).some(function (s) { return h.equip[s] === id; }); }); };
  In.heads = function (B) { return ((B.roam && B.roam.members) || []).filter(function (u) { return u.src && !u.src.guest; }).length || 1; };
  // the rooms from Doran after the second act's ends (the lane's §10.3 beat 5): the due stopped, Gennet keeps her back to the room and sells nothing; Gennet killed, "You'll want the road" and no rooms again
  In.doranRoom = function* (sc, B) {
    var st = sc.st, f = st.flags, A = D.secondact, cost = In.PRICE * In.heads(B);
    if (f.gennetDead) { yield sc.say([].concat(M.words(B, 'doranIn'), A ? [A.LINES.doranRoad] : [])); return false; }
    yield sc.say(M.words(B, 'doranIn'));
    return yield* In.room(sc, B, cost, true); // (the hour's rules as hers; no supper scene from him -- In.room)
  };
  // THE INN'S REST HOURS (11-05, the Katarina seat; Griz to the lanes desk, verbatim: "Resting at the Inn costs 11 hours instead of 8 if 'dinner' is activated (not cold) and
  // party triggers between 3 pm and 10 pm. 10pm to 6 am gets rest and triggers no dinner, spends 8 hours. Trying to rest at the inn in the 6 am until 4 pm results in 'dinner
  // is at 8' with a 'short rest' 'wait til dinner' or 'not now' option with 'wait til dinner' ending at waking 11 hours after 3 pm."; on the desk's two questions, RULED: "1 -
  // lean / i was being too generous re: #2, 7 am it is."): a room taken from 3 pm to 10 pm has supper and a night of eleven hours from then; from 10 pm to 6 am the kitchen
  // is cold -- no supper, eight hours; from 6 am to 3 pm, "Dinner is at eight": SHORT REST (an hour by the fire), WAIT TIL DINNER (the room paid, the clock on to eight,
  // supper, eleven hours: 7 am), NOT NOW. The numbers here, his to move
  In.REST = { dayFrom: 6, dinnerFrom: 15, dinnerTo: 22, dinnerAt: 20, dinnerHours: 11, lateHours: 8, shortHours: 1 };
  In.restKind = function (h) { h = ((h % 24) + 24) % 24; return h >= In.REST.dinnerFrom && h < In.REST.dinnerTo ? 'dinner' : h >= In.REST.dayFrom && h < In.REST.dinnerFrom ? 'day' : 'late'; };
  In.hourOf = function (B) { return M.hourNow(D.roam.q, B); };
  In.clock = function (B) { var W = D.world, S = W.state && W.state(); return D.roam.house() && D.house.playing && S ? S.t : (In.day(D.roam.q) - 1) * 24 + In.hourOf(B); }; // (the house's clock; a test door's its day and hour)
  // the clock on to an hour later this day (the house's, or the test door's own), the floor laid for it
  In.waitTo = function (B, hour) {
    var W = D.world, S = W.state && W.state(), now = In.hourOf(B); if (hour <= now) return;
    if (D.roam.house() && D.house.playing && S) { D.house.fromFloor(B); S.t += hour - now; W.save(); } else B.roam.hour = hour;
    M.lightNow(B);
  };
  // a short rest at the inn: an hour by the fire, the hit dice spent (js/house.js H.shortRest)
  In.shortRest = function (B) {
    var H = D.house, W = D.world, house = !!(D.roam.house() && H.playing), sheets, lines;
    if (house) { H.fromFloor(B); var S = W.state(); S.t += In.REST.shortHours; W.save(); sheets = H.cur.party; } else { B.roam.hour = (In.hourOf(B) + In.REST.shortHours) % 24; sheets = In.sheetsOf(B); }
    lines = H.shortRest(sheets.filter(function (h) { return !h.dead; }));
    In.resheet(B, sheets); M.lightNow(B);
    return lines;
  };
  // a room asked for (the inn lady's, or Doran's after the second act): by the hour -- 'meal' (the first supper, THE MEAL's own screen next), 'dinner', 'bed', or false; the
  // night's start and length kept on the floor (B.roam.stay) for the bed and the wagon night. noMeal: the supper as a line, not THE MEAL's scene
  In.room = function* (sc, B, cost, noMeal) {
    var st = sc.st, f = st.flags, kind = In.restKind(In.hourOf(B)), pay = function () { if (st.silver() < cost) { D.sfx('error'); return false; } st.silver(-cost); D.sfx('coin'); return true; };
    if (kind === 'day') {
      var a = yield sc.ask(In.LINES.dinnerAt8.split('{n}').join(cost), [In.LINES.opts.short, In.LINES.opts.wait, In.LINES.opts.notNow]);
      if (a === 0) { var ls = In.shortRest(B); yield sc.say([In.LINES.shortRest].concat(ls)); return false; }
      if (a !== 1) return false;
      if (!pay()) { yield sc.say(L('g.poor')); return false; }
      In.waitTo(B, In.REST.dinnerAt); kind = 'dinner';
      yield sc.say(In.LINES.waited);
    } else {
      var a2 = yield sc.ask(L('inn.stayAsk', { n: cost }), ['STAY THE NIGHT', 'NO']);
      if (a2 !== 0) return false;
      if (!pay()) { yield sc.say(L('g.poor')); return false; }
    }
    B.roam.stay = { t0: In.clock(B), hours: kind === 'dinner' ? In.REST.dinnerHours : In.REST.lateHours, kind: kind };
    if (D.house && D.house.trail) D.house.trail('rest', 'the Halfway Inn: a room at ' + In.hourOf(B) + ':00, ' + (kind === 'dinner' ? 'supper and ' : 'no supper, ') + B.roam.stay.hours + ' hours');
    if (kind === 'dinner') { if (!f.mealHad && !noMeal) return 'meal'; yield sc.say(In.LINES.dinner); return 'dinner'; } // (the first room with supper: THE MEAL's screen, then the bed line there)
    yield sc.say(In.LINES.late); return 'bed';
  };
  In.gennet = function* (sc, B) {
    var st = sc.st, f = st.flags, cost = In.PRICE * In.heads(B), A = D.secondact;
    if (f.dueStopped && A) { yield sc.say([].concat(M.words(B, 'gennet'), [A.LINES.gaveBack, A.LINES.noRoom])); return false; } // (the due stopped on the path: no room from her; Doran sells)
    var d = In.day(D.roam.q), soon = !In.isWagonDay(d) && f.wagonCycle == null && !f.wagonNamed ? [In.WN.soon] : []; // (any other night: the month's wagon named without being named -- the lane's 11-04 §3 (d))
    if (soon.length) f.wagonNamed = 1;
    if (!f.gennetNamed) { f.gennetNamed = 1; yield sc.say([].concat(M.words(B, 'gennet'), [In.LINES.name], soon)); }
    else yield sc.say([].concat(M.words(B, 'gennet'), soon));
    return yield* In.room(sc, B, cost); // (by the hour, In.REST: the first room with supper is THE MEAL -- its own screen over the room, In.mealScene, then the bed line there)
  };
  // ---------------------------------------------------------------- KATARINA AT THE FIRE (11-05, the Katarina seat, kat-1105: the lane's item 10, built whole with the wagon's
  // move; the first game's S.katarina -- RULED 10-01c, Griz: "First time Barley in party when talk to Kat, only if before wagon event has been triggered, Barley says 'You're
  // with the Dominion' - Kat breaks into: My deity gave me a vision, and when it ended I had used up all my ink. If you bring me another bottle, I'll tell you the vision ... If
  // they have ink then, or manage to get her some before she vanishes from play in one of the various ways, she say her vision was of Aurdin laughing, and gives the party how
  // he'll learn hideous laughter. Can be the same time she hands over the book. Not there if they get the book out of the drawer thing."; RULED 09-24: the book given the
  // day after, and south). Barley's first time at her table before the wagon's night: the Dominion, the ink; the ink given: the vision, the Sheet: Hideous Laughter (Aurdin's
  // to learn -- js/house.js FD.item -- and the joke egg's road, js/grimoire.js M.jokeReady); till it comes: the ink waited on. Her last day (In.katLast): the book, the vision
  // with it if the ink came in time, then south. Around the errand her talk at the fire -- the lane's §7 drafts (RULED 09-24: the drafts stand): what she is, the road south,
  // what she saw (Persuasion 12, 15 the hard tier, shown; Barley's word opens the first, the vision told both), Amara once the wagon is known, the message she carried once
  // the wagon has come and Insight 13 caught her and Amara at the greeting. The words content/text.json kat.*, the first game's; the seat's invented.json halfway-katarina
  In.KL = {
    look: 'She does not look up. "The room over the kitchen is mine till I\'m fetched. Paid ahead. I don\'t want anything."', // (the lane's §7 first look, re-drafted for the longer stay: it was "till the morning after next")
    prompt: 'She keeps her place in the book with one finger.',
    asks: { what: 'ASK WHAT SHE IS', road: 'ASK ABOUT THE ROAD SOUTH', saw: 'ASK WHAT SHE SAW', amara: 'ASK ABOUT AMARA', message: 'ASK WHAT SHE CARRIED', leave: 'LEAVE HER TO HER BOOK', go: 'LET HER GO' },
    what: '"A mender. I set bones and I write things down." A beat. "Those are the same work, mostly."',
    road: '"Seven off the last farm walked with us a day. Bound for the Pit, they said, as if it were a place you could be bound for." She closes the book over her hand.',
    saw1: '"There was a moot. Every tribe under one moon. A king said no to the people I came with, and the people I came with burned him where he stood." She turns the pen over. "Then they made something. I didn\'t look. Everyone who looked is still looking."',
    saw2: '"It went north before dawn, and the dogs went with it. If you meet one on the road whose eyes show you yourself, don\'t look long."',
    sawNo: 'She turns the pen over, and over, and does not answer.',
    amara: '"I knew her before she had wagons. She was kind, then." She does not say more, and will not.',
    message: '"I carried a dozen words for a woman who was kind to me when I was a girl. I don\'t know what they mean. I think she does."',
    knew: '{c}(insight) The traveler and Amara know each other. Neither of them says so.{/}',
    DC: { saw: 12, saw2: 15, knew: 13 }
  };
  // HER FACE BY NAME (11-05, the desk: "Build her talk so a portrait can drop in by name", her art in from the art desk, art-wanted section 35, the cutter cutting it): her
  // talk is the counter screen with id 'katarina', and its portrait is the first of these that is a sheet -- none yet, the screen as it was; the cutter's page by any name
  // here shows on her every line at the fire with nothing else changed (js/counter.js C.SHEETOF, as Elsbeth's pt_elsbethtub at the tub)
  In.FACE = { katarina: ['pt_katarina', 'pt_kat'] };
  if (D.counter && D.counter.SHEETOF) D.counter.SHEETOF.katarina = function () { var ns = In.FACE.katarina || []; for (var i = 0; i < ns.length; i++) if (D.SHEETS && D.SHEETS[ns[i]]) return ns[i]; return null; };
  In.barleyIn =function (st) { return st.party.some(function (h) { return (h.key || h.id) === 'barley' && !h.dead && !h.ko && !h.guest; }); };
  // what she will be asked now (each once a visit): what she saw while there is more to hear, Amara once the wagon is known, the message once it has come and the read caught them
  In.katOpts = function (f, asked) {
    var free = f.katVision ? 2 : f.katInk ? 1 : 0, out = ['what', 'road'];
    if (f.katSaw == null || free > f.katSaw) out.push('saw');
    if (f.wagonMet || f.wagonCycle != null) out.push('amara');
    if (f.katKnewAmara && f.wagonCycle != null) out.push('message');
    return out.filter(function (a) { return !asked[a]; });
  };
  // what she saw: Barley's word opens the first tier, the vision told both; else one roll ever, the party's best Persuasion, shown -- 12 the first, 15 the hard tier
  In.katSaw = function (st, f) {
    var free = f.katVision ? 2 : f.katInk ? 1 : 0, out = [];
    if (f.katSaw == null && free < 2) {
      var b = In.best(st, 'Persuasion'), r = In.d20(), v = b ? b.v : 0, tot = r + v, nm = b ? (b.h.name || b.h.id) : 'The party', tier = tot >= In.KL.DC.saw2 ? 2 : tot >= In.KL.DC.saw ? 1 : 0;
      if (D.house && D.house.trail) D.house.trail('check', 'THE TRAVELER: ' + nm + ' Persuasion ' + r + (v >= 0 ? ' + ' : ' - ') + Math.abs(v) + ' = ' + tot + ' vs DC ' + In.KL.DC.saw + '/' + In.KL.DC.saw2 + ', tier ' + tier);
      out.push('{y}' + nm + ': Persuasion ' + r + (v >= 0 ? ' + ' : ' - ') + Math.abs(v) + ' = ' + tot + '{/}');
      f.katSaw = Math.max(free, tier);
    } else f.katSaw = Math.max(f.katSaw || 0, free);
    return out.concat(f.katSaw >= 1 ? [In.KL.saw1] : [In.KL.sawNo], f.katSaw >= 2 ? [In.KL.saw2] : []);
  };
  In.katAsks = function* (sc, st, f, end) {
    var asked = {};
    for (var k = 0; k < 8; k++) {
      var acts = In.katOpts(f, asked); if (!acts.length) return;
      var i = yield sc.ask(In.KL.prompt, acts.map(function (a) { return In.KL.asks[a]; }).concat([end]));
      if (i == null || i >= acts.length) return;
      var a = acts[i]; asked[a] = 1;
      yield sc.say(a === 'saw' ? In.katSaw(st, f) : In.KL[a]);
    }
  };
  // the ink given: the vision told, and the page she wrote it on (the first game's katVision)
  In.katVision = function* (sc, st, f) {
    D.counter.take(st, 'ink', 1); f.katVision = 1;
    yield sc.say(L('kat.inkGiven'));
    yield sc.say(L('kat.vision'));
    D.counter.give(st, 'sheet_hideouslaughter', 1); D.sfx('chest');
    yield sc.say(L('g.got', { item: DS.DATA.items.sheet_hideouslaughter.name }));
  };
  In.katScene = function* (sc, B) {
    var st = sc.st, f = st.flags, d = In.day(D.roam.q), ink = function () { return D.counter.count(st, 'ink') > 0; };
    if (In.katLast(f, d)) { // her last day: the book across the table, the vision with it if the ink came in time, her talk, then south
      f.katGone = 1; f.katGave = 1; D.counter.give(st, 'katbook', 1); D.sfx('chest');
      yield sc.say(L('kat.gives'));
      yield sc.say(L('g.got', { item: DS.DATA.items.katbook.name }));
      if (f.katInk && !f.katVision && ink()) yield* In.katVision(sc, st, f);
      yield* In.katAsks(sc, st, f, In.KL.asks.go);
      yield sc.say(L('kat.south'));
      M.later(B, function () { M.relay(B, null, true); }); // (the floor laid again without her)
      return;
    }
    if (!f.katInk && In.barleyIn(st) && f.wagonCycle == null) { // Barley, the first time he is at her table, and only before the wagon's night
      f.katInk = 1; f.katLooked = 1;
      yield sc.say(In.who('Barley', L('kat.dominion')));
      yield sc.say(L('kat.ink'));
      if (ink()) yield* In.katVision(sc, st, f);
      return;
    }
    if (f.katInk && !f.katVision && ink()) { yield* In.katVision(sc, st, f); return; }
    var open = M.words(B, 'katarina'); if (!f.katLooked) { f.katLooked = 1; open = open.concat([In.KL.look]); }
    if (f.katInk && !f.katVision) open = open.concat([L('kat.inkWait')]);
    yield sc.say(open);
    yield* In.katAsks(sc, st, f, In.KL.asks.leave);
  };
  // the night: the house's bed to the morning (the first night's wagon is the lane's item 2), the floor laid at the morning's hour under the morning card
  // (11-05: a room taken by In.room sleeps its night's hours -- eleven from the hour it was taken with supper, eight without, the wagon night's hours already spent counted
  // off -- and wakes to the card the hour says (MORNING, or NIGHT for a room taken at three); a night with no room behind it, to the next morning as before)
  In.sleep = function* (B, line) {
    var stay = B.roam.stay, hours = null, wk = null; B.roam.stay = null;
    if (stay) { hours = Math.max(1, stay.t0 + stay.hours - In.clock(B)); wk = M.wakeAt ? M.wakeAt((In.hourOf(B) + hours) % 24) : null; }
    yield* D.house.sleepOnFloor(B, { line: line || (wk && wk.title === 'NIGHT' ? In.LINES.night : In.LINES.morning), hours: hours, title: wk ? wk.title : null, music: 'inn', before: function () { M.lightNow(B); } });
  };
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
    soon: '"Once a month there\'s a wagon through," Gennet says. "Good custom."', // (11-05, the Katarina seat: "End of the month" no longer fit -- the first wagon is day 12, a week into the realm's September; invented.json halfway-katarina)
    // the night played on the floor (11-04 later, his words at the pane: the seat's drafts, invented.json halfway-wagon-night-played)
    feeling: '"Something sits wrong with me tonight," Lymen says, and will not say what. "Call it a feeling. I\'d set a watch, turn and turn about -- I\'d sleep easier knowing who has the window."', // (11-05, the Katarina seat, on his "Lymen says something about having a weird feeling and wanting to put up a watch": invented.json halfway-inn-rest)
    rested1: '{names} stood the first watch and slept short.', rested2: '{names} {has} the window now.', rested3: '{names} {sleeps} on, the third watch to come.', // (11-05: who rested how, by name; {has} {sleeps} by how many)
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
  // asg (11-05, the wagon night's watches, his word above): the rest by the watch -- the first watch a short rest (js/house.js H.shortRest), the others the long rest's mechanics
  // (H.restSheets: whole, the hit dice back, a banked level), no morning page; without it, all of them the long rest as before
  In.lieDown = function* (B, hours, title, line, asg) {
    var R = D.roam, R0 = B.roam, H = D.house, W = D.world, house = !!(R.house() && H.playing), sheets;
    var byWatch = function (party) { var sh = party.filter(function (h) { return !h.dead && asg[h.key || h.id] === 1; }); return { long: party.filter(function (h) { return sh.indexOf(h) < 0; }), short: sh }; };
    var restBy = function (party) { var p = byWatch(party); H.trail('rest', 'the wagon night: a long rest (' + p.long.map(function (h) { return h.name; }).join(', ') + '), a short rest (' + p.short.map(function (h) { return h.name; }).join(', ') + ')'); H.restSheets(p.long); H.shortRest(p.short); };
    if (house) { H.fromFloor(B); var S = W.state(); S.t += hours; S.today = 0; S.todayHex = 0; S.pushing = false; W.save(); sheets = H.cur.party; if (asg) { DS.G = { flags: H.cur.flags }; restBy(sheets); H.dry(H.cur.inv); } else H.longRest(null); }
    else { R0.hour = ((R0.hour != null ? R0.hour : M.hourNow(R.q, B)) + hours) % 24; sheets = In.sheetsOf(B); if (asg) restBy(sheets); else H.restSheets(sheets); }
    In.resheet(B, sheets);
    R0.slept = (R0.slept || 0) + 1;
    M.lightNow(B);
    yield* In.card(B, ['{y}' + title + '{/}'].concat(line), 420);
  };
  // the floor's figures as sheets (outside the house: copies, their hit points and slots as they stand), and the rested sheets back on the figures
  In.sheetsOf = function (B) { return B.roam.members.filter(function (u) { return u.src; }).map(function (u) { var sh = JSON.parse(JSON.stringify(u.src)); sh.hp = Math.max(0, u.hp); sh.slots = (u.slots || sh.slots || []).slice(); return sh; }); };
  In.resheet = function (B, sheets) {
    var R = D.roam, byKey = {}; sheets.forEach(function (h) { byKey[h.key || h.id] = h; });
    B.roam.members.forEach(function (u) { var sh = u.src && byKey[u.src.key || u.src.id]; if (sh) { u.src.conds = JSON.parse(JSON.stringify(sh.conds || {})); R.resheet(B, u, sh); } }); R.regear(B);
  };
  // who rested how, by name (no pronouns): the first watch short of sleep, the second at the window, the third asleep
  In.restedLine = function (party, asg, keyOf) {
    var by = [1, 2, 3].map(function (k) { return party.filter(function (u) { return asg[keyOf(u)] === k; }).map(function (u) { return u.name; }); });
    var put = function (s, ns) { return ns.length ? s.split('{names}').join(ns.length > 1 ? ns.slice(0, -1).join(', ') + ' and ' + ns[ns.length - 1] : ns[0]).split('{has}').join(ns.length > 1 ? 'have' : 'has').split('{sleeps}').join(ns.length > 1 ? 'sleep' : 'sleeps') : ''; };
    return [put(In.WN.rested1, by[0]), put(In.WN.rested2, by[1]), put(In.WN.rested3, by[2])].filter(function (s) { return s; }).join(' ');
  };
  // the lead back in front once the house is up (the watcher went first: the wagon night's opening)
  In.leadBack = function (B) { var R0 = B.roam, l0 = R0.lead0; R0.lead0 = null; if (l0 && R0.token !== l0 && R0.members.indexOf(l0) >= 0) In.lead(B, l0); };
  // the yard's cast: the pair down off the bench by the wagon, Willem at the greys' heads; the two in the bed and the team as riders (drawn where they stand, js/ui.js); the traveler come down
  In.bedRiders = function (B, Y, f, noTeam) { // (the two in the open bed, and the team in its traces unless it is gone)
    var w = In.WAGONAT, seen = !!(f.glamourSeen || f.glamourBroken);
    Y.riders = [{ x: w[0] + 3, y: w[1], sheet: seen ? 'kid1_p0' : 'goblin_p2', after: 'kid1_p0', facing: 3, gz: 12, foot: [1, 1], anim: 'idle', animT: 0 },
      { x: w[0] + 3, y: w[1] + 1, sheet: seen ? 'kid2_p0' : 'goblin_p2', after: 'kid2_p0', facing: 3, gz: 12, foot: [1, 1], anim: 'idle', animT: 0 }].concat(noTeam ? [] : [
      { x: w[0] - 2, y: w[1], sheet: 'horse_p1', facing: 3, gz: 0, foot: [2, 1], team: true, blocks: true, anim: 'idle', animT: 0 },
      { x: w[0] - 2, y: w[1] + 1, sheet: 'horsegrey_p1', facing: 3, gz: 0, foot: [2, 1], team: true, blocks: true, anim: 'idle', animT: 0 }]);
    B.riders = (B.riders || []).filter(function (r) { return !r.yard; }).concat(Y.riders.map(function (r) { r.yard = true; return r; })); In.teamBlock(B);
  };
  In.yardCast = function (B, f) {
    var w = In.WAGONAT, Y = {}; In.bedRiders(B, Y, f, false);
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
    // 2. the lie-down to the second watch: the clock to the watch's middle (the night's own hours, In.REST: eleven after supper), the dark -- and the rest BY THE WATCH (11-05,
    // Griz: "The people on second and third watch get their longrest (but not daily bonding and spell selection for this event) and those on first watch get a short rest before
    // the scene starts with only the second watch character active"): the second and third watches the long rest's mechanics, the first a short rest, no morning page; then
    // the one at the window alone in front, the rest asleep inside the token (the lead put back after: In.leadBack)
    var nightH = (R0.stay && R0.stay.hours) || W.REST || 8, lead0 = R0.token;
    yield* In.lieDown(B, nightH / (H.WATCHES || 3) * 1.5, 'THE SECOND WATCH', [L('wagon.night'), In.restedLine(party, asg, keyOf)], asg);
    In.lead(B, watcher); R0.lead0 = lead0;
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
    if (Y.kat && In.read(st, 'Insight', In.KL.DC.knew)) { f.katKnewAmara = 1; yield* In.card(B, [In.KL.knew], 300); } // (11-05, the module §5: the traveler and Amara have met before, Insight 13 -- it opens her message, asked after the wagon: In.katScene)
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
      In.leadBack(B);
      var seen = !!f.glamourSeen || paid; f.wagonOutcome = 'quiet'; f.katGone = 1; f.katRode = 1; if (seen) f.glamourBroken = 1;
      if (Y.kat) { yield* In.walk(B, Y.kat, [In.DOORS.front[0] - 1, In.DOORS.front[1]]); In.gone(B, Y.kat); Y.kat = null; }
      In.gone(B, Y.amara); In.gone(B, Y.willem); Y.amara = Y.willem = null;
      yield* In.card(B, [paid && D.wagon ? D.wagon.LINES.paidNight : L('wagon.quietNight')], 360);
      yield* In.dueWalk(B, seen ? 'kid' : 'goblin');
      morning = L('wagon.morning.' + (seen ? 'quietSeen' : 'quiet'));
    } else if (how === 'bribe') {
      In.leadBack(B);
      st.silver(500); D.sfx('coin'); f.wagonOutcome = 'bribe'; f.glamourBroken = 1; f.elsbethSilent = 1; f.katGone = 1; f.katRode = 1; f.kidAtInn = 1;
      yield* In.card(B, [L('g.foundSilver', { n: 500 }), In.WN.bribeTaken], 360);
      var katUp = !!f.katYard; // (11-05: only while she is at the inn -- a later cycle's wagon night has no traveler to climb up)
      if (katUp && !Y.kat) Y.kat = In.unit(B, { id: 'katYard', kind: 'commonerwoman', at: [In.DOORS.front[0] - 1, In.DOORS.front[1]], name: 'A traveler', face: [-1, 0] });
      if (Y.kat) { yield* In.walk(B, Y.kat, [w[0] + 2, w[1] - 1], [-1, 0]); yield 20; }
      In.yardClear(B, Y); delete f.wagonIn; In.lay(B, null, true); // (the wagon gone up the road: the yard laid without it)
      if (katUp) yield* In.card(B, [In.WN.bribeGone], 360);
      yield* R.walkTo(B, [In.DOORS.front[0] + 1, In.DOORS.front[1]]);
      yield* In.dueWalk(B, 'kid');
      morning = L('wagon.morning.bribe');
    } else {
      if (Y.kat) { yield* In.walk(B, Y.kat, [In.DOORS.front[0] - 1, In.DOORS.front[1]]); In.gone(B, Y.kat); Y.kat = null; } // (she is inside before the first blade clears, Griz 09-25)
      delete f.katYard; // (11-05: she stays the night inside; the wagon stopped, she has no ride -- the morning after is her last day, the book given and south: In.katLast, In.katScene)
      var out = yield* In.yardFight(B, Y);
      if (out === 'lost') return;
      In.leadBack(B); // (the whole house up now: the lead in front again)
      f.glamourBroken = 1; f.wagonStopped = 'c' + In.cycle(d); // (this wagon runs no road north: its mark on THE WORLD stops -- js/wagon.js)
      yield* In.breakGlamour(B, st, f, Y);
      if (out === 'fled') {
        f.wagonOutcome = 'fled'; f.wagonFled = In.lastFight.loose ? 'horses' : 'foot';
        yield* In.card(B, [f.wagonFled === 'horses' ? In.WN.fledHorses : In.WN.fledFoot, In.WN.fledYard], 420);
      } else f.wagonOutcome = 'inn';
      var act = null;
      if (D.secondact && f.dueTonight) act = yield* D.secondact.afterYard(B, out); // (THE SECOND ACT, the lane's §10 -- js/secondact.js: the signs the yard ate, the rest, the fork: the chase, the lantern, or let it be)
      else if (out === 'fled' && D.chase && D.chase.start) { var go = yield* In.ask(B, 'THE YARD', [L('wagon.chase1')], [D.chase.LINES.opts.after, D.chase.LINES.opts.let]); if (go === 0) act = 'after'; }
      if (act === 'after') { delete f.katYard; In.yardClear(B, Y); yield* D.chase.start(B, { horses: In.lastFight.loose, willem: In.lastFight.willemUp }); return; } // (THE CATCH ON THE GULCH ROAM, item 3 -- js/chase.js: the night walk to the cut, the chase up it, the walk back to this yard's own after)
      yield* In.yardAfter(B, st, f, In.lastFight.willemDead, In.lastFight.loose);
      morning = (D.secondact && D.secondact.morning(f)) || L('wagon.morning.inn');
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
    In.lastFight.willemUp = !!(Y.willem && Y.willem.hp > 0 && (!Y.willem.dead || Y.willem.fled)); // (still up -- away, or standing: he runs with her, and his false pair waits at the fork -- js/chase.js; one away off the floor is `dead` to the grid and `fled`)
    return o === 'won' ? 'won' : /^(lost|lose|dead|ko)$/.test(String(o)) ? 'lost' : 'fled';
  };
  // the yard's own aftermath, the pair down or gone (and after the chase's walk back, In.chaseBack): Willem's book if he fell, the strongbox under the bench, the order, the seven in the bed real, the renown, Doran's drive
  In.yardAfter = function* (B, st, f, willemDead, loose) {
    if (willemDead && !In.has(st, 'willembook')) { D.counter.give(st, 'willembook', 1); D.sfx('chest'); yield* In.card(B, [In.WN.book, L('g.got', { item: DS.DATA.items.willembook.name })], 420); } // (his book when the party kills him, not when he yields or runs: the house lane's item 7, 09-30c)
    st.silver(600); D.counter.give(st, 'wagonorder', 1); D.sfx('chest'); f.doranAway = 1; f.kidAtInn = 1; f.wagonGift = 1;
    yield* In.card(B, [loose ? In.WN.abandonedLoose : In.WN.abandoned], 420);
    yield* In.card(B, [L('wagon.strongbox'), L('g.foundSilver', { n: 600 }), L('g.got', { item: DS.DATA.items.wagonorder.name })], 420);
    yield* In.card(B, D.counter.renown(st, 1, 'renown.wagon').concat([L('wagon.doranTakes')]), 480);
  };
  // back from the chase (js/chase.js Ch.done: the inn's floor again, at the yard, the floor's script running this first): the wagon where they left it, the yard's own aftermath, the morning
  In.chaseBack = function* (B) {
    var R0 = B.roam, f = R0.flags, c = f.wagonChase, st = D.counter.state(B); if (!c || !c.back) return;
    var Y = {}; In.bedRiders(B, Y, f, !!c.horses);
    yield* In.card(B, [In.WN.fledYard], 300);
    yield* In.yardAfter(B, st, f, !!c.willemDead, !!c.horses);
    var morning = L('wagon.morning.inn'); if (f.duePaid && In.has(st, 'ringofbinding')) morning = morning + ' ' + L('wagon.ringCold'); // (the lantern walked while they were up the road: the second act's AFTER THEM)
    delete f.wagonChase; delete f.wagonIn; delete f.katYard; In.yardClear(B, Y);
    In.stage(B, [24, 17], 'inn');
    yield* In.sleep(B, morning);
    if (f.wagonGift) yield* M.talk(B, 'elsbeth', function (sc) { return In.gift(sc, B); });
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
  // (her three tiers as the first game had them, each a flag now -- elsbethTier 1, 2, 3: the second act reads EARNED at 3; the god seen and not fought gives the third for nothing;
  // the push -- Gennet named a fraud to her face -- is the wand, in the kitchen only, and she is done for the night: js/secondact.js A.wand, the lane's §10.4)
  M.SCENES.elsbeth = function* (sc, B) {
    var st = sc.st, f = st.flags, A = D.secondact;
    if (f.lakeDone) { yield sc.say(L('inn.elsbethAfter')); return; }
    if (f.wandOut) { yield sc.say(A ? A.LINES.elsbethSilentWand : L('inn.elsbethSilent')); return; }
    if (f.elsbethSilent) { yield sc.say(L('inn.elsbethSilent')); return; }
    if (f.doranAway && !In.has(st, 'ringofbinding')) { f.elsbethSent = 1; yield sc.say(L('inn.elsbethWinters')); return; }
    if (f.chuulSeen && (f.elsbethTier || 0) < 3) { f.dishes = 1; f.elsbethTold = 1; f.elsbethTier = 3; yield sc.say([].concat(L('inn.elsbeth2'), L('inn.elsbeth3'))); return; } // (the god seen: her third tier for nothing)
    if (!f.dishes && !f.mealWrong) { // (THE MEAL's hard Insight opens her first tier without the dishes: the lane's 11-04 §4)
      var a = yield sc.ask(L('inn.elsbethDishes'), ['HELP WITH THE DISHES', 'LEAVE HER BE']);
      if (a !== 0) return;
    }
    if (!f.dishes) { f.dishes = 1; f.elsbethTier = 1; yield sc.say(L('inn.elsbeth1')); return; }
    if (!f.elsbethTold) {
      if (A && A.wand) { var p = yield sc.ask('At the tub.', ['ASK HER MORE', A.LINES.opts.fraud]); if (p === 1) { yield* A.wand(sc, B, st, f); return; } }
      f.elsbethTold = 1; f.elsbethTier = 2; yield sc.say(L('inn.elsbeth2')); return;
    }
    f.elsbethTier = 3; yield sc.say(L(In.has(st, 'ringofbinding') ? 'inn.elsbethTonight' : 'inn.elsbeth3'));
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
    if (def && def.key === In.KEY && trig.town === 'talk' && trig.npc === 'elsbeth') { // (the kitchen: her tiers, and the wand's walk out -- js/secondact.js A.wand)
      yield* M.talk(B, 'elsbeth', function (sc) { return M.SCENES.elsbeth(sc, B); });
      if (In.wandWalk) { In.wandWalk = false; yield* D.roam.walkTo(B, [25, 20]); B.card(D.roam.wrap([D.secondact.LINES.wandDone]), 360); yield 40; }
      return;
    }
    if (def && def.key === In.KEY && trig.town === 'talk' && trig.npc === 'doranIn' && (B.roam.flags.dueStopped || B.roam.flags.gennetDead)) { // (Doran sells the rooms after the second act's ends: js/secondact.js)
      var sleptD = yield* M.talk(B, 'doranIn', function (sc) { return In.doranRoom(sc, B); }, 'Doran Waterby');
      if (sleptD) yield* In.night(B);
      return;
    }
    if (def && def.key === In.KEY && trig.town === 'talk' && trig.npc === 'katarina') { // (her talk at the fire: In.katScene -- she looks up at whoever speaks, still sat, as js/town.js T.fire turns a figure drawn all round)
      var ku = B.units.filter(function (u) { return u.npc === 'katarina'; })[0], tk = B.roam && B.roam.token; if (ku && tk && !ku.holdFacing) ku.facing = D.spr.facingFor(tk.x - ku.x, tk.y - ku.y);
      yield* M.talk(B, 'katarina', function (sc) { return In.katScene(sc, B); }); return;
    }
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
    { id: 'room', label: 'THE COMMON ROOM at dusk: the inn lady\'s room and THE MEAL at the long table', note: 'Inside at six in the evening, day 5. The inn lady by the hearth (plated THE INN LADY till she gives her name), Doran behind the bar under the stair\'s high end, the traveler by the fire (she is here days 4 to 12), Elsbeth at the kitchen tub. E on the inn lady: a room at five silver a head, then supper -- everyone sits along the long table, the traveler at the table for two, and the talk plays over the room: the one speaking on the side they sit, the hero whose die it was on theirs with the die in their bubble. Supper by whose eyes (11-05): Gennet asks what brings you down the road, and at each of the party\'s five openings LEFT and RIGHT flip the four -- each hero\'s own reads above their own answers (Vivian sees the girl count you twice), Lymen always on the gnolls; one answer warms or cools the table; then the night.', key: In.KEY, at: [24, 17], hour: 18, day: 5, inside: true, dice: [14, 12, 15] },
    { id: 'meal8', label: 'THE MEAL ON DAY 10: the farmers\' stories', note: 'The same supper on day 10: the road\'s rumors -- the Dominion at the moot, the tribes, the farmers harried, the parties going south -- and from today the farmers up Silverton way who woke to mirror-eyed things over their beds. The first die is low: whoever asks the news hears it wrong (flip to Aurdin, the best at History, and it is still a 3). Aurdin may ask about the eyes (Arcana). The traveler is still at her table for two (she waits till the wagon, day 12): her mirror cools the table.', key: In.KEY, at: [24, 17], hour: 18, day: 10, inside: true, dice: [3, 15, 16] },
    { id: 'meal14', label: 'THE MEAL ON DAY 15: the Snoot at the Pit', note: 'Supper on day 15: everything the road has said, and the worst of it -- the Snoot at the Pit, the road south shut. The dice high: the news heard true; Lymen\'s questions down to the lake\'s deepest while the table stays warm.', key: In.KEY, at: [24, 17], hour: 18, day: 15, inside: true, dice: [18, 17, 17] },
    { id: 'kat', label: 'DAY 7: THE TRAVELER BY THE FIRE, Barley with a bottle of ink (11-05)', note: 'Six in the evening on day 7, the four in the common room, a bottle of ink from Lisbet\'s in the pack. E on the traveler at her table by the fire: Barley -- "You\'re with the Dominion." -- and she breaks in: her deity gave her a vision and it used up all her ink. The bottle set by her book; the vision, Aurdin laughing in the dust with the tribe that laughs; the page torn free: the Sheet: Hideous Laughter in the pack. E on her again: her talk at the fire -- what she is, the road south, what she saw (the vision told: both tiers). Then M, ITEMS, the sheet on Aurdin: he copies it into his book.', key: In.KEY, at: [25, 20], hour: 18, day: 7, inside: true, inv: ['ink'] },
    { id: 'katbook', label: 'DAY 13: HER LAST MORNING, the wagon stopped (11-05)', note: 'Eight in the morning on day 13, the wagon stopped in the yard last night (the pair down or run, the children freed), Barley\'s word given her days ago and a bottle of ink in the pack. E on the traveler by the fire: she closes her book, opens it, slides it across -- her book; the ink set by it and the vision with it, the sheet; ask her about Amara, and what she carried (the read at the greeting caught them); LET HER GO: she pays out her nights and walks south toward the Pit, and the fire\'s table is empty.', key: In.KEY, at: [25, 20], hour: 8, day: 13, inside: true, inv: ['ink'],
      flags: { reachedInn: 1, mealHad: 1, gennetNamed: 1, wagonCycle: 0, wagonOutcome: 'inn', wagonStopped: 'c0', glamourBroken: 1, kidAtInn: 1, doranAway: 1, katInk: 1, katLooked: 1, katKnewAmara: 1 } },
    { id: 'wagon', label: 'DAY 12: THE WAGON NIGHT', note: 'The first WAGON DAY, six in the evening in the common room, the traveler by the fire. E on the inn lady: a room, supper, then the second watch -- Amara\'s wagon turns in, goblins chained in the back. Who had the watch? INVESTIGATE, WAKE THE PARTY or KEEP WATCH; the gold, or steel: the yard fight on the grid, Willem at the traces (three turns unbothered and the team is loose).', key: In.KEY, at: [24, 17], hour: 18, day: In.WAGON.first, inside: true },
    { id: 'resthours', label: 'DAY 5 AT TEN: "Dinner is at eight" -- the inn\'s rest hours (11-05)', note: 'Ten in the morning in the common room, supper had here before. E on the inn lady: "Dinner is at eight." -- SHORT REST (an hour by the fire, the hit dice spent, nothing paid), WAIT TIL DINNER (the room paid, the afternoon by the fire, supper at eight, awake at seven), NOT NOW. A room taken from three to ten has supper and wakes eleven hours on; after ten the kitchen is cold, eight hours.', key: In.KEY, at: [24, 17], hour: 10, day: 5, inside: true, flags: { gennetNamed: 1, mealHad: 1, reachedInn: 1 } },
    { id: 'upstairs', label: 'UPSTAIRS: the guest rooms and the room over the kitchen', note: 'At the head of the stair in the passage. Three small guest rooms over the common room, the big fire\'s chimney through the middle, and the big room on the kitchen side over the lake, its door off the passage past the chimney: E at the table by its bed -- the drawer. The stair down sets you by the bar.', key: In.UP, at: [6, 9], hour: 18 },
    { id: 'night', label: 'THE YARD BY NIGHT', note: 'Ten at night on the path from the lake door: the house dark on the yard, lamps at its doors and the barn\'s, the lantern post on the point, the lake black. The boys are in.', key: In.KEY, at: [38, 18], hour: 22 },
    { id: 'barn', label: 'THE BARN: the six stalls, the hay, the doors (11-05)', note: 'Noon in the barn, a step in from its doors: three stalls either side of the aisle, each with its manger and hay, the hay pile by the doors. Walk the aisle; step out by the doors and the barn roofs again.', key: In.KEY, at: [12, 6], hour: 12, inside: 'barn' },
    { id: 'shore', label: 'THE SHORE BY DAY: the point, the boat, the floats (11-05)', note: 'Two in the afternoon on the path to the point: the rowboat drawn up, the lantern post, the flat stone with its cairn, the floats bobbing out on the shallows and the deep beyond. Walk out to the flat stone.', key: In.KEY, at: [40, 18], hour: 14 },
    { id: 'snoot', label: 'DAY 14: THE SNOOT\'S RUNNER by the well', note: 'The Snoot at the Pit: a runner off the Pit road by the well. E on him: TO THE SNOOT opens the Snoot\'s own page (its BACK TO THE INN comes home), or NOT NOW.', key: In.KEY, at: [13, 16], hour: 10, day: 14 },
    { id: 'world', label: 'THE WORLD AT THE INN: its door', note: 'A NEW GAME on THE WORLD on the inn\'s hex. E: the inn\'s door -- GO IN by the gate the party faces.', world: true, hour: 15 }
  ];
  In.play = function (bt) {
    var H = D.house, R = D.roam, rec = H.fresh(); rec.at = { town: null }; rec.flags = Object.assign({ councilNotice: 1, councilSeen: 1 }, bt.flags || {}); rec.silver = Math.max(rec.silver || 0, 60); // (Silverton's council night sat already: a show of the inn -- 11-04, his "these previews are all firing the council discussion")
    (bt.inv || []).forEach(function (id) { H.add(rec.inv, id, 1); }); // (what the beat's pack holds: the traveler's ink, 11-05)
    var site = bt.world ? ((W.map && W.index && W.index() && W.map('world')) || { sites: [] }).sites.filter(function (s) { return s.id === In.SITE; })[0] : null;
    H.begin(rec, 0, site ? '?world&at=' + site.hex[0] + ',' + site.hex[1] : null);
    var S = W.state && W.state(); if (S && bt.hour != null) S.t = (bt.day ? (bt.day - 1) * 24 : Math.floor((S.t || 0) / 24) * 24) + bt.hour;
    if (bt.world) return;
    In.pinned = bt.dice ? bt.dice.slice() : null;
    var nb = R.make('?roam=' + bt.key + (bt.inside === 'barn' ? '&at=' + bt.at.join(',') : bt.inside ? '&inside' : ''), { save: H.living(H.cur), opts: { at8: bt.at.slice() }, house: true });
    D.push(nb);
  };
  In.show = function (q) { return new D.roam.WetShow(q, { kind: 'innshow', beats: In.BEATS, play: In.play, title: '{y}THE HALFWAY INN, 11-04{/} -- one place on the diamonds, the walls see-through inside, THE MEAL (a show)' }); };
})();
