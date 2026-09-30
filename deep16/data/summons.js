/* DEEP16 — what a summoning spell may call, and where it comes from (the druid to twelve, 09-30; Griz: "I like it. Build a frame so
   that it's pulling those selections from a place where more to choose from might go as the world expands").
   The place is the bestiary itself (data/foes.js): a creature joins a spell's pool by its creature type and its challenge rating, so a
   beast drawn into the world tomorrow is one the druid can call the day after, with nothing to add here. A sheet keeps itself out with
   `summon: false` (a story's own creature, a thing bound to its pool); a familiar's shape never answers. Per spell: the creature type it
   calls, the SRD 5.1's options (so many, of a challenge rating at most), the multiplier a higher slot brings, and its range.
   The caster (the player, or the AI for its own) picks the creature; the count is the most the spell allows of it (SRD: "Choose one of
   the following options for what appears ... The GM has the creatures' statistics" -- here the bestiary is the GM's book). They fight
   under the AI as if commanded (RULED 09-30: the SRD's "they defend themselves ... but otherwise take no actions" is waived). The
   spells: js/grimoire.js summonSpell. */
'use strict';
(function () {
  var D = window.D16;
  // a challenge rating as a number ('1/4' -> 0.25)
  D.crNum = function (c) { c = String(c == null ? 0 : c); if (c.indexOf('/') > 0) { var p = c.split('/'); return +p[0] / +p[1]; } return +c || 0; };
  D.SUMMON = {
    // SRD 5.1 Conjure Animals (3rd, concentration, an hour): fey spirits in beasts' shapes -- one of CR 2, two of CR 1, four of CR 1/2 or
    // eight of CR 1/4 or lower; twice as many from a 5th-level slot, three times from a 7th, four from a 9th
    conjureanimals: { name: 'Conjure Animals', type: 'beast', range: 60, options: [[1, 2], [2, 1], [4, 0.5], [8, 0.25]], upcast: { 5: 2, 7: 3, 9: 4 }, fey: true },
    // SRD 5.1 Conjure Woodland Beings (4th, concentration, an hour): fey creatures, the same four options; twice from a 6th, three times
    // from an 8th. The bestiary has no fey yet: the spell waits, greyed, for the first one drawn
    conjurewoodlandbeings: { name: 'Conjure Woodland Beings', type: 'fey', range: 60, options: [[1, 2], [2, 1], [4, 0.5], [8, 0.25]], upcast: { 6: 2, 8: 3 } }
  };
  // the world's creatures of a type, up to a challenge rating: the one place a spell looks for them (the summons here; Polymorph's new
  // shapes, js/grimoire.js), the strongest first
  D.pool = function (type, maxCr) {
    var out = [];
    Object.keys(D.FOES).forEach(function (k) {
      var d = D.FOES[k];
      if (!d || d.type !== type || d.summon === false || d.named || d.bound || d.build || !d.sheet || /^fam_/.test(k)) return;
      if (maxCr != null && D.crNum(d.cr) > maxCr) return;
      out.push({ kind: k, cr: d.cr, d: d });
    });
    return out.sort(function (a, b) { return D.crNum(b.cr) - D.crNum(a.cr) || a.d.name.localeCompare(b.d.name); });
  };
  // the bestiary's creatures a spell may call from a slot: each with the most the spell's options allow of it, the strongest first
  D.summonPool = function (id, slot) {
    var S = D.SUMMON[id]; if (!S) return [];
    var mult = 1; Object.keys(S.upcast || {}).forEach(function (k) { if ((slot || 0) >= +k) mult = Math.max(mult, S.upcast[k]); });
    return D.pool(S.type).map(function (p) {
      var c = D.crNum(p.cr), n = 0;
      S.options.forEach(function (o) { if (c <= o[1]) n = Math.max(n, o[0]); });
      return n ? { kind: p.kind, n: n * mult, cr: p.cr, d: p.d } : null;
    }).filter(Boolean);
  };
})();
