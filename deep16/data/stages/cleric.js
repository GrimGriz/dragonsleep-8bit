/* DEEP16 spell-gallery stages for the cleric's spells (js/gallery.js applyStage documents the entry): each spell staged to show the way it is meant to be used. */
'use strict';
(function () {
  var S = (window.D16.SPELLSTAGE = window.D16.SPELLSTAGE || {});
  var D = window.D16;
  // a creature's blow: its weapon, or the first of a bestiary sheet's attacks
  function atkOf(w) { if (w.weapon) return w.weapon; var a = w.attacks; if (a && typeof a === 'object') { var k = Object.keys(a)[0]; return k ? a[k] : null; } return null; }
  // a foe strikes someone (the foe given a turn first, so what reads its turn finds one)
  function* swing(c, foe, tgt) { if (!foe.turn || !foe.turn.action) D.rules.startTurn(foe); var a = atkOf(foe); if (a) yield* c.B.attack(foe, tgt, a); yield 20; }
  // a foe walks to a square (the spell's ground and rings read each step)
  function* walk(c, foe, x, y) { D.rules.startTurn(foe); yield* c.B.exec(foe, { do: 'move', x: x, y: y }); yield 10; }
  // a soft foe: an armour a demonstration can hit
  function soften(foes, ac) { foes.forEach(function (f) { f.baseAC = ac; }); }
  Object.assign(S, {
    // a friend held in vines: Guidance's d4 goes into the check that breaks the hold
    guidance: { tip: "Guidance adds a d4 to one ability check: here, tearing free of vines, a web or a grip. Cast it on the friend BEFORE the check; it is spent on that one roll.",
      foes: [{ word: 'fighter:1', at: [0, 8] }], mate: { hp: 'full' },
      target: function (c) { return c.mate; },
      pre: function* (c) { c.mate.conds.restrained = { dc: 14, kind: 'vines', by: 'gallery' }; yield 10; },
      after: function* (c) { D.rules.startTurn(c.mate); yield* c.B.exec(c.mate, { do: 'breakfree' }); } },
    // bright light is the drow's enemy: the dark-dwellers lose their next turn and fight at disadvantage
    light: { tip: "Light is more than a lamp: bright light dazzles drow, duergar and cloakers. They lose their next turn and attack at disadvantage. Cast it on a friend's gear when those foes close in.",
      foes: [{ kind: 'drowling', at: [0, 5] }, { kind: 'drowling', at: [1, 5] }, { kind: 'drowling', at: [-1, 5] }], mate: { hp: 'full' },
      target: function (c) { return c.mate; },
      after: function* (c) { yield* swing(c, c.foes[0], c.mate); } },
    // a save spell flung at the buffed friend: the d4 is added by itself and spent
    resistance: { tip: "Resistance adds a d4 to the next saving throw your friend rolls, then ends. Cast it on whoever is about to face a save-or-suffer spell; it is a small edge for one roll.",
      foes: [{ word: 'cleric:9', normie: false, hp: 60, at: [0, 6] }], mate: { hp: 'full' },
      target: function (c) { return c.mate; },
      after: function* (c) { var fc = c.foes[0]; fc.known = ['sacredflame']; D.rules.startTurn(fc); yield* c.B.exec(fc, { do: 'cast', id: 'sacredflame', slot: 0, target: c.mate }); } },
    // radiant fire, a save and no attack roll: a weak, clumsy foe that is nearly dead falls to it
    sacredflame: { tip: "Sacred Flame needs no attack roll: the foe saves with DEX, and cover does not help. It is best on clumsy, wounded foes, and it is free damage every turn.",
      foes: [{ word: 'fighter:1', hp: 5, abil: { dex: 6 }, at: [0, 5] }, { word: 'fighter:1', at: [1, 5] }, { word: 'fighter:1', at: [-1, 5] }],
      target: function (c) { return c.foes[0]; } },
    // a spell attack at a soft foe, and the friend swings at it with advantage before the glow fades
    guidingbolt: { tip: "Guiding Bolt hits hard and lights the target: the NEXT attack on it, by anyone, has advantage. Fire it at the foe your fighter is about to hit, or a hard-to-hit one.",
      foes: [{ word: 'fighter:5', at: [0, 5] }], mate: { hp: 'full', at: [-1, 4] },
      target: function (c) { return c.foes[0]; },
      pre: function* (c) { soften(c.foes, 6); yield 5; },
      after: function* (c) { yield* swing(c, c.mate, c.foes[0]); } },
    // touch range: stand next to a soft foe and spend the slot on the biggest single blow
    inflictwounds: { tip: "Inflict Wounds is a touch attack for 3d10 necrotic, a big hit for a first-level slot. You must stand next to the foe, so open with it on a lone, lightly armoured target.",
      foes: [{ word: 'fighter:5', at: [1, 1] }], mate: { hp: 'full' },
      target: function (c) { return c.foes[0]; },
      pre: function* (c) { soften(c.foes, 6); yield 5; } },
    // the wounded friend is warded before the foes strike: each must pass a WIS save, the weak-willed do not
    sanctuary: { tip: "Sanctuary wards one ally: a foe must pass a WIS save to strike them, or the blow is lost. Cast it on a wounded friend before foes reach them. It ends if the ward-bearer attacks.",
      foes: [{ word: 'fighter:5', abil: { wis: 4 }, at: [0, 3] }, { word: 'fighter:5', abil: { wis: 4 }, at: [1, 3] }], mate: { at: [0, 2] },
      target: function (c) { return c.mate; },
      after: function* (c) { yield* swing(c, c.foes[0], c.mate); yield* swing(c, c.foes[1], c.mate); } },
    // the tank in front of three foes, bonded to the cleric behind: half of every blow is the cleric's
    wardingbond: { tip: "Warding Bond gives an ally +1 AC and saves and halves the damage they take, but you take that half. Bond your tank before a brawl, and stay healthy enough to share it.",
      foes: [{ word: 'fighter:5', at: [0, 2] }, { word: 'fighter:5', at: [1, 2] }, { word: 'fighter:5', at: [2, 2] }], mate: { hp: 'full', at: [1, 1] },
      target: function (c) { return c.mate; },
      pre: function* (c) { c.mate.baseAC = 10; yield 5; },
      after: function* (c) { for (var i = 0; i < 3; i++) yield* swing(c, c.foes[i], c.mate); } },
    // a weak-willed brute, WIS save failed, and the cleric's own mace blow carries the extra 1d8
    bestowcurse: { tip: "Bestow Curse is a touch spell with a WIS save: pick +1d8 necrotic on your attacks against it, or its attacks at you at disadvantage. Use on a lone brute with low WIS; it needs concentration.",
      foes: [{ word: 'fighter:5', abil: { wis: 4 }, at: [1, 1] }], mate: { hp: 'full' },
      target: function (c) { return c.foes[0]; },
      after: function* (c) { yield* swing(c, c.u, c.foes[0]); } },
    // dark-dwellers in the open, and a Darkness they cast that the daylight burns away
    daylight: { tip: "Daylight fills 60 feet with bright light: it dazzles drow and duergar, and it burns away a Darkness of 3rd level or lower. Cast it where the dark-dwellers gather, or to burn out their Darkness.",
      foes: [{ word: 'wizard:9', normie: false, hp: 60, at: [0, 5] }, { kind: 'drowling', at: [1, 6] }, { kind: 'drowling', at: [-1, 6] }],
      target: function (c) { return { x: c.foes[0].x, y: c.foes[0].y }; },
      pre: function* (c) { var w = c.foes[0]; D.rules.startTurn(w); yield* c.B.exec(w, { do: 'cast', id: 'darkness', slot: 2, target: { x: w.x, y: w.y } }); yield 30; } },
    // a haste the foe wizard has put on itself: Dispel Magic takes it off at once
    dispelmagic: { tip: "Dispel Magic strips the spells from a foe: a Haste, a ward, a held concentration. A spell of 3rd level or lower ends at once. Aim it at the buffed caster; it works on spell areas too.",
      foes: [{ word: 'wizard:9', normie: false, hp: 60, at: [0, 5] }, { word: 'fighter:1', at: [1, 5] }, { word: 'fighter:1', at: [-1, 5] }],
      target: function (c) { return c.foes[0]; },
      pre: function* (c) { var w = c.foes[0]; D.rules.startTurn(w); yield* c.B.exec(w, { do: 'cast', id: 'haste', slot: 3, target: w }); yield 30; } },
    // the whole party hurt and one down: six allies in 60 feet heal at once, the fallen get up
    masshealingword: { tip: "Mass Healing Word heals up to six allies within 60 feet as a bonus action, and gets the fallen back on their feet. Use it when several friends are hurt or one is down, then still attack.",
      foes: [{ word: 'fighter:5', at: [0, 6] }],
      pre: function* (c) { c.pals.concat([c.u]).forEach(function (w) { w.hp = Math.floor(w.maxhp / 3); }); var dr = c.pals.filter(function (w) { return w.cls === 'druid'; })[0] || c.pals[0]; dr.hp = 0; dr.ko = true; yield 10; },
      target: function (c) { return { units: [c.mate, c.u].concat(c.pals) }; } },
    // the foes charge across the ring: half speed and 3d8 radiant on entering
    spiritguardians: { tip: "Spirit Guardians rings you for 15 feet: foes move at half speed in it and take 3d8 radiant (WIS save halves) each turn. Cast it when foes are about to close in, and keep fighting in the middle.",
      foes: [{ word: 'fighter:5', at: [1, 5] }, { word: 'fighter:5', at: [2, 5] }, { word: 'fighter:5', at: [0, 5] }],
      after: function* (c) { for (var i = 0; i < c.foes.length; i++) yield* walk(c, c.foes[i], c.foes[i].x, c.cy - 2); } },
    // the death ward holds: a blow that would drop the friend leaves them at 1
    deathward: { tip: "Death Ward lasts the whole fight: the first blow that would drop the ally to 0 leaves them at 1 instead. Cast it on your front-liner BEFORE the fight; do not wait until they are down.",
      foes: [{ word: 'fighter:5', at: [0, 3] }], mate: { hp: 'full' },
      target: function (c) { return c.mate; },
      after: function* (c) { c.B.card(['{r}A killing blow comes down on ' + c.mate.name + '.{/}'], 200); yield 20; c.B.hurt(c.mate, c.mate.hp + 40, 'slashing'); yield 40; } },
    // a guardian set where the foes must pass: each coming near it takes 20 radiant until it has spent its 60
    guardianoffaith: { tip: "Guardian of Faith stands still and hits any foe that comes within 10 feet for 20 radiant (half if they save) until it has dealt 60. Set it on the path the foes will walk, or in a doorway.",
      foes: [{ word: 'fighter:5', at: [1, 6] }, { word: 'fighter:5', at: [2, 6] }, { word: 'fighter:5', at: [0, 6] }],
      target: function (c) { return { x: c.cx + 1, y: c.cy - 3 }; },
      after: function* (c) { for (var i = 0; i < c.foes.length; i++) yield* walk(c, c.foes[i], c.foes[i].x, c.cy - 1); } },
    // a poor-constitution foe: the disease lands, and three failed saves take its sight
    contagion: { tip: "Contagion needs a touch attack, then the foe makes CON saves each turn: three failures and the disease takes hold (blinded). Best on a soft foe with a weak CON, early in the fight.",
      foes: [{ word: 'fighter:5', abil: { con: 3 }, at: [1, 1] }], mate: { hp: 'full' },
      target: function (c) { return c.foes[0]; },
      pre: function* (c) { soften(c.foes, 6); yield 5; },
      after: function* (c) { var f = c.foes[0]; for (var i = 0; i < 3 && f.conds.contagion && !f.conds.contagion.held; i++) { D.magic.onEnd(c.B, f); yield 40; } } },
    // the dead at the cleric's side: every blow of theirs at disadvantage
    dispelevilandgood: { tip: "Dispel Evil and Good makes undead, fiends, fey, elementals, aberrations and celestials attack you at disadvantage. Cast it when they close in on your cleric; it needs concentration.",
      foes: [{ kind: 'skeleton', at: [1, 1] }, { kind: 'skeleton', at: [2, 1] }, { kind: 'skeleton', at: [0, 1] }],
      after: function* (c) { for (var i = 0; i < c.foes.length; i++) yield* swing(c, c.foes[i], c.u); } }
  });
})();
