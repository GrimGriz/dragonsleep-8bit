/* DEEP16 — the foes (and any guest), simple and honest (spec §2): move toward the nearest hero you can reach and hit
   it; ranged foes hold at range and shoot the lowest-AC target in sight; a foe at a quarter of its HP or less breaks
   away from the nearest hero -- without Disengage, so the player's opportunity attacks get tested; a spellcaster
   throws its area at the biggest cluster. The phase spider bites and fades into the Ethereal, then steps back out of
   the rock beside the weakest hero. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx;
  var AI = D.ai = {};

  // "The troll", but "Willem" (a foe with a name of its own is `named`)
  function the(B, u) { return (u.named ? '' : 'The ') + B.shortName(u); }
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
    if (u.conds.surprised) { delete u.conds.surprised; B.card(['{g}' + (u.side === 'foe' ? the(B, u) : u.name) + ' is caught unaware: no turn this round.{/}']); yield 30; return; }
    if (u.hp <= 0) { B.card(['{g}' + u.name + ' is down.{/}']); yield 30; return; }
    if (!RU.canAct(u) && !u.ethereal) { B.card(['{g}' + (u.side === 'foe' ? the(B, u) : u.name) + (u.conds.asleep ? ' sleeps.' : u.conds.paralyzed ? ' is held fast.' : u.conds.stunned ? ' is stunned.' : ' cannot act.') + '{/}']); yield 30; D.magic.endTurn(B, u); return; }
    if (!u.ethereal) B.focus(u);
    if (u.conds.restrained) yield* D.magic.breakFree(B, u); // a web: tear at it first
    if (u.kind === 'phasespider') yield* spider(B, u);
    else if (u.kind === 'drow') yield* drow(B, u);
    else if (u.kind === 'drider') yield* drider(B, u);
    else if (u.weave) yield* weaver(B, u);
    else if (u.side === 'foe') yield* brute(B, u);
    else yield* guest(B, u);
    // a Slam's stun and a Moan's fright last till the end of the foe's next turn
    B.units.forEach(function (w) { ['stunned', 'frightened'].forEach(function (c) { var s = w.conds[c]; if (s && s.by === u.id) { if (s.fresh) s.fresh = false; else delete w.conds[c]; } }); });
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
      T.bonus = 0; u.ethereal = false; D.sfx('magic');
      B.focus(u);
      FX.sparkle(u, 'violet', 22); FX.ring(u, 'violet', 36);
      B.card(['{r}The phase spider{/} steps out of the rock ' + (G.dist(u, tgt) <= 5 ? 'beside ' : 'near ') + tgt.name + '!', '{g}(Ethereal Jaunt, a bonus action: back on the Material Plane){/}']);
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
      T.bonus = 0; u.ethereal = true; D.sfx('run');
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
    D.sfx('magic');
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

  // ------------------------------------------------------------------ the drider (the second wave): three attacks, the bite first
  // It closes on the nearest hero it can reach this turn and fights there -- the bite at the weakest beside it, then
  // two longsword cuts; with no one in reach it stands and looses three arrows at the lowest AC in sight. Faerie Fire
  // once, only on three or more (its three attacks are worth more than the light).
  function* drider(B, u) {
    var T = u.turn, hs = heroes(B, u), sw = u.attacks.longsword, bite = u.attacks.bite, bow = u.attacks.longbow;
    if (!hs.length) return;
    if (u.faerie && !u.faerie.used && T.action) {
      var cube = bestCube(B, u, u.faerie.cube, u.faerie.range);
      if (cube && cube.count >= 3) { yield* faerieFire(B, u, cube); return; }
    }
    var inReach = function () { return heroes(B, u).filter(function (w) { return G.dist(u, w) <= u.reach; }); };
    if (!inReach().length) {
      var tgt = hs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0], e = approach(u, tgt, G.reach(u, T.move));
      if (e && G.dist(u, tgt, e.x, e.y) <= u.reach) { yield* walkTo(B, u, e); if (u.dead || u.hp <= 0) return; }
    }
    if (!T.action) return;
    T.action = 0;
    if (inReach().length) {
      for (var a = 0; a < u.multi; a++) {
        var tg = inReach().sort(function (p, q) { return p.hp - q.hp; })[0];
        if (!tg) break;
        yield* B.attack(u, tg, a === 0 ? bite : sw);
        if (u.dead || u.hp <= 0) return;
      }
      return;
    }
    for (var s = 0; s < u.multi; s++) {
      var seen = visibleFrom(u, u.x, u.y, heroes(B, u)).filter(function (w) { return G.dist(u, w) <= bow.range[1]; });
      if (!seen.length) { B.card(['{g}The drider has no clear shot.{/}']); yield 20; break; }
      yield* B.attack(u, seen.sort(function (p, q) { return RU.ac(p) - RU.ac(q) || p.hp - q.hp; })[0], bow);
      if (u.dead || u.hp <= 0) return;
    }
  }

  // ------------------------------------------------------------------ the spell-weaver (Third Lamp, 09-27): she keeps her distance; Hold once,
  // early, on the one who hits hardest; a line of lightning when it would catch two or more (recharge 5-6); else Fire Bolt
  // at the lowest AC in sight. Pressed, she steps away first (no Disengage: the player's opportunity attack is the test).
  function bestLine(B, u, len) {
    var best = null;
    heroes(B, u).forEach(function (t) {
      var sq = D.magic.area(u, { shape: 'line', len: len }, t.x, t.y);
      var got = B.units.filter(function (w) { return G.standing(w) && G.inArea(w, sq); }), hs = got.filter(function (w) { return w.side !== u.side; }).length;
      if (got.length > hs) return; // not through her own
      if (!best || hs > best.count) best = { sq: sq, count: hs, t: t };
    });
    return best;
  }
  function* weaver(B, u) {
    var T = u.turn, W = u.weave, hs = heroes(B, u), bolt = u.attacks.firebolt;
    if (!hs.length) return;
    if (W.bolt.spent) { var rc = D.d(6); if (rc >= W.bolt.recharge) { W.bolt.spent = false; B.card(['{g}' + the(B, u) + ' ' + (W.bolt.again || 'draws the dark in again') + ' (d6 ' + rc + ').{/}'], 200); yield 12; } }
    // pressed: a step back to somewhere she can still see someone from, and no one beside her (not the naga: it bites)
    if (bolt && G.foesNear(u, u.x, u.y, 5).length) {
      var rm = G.reach(u, T.move), pick = null, ps = -1e9;
      Object.keys(rm).forEach(function (k) {
        var e = rm[k]; if (!e.stand) return;
        var vis = visibleFrom(u, e.x, e.y, hs).length; if (!vis) return;
        var s = -G.foesNear(u, e.x, e.y, 5).length * 20 + Math.min.apply(null, hs.map(function (w) { return G.dist(u, w, e.x, e.y); })) / 5 + (G.gzAt(u, e.x, e.y) ? 3 : 0) - e.cost / 10;
        if (s > ps) { ps = s; pick = e; }
      });
      if (pick && (pick.x !== u.x || pick.y !== u.y)) { B.card(['{r}The weaver{/} slips back.']); yield 12; yield* walkTo(B, u, pick); if (u.dead || u.hp <= 0) return; hs = heroes(B, u); }
    }
    if (!T.action || !hs.length) return;
    // Hold, once, in the first rounds: the hardest hitter she can see within range
    if (!W.hold.used && B.round <= 3) {
      var ht = visibleFrom(u, u.x, u.y, hs).filter(function (w) { return !w.conds.paralyzed && G.dist(u, w) <= W.hold.range && !w.fey; })
        .sort(function (a, b) { return (b.attacks || 1) * (b.lvl || 1) + b.maxhp / 20 - ((a.attacks || 1) * (a.lvl || 1) + a.maxhp / 20); })[0];
      if (ht) {
        T.action = 0; W.hold.used = true; u.anim = 'attack'; u.animT = B.t; D.sfx('magic'); FX.ring(ht, 'violet', 40);
        var sv = RU.save(ht, 'wis', W.hold.dc);
        B.card(['{r}' + the(B, u) + '{/} ' + (W.hold.text || 'closes a hand') + ': HOLD {y}' + ht.name + '{/}.  WIS ' + RU.saveText(sv) + ' vs DC ' + W.hold.dc + '  ' + (sv.ok ? '{n}SHRUGS IT OFF{/}' : '{p}PARALYZED{/} {g}(a WIS save at the end of each turn){/}')], 400);
        if (!sv.ok) ht.conds.paralyzed = { save: 'wis', dc: W.hold.dc, by: u.id };
        yield 40; u.anim = 'idle'; return;
      }
    }
    // the line of lightning, on two or more
    if (!W.bolt.spent) {
      var ln = bestLine(B, u, W.bolt.len);
      if (ln && ln.count >= 2) {
        T.action = 0; W.bolt.spent = true; u.anim = 'attack'; u.animT = B.t; D.sfx('magic');
        u.facing = B.faceTo(u, ln.t);
        FX.bloom(u.x, u.y, ln.sq, 'glow');
        var roll = D.roll(W.bolt.dice), lines = ['{r}' + the(B, u) + '{/} ' + (W.bolt.text || 'draws the dark into a line of lightning!') + '  ' + W.bolt.dice + ' ' + RU.fmtRolls(roll.rolls) + ' = ' + roll.total + '  DEX DC ' + W.bolt.dc], hits = [];
        yield 12;
        B.units.filter(function (w) { return G.standing(w) && w.side !== u.side && G.inArea(w, ln.sq); }).forEach(function (w) {
          var s2 = RU.save(w, 'dex', W.bolt.dc), ev = w.cls === 'rogue' && w.lvl >= 7;
          var n = s2.ok ? (ev ? 0 : Math.floor(roll.total / 2)) : (ev ? Math.floor(roll.total / 2) : roll.total);
          lines.push('  ' + w.name + ': ' + RU.saveText(s2) + ' ' + (s2.ok ? '{n}saved{/}' : '{o}failed{/}') + (ev ? ' {c}evasion{/}' : '') + '  {r}' + n + '{/}');
          hits.push([w, n]);
        });
        B.card(lines.slice(0, 7), 420);
        yield { fx: 1 };
        hits.forEach(function (h) { B.hurt(h[0], h[1], W.bolt.type); });
        yield 34; u.anim = 'idle'; return;
      }
    }
    // no bolt of her own (the naga): the bite, as any brute
    if (!bolt) { yield* brute(B, u); return; }
    // Fire Bolt at the lowest AC in sight
    var seen = visibleFrom(u, u.x, u.y, hs).filter(function (w) { return G.dist(u, w) <= bolt.range[1]; });
    if (!seen.length) { B.card(['{g}The weaver has no one in sight.{/}']); yield 20; return; }
    T.action = 0;
    yield* B.attack(u, seen.sort(function (p, q) { return RU.ac(p) - RU.ac(q) || p.hp - q.hp; })[0], bolt);
  }

  // ------------------------------------------------------------------ a guest (Brann, Hedda, Ingrith, Pyro): the nearest foe, Extra Attack
  // ------------------------------------------------------------------ brute: any foe with no routine of its own (the bestiary, 09-27):
  // regenerate if it can; close on the nearest hero (the weakest already in reach first); then run `multi` --
  // a list of attack names in order, or a count of the first attack -- on the weakest in reach each time
  // the bestiary's traits (09-27, the ladder): a Web shot on a recharge (the giant spider, the ettercap), a grip held
  // and a Tentacle Slam (the otyugh), a creature bound to its ground (bound: the chars of the squares it keeps to)
  function reachOf(u) { var r = u.reach; Object.keys(u.attacks || {}).forEach(function (k) { r = Math.max(r, u.attacks[k].reach || 0); }); return r; }
  function* webShot(B, u, tgt) {
    var W = u.web, T = u.turn;
    T.action = 0; W.ready = false;
    var shot = { name: 'Web', atk: W.atk, dice: '0', mod: 0, type: 'web', range: W.range, ranged: true, fx: 'bolt' };
    u.facing = B.faceTo(u, tgt); u.anim = 'attack'; u.animT = B.t;
    FX.projectile(u, tgt, 'bolt'); yield { fx: 1 };
    var e = RU.edges(u, tgt, shot), r = RU.d20(e.net), tot = r.pick + W.atk, ac = RU.ac(tgt) + G.los(u, tgt).cover;
    var hit = r.pick === 20 || (r.pick !== 1 && tot >= ac);
    var why = (e.adv.length ? '  {n}adv: ' + e.adv.join(', ') + '{/}' : '') + (e.dis.length ? '  {o}dis: ' + e.dis.join(', ') + '{/}' : '');
    B.card(['{r}' + u.name + '{/} > {y}' + tgt.name + '{/}  WEB (recharge ' + W.recharge + '-6)', 'd20 ' + (r.rolls.length > 1 ? RU.fmtRolls(r.rolls) + '>' : '') + r.pick + ' ' + RU.sign(W.atk) + ' = ' + tot + '  vs AC ' + ac + '  ' + (hit ? '{n}HIT{/}: {o}RESTRAINED{/} {g}(escape DC ' + W.dc + ', an action){/}' : '{g}MISS{/}') + why], 360);
    D.sfx(hit ? 'hit' : 'miss');
    if (hit) { tgt.conds.restrained = { dc: W.dc, by: u.id }; FX.ring(tgt, 'bone', 26); FX.sparkle(tgt, 'bone', 12); }
    else FX.float('MISS', tgt, D.PAL.ramps.silver[5]);
    yield 34;
    u.anim = 'idle';
  }
  function* slam(B, u) {
    var S = u.slam, held = u.holding.slice();
    u.turn.action = 0; u.anim = 'attack'; u.animT = B.t;
    B.card(['{r}' + u.name + '{/}: TENTACLE SLAM -- it beats what it holds against the stone.  CON DC ' + S.dc]);
    yield 24;
    for (var i = 0; i < held.length; i++) {
      var w = held[i]; if (w.dead || w.hp <= 0) continue;
      var sv = RU.save(w, 'con', S.dc), roll = D.roll(S.dice), n = sv.ok ? Math.floor(roll.total / 2) : roll.total;
      B.card(['  ' + w.name + ': CON ' + RU.saveText(sv) + ' vs DC ' + S.dc + '  ' + (sv.ok ? '{n}SAVED{/} (half)' : '{o}STUNNED{/}') + '  ' + S.dice + ' ' + RU.fmtRolls(roll.rolls) + ' = {r}' + n + '{/} bludgeoning'], 360);
      D.sfx('crit'); FX.slash(w, D.PAL.ramps.red[4]);
      B.hurt(w, n, 'bludgeoning');
      if (!sv.ok && w.hp > 0) w.conds.stunned = { by: u.id, fresh: true };
      yield 34;
    }
    u.anim = 'idle';
  }
  // its ranged routine (the multiattack's ranged names, else its first ranged attack once), each at the lowest AC in sight
  function* volley(B, u) {
    var keys = Array.isArray(u.multi) ? u.multi.filter(function (k) { return u.attacks[k] && u.attacks[k].ranged; }) : [];
    if (!keys.length) keys = Object.keys(u.attacks).filter(function (k) { return u.attacks[k].ranged; }).slice(0, 1);
    if (!keys.length || !u.turn.action) return false;
    var first = u.attacks[keys[0]];
    if (!visibleFrom(u, u.x, u.y, heroes(B, u)).some(function (w) { return G.dist(u, w) <= first.range[1]; })) return false;
    u.turn.action = 0;
    for (var i = 0; i < keys.length; i++) {
      var atk = u.attacks[keys[i]], seen = visibleFrom(u, u.x, u.y, heroes(B, u)).filter(function (w) { return G.dist(u, w) <= atk.range[1]; });
      if (!seen.length) break;
      yield* B.attack(u, seen.sort(function (p, q) { return RU.ac(p) - RU.ac(q) || p.hp - q.hp; })[0], atk);
      if (u.dead || u.hp <= 0) break;
    }
    return true;
  }
  function* shooter(B, u) {
    var T = u.turn, hs = heroes(B, u), far = u.attacks[Object.keys(u.attacks)[0]].range[0], exits = B.fight.exit || B.map.def.exit || [];
    // one who fights only to get away (the wagon pair, for the horses): each turn a move toward the way out, then the blasts
    if (u.flees && exits.length) {
      var rx = G.reach(u, Math.min(T.move, 15)), go = null, gd = Infinity; // they give ground a step at a time, blasting (bloodied, they Dash)
      Object.keys(rx).forEach(function (k) { var e = rx[k]; if (!e.stand) return; var d = Math.min.apply(null, exits.map(function (x) { return Math.max(Math.abs(x[0] - e.x), Math.abs(x[1] - e.y)); })) * 10 + e.cost / 10; if (d < gd) { gd = d; go = e; } });
      if (go && (go.x !== u.x || go.y !== u.y)) { yield* walkTo(B, u, go); if (u.dead || u.hp <= 0) return; }
      if (exits.some(function (x) { return x[0] === u.x && x[1] === u.y; })) {
        u.dead = true; u.fled = true; u.deadT = B.t; D.sfx('run');
        B.card(['{o}' + u.name + ' is gone' + (B.map.def.exitName ? ' ' + B.map.def.exitName : '') + '.{/}']); yield 30; return;
      }
      if (!(yield* volley(B, u))) { B.card(['{g}' + u.name + ' makes for the way out.{/}']); yield 16; }
      return;
    }
    if (G.foesNear(u, u.x, u.y, 5).length || !visibleFrom(u, u.x, u.y, hs).length) {
      var rm = G.reach(u, T.move), pick = null, ps = -1e9;
      Object.keys(rm).forEach(function (k) {
        var e = rm[k]; if (!e.stand) return;
        var vis = visibleFrom(u, e.x, e.y, hs); if (!vis.length) return;
        var near = Math.min.apply(null, hs.map(function (w) { return G.dist(u, w, e.x, e.y); }));
        var s = -G.foesNear(u, e.x, e.y, 5).length * 20 - Math.abs(near - Math.min(far, 30)) / 5 - e.cost / 10;
        if (s > ps) { ps = s; pick = e; }
      });
      if (pick && (pick.x !== u.x || pick.y !== u.y)) { yield* walkTo(B, u, pick); if (u.dead || u.hp <= 0) return; }
    }
    if (!(yield* volley(B, u))) { B.card(['{g}' + the(B, u) + ' has no clear shot.{/}']); yield 20; }
  }
  function* leap(B, u, hs) {
    var L = u.leap, best = null;
    hs.forEach(function (t) {
      if (G.dist(u, t) > L.range || !G.los(u, t).clear) return;
      var pair = hs.filter(function (w) { return w !== t && G.dist(w, t) <= 5; }).length;
      // a landing: free for its body, beside the target
      var land = null, ld = Infinity;
      for (var y = t.y - u.size; y <= t.y + (t.size || 1); y++) for (var x = t.x - u.size; x <= t.x + (t.size || 1); x++) {
        if (!G.canStand(u, x, y) || G.dist(u, t, x, y) > 5) continue;
        var d = Math.hypot(x - u.x, y - u.y); if (d < ld) { ld = d; land = [x, y]; }
      }
      if (land && (!best || pair > best.pair)) best = { t: t, pair: pair, land: land };
    });
    if (!best) return false;
    var T = u.turn; T.action = 0; L.ready = false;
    u.tween = { fx: u.x, fy: u.y, fz: 60, t: 0, dur: 22 }; u.x = best.land[0]; u.y = best.land[1];
    u.facing = B.faceTo(u, best.t); u.anim = 'attack'; u.animT = B.t; D.sfx('crit');
    var hit = [best.t].concat(hs.filter(function (w) { return w !== best.t && G.dist(w, best.t) <= 5 && G.dist(u, w) <= 5; }).slice(0, (L.targets || 2) - 1));
    var roll = D.roll(L.dice), lines = ['{r}' + the(B, u) + '{/} leaps, and comes down on them like a falling wall!  ' + L.dice + ' ' + RU.fmtRolls(roll.rolls) + ' = ' + roll.total + '  DEX DC ' + L.dc], hurt = [];
    yield 24;
    hit.forEach(function (w) {
      var sv = RU.save(w, 'dex', L.dc), ev = w.cls === 'rogue' && w.lvl >= 7, n = sv.ok ? (ev ? 0 : Math.floor(roll.total / 2)) : (ev ? Math.floor(roll.total / 2) : roll.total);
      lines.push('  ' + w.name + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{o}failed: prone{/}') + '  {r}' + n + '{/}'); hurt.push([w, n]);
      if (!sv.ok) w.conds.prone = true; // the Leap flattens those who fail
    });
    B.card(lines, 400);
    hurt.forEach(function (h) { FX.slash(h[0], D.PAL.ramps.red[4]); B.hurt(h[0], h[1], 'bludgeoning'); });
    yield 34; u.anim = 'idle';
    return true;
  }
  function* bolt(B, u) {
    var T = u.turn, exits = B.fight.exit || B.map.def.exit || [];
    if (!exits.length || !T.action) return false;
    T.action = 0; T.move = u.speed * 2; // Dash
    var rm = G.reach(u, T.move), best = null, bc = Infinity;
    exits.forEach(function (x) { var e = rm[x[0] + ',' + x[1]]; if (e && e.stand && e.cost < bc) { bc = e.cost; best = e; } });
    if (!best) { // not this turn: as close as the dash goes
      Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand) return; var d = Math.min.apply(null, exits.map(function (x) { return Math.max(Math.abs(x[0] - e.x), Math.abs(x[1] - e.y)); })); if (d * 100 + e.cost / 5 < bc) { bc = d * 100 + e.cost / 5; best = e; } });
    }
    B.card(['{r}' + the(B, u) + '{/} breaks and runs!  {g}(Dash){/}']); yield 16;
    if (best) yield* walkTo(B, u, best);
    if (u.dead || u.hp <= 0) return true;
    if (exits.some(function (x) { return x[0] === u.x && x[1] === u.y; })) {
      u.dead = true; u.fled = true; u.deadT = B.t; D.sfx('run');
      if (u.holding && u.holding.length) B.release(u);
      B.card(['{o}' + the(B, u) + ' is gone' + (B.map.def.exitName ? ' ' + B.map.def.exitName : '') + '.{/}']); yield 30;
    }
    return true;
  }
  function* brute(B, u) {
    var T = u.turn, hs = heroes(B, u);
    if (u.regen > 0 && u.hp > 0 && u.hp < u.maxhp) {
      if (u.burned) { B.card(['{g}' + u.name + ' does not knit: it burned.{/}']); yield 16; }
      else { B.heal(u, u.regen); B.card(['{r}' + u.name + '{/} knits back together.  +' + u.regen]); yield 20; }
    }
    u.burned = false;
    // it bolts (the wheelwright, when Hask is down): Dash for the map's exit and gone -- the player's opportunity attacks are
    // the only stop. (Amara and Willem, who fight only to get away, give ground a step at a time instead: shooter())
    if (u.bolts && B.units.some(function (w) { return w.kind === u.bolts && w.dead; })) { if (yield* bolt(B, u)) return; }
    // recharges (5-6 at the start of its turn): the Moan, the Leap
    [u.moan, u.leap].forEach(function (s) { if (s && !s.ready && D.d(6) >= s.recharge) s.ready = true; });
    // Phantasms (the cloaker when bloodied; Willem at once): three false images, its action
    if (u.phantasms && !u.phantasms.used && T.action && (u.phantasms.when === 'start' || u.hp <= u.maxhp / 2)) {
      T.action = 0; u.phantasms.used = true; u.images = 3; D.sfx('magic'); FX.sparkle(u, 'violet', 30);
      B.card(['{r}' + the(B, u) + '{/} splits into shadows: three false shapes wheel about it!  {g}(each blow may go at an image){/}'], 360);
      yield 34;
      if (!hs.length) return;
    }
    // the Moan (the cloaker): every hero within 60 ft, WIS or frightened till the end of its next turn; the mouther's
    // Gibbering is the same shape (20 ft, stunned) -- moan: { dc, recharge, cond, range, text }
    var MO = u.moan, mcond = MO && (MO.cond || 'frightened'), mrange = MO && (MO.range || 60);
    if (MO && MO.ready && T.action && hs.filter(function (w) { return G.dist(u, w) <= mrange && !w.conds[mcond]; }).length >= (MO.min || 2)) {
      T.action = 0; MO.ready = false; D.sfx('encounter');
      var ml = ['{r}' + the(B, u) + '{/} ' + (MO.text || 'moans. The sound gets inside you.') + '  WIS DC ' + MO.dc];
      hs.filter(function (w) { return G.dist(u, w) <= mrange; }).forEach(function (w) {
        var sv = RU.save(w, 'wis', MO.dc);
        ml.push('  ' + w.name + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}steady{/}' : mcond === 'stunned' ? '{p}STUNNED{/} (no turn)' : '{o}FRIGHTENED{/} (disadvantage to attack)'));
        if (!sv.ok) w.conds[mcond] = { by: u.id, fresh: true };
      });
      B.card(ml, 420); yield 40; return;
    }
    // the Leap (the bulette): into the air and down on up to two of them standing together (DEX, half on a save)
    if (u.leap && u.leap.ready && T.action && hs.length) { if (yield* leap(B, u, hs)) return; }
    // a spent Web comes back on a 5 or 6 (at the start of its turn)
    if (u.web && !u.web.ready) { var rc = D.d(6); if (rc >= u.web.recharge) { u.web.ready = true; B.card(['{g}' + the(B, u) + ' has web again (d6 ' + rc + ').{/}'], 200); yield 12; } }
    // a grip it can no longer reach goes slack
    (u.holding || []).slice().forEach(function (w) { if (w.dead || w.hp <= 0 || !w.conds.restrained || w.conds.restrained.by !== u.id || G.dist(u, w) > reachOf(u)) B.release(u, w); });
    if (!hs.length) return;
    // the Ring of Binding (the chuul, rounds 1/4/7/10): it must turn on whoever wears the ring
    if (B.taunt && B.taunt.rounds.indexOf(B.round) >= 0 && G.standing(B.taunt.u) && hs.indexOf(B.taunt.u) >= 0) {
      hs = [B.taunt.u]; B.card(['{r}' + the(B, u) + '{/} turns on {y}' + B.taunt.u.name + '{/}: the ring binds it  {g}(round ' + B.round + '){/}']); yield 20;
    }
    // Tentacle Slam, instead of the bites and lashes, on what it already holds (the 8-bit game: half the time)
    if (u.slam && u.holding.length && T.action && D.d(100) <= (u.slam.chance || 0.5) * 100) { yield* slam(B, u); return; }
    var near = hs.filter(function (w) { return G.dist(u, w) <= reachOf(u); }).sort(function (a, b) { return a.hp - b.hp; });
    // Web: at the start, or whenever no one is in reach -- the nearest free hero it can see, in range
    if (u.web && u.web.ready && T.action && (!near.length || B.round === 1)) {
      var free = hs.filter(function (w) { return !w.conds.restrained && G.dist(u, w) <= u.web.range[1] && G.los(u, w).clear; }).sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); });
      if (free.length) {
        yield* webShot(B, u, free[0]);
        if (u.dead || u.hp <= 0) return;
        // then close on whoever is caught, for next turn's bite
        var caught = hs.filter(function (w) { return w.conds.restrained; })[0] || free[0];
        if (G.dist(u, caught) > u.reach) yield* walkTo(B, u, approach(u, caught, G.reach(u, T.move)));
        return;
      }
    }
    var tgt = near[0], ranged = Object.keys(u.attacks || {}).filter(function (k) { return u.attacks[k].ranged; }).map(function (k) { return u.attacks[k]; });
    // all its attacks at range (Amara, Willem): keep off, step away when pressed, and shoot
    if (ranged.length && ranged.length === Object.keys(u.attacks).length) { yield* shooter(B, u); return; }
    if (!tgt) {
      tgt = hs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
      var e = approach(u, tgt, G.reach(u, T.move), reachOf(u));
      if (e && (e.x !== u.x || e.y !== u.y)) yield* walkTo(B, u, e);
      else if (u.bound) { B.card(['{g}' + the(B, u) + ' churns in its pool; no one is in its reach.{/}']); yield 20; }
      else if (!ranged.length) { B.card(['{g}' + the(B, u) + ' paces: it cannot get at anyone.{/}']); yield 20; }
      if (u.dead || u.hp <= 0) return;
    }
    if (!T.action) return;
    var inReachNow = heroes(B, u).filter(function (w) { return G.dist(u, w) <= reachOf(u); });
    // no one in reach after moving: a ranged attack if it has one (the giant's rock, the drow's hand crossbow)
    if (!inReachNow.length && ranged.length) { if (yield* volley(B, u)) return; }
    // Enlarge (the duergar), once, when there is no one to hit yet: its pick hits for the bigger dice from now on
    if (!inReachNow.length && u.enlarge && !u.enlarge.used) {
      T.action = 0; u.enlarge.used = true;
      var big = {}; Object.keys(u.attacks).forEach(function (k) { big[k] = Object.assign({}, u.attacks[k]); if (!big[k].ranged) big[k].dice = u.enlarge.dice; }); u.attacks = big;
      D.sfx('buff'); FX.ring(u, 'stone', 30); B.card(['{r}' + the(B, u) + '{/} swells to twice its size!  {g}(Enlarge: its blows hit for ' + u.enlarge.dice + '){/}']);
      yield 30; return;
    }
    T.action = 0;
    var names = Object.keys(u.attacks || {}), routine = Array.isArray(u.multi) ? u.multi : [];
    if (!routine.length) for (var i = 0; i < (u.multi || 1); i++) routine.push(names[0]);
    for (var k = 0; k < routine.length; k++) {
      var atk = u.attacks[routine[k]];
      if (!atk) break;
      // the weakest in this attack's reach; a grappling attack reaches first for someone it does not already hold; an
      // attack only for the held (the Keeper's Drag Under, the chuul's tentacles) goes at one it holds, or not at all
      var pool = atk.needsHeld ? (u.holding || []).filter(function (w) { return G.standing(w); }) : heroes(B, u);
      if (B.taunt && B.taunt.rounds.indexOf(B.round) >= 0 && G.standing(B.taunt.u) && !atk.needsHeld) pool = pool.filter(function (w) { return w === B.taunt.u; });
      var t = pool.filter(function (w) { return G.dist(u, w) <= (atk.reach || u.reach); }).sort(function (a, b) {
        if (atk.grapple) { var ha = u.holding.indexOf(a) >= 0, hb = u.holding.indexOf(b) >= 0; if (ha !== hb) return ha ? 1 : -1; }
        return a.hp - b.hp;
      })[0];
      if (!t) continue;
      yield* B.attack(u, t, atk);
      if (u.dead || u.hp <= 0) return;
    }
  }

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
