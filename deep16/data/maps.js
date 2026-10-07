/* DEEP16 — the ladder's maps (09-27, the ladder seat): one hand-drawn map per set piece, the cavern's legend
   (data/cavern.js):  #  rock   .  raw floor   =  dressed stone   P  stalagmite   r  rubble (difficult)
                      ~  still water (difficult; a creature bound to it moves there freely)   L  the ledge (two steps up)
                      /  a fallen slab (one step: the ramp)   c  a cocoon on the wall
   Rows are gy (0 = the far, upper-right wall), columns gx (0 = the far, upper-left wall); the party walks in at the bottom.
   A map may carry `webs` (squares strung with web at the start: difficult for all but the web-walkers, and since 09-30 a
   hazard -- DEX against `webDC` on entering or starting a turn in them, or restrained; fire burns them: js/battle.js, magic.js).
   BUILDING A MAP? ASK WHETHER ITS GROUND IS SOLID STONE (10-01d, Griz: "put something somewhere so that when an instance goes to build a
   new map it considers whether or not it should"). A burrower -- the bulette, the xorn, the ankheg, a purple worm, a blue dragon --
   goes under any floor but worked stone (SRD 5.1: burrowing is through "sand, earth, mud, or ice", never solid rock; Earth Glide is
   through "unworked earth and stone"). `noBurrow: true` -- the whole floor is worked stone (a dwarven hall); `noBurrowAt: [[x, y, w, h]]` -- these squares (the Wet's dressed rim round the landlord's pool, 10-04); `noBurrow: '='` -- these
   squares are (the made road where it is whole, dressed blocks); none -- dig anywhere (a cave, a torn-up road: the Breach, on his word).
   Read by js/grid.js G.solidFloor and js/ai.js burrower. The testers are asked the same on situations.html.
   AND WHAT STONE IT IS (10-01e, Griz: "approve browser recolor with new field"): `stone: 'grey'` or `stone: 'slate'` draws the map's
   rock -- walls, floor, stalagmites -- in it, and a creature made of the stone with it (the roper's disguise matches the stalagmites
   round it: js/sprites.js S.STONE); none -- brown, the cave stone every map so far is cut from. Read by js/iso.js iso.stoneOf. */
'use strict';
(window.D16 = window.D16 || {}).MAPS = (window.D16.MAPS || {});
// Set design (09-27): these roads now run off the map's far edge -- an open edge is a way out (LEAVE THE FIGHT) --
// snootroad, bridge, causeway, breach, restcamp (both ends), barricade, cutwalls. The seam, the lamp, the camps, the
// bog, the point and the gulch keep their dead ends.

// Web Gulch, the strung end (the 8-bit game's `gulch`): the ravine closes into a knot of web, and on a shelf of rock
// above it the ettercap sits braiding. The slab at (6-7, 3) is the only way up.
window.D16.MAPS.gulch = {
  name: 'Web Gulch',
  sub: 'the strung end',
  step: 10, climb: 2, // the ledge's 5 ft face can be climbed (10 ft of movement, no check: a body pulls itself up a 5 ft ledge) or dropped, the ramp still the free way up -- 10-04, Griz: "2 - Agreed" (handoff-2026-10-04-climbing-the-other-maps.md; the bench: no fight on it changed)
  ground: 'earth', // the gulch is open to the sky (the 8-bit game's `gulch` is an outdoor ground)
  rows: [
    '##################',
    '####LLLLLL########',
    '###.LLLLLL..######',
    '##....//.....#####',
    '##............####',
    '#....P.........###',
    '#...............##',
    '##......rr......##',
    '###....rrr.....###',
    '####..........####',
    '####.....P...#####',
    '#####.......######',
    '######....########',
    '######....########'
  ],
  entry: [[7, 12], [8, 12], [7, 13], [8, 13], [6, 11]],
  // strung rim to rim (Griz, 09-30: "I think we need a bunch of webbing in the room"): the 8-bit gulch's strung end is web from
  // wall to wall, the ettercap sitting in it. Added that day: the ledge round its seat, the floor under the ledge's ends, the back
  // corners and the side walls; the slab and the two squares above it are left clear, so the way up is not all difficult ground
  webs: [[3, 2], [3, 3], [4, 3], [12, 3], [4, 5], [13, 5], [3, 6], [4, 6], [5, 6], [10, 6], [11, 6], [12, 6], [5, 7], [6, 7], [12, 7], [13, 7], [14, 6],
    [4, 1], [5, 1], [6, 1], [8, 1], [9, 1], [5, 2], [8, 2], [9, 2], [10, 2], [11, 2],
    [2, 3], [2, 4], [3, 4], [11, 3], [12, 4], [13, 4], [1, 5], [1, 6], [2, 6], [15, 6], [15, 7], [14, 7]],
  webDC: 11, // the ettercap's silk (SRD 5.1 Ettercap, Web: DC 11 Strength to burst it; RULED 09-30, Griz: "11")
  // the corner west of its seat where the floor meets two walls (Griz, 09-30: "fancy up like what I'd call 3 tiles west of the
  // Ettercap where the floor and two walls make a corner" -- then, pointing in the pane: "where the mouse is is the tile I meant ...
  // (his spawn at the time)"): the ledge's end, (4, 1), three along from its seat at (7, 1), walls at (3, 1) and (4, 0). The two
  // nooks of the back wall's step, (3, 2) and (2, 3), first read as his corner, keep theirs. A corner web strung across each, a
  // cocoon hung in it (js/ui.js cornerWeb)
  webCorners: [[4, 1], [3, 2], [2, 3]],
  foes: [],
  wave: null
};

// The Warrens, the deepest pool, under the fall (the 8-bit game's `wet`, warrens_d): black water with a rim of wet
// stone round it and the worked stair coming down into it. What lives in the pool will not leave the water, but its
// tentacles reach ten feet past the edge: the rim is all in its reach, the stair's lower steps are not.
window.D16.MAPS.pool = {
  name: 'The Deepest Pool',
  sub: 'the Warrens, under the fall',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '##################',
    '#######....#######',
    '#####..~~~~..#####',
    '####..~~~~~~..####',
    '###..~~~~~~~~..###',
    '###..~~~~~~~~..###',
    '###..~~~~~~~~..###',
    '####..~~~~~~..####',
    '#####..~~~~..#####',
    '######......######',
    '#######====#######',
    '#######====#######',
    '#######====#######',
    '#######====#######'
  ],
  entry: [[8, 12], [9, 12], [8, 13], [9, 13], [7, 11]],
  foes: [],
  wave: null
};

// Leg one of the king's road: the cut seal and the camp behind it (the 8-bit game's S.cutSeal). The warded wall lies
// broken at the neck (rubble); beyond, hide tents (the stalagmites stand in for them: they block and give cover),
// a shelf of rock at the back where the chief keeps his bedding.
window.D16.MAPS.camp = {
  name: 'The Cut Seal',
  sub: 'the king\'s road, leg one: the camp',
  dark: true, lights: [[9, 6, 20, 'fire']], // torchdark (09-28): dark ground; the goblins' fire
  step: 10, climb: 2, // the ledge's 5 ft face can be climbed (10 ft of movement, no check: a body pulls itself up a 5 ft ledge) or dropped, the ramp still the free way up -- 10-04, Griz: "2 - Agreed" (handoff-2026-10-04-climbing-the-other-maps.md; the bench: no fight on it changed)
  rows: [
    '####################',
    '##.......LLLL.....##',
    '#......../LLL......#',
    '#..P..........P....#',
    '#..................#',
    '#.....P......P.....#',
    '#..................#',
    '##................##',
    '###..............###',
    '####.....rrr....####',
    '#####...rr.rr..#####',
    '#######..rrr.#######',
    '########====########',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 11]],
  foes: [],
  wave: null
};

// The north cut (the 8-bit game's S.pinned): a cavern with a neck of rock at the back no wider than two dwarves, and
// across the neck a wall of crates and packs (the P squares: they block and give cover). Halldor's unit is behind it
// in the 8-bit game; on the ladder there are only the four, and what comes out of the walls.
window.D16.MAPS.cut = {
  name: 'The North Cut',
  sub: 'off the king\'s road',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '##################',
    '#######....#######',
    '#######PPPP#######',
    '######......######',
    '####..........####',
    '###....P.......###',
    '##..............##',
    '##......rr......##',
    '###.....rr.....###',
    '###............###',
    '####....P.....####',
    '#####........#####',
    '######......######',
    '#######====#######'
  ],
  entry: [[8, 12], [9, 12], [8, 13], [9, 13], [7, 12]],
  foes: [],
  wave: null
};

