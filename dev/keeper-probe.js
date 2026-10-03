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
  // squares in this probe are in the LANE FRAME -- (across, along), as the stair's geometry is described once, in data/maps.js floodstair `geo` -- and go to the map by K.at, the one rotation
  function sq(x, y) { return K.at(y, x); }
  function pt(x, y) { var o = sq(x, y); return { x: o[0], y: o[1] }; }
  function put(u, x, y) { var o = K.at(y, x, u.size); u.x = o[0]; u.y = o[1]; u.hp = Math.max(u.hp, 1); delete u.ko; }
  function putK(u) { var g = G.map.def.geo, o = K.at(g.keeper[0], g.keeper[1], 2); u.x = o[0]; u.y = o[1]; }
  function wallL(B, x, y) { var o = sq(x, y); return K.wallAt(B, o[0], o[1]); }
  function standL(u, x, y) { var o = sq(x, y); return G.canStand(u, o[0], o[1]); }
  function passL(u, x, y) { var o = sq(x, y); return G.canPass(u, o[0], o[1]); }
  function deepL(x, y) { var o = sq(x, y); return K.isDeep(o[0], o[1]); }
  function iceKey(x, y) { return sq(x, y).join(','); }
  var save0 = RU.save; function force(okv) { RU.save = function () { var r = save0.apply(this, arguments); r.ok = okv; return r; }; } function unforce() { RU.save = save0; }
  try {
    var B = battle({ lvl: 3 }), k = keeper(B), P = ours(B), cards = cardsOf(B), S;
    ok('the Keeper: AC ' + RU.ac(k) + ', HP ' + k.hp + ', a Slam (prone DC ' + (k.attacks.slam && k.attacks.slam.prone) + '), no Constrict or Drag Under', k.attacks.slam && k.attacks.slam.prone === 15 && !k.attacks.constrict && !k.attacks.drown && RU.ac(k) === 13 && k.hp === 100);
    ok('the map: runs ' + (G.map.def.geo.axis === 'x' ? 'west-east' : 'north-south') + ', deep ' + JSON.stringify(G.map.def.deeps) + ', wall at ' + G.map.def.geo.wall + ' along', G.map.def.deeps.length === 3 && G.map.def.geo.wall === 11 && deepL(8, 1) && !deepL(8, 2));
    P.forEach(function (u) { delete u.conds.hidden; });
    // ---- the sheet: keeper_p2 (keeper_p1 left alone), the engine's anim names, the one-line pose swap
    var SH = D.SHEETS.keeper_p2, an0 = SH && SH.anims;
    ok('the foe draws keeper_p2 (' + k.sheet + '), p1 untouched (' + !!D.SHEETS.keeper_p1 + '), anims ' + (an0 && ['idle', 'walk', 'attack', 'hurt', 'die', 'wave', 'wall'].filter(function (a) { return an0[a]; }).join(',')), k.sheet === 'keeper_p2' && D.SHEETS.keeper_p1 && ['idle', 'walk', 'attack', 'hurt', 'die', 'wave', 'wall'].every(function (a) { return an0[a]; }));
    var y0s = an0.attack.y, f0s = an0.attack.frames; K.pose({ slam: 'slam_ba' });
    ok('pose({ slam: slam_ba }) re-points the Slam: y ' + y0s + ' (' + f0s + ' frames) -> ' + an0.attack.y + ' (' + an0.attack.frames + ')', an0.attack.y !== y0s && an0.attack.y === an0.slam_ba.y);
    K.pose({ slam: 'slam_b3a' });
    // ---- the Wave: two heroes on the stair, both fail; the backwash takes each 10 ft toward the deep, and they stand
    put(P[0], 8, 9); put(P[1], 9, 9); put(P[2], 7, 10); put(P[3], 10, 10); delete k.conds.hidden;
    force(false); cards.length = 0; RU.startTurn(k); var did = drain(K.wave(B, k)); unforce();
    ok('the Wave catches every hero in the lane: ' + cards.filter(function (c) { return /KNOCKED DOWN/.test(c); }).length + ' knocked down', did === true && cards.join(' ').split('KNOCKED DOWN').length - 1 === 4);
    ok('swept 10 ft north and standing: ' + P.map(function (u) { return u.x + ',' + u.y + (u.conds.prone ? 'P' : ''); }).join(' '), K.A(P[0]) === 7 && K.A(P[1]) === 7 && K.A(P[2]) <= 8 && K.A(P[3]) <= 8 && !P.some(function (u) { return u.conds.prone; }));
    // ---- a hero that keeps its feet is not swept; one already lying is
    put(P[0], 8, 9); put(P[1], 9, 9); P[1].conds.prone = true; put(P[2], 3, 3); put(P[3], 3, 4);
    force(true); did = drain(K.wave(B, k)); unforce();
    ok('saves kept: the standing one stays (' + K.A(P[0]) + '), the lying one is swept and stands (' + K.A(P[1]) + ', prone ' + !!P[1].conds.prone + ')', K.A(P[0]) === 9 && K.A(P[1]) === 7 && !P[1].conds.prone);
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
    put(P[1], 8, 3); cards.length = 0; K.drownTick(B, P[1]);
    ok('out of the deep: no more drowning', !P[1].conds.drowning && /gets a breath/.test(cards.join(' ')));
    // ---- the one geometry: the lane frame and the map agree both ways, the map's own numbers are derived from it, the Keeper starts where it says and faces the party
    var geoOK = true; [[8, 7], [13, 10], [1, 8], [4, 12]].forEach(function (p) { var o = K.at(p[0], p[1]), q = { x: o[0], y: o[1] }; if (K.A(q) !== p[0] || K.C(q) !== p[1]) geoOK = false; });
    var kg = keeper(battle({ lvl: 3 })), gm = G.map.def.geo, ks = K.at(gm.keeper[0], gm.keeper[1], 2);
    ok('the geometry reads one way: lane frame <-> map round trips ' + geoOK + ', the entry squares are the geo\'s (' + JSON.stringify(G.map.def.entry) + '), the Keeper starts at ' + ks + ' (is at ' + kg.x + ',' + kg.y + '), the rune beyond the lane\'s right-hand edge (c ' + gm.rune[1] + ' > ' + gm.c[1] + ')',
      geoOK && G.map.def.entry.every(function (e, i) { var o = K.at(gm.entry[i][0], gm.entry[i][1]); return e[0] === o[0] && e[1] === o[1]; }) && kg.x === ks[0] && kg.y === ks[1] && gm.rune[1] > gm.c[1] && gm.axis === 'x');
    var fc = battle({ lvl: 3 }), kf = keeper(fc), HF = ours(fc); HF.forEach(function (u) { delete u.conds.hidden; }); put(HF[0], 8, 9); put(HF[1], 12, 12); put(HF[2], 3, 12); put(HF[3], 8, 12); kf.facing = 6; RU.startTurn(kf); drain(K.turn(fc, kf));
    var nearest = HF.slice().sort(function (a, b) { return G.dist(kf, a) - G.dist(kf, b); })[0];
    ok('it faces the nearest of the party after its turn: facing ' + kf.facing + ', toward ' + nearest.name + ' = ' + fc.faceTo(kf, nearest), kf.facing === fc.faceTo(kf, nearest));
    kf.facing = 6; K.face(fc, kf); put(HF[2], 7, 5); put(nearest, 8, 14); K.face(fc, kf);
    ok('and as the heroes move, idle: it turns to the new nearest (' + kf.facing + ')', kf.facing === fc.faceTo(kf, HF[2]) || kf.facing === fc.faceTo(kf, HF.slice().sort(function (a, b) { return G.dist(kf, a) - G.dist(kf, b); })[0]));
    D.battle = B;
    // ---- the Ice Wall: readied, then sprung by a hero moving toward the exit
    var B3 = battle({ lvl: 3 }), k3 = keeper(B3), W = ours(B3), c3 = cardsOf(B3); delete k3.conds.hidden; W.forEach(function (u) { delete u.conds.hidden; });
    put(W[0], 8, 9); put(W[1], 9, 9); put(W[2], 7, 9); put(W[3], 10, 9); putK(k3);
    RU.startTurn(k3); var can0 = K.canReadyWall(B3, k3); drain(K.readyWall(B3, k3));
    ok('readied on a turn with no one in reach: canReady ' + can0 + ', action spent ' + (k3.turn.action === 0) + ', ready ' + JSON.stringify(B3.kp.ready), can0 && k3.turn.action === 0 && B3.kp.ready && !B3.kp.wall);
    var ev = W[0]; RU.startTurn(ev); ev.turn.move = 30; drain(B3.moveAlong(ev, [sq(8, 10)], { spend: true }));
    var wl = B3.kp.wall;
    ok('a step toward the exit springs it: along ' + (wl && wl.a) + ', squares ' + (wl && wl.sq.length) + ', sections ' + (wl && wl.sections.length) + ' of ' + (wl && wl.sections[0].hp) + ' HP, uses left ' + B3.kp.uses, wl && wl.a === 11 && wl.sq.length === 4 && wl.sections.length === 2 && wl.sections[0].hp === 30 && B3.kp.uses === 2 && k3.reaction === 0);
    ok('no one walks through it: stand (8,11) ' + standL(W[0], 8, 11) + ', (9,12) ' + standL(W[0], 9, 12) + ', pass ' + passL(W[0], 8, 11), !standL(W[0], 8, 11) && !passL(W[0], 8, 11));
    // the Wave bounces off it: those between it and the water are hit, the sweep is not changed
    force(false); W[1].conds.prone = false; did = drain(K.wave(B3, k3)); unforce();
    ok('the Wave runs to the wall: ' + W.map(function (u) { return u.x + ',' + u.y; }).join(' '), did === true);
    // (the page's frame loop clears a mover's tween before the hook runs: the row it stepped from comes in as an argument, not read off u.tween -- 10-03, the pane-vs-bench find)
    var B5 = battle({ lvl: 3 }), k5 = keeper(B5), U5 = ours(B5); delete k5.conds.hidden; put(U5[0], 8, 10); U5[0].tween = null; RU.startTurn(k5); B5.kp = null; drain(K.readyWall(B5, k5)); drain(K.watch(B5, U5[0], pt(8, 9)));
    ok('a step toward the exit springs the wall with no tween on the mover: wall ' + !!(B5.kp && B5.kp.wall), !!(B5.kp && B5.kp.wall)); D.battle = B3;
    // fire on a section: gone at once; the other stands
    put(W[0], 8, 10); put(W[1], 9, 10); put(W[2], 7, 10); put(W[3], 10, 10); var cast = D.magic.data('burninghands'); W[0].spellDC = 13;
    c3.length = 0; drain(K.spellOn(B3, W[0], 'burninghands', 1, pt(8, 11)));
    ok('fire on the wall: a section goes to steam (' + (B3.kp.wall ? B3.kp.wall.sections.length + ' left, ' + B3.kp.wall.sq.length + ' squares' : 'all gone') + ')', /steam/.test(c3.join(' ')) && (!B3.kp.wall || B3.kp.wall.sections.length < 2));
    // cold on the water: it freezes; the caster's friends in it take 1d4 cold; the backwash goes round the anchored
    c3.length = 0; put(W[1], 8, 7); put(W[2], 7, 7); W[1].hp = W[1].maxhp = 30; W[2].hp = W[2].maxhp = 30; put(W[0], 8, 9); var hp1 = W[1].hp;
    drain(K.spellOn(B3, W[0], 'coneofcold', 5, pt(8, 6)));
    var iced = Object.keys(B3.kp.ice).length;
    ok('cold on the water: ' + iced + ' squares froze, a friend in it took ' + (hp1 - W[1].hp) + ' cold', iced > 0 && /freeze over/.test(c3.join(' ')) && B3.kp.ice[iceKey(8, 7)]);
    W[1].conds.prone = true; var y0 = K.A(W[1]); force(false); drain(K.wave(B3, k3)); unforce();
    ok('anchored on the ice: the backwash goes round (' + y0 + ' -> ' + K.A(W[1]) + ')', K.A(W[1]) === y0 && /held by the ice/.test(c3.join(' ')));
    delete B3.kp.ice[iceKey(8, 1)]; var d0 = deepL(8, 1); B3.kp.ice[iceKey(8, 1)] = true; ok('a frozen deep square is not the deep (' + d0 + ' before)', d0 && !deepL(8, 1));
    // three uses and no more
    B3.kp.wall = null; B3.walls = []; B3.wallMap = null; B3.kp.uses = 0; put(W[0], 8, 9); ok('no use left, no readying', !K.canReadyWall(B3, k3));
    // the same on another row (the bench's alt row)
    var B4 = battle({ lvl: 3 }), k4 = keeper(B4), V = ours(B4); B4.kp = null; K.CFG.x = 0; (function () { var S4 = (function (B) { return B.kp || (B.kp = { uses: 3, ready: null, wall: null, ice: {}, waves: 0 }); })(B4); S4.rowOverride = 7; })();
    put(V[0], 8, 9); k4.reaction = 1; drain(K.raiseWall(B4, k4, V[0]));
    ok('wall override: the wall at ' + (B4.kp.wall && B4.kp.wall.a) + ' along the stair', B4.kp.wall && B4.kp.wall.a === 7);
    // ---- 10-03 playtest notes: the standing idle, the pool depth, back into the water, the swirl, the ice
    var B6 = battle({ lvl: 3 }), k6 = keeper(B6), H6 = ours(B6), c6 = cardsOf(B6); H6.forEach(function (u) { delete u.conds.hidden; }); delete k6.conds.hidden;
    var an6 = D.SHEETS.keeper_p2.anims;
    ok('the standing idle: idle is the third sheet\'s standing poses (' + an6.idle.frames + ' frames, y ' + an6.idle.y + ' = stand ' + an6.stand.y + ')', an6.idle.y === an6.stand.y && an6.idle.frames === 2 && K.POSE.idle === 'stand');
    ok('the Slam row is the second sheet\'s dive with the first sheet\'s frame 3: ' + K.POSE.slam + ' (' + an6.attack.frames + ' frames)', K.POSE.slam === 'slam_b3a' && an6.attack.y === an6.slam_b3a.y && an6.slam_b3a.frames === 7);
    var w1 = K.wade(B6, pt(8, 6)), w2 = K.wade(B6, pt(8, 2));
    ok('standing depth: ankle-deep in the shallows (' + w1.cut + ' px), waist-deep by the deep end (' + w2.cut + ' px)', w1.cut < w2.cut && w1.cut >= 8 && w2.cut <= 56);
    put(H6[0], 8, 7); k6.anim = 'wave'; RU.startTurn(k6); drain(K.turn(B6, k6));
    ok('after its turn: standing idle (' + k6.anim + '), back in the water unseen (hidden ' + !!k6.conds.hidden + ')', k6.anim === 'idle' && !!k6.conds.hidden);
    // swirling: a friend beside the held one is beside the Keeper
    delete k6.conds.hidden; put(H6[1], 8, 1); put(H6[2], 9, 1); force(false); drain(K.flood(B6, k6, H6[1])); unforce();
    var far = G.dist(H6[2], k6), near5 = G.dist(H6[2], H6[1]);
    ok('the water about the held one is the Keeper: a friend beside the held (' + near5 + ' ft) is ' + far + ' ft from it', far <= 5 && k6.flooding);
    // cold on the swirl: the Keeper's save against the freeze
    put(H6[3], 8, 9); H6[3].spellDC = 13; c6.length = 0; force(true); drain(K.spellOn(B6, H6[3], 'coneofcold', 5, pt(8, 2))); unforce();
    ok('cold on the swirl, the Keeper saves: it keeps its swirl and the held one stays held (flooding ' + !!k6.flooding + ', restrained ' + !!H6[1].conds.restrained + ', ice on its squares ' + G.foot(k6).some(function (p) { return B6.kp.ice[p[0] + ',' + p[1]]; }) + ')',
      !!k6.flooding && !!H6[1].conds.restrained && !G.foot(k6).some(function (p) { return B6.kp.ice[p[0] + ',' + p[1]]; }) && !B6.kp.ice[iceKey(8, 1)] && /holds its swirl/.test(c6.join(' ')));
    c6.length = 0; force(false); drain(K.spellOn(B6, H6[3], 'coneofcold', 5, pt(8, 2))); unforce();
    ok('cold on the swirl, the Keeper fails: it changes back, the held one is freed (flooding ' + !!k6.flooding + ', restrained ' + !!H6[1].conds.restrained + ')', !k6.flooding && !H6[1].conds.restrained && /changes back/.test(c6.join(' ')));
    ok('and the water it stood in is ice, so it is restrained (' + JSON.stringify(k6.conds.restrained) + ')', k6.conds.restrained && k6.conds.restrained.ice === true && k6.conds.restrained.dc === 7);
    // its turn: breaks out on the bonus action (DC 7 STR), the ice it was in goes and 1-2 about it
    var iced0 = Object.keys(B6.kp.ice).length; RU.startTurn(k6); c6.length = 0; force(true); drain(K.turn(B6, k6)); unforce();
    var iced1 = Object.keys(B6.kp.ice).length, lost = iced0 - iced1;
    ok('breaks out: free (' + !k6.conds.restrained + '), ' + lost + ' squares of ice gone (its 4 and 1-2 more)', !k6.conds.restrained && lost >= 5 && lost <= 6 && /bursts out of the ice/.test(c6.join(' ')));
    // fails both tries: the bonus action and then the action, still held
    k6.conds.restrained = { dc: 7, by: 'ice', ice: true }; k6.conds.hidden = false; RU.startTurn(k6); k6.turn.bonus = 1; k6.turn.action = 1; c6.length = 0; force(false); drain(K.turn(B6, k6)); unforce();
    ok('fails both tries (bonus action, then action): still held, action ' + k6.turn.action + ', bonus ' + k6.turn.bonus, k6.conds.restrained && k6.turn.action === 0 && k6.turn.bonus === 0 && /a second try/.test(c6.join(' ')));
    // a frozen Keeper is not swirling: cold with none held freezes its squares and holds it
    var B7 = battle({ lvl: 3 }), k7 = keeper(B7), H7 = ours(B7), c7 = cardsOf(B7); delete k7.conds.hidden; put(H7[0], 8, 9); H7[0].spellDC = 13; drain(K.spellOn(B7, H7[0], 'coneofcold', 5, pt(8, 5)));
    ok('the water it stands in freezes (no swirl, no save): restrained ' + !!k7.conds.restrained, !!k7.conds.restrained && k7.conds.restrained.ice);
    D.battle = B3;
    // ---- its opportunity attack as a wave (K.CFG.oaWave, off by default)
    var B8 = battle({ lvl: 3 }), k8 = keeper(B8), H8 = ours(B8), c8 = cardsOf(B8); delete k8.conds.hidden; H8.forEach(function (u) { delete u.conds.hidden; });
    function leave() { put(H8[0], 8, 6); RU.startTurn(H8[0]); H8[0].turn.move = 30; H8[0].turn.disengaged = false; k8.reaction = 1; c8.length = 0; drain(B8.moveAlong(H8[0], [sq(8, 7), sq(8, 8)], { spend: true })); }
    K.CFG.oaWave = false; leave(); var plain = /Slam/.test(c8.join(' ')) && !/raises a wave/.test(c8.join(' ')), y0 = K.A(H8[0]);
    K.CFG.oaWave = true; force(false); leave(); unforce(); K.CFG.oaWave = false;
    ok('opportunity attack: off, the Slam (' + plain + ', walked to ' + y0 + '); on, a wave that sweeps the leaver toward the deep and ends its walk (now at ' + H8[0].x + ',' + K.A(H8[0]) + ')', plain && y0 === 8 && /raises a wave/.test(c8.join(' ')) && K.A(H8[0]) < 8 && !H8[0].conds.prone && k8.reaction === 0);
    D.battle = B3;
    // ---- the Ice Wall struck at: weapons and single-target spells aim at a section (AC 10); only fire, or thunder, harms it
    var B9 = battle({ lvl: 3 }), k9 = keeper(B9), H9 = ours(B9), c9 = cardsOf(B9); delete k9.conds.hidden; H9.forEach(function (u) { delete u.conds.hidden; });
    put(H9[0], 7, 10); put(H9[1], 10, 10); put(H9[2], 3, 3); put(H9[3], 3, 4); k9.reaction = 1; drain(K.raiseWall(B9, k9, H9[0]));
    var t1 = wallL(B9, 8, 11), t2 = wallL(B9, 10, 11), W9 = B9.kp.wall;
    ok('the wall is something to aim at: a target on each of its squares (' + (t1 && t1.name) + ' AC ' + (t1 && RU.ac(t1)) + ', ' + (t2 && t2.x) + ',' + (t2 && t2.y) + '), none where there is no wall', t1 && t2 && RU.ac(t1) === 10 && !wallL(B9, 8, 10) && t1.sec !== t2.sec);
    H9[0].weapon = Object.assign({}, H9[0].weapon, { atk: 60 }); RU.startTurn(H9[0]); c9.length = 0; drain(B9.exec(H9[0], { do: 'attack', target: t1 }));
    ok('a weapon blow on the wall: it lands, and does no harm (' + W9.sections.length + ' sections; ' + (c9.filter(function (c) { return /shrugs off/.test(c); }).length) + ' shrugged off)', W9.sections.length === 2 && /shrugs off/.test(c9.join(' ')) && /Ice Wall/.test(c9.join(' ')));
    c9.length = 0; B9.hurt(t1, 7, 'fire');
    ok('fire carried by a blow (fire damage on the wall): that section goes (' + (B9.kp.wall ? B9.kp.wall.sections.length : 0) + ' left)', B9.kp.wall && B9.kp.wall.sections.length === 1 && /steam/.test(c9.join(' ')) && !wallL(B9, 8, 11) && !!wallL(B9, 10, 11));
    var cz = H9[1]; cz.known = (cz.known || []).concat(['firebolt']); cz.spellAtk = 60; cz.spellDC = 13; c9.length = 0; for (var fb = 0; fb < 6 && B9.kp.wall; fb++) { RU.startTurn(cz); drain(D.magic.cast(B9, cz, 'firebolt', 0, wallL(B9, 10, 11))); } // (a natural 1 misses: up to six tries)
    ok('Fire Bolt at the other section: it is destroyed and the wall is down (' + (B9.kp.wall ? 'still up' : 'down') + ') ' + c9.join(' // ').slice(0, 600), !B9.kp.wall && !wallL(B9, 10, 11) && standL(H9[0], 8, 11));
    D.battle = B3;
    // ---- the Slam: a hit that fails the DC 15 STR save puts them prone
    var B2 = battle({ lvl: 3 }), k2 = keeper(B2), Q = ours(B2); delete k2.conds.hidden; put(Q[0], 8, 6);
    var prone = 0, hits = 0; for (var i = 0; i < 60; i++) { delete Q[0].conds.prone; Q[0].hp = Q[0].maxhp; drain(B2.attack(k2, Q[0], k2.attacks.slam)); if (Q[0].conds.prone) prone++; }
    ok('the Slam knocks prone on a failed save (' + prone + ' of 60 swings)', prone > 5);
    // ---- the gallery (?fxgallery&keeper): all six scenes run through the real code, with the looks added (and drawn onto a canvas)
    var GB = D.fxKeeper('?fxgallery&keeper&auto'); D.battle = GB; GB.enter(); var seen = {}, gerr = '', gsteps = 0, cv = document.createElement('canvas'); cv.width = 640; cv.height = 400; var cx2 = cv.getContext('2d');
    while (GB.co && gsteps++ < 60000 && (Object.keys(seen).length < K.SCENES.length || gsteps < 10)) { var gr; try { gr = GB.co.next(); } catch (e) { gerr = String(e && e.stack || e).slice(0, 400); break; } seen[GB.gallery.i] = 1; if (gr.done) break; var nf = typeof gr.value === 'number' ? Math.min(gr.value, 120) : 1; for (var fi = 0; fi < nf; fi++) { D.fx.list.forEach(function (f) { try { f.draw(cx2); } catch (e) { gerr = gerr || ('draw ' + f.kind + ': ' + String(e && e.stack || e).slice(0, 300)); } }); D.fx.update(); GB.t = (GB.t || 0) + 1; } }
    ok('the gallery: ' + Object.keys(seen).length + ' of ' + K.SCENES.length + ' scenes seen, ' + gsteps + ' steps' + (gerr ? ', ERROR ' + gerr : ''), Object.keys(seen).length >= K.SCENES.length && !gerr);
    // ---- ?keeperfight&seed=174221&watch drained (no frame loop): the fight the notes name -- level 3, won in round 9, a flood, a held hold broken, a wall
    var KF = D.keeper.fight('?keeperfight&seed=324682&watch&lvl=3'); D.battle = KF; KF.enter(); var kc = cardsOf(KF), kg = 0, kv; while (KF.co && kg++ < 400000) { var kr = KF.co.next(kv); kv = undefined; if (kr.done) break; }
    var kt = kc.join('\n'), kn = function (re) { return (kt.match(re) || []).length; };
    ok('?keeperfight&seed=324682 drained: ' + KF.result + ' R' + KF.round + ', floods ' + kn(/washed into the deep/g) + ', walls ' + kn(/springs the Ice Wall/g), KF.result === 'won' && KF.round === 9 && kn(/washed into the deep/g) === 1 && kn(/springs the Ice Wall/g) === 1);
    // ---- whole fights, the class AI on the party's side; runs=N per level (lvls=3,4,5), wall=<row> for the alt wall row; the counts are what the mechanics did
    var q = {}; location.search.replace(/^\?/, '').split('&').forEach(function (kv) { var a = kv.split('='); if (a[0]) q[a[0]] = decodeURIComponent(a[1] || ''); });
    if (q.hide != null) K.CFG.hideAfter = q.hide !== '0'; if (q.oa != null) K.CFG.oaWave = q.oa === '1'; if (q.need) K.CFG.freezeNeeds = q.need; // (the settings the bench can flip: hide=0, oa=1, need=any)
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
