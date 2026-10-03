/* DEEP16 spell-gallery stages for the warlock's spells (js/gallery.js applyStage documents the entry): each spell staged to show the way it is meant to be used. */
'use strict';
(function () {
  var S = (window.D16.SPELLSTAGE = window.D16.SPELLSTAGE || {});
  var D = window.D16;
  // a foe's turn begun and a blow at u (forced to land unless atk says otherwise), the caster made whole between so the blows can be watched
  function* blow(c, foe, u, atk) {
    D.rules.startTurn(foe); c.B.active = foe; u.hp = u.maxhp; u.reaction = 1;
    yield* c.B.attack(foe, u, Object.assign({}, foe.weapon, atk != null ? { atk: atk } : {}));
    c.B.active = u;
  }
  // the friend's turn: the full Attack action at t
  function* mateHits(c, t) {
    var m = c.mate; D.rules.startTurn(m); c.B.active = m;
    for (var i = 0; i < 2; i++) { if (t.hp <= 0 || t.dead) break; yield* c.B.exec(m, { do: 'attack', target: t }); yield 14; }
    c.B.active = c.u;
  }
  // the foes soft (AC 10: robed cultists, not plate) so a spell attack is not shown missing
  function soft(c) { c.foes.forEach(function (f) { f.baseAC = 10; }); }
  Object.assign(S, {
    // two beams at 9th level, each its own attack roll: split them to finish a wounded foe and still chip another
    eldritchblast: { tip: "Eldritch Blast is your free, endless attack at 120 ft; each beam is its own attack roll. Send them at different foes to finish a wounded one, or all at one. Stay back and keep firing.",
      foes: [{ word: 'fighter:1', hp: 9, at: [0, 8] }, { word: 'fighter:1', hp: 60, at: [2, 8] }],
      pre: function* (c) { soft(c); } },
    // 10 ft only: the foe has to be in your face; a weak-CON foe fails and takes 2d12
    poisonspray: { tip: "Poison Spray hits hard but only reaches 10 ft, and the foe gets a CON save for nothing. Use it on a close foe with weak CON (a robed caster); it fails against the poison-proof.",
      foes: [{ word: 'fighter:1', hp: 80, at: [0, 2], abil: { con: 6 } }] },
    // a tight crowd of weak foes in the 15-ft cone: nothing to hit for half, three burned
    burninghands: { tip: "Burning Hands is a 15-ft cone: stand close and aim it so a clump of foes is caught, and keep your friends out of the fan. Best early against weak, crowded foes with poor DEX.",
      foes: [{ word: 'fighter:1', hp: 9, at: [0, 2] }, { word: 'fighter:1', hp: 10, at: [1, 3] }, { word: 'fighter:1', hp: 11, at: [-1, 3] }],
      target: function (c) { return { x: c.foes[0].x, y: c.foes[0].y - 1 }; } },
    // a bonus-action Dash: cast, then run, with the foes three squares off and no one adjacent to swing at your back
    expeditiousretreat: { tip: "Expeditious Retreat adds a Dash as a bonus action, on the cast and every turn after. Cast it to run from a fight (leave reach first), or to close the gap to a foe you must catch.",
      foes: [{ word: 'fighter:1', hp: 100, at: [0, 3] }, { word: 'fighter:1', hp: 100, at: [1, 3] }],
      mate: { hp: 'full' },
      after: function* (c) {
        var u = c.u;
        function* run(why) {
          var rm = D.grid.reach(u, u.turn.move), best = null, bd = -1;
          Object.keys(rm).forEach(function (k) {
            var p = k.split(','), x = +p[0], y = +p[1]; if (!rm[k].stand) return;
            var far = Math.min.apply(null, c.foes.map(function (f) { return D.grid.dist(f, { x: x, y: y, size: 1 }); }));
            if (far > bd) { bd = far; best = { x: x, y: y }; }
          });
          if (best && (best.x !== u.x || best.y !== u.y)) { yield* c.B.exec(u, { do: 'move', x: best.x, y: best.y }); c.B.card(['{c}' + u.name + ' ' + why + ': now ' + bd + ' ft from the nearest foe.{/}'], 240); yield 20; }
        }
        yield* run('runs 60 ft in the cast turn (walk + the free Dash)');
        D.rules.startTurn(u); c.B.active = u; // (the next turn: the Dash is a bonus action now, the action stays free)
        yield* c.B.exec(u, { do: 'cdash' });
        yield* run('Dashes again as a bonus action');
      } },
    // a Darkness on the foes with Devil's Sight (the warlock invocation) to see in it: they cannot find you, you see them
    darkness: { tip: "Darkness blinds everyone in it, you too unless you have Devil's Sight. Drop it on the foes (never on yourself) and fight from outside it: they swing at disadvantage and cannot aim spells.",
      foes: [{ word: 'fighter:1', hp: 100, at: [0, 5] }, { word: 'fighter:1', hp: 100, at: [1, 6] }, { word: 'fighter:1', hp: 100, at: [-1, 6] }],
      mate: { hp: 'full' },
      pre: function* (c) { c.u.devilSight = true; },
      target: function (c) { return { x: c.foes[0].x, y: c.foes[0].y }; },
      after: function* (c) { var f = c.foes[0], u = c.u; yield* blow(c, f, u, null); delete u.devilSight; } },
    // a weak-WIS humanoid held: then the friend's blows land as automatic criticals within 5 ft
    holdperson: { tip: "Hold Person paralyzes a humanoid (WIS save, repeated each turn): attacks from within 5 ft auto-crit. Hold the most dangerous humanoid and have a friend hit it. It holds one foe, so it is a poor use against a crowd.",
      foes: [{ word: 'fighter:1', hp: 100, at: [0, 4], abil: { wis: 8 } }, { word: 'fighter:1', hp: 100, at: [2, 6] }],
      mate: { hp: 'full', at: [-1, 4] },
      target: function (c) { return c.foes[0]; },
      after: function* (c, t) { yield* mateHits(c, t); } },
    // three images soak the foe's blows before the caster is hit
    mirrorimage: { tip: "Mirror Image makes three decoys: a blow at you may strike one instead, and a hit pops it. Cast it before melee, never when already surrounded; it fails against foes who do not rely on sight.",
      foes: [{ word: 'fighter:1', hp: 100, at: [0, 1] }],
      mate: { hp: 'full' },
      after: function* (c) {
        var u = c.u, foe = c.foes[0];
        for (var i = 0; i < 6 && (u.images || 0) > 0; i++) { yield* blow(c, foe, u, 12); yield 20; }
      } },
    // three rays: one at the wounded foe to finish it, two at the tough one
    scorchingray: { tip: "Scorching Ray fires three rays, each its own attack roll for 2d6 fire. Spread them to finish wounded foes, or stack all three on one big target. Slot upcasts add more rays.",
      foes: [{ word: 'fighter:1', hp: 6, at: [0, 6] }, { word: 'fighter:1', hp: 100, at: [2, 6] }],
      pre: function* (c) { soft(c); },
      target: function (c) { return { units: [c.foes[0], c.foes[1], c.foes[1]] }; } },
    // a cone over a whole clump of weak-WIS foes, none of the friends in it
    fear: { tip: "Fear fills a 30-ft cone; every foe in it that fails its WIS save drops its weapon and runs from you. Aim it at the whole group and hold concentration. Do not catch your own friends in the cone.",
      foes: [{ word: 'fighter:1', hp: 100, at: [0, 3] }, { word: 'fighter:1', hp: 100, at: [1, 4] }, { word: 'fighter:1', hp: 100, at: [-1, 4] }],
      mate: { hp: 'full' },
      target: function (c) { return { x: c.foes[0].x, y: c.foes[0].y - 1 }; },
      after: function* (c) {
        for (var i = 0; i < c.foes.length; i++) { var f = c.foes[i]; if (f.conds.feared && f.hp > 0) { D.rules.startTurn(f); c.B.active = f; yield* D.tactics.fleeFear(c.B, f); yield 10; } }
        c.B.active = c.u;
      } },
    // the touch at a foe beside you, the caster hurt so the heal shows; the second touch is free
    vampirictouch: { tip: "Vampiric Touch deals 3d6 necrotic and heals you for half. Cast it when hurt and next to a foe; then each turn touch again for free (concentration). Do not leave a pack of foes standing next to you.",
      foes: [{ word: 'fighter:1', hp: 100, at: [0, 1] }],
      mate: { hp: 'full' },
      pre: function* (c) { c.u.hp = Math.floor(c.u.maxhp / 3); soft(c); },
      after: function* (c, t) {
        var u = c.u; D.rules.startTurn(u); c.B.active = u;
        var e2 = D.magic.list(c.B, u).filter(function (x) { return x.id === c.id; })[0];
        if (e2 && e2.ok) yield* c.B.exec(u, { do: 'cast', id: c.id, slot: e2.slot, target: t });
        c.B.card(['{c}' + u.name + ' is at ' + u.hp + ' / ' + u.maxhp + ' hp (the touches heal half of what they deal).{/}'], 240);
      } },
    // the one big threat sent away: a CHA-weak elemental gone, and kept gone while concentrating
    banishment: { tip: "Banishment removes one creature while you concentrate. Use it on the single biggest threat; an elemental, fey, fiend or celestial held all ten rounds never comes back. Concentration breaks: it returns.",
      foes: [{ kind: 'earthelemental', at: [0, 4] }],
      mate: { hp: 'full' },
      target: function (c) { return c.foes[0]; } },
    // a big living foe already wounded: 8d8 necrotic finishes it
    blight: { tip: "Blight deals a heavy 8d8 necrotic (half on a CON save) to one living foe within 30 ft; it does nothing to undead or constructs. Use it on a big living target; it is a poor choice against a crowd.",
      foes: [{ kind: 'ogre', hp: 30, at: [0, 4], abil: { con: 10 } }] },
    // the casting hero and the friend leave the pressing foes for the far side of the floor
    dimensiondoor: { tip: "Dimension Door steps you (and one friend within 5 ft) up to 500 ft away to any square you can see. Use it to escape a melee or a grapple, or to reach an unreachable place; no concentration.",
      foes: [{ word: 'fighter:1', hp: 100, at: [0, 1] }, { word: 'fighter:1', hp: 100, at: [1, 1] }],
      mate: { hp: 'full', at: [-1, 0] },
      target: function (c) {
        var u = c.u, sq = c.B.mistyTargets(u, 500) || [], best = null, bd = -1;
        sq.forEach(function (q) { var far = Math.min.apply(null, c.foes.map(function (f) { return D.grid.dist(f, { x: q[0], y: q[1], size: 1 }); })); if (far > bd && far <= 300) { bd = far; best = { x: q[0], y: q[1] }; } });
        return best;
      },
      after: function* (c) {
        var far = Math.min.apply(null, c.foes.map(function (f) { return D.grid.dist(f, c.u); }));
        c.B.card(['{c}' + c.u.name + ' and the friend beside them stand ' + far + ' ft from the nearest foe: out of the melee with no attack of opportunity.{/}'], 240);
      } },
    // the flames wreathe the caster and bite back at the melee foe
    fireshield: { tip: "Fire Shield halves one kind of damage and burns 2d8 at every foe that hits you in melee. Cast it before the melee starts and let them strike you; it is no help against ranged attacks.",
      foes: [{ word: 'fighter:1', hp: 100, at: [0, 1] }],
      mate: { hp: 'full' },
      after: function* (c) {
        var u = c.u, foe = c.foes[0];
        for (var i = 0; i < 2; i++) { yield* blow(c, foe, u, 40); yield 20; }
      } },
    // a clump of foes in the 10-ft-radius column
    flamestrike: { tip: "Flame Strike calls a column 10 ft wide that deals 4d6 fire and 4d6 radiant, DEX save for half. Drop it on a clump at up to 60 ft: it is one of the strongest area blasts of its level.",
      foes: [{ word: 'fighter:1', hp: 60, at: [0, 6] }, { word: 'fighter:1', hp: 60, at: [1, 6] }, { word: 'fighter:1', hp: 60, at: [-1, 6] }, { word: 'fighter:1', hp: 60, at: [0, 7] }],
      mate: { hp: 'full' },
      target: function (c) { return { x: c.foes[0].x, y: c.foes[0].y }; } },
    // any creature, not just a humanoid: the troll held, the friend's blows crits
    holdmonster: { tip: "Hold Monster is Hold Person for any creature (WIS save, repeated each turn): a paralyzed foe takes automatic criticals from blows within 5 ft. Use it on a brute or a beast that Hold Person cannot touch.",
      foes: [{ kind: 'troll', at: [0, 4], abil: { wis: 8 } }],
      mate: { hp: 'full', at: [-1, 4] },
      target: function (c) { return c.foes[0]; },
      after: function* (c, t) { yield* mateHits(c, t); } }
  });
})();