// The nest (the 8-bit game's S.brood): a chamber hung with cocoons (c, on the walls), silk strung across it, and in
// the middle something the size of a cart.
window.D16.MAPS.nest = {
  name: 'The Nest',
  sub: 'the gallery\'s end, below the halls',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '####################',
    '###c..c####c...c####',
    '##................##',
    '#c...........P.....#',
    '#..................#',
    '#..................#',
    '#.....P...........c#',
    '#..................#',
    '##.......rr.......##',
    '###..............###',
    '####............####',
    '######........######',
    '########....########',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 11]],
  webs: [[2, 2], [3, 2], [4, 2], [15, 2], [16, 2], [2, 4], [16, 5], [17, 5], [4, 7], [5, 7], [13, 8], [14, 8], [15, 7]],
  webDC: 12, // the brood's silk (SRD 5.1 Giant Spider, Web: DC 12 Strength to burst it) -- the seat's call, by the gulch's ruling
  foes: [],
  wave: null
};

// Leg four of the king's road: the troll hole (the 8-bit game's S.trolls, `highway`): a cavern off the south side of the
// road, the made road's stone at its mouth, bones underfoot (rubble), and a smell like a butcher's yard in summer.
window.D16.MAPS.trollcave = {
  name: 'The Troll Hole',
  sub: 'the king\'s road, leg four',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '####################',
    '#####..........#####',
    '###..............###',
    '##....rr..........##',
    '#.........P........#',
    '#..................#',
    '#....P.............#',
    '#.........rrr......#',
    '##................##',
    '###.....P........###',
    '####............####',
    '######........######',
    '########====########',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 11]],
  foes: [],
  wave: null
};

// Third Lamp (the 8-bit game's S.raid, `highway`): the lamp-station on the king's road -- the made road down the middle,
// the garrison's crates pulled into barricades (the P squares), the lamp's platform at the back (the ledge), a slab up to it.
window.D16.MAPS.lamp = {
  name: 'Third Lamp',
  sub: 'the king\'s road: the station, taken',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10, climb: 2, // the ledge's 5 ft face can be climbed (10 ft of movement, no check: a body pulls itself up a 5 ft ledge) or dropped, the ramp still the free way up -- 10-04, Griz: "2 - Agreed" (handoff-2026-10-04-climbing-the-other-maps.md; the bench: no fight on it changed)
  rows: [
    '####################',
    '###...LLLLLLLL...###',
    '##....LLL/LLLL....##',
    '#.......====.......#',
    '#..P....====....P..#',
    '#.......====.......#',
    '#..PPP..====..PPP..#',
    '#.......====.......#',
    '##......====......##',
    '###.....====.....###',
    '####....====....####',
    '#####...====...#####',
    '########====########',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 11]],
  foes: [],
  wave: null
};

// Deepholm's door (the 8-bit game's `threshold`, where the cleric comes up the road: deep.js EV.torvald): the made road runs
// on to its end, "a small spot, a bench, a grille, and a light that is not a lamp", and a door the height of three men at the
// top of the step (the ledge). The grille's bars either side of the road (f), the bench (k). Closed but for the road back up.
window.D16.MAPS.threshold = {
  name: 'Deepholm\'s Door',
  sub: 'the made road\'s end',
  noBurrow: true, // (Deepholm's door: dwarven work underfoot, nothing comes up through it -- Griz, 10-01d, "Dwarven Halls seems like a yes")
  dark: true, lights: [[9, 1, 20, 'glow']], // torchdark (09-28): dark ground; "a light that is not a lamp" at the door
  step: 10, climb: 2, // the ledge's 5 ft face can be climbed (10 ft of movement, no check: a body pulls itself up a 5 ft ledge) or dropped, the ramp still the free way up -- 10-04, Griz: "2 - Agreed" (handoff-2026-10-04-climbing-the-other-maps.md; the bench: no fight on it changed)
  rows: [
    '####################',
    '#######LLLLLL#######',
    '######.LL/LLL.######',
    '#####...====...#####',
    '####..f.====.f..####',
    '###...f.====.f...###',
    '##..k...====......##',
    '##......====......##',
    '##......====......##',
    '###.....====.....###',
    '####....====....####',
    '#####...====...#####',
    '########====########',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 11]],
  foes: [],
  wave: null
};

// The drow's fallback line (the 8-bit game's S.fallback, leg four): a line of crates across the road with gaps in it,
// and pale heads behind it. They have had a day to get ready.
window.D16.MAPS.barricade = {
  name: 'The Fallback Line',
  sub: 'the king\'s road, leg four',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '########====########',
    '######..====..######',
    '####....====....####',
    '###.....====.....###',
    '##......====......##',
    '##.PPPP.PPPP.PPPP.##',
    '##......====......##',
    '#.......====.......#',
    '#..r....====....r..#',
    '#.......====.......#',
    '##......====......##',
    '####....====....####',
    '########====########',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 11]],
  foes: [],
  wave: null
};

// The stone giant's camp (the 8-bit game's S.giant, leg three): a cut off the south side of the road, duergar grey and
// quiet at their fire, and behind them, sitting against the wall as if it were part of it, a giant made of the same stone.
window.D16.MAPS.giantcamp = {
  name: 'The Giant\'s Camp',
  sub: 'the king\'s road, leg three',
  dark: true, lights: [[9, 6, 20, 'fire']], // torchdark (09-28): dark ground; the duergar's fire
  step: 10,
  rows: [
    '####################',
    '####............####',
    '###..............###',
    '##...P......P.....##',
    '#..................#',
    '#.....rr...........#',
    '#..................#',
    '##........P.......##',
    '###..............###',
    '####............####',
    '#####..........#####',
    '######........######',
    '########====########',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 11]],
  foes: [],
  wave: null
};

// The dens under the roost (the 8-bit game's S.rescue, `guano`, the galleries): a side gallery where a drive went wrong.
// Overhead, the roost -- millions of sleeping wings -- and its one law: no fire, no thunder (the fight's `roost`).
window.D16.MAPS.roost = {
  name: 'The Dens',
  sub: 'the galleries, under the roost',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '##################',
    '#####........#####',
    '###............###',
    '##..P........P..##',
    '#................#',
    '#.....rr.........#',
    '#................#',
    '##......P.......##',
    '###............###',
    '####..........####',
    '#####........#####',
    '######......######',
    '#######....#######',
    '#######....#######'
  ],
  entry: [[8, 12], [9, 12], [8, 13], [9, 13], [7, 11]],
  foes: [],
  wave: null
};

// The drainage cut under the station (the 8-bit game's S.drainCut): Thyra's people keep a weighted grate over it and do
// not go down. Something black lies across the floor down there, glossy and still. Two somethings.
window.D16.MAPS.drain = {
  name: 'The Drain Cut',
  sub: 'under the station',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '##################',
    '######....########',
    '#####......#######',
    '####........######',
    '###..........#####',
    '###...r......#####',
    '##............####',
    '##.....rr......###',
    '###.............##',
    '####..........####',
    '#####........#####',
    '######......######',
    '#######====#######',
    '#######====#######'
  ],
  entry: [[8, 12], [9, 12], [8, 13], [9, 13], [7, 11]],
  foes: [],
  wave: null
};

// The rest (the 8-bit game's sect blades, "wherever you rest"): the four camped on the road where it runs through a
// wide cave, the stalagmites round it, and the dark at the edges. The party starts where it lay down.
window.D16.MAPS.restcamp = {
  name: 'The Rest',
  sub: 'the king\'s road, past Torvald',
  dark: true, lights: [[10, 6, 20, 'fire']], // torchdark (09-28): dark ground; the party's own fire, where it lay down
  step: 10,
  rows: [
    '########====########',
    '###.....====.....###',
    '##......====......##',
    '#...P...====...P...#',
    '#.......====.......#',
    '#......======......#',
    '#......======......#',
    '#......======......#',
    '#.......====.......#',
    '#...P...====...P...#',
    '##......====......##',
    '###.....====.....###',
    '####....====....####',
    '########====########'
  ],
  entry: [[8, 5], [11, 5], [8, 7], [11, 7], [9, 6]],
  foes: [],
  wave: null
};

