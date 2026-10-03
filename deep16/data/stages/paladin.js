/* DEEP16 spell-gallery stages for the paladin's spells (js/gallery.js applyStage documents the entry): each spell staged to show the way it is meant to be used. */
'use strict';
(function () {
  var S = (window.D16.SPELLSTAGE = window.D16.SPELLSTAGE || {});
  var D = window.D16;
  // a blow by att at tgt, up to `tries` times (a fresh turn each), stopping once done() says the payoff has shown; the foes are soft (AC 10) so the blow lands
  function* swings(c, att, tgt, tries, done) {
    for (var i = 0; i < (tries || 2); i++) {
      D.rules.startTurn(att); c.B.active = att;
      yield* c.B.exec(att, { do: 'attack', target: tgt });
      yield 24;
      if (done && done()) break;
    }
  }
  function soft(c) { c.foes.forEach(function (f) { f.baseAC = 10; }); }
  Object.assign(S, {
    // a buff goes up BEFORE the fight, on the ones who will swing: the friend at the front, the foe at his blade
    bless: { tip: "Cast Bless before the melee starts, on up to three allies who attack and save a lot: each adds 1d4 to every attack roll and save. It needs concentration, so stay out of the front.",
      foes: [{ word: 'fighter:3', at: [0, 3] }], mate: { hp: 'full', at: [0, 2] },
      target: function (c) { return { units: [c.mate, c.u, c.pals[0]] }; },
      pre: function* (c) { soft(c); },
      after: function* (c) { var f = c.foes[0]; yield* swings(c, c.mate, f, 2, function () { return f.hp < f.maxhp; }); } },
    // a save spell on a foe with a weak WIS save, and the word that sets up an ally: it grovels, and a blow at a prone foe has advantage
    command: { tip: "Command lets one foe in 60 ft that fails a WIS save obey a word on its turn. GROVEL drops it prone beside your fighter (his blows have advantage); FLEE and HALT buy a round. Never works on undead or the witless.",
      foes: [{ word: 'fighter:3', at: [0, 4], abil: { wis: 1 } }], mate: { hp: 'full', at: [0, 3] },
      pre: function* (c) { soft(c); },
      after: function* (c) { var f = c.foes[0]; D.rules.startTurn(f); c.B.active = f; yield 40; yield* swings(c, c.mate, f, 2, function () { return f.hp < f.maxhp; }); } },
    // a heal wants the hurt friend within touch (he is, by default, at a third) -- the common mistake is to heal before the fight is won rather than when someone is down
    curewounds: { tip: "Cure Wounds heals by touch: 1d8 plus your casting modifier, more from a higher slot. Walk up to the hurt ally and cast it. It cannot raise the dead, and a bonus-action heal is better saved for an ally who is down." },
    // the rider on the next weapon hits, up first as a bonus action, then the blow
    divinefavor: { tip: "Divine Favor is a bonus action: for a minute your weapon hits deal an extra 1d4 radiant. Cast it, then swing in the same turn. Best for a character who attacks every round and has nothing better to concentrate on.",
      foes: [{ word: 'fighter:3', at: [1, 1] }], mate: { hp: 'full' },
      pre: function* (c) { soft(c); },
      after: function* (c) { var f = c.foes[0]; yield* swings(c, c.u, f, 3, function () { return f.hp < f.maxhp; }); } },
    // temporary hit points each turn on the ally who stands in front: a foe's blow is taken from them first
    heroism: { tip: "Heroism by touch makes an ally fearless and gives temporary HP at the start of each of their turns. Cast it on the frontline fighter before the fight, and keep concentration.",
      foes: [{ word: 'fighter:3', at: [0, 2] }], mate: { hp: 'full', at: [0, 1] },
      target: function (c) { return c.mate; },
      pre: function* (c) { soft(c); },
      after: function* (c) { var f = c.foes[0]; yield* swings(c, f, c.mate, 5, function () { return c.mate.hp < c.mate.maxhp || (c.mate.temp || 0) < 5; }); D.rules.startTurn(c.mate); } },
    // +2 AC at range, on the ally who will be hit: a foe swings at them and misses more often
    shieldoffaith: { tip: "Shield of Faith is a bonus action at 60 ft: one ally gets +2 AC for up to ten minutes. Put it on the character the foes are swinging at (the front line) before the first blow lands.",
      foes: [{ word: 'fighter:3', at: [0, 2] }], mate: { hp: 'full', at: [0, 1] },
      target: function (c) { return c.mate; },
      pre: function* (c) { soft(c); },
      after: function* (c) { yield* swings(c, c.foes[0], c.mate, 3); } },
    // up to three allies, +5 max HP and current HP (as much again): the friend is hurt, so it shows
    aid: { tip: "Aid raises the maximum and current HP of up to three allies by 5, for eight hours. Cast it before a hard day, on the ones who will be hit; it does not need concentration.",
      target: function (c) { return { units: [c.mate, c.u, c.pals[0]] }; } },
    // the smite is waiting on the blade: cast it, then hit
    brandingsmite: { tip: "Branding Smite is a bonus action: your next weapon hit adds 2d6 radiant, and the struck foe glows and cannot hide in invisibility. Cast it, then attack with that same turn.",
      foes: [{ word: 'fighter:3', at: [1, 1] }], mate: { hp: 'full' },
      pre: function* (c) { soft(c); },
      after: function* (c) { var f = c.foes[0]; yield* swings(c, c.u, f, 3, function () { return !!f.conds.branded; }); } },
    // a fighter with a plain blade gets +1 to hit and damage, and magical for resistances
    magicweapon: { tip: "Magic Weapon (bonus action, touch) makes one weapon +1 to hit and damage and magical, so it passes damage resistances. Cast it on a fighter's blade before the fight; a higher slot gives +2.",
      foes: [{ word: 'fighter:3', at: [0, 2] }], mate: { hp: 'full', at: [0, 1] },
      target: function (c) { return c.mate; },
      pre: function* (c) { soft(c); },
      after: function* (c) { var f = c.foes[0]; yield* swings(c, c.mate, f, 2, function () { return f.hp < f.maxhp; }); } }
  });
})();
