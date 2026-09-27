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
    // the expansion's (deep.js). The 8-bit game sizes them for its guests (EV.guestWeight: Pyro is worth two); the ladder
    // is the four, so each is sized hard for four by the DMG table (and says what the 8-bit game's list was)
    { id: 'cutseal', level: 5, map: 'camp', name: 'The Cut Seal', sub: 'the king\'s road, leg one', music: 'boss',
      intro: 'A warded wall, breached from the far side. Beyond it, a camp: hide tents, bones, a fire, and the smell of goblins. The camp comes up off its blankets, blades first.',
      from: 'the 8-bit game: deep.js S.cutSeal (as for four at 5; the king adds a bugbear and a worg)', won: 'THE CAMP IS BROKEN.',
      foes: [{ id: 'chief', kind: 'bugbearchief', at: [9, 3] }, { id: 'sgt', kind: 'hobsergeant', at: [12, 4] },
             { id: 'hob1', kind: 'hobgoblin', at: [6, 6] }, { id: 'hob2', kind: 'hobgoblin', at: [9, 7] }, { id: 'hob3', kind: 'hobgoblin', at: [13, 7] },
             { id: 'worg', kind: 'worg', at: [15, 5] }], wave: null },
    { id: 'pinned', level: 6, map: 'cut', name: 'Pinned', sub: 'the north cut', music: 'boss',
      intro: 'A neck of rock at the back, walled with crates and packs. The rock beside the crates ripples like water. A leg comes out of it. Then the rest.',
      from: 'the 8-bit game: deep.js S.pinned (five phase spiders against the party, the king, Halldor and two troopers; three for the four)', won: 'THE WALLS ARE ONLY WALLS.',
      foes: [{ id: 'ps1', kind: 'phasespider', at: [3, 6], ethereal: true }, { id: 'ps2', kind: 'phasespider', at: [12, 4], ethereal: true },
             { id: 'ps3', kind: 'phasespider', at: [12, 9], ethereal: true }], wave: null },
    { id: 'brood', level: 7, map: 'nest', name: 'The Brood', sub: 'the nest', music: 'boss',
      intro: 'A chamber hung with cocoons, and in the middle of it something the size of a cart, the same bruise-colour as the rest, but more. She turns all her eyes on you at once.',
      from: 'the 8-bit game: deep.js S.brood (the broodmother and four phase spiders, with Halldor and four troopers; one for the four)', won: 'THE BROODMOTHER IS DEAD.',
      foes: [{ id: 'brood', kind: 'broodmother', at: [8, 4] }, { id: 'ps1', kind: 'phasespider', at: [3, 3], ethereal: true }], wave: null },
    { id: 'trolls', level: 8, map: 'trollcave', name: 'Two Trolls', sub: 'the troll hole, the king\'s road\'s leg four', music: 'boss',
      intro: 'A cavern off the south side of the road, and a smell in it like a butcher\'s yard in summer. Big grey-green shapes, a lot of arms.',
      from: 'the 8-bit game: deep.js S.trolls (two trolls). Fire or acid stops the knitting', won: 'SOMEBODY SHOULD BURN THEM.',
      foes: [{ id: 'troll1', kind: 'troll', at: [6, 2] }, { id: 'troll2', kind: 'troll', at: [13, 5] }], wave: null },
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
