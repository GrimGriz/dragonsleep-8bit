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
    if (h && h.save && h.save.party) return { from: 'the door', when: h.at, data: h.save };
    var slots = SV.slots().sort(function (a, b) { return (b.data.saved || 0) - (a.data.saved || 0); });
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
    return { party: party, guests: [], inv: [['potion', 3]], flags: { lakeDone: 1, roadHeld: 1 }, fixture: true };
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
    var w = R.weaponOf ? R.weaponOf(h) : null;
    return {
      id: h.id, name: h.name, cls: h.cls, lvl: h.lvl, guest: guest, side: 'party',
      hp: h.ko ? 0 : h.hp, maxhp: h.maxhp, ko: !!h.ko, conds: JSON.parse(JSON.stringify(h.conds || {})),
      abil: h.abil, ac: R.ac(h), prof: R.prof(h.lvl), init: R.initBonus ? R.initBonus(h) : DS.mod(h.abil.dex),
      slots: (h.slots || []).slice(), slotsMax: (h.slotsMax || []).slice(), known: (h.known || []).slice(), feats: JSON.parse(JSON.stringify(h.feats || {})),
      weapon: w, atk: R.attackBonus(h), dmg: R.damageExpr(h), attacks: R.attacksPerTurn(h), crit: R.critRange ? R.critRange(h) : 20,
      spellDC: R.spellDC(h), spellAtk: R.spellAtk(h), src: h
    };
  }
})();
