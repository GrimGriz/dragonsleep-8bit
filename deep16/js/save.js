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

  SV.fixture = function () {
    var party = ['barley', 'aurdin', 'vivian', 'lymen'].map(function (id) {
      var h = R.makeHero(id, 9), d = DS.DATA.heroes[id];
      if (d.rewardWeapons && d.rewardWeapons[1] && DS.DATA.items[d.rewardWeapons[1]]) h.equip.weapon = d.rewardWeapons[1];
      if (id === 'aurdin' && h.known.indexOf('mageArmor') >= 0) h.conds.mageArmor = 1;
      return h;
    });
    return { party: party, guests: [], inv: [{ id: 'potion', n: 3 }, { id: 'greaterpotion', n: 1 }, { id: 'antitoxin', n: 1 }, { id: 'kit', n: 1 }, { id: 'oil', n: 2 }], flags: { lakeDone: 1, expansionDone: 1 }, fixture: true };
  };

  // the heroes and guests as DEEP16 units: everything the grid needs, read off the 8-bit sheet
  SV.units = function (data) {
    DS.G = { flags: data.flags || { lakeDone: 1 } };
    var out = [];
    (data.party || []).forEach(function (h) { out.push(unitOf(h, false)); });
    (data.guests || []).forEach(function (g) { out.push(unitOf(g, true)); });
    return out;
  };
  function unitOf(h, guest) {
    var w = R.weaponOf(h), dm = R.damageExpr(h, w), look = SV.LOOK[h.id] || {};
    return {
      id: h.id, name: look.name || h.name, cls: h.cls, lvl: h.lvl, guest: guest, side: 'party', sheet: look.sheet || h.id + '_p0',
      hp: h.ko ? 0 : h.hp, maxhp: h.maxhp, ko: !!h.ko, conds: JSON.parse(JSON.stringify(h.conds || {})),
      abil: h.abil, baseAC: R.ac(h), prof: R.prof(h.lvl), init: R.initBonus(h), speed: 30, size: 1, reach: 5,
      slots: (h.slots || []).slice(), slotsMax: (h.slotsMax || []).slice(), known: knownOf(h), armored: R.armored(h),
      feats: JSON.parse(JSON.stringify(h.feats || {})), subclass: h.subclass,
      weapon: { name: w.name, atk: R.attackBonus(h, w), dice: dm.dice, mod: dm.mod, type: dm.type, props: (w.weapon && w.weapon.props) || [],
        finesse: !!(w.weapon && (w.weapon.props || []).indexOf('finesse') >= 0), gwf: h.cls === 'fighter' && R.twoHanded(h, w) },
      attacks: R.attacksPerTurn(h), crit: R.critRange(h), spellDC: R.spellDC(h), spellAtk: R.spellAtk(h),
      saves: { str: R.saveBonus(h, 'str'), dex: R.saveBonus(h, 'dex'), con: R.saveBonus(h, 'con'), int: R.saveBonus(h, 'int'), wis: R.saveBonus(h, 'wis'), cha: R.saveBonus(h, 'cha') },
      stealth: R.skill(h, 'Stealth', 'dex'), perception: 10 + R.skill(h, 'Perception', 'wis'), src: h
    };
  }
  // Misty Step is the POC spec's (§3) and not in the 8-bit game's list: a wizard of 3rd level or more knows it here
  function knownOf(h) { var k = (h.known || []).slice(); if (h.cls === 'wizard' && h.lvl >= 3 && k.indexOf('mistystep') < 0) k.push('mistystep'); return k; }
  // the POC's looks (RULED 09-27, Griz: "Denny should play as Barley but look like Denny for this POC"); the base art
  // is LPC (pipeline 0), Blender for special monsters (RULED 09-27: "Pipeline 0 is the way to go, maybe pipeline 1 for
  // special monsters or fights")
  SV.LOOK = { barley: { name: 'Denny', sheet: 'denny_p2' }, aurdin: { sheet: 'aurdin_p0' }, vivian: { sheet: 'vivian_p0' }, lymen: { sheet: 'lymen_p0' } };
})();
