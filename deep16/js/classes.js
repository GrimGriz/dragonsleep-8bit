/* DEEP16 — the class NPCs (handoff-2026-09-28-npc-classes-to-six.md; Griz 09-28: "build NPC of each class out to level 6 and
   combat test them"). A sheet for any of the twelve SRD 5.1 classes at levels 1-9 (the druid to 12: NPC.MAXLVL), built by the SRD's own tables and by
   the 8-bit game's rules (js/rules.js R.CLASSES, R.ac, R.attackBonus, R.spellDC ...), then made a grid unit the way the
   heroes are (js/save.js SV.unitOf). The spells are the grid's (data/spells.js + content/spells.json); a spell not built yet
   is simply not on the list (magic.js M.list).
   RULED 09-28: "Higertha is half-orc Druid, see if other existing NPCs need classes built and human the rest of the classes";
   names "except when matching existing NPCs, generic is good" -- 'Cleric 5'. HP the SRD's fixed average (the max hit die a
   level is for the story-vital, by name: NAMED `maxhp`). Ability scores: the standard array by the class's priorities. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, R = DS.R;
  var NPC = D.npc = {};
  var ARRAY = [15, 14, 13, 12, 10, 8];

  // the SRD 5.1 races the generator knows (human by default); their numbers and the traits the grid reads
  NPC.RACES = {
    human: { name: 'Human', abil: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 } },
    halforc: { name: 'Half-orc', abil: { str: 2, con: 1 }, dv: 60, relentless: true, savage: true },
    dwarf: { name: 'Dwarf', abil: { con: 2, wis: 1 }, dv: 60, speed: 25, resist: ['poison'], hpLevel: 1 }, // (the hill dwarf)
    elf: { name: 'Elf', abil: { dex: 2, int: 1 }, dv: 60, fey: true },                                   // (the high elf: Fey Ancestry, no magic sleep)
    halfling: { name: 'Halfling', abil: { dex: 2, cha: 1 }, speed: 25 },
    halfelf: { name: 'Half-elf', abil: { cha: 2, con: 1, dex: 1 }, dv: 60, fey: true },
    gnome: { name: 'Gnome', abil: { int: 2, con: 1 }, dv: 60, speed: 25 },
    tiefling: { name: 'Tiefling', abil: { cha: 2, int: 1 }, dv: 60, resist: ['fire'] },
    dragonborn: { name: 'Dragonborn', abil: { str: 2, cha: 1 } }
  };

  // ------------------------------------------------------------------ the twelve, levels 1-6 (the SRD's tables; spells by level of the NPC).
  // prio: where the standard array goes. kit: the SRD starting kit's weapon, armour, shield, and a second weapon (alt: the ranged
  // one, or the melee one for a bow). sub: the SRD's one subclass and the level it comes. cantrips / known by class level (1-9; the druid's to 12).
  // spells: what the NPC knows or prepares at each level it reaches (the test vehicle's list: chosen to put every built spell
  // of its class through a fight); `always`: the domain's or the oath's, prepared and uncounted
  var C = NPC.CLASSES = {
    barbarian: { prio: ['str', 'con', 'dex', 'wis', 'cha', 'int'], kit: { weapon: 'greataxe', alt: 'handaxe' }, sub: [3, 'Path of the Berserker'], look: 'npcbarbarian_p0' },
    bard: { prio: ['cha', 'dex', 'con', 'wis', 'int', 'str'], kit: { weapon: 'rapier', armor: 'leather', alt: 'dagger' }, sub: [3, 'College of Lore'], look: 'npcbard_p0',
      cantrips: [2, 2, 2, 3, 3, 3, 3, 3, 3], known: [4, 5, 6, 7, 8, 9, 10, 11, 12],
      spells: { 0: ['viciousmockery', 'dancinglights', 'light'], 1: ['healingword', 'hideouslaughter', 'faeriefire', 'thunderwave', 'bane', 'curewounds', 'charmperson', 'animalfriendship'], 2: ['heatmetal', 'shatter', 'blindnessdeafness', 'enhanceability'], 3: ['hypnoticpattern', 'fear', 'slow'], 4: ['confusion', 'dimensiondoor', 'freedomofmovement', 'greaterinvisibility', 'polymorph'], 5: ['masscurewounds', 'greaterrestoration', 'holdmonster'], magicalSecrets: ['fireball', 'haste'] } },
    cleric: { prio: ['wis', 'con', 'str', 'cha', 'dex', 'int'], kit: { weapon: 'mace', armor: 'chainmail', shield: 'shield', alt: 'lightcrossbow' }, sub: [1, 'Life Domain'], look: 'npccleric_p0',
      cantrips: [3, 3, 3, 4, 4, 4, 4, 4, 4], prepares: 'wis',
      always: { 1: ['bless', 'curewounds'], 3: ['lesserrestoration', 'spiritualweapon'], 5: ['beaconofhope', 'revivify'], 7: ['deathward', 'guardianoffaith'], 9: ['masscurewounds'] },
      spells: { 0: ['sacredflame', 'guidance', 'light', 'resistance'], 1: ['guidingbolt', 'healingword', 'shieldoffaith', 'sanctuary', 'command', 'bane', 'inflictwounds'], 2: ['holdperson', 'aid', 'blindnessdeafness', 'wardingbond'], 3: ['spiritguardians', 'masshealingword', 'dispelmagic', 'bestowcurse', 'daylight'], 4: ['guardianoffaith', 'banishment', 'freedomofmovement', 'deathward'], 5: ['flamestrike', 'masscurewounds', 'insectplague', 'greaterrestoration', 'dispelevilandgood', 'contagion'] } },
    druid: { prio: ['wis', 'con', 'dex', 'int', 'cha', 'str'], kit: { weapon: 'quarterstaff', armor: 'leather', shield: 'shield' }, sub: [2, 'Circle of the Land'], look: 'npcdruid_p0', // (a quarterstaff, 10-01c: it is what Shillelagh needs in hand -- SRD 5.1, a club or quarterstaff; the SRD's kit lets a druid take "any simple melee weapon" for the scimitar, with the wooden shield -- and the item table counts the druid proficient in it where it did not in the scimitar or the club)
      cantrips: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4], prepares: 'wis', landCantrip: 'poisonspray', asiAt: [4, 8, 12], // (to twelve, 09-30: the 4th cantrip at 10, the ASI at 12)
      // the Circle of the Land's circle spells (SRD 5.1), always prepared, by druid level -- the built ones only (spider climb, meld into
      // stone, stone shape, passwall and gaseous form are OUT; wall of stone and cloudkill LATER): Higertha's mountain (invented.json
      // #higertha-druid), the generic druid's Underdark (the Pit's; the seat's call, 09-29)
      lands: { mountain: { 3: ['spikegrowth'], 5: ['lightningbolt'], 7: ['stoneskin'], 9: ['wallofstone'] }, underdark: { 3: ['web'], 5: ['stinkingcloud'], 7: ['greaterinvisibility'], 9: ['insectplague', 'cloudkill'] } },
      spells: { 0: ['produceflame', 'shillelagh', 'guidance', 'resistance'], 1: ['entangle', 'faeriefire', 'healingword', 'curewounds', 'fogcloud', 'thunderwave', 'animalfriendship', 'charmperson'], 2: ['barkskin', 'moonbeam', 'flamingsphere', 'flameblade', 'heatmetal', 'spikegrowth', 'gustofwind', 'enhanceability'], 3: ['conjureanimals', 'windwall', 'calllightning', 'dispelmagic', 'protectionfromenergy', 'sleetstorm', 'daylight', 'plantgrowth'], 4: ['walloffire', 'blight', 'confusion', 'icestorm', 'freedomofmovement', 'conjurewoodlandbeings', 'polymorph', 'dominatebeast', 'giantinsect'], 5: ['wallofstone', 'insectplague', 'masscurewounds', 'greaterrestoration', 'contagion', 'antilifeshell', 'conjureelemental'], 6: ['wallofthorns', 'heal', 'sunbeam'] } },
    fighter: { prio: ['str', 'con', 'dex', 'wis', 'cha', 'int'], kit: { weapon: 'greatsword', armor: 'chainmail', alt: 'handaxe' }, style: 'gwf', sub: [3, 'Champion'], look: 'npcfighter_p0', asiAt: [4, 6, 8] },
    monk: { prio: ['dex', 'wis', 'con', 'str', 'int', 'cha'], kit: { weapon: 'shortsword', alt: 'dagger' }, sub: [3, 'Way of the Open Hand'], look: 'npcmonk_p0' },
    paladin: { prio: ['str', 'cha', 'con', 'wis', 'dex', 'int'], kit: { weapon: 'longsword', armor: 'chainmail', shield: 'shield', alt: 'handaxe' }, style: 'defense', sub: [3, 'Oath of Devotion'], look: 'npcpaladin_p0', prepares: 'cha', half: true,
      always: { 3: ['protectionfromevilandgood', 'sanctuary'], 5: ['lesserrestoration'], 9: ['beaconofhope', 'dispelmagic'] }, // (the 9th's pair, SRD 5.1 -- the grid's rules §2d, 10-08; the 8-bit holds both as grid-only spells, js/rules.js R.oathSpells)
      spells: { 1: ['bless', 'command', 'shieldoffaith', 'divinefavor', 'heroism', 'curewounds'], 2: ['brandingsmite', 'magicweapon', 'aid'] } },
    ranger: { prio: ['dex', 'wis', 'con', 'str', 'int', 'cha'], kit: { weapon: 'longbow', armor: 'scalemail', alt: 'shortsword' }, style: 'archery', sub: [3, 'Hunter'], look: 'npcranger_p0',
      known: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7], spells: { 1: ['huntersmark', 'curewounds', 'fogcloud', 'longstrider', 'animalfriendship'], 2: ['spikegrowth', 'passwithouttrace', 'barkskin'], 3: ['conjureanimals'] } },
    rogue: { prio: ['dex', 'con', 'wis', 'int', 'cha', 'str'], kit: { weapon: 'rapier', armor: 'leather', alt: 'shortbow' }, sub: [3, 'Thief'], look: 'npcrogue_p0', expertise: ['Stealth', 'Perception'] },
    // metamagic (SRD 5.1, 3rd: two options; a third at 10, a fourth at 17): the generic sorcerer knows Quickened and Twinned; Careful and
    // Heightened are built (js/features.js) for a spec that lists them -- { cls: 'sorcerer', metamagic: ['careful', 'heightened'] }
    sorcerer: { prio: ['cha', 'con', 'dex', 'wis', 'int', 'str'], kit: { weapon: 'lightcrossbow', alt: 'dagger' }, sub: [1, 'Draconic Bloodline'], look: 'npcsorcerer_p0', ancestry: 'fire', metamagic: ['quickened', 'twinned'],
      cantrips: [4, 4, 4, 5, 5, 5, 5, 5, 5], known: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      spells: { 0: ['firebolt', 'rayofrost', 'shockinggrasp', 'poisonspray', 'chilltouch'], 1: ['magicmissile', 'shield', 'burninghands', 'colorspray'], 2: ['scorchingray', 'mistystep', 'mirrorimage'], 3: ['fireball', 'haste', 'counterspell', 'fly'], 4: ['icestorm', 'greaterinvisibility', 'dimensiondoor', 'blight', 'banishment', 'walloffire', 'polymorph', 'dominatebeast'], 5: ['coneofcold', 'insectplague', 'holdmonster', 'wallofstone', 'cloudkill'] } },
    // Pact Boon (SRD 5.1, 3rd): the generic warlock (NPC.spec) takes the Tome -- three cantrips from other classes' lists (`tome`, the seat's
    // pick 09-30: Fire Bolt, Sacred Flame, Vicious Mockery); a spec may say pact: 'blade' (a pact weapon: a rapier, proficient, magical) or
    // its own tome. The Chain (a familiar in imp, pseudodragon, quasit or sprite form) waits on sheets for those four: not built
    warlock: { prio: ['cha', 'con', 'dex', 'wis', 'int', 'str'], kit: { weapon: 'lightcrossbow', armor: 'leather', alt: 'dagger' }, sub: [1, 'The Fiend'], look: 'npcwarlock_p0', pact: 'tome', tome: ['firebolt', 'sacredflame', 'viciousmockery'],
      cantrips: [2, 2, 2, 3, 3, 3, 3, 3, 3], known: [2, 3, 4, 5, 6, 7, 8, 9, 10], invocations: { 2: ['agonizing', 'devilsight'], 5: ['agonizing', 'devilsight', 'repelling'] },
      spells: { 0: ['eldritchblast', 'chilltouch', 'poisonspray'], 1: ['hellishrebuke', 'expeditiousretreat', 'command', 'burninghands'], /* (Expeditious Retreat second: fourth, the generic warlock never knew it at 1-9 -- the rules runner's find; RULED 10-01c, Griz: "yes") */ 2: ['scorchingray', 'darkness', 'mirrorimage', 'holdperson'], 3: ['fireball', 'fear', 'vampirictouch', 'counterspell', 'fly'], 4: ['blight', 'fireshield', 'dimensiondoor', 'banishment'], 5: ['flamestrike', 'holdmonster'] } },
    wizard: { prio: ['int', 'con', 'dex', 'wis', 'cha', 'str'], kit: { weapon: 'quarterstaff', armor: 'robes' }, sub: [2, 'School of Evocation'], look: 'npcwizard_p0',
      cantrips: [3, 3, 3, 4, 4, 4, 4, 4, 4], prepares: 'int',
      spells: { 0: ['firebolt', 'rayofrost', 'shockinggrasp', 'chilltouch', 'light'], 1: ['magicmissile', 'shield', 'mageArmor', 'burninghands', 'sleep', 'colorspray', 'grease', 'hideouslaughter', 'falselife', 'charmperson'], 2: ['scorchingray', 'mistystep', 'holdperson', 'web', 'shatter', 'mirrorimage', 'flamingsphere', 'acidarrow', 'blur'], 3: ['fireball', 'lightningbolt', 'haste', 'slow', 'hypnoticpattern', 'fear', 'vampirictouch', 'counterspell', 'fly'], 4: ['icestorm', 'blacktentacles', 'phantasmalkiller', 'greaterinvisibility', 'dimensiondoor', 'fireshield', 'banishment', 'confusion', 'resilientsphere', 'stoneskin', 'blight', 'walloffire', 'polymorph'], 5: ['coneofcold', 'holdmonster', 'mislead', 'wallofstone', 'cloudkill', 'conjureelemental'] } }
  };
  // the Mirror's warlocks (RULED 09-28): the pact of the Mirror's expanded list and its eye (invented.json #pact-of-the-mirror). Its 1st
  // TRIMMED to two, the SRD's patrons' count (RULED 09-28g, Griz: "Trim"): the two his words named, Glass Whisper and Command (the
  // asking); the seat's Silent Image and Hideous Laughter are off it
  NPC.MIRROR = { 1: ['glasswhisper', 'command'], 3: ['mirrorimage', 'detectthoughts'], 5: ['hypnoticpattern', 'clairvoyance'] };
  // our own subclasses (RULED 09-28g, Griz, on the ones past the SRD: "Sufficiently distinct"; the past-the-SRD principle, invented.json
  // #past-the-srd): the domains' spells, always prepared (a spell not built yet is simply not cast: magic.js M.list); the features are
  // js/features.js. The Window: Tronupholen's menders (Kat's, "Cleric of trickster deity trapped in mirror"); the Vigil: Dvalgarda's,
  // the Ward of the Dormant (Torvald's; the register names no domain). The Rimeglass (Willem's) and the Path of the Sand (Talmok's) have
  // no spells of their own
  // (7th and 9th, 09-28h, Griz: "can we do the levels for the original classes up to nine" -- the seat's drafts, standing as approved:
  // the Window's Greater Invisibility and Confusion, Mislead and Hold Monster; the Vigil's Guardian of Faith and Freedom of Movement,
  // Hold Monster and Dispel Evil and Good. All eight are built on the grid)
  NPC.SUBS = {
    'the Window': { always: { 1: ['disguiseself', 'silentimage'], 3: ['blur', 'passwithouttrace'], 5: ['hypnoticpattern', 'clairvoyance'], 7: ['greaterinvisibility', 'confusion'], 9: ['mislead', 'holdmonster'] }, uses: 'handOnNeck' },
    'the Vigil': { always: { 1: ['sanctuary', 'protectionfromevilandgood'], 3: ['holdperson', 'wardingbond'], 5: ['spiritguardians', 'glyphofwarding'], 7: ['guardianoffaith', 'freedomofmovement'], 9: ['holdmonster', 'dispelevilandgood'] }, uses: 'keepersWard' },
    // the Keeping (10-16, Griz on the Gray Keeping's matriarchs: "Give the superhero entangle? There's good cleric stuff high level that didn't exist in
    // chainmail I think"; "all 8 leans are go"): Rhollor's, through the relics (TarlynsPit/wiki/gnoll-hills.md -- the god under the ground, his dead call
    // "through the female voices"). Entangle is his; the rest the seat's drafts, invented.json #the-keeping: the laugh that is the call, the hold, the
    // pack's terror, the curse, the rot, the confusion, and at 9 Book I's own Insect Plague
    'the Keeping': { always: { 1: ['entangle', 'hideouslaughter'], 3: ['holdperson', 'blindnessdeafness'], 5: ['fear', 'bestowcurse'], 7: ['blight', 'confusion'], 9: ['insectplague', 'holdmonster'] } }
  };
  // our four (09-28h, Griz: "the off SRD ones we made to 9"; "AI now, buttons later"): the tester ladder's party (js/ladder.js
  // ?ladder&party=ours), each built at the rung's level. One who is across the floor on that rung (the Wagon Yard's Willem, the
  // Card's Top's Talmok) sits it out: three of ours, not a man against himself (the seat's call; flagged)
  // the class options a made one chooses with its level (10-14, the level-up pick: "Pocket has leveling choices"), the built ones only: the spec's own fields
  // (NPC.sheet reads them), `at` the class level they come, `count` how many at a level (none: one of them). The Pocket DM's maker shows each as a tab beside
  // STYLE; its word keeps the choice (NPC.code's 10th field). The rogue's Expertise waits: the class floor keeps no skills to double
  NPC.OPTIONS = {
    sorcerer: [{ key: 'metamagic', word: 'METAMAGIC', at: 3, count: function (L) { return L >= 17 ? 4 : L >= 10 ? 3 : 2; }, opts: [
      { id: 'quickened', name: 'Quickened Spell', desc: '2 points: a spell of an action cast as a bonus action' },
      { id: 'twinned', name: 'Twinned Spell', desc: 'a point a spell level: a one-target spell takes a second' },
      { id: 'careful', name: 'Careful Spell', desc: '1 point: friends in its area make the save' },
      { id: 'heightened', name: 'Heightened Spell', desc: '3 points: one target saves at disadvantage' }] }],
    warlock: [{ key: 'invocations', word: 'INVOCATIONS', at: 2, count: function (L) { return L >= 12 ? 6 : L >= 9 ? 5 : L >= 7 ? 4 : L >= 5 ? 3 : 2; }, opts: [
      { id: 'agonizing', name: 'Agonizing Blast', desc: 'CHA added to each Eldritch Blast beam' },
      { id: 'devilsight', name: 'Devil\'s Sight', desc: 'sees in any dark, the magical too, to 120 ft' },
      { id: 'repelling', name: 'Repelling Blast', desc: 'an Eldritch Blast beam that hits pushes 10 ft' },
      { id: 'fiendishvigor', name: 'Fiendish Vigor', desc: 'False Life at will: 1d4+4 temporary HP to start a fight' }] },
      { key: 'pact', word: 'PACT', at: 3, opts: [
        { id: 'tome', name: 'Pact of the Tome', desc: 'three cantrips: Fire Bolt, Sacred Flame, Vicious Mockery' },
        { id: 'blade', name: 'Pact of the Blade', desc: 'a pact weapon in hand: a rapier, proficient, magical' }] }],
    druid: [{ key: 'land', word: 'LAND', at: 2, opts: [
      { id: 'underdark', name: 'the Underdark', desc: 'Web, Stinking Cloud, Greater Invisibility, Insect Plague' },
      { id: 'mountain', name: 'the Mountain', desc: 'Spike Growth, Lightning Bolt, Stoneskin, Wall of Stone' }] }]
  };
  // the options as a word's field ('m:twinned-careful_p:blade'), and back to the spec's fields (the built ones only, each at its level)
  NPC.optWord = function (cls, sp) {
    var c = C[cls] || {};
    return (NPC.OPTIONS[cls] || []).map(function (o) {
      var v = sp[o.key]; if (v == null || (o.key === 'pact' && v === c.pact)) return '';
      return o.key.charAt(0) + ':' + (o.count ? v.join('-') : v);
    }).filter(Boolean).join('_');
  };
  NPC.optRead = function (cls, s, lvl, sp) {
    (s || '').split('_').forEach(function (t) {
      var o = (NPC.OPTIONS[cls] || []).filter(function (x) { return x.key.charAt(0) === t.charAt(0) && t.charAt(1) === ':'; })[0]; if (!o || lvl < o.at) return;
      var ids = o.opts.map(function (x) { return x.id; }), vs = t.slice(2).split('-').filter(function (x) { return ids.indexOf(x) >= 0; });
      if (o.count) { if (vs.length) sp[o.key] = vs.slice(0, o.count(lvl)); } else if (vs.length === 1) sp[o.key] = vs[0];
    });
  };
  NPC.OURS = ['talmok', 'willem', 'katarina', 'torvald'];
  // the tester ladder's four at L, each the grown build (09-28h, Griz: "grown builds please": no dip at a register's own level). One of
  // ours who is that rung's foe (Willem in the Wagon Yard, Talmok on the Card's Top) is swapped for an alternate (Griz: "swap in
  // alternates (your choice) rather than mirror"): Higertha, the Hex's druid, who stands at any level; then a paladin
  NPC.ALTS = ['higertha', 'paladin'];
  NPC.ours = function (L, F) {
    var there = F ? (F.foes || (D.MAPS[F.map] || {}).foes || []).map(function (f) { return f.kind; }) : [], alts = NPC.ALTS.filter(function (k) { return there.indexOf(k) < 0; });
    return NPC.OURS.map(function (k) { return there.indexOf(k) < 0 ? k + ':' + L + ':grown' : (alts.shift() || 'fighter') + ':' + L; });
  };
  function subAlways(sub, lvl) { var a = [], s = NPC.SUBS[sub]; Object.keys((s && s.always) || {}).forEach(function (k) { if (lvl >= +k) a = a.concat(s.always[k]); }); return a; }

  // ------------------------------------------------------------------ the existing NPCs the generator builds by name (the survey, 09-28).
  // Each is its register's class, level, race and list; `maxhp` for the story-vital (the players' max hit die, RULED 09-28)
  NPC.NAMED = {
    // Higertha, the druid at Mama's Pharmakaiea in the Hex (RULED 09-28: "Higertha is half-orc Druid"); the register sets no level,
    // so she stands at any. Her circle's land is the seat's draft (invented.json #higertha-druid): the mountain, the Pit's
    higertha: { name: 'Higertha', cls: 'druid', race: 'halforc', named: true, land: 'mountain' }, // (her look is the druid's own, npcdruid_p0: the half-orc in the forest robe)
    // Torvald Greyseam, cleric 5 of Dvalgarda (the-copper-egg.md, CANON 09-16f): the SRD Priest's list (RULED 09-28: the SRD stat
    // blocks' lists where the register has none) and the 8-bit's Hold Person; the register gives no domain, so none (flagged); his
    // numbers the 8-bit sheet's (content/monsters.json torvald: AC 13, a max d8+2 a level). His spirits are the Dormant's, cold
    // His domain the Vigil, Dvalgarda's (09-28g, the seat's on Griz's "Sufficiently distinct"; invented.json #the-vigil)
    torvald: { name: 'Torvald', named: true, cls: 'cleric', lvl: 5, race: 'dwarf', subclass: 'the Vigil', // (the name for the Pocket DM; his fight's card keeps 'Dwarf Cleric')
      abil: { str: 14, dex: 10, con: 14, int: 11, wis: 16, cha: 13 },
      equip: { weapon: 'mace', armor: 'chainshirt' }, noPrecast: true, look: 'torvald_p0', // (his own figure off the story's card: the Pocket DM, the tester ladder)
      known: ['sacredflame', 'light', 'curewounds', 'guidingbolt', 'sanctuary', 'lesserrestoration', 'spiritualweapon', 'holdperson', 'dispelmagic', 'spiritguardians'],
      // past his register's 5th (09-28h, Griz: "can we do the levels for the original classes up to nine"; the seat's picks, standing as
      // approved): the ward-keeper's -- Death Ward, Banishment, Mass Cure Wounds, Greater Restoration, Protection from Energy
      grow: { 0: ['guidance', 'resistance'], 3: ['protectionfromenergy', 'masshealingword'], 4: ['deathward', 'banishment'], 5: ['masscurewounds', 'greaterrestoration'] },
      guardianText: 'calls on the Dormant, and spirits wheel out from him, cold as a vault' },
    // Amara, warlock 5 of the Mirror (npcs-by-location.md §The Road, RE-RULED 08-29): the register's list with the ear file's fold
    // (Mirror's Gaze for Hex, Minor Illusion for Friends; the asking is Command, RULED 09-28); Agonizing Blast; Fiendish Vigor (False
    // Life at will: she walks in with it); the Mirror's eye. Charm Person and Suggestion wait on charm (LATER). Her known spells are
    // the SRD's six at the 5th (TRIMMED 09-28g, Griz: "Trim"): Command in, Gaseous Form (OUT in the game already) off her list
    amara: { cls: 'warlock', lvl: 5, race: 'human', patron: 'mirror', abil: { str: 9, dex: 14, con: 12, int: 12, wis: 11, cha: 17 },
      equip: { weapon: 'dagger', armor: 'leather' },
      known: ['eldritchblast', 'minorillusion', 'mirrorsgaze', 'command', 'darkness', 'fear', 'charmperson', 'suggestion', 'counterspell'], // (Counterspell on the ladders: 10-02, Griz, "give it to all of them on the ladders")
      invocations: ['agonizing', 'fiendishvigor'], pact: 'tome' }, // (Pact of the Tome, SRD 5.1 -- RULED 10-17, Griz: "go on those opens, good with your leans": the scholar of the glass, the patrol ladies the Blade)
    // a Dominion patrol lady (10-17, the same ruling; the Snoot lane: "yeah, but the patrol ladies only eldritch blasted"): a warlock of the Mirror at Amara's
    // numbers with the Pact of the Blade -- a longsword called to hand, fighting beside her soldiers -- and a short list of her own, not Amara's
    patrolladyw: { cls: 'warlock', lvl: 5, race: 'human', patron: 'mirror', abil: { str: 9, dex: 14, con: 12, int: 12, wis: 11, cha: 17 },
      equip: { weapon: 'dagger', armor: 'leather' }, pact: 'blade', pactForm: 'longsword',
      known: ['eldritchblast', 'chilltouch', 'poisonspray', 'hellishrebuke', 'command', 'holdperson', 'scorchingray', 'vampirictouch', 'mirrorimage'],
      invocations: ['agonizing', 'devilsight'] },
    // Willem Glass, wizard 5 of illusion (npcs-by-location.md §The Road): Ray of Frost (RULED 09-28), Blur for Phantasmal Force (the ear
    // file, dist-4); the illusion school is the PHB's: his tradition is our own, the Rimeglass (09-28g, the seat's on Griz's "Sufficiently
    // distinct"; invented.json #the-rimeglass). The 8-bit sheet's AC 12: no Mage Armor up
    willem: { name: 'Willem', named: true, cls: 'wizard', lvl: 5, race: 'human', subclass: 'the Rimeglass', abil: { str: 9, dex: 14, con: 12, int: 17, wis: 12, cha: 11 },
      equip: { weapon: 'quarterstaff', armor: null }, noPrecast: true, look: 'willem_p1',
      known: ['rayoffrost', 'minorillusion', 'mageArmor', 'shield', 'mirrorimage', 'invisibility', 'blur', 'hypnoticpattern'],
      // past his register's 5th (09-28h; the seat's picks): illusion with the cold in it -- Sleet Storm, Phantasmal Killer, Greater
      // Invisibility, Ice Storm, Cone of Cold, Mislead, Hold Monster; below it, Color Spray, Magic Missile, Sleep; Chill Touch, Shocking Grasp
      grow: { 0: ['chilltouch', 'shockinggrasp'], 1: ['colorspray', 'magicmissile', 'sleep'], 2: ['holdperson'], 3: ['sleetstorm', 'fear', 'slow', 'counterspell'], 4: ['phantasmalkiller', 'greaterinvisibility', 'icestorm'], 5: ['coneofcold', 'mislead', 'holdmonster'] } },
    // Talmok, barbarian 3, Bloodsnout's champion at the Hex (the-hex.md, RULED 09-01): the register's block (npcs-by-location.md §TALMOK:
    // pit fists, rages on first blood, wrestles to the sand) and its Totem Warrior (Bear), the PHB's -- his path is our own, the Path of
    // the Sand (09-28g; invented.json #path-of-the-sand), and its 3rd-level features are what his block already did. The register gives
    // no race: human, the generator's. The ladder's card keeps his bestiary sheet (data/foes.js talmok); this is the Pocket DM's
    talmok: { name: 'Talmok', cls: 'barbarian', lvl: 3, race: 'human', subclass: 'Path of the Sand', named: true, look: 'talmok_p1',
      abil: { str: 16, dex: 14, con: 16, int: 9, wis: 13, cha: 11 }, equip: { weapon: 'unarmed', armor: null }, alt: null, hp: 35 }, // (no handaxes to throw: the pit fists)
    // Katarina, the mender (serial-castegut/BIBLE.md: a cleric of Tronupholen, the Fey in the Mirror, CANON 08-06). RULED 09-28g (Griz):
    // "Kat supposed to be Cleric of trickster deity trapped in mirror" -- her domain is our own, the Window (invented.json #the-window).
    // Her level is unruled in the register (cleric 2 or 3, BIBLE 08-27), so she stands at any, as Higertha does; human, generic numbers
    // RULED 09-28h (Griz): "at campaign start she's just hit 3" -- her register's level is 3
    // the Gray Keeping's matriarch-clerics (10-16, the Snoot's death-watch and its band -- snoot-mode/js/data.js gkw, gk2): OD&D Book I keys a cleric's
    // fighting to CHAINMAIL's -- a Lama (6th) "Hero", a Patriarch of 9th "Superhero - 1" -- so the Eldest is cleric 9, the band's matriarch cleric 6, both of
    // the Keeping. The register gives no numbers (gnoll-hills.md: "larger and fiercer", "the greyest, longest-lived"): the seat's drafts, a gnoll's body
    // at a priest's wisdom; the skull-staff a quarterstaff, hide and mail a chain shirt (ART-68's look). deep16/data/foes.js gnollmatriarcheldest, -lama
    matriarch: { name: 'The Eldest', named: true, cls: 'cleric', lvl: 9, race: 'human', subclass: 'the Keeping', abil: { str: 15, dex: 12, con: 14, int: 10, wis: 18, cha: 12 },
      equip: { weapon: 'quarterstaff', armor: 'chainshirt' }, look: 'gnollmatriarch_p1' },
    matriarchlama: { name: 'Matriarch', named: true, cls: 'cleric', lvl: 6, race: 'human', subclass: 'the Keeping', abil: { str: 14, dex: 12, con: 13, int: 10, wis: 16, cha: 11 },
      equip: { weapon: 'quarterstaff', armor: 'chainshirt' }, look: 'gnollmatriarch_p1' },
    katarina: { name: 'Katarina', cls: 'cleric', lvl: 3, race: 'human', subclass: 'the Window', named: true,
      equip: { weapon: 'mace', armor: 'leather', shield: 'shield' } },
    // Ingrith Scalebeam, cleric 4 (deepholm-and-the-edifice.md, CANON 09-26b). RULED 09-28g (Griz: "Yes, she's meant to be Cleric"):
    // her 8-bit sheet is a cleric's now (content/heroes.json: the d8's average HP, slots 4/3, the drafted list and the Life Domain's
    // Spiritual Weapon), so the grid reads her as it reads the heroes; the overlay stays only for a sheet still a fighter's
    // Pyronimus, King of Solskaft (content/heroes.json pyro; RULED 09-30, Griz: "Gonna have to Pyro NPC up to 12, he's key"): fighter 12,
    // the Champion, two maces -- the plain one and the Mace of Disruption -- by Two-Weapon Fighting and, at 10, our Hammer and Tongs
    // (invented.json #hammer-and-tongs); +3 dwarven plate and the King's Mantle (RULED 09-30b). His turn is his own (js/pyro.js): on the
    // Pocket DM (?npc=pyro) and as a foe he fights at full. Past the class's 9 by name only (maxLvl: 09-30, "past 9 for special NPCs")
    pyro: { name: 'Pyro', named: true, cls: 'fighter', lvl: 12, maxLvl: 12, race: 'dwarf', subclass: 'Champion', look: 'pyro_p0', script: 'measure',
      abil: { str: 20, dex: 14, con: 16, int: 11, wis: 13, cha: 15 }, hp: 112, noPrecast: true,
      equip: { weapon: 'mace', offhand: 'macedisruption', armor: 'kingsplate', shield: null, cloak: 'kingsmantle' } },
    // GreyFang (TarlynsPit/wiki/greyfang.md: the wolf-headed Lupine of the Gemorax fragment, a survivor of Rhollor's people from the Orc War, who runs the
    // fighting pit dug at the bunker-converted building and the Promenade's errands -- Griz, 10-08). A ranger of our own way, the Grey Road (Griz, 10-08: "If we
    // do not already have a subclass option for folks to choose, please invent one based on this fellow"), at 11 by name as Pyro is at 12 (his sheets carry
    // the volley and the whirlwind). Lupine (invented.json #greyfang): darkvision and keen hearing and smell, kept on his record, not a race in the maker's
    // list (the races are their own lane). The numbers are the seat's draft (STR 12, DEX 18, CON 14, INT 10, WIS 16, CHA 10; the SRD's average HP)
    greyfang: { name: 'GreyFang', named: true, cls: 'ranger', lvl: 11, maxLvl: 11, race: 'human', lupine: true, subclass: 'the Grey Road', look: 'greyfang_p1',
      abil: { str: 12, dex: 18, con: 14, int: 10, wis: 16, cha: 10 }, equip: { weapon: 'greyfangbow', armor: 'leather' }, alt: 'shortsword', style: 'archery' }, // (his bow, the fight's reward: content/items.json greyfangbow -- Griz, 10-08: "Yes, have it equipped for the little benches")
    ingrith: { overlay: true, cls: 'cleric', lvl: 4, slots: [4, 3], subclass: 'Life Domain', race: 'dwarf', abil: { str: 12, dex: 10, con: 14, int: 13, wis: 16, cha: 13 },
      equip: { weapon: 'mace', armor: 'chainmail', shield: 'shield' }, hp: 31,
      known: ['sacredflame', 'guidance', 'curewounds', 'healingword', 'bless', 'shieldoffaith', 'aid', 'lesserrestoration', 'spiritualweapon'] }
  };

  // spells known or prepared at a level: the class's list to the highest slot it has, as many as it may know (or prepare),
  // each level's first; always-prepared ones on top
  // a land's circle spells the level has reached, of those the grid casts (the Circle of the Land, 09-29)
  function landSpells(c, lvl, land) {
    var out = [], L = land && c.lands && c.lands[land];
    if (L) Object.keys(L).forEach(function (k) { if (lvl >= +k) out = out.concat(L[k].filter(function (id) { return !!D.SPELLS[id]; })); });
    return out;
  }
  function spellsFor(c, cls, lvl, abil, sub, land) {
    var h0 = { cls: cls, lvl: lvl }, slots = R.slotsFor(h0), top = 0;
    slots.forEach(function (n, i) { if (n > 0) top = i + 1; });
    var sp = c.spells || {}, out = [], cantrips = [];
    var nc = c.cantrips ? c.cantrips[lvl - 1] : 0;
    (sp[0] || []).slice(0, nc).forEach(function (id) { cantrips.push(id); });
    if (cls === 'druid' && lvl >= 2 && c.landCantrip) cantrips.push(c.landCantrip); // (the Land's bonus cantrip)
    var pool = [];
    for (var L = 1; L <= top; L++) (sp[L] || []).forEach(function (id) { pool.push(id); });
    if (cls === 'bard' && lvl >= 6 && sp.magicalSecrets) sp.magicalSecrets.forEach(function (id) { pool.push(id); }); // (Additional Magical Secrets, Lore 6)
    var n = c.known ? c.known[lvl - 1] : c.prepares ? Math.max(1, DS.mod(abil[c.prepares]) + (c.half ? Math.floor(lvl / 2) : lvl)) : 0;
    if (c.half && lvl < 2) n = 0;
    // the highest levels first, then down, so a caster of 5 carries its 3rds (the build's own habit: R.prepDefault)
    var byLv = {}; pool.forEach(function (id) { var L2 = 0; for (var k = 1; k <= 9; k++) if ((sp[k] || []).indexOf(id) >= 0) L2 = k; if (!L2) L2 = 3; (byLv[L2] = byLv[L2] || []).push(id); });
    var take = [], rounds = 0;
    while (take.length < n && rounds < 20) { for (var L3 = top; L3 >= 1 && take.length < n; L3--) { var q = byLv[L3] || []; var nx = q.filter(function (id) { return take.indexOf(id) < 0; })[0]; if (nx) take.push(nx); } rounds++; if (!pool.some(function (id) { return take.indexOf(id) < 0; })) break; }
    var always = landSpells(c, lvl, land);
    Object.keys(c.always || {}).forEach(function (k) { if (lvl >= +k) always = always.concat(c.always[k]); });
    out = cantrips.concat(always, take);
    return out.filter(function (id, i) { return out.indexOf(id) === i; });
  }
  // a named one built away from its register's level (09-28h: the Pocket DM's talmok:7, the tester ladder): the register's own list
  // kept where the slots reach (cut from the lowest when the level prepares fewer), then its `grow` (the seat's picks past the
  // register, the highest level first), then the class's list, to the count the level knows or prepares; the cantrips the same
  // way. The domain's always-prepared on top, uncounted
  function awayList(c, cls, lvl, abil, own, grow, land) {
    var slots = R.slotsFor({ cls: cls, lvl: lvl }), top = 0;
    slots.forEach(function (n, i) { if (n > 0) top = i + 1; });
    var lv = function (id) { var s = DS.DATA.spells[id] || (D.EXTRA_SPELLS || {})[id]; return s ? s.level || 0 : -1; };
    var sp = c.spells || {}, g = grow || {}, uniq = function (id, i, a) { return a.indexOf(id) === i; };
    var nc = c.cantrips ? c.cantrips[lvl - 1] : 0;
    var n = c.known ? c.known[lvl - 1] : c.prepares ? Math.max(1, DS.mod(abil[c.prepares]) + (c.half ? Math.floor(lvl / 2) : lvl)) : 0;
    var always = landSpells(c, lvl, land);
    Object.keys(c.always || {}).forEach(function (k) { if (lvl >= +k) always = always.concat(c.always[k]); });
    // (one of the register's the game has no record of -- Willem's Minor Illusion -- counts as a cantrip known)
    var ownC = own.filter(function (id) { return lv(id) === 0; }), ownX = own.filter(function (id) { return lv(id) < 0; });
    var cantrips = ownC.concat(g[0] || [], sp[0] || []).filter(uniq).slice(0, Math.max(nc - ownX.length, ownC.length));
    var take = own.filter(function (id) { var L = lv(id); return L >= 1 && L <= top && always.indexOf(id) < 0; });
    if (take.length > n) take = take.slice().sort(function (a, b) { return lv(b) - lv(a); }).slice(0, n);
    var more = function (id) { if (take.length < n && take.indexOf(id) < 0 && always.indexOf(id) < 0) take.push(id); };
    for (var L = top; L >= 1; L--) (g[L] || []).forEach(more);
    // the class's list, a level at a time from the top, round and round (spellsFor's habit)
    for (var r = 0; r < 20 && take.length < n; r++) {
      var got = 0;
      for (var L2 = top; L2 >= 1 && take.length < n; L2--) { var nx = (sp[L2] || []).filter(function (id) { return take.indexOf(id) < 0 && always.indexOf(id) < 0; })[0]; if (nx) { take.push(nx); got++; } }
      if (!got) break;
    }
    // (one the game has no record of stays listed, as the register has it: M.list leaves it off the ring)
    return cantrips.concat(always, take, ownX).filter(uniq);
  }

  // ------------------------------------------------------------------ the sheet (the 8-bit game's shape: js/rules.js reads it)
  // spec: { cls, lvl, race, name, named, spells (a list over the class's), maxhp (true: a max hit die a level), land, patron }
  NPC.sheet = function (spec) {
    var cls = spec.cls, c = C[cls], RC = R.CLASSES[cls], lvl = Math.max(1, Math.min(NPC.maxLvl(cls, spec), spec.lvl || 1));
    if (!c || !RC) throw new Error('DEEP16: no class ' + cls);
    var pkd = pickedOver(spec, lvl); if (pkd) spec = Object.assign({}, spec, pkd.fields); // (a card's level choices past the increase, 10-17: pickedOver below)
    var race = NPC.RACES[spec.race || 'human'] || NPC.RACES.human;
    var abil = {};
    c.prio.forEach(function (k, i) { abil[k] = ARRAY[i]; });
    Object.keys(race.abil).forEach(function (k) { abil[k] += race.abil[k]; });
    if (spec.abil) abil = JSON.parse(JSON.stringify(spec.abil)); // (a named one's register numbers, as they stand)
    // Ability Score Improvements (4, 8; the fighter's 6 too): +2 to the first ability not yet at 20, split over the next if need be.
    // A named one's register numbers stand at its register's level; built past it (spec.away: that level), the ones after it come
    // on top (09-28h: Talmok's STR 16 is 18 at 4 and 20 at 8)
    // (spec.asis: the Pocket DM's own character -- the scores typed in are its level-1 numbers, and the ASIs come with the level, 10-02)
    // (the player's own at a level -- spec.picks[at].asi, the Pocket DM's maker and its cards, 10-14 -- in place of the class's first; each level's increase
    // kept on the sheet, h.asiAt, for the pick page's default)
    var asiAt = {}, featsW = [];
    (spec.abil ? (spec.away ? (c.asiAt || [4, 8]).filter(function (at) { return at > spec.away; }) : spec.asis ? (c.asiAt || [4, 8]) : []) : c.asiAt || [4, 8]).forEach(function (at) {
      if (lvl < at) return;
      var mine = spec.picks && spec.picks[at] && spec.picks[at].asi, got = {};
      if (mine && mine.feat) { if (R.FEATS && R.FEATS[mine.feat] && featsW.indexOf(mine.feat) < 0) { featsW.push(mine.feat); got.feat = mine.feat; } } // (a feat in place of the increase -- js/rules.js R.FEATS, 10-15)
      else if (mine) Object.keys(mine).forEach(function (k) { if (abil[k] == null) return; var g = Math.max(0, Math.min(20 - abil[k], mine[k])); if (g > 0) { abil[k] += g; got[k] = g; } });
      else { var left = 2; c.prio.forEach(function (k) { var room = 20 - abil[k], g = Math.min(room, left); if (g > 0) { abil[k] += g; left -= g; got[k] = g; } }); }
      asiAt[at] = got;
    });
    var con = DS.mod(abil.con), hd = RC.hd;
    var hp = spec.maxhp ? lvl * Math.max(1, hd + con) : hd + con + (lvl - 1) * (hd / 2 + 1 + con);
    hp += (race.hpLevel || 0) * lvl;
    var sub = c.sub && lvl >= c.sub[0] ? c.sub[1] : null;
    if ('subclass' in spec) sub = spec.subclass;
    if (cls === 'warlock' && spec.patron === 'mirror') sub = 'The Mirror';
    if (pkd && pkd.fields.subclass != null) sub = pkd.fields.subclass; // (one chosen on the card's EDIT stands over the register's, Amara's patron too)
    if (sub === 'Draconic Bloodline') hp += lvl; // Draconic Resilience: +1 HP a level
    if (spec.hp && !spec.away) hp = spec.hp; // (a named one's sheet: its register's number; away from its level, the SRD's average)
    var h = {
      id: spec.id || ('npc-' + cls + lvl), name: spec.name || (RC.name + ' ' + lvl), cls: cls, lvl: lvl, xp: R.XP_LEVEL[lvl],
      base: JSON.parse(JSON.stringify(abil)), abil: abil, maxhp: hp, hp: hp,
      equip: Object.assign({ weapon: c.kit.weapon, armor: c.kit.armor || null, shield: c.kit.shield || null, ring: null, cloak: null }, spec.equip || {}),
      known: [], feats: {}, conds: {}, subclass: sub, saveProf: RC.saves.slice(), style: spec.style && (R.STYLE_FOR[cls] || []).indexOf(spec.style) >= 0 ? spec.style : c.style || null, // (the Pocket DM's maker picks one, 10-06; R.style gives none before the class's level)
      skills: {}, expertise: [], race: spec.race || 'human', npc: true, alt: 'alt' in spec ? spec.alt : (c.kit.alt || null),
      land: spec.land || (cls === 'druid' ? 'underdark' : null), // (a druid's circle land: the generic druid's is the Pit's Underdark, 09-29)
      lupine: !!spec.lupine, // (GreyFang's people, 10-08: NPC.unit gives the senses)
      asiAt: asiAt, // (each level's ability increase as it was taken: the Pocket DM's pick page marks it, 10-14)
      featIds: featsW.length ? featsW.slice() : undefined, // (the feats a word's picks took: R.hasFeat, 10-15)
      script: spec.script || null // (a named one's own turn: js/pyro.js)
    };
    // a druid in a word's metal armour (one made or won before 10-21's ruling: R.canEquip) wears its kit's instead -- the Pocket DM puts the metal one in the pack (PK.druidMetal)
    if (cls === 'druid' && h.equip.armor && !R.canEquip(h, DS.DATA.items[h.equip.armor])) h.equip.armor = c.kit.armor || null;
    if (spec.loot) NPC.wear(h, spec.loot); // (the Pocket DM's winnings: `+item` on the word, worn where the class may -- 10-02)
    // skills the grid reads (Stealth, Perception): written at the level-1 proficiency, as the 8-bit sheets are (R.skill grows them)
    if (/rogue|ranger|monk|bard/.test(cls)) h.skills.Stealth = DS.mod(abil.dex) + 2;
    if (/rogue|ranger|druid|barbarian|cleric/.test(cls)) h.skills.Perception = DS.mod(abil.wis) + 2;
    if (cls === 'rogue') h.expertise = (c.expertise || []).slice(); // (Expertise at 1: both twice over)
    R.refresh(h, true);
    if (!(race.relentless)) delete h.feats.relentless; // (R.refresh gives every paladin Lymen's half-orc Relentless)
    else h.feats.relentless = 1;
    // the class features past the 8-bit game's refresh (09-30; js/features.js): the Fiend's Dark One's Own Luck (6; a short rest), the
    // sorcerer's metamagic (3: two options, a third at 10, a fourth at 17), the Hunter's Defensive Tactics (7: Escape the Horde unless the spec
    // says 'multiattack' or 'steelwill'), the warlock's Pact Boon (3: below)
    if (sub === 'The Fiend' && lvl >= 6) h.feats.darkLuck = 1;
    if (cls === 'sorcerer' && lvl >= 3) h.metamagic = (spec.metamagic || c.metamagic || []).slice(0, lvl >= 17 ? 4 : lvl >= 10 ? 3 : 2);
    if (cls === 'ranger' && sub === 'Hunter' && lvl >= 7) h.hunterDef = spec.hunterDefense || 'horde';
    if (cls === 'warlock' && lvl >= 3 && spec.pact === 'blade') { // the pact weapon in hand; what it carried takes the second place
      var carried = h.equip.weapon; h.pact = 'blade'; h.equip.weapon = spec.pactForm || 'rapier';
      if (!('alt' in spec)) h.alt = carried !== h.equip.weapon ? carried : c.kit.alt;
    }
    // the spells: the class's list (or the spec's), cut to what the level knows or prepares
    if (RC.caster) {
      var cc = c;
      if (spec.spells) cc = Object.assign({}, c, { spells: spec.spells });
      if (sub === 'The Mirror') { cc = Object.assign({}, cc, { spells: JSON.parse(JSON.stringify(cc.spells)) }); Object.keys(NPC.MIRROR).forEach(function (k) { if (lvl >= +k) NPC.MIRROR[k].forEach(function (id) { var L = +k >= 5 ? 3 : +k >= 3 ? 2 : 1; cc.spells[L] = [id].concat((cc.spells[L] || []).filter(function (x) { return x !== id; })); }); }); }
      if (NPC.SUBS[sub] && NPC.SUBS[sub].always) cc = Object.assign({}, cc, { always: NPC.SUBS[sub].always }); // (our own domains' lists, in the Life Domain's place)
      // a named one's own list, with its domain's always-prepared spells on top (09-28g: Torvald's Vigil)
      h.known = spec.known && spec.away ? awayList(cc, cls, lvl, abil, spec.known, spec.grow, h.land)
        : spec.known ? spec.known.concat(subAlways(sub, lvl), landSpells(cc, lvl, h.land)).filter(function (id, i, a) { return a.indexOf(id) === i; }) : spellsFor(cc, cls, lvl, abil, sub, h.land);
      // a word's spells above its highest slot wait in the word for the levels that bring the slots (SRD 5.1: a caster learns spells of a level it has slots
      // for) -- a word made at a higher level and walked down, or made before the maker's list kept to the slots; 10-21, Griz: "The Sorc was showing spell slots
      // for like 3rd and 4th level (0 slots, but on the wheel)"
      if (spec.known && !spec.away) { var topS = 0; (h.slotsMax || []).forEach(function (n, i) { if (n > 0) topS = i + 1; }); h.known = h.known.filter(function (id) { var s0 = D.magic.data(id); return !s0 || !(s0.level > 0) || s0.level <= topS; }); }
      // the camp's morning (js/camp.js o.ours, 09-29): the day's spells as chosen there, over the cantrips and the always-prepared
      if (spec.prepared) {
        var alw = alwaysOf(cc, sub, lvl, h.land), keep = h.known.filter(function (id) { var s = D.magic.data(id); return !s || !(s.level > 0) || alw.indexOf(id) >= 0; });
        h.known = keep.concat(spec.prepared).filter(function (id, i, a) { return a.indexOf(id) === i; });
      }
      if (pkd) h.known = h.known.filter(function (id) { return pkd.drop.indexOf(id) < 0; }).concat(pkd.add).filter(function (id, i, a) { return a.indexOf(id) === i; }); // (the card's swaps)
    }
    // Pact of the Tome (SRD 5.1, 3rd): the Book of Shadows -- three cantrips from any class's list, cast at will, and not counted against the
    // cantrips known; warlock spells for her though they are not on its list (the built ones only: a cantrip not built is not on the ring)
    if (cls === 'warlock' && lvl >= 3 && spec.pact === 'tome') {
      h.pact = 'tome'; h.tome = (spec.tome || c.tome || []).filter(function (id) { return !!D.SPELLS[id]; });
      h.known = h.known.concat(h.tome).filter(function (id, i, a) { return a.indexOf(id) === i; });
    }
    // our own subclasses' per-rest uses (js/features.js): the Window's Hand on the Neck, the Vigil's Keeper's Ward -- WIS a long rest
    if (NPC.SUBS[sub] && NPC.SUBS[sub].uses) h.feats[NPC.SUBS[sub].uses] = Math.max(1, DS.mod(abil.wis));
    if (cls === 'warlock') {
      var inv = []; Object.keys(c.invocations || {}).forEach(function (k) { if (lvl >= +k) inv = c.invocations[k].slice(); }); h.invocations = spec.invocations ? spec.invocations.slice() : inv;
      if (sub === 'The Mirror') h.mirrorEye = true; // (RULED 09-28: the pact of the Mirror's class feature)
    }
    if (spec.guardianText) h.guardianText = spec.guardianText;
    // a caster who wears no armour walks in under Mage Armor, cast that morning and paid for (the fixture's Aurdin: save.js)
    // (a named one away from its register walks in as the class's own would: Willem at 7 has his Mage Armor up)
    // (the camp says yes or no itself: spec.mageArmor)
    var wantMA = spec.mageArmor != null ? !!spec.mageArmor : (!spec.noPrecast || spec.away);
    if (wantMA && h.known.indexOf('mageArmor') >= 0 && !R.armored(h) && h.slots && h.slots[0] > 0) { h.conds.mageArmor = 1; h.slots[0]--; }
    // the camp's morning (js/camp.js o.ours): what was cast on him before the fight (Mage Armor, Light -- the grid's conditions), the
    // slot levels he spent casting ahead, and Aid's +5
    if (spec.conds) Object.keys(spec.conds).forEach(function (k) { h.conds[k] = spec.conds[k]; });
    (spec.spend || []).forEach(function (lv) { for (var i = lv - 1; i < (h.slots || []).length; i++) if (h.slots[i] > 0) { h.slots[i]--; break; } });
    if (spec.aid) { h.maxhp += spec.aid; h.conds.aid = spec.aid; }
    if (spec.conjured) h.conjured = spec.conjured; // (Conjure Elemental cast at the camp: the kind that walks in beside him -- js/walls.js)
    h.hp = h.maxhp;
    NPC.carry(h, spec); // (the Pocket DM's ladder: what the last fight and the short rest left -- 10-02)
    return h;
  };
  // what a character walks in with between the Pocket DM's rungs (deep16/js/pocket.js, 10-02): the hit points left, the slots left, the
  // per-rest features as the rest left them. Nothing said: whole
  NPC.carry = function (h, spec) {
    if (spec.hpLeft != null) { h.hp = Math.max(0, Math.min(h.maxhp, spec.hpLeft)); h.ko = h.hp <= 0; }
    if (spec.slotsLeft) h.slots = spec.slotsLeft.slice();
    if (spec.featsLeft) Object.keys(spec.featsLeft).forEach(function (k) { h.feats[k] = spec.featsLeft[k]; });
    if (spec.condsLeft) Object.keys(spec.condsLeft).forEach(function (k) { h.conds[k] = spec.condsLeft[k]; });
    return h;
  };
  // the Pocket DM's winnings worn (10-02, Griz: "pick a random character on victory and give magic item appropriate to class"): each id goes
  // in the slot its kind names, if the class may carry it (R.canEquip: the weapon's group, the armour's weight, a shield with a free hand)
  // (10-06: the place is the item's own -- js/rules.js R.slotFor: a ring the first free hand of two, boots the feet, a periapt the neck; a sheet that keeps a
  // list of bonds (a story hero's) takes up what it wears at once, as at a rest)
  NPC.wear = function (h, ids) {
    (ids || []).forEach(function (id) {
      var off = /^no(weapon|armor|shield|offhand|ring|ring2|cloak|feet|neck)$/.exec(id); if (off) { h.equip[off[1]] = null; return; } // (a card's GEAR: the place's own taken off, 10-17; any worn place too, his "removing it from barley doesn't take - doesn't go in pack, is on him again when you hit 'gear'")
      var oh = /^off:(.+)$/.exec(id); if (oh) { var io = DS.DATA.items[oh[1]]; if (io && R.offhandWeapon && R.offhandWeapon(io) && R.canEquip(h, io)) { h.equip.offhand = oh[1]; h.equip.shield = null; } return; } // (a weapon in the off hand: the second sword)
      var it = DS.DATA.items[id], slot = it && R.slotFor(h, it);
      if (!slot) return;
      if (it.kind !== 'cloak' && !R.canEquip(h, it)) return;
      h.equip[slot] = id;
      if (slot === 'weapon' && it.weapon && (it.weapon.props || []).indexOf('two-handed') >= 0) h.equip.shield = null; // (both hands)
    });
    if (h.attuned) R.attune(h);
    return h;
  };
  // the always-prepared at a level: our own domain's list (in the Life Domain's place), else the class's
  function alwaysOf(c, sub, lvl, land) {
    if (NPC.SUBS[sub] && NPC.SUBS[sub].always) return subAlways(sub, lvl).concat(landSpells(c, lvl, land));
    var a = landSpells(c, lvl, land); Object.keys(c.always || {}).forEach(function (k) { if (lvl >= +k) a = a.concat(c.always[k]); }); return a;
  }
  // the tester ladder's camp (js/camp.js o.ours, 09-29): what one of ours may prepare at the spec's level -- the register's list, the
  // grow picks and the class's list to the highest slot, the built ones only (a spell not built yet is simply not on it); how many (the
  // class's count); the domain's always-prepared, uncounted; and the class's own default day. Null for one who casts nothing
  NPC.prepInfo = function (spec) {
    var c = C[spec.cls], RC = R.CLASSES[spec.cls];
    if (!c || !RC || !RC.caster || !(c.prepares || c.known)) return null;
    var h = NPC.sheet(Object.assign({}, spec, { prepared: null, conds: null, spend: null, aid: 0, mageArmor: false }));
    var lv = function (id) { var s = D.magic.data(id); return s ? s.level || 0 : -1; }, uniq = function (id, i, a) { return a.indexOf(id) === i; };
    var top = 0; (h.slotsMax || []).forEach(function (n, i) { if (n > 0) top = i + 1; });
    var n = c.known ? c.known[h.lvl - 1] : Math.max(1, DS.mod(h.abil[c.prepares]) + (c.half ? Math.floor(h.lvl / 2) : h.lvl));
    if (c.half && h.lvl < 2) n = 0;
    var alw = alwaysOf(c, h.subclass, h.lvl, h.land), g = spec.grow || {}, sp = c.spells || {}, pool = (spec.known || []).slice();
    for (var L = 1; L <= top; L++) pool = pool.concat(g[L] || [], sp[L] || []);
    pool = pool.filter(uniq).filter(function (id) { var L2 = lv(id); return L2 >= 1 && L2 <= top && alw.indexOf(id) < 0; })
      .map(function (id, i) { return { id: id, i: i, lv: lv(id) }; }).sort(function (a, b) { return a.lv - b.lv || a.i - b.i; }).map(function (x) { return x.id; });
    return { n: n, top: top, pool: pool, always: alw.filter(function (id) { return lv(id) >= 0 && lv(id) <= top; }), def: h.known.filter(function (id) { return lv(id) >= 1 && alw.indexOf(id) < 0; }) };
  };
  // a card's level choices past the increase (10-17, the Pocket DM's EDIT -- Griz: "For the named characters let's add an edit toggle on the level select screen,
  // where they get full edit of torvald and aurdin and such"): spec.picks to the level, in order -- the archetype, the class options and the style in place of
  // the register's, the spells taken and the ones let go (drop) over its list. Null when the picks hold only increases (NPC.sheet reads those itself)
  function pickedOver(spec, lvl) {
    var P = spec.picks; if (!P) return null;
    var out = { fields: {}, add: [], drop: [] }, any = false;
    Object.keys(P).map(Number).sort(function (a, b) { return a - b; }).forEach(function (L) {
      var p = P[L] || {}; if (L > lvl) return;
      if (p.archetype != null) { out.fields.subclass = p.archetype; any = true; }
      R.PICK_OPTS.forEach(function (k) { if (p[k] != null) { out.fields[k] = p[k]; any = true; } });
      (p.drop || []).forEach(function (id) { out.drop.push(id); out.add = out.add.filter(function (x) { return x !== id; }); any = true; });
      (p.spells || []).concat(p.cantrip || []).forEach(function (id) { out.add.push(id); out.drop = out.drop.filter(function (x) { return x !== id; }); any = true; });
    });
    return any ? out : null;
  }
  // a class sheet's level-up as the one pick page asks it (10-17 -- the Pocket DM's maker, Griz: "Ideally this wouldn't level until next, then you'd have to walk all
  // the way through each one for that character", and a named card's EDIT): what level L gives over L-1 -- the increase, the subclass at its level, the cantrips
  // and spells it adds (the new ones of its list marked, any of the class's up to the level's slots offered), the class options as their counts grow
  // (invocations, metamagic) or at their level (the pact, the land), the fighting style at its level. spec: the character (its picks, its list, at any level);
  // o.known: the spells it has at L-1 (else its sheet's); o.classDefaults: the class's own new spells marked, not its list's (the maker, whose list is the
  // player's). Returns { lvl, asks, lines }: asks empty when the level gives nothing to choose; lines, what the level gave
  NPC.levelAsks = function (spec, L, o) {
    o = o || {};
    var cls = spec.cls, c = C[cls], RC = R.CLASSES[cls], at = function (s, lv) { return NPC.sheet(Object.assign({}, s, { lvl: lv })); };
    var hL = at(spec, L), hP = L > 1 ? at(spec, L - 1) : null, asks = [], name = spec.name || RC.name;
    var fill = function (took, ids, n) { return took.concat(ids.filter(function (id) { return took.indexOf(id) < 0; })).slice(0, n); }; // (the class's own, topped up from the list to the count: CONFIRM is never short on its own picks)
    var lines = [L > 1 ? name + ' is now level ' + L + '! Max HP +' + (hL.maxhp - hP.maxhp) + '.' : name + ' at level 1: HP ' + hL.maxhp + '.'];
    if (hL.asiAt && hL.asiAt[L]) asks.push({ kind: 'asi', need: 2, took: hL.asiAt[L] });
    var scl = R.SUBCLASSES[cls];
    if (scl && L === scl.at) asks.push({ kind: 'archetype', word: scl.word, need: 1, took: scl.opts.some(function (x) { return x.name === hL.subclass; }) ? hL.subclass : scl.opts[0].name,
      rows: scl.opts.map(function (x) { return { id: x.name, name: x.name + (x.srd ? '' : ' *'), desc: x.desc || '', max: 1 }; }) });
    if (RC.caster && (c.prepares || c.known)) {
      var have = o.known || (hP ? hP.known : []), lv = function (id) { var s = D.magic.data(id); return s ? s.level || 0 : -1; };
      var row = function (id) { var s = D.magic.data(id); return { id: id, name: s.name, desc: s.desc || '', lv: s.level || 0, max: 1, off: '' }; };
      var dS = o.classDefaults ? Object.assign({}, spec, { known: null }) : spec, dL = at(dS, L).known, dP = L > 1 ? at(dS, L - 1).known : [];
      var fresh = dL.filter(function (id) { return dP.indexOf(id) < 0 && have.indexOf(id) < 0; });
      var nc = function (x) { return c.cantrips ? c.cantrips[x - 1] || 0 : 0; }, kc = nc(L) - (L > 1 ? nc(L - 1) : 0);
      if (kc > 0) {
        var cpool = ((c.spells && c.spells[0]) || []).filter(function (id) { return lv(id) === 0 && have.indexOf(id) < 0; });
        if (cpool.length) asks.push({ kind: 'cantrip', need: kc, took: fill(fresh.filter(function (id) { return cpool.indexOf(id) >= 0; }), cpool, kc), rows: cpool.map(row) });
      }
      var iL = NPC.prepInfo(Object.assign({}, dS, { lvl: L })), iP = L > 1 ? NPC.prepInfo(Object.assign({}, dS, { lvl: L - 1 })) : null, ks = iL ? iL.n - (iP ? iP.n : 0) : 0;
      if (ks > 0) {
        var pool = iL.pool.filter(function (id) { return have.indexOf(id) < 0; });
        if (pool.length) asks.push({ kind: 'spells', book: cls === 'wizard', need: ks, took: fill(fresh.filter(function (id) { return pool.indexOf(id) >= 0; }), pool, ks), rows: pool.map(row) });
      }
    }
    (NPC.OPTIONS[cls] || []).forEach(function (op) {
      if (L < op.at) return;
      var nN = op.count ? op.count(L) : 1, nP = L - 1 < op.at ? 0 : op.count ? op.count(L - 1) : 1, cur = hL[op.key];
      if (nN <= nP) return;
      asks.push({ kind: 'option', key: op.key, word: op.word, need: nN, one: !op.count, took: op.count ? fill((cur || []).filter(function (id) { return op.opts.some(function (x) { return x.id === id; }); }), op.opts.map(function (x) { return x.id; }), nN) : (op.opts.some(function (x) { return x.id === cur; }) ? cur : null),
        rows: op.opts.map(function (x) { return { id: x.id, name: x.name, desc: x.desc || '', max: 1 }; }) });
    });
    if (R.STYLE_AT[cls] === L && (R.STYLE_FOR[cls] || []).length) asks.push({ kind: 'option', key: 'style', word: 'STYLE', need: 1, one: true, took: (R.STYLE_FOR[cls] || []).indexOf(hL.style) >= 0 ? hL.style : null,
      rows: R.STYLE_FOR[cls].map(function (k) { return { id: k, name: R.STYLES[k].name, desc: R.STYLES[k].words || '', max: 1 }; }) });
    return { lvl: L, asks: asks, lines: lines, h: hL }; // (h: the sheet at L, the page's scratch)
  };
  // the class's figure, or its race's where one is drawn (npc<class>_<race>_p0: the dragonborn's and the tiefling's, 10-03, Griz: "1 per class")
  function classLook(cls, race) { var k = C[cls] && C[cls].look, r = k && race && race !== 'human' ? k.replace('_p0', '_' + race + '_p0') : null; return r && D.SHEETS && D.SHEETS[r] ? r : k || null; }
  // the figure the camp draws for a spec: a named one's own, else the class's (its race's)
  NPC.lookOf = function (spec) {
    var L = spec && spec.hero && D.save && D.save.LOOK && D.save.LOOK[spec.hero]; // (a hero's look by what he wears -- Aurdin's two mantles, Barley's coat or mail: save.js SV.look, 10-20)
    if (L && (L.robe || L.mail)) { var hs = null; try { hs = NPC.heroSheet(spec); } catch (e) { hs = null; } return D.save.look(spec.hero, null, hs).sheet; }
    return spec.look || classLook(spec.cls, spec.race);
  };

  // ------------------------------------------------------------------ the unit (on either side): the heroes' shape (save.js unitOf), and the rest
  NPC.unit = function (h, side, o) {
    o = o || {};
    var c = C[h.cls], race = NPC.RACES[h.race] || NPC.RACES.human;
    var u = D.save.unitOf(h, side !== 'party', null);
    u.kind = 'npc' + h.cls; // (no bestiary kind: nothing keyed to a kind -- the wheelwright's bolt, a fight's roster -- takes it for one)
    u.side = side || 'foe'; u.guest = false; u.npc = true; u.classAI = true; // (on the party's side it is the player's to run, unless the bench runs it)
    u.id = o.id || h.id; u.name = h.name; u.named = !!o.named || !!h.named;
    u.sheet = o.sheet || classLook(h.cls, h.race); u.race = h.race; u.type = 'humanoid';
    u.speed = (race.speed || 30) + (h.cls === 'monk' && h.lvl >= 2 ? (h.lvl >= 6 ? 15 : 10) : 0) + (h.cls === 'barbarian' && h.lvl >= 5 ? 10 : 0);
    u.darkvision = Math.max(race.dv || 0, u.darkvision || 0);
    if (h.invocations && h.invocations.indexOf('devilsight') >= 0) u.devilSight = true; // Devil's Sight: sees in any dark, the magical too, to 120 ft
    if (race.resist) u.resist = (u.resist || []).concat(race.resist).filter(function (x, i, a) { return a.indexOf(x) === i; }); // (beside what is worn: a Ring of Resistance, save.js unitOf)
    if (race.fey) u.fey = true; // (Fey Ancestry: no magic puts it to sleep)
    if (race.savage) u.savage = true;
    if (h.mirrorEye) u.mirrorEye = true;
    if (h.lupine) { u.darkvision = Math.max(u.darkvision || 0, 60); u.keenSenses = true; u.raceName = 'Lupine'; } // (a Lupine, GreyFang's people, 10-08: darkvision 60, keen hearing and smell -- battle.js search)
    u.metamagic = h.metamagic || null; u.hunterDef = h.hunterDef || null; u.pact = h.pact || null; u.tome = h.tome || null; // (js/features.js reads them)
    // Pact of the Blade (SRD 5.1): proficient with the pact weapon while she wields it, and it counts as magical
    if (h.pact === 'blade' && u.weapon) { u.weapon = Object.assign({}, u.weapon, { magic: true, pact: true, name: u.weapon.name + ' (pact)' }); if (!R.isProfWeapon(h, R.weaponOf(h))) u.weapon.atk += R.prof(h.lvl); }
    u.invocations = h.invocations || null;
    if (h.conjured) u.conjured = h.conjured; // (seated by battle.js as the fight begins: js/walls.js W.seatConjured)
    if (h.guardianText) u.guardianText = h.guardianText;
    // Fiendish Vigor (an invocation): False Life at will -- she walks in with it
    if ((u.invocations || []).indexOf('fiendishvigor') >= 0) u.temp = Math.max(u.temp || 0, D.roll('1d4+4').total);
    if (h.cls === 'barbarian' && h.lvl >= 2) u.conds.dangerSense = true;
    // the Circle of the Land (SRD 5.1): Land's Stride (6) -- nonmagical difficult ground costs nothing (grid.js stepCost), advantage on the save
    // against magically made plants (Entangle); Nature's Ward (10) -- no poison, no disease, and no elemental or fey charms or frightens it
    if ((h.cls === 'druid' && h.lvl >= 6) || (h.cls === 'ranger' && h.lvl >= 8)) u.landsStride = true; // (the ranger's own Land's Stride, SRD 5.1, 8th: the same words -- no ranger had it, found 10-08 building GreyFang)
    if (h.cls === 'druid' && h.lvl >= 10) { u.natureWard = true; u.immune = (u.immune || []).concat(['poison']); u.condImmune = (u.condImmune || []).concat(['poisoned', 'diseased']); }
    if (h.cls === 'barbarian' && h.lvl >= 7) u.initAdv = true; // Feral Instinct (7): advantage on initiative (battle.js run); the surprise half is js/features.js F.feral
    u.facing = 1;
    // a second weapon to draw (the class AI's): a bow for the swordsman, a sword for the bowman, handaxes to throw
    if (h.alt) { var h2 = Object.assign({}, h, { equip: Object.assign({}, h.equip, { weapon: h.alt, shield: DS.DATA.items[h.alt] && (DS.DATA.items[h.alt].weapon.props || []).indexOf('two-handed') >= 0 ? null : h.equip.shield }) }); u.alt = D.save.weaponOf(h2); if (NPC.THROWN[h.alt]) { u.alt.ranged = true; u.alt.thrown = true; u.alt.range = NPC.THROWN[h.alt]; u.alt.count = (C[h.cls] && C[h.cls].kit.alt === h.alt && NPC.THROWN_N[h.cls]) || 1; } }
    return u;
  };
  // a named foe of the bestiary built by its class (data/foes.js `build`: Torvald, Amara, Willem): the class unit, and everything the
  // fight and the 8-bit seam read off the sheet kept -- its kind and its place in the 8-bit list, its art, its name, its register HP,
  // and the story's own ways (yields, flees, the traces, a Darkness thrown as she runs)
  NPC.fromFoe = function (B, f, d) {
    var spec = Object.assign({ id: f.id }, NPC.NAMED[d.build], { hp: d.hp, name: d.name });
    var u = NPC.unit(NPC.sheet(spec), 'foe', { id: f.id, sheet: d.sheet, named: d.named });
    u.kind = f.kind; u.i8 = f.i8; u.cr = d.cr; u.named = !!d.named;
    if (f.side) u.side = f.side; u.ally = !!f.ally; // (a fight's own ally built by its class: GreyFang in his pit, 10-08 -- battle.js gives allies the party's side)
    if (f.fated) u.fated = true; // (fated: goes down at 0, never dies in the fight -- his end is the story's, js/trophy.js; battle.js hurt)
    u.x = f.at ? f.at[0] : 0; u.y = f.at ? f.at[1] : 0; u.facing = 1; u.speed = d.speed || u.speed; // (where the fight stands it, as makeFoe does)
    u.hidden0 = !!f.hidden; u.traces = !!f.traces; u.ethereal = !!f.ethereal;
    u.yields = !!d.yields; u.flees = !!d.flees && !(B.fight && (B.fight.noFlee || B.fight.runWhenHurt));
    u.darkness = d.darkness ? { r: d.darkness.r, range: d.darkness.range, chance: d.darkness.chance, used: false, spell: true } : null;
    u.darkvision = Math.max(u.darkvision || 0, d.darkvision || 0);
    if (d.resist) u.resist = (u.resist || []).concat(d.resist).filter(function (x, i, a) { return a.indexOf(x) === i; });
    u.lightSensitive = !!d.lightSensitive; u.condImmune = d.condImmune || null; u.perception = d.perception || u.perception;
    u.type = d.type || 'humanoid';
    return u;
  };
  // a guest of the 8-bit game whose register class the 8-bit sheet does not carry (Ingrith: a fighter there, a cleric in the
  // register): the grid lays the class's casting over the 8-bit unit -- its spells, its slots (what it spent stays spent: the
  // 8-bit sheet keeps them till its long rest), its DC by the class's ability
  NPC.overlay = function (u, h) {
    var o = NPC.NAMED[h.id]; if (!o || !o.overlay || h.cls === o.cls) return u; // (the sheet is the class's already: nothing to lay over)
    var RC = R.CLASSES[o.cls], ab = RC.cast, prof = R.prof(u.lvl);
    u.cls = o.cls; u.known = o.known.slice();
    u.slots = h.slots && h.slots.length === o.slots.length ? h.slots.slice() : o.slots.slice(); u.slotsMax = o.slots.slice();
    u.spellDC = 8 + prof + DS.mod(u.abil[ab]); u.spellAtk = prof + DS.mod(u.abil[ab]);
    return u;
  };
  // (the paladin's Command, Branding Smite, Magic Weapon and his oath's Protection from Evil and Good and Sanctuary were this page's
  // alone till 09-28g; RULED then, Griz: "they have to be able to transfer back and forth from 16bit fights" -- they are js/rules.js
  // R.PALADIN_SPELLS / R.oathSpells now, one law for both games, and the 8-bit battle casts them)
  // thrown weapons read as ranged when thrown (SRD 5.1: the handaxe, the dagger 20/60)
  NPC.THROWN = { handaxe: [20, 60], dagger: [20, 60], spear: [20, 60], lighthammer: [20, 60] };
  // how many it carries to throw (the grid's rules §2.16, RULED 10-06: a count, no pick-up -- battle.js spendThrow): the SRD 5.1 starting kit's -- the barbarian's and the
  // fighter's two handaxes, the sorcerer's and the warlock's two daggers; one for any other (the bard's dagger, the paladin's and the monk's "any simple weapon")
  NPC.THROWN_N = { barbarian: 2, fighter: 2, sorcerer: 2, warlock: 2 };

  // how high a class NPC goes: 9 (the heroes' cap), the druid 12 (09-29, Griz: "please complete druid to 12 (game probably gonna get to the big
  // boys at some point)"; 09-30: "the above 9's we're just prepping in case we have combat involving special NPCs"). The URL's lvl may say 12;
  // NPC.sheet holds each class at its own ceiling
  NPC.MAXLVL = { druid: 12 };
  NPC.maxLvl = function (cls, named) { return (named && named.maxLvl) || NPC.MAXLVL[cls] || 9; }; // (a named one may stand past its class's: Pyro's 12)
  // a spec from a word: 'cleric', 'higertha', 'cleric:5', 'druid:3:dwarf'. A named one stands at its register's level (the story's
  // Talmok 3, Willem 5, Torvald 5) unless the word names another -- 'talmok:7' (09-28h: the Pocket DM, the tester ladder); built
  // away from it, `away` carries the register's level (NPC.sheet: the ASIs after it, the average HP, awayList)
  // The Pocket DM's words (10-02, deep16/js/pocket.js): `+item` after any word is a thing won and worn ('barley:5+dagger1', 'talmok:5:grown+ringofprotection');
  // one of the 8-bit game's own by name -- 'barley:5', 'brann', 'pyro' -- is built by the 8-bit's rules (NPC.heroUnit); a word beginning
  // '~' is a character of the player's own making, the whole sheet in the word (NPC.decode)
  NPC.spec = function (word, lvl) {
    var plus = String(word).split('+'), raw = plus[0], loot = plus.slice(1).filter(Boolean);
    var pk = loot.filter(function (p) { return p.charAt(0) === '^'; }); loot = loot.filter(function (p) { return p.charAt(0) !== '^'; }); // (a card's level picks, js/rules.js R.picksWord: 10-14)
    var sp = raw.charAt(0) === '~' ? NPC.decode(raw) : spec0(raw, lvl);
    if (sp && loot.length) sp.loot = (sp.loot || []).concat(loot);
    if (sp && pk.length && R.picksParse) sp.picks = R.picksParse(pk);
    return sp;
  };
  function spec0(word, lvl) {
    var bits = String(word).toLowerCase().split(':'), key = bits[0], L = +bits[1] || lvl || 1;
    var named = NPC.NAMED[key];
    // ('talmok:5:grown': the grown build even at the register's own level -- the tester ladder, 09-28h: "grown builds please")
    if (named) { var at = Math.max(1, Math.min(NPC.maxLvl(named.cls, named), +bits[1] || named.lvl || L)); return Object.assign({ id: key }, named, { lvl: at, away: named.lvl && (at !== named.lvl || bits[2] === 'grown') ? named.lvl : 0 }); }
    if (!C[key]) {
      var hd = DS.DATA.heroes && DS.DATA.heroes[key];
      if (hd && typeof hd === 'object' && hd.cls) return { hero: key, cls: hd.cls, lvl: Math.max(1, Math.min(12, +bits[1] || lvl || hd.level)), name: hd.name, named: true, guest: !!hd.guest, look: (D.save.LOOK[key] || {}).sheet || key + '_p0' };
      return null;
    }
    var gen = { cls: key, lvl: L, race: bits[2] || 'human' };
    if (C[key].pact) gen.pact = C[key].pact; // (the generic warlock takes the Tome; a named one -- Amara -- names her own or none)
    return gen;
  }
  // the 8-bit game's heroes and guests by name (content/heroes.json): the four as the ladder dresses them at a level (js/save.js SV.fixture: the
  // reward weapons, Barley's splint, Aurdin's morning Mage Armor; drawn back to 1 below their starts), a guest as the 8-bit game makes it
  // (R.makeHero at its register's level or higher: Brann, Hedda, Halldor, the trooper, Dace; Pyro at his 12, who fights his own way --
  // js/pyro.js -- so the class AI runs him on the party's side too). Ingrith is NPC.NAMED's (a cleric by her register)
  NPC.HEROES = ['barley', 'aurdin', 'vivian', 'lymen'];
  NPC.heroSheet = function (sp) {
    var id = sp.hero, d = DS.DATA.heroes[id], L = Math.max(1, Math.min(12, sp.lvl || d.level)), h;
    // (sp.morning: the Pocket DM's long rest chose the day -- js/pocket.js THE LONG REST, 10-17: built bare, nothing cast by itself, then its day's spells, what it
    // cast ahead and spent, Aid's +5, as NPC.sheet lays a class card's)
    if (NPC.HEROES.indexOf(id) >= 0) h = D.save.fixture(Math.min(9, L), sp.morning ? { bare: true } : undefined).party.filter(function (x) { return x.id === id; })[0];
    else {
      h = R.makeHero(id, Math.max(d.level, L));
      h.attacks = d.attacks; if (d.resist) h.resist = d.resist.slice(); h.guest = true; h.key = id;
      if (d.script) h.script = d.script; if (d.surgeAI) h.surgeAI = true;
    }
    // (the player's own picks a level gave, from the card -- js/rules.js R.repick against what the build took; the day's spells refilled: 10-14)
    if (sp.picks && R.repick) { R.repick(h, sp.picks); if (h.prepared && R.prepCount(h)) h.prepared = R.prepFill(h, D.save.spell); }
    if (sp.loot) NPC.wear(h, sp.loot);
    if (sp.morning) {
      if (sp.prepared && h.prepared && R.prepCount(h)) { var pool = R.prepPool(h, D.save.spell); h.prepared = sp.prepared.filter(function (x) { return pool.indexOf(x) >= 0; }).slice(0, R.prepCount(h)); }
      if (sp.conds) Object.keys(sp.conds).forEach(function (k) { h.conds[k] = sp.conds[k]; });
      (sp.spend || []).forEach(function (lv) { for (var i = lv - 1; i < (h.slots || []).length; i++) if (h.slots[i] > 0) { h.slots[i]--; break; } });
      if (sp.aid) { h.maxhp += sp.aid; h.hp = h.maxhp; h.conds.aid = sp.aid; }
    }
    NPC.carry(h, sp);
    return h;
  };
  NPC.heroUnit = function (sp, side, o) {
    o = o || {};
    var h = NPC.heroSheet(sp), guest = NPC.HEROES.indexOf(sp.hero) < 0;
    var u = D.save.unitOf(h, guest, null);
    u.id = o.id || sp.hero; u.side = side || 'party'; u.named = true; u.hero = sp.hero;
    if (guest) NPC.overlay(u, h);
    // the player's to run, every one -- but the king: his turn is his own (js/pyro.js), at full on the Pocket DM
    if (h.script) { u.guest = true; u.classAI = true; } else { u.guest = false; u.classAI = false; }
    if (sp.guestAI) { u.guest = true; u.classAI = true; } // (a watch, or the bench)
    if (u.side === 'foe') { u.guest = false; u.classAI = true; u.facing = 1; }
    return u;
  };
  // a character of the player's own, the whole sheet in one URL-safe word (the Pocket DM's maker, 10-02):
  //   ~<class>.<level>.<race>.<STR-DEX-CON-INT-WIS-CHA>.<weapon_armour_shield_second_ring_cloak>.<Name_With_Underscores>.<spell-spell-...>
  // The scores are the level-1 numbers as typed, race included; the ASIs come with the level (spec.asis). A max hit die a level, as the
  // heroes (RULED 09-25). An empty gear slot is nothing there; a blank spells field is the class's own list
  NPC.ABIL = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  // (10-06: the worn places beyond these six are appended -- js/rules.js R.PLACES: the second ring, the feet, the neck -- so a code made before them still decodes: a short code has nothing there)
  NPC.GEAR = ['weapon', 'armor', 'shield', 'alt', 'ring', 'cloak', 'ring2', 'feet', 'neck'];
  NPC.decode = function (code) {
    var parts = String(code).split('+'), picks = R.picksParse ? R.picksParse(parts.slice(1)) : null; code = parts[0]; // (a made one's level picks ride after its word: 10-14)
    var f = String(code).slice(1).split('.'), cls = (f[0] || '').toLowerCase();
    if (!C[cls]) return null;
    var lvl = Math.max(1, Math.min(NPC.maxLvl(cls), +f[1] || 1)), race = NPC.RACES[(f[2] || '').toLowerCase()] ? (f[2] || '').toLowerCase() : 'human';
    var nums = (f[3] || '').split('-').map(Number), abil = null;
    if (nums.length === 6 && nums.every(function (n) { return n >= 1 && n <= 30; })) { abil = {}; NPC.ABIL.forEach(function (k, i) { abil[k] = nums[i]; }); }
    var gear = (f[4] || '').split('_'), equip = {}, alt = null;
    NPC.GEAR.forEach(function (k, i) { var id = gear[i] || ''; if (!id || !DS.DATA.items[id]) { if (k !== 'alt') equip[k] = null; return; } if (k === 'alt') alt = id; else equip[k] = id; }); var offG = gear[NPC.GEAR.length]; if (offG && DS.DATA.items[offG]) equip.offhand = offG; // (the OFFHAND's weapon, a tenth field only when there is one: every word made before reads as it did -- 10-15)
    var name = (f[5] || '').replace(/_/g, ' ').trim() || (R.CLASSES[cls].name + ' ' + lvl);
    var known = f[6] ? f[6].split('-').filter(function (id) { return !!(DS.DATA.spells[id] || (D.EXTRA_SPELLS || {})[id]); }) : null;
    var sp = { cls: cls, lvl: lvl, race: race, name: name, named: true, custom: true, maxhp: true, asis: !!abil, equip: equip, alt: alt, code: code };
    if (abil) sp.abil = abil;
    if (known) sp.known = known;
    if (C[cls].pact) sp.pact = C[cls].pact;
    if (f[7] && (R.STYLE_FOR[cls] || []).indexOf(f[7]) >= 0) sp.style = f[7]; // (the fighting style picked, 10-06: a word made before it has none, and fights by the class's)
    var so = f[8] && R.subOpt && R.subOpt(cls, f[8]); // (the subclass picked, 10-14 -- js/rules.js R.SUBCLASSES: a word made before it has none, and is the SRD's)
    if (so && lvl >= R.SUBCLASSES[cls].at) sp.subclass = so.name;
    if (f[9]) NPC.optRead(cls, f[9], lvl, sp); // (the class options picked: metamagic, invocations, the pact, the land -- 10-14)
    if (picks) sp.picks = picks;
    return sp;
  };
  NPC.code = function (sp) {
    var ab = sp.abil ? NPC.ABIL.map(function (k) { return sp.abil[k]; }).join('-') : '';
    var eq = sp.equip || {}, gear = NPC.GEAR.map(function (k) { return k === 'alt' ? (sp.alt || '') : (eq[k] || ''); }).join('_') + (eq.offhand ? '_' + eq.offhand : '');
    var name = String(sp.name || '').replace(/[^A-Za-z0-9 \-']/g, '').replace(/'/g, '').trim().replace(/ +/g, '_');
    var so = sp.subclass && R.subOpt ? R.subOpt(sp.cls, sp.subclass) : null;
    return '~' + [sp.cls, sp.lvl, sp.race || 'human', ab, gear, name, (sp.known || []).join('-'), sp.style || '', so && !so.srd ? so.id : '', NPC.optWord(sp.cls, sp)].join('.').replace(/\.+$/, '')
      + (sp.picks && R.picksWord ? R.picksWord(sp.picks).map(function (p) { return '+' + p; }).join('') : ''); // (its level picks, after the word: 10-14)
  };
  // the class floor from a URL: ?npc=cleric,wizard&lvl=5 -- those against the four at that level; &vs=fighter,rogue -- a band instead
  // of the four (yours to run); an entry like higertha or druid:3:dwarf names one (NPC.spec); &watch -- your side run by the class
  // AI too, and you watch (09-28h: the class NPCs handoff's "a small, welcome addition")
  // the class floor from its door records its fights (10-06, Griz: "yes" -- every row he clicks through on situations.html lands in R's file): not &watch (no hands
  // to read), not a bench (which calls D.npcFight itself and never asks)
  D.npcRecord = function (q) {
    if (/[?&]watch\b/.test(q)) return {};
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var L = Math.max(1, Math.min(12, +(get('lvl') || get('level')) || 5)), vs = get('vs');
    return { record: { fight: 'npc', name: 'The class floor: ' + (get('npc') || 'fighter').split(',').join(', ') + ' against ' + (vs ? vs.split(',').join(', ') : 'our four') + (get('map') ? ' on ' + get('map') : ''), level: L } };
  };
  D.npcFight = function (q, o) {
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var L = Math.max(1, Math.min(12, +(get('lvl') || get('level')) || 5)), foes = (get('npc') || 'fighter').split(',').filter(Boolean), vs = get('vs');
    var what = foes.map(function (w) { var s = NPC.spec(w, L); return s ? (s.name || R.CLASSES[s.cls].name) : w; }).join(', ');
    // a testing room's knobs (10-01, Griz: "set me up a room full of wizards with the different familiars"): &fam=owl,bat,... a familiar to
    // each of the vs= band in order (js/rules.js R.FAMILIARS: owl, snowyowl, bat, rat, spider, frog, snake); &map= another grid map than the
    // Hex floor (data/maps.js, data/cavern.js); &dark the dark on it (torchdark, and the eyes under the mouse: js/light.js L.viewMap)
    var vsl = vs ? vs.split(',').filter(Boolean) : [], fams = (get('fam') || '').split(',').filter(Boolean);
    var familiars = fams.map(function (k, i) { return vsl[i] && R.FAMILIARS[k] ? { kind: k, by: 'p' + i + '-' + vsl[i].split(':')[0] } : null; }).filter(Boolean);
    var map = get('map'), dark = /[?&]dark\b/.test(q) ? true : null;
    // a test's setting (10-14, the campfire's door): &items=oil:3,torch:1 those stacks in the pack at that many; &foeat=x,y;x,y the foes on those squares, in order;
    // &partyat=x,y the first hero there -- so a thing to be tried stands where the trying is (the troll beside the camp's fire, in its light)
    var pairs = function (s) { return (s || '').split(';').map(function (p) { var a = p.split(',').map(Number); return a.length === 2 && isFinite(a[0]) && isFinite(a[1]) ? a : null; }).filter(Boolean); };
    var itemsTest = (get('items') || '').split(',').filter(Boolean).map(function (s) { var a = s.split(':'); return [a[0], Math.max(0, +a[1] || 1)]; });
    if (get('seed')) D.seed = +get('seed') | 0; // (&seed=<n>: a bench fight of that seed, roll for roll, with &watch -- dev/bench16.js mode=mascots names its seeds; 10-07)
    return new D.Battle(Object.assign({ npc: { foes: foes, party: vsl.length ? vsl : null }, watch: /[?&]watch\b/.test(q), flyTest: /[?&]fly\b/.test(q), legendTest: /[?&]legend\b/.test(q), breathTest: get('breath'), mineTest: /[?&]mine\b/.test(q), gazeTest: /[?&]gaze\b/.test(q), shakenTest: /[?&]shaken\b/.test(q), spellsTest: get('spells'), familiars: familiars, itemsTest: itemsTest, foeAt: pairs(get('foeat')), partyAt: pairs(get('partyat'))[0] || null, fightDef: D.classFight(L, { what: what, map: map && D.MAPS[map] ? map : null, dark: dark, defend: /[?&]defend\b/.test(q), doors: /[?&]doors\b/.test(q) }) }, o || {}));
  };
  NPC.build = function (word, lvl, side, o) {
    // (a word, a spec, or { word, hpLeft, slotsLeft, featsLeft, ... }: the Pocket DM's carry between rungs rides on the word's spec)
    var sp = typeof word === 'string' ? NPC.spec(word, lvl) : word && word.word ? Object.assign({}, NPC.spec(word.word, lvl) || {}, word) : word;
    if (!sp || (!sp.cls && !sp.hero)) return null;
    if (sp.hero) return NPC.heroUnit(sp, side, o);
    var h = NPC.sheet(sp);
    var u = NPC.unit(h, side || 'foe', Object.assign({ named: sp.named, sheet: sp.look || null }, o || {})); // (a named one's own figure: Talmok's)
    if (h.script && u.side === 'party') { u.guest = true; u.classAI = true; } // (the king on the party's side fights his own way -- js/pyro.js; the Pocket DM, 10-02)
    return u;
  };
})();
