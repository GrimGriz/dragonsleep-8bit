/* DEEP16 -- the modules that come with the Pocket DM (10-17, Griz: "to test it can you make a 6 fight module for a starting lvl 1 party of 4 that we can include
   for new users to have as example module?"). A module is a DM's run of fights played as built (js/pocket.js PK.moduleOf reads this shape, and a module file's):
   each slot a floor (data/maps.js), its foes (data/foes.js kinds, SRD 5.1), a name and a line to open it, and what the DM allows after it -- a short rest, a
   long rest, a visit to the market (his: "DM flag when he adds each map if he allows short rest, long rest, market visit between runs of his module"; RULED
   10-17 the defaults, a short rest on, the long rest and the market off). The last slot's rest is never asked: the module ends there.
   THE WAGON ROAD (the seat's, 10-17; invented.json pocket-module-wagon-road): four at 1st level hired to see a wagon through two days -- bandits, wolves and
   hobgoblin scouts on the first, a night at the waystation with its market, then stirges, gnolls and the bugbear who has been taking the wagons. Benched
   through whole by bench16 mode=module1017 (the AI's party, the wounds carried, the rests as flagged). */
'use strict';
(window.D16 = window.D16 || {}).MODULES = [
  {
    id: 'wagonroad', name: 'THE WAGON ROAD', by: 'the Pocket DM', party: { n: 4, lvl: 1 },
    about: 'Four new hands hired to see a wagon through two days on the road. A first module: six fights, short rests between, a night at the waystation (and its market) after the third.',
    slots: [
      { name: 'Bandits on the road', map: 'snootroad', foes: ['bandit', 'bandit', 'bandit', 'bandit'],
        intro: 'Four bandits step out of the ditch and ask for the wagon. Nobody hands it over.', rest: { short: true } },
      { name: 'Wolves at the bridge', map: 'bridge', foes: ['wolf', 'wolf', 'wolf'],
        intro: 'The wolves have been following since noon. At the bridge they stop following.', rest: { short: true } },
      { name: 'The hobgoblin scouts', map: 'hexfloor', foes: ['hobgoblin', 'hobgoblin', 'goblin'],
        intro: 'Two hobgoblins and their goblin runner hold the crossing. They fight in step, and they fight well.', rest: { long: true, market: true } },
      { name: 'Stirges in the Glowseep', map: 'bog', foes: ['stirge', 'stirge', 'stirge', 'stirge', 'stirge'],
        intro: 'Morning, and the marsh road. Something small and hungry rises off the water.', rest: { short: true } },
      { name: 'Gnolls in the hills', map: 'gnollhills', foes: ['gnoll', 'gnoll', 'gnoll', 'hyena'],
        intro: 'Three gnolls, and their hyena running ahead. They smelled the wagon a mile off.', rest: { short: true } },
      { name: 'The bugbear in the pit', map: 'greyfangpit', foes: ['bugbear', 'goblin', 'goblin'],
        intro: 'The wagons that went missing went here. The bugbear who took them is waiting, and so are his goblins.' }
    ]
  }
];
