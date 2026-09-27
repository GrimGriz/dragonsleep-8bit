/* DEEP16 — the save crosses (proof 1). The 8-bit game and DEEP16 share an origin, so one localStorage: read the seam's
   snapshot (`deep16.handoff`, written by PAST THE DOOR in the credits), else the newest 8-bit slot (`ds8-save-1..3`),
   else a fixture (the four at level 9, the expansion's end-state). Read-only: DEEP16 writes only deep16.* keys.
   The 8-bit rules module (../js/rules.js) is loaded as-is for the character maths (AC, attack, saves, spell DC):
   the rules layer here is new, the data and the sheets are not. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS;
  DS.DATA = window.DS_DATA;
  DS.mod = function (s) { return Math.floor((s - 10) / 2); };
  DS.G = { flags: { lakeDone: 1 } }; // R.cap() reads it: past the door the cap is 9
  var R = DS.R;
  var SV = D.save = {};

  SV.slots = function () {
    var out = [];
    for (var i = 1; i <= 3; i++) { var d = D.store.get('ds8-save-' + i); if (d && d.party) out.push({ slot: i, data: d }); }
    return out;
  };

  // which party walks in, and from where
  SV.load = function () {
    var h = D.store.get('deep16.handoff');
    var slots = SV.slots().sort(function (a, b) { return (b.data.saved || 0) - (a.data.saved || 0); });
    // the door's snapshot, unless a slot has been saved since (the newer of the two walks in)
    if (h && h.save && h.save.party && (!slots.length || (h.at || 0) >= (slots[0].data.saved || 0))) return { from: 'the door', when: h.at, data: h.save };
    if (slots.length) return { from: 'slot ' + slots[0].slot, when: slots[0].data.saved, data: slots[0].data };
    return { from: 'the fixture', when: null, data: SV.fixture() };
  };

  // the four at a level (9 unless said): the 8-bit game's own levelling, its picks and features; the reward weapons
  // as the ladder's guess at when they come (+1 from 5, +2 at 9)
  // level 1 (the ladder's first rung; Griz 09-27: "might as well add level 1"): the 8-bit game starts the four at 2, so a
  // level-1 sheet is drawn back from it -- one max hit die plus CON (the level-2 starts are exactly two), the level-1 slot
  // table (the wizard's two first-level slots; the paladin none, so no Smite), no Action Surge, Lay on Hands 5
  SV.levelOne = function (h) {
    var c = R.CLASSES[h.cls];
    h.lvl = 1; h.xp = 0;
    h.maxhp = h.hp = Math.max(1, c.hd + DS.mod(h.abil.con));
    h.slotsMax = R.slotsFor(h); h.slots = h.slotsMax.slice();
    if (h.cls === 'fighter') h.feats.actionSurge = 0;
    if (h.cls === 'paladin') { h.feats.lay = 5; h.feats.channel = 0; }
    return h;
  };
  // o.bare: nothing cast that morning (the camp casts, js/camp.js)
  SV.fixture = function (level, o) {
    var L = level || 9, bare = !!(o && o.bare);
    var party = ['barley', 'aurdin', 'vivian', 'lymen'].map(function (id) {
      var h = L < DS.DATA.heroes[id].level ? SV.levelOne(R.makeHero(id)) : R.makeHero(id, L), d = DS.DATA.heroes[id], tier = L >= 9 ? 1 : L >= 5 ? 0 : -1;
      if (tier >= 0 && d.rewardWeapons && d.rewardWeapons[tier] && DS.DATA.items[d.rewardWeapons[tier]]) h.equip.weapon = d.rewardWeapons[tier];
      // the 8-bit sheet gives Barley no armour (a thresher: AC 11); the ladder dresses him (Griz, 09-27: "let's go with splint-mail")
      if (id === 'barley' && !h.equip.armor) h.equip.armor = 'splint';
      // Mage Armor cast that morning, and paid for: a 1st-level slot (Griz, 09-27: "cost for mage armor"; it was free)
      if (!bare && id === 'aurdin' && h.known.indexOf('mageArmor') >= 0 && h.slots && h.slots[0] > 0) { h.conds.mageArmor = 1; h.slots[0]--; }
      return h;
    });
    var inv = L >= 9 ? [{ id: 'potion', n: 3 }, { id: 'greaterpotion', n: 1 }, { id: 'antitoxin', n: 1 }, { id: 'kit', n: 1 }, { id: 'oil', n: 2 }]
      : L >= 5 ? [{ id: 'potion', n: 3 }, { id: 'antitoxin', n: 1 }, { id: 'oil', n: 1 }] : [{ id: 'potion', n: 2 }];
    return { party: party, guests: [], inv: SV.armoury(inv), flags: { lakeDone: 1, expansionDone: L >= 9 ? 1 : 0 }, fixture: true, level: L };
  };
  // every pack DEEP16 fights with carries a light crossbow and twenty bolts (Griz, 09-27: "at least one crossbow/bolts in
  // the player inventory for all of deep16 modes"); the 8-bit save walking in is read, never written, so it's added here
  SV.armoury = function (inv) {
    [['lightcrossbow', 1], ['bolts', 20]].forEach(function (p) {
      var s = inv.filter(function (x) { return x.id === p[0]; })[0];
      if (!s) inv.push({ id: p[0], n: p[1] }); else if (s.n < p[1]) s.n = p[1];
    });
    return inv;
  };
  // a hero's weapon as the grid reads it (the unit's, and again after a swap in the fight). A ranged weapon shoots out to
  // its long range; a loading one (the crossbow) fires once an action, Extra Attack or no; Great Weapon Fighting is melee only
  SV.weaponOf = function (h) {
    var w = R.weaponOf(h), dm = R.damageExpr(h, w), wd = w.weapon || {}, props = wd.props || [], ranged = props.indexOf('ranged') >= 0;
    return {
      id: h.equip && h.equip.weapon, name: w.name, atk: R.attackBonus(h, w), dice: dm.dice, mod: dm.mod, type: dm.type, props: props, magic: !!(wd.bonus || wd.magic),
      finesse: props.indexOf('finesse') >= 0, gwf: h.cls === 'fighter' && !ranged && R.twoHanded(h, w),
      ranged: ranged, range: ranged ? (wd.range || [80, 320]) : null, ammo: wd.ammo || null, loading: props.indexOf('loading') >= 0, fx: 'bolt',
      flame: wd.flame || null // Flame Tongue: a bonus action lights it (battle.js IGNITE)
    };
  };

  // the heroes and guests as DEEP16 units: everything the grid needs, read off the 8-bit sheet
  SV.units = function (data, fight) {
    DS.G = { flags: data.flags || { lakeDone: 1 } };
    var out = [];
    (data.party || []).forEach(function (h) { out.push(unitOf(h, false, fight)); });
    (data.guests || []).forEach(function (g) { out.push(unitOf(g, true, fight)); });
    return out;
  };
  function unitOf(h, guest, fight) {
    var look = SV.look(h.id, fight), wp = SV.weaponOf(h);
    return {
      id: h.id, name: look.name || h.name, cls: h.cls, lvl: h.lvl, guest: guest, side: 'party', sheet: look.sheet || h.id + '_p0',
      hp: h.ko ? 0 : h.hp, maxhp: h.maxhp, ko: !!h.ko, conds: JSON.parse(JSON.stringify(h.conds || {})),
      abil: h.abil, baseAC: R.ac(h), prof: R.prof(h.lvl), init: R.initBonus(h), speed: 30, size: 1, reach: 5,
      slots: (h.slots || []).slice(), slotsMax: (h.slotsMax || []).slice(), known: knownOf(h), armored: R.armored(h),
      feats: JSON.parse(JSON.stringify(h.feats || {})), subclass: h.subclass,
      displacement: SV.displaced(h), // a Cloak of Displacement (rules.js edges)
      weapon: wp, attacksBase: R.attacksPerTurn(h), attacks: wp.loading ? 1 : R.attacksPerTurn(h), crit: R.critRange(h), spellDC: R.spellDC(h), spellAtk: R.spellAtk(h),
      saves: { str: R.saveBonus(h, 'str'), dex: R.saveBonus(h, 'dex'), con: R.saveBonus(h, 'con'), int: R.saveBonus(h, 'int'), wis: R.saveBonus(h, 'wis'), cha: R.saveBonus(h, 'cha') },
      stealth: R.skill(h, 'Stealth', 'dex'), perception: 10 + R.skill(h, 'Perception', 'wis'), src: h
    };
  }
  // Misty Step is the POC spec's (§3) and not in the 8-bit game's list: a wizard of 3rd level or more has it in his book here
  // (the climb's wizard learns his own spells: Misty Step only if he picked it; inside the 8-bit game, h.ownBook, his book is his own)
  function bookOf(h) { var k = (h.known || []).slice(); if (!h.climb && !h.ownBook && h.cls === 'wizard' && h.lvl >= 3 && k.indexOf('mistystep') < 0) k.push('mistystep'); return k; }
  SV.displaced = function (h) { var c = R.item(h.equip && h.equip.cloak); return !!(c && c.cloak && c.cloak.displacement); };
  // what a hero can cast in the fight: all he knows, or, once the camp has prepared his day (h.prepared), his cantrips,
  // the spells he prepared, and the ones his oath keeps ready
  function knownOf(h) {
    var k = bookOf(h);
    if (!h.prepared) return k;
    var cantrips = k.filter(function (id) { var sp = SV.spell(id); return sp && !sp.level; });
    return cantrips.concat(h.prepared, SV.oath(h)).filter(function (id, i, a) { return a.indexOf(id) === i; });
  }

  // ---------------------------------------------------------------- the day's spells (SRD 5.1; Griz, 09-27: "spell prep should probably run
  // before each fight"). A wizard prepares INT modifier + his level from his spellbook; a paladin CHA modifier + half his
  // level from the whole paladin list (the ones built here), and nothing at level 1. Both only of levels they have slots for.
  SV.PALADIN = ['bless', 'curewounds', 'shieldoffaith', 'divinefavor', 'heroism', 'lesserrestoration', 'aid', 'revivify', 'daylight'];
  SV.spell = function (id) { return window.DS.DATA.spells[id] || (D.EXTRA_SPELLS || {})[id]; };
  // the Oath of Devotion keeps its spells ready, uncounted: Lesser Restoration from 5 (Zone of Truth, its pair, isn't built;
  // the 3rd-level pair comes at 9, and neither of those is built either)
  SV.oath = function (h) { return h.cls === 'paladin' && h.lvl >= 5 ? ['lesserrestoration'] : []; };
  SV.prepCount = function (h) {
    if (h.cls === 'wizard') return Math.max(1, DS.mod(h.abil.int) + h.lvl);
    if (h.cls === 'paladin') return h.lvl >= 2 ? Math.max(1, DS.mod(h.abil.cha) + Math.floor(h.lvl / 2)) : 0;
    return 0;
  };
  SV.prepPool = function (h) {
    var top = (h.slotsMax || []).length, oath = SV.oath(h), src = h.cls === 'wizard' ? bookOf(h) : h.cls === 'paladin' ? SV.PALADIN : [];
    return src.filter(function (id) { var sp = SV.spell(id); return sp && sp.level > 0 && sp.level <= top && oath.indexOf(id) < 0; });
  };
  // the day the build would pick: what the 8-bit game's levelling gave him first, the highest levels first, Mage Armor
  // always (it's cast at camp), Detect Magic last (a ritual: it needn't be prepared, and it does nothing in a fight)
  SV.prepDefault = function (h) {
    var build = h.known || [];
    var rank = function (id) { return (id === 'mageArmor' ? 100 : 0) + (build.indexOf(id) >= 0 ? 50 : 0) + SV.spell(id).level * 5 - (id === 'detectmagic' ? 60 : 0); };
    return SV.prepPool(h).sort(function (a, b) { return rank(b) - rank(a); }).slice(0, SV.prepCount(h));
  };
  // the POC's looks (RULED 09-27, Griz: "Denny should play as Barley but look like Denny for this POC"); the base art
  // is LPC (pipeline 0), Blender for special monsters (RULED 09-27: "Pipeline 0 is the way to go, maybe pipeline 1 for
  // special monsters or fights")
  // Barley is Barley again everywhere but the level-9 fight (Griz, 09-27: "put Barley back except in the lvl 9 fight"):
  // a fight may carry `looks` over these (data/fights.js, the Cocoon Gallery keeps Denny)
  SV.LOOK = { barley: { sheet: 'barley_p0' }, aurdin: { sheet: 'aurdin_p0' }, vivian: { sheet: 'vivian_p0' }, lymen: { sheet: 'lymen_p0' } };
  SV.look = function (id, fight) { return (fight && fight.looks && fight.looks[id]) || SV.LOOK[id] || {}; };
})();
