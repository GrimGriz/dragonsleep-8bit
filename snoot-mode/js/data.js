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
    P: { name: "Tarlyn's Pit", cost: 1, town: true }, i: { name: 'the Halfway Inn', cost: 1 },
    m: { name: 'the moot ground', cost: 2, hill: true, seat: 'gray' }, s: { name: "the Skull-Gate's seat", cost: 2, hill: true, seat: 'skull' },
    l: { name: "the Wall-Laugh's seat", cost: 2, hill: true, seat: 'wall' }
  };
  SN.ROWS = ROWS;
  SN.ter = function (c, r) { var row = ROWS[r]; return row && c >= 0 && c < SN.W ? row.charAt(c) : null; };
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
    // ours
    { id: 'party', side: 'ours', name: 'The Party', kind: 'the four', party: true, cls: 'AF', def: 'AF', figs: 0, at: [9, 8], move: 3,
      heroes: [{ type: 'superhero', name: 'Barley' }, { type: 'superhero', name: 'Aurdin' }, { type: 'superhero', name: 'Vivian' }, { type: 'superhero', name: 'Lymen' }],
      sheets: ['barley_p1', 'aurdin_p1', 'vivian_p1', 'lymen_p1'], note: 'Every fight they stand in is fought on the grid (DEEP16), and the men of ours in their hex fight beside them.' },
    { id: 'greyfang', side: 'ours', name: "GreyFang's pit fighters", kind: 'the pit', cls: 'HF', def: 'HF', figs: 40, at: [9, 8], move: 3, // (Heavy Foot, trained fighters -- RULED 10-15, his "yes - heavy foot the tarlyn's pit troops"; they were Light Foot levies, the lane §3's first reading)
      heroes: [{ type: 'superhero', name: 'GreyFang', fated: true }], sheets: ['greyfang_p1', 'npcfighter_p0'],
      note: 'GreyFang, ranger 11 of the Grey Road, and the Pit\'s forty fighters: a Super-hero (p.30). The Snoot\'s quarry: the Harbinger hunts him.' },
    { id: 'patrol', side: 'ours', name: "Newland's road patrol", kind: 'Newland', cls: 'HF', def: 'HF', at: [9, 8], wagon: true,
      groups: [{ cls: 'HF', def: 'HF', n: 12, name: 'heavy foot' }, { cls: 'MH', def: 'MH', n: 4, mounted: true, name: 'horse' }],
      heroes: [{ type: 'hero', name: 'a paladin of the Sun-Father', paladin: true }], sheets: ['npcpaladin_p0', 'trooper_p0', 'npcfighter_p0'],
      note: 'A paladin, twelve heavy foot and four mounted with a supply wagon: each type rolls its own row.' },
    { id: 'bat1', side: 'ours', name: "Newland's heavy foot", kind: 'Newland', cls: 'HF', def: 'HF', figs: 40, at: [9, 9], arrive: 18, cleric: true,
      heroes: [{ type: 'hero', name: 'a paladin of the Sun-Father', paladin: true }], sheets: ['npcpaladin_p0', 'trooper_p0', 'npccleric_p0'] },
    { id: 'bat2', side: 'ours', name: "Newland's crossbows", kind: 'Newland', cls: 'LF', def: 'LF', figs: 40, at: [9, 9], arrive: 18, volley: true, cleric: true,
      heroes: [], sheets: ['npccleric_p0', 'npcranger_p0'] },
    { id: 'bat3', side: 'ours', name: "Newland's horse", kind: 'Newland', cls: 'MH', def: 'MH', figs: 20, at: [9, 9], arrive: 18,
      heroes: [{ type: 'hero', name: 'a paladin of the Sun-Father', paladin: true }], sheets: ['npcpaladin_p0', 'npcfighter_p0'], mounted: true },
    { id: 'bb1', side: 'ours', name: 'the horse escort', kind: 'the plains', cls: 'HF', def: 'HF', figs: 60, at: [14, 4], arrive: 16, berserk: true, escort: true,
      heroes: [], sheets: ['npcbarbarian_p0'], note: 'Sixty of the plains tribes bringing the horses in to the Pit: they join the fight once the herd is in.' },
    { id: 'bb2', side: 'ours', name: 'the outriders', kind: 'the plains', cls: 'LH', def: 'LH', figs: 20, at: [14, 5], arrive: 16, berserk: true,
      heroes: [], sheets: ['npcbarbarian_p0'], mounted: true },
    { id: 'bb3', side: 'ours', name: 'the festival war-camp', kind: 'the plains', cls: 'HF', def: 'HF', figs: 20, at: [14, 6], arrive: 16, berserk: true,
      heroes: [], sheets: ['npcbarbarian_p0'] },
    // the gnolls (the AI from the first build): the three tribes and the Harbinger (the lane §3); a band is the grid's war-band
    { id: 'sg1', side: 'gnoll', tribe: 'skull', name: 'a Skull-Gate band', kind: 'the Skull-Gate', cls: 'AF', def: 'HF', figs: 18, comp: BAND, at: [7, 2], morale: 7, sheets: ['gnoll_p2', 'hyena_p2', 'gloryseeker_p2'] },
    { id: 'sg2', side: 'gnoll', tribe: 'skull', name: 'a Skull-Gate band', kind: 'the Skull-Gate', cls: 'AF', def: 'HF', figs: 18, comp: BAND, at: [7, 4], morale: 7, sheets: ['gnoll_p2', 'hyena_p2', 'gloryseeker_p2'] },
    { id: 'sg3', side: 'gnoll', tribe: 'skull', name: 'the glory-seekers on the road', kind: 'the Skull-Gate', cls: 'AF', def: 'HF', figs: 9, comp: { gloryseeker: 6, hyena: 3 }, at: [8, 6], morale: 7, sheets: ['gloryseeker_p2', 'gnoll_p2', 'hyena_p2'] },
    { id: 'sg4', side: 'gnoll', tribe: 'skull', name: 'a Skull-Gate band', kind: 'the Skull-Gate', cls: 'AF', def: 'HF', figs: 18, comp: BAND, at: [5, 2], morale: 7, sheets: ['gnoll_p2', 'hyena_p2', 'gloryseeker_p2'] },
    { id: 'gkw', side: 'gnoll', tribe: 'gray', watch: true, name: 'the death-watch', kind: 'the Gray Keeping', cls: 'AF', def: 'HF', figs: 12, comp: { gnollgray: 12 }, at: [3, 5], morale: 7, cleric: true, sheets: ['graykeeping_p2'],
      note: 'The seat-tribe\'s women -- "larger and fiercer", the greyest, the matriarch-clerics whose rule is shadowy -- keep the unclaimed Mane: they stand the death-watch on the moot ground and never leave it. Their own look is asked of the art desk (deep16-art-wanted.md §13); till it comes, the seat-tribe\'s gray.' },
    { id: 'gk1', side: 'gnoll', tribe: 'gray', youngblood: true, name: "the Gray Keeping's young blood", kind: 'the Gray Keeping', cls: 'AF', def: 'HF', figs: 18, comp: GRAYBAND, at: [4, 6], morale: 7, sheets: ['graykeeping_p2', 'hyena_p2'] },
    { id: 'gk2', side: 'gnoll', tribe: 'gray', name: 'a Gray Keeping band', kind: 'the Gray Keeping', cls: 'AF', def: 'HF', figs: 18, comp: GRAYBAND, at: [2, 4], morale: 7, sheets: ['graykeeping_p2', 'hyena_p2'] },
    { id: 'wl1', side: 'gnoll', tribe: 'wall', name: 'the Wall-Laugh', kind: 'the Wall-Laugh', cls: 'AF', def: 'HF', figs: 18, comp: { gnoll: 12, hyena: 6 }, at: [0, 1], morale: 7, sheets: ['gnoll_p2', 'hyena_p2'] },
    { id: 'wl2', side: 'gnoll', tribe: 'wall', name: 'the Wall-Laugh\'s young blood', kind: 'the Wall-Laugh', cls: 'AF', def: 'HF', figs: 12, comp: { gnoll: 8, hyena: 4 }, at: [1, 2], morale: 7, sheets: ['gnoll_p2', 'hyena_p2'] },
    { id: 'harb', side: 'gnoll', tribe: 'harbinger', harbinger: true, name: "the Harbinger's pack", kind: 'the Harbinger', cls: 'LH', def: 'LH', figs: 6, comp: { hyena: 6 }, at: [6, 6], move: 3, morale: 6,
      heroes: [{ type: 'wraith', name: 'the Harbinger', harbinger: true }], sheets: ['mirrorgnoll_p1', 'hyena_p2'],
      note: 'Mr. Ripples\' made gnoll, mirror eyes in both sockets: a Wraith on the books\' terms (pp.33-34), his six mirror hyenas giant wolves (p.37).' }
  ];
  // the Dominion (his word 10-14: "2 days after the Harbinger starts head hunting bring in 3 dominion units from the west road - kat's wagon
  // loadout"; "not cannon for mode test"): Kat's wagon as the serial has it -- the patrol lady, an elder sergeant, a dozen soldiers, the wagon;
  // the lady a CHAINMAIL warlock (p.30), the soldiers heavy foot, the wagon baggage (p.21)
  SN.DOMINION = [
    { id: 'dm1', side: 'dominion', name: "a Dominion wagon", kind: 'the Dominion', cls: 'HF', def: 'HF', figs: 12, morale: 5, wagon: true, move: 3,
      heroes: [{ type: 'wizard', name: 'a patrol lady (warlock)', warlock: true, missile: 'fireball' }], sheets: ['npcwarlock_p0', 'trooper_p0'] },
    { id: 'dm2', side: 'dominion', name: "a Dominion wagon", kind: 'the Dominion', cls: 'HF', def: 'HF', figs: 12, morale: 5, wagon: true, move: 3,
      heroes: [{ type: 'wizard', name: 'a patrol lady (warlock)', warlock: true, missile: 'lightning' }], sheets: ['npcwarlock_p0', 'trooper_p0'] },
    { id: 'dm3', side: 'dominion', name: "a Dominion wagon", kind: 'the Dominion', cls: 'HF', def: 'HF', figs: 12, morale: 5, wagon: true, move: 3,
      heroes: [{ type: 'wizard', name: 'a patrol lady (warlock)', warlock: true, missile: 'fireball' }], sheets: ['npcwarlock_p0', 'trooper_p0'] }
  ];
  SN.DAY0 = 14; SN.HUNT = 18; SN.LAST = 28; // (the Pit two days after the Skylights, Day 14; the exchange ~18-21 -- the clock lane; the battle stops at Day 28 whatever stands)
  SN.STACK = 3; // (units of one side a hex, the Pit excepted)
})();
