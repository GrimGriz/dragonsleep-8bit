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
   through "unworked earth and stone"). `noBurrow: true` -- the whole floor is worked stone (a dwarven hall); `noBurrow: '='` -- these
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
  step: 10,
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
  step: 10,
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
  step: 10,
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
  step: 10,
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
  step: 10,
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
// all the animations twice"): a long hall lit from the near end. One lamp on the dressed apron by the way in, bright 20 ft and dim 20 more:
// BRIGHT across the near half, DIM in a band past it, DARK at the far end and its corners, where only darkvision, the bat's sonar or the
// snake's tongue find anything. No walls between: nothing stands in front of what is being looked at. Stalagmites for scale and for the
// stone. Slate (`stone`), so a creature made of stone shows its recolour (js/show.js &stone=brown|grey for the others). Raw floor: a burrower
// digs. Not a place in the realm -- js/show.js fights a creature here: deep16/?show=grick (deep16/blender-monsters.md, step 12).
window.D16.MAPS.testground = {
  name: 'The Test Ground',
  sub: 'bright, dim, dark',
  dark: true, lights: [[9, 12, 20, 'gold']], // the lamp: bright 20 ft (to row 8), dim 20 more (to row 4); rows 1-3 dark
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
    '#..................#',
    '#...P..........P...#',
    '#..................#',
    '#..................#',
    '#.......====.......#',
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
  dark: true, // torchdark (09-28): dark ground (the 8-bit map's `dark`), no light of its own
  step: 10,
  rows: [
    '##################',
    '######=====#######',
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
  window.D16.MAPS.wet = {
    name: 'The Wet',
    sub: 'the Warrens, the settling pools',
    dark: true, // (the 8-bit map's `dark`: no lamp of its own)
    step: 10,
    deepWater: 'D~',
    rows8: R8, rows: rows, from8: from8, to8: to8,
    entry: at8([[2, 12], [2, 13], [3, 12], [3, 13], [2, 11]]),
    doors: at8([[1, 12], [1, 13]]),
    foes: [],
    wave: null
  };
})();
