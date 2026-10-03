/* DEEP16 spell-gallery stages for the sorcerer's spells (js/gallery.js applyStage documents the entry): each spell staged to show the way it is meant to be used. */
'use strict';
(function () {
  var S = (window.D16.SPELLSTAGE = window.D16.SPELLSTAGE || {});
  // a crowd packed round one square (dx, dy north of the party): the shape an area spell wants
  function pack(n, cx, cy, hp) {
    var at = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1]].slice(0, n);
    return at.map(function (d, i) { return { word: 'fighter:1', hp: Array.isArray(hp) ? hp[i] : hp, at: [cx + d[0], cy + d[1]] }; });
  }
  Object.assign(S, {
    // the dead cannot be healed past it and the grave's hand weighs on them: a skeleton struck, then its own turn against the caster at disadvantage
    chilltouch: { tip: "Chill Touch stops a foe healing till your next turn, and an undead it hits attacks you at disadvantage: use it on the undead and on any foe a healer is propping up.",
      foes: [{ kind: 'skeleton', hp: 30, at: [0, 3] }, { word: 'fighter:1', at: [2, 6] }, { word: 'fighter:1', at: [-2, 6] }],
      target: function (c) { return c.foes[0]; },
      after: function* (c) { yield* c.D.ai.turn(c.B, c.foes[0]); } },
    // a lone foe at range: the cantrip every caster has -- 120 ft, it never needs a slot
    firebolt: { tip: "Fire Bolt reaches 120 ft and costs no slot: use it every turn you have nothing better. Fire also stops a troll regenerating, and it lights anything flammable.",
      foes: [{ kind: 'troll', hp: 60, at: [0, 6] }],
      target: function (c) { return c.foes[0]; },
      after: function* (c) { yield* c.D.ai.turn(c.B, c.foes[0]); } },
    // touch range, advantage on metal armour, and a foe that may not react: grasp it, then step away free
    shockinggrasp: { tip: "Shocking Grasp gets advantage on a foe in metal armour and takes its reaction: strike, then walk away and it cannot take a swing at you as you leave.",
      foes: [{ word: 'fighter:1', at: [0, 1] }],
      target: function (c) { return c.foes[0]; },
      after: function* (c) {
        var f = c.foes[0], ok = f.reaction === 0 || (f.conds && f.conds.noReact);
        yield* c.B.exec(c.u, { do: 'move', x: c.cx, y: c.cy + 2 });
        c.B.card(['{y}' + c.u.name + '{/} walks away from the shocked foe: ' + (ok ? '{n}no reaction, so no opportunity attack{/}.' : '{o}it still had its reaction{/}.')], 300); yield 20;
      } },
    // the cone's pool of hit points blinds the WEAKEST first: three scouts under it, one tough foe left out
    colorspray: { tip: "Color Spray rolls hit points and blinds the weakest foes first, whichever are in the 15-ft cone: use it on a pack of weak foes early in a fight, never on one strong one. It catches your friends too.",
      foes: [{ word: 'fighter:1', hp: 6, at: [0, 2] }, { word: 'fighter:1', hp: 8, at: [-1, 3] }, { word: 'fighter:1', hp: 10, at: [1, 3] }, { word: 'fighter:1', hp: 90, at: [0, 3] }],
      target: function (c) { return { x: c.cx, y: c.cy - 3 }; },
      after: function* (c) { yield* c.D.ai.turn(c.B, c.foes[0]); } },
    // never misses: all three darts on one hurt foe to finish it
    magicmissile: { tip: "Magic Missile never misses and ignores cover: put all the darts into one wounded foe to finish it, or into a caster to break its concentration. A higher slot adds darts.",
      foes: [{ word: 'fighter:1', hp: 9, at: [0, 5] }, { word: 'fighter:1', at: [2, 6] }, { word: 'fighter:1', at: [-2, 6] }],
      target: function (c) { return { units: [c.foes[0], c.foes[0], c.foes[0]] }; } },
    // a bonus action: out of the melee (no attack of opportunity), 30 ft to a square you see, and the foe must chase
    mistystep: { tip: "Misty Step is a bonus action: step out of a melee 30 ft to a square you can see, with no opportunity attack, then cast with your action. Pick a square the foe cannot reach this turn.",
      foes: [{ word: 'fighter:1', at: [0, 1] }, { word: 'fighter:1', at: [1, 1] }],
      target: function (c) {
        var sq = c.B.mistyTargets(c.u, 30, true), best = null;
        sq.forEach(function (q) { var d = Math.min.apply(null, c.foes.map(function (f) { return c.D.grid.dist(f, c.u, q[0], q[1]); })); if (!best || d > best.d) best = { d: d, x: q[0], y: q[1] }; });
        return best ? { x: best.x, y: best.y } : null;
      } },
    // the area wants a crowd: five foes packed inside the 20-ft sphere, far from the party
    fireball: { tip: "Fireball burns a 20-ft sphere out to 150 ft for 8d6, DEX save for half: aim at the middle of the biggest crowd, well away from your friends, and spend it on three or more foes.",
      foes: pack(5, 0, 8, [15, 20, 24, 30, 60]),
      target: function (c) { return { x: c.cx, y: c.cy - 8 }; } },
    // a buff on the one who fights: the friend, in the front, then his turn with the extra attack
    haste: { tip: "Haste doubles speed, adds +2 AC and one more attack: cast it on your strongest fighter before the melee and keep your concentration; when it ends he loses a turn.",
      foes: [{ word: 'fighter:1', at: [0, 3] }],
      mate: { hp: 'full', at: [0, 1] },
      target: function (c) { return c.mate; },
      after: function* (c) {
        var m = c.mate, f = c.foes[0], n = 0;
        c.D.rules.startTurn(m); c.B.card(['{y}' + m.name + '{/}, hasted: {c}' + (m.turn.hasteAction ? 'one more attack, speed doubled, +2 AC' : 'no extra action?') + '{/}.'], 300); yield 10;
        for (var i = 0; i < 6 && m.turn && f.hp > 0; i++) { if (i > 0 && !m.turn.attacksLeft) break; yield* c.B.exec(m, { do: 'attack', target: f }); n++; }
      } },
    // a beast with a weak mind: a giant boar turned on its own pack
    dominatebeast: { tip: "Dominate Beast turns a beast to your side if it fails a WIS save: take the biggest beast in the fight and let it maul its friends. Each time it is hurt it saves again, so shield it.",
      foes: [{ kind: 'giantboar', abil: { wis: 4 }, at: [0, 5] }, { word: 'fighter:1', at: [1, 6] }, { word: 'fighter:1', at: [-1, 6] }],
      target: function (c) { return c.foes[0]; },
      after: function* (c) { yield* c.D.ai.turn(c.B, c.foes[0]); } },
    // the friend in the front: unseen, a foe strikes at disadvantage and he strikes with advantage
    greaterinvisibility: { tip: "Greater Invisibility lasts the whole fight and survives attacking: cast it on your best attacker, or on the one the foes hammer. Attacks on them have disadvantage, and theirs have advantage.",
      foes: [{ word: 'fighter:1', at: [0, 3] }],
      mate: { hp: 'full', at: [0, 1] },
      target: function (c) { return c.mate; },
      pre: function* (c) { c.foes[0].x = c.cx; c.foes[0].y = c.cy - 2; c.D.grid.setup(c.D.grid.map, c.B.units); yield 1; },
      after: function* (c) {
        c.D.rules.startTurn(c.foes[0]); yield* c.B.exec(c.foes[0], { do: 'attack', target: c.mate });
        c.D.rules.startTurn(c.mate); yield* c.B.exec(c.mate, { do: 'attack', target: c.foes[0] });
      } },
    // hail on a crowd at 300 ft, and the ground it falls on turns difficult
    icestorm: { tip: "Ice Storm drops a 20-ft sphere of hail from up to 300 ft and leaves the ground difficult: aim it at a crowd far from your friends, and pick it over Fireball when they run at you.",
      foes: pack(5, 0, 9, 40),
      target: function (c) { return { x: c.cx, y: c.cy - 9 }; } },
    // a brute the party cannot handle becomes a snake: WIS save, so aim it at a dull-witted one
    polymorph: { tip: "Polymorph turns a dangerous foe into a harmless beast on a failed WIS save: aim it at the strongest brute with a weak mind, such as an ogre. On a willing friend it grants a beast's hit points.",
      foes: [{ kind: 'ogre', abil: { wis: 4 }, at: [0, 4] }, { word: 'fighter:1', at: [2, 6] }, { word: 'fighter:1', at: [-2, 6] }],
      target: function (c) { return c.foes[0]; } },
    // the wall laid across their line: the whole row burns as it rises
    walloffire: { tip: "Wall of Fire burns whoever is where it rises and whoever crosses it: raise it across a charging line, or to split the foes. It blocks sight, and you must hold concentration.",
      foes: pack(1, 0, 5, 60).concat([{ word: 'fighter:1', hp: 60, at: [-2, 5] }, { word: 'fighter:1', hp: 60, at: [2, 5] }, { word: 'fighter:1', hp: 60, at: [-1, 5] }, { word: 'fighter:1', hp: 60, at: [1, 5] }]),
      target: function (c) { return { x: c.cx, y: c.cy - 5 }; } },
    // weak constitutions in a bunch, a fog that stays: it hurts again when they start their turn in it
    cloudkill: { tip: "Cloudkill is a poison fog that rolls toward you and hurts everything in it each turn: use it on weak-bodied foes in a bunch while they hold a choke point, and keep your distance.",
      foes: pack(5, 0, 7, 40),
      target: function (c) { return { x: c.cx, y: c.cy - 7 }; },
      after: function* (c) { for (var i = 0; i < c.foes.length; i++) { if (c.foes[i].hp > 0) c.D.rules.startTurn(c.foes[i]); } yield 20; } },
    // the cone's best use: a packed crowd close in, the whole cone full of them
    coneofcold: { tip: "Cone of Cold is a 60-ft cone, CON save for half, 8d8: stand so the foes pack into the widening cone, three or more at once, and keep your friends out of its line.",
      foes: [{ word: 'fighter:1', hp: 30, at: [0, 4] }, { word: 'fighter:1', hp: 30, at: [1, 5] }, { word: 'fighter:1', hp: 30, at: [-1, 5] }, { word: 'fighter:1', hp: 30, at: [0, 6] }, { word: 'fighter:1', hp: 30, at: [2, 7] }],
      target: function (c) { return { x: c.cx, y: c.cy - 5 }; } },
    // locusts: difficult ground and damage that keeps coming, on a crowd that cannot easily leave it
    insectplague: { tip: "Insect Plague fills a 20-ft sphere out to 300 ft with locusts: difficult ground and damage when they enter or end a turn there. Cast it on a crowd to slow a charge, and hold concentration.",
      foes: pack(5, 0, 8, 60),
      target: function (c) { return { x: c.cx, y: c.cy - 8 }; },
      after: function* (c) { for (var i = 0; i < c.foes.length; i++) { if (c.foes[i].hp > 0) c.D.magic.endTurn(c.B, c.foes[i]); } yield 20; } },
    // the wall between you and them: it pushes out whoever stands where it rises, and nothing passes
    wallofstone: { tip: "Wall of Stone raises a barrier nothing passes or sees through: put it across a corridor to cut off half the foes, or to guard your casters, and keep your side of it.",
      foes: [{ word: 'fighter:1', at: [0, 3] }, { word: 'fighter:1', at: [1, 5] }, { word: 'fighter:1', at: [-1, 5] }],
      target: function (c) { return { x: c.cx, y: c.cy - 3 }; },
      pre: function* (c) { c.y0 = c.foes[0].y; yield 1; },
      after: function* (c) {
        var f = c.foes[0];
        c.B.card(['{y}The Fighter{/} where the stone rose was shoved out: {n}' + ((c.y0 - f.y) * 5) + ' ft further off, on the far side{/}.'], 300); yield 20;
        yield* c.D.ai.turn(c.B, c.foes[1]);
      } }
  });
})();
