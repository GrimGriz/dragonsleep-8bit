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
      bite: { name: 'Bite', atk: 4, dice: '1d10', mod: 2, type: 'piercing', reach: 5, save: { ab: 'con', dc: 11, dice: '4d8', type: 'poison', half: true, zero: true } }
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
      bite: { name: 'Bite', atk: 5, dice: '1d8', mod: 3, type: 'piercing', reach: 5, save: { ab: 'con', dc: 11, dice: '2d8', type: 'poison', half: true, zero: true } }
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
    name: 'Hobgoblin Sergeant', type: 'humanoid', sheet: 'hobsergeant_p2', cr: '3', ac: 18, metalArmor: 'chain mail', shield: true, hp: 39, speed: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 15, dex: 14, con: 14, int: 12, wis: 10, cha: 13 }, init: 2, perception: 10,
    saves: { str: 2, dex: 2, con: 2, int: 1, wis: 0, cha: 1 },
    attacks: { longsword: { name: 'Longsword', atk: 5, dice: '1d8', mod: 2, type: 'slashing', reach: 5 } },
    multi: ['longsword', 'longsword'], martial: '2d6',
    src: 'content/monsters.json hobsergeant (game-original from SRD 5.1 pieces: the Hobgoblin and the Veteran); Martial Advantage'
  },
  hobgoblin: {
    name: 'Hobgoblin', type: 'humanoid', sheet: 'hobgoblin_p2', cr: '1/2', ac: 18, metalArmor: 'chain mail', shield: true, hp: 11, speed: 30, size: 1, reach: 5, darkvision: 60,
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
    name: 'Drow', type: 'humanoid', sheet: 'drow_p1', humanoid: true, cr: '1/4', ac: 15, metalArmor: 'chain shirt', hp: 13, speed: 30, size: 1, reach: 5, darkvision: 120,
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
    name: 'Sect Blade', type: 'humanoid', sheet: 'assassin_p1', cr: '8', ac: 15, armor: 'studded leather', hp: 78, speed: 30, size: 1, reach: 5,
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
    name: 'Duergar', type: 'humanoid', sheet: 'duergar_p0', cr: '1', ac: 16, metalArmor: 'scale mail', shield: true, hp: 26, speed: 25, size: 1, reach: 5, darkvision: 120, invisibility: true,
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
    name: 'Black Pudding', type: 'ooze', sheet: 'pudding_p2', small: 'puddingm_p2', cr: '4', ac: 7, hp: 85, speed: 20, climbs: 20, size: 2, reach: 5, blindsight: 60, blind: true,
    abil: { str: 16, dex: 5, con: 16, int: 1, wis: 6, cha: 1 }, init: -3, perception: 8,
    saves: { str: 3, dex: -3, con: 3, int: -5, wis: -2, cha: -5 },
    attacks: { pseudopod: { name: 'Pseudopod', atk: 5, dice: '1d6', mod: 3, type: 'bludgeoning', extra: '4d8', extraType: 'acid', reach: 5 } },
    multi: 1, immune: ['acid', 'cold', 'lightning', 'slashing'], split: true, corrosive: 'form', condImmune: ['blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'prone', 'asleep'], // (SRD 5.1 blinded, charmed, deafened, exhaustion, frightened, prone, which this entry now carries itself -- the 8-bit sheet had blinded, frightened, prone, asleep; asleep kept, 10-02 runner)
    src: 'SRD 5.1 Black Pudding (CR 4, Large): pseudopod + 4d8 acid; immune acid, cold, lightning, slashing; Split (read: battle.js split); Corrosive Form: 1d8 acid to a melee striker, -1 to a nonmagical weapon that hits it, -1 AC to armour its pseudopod hits (js/traits.js, 09-28)', todo: 'the SRD\'s wear is permanent: the grid keeps it to the fight till the 8-bit\'s gear can wear (his word)'
  },
  // ------------------------------------------------------------------ people (09-27): KayKit Adventurers greyed or turned (tools/deep16-figures.json)
  // the line across the bridge (events.js, enter:warrens_a): the Captain's stable, five guards and their sergeant
  guard: {
    name: 'Line Guard', type: 'humanoid', sheet: 'guard_p1', cr: '1/8', ac: 16, metalArmor: 'chain shirt', shield: true, hp: 11, speed: 30, size: 1, reach: 5,
    abil: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 }, init: 1, perception: 12,
    saves: { str: 1, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: { spear: { name: 'Spear', atk: 3, dice: '1d6', mod: 1, type: 'piercing', reach: 5 } },
    multi: 1, src: 'SRD 5.1 Guard (CR 1/8); content/monsters.json guard (the Line Guard)'
  },
  // the ladder's wagon yard: two who rode guard on the wagon (SRD 5.1 Guard; the ladder's own, not the 8-bit game's)
  hiredsword: {
    name: 'Hired Sword', type: 'humanoid', sheet: 'guard_p1', humanoid: true, cr: '1/8', ac: 16, metalArmor: 'chain shirt', shield: true, hp: 11, speed: 30, size: 1, reach: 5,
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
    name: 'Dominion Soldier', type: 'humanoid', sheet: 'dominion_p1', humanoid: true, cr: '1/2', ac: 19, metalArmor: 'half plate', shield: true, hp: 20, speed: 30, size: 1, reach: 5,
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
    name: 'Sergeant', type: 'humanoid', sheet: 'veteran_p1', cr: '3', ac: 17, metalArmor: 'splint', hp: 58, speed: 30, size: 1, reach: 5,
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
    name: 'Glory-Seeker', type: 'humanoid', sheet: 'gloryseeker_p2', cr: '1', ac: 15, armor: 'hide armor', shield: true, hp: 38, speed: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 16, dex: 12, con: 13, int: 7, wis: 10, cha: 9 }, init: 1, perception: 10,
    saves: { str: 3, dex: 1, con: 1, int: -2, wis: 0, cha: -1 },
    attacks: { spear: { name: 'Spear', atk: 5, dice: '1d8', mod: 3, type: 'piercing', reach: 5 }, bite: { name: 'Bite', atk: 5, dice: '1d4', mod: 3, type: 'piercing', reach: 5 } },
    multi: ['spear', 'bite'], src: 'content/monsters.json gloryseeker (the 8-bit game\'s own: the Snoot\'s young blood, from the SRD gnoll)'
  },
  gnoll: {
    name: 'Gnoll', type: 'humanoid', sheet: 'gnoll_p2', cr: '1/2', ac: 15, armor: 'hide armor', shield: true, hp: 22, speed: 30, size: 1, reach: 5, darkvision: 60,
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
    toy: { under: 20 }, double: { over: 32, frac: 0.25 }, // (frac: a quarter, RULED -- Griz, 10-08: "1/4 looks great"; the four at 9th with 8 hyenas, 20 fights a cell: party wins 15 with none, 11 at 1/4, 8 at 1/2)
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
    laugh: { dc: 13 }, // (the pack's laugh at one of the party on the ground: WIS or a step up the fear scale; dc for the pair that starts it, +1 a hyena past two -- js/traits.js packLaugh, rules.js RU.FEAR; Griz, 10-08: "reaction to party member falling prone, play one laugh, beat, play the others")
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
  // HASK'S LIEUTENANT (10-28, Griz: "Take the leans" -- the difficulty lane §2.2/§3.2: the crew's fourth "a bandit captain in Hask's pattern, named for the crew (his lieutenant), the
  // scene's 'Four of them' kept"): Skell, the seat's name (invented.json #skell), Hask's own block -- the SRD 5.1 Bandit Captain with the crew's pry-bar and knife -- in the bandit's hood
  // (bandit_p1, a stand-in: the crew's tunic is Hask's and the crewmen's, the hood marks the one to watch)
  skell: {
    named: true, name: 'Skell', type: 'humanoid', sheet: 'bandit_p1', cr: '2', ac: 15, hp: 65, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 16, con: 14, int: 14, wis: 11, cha: 14 }, init: 3, perception: 10,
    saves: { str: 4, dex: 5, con: 2, int: 2, wis: 2, cha: 2 }, // (SRD 5.1 Bandit Captain: Str +4, Dex +5, Wis +2)
    attacks: { bar: { name: 'Pry-bar', atk: 5, dice: '1d6', mod: 3, type: 'bludgeoning', reach: 5 }, knife: { name: 'Knife', atk: 5, dice: '1d4', mod: 3, type: 'piercing', reach: 5 } },
    multi: ['bar', 'bar', 'knife'], parry: 2, src: 'the SRD 5.1 Bandit Captain (CR 2) in Hask\'s pattern (foes.js hask): Hask\'s lieutenant in the night crew, the crew\'s fourth (10-28)'
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
    name: 'Crewman', type: 'humanoid', sheet: 'crewman_p1', cr: '1/2', ac: 11, armor: 'leather armor', hp: 32, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 11, con: 14, int: 10, wis: 10, cha: 11 }, init: 0, perception: 10,
    saves: { str: 2, dex: 0, con: 2, int: 0, wis: 0, cha: 0 },
    attacks: { bar: { name: 'Pry-bar', atk: 4, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 } },
    multi: ['bar', 'bar'], packTactics: true, src: 'content/monsters.json crewman (the SRD 5.1 Thug); Pack Tactics (SRD 5.1 Thug, 10-02 runner); the Thug\'s heavy crossbow not given: the crew carry pry-bars'
  },
  // holding the stair at the siphon (deep.js S.holdStair): the night crews come down the daytime way
  crewboss: {
    name: 'Crew Boss', type: 'humanoid', sheet: 'hask_p1', cr: '1/2', ac: 11, armor: 'leather armor', hp: 32, speed: 30, size: 1, reach: 5,
    abil: { str: 15, dex: 11, con: 14, int: 10, wis: 10, cha: 11 }, init: 0, perception: 10,
    saves: { str: 2, dex: 0, con: 2, int: 0, wis: 0, cha: 0 },
    attacks: { mace: { name: 'Mace', atk: 4, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 } },
    multi: 1, packTactics: true, src: 'content/monsters.json crewboss (a Thug with one blow); Hask\'s sheet; Pack Tactics (SRD 5.1 Thug, 10-02 runner)'
  },
  thug: {
    name: 'Thug', type: 'humanoid', sheet: 'crewman_p1', cr: '1/2', ac: 11, armor: 'leather armor', hp: 32, speed: 30, size: 1, reach: 5,
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
    name: 'Hired Blade', type: 'humanoid', sheet: 'guard_p1', humanoid: true, cr: '1', ac: 14, armor: 'studded leather', hp: 40, speed: 30, size: 1, reach: 5,
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
    attacks: { bite: { name: 'Bite', atk: 4, dice: '1d4', mod: 2, type: 'piercing', reach: 5, save: { ab: 'con', dc: 11, dice: '3d6', type: 'poison', half: false, zero: true } } },
    multi: 1, src: 'SRD 5.1 Giant Centipede (CR 1/4); content/monsters.json centipede', todo: 'the SRD poison rule that drops a target to 0 HP leaves it stable, poisoned and paralysed for an hour: not read'
  },
  stablefighter: {
    name: 'Stable Fighter', type: 'humanoid', sheet: 'crewman_p1', humanoid: true, cr: '1/2', ac: 11, armor: 'leather armor', hp: 32, speed: 30, size: 1, reach: 5,
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
    name: 'Trooper', type: 'humanoid', sheet: 'trooper_p0', humanoid: true, cr: '1/8', ac: 16, metalArmor: 'chain shirt', shield: true, hp: 11, speed: 25, size: 1, reach: 5, darkvision: 60,
    abil: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 }, init: 1, perception: 12,
    saves: { str: 1, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: { spear: { name: 'Spear', atk: 3, dice: '1d6', mod: 1, type: 'piercing', reach: 5 } },
    multi: 1, resist: ['poison'], src: 'SRD 5.1 Guard (CR 1/8), a dwarf of the garrison; content/npcs.json drill1-4 (the Troopers)'
  },
  // the first two out of the falls carry crossbows (10-05, Griz: "at least the first two out ... should have crossbows and bolts"): the Trooper, and the SRD light crossbow (80/320, 1d8)
  // at the Guard's +3 (DEX 12, proficient) -- from the roof at whatever climbs the face, the spear for one who makes the top
  trooperxbow: {
    name: 'Trooper', type: 'humanoid', sheet: 'trooper_p0', humanoid: true, cr: '1/8', ac: 16, metalArmor: 'chain shirt', shield: true, hp: 11, speed: 25, size: 1, reach: 5, darkvision: 60,
    abil: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 }, init: 1, perception: 12,
    saves: { str: 1, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: { spear: { name: 'Spear', atk: 3, dice: '1d6', mod: 1, type: 'piercing', reach: 5 }, crossbow: { name: 'Light Crossbow', atk: 3, dice: '1d8', mod: 1, type: 'piercing', ranged: true, range: [80, 320] } },
    multi: 1, resist: ['poison'], src: 'SRD 5.1 Guard (CR 1/8) with the SRD light crossbow, a dwarf of the garrison; content/npcs.json drill1-4 (the Troopers)'
  },
  drillsergeant: {
    name: 'Drill-sergeant', type: 'humanoid', sheet: 'drillsergeant_p0', humanoid: true, cr: '3', ac: 17, metalArmor: 'splint', hp: 58, speed: 25, size: 1, reach: 5, darkvision: 60,
    abil: { str: 16, dex: 13, con: 14, int: 10, wis: 11, cha: 10 }, init: 1, perception: 12,
    saves: { str: 3, dex: 1, con: 2, int: 0, wis: 0, cha: 0 },
    attacks: { longsword: { name: 'Longsword', atk: 5, dice: '1d8', mod: 3, type: 'slashing', reach: 5 } },
    multi: ['longsword', 'longsword'], resist: ['poison'], src: 'SRD 5.1 Veteran (CR 3: AC 17, 58 HP, Multiattack: two longsword +5 1d8+3; the shortsword and the heavy crossbow not given), a dwarf; content/npcs.json drillmaster'
  },
  robber: {
    name: 'Night Crew', type: 'humanoid', sheet: 'wheelwright_p1', cr: '1/8', ac: 12, armor: 'leather armor', hp: 11, speed: 30, size: 1, reach: 5,
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
    attacks: { bite: { name: 'Bite', atk: 3, dice: '1d6', mod: 1, type: 'piercing', reach: 5, save: { ab: 'con', dc: 11, dice: '2d6', type: 'poison', half: true, zero: true } } },
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
  // the ankheg (10-22, the monster cutter seat's second run, on Griz's "spin up an one-at-a-time art cutter that goes until we're out"; asked
  // 10-08 as "a creature a biome", the plains -- deep16-srd-not-yet.md): the SRD 5.1 Ankheg from the mechanics the grid has; its sheet
  // tools/ankheg-sheet.py (the art desk's ART-10 SE and NE, ART-53 S, E and N). Its Acid Spray on the breath rule (10-22, the third run); its bite
  // only at the one it holds, with advantage, and its AC 11 while prone since 10-28 (js/monsterrules.js, the grid's rules seat on Griz's "Start the seat").
  ankheg: {
    name: 'Ankheg', type: 'monstrosity', sheet: 'ankheg_p1', cr: '2', ac: 14, hp: 39, speed: 30, size: 2, reach: 5, darkvision: 60, blindsight: 60, tremor: true, // (tremor: its 60 ft is the SRD's tremorsense, the bulette's way)
    abil: { str: 17, dex: 11, con: 13, int: 1, wis: 13, cha: 6 }, init: 0, perception: 11,
    saves: { str: 3, dex: 0, con: 1, int: -5, wis: 1, cha: -2 },
    attacks: { bite: { name: 'Bite', atk: 5, dice: '2d6', mod: 3, type: 'slashing', extra: '1d6', extraType: 'acid', reach: 5, grapple: { dc: 13, max: 1, size: 'L', only: true, bitesHeld: true } } }, // (bitesHeld: "Until this grapple ends, the ankheg can bite only the grappled creature and has advantage on attack rolls to do so" -- js/monsterrules.js, 10-28)
    breath: { name: 'Acid Spray', shape: 'line', ft: 30, ab: 'dex', dc: 13, dice: '3d6', type: 'acid', recharge: 6, notHolding: true }, // (SRD 5.1 Acid Spray, Recharge 6: a line 30 ft long and 5 ft wide, DC 13 DEX, 3d6 acid, half on a save, only with no creature grappled -- js/traits.js M.breathe, M.breathHeld; 10-22, the lane's §36)
    proneAC: 11, // ("Armor Class 14 (natural armor), 11 while prone" -- js/monsterrules.js RU.ac, 10-28)
    multi: 1, burrow: 10, walkWithin: 30, // (its dig is 10 ft a turn against a 30-ft walk: it walks to one it can reach this turn, else goes under and comes up beside them -- js/ai.js burrower; the xorn's walkWithin)
    src: 'SRD 5.1 Ankheg (CR 2, Large; AC 14, 39 HP, speed 30, burrow 10 ft; darkvision and tremorsense 60 ft): its Bite +5, 2d6+3 slashing plus 1d6 acid, a Large or smaller target grappled (escape DC 13; grappled, not restrained -- the chuul pincer `only`); burrow 10 ft (js/ai.js burrower: it walks to one within 30 ft, else digs). Its Acid Spray (recharge 6: a line 30 ft long and 5 ft wide, DC 13 DEX, 3d6 acid, half on a save, only with no creature grappled) on the grid breath rule since 10-22 (js/traits.js M.breathe, notHolding). Since 10-28 by the block (js/monsterrules.js): while it holds one it bites only that one, with advantage, and takes no opportunity bite at another; AC 11 while prone'
  },
  // the winter wolf (10-22, the monster cutter seat's third run, on Griz's "close the desk but have the cutter run us out of usage for the
  // week. See y'all tueday"; asked 10-08 among "a creature a biome": deep16-srd-not-yet.md): the SRD 5.1 Winter Wolf from the mechanics the
  // grid has; its sheet tools/winterwolf-sheet.py (the art desk's ART-11 SE and NE, ART-54 S, E and N), its Cold Breath a row of its own.
  winterwolf: {
    name: 'Winter Wolf', type: 'monstrosity', sheet: 'winterwolf_p1', cr: '3', ac: 13, hp: 75, speed: 50, size: 2, reach: 5,
    abil: { str: 18, dex: 13, con: 14, int: 7, wis: 12, cha: 8 }, init: 1, perception: 15, stealth: 3,
    saves: { str: 4, dex: 1, con: 2, int: -2, wis: 1, cha: -1 },
    attacks: { bite: { name: 'Bite', atk: 6, dice: '2d6', mod: 4, type: 'piercing', reach: 5, prone: 14 } },
    breath: { name: 'Cold Breath', shape: 'cone', ft: 15, ab: 'dex', dc: 12, dice: '4d8', type: 'cold', recharge: 5 }, // (SRD 5.1 Cold Breath, Recharge 5-6: a 15-ft cone, DC 12 DEX, 4d8 cold, half on a save -- js/traits.js M.breathe, its sheet's breath row)
    multi: 1, packTactics: true, keenSenses: true, immune: ['cold'],
    src: 'SRD 5.1 Winter Wolf (CR 3, Large; AC 13, 75 HP, speed 50; Perception +5, Stealth +3; immune to cold): its Bite +6, 2d6+4 piercing, DC 14 STR or prone (the worg way); Cold Breath on the grid breath rule (recharge 5-6, a 15-ft cone, DC 12 DEX, 4d8 cold, half on a save); Pack Tactics; Keen Hearing and Smell as GreyFang has it (advantage on the roll to find one hidden, battle.js). Not on the grid, a plain stand-in: Snow Camouflage (advantage on Stealth to hide in snowy terrain) -- the grid has no snow to hide in'
  },
  // the manticore (10-22, the monster cutter seat's third run, on Griz's "close the desk but have the cutter run us out of usage for the
  // week. See y'all tueday"): the SRD 5.1 Manticore from the mechanics the grid has; its sheet tools/manticore-sheet.py (the art desk's ART-12
  // SE and NE, ART-55 S, E and N). Its bite plays `attack`, its claws `claw`, its tail spikes `tailspike` (battle.js: a row named for the blow).
  manticore: {
    name: 'Manticore', type: 'monstrosity', sheet: 'manticore_p1', cr: '3', ac: 14, hp: 68, speed: 30, fly: 50, size: 2, reach: 5, darkvision: 60,
    abil: { str: 17, dex: 16, con: 17, int: 7, wis: 12, cha: 8 }, init: 3, perception: 11,
    saves: { str: 3, dex: 3, con: 3, int: -2, wis: 1, cha: -1 },
    attacks: {
      bite: { name: 'Bite', atk: 5, dice: '1d8', mod: 3, type: 'piercing', reach: 5 },
      claw: { name: 'Claw', atk: 5, dice: '1d6', mod: 3, type: 'slashing', reach: 5 },
      tailspike: { name: 'Tail Spike', atk: 5, dice: '1d8', mod: 3, type: 'piercing', range: [100, 200], ranged: true, count: 24 } // (Tail Spike Regrowth: twenty-four, regrown on a long rest -- battle.js spendThrow)
    },
    multi: ['bite', 'claw', 'claw'], rangedMulti: ['tailspike', 'tailspike', 'tailspike'], // (Multiattack: its bite and two claws, or three tail spikes -- the volley with no one in its reach, js/ai.js volley)
    src: 'SRD 5.1 Manticore (CR 3, Large; AC 14, 68 HP, speed 30, fly 50 -- wings in every fight, js/flight-ai.js; darkvision 60): Multiattack, its Bite +5 1d8+3 piercing and two Claws +5 1d6+3 slashing, or three Tail Spikes +5 100/200 ft 1d8+3 piercing (the volley, rangedMulti); Tail Spike Regrowth, its twenty-four spikes spent in the fight (count). Its Fly row is drawn and not cut: no rule plays a fly row in a fight (it flies on its idle and walk)'
  },
  // the rust monster (10-22, the monster cutter seat's third run, on Griz's "close the desk but have the cutter run us out of usage for the
  // week. See y'all tueday"): the SRD 5.1 Rust Monster from the mechanics the grid has; its sheet tools/rustmonster-sheet.py (the art desk's
  // ART-16 SE and NE, ART-57 S, E and N). Since 10-28 by the block (js/monsterrules.js, the grid's rules seat on Griz's "Start the seat", after his "is that what
  // the SRD has?"): Antennae its own action, Rust Metal a trait, Iron Scent -- the stand-in retired (its bite rusted armour, the gray ooze's `corrosive` way).
  rustmonster: {
    name: 'Rust Monster', type: 'monstrosity', sheet: 'rustmonster_p1', cr: '1/2', ac: 14, hp: 27, speed: 40, size: 1, reach: 5, darkvision: 60,
    abil: { str: 13, dex: 12, con: 13, int: 2, wis: 13, cha: 6 }, init: 1, perception: 11,
    saves: { str: 1, dex: 1, con: 1, int: -4, wis: 1, cha: -2 },
    attacks: { bite: { name: 'Bite', atk: 3, dice: '1d8', mod: 1, type: 'piercing', reach: 5 } },
    multi: 1,
    rustMetal: true, // (Rust Metal: a nonmagical metal weapon that hits it, a cumulative -1 to its damage after dealing it -- for the fight, RULED 10-28 -- destroyed at -5; nonmagical metal ammunition that hits it destroyed -- js/monsterrules.js)
    antennae: { dc: 11, reach: 5 }, // (Antennae, an action: a nonmagical ferrous metal object it can see within 5 ft, worn or carried -- DC 11 DEX to avoid; metal armour or a shield -1 to the AC it offers, for the fight, destroyed at AC 10 / +0; a held metal weapon rusts as Rust Metal)
    ironScent: 30, // (Iron Scent: it pinpoints ferrous metal within 30 ft -- a hidden or invisible one carrying it is known to its AI, js/ai.js heroes; it does not see them)
    src: 'SRD 5.1 Rust Monster (CR 1/2, Medium; AC 14, 27 HP, speed 40; darkvision 60): its Bite +3, 1d8+1 piercing; by the block since 10-28 (js/monsterrules.js): Antennae, an action (a nonmagical ferrous metal object it can see within 5 ft, DC 11 DEX to avoid; metal armour or a metal shield -1 to the AC it offers, cumulative, armour at AC 10 or a shield at +0 destroyed; a held metal weapon rusts as Rust Metal) -- its AI reaches for the weapon of the one that last hit it, else the nearest one\'s weapon, armour, then shield (RULED 10-28, Griz: "Weapon first"), and bites only where no metal is near; Rust Metal (a nonmagical metal weapon that hits it -1 to damage after dealing it, cumulative, destroyed at -5; metal ammunition destroyed); Iron Scent (ferrous metal within 30 ft pinpointed: its AI knows a hidden or invisible metal-bearer is there). The SRD\'s "permanent" is the fight\'s here (RULED 10-28, Griz: "yeah, we\'re leaving out wear, but should probably also let rust destroy stuff during the fight the way we did the ooze?"): the -1s hold for the rest of the fight, and a thing rusted through is gone for good, as the gray ooze\'s eaten-through is -- off the house sheet, and off a Pocket DM seat (his "negative. It\'s not \'then\' is \'else\'"). Not the SRD, not on the grid: Gobble -- the art desk\'s drawn row, left uncut. Its Antennae row plays as the antennae reach (cut 10-28, f903094)'
  },
  // the basilisk (10-22, the monster cutter seat's third run, on Griz's "close the desk but have the cutter run us out of usage for the
  // week. See y'all tueday"): the SRD 5.1 Basilisk from the mechanics the grid has -- its Petrifying Gaze the grid's gaze rule (js/traits.js,
  // the rules before the bestiary's eleven, 10-08; the testing room's &gaze carried its numbers); its sheet tools/basilisk-sheet.py (ART-17).
  basilisk: {
    name: 'Basilisk', type: 'monstrosity', sheet: 'basilisk_p1', cr: '3', ac: 15, hp: 52, speed: 20, size: 1, reach: 5, darkvision: 60,
    abil: { str: 16, dex: 8, con: 15, int: 2, wis: 8, cha: 7 }, init: -1, perception: 9,
    saves: { str: 3, dex: -1, con: 2, int: -4, wis: -1, cha: -2 },
    attacks: { bite: { name: 'Bite', atk: 5, dice: '2d6', mod: 3, type: 'piercing', extra: '2d6', extraType: 'poison', reach: 5 } },
    gaze: { range: 30, dc: 12, ab: 'con', stone: true, mirror: true, title: 'THE BASILISK GAZE' }, // (Petrifying Gaze, SRD 5.1: 30 ft, DC 12 CON, the stone begun and restrained, the save again at its next turn's end; averting the eyes; its reflection in bright light turns it on itself -- js/traits.js gaze, M.stoneBegin, the mirror)
    multi: 1,
    src: 'SRD 5.1 Basilisk (CR 3, Medium; AC 15, 52 HP, speed 20; darkvision 60): its Bite +5, 2d6+3 piercing plus 2d6 poison; Petrifying Gaze on the grid gaze rule (30 ft, DC 12 CON: restrained as the stone begins, petrified on the second failure, Greater Restoration ends it; a hero may avert its eyes; its reflection in bright light, the steel mirror, turns the gaze on itself) -- its sheet plays its Gaze row as the gaze falls'
  },
  // the gargoyle (10-22, the monster cutter seat's third run, on Griz's "close the desk but have the cutter run us out of usage for the
  // week. See y'all tueday"): the SRD 5.1 Gargoyle from the mechanics the grid has -- its False Appearance the roper's (a `still` row till its
  // first turn or a wound, then its `reveal`: js/ui.js, js/ai.js), its resistance the earth elemental's `mundane`; its sheet tools/gargoyle-sheet.py (ART-18).
  gargoyle: {
    name: 'Gargoyle', type: 'elemental', sheet: 'gargoyle_p1', cr: '2', ac: 15, hp: 52, speed: 30, fly: 60, size: 1, reach: 5, darkvision: 60,
    abil: { str: 15, dex: 11, con: 16, int: 6, wis: 11, cha: 7 }, init: 0, perception: 10,
    saves: { str: 2, dex: 0, con: 3, int: -2, wis: 0, cha: -2 },
    attacks: {
      bite: { name: 'Bite', atk: 4, dice: '1d6', mod: 2, type: 'piercing', reach: 5 },
      claws: { name: 'Claws', atk: 4, dice: '1d6', mod: 2, type: 'slashing', reach: 5, row: 'claw' } // (its Claws row on the sheet: `claw`, played once -- js/ui.js)
    },
    multi: ['bite', 'claws'], resist: ['mundane'], immune: ['poison'], condImmune: ['exhaustion', 'petrified', 'poisoned'],
    src: 'SRD 5.1 Gargoyle (CR 2, Medium elemental; AC 15, 52 HP, speed 30, fly 60 -- wings in every fight, js/flight-ai.js; darkvision 60): Multiattack, its Bite +4 1d6+2 piercing and Claws +4 1d6+2 slashing; resistant to nonmagical bludgeoning, piercing and slashing (mundane, the earth elemental way; adamantine not on the grid); immune to poison, exhaustion, petrified and poisoned; False Appearance as the roper (its Statue row stands till its first turn or a wound, then it Wakes). Its Fly row is drawn and not cut: no rule plays a fly row in a fight'
  },
  // the aboleth (10-22, the monster cutter seat's third run, on Griz's "close the desk but have the cutter run us out of usage for the
  // week. See y'all tueday"): the SRD 5.1 Aboleth from the mechanics the grid has -- bound to the water as the otyugh, its legendary actions
  // the rule built for it (js/traits.js, 10-08); its sheet tools/aboleth-sheet.py (ART-19). Its tentacles play `tentacles`, its tail `tail`.
  aboleth: {
    name: 'Aboleth', type: 'aberration', sheet: 'aboleth_p1', cr: '10', ac: 17, hp: 135, speed: 40, size: 2, reach: 10, darkvision: 120,
    abil: { str: 21, dex: 9, con: 15, int: 18, wis: 15, cha: 18 }, init: -1, perception: 20,
    saves: { str: 5, dex: -1, con: 6, int: 8, wis: 6, cha: 4 },
    attacks: {
      tentacle: { name: 'Tentacle', atk: 9, dice: '2d6', mod: 5, type: 'bludgeoning', reach: 10, row: 'tentacles' },
      tail: { name: 'Tail', atk: 9, dice: '3d6', mod: 5, type: 'bludgeoning', reach: 10 }
    },
    multi: ['tentacle', 'tentacle', 'tentacle'], bound: '~', swims: true, // (Multiattack, three tentacles; swim 40 in the water it keeps to, the otyugh's way -- its 10 ft on land not on the grid)
    legendary: { n: 3, acts: [{ name: 'Detect', cost: 1, detect: true }, { name: 'Tail Swipe', cost: 1, atk: 'tail' }, { name: 'Psychic Drain', cost: 2, drain: { dice: '3d6', type: 'psychic' } }] }, // (SRD 5.1 legendary actions -- Psychic Drain on one it has charmed: its Enslave's, since 10-28)
    enslave: { dc: 14, range: 30, uses: 3 }, // (Enslave (3/Day): one creature it can see within 30 ft, DC 14 WIS or charmed under its control, no reactions, till the aboleth dies or leaves the plane; a save each time the charmed one takes damage -- js/monsterrules.js, Dominate Person's machinery, 10-28)
    src: 'SRD 5.1 Aboleth (CR 10, Large; AC 17, 135 HP, speed 10, swim 40; darkvision 120): Multiattack, three Tentacles +9 reach 10, 2d6+5 bludgeoning; Tail +9 reach 10, 3d6+5; legendary actions (three): Detect, Tail Swipe, Psychic Drain (2, on one it has charmed). Bound to the water (swim 40; on land 10 ft, not on the grid). Enslave (3/day) since 10-28 (js/monsterrules.js): one it sees within 30 ft, DC 14 WIS or charmed under its control -- it fights for the aboleth by its own class\'s tactics, a hero too, knowing its old party (a blow at one concentrating or at the healer worth more to it: "and knowing party comp enough to hit them where it hurts the most"), and takes no reactions -- till the aboleth dies or is banished; it saves again each time it takes damage; its Psychic Drain drains that one (3d6 psychic, the aboleth heals as much). Not on the grid, plain stand-ins: the tentacle disease (DC 14 CON) -- none; Mucous Cloud (underwater) and Probing Telepathy -- none; the telepathy over any distance and the mile-away save -- not a fight\'s. Its Enslave row is drawn and not cut yet (it casts on its idle)'
  },
  // the lamia (10-27, the monster cutter seat on Griz's "spin up a cutter for the leftovers in fresh, everything in the outbox has been sent";
  // asked 10-08 among "a creature a biome", the Blue's desert: deep16-srd-not-yet.md): the SRD 5.1 Lamia from the mechanics the grid has; its
  // sheet tools/lamia-sheet.py (ART-20). Its claws play `claw`, its dagger `attack`, its Intoxicating Touch `touch`, its two spells `cast`;
  // it stands disguised as a robed woman till its first turn or a wound (its `still` row, the gargoyle's way) and drops the disguise (`reveal`).
  lamia: {
    name: 'Lamia', type: 'monstrosity', sheet: 'lamia_p1', cr: '4', ac: 13, hp: 97, speed: 30, size: 2, reach: 5, darkvision: 60,
    abil: { str: 16, dex: 13, con: 15, int: 14, wis: 15, cha: 16 }, init: 1, perception: 12, stealth: 3,
    saves: { str: 3, dex: 1, con: 2, int: 2, wis: 2, cha: 3 },
    attacks: {
      claws: { name: 'Claws', atk: 5, dice: '2d10', mod: 3, type: 'slashing', reach: 5, row: 'claw' },
      dagger: { name: 'Dagger', atk: 5, dice: '1d4', mod: 3, type: 'piercing', reach: 5, or: 'touch' }, // (or: "one with its dagger or Intoxicating Touch" -- the touch at one not cursed yet, js/ai.js)
      touch: { name: 'Intoxicating Touch', atk: 5, spell: true, touch: true, noDamage: true, intoxicate: true, reach: 5, row: 'touch' } // (a melee spell attack -- `touch`, battle.js: a reach, not a cast pose -- cursed, disadvantage on WIS saves and every ability check -- js/battle.js, js/traits.js, js/rules.js)
    },
    multi: ['claws', 'dagger'],
    // (Innate Spellcasting, CHA, DC 13: Charm Person and Mirror Image 3/day each -- three 1st-level and three 2nd-level slots, the class AI's)
    caster: { lvl: 4, ab: 'cha', dc: 13, atk: 5, slots: [3, 3], known: ['charmperson', 'mirrorimage'] },
    src: 'SRD 5.1 Lamia (CR 4, Large; AC 13, 97 HP, speed 30; darkvision 60; Deception +7, Insight +4, Stealth +3): Multiattack, its Claws +5 2d10+3 slashing and its Dagger +5 1d4+3 piercing or Intoxicating Touch (+5 melee spell attack: cursed an hour -- the fight -- disadvantage on WIS saves and every ability check; Greater Restoration lifts it); Innate Spellcasting (CHA, DC 13): Charm Person and Mirror Image 3/day each, as slots the class AI spends (it may spend a 2nd-level one on a Charm Person). Disguise Self at will as its False Appearance: it stands as a robed woman till its first turn or a wound. Not on the grid, plain stand-ins: Major Image, Scrying, Suggestion and Geas -- none; Disguise Self\'s any humanoid form -- the one robed woman; seeing through it (Investigation) -- none'
  },
  // the harpy (10-28, the monster cutter seat on Griz's "filled fresh with harpies - probably a 'make the best of what it gave you' situation";
  // asked 10-08 among "a creature a biome", Web Gulch: deep16-srd-not-yet.md): the SRD 5.1 Harpy from the mechanics the grid has; its sheet
  // tools/harpy-sheet.py (the art desk's ART-14 SE and NE, ART-56 S, E and N). Its club plays `attack`, its claws `claw`.
  harpy: {
    name: 'Harpy', type: 'monstrosity', sheet: 'harpy_p1', cr: '1', ac: 11, hp: 38, speed: 20, fly: 40, size: 1, reach: 5,
    abil: { str: 12, dex: 13, con: 12, int: 7, wis: 10, cha: 13 }, init: 1, perception: 10,
    saves: { str: 1, dex: 1, con: 1, int: -2, wis: 0, cha: 1 },
    attacks: {
      claws: { name: 'Claws', atk: 3, dice: '2d4', mod: 1, type: 'slashing', reach: 5, row: 'claw' },
      club: { name: 'Club', atk: 3, dice: '1d4', mod: 1, type: 'bludgeoning', reach: 5 }
    },
    multi: ['claws', 'club'],
    luringSong: { dc: 11 }, // (Luring Song: every humanoid and giant that hears it, DC 11 WIS or charmed while it sings -- incapacitated, walking to it by the most direct route; saves before damaging terrain, on harm from another, at each turn's end; a save makes one proof against this harpy -- js/monsterrules.js, 10-28)
    src: 'SRD 5.1 Harpy (CR 1, Medium; AC 11, 38 HP, speed 20, fly 40 -- wings in every fight, js/flight-ai.js): Multiattack, its Claws +3 2d4+1 slashing and its Club +3 1d4+1 bludgeoning. The Luring Song since 10-28 (js/monsterrules.js): an action, every humanoid and giant that hears it (300 ft: the whole field, its own side\'s too -- she sings whenever a foe can hear, not weighing them: RULED 10-28, Griz, "I don\'t see why she\'d care, who are we grouping with harpies?") DC 11 WIS or charmed till the song ends -- incapacitated, walking to it by the most direct route each turn, the opportunity attacks taken; a save before stepping into burning ground, on harm from another, and at the end of each of its turns; a save makes one proof against this harpy for the fight; a bonus action each turn after keeps it, and it ends if the harpy is incapacitated. Its Song row plays as it sings (cut 10-28, f903094), its Fly row aloft (f04ec01)'
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
  // a patrol lady of the Dominion (the Snoot mode, 10-15 -- Griz: "there wasn't any warlocks when I ran the party into a dominion fight"): one rides
  // each of its wagons, a warlock of the Mirror -- Amara's numbers (warlock 5 at her register's hit points, two beams of Eldritch Blast, the Mirror's
  // eye), unnamed and without her list; she stands with her soldiers (no flight: the Snoot's fight is the road's). The Snoot's band sends one for
  // each wagon whose lady still lives (snoot-mode/js/rules.js SN.band), and one who falls here falls on its map
  patrollady: {
    name: 'Patrol Lady', type: 'humanoid', sheet: 'npcwarlock_p0', humanoid: true, cr: '3', ac: 13, hp: 45, speed: 30, size: 1, reach: 5,
    abil: { str: 9, dex: 14, con: 12, int: 12, wis: 11, cha: 17 }, init: 2, perception: 10,
    saves: { str: -1, dex: 2, con: 1, int: 1, wis: 2, cha: 5 },
    attacks: { blast: { name: 'Eldritch Blast', atk: 6, dice: '1d10', mod: 3, type: 'force', ranged: true, spell: true, range: [120, 120], fx: 'fire' } },
    multi: ['blast', 'blast'], mirrorEye: true, build: 'patrolladyw', // (10-17: built as a warlock 5 of the Mirror with the Pact of the Blade and a list of her own, js/classes.js NPC.NAMED; the attack above stands if the build cannot)
    src: 'the Snoot mode\'s Dominion wagons (snoot-mode/js/data.js SN.DOMINION: "the lady a CHAINMAIL warlock", Kat\'s wagon loadout): Amara\'s sheet above, unnamed -- the seat\'s draft, invented.json#patrol-lady-grid'
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
  // the water elemental (SRD 5.1, CR 5, Large): the Black Water's, in the spirit naga's place since 10-14 (Griz, 10-13: "re spirit naga - we got water
  // elemental art waiting, we'll swap them out - text sounds more like them than naga as I recall anyway"). Two Slams, or its Whelm (recharge 4-6:
  // js/ai.js whelm, drown); a friend beside it pulls the held out (battle.js PULL OUT); cold freezes it (battle.js hurt, grimoire.js onStart)
  waterelemental: {
    name: 'Water Elemental', type: 'elemental', sheet: 'waterelemental_p2', cr: '5', ac: 14, hp: 114, speed: 30, size: 2, reach: 5, darkvision: 60,
    abil: { str: 18, dex: 14, con: 18, int: 5, wis: 10, cha: 8 }, init: 2, perception: 10,
    saves: { str: 4, dex: 2, con: 4, int: -3, wis: 0, cha: -1 },
    attacks: { slam: { name: 'Slam', atk: 7, dice: '2d8', mod: 4, type: 'bludgeoning', reach: 5 } },
    multi: ['slam', 'slam'], resist: ['acid', 'mundane'], immune: ['poison'], swims: true, freeze: true,
    whelm: { dc: 15, escape: 14, dice: '2d8', mod: 4, recharge: 4 },
    condImmune: ['exhaustion', 'grappled', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained', 'unconscious'],
    src: 'SRD 5.1 Water Elemental (CR 5, Large; AC 14, 114 HP, speed 30, swim 90): two Slams +7 2d8+4; Whelm (recharge 4-6) read as on those beside it, the cube\'s Engulf\'s way -- Water Form (it may stop in a hostile creature\'s space) is not on the grid, nor a swim speed of its own (it swims, at 30); Freeze; resists acid and plain weapons, immune to poison, its condition immunities (10-14)'
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
    name: 'Ochre Jelly', type: 'ooze', sheet: 'ochrejelly_p2', small: 'ochrejellym_p2', cr: '2', ac: 8, hp: 45, speed: 10, climbs: 10, size: 2, reach: 5, blindsight: 60, blind: true,
    abil: { str: 15, dex: 6, con: 14, int: 2, wis: 6, cha: 1 }, init: -2, perception: 8,
    saves: { str: 2, dex: -2, con: 2, int: -4, wis: -2, cha: -5 },
    attacks: { pseudopod: { name: 'Pseudopod', atk: 4, dice: '2d6', mod: 2, type: 'bludgeoning', extra: '1d6', extraType: 'acid', reach: 5 } },
    multi: 1, resist: ['acid'], immune: ['lightning', 'slashing'], split: true, condImmune: ['blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'prone', 'asleep'],
    src: 'SRD 5.1 Ochre Jelly (CR 2, Large): Split on slashing or lightning, like the pudding; content/monsters.json ochrejelly; condition immunities blinded, charmed, deafened, exhaustion, frightened, prone (SRD 5.1; the 8-bit sheet had blinded, frightened, prone, asleep -- asleep kept; 10-02 runner)'
  },
  grayooze: {
    name: 'Gray Ooze', type: 'ooze', sheet: 'grayooze_p2', cr: '1/2', ac: 8, hp: 22, speed: 10, climbs: 10, size: 1, reach: 5, blindsight: 60, blind: true,
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
    name: 'Bar Brawler', type: 'humanoid', sheet: 'brawler_p1', cr: '1/8', ac: 12, armor: 'leather armor', hp: 11, speed: 30, size: 1, reach: 5,
    abil: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 }, init: 1, perception: 10,
    saves: { str: 0, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
    attacks: { fists: { name: 'Fists', atk: 3, dice: '1d4', mod: 1, type: 'bludgeoning', reach: 5 } },
    multi: 1, src: 'content/monsters.json brawler (the Hex floor)'
  },
  cardbruiser: {
    name: 'Card Bruiser', type: 'humanoid', sheet: 'crewman_p1', cr: '1/4', ac: 12, armor: 'leather armor', hp: 22, speed: 30, size: 1, reach: 5,
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
    name: 'Bandit', type: 'humanoid', sheet: 'bandit_p1', cr: '1/8', ac: 12, armor: 'leather armor', hp: 11, speed: 30, size: 1, reach: 5,
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
    name: 'Goblin', type: 'humanoid', sheet: 'goblin_p2', cr: '1/4', ac: 15, armor: 'leather armor', shield: true, hp: 7, speed: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 }, init: 2, perception: 9,
    saves: { str: -1, dex: 2, con: 0, int: 0, wis: -1, cha: -1 },
    attacks: {
      scimitar: { name: 'Scimitar', atk: 4, dice: '1d6', mod: 2, type: 'slashing', reach: 5 },
      shortbow: { name: 'Shortbow', atk: 4, dice: '1d6', mod: 2, type: 'piercing', range: [80, 320], ranged: true }
    },
    multi: 1, nimble: true, stealth: 6, src: 'SRD 5.1 Goblin (CR 1/4); content/monsters.json goblin (the king\'s road, leg one); Nimble Escape: Disengage for the bonus action, and a step back (js/traits.js, 09-28), and the Hide for the bonus action (js/traits.js after, Stealth +6 -- SRD 5.1 Skills; 10-07, Griz: "4 yes"; its sheet\'s hide row plays: js/ui.js, battle.js hide); the Shortbow +4 1d6+2 80/320 (SRD 5.1, loosed when nothing is in reach: ai.js volley; 10-02 runner)'
  },
  bugbear: {
    name: 'Bugbear', type: 'humanoid', sheet: 'bugbear_p1', cr: '1', ac: 16, armor: 'hide armor', shield: true, hp: 27, speed: 30, size: 1, reach: 5, darkvision: 60,
    abil: { str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9 }, init: 2, perception: 10,
    saves: { str: 2, dex: 2, con: 1, int: -1, wis: 0, cha: -1 },
    attacks: {
      morningstar: { name: 'Morningstar', atk: 4, dice: '2d8', mod: 2, type: 'piercing', reach: 5 },
      javelin: { name: 'Javelin', atk: 4, dice: '1d6', mod: 2, type: 'piercing', range: [30, 120], ranged: true, count: 2 }
    },
    multi: 1, surprise: '2d6', src: 'SRD 5.1 Bugbear (CR 1); content/monsters.json bugbear; the chief\'s sheet; the Javelin thrown +4 1d6+2 30/120 (SRD 5.1, when nothing is in reach: ai.js volley; 10-02 runner); its own look since 10-07, bugbear_p1 (his GPT sheet, tools/bugbear-sheet.py)'
  },
  ogre: {
    name: 'Ogre', type: 'giant', sheet: 'ogre_p2', cr: '2', ac: 11, armor: 'hide armor', hp: 59, speed: 40, size: 2, reach: 5, darkvision: 60,
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
    name: 'Gibbering Mouther', type: 'aberration', sheet: 'mouther_p2', cr: '2', ac: 9, hp: 67, speed: 10, size: 1, reach: 5, darkvision: 60,
    abil: { str: 10, dex: 8, con: 16, int: 3, wis: 10, cha: 6 }, init: -1, perception: 10,
    saves: { str: 0, dex: -1, con: 3, int: -4, wis: 0, cha: -2 },
    attacks: { bites: { name: 'Bites', atk: 2, dice: '5d6', mod: 0, type: 'piercing', reach: 5, prone: 10, proneMax: 1 } }, // (Medium or smaller: STR 10 or knocked prone)
    multi: 1, gibber: { dc: 10, range: 20 }, aberrant: { dc: 10, r: 10 }, spittle: { dc: 13, range: 15, r: 5, recharge: 5 },
    // (10-06, the story-and-the-pocket-dm handoff, Griz: "SRD what you can": Gibbering was a stun on a recharge of 4-6, "read as the 8-bit game has it" -- now the SRD's, js/traits.js and
    // grimoire.js M.confusedTurn; the Spittle ai.js spit; the 8-bit's own mouther keeps its stun, its frame's)
    src: 'SRD 5.1 Gibbering Mouther (CR 2): Aberrant Ground (10 ft of doughlike difficult ground, STR 10 at a turn\'s start or no move), Gibbering (within 20 ft at a turn\'s start, WIS 10 or no reactions and a d8 for the turn), Bites (STR 10 or prone, Medium or smaller), Blinding Spittle (recharge 5-6, a point within 15 ft, DEX 13 or blinded till the end of its next turn); content/monsters.json mouther (leg two)', todo: 'one killed by the bite is not absorbed'
  },
  // the Hex card's top (events.js, Fight Night): Talmok and the visiting barbarian, both reckless; Talmok rages when first hit
  talmok: { // (his sheet since 10-30, talmok_p2: the art desk's new look whole, his five town pages and ART-123-TALMOK-COMBAT -- tools/talmok-sheet.py; the old KayKit talmok_p1 kept beside it)
    name: 'Talmok', type: 'humanoid', named: true, sheet: 'talmok_p2', cr: '2', ac: 15, hp: 35, speed: 30, size: 1, reach: 5,
    abil: { str: 16, dex: 14, con: 16, int: 9, wis: 13, cha: 11 }, init: 2, perception: 11,
    saves: { str: 5, dex: 2, con: 5, int: -1, wis: 1, cha: 0 },
    attacks: { fists: { name: 'Pit Fists', atk: 5, dice: '1d4', mod: 3, type: 'bludgeoning', reach: 5, rage: 2, prone: 13 } },
    multi: ['fists', 'fists'], reckless: true, rageOnHit: true,
    src: 'content/monsters.json talmok (the 8-bit game\'s own pit fighter): Pit Fists 1d4+3 (+2 raging; a flat 4 till 09-28h, the SRD unarmed strike: the Path of the Sand and its PIT FISTS give them the die), reckless, rages on the first hit (here: two blows a turn, as a CR 2 brawler); the fists knock prone (STR 13)'
  },
  berserker: {
    name: 'Visiting Barbarian', type: 'humanoid', sheet: 'berserker_p1', cr: '2', ac: 13, armor: 'hide armor', hp: 67, speed: 30, size: 1, reach: 5,
    abil: { str: 16, dex: 12, con: 17, int: 9, wis: 11, cha: 9 }, init: 1, perception: 10,
    saves: { str: 3, dex: 1, con: 3, int: -1, wis: 0, cha: -1 },
    attacks: { greataxe: { name: 'Greataxe', atk: 5, dice: '1d12', mod: 3, type: 'slashing', reach: 5 } },
    multi: 1, reckless: true, src: 'SRD 5.1 Berserker (CR 2, Reckless); content/monsters.json berserker (the Hex card\'s visiting barbarian)'
  },
  banditcaptain: {
    name: 'Bandit Captain', type: 'humanoid', sheet: 'hask_p1', cr: '2', ac: 15, armor: 'studded leather', hp: 65, speed: 30, size: 1, reach: 5,
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
    name: 'Grimlock', type: 'humanoid', sheet: 'grimlock_p2', cr: '1/4', ac: 11, hp: 11, speed: 30, size: 1, reach: 5, blindsight: 30, blind: true,
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
  // points (halfHP), never knocked down; one creature's sheet stands for the cloud -- but the rats' own since 10-20: ratswarm_p1, the art desk's
  // ART-74, many Tiny rats in its square, a row for the Bites, a Flinch, the Scatter it dies in, and an Oil Fire it lives through (js/oil.js;
  // tools/ratswarm-sheet.py -- Griz, 10-20: "Negative, except for Rat swarm")
  ratswarm: {
    name: 'Rat Swarm', type: 'beast', sheet: 'ratswarm_p1', cr: '1/4', ac: 10, hp: 24, speed: 30, size: 1, reach: 5, darkvision: 30,
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

// the Gray Keeping's gnolls (10-15, Griz: "we need a 3rd tribe color for the gray keeping i think"; his pick, "D - the darker cloth and grayer fur.
// Wire the Gray Keeping in it."): the same SRD blocks on the seat-tribe's sheet (graykeeping_p2, tools/gnoll-sheet.py gray_cloth: dark gray cloth, grayer fur).
// The Snoot mode's Gray Keeping units send them to the grid (snoot-mode/js/data.js GRAYBAND). `seatAs`: a fight's spots for the blue one seat them
// (js/battle.js roster); the kind names start as theirs do, so whatever knows a gnoll by its kind knows these (grimoire.js M.gnoll). Off the DM's
// shelves, one of each there (js/pocketdm.js PD.OUT).
window.D16.FOES.gnollgray = Object.assign({}, window.D16.FOES.gnoll, { sheet: 'graykeeping_p2', seatAs: 'gnoll',
  src: window.D16.FOES.gnoll.src + '; the look of the Gray Keeping (graykeeping_p2, 10-15): the same block' });
window.D16.FOES.gloryseekergray = Object.assign({}, window.D16.FOES.gloryseeker, { sheet: 'graykeeping_p2', seatAs: 'gloryseeker',
  src: window.D16.FOES.gloryseeker.src + '; the young blood of the Gray Keeping (graykeeping_p2, 10-15: at the size of a gnoll, one gray sheet for both): the same block' });
// the Gray Keeping's matriarch-clerics (10-16, Griz: "let's give one group a superhero matriarch and the other hero ... Give the superhero entangle?"; then
// "all 8 leans are go"): the Snoot's death-watch on the moot ground and the tribe's band (snoot-mode/js/data.js gkw, gk2) send them to the grid. The
// death-watch's women are the gnoll's SRD block (the register's "larger and fiercer" is the Snoot's tables': they defend as Armored Foot there); the Eldest
// and the band's matriarch are clerics of the Keeping by their class (js/classes.js NPC.NAMED matriarch, matriarchlama: cleric 9 and 6, OD&D Book I's
// Patriarch and Lama). Their sheet is ART-68's gnollmatriarch_p1 since it was cut (10-16, toned gray on his pick). Off the DM's shelf and the pot as the gray gnolls are
// (js/pocketdm.js PD.OUT, js/pocket.js PK.NAMED_OUT): the Snoot's own
window.D16.FOES.gnollmatriarch = Object.assign({}, window.D16.FOES.gnoll, { name: 'Matriarch', sheet: 'gnollmatriarch_p1', seatAs: 'gnoll',
  src: window.D16.FOES.gnoll.src + '; a matriarch of the Gray Keeping\'s death-watch (the Snoot mode, 10-16): the same block' });
window.D16.FOES.gnollmatriarcheldest = {
  named: true, name: 'The Eldest', type: 'humanoid', sheet: 'gnollmatriarch_p1', cr: '9', ac: 14, hp: 175, speed: 30, size: 1, reach: 5, darkvision: 60, seatAs: 'gnoll',
  abil: { str: 15, dex: 12, con: 14, int: 10, wis: 18, cha: 12 }, init: 1, perception: 14,
  saves: { str: 2, dex: 1, con: 2, int: 0, wis: 8, cha: 5 },
  attacks: { staff: { name: 'Skull-Staff', atk: 6, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 } },
  multi: 1, build: 'matriarch',
  // a boss on the grid (10-16, Griz: "approve 3 leans above" -- her hit points up, legendary actions, Legendary Resistance; the SRD's rules, js/traits.js; 175 HP
  // tuned on the bench with her three bodyguards and eight matriarchs: the four at 8 win 25 of 40, 28% of their HP left, about two downs a fight):
  // the staff, a cantrip, and RHOLLOR'S CALL (ours: she cackles, and the death-watch within 30 ft spends its reactions to close in and strike)
  legendary: { n: 3, acts: [{ name: 'Skull-Staff', cost: 1, atk: 'weapon' }, { name: 'Sacred Flame', cost: 1, cast: 'sacredflame' }, { name: 'Rhollor\'s Call', cost: 2, call: 30 }] }, legendaryResist: 3,
  src: 'ours (invented.json #gray-keeping-matriarchs): the death-watch\'s eldest, a cleric 9 of the Keeping (js/classes.js NPC.NAMED matriarch) -- OD&D Book I\'s Patriarch of 9th, "Superhero - 1"; this block is her sheet as the class builds it (cleric 9 at the average: 66 HP, AC 14 in a chain shirt)'
};
// the death-watch's bodyguards (10-16, Griz: "approve 3 leans above"): OD&D Book II's gnoll king keeps "1-4 bodyguards" who fight as trolls without the
// regeneration -- the Mane's watch keeps three (tuned: four made it 9 of 20 for the four), the SRD 5.1 Troll's numbers on her sheet, no Regeneration, her size; its
// claws read as the staff's two blows
window.D16.FOES.gnollmatriarchguard = Object.assign({}, window.D16.FOES.troll, { name: 'Matriarch of the Watch', type: 'humanoid', sheet: 'gnollmatriarch_p1', size: 1, climbs: 0, regen: 0, seatAs: 'gnoll',
  attacks: { bite: { name: 'Bite', atk: 7, dice: '1d6', mod: 4, type: 'piercing', reach: 5 }, staff: { name: 'Skull-Staff', atk: 7, dice: '2d6', mod: 4, type: 'bludgeoning', reach: 5 } },
  multi: ['bite', 'staff', 'staff'],
  src: 'OD&D Book II (a gnoll king\'s bodyguards "as Trolls" without the regeneration) on the SRD 5.1 Troll (CR 5): AC 15, 84 HP, bite and two blows; ours, invented.json #gray-keeping-matriarchs' });
window.D16.FOES.gnollmatriarchlama = {
  name: 'Matriarch', type: 'humanoid', sheet: 'gnollmatriarch_p1', cr: '3', ac: 14, hp: 39, speed: 30, size: 1, reach: 5, darkvision: 60, seatAs: 'gnoll',
  abil: { str: 14, dex: 12, con: 13, int: 10, wis: 16, cha: 11 }, init: 1, perception: 13,
  saves: { str: 2, dex: 1, con: 1, int: 0, wis: 6, cha: 3 },
  attacks: { staff: { name: 'Skull-Staff', atk: 5, dice: '1d6', mod: 2, type: 'bludgeoning', reach: 5 } },
  multi: 1, build: 'matriarchlama',
  src: 'ours (invented.json #gray-keeping-matriarchs): a matriarch with the Gray Keeping\'s band, a cleric 6 of the Keeping (js/classes.js NPC.NAMED matriarchlama) -- OD&D Book I\'s Lama, "Hero"; this block is her sheet as the class builds it (cleric 6 at the average: 39 HP, AC 14)'
};
// the townsfolk (10-27, the monster cutter seat on Griz's "spin up a cutter for the leftovers in fresh, everything in the outbox has been sent"; his
// 10-14: "the villagers are for the edifice fight I think"): the SRD 5.1 Commoner on the art desk's three looks of the street's people, ART-09 and
// ART-52 (tools/townsfolk-sheet.py: a man, a woman, a child, idle and run in all eight facings). The Skylights' street runs on them (js/battle.js
// townsfolk, one look after another); the Pocket DM may draw any of the three.
window.D16.FOES.commoner = {
  name: 'Commoner', type: 'humanoid', sheet: 'folkman_p1', cr: '0', ac: 10, hp: 4, speed: 30, size: 1, reach: 5,
  abil: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, init: 0, perception: 10,
  saves: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  attacks: { club: { name: 'Club', atk: 2, dice: '1d4', mod: 0, type: 'bludgeoning', reach: 5 } },
  multi: 1,
  src: 'SRD 5.1 Commoner (CR 0, Medium humanoid; AC 10, 4 HP, speed 30): its Club +2, 1d4 bludgeoning. Drawn unarmed and running (the art desk\'s townsfolk, idle and run only): a club swung plays its idle'
};
window.D16.FOES.commonerwoman = Object.assign({}, window.D16.FOES.commoner, { sheet: 'folkwoman_p1',
  src: window.D16.FOES.commoner.src + '; the woman\'s look (folkwoman_p1, 10-27): the same block' });
window.D16.FOES.commonerchild = Object.assign({}, window.D16.FOES.commoner, { name: 'Child', size: 1,
  sheet: 'folkchild_p1', src: window.D16.FOES.commoner.src + '; the child\'s look (folkchild_p1, 10-27): the same block, the size of a Small one\'s figure on a Medium square' });
