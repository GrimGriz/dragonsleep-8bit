/* DEEP16 spell-gallery stages (more of the wizard's spells; js/gallery.js applyStage documents the entry): each spell staged to show the way it is meant to be used. */
'use strict';
(function () {
  var S = (window.D16.SPELLSTAGE = window.D16.SPELLSTAGE || {});
  // a foe takes its turn's start (the clouds, the tentacles) or end (the phantom's bite): the rules' own hooks, so what shows is real
  function* foeStart(c, f) { D.rules.startTurn(f); yield 25; }
  function* foeEnd(c, f) { D.magic.endTurn(c.B, f); yield 25; }
  Object.assign(S, {
    // cast BEFORE the healing: while it holds, each heal on an ally within 30 ft is the most the dice could give; shown with a Cure Wounds after it
    beaconofhope: { tip: "Cast Beacon of Hope BEFORE the healing, with the party hurt and close together: every heal on them is the maximum roll, and they save against WIS tricks with advantage. Keep your concentration.",
      mate: { hp: 6 },
      after: function* (c) { c.u.known.push('curewounds'); c.u.turn.action = 1; yield* c.B.exec(c.u, { do: 'cast', id: 'curewounds', slot: 1, target: c.mate }); } },

    // an even chance each turn's end to slip into the Ethereal (nothing can touch you) till the next turn: shown by ending turns till it takes, then a foe swinging at the empty air
    blink: { tip: "Blink is a minute of protection: at the end of each of your turns, half the time you vanish and nothing can touch you. Cast it before melee starts, on whoever is likely to be hit hardest.",
      foes: [{ word: 'fighter:9', at: [0, 1] }, { word: 'fighter:9', at: [1, 4] }],
      after: function* (c) {
        var n = 0; while (!c.u.ethereal && n++ < 40) { c.u.turn.action = 0; D.magic.endTurn(c.B, c.u); }
        yield 20; var f = c.foes[0]; D.rules.startTurn(f); f.turn.attacksLeft = 0; f.turn.action = 1;
        yield* c.B.exec(f, { do: 'attack', target: c.u }); yield 20; c.B.card(['{g}(Blink: ' + (c.u.ethereal ? 'the blow finds nothing, they are in the Ethereal' : 'not out this time') + '){/}']);
      } },

    // a line 100 ft long: everyone in it takes the full 8d6 (DEX, half): foes stacked in a column from the caster
    lightningbolt: { tip: "Lightning Bolt is a line, 100 ft long: stand so that it runs through the whole enemy column or a row of foes, and keep your friends out of the line. 8d6 to each, half if they dodge.",
      foes: [{ word: 'fighter:9', at: [0, 2], abil: { dex: 6 } }, { word: 'fighter:9', at: [0, 4], abil: { dex: 6 } }, { word: 'fighter:9', at: [0, 6], abil: { dex: 6 } }, { word: 'fighter:9', at: [0, 8], abil: { dex: 6 } }],
      target: function (c) { var f = c.foes[3]; return { x: f.x, y: f.y }; } },

    // a 20-ft sphere of gas: a clump of foes inside it; then their turns begin in it
    stinkingcloud: { tip: "Stinking Cloud fills a 20-ft sphere with gas for a minute: drop it on a CLUSTER and they lose their action each turn they start inside (CON save). It also blocks sight. Do not stand in it.",
      foes: [{ word: 'fighter:9', at: [0, 7], abil: { con: 3 } }, { word: 'fighter:9', at: [1, 7], abil: { con: 3 } }, { word: 'fighter:9', at: [-1, 7], abil: { con: 3 } }, { word: 'fighter:9', at: [0, 8], abil: { con: 3 } }],
      target: function (c) { var f = c.foes[0]; return { x: f.x, y: f.y }; },
      after: function* (c) { for (var i = 0; i < c.foes.length; i++) yield* foeStart(c, c.foes[i]); } },

    // 20-ft cube of tentacles: DEX or 3d6 and restrained; each turn inside they are crushed again
    blacktentacles: { tip: "Black Tentacles holds a 20-ft square: foes who fail DEX are hurt and restrained, then crushed for 3d6 every turn. Use it on slow, clumsy melee foes and cast it where they must walk through.",
      foes: [{ word: 'fighter:9', at: [0, 6], abil: { dex: 6 } }, { word: 'fighter:9', at: [1, 6], abil: { dex: 6 } }, { word: 'fighter:9', at: [0, 7], abil: { dex: 6 } }, { word: 'fighter:9', at: [1, 7], abil: { dex: 6 } }],
      target: function (c) { var f = c.foes[0]; return { x: f.x + 1, y: f.y - 1 }; },
      after: function* (c) { for (var i = 0; i < 2; i++) yield* foeStart(c, c.foes[i]); } },

    // one foe with a weak WIS, in range: frightened, then the phantom's bite each turn's end
    phantasmalkiller: { tip: "Phantasmal Killer is for ONE tough foe with a poor WIS save: it is frightened and takes 4d10 psychic at the end of each turn until it saves. Pick the big brute your party cannot finish; keep concentration.",
      foes: [{ word: 'fighter:9', at: [0, 6], abil: { wis: 5 } }],
      after: function* (c) { yield* foeEnd(c, c.foes[0]); yield* foeEnd(c, c.foes[0]); } },

    // the dangerous one sealed away, a friend free to deal with the rest
    resilientsphere: { tip: "Resilient Sphere seals one creature (DEX save) in force: nothing gets in or out. Use it to take the strongest foe out of a fight, or to shield a fallen friend. It is not damage.",
      foes: [{ kind: 'ogre', at: [0, 4], abil: { dex: 3 } }, { word: 'fighter:9', at: [2, 5] }],
      target: function (c) { return c.foes[0]; },
      mate: { hp: 'full', at: [0, 3] },
      after: function* (c) { var o = c.foes[0]; c.B.card(['{g}' + (o.conds.banished ? 'The ogre is sealed in force: a friend swings at it and cannot touch it, and it cannot act' : 'The ogre rolled clear') + '.{/}']); D.rules.startTurn(c.mate); yield* c.B.exec(c.mate, { do: 'attack', target: o }); yield 20; } },

    // a buff for the front-liner: a foe's blows against the stoneskinned fighter
    stoneskin: { tip: "Stoneskin makes a friend take HALF damage from ordinary weapons (blades, arrows, claws) for ten minutes. Cast it on your front-liner before the fight; it will not stop magic. Concentration.",
      foes: [{ word: 'fighter:9', at: [0, 2] }],
      mate: { hp: 'full', at: [0, 1] },
      target: function (c) { return c.mate; },
      after: function* (c) { var f = c.foes[0], h = c.mate.hp; D.rules.startTurn(f); f.turn.action = 1; yield* c.B.exec(f, { do: 'attack', target: c.mate }); yield 20; c.B.card(['{c}Stoneskin: the fighter lost ' + (h - c.mate.hp) + ' hit points to a blow that would have cost twice that.{/}']); } },

    // invisible, with a double to take the blows: a foe's swing at the wizard
    mislead: { tip: "Mislead makes you invisible and leaves a double: use it when a caster is pinned in melee, then step away and cast from hiding. It ends if you attack or cast, so make the first move count.",
      foes: [{ word: 'fighter:9', at: [0, 2] }, { word: 'fighter:9', at: [1, 3] }],
      after: function* (c) { var f = c.foes[0]; if (!c.u.conds.invisible) yield* D.magic.cast(c.B, c.u, 'mislead', 5, c.u); D.rules.startTurn(f); f.turn.action = 1; yield* c.B.exec(f, { do: 'attack', target: c.u }); yield 20; } }
  });
})();
