/* DEEP16 spell-gallery stages for the wizard's spells (js/gallery.js applyStage documents the entry): each spell staged to show the way it is meant to be used. */
'use strict';
(function () {
  var S = (window.D16.SPELLSTAGE = window.D16.SPELLSTAGE || {});
  // a generator the gallery runs: answers a prompt a rule asks with its first option, as the feature walk does
  function* run(gen) {
    var v;
    for (;;) {
      var r = gen.next(v); v = undefined;
      if (r.done) return r.value;
      var y = r.value;
      if (y && y.prompt) { v = y.prompt.opts[0].value; continue; }
      v = yield y;
    }
  }
  // a foe's blow at victim, on a turn of its own (sure: made to land, as the feature walk's foeStrike does; else its own to-hit stands)
  function* blow(c, foe, victim, sure) {
    var B = c.B, base = foe.weapon || (foe.attacks && (foe.attacks.shortsword || foe.attacks.longsword || foe.attacks.bite || foe.attacks[Object.keys(foe.attacks)[0]])), wp = Object.assign({}, base, sure ? { atk: 40 } : {});
    B.active = foe; c.D.rules.startTurn(foe); victim.reaction = 1;
    yield* run(B.attack(foe, victim, wp));
    B.active = c.u; yield 14;
  }
  // a swing by one of ours at a foe (the unit's own attack through the battle's exec)
  function* swing(c, who, foe) {
    var B = c.B; B.active = who; c.D.rules.startTurn(who);
    yield* run(B.exec(who, { do: 'attack', target: foe }));
    B.active = c.u; yield 14;
  }
  // the same cast again on a fresh turn while the attack roll has not landed its mark (test(): true when it has), up to three times: a nat 1 should not spoil a lesson
  function* castUntil(c, t, e, slot, test) {
    for (var i = 0; i < 3 && !test(); i++) {
      c.B.active = c.u; c.D.rules.startTurn(c.u); if (c.u.conc) c.D.magic.endConc(c.B, c.u, 'a second try');
      yield* run(c.B.exec(c.u, { do: 'cast', id: c.id, slot: slot, target: t })); yield 14;
    }
  }
  function ac(w) { return window.D16.rules.ac(w); }
  Object.assign(S, {
    // the hit-point pool is rolled and spent on the weakest first: three scouts (a pool of 5d8 puts two or three of them down), where a hardened veteran would not sleep at all
    sleep: { tip: 'Sleep rolls 5d8 hit points and puts the WEAKEST to sleep first: aim it at a crowd of low-HP foes (scouts, goblins) early in a fight; it never works on a veteran.',
      foes: [{ word: 'fighter:1', hp: 7, at: [0, 5] }, { word: 'fighter:1', hp: 9, at: [1, 5] }, { word: 'fighter:1', hp: 11, at: [-1, 5] }] },

    // two foes shoulder to shoulder, a third alone: the splash takes the one aimed at and the one beside it
    acidsplash: { tip: "Acid Splash hits two foes standing within 5 ft of each other (DEX save, or 2d6 acid at your level). Aim at a pair, not a lone foe; it is a free cantrip, so open with it.",
      foes: [{ word: 'fighter:3', at: [0, 5] }, { word: 'fighter:3', at: [1, 5] }, { word: 'fighter:3', at: [-5, 6] }] },

    // an attack roll, so a lightly armoured foe (a runner in leather); a plain hit shows the speed it costs
    rayoffrost: { tip: "Ray of Frost needs an attack roll, so it lands best on a lightly armoured foe. A hit slows it by 10 ft until your next turn: use it on the brute charging your soft friends, or on a runner.",
      foes: [{ word: 'fighter:1', at: [0, 6] }],
      pre: function* (c) { c.foes[0].baseAC = 8; },
      after: function* (c, t, e) {
        yield* castUntil(c, t, e, e.slot, function () { return !!t.conds.frosted; });
        var B = c.B; B.active = t; c.D.rules.startTurn(t); B.card(['{g}The ' + t.name + ' starts its turn: it can move only ' + t.turn.move + ' ft, not ' + t.speed + '.{/}'], 300); yield 30; B.active = c.u;
      } },

    // cast it, then the turn after: the staff swing with advantage (the beat of the next round is run by hand)
    truestrike: { tip: "True Strike gives advantage on your NEXT turn's first attack at the target, so it costs this turn's action. Use it before a single big blow (a rogue's sneak attack, a smite), never for a turn you could spend casting.",
      foes: [{ word: 'fighter:1', at: [0, 1] }],
      pre: function* (c) { c.foes[0].baseAC = 8; },
      after: function* (c, t) { var B = c.B; B.round = 2; B.active = c.u; c.D.rules.startTurn(c.u); yield 20; yield* run(B.exec(c.u, { do: 'attack', target: t })); } },

    // before the fight: the temp HP stand between the wizard and the first blow
    falselife: { tip: "False Life lasts the whole fight and costs only a slot: cast it BEFORE the fight, on yourself, while nobody is hitting you. The extra hit points are lost first and give you room to cast.",
      foes: [{ word: 'fighter:3', at: [0, 1] }],
      mate: { hp: 'full' },
      after: function* (c) { var t0 = c.u.temp || 0; yield* blow(c, c.foes[0], c.u, true); c.B.card(['{g}' + c.u.name + ': ' + t0 + ' temporary HP taken, ' + (c.u.temp || 0) + ' left; real hit points ' + c.u.hp + '/' + c.u.maxhp + '.{/}'], 300); yield 20; } },

    // a will that fails (WIS 3): hurt, and no reaction till its turn is out
    glasswhisper: { tip: "Glass Whisper is a WIS save: aim it at a brute with a weak mind (a plain fighter, an ogre), never a priest or wizard. A foe that fails also loses its reaction until its turn ends.",
      foes: [{ word: 'fighter:3', at: [0, 5], abil: { wis: 3 } }] },

    // a 2x2 square on the foes that stand together; the friend waits beside and cuts the one on the floor
    grease: { tip: "Grease covers a 10-ft square: everyone in it makes a DEX save or falls prone, and anyone who walks in later does too. Drop it on a bunch of melee foes, then hit them while they are down; keep your own friends out.",
      foes: [{ word: 'fighter:3', at: [0, 5], abil: { dex: 6 } }, { word: 'fighter:3', at: [1, 5], abil: { dex: 6 } }, { word: 'fighter:3', at: [0, 4], abil: { dex: 6 } }],
      mate: { hp: 'full', at: [-1, 3] },
      pre: function* (c) { c.foes.forEach(function (f) { f.baseAC = 8; }); },
      after: function* (c) { var f = c.foes.filter(function (w) { return w.conds.prone && c.D.grid.dist(c.mate, w) <= 5; })[0]; if (f) yield* swing(c, c.mate, f); } },

    // cast on the wizard, an unarmoured caster (the fighter wears mail, which the spell would not help); the foe's blow is rolled against the new AC
    mageArmor: { tip: "Mage Armor is for someone with NO armour: AC becomes 13 + DEX until the long rest. Cast it on yourself before the day's fights, on a wizard or sorcerer; it does nothing for a friend in mail.",
      foes: [{ word: 'fighter:3', at: [0, 1] }],
      mate: { hp: 'full' },
      target: function (c) { return c.u; },
      pre: function* (c) { c.B.card(['{g}' + c.u.name + ' in robes: AC ' + ac(c.u) + '{/}'], 300); },
      after: function* (c) { yield* blow(c, c.foes[0], c.u, false); } },

    // the mark: the wizard's own hits deal +1d6 and the foe cannot slip out of sight (it starts unseen, as a foe in the dark would)
    mirrorsgaze: { tip: "Mirror's Gaze (a bonus action) marks a foe: your weapon and spell hits on it deal an extra 1d6 psychic, and it cannot hide from you. Cast it, then attack with your action; a bonus action moves it when it drops.",
      foes: [{ word: 'fighter:3', at: [0, 1] }],
      pre: function* (c) { c.foes[0].baseAC = 8; },
      after: function* (c, t) { yield* swing(c, c.u, t); } },

    // the ward goes on the friend who faces the dead: an undead's blows land at disadvantage
    protectionfromevilandgood: { tip: "Protection from Evil and Good guards ONE friend: undead, fiends, fey, elementals, aberrations and celestials attack them at disadvantage and cannot frighten them. Cast it on the one at the front, against those foes.",
      foes: [{ kind: 'skeleton', at: [0, 2] }, { kind: 'skeleton', at: [1, 2] }],
      mate: { hp: 'full', at: [0, 1] },
      target: function (c) { return c.mate; },
      after: function* (c) { yield* blow(c, c.foes[0], c.mate, false); yield* blow(c, c.foes[1], c.mate, false); } },

    // the arrow: an attack roll on an unarmoured foe; the second burn comes at the end of its turn
    acidarrow: { tip: "Acid Arrow does 4d4 now and 2d4 more at the end of the target's next turn; a miss still splashes half. It reaches 90 ft: use it as your opening shot on a tough single foe.",
      foes: [{ word: 'fighter:1', at: [0, 8] }],
      pre: function* (c) { c.foes[0].baseAC = 8; },
      after: function* (c, t) { var B = c.B; B.active = t; c.D.rules.startTurn(t); yield 20; c.D.magic.endTurn(B, t); B.active = c.u; yield 30; } },

    // a foe at the wizard: every blow rolled twice and the worse taken
    blur: { tip: "Blur makes attacks at you roll twice and take the worse (it fails against foes with blindsight or truesight). Cast it on yourself before the foes reach you; a hit can break your concentration, so keep behind your front line.",
      foes: [{ word: 'fighter:3', at: [0, 1] }],
      mate: { hp: 'full' },
      after: function* (c) { yield* blow(c, c.foes[0], c.u, false); } },

    // on the friend who walks first into the dark
    continualflame: { tip: "Continual Flame puts a torch-bright flame with no heat on a weapon or a lantern, and it never goes out and costs no concentration. Cast it once on whoever leads the way into the dark.",
      mate: { hp: 'full' },
      target: function (c) { return c.mate; } },

    darkvision: { tip: "Darkvision lets a friend see 60 ft in the dark, plain grey, till the long rest. Cast it on a human or halfling who has none, before a cave or a night march; lights are not needed.",
      mate: { hp: 'full' },
      target: function (c) { return c.mate; } },

    // the friend swells and strikes: the extra 1d4 on the weapon hit
    enlargereduce: { tip: "Enlarge makes a friend twice the size: +1d4 on weapon hits and strong. Cast it on your best melee fighter (many attacks) before they close; it is concentration. Used on a foe it is Reduce: a CON save to shrink it.",
      foes: [{ word: 'fighter:3', at: [0, 2] }],
      mate: { hp: 'full', at: [0, 1] },
      target: function (c) { return c.mate; },
      pre: function* (c) { c.foes[0].baseAC = 8; },
      after: function* (c) { yield* swing(c, c.mate, c.foes[0]); } },

    // the friend unseen at the front: the foe's blow at disadvantage, then theirs with advantage
    invisibility: { tip: "Invisibility hides a friend until they attack or cast: foes hit them at disadvantage, and their first strike has advantage. Best on a scout or a rogue about to strike; it ends the moment they do.",
      foes: [{ word: 'fighter:3', at: [0, 2] }],
      mate: { hp: 'full', at: [0, 1] },
      target: function (c) { return c.mate; },
      pre: function* (c) { c.foes[0].baseAC = 8; },
      after: function* (c) { yield* blow(c, c.foes[0], c.mate, false); yield* swing(c, c.mate, c.foes[0]); } },

    // the friend is held: Lesser Restoration frees them, and they swing
    lesserrestoration: { tip: "Lesser Restoration ends ONE ailment on a touched friend: paralysis, blindness, poison, deafness or a disease. Best on a paralysed or blinded ally in the fight; it ends only one at a time.",
      foes: [{ word: 'fighter:3', at: [0, 2] }],
      mate: { at: [0, 1], conds: { paralyzed: { by: 'a ghoul' } } },
      target: function (c) { return c.mate; },
      pre: function* (c) { c.foes[0].baseAC = 8; c.mate.hp = c.mate.maxhp; },
      after: function* (c) { yield* swing(c, c.mate, c.foes[0]); } },

    // poisoned friend, a poisoner across: ended, then the venom is halved and the save is easy
    protectionfrompoison: { tip: "Protection from Poison ends a poison and, for the fight, halves poison damage to a friend and gives them an advantage on saves against it. Cast it BEFORE spiders, snakes and drow venom, or to cure a poisoned friend.",
      foes: [{ kind: 'giantspider', at: [0, 2] }],
      mate: { hp: 'full', at: [0, 1], conds: { poisoned: true } },
      target: function (c) { return c.mate; },
      after: function* (c) { yield* blow(c, c.foes[0], c.mate, true); } },

    // the ray at a striker (STR weapon): the next blows it deals are halved
    rayofenfeeblement: { tip: "Ray of Enfeeblement halves the damage of a foe's STR melee weapon blows (not a bow or a finesse blade) while you hold concentration; it can save at the end of each turn. Aim it at the brute hitting your front line.",
      foes: [{ word: 'fighter:3', at: [0, 2] }],
      mate: { hp: 'full', at: [0, 1] },
      pre: function* (c) { c.foes[0].baseAC = 8; },
      after: function* (c, t, e) { yield* castUntil(c, t, e, e.slot, function () { return !!t.conds.enfeebled; }); yield* blow(c, c.foes[0], c.mate, true); } },

    // an invisible foe is a foe the staff cannot see: the spell makes the swing plain
    seeinvisibility: { tip: "See Invisibility shows the unseen for the fight: you can see and hit invisible foes without the penalty. Cast it when something invisible attacks you, or before a ghost or an invisible stalker.",
      foes: [{ word: 'fighter:3', at: [0, 1], conds: { invisible: { by: 'a ring' } } }],
      pre: function* (c) { c.foes[0].baseAC = 8; c.B.card(['{g}Before the spell: the staff swings at what it cannot see.{/}'], 300); yield* swing(c, c.u, c.foes[0]); },
      after: function* (c) { yield* swing(c, c.u, c.foes[0]); } },

    // a floating weapon that strikes at once and on every round after (second round run by hand)
    spiritualweapon: { tip: "Spiritual Weapon is a bonus action and needs no concentration: cast it, then keep casting other spells. Each later turn its bonus action moves it 20 ft and strikes again, 1d8 + your casting stat.",
      foes: [{ word: 'fighter:3', at: [0, 5] }],
      pre: function* (c) { c.foes[0].baseAC = 8; },
      after: function* (c, t, e) { c.B.round = 2; c.D.rules.startTurn(c.u); yield* run(c.B.exec(c.u, { do: 'cast', id: 'spiritualweapon', slot: e.slot, target: t })); } },

    // three foes in one 20-ft cube (up to three), the friend beside and cutting a restrained one with advantage
    web: { tip: "Web fills a 20-ft cube: up to three foes in it make a DEX save or are restrained (attacks at them have advantage). Cast it on a clump of melee foes at range, and keep your friends out of the cube.",
      foes: [{ word: 'fighter:3', at: [0, 4], abil: { dex: 6 } }, { word: 'fighter:3', at: [1, 4], abil: { dex: 6 } }, { word: 'fighter:3', at: [2, 4], abil: { dex: 6 } }],
      mate: { hp: 'full', at: [3, 4] },
      pre: function* (c) { c.foes.forEach(function (f) { f.baseAC = 8; }); },
      after: function* (c) { yield* swing(c, c.mate, c.foes[2]); } }
  });
})();
