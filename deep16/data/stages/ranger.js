/* DEEP16 spell-gallery stages for the ranger's spells (js/gallery.js applyStage documents the entry): each spell staged to show the way it is meant to be used. */
'use strict';
(function () {
  var S = (window.D16.SPELLSTAGE = window.D16.SPELLSTAGE || {});
  var D = window.D16;
  // a blow from a (a foe or a friend) at t, on a fresh turn for the attacker, so the card shows the spell biting
  function* swing(c, a, t) { D.rules.startTurn(a); c.B.active = a; yield* c.B.exec(a, { do: 'attack', target: t }); yield 24; }
  // a unit walks as far toward (x, y) as its turn allows (on a fresh turn)
  function* march(c, a, x, y) {
    D.rules.startTurn(a); c.B.active = a;
    var rm = D.grid.reach(a, a.turn.move), best = null, bd = 1e9;
    Object.keys(rm).forEach(function (k) {
      var p = k.split(','), px = +p[0], py = +p[1];
      if (!rm[k].stand) return;
      var d = Math.max(Math.abs(px - x), Math.abs(py - y));
      if (d < bd) { bd = d; best = { x: px, y: py }; }
    });
    if (best) yield* c.B.exec(a, { do: 'move', x: best.x, y: best.y });
    yield 24;
  }
  // a bestiary foe's own attack (its sheet's `attacks`, not a weapon in hand), by key, at t
  function* strike(c, f, t, key) { D.rules.startTurn(f); c.B.active = f; yield* c.B.attack(f, t, f.attacks[key]); yield 24; }
  function wizardOf(c) { return c.pals.filter(function (w) { return w.cls === 'wizard'; })[0] || c.pals[0]; }
  Object.assign(S, {
    // a wolf of INT 3 with a feeble WIS: it fails the save on nearly any roll, then cannot raise a fang to the caster
    animalfriendship: { tip: "Animal Friendship: a beast of INT 3 or less that fails its WIS save will not attack you. Use it on one wolf, boar or bear that blocks the way, before blows are traded; harming it breaks the charm.",
      foes: [{ kind: 'wolf', at: [-1, 2], abil: { wis: 3 } }, { kind: 'wolf', at: [1, 4], abil: { wis: 3 } }],
      target: function (c) { return c.foes[0]; },
      after: function* (c, t) { yield* swing(c, t, c.u); } },
    // a fog is a wall of sight: archers far behind it cannot see the party, and the party cannot be shot at by those who cannot see it
    fogcloud: { tip: "Fog Cloud: a 20 ft sphere of fog that nothing sees into, out of or across. Drop it between your party and archers or casters to break their line of sight, then retreat or reposition; do not cover your own front line.",
      foes: [{ kind: 'goblin', at: [-1, 10] }, { kind: 'goblin', at: [0, 11] }, { kind: 'goblin', at: [1, 10] }],
      mate: { hp: 'full' },
      target: function (c) { return { x: c.cx, y: c.cy - 6 }; },
      after: function* (c) {
        var f = c.foes[0], w = D.magic.seeWhy(c.B, f, c.u);
        c.B.card([w.ok ? '{o}The goblin archer still sees the druid.{/}' : '{n}The goblin archer cannot see the druid through ' + (w.why || 'the fog') + ': no clear shot.{/}']);
        yield 30;
      } },
    // the ranger's own tool: mark the one big foe you will keep hitting; the druid's blow after shows the extra 1d6
    huntersmark: { tip: "Hunter's Mark is a bonus action: mark the one tough foe you will keep hitting and every weapon hit adds 1d6. When it drops, move the mark for free. Mark early, not on a foe about to die.",
      foes: [{ word: 'fighter:5', at: [-1, 1], hp: 100, normie: true }, { word: 'fighter:2', at: [1, 4], hp: 50 }],
      mate: { hp: 'full' },
      target: function (c) { return c.foes[0]; },
      after: function* (c, t) { c.foes.forEach(function (f) { f.baseAC = 10; }); yield* swing(c, c.u, t); } },
    // a touch buff cast before the long walk: the friend then covers 40 ft where he would cover 30
    longstrider: { tip: "Longstrider: touch a friend and their speed is 10 ft greater for the whole fight, with no concentration. Cast it before closing on or fleeing from a foe, on whoever has to cover ground.",
      foes: [{ word: 'fighter:5', at: [0, 9] }, { word: 'fighter:5', at: [1, 9] }],
      mate: { hp: 'full' },
      target: function (c) { return c.mate; },
      after: function* (c, t) {
        c.B.card(['{c}' + t.name + ': speed ' + t.speed + ' ft (30 and 10 more).{/}']);
        yield 20;
        yield* march(c, t, c.cx, c.cy - 8);
      } },
    // barkskin sets a floor of AC 16: the wizard in robes (AC 12 or so) is the one who gains, and the blows at him show it
    barkskin: { tip: "Barkskin: a touched friend has AC 16 at the least, whatever armor they wear. Best on an unarmored caster or monk who is about to be hit; it does nothing for one already in plate. It needs concentration.",
      foes: [{ word: 'fighter:5', at: [0, 1] }],
      mate: { hp: 'full' },
      target: function (c) { return wizardOf(c); },
      pre: function* (c, t) { c.foes.forEach(function (f) { f.baseAC = 10; }); c.B.card(['{g}' + t.name + ' wears robes: AC ' + D.rules.ac(t) + ' before the spell.{/}']); yield 20; },
      after: function* (c, t) { yield* swing(c, c.foes[0], t); yield* swing(c, c.foes[0], t); } },
    // the veil goes up before the party sneaks past the watch: a friend then hides at +10
    passwithouttrace: { tip: "Pass Without Trace: the whole party within 30 ft gains +10 to Stealth for the length of the spell. Cast it before sneaking past guards or a sleeping lair; it needs concentration, so do not fight under it.",
      foes: [{ word: 'fighter:5', at: [-1, 7] }, { word: 'fighter:5', at: [1, 7] }],
      mate: { hp: 'full' },
      after: function* (c) { var m = c.mate; D.rules.startTurn(m); c.B.active = m; yield* c.B.exec(m, { do: 'hide' }); yield 30; } },
    // a ward on the ground the foes must cross: they stand 40 ft off and each 5 ft they walk in costs them 2d4
    spikegrowth: { tip: "Spike Growth: a 20 ft patch where every 5 ft walked costs 2d4 piercing and is slow going. Put it in a corridor or on the only way to you, so foes must cross it; it also hurts friends who walk in.",
      foes: [{ word: 'fighter:5', at: [-1, 9] }, { word: 'fighter:5', at: [0, 9] }, { word: 'fighter:5', at: [1, 9] }],
      mate: { hp: 'full' },
      target: function (c) { return { x: c.cx, y: c.cy - 6 }; },
      after: function* (c) { yield* march(c, c.foes[0], c.cx - 1, c.cy - 1); yield* march(c, c.foes[1], c.cx, c.cy - 1); } },
    // the cast offers eight small beasts or one big one; the first (the boar) is the one shown: a crowd of bodies that surround and bring down a foe
    conjureanimals: { tip: "Conjure Animals: the beasts you call (eight small ones for the most bites, or one big one) fight for you until concentration ends. Cast it at the start of a fight a few squares from the foe; keep out of harm and do not let your concentration break.",
      foes: [{ word: 'fighter:5', at: [0, 5], hp: 60 }, { word: 'fighter:5', at: [2, 5], hp: 60 }],
      mate: { hp: 'full' },
      target: function (c) { return { x: c.cx, y: c.cy - 3 }; },
      after: function* (c) {
        c.foes.forEach(function (f) { f.baseAC = 10; });
        var an = c.B.units.filter(function (w) { return w.side === 'party' && /^conjureanimals/.test(String(w.id)); });
        for (var i = 0; i < an.length && i < 4; i++) { var a = an[i], k = Object.keys(a.attacks)[0]; yield* strike(c, a, c.foes[0], k); if (an.length === 1) yield* strike(c, a, c.foes[0], k); }
      } }
  });
})();
