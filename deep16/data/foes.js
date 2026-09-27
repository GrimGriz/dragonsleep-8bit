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
  }
};
