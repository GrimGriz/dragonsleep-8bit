/* DRAGONSLEEP -- the playtest situations (10-01, Griz: "can you do a page of 20 URLs that set-up situations in the playtest ear file?").
   ?at=<id> on the URL: NEW GAME, pick a lead, and the four stand one step short of a line of PLAYTEST.md -- at its level, with the
   story done up to there (flags, guests, gear), the way ?round6 and ?lvl3 do (js/scenes.js). situations.html lists them (it reads this
   file: one table, two pages). Nothing touches a save unless the player saves. &rogue=cutthroat picks Vivian's other archetype.
   A situation: { group, title, pt (PLAYTEST.md's section), look (what to try), say (the opening line), base ('lake': the chuul beaten),
   spine (how many of STEPS are done), lvl, flags, unset, give ([item, n]), prep (fn(G) after the rest), map, x, y, dir, start (a
   generator run once they stand there: Field.load fires no map's enter hook, so a situation that wants one runs it here).
   The flags are the code's own (read 10-01 from js/events.js, js/deep.js, tools/mapgen.py); STEPS follows the expansion's spine
   in the order deep.js sets it (handoff-2026-09-27-dragonsleep-recut-built.md §1, hookDone corrected: the crew's end sets it). */
'use strict';
(function () {
  var DS = window.DS = window.DS || {};
  var q = location.search || '', m = /[?&]at=([a-z0-9-]+)/.exec(q), rog = /[?&]rogue=(thief|cutthroat)/i.exec(q);
  DS.at = m ? m[1] : null;
  function EV() { return DS.EV; }
  function S() { return DS.SCRIPTS; }
  function set(f, o) { for (var k in o) f[k] = o[k]; }
  function hero(G, id) { return G.party.filter(function (h) { return h.id === id; })[0]; }

  // the lake, won (on top of DS.roundSix): the wagon night passed quietly, Kat rode out, the ring did its work, the chuul is dead
  var LAKE = { reachedInn: 1, wagonNight: 1, wagonOutcome: 'quiet', katGone: 1, katRode: 1, dishes: 1, elsbethTold: 1, dueSeen: 1, lakeDone: 1, postgame: 1 };

  // the expansion's spine, one beat a step (STEPS[n - 1] is beat n; a situation's `spine: n` has 1..n done)
  var STEPS = [
    function (G, f) { set(f, { stairHook: 1, pin: 'onelaw' }); },                                                   // 1 Papa's hook
    function (G, f) { f.drySeen = 1; },                                                                              // 2 the dry stair
    function (G, f) { set(f, { crewMet: 1, crewDealt: 1 }); G.give('crewsack', 1); },                               // 3 the night crew, the sack
    function (G, f) {                                                                                                // 4 Ingrith's front door; Audun's shield on the warrant
      set(f, { clericMet: 1, frontDoor: 1, hookDone: 1, warrantShield: 1, shieldTaken: 1, pin: 'theking' });
      var l = hero(G, 'lymen'); if (l) l.equip.shield = 'doorshield';
    },
    function (G, f) { set(f, { pyroMet: 1, pyroLeads: 1, pin: 'kingsroad' }); EV().addGuest('pyro'); },            // 5 Pyro walks the road with them
    function (G, f) { f.roadOpen = 1; G.give('ledgerlamp', 1); },                                                    // 6 the gate up, the ledger-lamp
    function (G, f) {                                                                                                // 7 legs one and two: the seal, First and Second Lamps
      set(f, { sealCleared: 1, lumpTaken: 1, grickDone: 1, lamp1: 1, pyroRoad1: 1, pyroRoad2: 1, pyroRoad3: 1, roperSeen: 1, roperDead: 1, buletteDead: 1, lamp2: 1, heardPinned: 1 });
      G.give('truesilver', 1);
    },
    function (G, f) { set(f, { captainFound: 1, captainTended: 'kit', pin: 'escort' }); EV().addGuest('halldor', 'halldor', { wounded: true }); }, // 8 the north cut
    function (G, f) { f.reliefSeen = 1; },                                                                           // 9 the relief column
    function (G, f) {                                                                                                // 10 home: Pyro's trust, the gate shut; the smith's Winnower
      set(f, { captainHome: 1, pyroTrusts: 1, pin: 'halls', winnowerMade: 1 }); delete f.roadOpen; G.guests = [];
      G.take('truesilver', 1); var b = hero(G, 'barley'); if (b) b.equip.weapon = 'winnower';
    },
    function (G, f) { set(f, { sackReturned: 1, countDone: 1, halldorUp: 1 }); G.take('crewsack', 1); },          // 11 two sidequests; Halldor up
    function (G, f) {                                                                                                // 12 the petition: Halldor and four troopers
      set(f, { petition: 1, roadOpen: 1, pin: 'nest' }); EV().addGuest('halldor');
      for (var i = 1; i <= 4; i++) EV().addGuest('trooper', 'nest' + i, { name: 'Trooper' });
    },
    function (G, f) { set(f, { nestCrushed: 1, nestHome: 1, pin: 'halls' }); G.guests = []; G.renown += 1; },      // 13 the nest crushed
    function (G, f) { set(f, { wordBelow: 1, pin: 'solskaft' }); },                                                 // 14 the word from below
    function (G, f) {                                                                                                // 15 the muster: Brann and Hedda; leg three walked
      set(f, { mustered: 1, escortsOut: 1, roadOpen: 1, xornDone: 1, giantDone: 1 }); EV().addGuest('brann'); EV().addGuest('hedda');
    },
    function (G, f) {                                                                                                // 16 the raid won, Third Lamp lit; the captain's knife
      set(f, { lamp3: 1, raidWon: 1, knifeTaken: 1, pin: 'solskaft' }); G.guests = [];
      var v = hero(G, 'vivian'); if (v) v.equip.weapon = 'greyseamknife';
    },
    function (G, f) { set(f, { fallbackDone: 1, nagaDone: 1, trollsDone: 1, elementalDone: 1 }); },               // 17 leg four
    function (G, f) { set(f, { deepholmSeen: 1, highwaySecured: 1, pin: 'thedoor', torvaldMet: 1, torvaldFate: 'gone' }); }, // 18 the door; Torvald let go
    function (G, f) { set(f, { assassinsMet: 1, assassinsFate: 'sent' }); },                                        // 19 the blades sent up
    function (G, f) { set(f, { pyroConsent: 1, ingrithEscort: 1 }); EV().addGuest('ingrith'); },                   // 20 Pyro's word; Ingrith walks down
    function (G, f) { set(f, { expansionDone: 1 }); G.guests = []; var a = hero(G, 'aurdin'); if (a) a.equip.weapon = 'sunshaftstaff'; } // 21 the consult
  ];

  DS.SITUATIONS = {
    // ---------------------------------------------------------------- the base game (round six's state, one quest undone)
    wet: { group: 'The base game', title: 'The Wet: the bucket and the landlord', pt: '§5 the wet · the landlord\'s pictures (new 10-01)', lvl: 4,
      look: 'E on the crate below you for the bucket. Then E at the water (or walk round to the stone rim south of the pool): onto the wet\'s grid with every sleeper in it, and the landlord\'s first picture before anyone moves. USE the bucket there (ITEM, by the one who carries it) and four more pictures come, the clackers clacking.',
      say: 'The Warrens\' wet. The crate below you holds the deep station\'s bucket; the landlord is in the water to the west, unfed.',
      unset: ['otyughFed', 'landlordSpoke'], map: 'warrens_d', x: 13, y: 4, dir: 'down' },
    gulch: { group: 'The base game', title: 'Web Gulch: the strung end', pt: '§7 the braiding ettercap · §11 the snared traveler', lvl: 3,
      look: 'The ettercap braids on its stump and stops when it sees you. One step right starts it. On the grid: the webs in the round, the web hazard (DEX or restrained), fire burning them. The cocoon down at (18, 17) is the snared traveler.',
      say: 'The ettercap is braiding just ahead; one step east and it sees you.',
      unset: ['ettercapDone', 'trig:snared'], prep: function (G) { delete G.kills.ettercap; }, map: 'gulch', x: 28, y: 9, dir: 'right' },
    cloaker: { group: 'The base game', title: 'The guano slide and the cloaker', pt: '§6 the cloaker · §11 guano slide', lvl: 4,
      look: 'Step up onto the slide: you land in a quiet pocket, and the cloaker drops only once you are out in the big room. A torch or Light costs it a turn, then it fights DAZZLED.',
      say: 'The galleries, at the top of the guano slide. One step north and you go down it.',
      unset: ['cloakerDone'], prep: function (G) { delete G.kills.cloaker; }, map: 'galleries_g2', x: 28, y: 4, dir: 'up' },
    roost: { group: 'The base game', title: 'Under the roost', pt: '§6 the one law · §11/§12 NOT THIS KIND OF NAME', lvl: 4, give: [['lantern', 1]],
      look: 'A fight under the roost at once. Fire and thunder are greyed (ROOST). Aurdin\'s Light, thrown oil or Sacred Weapon should bring the roof down: the bats fill the screen. A lantern with its hood down is the lawful light. (A torch is greyed here now; PLAYTEST\'s "lighting a torch" line is older than that.)',
      say: 'G3, under the roost. Something comes for you in the dark.',
      map: 'galleries_g3', x: 1, y: 9, dir: 'right', start: function* () { yield* EV().encounter('g3'); } },
    cradle: { group: 'The base game', title: 'A shift at the cradle', pt: '§13 the cradle, rebuilt', lvl: 4,
      look: 'Up into the pen gate: the first shift\'s title and settle line, the feelers, the ring and the gold. Old Hob\'s words after.',
      say: 'The Warrens, at the gate of Mouth 2. Edric has you in his book; walk in for a shift.',
      unset: ['shifts', 'hobMet'], map: 'warrens_a', x: 9, y: 5, dir: 'up' },
    wagon: { group: 'The base game', title: 'The wagon night', pt: '§12 the wagon night · §14 · §15', lvl: 4,
      look: 'E on Gennet, STAY THE NIGHT: the wagon comes in. Who had second watch; KEEP WATCH, INVESTIGATE alone, or WAKE THE PARTY; the glamour, the children, Amara\'s gold, the fight, the chase.',
      say: 'The Halfway Inn, the first evening. Gennet is just below you; take a room.',
      map: 'halfway_in', x: 5, y: 5, dir: 'down' },
    chuul: { group: 'The base game', title: 'The night of the ring, and the lake', pt: '§8 Winters and the lake', lvl: 4,
      flags: { reachedInn: 1, wagonNight: 1, wagonOutcome: 'quiet', katGone: 1, katRode: 1, dishes: 1, elsbethTold: 1 },
      look: 'The lead wears the Ring of Binding. E on Gennet and sleep: the cutscene (the inn lady and the kid walk out, only she comes back). Then out to the point (east along the shore) and the thing in the lake: "The ring flares!", grapples, ESCAPE, paralysis.',
      say: 'The Halfway Inn, a later night, the ring on your hand. Gennet is just below you.',
      map: 'halfway_in', x: 5, y: 5, dir: 'down' },

    // ---------------------------------------------------------------- the dwarven expansion (the lake won; the spine done up to the beat)
    hook: { group: 'The dwarven expansion', title: 'Papa\'s hook', pt: '§17 the door opens', base: 'lake', lvl: 5,
      look: 'One step east into Silverton: Papa Urtusk walks up out of his door, the scales lit, THE ONE LAW pinned in the journal.',
      say: 'The road home from the lake. One step east and you are in Silverton.',
      map: 'world', x: 36, y: 11, dir: 'right' },
    crew: { group: 'The dwarven expansion', title: 'The night crew at the niches', pt: '§17 · §22 F3', base: 'lake', spine: 2, lvl: 5,
      look: 'One step east: four of them at a family\'s niches. CHALLENGE / VIVIAN KNOWS THEM / TAKE A CUT / LEAVE; the checks on screen; drop Hask and the wheelwright runs. Then Ingrith along the tier with her lamp.',
      say: 'The Burial\'s top tier, through the cut door at the foot of the dry stair. Voices just ahead.',
      map: 'burial', x: 9, y: 5, dir: 'right' },
    pyro: { group: 'The dwarven expansion', title: 'Pyro at the vault hall', pt: '§22 beat 2', base: 'lake', spine: 4, lvl: 5,
      look: 'Pyro turns and talks: sympathetic, he reads you (eye / hand), WALK THE ROAD WITH HIM or NOT YET. He waits at the door till you say.',
      say: 'Sólskaft\'s vault hall, through the front door Ingrith gave you.',
      map: 'solskaft', x: 27, y: 46, dir: 'up', start: function* () { yield* S()['enter:solskaft'](); } },
    couch: { group: 'The dwarven expansion', title: 'Tam Vere\'s couch', pt: '§20 the smoke', base: 'lake', lvl: 5, unset: ['smokeDreamt'],
      look: 'Step up into Tam\'s: the couch and the good leaf (5 sp). The den, the smoke, twenty seconds with no words: the castle, the storm, the copper spire. Hold E the second time to wake early.',
      say: 'Vice row. Tam Vere\'s door is right above you.',
      map: 'silverton', x: 35, y: 42, dir: 'up' },
    leg1: { group: 'The dwarven expansion', title: 'Leg one with Pyro: the cut seal', pt: '§18 leg one · §22 F5-F7, Pyro in a fight', base: 'lake', spine: 6, lvl: 5,
      look: 'Two steps north: the cut seal (red) opens on the goblins\' camp, sized for the four plus Pyro (he counts as two). Pyro fights: two maces, second wind, action surge. Light the ledger-lamp (ITEM) first.',
      say: 'The king\'s road, leg one, with Pyro beside you. The red seal is just ahead.',
      map: 'highway_1', x: 28, y: 9, dir: 'up' },
    northcut: { group: 'The dwarven expansion', title: 'The north cut: Halldor pinned', pt: '§22 the north cut', base: 'lake', spine: 7, lvl: 6,
      look: 'One step north: Halldor\'s unit holding a neck of rock; phase spiders out of the walls, into the rock when hurt, out again next round. After: TEND HIM (a kit, or Lymen\'s hands) or let him walk.',
      say: 'The north cut, off leg two. Steel ringing just ahead.',
      map: 'pinned', x: 9, y: 11, dir: 'up' },
    nest: { group: 'The dwarven expansion', title: 'The nest, with Halldor\'s troopers', pt: '§22 the nest', base: 'lake', spine: 12, lvl: 7,
      look: 'One step north: the brood and the Broodmother, Halldor and four troopers fighting beside you. The cocoons: a diamond, a greater potion, dwarven plate. Then rest anywhere for Ulf\'s runner.',
      say: 'The nest, past the neck. Halldor and his four are with you.',
      map: 'nest', x: 11, y: 6, dir: 'up' },
    raid: { group: 'The dwarven expansion', title: 'Third Lamp, taken', pt: '§18 · §22 the raid', base: 'lake', spine: 15, lvl: 8,
      look: 'One step east: GO IN, or CREEP UP FIRST (a group Stealth check). A blade-captain, a spell-weaver, five drow; Brann and Hedda beside you. Win: Brann lights the lamp. The captain\'s knife in the barrack-cut.',
      say: 'Third Lamp, dark. Brann and Hedda are with you; the station is just east.',
      map: 'highway_3', x: 56, y: 11, dir: 'right' },
    leg4: { group: 'The dwarven expansion', title: 'Leg four: the black water', pt: '§22 leg four', base: 'lake', spine: 16, lvl: 8, flags: { fallbackDone: 1 },
      look: 'Two steps east: the causeway over black water and what stands up out of it. Then on: the troll hole, the made road beginning, the rock that stands up in its cut.',
      say: 'Leg four, past the drow\'s fallback line. The causeway is just ahead.',
      map: 'highway_4', x: 31, y: 11, dir: 'right' },
    torvald: { group: 'The dwarven expansion', title: 'Deepholm\'s door: Torvald', pt: '§19 Deepholm\'s door', base: 'lake', spine: 17, lvl: 9,
      look: 'The road held to the door, then Torvald comes up the road in a hurry and offers to heal. LET HIM GO / ASK HIM (Insight, Religion, Medicine, then Persuasion; Vivian\'s Sleight of Hand) / HOLD HIM.',
      say: 'The made road\'s end. Deepholm\'s door.',
      map: 'threshold', x: 1, y: 8, dir: 'right', start: function* () { yield* S()['enter:threshold'](); } },
    blades: { group: 'The dwarven expansion', title: 'The sect\'s two blades', pt: '§19 the road\'s people', base: 'lake', spine: 18, lvl: 9,
      look: 'Pitch the tent here (ITEM, TENT): WHO HAD THE WATCH? Then their question: HE WENT UP / HE WENT DOWN / NOTHING TO SAY / ASK THEM / FIGHT.',
      say: 'Deepholm\'s door, the night after Torvald went up the road. Rest here: ITEM, then the TENT.',
      map: 'threshold', x: 6, y: 8, dir: 'right' },
    consult: { group: 'The dwarven expansion', title: 'The consult', pt: '§19 the consult and the credits', base: 'lake', spine: 20, lvl: 9,
      look: 'E on the door: Dagny, Ingrith goes through and you don\'t, the SUNSHAFT STAFF for Aurdin, 5,000 XP, then BEHIND THE FOUNTAINS and the line your choices wrote.',
      say: 'Deepholm\'s door with Ingrith beside you; Pyro has given his word. The door is just east.',
      map: 'threshold', x: 16, y: 8, dir: 'right' },
    solskaft: { group: 'The dwarven expansion', title: 'Sólskaft, the road held', pt: '§22 the halls', base: 'lake', spine: 21, lvl: 9,
      look: 'A walk. The clan hall (south-west): the throne on its dais, the oath-stone, the noon beam on the stone. The closed street (far west, north): the barred doors and the Scalebeam house, Ásdís. The grow (north-east, over the footbridge). The cook\'s line.',
      say: 'Sólskaft, the morning after. The halls are yours.',
      map: 'solskaft', x: 28, y: 20, dir: 'down' }
  };

  // ------------------------------------------------------------------ setting one up (called by js/scenes.js LeadSelect)
  DS.situation = function (G, s) {
    var R = DS.R, f = G.flags;
    DS.roundSix(G);                                                   // level 4, every quest but the inn and the lake (js/scenes.js)
    if (s.lvl && s.lvl !== 4) G.party = G.party.map(function (h) { var n = R.makeHero(h.id, s.lvl); n.equip = h.equip; return n; });
    if (s.base === 'lake') { set(f, LAKE); delete f.pin; G.renown += 2; }
    for (var i = 0; i < (s.spine || 0); i++) STEPS[i](G, f);
    set(f, s.flags || {});
    (s.unset || []).forEach(function (k) { delete f[k]; });
    // Vivian's archetype: the field would ask at once and talk over the situation's opening, so it is chosen here (&rogue=cutthroat)
    G.party.forEach(function (h) {
      if (h.pendingChoice !== 'archetype') return;
      var opts = (DS.DATA.heroes[h.id].archetypes || []).map(function (o) { return o.name; });
      h.subclass = opts.filter(function (n) { return rog && n.toLowerCase() === rog[1].toLowerCase(); })[0] || opts[0];
      delete h.pendingChoice;
    });
    (s.give || []).forEach(function (it) { if (DS.DATA.items[it[0]]) G.give(it[0], it[1]); });
    if (s.prep) s.prep(G);
    G.map = s.map; G.x = s.x; G.y = s.y; G.dir = s.dir || 'down';
    return G;
  };
  DS.situationStart = function* (s) {
    yield DS.say(s.say); // (the title was in the lead's prompt)
    if (s.start) yield* s.start();
  };
})();
