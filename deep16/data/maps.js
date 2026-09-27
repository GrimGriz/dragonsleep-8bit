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
