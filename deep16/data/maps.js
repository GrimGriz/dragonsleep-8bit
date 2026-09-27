/* DEEP16 — the ladder's maps (09-27, the ladder seat): one hand-drawn map per set piece, the cavern's legend
   (data/cavern.js):  #  rock   .  raw floor   =  dressed stone   P  stalagmite   r  rubble (difficult)
                      ~  still water (difficult; a creature bound to it moves there freely)   L  the ledge (two steps up)
                      /  a fallen slab (one step: the ramp)   c  a cocoon on the wall
   Rows are gy (0 = the far, upper-right wall), columns gx (0 = the far, upper-left wall); the party walks in at the bottom.
   A map may carry `webs` (squares strung with web at the start: difficult for all but the web-walkers). */
'use strict';
(window.D16 = window.D16 || {}).MAPS = (window.D16.MAPS || {});

// Web Gulch, the strung end (the 8-bit game's `gulch`): the ravine closes into a knot of web, and on a shelf of rock
// above it the ettercap sits braiding. The slab at (6-7, 3) is the only way up.
window.D16.MAPS.gulch = {
  name: 'Web Gulch',
  sub: 'the strung end',
  step: 20,
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
  webs: [[3, 2], [3, 3], [4, 3], [12, 3], [4, 5], [13, 5], [3, 6], [4, 6], [5, 6], [10, 6], [11, 6], [12, 6], [5, 7], [6, 7], [12, 7], [13, 7], [14, 6]],
  foes: [],
  wave: null
};

// The Warrens, the deepest pool, under the fall (the 8-bit game's `wet`, warrens_d): black water with a rim of wet
// stone round it and the worked stair coming down into it. What lives in the pool will not leave the water, but its
// tentacles reach ten feet past the edge: the rim is all in its reach, the stair's lower steps are not.
window.D16.MAPS.pool = {
  name: 'The Deepest Pool',
  sub: 'the Warrens, under the fall',
  step: 20,
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
  step: 20,
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
  step: 20,
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
  step: 20,
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
  foes: [],
  wave: null
};

// Leg four of the king's road: the troll hole (the 8-bit game's S.trolls, `highway`): a cavern off the south side of the
// road, the made road's stone at its mouth, bones underfoot (rubble), and a smell like a butcher's yard in summer.
window.D16.MAPS.trollcave = {
  name: 'The Troll Hole',
  sub: 'the king\'s road, leg four',
  step: 20,
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
  step: 20,
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

// The drow's fallback line (the 8-bit game's S.fallback, leg four): a line of crates across the road with gaps in it,
// and pale heads behind it. They have had a day to get ready.
window.D16.MAPS.barricade = {
  name: 'The Fallback Line',
  sub: 'the king\'s road, leg four',
  step: 20,
  rows: [
    '####################',
    '######........######',
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
  step: 20,
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
  step: 20,
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
  step: 20,
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
  step: 20,
  rows: [
    '####################',
    '###..............###',
    '##................##',
    '#...P..........P...#',
    '#..................#',
    '#......======......#',
    '#......======......#',
    '#......======......#',
    '#..................#',
    '#...P..........P...#',
    '##................##',
    '###..............###',
    '####............####',
    '####################'
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
  step: 20,
  ground: 'earth',
  rows: [
    '####################',
    '##................##',
    '#..................#',
    '#...P........P.....#',
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

// The road south of the Halfway Inn (the 8-bit game's S.snoot, `gnoll`): open country with the road through it,
// scrub and stones (the rubble), and the Snoot's young blood across it by day.
window.D16.MAPS.snootroad = {
  name: 'The Road South',
  sub: 'south of the Halfway Inn',
  step: 20,
  ground: 'earth',
  rows: [
    '####################',
    '#####..........#####',
    '###..............###',
    '##....r......r....##',
    '#..................#',
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
  step: 20,
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
  step: 20,
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

// The open cavern south of the road (the 8-bit game's S.grickDen, leg one): stalagmites everywhere, and the dark in it
// is where things come from. The gricks start hidden among the stone.
window.D16.MAPS.grickden = {
  name: 'The Grick Den',
  sub: 'south of the king\'s road',
  step: 20,
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
  step: 20,
  rows: [
    '####################',
    '#####...rrrrr...####',
    '###....rr...rr....##',
    '##.................#',
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
  step: 20,
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

// The Halfway Inn's yard at night (the 8-bit game's wagon night): the wagon (the P block), the well, the inn door the
// four come out of, and the stable gate at the far corner where the horses are: the way out (exit).
window.D16.MAPS.yard = {
  name: 'The Inn Yard',
  sub: 'the Halfway Inn, at night',
  step: 20,
  ground: 'earth',
  rows: [
    '####################',
    '##############...###',
    '#.................##',
    '#...PPP............#',
    '#...PPP............#',
    '#..................#',
    '#.......r..........#',
    '#..................#',
    '#...........P......#',
    '#..................#',
    '##................##',
    '###....======....###',
    '####...======...####',
    '####################'
  ],
  entry: [[9, 12], [10, 12], [8, 11], [11, 11], [9, 11]],
  exit: [[14, 1], [15, 1], [16, 1]],
  exitName: 'through the stable gate with the horses',
  foes: [],
  wave: null
};

// The causeway over the black water (the 8-bit game's S.naga, leg four): the made road crosses on dressed blocks, the
// water both sides. Halfway over, the water stands up -- and what stands up keeps to it (the naga is bound to '~').
window.D16.MAPS.causeway = {
  name: 'The Causeway',
  sub: 'the king\'s road, leg four: the black water',
  step: 20,
  rows: [
    '####################',
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
  step: 20,
  rows: [
    '####################',
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
  step: 20,
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
  step: 20,
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
  step: 20,
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
  step: 20,
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
  step: 20,
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
