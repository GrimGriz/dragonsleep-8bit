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
    { id: 'rampW', at: [[5, 1], [5, 2]], step: true, title: 'THE CART RAMP', say: ['The cart ramp goes down under the west stores: the wagon holding and the loading lane.'], to: 'the cart level, below (the next floor to be built).' },
    { id: 'rampE', at: [[36, 6]], step: true, title: 'THE NARROW RAMP', say: ['The narrow ramp up from the cart road\'s loop, coming out beside the stable.'], to: 'the cart level, below (the next floor to be built).' },
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
  SK.doorAt = function (x, r) { for (var i = 0; i < SK.DOORS.length; i++) if (SK.DOORS[i].at.some(function (q) { return q[0] === x && q[1] === r; })) return SK.DOORS[i]; return null; };
  SK.doorSay = function (d) {
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
    gates: { doors: [18, SK.Y(1), [0, -1]], court: [18, SK.Y(8), [0, -1]], crown: [18, SK.Y(15), [0, -1]], throne: [18, SK.Y(26), [0, -1]] } }; // (save: false -- no way in from THE WORLD yet, so a SAVE here would have no door to stand the party at)
  SK.sheetOf = function (id) { var f = SK.FOLK.filter(function (p) { return p.id === id; })[0]; return f && f.sheet; };
  var floor0 = M.floor;
  M.floor = function (key, q, flags, hour) {
    var def = floor0.apply(this, arguments); if (key !== SK.KEY) return def;
    flags = flags || {};
    def.page = true;            // (paged: painted in pieces as the camera comes to it -- the weigh's measure, ~0 at the door; RULED 11-11, "7 - sounds good")
    def.ft = 5; def.stone = 'grey'; def.hud = 'Sólskaft'; def.where = function () { return SK.where(D.roam.token ? D.roam.token() : null); };
    def.roofs = Object.assign({}, def.roofs, SK.ROOFS);
    def.under = def.rows.map(function (row) { return row.split('').map(function (c) { return 'kKwU'.indexOf(c) >= 0 ? '=' : ' '; }).join(''); }); // (the dressed stone under the things standing on it, as the inn's boards: js/iso.js `under`)
    def.people.forEach(function (p) { var f = SK.FOLK.filter(function (z) { return z.id === p.id; })[0]; if (f) p.kind = f.kind; });
    var h = hour != null ? hour : M.hourNow(q), first = !flags['seen:' + SK.KEY]; flags['seen:' + SK.KEY] = 1; // (the first-visit flag, by floor: the fog's small half)
    def.firstVisit = first;
    def.hello = ['{y}SÓLSKAFT{/} -- the street level, on the grid\'s diamonds (' + def.w + ' x ' + def.h + ' squares), ' + (W && W.todAt ? W.todAt(h) : '') + '.']
      .concat(first ? SK.LINES.arrive : [], [SK.LINES.hello, '{g}Click to walk, or the arrows. E: a word, a door. O: the formation. L: the floor map.{/}']);
    return def;
  };
  // the HUD's place by where the party stands
  SK.where = function () {
    var t = D.roam && D.battle && D.battle.roam && D.battle.roam.token; if (!t) return 'main street';
    var r = SK.H - 1 - t.y;
    return r <= 0 ? 'the vault doors' : r <= 7 ? (t.x <= 9 && r >= 3 ? 'the tollhouse' : t.x >= 28 && r >= 3 ? 'the guest stable' : 'main street, under the glass') : r <= 13 ? (t.x <= 12 ? 'Rekknar\'s temple' : t.x >= 25 ? 'the Dormant\'s temple' : 'the court of the oathstone') : r <= 20 ? (t.x >= 22 ? 'the garrison\'s stair' : 'the crown, under the rock') : 'the throne room';
  };
  // the people's figures: the garrison's trooper and sergeant (data/foes.js), Pyro his own sheet (js/classes.js pyro_p0)
  var people0 = T.people;
  T.people = function (B) {
    people0.apply(this, arguments);
    var def = D.roam && D.roam.def; if (!def || def.key !== SK.KEY) return;
    var want = [];
    B.units.forEach(function (u) { var sh = typeof u.npc === 'string' && SK.sheetOf(u.npc); if (sh && (!D.SHEETS || D.SHEETS[sh] !== undefined || true)) { u.sheet = sh; want.push(sh); } });
    if (want.length && D.spr && D.spr.prefetch) D.spr.prefetch(want);
  };
  // a word with one of them: the first game's, or the standing line for the two whose first word is a scene
  var fire0 = T.fire;
  T.fire = function* (B, trig) {
    var def = D.roam.def;
    if (def && def.key === SK.KEY && trig.town === 'talk' && SK.WORDS[trig.npc]) {
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
    else if (s === 'sk:door') { var d = SK.DOORS.filter(function (z) { return z.id === trig.door; })[0]; if (d) say = SK.doorSay(d); if (trig.on === 'step') M.stepBack(B); }
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
    var m = load0.apply(this, arguments); if (!def || def.key !== SK.KEY) return m;
    var lazy = !!def.page, Y = SK.Y, add = function (p, f) { if (lazy) p.make = f; else p.img = f(); m.props.push(p); };
    var sq = function (x, r) { return m.at(x, Y(r)); }, off = function (s, name) { if (!s) return; s.stands = name; m.props = m.props.filter(function (p) { return p.sq !== s || p.kind !== 'block'; }); };
    var piece = function (x, r, f, o) { var s = sq(x, r); if (!s) return; o = o || {}; add({ kind: o.kind || 'sk', sq: s, depth: s.x + s.y + (o.d || 0.5), gz: 0, fx: o.fx, fy: o.fy, layer: o.layer }, f); };
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
  M.floor = function (key, q, flags, hour) { var def = floor1.apply(this, arguments); if (key === SK.KEY) def.skDay = SK.isDay(hour != null ? hour : M.hourNow(q)); return def; };

  // ---------------------------------------------------------------- SÓLSKAFT, shown (deep16/?solskaft -- the eyes row's door): a NEW GAME's four staged on the street level by the beat
  SK.BEATS = [
    { id: 'doors', label: 'THE VAULT DOORS: in off Fountain Street', note: 'Ten in the morning, a step inside the vault doors: Pyro on the left of them, Ketil on the right, facing in. Main street runs north up the screen\'s right: the cart ramp going down on the west along the front wall, the stable\'s apron on the east with the drill on it, the two shut stores, and the light on the oathstone ahead. Step back onto the doors: they say where they will go.', at: [18, 1], hour: 10 },
    { id: 'toll', label: 'THE TOLLHOUSE at the ramp', note: 'In the tollhouse in the front-west corner: the trade-counter facing the ramp, the scales under their cloth (E), the tariff board on the north wall (E from below it), the quartermaster behind his counter, Ingrith\'s ledger-room through the door on the west. The ramp\'s mouth at the west end steps you back: the cart level is the next floor.', at: [7, 4], hour: 10 },
    { id: 'stable', label: 'THE GUEST STABLE and the drill', note: 'On the apron by the stable door: the drill-sergeant and his four. Into the stable: the stalls swept, the mangers empty, a forkful of old fodder, the trough off the cistern. The narrow ramp up at the east wall comes out here.', at: [31, 2], hour: 10 },
    { id: 'court', label: 'THE COURT AT NOON: the oathstone in the beam', note: 'Noon in the court: the oathstone on its pedestal in the Sunshaft\'s light (E on it), the trooper who watches the light, Rekknar\'s temple through the doors west (his ledger-stone), the Dormant\'s east (the empty cut in its back wall). Both temples have room for a stair down; none is cut.', at: [18, 9], hour: 12 },
    { id: 'crown', label: 'THE CROWN: under the rock, the hero-wall', note: 'Through the arch in the back rim: thirty feet of street under the rock, one storey, lamp-lit. The hero-wall down both walls (E on either), the treasury, the mint (sealed) and the assay house\'s doors on the west, the garrison\'s stair up on the east. The throne room\'s doors ahead.', at: [18, 15], hour: 12 },
    { id: 'throne', label: 'THE THRONE ROOM: the empty seat', note: 'In the throne room, a few steps from its doors: the dais, the braziers, the high seat of the Silversands, empty (E on it). Walk back out: the oathstone sits straight down the street from the throne, and the doors beyond it.', at: [18, 26], hour: 12 },
    { id: 'night', label: 'THE STREET BY NIGHT', note: 'Ten at night inside the vault doors: the glass dark, no beam; the street by its lamps, the one lit window over the west store.', at: [18, 3], hour: 22 },
    { id: 'walk', label: 'THE WALK, doors to throne', note: 'The whole of it in one walk from the doors at nine in the morning: click the throne room\'s far end and watch the three stretches go by -- the glass, the light, the rock.', at: [18, 1], hour: 9 }
  ];
  SK.play = function (bt) {
    var H = D.house, R = D.roam, rec = H.fresh(); rec.at = { town: null }; rec.flags = Object.assign({ councilNotice: 1, councilSeen: 1 }, bt.flags || {});
    H.begin(rec, 0, null);
    var S = W && W.state && W.state(); if (S && bt.hour != null) S.t = Math.floor((S.t || 0) / 24) * 24 + bt.hour;
    D.push(R.make('?roam=' + SK.KEY + '&hour=' + bt.hour, { save: H.living(H.cur), opts: { at8: [bt.at[0], SK.Y(bt.at[1])] }, house: true }));
  };
  SK.show = function (q) { return new D.roam.WetShow(q, { kind: 'solskaft', beats: SK.BEATS, play: SK.play, title: '{y}SÓLSKAFT, 11-11{/} -- the street level on the diamonds, doors to the empty throne (a show)' }); };
})();