// The bridge into the camp (the 8-bit game's enter:warrens_a, `plains`): the line holds the far end of a bridge four
// wide over a drop (the rock either side of it is the drop); the camp's ground beyond.
window.D16.MAPS.bridge = {
  name: 'The Bridge',
  sub: 'the way into the camp',
  step: 10,
  ground: 'earth',
  rows: [
    '########====########',
    '##......====......##',
    '#.......====.......#',
    '#...P...====.P.....#',
    '##......======....##',
    '########====########',
    '########====########',
    '########====########',
    '########====########',
    '#######.====.#######',
    '####....====....####',
    '###..............###',
    '####............####',
    '######........######'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 12]],
  foes: [],
  wave: null
};

// The road north of the Halfway Inn at night, where it climbs past the gulch (the 8-bit game's wagon chase: S.wagonChase, the
// road fights): the road up the middle, grass and scrub either side, rubble, the trees closing in at the edges. North is the
// way on toward the fork and the Tower (exit: the pair run for it); the party comes up from the south.
window.D16.MAPS.northroad = {
  name: 'The Road North',
  sub: 'past the gulch, at night',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  ground: 'earth',
  road: 'y',
  rows: [
    'TTTgg.r.,,,,..g.gTTT',
    'TTgg....,,,,....ggTT',
    'Tgg..r..,,,,..r..ggT',
    'Tg......,,,,......gT',
    'gg...rr.,,,,.......g',
    'g.......,,,,....r..g',
    'g..r....,,,,.......g',
    'g.......,,,,..rr...g',
    'gg......,,,,.......g',
    'Tg...r..,,,,......gT',
    'Tgg.....,,,,..r..ggT',
    'TTg.....,,,,.....gTT',
    'TTgg....,,,,....ggTT',
    'TTTgg...,,,,...ggTTT'
  ],
  entry: [[9, 13], [10, 13], [8, 13], [11, 13], [9, 12]],
  exit: [[3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0]],
  exitName: 'up the road into the dark',
  foes: [],
  wave: null
};

// The road south of the Halfway Inn (the 8-bit game's S.snoot, `gnoll`): open country with the road through it,
// scrub and stones (the rubble), and the Snoot's young blood across it by day.
window.D16.MAPS.snootroad = {
  name: 'The Road South',
  sub: 'south of the Halfway Inn',
  step: 10,
  ground: 'earth',
  rows: [
    '########====########',
    '#####...====...#####',
    '###.....====.....###',
    '##....r.====.r....##',
    '#.......====.......#',
    '#.......====.......#',
    '#...rr..====.......#',
    '#.......====...rr..#',
    '#.......====.......#',
    '##......====......##',
    '###.....====.....###',
    '####....====....####',
    '######..====..######',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 12]],
  foes: [],
  wave: null
};

// The Burial (the 8-bit game's `dwarf`, The One Law): worked stone under the old dwarf-hold, columns (the stalagmites
// stand in), the lamp by the stair up at the back. The stair is the way out (exit): the wheelwright runs for it.
window.D16.MAPS.burial = {
  name: 'The Burial',
  sub: 'under the old hold, the night shift',
  noBurrow: true, // (worked stone under the old dwarf-hold -- Griz, 10-01d, "Dwarven Halls seems like a yes")
  dark: true, lights: [[12, 2, 30, 'gold']], // torchdark (09-28): dark ground; the lamp by the stair
  step: 10,
  rows: [
    '####################',
    '########====########',
    '####....====....####',
    '###..............###',
    '##..P....==....P..##',
    '#......======......#',
    '#......======......#',
    '#..P...======...P..#',
    '#......======......#',
    '##.....======.....##',
    '###....======....###',
    '####...======...####',
    '#######======#######',
    '#######======#######'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 12]],
  exit: [[8, 1], [9, 1], [10, 1], [11, 1]],
  exitName: 'up the stair',
  foes: [],
  wave: null
};

// The siphon stair (the 8-bit game's S.holdStair, warrens_d): the four hold the landing at the top of a flight (the
// ledge; the slabs are the steps) over the siphon's pool, and the night crews come up at them.
window.D16.MAPS.siphon = {
  name: 'The Siphon Stair',
  sub: 'the Warrens, holding the stair',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10, climb: 2, // the ledge's 5 ft face can be climbed (10 ft of movement, no check: a body pulls itself up a 5 ft ledge) or dropped, the ramp still the free way up -- 10-04, Griz: "2 - Agreed" (handoff-2026-10-04-climbing-the-other-maps.md; the bench: no fight on it changed)
  rows: [
    '####################',
    '######........######',
    '####............####',
    '###..............###',
    '##...P........P...##',
    '##................##',
    '##.......~~.......##',
    '###......~~......###',
    '####............####',
    '#####...////...#####',
    '######.LLLLLL.######',
    '#######LLLLLL#######',
    '########LLLL########',
    '####################'
  ],
  entry: [[8, 11], [9, 11], [10, 11], [11, 11], [9, 12]],
  foes: [],
  wave: null
};

// The test ground (10-02, Griz: "build a permanent 'test ground' with various lighting levels in it, and script a fight that should display
// all the animations twice"): a long hall with one lamp in it, a little nearer the way in than the far end ("have the test room light source
// be in the room somewhere, casting both bright and dim light over the middle", 10-02): BRIGHT over the middle, DIM in a ring past it (the
// near end, where the watchers come in, and a band toward the far end), DARK at the far end and the corners, where only darkvision, the bat's
// sonar or the snake's tongue find anything. No walls between: nothing stands in front of what is being looked at. Stalagmites for scale and
// for the stone. Slate (`stone`), so a creature made of stone shows its recolour (js/show.js &stone=brown|grey for the others). Raw floor: a
// burrower digs. Not a place in the realm -- js/show.js fights a creature here: deep16/?show=grick (deep16/blender-monsters.md, step 12).
window.D16.MAPS.testground = {
  name: 'The Test Ground',
  sub: 'bright, dim, dark',
  dark: true, lights: [[9, 8, 15, 'gold']], // the lamp: bright 15 ft (rows 5-11 down its middle), dim 15 more (to rows 2 and 13); row 1 and the far corners dark
  stone: 'slate',
  step: 10,
  rows: [
    '####################',
    '#.......P..........#',
    '#..P...........P...#',
    '#..................#',
    '#.....P......P.....#',
    '#..................#',
    '#.P..............P.#',
    '#..................#',
    '#.......==.........#',
    '#...P..........P...#',
    '#..................#',
    '#..................#',
    '#..................#',
    '########....########',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [8, 12], [11, 12], [9, 13], [10, 13]],
  foes: [],
  wave: null
};

// The open cavern south of the road (the 8-bit game's S.grickDen, leg one): stalagmites everywhere, and the dark in it
// is where things come from. The gricks start hidden among the stone.
window.D16.MAPS.grickden = {
  name: 'The Grick Den',
  sub: 'south of the king\'s road',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '####################',
    '####.....P......####',
    '###..P..........P###',
    '##.........P......##',
    '#...P..............#',
    '#.........rr....P..#',
    '#..P...............#',
    '#.......P.....r....#',
    '##..........P.....##',
    '###..............###',
    '####....P.......####',
    '######........######',
    '########....########',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 11]],
  foes: [],
  wave: null
};

// The breach on leg two (the 8-bit game's S.bulette): the made road torn up from below, its slabs thrown about.
window.D16.MAPS.breach = {
  name: 'The Breach',
  sub: 'the king\'s road, leg two',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '########====########',
    '#####...rrrrr...####',
    '###....rr===rr....##',
    '##......====.......#',
    '#.......======.....#',
    '#.......======.....#',
    '#...r...==rr==..P..#',
    '#.......======.....#',
    '##......======....##',
    '###.....======...###',
    '####....======..####',
    '#####...======.#####',
    '########====########',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 11]],
  foes: [],
  wave: null
};

