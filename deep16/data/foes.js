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
  }
};
