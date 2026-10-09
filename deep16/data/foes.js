/* DEEP16 â€” the POC's three foes (RULED 09-26d, Griz: "agreed" -- two drow and a phase spider).
   The phase spider is the SRD 5.1 block as written. The drow are the dwarven expansion's own Drow Blade-Captain
   (content/monsters.json `drowcaptain`: game-original from SRD pieces, CR 5) given the SRD drow's hand crossbow and
   Faerie Fire -- a plain SRD drow (13 HP) falls in one round to four heroes at level 9 and would test nothing.
   PROPOSED by the code seat for the POC; fold to invented.json when the branch merges. */
'use strict';
(window.D16 = window.D16 || {}).FOES = {
  drow: {
    name: 'Drow Captain', type: 'humanoid', sheet: 'drow_p0', cr: '5', ac: 18, hp: 71, speed: 30, size: 1, reach: 5, darkvision: 120,
    abil: { str: 13, dex: 18, con: 14, int: 11, wis: 13, cha: 12 }, init: 4, perception: 14,
    saves: { str: 1, dex: 4, con: 2, int: 0, wis: 1, cha: 1 },
    attacks: {
      shortsword: { name: 'Shortsword', atk: 7, dice: '1d6', mod: 4, type: 'piercing', extra: '2d6', extraType: 'poison', reach: 5 },
      crossbow: { name: 'Hand Crossbow', atk: 7, dice: '1d6', mod: 4, type: 'piercing', range: [30, 120], ranged: true, poison: { dc: 13 } }
    },
    multi: 2, faerieFire: { dc: 12, range: 60, cube: 4 }, darkness: { r: 15, range: 60, chance: 0.3 }, lightSensitive: true, fey: true, // (innate Darkness once on the 8-bit's chance; sunlight sensitivity: crossed 09-28; fey: Fey Ancestry, no magic puts it to sleep -- 10-06, Eyebite could)
    src: 'content/monsters.json drowcaptain (game-original, CR 5) + SRD 5.1 Drow (hand crossbow, poison, Faerie Fire)'
  },
  phasespider: {
    name: 'Phase Spider', type: 'monstrosity', sheet: 'phasespider_p1', cr: '3', ac: 13, hp: 32, speed: 30, climbs: 30, size: 2, reach: 5, darkvision: 60,
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
    name: 'Drider', type: 'monstrosity', sheet: 'drider_p1', cr: '6', ac: 19, hp: 123, speed: 30, climbs: 30, size: 2, reach: 5, darkvision: 120,
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
    name: 'Giant Rat', type: 'beast', sheet: 'giantrat_p1', cr: '1/8', ac: 12, hp: 7, speed: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 7, dex: 15, con: 11, int: 2, wis: 10, cha: 4 }, init: 2, perception: 10,
    saves: { str: -2, dex: 2, con: 0, int: -4, wis: 0, cha: -3 },
    attacks: { bite: { name: 'Bite', atk: 4, dice: '1d4', mod: 2, type: 'piercing', reach: 5 } },
    multi: 1, packTactics: true,
    src: 'SRD 5.1 Giant Rat (CR 1/8); content/monsters.json giantrat. Pack Tactics is read (rules.js edges, 09-27)'
  },
  giantspider: {
    name: 'Giant Spider', type: 'beast', sheet: 'giantspider_p1', cr: '1', ac: 14, hp: 26, speed: 30, climbs: 30, size: 2, reach: 5, darkvision: 60, blindsight: 10,
    abil: { str: 14, dex: 16, con: 12, int: 2, wis: 11, cha: 4 }, init: 3, perception: 10,
    saves: { str: 2, dex: 3, con: 1, int: -4, wis: 0, cha: -3 },
    attacks: {
      bite: { name: 'Bite', atk: 5, dice: '1d8', mod: 3, type: 'piercing', reach: 5, save: { ab: 'con', dc: 11, dice: '2d8', type: 'poison', half: true } }
    },
    multi: 1, web: { atk: 5, range: [30, 60], dc: 12, recharge: 5 }, webWalker: true, spiderClimb: true,
    src: 'SRD 5.1 Giant Spider (CR 1); content/monsters.json giantspider. Web is read (09-27, ai.js webShot): a ranged attack, restrained, escape DC 12, recharge 5-6. Spider Climb (10-05 night): the climb speed up or down any face with no check, and (ours) no blow shakes it off the face -- battle.js hurt; a push still does. Web Walker: grid.js stepCost, a web never slows it. The SRD gives it no faster climb on a web: Griz\'s "spider spiderclimb faster on web per SRD" read as these two traits, the seat\'s read'
  },
  // ------------------------------------------------------------------ the 8-bit game's bosses, set pieces for the ladder (09-27, the ladder seat)
  // The braiding ettercap of Web Gulch (events.js S.ettercap: it fights beside a giant spider). SRD 5.1 as written; its
  // Web in the SRD's form (a ranged attack, where the 8-bit game rolls a DEX save).
  ettercap: {
    name: 'Ettercap', type: 'monstrosity', sheet: 'ettercap_p2', cr: '2', ac: 13, hp: 44, speed: 30, climbs: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 14, dex: 15, con: 13, int: 7, wis: 12, cha: 8 }, init: 2, perception: 13,
    saves: { str: 2, dex: 2, con: 1, int: -2, wis: 1, cha: -1 },
    attacks: {
      bite: { name: 'Bite', atk: 4, dice: '1d8', mod: 2, type: 'piercing', extra: '1d8', extraType: 'poison', reach: 5, poison: { dc: 11, repeat: true } },
      claws: { name: 'Claws', atk: 4, dice: '2d4', mod: 2, type: 'slashing', reach: 5 }
    },
    multi: ['bite', 'claws'], web: { atk: 4, range: [30, 60], dc: 11, recharge: 5 }, webWalker: true,
    src: 'SRD 5.1 Ettercap (CR 2); content/monsters.json ettercap (wiki/web-gulch.md, the braiding ettercap). Spider Climb read as its climb speed (`climbs`): up and down any cliff on a map that lets them be climbed, at no extra cost and with no check -- 10-04'
  },
  // The landlord of the Warrens' deepest pool (events.js: "It rises from its pool... It will not leave the water").
  // SRD 5.1 Otyugh as the 8-bit game has it (no disease, no stench): bite and two tentacles, a tentacle grips (up to two),
  // and on half its turns it slams what it holds (CON 14, 2d6+3, stunned). bound '~': it keeps to its pool, not slowed there.
  otyugh: {
    name: 'Otyugh', type: 'aberration', sheet: 'otyugh_p2', cr: '5', ac: 14, hp: 114, speed: 30, size: 2, reach: 5, darkvision: 120,
    abil: { str: 16, dex: 11, con: 19, int: 6, wis: 13, cha: 6 }, init: 0, perception: 11,
    saves: { str: 3, dex: 0, con: 7, int: -2, wis: 1, cha: -2 },
    attacks: {
      bite: { name: 'Bite', atk: 6, dice: '2d8', mod: 3, type: 'piercing', reach: 5 },
      tentacle: { name: 'Tentacle', atk: 6, dice: '1d8', mod: 3, type: 'bludgeoning', extra: '1d8', extraType: 'piercing', reach: 10, grapple: { dc: 13, max: 2, size: 'M' } }
    },
    multi: ['tentacle', 'tentacle', 'bite'], slam: { dc: 14, dice: '2d6+3', chance: 0.5 }, bound: '~',
    src: 'SRD 5.1 Otyugh (CR 5); content/monsters.json otyugh (the landlord, wiki/the-warrens.md). Tentacle reach 10 ft (SRD); the bite\'s disease and the telepathy left off, as in the 8-bit game'
  },
  wolf: {
    name: 'Wolf', type: 'beast', sheet: 'wolf_p1', cr: '1/4', ac: 13, hp: 11, speed: 40, size: 1, reach: 5,
    abil: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 }, init: 2, perception: 13,
    saves: { str: 1, dex: 2, con: 1, int: -4, wis: 1, cha: -2 },
    attacks: { bite: { name: 'Bite', atk: 4, dice: '2d4', mod: 2, type: 'piercing', reach: 5, prone: 11 } },
    multi: 1, packTactics: true,
    src: 'SRD 5.1 Wolf (CR 1/4); content/monsters.json wolf. Pack Tactics is read; the bite\'s knockdown (STR 11, prone) is read (09-27)'
  },
  skeleton: {
    name: 'Skeleton', type: 'undead', sheet: 'skeleton_p1', cr: '1/4', ac: 13, hp: 13, speed: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 }, init: 2, perception: 9,
    saves: { str: 0, dex: 2, con: 2, int: -2, wis: -1, cha: -3 },
    attacks: {
      shortsword: { name: 'Shortsword', atk: 4, dice: '1d6', mod: 2, type: 'piercing', reach: 5 },
      shortbow: { name: 'Shortbow', atk: 4, dice: '1d6', mod: 2, type: 'piercing', range: [80, 320], ranged: true }
    },
    multi: 1, vulnerable: ['bludgeoning'], immune: ['poison'], condImmune: ['poisoned', 'exhaustion'],
    src: 'SRD 5.1 Skeleton (CR 1/4): armor scraps AC 13, shortsword (the sheet carries the pack\'s blade and small shield), shortbow +4 1d6+2 80/320 (loosed when nothing is in reach: ai.js volley; 10-02 runner). Vulnerable and immune are read (battle.js typed(), 09-27); condition immunities poisoned and exhaustion (SRD 5.1, 10-02 runner)'
  },
  troll: {
    name: 'Troll', type: 'giant', sheet: 'troll_p1', cr: '5', ac: 15, hp: 84, speed: 30, climbs: 15, size: 2, reach: 5, darkvision: 60, // (climbs 15 since 10-05, Griz: "1 and 2" -- three turns up the Edifice's 45 ft, not five; before that 10: ours, not the SRD's -- it digs its claws into the stone, 10 ft a turn, and clings; Griz, 10-04 night: "a slow climb speed, like they're forcefully digging their way into the walls")
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
    name: 'Broodmother', type: 'monstrosity', sheet: 'broodmother_p1', cr: '6', ac: 15, hp: 120, speed: 30, size: 3, reach: 5, darkvision: 60,
    abil: { str: 19, dex: 15, con: 16, int: 7, wis: 12, cha: 6 }, init: 2, perception: 11,
    saves: { str: 4, dex: 2, con: 3, int: -2, wis: 1, cha: -2 },
    attacks: {
      bite: { name: 'Bite', atk: 7, dice: '2d10', mod: 4, type: 'piercing', reach: 5, save: { ab: 'con', dc: 14, dice: '6d8', type: 'poison', half: true } }
    },
    multi: ['bite', 'bite'], web: { atk: 7, range: [30, 60], dc: 14, recharge: 5 }, webWalker: true, jaunt: { rounds: 4, text: 'folds herself into the rock.' },
    src: 'content/monsters.json broodmother (game-original from the SRD 5.1 Phase Spider at CR 6); its Web in the SRD\'s attack form; the jaunt when bloodied, once, four turns in the rock, out beside the weakest (js/traits.js, 09-28)'
  },
  // the cut seal camp (deep.js S.cutSeal): budgeted hard for four at 5
  bugbearchief: {
    name: 'Bugbear Chief', type: 'humanoid', sheet: 'bugbearchief_p2', cr: '3', ac: 17, hp: 65, speed: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 17, dex: 14, con: 14, int: 11, wis: 12, cha: 11 }, init: 2, perception: 11,
    saves: { str: 3, dex: 2, con: 2, int: 0, wis: 1, cha: 0 },
    attacks: { morningstar: { name: 'Morningstar', atk: 5, dice: '2d8', mod: 3, type: 'piercing', reach: 5 } },
    multi: ['morningstar', 'morningstar'], surprise: '2d6',
    src: 'content/monsters.json bugbearchief (game-original from SRD 5.1 pieces: the Bugbear, two attacks); Surprise Attack as the 8-bit game reads it (+2d6 in the first round)'
  },
  hobsergeant: {
    name: 'Hobgoblin Sergeant', type: 'humanoid', sheet: 'hobsergeant_p2', cr: '3', ac: 18, hp: 39, speed: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 15, dex: 14, con: 14, int: 12, wis: 10, cha: 13 }, init: 2, perception: 10,
    saves: { str: 2, dex: 2, con: 2, int: 1, wis: 0, cha: 1 },
    attacks: { longsword: { name: 'Longsword', atk: 5, dice: '1d8', mod: 2, type: 'slashing', reach: 5 } },
    multi: ['longsword', 'longsword'], martial: '2d6',
    src: 'content/monsters.json hobsergeant (game-original from SRD 5.1 pieces: the Hobgoblin and the Veteran); Martial Advantage'
  },
  hobgoblin: {
    name: 'Hobgoblin', type: 'humanoid', sheet: 'hobgoblin_p2', cr: '1/2', ac: 18, hp: 11, speed: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 13, dex: 12, con: 12, int: 10, wis: 10, cha: 9 }, init: 1, perception: 10,
    saves: { str: 1, dex: 1, con: 1, int: 0, wis: 0, cha: -1 },
    attacks: {
      longsword: { name: 'Longsword', atk: 3, dice: '1d8', mod: 1, type: 'slashing', reach: 5 },
      longbow: { name: 'Longbow', atk: 3, dice: '1d8', mod: 1, type: 'piercing', range: [150, 600], ranged: true }
    },
    multi: 1, martial: '2d6',
    src: 'SRD 5.1 Hobgoblin (CR 1/2): longsword, Martial Advantage; the longbow +3 1d8+1 150/600 (the 8-bit game left it off; SRD 5.1, loosed when nothing is in reach: ai.js volley; 10-02 runner); content/monsters.json hobgoblin'
  },
  worg: {
    name: 'Worg', type: 'monstrosity', sheet: 'worg_p1', cr: '1/2', ac: 13, hp: 26, speed: 50, size: 2, reach: 5, darkvision: 60,
    abil: { str: 16, dex: 13, con: 13, int: 7, wis: 11, cha: 8 }, init: 1, perception: 14,
    saves: { str: 3, dex: 1, con: 1, int: -2, wis: 0, cha: -1 },
    attacks: { bite: { name: 'Bite', atk: 5, dice: '2d6', mod: 3, type: 'piercing', reach: 5, prone: 13 } },
    multi: 1,
    src: 'SRD 5.1 Worg (CR 1/2, Large, speed 50); content/monsters.json worg; the bite\'s knockdown (STR 13, prone) is read (09-27)'
  },
  // Third Lamp (deep.js S.raid) and the fallback line (S.fallback): the spell-weaver has her own routine (ai.js weaver);
  // the plain drow fight by brute() (a blade in reach, else the hand crossbow). Their Darkness and light sensitivity are not read.
  spellweaver: {
    name: 'Drow Spell-Weaver', type: 'humanoid', sheet: 'spellweaver_p1', cr: '6', ac: 12, hp: 45, speed: 30, size: 1, reach: 5, darkvision: 120,
    abil: { str: 9, dex: 14, con: 11, int: 17, wis: 12, cha: 11 }, init: 2, perception: 11,
    saves: { str: -1, dex: 2, con: 0, int: 3, wis: 1, cha: 0 },
    attacks: { firebolt: { name: 'Fire Bolt', atk: 6, dice: '2d10', mod: 0, type: 'fire', ranged: true, spell: true, range: [120, 120], fx: 'fire' } },
    multi: 1, fey: true,
    // the SRD Mage's list (RULED 09-28: the stat blocks' lists as the NPC lists; the 8-bit's Lightning Bolt for Fireball, and Hold Person):
    // a 9th-level caster, INT, DC 14, +6 -- cast through the real spells by the class tactics (js/tactics.js); the old weave retired
    caster: { lvl: 9, ab: 'int', dc: 14, atk: 6, slots: [4, 3, 3, 3, 1], known: ['firebolt', 'light', 'magicmissile', 'shield', 'mageArmor', 'mistystep', 'holdperson', 'lightningbolt', 'greaterinvisibility', 'icestorm', 'coneofcold'] },
    darkness: { r: 15, range: 60, chance: 0.35 }, lightSensitive: true, // (the 8-bit's `darkness` special, once; sunlight sensitivity: crossed 09-28)
    src: 'content/monsters.json spellweaver (game-original, CR 6): Fire Bolt; a line of lightning (recharge 5-6, DEX 14, 8d6); Hold once (WIS 14, paralyzed, a save each turn)'
  },
  drowling: {
    name: 'Drow', type: 'humanoid', sheet: 'drow_p1', humanoid: true, cr: '1/4', ac: 15, hp: 13, speed: 30, size: 1, reach: 5, darkvision: 120,
    abil: { str: 10, dex: 14, con: 10, int: 11, wis: 11, cha: 12 }, init: 2, perception: 12,
    saves: { str: 0, dex: 2, con: 0, int: 0, wis: 0, cha: 1 },
    attacks: {
      shortsword: { name: 'Shortsword', atk: 4, dice: '1d6', mod: 2, type: 'piercing', reach: 5 },
      crossbow: { name: 'Hand Crossbow', atk: 4, dice: '1d6', mod: 2, type: 'piercing', range: [30, 120], ranged: true, poison: { dc: 13 } }
    },
    multi: 1, fey: true, darkness: { r: 15, range: 60, chance: 0.2 }, lightSensitive: true, // (innate Darkness once on the 8-bit's chance; sunlight sensitivity: crossed 09-28)
    src: 'SRD 5.1 Drow (CR 1/4); content/monsters.json drow (the pipeline-1 drow sheet; the captains keep the LPC one)'
  },
  // the sect blades (deep.js, the first rest after Torvald): Sneak Attack, and Assassinate on a party caught unaware
  assassin: {
    name: 'Sect Blade', type: 'humanoid', sheet: 'assassin_p1', cr: '8', ac: 15, hp: 78, speed: 30, size: 1, reach: 5,
    abil: { str: 11, dex: 16, con: 14, int: 13, wis: 11, cha: 10 }, init: 3, perception: 13, stealth: 9,
    saves: { str: 0, dex: 6, con: 2, int: 4, wis: 0, cha: 0 },
    attacks: {
      shortsword: { name: 'Shortsword', atk: 6, dice: '1d6', mod: 3, type: 'piercing', reach: 5, save: { ab: 'con', dc: 15, dice: '7d6', type: 'poison', half: true } },
      crossbow: { name: 'Light Crossbow', atk: 6, dice: '1d8', mod: 3, type: 'piercing', range: [80, 320], ranged: true, save: { ab: 'con', dc: 15, dice: '7d6', type: 'poison', half: true } }
    },
    multi: ['shortsword', 'shortsword'], sneak: '4d6', assassinate: true, resist: ['poison'], evasion: true,
    src: 'content/monsters.json assassin (the SRD 5.1 Assassin as the sect\'s blade, CR 8): two shortsword cuts with CON 15 poison, Sneak Attack 4d6, Assassinate (a critical on a creature caught unaware); the Light Crossbow +6 1d8+3 80/320 with the same CON 15 7d6 poison (SRD 5.1, loosed when nothing is in reach: ai.js volley; 10-02 runner); Evasion is DATA ONLY (evasion: true, SRD 5.1)', todo: 'Evasion is not read: RU.evasion (js/rules.js) answers only a rogue or monk of level 7, and battle.js makeFoe does not carry d.evasion'
  },
  // the stone giant's camp (deep.js S.giant): the giant and three duergar
  stonegiant: {
    name: 'Stone Giant', type: 'giant', sheet: 'stonegiant_p1', cr: '7', ac: 17, hp: 126, speed: 40, climbs: 15, size: 3, reach: 15, darkvision: 60, // (climbs 15 since 10-05 night, Griz: "see above note to scale giant climb to 15"; 20 from 10-05 evening, Griz: "Here's the lever that'll probably make the difference - Giant climb speed to 20"; before that 10. Ours, not the SRD's -- stone into stone, clinging; Griz, 10-04 night)
    abil: { str: 23, dex: 15, con: 20, int: 10, wis: 12, cha: 9 }, init: 2, perception: 14, athletics: 12, // (SRD 5.1 Skills: Athletics +12 -- the Shove from the face reads it: ai.js shoveOff, 10-05 night)
    saves: { str: 6, dex: 5, con: 8, int: 0, wis: 4, cha: -1 },
    attacks: {
      greatclub: { name: 'Greatclub', atk: 9, dice: '3d8', mod: 6, type: 'bludgeoning', reach: 15 },
      rock: { name: 'Rock', atk: 9, dice: '4d10', mod: 6, type: 'bludgeoning', range: [60, 240], ranged: true, fx: 'rock', prone: 17, hurled: true } // (fx 'rock': a lump in a lob, js/fx.js -- a bolt's speck till 10-08; hurled: a rock a stone giant can catch)
    },
    multi: ['greatclub', 'greatclub'],
    // Rock Catching (SRD 5.1: "If a rock or similar object is hurled at the giant, the giant can, with a successful DC 10 Dexterity saving throw, catch the missile and take no bludgeoning damage
    // from it"): the DC, read by js/battle.js attack on a hurled rock that hits her -- her CATCH row (10-08, Griz: "make the unnecessary rock catch animation"; the grid's rules §2.7)
    rockCatch: 10,
    src: 'SRD 5.1 Stone Giant (CR 7, Huge, greatclub reach 15 ft; Rock as a ranged attack, thrown when no one is in reach); content/monsters.json stonegiant; the rock knocks prone (STR 17)'
  },
  duergar: {
    name: 'Duergar', type: 'humanoid', sheet: 'duergar_p0', cr: '1', ac: 16, hp: 26, speed: 25, size: 1, reach: 5, darkvision: 120, invisibility: true,
    abil: { str: 14, dex: 11, con: 14, int: 11, wis: 10, cha: 9 }, init: 0, perception: 10,
    saves: { str: 2, dex: 0, con: 2, int: 0, wis: 0, cha: -1 },
    attacks: { warpick: { name: 'War Pick', atk: 4, dice: '1d8', mod: 2, type: 'piercing', reach: 5 }, javelin: { name: 'Javelin', atk: 4, dice: '1d6', mod: 2, type: 'piercing', range: [30, 120], ranged: true, count: 2, enlarged: '2d6' } }, // (the javelin, SRD 5.1: 2d6 enlarged; ai.js brute grows it first -- 10-02)
    multi: 1, resist: ['poison'], enlarge: { dice: '2d8' }, lightSensitive: true, resilient: true, // (Duergar Resilience, SRD 5.1: advantage on saves against poison, spells, illusions, charm and paralysis -- js/rules.js RU.save; 10-02 runner)
    src: 'SRD 5.1 Duergar (CR 1): war pick; Enlarge once (an action: its pick hits for 2d8+2); Invisibility (an action, till it attacks, casts or grows: ai.js brute, torchdark 09-28); content/monsters.json duergar'
  },
  // the rescue in the dens (events.js, quest `cull`): the roost overhead, and its one law -- no fire, no thunder
  giantbat: {
    name: 'Giant Bat', type: 'beast', sheet: 'giantbat_p1', cr: '1/4', ac: 13, hp: 22, speed: 60, walk: 10, fly: 60, size: 2, reach: 5, blindsight: 60, // (walk: SRD 5.1 "Speed 10 ft., fly 60 ft." -- what a Wild Shape's bat walks when it cannot fly, 10-08)
    abil: { str: 15, dex: 16, con: 11, int: 2, wis: 12, cha: 6 }, init: 3, perception: 11,
    saves: { str: 2, dex: 3, con: 0, int: -4, wis: 1, cha: -2 },
    attacks: { bite: { name: 'Bite', atk: 4, dice: '1d6', mod: 2, type: 'piercing', reach: 5 } },
    multi: 1,
    src: 'SRD 5.1 Giant Bat (CR 1/4, Large, fly 60: here it moves 60 on the ground); content/monsters.json giantbat', todo: 'flight is not read (it goes round, not over)'
  },
  // the drain cut (deep.js S.drainCut): two black puddings. Slashing or lightning splits one (at 10 HP or more)
  pudding: {
    name: 'Black Pudding', type: 'ooze', sheet: 'pudding_p1', small: 'puddingm_p1', cr: '4', ac: 7, hp: 85, speed: 20, climbs: 20, size: 2, reach: 5, blindsight: 60, blind: true,
    abil: { str: 16, dex: 5, con: 16, int: 1, wis: 6, cha: 1 }, init: -3, perception: 8,
    saves: { str: 3, dex: -3, con: 3, int: -5, wis: -2, cha: -5 },
    attacks: { pseudopod: { name: 'Pseudopod', atk: 5, dice: '1d6', mod: 3, type: 'bludgeoning', extra: '4d8', extraType: 'acid', reach: 5 } },
    multi: 1, immune: ['acid', 'cold', 'lightning', 'slashing'], split: true, corrosive: 'form', condImmune: ['blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'prone', 'asleep'], // (SRD 5.1 blinded, charmed, deafened, exhaustion, frightened, prone, which this entry now carries itself -- the 8-bit sheet had blinded, frightened, prone, asleep; asleep kept, 10-02 runner)
    src: 'SRD 5.1 Black Pudding (CR 4, Large): pseudopod + 4d8 acid; immune acid, cold, lightning, slashing; Split (read: battle.js split); Corrosive Form: 1d8 acid to a melee striker, -1 to a nonmagical weapon that hits it, -1 AC to armour its pseudopod hits (js/traits.js, 09-28)', todo: 'the SRD\'s wear is permanent: the grid keeps it to the fight till the 8-bit\'s gear can wear (his word)'
  },
  // ------------------------------------------------------------------ people (09-27): KayKit Adventurers greyed or turned (tools/deep16-figures.json)
  // the line across the bridge (events.js, enter:warrens_a): the Captain's stable, five guards and their sergeant
  guard: {
    name: 'Line Guard', type: 'humanoid', sheet: 'guard_p1', cr: '1/8', ac: 16, hp: 11, speed: 30, size: 1, reach: 5,
    abil: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 }, init: 1, perception: 12,
    saves: { str: 1, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: { spear: { name: 'Spear', atk: 3, dice: '1d6', mod: 1, type: 'piercing', reach: 5 } },
    multi: 1, src: 'SRD 5.1 Guard (CR 1/8); content/monsters.json guard (the Line Guard)'
  },
  // the ladder's wagon yard: two who rode guard on the wagon (SRD 5.1 Guard; the ladder's own, not the 8-bit game's)
  hiredsword: {
    name: 'Hired Sword', type: 'humanoid', sheet: 'guard_p1', humanoid: true, cr: '1/8', ac: 16, hp: 11, speed: 30, size: 1, reach: 5,
    abil: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 }, init: 1, perception: 12,
    saves: { str: 1, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: { spear: { name: 'Spear', atk: 3, dice: '1d6', mod: 1, type: 'piercing', reach: 5 } },
    multi: 1, src: 'SRD 5.1 Guard (CR 1/8): the ladder\'s wagon yard, riding guard (Griz, 09-27: "a pair of soldiers")'
  },
  // the ladder's wagon yard since 09-27 (Griz: "consult the katarina wagon troops and use two of those soldiers (if we rolled
  // them, what weapons) and make the armor on these guys as if it was black armor"; ladder only, stock and climb): the Dominion
  // patrol's LINE SOLDIERS (dominion-patrol-the-fare-home.pdf: fighter 2, "two with glaives, two with sword and shield"); two
  // rolled d4 3 and 4, the sword-and-shield pair: half plate, shield, Defense style
  dominion: {
    name: 'Dominion Soldier', type: 'humanoid', sheet: 'dominion_p1', humanoid: true, cr: '1/2', ac: 19, hp: 20, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 12, con: 14, int: 10, wis: 10, cha: 10 }, init: 1, perception: 10,
    saves: { str: 4, dex: 1, con: 4, int: 0, wis: 0, cha: 0 },
    attacks: {
      longsword: { name: 'Longsword', atk: 4, dice: '1d8', mod: 2, type: 'slashing', reach: 5 },
      crossbow: { name: 'Light Crossbow', atk: 3, dice: '1d8', mod: 1, type: 'piercing', range: [80, 320], ranged: true }
    },
    multi: 1, secondWind: '1d10+2', actionSurge: true, // (ai.js brute: once each; review 09-28 #16)
    src: 'dominion-patrol-the-fare-home.pdf LINE SOLDIERS (fighter 2, sword and shield: AC 19, HP 20, longsword +4 1d8+2, light crossbow +3 1d8+1 80/320)'
  },
  veteran: {
    name: 'Sergeant', type: 'humanoid', sheet: 'veteran_p1', cr: '3', ac: 17, hp: 58, speed: 30, size: 1, reach: 5,
    abil: { str: 16, dex: 13, con: 14, int: 10, wis: 11, cha: 10 }, init: 1, perception: 12,
    saves: { str: 3, dex: 1, con: 2, int: 0, wis: 0, cha: 0 },
    attacks: {
      longsword: { name: 'Longsword', atk: 5, dice: '1d8', mod: 3, type: 'slashing', reach: 5 },
      shortsword: { name: 'Shortsword', atk: 5, dice: '1d6', mod: 3, type: 'piercing', reach: 5 },
      crossbow: { name: 'Heavy Crossbow', atk: 3, dice: '1d10', mod: 1, type: 'piercing', range: [100, 400], ranged: true }
    },
    multi: ['longsword', 'longsword', 'shortsword'], src: 'SRD 5.1 Veteran (CR 3); content/monsters.json veteran (the line\'s Sergeant); the Heavy Crossbow +3 1d10+1 100/400 (SRD 5.1, loosed when nothing is in reach: ai.js volley; 10-02 runner)'
  },
  // the Snoot's glory-seekers on the road south (events.js S.snoot)
  gloryseeker: {
    name: 'Glory-Seeker', type: 'humanoid', sheet: 'gloryseeker_p2', cr: '1', ac: 15, hp: 38, speed: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 16, dex: 12, con: 13, int: 7, wis: 10, cha: 9 }, init: 1, perception: 10,
    saves: { str: 3, dex: 1, con: 1, int: -2, wis: 0, cha: -1 },
    attacks: { spear: { name: 'Spear', atk: 5, dice: '1d8', mod: 3, type: 'piercing', reach: 5 }, bite: { name: 'Bite', atk: 5, dice: '1d4', mod: 3, type: 'piercing', reach: 5 } },
    multi: ['spear', 'bite'], src: 'content/monsters.json gloryseeker (the 8-bit game\'s own: the Snoot\'s young blood, from the SRD gnoll)'
  },
  gnoll: {
    name: 'Gnoll', type: 'humanoid', sheet: 'gnoll_p2', cr: '1/2', ac: 15, hp: 22, speed: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 14, dex: 12, con: 11, int: 6, wis: 10, cha: 7 }, init: 1, perception: 10,
    saves: { str: 2, dex: 1, con: 0, int: -2, wis: 0, cha: -2 },
    attacks: {
      spear: { name: 'Spear', atk: 4, dice: '1d6', mod: 2, type: 'piercing', reach: 5 },
      bite: { name: 'Bite', atk: 4, dice: '1d4', mod: 2, type: 'piercing', reach: 5 },
      throwspear: { name: 'Thrown Spear', atk: 4, dice: '1d6', mod: 2, type: 'piercing', range: [20, 60], ranged: true, count: 1, twin: 'spear' }, // (its one spear: thrown, it bites -- battle.js spendThrow)
      longbow: { name: 'Longbow', atk: 3, dice: '1d8', mod: 1, type: 'piercing', range: [150, 600], ranged: true }
    },
    multi: 1, rampage: true, src: 'SRD 5.1 Gnoll (CR 1/2): spear or bite; content/monsters.json gnoll; Rampage: dropping one on its turn, a bonus-action bite after half its speed (js/traits.js, 09-28); the longbow +3 1d8+1 150/600 (SRD 5.1, loosed when nothing is in reach: ai.js volley; 10-02 runner); the spear thrown +4 1d6+2 20/60 (SRD 5.1 "Spear. Melee or Ranged Weapon Attack ... range 5 ft. or range 20/60 ft."; volley picks the likelier of it and the bow, so the spear inside 20 ft; 10-02)'
  },
  // GreyFang (10-08): the Lupine of the Gemorax fragment, ranger 11 of the Grey Road -- built by his class from js/classes.js NPC.NAMED greyfang (his bow, the
  // Grey Road, his Lupine senses), so a fight can stand him on either side; his story fight lends him to the party (data/fights.js greyfang, an ally). The
  // numbers below are what the build gives, for whatever reads a bestiary block (the Pocket DM's list); the build is what fights
  greyfang: {
    named: true, name: 'GreyFang', type: 'humanoid', sheet: 'greyfang_p1', cr: '8', ac: 15, speed: 30, size: 1, reach: 5,
    abil: { str: 12, dex: 18, con: 14, int: 10, wis: 16, cha: 10 }, init: 4, perception: 17, darkvision: 60,
    saves: { str: 5, dex: 8, con: 2, int: 0, wis: 3, cha: 0 },
    attacks: { bow: { name: "GreyFang's Bow +1", atk: 11, dice: '1d8', mod: 5, type: 'piercing', ranged: true, range: [150, 600] }, sword: { name: 'Shortsword', atk: 8, dice: '1d6', mod: 4, type: 'piercing', reach: 5 } },
    multi: ['bow', 'bow'], build: 'greyfang',
    src: 'ours, 10-08: TarlynsPit/wiki/greyfang.md; js/classes.js NPC.NAMED greyfang (ranger 11, the Grey Road); invented.json #greyfang'
  },
  // the Harbinger (10-08, Griz: "He's yours my dude. Take the seat."): the made gnoll -- a gnoll Mr. Ripples thumbed on his walk to the Doors,
  // his mirror eyes in both sockets (TarlynsPit/wiki/the-trickster.md, the making). Ours, from SRD pieces; his kit by the seat on his leans
  // (..\handoff-2026-10-05-the-bestiary-after-the-bugs.md §9-§11): Backhand twice (the second on `backhand2`); POUNCE, the SRD lion's shape --
  // 20 ft of his turn and the first blow is the leap, its hit on the row's frame 6 (js/traits.js, battle.js); KNEEL, Hold Person with the
  // word said (the `cast` row is his kneel); DRINK LIGHT, his reaction -- a spell cast within 60 ft drunk as a Counterspell, healing him and
  // growing him a step (a check above 3rd; failed, he OVERFILLS and it goes through); FORETELL, a turn ending with no one in his reach, he
  // readies Mirror Strike for the first to step in. The mirror eyes are the Mirror's (no hiding before him in light, magic.js inMirror).
  harbinger: {
    name: 'Harbinger', type: 'monstrosity', sheet: 'mirrorgnoll_p1', cr: '13', ac: 18, hp: 155, speed: 40, size: 2, reach: 10, darkvision: 60,
    abil: { str: 24, dex: 14, con: 20, int: 10, wis: 14, cha: 17 }, init: 4, perception: 17,
    saves: { str: 7, dex: 2, con: 10, int: 0, wis: 7, cha: 8 },
    attacks: { backhand: { name: 'Backhand', atk: 11, dice: '2d10', mod: 7, type: 'bludgeoning', reach: 10 } },
    multi: 3, mirrorEye: true, condImmune: ['charmed', 'frightened'],
    pounce: { dice: '3d10', dc: 17, min: 20 },
    drinkLight: { uses: 3, per: 10 }, // (uses a fight; per: hit points a level of the spell drunk)
    foretell: { name: 'Mirror Strike', atk: 11, dice: '3d10', mod: 7, type: 'piercing', reach: 10 },
    kneel: true, rise: { at: 0.5, reach: 15, grow: 1.3, call: { kind: 'mirrorhyena', n: 4 } }, // (call: the mirror hyenas he calls as he stands -- Griz, 10-08: "I would have used it as a hyena summons - maybe even mirror hyenas - with him rising and standing tall as they run past him to attack the party") // (rise: at half his hit points he stands to his full height -- ascend, then upright; reach 15, Drink Light full again)
    caster: { lvl: 9, ab: 'cha', dc: 15, atk: 7, slots: [0, 3], known: ['holdperson'] },
    // (his two levers on a party read -- a fight's callN: 'read', js/traits.js TR.reads -- 10-08, Griz: "the small party adjustment being a script to use the lesser used powers more often";
    // "from the mirror realm and has purple in the eyes ... some fraction (1/2, 1/4 - not variable by party threat) of HP and attack damage": under `under` he toys, over `over` his mirror double)
    toy: { under: 20 }, double: { over: 32, frac: 0.25 }, // (frac: a quarter, the seat's call on the bench -- the four at 9th with 8 hyenas, 20 fights a cell: party wins 15 with none, 11 at 1/4, 8 at 1/2)
    ripple: { region: 'mane', every: 150, dur: 54, held: true, heldEvery: 90 }, // (the mirror ripple on his mane, frames at 60 Hz: deep16/js/ripple.js, the SRD seat's, 052e833 -- Griz, 10-08: "he's made by mr. ripples but is a lesser being -ripples will get it full body"; the Pounce ripples him whole, js/traits.js)
    src: 'ours (10-08): the made gnoll, CR 13 Large monstrosity from SRD pieces -- tuned on the bench to win about 6 in 10 alone against the four at 7th (Griz: "Try and get him 6/10 on a solo vs Aurdin Party 7 on the ladder"; seeds 1-5 at n=20, the swarm of four mirror hyenas at 34 HP and bite +5 2d4+2, his 155 HP, the ladder fight on the Gnoll Hills: 47 of 100 against the four at 7th (about 7 rounds, 17 Kneels), 18 at 8th, 6 at 9th, dev/bench16.py x fight=harbinger flvl=N -- Griz: "Do Mirror Hyena bite +5 for 2d4+2 and call it good") -- the lion\'s Pounce, Counterspell (Drink Light), Hold Person (Kneel), the Ready (Foretell); his five GPT sheets and the Pounce sheet, tools/mirrorgnoll-sheet.py'
  },
  // the mirror hyena (10-08, ours): the SRD Giant Hyena as Mr. Ripples makes things -- mirror eyes (the Mirror's eye, as the Harbinger's) and the
  // ripple over its whole body; the Harbinger calls three as he rises (js/traits.js rise). The hyena's sheet drawn half again as big (Large)
  mirrorhyena: {
    name: 'Mirror Hyena', type: 'beast', sheet: 'hyena_p2', cr: '1/2', ac: 12, hp: 34, speed: 50, size: 1, reach: 5, drawScale: 1.25,
    abil: { str: 16, dex: 14, con: 14, int: 2, wis: 12, cha: 7 }, init: 2, perception: 13,
    saves: { str: 3, dex: 2, con: 2, int: -4, wis: 1, cha: -2 },
    attacks: { bite: { name: 'Bite', atk: 5, dice: '2d4', mod: 2, type: 'piercing', reach: 5 } },
    multi: 1, rampage: true, packTactics: true, mirrorEye: true, ripple: { region: 'body', every: 130, dur: 54 }, // (Medium and Pack Tactics since the swarm, 10-08: Large, they could not get past him)
    laugh: { dc: 13 }, // (the pack's laugh at one of the party on the ground: WIS or a step up the fear scale -- js/traits.js packLaugh, rules.js RU.FEAR; Griz, 10-08: "reaction to party member falling prone, play one laugh, beat, play the others")
    src: 'the SRD 5.1 Giant Hyena made over by Mr. Ripples, ours (10-08): the mirror eyes, the ripple, the hyena sheet at 1.25; a swarm of four -- Medium, Pack Tactics, out at his flanks (Griz: "they just park behind him most of the fight instead of being a swarm of attackers"), lighter as his lever ("could making them mirrorhyena with different stats be the lever"): 34 HP (three quarters of the giant hyena), bite +5 2d4+2 (Griz: "Do Mirror Hyena bite +5 for 2d4+2 and call it good")'
  },
  hyena: {
    name: 'Hyena', type: 'beast', sheet: 'hyena_p2', cr: '0', ac: 11, hp: 5, speed: 50, size: 1, reach: 5,
    abil: { str: 11, dex: 13, con: 12, int: 2, wis: 12, cha: 5 }, init: 1, perception: 13,
    saves: { str: 0, dex: 1, con: 1, int: -4, wis: 1, cha: -3 },
    attacks: { bite: { name: 'Bite', atk: 2, dice: '1d6', mod: 0, type: 'piercing', reach: 5 } },
    multi: 1, packTactics: true, src: 'SRD 5.1 Hyena (CR 0, Pack Tactics); content/monsters.json hyena'
  },
  // the night crew in the Burial (deep.js, The One Law): Hask, his crew, and the wheelwright, who bolts when Hask falls
  hask: {
    named: true, name: 'Hask', type: 'humanoid', sheet: 'hask_p1', cr: '2', ac: 15, hp: 65, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 16, con: 14, int: 14, wis: 11, cha: 14 }, init: 3, perception: 10,
    saves: { str: 4, dex: 5, con: 2, int: 2, wis: 2, cha: 2 }, // (SRD 5.1 Bandit Captain: Str +4, Dex +5, Wis +2 -- 10-06, the WIS +2 was dropped)
    attacks: { bar: { name: 'Pry-bar', atk: 5, dice: '1d6', mod: 3, type: 'bludgeoning', reach: 5 }, knife: { name: 'Knife', atk: 5, dice: '1d4', mod: 3, type: 'piercing', reach: 5 } },
    multi: ['bar', 'bar', 'knife'], parry: 2, src: 'content/monsters.json hask (the SRD 5.1 Bandit Captain as the night crew\'s boss)'
  },
  wheelwright: {
    name: 'Wheelwright', type: 'humanoid', sheet: 'wheelwright_p1', cr: '1', ac: 12, hp: 27, speed: 30, size: 1, reach: 5,
    abil: { str: 10, dex: 15, con: 10, int: 12, wis: 14, cha: 16 }, init: 2, perception: 16,
    saves: { str: 0, dex: 2, con: 0, int: 1, wis: 2, cha: 3 },
    attacks: {
      mallet: { name: 'Mallet', atk: 4, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 },
      crossbow: { name: 'Hand Crossbow', atk: 4, dice: '1d6', mod: 2, type: 'piercing', range: [30, 120], ranged: true }
    },
    multi: ['mallet', 'mallet'], bolts: 'hask', sneak: '2d6', cunning: true, stealth: 6, // (the Spy's Sneak Attack 2d6, once a turn: battle.js; its Cunning Action waits to be built whole -- Griz, 10-02: "until it's built translates into 'add a handoff please'": handoff-2026-10-02-the-srd-pass-leftovers.md)
    src: 'content/monsters.json wheelwright (the SRD 5.1 Spy): when Hask falls he runs for the stair (the map\'s exit), dashing; Sneak Attack 2d6 once a turn, the Hand Crossbow +4 1d6+2 30/120 (SRD 5.1, loosed when nothing is in reach: ai.js volley), and Cunning Action as `nimble` (Disengage only; 10-02 runner)', todo: 'Cunning Action\'s Dash and Hide are not read (only Disengage, through nimble)'
  },
  crewman: {
    name: 'Crewman', type: 'humanoid', sheet: 'crewman_p1', cr: '1/2', ac: 11, hp: 32, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 11, con: 14, int: 10, wis: 10, cha: 11 }, init: 0, perception: 10,
    saves: { str: 2, dex: 0, con: 2, int: 0, wis: 0, cha: 0 },
    attacks: { bar: { name: 'Pry-bar', atk: 4, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 } },
    multi: ['bar', 'bar'], packTactics: true, src: 'content/monsters.json crewman (the SRD 5.1 Thug); Pack Tactics (SRD 5.1 Thug, 10-02 runner); the Thug\'s heavy crossbow not given: the crew carry pry-bars'
  },
  // holding the stair at the siphon (deep.js S.holdStair): the night crews come down the daytime way
  crewboss: {
    name: 'Crew Boss', type: 'humanoid', sheet: 'hask_p1', cr: '1/2', ac: 11, hp: 32, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 11, con: 14, int: 10, wis: 10, cha: 11 }, init: 0, perception: 10,
    saves: { str: 2, dex: 0, con: 2, int: 0, wis: 0, cha: 0 },
    attacks: { mace: { name: 'Mace', atk: 4, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 } },
    multi: 1, packTactics: true, src: 'content/monsters.json crewboss (a Thug with one blow); Hask\'s sheet; Pack Tactics (SRD 5.1 Thug, 10-02 runner)'
  },
  thug: {
    name: 'Thug', type: 'humanoid', sheet: 'crewman_p1', cr: '1/2', ac: 11, hp: 32, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 11, con: 14, int: 10, wis: 10, cha: 11 }, init: 0, perception: 10,
    saves: { str: 2, dex: 0, con: 2, int: 0, wis: 0, cha: 0 },
    attacks: {
      mace: { name: 'Mace', atk: 4, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 },
      crossbow: { name: 'Heavy Crossbow', atk: 2, dice: '1d10', mod: 0, type: 'piercing', range: [100, 400], ranged: true }
    },
    multi: ['mace', 'mace'], packTactics: true, src: 'SRD 5.1 Thug (CR 1/2); content/monsters.json thug; Pack Tactics (SRD 5.1, 10-02 runner); the Heavy Crossbow +2 1d10 100/400 (SRD 5.1, loosed when nothing is in reach: ai.js volley; 10-02 runner)'
  },
  // the Hex card's two (10-05, Griz: "hired blade alias to sword approved"; the Stable Fighter an 8-bit-only foe, drawn as the Thug's body): the 8-bit's own blocks (content/monsters.json),
  // not the Hired Sword's or the Thug's -- the Blade is CR 1 with 40 HP, so the Hex's hardest bout before Talmok stays so. The Hex fights are the 8-bit's by design (no deep16 option in events.js S.hexCard);
  // these put them in the Pocket DM's pot and on the ladder, and stop the grid refusing a list that names them. The Blade wears the Hired Sword's sheet, the Stable Fighter the Crewman's.
  merc: {
    name: 'Hired Blade', type: 'humanoid', sheet: 'guard_p1', humanoid: true, cr: '1', ac: 14, hp: 40, speed: 30, size: 1, reach: 5,
    abil: { str: 14, dex: 15, con: 13, int: 12, wis: 11, cha: 13 }, init: 2, perception: 10,
    saves: { str: 2, dex: 2, con: 1, int: 1, wis: 0, cha: 1 },
    attacks: {
      sword: { name: 'Sword', atk: 4, dice: '1d6', mod: 2, type: 'slashing', reach: 5 },
      dagger: { name: 'Dagger', atk: 4, dice: '1d4', mod: 2, type: 'piercing', reach: 5 }
    },
    multi: ['sword', 'dagger'], src: 'content/monsters.json merc (SRD 5.1 Bandit Captain cut down to a merc between contracts: two attacks, 40 HP; Griz 09-27: the blade was harder than Talmok); on the Hired Sword sheet'
  },
  // the will-o'-wisp (10-05, Griz: "lets see how cool wisps can look"; "Let's try code drawn"): the sheet is drawn in code (tools/wisp-sheet.py). SRD 5.1 Will-o'-Wisp, CR 2, Tiny, fly 50.
  // Its light is `glow` (js/light.js L.carried: bright 10, dim 10 of the SRD's 5-20 Variable Illumination; it goes out with it when it turns invisible).
  // Invisibility is at will, an action, ending on an attack (SRD; Griz 10-05: "we SRD when we can"; ai.js brute, `invisibility: 'atwill'`). NOT BUILT: Consume Life (bonus action, a creature at 0 HP within 5 ft dies,
  // the wisp heals 3d6), Incorporeal Movement (through creatures and objects, 1d10 force if it ends inside), flight (it goes round, not over, like the bat).
  wisp: {
    name: "Will-o'-Wisp", type: 'undead', sheet: 'wisp_p1', cr: '2', ac: 19, hp: 22, speed: 50, size: 1, reach: 5, darkvision: 120, invisibility: 'atwill', glow: { bright: 10, dim: 10, color: 'glow' },
    abil: { str: 1, dex: 28, con: 10, int: 13, wis: 14, cha: 11 }, init: 9, perception: 12,
    saves: { str: -5, dex: 9, con: 0, int: 1, wis: 2, cha: 0 },
    attacks: { shock: { name: 'Shock', atk: 4, dice: '2d8', mod: 0, type: 'lightning', reach: 5 } },
    multi: 1, immune: ['lightning', 'poison'], resist: ['acid', 'cold', 'fire', 'necrotic', 'thunder', 'mundane'],
    condImmune: ['exhaustion', 'grappled', 'paralyzed', 'poisoned', 'prone', 'restrained', 'asleep'],
    src: "SRD 5.1 Will-o'-Wisp (CR 2); content/monsters.json wisp; a figure drawn in code (tools/wisp-sheet.py)"
  },
  // the three bugs of the 8-bit's Glowseep (10-05, Griz: "Let's try code drawn"; tools/bugs-sheet.py), SRD 5.1 blocks as content/monsters.json has them
  stirge: {
    name: 'Stirge', type: 'beast', sheet: 'stirge_p1', cr: '1/8', ac: 14, hp: 2, speed: 40, fly: 40, size: 1, reach: 5, darkvision: 60,
    abil: { str: 4, dex: 16, con: 11, int: 2, wis: 8, cha: 6 }, init: 3, perception: 9,
    saves: { str: -3, dex: 3, con: 0, int: -4, wis: -1, cha: -2 },
    attacks: { drain: { name: 'Blood Drain', atk: 5, dice: '1d4', mod: 3, type: 'piercing', reach: 5, attach: { dc: 1 }, rides: true, stinger: true } }, // (SRD 5.1: it attaches -- ai.js, a latched stirge drains 1d4+3 at the start of each of its turns and lets go at 10 drained; "a creature can use its action to detach it", so any check serves: dc 1)
    multi: 1, src: 'SRD 5.1 Stirge (CR 1/8, Tiny, fly 40: here it moves 40 on the ground); content/monsters.json stirge; the attach is the darkmantle machinery without the blinding (battle.js `stinger`)', todo: 'flight is not read (it goes round, not over)'
  },
  firebeetle: {
    name: 'Fire Beetle', type: 'beast', sheet: 'firebeetle_p1', cr: '0', ac: 13, hp: 4, speed: 30, size: 1, reach: 5, blindsight: 30, glow: { bright: 10, dim: 10, color: 'fire' },
    abil: { str: 8, dex: 10, con: 12, int: 1, wis: 7, cha: 3 }, init: 0, perception: 8,
    saves: { str: -1, dex: 0, con: 1, int: -5, wis: -2, cha: -4 },
    attacks: { bite: { name: 'Bite', atk: 1, dice: '1d6', mod: 0, type: 'slashing', reach: 5 } },
    multi: 1, src: 'SRD 5.1 Giant Fire Beetle (CR 0); content/monsters.json firebeetle; Illumination (SRD: bright 10 ft, dim 10 ft more) as `glow`'
  },
  centipede: {
    name: 'Giant Centipede', type: 'beast', sheet: 'centipede_p1', cr: '1/4', ac: 13, hp: 4, speed: 30, climbs: 30, size: 1, reach: 5, blindsight: 30,
    abil: { str: 5, dex: 14, con: 12, int: 1, wis: 7, cha: 3 }, init: 2, perception: 8,
    saves: { str: -3, dex: 2, con: 1, int: -5, wis: -2, cha: -4 },
    attacks: { bite: { name: 'Bite', atk: 4, dice: '1d4', mod: 2, type: 'piercing', reach: 5, save: { ab: 'con', dc: 11, dice: '3d6', type: 'poison', half: false } } },
    multi: 1, src: 'SRD 5.1 Giant Centipede (CR 1/4); content/monsters.json centipede', todo: 'the SRD poison rule that drops a target to 0 HP leaves it stable, poisoned and paralysed for an hour: not read'
  },
  stablefighter: {
    name: 'Stable Fighter', type: 'humanoid', sheet: 'crewman_p1', humanoid: true, cr: '1/2', ac: 11, hp: 32, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 11, con: 14, int: 10, wis: 10, cha: 11 }, init: 0, perception: 10,
    saves: { str: 2, dex: 0, con: 2, int: 0, wis: 0, cha: 0 },
    attacks: { spear: { name: 'Spear', atk: 4, dice: '1d6', mod: 2, type: 'piercing', reach: 5 } },
    multi: ['spear', 'spear'], src: 'content/monsters.json stablefighter (SRD 5.1 Thug: a stable man the owner wants bled; wiki/the-hex.md), on the Crewman sheet'
  },
  // the garrison of Sólskaft, out of the Edifice's roof hatch in the Skylights (10-05, Griz: "a solskaft guy 'drilling' soldiers (I think 4?) that group could come out the top door when
  // the first bang hits the skylight"): the 8-bit's Drill-sergeant (content/npcs.json drillmaster) as the SRD 5.1 Veteran, his troopers as the SRD Guard, dwarves (speed 25, darkvision,
  // poison resistance: SRD 5.1 Dwarf). Their looks LPC-composed as the 8-bit's dwarves are (10-05, Griz: "LPC the pop-op dwarves more like the NPC dwarves instead of Duergar"): the troopers
  // on the garrison trooper's sheet (`trooper_p0`, composed 09-27: nasal helm, chainmail, a brown beard), the sergeant on his own (`drillsergeant_p0`: a bronze helm, armoured arms, a black beard)
  trooper: {
    name: 'Trooper', type: 'humanoid', sheet: 'trooper_p0', humanoid: true, cr: '1/8', ac: 16, hp: 11, speed: 25, size: 1, reach: 5, darkvision: 60,
    abil: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 }, init: 1, perception: 12,
    saves: { str: 1, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: { spear: { name: 'Spear', atk: 3, dice: '1d6', mod: 1, type: 'piercing', reach: 5 } },
    multi: 1, resist: ['poison'], src: 'SRD 5.1 Guard (CR 1/8), a dwarf of the garrison; content/npcs.json drill1-4 (the Troopers)'
  },
  // the first two out of the falls carry crossbows (10-05, Griz: "at least the first two out ... should have crossbows and bolts"): the Trooper, and the SRD light crossbow (80/320, 1d8)
  // at the Guard's +3 (DEX 12, proficient) -- from the roof at whatever climbs the face, the spear for one who makes the top
  trooperxbow: {
    name: 'Trooper', type: 'humanoid', sheet: 'trooper_p0', humanoid: true, cr: '1/8', ac: 16, hp: 11, speed: 25, size: 1, reach: 5, darkvision: 60,
    abil: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 }, init: 1, perception: 12,
    saves: { str: 1, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: { spear: { name: 'Spear', atk: 3, dice: '1d6', mod: 1, type: 'piercing', reach: 5 }, crossbow: { name: 'Light Crossbow', atk: 3, dice: '1d8', mod: 1, type: 'piercing', ranged: true, range: [80, 320] } },
    multi: 1, resist: ['poison'], src: 'SRD 5.1 Guard (CR 1/8) with the SRD light crossbow, a dwarf of the garrison; content/npcs.json drill1-4 (the Troopers)'
  },
  drillsergeant: {
    name: 'Drill-sergeant', type: 'humanoid', sheet: 'drillsergeant_p0', humanoid: true, cr: '3', ac: 17, hp: 58, speed: 25, size: 1, reach: 5, darkvision: 60,
    abil: { str: 16, dex: 13, con: 14, int: 10, wis: 11, cha: 10 }, init: 1, perception: 12,
    saves: { str: 3, dex: 1, con: 2, int: 0, wis: 0, cha: 0 },
    attacks: { longsword: { name: 'Longsword', atk: 5, dice: '1d8', mod: 3, type: 'slashing', reach: 5 } },
    multi: ['longsword', 'longsword'], resist: ['poison'], src: 'SRD 5.1 Veteran (CR 3: AC 17, 58 HP, Multiattack: two longsword +5 1d8+3; the shortsword and the heavy crossbow not given), a dwarf; content/npcs.json drillmaster'
  },
  robber: {
    name: 'Night Crew', type: 'humanoid', sheet: 'wheelwright_p1', cr: '1/8', ac: 12, hp: 11, speed: 30, size: 1, reach: 5,
    abil: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 }, init: 1, perception: 10,
    saves: { str: 0, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: { knife: { name: 'Knife', atk: 3, dice: '1d4', mod: 1, type: 'piercing', reach: 5 } },
    multi: 1, src: 'content/monsters.json robber (the SRD 5.1 Bandit with a knife)'
  },
  // ------------------------------------------------------------------ batch five (09-27): the snared lad, the grick den, the bulette, the cloaker, the wagon yard
  wolfspider: {
    name: 'Wolf Spider', type: 'beast', sheet: 'wolfspider_p1', cr: '1/4', ac: 13, hp: 11, speed: 40, climbs: 40, size: 1, reach: 5, darkvision: 60, blindsight: 10,
    abil: { str: 12, dex: 16, con: 13, int: 3, wis: 12, cha: 4 }, init: 3, perception: 13,
    saves: { str: 1, dex: 3, con: 1, int: -4, wis: 1, cha: -3 },
    attacks: { bite: { name: 'Bite', atk: 3, dice: '1d6', mod: 1, type: 'piercing', reach: 5, save: { ab: 'con', dc: 11, dice: '2d6', type: 'poison', half: true } } },
    multi: 1, webWalker: true, src: 'SRD 5.1 Giant Wolf Spider (CR 1/4); content/monsters.json wolfspider'
  },
  grick: {
    name: 'Grick', type: 'monstrosity', sheet: 'grick_p1', cr: '2', ac: 14, hp: 27, speed: 30, climbs: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 14, dex: 14, con: 11, int: 3, wis: 14, cha: 5 }, init: 2, perception: 12,
    saves: { str: 2, dex: 2, con: 0, int: -4, wis: 2, cha: -3 },
    attacks: { tentacles: { name: 'Tentacles', atk: 4, dice: '2d6', mod: 2, type: 'slashing', reach: 5 }, beak: { name: 'Beak', atk: 4, dice: '1d6', mod: 2, type: 'piercing', reach: 5, afterHit: 'tentacles' } },
    multi: ['tentacles', 'beak'], resist: ['mundane'],
    src: 'SRD 5.1 Grick (CR 2): its tentacles, then its beak only if they hit and at the one they hit (ai.js afterHit, 10-02; before, the beak went at anyone, hit or miss); resists bludgeoning, piercing and slashing from non-magical weapons (read: battle.js); Stone Camouflage as starting hidden (the fight\'s foe: hidden)'
  },
  bulette: {
    name: 'Bulette', type: 'monstrosity', sheet: 'bulette_p2', cr: '5', ac: 17, hp: 94, speed: 40, size: 2, reach: 5, darkvision: 60, blindsight: 60, tremor: true, // (tremor: its 60 ft is the SRD's tremorsense -- nothing aloft, magic.js seeWhy, 10-08)
    abil: { str: 19, dex: 11, con: 21, int: 2, wis: 10, cha: 5 }, init: 0, perception: 16,
    saves: { str: 4, dex: 0, con: 5, int: -4, wis: 0, cha: -3 },
    attacks: { bite: { name: 'Bite', atk: 7, dice: '4d12', mod: 4, type: 'piercing', reach: 5 } },
    multi: 1, leap: { dc: 16, abs: ['str', 'dex'], dmg: [['3d6+4', 'bludgeoning'], ['3d6+4', 'slashing']], targets: 2, range: 40, recharge: 5 }, burrow: 40, // (Deadly Leap, SRD 5.1: DC 16 STR or DEX, the target's choice; 3d6+4 bludgeoning plus 3d6+4 slashing, half on a save -- js/ai.js leap, 10-02 runner)
    diveAfter: true, // (up, the bite, and under again with the move it has left -- the opportunity attacks of those beside it first: js/ai.js diveAfter, 10-02; Griz, 10-01d: "If the mechanics allow it and a smart player or AI would do it, we'll allow it" -- READY is the answer, js/battle.js exec ready)
    src: 'SRD 5.1 Bulette (CR 5, Large; burrow 40 ft: js/ai.js burrower, 10-01d; it bites and dives when it has the move left, 10-02, handoff-2026-10-01-the-tendrils-and-ready: js/ai.js diveAfter); content/monsters.json bulette (its Deadly Leap by the SRD since 10-02: DC 16 STR or DEX, the target chooses; 3d6+4 bludgeoning plus 3d6+4 slashing, two of them, half and no prone on a save; recharge 5-6; it lands beside its mark, so no one is in its space to push out)'
  },
  cloaker: {
    name: 'Cloaker', type: 'aberration', sheet: 'cloaker_p2', cr: '8', ac: 14, hp: 78, speed: 40, fly: 40, size: 2, reach: 5, darkvision: 60,
    abil: { str: 17, dex: 15, con: 12, int: 13, wis: 12, cha: 14 }, init: 2, perception: 11,
    saves: { str: 3, dex: 2, con: 1, int: 1, wis: 1, cha: 2 },
    attacks: {
      bite: { name: 'Bite', atk: 6, dice: '2d6', mod: 3, type: 'piercing', reach: 5, grapple: { dc: 16, max: 1, size: 'L' }, autoHitHeld: true, blindHeld: 'always' },
      tail: { name: 'Tail', atk: 6, dice: '1d8', mod: 3, type: 'slashing', reach: 10 }
    },
    multi: ['bite', 'tail'], moan: { dc: 13, recharge: 5 }, phantasms: 'bloodied', transfer: true, lightSensitive: true,
    // the SRD's cloaker everywhere but the story (battle.js makeFoe, Battle.isStory -- RULED 10-06, Griz: "Story Cloaker is riding as is for the time being, it's an easter egg
    // one. Cloaker's that are used in the Pocket DM should match SRD"): its bite attaches to one Large or smaller and rides it, over the head -- blinded, no breath -- when it had
    // advantage, and bites that one at advantage after; a DC 16 STR check, an action, pulls it off (the darkmantle's machinery: battle.js mount, exec 'detach'); Damage Transfer to
    // the one it rides (battle.js hurt). The story's grip above stays the deep gallery's
    srd: { attacks: { bite: { name: 'Bite', atk: 6, dice: '2d6', mod: 3, type: 'piercing', reach: 5, attach: { dc: 16, large: true }, rides: true }, tail: { name: 'Tail', atk: 6, dice: '1d8', mod: 3, type: 'slashing', reach: 10 } } },
    src: 'SRD 5.1 Cloaker (CR 8, fly 40 read as moving 40); content/monsters.json cloaker: the bite engulfs (read as a grip, escape DC 16, its bite then always lands), Damage Transfer, Moan (WIS 13, frightened), Phantasms once when bloodied', todo: 'the engulfed one\'s blindness is not read'
  },
  amara: {
    named: true, name: 'Amara', type: 'humanoid', sheet: 'amara_p1', cr: '3', ac: 13, hp: 45, speed: 30, size: 1, reach: 5, // (hp: warlock 5 at a max d8+1 a level, RULED 09-28; the speed, size and reach sat behind this comment from e8435b3 to 09-28, so she had none)
    abil: { str: 9, dex: 14, con: 12, int: 12, wis: 11, cha: 17 }, init: 2, perception: 10,
    saves: { str: -1, dex: 2, con: 1, int: 1, wis: 2, cha: 5 },
    attacks: { blast: { name: 'Eldritch Blast', atk: 6, dice: '1d10', mod: 3, type: 'force', ranged: true, spell: true, range: [120, 120], fx: 'fire' } },
    multi: ['blast', 'blast'], flees: true, darkness: { r: 15, range: 60 }, mirrorEye: true, build: 'amara', // (09-28: built as warlock 5 of the Mirror with her register's spells, js/classes.js NPC.NAMED; this sheet's numbers stand) // (the Mirror's eye: RULED 09-28, all the Mirror's warlocks; magic.js inMirror)
    src: 'content/monsters.json amara (the 8-bit game\'s own warlock): two beams of Eldritch Blast; when she runs, Darkness first (npcs-by-location.md her spells: darkness; module-halfway-inn.md "darkness over the yard"). No Devil\'s Sight: she is as blind in it as anyone'
  },
  willem: {
    named: true, name: 'Willem Glass', type: 'humanoid', sheet: 'willem_p1', cr: '3', ac: 12, hp: 35, speed: 30, size: 1, reach: 5, // (hp: wizard 5 at a max d6+1 a level, RULED 09-28; the same lost line as Amara's)
    abil: { str: 9, dex: 14, con: 12, int: 17, wis: 12, cha: 11 }, init: 2, perception: 11,
    saves: { str: -1, dex: 2, con: 1, int: 5, wis: 3, cha: 0 },
    attacks: { frost: { name: 'Ray of Frost', atk: 6, dice: '2d8', mod: 0, type: 'cold', ranged: true, spell: true, range: [60, 60], fx: 'bolt' } },
    multi: 1, flees: true, phantasms: 'start', build: 'willem', // (09-28: built as wizard 5 with his register's spells -- Mirror Image is the spell now, js/classes.js)
    src: 'content/monsters.json willem (the 8-bit game\'s own illusionist): Ray of Frost; Phantasms at once (three false images); he gives ground toward the horses, shooting', todo: 'the ray\'s slow is not read'
  },
  // the cleric at Deepholm's door (the 8-bit game's deep.js EV.torvald, HOLD HIM; Griz 09-28: "under most circumstances it
  // shouldn't end in a fight, but given the weight of the scene ... redo it in 16"): a remedy in his pack for someone sick up
  // top, and he will not be held. He yields when he is beaten (`yields`: at half his hit points, standing, the fight is over)
  torvald: {
    name: 'Dwarf Cleric', type: 'humanoid', sheet: 'torvald_p0', cr: '3', ac: 13, hp: 50, speed: 25, size: 1, reach: 5, darkvision: 60, // (hp: cleric 5 at a max d8+2 a level, RULED 09-28)
    abil: { str: 14, dex: 10, con: 14, int: 11, wis: 16, cha: 13 }, init: 0, perception: 13,
    saves: { str: 2, dex: 0, con: 2, int: 0, wis: 5, cha: 3 },
    attacks: { mace: { name: 'Mace', atk: 4, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 } },
    multi: 1, yields: true, resist: ['poison'], build: 'torvald', // (09-28: built as cleric 5 with the SRD Priest's list, js/classes.js NPC.NAMED)
    // the cleric's kit (review 09-28 #1) was a stand-in weave (the spirits as a line, Hold once); since 09-28 he casts the real spells:
    // Spirit Guardians as the ring, Spiritual Weapon, Sanctuary, Guiding Bolt, Sacred Flame, Hold Person (js/classes.js NPC.NAMED.torvald)
    src: 'content/monsters.json torvald (the Dwarf Cleric: AC 13, mace +4 1d6+2; Spirit Guardians 3d8 radiant WIS 13 half recharge 5; Hold once WIS 13; poison resistance; yields at half, the 8-bit battle.js)'
  },
  // ------------------------------------------------------------------ batch six (09-27): the causeway, the cut, the roper, the settling pools
  // the spirit naga (deep.js S.naga, leg four): "Halfway over, the water stands up." It keeps to the black water (bound '~'),
  // bites at ten feet, and has the spell-weaver's routine (ai.js weaver): Hold once, lightning along the water
  naga: {
    name: 'Spirit Naga', type: 'monstrosity', sheet: 'naga_p2', cr: '8', ac: 15, hp: 75, speed: 40, size: 2, reach: 10, darkvision: 60,
    abil: { str: 18, dex: 17, con: 14, int: 16, wis: 15, cha: 16 }, init: 3, perception: 12,
    saves: { str: 4, dex: 6, con: 5, int: 3, wis: 5, cha: 6 },
    attacks: { bite: { name: 'Bite', atk: 7, dice: '1d6', mod: 4, type: 'piercing', reach: 10, save: { ab: 'con', dc: 13, dice: '7d8', type: 'poison', half: true } } },
    multi: 1, immune: ['poison'], bound: '~', condImmune: ['charmed', 'poisoned'], // (SRD 5.1 condition immunities charmed, poisoned; the 8-bit sheet had poisoned only, 10-02 runner)
    // the SRD Spirit Naga's list (RULED 09-28): a 10th-level caster, INT, DC 14, +6 -- Ray of Frost, Sleep, Hold Person, Lightning Bolt
    // built; Blight and Dimension Door since built (4th level); Charm Person added 10-02 (SRD 5.1, a 1st-level slot); Dominate Person since 10-06 (its two 5th-level slots; the grid's rules lane, js/grimoire.js dominate);
    // Detect Thoughts and Water Breathing (SRD) have no fight use, Mage Hand, Minor Illusion and Detect Magic are not on the grid; the old weave retired
    caster: { lvl: 10, ab: 'int', dc: 14, atk: 6, slots: [4, 3, 3, 3, 2], known: ['rayoffrost', 'sleep', 'charmperson', 'holdperson', 'lightningbolt', 'blight', 'dimensiondoor', 'dominateperson'] },
    src: 'SRD 5.1 Spirit Naga (CR 8); content/monsters.json naga (since 09-28 its SRD list: `caster`; Charm Person 10-02); condition immunities charmed, poisoned (SRD 5.1, 10-02 runner); its rejuvenation (back in 1d6 days) is the story\'s, not a fight\'s'
  },
  // the made road's cut (deep.js S.elemental): "the cut's walls move"
  earthelemental: {
    name: 'Earth Elemental', type: 'elemental', sheet: 'earthelemental_p2', cr: '5', ac: 17, hp: 126, speed: 30, size: 2, reach: 10, darkvision: 60, blindsight: 60, tremor: true, // (tremorsense: magic.js seeWhy, 10-08)
    abil: { str: 20, dex: 8, con: 20, int: 5, wis: 10, cha: 5 }, init: -1, perception: 10,
    saves: { str: 5, dex: -1, con: 5, int: -3, wis: 0, cha: -3 },
    attacks: { slam: { name: 'Slam', atk: 8, dice: '2d8', mod: 5, type: 'bludgeoning', reach: 10 } },
    multi: ['slam', 'slam'], resist: ['mundane'], vulnerable: ['thunder'], immune: ['poison'], earthGlide: true, burrow: 30, inorganic: true, // (burrow 30: SRD 5.1 "Speed 30 ft., burrow 30 ft." -- missing till 10-08, so it never went under; its new sheet's Sink and Rise play on js/ai.js sink/rise, the xorn's way) condImmune: ['exhaustion', 'paralyzed', 'petrified', 'poisoned', 'unconscious', 'asleep'], // (SRD 5.1 exhaustion, paralyzed, petrified, poisoned, unconscious; 'asleep' is this grid's unconscious from Sleep and Eyebite -- the 8-bit sheet had paralyzed, poisoned; 10-02 runner)
    src: 'SRD 5.1 Earth Elemental (CR 5, Large, slam reach 10 ft); content/monsters.json earthelemental: resists plain steel, thunder hurts it double, immune to poison; Earth Glide: through the rock, standing only on open ground (js/grid.js, 09-28); condition immunities exhaustion, paralyzed, petrified, poisoned, unconscious (SRD 5.1; 10-02 runner); it has blindsight 60 where the SRD gives tremorsense 60 (sense not changed yet)'
  },
  // the roper on leg two's fork (deep.js S.roper): it looks like the stalagmites until it doesn't (hidden at the start)
  roper: {
    name: 'Roper', type: 'monstrosity', sheet: 'roper_p1', cr: '5', ac: 20, hp: 93, speed: 10, climbs: 10, size: 2, reach: 5, darkvision: 60,
    abil: { str: 18, dex: 8, con: 17, int: 7, wis: 16, cha: 6 }, init: -1, perception: 16,
    saves: { str: 4, dex: -1, con: 3, int: -2, wis: 3, cha: -2 },
    attacks: {
      tendril: { name: 'Tendril', atk: 7, dice: '1d1', mod: -1, type: 'bludgeoning', reach: 50, grapple: { dc: 15, max: 6 }, holdOnly: true, weakens: true, tendril: { ac: 20, hp: 10, immune: ['poison', 'psychic'], breakDC: 15 } }, // (tendril: a thing on the grid, riding the grip -- struck at through the held one's square or broken with a STR check, and the grip ends with it: js/battle.js tendrilOn, strikeTendril, exec breaktendril; 10-02)
      bite: { name: 'Bite', atk: 7, dice: '4d8', mod: 4, type: 'piercing', reach: 5 }
    },
    multi: ['tendril', 'tendril', 'tendril', 'tendril', 'bite'], reel: 25, condImmune: [], // (SRD 5.1 gives the roper no condition immunity; the 8-bit sheet's prone is overridden by this empty list -- battle.js reads d.condImmune before content/monsters.json, 10-02 runner)
    src: 'SRD 5.1 Roper (CR 5, Large): four tendrils at 50 ft (grappled, restrained, escape DC 15; up to six held, one a tendril), then Reel (each one held pulled up to 25 ft straight toward it: js/ai.js reel), then the bite (10-01e, Griz: "we\'ve often been too lenient, 4 please" -- it had two, and each hit dragged its one all the way in); content/monsters.json roper; the tendril\'s grip weakens (disadvantage on STR checks and saves while held: js/traits.js, 09-28); each tendril a thing to strike (AC 20, 10 HP, immune to poison and psychic) or break (an action, a DC 15 STR check), and a tendril lost is one fewer to grab with till its next turn (10-02, handoff-2026-10-01-the-tendrils-and-ready: js/battle.js strikeTendril, exec breaktendril, tendrilGone; js/rules.js startTurn); no condition immunity (SRD 5.1: the 8-bit sheet\'s prone taken off, 10-02 runner)'
  },
  darkmantle: {
    name: 'Darkmantle', type: 'monstrosity', sheet: 'darkmantle_p2', cr: '1/2', ac: 11, hp: 22, speed: 30, fly: 30, size: 1, reach: 5, blindsight: 60, blind: true, darknessAura: true,
    abil: { str: 16, dex: 12, con: 13, int: 2, wis: 10, cha: 5 }, init: 1, perception: 10,
    saves: { str: 3, dex: 1, con: 1, int: -4, wis: 0, cha: -3 },
    attacks: { crush: { name: 'Crush', atk: 5, dice: '1d6', mod: 3, type: 'bludgeoning', reach: 5, attach: { dc: 13 }, rides: true } }, // (SRD 5.1, RULED 10-01 "go SRD": it attaches -- no grapple, no restraint; it rides the one it is on, battle.js mount; over the head, blinding, when it had advantage on a Medium or smaller; STR 13 to pull it off, an action -- the one it is on, or anyone beside)
    multi: 1, src: 'SRD 5.1 Darkmantle (CR 1/2, fly 30 read as moving 30); content/monsters.json darkmantle'
  },
  // the Warrens' settling pools (events.js, warrens_d): the ochre jelly and the gray ooze
  ochrejelly: {
    name: 'Ochre Jelly', type: 'ooze', sheet: 'ochrejelly_p1', small: 'ochrejellym_p1', cr: '2', ac: 8, hp: 45, speed: 10, climbs: 10, size: 2, reach: 5, blindsight: 60, blind: true,
    abil: { str: 15, dex: 6, con: 14, int: 2, wis: 6, cha: 1 }, init: -2, perception: 8,
    saves: { str: 2, dex: -2, con: 2, int: -4, wis: -2, cha: -5 },
    attacks: { pseudopod: { name: 'Pseudopod', atk: 4, dice: '2d6', mod: 2, type: 'bludgeoning', extra: '1d6', extraType: 'acid', reach: 5 } },
    multi: 1, resist: ['acid'], immune: ['lightning', 'slashing'], split: true, condImmune: ['blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'prone', 'asleep'],
    src: 'SRD 5.1 Ochre Jelly (CR 2, Large): Split on slashing or lightning, like the pudding; content/monsters.json ochrejelly; condition immunities blinded, charmed, deafened, exhaustion, frightened, prone (SRD 5.1; the 8-bit sheet had blinded, frightened, prone, asleep -- asleep kept; 10-02 runner)'
  },
  grayooze: {
    name: 'Gray Ooze', type: 'ooze', sheet: 'grayooze_p1', cr: '1/2', ac: 8, hp: 22, speed: 10, climbs: 10, size: 1, reach: 5, blindsight: 60, blind: true,
    abil: { str: 12, dex: 6, con: 16, int: 1, wis: 6, cha: 2 }, init: -2, perception: 8,
    saves: { str: 1, dex: -2, con: 3, int: -5, wis: -2, cha: -4 },
    attacks: { pseudopod: { name: 'Pseudopod', atk: 3, dice: '1d6', mod: 1, type: 'bludgeoning', extra: '2d6', extraType: 'acid', reach: 5 } },
    multi: 1, resist: ['acid', 'cold', 'fire'], corrosive: 'metal', condImmune: ['blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'prone', 'asleep'],
    src: 'SRD 5.1 Gray Ooze (CR 1/2); content/monsters.json grayooze; condition immunities blinded, charmed, deafened, exhaustion, frightened, prone (SRD 5.1; the 8-bit sheet had blinded, frightened, prone, asleep -- asleep kept; 10-02 runner); Corrode Metal: -1 to a nonmagical metal weapon that hits it, -1 AC to metal armour its pseudopod hits (js/traits.js, 09-28)', todo: 'the SRD\'s wear is permanent: the grid keeps it to the fight till the 8-bit\'s gear can wear (his word)'
  },
  // ------------------------------------------------------------------ the water, hand-waved (09-27, Griz: "we'll probably hand wave the chuul fight
  // rather than add swimming"): what lives in the water keeps to it or comes out of it; nobody swims
  // the Keeper of the flooded stair (events.js S.stair, Pete's Five): "It never left its water; it only let go."
  keeper: {
    name: 'The Keeper', type: 'elemental', named: true, sheet: 'keeper_p2', cr: '3', ac: 13, hp: 100, speed: 60, size: 2, reach: 10, blindsight: 30, blind: true,
    abil: { str: 17, dex: 16, con: 13, int: 11, wis: 10, cha: 10 }, init: 3, perception: 10,
    saves: { str: 3, dex: 3, con: 1, int: 0, wis: 0, cha: 0 },
    // 10-03, Griz's design (handoff-2026-10-02-the-keeper.md; js/keeper.js): above the water a Slam (his "knock prone%": a DC 15 STR save, "using himself is more
    // forceful than the wave") and, every round as a bonus action, the Wave; Constrict and Drag Under are retired ("wave replaces grab-and-drag")
    attacks: {
      slam: { name: 'Slam', atk: 5, dice: '2d6', mod: 3, type: 'bludgeoning', reach: 10, prone: 15 }
    },
    multi: ['slam'], resist: ['fire'], immune: ['poison'], condImmune: ['prone'], bound: '~', // (RULED 10-04, Griz: "if water elementals are immune, he would be as well" -- the SRD water elemental and water weird are immune to prone; his Slam and Wave still knock the party down)
    src: 'ours (invented.json #the-keeper): the 8-bit game\'s Keeper, once the SRD 5.1 Water Weird\'s numbers (AC 13, 58 HP, blindsight 30, reach 10), now its own: 100 HP (benched 10-03: at 58 the four at levels 3-5 kill it in 2.5-3.6 rounds, before the deep comes into play), Slam (DC 15 STR or prone), the Wave (bonus action, DC 13 STR; the backwash sweeps the prone toward the deep), washes one into the deep and floods it (AC 10 in the water), the Ice Wall (3 uses) -- js/keeper.js; the signature rules are not the SRD\'s'
  },
  // THE LADDER'S KEEPER (10-03, Griz: the ladder's fight is the old fight unchanged): the record of `keeper` as it is on origin/main before the Keeper work landed (ed7be2a),
  // word for word but for its key -- Constrict and Drag Under, 58 HP, the keeper_p1 stand-in -- so none of js/keeper.js (which keys on kind `keeper`) touches it. Only data/fights.js
  // keeper-ladder fields it; the Pocket DM keeps it out (js/pocket.js PK.NAMED_OUT); dev/keeper-probe.py diffs it against main's.
  keeperold: {
    name: 'The Keeper', type: 'elemental', named: true, sheet: 'keeper_p1', cr: '3', ac: 13, hp: 58, speed: 60, size: 2, reach: 10, blindsight: 30, blind: true,
    abil: { str: 17, dex: 16, con: 13, int: 11, wis: 10, cha: 10 }, init: 3, perception: 10,
    saves: { str: 3, dex: 3, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: {
      constrict: { name: 'Constrict', atk: 5, dice: '1d6', mod: 3, type: 'bludgeoning', reach: 10, grapple: { dc: 13, max: 1 }, pull: true },
      drown: { name: 'Drag Under', atk: 5, dice: '2d6', mod: 0, type: 'bludgeoning', reach: 10, needsHeld: true, autoHitHeld: true, pull: true }
    },
    multi: ['constrict', 'drown'], resist: ['fire'], immune: ['poison'], bound: '~',
    src: 'content/monsters.json keeper (the 8-bit game\'s own, the SRD 5.1 Water Weird\'s numbers): Constrict grips (escape DC 13), Drag Under always lands on the one it holds; it keeps to its water and starts unseen in it'
  },
  // the chuul off the point (events.js S.lakeFight, the base game's capstone): it comes up out of the deep and can come ashore
  chuul: {
    name: 'Chuul', type: 'aberration', sheet: 'chuul_p2', cr: '4', ac: 16, hp: 93, speed: 30, size: 2, reach: 10, darkvision: 60,
    abil: { str: 19, dex: 10, con: 16, int: 5, wis: 11, cha: 5 }, init: 0, perception: 14,
    saves: { str: 4, dex: 0, con: 3, int: -3, wis: 0, cha: -3 },
    attacks: {
      pincer: { name: 'Pincer', atk: 6, dice: '2d6', mod: 4, type: 'bludgeoning', reach: 10, grapple: { dc: 14, max: 2, only: true, size: 'L' } }, // (only: grappled, not restrained -- SRD 5.1's chuul, 10-06; its frog and the otyugh do restrain)
      tentacles: { name: 'Tentacles', atk: 6, dice: '1d1', mod: -1, type: 'poison', reach: 10, needsHeld: true, autoHitHeld: true, paralyze: { dc: 13 } }
    },
    multi: ['pincer', 'pincer', 'tentacles'], immune: ['poison'], swims: true,
    src: 'SRD 5.1 Chuul (CR 4, Large): two pincers (reach 10, grappled, escape DC 14), the tentacles on one it holds (CON 13 or poisoned and paralyzed); content/monsters.json chuul. It swims: the water does not slow it'
  },
  // the Hex floor (events.js, Fight Night's floor): brawlers and a card bruiser, the ladder's level-1 set piece
  brawler: {
    name: 'Bar Brawler', type: 'humanoid', sheet: 'brawler_p1', cr: '1/8', ac: 12, hp: 11, speed: 30, size: 1, reach: 5,
    abil: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 }, init: 1, perception: 10,
    saves: { str: 0, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: { fists: { name: 'Fists', atk: 3, dice: '1d4', mod: 1, type: 'bludgeoning', reach: 5 } },
    multi: 1, src: 'content/monsters.json brawler (the Hex floor)'
  },
  cardbruiser: {
    name: 'Card Bruiser', type: 'humanoid', sheet: 'crewman_p1', cr: '1/4', ac: 12, hp: 22, speed: 30, size: 1, reach: 5,
    abil: { str: 14, dex: 12, con: 13, int: 9, wis: 10, cha: 10 }, init: 1, perception: 10,
    saves: { str: 2, dex: 1, con: 1, int: -1, wis: 0, cha: 0 },
    attacks: { club: { name: 'Cudgel', atk: 4, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 } },
    multi: 1, src: 'content/monsters.json cardbruiser (the Hex card\'s first bout); the crewman\'s sheet'
  },
  // the xorns in the seam (deep.js S.xorn, leg three)
  xorn: {
    name: 'Xorn', type: 'elemental', sheet: 'xorn_p1', cr: '5', ac: 19, hp: 73, speed: 20, size: 1, reach: 5, darkvision: 60, blindsight: 60, tremor: true, // (tremorsense: magic.js seeWhy, 10-08)
    abil: { str: 17, dex: 10, con: 22, int: 11, wis: 10, cha: 11 }, init: 0, perception: 16,
    saves: { str: 3, dex: 0, con: 6, int: 0, wis: 0, cha: 0 },
    attacks: { claw: { name: 'Claw', atk: 6, dice: '1d6', mod: 3, type: 'slashing', reach: 5 }, bite: { name: 'Bite', atk: 6, dice: '3d6', mod: 3, type: 'piercing', reach: 5 } },
    multi: ['claw', 'claw', 'claw', 'bite'], resist: ['mundaneps'], earthGlide: true, burrow: 20, // (SRD 5.1 "burrow 20 ft.": under the floor and up beside you, unseen -- Earth Glide leaves no mound: js/ai.js burrower, 10-01d)
    // under the floor to anyone out of its reach (js/ai.js burrower). 10-06, Griz, on the seat's call that it stays up: "no(?) unless there's good reason he wouldn't burrow, i did have that
    // coded in before we figured out show-me's such that I could see it's walk anim" -- the walk within 15 ft (10-01d) was for seeing its walk, and ?show=xorn shows it now; dug or
    // walked, its 20 ft is the same 20 ft, and under it cannot be seen or struck. And under again after its claws with the move it has left, as the bulette (js/ai.js diveAfter), RULED
    // 10-06, Griz: "from no losses to at least some losses is better gameplay 8/10 is improvement i think" (bench16 fight=xorns lvl=8 n=10: 10 won in 4.5 rounds without it, 8 in 10.5 with it)
    diveAfter: true,
    src: 'SRD 5.1 Xorn (CR 5): three claws and a bite; resists plain steel (the SRD\'s non-adamantine); content/monsters.json xorn; Earth Glide: through the rock, standing only on open ground (js/grid.js, 09-28)'
  },
  // ------------------------------------------------------------------ the bestiary from the 8-bit game's random tables (content/encounters.json), 09-27
  bandit: {
    name: 'Bandit', type: 'humanoid', sheet: 'bandit_p1', cr: '1/8', ac: 12, hp: 11, speed: 30, size: 1, reach: 5,
    abil: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 }, init: 1, perception: 10,
    saves: { str: 0, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: {
      scimitar: { name: 'Scimitar', atk: 3, dice: '1d6', mod: 1, type: 'slashing', reach: 5 },
      crossbow: { name: 'Light Crossbow', atk: 3, dice: '1d8', mod: 1, type: 'piercing', range: [80, 320], ranged: true }
    },
    multi: 1, src: 'SRD 5.1 Bandit (CR 1/8); content/monsters.json bandit (the north and south roads); the Light Crossbow +3 1d8+1 80/320 (SRD 5.1, loosed when nothing is in reach: ai.js volley; 10-02 runner)'
  },
  giantfrog: {
    name: 'Giant Frog', type: 'beast', sheet: 'giantfrog_p1', cr: '1/4', ac: 11, hp: 18, speed: 30, size: 1, reach: 5, darkvision: 30,
    abil: { str: 12, dex: 13, con: 11, int: 2, wis: 10, cha: 3 }, init: 1, perception: 12,
    saves: { str: 1, dex: 1, con: 0, int: -4, wis: 0, cha: -4 },
    attacks: { bite: { name: 'Bite', atk: 3, dice: '1d6', mod: 1, type: 'piercing', reach: 5, grapple: { dc: 11, max: 1 } } },
    multi: 1, swims: true, src: 'SRD 5.1 Giant Frog (CR 1/4): the bite grips (escape DC 11); content/monsters.json giantfrog (the Glowseep); Swallow takes a Small or smaller one only: none of the four (09-28)'
  },
  snake: {
    name: 'Poison Snake', type: 'beast', sheet: 'snake_p1', cr: '1/8', ac: 13, hp: 2, speed: 30, size: 1, reach: 5, blindsight: 10,
    abil: { str: 2, dex: 16, con: 11, int: 1, wis: 10, cha: 3 }, init: 3, perception: 10,
    saves: { str: -4, dex: 3, con: 0, int: -5, wis: 0, cha: -4 },
    attacks: { bite: { name: 'Bite', atk: 5, dice: '1d1', mod: 0, type: 'piercing', reach: 5, save: { ab: 'con', dc: 10, dice: '2d4', type: 'poison', half: true } } },
    multi: 1, swims: true, src: 'SRD 5.1 Poisonous Snake (CR 1/8); content/monsters.json snake (the Glowseep)'
  },
  axebeak: {
    name: 'Axe Beak', type: 'beast', sheet: 'axebeak_p2', cr: '1/4', ac: 11, hp: 19, speed: 50, size: 2, reach: 5,
    abil: { str: 14, dex: 12, con: 12, int: 2, wis: 10, cha: 5 }, init: 1, perception: 10,
    saves: { str: 2, dex: 1, con: 1, int: -4, wis: 0, cha: -3 },
    attacks: { beak: { name: 'Beak', atk: 4, dice: '1d8', mod: 2, type: 'slashing', reach: 5 } },
    multi: 1, src: 'SRD 5.1 Axe Beak (CR 1/4, Large); content/monsters.json axebeak (the south road, the verge)'
  },
  giantboar: {
    name: 'Giant Boar', type: 'beast', sheet: 'giantboar_p2', cr: '2', ac: 12, hp: 42, speed: 40, size: 2, reach: 5,
    abil: { str: 17, dex: 10, con: 16, int: 2, wis: 7, cha: 5 }, init: 0, perception: 8,
    saves: { str: 3, dex: 0, con: 3, int: -4, wis: -2, cha: -3 },
    attacks: { tusk: { name: 'Tusk', atk: 5, dice: '2d6', mod: 3, type: 'slashing', reach: 5 } },
    multi: 1, charge: { dice: '2d6', dc: 13 }, relentlessBeast: 10, src: 'SRD 5.1 Giant Boar (CR 2, Large); content/monsters.json giantboar; Charge (20 ft and a tusk: +2d6, STR 13 or prone) and Relentless (a blow of 10 or less that would drop it, once) (js/traits.js, 09-28)'
  },
  goblin: {
    name: 'Goblin', type: 'humanoid', sheet: 'goblin_p2', cr: '1/4', ac: 15, hp: 7, speed: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 }, init: 2, perception: 9,
    saves: { str: -1, dex: 2, con: 0, int: 0, wis: -1, cha: -1 },
    attacks: {
      scimitar: { name: 'Scimitar', atk: 4, dice: '1d6', mod: 2, type: 'slashing', reach: 5 },
      shortbow: { name: 'Shortbow', atk: 4, dice: '1d6', mod: 2, type: 'piercing', range: [80, 320], ranged: true }
    },
    multi: 1, nimble: true, stealth: 6, src: 'SRD 5.1 Goblin (CR 1/4); content/monsters.json goblin (the king\'s road, leg one); Nimble Escape: Disengage for the bonus action, and a step back (js/traits.js, 09-28), and the Hide for the bonus action (js/traits.js after, Stealth +6 -- SRD 5.1 Skills; 10-07, Griz: "4 yes"; its sheet\'s hide row plays: js/ui.js, battle.js hide); the Shortbow +4 1d6+2 80/320 (SRD 5.1, loosed when nothing is in reach: ai.js volley; 10-02 runner)'
  },
  bugbear: {
    name: 'Bugbear', type: 'humanoid', sheet: 'bugbear_p1', cr: '1', ac: 16, hp: 27, speed: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9 }, init: 2, perception: 10,
    saves: { str: 2, dex: 2, con: 1, int: -1, wis: 0, cha: -1 },
    attacks: {
      morningstar: { name: 'Morningstar', atk: 4, dice: '2d8', mod: 2, type: 'piercing', reach: 5 },
      javelin: { name: 'Javelin', atk: 4, dice: '1d6', mod: 2, type: 'piercing', range: [30, 120], ranged: true, count: 2 }
    },
    multi: 1, surprise: '2d6', src: 'SRD 5.1 Bugbear (CR 1); content/monsters.json bugbear; the chief\'s sheet; the Javelin thrown +4 1d6+2 30/120 (SRD 5.1, when nothing is in reach: ai.js volley; 10-02 runner); its own look since 10-07, bugbear_p1 (his GPT sheet, tools/bugbear-sheet.py)'
  },
  ogre: {
    name: 'Ogre', type: 'giant', sheet: 'ogre_p1', cr: '2', ac: 11, hp: 59, speed: 40, size: 2, reach: 5, darkvision: 60,
    abil: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 }, init: -1, perception: 8,
    saves: { str: 4, dex: -1, con: 3, int: -3, wis: -2, cha: -2 },
    attacks: {
      club: { name: 'Greatclub', atk: 6, dice: '2d8', mod: 4, type: 'bludgeoning', reach: 5 },
      javelin: { name: 'Javelin', atk: 6, dice: '2d6', mod: 4, type: 'piercing', range: [30, 120], ranged: true, count: 3 }
    },
    multi: 1, src: 'SRD 5.1 Ogre (CR 2, Large); content/monsters.json ogre (the king\'s road, leg one); the Javelin thrown +6 2d6+4 30/120 (SRD 5.1, when nothing is in reach: ai.js volley; 10-02 runner)'
  },
  ettin: {
    name: 'Ettin', type: 'giant', sheet: 'ettin_p2', cr: '4', ac: 12, hp: 85, speed: 40, size: 2, reach: 5, darkvision: 60,
    abil: { str: 21, dex: 8, con: 17, int: 6, wis: 10, cha: 8 }, init: -1, perception: 14,
    saves: { str: 5, dex: -1, con: 3, int: -2, wis: 0, cha: -1 },
    attacks: { axe: { name: 'Battleaxe', atk: 7, dice: '2d8', mod: 5, type: 'slashing', reach: 5 }, star: { name: 'Morningstar', atk: 7, dice: '2d8', mod: 5, type: 'piercing', reach: 5 } },
    multi: ['axe', 'star'], twoHeads: true, src: 'SRD 5.1 Ettin (CR 4, Large): battleaxe and morningstar; content/monsters.json ettin (leg two); Two Heads (advantage on saves against being blinded, charmed, deafened, frightened, stunned or knocked out (Two Heads, SRD 5.1: js/rules.js RU.save, 10-02 runner): the charm, fright and stun it is proof against, read so) (js/traits.js, 09-28); the advantage of Two Heads on Wisdom (Perception) checks read where the Perception of a foe is rolled against: the passive score is 5 up (battle.js hide, `twoHeads`; 10-02); the `condImmune: asleep` that stood for Wakeful taken off (SRD 5.1 gives the ettin no condition immunity, so Sleep can take it now; Wakeful itself is not read; 10-02 runner)'
  },
  mouther: {
    name: 'Gibbering Mouther', type: 'aberration', sheet: 'mouther_p1', cr: '2', ac: 9, hp: 67, speed: 10, size: 1, reach: 5, darkvision: 60,
    abil: { str: 10, dex: 8, con: 16, int: 3, wis: 10, cha: 6 }, init: -1, perception: 10,
    saves: { str: 0, dex: -1, con: 3, int: -4, wis: 0, cha: -2 },
    attacks: { bites: { name: 'Bites', atk: 2, dice: '5d6', mod: 0, type: 'piercing', reach: 5, prone: 10, proneMax: 1 } }, // (Medium or smaller: STR 10 or knocked prone)
    multi: 1, gibber: { dc: 10, range: 20 }, aberrant: { dc: 10, r: 10 }, spittle: { dc: 13, range: 15, r: 5, recharge: 5 },
    // (10-06, the story-and-the-pocket-dm handoff, Griz: "SRD what you can": Gibbering was a stun on a recharge of 4-6, "read as the 8-bit game has it" -- now the SRD's, js/traits.js and
    // grimoire.js M.confusedTurn; the Spittle ai.js spit; the 8-bit's own mouther keeps its stun, its frame's)
    src: 'SRD 5.1 Gibbering Mouther (CR 2): Aberrant Ground (10 ft of doughlike difficult ground, STR 10 at a turn\'s start or no move), Gibbering (within 20 ft at a turn\'s start, WIS 10 or no reactions and a d8 for the turn), Bites (STR 10 or prone, Medium or smaller), Blinding Spittle (recharge 5-6, a point within 15 ft, DEX 13 or blinded till the end of its next turn); content/monsters.json mouther (leg two)', todo: 'one killed by the bite is not absorbed'
  },
  // the Hex card's top (events.js, Fight Night): Talmok and the visiting barbarian, both reckless; Talmok rages when first hit
  talmok: {
    name: 'Talmok', type: 'humanoid', named: true, sheet: 'talmok_p1', cr: '2', ac: 15, hp: 35, speed: 30, size: 1, reach: 5,
    abil: { str: 16, dex: 14, con: 16, int: 9, wis: 13, cha: 11 }, init: 2, perception: 11,
    saves: { str: 5, dex: 2, con: 5, int: -1, wis: 1, cha: 0 },
    attacks: { fists: { name: 'Pit Fists', atk: 5, dice: '1d4', mod: 3, type: 'bludgeoning', reach: 5, rage: 2, prone: 13 } },
    multi: ['fists', 'fists'], reckless: true, rageOnHit: true,
    src: 'content/monsters.json talmok (the 8-bit game\'s own pit fighter): Pit Fists 1d4+3 (+2 raging; a flat 4 till 09-28h, the SRD unarmed strike: the Path of the Sand and its PIT FISTS give them the die), reckless, rages on the first hit (here: two blows a turn, as a CR 2 brawler); the fists knock prone (STR 13)'
  },
  berserker: {
    name: 'Visiting Barbarian', type: 'humanoid', sheet: 'berserker_p1', cr: '2', ac: 13, hp: 67, speed: 30, size: 1, reach: 5,
    abil: { str: 16, dex: 12, con: 17, int: 9, wis: 11, cha: 9 }, init: 1, perception: 10,
    saves: { str: 3, dex: 1, con: 3, int: -1, wis: 0, cha: -1 },
    attacks: { greataxe: { name: 'Greataxe', atk: 5, dice: '1d12', mod: 3, type: 'slashing', reach: 5 } },
    multi: 1, reckless: true, src: 'SRD 5.1 Berserker (CR 2, Reckless); content/monsters.json berserker (the Hex card\'s visiting barbarian)'
  },
  banditcaptain: {
    name: 'Bandit Captain', type: 'humanoid', sheet: 'hask_p1', cr: '2', ac: 15, hp: 65, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 16, con: 14, int: 14, wis: 11, cha: 14 }, init: 3, perception: 10,
    saves: { str: 4, dex: 5, con: 2, int: 2, wis: 2, cha: 2 }, // (SRD 5.1 Bandit Captain: Str +4, Dex +5, Wis +2 -- 10-06, the WIS +2 was dropped)
    attacks: {
      scimitar: { name: 'Scimitar', atk: 5, dice: '1d6', mod: 3, type: 'slashing', reach: 5 },
      dagger: { name: 'Dagger', atk: 5, dice: '1d4', mod: 3, type: 'piercing', reach: 5 },
      throwndagger: { name: 'Thrown Dagger', atk: 5, dice: '1d4', mod: 3, type: 'piercing', range: [20, 60], ranged: true, count: 2 }
    },
    multi: ['scimitar', 'scimitar', 'dagger'], rangedMulti: ['throwndagger', 'throwndagger'], parry: 2, src: 'SRD 5.1 Bandit Captain (CR 2); content/monsters.json banditcaptain (in the 8-bit game only as Hask\'s pattern; Hask\'s sheet); two daggers thrown +5 1d4+3 20/60 (SRD 5.1 "or ... two ranged attacks with its daggers": `rangedMulti`, ai.js volley, when nothing is in reach; 10-02)'
  },
  grimlock: {
    name: 'Grimlock', type: 'humanoid', sheet: 'grimlock_p1', cr: '1/4', ac: 11, hp: 11, speed: 30, size: 1, reach: 5, blindsight: 30, blind: true,
    abil: { str: 16, dex: 12, con: 12, int: 9, wis: 8, cha: 6 }, init: 1, perception: 13,
    saves: { str: 3, dex: 1, con: 1, int: -1, wis: -1, cha: -2 },
    attacks: { club: { name: 'Spiked Bone Club', atk: 5, dice: '1d4', mod: 3, type: 'bludgeoning', extra: '1d4', extraType: 'piercing', reach: 5 } },
    multi: 1, src: 'SRD 5.1 Grimlock (CR 1/4): blind, blindsight 30 ft (nothing past it: light.js seesBy), stone camouflage (it starts hidden); content/monsters.json grimlock (leg three)'
  },
  cube: {
    name: 'Gelatinous Cube', type: 'ooze', sheet: 'cube_p2', cr: '2', ac: 6, hp: 84, speed: 15, size: 2, reach: 5, blindsight: 60, blind: true,
    abil: { str: 14, dex: 3, con: 20, int: 1, wis: 6, cha: 1 }, init: -4, perception: 8,
    saves: { str: 2, dex: -4, con: 5, int: -5, wis: -2, cha: -5 },
    attacks: {
      engulf: { name: 'Engulf', atk: 4, dice: '3d6', mod: 0, type: 'acid', reach: 5, grapple: { dc: 12, max: 1, size: 'L' } },
      digest: { name: 'Digest', atk: 4, dice: '6d6', mod: 0, type: 'acid', reach: 5, needsHeld: true, autoHitHeld: true }
    },
    multi: ['engulf', 'digest'], condImmune: ['blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'prone', 'asleep'],
    src: 'SRD 5.1 Gelatinous Cube (CR 2, Large, transparent: it starts hidden); content/monsters.json cube (leg two): Engulf read as a grip (escape DC 12), Digest on the one it has, as the 8-bit game runs them; condition immunities blinded, charmed, deafened, exhaustion, frightened, prone (SRD 5.1; the 8-bit sheet had blinded, frightened, prone, asleep -- asleep kept; 10-02 runner)', todo: 'its moving into your square is not read'
  },
  // its art since 09-27: Griz's Grok sheet (pipeline 2, tools/crawler-sheet.py; crawler_p2), the snake stand-in retired
  crawler: {
    name: 'Crawler', type: 'monstrosity', sheet: 'crawler_p2', cr: '2', ac: 12, hp: 40, speed: 30, size: 2, reach: 5, darkvision: 60,
    abil: { str: 14, dex: 13, con: 14, int: 1, wis: 12, cha: 5 }, init: 1, perception: 13,
    saves: { str: 2, dex: 1, con: 2, int: -5, wis: 1, cha: -3 },
    attacks: {
      feelers: { name: 'Feelers', atk: 5, dice: '1d6', mod: 2, type: 'poison', reach: 10, paralyze: { dc: 13 } },
      jaws: { name: 'Mandibles', atk: 4, dice: '2d4', mod: 2, type: 'piercing', reach: 5 }
    },
    multi: ['feelers', 'jaws'],
    src: 'content/monsters.json crawler (the 8-bit game\'s own, the Warrens\' crawler -- the cradle\'s): feelers at 10 ft, CON 13 or poisoned and paralyzed (a save each turn), then the mandibles'
  },
  // ------------------------------------------------------------------ swarms (09-27): resist blades and blows, bite for less at half their hit
  // points (halfHP), never knocked down; one creature's sheet stands for the cloud
  ratswarm: {
    name: 'Rat Swarm', type: 'beast', sheet: 'giantrat_p1', cr: '1/4', ac: 10, hp: 24, speed: 30, size: 1, reach: 5, darkvision: 30,
    abil: { str: 9, dex: 11, con: 9, int: 2, wis: 10, cha: 3 }, init: 0, perception: 10,
    saves: { str: -1, dex: 0, con: -1, int: -4, wis: 0, cha: -4 },
    attacks: { bites: { name: 'Bites', atk: 2, dice: '2d6', halfHP: '1d6', mod: 0, type: 'piercing', reach: 5 } },
    multi: 1, swarm: true, noProne: true, resist: ['bludgeoning', 'piercing', 'slashing'], condImmune: ['charmed', 'frightened', 'grappled', 'paralyzed', 'petrified', 'prone', 'restrained', 'stunned'],
    src: 'SRD 5.1 Swarm of Rats (CR 1/4); content/monsters.json ratswarm (the Warrens); condition immunities charmed, frightened, grappled, paralyzed, petrified, prone, restrained, stunned (SRD 5.1; the 8-bit sheet lacked charmed, petrified, stunned, 10-02 runner)', todo: 'sharing a creature\'s space is not read'
  },
  batswarm: {
    name: 'Bat Swarm', type: 'beast', sheet: 'batswarm_p1', cr: '1/4', ac: 12, hp: 22, speed: 30, fly: 30, size: 1, reach: 5, blindsight: 60,
    abil: { str: 5, dex: 15, con: 10, int: 2, wis: 12, cha: 4 }, init: 2, perception: 11,
    saves: { str: -3, dex: 2, con: 0, int: -4, wis: 1, cha: -3 },
    attacks: { bites: { name: 'Bites', atk: 4, dice: '2d4', halfHP: '1d4', mod: 0, type: 'piercing', reach: 5 } },
    multi: 1, swarm: true, noProne: true, resist: ['bludgeoning', 'piercing', 'slashing'], condImmune: ['charmed', 'frightened', 'grappled', 'paralyzed', 'petrified', 'prone', 'restrained', 'stunned'],
    src: 'SRD 5.1 Swarm of Bats (CR 1/4, fly 30 read as moving 30); content/monsters.json batswarm (the galleries); condition immunities charmed, frightened, grappled, paralyzed, petrified, prone, restrained, stunned (SRD 5.1; the 8-bit sheet lacked charmed, petrified, stunned, 10-02 runner)', todo: 'sharing a creature\'s space is not read'
  },
  insectswarm: {
    name: 'Insect Swarm', type: 'beast', sheet: 'insectswarm_p1', cr: '1/2', ac: 12, hp: 22, speed: 20, climbs: 20, size: 1, reach: 5, blindsight: 10,
    abil: { str: 3, dex: 13, con: 10, int: 1, wis: 7, cha: 1 }, init: 1, perception: 8,
    saves: { str: -4, dex: 1, con: 0, int: -5, wis: -2, cha: -5 },
    attacks: { bites: { name: 'Bites', atk: 3, dice: '4d4', halfHP: '2d4', mod: 0, type: 'piercing', reach: 5 } },
    multi: 1, swarm: true, noProne: true, resist: ['bludgeoning', 'piercing', 'slashing'], condImmune: ['charmed', 'frightened', 'grappled', 'paralyzed', 'petrified', 'prone', 'restrained', 'stunned'],
    src: 'SRD 5.1 Swarm of Insects (CR 1/2); content/monsters.json insectswarm (the Glowseep); condition immunities charmed, frightened, grappled, paralyzed, petrified, prone, restrained, stunned (SRD 5.1; the 8-bit sheet lacked charmed, petrified, stunned, 10-02 runner)', todo: 'sharing a creature\'s space is not read'
  },
  // the clacker (10-01): the realm's hook horror, the colony crowning the crook (TarlynsPit/wiki/the-warrens.md, the clacker cavern;
  // the landlord's fourth picture). Not an SRD creature, so the block is ours, drafted from SRD pieces at a Large monstrosity's CR 3:
  // two long hooks (reach 10), sight by echo (blindsight 60, no eyes worth the name in the dark), a hide like cobbles. Griz's sheet
  // (tools/clacker-sheet.py). At the start of each of its turns it strikes its hooks together, the clacking that is their speech (js/ai.js)
  clacker: {
    name: 'Clacker', type: 'monstrosity', sheet: 'clacker_p2', cr: '3', ac: 15, hp: 68, speed: 30, climbs: 30, size: 2, reach: 10, blindsight: 60,
    abil: { str: 18, dex: 10, con: 14, int: 6, wis: 12, cha: 6 }, init: 0, perception: 13,
    saves: { str: 4, dex: 0, con: 2, int: -2, wis: 1, cha: -2 },
    attacks: { hook: { name: 'Hook', atk: 6, dice: '1d10', mod: 4, type: 'piercing', reach: 10 } },
    multi: 2, clacks: true,
    src: 'ours (10-01, invented.json clacker): the realm\'s hook horror, a block of our own from SRD pieces (CR 3, Large); Griz\'s two Grok sheets (clacker_p2, 10-01; the GPT one retired); its climb (as the hook horror: climb 30) read as `climbs` since 10-04: any cliff on a map that lets them be climbed'
  }
};

// the stone giant's second look (10-04, Griz: "2 yes" -- the male sculpt beside the female, "the camp's giant one of the two looks at random"): the same SRD
// block, his sheet (tools/stonegiantm-blend.py; the spiked club in both hands). data/fights.js giant picks one of the two kinds; the Pocket DM draws either.
window.D16.FOES.stonegiantm = Object.assign({}, window.D16.FOES.stonegiant, { sheet: 'stonegiantm_p1',
  src: window.D16.FOES.stonegiant.src + '; the male look (stonegiantm_p1, 10-04): the same block' });
