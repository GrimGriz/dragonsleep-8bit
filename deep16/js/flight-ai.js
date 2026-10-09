/* DEEP16 — THE AI ON WINGS, AND THE RINGS OF FLYING (10-08; the lanes window, Griz: "arrange a room we can throw on the ladder where the party gets rings of fly or
   flying rings (make them equip them themselves - announce after title card drops) against flying monsters and bench test for bugs"). Built on the grid's rules
   lane's flight at a height (§2.17: js/grid.js u.fz, G.flyReach, G.flyTop; battle.js flyMove, flyTo, flyCheck), whose two leftovers the lanes window took for
   this, on that seat's go: the SRD's fliers flying, and the AI flying.

     a fight's `fliers: true`     every foe whose sheet has a fly speed (data/foes.js `fly`) has wings in it -- the bats, the stirges, the darkmantle, the cloaker.
                                  Everywhere else they still move their fly speed on the ground: switching them on for good is the bestiary lane's, on his word.
     a fight's `pack: [{ id, n }]` in the party's pack as the fight begins (not inside the 8-bit game: its pack is the save's)
     a worn ring with `ring.fly`  (content/items.json ringofflying -- ours, the SRD 5.1 Winged Boots' flying speed on a finger) PUT ON from the pack: the free object
                                  interaction (SRD 5.1, as drawing a blade), and the one who wears it has wings: a flying speed equal to the walking one
     a fight's `announce`         the lines said as the title card goes (battle.js run)

   The foe with wings, in such a fight (ai.js, before the brute): it keeps to the air. The nearest of ours a blow of its can reach from somewhere in its move -- a square
   and a layer 5 ft over that one first (in reach and off the ground), then level with it, then 10 ft over -- the cheapest by the move; there it strikes with the brute's
   own blows, its walk spent (a walk would take it down). No one in reach this turn: it closes on the nearest, 5 ft over its height. The class AI (js/tactics.js TX.FIRST):
   the ring on first, and a fighter of blows with wings whose foes are all out of reach, one of them aloft, flies up to strike it. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx, Battle = D.Battle;
  var FA = D.flightAI = {};
  function item(id) { return window.DS && DS.DATA && DS.DATA.items ? DS.DATA.items[id] : null; }
  FA.ringsIn = function (B) { return (B.inv || []).filter(function (x) { var it = x.n > 0 && item(x.id); return !!(it && it.ring && it.ring.fly); }); };

  // ------------------------------------------------------------------ the fight's own: the pack, the wings
  var enter0 = Battle.prototype.enter;
  Battle.prototype.enter = function () {
    var r = enter0.apply(this, arguments), F = this.fight || {}, inv;
    if (F.pack && !this.o.embed && !this.packed) {
      this.packed = true; inv = this.inv = this.inv || [];
      F.pack.forEach(function (p) { var h = inv.filter(function (x) { return x.id === p.id; })[0]; if (h) h.n = (h.n || 0) + p.n; else inv.push({ id: p.id, n: p.n }); });
    }
    if (F.fliers) this.units.forEach(function (u) { var d = u.side === 'foe' && u.kind && D.FOES[u.kind]; if (d && d.fly) { u.flies = true; u.speed = Math.max(u.speed || 0, d.fly); } });
    return r;
  };

  // ------------------------------------------------------------------ PUT ON THE RING: a ring command while one is in the pack and the hero has no wings
  var cmds0 = Battle.prototype.commands;
  Battle.prototype.commands = function (u) {
    var out = cmds0.apply(this, arguments);
    if (u && u.side === 'party' && !u.flies && !u.floats && !u.familiar && !u.beast && !u.object) {
      var rg = FA.ringsIn(this)[0], T = u.turn || {};
      if (rg) {
        var it = item(rg.id);
        out.push({ id: 'puton', label: 'PUT ON ' + it.name.toUpperCase(), cost: 'F', icon: 'ring', item: rg.id, ok: !T.freeObj && RU.canAct(u),
          why: T.freeObj ? 'the free object interaction is spent this turn' : 'not now',
          note: 'free, as drawing a blade: a flying speed of ' + (u.speed || 30) + ' ft while you wear it -- with MOVE out, Shift+wheel or [ ] picks your height (' + rg.n + ' in the pack)' });
      }
    }
    return out;
  };
  var exec0 = Battle.prototype.exec;
  Battle.prototype.exec = function* (u, c) {
    if (c && c.do === 'puton') return yield* putOn(this, u, c);
    return yield* exec0.apply(this, arguments);
  };
  function* putOn(B, u, c) {
    var T = u.turn; if (!T || T.freeObj || u.flies) return;
    var rg = (B.inv || []).filter(function (x) { return x.n > 0 && x.id === (c.item || (FA.ringsIn(B)[0] || {}).id); })[0]; if (!rg) return;
    var it = item(rg.id); if (!it || !it.ring || !it.ring.fly) return;
    rg.n--; T.freeObj = true; u.flies = true; u.ringFly = rg.id;
    D.sfx('buff'); if (FX && FX.ring) FX.ring(u, 'glow', 24);
    B.card(['{y}' + u.name + '{/} puts on the ' + it.name + '.  {g}(wings: a flying speed of ' + (u.speed || 30) + ' ft; with MOVE out, Shift+wheel or [ ] picks the height){/}'], 300);
    yield 20;
  }

  // ------------------------------------------------------------------ where to fly to strike: a square and a layer in the move from which reach covers one of hs
  //   the nearest four of hs; for each, 5 ft over its height (pref 0), 10 ft over (1), level with it (2); the cheapest by cost + 8 a preference. None this turn: the
  //   square at 5 ft over the nearest that comes closest to it. Returns { x, y, z } or null
  FA.spotFor = function (B, u, hs, rch) {
    var L = G.LAYER(), top = G.flyTop(u), budget = (u.turn && u.turn.move) || 0, best = null;
    var near = hs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); }).slice(0, 4);
    function distAt(t, x, y, z) { var f0 = u.fz; u.fz = z > G.groundAt(u, x, y) ? z : null; try { return G.dist(u, t, x, y); } finally { u.fz = f0; } }
    near.forEach(function (t) {
      var tz = G.gzAt(t, t.x, t.y);
      [tz + L, tz + 2 * L, tz].forEach(function (z, pref) { // (the air first: on a flat floor the ground was 2 ft cheaper than the rise, and the roost's bats walked -- 10-08, the flight bench)
        if (z > top) return;
        var rm = G.flyReach(u, z, budget);
        Object.keys(rm).forEach(function (k) {
          var c = rm[k]; if (!c.stand) return;
          if (distAt(t, c.x, c.y, z) > rch) return;
          var score = c.cost + pref * 8;
          if (!best || score < best.score) best = { x: c.x, y: c.y, z: z, score: score };
        });
      });
    });
    if (best || !near.length) return best;
    var t0 = near[0], z0 = Math.min(top, G.gzAt(t0, t0.x, t0.y) + L), rm0 = G.flyReach(u, z0, budget), b0 = null;
    Object.keys(rm0).forEach(function (k) {
      var c = rm0[k]; if (!c.stand) return;
      var d = distAt(t0, c.x, c.y, z0);
      if (!b0 || d < b0.d || (d === b0.d && c.cost < b0.cost)) b0 = { x: c.x, y: c.y, z: z0, d: d, cost: c.cost };
    });
    return b0 && (b0.x !== u.x || b0.y !== u.y || b0.z !== G.gzAt(u, u.x, u.y)) ? b0 : null;
  };

  // ------------------------------------------------------------------ the foe with wings (ai.js turn, before the brute, in a fight whose fliers fly)
  FA.foeTurn = function* (B, u) {
    var T = u.turn, AI = D.ai;
    var hs = AI.heroes(B, u).filter(function (w) { return !w.object && G.standing(w); });
    var rch = AI.reachOf(u, hs);
    if (hs.length && T.move > 0 && G.winged(u) && !u.riding && !u.conds.grappled && !hs.some(function (w) { return G.dist(u, w) <= rch; })) {
      var spot = FA.spotFor(B, u, hs, rch);
      if (spot) { yield* B.flyMove(u, spot.x, spot.y, spot.z); if (u.dead || u.hp <= 0) return; }
    }
    T.move = 0; // (the brute's blows, its walk spent: a walk would take it down to the ground)
    yield* AI.brute(B, u);
  };

  // ------------------------------------------------------------------ the class AI: the ring on first; up to a foe aloft that nothing reaches from the ground
  if (D.tactics && D.tactics.FIRST) {
    D.tactics.FIRST.unshift(function* ringOn(B, u) {
      var c = B.commands(u).filter(function (x) { return x.id === 'puton' && x.ok; })[0];
      if (c) yield* B.exec(u, { do: 'puton', item: c.item });
    });
    D.tactics.FIRST.push(function* flyUp(B, u) {
      var T = u.turn;
      if (!u.flies || !G.winged(u) || !(T.move > 0) || (u.weapon && u.weapon.ranged) || u.conds.restrained || u.conds.grappled) return;
      var fs = D.tactics.foesOf ? D.tactics.foesOf(B, u) : [], rch = G.reachOf(u);
      if (!fs.length || fs.some(function (t) { return G.dist(u, t) <= rch; }) || !fs.some(G.aloft)) return;
      var spot = FA.spotFor(B, u, fs, rch);
      if (spot) yield* B.flyMove(u, spot.x, spot.y, spot.z);
    });
  }
})();
