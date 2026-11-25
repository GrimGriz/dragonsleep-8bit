/* THE SNOOT -- the mode's data: the map, the forces, and the books' numbers (10-14, the Snoot mode seat; the lane is
   they live\handoff-2026-10-13-the-snoot-mode.md, the rules as read are snoot-mode/rules-source.md).
   The map is provisional (RULED 10-14, his "agreed": the engine built with the Pit as its door, the realm's map revised beside
   it): 5-mile pointy-top hexes (OD&D Book III p.16), 15 x 10, drawn off the corridor map v3 (TarlynsPit/map): the Gnoll Hills
   west of the road, the road from Web Gulch past the Halfway Inn down to the Pit, the Verge east, Newland's road south, the
   Castegut road (the west road) along the top. Offset rows: odd rows sit half a hex right. A map revision is this block. */
'use strict';
(function () {
  var SN = window.SN = window.SN || {};

  // ---------------------------------------------------------------- the map
  // . plain   h hills (cost 2; a charge cannot be made up one: CHAINMAIL p.9)   v the Verge, the plains' edge (grass)
  // w Halfway Lake (no one walks on it)   g Web Gulch (rough: cost 2)   P Tarlyn's Pit   i the Halfway Inn
  // m the moot ground (the Gray Keeping's seat)   s the Skull-Gate's seat   l the Wall-Laugh's seat
  // (walls: the Pit's and the inn's -- a unit that stood its ground behind them holds it, js/rules.js SN.holdsGround; the gnolls hold their seats)
  var ROWS = [
    '...............',
    'lhhhhhhsg......',
    'hhhhhhhh.......',
    'hhhhhhhhiwvvvvv',
    'hhhhhhhh..vvvvv',
    '.hhmhhh...vvvvv',
    '..hhhhh...vvvvv',
    '..........vvvvv',
    '.........P.....',
    '...............'
  ];
  SN.W = 15; SN.H = 10;
  SN.TERRAIN = {
    '.': { name: 'open ground', cost: 1 }, h: { name: 'the hills', cost: 2, hill: true }, v: { name: 'the Verge', cost: 1 },
    w: { name: 'Halfway Lake', cost: 99, water: true }, g: { name: 'Web Gulch', cost: 2, rough: true },
    P: { name: "Tarlyn's Pit", cost: 1, town: true, walls: true }, i: { name: 'the Halfway Inn', cost: 1, walls: true },
    m: { name: 'the moot ground', cost: 2, hill: true, seat: 'gray' }, s: { name: "the Skull-Gate's seat", cost: 2, hill: true, seat: 'skull' },
    l: { name: "the Wall-Laugh's seat", cost: 2, hill: true, seat: 'wall' },
    // (the world's own grounds, 11-14: the map fed from the second game's world, js/map.js -- Book III's going: a wood twice, a swamp three times; no one crosses the mountains but by a road)
    k: { name: "the Gray Keeping's home", cost: 2, hill: true, seat: 'gray' }, // (11-15, his "their home-place, which is south and closer in the hills near rhollor's ruins")
    f: { name: 'farmland', cost: 1 }, t: { name: 'woods', cost: 2, rough: true }, b: { name: 'the bog', cost: 3, rough: true }, x: { name: 'the mountains', cost: 99, hill: true }
  };
  SN.ROWS = ROWS;
  SN.ter = function (c, r) { var row = SN.ROWS[r]; return row && c >= 0 && c < SN.W ? row.charAt(c) : null; };
  // the roads: a hex on a road costs 1 whatever its ground (Book III p.16: a track through woods costs nothing more); each hex the next one's
  // neighbour (10-15: the Pit road skipped from (8,6) to (9,7) and the pirate road from (10,8) to (11,7), two hexes apart -- (8,7) and (10,7) close them)
  SN.ROADS = [
    { name: 'the Pit road', hexes: [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7], [9, 7], [9, 8], [9, 9]] },
    { name: 'the west road (the Castegut road)', hexes: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0]] },
    { name: 'the pirate road', hexes: [[9, 8], [10, 8], [10, 7], [11, 7], [12, 7], [13, 6], [14, 6]] }
  ];
  SN.PLACES = [
    { at: [9, 8], name: "Tarlyn's Pit" }, { at: [8, 3], name: 'the Halfway Inn', dx: -0.3 }, { at: [9, 3], name: 'Halfway Lake', dx: 0.35, dy: -0.95 },
    { at: [8, 1], name: 'Web Gulch', dx: 0.35, dy: -0.95 }, { at: [3, 5], name: 'the moot ground' }, { at: [7, 1], name: 'the Skull-Gate', dx: -0.3 },
    { at: [0, 1], name: 'the Wall-Laugh' }, { at: [12, 4], name: 'the Verge' }
  ];
  SN.PIT = [9, 8]; SN.MOOT = [3, 5]; SN.WEST = [0, 0]; SN.SOUTH = [9, 9];

  // ---------------------------------------------------------------- the books' numbers (game facts, with their pages)
  // CHAINMAIL Appendix A p.40, the Combat Tables: attacker's class -> defender's class -> [dice a figure, figures a die, kills on]
  // ("2 dice per man, 5-6 kills" is [2, 1, 5]; "1 die per three men, 6 kills" is [1, 3, 6])
  SN.CT = {
    LF: { LF: [1, 1, 6], HF: [1, 2, 6], AF: [1, 3, 6], LH: [1, 2, 6], MH: [1, 3, 6], HH: [1, 4, 6] },
    HF: { LF: [1, 1, 5], HF: [1, 1, 6], AF: [1, 2, 6], LH: [1, 2, 6], MH: [1, 3, 6], HH: [1, 4, 6] },
    AF: { LF: [1, 1, 4], HF: [1, 1, 5], AF: [1, 1, 6], LH: [1, 1, 6], MH: [1, 2, 6], HH: [1, 3, 6] },
    LH: { LF: [2, 1, 5], HF: [2, 1, 6], AF: [1, 1, 6], LH: [1, 1, 6], MH: [1, 2, 6], HH: [1, 3, 6] },
    MH: { LF: [2, 1, 4], HF: [2, 1, 5], AF: [2, 1, 6], LH: [1, 1, 5], MH: [1, 1, 6], HH: [1, 2, 6] },
    HH: { LF: [4, 1, 5], HF: [3, 1, 5], AF: [2, 1, 5], LH: [2, 1, 5], MH: [1, 1, 5], HH: [1, 1, 6] }
  };
  SN.CLASSNAME = { LF: 'Light Foot', HF: 'Heavy Foot', AF: 'Armored Foot', LH: 'Light Horse', MH: 'Medium Horse', HH: 'Heavy Horse' };
  SN.LOWER = { AF: 'HF', HF: 'LF', LF: 'LF', HH: 'MH', MH: 'LH', LH: 'LH' }; // (fatigued: the next lower class, p.11)
  // CHAINMAIL Appendix E p.44, the Fantasy Combat Table: two dice against the number; under, no effect; equal, the defender falls back a
  // move; over, the defender is killed. Only the kinds the mode fields (the hero, the super-hero, the wizard, the wraith)
  SN.FT = {
    hero: { hero: 7, superhero: 10, wizard: 11, wraith: 11 },
    superhero: { hero: 5, superhero: 8, wizard: 9, wraith: 8 },
    wizard: { hero: 8, superhero: 10, wizard: 10, wraith: 5 },
    wraith: { hero: 8, superhero: 10, wizard: 12, wraith: 7 }
  };
  SN.WARLOCK = 2; // (p.44's @: "other magic users are at lesser values" -- a warlock's two dice score 2 less: p.30's ranks, warlocks -2)
  // morale ratings, p.15-16 (peasants 3 ... heavy horse 9); a gnoll is a hobgoblin (p.29: morale 5) at +2 (OD&D Book II)
  SN.MORALE = { LF: 4, HF: 5, AF: 7, LH: 6, MH: 8, HH: 9 };
  // instability, p.17: the share of the starting strength lost that makes a unit roll, and the two dice it needs to stay
  SN.UNSTABLE = { LF: [0.25, 8], HF: [1 / 3, 7], AF: [1 / 3, 6], LH: [1 / 3, 7], MH: [1 / 3, 7], HH: [0.5, 6] };
  // the move in hexes a day: Book III's man on foot is 3; the others at CHAINMAIL's own ratios to foot (p.10: armored foot 6", heavy and
  // light foot 9", heavy horse 12", medium 18", light 24") -- the seat's reading, so the horse is not ten hexes on a fifteen-hex map
  SN.MOVE = { AF: 2, HF: 3, LF: 3, HH: 4, MH: 6, LH: 8 };
  // point values, p.27 and the fantasy kinds (pp.29-38): what the tally counts
  SN.POINTS = { LF: 1, HF: 2, AF: 2.5, LH: 3, MH: 4, HH: 5, hero: 20, superhero: 50, wizard: 80, wraith: 10 }; // (a wizard at the warlock's rank: 80, p.33)
  // the wizard by the book (pp.30-33; RULED 10-15, his "Book basics for sure"): a warlock is the wizard two ranks down -- morale 30, 80 points
  // (p.33), -2 on the Fantasy table (SN.WARLOCK); she fights as two Armored Foot, her charge makes the enemy check as a super-hero's does,
  // normal missiles cannot harm her, and she throws one missile a round, chosen before the battle: a fire ball or a lightning bolt (p.31),
  // which kills what it strikes save the fantastic: heroes on 9+, super-heroes on 6+, wraiths on 7+ (SN.SAVES)
  SN.WIZARD = { morale: 30 };
  SN.SAVES = { hero: 9, superhero: 6, wraith: 7 };

  // ---------------------------------------------------------------- the forces at Day 14 (the lane §3, §5.5; his rulings 10-14)
  // (10-15, the desk's find after the art cut: the glory-seeker is drawn from gloryseeker_p2 -- all eight facings, with death, prone, laugh and get-up
  // rows; gloryseeker_p1 had idle, walk and attack only)
  // side: ours (the player writes every order -- RULED 10-13 "build for all, a.i. later"), gnoll (the AI), dominion (the AI)
  // cls: the class it attacks as; def: the class it defends as (a gnoll attacks as Armored Foot and defends as Heavy Foot: Book II)
  // figs: figures at 20 men a figure (CHAINMAIL p.8); heroes: fantastic figures with the unit; sheets: what the stack is drawn with
  // ONE MAN A FIGURE (RULED 10-15, his "1 let's try it out" on the seat's lean): OD&D Book III p.25's basic system, "one figure representing one man or
  // creature" -- the 20:1 is for "battles involving large numbers of figures", and the Snoot's are the realm's own numbers. His numbers (verbatim, 10-15):
  // "GreyFang and the Pit maybe at 40 fighters - the Newland Road Patrol pally, 4 mounted and 12 heavy foot with a supply wagon"; "20 horse and 40 heavy
  // foot and 40 crossbows can show up late - 4 days after battle start maybe"; "100 barbarians total ... we may need 60 to continue to the pit escorting
  // the horses in before joining - the outriders and one group peel off"; the war-band "I like the war band size" (the grid's own: 3 glory-seekers, 9
  // gnolls, 6 hyenas); "the gray keeping would have at least one group of young blood out for Snoot". The rest are the seat's drafts, his to change:
  // the death-watch's twelve, the Wall-Laugh's, the Harbinger's six mirror hyenas, the Dominion's dozen (the register's patrol: "6-10 fighters", dominion.md).
  // A unit may be MIXED (RULED 10-15, "2 try that too"): groups by type, each its own row on the Combat Table, morale "separating them by type" (p.15).
  // comp: what a gnoll unit's men are, for the grid (one man a figure: the band on the grid is the band)
  var BAND = { gloryseeker: 3, gnoll: 9, hyena: 6 };
  // the Gray Keeping's (10-15, his "a 3rd tribe color for the gray keeping", his pick "D - the darker cloth and grayer fur"): the same men in the
  // seat-tribe's gray (deep16/data/foes.js gnollgray, gloryseekergray; the sheet graykeeping_p2)
  var GRAYBAND = { gloryseekergray: 3, gnollgray: 9, hyena: 6 };
  SN.FORCES = [
    // ours (the four start at the Halfway Inn -- his word 10-15, "please start the party 4 at the half-way inn"; they were in the Pit)
    { id: 'party', side: 'ours', name: 'The Party', kind: 'the four', party: true, cls: 'AF', def: 'AF', figs: 0, at: [8, 3], move: 3,
      heroes: [{ type: 'superhero', name: 'Barley' }, { type: 'superhero', name: 'Aurdin' }, { type: 'superhero', name: 'Vivian' }, { type: 'superhero', name: 'Lymen' }],
      sheets: ['barley_p1', 'aurdin_p1', 'vivian_p1', 'lymen_p1'], note: 'Every fight they stand in is fought on the grid (DEEP16), and the men of ours in their hex fight beside them.' },
    { id: 'greyfang', side: 'ours', name: "GreyFang's pit fighters", kind: 'the pit', cls: 'HF', def: 'HF', figs: 40, at: [9, 8], move: 3, // (Heavy Foot, trained fighters -- RULED 10-15, his "yes - heavy foot the tarlyn's pit troops"; they were Light Foot levies, the lane §3's first reading)
      heroes: [{ type: 'superhero', name: 'GreyFang', fated: true }, { type: 'hero', name: 'Katarina' }], sheets: ['greyfang_p1', 'npcfighter_p0'], // (Katarina with them, 11-13, Griz: "add katarina to greyfang's group" -- a Hero: the desk's reading, his to change; on the headless field she is the grid's katarina, deep16/js/headless.js H.HEROES)
      note: 'GreyFang, ranger 11 of the Grey Road, and the Pit\'s forty fighters: a Super-hero (p.30). The Snoot\'s quarry: the Harbinger hunts him.' },
    { id: 'patrol', side: 'ours', name: "Newland's road patrol", kind: 'Newland', cls: 'HF', def: 'HF', at: [9, 8], wagon: true,
      groups: [{ cls: 'HF', def: 'HF', n: 12, name: 'heavy foot' }, { cls: 'MH', def: 'MH', n: 4, mounted: true, name: 'horse', sheets: ['newlandrider_p1'] }], // (the horse on ART-69's sheet, 10-17; the wagon ART-71's Newland variant, js/view.js V.wagonOf)
      heroes: [{ type: 'hero', name: 'a paladin of the Sun-Father', paladin: true }], sheets: ['npcpaladin_p0', 'trooper_p0', 'npcfighter_p0'],
      note: 'A paladin, twelve heavy foot and four mounted with a supply wagon: each type rolls its own row.' },
    { id: 'bat1', side: 'ours', name: "Newland's heavy foot", kind: 'Newland', cls: 'HF', def: 'HF', figs: 40, at: [9, 9], arrive: 18, cleric: true,
      heroes: [{ type: 'hero', name: 'a paladin of the Sun-Father', paladin: true }], sheets: ['npcpaladin_p0', 'trooper_p0', 'npccleric_p0'] },
    { id: 'bat2', side: 'ours', name: "Newland's crossbows", kind: 'Newland', cls: 'LF', def: 'LF', figs: 40, at: [9, 9], arrive: 18, volley: true, cleric: true,
      heroes: [], sheets: ['npccleric_p0', 'npcranger_p0'] },
    { id: 'bat3', side: 'ours', name: "Newland's horse", kind: 'Newland', cls: 'MH', def: 'MH', figs: 20, at: [9, 9], arrive: 18,
      heroes: [{ type: 'hero', name: 'a paladin of the Sun-Father', paladin: true }], sheets: ['newlandrider_p1'], mounted: true }, // (ART-69's mounted man-at-arms, 10-17: the paladin rides at their head)
    { id: 'bb1', side: 'ours', name: 'the horse escort', kind: 'the plains', cls: 'HF', def: 'HF', figs: 60, at: [14, 4], arrive: 16, berserk: true, escort: true,
      heroes: [], sheets: ['npcbarbarian_p0'], note: 'Sixty of the plains tribes bringing the horses in to the Pit: they join the fight once the herd is in.' },
    { id: 'bb2', side: 'ours', name: 'the outriders', kind: 'the plains', cls: 'LH', def: 'LH', figs: 20, at: [14, 5], arrive: 16, berserk: true,
      heroes: [], sheets: ['plainsrider_p1'], mounted: true }, // (ART-70's outrider, 10-17)
    { id: 'bb3', side: 'ours', name: 'the festival war-camp', kind: 'the plains', cls: 'HF', def: 'HF', figs: 20, at: [14, 6], arrive: 16, berserk: true,
      heroes: [], sheets: ['npcbarbarian_p0'] },
    // the gnolls (the AI from the first build): the three tribes and the Harbinger (the lane §3); a band is the grid's war-band
    { id: 'sg1', side: 'gnoll', tribe: 'skull', name: 'a Skull-Gate band', kind: 'the Skull-Gate', cls: 'AF', def: 'HF', figs: 18, comp: BAND, at: [7, 2], morale: 7, sheets: ['gnoll_p2', 'hyena_p2', 'gloryseeker_p2'] },
    { id: 'sg2', side: 'gnoll', tribe: 'skull', name: 'a Skull-Gate band', kind: 'the Skull-Gate', cls: 'AF', def: 'HF', figs: 18, comp: BAND, at: [7, 4], morale: 7, sheets: ['gnoll_p2', 'hyena_p2', 'gloryseeker_p2'] },
    { id: 'sg3', side: 'gnoll', tribe: 'skull', name: 'the glory-seekers on the road', kind: 'the Skull-Gate', cls: 'AF', def: 'HF', figs: 9, comp: { gloryseeker: 6, hyena: 3 }, at: [8, 6], morale: 7, sheets: ['gloryseeker_p2', 'gnoll_p2', 'hyena_p2'] },
    { id: 'sg4', side: 'gnoll', tribe: 'skull', name: 'a Skull-Gate band', kind: 'the Skull-Gate', cls: 'AF', def: 'HF', figs: 18, comp: BAND, at: [5, 2], morale: 7, sheets: ['gnoll_p2', 'hyena_p2', 'gloryseeker_p2'] },
    // the matriarchs (10-16, Griz: "let's give one group a superhero matriarch and the other hero, with clerics with the gray young ones. Give the superhero
    // entangle? There's good cleric stuff high level that didn't exist in chainmail I think" -- then "all 8 leans are go"). CHAINMAIL has no clerics; OD&D
    // Book I keys them to its fighting capability (p.18): a Lama (6th) fights as a Hero, a Patriarch of 9th as "Superhero - 1" -- so the death-watch's
    // eldest is a Super-hero at -1 on the Fantasy table (ft), and the band's matriarch a Hero. Their prayers (SN.pray): the eldest's Insect Plague (Book I
    // 5th, "drive creatures with less than three hit dice off in rout") and Entangle (his: Rhollor's, the god under the ground), the Lama's Bless (Book I
    // 2nd, "+1 to attack dice" and morale) -- each once a day, and only where a relic is (gnoll-hills.md, RULED 08-13d: "keepers cast only in a relic's
    // presence"): the Mane on the moot ground; the band and the young blood carry a minor relic of the tribe (`relic`: the seat's reading, PROPOSED).
    // The death-watch defends as Armored Foot: the seat-tribe's women are "larger and fiercer" (CANON 08-13). `grid`: what each fights as on DEEP16's grid
    { id: 'gkw', side: 'gnoll', tribe: 'gray', watch: true, name: 'the death-watch', kind: 'the Gray Keeping', cls: 'AF', def: 'AF', figs: 11, comp: { gnollmatriarchguard: 3, gnollmatriarch: 8 }, at: [3, 5], morale: 7, cleric: true, sheets: ['gnollmatriarch_p1'], // (ART-68's sheet, toned gray on his pick, 10-16: the Eldest and her women)
      heroes: [{ type: 'superhero', name: 'the Eldest', matriarch: true, rank: 'a Patriarch', ft: -1, prays: ['insectplague', 'entangle'], grid: 'gnollmatriarcheldest' }],
      note: 'The seat-tribe\'s women -- "larger and fiercer", the greyest, the matriarch-clerics whose rule is shadowy -- keep the unclaimed Mane: they stand the death-watch on the moot ground and never leave it. The Eldest is a Super-hero (OD&D Book I\'s Patriarch, "Superhero - 1"): once a day on the moot she prays Insect Plague, which routs a unit of men, and Entangle, which holds one where it stands.' },
    { id: 'gk1', side: 'gnoll', tribe: 'gray', youngblood: true, name: "the Gray Keeping's young blood", kind: 'the Gray Keeping', cls: 'AF', def: 'HF', figs: 18, comp: GRAYBAND, at: [4, 6], morale: 7, cleric: true, relic: true, sheets: ['graykeeping_p2', 'hyena_p2'],
      note: 'Out for the Snoot from the first day, with matriarch-clerics among them and a relic of the tribe to pray through: +1 morale, and they mend at dusk.' },
    { id: 'gk2', side: 'gnoll', tribe: 'gray', name: 'a Gray Keeping band', kind: 'the Gray Keeping', cls: 'AF', def: 'HF', figs: 18, comp: GRAYBAND, at: [2, 4], morale: 7, relic: true, sheets: ['gnollmatriarch_p1', 'graykeeping_p2', 'hyena_p2'], // (the hero draws with the first sheet: the band's matriarch, ART-68's)
      heroes: [{ type: 'hero', name: 'a matriarch of the Gray Keeping', matriarch: true, rank: 'a Lama', prays: ['bless'], grid: 'gnollmatriarchlama' }],
      note: 'The wall: it comes home to the moot ground when the plains\' stomp comes near. A matriarch goes with it, a Hero (OD&D Book I\'s Lama), and blesses it before it fights.' },
    { id: 'wl1', side: 'gnoll', tribe: 'wall', name: 'the Wall-Laugh', kind: 'the Wall-Laugh', cls: 'AF', def: 'HF', figs: 18, comp: { gnoll: 12, hyena: 6 }, at: [0, 1], morale: 7, sheets: ['gnoll_p2', 'hyena_p2'] },
    { id: 'wl2', side: 'gnoll', tribe: 'wall', name: 'the Wall-Laugh\'s young blood', kind: 'the Wall-Laugh', cls: 'AF', def: 'HF', figs: 12, comp: { gnoll: 8, hyena: 4 }, at: [1, 2], morale: 7, sheets: ['gnoll_p2', 'hyena_p2'] },
    { id: 'harb', side: 'gnoll', tribe: 'harbinger', harbinger: true, name: "the Harbinger's pack", kind: 'the Harbinger', cls: 'LH', def: 'LH', figs: 6, comp: { hyena: 6 }, at: [6, 6], move: 3, morale: 6,
      heroes: [{ type: 'wraith', name: 'the Harbinger', harbinger: true }], sheets: ['mirrorgnoll_p1', 'mirrorhyena_p1'], // (the six on the Mirror Hyena's own sheet since 11-14, Griz: "the Harbinger's Mirror Hyenas need mapped to the new models" -- art-wanted 63, the Normal state; the grid's fight wears the three states by its rules, js/seep.js)
      note: 'Mr. Ripples\' made gnoll, mirror eyes in both sockets: a Wraith on the books\' terms (pp.33-34), his six mirror hyenas giant wolves (p.37).' }
  ];
  // the Dominion (his word 10-14: "2 days after the Harbinger starts head hunting bring in 3 dominion units from the west road - kat's wagon
  // loadout"; "not cannon for mode test"): the lady a CHAINMAIL warlock (p.30), the wagon baggage (p.21).
  // EACH WAGON RE-MANNED 11-24 (RULED, Griz: "dominion wagon for the snoot with patrol lady, cleric, 2 sergeant, 4 foot and 4 dragger" -- the seat dominion-1124):
  // his patrol page The Fare Home's "one warlock lady in command, a cleric under her, two sergeants who despise each other, and eight men"; Kat's book, 01:29, "two
  // sergeants ... eight soldiers ... and the lady", 05:22 "The other two wagons carry menders". Till then each was a lady and twelve heavy foot, all on trooper_p0.
  // Each type its own row on the Combat Table (a mixed unit, RULED 10-15) and its own figure; its CHAINMAIL class from the book's lists (pp.14-15, rules-source.md
  // §5): the line soldiers HEAVY FOOT ("men-at-arms"; half plate and shield); the draggers LIGHT FOOT (the pike's "Swiss and landsknechte"; a studded harness);
  // each sergeant ARMORED FOOT (the book's own "sergeants"; full plate), a group of one each, the two never one row (the page: "never the same flank"); the mender
  // HEAVY FOOT (a breastplate, worn as half plate), a group of one, `mender`: the wagon's `cleric` (+1 morale, mending at dusk) while she stands. `grid`: what each is
  // on DEEP16's grid (deep16/data/foes.js), so a wagon met there fields the same, man for man. `rides`: the men ride the wagon (01:29, "Our wagon carries myself; two
  // sergeants ...; eight soldiers ...; and the lady"), so it keeps the wagon's road bonus (p.10). `comp`: the same men by grid word -- its count is SN.compNow's, read
  // off the groups. THE SQUADS (RULED 11-24, Griz: "I like the sergeant for every 4 men (2 and 2 dragger)"): each sergeant leads two line soldiers and two draggers,
  // `squad` 1 the Blade's and 2 the Ledger's -- each squad's kinds their own groups, sent to the grid together (js/rules.js SN.band) and standing together there
  // (deep16/data/fights.js snootwagon). A line soldiers' group is first: a hero fights with a unit's first type (the lady fights as her own two Armored Foot)
  // EIGHT MORE MEN A WAGON (2026-11-25, the seat snoot-1125 -- RULED, Griz: "Snoot wagons get 8 extra troops (6 foot, 2 dragger) (not a recruiting wagon)"; how they squad
  // the builder's to propose): THE LADY'S GUARD, `squad` 3 -- six line soldiers and two draggers who stand at the wagon with the lady and the mender, under her own word; no
  // sergeant (his "I don't want to art request a sergeant variant"), so the two sergeants' squads stay his "sergeant for every 4 men (2 and 2 dragger)". Sixteen men, the two
  // sergeants and the mender: nineteen a wagon and its lady (it was eleven). The seat's reading, his to change: the eight split four and four into the sergeants' squads instead.
  // THE THREE BY PATRON (RULED 11-25: each wagon's lady by her patron -- Savine's the Fiend, the Old One's the Mirror, Tronu's the Fae King; his "1 - we need all 3 patron
  // specific patrol ladys for the snoot, each with flavored spell list"): `patron`, and the lady's `grid`, her own on DEEP16's grid (deep16/data/foes.js patrolladyfiend,
  // patrolladymirror, patrolladyfae: each by her patron's list). Which wagon is whose: dm1 Savine's, dm2 the Old One's, dm3 Tronu's -- the seat's call so the three could be
  // built (the three come on together; the errands, which is which on the board and where each goes, are the lane's, open for him). Each lady's missile stays as it was.
  // TRONU'S WAGON'S GOAL (RULED 11-25, Griz: "lets have them aim to build the garrison there (but they divert toward the barbarians in the snoot)"): `garrison` -- it
  // makes for the toll garrison's hex (SN.GARRISON, the map's: one hex up the Coldridge Route from the Galleries junction) and goes for the plains tribes while they are in
  // the field (js/ai.js AI.tronu)
  SN.PATRONS = {
    fiend: { whose: 'Savine', of: 'the Fiend', grid: 'patrolladyfiend' },
    mirror: { whose: 'the Old One', of: 'the Mirror', grid: 'patrolladymirror' },
    faeking: { whose: 'Tronu', of: 'the Fae King', grid: 'patrolladyfae' }
  };
  var WAGON = function (id, missile, patron, more) {
    var P = SN.PATRONS[patron];
    return Object.assign({ id: id, side: 'dominion', name: 'a Dominion wagon', kind: 'the Dominion', cls: 'HF', def: 'HF', wagon: true, rides: true, move: 3, cleric: true, patron: patron, whose: P.whose,
      groups: [
        { cls: 'HF', def: 'HF', n: 2, name: 'the Blade\'s line soldiers', grid: 'dominion', squad: 1, sheets: ['dominion_p2'] }, // (each group on its grid kind's own sheet, 11-25,
        { cls: 'LF', def: 'LF', n: 2, name: 'the Blade\'s draggers', grid: 'dragger', squad: 1, sheets: ['dragger_p2'] },        //  the cutter seat cutter-1125: the line soldier's
        { cls: 'AF', def: 'AF', n: 1, name: 'the sergeant of the right hand', grid: 'sergeantblade', squad: 1, sheets: ['dmsergeant_p2'] }, // ART-159 as the grid's dominion
        { cls: 'HF', def: 'HF', n: 2, name: 'the Ledger\'s line soldiers', grid: 'dominion', squad: 2, sheets: ['dominion_p2'] },          // wears it, the sergeant in each kit
        { cls: 'LF', def: 'LF', n: 2, name: 'the Ledger\'s draggers', grid: 'dragger', squad: 2, sheets: ['dragger_p2'] },               // (ART-163: art-wanted 99), the mender
        { cls: 'AF', def: 'AF', n: 1, name: 'the sergeant of the left hand', grid: 'sergeantledger', squad: 2, sheets: ['dmsergeantshield_p2'] }, // (ART-164: art-wanted 100) --
        { cls: 'HF', def: 'HF', n: 6, name: 'the lady\'s guard, line soldiers', grid: 'dominion', squad: 3, sheets: ['dominion_p2'] },   // till then dominion_p1 and the stock
        { cls: 'LF', def: 'LF', n: 2, name: 'the lady\'s guard, draggers', grid: 'dragger', squad: 3, sheets: ['dragger_p2'] },          // cleric's npccleric_p0)
        { cls: 'HF', def: 'HF', n: 1, name: 'the mender', grid: 'mender', mender: true, sheets: ['mender_p2'] }
      ],
      comp: { dominion: 10, dragger: 6, sergeantblade: 1, sergeantledger: 1, mender: 1 },
      heroes: [{ type: 'wizard', name: 'a patrol lady of ' + P.of + ' (warlock)', warlock: true, missile: missile, patron: patron, grid: P.grid }], sheets: ['npcwarlock_p0', 'dominion_p2'] }, more || {});
  };
  SN.DOMINION = [WAGON('dm1', 'fireball', 'fiend'), WAGON('dm2', 'lightning', 'mirror'), WAGON('dm3', 'fireball', 'faeking', { garrison: true })];
  SN.DAY0 = 14; SN.HUNT = 18; SN.LAST = 28; // (the Pit two days after the Skylights, Day 14; the exchange ~18-21 -- the clock lane; the battle stops at Day 28 whatever stands)
  SN.STACK = 3; // (units of one side a hex, the Pit excepted)

  // ---------------------------------------------------------------- the map in use (11-14, the Snoot seat of the realm; his "Yes, feed it")
  // The map above is the FIXTURE: 15 x 10 off corridor v3, the one every check in js/probe.js and the tutorial's steps are written on. The game's map is
  // SN.WORLDMAP (js/map.js, generated by tools/snoot-map.py from the second game's world): SN.useMap swaps the grid, the roads, the places and the named
  // hexes the rules and the AI steer by, and where each unit stands on Day 14 (START, by a unit's id). THE FARMS (THE SCATTER's, by hex): SN.FARMS;
  // SN.FIND is a band's chance in a hundred to find each farm still standing in the hex it ends its day in -- the seat's number, his to change.
  // The days are not re-timed: on the world's map the first trial battles (the tables' stand-in, both sides the computer's) still had the head by Day 20,
  // so Day 14, the hunt's Day 18 and the last day 28 stand till he plays it.
  SN.FIXTURE = { name: 'fixture', W: 15, H: 10, rows: ROWS, roads: SN.ROADS, places: SN.PLACES, pit: [9, 8], moot: [3, 5], west: [0, 0], south: [9, 9], inn: [8, 3],
    seats: { skull: [7, 1], wall: [0, 1] }, roadpt: [8, 5], beside: [7, 6], start: null, farms: {}, other: {}, last: 28,
    garrison: { at: [8, 0], off: true, name: 'the toll garrison up the Coldridge Route' } }; // (the fixture's: the Pit road's north end, the way to the fork and the climb -- the world's map is the real one, tools/snoot-map.py)
  SN.FIND = 35; SN.mapv = 0;
  SN.useMap = function (M) {
    SN.MAPNAME = M.name; SN.W = M.W; SN.H = M.H; SN.ROWS = M.rows; SN.ROADS = M.roads; SN.PLACES = M.places;
    SN.PIT = M.pit; SN.MOOT = M.moot; SN.MANE = M.mane || M.moot; // (MANE: where the death-watch keeps the Mane -- the moot ground on the fixture; on the world's map their home-place, 11-15, his "the death watch take the mane back to their homeground")
    SN.WEST = M.west; SN.SOUTH = M.south; SN.INN = M.inn; SN.SEATS = M.seats; SN.ROADPT = M.roadpt; SN.BESIDE = M.beside;
    SN.FARMAT = M.farmAt || {}; SN.BOX = M.box || null; SN.START = M.start || null; SN.FORCEOV = M.forces || null; SN.DROP = M.drop || []; SN.FARMS = M.farms || {}; // (FORCEOV, DROP: what a map changes of SN.FORCES, by a unit's id -- js/rules.js SN.make, SN.newGame)
     SN.OTHER = M.other || {}; SN.LAST = M.last || 28; SN.mapv++;
    SN.GARRISON = M.garrison || null; // (where Tronu's wagon means to build, 11-25: { at, off, name } -- `off`: the hex is beyond the board, and `at` the board's hex on the road to it)
  };
  SN.useMap(SN.FIXTURE);
})();
