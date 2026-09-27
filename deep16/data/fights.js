/* DEEP16 — the fights. A fight is a map, a party level, the foes where they stand, and what the entry card says;
   a map's own foes and wave (data/cavern.js) are the default, a fight may name its own.
   The ladder (Griz, 09-27: "win this fight, level up, and we slowly fill out the bestiary"): one fight a level,
   1 to 9, the four from the 8-bit game built at that level by its own rules (R.makeHero). The fights are to be the
   8-bit game's own set pieces, built here first and slotted back into the 8-bit game later. */
'use strict';
(function () {
  var D = window.D16 = window.D16 || {};
  D.FIGHTS = [
    { id: 'gallery', level: 9, map: 'cavern', name: 'The Cocoon Gallery', sub: 'off the road, below Third Lamp',
      intro: 'Two drow on the ledge. Something in the stalagmites.', from: 'the expansion: the road below Third Lamp (the POC)' }
  ];
  D.fight = function (id) { return D.FIGHTS.filter(function (f) { return f.id === id; })[0] || D.FIGHTS[D.FIGHTS.length - 1]; };
  D.fightAt = function (level) { return D.FIGHTS.filter(function (f) { return f.level === level; })[0] || null; };
})();
