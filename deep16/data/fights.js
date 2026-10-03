/* DEEP16 — the fights. A fight is a map, a party level, the foes where they stand, and what the entry card says;
   a map's own foes and wave (data/cavern.js) are the default, a fight may name its own.
   The ladder (Griz, 09-27: "win this fight, level up, and we slowly fill out the bestiary"): one fight a level,
   1 to 9, the four from the 8-bit game built at that level by its own rules (R.makeHero). The fights are to be the
   8-bit game's own set pieces, built here first and slotted back into the 8-bit game later. */
'use strict';
(function () {
  var D = window.D16 = window.D16 || {};
  // the wagon's team (the inn yard; Griz 09-27: "add horses to the wagon"): hitched in front of the wagon, which faces +gx,
  // under the rail; a bay and a grey, each two squares nose to tail. Scenery: they hold their squares and startle when the run begins
  var TEAM = [{ at: [8, 3], sheet: 'horse_p1', facing: 7, foot: [2, 1], blocks: true, team: true },
              { at: [8, 4], sheet: 'horsegrey_p1', facing: 7, foot: [2, 1], blocks: true, team: true }];
  D.FIGHTS = [
    // the first rungs (09-27, the Cowork seat, on Griz's "proceed with 4"): the 8-bit game's own creatures on the one map,
    // placed by hand; each names its foes and no wave. The blocks are data/foes.js; they fight by ai.js brute().
    { id: 'rats', bestiary: true, level: 1, map: 'cavern', name: 'The Rat Cellar', sub: 'under the Shaft Rows',
      intro: 'Rats the size of dogs, and two wolves that came in after them.', from: 'the north road table (giant rats; wolves)',
      foes: [{ id: 'rat1', kind: 'giantrat', at: [8, 3] }, { id: 'rat2', kind: 'giantrat', at: [12, 3] }, { id: 'rat3', kind: 'giantrat', at: [15, 5] },
             { id: 'wolf1', kind: 'wolf', at: [5, 6] }, { id: 'wolf2', kind: 'wolf', at: [16, 8] }], wave: null },
    { id: 'crypt', bestiary: true, level: 2, map: 'cavern', name: 'The Old Cut', sub: 'a sealed working, opened',
      intro: 'Four of the dead, on their feet, with the blades they were buried with.', from: 'the ladder\'s floor (SRD skeletons; not yet a set piece of the 8-bit game)',
      foes: [{ id: 'sk1', kind: 'skeleton', at: [7, 2] }, { id: 'sk2', kind: 'skeleton', at: [11, 3] }, { id: 'sk3', kind: 'skeleton', at: [14, 2] }, { id: 'sk4', kind: 'skeleton', at: [16, 5] }], wave: null },
    // ------------------------------------------------------------------ the 8-bit game's set pieces (09-27, the ladder seat, on Griz's word:
    // "start with boss fights from the 8-bit that don't involve water ... The otyugh fight should probably slot in there").
    // A rung may hold more than one fight: the set piece first, the bestiary's fights beside it (left/right on the ladder).
    { id: 'ettercap', level: 3, map: 'gulch', name: 'The Braiding Ettercap', sub: 'Web Gulch, the strung end', music: 'boss',
      intro: 'On a thick strand at the far end something sits braiding a cord. It stops when it sees you.',
      from: 'the 8-bit game: the Weigh-House bounty (events.js S.ettercap; ettercap + giant spider + two wolf spiders)', won: 'THE GULCH GOES QUIET.',
      // half again (10-03, Griz: "I think we should up the CR by a 1/2 for the early fights"; the overseer's call, x1.5 the adjusted XP): two
      // wolf spiders (ws1, ws2), the gulch's own (content/encounters.json gulch: wolf spiders 2-3, a giant spider with 1-2 of them), on the snared
      // lad's squares. For four at 3: 975 HARD before, 1500 HARD after (x1.54). invented.json#early-fights-half-again
      foes: [{ id: 'ettercap', kind: 'ettercap', at: [7, 1] }, { id: 'gs1', kind: 'giantspider', at: [10, 3] },
             { id: 'ws1', kind: 'wolfspider', at: [4, 5] }, { id: 'ws2', kind: 'wolfspider', at: [13, 6] }], wave: null },
    { id: 'landlord', level: 4, map: 'pool', name: 'The Landlord', sub: 'the Warrens, the deepest pool', music: 'boss',
      intro: 'It rises from its pool, all eye-stalk and tentacle. It will not leave the water.',
      from: 'the 8-bit game: the Warrens, FIGHT IT instead of the bucket (events.js; the otyugh)', won: 'THE POOL GOES STILL.',
      foes: [{ id: 'otyugh', kind: 'otyugh', at: [8, 4] }], wave: null },
    // THE SETTLING (RULED 09-30; deep16/js/wet.js): the wet as one grid -- the landlord, the three pools, the ooze and the jelly,
    // and the herd. The 8-bit trigger that fired first puts the lead on its own square (embed.at) and wakes its creature
    // (embed.wake); the rest sleep till their squares are stepped on (`triggers`), and the landlord till it is hurt or someone
    // stands at the edge of its water more than three rounds (RULED 09-30b: "the 3 rounds just the edge of his water"). One down,
    // and the crawlers come out of the pens (`pens`). One of the party off the edge takes them all back up to the 8-bit map
    // (oneLeavesAll). What is dead stays dead (the flags, through the seam). Every square here is the 8-bit map's: the grid is
    // turned (data/maps.js wet from8), and deep16/js/wet.js turns these with it
    { id: 'wet', story: true, map: 'wet', name: 'The Wet', sub: 'the Warrens, the settling pools', music: 'boss', settling: true, oneLeavesAll: true,
      noCards: true, // (RULED 09-30c: "This should stay off the ladder, and probably not have start or end cards (no press e, just go)" -- no level: off the ladder)
      intro: 'Black water under the fall; the pools settling in the dark.',
      from: 'the 8-bit game: the Warrens, the wet (events.js S.jelly, S.poolOoze, S.landlord; js/wet.js)', won: 'THE WET GOES QUIET.', lost: 'THE HERD TAKES THEM.',
      foes: [{ id: 'otyugh', kind: 'otyugh', at: [7, 3], wet: 'landlord' }, { id: 'jelly', kind: 'ochrejelly', at: [22, 12], wet: 'jelly' },
             { id: 'poolooze', kind: 'grayooze', at: [29, 13], wet: 'poolooze' }],
      // the 8-bit's trigger spots (RULED 09-30c, Griz: "where lymen and barley are (north and south shores of jelly pool) should be jelly
      // trigger spots, both go dead when jelly dies ... Where Aurdin is grey ooze pool trigger spot ... and dies when the ooze does. Anything
      // exit row and south stays 8bit"): the jelly's on both shores of its pool, the pool ooze's at its puddle. On the grid a sleeper wakes
      // from the 3 x 3 round any of its spots (09-30b: "the center of a 9-tile square ... that will add the untriggered slime/ooze to the
      // fight"); the picture's four squares at the landlord's rim
      spots: { jelly: [[21, 14], [22, 14], [23, 14], [24, 14], [22, 9]], poolooze: [[29, 13]] }, picture: [[7, 8], [8, 8], [9, 8], [10, 8]],
      // the herd comes in over the south edge, out of the dark (RULED 09-30c: "the fallen attracted crawlers should come in from the southern
      // edge, 1 west of aurdin's e-w coordinate, and 5 squares east of 'crawlerspawn1'"): just past the edge, off the grid
      bucket: [13, 5], entrances: [[28, 19], [33, 19]], wave: null },
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
    { id: 'rescue', level: 2, map: 'roost', name: 'The Rescue', sub: 'the dens, under the roost', roost: true,
      intro: 'Down the side gallery a drive has gone wrong: a driver pinned in the dark, and the giant bats have turned. No fire under the roost. Blades and nerve.',
      from: 'the 8-bit game: events.js S.rescue (the cull; four giant bats). The roost\'s one law: fire and thunder are greyed', won: 'THE DRIVER COMES UP ALIVE.',
      foes: [{ id: 'bat1', kind: 'giantbat', at: [5, 1] }, { id: 'bat2', kind: 'giantbat', at: [11, 1] }, { id: 'bat3', kind: 'giantbat', at: [2, 5] }, { id: 'bat4', kind: 'giantbat', at: [13, 5] }], wave: null },
    { id: 'drain', level: 6, map: 'drain', name: 'The Drain Cut', sub: 'under the station', music: 'boss',
      intro: 'Something black lies across the floor down there, glossy and still. Two somethings. (Blades and lightning split them.)',
      from: 'the 8-bit game: deep.js S.drainCut (two black puddings)', won: 'THE DRAIN CUT IS CLEAR.',
      foes: [{ id: 'pud1', kind: 'pudding', at: [6, 3] }, { id: 'pud2', kind: 'pudding', at: [9, 6] }], wave: null },
    { id: 'fallback', level: 7, map: 'barricade', name: 'The Fallback Line', sub: 'the king\'s road, leg four', music: 'boss',
      intro: 'A line of crates across the road, and pale heads behind it: the ones who fell back from Third Lamp. Crossbows over the crates, and a captain\'s voice.',
      from: 'the 8-bit game: deep.js S.fallback (a blade-captain and four drow; hard for four at 7)', won: 'THE LINE BREAKS.',
      foes: [{ id: 'capt', kind: 'drow', at: [9, 3] }, { id: 'd1', kind: 'drowling', at: [4, 4] }, { id: 'd2', kind: 'drowling', at: [7, 4] },
             { id: 'd3', kind: 'drowling', at: [12, 4] }, { id: 'd4', kind: 'drowling', at: [15, 4] }], wave: null },
    { id: 'raid', level: 8, map: 'lamp', name: 'The Raid on Third Lamp', sub: 'the king\'s road: the station, taken', music: 'boss',
      intro: 'Third Lamp. Dark. Shapes moving in the station, pale-haired and quiet, and the garrison\'s crates pulled into a barricade. Steel in the dark, and a voice already weaving.',
      from: 'the 8-bit game: deep.js S.raid (a blade-captain, the spell-weaver and six drow, against the party with Brann and Hedda; two drow for the four)', won: 'THIRD LAMP IS LIT AGAIN.',
      foes: [{ id: 'weaver', kind: 'spellweaver', at: [9, 1] }, { id: 'capt', kind: 'drow', at: [11, 3] },
             { id: 'd1', kind: 'drowling', at: [4, 5] }, { id: 'd2', kind: 'drowling', at: [15, 5] }], wave: null },
    { id: 'giant', level: 8, map: 'giantcamp', name: 'The Giant\'s Camp', sub: 'the king\'s road, leg three', music: 'boss',
      intro: 'A camp in a cut off the road: duergar, grey and quiet, and behind them, sitting against the wall as if it were part of it, a giant made of the same stone.',
      from: 'the 8-bit game: deep.js S.giant (a stone giant and three duergar)', won: 'IT GOES DOWN LIKE A WALL.',
      foes: [{ id: 'giant', kind: 'stonegiant', at: [8, 1] }, { id: 'dg1', kind: 'duergar', at: [5, 5] }, { id: 'dg2', kind: 'duergar', at: [11, 5] }, { id: 'dg3', kind: 'duergar', at: [14, 4] }], wave: null },
    { id: 'stair', level: 2, map: 'siphon', name: 'Holding the Stair', sub: 'the Warrens, the siphon', music: 'boss',
      intro: 'The siphon runs backward, and the night crews come down the daytime way to stop it. You have the top of the stair.',
      from: 'the 8-bit game: deep.js S.holdStair (a crew boss, two thugs, two of the night crew; the 8-bit game\'s easy fight at 6, hard for four at 2)', won: 'THE STAIR HOLDS.',
      foes: [{ id: 'boss', kind: 'crewboss', at: [9, 2] }, { id: 'th1', kind: 'thug', at: [6, 3] }, { id: 'th2', kind: 'thug', at: [13, 3] },
             { id: 'nc1', kind: 'robber', at: [4, 5] }, { id: 'nc2', kind: 'robber', at: [15, 5] }], wave: null },
    { id: 'snoot', level: 3, map: 'snootroad', name: 'The Glory-Seekers', sub: 'the road south, by day', music: 'boss',
      intro: 'Gnolls on the road: glory-seekers of the Snoot, young blood come north to prove themselves where somebody can see it. The challenge, by day.',
      from: 'the 8-bit game: events.js S.snoot (a glory-seeker, three gnolls, three hyenas)', won: 'THE LAST OF THEM RUNS SOUTH.',
      // half again (10-03, Griz: "I think we should up the CR by a 1/2 for the early fights"; the overseer's call, x1.5 the adjusted XP): a third
      // gnoll (gn3) and a third hyena (hy3), more of the pack's own kind (content/encounters.json snoot: gnolls 2-3, hyenas 3-4). For four at 3:
      // 840 MEDIUM before, 1325 HARD after (x1.58). invented.json#early-fights-half-again
      foes: [{ id: 'gs', kind: 'gloryseeker', at: [9, 2] }, { id: 'gn1', kind: 'gnoll', at: [6, 3] }, { id: 'gn2', kind: 'gnoll', at: [13, 4] }, { id: 'gn3', kind: 'gnoll', at: [11, 3] },
             { id: 'hy1', kind: 'hyena', at: [4, 5] }, { id: 'hy2', kind: 'hyena', at: [15, 5] }, { id: 'hy3', kind: 'hyena', at: [7, 6] }], wave: null },
    { id: 'line', level: 4, map: 'bridge', name: 'The Line', sub: 'the bridge into the camp',
      intro: 'Six men in a line across the bridge: the Captain\'s stable, hired by the House to hold the camp. One gold a man a day. They are here for you.',
      from: 'the 8-bit game: events.js enter:warrens_a (five guards and their sergeant; hard for four at 4)', won: 'THE LINE BREAKS.',
      foes: [{ id: 'g1', kind: 'guard', at: [8, 5] }, { id: 'g2', kind: 'guard', at: [9, 5] }, { id: 'g3', kind: 'guard', at: [10, 5] }, { id: 'g4', kind: 'guard', at: [11, 5] },
             { id: 'g5', kind: 'guard', at: [9, 4] }, { id: 'sgt', kind: 'veteran', at: [10, 3] }], wave: null },
    { id: 'crew', level: 4, map: 'burial', name: 'The Night Crew', sub: 'the Burial, The One Law', music: 'boss',
      intro: 'Hask hefts the pry-bar. The wheelwright hangs back by the lamp. (He runs for the stair when Hask falls.)',
      from: 'the 8-bit game: deep.js, The One Law\'s FIGHT (Hask, the wheelwright, two crewmen; the 8-bit game fights it at 5-6, hard for four at 4)', won: 'THE CREW IS DOWN.',
      foes: [{ id: 'hask', kind: 'hask', at: [9, 5] }, { id: 'ww', kind: 'wheelwright', at: [10, 2] }, { id: 'cm1', kind: 'crewman', at: [6, 6] }, { id: 'cm2', kind: 'crewman', at: [13, 6] }], wave: null },
    { id: 'snared', level: 2, map: 'gulch', name: 'The Snared Lad', sub: 'Web Gulch', music: 'boss',
      intro: 'A shape wrapped tight in silk hangs in the strands. It moves. Something else moves toward it.',
      from: 'the 8-bit game: events.js, the snared lad (two wolf spiders and a giant spider)', won: 'YOU CUT THE TRAVELER DOWN.',
      foes: [{ id: 'ws1', kind: 'wolfspider', at: [4, 5] }, { id: 'ws2', kind: 'wolfspider', at: [13, 6] }, { id: 'gs1', kind: 'giantspider', at: [10, 3] }], wave: null },
    // the ladder's wagon yard (Griz, 09-27: "willem escaping (or both) shouldn't result in ladder fall - we need the escape for the
    // 8-bit, can we add a pair of soldiers and have them not escape for the ladder?"): two hired swords ride guard, and nobody runs
    // (noFlee). The 8-bit game's own fight keeps the escape and the chase. DEADLY for four at 4 by the table (the four have max HP).
    // 09-27 (Griz): the two are Dominion line soldiers in black half plate (foes.js dominion), on the ladder only, stock and climb;
    // Willem at the team's flank fumbles the traces till a blow lands, then turns and fights (nobody runs here)
    { id: 'wagon', level: 4, map: 'yard', name: 'The Wagon Yard', sub: 'the Halfway Inn, at night', music: 'boss', noFlee: true,
      intro: 'Two Dominion soldiers in black half plate step out. Willem goes for the team.',
      from: 'the 8-bit game: events.js S.wagonFight (Amara and Willem; there, they run on foot and a chase follows). The two soldiers are the ladder\'s own (the Dominion patrol\'s line soldiers), not the 8-bit game\'s', won: 'THE GLAMOUR IS BROKEN.',
      foes: [{ id: 'amara', kind: 'amara', at: [9, 6] }, { id: 'willem', kind: 'willem', at: [8, 5], traces: true }, { id: 'ds1', kind: 'dominion', at: [10, 7] }, { id: 'ds2', kind: 'dominion', at: [9, 9] }], wave: null,
      // in the wagon's bed, the cargo: goblins to the eye until the glamour breaks, then children (Griz, 09-27: "we need NPC goblin
      // or children in that wagon"; the 8-bit game's W.goblin, look kid once glamourBroken)
      riders: [{ at: [4, 3], sheet: 'goblin_p1', after: 'kid1_p0', gz: 12 }, { at: [4, 4], sheet: 'goblin_p1', after: 'kid2_p0', gz: 12 }].concat(TEAM) },
    // the 8-bit game's own wagon yard (events.js S.wagonFight fights it here, js/embed.js; not on the ladder: no level). Griz,
    // 09-27: "add horses to the wagon ... have willem try to unhook them for the first part of the fight (until he takes damage)
    // - then amara and willem will try to make the escape on foot - either succeeding switches to chase 1 fight 2". Willem at
    // the team's flank (`traces`: ai.js), Amara between him and the inn; the first blow on him and both run (runWhenHurt), and
    // either one on the road ends it (fledEnds: the 8-bit battle's 'fled', S.wagonChase). The glamour is already seen through
    // (the fight only comes to it once it is): the children in the bed are children
    { id: 'wagonnight', story: true, map: 'yard', name: 'The Wagon Yard', sub: 'the Halfway Inn, at night', music: 'boss', runWhenHurt: 'willem', fledEnds: true,
      intro: 'Steel comes out. Willem goes for the team; Amara stands between him and you.',
      from: 'the 8-bit game: events.js S.wagonFight', won: 'THE YARD IS QUIET.', escaped: 'THEY ARE AWAY UP THE ROAD.',
      foes: [{ id: 'amara', kind: 'amara', at: [10, 6] }, { id: 'willem', kind: 'willem', at: [8, 5], traces: true }], wave: null,
      riders: [{ at: [4, 3], sheet: 'kid1_p0', gz: 12 }, { at: [4, 4], sheet: 'kid2_p0', gz: 12 }].concat(TEAM) },
    // the chase's road fights (events.js S.wagonChase: caught1, then caught2). The first: run down on the road, they run again from
    // the first turn (Amara's Darkness, Willem's images, a full stride north), and either one over the far edge is the 8-bit's
    // 'fled' -- the chase on the map, then the second. The second: nowhere left to run (noFlee), to the end. js/embed.js passes
    // `only` (who is still out there), so one of them alone fights alone
    { id: 'roadcatch1', story: true, map: 'northroad', name: 'The Road North', sub: 'past the gulch, at night', music: 'boss', fledEnds: true,
      intro: 'You run them down where the road climbs. They turn, and then they run again.',
      from: 'the 8-bit game: events.js S.wagonChase (caught1)', won: 'IT IS OVER ON THE ROAD.', escaped: 'THEY ARE AWAY AGAIN, NORTH.',
      foes: [{ id: 'amara', kind: 'amara', at: [9, 8] }, { id: 'willem', kind: 'willem', at: [11, 8] }], wave: null },
    { id: 'roadcatch2', story: true, map: 'northroad', name: 'The Road North', sub: 'the last of the road, at night', music: 'boss', noFlee: true,
      intro: 'You catch them at last. There is nowhere left to run, and they know it.',
      from: 'the 8-bit game: events.js S.wagonChase (caught2)', won: 'IT IS OVER ON THE ROAD.',
      foes: [{ id: 'amara', kind: 'amara', at: [9, 7] }, { id: 'willem', kind: 'willem', at: [11, 7] }], wave: null },
    // the cleric at Deepholm's door (deep.js EV.torvald, HOLD HIM; Griz 09-28: "given the weight of the scene ... redo it in 16"):
    // a story fight (no level: off the ladder). He yields at half his hit points (foes.js torvald `yields`): the fight ends
    // 'yielded', his own words on the card (the 8-bit's yieldText), and the 8-bit game asks what you do with him
    { id: 'torvald', story: true, map: 'threshold', name: 'He Will Not Be Held', sub: 'Deepholm\'s door, the made road\'s end', music: 'boss',
      intro: 'A dwarf in a cleric\'s coat, a pack on his back and somewhere to be, and you fill the road. He will not be held. (He yields when he is beaten.)',
      from: 'the 8-bit game: deep.js EV.torvald, HOLD HIM (the dwarf cleric; he yields at half)', won: 'THE CLERIC IS DEAD ON THE MADE ROAD.', yielded: 'HE IS ON HIS KNEES, HIS HANDS OPEN.',
      foes: [{ id: 'torvald', kind: 'torvald', at: [10, 9] }], wave: null },
    { id: 'gricks', level: 5, map: 'grickden', name: 'The Grick Den', sub: 'south of the king\'s road, leg one', music: 'boss',
      intro: 'Something moves in the open cavern south of the road, low and fast, and then there are more of them than there were rocks. (Plain steel does half; magic does not care.)',
      from: 'the 8-bit game: deep.js S.grickDen (three gricks; five with the king)', won: 'THE DARK IS ONLY DARK AGAIN.',
      foes: [{ id: 'gr1', kind: 'grick', at: [6, 2], hidden: true }, { id: 'gr2', kind: 'grick', at: [12, 3], hidden: true }, { id: 'gr3', kind: 'grick', at: [4, 5], hidden: true }], wave: null },
    { id: 'bulette', level: 5, map: 'breach', name: 'The Breach', sub: 'the king\'s road, leg two', music: 'boss',
      intro: 'The road bucks. Out of a breach in the south wall, rough-cut and new, something armored comes up through the stone like a fin through water.',
      from: 'the 8-bit game: deep.js S.bulette (one bulette; two with the king)', won: 'THERE IS NO RUNE FOR A HOLE A BEAST DUG.',
      foes: [{ id: 'bul', kind: 'bulette', at: [9, 1], under: true }], wave: null }, // (under: it starts beneath the road and comes up through it, 10-01d)
    // the gimmick's home (Griz, 09-28: "the first 16-bit fight with a cloaker in which Aurdin magic-missiles a cloaker ... a quick cutscene
    // close-up of Aurdin and then that mp3, then a close up of the cloaker showing it hit, then big close up cloaker face"): the first
    // Magic Missile thrown at the darkness here is the cutscene (magic.js darts, ui.js scene), and the cloaker comes for the caster
    { id: 'cloaker', level: 6, map: 'deep', name: 'The Cloaker', sub: 'the deep gallery', music: 'boss', gimmick: 'darkness',
      intro: 'Something hangs from the roof like a cloak somebody left behind. Then it opens. (It is dark down here, and it hates the light.)',
      from: 'the 8-bit game: events.js, the tail bounty (the cloaker; the 8-bit game fights it at 4-5, hard for four at 6)', won: 'PROOF FOR HESSLE\'S SCALES.',
      foes: [{ id: 'clk', kind: 'cloaker', at: [12, 4] }], wave: null },
    { id: 'settling', level: 3, map: 'settling', name: 'The Settling Pools', sub: 'the Warrens, the lower works',
      intro: 'The second settling pool heaves. Something the colour of old mustard slides up out of it -- and the wet stone moves. (Blades and lightning split the jelly.)',
      from: 'the 8-bit game: events.js, warrens_d (the ochre jelly and the gray ooze, each a step trigger there; together here)', won: 'THE POOLS ARE STILL.',
      foes: [{ id: 'jelly', kind: 'ochrejelly', at: [13, 3] }, { id: 'ooze', kind: 'grayooze', at: [4, 6] }], wave: null },
    { id: 'roper', level: 6, map: 'roperfork', name: 'The Fork', sub: 'the king\'s road, leg two', music: 'boss',
      intro: 'A cavern of stalagmites where the road forks. One of them is not a stalagmite. (It and what hangs above start hidden.)',
      introSeen: 'A cavern of stalagmites where the road forks. One of them is not a stalagmite, and the lamp has already shown you which.', // (the 8-bit game's roperSeen: the fight is `revealed`)
      from: 'the 8-bit game: deep.js S.roper (a roper and two darkmantles; more with the king)', won: 'IT HANGS THERE LIKE A STALACTITE.',
      foes: [{ id: 'roper', kind: 'roper', at: [9, 3], hidden: true }, { id: 'dm1', kind: 'darkmantle', at: [5, 6], hidden: true }, { id: 'dm2', kind: 'darkmantle', at: [15, 4], hidden: true }], wave: null },
    { id: 'naga', level: 7, map: 'causeway', name: 'The Black Water', sub: 'the causeway, leg four', music: 'boss',
      intro: 'The road crosses the black water on a causeway of dressed blocks. Halfway over, the water stands up. It has a woman\'s face, and it does not blink.',
      from: 'the 8-bit game: deep.js S.naga (the spirit naga; it keeps to the water here, the 8-bit game\'s causeway)', won: 'THE WATER LIES DOWN AGAIN.',
      foes: [{ id: 'naga', kind: 'naga', at: [5, 4] }], wave: null },
    { id: 'elementals', level: 8, map: 'cutwalls', name: 'The Cut\'s Walls', sub: 'the king\'s road, leg four', music: 'boss',
      intro: 'The made road runs into a cut, and the cut\'s walls move. The rock stands up on legs of rock. (Plain steel does half; thunder does double.)',
      from: 'the 8-bit game: deep.js S.elemental (two earth elementals)', won: 'THE ROCK IS ONLY ROCK AGAIN.',
      foes: [{ id: 'el1', kind: 'earthelemental', at: [3, 6] }, { id: 'el2', kind: 'earthelemental', at: [15, 6] }], wave: null },
    { id: 'hexbrawl', level: 1, map: 'hexfloor', name: 'The Hex Floor', sub: 'Fight Night, before the card',
      intro: 'The floor at the Hex before the card is called: four brawlers who want a turn, and the card\'s bruiser who wants to warm up.',
      from: 'the 8-bit game: the Hex (the floor\'s brawlers and the card bruiser; the 8-bit game fights them one on one, the ladder all at once)', won: 'THE FLOOR IS YOURS.',
      foes: [{ id: 'br1', kind: 'brawler', at: [5, 4] }, { id: 'br2', kind: 'brawler', at: [12, 4] }, { id: 'br3', kind: 'brawler', at: [5, 8] }, { id: 'br4', kind: 'brawler', at: [12, 8] },
             { id: 'cb', kind: 'cardbruiser', at: [8, 2] }], wave: null },
    { id: 'keeper', level: 3, ladder: false, map: 'floodstair', name: 'The Keeper', sub: 'the flooded stair, Pete\'s Five', music: 'boss',
      intro: 'A dwarven stair runs down into black water. At the bottom five men lie drowned. The water is a thing, and it closes. (It keeps to its water, and you cannot see it there until it moves.)',
      from: 'the 8-bit game: events.js S.stair (the Keeper; the water hand-waved: it keeps to it)', won: 'IT SINKS BACK INTO ITS STAIR.',
      foes: [{ id: 'keeper', kind: 'keeper', at: window.D16.laneAt(window.D16.MAPS.floodstair, window.D16.MAPS.floodstair.geo.keeper[0], window.D16.MAPS.floodstair.geo.keeper[1], 2), hidden: true }], wave: null }, // (in the lane frame, data/maps.js floodstair geo.keeper)
    // THE LADDER'S KEEPER (10-03, Griz: "the cool keeper fight isn't for the ladders, they have to play the real game"; then: the ladder's fight is the old fight unchanged): `keeper` as it
    // is on origin/main before the Keeper work landed (ed7be2a), on the old stair (data/maps.js floodstair-old) with the old foe (data/foes.js keeperold), none of js/keeper.js in it. Its
    // place on the level-3 rung is the old one's (a rung is built from D.fightsAt, in this list's order); dev/keeper-probe.py diffs it against main's.
    { id: 'keeper-ladder', level: 3, map: 'floodstair-old', name: 'The Keeper', sub: 'the flooded stair, Pete\'s Five', music: 'boss',
      intro: 'A dwarven stair runs down into black water. At the bottom five men lie drowned. The water is a thing, and it closes. (It keeps to its water, and you cannot see it there until it moves.)',
      from: 'the 8-bit game: events.js S.stair (the Keeper; the water hand-waved: it keeps to it)', won: 'IT SINKS BACK INTO ITS STAIR.',
      foes: [{ id: 'keeper', kind: 'keeperold', at: [8, 4], hidden: true }], wave: null },
    { id: 'chuul', level: 4, map: 'point', name: 'The Thing in the Lake', sub: 'the point, at night', music: 'boss',
      ring: { hero: 'barley', rounds: [1, 4, 7, 10], con: 3 },
      intro: 'The water off the point heaves. It comes up out of the deep: the size of a wagon, the colour of wet stone. It turns toward the ring before it turns toward anything else. (Barley wears the Ring of Binding.)',
      // inside the 8-bit game (js/embed.js): the ring on whoever wears it, or on nobody (the 8-bit S.lakeFight's lake.rises / risesNoRing)
      introRing: 'It turns toward the ring before it turns toward anything else. ({ring} wears the Ring of Binding: +3 CON saves, and on rounds 1, 4, 7 and 10 it must turn on them.)', // (the 8-bit box has said the water heaves)
      introNoRing: 'Nobody wears the Ring of Binding. It turns toward whoever is nearest the water.',
      from: 'the 8-bit game: events.js S.lakeFight, the base game\'s capstone (the chuul; the Ring of Binding: +3 CON saves, and on rounds 1, 4, 7 and 10 it must turn on the wearer). The water hand-waved: it swims, nobody else does', won: 'THE DEEP IS ONLY WATER NOW.',
      foes: [{ id: 'chuul', kind: 'chuul', at: [8, 2] }], wave: null },
    { id: 'xorns', level: 8, map: 'seamwall', name: 'The Seam', sub: 'the king\'s road, leg three', music: 'boss',
      intro: 'The wall ahead bulges, cracks, and two things the size of barrels push out of the rock, chewing. (Plain steel does half.)',
      from: 'the 8-bit game: deep.js S.xorn (two xorns)', won: 'THERE ARE GEMS IN THE RUBBLE.',
      foes: [{ id: 'x1', kind: 'xorn', at: [7, 1], hidden: true }, { id: 'x2', kind: 'xorn', at: [10, 2], hidden: true }], wave: null },
    // ------------------------------------------------------------------ the bestiary from the 8-bit game's random tables (content/encounters.json),
    // on the set pieces' maps; sized hard for the four like the rest (09-27)
    { id: 'bandits', bestiary: true, level: 1, map: 'snootroad', name: 'Road Bandits', sub: 'the north road',
      intro: 'Five of them across the road, blades out. They want the purse and they would rather not work for it.',
      from: 'the 8-bit game\'s north road table (bandits)', won: 'THE ROAD IS CLEAR.',
      foes: [{ id: 'b1', kind: 'bandit', at: [9, 2] }, { id: 'b2', kind: 'bandit', at: [6, 3] }, { id: 'b3', kind: 'bandit', at: [13, 3] }, { id: 'b4', kind: 'bandit', at: [4, 5] }, { id: 'b5', kind: 'bandit', at: [15, 5] }], wave: null },
    { id: 'nightcrew', bestiary: true, level: 1, map: 'burial', name: 'The Night Crew', sub: 'the Warrens, after hours',
      intro: 'Three of the night crew and their boss, where nobody is meant to be at this hour.',
      from: 'the 8-bit game\'s warrens_c table (the night crew and a crew boss)', won: 'THE CREW SCATTERS.',
      foes: [{ id: 'boss', kind: 'crewboss', at: [9, 4] }, { id: 'n1', kind: 'robber', at: [6, 6] }, { id: 'n2', kind: 'robber', at: [13, 6] }, { id: 'n3', kind: 'robber', at: [10, 2] }], wave: null },
    { id: 'glowseep', bestiary: true, level: 1, map: 'bog', name: 'The Glowseep', sub: 'the bog',
      intro: 'The pools are not as empty as they look: two frogs the size of dogs, and something thin moving in the reeds.',
      from: 'the 8-bit game\'s glowseep table (giant frogs, poison snakes)', won: 'THE BOG GOES QUIET.',
      foes: [{ id: 'f1', kind: 'giantfrog', at: [6, 2] }, { id: 'f2', kind: 'giantfrog', at: [13, 3] }, { id: 's1', kind: 'snake', at: [4, 5] }, { id: 's2', kind: 'snake', at: [15, 5] }], wave: null },
    { id: 'goblins', bestiary: true, level: 2, map: 'camp', name: 'Goblins and a Bugbear', sub: 'the king\'s road, leg one',
      intro: 'Goblins in the old camp, and something big and furred behind them that does not want to be seen until it swings.',
      from: 'the 8-bit game\'s hw1 table (bugbears and goblins)', won: 'THE CAMP IS EMPTY.',
      foes: [{ id: 'bb', kind: 'bugbear', at: [9, 3] }, { id: 'g1', kind: 'goblin', at: [6, 6] }, { id: 'g2', kind: 'goblin', at: [9, 7] }, { id: 'g3', kind: 'goblin', at: [13, 7] }], wave: null },
    { id: 'southroad', bestiary: true, level: 3, map: 'snootroad', name: 'The South Road', sub: 'past the Halfway Inn',
      intro: 'Two axe beaks on the road, and a boar the size of a pony coming out of the scrub behind them.',
      from: 'the 8-bit game\'s south road table (axe beaks, a giant boar)', won: 'THE ROAD SOUTH IS OPEN.',
      foes: [{ id: 'ab1', kind: 'axebeak', at: [6, 2] }, { id: 'ab2', kind: 'axebeak', at: [12, 3] }, { id: 'boar', kind: 'giantboar', at: [8, 1] }], wave: null },
    { id: 'ogre', bestiary: true, level: 3, map: 'breach', name: 'An Ogre and Its Goblins', sub: 'the king\'s road, leg one',
      intro: 'An ogre with a club made of a door-beam, and two goblins who think they own it.',
      from: 'the 8-bit game\'s hw1 table (an ogre and goblins)', won: 'THE OGRE GOES DOWN.',
      foes: [{ id: 'ogre', kind: 'ogre', at: [9, 1] }, { id: 'g1', kind: 'goblin', at: [6, 3] }, { id: 'g2', kind: 'goblin', at: [13, 3] }], wave: null },
    { id: 'mouthers', bestiary: true, level: 4, map: 'grickden', name: 'Gibbering Mouthers', sub: 'the king\'s road, leg two',
      intro: 'Two heaps of eyes and mouths, and the sound they make gets into your feet. (Their gibbering stuns what is near them.)',
      from: 'the 8-bit game\'s hw2 table (gibbering mouthers)', won: 'THE MOUTHS STOP.',
      foes: [{ id: 'm1', kind: 'mouther', at: [7, 3] }, { id: 'm2', kind: 'mouther', at: [12, 4] }], wave: null },
    { id: 'ettins', bestiary: true, level: 5, map: 'trollcave', name: 'Two Ettins', sub: 'the king\'s road, leg two',
      intro: 'Two ettins arguing with each other, all four heads of them, until they see you.',
      from: 'the 8-bit game\'s hw2 table (ettins; the stand-in has one head)', won: 'THE ARGUMENT IS OVER.',
      foes: [{ id: 'e1', kind: 'ettin', at: [6, 2] }, { id: 'e2', kind: 'ettin', at: [13, 5] }], wave: null },
    { id: 'card', level: 4, map: 'hexfloor', name: 'The Card\'s Top', sub: 'Fight Night, the Hex', music: 'boss',
      intro: 'The top of the card, both at once: Talmok, who rages when he is hit, and the visiting barbarian with the great axe. Neither of them guards.',
      from: 'the 8-bit game: the Hex card (Talmok and the berserker, each a bout for one fighter there; together for the four here)', won: 'THE CARD IS YOURS.',
      foes: [{ id: 'talmok', kind: 'talmok', at: [7, 3] }, { id: 'bz', kind: 'berserker', at: [10, 3] }], wave: null },
    { id: 'captain', bestiary: true, level: 3, map: 'camp', name: 'The Bandit Captain', sub: 'a camp off the south road',
      intro: 'A camp that is not a garrison\'s: a captain who fights with a blade in each hand, and three of his own.',
      from: 'the SRD bandit captain (the 8-bit game\'s Hask is his pattern) and the road tables\' bandits', won: 'THE CAMP IS BROKEN UP.',
      foes: [{ id: 'bc', kind: 'banditcaptain', at: [9, 3] }, { id: 'b1', kind: 'bandit', at: [6, 6] }, { id: 'b2', kind: 'bandit', at: [9, 7] }, { id: 'b3', kind: 'bandit', at: [13, 7] }], wave: null },
    { id: 'grimlocks', bestiary: true, level: 4, map: 'giantcamp', name: 'Duergar and Grimlocks', sub: 'the king\'s road, leg three',
      intro: 'Grey dwarves at a fire, and grey shapes in the stone round it that have no eyes and do not need them. (The grimlocks start hidden.)',
      from: 'the 8-bit game\'s hw3 table (duergar and grimlocks)', won: 'THE FIRE GOES OUT.',
      foes: [{ id: 'dg1', kind: 'duergar', at: [8, 2] }, { id: 'dg2', kind: 'duergar', at: [11, 3] }, { id: 'dg3', kind: 'duergar', at: [6, 4] },
             { id: 'gl1', kind: 'grimlock', at: [3, 5], hidden: true }, { id: 'gl2', kind: 'grimlock', at: [15, 5], hidden: true }, { id: 'gl3', kind: 'grimlock', at: [12, 7], hidden: true }], wave: null },
    { id: 'cube', bestiary: true, level: 5, map: 'drain', name: 'The Cube', sub: 'the drain cut',
      intro: 'The drain cut again, and something in it you only see by what hangs in it: bones, a boot, a lantern. And a heap of mouths behind. (The cube starts unseen.)',
      from: 'the 8-bit game\'s hw2 table (a gelatinous cube and a gibbering mouther)', won: 'THE CUT IS CLEAN.',
      foes: [{ id: 'cube', kind: 'cube', at: [6, 3], hidden: true }, { id: 'mo', kind: 'mouther', at: [10, 6] }], wave: null },
    { id: 'crawlers', bestiary: true, level: 4, map: 'settling', name: 'Crawlers', sub: 'the Warrens, the lower works',
      intro: 'Two of the crawlers the cradle milks, loose in the lower works, feelers first.',
      from: 'the 8-bit game\'s warrens_d table (crawlers)', won: 'THE LOWER WORKS ARE QUIET.',
      foes: [{ id: 'c1', kind: 'crawler', at: [13, 3] }, { id: 'c2', kind: 'crawler', at: [3, 5] }], wave: null },
    { id: 'ratswarms', bestiary: true, level: 2, map: 'settling', name: 'Rat Swarms', sub: 'the Warrens, the lower works',
      intro: 'The floor of the lower works moves: two swarms of rats, and two of the big ones driving them.',
      from: 'the 8-bit game\'s warrens_c table (rat swarms, giant rats)', won: 'THE FLOOR IS ONLY FLOOR.',
      foes: [{ id: 'rs1', kind: 'ratswarm', at: [7, 3] }, { id: 'rs2', kind: 'ratswarm', at: [11, 5] }, { id: 'r1', kind: 'giantrat', at: [4, 5] }, { id: 'r2', kind: 'giantrat', at: [14, 5] }], wave: null },
    { id: 'batswarms', bestiary: true, level: 1, map: 'roost', name: 'Bat Swarms', sub: 'the galleries, under the roost', roost: true, familiar: 'bat', // (Aurdin's bat on the ladder, its blindsight in the dark: Griz, 10-02 -- lost ~5 in 6 without it)
      intro: 'Something has woken a corner of the roost: two clouds of bats and one of the giant ones. No fire under the roost.',
      from: 'the 8-bit game\'s g3 table (giant bats; the swarms from the galleries)', won: 'THE ROOST SETTLES.',
      foes: [{ id: 'bs1', kind: 'batswarm', at: [6, 3] }, { id: 'bs2', kind: 'batswarm', at: [11, 3] }, { id: 'gb', kind: 'giantbat', at: [8, 1] }], wave: null },
    { id: 'insects', bestiary: true, level: 2, map: 'bog', name: 'The Glowseep\'s Swarms', sub: 'the bog',
      intro: 'A hum over the water that turns into two clouds, and a frog that has been waiting for whatever they drive into it.',
      from: 'the 8-bit game\'s glowseep table (insect swarms, a giant frog, a snake)', won: 'THE HUM STOPS.',
      foes: [{ id: 'is1', kind: 'insectswarm', at: [6, 4] }, { id: 'is2', kind: 'insectswarm', at: [11, 4] }, { id: 'f1', kind: 'giantfrog', at: [13, 3] }, { id: 's1', kind: 'snake', at: [4, 5] }], wave: null },
    { id: 'blades', level: 9, map: 'restcamp', name: 'House-Cleaning', sub: 'the rest, past Torvald', music: 'boss', ambush: true,
      intro: 'You lie down on the road. Two of the sect come out of the dark at the edges, and house-cleaning does not yield. (Whoever does not see them coming loses the first round.)',
      from: 'the 8-bit game: deep.js, the sect blades at the first rest after Torvald (two assassins; the party surprised unless the watch spots them). DEADLY for four at 9', won: 'THE SECT IS SHORT TWO BLADES.',
      foes: [{ id: 'blade1', kind: 'assassin', at: [2, 2] }, { id: 'blade2', kind: 'assassin', at: [16, 11] }], wave: null },
    { id: 'gulch', bestiary: true, level: 3, map: 'cavern', name: 'The Web', sub: 'Web Gulch, the strung end',
      intro: 'Three giant spiders, and silk from rim to rim.', from: 'Web Gulch (giant spiders)',
      foes: [{ id: 'gs1', kind: 'giantspider', at: [10, 7] }, { id: 'gs2', kind: 'giantspider', at: [13, 8] }, { id: 'gs3', kind: 'giantspider', at: [5, 5] }], wave: null },
    { id: 'trollhole', bestiary: true, level: 5, map: 'cavern', name: 'The Troll Hole', sub: 'off the fourth leg',
      intro: 'It is already getting up again.', from: 'leg four of the highway (the troll hole)',
      foes: [{ id: 'troll1', kind: 'troll', at: [11, 4] }], wave: null },
    { id: 'gallery', level: 9, map: 'cavern', name: 'The Cocoon Gallery', sub: 'off the road, below Third Lamp',
      intro: 'Two drow on the ledge. Something in the stalagmites.', from: 'the expansion: the road below Third Lamp (the POC)',
      looks: { barley: { name: 'Denny', sheet: 'denny_p2' } } } // Denny plays Barley here only (Griz, 09-27)
  ];
  D.fight = function (id) { return D.FIGHTS.filter(function (f) { return f.id === id; })[0] || D.FIGHTS.filter(function (f) { return f.id === 'gallery'; })[0]; };
  // the class floor (09-28, the class NPCs: ?npc=cleric,wizard&lvl=5, and the bench): the Hex floor, lit, open, the band of class
  // NPCs to the north and the four (or another band) at the south door. Made when asked for, never on the ladder's list
  D.classFight = function (level, o) {
    o = o || {};
    // (o.name, o.sub, o.won, o.lost, o.music, o.id: the Pocket DM's own words for a fight it made -- deep16/js/pocket.js, 10-02)
    return { id: o.id || 'classes', level: level, map: o.map || 'hexfloor', dark: o.dark != null ? o.dark : undefined, name: o.name || 'The Class Floor', // (&map=, &dark: js/classes.js npcFight)
      sub: o.sub || ('the Pocket DM: ' + (o.what || 'a class NPC') + ' at ' + level), music: o.music || undefined,
      intro: o.intro || 'The floor is swept. Across it, someone in their own colours has come to see what you are made of.',
      from: o.from || 'the class NPCs (deep16/js/classes.js): the SRD 5.1 classes at levels 1-6', won: o.won || 'THE FLOOR IS YOURS.', lost: o.lost || 'THE FLOOR IS THEIRS.', foes: [], wave: null, noFlee: true };
  };
  // a rung's fights: the Cocoon Gallery first on the top rung (the POC, Denny's), then the 8-bit game's set pieces, then
  // the bestiary's (the Cowork seat's first four, `bestiary`)
  function rank(f) { return f.id === 'gallery' ? -1 : f.bestiary ? 1 : 0; }
  D.fightsAt = function (level) {
    return D.FIGHTS.map(function (f, i) { return [f, i]; }).filter(function (p) { return p[0].level === level && p[0].ladder !== false; })
      .sort(function (a, b) { return rank(a[0]) - rank(b[0]) || a[1] - b[1]; }).map(function (p) { return p[0]; });
  };
  D.fightAt = function (level) { return D.fightsAt(level)[0] || null; };
})();
