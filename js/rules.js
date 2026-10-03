/* DRAGONSLEEP — 5E-flavoured, FF-simple rules. Mechanics from the SRD 5.1 (CC BY 4.0):
   ability modifiers, proficiency, class tables, spell slots, XP by CR. */
'use strict';
(function () {
  var DS = window.DS;
  var R = DS.R = {};
  R.ABIL = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  R.XP_LEVEL = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000]; // xp needed to BE level n (5E 2014; 10-12 for DEEP16's NPCs past the cap, 09-30)
  R.CAP = 9; // the dwarven expansion raises the cap 5 -> 9 (spec §9) ...
  R.cap = function () { return DS.G && DS.G.flags && DS.G.flags.lakeDone ? R.CAP : 5; }; // ... once the chuul is dead: the base game stays capped at 5
  R.CR_XP = { '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900, '9': 5000 };
  R.prof = function (lvl) { return lvl >= 9 ? 4 : lvl >= 5 ? 3 : 2; };
  // (10-12: the SRD 5.1's rows, for DEEP16's class NPCs past the heroes' cap -- the druid to twelve, Griz 09-29: "game probably gonna get to
  // the big boys at some point"; 09-30: "the above 9's we're just prepping in case we have combat involving special NPCs")
  var SLOTS_FULL = { 1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3], 7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2], 11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1] };
  var SLOTS_HALF = { 1: [], 2: [2], 3: [3], 4: [3], 5: [4, 2], 6: [4, 2], 7: [4, 3], 8: [4, 3], 9: [4, 3, 2], 10: [4, 3, 2], 11: [4, 3, 3], 12: [4, 3, 3] };

  R.CLASSES = {
    fighter: {
      name: 'Fighter', hd: 10, saves: ['str', 'con'], armor: ['light', 'medium', 'heavy', 'shield'], weapons: ['simple', 'martial'],
      primary: 'str', asi: { str: 2 }
    },
    wizard: {
      name: 'Wizard', hd: 6, saves: ['int', 'wis'], armor: ['robe'], weapons: ['dagger', 'dart', 'sling', 'quarterstaff', 'lightcrossbow'],
      caster: 'full', cast: 'int', primary: 'int', asi: { int: 1, con: 1 }
    },
    rogue: {
      name: 'Rogue', hd: 8, saves: ['dex', 'int'], armor: ['light'], weapons: ['simple', 'handcrossbow', 'longsword', 'rapier', 'shortsword'],
      primary: 'dex', asi: { dex: 2 }
    },
    paladin: {
      name: 'Paladin', hd: 10, saves: ['wis', 'cha'], armor: ['light', 'medium', 'heavy', 'shield'], weapons: ['simple', 'martial'],
      caster: 'half', cast: 'cha', primary: 'str', asi: { str: 1, cha: 1 }
    },
    // the other eight SRD 5.1 classes (09-28, the class NPCs: handoff-2026-09-28-npc-classes-to-six.md). No hero of the four
    // is one of these; DEEP16's class NPCs (deep16/js/classes.js) are built on the same numbers, and the 8-bit guests may be
    barbarian: {
      name: 'Barbarian', hd: 12, saves: ['str', 'con'], armor: ['light', 'medium', 'shield'], weapons: ['simple', 'martial'],
      primary: 'str', asi: { str: 2 }, unarmored: 'con'
    },
    bard: {
      name: 'Bard', hd: 8, saves: ['dex', 'cha'], armor: ['light'], weapons: ['simple', 'handcrossbow', 'longsword', 'rapier', 'shortsword'],
      caster: 'full', cast: 'cha', primary: 'cha', asi: { cha: 2 }
    },
    cleric: {
      name: 'Cleric', hd: 8, saves: ['wis', 'cha'], armor: ['light', 'medium', 'heavy', 'shield'], weapons: ['simple'], // (heavy: the Life domain's)
      caster: 'full', cast: 'wis', primary: 'wis', asi: { wis: 2 }
    },
    druid: {
      name: 'Druid', hd: 8, saves: ['int', 'wis'], armor: ['light', 'medium', 'shield'], weapons: ['club', 'dagger', 'dart', 'javelin', 'mace', 'quarterstaff', 'scimitar', 'sickle', 'sling', 'spear'],
      caster: 'full', cast: 'wis', primary: 'wis', asi: { wis: 2 }
    },
    monk: {
      name: 'Monk', hd: 8, saves: ['str', 'dex'], armor: [], weapons: ['simple', 'shortsword'],
      primary: 'dex', asi: { dex: 2 }, unarmored: 'wis'
    },
    ranger: {
      name: 'Ranger', hd: 10, saves: ['str', 'dex'], armor: ['light', 'medium', 'shield'], weapons: ['simple', 'martial'],
      caster: 'half', cast: 'wis', primary: 'dex', asi: { dex: 2 }
    },
    sorcerer: {
      name: 'Sorcerer', hd: 6, saves: ['con', 'cha'], armor: [], weapons: ['dagger', 'dart', 'sling', 'quarterstaff', 'lightcrossbow'],
      caster: 'full', cast: 'cha', primary: 'cha', asi: { cha: 2 }
    },
    warlock: {
      name: 'Warlock', hd: 8, saves: ['wis', 'cha'], armor: ['light'], weapons: ['simple'],
      caster: 'pact', cast: 'cha', primary: 'cha', asi: { cha: 2 }
    }
  };
  // the warlock's Pact Magic (SRD 5.1): few slots, all of one level, back on a short rest
  var SLOTS_PACT = { 1: [1], 2: [2], 3: [0, 2], 4: [0, 2], 5: [0, 0, 2], 6: [0, 0, 2], 7: [0, 0, 0, 2], 8: [0, 0, 0, 2], 9: [0, 0, 0, 0, 2], 10: [0, 0, 0, 0, 2], 11: [0, 0, 0, 0, 3], 12: [0, 0, 0, 0, 3] };
  R.slotsFor = function (h) {
    var c = R.CLASSES[h.cls];
    if (c.caster === 'full') return (SLOTS_FULL[h.lvl] || []).slice();
    if (c.caster === 'half') return (SLOTS_HALF[h.lvl] || []).slice();
    if (c.caster === 'pact') return (SLOTS_PACT[h.lvl] || []).slice();
    return [];
  };
  R.sneakDice = function (lvl) { return Math.ceil(lvl / 2) + 'd6'; };

  // ---------------------------------------------------------------- hero construction
  R.makeHero = function (id, level) {
    var d = DS.DATA.heroes[id];
    var h = {
      id: id, name: d.name, cls: d.cls, lvl: d.level, xp: R.XP_LEVEL[d.level], base: JSON.parse(JSON.stringify(d.abil)),
      abil: JSON.parse(JSON.stringify(d.abil)), maxhp: d.hp, hp: d.hp, equip: JSON.parse(JSON.stringify(d.equip)),
      known: (d.spells || []).slice(), feats: {}, conds: {}, ko: false, subclass: null, look: d.look, weapon: d.weaponArt,
      skills: d.skills || {}, saveProf: d.saveProf || R.CLASSES[d.cls].saves
    };
    h.subclass = d.subclassStart || null;
    R.refresh(h, true);
    while (level && h.lvl < level) { h.xp = R.XP_LEVEL[h.lvl + 1]; R.levelUp(h); }
    h.hp = h.maxhp;
    if (R.prepCount(h)) h.prepared = R.prepDefault(h); // a caster walks in with the build's day prepared
    return h;
  };
  // restore per-rest resources; long = long rest
  R.refresh = function (h, long) {
    var f = h.feats;
    if (h.cls === 'fighter') { f.secondWind = 1; f.actionSurge = 1; if (long) f.indomitable = h.lvl >= 9 ? 1 : 0; }
    if (h.cls === 'paladin') { f.channel = h.lvl >= 3 ? 1 : 0; if (long) { f.lay = 5 * h.lvl; f.relentless = 1; } }
    if (h.cls === 'wizard' && long) f.arcaneRecovery = 1;
    // the other eight classes' per-rest resources (SRD 5.1; 09-28, the class NPCs)
    if (h.cls === 'barbarian' && long) f.rage = h.lvl >= 17 ? 6 : h.lvl >= 12 ? 5 : h.lvl >= 6 ? 4 : h.lvl >= 3 ? 3 : 2;
    if (h.cls === 'bard' && (long || h.lvl >= 5)) f.inspiration = Math.max(1, DS.mod(h.abil.cha)); // (Font of Inspiration at 5: a short rest too)
    if (h.cls === 'cleric') f.channel = h.lvl >= 18 ? 3 : h.lvl >= 6 ? 2 : h.lvl >= 2 ? 1 : 0;
    if (h.cls === 'druid') f.wildShape = h.lvl >= 2 ? 2 : 0;
    if (h.cls === 'monk') { f.ki = h.lvl >= 2 ? h.lvl : 0; if (long) f.wholeness = h.lvl >= 6 ? 1 : 0; }
    if (h.cls === 'sorcerer' && long) f.sorcery = h.lvl >= 2 ? h.lvl : 0;
    if (h.cls === 'warlock') { h.slotsMax = R.slotsFor(h); h.slots = h.slotsMax.slice(); } // (Pact Magic comes back on a short rest)
    if (long) {
      h.slotsMax = R.slotsFor(h);
      h.slots = h.slotsMax.slice();
      var flame = h.conds && h.conds.continualFlame; // (a Continual Flame never goes out: it outlasts the night)
      h.hp = h.maxhp; h.ko = false; h.conds = {};
      if (flame) h.conds.continualFlame = flame;
      if (h.id === 'lymen') f.relentless = 1;
    }
    if (!h.slots) { h.slotsMax = R.slotsFor(h); h.slots = h.slotsMax.slice(); }
  };
  R.levelUp = function (h) {
    var msgs = [], c = R.CLASSES[h.cls];
    h.lvl++;
    var gain = c.hd + DS.mod(h.abil.con); // RULED 09-25 (Griz): a max hit die at every level
    gain = Math.max(1, gain);
    h.maxhp += gain; h.hp += gain;
    msgs.push(h.name + ' is now level ' + h.lvl + '! Max HP +' + gain + '.');
    var oldMax = h.slotsMax || [];
    h.slotsMax = R.slotsFor(h);
    h.slots = h.slots || [];
    for (var i = 0; i < h.slotsMax.length; i++) h.slots[i] = (h.slots[i] || 0) + (h.slotsMax[i] - (oldMax[i] || 0));
    var d = DS.DATA.heroes[h.id];
    var lu = (d.levels && d.levels[h.lvl]) || {};
    if (lu.expertise) { h.expertise = (h.expertise || []).concat(lu.expertise); msgs.push('Expertise: ' + lu.expertise.join(', ') + '.'); }
    if (lu.asi || h.lvl === 4) {
      var asi = lu.asi || c.asi, parts = [];
      Object.keys(asi).forEach(function (k) { h.abil[k] = Math.min(20, h.abil[k] + asi[k]); parts.push(k.toUpperCase() + ' +' + asi[k]); });
      msgs.push('Ability scores: ' + parts.join(', ') + '.');
      var want = h.lvl * Math.max(1, c.hd + DS.mod(h.abil.con)), base = h.maxhp - ((h.conds && h.conds.aid) || 0); // CON counts back to level 1
      if (base < want) { h.hp += want - base; h.maxhp += want - base; }
    }
    var nlearn = msgs.length;
    if (lu.learn) lu.learn.forEach(function (s) { if (h.known.indexOf(s) < 0) { h.known.push(s); msgs.push(h.name + ' learns ' + DS.DATA.spells[s].name + '.'); } });
    if (h.prepared && msgs.length > nlearn) msgs.push('New spells are prepared after a long rest.'); // (SRD: the day is chosen on waking)
    if (lu.subclass) { h.subclass = lu.subclass; msgs.push(h.name + ': ' + lu.subclass + '.'); }
    if (lu.choose) { h.pendingChoice = lu.choose; msgs.push(h.name + ' has a choice to make.'); }
    (lu.feats || []).forEach(function (t) { msgs.push(t); });
    if (h.cls === 'paladin') { h.feats.lay = (h.feats.lay || 0) + 5; if (h.lvl === 3) h.feats.channel = 1; }
    if (h.cls === 'rogue' && h.lvl % 2 === 1) msgs.push('Sneak Attack is now ' + R.sneakDice(h.lvl) + '.');
    if (h.lvl === 5 && (h.cls === 'fighter' || h.cls === 'paladin')) msgs.push('Extra Attack: two attacks with FIGHT.');
    if (h.lvl === 3 && h.cls === 'fighter') msgs.push('Champion: critical hits on 19 or 20.');
    if (h.lvl === 5 && h.cls === 'rogue') msgs.push('Uncanny Dodge: the first hit each round is halved.');
    if (h.cls === 'fighter' && h.lvl === 9) h.feats.indomitable = 1;
    return msgs;
  };
  R.gainXP = function (h, xp) {
    var msgs = [];
    var cap = R.cap();
    if (h.lvl >= cap) { h.xp = R.XP_LEVEL[cap]; return msgs; } // at the cap nothing banks (so the chuul isn't a jump to 9)
    h.xp += xp;
    while (h.lvl < cap && h.xp >= R.XP_LEVEL[h.lvl + 1]) msgs = msgs.concat(R.levelUp(h));
    if (h.lvl >= cap) h.xp = R.XP_LEVEL[cap];
    return msgs;
  };
  R.nextXP = function (h) { return h.lvl >= R.cap() ? null : R.XP_LEVEL[h.lvl + 1]; };
  // bring an older save's heroes up to the current rules (spells cut, choices added since)
  R.migrate = function (h) {
    if (h.lvl <= 5 && h.xp >= R.XP_LEVEL[6]) h.xp = R.XP_LEVEL[6] - 1; // XP banked under the old cap of 5: one step short of 6, no more
    h.known = (h.known || []).filter(function (id) { return !!DS.DATA.spells[id]; });
    // the day's spells (AMENDED 09-27): an older save's casters wake with the build's picks, as a new hero does
    if (h.prepared) h.prepared = h.prepared.filter(function (id) { return !!DS.DATA.spells[id]; });
    else if (R.prepCount(h)) h.prepared = R.prepDefault(h);
    // RULED 09-25: every level is a max hit die. An older save's heroes catch up (Aid's +5 set aside first).
    var c = R.CLASSES[h.cls], want = h.lvl * Math.max(1, c.hd + DS.mod(h.abil.con)), base = h.maxhp - ((h.conds && h.conds.aid) || 0);
    if (base < want) { h.maxhp += want - base; h.hp += want - base; }
    if (h.id === 'aurdin' && !h.equip.armor && DS.DATA.items.robes) h.equip.armor = 'robes'; // 09-25: robes for the armor slot
    if (h.id === 'aurdin' && DS.DATA.spells.findfamiliar && h.known.indexOf('findfamiliar') < 0) h.known.push('findfamiliar'); // 09-29: the ritual in his book
    // what his sheet says is due by his level, learned now (10-01c: Aurdin's book filled to the SRD's count -- "match SRD expectations when possible" --
    // an older save's Aurdin had fewer; nothing is taken away, a sheet's spell included)
    var dd = DS.DATA.heroes[h.id];
    if (dd && dd.levels && h.known && !h.guest) {
      var due = (dd.spells || []).slice(); for (var lv = 2; lv <= h.lvl; lv++) due = due.concat((dd.levels[lv] && dd.levels[lv].learn) || []);
      due.forEach(function (s) { if (DS.DATA.spells[s] && h.known.indexOf(s) < 0) h.known.push(s); });
    }
    var d = DS.DATA.heroes[h.id], arch = (d && d.archetypes) || [];
    if (arch.length && h.lvl >= 3 && !arch.some(function (a) { return a.name === h.subclass; })) { h.subclass = null; h.pendingChoice = 'archetype'; }
  };
  R.isArch = function (h, name) { return h.subclass === name; };

  // ---------------------------------------------------------------- derived numbers
  R.item = function (id) { return id ? DS.DATA.items[id] : null; };
  R.weaponOf = function (h) {
    var w = R.item(h.equip.weapon);
    return w || DS.DATA.items.unarmed;
  };
  R.ac = function (h) {
    var dex = DS.mod(h.abil.dex), ac = 10 + dex;
    var a = R.item(h.equip.armor);
    if (a && a.armor) {
      var dm = a.armor.dexMax;
      ac = a.armor.base + (dm == null ? dex : Math.min(dex, dm)) + (a.armor.bonus || 0);
      if (h.conds.mageArmor && a.armor.type === 'robe') ac = Math.max(ac, 13 + dex + (a.armor.bonus || 0)); // robes aren't armor to the spell
    } else if (h.conds.mageArmor) ac = 13 + dex;
    else {
      // Unarmored Defense (the barbarian 10 + DEX + CON, the monk 10 + DEX + WIS, no shield for the monk); Draconic Resilience 13 + DEX
      var uc = R.CLASSES[h.cls] && R.CLASSES[h.cls].unarmored;
      if (uc && !(h.cls === 'monk' && h.equip.shield)) ac = Math.max(ac, 10 + dex + DS.mod(h.abil[uc]));
      if (h.subclass === 'Draconic Bloodline') ac = Math.max(ac, 13 + dex);
    }
    var s = R.item(h.equip.shield);
    if (s && s.shield) ac += s.shield.ac;
    var ring = R.item(h.equip.ring);
    if (ring && ring.ring && ring.ring.ac) ac += ring.ring.ac;
    if ((h.cls === 'paladin' || h.style === 'defense') && a && a.armor && a.armor.type !== 'robe') ac += 1; // Fighting Style: Defense (Lymen's; a class NPC's `style`)
    return ac;
  };
  // wearing real armor (robes aren't armor to Mage Armor): the spell has no one to take it (playtest 09-25 round four)
  R.armored = function (h) { var a = R.item(h.equip.armor); return !!(a && a.armor && a.armor.type !== 'robe'); };
  R.isProfWeapon = function (h, w) {
    var ok = R.CLASSES[h.cls].weapons;
    return w.id === 'unarmed' || ok.indexOf(w.weapon.group) >= 0 || ok.indexOf(w.weapon.kind) >= 0;
  };
  R.canEquip = function (h, it) {
    if (!it) return true;
    var c = R.CLASSES[h.cls];
    if (it.kind === 'weapon') return R.isProfWeapon(h, it);
    if (it.kind === 'armor') return c.armor.indexOf(it.armor.type) >= 0;
    if (it.kind === 'shield') {
      var w = R.item(h.equip.weapon);
      return c.armor.indexOf('shield') >= 0;
    }
    if (it.kind === 'ring') return true;
    return false;
  };
  // a monk weapon (SRD 5.1): the shortsword, or a simple melee weapon that is neither two-handed nor heavy; fists too
  R.monkWeapon = function (w) {
    var wd = w.weapon || {}, p = wd.props || [];
    return w.id === 'unarmed' || wd.kind === 'shortsword' || (wd.group === 'simple' && p.indexOf('ranged') < 0 && p.indexOf('two-handed') < 0 && p.indexOf('heavy') < 0);
  };
  R.martialDie = function (lvl) { return lvl >= 17 ? '1d10' : lvl >= 11 ? '1d8' : lvl >= 5 ? '1d6' : '1d4'; };
  R.weaponAbil = function (h, w) {
    var p = w.weapon.props || [];
    if (p.indexOf('ranged') >= 0) return 'dex';
    if (h.cls === 'monk' && R.monkWeapon(w)) return DS.mod(h.abil.dex) > DS.mod(h.abil.str) ? 'dex' : 'str'; // Martial Arts
    if (p.indexOf('finesse') >= 0) return DS.mod(h.abil.dex) > DS.mod(h.abil.str) ? 'dex' : 'str';
    return 'str';
  };
  R.twoHanded = function (h, w) {
    var p = w.weapon.props || [];
    if (p.indexOf('two-handed') >= 0) return true;
    return p.indexOf('versatile') >= 0 && !h.equip.shield && !h.equip.torch; // (a torch in the other hand: one-handed)
  };
  // ---------------------------------------------------------------- torchdark (09-28; Griz: "Aurdin would pretty much have to carry it lest lyman
  // drop shield"). Hands: a two-handed weapon takes both, a shield one, a torch one, fists none. One law for both games
  // (DEEP16 reads these too: deep16/js/light.js). Darkvision by blood (SRD 5.1) off the sheet's race, or the day's Darkvision
  // spell (conds.darkvision, till the long rest). A light carried in: the Sunshaft staff (always lit), a Continual Flame
  R.freeHands = function (h) {
    var w = R.weaponOf(h), p = w.weapon.props || [];
    var used = (w.id === 'unarmed' ? 0 : p.indexOf('two-handed') >= 0 ? 2 : 1) + (h.equip.shield ? 1 : 0) + (h.equip.torch ? 1 : 0);
    return Math.max(0, 2 - used);
  };
  R.handsWhy = function (h) {
    var w = R.weaponOf(h), p = w.weapon.props || [], bits = [];
    if (w.id !== 'unarmed') bits.push((p.indexOf('two-handed') >= 0 ? 'both hands on the ' : 'the ') + w.name.toLowerCase());
    if (h.equip.shield) bits.push('the shield');
    if (h.equip.torch) bits.push('a light in that hand already');
    return bits.join(' and ') || 'both hands full';
  };
  // shooting blind (an attack at a creature the attacker cannot see for want of light): 'disadvantage' is the SRD 5.1's rule
  // (AMENDED 09-28 on Griz's question: the -4 was AD&D's number, "shouldn't be what the game does"); -4 keeps his first notion
  // as a flat penalty instead. One switch, both games (deep16/js/light.js L.BLIND reads it)
  R.BLIND = 'disadvantage';
  R.RACE_DV = { 'Half-orc': 60, 'Dwarf': 60, 'Elf': 60, 'Gnome': 60, 'Tiefling': 60, 'Drow': 120 };
  R.darkvision = function (h) { var d = DS.DATA.heroes[h.id]; return Math.max(R.RACE_DV[d && d.race] || 0, h.conds && h.conds.darkvision ? 60 : 0); };
  // a hooded light (RULED 09-29 the hooded lantern; 09-30 the Ledger-Lamp, "like a lantern but better"): 'lantern', or a pack item whose `light`
  // has a `hood` (the Ledger-Lamp). `k` is a pack id, or the field's g.flags.torchKind ('torch' | 'lantern' | 'ledgerlamp'). One law, both games
  R.hooded = function (k) { var it = k && k !== 'torch' ? R.item(k) : null; return k === 'lantern' || !!(it && it.light && it.light.hood); };
  R.carriesLight = function (h) {
    if (h.conds && h.conds.continualFlame) return true;
    return Object.keys(h.equip || {}).some(function (s) { var it = R.item(h.equip[s]); return !!(it && it.light && it.light.when === 'always'); });
  };
  R.attackBonus = function (h, w) {
    w = w || R.weaponOf(h);
    var b = DS.mod(h.abil[R.weaponAbil(h, w)]) + (R.isProfWeapon(h, w) ? R.prof(h.lvl) : 0) + (w.weapon.bonus || 0);
    if (h.style === 'archery' && (w.weapon.props || []).indexOf('ranged') >= 0) b += 2; // Fighting Style: Archery (a class NPC's)
    return b;
  };
  R.damageExpr = function (h, w) {
    w = w || R.weaponOf(h);
    var dice = w.weapon.dmg;
    if (R.twoHanded(h, w) && w.weapon.versatile) dice = w.weapon.versatile;
    var mod = DS.mod(h.abil[R.weaponAbil(h, w)]) + (w.weapon.bonus || 0);
    // Martial Arts (the monk): a fist or a monk weapon hits for the martial-arts die when that is bigger
    if (h.cls === 'monk' && R.monkWeapon(w)) { var md = R.martialDie(h.lvl); if (w.id === 'unarmed' || +md.split('d')[1] > +String(dice).split('d')[1]) dice = md; return { dice: dice, mod: mod, type: w.weapon.type }; }
    // PIT FISTS (the Path of the Sand, 3rd; 09-28h, Griz on Talmok's fists: "Almost certainly"): 1d4 + STR, 1d6 from the 6th
    if (w.id === 'unarmed' && h.subclass === 'Path of the Sand' && h.lvl >= 3) return { dice: h.lvl >= 6 ? '1d6' : '1d4', mod: DS.mod(h.abil.str), type: 'bludgeoning' };
    if (w.id === 'unarmed') return { dice: '0', mod: 1 + DS.mod(h.abil.str), type: 'bludgeoning' };
    return { dice: dice, mod: mod, type: w.weapon.type };
  };
  // a cloak against spells (the King's Mantle, Pyro's: +5 to saving throws against spells, RULED 09-30b): both games add it when the
  // save is against a spell (the 8-bit battle's spellNow; the grid's B.spellNow, deep16/js/pyro.js)
  R.spellSave = function (h) { var c = R.item(h && h.equip && h.equip.cloak); return (c && c.cloak && c.cloak.spellSave) || 0; };
  R.saveBonus = function (h, ab) {
    var b = DS.mod(h.abil[ab]);
    if (h.saveProf && h.saveProf.indexOf(ab) >= 0) b += R.prof(h.lvl);
    var ring = R.item(h.equip.ring);
    if (ring && ring.ring && ring.ring.saveBonus && ring.ring.saveBonus[ab]) b += ring.ring.saveBonus[ab];
    if (ring && ring.ring && ring.ring.saveAll) b += ring.ring.saveAll;
    return b;
  };
  // skills are written at proficiency +2; they grow with it, twice over where there's expertise, and a skill that gains
  // expertise later (the rogue at 6) adds proficiency once more
  R.skill = function (h, name, ab) {
    var s = h.skills && h.skills[name], d = h.id && DS.DATA.heroes[h.id], p = R.prof(h.lvl);
    if (s == null) return DS.mod(h.abil[ab]);
    var base = (d && d.expertise) || [], later = (h.expertise || []).filter(function (x) { return base.indexOf(x) < 0; });
    var grown = d && d.abil && d.abil[ab] != null ? DS.mod(h.abil[ab]) - DS.mod(d.abil[ab]) : 0; // an ability raised since level 2 raises its skills
    return s + (p - 2) * (base.indexOf(name) >= 0 ? 2 : 1) + (later.indexOf(name) >= 0 ? p : 0) + grown;
  };
  R.spellDC = function (h) { var c = R.CLASSES[h.cls], w = R.item(h.equip.weapon); return 8 + R.prof(h.lvl) + DS.mod(h.abil[c.cast || 'int']) + ((w && w.weapon && w.weapon.dcBonus) || 0); };
  R.spellAtk = function (h) { var c = R.CLASSES[h.cls]; return R.prof(h.lvl) + DS.mod(h.abil[c.cast || 'int']); };
  R.initBonus = function (h) { return DS.mod(h.abil.dex) + (h.cls === 'fighter' && h.lvl >= 7 ? Math.ceil(R.prof(h.lvl) / 2) : 0); }; // Remarkable Athlete
  R.critRange = function (h) { return (h.cls === 'fighter' && h.lvl >= 3) ? 19 : 20; };
  R.attacksPerTurn = function (h) { if (h.attacks) return h.attacks; if (h.cls === 'fighter' && h.lvl >= 11) return 3; return (/^(fighter|paladin|barbarian|ranger|monk)$/.test(h.cls) && h.lvl >= 5) ? 2 : 1; }; // Extra Attack at 5; the fighter's second at 11 (SRD 5.1; the named past 9, 09-30)
  R.maxSlotLevel = function (h) { var m = 0; (h.slotsMax || []).forEach(function (n, i) { if (n > 0) m = i + 1; }); return m; };
  R.lowestSlot = function (h, min) { for (var i = (min || 1) - 1; i < (h.slots || []).length; i++) if (h.slots[i] > 0) return i + 1; return 0; };
  R.cantripDice = function (sp, h) {
    var d = sp.dmg; if (!sp.scale) return d;
    Object.keys(sp.scale).forEach(function (lv) { if (h.lvl >= +lv) d = sp.scale[lv]; });
    return d;
  };
  // ---------------------------------------------------------------- the day's spells (SRD 5.1; AMENDED 09-27, Griz: the casters
  // choose, "spell section to pre-save-post-sleep"). A wizard prepares INT modifier + his level from his spellbook (h.known); a
  // paladin CHA modifier + half his level from the whole paladin list, and nothing at level 1; both only of levels they have
  // slots for. Cantrips are always ready, and so, uncounted, are the Oath of Devotion's spells and a wizard's rituals (cast
  // from the book as rituals, in the field). DEEP16 reads these same functions (deep16/js/save.js): one law for both games.
  // `spellOf` is the lookup (DEEP16 passes its own, which also knows the grid's spells)
  // Command, Branding Smite and Magic Weapon joined 09-28 (built on the grid for the class NPCs; RULED 09-28g, Griz: "they have to be
  // able to transfer back and forth from 16bit fights" -- so the 8-bit battle casts them too, js/battle.js)
  R.PALADIN_SPELLS = ['bless', 'command', 'curewounds', 'shieldoffaith', 'divinefavor', 'heroism', 'lesserrestoration', 'aid', 'brandingsmite', 'magicweapon', 'revivify', 'daylight'];
  function spellData(id) { return DS.DATA.spells[id]; }
  // the Oath of Devotion's spells (SRD 5.1): Protection from Evil and Good and Sanctuary from 3, Lesser Restoration from 5 (Zone of
  // Truth, its pair, isn't built; nor the 9th's). Both games (the 3rd's pair was the grid's alone till 09-28g)
  R.oathSpells = function (h) {
    if (h.cls !== 'paladin' || h.lvl < 3) return [];
    return ['protectionfromevilandgood', 'sanctuary'].concat(h.lvl >= 5 ? ['lesserrestoration'] : []);
  };
  R.prepCount = function (h) {
    if (h.cls === 'wizard') return Math.max(1, DS.mod(h.abil.int) + h.lvl);
    if (h.cls === 'paladin') return h.lvl >= 2 ? Math.max(1, DS.mod(h.abil.cha) + Math.floor(h.lvl / 2)) : 0;
    return 0;
  };
  R.prepPool = function (h, spellOf) {
    spellOf = spellOf || spellData;
    var top = (h.slotsMax || R.slotsFor(h)).length, oath = R.oathSpells(h), src = h.cls === 'wizard' ? (h.known || []) : h.cls === 'paladin' ? R.PALADIN_SPELLS : [];
    return src.filter(function (id) { var sp = spellOf(id); return sp && sp.level > 0 && sp.level <= top && !sp.ritual && oath.indexOf(id) < 0; })
      .map(function (id, i) { return { id: id, i: i, lv: spellOf(id).level }; }).sort(function (a, b) { return a.lv - b.lv || a.i - b.i; })
      .map(function (x) { return x.id; }); // (by level, then the book's order)
  };
  R.ritualsOf = function (h, spellOf) {
    spellOf = spellOf || spellData;
    return h.cls === 'wizard' ? (h.known || []).filter(function (id) { var sp = spellOf(id); return sp && sp.ritual; }) : [];
  };
  // the day the build would pick, what you get if you never touch the choice: what the levelling gave him first, the highest
  // levels first, Mage Armor always (it's cast in the morning)
  function prepRanked(h, spellOf) {
    var build = h.known || [];
    var rank = function (id) { return (id === 'mageArmor' ? 100 : id === 'shield' ? 90 : 0) + (build.indexOf(id) >= 0 ? 50 : 0) + spellOf(id).level * 5; }; // (Shield next after Mage Armor: a wizard's default day always holds it, since it is the reaction and never on the MAGIC list -- RULED 10-03, Griz: "yes")
    return R.prepPool(h, spellOf).sort(function (a, b) { return rank(b) - rank(a); });
  }
  R.prepDefault = function (h, spellOf) { return prepRanked(h, spellOf || spellData).slice(0, R.prepCount(h)); };
  // the morning: what he chose stays; places the day has grown by (a level since) take the build's next picks, so one who
  // never touches the choice still gets what the levelling gave him
  R.prepFill = function (h, spellOf) {
    spellOf = spellOf || spellData;
    var n = R.prepCount(h), pool = R.prepPool(h, spellOf);
    var cur = (h.prepared || []).filter(function (id) { return pool.indexOf(id) >= 0; }).slice(0, n);
    prepRanked(h, spellOf).forEach(function (id) { if (cur.length < n && cur.indexOf(id) < 0) cur.push(id); });
    return cur;
  };
  // what a hero can cast today: one who prepares nothing (a fighter, a guest) everything he knows; one who prepares, his
  // cantrips, the day's spells, the oath's, and away from a fight the book's rituals
  R.castable = function (h, where, spellOf) {
    spellOf = spellOf || spellData;
    var k = h.known || [];
    if (!h.prepared) return k.slice();
    var cantrips = k.filter(function (id) { var sp = spellOf(id); return sp && !sp.level; });
    return cantrips.concat(h.prepared, R.oathSpells(h), where === 'battle' ? [] : R.ritualsOf(h, spellOf)).filter(function (id, i, a) { return a.indexOf(id) === i; });
  };
  // spells a hero may cast now (battle or field)
  R.spellList = function (h, where) {
    return R.castable(h, where).map(function (id) { return DS.DATA.spells[id]; }).filter(function (sp) {
      if (!sp) return false;
      if (where === 'battle' && !sp.battle) return false;
      if (where === 'field' && !sp.field) return false;
      if (sp.level > R.maxSlotLevel(h) && sp.level > 0) return false;
      return true;
    });
  };
  R.alive = function (h) { return !h.ko && h.hp > 0; };
  R.canAct = function (u) { return !u.ko && u.hp > 0 && !u.conds.paralyzed && !u.conds.asleep && !u.conds.stunned; };
  R.CONDS = {
    poisoned: 'PSN', frightened: 'FRT', restrained: 'RST', prone: 'PRN', asleep: 'SLP', paralyzed: 'PAR', grappled: 'GRP',
    blinded: 'BLD', hidden: 'HID', stunned: 'STN', engulfed: 'ENG', invisible: 'INV', stoneskin: 'STN', seeInvisible: 'SEE',
    blessed: 'BLS', shieldOfFaith: 'SOF', heroism: 'HRO', divineFavor: 'DVF', sacred: 'SWD', shielded: 'SHD' // (the 8-bit's buffs as conditions, 10-03: the one-buff slot retired)
  };

  // ---------------------------------------------------------------- Find Familiar (SRD 5.1; REINSTATED 09-29, Griz: "familiars are pretty sweet -
  // let's reinstate"; cast from the field menu, the shape picked by where you stand: "select by biome"). The forms' numbers are the SRD's
  // (a spirit in the shape, fey by default); `sheet` is DEEP16's figure for it (a form with no sheet yet is left off the pick). The
  // snowy owl is the owl in the snowfield's feathers. Both games read this: js/familiar.js (the ritual, the 8-bit shoulder) and
  // deep16/js/familiar.js (the grid's familiar)
  // `perk` is what each lends its caster (RULED 09-30, Griz: "rat grants nightvision, spider buffs web spell and gives 'webwalk' ...
  // snake sense hidden within 15 feet (counts as vision)" · "Agreed with vision range." · "EXCELLENT call on the frog. will need
  // audible." · "Snake still charm related spells, diplomacy and persuasion checks by caster"): darkvision (ft), sonar (ft through any
  // dark: blindsight), senseHidden (ft: the hidden and the invisible are seen), webWalker, webDC (+ to his Web's save DC), charmDC (+ to
  // the save DC of his spells that charm), persuasion ('adv': a familiar may take the Help action on a check, SRD), alarm (he is never
  // caught off guard: it croaks). A perk is its CASTER's, whoever that is -- the NPC casters and the Pocket DM's have them too (his word).
  // `help`: 'auto' the owls (Flyby), else on the caster's order (the grid; the bat too -- RULED 09-30, Griz: "i think the bat not helping is out
  // of balance and should be orderable in the 16 and let it keep doing it in the 8"). `perch`: 'head' the bat ("have it flutter around his head")
  R.FAMILIARS = {
    owl: { name: 'owl', ac: 11, hp: 1, speed: 5, fly: 60, darkvision: 120, flyby: true, help: 'auto', perk: {}, sheet: 'owl_p2', scale: 0.75, gift: 'flies 60 ft; sees 120 ft in the dark; swoops in to help and out of reach unharmed' },
    snowyowl: { name: 'snowy owl', ac: 11, hp: 1, speed: 5, fly: 60, darkvision: 120, flyby: true, help: 'auto', perk: {}, sheet: 'snowyowl_p2', scale: 0.75, gift: 'an owl in the snowfield\'s feathers: flies 60 ft, swoops in to help and out of reach unharmed' },
    bat: { name: 'bat', ac: 12, hp: 1, speed: 5, fly: 30, blindsight: 60, perch: 'head', perk: { sonar: 15 }, sheet: 'giantbat_p1', scale: 0.225, /* (half what it was: 10-01b, Griz: "make the familiar bat 50% smaller") */ gift: 'flutters about his head; lends him its ears: he knows what is within 15 ft in any dark; carries a touch spell' },
    rat: { name: 'rat', ac: 10, hp: 1, speed: 20, darkvision: 30, perk: { darkvision: 30 }, sheet: 'giantrat_p1', scale: 0.5, gift: 'lends him its eyes: darkvision 30 ft; quick and small; carries a touch spell' },
    spider: { name: 'spider', ac: 12, hp: 1, speed: 20, darkvision: 30, webWalker: true, perk: { webWalker: true, webDC: 1 }, sheet: 'wolfspider_p1', scale: 0.4, gift: 'webs do not hold him or it; his Web holds the tighter (+1); carries a touch spell' },
    frog: { name: 'frog', ac: 11, hp: 1, speed: 20, swim: 20, darkvision: 30, perk: { alarm: true }, sheet: 'giantfrog_p1', scale: 0.45, gift: 'croaks when danger comes: he is never caught off guard; swims; carries a touch spell' },
    snake: { name: 'snake', ac: 13, /* (the SRD's form is the poisonous snake, but "a familiar can't attack" (SRD 5.1 Find Familiar): it never poisons, so its name drops it -- 10-01b, Griz: "remove poisonous from the snake familiars title unless it can be used (according to the SRD) to poison targets") */ hp: 2, speed: 30, swim: 30, blindsight: 10, sense: 'tongue', perk: { senseHidden: 15, charmDC: 1, persuasion: 'adv' }, sheet: 'snake_p1', scale: 0.55, gift: 'he senses the hidden and unseen within 15 ft; his charms bite deeper (+1), his Persuasion has advantage' }
  };
  // Lisbet's charm (content/items.json `charm`, a ring; Charms & Chalk, Silverton): whoever wears it cannot be frightened. HIDDEN BY RULING --
  // Griz, 09-30: "let's make that charm grant immune to fear in the mechanics, but not say so anywhere the player sees". Its words stay "No
  // promises made."; no card or line ever names it: a fright that would take simply does not (js/battle.js the moan; deep16/js/rules.js RU.save)
  R.fearWard = function (h) { return !!(h && h.equip && h.equip.ring === 'charm'); };
  // the spells that charm (the snake's charmDC; the SRD's enchantments that lay the charmed condition or take the will): both games
  R.CHARM_SPELLS = ['charmperson', 'animalfriendship', 'hypnoticpattern', 'irresistibledance', 'suggestion', 'masssuggestion', 'dominatebeast', 'dominateperson', 'dominatemonster', 'geas'];
  // the world map's ground (content/maps/world.json legend) -> the shapes a spirit takes there; off the world map: the caves' or the town's
  R.FAM_GROUND = {
    snow: { tiles: 'o*', forms: ['snowyowl'] },
    fields: { tiles: '.,nfyp=bv134567g', forms: ['owl', 'rat'] },
    forest: { tiles: 'tz', forms: ['owl', 'spider'] },
    water: { tiles: '~w%r', forms: ['frog', 'snake'] },
    stone: { tiles: '^xcuse', forms: ['bat', 'spider', 'snake'] },
    cave: { tiles: '28', forms: ['bat', 'rat', 'spider'] }
  };
  R.famForms = function (tile, mapKind) {
    if (mapKind && mapKind !== 'world') return mapKind === 'town' ? ['rat', 'owl'] : ['bat', 'rat', 'spider'];
    for (var k in R.FAM_GROUND) if (R.FAM_GROUND[k].tiles.indexOf(tile) >= 0) return R.FAM_GROUND[k].forms;
    return ['owl'];
  };
})();
