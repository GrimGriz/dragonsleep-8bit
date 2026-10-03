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
    ok('the Keeper: AC ' + RU.ac(k) + ', HP ' + k.hp + ', a Slam (prone DC ' + (k.attacks.slam && k.attacks.slam.prone) + '), no Constrict or Drag Under', k.attacks.slam && k.attacks.slam.prone === 15 && !k.attacks.constrict && !k.attacks.drown && RU.ac(k) === 13 && k.hp === 100);
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
    // ---- the Ice Wall: readied, then sprung by a hero moving toward the exit
    var B3 = battle({ lvl: 3 }), k3 = keeper(B3), W = ours(B3), c3 = cardsOf(B3); delete k3.conds.hidden; W.forEach(function (u) { delete u.conds.hidden; });
    put(W[0], 8, 9); put(W[1], 9, 9); put(W[2], 7, 9); put(W[3], 10, 9); k3.x = 8; k3.y = 4;
    RU.startTurn(k3); var can0 = K.canReadyWall(B3, k3); drain(K.readyWall(B3, k3));
    ok('readied on a turn with no one in reach: canReady ' + can0 + ', action spent ' + (k3.turn.action === 0) + ', ready ' + JSON.stringify(B3.kp.ready), can0 && k3.turn.action === 0 && B3.kp.ready && !B3.kp.wall);
    var ev = W[0]; RU.startTurn(ev); ev.turn.move = 30; drain(B3.moveAlong(ev, [[8, 10]], { spend: true }));
    var wl = B3.kp.wall;
    ok('a step toward the exit springs it: row ' + (wl && wl.cy) + ', squares ' + (wl && wl.sq.length) + ', sections ' + (wl && wl.sections.length) + ' of ' + (wl && wl.sections[0].hp) + ' HP, uses left ' + B3.kp.uses, wl && wl.cy === 11 && wl.sq.length === 4 && wl.sections.length === 2 && wl.sections[0].hp === 30 && B3.kp.uses === 2 && k3.reaction === 0);
    ok('no one walks through it: stand (8,11) ' + G.canStand(W[0], 8, 11) + ', (9,12) ' + G.canStand(W[0], 9, 12) + ', pass ' + G.canPass(W[0], 8, 11), !G.canStand(W[0], 8, 11) && !G.canPass(W[0], 8, 11));
    // the Wave bounces off it: those between it and the water are hit, the sweep is not changed
    force(false); W[1].conds.prone = false; did = drain(K.wave(B3, k3)); unforce();
    ok('the Wave runs to the wall: ' + W.map(function (u) { return u.x + ',' + u.y; }).join(' '), did === true);
    // fire on a section: gone at once; the other stands
    put(W[0], 8, 10); put(W[1], 9, 10); put(W[2], 7, 10); put(W[3], 10, 10); var cast = D.magic.data('burninghands'); W[0].spellDC = 13;
    c3.length = 0; drain(K.spellOn(B3, W[0], 'burninghands', 1, { x: 8, y: 11 }));
    ok('fire on the wall: a section goes to steam (' + (B3.kp.wall ? B3.kp.wall.sections.length + ' left, ' + B3.kp.wall.sq.length + ' squares' : 'all gone') + ')', /steam/.test(c3.join(' ')) && (!B3.kp.wall || B3.kp.wall.sections.length < 2));
    // cold on the water: it freezes; the caster's friends in it take 1d4 cold; the backwash goes round the anchored
    c3.length = 0; put(W[1], 8, 7); put(W[2], 7, 7); W[1].hp = W[1].maxhp = 30; W[2].hp = W[2].maxhp = 30; put(W[0], 8, 9); var hp1 = W[1].hp;
    drain(K.spellOn(B3, W[0], 'coneofcold', 5, { x: 8, y: 6 }));
    var iced = Object.keys(B3.kp.ice).length;
    ok('cold on the water: ' + iced + ' squares froze, a friend in it took ' + (hp1 - W[1].hp) + ' cold', iced > 0 && /freeze over/.test(c3.join(' ')) && B3.kp.ice['8,7']);
    W[1].conds.prone = true; var y0 = W[1].y; force(false); drain(K.wave(B3, k3)); unforce();
    ok('anchored on the ice: the backwash goes round (' + y0 + ' -> ' + W[1].y + ')', W[1].y === y0 && /held by the ice/.test(c3.join(' ')));
    delete B3.kp.ice['8,1']; var d0 = K.isDeep(8, 1); B3.kp.ice['8,1'] = true; ok('a frozen deep square is not the deep (' + d0 + ' before)', d0 && !K.isDeep(8, 1));
    // three uses and no more
    B3.kp.wall = null; B3.walls = []; B3.wallMap = null; B3.kp.uses = 0; put(W[0], 8, 9); ok('no use left, no readying', !K.canReadyWall(B3, k3));
    // the same on another row (the bench's alt row)
    var B4 = battle({ lvl: 3 }), k4 = keeper(B4), V = ours(B4); B4.kp = null; K.CFG.x = 0; (function () { var S4 = (function (B) { return B.kp || (B.kp = { uses: 3, ready: null, wall: null, ice: {}, waves: 0 }); })(B4); S4.rowOverride = 7; })();
    put(V[0], 8, 9); k4.reaction = 1; drain(K.raiseWall(B4, k4, V[0]));
    ok('wallRow override: the wall on row ' + (B4.kp.wall && B4.kp.wall.cy), B4.kp.wall && B4.kp.wall.cy === 7);
    // ---- the Slam: a hit that fails the DC 15 STR save puts them prone
    var B2 = battle({ lvl: 3 }), k2 = keeper(B2), Q = ours(B2); delete k2.conds.hidden; put(Q[0], 8, 6);
    var prone = 0, hits = 0; for (var i = 0; i < 60; i++) { delete Q[0].conds.prone; Q[0].hp = Q[0].maxhp; drain(B2.attack(k2, Q[0], k2.attacks.slam)); if (Q[0].conds.prone) prone++; }
    ok('the Slam knocks prone on a failed save (' + prone + ' of 60 swings)', prone > 5);
    // ---- whole fights, the class AI on the party's side; runs=N per level (lvls=3,4,5), wall=<row> for the alt wall row; the counts are what the mechanics did
    var q = {}; location.search.replace(/^\?/, '').split('&').forEach(function (kv) { var a = kv.split('='); if (a[0]) q[a[0]] = decodeURIComponent(a[1] || ''); });
    var N = +(q.runs || 2), lv = (q.lvls || '3,4,5').split(',').map(Number), rows = [];
    lv.forEach(function (L) {
      var agg = { won: 0, lost: 0, rounds: 0, downs: 0, waves: 0, swept: 0, floods: 0, drown: 0, twice: 0, breaks: 0, kept: 0, walls: 0, fire: 0, froze: 0, slams: 0, prone: 0, none: 0 };
      for (var f = 0; f < N; f++) {
        D.seed = (f + 1) * 7919 + L; var F = battle({ lvl: L }), cs = cardsOf(F); if (q.hp) { var kk = keeper(F); kk.hp = kk.maxhp = +q.hp; }
        if (q.wall) F.kp = { uses: 3, ready: null, wall: null, ice: {}, waves: 0, rowOverride: +q.wall };
        F.units.forEach(function (u) { if (u.side === 'party' && !u.familiar) { u.guest = true; u.classAI = true; } });
        F.heroTurn = function* (u) { yield* D.ai.turn(this, u); };
        var v, g = 0; while (F.co && g++ < 400000) { var r; try { r = F.co.next(v); } catch (e) { errs.push(String(e && e.stack || e).slice(0, 500)); break; } v = undefined; if (r.done) break; var y = r.value; if (y && y.prompt) v = y.prompt.opts[0].value; }
        var txt = cs.join('\n'), cnt = function (re) { return (txt.match(re) || []).length; };
        if (F.result === 'won') agg.won++; else if (F.result === 'lost') agg.lost++; else agg.none++;
        agg.rounds += F.round; agg.downs += cnt(/ goes down\./g); agg.waves += cnt(/sends a wave/g); agg.swept += cnt(/is swept/g); agg.floods += cnt(/is washed into the deep/g);
        agg.drown += cnt(/ drowns/g); agg.twice += cnt(/flooded: twice/g); agg.breaks += cnt(/THE HOLD BREAKS/g); agg.kept += cnt(/the hold keeps/g); agg.walls += cnt(/springs the Ice Wall/g);
        agg.fire += cnt(/goes to steam/g); agg.froze += cnt(/freeze over/g); agg.slams += cnt(/ Slam/g); agg.prone += cnt(/KNOCKED PRONE/g);
      }
      rows.push('L' + L + ' x' + N + (q.wall ? ' wall ' + q.wall : '') + ': ' + JSON.stringify(agg).replace(/"/g, ''));
    });
    ok('whole fights, no error (' + errs.length + ')', !errs.length && rows.every(function (r) { return !/none:[1-9]/.test(r); }));
    rows.forEach(function (r) { ok(r, true); });
  } catch (e) { errs.push(String(e && e.stack || e).slice(0, 800)); }
  var pre = document.createElement('pre'); pre.textContent = 'KEEPERPROBE ' + JSON.stringify({ checks: checks, errors: errs });
  document.body.appendChild(pre);
})();
