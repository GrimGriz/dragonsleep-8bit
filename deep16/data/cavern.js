/* DEEP16 — the one map: an off-highway cavern (RULED 09-26d: "let's do off highway cavern we can use somewhere").
   One square = 5 ft. Rows are gy (0 = the far, upper-right wall), columns gx (0 = the far, upper-left wall).
   Legend:  #  rock          .  raw floor        =  dressed stone (the road giving way at the neck)
            P  stalagmite    r  rubble (difficult)  ~  the still pool (difficult; the spider jaunts out of it)
            L  the ledge (two steps up)   /  the fallen slab (one step: the ramp)   c  a cocoon on the wall */
'use strict';
(window.D16 = window.D16 || {}).MAPS = (window.D16.MAPS || {});
window.D16.MAPS.cavern = {
  name: 'The Cocoon Gallery',
  sub: 'off the road, below Third Lamp',
  step: 20, // px per step of elevation (a step is ~2.5 ft; the ledge is two)
  rows: [
    '####################',
    '###c.c###LLLLLLLL###',
    '##......#/LLLLLLLL##',
    '#~~~.........P....##',
    '#~~~...............#',
    '##~~...P...........#',
    '#..........P.......#',
    '#....P.........P...#',
    '#..................#',
    '##.................#',
    '##..............rrr#',
    '###..........rrrrr##',
    '####==####rrrrr#####',
    '####==##############'
  ],
  entry: [[4, 12], [5, 12], [4, 13], [5, 13], [3, 11]],
  foes: [
    { id: 'drow1', kind: 'drow', at: [11, 2] },
    { id: 'drow2', kind: 'drow', at: [14, 1] },
    { id: 'spider', kind: 'phasespider', at: [10, 7] }
  ],
  lights: [[3, 1, 40, 'violet'], [5, 1, 40, 'violet']]
};
