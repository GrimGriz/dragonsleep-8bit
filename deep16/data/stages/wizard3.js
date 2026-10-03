/* DEEP16 spell-gallery stages (more of the wizard's spells; js/gallery.js applyStage documents the entry): each spell staged to show the way it is meant to be used. */
'use strict';
(function () {
  var S = (window.D16.SPELLSTAGE = window.D16.SPELLSTAGE || {});
  // a plain fighter of the stage at (dx, dy), its weak save named (abil: { dex: 3 } fails a DC 17 on any roll), and anything else the entry wants (hp, conds)
  function F(dx, dy, abil, o) { return Object.assign({ word: 'fighter:9', at: [dx, dy], abil: abil || {} }, o || {}); }
  // the party into the south-east corner of the floor, the foes' crowd in the north-west: a 60-ft sphere is cast from outside its own radius, the way a player would
  // stand (the floor is an octagon, rows 1 to 12: nowhere on it is further than this)
  function far(c) {
    var at = [[13, 12], [14, 11], [14, 10], [15, 10]];
    [c.u, c.mate].concat(c.pals).forEach(function (w, i) { w.x = at[i][0]; w.y = at[i][1]; });
    c.D.grid.setup(c.D.grid.map, c.B.units);
  }
  // a crowd of n plain fighters packed round (dx, dy), the weak save named
  function crowd(dx, dy, abil, pts) { return pts.map(function (p) { return F(dx + p[0], dy + p[1], abil); }); }
  var PACK5 = [[0, 0], [-2, -1], [2, -1], [-1, 1], [1, 1]];
  function at(c, i) { return { x: c.foes[i].x, y: c.foes[i].y }; }
  Object.assign(S, {
    chainlightning: { tip: "Chain Lightning hits one foe and then three more within 30 ft of it. Aim at a bunched group, with the middle one as the first target; it does nothing against a lone foe.",
      foes: [F(0, 5, { dex: 3 }), F(-2, 5, { dex: 3 }), F(2, 4, { dex: 3 }), F(1, 7, { dex: 3 })], mate: { hp: 'full' } },
    circleofdeath: { tip: "Circle of Death is a huge 60-ft sphere: put it on a crowd at long range, well clear of your own side. Great against a horde; useless on one foe.",
      foes: crowd(-5, 7, { con: 3 }, [[0, 0], [-2, -1], [2, -1], [-1, 1], [1, 1], [3, 1]]), mate: { hp: 'full' },
      pre: function* (c) { far(c); }, target: function (c) { return at(c, 0); } },
    disintegrate: { tip: "Disintegrate does 10d6+40 force to one foe, and a foe it drops is gone. Save it for the single biggest threat, once it is hurt; a Dex save takes the whole blow away.",
      foes: [F(0, 5, { dex: 3 }, { hp: 50 }), F(-2, 6, { dex: 3 }), F(2, 6, { dex: 3 })], mate: { hp: 'full' }, target: function (c) { return c.foes[0]; } },
    eyebite: { tip: "Eyebite lets you pick on a new foe every action while you concentrate. Use it on foes with a weak Wisdom save, asleep or panicked or sickened; a hurt foe wakes, so do not attack the sleeper.",
      foes: [F(0, 4, { wis: 3 }), F(-2, 5, { wis: 3 }), F(2, 5, { wis: 3 })], mate: { hp: 'full' }, target: function (c) { return c.foes[0]; } },
    fleshtostone: { tip: "Flesh to Stone restrains a foe at once, then stiffens it a little at each of its turns: three failed Con saves and it is stone, out of the fight. Concentrate and keep it safe.",
      foes: [F(0, 4, { con: 3 }), F(-2, 5), F(2, 5)], mate: { hp: 'full' }, target: function (c) { return c.foes[0]; },
      after: function* (c) { for (var i = 0; i < 3; i++) { yield 24; c.D.magic.onEnd(c.B, c.foes[0]); } } },
    freezingsphere: { tip: "Freezing Sphere: a 60-ft ball of cold from a long way off. Drop it on a crowd that is far from your friends; Con saves halve it, so aim at foes with poor Constitution.",
      foes: crowd(-5, 7, { con: 3 }, PACK5), mate: { hp: 'full' }, pre: function* (c) { far(c); }, target: function (c) { return at(c, 0); } },
    globeofinvulnerability: { tip: "Globe of Invulnerability stops every spell of 5th level or lower cast from outside it. Raise it round your own casters when an enemy wizard is throwing fireballs, and fight from inside.",
      foes: [{ word: 'wizard:9', at: [0, 6], abil: { int: 8 }, normie: false }], mate: { hp: 'full', at: [1, 0] },
      pre: function* (c) { var w = c.foes[0]; w.known = ['fireball']; w.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; w.slotsMax = w.slots.slice(); c.B.units.forEach(function (x) { x.hp = x.maxhp; }); },
      target: function (c) { return c.u; },
      after: function* (c) { var w = c.foes[0]; c.D.rules.startTurn(w); yield* c.B.exec(w, { do: 'cast', id: 'fireball', slot: 3, target: { x: c.u.x, y: c.u.y } }); } },
    harm: { tip: "Harm does 14d6 necrotic to one foe, and if it fails its Con save its maximum hit points drop for the rest of the fight. Use it on a tough foe; it never kills outright.",
      foes: [F(0, 4, { con: 3 }), F(-2, 5), F(2, 5)], mate: { hp: 'full' }, target: function (c) { return c.foes[0]; } },
    irresistibledance: { tip: "Irresistible Dance has no first save: the foe cannot move and swings at disadvantage, and attacks at it have advantage. Hold the big hitter, then let your fighter cut it down.",
      foes: [F(1, 2, { wis: 8 }), F(-2, 5), F(2, 5)], mate: { hp: 'full', at: [1, 1] }, target: function (c) { return c.foes[0]; },
      after: function* (c) { yield* c.B.attack(c.mate, c.foes[0], c.mate.weapon); } },
    trueseeing: { tip: "True Seeing gives truesight to 120 ft to one friend: the dark, fog and invisible are plain to them. Cast it before facing a foe you cannot see, then have that friend strike.",
      foes: [F(1, 2, {}, { conds: { invisible: { by: 'gallery' } } }), F(-2, 6), F(2, 6)], mate: { hp: 'full', at: [1, 1] },
      target: function (c) { return c.mate; },
      after: function* (c) { yield* c.B.attack(c.mate, c.foes[0], c.mate.weapon); } },
    arcanesword: { tip: "Arcane Sword is a spell attack for 3d10 force, then each turn a bonus action moves it and strikes again. Cast it early, keep concentrating, and swing it every turn at a foe with a low AC.",
      foes: [F(0, 4), F(-2, 5), F(2, 5)], mate: { hp: 'full' }, pre: function* (c) { c.foes[0].baseAC = 10; }, target: function (c) { return c.foes[0]; },
      after: function* (c) { yield* c.B.exec(c.u, { do: 'cast', id: 'arcanesword', slot: 7, target: c.foes[0] }); } },
    delayedblastfireball: { tip: "Delayed Blast Fireball waits as a bead and grows a d6 for every turn you hold it. Set it on a bunched crowd, keep concentrating, and let it burst when it is biggest.",
      foes: crowd(0, 7, { dex: 3 }, PACK5), mate: { hp: 'full' }, target: function (c) { return at(c, 0); },
      after: function* (c) { c.D.magic.onStart(c.B, c.u); yield 20; c.D.magic.onStart(c.B, c.u); yield 20; c.D.magic.endConc(c.B, c.u, 'burst'); yield 40; } },
    divineword: { tip: "Divine Word works by hit points: foes at 50 or fewer are deafened, 40 blinded, 30 stunned, 20 or fewer drop. Use it late, after the fight has worn the foes down; a fresh crowd shrugs it off.",
      foes: [F(0, 4, { cha: 3 }, { hp: 18 }), F(-2, 4, { cha: 3 }, { hp: 28 }), F(2, 4, { cha: 3 }, { hp: 38 }), F(-1, 6, { cha: 3 }, { hp: 48 }), F(1, 6, { cha: 3 })], mate: { hp: 'full' } },
    etherealness: { tip: "Etherealness takes you out of the fight until your next turn: nothing can touch you. Use it to escape a bad spot or reposition, not to attack.",
      foes: [F(0, 1), F(-2, 5), F(2, 5)], mate: { hp: 'full' } },
    fingerofdeath: { tip: "Finger of Death does 7d8+30 necrotic to one foe (half on a Con save). It is a finisher: aim it at a foe already hurt, and a foe that dies will not rise to bother you.",
      foes: [F(0, 4, { con: 3 }, { hp: 45 }), F(-2, 5), F(2, 5)], mate: { hp: 'full' }, target: function (c) { return c.foes[0]; } },
    firestorm: { tip: "Fire Storm is a 20-ft burst of 7d10 fire, long range. Drop it on a packed crowd; Dex saves halve it. Keep your own side clear: it burns friends as well.",
      foes: crowd(0, 7, { dex: 3 }, PACK5), mate: { hp: 'full' }, target: function (c) { return at(c, 0); } },
    prismaticspray: { tip: "Prismatic Spray is a 60-ft cone: each foe in it rolls its own ray (damage, restrained, blinded). Stand so the cone sweeps the whole line; it is best at short to middle range against a spread-out crowd.",
      foes: [F(0, 5, { dex: 3 }), F(-2, 6, { dex: 3 }), F(2, 6, { dex: 3 }), F(-1, 8, { dex: 3 }), F(1, 8, { dex: 3 })], mate: { hp: 'full' }, target: function (c) { return at(c, 0); } },
    regenerate: { tip: "Regenerate heals 4d8+15 at once, then 1 HP at the start of every turn. Cast it on a badly hurt friend who is touching you, early enough that the slow healing counts.",
      foes: [F(0, 5), F(-2, 6), F(2, 6)], mate: { at: [0, -1] }, target: function (c) { return c.mate; },
      after: function* (c) { var hp0 = c.mate.hp; c.D.magic.onStart(c.B, c.mate); c.B.card(['{n}' + c.mate.name + ' knits on: ' + hp0 + ' to ' + c.mate.hp + ' HP at the start of the turn.{/}'], 240); yield 20; } },
    symbol: { tip: "Symbol lays a trap on a square. The first foe to step on it sets it off: every foe within 60 ft, Wisdom save or stunned. Put it in a doorway or on the path the foes must take.",
      foes: [F(0, 4, { wis: 3 }), F(-2, 5, { wis: 3 }), F(2, 5, { wis: 3 })], mate: { hp: 'full' }, target: function (c) { return { x: c.cx, y: c.cy - 1 }; },
      after: function* (c) { var f = c.foes[0]; f.x = c.cx; f.y = c.cy - 1; c.D.grid.setup(c.D.grid.map, c.B.units); c.D.magic.stepInto(c.B, f); yield 40; } },
    earthquake: { tip: "Earthquake shakes a huge area for 10 rounds: foes there can be thrown prone and lose their concentration. Cast it far from your friends, on a force that has to cross open ground.",
      foes: crowd(0, 8, { dex: 3 }, PACK5), mate: { hp: 'full' }, target: function (c) { return at(c, 0); },
      after: function* (c) { for (var i = 0; i < c.foes.length; i++) { c.D.magic.onStart(c.B, c.foes[i]); yield 10; } } },
    feeblemind: { tip: "Feeblemind wrecks a spellcaster: 4d6 psychic, then an Intelligence save or its mind is gone, no more spells. Aim it at the enemy wizard; it does nothing useful to a fighter.",
      foes: [{ word: 'wizard:9', at: [0, 5], abil: { int: 3 }, normie: false }, F(-2, 6), F(2, 6)], mate: { hp: 'full' }, target: function (c) { return c.foes[0]; } },
    holyaura: { tip: "Holy Aura gives you and your friends within 30 ft advantage on every save, and attacks at them have disadvantage. Cast it before the big fight and keep concentrating.",
      foes: [F(0, 1), F(-2, 5), F(2, 5)], mate: { hp: 'full' },
      after: function* (c) { yield* c.B.attack(c.foes[0], c.u, c.foes[0].weapon); } },
    maze: { tip: "Maze sends one foe away with no save until it finds its way out (Intelligence check, its action). Use it on the toughest brute, even one too big for Power Word Stun; keep concentrating.",
      foes: [F(0, 4, {}, { hp: 300 }), F(-2, 5), F(2, 5)], mate: { hp: 'full' }, target: function (c) { return c.foes[0]; } },
    mindblank: { tip: "Mind Blank makes one friend immune to psychic damage and to charm for the fight. Cast it before an enemy mage can turn your best fighter against you.",
      foes: [{ word: 'wizard:9', at: [0, 5], abil: {}, normie: false }, F(-2, 6), F(2, 6)], mate: { hp: 'full', at: [1, 0] }, target: function (c) { return c.mate; },
      pre: function* (c) { var w = c.foes[0]; w.known = ['charmperson']; w.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; w.slotsMax = w.slots.slice(); },
      after: function* (c) { var w = c.foes[0]; c.D.rules.startTurn(w); yield* c.B.exec(w, { do: 'cast', id: 'charmperson', slot: 1, target: c.mate }); } },
    powerwordstun: { tip: "Power Word Stun has no save, but only works on a foe with 150 HP or fewer. Stun the dangerous hitter, then your friends get advantage on it; it shakes the stun off with a Con save each turn.",
      foes: [F(1, 2, {}, { hp: 120 }), F(-2, 5), F(2, 5)], mate: { hp: 'full', at: [1, 1] }, target: function (c) { return c.foes[0]; },
      after: function* (c) { yield* c.B.attack(c.mate, c.foes[0], c.mate.weapon); } },
    sunburst: { tip: "Sunburst: a 60-ft ball of radiant light that burns and blinds. Drop it on a crowd far from your friends; foes that fail the Con save are blinded and cannot see to fight.",
      foes: crowd(-5, 7, { con: 3 }, [[0, 0], [-2, -1], [2, -1], [-1, 1], [1, 1], [3, 1]]), mate: { hp: 'full' },
      pre: function* (c) { far(c); }, target: function (c) { return at(c, 0); } },
    foresight: { tip: "Foresight gives one friend advantage on attacks and saves, and attacks at them have disadvantage, for the whole fight. Put it on your front-line fighter before the foes close in.",
      foes: [F(1, 2), F(-2, 5), F(2, 5)], mate: { hp: 'full', at: [1, 1] }, target: function (c) { return c.mate; },
      after: function* (c) { yield* c.B.attack(c.foes[0], c.mate, c.foes[0].weapon); } },
    massheal: { tip: "Mass Heal shares 700 hit points among everyone you can see, the most hurt first, even those who have fallen. Wait until the whole party is hurt; it is wasted on one friend.",
      foes: [F(0, 6), F(-2, 7), F(2, 7)],
      pre: function* (c) { c.u.hp = Math.floor(c.u.maxhp / 3); c.pals.forEach(function (w) { w.hp = Math.floor(w.maxhp / 4); }); c.B.hurt(c.pals[1], c.pals[1].hp, 'force'); } },
    meteorswarm: { tip: "Meteor Swarm drops four huge fiery spheres wherever foes stand, 20d6 fire and 20d6 bludgeoning each. Spread across a battlefield it clears whole groups; keep your friends out of every one.",
      foes: [F(-7, 6, { dex: 3 }), F(-3, 8, { dex: 3 }), F(0, 8, { dex: 3 }), F(3, 8, { dex: 3 }), F(-6, 7, { dex: 3 }), F(-2, 7, { dex: 3 })], mate: { hp: 'full' },
      pre: function* (c) { far(c); }, target: function (c) { return at(c, 3); } },
    powerwordkill: { tip: "Power Word Kill drops a foe with 100 HP or fewer, no save and no attack roll. Hold it for the boss once the fight has worn it below 100; on a fresh foe it does nothing.",
      foes: [F(0, 4, {}, { hp: 80 }), F(-2, 5), F(2, 5)], mate: { hp: 'full' }, target: function (c) { return c.foes[0]; } },
    weird: { tip: "Weird frightens every foe in a 30-ft sphere that fails a Wisdom save, then each takes 4d10 psychic at each turn's end until it saves. Cast it on a crowd, concentrate, and keep out of the sphere.",
      foes: crowd(0, 8, { wis: 3 }, PACK5), mate: { hp: 'full' },
      target: function (c) { return at(c, 0); },
      after: function* (c) { for (var i = 0; i < 2; i++) { yield 20; c.D.magic.onEnd(c.B, c.foes[i]); } } }
  });
})();
