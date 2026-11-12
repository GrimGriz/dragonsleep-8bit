/* DEEP16 -- SÓLSKAFT ON THE GRID: THE STREET LEVEL (11-11, the Sólskaft build seat, started by the lanes desk on Griz's word: "We should be able to start the solskaft iso
   opus now"). The first of the town's floors as iso roam -- the one he walks first -- built on his reshaping of 11-11 (TarlynsPit/wiki/solskaft.md §The shape, his words
   CANON; pours-2026-11.md) and the weigh of the same day (cloud-notes/solskaft-iso-roam-weigh-2026-11-11.md, its floor-by-floor plan checked against MAPS.edifice), with
   his answers to it recorded in ..\handoff-2026-10-14-the-story-build.md (11-11): "6 - deserves iso tbh"; "what if we put another 30 feet of mainstreet between the stone
   and the throne?"; "Go with the leans, I meant the edifice walls and it didn't have any real footage, dug out mountain is correct".

   ONE FLOOR ON THE DIAMONDS (SK.ROWS, 38 x 32, north up the screen's right as the inn's): the Edifice's own width (its facade 190 ft, columns 11-48 of MAPS.edifice =
   x 0-37 here, the vault doors at 18-19 on its own squares), the front wall at the south row, and main street running north in his three stretches --
     SOUTH, under the glass, seven squares (35 ft) -- trade: inside the doors the cart ramp going down on the west (along the front wall, its mouth at the west end) and the
       guest stable on the east (ready, long empty, a little old fodder), the narrow ramp up at the east wall beside it; the tollhouse in the front-west corner at the ramp
       (the trade-counter facing it, the scales under their cloth, the tariff board, the quartermaster's counter -- Ingrith's ledger-room off the hallway since PASS TWO, 11-12); one deep store a side, shut,
       two storeys -- the lodging over -- and one window lit over the west one (Ásdís Scalebeam's, CANON 11-11).
     THE COURT, under the light, six squares (30 ft) -- faith: the oathstone on its pedestal where the Sunshaft's circle on MAPS.edifice puts it (centre 29.5, 4.8 there =
       18.5, 10.2 here), the beam on it by day; Rekknar's temple on the west, the Dormant's on the east (the realm page's reading); each drawn with room for a stair and
       none cut (OPEN: "how does down through the temples fit?").
     THE CROWN, under the rock, six squares (his thirty feet) through an arch in the back rim -- one storey, lamp-lit, the hero-wall down both walls, the doors of the
       treasury, the mint and the assay on the west, the garrison's stair on the east; then the throne room's doors, and the throne empty on its dais.
   The doors off this floor (the vault doors, both ramps, the store fronts, the lodging, the assay, mint and treasury, the garrison's stair) are drawn and marked and lead
   nowhere yet: each says where it will go. No story scene is wired (Pyro's meeting, Ingrith, the muster, the night crew are the story build lane's); the people stand with
   the first game's words as PLACEHOLDERS (first/content, first/js/deep.js -- not rewritten).
   It rides the top levels' floors (js/mines.js M.FLOORS: `own`, `iso`), PAGED (the weigh's fog section: a floor painted as the camera comes to it), with a first-visit
   flag `seen:solskaft` (RULED 11-11 with the fog's five: "7 - sounds good"); no room mask yet. The seat's words here are invented.json solskaft-street-floor. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, M = D.mines, T = D.town, W = D.world, SK = D.solskaft = {};
  if (!M || !T) return;
  SK.KEY = 'solskaft';
  SK.W = 38; SK.H = 32;
  SK.Y = function (r) { return SK.H - 1 - r; }; // (r counted north from the front wall, as the weigh counts: r0 the facade, r14 the back rim, r21 the throne room's doors)

  // ---------------------------------------------------------------- THE ASSAY HOUSE FURNISHED (11-12, the Solskaft seat of the reset: ART-140, art-wanted 53, his "2 - props alone" --
  // nobody stands in it): a block six squares by three against the room's north and west walls, laid from its south-west square SK.ASSAY (x, r), so the room can move whole.
  // Each piece [the cell, dx, dr, its word's key, its squares along x]; the walls' pieces [the cell, dx along the north wall | dr up the west wall, its word's key]. The door side
  // (dx 5) and the middle row (dr 1) kept clear: every piece is reached from an open square beside it. Its furnace cold (the assay closed seventy years).
  SK.ASSAY = [9, 19]; // (PASS TWO, 11-12: the assay house off the hallway's west wall, its door at his (16, 11) -- r20)
  SK.PILLARS = [[10, 15], [12, 15], [10, 17], [12, 17], [25, 15], [27, 15], [25, 17], [27, 17]]; // (down the temple halls' two long sides, clear of the walk from the door to the god's piece -- PASS TWO, 11-12)
  SK.HALLBENCH = [[16, 17], [16, 21], [21, 17], [21, 21]]; // (the hallway's stone benches, each two squares up the wall from x, r -- PASS TWO, his "hallway can be empty with benches")
  SK.ASSAYLAY = [['muffle_furnace_cold', 0, 2, 'furnace'], ['standard_ledger', 2, 2, 'assayLedger'], ['touch_needle_table', 3, 2, 'needles'], ['dwarf_stool', 4, 2, null],
    ['assay_balance', 0, 0, 'balance'], ['stone_bench_x', 1, 0, null, 2], ['assay_buttons_and_ingots', 3, 0, 'buttons'], ['locked_weights_case', 4, 0, 'weights']];
  SK.ASSAYWALL = { L: [['guilds_mark_x', 1, 'mark'], ['crucibles_and_cupels_x', 5, 'shelf']], R: [['crucibles_and_cupels_y', 1, 'shelf']] };
  SK.assayWord = function (k) { return SK.S8[k] || SK.LINES[k]; }; // (the needles and the weights the first game's, the rest the seat's)
  SK.assayAt = function (dx, dr) { return [SK.ASSAY[0] + dx, SK.ASSAY[1] + dr]; };
  // ---------------------------------------------------------------- the floor, carved: rock everywhere, then the rooms cut out of it (x west to east, r south to north)
  SK.build = function () {
    var g = [], x, r, Y = SK.Y;
    for (var y = 0; y < SK.H; y++) { g.push([]); for (x = 0; x < SK.W; x++) g[y].push('#'); }
    var set = function (x0, r0, x1, r1, c) { for (var rr = r0; rr <= r1; rr++) for (var xx = x0; xx <= x1; xx++) g[Y(rr)][xx] = c; };
    set(18, 0, 19, 0, 'D');            // the vault doors, in the facade (the Edifice's columns 29-30)
    // SOUTH STRETCH (r1-r7): main street 8 wide, x 15-22
    set(15, 1, 22, 7, '=');
    set(6, 1, 14, 2, 'v'); set(5, 1, 5, 2, 'X');            // the cart ramp down, west along the front wall; its mouth at the west end (to the cart level)
    set(5, 3, 7, 3, 'K'); set(8, 3, 8, 3, '=');              // the tollhouse's trade-counter facing the ramp, its gate at the east end (west of it, rock: the ramp's cut)
    set(1, 4, 8, 6, '='); set(5, 6, 5, 6, 's');              // the tollhouse, the ledger-room's corner its own since PASS TWO (11-12, his "to make room for toll-booth area": Ingrith's room is off the hallway)
                 // the tollhouse; the scales under their cloth, in its corner by the quartermaster (moved 11-12 off the gate's one square in: they had shut him in -- his "no way to talk to the assay guy")
    set(6, 5, 7, 5, 'K');                                    // the quartermaster's counter (the clerk behind it, to the north)
    set(10, 3, 14, 7, 'S');                                  // the west store, shut, its lodging over (two storeys)
    set(23, 3, 27, 7, 'S');                                  // the east store, the same
    set(23, 1, 36, 2, '=');                                  // the stable's apron by the doors (the drill drills on the cart level since 11-12)
    set(36, 2, 36, 5, 'v'); set(36, 6, 36, 6, 'X');          // the narrow ramp up from below at the east wall (its mouth at the north end)
    set(31, 3, 31, 3, 'D');                                  // the stable's door
    set(29, 4, 34, 6, '=');                                  // the stable
    set(29, 6, 32, 6, 'm'); set(33, 6, 33, 6, 't'); set(34, 5, 34, 5, 'h'); // its mangers, the trough off the cistern, the little fodder there is
    // THE COURT (r8-r13): the oathstone under the light; a temple each side
    set(13, 8, 24, 13, '=');
    set(18, 10, 19, 10, 'O');                                // the pedestal and the oathstone, in the Sunshaft's circle
    [[16, 1], [21, 1], [15, 7], [22, 7], [15, 10], [22, 10]].forEach(function (q) { set(q[0], q[1], q[0], q[1], 'i'); }); // the lamp standards (SK.LAMPS, 11-12)
    // (the court stands alone with the stone since PASS TWO, 11-12: the temples are off the hallway now, his "west temple corner at 16, 16")
    // THE BACK RIM (r14): an arch the hallway's width
    set(16, 14, 21, 14, '=');
    // THE HALLWAY (r15-r24, PASS TWO 11-12 -- his "I still expected/wanted hallway ... hallway can be empty with benches"): main street on under the rock, 6 wide, its rooms
    // either side behind walls (x15 west, x22 east), a door each; four stone benches along its walls clear of the doors (SK.HALLBENCH)
    set(16, 15, 21, 24, '=');
    SK.HALLBENCH.forEach(function (b) { set(b[0], b[1], b[0], b[1] + 1, 'w'); });
    // WEST: Rekknar's temple at the hallway's first corner (his "west temple corner at 16, 16"), a closed hall, its door on the hallway; four pillars; his ledger-stone
    // against the back wall; the door in the back wall to the stair down (through the cart level's rock to the funerary's west hallway)
    set(8, 15, 14, 17, '='); set(15, 16, 15, 16, 'D');
    SK.PILLARS.filter(function (q) { return q[0] < 18; }).forEach(function (q) { set(q[0], q[1], q[0], q[1], 'p'); });
    set(8, 16, 8, 16, 'L'); set(7, 15, 7, 15, 'D'); set(7, 13, 7, 14, 'X');
    // the assay house (his "assay at 16, 11": its door r20), furnished (SK.ASSAYLAY, ART-140 and ART-135)
    set(9, 19, 14, 21, '='); set(15, 20, 15, 20, 'D');
    SK.ASSAYLAY.forEach(function (p) { var a = SK.assayAt(p[1], p[2]); set(a[0], a[1], a[0] + (p[4] || 1) - 1, a[1], p[3] === 'needles' ? 'n' : 'w'); });
    // Ingrith's ledger-room, off the hallway's west side (his "or get to ingrinths from hallway door west side?"), her desk
    set(11, 23, 14, 24, '='); set(15, 23, 15, 23, 'D'); set(12, 24, 12, 24, 'l');
    // EAST, the mirror: the Dormant's temple (the empty cut in its north wall, SK.CUT), its stair down; the garrison's guardroom, their stair up at its back, a spear rack,
    // a bench; the petitioners' room, a bench, nobody waiting (the "something symmetric")
    set(23, 15, 29, 17, '='); set(22, 16, 22, 16, 'D');
    SK.PILLARS.filter(function (q) { return q[0] > 18; }).forEach(function (q) { set(q[0], q[1], q[0], q[1], 'p'); });
    set(30, 15, 30, 15, 'D'); set(30, 13, 30, 14, 'X');
    set(23, 19, 28, 21, '='); set(22, 20, 22, 20, 'D'); set(28, 20, 28, 21, 'u'); set(23, 21, 25, 21, 'R'); set(25, 19, 26, 19, 'K');
    set(23, 23, 26, 24, '='); set(22, 23, 22, 23, 'D'); set(24, 24, 25, 24, 'w');
    // THE THRONE ROOM further back and narrower (PASS TWO, his "throne room further back as needed - not so wide of a throne room"): its doors r25, the room r26-r30
    set(17, 25, 20, 25, 'D');
    set(10, 26, 27, 30, '=');
    set(18, 29, 19, 29, 'T');                                // the high seat on its dais (SK.DAIS)
    set(15, 28, 15, 28, 'b'); set(22, 28, 22, 28, 'b');      // braziers either side of the dais
    return g.map(function (row) { return row.join(''); });
  };
  SK.ROWS = SK.build();
  SK.LEGEND = { '#': 'dwarfWall', '=': 'dwarfFloor', D: 'doorway', v: 'skRamp', X: 'skMouth', p: 'skPillar', u: 'skStair', K: 'skCounter', l: 'skDesk', s: 'skScales', S: 'skStore', n: 'skCounter', w: 'skScales',
    R: 'skRackS', m: 'skManger', t: 'skTrough', h: 'skFodder', O: 'skOathstone', i: 'skLamp', L: 'skLedgerStone', T: 'skThrone', b: 'firepit' };
  Object.assign(M.LAY, { doorway: M.LAY.doorway || ['d'], skRamp: ['='], skMouth: ['d', 'X'], skStair: ['d', 'X'], skCounter: ['K'], skDesk: ['K'], skScales: ['k'], skManger: ['k'],
    skTrough: ['w'], skFodder: ['k'], skRackS: ['S'], skPillar: ['k'], skOathstone: ['k'], skLamp: ['k'], skLedgerStone: ['k'], skThrone: ['k'] });
  Object.assign(M.ROOF, { skStore: 'U' });
  SK.ROOFS = { U: { h: 9, roof: 'stone', wall: 'stone' } }; // (the stores two storeys over the token, their lodging the upper one: as the inn's house -- js/inn.js In.ROOFS)

  // ---------------------------------------------------------------- where things are (x, r)
  SK.STONE = [18.5, 10];
  SK.TEMPLEWALLS = [[7, 14, 15, 18], [22, 14, 30, 18]]; // (x0 r0 x1 r1: each temple hall and its walls; SK.PILLARS and SK.HALLBENCH are set before the floor is carved, above)
  SK.ROOMSAT = { templeW: [8, 15, 14, 17], templeE: [23, 15, 29, 17], assay: [9, 19, 14, 21], guard: [23, 19, 28, 21], ledger: [11, 23, 14, 24], petition: [23, 23, 26, 24], hall: [16, 15, 21, 24], throne: [10, 26, 27, 30] }; // (x0 r0 x1 r1, PASS TWO)
  SK.LAMPS = [[16, 1, 'door'], [21, 1, 'door'], [15, 7, 'night'], [22, 7, 'night'], [15, 10, 'night'], [22, 10, 'night']]; // (11-12, his "not seeing the light sources on either side at the night scene": a lamp standard on each lamp's square -- the vault doors' burn always, the street's and the court's by night)
  SK.WHOLE = true;      // (the oathstone's middle: the Sunshaft's circle on MAPS.edifice, centre 29.5, 4.8 = local 18.5, 10.2)
  SK.DAIS = [14, 27, 23, 30]; // (the dais, x0 r0 x1 r1: drawn, not raised -- a step of height on the grid is ten feet)
  SK.CUT = [26, 17];          // (the Dormant's empty cut, in the hall's north wall over this square -- PASS TWO, 11-12)
  SK.WINDOW = [15, 3];        // (the lit window, high on the west store's face over this street square: Ásdís's -- over the lodging door since 11-12, the way up)
  SK.FOLK = [ // the first game's people who belong on this floor, with its looks (first/content/maps/solskaft.json), stood where the street puts them
    { id: 'pyro', at: [17, 1], dir: 'up', kind: 'trooper', sheet: 'pyro_p1' },     // (at the vault door, always -- CANON 07-24; 11-12, cutter-pyro: on his own town figure, pyro_p1, the art desk's ART-141 in all eight facings -- tools/pyro-town-sheet.py; his fight sheet pyro_p2 is his fights')
    { id: 'ketil', at: [20, 1], dir: 'up', kind: 'trooper' },                       // (beside him: "I stand beside him and count who goes by")
    { id: 'quartermaster', at: [6, 6], dir: 'down', kind: 'trooper' },              // (behind the quartermaster's counter, in the tollhouse)
    { id: 'yardhand', at: [33, 5], dir: 'up', kind: 'trooper' },                    // (by the stable's trough: his word is the wheel and the fountains)
    { id: 'shaftwatch', at: [21, 12], dir: 'left', kind: 'trooper' }                // (by the oathstone: his word is the light)
  ];

  // ---------------------------------------------------------------- the words: the first game's signs verbatim where it has them (first/content/maps/solskaft.json, solskaft_deep.json,
  // first/content/text.json); the seat's where it has none, and every door's "where it will go" (invented.json solskaft-street-floor)
  SK.S8 = {
    scales: 'The assay-scales, under a cloth. Nobody has lifted it in seventy years; the dust on it is even.',
    tariff: 'THE TARIFF. Ingots by the stamp, lead by the pig, litharge by the jar. Charcoal, timber, salt, tallow, rope and bone-ash down. The prices are in a coin with a king\'s face nobody uses now.',
    throne: 'The high seat of the Silversands, on its dais. Empty. He stands at the door.',
    oath: 'The oath-stone of the Silversands, directly below the empty seat. Every one of them put a hand here once; the band of gold is worn bright at hand height. At noon the light lands here.',
    hero: 'The hero-wall: the highway\'s dead, names cut in rows. Where a row stops short, a family stopped.',
    rekknar: 'Rekknar\'s ledger-stone. Every line on it balances.',
    dormant: 'A plain cut in the rock with nothing in it. The Dormant\'s.',
    mint: 'The mint. A warranted door, and the runes are whole. The king sealed it.',
    needles: 'The touch-needles, laid out in their order. When the assay here closed, Fountain Street had to learn to weigh.',
    weights: 'A locked case: the standard weights of the assay, dwarven-true, each in its cut. The key is not here.',
    brick: 'Brick, and a red mark cut across it. The old cut a shaft crew broke into, sixty years ago. The water went bad through here, and then the town burned.'
  };
  SK.LINES = {
    arrive: ['Sólskaft, inside the vault doors: main street runs straight back into the mountain -- the stores under the glass, the oathstone in the light, and past it, under the rock, the way to the throne.'],
    hello: 'Main street: the ramp down on the left, the stable on the right, the court and the oathstone ahead; past the arch the hallway, the temples and the rooms off it, and the throne room.',
    counter: 'The trade-counter: a cart going down the ramp paid here.',
    ledger: 'Ingrith\'s ledger-room: a desk, a lamp, and the ledger.',
    stable: 'The guest stable: stalls swept and ready, mangers empty. There is a little fodder, and it is old.',
    trough: 'The trough. Its water comes down from the cistern over the stable, the same as the fountains\' out front.',
    fodder: 'The fodder: a forkful or two, gone grey. Nobody has stabled a horse here in a long time.',
    window: 'Up over the west store, one window lit. Somebody lives in the lodging.',
    rekknarIn: 'Rekknar\'s temple: a hall of pillars, lamplit, the ledger-stone against the back wall; a door in its corner to the stair down.',
    dormantIn: 'The Dormant\'s temple: a hall of pillars, bare walls, a cut in the far one with nothing in it; a door at the back to the stair down.',
    assayIn: 'The assay house: the needles laid out, the weights locked away, nobody at the table.',
    hallBench: 'A stone bench along the hallway wall, where folk sat to wait on the high seat.',
    ledgerIn: 'Ingrith\'s ledger-room, off the hallway: a desk, a lamp, and the ledger.',
    petitionIn: 'The petitioners\' room: a bench along the wall, where folk waited to be called before the high seat. Nobody is waiting.',
    petitionBench: 'The petitioners\' bench, worn hollow in two places.',
    guardIn: 'The garrison\'s guardroom at the foot of their stair: a rack of spears, a bench, the stair going up into the rock.',
    rack: 'A rack of spears, every one oiled.',
    bench: 'A bench worn smooth by a season of waiting for the relief.',
    // (the assay house's other pieces, 11-12: the seat's words -- invented.json solskaft-assay-words)
    furnace: 'The muffle furnace, cold. Its iron door is shut on old grey ash.',
    balance: 'The assay balance in its glass case: a brass beam and two pans, hanging level. Nothing has been weighed on it in seventy years.',
    assayLedger: 'The standard ledger, shut on its lectern. Every mark the assay stamped is in it, and the house it stamped it for.', // (its own key since 11-12 PASS TWO: as `ledger` it had taken Ingrith's desk's line)
    buttons: 'Silver buttons in two rows, each cupelled and weighed, and three ingots with the assay\'s stamp -- left on the table the day it closed.',
    mark: 'The assayers\' mark, cut in a dressed panel: a balance over a mountain.',
    shelf: 'A shelf of clay crucibles and bone-ash cupels, dry, stacked, waiting for silver.'
  };
  // the doors that lead off this floor, drawn and marked: where each will go (none of them opens yet)
  SK.DOORS = [
    { id: 'vault', at: [[18, 0], [19, 0]], step: true, title: 'THE VAULT DOORS', say: ['Out through the vault doors: Fountain Street and the fountains.'], to: 'Silverton, the Gate Plaza at the Edifice\'s foot.', cross: true },
    { id: 'rampW', at: [[5, 1], [5, 2]], step: true, title: 'THE CART RAMP', say: ['The cart ramp goes down under the west stores: the wagon holding and the loading lane.'], to: 'the cart level.', go: ['solskaft_cart', 5, null, [-1, 0]] },
    { id: 'rampE', at: [[36, 6]], step: true, title: 'THE NARROW RAMP', say: ['The narrow ramp up from the cart road\'s loop, coming out beside the stable.'], to: 'the cart level.', go: ['solskaft_cart', 36, 7, [0, -1]] },
    { id: 'templeW', at: [[7, 13], [7, 14]], step: true, title: 'THE STAIR DOWN', say: ['Down from Rekknar\'s temple to the funerary.'], to: 'the funerary.', go: ['solskaft_below', 6, null, [0, 1]] },
    { id: 'templeE', at: [[30, 13], [30, 14]], step: true, title: 'THE STAIR DOWN', say: ['Down from the Dormant\'s temple to the funerary.'], to: 'the funerary.', go: ['solskaft_below', 31, null, [0, 1]] },
    { id: 'stair', at: [[28, 20], [28, 21]], step: true, title: 'THE GARRISON\'S STAIR', say: ['A stair up into the rock: the garrison\'s, to the armory and the quarters behind the waterfall.'], to: 'the garrison\'s floor behind the falls (not yet built).' },
    { id: 'storeW', at: [[14, 4], [14, 5]], title: 'A TRADE STORE', say: ['A trade store, shut. Get your wagon loaded downstairs while you shop upstairs -- when it is open.'], to: 'the store\'s floor (not yet built); its loading is on the cart level.' },
    { id: 'lodgeW', at: [[14, 3]], title: 'THE LODGING DOOR', say: ['The lodging door, the one lit window over it: somebody\'s home up there, up the stair inside.'], to: 'Ásdís Scalebeam\'s place over the west store.', go: ['solskaft_asdis', 2, 3, [1, 0], 'raw'] },
    { id: 'storeE', at: [[23, 4], [23, 5], [23, 6]], title: 'A STORE OF FINISHED GOODS', say: ['A store of finished and fashioned things, shut.'], to: 'the store\'s floor (not yet built); its loading is on the cart level.' },
  ];
  (function () { var S8 = SK.S8, Ln = SK.LINES, o = {}; o[S8.scales] = 'the scales'; o[S8.tariff] = 'the tariff board'; o[S8.throne] = 'the high seat'; o[S8.oath] = 'the oathstone'; o[S8.hero] = 'the hero-wall';
    o[S8.rekknar] = 'Rekknar\'s ledger-stone'; o[S8.dormant] = 'the Dormant\'s cut'; o[Ln.counter] = 'the trade-counter'; o[Ln.ledger] = 'the ledger desk'; o[Ln.trough] = 'the trough'; o[Ln.fodder] = 'the fodder'; o[Ln.window] = 'the lit window'; SK.LABEL = o; })();
  SK.L = function (k) { return D.counter && D.counter.L ? D.counter.L(k) : k; };
  SK.doorById = function (id) { return SK.DOORS.concat(SK.CDOORS || [], SK.BDOORS || [], SK.LDOORS || []).filter(function (z) { return z.id === id; })[0] || null; };
  SK.doorAt = function (x, r) { for (var i = 0; i < SK.DOORS.length; i++) if (SK.DOORS[i].at.some(function (q) { return q[0] === x && q[1] === r; })) return SK.DOORS[i]; return null; };
  SK.doorSay = function (d) {
    var c = SK.cdoorSay && SK.cdoorSay(d); if (c) return c;
    var said = d.say8 ? [SK.L(d.say8)] : d.id === 'mint' ? [SK.S8.mint] : d.id === 'assay' ? [SK.S8.needles] : d.say.slice();
    return ['{y}' + d.title + '{/}'].concat(said, ['{g}Where it goes: ' + d.to + '{/}']);
  };
  // the people's words: the first game's (content/npcs.json by T.say), and for the two whose first-game word is a scene, the line that stands when the scene is past
  SK.WORDS = {
    pyro: function () { return [SK.L('deep.pyro1'), '{g}(His meeting at the door is the story\'s scene, to come.){/}']; },
    quartermaster: function () { var s = ((DS.DATA || {}).shops || {}).qm || {}; return [s.greeting || '', '{g}(The garrison stores\' counter is to come.){/}']; }
  };

  // ---------------------------------------------------------------- the floor in the first game's shape (js/mines.js M.floor reads it): the light by the hour, the people, the squares' words
  SK.isDay = function (h) { return !M.night(h); };
  SK.lights = function (h) {
    var out = [], lamp = function (id, x, r, b, d) { out.push({ id: id, kind: 'map', x: x, y: SK.Y(r), bright: b || 10, dim: d || 10, color: 'fire', flame: true, seep: true }); };
    if (SK.isDay(h)) {
      out.push({ id: 'skBeam', kind: 'map', x: 18, y: SK.Y(10), bright: 15, dim: 25, color: 'bone', flame: false, seep: true });   // (the Sunshaft on the stone)
      out.push({ id: 'skBeam2', kind: 'map', x: 19, y: SK.Y(10), bright: 15, dim: 25, color: 'bone', flame: false, seep: true });
      [[18, 4], [12, 5], [25, 5], [18, 7]].forEach(function (q, i) { out.push({ id: 'skGlass' + i, kind: 'map', x: q[0], y: SK.Y(q[1]), bright: 10, dim: 20, color: 'bone', flame: false, seep: true }); }); // (the south stretch, open up to the orchard's floor: its light from the glass by day)
    } else { lamp('skCourtW', 15, 10); lamp('skCourtE', 22, 10); lamp('skStreetW', 15, 7); lamp('skStreetE', 22, 7); }
    lamp('skDoorW', 16, 1); lamp('skDoorE', 21, 1);                                   // (the vault doors' lamps)
    lamp('skToll', 5, 5, 5, 10); lamp('skLedger', 13, 24, 5, 5); lamp('skStable', 31, 4, 5, 10);
    lamp('skRekknar', 11, 16, 10, 10); lamp('skDormant', 26, 16, 10, 10); lamp('skAssayL', 12, 20, 5, 10); lamp('skGuardL', 25, 20, 5, 10); // (the halls and the rooms lamplit inside)
    [15, 19, 24].forEach(function (r) { lamp('skHallwayW' + r, 16, r, 5, 10); }); [15, 19, 24].forEach(function (r) { lamp('skHallwayE' + r, 21, r, 5, 10); }); // (the hallway under the rock: lamplight, day and night -- PASS TWO)
    lamp('skThrone', 18, 27, 10, 15); lamp('skHallW', 11, 27, 5, 10); lamp('skHallE', 26, 27, 5, 10);
    return out;
  };
  SK.LABEL = SK.LABEL || {}; // (the HUD's name for each sign by its words: js/roam.js R.USE_NAME)
  SK.sign = function (x, r, text) { var lb = SK.LABEL[text]; return { id: 'sign' + x + '_' + r, rect: [x, SK.Y(r), 1, 1], on: 'use', script: 'sk:sign', text: text, label: lb }; };
  SK.map = function (hour) {
    var trig = [], Y = SK.Y;
    trig.push(SK.sign(5, 6, SK.S8.scales), SK.sign(7, 7, SK.S8.tariff), SK.sign(18, 10, SK.S8.oath), SK.sign(19, 10, SK.S8.oath), SK.sign(18, 29, SK.S8.throne), SK.sign(19, 29, SK.S8.throne),
      SK.sign(8, 16, SK.S8.rekknar), SK.sign(SK.CUT[0], SK.CUT[1] + 1, SK.S8.dormant), SK.sign(12, 24, SK.LINES.ledger), SK.sign(33, 6, SK.LINES.trough), SK.sign(34, 5, SK.LINES.fodder));
    for (var x = 5; x <= 7; x++) trig.push(SK.sign(x, 3, SK.LINES.counter));
    SK.ASSAYLAY.forEach(function (p) { if (!p[3]) return; for (var i = 0; i < (p[4] || 1); i++) { var a = SK.assayAt(p[1] + i, p[2]); trig.push(SK.sign(a[0], a[1], SK.assayWord(p[3]))); } }); // (the assay house's pieces, 11-12)
    SK.ASSAYWALL.L.forEach(function (w) { var a = SK.assayAt(w[1], 3); trig.push(SK.sign(a[0], a[1], SK.assayWord(w[2]))); }); SK.ASSAYWALL.R.forEach(function (w) { var a = SK.assayAt(-1, w[1]); trig.push(SK.sign(a[0], a[1], SK.assayWord(w[2]))); });
    trig.push(SK.sign(23, 21, SK.LINES.rack), SK.sign(24, 21, SK.LINES.rack), SK.sign(25, 21, SK.LINES.rack), SK.sign(25, 19, SK.LINES.bench), SK.sign(26, 19, SK.LINES.bench));
    SK.HALLBENCH.forEach(function (b) { trig.push(SK.sign(b[0], b[1], SK.LINES.hallBench), SK.sign(b[0], b[1] + 1, SK.LINES.hallBench)); }); trig.push(SK.sign(24, 24, SK.LINES.petitionBench), SK.sign(25, 24, SK.LINES.petitionBench)); // (the hallway's benches, the petitioners' -- PASS TWO) // (the assay house and the guardroom; the hero-wall gone down to the funerary's north hallway, RE-CUT 11-11 night)
    trig.push({ id: 'skAssay', rect: [15, Y(20), 1, 1], on: 'step', script: 'sk:sign', text: SK.LINES.assayIn, once: true }, { id: 'skGuard', rect: [22, Y(20), 1, 1], on: 'step', script: 'sk:sign', text: SK.LINES.guardIn, once: true },
      { id: 'skLedgerIn', rect: [15, Y(23), 1, 1], on: 'step', script: 'sk:sign', text: SK.LINES.ledgerIn, once: true }, { id: 'skPetition', rect: [22, Y(23), 1, 1], on: 'step', script: 'sk:sign', text: SK.LINES.petitionIn, once: true });
    // (the lit window's signs gone 11-12: the window is over the lodging door, whose E names it -- "the one lit window over it" -- and a lamp standard stands at row 7)
    SK.DOORS.forEach(function (d) { d.at.forEach(function (q, i) { trig.push({ id: 'door_' + d.id + i, rect: [q[0], Y(q[1]), 1, 1], on: d.step ? 'step' : 'use', script: 'sk:door', door: d.id }); }); });
    trig.push({ id: 'skStable', rect: [31, Y(3), 1, 1], on: 'step', script: 'sk:sign', text: SK.LINES.stable, once: true },
      { id: 'skRekknar', rect: [15, Y(16), 1, 1], on: 'step', script: 'sk:sign', text: SK.LINES.rekknarIn, once: true },
      { id: 'skDormant', rect: [22, Y(16), 1, 1], on: 'step', script: 'sk:sign', text: SK.LINES.dormantIn, once: true });
    trig.forEach(function (t) { var d0 = t.door && SK.DOORS.filter(function (z) { return z.id === t.door; })[0], lb = t.label || (d0 && d0.title.toLowerCase().replace(/^(?!the )/, 'the ')); if (lb && D.roam && D.roam.USE_NAME) D.roam.USE_NAME[t.id] = lb; });
    var npcs = SK.FOLK.map(function (p) { return { id: p.id, x: p.at[0], y: Y(p.at[1]), look: p.id, dir: p.dir }; });
    return { id: SK.KEY, name: 'Sólskaft', rows: SK.ROWS.slice(), legend: SK.LEGEND, music: 'dungeon', exits: {}, dark: true, lights: SK.lights(hour), npcs: npcs, triggers: trig, chests: [] };
  };
  M.FLOORS[SK.KEY] = { src: SK.KEY, own: true, map: SK.map, door: 'solskaft', place: 'Sólskaft', sub: 'the street level: main street', save: true, clock: true, iso: true,
    rate: { squaresPerHour: 500, fightHours: 0.25 }, phase: M.seepPhase, phaseLine: function (h) { return M.night(h) ? 'Night in Sólskaft: the glass is dark, and the street goes by its lamps.' : 'Day on the glass: the light comes down the shaft onto the stone.'; },
    gates: { doors: [18, SK.Y(1), [0, -1]], court: [18, SK.Y(8), [0, -1]], crown: [18, SK.Y(15), [0, -1]], throne: [18, SK.Y(27), [0, -1]], rampW: [15, SK.Y(1), [1, 0]], rampE: [36, SK.Y(1), [0, 1]], templeW: [9, SK.Y(16), [-1, 0]], templeE: [28, SK.Y(16), [1, 0]] } }; // (save: false -- no way in from THE WORLD yet, so a SAVE here would have no door to stand the party at)
  // (the ramps stepped as the Keeper's flooded stair is, 11-11 night: SK.sheights / SK.cheights -- js/iso.js `heights`, a step a square at most, the grid walks it)
  SK.RAMPC = { 14: 3, 13: 2, 12: 1, 11: 0, 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0 }; // (the cart level's west ramp, 11-12: at the holding's and the lane's level from its foot, rising its last three squares to its head under the street -- it had stood three steps up the whole way past the lane, a ledge with its stair at the holding's end)
  SK.RAMPH = { w: { 14: 3, 13: 3, 12: 3, 11: 3, 10: 3, 9: 3, 8: 3, 7: 2, 6: 1, 5: 0 }, n: { 1: 3, 2: 3, 3: 2, 4: 1, 5: 1, 6: 0 } };
  SK.sheights = function () { return SK.ROWS.map(function (row, y) { var r = SK.H - 1 - y, out = ''; for (var x = 0; x < row.length; x++) { var h = 3; if ((r === 1 || r === 2) && x >= 5 && x <= 14) h = SK.RAMPH.w[x]; else if (x === 36 && r >= 2 && r <= 6) h = SK.RAMPH.n[r]; out += String(h); } return out; }); };
  SK.cheights = function () { return SK.CROWS.map(function (row, y) { var r = SK.H - 1 - y, out = ''; for (var x = 0; x < row.length; x++) { var h = 0; if ((r === 1 || r === 2) && x >= 5 && x <= 14) h = SK.RAMPC[x]; else if (x === 36 && r >= 2 && r <= 7) h = r === 7 ? 0 : SK.RAMPH.n[r]; out += String(h); } return out; }); };
  SK.isFloor = function (key) { return key === SK.KEY || key === SK.CART || key === 'solskaft_below' || key === 'solskaft_asdis'; };
  SK.CART = 'solskaft_cart';
  SK.folkOf = function (id) { return (SK.CFOLK_ALL ? SK.CFOLK_ALL() : SK.FOLK.concat(SK.CFOLK || [])).filter(function (p) { return p.id === id; })[0] || null; };
  SK.sheetOf = function (id) { var f = SK.folkOf(id); return f && f.sheet; };
  var floor0 = M.floor;
  M.floor = function (key, q, flags, hour) {
    var def = floor0.apply(this, arguments); if (!SK.isFloor(key)) return def;
    flags = flags || {};
    var cart = key === SK.CART, below = key === SK.BELOW, lodge = SK.isLodge && SK.isLodge(key);
    if (below) def.heights = SK.bheights(); else if (cart) def.heights = SK.cheights(); else if (key === SK.KEY) def.heights = SK.sheights(); // (the tiers a true heightmap: js/iso.js `heights`, a step a tier as the grid walks it)
    def.page = true;            // (paged: painted in pieces as the camera comes to it -- the weigh's measure, ~0 at the door; RULED 11-11, "7 - sounds good")
    def.ft = 5; def.stone = 'grey'; def.hud = 'Sólskaft'; def.where = function () { return SK.where(); };
    def.roofs = Object.assign({}, def.roofs, SK.ROOFS);
    def.under = def.rows.map(function (row) { return row.split('').map(function (c) { return 'kKwUWf'.indexOf(c) >= 0 ? '=' : ' '; }).join(''); }); // (the dressed stone under the things standing on it, as the inn's boards: js/iso.js `under`)
    def.people.forEach(function (p) { var f = SK.folkOf(p.id); if (f) p.kind = f.kind; });
    var h = hour != null ? hour : M.hourNow(q), first = !flags['seen:' + key]; flags['seen:' + key] = 1; // (the first-visit flag, by floor: the fog's small half -- seen:solskaft, seen:solskaft_cart)
    def.firstVisit = first;
    def.hello = ['{y}SÓLSKAFT{/} -- ' + (lodge ? SK.LODGE[key].name : below ? 'the funerary, under the oathstone' : cart ? 'the cart level' : 'the street level') + ', on the grid\'s diamonds (' + def.w + ' x ' + def.h + ' squares), ' + (W && W.todAt ? W.todAt(h) : '') + '.']
      .concat(first ? (lodge ? SK.LLINES.arrive : below ? SK.BLINES.arrive : cart ? SK.CLINES.arrive : SK.LINES.arrive) : [], [lodge ? SK.LLINES.hello : below ? SK.BLINES.hello : cart ? SK.CLINES.hello : SK.LINES.hello, '{g}Click to walk, or the arrows. E: a word, a door. O: the formation. L: the floor map.{/}']);
    return def;
  };
  // the HUD's place by where the party stands
  SK.where = function () {
    var t = D.roam && D.battle && D.battle.roam && D.battle.roam.token, key = D.roam && D.roam.def && D.roam.def.key; if (!t) return 'main street';
    var r = SK.H - 1 - t.y;
    if (SK.isLodge && SK.isLodge(key)) return SK.LODGE[key].name;
    if (key === SK.BELOW) return SK.where3(t);
    if (key === SK.CART) return r <= 7 && t.x <= 8 ? 'the wagon holding' : r <= 2 && t.x <= 14 ? 'the cart ramp' : t.x === 36 && r <= 6 ? 'the narrow ramp' : r <= 14 && t.x >= 9 && t.x <= 13 ? 'the west loading lane' : r <= 14 && t.x >= 24 && t.x <= 28 ? 'the east loading lane' : r <= 14 && t.x <= 8 ? 'the shroom farm' : r <= 14 && t.x >= 29 ? 'the road to the narrow ramp' : r <= 14 ? 'the road round the drum' : r <= 17 && t.x <= 30 ? 'the road behind the drum' : t.x >= 31 ? 'the highway\'s mouth' : t.x <= 10 ? 'the Forge-Father\'s temple' : t.x <= 22 ? 'the forge' : 'the smelters';
    if (r >= 13 && r <= 15 && (t.x === 7 || t.x === 30)) return 'the stair down';
    var rm = function (k) { var b = SK.ROOMSAT[k]; return t.x >= b[0] && t.x <= b[2] && r >= b[1] && r <= b[3]; }; // (PASS TWO, 11-12: the hallway and the rooms off it)
    if (r >= 15 && r <= 24) return rm('templeW') ? 'Rekknar\'s temple' : rm('templeE') ? 'the Dormant\'s temple' : rm('assay') ? 'the assay house' : rm('guard') ? 'the garrison\'s guardroom' : rm('ledger') ? 'Ingrith\'s ledger-room' : rm('petition') ? 'the petitioners\' room' : 'the hallway, under the rock';
    return r <= 0 ? 'the vault doors' : r <= 7 ? (t.x <= 9 && r >= 3 ? 'the tollhouse' : t.x >= 28 && r >= 3 ? 'the guest stable' : 'main street, under the glass') : r <= 14 ? 'the court of the oathstone' : 'the throne room';
  };
  // the people's figures: the garrison's trooper and sergeant (data/foes.js), Pyro his own town figure (pyro_p1, 11-12; his fight sheet js/classes.js pyro_p2)
  var people0 = T.people;
  T.people = function (B) {
    people0.apply(this, arguments);
    var def = D.roam && D.roam.def; if (!def || !SK.isFloor(def.key)) return;
    var want = [];
    B.units.forEach(function (u) { var sh = typeof u.npc === 'string' && SK.sheetOf(u.npc); if (sh && (!D.SHEETS || D.SHEETS[sh] !== undefined || true)) { u.sheet = sh; want.push(sh); } });
    if (want.length && D.spr && D.spr.prefetch) D.spr.prefetch(want);
  };
  // a word with one of them: the first game's, or the standing line for the two whose first word is a scene
  var fire0 = T.fire;
  T.fire = function* (B, trig) {
    var def = D.roam.def;
    if (def && SK.isFloor(def.key) && trig.town === 'talk' && (SK.WORDS[trig.npc] || trig.npc === 'asdis') && !(SK.DWARF && SK.DWARF[trig.npc] && D.counter && D.counter.takes(trig.npc))) { // (a dwarf in costume: the counter's screen, below)
      if (trig.npc === 'asdis' && SK.asdisTalk) { yield* SK.asdisTalk(B, B.units.filter(function (x) { return x.npc === 'asdis'; })[0]); return; } // (her offer, the first game's way)
      var u = B.units.filter(function (x) { return x.npc === trig.npc; })[0], t = B.roam.token;
      if (u && !u.holdFacing) u.facing = D.spr.facingFor(t.x - u.x, t.y - u.y);
      if (trig.npc === 'pyro' && D.counter && D.counter.takes('pyro') && D.SHEETS && D.SHEETS.pt_pyro) { yield* D.counter.talk(B, 'pyro'); return; } // (11-12, the inn seat on the lanes desk's relay: the king's word on his talking portrait, pt_pyro -- js/counter.js C.VENDORS.pyro)
      B.card(D.roam.wrap(['{y}' + (u ? u.name : trig.npc) + '{/}'].concat(SK.WORDS[trig.npc]())), 420); D.sfx('popup'); yield 20; return;
    }
    yield* fire0.apply(this, arguments);
  };
  // Pyro's word on his face (js/counter.js C.talk): the line grave -- "a compliment, and a warning" -- then the note that his meeting is to come, attentive
  if (D.counter && D.counter.SCRIPTS) D.counter.SCRIPTS.pyro = function* (sc) { var w = SK.WORDS.pyro(); yield sc.say([w[0]], 'grave'); yield sc.say([w[1]], 'attentive'); };
  // the squares: the signs, and the doors that say where they will go (a step onto a way off steps back)
  var trigger0 = M.trigger;
  M.trigger = function* (B, trig, at) {
    var s = trig.script; if (!/^sk:/.test(s || '')) { yield* trigger0.apply(this, arguments); return; }
    var say = [];
    if (s === 'sk:sign') say = trig.lines ? trig.lines.slice() : trig.text8 ? [SK.L(trig.text8)] : [trig.text || ''];
    else if (s === 'sk:niche') { var nn = SK.NICHE[trig.niche]; if (nn) say = SK.nicheSay(nn); }
    else if (s === 'sk:door') {
      var d = SK.doorById(trig.door);
      if (d && d.go && M.FLOORS[d.go[0]]) { var t = B.roam.token, rr = d.go[2] == null ? SK.H - 1 - t.y : d.go[2]; SK.lastSaid = d.title; yield* M.go(B, d.go[0], [d.go[1], d.go[4] === 'raw' ? d.go[2] : SK.Y(rr)], d.go[3]); return; } // (a ramp between the floors built: down or up it, on the same row of the ramp where it is two wide)
      if (d && d.cross) { yield* SK.toTown(B); return; }
      if (d) say = SK.doorSay(d); if (trig.on === 'step') M.stepBack(B);
    }
    if (!say.length) return;
    SK.lastSaid = say.join(' ');
    D.sfx('popup'); B.card(D.roam.wrap(say), 360); yield 20;
  };

  // ---------------------------------------------------------------- the code pieces on the diamonds (grey-box: no art desk tiles on the diamonds, RULED 10-29): the oathstone on its
  // pedestal and the beam on it by day, the throne on its dais, Rekknar's stone, the Dormant's cut, the scales under their cloth, the counters, the mangers, the ramps' chevrons,
  // the store fronts shuttered and the one lit window, the doors marked
  var TW = 64, TH = 32;
  var P = function (ox, oy, u, v, z) { return [ox + (u - v) * TW / 2, oy + (u + v) * TH / 2 - (z || 0)]; };
  var rgb = function (c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')'; };
  var poly = function (cx, pts, col) { cx.beginPath(); pts.forEach(function (p, i) { if (i) cx.lineTo(Math.round(p[0]), Math.round(p[1])); else cx.moveTo(Math.round(p[0]), Math.round(p[1])); }); cx.closePath(); cx.fillStyle = col; cx.fill(); };
  // a box from (u0, v0) to (u1, v1) squares off the anchor's middle, z0 to z1 px up: its top and its two near faces
  var box = function (cx, ox, oy, u0, v0, u1, v1, z0, z1, ramp, lt, noTop) {
    lt = lt || [0.85, 0.55, 0.4];
    var R = function (f) { return rgb(ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(f * (ramp.length - 1))))]); };
    poly(cx, [P(ox, oy, u1, v0, z0), P(ox, oy, u1, v1, z0), P(ox, oy, u1, v1, z1), P(ox, oy, u1, v0, z1)], R(lt[1]));   // (the +u face)
    poly(cx, [P(ox, oy, u0, v1, z0), P(ox, oy, u1, v1, z0), P(ox, oy, u1, v1, z1), P(ox, oy, u0, v1, z1)], R(lt[2]));   // (the +v face)
    if (!noTop) poly(cx, [P(ox, oy, u0, v0, z1), P(ox, oy, u1, v0, z1), P(ox, oy, u1, v1, z1), P(ox, oy, u0, v1, z1)], R(lt[0]));   // (the top)
  };
  var canvas = function (w, h) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  SK.pic = {
    lamp: function (lit) { // (a lamp standard: a post of dressed stone, the lamp on it lit or dark -- the art desk's temple lamp when it has come, js/skart.js)
      var cv = canvas(64, 110), cx = cv.getContext('2d'), ox = 32, oy = 86, st = D.iso.ramp('stone');
      box(cx, ox, oy, -0.12, -0.12, 0.12, 0.12, 0, 56, st, [0.8, 0.55, 0.4]); box(cx, ox, oy, -0.2, -0.2, 0.2, 0.2, 56, 62, st);
      cx.fillStyle = lit ? 'rgb(255,214,120)' : 'rgb(60,56,52)'; var c = P(ox, oy, 0, 0, 70); cx.fillRect(Math.round(c[0]) - 3, Math.round(c[1]) - 4, 6, 7);
      return { canvas: cv, ax: ox, ay: oy };
    },
    pillar: function () { // (a temple's pillar: a squared column of dressed stone, a plinth and a capital)
      var cv = canvas(64, 150), cx = cv.getContext('2d'), ox = 32, oy = 126, st = D.iso.ramp('stone');
      box(cx, ox, oy, -0.3, -0.3, 0.3, 0.3, 0, 8, st); box(cx, ox, oy, -0.2, -0.2, 0.2, 0.2, 8, 100, st, [0.9, 0.65, 0.45]); box(cx, ox, oy, -0.3, -0.3, 0.3, 0.3, 100, 108, st);
      return { canvas: cv, ax: ox, ay: oy };
    },
    oathstone: function () { // (a pedestal two squares wide, the stone on it, a band of gold worn bright at hand height)
      var cv = canvas(160, 140), cx = cv.getContext('2d'), ox = 80, oy = 104, st = D.iso.ramp('stone'), gd = D.iso.ramp('gold') || st;
      box(cx, ox, oy, -0.9, -0.42, 0.9, 0.42, 0, 10, st);
      box(cx, ox, oy, -0.42, -0.26, 0.42, 0.26, 10, 46, st, [0.95, 0.7, 0.5]);
      box(cx, ox, oy, -0.43, -0.27, 0.43, 0.27, 24, 28, gd, [0.95, 0.8, 0.6], true); // (the band round it, its faces only)
      return { canvas: cv, ax: ox, ay: oy };
    },
    beam: function () { // (the Sunshaft's light down onto the stone: a column of pale light with motes in it -- the weigh's cheap stand-in, as the first game drew it)
      var cv = canvas(120, 330), cx = cv.getContext('2d'), ox = 60, oy = 300;
      var gr = cx.createLinearGradient(0, 0, 0, oy); gr.addColorStop(0, 'rgba(255,248,220,0)'); gr.addColorStop(0.35, 'rgba(255,248,220,0.10)'); gr.addColorStop(1, 'rgba(255,246,210,0.28)');
      cx.fillStyle = gr; cx.fillRect(ox - 34, 0, 68, oy - 8);
      cx.fillStyle = 'rgba(255,246,210,0.22)'; cx.beginPath(); cx.ellipse(ox, oy - 4, 56, 26, 0, 0, Math.PI * 2); cx.fill();
      for (var i = 0; i < 26; i++) { var hx = D.iso.noise.h2(i, 3, 11), hy = D.iso.noise.h2(i, 7, 11); cx.fillStyle = 'rgba(255,250,230,' + (0.35 + hx * 0.4).toFixed(2) + ')'; cx.fillRect(Math.round(ox - 30 + hx * 60), Math.round(20 + hy * (oy - 40)), 1, 1); }
      return { canvas: cv, ax: ox, ay: oy };
    },
    throne: function () { // (the high seat on its dais: a stone chair with a tall back, two squares wide)
      var cv = canvas(160, 160), cx = cv.getContext('2d'), ox = 80, oy = 124, st = D.iso.ramp('stone'), sv = D.iso.ramp('silver') || st;
      box(cx, ox, oy, -0.7, -0.35, 0.7, 0.35, 0, 14, st);                    // (the seat's block)
      box(cx, ox, oy, -0.7, -0.45, 0.7, -0.25, 14, 64, st, [0.9, 0.6, 0.45]); // (its back, to the north)
      box(cx, ox, oy, -0.8, -0.35, -0.6, 0.35, 14, 28, sv); box(cx, ox, oy, 0.6, -0.35, 0.8, 0.35, 14, 28, sv); // (its arms)
      return { canvas: cv, ax: ox, ay: oy };
    },
    dais: function (w, d) { // (the dais drawn on the floor: a pale slab with a dark edge, w by d squares, anchored on its far corner)
      var cv = canvas((w + d) * TW / 2 + 4, (w + d) * TH / 2 + 12), cx = cv.getContext('2d'), ox = d * TW / 2 + 2, oy = 6, st = D.iso.ramp('stone');
      poly(cx, [P(ox, oy, 0, 0, 0), P(ox, oy, w, 0, 0), P(ox, oy, w, d, 0), P(ox, oy, 0, d, 0)], rgb(st[st.length - 2], 0.55));
      poly(cx, [P(ox, oy, 0, d, 0), P(ox, oy, w, d, 0), P(ox, oy, w, d, -4), P(ox, oy, 0, d, -4)], rgb(st[1], 0.9));
      poly(cx, [P(ox, oy, w, 0, 0), P(ox, oy, w, d, 0), P(ox, oy, w, d, -4), P(ox, oy, w, 0, -4)], rgb(st[2], 0.9));
      return { canvas: cv, ax: ox, ay: oy };
    },
    stele: function () { // (Rekknar's ledger-stone: a slab with its lines cut)
      var cv = canvas(64, 110), cx = cv.getContext('2d'), ox = 32, oy = 86, st = D.iso.ramp('stone');
      box(cx, ox, oy, -0.35, -0.12, 0.35, 0.12, 0, 56, st, [0.95, 0.75, 0.5]);
      cx.fillStyle = rgb(st[1]); for (var i = 0; i < 6; i++) { var a = P(ox, oy, -0.28, 0.12, 12 + i * 7), b = P(ox, oy, 0.28, 0.12, 12 + i * 7); cx.fillRect(Math.round(a[0]), Math.round(a[1]), Math.round(b[0] - a[0]), 1); }
      return { canvas: cv, ax: ox, ay: oy };
    },
    cut: function () { // (the Dormant's: a plain cut in the back wall with nothing in it -- a dark slot on the north face)
      var cv = canvas(64, 128), cx = cv.getContext('2d'), ox = 32, oy = 104, dk = D.iso.ramp('outline')[0];
      poly(cx, [P(ox, oy, -0.2, -0.5, 14), P(ox, oy, 0.2, -0.5, 14), P(ox, oy, 0.2, -0.5, 70), P(ox, oy, -0.2, -0.5, 70)], rgb(dk));
      return { canvas: cv, ax: ox, ay: oy };
    },
    scales: function () { // (the assay-scales under their cloth: a grey draped shape on a bench)
      var cv = canvas(64, 80), cx = cv.getContext('2d'), ox = 32, oy = 56, st = D.iso.ramp('stone'), bn = D.iso.ramp('bone');
      box(cx, ox, oy, -0.35, -0.3, 0.35, 0.3, 0, 12, D.iso.ramp('leather'));
      box(cx, ox, oy, -0.25, -0.2, 0.25, 0.2, 12, 26, bn, [0.6, 0.45, 0.35]);
      return { canvas: cv, ax: ox, ay: oy };
    },
    chevron: function (dir) { // (a ramp's run, going down: pale chevrons pointing the way down)
      var cv = canvas(TW, TH + 2), cx = cv.getContext('2d'), ox = TW / 2, oy = TH / 2 + 1, bn = D.iso.ramp('stone');
      cx.strokeStyle = rgb(bn[bn.length - 1], 0.45); cx.lineWidth = 1;
      [-0.2, 0.15].forEach(function (k) {
        var a, b, c; if (dir === 'w') { a = P(ox, oy, k + 0.2, -0.3); b = P(ox, oy, k - 0.1, 0); c = P(ox, oy, k + 0.2, 0.3); } else { a = P(ox, oy, -0.3, k + 0.2); b = P(ox, oy, 0, k - 0.1); c = P(ox, oy, 0.3, k + 0.2); }
        cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(b[0], b[1]); cx.lineTo(c[0], c[1]); cx.stroke();
      });
      return { canvas: cv, ax: ox, ay: oy };
    },
    face: function (kind, side) { // (on a square's back face -- 'w' its west, 'n' its north -- a door shut, a shutter, a window lit or dark, the hero-wall's rows of names)
      var cv = canvas(TW, 170), cx = cv.getContext('2d'), ox = TW / 2, oy = 150, wd = D.iso.ramp('leather'), dk = D.iso.ramp('outline')[0], st = D.iso.ramp('stone');
      var Q = function (t, z) { return side === 'n' ? P(ox, oy, t - 0.5, -0.5, z) : P(ox, oy, -0.5, t - 0.5, z); };
      var rect = function (t0, t1, z0, z1, col) { poly(cx, [Q(t0, z0), Q(t1, z0), Q(t1, z1), Q(t0, z1)], col); };
      if (kind === 'door') { rect(0.18, 0.82, 0, 50, rgb(wd[1])); rect(0.22, 0.78, 3, 47, rgb(wd[2])); rect(0.66, 0.72, 22, 26, rgb(D.iso.ramp('gold') ? D.iso.ramp('gold')[2] : st[3])); }
      else if (kind === 'sealed') { rect(0.18, 0.82, 0, 50, rgb(st[2])); rect(0.22, 0.78, 3, 47, rgb(st[3])); for (var i = 0; i < 4; i++) rect(0.3 + i * 0.12, 0.36 + i * 0.12, 18, 30, rgb(D.iso.ramp('gold') ? D.iso.ramp('gold')[3] : st[5])); }
      else if (kind === 'shutter') { rect(0.08, 0.92, 4, 40, rgb(wd[1])); for (var j = 0; j < 6; j++) rect(0.08, 0.92, 8 + j * 5, 9 + j * 5, rgb(wd[0])); }
      else if (kind === 'lit') { rect(0.3, 0.7, 52, 70, rgb(dk)); rect(0.34, 0.66, 54, 68, 'rgb(255,206,110)'); rect(0.49, 0.51, 54, 68, rgb(wd[1])); }
      else if (kind === 'dark') { rect(0.3, 0.7, 52, 70, rgb(dk)); rect(0.34, 0.66, 54, 68, rgb(st[1])); }
      else if (kind === 'names') { for (var k = 0; k < 6; k++) for (var n = 0; n < 5; n++) { var l = D.iso.noise.h2(k, n, 23); if (l < 0.2) continue; rect(0.08 + n * 0.17, 0.08 + n * 0.17 + 0.05 + l * 0.08, 10 + k * 7, 11 + k * 7, rgb(st[st.length - 2], 0.8)); } }
      return { canvas: cv, ax: ox, ay: oy };
    }
  };
  // the pieces laid on the floor's squares when it loads (as js/mines.js M.isoDress lays the first game's things)
  var load0 = D.iso.load;
  D.iso.load = function (def) {
    var m = load0.apply(this, arguments); if (!def || !SK.isFloor(def.key)) return m;
    var lazy = !!def.page, Y = SK.Y, add = function (p, f) { if (lazy) p.make = f; else p.img = f(); m.props.push(p); };
    var sq = function (x, r) { return m.at(x, Y(r)); }, off = function (s, name) { if (!s) return; s.stands = name; m.props = m.props.filter(function (p) { return p.sq !== s || p.kind !== 'block'; }); };
    var piece = function (x, r, f, o) { var s = sq(x, r); if (!s) return; o = o || {}; add({ kind: o.kind || 'sk', sq: s, depth: s.x + s.y + (o.d || 0.5), gz: s.gz, fx: o.fx, fy: o.fy, layer: o.layer }, f); };
    if (def.key === SK.CART) { SK.dressCart(m, def, sq, off, piece, add); m.sorted = null; return m; }
    if (def.key === SK.BELOW) { SK.dressBelow(m, def, sq, off, piece, add); m.sorted = null; return m; }
    if (SK.isLodge(def.key)) { m.sorted = null; return m; } // (the lodging: the grid's own beds and table, the hearth's fire -- code-drawn till ART-138)
    // the oathstone on its pedestal, and the beam on it by day
    off(sq(18, 10), 'the oathstone'); off(sq(19, 10), 'the oathstone');
    piece(18, 10, SK.pic.oathstone, { fx: 19, fy: Y(10) + 0.5, d: 1.5 });
    if (def.skDay) piece(18, 10, SK.pic.beam, { fx: 19, fy: Y(10) + 0.5, d: 1.7 });
    // the throne on its dais
    off(sq(18, 29), 'the high seat'); off(sq(19, 29), 'the high seat');
    var dz = sq(SK.DAIS[0], SK.DAIS[3]); if (dz) add({ kind: 'decal', sq: dz, depth: dz.x + dz.y - 0.6, gz: dz.gz, layer: -1 }, function () { return SK.pic.dais(SK.DAIS[2] - SK.DAIS[0] + 1, SK.DAIS[3] - SK.DAIS[1] + 1); });
    piece(18, 29, SK.pic.throne, { fx: 19, fy: Y(29) + 0.5, d: 1.5 });
    off(sq(8, 16), 'Rekknar\'s ledger-stone'); piece(8, 16, SK.pic.stele);
    SK.PILLARS.forEach(function (q) { off(sq(q[0], q[1]), 'a pillar'); piece(q[0], q[1], SK.pic.pillar); });
    if (SK.WHOLE) SK.TEMPLEWALLS.forEach(function (b) { for (var x2 = b[0]; x2 <= b[2]; x2++) for (var r2 = b[1]; r2 <= b[3]; r2++) { var w2 = sq(x2, r2); if (w2 && !w2.open && w2.rock === 'near') { w2.rock = 'far'; w2.skWhole = true; } } }); // (the temples' walls whole: the draw cut any wall with open floor behind it to a stub, and the halls read as roofless yards -- 'far' stands it whole, the occluder (js/roam.js R.occlude) still opening it while it hides the party)
    piece(SK.CUT[0], SK.CUT[1], SK.pic.cut, { d: -0.4 });
    off(sq(5, 6), 'the scales'); piece(5, 6, SK.pic.scales);
    SK.LAMPS.forEach(function (q) { off(sq(q[0], q[1]), 'a lamp'); piece(q[0], q[1], function () { return SK.pic.lamp(q[2] === 'door' || !def.skDay); }); });
    // the ramps' runs
    for (var x = 6; x <= 14; x++) [1, 2].forEach(function (r) { var s = sq(x, r); if (s) add({ kind: 'decal', sq: s, depth: s.x + s.y, gz: s.gz, layer: -1 }, function () { return SK.pic.chevron('w'); }); });
    for (var r = 2; r <= 5; r++) { var s2 = sq(36, r); if (s2) add({ kind: 'decal', sq: s2, depth: s2.x + s2.y, gz: s2.gz, layer: -1 }, function () { return SK.pic.chevron('n'); }); }
    // the faces: the west store's front shuttered and its lodging's windows (one lit), the lodging door; the crown's west wall -- the hero-wall and the three doors
    [4, 5].forEach(function (r) { piece(15, r, function () { return SK.pic.face('shutter', 'w'); }, { d: -0.4 }); });
    [3, 4, 5, 7].forEach(function (r) { piece(15, r, function () { return SK.pic.face('dark', 'w'); }, { d: -0.35 }); });
    piece(SK.WINDOW[0], SK.WINDOW[1], function () { return SK.pic.face('lit', 'w'); }, { d: -0.35 });
    piece(15, 3, function () { return SK.pic.face('door', 'w'); }, { d: -0.4 });
    // (the lodging's outside stair taken away 11-12 -- his "staircase to no-where next to pyro": its head met a blank wall; the way up is the lodging door, the lit window over it)
    m.sorted = null;
    return m;
  };
  // the day on the floor's def (the beam's prop, by the hour): read where the floor is made
  var floor1 = M.floor;
  M.floor = function (key, q, flags, hour) { var def = floor1.apply(this, arguments); if (SK.isFloor(key)) def.skDay = SK.isDay(hour != null ? hour : M.hourNow(q)); return def; };

  // ================================================================ THE CART LEVEL (11-11, the same seat, piece 2): fifteen feet under the street, the same squares (x, r) as the street's
  // so a thing over a thing stands over it -- his pour: "the ramp goes down to the basement level of the stores on the left (get your wagon loaded downstairs while you shop
  // upstairs) - so a wagon holding area further west of the ramp, where they pull out into the 'loading' lane once their merchants start ordering"; "The path of the ramp would
  // lead around it ... the forge probably behind/under the funery - with the road working in as a second import lane"; "The East Side stores ... with similar lower level wagon
  // loadings as the ramp-road circles around and out"; "we'll need a more narrow ramp up on the east side"; "walled drum with carvings and such we'll probably art dept".
  //   the west ramp's foot at its west end, the wagon holding in the front-west corner under the tollhouse (the stack his "that's front-west" asked after, PROPOSED 11-11);
  //   the west loading lane north under the west store, hoist-traps to it overhead; the road round the carved drum under the court (a wall: nothing of the funerary is seen
  //   through it); behind it the forge with the Copperbottom smith and the armory's racks, the Forge-Father's temple west of it, the cold smelters and the cupel-hearth east;
  //   the highway's mouth at the north-east, its gate shut and the ledger-lamp rack by it, the boarded trade hall on its west side, joining the road behind the drum as the
  //   second import lane; the east loading lane south under the east store, and the road east to the foot of the narrow ramp up at the east wall.
  //   In the dark off the west lane, the shroom farm (the realm page's PROPOSED placement).
  //   NOT here: the dead lifts lower down -- where they stand is OPEN (his "lower down lifts wouldn't have been used for forever (silver up to smelting?)"); the stairs down
  //   to the funerary -- OPEN; the drill running the loop -- the story's.
  SK.cbuild = function () {
    var g = [], x, Y = SK.Y;
    for (var y = 0; y < SK.H; y++) { g.push([]); for (x = 0; x < SK.W; x++) g[y].push('#'); }
    var set = function (x0, r0, x1, r1, c) { for (var rr = r0; rr <= r1; rr++) for (var xx = x0; xx <= x1; xx++) g[Y(rr)][xx] = c; };
    // the west ramp, under the street's: its foot at the west end, rising east to its head under the street's doors-side end
    set(5, 1, 5, 2, '='); set(6, 1, 13, 2, 'v'); set(14, 1, 14, 2, 'U');
    // the wagon holding, front-west, under the tollhouse
    set(1, 1, 4, 2, '='); set(1, 3, 8, 7, '=');
    set(2, 5, 4, 5, 'W'); set(7, 7, 8, 7, 'k');                   // (one wagon waiting, under its cover; crates)
    // the west loading lane, under the west store, and the road north round the drum
    set(9, 3, 13, 14, '=');
    // the drum under the court: a ring of carved wall, the road round it
    set(14, 7, 23, 14, '=');
    [[7, 16, 21], [8, 15, 22], [9, 14, 23], [10, 14, 23], [11, 14, 23], [12, 14, 23], [13, 15, 22], [14, 16, 21]].forEach(function (q) { set(q[1], q[0], q[2], q[0], 'Q'); });
    // the east loading lane, under the east store
    set(24, 3, 28, 14, '=');
    // the road behind the drum (north)
    set(5, 15, 30, 17, '=');
    // the road east to the narrow ramp's foot, and the ramp up at the east wall (its head under the street's apron)
    set(29, 7, 35, 8, '='); set(36, 7, 36, 8, '='); set(36, 3, 36, 6, 'v'); set(36, 2, 36, 2, 'U');
    // the shroom farm, in the dark off the west lane
    set(2, 9, 4, 13, 'n'); set(3, 8, 3, 8, 'D');            // (narrowed 11-11, piece 3: the west temple's stair goes down through the rock at x 5, r 11-12 -- nothing of it seen from the road)
    // the Forge-Father's temple, west of the forge
    set(2, 19, 10, 24, '='); set(6, 18, 6, 18, 'D'); set(6, 24, 6, 24, 'A');
    // the forge, and the armory's racks on its west wall
    set(13, 19, 22, 25, '='); set(16, 18, 19, 18, 'D');
    set(17, 25, 18, 25, 'b'); set(17, 22, 17, 22, 'A'); set(13, 20, 13, 24, 'S');
    // the smelters and the cupel-hearth, cold
    set(24, 19, 29, 25, '='); set(26, 18, 26, 18, 'D');
    set(25, 25, 27, 25, 'F'); set(29, 21, 29, 21, 'C');
    set(28, 23, 29, 24, 'H');                                     // the dead lift, an old shaft beside the smelters (RULED 11-11, lean 3)
    // the highway's mouth: the lane north from the road, the gate across it, the road beyond going away into the dark
    set(31, 15, 34, 25, '='); set(31, 26, 34, 26, 'G'); set(31, 27, 34, 30, '=');
    return g.map(function (row) { return row.join(''); });
  };
  SK.CROWS = SK.cbuild();
  SK.CLEGEND = { '#': 'dwarfWall', '=': 'dwarfFloor', D: 'doorway', v: 'skRamp', U: 'skStair', W: 'skWagon', k: 'crate', Q: 'skDrum', n: 'fungus', A: 'skAnvil', b: 'firepit',
    S: 'skRack', F: 'skFurnace', C: 'skCupel', G: 'skGate', H: 'skLift' };
  Object.assign(M.LAY, { skWagon: ['W'], skDrum: ['#'], skAnvil: ['k'], skRack: ['S'], skFurnace: ['k'], skCupel: ['k'], skGate: ['f'], skLift: ['k'] });
  SK.CFOLK = [
    { id: 'smith', at: [19, 22], dir: 'left', kind: 'trooper' },            // (the Copperbottom smith at the forge -- "AT THE FORGE" on the family's bar)
    { id: 'smelterhand', at: [27, 23], dir: 'down', kind: 'trooper' },      // (sweeping the cold smelters: "Orders.")
    { id: 'gatewatch', at: [33, 24], dir: 'down', kind: 'trooper' },        // (the gate watch, inside the highway's gate)
    { id: 'shroomer', at: [4, 11], dir: 'down', kind: 'trooper' },          // (in the shroom farm's dark)
    // the drill, down in the wagon holding by its lamp (moved 11-12 off the street's apron, where it shut the way to the narrow ramp -- his "they could drill down here by the
    // wagon and mysterious glow (3, 28)-ish"; it had stood by the tollhouse and the stables, CANON 11-11)
    { id: 'drill1', at: [1, 3], dir: 'right', kind: 'trooper' }, { id: 'drill2', at: [3, 3], dir: 'right', kind: 'trooper' },
    { id: 'drill3', at: [1, 4], dir: 'right', kind: 'trooper' }, { id: 'drill4', at: [3, 4], dir: 'right', kind: 'trooper' },
    { id: 'drillmaster', at: [5, 4], dir: 'left', kind: 'drillsergeant' }
  ];
  // THE GENERIC DWARF (11-12, the Ingrith cutter on the lanes desk's relay; art-wanted section 54, his "include a 'generic dwarf' like we did for generic NPC, various
  // costumes"): the art desk's ART-141-DWARF, one face, each of Solskaft's unnamed in the costume of the job they stand at -- pt_dwarf (tools/portrait-sheet.py dwarf),
  // its still held the whole talk on the counter's screen, the generic man's way (js/counter.js C.GENERIC: added here, not there); their word the first game's as before
  // (C.words), the quartermaster's his standing line (SK.WORDS). Those who are not soldiers walk on the dwarf's own town figure, folkdwarf_p1 (tools/folkdwarf-town-sheet.py);
  // the drill and the gate watch keep the garrison's. Ketil is named and keeps his card. Drawn looking screen left: mirrored on the left (C.FACES_LEFT)
  SK.DWARF = { quartermaster: 'quartermaster', yardhand: 'yardhand', shaftwatch: 'shaftwatch', smith: 'smith', smelterhand: 'smelter', gatewatch: 'gatewatch', shroomer: 'shroom',
    drill1: 'trooper', drill2: 'trooper', drill3: 'trooper', drill4: 'trooper', drillmaster: 'sergeant' };
  SK.DWARFWALK = ['quartermaster', 'yardhand', 'shaftwatch', 'smith', 'smelterhand', 'shroomer'];
  SK.FOLK.concat(SK.CFOLK).forEach(function (p) { if (SK.DWARFWALK.indexOf(p.id) >= 0 && !p.sheet) p.sheet = 'folkdwarf_p1'; });
  (function () {
    var C = D.counter; if (!C || !C.VENDORS) return;
    Object.keys(SK.DWARF).forEach(function (id) { if (!C.VENDORS[id]) C.VENDORS[id] = { sheet: 'pt_dwarf', look: SK.DWARF[id], wait: '' }; });
    if (C.FACES_LEFT) C.FACES_LEFT.pt_dwarf = 1;
    var words0 = C.words; // (a dwarf with a standing line of the floor's own says it on the counter's screen, as on his card)
    C.words = function (B, id) { return SK.DWARF[id] && SK.WORDS[id] ? SK.WORDS[id]() : words0.apply(this, arguments); };
  })();
  SK.CS8 = { // (the first game's words, verbatim: first/content/maps/solskaft_deep.json, solskaft.json)
    smelters: 'The smelters. Cold a long time. The slag-tip beside them has grown a skin of moss.',
    cupel: 'The cupel-hearth: a shallow bowl of bone-ash. This is where silver is parted from lead. The ash came from the knacker\'s yard across the river, once.',
    rack: 'The ledger-lamp rack. Three hooks, three lamps: one for each station down the road.',
    trade: 'The trade hall. NO SURFACE FOLK PAST THIS DOOR, cut in the lintel. The boards are nailed from this side.',
    anvil: 'The Forge-Father\'s niche: an anvil, worn to a saddle in the middle.',
    shrooms: 'The shroom farm: beds of spent ore-dust and dung in the dark, the caps pale in a hooded lamp. This is what Solskaft actually eats.'
  };
  SK.CLINES = {
    arrive: ['Under the street: the cart road. It comes down the ramp past the wagon holding, runs north under the stores, goes round a great carved drum, and comes back by the narrow ramp on the east.'],
    hello: 'The cart road: the ramp up at the head of the lane, the holding, the drum, the forge and the smelters behind it, the highway\'s gate in the north-east, the narrow ramp up on the east.',
    holding: 'The wagon holding: room for a dozen wagons to wait their turn. One is here, its cover lashed down.',
    trap: 'A hoist-trap overhead: the store above loads through it. Shut.',
    drum: 'A great drum of dressed stone, the road bending round it, carved its whole length. No door in it on this side.',
    forge: 'The forge: the one fire lit down here, the armory\'s racks along the wall.',
    rackArm: 'The armory\'s racks: splint and chain, axes and hammers, dwarven-made.',
    forgeAnvil: 'The smith\'s anvil, warm.',
    temple: 'The Forge-Father\'s temple: his anvil in the back wall, and the forge\'s noise through the wall.',
    gate: 'The highway gate, shut, its bar down.'
  };
  SK.CDOORS = [
    { id: 'cRampUp', at: [[14, 1], [14, 2]], step: true, title: 'THE CART RAMP', say: ['Up the ramp to main street, inside the vault doors.'], to: 'the street level.', go: ['solskaft', 15, null, [1, 0]] },
    { id: 'cNarrowUp', at: [[36, 2]], step: true, title: 'THE NARROW RAMP', say: ['Up the narrow ramp to the street, beside the stable.'], to: 'the street level.', go: ['solskaft', 36, 1, [0, 1]] },
    { id: 'cGate', at: [[31, 26], [32, 26], [33, 26], [34, 26]], title: 'THE HIGHWAY GATE', say: [null], to: 'the highway: four days and three lamps to Deepholm\'s door (its legs are floors to come).' },
    { id: 'cTrade', at: [[30, 22]], title: 'THE TRADE HALL', say: [null], to: 'its hall (not yet built), boarded from this side.' },
    { id: 'mint', at: [[11, 18]], title: 'THE MINT', say: [null], to: 'nowhere: the king sealed it.' },
    { id: 'treasury', at: [[12, 18]], title: 'THE TREASURY', say8: 'deep.treasury', to: 'its room (not yet built).' }
  ];
  (function () { var o = SK.LABEL || (SK.LABEL = {}), S8 = SK.CS8, Ln = SK.CLINES; o[S8.smelters] = 'the smelters'; o[S8.cupel] = 'the cupel-hearth'; o[S8.rack] = 'the ledger-lamp rack'; o[S8.anvil] = 'the Forge-Father\'s anvil'; o[S8.shrooms] = 'the shroom beds';
    o[Ln.holding] = 'the wagon'; o[Ln.trap] = 'the hoist-trap'; o[Ln.drum] = 'the drum'; o[Ln.rackArm] = 'the armory\'s racks'; o[Ln.forgeAnvil] = 'the smith\'s anvil'; })();
  SK.WORDS.smith = function () { var s = ((DS.DATA || {}).shops || {}).copperbottom || {}; return [s.greeting || '', '{g}(His shop and the Winnower are to come.){/}']; };
  SK.WORDS.gatewatch = function () { return [SK.L('deep.gateShut'), '{g}(The gate and the muster are the story\'s, to come.){/}']; };
  SK.cdoorSay = function (d) { return d.id === 'cGate' ? ['{y}' + d.title + '{/}', SK.CLINES.gate, '{g}Where it goes: ' + d.to + '{/}'] : d.id === 'cTrade' ? ['{y}' + d.title + '{/}', SK.CS8.trade, '{g}Where it goes: ' + d.to + '{/}'] : null; };
  SK.DRUM = function () { var out = []; SK.CROWS.forEach(function (row, y) { for (var x = 0; x < row.length; x++) if (row.charAt(x) === 'Q') out.push([x, y]); }); return out; };
  SK.clights = function () {
    var out = [], Y = SK.Y, lamp = function (id, x, r, b, d, c) { out.push({ id: id, kind: 'map', x: x, y: Y(r), bright: b == null ? 10 : b, dim: d || 10, color: c || 'fire', flame: true, seep: true }); };
    lamp('ckRamp', 6, 2); lamp('ckHold', 4, 4); lamp('ckLaneW1', 11, 8); lamp('ckLaneW2', 11, 12); lamp('ckLaneE1', 26, 8); lamp('ckLaneE2', 26, 12);
    lamp('ckBack1', 12, 16); lamp('ckBack2', 20, 16); lamp('ckBack3', 28, 16); lamp('ckEast', 32, 8); lamp('ckNarrow', 36, 7);
    lamp('ckForge', 17, 24, 15, 15); lamp('ckTemple', 6, 22); lamp('ckSmelt', 27, 21, 5, 5); lamp('ckGate', 33, 25); lamp('ckShroom', 4, 11, 0, 5);
    return out;
  };
  SK.cmap = function () {
    var trig = [], Y = SK.Y, sign = SK.sign;
    trig.push(sign(3, 5, SK.CLINES.holding), sign(4, 5, SK.CLINES.holding), sign(27, 25, SK.CS8.smelters), sign(26, 25, SK.CS8.smelters), sign(25, 25, SK.CS8.smelters), sign(29, 21, SK.CS8.cupel),
      sign(30, 25, SK.CS8.rack), sign(6, 24, SK.CS8.anvil), sign(17, 22, SK.CLINES.forgeAnvil));
    for (var r = 20; r <= 24; r++) trig.push(sign(13, r, SK.CLINES.rackArm));
    (SK.LIFT || []).forEach(function (q) { trig.push(sign(q[0], q[1], SK.CLINES.lift)); });
    [[11, 4], [11, 6], [26, 4], [26, 6]].forEach(function (q) { trig.push(sign(q[0], q[1], SK.CLINES.trap)); });
    for (var y = 0; y < SK.H; y++) for (var x = 2; x <= 7; x++) if (SK.CROWS[y].charAt(x) === 'n' && !SK.CFOLK.some(function (p) { return p.at[0] === x && Y(p.at[1]) === y; })) trig.push({ id: 'sign' + x + '_' + (SK.H - 1 - y), rect: [x, y, 1, 1], on: 'use', script: 'sk:sign', text: SK.CS8.shrooms, label: SK.LABEL[SK.CS8.shrooms] });
    SK.DRUM().forEach(function (q) { var open = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (o) { var rw = SK.CROWS[q[1] + o[1]]; return rw && rw.charAt(q[0] + o[0]) === '='; }); if (open) trig.push({ id: 'drum' + q[0] + '_' + q[1], rect: [q[0], q[1], 1, 1], on: 'use', script: 'sk:sign', text: SK.CLINES.drum, label: 'the drum' }); });
    SK.CDOORS.forEach(function (d) { d.at.forEach(function (q, i) { trig.push({ id: 'door_' + d.id + i, rect: [q[0], Y(q[1]), 1, 1], on: d.step ? 'step' : 'use', script: 'sk:door', door: d.id, label: d.title.toLowerCase() }); }); });
    trig.push({ id: 'ckForge', rect: [16, Y(18), 4, 1], on: 'step', script: 'sk:sign', text: SK.CLINES.forge, once: true },
      { id: 'ckTemple', rect: [6, Y(18), 1, 1], on: 'step', script: 'sk:sign', text: SK.CLINES.temple, once: true });
    trig.forEach(function (t) { var lb = t.label || SK.LABEL[t.text]; if (lb && D.roam && D.roam.USE_NAME) D.roam.USE_NAME[t.id] = lb; });
    var npcs = SK.CFOLK.map(function (p) { return { id: p.id, x: p.at[0], y: Y(p.at[1]), look: p.id, dir: p.dir }; });
    return { id: SK.CART, name: 'Sólskaft', rows: SK.CROWS.slice(), legend: SK.CLEGEND, music: 'dungeon', exits: {}, dark: true, lights: SK.clights(), npcs: npcs, triggers: trig, chests: [] };
  };
  M.FLOORS[SK.CART] = { src: SK.CART, own: true, map: SK.cmap, door: 'solskaft_cart', place: 'Sólskaft', sub: 'the cart level: the road round the drum', save: true, clock: true, iso: true,
    rate: { squaresPerHour: 500, fightHours: 0.25 }, phase: M.seepPhase, phaseLine: function () { return ''; },
    gates: { rampW: [5, SK.Y(1), [-1, 0]], rampE: [36, SK.Y(7), [0, -1]], forge: [18, SK.Y(16), [0, -1]], gate: [32, SK.Y(22), [0, -1]] } }; // (save: false, as the street's)
  // its pieces: the ramps' runs, the drum's carving on the faces the eye sees, the hoist-traps, the anvils, the cold furnaces and the cupel, the lamp rack
  SK.pic.carve = function () { // (the drum's carving: bands of figures in low relief -- the art desk's later, his "we'll probably art dept")
    var cv = document.createElement('canvas'); cv.width = TW; cv.height = 170; var cx = cv.getContext('2d'), ox = TW / 2, oy = 150, st = D.iso.ramp('stone');
    var Q = function (t, z) { return P(ox, oy, -0.5, t - 0.5, z); }, rect = function (t0, t1, z0, z1, col) { poly(cx, [Q(t0, z0), Q(t1, z0), Q(t1, z1), Q(t0, z1)], col); };
    [10, 34, 58].forEach(function (z) { rect(0, 1, z, z + 2, rgb(st[st.length - 1], 0.55)); });
    for (var b = 0; b < 2; b++) for (var k = 0; k < 4; k++) { var z0 = 14 + b * 24, t = 0.1 + k * 0.22; rect(t, t + 0.08, z0 + 2, z0 + 16, rgb(st[st.length - 2], 0.7)); rect(t + 0.02, t + 0.06, z0 + 16, z0 + 19, rgb(st[st.length - 2], 0.7)); }
    return { canvas: cv, ax: ox, ay: oy };
  };
  SK.pic.trap = function () { var cv = document.createElement('canvas'); cv.width = TW; cv.height = TH + 2; var cx = cv.getContext('2d'), ox = TW / 2, oy = TH / 2 + 1, wd = D.iso.ramp('leather');
    poly(cx, [P(ox, oy, -0.35, -0.35), P(ox, oy, 0.35, -0.35), P(ox, oy, 0.35, 0.35), P(ox, oy, -0.35, 0.35)], rgb(wd[0], 0.6)); poly(cx, [P(ox, oy, -0.28, -0.28), P(ox, oy, 0.28, -0.28), P(ox, oy, 0.28, 0.28), P(ox, oy, -0.28, 0.28)], rgb(wd[1], 0.5)); return { canvas: cv, ax: ox, ay: oy }; };
  SK.pic.anvil = function () { var cv = document.createElement('canvas'); cv.width = 64; cv.height = 72; var cx = cv.getContext('2d'), ox = 32, oy = 52, ir = D.iso.ramp('stone');
    box(cx, ox, oy, -0.15, -0.15, 0.15, 0.15, 0, 14, ir, [0.5, 0.35, 0.25]); box(cx, ox, oy, -0.32, -0.16, 0.32, 0.16, 14, 22, ir, [0.6, 0.4, 0.3]); return { canvas: cv, ax: ox, ay: oy }; };
  SK.pic.furnace = function () { var cv = document.createElement('canvas'); cv.width = 64; cv.height = 110; var cx = cv.getContext('2d'), ox = 32, oy = 86, st = D.iso.ramp('stone'), dk = D.iso.ramp('outline')[0];
    box(cx, ox, oy, -0.4, -0.4, 0.4, 0.4, 0, 52, st, [0.7, 0.5, 0.35]); poly(cx, [P(ox, oy, 0.4, -0.15, 6), P(ox, oy, 0.4, 0.15, 6), P(ox, oy, 0.4, 0.15, 22), P(ox, oy, 0.4, -0.15, 22)], rgb(dk)); return { canvas: cv, ax: ox, ay: oy }; };
  SK.pic.cupel = function () { var cv = document.createElement('canvas'); cv.width = 64; cv.height = 50; var cx = cv.getContext('2d'), ox = 32, oy = 32, st = D.iso.ramp('stone'), bn = D.iso.ramp('bone');
    box(cx, ox, oy, -0.38, -0.38, 0.38, 0.38, 0, 10, st, [0.6, 0.45, 0.35]); cx.fillStyle = rgb(bn[2]); cx.beginPath(); cx.ellipse(ox, oy - 10, 14, 7, 0, 0, Math.PI * 2); cx.fill(); cx.fillStyle = rgb(bn[1]); cx.beginPath(); cx.ellipse(ox, oy - 10, 9, 4, 0, 0, Math.PI * 2); cx.fill(); return { canvas: cv, ax: ox, ay: oy }; };
  SK.pic.rack = function () { var cv = document.createElement('canvas'); cv.width = TW; cv.height = 170; var cx = cv.getContext('2d'), ox = TW / 2, oy = 150, wd = D.iso.ramp('leather');
    var Q = function (t, z) { return P(ox, oy, -0.5, t - 0.5, z); }, rect = function (t0, t1, z0, z1, col) { poly(cx, [Q(t0, z0), Q(t1, z0), Q(t1, z1), Q(t0, z1)], col); };
    rect(0.1, 0.9, 50, 53, rgb(wd[1])); [0.22, 0.5, 0.78].forEach(function (t) { rect(t - 0.02, t + 0.02, 40, 50, rgb(wd[0])); rect(t - 0.06, t + 0.06, 30, 40, 'rgb(220,190,120)'); }); return { canvas: cv, ax: ox, ay: oy }; };
  SK.dressCart = function (m, def, sq, off, piece, add) {
    var Y = SK.Y;
    for (var x = 6; x <= 13; x++) [1, 2].forEach(function (r) { var s = sq(x, r); if (s) add({ kind: 'decal', sq: s, depth: s.x + s.y, gz: s.gz, layer: -1 }, function () { return SK.pic.chevron('w'); }); });
    for (var r = 3; r <= 6; r++) { var s2 = sq(36, r); if (s2) add({ kind: 'decal', sq: s2, depth: s2.x + s2.y, gz: s2.gz, layer: -1 }, function () { return SK.pic.chevron('n'); }); }
    [[11, 4], [11, 6], [26, 4], [26, 6]].forEach(function (q) { var s = sq(q[0], q[1]); if (s) add({ kind: 'decal', sq: s, depth: s.x + s.y, gz: s.gz, layer: -1 }, SK.pic.trap); });
    SK.DRUM().forEach(function (q) { var e = m.at(q[0] + 1, q[1]); if (e && e.open) add({ kind: 'sk', sq: e, depth: e.x + e.y - 0.4, gz: e.gz }, SK.pic.carve); }); // (its faces toward the eye: the east ones -- the rest of its ring is seen from behind it)
    [[6, 24], [17, 22]].forEach(function (q) { off(sq(q[0], q[1]), 'the anvil'); piece(q[0], q[1], SK.pic.anvil); });
    [25, 26, 27].forEach(function (x2) { off(sq(x2, 25), 'the cold furnace'); piece(x2, 25, SK.pic.furnace); });
    off(sq(29, 21), 'the cupel-hearth'); piece(29, 21, SK.pic.cupel);
    piece(31, 25, SK.pic.rack, { d: -0.4 });
    (SK.LIFT || []).forEach(function (q) { off(sq(q[0], q[1]), 'the old lift'); }); piece(28, 23, SK.pic.lift, { fx: 29, fy: SK.Y(23), d: 2 });
    piece(31, 22, function () { return SK.pic.face('sealed', 'w'); }, { d: -0.4 }); // (the trade hall's boarded door on the lane's west side)
    piece(11, 17, function () { return SK.pic.face('sealed', 'n'); }, { d: -0.4 }); piece(12, 17, function () { return SK.pic.face('door', 'n'); }, { d: -0.4 }); // (the mint's warranted door and the treasury's, on the road behind the drum by the forge)
  };
  // ---------------------------------------------------------------- the cart level, shown
  SK.CBEATS = [
    { id: 'rampfoot', key: 'solskaft_cart', label: 'THE CART LEVEL: the ramp\'s foot and the wagon holding', note: 'Ten in the morning at the foot of the cart ramp: the wagon holding in the front-west corner under the tollhouse, one wagon waiting under its cover; the ramp rising east to main street (walk up it: the street level); the west loading lane running north under the west store, its hoist-traps overhead.', at: [6, 2], hour: 10 },
    { id: 'drum', key: 'solskaft_cart', label: 'THE DRUM: the road round the funerary\'s wall', note: 'On the east loading lane beside the drum: a ring of dressed stone carved its whole length (grey-boxed: the carving is the art desk\'s later), nothing of what is inside seen, no door in it. E on it from any side of the road.', at: [24, 11], hour: 10 },
    { id: 'forge', key: 'solskaft_cart', label: 'THE FORGE, the Forge-Father\'s temple, the smelters', note: 'Behind the drum: the forge lit, the Copperbottom smith at his anvil, the armory\'s racks on the west wall; the Forge-Father\'s temple west of it (his anvil, worn to a saddle); the smelters east, cold, and the cupel-hearth, a trooper sweeping them.', at: [18, 17], hour: 10 },
    { id: 'gate', key: 'solskaft_cart', label: 'THE HIGHWAY\'S MOUTH: the gate, the ledger-lamp rack', note: 'In the highway\'s lane in the north-east: the gate shut across it, the gate watch, the ledger-lamp rack beside the gate (three hooks, three lamps), the trade hall\'s boarded door on the west side. The lane joins the road behind the drum: the second import lane.', at: [32, 21], hour: 10 },
    { id: 'loop', key: 'solskaft_cart', label: 'THE LOOP, holding to the narrow ramp', note: 'From the holding: click the foot of the narrow ramp at the east wall and watch the cart road go -- north under the west store, round behind the drum past the forge, south under the east store, east to the ramp. Walk up it: the street, beside the stable.', at: [6, 4], hour: 10 }
  ];

  // ================================================================ THE THIRD LEVEL BELOW: THE FUNERARY (11-11, the same seat, piece 3; RULED 11-11, Griz: "approve the solskaft iso
  // seat's leans" -- the stairs in the two temples, the hallways and the closed homes on the level below the cart level, the dead lifts beside the smelters). On the street's squares
  // thirty feet down. His words (wiki/solskaft.md §The shape, CANON 11-11): the funerary "directly under the oathstone", Pyro's empty chamber beneath the pedestal; "a hallway
  // runs along its east side, and the flooded stair from the Warrens comes in at that hallway's southern end; the little shrines -- the Triad's chapel -- are on the east side of
  // that hallway. On the funerary's other side is a symmetrical hallway, with sealed access points into the closed residential"; "the tiers step down from each hallway toward
  // the bier in the middle" (his "2 - yes"); the family units "closed off", all ten doors barred.
  //   The first game's Burial (tools/mapgen.py build_deep, first/content/maps/burial.json) turned a quarter and halved: its one long hallway across the top becomes the two
  //   hallways (x 5-7 west, 30-32 east), its two straight stairs become one from each hallway down the middle row (r10) through four tiers to the chamber, and its eight
  //   wedge-places stand two north and two south of each stair -- eight places, seven families, one waiting (CANON 09-26e). Every niche reads what it read in the first game
  //   (its stone line by the first game's own key: SK.stone8). The tiers are a true heightmap: the hallways four steps up, each tier one lower, the chamber floor at the bottom.
  //   The four warranted doors of the first game's hallway are the west hallway's sealed access points (the weigh's reading); between them a grille, and through it the closed
  //   street, its ten lintels read through the bars (the seat's call: the grille). Lamp-lit only where a lamp is kept: the bier's, and the chapel's.
  //   Nobody stands here: the night crew at Geirmund's wedge, the bier's scene and the drained stair are the story's.
  SK.BELOW = 'solskaft_below';
  SK.BURIAL = { // (the first game's, verbatim: tools/mapgen.py WEDGES, first/js/deep.js FAM, NAMES, LAMPS, SEASON)
    FAM: [{ id: 'geirmund', name: 'GEIRMUND' }, { id: 'audun', name: 'AUDUN', title: 'door-warden' }, { id: 'orri', name: 'ORRI' }, { id: 'hallveig', name: 'HALLVEIG', her: true },
      { id: 'kolbein', name: 'KOLBEIN' }, { id: 'asmund', name: 'ASMUND' }, { id: 'brandr', name: 'BRANDR' }],
    WEDGES: [{ reach: 0, ended: true }, { reach: 2, ended: true, gear: 3 }, { reach: 0 }, { reach: 0 }, { reach: 1 }, { reach: 1, ended: true, gear: 3 }, { reach: 0 }],
    AT8: [[2, 5], [7, 10], [14, 16], [18, 20], [23, 25], [27, 29], [33, 36]], TIERS8: [8, 12, 16, 20], // (each wedge's columns on the first game's map, and its tiers' rows: the keys its niches read by)
    NAMES: ['ARI', 'BERA', 'DAGR', 'EIR', 'FINN', 'GUNNA', 'HALLR', 'INGI', 'JORA', 'KARI', 'LIV', 'MANI', 'NANNA', 'ODD', 'SIF', 'TOKI', 'UNA', 'VALI', 'YRSA', 'BJORN',
      'ESJA', 'GEIR', 'HILD', 'SVALA', 'THORA', 'ASA', 'BRYNJA', 'FRODE', 'GRIMA', 'HALLA', 'IVAR', 'LJOT', 'ROLF', 'SAGA', 'TOVE', 'VIGGA', 'OTTAR', 'RUNA', 'STEIN', 'DIS'],
    LAMPS: ['the First Lamp', 'the Second Lamp', 'the Third Lamp'], SEASON: [[1, 4], [5, 14], [15, 26], [27, 33]]
  };
  SK.mb32 = function (a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }; // (first/js/core.js DS.mulberry32)
  SK.hash8 = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }; // (first/js/core.js DS.hash)
  SK.stone8 = function (key, info) { // (first/js/deep.js stone(): a name, a season-mark, and for the highway's dead the lamp they fell at -- by the first game's key, so each niche reads as it did)
    var Bu = SK.BURIAL, wi = info[0], ti = info[1], fam = Bu.FAM[wi], rng = SK.mb32(SK.hash8('niche:' + key));
    var s = Bu.SEASON[3 - ti], season = s[0] + Math.floor(rng() * (s[1] - s[0] + 1));
    if (info[2] === 'gear' && fam.id === 'audun') return 'AUDUN, door-warden, of the Silversands. Season 21. Fell at the Third Lamp.';
    if (info[2] === 'gear' && fam.id === 'asmund') return 'ASMUND, of the Silversands. Season 3. Fell at the Second Lamp.';
    var nm = ti === 3 ? fam.name : Bu.NAMES[Math.floor(rng() * Bu.NAMES.length)];
    var line = ti === 3 ? nm + ', of the Silversands, first of ' + (fam.her ? 'her' : 'his') + ' line.' : nm + ', ' + (ti === 2 ? (rng() < 0.5 ? 'son of ' : 'daughter of ') + fam.name : 'of ' + fam.name + '\'s line') + '.';
    line += ' Season ' + season + '.';
    if (rng() < (ti === 3 ? 0.3 : 0.45)) line += ' Fell at ' + Bu.LAMPS[Math.floor(rng() * 3)] + '.';
    return line;
  };
  // the eight places, each four rows: [x side ('w' or 'e'), r0 (its southmost row), the family (index; 7 the place that waits)] -- Geirmund's nearest the Warrens' stair (the east
  // hallway's south end), as the first game had it nearest the cut seal; Asmund's on the west (the weigh's)
  SK.PLACES = [['e', 2, 0], ['e', 6, 1], ['e', 11, 2], ['e', 15, 3], ['w', 6, 4], ['w', 2, 5], ['w', 11, 6], ['w', 15, 7]];
  SK.TIERX = { w: [8, 10, 12, 14], e: [29, 27, 25, 23] }; // (each side's niche columns, tier 0 -- the top, the newest dead -- down to tier 3, the patrons' base ring)
  SK.BSTAIR = 10; // (the row each hallway's stair runs down, to the bier)
  SK.bbuild = function () {
    var g = [], x, r, Y = SK.Y;
    for (var y = 0; y < SK.H; y++) { g.push([]); for (x = 0; x < SK.W; x++) g[y].push('#'); }
    var set = function (x0, r0, x1, r1, c) { for (var rr = r0; rr <= r1; rr++) for (var xx = x0; xx <= x1; xx++) g[Y(rr)][xx] = c; };
    set(5, 2, 7, 18, '='); set(30, 2, 32, 18, '=');                       // the two hallways
    [9, 11, 13, 15, 22, 24, 26, 28].forEach(function (wx) { set(wx, 2, wx, 18, '='); }); // the tiers' walks
    set(15, 6, 22, 14, '=');                                                // the chamber at the bottom, doorless
    set(5, 19, 32, 20, '=');                                                // the north hallway across the top of the tiers, every walk opening on it, stepping down with them to the middle (11-11, his walk: "north should be a hallway as well (walks to the end of the row into a wall at present")
    set(8, SK.BSTAIR, 14, SK.BSTAIR, '='); set(23, SK.BSTAIR, 29, SK.BSTAIR, '='); // each hallway's stair down the middle row, through the tiers
    set(18, 10, 19, 10, 'Z'); set(20, 11, 20, 11, 'Y');                     // the bier, under the oathstone; the one lamp, kept
    set(5, 11, 5, 12, 'U'); set(32, 11, 32, 12, 'U');                       // the temples' stairs' feet, each in its own hallway
    set(31, 1, 31, 1, 'z');                                                 // the flooded stair from the Warrens, at the east hallway's southern end
    set(34, 4, 36, 8, '='); set(33, 5, 33, 7, '=');                         // the Triad's chapel, the little shrines, off the east hallway
    set(36, 4, 36, 4, 'A'); set(36, 6, 36, 6, 'L'); set(34, 8, 34, 8, 'Y');  // the grave-anvil, Rekknar's ledger-stone, a lamp (the Dormant's cut in the north wall: SK.BCUT)
    set(1, 2, 3, 18, 'c');                                                  // the closed street, beyond the bars: seen, never walked
    set(4, 9, 4, 10, 'G');                                                  // the grille in the west hallway's wall
    // the niches: the wedges' rows in each tier's column (blank stone where a family's dead do not reach)
    var Bu = SK.BURIAL;
    SK.NICHE = {};
    SK.PLACES.forEach(function (pl) {
      var side = pl[0], r0 = pl[1], wi = pl[2], wd = Bu.WEDGES[wi];
      SK.TIERX[side].forEach(function (nx, ti) {
        if (wi < 7 && ti < wd.reach) return;
        var keys8 = [], a = wi < 7 ? Bu.AT8[wi] : null; if (a) for (var x8 = a[0]; x8 <= a[1]; x8++) keys8.push(x8 + ',' + Bu.TIERS8[ti]);
        for (var k = 0; k < 4; k++) {
          var rr = r0 + k, kind = wi === 7 ? 'waits' : ti === 3 ? 'patron' : 'row';
          if (wi < 7 && wd.gear === ti && k === 0) kind = 'gear'; else if (wi === 0 && ti === 0) kind = 'pried';
          g[Y(rr)][nx] = kind === 'gear' ? '$' : ti === 3 ? 'K' : 'N';
          SK.NICHE[nx + ',' + rr] = { wi: wi, ti: ti, kind: kind, key8: keys8[k] || ('solskaft:' + nx + ',' + rr) }; // (the first game's key for its k-th niche of that wedge and tier; past its width, one of our own)
        }
      });
    });
    return g.map(function (row) { return row.join(''); });
  };
  SK.BROWS = SK.bbuild();
  SK.BCUT = [35, 8];          // (the Dormant's empty cut, in the chapel's north wall over this square)
  SK.ACCESS = [3, 7, 14, 17]; // (the four warranted access points on the west hallway's west wall, by row)
  SK.bheights = function () { // (the tiers a true heightmap: the hallways 4, each tier one lower to the chamber's 0; a stair square takes its uphill side's)
    var hx = function (x) { var m = x <= 18 ? x : 37 - x; return m <= 8 ? 4 : m >= 15 ? 0 : 4 - Math.floor((m - 7) / 2); };
    return SK.BROWS.map(function (row, y) { var out = ''; for (var x = 0; x < row.length; x++) out += String(hx(x)); return out; });
  };
  SK.BLEGEND = { '#': 'dwarfWall', '=': 'dwarfFloor', U: 'skStair', z: 'skWarrens', Z: 'skBier', Y: 'skTombLamp', A: 'skAnvil', L: 'skLedgerStone', c: 'skClosed', G: 'skGrille',
    N: 'skNiche', K: 'skNiche', $: 'skNiche' };
  Object.assign(M.LAY, { skWarrens: ['d', 'X'], skBier: ['k'], skTombLamp: ['k'], skClosed: ['.'], skGrille: ['f'], skNiche: ['#'] });
  SK.BS8 = { // (the first game's Burial, verbatim: first/content/maps/burial.json signs, first/content/text.json)
    lamp: 'One lamp, kept. Somebody fills it.',
    kneel: 'A kneeling-stone, two hollows worn in it. Nobody comes down here to pray who has not come to bury.',
    anvil: 'The Forge-Father\'s niche. The anvil here is small, a grave-anvil; nothing was ever struck on it.',
    ledger: 'Rekknar\'s ledger-stone. The last line on it is a name, and the line under it is ruled and empty.',
    cut: 'A plain cut in the rock with nothing in it. The Dormant\'s. Down here it looks like an open niche.',
    sealed: 'A sealed door, warranted. The runes are whole. The ledger knows what is behind it; you do not.',
    waits: 'A wedge cut and dressed, and nobody in it. The eighth place. It waits.'
  };
  SK.BT8 = { bier: 'deep.bier', dead: 'deep.nicheDead', pried: 'deep.priedNiche', shield: 'deep.shieldSeen', hammer: 'deep.asmundGear' };
  // the closed street's ten lintels, the first game's words (first/content/maps/solskaft.json): the Scalebeam door barred with the rest since Ásdís went up to the lodging (RULED
  // 11-11) -- its line the first game's own barred line, the seat's change, said
  SK.LINTELS = {
    north: ['SCALEBEAM, cut in the lintel. Barred from outside since the clans went back deep. The dust on the step is even.',
      'GREYSEAM, cut in the lintel. Barred from outside since the clans went back deep. The dust on the step is even.',
      'ORRI, cut in the lintel. Barred from outside since the clans went back deep. The dust on the step is even.',
      'HALLVEIG, cut in the lintel. Barred from outside since the clans went back deep. The dust on the step is even.',
      'KOLBEIN, cut in the lintel. Barred from outside since the clans went back deep. The dust on the step is even.'],
    south: ['COPPERBOTTOM, cut in the lintel. Barred, like the rest, but somebody has chalked on the bar: AT THE FORGE.',
      'ASMUND, cut in the lintel. Barred from outside since the clans went back deep. The dust on the step is even.',
      'BRANDR, cut in the lintel. Barred from outside since the clans went back deep. The dust on the step is even.',
      'GEIRMUND, cut in the lintel. Barred. The line that lived here ended on the road; the ledger has the house.',
      'AUDUN, cut in the lintel. Barred. The line that lived here ended on the road; the ledger has the house.']
  };
  SK.BLINES = {
    arrive: ['The funerary: the tiers going down from the hallway toward a bier at the bottom, and one lamp beside it, kept.'],
    hello: 'The funerary: a hallway each side and one across the north, the tiers stepping down between them to the bier; the chapel off the east hallway, the Warrens\' stair at its south end; the closed homes behind the west one.',
    grille: 'Through the bars: the closed street, ten doors along it, every one barred. The lintels, in the dark:',
    stair: 'The stair up to the temple off the hallway.',
    graveGear: '{g}(The law of the line -- what may be taken, by whose warrant -- is the story\'s, to come.){/}'
  };
  SK.BDOORS = [
    { id: 'bUpW', at: [[5, 11], [5, 12]], step: true, title: 'THE STAIR UP', say: ['Up to Rekknar\'s temple off the hallway.'], to: 'the street level.', go: ['solskaft', 8, 15, [1, 0]] }, // (PASS TWO, 11-12: the temples off the street's hallway; the stair's foot here unchanged)
    { id: 'bUpE', at: [[32, 11], [32, 12]], step: true, title: 'THE STAIR UP', say: ['Up to the Dormant\'s temple off the hallway.'], to: 'the street level.', go: ['solskaft', 29, 15, [-1, 0]] },
    { id: 'bWarrens', at: [[31, 1]], step: true, title: 'THE FLOODED STAIR', say: ['The stair from the Warrens comes in here, through a cut seal: down it, the water.'], to: 'the Wet, under the Crawler Warrens (the drained stair\'s coming up this way is the story\'s, to come).' }
  ];
  SK.blights = function () { var Y = SK.Y; return [{ id: 'bkBier', kind: 'map', x: 20, y: Y(11), bright: 10, dim: 25, color: 'fire', flame: true, seep: true }, { id: 'bkChapel', kind: 'map', x: 34, y: Y(8), bright: 5, dim: 15, color: 'fire', flame: true, seep: true }]; };
  SK.nicheSay = function (n) {
    if (n.kind === 'waits') return [SK.BS8.waits];
    var L8 = SK.L, line = SK.stone8(n.key8, [n.wi, n.ti, n.kind]);
    if (n.kind === 'pried') return [L8(SK.BT8.pried)];
    if (n.kind === 'gear') return [line, L8(n.wi === 1 ? SK.BT8.shield : SK.BT8.hammer), SK.BLINES.graveGear];
    return [line, L8(SK.BT8.dead)];
  };
  SK.bmap = function () {
    var trig = [], Y = SK.Y, sign = SK.sign, Bu = SK.BURIAL;
    trig.push(sign(20, 11, SK.BS8.lamp), sign(34, 8, SK.BS8.lamp), sign(36, 4, SK.BS8.anvil), sign(36, 6, SK.BS8.ledger), sign(35, 9, SK.BS8.cut), sign(35, 6, SK.BS8.kneel));
    trig.push({ id: 'bier18', rect: [18, Y(10), 1, 1], on: 'use', script: 'sk:sign', text8: SK.BT8.bier, label: 'the bier' }, { id: 'bier19', rect: [19, Y(10), 1, 1], on: 'use', script: 'sk:sign', text8: SK.BT8.bier, label: 'the bier' });
    SK.ACCESS.forEach(function (r) { trig.push(sign(4, r, SK.BS8.sealed)); });
    for (var nx = 5; nx <= 32; nx++) trig.push(sign(nx, 21, SK.S8.hero)); // (the wall of the dead's names, the north hallway's north wall: the first game's hero-wall words)
    trig.push({ id: 'grille9', rect: [4, Y(9), 1, 1], on: 'use', script: 'sk:sign', lines: [SK.BLINES.grille].concat(SK.LINTELS.north), label: 'the grille' },
      { id: 'grille10', rect: [4, Y(10), 1, 1], on: 'use', script: 'sk:sign', lines: [SK.BLINES.grille].concat(SK.LINTELS.south), label: 'the grille' });
    Object.keys(SK.NICHE).forEach(function (k) { var n = SK.NICHE[k], q = k.split(',').map(Number); trig.push({ id: 'niche' + q[0] + '_' + q[1], rect: [q[0], Y(q[1]), 1, 1], on: 'use', script: 'sk:niche', niche: k, label: n.kind === 'waits' ? 'the eighth place' : 'a niche' }); });
    SK.BDOORS.forEach(function (d) { d.at.forEach(function (q, i) { trig.push({ id: 'door_' + d.id + i, rect: [q[0], Y(q[1]), 1, 1], on: d.step ? 'step' : 'use', script: 'sk:door', door: d.id, label: d.title.toLowerCase() }); }); });
    trig.forEach(function (t) { var lb = t.label || SK.LABEL[t.text]; if (lb && D.roam && D.roam.USE_NAME) D.roam.USE_NAME[t.id] = lb; });
    return { id: SK.BELOW, name: 'Sólskaft', rows: SK.BROWS.slice(), legend: SK.BLEGEND, music: 'dungeon', exits: {}, dark: true, lights: SK.blights(), npcs: [], triggers: trig, chests: [] };
  };
  (function () { var o = SK.LABEL, S8 = SK.BS8; o[S8.lamp] = 'the lamp'; o[S8.kneel] = 'the kneeling-stone'; o[S8.anvil] = 'the grave-anvil'; o[S8.ledger] = 'Rekknar\'s ledger-stone'; o[S8.cut] = 'the Dormant\'s cut'; o[S8.sealed] = 'a sealed door'; })();
  M.FLOORS[SK.BELOW] = { src: SK.BELOW, own: true, map: SK.bmap, door: null, place: 'Sólskaft', sub: 'the funerary, under the oathstone', save: false, clock: true, iso: true,
    rate: { squaresPerHour: 500, fightHours: 0.25 }, phase: M.seepPhase, phaseLine: function () { return ''; },
    gates: { west: [6, SK.Y(11), [1, 0]], east: [31, SK.Y(11), [-1, 0]], warrens: [31, SK.Y(2), [0, -1]], bier: [17, SK.Y(10), [1, 0]] } }; // (save: false -- the first game's Burial had none)
  // the pieces: the niche faces the eye sees (the west tiers', toward the bier), the bier, the kept lamps, the grave-anvil, the ledger-stone, the empty cut, the kneeling-stone, the grille's bars
  SK.pic.niches = function (kind) { // (a column of niche faces on a tier's wall: the slabs' outlines, a pried one gaping, the gear one a glint)
    var cv = document.createElement('canvas'); cv.width = TW; cv.height = 170; var cx = cv.getContext('2d'), ox = TW / 2, oy = 150, st = D.iso.ramp('stone'), dk = D.iso.ramp('outline')[0];
    var Q = function (t, z) { return P(ox, oy, -0.5, t - 0.5, z); }, rect = function (t0, t1, z0, z1, col) { poly(cx, [Q(t0, z0), Q(t1, z0), Q(t1, z1), Q(t0, z1)], col); };
    [8, 30].forEach(function (z) { rect(0.1, 0.9, z, z + 18, kind === 'pried' ? rgb(dk) : kind === 'waits' ? rgb(st[st.length - 1], 0.25) : rgb(st[st.length - 2], 0.55)); if (kind !== 'pried' && kind !== 'waits') rect(0.14, 0.86, z + 2, z + 16, rgb(st[2], 0.7)); });
    if (kind === 'gear') rect(0.4, 0.6, 14, 20, 'rgb(220,220,235)');
    return { canvas: cv, ax: ox, ay: oy };
  };
  SK.pic.bier = function () { var cv = document.createElement('canvas'); cv.width = 160; cv.height = 110; var cx = cv.getContext('2d'), ox = 80, oy = 76, st = D.iso.ramp('stone');
    box(cx, ox, oy, -0.85, -0.38, 0.85, 0.38, 0, 14, st, [0.7, 0.45, 0.3]); box(cx, ox, oy, -0.95, -0.45, 0.95, 0.45, 14, 20, st, [0.9, 0.6, 0.45]); return { canvas: cv, ax: ox, ay: oy }; };
  SK.pic.tombLamp = function () { var cv = document.createElement('canvas'); cv.width = 64; cv.height = 90; var cx = cv.getContext('2d'), ox = 32, oy = 66, st = D.iso.ramp('stone');
    box(cx, ox, oy, -0.12, -0.12, 0.12, 0.12, 0, 30, st, [0.6, 0.45, 0.3]); box(cx, ox, oy, -0.2, -0.2, 0.2, 0.2, 30, 36, st, [0.8, 0.55, 0.4]);
    cx.fillStyle = 'rgb(255,214,120)'; var c = P(ox, oy, 0, 0, 42); cx.fillRect(Math.round(c[0]) - 2, Math.round(c[1]) - 3, 4, 5); return { canvas: cv, ax: ox, ay: oy }; };
  SK.pic.kneel = function () { var cv = document.createElement('canvas'); cv.width = TW; cv.height = TH + 10; var cx = cv.getContext('2d'), ox = TW / 2, oy = TH / 2 + 6, st = D.iso.ramp('stone');
    box(cx, ox, oy, -0.3, -0.18, 0.3, 0.18, 0, 5, st, [0.85, 0.6, 0.45]); cx.fillStyle = rgb(st[1]); [-0.15, 0.15].forEach(function (u) { var c = P(ox, oy, u, 0, 5); cx.fillRect(Math.round(c[0]) - 3, Math.round(c[1]) - 1, 6, 2); }); return { canvas: cv, ax: ox, ay: oy }; };
  SK.pic.closedDoor = function () { // (a barred house door on the closed street's west wall, the bar across it)
    var cv = document.createElement('canvas'); cv.width = TW; cv.height = 170; var cx = cv.getContext('2d'), ox = TW / 2, oy = 150, wd = D.iso.ramp('leather'), ir = D.iso.ramp('stone');
    var Q = function (t, z) { return P(ox, oy, -0.5, t - 0.5, z); }, rect = function (t0, t1, z0, z1, col) { poly(cx, [Q(t0, z0), Q(t1, z0), Q(t1, z1), Q(t0, z1)], col); };
    rect(0.22, 0.78, 0, 46, rgb(wd[0])); rect(0.26, 0.74, 3, 43, rgb(wd[1])); rect(0.12, 0.88, 22, 26, rgb(ir[4])); return { canvas: cv, ax: ox, ay: oy };
  };
  SK.dressBelow = function (m, def, sq, off, piece, add) {
    Object.keys(SK.NICHE).forEach(function (k) { var n = SK.NICHE[k], q = k.split(',').map(Number); if (q[0] > 18) return; var e = sq(q[0] + 1, q[1]); if (!e || !e.open) return; add({ kind: 'sk', sq: e, depth: e.x + e.y - 0.4, gz: e.gz }, function () { return SK.pic.niches(n.kind); }); }); // (the west tiers' faces: toward the eye; the east tiers' face away from it, and read by E)
    off(sq(18, 10), 'the bier'); off(sq(19, 10), 'the bier'); piece(18, 10, SK.pic.bier, { fx: 19, fy: SK.Y(10) + 0.5, d: 1.5 });
    [[20, 11], [34, 8]].forEach(function (q) { off(sq(q[0], q[1]), 'the lamp'); piece(q[0], q[1], SK.pic.tombLamp); });
    off(sq(36, 4), 'the grave-anvil'); piece(36, 4, SK.pic.anvil); off(sq(36, 6), 'Rekknar\'s ledger-stone'); piece(36, 6, SK.pic.stele);
    piece(SK.BCUT[0], SK.BCUT[1], SK.pic.cut, { d: -0.4 });
    var kn = sq(35, 6); if (kn) add({ kind: 'decal', sq: kn, depth: kn.x + kn.y, gz: kn.gz, layer: -1 }, SK.pic.kneel);
    SK.ACCESS.forEach(function (r) { piece(5, r, function () { return SK.pic.face('sealed', 'w'); }, { d: -0.4 }); });
    for (var nx2 = 5; nx2 <= 32; nx2++) { var nq = sq(nx2, 20); if (nq) add({ kind: 'sk', sq: nq, depth: nq.x + nq.y - 0.4, gz: nq.gz }, function () { return SK.pic.face('names', 'n'); }); } // (the names along the north wall, toward the eye)
    [3, 6, 9, 12, 15].forEach(function (r) { var s = sq(1, r); if (s) add({ kind: 'sk', sq: s, depth: s.x + s.y - 0.4, gz: s.gz }, SK.pic.closedDoor); }); // (five of the ten on the wall the eye sees; the other five face away)
  };
  SK.where3 = function (t) {
    var r = SK.H - 1 - t.y;
    if (r >= 19) return 'the north hallway';
    return t.x >= 33 ? 'the Triad\'s chapel' : t.x >= 30 ? 'the east hallway' : t.x <= 7 ? 'the west hallway' : t.x >= 15 && t.x <= 22 && r >= 6 && r <= 14 ? 'the king\'s chamber, at the bier' : 'the tiers';
  };
  // the dead lifts, on the cart level beside the smelters (RULED 11-11, lean 3: "an old shaft, a sign, nothing more"; his hedge on what they carried kept a hedge)
  SK.LIFT = [[28, 23], [29, 23], [28, 24], [29, 24]];
  SK.CLINES.lift = 'An old lift shaft beside the smelters: a platform down at the bottom of it, the chains rusted fast to the frame. It has not moved in a long time.';
  SK.LABEL[SK.CLINES.lift] = 'the old lift';
  SK.pic.lift = function () { // (an old shaft: a dark well two squares across, a frame of timbers over it, the chains hanging)
    var cv = document.createElement('canvas'); cv.width = 160; cv.height = 190; var cx = cv.getContext('2d'), ox = 80, oy = 120, wd = D.iso.ramp('leather'), dk = D.iso.ramp('outline')[0], st = D.iso.ramp('stone');
    poly(cx, [P(ox, oy, -0.9, -0.9), P(ox, oy, 0.9, -0.9), P(ox, oy, 0.9, 0.9), P(ox, oy, -0.9, 0.9)], rgb(dk));
    [[-0.9, -0.9], [0.9, -0.9], [0.9, 0.9], [-0.9, 0.9]].forEach(function (c) { box(cx, ox, oy, c[0] - 0.06, c[1] - 0.06, c[0] + 0.06, c[1] + 0.06, 0, 70, wd, [0.6, 0.4, 0.3]); });
    box(cx, ox, oy, -0.96, -0.06, 0.96, 0.06, 70, 76, wd, [0.7, 0.5, 0.35]);
    cx.strokeStyle = rgb(st[3]); [[-0.2, 0], [0.2, 0]].forEach(function (c) { var a = P(ox, oy, c[0], c[1], 70), b = P(ox, oy, c[0], c[1], 6); cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(b[0], b[1]); cx.stroke(); });
    return { canvas: cv, ax: ox, ay: oy };
  };

  SK.BBEATS = [
    { id: 'templestair', key: 'solskaft', label: 'THE TEMPLE STAIR: down from Rekknar\'s temple', note: 'In Rekknar\'s temple, a closed hall of pillars off the hallway\'s first corner (PASS TWO): the door in its back corner beside the ledger-stone opens on the stair down (the Dormant\'s the same). Through it: down past the cart level through the rock -- nothing of it seen from the cart road -- to the west hallway of the funerary.', at: [9, 16], hour: 10 },
    { id: 'chamber', key: 'solskaft_below', label: 'THE FUNERARY: the chamber and the empty bier', note: 'At the bottom, beside the bier under the oathstone: Pyro\'s chamber, doorless, nobody on the bier, one lamp kept (E on each). The tiers rise away to the west and the east, a step a tier, the niches in their walls; a stair down the middle row from each hallway.', at: [17, 10], hour: 10 },
    { id: 'easthall', key: 'solskaft_below', label: 'THE EAST HALLWAY: the shrines, the Warrens\' stair', note: 'In the east hallway by the Triad\'s chapel: the grave-anvil, Rekknar\'s ledger-stone, the Dormant\'s empty cut, the lamp, the kneeling-stone (E on each). South down the hallway, at its end, the flooded stair from the Warrens through its cut seal: it says where it goes and steps you back. Geirmund\'s wedge is the nearest, its top niches pried.', at: [31, 6], hour: 10 },
    { id: 'westhall', key: 'solskaft_below', label: 'THE WEST HALLWAY: the sealed doors, the closed street through the bars', note: 'In the west hallway: four warranted doors, sealed, on its west wall, and between them a grille -- through it the closed street in the dark, ten doors, every one barred (E on the grille: the lintels). The Scalebeam door barred with the rest: Ásdís lives over the stores now.', at: [6, 8], hour: 10 },
    { id: 'tiers', key: 'solskaft_below', label: 'THE TIERS: the seven families and the eighth place', note: 'On the west side\'s top tier: walk the tiers down by the stair and E on the niches -- a name, a season-mark, the lamp they fell at, each as the first game reads it; Asmund\'s gear at the base of his wedge, the eighth place waiting north of the stair. Audun\'s shield is on the east side, at the base of the wedge by Geirmund\'s.', at: [9, 9], hour: 10 },
    { id: 'lift', key: 'solskaft_cart', label: 'THE DEAD LIFT beside the smelters', note: 'On the cart level in the smelters: an old shaft in the corner, its frame and chains, the platform down at the bottom (E on it). Nothing else: no quest.', at: [27, 22], hour: 10 }
  ];
  // ================================================================ ÁSDÍS SCALEBEAM'S PLACE OVER THE WEST STORE: the one partial upper area (11-11 night, the same seat). RULED 11-11, Griz: "the
  // highway two stories below the orchard ground ceiling is correct - it might have to be made in partials, second story areas don't equate to an entire floor"; "didn't look like there
  // was an up to get to"; narrowed the same night, "we'll only need the upstairs place the scalebeam elder caring for ingrith offers the party i think". So of the lodging over the
  // stores only her place is walked: a small own floor -- her hearth, her table, her cot by the hearth, the window that is the one lit on main street -- reached by an outside stone
  // stair drawn up the west store's face (E on the door at its top), as the Halfway Inn's upstairs is its own small floor off its stair (js/inn.js In.UP). The rest of the lodging
  // stays shut fronts and dark windows from the street. Her words are the first game's (first/js/deep.js S.asdis): her greeting the first time and a line after, then her offer --
  // EAT AND SLEEP rests the party at her cot (the first game's asdisRest, a rest point; here the floor's long rest, js/mines.js M.sleep), NOT NOW.
  SK.ASDIS = 'solskaft_asdis';
  SK.LODGE = {
    solskaft_asdis: { side: 'w', name: 'Ásdís Scalebeam\'s place over the west store', rows: [
      '########',
      '#.H.T.k#',
      '#......#',
      '#S.....#',
      '########'], stair: [1, 3], at: [2, 3], face: [1, 0], hearth: [2, 1], window: [7, 2], cot: [6, 1],
      folk: [{ id: 'asdis', at: [3, 2], dir: 'down', kind: 'commonerwoman' }] }
  };
  SK.isLodge = function (key) { return !!SK.LODGE[key]; };
  SK.LABEL[SK.S8.needles] = 'the touch-needles'; SK.LABEL[SK.S8.weights] = 'the locked case'; SK.LABEL[SK.LINES.furnace] = 'the furnace'; SK.LABEL[SK.LINES.balance] = 'the balance';
  SK.LABEL[SK.LINES.assayLedger] = 'the standard ledger'; SK.LABEL[SK.LINES.hallBench] = 'the bench'; SK.LABEL[SK.LINES.petitionBench] = 'the petitioners\' bench'; SK.LABEL[SK.LINES.buttons] = 'the buttons and ingots'; SK.LABEL[SK.LINES.mark] = 'the assayers\' mark'; SK.LABEL[SK.LINES.shelf] = 'the crucible shelf'; SK.LABEL[SK.LINES.rack] = 'the spear rack'; SK.LABEL[SK.LINES.bench] = 'the bench';
  SK.LLEGEND = { '#': 'dwarfWall', '.': 'dwarfFloor', k: 'skBed', H: 'firepit', T: 'skCounter', S: 'skStair' };
  Object.assign(M.LAY, { skBed: ['k'] });
  SK.LLINES = {
    arrive: ['Up the stair inside the lodging door, over the west store: one room, a hearth lit, soup on it, and the window onto main street.'],
    hello: 'Her room: the hearth, the table, the cot by the hearth; the outside stair down to main street by the door.',
    cot: 'Her cot by the hearth, a blanket folded at its foot.',
    window: 'The window over main street, the light in it hers: the one lit window on the street.',
    hearth: 'Her hearth: a pot on the hook, the fire kept low.',
    stair: 'The stair, down to the lodging door on main street.',
    morning: 'Morning: the lamp still lit in her window, and the street waking under it.'
  };
  SK.LABEL[SK.LLINES.cot] = 'the cot'; SK.LABEL[SK.LLINES.window] = 'the window'; SK.LABEL[SK.LLINES.hearth] = 'the hearth';
  // her word, the first game's way (first/js/deep.js S.asdis): the greeting the first time, then one of her three lines in turn; then her offer, and the rest if it is taken (S.asdisRest)
  SK.asdisTalk = function* (B, u) {
    var R = D.roam, t = B.roam.token, f = B.roam.flags, i = f.asdisIdx || 0, said = i ? [SK.L(['deep.asdis1', 'deep.asdis2', 'deep.asdis3'][(i - 1) % 3])] : [].concat(SK.L('deep.asdis0'));
    f.asdisIdx = i + 1; if (u && !u.holdFacing) u.facing = D.spr.facingFor(t.x - u.x, t.y - u.y);
    D.sfx('popup');
    var a = yield { prompt: { who: t, title: (u && u.name ? u.name : 'ASDIS SCALEBEAM').toUpperCase(), lines: R.wrap(said.concat([SK.L('deep.asdisAsk')])), opts: [{ label: 'EAT AND SLEEP', value: 0 }, { label: 'NOT NOW', value: 1 }] } };
    SK.lastSaid = said.join(' ');
    if (a !== 0) return;
    f.asdisRested = (f.asdisRested || 0) + 1;
    B.card(R.wrap([SK.L('deep.asdisRest')]), 240); yield 30;
    yield* M.sleep(B, { morning: SK.LLINES.morning });
  };
  SK.LDOORS = [
    { id: 'lUpW', at: [[1, 3]], step: true, raw: true, title: 'THE STAIR DOWN', say: [SK.LLINES.stair], to: 'main street.', go: ['solskaft', 15, 3, [1, 0]] }
  ];
  SK.lmap = function (key) {
    var Lg = SK.LODGE[key], trig = [], rows = Lg.rows;
    trig.push({ id: 'lcot', rect: [Lg.cot[0], Lg.cot[1], 1, 1], on: 'use', script: 'sk:sign', text: SK.LLINES.cot, label: 'the cot' },
      { id: 'lhearth', rect: [Lg.hearth[0], Lg.hearth[1], 1, 1], on: 'use', script: 'sk:sign', text: SK.LLINES.hearth, label: 'the hearth' },
      { id: 'lwindow', rect: [Lg.window[0], Lg.window[1], 1, 1], on: 'use', script: 'sk:sign', text: SK.LLINES.window, label: 'the window' });
    SK.LDOORS.forEach(function (d) { d.at.forEach(function (q, i) { trig.push({ id: 'door_' + d.id + i, rect: [q[0], q[1], 1, 1], on: 'step', script: 'sk:door', door: d.id, label: 'the outside stair' }); }); });
    trig.forEach(function (t) { if (t.label && D.roam && D.roam.USE_NAME) D.roam.USE_NAME[t.id] = t.label; });
    var lights = [{ id: 'lkHearth', kind: 'map', x: Lg.hearth[0], y: Lg.hearth[1], bright: 10, dim: 15, color: 'fire', flame: true, seep: true }];
    return { id: key, name: 'Sólskaft', rows: rows.slice(), legend: SK.LLEGEND, music: 'inn', exits: {}, dark: true, lights: lights,
      npcs: (Lg.folk || []).map(function (p) { return { id: p.id, x: p.at[0], y: p.at[1], look: p.id, dir: p.dir }; }), triggers: trig, chests: [] };
  };
  Object.keys(SK.LODGE).forEach(function (key) {
    var Lg = SK.LODGE[key];
    M.FLOORS[key] = { src: key, own: true, map: function () { return SK.lmap(key); }, door: null, place: 'Sólskaft', sub: Lg.name, save: false, clock: true, iso: true,
      rate: { squaresPerHour: 500, fightHours: 0.25 }, phase: M.seepPhase, phaseLine: function () { return ''; }, gates: { stair: [Lg.at[0], Lg.at[1], Lg.face] } };
  });
  SK.CFOLK_ALL = function () { var o = SK.FOLK.concat(SK.CFOLK || []); Object.keys(SK.LODGE).forEach(function (k) { o = o.concat(SK.LODGE[k].folk || []); }); return o; };
  // the outside stair on the street, drawn so it reads as a way up: a flight of steps with a rail climbing the store's face to the lodging's door
  SK.pic.outsideStair = function (side) {
    var cv = document.createElement('canvas'); cv.width = 96; cv.height = 200; var cx = cv.getContext('2d'), ox = 48, oy = 170, st = D.iso.ramp('stone'), wd = D.iso.ramp('leather');
    for (var k = 0; k < 8; k++) {
      var t0 = 0.08 + k * 0.1, z = 10 + k * 12, a = side === 'n' ? -0.5 : -0.5, A = function (t, zz, o) { return side === 'n' ? P(ox, oy, t - 0.5, -0.5 + o, zz) : P(ox, oy, -0.5 + o, t - 0.5, zz); };
      poly(cx, [A(t0, z, 0), A(t0 + 0.12, z, 0), A(t0 + 0.12, z, 0.32), A(t0, z, 0.32)], rgb(st[st.length - 2]));
      poly(cx, [A(t0, z, 0.32), A(t0 + 0.12, z, 0.32), A(t0 + 0.12, z - 12, 0.32), A(t0, z - 12, 0.32)], rgb(st[2]));
    }
    var r0 = side === 'n' ? P(ox, oy, -0.42, -0.18, 26) : P(ox, oy, -0.18, -0.42, 26), r1 = side === 'n' ? P(ox, oy, 0.42, -0.18, 112) : P(ox, oy, -0.18, 0.42, 112);
    cx.strokeStyle = rgb(wd[1]); cx.lineWidth = 2; cx.beginPath(); cx.moveTo(r0[0], r0[1]); cx.lineTo(r1[0], r1[1]); cx.stroke();
    return { canvas: cv, ax: ox, ay: oy };
  };

  // ---------------------------------------------------------------- THE VAULT DOORS JOINED (RULED 11-11 night, his "go ahead and build your leans 1-3": the street joined to Silverton's
  // vault doors, saving on). Out: the vault doors onto the Gate Plaza a step south of the Edifice's threshold (js/town.js marks.vault). In: E at that threshold, Silverton's floor, to a
  // step inside the doors. A save on the street or the cart level names its own door (W.DOORS solskaft, solskaft_cart: no site of their own, as the Warrens' mouth camp) and a load
  // stands the party on the square it saved on (js/house.js H.atOf, H.toTown)
  if (W && W.DOORS) {
    W.DOORS.solskaft = { roam: SK.KEY, gates: { doors: [0, 1] } };
    W.DOORS.solskaft_cart = { roam: SK.CART, gates: { rampW: [0, 1] } };
    if (W.APPROACH) { W.APPROACH.solskaft = { mi: 4, z: Infinity }; W.APPROACH.solskaft_cart = { mi: 4, z: Infinity }; } // (as the Warrens' site-less door has: every door's approach the area's closest zoom, js/world.js W.closeZ -- bench world1103)
  }
  SK.WALK8 = '.=r,gdo'; // (the town's squares a party can stand on, as js/iso.js lays them: open and nothing standing)
  SK.vaultOut = function () { // (the plaza square nearest the threshold's south, ring by ring, that the party can stand on -- 11-12: the square a step south was a woodpile, and the town stood the party at its south gate)
    var L = (T.laidF && T.laidF[T.SCALE]) || (T.laidF = T.laidF || {}, T.laidF[T.SCALE] = T.lay(null, T.SCALE)), v = L.marks.vault; if (!v) return null;
    var ok = function (x, y) { var r = L.rows && L.rows[y]; return !!r && y > v[1] && SK.WALK8.indexOf(r.charAt(x)) >= 0; };
    for (var k = 1; k <= 4; k++) { var best = null; for (var dy = 1; dy <= k; dy++) for (var dx = -k; dx <= k; dx++) { if (Math.max(Math.abs(dx), dy) !== k && dy !== k) continue; if (ok(v[0] + dx, v[1] + dy) && (!best || Math.abs(dx) + dy < Math.abs(best[0] - v[0]) + best[1] - v[1])) best = [v[0] + dx, v[1] + dy]; } if (best) return best; }
    return [v[0], v[1] + 1];
  };
  SK.toTown = function* (B) { var at = SK.vaultOut(); SK.lastSaid = 'the vault doors'; yield* M.cross(B, 'silverton', 'south', at, ['{y}The vault doors{/}, out onto the Gate Plaza at the Edifice\'s foot: Silverton.']); };
  var tfloor0 = T.floor;
  T.floor = function (q, flags) {
    var def = tfloor0.apply(this, arguments), v = def && def.marks && def.marks.vault; if (!v) return def;
    var row = def.rows[v[1]] || '', x0 = v[0], x1 = v[0]; while (x0 > 0 && row.charAt(x0 - 1) === 'd') x0--; while (x1 < row.length - 1 && row.charAt(x1 + 1) === 'd') x1++;
    def.src8.triggers.push({ id: 'vault:solskaft', on: 'use', rect: [x0, v[1], x1 - x0 + 1, 1], town: 'door', door: { id: 'vault:solskaft', name: 'The vault doors of Sólskaft' } });
    if (D.roam && D.roam.USE_NAME) D.roam.USE_NAME['vault:solskaft'] = 'the vault doors';
    return def;
  };
  var fire1 = T.fire;
  T.fire = function* (B, trig) {
    if (trig && trig.id === 'vault:solskaft') { SK.lastSaid = 'in'; yield* M.go(B, SK.KEY, [18, SK.Y(1)], [0, -1], ['{y}SÓLSKAFT{/}, through the vault doors.']); return; }
    yield* fire1.apply(this, arguments);
  };
  // ---------------------------------------------------------------- SÓLSKAFT, shown (deep16/?solskaft -- the eyes row's door): a NEW GAME's four staged on the street level by the beat
  SK.BEATS = [
    { id: 'doors', label: 'THE VAULT DOORS: in off Fountain Street', note: 'Ten in the morning, a step inside the vault doors: Pyro on the left of them, Ketil on the right, facing in. Main street runs north up the screen\'s right: the cart ramp going down on the west along the front wall, the stable\'s apron on the east, the two shut stores, and the light on the oathstone ahead. Step back onto the doors: they say where they will go.', at: [18, 1], hour: 10 },
    { id: 'toll', label: 'THE TOLLHOUSE at the ramp', note: 'In the tollhouse in the front-west corner: the trade-counter facing the ramp, the scales under their cloth (E), the tariff board on the north wall (E from below it), the quartermaster behind his counter, the whole corner the tollhouse\'s (Ingrith\'s ledger-room is off the hallway since PASS TWO). Down the ramp\'s run to its mouth at the west end: the cart level.', at: [7, 4], hour: 10 },
    { id: 'stable', label: 'THE GUEST STABLE', note: 'On the apron by the stable door (the drill-sergeant and his four drill down in the wagon holding now). Into the stable: the stalls swept, the mangers empty, a forkful of old fodder, the trough off the cistern. The narrow ramp up at the east wall comes out here.', at: [31, 2], hour: 10 },
    { id: 'court', label: 'THE COURT AT NOON: the oathstone in the beam', note: 'Noon in the court: the oathstone on its pedestal in the Sunshaft\'s light (E on it), the trooper who watches the light. Past the arch north, the hallway: the temples at its first corners (PASS TWO, 11-12).', at: [18, 9], hour: 12 },
    { id: 'crown', label: 'THE HALLWAY: under the rock, the temples at its corners', note: 'Through the arch in the back rim (PASS TWO, 11-12, his "I still expected/wanted hallway"): main street on under the rock, fifty feet, lamp-lit, stone benches down its walls. West: Rekknar\'s temple at the first corner, the assay house, Ingrith\'s ledger-room; east: the Dormant\'s temple, the garrison\'s guardroom, the petitioners\' room. The throne room\'s doors at its end.', at: [18, 15], hour: 12 },
    { id: 'throne', label: 'THE THRONE ROOM: the empty seat', note: 'In the throne room, a few steps from its doors: the dais, the braziers, the high seat of the Silversands, empty (E on it). Walk back out: the oathstone sits straight down the street from the throne, and the doors beyond it.', at: [18, 26], hour: 12 },
    { id: 'night', label: 'THE STREET BY NIGHT', note: 'Ten at night inside the vault doors: the glass dark, no beam; the street by its lamps, the one lit window over the west store.', at: [18, 3], hour: 22 },
    { id: 'walk', label: 'THE WALK, doors to throne', note: 'The whole of it in one walk from the doors at nine in the morning: click the throne room\'s far end and watch the three stretches go by -- the glass, the light, the rock.', at: [18, 1], hour: 9 }
  ].concat(SK.CBEATS || [], SK.BBEATS || [], [
    { id: 'lodging', key: 'solskaft', label: 'THE WAY UP: the lodging door under the one lit window', note: 'On main street by the west store at dusk: the lodging door in its face, the lit window over it. E on the door: up into Ásdís Scalebeam\'s place, her one room over the store. The rest of the lodging over the stores stays shut fronts and dark windows.', at: [16, 3], hour: 18 },
    { id: 'asdis', key: 'solskaft_asdis', label: 'ÁSDÍS SCALEBEAM and her offer: a cot by the hearth', note: 'In her room over the west store at dusk. E on her: her first words, the first game\'s, and her offer -- EAT AND SLEEP (soup, bread, the cot by the hearth; the night\'s long rest, and morning) or NOT NOW. Again, and she has another word. Her hearth, her table, her cot, her window.', at: [4, 3], hour: 18 },
    { id: 'crownrooms', key: 'solskaft', label: 'THE HALLWAY\'S ROOMS: the assay house and Ingrith\'s west, the garrison and the petitioners east', note: 'Half way up the hallway: the assay house\'s door west (furnished from ART-140, nobody in it), the guardroom\'s east with the garrison\'s stair up; further, Ingrith\'s ledger-room west and the petitioners\' room east. The throne room ahead, narrower, further back.', at: [18, 19], hour: 12 },
    { id: 'ramp', key: 'solskaft', label: 'THE RAMP, STEPPED: down to the cart level as the Keeper\'s stair goes down', note: 'At the head of the cart ramp by the doors: walk west down it -- the floor drops a step every few squares (the slope tiles are the art desk\'s) to its mouth and the cart level.', at: [15, 2], hour: 10 }
  ]);
  SK.play = function (bt) {
    var H = D.house, R = D.roam, rec = H.fresh(); rec.at = { town: null }; rec.flags = Object.assign({ councilNotice: 1, councilSeen: 1 }, bt.flags || {});
    H.begin(rec, 0, null);
    var S = W && W.state && W.state(); if (S && bt.hour != null) S.t = Math.floor((S.t || 0) / 24) * 24 + bt.hour;
    D.push(R.make('?roam=' + (bt.key || SK.KEY) + '&hour=' + bt.hour, { save: H.living(H.cur), opts: { at8: SK.isLodge && SK.isLodge(bt.key) ? bt.at.slice() : [bt.at[0], SK.Y(bt.at[1])] }, house: true }));
  };
  SK.show = function (q) { return new D.roam.WetShow(q, { kind: 'solskaft', beats: SK.BEATS, play: SK.play, title: '{y}SÓLSKAFT, 11-11{/} -- the street level and the cart level on the diamonds (a show)' }); };
})();
