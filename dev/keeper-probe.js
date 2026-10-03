/* The Keeper of the Flooded Stair on the grid (dev/keeper-probe.py; 10-03, js/keeper.js). The Slam, the Wave and its backwash, the deep, the flooding, the drowning,
   the concentration check on the hold, and a few whole fights run through by the class AI. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, K = D.keeper, checks = [], errs = [];
  D.sfx = function () {}; D.music = function () {}; D.clip = function (u, done) { if (done) done(); };
  function ok(name, v) { checks.push([name, !!v]); }
  function drain(g) { var v, n = 0; while (g && n++ < 200000) { var r = g.next(v); v = undefined; if (r.done) return r.value; var y = r.value; if (y && y.prompt) v = y.prompt.opts[0].value; if (y && y.entry) v = undefined; } }
  function battle(o) { var d = D.save.fixture(o.lvl || 3); var B = new D.Battle(Object.assign({ fight: 'keeper', data: d, bench: true }, o)); D.battle = B; B.enter(); return B; }
  function cardsOf(B) { var got = []; var c0 = B.card; B.card = function (lines) { got.push((lines || []).join(' | ')); return c0.apply(this, arguments); }; return got; }
  function keeper(B) { return B.units.filter(function (u) { return u.kind === 'keeper'; })[0]; }
  function ours(B) { return B.units.filter(function (u) { return u.side === 'party' && !u.familiar; }); }
  function put(u, x, y) { u.x = x; u.y = y; u.hp = Math.max(u.hp, 1); delete u.ko; }
  var save0 = RU.save; function force(okv) { RU.save = function () { var r = save0.apply(this, arguments); r.ok = okv; return r; }; } function unforce() { RU.save = save0; }
  try {
    var B = battle({ lvl: 3 }), k = keeper(B), P = ours(B), cards = cardsOf(B), S;
    ok('the Keeper: AC ' + RU.ac(k) + ', HP ' + k.hp + ', a Slam (prone DC ' + (k.attacks.slam && k.attacks.slam.prone) + '), no Constrict or Drag Under', k.attacks.slam && k.attacks.slam.prone === 15 && !k.attacks.constrict && !k.attacks.drown && RU.ac(k) === 13 && k.hp === 58);
    ok('the map: deep ' + JSON.stringify(G.map.def.deeps) + ', wall row ' + G.map.def.wallRow, G.map.def.deeps.length === 3 && G.map.def.wallRow === 11 && K.isDeep(8, 1) && !K.isDeep(8, 2));
    P.forEach(function (u) { delete u.conds.hidden; });
    // ---- the Wave: two heroes on the stair, both fail; the backwash takes each 10 ft toward the deep, and they stand
    put(P[0], 8, 9); put(P[1], 9, 9); put(P[2], 7, 10); put(P[3], 10, 10); delete k.conds.hidden;
    force(false); cards.length = 0; RU.startTurn(k); var did = drain(K.wave(B, k)); unforce();
    ok('the Wave catches every hero in the lane: ' + cards.filter(function (c) { return /KNOCKED DOWN/.test(c); }).length + ' knocked down', did === true && cards.join(' ').split('KNOCKED DOWN').length - 1 === 4);
    ok('swept 10 ft north and standing: ' + P.map(function (u) { return u.x + ',' + u.y + (u.conds.prone ? 'P' : ''); }).join(' '), P[0].y === 7 && P[1].y === 7 && P[2].y <= 8 && P[3].y <= 8 && !P.some(function (u) { return u.conds.prone; }));
    // ---- a hero that keeps its feet is not swept; one already lying is
    put(P[0], 8, 9); put(P[1], 9, 9); P[1].conds.prone = true; P[2].x = 3; P[2].y = 3; P[3].x = 3; P[3].y = 4;
    force(true); did = drain(K.wave(B, k)); unforce();
    ok('saves kept: the standing one stays (' + P[0].y + '), the lying one is swept and stands (' + P[1].y + ', prone ' + !!P[1].conds.prone + ')', P[0].y === 9 && P[1].y === 7 && !P[1].conds.prone);
    // ---- a fourth wave drives one into the deep: restrained, the Keeper pours in, AC 10
    put(P[0], 8, 3); P[0].conds.prone = true; force(false); cards.length = 0; drain(K.wave(B, k)); unforce();
    ok('swept into the deep (' + P[0].x + ',' + P[0].y + '): restrained by the Keeper, drowning, it in the water at AC ' + RU.ac(k),
      K.isDeep(P[0].x, P[0].y) && P[0].conds.restrained && P[0].conds.restrained.by === k.id && P[0].conds.drowning && k.flooding && RU.ac(k) === 10 && G.dist(k, P[0]) <= 5);
    var s0 = P[0].hp; P[0].hp = P[0].maxhp = 40;
    // ---- drowning: 1d6 less CON, at least 1; twice after an Active Suffocation
    cards.length = 0; var h1 = P[0].hp; K.drownTick(B, P[0]); var d1 = h1 - P[0].hp;
    ok('one drowning roll at the start of its turn: ' + d1 + ' (' + (cards[0] || '').slice(0, 90) + ')', d1 >= 1 && d1 <= 6 && !/twice/.test(cards.join(' ')));
    RU.startTurn(k); cards.length = 0; drain(K.turn(B, k));
    ok('the Keeper in the water: Active Suffocation as its bonus action, the next drowning twice (' + JSON.stringify(P[0].conds.drowning) + ')', P[0].conds.drowning && P[0].conds.drowning.twice === true && k.turn.bonus === 0 && /ACTIVE SUFFOCATION/.test(cards.join(' ')));
    cards.length = 0; h1 = P[0].hp; K.drownTick(B, P[0]); d1 = h1 - P[0].hp;
    ok('flooded: two rolls (' + d1 + ' lost; twice cleared ' + !P[0].conds.drowning.twice + ')', d1 >= 2 && /twice/.test(cards.join(' ')) && !P[0].conds.drowning.twice);
    // ---- the concentration check: a blow in the water; the hold breaks on a failed CON save, the drowning stays
    force(false); cards.length = 0; B.hurt(k, 6, 'bludgeoning'); unforce();
    ok('a blow to the Keeper in the water breaks the hold on a failed save: restrained ' + !!P[0].conds.restrained + ', still drowning ' + !!P[0].conds.drowning, !P[0].conds.restrained && P[0].conds.drowning && /HOLD BREAKS/.test(cards.join(' ')));
    RU.startTurn(k); cards.length = 0; drain(K.turn(B, k));
    ok('with its hold gone it comes up out of the water: AC ' + RU.ac(k) + ', flooding ' + !!k.flooding, RU.ac(k) === 13 && !k.flooding);
    // ---- the hold that keeps
    put(P[1], 8, 1); force(false); drain(K.flood(B, k, P[1])); cards.length = 0; var hk = k.hp; force(true); B.hurt(k, 4, 'bludgeoning'); unforce();
    ok('a held concentration keeps the hold (' + !!P[1].conds.restrained + ')', P[1].conds.restrained && /the hold keeps/.test(cards.join(' ')));
    // ---- climbing out: a head over the water ends the drowning
    P[1].x = 8; P[1].y = 3; cards.length = 0; K.drownTick(B, P[1]);
    ok('out of the deep: no more drowning', !P[1].conds.drowning && /gets a breath/.test(cards.join(' ')));
    // ---- the Slam: a hit that fails the DC 15 STR save puts them prone
    var B2 = battle({ lvl: 3 }), k2 = keeper(B2), Q = ours(B2); delete k2.conds.hidden; put(Q[0], 8, 6);
    var prone = 0, hits = 0; for (var i = 0; i < 60; i++) { delete Q[0].conds.prone; Q[0].hp = Q[0].maxhp; drain(B2.attack(k2, Q[0], k2.attacks.slam)); if (Q[0].conds.prone) prone++; }
    ok('the Slam knocks prone on a failed save (' + prone + ' of 60 swings)', prone > 5);
    // ---- whole fights, the class AI on both sides of the stair
    var runs = [];
    for (var f = 0; f < 5; f++) {
      var F = battle({ lvl: [3, 4, 5, 3, 4][f] });
      F.units.forEach(function (u) { if (u.side === 'party' && !u.familiar) { u.guest = true; u.classAI = true; } });
      var ht0 = F.heroTurn; F.heroTurn = function* (u) { yield* D.ai.turn(this, u); };
      var v, g = 0; while (F.co && g++ < 400000) { var r; try { r = F.co.next(v); } catch (e) { errs.push(String(e && e.stack || e).slice(0, 500)); break; } v = undefined; if (r.done) break; var y = r.value; if (y && y.prompt) v = y.prompt.opts[0].value; }
      runs.push((F.result || 'none') + ' R' + F.round);
    }
    ok('five fights run through (' + runs.join('; ') + ')', runs.length === 5 && !errs.length && runs.every(function (s) { return !/^none/.test(s); }));
  } catch (e) { errs.push(String(e && e.stack || e).slice(0, 800)); }
  var pre = document.createElement('pre'); pre.textContent = 'KEEPERPROBE ' + JSON.stringify({ checks: checks, errors: errs });
  document.body.appendChild(pre);
})();
