/* DEEP16 — THE KEEPER of the Flooded Stair (handoff-2026-10-02-the-keeper.md, Griz's design 10-02 and his answers 10-03). Ours, not the SRD's: the signature rules
   below are named as such in invented.json (#the-keeper). The numbers are in K.CFG, so the bench can move them.
   - ABOVE the water (its own squares in the pool) its action is a Slam at anyone in its 10 ft (data/foes.js keeper: DC 15 STR or prone) and its bonus action,
     every round, the WAVE: up the stair's lane toward the party, STR DC 13 or prone; it bounces off the front wall (the Ice Wall's row, else the exit) and the
     backwash sweeps every prone creature 10 ft toward the deep, where "pushed by the wave, you stand up free" -- no movement spent to rise.
   - WASHED INTO THE DEEP (a map's `deeps`): restrained, and the Keeper pours itself into the water around that one -- AC 10, its bonus action ACTIVE SUFFOCATION.
     Drowning is ours: at the start of the victim's turn 1d6 less its CON bonus (at least 1) while its head is under (not on a `deeps` square); rolled twice after
     an Active Suffocation. A blow to the Keeper in the water is a concentration check (CON, DC 10 or half the damage): lost, the victim is free of the hold but
     still drowning till its head is over water.
   - THE ICE WALL (3 uses; READY, then a hero moving toward the exit springs it): see the second half of this file. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx;
  var K = D.keeper = {};
  K.CFG = { waveDC: 13, sweep: 2, deepAC: 10, drown: '1d6', concMin: 10, wallUses: 3, wallHP: 30, wallAC: 12 }; // (sweep: squares of backwash per wave, 2 = 10 ft; Griz 10-03)

  function def() { return (G.map && G.map.def) || {}; }
  function Nm(B, u) { return u.side === 'foe' ? (u.named ? B.shortName(u) : 'The ' + B.shortName(u)) : u.name; }
  function st(B) { return B.kp || (B.kp = { uses: K.CFG.wallUses, ready: null, wall: null, ice: {}, waves: 0 }); }
  function keeperOf(B) { return B.units.filter(function (w) { return w.kind === 'keeper' && w.side === 'foe' && !w.dead && w.hp > 0; })[0] || null; }
  function foesOf(B, u) { return B.units.filter(function (w) { return w.side !== u.side && G.standing(w) && !(w.riding && !w.attached); }); }
  function tween(B, u) { u.tween = { fx: u.x, fy: u.y, fz: G.gzAt(u, u.x, u.y), t: 0, dur: B.pace ? B.pace(12, true) : 12 }; }

  K.isDeep = function (x, y) { return (def().deeps || []).some(function (p) { return p[0] === x && p[1] === y; }); };
  function inLane(x, y) { var l = def().lane; return !!l && x >= l.x0 && x <= l.x1 && y >= l.y0 && y <= l.y1; }
  function deepD(x, y) { var best = 1e9; (def().deeps || []).forEach(function (p) { best = Math.min(best, Math.max(Math.abs(p[0] - x), Math.abs(p[1] - y)) + 0.01 * Math.hypot(p[0] - x, p[1] - y)); }); return best; }
  // the stair's front wall: the Ice Wall's row if it stands, else the exit
  function frontRow(B) { var S = st(B); return S.wall ? S.wall.cy : (def().lane || {}).y1; }

  // ------------------------------------------------------------------ the Wave: the save, the bounce, the sweep
  // a hero on frozen water is anchored (Griz: "defensive icing approved"); set in K.freeze below
  function anchored(B, v) { return !!st(B).ice[v.x + ',' + v.y]; }
  function sweep(B, v) {
    var moved = 0;
    for (var i = 0; i < K.CFG.sweep; i++) {
      var best = null, bd = deepD(v.x, v.y);
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        var nx = v.x + dx, ny = v.y + dy;
        if (!G.canStand(v, nx, ny)) continue;
        var d = deepD(nx, ny); if (d < bd - 1e-9) { bd = d; best = [nx, ny]; }
      }
      if (!best) break;
      tween(B, v); v.x = best[0]; v.y = best[1]; moved++;
    }
    return moved;
  }
  K.wave = function* (B, u) {
    var S = st(B), l = def().lane, y1 = frontRow(B) - (S.wall ? 1 : 0);
    var hit = foesOf(B, u).filter(function (w) { return !w.conds.hidden && w.x >= l.x0 && w.x <= l.x1 && w.y >= l.y0 && w.y <= y1; });
    var lying = foesOf(B, u).filter(function (w) { return w.conds.prone && w.x <= l.x1 + 6 && w.y <= y1; });
    if (!hit.length && !lying.length) return false;
    S.waves++;
    B.focus(u); D.sfx('splash'); u.anim = 'attack'; u.animT = B.t;
    var rows = [], lane = [];
    for (var yy = l.y0; yy <= y1; yy++) for (var xx = l.x0; xx <= l.x1; xx++) { var q = G.map.at(xx, yy); if (q && q.open) lane.push([xx, yy]); }
    if (lane.length) FX.bloom((l.x0 + l.x1) >> 1, (l.y0 + y1) >> 1, lane, 'glow');
    rows.push('{r}' + Nm(B, u) + '{/} sends a wave up the stair.  {g}(the Wave, a bonus action: STR DC ' + K.CFG.waveDC + ' or prone){/}');
    hit.forEach(function (w) {
      if (w.conds.prone) return;
      var sv = RU.save(w, 'str', K.CFG.waveDC);
      if (sv.ok || w.noProne || RU.immuneTo(w, 'prone')) rows.push('  ' + w.name + ': STR ' + RU.saveText(sv) + ' vs DC ' + K.CFG.waveDC + '  {n}keeps its feet{/}');
      else { w.conds.prone = true; rows.push('  ' + w.name + ': STR ' + RU.saveText(sv) + ' vs DC ' + K.CFG.waveDC + '  {o}KNOCKED DOWN{/}'); }
    });
    B.card(rows, 260); yield 30;
    // the bounce off the front wall: every prone creature (not on frozen water) is swept toward the deep, and stands up free
    var swept = foesOf(B, u).filter(function (w) { return w.conds.prone && w.y <= y1; }), out = [], deep = [];
    swept.forEach(function (w) {
      if (anchored(B, w)) { out.push('  ' + w.name + ' is held by the ice underfoot: the backwash goes round.'); return; }
      if (w.conds.restrained) return;
      var n = sweep(B, w);
      if (n) { delete w.conds.prone; out.push('  ' + w.name + ' is swept ' + (n * 5) + ' ft toward the deep, and stands.  {g}(pushed by the wave: up free){/}'); if (K.isDeep(w.x, w.y)) deep.push(w); }
    });
    if (out.length) { B.card(['{c}The wave bounces off the ' + (S.wall ? 'ice' : 'wall') + ' and drags back.{/}'].concat(out), 260); yield 30; }
    for (var i = 0; i < deep.length; i++) { if (!u.flooding && G.standing(deep[i])) yield* K.flood(B, u, deep[i]); }
    return true;
  };

  // ------------------------------------------------------------------ washed into the deep: it pours itself into the water around the one it has
  function nearestSpot(B, u, v) {
    var best = null, bd = 1e9;
    for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) {
      if (!G.canStand(u, x, y) || G.dist(u, v, x, y) > 5) continue;
      var d = Math.max(Math.abs(x - u.x), Math.abs(y - u.y)); if (d < bd) { bd = d; best = [x, y]; }
    }
    return best;
  }
  K.flood = function* (B, u, v) {
    if (u.flooding || !G.standing(v) || RU.immuneTo(v, 'grappled')) return;
    v.conds.restrained = { dc: 13, by: u.id, grapple: true, water: true };
    v.conds.drowning = { by: u.id, twice: false };
    delete v.conds.prone;
    u.holding = (u.holding || []).concat([v]);
    u.flooding = { vic: v.id }; u.aboveAC = u.baseAC || u.ac; u.baseAC = K.CFG.deepAC;
    var spot = nearestSpot(B, u, v);
    if (spot && (spot[0] !== u.x || spot[1] !== u.y)) { tween(B, u); u.x = spot[0]; u.y = spot[1]; }
    B.focus(v); D.sfx('splash'); FX.ring(v, 'glow', 30);
    B.card(['{r}' + Nm(B, v) + '{/} is washed into the deep: {o}RESTRAINED{/}, and the Keeper pours into the water around ' + v.name + '.',
      '{g}(AC ' + K.CFG.deepAC + ' in the water: anything that strikes the water beside ' + v.name + ' strikes it. Escape DC 13, an action; or climb out where the head is over water){/}'], 320);
    yield 40;
  };
  K.surface = function (B, u, why) {
    if (!u.flooding) return;
    u.baseAC = u.aboveAC; u.aboveAC = null; u.flooding = null;
    B.card(['{g}' + Nm(B, u) + ' rises out of the water' + (why ? ' (' + why + ')' : '') + '.{/}'], 220);
  };
  // a blow to the Keeper in the water: a concentration check on the hold (the SRD's DC: 10 or half the damage)
  var hurt0 = D.Battle.prototype.hurt;
  D.Battle.prototype.hurt = function (u, n, type) {
    var f = u && u.kind === 'keeper' && u.flooding && u.hp > 0, hp0 = u.hp;
    var r = hurt0.apply(this, arguments);
    if (f && u.hp > 0 && u.hp < hp0 && u.flooding) {
      var v = this.units.filter(function (w) { return w.id === u.flooding.vic; })[0], dmg = hp0 - u.hp;
      if (v && v.conds.restrained && v.conds.restrained.by === u.id) {
        var dc = Math.max(K.CFG.concMin, Math.floor(dmg / 2)), sv = RU.save(u, 'con', dc);
        this.card(['  {c}' + Nm(this, u) + ' holds ' + v.name + ' under:{/} CON ' + RU.saveText(sv) + ' vs DC ' + dc + '  ' + (sv.ok ? '{n}the hold keeps{/}' : '{o}THE HOLD BREAKS{/}  {g}(' + v.name + ' is free of it, but drowns till its head is over water){/}')], 260);
        if (!sv.ok) this.release(u, v);
      }
    }
    return r;
  };

  // drowning is ours (see the head): the start of the drowned one's turn
  var start0 = RU.startTurn;
  RU.startTurn = function (u) {
    var r = start0.apply(this, arguments);
    if (u && u.conds && u.conds.drowning && D.battle) K.drownTick(D.battle, u);
    return r;
  };
  K.drownTick = function (B, u) {
    var dr = u.conds.drowning;
    if (!dr || u.hp <= 0) return;
    if (!K.isDeep(u.x, u.y)) { delete u.conds.drowning; B.card(['{n}' + u.name + ' gets a breath: head over the water.{/}'], 200); return; }
    var k = B.units.filter(function (w) { return w.id === dr.by; })[0], n = dr.twice ? 2 : 1, tot = 0, rolls = [], con = D.mod(u.abil ? u.abil.con : 10);
    for (var i = 0; i < n; i++) { var r = D.roll(K.CFG.drown), d = Math.max(1, r.total - con); tot += d; rolls.push(r.total); }
    dr.twice = false;
    D.sfx('splash');
    B.card(['{r}' + u.name + '{/} drowns' + (n > 1 ? ' {o}(flooded: twice){/}' : '') + ': ' + K.CFG.drown + (con ? ' less ' + con : '') + ' [' + rolls.join(', ') + '] = {r}' + tot + '{/}  {g}(Keeper\'s drowning, not the SRD\'s){/}'], 260);
    B.hurt(u, tot, 'drowning');
  };

  // ------------------------------------------------------------------ the Keeper's turn
  function* inWater(B, u) { // true: it has come up out of the water, and goes on as above
    var f = u.flooding, v = B.units.filter(function (w) { return w.id === f.vic; })[0];
    if (!v || !G.standing(v) || !v.conds.restrained || v.conds.restrained.by !== u.id) { K.surface(B, u, v && G.standing(v) ? 'its hold is gone' : 'no one is left in it'); return true; }
    if (u.turn.bonus > 0) { // ACTIVE SUFFOCATION: its bonus action, and the drowning is doubled at the victim's next turn
      u.turn.bonus = 0; v.conds.drowning = v.conds.drowning || { by: u.id }; v.conds.drowning.twice = true;
      B.focus(u); FX.ring(v, 'glow', 24); u.anim = 'attack'; u.animT = B.t;
      B.card(['{r}' + Nm(B, u) + '{/} floods ' + v.name + ': {o}ACTIVE SUFFOCATION{/}  {g}(a bonus action: the drowning is rolled twice at ' + v.name + '\'s next turn){/}'], 260); yield 40;
    }
    return false;
  }
  function* approachFoe(B, u, hs) { // keeps to its water: the square it can stand in that gets a foe into its reach, for the least move
    var T = u.turn, reach = G.reachOf(u, u.reach), rm = G.reach(u, T.move), best = null, bs = Infinity;
    var tgt = hs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
    if (!tgt) return;
    Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand) return; var d = G.dist(u, tgt, e.x, e.y), s = (d <= reach ? 0 : 1000 + d * 10) + e.cost; if (s < bs) { bs = s; best = e; } });
    if (!best || (best.x === u.x && best.y === u.y)) return;
    var path = G.path(rm, best.x, best.y);
    if (path && path.length) yield* B.moveAlong(u, path, { spend: true });
  }
  function* above(B, u) {
    var T = u.turn, S = st(B), hs = foesOf(B, u).filter(function (w) { return !w.conds.hidden || G.dist(u, w) <= (u.blindsight || 0); }), reach = G.reachOf(u, u.reach);
    var near = hs.filter(function (w) { return G.dist(u, w) <= reach; });
    if (!near.length && hs.length) { yield* approachFoe(B, u, hs); if (u.dead || u.hp <= 0) return; near = foesOf(B, u).filter(function (w) { return G.dist(u, w) <= reach; }); }
    if (T.action > 0 && near.length) { // the Slam: the weakest in its reach, one the Wave has not just taken the footing from first
      T.action = 0;
      var t = near.sort(function (a, b) { return a.hp - b.hp; })[0];
      yield* B.attack(u, t, u.attacks.slam);
      if (u.dead || u.hp <= 0) return;
    } else if (T.action > 0 && K.canReadyWall(B, u)) { yield* K.readyWall(B, u); }
    if (T.bonus > 0 && !u.dead && u.hp > 0 && (yield* K.wave(B, u))) T.bonus = 0;
  }
  K.turn = function* (B, u) {
    var S = st(B);
    if (S.ready) { S.ready = null; B.card(['{g}' + Nm(B, u) + '\'s readied wall: the moment passed.{/}'], 160); }
    if (u.flooding && !(yield* inWater(B, u))) return;
    yield* above(B, u);
  };

  // ------------------------------------------------------------------ the Ice Wall: filled in with its bench (this commit holds the hooks)
  K.canReadyWall = function () { return false; };
  K.readyWall = function* () {};
  K.watch = function* () {};
})();
