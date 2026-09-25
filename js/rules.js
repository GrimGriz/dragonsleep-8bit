/* DRAGONSLEEP — 5E-flavoured, FF-simple rules. Mechanics from the SRD 5.1 (CC BY 4.0):
   ability modifiers, proficiency, class tables, spell slots, XP by CR. */
'use strict';
(function () {
  var DS = window.DS;
  var R = DS.R = {};
  R.ABIL = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  R.XP_LEVEL = [0, 0, 300, 900, 2700, 6500]; // xp needed to BE level n
  R.CAP = 5;
  R.CR_XP = { '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900 };
  R.prof = function (lvl) { return lvl >= 5 ? 3 : 2; };
  var SLOTS_FULL = { 1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2] };
  var SLOTS_HALF = { 1: [], 2: [2], 3: [3], 4: [3], 5: [4, 2] };

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
    }
  };
  R.slotsFor = function (h) {
    var c = R.CLASSES[h.cls];
    if (c.caster === 'full') return (SLOTS_FULL[h.lvl] || []).slice();
    if (c.caster === 'half') return (SLOTS_HALF[h.lvl] || []).slice();
    return [];
  };
  R.sneakDice = function (lvl) { return Math.ceil(lvl / 2) + 'd6'; };

  // ---------------------------------------------------------------- hero construction
  R.makeHero = function (id, level) {
    var d = DS.DATA.heroes[id];
    var h = {
      id: id, name: d.name, cls: d.cls, lvl: d.level, xp: R.XP_LEVEL[d.level], base: JSON.parse(JSON.stringify(d.abil)),
      abil: JSON.parse(JSON.stringify(d.abil)), maxhp: d.hp, hp: d.hp, equip: JSON.parse(JSON.stringify(d.equip)),
      known: (d.spells || []).slice(), feats: {}, conds: {}, buff: null, ko: false, subclass: null, look: d.look, weapon: d.weaponArt,
      skills: d.skills || {}, saveProf: d.saveProf || R.CLASSES[d.cls].saves
    };
    h.subclass = d.subclassStart || null;
    R.refresh(h, true);
    while (level && h.lvl < level) { h.xp = R.XP_LEVEL[h.lvl + 1]; R.levelUp(h); }
    h.hp = h.maxhp;
    return h;
  };
  // restore per-rest resources; long = long rest
  R.refresh = function (h, long) {
    var f = h.feats;
    if (h.cls === 'fighter') { f.secondWind = 1; f.actionSurge = 1; }
    if (h.cls === 'paladin') { f.channel = h.lvl >= 3 ? 1 : 0; if (long) { f.lay = 5 * h.lvl; f.relentless = 1; } }
    if (h.cls === 'wizard' && long) f.arcaneRecovery = 1;
    if (long) {
      h.slotsMax = R.slotsFor(h);
      h.slots = h.slotsMax.slice();
      h.hp = h.maxhp; h.ko = false; h.conds = {}; h.buff = null;
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
    if (lu.asi || h.lvl === 4) {
      var asi = lu.asi || c.asi, parts = [];
      Object.keys(asi).forEach(function (k) { h.abil[k] = Math.min(20, h.abil[k] + asi[k]); parts.push(k.toUpperCase() + ' +' + asi[k]); });
      msgs.push('Ability scores: ' + parts.join(', ') + '.');
    }
    if (lu.learn) lu.learn.forEach(function (s) { if (h.known.indexOf(s) < 0) { h.known.push(s); msgs.push(h.name + ' learns ' + DS.DATA.spells[s].name + '.'); } });
    if (lu.subclass) { h.subclass = lu.subclass; msgs.push(h.name + ': ' + lu.subclass + '.'); }
    if (lu.choose) { h.pendingChoice = lu.choose; msgs.push(h.name + ' has a choice to make.'); }
    (lu.feats || []).forEach(function (t) { msgs.push(t); });
    if (h.cls === 'paladin') { h.feats.lay = (h.feats.lay || 0) + 5; if (h.lvl === 3) h.feats.channel = 1; }
    if (h.cls === 'rogue' && h.lvl % 2 === 1) msgs.push('Sneak Attack is now ' + R.sneakDice(h.lvl) + '.');
    if (h.lvl === 5 && (h.cls === 'fighter' || h.cls === 'paladin')) msgs.push('Extra Attack: two attacks with FIGHT.');
    if (h.lvl === 3 && h.cls === 'fighter') msgs.push('Champion: critical hits on 19 or 20.');
    if (h.lvl === 5 && h.cls === 'rogue') msgs.push('Uncanny Dodge: the first hit each round is halved.');
    return msgs;
  };
  R.gainXP = function (h, xp) {
    var msgs = [];
    if (h.lvl >= R.CAP) { h.xp = Math.max(h.xp, R.XP_LEVEL[R.CAP]); return msgs; }
    h.xp += xp;
    while (h.lvl < R.CAP && h.xp >= R.XP_LEVEL[h.lvl + 1]) msgs = msgs.concat(R.levelUp(h));
    if (h.lvl >= R.CAP) h.xp = Math.max(h.xp, R.XP_LEVEL[R.CAP]);
    return msgs;
  };
  R.nextXP = function (h) { return h.lvl >= R.CAP ? null : R.XP_LEVEL[h.lvl + 1]; };
  // bring an older save's heroes up to the current rules (spells cut, choices added since)
  R.migrate = function (h) {
    h.known = (h.known || []).filter(function (id) { return !!DS.DATA.spells[id]; });
    // RULED 09-25: every level is a max hit die. An older save's heroes catch up (Aid's +5 set aside first).
    var c = R.CLASSES[h.cls], want = h.lvl * Math.max(1, c.hd + DS.mod(h.abil.con)), base = h.maxhp - ((h.conds && h.conds.aid) || 0);
    if (base < want) { h.maxhp += want - base; h.hp += want - base; }
    if (h.id === 'aurdin' && !h.equip.armor && DS.DATA.items.robes) h.equip.armor = 'robes'; // 09-25: robes for the armor slot
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
    var s = R.item(h.equip.shield);
    if (s && s.shield) ac += s.shield.ac;
    var ring = R.item(h.equip.ring);
    if (ring && ring.ring && ring.ring.ac) ac += ring.ring.ac;
    if (h.cls === 'paladin' && a && a.armor) ac += 1; // Fighting Style: Defense
    return ac;
  };
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
  R.weaponAbil = function (h, w) {
    var p = w.weapon.props || [];
    if (p.indexOf('ranged') >= 0) return 'dex';
    if (p.indexOf('finesse') >= 0) return DS.mod(h.abil.dex) > DS.mod(h.abil.str) ? 'dex' : 'str';
    return 'str';
  };
  R.twoHanded = function (h, w) {
    var p = w.weapon.props || [];
    if (p.indexOf('two-handed') >= 0) return true;
    return p.indexOf('versatile') >= 0 && !h.equip.shield;
  };
  R.attackBonus = function (h, w) {
    w = w || R.weaponOf(h);
    var b = DS.mod(h.abil[R.weaponAbil(h, w)]) + (R.isProfWeapon(h, w) ? R.prof(h.lvl) : 0) + (w.weapon.bonus || 0);
    return b;
  };
  R.damageExpr = function (h, w) {
    w = w || R.weaponOf(h);
    var dice = w.weapon.dmg;
    if (R.twoHanded(h, w) && w.weapon.versatile) dice = w.weapon.versatile;
    var mod = DS.mod(h.abil[R.weaponAbil(h, w)]) + (w.weapon.bonus || 0);
    if (w.id === 'unarmed') return { dice: '0', mod: 1 + DS.mod(h.abil.str), type: 'bludgeoning' };
    return { dice: dice, mod: mod, type: w.weapon.type };
  };
  R.saveBonus = function (h, ab) {
    var b = DS.mod(h.abil[ab]);
    if (h.saveProf && h.saveProf.indexOf(ab) >= 0) b += R.prof(h.lvl);
    var ring = R.item(h.equip.ring);
    if (ring && ring.ring && ring.ring.saveBonus && ring.ring.saveBonus[ab]) b += ring.ring.saveBonus[ab];
    if (ring && ring.ring && ring.ring.saveAll) b += ring.ring.saveAll;
    return b;
  };
  R.skill = function (h, name, ab) {
    var s = h.skills && h.skills[name];
    if (s != null) return s + (h.lvl >= 5 ? 1 : 0);
    return DS.mod(h.abil[ab]);
  };
  R.spellDC = function (h) { var c = R.CLASSES[h.cls]; return 8 + R.prof(h.lvl) + DS.mod(h.abil[c.cast || 'int']); };
  R.spellAtk = function (h) { var c = R.CLASSES[h.cls]; return R.prof(h.lvl) + DS.mod(h.abil[c.cast || 'int']); };
  R.initBonus = function (h) { return DS.mod(h.abil.dex); };
  R.critRange = function (h) { return (h.cls === 'fighter' && h.lvl >= 3) ? 19 : 20; };
  R.attacksPerTurn = function (h) { return ((h.cls === 'fighter' || h.cls === 'paladin') && h.lvl >= 5) ? 2 : 1; };
  R.maxSlotLevel = function (h) { var m = 0; (h.slotsMax || []).forEach(function (n, i) { if (n > 0) m = i + 1; }); return m; };
  R.lowestSlot = function (h, min) { for (var i = (min || 1) - 1; i < (h.slots || []).length; i++) if (h.slots[i] > 0) return i + 1; return 0; };
  R.cantripDice = function (sp, h) {
    var d = sp.dmg; if (!sp.scale) return d;
    Object.keys(sp.scale).forEach(function (lv) { if (h.lvl >= +lv) d = sp.scale[lv]; });
    return d;
  };
  // spells a hero may cast now (battle or field)
  R.spellList = function (h, where) {
    return h.known.map(function (id) { return DS.DATA.spells[id]; }).filter(function (sp) {
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
    blinded: 'BLD', hidden: 'HID', stunned: 'STN', engulfed: 'ENG'
  };
})();
