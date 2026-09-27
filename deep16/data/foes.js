/* DEEP16 — the POC's three foes (RULED 09-26d, Griz: "agreed" -- two drow and a phase spider).
   The phase spider is the SRD 5.1 block as written. The drow are the dwarven expansion's own Drow Blade-Captain
   (content/monsters.json `drowcaptain`: game-original from SRD pieces, CR 5) given the SRD drow's hand crossbow and
   Faerie Fire -- a plain SRD drow (13 HP) falls in one round to four heroes at level 9 and would test nothing.
   PROPOSED by the code seat for the POC; fold to invented.json when the branch merges. */
'use strict';
(window.D16 = window.D16 || {}).FOES = {
  drow: {
    name: 'Drow Captain', sheet: 'drow_p0', cr: '5', ac: 18, hp: 71, speed: 30, size: 1, reach: 5,
    abil: { str: 13, dex: 18, con: 14, int: 11, wis: 13, cha: 12 }, init: 4, perception: 14,
    saves: { str: 1, dex: 4, con: 2, int: 0, wis: 1, cha: 1 },
    attacks: {
      shortsword: { name: 'Shortsword', atk: 7, dice: '1d6', mod: 4, type: 'piercing', extra: '2d6', extraType: 'poison', reach: 5 },
      crossbow: { name: 'Hand Crossbow', atk: 7, dice: '1d6', mod: 4, type: 'piercing', range: [30, 120], ranged: true, poison: { dc: 13 } }
    },
    multi: 2, faerieFire: { dc: 12, range: 60, cube: 4 },
    src: 'content/monsters.json drowcaptain (game-original, CR 5) + SRD 5.1 Drow (hand crossbow, poison, Faerie Fire)'
  },
  phasespider: {
    name: 'Phase Spider', sheet: 'phasespider_p1', cr: '3', ac: 13, hp: 32, speed: 30, size: 2, reach: 5,
    abil: { str: 15, dex: 15, con: 12, int: 6, wis: 10, cha: 6 }, init: 2, perception: 10,
    saves: { str: 2, dex: 2, con: 1, int: -2, wis: 0, cha: -2 },
    attacks: {
      bite: { name: 'Bite', atk: 4, dice: '1d10', mod: 2, type: 'piercing', reach: 5, save: { ab: 'con', dc: 11, dice: '4d8', type: 'poison', half: true } }
    },
    multi: 1, jaunt: true,
    src: 'SRD 5.1 Phase Spider (Ethereal Jaunt as a bonus action; bite with a DC 11 CON poison save)'
  },
  // the second wave (Griz, 09-27: "adding a new monster to appear when these ones go down (your choice monster!)"):
  // when the gallery goes still a cocoon on the far wall splits and a drider drops out. The SRD 5.1 block as written;
  // its look is its own pipeline-1 sheet (09-27, the Cowork seat): the drow's upper half rendered on the spider's body in
  // Blender -- tools/deep16-figures.json 'drider' (a rider block), rendered by tools/render-sprites.py. The old composite
  // (sheet + rider drawn in JS) still works: set rider: 'drow_p0' and sheet: 'phasespider_p1' to get it back.
  drider: {
    name: 'Drider', sheet: 'drider_p1', cr: '6', ac: 19, hp: 123, speed: 30, size: 2, reach: 5,
    abil: { str: 16, dex: 16, con: 18, int: 13, wis: 14, cha: 12 }, init: 3, perception: 15,
    saves: { str: 3, dex: 3, con: 4, int: 1, wis: 2, cha: 1 },
    attacks: {
      longsword: { name: 'Longsword', atk: 6, dice: '1d8', mod: 3, type: 'slashing', reach: 5 },
      bite: { name: 'Bite', atk: 6, dice: '1d4', mod: 0, type: 'piercing', extra: '2d8', extraType: 'poison', reach: 5 },
      longbow: { name: 'Longbow', atk: 6, dice: '1d8', mod: 3, type: 'piercing', range: [150, 600], ranged: true, extra: '1d8', extraType: 'poison' }
    },
    multi: 3, faerieFire: { dc: 13, range: 60, cube: 4 }, fey: true, webWalker: true,
    src: 'SRD 5.1 Drider (CR 6): three attacks, longsword or longbow, one of them may be the bite; Faerie Fire 1/day (DC 13); Fey Ancestry (no magical sleep); Web Walker'
  },

  // ------------------------------------------------------------------ the bestiary's first five (09-27, the Cowork seat, on Griz's "proceed with 4"):
  // SRD 5.1 blocks as written, sheets from pipeline 1 (KayKit Skeletons; Quaternius packs). They fight by js/ai.js brute():
  // close on the nearest hero, then the routine in `multi` (a list of attack names, or a count of the first attack).
  // Fields the engine does not read yet are kept as data and named in `todo`, so the next seat sees the gap, not a silent stub.
  giantrat: {
    name: 'Giant Rat', sheet: 'giantrat_p1', cr: '1/8', ac: 12, hp: 7, speed: 30, size: 1, reach: 5,
    abil: { str: 7, dex: 15, con: 11, int: 2, wis: 10, cha: 4 }, init: 2, perception: 10,
    saves: { str: -2, dex: 2, con: 0, int: -4, wis: 0, cha: -3 },
    attacks: { bite: { name: 'Bite', atk: 4, dice: '1d4', mod: 2, type: 'piercing', reach: 5 } },
    multi: 1, packTactics: true,
    src: 'SRD 5.1 Giant Rat (CR 1/8); content/monsters.json giantrat. Pack Tactics is read (rules.js edges, 09-27)'
  },
  giantspider: {
    name: 'Giant Spider', sheet: 'giantspider_p1', cr: '1', ac: 14, hp: 26, speed: 30, size: 2, reach: 5,
    abil: { str: 14, dex: 16, con: 12, int: 2, wis: 11, cha: 4 }, init: 3, perception: 10,
    saves: { str: 2, dex: 3, con: 1, int: -4, wis: 0, cha: -3 },
    attacks: {
      bite: { name: 'Bite', atk: 5, dice: '1d8', mod: 3, type: 'piercing', reach: 5, save: { ab: 'con', dc: 11, dice: '2d8', type: 'poison', half: true } }
    },
    multi: 1, web: { atk: 5, range: [30, 60], dc: 12, recharge: 5 }, webWalker: true,
    src: 'SRD 5.1 Giant Spider (CR 1); content/monsters.json giantspider. Web is read (09-27, ai.js webShot): a ranged attack, restrained, escape DC 12, recharge 5-6'
  },
  // ------------------------------------------------------------------ the 8-bit game's bosses, set pieces for the ladder (09-27, the ladder seat)
  // The braiding ettercap of Web Gulch (events.js S.ettercap: it fights beside a giant spider). SRD 5.1 as written; its
  // Web in the SRD's form (a ranged attack, where the 8-bit game rolls a DEX save).
  ettercap: {
    name: 'Ettercap', sheet: 'ettercap_p1', cr: '2', ac: 13, hp: 44, speed: 30, size: 1, reach: 5,
    abil: { str: 14, dex: 15, con: 13, int: 7, wis: 12, cha: 8 }, init: 2, perception: 13,
    saves: { str: 2, dex: 2, con: 1, int: -2, wis: 1, cha: -1 },
    attacks: {
      bite: { name: 'Bite', atk: 4, dice: '1d8', mod: 2, type: 'piercing', extra: '1d8', extraType: 'poison', reach: 5, poison: { dc: 11 } },
      claws: { name: 'Claws', atk: 4, dice: '2d4', mod: 2, type: 'slashing', reach: 5 }
    },
    multi: ['bite', 'claws'], web: { atk: 4, range: [30, 60], dc: 11, recharge: 5 }, webWalker: true,
    src: 'SRD 5.1 Ettercap (CR 2); content/monsters.json ettercap (wiki/web-gulch.md, the braiding ettercap). Spider Climb not read (no walls to climb on the grid)'
  },
  // The landlord of the Warrens' deepest pool (events.js: "It rises from its pool... It will not leave the water").
  // SRD 5.1 Otyugh as the 8-bit game has it (no disease, no stench): bite and two tentacles, a tentacle grips (up to two),
  // and on half its turns it slams what it holds (CON 14, 2d6+3, stunned). bound '~': it keeps to its pool, not slowed there.
  otyugh: {
    name: 'Otyugh', sheet: 'otyugh_p1', cr: '5', ac: 14, hp: 114, speed: 30, size: 2, reach: 5,
    abil: { str: 16, dex: 11, con: 19, int: 6, wis: 13, cha: 6 }, init: 0, perception: 11,
    saves: { str: 3, dex: 0, con: 7, int: -2, wis: 1, cha: -2 },
    attacks: {
      bite: { name: 'Bite', atk: 6, dice: '2d8', mod: 3, type: 'piercing', reach: 5 },
      tentacle: { name: 'Tentacle', atk: 6, dice: '1d8', mod: 3, type: 'bludgeoning', extra: '1d8', extraType: 'piercing', reach: 10, grapple: { dc: 13, max: 2 } }
    },
    multi: ['tentacle', 'tentacle', 'bite'], slam: { dc: 14, dice: '2d6+3', chance: 0.5 }, bound: '~',
    src: 'SRD 5.1 Otyugh (CR 5); content/monsters.json otyugh (the landlord, wiki/the-warrens.md). Tentacle reach 10 ft (SRD); the bite\'s disease and the telepathy left off, as in the 8-bit game'
  },
  wolf: {
    name: 'Wolf', sheet: 'wolf_p1', cr: '1/4', ac: 13, hp: 11, speed: 40, size: 1, reach: 5,
    abil: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 }, init: 2, perception: 13,
    saves: { str: 1, dex: 2, con: 1, int: -4, wis: 1, cha: -2 },
    attacks: { bite: { name: 'Bite', atk: 4, dice: '2d4', mod: 2, type: 'piercing', reach: 5, prone: 11 } },
    multi: 1, packTactics: true,
    src: 'SRD 5.1 Wolf (CR 1/4); content/monsters.json wolf. Pack Tactics is read (09-27)', todo: 'the bite\'s STR DC 11 knockdown is not read (the engine has no prone yet)'
  },
  skeleton: {
    name: 'Skeleton', sheet: 'skeleton_p1', cr: '1/4', ac: 13, hp: 13, speed: 30, size: 1, reach: 5,
    abil: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 }, init: 2, perception: 9,
    saves: { str: 0, dex: 2, con: 2, int: -2, wis: -1, cha: -3 },
    attacks: { shortsword: { name: 'Shortsword', atk: 4, dice: '1d6', mod: 2, type: 'piercing', reach: 5 } },
    multi: 1, vulnerable: ['bludgeoning'], immune: ['poison'],
    src: 'SRD 5.1 Skeleton (CR 1/4): armor scraps AC 13, shortsword (the sheet carries the pack\'s blade and small shield); the shortbow left off. Vulnerable and immune are read (battle.js typed(), 09-27)'
  },
  troll: {
    name: 'Troll', sheet: 'troll_p1', cr: '5', ac: 15, hp: 84, speed: 30, size: 2, reach: 5,
    abil: { str: 18, dex: 13, con: 20, int: 7, wis: 9, cha: 7 }, init: 1, perception: 12,
    saves: { str: 4, dex: 1, con: 5, int: -2, wis: -1, cha: -2 },
    attacks: {
      bite: { name: 'Bite', atk: 7, dice: '1d6', mod: 4, type: 'piercing', reach: 5 },
      claw: { name: 'Claw', atk: 7, dice: '2d6', mod: 4, type: 'slashing', reach: 5 }
    },
    multi: ['bite', 'claw', 'claw'], regen: 10,
    src: 'SRD 5.1 Troll (CR 5): Multiattack bite + two claws; Regeneration 10 at the start of its turn unless it took fire or acid since its last (read by brute(): battle.hurt marks u.burned)'
  },

  // ------------------------------------------------------------------ the expansion's set pieces (09-27, the ladder seat): content/monsters.json's
  // numbers as the 8-bit game has them; sizes and speeds from the SRD (the 8-bit blocks carry none)
  // the nest (deep.js S.brood): the one that bred the phase spiders. Huge (the Cowork seat's map: the spider at 3 squares)
  broodmother: {
    name: 'Broodmother', sheet: 'broodmother_p1', cr: '6', ac: 15, hp: 120, speed: 30, size: 3, reach: 5,
    abil: { str: 19, dex: 15, con: 16, int: 7, wis: 12, cha: 6 }, init: 2, perception: 11,
    saves: { str: 4, dex: 2, con: 3, int: -2, wis: 1, cha: -2 },
    attacks: {
      bite: { name: 'Bite', atk: 7, dice: '2d10', mod: 4, type: 'piercing', reach: 5, save: { ab: 'con', dc: 14, dice: '6d8', type: 'poison', half: true } }
    },
    multi: ['bite', 'bite'], web: { atk: 7, range: [30, 60], dc: 14, recharge: 5 }, webWalker: true,
    src: 'content/monsters.json broodmother (game-original from the SRD 5.1 Phase Spider at CR 6); its Web in the SRD\'s attack form', todo: 'the jaunt when bloodied (once, 4 rounds) is not read'
  },
  // the cut seal camp (deep.js S.cutSeal): budgeted hard for four at 5
  bugbearchief: {
    name: 'Bugbear Chief', sheet: 'bugbearchief_p1', cr: '3', ac: 17, hp: 65, speed: 30, size: 1, reach: 5,
    abil: { str: 17, dex: 14, con: 14, int: 11, wis: 12, cha: 11 }, init: 2, perception: 11,
    saves: { str: 3, dex: 2, con: 2, int: 0, wis: 1, cha: 0 },
    attacks: { morningstar: { name: 'Morningstar', atk: 5, dice: '2d8', mod: 3, type: 'piercing', reach: 5 } },
    multi: ['morningstar', 'morningstar'], surprise: '2d6',
    src: 'content/monsters.json bugbearchief (game-original from SRD 5.1 pieces: the Bugbear, two attacks); Surprise Attack as the 8-bit game reads it (+2d6 in the first round)'
  },
  hobsergeant: {
    name: 'Hobgoblin Sergeant', sheet: 'hobsergeant_p1', cr: '3', ac: 18, hp: 39, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 14, con: 14, int: 12, wis: 10, cha: 13 }, init: 2, perception: 10,
    saves: { str: 2, dex: 2, con: 2, int: 1, wis: 0, cha: 1 },
    attacks: { longsword: { name: 'Longsword', atk: 5, dice: '1d8', mod: 2, type: 'slashing', reach: 5 } },
    multi: ['longsword', 'longsword'], martial: '2d6',
    src: 'content/monsters.json hobsergeant (game-original from SRD 5.1 pieces: the Hobgoblin and the Veteran); Martial Advantage'
  },
  hobgoblin: {
    name: 'Hobgoblin', sheet: 'hobgoblin_p1', cr: '1/2', ac: 18, hp: 11, speed: 30, size: 1, reach: 5,
    abil: { str: 13, dex: 12, con: 12, int: 10, wis: 10, cha: 9 }, init: 1, perception: 10,
    saves: { str: 1, dex: 1, con: 1, int: 0, wis: 0, cha: -1 },
    attacks: { longsword: { name: 'Longsword', atk: 3, dice: '1d8', mod: 1, type: 'slashing', reach: 5 } },
    multi: 1, martial: '2d6',
    src: 'SRD 5.1 Hobgoblin (CR 1/2): longsword, Martial Advantage; content/monsters.json hobgoblin (the longbow left off, as the 8-bit game has it)'
  },
  worg: {
    name: 'Worg', sheet: 'worg_p1', cr: '1/2', ac: 13, hp: 26, speed: 50, size: 2, reach: 5,
    abil: { str: 16, dex: 13, con: 13, int: 7, wis: 11, cha: 8 }, init: 1, perception: 14,
    saves: { str: 3, dex: 1, con: 1, int: -2, wis: 0, cha: -1 },
    attacks: { bite: { name: 'Bite', atk: 5, dice: '2d6', mod: 3, type: 'piercing', reach: 5, prone: 13 } },
    multi: 1,
    src: 'SRD 5.1 Worg (CR 1/2, Large, speed 50); content/monsters.json worg', todo: 'the bite\'s STR DC 13 knockdown is not read (no prone yet)'
  },
  // Third Lamp (deep.js S.raid) and the fallback line (S.fallback): the spell-weaver has her own routine (ai.js weaver);
  // the plain drow fight by brute() (a blade in reach, else the hand crossbow). Their Darkness and light sensitivity are not read.
  spellweaver: {
    name: 'Drow Spell-Weaver', sheet: 'spellweaver_p1', cr: '6', ac: 12, hp: 45, speed: 30, size: 1, reach: 5,
    abil: { str: 9, dex: 14, con: 11, int: 17, wis: 12, cha: 11 }, init: 2, perception: 11,
    saves: { str: -1, dex: 2, con: 0, int: 3, wis: 1, cha: 0 },
    attacks: { firebolt: { name: 'Fire Bolt', atk: 6, dice: '2d10', mod: 0, type: 'fire', ranged: true, spell: true, range: [120, 120], fx: 'fire' } },
    multi: 1, fey: true,
    weave: { bolt: { dc: 14, dice: '8d6', type: 'lightning', len: 100, recharge: 5 }, hold: { dc: 14, range: 60 } },
    src: 'content/monsters.json spellweaver (game-original, CR 6): Fire Bolt; a line of lightning (recharge 5-6, DEX 14, 8d6); Hold once (WIS 14, paralyzed, a save each turn)', todo: 'Darkness and light sensitivity are not read'
  },
  drowling: {
    name: 'Drow', sheet: 'drow_p1', cr: '1/4', ac: 15, hp: 13, speed: 30, size: 1, reach: 5,
    abil: { str: 10, dex: 14, con: 10, int: 11, wis: 11, cha: 12 }, init: 2, perception: 12,
    saves: { str: 0, dex: 2, con: 0, int: 0, wis: 0, cha: 1 },
    attacks: {
      shortsword: { name: 'Shortsword', atk: 4, dice: '1d6', mod: 2, type: 'piercing', reach: 5 },
      crossbow: { name: 'Hand Crossbow', atk: 4, dice: '1d6', mod: 2, type: 'piercing', range: [30, 120], ranged: true, poison: { dc: 13 } }
    },
    multi: 1, fey: true,
    src: 'SRD 5.1 Drow (CR 1/4); content/monsters.json drow (the pipeline-1 drow sheet; the captains keep the LPC one)', todo: 'Darkness and light sensitivity are not read'
  },
  // the sect blades (deep.js, the first rest after Torvald): Sneak Attack, and Assassinate on a party caught unaware
  assassin: {
    name: 'Sect Blade', sheet: 'assassin_p1', cr: '8', ac: 15, hp: 78, speed: 30, size: 1, reach: 5,
    abil: { str: 11, dex: 16, con: 14, int: 13, wis: 11, cha: 10 }, init: 3, perception: 13, stealth: 9,
    saves: { str: 0, dex: 6, con: 2, int: 4, wis: 0, cha: 0 },
    attacks: { shortsword: { name: 'Shortsword', atk: 6, dice: '1d6', mod: 3, type: 'piercing', reach: 5, save: { ab: 'con', dc: 15, dice: '7d6', type: 'poison', half: true } } },
    multi: ['shortsword', 'shortsword'], sneak: '4d6', assassinate: true, resist: ['poison'],
    src: 'content/monsters.json assassin (the SRD 5.1 Assassin as the sect\'s blade, CR 8): two shortsword cuts with CON 15 poison, Sneak Attack 4d6, Assassinate (a critical on a creature caught unaware)'
  },
  // the stone giant's camp (deep.js S.giant): the giant and three duergar
  stonegiant: {
    name: 'Stone Giant', sheet: 'stonegiant_p1', cr: '7', ac: 17, hp: 126, speed: 40, size: 3, reach: 15,
    abil: { str: 23, dex: 15, con: 20, int: 10, wis: 12, cha: 9 }, init: 2, perception: 14,
    saves: { str: 6, dex: 5, con: 8, int: 0, wis: 4, cha: -1 },
    attacks: {
      greatclub: { name: 'Greatclub', atk: 9, dice: '3d8', mod: 6, type: 'bludgeoning', reach: 15 },
      rock: { name: 'Rock', atk: 9, dice: '4d10', mod: 6, type: 'bludgeoning', range: [60, 240], ranged: true, fx: 'bolt' }
    },
    multi: ['greatclub', 'greatclub'],
    src: 'SRD 5.1 Stone Giant (CR 7, Huge, greatclub reach 15 ft; Rock as a ranged attack, thrown when no one is in reach); content/monsters.json stonegiant', todo: 'the rock\'s knockdown is not read (no prone yet)'
  },
  duergar: {
    name: 'Duergar', sheet: 'duergar_p1', cr: '1', ac: 16, hp: 26, speed: 25, size: 1, reach: 5,
    abil: { str: 14, dex: 11, con: 14, int: 11, wis: 10, cha: 9 }, init: 0, perception: 10,
    saves: { str: 2, dex: 0, con: 2, int: 0, wis: 0, cha: -1 },
    attacks: { warpick: { name: 'War Pick', atk: 4, dice: '1d8', mod: 2, type: 'piercing', reach: 5 } },
    multi: 1, resist: ['poison'], enlarge: { dice: '2d8' },
    src: 'SRD 5.1 Duergar (CR 1): war pick; Enlarge once (an action: its pick hits for 2d8+2); content/monsters.json duergar', todo: 'Invisibility and light sensitivity are not read'
  },
  // the rescue in the dens (events.js, quest `cull`): the roost overhead, and its one law -- no fire, no thunder
  giantbat: {
    name: 'Giant Bat', sheet: 'giantbat_p1', cr: '1/4', ac: 13, hp: 22, speed: 60, size: 2, reach: 5,
    abil: { str: 15, dex: 16, con: 11, int: 2, wis: 12, cha: 6 }, init: 3, perception: 11,
    saves: { str: 2, dex: 3, con: 0, int: -4, wis: 1, cha: -2 },
    attacks: { bite: { name: 'Bite', atk: 4, dice: '1d6', mod: 2, type: 'piercing', reach: 5 } },
    multi: 1,
    src: 'SRD 5.1 Giant Bat (CR 1/4, Large, fly 60: here it moves 60 on the ground); content/monsters.json giantbat', todo: 'flight is not read (it goes round, not over)'
  },
  // the drain cut (deep.js S.drainCut): two black puddings. Slashing or lightning splits one (at 10 HP or more)
  pudding: {
    name: 'Black Pudding', sheet: 'pudding_p1', small: 'puddingm_p1', cr: '4', ac: 7, hp: 85, speed: 20, size: 2, reach: 5,
    abil: { str: 16, dex: 5, con: 16, int: 1, wis: 6, cha: 1 }, init: -3, perception: 8,
    saves: { str: 3, dex: -3, con: 3, int: -5, wis: -2, cha: -5 },
    attacks: { pseudopod: { name: 'Pseudopod', atk: 5, dice: '1d6', mod: 3, type: 'bludgeoning', extra: '4d8', extraType: 'acid', reach: 5 } },
    multi: 1, immune: ['acid', 'cold', 'lightning', 'slashing'], split: true,
    src: 'SRD 5.1 Black Pudding (CR 4, Large): pseudopod + 4d8 acid; immune acid, cold, lightning, slashing; Split (read: battle.js split)', todo: 'its acid eating armour and weapons is not read'
  },
  // ------------------------------------------------------------------ people (09-27): KayKit Adventurers greyed or turned (tools/deep16-figures.json)
  // the line across the bridge (events.js, enter:warrens_a): the Captain's stable, five guards and their sergeant
  guard: {
    name: 'Line Guard', sheet: 'guard_p1', cr: '1/8', ac: 16, hp: 11, speed: 30, size: 1, reach: 5,
    abil: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 }, init: 1, perception: 12,
    saves: { str: 1, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: { spear: { name: 'Spear', atk: 3, dice: '1d6', mod: 1, type: 'piercing', reach: 5 } },
    multi: 1, src: 'SRD 5.1 Guard (CR 1/8); content/monsters.json guard (the Line Guard)'
  },
  veteran: {
    name: 'Sergeant', sheet: 'veteran_p1', cr: '3', ac: 17, hp: 58, speed: 30, size: 1, reach: 5,
    abil: { str: 16, dex: 13, con: 14, int: 10, wis: 11, cha: 10 }, init: 1, perception: 12,
    saves: { str: 3, dex: 1, con: 2, int: 0, wis: 0, cha: 0 },
    attacks: { longsword: { name: 'Longsword', atk: 5, dice: '1d8', mod: 3, type: 'slashing', reach: 5 }, shortsword: { name: 'Shortsword', atk: 5, dice: '1d6', mod: 3, type: 'piercing', reach: 5 } },
    multi: ['longsword', 'longsword', 'shortsword'], src: 'SRD 5.1 Veteran (CR 3); content/monsters.json veteran (the line\'s Sergeant)'
  },
  // the Snoot's glory-seekers on the road south (events.js S.snoot)
  gloryseeker: {
    name: 'Glory-Seeker', sheet: 'gloryseeker_p1', cr: '1', ac: 15, hp: 38, speed: 30, size: 1, reach: 5,
    abil: { str: 16, dex: 12, con: 13, int: 7, wis: 10, cha: 9 }, init: 1, perception: 10,
    saves: { str: 3, dex: 1, con: 1, int: -2, wis: 0, cha: -1 },
    attacks: { spear: { name: 'Spear', atk: 5, dice: '1d8', mod: 3, type: 'piercing', reach: 5 }, bite: { name: 'Bite', atk: 5, dice: '1d4', mod: 3, type: 'piercing', reach: 5 } },
    multi: ['spear', 'bite'], src: 'content/monsters.json gloryseeker (the 8-bit game\'s own: the Snoot\'s young blood, from the SRD gnoll)'
  },
  gnoll: {
    name: 'Gnoll', sheet: 'gnoll_p1', cr: '1/2', ac: 15, hp: 22, speed: 30, size: 1, reach: 5,
    abil: { str: 14, dex: 12, con: 11, int: 6, wis: 10, cha: 7 }, init: 1, perception: 10,
    saves: { str: 2, dex: 1, con: 0, int: -2, wis: 0, cha: -2 },
    attacks: { spear: { name: 'Spear', atk: 4, dice: '1d6', mod: 2, type: 'piercing', reach: 5 }, bite: { name: 'Bite', atk: 4, dice: '1d4', mod: 2, type: 'piercing', reach: 5 } },
    multi: 1, src: 'SRD 5.1 Gnoll (CR 1/2): spear or bite; content/monsters.json gnoll', todo: 'Rampage (a bite after it drops someone) is not read'
  },
  hyena: {
    name: 'Hyena', sheet: 'hyena_p1', cr: '0', ac: 11, hp: 5, speed: 50, size: 1, reach: 5,
    abil: { str: 11, dex: 13, con: 12, int: 2, wis: 12, cha: 5 }, init: 1, perception: 13,
    saves: { str: 0, dex: 1, con: 1, int: -4, wis: 1, cha: -3 },
    attacks: { bite: { name: 'Bite', atk: 2, dice: '1d6', mod: 0, type: 'piercing', reach: 5 } },
    multi: 1, packTactics: true, src: 'SRD 5.1 Hyena (CR 0, Pack Tactics); content/monsters.json hyena'
  },
  // the night crew in the Burial (deep.js, The One Law): Hask, his crew, and the wheelwright, who bolts when Hask falls
  hask: {
    named: true, name: 'Hask', sheet: 'hask_p1', cr: '2', ac: 15, hp: 65, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 16, con: 14, int: 14, wis: 11, cha: 14 }, init: 3, perception: 10,
    saves: { str: 4, dex: 5, con: 2, int: 2, wis: 0, cha: 2 },
    attacks: { bar: { name: 'Pry-bar', atk: 5, dice: '1d6', mod: 3, type: 'bludgeoning', reach: 5 }, knife: { name: 'Knife', atk: 5, dice: '1d4', mod: 3, type: 'piercing', reach: 5 } },
    multi: ['bar', 'bar', 'knife'], src: 'content/monsters.json hask (the SRD 5.1 Bandit Captain as the night crew\'s boss)'
  },
  wheelwright: {
    name: 'Wheelwright', sheet: 'wheelwright_p1', cr: '1', ac: 12, hp: 27, speed: 30, size: 1, reach: 5,
    abil: { str: 10, dex: 15, con: 10, int: 12, wis: 14, cha: 16 }, init: 2, perception: 16,
    saves: { str: 0, dex: 2, con: 0, int: 1, wis: 2, cha: 3 },
    attacks: { mallet: { name: 'Mallet', atk: 4, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 } },
    multi: ['mallet', 'mallet'], bolts: 'hask',
    src: 'content/monsters.json wheelwright (the SRD 5.1 Spy): when Hask falls he runs for the stair (the map\'s exit), dashing'
  },
  crewman: {
    name: 'Crewman', sheet: 'crewman_p1', cr: '1/2', ac: 11, hp: 32, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 11, con: 14, int: 10, wis: 10, cha: 11 }, init: 0, perception: 10,
    saves: { str: 2, dex: 0, con: 2, int: 0, wis: 0, cha: 0 },
    attacks: { bar: { name: 'Pry-bar', atk: 4, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 } },
    multi: ['bar', 'bar'], src: 'content/monsters.json crewman (the SRD 5.1 Thug)'
  },
  // holding the stair at the siphon (deep.js S.holdStair): the night crews come down the daytime way
  crewboss: {
    name: 'Crew Boss', sheet: 'hask_p1', cr: '1/2', ac: 11, hp: 32, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 11, con: 14, int: 10, wis: 10, cha: 11 }, init: 0, perception: 10,
    saves: { str: 2, dex: 0, con: 2, int: 0, wis: 0, cha: 0 },
    attacks: { mace: { name: 'Mace', atk: 4, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 } },
    multi: 1, src: 'content/monsters.json crewboss (a Thug with one blow); Hask\'s sheet'
  },
  thug: {
    name: 'Thug', sheet: 'crewman_p1', cr: '1/2', ac: 11, hp: 32, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 11, con: 14, int: 10, wis: 10, cha: 11 }, init: 0, perception: 10,
    saves: { str: 2, dex: 0, con: 2, int: 0, wis: 0, cha: 0 },
    attacks: { mace: { name: 'Mace', atk: 4, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 } },
    multi: ['mace', 'mace'], src: 'SRD 5.1 Thug (CR 1/2); content/monsters.json thug'
  },
  robber: {
    name: 'Night Crew', sheet: 'wheelwright_p1', cr: '1/8', ac: 12, hp: 11, speed: 30, size: 1, reach: 5,
    abil: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 }, init: 1, perception: 10,
    saves: { str: 0, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: { knife: { name: 'Knife', atk: 3, dice: '1d4', mod: 1, type: 'piercing', reach: 5 } },
    multi: 1, src: 'content/monsters.json robber (the SRD 5.1 Bandit with a knife)'
  },
  // ------------------------------------------------------------------ batch five (09-27): the snared lad, the grick den, the bulette, the cloaker, the wagon yard
  wolfspider: {
    name: 'Wolf Spider', sheet: 'wolfspider_p1', cr: '1/4', ac: 13, hp: 11, speed: 40, size: 1, reach: 5,
    abil: { str: 12, dex: 16, con: 13, int: 3, wis: 12, cha: 4 }, init: 3, perception: 13,
    saves: { str: 1, dex: 3, con: 1, int: -4, wis: 1, cha: -3 },
    attacks: { bite: { name: 'Bite', atk: 3, dice: '1d6', mod: 1, type: 'piercing', reach: 5, save: { ab: 'con', dc: 11, dice: '2d6', type: 'poison', half: true } } },
    multi: 1, webWalker: true, src: 'SRD 5.1 Giant Wolf Spider (CR 1/4); content/monsters.json wolfspider'
  },
  grick: {
    name: 'Grick', sheet: 'grick_p1', cr: '2', ac: 14, hp: 27, speed: 30, size: 1, reach: 5,
    abil: { str: 14, dex: 14, con: 11, int: 3, wis: 14, cha: 5 }, init: 2, perception: 12,
    saves: { str: 2, dex: 2, con: 0, int: -4, wis: 2, cha: -3 },
    attacks: { tentacles: { name: 'Tentacles', atk: 4, dice: '2d6', mod: 2, type: 'slashing', reach: 5 }, beak: { name: 'Beak', atk: 4, dice: '1d6', mod: 2, type: 'piercing', reach: 5 } },
    multi: ['tentacles', 'beak'], resist: ['mundane'],
    src: 'SRD 5.1 Grick (CR 2): tentacles then beak; resists bludgeoning, piercing and slashing from non-magical weapons (read: battle.js); Stone Camouflage as starting hidden (the fight\'s foe: hidden)'
  },
  bulette: {
    name: 'Bulette', sheet: 'bulette_p1', cr: '5', ac: 17, hp: 94, speed: 40, size: 2, reach: 5,
    abil: { str: 19, dex: 11, con: 21, int: 2, wis: 10, cha: 5 }, init: 0, perception: 16,
    saves: { str: 4, dex: 0, con: 5, int: -4, wis: 0, cha: -3 },
    attacks: { bite: { name: 'Bite', atk: 7, dice: '4d12', mod: 4, type: 'piercing', reach: 5 } },
    multi: 1, leap: { dc: 16, dice: '6d6', targets: 2, range: 40, recharge: 5 },
    src: 'SRD 5.1 Bulette (CR 5, Large); content/monsters.json bulette (its Deadly Leap as the 8-bit game reads it: DEX 16, 6d6, two of them, half on a save; recharge 5-6)', todo: 'the burrow and the knockdown are not read'
  },
  cloaker: {
    name: 'Cloaker', sheet: 'cloaker_p1', cr: '8', ac: 14, hp: 78, speed: 40, size: 2, reach: 5,
    abil: { str: 17, dex: 15, con: 12, int: 13, wis: 12, cha: 14 }, init: 2, perception: 11,
    saves: { str: 3, dex: 2, con: 1, int: 1, wis: 1, cha: 2 },
    attacks: {
      bite: { name: 'Bite', atk: 6, dice: '2d6', mod: 3, type: 'piercing', reach: 5, grapple: { dc: 16, max: 1 }, autoHitHeld: true },
      tail: { name: 'Tail', atk: 6, dice: '1d8', mod: 3, type: 'slashing', reach: 10 }
    },
    multi: ['bite', 'tail'], moan: { dc: 13, recharge: 5 }, phantasms: 'bloodied', transfer: true,
    src: 'SRD 5.1 Cloaker (CR 8, fly 40 read as moving 40); content/monsters.json cloaker: the bite engulfs (read as a grip, escape DC 16, its bite then always lands), Damage Transfer, Moan (WIS 13, frightened), Phantasms once when bloodied', todo: 'light sensitivity and the engulfed one\'s blindness are not read'
  },
  amara: {
    named: true, name: 'Amara', sheet: 'amara_p1', cr: '3', ac: 13, hp: 38, speed: 30, size: 1, reach: 5,
    abil: { str: 9, dex: 14, con: 12, int: 12, wis: 11, cha: 17 }, init: 2, perception: 10,
    saves: { str: -1, dex: 2, con: 1, int: 1, wis: 2, cha: 5 },
    attacks: { blast: { name: 'Eldritch Blast', atk: 6, dice: '1d10', mod: 3, type: 'force', ranged: true, spell: true, range: [120, 120], fx: 'fire' } },
    multi: ['blast', 'blast'], flees: true,
    src: 'content/monsters.json amara (the 8-bit game\'s own warlock): two beams of Eldritch Blast; bloodied, she runs for the horses', todo: 'her Darkness is not read'
  },
  willem: {
    named: true, name: 'Willem Glass', sheet: 'willem_p1', cr: '3', ac: 12, hp: 30, speed: 30, size: 1, reach: 5,
    abil: { str: 9, dex: 14, con: 12, int: 17, wis: 12, cha: 11 }, init: 2, perception: 11,
    saves: { str: -1, dex: 2, con: 1, int: 5, wis: 3, cha: 0 },
    attacks: { frost: { name: 'Ray of Frost', atk: 6, dice: '2d8', mod: 0, type: 'cold', ranged: true, spell: true, range: [60, 60], fx: 'bolt' } },
    multi: 1, flees: true, phantasms: 'start',
    src: 'content/monsters.json willem (the 8-bit game\'s own illusionist): Ray of Frost; Phantasms at once (three false images); he gives ground toward the horses, shooting', todo: 'the ray\'s slow is not read'
  },
  // ------------------------------------------------------------------ batch six (09-27): the causeway, the cut, the roper, the settling pools
  // the spirit naga (deep.js S.naga, leg four): "Halfway over, the water stands up." It keeps to the black water (bound '~'),
  // bites at ten feet, and has the spell-weaver's routine (ai.js weaver): Hold once, lightning along the water
  naga: {
    name: 'Spirit Naga', sheet: 'naga_p1', cr: '8', ac: 15, hp: 75, speed: 40, size: 2, reach: 10,
    abil: { str: 18, dex: 17, con: 14, int: 16, wis: 15, cha: 16 }, init: 3, perception: 12,
    saves: { str: 4, dex: 6, con: 5, int: 3, wis: 5, cha: 6 },
    attacks: { bite: { name: 'Bite', atk: 7, dice: '1d6', mod: 4, type: 'piercing', reach: 10, save: { ab: 'con', dc: 13, dice: '7d8', type: 'poison', half: true } } },
    multi: 1, immune: ['poison'], bound: '~',
    weave: { bolt: { dc: 14, dice: '8d6', type: 'lightning', len: 100, recharge: 5, text: 'speaks, and lightning runs along the water!', again: 'gathers the storm again' }, hold: { dc: 14, range: 60, text: 'turns its eyes on them' } },
    src: 'SRD 5.1 Spirit Naga (CR 8); content/monsters.json naga (its spells as the 8-bit game has them: Hold once, a line of lightning on a recharge)', todo: 'its rejuvenation is not read'
  },
  // the made road's cut (deep.js S.elemental): "the cut's walls move"
  earthelemental: {
    name: 'Earth Elemental', sheet: 'earthelemental_p1', cr: '5', ac: 17, hp: 126, speed: 30, size: 2, reach: 10,
    abil: { str: 20, dex: 8, con: 20, int: 5, wis: 10, cha: 5 }, init: -1, perception: 10,
    saves: { str: 5, dex: -1, con: 5, int: -3, wis: 0, cha: -3 },
    attacks: { slam: { name: 'Slam', atk: 8, dice: '2d8', mod: 5, type: 'bludgeoning', reach: 10 } },
    multi: ['slam', 'slam'], resist: ['mundane'], vulnerable: ['thunder'], immune: ['poison'],
    src: 'SRD 5.1 Earth Elemental (CR 5, Large, slam reach 10 ft); content/monsters.json earthelemental: resists plain steel, thunder hurts it double, immune to poison', todo: 'Earth Glide (through the rock) is not read'
  },
  // the roper on leg two's fork (deep.js S.roper): it looks like the stalagmites until it doesn't (hidden at the start)
  roper: {
    name: 'Roper', sheet: 'roper_p1', cr: '5', ac: 20, hp: 93, speed: 10, size: 2, reach: 5,
    abil: { str: 18, dex: 8, con: 17, int: 7, wis: 16, cha: 6 }, init: -1, perception: 16,
    saves: { str: 4, dex: -1, con: 3, int: -2, wis: 3, cha: -2 },
    attacks: {
      tendril: { name: 'Tendril', atk: 7, dice: '1d1', mod: -1, type: 'bludgeoning', reach: 50, grapple: { dc: 15, max: 2 }, reel: true },
      bite: { name: 'Bite', atk: 7, dice: '4d8', mod: 4, type: 'piercing', reach: 5 }
    },
    multi: ['tendril', 'tendril', 'bite'],
    src: 'SRD 5.1 Roper (CR 5, Large): two tendrils at 50 ft (grappled, restrained, escape DC 15; Reel drags them in) and the bite; content/monsters.json roper', todo: 'the tendrils\' STR weakening is not read'
  },
  darkmantle: {
    name: 'Darkmantle', sheet: 'darkmantle_p1', cr: '1/2', ac: 11, hp: 22, speed: 30, size: 1, reach: 5,
    abil: { str: 16, dex: 12, con: 13, int: 2, wis: 10, cha: 5 }, init: 1, perception: 10,
    saves: { str: 3, dex: 1, con: 1, int: -4, wis: 0, cha: -3 },
    attacks: { crush: { name: 'Crush', atk: 5, dice: '1d6', mod: 3, type: 'bludgeoning', reach: 5 } },
    multi: 1, src: 'SRD 5.1 Darkmantle (CR 1/2, fly 30 read as moving 30); content/monsters.json darkmantle', todo: 'its Darkness Aura and the crush\'s blinding hold are not read'
  },
  // the Warrens' settling pools (events.js, warrens_d): the ochre jelly and the gray ooze
  ochrejelly: {
    name: 'Ochre Jelly', sheet: 'ochrejelly_p1', small: 'ochrejellym_p1', cr: '2', ac: 8, hp: 45, speed: 10, size: 2, reach: 5,
    abil: { str: 15, dex: 6, con: 14, int: 2, wis: 6, cha: 1 }, init: -2, perception: 8,
    saves: { str: 2, dex: -2, con: 2, int: -4, wis: -2, cha: -5 },
    attacks: { pseudopod: { name: 'Pseudopod', atk: 4, dice: '2d6', mod: 2, type: 'bludgeoning', extra: '1d6', extraType: 'acid', reach: 5 } },
    multi: 1, resist: ['acid'], immune: ['lightning', 'slashing'], split: true,
    src: 'SRD 5.1 Ochre Jelly (CR 2, Large): Split on slashing or lightning, like the pudding; content/monsters.json ochrejelly'
  },
  grayooze: {
    name: 'Gray Ooze', sheet: 'grayooze_p1', cr: '1/2', ac: 8, hp: 22, speed: 10, size: 1, reach: 5,
    abil: { str: 12, dex: 6, con: 16, int: 1, wis: 6, cha: 2 }, init: -2, perception: 8,
    saves: { str: 1, dex: -2, con: 3, int: -5, wis: -2, cha: -4 },
    attacks: { pseudopod: { name: 'Pseudopod', atk: 3, dice: '1d6', mod: 1, type: 'bludgeoning', extra: '2d6', extraType: 'acid', reach: 5 } },
    multi: 1, resist: ['acid', 'cold', 'fire'],
    src: 'SRD 5.1 Gray Ooze (CR 1/2); content/monsters.json grayooze', todo: 'its acid corroding metal is not read'
  },
  // ------------------------------------------------------------------ the water, hand-waved (09-27, Griz: "we'll probably hand wave the chuul fight
  // rather than add swimming"): what lives in the water keeps to it or comes out of it; nobody swims
  // the Keeper of the flooded stair (events.js S.stair, Pete's Five): "It never left its water; it only let go."
  keeper: {
    name: 'The Keeper', named: true, sheet: 'keeper_p1', cr: '3', ac: 13, hp: 58, speed: 60, size: 2, reach: 10,
    abil: { str: 17, dex: 16, con: 13, int: 11, wis: 10, cha: 10 }, init: 3, perception: 10,
    saves: { str: 3, dex: 3, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: {
      constrict: { name: 'Constrict', atk: 5, dice: '1d6', mod: 3, type: 'bludgeoning', reach: 10, grapple: { dc: 13, max: 1 } },
      drown: { name: 'Drag Under', atk: 5, dice: '2d6', mod: 0, type: 'bludgeoning', reach: 10, needsHeld: true, autoHitHeld: true }
    },
    multi: ['constrict', 'drown'], resist: ['fire'], immune: ['poison'], bound: '~',
    src: 'content/monsters.json keeper (the 8-bit game\'s own, the SRD 5.1 Water Weird\'s numbers): Constrict grips (escape DC 13), Drag Under always lands on the one it holds; it keeps to its water and starts unseen in it'
  },
  // the chuul off the point (events.js S.lakeFight, the base game's capstone): it comes up out of the deep and can come ashore
  chuul: {
    name: 'Chuul', sheet: 'chuul_p1', cr: '4', ac: 16, hp: 93, speed: 30, size: 2, reach: 10,
    abil: { str: 19, dex: 10, con: 16, int: 5, wis: 11, cha: 5 }, init: 0, perception: 14,
    saves: { str: 4, dex: 0, con: 3, int: -3, wis: 0, cha: -3 },
    attacks: {
      pincer: { name: 'Pincer', atk: 6, dice: '2d6', mod: 4, type: 'bludgeoning', reach: 10, grapple: { dc: 14, max: 2 } },
      tentacles: { name: 'Tentacles', atk: 6, dice: '1d1', mod: -1, type: 'poison', reach: 10, needsHeld: true, autoHitHeld: true, paralyze: { dc: 13 } }
    },
    multi: ['pincer', 'pincer', 'tentacles'], immune: ['poison'], swims: true,
    src: 'SRD 5.1 Chuul (CR 4, Large): two pincers (reach 10, grappled, escape DC 14), the tentacles on one it holds (CON 13 or poisoned and paralyzed); content/monsters.json chuul. It swims: the water does not slow it'
  },
  // the Hex floor (events.js, Fight Night's floor): brawlers and a card bruiser, the ladder's level-1 set piece
  brawler: {
    name: 'Bar Brawler', sheet: 'brawler_p1', cr: '1/8', ac: 12, hp: 11, speed: 30, size: 1, reach: 5,
    abil: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 }, init: 1, perception: 10,
    saves: { str: 0, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: { fists: { name: 'Fists', atk: 3, dice: '1d4', mod: 1, type: 'bludgeoning', reach: 5 } },
    multi: 1, src: 'content/monsters.json brawler (the Hex floor)'
  },
  cardbruiser: {
    name: 'Card Bruiser', sheet: 'crewman_p1', cr: '1/4', ac: 12, hp: 22, speed: 30, size: 1, reach: 5,
    abil: { str: 14, dex: 12, con: 13, int: 9, wis: 10, cha: 10 }, init: 1, perception: 10,
    saves: { str: 2, dex: 1, con: 1, int: -1, wis: 0, cha: 0 },
    attacks: { club: { name: 'Cudgel', atk: 4, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 } },
    multi: 1, src: 'content/monsters.json cardbruiser (the Hex card\'s first bout); the crewman\'s sheet'
  }
};
