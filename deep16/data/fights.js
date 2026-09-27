/* DEEP16 — the fights. A fight is a map, a party level, the foes where they stand, and what the entry card says;
   a map's own foes and wave (data/cavern.js) are the default, a fight may name its own.
   The ladder (Griz, 09-27: "win this fight, level up, and we slowly fill out the bestiary"): one fight a level,
   1 to 9, the four from the 8-bit game built at that level by its own rules (R.makeHero). The fights are to be the
   8-bit game's own set pieces, built here first and slotted back into the 8-bit game later. */
'use strict';
(function () {
  var D = window.D16 = window.D16 || {};
  D.FIGHTS = [
    // the first rungs (09-27, the Cowork seat, on Griz's "proceed with 4"): the 8-bit game's own creatures on the one map,
    // placed by hand; each names its foes and no wave. The blocks are data/foes.js; they fight by ai.js brute().
    { id: 'rats', level: 1, map: 'cavern', name: 'The Rat Cellar', sub: 'under the Shaft Rows',
      intro: 'Rats the size of dogs, and two wolves that came in after them.', from: 'the north road table (giant rats; wolves)',
      foes: [{ id: 'rat1', kind: 'giantrat', at: [8, 3] }, { id: 'rat2', kind: 'giantrat', at: [12, 3] }, { id: 'rat3', kind: 'giantrat', at: [15, 5] },
             { id: 'wolf1', kind: 'wolf', at: [5, 6] }, { id: 'wolf2', kind: 'wolf', at: [16, 8] }], wave: null },
    { id: 'crypt', level: 2, map: 'cavern', name: 'The Old Cut', sub: 'a sealed working, opened',
      intro: 'Four of the dead, on their feet, with the blades they were buried with.', from: 'the ladder\'s floor (SRD skeletons; not yet a set piece of the 8-bit game)',
      foes: [{ id: 'sk1', kind: 'skeleton', at: [7, 2] }, { id: 'sk2', kind: 'skeleton', at: [11, 3] }, { id: 'sk3', kind: 'skeleton', at: [14, 2] }, { id: 'sk4', kind: 'skeleton', at: [16, 5] }], wave: null },
    // ------------------------------------------------------------------ the 8-bit game's set pieces (09-27, the ladder seat, on Griz's word:
    // "start with boss fights from the 8-bit that don't involve water ... The otyugh fight should probably slot in there").
    // A rung may hold more than one fight: the set piece first, the bestiary's fights beside it (left/right on the ladder).
    { id: 'ettercap', level: 3, map: 'gulch', name: 'The Braiding Ettercap', sub: 'Web Gulch, the strung end', music: 'boss',
      intro: 'On a thick strand at the far end something sits braiding a cord. It stops when it sees you.',
      from: 'the 8-bit game: the Weigh-House bounty (events.js S.ettercap; ettercap + giant spider)', won: 'THE GULCH GOES QUIET.',
      foes: [{ id: 'ettercap', kind: 'ettercap', at: [7, 1] }, { id: 'gs1', kind: 'giantspider', at: [10, 3] }], wave: null },
    { id: 'landlord', level: 4, map: 'pool', name: 'The Landlord', sub: 'the Warrens, the deepest pool', music: 'boss',
      intro: 'It rises from its pool, all eye-stalk and tentacle. It will not leave the water.',
      from: 'the 8-bit game: the Warrens, FIGHT IT instead of the bucket (events.js; the otyugh)', won: 'THE POOL GOES STILL.',
      foes: [{ id: 'otyugh', kind: 'otyugh', at: [8, 4] }], wave: null },
    { id: 'gulch', level: 3, map: 'cavern', name: 'The Web', sub: 'Web Gulch, the strung end',
      intro: 'Three giant spiders, and silk from rim to rim.', from: 'Web Gulch (giant spiders)',
      foes: [{ id: 'gs1', kind: 'giantspider', at: [10, 7] }, { id: 'gs2', kind: 'giantspider', at: [13, 8] }, { id: 'gs3', kind: 'giantspider', at: [5, 5] }], wave: null },
    { id: 'trollhole', level: 5, map: 'cavern', name: 'The Troll Hole', sub: 'off the fourth leg',
      intro: 'It is already getting up again.', from: 'leg four of the highway (the troll hole)',
      foes: [{ id: 'troll1', kind: 'troll', at: [11, 4] }], wave: null },
    { id: 'gallery', level: 9, map: 'cavern', name: 'The Cocoon Gallery', sub: 'off the road, below Third Lamp',
      intro: 'Two drow on the ledge. Something in the stalagmites.', from: 'the expansion: the road below Third Lamp (the POC)',
      looks: { barley: { name: 'Denny', sheet: 'denny_p2' } } } // Denny plays Barley here only (Griz, 09-27)
  ];
  D.fight = function (id) { return D.FIGHTS.filter(function (f) { return f.id === id; })[0] || D.FIGHTS.filter(function (f) { return f.id === 'gallery'; })[0]; };
  D.fightsAt = function (level) { return D.FIGHTS.filter(function (f) { return f.level === level; }); };
  D.fightAt = function (level) { return D.fightsAt(level)[0] || null; };
})();
