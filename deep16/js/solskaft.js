/* DEEP16 -- SÓLSKAFT ON THE GRID: THE STREET LEVEL (11-11, the Sólskaft build seat, started by the lanes desk on Griz's word: "We should be able to start the solskaft iso
   opus now"). The first of the town's floors as iso roam -- the one he walks first -- built on his reshaping of 11-11 (TarlynsPit/wiki/solskaft.md §The shape, his words
   CANON; pours-2026-11.md) and the weigh of the same day (cloud-notes/solskaft-iso-roam-weigh-2026-11-11.md, its floor-by-floor plan checked against MAPS.edifice), with
   his answers to it recorded in ..\handoff-2026-10-14-the-story-build.md (11-11): "6 - deserves iso tbh"; "what if we put another 30 feet of mainstreet between the stone
   and the throne?"; "Go with the leans, I meant the edifice walls and it didn't have any real footage, dug out mountain is correct".

   ONE FLOOR ON THE DIAMONDS (SK.ROWS, 38 x 32, north up the screen's right as the inn's): the Edifice's own width (its facade 190 ft, columns 11-48 of MAPS.edifice =
   x 0-37 here, the vault doors at 18-19 on its own squares), the front wall at the south row, and main street running north in his three stretches --
     SOUTH, under the glass, seven squares (35 ft) -- trade: inside the doors the cart ramp going down on the west (along the front wall, its mouth at the west end) and the
       guest stable on the east (ready, long empty, a little old fodder), the narrow ramp up at the east wall beside it; the tollhouse in the front-west corner at the ramp
       (the trade-counter facing it, the scales under their cloth, the tariff board, Ingrith's ledger-room, the quartermaster's counter); one deep store a side, shut,
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
    set(1, 4, 3, 6, '='); set(2, 4, 2, 4, 'l');              // Ingrith's ledger-room, its desk
    set(4, 5, 4, 5, 'D');                                    // its door off the tollhouse
    set(5, 4, 8, 6, '='); set(8, 4, 8, 4, 's');              // the tollhouse; the scales under their cloth
    set(6, 5, 7, 5, 'K');                                    // the quartermaster's counter (the clerk behind it, to the north)
    set(10, 3, 14, 7, 'S');                                  // the west store, shut, its lodging over (two storeys)
    set(23, 3, 27, 7, 'S');                                  // the east store, the same
    set(23, 1, 36, 2, '=');                                  // the stable's apron by the doors (the drill's ground)
    set(36, 2, 36, 5, 'v'); set(36, 6, 36, 6, 'X');          // the narrow ramp up from below at the east wall (its mouth at the north end)
    set(31, 3, 31, 3, 'D');                                  // the stable's door
    set(29, 4, 34, 6, '=');                                  // the stable
    set(29, 6, 32, 6, 'm'); set(33, 6, 33, 6, 't'); set(34, 5, 34, 5, 'h'); // its mangers, the trough off the cistern, the little fodder there is
    // THE COURT (r8-r13): the oathstone under the light; a temple each side
    set(13, 8, 24, 13, '=');
    set(18, 10, 19, 10, 'O');                                // the pedestal and the oathstone, in the Sunshaft's circle
    set(1, 8, 11, 13, '='); set(12, 10, 12, 11, 'D');        // Rekknar's temple (west), its doors on the court
    set(6, 13, 6, 13, 'L');                                  // his ledger-stone against the back wall
    set(26, 8, 36, 13, '='); set(25, 10, 25, 11, 'D');       // the Dormant's temple (east); the empty cut is in its back wall (SK.CUT)
    // THE BACK RIM (r14): an arch the crown's width
    set(16, 14, 21, 14, '=');
    // THE CROWN (r15-r20): his thirty feet under the rock, 6 wide; the garrison's stair off the east wall
    set(16, 15, 21, 20, '=');
    set(22, 17, 22, 18, 'D'); set(23, 16, 24, 19, '='); set(25, 17, 25, 18, 'u');
    // THE THRONE ROOM (r21 its doors, r22-r30)
    set(17, 21, 20, 21, 'D');
    set(6, 22, 31, 30, '=');
    set(18, 29, 19, 29, 'T');                                // the high seat on its dais (SK.DAIS)
    set(15, 28, 15, 28, 'b'); set(22, 28, 22, 28, 'b');      // braziers either side of the dais
    return g.map(function (row) { return row.join(''); });
  };
  SK.ROWS = SK.build();
  SK.LEGEND = { '#': 'dwarfWall', '=': 'dwarfFloor', D: 'doorway', v: 'skRamp', X: 'skMouth', u: 'skStair', K: 'skCounter', l: 'skDesk', s: 'skScales', S: 'skStore',
    m: 'skManger', t: 'skTrough', h: 'skFodder', O: 'skOathstone', L: 'skLedgerStone', T: 'skThrone', b: 'firepit' };
  Object.assign(M.LAY, { doorway: M.LAY.doorway || ['d'], skRamp: ['='], skMouth: ['d', 'X'], skStair: ['d', 'X'], skCounter: ['K'], skDesk: ['K'], skScales: ['k'], skManger: ['k'],
    skTrough: ['w'], skFodder: ['k'], skOathstone: ['k'], skLedgerStone: ['k'], skThrone: ['k'] });
  Object.assign(M.ROOF, { skStore: 'U' });
  SK.ROOFS = { U: { h: 9, roof: 'stone', wall: 'stone' } }; // (the stores two storeys over the token, their lodging the upper one: as the inn's house -- js/inn.js In.ROOFS)

  // ---------------------------------------------------------------- where things are (x, r)
  SK.STONE = [18.5, 10];      // (the oathstone's middle: the Sunshaft's circle on MAPS.edifice, centre 29.5, 4.8 = local 18.5, 10.2)
  SK.DAIS = [14, 27, 23, 30]; // (the dais, x0 r0 x1 r1: drawn, not raised -- a step of height on the grid is ten feet)
  SK.CUT = [31, 13];          // (the Dormant's empty cut, in the back wall over this square)
  SK.WINDOW = [15, 6];        // (the lit window, high on the west store's face over this street square: Ásdís's)
  SK.FOLK = [ // the first game's people who belong on this floor, with its looks (first/content/maps/solskaft.json), stood where the street puts them
    { id: 'pyro', at: [17, 1], dir: 'up', kind: 'trooper', sheet: 'pyro_p0' },     // (at the vault door, always -- CANON 07-24)
    { id: 'ketil', at: [20, 1], dir: 'up', kind: 'trooper' },                       // (beside him: "I stand beside him and count who goes by")
    { id: 'quartermaster', at: [6, 6], dir: 'down', kind: 'trooper' },              // (behind the quartermaster's counter, in the tollhouse)
    { id: 'drill1', at: [24, 1], dir: 'right', kind: 'trooper' }, { id: 'drill2', at: [26, 1], dir: 'right', kind: 'trooper' },
    { id: 'drill3', at: [24, 2], dir: 'right', kind: 'trooper' }, { id: 'drill4', at: [26, 2], dir: 'right', kind: 'trooper' },
    { id: 'drillmaster', at: [28, 1], dir: 'left', kind: 'drillsergeant' },        // (they drill by the tollhouse and the stables -- CANON 11-11)
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
    brick: 'Brick, and a red mark cut across it. The old cut a shaft crew broke into, sixty years ago. The water went bad through here, and then the town burned.'
  };
  SK.LINES = {
    arrive: ['Sólskaft, inside the vault doors: main street runs straight back into the mountain -- the stores under the glass, the oathstone in the light, and past it, under the rock, the way to the throne.'],
    hello: 'Main street: the ramp down on the left, the stable on the right, the court and the oathstone ahead; the crown and the throne room past the arch.',
    counter: 'The trade-counter: a cart going down the ramp paid here.',
    ledger: 'Ingrith\'s ledger-room: a desk, a lamp, and the ledger.',
    stable: 'The guest stable: stalls swept and ready, mangers empty. There is a little fodder, and it is old.',
    trough: 'The trough. Its water comes down from the cistern over the stable, the same as the fountains\' out front.',
    fodder: 'The fodder: a forkful or two, gone grey. Nobody has stabled a horse here in a long time.',
    window: 'Up over the west store, one window lit. Somebody lives in the lodging.',
    rekknarIn: 'Rekknar\'s temple: the Reckoner\'s, the ledger-stone against the back wall.',
    dormantIn: 'The Dormant\'s temple: bare walls, and a cut in the back one with nothing in it.'
  };
  // the doors that lead off this floor, drawn and marked: where each will go (none of them opens yet)
  SK.DOORS = [
    { id: 'vault', at: [[18, 0], [19, 0]], step: true, title: 'THE VAULT DOORS', say: ['Out through the vault doors: Fountain Street and the fountains.'], to: 'Silverton\'s Fountain Street (the doors join it later; this floor is reached by its own test door for now).' },
    { id: 'rampW', at: [[5, 1], [5, 2]], step: true, title: 'THE CART RAMP', say: ['The cart ramp goes down under the west stores: the wagon holding and the loading lane.'], to: 'the cart level.', go: ['solskaft_cart', 5, null, [-1, 0]] },
    { id: 'rampE', at: [[36, 6]], step: true, title: 'THE NARROW RAMP', say: ['The narrow ramp up from the cart road\'s loop, coming out beside the stable.'], to: 'the cart level.', go: ['solskaft_cart', 36, 7, [0, -1]] },
    { id: 'stair', at: [[25, 17], [25, 18]], step: true, title: 'THE GARRISON\'S STAIR', say: ['A stair up into the rock: the garrison\'s, to the armory and the quarters behind the waterfall.'], to: 'the garrison\'s floor behind the falls (not yet built).' },
    { id: 'storeW', at: [[14, 4], [14, 5]], title: 'A TRADE STORE', say: ['A trade store, shut. Get your wagon loaded downstairs while you shop upstairs -- when it is open.'], to: 'the store\'s floor (not yet built); its loading is on the cart level.' },
    { id: 'lodgeW', at: [[14, 3]], title: 'THE LODGING STAIR', say: ['A narrow door beside the store: the stair up to the lodging over it.'], to: 'the lodging over the stores (the second floor, not yet built).' },
    { id: 'storeE', at: [[23, 4], [23, 5], [23, 6]], title: 'A STORE OF FINISHED GOODS', say: ['A store of finished and fashioned things, shut.'], to: 'the store\'s floor (not yet built); its loading is on the cart level.' },
    { id: 'lodgeE', at: [[23, 7]], title: 'THE LODGING STAIR', say: ['A narrow door beside the store: the stair up to the lodging over it.'], to: 'the lodging over the stores (the second floor, not yet built).' },
    { id: 'treasury', at: [[15, 16]], title: 'THE TREASURY', say8: 'deep.treasury', to: 'its room (not yet built).' },
    { id: 'mint', at: [[15, 18]], title: 'THE MINT', say: [null], to: 'nowhere: the king sealed it.' },
    { id: 'assay', at: [[15, 20]], title: 'THE ASSAY HOUSE', say: [null], to: 'its room (not yet built).' }
  ];
  (function () { var S8 = SK.S8, Ln = SK.LINES, o = {}; o[S8.scales] = 'the scales'; o[S8.tariff] = 'the tariff board'; o[S8.throne] = 'the high seat'; o[S8.oath] = 'the oathstone'; o[S8.hero] = 'the hero-wall';
    o[S8.rekknar] = 'Rekknar\'s ledger-stone'; o[S8.dormant] = 'the Dormant\'s cut'; o[Ln.counter] = 'the trade-counter'; o[Ln.ledger] = 'the ledger desk'; o[Ln.trough] = 'the trough'; o[Ln.fodder] = 'the fodder'; o[Ln.window] = 'the lit window'; SK.LABEL = o; })();
  SK.L = function (k) { return D.counter && D.counter.L ? D.counter.L(k) : k; };
  SK.doorById = function (id) { return SK.DOORS.concat(SK.CDOORS || []).filter(function (z) { return z.id === id; })[0] || null; };
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
    } else { lamp('skCourtW', 15, 10); lamp('skCourtE', 22, 10); lamp('skStreetW', 15, 4); lamp('skStreetE', 22, 4); }
    lamp('skDoorW', 16, 1); lamp('skDoorE', 21, 1);                                   // (the vault doors' lamps)
    lamp('skToll', 5, 5, 5, 10); lamp('skLedger', 2, 5, 5, 5); lamp('skStable', 31, 4, 5, 10);
    lamp('skRekknar', 6, 11, 5, 10); lamp('skDormant', 31, 11, 5, 10);
    [15, 17, 19].forEach(function (r) { lamp('skCrownW' + r, 16, r, 5, 10); }); [16, 18, 20].forEach(function (r) { lamp('skCrownE' + r, 21, r, 5, 10); }); // (the crown under the rock: lamplight, day and night)
    lamp('skThrone', 18, 27, 10, 15); lamp('skHallW', 9, 25, 5, 10); lamp('skHallE', 28, 25, 5, 10);
    return out;
  };
  SK.LABEL = SK.LABEL || {}; // (the HUD's name for each sign by its words: js/roam.js R.USE_NAME)
  SK.sign = function (x, r, text) { var lb = SK.LABEL[text]; return { id: 'sign' + x + '_' + r, rect: [x, SK.Y(r), 1, 1], on: 'use', script: 'sk:sign', text: text, label: lb }; };
  SK.map = function (hour) {
    var trig = [], Y = SK.Y;
    trig.push(SK.sign(8, 4, SK.S8.scales), SK.sign(7, 7, SK.S8.tariff), SK.sign(18, 10, SK.S8.oath), SK.sign(19, 10, SK.S8.oath), SK.sign(18, 29, SK.S8.throne), SK.sign(19, 29, SK.S8.throne),
      SK.sign(6, 13, SK.S8.rekknar), SK.sign(SK.CUT[0], SK.CUT[1] + 1, SK.S8.dormant), SK.sign(2, 4, SK.LINES.ledger), SK.sign(33, 6, SK.LINES.trough), SK.sign(34, 5, SK.LINES.fodder));
    for (var x = 5; x <= 7; x++) trig.push(SK.sign(x, 3, SK.LINES.counter));
    for (var r = 15; r <= 20; r++) { if (!SK.doorAt(15, r)) trig.push(SK.sign(15, r, SK.S8.hero)); if (SK.ROWS[Y(r)].charAt(22) === '#') trig.push(SK.sign(22, r, SK.S8.hero)); } // (the hero-wall down both walls of the crown)
    trig.push(SK.sign(14, SK.WINDOW[1], SK.LINES.window), SK.sign(14, 7, SK.LINES.window));
    SK.DOORS.forEach(function (d) { d.at.forEach(function (q, i) { trig.push({ id: 'door_' + d.id + i, rect: [q[0], Y(q[1]), 1, 1], on: d.step ? 'step' : 'use', script: 'sk:door', door: d.id }); }); });
    trig.push({ id: 'skStable', rect: [31, Y(3), 1, 1], on: 'step', script: 'sk:sign', text: SK.LINES.stable, once: true },
      { id: 'skRekknar', rect: [12, Y(11), 1, 2], on: 'step', script: 'sk:sign', text: SK.LINES.rekknarIn, once: true },
      { id: 'skDormant', rect: [25, Y(11), 1, 2], on: 'step', script: 'sk:sign', text: SK.LINES.dormantIn, once: true });
    trig.forEach(function (t) { var d0 = t.door && SK.DOORS.filter(function (z) { return z.id === t.door; })[0], lb = t.label || (d0 && d0.title.toLowerCase().replace(/^(?!the )/, 'the ')); if (lb && D.roam && D.roam.USE_NAME) D.roam.USE_NAME[t.id] = lb; });
    var npcs = SK.FOLK.map(function (p) { return { id: p.id, x: p.at[0], y: Y(p.at[1]), look: p.id, dir: p.dir }; });
    return { id: SK.KEY, name: 'Sólskaft', rows: SK.ROWS.slice(), legend: SK.LEGEND, music: 'dungeon', exits: {}, dark: true, lights: SK.lights(hour), npcs: npcs, triggers: trig, chests: [] };
  };
  M.FLOORS[SK.KEY] = { src: SK.KEY, own: true, map: SK.map, door: null, place: 'Sólskaft', sub: 'the street level: main street', save: false, clock: true, iso: true,
    rate: { squaresPerHour: 500, fightHours: 0.25 }, phase: M.seepPhase, phaseLine: function (h) { return M.night(h) ? 'Night in Sólskaft: the glass is dark, and the street goes by its lamps.' : 'Day on the glass: the light comes down the shaft onto the stone.'; },
    gates: { doors: [18, SK.Y(1), [0, -1]], court: [18, SK.Y(8), [0, -1]], crown: [18, SK.Y(15), [0, -1]], throne: [18, SK.Y(26), [0, -1]], rampW: [15, SK.Y(1), [1, 0]], rampE: [36, SK.Y(1), [0, 1]] } }; // (save: false -- no way in from THE WORLD yet, so a SAVE here would have no door to stand the party at)
  SK.isFloor = function (key) { return key === SK.KEY || key === SK.CART; };
  SK.CART = 'solskaft_cart';
  SK.folkOf = function (id) { return SK.FOLK.concat(SK.CFOLK || []).filter(function (p) { return p.id === id; })[0] || null; };
  SK.sheetOf = function (id) { var f = SK.folkOf(id); return f && f.sheet; };
  var floor0 = M.floor;
  M.floor = function (key, q, flags, hour) {
    var def = floor0.apply(this, arguments); if (!SK.isFloor(key)) return def;
    flags = flags || {};
    var cart = key === SK.CART;
    def.page = true;            // (paged: painted in pieces as the camera comes to it -- the weigh's measure, ~0 at the door; RULED 11-11, "7 - sounds good")
    def.ft = 5; def.stone = 'grey'; def.hud = 'Sólskaft'; def.where = function () { return SK.where(); };
    def.roofs = Object.assign({}, def.roofs, SK.ROOFS);
    def.under = def.rows.map(function (row) { return row.split('').map(function (c) { return 'kKwUWf'.indexOf(c) >= 0 ? '=' : ' '; }).join(''); }); // (the dressed stone under the things standing on it, as the inn's boards: js/iso.js `under`)
    def.people.forEach(function (p) { var f = SK.folkOf(p.id); if (f) p.kind = f.kind; });
    var h = hour != null ? hour : M.hourNow(q), first = !flags['seen:' + key]; flags['seen:' + key] = 1; // (the first-visit flag, by floor: the fog's small half -- seen:solskaft, seen:solskaft_cart)
    def.firstVisit = first;
    def.hello = ['{y}SÓLSKAFT{/} -- ' + (cart ? 'the cart level' : 'the street level') + ', on the grid\'s diamonds (' + def.w + ' x ' + def.h + ' squares), ' + (W && W.todAt ? W.todAt(h) : '') + '.']
      .concat(first ? (cart ? SK.CLINES.arrive : SK.LINES.arrive) : [], [cart ? SK.CLINES.hello : SK.LINES.hello, '{g}Click to walk, or the arrows. E: a word, a door. O: the formation. L: the floor map.{/}']);
    return def;
  };
  // the HUD's place by where the party stands
  SK.where = function () {
    var t = D.roam && D.battle && D.battle.roam && D.battle.roam.token, key = D.roam && D.roam.def && D.roam.def.key; if (!t) return 'main street';
    var r = SK.H - 1 - t.y;
    if (key === SK.CART) return r <= 7 && t.x <= 8 ? 'the wagon holding' : r <= 2 && t.x <= 14 ? 'the cart ramp' : t.x === 36 && r <= 6 ? 'the narrow ramp' : r <= 14 && t.x >= 9 && t.x <= 13 ? 'the west loading lane' : r <= 14 && t.x >= 24 && t.x <= 28 ? 'the east loading lane' : r <= 14 && t.x <= 8 ? 'the shroom farm' : r <= 14 && t.x >= 29 ? 'the road to the narrow ramp' : r <= 14 ? 'the road round the drum' : r <= 17 && t.x <= 30 ? 'the road behind the drum' : t.x >= 31 ? 'the highway\'s mouth' : t.x <= 10 ? 'the Forge-Father\'s temple' : t.x <= 22 ? 'the forge' : 'the smelters';
    return r <= 0 ? 'the vault doors' : r <= 7 ? (t.x <= 9 && r >= 3 ? 'the tollhouse' : t.x >= 28 && r >= 3 ? 'the guest stable' : 'main street, under the glass') : r <= 13 ? (t.x <= 12 ? 'Rekknar\'s temple' : t.x >= 25 ? 'the Dormant\'s temple' : 'the court of the oathstone') : r <= 20 ? (t.x >= 22 ? 'the garrison\'s stair' : 'the crown, under the rock') : 'the throne room';
  };
  // the people's figures: the garrison's trooper and sergeant (data/foes.js), Pyro his own sheet (js/classes.js pyro_p0)
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
    if (def && SK.isFloor(def.key) && trig.town === 'talk' && SK.WORDS[trig.npc]) {
      var u = B.units.filter(function (x) { return x.npc === trig.npc; })[0], t = B.roam.token;
      if (u && !u.holdFacing) u.facing = D.spr.facingFor(t.x - u.x, t.y - u.y);
      B.card(D.roam.wrap(['{y}' + (u ? u.name : trig.npc) + '{/}'].concat(SK.WORDS[trig.npc]())), 420); D.sfx('popup'); yield 20; return;
    }
    yield* fire0.apply(this, arguments);
  };
  // the squares: the signs, and the doors that say where they will go (a step onto a way off steps back)
  var trigger0 = M.trigger;
  M.trigger = function* (B, trig, at) {
    var s = trig.script; if (!/^sk:/.test(s || '')) { yield* trigger0.apply(this, arguments); return; }
    var say = [];
    if (s === 'sk:sign') say = [trig.text || ''];
    else if (s === 'sk:door') {
      var d = SK.doorById(trig.door);
      if (d && d.go && M.FLOORS[d.go[0]]) { var t = B.roam.token, rr = d.go[2] == null ? SK.H - 1 - t.y : d.go[2]; SK.lastSaid = d.title; yield* M.go(B, d.go[0], [d.go[1], SK.Y(rr)], d.go[3]); return; } // (a ramp between the floors built: down or up it, on the same row of the ramp where it is two wide)
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
    var piece = function (x, r, f, o) { var s = sq(x, r); if (!s) return; o = o || {}; add({ kind: o.kind || 'sk', sq: s, depth: s.x + s.y + (o.d || 0.5), gz: 0, fx: o.fx, fy: o.fy, layer: o.layer }, f); };
    if (def.key === SK.CART) { SK.dressCart(m, def, sq, off, piece, add); m.sorted = null; return m; }
    // the oathstone on its pedestal, and the beam on it by day
    off(sq(18, 10), 'the oathstone'); off(sq(19, 10), 'the oathstone');
    piece(18, 10, SK.pic.oathstone, { fx: 19, fy: Y(10) + 0.5, d: 1.5 });
    if (def.skDay) piece(18, 10, SK.pic.beam, { fx: 19, fy: Y(10) + 0.5, d: 1.7 });
    // the throne on its dais
    off(sq(18, 29), 'the high seat'); off(sq(19, 29), 'the high seat');
    var dz = sq(SK.DAIS[0], SK.DAIS[3]); if (dz) add({ kind: 'decal', sq: dz, depth: dz.x + dz.y - 0.6, gz: 0, layer: -1 }, function () { return SK.pic.dais(SK.DAIS[2] - SK.DAIS[0] + 1, SK.DAIS[3] - SK.DAIS[1] + 1); });
    piece(18, 29, SK.pic.throne, { fx: 19, fy: Y(29) + 0.5, d: 1.5 });
    off(sq(6, 13), 'Rekknar\'s ledger-stone'); piece(6, 13, SK.pic.stele);
    piece(SK.CUT[0], SK.CUT[1], SK.pic.cut, { d: -0.4 });
    off(sq(8, 4), 'the scales'); piece(8, 4, SK.pic.scales);
    // the ramps' runs
    for (var x = 6; x <= 14; x++) [1, 2].forEach(function (r) { var s = sq(x, r); if (s) add({ kind: 'decal', sq: s, depth: s.x + s.y, gz: 0, layer: -1 }, function () { return SK.pic.chevron('w'); }); });
    for (var r = 2; r <= 5; r++) { var s2 = sq(36, r); if (s2) add({ kind: 'decal', sq: s2, depth: s2.x + s2.y, gz: 0, layer: -1 }, function () { return SK.pic.chevron('n'); }); }
    // the faces: the west store's front shuttered and its lodging's windows (one lit), the lodging door; the crown's west wall -- the hero-wall and the three doors
    [4, 5].forEach(function (r) { piece(15, r, function () { return SK.pic.face('shutter', 'w'); }, { d: -0.4 }); });
    [3, 4, 5, 7].forEach(function (r) { piece(15, r, function () { return SK.pic.face('dark', 'w'); }, { d: -0.35 }); });
    piece(SK.WINDOW[0], SK.WINDOW[1], function () { return SK.pic.face('lit', 'w'); }, { d: -0.35 });
    piece(15, 3, function () { return SK.pic.face('door', 'w'); }, { d: -0.4 });
    for (var rc = 15; rc <= 20; rc++) { var dd = SK.doorAt(15, rc); piece(16, rc, (function (k) { return function () { return SK.pic.face(k, 'w'); }; })(dd ? (dd.id === 'mint' ? 'sealed' : 'door') : 'names'), { d: -0.4 }); }
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
    set(2, 9, 7, 13, 'n'); set(8, 11, 8, 11, 'D');
    // the Forge-Father's temple, west of the forge
    set(2, 19, 10, 24, '='); set(6, 18, 6, 18, 'D'); set(6, 24, 6, 24, 'A');
    // the forge, and the armory's racks on its west wall
    set(13, 19, 22, 25, '='); set(16, 18, 19, 18, 'D');
    set(17, 25, 18, 25, 'b'); set(17, 22, 17, 22, 'A'); set(13, 20, 13, 24, 'S');
    // the smelters and the cupel-hearth, cold
    set(24, 19, 29, 25, '='); set(26, 18, 26, 18, 'D');
    set(25, 25, 27, 25, 'F'); set(29, 21, 29, 21, 'C');
    // the highway's mouth: the lane north from the road, the gate across it, the road beyond going away into the dark
    set(31, 15, 34, 25, '='); set(31, 26, 34, 26, 'G'); set(31, 27, 34, 30, '=');
    return g.map(function (row) { return row.join(''); });
  };
  SK.CROWS = SK.cbuild();
  SK.CLEGEND = { '#': 'dwarfWall', '=': 'dwarfFloor', D: 'doorway', v: 'skRamp', U: 'skStair', W: 'skWagon', k: 'crate', Q: 'skDrum', n: 'fungus', A: 'skAnvil', b: 'firepit',
    S: 'skRack', F: 'skFurnace', C: 'skCupel', G: 'skGate' };
  Object.assign(M.LAY, { skWagon: ['W'], skDrum: ['#'], skAnvil: ['k'], skRack: ['S'], skFurnace: ['k'], skCupel: ['k'], skGate: ['f'] });
  SK.CFOLK = [
    { id: 'smith', at: [19, 22], dir: 'left', kind: 'trooper' },            // (the Copperbottom smith at the forge -- "AT THE FORGE" on the family's bar)
    { id: 'smelterhand', at: [27, 23], dir: 'down', kind: 'trooper' },      // (sweeping the cold smelters: "Orders.")
    { id: 'gatewatch', at: [33, 24], dir: 'down', kind: 'trooper' },        // (the gate watch, inside the highway's gate)
    { id: 'shroomer', at: [4, 11], dir: 'down', kind: 'trooper' }           // (in the shroom farm's dark)
  ];
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
    { id: 'cTrade', at: [[30, 22]], title: 'THE TRADE HALL', say: [null], to: 'its hall (not yet built), boarded from this side.' }
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
  M.FLOORS[SK.CART] = { src: SK.CART, own: true, map: SK.cmap, door: null, place: 'Sólskaft', sub: 'the cart level: the road round the drum', save: false, clock: true, iso: true,
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
    for (var x = 6; x <= 13; x++) [1, 2].forEach(function (r) { var s = sq(x, r); if (s) add({ kind: 'decal', sq: s, depth: s.x + s.y, gz: 0, layer: -1 }, function () { return SK.pic.chevron('w'); }); });
    for (var r = 3; r <= 6; r++) { var s2 = sq(36, r); if (s2) add({ kind: 'decal', sq: s2, depth: s2.x + s2.y, gz: 0, layer: -1 }, function () { return SK.pic.chevron('n'); }); }
    [[11, 4], [11, 6], [26, 4], [26, 6]].forEach(function (q) { var s = sq(q[0], q[1]); if (s) add({ kind: 'decal', sq: s, depth: s.x + s.y, gz: 0, layer: -1 }, SK.pic.trap); });
    SK.DRUM().forEach(function (q) { var e = m.at(q[0] + 1, q[1]); if (e && e.open) add({ kind: 'sk', sq: e, depth: e.x + e.y - 0.4, gz: 0 }, SK.pic.carve); }); // (its faces toward the eye: the east ones -- the rest of its ring is seen from behind it)
    [[6, 24], [17, 22]].forEach(function (q) { off(sq(q[0], q[1]), 'the anvil'); piece(q[0], q[1], SK.pic.anvil); });
    [25, 26, 27].forEach(function (x2) { off(sq(x2, 25), 'the cold furnace'); piece(x2, 25, SK.pic.furnace); });
    off(sq(29, 21), 'the cupel-hearth'); piece(29, 21, SK.pic.cupel);
    piece(31, 25, SK.pic.rack, { d: -0.4 });
    piece(31, 22, function () { return SK.pic.face('sealed', 'w'); }, { d: -0.4 }); // (the trade hall's boarded door on the lane's west wall)
  };
  // ---------------------------------------------------------------- the cart level, shown
  SK.CBEATS = [
    { id: 'rampfoot', key: 'solskaft_cart', label: 'THE CART LEVEL: the ramp\'s foot and the wagon holding', note: 'Ten in the morning at the foot of the cart ramp: the wagon holding in the front-west corner under the tollhouse, one wagon waiting under its cover; the ramp rising east to main street (walk up it: the street level); the west loading lane running north under the west store, its hoist-traps overhead.', at: [6, 2], hour: 10 },
    { id: 'drum', key: 'solskaft_cart', label: 'THE DRUM: the road round the funerary\'s wall', note: 'On the east loading lane beside the drum: a ring of dressed stone carved its whole length (grey-boxed: the carving is the art desk\'s later), nothing of what is inside seen, no door in it. E on it from any side of the road.', at: [24, 11], hour: 10 },
    { id: 'forge', key: 'solskaft_cart', label: 'THE FORGE, the Forge-Father\'s temple, the smelters', note: 'Behind the drum: the forge lit, the Copperbottom smith at his anvil, the armory\'s racks on the west wall; the Forge-Father\'s temple west of it (his anvil, worn to a saddle); the smelters east, cold, and the cupel-hearth, a trooper sweeping them.', at: [18, 17], hour: 10 },
    { id: 'gate', key: 'solskaft_cart', label: 'THE HIGHWAY\'S MOUTH: the gate, the ledger-lamp rack', note: 'In the highway\'s lane in the north-east: the gate shut across it, the gate watch, the ledger-lamp rack beside the gate (three hooks, three lamps), the trade hall\'s boarded door on the west side. The lane joins the road behind the drum: the second import lane.', at: [32, 21], hour: 10 },
    { id: 'loop', key: 'solskaft_cart', label: 'THE LOOP, holding to the narrow ramp', note: 'From the holding: click the foot of the narrow ramp at the east wall and watch the cart road go -- north under the west store, round behind the drum past the forge, south under the east store, east to the ramp. Walk up it: the street, beside the stable.', at: [6, 4], hour: 10 }
  ];

  // ---------------------------------------------------------------- SÓLSKAFT, shown (deep16/?solskaft -- the eyes row's door): a NEW GAME's four staged on the street level by the beat
  SK.BEATS = [
    { id: 'doors', label: 'THE VAULT DOORS: in off Fountain Street', note: 'Ten in the morning, a step inside the vault doors: Pyro on the left of them, Ketil on the right, facing in. Main street runs north up the screen\'s right: the cart ramp going down on the west along the front wall, the stable\'s apron on the east with the drill on it, the two shut stores, and the light on the oathstone ahead. Step back onto the doors: they say where they will go.', at: [18, 1], hour: 10 },
    { id: 'toll', label: 'THE TOLLHOUSE at the ramp', note: 'In the tollhouse in the front-west corner: the trade-counter facing the ramp, the scales under their cloth (E), the tariff board on the north wall (E from below it), the quartermaster behind his counter, Ingrith\'s ledger-room through the door on the west. Down the ramp\'s run to its mouth at the west end: the cart level.', at: [7, 4], hour: 10 },
    { id: 'stable', label: 'THE GUEST STABLE and the drill', note: 'On the apron by the stable door: the drill-sergeant and his four. Into the stable: the stalls swept, the mangers empty, a forkful of old fodder, the trough off the cistern. The narrow ramp up at the east wall comes out here.', at: [31, 2], hour: 10 },
    { id: 'court', label: 'THE COURT AT NOON: the oathstone in the beam', note: 'Noon in the court: the oathstone on its pedestal in the Sunshaft\'s light (E on it), the trooper who watches the light, Rekknar\'s temple through the doors west (his ledger-stone), the Dormant\'s east (the empty cut in its back wall). Both temples have room for a stair down; none is cut.', at: [18, 9], hour: 12 },
    { id: 'crown', label: 'THE CROWN: under the rock, the hero-wall', note: 'Through the arch in the back rim: thirty feet of street under the rock, one storey, lamp-lit. The hero-wall down both walls (E on either), the treasury, the mint (sealed) and the assay house\'s doors on the west, the garrison\'s stair up on the east. The throne room\'s doors ahead.', at: [18, 15], hour: 12 },
    { id: 'throne', label: 'THE THRONE ROOM: the empty seat', note: 'In the throne room, a few steps from its doors: the dais, the braziers, the high seat of the Silversands, empty (E on it). Walk back out: the oathstone sits straight down the street from the throne, and the doors beyond it.', at: [18, 26], hour: 12 },
    { id: 'night', label: 'THE STREET BY NIGHT', note: 'Ten at night inside the vault doors: the glass dark, no beam; the street by its lamps, the one lit window over the west store.', at: [18, 3], hour: 22 },
    { id: 'walk', label: 'THE WALK, doors to throne', note: 'The whole of it in one walk from the doors at nine in the morning: click the throne room\'s far end and watch the three stretches go by -- the glass, the light, the rock.', at: [18, 1], hour: 9 }
  ].concat(SK.CBEATS || []);
  SK.play = function (bt) {
    var H = D.house, R = D.roam, rec = H.fresh(); rec.at = { town: null }; rec.flags = Object.assign({ councilNotice: 1, councilSeen: 1 }, bt.flags || {});
    H.begin(rec, 0, null);
    var S = W && W.state && W.state(); if (S && bt.hour != null) S.t = Math.floor((S.t || 0) / 24) * 24 + bt.hour;
    D.push(R.make('?roam=' + (bt.key || SK.KEY) + '&hour=' + bt.hour, { save: H.living(H.cur), opts: { at8: [bt.at[0], SK.Y(bt.at[1])] }, house: true }));
  };
  SK.show = function (q) { return new D.roam.WetShow(q, { kind: 'solskaft', beats: SK.BEATS, play: SK.play, title: '{y}SÓLSKAFT, 11-11{/} -- the street level and the cart level on the diamonds (a show)' }); };
})();