// The deep galleries (the 8-bit game's `deep`, galleries g4, the tail bounty): dark pools, and something up in the dark.
window.D16.MAPS.deep = {
  name: 'The Deep Gallery',
  sub: 'the galleries, below the roost',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '####################',
    '####......~~~...####',
    '###.....~~~~~....###',
    '##.......~~~......##',
    '#....P............##',
    '#..................#',
    '#...~~.......P.....#',
    '#..~~~.............#',
    '##.................#',
    '###......P.......###',
    '####............####',
    '######........######',
    '########....########',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 11]],
  foes: [],
  wave: null
};

// The Halfway Inn's yard at night (the 8-bit game's wagon night), re-cut 09-27 (set design; Griz: "the battlemap for that
// first fight seems small ... get closer to the 8-bit scene") from tools/mapgen.py build_halfway at the same bearings: the
// road down the west side (off both ends: the way out), the wagon pulled in off it, the well and the hitching rail, the
// inn's long wall on the east with its two doors (the four come out of the near one), the woodpile, the stable to the south.
window.D16.MAPS.yard = {
  name: 'The Inn Yard',
  sub: 'the Halfway Inn, at night',
  dark: true, // torchdark (09-28): the inn's door lamp (already there)
  step: 10,
  ground: 'earth',
  road: 'y',
  rows: [
    ',,Tfffffffffffffffffff',
    ',,T...........gggggggf',
    ',,g..w..fff...gggggggf',
    ',,T.VWWW......gggggggf',
    ',,g.VWWW......gggggggf',
    ',,g.........bbbbbbbbbb',
    ',,g.........bbbbbbbbbb',
    ',,g........kbbbbbbbbbb',
    ',,g........kb=bbbbbb=b',
    ',,g...........gggggggf',
    ',,g...........gggggggf',
    ',,g...........gggggggf',
    ',,T...........gggggggf',
    ',,g.bbbbb.....gggggggf',
    ',,T.bbbbb.....gggggggf',
    ',,g.bbbbbk....gggggggf',
    ',,Tfffffffffffffffffff'
  ],
  entry: [[13, 9], [12, 9], [14, 9], [13, 10], [12, 10]],
  doors: [[13, 8], [20, 8]],
  exit: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [0, 10], [0, 11], [0, 12], [0, 13], [0, 14], [0, 15], [0, 16]],
  exitName: 'up the road into the dark',
  lights: [[13, 9, 40, 'gold']],
  foes: [],
  wave: null
};

// The causeway over the black water (the 8-bit game's S.naga, leg four): the made road crosses on dressed blocks, the
// water both sides. Halfway over, the water stands up -- and what stands up keeps to it (the naga is bound to '~').
window.D16.MAPS.causeway = {
  name: 'The Causeway',
  sub: 'the king\'s road, leg four: the black water',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '########====########',
    '###~~~~~====~~~~~###',
    '##~~~~~~====~~~~~~##',
    '#~~~~~~~====~~~~~~~#',
    '#~~~~~~~====~~~~~~~#',
    '#~~~~~~~====~~~~~~~#',
    '#~~~~~~~====~~~~~~~#',
    '#~~~~~~~====~~~~~~~#',
    '#~~~~~~~====~~~~~~~#',
    '##~~~~~~====~~~~~~##',
    '###~~~~~====~~~~~###',
    '####....====....####',
    '#####...====...#####',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 12]],
  foes: [],
  wave: null
};

// The made road's cut (the 8-bit game's S.elemental, leg four): the road runs into a cut, and the cut's walls move.
window.D16.MAPS.cutwalls = {
  name: 'The Cut',
  sub: 'the king\'s road, leg four: the made road',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '#######======#######',
    '#######======#######',
    '######.======.######',
    '#####..======..#####',
    '####...======...####',
    '###..r.======.r..###',
    '###....======....###',
    '###....======....###',
    '###..r.======....###',
    '####...======...####',
    '#####..======..#####',
    '######.======.######',
    '#######======#######',
    '#######======#######'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 12]],
  foes: [],
  wave: null
};

// Leg two's fork (the 8-bit game's S.roper): a cavern of stalagmites, and one of them is not.
window.D16.MAPS.roperfork = {
  name: 'The Fork',
  sub: 'the king\'s road, leg two',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '####################',
    '####..P....P....####',
    '###.............P###',
    '##..P......P......##',
    '#..........r.......#',
    '#...P.............P#',
    '#.......P....P.....#',
    '#..................#',
    '##...P........P...##',
    '###..............###',
    '####............####',
    '######........######',
    '########====########',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 11]],
  foes: [],
  wave: null
};

// The Warrens' settling pools (the 8-bit game's `wet`, warrens_d): dressed walkways between two pools; the second pool
// heaves, and the wet stone moves.
window.D16.MAPS.settling = {
  name: 'The Settling Pools',
  sub: 'the Warrens, the lower works',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '##################',
    '#####........#####',
    '###..~~~..~~~..###',
    '##...~~~..~~~...##',
    '##...~~~..~~~...##',
    '#.......==.......#',
    '#.......==.......#',
    '#..~~~..==..~~~..#',
    '#..~~~..==..~~~..#',
    '##......==......##',
    '###.....==.....###',
    '#####...==...#####',
    '#######....#######',
    '#######....#######'
  ],
  entry: [[8, 12], [9, 12], [8, 13], [9, 13], [7, 11]],
  foes: [],
  wave: null
};

