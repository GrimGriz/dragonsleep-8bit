/* DEEP16 — the class tactics (handoff-2026-09-28 §3C): one AI for any unit with a class and a sheet, on either side -- the
   class NPCs (js/classes.js), and the four themselves on the bench. Each turn it weighs what it could do, the way a player
   would: every weapon it carries and every spell it can cast now (magic.js M.list), each at its best target from its best
   square, scored in hit points' worth -- the damage it should deal, what a hold or a sleep keeps off its side, what a heal
   gives back -- then moves and does the best. Concentration is kept (a new one must beat what the old one still holds), a
   bonus action is spent where the class has one, and the casters keep off the front.
   Estimates, not oracles: a caster controls, then damages; a healer heals the one who needs it; the martial ones use their
   features. The per-spell weighing lives beside the spell where it has one (M.EFFECT[id].ai, js/grimoire.js), else here. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, M = D.magic, AI = D.ai;
  var TX = D.tactics = {};

  // ------------------------------------------------------------------ the arithmetic
  TX.avg = function (expr) {
    var s = String(expr || '0').replace(/\s/g, ''), tot = 0;
    s.replace(/([+-]?)(\d*)d(\d+)|([+-]?)(\d+)/g, function (m, sg, n, f, sg2, k) {
      if (f) tot += (sg === '-' ? -1 : 1) * (+(n || 1)) * (+f + 1) / 2; else if (k) tot += (sg2 === '-' ? -1 : 1) * +k;
      return m;
    });
    return tot;
  };
  var avg = TX.avg;
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  // the chance an attack at +atk hits AC ac (1 always misses, 20 always hits), with advantage (net 1) or disadvantage (-1)
  TX.pHit = function (atk, ac, net) { var p = clamp((21 - (ac - atk)) / 20, 0.05, 0.95); return net > 0 ? 1 - (1 - p) * (1 - p) : net < 0 ? p * p : p; };
  // the chance w fails a save of ab against dc (an auto-fail for STR and DEX when it's held or stunned)
  TX.pFail = function (w, ab, dc) {
    if ((ab === 'str' || ab === 'dex') && (w.conds.paralyzed || w.conds.stunned || w.conds.asleep)) return 1;
    var b = (w.saves ? w.saves[ab] : D.mod((w.abil || {})[ab] || 10)) + (w.conds.blessed ? 2.5 : 0) - (w.conds.baned ? 2.5 : 0);
    return clamp((dc - b - 1) / 20, 0, 1);
  };
  // what a creature does in a round, in hit points (its weapon or its routine, its best cantrip, its slots): the weight of
  // stopping it
  TX.dpr = function (w) {
    if (!w || w.hp <= 0 || w.dead) return 0;
    if (w._dpr && w._dprT === (D.battle && D.battle.round)) return w._dpr;
    var v = 0;
    if (typeof w.attacks === 'number') {
      var wp = w.weapon || {}; v = (w.attacksBase || w.attacks || 1) * (avg(wp.dice) + (wp.mod || 0)) * 0.65;
      if (w.cls === 'rogue') v += avg(RU.sneakDice(w)) * 0.6;
      if (w.cls === 'monk') v += (avg(DS_R().martialDie(w.lvl)) + D.mod(w.abil.dex)) * 0.6;
      var top = 0; (w.slots || []).forEach(function (n, i) { if (n > 0) top = i + 1; });
      if (top && (w.known || []).length) v = Math.max(v, 4 + top * 6);
      else if ((w.known || []).some(function (id) { var sp = M.data(id); return sp && sp.level === 0 && sp.dmg; })) v = Math.max(v, 5.5 * (w.lvl >= 5 ? 2 : 1) * 0.65);
    } else {
      var at = w.attacks || {}, names = Object.keys(at), routine = Array.isArray(w.multi) ? w.multi : [];
      if (!routine.length) for (var i = 0; i < (w.multi || 1); i++) routine.push(names[0]);
      routine.forEach(function (k) { var a = at[k]; if (a) v += (avg(a.dice) + (a.mod || 0) + (a.save ? avg(a.save.dice) * 0.5 : 0)) * 0.6; });
      if (w.weave && w.weave.bolt) v = Math.max(v, avg(w.weave.bolt.dice) * 0.6);
    }
    w._dpr = Math.max(1, v); w._dprT = D.battle && D.battle.round;
    return w._dpr;
  };
  function DS_R() { return window.DS.R; }
  // a kill is worth its HP and the rounds it will not act; a wound, its share
  TX.worth = function (dmg, w) {
    if (!w || dmg <= 0) return 0;
    var hp = Math.max(1, w.hp), got = Math.min(dmg, hp);
    return got * (0.6 + TX.dpr(w) / Math.max(8, w.maxhp || hp) * 3) + (dmg >= hp ? TX.dpr(w) * 1.5 : 0);
  };

  // ------------------------------------------------------------------ who is who
  function foesOf(B, u) { return AI.heroes(B, u).filter(function (w) { return G.hostile(u, w) && G.standing(w); }); }
  function alliesOf(B, u) { return B.units.filter(function (w) { return w.side === u.side && !w.dead && !w.fled && !w.left && !w.ethereal; }); }
  TX.foesOf = foesOf; TX.alliesOf = alliesOf;
  // the sanctuaried and the charmer are no targets (Sanctuary: a WIS save first; charmed: never its charmer)
  function fair(B, u, w) { return !(w.conds.charmedBy && false); }

  // ------------------------------------------------------------------ weapons: every one it carries
  function weapons(u) {
    var out = [];
    if (u.conds.disarmed) return out; // (dropped: Command's DROP, Fear, Heat Metal)
    if (u.weapon && u.weapon.name) out.push(u.weapon);
    if (u.alt && u.alt.name) out.push(u.alt);
    return out;
  }
  function isRanged(wp) { return !!(wp && wp.ranged); }
  // the Attack action's swings: Extra Attack, a loading weapon's one; Haste's one more, Slow's one only (js/grimoire.js)
  function attacksWith(u, wp) { var n = wp.loading ? 1 : (u.attacksBase || (typeof u.attacks === 'number' ? u.attacks : 1) || 1); if (u.turn && u.turn.slowed) return 1; return n + (u.turn && u.turn.hasteAction ? 1 : 0); }
  // one swing's worth at t from square (x, y): the hit chance with what the square gives (flank, the dark, long range), the
  // dice, a rogue's sneak, a smite in hand
  function swing(B, u, t, wp, x, y) {
    var e = RU.edges(u, t, wp, x, y), ac = RU.ac(t) + (wp.ranged ? G.los(u, t, x, y).cover : 0);
    var p = TX.pHit(wp.atk + (e.pen || 0) + (u.conds.blessed ? 2.5 : 0), ac, e.net), d = avg(wp.dice) + (wp.mod || 0);
    if (u.conds.raging && !wp.ranged) d += 2;
    if (u.conds.divineFavor) d += 2.5;
    if (D.features && D.features.strikeBonus) d += D.features.strikeBonus(u, wp); // (a cleric's Divine Strike, 8: once a turn, and a cleric swings once)
    if (t.conds.marked && t.conds.marked.by === u.id && !(M.zoneGlobed && M.zoneGlobed(B, t.conds.marked, t))) d += 3.5; // (a mark on one inside a Globe of Invulnerability it was cast from outside of adds nothing)
    var sneak = 0;
    if (u.cls === 'rogue' && (wp.finesse || wp.ranged) && e.net >= 0 && (e.net > 0 || B.units.some(function (w) { return w !== u && w.side === u.side && G.standing(w) && G.dist(w, t) <= 5; }))) sneak = avg(RU.sneakDice(u));
    return { p: p, d: d, sneak: sneak, net: e.net };
  }
  // the best weapon plan: from the squares it can walk to this turn, the target and weapon worth most
  function weaponPlans(B, u, fs) {
    var T = u.turn, out = [];
    if (!T.action && !T.attacksLeft) return out;
    var rm = G.reach(u, T.move), here = { x: u.x, y: u.y, cost: 0, stand: true };
    var squares = [here];
    Object.keys(rm).forEach(function (k) { var e = rm[k]; if (e.stand && !(e.x === u.x && e.y === u.y)) squares.push(e); });
    weapons(u).forEach(function (wp) {
      var n = attacksWith(u, wp), rng = wp.ranged ? wp.range[1] : G.reachOf(u, wp.reach);
      var best = null;
      fs.forEach(function (t) {
        if (!M.sees(B, u, t) && G.dist(u, t) > 5 && wp.ranged) return;
        squares.forEach(function (e) {
          var d = G.dist(u, t, e.x, e.y);
          if (d > rng) return;
          if (wp.ranged && !G.los(u, t, e.x, e.y).clear) return;
          var near = G.foesNear(u, e.x, e.y, 5).length;
          var s = swing(B, u, t, wp, e.x, e.y), dmg = n * s.p * s.d + s.p * s.sneak;
          var sc = TX.worth(dmg, t);
          // walking into their reach costs a little; a bowman beside a foe (disadvantage is in the edges already) would rather not
          sc -= e.cost / 30 + (wp.ranged && near ? 2 : 0) + (!wp.ranged && near > 1 ? (near - 1) * 1.5 : 0);
          if (!best || sc > best.score) best = { score: sc, t: t, e: e, wp: wp, why: (wp.ranged ? 'shoots ' : 'strikes ') + t.name };
        });
      });
      if (best) out.push({ kind: 'weapon', score: best.score, why: best.why, go: function* () { yield* walk(B, u, best.e); yield* swingAll(B, u, best.wp, best.t); } });
    });
    return out;
  }
  function* walk(B, u, e) {
    if (!e || (e.x === u.x && e.y === u.y) || u.dead || u.hp <= 0) return;
    yield* AI.walkTo(B, u, e);
  }
  // the Attack action: every attack it has, the first at the chosen target, the rest at whoever is weakest in reach
  function* swingAll(B, u, wp, t0) {
    var T = u.turn;
    if (u.dead || u.hp <= 0) return;
    if (!T.attacksLeft) { if (!T.action) return; T.action = 0; T.attackAction = true; T.attacksLeft = attacksWith(u, wp); }
    var keep = u.weapon; u.weapon = wp;
    var rng = wp.ranged ? wp.range[1] : G.reachOf(u, wp.reach), first = true;
    // Reckless Attack (the barbarian, 2): advantage on its STR swings this turn, and at it till its next (js/features.js decides)
    if (!wp.ranged && D.features && D.features.reckless(u) && !u.conds.reckless) { u.conds.reckless = { till: { who: u.id, at: 'start', n: 1 } }; B.card(['{r}' + (u.side === 'foe' ? AI.the(B, u) : u.name) + ' swings recklessly.{/}'], 160); }
    while (T.attacksLeft > 0 && !u.dead && u.hp > 0) {
      var t = first && t0 && G.standing(t0) && G.dist(u, t0) <= rng ? t0 : foesOf(B, u).filter(function (w) { return G.dist(u, w) <= rng && (!wp.ranged || G.los(u, w).clear); }).sort(function (a, b) { return a.hp - b.hp; })[0];
      first = false;
      if (!t) break;
      T.attacksLeft--;
      yield* B.attack(u, t, wp);
      if (u.conds.hidden) delete u.conds.hidden;
    }
    T.attacksLeft = 0;
    u.weapon = keep;
  }
  TX.swingAll = swingAll;

  // ------------------------------------------------------------------ spells: each castable one at its best use
  function slotOf(e) { return e.levels && e.levels.length ? e.levels[0] : e.level; }
  // a spell's weight at a use: damage worth, control worth, a heal, a buff -- the spell's own `ai` where it has one
  function spellPlans(B, u, fs, allies) {
    var out = [], list = M.list(B, u).filter(function (e) { return e.ok; });
    list.forEach(function (e) {
      var ev = (M.EFFECT && M.EFFECT[e.id] && M.EFFECT[e.id].ai) || TX.EVAL[e.id] || TX.EVAL['shape:' + e.g.shape];
      if (!ev) return;
      var slot = slotOf(e), best = null;
      // the Globe of Invulnerability (SRD 5.1; js/grimoire.js M.globed): a creature inside one it is outside of is no candidate for a spell of the globe's level or
      // lower -- not a victim among the foes (a spell that takes a creature: the areas keep every foe as a place to aim, and TX.bestArea drops the shut ones from
      // what an area catches), not an ally to buff or heal -- or the slot is spent on nothing (10-01, Griz: "Yes to Longstriding Hastened Globe runners")
      var takes = /^(single|attack|rays|darts|splash|touch|allies)$/.test(e.g.shape) && e.g.side !== 'ally' && (e.g.shape !== 'allies' || e.g.side === 'foe'); // (the foes are victims here -- not where they are only the threat a buff weighs)
      var fsE = takes ? fs.filter(function (w) { return !M.globeShuts(B, u, e.g, w); }) : fs, alE = allies.filter(function (w) { return !M.globeShuts(B, u, e.g, w); });
      try { best = ev(B, u, e, slot, fsE, alE); } catch (err) { if (D.lastError == null) D.lastError = err; best = null; }
      if (!best) return;
      if (D.features && D.features.metaPlan) D.features.metaPlan(B, u, e, slot, best, ev, fs, allies); // (a sorcerer's metamagic on the plan, even one its friends spoil without it: js/features.js)
      if (!(best.score > 0)) return;
      // concentration: a new one must be worth more than what the old one still holds
      if (e.g.conc && u.conc && !(e.g.free && u.conc.id === e.id)) best.score -= (u.conc.value || 6);
      // a slot is dear: a leveled spell must beat what a cantrip or a swing would do by its level's cost (a spell already paid for is free)
      if (e.level > 0 && !e.g.free) best.score -= slot * 1.2;
      if (best.score <= 0) return;
      out.push({ kind: 'spell', id: e.id, level: e.level, score: best.score, why: e.name + (best.t && best.t.name ? ' on ' + best.t.name : '') + (best.meta ? ' (' + best.meta.name + ')' : ''), bonus: e.g.time === 'B', meta: best.meta || null, go: castGo(B, u, e, slot, best) });
    });
    return out;
  }
  function castGo(B, u, e, slot, best) {
    return function* () {
      if (best.from) yield* walk(B, u, best.from);
      if (u.dead || u.hp <= 0) return;
      // it may no longer be castable (the move provoked, it was held)
      var now = M.list(B, u).filter(function (x) { return x.id === e.id && x.ok; })[0];
      if (!now) return;
      var target = best.t;
      if (best.value != null) u._castValue = best.value;
      if (best.meta && !u.turn.quicken) u.turn.meta = best.meta; // (the metamagic the plan was weighed with: js/features.js M.cast pays and applies it)
      yield* B.exec(u, { do: 'cast', id: e.id, slot: best.slot || slot, target: target });
      u.turn.meta = null;
      if (u.conc && u.conc.id === e.id && u.conc.value == null) u.conc.value = best.keep != null ? best.keep : Math.max(4, best.score * 0.6);
    };
  }
  TX.spellPlansFor = function (B, u) { return spellPlans(B, u, foesOf(B, u), alliesOf(B, u)); };
  TX.EVAL = {};
  var EV = TX.EVAL;
  function inRangeOf(u, g, w, x, y) { return G.dist(u, w, x, y) <= (g.range || 5); }
  // a spell attack (Fire Bolt, Guiding Bolt ...)
  EV['shape:attack'] = function (B, u, e, slot, fs) {
    var sp = e.sp, g = e.g, d = avg(M.dice(sp, u, slot)), best = null;
    fs.forEach(function (t) {
      if (!M.targetOK(B, u, g, t)) return;
      var ed = RU.edges(u, t, { spell: true, ranged: g.range > 5, range: [g.range, g.range] }), p = TX.pHit(u.spellAtk, RU.ac(t) + G.los(u, t).cover, ed.net);
      var sc = TX.worth(p * d, t) + (M.EFFECT && M.EFFECT[e.id] && M.EFFECT[e.id].rider ? M.EFFECT[e.id].rider(B, u, t, p) : 0);
      if (!best || sc > best.score) best = { score: sc, t: t };
    });
    return best;
  };
  EV['shape:rays'] = function (B, u, e, slot, fs) {
    var n = (e.g.n || 1) + Math.max(0, slot - e.level), d = avg(e.sp.dmg), list = fs.filter(function (t) { return M.targetOK(B, u, e.g, t); });
    if (!list.length) return null;
    var t = list.sort(function (a, b) { return a.hp - b.hp; })[0], p = TX.pHit(u.spellAtk, RU.ac(t), 0), units = [];
    // the rays at the weakest till it should be down, then the next
    var left = t.hp, i = 0, sc = 0;
    for (var k = 0; k < n; k++) { var tg = list[Math.min(i, list.length - 1)]; units.push(tg); sc += TX.worth(p * d, tg) * 0.9; left -= p * d; if (left <= 0) { i++; left = (list[i] || tg).hp; } }
    return { score: sc, t: { units: units } };
  };
  EV['shape:darts'] = function (B, u, e, slot, fs) {
    var n = (e.g.n || 3) + Math.max(0, slot - e.level), list = fs.filter(function (t) { return M.targetOK(B, u, e.g, t); }).sort(function (a, b) { return a.hp - b.hp; });
    if (!list.length) return null;
    var units = [], sc = 0, i = 0, left = list[0].hp;
    for (var k = 0; k < n; k++) { var tg = list[Math.min(i, list.length - 1)]; units.push(tg); sc += TX.worth(3.5, tg); left -= 3.5; if (left <= 0 && i < list.length - 1) { i++; left = list[i].hp; } }
    return { score: sc, t: { units: units } };
  };
  EV['shape:splash'] = function (B, u, e, slot, fs) {
    var d = avg(M.dice(e.sp, u, 0)), best = null;
    fs.forEach(function (t) {
      if (!M.targetOK(B, u, e.g, t)) return;
      var sc = TX.worth(TX.pFail(t, 'dex', u.spellDC) * d, t), two = fs.filter(function (w) { return w !== t && G.dist(w, t) <= 5; })[0];
      if (two) sc += TX.worth(TX.pFail(two, 'dex', u.spellDC) * d, two);
      if (!best || sc > best.score) best = { score: sc, t: t };
    });
    return best;
  };
  // what one of its own caught in an area costs it: the damage that would land (or, `spared`, what a Careful Spell leaves -- a save made:
  // half, or none), weighed heavier for one it would drop (the AI's Careful Spell asks: js/features.js F.metaPlan)
  TX.areaFriendCost = function (u, e, slot, w, spared) {
    var sp = e.sp, d = avg(M.dice(sp, u, slot)) + (sp.dmg2 ? avg(sp.dmg2) : 0), pf = spared ? 0 : TX.pFail(w, sp.save || 'dex', u.spellDC), x = pf * d + (1 - pf) * (sp.half ? d / 2 : 0);
    return (w === u ? 3 : 2) * Math.min(x, w.hp) + (x >= w.hp ? 10 : 0);
  };
  // an area that deals damage (a save for half, or none): foes' worth less friends' (an evoker sculpts his own out)
  TX.areaWorth = function (B, u, e, slot, caught) {
    var sp = e.sp, d = avg(M.dice(sp, u, slot)) + (sp.dmg2 ? avg(sp.dmg2) : 0), ab = sp.save || 'dex', sc = 0;
    caught.forEach(function (w) {
      var pf = TX.pFail(w, ab, u.spellDC), x = pf * d + (1 - pf) * (sp.half ? d / 2 : 0);
      if (G.hostile(u, w)) sc += TX.worth(x, w);
      else if (!(M.sculpts && M.sculpts(u, e.id))) sc -= (w === u ? 3 : 2) * Math.min(x, w.hp) + (x >= w.hp ? 10 : 0);
    });
    return sc;
  };
  // the best point for an area: at each foe (and the square between two), or the direction of each for a cone, line or wave
  TX.bestArea = function (B, u, e, fs, weigh) {
    var g = e.g, best = null, tried = {};
    var pts = [];
    fs.forEach(function (t) { pts.push([t.x, t.y]); fs.forEach(function (t2) { if (t2 !== t && G.dist(t, t2) <= 15) pts.push([Math.round((t.x + t2.x) / 2), Math.round((t.y + t2.y) / 2)]); }); });
    pts.forEach(function (p) {
      var k = p[0] + ',' + p[1]; if (tried[k]) return; tried[k] = 1;
      var sq = M.area(u, g, p[0], p[1]);
      if (!sq.length) return;
      // (a creature inside a Globe of Invulnerability that the spell's level cannot cross counts for nothing in the score -- not a foe hit, not a friend spared
      // the blast: the spell does nothing to it, M.globed, js/grimoire.js)
      var caught = B.units.filter(function (w) { return G.present(w) && w.hp > 0 && G.inArea(w, sq) && !M.globeShuts(B, u, g, w); });
      if (!caught.some(function (w) { return G.hostile(u, w); })) return;
      var sc = weigh(caught, sq);
      if (!best || sc > best.score) best = { score: sc, t: { x: p[0], y: p[1] }, caught: caught };
    });
    return best;
  };
  // fire on a web (09-30, magic.js burnWebs): a burned square frees whoever of its own side it holds and opens the ground for those
  // the webs slow -- worth something beside the damage
  function webBurnWorth(B, u, sq) {
    if (!(B.webs || []).length) return 0;
    var sc = 0;
    sq.forEach(function (q) {
      if (!M.webbed(B, q[0], q[1])) return;
      B.units.forEach(function (w) {
        if (!G.standing(w) || w.webWalker || G.hostile(u, w)) return;
        if (G.inArea(w, [q])) sc += w.conds.restrained ? 8 : 1;
        else if (G.dist(w, { x: q[0], y: q[1], size: 1 }) <= 10) sc += 0.5;
      });
    });
    return sc;
  }
  function areaDamage(B, u, e, slot, fs) { return e.sp.dmg ? TX.bestArea(B, u, e, fs, function (caught, sq) { return TX.areaWorth(B, u, e, slot, caught) + (e.sp.el === 'fire' ? webBurnWorth(B, u, sq) : 0); }) : null; }
  EV['shape:sphere'] = areaDamage; EV['shape:cone'] = areaDamage; EV['shape:line'] = areaDamage; EV['shape:wave'] = areaDamage;
  // Sleep: the pool against the weakest in the sphere
  EV.sleep = function (B, u, e, slot, fs) {
    var pool = avg((e.g.pool + e.g.poolUp * Math.max(0, slot - 1)) + 'd8');
    return TX.bestArea(B, u, e, fs, function (caught) {
      var left = pool, sc = 0;
      caught.slice().sort(function (a, b) { return a.hp - b.hp; }).forEach(function (w) {
        if (w.fey || w.kind === 'drow' || RU.immuneTo(w, 'asleep') || w.hp > left) return;
        left -= w.hp; sc += (G.hostile(u, w) ? 1 : -1.2) * (TX.dpr(w) * 2.2 + 2);
      });
      return sc;
    });
  };
  // Web: restrained, a save each turn -- the held lose most of a round and are easy to hit
  EV.web = function (B, u, e, slot, fs) {
    if (u.conc && u.conc.id === 'web') return null;
    return TX.bestArea(B, u, e, fs, function (caught) {
      var sc = 0;
      caught.forEach(function (w) { if (w.webWalker || RU.immuneTo(w, 'restrained')) return; var pf = TX.pFail(w, 'dex', u.spellDC); sc += (G.hostile(u, w) ? 1 : -1.3) * pf * (TX.dpr(w) * 0.6 + 4) * 2; });
      return sc;
    });
  };
  // Hold Person, Hold Monster: paralyzed (auto-crits beside it), a save each turn
  function holdEval(B, u, e, slot, fs) {
    var best = null;
    fs.forEach(function (t) {
      if (!M.targetOK(B, u, e.g, t) || t.conds.paralyzed || RU.immuneTo(t, 'paralyzed')) return;
      var pf = TX.pFail(t, 'wis', u.spellDC), rounds = Math.min(3, 1 / Math.max(0.25, 1 - pf));
      var sc = pf * (TX.dpr(t) * rounds + 6);
      if (!best || sc > best.score) best = { score: sc, t: t, keep: sc * 0.7 };
    });
    return best;
  }
  EV.holdperson = holdEval; EV.holdmonster = holdEval;
  // the heals: what it gives back where it's needed (the down first, then the worst under half)
  TX.healNeed = function (B, u, w) {
    if (!w || w.dead || w.fled) return 0;
    var frac = w.hp / Math.max(1, w.maxhp);
    return w.hp <= 0 ? 3 : frac < 0.3 ? 1.6 : frac < 0.55 ? 1 : frac < 0.8 ? 0.35 : 0;
  };
  EV.curewounds = function (B, u, e, slot, fs, allies) {
    var amt = avg((1 + Math.max(0, slot - 1)) + 'd8') + M.mod(u) + (u.subclass === 'Life Domain' ? 2 + slot : 0), best = null;
    allies.forEach(function (w) {
      if (w.dead) return;
      var need = TX.healNeed(B, u, w); if (!need) return;
      var got = Math.min(amt, w.maxhp - Math.max(0, w.hp)), d = G.dist(u, w), from = null;
      if (d > 5) { var rm = G.reach(u, u.turn.move); from = AI.approach(u, w, rm, 5); if (!from || G.dist(u, w, from.x, from.y) > 5) return; }
      var sc = got * need + (w.hp <= 0 ? TX.dpr(w) * 2 : 0);
      if (!best || sc > best.score) best = { score: sc, t: w, from: from };
    });
    return best;
  };
  // Bless: +1d4 to the attacks and saves of three of its own for the fight
  EV.bless = function (B, u, e, slot, fs, allies) {
    if (u.conc && u.conc.id === 'bless') return null;
    var n = 3 + Math.max(0, slot - 1), who = allies.filter(function (w) { return G.standing(w) && !w.conds.blessed && G.dist(u, w) <= 30; }).sort(function (a, b) { return TX.dpr(b) - TX.dpr(a); }).slice(0, n);
    if (!who.length || !fs.length) return null;
    var sc = who.reduce(function (s, w) { return s + TX.dpr(w) * 0.12 * 3 + 1; }, 0);
    return { score: sc, t: { units: who }, keep: sc * 0.6 };
  };
  EV.aid = function (B, u, e, slot, fs, allies) {
    // (what it adds over the Aid already on each: the same spell doesn't combine -- 09-28h; one already aided at this slot gains nothing)
    var add = 5 * Math.max(1, slot - 1), had = function (w) { return +(w.conds.aid || (w.src && w.src.conds && w.src.conds.aid) || 0); };
    var who = allies.filter(function (w) { return !w.dead && G.dist(u, w) <= 30 && add > had(w); }).sort(function (a, b) { return (a.hp / a.maxhp) - (b.hp / b.maxhp); }).slice(0, 3 + Math.max(0, slot - 2));
    if (!who.length) return null;
    var sc = who.reduce(function (s, w) { var more = add - had(w); return s + (w.hp <= 0 ? more * 3 + TX.dpr(w) : w.hp < w.maxhp / 2 ? more * 1.3 : more * 0.7); }, 0);
    return { score: sc, t: { units: who } };
  };
  EV.shieldoffaith = function (B, u, e, slot, fs, allies) {
    if (u.conc) return null;
    var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 60 && !w.conds.shieldOfFaith; }).sort(function (a, b) { return foesNear(B, b) - foesNear(B, a) || a.baseAC - b.baseAC; })[0];
    if (!t) return null;
    var sc = 2 + foesNear(B, t) * 2.5;
    return { score: sc, t: t, keep: sc * 0.6 };
  };
  function foesNear(B, w) { return B.units.filter(function (x) { return G.hostile(w, x) && G.standing(x) && G.dist(w, x) <= 10; }).length; }
  EV.divinefavor = function (B, u, e, slot, fs) {
    if (u.conc || !fs.some(function (t) { return G.dist(u, t) <= u.turn.move + 5; })) return null;
    var sc = (u.attacksBase || 1) * 2.5 * 0.65 * 3;
    return { score: sc, t: u, keep: sc * 0.5 };
  };
  EV.heroism = function (B, u, e, slot, fs, allies) {
    if (u.conc) return null;
    var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 && !w.conds.heroism; }).sort(function (a, b) { return foesNear(B, b) - foesNear(B, a); })[0];
    if (!t) return null;
    return { score: Math.max(1, M.mod(u)) * 3 + 1, t: t };
  };
  EV.lesserrestoration = function (B, u, e, slot, fs, allies) {
    var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 + u.turn.move && (w.conds.paralyzed || w.conds.poisoned || w.conds.blinded); })[0];
    if (!t) return null;
    var from = G.dist(u, t) > 5 ? AI.approach(u, t, G.reach(u, u.turn.move), 5) : null;
    return { score: TX.dpr(t) * (t.conds.paralyzed ? 2.5 : 1.2), t: t, from: from };
  };
  EV.greaterinvisibility = function (B, u, e, slot, fs, allies) {
    if (u.conc) return null;
    var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 && !w.conds.invisible; }).sort(function (a, b) { return TX.dpr(b) - TX.dpr(a); })[0];
    return t ? { score: TX.dpr(t) * 0.5 * 3, t: t } : null;
  };
  // Mislead (09-28h: the Window's 9th, Willem's 5th past his register): unseen till it attacks or casts, and a double for a blow to go
  // at -- worth it to one hurt and pressed (built in magic.js; no weighing had it, so no AI cast it)
  EV.mislead = function (B, u, e, slot, fs) {
    if (u.conc || u.conds.invisible || u.hp > u.maxhp * 0.5) return null;
    var th = fs.filter(function (t) { return G.dist(u, t) <= G.reachOf(t) + (t.speed || 30); }).reduce(function (s, t) { return s + TX.dpr(t); }, 0);
    return th ? { score: th * 0.6 + 2, t: u, keep: th * 0.4 } : null;
  };
  EV.stoneskin = function (B, u, e, slot, fs, allies) {
    if (u.conc) return null;
    var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 && !w.conds.stoneskin; }).sort(function (a, b) { return foesNear(B, b) - foesNear(B, a); })[0];
    return t && foesNear(B, t) ? { score: foesNear(B, t) * 4, t: t } : null;
  };
  // Misty Step: out of a grip or a web, or away from the front when a caster stands in it
  EV.mistystep = function (B, u, e, slot, fs) {
    var pressed = G.foesNear(u, u.x, u.y, 5).length;
    if (!pressed && !(u.conds.restrained)) return null;
    if (!u.known.some(function (id) { var sp = M.data(id); return sp && (sp.dmg || sp.kind === 'save'); }) && !u.conds.restrained) return null; // (a caster's: the fighters stay)
    var sq = B.mistyTargets ? B.mistyTargets(u) : [], best = null;
    sq.forEach(function (q) {
      var near = fs.filter(function (t) { return G.dist(u, t, q[0], q[1]) <= 5; }).length, far = Math.min.apply(null, fs.map(function (t) { return G.dist(u, t, q[0], q[1]); }).concat([99]));
      if (near) return;
      var s = 6 + pressed * 4 + (u.conds.restrained ? 8 : 0) - Math.abs(far - 30) / 10;
      if (!best || s > best.score) best = { score: s, t: { x: q[0], y: q[1] } };
    });
    return best;
  };
  // Mage Armor, Light, the rest that do nothing worth an action in a fight
  EV.mageArmor = function (B, u, e, slot, fs, allies) {
    if (B.round > 1 || u.conds.mageArmor || u.armored) return null;
    return { score: 2, t: u };
  };
  // Daylight: the light-haters caught in it, and a Darkness it would burn away
  EV.daylight = function (B, u, e, slot, fs) {
    // (the Globe of Invulnerability, SRD 5.1: Daylight is a spell of the 3rd, and "the area within the barrier is excluded from the areas affected by such spells" -- a light-hater
    // inside one the cast is from outside of is not lit, and a Darkness is burnt away only where it has a square outside the globe: neither counts. M.globeShuts / M.globed, js/grimoire.js)
    var shy = fs.filter(function (t) { return t.lightSensitive && !t.recoiled && !M.globeShuts(B, u, e.g, t); }),
      dk = (B.darks || []).filter(function (d) { return d.kind === 'darkness' && !B.units.some(function (w) { return w.id === d.by && w.side === u.side; }) && M.darkSq(B, d).some(function (q) { return !M.globed(B, u, { x: q[0], y: q[1] }, e.g.lvl); }); });
    if (!shy.length && !dk.length) return null;
    if (B.fight && B.fight.roost) return null;
    var t = (shy[0] || fs[0]);
    return { score: shy.reduce(function (s, w) { return s + TX.dpr(w) * 1.3; }, 0) + dk.length * 8, t: { x: t.x, y: t.y } };
  };
  // Stinking Cloud, Sleet Storm: the lost actions (and the prone) of the foes inside, less its own
  EV.stinkingcloud = function (B, u, e, slot, fs) {
    return TX.bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { if (RU.immuneTo(w, 'poisoned')) return; sc += (G.hostile(u, w) ? 1 : -1.5) * TX.pFail(w, 'con', u.spellDC) * TX.dpr(w) * 1.8; }); return sc; });
  };
  EV.sleetstorm = function (B, u, e, slot, fs) {
    return TX.bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { sc += (G.hostile(u, w) ? 1 : -1.5) * (TX.pFail(w, 'dex', u.spellDC) * 3 + 2); }); return sc; });
  };
  EV.seeinvisibility = function (B, u, e, slot, fs) {
    var inv = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && w.conds.invisible; });
    return inv.length ? { score: inv.reduce(function (s, w) { return s + TX.dpr(w); }, 0), t: u } : null;
  };

  // ------------------------------------------------------------------ the turn
  TX.turn = function* (B, u) {
    var T = u.turn;
    if (u.hp <= 0 || u.dead) return;
    B.focus(u);
    // Fear's run (SRD 5.1): the Dash, away from the one it fears, and nothing else
    if (M.mustFlee && M.mustFlee(u)) { yield* TX.fleeFear(B, u); return; }
    // one who fights only to get away (Amara and Willem on the road): the way out first, and what it can throw from there
    var exits = (B.fight && B.fight.exit) || (B.map && B.map.def.exit) || [];
    if (u.flees && exits.length) { yield* fleeTurn(B, u, exits); return; }
    // one it holds out of the fight (Banishment, Resilient Sphere, Maze) and no other foe standing: it lets go, so the fight can be
    // finished (09-28h: the tester ladder's Brood stalled eighty thousand rounds, the broodmother banished and nothing else to hit)
    if (u.conc && !foesOf(B, u).length && B.units.some(function (w) { return G.hostile(u, w) && !w.dead && w.hp > 0 && w.conds.banished && w.conds.banished.by === u.id; })) { M.endConc(B, u, 'to finish it'); yield 16; }
    var fs = foesOf(B, u);
    if (!fs.length) {
      // no one it knows of: toward the nearest it can hear, then wait
      var any = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && !w.conds.hidden; }).sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
      if (any) yield* walk(B, u, AI.approach(u, any, G.reach(u, T.move), G.reachOf(u)));
      return;
    }
    // the features and bonus actions that go first (js/tactics.js TX.FIRST: rage, the marks, a word of healing to the fallen)
    for (var i = 0; i < TX.FIRST.length; i++) { yield* TX.FIRST[i](B, u); if (u.dead || u.hp <= 0 || B.over()) return; }
    yield* act(B, u);
    if (u.dead || u.hp <= 0 || B.over()) return;
    // Action Surge (the fighter): the action again, once, while there is someone to hit
    if (u.cls === 'fighter' && u.lvl >= 2 && u.feats && u.feats.actionSurge > 0 && !T.action && !T.attacksLeft && foesOf(B, u).some(function (t) { return G.dist(u, t) <= (u.weapon.ranged ? u.weapon.range[1] : 5 + T.move); }) && (!u.src || !u.src.wounded)) {
      u.feats.actionSurge = 0; T.action = 1; D.sfx('buff'); B.card(['{y}' + u.name + '{/} surges!  {g}(Action Surge: a second action){/}']); yield 16;
      yield* act(B, u);
      if (u.dead || u.hp <= 0 || B.over()) return;
    }
    for (var j = 0; j < TX.AFTER.length; j++) { yield* TX.AFTER[j](B, u); if (u.dead || u.hp <= 0 || B.over()) return; }
    yield* keepOff(B, u);
  };
  // every plan for u's action weighed, best first; `bonus`: the bonus-action spells instead (the play record reads both: js/record.js)
  TX.plans = function (B, u, bonus) {
    var fs = foesOf(B, u), allies = alliesOf(B, u), sp = spellPlans(B, u, fs, allies);
    var plans = bonus ? sp.filter(function (p) { return p.bonus; }) : weaponPlans(B, u, fs).concat(sp.filter(function (p) { return !p.bonus; }));
    if (!bonus) TX.ACTIONS.forEach(function (f) { var p = f(B, u, fs, allies); if (p) plans = plans.concat(p); });
    return plans.sort(function (a, b) { return b.score - a.score; });
  };
  // the action: every plan weighed, the best taken; nothing worth doing -- close in (Dash), or Dodge
  function* act(B, u) {
    var T = u.turn;
    if (!T.action && !T.attacksLeft) return;
    var fs = foesOf(B, u), plans = TX.plans(B, u);
    var pick = plans[0];
    if (B.o && B.o.bench) (B.benchLog = B.benchLog || []).push(u.name + ' R' + B.round + ': ' + plans.slice(0, 3).map(function (p) { return p.why + ' ' + p.score.toFixed(1); }).join(' | '));
    if (pick && pick.score > 0.5) { yield* pick.go(); return; }
    // nothing in reach: close on the nearest (a Dash if it has nothing at range)
    var near = fs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
    if (!near) return;
    var bd = TX.bonusDash(u); // (the bonus action's Dash, Expeditious Retreat's or the rogue's Cunning Action: taken before the action's, which may keep)
    var rm = G.reach(u, T.move + (T.action ? u.speed : 0) + (bd ? u.speed : 0));
    var e = AI.approach(u, near, rm, G.reachOf(u));
    if (e && bd && e.cost > T.move) yield* B.exec(u, { do: 'cdash' });
    if (e && T.action && e.cost > T.move && !u.conds.restrained && !u.conds.dancing) { T.action = 0; T.move += u.speed; B.card(['{g}' + (u.side === 'foe' ? AI.the(B, u) : u.name) + ' dashes.{/}'], 160); }
    if (e) yield* walk(B, u, e);
  }
  TX.act = act;
  // the run (the shooter's, ai.js, for a class caster): her Darkness the turn she breaks (the 8-bit's "Amara throws darkness over the
  // yard!", paid from a slot when she has one); a step toward the way out (a stride in the 8-bit yard, fight.runWhenHurt or fledEnds);
  // gone at the edge; else the best spell or shot from where she stands
  function* fleeTurn(B, u, exits) {
    var T = u.turn;
    if (u.darkness && !u.darkness.used && T.action) { var lv = M.slotLevels(u, 2)[0]; if (yield* M.castDarkness(B, u)) { if (lv && u.darkness.spell) u.slots[lv - 1]--; } }
    if (u.dead || u.hp <= 0) return;
    var rx = G.reach(u, B.fight.runWhenHurt || B.fight.fledEnds ? T.move : Math.min(T.move, 15)), go = null, gd = Infinity;
    Object.keys(rx).forEach(function (k) { var e = rx[k]; if (!e.stand) return; var d = Math.min.apply(null, exits.map(function (x) { return Math.max(Math.abs(x[0] - e.x), Math.abs(x[1] - e.y)); })) * 10 + e.cost / 10; if (d < gd) { gd = d; go = e; } });
    if (go && (go.x !== u.x || go.y !== u.y)) { yield* walk(B, u, go); if (u.dead || u.hp <= 0) return; }
    if (exits.some(function (x) { return x[0] === u.x && x[1] === u.y; })) {
      u.dead = true; u.fled = true; u.deadT = B.t; D.sfx('run');
      B.card(['{o}' + u.name + ' is gone' + (B.map.def.exitName ? ' ' + B.map.def.exitName : '') + '.{/}']); yield 30; return;
    }
    if (!T.action && !T.bonus) return;
    var mv = T.move; T.move = 0; // (from where she stands)
    var fs = foesOf(B, u), allies = alliesOf(B, u);
    var plans = weaponPlans(B, u, fs).concat(spellPlans(B, u, fs, allies)).filter(function (p) { return !p.bonus || T.bonus; }).sort(function (a, b) { return b.score - a.score; });
    T.move = mv;
    if (plans[0] && plans[0].score > 0.5) yield* plans[0].go();
    else { B.card(['{g}' + u.name + ' makes for the way out.{/}']); yield 16; }
  }
  TX.fleeFear = function* (B, u) {
    var T = u.turn;
    if (T.action && !u.conds.restrained && !u.conds.dancing) { T.action = 0; T.move += u.speed; }
    if (TX.bonusDash(u)) yield* B.exec(u, { do: 'cdash' }); // (the bonus action's Dash on top: it only runs farther -- Expeditious Retreat, Cunning Action)
    T.fleeFrom = u.conds.feared.by;
    B.card(['{p}' + (u.side === 'foe' ? AI.the(B, u) : u.name) + ' runs from its fear.{/}'], 200);
    yield* M.flee(B, u);
  };
  // a caster, a bowman: after acting, off the front if it can be
  function* keepOff(B, u) {
    var T = u.turn, retreat = function () { return TX.bonusDash(u) === 'Expeditious Retreat'; }; // (a rogue's Cunning Action has its own say, js/features.js: Disengage or Hide)
    if ((!T.move && !retreat()) || u.conds.restrained) return;
    var ranged = (u.weapon && u.weapon.ranged) || TX.caster(u);
    if (!ranged && !T.disengaged) return; // (one who disengaged -- the rogue's Cunning Action, a goblin's -- steps back out of reach too)
    var fs = foesOf(B, u), pressed = G.foesNear(u, u.x, u.y, 5).length;
    // (Expeditious Retreat up, 10-01: the run is a kite, not a step -- with a melee foe that could be on it by its next turn (TX.chasers), pressed or not and whole or not,
    // a square past what every one of them could cover (TX.outOfReach) is worth more than any near one, and the bonus Dash is taken to reach it. It is what the
    // grimoire's retreatKite counts the cast worth)
    var chase = u.conds.retreat ? TX.chasers(u, fs) : [];
    if (!pressed && !chase.length) return;
    if (!T.disengaged && !chase.length && u.hp > u.maxhp * 0.6) return; // (not worth the swings at it while it is whole)
    var off = function () { // (the square within the walk left with the fewest foes beside it: only one that frees it of some -- or, kiting, one that is out of reach of them all)
      var rm = G.reach(u, T.move), pick = null, ps = -1e9;
      Object.keys(rm).forEach(function (k) {
        var e = rm[k]; if (!e.stand) return;
        var n = G.foesNear(u, e.x, e.y, 5).length, sees = fs.some(function (t) { return G.los(u, t, e.x, e.y).clear; });
        var far = chase.length > 0 && TX.outOfReach(u, chase, e.x, e.y);
        var s = -n * 20 + (sees ? 3 : 0) - e.cost / 10 + (far ? 40 : 0);
        if (s > ps) { ps = s; pick = e; pick.far = far; }
      });
      return pick && (pick.far || G.foesNear(u, pick.x, pick.y, 5).length < pressed) ? pick : null;
    };
    var pick = T.move ? off() : null;
    if ((!pick || (chase.length && !pick.far)) && retreat()) { yield* B.exec(u, { do: 'cdash' }); pick = off() || pick; } // (no clear square on the walk left, or none past the foes' reach: the bonus action's Dash gives the feet -- Expeditious Retreat's)
    if (pick) yield* walk(B, u, pick);
  }
  // the bonus action's Dash (10-01). SRD 5.1, Expeditious Retreat: "When you cast this spell, and then as a bonus action on each of your turns until the spell
  // ends, you can take the Dash action"; the rogue's Cunning Action (2): "Dash, Disengage, or Hide" as a bonus action. TX.bonusDash(u): the name of the Dash
  // the bonus action buys this turn (battle.js `cdash` takes it), or '' where there is none. The AI takes it where it wants more distance: to close on a foe
  // (TX.dashBuys, before the action), or to get clear (keepOff, fleeFear)
  TX.bonusDash = function (u) {
    var T = u.turn;
    if (!T || !T.bonus || u.conds.restrained || u.conds.dancing || u.dead || u.hp <= 0) return ''; // (a dancer "must use all its movement to dance without leaving its space": no feet to add a Dash to)
    if (T.bonusDash && u.conds.retreat) return 'Expeditious Retreat';
    return u.cls === 'rogue' && u.lvl >= 2 ? 'Cunning Action' : '';
  };
  // the kite's reckoning (10-01; the grimoire's retreatKite weighs the cast by it, keepOff runs by it): the foes it runs from are the melee ones -- standing, with no
  // bow, thrown axe or spell to reach it from afar -- that could be on it by their next turn (a stride of their speed and a swing of their reach); a square is out of
  // reach when every one of them is farther from it than that. (The class NPCs carry a handaxe or a dagger in the off hand and throw it at range, as many blows as the
  // sword: the paladin that was run from, seeds 3-45 of the bench, kept throwing and the warlock that cast the spell did worse for the slot -- not a chaser)
  TX.chasers = function (u, fs) {
    return fs.filter(function (f) { return G.standing(f) && !(f.weapon && f.weapon.ranged) && !(f.alt && f.alt.ranged) && !TX.caster(f) && G.dist(u, f) <= G.reachOf(f) + (f.speed || 30); });
  };
  TX.outOfReach = function (u, chase, x, y) {
    return chase.every(function (f) { return G.dist(u, f, x, y) > G.reachOf(f) + (f.speed || 30); });
  };
  // what a Dash would buy now: nothing worth doing from here (no plan over the 0.5 the action's own bar is), and with a stride more of walk, a plan that is -- its
  // score, or 0. (TX._dashing: a spell's `ai` that asks this, Expeditious Retreat's, is asked inside TX.plans -- it answers nothing while this is weighing)
  TX.dashBuys = function (B, u) {
    var T = u.turn;
    if (TX._dashing || u.conds.restrained || u.conds.dancing || !(T.action || T.attacksLeft)) return 0;
    var add = 0, best = 0;
    TX._dashing = true;
    try {
      var p0 = TX.plans(B, u)[0];
      if (!(p0 && p0.score > 0.5)) { T.move += u.speed; add = u.speed; var p1 = TX.plans(B, u)[0]; best = p1 && p1.score > 0.5 ? p1.score : 0; }
    } finally { T.move -= add; TX._dashing = false; }
    return best;
  };
  TX.caster = function (u) { return (u.known || []).some(function (id) { var sp = M.data(id); return sp && sp.level === 0 && (sp.dmg || sp.kind === 'attack'); }) && !/fighter|barbarian|paladin|monk|rogue|ranger/.test(u.cls || ''); };

  // ------------------------------------------------------------------ the class's own moves: before the action, among the actions, after it
  TX.FIRST = [];   // function* (B, u)
  TX.ACTIONS = []; // function (B, u, fs, allies) -> a plan, or a list of them
  TX.AFTER = [];   // function* (B, u)

  // the bonus-action spells worth casting first (a Healing Word to the fallen, a mark, the floating weapon), by the same weighing
  TX.FIRST.push(function* (B, u) {
    var T = u.turn;
    if (!T.bonus) return;
    var fs = foesOf(B, u), allies = alliesOf(B, u);
    var plans = spellPlans(B, u, fs, allies).filter(function (p) { return p.bonus; }).sort(function (a, b) { return b.score - a.score; });
    if (plans[0] && plans[0].score > 2) yield* plans[0].go();
  });
  // the Dash for the bonus action (Expeditious Retreat's, the rogue's Cunning Action): when nothing is worth doing from here and a plan is once the feet are doubled
  TX.FIRST.push(function* (B, u) {
    if (!TX.bonusDash(u) || !TX.dashBuys(B, u)) return;
    yield* B.exec(u, { do: 'cdash' });
  });
  // Frenzy (the Berserker, 3): while raging, a swing for the bonus action
  TX.AFTER.push(function* (B, u) {
    var T = u.turn;
    if (!u.conds.frenzy || !u.conds.raging || !T.bonus || u.conds.disarmed) return;
    var t = foesOf(B, u).filter(function (w) { return G.dist(u, w) <= G.reachOf(u, u.weapon.reach); }).sort(function (a, b) { return a.hp - b.hp; })[0];
    if (!t) return;
    T.bonus = 0; B.card(['{r}' + (u.side === 'foe' ? AI.the(B, u) : u.name) + ' is in a frenzy!{/}  {g}(a swing for the bonus action){/}'], 160);
    yield* B.attack(u, t, u.weapon);
  });
  // Second Wind (the fighter), under half
  TX.AFTER.push(function* (B, u) {
    var T = u.turn;
    if (u.cls !== 'fighter' || !T.bonus || !u.feats || !(u.feats.secondWind > 0) || u.hp > u.maxhp / 2 || (u.src && u.src.wounded)) return;
    T.bonus = 0; u.feats.secondWind = 0;
    var r = D.roll('1d10+' + u.lvl); B.heal(u, r.total);
    B.card(['{y}' + u.name + '{/}: SECOND WIND  +' + r.total]); yield 20;
  });
  // a bonus-action spell still worth it after the action (a heal, the floating weapon's swing)
  TX.AFTER.push(function* (B, u) {
    var T = u.turn;
    if (!T.bonus) return;
    var plans = spellPlans(B, u, foesOf(B, u), alliesOf(B, u)).filter(function (p) { return p.bonus; }).sort(function (a, b) { return b.score - a.score; });
    if (plans[0] && plans[0].score > 2) yield* plans[0].go();
  });
  // a stat block's own routine (a monster that casts: the spell-weaver, the naga): its attacks as the bestiary runs them (ai.js brute),
  // weighed against its spells by what the routine should deal to the nearest it can reach
  TX.ACTIONS.push(function (B, u, fs) {
    if (!u.attacks || typeof u.attacks !== 'object' || !u.turn.action) return null;
    var reach = AI.reachOf(u), ranged = Object.keys(u.attacks).some(function (k) { return u.attacks[k].ranged; });
    var t = fs.filter(function (w) { return G.dist(u, w) <= u.turn.move + reach || (ranged && M.sees(B, u, w)); }).sort(function (a, b) { return a.hp - b.hp; })[0];
    if (!t) return null;
    return { kind: 'routine', why: 'its attacks on ' + t.name, score: TX.worth(TX.dpr(u), t), go: function* () { yield* AI.brute(B, u); } };
  });
  // innate Darkness (the drow's, the weaver's: once, on the 8-bit's chance, or at once to swallow a Light), as the brutes throw it
  TX.FIRST.push(function* (B, u) {
    var T = u.turn;
    if (!u.darkness || u.darkness.chance == null || u.darkness.used || !T.action || !AI.wantsDark(B, u)) return;
    yield* M.castDarkness(B, u);
  });
  // Lay on Hands (the paladin): the pool on the worst off beside him, when it's needed
  TX.ACTIONS.push(function (B, u, fs, allies) {
    if (u.cls !== 'paladin' || !u.feats || !(u.feats.lay > 0) || !u.turn.action || u.turn.attacksLeft) return null;
    var t = allies.filter(function (w) { return !w.dead && G.dist(u, w) <= 5 + u.turn.move && TX.healNeed(B, u, w) >= 1; }).sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; })[0];
    if (!t) return null;
    var amt = Math.min(u.feats.lay, t.maxhp - Math.max(0, t.hp));
    return { kind: 'feature', why: 'Lay on Hands on ' + t.name, score: amt * TX.healNeed(B, u, t) + (t.hp <= 0 ? TX.dpr(t) * 2 : 0), go: function* () {
      if (G.dist(u, t) > 5) yield* walk(B, u, AI.approach(u, t, G.reach(u, u.turn.move), 5));
      if (G.dist(u, t) <= 5 && u.turn.action) yield* B.layOnHands(u, t, false, Math.min(u.feats.lay, t.maxhp - Math.max(0, t.hp)));
    } };
  });
})();
