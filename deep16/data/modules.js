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
        intro: 'The wagons that went missing went here. The bugbear who took them waits with his goblins.' } // (shortened 11-25: the entry card's one line ran 3 px past the screen)
    ]
  },
  // THE FARE HOME (2026-11-25, the seat module-1125 -- RULED, Griz: "how bout a Pocket DM module based on all the new stuff added this week?", then "good on the leans, build
  // module", on the seat's list of nine; invented.json pocket-module-the-fare-home). The week's new things, each fight laid by the DM's runes (js/runes.js: a unit's squares, its
  // posture, its facing) so what it shows comes about: the Dominion's patrol a squad at a time (the draggers' nets and hooks and Wagon Drill, the Ledger's three Drillyard
  // plays, a lady by her patron and her mender), the garrison's wall (set shields, set pikes, the crossbows that hold and shoot, the wall that re-forms to its foes), his own
  // BUGBEAR AMBUSH (seen coming or not), and Engulf by the SRD (the gelatinous cube, the shambling mound). Named for his patrol page, The Fare Home. Four at 3rd, three days:
  // short rests in a day, a long rest and the market at the end of the first two, a long rest before the mound. PATROL on a lit road is a unit that sees the party at once
  // and hunts (js/postures.js); DEFEND keeps a lady and her mender by their spot; AMBUSH hides. Benched through whole by bench16 mode=fare1125, each fight's beat read off its lines
  {
    id: 'farehome', name: 'THE FARE HOME', by: 'the Pocket DM', party: { n: 4, lvl: 3 },
    about: 'Three days on the roads the Dominion patrols: its squads a sergeant at a time, three wagons and their ladies, the garrison\'s shield wall, a bugbear ambush, and two things in the dark that swallow whole. Nine fights for four at 3rd.',
    slots: [
      { name: 'The Blade\'s squad', map: 'dominionroad', foes: ['sergeantblade', 'dominion', 'dominion', 'dragger', 'dragger'],
        intro: 'A Dominion patrol across the road: two shields, the Blade, two draggers out wide.',
        runes: [{ foes: ['sergeantblade', 'dominion', 'dominion'], at: [9, 6], post: 'patrol', to: [9, 4], sq: [[8, 6], [9, 6], [10, 6]], fw: [0, 1] },
                { foes: ['dragger', 'dragger'], at: [6, 9], post: 'patrol', to: [6, 7], sq: [[6, 9], [13, 9]], fw: [0, 1] }], // (the draggers wide of the line: "the other two circle wide for the next drop", his page -- within a net's 15 ft of the party's flanks; behind the shields they ready the pike and rarely net)
        rest: { short: true } },
      { name: 'The Ledger\'s squad', map: 'snootroad', foes: ['sergeantledger', 'dominion', 'dominion', 'dragger', 'dragger'],
        intro: 'The Ledger\'s squad. His book: take the legs, put the fear in, strike back.',
        runes: [{ foes: ['sergeantledger', 'dominion', 'dominion'], at: [10, 6], post: 'patrol', to: [10, 4], sq: [[11, 6], [9, 6], [10, 6]], fw: [0, 1] },
                { foes: ['dragger', 'dragger'], at: [13, 9], post: 'patrol', to: [13, 7], sq: [[13, 9], [6, 9]], fw: [0, 1] }], // (his draggers wide too, as the Blade's)
        rest: { short: true } },
      { name: 'Savine\'s wagon', map: 'dominionroad', foes: ['patrolladyfiend'],
        intro: 'The patrol\'s wagon, its cell empty, and Savine\'s lady: her patron is the Fiend.',
        // (the lady alone, RULED 11-26, Griz: "1 - leans": with her mender, a party worn by the two squads lost this fight twenty times running on the bench -- her Fireball and a
        // 3rd-level Hellish Rebuke in round one; the mender rides with the other two ladies, fights 6 and 7)
        runes: [{ foes: ['patrolladyfiend'], at: [9, 2], post: 'defend', to: [9, 2], r: 20, fw: [0, 1] }],
        rest: { long: true, market: true } },
      { name: 'The garrison\'s wall', map: 'burial', foes: ['trooper', 'trooper', 'trooper', 'trooperpike', 'trooperpike', 'trooperxbow', 'trooperxbow', 'fileleader'],
        intro: 'The night shift: shields for a wall, pikes behind it, crossbows at the door.',
        // (the crossbows and the file leader behind the wall, at the hold's door: the party's blades go round its flank for them, and the wall turns to face them)
        runes: [{ foes: ['trooper', 'trooper', 'trooper', 'trooperpike', 'trooperpike'], at: [9, 6], post: 'patrol', to: [9, 4], sq: [[8, 6], [9, 6], [10, 6], [8, 5], [10, 5]], fw: [0, 1] },
                { foes: ['trooperxbow', 'trooperxbow', 'fileleader'], at: [9, 2], post: 'stand', sq: [[8, 2], [11, 2], [9, 3]], fw: [0, 1] }],
        rest: { short: true } },
      { name: 'The bugbear ambush', map: 'breach', foes: ['bugbearchief', 'bugbear'],
        intro: 'The breach in the dark, and two in it you will not see unless you look.',
        // (his own BUGBEAR AMBUSH's fight 1, the chief and three; for four at 3rd the chief and one -- the seat's "one fewer if the bench says so": with two, 7 of 12 tries lost; RULED 11-26, "1 - leans")
        runes: [{ foes: ['bugbearchief', 'bugbear'], at: [6, 9], post: 'ambush' }],
        rest: { long: true, market: true } },
      { name: 'The Old One\'s wagon', map: 'northroad', foes: ['patrolladymirror', 'mender'],
        intro: 'The north road by night: the Old One\'s lady, her patron the Mirror, her mender.',
        runes: [{ foes: ['patrolladymirror', 'mender'], at: [9, 3], post: 'defend', to: [9, 3], r: 20, sq: [[9, 3], [10, 3]], fw: [0, 1] }],
        rest: { short: true } },
      { name: 'Tronu\'s wagon', map: 'pithills', foes: ['patrolladyfae', 'mender'],
        intro: 'Tronu\'s wagon, off to build a garrison. Its lady keeps the Fae King\'s pact.',
        runes: [{ foes: ['patrolladyfae', 'mender'], at: [9, 3], post: 'defend', to: [9, 3], r: 20, sq: [[9, 3], [10, 3]], fw: [0, 1] }],
        rest: { short: true } },
      { name: 'The Drain Cut', map: 'drain', foes: ['cube', 'mouther'],
        intro: 'You see it only by what hangs in it: bones, a boot, a lantern. Mouths behind.',
        runes: [{ foes: ['cube'], at: [6, 3], post: 'ambush' }, { foes: ['mouther'], at: [10, 6], post: 'patrol', to: [10, 4] }],
        rest: { long: true } },
      { name: 'The Glowseep', map: 'bog', foes: ['shamblingmound'],
        intro: 'A heap of the Glowseep gets up and walks. Whatever it folds in, it carries.',
        runes: [{ foes: ['shamblingmound'], at: [8, 7], post: 'ambush' }] } // (lying in the bog on the party's way: its first two slams from hiding, the pair that engulfs)
    ]
  },
  // THE FEAST (2026-11-26, the Thanksgiving seat -- Griz: "if it's cheaper, just build a 3-wave of various lackies followed by the turkey fight"): the Lobstamonkees' Thanksgiving
  // special on the Harvest Bowl (data/maps.js harvestbowl), the art desk's three (data/foes.js, js/feast.js). Three waves of the feast's lackeys back to back -- the pantry's cans,
  // the ovens' Jacket Bruiser, second helpings -- then a long rest, and the Gallows Gobbler with a Jacket Bruiser and two cans (his "potato and a long rest", the same day). Four at 5th: the whole feast at once (the turkey, a bruiser and three
  // cans) fell to the four Lobstamonkees at 5th in 7 and 10 rounds on the bench (mode=feast1126). THE SEAT'S CALLS, his to overrule: the waves and their foes, no rest between
  // the three, the 5th level; the names and lines are drafts (invented.json pocket-module-the-feast)
  {
    id: 'feast', name: 'THE FEAST', by: 'the Pocket DM', party: { n: 4, lvl: 5 },
    about: 'The Lobstamonkees\' Thanksgiving special in the Harvest Bowl: three waves of the feast\'s lackeys back to back, a night\'s rest, then the Gallows Gobbler and a last potato. Four fights for four at 5th.',
    slots: [
      { name: 'Wave one: the pantry', map: 'harvestbowl', foes: ['cranberrycan', 'cranberrycan', 'cranberrycan', 'cranberrycan'],
        intro: 'The pantry door bangs open. Four cans of cranberry sauce waddle out.', rest: { short: false } },
      { name: 'Wave two: the ovens', map: 'harvestbowl', foes: ['jacketbruiser', 'cranberrycan', 'cranberrycan'],
        intro: 'The ovens open. Something baked climbs out, and it wants a hug.', rest: { short: false } },
      { name: 'Wave three: second helpings', map: 'harvestbowl', foes: ['jacketbruiser', 'cranberrycan', 'cranberrycan', 'cranberrycan', 'cranberrycan'],
        intro: 'Second helpings. Nobody asked for second helpings.', rest: { long: true } }, // (a long rest before the turkey, and a potato with it -- Griz, 11-26: "yeah, potato and a long rest - especially with novice players i figure they'll burn everything before the boss fight")
      { name: 'The Gallows Gobbler', map: 'harvestbowl', foes: ['gallowsgobbler', 'jacketbruiser', 'cranberrycan', 'cranberrycan'],
        intro: 'The gallows creak. This year\'s bird was never pardoned, and the ovens open one last time.' }
    ]
  }
];