// The flooded stair (the 8-bit game's `dwarf`, warrens_d, Pete's Five): a dwarven stair runs down into black water; in
// the flooded chamber five men lie drowned; past the water, a door under warded runes. What keeps it keeps to the water.
window.D16.MAPS.floodstair = {
  name: 'The Flooded Stair',
  sub: 'the Warrens, Pete\'s Five',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`); the rune is the one light (below)
  // THE 8-BIT'S STAIR (content/maps/warrens_d.json, events.js S.stair; 10-03, Griz: "a flooded staircase ... a square-cornered hall"): a straight dwarven hall four squares wide. The party stands
  // on the DRY LANDING (the 8-bit's x20-23) before the first stair; the stair, eight flooded steps (its 'n', x12-19), goes down from there under water toward the sealed door at the WEST
  // end; the rune is in the north wall above the landing (x22), and the way in is the corridor on the east. The whole flight is under water: the floor steps down a step a square
  // (heights, `step` px a step), the water is one flat sheet at `waterLevel` px, so it is ankle-deep at the first step and chest-deep at the last (a DRAWING only: js/ui.js UI.wading
  // and js/keeper.js K.wade; the rules read none of it). Still water is difficult terrain, which is also the SRD's swimming cost. Worked stone, solid ground for burrowing.
  step: 5, waterLevel: 39, noBurrow: true,
  // ONE description of the geometry, read by the engine (js/keeper.js), the probe and the benches alike, in the LANE FRAME -- a along the hall, from the deep (west) end, small, to the east;
  // c across it, left to right as the party faces the water (west); `width` the across extent; `axis` which of the map's own axes a runs along ('x' here). D16.laneAt(map, a, c) is the
  // one function from a lane-frame square to the map's own [x, y]; the map's own `deeps`, `entry`, `lights` and the Keeper's start (data/fights.js) are derived from it at the foot of this block.
  // THE TWO WAYS IN (10-03, Griz): `entry`, the LEDGE -- WADE IN, the water's edge, the first squares of the dry landing (a 9, and 10 for a fifth); `entryRune`, BY THE RUNE -- a hand on the mark
  // (or the rope with the Keeper awake), the landing squares beside it at its east end (a 11-12, c 9-10, and 12,8 for a fifth); Battle.enter picks by the fight's `start` ('ledge' | 'rune').
  // a 1..8 the flooded steps (the deep end, the last step, a = 1), a 9..12 the dry landing, a 13 the corridor; the wall (Griz: the 3rd from the exit, 11) and the rune (10-03, Griz: on the SIDE face of the north wall seen from the landing, beside DEEP16 grid square 12,7: `rune` is that landing square in the lane frame [a 12, c 10] and `runeFace` 'c+' the wall it is on, the face toward +c, the north wall; its light is on that square)
  geo: { axis: 'x', width: 18, a: [1, 12], c: [7, 10], wall: 11, deeps: [[1, 7], [1, 8], [1, 9], [1, 10], [2, 7], [2, 8], [2, 9], [2, 10]], entry: [[9, 7], [9, 8], [9, 9], [9, 10], [10, 8]], entryRune: [[12, 10], [11, 10], [12, 9], [11, 9], [12, 8]], keeper: [4, 8], rune: [12, 10], runeFace: 'c+' },
  heights: [
    '000000000000000',
    '000000000000000',
    '000000000000000',
    '000000000000000',
    '000000000000000',
    '000000000000000',
    '000000000000000',
    '001234567888888',
    '001234567888888',
    '001234567888888',
    '001234567888888',
    '000000000000000',
    '000000000000000',
    '000000000000000',
    '000000000000000',
    '000000000000000',
    '000000000000000',
    '000000000000000'
  ],
  rows: [
    '###############',
    '###############',
    '###############',
    '###############',
    '###############',
    '###############',
    '###############',
    '#~~~~~~~~....##',
    '#~~~~~~~~......',
    '#~~~~~~~~....##',
    '#~~~~~~~~....##',
    '###############',
    '###############',
    '###############',
    '###############',
    '###############',
    '###############',
    '###############'
  ],
  foes: [],
  wave: null
};
// the one function from the lane frame to the map: size = a creature's footprint, whose [x, y] is its low corner
window.D16.laneAt = function (m, a, c, size) {
  var g = m.geo, k = (size || 1) - 1;
  return g.axis === 'x' ? [a, g.width - 1 - c - k] : [c, a];
};
(function () { var m = window.D16.MAPS.floodstair, g = m.geo, at = function (p) { return window.D16.laneAt(m, p[0], p[1]); }; m.deeps = g.deeps.map(at); m.entry = g.entry.map(at); m.entryRune = g.entryRune.map(at);
  var rl = at(g.rune); m.lights = [[rl[0], rl[1], 20, 'glow']]; // (the rune lights the landing: a cold glow, modest -- the engine's own map light, [x, y, ft, colour])
  // back to the 8-bit's warrens_d (tools/mapgen.py: the landing x20-23 y20-23, the corridor east along y22 from x24): a = x - 11 there, c = y - 13 -- the way out at the corridor's
  // end, grid (14, 8), is the 8-bit's (25, 22), two squares into the corridor (10-06, the grid's rules §2b.18; deep16/js/embed.js E.exit8)
  m.to8 = function (gx, gy) { var a = gx, c = g.width - 1 - gy; return [a + 11, c + 13]; };
})();

// THE LADDER'S FLOODED STAIR (10-03, Griz: the ladder's fight is the old fight unchanged): `floodstair` as it is on origin/main before the Keeper work landed (ed7be2a), word for
// word but for its id -- the stair that runs north to a pool, `wade` 13, no rune, no light. Only data/fights.js keeper-ladder fights on it; the Pocket DM leaves it out (the new
// floodstair is its Flooded Stair: js/pocket.js mapIds); dev/keeper-probe.py diffs its rows against main's. Its old words, as they were:
// The flooded stair (the 8-bit game's `dwarf`, warrens_d, Pete's Five): a dwarven stair runs down into black water; in
// the flooded chamber five men lie drowned; past the water, a door under warded runes. What keeps it keeps to the water.
window.D16.MAPS['floodstair-old'] = {
  name: 'The Flooded Stair',
  sub: 'the Warrens, Pete\'s Five',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  // a stair, and a flooded one (10-02, Griz: "can we make the stair a stair and them be drawn underwater - barley looks like he's walking on top"): the flight
  // comes down a step a row from where the party stands to the water's edge, goes under, and climbs out the far side (heights, in steps of `step` px);
  // the water is waist-deep on a wader (wade, px of the figure under it: js/ui.js UI.wading), and the Keeper's held are drawn down in it
  // (10-02, Griz: "stair shouldn't climb out except on the side party comes in on" -- the far end is the pool's deep end; "this is solid ground for burrow
  // purposes (map may be used for other purposes)": worked stone)
  step: 5, wade: 13, noBurrow: true,
  heights: [
    '000000000000000000',
    '000000000000000000',
    '000000000000000000',
    '000000000000000000',
    '000000000000000000',
    '000000000000000000',
    '000000000000000000',
    '000000000000000000',
    '000001111111100000',
    '000000222222000000',
    '000000333333000000',
    '000000044440000000',
    '000000055550000000',
    '000000066660000000'
  ],
  rows: [
    '##################',
    '######~~~~~#######',
    '#####~~~~~~~######',
    '####~~~~~~~~~#####',
    '###~~~~~~~~~~~####',
    '###~~~~~~~~~~~####',
    '###~~~~~~~~~~~####',
    '####~~~~~~~~~#####',
    '#####..====..#####',
    '######.====.######',
    '######.====.######',
    '#######====#######',
    '#######====#######',
    '#######====#######'
  ],
  entry: [[7, 8], [10, 8], [8, 9], [9, 9], [8, 10]], // at the water's foot: in the 8-bit game you wade in (or rope them out)
  foes: [],
  wave: null
};

// The point (the 8-bit game's `lake`, at night): a flat oval stone, a stack of stones on its landward edge, the lantern
// post (the stalagmite stands in), the rowboat pulled up; forty paces out the water goes dark. The chuul comes up out of it.
window.D16.MAPS.point = {
  name: 'The Point',
  sub: 'the lake, at night',
  dark: true, lights: [[10, 7, 30, 'gold']], // torchdark (09-28): dark ground; the lantern post
  step: 10,
  ground: 'earth',
  rows: [
    '####################',
    '#~~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~......~~~~~#',
    '#~~~~~~........~~~~#',
    '#~~~~~....P.....~~~#',
    '#~~~~.....r......~~#',
    '#~~~.............~~#',
    '##..............####',
    '###............#####',
    '####..........######',
    '######......########'
  ],
  entry: [[8, 12], [9, 12], [10, 12], [7, 12], [9, 13]],
  foes: [],
  wave: null
};

// The Hex floor (the 8-bit game's `arena`, Fight Night): the pit in the middle of the hall, benches round it (the
// stalagmites stand in for the posts), flagstones underfoot.
window.D16.MAPS.hexfloor = {
  name: 'The Hex',
  sub: 'Fight Night, the floor',
  noBurrow: true, // (the hall's flagstones -- Griz, 10-01d, "Dwarven Halls seems like a yes")
  step: 10,
  rows: [
    '##################',
    '####..........####',
    '###..P......P..###',
    '##..............##',
    '##....======....##',
    '#.....======.....#',
    '#.....======.....#',
    '#.....======.....#',
    '#.....======.....#',
    '##....======....##',
    '##..............##',
    '###..P......P..###',
    '####..........####',
    '##################'
  ],
  entry: [[7, 11], [10, 11], [8, 12], [9, 12], [8, 11]],
  foes: [],
  wave: null
};

// The seam on leg three (the 8-bit game's S.xorn, `highway`): the made road under a wall with a mineral seam in it;
// the wall ahead bulges, cracks, and two things the size of barrels push out of the rock, chewing (the rubble they spat).
window.D16.MAPS.seamwall = {
  name: 'The Seam',
  sub: 'the king\'s road, leg three',
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '####################',
    '#####..rrrrr..######',
    '####..........######',
    '###.....====....####',
    '##......====.....###',
    '##..P...====......##',
    '#.......====.......#',
    '#.......====...P...#',
    '##......====......##',
    '###.....====.....###',
    '####....====....####',
    '#####...====...#####',
    '########====########',
    '########====########'
  ],
  entry: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 11]],
  foes: [],
  wave: null
};

// The Glowseep (the 8-bit game's `bog`, the glowseep table): a wet flat of reed-tussocks (the rubble) and black pools
// under an open sky; frogs and snakes in the water.
window.D16.MAPS.bog = {
  name: 'The Glowseep',
  sub: 'the bog, off the north road',
  step: 10,
  ground: 'earth',
  rows: [
    '##################',
    '####..~~~...r.####',
    '###..~~~~~....~###',
    '##..r~~~~...~~~~##',
    '#.....~~..r.~~~~.#',
    '#..r.......~~~...#',
    '#~~~....r........#',
    '#~~~~.......r..~~#',
    '##~~..r.......~~~#',
    '###.........r..###',
    '####....~~.....###',
    '######..~~..######',
    '######......######',
    '#######....#######'
  ],
  entry: [[8, 12], [9, 12], [8, 13], [9, 13], [7, 12]],
  foes: [],
  wave: null
};

// The wet (the 8-bit game's warrens_d, rows 0-18: the cave, 1:1 -- a map square is a grid square, so a trigger in the 8-bit is the
// same square here). THE SETTLING (RULED 09-30, Griz: "make a grid identical to the Wet map that covers the landlord and the 3 pools").
// D the landlord's deep water under the fall and ~ the three settling pools: deep water here (`deepWater`), as in the 8-bit -- nothing
// walks in it; what lives in it (the landlord, bound to D; the jelly, a swimmer) moves there. = the plank bridges; y the cradles, the
// crawler pens (timber cribs: the herd comes out of them); the stair up at the 8-bit's (1, 12-13) and the openings on the south edge
// are the ways out. The bucket lies at the 8-bit's (13, 5), where its crate is (deep16/js/wet.js).
// TURNED a quarter counter-clockwise on the screen (RULED 09-30b, Griz: "can you rotate the grid counter-clockwise"): the rows below
// are the 8-bit map's own, north up; the grid is them turned, so the 8-bit's north lies to the upper left. The 8-bit square (x, y) is
// the grid's (y, 43 - x); `from8` turns an 8-bit square (and a body `s` squares across) into the grid's -- the fight's triggers, pens,
// bucket and foes are written in the 8-bit's squares and turned by it (deep16/js/wet.js), and so is the lead's square from the seam
(function () {
  var R8 = [
    '########~###################################',
    '########~###################################',
    '########~######........#.#..################',
    '#####DDDDD.#.................#.#############',
    '####DDDDDDDD.....................###########',
    '####DDDDDDDD......................#.########',
    '####DDDDDDDD...y...................y.#######',
    '##...DDDDD====~~..................~~.#######',
    '##..........~=~~~................~~~~.#####~',
    '#...........~~~~~~..........~~...=~~~~~~~~~~',
    '#.............~~..==~~~~~..~~~~~==~~....####',
    '#.................~=~~~~~.~=~~~........#####',
    '#.................~~~~~~~~==~~~........#####',
    '#..................~~~~~~.............######',
    '#...................................########',
    '##.................................#########',
    '###.....................y...........########',
    '#####..........................##.....######',
    '##########.#.................#.###.....#####'
  ];
  var W8 = R8[0].length, rows = [];
  for (var gy = 0; gy < W8; gy++) { var r = ''; for (var gx = 0; gx < R8.length; gx++) r += R8[gx][W8 - 1 - gy]; rows.push(r); }
  var from8 = function (x, y, s) { return [y, W8 - (x + (s || 1))]; };
  var to8 = function (gx, gy) { return [W8 - 1 - gy, gx]; }; // (and back: a grid square to the 8-bit's -- the square the party walked off at, 09-30d)
  var at8 = function (list) { return list.map(function (p) { return from8(p[0], p[1]); }); };
  var rect8 = function (x, y, w, h) { return [y, W8 - (x + w), h, w]; }; // (an 8-bit rect, turned with the map: the grid's [x, y, w, h])
  window.D16.MAPS.wet = {
    name: 'The Wet',
    sub: 'the Warrens, the settling pools',
    dark: true, // (the 8-bit map's `dark`; its one light is the deep station's lamp on the crate, below)
    lampAt: from8(13, 3), // (the deep station's lamp on its post, two squares north of the crate on the 8-bit -- the grid's (3, 30): deep16/js/wet.js W.layLamp draws it; 10-06, Griz: "the lantern - which sits at 5, 29 and I think would go better at 3, 30")
    lights: [[from8(13, 3)[0], from8(13, 3)[1], 10, 'gold']], // (10-04, Griz: "put a light nearby the bucket ... a visible draw on the grid": the lamp's own light, bright 10 ft, dim 10 more -- on the lamp's square, not the bucket's: "the bucket glows like its a light" when it sat there)
    noBurrowAt: [rect8(3, 3, 10, 6)], // (10-04, Griz: "The tiles around the Landlords pool should be switched to solid stone": the pool and its rim, the 8-bit's x 3-12, y 3-8 -- dressed stone; nothing burrows under it or comes up through it)
    step: 10,
    deepWater: 'D~',
    rows8: R8, rows: rows, from8: from8, to8: to8,
    entry: at8([[2, 12], [2, 13], [3, 12], [3, 13], [2, 11]]),
    doors: at8([[1, 12], [1, 13]]),
    foes: [],
    wave: null
  };

// The Terraced Cistern (10-04, Griz: "make a complex battlemap with various heights and lighting conditions" -- the stealth session's test floor): a cistern hall in three heights
// (`heights`, a digit a square in steps of 10 px: the floor 1, the pool 0 with the dais in it at 2, the terrace 3, the gallery 5) and every kind of light. Two steps is a cliff; the
// ways up are one step a square: a flight at each end of the floor, a stair at each end of the terrace. BRIGHT: the lamp on the dais (gold, 15 ft bright, 15 dim) and the brazier
// on the gallery's west end (fire, 20 + 20); DIM ONLY: a violet glow over the east terrace (40 ft, nothing bright -- a rogue can hide in it); DARK: the whole south-west (the crates, the
// pillars past the pool) and the south-east, the way in, the gallery's east end. Pillars and crates are cover, the rail is half cover along the gallery's edge, the pool is difficult
// ground, and a thief behind a pillar in the dark at the foot of the terrace is out of every watch. Worked stone all through: nothing burrows up into it.
window.D16.MAPS.cistern = {
  name: 'The Terraced Cistern',
  sub: 'heights and every light',
  dark: true,
  lights: [[11, 10, 15, 'gold'], [4, 1, 20, 'fire'], [17, 5, 40, 'violet', 1]],
  stone: 'slate', step: 10, noBurrow: true,
  climb: 2, // the cliffs of two steps (5 ft) can be scaled -- SRD 5.1: each foot costs an extra foot; a 5 ft ledge takes no check since 10-04 (grid.js G.climbDC) -- or dropped (a fall under 10 ft)
  heights: [
    '0000000000000000000000',
    '0005555555555555555000',
    '0005555555555555555000',
    '0033443333333333443300',
    '0033333333333333333300',
    '0033333333333333333300',
    '0033333333333333333300',
    '0022111111111111112200',
    '0011111110000111111100',
    '0011110000222000111100',
    '0011110000222000111100',
    '0011110000110000111100',
    '0011110000000000111100',
    '0011111110000111111100',
    '0011111111111111111100',
    '0011111111111111111100',
    '0000000000110000000000',
    '0000000000110000000000'
  ],
  rows: [
    '######################',
    '###................###',
    '###...ffff...fff...###',
    '##..................##',
    '##.................r##',
    '##.r...P......P.....##',
    '##..r...............##',
    '##..................##',
    '##.......~~~~.......##',
    '##....P~~~===~~P....##',
    '##....~~~~===~~~....##',
    '##....~~~~==~~~~....##',
    '##kk..~~~~~~~~~~..w.##',
    '##.kP....~~~~....P..##',
    '##..k....P...Prr....##',
    '##.............rr...##',
    '##########==##########',
    '##########==##########'
  ],
  entry: [[10, 16], [11, 16], [10, 17], [11, 17], [9, 15]],
  foes: [],
  wave: null
};

// The Climbing Floor (10-04, Griz: "what's the vertical range possible with the map builder -- experiment with climbing variations"): one floor (0) and six towers whose south faces
// are cliffs of 2, 3, 4, 6, 9 and 12 steps (5, 7.5, 10, 15, 22.5 and 30 ft; a step is 2.5 ft). `climb: 12` lets a body of one square scale up to that many steps: each foot climbed costs an
// extra foot (SRD 5.1: 5 ft of movement a step, so the 30 ft face is 60 and takes a Dash), and over 5 ft a Strength (Athletics) check, DC 12 at three steps and 2 more for every step above -- a miss
// slides back prone, and over 10 ft falls (10-04, grid.js G.climbDC, battle.js moveAlong); a drop of 10 ft or more is 1d6 bludgeoning a 10 ft and lands prone
// (SRD 5.1 Falling). The last tower's height is the base-36 digit `c`: a `heights` digit reads 0-9 then a-z, up to 35 steps. A stair of one-step squares in the south-east corner is the
// control (it needs no climb). Daylight: no `dark`.
window.D16.MAPS.climbfloor = {
  name: 'The Climbing Floor',
  sub: 'cliffs of 2 to 12 steps',
  stone: 'slate', step: 10, noBurrow: true, climb: 12,
  heights: [
    '000000000000000000000000',
    '022203330444066609990cc0',
    '022203330444066609990cc0',
    '022203330444066609990cc0',
    '022203330444066609990cc0',
    '022203330444066609990cc0',
    '000000000000000000000000',
    '000000000000000000000000',
    '000000000000000000000000',
    '000000000000000000000050',
    '000000000000000000000040',
    '000000000000000000000030',
    '000000000000000000000020',
    '000000000000000000000010',
    '000000000000000000000000',
    '000000000000000000000000'
  ],
  rows: [
    '########################',
    '#...#...#...#...#...#..#',
    '#...#...#...#...#...#..#',
    '#...#...#...#...#...#..#',
    '#...#...#...#...#...#..#',
    '#...#...#...#...#...#..#',
    '#......................#',
    '#......................#',
    '#..P.............P.....#',
    '#......................#',
    '#......................#',
    '#......................#',
    '#...........P..........#',
    '#......................#',
    '##########==############',
    '##########==############'
  ],
  entry: [[10, 14], [11, 14], [10, 15], [11, 15], [9, 13]],
  foes: [],
  wave: null
};
// The Edifice (10-04, the climbing seat's handoff; REBUILT 10-04 night as the exterior, 60 wide, after Silverton's rhythm -- Griz: "It's supposed to be external and the
// third floor is internal tho possibly visible to the skylight glass that should make up the majority of the 4th floor/3rd floor ceiling"): Fountain Street along the foot
// of Sólskaft's facade, as the 8-bit map has it (content/maps/silverton.json rows 2-11: the arches every four columns, the falls at the middle, the fountains along the
// wall, the houses across the street, the road north at the west end, the water running off east), the facade 45 ft (three 15 ft dwarven floors, 18 steps, `i`), and
// on top the roof: skylight glass (`G`) with a stone rim and merlons, through which the orchard on the third floor shows -- its grass, its trees, the Sunshaft's circle
// (`shaft`). The mountain's waterfall comes down the back wall as a channel into an intake pool (deep water, `D`) and pours into the structure; it comes out through the
// fountains along the front wall and runs off east. The arches' tops are sills at 15 ft (`6`, DC 18 by hand: `climb: 6`); the 30 ft above a sill takes a grapple (30 ft) or
// the rope the dwarves left at the west end (45 ft: the rungs); a climber (a `climbs` speed) goes straight up. The front doors are marked, not built ("don't build that
// in"). The arches' sills are gone (10-04 night): the four fountains stand against the foot of the facade instead, and by hand nobody climbs it -- the rope, a climb speed, or the vault. The rope bucket by the first house (`ropeBucket`): a Rope & Grapple for anyone beside it, free, endless -- Griz, 10-04 night. The street four rows and the house
// band five (Griz, 10-04 night: "expand the street 2 squares wider and the buildings 2 squares wider"). Daylight: no `dark`. `edifice-top` in
// invented.json. The party comes up the lane from the south; the ways out are the lane, the street's east end and the road north.
window.D16.MAPS.edifice = {
  name: 'The Edifice',
  sub: 'Fountain Street under the waterfall facade of Sólskaft, and the roof of glass',
  stone: 'grey', step: 10, noBurrow: true, climb: 6, deepWater: 'D', // (D: the channel off the east end) // (a hand scales 15 ft at most -- the arches' sills; the 45 ft face takes the rope, a grapple from a sill, or a climb speed)
  ropes: [[11, 15, 11, 16]], // a rope the dwarves left hung from the rim at the west end, 45 ft to the street (the top square, the foot square)
  torchBarrel: [22, 30], // a barrel of torches in the rail fence behind the houses south of the street, off the path to the doors (battle.js exec 'barreltorch'; 10-05 night, Griz: "Should we add a torch barrel like the rope barrel?" -- "1 barrel yes 2 barrel yes"; then "please move the barrel to 22, 30 (behind the house to the right of the path to the doors)" -- it stood by the vault doors at (31,16))
  ropeBucket: [26, 25], // the bucket of rope and grapples in the alley at the side of the house by the south road (battle.js exec 'bucketrope'; 10-05, Griz: "rope bucket to 26, 25 side of the building" -- it stood by the first house at (3,24))
  shaft: [29.5, 4.8, 2.8], // the Sunshaft's circle on the third floor, seen through the glass, under the falls at the roof's middle (centre, radius in squares; iso.js bake -- Griz, 10-04 night: "move the light circle to where the pool is now ... increase the radius of the light-hole for symmetry")
  falls: [[28, 0], [29, 0], [30, 0], [31, 0]], // the waterfall down the back wall's face, into the water at its foot (iso.js rockCanvas)
  spouts: [[15, 15, 10], [23, 15, 10], [36, 15, 10], [44, 15, 10]], // the fountains: a hole flush in the facade's face at 10 ft over each pool's middle, the water pouring from it (iso.js bake -- Griz, 10-04 night: "5 foot rims around 15 feet of water for each fountain (try for 4 if we can symmetrical) where the hole the water comes out of is flush at 10 ft high"); the pools 3x3 of water (`~`, waded, difficult) ringed by a one-step rim (`=` at `1`), four of them, symmetric about the vault
  skylight: { at: [29, 5], name: 'the skylight over the Sunshaft', hp: 120, ac: 13, threshold: 8 }, // the monsters' target in a defend fight (&defend, or the fight's `defend: true`): magically harder than glass -- AC 13, 120 HP, a damage threshold of 8, resistance to everything, immune to poison and psychic; broken, the Edifice is breached and the fight lost (battle.js enter, hurt, over -- Griz, 10-04 night: "make the glass above the hole their target with a high damage resist that they'd eventually beat through")
  passages: [[29, 16, 29, 14, 'the vault door'], [30, 16, 30, 14, 'the vault door']], // (the door squares are `d`: a threshold tile, the doorway painted on the face above it -- iso.js bake) // the vault door on the street and the roof's hatch above it: GO IN / COME OUT for the rest of the move (battle.js Battle.passageAt, exec 'passage' -- Griz, 10-04 night: "Front doors possible?"); the arches are sills, not doors
  heights: [
    '000000000000000000000000000000000000000000000000000000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '00000000000iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii00000000000',
    '000000000000010001000100010000000010001000100010000000000000',
    '000000000000010001000100010000000010001000100010000000000000',
    '000000000000011111000111110000000011111000111110000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000',
    '000000000000000000000000000000000000000000000000000000000000'
  ],
  rows: [
    '#####,,,,###################################################',
    '#####,,,,##=================~~~~=================###########',
    '#####,,,,##=GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=###########',
    '#####,,,,##=GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=###########',
    '#####,,,,##=GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=###########',
    '#####,,,,##=GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=###########',
    '#####,,,,##=GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=###########',
    '#####,,,,##=GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=###########',
    '#####,,,,##=GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=###########',
    '#####,,,,##=GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=###########',
    '#####,,,,##=GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=###########',
    '#####,,,,##=GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=###########',
    '#####,,,,##=GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=###########',
    '#####,,,,##=GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=###########',
    '#####,,,,##=GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=###########',
    '#####,,,,##=P======P=======P====P=======P======P=###########',
    '###,,,,,,,,===~~~=====~~~====dd====~~~=====~~~===,,,,,,,,,,,',
    '###,,,,,,,,,,=~~~=,,,=~~~=,,,,,,,,=~~~=,,,=~~~=,,~~~~DDDDDDD',
    '###,,,,,,,,,,=====,,,=====,,,,,,,,=====,,,=====,,,,,,,,,,,,,',
    '###,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '###,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '###,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '###,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '###,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '###..bbbbbb..bbbbb..bbbbbb..,,,,bbbbb..bbbbb..bbbbb..bbbbb.#',
    '###..bbbbbb..bbbbb..bbbbbbk.,,,,bbbbb..bbbbb..bbbbb..bbbbb.#',
    '###..bbbbbb..bbbbb..bbbbbb..,,,,bbbbb..bbbbb..bbbbb..bbbbb.#',
    '###..bbbbbb..bbbbb..bbbbbb..,,,,bbbbb..bbbbb..bbbbb..bbbbb.#',
    '###..bbbbbb..bbbbb..bbbbbb..,,,,bbbbb..bbbbb..bbbbb..bbbbb.#',
    '###ggggggggggggggggggggggggg,,,,ggggggggggggggggggggggggggg#',
    '###ggffffffggfffffggffkfffgg,,,,fffffggfffffggfffffggfffffg#',
    '###gTggggggggggggggggggggggg,,,,gggggggggggggggggggggggggTg#',
    '###gggggggggggTggggggggggggg,,,,gggggggggTggggggggggggggggg#',
    '###gggTggggggggggggggggggTgg,,,,gggggggggggggggggggggTggggg#',
    '###ggggggggggggggggggggggggg,,,,gggTggggggggggggggggggggggg#',
    '###gggggggggggggggggTggggggg,,,,gggggggggggggggTggggggggggg#',
    '###ggggggTgggggggggggggggggg,,,,ggggggggggggggggggggggggggg#',
    '###ggggggggggggggggggggggggg,,,,ggggggggggggTgggggggggggggg#',
    '############################,,,,############################'
  ],
  entry: [[29, 37], [30, 37], [29, 36], [30, 36], [28, 37]],
  foes: [],
  wave: null
};
})();

// Third Lamp Station (10-07, Griz: "a tile-by-tile version of the 8-bit 3rd lamp with the inactive version in the floor. If the 8 bit map is
// too small, use it as a guide to make a suitable grid map for the 3rd lamp. Aim for as many squares as we use in the wet 'give or take' -
// we'll have waves of attackers - have more of the hall past the 3rd lamp than hall between the second and third lamps"). The 8-bit game's
// road, square for square: highway_3 from x 36 to its east end (the hall up from Second Lamp, 24 squares, its south alcove with the tent,
// then the station itself, x 60-75) and highway_4 from x 0 to 42 (the hall on toward Deepholm, 43 squares, out to the causeway over the
// black water); rows 3-20 of both. The 8-bit square (x, y) is the grid's (x - 36, y - 3) west of the station's east wall and (x + 40, y - 3)
// past it. 606 open squares, 497 of them to stand on (the Wet: 554 and 445). Its tiles: the station's dwarf-cut floor and the road are
// dressed stone (=; nothing burrows under them), the hall's edges cave floor; the station's walls and the hall's sealed doors are built
// stone (b); the cistern's two pools still water; the cots (y) as the 8-bit has them; the 8-bit's rubble (r), crates and tent (k, W); the
// pool on highway_4 deep water, the causeway's two squares across it. The season's stores (k) stand where the 8-bit stacks its crates
// once the drow have the station (its raid's flag tiles), cover for a fight (kept: Griz, 10-07, "keep them"). The lamp tower on the 8-bit's (68, 5), lit (js/circles.js).
// The dwarves' circle -- the big one, his zodiac wheel five across -- lies flush in the middle of the station, between its north and south
// rooms over the road (Griz, 10-07: "the one in the lamp centered between north and south rooms"), centre (31, 8): the party comes out of it
// onto the four corners of its square. Both ends of the road are open: the ways out, and where a wave comes in.
window.D16.MAPS.lampcircle = {
  name: 'Third Lamp Station',
  sub: 'the king\'s road, the dwarves\' circle in the floor',
  dark: true, // (the 8-bit map's `dark`: the halls are black; the tower is the station's light)
  step: 10, deepWater: 'D', noBurrow: '=',
  tower: [32, 2], // the lamp tower (the 8-bit's L at (68, 5))
  lights: [[32, 2, 30, 'fire']], // the tower's lamp: bright 30 ft, dim 30 more -- the station, not the halls
  chest: [33, 2], // the Game Show's supply chest at the tower's foot (Ingrith: "The chest by the lamp"; js/circles.js D.circles.chest), its front to the circle
  cots: { sheet: 'gsbed_p1' }, // the three cots (y) drawn from his cot sheet, each along the grid's x (js/circles.js), not as the crib
  circle: { at: [31, 8], sheet: 'zodiacwheel_p1', sign: 'pisces' }, // the big one, five across, in the middle of the station: between the north and south rooms, over the road (Griz, 10-07: "go ahead and use the big circle centered in the room south of the map", then "the one in the lamp centered between north and south rooms")
  rows: [
    '########################bbbbbbbbbbbbbbbb###########################################',
    '########################b==============b###########################################',
    '########################b============~~b##################################DD#######',
    '########################b============~~b################################DDDDDDDD###',
    '########################b==============b###############################DDDDDDDDDD##',
    '########################b==kk==========b##############################DDDDDDDDDDDD#',
    '#b##########b###########b==============b#########b#####k########b#####DDDDDDDDDDDDD',
    '........................================..............................DDDDDDDDDDDDD',
    '===================================================================================',
    '===================================================================================',
    '........................================..............................DDDDDDDDDDDDD',
    '######b#.########b######b===========kk=b###############k##b###########DDDDDDDDDDDD#',
    '########..##############b=====k========b##############r################DDDDDDDDDD##',
    '####........############b==========y===b################################DDDDDDD####',
    '###..........###########b==========y=y=b##################################DD#######',
    '###........k.###########b==============b###########################################',
    '####..W......###########bbbbbbbbbbbbbbbb###########################################',
    '########.##########################################################################'
  ],
  entry: [[29, 6], [33, 6], [29, 10], [33, 10], [31, 11]], // round the circle: the four corners of its square (where the storyboard lands them: tools/wheel-play.html?scene), and the south room's edge below it
  foes: [],
  wave: null
};

// The Lobstamonkee Lighthouse, the room under the light (10-07, Griz: "a map for the room under the light at the lighthouse with the big
// portal they jump into"): the stream's start -- Monster Party's monster fights, "we used to do monster party monster fight on an owlbear
// table". A round room in the tower, 13 squares across inside a wall of built stone; grey dressed stone underfoot (nothing burrows). In the
// middle the big circle, his zodiac wheel five across, flush in the floor; the party stands round it. A stair climbs the west wall to the
// light above (`heights`, one step a square, five up to the hatch); the way down is the door on the south side. Crates against the wall.
// Lit (no `dark`): the lamp burns over their heads. Invented, the seat's: the room's size, the stair, the door, the crates.
window.D16.MAPS.lighthouse = {
  name: 'The Lobstamonkee Lighthouse',
  sub: 'the room under the light',
  stone: 'grey', step: 10, noBurrow: true,
  circle: { at: [8, 8], sheet: 'zodiacwheel_p1', sign: 'pisces' },
  rows: [
    '#######bbb#######',
    '####bbbbbbbbb####',
    '###bbb=====bbb###',
    '##bb========kbb##',
    '#bb===========bb#',
    '#bb==========kbb#',
    '#b=============b#',
    'bb=============bb',
    'bb=============bb',
    'bb=============bb',
    '#b=============b#',
    '#bb===========bb#',
    '#bb===========bb#',
    '##bbk========bb##',
    '###bbb=====bbb###',
    '####bbbbdbbbb####',
    '#######b=b#######'
  ],
  heights: [
    '00000000000000000',
    '00000000000000000',
    '00000000000000000',
    '00000000000000000',
    '00000000000000000',
    '00000000000000000',
    '00500000000000000',
    '00400000000000000',
    '00300000000000000',
    '00200000000000000',
    '00100000000000000',
    '00000000000000000',
    '00000000000000000',
    '00000000000000000',
    '00000000000000000',
    '00000000000000000',
    '00000000000000000'
  ],
  entry: [[6, 6], [10, 6], [6, 10], [10, 10], [8, 11]], // round the circle
  foes: [],
  wave: null
};
