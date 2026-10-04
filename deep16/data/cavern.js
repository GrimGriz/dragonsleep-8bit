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
  step: 10, // px per step of elevation (a step is ~2.5 ft; the ledge is two). 20 until 09-28: taller than a row's 16 px on screen, a raised square drew over the lower one behind it (Vivian and a thug on the siphon stair read as one square)
  climb: 2, // the ledge's 5 ft face can be climbed (10 ft of movement, no check: a body pulls itself up a 5 ft ledge) or dropped, the ramp still the free way up -- 10-04, Griz: "2 - Agreed" (handoff-2026-10-04-climbing-the-other-maps.md; the bench: no fight on it changed)
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
  // when those three are down: the cocoon at (5, 1) splits, and what was in it drops to the nearest free floor
  wave: { id: 'drider', kind: 'drider', from: [5, 1] },
  dark: true, // torchdark (09-28): off the road below Third Lamp, no lamp of its own
  lights: [[3, 1, 40, 'violet', 1], [5, 1, 40, 'violet', 1]] // the cocoons' glow: dim, 40 ft (nothing bright: a rogue can still hide in it)
};
