/* The Skylights' four, played as the seat would play them knowing the fight (10-05, Griz: "In my imagination, the party has a fairly generic AI fight
   for the benches. Please (off to the side somewhere - not for live) custom craft AI for the party as you would play it knowing how this fight works and
   run that as a lvl 6 and lvl 7 bench"). OFF TO THE SIDE: loaded only by dev/skylights-smart.py's page, between the game's scripts and dev/bench16.js;
   the game never loads it. smart=0 in the query keeps the class AI and only the tracker runs (the base line, counted the same way).

   What the seat knows that the class AI does not weigh:
   - Steinarr never strikes anyone; he is the clock. Clinging to the face, every blow that lands asks a DEX save (DC 10 or half the damage) or he falls
     the height he climbed, prone, and starts again -- so a hit on him up the face is worth the rounds of climbing it may undo, and many hits beat one.
   - Never stand under a climber: a giant that falls onto someone lands on its feet and the one under it goes flat; with nobody under it, it lands
     prone, and the melee has advantage on it. Adjacent is as good for a blade (a climber 7.5 ft up is within 5 ft of the square beside it).
   - Hallvor is the hitter; the trolls only matter once they burn (a troll down and not burned is up again at its turn).
   - Lymen's Bless on Pyro's five swings, Barley's and Vivian's is worth more than his own two on the first turn; his smites go on the giants only, one
     2nd-level slot kept for Aid; Lay on Hands to whoever is down.
   - Aurdin steps out of the brutes' reach before he casts, burns the downed troll first, and otherwise weighs Fireball, Scorching Ray, Magic Missile,
     Fire Bolt, Lightning Bolt and Ice Storm by hit points plus the falls they may cause.
   - Vivian does not hide in the open: she strikes where an ally stands beside the target (Sneak Attack), and gets out with Cunning Action when hurt.
   - Barley's Action Surge waits for a giant in reach, or for the end. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, M = D.magic, AI = D.ai, TX = D.tactics, BP = D.Battle.prototype, q = location.search;
  function get(k, d) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : d; }
  var SMART = get('smart', '1') !== '0';
  function edifice(B) { return !!(B && B.fight && B.fight.id === 'edifice'); }
  function byId(B, id) { return B.units.filter(function (w) { return w.id === id && !w.dead; })[0] || null; }
  function hanging(w) { return !!(w && w.hang && G.hanging(w)); }
  function ftUp(w) { return hanging(w) ? Math.round((w.hang.z - G.map.gz(w.x, w.y)) / G.map.def.step) * 2.5 : 0; }
  function onRoof(w) { return !!w && !hanging(w) && G.gzAt(w, w.x, w.y) >= 170; }
  function say(B, s) { if (B.o && B.o.bench) (B.benchLog = B.benchLog || []).push('SMART ' + s); }

  // ------------------------------------------------------------------ the tracker (both runs): when Steinarr topped out, fell, died; the glass's first hurt
  function K(B) { return B.sk || (B.sk = { stTop: 0, stFalls: 0, stDead: 0, haTop: 0, haFalls: 0, haDead: 0, glass1: 0, down: 0, pyroIn: 0 }); }
  var wave0 = BP.wave;
  BP.wave = function* () {
    yield* wave0.apply(this, arguments);
    if (!edifice(this)) return;
    var k = K(this), st = this.units.filter(function (w) { return w.id === 'giant2'; })[0], ha = this.units.filter(function (w) { return w.id === 'giant1'; })[0];
    if (st && !k.stTop && !st.dead && onRoof(st)) k.stTop = this.round;
    if (ha && !k.haTop && !ha.dead && onRoof(ha)) k.haTop = this.round;
    if (st && st.dead && !k.stDead) k.stDead = this.round;
    if (ha && ha.dead && !k.haDead) k.haDead = this.round;
    var py = this.units.filter(function (w) { return w.script === 'measure'; })[0];
    if (!k.pyroIn && ((py && py.wentIn) || (this.late || []).some(function (l) { return (l.walk || []).some(function (x) { return x.u && x.u.script === 'measure'; }); }))) k.pyroIn = this.round;
  };
  var hurt0 = BP.hurt;
  BP.hurt = function (u, amt) {
    var was = u && u.hp, r = hurt0.apply(this, arguments);
    if (edifice(this) && u) {
      var k = K(this);
      if (u.id === 'skylight' && u.hp < was && !k.glass1) k.glass1 = this.round;
      if (u.side === 'party' && !u.ally && !u.object && was > 0 && u.hp <= 0) k.down++;
    }
    return r;
  };
  var cling0 = BP.clingSave;
  BP.clingSave = function (u) {
    var r = cling0.apply(this, arguments);
    if (edifice(this) && u && !u.hang) { var k = K(this); if (u.id === 'giant2') k.stFalls++; if (u.id === 'giant1') k.haFalls++; }
    return r;
  };
  var enter0 = BP.enter;
  BP.enter = function () {
    var r = enter0.apply(this, arguments), self = this;
    if (edifice(this)) this.skyNote = function () { var k = K(self); return 'Steinarr top R' + (k.stTop || '-') + ' falls ' + k.stFalls + ' dead R' + (k.stDead || '-') + ' | Hallvor top R' + (k.haTop || '-') + ' falls ' + k.haFalls + ' dead R' + (k.haDead || '-') + ' | glass first hit R' + (k.glass1 || '-') + ' | the four went down ' + k.down + 'x | Pyro in R' + (k.pyroIn || '-'); };
    return r;
  };
  if (!SMART) return;

  // ------------------------------------------------------------------ the field as the seat reads it
  function scan(B, u) {
    var S = { st: byId(B, 'giant2'), ha: byId(B, 'giant1') };
    S.foes = B.units.filter(function (w) { return w.side === 'foe' && G.standing(w) && !w.object; });
    S.down = S.foes.filter(function (w) { return w.regenDown && !w.burned; });
    S.cling = S.foes.filter(hanging);
    S.under = {};
    S.cling.forEach(function (w) { G.foot(w).forEach(function (p) { S.under[p[0] + ',' + p[1]] = w; }); });
    S.ours = B.units.filter(function (w) { return w.side === 'party' && !w.dead && !w.object && G.present(w) && !w.away; });
    return S;
  }
  function underAt(S, x, y, size) { for (var j = 0; j < (size || 1); j++) for (var i = 0; i < (size || 1); i++) if (S.under[(x + i) + ',' + (y + j)]) return true; return false; }
  // what a hit point off each foe is worth
  function hpWorth(w) {
    if (w.id === 'giant2') return 1.4; // the clock
    if (w.id === 'giant1') return 1.2; // the hitter
    if (w.regen > 0) return w.regenDown ? 0 : w.burned ? 1 : 0.7; // a troll's come back unless it burns
    return 0.8;
  }
  // knocking a climber off the face now: the fall's dice, the rounds of climb undone, and the street's blades on it prone
  function fallWorth(S, w) {
    if (!hanging(w)) return 0;
    var h = ftUp(w); if (h <= 0) return 0;
    var per = w.id === 'giant2' ? 16 : w.id === 'giant1' ? 8 : w.regen > 0 ? 5 : 3;
    var cushion = G.foot(w).some(function (p) { return S.ours.some(function (o) { return !hanging(o) && G.foot(o).some(function (f) { return f[0] === p[0] && f[1] === p[1]; }); }); });
    var ground = cushion ? 0 : w.id === 'giant2' ? 18 : w.id === 'giant1' ? 12 : 4;
    return (h >= 10 ? Math.floor(h / 10) * 3.5 : 0) + (h / (w.climbs || 10) + 0.5) * per + ground;
  }
  function pFall(w, dmg) { return TX.pFail(w, 'dex', Math.max(10, Math.floor(dmg / 2))); }
  // the order of turns from the one acting now: does a's next turn come before t's?
  function before(B, a, t) {
    var o = B.order || [], i0 = o.indexOf(B.active), n = o.length;
    if (i0 < 0 || o.indexOf(a) < 0 || o.indexOf(t) < 0) return false;
    for (var k = 1; k <= n; k++) { var w = o[(i0 + k) % n]; if (w === a) return true; if (w === t) return false; }
    return false;
  }
  // the burner (Aurdin, up, with his cantrips): the one who makes a downed troll stay down
  function burnerBefore(B, t) {
    var a = byId(B, 'aurdin');
    if (!a || a.hp <= 0 || !RU.canAct(a) || a === B.active) return false;
    if (!((a.known || []).some(function (id) { return id === 'firebolt' || id === 'acidsplash'; }))) return false;
    return before(B, a, t) && G.dist(a, t) <= 120;
  }
  // fire on a troll standing (its knitting stopped till its turn, and a drop before then is the kill): what the party would drop on it first
  function burnUp(B, S, t) {
    if (!(t.regen > 0) || t.burned || t.regenDown) return 0;
    var exp = 0;
    S.ours.forEach(function (w) { if (w === B.active || w.hp <= 0 || !RU.canAct(w) || w.away) return; if (!before(B, w, t)) return; var r = G.reachOf(w) + (w.speed || 30); if (G.dist(w, t) <= r) exp += TX.dpr(w); });
    var hp = Math.max(1, t.hp), p = exp >= hp * 1.3 ? 0.85 : exp >= hp ? 0.6 : exp >= hp * 0.6 ? 0.3 : 0.1;
    return 10 + p * 55;
  }
  // the worth of `dmg` landing on w as one blow (its hit points, the drop if it drops, the fall it may cause, the burn if it is fire on a troll)
  function blowWorth(S, w, dmg, fire) {
    var B = D.battle, got = Math.min(dmg, Math.max(0, w.hp));
    var v = got * hpWorth(w);
    if (w.regen > 0 && !w.burned && fire) v += w.regenDown ? 70 : burnUp(B, S, w); // (a troll burned: down, it is dead; up, its knitting stops and the drop is the kill)
    if (dmg >= w.hp) {
      if (!(w.regen > 0) || w.burned || fire) v += TX.dpr(w) * 1.5 + (w.id === 'giant2' ? 40 : 0) + (w.regen > 0 ? 30 : 0);
      else if (burnerBefore(B, w)) v += 40; // (dropped unburned, with the burner's turn before its own: as good as the kill)
    }
    if (hanging(w) && dmg > 0 && dmg < w.hp) v += pFall(w, dmg) * fallWorth(S, w);
    return v;
  }
  // a threat count on a square: the foes that reach it now (heavily) and those that could reach it by their next turn
  function threatAt(B, u, S, x, y) {
    var t = 0;
    S.foes.forEach(function (f) {
      if (f.regenDown || f.missionOnly || !RU.canAct(f)) return;
      var r = G.reachOf(f), d = G.dist(u, f, x, y), w = TX.dpr(f) || 8;
      if (hanging(f)) w *= 0.4;
      if (d <= r) t += 3 * w; else if (d <= r + (f.speed || 30)) t += w * 0.6;
    });
    return t;
  }
  function squares(B, u, move, S) {
    var rm = G.reach(u, move), out = [{ x: u.x, y: u.y, cost: 0, stand: true, here: true, under: underAt(S, u.x, u.y, u.size) }]; // (standing under one already: it stays a choice, at a cost)
    Object.keys(rm).forEach(function (k) { var e = rm[k]; if (e.stand && !(e.x === u.x && e.y === u.y) && !underAt(S, e.x, e.y, u.size)) out.push(e); });
    return out;
  }

  // ------------------------------------------------------------------ the turn
  var FOUR = { barley: 1, aurdin: 1, vivian: 1, lymen: 1 };
  var turn0 = TX.turn;
  TX.turn = function* (B, u) {
    if (!edifice(B) || u.side !== 'party' || !FOUR[u.id] || u.ally) { yield* turn0.apply(this, arguments); return; }
    yield* smart(B, u);
  };
  function* smart(B, u) {
    var T = u.turn;
    if (u.hp <= 0 || u.dead) return;
    if ((M.mustFlee && M.mustFlee(u)) || u.conds.restrained || u.conds.grappled || hanging(u) || G.gzAt(u, u.x, u.y) >= 170) { yield* turn0(B, u); return; } // (held, afraid, on a rope or up top: the class AI)
    B.focus(u);
    var S = scan(B, u), done = false;
    try {
      if (u.id === 'aurdin') done = yield* aurdin(B, u, S);
      else if (u.id === 'lymen') done = yield* lymen(B, u, S);
      else done = yield* blade(B, u, S);
    } catch (e) { say(B, 'ERROR ' + u.name + ': ' + String(e && e.stack || e).slice(0, 400)); if (D.lastError == null) D.lastError = e; }
    if (u.dead || u.hp <= 0 || B.over()) return;
    if (!done) { say(B, u.name + ' R' + B.round + ': (the class AI)'); yield* turn0(B, u); return; }
    for (var j = 0; j < TX.AFTER.length; j++) { yield* TX.AFTER[j](B, u); if (u.dead || u.hp <= 0 || B.over()) return; } // (Second Wind; a bonus spell still worth it)
  }

  // ------------------------------------------------------------------ the blades: Barley, Vivian, and Lymen's sword arm
  function swingWorth(B, u, S, t, wp, x, y) {
    var e = RU.edges(u, t, wp, x, y), bless = u.conds.blessed ? 2.5 : 0, p = TX.pHit(wp.atk + (e.pen || 0) + bless, RU.ac(t), e.net), d = TX.avg(wp.dice) + (wp.mod || 0);
    if (u.cls === 'paladin' && smiteOK(t) && (u.slots || []).some(function (n) { return n > 0; })) d += 9;
    var sneak = 0;
    if (u.cls === 'rogue' && !(u.turn && u.turn.sneakUsed) && e.net >= 0 && (e.net > 0 || S.ours.some(function (w) { return w !== u && G.standing(w) && w.hp > 0 && RU.canAct(w) && G.dist(w, t) <= 5; }))) sneak = TX.avg(RU.sneakDice(u));
    return { p: p, d: d, sneak: sneak, v: p * blowWorth(S, t, d + sneak, false) };
  }
  function nAttacks(u) { return u.turn.attacksLeft > 0 ? u.turn.attacksLeft : (u.attacks || u.attacksBase || 1) + (u.turn.hasteAction ? 1 : 0); }
  function meleeTargets(S, u) { return S.foes.filter(function (w) { return !w.regenDown && w.hp > 0; }); }
  // the best (target, square) for the Attack action within `move`
  function meleePick(B, u, S, move) {
    var wp = u.weapon, rng = G.reachOf(u, wp.reach), n = nAttacks(u), best = null, ts = meleeTargets(S, u), au = byId(B, 'aurdin');
    if (!ts.length) return null;
    // (one standing over Aurdin is worth a quarter more: the burner kept up keeps the trolls down)
    var guardA = function (t) { return au && au !== u && au.hp > 0 && G.dist(t, au) <= G.reachOf(t) ? 1.25 : 1; };
    squares(B, u, move, S).forEach(function (e) {
      var crowd = G.foesNear(u, e.x, e.y, 5).filter(function (f) { return !f.regenDown && !f.missionOnly; }).length;
      ts.forEach(function (t) {
        if (G.dist(u, t, e.x, e.y) > rng) return;
        var s = swingWorth(B, u, S, t, wp, e.x, e.y), v = s.v * n * guardA(t) - e.cost / 30 - Math.max(0, crowd - 1) * 2 - (u.id === 'vivian' ? threatAt(B, u, S, e.x, e.y) * 0.03 : 0) - (e.under ? 30 : 0);
        if (!best || v > best.v) best = { v: v, t: t, e: e.here ? null : e };
      });
    });
    return best;
  }
  function smiteOK(t) { return t.id === 'giant1' || t.id === 'giant2'; }
  // one swing at the best in reach; Lymen's smite only on a giant, one 2nd-level slot kept for Aid
  function* swingOnce(B, u, S, prefer) {
    var wp = u.weapon, rng = G.reachOf(u, wp.reach);
    var ts = meleeTargets(S, u).filter(function (t) { return !t.dead && t.hp > 0 && G.dist(u, t) <= rng; });
    if (!ts.length) return false;
    var t = prefer && ts.indexOf(prefer) >= 0 ? prefer : ts.map(function (w) { return { w: w, v: swingWorth(B, u, S, w, wp, u.x, u.y).v }; }).sort(function (a, b) { return b.v - a.v; })[0].w;
    var real = u.slots, tmp = null, keep2 = 0;
    if (u.cls === 'paladin' && real && real.length) {
      tmp = real.slice();
      if (!smiteOK(t)) tmp = tmp.map(function () { return 0; });
      else { keep2 = Math.min(1, tmp[1] || 0); if (tmp.length > 1) tmp[1] -= keep2; }
      u.slots = tmp;
    }
    try { yield* B.exec(u, { do: 'attack', target: t }); }
    finally { if (tmp) { if (smiteOK(t)) for (var i = 0; i < real.length; i++) real[i] = tmp[i] + (i === 1 ? keep2 : 0); u.slots = real; } }
    S.foes = S.foes.filter(function (w) { return G.standing(w); });
    return true;
  }
  function* attackAction(B, u, S, t0) {
    var T = u.turn, first = true;
    while (!u.dead && u.hp > 0 && !B.over()) {
      if (!(T.attacksLeft > 0) && !(first && T.action)) break;
      if (!(yield* swingOnce(B, u, S, first ? t0 : null))) {
        // the one in reach is down: the rest of the swings at another, a step away if the move allows
        if (T.attacksLeft > 0 && T.move > 0) {
          var p = meleePick(B, u, S, T.move);
          if (p && p.e) { yield* AI.walkTo(B, u, p.e); if (yield* swingOnce(B, u, S, p.t)) { first = false; continue; } }
        }
        break;
      }
      first = false;
    }
    if (!(T.attacksLeft > 0)) T.attacksLeft = 0;
  }
  // a downed friend Lymen cannot reach this turn: a Potion of Healing from beside them (an action)
  function* potionUp(B, u, S) {
    var T = u.turn; if (!T.action || T.attacksLeft) return false;
    var downs = S.ours.filter(function (w) { return FOUR[w.id] && w !== u && w.hp <= 0 && !w.dead; }); if (!downs.length) return false;
    var ly = byId(B, 'lymen'), lyCan = function (w) { return ly && ly !== u && ly.hp > 0 && RU.canAct(ly) && ly.feats && ly.feats.lay > 0 && G.dist(ly, w) <= 5 + (ly.speed || 30); };
    var pot = B.itemList(u).filter(function (x) { return x.id === 'potion' && x.n > 0 && x.ok !== false; })[0]; if (!pot) return false;
    var rm = G.reach(u, T.move), pick = null;
    downs.forEach(function (w) {
      if (lyCan(w)) return;
      var e = G.dist(u, w) <= 5 ? { x: u.x, y: u.y, cost: 0, here: true } : AI.approach(u, w, rm, 5);
      if (e && G.dist(u, w, e.x, e.y) <= 5 && !underAt(S, e.x, e.y, 1) && (!pick || e.cost < pick.e.cost)) pick = { w: w, e: e };
    });
    if (!pick) return false;
    say(B, u.name + ' R' + B.round + ': a potion to ' + pick.w.name);
    if (!pick.e.here) yield* AI.walkTo(B, u, pick.e);
    if (u.dead || u.hp <= 0 || G.dist(u, pick.w) > 5 || !T.action) return true;
    yield* B.exec(u, { do: 'item', id: 'potion', target: pick.w });
    return true;
  }
  function surgeNow(B, u, S) {
    if (u.cls !== 'fighter' || !(u.feats && u.feats.actionSurge > 0) || u.turn.action || u.turn.attacksLeft) return false;
    var rng = G.reachOf(u, u.weapon.reach), inR = meleeTargets(S, u).filter(function (t) { return G.dist(u, t) <= rng; });
    if (!inR.length) return false;
    if (inR.some(function (t) { return t.id === 'giant1' || t.id === 'giant2'; })) return true;
    if (u.hp < u.maxhp * 0.4) return true;
    return S.foes.filter(function (w) { return !w.regenDown; }).length <= 2;
  }
  // Aurdin able to burn from the street (up, not on a rope or the roof, his cantrips known)
  function burnerUp(B) {
    var a = byId(B, 'aurdin');
    return !!(a && a.hp > 0 && RU.canAct(a) && !hanging(a) && !a.away && G.gzAt(a, a.x, a.y) < 40);
  }
  function* blade(B, u, S) {
    var T = u.turn;
    if (!u.weapon || !u.weapon.name || u.conds.disarmed) return false;
    if (yield* potionUp(B, u, S)) return true;
    // a troll down with nobody's fire before its turn: the pack's flask lit, or the torch thrown (the class AI's burn: tactics.js TX.burnDown)
    if (S.down.some(function (t) { return !burnerBefore(B, t); }) && T.action && !T.attacksLeft && (yield* TX.burnDown(B, u))) { say(B, u.name + ' R' + B.round + ': burns the troll down (flask or torch)'); return true; }
    // the burner gone from the street, trolls still on it, a hand free: Vivian lights a torch to be the fire
    if (u.id === 'vivian' && !u.torch && !burnerUp(B) && trollsOf(S).length && T.action && !T.attacksLeft) {
      var tch = B.itemList(u).filter(function (x) { return x.id === 'torch' && x.n > 0 && x.ok; })[0];
      if (tch) { say(B, 'Vivian R' + B.round + ': lights a torch (Aurdin is off the street)'); yield* B.exec(u, { do: 'item', id: 'torch', target: u }); var p0 = meleePick(B, u, S, T.move); if (p0 && p0.e) yield* AI.walkTo(B, u, p0.e); return true; }
    }
    var pick = meleePick(B, u, S, T.move), how = '';
    if (!pick && T.bonus && u.cls === 'rogue' && u.lvl >= 2) { var p2 = meleePick(B, u, S, T.move + u.speed); if (p2) { yield* B.exec(u, { do: 'cdash' }); pick = meleePick(B, u, S, T.move); how = ' (Cunning dash)'; } }
    if (!pick) {
      // nothing in reach this turn: close on the best on the street (not one up the face or on the roof -- the class AI has the rope for that)
      var ts = meleeTargets(S, u).filter(function (t) { return !hanging(t) && G.gzAt(t, t.x, t.y) < 40; });
      if (!ts.length) return false;
      var t = ts.map(function (w) { return { w: w, v: hpWorth(w) * 10 - G.dist(u, w) / 5 }; }).sort(function (a, b) { return b.v - a.v; })[0].w;
      if (T.action) yield* B.exec(u, { do: 'dash' });
      if (u.cls === 'rogue' && T.bonus) yield* B.exec(u, { do: 'cdash' });
      var rm = G.reach(u, T.move), best = null;
      Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand || underAt(S, e.x, e.y, u.size)) return; var s = G.dist(u, t, e.x, e.y) + e.cost / 100; if (!best || s < best.s) best = { s: s, e: e }; });
      say(B, u.name + ' R' + B.round + ': closes on ' + t.name);
      if (best) yield* AI.walkTo(B, u, best.e);
      return true;
    }
    say(B, u.name + ' R' + B.round + ': strikes ' + pick.t.name + (hanging(pick.t) ? ' on the face (' + ftUp(pick.t) + ' ft up)' : '') + how + ' ' + pick.v.toFixed(1));
    if (pick.e) yield* AI.walkTo(B, u, pick.e);
    if (u.dead || u.hp <= 0) return true;
    yield* attackAction(B, u, S, pick.t);
    if (u.dead || u.hp <= 0 || B.over()) return true;
    if (surgeNow(B, u, S)) { yield* B.exec(u, { do: 'surge' }); yield* attackAction(B, u, S, null); }
    // the rogue: out of the brutes' reach after, when hurt (Cunning Action's Disengage, the rest of the move)
    if (u.cls === 'rogue' && T.bonus && T.move > 0 && u.hp < u.maxhp * 0.6 && threatAt(B, u, S, u.x, u.y) > 20) {
      yield* B.exec(u, { do: 'cdisengage' });
      var sq = squares(B, u, T.move, S).map(function (e) { return { e: e, s: threatAt(B, u, S, e.x, e.y) + e.cost / 20 }; }).sort(function (a, b) { return a.s - b.s; })[0];
      if (sq && !sq.e.here) yield* AI.walkTo(B, u, sq.e);
    }
    return true;
  }

  // ------------------------------------------------------------------ Lymen
  function* lymen(B, u, S) {
    var T = u.turn;
    // one of ours down: Lay on Hands, walked to
    var downs = S.ours.filter(function (w) { return w.hp <= 0 && !w.dead && (FOUR[w.id] || w.script === 'measure'); }).sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); });
    if (downs.length && T.action && !T.attacksLeft && u.feats && u.feats.lay > 0) {
      var w = downs[0], e = G.dist(u, w) <= 5 ? null : AI.approach(u, w, G.reach(u, T.move), 5);
      if (!e || G.dist(u, w, e.x, e.y) <= 5) {
        if (e) yield* AI.walkTo(B, u, e);
        if (u.hp > 0 && G.dist(u, w) <= 5 && T.action) { say(B, 'Lymen R' + B.round + ': Lay on Hands to ' + w.name + ' (pool ' + u.feats.lay + ')'); yield* B.layOnHands(u, w, false); return true; }
      }
    }
    // himself, low and in the thick of it: the pool on his own wounds (the brutes' next round would put him down, and the party's healer with him)
    if (T.action && !T.attacksLeft && u.feats && u.feats.lay > 0 && u.hp < u.maxhp * 0.35 && threatAt(B, u, S, u.x, u.y) > 10) {
      var self = Math.min(u.feats.lay, u.maxhp - u.hp); // (the game's Lay on Hands gives what the pool holds, up to the wound: battle.js layOnHands -- no amount to pick)
      if (self >= 5) { say(B, 'Lymen R' + B.round + ': Lay on Hands, ' + self + ' to himself'); yield* B.layOnHands(u, u, false, self); return true; }
    }
    var list = M.list(B, u).filter(function (x) { return x.ok; }), has = function (id) { return list.filter(function (x) { return x.id === id; })[0]; };
    // Aid: one down out of reach, or two below half -- 2nd level
    var aid = has('aid');
    if (aid && T.action && !T.attacksLeft) {
      var addA = 5 * Math.max(1, aid.slot - 1), hadA = function (w) { return +(w.conds.aid || (w.src && w.src.conds && w.src.conds.aid) || 0); }; // (Aid does not stack: one aided at this slot gains nothing -- as tactics.js EV.aid reads it)
      var hurt = S.ours.filter(function (w) { return !w.dead && (FOUR[w.id] || w.script === 'measure') && G.dist(u, w) <= 30 && addA > hadA(w); }), low = hurt.filter(function (w) { return w.hp <= 0 || w.hp < w.maxhp * 0.4; });
      if (low.some(function (w) { return w.hp <= 0; }) || low.length >= 2) {
        var who = hurt.sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; }).slice(0, 3);
        say(B, 'Lymen R' + B.round + ': Aid on ' + who.map(function (w) { return w.name; }).join(', '));
        yield* B.exec(u, { do: 'cast', id: 'aid', slot: aid.slot, target: { units: who } }); return true;
      }
    }
    // Bless, the first turn there is a fight to bless (Pyro's swings, Barley's, Vivian's -- or his own)
    var bl = has('bless');
    if (bl && T.action && !T.attacksLeft && !(u.conc && u.conc.id === 'bless') && S.foes.length && (u.blessN || 0) < 2 && u.hp >= u.maxhp * 0.5) { // (twice a fight at most, and not from the floor: 10-05, the first run blessed four rounds running between potions)
      var cand = S.ours.filter(function (w) { return !w.dead && w.hp > 0 && !w.ally && !w.conds.blessed && G.dist(u, w) <= 30 && (FOUR[w.id] || w.script === 'measure'); });
      var rank = { pyro: 4, barley: 3, vivian: 2, lymen: 1.5, aurdin: 0.5 };
      cand.sort(function (a, b) { return (rank[b.id] || (b.script ? 4 : 0)) - (rank[a.id] || (a.script ? 4 : 0)); });
      var bw = cand.slice(0, 3);
      if (bw.length >= 2 && !u.conc) {
        say(B, 'Lymen R' + B.round + ': Bless on ' + bw.map(function (w) { return w.name; }).join(', '));
        u.blessN = (u.blessN || 0) + 1;
        yield* B.exec(u, { do: 'cast', id: 'bless', slot: bl.slot, target: { units: bw } });
        if (u.conc && u.conc.id === 'bless') u.conc.value = 40; // (nothing the class AI's bonus spells weigh is worth breaking it for)
        // then toward the fight, out from under any climber
        var p = meleePick(B, u, S, T.move);
        if (p && p.e) yield* AI.walkTo(B, u, p.e);
        return true;
      }
    }
    return yield* blade(B, u, S);
  }

  // ------------------------------------------------------------------ Aurdin
  function* aurdin(B, u, S) {
    var T = u.turn;
    if (!T.action || T.attacksLeft) return false;
    var pressed = S.foes.some(function (f) { return !f.regenDown && !f.missionOnly && RU.canAct(f) && G.dist(u, f) <= G.reachOf(f); });
    if (!pressed && T.move > 0) yield* safeStep(B, u, S);
    if (u.dead || u.hp <= 0) return true;
    var plans = aurdinPlans(B, u, S).sort(function (a, b) { return b.v - a.v; });
    // nothing to cast at from here, with trolls on the street: to where he sees one (the class AI would take him up the rope, and the street loses its fire -- the 72-round bench fight)
    if ((!plans[0] || plans[0].v <= 1) && trollsOf(S).length) {
      if (yield* seeStep(B, u, S, false)) plans = aurdinPlans(B, u, S).sort(function (a, b) { return b.v - a.v; });
      else if (T.action && (yield* seeStep(B, u, S, true))) { say(B, 'Aurdin R' + B.round + ': dashes to see the trolls'); return true; }
    }
    say(B, 'Aurdin R' + B.round + ': ' + plans.slice(0, 3).map(function (p) { return p.why + ' ' + p.v.toFixed(1); }).join(' | '));
    if (!plans[0] || plans[0].v <= 1) { if (trollsOf(S).length) { say(B, 'Aurdin R' + B.round + ': holds the street (no shot)'); return true; } return false; }
    yield* B.exec(u, { do: 'cast', id: plans[0].id, slot: plans[0].slot, target: plans[0].t });
    if (u.conc && u.conc.value == null) u.conc.value = 30;
    return true;
  }
  // the trolls on the street (up or down): what the burner must keep in sight
  function trollsOf(S) { return S.foes.filter(function (w) { return w.regen > 0 && !w.dead && G.gzAt(w, w.x, w.y) < 40; }); }
  function trollsSeen(B, u, S, x, y, ft) { return AI.visibleFrom(u, x, y, trollsOf(S)).filter(function (w) { return G.dist(u, w, x, y) <= ft; }).length; }
  function* seeStep(B, u, S, dash) {
    var T = u.turn, mv = T.move + (dash ? u.speed : 0), best = null;
    squares(B, u, mv, S).forEach(function (e) {
      var n = trollsSeen(B, u, S, e.x, e.y, 60); if (!n) return;
      var s = n * 10 - threatAt(B, u, S, e.x, e.y) - e.cost / 20 - (e.under ? 50 : 0);
      if (!best || s > best.s) best = { s: s, e: e };
    });
    if (!best) return false;
    if (dash) yield* B.exec(u, { do: 'dash' });
    if (!best.e.here) { var rm = G.reach(u, T.move), e2 = rm[best.e.x + ',' + best.e.y]; if (e2) yield* AI.walkTo(B, u, e2); }
    return true;
  }
  function* safeStep(B, u, S) {
    var anchor = S.st || S.foes.filter(function (f) { return !f.regenDown; })[0], tr = trollsOf(S).length;
    var eyes = function (x, y) { return tr ? trollsSeen(B, u, S, x, y, 60) : 0; }, seeHere = eyes(u.x, u.y);
    var here = threatAt(B, u, S, u.x, u.y) + (underAt(S, u.x, u.y, u.size) ? 50 : 0) - seeHere * 3, best = null;
    squares(B, u, u.turn.move, S).forEach(function (e) {
      if (anchor && G.dist(u, anchor, e.x, e.y) > 100) return;
      var see = eyes(e.x, e.y); if (seeHere && !see) return; // (never out of sight of the trolls he could see: he is their fire)
      var s = threatAt(B, u, S, e.x, e.y) + e.cost / 40 + (e.under ? 50 : 0) - see * 3 + (tr && !see ? 40 : 0);
      if (!best || s < best.s) best = { s: s, e: e };
    });
    if (best && !best.e.here && best.s < here - 2) yield* AI.walkTo(B, u, best.e);
  }
  function entry(B, u, id) { return M.list(B, u).filter(function (x) { return x.id === id && x.ok; })[0]; }
  function aurdinPlans(B, u, S) {
    var out = [], atk = u.spellAtk, dc = u.spellDC, SLOTV = 4;
    var sees = function (t, g) { return M.targetOK(B, u, g, t); };
    // the burn on one down: Acid Splash (no attack roll: it is down) or Fire Bolt
    S.down.forEach(function (t) {
      ['acidsplash', 'firebolt'].forEach(function (id) {
        var e = entry(B, u, id); if (!e || !sees(t, e.g)) return;
        var p = id === 'acidsplash' ? 1 : TX.pHit(atk, RU.ac(t), RU.edges(u, t, { spell: true, ranged: true, range: [e.g.range, e.g.range] }).net);
        out.push({ id: id, slot: 0, t: t, v: 70 * p + (id === 'acidsplash' ? 1 : 0), why: id + ' burns the ' + t.name + ' where it lies' });
      });
    });
    var targets = S.foes.filter(function (w) { return !w.regenDown && w.hp > 0; });
    // Fire Bolt at one standing
    var fb = entry(B, u, 'firebolt');
    if (fb) targets.forEach(function (t) { if (!sees(t, fb.g)) return; var d = TX.avg(M.dice(fb.sp, u, 0)), p = TX.pHit(atk, RU.ac(t) + G.los(u, t).cover, RU.edges(u, t, { spell: true, ranged: true, range: [fb.g.range, fb.g.range] }).net); out.push({ id: 'firebolt', slot: 0, t: t, v: p * blowWorth(S, t, d, true), why: 'Fire Bolt at ' + t.name + (hanging(t) ? ' (' + ftUp(t) + ' ft up)' : '') }); });
    // Scorching Ray: a ray at each one down first, the rest at the best single
    var sr = entry(B, u, 'scorchingray');
    // (each ray to where it adds most: a burn on one down, a burn on each troll the blades may drop before its turn, the falls on a climber, then hit points)
    if (sr) sr.levels.forEach(function (slot) {
      var n = (sr.g.n || 3) + Math.max(0, slot - sr.level), d = TX.avg(sr.sp.dmg), units = [], v = 0, on = {};
      var cand = S.down.concat(targets).filter(function (t) { return sees(t, sr.g); }).map(function (t) {
        var p = t.regenDown ? TX.pHit(atk, RU.ac(t), -1) : TX.pHit(atk, RU.ac(t) + G.los(u, t).cover, RU.edges(u, t, { spell: true, ranged: true, range: [sr.g.range, sr.g.range] }).net);
        return { t: t, p: p, burn: t.regen > 0 && !t.burned ? (t.regenDown ? 70 : burnUp(B, S, t)) : 0, fw: hanging(t) ? fallWorth(S, t) : 0, pf: pFall(t, d) };
      });
      for (var k = 0; k < n && cand.length; k++) {
        var bc = null;
        cand.forEach(function (c) { var m = on[c.t.id] || 0, mv = c.p * Math.pow(1 - c.p, m) * c.burn + c.p * c.pf * Math.pow(1 - c.p * c.pf, m) * c.fw + (c.t.regenDown ? 0 : c.p * d * hpWorth(c.t)); if (!bc || mv > bc.v) bc = { c: c, v: mv }; });
        units.push(bc.c.t); on[bc.c.t.id] = (on[bc.c.t.id] || 0) + 1; v += bc.v;
      }
      if (units.length) out.push({ id: 'scorchingray', slot: slot, t: { units: units }, v: v - slot * SLOTV, why: 'Scorching Ray L' + slot + ' (' + n + ') at ' + units.map(function (w) { return w.name; }).join(', ') });
    });
    // Magic Missile: every dart at one (one blow of their sum -- one save on the face)
    var mm = entry(B, u, 'magicmissile');
    if (mm) mm.levels.forEach(function (slot) {
      var n = (mm.g.n || 3) + Math.max(0, slot - mm.level), d = 3.5 * n, bt = null;
      targets.forEach(function (t) { if (!sees(t, mm.g) || t.conds.shield) return; var vv = blowWorth(S, t, d, false); if (!bt || vv > bt.v) bt = { t: t, v: vv }; });
      if (bt) { var us = []; for (var i = 0; i < n; i++) us.push(bt.t); out.push({ id: 'magicmissile', slot: slot, t: { units: us }, v: bt.v - slot * SLOTV, why: 'Magic Missile L' + slot + ' at ' + bt.t.name }); }
    });
    // the areas: Fireball, Lightning Bolt, Ice Storm -- the point that is worth most
    ['fireball', 'lightningbolt', 'icestorm'].forEach(function (id) {
      var e = entry(B, u, id); if (!e) return;
      e.levels.slice(0, 2).forEach(function (slot) {
        var dd = TX.avg(M.dice(e.sp, u, slot)) + (e.sp.dmg2 ? TX.avg(e.sp.dmg2) : 0), fire = /fire/.test(e.sp.el || ''), ab = e.sp.save || 'dex';
        var best = TX.bestArea(B, u, e, S.foes, function (caught) {
          var v = 0;
          caught.forEach(function (w) {
            if (!G.hostile(u, w)) { if (!(M.sculpts && M.sculpts(u, id))) v -= 2 * Math.min(dd, Math.max(1, w.hp)) + (w.script === 'measure' ? 200 : 0); return; }
            if (w.object) return;
            if (w.regenDown) { if (fire && !w.burned) v += 70; return; }
            var pf = TX.pFail(w, ab, dc), full = blowWorth(S, w, dd, fire), half = blowWorth(S, w, e.sp.half === false ? 0 : dd / 2, fire);
            v += pf * full + (1 - pf) * half;
          });
          return v;
        });
        if (best) out.push({ id: id, slot: slot, t: best.t, v: best.score - slot * SLOTV, why: e.name + ' L' + slot + ' (' + best.caught.filter(function (w) { return G.hostile(u, w); }).map(function (w) { return w.name; }).join(', ') + ')' });
      });
    });
    return out;
  }
})();
