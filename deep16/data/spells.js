/* DEEP16 — the grid half of every spell the heroes know (SRD 5.1): range, shape, casting time, concentration, what
   it does on the grid. The 8-bit game's content/spells.json keeps the rest (level, damage, save, element), read at run
   time; this table only adds what a grid needs. Griz (09-27, the pane): "aurdin only being able to cast firebolt and
   lyman no spell access" -- so all of them.
   shape: attack (one spell attack) · rays / darts (N shots at chosen targets) · splash (one creature, and one beside it)
          · single (one creature) · touch (an adjacent ally or yourself) · allies (up to N within range) · self
          · sphere (r ft, at a point within range) · cube (size ft) · cone (len ft, from you) · line (len ft x 5, from you)
          · reaction (asked for, never cast from the list) · none (no use in this fight)
   time: A action, B bonus action.  conc: concentration.  side: foe / ally / any. */
'use strict';
(window.D16 = window.D16 || {}).SPELLS = {
  firebolt: { shape: 'attack', range: 120, time: 'A' },
  acidsplash: { shape: 'splash', range: 60, time: 'A' },
  light: { shape: 'none', why: 'the ledger-lamp is lit' },
  burninghands: { shape: 'cone', len: 15, time: 'A' },
  magicmissile: { shape: 'darts', range: 120, n: 3, time: 'A' },
  shield: { shape: 'reaction', why: 'a reaction: offered when a blow would land' },
  sleep: { shape: 'sphere', range: 90, r: 20, time: 'A', pool: 5, poolUp: 2 },
  detectmagic: { shape: 'none', why: 'nothing here to find' },
  mageArmor: { shape: 'touch', side: 'ally', time: 'A', unarmored: true },
  scorchingray: { shape: 'rays', range: 120, n: 3, time: 'A' },
  web: { shape: 'cube', range: 60, size: 20, time: 'A', conc: true },
  shatter: { shape: 'sphere', range: 60, r: 10, time: 'A' },
  mistystep: { shape: 'teleport', range: 30, time: 'B' },
  fireball: { shape: 'sphere', range: 150, r: 20, time: 'A' },
  lightningbolt: { shape: 'line', len: 100, time: 'A' },
  icestorm: { shape: 'sphere', range: 300, r: 20, time: 'A' },
  greaterinvisibility: { shape: 'touch', side: 'ally', time: 'A', conc: true },
  stoneskin: { shape: 'touch', side: 'ally', time: 'A', conc: true },
  coneofcold: { shape: 'cone', len: 60, time: 'A' },
  holdmonster: { shape: 'single', side: 'foe', range: 90, time: 'A', conc: true },
  bless: { shape: 'allies', range: 30, n: 3, time: 'A', conc: true },
  curewounds: { shape: 'touch', side: 'ally', time: 'A' },
  shieldoffaith: { shape: 'single', side: 'ally', range: 60, time: 'B', conc: true },
  divinefavor: { shape: 'self', time: 'B', conc: true },
  heroism: { shape: 'touch', side: 'ally', time: 'A', conc: true },
  lesserrestoration: { shape: 'touch', side: 'ally', time: 'A' },
  aid: { shape: 'allies', range: 30, n: 3, time: 'A' },
  revivify: { shape: 'none', why: 'no one here has died (the fallen are only down)' },
  daylight: { shape: 'none', why: 'not sunlight: the drow would not flinch' }
};
// Misty Step is not in the 8-bit game's list (the POC spec asked for it): its record lives here
window.D16.EXTRA_SPELLS = {
  mistystep: { name: 'Misty Step', level: 2, kind: 'teleport', target: 'self', battle: true, desc: 'A bonus action: silver mist, and you are 30 ft away.', src: 'SRD 5.1' }
};
