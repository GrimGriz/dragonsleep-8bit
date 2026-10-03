/* DEEP16 spell-gallery stages for the druid's spells (js/gallery.js applyStage documents the entry): each spell staged to show the way it is meant to be used. */
'use strict';
(function () {
  var D = window.D16;
  var S = (D.SPELLSTAGE = D.SPELLSTAGE || {});
  // (the helpers: a foe's turn begun, a creature walking as far toward a point as its speed and the ground let it, and the blow that follows)
  function foe3(dx, dy, extra) { return Object.assign({ word: 'fighter:3', at: [dx, dy] }, extra || {}); }
  function* walkToward(c, w, tx, ty, want) {
    D.rules.startTurn(w); c.B.active = w;
    var rm = D.grid.reach(w, w.turn.move), best = null, bd = Infinity;
    Object.keys(rm).forEach(function (k) { var r = rm[k]; if (!r || !r.stand) return; var p = k.split(','), d = Math.hypot(+p[0] - tx, +p[1] - ty); if (d < bd) { bd = d; best = [+p[0], +p[1]]; } });
    var x0 = w.x, y0 = w.y;
    if (best && (best[0] !== w.x || best[1] !== w.y)) yield* c.B.exec(w, { do: 'move', x: best[0], y: best[1] });
    var ft = Math.max(Math.abs(w.x - x0), Math.abs(w.y - y0)) * 5;
    if (want) c.B.card(['{y}' + w.name + '{/} ' + want.replace('%', ft)], 300);
    yield 24;
  }
  function* strike(c, w, foe) {
    D.rules.startTurn(w); c.B.active = w;
    if (D.grid.dist(w, foe) > 5) {
      var rm = D.grid.reach(w, w.turn.move), best = null, bd = Infinity;
      Object.keys(rm).forEach(function (k) { var r = rm[k]; if (!r || !r.stand) return; var p = k.split(','), d = D.grid.dist({ x: +p[0], y: +p[1], size: w.size || 1 }, foe); if (d <= 5 && d < bd) { bd = d; best = [+p[0], +p[1]]; } });
      if (best) yield* c.B.exec(w, { do: 'move', x: best[0], y: best[1] });
    }
    var a = w.attacks, wp = a && a[Object.keys(a)[0]]; // (a bestiary creature's own first attack, swung as the foe tactics swing it)
    if (wp) yield* D.tactics.swingAll(c.B, w, wp, foe);
    yield 20;
  }
  Object.assign(S, {
    // a cantrip at range: the foe stands 25 ft off, where a druid would rather throw fire than walk up and swing
    produceflame: { tip: "Produce Flame is a free ranged attack, 30 ft: 2d8 fire at this level and growing. Use it when you cannot reach a foe with your staff, or have nothing better to do.",
      foes: [foe3(0, 5)] },
    // the staff first, then the swing it was lit for: the wood hits with Wisdom, a d8, magical
    shillelagh: { tip: "Shillelagh is a bonus action: light your staff, then swing with your Wisdom bonus and a d8. Cast it first, then attack the same turn. It only works on a club or quarterstaff.",
      foes: [foe3(-1, 1)],
      target: function (c) { return c.u; },
      after: function* (c) { yield* c.B.exec(c.u, { do: 'attack', target: c.foes[0] }); yield 20; } },
    // three weak-STR foes in the one 20-ft square; the friend stays well clear of it (it catches friend and foe alike)
    entangle: { tip: "Entangle: a 20-ft square of vines. Foes that fail STR are restrained, so attacks on them have advantage. Aim it at a bunch of foes with weak Strength (casters, small things), and keep your friends out of the square.",
      foes: [foe3(-1, 6, { abil: { str: 2 } }), foe3(0, 6, { abil: { str: 2 } }), foe3(1, 6, { abil: { str: 2 } })],
      target: function (c) { return { x: c.cx, y: c.cy - 6 }; } },
    // the blade lit, then the first slash: a melee spell attack each action while concentrating
    flameblade: { tip: "Flame Blade: a bonus action to light the blade, then each action a melee spell attack for 3d6 fire. Cast it with your bonus action, swing with your action, and keep swinging each turn.",
      foes: [foe3(-1, 1)],
      after: function* (c, t, e) { yield* c.B.exec(c.u, { do: 'cast', id: 'flameblade', slot: e.slot, target: c.foes[0] }); yield 20; } },
    // the ball set down beside the foe, then rolled into it with the bonus action: the ram is a save of its own
    flamingsphere: { tip: "Flaming Sphere: set the ball beside a foe, then use a bonus action each turn to roll it into one (DEX save or 2d6 fire). Foes ending their turn next to it burn too. Concentration.",
      foes: [foe3(-1, 6, { abil: { dex: 2 } }), foe3(0, 6, { abil: { dex: 2 } }), foe3(1, 6, { abil: { dex: 2 } })],
      target: function (c) { return { x: c.cx, y: c.cy - 6 }; },
      after: function* (c, t, e) { yield* c.B.exec(c.u, { do: 'cast', id: 'flamingsphere', slot: e.slot, target: c.foes[1] }); yield 20; } },
    // the foes in a column down the line of the wind, so every one of them is in it
    gustofwind: { tip: "Gust of Wind: a 60-ft line that shoves creatures that fail STR 15 ft back, and blows apart clouds of fog and gas. Line foes up with it to push them out of melee, or clear a cloud.",
      foes: [foe3(-1, 3, { abil: { str: 2 } }), foe3(-1, 5, { abil: { str: 2 } }), foe3(-1, 7, { abil: { str: 2 } })],
      target: function (c) { return c.foes[0]; } },
    // a tight bunch (the beam is one 5-ft square): all three in it at once, and weak Constitution
    moonbeam: { tip: "Moonbeam: a 5-ft shaft of radiant light, 2d10 (CON save for half) to whoever enters or starts a turn in it. Drop it on a tight bunch, then spend an action moving it to hit them again. Concentration.",
      foes: [foe3(-1, 6, { abil: { con: 2 } }), foe3(0, 6, { abil: { con: 2 } }), foe3(1, 6, { abil: { con: 2 } })],
      target: function (c) { return { x: c.cx, y: c.cy - 6 }; } },
    // it wants open sky: the gallery's hall has none, so the stage lends it one (the stage's foes list is read as the scene is set; after() takes the sky back)
    get calllightning() {
      return { tip: "Call Lightning: needs open sky. The cast calls the storm and the first 3d10 bolt (DEX save for half); each later turn an action calls another bolt free. Great for a bunch of foes under the open sky.",
        get foes() { var B = D.battle; if (B && B.fight) B.fight.sky = true; return [foe3(-1, 6, { abil: { dex: 2 } }), foe3(0, 6, { abil: { dex: 2 } }), foe3(1, 6, { abil: { dex: 2 } })]; },
        target: function (c) { return { x: c.cx, y: c.cy - 6 }; },
        after: function* (c, t, e) {
          yield* c.B.exec(c.u, { do: 'cast', id: 'calllightning', slot: e.slot, target: { x: c.cx, y: c.cy - 6 } }); yield 20;
          if (c.B.fight) delete c.B.fight.sky;
        } };
    },
    // the grass: the hall's floor is stone, so the stage lays grass across the ground between the party and the foes (the squares' own mark is put back after); then the foes try to come
    get plantgrowth() {
      return { tip: "Plant Growth: over open grass it makes every square cost 20 ft to cross for the whole fight. Cast it between you and an enemy rush, then fall back and shoot while they crawl.",
        get foes() {
          var B = D.battle, G = D.grid, m = G && G.map;
          if (m && m.sq && !m._grassed) {
            var cx = Math.floor(m.w / 2), cy = Math.floor(m.h / 2) + 3; m._grassed = [];
            for (var y = cy - 9; y <= cy - 2; y++) for (var x = 0; x < m.w; x++) { var s = m.at(x, y); if (s && s.open && s.ch !== 'g') { m._grassed.push([s, s.ch]); s.ch = 'g'; } }
          }
          return [foe3(-1, 7), foe3(1, 7)];
        },
        target: function (c) { return { x: c.cx, y: c.cy - 5 }; },
        after: function* (c) {
          for (var i = 0; i < c.foes.length; i++) yield* walkToward(c, c.foes[i], c.u.x, c.u.y, 'can cover only % ft of the thick grass.');
          var m = D.grid.map; (m._grassed || []).forEach(function (p) { p[0].ch = p[1]; }); m._grassed = null;
        } };
    },
    // the foe has a fire spell and the friend stands before it: the ward picks fire, the bolt comes, half of it goes
    protectionfromenergy: { tip: "Protection from Energy: touch an ally to halve one kind of damage (fire, cold, lightning, acid, thunder). Cast it on whoever is about to eat a breath or bolt of that kind. Concentration.",
      foes: [{ kind: 'spellweaver', at: [0, 6] }], mate: { hp: 'full' },
      pre: function* (c) { var f = c.foes[0]; f.known = ['scorchingray']; f.lightSensitive = false; c.mate.baseAC = 6; },
      target: function (c) { return c.mate; },
      after: function* (c) {
        var f = c.foes[0], hp0 = c.mate.hp; D.rules.startTurn(f); c.B.active = f;
        yield* c.B.exec(f, { do: 'cast', id: 'scorchingray', slot: 2, target: { units: [c.mate, c.mate, c.mate] } }); yield 20;
        c.B.card(['{c}The ward halves each ray: ' + c.mate.name + ' loses ' + (hp0 - c.mate.hp) + ' HP (about ' + 2 * (hp0 - c.mate.hp) + ' without it).{/}'], 400); yield 30;
      } },
    // the sphere is 40 ft across: so it is laid at the far end of the hall, the party outside it
    sleetstorm: { tip: "Sleet Storm: a huge 40-ft cloud of sleet that blinds sight and makes ice (DEX save or fall prone). Drop it on a group at long range, away from your friends, and let them slip around.",
      foes: [foe3(-2, 9, { abil: { dex: 2 } }), foe3(0, 9, { abil: { dex: 2 } }), foe3(2, 9, { abil: { dex: 2 } }), foe3(-1, 8, { abil: { dex: 2 } }), foe3(1, 8, { abil: { dex: 2 } })],
      target: function (c) { return { x: c.cx, y: c.cy - 9 }; } },
    // a fighter in the wall's own row takes the 3d8 as it rises; two crossbowmen behind it shoot at the friend, and the bolts do not cross
    windwall: { tip: "Wind Wall: a 50-ft wall of wind. Foes in it take 3d8 (STR save for half) as it rises, and arrows and bolts shot across it miss. Raise it between you and archers. Concentration.",
      foes: [foe3(0, 5, { abil: { str: 2 } }), { kind: 'drowling', at: [-2, 7] }, { kind: 'drowling', at: [2, 7] }], mate: { hp: 'full' },
      target: function (c) { return { x: c.cx, y: c.cy - 5 }; },
      after: function* (c) {
        for (var i = 1; i < 3; i++) { var f = c.foes[i]; D.rules.startTurn(f); c.B.active = f; yield* D.tactics.swingAll(c.B, f, f.attacks.crossbow, c.mate); yield 20; }
      } },
    // fey: the bestiary has none yet, so the spell is greyed out (cannot be staged)
    conjurewoodlandbeings: { tip: "Conjure Woodland Beings: calls fey to fight for you, more of them if they are weaker. Cast it at the foe nearest you so they appear beside it and fight.",
      foes: [foe3(0, 4)] },
    // the spiders come up beside the foe and bite it on the druid's own turn
    giantinsect: { tip: "Giant Insect: three giant spiders swell up to fight for you, acting on your turn. Call them next to a foe so they can bite at once; they vanish if your concentration breaks.",
      foes: [foe3(0, 5)],
      target: function (c) { return { x: c.cx, y: c.cy - 4 }; },
      after: function* (c) {
        var sp = c.B.units.filter(function (w) { return w.summon && w.summon.id === 'giantinsect' && !w.dead; });
        for (var i = 0; i < sp.length; i++) yield* strike(c, sp[i], c.foes[0]);
      } },
    // two foes beyond ten feet, so the barrier is whole about the druid; then one tries to come in
    antilifeshell: { tip: "Antilife Shell: a 10-ft barrier around you that no living creature can pass or swing through. Raise it before melee foes arrive, then cast and shoot from inside. Pushing a foe in ends it.",
      foes: [foe3(-1, 3), foe3(2, 3)],
      after: function* (c) {
        yield* walkToward(c, c.foes[0], c.u.x, c.u.y, 'tries to close and is stopped at the barrier (moved only % ft).');
        D.rules.startTurn(c.foes[1]); c.B.active = c.foes[1];
        yield* c.B.exec(c.foes[1], { do: 'attack', target: c.u }); yield 20;
      } },
    // the friend at the door of death: the one spell that brings him back from there
    heal: { tip: "Heal restores 70 HP and ends blindness, deafness and disease; the downed stand up. It is your big emergency button: save it for a friend near death, and use cheaper cures otherwise.",
      mate: { hp: 3 } },
    // the line: three foes down it, weak Constitution
    sunbeam: { tip: "Sunbeam: a 60-ft line of radiant light, 6d8 (CON save for half), and failing blinds. Line foes up with it, and each later turn an action fires a new line for free. Concentration.",
      foes: [foe3(-1, 3, { abil: { con: 2 } }), foe3(-1, 5, { abil: { con: 2 } }), foe3(-1, 7, { abil: { con: 2 } })],
      target: function (c) { return c.foes[0]; } },
    // a row of foes raked as it grows, the wall between the party and one more foe, who has to wade through
    wallofthorns: { tip: "Wall of Thorns: a 60-ft hedge. Foes in it take 7d8 (DEX save for half) as it grows, and each square costs 20 ft to cross and hurts again. Use it to split a force or block a corridor. Concentration.",
      foes: [foe3(-1, 5, { abil: { dex: 2 } }), foe3(1, 5, { abil: { dex: 2 } }), foe3(0, 8)],
      target: function (c) { return { x: c.cx, y: c.cy - 5 }; },
      after: function* (c) { yield* walkToward(c, c.foes[2], c.u.x, c.u.y, 'wades the thorns: only % ft of the way.'); } }
  });
})();
