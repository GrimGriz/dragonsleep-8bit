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
  HTMLAnchorElement.prototype.click = function () {}; // (the probe's fights end with a download of the log: not made here)
  var save0 = RU.save; function force(okv) { RU.save = function () { var r = save0.apply(this, arguments); r.ok = okv; return r; }; } function unforce() { RU.save = save0; }
  try {
    var B = battle({ lvl: 3 }), k = keeper(B), P = ours(B), cards = cardsOf(B), S;
    ok('the Keeper: AC ' + RU.ac(k) + ', HP ' + k.hp + ', a Slam (prone DC ' + (k.attacks.slam && k.attacks.slam.prone) + '), no Constrict or Drag Under', k.attacks.slam && k.attacks.slam.prone === 15 && !k.attacks.constrict && !k.attacks.drown && RU.ac(k) === 13 && k.hp === 100);
    ok('the map: runs ' + (G.map.def.geo.axis === 'x' ? 'west-east' : 'north-south') + ', deep ' + JSON.stringify(G.map.def.deeps) + ', wall at ' + G.map.def.geo.wall + ' along', G.map.def.deeps.length === 4 && G.map.def.geo.wall === 11 && deepL(8, 1) && !deepL(8, 2));
    P.forEach(function (u) { delete u.conds.hidden; });
    // ---- the sheet: keeper_p2 (keeper_p1 left alone), the engine's anim names, the one-line pose swap
    var SH = D.SHEETS.keeper_p2, an0 = SH && SH.anims;
    ok('the foe draws keeper_p2 (' + k.sheet + '), p1 untouched (' + !!D.SHEETS.keeper_p1 + '), anims ' + (an0 && ['idle', 'walk', 'attack', 'hurt', 'die', 'wave', 'wall'].filter(function (a) { return an0[a]; }).join(',')), k.sheet === 'keeper_p2' && D.SHEETS.keeper_p1 && ['idle', 'walk', 'attack', 'hurt', 'die', 'wave', 'wall'].every(function (a) { return an0[a]; }));
    var y0s = an0.attack.y, f0s = an0.attack.frames; K.pose({ slam: 'slam_ba' });
    ok('pose({ slam: slam_ba }) re-points the Slam: y ' + y0s + ' (' + f0s + ' frames) -> ' + an0.attack.y + ' (' + an0.attack.frames + ')', an0.attack.y !== y0s && an0.attack.y === an0.slam_ba.y);
    K.pose({ slam: 'slam_b3a' });
    K.CFG.washNoWall = true; // (the old backwash with no wall, for the checks below; the new rule has its own checks after the wall's)
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
      K.isDeep(P[0].x, P[0].y) && P[0].conds.restrained && P[0].conds.restrained.by === k.id && P[0].conds.drowning && k.flooding && RU.ac(k) === 10 && G.dist(P[0], k) <= 5 && K.A(k) < 8);
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
    put(P[1], 8, 3); delete P[1].conds.restrained; cards.length = 0; K.drownTick(B, P[1]); // (a hero that climbed out)
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
    put(H6[0], 8, 7); k6.anim = 'wave'; RU.startTurn(k6); K.CFG.visible = false; drain(K.turn(B6, k6)); K.CFG.visible = true;
    ok('the old hidden Keeper (CFG.visible false): after its turn: standing idle (' + k6.anim + '), back in the water unseen (hidden ' + !!k6.conds.hidden + ')', k6.anim === 'idle' && !!k6.conds.hidden);
    k6.anim = 'wave'; delete k6.conds.hidden; RU.startTurn(k6); drain(K.turn(B6, k6));
    ok('the visible Keeper (the default): after its turn it is idle (' + k6.anim + ') and not hidden (' + !!k6.conds.hidden + ')', k6.anim === 'idle' && !k6.conds.hidden);
    // swirling: a friend beside the held one is beside the Keeper
    delete k6.conds.hidden; put(H6[1], 8, 1); put(H6[2], 9, 1); force(false); drain(K.flood(B6, k6, H6[1])); unforce();
    var far = G.dist(H6[2], k6), near5 = G.dist(H6[2], H6[1]);
    ok('the water about the held one is the Keeper: a friend beside the held (' + near5 + ' ft) is ' + far + ' ft from it', far <= 5 && k6.flooding);
    // cold on the swirl: no save to resist it -- the swirl ends, the held one is freed and thrown up onto the ice, prone (the Keeper stayed where it stood the whole while)
    var kx0 = k6.x, ky0 = k6.y; put(H6[3], 8, 9); H6[3].spellDC = 13; c6.length = 0; drain(K.spellOn(B6, H6[3], 'coneofcold', 5, pt(8, 2)));
    ok('cold on the swirl: it changes back and lets go (flooding ' + !!k6.flooding + ', held ' + !!H6[1].conds.restrained + '), the held one up on the ice prone (' + !!H6[1].conds.prone + '), the Keeper still where it stood (' + (k6.x === kx0 && k6.y === ky0) + ')',
      !k6.flooding && !H6[1].conds.restrained && !!H6[1].conds.prone && k6.x === kx0 && k6.y === ky0 && /takes its swirl/.test(c6.join(' ')) && K.iced(B6, H6[1].x, H6[1].y));
    c6.length = 0; drain(K.spellOn(B6, H6[3], 'coneofcold', 5, pt(8, 5)));
    ok('and cold over its own squares freezes the water it stands in, so it is restrained (' + JSON.stringify(k6.conds.restrained) + ')', k6.conds.restrained && k6.conds.restrained.ice === true && k6.conds.restrained.dc === 7);
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
    var bloom0 = D.fx.bloom, atBloom = null; D.fx.bloom = function (x, y, sq2, ramp, o) { if (ramp === 'cold' && atBloom === null) atBloom = { A: K.A(H8[0]), landing: K.A({ x: x, y: y }) }; return bloom0.apply(this, arguments); };
    K.CFG.oaWave = true; force(false); leave(); unforce(); K.CFG.oaWave = false; D.fx.bloom = bloom0;
    ok('the opportunity-attack wave: the mover stands in its square (along ' + (atBloom && atBloom.A) + ') while the effect lights the square it lands in (' + (atBloom && atBloom.landing) + '), and is pushed one square, 5 ft (now ' + K.A(H8[0]) + ')', atBloom && atBloom.A === 7 && atBloom.landing === 6 && K.A(H8[0]) === 6);
    ok('opportunity attack: off, the Slam (' + plain + ', walked to ' + y0 + '); on, a wave that sweeps the leaver toward the deep and ends its walk (now at ' + H8[0].x + ',' + K.A(H8[0]) + ')', plain && y0 === 8 && /raises a wave/.test(c8.join(' ')) && K.A(H8[0]) < 8 && !H8[0].conds.prone && k8.reaction === 0);
    D.battle = B3;
    // ---- the Ice Wall struck at: weapons and single-target spells aim at a section (AC 10); only fire, or thunder, harms it
    var B9 = battle({ lvl: 3 }), k9 = keeper(B9), H9 = ours(B9), c9 = cardsOf(B9); delete k9.conds.hidden; H9.forEach(function (u) { delete u.conds.hidden; });
    put(H9[0], 7, 10); put(H9[1], 10, 10); put(H9[2], 3, 3); put(H9[3], 3, 4); k9.reaction = 1; drain(K.raiseWall(B9, k9, H9[0]));
    var t1 = wallL(B9, 8, 11), t2 = wallL(B9, 10, 11), W9 = B9.kp.wall;
    ok('the wall is something to aim at: a target on each of its squares (' + (t1 && t1.name) + ' AC ' + (t1 && RU.ac(t1)) + ', ' + (t2 && t2.x) + ',' + (t2 && t2.y) + '), none where there is no wall', t1 && t2 && RU.ac(t1) === 10 && !wallL(B9, 8, 10) && t1.sec !== t2.sec);
    H9[0].weapon = Object.assign({}, H9[0].weapon, { atk: 60 }); for (var wt = 0; wt < 6 && !/shrugs off/.test(c9.join(' ')); wt++) { RU.startTurn(H9[0]); c9.length = 0; drain(B9.exec(H9[0], { do: 'attack', target: t1 })); } // (a natural 1 misses: up to six tries)
    ok('a weapon blow on the wall: it lands, and does no harm (' + W9.sections.length + ' sections; ' + (c9.filter(function (c) { return /shrugs off/.test(c); }).length) + ' shrugged off)', W9.sections.length === 2 && /shrugs off/.test(c9.join(' ')) && /Ice Wall/.test(c9.join(' ')));
    c9.length = 0; B9.hurt(t1, 7, 'fire');
    ok('fire carried by a blow (fire damage on the wall): that section goes (' + (B9.kp.wall ? B9.kp.wall.sections.length : 0) + ' left)', B9.kp.wall && B9.kp.wall.sections.length === 1 && /steam/.test(c9.join(' ')) && !wallL(B9, 8, 11) && !!wallL(B9, 10, 11));
    var cz = H9[1]; cz.known = (cz.known || []).concat(['firebolt']); cz.spellAtk = 60; cz.spellDC = 13; c9.length = 0; for (var fb = 0; fb < 6 && B9.kp.wall; fb++) { RU.startTurn(cz); drain(D.magic.cast(B9, cz, 'firebolt', 0, wallL(B9, 10, 11))); } // (a natural 1 misses: up to six tries)
    ok('Fire Bolt at the other section: it is destroyed and the wall is down (' + (B9.kp.wall ? 'still up' : 'down') + ') ' + c9.join(' // ').slice(0, 600), !B9.kp.wall && !wallL(B9, 10, 11) && standL(H9[0], 8, 11));
    D.battle = B3;
    // ---- the wall's ice: whoever stands where it rises is thrown up onto it, prone, and set back (the same rule as the freeze's)
    var B10 = battle({ lvl: 3 }), k10 = keeper(B10), H10 = ours(B10); H10.forEach(function (u) { delete u.conds.hidden; }); put(H10[0], 8, 11); k10.reaction = 1; drain(K.raiseWall(B10, k10, H10[1]));
    ok('a hero in the wall\'s squares when it rises: prone (' + !!H10[0].conds.prone + ') and set back to along ' + K.A(H10[0]), !!H10[0].conds.prone && K.A(H10[0]) < 11 && !standL(H10[0], 8, 11));
    D.battle = B3;
    // ---- the Slam: a hit that fails the DC 15 STR save puts them prone
    var B2 = battle({ lvl: 3 }), k2 = keeper(B2), Q = ours(B2); delete k2.conds.hidden; put(Q[0], 8, 6);
    var prone = 0, hits = 0; for (var i = 0; i < 200; i++) { delete Q[0].conds.prone; Q[0].hp = Q[0].maxhp; drain(B2.attack(k2, Q[0], k2.attacks.slam)); if (Q[0].conds.prone) prone++; if (Q[0].hp < Q[0].maxhp) hits++; }
    ok('the Slam knocks prone on a failed save (' + prone + ' of 200 swings, ' + hits + ' hit, ' + Q[0].name + ' AC ' + RU.ac(Q[0]) + ' at ' + K.A(Q[0]) + ',' + K.C(Q[0]) + ')', prone > 12);
    // ---- the gallery (?fxgallery&keeper): all six scenes run through the real code, with the looks added (and drawn onto a canvas)
    var GB = D.fxKeeper('?fxgallery&keeper&auto'); D.battle = GB; GB.enter(); var seen = {}, gerr = '', gsteps = 0, cv = document.createElement('canvas'); cv.width = 640; cv.height = 400; var cx2 = cv.getContext('2d');
    while (GB.co && gsteps++ < 60000 && (Object.keys(seen).length < K.SCENES.length || gsteps < 10)) { var gr; try { gr = GB.co.next(); } catch (e) { gerr = String(e && e.stack || e).slice(0, 400); break; } seen[GB.gallery.i] = 1; if (gr.done) break; var nf = typeof gr.value === 'number' ? Math.min(gr.value, 120) : 1; for (var fi = 0; fi < nf; fi++) { D.fx.list.forEach(function (f) { try { f.draw(cx2); } catch (e) { gerr = gerr || ('draw ' + f.kind + ': ' + String(e && e.stack || e).slice(0, 300)); } }); D.fx.update(); GB.t = (GB.t || 0) + 1; } }
    ok('the gallery: ' + Object.keys(seen).length + ' of ' + K.SCENES.length + ' scenes seen, ' + gsteps + ' steps' + (gerr ? ', ERROR ' + gerr : ''), Object.keys(seen).length >= K.SCENES.length && !gerr);
    // ---- ?keeperfight&seed=174221&watch drained (no frame loop): the fight the notes name -- level 3, won in round 7, a flood, a hold broken, a wall
    var KF = D.keeper.fight('?keeperfight&seed=31679&watch&lvl=3&old=1'); D.battle = KF; KF.enter(); var kc = cardsOf(KF), kg = 0, kv; while (KF.co && kg++ < 400000) { var kr = KF.co.next(kv); kv = undefined; if (kr.done) break; }
    var kt = kc.join('\n'), kn = function (re) { return (kt.match(re) || []).length; };
    ok('?keeperfight&seed=31679&old=1 (the Keeper of before 10-03: hidden, no glow, the party reacting at once) drained: ' + KF.result + ' R' + KF.round + ', floods ' + kn(/washed into the deep/g) + ', walls ' + kn(/(springs|raises) the Ice Wall/g), KF.result === 'won' && KF.round === 6 && kn(/washed into the deep/g) === 1 && kn(/(springs|raises) the Ice Wall/g) === 1);
    var LG = D.keeperLog, lgf = function (e) { return e && typeof e.round === 'number' && typeof e.turn === 'number' && 'actor' in e && 'action' in e && Array.isArray(e.targets) && Array.isArray(e.rolls) && 'result' in e && e.hpAfter && typeof e.hpAfter === 'object' && e.flags && ['flood', 'wall', 'swirl', 'frozen'].every(function (k) { return k in e.flags; }); };
    var lgcheck = function (what, wantActors) { var acts = {}; LG.forEach(function (e) { acts[e.actor] = 1; }); var tx = LG.text(), rolled = LG.filter(function (e) { return e.rolls.length; }).length, ends = LG.some(function (e) { return e.action === 'the fight ends'; });
      ok('the log, ' + what + ': ' + LG.length + ' lines (' + rolled + ' with rolls), actors ' + Object.keys(acts).join('/') + ', meta ' + JSON.stringify(LG.meta) + ', text ' + tx.length + ' chars, file ' + LG.filename(), LG.length > 10 && LG.every(lgf) && rolled > 3 && wantActors.every(function (a) { return acts[a]; }) && /^THE KEEPER/.test(tx) && tx.indexOf('roll:') > 0 && LG.meta.seed != null && LG.meta.level === 3 && /^keeper-seed\d+-L3\.txt$/.test(LG.filename()) && ends); };
    lgcheck('watched fight (class AI both sides)', ['The Keeper', 'Barley']); ok('the log, watched: mode ' + LG.meta.mode, LG.meta.mode === 'ai');
    D.keeper.CFG.visible = true; D.keeper.CFG.partyOpening = true; D.keeper.CFG.glow = true;
    var KF2 = D.keeper.fight('?keeperfight&seed=15841&watch&lvl=3'); D.battle = KF2; KF2.enter(); var kc = cardsOf(KF2), kg = 0, kv; while (KF2.co && kg++ < 400000) { var kr = KF2.co.next(kv); kv = undefined; if (kr.done) break; }
    var kt = kc.join('\n'), kn = function (re) { return (kt.match(re) || []).length; };
    ok('?keeperfight&seed=15841 drained (the default: visible, glowing, the opening, the drift): ' + KF2.result + ' R' + KF2.round + ', floods ' + kn(/washed into the deep/g) + ', READY springs ' + kn(/springs the Ice Wall/g), KF2.result === 'won' && KF2.round === 6 && kn(/washed into the deep/g) === 0 && kn(/springs the Ice Wall/g) === 1);
    var LG = D.keeperLog, lgf = function (e) { return e && typeof e.round === 'number' && typeof e.turn === 'number' && 'actor' in e && 'action' in e && Array.isArray(e.targets) && Array.isArray(e.rolls) && 'result' in e && e.hpAfter && typeof e.hpAfter === 'object' && e.flags && ['flood', 'wall', 'swirl', 'frozen'].every(function (k) { return k in e.flags; }); };
    var lgcheck = function (what, wantActors) { var acts = {}; LG.forEach(function (e) { acts[e.actor] = 1; }); var tx = LG.text(), rolled = LG.filter(function (e) { return e.rolls.length; }).length, ends = LG.some(function (e) { return e.action === 'the fight ends'; });
      ok('the log, ' + what + ': ' + LG.length + ' lines (' + rolled + ' with rolls), actors ' + Object.keys(acts).join('/') + ', meta ' + JSON.stringify(LG.meta) + ', text ' + tx.length + ' chars, file ' + LG.filename(), LG.length > 10 && LG.every(lgf) && rolled > 3 && wantActors.every(function (a) { return acts[a]; }) && /^THE KEEPER/.test(tx) && tx.indexOf('roll:') > 0 && LG.meta.seed != null && LG.meta.level === 3 && /^keeper-seed\d+-L3\.txt$/.test(LG.filename()) && ends); };
    lgcheck('watched fight (class AI both sides)', ['The Keeper', 'Barley']); ok('the log, watched: mode ' + LG.meta.mode, LG.meta.mode === 'ai');
    // ---- the two play modes (js/keeperplay.js): each drives a whole fight without error
    // B: the party played by a script, one plan a turn, through D16.keeperPlay.actSync
    var KB = D.keeper.fight('?keeperfight&play=party&lvl=3'); D.battle = KB; KB.enter(); var KPl = D.keeperPlay, acts = { n: 0, attack: 0, cast: 0, move: 0, dodge: 0 }, st0 = KPl.actSync({ do: 'none', keep: true }), perr = '', pj = '';
    try {
      for (var ti = 0; ti < 120 && !st0.over; ti++) {
        var me = st0.pending.type === 'turn' ? st0.units.filter(function (w) { return w.id === st0.pending.who; })[0] : null;
        if (st0.pending.type === 'prompt') { st0 = KPl.actSync({ answer: st0.pending.opts[st0.pending.opts.length - 1].value }); continue; }
        if (!me) { st0 = KPl.actSync({ do: 'none', keep: true }); if (!st0.pending || st0.pending.type === 'running') break; continue; }
        var lg = st0.legal, kst = st0.keeper, plan = { do: 'dodge' }, kid = kst && kst.id;
        var near = lg.strike.filter(function (t) { return t.id === kid; })[0], wallT = lg.strikeWall[0];
        var fire = lg.spells.filter(function (sp) { return /firebolt|scorchingray|rayoffrost|sacredflame/.test(sp.id); })[0];
        if (near && fire && acts.cast < 6) plan = { do: 'cast', spell: fire.id, target: kid };
        else if (near) plan = { do: 'attack', target: kid };
        else if (wallT && acts.attack % 3 === 0) plan = { do: 'attack', target: { wall: wallT.wall } };
        else { // close on the Keeper: the reachable square nearest to it
          var kk0 = st0.units.filter(function (w) { return w.id === kid; })[0], best = null; lg.moves.forEach(function (m) { var d = Math.max(Math.abs(m.x - kk0.x), Math.abs(m.y - kk0.y)); if (!best || d < best.d) best = { d: d, m: m }; });
          plan = best && best.m.cost > 0 ? { move: { x: best.m.x, y: best.m.y }, do: 'none' } : { do: 'dodge' };
        }
        acts.n++; if (plan.do === 'attack') acts.attack++; else if (plan.do === 'cast') acts.cast++; else if (plan.move) acts.move++; else acts.dodge++;
        st0 = KPl.actSync(plan);
      }
      pj = JSON.stringify(st0).length;
    } catch (e) { perr = String(e && e.stack || e).slice(0, 300); }
    ok('play=party: a script plays the party (' + acts.n + ' turns: ' + acts.move + ' moves, ' + acts.attack + ' attacks, ' + acts.cast + ' casts, ' + acts.dodge + ' dodges) to ' + (st0.over ? 'the end: ' + st0.result : 'round ' + st0.round) + '; state is ' + pj + ' bytes of JSON' + (perr ? ', ERROR ' + perr : ''), !perr && acts.n > 3 && acts.attack + acts.cast > 0 && typeof pj === 'number' && pj > 500);
    lgcheck('play=party (a script plays the four)', ['The Keeper', 'Barley']); ok('the log, play=party: mode ' + LG.meta.mode, LG.meta.mode === 'party' && LG.some(function (e) { return /^(attack|cast|move)/.test(e.action) && e.actor !== 'The Keeper'; }));
    var legalOK = false; try { var KB2 = D.keeper.fight('?keeperfight&play=party&lvl=3'); D.battle = KB2; KB2.enter(); var s2 = KPl.actSync({ do: 'none', keep: true }); legalOK = s2.pending.type === 'turn' && s2.legal && s2.legal.moves.length > 0 && Array.isArray(s2.legal.spells) && s2.units.length >= 5 && s2.map.geo.axis === 'x' && s2.keeper && s2.keeper.lane; } catch (e) { perr = String(e); }
    ok('play=party: the state names who is deciding, what is legal (moves, strikes, spells), the Keeper and the map\'s lane geometry', !!legalOK);
    // A: a human is the Keeper (the menu answered by a policy), the class AI the party
    var dls = [], click0 = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) dls.push(this.download + ' ' + (this.href || '').slice(0, 5)); }; // (the end-of-fight download: caught, not made)
    var KA = D.keeper.fight('?keeperfight&play=keeper&lvl=3'); D.battle = KA; KA.enter(); var used = {}, menus = 0, picks = 0, aerr = '', g2 = 0;
    try {
      while (KA.co && g2++ < 400000) {
        var rr = KA.co.next(); if (rr.done) break; var yv = rr.value;
        while (yv && yv.turn) { // the ring: the Keeper's turn asked for a command; the policy picks the first entry on offer (what the ring shows, B.commands), a step toward the party once a turn
          var ku = yv.turn, ents = KA.commands(ku), order = ['kswirl', 'kslam', 'kwave', 'kcast', 'kready', 'ksuffocate', 'kiceaction', 'kicebonus'], cmd = { do: 'end' };
          if (ents.some(function (e) { return e.id === 'ksuffocate'; }) !== (!!ku.flooding && ents.some(function (e) { return e.id === 'krise'; }))) aerr = aerr || 'suffocate offered without a hold';
          order.some(function (id) { return ents.some(function (e) { if (e.id === id && e.ok) { cmd = { do: id }; return true; } return false; }); });
          menus++;
          if (cmd.do === 'end' && ku.turn.moved1 !== KA.round && ku.turn.move > 0 && !ku.conds.restrained) { ku.turn.moved1 = KA.round; var hs2 = KA.units.filter(function (w) { return w.side === 'party' && w.hp > 0; }), rm = G.reach(ku, ku.turn.move), bs = null; Object.keys(rm).forEach(function (kx) { var xy = kx.split(',').map(Number); if (!rm[kx].stand) return; hs2.forEach(function (h) { var d = Math.max(Math.abs(xy[0] - h.x), Math.abs(xy[1] - h.y)); if (!bs || d < bs.d) bs = { d: d, x: xy[0], y: xy[1] }; }); }); if (bs && (bs.x !== ku.x || bs.y !== ku.y)) { cmd = { do: 'move', x: bs.x, y: bs.y }; picks++; } }
          used[cmd.do] = (used[cmd.do] || 0) + 1; var r3 = KA.co.next(cmd); if (r3.done) { yv = null; break; } yv = r3.value;
        }
        while (yv && yv.prompt) {
          var op = yv.prompt.opts, ans;
          if (yv.prompt.pick) { picks++; var kp0 = op.length - 1, bestI = 0, bestD = 1e9, hs = KA.units.filter(function (w) { return w.side === 'party' && w.hp > 0; }); yv.prompt.pick.forEach(function (sqr, i) { hs.forEach(function (h) { var d = Math.max(Math.abs(sqr.x - h.x), Math.abs(sqr.y - h.y)); if (d < bestD) { bestD = d; bestI = i; } }); }); ans = op[bestI].value; }
          else ans = op[0].value;
          var r2 = KA.co.next(ans); if (r2.done) { yv = null; break; } yv = r2.value;
        }
      }
    } catch (e) { aerr = String(e && e.stack || e).slice(0, 300); }
    ok('play=keeper: a human is the Keeper (' + menus + ' menus, ' + picks + ' move picks; used ' + JSON.stringify(used) + '), the fight ends: ' + KA.result + ' R' + KA.round + (aerr ? ', ERROR ' + aerr : ''), !aerr && menus > 3 && !!KA.result && (used.kslam || 0) + (used.kwave || 0) > 0);
    HTMLAnchorElement.prototype.click = click0; ok('the log: the fight\'s end downloads it, named by seed and level (' + dls + ') -- and a bench fight did not', dls.length === 1 && /^keeper-seed\d+-L3\.txt blob:$/.test(dls[0]));
    lgcheck('play=keeper (a human Keeper on the ring)', ['The Keeper', 'Barley']); ok('the log, play=keeper: mode ' + LG.meta.mode + ', the Keeper\'s ring commands (' + LG.filter(function (e) { return /^k/.test(e.action); }).map(function (e) { return e.action; }).slice(0, 4) + ')', LG.meta.mode === 'keeper' && LG.some(function (e) { return /^k(slam|wave|cast|ready)/.test(e.action); }));
    // ---- 10-03 desk notes A-G: the Wave with no wall (prone only, no washback), with the wall (washback only where a section stands), the CAST, who may do what, the ring
    K.CFG.washNoWall = false;
    var BC = battle({ lvl: 3 }), kC = keeper(BC), HC = ours(BC), cC = cardsOf(BC); HC.forEach(function (u) { delete u.conds.hidden; }); delete kC.conds.hidden;
    put(HC[0], 8, 9); put(HC[1], 9, 9); put(HC[2], 7, 7); put(HC[3], 10, 7); force(false); RU.startTurn(kC); var yA = HC.map(function (u) { return K.A(u); }); drain(K.wave(BC, kC)); unforce();
    ok('Wave, wall down: all prone (' + HC.filter(function (u) { return u.conds.prone; }).length + ') and none swept (' + yA + ' -> ' + HC.map(function (u) { return K.A(u); }) + ')', HC.every(function (u) { return u.conds.prone; }) && HC.every(function (u, i) { return K.A(u) === yA[i]; }) && !/is swept/.test(cC.join(' ')));
    HC.forEach(function (u) { delete u.conds.prone; }); put(HC[0], 8, 9); put(HC[1], 9, 9); put(HC[2], 7, 9); put(HC[3], 10, 9); BC.kp.uses = 3; kC.reaction = 1; drain(K.raiseWall(BC, kC, null));
    HC.forEach(function (u) { delete u.conds.prone; }); put(HC[0], 8, 9); put(HC[1], 9, 9); put(HC[2], 7, 9); put(HC[3], 10, 9);
    var secA = BC.kp.wall.sections[0], cA = secA.sq.map(function (p) { return K.C({ x: p[0], y: p[1] }); }); RU.startTurn(kC); force(false); cC.length = 0; drain(K.wave(BC, kC)); unforce();
    ok('Wave, wall up: swept off it, ' + HC.map(function (u) { return K.A(u); }), HC.every(function (u) { return K.A(u) < 9; }) || /is swept/.test(cC.join(' ')));
    var secs0 = BC.kp.wall.sections; BC.kp.wall.sections = [secs0[1]]; BC.kp.wall.sq = secs0[1].sq.slice(); BC.wallMap = null; HC.forEach(function (u) { delete u.conds.prone; }); put(HC[0], 8, 9); put(HC[1], 9, 9); put(HC[2], 7, 9); put(HC[3], 10, 9); cC.length = 0; var cc2 = secs0[1].sq.map(function (p) { return K.C({ x: p[0], y: p[1] }); }); RU.startTurn(kC); force(false); drain(K.wave(BC, kC)); unforce();
    ok('Wave, a section gone: swept only where one stands (columns ' + cc2 + '; A ' + HC.map(function (u) { return K.C(u) + ':' + K.A(u); }) + ')', HC.every(function (u) { return cc2.indexOf(K.C(u)) >= 0 ? K.A(u) < 9 : K.A(u) === 9; }));
    // CAST: at once, an action; init bonus; E: the ring offers only what applies
    var BD = battle({ lvl: 3 }), kD = keeper(BD), HD = ours(BD), cD = cardsOf(BD); delete kD.conds.hidden; HD.forEach(function (u) { delete u.conds.hidden; }); put(HD[0], 8, 9); RU.startTurn(kD); var canC = K.canCastWall(BD, kD); drain(K.castWall(BD, kD));
    ok('CAST Ice Wall: canCast ' + canC + ', up at once (' + !!BD.kp.wall + '), action spent ' + (kD.turn.action === 0) + ', ' + BD.kp.uses + ' uses left, reaction kept ' + kD.reaction, canC && BD.kp.wall && kD.turn.action === 0 && BD.kp.uses === 2 && kD.reaction === 1 && /raises the Ice Wall/.test(cD.join(' ')));
    var BE = battle({ lvl: 3 }), kE = keeper(BE), HE = ours(BE); BE.o.play = 'keeper'; delete kE.conds.hidden; HE.forEach(function (u) { delete u.conds.hidden; }); put(HE[0], 8, 9); RU.startTurn(kE);
    var idsE = function () { return BE.commands(kE).map(function (e) { return e.id; }).join(','); }, e0 = idsE();
    ok('ring, no one held: ' + e0, !/ksuffocate|krise|kice/.test(e0) && /kslam/.test(e0) && /kcast/.test(e0) && /kready/.test(e0));
    force(false); put(HE[1], 8, 1); HE[1].conds.prone = false; drain(K.flood(BE, kE, HE[1])); unforce(); RU.startTurn(kE); var e1 = idsE();
    ok('ring, a hero held: ' + e1, /ksuffocate/.test(e1) && /krise/.test(e1) && !/kslam/.test(e1) && !/kwave/.test(e1));
    HE[1].conds.restrained = null; delete HE[1].conds.restrained; drain(BE.exec(HE[1], { do: 'none' })); // a hero got free (any command runs the check)
    ok('the hero got free: the Keeper is back to the humanoid (flooding ' + !!kE.flooding + '), ring ' + idsE(), !kE.flooding && !/ksuffocate|krise/.test(idsE()));
    // D: the initiative bonus
    var iA = 0, iB = 0; K.CFG.initBonus = 0; for (var q0 = 0; q0 < 20; q0++) { D.seed = 100 + q0; var Bi = battle({ lvl: 3 }); Bi.o.noCards = 1; Bi.fight = Object.assign({}, Bi.fight, { noCards: true }); Bi.co.next(); iA += keeper(Bi).initRoll; } K.CFG.initBonus = 5; for (q0 = 0; q0 < 20; q0++) { D.seed = 100 + q0; var Bj = battle({ lvl: 3 }); Bj.fight = Object.assign({}, Bj.fight, { noCards: true }); Bj.co.next(); iB += keeper(Bj).initRoll; } K.CFG.initBonus = 0;
    ok('initiative bonus: Keeper rolls sum ' + iA + ' at +0, ' + iB + ' at +5 over 20 fights', iB - iA === 100);
    // F: the dead Keeper is not drawn; the pool is calm
    var BF = battle({ lvl: 3 }), kF = keeper(BF); kF.hp = 1; drain(BF.hurt(kF, 50, 'bludgeoning')); ok('the Keeper dead: ' + (kF.dead || kF.hp <= 0) + ', hidden ' + !!(kF.conds && kF.conds.hidden) + ', releasing ' + !kF.flooding, (kF.dead || kF.hp <= 0) && !kF.flooding);
    var lg = G.map.def.lights && G.map.def.lights[0], rn = K.at(G.map.def.geo.rune[0], G.map.def.geo.rune[1] - 1);
    ok('the rune is a light: ' + JSON.stringify(lg) + ' at the square by the north wall ' + rn, lg && lg[0] === rn[0] && lg[1] === rn[1] && lg[3] === 'glow' && lg[2] <= 25);
    // ---- play=keeper through the CLICK path (Griz's playtest, 10-03: a click on a hero with no ring item threw on u.weapon.ammo and froze the page; the tooltip read u.weapon every frame):
    // the real scene on the stack, the mouse set over a unit and clicked, the frame loop stepped by hand (D.update, D.draw)
    (function () {
      var I = D.input, thrown = [], KC = D.keeper.fight('?keeperfight&play=keeper&lvl=3'), kc, HC2, steps = 0, dl = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () {};
      if (!D.ctx) { var cvk = document.createElement('canvas'); cvk.width = D.W * (D.R || 1); cvk.height = D.H * (D.R || 1); D.ctx = cvk.getContext('2d'); } // (the probe page has no canvas of its own)
      D.scenes.push(KC); D.battle = KC; KC.enter();
      function frame(n) { for (var i = 0; i < (n || 1); i++) { try { D.update(); D.draw(); } catch (e) { thrown.push(String(e && e.stack || e).slice(0, 240)); } steps++; } }
      // (the mouse is set to rest over the map and the cursor put on the unit's square, as the pick would: pickUnit's pixel maths is not simulated)
      function toScreen(u) { return { sq: { x: u.x, y: u.y } }; }
      function mouse(pt, click) { I.mouse.inside = true; I.mouse.inWin = true; I.mouse.moved = false; I.mouse.x = D.W / 2; I.mouse.y = D.H / 3; if (pt && pt.sq) { KC.cursor = { x: pt.sq.x, y: pt.sq.y }; KC.hoverUnit = null; } if (click) I.mouse.click = true; }
      function sqPt(a, c) { var o = K.at(a, c); return { sq: { x: o[0], y: o[1] } }; }
      frame(3); if (KC.req && KC.req.entry) { KC.answer(); frame(3); }
      var g0 = 0; while (g0++ < 4000 && !(KC.req && KC.req.turn && KC.req.turn.kind === 'keeper')) frame(1); // (the party's turns by the class AI, till the Keeper's)
      kc = KC.req && KC.req.turn; HC2 = ours(KC); HC2.forEach(function (u) { delete u.conds.hidden; }); delete (kc || {}).conds.hidden;
      function settle() { var g = 0; while (g++ < 900 && !KC.result && !(KC.req && KC.req.turn)) frame(1); }
      var alive = function () { return !!(KC.req && KC.req.turn === kc); }, T = kc && kc.turn;
      ok('mode A by clicks: it is the Keeper\'s turn on the ring (' + (kc && kc.name) + ', weapon stand-in ' + !!(kc && kc.weapon && kc.weapon.standIn) + ', reach ' + (kc && kc.weapon && kc.weapon.reach) + ')', !!kc && kc.weapon && kc.weapon.standIn);
      if (kc) {
        var near = HC2[0], far = HC2[1]; put(near, 8, 6); put(far, 8, 10); KC.cursor = { x: kc.x, y: kc.y }; KC.tool = 'move'; KC.list = null;
        // hover a hero (the tooltip: RU.edges on the Keeper's weapon), reading every frame
        var e0 = thrown.length; mouse(toScreen(near)); frame(4); mouse(toScreen(far)); frame(4);
        ok('hover a hero: the tooltip draws (' + (thrown.length - e0) + ' errors) and the turn loop is alive ' + alive(), thrown.length === e0 && alive());
        // click the far one, no ring item: out of reach, nothing spent, a card, no throw
        var hp0 = near.hp, cards2 = cardsOf(KC); T.action = 1; e0 = thrown.length; mouse(toScreen(far), true); frame(3);
        ok('click a hero out of reach: nothing spent (action ' + T.action + '), the card says why (' + (cards2.join(' ').match(/out of reach[^.]*/) || ['none'])[0] + '), no error, loop alive ' + alive(), thrown.length === e0 && T.action === 1 && /out of reach/.test(cards2.join(' ')) && alive());
        // click the near one: the Slam on it
        cards2.length = 0; e0 = thrown.length; var d0 = G.dist(kc, near); mouse(toScreen(near), true); frame(4); settle();
        ok('click a hero in reach (' + d0 + ' ft): the Slam (action ' + T.action + ', ' + (cards2.join(' ').match(/Slam/) || ['no Slam card'])[0] + '), no error, the turn goes on ' + alive(), thrown.length === e0 && T.action === 0 && /Slam/.test(cards2.join(' ')) && alive());
        // a second click: the action is spent, said on a card, nothing thrown
        cards2.length = 0; e0 = thrown.length; mouse(toScreen(near), true); frame(3);
        ok('click again, action spent: a card (' + cards2.join(' ').slice(0, 60) + '), no error', thrown.length === e0 && /spent/.test(cards2.join(' ')) && alive());
        // the Keeper's own square: the ring opens; an empty square: a move or a card; none of it throws
        e0 = thrown.length; KC.tool = 'move'; mouse(toScreen(kc), true); frame(3); var ringed = KC.tool === 'menu';
        ok('click the Keeper\'s own square: the ring (' + KC.tool + '), no error', thrown.length === e0 && ringed && alive());
        KC.tool = 'move'; KC.list = null; e0 = thrown.length; var kx = kc.x, ky = kc.y; mouse(sqPt(4, 9), true); frame(3); settle();
        ok('click an empty square: a move (' + kx + ',' + ky + ' -> ' + kc.x + ',' + kc.y + ') or a card, no error, loop alive ' + alive(), thrown.length === e0 && alive());
        // END TURN by the ring's own button path, and the loop reaches the next turn
        e0 = thrown.length; var cmdSeen = 0; try { drain1(KC); } catch (e) { thrown.push(String(e)); }
        function drain1() { KC.answer({ do: 'end' }); frame(5); cmdSeen = 1; }
        ok('end the turn: the fight goes on to the next turn, no error (' + thrown.length + ' in all)', thrown.length === 0);
      }
      D.scenes.pop(); HTMLAnchorElement.prototype.click = dl; D.battle = B3;
      if (thrown.length) errs.push('click path: ' + thrown[0]);
    })();
    // ---- the Keeper's moves on a hero it cannot take: a card that says why, nothing spent, never a silent refusal (the desk's note 3, 10-03: Lymen was not on the deep)
    (function () {
      var B7 = battle({ lvl: 3 }), k7 = keeper(B7), H7 = ours(B7), c7 = cardsOf(B7); B7.o.play = 'keeper'; H7.forEach(function (u) { delete u.conds.hidden; }); delete k7.conds.hidden;
      function run(cmd, answers) { var g = B7.exec(k7, cmd), v, n = 0, prompts = 0; answers = (answers || []).slice(); while (n++ < 5000) { var r = g.next(v); v = undefined; if (r.done) break; var y = r.value; if (y && y.prompt) { prompts++; v = answers.length ? answers.shift() : 0; } } return prompts; }
      function fresh() { RU.startTurn(k7); k7.flooding = null; k7.baseAC = k7.baseAC; delete k7.conds.restrained; H7.forEach(function (u) { delete u.conds.restrained; delete u.conds.prone; delete u.conds.drowning; u.hp = u.maxhp; delete u.ko; delete u.conds.hidden; }); K.st(B7).ice = {}; c7.length = 0; }
      function saidWhy(re) { return re.test(c7.join(' ')); }
      var lym = H7[3], bar = H7[0];
      fresh(); put(lym, 8, 5); put(bar, 8, 1); run({ do: 'kswirl', target: lym });
      ok('swirl a hero not on the deep (' + lym.name + ' at ' + K.A(lym) + ' along): a card says why, nothing spent, no hold (action ' + k7.turn.action + ', flooding ' + !!k7.flooding + ') -- ' + (c7.join(' ').match(/SWIRL: [^.]*/) || ['no card'])[0].slice(0, 120), saidWhy(/not on the deep/) && k7.turn.action === 1 && !k7.flooding && !lym.conds.restrained);
      fresh(); put(bar, 8, 1); K.st(B7).ice[iceKey(8, 1)] = true; run({ do: 'kswirl', target: bar });
      ok('swirl a hero on frozen water: ' + (c7.join(' ').match(/SWIRL: [^.]*/) || ['no card'])[0].slice(0, 90), saidWhy(/frozen: a footing/) && k7.turn.action === 1);
      fresh(); put(bar, 8, 1); bar.conds.restrained = { by: 'x', dc: 10 }; run({ do: 'kswirl', target: bar });
      ok('swirl a hero already held: ' + (c7.join(' ').match(/SWIRL: [^.]*/) || ['no card'])[0], saidWhy(/held already/) && k7.turn.action === 1);
      fresh(); put(bar, 8, 1); bar.hp = 0; bar.ko = true; put(lym, 8, 2); lym.conds.prone = false; var legalDown = KP_swirl(k7, bar); run({ do: 'kswirl', target: bar });
      ok('swirl a hero who is down: ' + (c7.join(' ').match(/SWIRL: [^.]*/) || ['no card'])[0], saidWhy(/is down|Not a hero/) && k7.turn.action === 1);
      function KP_swirl(k, t) { return D.keeperPlay.swirlWhy(B7, k, t); }
      fresh(); put(bar, 8, 1); k7.turn.action = 0; run({ do: 'kswirl', target: bar });
      ok('swirl with the action spent: ' + (c7.join(' ').match(/(SWIRL|[A-Z][a-z]+)[^.]*spent/) || ['no card'])[0], saidWhy(/action is spent|spent/) && !k7.flooding);
      fresh(); put(bar, 8, 1); put(lym, 8, 2); var pr = run({ do: 'kswirl' }, [4, 0]); // the ring's: the gold-square pick offers every hero; the second hero up the stair is no good (a card), then NOT NOW
      ok('the swirl pick offers every hero, an illegal pick says why and asks again (' + pr + ' prompts), nothing spent (action ' + k7.turn.action + ')', pr >= 2 && saidWhy(/SWIRL: [^.]*not on the deep/) && k7.turn.action === 1 && !k7.flooding);
      fresh(); put(bar, 8, 1); put(lym, 8, 2); pr = run({ do: 'kswirl', target: bar });
      ok('a hero on the deep is taken: flooding ' + !!k7.flooding + ', held ' + !!bar.conds.restrained + ', the action spent ' + (k7.turn.action === 0), !!k7.flooding && !!bar.conds.restrained && k7.turn.action === 0);
      // the Slam
      fresh(); put(bar, 8, 9); run({ do: 'attack', target: bar });
      ok('Slam a hero out of reach: ' + (c7.join(' ').match(/[A-Za-z ]*out of reach[^.]*/) || ['no card'])[0] + ', nothing spent', saidWhy(/out of reach/) && k7.turn.action === 1);
      fresh(); put(bar, 8, 6); bar.conds.hidden = true; var d7 = G.dist(k7, bar); run({ do: 'attack', target: bar }); var hidWhy = c7.join(' ');
      ok('Slam a hidden hero at ' + d7 + ' ft: ' + (/cannot find|Slam/.test(hidWhy) ? hidWhy.slice(0, 70) : 'no card'), /cannot find|Slam/.test(hidWhy));
      fresh(); put(bar, 8, 6); bar.hp = 0; bar.ko = true; run({ do: 'attack', target: bar });
      ok('Slam a hero who is down: ' + (c7.join(' ').match(/Not a foe there/) || ['no card'])[0], saidWhy(/Not a foe there/) && k7.turn.action === 1);
      fresh(); put(bar, 8, 6); k7.turn.action = 0; run({ do: 'attack', target: bar });
      ok('Slam with the action spent: ' + (c7.join(' ').match(/action is spent/) || ['no card'])[0], saidWhy(/action is spent/));
      fresh(); put(bar, 8, 6); k7.flooding = { vic: lym.id }; run({ do: 'attack', target: bar });
      ok('Slam from inside the swirl: ' + (c7.join(' ').match(/LET GO[^.]*/) || ['no card'])[0], saidWhy(/LET GO/) && k7.turn.action === 1); k7.flooding = null;
      var wallT = { name: 'Ice Wall', isWall: true, side: 'foe', hp: 999, conds: {}, x: 8, y: 8, size: 1 }; fresh(); run({ do: 'attack', target: wallT });
      ok('Slam at the ice wall (not a hero): ' + (c7.join(' ').match(/Not a foe there/) || ['no card'])[0], saidWhy(/Not a foe there/) && k7.turn.action === 1);
      fresh(); put(bar, 8, 6); run({ do: 'attack', target: bar });
      ok('Slam a hero in reach: the Slam (action ' + k7.turn.action + ')', k7.turn.action === 0 && /Slam/.test(c7.join(' ')));
      // hp=150: the URL's Keeper HP, in the ring's panel (u.hp/maxhp), the tooltip and the log
      var BH = D.keeper.fight('?keeperfight&play=keeper&lvl=3&hp=150'); D.battle = BH; BH.enter(); var kH = keeper(BH);
      ok('hp=150 in the URL: the Keeper is ' + kH.hp + '/' + kH.maxhp, kH.hp === 150 && kH.maxhp === 150);
      D.battle = B3;
    })();
    // ---- 10-03, Griz: the Keeper is visible and glows; the party opens by holding the landing, and engages when it strikes
    (function () {
      var BG = battle({ lvl: 3 }), kG = keeper(BG), HG = ours(BG), LI = D.light, lit = LI.carried(kG).filter(function (l) { return l.kind === 'keeperglow'; })[0];
      ok('visible by default: not hidden (' + !!kG.conds.hidden + '), a light of his own (' + JSON.stringify(lit && { b: lit.bright, d: lit.dim, c: lit.color }) + '), lit where he stands (level ' + LI.levelOf(BG, kG) + ' of 2)', !kG.conds.hidden && lit && lit.dim > 0 && LI.levelOf(BG, kG) >= 1);
      var x0 = kG.x; kG.x += 0; var k0 = K.at(6, 8, 2); kG.x = k0[0]; kG.y = k0[1]; var lit2 = LI.carried(kG).filter(function (l) { return l.kind === 'keeperglow'; })[0];
      ok('the glow moves with him (' + lit2.x + ',' + lit2.y + ' for him at ' + kG.x + ',' + kG.y + ')', Math.abs(lit2.x - (kG.x + 0.5)) < 0.01);
      kG.hp = 0; ok('and goes out when he falls', !LI.carried(kG).some(function (l) { return l.kind === 'keeperglow'; })); kG.hp = kG.maxhp;
      var u0 = HG[0], px = u0.x, py = u0.y, ch = cardsOf(BG); HG.forEach(function (u) { u.guest = true; u.classAI = true; }); RU.startTurn(u0); K.putK && 0; putK(kG);
      K.CFG.openingDrift = false; drain(D.tactics.turn(BG, u0)); var held = u0.x === px && u0.y === py && u0.turn.action === 1 && !ch.length; K.CFG.openingDrift = true;
      ok('the opening: the party holds the landing before it is struck (moved ' + (u0.x !== px || u0.y !== py) + ', action ' + u0.turn.action + ', cards ' + ch.length + ')', held && !K.opened(BG));
      var a0 = K.A(u0); K.st(BG).driftRound = null; RU.startTurn(u0); drain(D.tactics.turn(BG, u0)); var a1 = K.A(u0), u1 = HG[1], b0 = K.A(u1); RU.startTurn(u1); drain(D.tactics.turn(BG, u1));
      ok('the drift: one hero a round steps a square toward the rune/exit (along ' + a0 + ' -> ' + a1 + '), the next holds (along ' + b0 + ' -> ' + K.A(u1) + ')', (a1 === a0 + 1 || a0 >= G.map.def.geo.wall - 1) && K.A(u1) === b0 && !K.opened(BG));
      kG.hp -= 5; RU.startTurn(u0); drain(D.tactics.turn(BG, u0));
      ok('and engages once the Keeper is hurt / strikes (opened ' + K.opened(BG) + ', acted ' + (u0.turn.action === 0 || u0.x !== px || u0.y !== py) + ')', K.opened(BG) && (u0.turn.action === 0 || u0.x !== px || u0.y !== py));
      K.CFG.partyOpening = false; var BG2 = battle({ lvl: 3 }), u2 = ours(BG2)[0], q = u2.x; ours(BG2).forEach(function (u) { u.guest = true; u.classAI = true; }); RU.startTurn(u2); drain(D.tactics.turn(BG2, u2));
      ok('CFG.partyOpening false is the old behaviour: the party closes at once (acted ' + (u2.turn.action === 0 || u2.x !== q) + ')', u2.turn.action === 0 || u2.x !== q); K.CFG.partyOpening = true;
      D.battle = B3;
    })();
    // ---- 10-03 tuning levers and the wider swirl (CFG.slamDice, slams, waveDC, weaponResist, swirlAny): each does what it says; defaults unchanged
    (function () {
      var C = K.CFG, save = { sd: C.slamDice, sl: C.slams, wd: C.waveDC, wr: C.weaponResist, sa: C.swirlAny };
      C.slamDice = '3d6'; C.slams = 2; C.weaponResist = true; var BL = battle({ lvl: 3 }), kL = keeper(BL); var cL = cardsOf(BL), HL = ours(BL); delete kL.conds.hidden; HL.forEach(function (u) { delete u.conds.hidden; }); put(HL[0], 8, 6); put(HL[1], 8, 7);
      ok('levers: the Slam is ' + kL.attacks.slam.dice + '+' + kL.attacks.slam.mod + ', the stand-in too (' + kL.weapon.dice + '), nonmagical weapons resisted (' + kL.resist + ')', kL.attacks.slam.dice === '3d6' && kL.weapon.dice === '3d6' && kL.resist.indexOf('mundane') >= 0);
      RU.startTurn(kL); drain(K.turn(BL, kL)); var slamsDone = cL.filter(function (c) { return /> .*Slam/.test(c) && /d20/.test(c); }).length;
      ok('slams=2: the AI Keeper Slams twice from one action (' + slamsDone + ' attack cards)', slamsDone >= 2);
      var BM = battle({ lvl: 3 }), kM = keeper(BM), HM = ours(BM); BM.o.play = 'keeper'; delete kM.conds.hidden; put(HM[0], 8, 6); put(HM[1], 8, 7); RU.startTurn(kM); var cM = cardsOf(BM);
      var rn = function (cmd) { var g = BM.exec(kM, cmd), n = 0, v; while (n++ < 3000) { var r = g.next(v); v = undefined; if (r.done) break; if (r.value && r.value.prompt) v = 0; } };
      rn({ do: 'kslam', target: HM[0] }); var left1 = kM.turn.slamsLeft, e1 = D.keeperPlay.entries(BM, kM).filter(function (e) { return e.id === 'kslam'; })[0]; rn({ do: 'kslam', target: HM[1] });
      ok('slams=2 as the human Keeper: the second Slam is out of the same action (left after the first ' + left1 + ', ring SLAM ok ' + (e1 && e1.ok) + '; after the second ' + kM.turn.slamsLeft + ', action ' + kM.turn.action + ')', left1 === 1 && e1 && e1.ok && kM.turn.slamsLeft === 0 && kM.turn.action === 0);
      C.slamDice = save.sd; C.slams = save.sl; C.weaponResist = save.wr;
      // the wider swirl
      var BS = battle({ lvl: 3 }), kS = keeper(BS), HS = ours(BS); BS.o.play = 'keeper'; delete kS.conds.hidden; RU.startTurn(kS); put(HS[0], 8, 5); put(HS[1], 8, 10);
      var w0 = D.keeperPlay.swirlWhy(BS, kS, HS[0]), w0b = D.keeperPlay.swirlWhy(BS, kS, HS[1]); C.swirlAny = true; var w1 = D.keeperPlay.swirlWhy(BS, kS, HS[0]), w1b = D.keeperPlay.swirlWhy(BS, kS, HS[1]); put(HS[2], 8, 9); put(kS, 8, 9); var w2 = D.keeperPlay.swirlWhy(BS, kS, HS[2]);
      ok('swirl=any: a hero in the water of the steps (along 5): default says "' + w0.slice(0, 40) + '", wider says "' + w1 + '"; one on the dry landing out of reach: "' + w1b.slice(0, 50) + '"; default says it too ("' + w0b.slice(0, 20) + '")', w0 && !w1 && w1b && /out of the water/.test(w1b));
      put(kS, 4, 8, 2); put(HS[3], 8, 9); var inR = G.dist(kS, HS[3]) <= 10; var w3 = D.keeperPlay.swirlWhy(BS, kS, HS[3]); C.swirlAny = false; var w4 = D.keeperPlay.swirlWhy(BS, kS, HS[3]);
      ok('swirl=any: a hero on the dry landing within his reach (' + G.dist(kS, HS[3]) + ' ft): wider "' + w3 + '"; default "' + w4.slice(0, 40) + '"', !inR || (!w3 && !!w4));
      // held in the water off the deep: the drowning goes on (default: the held are on the deep)
      C.swirlAny = true; var BT = battle({ lvl: 3 }), kT = keeper(BT), HT = ours(BT); delete kT.conds.hidden; put(HT[0], 8, 5); put(kT, 8, 5, 2); RU.startTurn(kT); drain(K.flood(BT, kT, HT[0])); var cT = cardsOf(BT); HT[0].hp = HT[0].maxhp = 40; K.drownTick(BT, HT[0]);
      ok('swirl=any: held on a flooded step it drowns still (hp ' + HT[0].hp + ', drowning ' + !!HT[0].conds.drowning + ')', HT[0].hp < 40 && !!HT[0].conds.drowning); C.swirlAny = save.sa;
      D.battle = B3;
    })();
    D.battle = B3;
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
        agg.drown += cnt(/ drowns/g); agg.twice += cnt(/flooded: twice/g); agg.breaks += cnt(/THE HOLD BREAKS/g); agg.kept += cnt(/the hold keeps/g); agg.walls += cnt(/(springs|raises) the Ice Wall/g);
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
