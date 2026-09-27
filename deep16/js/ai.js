/* DEEP16 — the foes (and any guest), simple and honest (spec §2): move toward the nearest hero you can reach and hit
   it; ranged foes hold at range and shoot the lowest-AC target in sight; a foe at a quarter of its HP or less breaks
   away from the nearest hero -- without Disengage, so the player's opportunity attacks get tested; a spellcaster
   throws its area at the biggest cluster. The phase spider bites and fades into the Ethereal, then steps back out of
   the rock beside the weakest hero. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx;
  var AI = D.ai = {};

  function heroes(B, u) {
    return B.units.filter(function (w) { return w.side !== u.side && G.standing(w) && ((!w.conds.hidden && !w.conds.invisible) || G.dist(u, w) <= 5); });
  }
  // the square to walk to: in reach of the target for least movement, else as close as the move allows
  function approach(u, tgt, rm, reach) {
    var best = null, bs = Infinity;
    Object.keys(rm).forEach(function (k) {
      var e = rm[k];
      if (!e.stand) return;
      var d = G.dist(u, tgt, e.x, e.y), s = (d <= (reach || u.reach) ? 0 : 1000 + d * 10) + e.cost;
      if (s < bs) { bs = s; best = e; }
    });
    return best;
  }
  function* walkTo(B, u, e, o) {
    if (!e || (e.x === u.x && e.y === u.y)) return;
    var rm = G.reach(u, u.turn.move, o), path = G.path(rm, e.x, e.y);
    if (path && path.length) yield* B.moveAlong(u, path, { spend: true, noOA: o && o.ghost });
  }

  AI.turn = function* (B, u) {
    RU.startTurn(u);
    if (u.dead) return;
    if (u.hp <= 0) { B.card(['{g}' + u.name + ' is down.{/}']); yield 30; return; }
    if (!RU.canAct(u) && !u.ethereal) { B.card(['{g}The ' + B.shortName(u) + (u.conds.asleep ? ' sleeps.' : u.conds.paralyzed ? ' is held fast.' : ' cannot act.') + '{/}']); yield 30; D.magic.endTurn(B, u); return; }
    if (!u.ethereal) B.focus(u);
    if (u.conds.restrained) yield* D.magic.breakFree(B, u); // a web: tear at it first
    if (u.kind === 'phasespider') yield* spider(B, u);
    else if (u.kind === 'drow') yield* drow(B, u);
    else yield* guest(B, u);
    D.magic.endTurn(B, u);
    u.anim = 'idle';
    yield 16;
  };

  // ------------------------------------------------------------------ the phase spider
  function* spider(B, u) {
    var T = u.turn, bite = u.attacks.bite, hs = heroes(B, u);
    if (!hs.length) return;
    if (u.ethereal) {
      // unseen, it walks the Ethereal to the weakest, and steps out of the rock at their side (a bonus action)
      var tgt = hs.slice().sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; })[0];
      var rm = G.reach(u, T.move, { ghost: true }), best = null, bs = Infinity;
      Object.keys(rm).forEach(function (k) {
        var e = rm[k];
        if (!G.canStand(u, e.x, e.y)) return; // must come out where there's room
        var d = G.dist(u, tgt, e.x, e.y), s = (d <= 5 ? 0 : 1000 + d * 10) + e.cost;
        if (s < bs) { bs = s; best = e; }
      });
      if (best) { u.x = best.x; u.y = best.y; T.move -= best.cost; }
      T.bonus = 0; u.ethereal = false;
      B.focus(u);
      FX.sparkle(u, 'violet', 22); FX.ring(u, 'violet', 36);
      B.card(['{r}The phase spider{/} steps out of the rock beside ' + tgt.name + '!', '{g}(Ethereal Jaunt, a bonus action: back on the Material Plane){/}']);
      yield 30;
      if (G.dist(u, tgt) <= u.reach && T.action) { T.action = 0; yield* B.attack(u, tgt, bite); }
      return;
    }
    // on this plane: bite the weakest in reach, else close and bite; then fade (a bonus action)
    var near = hs.filter(function (w) { return G.dist(u, w) <= u.reach; }).sort(function (a, b) { return a.hp - b.hp; });
    var t2 = near[0];
    if (!t2) {
      t2 = hs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
      yield* walkTo(B, u, approach(u, t2, G.reach(u, T.move)));
      if (u.dead || u.hp <= 0) return;
    }
    if (G.dist(u, t2) <= u.reach && !t2.dead && T.action) { T.action = 0; yield* B.attack(u, t2, bite); }
    if (u.dead || u.hp <= 0) return;
    if (T.bonus) {
      T.bonus = 0; u.ethereal = true;
      FX.sparkle(u, 'violet', 22);
      B.card(['{r}The phase spider{/} fades out of the world.', '{g}(Ethereal Jaunt: it cannot be seen, struck or blocked till it steps back){/}']);
      yield 30;
    }
  }

  // ------------------------------------------------------------------ the drow captains
  function bestCube(B, u, n, range) {
    var best = null;
    for (var y0 = 0; y0 < G.map.h - 1; y0++) for (var x0 = 0; x0 < G.map.w - 1; x0++) {
      var sq = G.cube(x0, y0, n), cx = x0 + n / 2 - 0.5, cy = y0 + n / 2 - 0.5;
      if (!sq.length) continue;
      if (Math.max(Math.abs(cx - u.x), Math.abs(cy - u.y)) * 5 > range) continue;
      if (!G.losPoint(u.x, u.y, Math.round(cx), Math.round(cy))) continue;
      var got = B.units.filter(function (w) { return G.standing(w) && G.inArea(w, sq); });
      var hs = got.filter(function (w) { return w.side !== u.side; }).length, fs = got.length - hs;
      if (fs) continue;
      if (!best || hs > best.count) best = { x0: x0, y0: y0, sq: sq, count: hs };
    }
    return best;
  }
  function* faerieFire(B, u, cube) {
    var T = u.turn, ff = u.faerie;
    T.action = 0; ff.used = true;
    u.anim = 'attack'; u.animT = B.t;
    FX.bloom(cube.x0 + 1.5, cube.y0 + 1.5, cube.sq, 'violet');
    var lines = ['{r}' + u.name + '{/}: FAERIE FIRE -- a 20-ft cube of violet light.  DEX DC ' + ff.dc];
    var got = B.units.filter(function (w) { return G.standing(w) && G.inArea(w, cube.sq); });
    yield 10;
    got.forEach(function (w) {
      var sv = RU.save(w, 'dex', ff.dc);
      lines.push('  ' + w.name + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{p}outlined: attacks on them have advantage{/}'));
      if (!sv.ok) w.conds.faerie = true;
    });
    B.card(lines, 420);
    yield { fx: 1 };
    yield 30;
  }
  function visibleFrom(u, x, y, hs) { return hs.filter(function (w) { var l = G.los(u, w, x, y); return l.clear; }); }
  function* drow(B, u) {
    var T = u.turn, hs = heroes(B, u), bow = u.attacks.crossbow, blade = u.attacks.shortsword, self = this;
    if (!hs.length) { B.card(['{g}The captain looks for someone to shoot and finds no one.{/}']); yield 30; return; }
    // Faerie Fire, once: on the biggest cluster (two or more, or anyone on the first round)
    if (u.faerie && !u.faerie.used && T.action) {
      var cube = bestCube(B, u, u.faerie.cube, u.faerie.range);
      if (cube && (cube.count >= 2 || (B.round === 1 && cube.count >= 1))) { yield* faerieFire(B, u, cube); return; }
    }
    var adj = hs.filter(function (w) { return G.dist(u, w) <= 5; });
    // a quarter of its HP or less: break away (no Disengage), then shoot
    if (u.hp <= u.maxhp / 4) {
      var rm = G.reach(u, T.move), best = null, bs = -1;
      Object.keys(rm).forEach(function (k) {
        var e = rm[k]; if (!e.stand) return;
        var near = Math.min.apply(null, hs.map(function (w) { return G.dist(u, w, e.x, e.y); }));
        var s = near + G.gzAt(u, e.x, e.y) / 4 - e.cost / 20;
        if (s > bs) { bs = s; best = e; }
      });
      B.card(['{r}' + u.name + '{/} breaks away, bleeding.']);
      yield 20;
      yield* walkTo(B, u, best);
      if (u.dead || u.hp <= 0) return;
      hs = heroes(B, u);
    } else if (adj.length) {
      // pressed: two shortsword cuts at the weakest in reach
      if (!T.action) return;
      T.action = 0;
      for (var a = 0; a < u.multi; a++) {
        var tg = heroes(B, u).filter(function (w) { return G.dist(u, w) <= 5; }).sort(function (p, q) { return p.hp - q.hp; })[0];
        if (!tg) break;
        yield* B.attack(u, tg, blade);
        if (u.dead || u.hp <= 0) return;
      }
      return;
    } else {
      // hold at range: a square in reach from which the lowest-AC hero is in plain range, not beside anyone; the ledge preferred
      var rm2 = G.reach(u, T.move), pick = null, ps = -1e9;
      Object.keys(rm2).forEach(function (k) {
        var e = rm2[k]; if (!e.stand) return;
        var vis = visibleFrom(u, e.x, e.y, hs).filter(function (w) { return G.dist(u, w, e.x, e.y) <= bow.range[1]; });
        if (!vis.length) return;
        var tgt = vis.sort(function (p, q) { return RU.ac(p) - RU.ac(q) || p.hp - q.hp; })[0];
        var d = G.dist(u, tgt, e.x, e.y), besides = G.foesNear(u, e.x, e.y, 5).length;
        var s = (d <= bow.range[0] ? 6 : 0) - besides * 12 + (G.gzAt(u, e.x, e.y) ? 3 : 0) - e.cost / 10 + (e.cost === 0 ? 1 : 0) - RU.ac(tgt) / 4;
        if (s > ps) { ps = s; pick = e; }
      });
      if (pick) yield* walkTo(B, u, pick);
      else yield* walkTo(B, u, approach(u, hs[0], G.reach(u, T.move), bow.range[0]));
      if (u.dead || u.hp <= 0) return;
    }
    // shoot: twice, the lowest AC in sight each time
    if (!T.action) return;
    T.action = 0;
    for (var s2 = 0; s2 < u.multi; s2++) {
      var inSight = visibleFrom(u, u.x, u.y, heroes(B, u)).filter(function (w) { return G.dist(u, w) <= bow.range[1]; });
      if (!inSight.length) { B.card(['{g}The captain has no clear shot.{/}']); yield 20; break; }
      var t3 = inSight.sort(function (p, q) { return RU.ac(p) - RU.ac(q) || p.hp - q.hp; })[0];
      yield* B.attack(u, t3, bow);
      if (u.dead || u.hp <= 0) return;
    }
  }

  // ------------------------------------------------------------------ a guest (Brann, Hedda, Ingrith, Pyro): the nearest foe, Extra Attack
  function* guest(B, u) {
    var T = u.turn, fs = heroes(B, u);
    if (!fs.length) return;
    if (u.hp < u.maxhp / 2 && u.feats && u.feats.secondWind) {
      T.bonus = 0; u.feats.secondWind = 0;
      var r = D.roll('1d10+' + u.lvl); B.heal(u, r.total);
      B.card(['{y}' + u.name + '{/}: SECOND WIND  +' + r.total]); yield 20;
    }
    var tgt = fs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
    if (G.dist(u, tgt) > u.reach) yield* walkTo(B, u, approach(u, tgt, G.reach(u, T.move)));
    if (u.hp <= 0 || !T.action) return;
    T.action = 0;
    for (var k = 0; k < (u.attacks || 1); k++) {
      var t = heroes(B, u).filter(function (w) { return G.dist(u, w) <= u.reach; })[0];
      if (!t) break;
      yield* B.attack(u, t, u.weapon);
    }
  }
})();
