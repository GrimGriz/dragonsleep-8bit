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
  // Light (SRD 5.1; torchdark 09-28): on an object he holds, or an ally's beside him: bright 20 ft and dim 20 more, going where they go (js/light.js)
  light: { shape: 'touch', side: 'ally', time: 'A' },
  // the spells that waited on the dark (spells-srd-by-class.md, DARK; torchdark 09-28)
  dancinglights: { shape: 'sphere', range: 120, r: 10, time: 'A', conc: true },   // four dim lights at a point; a bonus action (casting again) moves them
  fogcloud: { shape: 'sphere', range: 120, r: 20, time: 'A', conc: true },        // heavily obscured: nothing sees in, out or across
  continualflame: { shape: 'touch', side: 'ally', time: 'A' },                    // a torch-bright heatless flame on their gear, for good
  darkvision: { shape: 'touch', side: 'ally', time: 'A' },                        // 60 ft in the dark
  invisibility: { shape: 'touch', side: 'ally', time: 'A', conc: true },          // till they attack or cast
  seeinvisibility: { shape: 'self', time: 'A' },
  stinkingcloud: { shape: 'sphere', range: 90, r: 20, time: 'A', conc: true },    // fog, and CON or the action goes each turn inside
  sleetstorm: { shape: 'sphere', range: 150, r: 40, time: 'A', conc: true },      // fog, ice (difficult; DEX or prone), flames out
  mislead: { shape: 'self', time: 'A', conc: true },                              // invisible, and a false double
  passwithouttrace: { shape: 'self', time: 'A', conc: true },                     // +10 Stealth for all of yours within 30 ft
  trueseeing: { shape: 'touch', side: 'ally', time: 'A' },                        // truesight 120 ft
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
  daylight: { shape: 'sphere', range: 60, r: 60, time: 'A' },
  // the class NPCs' spells (09-28, batch a; js/grimoire.js)
  chilltouch: { shape: 'attack', range: 120, time: 'A' },
  poisonspray: { shape: 'single', side: 'foe', range: 10, time: 'A' },
  produceflame: { shape: 'attack', range: 30, time: 'A' },
  rayoffrost: { shape: 'attack', range: 60, time: 'A' },
  resistance: { shape: 'touch', side: 'ally', time: 'A', conc: true },
  sacredflame: { shape: 'single', side: 'foe', range: 60, time: 'A' },
  shillelagh: { shape: 'self', time: 'B' },
  shockinggrasp: { shape: 'attack', range: 5, time: 'A' },
  truestrike: { shape: 'single', side: 'foe', range: 30, time: 'A', conc: true },
  viciousmockery: { shape: 'single', side: 'foe', range: 60, time: 'A' },
  eldritchblast: { shape: 'rays', range: 120, n: 1, time: 'A' },
  guidance: { shape: 'touch', side: 'ally', time: 'A', conc: true },
  bane: { shape: 'allies', side: 'foe', range: 30, n: 3, time: 'A', conc: true },
  colorspray: { shape: 'cone', len: 15, time: 'A' },
  command: { shape: 'single', side: 'foe', range: 60, time: 'A' },
  entangle: { shape: 'cube', range: 90, size: 20, time: 'A', conc: true },
  expeditiousretreat: { shape: 'self', time: 'B', conc: true },
  falselife: { shape: 'self', time: 'A' },
  grease: { shape: 'cube', range: 60, size: 10, time: 'A' },
  guidingbolt: { shape: 'attack', range: 120, time: 'A' },
  healingword: { shape: 'single', side: 'ally', range: 60, time: 'B' },
  hellishrebuke: { shape: 'reaction', why: 'a reaction: when a foe you can see within 60 ft hurts you' },
  hideouslaughter: { shape: 'single', side: 'foe', range: 30, time: 'A', conc: true },
  huntersmark: { shape: 'single', side: 'foe', range: 90, time: 'B', conc: true },
  mirrorsgaze: { shape: 'single', side: 'foe', range: 90, time: 'B', conc: true },
  inflictwounds: { shape: 'attack', range: 5, time: 'A' },
  longstrider: { shape: 'touch', side: 'ally', time: 'A' },
  sanctuary: { shape: 'single', side: 'ally', range: 30, time: 'B', self: true },
  faeriefire: { shape: 'cube', range: 60, size: 20, time: 'A', conc: true },
  glasswhisper: { shape: 'single', side: 'foe', range: 60, time: 'A' },
  protectionfromevilandgood: { shape: 'touch', side: 'ally', time: 'A', conc: true },
  darkness: { shape: 'sphere', range: 60, r: 15, time: 'A', conc: true },
  // the resting spells (RULED 09-28): the 8-bit game's field, a rest -- never a fight's
  ropetrick: { shape: 'none', why: 'a field spell: a short rest, not a fight' },
  tinyhut: { shape: 'none', why: 'a field spell: a long rest, not a fight' },
  // the class NPCs' spells (09-28, batch bc; js/grimoire.js)
  acidarrow: { shape: 'attack', range: 90, time: 'A' },
  barkskin: { shape: 'touch', side: 'ally', time: 'A', conc: true },
  blindnessdeafness: { shape: 'single', side: 'foe', range: 30, time: 'A' },
  blur: { shape: 'self', time: 'A', conc: true },
  brandingsmite: { shape: 'self', time: 'B', conc: true },
  enhanceability: { shape: 'touch', side: 'ally', time: 'A', conc: true },
  enlargereduce: { shape: 'single', range: 30, time: 'A', conc: true },
  flameblade: { shape: 'self', time: 'B', conc: true },
  gustofwind: { shape: 'line', len: 60, time: 'A' },
  heatmetal: { shape: 'single', side: 'foe', range: 60, time: 'A', conc: true },
  magicweapon: { shape: 'touch', side: 'ally', time: 'B', conc: true },
  mirrorimage: { shape: 'self', time: 'A' },
  protectionfrompoison: { shape: 'touch', side: 'ally', time: 'A' },
  rayofenfeeblement: { shape: 'attack', range: 60, time: 'A', conc: true },
  spikegrowth: { shape: 'sphere', range: 150, r: 20, time: 'A', conc: true },
  spiritualweapon: { shape: 'single', side: 'foe', range: 60, time: 'B' },
  wardingbond: { shape: 'touch', side: 'ally', time: 'A' },
  beaconofhope: { shape: 'self', time: 'A', conc: true },
  bestowcurse: { shape: 'single', side: 'foe', range: 5, time: 'A', conc: true },
  blink: { shape: 'self', time: 'A' },
  calllightning: { shape: 'sphere', range: 120, r: 5, time: 'A', conc: true },
  dispelmagic: { shape: 'single', range: 120, time: 'A' },
  fear: { shape: 'cone', len: 30, time: 'A', conc: true },
  haste: { shape: 'single', side: 'ally', range: 30, time: 'A', conc: true, self: true },
  hypnoticpattern: { shape: 'cube', range: 120, size: 30, time: 'A', conc: true },
  masshealingword: { shape: 'allies', range: 60, n: 6, time: 'B' },
  protectionfromenergy: { shape: 'touch', side: 'ally', time: 'A', conc: true },
  slow: { shape: 'cube', range: 120, size: 40, time: 'A', conc: true },
  spiritguardians: { shape: 'self', time: 'A', conc: true },
  vampirictouch: { shape: 'attack', range: 5, time: 'A', conc: true },
  // the class NPCs' spells (09-28, batch d; js/grimoire.js)
  banishment: { shape: 'single', range: 60, time: 'A', conc: true },
  blacktentacles: { shape: 'cube', range: 90, size: 20, time: 'A', conc: true },
  blight: { shape: 'single', side: 'foe', range: 30, time: 'A' },
  confusion: { shape: 'sphere', range: 90, r: 10, time: 'A', conc: true },
  deathward: { shape: 'touch', side: 'ally', time: 'A' },
  dimensiondoor: { shape: 'teleport', range: 500, time: 'A' },
  fireshield: { shape: 'self', time: 'A' },
  freedomofmovement: { shape: 'touch', side: 'ally', time: 'A' },
  guardianoffaith: { shape: 'sphere', range: 30, r: 5, time: 'A' },
  phantasmalkiller: { shape: 'single', side: 'foe', range: 120, time: 'A', conc: true },
  resilientsphere: { shape: 'single', range: 30, time: 'A', conc: true },
  contagion: { shape: 'attack', range: 5, time: 'A' },
  dispelevilandgood: { shape: 'self', time: 'A', conc: true },
  flamestrike: { shape: 'sphere', range: 60, r: 10, time: 'A' },
  greaterrestoration: { shape: 'touch', side: 'ally', time: 'A' },
  insectplague: { shape: 'sphere', range: 300, r: 20, time: 'A', conc: true },
  masscurewounds: { shape: 'allies', range: 60, n: 6, time: 'A' },
  // the class NPCs' spells (09-28, batch e; js/grimoire.js)
  chainlightning: { shape: 'single', side: 'foe', range: 150, time: 'A' },
  circleofdeath: { shape: 'sphere', range: 150, r: 60, time: 'A' },
  disintegrate: { shape: 'single', side: 'foe', range: 60, time: 'A' },
  eyebite: { shape: 'single', side: 'foe', range: 60, time: 'A', conc: true },
  fleshtostone: { shape: 'single', side: 'foe', range: 60, time: 'A', conc: true },
  freezingsphere: { shape: 'sphere', range: 300, r: 60, time: 'A' },
  globeofinvulnerability: { shape: 'self', time: 'A', conc: true },
  harm: { shape: 'single', side: 'foe', range: 60, time: 'A' },
  heal: { shape: 'single', side: 'ally', range: 60, time: 'A', self: true },
  irresistibledance: { shape: 'single', side: 'foe', range: 30, time: 'A', conc: true },
  sunbeam: { shape: 'line', len: 60, time: 'A', conc: true },
  arcanesword: { shape: 'single', side: 'foe', range: 60, time: 'A', conc: true },
  delayedblastfireball: { shape: 'sphere', range: 150, r: 20, time: 'A', conc: true },
  divineword: { shape: 'self', time: 'B' },
  etherealness: { shape: 'self', time: 'A' },
  fingerofdeath: { shape: 'single', side: 'foe', range: 60, time: 'A' },
  firestorm: { shape: 'sphere', range: 150, r: 20, time: 'A' },
  prismaticspray: { shape: 'cone', len: 60, time: 'A' },
  regenerate: { shape: 'touch', side: 'ally', time: 'A' },
  symbol: { shape: 'sphere', range: 5, r: 0, time: 'A' },
  earthquake: { shape: 'sphere', range: 500, r: 100, time: 'A', conc: true },
  feeblemind: { shape: 'single', side: 'foe', range: 150, time: 'A' },
  holyaura: { shape: 'self', time: 'A', conc: true },
  maze: { shape: 'single', side: 'foe', range: 60, time: 'A', conc: true },
  mindblank: { shape: 'touch', side: 'ally', time: 'A' },
  powerwordstun: { shape: 'single', side: 'foe', range: 60, time: 'A' },
  sunburst: { shape: 'sphere', range: 150, r: 60, time: 'A' },
  foresight: { shape: 'touch', side: 'ally', time: 'A' },
  massheal: { shape: 'self', time: 'A' },
  meteorswarm: { shape: 'sphere', range: 5280, r: 40, time: 'A' },
  powerwordkill: { shape: 'single', side: 'foe', range: 60, time: 'A' },
  // the class NPCs' spells (09-28, batch w; js/grimoire.js)
  weird: { shape: 'sphere', range: 120, r: 30, time: 'A', conc: true }
};
// spells the 8-bit game's list lacks would live here; Misty Step moved into content/spells.json on 09-27 (a learnable, grid-only spell)
window.D16.EXTRA_SPELLS = {};
