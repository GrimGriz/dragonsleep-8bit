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
  // Thunderwave (SRD 5.1): a 15-ft cube out from the caster, CON half, and a failed save is pushed 10 ft away (wave)
  thunderwave: { shape: 'wave', size: 15, time: 'A' },
  // Hold Person (SRD 5.1): a humanoid within 60 ft, WIS or paralyzed, a save again at the end of each of its turns
  holdperson: { shape: 'single', side: 'foe', range: 60, time: 'A', conc: true, only: 'humanoid' },
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
  // Daylight (SRD 5.1): a 60-ft sphere of bright light (not sunlight: the drow do not flinch); where it overlaps a Darkness of
  // 3rd level or lower, that Darkness is dispelled (09-27, Griz: "Did we get the light spell cancelling darkness?" -- the Light
  // cantrip cannot: Darkness dispels it, not the other way)
  daylight: { shape: 'sphere', range: 60, r: 60, time: 'A' }
};
// spells the 8-bit game's list lacks would live here; Misty Step moved into content/spells.json on 09-27 (a learnable, grid-only spell)
window.D16.EXTRA_SPELLS = {};
