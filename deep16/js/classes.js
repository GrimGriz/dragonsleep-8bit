/* DEEP16 — the class NPCs (handoff-2026-09-28-npc-classes-to-six.md; Griz 09-28: "build NPC of each class out to level 6 and
   combat test them"). A sheet for any of the twelve SRD 5.1 classes at levels 1-9, built by the SRD's own tables and by
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
  // one, or the melee one for a bow). sub: the SRD's one subclass and the level it comes. cantrips / known by class level (1-9).
  // spells: what the NPC knows or prepares at each level it reaches (the test vehicle's list: chosen to put every built spell
  // of its class through a fight); `always`: the domain's or the oath's, prepared and uncounted
  var C = NPC.CLASSES = {
    barbarian: { prio: ['str', 'con', 'dex', 'wis', 'cha', 'int'], kit: { weapon: 'greataxe', alt: 'handaxe' }, sub: [3, 'Path of the Berserker'], look: 'npcbarbarian_p0' },
    bard: { prio: ['cha', 'dex', 'con', 'wis', 'int', 'str'], kit: { weapon: 'rapier', armor: 'leather', alt: 'dagger' }, sub: [3, 'College of Lore'], look: 'npcbard_p0',
      cantrips: [2, 2, 2, 3, 3, 3, 3, 3, 3], known: [4, 5, 6, 7, 8, 9, 10, 11, 12],
      spells: { 0: ['viciousmockery', 'dancinglights', 'light'], 1: ['healingword', 'hideouslaughter', 'faeriefire', 'thunderwave', 'bane', 'curewounds'], 2: ['heatmetal', 'shatter', 'blindnessdeafness', 'enhanceability'], 3: ['hypnoticpattern', 'fear', 'slow'], 4: ['confusion', 'dimensiondoor', 'freedomofmovement', 'greaterinvisibility'], 5: ['masscurewounds', 'greaterrestoration', 'holdmonster'], magicalSecrets: ['fireball', 'haste'] } },
    cleric: { prio: ['wis', 'con', 'str', 'cha', 'dex', 'int'], kit: { weapon: 'mace', armor: 'chainmail', shield: 'shield', alt: 'lightcrossbow' }, sub: [1, 'Life Domain'], look: 'npccleric_p0',
      cantrips: [3, 3, 3, 4, 4, 4, 4, 4, 4], prepares: 'wis',
      always: { 1: ['bless', 'curewounds'], 3: ['lesserrestoration', 'spiritualweapon'], 5: ['beaconofhope', 'revivify'], 7: ['deathward', 'guardianoffaith'], 9: ['masscurewounds'] },
      spells: { 0: ['sacredflame', 'guidance', 'light', 'resistance'], 1: ['guidingbolt', 'healingword', 'shieldoffaith', 'sanctuary', 'command', 'bane', 'inflictwounds'], 2: ['holdperson', 'aid', 'blindnessdeafness', 'wardingbond'], 3: ['spiritguardians', 'masshealingword', 'dispelmagic', 'bestowcurse', 'daylight'], 4: ['guardianoffaith', 'banishment', 'freedomofmovement', 'deathward'], 5: ['flamestrike', 'masscurewounds', 'insectplague', 'greaterrestoration', 'dispelevilandgood', 'contagion'] } },
    druid: { prio: ['wis', 'con', 'dex', 'int', 'cha', 'str'], kit: { weapon: 'scimitar', armor: 'leather', shield: 'shield' }, sub: [2, 'Circle of the Land'], look: 'npcdruid_p0',
      cantrips: [2, 2, 2, 3, 3, 3, 3, 3, 3], prepares: 'wis', landCantrip: 'poisonspray',
      spells: { 0: ['produceflame', 'shillelagh', 'guidance', 'resistance'], 1: ['entangle', 'faeriefire', 'healingword', 'curewounds', 'fogcloud', 'thunderwave'], 2: ['barkskin', 'flameblade', 'heatmetal', 'spikegrowth', 'gustofwind', 'enhanceability'], 3: ['calllightning', 'dispelmagic', 'protectionfromenergy', 'sleetstorm', 'daylight'], 4: ['blight', 'confusion', 'icestorm', 'freedomofmovement'], 5: ['insectplague', 'masscurewounds', 'greaterrestoration', 'contagion'] } },
    fighter: { prio: ['str', 'con', 'dex', 'wis', 'cha', 'int'], kit: { weapon: 'greatsword', armor: 'chainmail', alt: 'handaxe' }, style: 'gwf', sub: [3, 'Champion'], look: 'npcfighter_p0', asiAt: [4, 6, 8] },
    monk: { prio: ['dex', 'wis', 'con', 'str', 'int', 'cha'], kit: { weapon: 'shortsword', alt: 'dagger' }, sub: [3, 'Way of the Open Hand'], look: 'npcmonk_p0' },
    paladin: { prio: ['str', 'cha', 'con', 'wis', 'dex', 'int'], kit: { weapon: 'longsword', armor: 'chainmail', shield: 'shield', alt: 'handaxe' }, style: 'defense', sub: [3, 'Oath of Devotion'], look: 'npcpaladin_p0', prepares: 'cha', half: true,
      always: { 3: ['protectionfromevilandgood', 'sanctuary'], 5: ['lesserrestoration'] },
      spells: { 1: ['bless', 'command', 'shieldoffaith', 'divinefavor', 'heroism', 'curewounds'], 2: ['brandingsmite', 'magicweapon', 'aid'] } },
    ranger: { prio: ['dex', 'wis', 'con', 'str', 'int', 'cha'], kit: { weapon: 'longbow', armor: 'scalemail', alt: 'shortsword' }, style: 'archery', sub: [3, 'Hunter'], look: 'npcranger_p0',
      known: [0, 2, 3, 3, 4, 4, 5, 5, 6], spells: { 1: ['huntersmark', 'curewounds', 'fogcloud', 'longstrider'], 2: ['spikegrowth', 'passwithouttrace', 'barkskin'] } },
    rogue: { prio: ['dex', 'con', 'wis', 'int', 'cha', 'str'], kit: { weapon: 'rapier', armor: 'leather', alt: 'shortbow' }, sub: [3, 'Thief'], look: 'npcrogue_p0', expertise: ['Stealth', 'Perception'] },
    sorcerer: { prio: ['cha', 'con', 'dex', 'wis', 'int', 'str'], kit: { weapon: 'lightcrossbow', alt: 'dagger' }, sub: [1, 'Draconic Bloodline'], look: 'npcsorcerer_p0', ancestry: 'fire',
      cantrips: [4, 4, 4, 5, 5, 5, 5, 5, 5], known: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      spells: { 0: ['firebolt', 'rayofrost', 'shockinggrasp', 'poisonspray', 'chilltouch'], 1: ['magicmissile', 'shield', 'burninghands', 'colorspray'], 2: ['scorchingray', 'mistystep', 'mirrorimage'], 3: ['fireball', 'haste'], 4: ['icestorm', 'greaterinvisibility', 'dimensiondoor', 'blight', 'banishment'], 5: ['coneofcold', 'insectplague', 'holdmonster'] } },
    warlock: { prio: ['cha', 'con', 'dex', 'wis', 'int', 'str'], kit: { weapon: 'lightcrossbow', armor: 'leather', alt: 'dagger' }, sub: [1, 'The Fiend'], look: 'npcwarlock_p0',
      cantrips: [2, 2, 2, 3, 3, 3, 3, 3, 3], known: [2, 3, 4, 5, 6, 7, 8, 9, 10], invocations: { 2: ['agonizing', 'devilsight'], 5: ['agonizing', 'devilsight', 'repelling'] },
      spells: { 0: ['eldritchblast', 'chilltouch', 'poisonspray'], 1: ['hellishrebuke', 'command', 'burninghands', 'expeditiousretreat'], 2: ['scorchingray', 'darkness', 'mirrorimage', 'holdperson'], 3: ['fireball', 'fear', 'vampirictouch'], 4: ['blight', 'fireshield', 'dimensiondoor', 'banishment'], 5: ['flamestrike', 'holdmonster'] } },
    wizard: { prio: ['int', 'con', 'dex', 'wis', 'cha', 'str'], kit: { weapon: 'quarterstaff', armor: 'robes' }, sub: [2, 'School of Evocation'], look: 'npcwizard_p0',
      cantrips: [3, 3, 3, 4, 4, 4, 4, 4, 4], prepares: 'int',
      spells: { 0: ['firebolt', 'rayofrost', 'shockinggrasp', 'chilltouch', 'light'], 1: ['magicmissile', 'shield', 'mageArmor', 'burninghands', 'sleep', 'colorspray', 'grease', 'hideouslaughter', 'falselife'], 2: ['scorchingray', 'mistystep', 'holdperson', 'web', 'shatter', 'mirrorimage', 'acidarrow', 'blur'], 3: ['fireball', 'lightningbolt', 'haste', 'slow', 'hypnoticpattern', 'fear', 'vampirictouch'], 4: ['icestorm', 'blacktentacles', 'phantasmalkiller', 'greaterinvisibility', 'dimensiondoor', 'fireshield', 'banishment', 'confusion', 'resilientsphere', 'stoneskin', 'blight'], 5: ['coneofcold', 'holdmonster', 'mislead'] } }
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
  NPC.SUBS = {
    'the Window': { always: { 1: ['disguiseself', 'silentimage'], 3: ['blur', 'passwithouttrace'], 5: ['hypnoticpattern', 'clairvoyance'] }, uses: 'handOnNeck' },
    'the Vigil': { always: { 1: ['sanctuary', 'protectionfromevilandgood'], 3: ['holdperson', 'wardingbond'], 5: ['spiritguardians', 'glyphofwarding'] }, uses: 'keepersWard' }
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
      equip: { weapon: 'mace', armor: 'chainshirt' }, noPrecast: true,
      known: ['sacredflame', 'light', 'curewounds', 'guidingbolt', 'sanctuary', 'lesserrestoration', 'spiritualweapon', 'holdperson', 'dispelmagic', 'spiritguardians'],
      guardianText: 'calls on the Dormant, and spirits wheel out from him, cold as a vault' },
    // Amara, warlock 5 of the Mirror (npcs-by-location.md §The Road, RE-RULED 08-29): the register's list with the ear file's fold
    // (Mirror's Gaze for Hex, Minor Illusion for Friends; the asking is Command, RULED 09-28); Agonizing Blast; Fiendish Vigor (False
    // Life at will: she walks in with it); the Mirror's eye. Charm Person and Suggestion wait on charm (LATER). Her known spells are
    // the SRD's six at the 5th (TRIMMED 09-28g, Griz: "Trim"): Command in, Gaseous Form (OUT in the game already) off her list
    amara: { cls: 'warlock', lvl: 5, race: 'human', patron: 'mirror', abil: { str: 9, dex: 14, con: 12, int: 12, wis: 11, cha: 17 },
      equip: { weapon: 'dagger', armor: 'leather' },
      known: ['eldritchblast', 'minorillusion', 'mirrorsgaze', 'command', 'darkness', 'fear', 'charmperson', 'suggestion'],
      invocations: ['agonizing', 'fiendishvigor'] },
    // Willem Glass, wizard 5 of illusion (npcs-by-location.md §The Road): Ray of Frost (RULED 09-28), Blur for Phantasmal Force (the ear
    // file, dist-4); the illusion school is the PHB's: his tradition is our own, the Rimeglass (09-28g, the seat's on Griz's "Sufficiently
    // distinct"; invented.json #the-rimeglass). The 8-bit sheet's AC 12: no Mage Armor up
    willem: { name: 'Willem', named: true, cls: 'wizard', lvl: 5, race: 'human', subclass: 'the Rimeglass', abil: { str: 9, dex: 14, con: 12, int: 17, wis: 12, cha: 11 },
      equip: { weapon: 'quarterstaff', armor: null }, noPrecast: true,
      known: ['rayoffrost', 'minorillusion', 'mageArmor', 'shield', 'mirrorimage', 'invisibility', 'blur', 'hypnoticpattern'] },
    // Talmok, barbarian 3, Bloodsnout's champion at the Hex (the-hex.md, RULED 09-01): the register's block (npcs-by-location.md §TALMOK:
    // pit fists, rages on first blood, wrestles to the sand) and its Totem Warrior (Bear), the PHB's -- his path is our own, the Path of
    // the Sand (09-28g; invented.json #path-of-the-sand), and its 3rd-level features are what his block already did. The register gives
    // no race: human, the generator's. The ladder's card keeps his bestiary sheet (data/foes.js talmok); this is the Pocket DM's
    talmok: { name: 'Talmok', cls: 'barbarian', lvl: 3, race: 'human', subclass: 'Path of the Sand', named: true, look: 'talmok_p1',
      abil: { str: 16, dex: 14, con: 16, int: 9, wis: 13, cha: 11 }, equip: { weapon: 'unarmed', armor: null }, alt: null, hp: 35 }, // (no handaxes to throw: the pit fists)
    // Katarina, the mender (serial-castegut/BIBLE.md: a cleric of Tronupholen, the Fey in the Mirror, CANON 08-06). RULED 09-28g (Griz):
    // "Kat supposed to be Cleric of trickster deity trapped in mirror" -- her domain is our own, the Window (invented.json #the-window).
    // Her level is unruled in the register (cleric 2 or 3, BIBLE 08-27), so she stands at any, as Higertha does; human, generic numbers
    katarina: { name: 'Katarina', cls: 'cleric', race: 'human', subclass: 'the Window', named: true,
      equip: { weapon: 'mace', armor: 'leather', shield: 'shield' } },
    // Ingrith Scalebeam, cleric 4 (deepholm-and-the-edifice.md, CANON 09-26b). RULED 09-28g (Griz: "Yes, she's meant to be Cleric"):
    // her 8-bit sheet is a cleric's now (content/heroes.json: the d8's average HP, slots 4/3, the drafted list and the Life Domain's
    // Spiritual Weapon), so the grid reads her as it reads the heroes; the overlay stays only for a sheet still a fighter's
    ingrith: { overlay: true, cls: 'cleric', lvl: 4, slots: [4, 3], subclass: 'Life Domain', race: 'dwarf', abil: { str: 12, dex: 10, con: 14, int: 13, wis: 16, cha: 13 },
      equip: { weapon: 'mace', armor: 'chainmail', shield: 'shield' }, hp: 31,
      known: ['sacredflame', 'guidance', 'curewounds', 'healingword', 'bless', 'shieldoffaith', 'aid', 'lesserrestoration', 'spiritualweapon'] }
  };

  // spells known or prepared at a level: the class's list to the highest slot it has, as many as it may know (or prepare),
  // each level's first; always-prepared ones on top
  function spellsFor(c, cls, lvl, abil, sub) {
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
    var always = [];
    Object.keys(c.always || {}).forEach(function (k) { if (lvl >= +k) always = always.concat(c.always[k]); });
    out = cantrips.concat(always, take);
    return out.filter(function (id, i) { return out.indexOf(id) === i; });
  }

  // ------------------------------------------------------------------ the sheet (the 8-bit game's shape: js/rules.js reads it)
  // spec: { cls, lvl, race, name, named, spells (a list over the class's), maxhp (true: a max hit die a level), land, patron }
  NPC.sheet = function (spec) {
    var cls = spec.cls, c = C[cls], RC = R.CLASSES[cls], lvl = Math.max(1, Math.min(9, spec.lvl || 1));
    if (!c || !RC) throw new Error('DEEP16: no class ' + cls);
    var race = NPC.RACES[spec.race || 'human'] || NPC.RACES.human;
    var abil = {};
    c.prio.forEach(function (k, i) { abil[k] = ARRAY[i]; });
    Object.keys(race.abil).forEach(function (k) { abil[k] += race.abil[k]; });
    if (spec.abil) abil = JSON.parse(JSON.stringify(spec.abil)); // (a named one's register numbers, as they stand)
    // Ability Score Improvements (4, 8; the fighter's 6 too): +2 to the first ability not yet at 20, split over the next if need be
    (spec.abil ? [] : c.asiAt || [4, 8]).forEach(function (at) {
      if (lvl < at) return;
      var left = 2;
      c.prio.forEach(function (k) { var room = 20 - abil[k], g = Math.min(room, left); if (g > 0) { abil[k] += g; left -= g; } });
    });
    var con = DS.mod(abil.con), hd = RC.hd;
    var hp = spec.maxhp ? lvl * Math.max(1, hd + con) : hd + con + (lvl - 1) * (hd / 2 + 1 + con);
    hp += (race.hpLevel || 0) * lvl;
    var sub = c.sub && lvl >= c.sub[0] ? c.sub[1] : null;
    if ('subclass' in spec) sub = spec.subclass;
    if (cls === 'warlock' && spec.patron === 'mirror') sub = 'The Mirror';
    if (sub === 'Draconic Bloodline') hp += lvl; // Draconic Resilience: +1 HP a level
    if (spec.hp) hp = spec.hp; // (a named one's sheet: its register's number)
    var h = {
      id: spec.id || ('npc-' + cls + lvl), name: spec.name || (RC.name + ' ' + lvl), cls: cls, lvl: lvl, xp: R.XP_LEVEL[lvl],
      base: JSON.parse(JSON.stringify(abil)), abil: abil, maxhp: hp, hp: hp,
      equip: Object.assign({ weapon: c.kit.weapon, armor: c.kit.armor || null, shield: c.kit.shield || null, ring: null, cloak: null }, spec.equip || {}),
      known: [], feats: {}, conds: {}, subclass: sub, saveProf: RC.saves.slice(), style: c.style || null,
      skills: {}, expertise: [], race: spec.race || 'human', npc: true, alt: 'alt' in spec ? spec.alt : (c.kit.alt || null), land: spec.land || null
    };
    // skills the grid reads (Stealth, Perception): written at the level-1 proficiency, as the 8-bit sheets are (R.skill grows them)
    if (/rogue|ranger|monk|bard/.test(cls)) h.skills.Stealth = DS.mod(abil.dex) + 2;
    if (/rogue|ranger|druid|barbarian|cleric/.test(cls)) h.skills.Perception = DS.mod(abil.wis) + 2;
    if (cls === 'rogue') h.expertise = (c.expertise || []).slice(); // (Expertise at 1: both twice over)
    R.refresh(h, true);
    if (!(race.relentless)) delete h.feats.relentless; // (R.refresh gives every paladin Lymen's half-orc Relentless)
    else h.feats.relentless = 1;
    // the spells: the class's list (or the spec's), cut to what the level knows or prepares
    if (RC.caster) {
      var cc = c;
      if (spec.spells) cc = Object.assign({}, c, { spells: spec.spells });
      if (sub === 'The Mirror') { cc = Object.assign({}, cc, { spells: JSON.parse(JSON.stringify(cc.spells)) }); Object.keys(NPC.MIRROR).forEach(function (k) { if (lvl >= +k) NPC.MIRROR[k].forEach(function (id) { var L = +k >= 5 ? 3 : +k >= 3 ? 2 : 1; cc.spells[L] = [id].concat((cc.spells[L] || []).filter(function (x) { return x !== id; })); }); }); }
      if (NPC.SUBS[sub] && NPC.SUBS[sub].always) cc = Object.assign({}, cc, { always: NPC.SUBS[sub].always }); // (our own domains' lists, in the Life Domain's place)
      // a named one's own list, with its domain's always-prepared spells on top (09-28g: Torvald's Vigil)
      h.known = spec.known ? spec.known.concat(subAlways(sub, lvl)).filter(function (id, i, a) { return a.indexOf(id) === i; }) : spellsFor(cc, cls, lvl, abil, sub);
    }
    // our own subclasses' per-rest uses (js/features.js): the Window's Hand on the Neck, the Vigil's Keeper's Ward -- WIS a long rest
    if (NPC.SUBS[sub] && NPC.SUBS[sub].uses) h.feats[NPC.SUBS[sub].uses] = Math.max(1, DS.mod(abil.wis));
    if (cls === 'warlock') {
      var inv = []; Object.keys(c.invocations || {}).forEach(function (k) { if (lvl >= +k) inv = c.invocations[k].slice(); }); h.invocations = spec.invocations ? spec.invocations.slice() : inv;
      if (sub === 'The Mirror') h.mirrorEye = true; // (RULED 09-28: the pact of the Mirror's class feature)
    }
    if (spec.guardianText) h.guardianText = spec.guardianText;
    // a caster who wears no armour walks in under Mage Armor, cast that morning and paid for (the fixture's Aurdin: save.js)
    if (!spec.noPrecast && h.known.indexOf('mageArmor') >= 0 && !R.armored(h) && h.slots && h.slots[0] > 0) { h.conds.mageArmor = 1; h.slots[0]--; }
    h.hp = h.maxhp;
    return h;
  };

  // ------------------------------------------------------------------ the unit (on either side): the heroes' shape (save.js unitOf), and the rest
  NPC.unit = function (h, side, o) {
    o = o || {};
    var c = C[h.cls], race = NPC.RACES[h.race] || NPC.RACES.human;
    var u = D.save.unitOf(h, side !== 'party', null);
    u.kind = 'npc' + h.cls; // (no bestiary kind: nothing keyed to a kind -- the wheelwright's bolt, a fight's roster -- takes it for one)
    u.side = side || 'foe'; u.guest = false; u.npc = true; u.classAI = true; // (on the party's side it is the player's to run, unless the bench runs it)
    u.id = o.id || h.id; u.name = h.name; u.named = !!o.named || !!h.named;
    u.sheet = o.sheet || c.look; u.race = h.race; u.type = 'humanoid';
    u.speed = (race.speed || 30) + (h.cls === 'monk' && h.lvl >= 2 ? (h.lvl >= 6 ? 15 : 10) : 0) + (h.cls === 'barbarian' && h.lvl >= 5 ? 10 : 0);
    u.darkvision = Math.max(race.dv || 0, u.darkvision || 0);
    if (h.invocations && h.invocations.indexOf('devilsight') >= 0) u.devilSight = true; // Devil's Sight: sees in any dark, the magical too, to 120 ft
    if (race.resist) u.resist = race.resist.slice();
    if (race.fey) u.fey = true; // (Fey Ancestry: no magic puts it to sleep)
    if (race.savage) u.savage = true;
    if (h.mirrorEye) u.mirrorEye = true;
    u.invocations = h.invocations || null;
    if (h.guardianText) u.guardianText = h.guardianText;
    // Fiendish Vigor (an invocation): False Life at will -- she walks in with it
    if ((u.invocations || []).indexOf('fiendishvigor') >= 0) u.temp = Math.max(u.temp || 0, D.roll('1d4+4').total);
    if (h.cls === 'barbarian' && h.lvl >= 2) u.conds.dangerSense = true;
    u.facing = 1;
    // a second weapon to draw (the class AI's): a bow for the swordsman, a sword for the bowman, handaxes to throw
    if (h.alt) { var h2 = Object.assign({}, h, { equip: Object.assign({}, h.equip, { weapon: h.alt, shield: DS.DATA.items[h.alt] && (DS.DATA.items[h.alt].weapon.props || []).indexOf('two-handed') >= 0 ? null : h.equip.shield }) }); u.alt = D.save.weaponOf(h2); if (NPC.THROWN[h.alt]) { u.alt.ranged = true; u.alt.thrown = true; u.alt.range = NPC.THROWN[h.alt]; } }
    return u;
  };
  // a named foe of the bestiary built by its class (data/foes.js `build`: Torvald, Amara, Willem): the class unit, and everything the
  // fight and the 8-bit seam read off the sheet kept -- its kind and its place in the 8-bit list, its art, its name, its register HP,
  // and the story's own ways (yields, flees, the traces, a Darkness thrown as she runs)
  NPC.fromFoe = function (B, f, d) {
    var spec = Object.assign({ id: f.id }, NPC.NAMED[d.build], { hp: d.hp, name: d.name });
    var u = NPC.unit(NPC.sheet(spec), 'foe', { id: f.id, sheet: d.sheet, named: d.named });
    u.kind = f.kind; u.i8 = f.i8; u.cr = d.cr; u.named = !!d.named;
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
  NPC.THROWN = { handaxe: [20, 60], dagger: [20, 60] };

  // a spec from a word: 'cleric', 'higertha', 'cleric:5', 'druid:3:dwarf'
  NPC.spec = function (word, lvl) {
    var bits = String(word).toLowerCase().split(':'), key = bits[0], L = +bits[1] || lvl || 1;
    var named = NPC.NAMED[key];
    if (named) return Object.assign({ id: key }, named, { lvl: named.lvl || L });
    if (!C[key]) return null;
    return { cls: key, lvl: L, race: bits[2] || 'human' };
  };
  // the class floor from a URL: ?npc=cleric,wizard&lvl=5 -- those against the four at that level; &vs=fighter,rogue -- a band instead
  // of the four (yours to run); an entry like higertha or druid:3:dwarf names one (NPC.spec)
  D.npcFight = function (q, o) {
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var L = Math.max(1, Math.min(9, +(get('lvl') || get('level')) || 5)), foes = (get('npc') || 'fighter').split(',').filter(Boolean), vs = get('vs');
    var what = foes.map(function (w) { var s = NPC.spec(w, L); return s ? (s.name || R.CLASSES[s.cls].name) : w; }).join(', ');
    return new D.Battle(Object.assign({ npc: { foes: foes, party: vs ? vs.split(',').filter(Boolean) : null }, fightDef: D.classFight(L, { what: what }) }, o || {}));
  };
  NPC.build = function (word, lvl, side, o) {
    var sp = typeof word === 'string' ? NPC.spec(word, lvl) : word;
    if (!sp) return null;
    var h = NPC.sheet(sp);
    return NPC.unit(h, side || 'foe', Object.assign({ named: sp.named, sheet: sp.look || null }, o || {})); // (a named one's own figure: Talmok's)
  };
})();
