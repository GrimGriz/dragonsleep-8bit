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
  // THE KEPT CHILD'S OWN FIGURE AND FACES (11-12, ART-139, cut by cutter-art139; Griz: "art request for girl and goblin"): the child Gennet keeps wears `keptchild`
  // (keptchild_p1, eight facings) wherever she is shown as she is -- in the barn's stall and the wagon's bed once seen through, in the yard, beside the token, at
  // the kitchen table, on the due's walk -- in place of the townsfolk child (Orrin and Pell keep that one); and in the yard's talk her face is pt_keptchild, or
  // pt_glamourgoblin while the party still takes her for a goblin (In.childFace)
  In.keptKind = function () { return D.FOES && D.FOES.keptchild ? 'keptchild' : 'commonerchild'; };
  In.childFace = function (seen) { var k = seen ? 'pt_keptchild' : 'pt_glamourgoblin'; return D.SHEETS && D.SHEETS[k] ? k : null; };
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
  // (11-11, the inn seat: a lantern post at the front step, 17,17 -- RULED 11-10, his "4 - sounds reasonable, check how many other lanterns all already out front": none
  // was; js/innprops.js lays it lit at dusk and by night, the step's own pool of light under it)
  // (11-06, the innfights seat: the two crates at the long table's ends -- 20,14 and 27,14 -- moved a square east and to the shelf's end, 28,14 and 35,14: they sealed the table's
  // north side between the wall and the board, and the supper's fight opens with two of the party sat there -- js/secondact.js A.seatFight; the grid lets nobody squeeze a corner)
  // THE LAKE'S EDGE (RULED 11-12, ruling 60, Griz: "they are 6 now, with 4 cut out as the deep by the stone. 4 total shallow the hole shore across should be good"; then, asked
  // which gives: "the difference between the deep and the knee-shallow shoreline is the problem. The deep can move further from the shore, with 4 knee-shallow squares the
  // entire coast (including where the deep currently breaks that pattern)"): the floor is four columns wider to the east (54 x 40); every lake square within four of the
  // land -- the sand, the reeds, the point's rocks -- is knee-shallow (W), and the deep (Y) is everything past that: from x 48 along the coast, from x 50 off the point,
  // rounded where the point meets the shore. The chuul comes up at the deep's edge and wades the four to the stone (js/secondact.js A.DEEP)
  // (11-13, his note on eyes-lake-water-1112k: "can we knee-deep the 44 and 45 squares around the rock" -- the point's rocks in columns 44 and 45 are knee-shallow now, the
  // flat stone (44,18-19) standing in them; the four and the deep by the same rule as before, so off the stone the shallows are x 45-48 and the deep from 49)
  In.ROWS = [
    ',,,"""""""""t""""""""""""""""""""""""""""""nWWWWYYYYYY', ',,,".............."""""""""""""""""""""""""nWWWWYYYYYY',
    ',,,................""""""""""""""""""""""""eWWWWYYYYYY', ',,,..AAAAAAAAAA....""""""""""""""""""""""""eWWWWYYYYYY',
    ',,,..Awo|wo|woA...."""t""""""""""""""""""""eWWWWYYYYYY', ',,,..Aoo|oo|ooA...."""""""""""t""""""""""""eWWWWYYYYYY',
    ',,,..AaoooooooD...."""""""""""""""""""t""""eWWWWYYYYYY', ',,,..Aoo|oo|ooA....""""""""""""""""""""""""eWWWWYYYYYY',
    ',,,..Awo|wo|woA....""""""""""""""""""""""""eWWWWYYYYYY', ',,,..AAAAAAAAAA....""""""t"""""""""""""""""eWWWWYYYYYY',
    ',,,................"""""""""""""""t""""""""nWWWWYYYYYY', ',,,................""""""""""""""""""""""""nWWWWYYYYYY',
    ',,,..||||.........."""""""""""""""""""""t""nWWWWYYYYYY', ',,,...xx...........BBBBBBBBBBBBBBBBBB""""""nWWWWYYYYYY',
    ',,,................BoooooooocooHHHHcB""""""nWWWWYYYYYY', ',,,........q.......BoKKKKKKoooooooooB"""""lnWWWWYYYYYY',
    ',,,................BooooooooooooKKooB"""""rrWWWWYYYYYY', ',,,s.............l.BooooooooCCjoooooB"""""rrWWWWWYYYYY',
    ',,,................DooooobohCChoooooD,,,,,rriWWWWYYYYY', ',,,................BooooobohCChoooooB"""""rriWWWWYYYYY',
    ',,,................BoomKmoooCCjoooooB"""""rrWWWWWYYYYY', ',,,................BooooooooooooooToB"""""rrWWWWYYYYYY',
    ',,,................BoKKKKoooooooooooB""""""nWpWWYYYYYY', ',,,................BuSSSSSooooooooocB""""""nWWWWYYYYYY',
    ',,,................BBBBBBBBBBBBoBBoBB""""""nWWWWYYYYYY', ',,,................""""""""""BoocBooB""t"""nWWWWYYYYYY',
    ',,,..............kk""""""""""BoooBooB""""""nWWWWYYYYYY', ',,,..............kk"""""t""""BooofooB""""""eWWWWYYYYYY',
    ',,,................"t""""""""BoooBooB""""""eWWWWYYYYYY', ',,,................""""""""""BzooBozB""""""eWWWWYYYYYY',
    ',,,................""""""""""BBBBBBBB""""""eWWWWYYYYYY', ',,,................"""""""""""""""""""""t""eWWWWYYYYYY',
    ',,,................""""""""""""""""""""""""eWWWWYYYYYY', ',,,................""t"""""""""""""""""""""eWWWWYYYYYY',
    ',,,................""""""""""""""""t"""""""eWWWWYYYYYY', ',,,................""""""""t"""""""""""""""eWWWWYYYYYY',
    ',,,................""""""""""""""""""""""""eWWWWYYYYYY', ',,,................""""""""""""""""""""""""nWWWWYYYYYY',
    ',,,".............."""""""""""""""""""""""""nWWWWYYYYYY', ',,,"""""t"""""""t""""""""""""""""""""""""""nWWWWYYYYYY'
  ];
  In.LEGEND = { '"': 'grassT', '.': 'earth', ',': 'road', t: 'tree', q: 'well', '|': 'fence', k: 'woodpile', w: 'manger', c: 'crate', B: 'innWall', A: 'barnWall', o: 'floorWood',
    D: 'doorway', K: 'table', b: 'bench', m: 'chair', C: 'chimney', H: 'shelf', z: 'bed', h: 'firepit', f: 'firepit', u: 'stairsUp', T: 'tub', n: 'sand', i: 'flatstone', r: 'rocks',
    l: 'lamp', e: 'reeds', W: 'shallows', Y: 'deep', p: 'boat', R: 'innRoof', X: 'wingRoof', Q: 'barnRoof', S: 'stairRun',
    a: 'hay', x: 'trough', j: 'tools', s: 'sign' }; // (11-05, the exteriors seat: the barn's hay, the trough by the rail, the hearth's tools and kettle, the sign by the road -- js/innprops.js)
  // the names the top levels' floors had not needed, as the grid's squares (js/mines.js M.LAY; a roof by M.ROOF)
  Object.assign(M.LAY, { grassT: ['g'], earth: ['.'], woodpile: ['k'], manger: ['k'], floorWood: ['o'], doorway: ['d'], table: ['K'], bench: ['K'], chair: ['k'], shelf: ['S'], bed: ['y'],
    tub: ['w'], sand: ['.'], flatstone: ['.'], rocks: ['r'], boat: ['k'], stairRun: ['o'], hay: ['k'], trough: ['w'], tools: ['k'], sign: ['f'], // (the stair's run: walked as the floor till art-wanted section 36's stair comes back)
    shallows: ['~'] }); // (the lake KNEE-SHALLOW, as its words say -- "Knee-shallow forty paces out; then, off the point, it goes." -- the grid's pool: waded, difficult ground; the deep (Y) off the point the grid's deep water, only a swimmer's (11-05, Griz: "we also need to make the water knee deep for 40 paces or what-have-you for the fight (seeded in dialog but not true)"; it had been the deep, D, all of it -- the page 9B shallows painted over what nobody could wade)
  Object.assign(M.ROOF, { innRoof: 'I', wingRoof: 'J', barnRoof: 'Z', innWall: 'v', barnWall: 'v' });
  if (D.roam && D.roam.USE_NAME) { D.roam.USE_NAME.thedeep = 'the water off the point'; D.roam.USE_NAME.rowboat = 'the rowboat'; } // (the HUD's names for the shore's two E squares: it read "E: thedeep" -- 11-12)
  // where the people stand, by the hour and the floor's flags (the first game's conditions): the yard's by day, the house's inside it -- seen while the party is in
  In.FOLK = [
    { id: 'doranYard', at: [16, 26], look: 'worker', dir: 'right', cond: '!flag:doranAway & !flag:doranDead', when: 'day', out: true },   // (by the woodpile)
    { id: 'orrin', at: [43, 20], look: 'kid', dir: 'right', cond: '!flag:dueSeen', when: 'light', out: true },           // (the stone stack at the point)
    { id: 'pell', at: [43, 24], look: 'kid', dir: 'right', cond: '!flag:dueSeen', when: 'light', out: true },            // (skimming stones off the shore)
    { id: 'adoptedKid', at: [43, 12], look: 'girl', dir: 'right', cond: 'flag:kidAtInn & !flag:dueSeen', when: 'light', out: true },
    { id: 'doranIn', at: [24, 23], look: 'worker', dir: 'up', cond: '!flag:doranAway & !flag:doranDead & !flag:doranOut', when: 'evening' },                // (behind the bar, under the stair's high end, where the headroom is)
    { id: 'gennet', at: [24, 16], look: 'innlady', dir: 'down', cond: '!flag:lakeDone & !flag:gennetDead & !flag:gennetTaken', when: 'home' },
    { id: 'gennet', at: [10, 15], look: 'innlady', dir: 'right', cond: '!flag:lakeDone & !flag:gennetDead & !flag:gennetTaken', when: 'morning', out: true }, // (out at the well: RULED 11-12, ruling 58, Griz: "daytime private (gennet outside) is good" -- Elsbeth's private hour; THE MORNINGS ONLY since his answer the same day, on whether the whole day: "she's normally how the people sleep, have her go there for the mornings til midday" -- In.WELL, seven to twelve; by the fire from midday)
    { id: 'gennetGrief', at: [21, 18], look: 'innlady', dir: 'down', cond: 'flag:lakeDone & !flag:gennetDead & !flag:gennetTaken' },
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
    orrin: 'commonerchild', pell: 'commonerchild', adoptedKid: 'keptchild', snootRunner: 'commoner',
    amaraYard: 'amara', willemYard: 'willem', wagonGoblin: 'glamourgoblin', barnGoblin: 'glamourgoblin', gennetYard: 'commonerwoman', katYard: 'commonerwoman' }; // (the townsfolk's figures till the art desk's come back: deep16-art-wanted.md §35 -- the Waterbys and Katarina wear their own over them since 11-05, js/counter.js C.FIG)
  In.WELL = { from: 7, to: 12 }; In.atWell = function (h) { return h >= In.WELL.from && h < In.WELL.to; }; // (Gennet's mornings at the well, till midday)
  In.when = function (w, h) { var tod = W.todAt ? W.todAt(h) : (M.night(h) ? 'night' : 'day'); return !w || (w === 'morning' ? In.atWell(h) : w === 'home' ? !In.atWell(h) : w === 'day' ? h >= 7 && h < 17 : w === 'evening' ? !(h >= 7 && h < 17) : w === 'light' ? tod !== 'night' : true); };
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
    elsbethWagon: 'She does not turn round. "A wagon comes in {n} night{s}. Be in the house that night."', elsbethWagon0: 'She does not turn round. "A wagon comes tonight. Be in the house."', // (11-11: the word for the party that saw her counting and kept quiet)
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
    opts: { short: 'SHORT REST', wait: 'WAIT TIL DINNER', notNow: 'NOT NOW', till: 'SLEEP TILL RESTED: AWAKE {when} ({n} HOURS)', night: 'A NIGHT\'S SLEEP: {n} HOURS, NO LONG REST' },
    shut: 'Supper\'s over and the room is yours. How long do you sleep?', // (11-05: inside the 24 hours, the room paid at supper -- invented.json rests-24h)
    shortRest: 'An hour by the fire with your boots off.',
    waited: 'The afternoon goes by the fire. At eight, supper.',
    dinner: 'Supper at the long table -- lake fish, bread, the road\'s talk -- and then a room under the eaves.',
    late: 'The kitchen is cold this late. A room under the eaves, and no supper.',
    noCook: 'Nobody cooks at the Waterbys\' now. A room under the eaves, and no supper.' // (the lake took the inn lady, 11-05: invented.json halfway-nearest-offering-1105)
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
  // THE DUE THREE NIGHTS ON (RULED 11-05, Griz: "hate to do it, but let's move the offering to 3 nights after wagon night. goblin in the barn if they fail to reveal the illusion, 'one
  // they kept' if they rescue, and a poison dinner (likely fight) if they interrupt the wagon before it gets there and happen to be there on sacrifice night"; then "go with those leans"):
  // the lantern walks on the night of WAGON DAY + 3 (day 15, then every 28) -- js/secondact.js A.dueNight. What the Waterbys have for the stone this cycle (In.offering): 'goblin', the
  // one handed over at the greeting with the glamour unbroken, chained in the barn's end stall (In.BARN) till the night; 'kept', a child seen for one, kept; 'none', the wagon stopped
  // on the road before it reached them -- the poison dinner. A cycle the party never saw: the wagon came and went, the handover made, 'goblin'
  In.DUE = { after: 3 };
  In.dueDay = function (c) { return In.WAGON.first + c * In.WAGON.every + In.DUE.after; };
  In.isDueDay = function (d) { var d0 = In.WAGON.first + In.DUE.after; return d >= d0 && (d - d0) % In.WAGON.every === 0; };
  In.dueCycle = function (d) { return Math.floor((d - In.WAGON.first - In.DUE.after) / In.WAGON.every); };
  // DORAN'S TWO DAYS (RULED 11-11, ruling 29, Griz: "agreed on timing of absence" -- "Doran gone two days, back the evening before sacrifice night, Gennet alone at the
  // table"): away with the wagon from its night, he is home from In.DORAN.backHour on the day before that wagon's due (the wagon the 12th, the due the 15th: away the
  // 13th and the 14th's day, at the bar again that evening). The floor lets the flag go as it is laid at or after that hour (M.floor, below); the due's own night
  // lets it go as before (js/secondact.js A.dueNight)
  In.DORAN = { backHour: 17 }; In.DUE_EVE = 12; // (the due's night is the night that FOLLOWS its day: a bed taken from noon on -- In.night)
  In.doranBack = function (f, d, h) { var due = In.dueDay(Math.max(0, f.wagonCycle || 0)); return d > due - 1 || (d === due - 1 && (h == null ? 0 : h) >= In.DORAN.backHour); };
  In.dueTonightOn = function (f, d) { return In.isDueDay(d) && f.dueCycle !== In.dueCycle(d) && !f.lakeDone; };
  // nights from day d to the due's next night not yet walked (0: tonight) -- Elsbeth's word with the ring on the hand (11-08)
  In.nightsToDue = function (f, d) { if (In.dueTonightOn(f, d)) return 0; var c = Math.max(0, In.dueCycle(d)); while (In.dueDay(c) <= d) c++; return In.dueDay(c) - d; };
  In.WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
    'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine', 'thirty'];
  // HER WORD ABOUT THE NIGHT, MADE TRUE (11-13, Griz, from Sylvia's table: "elsbeth said it wasn't a fight night at 4 am, did a long sleep and doran woke me up for the fight";
  // then "what does she say the day after the chuul fight? something 'not tonight' ?"). Her closing line was fixed text, content/text.json inn.elsbeth3 -- "She won't talk
  // about it again tonight. The lake is quiet. It is not a feeding night." -- said whatever the calendar held, on the due's own day too. Now the sentence about the lake
  // reads the count her ring-line reads (In.nightsToDue): a feeding night tonight, tomorrow's, or how many nights off; with the thing dead, only that the lake is quiet.
  // Her refusal to say more stays. The seat's words, his to re-word
  In.elsbethQuiet = function (f, d) {
    f = f || {}; var head = "She won't talk about it again tonight. ";
    if (f.lakeDone) return head + 'The lake is quiet.';
    var n = In.nightsToDue(f, d);
    return head + (n === 0 ? 'Tonight is a feeding night.' : n === 1 ? 'The lake is quiet. Tomorrow is a feeding night.' : 'The lake is quiet. It is not a feeding night: that is ' + (In.WORDS[n] || n) + ' nights off.');
  };
  In.setOffering = function (f, c, kind) { f.dueOffC = c; f.dueOff = kind; };
  In.offering = function (f, c) { return f.dueOffC === c ? f.dueOff : 'goblin'; };
  In.BARN = [7, 5]; // (the barn's west end stall, the far end from its door)
  In.barnGoblinOn = function (f, d) { var c = In.cycle(d); return c >= 0 && d >= In.WAGON.first + c * In.WAGON.every && d <= In.dueDay(c) && f.dueCycle !== c && (In.offering(f, c) === 'goblin' || f.barnC === c) && !f.lakeDone && !f.barnFreed; }; // (barnC: the one seen through in the barn, a child there still)
  In.passTo = function (B, hour) { // (the clock on to the next `hour` -- past midnight, the due's -- the floor lit for it; no rest)
    var now = In.hourOf(B), h = ((hour - now) % 24 + 24) % 24, W = D.world, S = W.state && W.state(); if (!h) return;
    if (D.roam.house() && D.house.playing && S) { D.house.fromFloor(B); S.t += h; W.save(); } else B.roam.hour = (now + h) % 24;
    M.lightNow(B);
  };
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
    if (In.barnGoblinOn(flags || {}, dd)) npcs.push({ id: 'barnGoblin', x: In.BARN[0], y: In.BARN[1], look: 'goblin', dir: 'down' }); // (the one handed over, chained in the end stall till the due: 11-05)
    var trig = [{ id: 'flatstone', rect: [44, 18, 1, 2], on: 'step', script: 'inn:pointStep' }, { id: 'thedeep', rect: [48, 17, 1, 4], on: 'use', script: 'inn:point' }, /* (11-13, his 0404Z note on eyes-lake-rock-1113b: "have the 4 pop-up squares be the 48 row that sticks out (right now 2 on 48 and 2 on 47)" -- column 48 is knee-shallow on rows 17 to 20 only, the four that stand out past the shallows north and south of them; it had been 45-48 on the stone's two rows) */ /* (11-13, his "make only the 4 squares straight out from the rock do the 'yellow box click popup' about things not coming up from the deep": the four straight out from the flat stone, x 45-48 on its two rows -- it had been the whole water off the point) */
      { id: 'lanternpost', rect: [42, 15, 1, 1], on: 'use', script: 'inn:sign', text: 'A lantern post by the flat stone. Nobody swims here. Nobody draws from the lake. The well is for that.' },
      { id: 'rowboat', rect: [45, 22, 1, 1], on: 'use', script: 'inn:rowboat' }]; // (the flat-bottomed rowboat drawn up off the point: the first game's S.rowboat -- js/secondact.js A.sound, 11-05)
    if (inside === 'inn') trig.push({ id: 'stair', rect: [In.STAIR[0], In.STAIR[1], 1, 1], on: 'step', script: 'inn:stair' });
    var lights = inside === 'inn' ? In.FIRES.map(function (q, i) { return { id: 'hearth' + i, kind: 'map', x: q[0], y: q[1], bright: 10, dim: 10, color: 'fire', flame: true, seep: true }; }) : null;
    return { id: 'halfway', name: 'The Halfway Inn', rows: rows, legend: Object.assign({ U: 'wagon', V: 'wagonBed' }, In.LEGEND), music: inside === 'inn' ? 'inn' : 'lake', exits: { north: 1, south: 1, west: 1 }, dark: false, // (no east: the lake's edge, waded since 11-05 -- not a way to THE WORLD, whose door has no east gate)
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
  // (a knee-shallow square, W: the shore's own sand painted beneath the water's sheet -- the ground's tiling under the fluid, his word of 11-12, js/innprops.js)
  In.under = function (rows, inside, open) { // (open(x, y): the square's house is the one the party is in -- its walls cut to stubs stand on its boards, js/innprops.js, 11-05)
    return rows.map(function (r, y) { return r.split('').map(function (c, x) { return c === 'W' ? '.' : !inside(x, y) || 'DCoSu'.indexOf(c) >= 0 ? ' ' : c === 'B' || c === 'A' ? (open && open(x, y) ? 'o' : ' ') : In.UNDER[c] || 'o'; }).join(''); });
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
    var h = hour != null ? hour : M.hourNow(q); if (flags && flags.doranAway && In.doranBack(flags, In.day(q), h)) { delete flags.doranAway; In.trail('Doran is back from the Pit road'); } // (ruling 29: home the evening before sacrifice night)
    var def = floor0.call(this, key, q, flags, h); flags = flags || {};
    def.under = In.under(In.ROWS, In.inHouse, function (x, y) { return !!In.inside && In.inHouse(x, y) === In.inside; }); // (the boards under the things inside, and under the walls of the house the party is in: In.under)
    def.noPoolEdge = true; /* (no dark rim where the shallows meet the deep, 11-13: his "get rid of the brown line between the shallow and deep" -- js/iso.js) */ def.inside = In.inside || null; def.sub =In.inside === 'inn' ? 'the common room and the rooms' : In.inside === 'barn' ? 'the barn' : 'the yard and the shore'; def.hud = 'the Halfway Inn'; def.where = function () { return def.sub; }; // (the HUD's place line by the lay, not the floor's one sub)
    def.doors = (def.doors || []).filter(function (q2) { return def.rows[q2[1]][q2[0]] !== '~'; }); // (the lake waded since 11-05: its rim is water, not a way to THE WORLD -- an `edges` floor takes every open rim square)
    def.roofs = Object.assign({}, def.roofs, In.ROOFS, { v: { h: In.STUB, roof: 'leather', wall: 'stone' } }); // (the house two stories from the yard, the wing and the barn their own; the walls cut low while the party is in)
    def.people.forEach(function (p) { if (In.KINDS[p.id]) p.kind = In.KINDS[p.id]; if ((p.id === 'wagonGoblin' && flags.glamourSeen) || (p.id === 'barnGoblin' && flags.glamourBroken)) p.kind = In.keptKind(); }); // (the chained one a child once the glamour is seen through)
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
    In.edge = f.insightEdge || null; if (In.edge && In.day(D.roam.q) > In.edge.day + 1) { delete f.insightEdge; In.edge = null; } // (the insight's +1, the save's: that night and the day after -- In.edgeSet)
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
    // (UPSTAIRS, 11-13, the walkthrough bench's findings 1 and 2 -- "A SAVE upstairs loads on the yard", "The same mid-night": the guest floor's own square rides the save
    // beside the front step, `up`, and the load lays the guest floor on it -- H.toTown below. A save written before this has no `up` and loads on the step as it did)
    if (st && def.key === In.UP) return { town: In.SITE, gate: 'west', sq: [st[0], st[1]], dir: st[2], up: { sq: [t.x, t.y], dir: D.roam.DIR8[B.roam.fw[0] + ',' + B.roam.fw[1]] || null } };
    if (st) return { town: In.SITE, gate: 'west', sq: [st[0], st[1]], dir: st[2] };
    return atOf0.apply(this, arguments);
  };
  var toTown0 = D.house && D.house.toTown;
  if (toTown0) D.house.toTown = function (id, gate) {
    var Hh = D.house, at0 = Hh.cur && Hh.cur.at, up = id === In.SITE && at0 && at0.town === In.SITE && at0.up && at0.up.sq ? at0.up : null;
    if (!up) return toTown0.apply(this, arguments);
    Hh.trail('town', id + ', upstairs where it saved (' + up.sq.join(',') + ')');
    W.inDoor = { site: Hh.siteOf(id), gate: gate };
    Hh.cur.at = { town: id, gate: gate, sq: null, dir: null };
    D.push(D.roam.make('?roam=' + In.UP + '&at=' + up.sq[0] + ',' + up.sq[1], { save: Hh.living(Hh.cur), opts: { at8: up.sq.slice(), dir: up.dir || null }, house: true }));
  };

  // ---------------------------------------------------------------- THE MEAL: supper at the long table (its words and its turns are below, THE SUPPER AS RULED, 11-11)
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
  In.speaker = function (seat, id) { var u = seat.folk[id], SO = D.counter && D.counter.SHEETOF; return { name: id === 'doranIn' ? 'Doran' : id === 'gennet' ? In.named(seat.flags) : id === 'elsbeth' ? 'Elsbeth' : (seat.flags || {}).katLooked ? 'Katarina' : 'The traveler', unit: u || null, side: u ? In.sideOf(u.x) : 'right', sheet: id === 'elsbeth' ? In.elsbethCut() : (SO && SO[id] && SO[id]({ flags: seat.flags || {} })) || null }; }; // (sheet: the one speaking's drawn face where they have one -- js/counter.js C.SHEETOF, Doran's and Gennet's, Katarina's by In.FACE -- else their figure's, as before: 11-05, cutter-1105, on the lanes desk's word)
  // Elsbeth's overlay (11-11, Griz on sacrifice night: "a trimmed cut of the portrait from the washbasin rather than what we're using for elsbeth in the overlay visuals"):
  // the art desk's tub portrait (pt_elsbethtub: 166 x 165 frames) cut above the tub's rim, and its bucket row for the water on the stone -- the art in hand, no new ask
  In.elsbethCut = function (bucket) {
    var S0 = D.SHEETS && D.SHEETS.pt_elsbethtub, k = bucket ? 'pt_elsbethbucket' : 'pt_elsbethcut'; if (!S0) return null;
    if (!D.SHEETS[k]) { var h = bucket ? 165 : 118, y = bucket ? 990 : 0; D.SHEETS[k] = { image: S0.image, fw: 166, fh: h, ax: 87, ay: bucket ? 162 : h, top: h, portrait: true, anims: { idle: { y: y, fw: 166, fh: h, ax: 87, ay: bucket ? 162 : h, frames: bucket ? 3 : 6, fps: 3 } } }; }
    return k;
  };
  In.KITCHEN = [32, 21]; // (the kitchen floor beside the tub: where Elsbeth comes from with the bowls)
  In.mealScene = function* (B) { // (the first room taken: supper on the open screen over the room, then the bed)
    var C = D.counter, seat = In.sit(B), st = C.state(B), f = st.flags, d = In.day(D.roam.q); seat.flags = f;
    if (D.house && D.house.trail) D.house.trail('talk', 'meal');
    var draught = In.supKind(f, d, seat) === 'sacrifice' && In.offering(f, In.dueCycle(d)) === 'none';
    var talk = function* () { var sc = new C.Counter(B, { id: 'meal', name: 'The Waterbys', place: 'The Halfway Inn', what: 'supper at the long table', room: true, open: true, bg: In.roomShot(B), script: function (s) { return draught ? In.sacMeal(s, B, seat) : In.meal(s, B, seat); } }); D.push(sc); while (!sc.done) yield 1; };
    if (!draught) { yield* talk(); In.rise(B, seat); return; }
    // SACRIFICE NIGHT, the house with no offering: the talk steps aside while Elsbeth walks the bowls round (S.pending), and opens again where it stopped
    var els = seat.folk.elsbeth, home = els ? [els.x, els.y] : null, T = In.TABLE;
    // (11-13, his 0404Z note on eyes-supper-kitchen-1113b, BROKEN: "elsbeth still shows popping in behind barley (center of screen) and then teleporting to where she starts
    // walking". What it was: "behind each chair" on the table's north side is the house's north wall -- no way there, and In.walk SETS a figure at a goal it cannot reach: she was
    // set behind the first north chair, set again behind the second, and only then walked to the south side. Her stops now: at the outer elbow of a north-side chair, on its own
    // row; behind a south-side chair as before. She is stood in the kitchen BEFORE the supper's first screen, and a stop with no way to it is passed by, never jumped to)
    var stops = seat.four.map(function (u) { return u.y < T.y ? [u.x + (u.x < T.mid ? -1 : 1), u.y] : [u.x, u.y + 1]; }), faces = seat.four.map(function (u) { return u.y < T.y ? [u.x < T.mid ? 1 : -1, 0] : [0, -1]; });
    if (els) { var K0 = In.KITCHEN; if (D.grid.canStand(els, K0[0], K0[1])) { els.x = K0[0]; els.y = K0[1]; els.tween = null; els.facing = D.spr.facingFor(-1, 0); D.grid.setup(B.map, B.units); B.cache = null; } }
    var walks = {
      // (11-13, his note on the sacrifice supper: "elsbeth starts serving dinner from the wall behind the table, should come from the kitchen and maybe walk a little slower";
      // and before it, "did elsbeth teleport in from outside before serving the food?" -- she is stood in the kitchen by the tub first, and walks out from there at half again a step's time)
      bowls: function* () { if (!els) return; var p0 = In.PACE, K = In.KITCHEN; if (D.grid.canStand(els, K[0], K[1]) || (els.x === K[0] && els.y === K[1])) { els.x = K[0]; els.y = K[1]; els.tween = null; D.grid.setup(B.map, B.units); B.cache = null; } In.PACE = Math.round(p0 * 1.5); try { for (var i = 0; i < stops.length; i++) { if (!(els.x === stops[i][0] && els.y === stops[i][1]) && !D.Battle.route(els, stops[i], false)) { In.trail('Elsbeth serves: no way to ' + stops[i].join(',') + ', passed by'); continue; } if (!i) In.trail('Elsbeth serves: out of the kitchen from ' + els.x + ',' + els.y + ', her stops ' + stops.map(function (q) { return q.join(','); }).join(' ')); yield* In.walk(B, els, stops[i], faces[i]); yield 18; } } finally { In.PACE = p0; } },
      kitchen: function* () { if (els) yield* In.walk(B, els, home, [1, 0]); }
    };
    for (var g = 0; g < 8; g++) { yield* talk(); var w = seat.S && seat.S.pending; if (!w) break; seat.S.pending = null; if (walks[w]) yield* walks[w](); }
    B.roam.supSeat = seat; // (nobody rises: the table as it is set is the fight's own scene -- js/secondact.js A.poisonNight, A.supperFight; In.rise there when there is no fight)
  };
  // SACRIFICE NIGHT WITH THE DRAUGHT (11-11 night, the supper seat; RULED, the inn lane's rulings 43-50; Griz: "first round is pre-eating any, chance to notice on at least one
  // hero, the notice stops the eating at that point, 2nd round is one dose. Signaling by nearest on the grid stops them from taking the next bite. 3rd round saves roll.
  // (perception re Elsbeth bowl delivery?)"; "keep quiet and eat nothing not an option, give them standard conversation fare (player not paying attention) but they don't eat
  // anymore. Warning under the table with a particular character serves as 'keeping quiet'"; "having each character choose to eat or not is too much of a tell").
  // THREE ROUNDS. One: nobody has eaten; how Elsbeth set the bowls down is a Perception read by her tell (full DC 10, faint DC 15, none: no read), ONE hero's, and that hero
  // has stopped eating. Two: everyone still eating takes one dose; the taste (Medicine) and the watch (Insight: Gennet's own bowl empty) are that round's reads, each one
  // hero's. Three: those still eating take the second bite; then the saves (js/secondact.js A.poisonNight: one bite DC 13 with advantage, two DC 15). Nobody is asked to
  // eat. A hero who has noticed may SAY IT ALOUD (the fight, then and there), WARN THE NEAREST at the table (who stops eating), or just talk
  In.SAC = { DC: { full: 10, faint: 15 }, TURNS: 3,
    talk: { lymen: [`You're quiet tonight.`, 'doranIn', `"Long day."`], aurdin: [`What's the night, that the good bread's out?`, 'gennet', `"A night like any. Eat."`], vivian: [`You've salted it tonight.`, 'gennet', `"A bit."`], barley: [`Good stew.`, 'gennet', `"Eat it, then."`] },
    aloud: { lymen: `Put the spoons down. All of you.`, aurdin: `There's something in this.`, vivian: `Nobody eat any more of this.`, barley: `Don't eat it.` },
    his: `"If you'd just eaten this wouldn't have been so messy."`, // (HIS, 11-11: "A gennet line 'If you'd just eaten this wouldn't have been so messy' between the hero saying the fight trigger and the fight")
    prompts: [`"Eat while it's hot. You've an early road, I expect."`, `"There's more in the pot."`, `"Is it not to your taste?"`, `"Good. Eat up."`] };
  In.sacMeal = function* (sc, B, seat) {
    var st = sc.st, f = st.flags, d = In.day(D.roam.q), c = In.dueCycle(d), SC = In.SAC, A = D.secondact, P = (A && A.POISON) || { taste: 13, watch: 15 }, who = function (id) { return In.speaker(seat, id); }, i;
    var four = seat.four.filter(function (u) { return u.src && !u.src.dead && !u.src.ko; }).map(function (u) { return { u: u, h: u.src, key: u.src.key || u.src.id, hero: In.heroOf(u), side: In.sideOf(u.x) }; });
    var S = seat.S; if (!S) { S = seat.S = { phase: 0, round: 0, stopped: {}, dose: {}, read: {}, saw: {}, asked: {}, aloud: 0, pending: null, tell: f.wagonStopped ? 'full' : (f.elsbethTier || 0) >= 2 ? 'faint' : 'none', doran: !!seat.folk.doranIn };
      f.mealHad = 1; f.mealDay = d; f.supCount = (f.supCount || 0) + 1; f.supKind = 'sacrifice'; four.forEach(function (e) { S.dose[e.key] = 0; }); In.trail('supper: sacrifice night, the draught in the bowls; Elsbeth\'s tell ' + S.tell); }
    var eating = function (e) { return !S.stopped[e.key]; };
    if (S.phase === 0) { S.phase = 1; yield sc.narr([S.doran ? `Supper at the long table: lake fish, a stew, Gennet's bread. Doran pours. Elsbeth brings the bowls round.` : `Supper at the long table: lake fish, a stew, Gennet's bread. Elsbeth brings the bowls round.`]); S.pending = 'bowls'; return; }
    if (S.phase === 1) { S.phase = 2;
      if (S.tell === 'full') yield sc.lookAt(who('elsbeth'), [`Elsbeth has set the party's bowls down hard, one after another. She holds a look at the party until Gennet says her name.`], who('gennet')); // (ruling 15: her full tell, the party stopped the wagon)
      // (her faint tell and the two bowls in ONE box, a line each -- 11-12 0043Z, Griz: "weird elsbeth line in a black box then a blue one for taking the two bowls to the kitch, black line in blue box as addition above two bowls")
      if (S.tell === 'faint') yield sc.narr([`Elsbeth sets the last of the party's bowls down. Her eyes go to it, then to the party, then away.`, `She takes the last two bowls through to the kitchen.`]);
      else yield sc.narr([`She takes the last two bowls through to the kitchen.`]); // (ruling 48: narration, not a read)
      S.pending = 'kitchen'; return; }
    // the nearest hero at the table still eating: who a warning under the table can reach (ruling 44: one neighbour)
    var nearest = function (e) { var best = null; four.forEach(function (o) { if (o === e || !eating(o)) return; var dd = Math.abs(o.u.x - e.u.x) + Math.abs(o.u.y - e.u.y); if (!best || dd < best.d) best = { e: o, d: dd }; }); return best && best.e; };
    var give = function (id, skill, dc, text, pool) { // (a read is ONE hero's: the best passive among those it could be)
      var best = null; pool.forEach(function (e) { if (S.read[e.key]) return; var pv = In.passive(e.h, skill); if (pv >= dc && (!best || pv > best.pv)) best = { e: e, pv: pv }; });
      if (best) { S.read[best.e.key] = { id: id, text: text }; S.stopped[best.e.key] = 1; if (skill === 'Insight') In.edgeSet(S.f, best.e.key, best.e.hero.name); In.trail(best.e.hero.name + ' passive ' + skill + ' ' + best.pv + ' vs DC ' + dc + ', read: ' + id + ' -- stops eating'); } };
    var ended = null;
    while (S.round < SC.TURNS && !ended) {
      S.round++; var r = S.round;
      if (r === 2 || r === 3) four.forEach(function (e) { if (eating(e)) S.dose[e.key] = r - 1; }); // (round two: one dose; round three: the second bite)
      if (r >= 2) In.trail('round ' + r + ': the doses ' + four.map(function (e) { return e.hero.name + ' ' + S.dose[e.key]; }).join(', '));
      if (r === 1 && S.tell !== 'none') give('bowls', 'Perception', SC.DC[S.tell], S.tell === 'full' ? `(perception) Elsbeth put those bowls down like a warning. This one is not being eaten.` : `(perception) Elsbeth looked at the bowls before she looked at anyone. This one is not being eaten.`, four);
      if (r === 2) { give('taste', 'Medicine', P.taste, `(medicine) A bitterness under the fish. The spoon goes down.`, four.filter(eating)); give('watch', 'Insight', P.watch, `(insight) Gennet has filled every bowl but her own. The spoon goes down.`, four.filter(eating)); }
      var anyStop = four.some(function (e) { return !eating(e); }), prompt = r === 1 ? SC.prompts[0] : r === 2 ? SC.prompts[1] : anyStop ? SC.prompts[2] : SC.prompts[3];
      var list = four.map(function (e) {
        var rd = S.read[e.key], ops = [], tk = SC.talk[e.key] || [`Good stew.`, 'gennet', `"Eat it, then."`], nb = eating(e) ? null : nearest(e);
        if (!eating(e)) { ops.push({ id: 'aloud', label: rd && rd.id === 'watch' ? `She hasn't filled her own bowl.` : SC.aloud[e.key] || `Don't eat that.`, shade: !!(rd && rd.id === 'watch'), tag: rd && rd.id === 'watch' ? 'Insight' : null }); // (his: "'she hasn't filled her bowl' or whatever is an insight result made conversation option?")
          if (nb) ops.push({ id: 'warn', label: `(A boot against ` + nb.hero.name + `'s, under the table.)`, to: nb }); }
        if (!S.asked[e.key]) ops.push({ id: 'talk', label: tk[0], tk: tk });
        ops.push(eating(e) ? { id: 'eat', label: `(Eat quietly.)` } : { id: 'bread', label: `More bread, if there is any.` });
        return { e: e, hero: e.hero, side: e.side, key: e.key, reads: rd && !S.saw[e.key + rd.id + r] ? [rd.text] : [], ops: ops, opts: ops.map(function (o) { return o.label; }), marks: ops.map(function (o) { return o.shade ? { shade: true, tag: o.tag } : null; }), ids: ops.map(function (o) { return o.id; }), shaded: ops.filter(function (o) { return o.shade; }).length };
      });
      var at0 = Math.max(0, list.map(function (x) { return x.key; }).indexOf(S.lastKey));
      var pk = yield sc.flip(who('gennet'), [prompt], list, at0), x = list[pk && pk.at != null ? pk.at : at0] || list[0], op = x.ops[pk && pk.k != null ? pk.k : x.ops.length - 1] || x.ops[x.ops.length - 1], e = x.e;
      S.lastKey = x.key; sc.hero = e.hero; sc.heroSide = e.side; In.trail(e.hero.name + ': ' + op.label);
      if (op.id === 'aloud') { S.aloud = r; ended = 'aloud'; yield sc.narr([`Every spoon at the long table stops.`]); yield sc.by(who('gennet'), [SC.his]); }
      else if (op.id === 'warn') { S.stopped[op.to.key] = 1; S.warned = (S.warned || []).concat([op.to.key]); In.trail(op.to.hero.name + ' is warned under the table: no more bites'); yield sc.narr([op.to.hero.name + `'s spoon stops halfway, and goes down.`]); }
      else if (op.id === 'talk') { S.asked[e.key] = 1; yield sc.by(who(op.tk[1] === 'doranIn' && !S.doran ? 'gennet' : op.tk[1]), [op.tk[2]]); }
      else if (op.id === 'bread') yield sc.by(who('gennet'), [`"There's always bread."`]);
      else yield sc.narr([`Spoons on bowls. Nobody says anything for a while.`]);
    }
    sc.echo = null; sc.hero = null; f.mealWarm = f.innRegard = 0;
    B.roam.supBowls = { cycle: c, offer: 'none', aloud: !!S.aloud, round: S.aloud || 3, dose: S.dose, stopped: S.stopped, warned: S.warned || [], reads: Object.keys(S.read).map(function (k) { return k + ':' + S.read[k].id; }) };
    In.trail('the bowls: ' + four.map(function (e) { return e.hero.name + ' ' + (S.dose[e.key] === 2 ? 'the full dose' : S.dose[e.key] === 1 ? 'a partial dose' : 'none'); }).join(', ') + (S.aloud ? '; said aloud in round ' + S.aloud : '; nobody said it'));
  };
  // A FADE TO BLACK AND BACK (11-12, Griz on the no-tell night: "fade to black, any necessary narration, then fade from black"): B.innFade { k: 0..1, lines } drawn over the
  // floor's whole picture by a wrap of the grid's draw; In.fadeSay puts narration on the black (shown only while it is whole); a fade to 0 clears it
  In.fade = function* (B, to, ticks) { var F = B.innFade || (B.innFade = { k: 0, lines: [] }), k0 = F.k, n = Math.max(1, ticks || 30); for (var i = 1; i <= n; i++) { F.k = k0 + (to - k0) * i / n; yield 1; } F.k = to; if (!to) F.lines = []; };
  In.fadeSay = function (B, lines) { var F = B.innFade || (B.innFade = { k: 0, lines: [] }); F.lines = [].concat(lines || []); if (D.house && D.house.trail) D.house.trail('act', 'ON THE BLACK: ' + F.lines.join(' ')); };
  if (D.ui && D.ui.drawBattle) { var drawF0 = D.ui.drawBattle; D.ui.drawBattle = function (ctx, B) {
    var r = drawF0.apply(this, arguments), F = B && B.innFade, SP = B && B.innSplash;
    // (THE BLACK HELD OVER A FLOOR'S FIRST FRAMES, 11-13, his 0404Z note on eyes-watch-down-1113: "when the scene starts playing, it flashes to aurdin downstairs before panning
    // the camera to the scene (despite the aurdin upstairs now)" -- the yard's floor is laid with the token at the stair's foot, and was drawn so for a frame or more before the
    // scene stood him upstairs. In.blackHold counts frames down and is let go by the scene once its picture is set: In.wagonNight)
    if (In.blackHold > 0 && B && B.roam) { In.blackHold--; In.blackDrawn = (In.blackDrawn || 0) + 1; ctx.save(); ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, D.W, D.H); ctx.restore(); return r; }
    // (A PORTRAIT SPLASHED MID-SCREEN over the floor, 11-13: B.innSplash { sheet, t0, s } -- Elsbeth with the bucket, his "have the portrait centered mid-screen, it plays before
    // the text comes up"; its row played once and held on its last frame; In.splash sets it, In.splash(B) takes it down)
    if (SP && D.SHEETS && D.SHEETS[SP.sheet] && D.counter && D.counter.drawPortraitAt) { var sh = D.SHEETS[SP.sheet], an = sh.anims.idle, k = SP.s || 1, fr = Math.min(an.frames - 1, Math.floor((B.t - SP.t0) / 14)), left = Math.round((D.W - sh.fw * k) / 2), foot = Math.round(D.H / 2 + sh.fh * k / 2) - 6; D.counter.drawPortraitAt(ctx, SP.sheet, 'idle', fr, left + sh.ax * k, foot - (sh.fh - sh.ay) * k, k); SP.drawn = (SP.drawn || 0) + 1; SP.at = [left, foot]; if (B.req && B.req.prompt && D.ui.drawReq) { D.ui.drawReq(ctx, B, { prompt: B.req.prompt }); SP.boxOver = (SP.boxOver || 0) + 1; } /* (11-13, his 0404Z note on eyes-stone-take-1113: "water bucket popup on the layer on top of the portrait" -- the box that takes the OK is drawn again after the portrait, so it lies over it) */ }
    if (!F || !(F.k > 0)) return r;
    ctx.save(); ctx.globalAlpha = Math.min(1, F.k); ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, D.W, D.H);
    if (F.k >= 1 && F.lines.length) { ctx.globalAlpha = 1; var ls = []; F.lines.forEach(function (l) { D.wrap(l, D.W - 80).forEach(function (x) { ls.push(x); }); }); ls.forEach(function (l, i) { D.text(ctx, l, Math.round(D.W / 2), Math.round(D.H / 2 - ls.length * 6 + i * 12), '#c8c8d8', 'center'); }); }
    ctx.restore(); return r;
  }; }
  In.splash = function (B, sheet, s) { if (!sheet) { delete B.innSplash; return null; } B.innSplash = { sheet: sheet, t0: B.t, s: s || 0.9 }; if (D.spr && D.spr.load && D.SHEETS[sheet] && !D.spr.offline) D.spr.load(D.SHEETS[sheet].image); return B.innSplash; };
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
  // THE SUPPER AS RULED (11-11, the supper seat; the inn lane's 2026-11-07 and 2026-11-11 sections, rulings 1-34, and the reading page he ruled from, the-lab's
  // supper-mockup-2026-11-11.html; Griz: "let the supper mockup go ahead and build it in"). Its laws, each his: ONE silent read a hero an opening and ONE skill-shaded
  // answer a hero an opening ("i'm still seeing multiple insights/rolls per character"); no die on the screen ("I think we can quit showing die rolls and have the
  // skill-influenced chat options shaded as such") -- every check is rolled silently into the play record (In.trail); History never changes what the Waterbys know, it
  // sharpens the asker's question ("the waterby wouldn't know different things based on Aurdin's history check, it'd help him ask better questions maybe"); the glass is
  // Katarina's, at her neck, and a line about it is said to her and only with her at the table for two ("still talks at Kat (your neck) unless we've given Gennet a
  // menders mirror"); a look is a look (js/counter.js Counter.lookAt: the portraits held, no box); the lines the seat's own ("free to re-write entire"). FIVE SUPPERS
  // (In.supKind): the first, a later one, the one after the party saw Gennet with Amara, Gennet alone with Doran away, sacrifice night. The regard (f.innRegard, one
  // hidden scale with the table's warmth: rulings 1 and 21) carries from supper to supper; renown sets the first (ruling 27)
  In.MEAL = {
    bed: 'TO BED', CAP: 5, // (five a hero since 11-11, with EAT QUIETLY and TO BED under them: the flip pages what will not fit -- js/counter.js THE FIT)
    TURNS: { first: 5, later: 3, amara: 3, alone: 3, sacrifice: 2 }, // (sacrifice: the kept-child night's two; the night with the draught is In.sacMeal's three rounds)
    DC: { History: 10, Persuasion: 12, Religion: 13, Arcana: 13, lie: 11 }, // (lie: Gennet's passive Insight, WIS 13 -- data/foes.js gennet)
    // the news by the day: a garbled first telling for `lag` days, then what they had wrong (for four days more), then the settled word; the three newest are told
    bands: [
      { day: 1, lag: 3, id: 'heardMoot', who: 'doranIn', garble: `"The gnolls had a moot, up in the hills. A fight over who's king, the first drover said, and the old one lost."`,
        fix: `"The first man through called it a fight over the kingship. It wasn't that."`, ok: `"Every tribe of them in one place, under one moon. Their king told the Dominion no. They say he burned for it."` },
      { day: 2, lag: 3, id: 'heardDominion', who: 'gennet', garble: `"There's talk the Dominion paid for that moot. I'd not repeat it."`,
        fix: `"I told people the Dominion paid for it. Nobody says that now."`, ok: `"There were Dominion people at it. Standing among gnolls, under the moon. Nobody who tells it can say what for."` },
      { day: 4, lag: 3, id: 'heardTribes', who: 'doranIn', garble: `"They've gone home. Back up into the hills, every tribe."`,
        fix: `"Not all of them went home. We had that wrong."`, ok: `"They split, after. One lot came south fast, over on the Pit road side. The rest went up into the hills."` },
      { day: 7, lag: 2, id: 'heardFarmers', who: 'doranIn', garble: `"Farm folk came through with everything on one cart. Wolves, I took it for."`,
        fix: `"It wasn't wolves that moved those farmers."`, ok: `"Farmers off the edge farms, everything on one cart. Gnolls in the barley. Young ones, and no chief over them."` },
      { day: 8, lag: 2, id: 'heardReach', who: 'doranIn', garble: `"There's a band raiding up by the Gulch, they say. The silk-cutters have come in off the webs."`,
        fix: `"Nothing came to the Gulch. That was fright talking."`, ok: `"It's all going south, every party of them, at the Pit. The silk-cutters came in off the webs for nothing."` },
      { day: 8, id: 'heardHarbinger', who: 'gennet', ok: `"Three men at that well this week told me of the same thing, and not one of them would put a name to it."` },
      { day: 10, lag: 2, id: 'heardMade', who: 'doranIn', garble: `"Farm folk up Silverton way woke with things standing over their beds. Big as dogs, and bigger. Eyes that give you your own face. They don't bite. They stand there, and come morning the one they stood over can't lift a bucket."`,
        ok: `"Not dogs. We said dogs at first. It's whatever was out there already, a boar, a thing off the bog, made big and given those eyes. And they don't keep. Three days and they're hide and bone, unless they've stood over somebody."` },
      { day: 14, lag: 2, id: 'heardPit', who: 'doranIn', garble: `"Some trouble at the Pit, with the gnolls. It blows over. It always has."`,
        fix: `"It hasn't blown over."`, ok: `"The Snoot's at the Pit. The south road is shut. Hessle's paying gold in Silverton for one true word of it."` }
    ],
    SHOWN: 3, FIXDAYS: 4, PROMPT: 150,
    pit: [`"GreyFang's house at the Pit took them. All seven."`, `"It's getting worse down there. The Snoot. I came north a day ahead of it."`], // (ruling 56: his first supper home)
    witness: `"See it? None of them. Every word at this table is one man telling what another man told him."`,
    more: [`"Eat. Ask what you like; the whole road comes through this door."`, `"There's more fish. The lake doesn't stint."`, `"There's bread, if the fish is done."`], // (when an opening comes with no one speaking)
    tell: { cool: `Gennet's smile stays where it was.`, warm: `Gennet fills the cups again.`, cold: `"You'll be wanting your beds. It's an early road, whichever way you take it."` }, // (the warmth shown by a look, never a number)
    close: [`The fire is let down.`, `Gennet takes the lamp from its hook by the lake door, looks at it, and hangs it again.`]
  };
  In.AB.Medicine = 'wis';
  In.renown = function () { var H = D.house; return H && H.playing && H.cur ? (H.cur.renown || 0) : ((D.counter && D.counter.testRenown) || 0); };
  // which supper tonight: the due's own night; Gennet alone (Doran not in the house: f.doranAway, ruling 29); the one after the wagon came and went with the party
  // watching (f.wagonOutcome 'quiet': the party saw her deal with Amara -- ruling 33), once; a later one; the first
  In.supKind = function (f, d, seat) {
    if (In.dueTonightOn(f, d)) return 'sacrifice';
    if (!seat.folk.doranIn) return 'alone';
    if (f.wagonOutcome === 'quiet' && !f.supAmara) return 'amara';
    return f.supCount ? 'later' : 'first';
  };
  // where the table starts: the first by renown (3 or better warm, else civil); after it by the regard, never below civil at the start (a cold regard holds it at civil
  // all night); the bribe taken is warm (the party is in on it: the 11-07 table); after Amara it is civil and cannot rise
  In.supStart = function (f, kind) {
    var reg = f.innRegard == null ? 1 : f.innRegard, cap = kind === 'amara' || reg <= 0 ? 1 : 2;
    var start = kind === 'first' ? (In.renown() >= 3 ? 2 : 1) : kind === 'amara' ? 1 : kind === 'sacrifice' ? Math.min(1, Math.max(1, reg)) : Math.max(1, reg);
    if (f.wagonOutcome === 'bribe' && kind !== 'amara') { start = 2; cap = 2; }
    return { warm: Math.min(start, cap), cap: cap };
  };
  In.SUP = { FOUR: ['lymen', 'aurdin', 'vivian', 'barley'], KEPT: ['house', 'came', 'dom', 'regular', 'boys', 'fought', 'before', 'ring', 'coin', 'rite', 'girl', 'mirror'] }; // (KEPT: the avenues that stay asked from supper to supper -- the news is asked afresh each night)
  // THE READS: silent passives. A hero whose 10 + skill reaches the DC may be shown it -- ONE a hero an opening, the oldest waiting first, the rest held for the next
  // opening; it opens that hero's follow-up (`opens`), and leaves its mark (`fx`) only if the player flipped to a hero while it showed
  In.SUP.READS = {
    counted: { skill: 'Perception', dc: 15, opens: 'girl', text: `(perception) The girl in the kitchen doorway has counted you twice.` }, // (RULED 11-05: Perception 15, Vivian's; kept quiet it is the way to her, In.meal's end)
    rich: { skill: 'Insight', dc: 12, opens: 'coinq', text: `(insight) The linen is new and the pewter matches. This road does not pay for that.` },
    coin: { skill: 'Perception', dc: 14, opens: 'coin', text: `(perception) Gennet made change for the rooms in old coin. No mint on this road struck it.` }, // (the green purse, the lake's founding gift: the realm's)
    pen: { skill: 'Insight', dc: 12, ok: function (S) { return S.kat; }, text: function (S) { return S.f.katLooked ? `(insight) At "write it down right", Katarina's pen stops.` : `(insight) At "write it down right", the traveler at the table for two stops writing.`; }, fx: function (S) { S.f.katPenSeen = 1; } },
    years: { skill: 'Insight', dc: 13, opens: 'before', text: `(insight) Doran's telling stops the day the inn came to him and starts again at the wedding. There are years between.` },
    ring: { skill: 'Perception', dc: 14, opens: 'ring', text: `(perception) The ring on Gennet's hand is old, and was cut for a smaller finger.` }, // (Anwen's ring: the realm's, CANON 08-26)
    rite: { skill: 'Religion', dc: 13, opens: 'rite', text: `(religion) "The lake gives back." She says it the way a congregation answers.` },
    fought: { skill: 'Insight', dc: 13, opens: 'fought', text: `(insight) Doran sits with his back to the wall and the door in front of him. Somebody taught him to.` },
    barnbowl: { skill: 'Perception', dc: 13, opens: 'barnq', ok: function (S) { return !S.glam; }, text: `(perception) Elsbeth carried a bowl out by the yard door before she carried any to the table.` },
    noname: { skill: 'Insight', dc: 12, opens: 'nameq', ok: function (S) { return S.glam; }, text: `(insight) Nobody at this table has called the child by a name.` },
    sawit: { skill: 'Insight', dc: 12, opens: 'sawq', text: `(insight) "Without him." She watched it happen, or some of it.` },
    never: { skill: 'Perception', dc: 99, text: `` } // (sacrifice night's reads are In.sacMeal's own: the bowls, the taste, the watch)
  };
  In.SUP.dc = function (r) { return typeof r.dc === 'function' ? r.dc() : r.dc; }; // (the taste and the watch are the second act's own numbers: js/secondact.js A.POISON)
  // THE ROAD'S GOSSIP IN THREE THREADS, ONE A SUPPER (RULED 11-11, ruling 36, Griz: "it's like there's 3 threads of answer and they're given current road-gossip for all 3 pieces,
  // and should probably just get one of the 3 - and corrections of the ones they've gotten and different ones at current correctness if later first-time getting that piece";
  // "assume they'll have 3-4 dinners in a normal playthrough"). The threads: the MOOT (the moot itself, the Dominion at it), the GNOLLS since (the tribes, the farmers, the
  // parties south, the Pit), the MADE THINGS (the thing no one names, the things over the beds). A supper gives one: a thread not yet had, at that day's telling -- or, of a
  // thread had before, only what has moved since (a garble corrected, a word new). What was told and when is kept on the save (f.supThreads: thread -> the day)
  In.MEAL.THREADS = { moot: ['heardMoot', 'heardDominion'], gnolls: ['heardTribes', 'heardFarmers', 'heardReach', 'heardPit'], made: ['heardHarbinger', 'heardMade'] };
  In.SUP.stageOf = function (b, d) { return d == null || d < b.day ? null : b.garble && d < b.day + b.lag ? 'garble' : 'ok'; };
  In.SUP.bandsOf = function (th, d) { var ids = In.MEAL.THREADS[th]; return In.MEAL.bands.filter(function (b) { return ids.indexOf(b.id) >= 0 && d >= b.day; }); };
  In.SUP.threadOpen = function (S, th) { // ('new': not yet had; 'fix': had, and its telling has moved since; null: nothing to say of it tonight)
    var SU = In.SUP, bs = SU.bandsOf(th, S.d); if (!bs.length) return null;
    var told = (S.f.supThreads || {})[th]; if (told == null) return 'new';
    return bs.some(function (b) { return SU.stageOf(b, told) !== SU.stageOf(b, S.d); }) ? 'fix' : null;
  };
  In.SUP.thread = function (S, th) {
    var SU = In.SUP, how = SU.threadOpen(S, th), told = (S.f.supThreads || {})[th], bs = SU.bandsOf(th, S.d); if (!how) return false;
    if (how === 'new') bs = bs.slice(-2); else bs = bs.filter(function (b) { return SU.stageOf(b, told) !== SU.stageOf(b, S.d); }).slice(-2); // (two words of it at most: the newest)
    bs.forEach(function (b) {
      var st = SU.stageOf(b, S.d);
      if (how === 'fix' && st === 'ok' && b.fix && SU.stageOf(b, told) === 'garble') S.by(b.who, b.fix); // (what they had wrong, said by the one who said it)
      S.f[b.id] = st === 'garble' ? 'wrong' : 'true'; S.by(b.who, st === 'garble' ? b.garble : b.ok);
    });
    var t = S.f.supThreads || {}; t[th] = S.d; S.f.supThreads = t; S.asked.news = 1; S.thread = th; In.trail('the gossip: the ' + th + ' thread, ' + how);
    return true;
  };
  In.SUP.pick = function (S, order) { for (var i = 0; i < order.length; i++) if (In.SUP.threadOpen(S, order[i])) return order[i]; return null; };
  In.SUP.fought = function (S) { return !!S.f.mirrorFought; }; // (a made thing fought: js/world.js sets mirrorFought as a mirror-made fight opens on THE WORLD)
  In.SUP.regular = function (S) {
    if (S.warm >= 2) { S.f.heardArrangements = 1; S.by('doranIn', `"Arrangements get made, sometimes. With guests who come back. On a schedule."`); S.look('gennet', `Gennet looks at Doran. He says no more.`, 'doranIn'); }
    else S.by('doranIn', `"Everyone pays. It's the only well."`);
  };
  // THE ANSWERS: `kinds` the suppers it belongs to (none: the first and a later one); `t1` true the first opening's alone, false the openings after, none any; `who` the
  // heroes who may say it; `read` opened by that read for the hero who read it; `ok` by the state, `needs` by the talk so far; `lead` put at the head of the hero's list;
  // `skill` the check that shapes it (it is SHADED, one a hero an opening; S.made rolls it silently); `to` said to Katarina across the room; `run` what comes back
  // (S.by, S.narr, S.look, S.reads); `warm` the step it moves the table; `end` it ends supper
  (function () {
    var SU = In.SUP, sharp = function (S, e) { return S.made(e, 'History'); }, toKat = function (S) { return '(to ' + (S.f.katLooked ? 'Katarina' : 'the traveler') + ', across the room) '; };
    var kn = function (S) { return S.f.katLooked ? 'Katarina' : 'The traveler'; }, LATE = ['later'], BOTH = ['first', 'later'];
    var TH = { lymen: ['gnolls', 'moot'], aurdin: ['moot', 'gnolls'] }, thOf = function (S, e) { return SU.pick(S, TH[e.key] || TH.lymen); };
    var news = { id: 'news', t1: false, who: ['lymen', 'aurdin'], ok: function (S, e) { return !!thOf(S, e); }, skill: function (S, e) { return sharp(S, e) ? 'History' : null; },
      say: function (S, e) { var th = thOf(S, e), again = SU.threadOpen(S, th) === 'fix', q = th === 'moot' ? (again ? `What do the drovers say of the moot now?` : `What do the drovers say of the moot?`) : (again ? `What does the road say about the gnolls now?` : `What does the road say about the gnolls?`);
        return sharp(S, e) ? q + ` And which of it did the teller see?` : q; },
      run: function (S, e) { SU.thread(S, thOf(S, e)); if (sharp(S, e)) { S.f.newsHearsay = 1; S.by('doranIn', In.MEAL.witness); } } }; // (the sharper question's own answer: none of it is witnessed)
    // her question about the eyes, answered (11-11, Griz on the supper alone: "they don't seem to be able to address her question about the eyes (based on encountering a
    // mirror monster fight?)"): from day 10 she raises the made things when there is something of them to say; a party that has fought one says so
    var seenSay = { lymen: [`We fought one on the road. It can be killed.`, `Not one. What do they say of them?`], aurdin: [`We have met one. It dies as anything dies.`, `Only what's said. What is said?`], vivian: [`Seen one. Put a knife in it, too.`, `Not yet. Who has?`], barley: [`Fought one. It bleeds.`, `No. Tell it.`] };
    var seen = { id: 'seen', key: 'news', t1: true, who: ['lymen', 'aurdin', 'vivian', 'barley'], ok: function (S) { return !!S.raised; },
      say: function (S, e) { return seenSay[e.key][SU.fought(S) ? 0 : 1]; },
      run: function (S, e) { if (SU.fought(S)) { S.f.toldMirrorFought = 1; S.look('gennet', `Gennet looks at Doran.`, 'doranIn'); S.by('doranIn', `"Then the farmers have it wrong. They say you can't stand once one's looked at you."`); var t = S.f.supThreads || {}; t.made = S.d; S.f.supThreads = t; S.f.heardMade = S.f.heardMade || 'true'; S.asked.news = 1; S.by('gennet', `"And it died. Good. Eat."`); } else SU.thread(S, 'made'); },
      warm: function (S) { return SU.fought(S) ? 1 : 0; } };
    // idle talk (11-11, Griz: "Not enough fluff/useless conversation options - one could be eat quietly"): a line a hero that opens nothing, and EAT QUIETLY at every opening
    var QUIET = [`Nobody says anything for a while. The fish is good.`, `Knives on plates. The fire ticks.`, `Elsbeth comes and goes with the bread.`];
    var eat = { id: 'eat', all: true, again: true, last: true, say: function () { return `(Eat quietly.)`; }, run: function (S) { S.narr(QUIET[(S.quiet = (S.quiet || 0) + 1) % QUIET.length]); } };
    var mend = { id: 'mend', t1: false, who: ['lymen'], lead: true, skill: function () { return 'Persuasion'; }, needs: function (S) { return S.cooled && S.warm < S.cap; },
      say: function () { return `We've been poor guests. I'm sorry for it.`; },
      run: function (S, e) { if (S.made(e, 'Persuasion', null, true)) S.by('gennet', `"You've been hungry ones. Eat."`); else S.by(S.doran ? 'doranIn' : 'gennet', `"Mm."`); }, warm: function (S, e) { return S.made(e, 'Persuasion') ? 1 : 0; } }; // (his: "maybe he gets a persuasion response if the 'innkeeper friendly' starts to drift south"; once for each time it drifts)
    var K = function (o, kinds, more) { var c = {}; Object.keys(o).forEach(function (k) { c[k] = o[k]; }); c.kinds = kinds; Object.keys(more || {}).forEach(function (k) { c[k] = more[k]; }); return c; };
    SU.ASK = [
      // ---- the first supper's opener (RULED 11-05: Gennet's "What brings you down the road?")
      { id: 'council', kinds: ['first'], t1: true, who: ['lymen'], say: function () { return `Papa's council wants a true word on the gnolls. I'm to carry it home.`; },
        run: function (S) { S.f.mealTold = 'council'; S.by('doranIn', `"A true word."`); S.look('doranIn', `Doran sets his cup down.`); S.by('doranIn', `"You'll not get one here. Rumor, all you can carry."`); } },
      { id: 'trade', kinds: ['first'], t1: true, who: ['vivian'], skill: function () { return 'Deception'; }, say: function () { return `We trade. Rope and cloth, down to the Pit and back.`; },
        run: function (S, e) {
          if (S.renown >= 3) { S.f.mealLie = 'caught'; S.by('gennet', `"Traders."`); S.look('gennet', `Gennet looks at Doran, and back.`, 'doranIn'); S.by('gennet', `"Hessle pays traders off his board now, does he?"`); return; } // (the road knows the party's work: the lie cannot hold)
          var ok = S.made(e, 'Deception', 'lie'); S.f.mealLie = ok ? 'held' : 'caught';
          if (ok) S.by('gennet', `"Traders. The Pit buys well, when it's quiet."`); else { S.by('gennet', `"Traders."`); S.look('gennet', `Gennet looks at the swords, then at ` + e.hero.name + `.`); S.by('gennet', `"Of course."`); } },
        warm: function (S) { return S.f.mealLie === 'caught' ? -1 : 0; } },
      { id: 'work', kinds: ['first'], t1: true, who: ['barley'], say: function () { return `Work. Wherever it is.`; },
        run: function (S, e) { S.by('doranIn', `"Then you've come down the wrong road."`); S.look('doranIn', `Doran laughs once through his nose, and pushes the bread toward ` + e.hero.name + `.`); }, warm: function () { return 1; } },
      { id: 'write', kinds: ['first'], t1: true, who: ['aurdin'], say: function () { return `The moot. Someone should write it down right.`; }, // (his: "if Aurdin says 'someone should write it down right'")
        run: function (S) { S.by('doranIn', `"Write it down? Ask the drovers, then. You'll get a different moot from each."`); S.reads(['pen']); } },
      { id: 'pass', kinds: ['first'], t1: true, any: true, say: function () { return `Passing through.`; }, run: function (S) { S.by('gennet', `"Most do."`); } }, // (one not of the four)
      // ---- a later supper's opener ("What did the road show you?")
      { id: 'l1', kinds: LATE, t1: true, who: ['lymen'], say: function () { return `Gnoll sign, and no gnolls. What's come up the road since?`; }, ok: function (S, e) { return !!thOf(S, e); }, run: function (S, e) { SU.thread(S, thOf(S, e)); } },
      { id: 'l2', kinds: LATE, t1: true, who: ['barley'], say: function () { return `Nothing I'd pay to see twice.`; }, run: function (S) { S.by('doranIn', `"That's the road."`); }, warm: function () { return 1; } },
      { id: 'l3', kinds: LATE, t1: true, who: ['vivian'], say: function () { return `Less than your drovers will have told you.`; }, run: function (S) { S.by('gennet', `"They do talk."`); } },
      { id: 'l4', kinds: LATE, t1: true, who: ['aurdin'], say: function () { return `Enough to fill a page. Not enough to fill two.`; }, run: function (S) { S.by('doranIn', `"Then eat. The page will keep."`); } },
      { id: 'lpass', kinds: LATE, t1: true, any: true, say: function () { return `Road, and more road.`; }, run: function (S) { S.by('gennet', `"It's that or stay home."`); } },
      // ---- the openings after: Lymen's the gnolls (his: "always asking about the gnoll stuff")
      K(seen, ['first', 'later', 'alone']), K(mend, BOTH), K(news, BOTH), K(eat, ['first', 'later', 'amara', 'alone']),
      { id: 'idleL', idle: true, t1: false, who: ['lymen'], say: function () { return `Good fish. Yours, out of the lake?`; }, run: function (S) { S.by('doranIn', `"Mine. Off the point, mornings."`); } },
      { id: 'idleB', idle: true, t1: false, who: ['barley'], say: function () { return `Who bakes?`; }, run: function (S) { S.by('gennet', `"Elsbeth. I showed her once."`); } },
      { id: 'idleV', idle: true, t1: false, who: ['vivian'], say: function () { return `Is the lake always that still?`; }, run: function (S) { S.by('doranIn', `"Mostly."`); } },
      { id: 'idleA', idle: true, t1: false, who: ['aurdin'], say: function () { return `How deep is it, off the point?`; }, run: function (S) { S.by('doranIn', `"Deep enough that nothing's come back up to say."`); } }, // (the realm's: nothing that goes in off the point comes back up)
      { id: 'come', t1: false, who: ['lymen'], needs: function (S) { var t = S.f.supThreads || {}; return t.gnolls != null || t.moot != null; }, say: function () { return `Will they come this far?`; },
        run: function (S) { S.by('doranIn', S.d >= 14 ? `"They're at the Pit. They've never snooted this far north, and they've less cause now than ever."` : S.d >= 8 ? `"They've never snooted this far north. And it's all running south now, more of it each week."` : `"They've never snooted this far north. It's the farms round the Pit they go at. There's more farms."`); S.by('gennet', `"The lake will keep us safe."`); } }, // (his: "They've never snooted this far north ... the lake will keep us safe")
      { id: 'take', t1: false, who: ['lymen'], needs: function (S) { return !!S.asked.come && S.warm >= 2; }, say: function () { return `And if they do come?`; },
        run: function (S) { S.f.heardLakeTake = 1; S.by('gennet', `"If they come, the lake will take them."`); S.look('doranIn', `Doran looks at his plate.`); } }, // (his deepest: "if they come the lake will take them")
      { id: 'word', t1: false, who: ['lymen'], say: function () { return `The council wants its true word. Where do I go for one?`; },
        run: function (S) { S.f.pointedSouth = 1; S.by('doranIn', S.d >= 14 ? `"The south road's shut. The true word is inside the Pit, and the Pit wants every blade it can get."` : S.d >= 8 ? `"South. The drovers coming up from the Pit don't stop to water now. Take that for your true word."` : `"Not here. What's true comes up from the Pit, and that's a long day south. If your father wants it true, go and look."`); } }, // (RULED 11-04: the council's true word south past the inn)
      { id: 'boys', t1: false, who: ['lymen'], say: function () { return `Your boys. How old are they?`; },
        run: function (S) { S.by('gennet', `"Orrin's fourteen. Pell's eleven."`); S.look('doranIn', `Doran does not look up from his plate.`); S.reads(['years']); } }, // (Tobin was fourteen: the realm's)
      { id: 'eyes', t1: false, who: ['aurdin'], ok: function (S) { return !!S.f.heardMade; }, skill: function (S, e) { return S.made(e, 'Arcana') ? 'Arcana' : null; },
        say: function (S, e) { return S.made(e, 'Arcana') ? `Eyes that give your own face back. Nothing is born with those. Who is making them?` : `Eyes that give your face back? No dog has those.`; },
        run: function (S, e) { if (S.made(e, 'Arcana')) { S.f.eyesMade = 1; S.by('gennet', `"Not on this side of the water."`); } else S.narr(`Nobody at the table answers that.`); } },
      // ---- what the reads open
      { id: 'girl', t1: false, read: 'counted', say: function () { return `Your girl counts heads.`; },
        run: function (S) { S.f.mealGirlSaid = 1; S.by('gennet', `"She counts plates."`); S.look('gennet', `Gennet looks to the kitchen doorway. Elsbeth takes the plates through and does not come back.`, 'elsbeth'); }, warm: function () { return -1; } }, // (RULED 11-11, his "10 was the fumble": said aloud, Elsbeth gives nothing free after)
      { id: 'coin', t1: false, read: 'coin', say: function () { return `Old silver, this change. Who struck it?`; }, run: function (S) { S.f.heardCoin = 1; S.by('gennet', `"The lake gives back."`); S.reads(['rite']); } },
      { id: 'coinq', key: 'regular', t1: false, read: 'rich', needs: function (S) { return !S.asked.dom; }, say: function () { return `New linen. Somebody keeps this house in coin.`; }, run: function (S) { SU.regular(S); } },
      { id: 'ring', t1: false, read: 'ring', say: function () { return `That's an old ring.`; },
        run: function (S) { S.f.heardRing = 1; S.by('gennet', `"It came up out of the lake. The lake gives back."`); if (S.warm >= 2) S.by('gennet', `"It was his first wife's. It was on the flat stone the morning after we wed."`); S.reads(['rite']); } },
      { id: 'before', t1: false, read: 'years', say: function () { return `You've lost someone.`; },
        run: function (S) { S.f.heardAnwen = 1; S.by('doranIn', `"Anwen. My first. She went the third night."`); S.look('doranIn', `Doran drinks.`); S.by('doranIn', `"And our Tobin. He was fourteen."`);
          if (S.warm >= 2) { S.f.heardLakeWife = 1; S.look('gennet', `Gennet puts her hand on his.`, 'doranIn'); S.by('gennet', `"The lake took them. And it gave him me."`); } } }, // (Anwen and Tobin the realm's; the lake giving him a wife his, 11-05)
      { id: 'rite', t1: false, read: 'rite', say: function () { return `"It gives back." You say that like an answer. What's the asking?`; },
        run: function (S) { S.f.heardRite = 1; S.by('gennet', `"Someone has to speak to the spirits here, or they speak to you."`); if (S.warm >= 2) { S.f.heardLamp = 1; S.by('gennet', `"The lamp by the lake door is the asking. On its nights we light it."`); } } }, // (the Due's lantern: the realm's)
      { id: 'fought', t1: false, read: 'fought', say: function () { return `Nobody gives a man an inn.`; },
        run: function (S) { if (S.warm >= 2) { S.f.heardDoranPast = 1; S.by('doranIn', `"He'd won more than the inn, betting on me. I was owned, and I fought until I wasn't. He said the house was my share of it."`); S.by('doranIn', `"Where is no matter now."`); } else S.by('doranIn', `"This one did."`); } }, // (the realm's history, CANON 11-11; where and whose are unpoured, so he does not say)
      // ---- Katarina's glass: said to her, across the room, and only with her at the table for two; gone once the ink is done (the party knows what she is)
      { id: 'mirror', t1: false, who: ['barley', 'aurdin', 'vivian'], to: true, ok: function (S) { return S.kat && !S.f.katInk; }, skill: function (S, e) { return e.key !== 'barley' && S.made(e, 'Religion') ? 'Religion' : null; },
        say: function (S, e) { var t = toKat(S); return e.key === 'barley' ? t + `You, by the fire. That glass at your neck. You're with the Dominion.` : e.key === 'aurdin' ? (S.made(e, 'Religion') ? t + `Madam. That glass at your neck is a mender's. The Dominion sets bones by those.` : t + `Madam. Is that a scrying glass at your neck?`) : (S.made(e, 'Religion') ? t + `You, by the fire. Nice glass. A mender's, isn't it? Dominion work.` : t + `You, by the fire. Nice glass. Not a vain woman's, though.`); },
        pre: function (S, e) { return e.hero.name + ` turns in the chair, away from the Waterbys, to the table for two.`; },
        run: function (S, e) { var knows = e.key === 'barley' || S.made(e, 'Religion'); // (Barley knows a Dominion mender's glass: he was one of theirs)
          if (knows) { S.f.katMirror = 1; S.look('katarina', kn(S) + `'s hand goes to the glass at her neck. She puts her spoon down and eats no more.`); } else S.look('katarina', kn(S) + ` covers the glass at her neck with her hand.`);
          S.look('gennet', `Gennet looks at ` + e.hero.name + `, a beat too long.`); }, warm: function () { return -1; } }, // (his: "questions pointed at Kat cool the conversation")
      // ---- the house: who built this place, as deep as the table's warmth allows (the realm's history, TarlynsPit/wiki/halfway-inn-and-lake.md, CANON 11-11)
      { id: 'house', t1: false, who: ['barley', 'aurdin', 'vivian'], skill: function (S, e) { return e.key === 'aurdin' && sharp(S, e) ? 'History' : null; },
        say: function (S, e) { return e.key === 'barley' ? `Good stone. Who built the place?` : e.key === 'vivian' ? `How long have you kept the place?` : sharp(S, e) ? `That cellar is older than the walls over it. What was here before it was an inn?` : `How old is the house?`; },
        run: function (S, e) {
          var trader = `"A trader paid for it. He'd got rich keeping his goods in the cellar here, when the cellar was all there was. The Half-Cellar. The drovers still say it."`;
          var deep = function (all) { if (S.warm < 2) return; S.f.heardBuilt = 2; if (all) S.by('doranIn', `"A road friend of his kept it first, and that man's son after. The grandson lost it at dice the year the old man died. Nobody can tell you their name now."`); S.by('doranIn', `"It was falling in when it came to me."`); };
          S.f.heardBuilt = 1;
          if (e.key === 'barley') { S.by('doranIn', `"Slaves. Who else?"`); S.by('doranIn', trader); deep(true); } // (his: "'slaves, who else?' can be one layer answer")
          else if (e.key === 'vivian') { S.by('gennet', `"Waterby, since the wedding."`); S.by('doranIn', `"Longer, me."`); deep(false); }
          else if (sharp(S, e)) { S.by('doranIn', trader); deep(true); } // (the sharper question starts past "slaves")
          else { S.by('doranIn', `"The lake's older. It named the place. The house is three men's lifetimes, and the cellar under it is older than that."`); deep(true); }
          S.reads(['years', 'ring']); }, warm: function (S, e) { return e.key === 'barley' ? 1 : 0; } },
      { id: 'came', t1: false, who: ['barley', 'aurdin', 'vivian'], needs: function (S) { return !!S.asked.house && S.warm >= 2; },
        say: function (S, e) { return e.key === 'barley' ? `How does a house like this come to a man?` : e.key === 'aurdin' ? `And after the grandson?` : `Who had it before you?`; },
        run: function (S) { S.by('doranIn', `"A man won it at dice and had no use for an inn. He gave it to me."`); S.reads(['fought']); } },
      // ---- the Dominion (his: "all become naught but travelers at the half-way inn, or they aren't welcomed back ... arrangements are sometimes made with repeat guests on schedules")
      { id: 'dom', t1: false, who: ['barley', 'aurdin', 'vivian'], ok: function (S, e) { return e.key !== 'aurdin' || !!S.f.heardDominion; }, // (11-11, Griz: "is aurdin asking about dominion at the moot before he'd have reason to (heard rumor, etc)")
        say: function (S, e) { return e.key === 'barley' ? `I was one of theirs, once. Does the Dominion stop here?` : e.key === 'aurdin' ? `Dominion at a gnoll moot. Do they come this way?` : `Any Dominion custom out here?`; },
        run: function (S, e) { S.f.heardTravelers = 1; S.by('gennet', `"No Dominion under this roof, and no Hex. All are naught but travelers at the Halfway Inn. Them that can't be aren't welcomed back."`);
          if (e.key === 'barley' && S.kat && !S.f.katInk) { S.f.katHeardBarley = 1; S.look('katarina', `At the table for two, ` + (S.f.katLooked ? `Katarina's` : `the traveler's`) + ` pen stops.`); } } },
      { id: 'regular', t1: false, who: ['barley', 'aurdin', 'vivian'], needs: function (S) { return !!S.asked.dom; }, say: function (S, e) { return e.key === 'vivian' ? `Not even the ones who pay?` : `Not even the regulars?`; }, run: function (S) { SU.regular(S); } },
      // ---- the supper after the party saw Gennet with Amara (ruling 33): tense, and nothing in it starts a fight
      { id: 'a1', kinds: ['amara'], t1: true, who: ['lymen'], say: function () { return `Who was the woman with the wagon?`; }, run: function (S) { S.by('gennet', `"A carter. She waters here every month. She pays for her rooms, like you."`); } },
      { id: 'a2', kinds: ['amara'], t1: true, who: ['barley'], say: function () { return `What did she pay you?`; }, run: function (S) { S.look('doranIn', `Doran looks at his plate.`); S.by('gennet', `"For rooms and feed. The same as you will, in the morning."`); }, warm: function () { return -1; } },
      { id: 'a3', kinds: ['amara'], t1: true, who: ['vivian'], skill: function () { return 'Deception'; }, say: function () { return `We heard a wagon. We didn't get up.`; },
        run: function (S, e) { if (S.made(e, 'Deception', 'lie')) { S.f.supSlept = 1; S.by('gennet', `"No. Why would you."`); S.look('gennet', `Gennet lets her shoulders down.`); } else S.by('gennet', `"I heard the stair."`); }, warm: function (S, e) { return S.made(e, 'Deception', 'lie') ? 0 : -1; } },
      { id: 'a4', kinds: ['amara'], t1: true, who: ['aurdin'], say: function () { return `It's your house. We're guests in it.`; }, run: function (S, e) { S.by('gennet', `"That's right."`); S.look('doranIn', `Doran looks up at ` + e.hero.name + `, for the first time tonight.`); } },
      { id: 'apass', kinds: ['amara'], t1: true, any: true, say: function () { return `We sleep light.`; }, run: function (S) { S.by('gennet', `"So I heard."`); } },
      { id: 'a5', kinds: ['amara'], t1: false, who: ['vivian'], ok: function (S) { return S.glam; }, say: function () { return `The little one. Whose is she?`; },
        run: function (S) { S.by('gennet', `"Mine, now. The carter couldn't keep her. Somebody has to raise them."`); S.look('elsbeth', `Elsbeth looks at Gennet's back, and holds it.`, 'gennet'); } }, // (ruling 30: the glamour broken, she keeps the child in the open and feigns raising her)
      { id: 'a6', kinds: ['amara'], t1: false, who: ['lymen'], ok: function (S) { return S.glam; }, say: function () { return `She'll stay here, then? The child.`; },
        run: function (S) { S.by('gennet', `"Where else?"`); S.by('doranIn', `"Until she's grown."`); S.look('doranIn', `Doran says it to the table.`); } },
      { id: 'nameq', kinds: ['amara'], t1: false, read: 'noname', say: function () { return `What do you call her?`; }, run: function (S) { S.look('gennet', `Gennet takes a breath before she answers.`); S.by('gennet', `"We've not settled on it."`); }, warm: function () { return -1; } },
      { id: 'a7', kinds: ['amara'], t1: false, who: ['lymen'], ok: function (S) { return !S.glam; }, say: function () { return `What did she leave in your barn?`; }, run: function (S) { S.by('gennet', `"Feed for her greys. She'll want it on her way back."`); }, warm: function () { return -1; } },
      { id: 'barnq', kinds: ['amara'], t1: false, read: 'barnbowl', say: function () { return `Who eats in the barn?`; }, run: function (S) { S.by('gennet', `"The cat. Elsbeth spoils it."`); S.look('elsbeth', `Elsbeth stops in the kitchen doorway, then goes on.`); }, warm: function () { return -1; } },
      { id: 'a8', kinds: ['amara'], t1: false, who: ['barley'], say: function () { return `Good fish. I'll say that for the house.`; }, run: function (S) { S.by('doranIn', `"It's the lake's."`); } },
      K(mend, ['amara']), // (no gossip at this supper: nobody is asking after the road tonight)
      // ---- Gennet alone, Doran away two days (ruling 29); her own road told only here (the realm's history, CANON 11-11)
      { id: 'g1', kinds: ['alone'], who: ['lymen'], say: function (S) { return S.wagonKnown ? `Will he be all right on that road, alone with them?` : `What load goes down to the Pit at night?`; },
        run: function (S) { if (S.wagonKnown) S.by('gennet', `"He's driven worse loads. The Pit's people will take them off him."`); else S.by('gennet', `"A carter's wagon wanted a driver. He's obliging, my husband."`); }, warm: function (S) { return S.wagonKnown ? 0 : -1; } }, // (11-11, Griz: "if he's gone with the wagon because they stopped amara and everyone at the table knows that's the wagon he's out with, her answers don't make sense")
      { id: 'g2', kinds: ['alone'], who: ['barley'], say: function () { return `You lay his place when he's gone.`; }, run: function (S) { S.by('gennet', `"He comes back. That one always comes back."`); }, warm: function () { return 1; } },
      { id: 'g3', kinds: ['alone'], who: ['vivian'], say: function () { return `How did you come to the inn?`; },
        run: function (S) { S.f.heardGennetRoad = 1; S.by('gennet', `"On foot, with two boys. My first man was taking us down the road. He stopped at the lake to fish."`); S.look('gennet', `Gennet looks at the lake door.`); S.by('gennet', `"I came on to the inn without him."`); S.reads(['sawit']); } },
      { id: 'sawq', kinds: ['alone'], read: 'sawit', say: function () { return `You saw what took him.`; },
        run: function (S) { if (S.warm >= 2) { S.f.heardGennetSaw = 1; S.by('gennet', `"I saw the water take him. I saw enough."`); S.by('gennet', `"And then the same water gave me a roof and a husband. You tell me what does that, if it isn't a god."`); } else S.by('gennet', `"I saw a man go fishing."`); } },
      { id: 'g4', kinds: ['alone'], who: ['aurdin'], say: function () { return `You keep the lake's nights. Who taught you how?`; }, run: function (S) { S.f.heardRite = 1; S.by('gennet', `"Nobody. I worked it out. Somebody had to."`); S.by('gennet', `"Someone has to speak to the spirits here, or they speak to you."`); } },
      { id: 'gpass', kinds: ['alone'], any: true, say: function () { return `It's a quiet house tonight.`; }, run: function (S) { S.by('gennet', `"It's a quiet road."`); } },
      K(news, ['alone'], { t1: undefined, who: ['lymen'] }), { id: 'gidle', idle: true, kinds: ['alone'], who: ['aurdin', 'vivian', 'barley', 'lymen'], say: function (S, e) { return e.key === 'barley' ? `Good bread.` : e.key === 'vivian' ? `The boys are quiet tonight.` : e.key === 'aurdin' ? `It's a still night on the water.` : `Thank you for the supper.`; }, run: function (S, e) { S.by('gennet', e.key === 'barley' ? `"Elsbeth's. I showed her once."` : e.key === 'vivian' ? `"They're fed and abed. They miss him."` : e.key === 'aurdin' ? `"It's always still. That's how you know it's listening."` : `"You paid for it."`); } }, K(mend, ['alone'], { t1: undefined }),
      // ---- sacrifice night (ruling 23: the poison dinner is the due's own night, a supper like the others): the bowls are In.meal's end
      { id: 's1', kinds: ['sacrifice'], who: ['lymen'], say: function () { return `You're quiet tonight.`; }, run: function (S) { S.by(S.doran ? 'doranIn' : 'gennet', `"Long day."`); } },
      { id: 's3', kinds: ['sacrifice'], who: ['aurdin'], say: function () { return `What's the night, that the good bread's out?`; }, run: function (S) { S.by('gennet', `"A night like any. Eat."`); if (S.doran) S.look('doranIn', `Doran looks at the lake door, and away.`); } },
      { id: 's4', kinds: ['sacrifice'], who: ['vivian'], say: function () { return `You've salted it tonight.`; }, run: function (S) { S.by('gennet', `"A bit."`); } },
      { id: 'spass', kinds: ['sacrifice'], any: true, say: function () { return `Good stew.`; }, run: function (S) { S.by('gennet', `"Eat it, then."`); } }
    ];
  })();
  In.passive = function (h, skill) { return 10 + DS.R.skill(h, skill, In.AB[skill]); };
  // what opens a supper, by its kind: the room, who is in it, what the house says before the question -- then the question (the last line is the flip's prompt)
  In.SUP.open = function (S, kind) {
    var f = S.f, kat = function () { if (!S.kat) return; if (f.katLooked) { S.narr(`Katarina is at the table for two by the fire, a pen in her hand and her plate pushed to one side.`); S.look('katarina', `Katarina nods to the party, and goes back to her page.`); } else S.narr(`At the table for two by the fire a traveler eats alone, a pen in her hand.`); };
    var made = function () { var how = In.SUP.threadOpen(S, 'made'); if (S.d < 10 || !how || S.f.toldMirrorFought) return; S.raised = 1; S.by('gennet', how === 'fix' ? `"They're saying something new about the things with the eyes. Have you seen one yet?"` : `"Have you seen one? The things with the eyes. Everyone through that door has a cousin who has."`); }; // (ruling 8: from day 10 they raise the made things themselves)
    if (kind === 'first') {
      S.narr(`Lake fish, at the long table. The Waterbys sit down with their guests. Elsbeth carries, and does not sit.`); kat();
      if (S.renown >= 5) S.by('doranIn', `"The corridor's own, the drovers are calling you. Sit down, sit down."`); else if (S.renown >= 3) S.by('doranIn', `"You're the ones off Hessle's board. The drovers tell it at this table before their coats are off."`); // (ruling 27: renown 3 or better, the work named)
      made(); S.by('gennet', `"What brings you down the road?"`);
    } else if (kind === 'later') {
      S.narr(`Supper again at the long table: lake fish, and the bread is fresh.`); kat(); made();
      S.by('gennet', S.warm >= 2 ? `"Back again, and whole. Sit. What did the road show you?"` : `"You'll be wanting supper. What did the road show you?"`);
    } else if (kind === 'amara') {
      S.narr(`Supper at the long table. Nobody has said anything about last night.`);
      if (S.glam) S.narr(`There is a child at the kitchen table with a bowl, small, in a dress too big for her. Elsbeth feeds her.`);
      kat(); S.by('gennet', `"You were up late. I heard the stair."`);
    } else if (kind === 'alone') {
      S.narr(`Supper at the long table. Doran's chair is empty. Gennet has laid his place all the same.`); S.narr(`Elsbeth carries. With her father gone she is slower about it.`); made();
      S.by('gennet', S.wagonKnown ? `"Doran's taken that wagon down to the Pit, and the little ones in it. Two days, he said. So you've only me to talk at."` : `"Doran's gone down the road with a load. Two days, he said. So you've only me to talk at."`);
    } else {
      // THE KEPT-CHILD NIGHT (RULED 11-11, ruling 50, Griz: "kept child night Gennet would be super happy, elsbeth with the bowls as a stand out anyway - re-affirms parties
      // where she told them it was tonight. Doran nervous, assuming the party will always be in the big room at this point - he'll reassure them they should sleep well in it";
      // "pretty sure we script the lantern after they go to bed"): no draught, no lamp at supper -- the singing wakes them after (js/secondact.js A.dueNight)
      S.narr(`Supper at the long table: lake fish, a stew, the good bread. Gennet hums as she ladles.`);
      S.look('elsbeth', `Elsbeth sets each bowl down as if it might break, and looks at nobody.`);
      if (S.doran) { S.look('doranIn', `Doran has not touched his own bowl.`); S.by('doranIn', `"You'll sleep well tonight. The big room's made up for you."`); S.f.bigRoom = 1; } // (RULED 11-12, Griz: "Doran can't talk about it not carrying if the singing is supposed to wake them" -- "Nothing carries up there" is cut, "You'll sleep well tonight" kept; and the night is played in the big room (ruling 50: "assuming the party will always be in the big room at this point"), so his line gives it if it was not theirs yet: the seat's call)
      S.by('gennet', `"Eat up, eat up. It's a good night."`);
    }
  };
  In.meal = function* (sc, B, seat, kind) {
    var st = sc.st, f = st.flags, d = In.day(D.roam.q), MD = In.MEAL, SU = In.SUP, who = function (id) { return In.speaker(seat, id); };
    kind = kind || In.supKind(f, d, seat);
    var four = seat.four.filter(function (u) { return u.src && !u.src.dead && !u.src.ko; }).map(function (u) { return { u: u, h: u.src, key: u.src.key || u.src.id, hero: In.heroOf(u), side: In.sideOf(u.x) }; });
    var st0 = In.supStart(f, kind), c = In.dueCycle(d);
    var S = { f: f, d: d, kind: kind, warm: st0.warm, cap: st0.cap, asked: {}, opened: {}, q: [], qd: {}, cur: {}, seen: {}, out: [], rolls: {}, turn: 0, cooled: false, renown: In.renown(),
      kat: kind !== 'alone' && kind !== 'sacrifice' && In.katHere(f, d) && !!seat.folk.katarina, doran: !!seat.folk.doranIn, glam: !!f.glamourBroken,
      wagonKnown: !!(f.wagonStopped || f.wagonDelivered || f.wagonOutcome === 'inn'), offer: kind === 'sacrifice' ? (In.offering(f, c) === 'none' ? 'none' : 'kept') : null, tell: f.wagonStopped ? 'full' : (f.elsbethTier || 0) >= 2 ? 'faint' : 'none', push: {} };
    // NOBODY SPEAKS WHO IS NOT IN THE HOUSE (11-12, the inn seat; Griz on Gennet's supper alone, 11-11 2329Z: "doran has a line when I ask her 'no. tell it' and he's
    // supposed to be gone"): the road's gossip, the witness and every other answer written as Doran's is GENNET's at a table he is not at, and a look of his or at him
    // is not staged at all
    var here = function (id) { return id !== 'doranIn' || S.doran; };
    S.by = function (id, line) { S.out.push({ by: here(id) ? id : 'gennet', line: line }); }; S.narr = function (line) { S.out.push({ narr: line }); }; S.look = function (id, line, at) { if (!here(id) || (at && !here(at))) return; S.out.push({ look: id, line: line, at: at || null }); };
    S.reads = function (ids) { ids.forEach(function (id) { if (!S.qd[id]) { S.qd[id] = 1; S.q.push(id); } }); };
    // a check, rolled once a hero a skill a supper, silently: the play record has it, the screen never (ruling 4)
    S.made = function (e, skill, dc) { var k = e.key + ':' + skill; if (S.rolls[k] == null) { var r = In.d20(), v = DS.R.skill(e.h, skill, In.AB[skill]), need = MD.DC[dc || skill]; S.rolls[k] = r + v >= need; In.trail(e.hero.name + ' ' + skill + ' ' + r + (v >= 0 ? ' + ' : ' - ') + Math.abs(v) + ' = ' + (r + v) + ' vs DC ' + need + (S.rolls[k] ? ', made' : ', missed') + ' (silent)'); } return S.rolls[k]; };
    S.canPush = function (e) { return S.offer === 'none' && (S.tell === 'full' || !!(S.opened[e.key] || {}).bowl); };
    var wait = function (o) { return o.narr ? sc.narr([o.narr]) : o.look ? sc.lookAt(who(o.look), [o.line], o.at ? who(o.at) : null) : sc.by(who(o.by), [o.line]); };
    f.mealHad = 1; f.mealDay = d; f.supCount = (f.supCount || 0) + 1; f.supKind = kind; if (kind === 'amara') f.supAmara = 1; if (kind === 'alone') f.supAlone = 1;
    In.trail('supper: ' + kind + ', day ' + d + ', renown ' + S.renown + ', the table ' + ['cold', 'civil', 'warm'][S.warm]);
    if (kind === 'first' || kind === 'later') { var had = f.supAsked || {}; SU.KEPT.forEach(function (k) { if (had[k]) S.asked[k] = 1; }); var rd0 = f.supReads || {}; ['counted', 'rich', 'coin'].forEach(function (id) { if (!rd0[id]) S.reads([id]); else S.qd[id] = 1; }); }
    else S.reads({ amara: ['barnbowl', 'noname'], alone: [], sacrifice: [] }[kind]);
    SU.open(S, kind);
    // DORAN'S FIRST SUPPER HOME (RULED 11-12, ruling 56, Griz on the lean "one line, that the Pit's people took them": "add in 'snoot getting worse' line as well"): the
    // first table he sits at after driving the wagon down, two lines of his before Gennet's opener, once
    if (S.doran && f.doranPit && !f.doranPitSaid) { f.doranPitSaid = 1; S.out.splice(Math.max(0, S.out.length - 1), 0, { by: 'doranIn', line: MD.pit[0] }, { by: 'doranIn', line: MD.pit[1] }); In.trail('Doran\'s first supper home: the Pit\'s people took them; the Snoot getting worse'); }
    var prompt = S.out.pop(), i; for (i = 0; i < S.out.length; i++) yield wait(S.out[i]);
    var reach = function (e, id) { var r = SU.READS[id]; return !!r && (!r.ok || r.ok(S)) && In.passive(e.h, r.skill) >= SU.dc(r); };
    var optsOf = function (e) { // (the hero's answers this opening: what a read opened first, MD.CAP at most, ONE skill-shaded -- the rest hold)
      var ok = SU.ASK.filter(function (o) {
        if ((o.kinds || ['first', 'later']).indexOf(kind) < 0) return false;
        if (o.t1 === true && S.turn !== 1) return false; if (o.t1 === false && S.turn === 1) return false;
        if (S.asked[o.key || o.id] && !o.again) return false;
        if (!o.all && (o.any ? SU.FOUR.indexOf(e.key) >= 0 : o.who && o.who.indexOf(e.key) < 0)) return false;
        if (o.read && !(S.opened[e.key] || {})[o.id]) return false;
        if (o.ok && !o.ok(S, e)) return false; if (o.needs && !o.needs(S, e)) return false;
        return true;
      });
      var lead = ok.filter(function (o) { return o.read || o.lead; }), tail = ok.filter(function (o) { return o.last; }), rest0 = ok.filter(function (o) { return lead.indexOf(o) < 0 && !o.last; }), rest = rest0.filter(function (o) { return !o.idle; }).concat(rest0.filter(function (o) { return o.idle; })), out = [], shaded = 0; // (idle talk after the avenues)
      lead.concat(rest).forEach(function (o) { if (out.length >= MD.CAP) return; var sk = o.skill ? o.skill(S, e) : null; if (sk) { if (shaded) return; shaded++; } out.push({ o: o, label: o.say(S, e), shade: !!sk, tag: sk || null }); });
      return out.concat(tail.map(function (o) { return { o: o, label: o.say(S, e), shade: false, tag: null }; }), [{ o: null, label: MD.bed }]);
    };
    var fill = 0, turns = MD.TURNS[kind], ended = null;
    for (S.turn = 1; S.turn <= turns && four.length; S.turn++) {
      // ONE read a hero: the oldest waiting that hero reaches; a read no hero reaches, or whose moment is not this state's, is dropped
      S.q = S.q.filter(function (id) { return four.some(function (e) { return reach(e, id); }); }); S.cur = {};
      S.q.forEach(function (id) { var r = SU.READS[id], best = null; four.forEach(function (e) { if (S.cur[e.key] || !reach(e, id)) return; var pv = In.passive(e.h, r.skill); if (!best || pv > best.pv) best = { e: e, pv: pv }; }); if (!best) return; // (RULED 11-11, Griz: "the whole party is getting talking points from a single insight only one character had and didn't talk about")
        S.cur[best.e.key] = id; if (r.opens) (S.opened[best.e.key] = S.opened[best.e.key] || {})[r.opens] = 1; });
      var list = four.map(function (e) { var id = S.cur[e.key], r = id && SU.READS[id], ops = optsOf(e); return { e: e, hero: e.hero, side: e.side, key: e.key, rid: id || null, reads: r ? [typeof r.text === 'function' ? r.text(S) : r.text] : [], ops: ops,
        opts: ops.map(function (p) { return p.label; }), marks: ops.map(function (p) { return p.shade ? { shade: true, tag: p.tag } : null; }), ids: ops.map(function (p) { return p.o ? p.o.id : 'bed'; }), shaded: ops.filter(function (p) { return p.shade; }).length }; }); // (ids, shaded: a bench's -- dev/bench16.js flipPick, the two rules' checks)
      list.forEach(function (x) { if (x.rid && SU.READS[x.rid].skill === 'Insight') In.edgeSet(S.f, x.key, x.hero.name); });
      list.forEach(function (x) { if (x.rid) In.trail(x.hero.name + ' passive ' + SU.READS[x.rid].skill + ' ' + In.passive(x.e.h, SU.READS[x.rid].skill) + ' vs DC ' + SU.dc(SU.READS[x.rid]) + ', read: ' + x.rid); });
      var at0 = Math.max(0, list.map(function (x) { return x.key; }).indexOf(S.lastKey));
      var pk = yield sc.flip(who(prompt.by), [prompt.line], list, at0), x = list[pk && pk.at != null ? pk.at : at0] || list[0], p = x.ops[pk && pk.k != null ? pk.k : x.ops.length - 1] || x.ops[x.ops.length - 1];
      ((pk && pk.seen) || [at0]).forEach(function (k) { var y = list[k]; if (!y || !y.rid) return; S.seen[y.rid] = 1; var r = SU.READS[y.rid]; if (r.fx) r.fx(S); }); // (a read's mark only where the player looked)
      Object.keys(S.cur).forEach(function (k) { var id = S.cur[k]; S.q = S.q.filter(function (y) { return y !== id; }); });
      S.lastKey = x.key;
      if (!p.o) break; // (TO BED: the openings left are lost)
      var o = p.o, e = x.e; S.asked[o.key || o.id] = 1; S.out = []; sc.hero = e.hero; sc.heroSide = e.side;
      In.trail(e.hero.name + ': ' + p.label);
      if (o.pre) yield sc.narr([o.pre(S, e)]);
      o.run(S, e);
      var dw = o.warm ? o.warm(S, e) : 0, w0 = S.warm; S.warm = Math.max(0, Math.min(S.cap, S.warm + dw));
      if (S.warm < w0) { S.cooled = true; delete S.asked.mend; }
      if (S.warm !== w0) { In.trail('the table ' + ['cold', 'civil', 'warm'][S.warm]); if (S.warm > 0) S.look('gennet', S.warm > w0 ? MD.tell.warm : MD.tell.cool); }
      f.mealWarm = S.warm;
      if (o.end) { ended = o.end; for (i = 0; i < S.out.length; i++) yield wait(S.out[i]); break; }
      var lo = S.out[S.out.length - 1], last = S.turn < turns && S.warm > 0 && lo && lo.by && lo.line.length <= MD.PROMPT ? S.out.pop() : null; // (the last word the next opening's question, the reads on it -- a short one: a long line is said whole on its own pages, and Gennet's filler asks)
      for (i = 0; i < S.out.length; i++) yield wait(S.out[i]);
      if (S.warm <= 0) { sc.echo = null; yield sc.by(who('gennet'), [MD.tell.cold]); ended = 'cold'; break; } // (cold: supper ends early)
      prompt = last || { by: 'gennet', line: MD.more[fill++ % MD.more.length] };
    }
    sc.echo = null;
    // what the supper leaves on the save: the regard, what was asked, the reads had, and the counting -- seen and kept quiet it is the way to Elsbeth, alone, at
    // another hour (RULED 11-11, his "the insight is to approach her privately, that's to be at not-dinner times"); said aloud it is the fumble, and she gives nothing free
    f.innRegard = S.warm; f.mealWarm = S.warm;
    var kept = f.supAsked || {}; SU.KEPT.forEach(function (k) { if (S.asked[k]) kept[k] = 1; }); f.supAsked = kept;
    var rds = f.supReads || {}; Object.keys(S.seen).forEach(function (k) { rds[k] = 1; }); f.supReads = rds;
    if (S.seen.counted && !f.mealGirlSaid) f.mealWrong = 1; if (f.mealGirlSaid) delete f.mealWrong;
    if (kind === 'sacrifice') { // (the kept-child night: In.sacMeal has the night with the draught)
      yield sc.narr([`Gennet has the table cleared before the bowls are cold. "Early beds tonight. All of you."`]);
      B.roam.supBowls = { cycle: c, offer: 'kept', dose: {}, stopped: {} }; sc.hero = null; return; // (the night is the due's own from here: js/secondact.js A.dueNight)
    }
    sc.hero = null;
    if (ended !== 'cold') {
      if (kind === 'alone' && !f.bigRoom) { yield sc.by(who('gennet'), [`"Oh, heroes. Take the big room."`]); f.bigRoom = 1; } // (his line, 11-11; it may belong to the night of the chase. THE BIG ROOM IS THEIRS from this word: they wake in it, In.roomOf -- 11-12)
      if (kind === 'amara') { yield sc.narr([`Nobody has raised a voice. The fire is let down early.`]); yield sc.lookAt(who('gennet'), [`Gennet takes the lamp from its hook by the lake door, and does not hang it back until the party is on the stair.`]); }
      else { yield sc.narr([MD.close[0]]); yield sc.lookAt(who('gennet'), [MD.close[1]]); }
    }
    if (f.mealGirlSaid && S.asked.girl) yield sc.lookAt(who('gennet'), [`Gennet stands in the kitchen doorway until the party has gone up.`], who('elsbeth'));
    yield sc.narr([In.LINES.bed]);
  };

  // ---------------------------------------------------------------- the people: the inn lady's room, Elsbeth at the tub (the first game's S.gennet, S.elsbeth on the counter screen)
  In.has = function (st, id) { return D.counter.count(st, id) > 0 || st.party.some(function (h) { return h.equip && Object.keys(h.equip).some(function (s) { return h.equip[s] === id; }); }); };
  In.heads = function (B) { return ((B.roam && B.roam.members) || []).filter(function (u) { return u.src && !u.src.guest; }).length || 1; };
  // the rooms from Doran after the second act's ends (the lane's §10.3 beat 5): the due stopped, Gennet keeps her back to the room and sells nothing; Gennet killed, "You'll want the road" and no rooms again
  In.doranRoom = function* (sc, B) {
    var st = sc.st, f = st.flags, A = D.secondact, cost = In.PRICE * In.heads(B);
    if (In.noStay(f, In.day(D.roam.q))) { yield sc.say([].concat(M.words(B, 'doranIn'), In.CHILD.doranRoom)); return false; } // (the child in tow: In.CHILD)
    if (f.gennetDead || (f.gennetTaken && f.gennetLet)) { yield sc.say([].concat(M.words(B, 'doranIn'), A ? [A.LINES.doranRoad] : [])); return false; } // (the lake let have her: no rooms either -- 11-05, RULED; went back for her, he lets them: In.room, no supper)
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
    // (THE EVENING'S PEOPLE, 11-13, the poison-dinner walk's finding `dorantable`: a supper waited for from the day hours was sat by the people the floor stood when the party
    // asked -- Doran, behind the bar only from evening, was not at it. The floor is laid again by the hour waited to, its people stood by that hour, the house as it was laid)
    var defW = D.roam.def; if (defW && defW.key === In.KEY && B.roam && B.roam.token) { In.relaying = 'inn'; /* (the house laid OPEN for the supper, whatever door the party asked at: the inn lady is at the well of a morning, and a roofed house stands nobody of its inside -- Doran, the fireside) */ try { M.relay(B, hour, true); } finally { In.relaying = undefined; } var tW = B.roam.token; tW.tween = null; B.roam.path = null; D.grid.setup(B.map, B.units); B.cache = null; B.map.occKey = null; if (In.teamBlock) In.teamBlock(B); In.trail('the wait to ' + hour + ':00: the people of the floor stood by that hour'); }
  };
  // a short rest at the inn: an hour by the fire, the hit dice spent -- the house's one short rest on a floor since 11-05 (js/house.js H.shortRestOnFloor)
  In.shortRest = function (B) {
    var H = D.house, W = D.world, house = !!(D.roam.house() && H.playing);
    if (house) { var S = W.state(); S.t += In.REST.shortHours; W.save(); } else B.roam.hour = (In.hourOf(B) + In.REST.shortHours) % 24;
    var lines = H.shortRestOnFloor(B); M.lightNow(B);
    return lines;
  };
  // a room asked for (the inn lady's, or Doran's after the second act): by the hour -- 'meal' (the first supper, THE MEAL's own screen next), 'dinner', 'bed', or false; the
  // night's start and length kept on the floor (B.roam.stay) for the bed and the wagon night. noMeal: the supper as a line, not THE MEAL's scene
  // ONE LONG REST IN 24 HOURS AT THE INN (RULED 11-05 -- Griz: "the one-long rest per 24 hours per SRD is the way to go, how to handle that at the inns becomes the question ... At the
  // inn.. what, let them know that it'll be X hours when they wake up (where X is 'hours till can long rest' +8) ?", then "offer both"; js/house.js H.longOpen): when the night the
  // room would give ends inside 24 hours of the last long rest's end, the inn lady offers both sleeps -- SLEEP TILL RESTED, awake at the hour the long rest's benefit may land
  // (X = the hours till a long rest may begin + the night's own: 8, 11 with supper), or A NIGHT'S SLEEP, the night's hours with no long rest (a short rest's worth: js/house.js
  // H.sleepOnFloor o.noLong) -- with SHORT REST and NOT NOW; 24 hours or more since, the room as built. The choice rides the stay (B.roam.stay.long) to the bed and the wagon night
  In.nightHours = function (kind) { return kind === 'dinner' ? In.REST.dinnerHours : In.REST.lateHours; };
  In.longShut = function (kind) { var H = D.house; return !!(H && H.longOpen && !H.longOpen(In.nightHours(kind))); };
  In.tillRested = function (kind) { var H = D.house, wake = H.longWake(In.nightHours(kind)); return { wake: wake, hours: wake - H.now() }; };
  In.bothOpts = function (kind) { var H = D.house, tr = In.tillRested(kind), nh = In.nightHours(kind); return [In.LINES.opts.till.split('{when}').join(H.clockAt(tr.wake).toUpperCase()).split('{n}').join(Math.round(tr.hours * 10) / 10), In.LINES.opts.night.split('{n}').join(nh)]; };
  In.room = function* (sc, B, cost, noMeal) {
    // (the lake took the inn lady: no more suppers at the Waterbys' -- 11-05, his "dinners are over"; a room by Doran, eight hours)
    var st = sc.st, f = st.flags, kind = f.gennetTaken ? 'late' : In.restKind(In.hourOf(B)), pay = function () { if (st.silver() < cost) { D.sfx('error'); return false; } st.silver(-cost); D.sfx('coin'); return true; };
    var H = D.house, long = true, hours = null, both = function () { return In.bothOpts(kind); }; // (long: the night a long rest; hours: SLEEP TILL RESTED's own)
    if (kind === 'day') {
      var a = yield sc.ask(In.LINES.dinnerAt8.split('{n}').join(cost), [In.LINES.opts.short, In.LINES.opts.wait, In.LINES.opts.notNow]);
      if (a === 0) { var ls = In.shortRest(B); yield sc.say([In.LINES.shortRest].concat(ls)); return false; }
      if (a !== 1) return false;
      if (!pay()) { yield sc.say(L('g.poor')); return false; }
      In.waitTo(B, In.REST.dinnerAt); kind = 'dinner';
      yield sc.say(In.LINES.waited);
      if (In.longShut(kind)) { var a1 = yield sc.ask([In.LINES.shut, H.longWhy(In.nightHours(kind), false)], both()); long = a1 === 0; if (long) hours = In.tillRested(kind).hours; } // (the room paid at supper: which sleep)
    } else if (In.longShut(kind)) {
      var a3 = yield sc.ask([L('inn.stayAsk', { n: cost }), H.longWhy(In.nightHours(kind), false)], both().concat([In.LINES.opts.short, In.LINES.opts.notNow]));
      if (a3 === 2) { var ls3 = In.shortRest(B); yield sc.say([In.LINES.shortRest].concat(ls3)); return false; }
      if (a3 !== 0 && a3 !== 1) return false;
      if (!pay()) { yield sc.say(L('g.poor')); return false; }
      long = a3 === 0; if (long) hours = In.tillRested(kind).hours;
    } else {
      var a2 = yield sc.ask(L('inn.stayAsk', { n: cost }), ['STAY THE NIGHT', 'NO']);
      if (a2 !== 0) return false;
      if (!pay()) { yield sc.say(L('g.poor')); return false; }
    }
    B.roam.stay = { t0: In.clock(B), hours: hours || In.nightHours(kind), kind: kind, long: long };
    if (D.house && D.house.trail) D.house.trail('rest', 'the Halfway Inn: a room at ' + In.hourOf(B) + ':00, ' + (kind === 'dinner' ? 'supper and ' : 'no supper, ') + B.roam.stay.hours + ' hours' + (long ? '' : ', no long rest') + (hours ? ', till rested' : ''));
    if (kind === 'dinner') { if (!noMeal && !f.doranDead && !f.gennetDead && !f.doranConfessed && !f.lakeDone) return 'meal'; // (the second act's ends: the supper as a line -- the welcome's own words are those scenes')
      yield sc.say(In.LINES.dinner); return 'dinner'; } // (every room with supper is a supper at the long table since 11-11 -- In.supKind: the first, a later one, after Amara, Gennet alone, sacrifice night; Doran's rooms after the second act keep the line)
    yield sc.say(f.gennetTaken ? In.LINES.noCook : In.LINES.late); return 'bed';
  };
  In.gennet = function* (sc, B) {
    var st = sc.st, f = st.flags, cost = f.innFree > 0 ? 0 : In.PRICE * In.heads(B), A = D.secondact; // (innFree: the barn's bribe -- the rooms and the board hers, 11-11)
    if (f.innShut) { yield sc.say([].concat(M.words(B, 'gennet'), [In.BY.shut])); return false; } // (the child taken out of her yard at knifepoint, or after blows: no room from her)
    if (In.noStay(f, In.day(D.roam.q))) { yield sc.say([].concat(M.words(B, 'gennet'), In.CHILD.gennet)); return false; } // (the child in tow: no night under this roof -- In.CHILD)
    if (f.dueStopped && A) { yield sc.say([].concat(M.words(B, 'gennet'), [A.LINES.gaveBack, A.LINES.noRoom])); return false; }
    if (f.doranWaits && A) { In.trail('the inn lady refuses the bed: Doran is waiting at the lake door'); yield sc.say([].concat(M.words(B, 'gennet'), [In.who(In.named(f), A.LINES.bedRefused)])); return false; } // (RULED 11-13: js/secondact.js THE BED WITH DORAN WAITING) // (the due stopped on the path: no room from her; Doran sells)
    var d = In.day(D.roam.q), soon = []; // (RULED 11-11, ruling 35, Griz: "gennet shouldn't open about a monthly wagon she's going to be coy about at supper if she gets a linen question" -- In.WN.soon is said nowhere now) // (any other night: the month's wagon named without being named -- the lane's 11-04 §3 (d))
    if (soon.length) f.wagonNamed = 1;
    if (!f.gennetNamed) { f.gennetNamed = 1; yield sc.say([].concat(M.words(B, 'gennet'), [In.LINES.name], soon)); }
    else yield sc.say([].concat(M.words(B, 'gennet'), soon));
    var rr = yield* In.room(sc, B, cost); if (rr && f.innFree > 0 && f.innFree < 99) f.innFree--; return rr; // (by the hour, In.REST: the first room with supper is THE MEAL -- its own screen over the room, In.mealScene, then the bed line there)
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
    // HER LETTER in the big room's drawer (RULED 11-11, ruling 28: "her warning -- Silverton, then the dwarves -- comes to the party by her book's letter in the big room"; Griz:
    // "hope they click on the end-table and get Kat's book (with a letter pop-up as if she's speaking it that doesn't have to become inventory)"): the seat's draft, his to re-word
    letter: ['A folded sheet lies on the manuscript, in the same fair hand. It reads as she would say it.',
      '"To whoever is given this room after me. I meant to put this in your hands and say it aloud, and I am gone before I could."',
      '"What I told you at the fire was not all of it. The thing they made at the moot went north. North is all I know of it: not where it is bound, and not what for."',
      '"Warn Silverton. Warn the dwarves under the mountain. I would not write that down for a small thing."', // (RE-WORDED 11-13, Griz on eyes-chase-back-1112f, 0327Z: "Kat's letter says the thing is going specific places - north is all she knows. warn silverton... warn the dwarves - is good for how serious a threat it is without her knowing it's intent (which is technically the seat not silverton)" -- it had said "It is going to Silverton. After Silverton, the dwarves under the mountain. That is the order I heard it given in")
      '"The book is the rest. Read it or burn it. But carry that much north, and say a mender wrote it down right."'],
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
  // KATARINA'S FRONT END (RULED 11-12, ruling 57, Griz on the reading page's three leans for her: "all leans"; ruling 32: "Kat should be open after the ink, but before
  // that we should have them either skill check roll or conversationally navigate that info out somehow"; his "Kat spills all the beans immediately"). BEFORE THE INK
  // IS GIVEN (f.katVision) she is closed, and a visit to her table is ONE opening on the flip, as at supper: each hero has at most one shaded line, a line opens ONE
  // thing, and that is the visit -- Barley, who was one of theirs, his "You're with the Dominion." (what she is; it starts the ink errand as before); Aurdin's read of
  // the glass (passive Religion) the same by another door; Lymen's Persuasion the road south; Vivian's Insight, once the wagon is known, that she and Amara have met.
  // No die on the screen; the checks go to the play record. WHAT SHE SAW AT THE MOOT is held until after the ink (In.katOpts). A question about her glass asked
  // across the room at supper (f.katMirror) opens "what she is" the next time they sit down with her, and nothing more. AFTER THE INK her list is open, no checks
  // (In.katScene, as it was). The seat's lines: invented.json halfway-katarina-front-end-1112
  In.KV = { DC: { road: 12, glass: 13, amara: 13 },
    lines: { barley: `You're with the Dominion.`, aurdin: `That is a mender's token you wear.`, /* (no "glass", no "your neck": the supper's law reads every flip's lines for those -- dev/bench16.js mode=inn1104) */ lymen: `We mean to take the road south. What is on it?`, /* (RE-WORDED 11-13, Griz on eyes-kat-visit-1112f, 0327Z: "lymen's 'you came from the south road' is a presumption and silly if she was traveling with people who then turned around and went to the pit (his question differently could keep the same answer)" -- it was "You came up from the south. How is that road?"; her answer stands) */ vivian: `You and the woman on that wagon have met before.` },
    idle: { lymen: `Is the fire warm enough for you, there?`, aurdin: `What is the book?`, vivian: `Good evening.`, barley: `(A nod.)` }, idleBack: 'She does not look up from the page.',
    leave: `(Leave her to her book.)`, glassBack: 'She looks up before anyone has sat. "You asked about the glass, across the room. Ask it here."', close: 'She finds her place on the page with one finger. That is all she gives today.', spent: 'She has given what she gives today. Her finger is on her place in the book.' };
  // "THAT IS ALL SHE GIVES TODAY", MADE TRUE (11-13, Griz on eyes-kat-visit-1112f, 0327Z, BROKEN: "'that's all she gives today' (unless you talk to her again immediately
  // with the other real question(lymen then aurdin in this case)"): the day she gave a thing is kept (f.katGaveDay), and on that day no hero has a shaded line at her
  // table -- the small talk and the leaving only, under a line that says so. The next day her table is open to one more
  In.katHad = function (f) { return f.katHad || (f.katHad = {}); };
  In.katOpen = function (f, d, st) { return In.katLast(f, d) || !!f.katVision || (!!f.katInk && D.counter.count(st, 'ink') > 0) || (!f.katInk && f.wagonCycle == null && In.barleyIn(st)); }; // (... or Barley's first time at her table: his "You're with the Dominion." and the ink errand are said at once, as RULED 10-01c -- not a choice on the flip) // (her last day, the ink given, or the ink in hand: the talk as built)
  In.katVisit = function* (B) {
    var C = D.counter, R0 = B.roam, st = C.state(B), f = st.flags, KL = In.KL, KV = In.KV, had = In.katHad(f), began = false;
    var ku = B.units.filter(function (u) { return u.npc === 'katarina'; })[0];
    var who = { name: f.katLooked ? 'Katarina' : 'The traveler', unit: ku || null, side: 'right', sheet: C.SHEETOF && C.SHEETOF.katarina ? C.SHEETOF.katarina() : null };
    var four = R0.members.filter(function (u) { return u.src && !u.src.guest && u.hp > 0; }).map(function (u) { return { u: u, h: u.src, key: u.src.key || u.src.id, hero: In.heroOf(u), side: 'left' }; });
    var made = function (e, skill, dc) { var r = In.d20(), v = DS.R.skill(e.h, skill, In.AB[skill]), ok = r + v >= dc; In.trail('THE TRAVELER: ' + e.hero.name + ' ' + skill + ' ' + r + (v >= 0 ? ' + ' : ' - ') + Math.abs(v) + ' = ' + (r + v) + ' vs DC ' + dc + (ok ? ', made' : ', missed')); return ok; };
    if (D.house && D.house.trail) D.house.trail('talk', 'katarina');
    var sc = new C.Counter(B, { id: 'katarina', name: who.name, place: 'The Halfway Inn', what: 'the table for two by the fire', room: true, open: true, bg: In.roomShot(B), script: function (s) { return (function* () {
      if (!f.katLooked) { f.katLooked = 1; yield s.by(who, [KL.look]); }
      var today = In.day(D.roam.q), spent = f.katGaveDay != null && f.katGaveDay === today;
      if (f.katMirror && !had.what && !spent) { had.what = 1; f.katGaveDay = today; In.trail('THE TRAVELER: the glass asked about at supper -- what she is, and nothing more'); yield s.by(who, [KV.glassBack]); yield s.by(who, [KL.what]); yield s.narr([KV.close]); return; }
      if (f.katInk && !f.katVision) yield s.by(who, [L('kat.inkWait')]);
      var list = four.map(function (e) {
        var ops = [], k = e.key;
        if (spent) { /* (nothing more today) */ } else if (k === 'aurdin' && !had.what && In.passive(e.h, 'Religion') >= KV.DC.glass) ops.push({ id: 'what', label: KV.lines.aurdin, shade: true, tag: 'Religion' });
        else if (k === 'lymen' && !had.road && made(e, 'Persuasion', KV.DC.road)) ops.push({ id: 'road', label: KV.lines.lymen, shade: true, tag: 'Persuasion' });
        else if (k === 'vivian' && !had.amara && (f.katKnewAmara || f.wagonCycle != null) && In.passive(e.h, 'Insight') >= KV.DC.amara) ops.push({ id: 'amara', label: KV.lines.vivian, shade: true, tag: 'Insight' });
        ops.push({ id: 'idle', label: KV.idle[k] || `Good evening.` }); ops.push({ id: 'leave', label: KV.leave });
        return { e: e, hero: e.hero, side: e.side, key: k, reads: [], ops: ops, opts: ops.map(function (o) { return o.label; }), marks: ops.map(function (o) { return o.shade ? { shade: true, tag: o.tag } : null; }), ids: ops.map(function (o) { return o.id; }), shaded: ops.filter(function (o) { return o.shade; }).length };
      });
      if (!list.length) return;
      var pk = yield s.flip(who, [spent ? KV.spent : KL.prompt], list, 0), x = list[pk && pk.at != null ? pk.at : 0] || list[0], op = x.ops[pk && pk.k != null ? pk.k : x.ops.length - 1] || x.ops[x.ops.length - 1];
      s.hero = x.e.hero; s.heroSide = x.e.side; In.trail('THE TRAVELER: ' + x.e.hero.name + ': ' + op.label);
      if (op.id === 'leave') return;
      if (op.id === 'idle') { yield s.narr([KV.idleBack]); return; }
      had[op.id] = 1; f.katGaveDay = today; yield s.by(who, [KL[op.id]]); yield s.narr([KV.close]);
    })(); } });
    D.push(sc); while (!sc.done) yield 1;
    if (began && D.counter.count(st, 'ink') > 0) yield* M.talk(B, 'katarina', function (s2) { return In.katVision(s2, st, f); }); // (the bottle already in the pack: the vision at once, as it was)
  };
  In.katOpts = function (f, asked) {
    var free = f.katVision ? 2 : f.katInk ? 1 : 0, out = ['what', 'road'];
    if (f.katVision && (f.katSaw == null || free > f.katSaw)) out.push('saw'); // (RULED 11-12, ruling 57: what she saw at the moot is held until after the ink -- the ink's reward, with the vision)
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
  // THEY WAKE IN THEIR ROOM (11-12, the inn seat; Griz on the supper at renown 3, 11-11 1734Z: "Can we have them wake-up in the room, road end until the big room then the
  // big room"): a night at the inn is slept UPSTAIRS -- up the stair as the night begins, the morning's page over the guest floor, and the party stood by its bed: the small
  // room at the road's end (the west room, over the front door) until the big room is theirs (f.bigRoom: Gennet's "Oh, heroes. Take the big room.", or the green purse),
  // then the big room over the kitchen, by the good bed and its table. The night's hours and its page as before (In.bedding carries them up the stair; the guest floor's
  // script takes them up as it starts, and Elsbeth's gift the morning after with them). In.bedHere, In.stay, D.benchPage: a bench's -- the night slept where they stand, as it was
  In.ROOM = { road: { at: [2, 2], face: [0, 1] }, big: { at: [13, 2], face: [-1, 0] } };
  In.roomOf = function (f) { return f && f.bigRoom ? 'big' : 'road'; };
  In.sleepsHere = function () { return In.bedHere != null ? !!In.bedHere : !!(In.stay || D.benchPage); }; // (D.benchPage: dev/bench16.js's own page)
  In.sleep = function* (B, line) {
    if (B.roam.flags.invest && In.investOf(B)) return yield* In.investGo(B, 'to a bed'); // (INVESTIGATE's wait, and a bed taken instead: the night as watched -- its own morning and sleep, In.wagonRest)
    var stay = B.roam.stay, hours = null, wk = null; B.roam.stay = null;
    // (Doran's wait is the clock's, till dawn, not ended by a sleep as such: RULED 11-13 -- js/secondact.js THE BED WITH DORAN WAITING)
    if (stay) { hours = Math.max(1, stay.t0 + stay.hours - In.clock(B)); wk = M.wakeAt ? M.wakeAt((In.hourOf(B) + hours) % 24) : null; }
    var o = { line: line || (wk && wk.title === 'NIGHT' ? In.LINES.night : In.LINES.morning), hours: hours, noLong: !!(stay && stay.long === false), title: wk ? wk.title : null, music: 'inn' }; // (noLong: A NIGHT'S SLEEP inside the 24 hours, 11-05)
    var def = D.roam.def, rm = In.ROOM[In.roomOf(B.roam.flags)];
    if (def && def.key === In.KEY && !In.sleepsHere()) { In.bedding = { o: o, room: In.roomOf(B.roam.flags) }; In.trail('to bed upstairs: the ' + (In.bedding.room === 'big' ? 'big room' : 'road-end room')); yield* M.go(B, In.UP, rm.at, rm.face); return 'up'; }
    o.before = function () { M.lightNow(B); };
    yield* D.house.sleepOnFloor(B, o);
  };
  var scriptBed0 = D.roam.script;
  D.roam.script = function* (B) { // (the guest floor as it starts with a night to sleep: the morning there, then Elsbeth's gift if it is owed)
    var def = D.roam.def, bd = In.bedding, wt = In.watching;
    if (def && wt && B.roam && ((def.key === In.UP && wt.stage === 'up') || (def.key === In.KEY && wt.stage === 'yard'))) { // (THE WATCH KEPT UPSTAIRS: the wagon night carried from floor to floor -- In.wagonNight)
      In.watching = null; if (wt.stay) B.roam.stay = wt.stay;
      if ((yield* In.wagonNight(B, wt.d, wt.stage === 'yard' ? wt : null)) === 'up') return;
    }
    if (def && def.key === In.UP && bd && B.roam) { In.bedding = null; bd.o.before = function () { M.lightNow(B); }; In.woke = bd.room; yield* D.house.sleepOnFloor(B, bd.o); if (B.roam.flags.wagonGift) B.roam.flags.giftDown = 1; /* (her gift waits for them downstairs: In.giftWalk) */ }
    if (def && def.key === In.KEY && B.roam && B.roam.flags.wagonGift && B.roam.flags.giftDown) yield* In.giftWalk(B);
    yield* scriptBed0.apply(this, arguments);
  };
  // ELSBETH COMES TO THEM (11-13, his 0515Z note on eyes-wagon-seethrough-1112: "have elsbeth walk to the party when they come downstairs (finds the party sends to winters
  // bit)"): the morning after the wagon was stopped the party wakes upstairs, and her bundle and her word of Winters had been said there, on the guest floor, with her
  // nowhere on it. Now the gift waits (f.giftDown) until the party is down the stair: she walks from her tub to them, gives it and says it on her own screen, and walks back
  In.giftWalk = function* (B) {
    var R0 = B.roam, f = R0.flags, t = R0.token, els = B.units.filter(function (u) { return u.npc === 'elsbeth'; })[0], home = els ? [els.x, els.y] : null, face0 = els ? els.facing : null;
    delete f.giftDown;
    if (els) { var q = In.beside(B, els, t); In.trail('Elsbeth comes to the party with the bundle: from ' + home.join(',') + ' to ' + q.join(',')); yield* In.walk(B, els, q, [t.x - q[0], t.y - q[1]]); }
    yield* M.talk(B, 'elsbeth', function (sc) { return In.gift(sc, B); });
    if (els && B.units.indexOf(els) >= 0) { yield* In.walk(B, els, home); els.facing = face0; }
  };
  // a night at the inn: THE WAGON NIGHT on a WAGON DAY's evening, else the bed
  In.night = function* (B) {
    var f = B.roam.flags, d = In.day(D.roam.q); if (In.wagonTonight(f, d)) { yield* In.wagonNight(B, d); return; }
    // (THE DUE WAITS FOR ITS EVENING, 11-13, the inn seat's find on the walkthrough bench: a bed taken after midnight on the due's own calendar day played the due's night at
    // once, at one that morning, a day before its evening -- In.dueTonightOn asks only the day. A bed taken before noon is the tail of the night before: a plain sleep)
    if (D.secondact && D.secondact.dueNight && In.dueTonightOn(f, d) && In.hourOf(B) >= In.DUE_EVE) { yield* D.secondact.dueNight(B, d); return; } // (the due's own night, three on from the wagon's: 11-05)
    if ((yield* In.sleep(B)) === 'up') return; // (gone up to the room: the guest floor's script has the morning and the gift -- In.bedding)
    if (f.wagonGift) yield* M.talk(B, 'elsbeth', function (sc) { return In.gift(sc, B); }); // (the morning after the wagon came in off the road, stopped by day: js/wagon.js, In.wagonIn)
  };
  // the wagon brought in off the road (js/wagon.js: a day's fight on the Pit road, the pair down or away on the greys, the wagon turned for the nearest roof): the yard's
  // own ending as the night's has it -- Doran drives the children to Newland that same night, the inn lady keeps one, Elsbeth's gift the morning after
  In.wagonIn = function* (B) {
    var f = B.roam.flags, Wg = D.wagon; f.wagonDelivered = 1; f.doranAway = 1; f.wagonGift = 1;
    // (what the Waterbys keep for the due, 11-05 -- his "a poison dinner (likely fight) if they interrupt the wagon before it gets there": stopped south of the inn, before the
    // handover, all eight go to Newland and they keep none -- the due's night is the poison dinner, js/secondact.js; stopped north of it, the one handed over stays, seen through)
    if (f.wagonBroughtN === 7) { f.kidAtInn = 1; In.setOffering(f, f.wagonCycle, 'kept'); } else In.setOffering(f, f.wagonCycle, 'none');
    yield* In.say(B, Wg && Wg.LINES ? (f.wagonBroughtN === 7 ? Wg.LINES.broughtN : Wg.LINES.brought) : [L('wagon.doranTakes')], 'THE YARD');
    M.relay(B, null, true);
  };

  // ---------------------------------------------------------------- THE WAGON NIGHT (the lane's item 2: the first game's S.wagonNight, its words content/text.json wagon.*, the
  // second game's way -- the night as talk on the counter screen over the yard on the diamonds, the yard fight the grid's `wagonnight` on its own map, the traces as RULED 11-04 §1)
  In.WN = {
    // (INVESTIGATE's wait, 11-13: the seat's drafts, his to re-word -- the old card, content/text.json wagon.investigate, said "and out into the yard" before the party had gone)
    investWait: '{name} slips down the stair. Through the front door the wagon is still in the yard, the team in the traces. Out by the door for a closer look, or back up the stair to the window.',
    investOut: '{name} steps out into the yard.',
    investBack: '{name} goes back up the stair to the window.',
    fledHorses: 'They have the team loose and are away north up the road on the greys, into the dark toward Web Gulch.',
    fledFoot: 'They are away north up the road on foot, into the dark toward Web Gulch.',
    fledYard: 'In the yard the wagon stands where they left it.',
    // (one of the pair away and the other down -- 11-06, the yard's end RULED: 'fled' only with neither left standing; the chase goes after the one. The seat's lines, `{name}` the one away)
    fledOneHorses: '{name} has a grey loose and is away north up the road, into the dark toward Web Gulch.',
    fledOneFoot: '{name} is away north up the road on foot, into the dark toward Web Gulch.',
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
    back: 'Back in by the front door, and up to bed.',
    chaseYard: 'The yard is empty. Ruts turn out of it onto the road and go south. The wagon is gone, and the seven that were in it.',
    chaseGone: '"He\'s away with it. Down to the Pit, and the little ones with him. Two days, if the road lets him."', chaseKat: '"{who} went up on the bench beside him. Paid her nights out and never looked back."', bigRoom: '"Oh, heroes. Take the big room."',
    katRides: '{who} is up on the wagon\'s bench beside Doran when it goes. The table for two by the fire is cleared.', // (ruling 28, 11-12: the seat's line)
    katRides: '{who} comes out with her bag over her shoulder and goes up on the bench beside him. She does not look back at the house.',
    quietNight: 'The fair-haired man takes the horses round to the stable. The lamps go out one by one, all but one, and the house sleeps.' // (11-05: the lantern walks three nights on -- wagon.quietNight had it leave its post tonight)
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
  In.perceives = function (h, dc, bonus) { var e = In.edge, plus = e && !e.used && e.key === (h.key || h.id) ? 1 : 0, r = In.d20(), v = DS.R.skill(h, 'Perception', 'wis') + (bonus || 0), ok = r + v + plus >= dc; if (plus) { e.used = 1; In.edgeUsed = { name: h.name || e.name }; } /* (the insight's +1, once: In.edgeSet, 11-13) */ In.trail((h.name || h.id) + ' Perception ' + r + ' + ' + v + (plus ? ' + 1 (the insight)' : '') + ' vs DC ' + dc + (ok ? ', saw' : ', did not')); return ok; };
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
  // THE CHILD IN TOW (11-12, the inn seat; Griz at Sylvia's table, 11-11 2329Z: "doran's default 'click on him' should be axe portrait with a line, that line should
  // change after this encounter (the girl will be safest at the pit, come back in x nights)"; "have elsbeth point them toward the pit when they have the child, make it
  // a dialog with option to ask her to come, staying with father just be back in x days"; "with girl in tow, no inn-stay (if you're not back in x days)").
  // X IS THE NIGHTS TO THE DUE (RULED 11-11 night, Griz, on what the number is: "the night the chuul comes up vs current game day"): not a constant -- counted from the
  // game's day to the due's night as the line is said (In.nightsToDue; In.CHILD.nights, In.CHILD.days word it: tonight, tomorrow, in N). What happens to a party that is
  // NOT back by then is not ruled and nothing is built on it (the end of his note was lost: "I've lost the context required to remember" -- nothing owed): the due's day
  // as she joined is kept (f.childDue) and In.childLate says when it has passed.
  // NO INN-STAY: with her beside the token nobody takes a room from Gennet or from Doran -- except on the due's own night, when the house's night is the scene itself
  // (Doran's "be in this house": js/secondact.js A.ledNight, A.poisonNight). Her road to the Pit and where she is set down are not built: the seam
  In.CHILD = {
    left: function (f, d) { f = f || {}; d = d == null ? In.day(D.roam.q) : d; return In.nightsToDue(f, d); }, // (THE NEARER NIGHT, RULED 11-13, Griz on eyes-child-in-tow-1112, 0327Z: "the 30 nights is too weird, use the closer night if it hasn't happened yet" -- the nights to the nearest due not yet walked, whatever f.childDue a save carries; it supersedes ruling 59's lean (a), the count to the due a month on)
    nights: function (f, d) { var n = In.CHILD.left(f, d); return n === 0 ? 'tonight' : n === 1 ? 'tomorrow night' : 'in ' + (In.WORDS[n] || n) + ' nights'; },
    days: function (f, d) { return In.CHILD.nights(f, d); }, // (RULED 11-12, Griz: "time til due in days or nights as needed, night preferred" -- Elsbeth counts nights too)
    doranIdle: ['A big man gone quiet in the middle. He runs the yard. He sets the axe head down on the block.', '"The well\'s for drinking. Nobody draws from the lake."'], // (the realm's words for him, content/npcs.json doranYard, the second half now said by him)
    doranGirl: function (f, d) { return ['Doran lets the axe hang, and looks at the child before he looks at the party.', '"The girl will be safest at the Pit. Take her down. Come back ' + In.CHILD.nights(f, d) + '."']; }, // (HIS: "the girl will be safest at the pit, come back in x nights")
    elsbeth: ['Elsbeth looks at the child, and then at the yard door.', '"Take her to the Pit. Not Silverton. Silverton\'s where the wagon was going."'], // (ruling 40, her yard line said again at the tub)
    elsbethAsk: '"Go today. Don\'t sleep here with her."', come: 'ASK HER TO COME', go: 'GO',
    elsbethStay: function (f, d) { return ['"No. I\'m staying with Father."', '"Just be back ' + In.CHILD.days(f, d) + '."']; }, // (HIS: "staying with father just be back in x days")
    gennet: ['Gennet looks at the child at the party\'s side before she looks at anyone else. "A room? Of course. And a cot for the little one, by the kitchen."', '{g}Not with her in tow. Nobody sleeps under this roof tonight.{/}'],
    doranRoom: ['"Not tonight. Get her down to the Pit first."'] };
  // THE COUNT IS TO THE NEXT DUE (RULED 11-12, ruling 59, Griz: "go with the leans, we'll deal with calendar issues down the road" -- the leans: "the nights until the due; late
  // costs only the night itself, the lake unfed as it is built" and "(a) the days are counted to the NEXT due, a month on, and this one passes unfed"): f.childDue is the due a
  // month on from the one she was taken before, and Doran's and Elsbeth's "x nights" count to it. THIS ONE PASSES UNFED for a party that is down the road with her, as it is
  // built: nothing fires away from the house. THE SEAT'S CALL, for his overrule: the due is not struck off as she leaves the yard -- a party that is in the house on this
  // due's own night all the same gets that night as built (Doran's confession in the yard, "be in this house", stands; In.noStay lets that one night in). Late for the next
  // one costs only that night
  In.childTaken = function (f, d) { f.childDue = d + In.nightsToDue(f, d); return f.childDue; }; // (11-13: the nearer due, not the one a month on -- his "use the closer night if it hasn't happened yet")
  In.noStay = function (f, d) { return !!f.childGuest && !In.dueTonightOn(f, d); };
  In.childLate = function (f, d) { return !!f.childGuest && f.childDue != null && d > f.childDue; }; // (the due's night she was to be back for has passed; nothing reads it: what lateness costs is his to rule)
  In.doranYard = function* (sc, B) { var f = sc.st.flags; if (f.childDead && !f.childDeadSaid) { f.childDeadSaid = 1; yield sc.say(In.ROAD.doranDead, 'axelow'); return; } /* (the child killed on the road: once, 11-12) */ if (!f.childGuest && f.childAtPit && !f.doranPitHeard) { f.doranPitHeard = 1; yield sc.say(In.ROAD.doranBack(f), 'axelow'); return; } /* (ruling 59: back from the Pit without her, once) */ if (f.childGuest) { f.doranSent = 1; yield sc.say(In.CHILD.doranGirl(f), 'axelow'); return; } /* (pt_doranaxe's `axelow`: "Doran lets the axe hang") */ yield sc.say(In.CHILD.doranIdle); };
  M.tell2 = function (w, lines) { if (w && lines && lines.length) w.tell = [].concat(lines); return w; }; // (a line's own TELL ME ABOUT IT given as words, not a text key: js/mines.js M.tell)
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
    if (!o.foe && D.counter) D.counter.dress(u, o.id); // (one with a figure of their own wears it, as on the floor (js/town.js T.people): Gennet in the yard and on the due's walk, Katarina in the yard on the wagon night -- js/counter.js C.FIG, 11-05; the facing is the scene's, below)
    u.facing =D.spr.facingFor(o.face ? o.face[0] : -1, o.face ? o.face[1] : 0); u.anim = 'idle'; u.animT = B.t;
    if (o.lantern) { u.torch = D.light.make('lantern', false); D.light.regrip(u); }
    B.units.push(u); D.grid.setup(B.map, B.units); B.cache = null;
    return u;
  };
  In.gone = function (B, u) { if (!u) return; B.units = B.units.filter(function (x) { return x !== u; }); D.grid.setup(B.map, B.units); B.cache = null; };
  In.hop = function (B, u, nx) { u.tween = { fx: u.x, fy: u.y, fz: D.grid.gzAt(u, u.x, u.y), t: 0, dur: In.PACE, mode: null }; u.facing = D.spr.facingFor(nx[0] - u.x, nx[1] - u.y); if (u.anim !== 'walk') { u.anim = 'walk'; u.animT = B.t; } u.x = nx[0]; u.y = nx[1]; }; // (one step of a figure's, no wait)
  In.walkWay = function (u, to) { var Rw = D.roam, p = null; if (Rw && Rw.walkRoute && Rw.def) { try { p = Rw.walkRoute(u, to); } catch (e) { p = null; } } return p || D.Battle.route(u, to, false); };
  In.walk = function* (B, u, to, face, rider) { // (a figure along the floor to a square, a step a time; no way there, it is set there. `rider`: one carried -- it goes where the walker goes, square for square, looking back the way they came: the child on Gennet's hip, 11-12)
    if (!u) return;
    // (THE PARTY'S OWN WAY, 11-13, his 0404Z note on eyes-upstairs-over-house-1113: "NPC walking is the same as old player walking (tendency for diagnols, gennet does north
    // then west L instead of following path to the door)" -- a scene's figure walks by the route the party's token walks by since 10-29, js/roam.js R.walkRoute: the fewest
    // squares and, of those, the straightest, no first-diagonal-found zig-zag. That search goes round whoever stands in the way; where it finds nothing -- a figure in a
    // doorway -- the fight's route as before, through them, In.walkWay)
    var p = u.x === to[0] && u.y === to[1] ? [] : In.walkWay(u, to);
    if (!p) { u.x = to[0]; u.y = to[1]; u.tween = null; if (rider) { rider.x = to[0]; rider.y = to[1]; rider.tween = null; } }
    else while (p.length) { var nx = p.shift(), dx = nx[0] - u.x, dy = nx[1] - u.y; In.hop(B, u, nx); if (rider) { In.hop(B, rider, nx); rider.anim = 'idle'; rider.facing = D.spr.facingFor(-dx, -dy); } D.grid.setup(B.map, B.units); yield In.PACE; }
    u.anim = 'idle'; u.animT = B.t; if (face) u.facing = D.spr.facingFor(face[0], face[1]); B.cache = null;
  };
  In.cam = function* (B, at, ticks) { yield* B.camTo({ gx: at[0], gy: at[1], gz: 0 }, D.iso.zoom, ticks || 24); };
  In.card = function* (B, lines, hold) { hold = hold || 360; B.card(D.roam.wrap([].concat(lines)), hold); yield Math.max(20, hold - 60); };
  In.ask = function* (B, title, lines, opts) { D.sfx('popup'); return yield { prompt: { who: B.roam.token, title: title, lines: D.roam.wrap([].concat(lines)), opts: opts.map(function (l, i) { return { label: l, value: i }; }) } }; };
  In.lead = function (B, u) { // (one of the four to the front of the token: the watcher goes out alone, as ORDER's "the leader to lead" -- js/roam.js)
    var R0 = B.roam, t = R0.token; if (!u || u === t) return;
    u.x = t.x; u.y = t.y; u.facing = t.facing; u.tween = null; u.anim = 'idle'; u.animT = B.t;
    // (the figure on the floor is the token's (11-11, his note on eyes-gulchchase-1104: "Barley was visible downstairs when it said aurdin was at the window", "aurdin still wasn't
    // in the party"): the one come to the front stands on the floor in the old one's place, and the old one goes inside the token with the rest (js/roam.js R.into) -- the token
    // had changed and the figure had not, so the lead stood in the room through the watcher's scene, and the fight's spill (R.spill: the rest out of the token) never put the
    // watcher, the token, on the field)
    var j = B.units.indexOf(t), k = B.units.indexOf(u);
    if (k < 0) { if (j >= 0) B.units.splice(j, 1, u); else B.units.push(u); } else if (j >= 0) B.units.splice(j, 1);
    R0.token = u; R0.members = [u].concat(R0.members.filter(function (m) { return m !== u; })); R0.rest = R0.members.slice(1);
    D.grid.setup(B.map, B.units); B.cache = null; B.focus(u);
  };
  In.teamBlock = function (B) { (B.riders || []).forEach(function (r) { if (!r.team) return; for (var j = 0; j < r.foot[1]; j++) for (var i = 0; i < r.foot[0]; i++) { var s = B.map.at(r.x + i, r.y + j); if (s) { if (!s.teamHeld) s.teamHeld = { walk: s.walk }; s.walk = false; } } }); }; // (the greys hold their squares, as a fight's riders do -- and give them back when they go: js/battle.js Battle.teamAway, 11-05)
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
    // (one long rest in 24 hours, 11-05: the wagon night is its room's one night -- the second and third watches' long rest is that night's, read off the stay, and the morning's sleep
    // (In.sleep) is where its end is kept (js/house.js H.longRest); a room taken as A NIGHT'S SLEEP, no long rest inside the 24 hours, gives every watch the first's short rest)
    var noLong = !!(R0.stay && R0.stay.long === false);
    var byWatch = function (party) { var sh = party.filter(function (h) { return !h.dead && (noLong || asg[h.key || h.id] === 1); }); return { long: party.filter(function (h) { return sh.indexOf(h) < 0; }), short: sh }; };
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
  // LYMEN'S FEELING ON HIS OWN FACE (11-11, his note on eyes-gulchchase-1104: "no portrait is used for lymen's line (outside interface) despite being in the inn"): inside the
  // house, the line on the open screen over the common room as supper is told (In.mealScene, js/counter.js THE SIDES) -- the one saying it top left on their talking portrait,
  // the keepers' bust where they have it (C.heroFull), their figure's face where they have none; out of the house, the floor's card as before
  In.feelingSay = function* (B, u, line) {
    var C = D.counter, def = D.roam.def;
    var upF = !!def && def.key === In.UP;
    if (!u || !C || !C.Counter || !def || !(upF || (def.key === In.KEY && def.inside === 'inn'))) { yield* In.card(B, [u && u.name === 'Lymen' ? In.who('Lymen', line) : line], 420); return; }
    var pt = C.heroPortrait(In.heroOf(u)), who = { name: u.name, unit: u, side: 'left', sheet: C.heroFull(pt) || pt || null };
    if (D.house && D.house.trail) D.house.trail('talk', 'wagonNight');
    var sc = new C.Counter(B, { id: 'wagonNight', name: u.name, place: 'The Halfway Inn', what: upF ? 'the road-end room, after supper' : 'the common room, after supper', room: true, open: true, bg: In.roomShot(B),
      script: function (s) { return (function* () { yield s.by(who, [line]); })(); } });
    D.push(sc); while (!sc.done) yield 1;
  };
  // the lead back in front once the house is up (the watcher went first: the wagon night's opening)
  In.leadBack = function (B) { var R0 = B.roam, l0 = R0.lead0; R0.lead0 = null; if (l0 && R0.token !== l0 && R0.members.indexOf(l0) >= 0) In.lead(B, l0); };
  // the yard's cast: the pair down off the bench by the wagon, Willem at the greys' heads; the two in the bed and the team as riders (drawn where they stand, js/ui.js); the traveler come down
  In.BEDZ = 12; In.BEDIN = 0; // (the bed's floor, px over the ground, and how far in from its rims the two stand, a part of a square: the code's wagon's; js/innprops.js sets the drawn wagon's, 11-10)
  In.bedRiders = function (B, Y, f, noTeam) { // (the two in the open bed, and the team in its traces unless it is gone)
    var w = In.WAGONAT, seen = !!(f.glamourSeen || f.glamourBroken);
    Y.riders = [{ x: w[0] + 3, y: w[1], sheet: seen ? 'kid1_p0' : 'goblin_p2', after: 'kid1_p0', facing: 3, gz: In.BEDZ, dy: In.BEDIN, foot: [1, 1], anim: 'idle', animT: 0 },
      { x: w[0] + 3, y: w[1] + 1, sheet: seen ? 'kid2_p0' : 'goblin_p2', after: 'kid2_p0', facing: 3, gz: In.BEDZ, dy: -In.BEDIN, foot: [1, 1], anim: 'idle', animT: 0 }].concat(noTeam ? [] : [
      { x: w[0] - 2, y: w[1], sheet: 'horsegrey_p1', facing: 3, gz: 0, foot: [2, 1], team: true, blocks: true, anim: 'idle', animT: 0 },
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
    if (Y && Y.kid && B.units.indexOf(Y.kid) >= 0) { var kd = D.FOES[In.keptKind()]; if (kd) { Y.kid.sheet = kd.sheet; Y.kid.kind = In.keptKind(); Y.kid.name = 'A child, chained'; if (D.fx) D.fx.sparkle(Y.kid, 'gold', 14); } }
    yield 40;
  };
  // the due's walk, the night's cutscene on the map's camera (the first game's EV.dueWalk): the inn lady out of the lake door with her lantern and the one she took, down the path to the point, the lake flat; only she comes back
  In.dueWalk = function* (B, look) {
    var f = B.roam.flags, lake = In.DOORS.lake, stone = [43, 18];
    var lady = In.unit(B, { id: 'dueLady', kind: 'commonerwoman', at: [lake[0] + 1, lake[1]], name: In.named(f), face: [1, 0], lantern: true });
    var kid = In.unit(B, { id: 'dueKid', kind: look === 'goblin' ? 'glamourgoblin' : In.keptKind(), at: [lake[0] + 1, lake[1] + 1], name: look === 'goblin' ? 'A goblin' : 'A child', face: [1, 0] });
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
  // THE WATCH IS KEPT UPSTAIRS (11-12, Griz on the wagon night played, 0043Z: "watch from upstairs room not big room where kat and gennet are still posted"; and his
  // 10:01Z note: "barley was still hanging out downstairs when lymen called for watch, might as well move the party token upstairs and show it - can we use upstairs
  // on the room overlooking the road with transparency to actually have aurdin or whomever ... at the window?"): the night goes up the stair as it begins -- the
  // road-end room over the common room (In.WATCH), whichever room is theirs to sleep in -- and Lymen's feeling, the watches and the lie-down are there; the one on
  // the second watch walks to the window on the road, and the wagon is heard. Then the yard, on the house's own floor, with NOBODY of the party standing in the
  // common room: the token is off the floor (In.offFloor) until somebody goes down -- INVESTIGATE or WAKE THE PARTY puts it at the stair's foot and it walks out by
  // the front door. The night is one script over three floors' scripts (In.watching carries it: 'up', then 'yard'); a bench's page keeps it on one floor, as its
  // nights are slept where the party stands (In.sleepsHere)
  In.WATCH = { at: [2, 2], face: [-1, 0], window: [1, 2], down: [In.STAIR[0], In.STAIR[1] - 1],
    heard: '{y}{name}{/} has the window of the road-end room on the second watch. The yard below is dark. Then harness, and iron tyres on the road.' };
  // THE OTHERS ASLEEP IN THE ROOM while one has the window (11-12, the inn seat: the lane's known gap -- "the other three are not shown asleep in the road-end room during
  // the watch"): each a figure of its own on a free square of the room near the bed, lying asleep, in the hero's own sheet; figures only (`look`), gone with the floor
  In.abed = function (B, heroes) {
    var G = D.grid, t = B.roam.token, at = In.WATCH.at, win = In.WATCH.window, out = [], spots = [];
    for (var dy = -2; dy <= 4; dy++) for (var dx = -2; dx <= 4; dx++) spots.push([at[0] + dx, at[1] + dy]);
    spots.sort(function (a, b) { return (Math.abs(a[0] - at[0]) + Math.abs(a[1] - at[1])) - (Math.abs(b[0] - at[0]) + Math.abs(b[1] - at[1])); });
    B.units.filter(function (u) { return u.abed; }).forEach(function (u) { In.gone(B, u); });
    (heroes || []).forEach(function (h, i) {
      var u = In.unit(B, { id: 'abed' + i, kind: 'commoner', at: [t.x, t.y], name: h.name, face: [0, 1] });
      var q = spots.filter(function (q0) { return !(q0[0] === t.x && q0[1] === t.y) && !(q0[0] === win[0] && q0[1] === win[1]) && !(q0[0] === at[0] && q0[1] === at[1]) && G.canStand(u, q0[0], q0[1]) && !B.units.some(function (w) { return w !== u && w.x === q0[0] && w.y === q0[1]; }); })[0];
      if (!q) { In.gone(B, u); return; }
      u.x = q[0]; u.y = q[1]; u.abed = true; u.bystander = true; if (h.sheet) u.sheet = h.sheet; u.conds.asleep = { by: 'night' }; u.conds.prone = true; out.push(u);
    });
    G.setup(B.map, B.units); B.cache = null; return out;
  };
  // THE GUEST FLOOR OVER THE HOUSE (11-13; Griz's own mock-up for the watch from upstairs, a screenshot cut and pasted: the yard whole, and the upstairs room with the party
  // in it standing over the house -- "what I was aiming for with 'can we not overlay the second floor on top of the first floor'"; and on its height, "by short walls it looks
  // like the exterior walls would be higher if the second floor was actually atop the first"). While a scene is watched from upstairs the house's floor is laid as from
  // outside, and OVER THE HOUSE, a storey up (In.upZ: half the house's two storeys), the guest floor's own boards are drawn -- its floor as it was baked while the party
  // stood on it (In.upShot, taken as they leave it), square for square over the house (the guest floor's 0,0 is the house's In.UPAT) -- with the party ON it as figures: the
  // one at the window the token itself, the others lying where they slept, each drawn a storey up and after the roof (u.upZ: js/ui.js unitPos). A drawing: no rule reads
  // it. NOT DRAWN YET: the guest floor's beds, its wall stubs and its chimney (the floor's props are laid by another map's dressing; the boards and the figures only)
  In.UPAT = [19, 13]; In.UPPAD = 96;
  In.upZ =function () { var m = D.iso.map, px = m && D.iso.roofPx ? D.iso.roofPx(m, 'I') : 0; return px ? Math.round(px / 2) : 44; };
  In.upShot = function () {
    var m = D.iso.map, bk = m && m.bake; In.upPic = null;
    if (!m || !m.def || m.def.key !== In.UP || !bk || bk.paged || !bk.canvas || !bk.canvas.getContext) return null;
    // ITS BEDS, WALL STUBS AND CHIMNEY TOO (11-13, the inn seat of 11-13; the last seat's question to him, "does it want its beds, wall stubs and chimney drawn to read as
    // rooms", built on the desk's brief): the picture is the guest floor as the game draws it with nobody on it -- its baked boards and every prop of the map (the knee-high
    // stubs, the beds, the tables, the stack; js/iso.js iso.draw with no figures) -- drawn once into a canvas of its own, the camera set so the boards land where the bare
    // copy had them and In.UPPAD of room left above for what stands up off the floor. A still: the stack's fire does not move in it
    var iso = D.iso, pad = In.UPPAD, W0 = D.W, H0 = D.H, z0 = iso.zoom, w0 = iso.inWorld, cx0 = iso.cam.x, cy0 = iso.cam.y, whole = false;
    try {
      var cv = document.createElement('canvas'); cv.width = bk.canvas.width; cv.height = bk.canvas.height + pad; var cx = cv.getContext('2d');
      try { D.W = cv.width; D.H = cv.height; iso.zoom = 1; iso.inWorld = false; iso.cam.x = bk.x + cv.width / 2; iso.cam.y = bk.y - pad + cv.height / 2; iso.draw(cx, [], null); whole = true; }
      catch (e2) { cx.clearRect(0, 0, cv.width, cv.height); cx.drawImage(bk.canvas, 0, pad); } // (the boards alone, as it was)
      finally { D.W = W0; D.H = H0; iso.zoom = z0; iso.inWorld = w0; iso.cam.x = cx0; iso.cam.y = cy0; }
      In.upPic = { canvas: cv, x: bk.x, y: bk.y - pad, whole: whole, props: (m.props || []).filter(function (p) { return p.innProp || p.kind === 'rock'; }).length };
    } catch (e) { In.upPic = null; }
    return In.upPic;
  };
  In.upView = function (B, o) { // (o.at: the token's square on the guest floor; o.abed: [{ name, sheet, x, y }] the sleepers there)
    var R0 = B.roam, t = R0.token, Z = In.upZ(), A0 = In.UPAT, G = D.grid; o = o || {};
    In.upViewOff(B);
    if (B.units.indexOf(t) < 0) In.offFloor(B, false);
    var at = o.at || In.WATCH.window; t.x = A0[0] + at[0]; t.y = A0[1] + at[1]; t.tween = null; t.upZ = Z; t.anim = 'idle'; if (o.face) t.facing = D.spr.facingFor(o.face[0], o.face[1]); R0.path = null;
    (o.abed || []).forEach(function (a, i) { var u = In.unit(B, { id: 'abedUp' + i, kind: 'commoner', at: [A0[0] + a.x, A0[1] + a.y], name: a.name, face: [0, 1] }); u.abed = true; u.bystander = true; u.upZ = Z; if (a.sheet) u.sheet = a.sheet; u.conds.asleep = { by: 'night' }; u.conds.prone = true; });
    R0.upView = { z: Z, pic: In.upPic || null, n: (o.abed || []).length }; G.setup(B.map, B.units); B.cache = null; return R0.upView;
  };
  In.upViewOff = function (B) { var R0 = B.roam; if (!R0) return; if (R0.token) delete R0.token.upZ; B.units.filter(function (u) { return u.abed && u.upZ; }).forEach(function (u) { In.gone(B, u); }); R0.upView = null; B.cache = null; };
  (function () {
    var props0 = D.walls && D.walls.props; if (!props0) return;
    D.walls.props = function (B) {
      var out = props0.apply(this, arguments), V = B && B.roam && B.roam.upView, def = B && B.map && B.map.def;
      if (!V || !V.pic || !def || def.key !== In.KEY) return out;
      out.push({ depth: 5990, gz: V.z, layer: 0, upFloor: true, draw: function (ctx) {
        var iso = D.iso, ch = iso.center(In.UPAT[0], In.UPAT[1], V.z), sh = iso.toScreen(ch.x, ch.y), cu = iso.center(0, 0, 0);
        ctx.drawImage(V.pic.canvas, Math.round(sh.x - (cu.x - V.pic.x)), Math.round(sh.y - (cu.y - V.pic.y))); V.drawn = (V.drawn || 0) + 1;
      } });
      return out;
    };
  })();
  // DOWN FROM UPSTAIRS (11-13; his note on eyes-watch-yard-roofed-1112m: "the problem with what the card loads, can't move anyone" -- a figure on a lit square at the edge of
  // the roof, "a way out: LEAVE THE FIGHT from here"): a scene watched from upstairs is laid with the house under its roof (11-12), and the party coming down was stood at
  // the stair's foot on THAT lay -- inside a roofed house, where the grid gives no way to walk. Coming down, the house is laid as its inside again, the token at the stair's foot
  // THE INSIGHTS ON PORTRAITS (11-13, the inn seat of 11-13, third; Griz, 11-11 10:01Z: "insights as portraits talking to themselves that give +1 to vs illusion check"; its
  // shape the lanes desk's call on his "give it your desk call on the two with no lean", standing for his overrule): where an (insight) line showed at the inn as a card on
  // the floor it is said by ONE hero, to themself, on that hero's own talking portrait -- the one with the best Insight of those the read is made for, ties to the lead
  // (In.insightHero). The line is the line as written. A hero with no talking portrait in hand (js/counter.js C.HERO_PT) shows it as the card it was. THE +1: the first
  // insight of a night gives its hero +1, once, on that hero's own roll against the glamour (In.perceives: the watcher's look, the yard's) or on that hero's passive at the
  // barn's LOOK CLOSER and TOUCH IT (In.edgeRead, spent only where the plain read fails); kept in the save's flags (f.insightEdge) through the next day; and a card says
  // where the +1 came from when it is used (In.edgeCard). The supper's and the barn yard's reads were on their hero's own bubble already: they arm the +1 too
  In.readOf = function (u, skill, dc) { var p = u && u.src ? In.passive(u.src, skill) : 0, ok = p >= dc; In.trail((u ? u.name : 'nobody') + ' passive ' + skill + ' ' + p + ' vs DC ' + dc + (ok ? ', read' : ', not read') + ' (alone)'); return ok; }; // (one hero's own passive: the watcher at the window)
  In.insightHero = function (B, among) {
    var R0 = B.roam, lead = R0.lead0 || R0.token, us = among && among.length ? among : R0.members.filter(function (u) { return u.src && !u.src.guest && u.hp > 0 && !u.dead; }), best = null, bv = -99;
    us.forEach(function (u) { if (!u || !u.src) return; var v = DS.R.skill(u.src, 'Insight', 'wis'); if (v > bv || (v === bv && u === lead)) { best = u; bv = v; } });
    return best;
  };
  In.edgeSet = function (f, key, name) {
    var d = In.day(D.roam.q); if (!f || !key) return null; if (f.insightEdge && f.insightEdge.day === d) { In.edge = f.insightEdge; return f.insightEdge; } // (once a night: the first insight's hero has it)
    f.insightEdge = { key: key, name: name, day: d }; In.edge = f.insightEdge; In.trail('the insight is ' + name + '\'s: +1, once, on ' + name + '\'s own look against the glamour'); return In.edge;
  };
  In.insightSay = function* (B, line, among) {
    var C = D.counter, u = In.insightHero(B, among), def = D.roam.def; if (u) In.edgeSet(B.roam.flags, u.src.key || u.src.id, u.name);
    var pt = u && C && C.heroPortrait ? C.heroPortrait(In.heroOf(u)) : null;
    if (!u || !pt || !C.Counter) { In.trail('the insight as a card' + (u ? ': ' + u.name + ' has no talking portrait in hand' : '')); yield* In.card(B, [line], 300); return null; }
    var who = { name: u.name, unit: u, side: 'left', sheet: C.heroFull(pt) || pt };
    In.trail('the insight on ' + u.name + '\'s own portrait (' + who.sheet + ')');
    var sc = new C.Counter(B, { id: 'insight', name: u.name, place: 'The Halfway Inn', what: (def && def.sub) || 'the yard', room: true, open: true, bg: In.roomShot(B), script: function (s) { return (function* () { yield s.by(who, [line]); })(); } });
    D.push(sc); while (!sc.done) yield 1;
    return u;
  };
  In.edgeRead = function (st, skill, dc) { // (the +1 on that hero's passive, where the party's plain read has failed)
    var e = In.edge; if (!e || e.used) return false; var h = st.party.filter(function (x) { return (x.key || x.id) === e.key && !x.dead && !x.ko; })[0]; if (!h) return false;
    var p = In.passive(h, skill) + 1; if (p < dc) return false; e.used = 1; In.edgeUsed = { name: h.name }; In.trail(h.name + ' passive ' + skill + ' ' + (p - 1) + ' + 1 (the insight) vs DC ' + dc + ', read'); return true;
  };
  In.edgeLine = function () { var e = In.edgeUsed; In.edgeUsed = null; return e ? '{c}(insight){/} +1 to ' + e.name + '\'s look: ' + e.name + ' knew to look twice.' : null; }; // (the seat's draft, his to re-word)
  In.edgeCard = function* (B) { var l = In.edgeLine(); if (l) yield* In.card(B, [l], 240); };
  In.comeDown = function (B) { In.upViewOff(B); In.offFloor(B, false); In.stage(B, In.WATCH.down, 'inn'); };
  In.offFloor = function (B, off) { var t = B.roam.token, i = B.units.indexOf(t); if (off && i >= 0) B.units.splice(i, 1); if (!off && i < 0) B.units.push(t); B.roam.tokenOff = !!off; D.grid.setup(B.map, B.units); B.cache = null; };
  In.wagonNight = function* (B, d, W2) {
    var R = D.roam, R0 = B.roam, f = R0.flags, st = D.counter.state(B), H = D.house, W = D.world, upstairs = !!W2, onUp = R.def && R.def.key === In.UP;
    if (!W2 && !onUp && R.def && R.def.key === In.KEY && !In.sleepsHere()) { In.watching = { stage: 'up', d: d, stay: R0.stay }; In.trail('the wagon night: up to the road-end room for the watch'); yield* M.go(B, In.UP, In.WATCH.at, In.WATCH.face); return 'up'; }
    if (!W2) { f.wagonCycle = In.cycle(d); delete f.glamourSeen; delete f.duePaid; } // (duePaid is tonight's: the ring cold by morning, the ring warm after the take -- 11-05)
    var party = R0.members.filter(function (u) { return u.src && !u.src.guest && u.hp > 0 && !u.dead; }), lead = party[0] || R0.token;
    var keyOf = function (u) { return u.src ? (u.src.key || u.src.id) : u.id; };
    var watcher = null;
    if (W2) { // (the yard's half, come down from the window: who had it, who leads, the night's room)
      watcher = party.filter(function (u) { return keyOf(u) === W2.watcher; })[0] || party[0]; if (W2.stay) R0.stay = W2.stay;
      var l0 = party.filter(function (u) { return keyOf(u) === W2.lead0; })[0] || R0.token; if (watcher !== R0.token) In.lead(B, watcher); R0.lead0 = l0;
    } else {
    // 1. Lymen's feeling, and the watches (his word, 11-04): the camp's picker; the one on the second watch has the window
    var ly = party.filter(function (u) { return keyOf(u) === 'lymen'; })[0];
    yield* In.feelingSay(B, ly || lead, ly ? In.WN.feeling : In.WN.feelingLead.split('{name}').join(lead.name));
    var sheets = party.map(function (u) { return { key: keyOf(u), name: u.name, hp: u.hp, maxhp: u.maxhp }; });
    var asg = (yield* In.watches(B, sheets)) || H.watchDefault(sheets);
    watcher = party.filter(function (u) { return asg[keyOf(u)] === 2; })[0] || party[0];
    In.trail('the watches: ' + Object.keys(asg).map(function (k) { return k + ' ' + asg[k]; }).join(', ') + '; ' + watcher.name + ' at the window');
    // 2. the lie-down to the second watch: the clock to the watch's middle (the night's own hours, In.REST: eleven after supper), the dark -- and the rest BY THE WATCH (11-05,
    // Griz: "The people on second and third watch get their longrest (but not daily bonding and spell selection for this event) and those on first watch get a short rest before
    // the scene starts with only the second watch character active"): the second and third watches the long rest's mechanics, the first a short rest, no morning page; then
    // the one at the window alone in front, the rest asleep inside the token (the lead put back after: In.leadBack)
    var nightH = (R0.stay && R0.stay.hours) || W.REST || 8, lead0 = R0.token;
    yield* In.lieDown(B, nightH / (H.WATCHES || 3) * 1.5, 'THE SECOND WATCH', [L('wagon.night'), In.restedLine(party, asg, keyOf)], asg);
    In.lead(B, watcher); R0.lead0 = lead0;
    if (onUp) { // (at the window on the road; then down to the yard's floor for what the window shows)
      In.abed(B, party.filter(function (u) { return u !== watcher; })); // (the others asleep in the room behind the one at the window, 11-12: a gap the last seats named)
      yield* R.walkTo(B, In.WATCH.window); R0.token.facing = D.spr.facingFor(-1, 0); R0.token.anim = 'idle';
      yield* In.card(B, [In.WATCH.heard.split('{name}').join(watcher.name)], 360);
      In.upShot(); // (the guest floor's picture, for the yard: In.upView)
      In.watching = { stage: 'yard', d: d, stay: R0.stay, watcher: keyOf(watcher), lead0: keyOf(lead0), win: [R0.token.x, R0.token.y], abed: B.units.filter(function (u) { return u.abed; }).map(function (u) { return { name: u.name, sheet: u.sheet, x: u.x, y: u.y }; }) };
      In.blackHold = 120; // (black until the yard's scene has the party stood upstairs and the camera on it: the draw wrap above; two seconds at most if nothing lets it go)
      yield* M.go(B, In.KEY, In.WATCH.down, [0, -1]); return 'up';
    }
    }
    // 3. the yard: the wagon in, the party at the window, the figures; the inn lady out to meet it with her lantern; the greetings
    var paid = !!(D.wagon && f.wagonBribed === 'c' + In.cycle(d)); // (Amara's gold taken on the road that day: the night kept to the room, as paid -- js/wagon.js)
    f.wagonIn = 1; if (In.katHere(f, d)) f.katYard = 1;
    // (11-12, his note on eyes-wagon-upstairs-1112f: "can we not overlay the second floor on top of the first floor, there's a view of the first floor with a second Gennet in her
    // usual position" -- the house's floor had been laid as its open inside for this, the fireside Gennet in it while the scene's own walked out to the wagon. Watched from
    // upstairs the house is laid as from OUTSIDE, under its roof: the yard is what the window shows; and whichever way it is laid, the floor's own Gennet goes while the scene's is out)
    if (upstairs) { In.stage(B, In.WATCH.down, null); if (In.upPic) In.upView(B, { at: W2.win || In.WATCH.window, face: [-1, 0], abed: W2.abed || [] }); else In.offFloor(B, true); } // (the party is upstairs: drawn there, over the house -- In.upView; with no picture of the floor, nobody of it on this floor)
    else In.stage(B, [In.DOORS.front[0] + 1, In.DOORS.front[1]], 'inn');
    if (upstairs && R0.upView) B.focus(R0.token); In.blackHold = 0; // (the camera on the one at the window before the first frame he sees, then the pan to the wagon)
    var Y = In.yardCast(B, f), w = In.WAGONAT; B.units.filter(function (u) { return u.npc === 'gennet'; }).forEach(function (u) { In.gone(B, u); }); // (one Gennet: the scene's)
    yield* In.cam(B, [w[0] + 2, w[1]], 30);
    yield* In.card(B, [In.WN.turnsIn.split('{name}').join(watcher.name)], 420);
    Y.gennet = In.unit(B, { id: 'gennetYard', kind: 'commonerwoman', at: [In.DOORS.front[0] - 1, In.DOORS.front[1]], name: In.named(f), face: [-1, 0], lantern: true });
    yield* In.walk(B, Y.gennet, [w[0] + 5, w[1]], [-1, 0]);
    yield* In.card(B, [In.who('The inn lady', L('wagon.greet1'))], 300);
    yield* In.card(B, [In.who('Amara', L('wagon.greet2'))], 300);
    yield* In.card(B, [In.who('The inn lady', L('wagon.greet3'))], 300);
    // (THE WATCHER'S ALONE, RULED 11-13, Griz, asked whether the wagon night's greeting reads should be the watcher's alone: "10 - yes"; and on whose insight speaks on the
    // watch, those awake: "2, 3 - keep" -- the others are asleep in the room: the two reads at the greeting are the watcher's own passive Insight, and the watcher says them)
    if (Y.kat && In.readOf(watcher, 'Insight', In.KL.DC.knew)) { f.katKnewAmara = 1; yield* In.insightSay(B, In.KL.knew, [watcher]); } // (11-05, the module §5: the traveler and Amara have met before, Insight 13 -- it opens her message, asked after the wagon: In.katScene)
    // BEAT 0 (the lane's §10.3, RULED): the handover at the greeting -- one lifted down and led inside by the hand; its read from the window
    Y.kid = In.unit(B, { id: 'wagonKid', kind: 'glamourgoblin', at: [w[0] + 4, w[1] + 1], name: 'A goblin, chained', face: [1, 0] });
    yield* In.walk(B, Y.kid, [w[0] + 4, w[1]], [1, 0]); yield 10;
    yield* In.card(B, [L('wagon.handover')], 360);
    f.kidTaken = 1; // (the due three nights on since 11-05 -- In.DUE; what she keeps for it, by how the night goes: In.setOffering below)
    if (In.readOf(watcher, 'Insight', 13)) { f.glamourSuspect = 1; yield* In.insightSay(B, In.WN.suspect, [watcher]); }
    yield* In.walk(B, Y.gennet, [In.DOORS.front[0] - 1, In.DOORS.front[1]]); yield* In.walk(B, Y.kid, [In.DOORS.front[0] - 1, In.DOORS.front[1] + 1]);
    In.gone(B, Y.gennet); Y.gennet = null; In.gone(B, Y.kid); Y.kid = null; yield 10;
    // the watcher's look from the window (the first game's Perception 15; the handover's read sharpens it)
    var sawW = !paid && In.perceives(watcher.src, 15, f.glamourSuspect ? 5 : 0); yield* In.edgeCard(B); if (sawW) yield* In.breakGlamour(B, st, f, Y);
    // 4. the choice, as the first game asked it: INVESTIGATE, WAKE THE PARTY, KEEP WATCH (a night already paid for on the road keeps to the room)
    var a = paid ? 2 : yield* In.ask(B, 'THE SECOND WATCH', [L('wagon.ask', { name: watcher.name })], ['INVESTIGATE', 'WAKE THE PARTY', 'KEEP WATCH']);
    var C = { B: B, d: d, Y: Y, w: w, st: st, party: party, watcher: watcher, keyOf: keyOf, paid: paid, upstairs: upstairs, a: a };
    // INVESTIGATE: THE NIGHT WAITS (RULED 11-13, Griz, on the inn seat's lean -- "the watcher is stood in the common room with the wagon still turning in, and the night WAITS:
    // nothing more happens until the party steps out the front door (the greeting plays in front of them, with the choices the yard has) or goes back up the stair (KEEP WATCH,
    // the night runs on as watched)": "run with the leans, I'll complain on playthrough if they land wrong or something :)"; his 0404Z note was "investigate let me roam around
    // downstairs but apparently willem put the horses away and they stayed the night without me interacting as aurdin downstairs"). The scene stops here with the watcher at the
    // stair's foot and the floor handed back; what the rest needs is kept (In.invest, and f.invest for a save); In.wagonRest plays it from a step out of the house, or the quiet
    // night from the stair or from a bed taken (the D.roam.arrive wrap, T.fire's inn:stair, In.sleep)
    if (a === 0) {
      if (upstairs) In.comeDown(B); // (down the stair: the token at its foot)
      if (watcher !== R0.token) In.lead(B, watcher); // (the watcher's figure alone: the token is the watcher's from here)
      yield* In.card(B, [In.WN.investWait.split('{name}').join(watcher.name)], 360);
      In.invest = C; f.invest = { d: d, watcher: keyOf(watcher), lead0: R0.lead0 ? keyOf(R0.lead0) : null, paid: paid, stay: R0.stay || null };
      In.trail('INVESTIGATE: ' + watcher.name + ' is down in the common room; the night waits on a step out of the house or back up the stair');
      return 'wait';
    }
    return yield* In.wagonRest(B, C);
  };
  // the night's rest (C: what In.wagonNight had in hand at the choice; back: the watcher went back up the stair, or to a bed -- the night as watched, quiet)
  In.wagonRest = function* (B, C, back) {
    var R = D.roam, R0 = B.roam, f = R0.flags, st = C.st, d = C.d, Y = C.Y, w = C.w, party = C.party, watcher = C.watcher, keyOf = C.keyOf, paid = C.paid, upstairs = C.upstairs, a = C.a;
    var how = 'quiet', outside = [], morning = null;
    if (a !== 2 && !back) {
      outside = a === 0 ? [watcher] : party.slice();
      if (a !== 0) { if (upstairs) In.comeDown(B); yield* In.card(B, [L('wagon.wake', { name: watcher.name })], 300); } // (WAKE THE PARTY: down the stair together and out; INVESTIGATE came down before its wait)
      else yield* In.card(B, [In.WN.investOut.split('{name}').join(watcher.name)], 240);
      yield* R.walkTo(B, [w[0] + 6, w[1]]); // (out the front door into the yard: a step out roofs the house as ever)
      var sawY = !f.glamourSeen && outside.some(function (u) { return In.perceives(u.src, 12, f.glamourSuspect ? 5 : 0); }); yield* In.edgeCard(B); if (sawY) yield* In.breakGlamour(B, st, f, Y);
      if (!f.glamourSeen) {
        yield* In.card(B, [In.who('Amara', In.WN.lieYard)], 360);
        if (outside.some(function (u) { var r = In.d20(), v = DS.R.skill(u.src, 'Insight', 'wis'), ok = r + v >= 13; In.trail(u.name + ' Insight ' + r + ' + ' + v + ' vs DC 13 at the lie' + (ok ? ', heard' : ', not')); return ok; })) {
          yield* In.insightSay(B, L('wagon.insight'), outside); // (said by the one of those OUTSIDE with the best Insight)
          var sawL = outside.some(function (u) { return In.perceives(u.src, 12, 5); }); yield* In.edgeCard(B); if (sawL) yield* In.breakGlamour(B, st, f, Y);
        }
      }
      if (!f.glamourSeen) { yield* In.card(B, [L('wagon.nothing')], 360); yield* R.walkTo(B, [In.DOORS.front[0] + 1, In.DOORS.front[1]]); }
      else {
        var ly2 = outside.filter(function (u) { return keyOf(u) === 'lymen'; })[0];
        if (ly2) { yield* In.card(B, [In.who('Lymen', L('wagon.lymen'))], 420); how = 'fight'; }
        else {
          // (THE BRIBE ON PORTRAITS, 11-13, his 0515Z note on eyes-wagon-seethrough-1112: "Bribe dialog should use portraits" -- the hero's word, her offer and the choice on
          // Amara's own screen and face, pt_amara, js/counter.js C.PT.amara; it had been cards and a floor prompt)
          var b = 1, sayer = outside[0].name;
          yield* M.talk(B, 'amara', function (sc) { return (function* () {
            yield sc.say([In.who(sayer, L('wagon.confront'))]);
            b = yield sc.ask('"' + L('wagon.bribe') + '"', ['TAKE THE GOLD', 'REFUSE']);
            if (b !== 0) yield sc.say([In.who(sayer, L('wagon.refuse'))]);
          })(); }, 'Amara');
          In.trail('the bribe on her own screen: ' + (b === 0 ? 'taken' : 'refused'));
          if (b === 0) how = 'bribe'; else how = 'fight';
        }
      }
    }
    if (how === 'quiet') {
      In.leadBack(B); if (upstairs && a === 2 && !R0.upView) In.offFloor(B, true); // (kept to the window: still nobody downstairs)
      var seen = !!f.glamourSeen || paid; f.wagonOutcome = 'quiet'; f.katGone = 1; f.katRode = 1; if (seen) f.glamourBroken = 1;
      if (Y.kat) { yield* In.walk(B, Y.kat, [In.DOORS.front[0] - 1, In.DOORS.front[1]]); In.gone(B, Y.kat); Y.kat = null; }
      In.gone(B, Y.amara); In.gone(B, Y.willem); Y.amara = Y.willem = null;
      yield* In.card(B, [paid && D.wagon ? D.wagon.LINES.paidNight : In.WN.quietNight], 360);
      In.setOffering(f, In.cycle(d), seen ? 'kept' : 'goblin'); if (seen) f.kidAtInn = 1; // (the one she took: in the barn's end stall three nights, a goblin to the eye while the glamour holds)
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
      In.setOffering(f, In.cycle(d), 'kept');
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
        var one = In.lastFight.amaraUp !== In.lastFight.willemUp ? (In.lastFight.amaraUp ? 'Amara' : 'Willem') : null; // (one away, the other down: the lone runner's line)
        yield* In.card(B, [one ? (f.wagonFled === 'horses' ? In.WN.fledOneHorses : In.WN.fledOneFoot).split('{name}').join(one) : f.wagonFled === 'horses' ? In.WN.fledHorses : In.WN.fledFoot, In.WN.fledYard], 420);
      } else f.wagonOutcome = 'inn';
      var act = null;
      In.setOffering(f, In.cycle(d), 'kept'); // (the yard stopped: the one she took at the greeting is the one they kept -- the second act is the due's own night since 11-05, js/secondact.js A.dueNight)
      // (the ask hears them go and asks: "You go after them" is said once AFTER THEM is picked -- js/chase.js Ch.start; 11-06, his note on eyes-wagonwatch-1105: "Text says you do
      // give chase then offers to chase or not")
      if (out === 'fled' && D.chase && D.chase.start) { var go = yield* In.ask(B, 'THE YARD', [D.chase.ln({ amara: In.lastFight.amaraUp, willem: In.lastFight.willemUp }, 'heard', D.chase.LINES.heard)], [D.chase.LINES.opts.after, D.chase.LINES.opts.let]); if (go === 0) act = 'after'; }
      if (act === 'after') { delete f.katYard; In.yardClear(B, Y); yield* D.chase.start(B, { horses: In.lastFight.loose, willem: In.lastFight.willemUp, amara: In.lastFight.amaraUp, willemDead: In.lastFight.willemDead }); return 'up'; } // (THE CATCH ON THE GULCH ROAM, item 3 -- js/chase.js: the night walk to the cut, the chase up it, the walk back to this yard's own after)
      yield* In.yardAfter(B, st, f, In.lastFight.willemDead, In.lastFight.loose);
      morning = L('wagon.morning.inn');
      yield* R.walkTo(B, [In.DOORS.front[0] + 1, In.DOORS.front[1]]);
    }
    // (the lantern walks three nights on since 11-05, his "let's move the offering to 3 nights after wagon night": the due, the ring warm and the ring cold are the due's own night's --
    // js/secondact.js A.dueNight; this night keeps the yard, the watch, the handover and the chase)
    delete f.wagonIn; delete f.katYard; In.yardClear(B, Y);
    var stillUp = upstairs && (R0.tokenOff || !!R0.upView); In.upViewOff(B); In.stage(B, [24, 17], 'inn'); if (stillUp) In.offFloor(B, true); // (to bed: the morning in the common room -- or straight back up, nobody having come down)
    if ((yield* In.sleep(B, morning)) === 'up') return 'up';
    if (f.wagonGift) yield* M.talk(B, 'elsbeth', function (sc) { return In.gift(sc, B); });
  };
  // INVESTIGATE's wait taken up: In.invest while this floor stands; from a save (f.invest) the yard's cast is stood again and the watcher put in front
  In.investOf = function (B) {
    var R0 = B && B.roam, f = R0 && R0.flags, def = D.roam.def, v = f && f.invest; if (!v || !def || def.key !== In.KEY) return null;
    if (In.invest && In.invest.B === B) return In.invest;
    if (In.day(D.roam.q) > v.d + 1) { delete f.invest; In.invest = null; return null; } // (a wait left over from another night: let go)
    var keyOf = function (u) { return u.src ? (u.src.key || u.src.id) : u.id; }, party = R0.members.filter(function (u) { return u.src && !u.src.guest && u.hp > 0 && !u.dead; });
    var watcher = party.filter(function (u) { return keyOf(u) === v.watcher; })[0] || party[0] || R0.token, l0 = party.filter(function (u) { return keyOf(u) === v.lead0; })[0] || R0.token;
    if (v.stay && !R0.stay) R0.stay = v.stay; if (watcher !== R0.token) In.lead(B, watcher); R0.lead0 = l0; f.wagonIn = 1;
    In.invest = { B: B, d: v.d, Y: In.yardCast(B, f), w: In.WAGONAT, st: D.counter.state(B), party: party, watcher: watcher, keyOf: keyOf, paid: !!v.paid, upstairs: false, a: 0 };
    In.trail('INVESTIGATE\'s wait taken up again from the save: ' + watcher.name + ' downstairs, the wagon in the yard');
    return In.invest;
  };
  In.investGo = function* (B, back) { // (the wait over: out of the house -- the rest in front of the watcher; back -- the quiet night)
    var C = In.investOf(B); if (!C) return null; In.invest = null; delete B.roam.flags.invest;
    In.trail('INVESTIGATE: the wait over, ' + (back ? 'back ' + back + ': the night as watched' : 'a step out of the house: the yard'));
    if (back === 'up the stair') yield* In.card(B, [In.WN.investBack.split('{name}').join(C.watcher.name)], 240);
    return (yield* In.wagonRest(B, C, !!back)) || 'done';
  };
  (function () {
    var arriveI0 = D.roam.arrive, scriptI0 = D.roam.script;
    D.roam.arrive = function* (B) {
      var ev = yield* arriveI0.apply(this, arguments), def = D.roam.def, R0 = B.roam, t = R0 && R0.token;
      if (!ev && def && def.key === In.KEY && t && D.battle === B && R0.flags && R0.flags.invest && !In.inHouse(t.x, t.y) && In.investOf(B)) return yield* In.investGo(B, null);
      return ev;
    };
    D.roam.script = function* (B) { // (a game loaded in the wait: the yard's cast stood again before the floor is the party's)
      var def = D.roam.def; if (def && def.key === In.KEY && B.roam && B.roam.flags && B.roam.flags.invest && !(In.invest && In.invest.B === B)) In.investOf(B);
      if (In.beatRun) { var br = In.beatRun; In.beatRun = null; yield 30; yield* br(B); } // (a show beat's own scene, before the floor is the party's: In.play -- the floor's script below is its walking loop and does not return)
      yield* scriptI0.apply(this, arguments);
    };
  })();
  // the yard fight on the floor's own squares (one map for the floor and the fight): the roam's fight with the yard's rules laid on the floor's fight def for its length --
  // Willem at the traces, the pair run when he is hit (runWhenHurt), the fight over once neither stands on the field and one is away on the road (fledEnds, js/battle.js over -- RULED 11-06,
  // his "4 - lean": till then the one left fights on; the road down the west edge the ways off; the chase goes after whoever got away), three turns unbothered
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
    In.lastFight.amaraUp = !!(Y.amara && Y.amara.hp > 0 && (!Y.amara.dead || Y.amara.fled)); // (11-06: a dead Amara rides in no chase -- js/chase.js Ch.place)
    Object.keys(keep).forEach(function (k) { if (keep[k] === undefined) delete F[k]; else F[k] = keep[k]; });
    In.lastFight.willemUp = !!(Y.willem && Y.willem.hp > 0 && (!Y.willem.dead || Y.willem.fled)); // (still up -- away, or standing: he runs with her, and his false pair waits at the fork -- js/chase.js; one away off the floor is `dead` to the grid and `fled`)
    return o === 'won' ? 'won' : /^(lost|lose|dead|ko)$/.test(String(o)) ? 'lost' : 'fled';
  };
  // the yard's own aftermath, the pair down or gone (and after the chase's walk back, In.chaseBack): Willem's book if he fell, the strongbox under the bench, the order, the seven in the bed real, the renown, Doran's drive
  // THE REWARD LIKE A FIGHT'S VICTORY (11-12 0043Z, Griz on THE YARD'S END: "wagon reward should be like 'victory' at fight end"): what the wagon gives -- his book
  // if he fell, the strongbox's silver, the order, the renown -- is one panel in the middle of the screen, the VICTORY panel's own (js/ui.js UI.victory: a request
  // { victory: { title, lines } }, E closes it), titled THE WAGON; the cards before it only tell what is found, and Doran's drive is said after it
  In.yardAfter = function* (B, st, f, willemDead, loose) {
    var pay = [], book = willemDead && !In.has(st, 'willembook');
    if (book) { D.counter.give(st, 'willembook', 1); pay.push(L('g.got', { item: DS.DATA.items.willembook.name })); } // (his book when the party kills him, not when he yields or runs: the house lane's item 7, 09-30c)
    st.silver(600); D.counter.give(st, 'wagonorder', 1); f.doranAway = 1; f.doranPit = 1; f.kidAtInn = 1; f.wagonGift = 1;
    pay.push(L('g.foundSilver', { n: 600 }), L('g.got', { item: DS.DATA.items.wagonorder.name }));
    yield* In.card(B, [loose ? In.WN.abandonedLoose : In.WN.abandoned], 420);
    if (book) yield* In.card(B, [In.WN.book], 360);
    yield* In.card(B, [L('wagon.strongbox')], 360);
    pay = pay.concat(D.counter.renown(st, 1, 'renown.wagon')); D.sfx('chest');
    if (B.logOnly) B.logOnly(['{y}The wagon{/}'].concat(pay));
    In.trail('the wagon\'s reward: ' + pay.join(' / '));
    yield { victory: { title: 'THE WAGON', lines: pay } };
    yield* In.card(B, [L('wagon.doranTakes')], 420);
    // KATARINA GOES WITH THE WAGON (11-13, his 0515Z note on eyes-wagon-seethrough-1112: "Kat goes with the wagon as when we return from chase"): with the wagon stopped in
    // the yard she had stayed the night and given her book across the table the next day; now she rides south on the bench beside Doran, as she does when the party
    // chases (ruling 28) -- her table cleared, her book and its letter in the big room's drawer (In.bookInDrawer reads f.katRode)
    if (!f.katGave && !f.katGone && !f.katRode && In.day(D.roam.q) >= In.KAT.from) { f.katGone = 1; f.katRode = 1; In.trail('Katarina rides south on the wagon Doran drives (the yard)'); yield* In.card(B, [In.WN.katRides.split('{who}').join(f.katLooked ? 'Katarina' : 'The one with the pen')], 360); }
  };
  // BACK FROM THE CHASE, RE-CUT (RULED 11-12, rulings 51-54; Griz, 11-11: "If the party chases she'd have the girl on standby with doran having taken the wagon and
  // the other kids down to the Pit ... and their like to lose most of the reward they find in the wagon, Kat would probably take that wagon, Gennet be like 'oh
  // heroes, take the big room'", and on the reading page's leans: "1 - yes, 2 - a, 3 yes, 4 - at return, heroes get it once kat is gone and wagon isn't coming"):
  // the yard is EMPTY -- Doran left with the wagon and the seven while they ran (51); the strongbox's 600 silver and the wagon's order went with it, and only
  // Willem's book is theirs, if he fell on the chase (52); Katarina rode on that wagon (ruling 28); Gennet meets them at the front step, says where he has gone, and
  // gives the big room there and then (54: said once Katarina is gone and no wagon is coming back); Elsbeth's gift the next morning is the Cloak of the Manta Ray
  // for this party (53: f.wagonChased, In.giftId). The renown for the eight is kept (the seat's call: it was not in the strongbox)
  In.chaseBack = function* (B) {
    var R0 = B.roam, f = R0.flags, c = f.wagonChase, st = D.counter.state(B); if (!c || !c.back) return;
    delete f.wagonIn; delete f.katYard; In.lay(B, null, true); // (the yard laid without the wagon)
    yield* In.card(B, [In.WN.chaseYard], 360);
    // THE CHILDREN'S XP IN A VICTORY BOX BEFORE GENNET TALKS (11-13, Griz on eyes-chase-southmouth-1112f, 0327Z: "if the children rescue xp happens at return to inn it should
    // go in victory box before gennet talks"): the renown for the eight and its XP, one panel in the middle of the screen (js/ui.js UI.victory, as THE WAGON's), E closes it,
    // and then she comes to the step. His book is the gulch fight's own VICTORY line now (js/chase.js Ch.bookPay); one killed in the yard before the chase is given here, in this panel
    var pay = [];
    if (c.willemDead && !In.has(st, 'willembook')) { D.counter.give(st, 'willembook', 1); yield* In.card(B, [In.WN.book], 360); pay.push(L('g.got', { item: DS.DATA.items.willembook.name })); } // (his book when the party kills him: the house lane's item 7, 09-30c)
    f.doranAway = 1; f.doranPit = 1; f.kidAtInn = 1; f.wagonGift = 1; f.wagonChased = 'c' + (f.wagonCycle || 0); In.trail('back from the chase: the yard empty, the strongbox and the order gone with the wagon');
    pay = (D.counter.renown(st, 1, 'renown.wagon') || []).concat(pay); D.sfx('chest');
    if (pay.length) { if (B.logOnly) B.logOnly(['{y}The eight{/}'].concat(pay)); In.trail('back from the chase, the panel: ' + pay.join(' / ')); yield { victory: { title: 'THE EIGHT', lines: pay } }; }
    var kat = !f.katGave && !f.katGone && !f.katRode && In.day(D.roam.q) >= In.KAT.from;
    if (kat) { f.katGone = 1; f.katRode = 1; In.trail('Katarina rides south on the wagon Doran drives'); }
    // Gennet at the front step, on her own face
    var step = In.STEP.front, g = In.unit(B, { id: 'gennetYard', kind: 'commonerwoman', at: [In.DOORS.front[0], In.DOORS.front[1]], name: In.named(f), face: [-1, 0], lantern: true });
    yield* In.walk(B, g, [step[0], step[1]], [-1, 0]);
    yield* D.roam.walkTo(B, [step[0] - 2, step[1]]);
    yield* M.talk(B, 'gennet', function (sc) { return (function* () {
      yield sc.say([In.WN.chaseGone]);
      if (kat) yield sc.say([In.WN.chaseKat.split('{who}').join(f.katLooked ? 'Katarina' : 'The one with the pen')]);
      if (!f.bigRoom) { f.bigRoom = 1; yield sc.say([In.WN.bigRoom]); } // (HIS line, at the return: ruling 54)
    })(); }, In.named(f));
    yield* In.walk(B, g, [In.DOORS.front[0], In.DOORS.front[1]]); In.gone(B, g);
    var morning = L('wagon.morning.inn'); // (the lantern walks three nights on since 11-05: no ring cold the morning after the chase)
    delete f.wagonChase; In.yardClear(B, {});
    In.stage(B, [24, 17], 'inn');
    if ((yield* In.sleep(B, morning)) === 'up') return;
    if (f.wagonGift) yield* M.talk(B, 'elsbeth', function (sc) { return In.gift(sc, B); });
  };
  // what a fight at the inn left behind: who lay dead (his book), whether the team came loose
  var finish0 = D.Battle && D.Battle.prototype.finish;
  if (finish0) D.Battle.prototype.finish = function* (o) {
    if (this.fight && /^(wagonnight|roadcatch1|roadcatch2|roadday)$/.test(this.fight.id || '')) In.lastFight.willemDead = In.lastFight.willemDead || this.units.some(function (u) { return u.kind === 'willem' && u.side === 'foe' && u.hp <= 0 && !u.fled && !u.gone; });
    yield* finish0.apply(this, arguments);
  };
  // Elsbeth's gift, the morning after the wagon was stopped (the first game's EV.wagonGift): the lead's armour one better, or a ring of protection
  In.giftId = function (st) { var fg = st.flags || {}; if (fg.wagonChased && fg.wagonChased === 'c' + (fg.wagonCycle || 0) && DS.DATA.items.cloakmantaray) return 'cloakmantaray'; /* (RULED 11-12, ruling 53: the party that chased and lost the wagon's reward gets the Cloak of the Manta Ray in place of her usual gift) */ var lead = st.party[0], arm = lead && lead.equip && lead.equip.armor; return arm && DS.DATA.items[arm + '1'] ? arm + '1' : 'ringofprotection'; };
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
  In.elsOpen = function (f) { return In.renown() >= 3 || !!(f.mealWrong && !f.mealGirlSaid); }; // (she will talk: the supper's renown, or the counting seen and kept quiet)
  In.ELS = { renown: 3, work: 'The girl focuses on her work.', notNow: 'She does not turn round. "Not now. In the morning, when she\'s out at the well."', monsters: '"You\'re the people stopping the monsters."' }; // (work and monsters: HIS words, ruling 58; notNow the seat's)
  M.SCENES.elsbeth = function* (sc, B) {
    var st = sc.st, f = st.flags, A = D.secondact;
    if (f.lakeDone) { yield sc.say(L('inn.elsbethAfter')); return; }
    if (f.wandOut) { yield sc.say(A ? A.LINES.elsbethSilentWand : L('inn.elsbethSilent')); return; }
    if (f.elsbethSilent) { yield sc.say(L('inn.elsbethSilent')); return; }
    if (f.childGuest && !f.elsbethGone) { // (the child with the party: she sends them to the Pit; ASK HER TO COME, and she stays with her father -- In.CHILD, 11-12)
      var EC = In.CHILD; f.elsbethPit = 1; yield sc.say(EC.elsbeth);
      var ea = yield sc.ask(EC.elsbethAsk, [EC.come, EC.go]); if (ea === 0) { f.elsbethAsked = 1; yield sc.say(EC.elsbethStay(f)); }
      return;
    }
    if (f.barnLet && !f.glamourBroken && !f.barnHinted && ((f.elsbethTier || 0) >= 1 || In.renown() >= 5)) { f.barnHinted = 1; yield sc.say([In.BY.hint]); return; } // (the party let Gennet keep what it took for a goblin: one more chance before the due -- 11-11, the barn's END A)
    if (f.doranAway && !In.has(st, 'ringofbinding') && (f.dishes || !In.elsOpen(f))) { f.elsbethSent = 1; yield sc.say(L('inn.elsbethWinters')); return; } // (her first telling comes before her word of Winters where she will tell at all: his "same stuff without dishes when he's gone", ruling 58)
    if (f.chuulSeen && (f.elsbethTier || 0) < 3) { f.dishes = 1; f.elsbethTold = 1; f.elsbethTier = 3; yield sc.say([].concat(L('inn.elsbeth2'), In.elsbethQuiet(f, In.day(D.roam.q)))); return; } // (the god seen: her third tier for nothing)
    // HER FRONT END, HIS SHAPE (RULED 11-12, ruling 58, Griz: "at the renown that the supper acknowledges, she'll talk without mentioning dish help with \"you're the people
    // stopping the monsters\" after viv notices at dinner (if she doesn't mention noticing to gennet) they get the dishes stuff when they talk to her when her father
    // is there, same stuff without dishes when he's gone.  daytime private. Without renown she'll \"the girl focuses on her work\" until after first supper." and
    // "daytime private (gennet outside) is good."): her first telling is had (1) at renown 3 or better, the supper's own mark, on her "You're the people stopping the
    // monsters.", no dishes; or (2) after the counting was seen at supper and kept quiet (f.mealWrong, not f.mealGirlSaid) -- with her father in the house under the
    // cover of the dishes, with him away straight out, and the wagon's night with it. Only BY DAY, Gennet out at the well (In.FOLK). With neither, "The girl focuses
    // on her work." The walk-up-and-do-the-dishes opening is gone (ruling 31)
    if (!f.dishes) {
      var EL = In.ELS, known = In.renown() >= EL.renown, noticed = !!(f.mealWrong && !f.mealGirlSaid), hr = In.hourOf(B), byDay = In.atWell(hr); // (her private hour is Gennet's at the well: the mornings till midday, his answer of 11-12)
      if (!known && !noticed) { yield sc.say([EL.work]); return; }
      if (!byDay) { yield sc.say([EL.notNow]); return; }
      if (!known && !f.doranAway && !f.doranDead) { var a = yield sc.ask(L('inn.elsbethDishes'), ['HELP WITH THE DISHES', 'LEAVE HER BE']); if (a !== 0) return; }
      if (known) { yield sc.say([EL.monsters]); if (!f.mealHad) return; } // (11-13, his note on eyes-elsbeth-day-1112f: "until after the first dinner, there should be no follow up to 'stopping the monsters'" -- the line alone till the party has had its first supper here)
    }
    if (!f.dishes) { // (the counting seen at supper and kept quiet: found alone at another hour, she adds the wagon's night -- RULED 11-11, his "the insight is to approach her privately, that's to be at not-dinner times"; In.meal's end)
      var dW = In.day(D.roam.q), nW = In.WAGON.first - dW, word = f.mealWrong && !f.mealGirlSaid && nW >= 0 && f.wagonCycle == null ? [nW === 0 ? In.LINES.elsbethWagon0 : In.LINES.elsbethWagon.split('{n}').join(In.WORDS[nW] || String(nW)).split('{s}').join(nW === 1 ? '' : 's')] : [];
      if (word.length) f.elsbethWagonWord = 1;
      f.dishes = 1; f.elsbethTier = 1; yield sc.say([].concat(L('inn.elsbeth1'), word)); return;
    }
    if (!f.elsbethTold) {
      if (A && A.wand) { var p = yield sc.ask('At the tub.', ['ASK HER MORE', A.LINES.opts.fraud]); if (p === 1) { yield* A.wand(sc, B, st, f); return; } }
      f.elsbethTold = 1; f.elsbethTier = 2; yield sc.say(L('inn.elsbeth2')); return;
    }
    f.elsbethTier = 3;
    if (!In.has(st, 'ringofbinding')) { yield sc.say(In.elsbethQuiet(f, In.day(D.roam.q))); return; }
    // (the ring on the hand: "Tonight" on the due's own night, else how many nights off -- 11-08, his record: "elsbeth saying tonight with a girl skipping stones and
    // nothing for multiple days": she said it from the wagon's night on, three nights before the lantern walks)
    var nx = In.nightsToDue(f, In.day(D.roam.q));
    yield sc.say(nx === 0 ? L('inn.elsbethTonight') : nx === 1 ? L('inn.elsbethTomorrow') : L('inn.elsbethNights', { n: In.WORDS[nx] || String(nx) }));
  };
  // the Snoot's runner: his word, and the Snoot's page on TO THE SNOOT
  In.runnerScene = function* (sc) {
    yield sc.say(In.LINES.runner);
    var a = yield sc.ask(In.LINES.runnerAsk, ['TO THE SNOOT', 'NOT NOW']);
    return a === 0;
  };
  // THE GOBLIN IN THE BARN (RULED 11-05, his "goblin in the barn if they fail to reveal the illusion", "go with those leans": found and revealed there): the one handed over at the
  // greeting with the glamour unbroken, chained in the end stall till the due. LOOK CLOSER (the house's silent Insight 13, the greeting's), TOUCH IT (Perception 12 by touch, the
  // wagon bed's), DETECT MAGIC (Aurdin's ritual, no slot -- the road's); seen through, a child -- FREE HER (the due has no offering: the night is the poison dinner) or LEAVE HER.
  // The seat's drafts, invented.json halfway-due-moved-1105
  In.BL = { goblin: 'In the end stall, chained to the manger by one ankle: a goblin, small, its knees drawn up. It does not look up.', ask: 'A goblin, chained in the inn\'s barn.',
    lookNo: 'A goblin. It keeps its face to the boards.', lookYes: '{c}(insight){/} It is not sitting like a goblin sits. It is sitting like a child told to be quiet.',
    touchNo: 'Under your hand: rough hide, a goblin\'s. It flinches.', touchYes: '{c}(perception){/} Under your hand the hide is not there: a thin arm, a sleeve, a child\'s wrist under the chain.',
    magic: 'Aurdin\'s ritual: the whole of it hums with an illusion, laid close as a skin.', child: 'A child sits chained in the stall, eyes on you.',
    free: 'The chain is a farm chain, a pin through the ring.', freed: 'The pin comes out. She does not run: she takes a hand and holds on. The due has no offering now.' };
  In.barnScene = function* (sc, B) {
    var st = sc.st, f = st.flags, c = In.cycle(In.day(D.roam.q)), BL = In.BL;
    var freeAsk = function* () {
      if ((yield sc.ask(BL.free, ['FREE HER', 'LEAVE HER'])) !== 0) return;
      f.barnFreed = 1; In.setOffering(f, c, 'none'); D.sfx('confirm'); In.trail('the barn: the child freed -- the due has no offering');
      yield sc.say([BL.freed]);
    };
    if (f.glamourBroken) { yield sc.say([BL.child]); yield* freeAsk(); return; }
    yield sc.say([BL.goblin]); // (on its own face, pt_glamourgoblin: C.SHEETOF.barnGoblin below -- 11-13, Griz on eyes-barn-between-1112, 0327Z: "only note is goblin portrait in the box on first interaction")
    var opts = ['LOOK CLOSER', 'TOUCH IT'], acts = ['look', 'touch'];
    if (st.party.some(function (h) { return (h.key || h.id) === 'aurdin' && !h.dead; })) { opts.push('DETECT MAGIC'); acts.push('magic'); }
    opts.push('FREE IT'); acts.push('free'); opts.push('LEAVE IT'); acts.push('leave'); // (FREE IT, 11-11: freed as the goblin it looks -- his "freeing the barn child as a goblin"; then the yard, In.barnYard)
    var act = acts[yield sc.ask(BL.ask, opts)];
    if (act === 'leave') return;
    if (act === 'free') { f.barnFreed = 1; In.setOffering(f, c, 'none'); f.barnC = c; D.sfx('confirm'); In.trail('the barn: freed as a goblin, the glamour unseen'); yield sc.say([In.BY.freedIt]); return; }
    var ok = act === 'magic' || In.read(st, act === 'look' ? 'Insight' : 'Perception', act === 'look' ? 13 : 12) || In.edgeRead(st, act === 'look' ? 'Insight' : 'Perception', act === 'look' ? 13 : 12); // (the insight's +1 on its hero's passive, where the plain read fails)
    if (!ok) { yield sc.say([act === 'look' ? BL.lookNo : BL.touchNo]); return; }
    f.glamourBroken = 1; f.glamourSeen = 1; In.setOffering(f, c, 'kept'); f.barnC = c; In.trail('the barn: the glamour seen through (' + act + ')'); sc.sheet = In.childFace(true) || sc.sheet; /* (the child's own face from here) */ if (sc.o) sc.o.name = 'A child, chained'; /* (and her own name on the screen: it had stayed "A goblin, chained" over her face through FREE HER -- 11-13, the barn walk's `stallname`) */
    var eL = In.edgeLine(); if (eL) yield sc.say([eL]);
    var iu = act === 'look' && B && B.roam ? In.insightHero(B) : null, ipt = iu && D.counter.heroPortrait ? D.counter.heroPortrait(In.heroOf(iu)) : null; if (iu) In.edgeSet(f, iu.src.key || iu.src.id, iu.name);
    if (iu && ipt) { In.trail('the insight on ' + iu.name + '\'s own portrait (the barn)'); yield sc.by({ name: iu.name, unit: iu, side: 'left', sheet: D.counter.heroFull(ipt) || ipt }, [BL.lookYes]); yield sc.say([BL.child]); } // (LOOK CLOSER's insight said by its hero, to themself: In.insightSay's rule on this screen)
    else yield sc.say([act === 'look' ? BL.lookYes : act === 'touch' ? BL.touchYes : BL.magic, BL.child]);
    yield* freeAsk();
  };
  if (D.counter && D.counter.SHEETOF) D.counter.SHEETOF.barnGoblin = function (st) { return In.childFace(!!(st && st.flags && st.flags.glamourBroken)); };
  // ---------------------------------------------------------------- OUT OF THE BARN WITH THE CHILD: Gennet comes running (11-11, the supper seat; the inn lane's rulings 30 and
  // 34 and the reading page he asked for, the-lab's barn-mockup-2026-11-11.html; Griz: "have the supper mockup seat cue a similar one for gennet running up when they exit the barn
  // with the kid with proposed dialog", then "include it's barn stuff to the live ship"). His words for it: "freeing the barn child as a goblin would have to risk violence with
  // Gennet, she'd start with 'that's why i knew to keep it, poor innocent thing, yada yada' but the party could end up having the kid as a guest in the party on the road - she'd
  // also try bribery if they didn't let her raise it. I suppose a Doran confession to prevent violence might be the way to go as well."; "bribe is only if they don't just 'let her
  // raise it'". The pin pulled (In.barnScene: FREE IT while it still looks a goblin, FREE HER once seen through), the party steps into the yard and the talk goes by STAGES -- her
  // opener, her ask, the first offer, the second and the threat, the breaking point -- the four flipped at each (js/counter.js THE FLIP), one silent read and one skill-shaded
  // answer a hero a stage, no die shown, to one of five ENDS: A they let her raise it; B the bribe taken; C blows (only if a hero draws; to the first yield); D Doran's confession
  // (a hero speaks to HIM); E the child a guest with the party. Every end is the seat's proposal, built as the page has it, standing for his overrule (the lane's 11-11 section)
  In.BY = { silver: [80, 300], DC: { Persuasion: 12 }, at: { party: [15, 6], child: [16, 7], from: [18, 17], gennet: [17, 8], wood: [16, 26], doran: [19, 10], door: [18, 18], doorBy: [18, 17], purse: [17, 9], out: [18, 12], wall: [15, 4], form: [[16, 5], [17, 6], [16, 6], [17, 7]], boys: [[20, 17], [20, 19]] }, // (wall: where the child backs to when it comes to blows; form: the four as they fall out of the token then; boys: Orrin and Pell inside, behind Elsbeth at the door -- ruling 37)
    freedIt: 'The pin comes out. It does not run: it takes a hand and holds on.',
    seam: '{g}(The child walks beside the party from here, a figure of her own: on floors and at the camp\'s fire, down the road to the Pit.){/}', // (short: a long line ran out of the floor's card -- 11-11, Griz at renown 5: "some of the texts are escaping their text boxes")
    ledNight: 'Past midnight Doran Waterby knocks with the shore-lantern lit. "It\'s the night. Come on, if you\'re coming."',
    shut: '{y}Gennet Waterby:{/} "Not to you. Not tonight, and not again."',
    hint: 'She does not turn round. "That\'s no goblin in our barn. Put your hand on it."' };
  In.BY.READS = { // (a hero's ONE read a stage: the first of these that hero's passive reaches)
    touch: { stage: 'open', skill: 'Perception', dc: 12, opens: 'turn', ok: function (S) { return !S.seen; }, text: function (S) { return `(perception) The hand in ` + S.holder + `'s hand has no claws in it. It grips the way a child's does.`; } },
    glamour: { stage: 'open', skill: 'Arcana', dc: 13, opens: 'name', ok: function (S) { return !S.seen; }, text: function () { return `(arcana) The whole of it hums with an illusion, laid close as a skin.`; } },
    watched: { stage: 'open', skill: 'Insight', dc: 12, text: function () { return `(insight) She came out of the house already running. She was watching the barn.`; } },
    notlook: { stage: 'ask', skill: 'Insight', dc: 12, text: function () { return `(insight) The child has not looked at Gennet once.`; } },
    price: { stage: 'bribe1', skill: 'Insight', dc: 12, text: function () { return `(insight) She has not asked what the party wants with the child. She has only named a price.`; } },
    purse: { stage: 'bribe2', skill: 'Perception', dc: 13, text: function () { return `(perception) Old coin, green from the water, the same strike as her change for the rooms. She is offering the house's luck.`; } }
  };
  (function () {
    var BY = In.BY, it = function (S) { return S.seen ? 'her' : 'it'; }, It = function (S) { return S.seen ? 'She' : 'It'; }, sub = function (S) { return S.seen ? 'she' : 'it'; };
    BY.nights = function (n) { return n === 0 ? 'tonight' : n === 1 ? 'tomorrow night' : 'in ' + (In.WORDS[n] || n) + ' nights'; };
    var seenSpeech = function (S) { S.by('gennet', `"Somebody put a goblin's face on a child and sent her down this road. Who takes that in, if I don't?"`); S.by('gennet', `"I chain her so she'll not walk out among drovers looking like that. They'd not stop to ask."`); };
    var breakIt = function (S, how) { S.seen = true; S.f.glamourBroken = 1; S.f.glamourSeen = 1; S.broke = how; In.trail('the barn\'s yard: the glamour broken by ' + how); S.swap(); S.look('gennet', `Gennet stops with her mouth open on the next word.`); S.by('gennet', `"Well. Then you know why I couldn't have her in the house."`); seenSpeech(S); };
    // what Doran says when he says it (END D, and END C when he yields): the built confession (js/secondact.js A.LINES confess1-3), in the yard and of the child
    BY.confession = function (S) {
      S.look('doranIn', `Doran sets the woodaxe down in the dirt of the yard.`);
      S.by('doranIn', `"There's a thing in the lake. It came down out of the bogs in my time here. Every month it's fed, and every month the lake gives back: the fish, the old coin, her."`);
      S.look('doranIn', `He does not look at Gennet.`, 'gennet');
      S.by('doranIn', S.nights === 0 ? `"Tonight is the night. That child was tonight."` : `"It's due ` + BY.nights(S.nights) + `. That child was for it."`);
      S.by('doranIn', S.nights === 0 ? `"It comes up anyway. It always comes up. If you mean to stop it, come out back. I'll show you the stone."` : `"It comes up anyway. It always comes up. If you mean to stop it, be in this house ` + BY.nights(S.nights) + `. I'll show you the stone."`);
    };
    // TELL ME ABOUT IT on the room-and-board line (11-12, the inn seat; Griz, 11-11 2329Z: "room and board line given a 'tell me more' button"): the offer said plainly, in
    // her own voice -- what she gives, what she wants for it (H16.TELL_RULE: "who pays and why ... what a choice will do")
    BY.tellBoard = [`"Plain, then. You pay nothing for beds or table, this stay or the next time this road brings you by. And ` + (BY.silver[0] === 80 ? 'eighty' : BY.silver[0]) + ` in old silver, in your hand, today."`,
      `"For that, the little one stays here with me, and nobody carries talk of it to the Pit or to Silverton. That's the whole of what I'm asking."`];
    BY.STAGES = {
      open: { lines: function (S) {
          S.narr(S.seen ? `The pin is out. The child does not run. She has ` + S.holder + `'s hand, and the party walks her out of the barn into the yard.` : `The pin is out. The goblin does not run. It has ` + S.holder + `'s hand, and the party walks it out of the barn into the yard.`);
          S.look('gennet', `Gennet comes across the yard from the house at a run, wiping her hands on her apron, and stops a pace short of the child.`);
          if (S.seen) { S.by('gennet', `"So you've seen what she is under it."`); S.by('gennet', `"That's why I knew to keep her. Poor innocent thing."`); seenSpeech(S); }
          else { S.by('gennet', `"Oh, you've found it. There, now. There."`); S.by('gennet', `"That's why I knew to keep it. Poor innocent thing."`); // (his: "that's why i knew to keep it, poor innocent thing")
            S.by('gennet', `"A carter had it in with her goods like a sack of meal. Somebody would have put a boot on it before the Gulch. So I said, leave it with me."`);
            if (S.renown >= 3) S.by('gennet', `"You're Hessle's people. You know what gets done to a goblin for a board's silver."`); else S.by('gennet', `"It's not their fault what they're born."`); } },
        opts: [
          { id: 'turn', read: 'touch', skill: function () { return 'Perception'; }, say: function () { return `Let me see that hand.`; }, pre: function (S, e) { return e.hero.name + ` takes the small hand and turns it over.`; },
            run: function (S, e) { S.narr(`Under ` + e.hero.name + `'s thumb the hide is not there: a thin arm, a sleeve, a child's wrist.`); breakIt(S, e.hero.name + '\'s hand'); }, go: 'ask' },
          { id: 'name', read: 'glamour', skill: function () { return 'Arcana'; }, say: function () { return `That is no goblin. That is a glamour, laid close as a skin.`; },
            run: function (S, e) { S.narr(`A child stands in the yard with a chain-gall on one ankle, eyes on ` + e.hero.name + `.`); breakIt(S, e.hero.name + '\'s word'); }, go: 'ask' },
          { id: 'chain', who: ['lymen'], say: function (S) { return It(S) + ` was chained by the ankle.`; }, run: function (S) { S.by('gennet', S.seen ? `"She bolts. The first month they all bolt. Would you have her on the road, looking like that, for the first drover's dog?"` : `"It bolts. The first month they all bolt. Would you have it out on the road for the first drover's dog?"`); }, go: 'ask' },
          { id: 'raise', who: ['aurdin'], say: function (S) { return S.seen ? `You mean to raise her. Here.` : `You mean to raise a goblin. In an inn.`; }, run: function (S) { S.by('gennet', S.seen ? `"As mine. She'll have a bed in the kitchen by winter, when the look has worn off her."` : `"Why not? It'll carry water by spring. They work, if you start them small and feed them regular."`); }, go: 'ask' },
          { id: 'sold', who: ['barley'], say: function (S) { return `Who sold ` + it(S) + ` to you?`; }, run: function (S) { S.by('gennet', `"Nobody sold anything. The carter couldn't feed ` + it(S) + `."`); S.look('gennet', `Gennet keeps her smile where it was.`); }, go: 'ask' },
          { id: 'whose', who: ['vivian'], say: function (S) { return S.seen ? `Whose is she?` : `Whose is it?`; }, run: function (S) { S.by('gennet', `"Mine, since the carter left. Whose else?"`); }, go: 'ask' },
          { id: 'hush', any: true, say: function () { return `Easy. Nobody's hurt.`; }, run: function (S) { S.by('gennet', `"No. And nobody will be."`); }, go: 'ask' }
        ] },
      ask: { lines: function (S) { S.look('child', (S.seen ? `The child` : `The goblin`) + ` holds on harder to ` + S.holder + `'s hand.`); S.by('gennet', S.seen ? `"Give her here, now. She's had a fright, and she knows my voice. I'll raise her as mine."` : `"Give it here, now. It's had a fright, and it knows my voice. I'll raise it right."`); },
        opts: [
          { id: 'let1', who: ['aurdin'], say: function (S) { return `It's your house, and your charge. Raise ` + it(S) + ` well.`; }, run: function () { }, end: 'a' },
          { id: 'let2', who: ['lymen'], say: function (S) { return `If ` + sub(S) + `'s cared for here, then here is where ` + sub(S) + ` stays.`; }, run: function () { }, end: 'a' },
          { id: 'lake', who: ['lymen'], ok: function (S) { return S.know; }, say: function (S) { return `Raise ` + it(S) + ` until which night?`; }, run: function (S) { S.named = 1; S.look('gennet', `Gennet goes still. Her hands come out of her apron.`); }, go: 'break' },
          { id: 'no', who: ['barley'], say: function () { return `No.`; }, run: function (S, e) { S.look('gennet', `Gennet looks at ` + e.hero.name + `, and then at the others, to see who else means it.`); }, go: 'bribe1' },
          { id: 'rather', who: ['vivian'], say: function () { return `And if we'd rather not?`; }, run: function (S) { S.by('gennet', `"Then we'll come to something. People do, in my yard."`); }, go: 'bribe1' },
          { id: 'with', who: ['lymen'], say: function (S) { return It(S) + ` was on a chain. ` + It(S) + ` comes with us.`; }, run: function (S) { S.by('gennet', `"On what road? To what? You've a council's errand, not a nursery."`); }, go: 'bribe1' },
          { id: 'keep', any: true, say: function (S) { return `Keep ` + it(S) + `, then.`; }, run: function () { }, end: 'a' }
        ] },
      bribe1: { lines: function (S) { S.by('gennet', `"You've a road to pay for. Call the rooms and the board mine, this stay and the next."`, BY.tellBoard); S.look('gennet', `Gennet takes old silver out of her apron pocket and holds it flat on her palm.`); S.by('gennet', `"And this on top. For your trouble, and no more said about it."`); },
        opts: [
          { id: 'take1', who: ['vivian'], say: function () { return `Count it out.`; }, run: function () { }, end: 'b' },
          { id: 'lot', who: ['barley'], say: function () { return `That's a lot of silver for a kindness.`; }, run: function (S) { S.by('gennet', `"Kindness costs. Ask anyone who's done one."`); }, go: 'bribe2' },
          { id: 'nosilver', who: ['lymen'], say: function () { return `Keep your silver.`; }, run: function (S) { S.look('gennet', `Gennet closes her hand on the coin.`); }, go: 'bribe2' },
          { id: 'worth', who: ['aurdin'], say: function () { return `What is one foundling worth to an inn?`; }, run: function (S) { S.by('gennet', `"My word. I told the carter I'd keep ` + it(S) + `. I keep what I say."`); }, go: 'bribe2' },
          { id: 'take1x', any: true, say: function () { return `Done.`; }, run: function () { }, end: 'b' }
        ] },
      bribe2: { pre: function (S) { S.by('gennet', `"Elsbeth! The green purse, from under the stair."`); if (S.tier >= 2) { S.look('elsbeth', `Elsbeth stands in the house door. She does not go for it.`); return 'purseSelf'; } return 'purseEls'; }, // (the walk shown: Gennet to the house and back, or Elsbeth out with it -- 11-11, Griz: "the coming and going, gennet for the bag or leaving with the child, etc - should be animated")
        lines: function (S) {
          S.by('gennet', `"This came up out of the lake the year we wed. Every coin of it is yours. And the big room, any night you're on this road, for as long as I keep the house."`);
          S.by('gennet', `"Or walk on with ` + it(S) + `, and find this well shut to you. It's the only one between Silverton and the Pit."`); },
        opts: [
          { id: 'take2', who: ['vivian'], say: function () { return `All of it, then.`; }, run: function (S) { S.big = 1; }, end: 'b' },
          { id: 'no2', who: ['barley'], say: function () { return `No.`; }, run: function () { }, go: 'break' },
          { id: 'well', who: ['lymen'], say: function () { return `The well's not yours to shut. And the child's not yours to keep.`; }, run: function () { }, go: 'break' },
          { id: 'gets', who: ['aurdin'], say: function () { return `You'd give the lake's own gift for one foundling. What does the lake get?`; }, run: function (S) { S.named = 1; S.look('gennet', `Gennet does not answer that.`); }, go: 'break' },
          { id: 'no2x', any: true, say: function () { return `No.`; }, run: function () { }, go: 'break' }
        ] },
      'break': { pre: function (S) { S.look('gennet', `Gennet takes the child's free arm in both hands.`, 'child'); S.by('gennet', `"Then you'll not carry ` + it(S) + ` off my yard."`); if (S.doran) { S.by('gennet', `"Doran!"`); return 'doran'; } return null; },
        lines: function (S) {
          if (S.doran) { S.look('doranIn', S.renown >= 5 ? `Doran comes round the barn from the woodpile with the woodaxe, sees who is in the yard, and lets the axe hang.` : `Doran comes round the barn from the woodpile with the woodaxe, and stops when he sees whose arm she has.`, 'gennet'); S.by('gennet', `"They mean to take ` + it(S) + `."`); }
          else S.by('gennet', `"Elsbeth! The word! Say the word!"`); },
        opts: [
          { id: 'doranP', who: ['lymen'], ok: function (S) { return S.doran; }, skill: function (S, e) { return S.made(e, 'Persuasion') ? 'Persuasion' : null; }, say: function (S, e) { return S.made(e, 'Persuasion') ? `Doran. Look at whose arm that is, and tell me what she's kept for.` : `Doran. Tell her to let go.`; }, run: function () { }, endFn: function (S, e) { return S.made(e, 'Persuasion') || S.renown >= 5 ? 'd' : 'e'; } },
          { id: 'axe', who: ['barley'], ok: function (S) { return S.doran; }, say: function () { return `Put the axe down. Nobody here wants it used.`; }, run: function () { }, endFn: function (S) { return S.renown >= 5 ? 'd' : 'e'; } },
          { id: 'hands', who: ['aurdin'], ok: function (S) { return S.doran; }, say: function () { return `Mistress Waterby. Take your hands off the child.`; }, run: function () { }, endFn: function (S) { return S.renown >= 5 ? 'd' : 'e'; } },
          { id: 'steel', who: ['vivian'], ok: function (S) { return S.doran; }, say: function () { return `Steel, then.`; }, pre: function (S, e) { return e.hero.name + ` has the knife out.`; }, run: function (S) { S.drew = 1; }, end: 'c' },
          { id: 'draw', any: true, ok: function (S) { return S.doran; }, say: function () { return `Then it's steel.`; }, run: function (S) { S.drew = 1; }, end: 'c' },
          { id: 'letgo', who: ['lymen'], ok: function (S) { return !S.doran; }, say: function (S) { return `Let go of ` + it(S) + `.`; }, run: function () { }, end: 'e' },
          { id: 'between', who: ['barley'], ok: function (S) { return !S.doran; }, say: function () { return `That's enough.`; }, pre: function (S, e) { return e.hero.name + ` steps between Gennet and the child.`; }, walk: 'between', run: function (S) { S.stepped = 1; }, end: 'e' }, // (and does: Gennet gives a square and the hero stands on it -- 11-12, Griz: "barley 'steps between' narratively but does not")
          { id: 'word', who: ['aurdin'], ok: function (S) { return !S.doran; }, say: function () { return `What word, Mistress Waterby? Whose?`; }, run: function () { }, end: 'e' },
          { id: 'knife', who: ['vivian'], ok: function (S) { return !S.doran; }, say: function () { return `Hands off.`; }, pre: function (S, e) { return e.hero.name + ` has a hand on the knife.`; }, run: function (S) { S.drew = 1; }, end: 'e' },
          { id: 'off', any: true, ok: function (S) { return !S.doran; }, say: function (S) { return `Let ` + it(S) + ` go.`; }, run: function () { }, end: 'e' }
        ] }
    };
    // HER NAME, asked by the door on portraits (11-12; Griz, 11-11 2329Z: "line 'child is asked her name' use char player used as party voice most often during
    // encounter or vivian and do that bit in portraits by the door (line says 'at the road)"): the hero who spoke for the party most in this talk asks -- a tie, or
    // nobody ahead, and it is Vivian (if she is of the four); the child answers. The name is the seat's, his to give
    BY.NAMEQ = { lymen: `What's your name, little one?`, aurdin: `Have you a name?`, vivian: `What do they call you?`, barley: `What's your name?` };
    BY.asker = function (S, four) { var best = 0, at = null; four.forEach(function (e) { var n = S.said[e.key] || 0; if (n > best) { best = n; at = e; } else if (n === best) at = null; }); return at || four.filter(function (e) { return e.key === 'vivian'; })[0] || four[0]; };
    BY.nameAsk = function (S, four) { var e = BY.asker(S, four); In.trail('her name asked by ' + e.hero.name); S.heroAsk(e, `The child looks up at ` + e.hero.name + `.`, BY.NAMEQ[e.key] || BY.NAMEQ.barley, 'child'); S.by('child', `"Nell."`); };
    BY.hip = 36; // (how far up Gennet's figure the carried child is drawn, in pixels)
    BY.endWalk = function (S, k) { return k === 'e' && !S.doran && S.tier >= 3 ? 'elsbethOut' : null; }; // (a walk that comes before an end's words)
    // what is said as each end falls (the fight itself, and what the house does after, are In.barnYard's)
    BY.END = function (S, k) {
      if (k === 'a') { S.look('gennet', `Gennet takes the child up onto her hip, the way a woman does who has carried many.`, 'child', 'lift'); S.by('gennet', S.seen ? `"There. You've good sense, the lot of you. She'll want for nothing."` : `"There. You've good sense, the lot of you. It'll want for nothing."`);
        S.by('gennet', `"Supper's at eight. There's fish."`); S.look('child', (S.seen ? `The child` : `The goblin`) + ` looks back at ` + S.holder + ` over Gennet's shoulder, all the way to the ` + (S.seen ? `house door.` : `barn door.`) + ` Elsbeth goes in.`, null, 'carryIn'); } // (carried, and seen to be: the child rides on Gennet's hip to the door -- 11-12, Griz: "narrative says she's carried, animation is walks in first")
      else if (k === 'b') { S.look('gennet', S.big ? `Gennet puts the green purse into the party's hands without counting it.` : `Gennet counts the old silver out, coin by coin.`); S.by('gennet', `"There. And nobody's the worse."`);
        S.look('elsbeth', `Elsbeth is in the house door. She has seen the coin change hands. She goes in.`, null, 'elsIn'); S.look('gennet', `Gennet takes the child by the wrist and walks ` + it(S) + (S.seen ? ` in at the house door.` : ` back into the barn.`) + ` The child does not pull.`, 'child', 'pair'); }
      else if (k === 'c') { S.narr(`Gennet lets go of the child. The child backs up against the barn wall.`, 'kidWall'); S.look('elsbeth', `Elsbeth is in the house door with the wand in her hand. Orrin and Pell are inside, behind her.`, null, 'elsDoor'); } // (ruling 13: with the boys, the wand on nobody who does not come at them)
      else if (k === 'd') { S.look('doranIn', `Doran looks at the child's arm in Gennet's hands for a long breath.`, 'gennet'); S.by('doranIn', `"Gen. Let go."`); S.look('gennet', `Gennet lets go. She does not look at him.`, 'doranIn'); BY.confession(S);
        S.by('gennet', `"You've killed us. You know that. It'll come up hungry."`); S.by('doranIn', `"It comes up anyway."`); S.look('gennet', `Gennet walks back to the house. Elsbeth lets her by, and goes in after her.`, null, ['gennetIn', 'elsIn']); S.look('doranIn', S.byDay ? `Doran picks the axe up by its head and carries it back to the woodpile.` : `Doran picks the axe up by its head and goes in.`, null, 'doranOff'); S.look('child', (S.seen ? `The child` : `The goblin`) + ` has not let go of ` + S.holder + `'s hand.`); }
      else { // e: the child goes with the party
        if (S.doran) { S.look('doranIn', `Doran looks at the child's arm in Gennet's hands.`, 'gennet'); S.by('doranIn', `"Gen. Let go."`); S.look('gennet', `Gennet lets go.`); S.look('doranIn', S.byDay ? `Doran says nothing else. He takes the axe back to the woodpile.` : `Doran says nothing else. He takes the axe back inside.`, null, 'doranOff'); }
        else if (S.tier >= 3) { S.look('elsbeth', `Elsbeth has come out into the yard. The wand stays in her apron.`); S.by('elsbeth', `"No."`); S.by('elsbeth', `"It's for the lake. Tell them, or I will."`); S.f.elsbethSaidLake = 1; S.look('gennet', `Gennet lets go of the child as if the arm had burned her.`, 'elsbeth'); }
        else if (S.tier === 2) { S.look('elsbeth', `Elsbeth is in the house door, Orrin and Pell behind her, the wand held down at her side. She does not say the word.`); S.look('gennet', `Gennet waits for it. Then she lets go.`, 'elsbeth'); }
        else { S.narr(`Nobody comes out of the house.`); S.look('gennet', S.stepped ? `Gennet looks past ` + S.holder + `'s shoulder at the house, once more. Then she lets it be.` : `Gennet lets go.`); }
        if (S.drew && !S.doran) S.by('gennet', `"You'd put a knife to an innkeeper's wife in her own yard. Go on, then. Take ` + it(S) + `."`);
        S.by('gennet', S.nights === 0 ? `"It comes up tonight, with ` + it(S) + ` or without. You think on who'll be in this house when it does."` : `"It comes up ` + BY.nights(S.nights) + `, with ` + it(S) + ` or without. You think on who'll be in this house when it does."`);
        if (S.tier >= 3) S.by('elsbeth', `"Take her to the Pit. Not Silverton. Silverton's where the wagon was going."`);
        S.look('gennet', `Gennet goes back across the yard and in at the house door.` + (S.tier >= 2 || S.doran ? ` Elsbeth goes in after her.` : ` Elsbeth, who has watched from the door, goes in after her.`), null, ['gennetIn', 'elsIn']); S.look('child', (S.seen ? `The child` : `The goblin`) + ` has not let go of ` + S.holder + `'s hand.`); // (RULED 11-11, ruling 40, Griz: "The pit is where we return the wagon of kids, weird for her to suggest silverton where the wagon was going"; the route is the realm's: TarlynsPit/wiki/halfway-inn-and-lake.md, the wagon's month)
      }
    };
  })();
  // the yard's talk as it stands, kept across its pauses (a figure walking: In.barnYard) on Y.S
  In.barnS = function (B, Y, four) {
    if (Y.S) return Y.S;
    var f = B.roam.flags, d = In.day(D.roam.q), BY = In.BY, SO = D.counter.SHEETOF;
    var S = Y.S = { f: f, seen: !!f.glamourBroken, renown: In.renown(), doran: !!Y.doran || !!Y.night, byDay: !Y.night, tier: f.elsbethTier || 0, nights: In.nightsToDue(f, d), know: !!(f.elsbethTold || f.heardLakeTake || f.heardLamp), holder: four[0].hero.name, stage: 'open', rolls: {}, out: [], did: {}, pending: null, endPending: null };
    S.who = function (id) { var u = id === 'gennet' ? Y.gennet : id === 'doranIn' ? Y.doran : id === 'child' ? Y.child || Y.kid : Y.elsbeth; return { name: id === 'gennet' ? In.named(f) : id === 'doranIn' ? 'Doran' : id === 'elsbeth' ? 'Elsbeth' : S.seen ? 'The child' : 'The goblin', unit: u || null, side: id === 'gennet' ? 'right' : 'left', sheet: id === 'elsbeth' ? In.elsbethCut() : id === 'child' ? In.childFace(S.seen) : (id === 'gennet' || id === 'doranIn') && SO && SO[id] ? SO[id]({ flags: f }) : null }; }; // (Elsbeth on the tub portrait's cut, as at the supper -- 11-12, Griz: "we're using a cut of the tub portrait for elsbeth in scenes like this aren't we?": the yard was showing her figure's face)
    S.by = function (id, line, tell) { S.out.push({ by: id, line: line, tell: tell || null }); }; // (tell: the line's own TELL ME ABOUT IT -- js/hours.js H16.TELL_RULE)
    S.narr = function (line, walk) { S.out.push({ narr: line, walk: walk || null }); }; S.look = function (id, line, at, walk) { S.out.push({ look: id, line: line, at: at || null, walk: walk || null }); }; // (walk: what moves on the yard as the line is said -- In.barnYard's acts)
    S.said = {}; S.heroAsk = function (e, prompt, say, of) { S.out.push({ heroAsk: e, line: prompt, say: say, of: of }); }; // (said: how many times each hero has spoken for the party; heroAsk: a hero's one line, in the bubble, to the one named)
    S.made = function (e, skill) { var k = e.key + ':' + skill; if (S.rolls[k] == null) { var r = In.d20(), v = DS.R.skill(e.h, skill, In.AB[skill]); S.rolls[k] = r + v >= BY.DC[skill]; In.trail(e.hero.name + ' ' + skill + ' ' + r + (v >= 0 ? ' + ' : ' - ') + Math.abs(v) + ' = ' + (r + v) + ' vs DC ' + BY.DC[skill] + (S.rolls[k] ? ', made' : ', missed') + ' (silent)'); } return S.rolls[k]; };
    S.swap = function () { if (Y.swap) Y.swap(); };
    In.trail('out of the barn: the glamour ' + (S.seen ? 'seen through' : 'unseen') + ', renown ' + S.renown + ', Doran ' + (S.doran ? 'home' : 'away') + ', Elsbeth\'s tier ' + S.tier + ', the due ' + BY.nights(S.nights));
    return S;
  };
  // the talk on the flip. It returns when it ends (B.roam.barnEnd), or when someone must walk (S.pending: In.barnYard walks them and opens it again where it stopped);
  // `only`: a few lines said on portraits and nothing else (what is said after the yield)
  In.barnTalk = function* (sc, B, Y, four, only) {
    var BY = In.BY, S = In.barnS(B, Y, four), i;
    var wait = function (o) {
      if (o.walk && Y.go) Y.go(o.walk); // (the figure sets off as its line comes up)
      if (o.heroAsk) { sc.hero = o.heroAsk.hero; sc.heroSide = 'left'; return sc.askBy(S.who(o.of), [o.line], [o.say], o.of === 'child' ? 'lookingup' : null); } // (her face tipped up to the one asking: pt_keptchild's `lookingup`)
      if (o.look === 'child' && /holds on harder|backs up|has not let go/.test(o.line)) { var wl = sc.lookAt(S.who(o.look), [o.line], o.at ? S.who(o.at) : null); wl.face = 'afraid'; return wl; } // (her `afraid` row where the line is her fear)
      return o.narr ? sc.narr([o.narr]) : o.look ? sc.lookAt(S.who(o.look), [o.line], o.at ? S.who(o.at) : null) : M.tell2(sc.by(S.who(o.by), [o.line]), o.tell);
    };
    var done = function (end) { B.roam.barnEnd = { end: end, big: !!S.big, drew: !!S.drew, seen: S.seen, doran: S.doran, tier: S.tier, nights: S.nights }; In.trail('out of the barn: END ' + end.toUpperCase()); };
    if (only) { S.out = []; only(S); for (i = 0; i < S.out.length; i++) yield wait(S.out[i]); sc.echo = null; sc.hero = null; return; }
    if (S.endPending) { var e0 = S.endPending; S.endPending = null; S.out = []; BY.END(S, e0); for (i = 0; i < S.out.length; i++) yield wait(S.out[i]); done(e0); return; }
    for (var n = 0; n < 8; n++) {
      var stg = BY.STAGES[S.stage];
      if (stg.pre && !S.did[S.stage]) { S.did[S.stage] = 1; S.out = []; var wk = stg.pre(S); for (i = 0; i < S.out.length; i++) yield wait(S.out[i]); if (wk) { S.pending = wk; return; } }
      S.out = []; stg.lines(S);
      var prompt = S.out.pop(); for (i = 0; i < S.out.length; i++) yield wait(S.out[i]);
      // ONE read a hero a stage, and each read ONE hero's: the best passive among those it has not gone to (RULED 11-11: an insight's answers are its hero's alone)
      var cur = {}; Object.keys(BY.READS).forEach(function (id) { var r = BY.READS[id], best = null; if (r.stage !== S.stage || (r.ok && !r.ok(S))) return; four.forEach(function (e) { if (cur[e.key]) return; var pv = In.passive(e.h, r.skill); if (pv >= r.dc && (!best || pv > best.pv)) best = { e: e, pv: pv }; }); if (best) cur[best.e.key] = id; });
      var optsOf = function (e) { var rid = cur[e.key] || null, ok = stg.opts.filter(function (o) { if (o.read) return rid === o.read; if (o.any ? In.SUP.FOUR.indexOf(e.key) >= 0 : o.who.indexOf(e.key) < 0) return false; return !o.ok || o.ok(S, e); }), out = [], shaded = 0;
        ok.forEach(function (o) { var sk = o.skill ? o.skill(S, e) : null; if (sk) { if (shaded) return; shaded++; } if (out.length < In.MEAL.CAP) out.push({ o: o, label: o.say(S, e), shade: !!sk, tag: sk || null }); }); return out; };
      var list = four.map(function (e) { var rid = cur[e.key] || null, ops = optsOf(e); return { e: e, hero: e.hero, side: 'left', key: e.key, rid: rid, reads: rid ? [BY.READS[rid].text(S)] : [], ops: ops, opts: ops.map(function (p) { return p.label; }), marks: ops.map(function (p) { return p.shade ? { shade: true, tag: p.tag } : null; }), ids: ops.map(function (p) { return p.o.id; }), shaded: ops.filter(function (p) { return p.shade; }).length }; }).filter(function (x) { return x.ops.length; });
      if (!list.length) { done('e'); return; }
      list.forEach(function (x) { if (x.rid && BY.READS[x.rid].skill === 'Insight') In.edgeSet(B.roam.flags, x.key, x.hero.name); });
      list.forEach(function (x) { if (x.rid) In.trail(x.hero.name + ' passive ' + BY.READS[x.rid].skill + ' ' + In.passive(x.e.h, BY.READS[x.rid].skill) + ' vs DC ' + BY.READS[x.rid].dc + ', read: ' + x.rid); });
      var at0 = Math.max(0, list.map(function (x) { return x.key; }).indexOf(S.lastKey));
      var pk = yield sc.flip(S.who(prompt.by || 'gennet'), [prompt.line], list, at0), x = list[pk && pk.at != null ? pk.at : at0] || list[0], p = x.ops[pk && pk.k != null ? pk.k : 0] || x.ops[0], o = p.o, e = x.e;
      S.lastKey = x.key; S.said[x.key] = (S.said[x.key] || 0) + 1; S.out = []; sc.hero = e.hero; sc.heroSide = 'left'; In.trail(e.hero.name + ': ' + p.label);
      if (o.pre) { if (o.walk && Y.go) Y.go(o.walk, e); yield sc.narr([o.pre(S, e)]); }
      o.run(S, e); for (i = 0; i < S.out.length; i++) yield wait(S.out[i]);
      var end = o.endFn ? o.endFn(S, e) : o.end || null;
      sc.echo = null; sc.hero = null;
      if (!end) { S.stage = o.go; continue; }
      var ew = BY.endWalk(S, end); if (ew) { S.pending = ew; S.endPending = end; return; }
      S.out = []; BY.END(S, end); for (i = 0; i < S.out.length; i++) yield wait(S.out[i]); done(end); return;
    }
  };
  // the yard's scene round the talk: the party at the barn's step, the child at hand, Gennet up from the house, Elsbeth in its door, Doran from the woodpile when he is called --
  // every coming and going WALKED (11-11, Griz: "should be animated (they disappear and the text says the move)") -- then what the end does
  In.barnYard = function* (B) {
    var Rm = D.roam, R0 = B.roam, f = R0.flags, BY = In.BY, A = D.secondact, C = D.counter, c = In.cycle(In.day(Rm.q)), Y = {}, P = BY.at;
    In.stage(B, P.party, null);
    var kid = function (at) { return In.unit(B, { id: 'barnKid', kind: f.glamourBroken ? In.keptKind() : 'glamourgoblin', at: (at || P.child).slice(), name: f.glamourBroken ? 'The child' : 'The goblin', face: [1, 1] }); };
    BY.exits = []; BY.stoodAt = null; Y.child = Y.kid = kid(); Y.swap = function () { var at = [Y.child.x, Y.child.y]; BY.exits.push({ id: 'barnKid', x: at[0], y: at[1], how: 'swap' }); In.gone(B, Y.child); Y.child = Y.kid = kid(at); }; // (the glamour breaking: the goblin's figure for the child's, on its own square; Y.kid: her figure kept for a face after she has joined the party)
    Y.gennet = In.unit(B, { id: 'gennetYard', kind: 'commonerwoman', at: P.from.slice(), name: In.named(f), face: [-1, -1] });
    var dy = B.units.filter(function (u) { return u.npc === 'doranYard'; })[0] || null;
    Y.doran = f.doranAway || f.doranDead ? null : dy || null; Y.night = !dy && !f.doranAway && !f.doranDead; // (by day the lay's own Doran at the woodpile; after dark he is in the house, and comes out of its door when he is called -- `doran` below)
    Y.elsbeth = f.elsbethGone ? null : In.unit(B, { id: 'elsbethYard', kind: 'commonerwoman', at: P.door.slice(), name: 'Elsbeth', face: [-1, -1] }); // (in the house door, watching)
    yield* In.walk(B, Y.gennet, P.gennet, [-1, -1]);
    var four = [R0.token].concat(R0.rest || []).filter(function (u) { return u && u.src && !u.src.guest && u.hp > 0; }).slice(0, 4).map(function (u) { return { u: u, h: u.src, key: u.src.key || u.src.id, hero: In.heroOf(u) }; });
    var HOUSE = In.DOORS.front, BARN = In.DOORS.barn, byDay = !!dy, onFloor = function (u) { return !!u && B.units.indexOf(u) >= 0; }, near = function (a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= 1; };
    // NOBODY VANISHES (RULED 11-11 night, Griz: "the narration is that they leave, so they should walk and go through the inn door or something rather than disappear"):
    // every figure the scene stood on the yard leaves ON FOOT -- in at the house door, in at the barn's, into the party's token -- and is taken off the floor only there;
    // or it stands where the inn's own lay stands it (Doran at the woodpile by day) and is handed to the lay in place. BY.exits keeps where each left the floor (a bench's)
    var gone = function (u, how) { if (!onFloor(u)) return; BY.exits.push({ id: u.scripted || u.npc || u.id, x: u.x, y: u.y, how: how }); In.gone(B, u); };
    var out = function* (u, door, how) { if (!onFloor(u)) return; yield* In.walk(B, u, door); gone(u, how || 'door'); };
    var elsIn = function* () { yield* out(Y.elsbeth, HOUSE); Y.elsbeth = null; }; // (she steps back inside)
    var doranOff = function* () { // (back to the woodpile by day, where the lay stands him; by night in at the house door)
      if (!Y.doran) return;
      if (byDay) { yield* In.walk(B, Y.doran, P.wood, [1, 0]); if (Y.doran.npc !== 'doranYard') gone(Y.doran, 'swap'); } // (the scene's own figure of him, after a fight: the lay's stands on that square the same frame)
      else yield* out(Y.doran, HOUSE);
      Y.doran = null;
    };
    // THE CHILD WALKS BESIDE THE PARTY, a figure of her own, never into the token (RULED 11-11 night, Griz: "let's not have the kid join the party token, constant reminder
    // they're on an escort mission now"): she walks to a square by the token and from then on takes the square the token just left (In.follow; D.roam.step below)
    var join = function* () { if (!Y.child) return; var t = R0.token, q = In.beside(B, Y.child, t); yield* In.walk(B, Y.child, q, [t.x - q[0], t.y - q[1]]); Y.child.follower = true; Y.child.noArea = true; Y.child.name = f.glamourBroken ? 'The child' : 'The goblin'; R0.follower = Y.child; BY.exits.push({ id: 'barnKid', x: q[0], y: q[1], how: 'follows' }); Y.child = null; }; // (her name on her plate once she has said it: the close, below)
    var dest = function () { return Y.S && Y.S.seen ? HOUSE : BARN; };
    // THE WALK COMES UP WITH ITS WORDS (11-12, the inn seat; Griz at Sylvia's table, 11-11 2329Z: "have the walks animate when the message comes up (i.e. doran back to the
    // woodpile)"; and on the seen-through end, "narrative says she's carried, animation is walks in first"; on Doran away, "barley 'steps between' narratively but does
    // not"): a line of the talk may name what moves as it is said (S.look / S.narr `walk`, an answer's `walk`) -- the figure sets off under the open screen while the line
    // is up, one walk after another in the order the lines named them (Y.q), and what is still walking when the talk closes is walked out before anything else happens.
    // The moves: Gennet takes the child up ON HER HIP and carries her in (END A: the child's figure rides on hers, a little raised, to the door); Gennet and the child in
    // together, the child a step ahead by the wrist (END B); a hero steps between them and Gennet gives a square (Doran away); each exit by its own door
    var acts = {
      gennetIn: function* () { yield* out(Y.gennet, HOUSE); Y.gennet = null; }, elsIn: elsIn, doranOff: doranOff, join: join,
      elsDoor: function* () { if (onFloor(Y.elsbeth)) yield* In.walk(B, Y.elsbeth, HOUSE, [-1, -1]); },
      kidWall: function* () { if (onFloor(Y.child)) yield* In.walk(B, Y.child, P.wall); },
      // (SHE LEAVES AFTER HER WORDS, 11-13, his 0515Z note on eyes-barn-carried-1112: "works but plays early, gennet leaves and then still says things" -- the one act had
      // lifted the child AND walked the two in at the door under the stage's first line, with her "There. You've good sense..." and "Supper's at eight." still to say.
      // Now the first line only lifts the child to her hip (`lift`); she says her two lines standing there; the walk to the door is under the last line, the child
      // looking back, Elsbeth in after them (`carryIn`). `carry` is the whole of it still, for a stage that ends with the two on the floor)
      carryIn: function* () { yield* acts.carry(); yield* elsIn(); },
      lift: function* () {
        var g = Y.gennet, k = Y.child; if (!onFloor(g) || !onFloor(k) || k.lift) return;
        if (!near(g, k)) { var q = In.beside(B, g, k); yield* In.walk(B, g, q); }
        g.facing = D.spr.facingFor(k.x - g.x, k.y - g.y); yield 8;
        BY.exits.push({ id: 'barnKid', x: g.x, y: g.y, how: 'carried' }); k.lift = BY.hip; k.onCounter = true; k.x = g.x; k.y = g.y; k.tween = null; k.anim = 'idle'; B.units = [k].concat(B.units.filter(function (u) { return u !== k; })); D.grid.setup(B.map, B.units); B.cache = null; In.trail('the barn: the child lifted to her hip'); yield 12; // (up in her arms: drawn BEHIND her and raised, the head and shoulders over Gennet's -- 11-12, Griz: "Can probably just attach girl sprite to Gennet sprite with head/shoulders appearing over gennet")
      },
      carry: function* () {
        var g = Y.gennet, k = Y.child; if (!onFloor(g) || !onFloor(k)) return;
        if (!k.lift) yield* acts.lift();
        In.trail('the barn: she carries the child in');
        yield* In.walk(B, g, dest(), null, k); gone(k, 'door'); Y.child = null; gone(g, 'door'); Y.gennet = null;
      },
      pair: function* () {
        var g = Y.gennet, k = Y.child; if (!onFloor(g) || !onFloor(k)) return;
        if (!near(g, k)) { var q = In.beside(B, g, k); yield* In.walk(B, g, q); }
        var p = D.Battle.route(k, dest(), false) || [];
        while (p.length) { var nx = p.shift(), was = [k.x, k.y]; In.hop(B, k, nx); In.hop(B, g, was); D.grid.setup(B.map, B.units); yield In.PACE; } // (the child a step ahead, Gennet on the square she just left)
        var d0 = [k.x, k.y]; gone(k, 'door'); Y.child = null; In.hop(B, g, d0); D.grid.setup(B.map, B.units); yield In.PACE; gone(g, 'door'); Y.gennet = null;
      },
      between: function* (e) {
        var g = Y.gennet, k = Y.child, h = e && e.u; if (!onFloor(g) || !onFloor(k) || !h) return;
        var gq = [g.x, g.y], back = [g.x + Math.sign(g.x - k.x), g.y + Math.sign(g.y - k.y)]; if (!D.grid.canStand(g, back[0], back[1])) return;
        if (!onFloor(h)) { var t = R0.token, q = In.beside(B, h, t); h.x = q[0]; h.y = q[1]; h.tween = null; h.anim = 'idle'; h.animT = B.t; B.units.push(h); Y.stood = h; D.grid.setup(B.map, B.units); B.cache = null; } // (one who walks inside the token steps out of it: js/roam.js R.riding)
        In.hop(B, g, back); g.facing = D.spr.facingFor(k.x - back[0], k.y - back[1]); D.grid.setup(B.map, B.units); yield In.PACE; g.anim = 'idle'; g.animT = B.t; // (she gives a square, still facing the child)
        yield* In.walk(B, h, gq, [back[0] - gq[0], back[1] - gq[1]]); BY.stoodAt = [h.x, h.y];
      }
    };
    Y.q = []; Y.go = function (k, e) { [].concat(k).forEach(function (id) { if (acts[id]) Y.q.push({ g: acts[id](e), w: 0 }); }); };
    var bg = function () { var j = Y.q[0]; if (!j) return; if (j.w > 0) { j.w--; return; } var r = j.g.next(); if (r.done) { Y.q.shift(); return; } j.w = Math.max(0, (r.value | 0) - 1); };
    var settle = function* () { for (var n = 0; Y.q.length && n < 6000; n++) { var j = Y.q[0]; if (j.w > 0) { var w0 = j.w; j.w = 0; yield w0; continue; } var r = j.g.next(); if (r.done) Y.q.shift(); else yield r.value; } }; // (on the floor's own frames again: each walk's own waits, as In.walk yields them)
    var tick = function () { B.t++; B.units.forEach(function (u) { if (u.tween) { u.tween.t++; if (u.tween.t >= u.tween.dur) delete u.tween; } }); bg(); }; // (the floor's frame does not run under a screen: the screen's own frame steps the figures' walks and the queue -- js/counter.js o.tick)
    var talk = function* (only) { var sc = new C.Counter(B, { id: 'barnyard', name: In.named(f), place: 'The Halfway Inn', what: 'the yard, by the barn', room: true, open: true, bg: In.roomShot(B), tick: tick, script: function (s) { return In.barnTalk(s, B, Y, four, only); } }); D.push(sc); while (!sc.done) yield 1; };
    var walks = {
      purseSelf: function* () { yield* In.walk(B, Y.gennet, P.doorBy); yield 24; yield* In.walk(B, Y.gennet, P.gennet, [-1, -1]); },
      purseEls: function* () { if (!Y.elsbeth) return; yield* In.walk(B, Y.elsbeth, P.purse); yield 24; yield* In.walk(B, Y.elsbeth, P.door, [-1, -1]); },
      doran: function* () { if (!Y.doran && Y.night) Y.doran = In.unit(B, { id: 'doranYard2', kind: 'commoner', at: In.DOORS.front.slice(), name: 'Doran Waterby', face: [-1, -1] }); if (Y.doran) yield* In.walk(B, Y.doran, P.doran, [-1, -1]); }, // (stood in the doorway as he comes out of it, after dark)
      elsbethOut: function* () { if (Y.elsbeth) yield* In.walk(B, Y.elsbeth, P.out, [-1, -1]); }
    };
    R0.barnEnd = null;
    for (var g = 0; g < 8 && !R0.barnEnd; g++) { yield* talk(null); yield* settle(); var w = Y.S && Y.S.pending; if (!w) break; Y.S.pending = null; if (walks[w]) yield* walks[w](); }
    yield* settle();
    var E = R0.barnEnd || { end: 'e' }, st = C.state(B), reg = f.innRegard == null ? 1 : f.innRegard;
    var hand = function () { In.lay(B, null, true); }; // (the yard back to the inn's lay: nothing of the scene's is left on it to remove)
    var withParty = function () { f.barnFreed = 1; In.setOffering(f, c, 'none'); f.childGuest = f.glamourBroken ? 'child' : 'goblin'; f.childGuestDay = In.day(Rm.q); In.childTaken(f, f.childGuestDay); }; // (the due has no offering; the child counted with the party from this day -- the road with her is not built: BY.seam)
    // the close of the ends she leaves with the party: the hero who stepped out of the token walks back to it; then HER NAME, asked on portraits where they stand by the
    // barn's door (11-12; Griz: "line 'child is asked her name' use char player used as party voice most often during encounter or vivian and do that bit in portraits by
    // the door (line says 'at the road)") -- BY.nameAsk; then the seam's line
    var close = function* () {
      if (Y.stood && onFloor(Y.stood)) { var t = R0.token, q = In.beside(B, Y.stood, t); yield* In.walk(B, Y.stood, q); B.units = B.units.filter(function (u) { return u !== Y.stood; }); D.grid.setup(B.map, B.units); B.cache = null; Y.stood = null; }
      if (Y.S.seen) { yield* talk(function (S) { BY.nameAsk(S, four); }); if (R0.follower) R0.follower.name = 'Nell'; } // (the name is the seat's, his to give: the lane's call 9)
      yield* In.card(B, [BY.seam], 420); hand();
    };
    f.barnEnd = E.end;
    if (E.end === 'a' || E.end === 'b') { // (she keeps the child: back on the chain while it looks a goblin; in the open, the raising feigned, once it is seen through -- ruling 30)
      delete f.barnFreed; if (E.seen) { In.setOffering(f, c, 'kept'); f.kidAtInn = 1; f.barnC = null; } else { In.setOffering(f, c, 'goblin'); f.barnLet = 1; }
      if (E.end === 'a') f.innRegard = Math.min(2, reg + 1);
      else { st.silver(BY.silver[E.big ? 1 : 0]); D.sfx('coin'); f.barnBribe = E.big ? 2 : 1; f.innFree = E.big ? 99 : 2; if (E.big) f.bigRoom = 1; f.elsbethSilent = 1; f.innRegard = 2; }
      if (onFloor(Y.child)) yield* (E.end === 'a' ? acts.carry() : acts.pair()); // (walked under its own words already, as a rule: the carry, or the two together)
      yield* elsIn(); if (Y.doran && Y.doran.npc !== 'doranYard') yield* doranOff(); // (Doran was never called: by day he has not left the woodpile)
      hand(); return;
    }
    if (E.end === 'c') { // (blows: to the first yield -- Doran the Thug yields at half, ruling 18; Gennet beside him)
      var gAt = [Y.gennet.x, Y.gennet.y], dAt = Y.doran ? [Y.doran.x, Y.doran.y] : P.doran.slice();
      var run = B.units.filter(function (u) { return u.npc === 'snootRunner'; })[0]; if (run) { yield* In.walk(B, run, [1, run.y]); gone(run, 'road'); } // (ruling 38: the moot's runner is no part of this -- he is off down the road before a blow lands)
      gone(Y.gennet, 'swap'); if (Y.doran) { if (Y.doran === dy) dy = null; gone(Y.doran, 'swap'); } // (the two as foes now, each on its own square)
      yield* acts.kidWall(); // (the child up against the barn wall, as the words say: 11-11, Griz: "combat says the child goes up against the wall - should happen")
      yield* acts.elsDoor(); // (into the doorway, the wand out; Orrin and Pell inside behind her -- ruling 37)
      B.units.filter(function (u) { return u.npc === 'orrin' || u.npc === 'pell'; }).forEach(function (u, k) { var q = P.boys[k % P.boys.length]; u.x = q[0]; u.y = q[1]; u.tween = null; }); // (called in from the shore: they stand by the lake, far off the yard's screen, and under the house's roof from here)
      var G = In.unit(B, { id: 'gennetBarn', kind: 'gennet', at: gAt, name: In.named(f), face: [-1, -1], foe: true }), Dn = In.unit(B, { id: 'doranBarn', kind: 'doran', at: dAt, name: 'Doran Waterby', face: [-1, -1], foe: true });
      G.yields = true; G.flees = false; Dn.yields = true; Dn.flees = false; Y.gennet = null; Y.doran = null;
      f.barnFight = 1; R0.fights++; R0.lastOutcome = null; try { D.music('boss'); } catch (e0) { }
      var seat = function (B2) { // (the four as they fall out of the token: off the child's wall, between her and the Waterbys -- "alter the party formation that falls out of the token")
        var Gd = D.grid, fr = [B2.roam.token].concat(B2.roam.rest || []).filter(function (u) { return u && u.src && !u.src.guest && B2.units.indexOf(u) >= 0; }).slice(0, 4);
        fr.forEach(function (u, k) { var q = P.form[k]; if (!q) return; u.x = q[0]; u.y = q[1]; u.tween = null; u.facing = D.spr.facingFor(1, 1); u.animT = B2.t; }); Gd.setup(Gd.map, B2.units); B2.cache = null; if (BY.spy) BY.spy(B2);
      };
      D.grid.setup(B.map, B.units); B.cache = null;
      yield* Rm.engage(B, { foes: [G, Dn], why: 'barn', zone: null, onSpill: seat }, false, 'barn');
      if (/^(lost|lose|dead|ko)$/.test(String(R0.lastOutcome)) || (A && A.wiped(B))) return;
      var up = function (u) { return B.units.indexOf(u) >= 0 && u.hp > 0 && !u.dead; }, dUp = up(Dn), gUp = up(G);
      if (!gUp) f.gennetDead = 1; if (!dUp) f.doranDead = 1;
      // the yield: nobody is pulled off the yard -- the two stand where the fight left them (each foe's figure swapped for its own on the same square), what is said is
      // said on portraits, and then each walks off (11-11, Griz: "surrender shouldn't pull all but the party token off the screen - doran's post yield talk should be with portraits")
      var gq = [G.x, G.y], dq = [Dn.x, Dn.y]; [G, Dn].forEach(function (u) { gone(u, 'swap'); });
      if (gUp) Y.gennet = In.unit(B, { id: 'gennetYard', kind: 'commonerwoman', at: gq, name: In.named(f), face: [-1, -1] });
      if (dUp) Y.doran = In.unit(B, { id: 'doranYard2', kind: 'commoner', at: dq, name: 'Doran Waterby', face: [-1, -1] });
      withParty(); f.innRegard = 0; f.innShut = 1;
      var after = function (S) { // (what each then does, said as it does it)
        if (gUp) S.look('gennet', `Gennet goes back across the yard and in at the house door.` + (Y.elsbeth ? ` Elsbeth lets her by, and goes in after her.` : ``), null, ['gennetIn', 'elsIn']);
        else if (Y.elsbeth && dUp) S.look('elsbeth', `Elsbeth goes back inside.`, null, 'elsIn');
        if (dUp) S.look('doranIn', byDay ? `Doran picks the axe up by its head and carries it back to the woodpile.` : `Doran picks the axe up by its head and goes in.`, null, 'doranOff');
        S.look('child', (S.seen ? `The child` : `The goblin`) + ` comes away from the wall and takes ` + S.holder + `'s hand again.`, null, 'join');
      };
      if (dUp) { f.doranConfessed = 1; yield* talk(function (S) { S.look('doranIn', `Doran lowers the axe.`, gUp ? 'gennet' : null); BY.confession(S); after(S); }); }
      else if (gUp) yield* talk(function (S) { S.look('gennet', `Gennet sits down in the dirt of the yard.`); S.by('gennet', `"It gave back. It always gave back."`); after(S); });
      else { f.elsbethGone = 1; yield* talk(function (S) { S.look('elsbeth', `Elsbeth says the word from the doorway, and goes in. She will be out the back with the boys before anyone reaches the door, and down the road to the Pit.`, null, 'elsIn'); after(S); }); } // (rulings 17 and 20: out of the game)
      yield* settle();
      if (gUp) { yield* out(Y.gennet, HOUSE); Y.gennet = null; }
      yield* elsIn(); yield* doranOff(); yield* join();
      yield* close(); return;
    }
    // D and E: the child goes with the party; the Waterbys go where the last words sent them
    withParty();
    if (E.end === 'd') { f.doranConfessed = 1; f.innRegard = 0; if (A) A.trail('Doran confesses in the yard: the thing in the lake'); }
    else { f.innRegard = 0; if (E.drew && !E.doran) f.innShut = 1; }
    yield* out(Y.gennet, HOUSE); Y.gennet = null; yield* elsIn(); yield* doranOff(); yield* join();
    yield* close();
  };
  // A FOLLOWER BESIDE THE TOKEN (11-11 night, the supper seat; Griz: "let's not have the kid join the party token, constant reminder they're on an escort mission now"): the
  // roam had nothing that trails the token on a floor, so this is the smallest honest one, for the inn's map -- B.roam.follower, a figure of its own that takes the square
  // the token just left at every step (D.roam.step), is no obstacle to the party (D.grid.occupant: the party's own may walk onto her square, and she swaps behind), and
  // stands by the token again after the floor sets it somewhere (In.stage). She is on this floor till the party leaves it: the road with her is not built
  In.beside = function (B, u, t) { var G = D.grid, ds = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]; for (var i = 0; i < ds.length; i++) { var q = [t.x + ds[i][0], t.y + ds[i][1]]; if ((u.x === q[0] && u.y === q[1]) || G.canStand(u, q[0], q[1])) return q; } return [t.x, t.y]; };
  In.follow = function (B) { if (In.layFollower && B.roam && (!B.roam.follower || B.units.indexOf(B.roam.follower) < 0)) In.layFollower(B); var fo = B.roam && B.roam.follower, t = B.roam && B.roam.token; if (!fo || !t || B.units.indexOf(fo) < 0) return; if (Math.max(Math.abs(fo.x - t.x), Math.abs(fo.y - t.y)) <= 1 && !(fo.x === t.x && fo.y === t.y)) return; var q = In.beside(B, fo, t); fo.x = q[0]; fo.y = q[1]; fo.tween = null; D.grid.setup(B.map, B.units); B.cache = null; };
  (function () {
    var Rm = D.roam, G = D.grid, step0 = Rm.step, occ0 = G.occupant, stage0 = In.stage, people0 = T.people;
    // LAID FROM THE FLAG (11-11 late, the supper seat; ruling 42, Griz: "let's not have the kid join the party token, constant reminder they're on an escort mission now"):
    // she was a figure only on the floor the scene ran on, so a load, the stair, or any floor built anew lost her while f.childGuest stayed set. Now wherever one of the
    // inn's floors (the yard and house, upstairs) stands its people -- js/town.js T.people, the one place a floor is laid or laid again -- she is stood beside the token
    // from the flag; and the first step on a floor that had no token yet at its laying stands her too. Never twice: one already on the floor is kept
    In.layFollower = function (B) {
      var R0 = B && B.roam, def = Rm.def, f = R0 && R0.flags, t = R0 && R0.token; if (!f || !f.childGuest || !t || !def) return null; // (ruling 59, 11-12: on every floor the party walks, not the inn's two alone -- "her figure on floors and in camps, one marker on the map")
      var have = B.units.filter(function (u) { return u.follower || u.scripted === 'barnKid'; });
      if (have.length && have[0].follower && have[0].bystander && have[0].hp <= 0) { /* (hit points gone: a scene's own swap of her figure is not a death) */ In.gone(B, have[0]); R0.follower = null; In.childLost(f, function (l) { B.card(D.roam.wrap([l]), 420); }); return null; } // (killed in a fight on this floor: the errand is over -- In.childLost)
      if (have.length) { if (have[0].follower) R0.follower = have[0]; return have[0]; } // (the scene's own child, or the follower already stood)
      var u = In.unit(B, { id: 'barnKid', kind: f.glamourBroken ? In.keptKind() : 'glamourgoblin', at: [t.x, t.y], name: f.glamourBroken ? 'Nell' : 'The goblin', face: [0, 1] }), q = In.beside(B, u, t);
      u.x = q[0]; u.y = q[1]; u.tween = null; u.follower = true; u.bystander = true; u.noArea = true; /* (THE DESK'S CALL, 11-13, on Griz's "give it your desk call on the two with no lean :)": one rule for her and the gulch's children -- nobody's target AND left out of every area, js/grid.js G.inArea's `noArea`; his reason for them, "making them viable targets isn't worth the effort and scripting", fits her the same. It replaces 11-12's "an area can still kill her"; her death ending the errand stays in the code for anything that ever does kill her) */ R0.follower = u; G.setup(B.map, B.units); B.cache = null; return u; // (bystander: nobody's target in a fight, RULED 11-12 -- an area still catches her)
    };
    T.people = function (B) { var r = people0.apply(this, arguments); In.layFollower(B); return r; };
    Rm.step = function* (B, u, to) {
      if (B.roam && u === B.roam.token && (!B.roam.follower || B.units.indexOf(B.roam.follower) < 0 || B.roam.follower.hp <= 0)) In.layFollower(B); // (hp gone: her death is found at the party's next step -- In.childLost)
      var fo = B.roam && u === B.roam.token ? B.roam.follower : null; if (fo && (B.units.indexOf(fo) < 0 || fo.dead)) fo = null;
      if (fo) { var fx = u.x, fy = u.y; if (!(fo.x === fx && fo.y === fy)) { fo.tween = { fx: fo.x, fy: fo.y, fz: G.gzAt(fo, fo.x, fo.y), t: 0, dur: In.PACE, mode: null }; fo.facing = D.spr.facingFor(fx - fo.x, fy - fo.y); if (fo.anim !== 'walk') { fo.anim = 'walk'; fo.animT = B.t; } fo.x = fx; fo.y = fy; } }
      yield* step0.call(this, B, u, to);
      if (fo) { fo.anim = 'idle'; fo.animT = B.t; G.setup(B.map, B.units); B.cache = null; }
    };
    G.occupant = function (x, y, except, o) { var r = occ0.apply(this, arguments); return r && r.follower && except && except.side === 'party' && !except.follower ? null : r; };
    In.stage = function (B, at, inside) { var r = stage0.apply(this, arguments); In.follow(B); return r; };
  })();
  // ---------------------------------------------------------------- THE CHILD'S ROAD (RULED 11-12, ruling 59, Griz on the reading page's five leans: "go with the leans, we'll
  // deal with calendar issues down the road"; the Pit house's one name, to the lanes desk: "greyfang can be the associated name"). The leans, as the page had them: "The same
  // house that took Doran's seven; one name, yours to give"; the first camp, "her asking for water in a girl's voice breaks the glamour for a party that had not seen through
  // it"; "Floors and camps. One marker on the map"; "The nights until the due; late costs only the night itself, the lake unfed as it is built"; "(a) the days are counted to
  // the NEXT due, a month on, and this one passes unfed".
  // BUILT: the count (In.childTaken, above: to the next due, this one not struck off -- the seat's call); her figure on every floor (In.layFollower) and by the fire in a camp's fight on the grid (In.campKid) -- THE WORLD shows the
  // party's one marker; THE FIRST CAMP with her, before its watches (In.childCamp: a counter screen over THE WORLD on her face); and THE PIT -- its map is not built, so the
  // hand-off is a scene at its hex on THE WORLD (In.childPit): the house back of GreyFang's fighting pit, his by association (the realm's wiki/greyfang.md: he "runs the
  // fighting pit dug into the ground at the bunker-converted building"), kept by a woman at its door -- he is not at the door in any line, the Snoot's days being his own
  // trouble (wiki/the-snoot.md: "GreyFang is the walking jackpot"). The seat's words throughout, drafts for his overrule: invented.json halfway-childs-road-1112
  In.ROAD = {
    campGoblin: ['The fire is lit. The goblin has not let go of the nearest hand since the yard, and has eaten nothing that somebody else did not eat first.'],
    campAsk: '"Water. Please."',
    campBreak: ['A girl\'s voice. Not a goblin\'s.', 'The glamour comes off her with the words, and a child sits by the fire in a dress too big for her, holding the cup in both hands.'],
    campChild: ['The fire is lit. The girl has not let go of the nearest hand since the yard, and has eaten nothing that somebody else did not eat first.'],
    campAfter: ['She drinks. She counts the party, lips moving, and then she sleeps.'],
    pitRoad: ['Tarlyn\'s Pit. The watch on the road looks at the child before it looks at the party.', '"That one goes to GreyFang\'s house. Back of the fighting pit. The door with the wolf\'s head chalked on it."'],
    pitDoor: ['A woman opens the chalked door with a ladle in her hand, and small faces crowd the passage behind her.'],
    pitSeven: '"Seven came down from the Waterbys\' on a wagon. That\'s eight, then."', pitOne: '"From the Halfway road? There\'s a bed."',
    pitGoblin: ['"That\'s no goblin. Who told you that was a goblin?" She says it to the child, not to the party, and the child answers her in a girl\'s voice.', 'The glamour comes off her with the words: a girl in a dress too big for her.'],
    pitLeave: ['The girl counts the party once more, lips moving, and lets go of the hand.', '"She\'s under GreyFang\'s name now. Nobody takes a child out of this house that he hasn\'t looked at first."'],
    pitSaid: 'The child is at GreyFang\'s house at the Pit',
    doranBack: function (f) { return ['Doran lets the axe hang.', '"She\'s at GreyFang\'s house? Good. Nobody takes one out of there." He looks at the lake. "Be here ' + In.CHILD.nights(f) + '."']; }
  };
  In.roadFlags = function () { return W.house && W.house() && D.house.cur ? (D.house.cur.flags = D.house.cur.flags || {}) : In.testRoadFlags || null; };
  In.atPit = function () { var S = W.state && W.state(), Mp = W.M && W.M(); return !!(S && Mp && ((Mp.siteAt || {})[W.K(S.at[0], S.at[1])] || []).some(function (s) { return s.id === 'pit'; })); };
  In.roadTalk = function (scene, o, then) { // (a counter screen over THE WORLD, and what follows once it is down: the world's own next frame -- js/wagon.js Wg.then)
    var C = D.counter, sc = new C.Counter(null, o); D.push(sc); In.roadSc = sc;
    if (scene) scene.pend = function () { In.roadSc = null; if (then) then(); };
    return sc;
  };
  // THE FIRST CAMP: before the watches are stood. A party that had not seen through it hears a girl ask for water, and the glamour is broken from there (f.glamourBroken,
  // the name of her kind on f.childGuest); one that had, the same asking and no more. Once (f.childCamp)
  In.childCamp = function (scene, then) {
    var f = In.roadFlags(), R = In.ROAD, seen = !!f.glamourBroken;
    f.childCamp = 1; if (D.house && D.house.trail) D.house.trail('talk', 'the first camp with the child: she asks for water' + (seen ? '' : ' in a girl\'s voice, and the glamour breaks'));
    return In.roadTalk(scene, { id: 'childRoad', name: seen ? 'The girl' : 'The goblin', place: 'The camp', what: 'the first night on the road with her',
      script: function (sc) { return (function* () {
        yield sc.narr(seen ? R.campChild : R.campGoblin);
        yield sc.say([R.campAsk], 'afraid');
        if (!seen) { f.glamourBroken = 1; f.glamourSeen = 1; f.childGuest = 'child'; sc.sheet = In.childFace(true) || sc.sheet; sc.o.name = 'The girl'; sc.setFace('lookingup'); D.sfx('magic'); yield sc.narr(R.campBreak); }
        yield sc.narr(R.campAfter);
        if (W.save) W.save();
      })(); } }, then);
  };
  if (D.counter && D.counter.SHEETOF) D.counter.SHEETOF.childRoad = function (st) { return In.childFace(!!(st && st.flags && st.flags.glamourBroken)); };
  // THE PIT: the party on its hex with her. The watch's word, the chalked door, the woman's count (the seven, where Doran drove them down -- f.doranPit), the glamour off her
  // at the door if no camp took it, and she is set down: f.childGuest gone, f.childAtPit the day
  In.childPit = function (scene) {
    var f = In.roadFlags(), R = In.ROAD; if (!f || !f.childGuest) return null;
    if (scene) { scene.walk = null; scene.plan = null; }
    return In.roadTalk(scene, { id: 'pitHouse', name: 'GreyFang\'s house', place: 'Tarlyn\'s Pit', what: 'the door back of the fighting pit',
      script: function (sc) { return (function* () {
        // A STAND-IN FACE (RULED 11-12, Griz, on the door having no face: "5 - quick and dirty for now"; and on the house, "lowest usage cost stand-in to keep the realm-story
        // game playable"): from what the game has, no art asked -- the unnamed man in the guard's costume for the watch on the road, the unnamed woman in the barkeep's for
        // the one at the chalked door (js/counter.js C.GENERIC's sheets, pt_genman and pt_genwoman)
        var face = function (who, look, name) { var k = 'pt_gen' + who; if (D.SHEETS && D.SHEETS[k]) { sc.sheet = k; sc.look = look; } sc.o.name = name; };
        face('man', 'guard', 'The watch on the road');
        yield sc.narr(R.pitRoad);
        face('woman', 'barkeep', "GreyFang's house");
        yield sc.say(R.pitDoor.concat([f.doranPit ? R.pitSeven : R.pitOne]));
        if (!f.glamourBroken) { f.glamourBroken = 1; f.glamourSeen = 1; D.sfx('magic'); yield sc.say(R.pitGoblin); }
        yield sc.say(R.pitLeave);
        delete f.childGuest; f.childAtPit = In.day(null); f.childCamp = 1;
        if (!f.childReward) { // (RULED 11-12: "add 250 xp and magic item reward (seat's choice from SRD) to the successful delivery of the child to the house")
          f.childReward = 1; var RW = In.ROAD.REWARD, Hs2 = D.house, st2 = D.counter.state(null), alive = Hs2 && Hs2.cur ? Hs2.cur.party.filter(function (h) { return !h.dead && h.hp > 0; }) : [], nm = (DS.DATA.items[RW.item] || {}).name || RW.item;
          D.counter.give(st2, RW.item, 1); var bk = Hs2 && Hs2.bank ? Hs2.bank(RW.xp * alive.length, alive, 0) : { each: 0 }; D.sfx('chest');
          if (Hs2 && Hs2.trail) Hs2.trail('check', 'the child delivered: ' + nm + ', ' + bk.each + ' XP each');
          yield sc.say([R.reward, D.counter.L('g.got', { item: nm }), '{g}Each one standing gains ' + bk.each + ' XP.{/}']);
        }
        if (D.house && D.house.trail) D.house.trail('talk', 'the child set down at GreyFang\'s house at the Pit, day ' + f.childAtPit);
      })(); } }, function () { if (W.save) W.save(); if (scene && scene.say) scene.say(R.pitSaid + ', ' + W.timeOfDay() + '.'); });
  };
  // BY THE FIRE in a camp's fight on the grid: her figure a square behind the fire, nobody's target (a `look`, as the floor's figures are)
  In.campKid = function (b) {
    var f = In.roadFlags(), cp = b && b.fight && b.fight.camp; if (!f || !f.childGuest || !cp || !b.units || b.o.simple || b.units.some(function (u) { return u.scripted === 'campKid'; })) return null;
    var G = D.grid, spots = [[0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]].map(function (o) { return [cp[0] + o[0], cp[1] + o[1]]; });
    var u = In.unit(b, { id: 'campKid', kind: f.glamourBroken ? In.keptKind() : 'glamourgoblin', at: [cp[0], cp[1]], name: f.glamourBroken ? 'The girl' : 'The goblin', face: [-1, 0] });
    var q = spots.filter(function (q0) { return G.canStand(u, q0[0], q0[1]) && !b.units.some(function (w) { return w !== u && w.x === q0[0] && w.y === q0[1]; }); })[0];
    if (!q) { In.gone(b, u); return null; }
    u.x = q[0]; u.y = q[1]; u.bystander = true; u.noArea = true; G.setup(b.map, b.units); b.cache = null; In.campKidU = u; return u; // (noArea: no area catches her by the fire either -- the desk's call, 11-13, In.layFollower)
  };
  // THE CHILD IN A FIGHT (RULED 11-12, Griz, on "what happens in fights wrt to her? game over if she dies built in?" and the seat's lean: "1 - lean, add 250 xp and magic
  // item reward (seat's choice from SRD) to the successful delivery of the child to the house"): she is NOBODY'S TARGET anywhere (a bystander on a floor as by a camp's
  // fire: js/ai.js heroes); AN AREA CAN STILL KILL HER; and HER DEATH ENDS THE ERRAND, NOT THE GAME -- f.childGuest gone, f.childDead the day, one line where it is
  // found (the floor's next step, the world's next arrival or camp), and Doran's one line for it at the woodpile. THE REWARD, set down alive at GreyFang's house: 250
  // XP each to those standing (the seat's reading of "250 xp": a quest's, not a kill's share) and the Boots of Elvenkind (SRD 5.1, uncommon, no attunement; the game's
  // bootselvenkind) -- the seat's choice: the house that moves children quietly gives quiet feet; it is in the game already, so no new rule rides on the gift
  In.ROAD.dead = 'The child is dead. There is no errand to the Pit now.';
  In.ROAD.doranDead = ['Doran reads it off the party before anyone speaks. He sets the axe head down on the block.', '"Then it was for nothing. Twice over."'];
  In.ROAD.reward = '"GreyFang pays what the house owes. These were a runner\'s. They don\'t make a sound."';
  In.ROAD.REWARD = { xp: 250, item: 'bootselvenkind' };
  In.childLost = function (f, say) { if (!f || !f.childGuest) return false; delete f.childGuest; f.childDead = In.day(null); In.campKidU = null; if (D.house && D.house.trail) D.house.trail('check', 'the child killed: the errand to the Pit is over'); if (say) say(In.ROAD.dead); return true; };
  In.campKidCheck = function (scene) { var u = In.campKidU, f = In.roadFlags(); if (!u) return false; In.campKidU = null; if (f && f.childGuest && (u.dead || u.hp <= 0)) return In.childLost(f, function (l) { if (scene && scene.card) scene.card(D.roam ? D.roam.wrap([l]) : [l]); else if (scene && scene.say) scene.say(l); }); return false; };
  (function () {
    var Hs = D.house, WP = W.World && W.World.prototype; if (!Hs || !WP) return;
    var runNight0 = Hs.runNight, arrive0 = WP.arrive, here0 = WP.here, fight0 = WP.fight;
    Hs.runNight = function (scene, asg) {
      In.campKidCheck(scene); var f = In.roadFlags(), self = this;
      if (!f || !f.childGuest || f.childCamp || !D.counter || !scene) return runNight0.apply(this, arguments);
      In.childCamp(scene, function () { runNight0.call(self, scene, asg); });
    };
    WP.arrive = function (st) {
      var r = arrive0.apply(this, arguments), f = In.roadFlags(); In.campKidCheck(this);
      if (f && f.childGuest && D.top() === this && !this.cards.length && In.atPit()) In.childPit(this);
      return r;
    };
    WP.here = function () { var f = In.roadFlags(); if (f && f.childGuest && In.atPit()) { In.childPit(this); return; } return here0.apply(this, arguments); };
    WP.fight = function (p, e, o) { var r = fight0.apply(this, arguments), b = D.top(); if (b && b !== this && b.fight && b.fight.camp) { try { In.campKid(b); } catch (eK) { /* (a figure must never stop a fight) */ } } return r; };
  })();
  // A PLAYED NIGHT KEPT IN THE SAVE (11-12, the inn seat: the lane's known gap -- "the kept-child night and the watch upstairs are carried between floors in memory (In.duePlay,
  // In.watching), not in the save: a save and load mid-night loses the rest of that night"). The two are mirrored into the house's flags as they stand (f.nightCarry: the
  // stage, the day, the offering or the watcher, the room's stay -- plain values), at every floor's laying and every step; gone from the flags when both are done. On the
  // FIRST floor laid after a game is begun or loaded, with neither in memory and one in the flags, it is taken up again: the floor's own script finds it as it would have
  // (the wake in the big room said again, the watches picked again -- the night resumes from its stage, not from its line). In.bedding, a plain night's sleep, is not kept:
  // loaded upstairs before the morning, the party is in its room and takes the night again from the inn lady
  In.carrySync = function (B) {
    var f = B && B.roam && B.roam.flags; if (!f) return;
    var dp = In.duePlay, wt = In.watching, c = dp ? { due: { stage: dp.stage, d: dp.d, off: dp.off, woke: !!dp.woke, asleep: !!dp.asleep, stay: dp.stay || null } } : wt ? { watch: { stage: wt.stage, d: wt.d, watcher: wt.watcher || null, lead0: wt.lead0 || null, stay: wt.stay || null } } : null;
    if (c) f.nightCarry = c; else if (f.nightCarry) delete f.nightCarry;
  };
  In.carryBack = function (B) {
    var f = B && B.roam && B.roam.flags, c = f && f.nightCarry; if (!c || In.duePlay || In.watching) return false;
    if (c.due) { In.duePlay = JSON.parse(JSON.stringify(c.due)); In.duePlay.resumed = true; /* (taken up from a save: the big room's script starts the singing again -- js/secondact.js) */ } else if (c.watch) In.watching = JSON.parse(JSON.stringify(c.watch)); else return false;
    if (D.house && D.house.trail) D.house.trail('check', 'a played night taken up again from the save: ' + (c.due ? 'the due, ' + c.due.stage : 'the watch, ' + c.watch.stage));
    return true;
  };
  (function () {
    var Hs = D.house, people1 = T.people, arrive1 = D.roam.arrive;
    if (Hs && Hs.begin) { var begin0 = Hs.begin; Hs.begin = function () { In.carryFresh = true; return begin0.apply(this, arguments); }; }
    T.people = function (B) { var r = people1.apply(this, arguments); if (In.carryFresh) { In.carryFresh = false; In.carryBack(B); } In.carrySync(B); return r; };
    D.roam.arrive = function* (B) { var ev = yield* arrive1.apply(this, arguments); In.carrySync(B); return ev; };
  })();
  In.toSnoot = function () { In.left = '../snoot-mode/?from=inn'; if (!In.stay) window.location.href = In.left; }; // (In.stay: a bench's, the page kept)
  var fire0 = T.fire;
  T.fire = function* (B, trig, at) {
    var def = D.roam.def;
    if (def && def.key === In.KEY && trig.town === 'talk' && trig.npc === 'elsbeth') { // (the kitchen: her tiers, and the wand's walk out -- js/secondact.js A.wand)
      yield* M.talk(B, 'elsbeth', function (sc) { return M.SCENES.elsbeth(sc, B); });
      if (In.wandWalk) { In.wandWalk = false; yield* D.roam.walkTo(B, [25, 20]); B.card(D.roam.wrap([D.secondact.LINES.wandDone]), 360); yield 40; }
      return;
    }
    if (def && def.key === In.KEY && trig.town === 'talk' && trig.npc === 'doranYard') { yield* M.talk(B, 'doranYard', function (sc) { return In.doranYard(sc, B); }, 'Doran Waterby'); return; } // (a click on him at the woodpile: his face and a line -- 11-12)
    if (def && def.key === In.KEY && trig.town === 'talk' && trig.npc === 'doranIn' && (B.roam.flags.dueStopped || B.roam.flags.gennetDead)) { // (Doran sells the rooms after the second act's ends: js/secondact.js)
      var sleptD = yield* M.talk(B, 'doranIn', function (sc) { return In.doranRoom(sc, B); }, 'Doran Waterby');
      if (sleptD) yield* In.night(B);
      return;
    }
    if (def && def.key === In.KEY && trig.town === 'talk' && trig.npc === 'barnGoblin') { // (the one handed over, in the barn's end stall: found and revealed there -- In.barnScene, 11-05)
      yield* M.talk(B, 'barnGoblin', function (sc) { return In.barnScene(sc, B); }, B.roam.flags.glamourBroken ? 'A child, chained' : 'A goblin, chained');
      if (B.roam.flags.barnFreed) In.lay(B, In.inside, true);
      if (B.roam.flags.barnFreed && B.roam.flags.barnTalkC !== In.cycle(In.day(D.roam.q))) { B.roam.flags.barnTalkC = In.cycle(In.day(D.roam.q)); yield* In.barnYard(B); } // (out of the barn with the child: Gennet comes running -- 11-11)
      return;
    }
    if (def && def.key === In.KEY && trig.town === 'talk' && trig.npc === 'katarina') { // (her talk at the fire: In.katScene -- she looks up at whoever speaks, still sat, as js/town.js T.fire turns a figure drawn all round)
      var ku = B.units.filter(function (u) { return u.npc === 'katarina'; })[0], tk = B.roam && B.roam.token; if (ku && tk && !ku.holdFacing) ku.facing = D.spr.facingFor(tk.x - ku.x, tk.y - ku.y);
      if (!In.katOpen(B.roam.flags, In.day(D.roam.q), D.counter.state(B))) { yield* In.katVisit(B); return; } // (before the ink: one thing a visit, on the flip -- ruling 57)
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
    else if (s === 'inn:rowboat') { if (D.secondact && D.secondact.sound) yield* D.secondact.sound(B); return; } // (the rowboat: LEAVE IT, or sound the deep -- the chuul by day, 11-05)
    else if (s === 'inn:stair' && f.invest && In.investOf(B)) { yield* In.investGo(B, 'up the stair'); return; } // (INVESTIGATE's wait: back up the stair, the night runs on as watched)
    else if (s === 'inn:stair') { yield* M.go(B, In.UP, [In.UPSTAIR[0], In.UPSTAIR[1] - 1], [0, -1]); return; } // (up to the guest rooms, a step off the stair head)
    else if (s === 'inn:down') { yield* M.go(B, In.KEY, [In.STAIR[0], In.STAIR[1] - 1], [0, -1]); return; } // (down by the bar, a step off the stair's foot into the room: the house laid open, js/inn.js In.qInside)
    else if (s === 'inn:drawer') {
      if (In.bookInDrawer(f, In.day(D.roam.q), st)) { f.katBookTaken = 1; f.katLetter = 1; D.counter.give(st, 'katbook', 1); D.sfx('chest');
        yield* M.talk(B, 'katarina', function (sc) { return (function* () { yield sc.say(In.KL.letter); })(); }, 'Katarina'); // (HER LETTER, as if she were saying it -- ruling 28; not an item)
        say = [L('inn.drawerBook'), L('g.got', { item: DS.DATA.items.katbook.name })]; } // (she rode out with the wagon: the book left in the drawer -- the lane's item 10)
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
    // THE SUPPER AS RULED (11-11): a beat a supper. E on the inn lady, STAY THE NIGHT, and the supper plays over the room: LEFT and RIGHT flip the four at each opening,
    // one silent read above a hero's answers, a blue-shaded answer one a skill shapes (no die anywhere), the looks as portraits held
    { id: 'room', label: 'THE FIRST SUPPER, a stranger\'s (renown 0): the table starts civil', note: 'Inside at six in the evening, day 5, the party unknown on this road. E on the inn lady: a room, then supper at the long table, the traveler at the table for two. Gennet asks what brings you down the road; five openings. Flip the four: each hero has ONE read at most above the answers (Vivian sees the girl count you twice) and ONE blue-shaded answer at most (a skill shapes it; no die is shown). Barley\'s "Work. Wherever it is." warms the table; Vivian\'s lie caught cools it; the looks are portraits held with a line along the foot. A line about the glass is said to the traveler, across the room.', key: In.KEY, at: [24, 17], hour: 18, day: 5, inside: true, renown: 0, dice: [14, 12, 15, 14, 12, 15, 14, 12] },
    { id: 'supwarm', label: 'THE FIRST SUPPER at renown 3: warm, and the work named', note: 'The same evening with a name on Hessle\'s board (renown 3). Doran names it before Gennet asks, and the table starts warm: Vivian\'s trader lie cannot hold; "Good stone. Who built the place?" goes down its layers ("Slaves. Who else?", the trader and the Half-Cellar, the first innkeep\'s family and the dice); then "How does a house like this come to a man?", and Barley\'s read on how Doran sits.', key: In.KEY, at: [24, 17], hour: 18, day: 5, inside: true, renown: 3, dice: [14, 12, 15, 14, 12, 15, 14, 12] },
    { id: 'meal8', label: 'THE FIRST SUPPER ON DAY 10: they raise the made things themselves', note: 'Day 10: Gennet asks whether you have seen one before she asks anything else. The news is the three newest words: what they had wrong about the Gulch, the parties going south, the thing three men would not name, and the first telling of the things over the beds ("big as dogs"). Lymen or Aurdin with a made History asks which of it the teller saw, and Doran answers that too. Aurdin on the eyes (Arcana, shaded).', key: In.KEY, at: [24, 17], hour: 18, day: 10, inside: true, dice: [16, 15, 16, 16, 15, 16, 16, 15] },
    { id: 'meal14', label: 'THE FIRST SUPPER ON DAY 15: the Pit', note: 'Day 15 (the due\'s own night here is marked had, so this is a plain first supper): the Pit\'s trouble in its first telling, "it blows over"; Lymen\'s true word south.', key: In.KEY, at: [24, 17], hour: 18, day: 15, inside: true, dice: [18, 17, 17, 18, 17, 17, 18, 17], flags: { dueCycle: 0 } },
    { id: 'suplater', label: 'A LATER SUPPER: three openings, her fresh opener', note: 'The next evening, the regard warm, the house already asked about. "Back again, and whole. Sit. What did the road show you?" Three openings; what was asked before is gone from the answers; Lymen\'s opener gets the day\'s news.', key: In.KEY, at: [24, 17], hour: 18, day: 6, inside: true, renown: 3, dice: [14, 12, 15, 14, 12, 15], flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, innRegard: 2, supAsked: { house: 1 }, supReads: { counted: 1, rich: 1 } } },
    { id: 'supamara', label: 'THE SUPPER AFTER THE PARTY SAW GENNET WITH AMARA: tense, and no fight in it', note: 'Day 13, the wagon come and gone in the night with the party watching. "You were up late. I heard the stair." Three openings, the table civil and unable to rise; a pointed question turns it cold and the house sends you to bed. Nothing said here starts a fight. Vivian may lie that the party slept through it (shaded).', key: In.KEY, at: [24, 17], hour: 18, day: 13, inside: true, dice: [14, 12, 15, 14, 12, 15], flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, wagonCycle: 0, wagonOutcome: 'quiet', katGone: 1, katRode: 1 } },
    { id: 'supalone', label: 'GENNET ALONE, Doran away: his place laid all the same', note: 'Day 13, Doran gone down the road with a load. Gennet alone at the long table. Barley\'s "You lay his place when he\'s gone." warms her; Vivian asks how she came to the inn; with the table warm, the read on "without him" opens "You saw what took him." She closes with "Oh, heroes. Take the big room."', key: In.KEY, at: [24, 17], hour: 18, day: 13, inside: true, dice: [14, 12, 15, 14, 12, 15], flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, wagonCycle: 0, wagonOutcome: 'inn', wagonStopped: 'c0', doranAway: 1, katGone: 1 } },
    // SACRIFICE NIGHT (11-11 night, rulings 43-50): a beat a state -- her tell full, faint, none; and the kept-child night. E on the inn lady, STAY THE NIGHT
    { id: 'supsacr', label: 'SACRIFICE NIGHT, her FULL tell: Elsbeth walks the bowls round; three rounds; say it aloud in round one', note: 'The due\'s own night, the wagon stopped by the party, no offering in the house. Elsbeth WALKS the bowls round the table and sets the party\'s down hard; then takes the last two to the kitchen. ROUND ONE: nobody has eaten. One hero (the best eyes) has the read on how she set the bowls down and has stopped eating: flip to that hero -- SAY IT ALOUD, or a boot against the nearest hero\'s under the table, or just talk. Nobody is asked to eat. Said aloud: Gennet\'s "If you\'d just eaten this wouldn\'t have been so messy.", and the fight is this same table, nobody jumping to it. After the yield Doran confesses on portraits and walks out by the lake door with the lantern; Gennet walks back to the fire.', key: In.KEY, at: [24, 17], hour: 18, day: In.WAGON.first + In.DUE.after, inside: true, dice: [14, 12, 15, 19, 19, 19, 19, 19, 19], flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, katGone: 1, wagonCycle: 0, wagonOutcome: 'road', dueOffC: 0, dueOff: 'none', wagonStopped: 'c0' } },
    { id: 'sacfaint', label: 'SACRIFICE NIGHT, her FAINT tell (second tier): harder to notice in round one', note: 'The same night with Elsbeth at her second tier and the wagon not stopped by the party: her eyes go to the last bowl, then to the party, then away. The round-one read needs sharper eyes (Perception 15). If nobody has it, round two: everyone takes one bite, and the taste (Medicine) or Gennet\'s own empty bowl (Insight -- that hero\'s own shaded answer, "She hasn\'t filled her own bowl.") may stop one hero. Round three: whoever is still eating takes the second bite, then the saves are rolled out of sight: one bite, an easier save; two, a harder one.', key: In.KEY, at: [24, 17], hour: 18, day: In.WAGON.first + In.DUE.after, inside: true, dice: [14, 12, 15, 2, 19, 2, 19, 19, 19], flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, katGone: 1, wagonCycle: 0, wagonOutcome: 'road', dueOffC: 0, dueOff: 'none', elsbethTier: 2, dishes: 1, elsbethTold: 1 } },
    { id: 'sacnone', label: 'SACRIFICE NIGHT, NO tell: eat quietly three times -- the table tilts, the drag, Elsbeth\'s water on the stone', note: 'Elsbeth below her second tier: no tell, no round-one read. Choose (Eat quietly.) at each round with the dice low: everyone goes under, and wakes (or not) on the flat stone -- Elsbeth with the kitchen bucket, "Wake up! You\'re supposed to stop it!", Gennet\'s look that silences her, and one more save each with the water on them. A night that ends in a reload is meant to be possible here.', key: In.KEY, at: [24, 17], hour: 18, day: In.WAGON.first + In.DUE.after, inside: true, dice: [2, 2, 2, 2, 19, 19, 19, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 12, 2, 2, 2, 2, 2, 2, 2], flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, katGone: 1, wagonCycle: 0, wagonOutcome: 'road', dueOffC: 0, dueOff: 'none' } },
    { id: 'sackept', label: 'THE KEPT-CHILD NIGHT: no draught -- Gennet glad, Elsbeth with the bowls, Doran\'s "you\'ll sleep well"', note: 'The due\'s own night with the child she kept in the house. No draught and no lamp at supper: Gennet hums, Elsbeth sets each bowl down as if it might break, Doran has not touched his own and tells the party it will sleep well. Early beds. Then the night as built: past midnight the singing, the lantern, the walk.', key: In.KEY, at: [24, 17], hour: 18, day: In.WAGON.first + In.DUE.after, inside: true, dice: [14, 12, 15], flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, katGone: 1, wagonCycle: 0, wagonOutcome: 'inn', dueOffC: 0, dueOff: 'kept', kidAtInn: 1, glamourBroken: 1, glamourSeen: 1 } },
    // OUT OF THE BARN WITH THE CHILD (11-11): a beat a state, each a step from the chained one in the barn's end stall on day 13 -- E on it, FREE IT (or FREE HER), and Gennet comes running
    { id: 'barnunseen', label: 'OUT OF THE BARN: the glamour unseen, Doran home, renown 3', note: 'Day 13 in the barn, the wagon come and gone, the one it left chained in the end stall and looking a goblin. E on it: FREE IT. The party steps into the yard with it and Gennet comes running from the house: "That\'s why I knew to keep it. Poor innocent thing." Five stages -- her opener, her ask, the first offer, the green purse and the threat, the breaking point -- the four flipped at each. Vivian\'s read on the hand (or Aurdin\'s on the glamour) breaks the glamour in the yard and her story changes. LET HER RAISE IT ends it at her ask; refuse and she offers silver, then the green purse; refuse again and she takes the child\'s arm and calls Doran: speak to DORAN (Lymen, shaded when it lands) and he confesses in the yard; draw (Vivian) and it is a fight to the first yield; otherwise "Gen. Let go." and the child goes with the party.', key: In.KEY, at: [8, 5], hour: 10, day: 13, inside: 'barn', renown: 3, dice: [16, 16, 16, 16], flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, supAmara: 1, wagonCycle: 0, wagonOutcome: 'quiet', katGone: 1, katRode: 1, elsbethTier: 2, dishes: 1, elsbethTold: 1 } },
    { id: 'barnseen', label: 'OUT OF THE BARN: the glamour seen through, Doran home', note: 'The same morning, the glamour seen through on the wagon night: a child chained in the stall. FREE HER. Gennet\'s other story: "Somebody put a goblin\'s face on a child and sent her down this road. Who takes that in, if I don\'t?" Let her and the child is brought into the house, the raising feigned until the night.', key: In.KEY, at: [8, 5], hour: 10, day: 13, inside: 'barn', renown: 3, dice: [16, 16, 16, 16], flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, supAmara: 1, wagonCycle: 0, wagonOutcome: 'quiet', katGone: 1, katRode: 1, glamourBroken: 1, glamourSeen: 1, elsbethTier: 2, dishes: 1, elsbethTold: 1 } },
    { id: 'barnaway', label: 'OUT OF THE BARN: Doran away, Elsbeth at her third tier', note: 'Doran gone down the road: nobody for Gennet to call but Elsbeth. At the breaking point she calls for "the word"; Elsbeth comes out, the wand in her apron: "No. It\'s for the lake. Tell them, or I will." The child goes with the party. (At her second tier she stands in the door and does not say it; below that nobody comes out.)', key: In.KEY, at: [8, 5], hour: 10, day: 13, inside: 'barn', renown: 1, dice: [16, 16, 16, 16], flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, supAmara: 1, wagonCycle: 0, wagonOutcome: 'quiet', katGone: 1, katRode: 1, doranAway: 1, elsbethTier: 3, dishes: 1, elsbethTold: 1 } },
    { id: 'barnknown', label: 'OUT OF THE BARN: renown 5, a low Persuasion, the party knows of the lake\'s nights', note: 'The corridor\'s own. Lymen may ask at her ask "Raise it until which night?" and go straight to the breaking point; Doran comes round the barn and lets the axe hang, and any hero\'s word to him brings the confession. The dice are low: at lower renown the same word gets only "Gen. Let go."', key: In.KEY, at: [8, 5], hour: 10, day: 13, inside: 'barn', renown: 5, dice: [2, 2, 2, 2], flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, supAmara: 1, wagonCycle: 0, wagonOutcome: 'quiet', katGone: 1, katRode: 1, elsbethTier: 2, dishes: 1, elsbethTold: 1 } },
    { id: 'childtow', label: 'THE CHILD IN TOW: Doran at the woodpile, Elsbeth at the tub, no room (11-12)', note: 'Day 13, ten in the morning, by the woodpile: the child came out of the barn with the party and Doran has confessed. She stands beside you, a figure of her own. E on Doran: his face and his line -- the girl is safest at the Pit. Then in at the front door to the kitchen tub, E on Elsbeth: she sends you to the Pit; ASK HER TO COME and she stays with her father. Then E on Gennet: no room with the child in tow. The nights they say are counted to the nearer due not yet walked (11-13): two, on day 13.', key: In.KEY, at: [15, 25], hour: 10, day: 13,
      flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, supAmara: 1, wagonCycle: 0, wagonOutcome: 'quiet', katGone: 1, katRode: 1, glamourBroken: 1, glamourSeen: 1, barnFreed: 1, barnEnd: 'd', doranConfessed: 1, childGuest: 'child', childGuestDay: 13, childDue: 43, innRegard: 0, elsbethTier: 3, dishes: 1, elsbethTold: 1, dueOffC: 0, dueOff: 'none' } },
    { id: 'bigroom', label: 'THE BIG ROOM, theirs: morning by the good bed, her letter in the drawer (11-12)', note: 'Day 14, eight in the morning, in the big room over the kitchen: Gennet gave it at her supper alone, and Katarina rode out on the wagon. You stand where you would wake, by the good bed. E on the table by the bed: her letter, read as if she were saying it, then her book into the pack.', key: In.UP, at: [13, 2], hour: 8, day: 14,
      flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 2, supAlone: 1, wagonCycle: 0, wagonOutcome: 'inn', wagonStopped: 'c0', doranAway: 1, katGone: 1, katRode: 1, katLooked: 1, bigRoom: 1 } },
    { id: 'kat', label: 'DAY 7: THE TRAVELER BY THE FIRE, Barley with a bottle of ink (11-05)', note: 'Six in the evening on day 7, the four in the common room, a bottle of ink from Lisbet\'s in the pack. E on the traveler at her table by the fire: Barley -- "You\'re with the Dominion." -- and she breaks in: her deity gave her a vision and it used up all her ink. The bottle set by her book; the vision, Aurdin laughing in the dust with the tribe that laughs; the page torn free: the Sheet: Hideous Laughter in the pack. E on her again: her talk at the fire -- what she is, the road south, what she saw (the vision told: both tiers). Then M, ITEMS, the sheet on Aurdin: he copies it into his book.', key: In.KEY, at: [25, 20], hour: 18, day: 7, inside: true, inv: ['ink'] },
    { id: 'katbook', label: 'DAY 13: HER LAST MORNING, the wagon stopped (11-05)', note: 'Eight in the morning on day 13, the wagon stopped in the yard last night (the pair down or run, the children freed), Barley\'s word given her days ago and a bottle of ink in the pack. E on the traveler by the fire: she closes her book, opens it, slides it across -- her book; the ink set by it and the vision with it, the sheet; ask her about Amara, and what she carried (the read at the greeting caught them); LET HER GO: she pays out her nights and walks south toward the Pit, and the fire\'s table is empty.', key: In.KEY, at: [25, 20], hour: 8, day: 13, inside: true, inv: ['ink'],
      flags: { reachedInn: 1, mealHad: 1, gennetNamed: 1, wagonCycle: 0, wagonOutcome: 'inn', wagonStopped: 'c0', glamourBroken: 1, kidAtInn: 1, doranAway: 1, katInk: 1, katLooked: 1, katKnewAmara: 1 } },
    { id: 'wagon', label: 'DAY 12: THE WAGON NIGHT', note: 'The first WAGON DAY, six in the evening in the common room, the traveler by the fire. E on the inn lady: a room, supper, then the second watch -- Amara\'s wagon turns in, goblins chained in the back. Who had the watch? INVESTIGATE, WAKE THE PARTY or KEEP WATCH; the gold, or steel: the yard fight on the grid, Willem at the traces (three turns unbothered and the team is loose).', key: In.KEY, at: [24, 17], hour: 18, day: In.WAGON.first, inside: true },
    { id: 'resthours', label: 'DAY 5 AT TEN: "Dinner is at eight" -- the inn\'s rest hours (11-05)', note: 'Ten in the morning in the yard by the well, where the inn lady is by day (11-12), supper had here before. E on the inn lady: "Dinner is at eight." -- SHORT REST (an hour by the fire, the hit dice spent, nothing paid), WAIT TIL DINNER (the room paid, the afternoon by the fire, supper at eight, awake at seven), NOT NOW. A room taken from three to ten has supper and wakes eleven hours on; after ten the kitchen is cold, eight hours.', key: In.KEY, at: [9, 15], hour: 10, day: 5, flags: { gennetNamed: 1, mealHad: 1, reachedInn: 1 } },
    { id: 'upstairs', label: 'UPSTAIRS: the guest rooms and the room over the kitchen', note: 'At the head of the stair in the passage. Three small guest rooms over the common room, the big fire\'s chimney through the middle, and the big room on the kitchen side over the lake, its door off the passage past the chimney: E at the table by its bed -- the drawer. The stair down sets you by the bar.', key: In.UP, at: [6, 9], hour: 18 },
    { id: 'night', label: 'THE YARD BY NIGHT', note: 'Ten at night on the path from the lake door: the house dark on the yard, lamps at its doors and the barn\'s, the lantern post on the point, the lake black. The boys are in.', key: In.KEY, at: [38, 18], hour: 22 },
    { id: 'barn', label: 'THE BARN: the six stalls, the hay, the doors (11-05)', note: 'Noon in the barn, a step in from its doors: three stalls either side of the aisle, each with its manger and hay, the hay pile by the doors. Walk the aisle; step out by the doors and the barn roofs again.', key: In.KEY, at: [12, 6], hour: 12, inside: 'barn' },
    { id: 'wagonyard', label: 'THE WAGON IN THE YARD: Amara\'s wagon on its night, tail to the camera (11-10)', note: 'The first WAGON DAY, eleven at night, in the yard: Amara\'s wagon turned in on the yard\'s ring as the art desk\'s angle pass draws it -- the canvas over three squares, its open bed at the tail toward you, its wheels on the ground. The two in its bed and the team come with the night itself (DAY 12: THE WAGON NIGHT, to the second watch). Walk round it.', key: In.KEY, at: [14, 19], hour: 23, day: 12, flags: { wagonIn: 1 } }, // (the angle pass, 11-10: js/innprops.js lays the wagon wherever the floor has its squares)
    // THE SEE-THROUGH BY THE PARTY'S PRESENCE (11-11, the inn seat: js/innprops.js IP.tick, IP.drawSee; the front door's cutaway RULED 11-10)
    { id: 'doorcut', label: 'THE FRONT DOOR\'S CUTAWAY: walk in off the road to the step (11-11)', note: 'Dusk on day 5, seven squares out on the road from the front step. Walk east toward the house: six squares from the step the house\'s west end goes see-through over the door\'s rows (three each side of it) -- the west wall\'s line with the doorway a gap in it, the lantern post lit at the step, nothing of the room. Step into the doorway and the house opens as ever; back out and walk off, and at seven squares the roof stands whole again.', key: In.KEY, at: [11, 18], hour: 18, day: 5 },
    { id: 'behindfire', label: 'BEHIND THE BIG FIRE: the chimney see-through while you stand behind it (11-11)', note: 'Inside at dusk, a square north-west of the big fire\'s chimney. Walk the squares behind it (its west side, 27,17 to 27,20, and its north, 28,16 and 29,16): while it hides you the whole stack goes faint; step out in front of it and it stands whole.', key: In.KEY, at: [26, 16], hour: 18, day: 5, inside: true },
    { id: 'behindstack', label: 'UPSTAIRS, BEHIND THE STACK: the chimney upstairs see-through (11-11)', note: 'Upstairs in the passage beside the big fire\'s stack. Step east onto 9,6, the one square behind it: the stack goes faint while you stand there.', key: In.UP, at: [8, 7], hour: 18 },
    { id: 'behindhouse', label: 'BEHIND THE HOUSE: a window in the roof round you (11-11)', note: 'The yard by day, on the grass off the house\'s north wall. Walk along it, a square or two out: wherever the roof hides you, a window opens in it round you -- no outline. Walk round to the south side and nothing opens: there nothing hides you.', key: In.KEY, at: [26, 10], hour: 10 },
    { id: 'silk', label: 'THE SILK ACROSS THE ROAD: after the pair up Web Gulch on the greys (11-11)', note: 'Two in the morning at Web Gulch\'s south mouth, the wagon pair ahead up the cut on the greys (the yard\'s AFTER THEM). Walk north up the road. Midway up the cut, silk is strung across it where the gulch\'s webs come down: the greys run into it and the pair are caught fast. The tries pinned: Amara tears free and is away up the cut; Willem is still held when you come up -- the catch at the silk, Willem restrained in the fight. Then after Amara: on her grey, she is lost at the north mouth. The walk back by its hour, and the yard.', key: 'webgulch', at: [22, 109], hour: 2, day: 12, dice: [20, 1, 1, 1, 1, 1],
      flags: { reachedInn: 1, mealHad: 1, gennetNamed: 1, wagonCycle: 0, wagonIn: 1, glamourBroken: 1, glamourSeen: 1, wagonStopped: 'c0', kidTaken: 1, wagonChase: { horses: true, willem: true, amara: true, leg: 1, gap: 10, acc: 0, on: false, steps: 0, back: null } } },
    // THE CHASE RE-CUT (11-12, rulings 51-55): the catch at the south mouth; and the walk back into an empty yard
    { id: 'southmouth', label: 'THE CATCH AT THE SOUTH MOUTH: Willem fast in the silk, Amara running (11-12)', note: 'Two in the morning, in at Web Gulch\'s south gate after the wagon pair on the greys. The fight opens AT ONCE: silk is strung across the road five squares in, Willem\'s grey fast in it, Amara through and riding for the pale squares north (their way off). Leave Willem alone and she is away. STRIKE AT WILLEM and she comes down off her grey and turns back to fight; both are on foot, the two greys standing at the north exit squares. When Willem tears out of the silk the two make for the greys. Whoever gets away is chased up the cut as before (on a grey: lost at the north mouth).', key: 'webgulch', at: [22, 109], hour: 2, day: 12,
      flags: { reachedInn: 1, mealHad: 1, gennetNamed: 1, wagonCycle: 0, wagonIn: 1, glamourBroken: 1, glamourSeen: 1, wagonStopped: 'c0', kidTaken: 1, wagonChase: { horses: true, willem: true, amara: true, leg: 1, gap: 10, acc: 0, on: false, steps: 0, back: null } } },
    { id: 'chaseback', label: 'BACK FROM THE CHASE: the yard empty, Gennet at the step, the big room (11-12)', note: 'Four in the morning, back in the inn\'s yard from the chase, Willem dead on the road. The yard is EMPTY: Doran has driven the wagon and the seven south (no strongbox, no order). A panel in the middle of the screen, THE EIGHT: the renown and its XP (the book was a line of the gulch fight\'s own VICTORY, 11-13). E closes it, and only then Gennet comes out to the front step with her lantern: where he has gone, that the traveler rode with him, and "Oh, heroes. Take the big room." You wake in the big room; her book and its letter are in the drawer; Elsbeth\'s gift in the morning is the Cloak of the Manta Ray.', key: In.KEY, at: [14, 20], hour: 4, day: 13,
      flags: { reachedInn: 1, mealHad: 1, gennetNamed: 1, supCount: 1, wagonCycle: 0, wagonIn: 1, glamourBroken: 1, glamourSeen: 1, wagonStopped: 'c0', kidTaken: 1, katLooked: 1, dueOffC: 0, dueOff: 'kept', wagonChase: { horses: false, willem: true, amara: true, leg: 2, on: false, steps: 40, back: 'road', willemDead: true } } },
    { id: 'doranhome', label: 'DORAN\'S FIRST SUPPER HOME: the Pit\'s people took them, the Snoot getting worse (11-12)', note: 'Day 14 at six, Doran back from the Pit this evening. E on the inn lady, a room, supper: two lines of his before her opener, once.', key: In.KEY, at: [24, 17], hour: 18, day: 14, inside: true, dice: [14, 12, 15, 14, 12, 15], flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, wagonCycle: 0, wagonOutcome: 'fled', wagonStopped: 'c0', katGone: 1, katRode: 1, doranPit: 1, bigRoom: 1, dueOffC: 0, dueOff: 'kept', kidAtInn: 1, glamourBroken: 1, glamourSeen: 1 } },
    // KATARINA'S AND ELSBETH'S FRONT ENDS (11-12, rulings 57 and 58)
    { id: 'katvisit', label: 'KATARINA BEFORE THE INK: one thing a visit, on the flip (11-12)', note: 'Six in the evening on day 7, at her table by the fire, no ink in the pack. E on the traveler: she is closed. With Barley in the party his "You\'re with the Dominion." and her ask for ink come first, at once, as before. Then flip the four: each has at most ONE blue-shaded line (Aurdin on what she wears, Lymen on the road south, Vivian only once the wagon is known), a line of small talk, and (Leave her to her book.). One shaded line gets ONE thing, and that is the day: E on her again and nobody has a shaded line till tomorrow (11-13). WHAT SHE SAW is not offered until the ink is given.', key: In.KEY, at: [25, 20], hour: 18, day: 7, inside: true, dice: [19, 19, 19, 19], flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, katInk: 1, katLooked: 1 } },
    { id: 'elsbethday', label: 'ELSBETH BY DAY at renown 3: "You\'re the people stopping the monsters." (11-12)', note: 'Ten in the morning on day 6, inside by the tub, a name on Hessle\'s board (renown 3). Gennet is OUT AT THE WELL by day (look for her there). E on Elsbeth: "You\'re the people stopping the monsters." and her first telling, with no dishes. With no renown and nothing noticed at supper she only works ("The girl focuses on her work."); in the evening she says not now.', key: In.KEY, at: [32, 21], hour: 10, day: 6, inside: true, renown: 3, flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1 } },
    { id: 'elsbethdishes', label: 'ELSBETH BY DAY, the counting seen and kept quiet, her father home: the dishes (11-12)', note: 'Ten in the morning on day 6, renown 0, Vivian saw the girl count the party at supper and said nothing. E on Elsbeth: HELP WITH THE DISHES is the cover, her father being in the house; her first telling, and the wagon\'s night. (With Doran away she tells it with no dishes.)', key: In.KEY, at: [32, 21], hour: 10, day: 6, inside: true, renown: 0, flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, mealWrong: 1 } },
    // THE CHILD'S ROAD (ruling 59, 11-12): the first camp and the Pit, each staged on THE WORLD and run at once
    { id: 'childcamp', label: 'THE CHILD\'S ROAD: the first camp -- "Water. Please." (11-12)', note: 'Day 13 at dusk, a camp on the Pit road south of the inn, the one out of the barn still a goblin to the party. The scene plays at once, on its face: it asks for water in a girl\'s voice, the glamour comes off, and the face is the girl\'s from there. In the game it plays before the first camp\'s watches are stood, once. (A party that had seen through it gets the asking and no more.)', world: true, hour: 19, day: 13, run: function (sc) { In.childCamp(sc, function () { sc.say('The watches are stood from here, as at any camp.'); }); },
      flags: { reachedInn: 1, gennetNamed: 1, wagonCycle: 0, wagonOutcome: 'quiet', barnFreed: 1, barnEnd: 'e', childGuest: 'goblin', childGuestDay: 13, childDue: 43, dueOffC: 0, dueOff: 'none' } },
    { id: 'childpit', label: 'THE CHILD\'S ROAD: Tarlyn\'s Pit, the chalked door of GreyFang\'s house (11-12)', note: 'Day 15, three in the afternoon, the party on the Pit\'s hex with the girl. The scene plays at once: the watch on the road, the door back of the fighting pit with the wolf\'s head chalked on it, the woman\'s count (Doran drove seven down: "That\'s eight, then."), and the girl is set down. After it E on the hex is the Pit as before (its map is not built). Back at the inn Doran has one line for it at the woodpile.', world: true, site: 'pit', hour: 15, day: 15, run: function (sc) { In.childPit(sc); },
      flags: { reachedInn: 1, gennetNamed: 1, wagonCycle: 0, wagonOutcome: 'quiet', barnFreed: 1, barnEnd: 'd', doranConfessed: 1, doranPit: 1, glamourBroken: 1, glamourSeen: 1, childGuest: 'child', childGuestDay: 13, childCamp: 1, childDue: 43, dueCycle: 0, dueOffC: 0, dueOff: 'none' } },
    { id: 'elsbethnoon', label: 'ELSBETH AFTER MIDDAY: Gennet in from the well, "Not now." (11-12)', note: 'One in the afternoon on day 6, renown 3. Gennet is by the fire: her hours at the well are the mornings, seven to midday. E on Elsbeth at the tub: "Not now. In the morning, when she\'s out at the well."', key: In.KEY, at: [32, 21], hour: 13, day: 6, inside: true, renown: 3, flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1 } },
    { id: 'bucketlist', label: 'THE BUCKET LIST (a yellow egg): all four asleep on the stone, Elsbeth\'s bucket (11-13)', note: 'Sacrifice night, nobody the wiser: the four go under at the table (the dice are pinned so all four sleep) and are carried to the flat stone. It plays at once: the black, the stone in the dark, Elsbeth with the kitchen bucket splashed mid-screen, the splash (sound on), her words in the box over her portrait -- "Wake up! You\'re supposed to stop it!" -- and then the YELLOW EGG, "Bucket List". Gennet\'s look after. The pinned dice wake all four on the water, and the thing from the lake is theirs to fight: kill it and what is under its plates is the Cloak of the Manta Ray.', key: In.KEY, at: [24, 17], hour: 19, day: In.WAGON.first + In.DUE.after, inside: true,
      dice: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19], flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, katGone: 1, wagonCycle: 0, wagonOutcome: 'road', dueOffC: 0, dueOff: 'none' },
      floorRun: function* (B) { var party = B.roam.members.filter(function (u) { return u.src && !u.src.guest && u.hp > 0 && !u.dead; }); B.roam.flags.poisonNight = In.dueCycle(In.day(D.roam.q)); yield* D.secondact.drag(B, party); } },
    { id: 'lakeedge', label: 'THE LAKE\'S EDGE: four of knee-deep off the stone, then the deep (11-12)', note: 'Two in the afternoon on the rocks west of the flat stone. East of the stone the water is knee-deep for four squares, one depth, the shore\'s ground showing through one sheet of water; then the deep at once. Wade out: each square costs double, and a figure stands in it to the knee. The same four run the whole coast, north and south.', key: In.KEY, at: [43, 18], hour: 14 },
    { id: 'rite', label: 'THE RITE FROM THE BIG ROOM\'S WINDOW: the singing, the party overlooking the lake (11-12)', note: 'The due\'s own night with the child they kept, past midnight, the party woken in the big room and gone to its window. It plays at once: the party stands at the window upstairs, the roof and wall open round them, and the camera holds on them and the lake below. THE SINGING plays (sound on: a made voice, slow, with two more under it). The signs on the water, Gennet and the child out by the lake door with the lantern, the fork: THE LANTERN (down the stair) or LET IT BE (the due at the stone, watched from here; the singing stops with the water).', key: In.KEY, at: [35, 16], hour: 1, day: In.WAGON.first + In.DUE.after + 1, inside: true, dice: [14, 12, 15, 14], due: { stage: 'lake', d: In.WAGON.first + In.DUE.after, off: 'kept', woke: true },
      flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1, supCount: 1, katGone: 1, wagonCycle: 0, wagonOutcome: 'inn', dueOffC: 0, dueOff: 'kept', kidAtInn: 1, glamourBroken: 1, glamourSeen: 1, dueCycle: 0, dueTonight: 1, kidTaken: 1, bigRoom: 1 } },
    { id: 'elsbethfirst', label: 'ELSBETH BY DAY, BEFORE THE FIRST DINNER: the one line (11-13)', note: 'Ten in the morning on day 6, renown 3, no supper had at the inn yet. E on Elsbeth: "You are the people stopping the monsters", her one line, and nothing after it; her telling waits for the first dinner.', key: In.KEY, at: [32, 21], hour: 10, day: 6, inside: true, renown: 3, flags: { reachedInn: 1, gennetNamed: 1 } },
    { id: 'shore', label: 'THE SHORE BY DAY: the point, the boat, the floats (11-05)', note: 'Two in the afternoon on the path to the point: the rowboat drawn up, the lantern post, the flat stone with its cairn, the floats bobbing out on the shallows and the deep beyond. Walk out to the flat stone.', key: In.KEY, at: [40, 18], hour: 14 },
    { id: 'snoot', label: 'DAY 14: THE SNOOT\'S RUNNER by the well', note: 'The Snoot at the Pit: a runner off the Pit road by the well. E on him: TO THE SNOOT opens the Snoot\'s own page (its BACK TO THE INN comes home), or NOT NOW.', key: In.KEY, at: [13, 16], hour: 10, day: 14 },
    { id: 'world', label: 'THE WORLD AT THE INN: its door', note: 'A NEW GAME on THE WORLD on the inn\'s hex. E: the inn\'s door -- GO IN by the gate the party faces.', world: true, hour: 15 }
  ];
  In.SHOW_LVL = 3;
  In.play = function (bt) {
    var H = D.house, R = D.roam, rec = H.fresh(); rec.at = { town: null }; if (bt.renown != null) rec.renown = bt.renown;
    // A LEVEL 3 PARTY ON EVERY DOOR (RULED 11-12, Griz, on his 2203Z notes: "please make future doors with a lvl 3 party"): the show's four are raised to In.SHOW_LVL as
    // a headless page would raise them -- a max hit die a level, the first archetype, the defaults (js/rules.js R.levelUp, R.autoPicks) -- whole and rested; a beat's own
    // `lvl` says otherwise. The gear is a new game's: nothing is bought for them
    var RL = DS.R, lv = bt.lvl != null ? bt.lvl : In.SHOW_LVL; rec.party.forEach(function (h) { for (var g = 0; g < 20 && h.lvl < lv; g++) { RL.levelUp(h); RL.autoPicks(h); } if (RL.XP_LEVEL && RL.XP_LEVEL[h.lvl] != null) h.xp = Math.max(h.xp || 0, RL.XP_LEVEL[h.lvl]); h.hp = h.maxhp; if (h.slotsMax) h.slots = h.slotsMax.slice(); }); // (a supper's beat: the renown the Waterbys have heard)
    rec.flags = Object.assign({ councilNotice: 1, councilSeen: 1 }, bt.flags || {}); rec.silver = Math.max(rec.silver || 0, 60); // (Silverton's council night sat already: a show of the inn -- 11-04, his "these previews are all firing the council discussion")
    (bt.inv || []).forEach(function (id) { H.add(rec.inv, id, 1); }); // (what the beat's pack holds: the traveler's ink, 11-05)
    var site = bt.world ? ((W.map && W.index && W.index() && W.map('world')) || { sites: [] }).sites.filter(function (s) { return s.id === (bt.site || In.SITE); })[0] : null; // (bt.site: another place on THE WORLD -- the Pit, 11-12)
    H.begin(rec, 0, site ? '?world&at=' + site.hex[0] + ',' + site.hex[1] : null);
    var S = W.state && W.state(); if (S && bt.hour != null) S.t = (bt.day ? (bt.day - 1) * 24 : Math.floor((S.t || 0) / 24) * 24) + bt.hour;
    if (bt.world) { if (bt.run && W.scene) bt.run(W.scene); return; } // (bt.run: a scene staged on THE WORLD and run at once -- the child's road, 11-12)
    In.pinned = bt.dice ? bt.dice.slice() : null; In.beatRun = bt.floorRun || null; // (floorRun: a scene run on the beat's floor once its own script is done -- the Bucket List, 11-13)
    In.carryFresh = false; In.duePlay = bt.due ? Object.assign({}, bt.due) : In.duePlay && bt.key ? null : In.duePlay; // (bt.due: a beat that opens inside the due's played night -- the rite at the window, 11-12; any other floor beat starts clean)
    if (bt.due && bt.key === In.KEY) { // (a beat that opens at the big room's window: the guest floor laid once first, for its picture -- In.upShot, 11-13)
      try { var ub = R.make('?roam=' + In.UP + '&at=16,3', { save: H.living(H.cur), opts: { at8: [16, 3] }, house: true }); D.push(ub); if (ub.baking) { ub.baking = false; ub.enter(); } In.upShot(); if (D.top() === ub) D.pop(); } catch (eU) { In.upPic = null; }
    }
    var nb = R.make('?roam=' + bt.key + (bt.inside === 'barn' ? '&at=' + bt.at.join(',') : bt.inside ? '&inside' : ''), { save: H.living(H.cur), opts: { at8: bt.at.slice() }, house: true });
    D.push(nb);
  };
  In.show = function (q) { return new D.roam.WetShow(q, { kind: 'innshow', beats: In.BEATS, play: In.play, title: '{y}THE HALFWAY INN, 11-04{/} -- one place on the diamonds, the walls see-through inside, THE MEAL (a show)' }); };
})();
