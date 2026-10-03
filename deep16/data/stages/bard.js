/* DEEP16 spell-gallery stages for the bard's spells (js/gallery.js applyStage documents the entry): each spell staged to show the way it is meant to be used. */
'use strict';
(function () {
  var S = (window.D16.SPELLSTAGE = window.D16.SPELLSTAGE || {});
  // a blow from a (a foe or the friend) at t, on a fresh turn for the attacker, so the card shows the spell's effect biting
  function* swing(c, a, t) { c.D.rules.startTurn(a); c.B.active = a; yield* c.B.exec(a, { do: 'attack', target: t }); yield 20; }
  function plain(n, extra) { var xs = [[0, 4], [1, 5], [-1, 5], [0, 6], [2, 4]], out = []; for (var i = 0; i < n; i++) out.push(Object.assign({ word: 'fighter:9', at: xs[i] }, extra || {})); return out; }
  Object.assign(S, {
    dancinglights: { tip: "Dancing Lights is a utility cantrip: four floating lights to see by in a dark corridor or cave. It hurts nothing, so cast it before the fight, not during it." },
    viciousmockery: { tip: "A free cantrip: a foe that fails its WIS save takes a little psychic damage and swings at disadvantage next turn. Aim it at the big hitter about to attack your friend; it needs a foe that can hear you.",
      foes: [{ word: 'fighter:9', at: [0, 4], abil: { wis: 6 } }],
      after: function* (c, t) { yield* swing(c, t, c.mate); } },
    bane: { tip: "Bane: up to three foes make a CHA save or subtract 1d4 from every attack and save. Cast it on a tight group of strong hitters at the start of a fight, then keep concentrating.",
      foes: plain(3, { abil: { cha: 6 } }),
      after: function* (c) { yield* swing(c, c.foes[0], c.mate); } },
    charmperson: { tip: "Charm Person: a humanoid that fails its WIS save will not attack you and treats you as a friend. Use it on one dangerous humanoid, away from fights, to talk or slip past; hurting it breaks the charm.",
      foes: [{ word: 'fighter:9', at: [0, 3], abil: { wis: 6 } }] },
    faeriefire: { tip: "Faerie Fire: a 20 ft cube; each creature that fails a DEX save is outlined, so every attack against it has advantage. Cast it on a clump before your fighters and archers strike, and it ruins invisibility.",
      foes: plain(3, { abil: { dex: 6 } }), slot: 1,
      after: function* (c) { yield* swing(c, c.mate, c.foes[0]); } },
    healingword: { tip: "Healing Word is a bonus action with 60 ft range: bring a fallen or nearly fallen friend back from afar and keep your main action for something else. Small heals, so it is for emergencies, not top-ups.",
      mate: { hp: 1 } },
    hideouslaughter: { tip: "Hideous Laughter: a foe that fails its WIS save falls prone and helpless, and saves again each turn and when hurt. Best on a single strong brute with low WIS; it does nothing to INT 4 or less.",
      foes: [{ word: 'fighter:9', at: [0, 3], abil: { wis: 6 } }],
      after: function* (c, t) { yield* swing(c, c.mate, t); } },
    thunderwave: { tip: "Thunderwave is a 15 ft cube from YOUR square: it only hits what is close, shoves failed saves 10 ft and rings out. Cast it when foes press in on you; stand so the cube catches several.",
      foes: [{ word: 'fighter:9', at: [-1, 1], abil: { con: 6 } }, { word: 'fighter:9', at: [-2, 2], abil: { con: 6 } }, { word: 'fighter:9', at: [0, 2], abil: { con: 6 } }],
      target: function (c) { return { x: c.foes[0].x, y: c.foes[0].y }; } },
    blindnessdeafness: { tip: "Blindness: a foe that fails its CON save is blinded, so it attacks at disadvantage and can be hit with advantage. Best on a lone melee brute or a caster; it saves again every turn.",
      foes: [{ word: 'fighter:9', at: [0, 3], abil: { con: 6 } }],
      after: function* (c, t) { yield* swing(c, c.mate, t); } },
    enhanceability: { tip: "Enhance Ability: touch a friend for an hour-long edge on one ability (Bear gives temporary HP, Bull's Strength helps against grips and webs). Cast it before the fight on whoever will face the danger.",
      mate: { hp: 'full' },
      target: function (c) { return c.mate; } },
    heatmetal: { tip: "Heat Metal: 2d8 fire with no save, and the foe may drop its weapon or fight in armour at disadvantage. Aim it at a foe in heavy metal armour; it is wasted on beasts and robes.",
      foes: [{ word: 'fighter:9', at: [0, 4], abil: { con: 6 } }] },
    shatter: { tip: "Shatter: 3d8 thunder in a 10 ft sphere, CON for half. Aim it at a tight knot of foes; it is stronger in tight quarters and hits friends too, so keep them clear.",
      foes: [{ word: 'fighter:9', at: [0, 4], abil: { con: 6 } }, { word: 'fighter:9', at: [1, 4], abil: { con: 6 } }, { word: 'fighter:9', at: [0, 5], abil: { con: 6 } }],
      target: function (c) { return { x: c.foes[0].x, y: c.foes[0].y }; } },
    hypnoticpattern: { tip: "Hypnotic Pattern: a 30 ft cube; those who fail WIS are helpless and rooted until hurt. Best on a big crowd at range, but it hits friends too, and do not damage them: a blow wakes them.",
      foes: plain(5, { abil: { wis: 6 } }),
      target: function (c) { return { x: c.foes[0].x, y: c.foes[0].y - 1 }; } },
    slow: { tip: "Slow: up to six foes in a 40 ft cube make a WIS save or lose half their speed, -2 AC, and most of their actions. A strong answer to a big charging mob; concentrate and hold it.",
      foes: plain(5, { abil: { wis: 6 } }) },
    confusion: { tip: "Confusion: a 10 ft sphere; failed WIS saves wander, freeze or strike each other at random. Drop it on a clump of strong foes beside each other, far from your friends.",
      foes: [{ word: 'fighter:9', at: [0, 5], abil: { wis: 6 } }, { word: 'fighter:9', at: [1, 5], abil: { wis: 6 } }, { word: 'fighter:9', at: [0, 6], abil: { wis: 6 } }],
      target: function (c) { return { x: c.foes[0].x, y: c.foes[0].y }; } },
    freedomofmovement: { tip: "Freedom of Movement: cast it on a friend already held in a web or grip and it breaks free at once; cast beforehand it keeps them from being held for an hour. Save it for web and hold-heavy fights.",
      mate: { hp: 'full' }, foes: [{ word: 'fighter:9', at: [0, 5] }],
      pre: function* (c) { c.mate.conds.restrained = { by: c.foes[0].id }; yield 10; },
      target: function (c) { return c.mate; } },
    greaterrestoration: { tip: "Greater Restoration ends one lasting ill on a friend: a charm, a curse, a drained stat, stoning, a cut to the HP maximum. It cannot fix hit points; use it when a friend is turned against you.",
      mate: { hp: 'full' }, foes: [{ word: 'fighter:9', at: [0, 5] }],
      pre: function* (c) { c.mate.conds.charmed = { by: c.foes[0].id }; yield 10; },
      target: function (c) { return c.mate; } },
    masscurewounds: { tip: "Mass Cure Wounds heals up to six friends at once for 3d8 plus your casting stat. Cast it after a big area attack or when the whole party is hurt, from 60 ft; foes are untouched.",
      mate: { hp: 1 } }
  });
})();
