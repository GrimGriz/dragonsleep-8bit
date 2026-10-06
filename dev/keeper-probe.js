/* The Keeper of the Flooded Stair on the grid (dev/keeper-probe.py; 10-03, js/keeper.js). The Slam, the Wave and its backwash, the deep, the flooding, the drowning,
   the concentration check on the hold, and a few whole fights run through by the class AI. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, K = D.keeper, checks = [], errs = [];
  D.spr.offline = true; // (10-03, the lazy sheets: the probe draws into a canvas of its own and never waits on an image; the check below reads what a scene asks the gate for)
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
    ok('the Keeper: AC ' + RU.ac(k) + ', HP ' + k.hp + ', a Slam (prone DC ' + (k.attacks.slam && k.attacks.slam.prone) + '), no Constrict or Drag Under', k.attacks.slam && k.attacks.slam.prone === 15 && !k.attacks.constrict && !k.attacks.drown && RU.ac(k) === 13 && k.hp === 160 && k.attacks.slam.dice === '3d4' && K.CFG.slams === 2 && K.CFG.waveDC === 15 && K.CFG.swirlHit === true);
    ok('the map: runs ' + (G.map.def.geo.axis === 'x' ? 'west-east' : 'north-south') + ', deep ' + JSON.stringify(G.map.def.deeps) + ', wall at ' + G.map.def.geo.wall + ' along', G.map.def.deeps.length === 8 && G.map.def.geo.wall === 11 && deepL(8, 1) && deepL(8, 2) && !deepL(8, 3));
    P.forEach(function (u) { delete u.conds.hidden; });
    // ---- the sheet: keeper_p2 (keeper_p1 left alone), the engine's anim names, the one-line pose swap
    var SH = D.SHEETS.keeper_p2, an0 = SH && SH.anims;
    ok('the foe draws keeper_p2 (' + k.sheet + '), p1 untouched (' + !!D.SHEETS.keeper_p1 + '), anims ' + (an0 && ['idle', 'walk', 'attack', 'hurt', 'die', 'wave', 'wall'].filter(function (a) { return an0[a]; }).join(',')), k.sheet === 'keeper_p2' && D.SHEETS.keeper_p1 && ['idle', 'walk', 'attack', 'hurt', 'die', 'wave', 'wall'].every(function (a) { return an0[a]; }));
    var y0s = an0.attack.y, f0s = an0.attack.frames; K.pose({ slam: 'slam_ba' });
    ok('pose({ slam: slam_ba }) re-points the Slam: y ' + y0s + ' (' + f0s + ' frames) -> ' + an0.attack.y + ' (' + an0.attack.frames + ')', an0.attack.y !== y0s && an0.attack.y === an0.slam_ba.y);
    K.pose({ slam: 'slam_b3a' });
    K.CFG.sweepUpFree = true; K.CFG.washNoWall = true; // (the old backwash with no wall, for the checks below; the new rule has its own checks after the wall's)
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
    ok('one drowning roll at the start of its turn: ' + d1 + ' (' + (cards[0] || '').slice(0, 90) + ')', d1 >= 1 && d1 <= 12 && !/twice/.test(cards.join(' ')));
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
    put(P[1], 8, 1); force(false); P[1].hp = P[1].maxhp = 60; drain(K.flood(B, k, P[1])); cards.length = 0; var hk = k.hp; force(true); B.hurt(k, 4, 'bludgeoning'); unforce();
    ok('a held concentration keeps the hold (' + !!P[1].conds.restrained + ')', P[1].conds.restrained && /the hold keeps/.test(cards.join(' ')));
    // ---- climbing out: a head over the water ends the drowning
    put(P[1], 8, 3); delete P[1].conds.restrained; cards.length = 0; K.drownTick(B, P[1]); // (a hero that climbed out)
    ok('out of the deep: no more drowning', !P[1].conds.drowning && /gets a breath/.test(cards.join(' ')));
    // ---- the one geometry: the lane frame and the map agree both ways, the map's own numbers are derived from it, the Keeper starts where it says and faces the party
    var geoOK = true; [[8, 7], [13, 10], [1, 8], [4, 12]].forEach(function (p) { var o = K.at(p[0], p[1]), q = { x: o[0], y: o[1] }; if (K.A(q) !== p[0] || K.C(q) !== p[1]) geoOK = false; });
    var kg = keeper(battle({ lvl: 3 })), gm = G.map.def.geo, ks = K.at(gm.keeper[0], gm.keeper[1], 2);
    ok('the geometry reads one way: lane frame <-> map round trips ' + geoOK + ', the entry squares are the geo\'s (' + JSON.stringify(G.map.def.entry) + '), the Keeper starts at ' + ks + ' (is at ' + kg.x + ',' + kg.y + '), the rune on the landing square beside the north wall (c ' + gm.rune[1] + ' of ' + gm.c + ', face ' + gm.runeFace + ')',
      geoOK && G.map.def.entry.every(function (e, i) { var o = K.at(gm.entry[i][0], gm.entry[i][1]); return e[0] === o[0] && e[1] === o[1]; }) && kg.x === ks[0] && kg.y === ks[1] && gm.rune[1] === gm.c[1] && gm.runeFace === 'c+' && gm.axis === 'x');
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
    K.CFG.openerDeep = false; // (its opener's walk to the deep, 10-03, kept out of these: the swirl below is set on the squares it would walk to)
    put(H6[0], 8, 7); k6.anim = 'wave'; RU.startTurn(k6); K.CFG.visible = false; drain(K.turn(B6, k6)); K.CFG.visible = true;
    ok('the old hidden Keeper (CFG.visible false): after its turn: standing idle (' + k6.anim + '), back in the water unseen (hidden ' + !!k6.conds.hidden + ')', k6.anim === 'idle' && !!k6.conds.hidden);
    k6.anim = 'wave'; delete k6.conds.hidden; RU.startTurn(k6); drain(K.turn(B6, k6));
    ok('the visible Keeper (the default): after its turn it is idle (' + k6.anim + ') and not hidden (' + !!k6.conds.hidden + ')', k6.anim === 'idle' && !k6.conds.hidden);
    K.CFG.openerDeep = true;
    // swirling: a friend beside the held one is beside the Keeper
    delete k6.conds.hidden; put(H6[1], 8, 1); put(H6[2], 9, 1); force(false); H6[1].hp = H6[1].maxhp = 60; drain(K.flood(B6, k6, H6[1])); unforce();
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
    K.CFG.oaWave = false; force(true); leave(); unforce(); var plain = /Slam/.test(c8.join(' ')) && !/raises a wave/.test(c8.join(' ')), y0 = K.A(H8[0]);
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
    // ---- ?keeperfight&seed=102950&watch drained (no frame loop): the fight the notes name -- level 3, won in round 7, a flood, a hold broken, a wall
    var KF = D.keeper.fight('?keeperfight&seed=31679&watch&lvl=3&old=1'); D.battle = KF; KF.enter(); var kc = cardsOf(KF), kg = 0, kv; while (KF.co && kg++ < 400000) { var kr = KF.co.next(kv); kv = undefined; if (kr.done) break; }
    var kt = kc.join('\n'), kn = function (re) { return (kt.match(re) || []).length; };
    ok('?keeperfight&seed=31679&old=1 (the Keeper of before 10-03: hidden, no glow, the party reacting at once) drained: ' + KF.result + ' R' + KF.round + ', floods ' + kn(/washed into the deep/g) + ', walls ' + kn(/(springs|raises) the Ice Wall/g), (KF.result === 'won' || KF.result === 'lost') && kn(/washed into the deep/g) === 0); // (LOOSENED 10-06, Griz: "loosen, until something breaks I don't think we'll look at him": it ends, and the old profile never floods -- the round and the walls print, unchecked; they moved with every rule under the dice, R7 to R6 at c5cb4d8, the Stealth of 10-04. 10-03, the SRD's prone: R6, one flood, one wall until a hero knocked flat by an opportunity Slam stood up for half its speed -- the old Keeper's floods were heroes left lying through its turn, its backwash sweeping them in with no save; 0 of 300 old-profile seeds flood now, 2 of 61 did. The Keeper of now floods: the whole fights below)
    var LG = D.keeperLog, lgf = function (e) { return e && typeof e.round === 'number' && typeof e.turn === 'number' && 'actor' in e && 'action' in e && Array.isArray(e.targets) && Array.isArray(e.rolls) && 'result' in e && e.hpAfter && typeof e.hpAfter === 'object' && e.flags && ['flood', 'wall', 'swirl', 'frozen'].every(function (k) { return k in e.flags; }); };
    var lgcheck = function (what, wantActors) { var acts = {}; LG.forEach(function (e) { acts[e.actor] = 1; }); var tx = LG.text(), rolled = LG.filter(function (e) { return e.rolls.length; }).length, ends = LG.some(function (e) { return e.action === 'the fight ends'; });
      ok('the log, ' + what + ': ' + LG.length + ' lines (' + rolled + ' with rolls), actors ' + Object.keys(acts).join('/') + ', meta ' + JSON.stringify(LG.meta) + ', text ' + tx.length + ' chars, file ' + LG.filename(), LG.length > 10 && LG.every(lgf) && rolled > 3 && wantActors.every(function (a) { return acts[a]; }) && /^THE KEEPER/.test(tx) && tx.indexOf('roll:') > 0 && LG.meta.seed != null && LG.meta.level === 3 && /^keeper-seed\d+-L3\.txt$/.test(LG.filename()) && ends);
      var bad = []; for (var li = 1; li < LG.length; li++) { var a = LG[li - 1].hpAfter, b = LG[li].hpAfter, expl = LG[li].targets.concat([LG[li].actor]); Object.keys(b).forEach(function (n) { if (a[n] != null && a[n] !== b[n] && expl.indexOf(n) < 0) bad.push('L' + li + ' ' + n + ' ' + a[n] + '->' + b[n] + ' (' + LG[li].action + ')'); }); }
      ok('the log, ' + what + ': every HP change has a line that names who changed (' + (bad.length ? bad.slice(0, 3).join('; ') : 'none missing') + ')', !bad.length); };
    lgcheck('watched fight (class AI both sides)', ['The Keeper', 'Barley']); ok('the log, watched: mode ' + LG.meta.mode, LG.meta.mode === 'ai');
    Object.assign(D.keeper.CFG, { opener: true, openerDeep: true, visible: true, partyOpening: true, openingDrift: true, glow: true, hp: 160, wallRounds: 3, aiScript: 'lure', partyRetreat: true, retreatRounds: 3, stalemateBreak: true, drown: '1d8+1', suffocateDice: '1d6', suffocateBonus: 3, heldStruggle: true, deepDepth: 2, slamAtk: 6, sweepUpFree: false, slamDice: '3d4', swirlHit: true, slams: 2, waveDC: 15 }); // (the old=1 fight above set the old ones: back to the defaults)
    var KF2 = D.keeper.fight('?keeperfight&seed=102950&watch&lvl=3&hp=175&drown=2d6&ai=current&retreat=0'); D.battle = KF2; KF2.enter(); var kc = cardsOf(KF2), kg = 0, kv; while (KF2.co && kg++ < 400000) { var kr = KF2.co.next(kv); kv = undefined; if (kr.done) break; }
    var kt = kc.join('\n'), kn = function (re) { return (kt.match(re) || []).length; };
    ok('?keeperfight&seed=102950 drained (the settings before the lure, 175 HP, 2d6, the current AI: visible, glowing, the opening, the drift): ' + KF2.result + ' R' + KF2.round + ', floods ' + kn(/washed into the deep/g) + ', walls ' + kn(/(springs|raises) the Ice Wall/g) + ', holds broken ' + kn(/HOLD BREAKS/g), (KF2.result === 'won' || KF2.result === 'lost')); // (LOOSENED 10-06, Griz: "loosen": it ends -- the rest prints, unchecked; R9 with a flood and a hold broken became R8 with neither at c5cb4d8, the Stealth of 10-04, so the seed no longer plays the fight the notes name; the flood and the broken hold are checked on their own above)
    Object.assign(D.keeper.CFG, { hp: 160, drown: '1d8+1', aiScript: 'lure', partyRetreat: true }); // (the fight above ran on the settings before the lure: back to the defaults)
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
    force(false); put(HE[1], 8, 1); HE[1].conds.prone = false; HE[1].hp = HE[1].maxhp = 60; drain(K.flood(BE, kE, HE[1])); unforce(); RU.startTurn(kE); var e1 = idsE();
    ok('ring, a hero held: ' + e1, /ksuffocate/.test(e1) && /krise/.test(e1) && !/kslam/.test(e1) && !/kwave/.test(e1));
    HE[1].conds.restrained = null; delete HE[1].conds.restrained; drain(BE.exec(HE[1], { do: 'none' })); // a hero got free (any command runs the check)
    ok('the hero got free: the Keeper is back to the humanoid (flooding ' + !!kE.flooding + '), ring ' + idsE(), !kE.flooding && !/ksuffocate|krise/.test(idsE()));
    // D: the initiative bonus
    var iA = 0, iB = 0; K.CFG.initBonus = 0; for (var q0 = 0; q0 < 20; q0++) { D.seed = 100 + q0; var Bi = battle({ lvl: 3 }); Bi.o.noCards = 1; Bi.fight = Object.assign({}, Bi.fight, { noCards: true }); Bi.co.next(); iA += keeper(Bi).initRoll; } K.CFG.initBonus = 5; for (q0 = 0; q0 < 20; q0++) { D.seed = 100 + q0; var Bj = battle({ lvl: 3 }); Bj.fight = Object.assign({}, Bj.fight, { noCards: true }); Bj.co.next(); iB += keeper(Bj).initRoll; } K.CFG.initBonus = 0;
    ok('initiative bonus: Keeper rolls sum ' + iA + ' at +0, ' + iB + ' at +5 over 20 fights', iB - iA === 100);
    // F: the dead Keeper is not drawn; the pool is calm
    var BF = battle({ lvl: 3 }), kF = keeper(BF); kF.hp = 1; drain(BF.hurt(kF, 50, 'bludgeoning')); ok('the Keeper dead: ' + (kF.dead || kF.hp <= 0) + ', hidden ' + !!(kF.conds && kF.conds.hidden) + ', releasing ' + !kF.flooding, (kF.dead || kF.hp <= 0) && !kF.flooding);
    var lg = G.map.def.lights && G.map.def.lights[0], rn = K.at(G.map.def.geo.rune[0], G.map.def.geo.rune[1]), wallSq = G.map.at(rn[0], rn[1] - 1), floorSq = G.map.at(rn[0], rn[1]);
    ok('the rune is on DEEP16 grid square 12,7 (' + rn + ') and is a light there: ' + JSON.stringify(lg), lg && rn[0] === 12 && rn[1] === 7 && lg[0] === 12 && lg[1] === 7 && lg[3] === 'glow' && lg[2] <= 25);
    ok('the wall face the rune is on: the north wall at 12,6 is rock (' + (wallSq && !wallSq.open) + ') and the landing square 12,7 is floor (' + (floorSq && floorSq.open && floorSq.ch === '.') + '), the face toward +c (' + G.map.def.geo.runeFace + ')', wallSq && !wallSq.open && floorSq && floorSq.open && G.map.def.geo.runeFace === 'c+');
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
        // a second click: the Slam budget is two (the multiattack), so the click Slams again; the third is the card
        cards2.length = 0; e0 = thrown.length; var tSl = T.slamsLeft; mouse(toScreen(near), true); frame(4); settle(); var slam2 = /Slam/.test(cards2.join(' '));
        ok('click again: the second Slam of the multiattack (slamsLeft ' + tSl + ' -> ' + T.slamsLeft + ', ' + (slam2 ? 'a Slam card' : 'no Slam card') + '), no error', thrown.length === e0 && slam2 && T.slamsLeft === 0 && alive());
        cards2.length = 0; e0 = thrown.length; mouse(toScreen(near), true); frame(3);
        ok('click a third time, action spent: a card (' + cards2.join(' ').slice(0, 60) + '), no error', thrown.length === e0 && /spent/.test(cards2.join(' ')) && alive());
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
      fresh(); put(bar, 8, 1); put(lym, 8, 3); var pr = run({ do: 'kswirl' }, [4, 0]); // the ring's: the gold-square pick offers every hero; the second hero up the stair is no good (a card), then NOT NOW
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
      ok('hp=150 in the URL: the Keeper is ' + kH.hp + '/' + kH.maxhp, kH.hp === 150 && kH.maxhp === 150); K.CFG.hp = 160; // (the URL's setting is the page's: back to the default for the checks after)
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
      K.st(BL).opener = true; RU.startTurn(kL); drain(K.turn(BL, kL)); var slamsDone = cL.filter(function (c) { return /> .*Slam/.test(c) && /d20/.test(c); }).length;
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
      C.swirlAny = true; var BT = battle({ lvl: 3 }), kT = keeper(BT), HT = ours(BT); delete kT.conds.hidden; put(HT[0], 8, 5); put(kT, 8, 5, 2); RU.startTurn(kT); HT[0].hp = HT[0].maxhp = 60; drain(K.flood(BT, kT, HT[0])); var cT = cardsOf(BT); HT[0].hp = HT[0].maxhp = 40; K.drownTick(BT, HT[0]);
      ok('swirl=any: held on a flooded step it drowns still (hp ' + HT[0].hp + ', drowning ' + !!HT[0].conds.drowning + ')', HT[0].hp < 40 && !!HT[0].conds.drowning); C.swirlAny = save.sa;
      D.battle = B3;
    })();
    // ---- the Keeper's move pick (desk note 2, 10-03): his body is the 2x2 from the anchor; every one of the four squares has to be water he can be in
    (function () {
      var BP = battle({ lvl: 3 }), kP = keeper(BP), HP = ours(BP), cP = cardsOf(BP); BP.o.play = 'keeper'; delete kP.conds.hidden; HP.forEach(function (u) { delete u.conds.hidden; }); put(HP[0], 8, 12); put(HP[1], 9, 12); put(HP[2], 10, 12); put(HP[3], 7, 12);
      function run(cmd) { var g = BP.exec(kP, cmd), n = 0, v; while (n++ < 5000) { var r = g.next(v); v = undefined; if (r.done) break; if (r.value && r.value.prompt) v = 0; } }
      RU.startTurn(kP); kP.turn.move = 120; var W = D.keeperPlay, cats = {}, okAnchor = null, anchors = 0;
      var mapx = G.map; for (var ax = 0; ax < mapx.w; ax++) for (var ay = 0; ay < mapx.h; ay++) { var why = W.moveWhy(BP, kP, ax, ay), f = G.foot(kP, ax, ay); if (!f.every(function (q) { return mapx.at(q[0], q[1]); })) { cats.edge = (cats.edge || 0) + 1; continue; } var key = why ? (why.match(/dry landing|rock|Ice Wall|frozen|in the way|too far/) || ['other'])[0] : 'ok'; cats[key] = (cats[key] || 0) + 1; if (!why && !okAnchor && (ax !== kP.x || ay !== kP.y)) okAnchor = [ax, ay]; anchors++; }
      ok('the pick: every anchor is judged on its four squares (' + JSON.stringify(cats) + ')', cats.ok > 0 && cats['dry landing'] > 0);
      var allWater = okAnchor && G.foot(kP, okAnchor[0], okAnchor[1]).every(function (q) { var s = mapx.at(q[0], q[1]); return s && s.open && s.ch === '~'; });
      ok('a legal anchor (' + okAnchor + ') has all four squares in water', !!allWater);
      // a body that would overlap the dry landing: refused with a card, nothing spent, he does not move
      var land = null; for (var ay2 = 0; ay2 < mapx.h && !land; ay2++) for (var ax2 = 0; ax2 < mapx.w && !land; ax2++) { var w2 = W.moveWhy(BP, kP, ax2, ay2); if (/dry landing/.test(w2)) land = [ax2, ay2, w2]; }
      var kx = kP.x, ky = kP.y, mv0 = kP.turn.move; cP.length = 0; if (land) run({ do: 'move', x: land[0], y: land[1] });
      ok('a move whose body would overlap the dry landing (' + (land && land[0] + ',' + land[1]) + '): a card says why, he stays, the move is not spent (' + (cP.join(' ').match(/MOVE: [^.]*/) || ['no card'])[0].slice(0, 100) + ')', !!land && /MOVE: .*dry landing/.test(cP.join(' ')) && kP.x === kx && kP.y === ky && kP.turn.move === mv0);
      // the wall: a section over water
      var Sx = K.st(BP); Sx.rowOverride = 6; kP.reaction = 1; RU.startTurn(kP); kP.turn.move = 120; drain(K.castWall(BP, kP)); Sx.rowOverride = null; var wallAnchor = null;
      for (var ay3 = 0; ay3 < mapx.h && !wallAnchor; ay3++) for (var ax3 = 0; ax3 < mapx.w && !wallAnchor; ax3++) { var w3 = W.moveWhy(BP, kP, ax3, ay3); if (/Ice Wall/.test(w3)) wallAnchor = [ax3, ay3]; }
      ok('a body that would overlap the Ice Wall (at ' + (wallAnchor || 'none') + ') is refused: ' + (wallAnchor ? W.moveWhy(BP, kP, wallAnchor[0], wallAnchor[1]).slice(0, 70) : ''), !!wallAnchor);
      // frozen water
      var iceA = null; Sx.ice[iceKey(8, 4)] = true; for (var ay4 = 0; ay4 < mapx.h && !iceA; ay4++) for (var ax4 = 0; ax4 < mapx.w && !iceA; ax4++) { var w4 = W.moveWhy(BP, kP, ax4, ay4); if (/frozen/.test(w4)) iceA = [ax4, ay4]; } delete Sx.ice[iceKey(8, 4)];
      ok('a body that would overlap frozen water is refused (' + (iceA || 'none') + '), and the grid agrees (G.canStand: ' + (iceA ? (Sx.ice[iceKey(8, 4)] = true, G.canStand(kP, iceA[0], iceA[1])) : '-') + ')', !!iceA && !G.canStand(kP, iceA[0], iceA[1])); delete Sx.ice[iceKey(8, 4)];
      // a legal move works, and the log writes the anchor with the body implied
      Sx.wall = null; BP.walls = []; BP.wallMap = null; RU.startTurn(kP); kP.turn.move = 120; var okA2 = null; for (var ay5 = 0; ay5 < mapx.h && !okA2; ay5++) for (var ax5 = 0; ax5 < mapx.w && !okA2; ax5++) if (!W.moveWhy(BP, kP, ax5, ay5) && (ax5 !== kP.x || ay5 !== kP.y)) okA2 = [ax5, ay5];
      var nLog = D.keeperLog.length; run({ do: 'move', x: okA2[0], y: okA2[1] }); var mvLine = D.keeperLog.slice(nLog).filter(function (e) { return e.action === 'move'; })[0];
      ok('a legal move happens (' + kP.x + ',' + kP.y + ' = ' + okA2 + ') and the log line says the anchor and the implied 2x2 (' + (mvLine && mvLine.result.slice(0, 90)) + ')', kP.x === okA2[0] && kP.y === okA2[1] && mvLine && /anchor of its 2x2 body/.test(mvLine.result));
      // reach and distance read the whole body
      var f0 = G.foot(kP), ex = kP.x + 2, ey = kP.y + 1; put(HP[0], 8, 12); HP[0].x = ex; HP[0].y = ey; var d1 = G.dist(kP, HP[0]); HP[0].x = kP.x + 3; HP[0].y = kP.y + 1; var d2 = G.dist(kP, HP[0]); HP[0].x = kP.x + 1; HP[0].y = kP.y + 2; var d3 = G.dist(kP, HP[0]);
      ok('distance and reach use the 2x2: a hero beside the far side of the body is ' + d1 + ' ft, one a square further ' + d2 + ' ft, one beside the far corner ' + d3 + ' ft (reach ' + G.reachOf(kP, kP.reach) + ')', f0.length === 4 && d1 === 5 && d2 === 10 && d3 === 5);
      D.battle = B3;
    })();
    // ---- the gap in the log: an HP change between actions (a feature called straight from the AI, a rule) is a line of its own (desk note 3)
    (function () {
      var BQ = battle({ lvl: 3 }), HQ = ours(BQ), cQ = cardsOf(BQ), n0 = D.keeperLog.length; var lym = HQ[3], viv = HQ[2];
      viv.hp = 0; BQ.card(['{y}' + lym.name + '{/} lays on hands: {n}+15{/} to ' + viv.name + '. {g}(pool 0){/}']); viv.hp = 15; RU.startTurn(HQ[0]);
      var ln = D.keeperLog.slice(n0).filter(function (e) { return /between actions/.test(e.action); });
      ok('an HP change between actions gets its own line (' + ln.map(function (e) { return e.action + ' | ' + e.result.slice(0, 80); }).join(' // ') + ')', ln.length >= 1 && ln.some(function (e) { return e.targets.indexOf(viv.name) >= 0 && /lays on hands/.test(e.result) && e.actor === lym.name; }));
      D.battle = B3;
    })();
    // ---- the lazy sheets (js/sprites.js S.gate): a Keeper fight, its gallery, and a Pocket DM fight with the Keeper at the table ask for all three of its sheets; a late sheet is a capsule
    (function () {
      var want = ['keeper_p1', 'keeper_p2', 'keeper_p3'], BF = battle({ lvl: 3 }), got = (BF.sheetGate && BF.sheetGate.names) || [];
      var GBL = D.fxKeeper('?fxgallery&keeper'); D.battle = GBL; GBL.enter(); var gg = (GBL.sheetGate && GBL.sheetGate.names) || [];
      var PK = D.Battle ? new D.Battle({ fight: 'keeper', data: D.save.fixture(3), bench: true, pocket: true }) : null; PK.enter(); var pg = (PK.sheetGate && PK.sheetGate.names) || [];
      ok('the lazy sheets: a Keeper fight asks the gate for ' + got.filter(function (n) { return /keeper/.test(n); }) + ', the gallery ' + gg.filter(function (n) { return /keeper/.test(n); }) + ', the table ' + pg.filter(function (n) { return /keeper/.test(n); }), want.every(function (n) { return got.indexOf(n) >= 0 && gg.indexOf(n) >= 0 && pg.indexOf(n) >= 0; }));
      var cv = document.createElement('canvas'); cv.width = 80; cv.height = 80; var cx0 = cv.getContext('2d'), had = D.images, off = D.spr.offline; D.spr.offline = false; var sh0 = D.SHEETS.keeper_p2.image, saved = D.images[sh0]; delete D.images[sh0]; var e1 = ''; try { var h = D.spr.draw(cx0, 'keeper_p2', 'idle', 0, 0, 40, 60, {}); } catch (e) { e1 = String(e); } var painted = cx0.getImageData(0, 0, 80, 80).data.some(function (v, i) { return i % 4 === 3 && v > 0; }); if (saved) D.images[sh0] = saved; else delete D.images[sh0]; D.spr.offline = off;
      ok('a Keeper sheet that is late draws a capsule, not nothing (painted ' + painted + (e1 ? ', ERROR ' + e1 : '') + ')', painted && !e1);
      D.battle = B3;
    })();
    // ---- 10-03 adjustments: the backwash leaves them prone; the Slam attack bonus 6; Sanctuary as the SRD has it
    (function () {
      K.CFG.sweepUpFree = false; K.CFG.washNoWall = false;
      var BW = battle({ lvl: 3 }), kW = keeper(BW), HW = ours(BW), cW = cardsOf(BW); delete kW.conds.hidden; HW.forEach(function (u) { delete u.conds.hidden; });
      put(HW[0], 8, 9); put(HW[1], 9, 9); put(HW[2], 7, 9); put(HW[3], 10, 9); BW.kp = null; K.st(BW).rowOverride = null; kW.reaction = 1; drain(K.raiseWall(BW, kW, null)); RU.startTurn(kW); force(false); var yw = HW.map(function (u) { return K.A(u); }); drain(K.wave(BW, kW)); unforce();
      var sw = HW.filter(function (u, i) { return K.A(u) < yw[i]; });
      ok('the backwash leaves the swept prone (' + sw.map(function (u) { return u.name + (u.conds.prone ? ' prone' : ' up'); }) + '), the card says so', sw.length > 0 && sw.every(function (u) { return u.conds.prone; }) && /half the move to stand/.test(cW.join(' ')) && !/up free/.test(cW.join(' ')));
      K.CFG.sweepUpFree = true; var BW2 = battle({ lvl: 3 }), kW2 = keeper(BW2), HW2 = ours(BW2); delete kW2.conds.hidden; HW2.forEach(function (u) { delete u.conds.hidden; }); put(HW2[0], 8, 9); kW2.reaction = 1; drain(K.raiseWall(BW2, kW2, null)); RU.startTurn(kW2); force(false); drain(K.wave(BW2, kW2)); unforce();
      ok('upfree=1 (the old backwash): the swept stand up free (' + (HW2[0].conds.prone ? 'prone' : 'up') + ')', !HW2[0].conds.prone); K.CFG.sweepUpFree = false;
      var Bs = battle({ lvl: 3 }), ks = keeper(Bs); ok('the Slam attack bonus is ' + ks.attacks.slam.atk + ' (+' + ks.weapon.atk + ' on its stand-in), the old 5 behind CFG.slamAtk / &atk= / &old=1', ks.attacks.slam.atk === 6 && ks.weapon.atk === 6 && K.CFG.slamAtk === 6);
      // ---- Sanctuary: not concentration, not ended by a blow; the save before an attack; a new target or the attack lost; an area effect is not stopped; it ends when the warded attacks or casts at a foe
      var BS = battle({ lvl: 3 }), kS = keeper(BS), HS = ours(BS), cS = cardsOf(BS), M = D.magic; delete kS.conds.hidden; HS.forEach(function (u) { delete u.conds.hidden; }); var lym = HS[3], bar = HS[0], viv = HS[2], aur = HS[1];
      put(bar, 8, 6); put(viv, 8, 6); viv.x = bar.x; viv.y = bar.y; put(viv, 9, 6); put(aur, 7, 6); put(lym, 10, 10); lym.spellDC = 13; lym.known = (lym.known || []).concat(['sanctuary']); lym.slots = lym.slots || [3, 2, 0]; lym.slots[0] = Math.max(lym.slots[0], 2);
      RU.startTurn(lym); drain(M.cast(BS, lym, 'sanctuary', 1, bar));
      ok('Sanctuary on ' + bar.name + ': a ward (' + JSON.stringify(bar.conds.sanctuary) + '), and it is not concentration (Lymen conc ' + (lym.conc ? lym.conc.id : 'none') + ')', !!bar.conds.sanctuary && !lym.conc);
      var hpB = bar.hp; B_hit(kS, bar, 4); function B_hit(att, t, n) { drain(BS.hurt(t, n, 'bludgeoning')); }
      ok('a blow that lands on the warded does not end it, and no concentration check is made on it (ward ' + !!bar.conds.sanctuary + ', hp ' + hpB + ' -> ' + bar.hp + ')', !!bar.conds.sanctuary && !/holds .*\?/.test(cS.join(' ').split('Sanctuary')[1] || ''));
      var viv0 = viv.hp; lym.conc = { id: 'bless', name: 'Bless', undo: function () {} }; var sc = BS.cards ? 0 : 0; M.concCheck && 0; drain(BS.hurt(lym, 6, 'bludgeoning')); ok('(the concentration that Lymen does hold is another spell; Sanctuary is not on it: ward still ' + !!bar.conds.sanctuary + ')', !!bar.conds.sanctuary); delete lym.conc;
      // the save before the blow: it passes, the blow lands on the warded
      put(kS, 8, 5, 2); RU.startTurn(kS); kS.turn.action = 1; var hp1 = bar.hp; force(true); cS.length = 0; drain(BS.attack(kS, bar, kS.attacks.slam)); unforce();
      ok('the Keeper saves WIS and strikes the warded anyway (' + (cS.join(' ').match(/STRIKES ANYWAY|cannot bring itself/) || ['?'])[0] + '; ' + hp1 + ' -> ' + bar.hp + ')', /STRIKES ANYWAY/.test(cS.join(' ')));
      // failed: a new target, if another is in reach
      var near = HS.filter(function (u) { return u !== bar && G.dist(kS, u) <= 10; }), hpAll = HS.map(function (u) { return u.hp; }); cS.length = 0; force(false); var sv0 = RU.save; var fails = 0; RU.save = function (u, ab) { var r = save0.apply(this, arguments); if (ab === 'wis' && u === kS) r.ok = false; return r; };
      var Bb = bar.hp; drain(BS.attack(kS, bar, kS.attacks.slam)); RU.save = sv0; unforce();
      var hit = HS.filter(function (u, i) { return u.hp < hpAll[i]; }).map(function (u) { return u.name; }), txt = cS.join(' ');
      ok('the save fails: the Keeper turns on another foe in reach (' + near.map(function (u) { return u.name; }) + ' in reach; struck ' + hit + '; ' + (txt.match(/turns on [A-Za-z]+/) || ['no card'])[0] + ')', bar.hp === Bb && (near.length ? (/turns on/.test(txt) && hit.length >= 0 && hit.indexOf(bar.name) < 0) : /lost/.test(txt)));
      // none in reach: the attack is lost
      put(aur, 3, 12); put(viv, 4, 12); put(lym, 10, 12); put(kS, 8, 5, 2); cS.length = 0; var Bc = bar.hp; RU.save = function (u, ab) { var r = save0.apply(this, arguments); if (ab === 'wis' && u === kS) r.ok = false; return r; }; drain(BS.attack(kS, bar, kS.attacks.slam)); RU.save = sv0;
      ok('the save fails and no one else is in reach: the Slam is lost (' + (cS.join(' ').match(/no other target[^.]*/) || ['no card'])[0] + ', hp ' + Bc + ' -> ' + bar.hp + ')', bar.hp === Bc && /no other target|is lost/.test(cS.join(' ')));
      // an area effect does not ask the ward: the Wave
      put(bar, 8, 9); cS.length = 0; RU.startTurn(kS); force(false); drain(K.wave(BS, kS)); unforce();
      ok('the Wave (an area) does not ask the ward: Barley saves STR against it, no Sanctuary save (' + (/warded \(Sanctuary\)/.test(cS.join(' ')) ? 'ASKED' : 'not asked') + ', STR line ' + /Barley: STR/.test(cS.join(' ')) + ')', !/warded \(Sanctuary\)/.test(cS.join(' ')) && /Barley: STR/.test(cS.join(' ')));
      // it ends when the warded attacks, and when it casts at a foe
      bar.conds.sanctuary = { dc: 13, by: lym.id }; put(bar, 8, 6); put(kS, 8, 5, 2); RU.startTurn(bar); bar.turn.action = 1; bar.weapon = Object.assign({}, bar.weapon, { atk: 60 }); cS.length = 0; drain(BS.attack(bar, kS, bar.weapon));
      ok('the warded one attacks: the ward ends (' + !!bar.conds.sanctuary + ')', !bar.conds.sanctuary && /sanctuary ends/.test(cS.join(' ')));
      aur.conds.sanctuary = { dc: 13, by: lym.id }; aur.known = (aur.known || []).concat(['firebolt']); aur.spellAtk = 60; RU.startTurn(aur); put(aur, 8, 7); cS.length = 0; drain(M.cast(BS, aur, 'firebolt', 0, kS));
      ok('the warded one casts at a foe: the ward ends (' + !!aur.conds.sanctuary + ')', !aur.conds.sanctuary);
      // a harmful single-target spell at the warded: the save, then lost (the foe warded)
      var wk = D.keeper; kS.conds.sanctuary = { dc: 13, by: 'x' }; lym.known = (lym.known || []).concat(['sacredflame']); lym.spellDC = 13; put(lym, 8, 8); RU.startTurn(lym); cS.length = 0; var hk = kS.hp; RU.save = function (u, ab) { var r = save0.apply(this, arguments); if (ab === 'wis' && u === lym) r.ok = false; return r; }; drain(M.cast(BS, lym, 'sacredflame', 0, kS)); RU.save = sv0;
      ok('a harmful single-target spell at a warded foe: the caster saves WIS, fails, and the spell is lost (' + (cS.join(' ').match(/is lost|cannot bring itself/) || ['no card'])[0] + '; hp ' + hk + ' -> ' + kS.hp + ')', kS.hp === hk && /cannot bring itself/.test(cS.join(' ')));
      delete kS.conds.sanctuary; D.battle = B3;
    })();
    // ---- the turn's budget in play=keeper (desk, 10-03: click-Slams that did not seem to count): the click and the ring spend exactly the same
    (function () {
      var C = K.CFG, sv = { sl: C.slams }; C.slams = 2;
      function mk() { var B = battle({ lvl: 3 }), k = keeper(B), H = ours(B), c = cardsOf(B); B.o.play = 'keeper'; delete k.conds.hidden; H.forEach(function (u) { delete u.conds.hidden; }); put(H[0], 8, 6); put(H[1], 8, 7); RU.startTurn(k); return { B: B, k: k, H: H, c: c }; }
      function run(S, cmd, answers) { var g = S.B.exec(S.k, cmd), n = 0, v, an = (answers || []).slice(); while (n++ < 5000) { var r = g.next(v); v = undefined; if (r.done) break; if (r.value && r.value.prompt) v = an.length ? an.shift() : 0; } }
      function state(k) { var T = k.turn; return JSON.stringify({ a: T.action, b: T.bonus, m: T.move, sl: T.slamsLeft == null ? null : T.slamsLeft, r: k.reaction }); }
      function slams(S) { return S.c.filter(function (x) { return /> .*Slam/.test(x) && /d20/.test(x); }).length; }
      // the click, five times: exactly two attacks, then the card
      var S1 = mk(), s0 = state(S1.k), states = []; for (var i = 0; i < 5; i++) { S1.c.length = 0; var before = slams(S1); run(S1, { do: 'attack', target: S1.H[i % 2] }); states.push(state(S1.k) + (/spent/.test(S1.c.join(' ')) ? ' [spent card]' : '')); }
      var n1 = D.keeperLog.filter(function (e) { return /^(attack|kslam)/.test(e.action) && e.actor === 'The Keeper' && e.rolls.length; }).length;
      ok('click Slam x5 with a budget of two: states ' + states.join(' | ') + ' (start ' + s0 + ')', states[0].indexOf('"a":0') > 0 && states[0].indexOf('"sl":1') > 0 && states[1].indexOf('"sl":0') > 0 && states[2].indexOf('[spent card]') > 0 && states[4].indexOf('[spent card]') > 0 && states[1] === states[2].replace(' [spent card]', '') && states[3].replace(' [spent card]', '') === states[1]);
      // count the attacks that resolved (from the log): the two, no more
      var S2 = mk(), nl0 = D.keeperLog.length; for (var j = 0; j < 5; j++) run(S2, { do: 'attack', target: S2.H[j % 2] });
      var done2 = D.keeperLog.slice(nl0).filter(function (e) { return /^(attack|kslam)$/.test(e.action) && e.actor === S2.k.name && e.rolls.length; }).length;
      ok('click Slam x5: exactly ' + done2 + ' Slam attacks resolved (the budget is ' + C.slams + ')', done2 === 2);
      // the ring's: the same two, the same state
      var S3 = mk(), nl3 = D.keeperLog.length, st3 = []; for (var q = 0; q < 5; q++) { run(S3, { do: 'kslam', target: S3.H[q % 2] }); st3.push(state(S3.k)); }
      var done3 = D.keeperLog.slice(nl3).filter(function (e) { return /^(attack|kslam)$/.test(e.action) && e.actor === S3.k.name && e.rolls.length; }).length;
      ok('the ring Slam x5: ' + done3 + ' resolved, the same turn state as the click (' + st3[1] + ' vs ' + states[1].replace(' [spent card]', '') + ')', done3 === 2 && st3[1] === states[1].replace(' [spent card]', '') && st3[4] === st3[1]);
      // mixed: one click and one ring, then nothing
      var S4 = mk(), nl4 = D.keeperLog.length; run(S4, { do: 'attack', target: S4.H[0] }); run(S4, { do: 'kslam', target: S4.H[1] }); run(S4, { do: 'attack', target: S4.H[0] }); run(S4, { do: 'kslam', target: S4.H[1] });
      ok('a click and a ring Slam share the one budget (' + D.keeperLog.slice(nl4).filter(function (e) { return /^(attack|kslam)$/.test(e.action) && e.rolls.length; }).length + ' resolved)', D.keeperLog.slice(nl4).filter(function (e) { return /^(attack|kslam)$/.test(e.action) && e.rolls.length; }).length === 2);
      // the action spent on something else: the click refuses
      var S5 = mk(); run(S5, { do: 'kcast' }); var nl5 = D.keeperLog.length; S5.c.length = 0; run(S5, { do: 'attack', target: S5.H[0] });
      ok('after the action went on the wall (CAST), the click Slam is refused with "action is spent" (' + state(S5.k) + ')', /action is spent/.test(S5.c.join(' ')) && D.keeperLog.slice(nl5).filter(function (e) { return /^(attack|kslam)$/.test(e.action) && e.rolls.length; }).length === 0);
      // the wave is the bonus action: once; the click Slam then still has the action
      var S6 = mk(); force(false); run(S6, { do: 'kwave' }); unforce(); var b1 = S6.k.turn.bonus; run(S6, { do: 'kwave' }); S6.c.length = 0;
      ok('the Wave spends the bonus action (' + b1 + ') and not the action (' + S6.k.turn.action + '); a second Wave is refused', b1 === 0 && S6.k.turn.action === 1);
      // in the swirl: the click Slam refuses and says why; the ring offers no Slam; Active Suffocation is a bonus action
      var S7 = mk(); put(S7.H[0], 8, 1); run(S7, { do: 'kswirl', target: S7.H[0] }); var nl7 = D.keeperLog.length; RU.startTurn(S7.k); S7.c.length = 0; put(S7.H[1], 8, 2);
      var ids7 = D.keeperPlay.entries(S7.B, S7.k).map(function (e) { return e.id; }).join(','), st7 = state(S7.k); run(S7, { do: 'attack', target: S7.H[1] });
      ok('in the swirl: the click Slam is refused (' + (S7.c.join(' ').match(/LET GO[^.]*/) || ['no card'])[0] + '), nothing resolves, the turn state is as it was (' + (state(S7.k) === st7) + '), the ring offers ' + ids7, /LET GO/.test(S7.c.join(' ')) && D.keeperLog.slice(nl7).filter(function (e) { return /^(attack|kslam)$/.test(e.action) && e.rolls.length; }).length === 0 && state(S7.k) === st7 && !/kslam/.test(ids7) && /ksuffocate/.test(ids7));
      var bonus0 = S7.k.turn.bonus; run(S7, { do: 'ksuffocate' });
      ok('Active Suffocation costs the bonus action (' + bonus0 + ' -> ' + S7.k.turn.bonus + '), not the action (' + S7.k.turn.action + '), once a turn', bonus0 === 1 && S7.k.turn.bonus === 0 && S7.k.turn.action === 1 && !D.keeperPlay.entries(S7.B, S7.k).filter(function (e) { return e.id === 'ksuffocate'; })[0].ok);
      // the opportunity attack: the reaction, once, and one Slam (not the multiattack)
      var S8 = mk(), mover = S8.H[0]; put(mover, 8, 6); RU.startTurn(mover); mover.turn.move = 30; S8.k.reaction = 1; var nl8 = D.keeperLog.length; K.CFG.oaWave = false; drain(S8.B.moveAlong(mover, [sq(8, 7), sq(8, 8)], { spend: true }));
      var oa = D.keeperLog.slice(nl8).filter(function (e) { return /Slam/.test(e.action + e.result) && e.rolls.length; }).length;
      ok('the opportunity attack is the reaction: one Slam (' + oa + '), the reaction spent (' + S8.k.reaction + ')', oa <= 1 && (oa === 0 || S8.k.reaction === 0));
      C.slams = sv.sl; D.battle = B3;
    })();
    // ---- THE LADDER'S FIGHT IS MAIN'S OLD ONE, UNCHANGED (10-03, Griz): its foe, map, sheet and fight record diffed against origin/main's as it stood before the Keeper work landed
    // (window.KEEPER_MAIN: dev/keeper-probe.py reads them with git at a pinned commit, main=<ref> another), the rung, and ladder fights run through with none of the new Keeper in them.
    // The 8-bit's stair, the gallery and the play modes are the new one (Griz: "the cool keeper fight isn't for the ladders, they have to play the real game")
    (function () {
      var M = window.KEEPER_MAIN || {}, cfg0 = JSON.stringify(K.CFG);
      function diffs(a, b, p, out) { // (every path where the two differ: 'attacks.constrict.dice: "1d6" vs "1d8"')
        out = out || [];
        if (a === b) return out;
        if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) {
          Object.keys(a).concat(Object.keys(b)).filter(function (k, i, all) { return all.indexOf(k) === i; }).forEach(function (k) { diffs(a[k], b[k], p ? p + '.' + k : k, out); });
          return out;
        }
        out.push((p || '(the whole)') + ': ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b)); return out;
      }
      function said(d) { return d.length ? d.length + ' differ: ' + d.slice(0, 3).join('; ') : 'none differ'; }
      ok('origin/main\'s records read at ' + M.ref + ' (foe ' + !!M.foe + ', map ' + !!M.map + ', fight ' + !!M.fight + ', sheet ' + !!M.sheet + ', rung ' + !!M.rung3 + (M.err ? ', ' + M.err : '') + ')', !M.err && M.foe && M.map && M.fight && M.sheet && M.rung3);
      var FO = D.FOES.keeperold, df = diffs(FO, M.foe);
      ok('the ladder\'s foe (foes.js keeperold) against main\'s keeper, field for field: ' + said(df) + ' (' + FO.hp + ' HP, ' + Object.keys(FO.attacks).join(' and ') + ', ' + FO.sheet + ')', !df.length && FO.hp === 58 && FO.attacks.constrict && FO.attacks.drown && FO.sheet === 'keeper_p1');
      var MO = D.MAPS['floodstair-old'], dm = diffs(MO, M.map);
      ok('the ladder\'s map (floodstair-old) against main\'s floodstair: ' + said(dm) + '; its rows ' + (M.map && MO.rows.join('/') === M.map.rows.join('/') ? 'the same, ' + MO.rows.length + ' of them' : 'NOT the same') + ', no geo, no rune light (' + !MO.geo + ', ' + !MO.lights + ')', !dm.length && M.map && MO.rows.join('/') === M.map.rows.join('/') && !MO.geo && !MO.lights);
      var FL = D.fight('keeper-ladder'), asMain = Object.assign({}, FL, { id: 'keeper', map: 'floodstair', foes: FL.foes.map(function (f) { return Object.assign({}, f, { kind: f.kind === 'keeperold' ? 'keeper' : f.kind }); }) }), dfl = diffs(asMain, M.fight);
      ok('the ladder\'s fight (keeper-ladder) against main\'s keeper fight, its id, map and foe kind read as main\'s: ' + said(dfl), FL.id === 'keeper-ladder' && FL.map === 'floodstair-old' && FL.foes[0].kind === 'keeperold' && !dfl.length);
      var ds = diffs(D.SHEETS.keeper_p1, M.sheet);
      ok('its art (sprites.js keeper_p1, the snake stand-in) against main\'s: ' + said(ds) + ' (' + (D.SHEETS.keeper_p1 || {}).image + ')', !ds.length);
      var rung = D.fightsAt(3).map(function (f) { return f.id; }), read = rung.map(function (id) { return id === 'keeper-ladder' ? 'keeper' : id; });
      ok('the level-3 rung, keeper-ladder in the old keeper\'s place, is main\'s (' + rung.join(',') + ' / main ' + (M.rung3 || []).join(',') + ')', rung.indexOf('keeper') < 0 && rung.indexOf('keeper-ladder') >= 0 && read.join() === (M.rung3 || []).join());
      // the ladder's battle: the old foe on the old stair, the party at main's entry, and nothing of js/keeper.js set
      var BL = new D.Battle({ ladder: true, fight: 'keeper-ladder', bench: true }); D.battle = BL; BL.enter();
      var kL = BL.units.filter(function (u) { return u.kind === 'keeperold'; })[0], HL = ours(BL), sh = BL.sheets(), lit = D.light.carried(kL).filter(function (l) { return l.kind === 'keeperglow'; });
      ok('the ladder\'s battle: ' + kL.name + ' (' + kL.kind + ') ' + kL.hp + '/' + kL.maxhp + ' HP, AC ' + RU.ac(kL) + ', ' + Object.keys(kL.attacks).join(' and ') + ', sheet ' + kL.sheet + ', hidden ' + !!kL.conds.hidden + ', no Slam stand-in (' + !kL.weapon + '), no new Keeper on the field (' + !keeper(BL) + ')',
        kL.hp === 58 && kL.maxhp === 58 && RU.ac(kL) === 13 && kL.sheet === 'keeper_p1' && !!kL.conds.hidden && !kL.weapon && !keeper(BL) && !diffs(kL.attacks, M.foe.attacks).length && kL.multi.join() === 'constrict,drown');
      ok('on the old stair: ' + (G.map.def === MO) + ', the rows main\'s (' + (G.map.def.rows.join('/') === M.map.rows.join('/')) + '), the four at main\'s entry ' + HL.map(function (u) { return u.x + ',' + u.y; }).join(' ') + ', the gate asks ' + sh.now.filter(function (n) { return /^keeper/.test(n); }).join(',') + ', no glow (' + lit.length + '), the Keeper\'s settings untouched (' + (JSON.stringify(K.CFG) === cfg0) + '), not a Keeper fight to js/keeper.js (' + !K.isFight(BL.fight) + ')',
        G.map.def === MO && G.map.def.rows.join('/') === M.map.rows.join('/') && HL.every(function (u, i) { return u.x === MO.entry[i][0] && u.y === MO.entry[i][1]; }) && sh.now.indexOf('keeper_p1') >= 0 && sh.now.indexOf('keeper_p2') < 0 && sh.now.indexOf('keeper_p3') < 0 && !lit.length && JSON.stringify(K.CFG) === cfg0 && !K.isFight(BL.fight));
      // four ladder fights to their end by the class AI: the old Keeper's grip and drag, and none of the new one's wave, wall, Slam, swirl or log
      var res = [], txt = '', kpSet = 0, drn = 0, log0 = D.keeperLog.meta && D.keeperLog.meta.fight;
      for (var f = 0; f < 4; f++) {
        D.seed = (f + 1) * 7919 + 3; var BF = new D.Battle({ ladder: true, fight: 'keeper-ladder', bench: true }); D.battle = BF; BF.enter(); var cF = cardsOf(BF);
        BF.units.forEach(function (u) { if (u.side === 'party' && !u.familiar) { u.guest = true; u.classAI = true; } }); BF.heroTurn = function* (u) { yield* D.ai.turn(this, u); };
        var gn = 0, vv; while (BF.co && gn++ < 400000) { var rr; try { rr = BF.co.next(vv); } catch (e) { errs.push('ladder: ' + String(e && e.stack || e).slice(0, 400)); break; } vv = undefined; if (rr.done) break; if (rr.value && rr.value.prompt) vv = rr.value.prompt.opts[0].value; if (BF.units.some(function (u) { return u.conds && u.conds.drowning; })) drn++; }
        res.push(BF.result + ' R' + BF.round); txt += cF.join('\n') + '\n'; if (BF.kp) kpSet++;
      }
      var newWords = txt.match(/sends a wave|Ice Wall|\bSlam\b|swirl|SUFFOCATION|washed into the deep|STALEMATE|KNOCKED PRONE/g) || [];
      ok('four ladder fights to the end (' + res.join(', ') + '): Constrict ' + (txt.match(/Constrict/g) || []).length + ', Drag Under ' + (txt.match(/Drag Under/g) || []).length + '; of the new Keeper: ' + (newWords.length ? newWords.slice(0, 4).join(', ') : 'nothing') + ', its state ' + kpSet + ', its drowning ' + drn + ', its log ' + (D.keeperLog.meta && D.keeperLog.meta.fight === 'keeper-ladder' ? 'kept' : 'not kept'),
        res.every(function (r) { return /^(won|lost) /.test(r); }) && /Constrict/.test(txt) && !newWords.length && !kpSet && !drn && !(D.keeperLog.meta && D.keeperLog.meta.fight === 'keeper-ladder') && (D.keeperLog.meta && D.keeperLog.meta.fight) === log0);
      // the Pocket DM keeps both Keepers out of its pot (PK.NAMED_OUT), on a map with water; the ladder's copy of the stair is not on its list of maps
      var PK = D.pocket, pot = PK.pot(['barley', 'aurdin', 'vivian', 'lymen'], 'floodstair'), mids = D.Pocket.prototype.mapIds.call({});
      ok('the Pocket DM: NAMED_OUT ' + JSON.stringify(PK.NAMED_OUT) + '; its pot on the Flooded Stair (' + pot.length + ' kinds, the water\'s own in it: ' + pot.filter(function (k) { return D.FOES[k].bound; }).join(',') + ') holds neither Keeper; its maps have floodstair (' + (mids.indexOf('floodstair') >= 0) + ') and not floodstair-old (' + (mids.indexOf('floodstair-old') < 0) + ')',
        PK.NAMED_OUT.indexOf('keeper') >= 0 && PK.NAMED_OUT.indexOf('keeperold') >= 0 && pot.indexOf('keeper') < 0 && pot.indexOf('keeperold') < 0 && pot.length > 0 && mids.indexOf('floodstair') >= 0 && mids.indexOf('floodstair-old') < 0);
      // the 8-bit's stair (events.js deep16: 'keeper', through the embed): the new one
      var BE = new D.Battle({ embed: { start: 'ledge' }, fight: 'keeper', data: D.save.fixture(3), bench: true }); D.battle = BE; BE.enter(); var kE = keeper(BE);
      ok('the 8-bit\'s stair loads the NEW Keeper: ' + kE.hp + ' HP, Slam ' + kE.attacks.slam.dice + ' atk ' + kE.attacks.slam.atk + ', ' + K.CFG.slams + ' Slams, Wave DC ' + K.CFG.waveDC + ', hidden ' + !!kE.conds.hidden + ', glow ' + K.CFG.glow + ', sheet ' + kE.sheet + ', the new hall (' + !!G.map.def.geo + ')', kE.hp === 160 && kE.attacks.slam.dice === '3d4' && kE.attacks.slam.atk === 6 && K.CFG.slams === 2 && K.CFG.waveDC === 15 && !kE.conds.hidden && K.CFG.glow && kE.sheet === 'keeper_p2' && G.map.def === D.MAPS.floodstair);
      var BG = D.keeper.fight('?keeperfight&play=party&lvl=3'); D.battle = BG; BG.enter();
      ok('the play modes and the gallery are the new one (' + keeper(BG).hp + ' HP, fight ' + BG.fight.id + ')', keeper(BG).hp === 160 && BG.fight.id === 'keeper');
      Object.assign(K.CFG, JSON.parse(cfg0)); D.battle = B3;
    })();
    // ---- THE TWO WAYS IN (10-03, Griz): WADE IN starts the fight with the party ON THE LEDGE (geo.entry, the water's edge); a hand on the mark starts it BY THE RUNE (geo.entryRune,
    // the landing squares beside it) -- the 8-bit scene names it (embed start), ?keeperfight&start=, the bench's o.start; the party's opening holds either
    (function () {
      var cfg0 = JSON.stringify(K.CFG), FS = D.MAPS.floodstair, gm = FS.geo, sx = function (u) { return u.x + ',' + u.y; };
      function spawn(o) { var Bx = new D.Battle(Object.assign({ fight: 'keeper', data: D.save.fixture(3), bench: true }, o)); D.battle = Bx; Bx.enter(); return Bx; }
      function at(H, sqs) { return H.every(function (u, i) { return u.x === sqs[i][0] && u.y === sqs[i][1]; }); }
      var rr = FS.entryRune, BR = spawn({ embed: { start: 'rune' } }), HR = ours(BR);
      var laned = rr.length === gm.entryRune.length && rr.every(function (e, i) { var o = D.laneAt(FS, gm.entryRune[i][0], gm.entryRune[i][1]); return e[0] === o[0] && e[1] === o[1]; });
      var dry = rr.every(function (e) { var q = G.map.at(e[0], e[1]), a = K.A({ x: e[0], y: e[1] }); return q && q.walk && q.ch !== '~' && a >= gm.a[1] - 3 && a <= gm.a[1]; });
      var near = gm.entryRune.every(function (e) { return Math.max(Math.abs(e[0] - gm.rune[0]), Math.abs(e[1] - gm.rune[1])) <= 2; });
      ok('the rune\'s squares: geo.entryRune ' + JSON.stringify(gm.entryRune) + ' -> the map ' + JSON.stringify(rr) + ' by D16.laneAt (' + laned + '), all dry landing (' + dry + '), within 10 ft of the rune ' + JSON.stringify(gm.rune) + ' (' + near + ')', laned && dry && near && rr.length === 5);
      ok('a hand on the mark (the embed\'s start: rune): the four begin by the rune, ' + HR.map(sx).join(' ') + ' (along ' + HR.map(function (u) { return K.A(u); }).join(',') + '; startAt ' + BR.startAt + ')', BR.startAt === 'rune' && at(HR, rr) && G.map.def === FS);
      var BW = spawn({ embed: { start: 'ledge' } }), HW = ours(BW), en = FS.entry;
      ok('WADE IN (the embed\'s start: ledge): the four begin on the ledge at the water\'s edge, ' + HW.map(sx).join(' ') + ' (along ' + HW.map(function (u) { return K.A(u); }).join(',') + ')', BW.startAt === null && at(HW, en) && HW.every(function (u) { return K.A(u) === gm.a[1] - 3 && G.map.at(u.x, u.y).ch !== '~'; }));
      var BN = spawn({ embed: {} });
      ok('no start named (an 8-bit page from before): the ledge, as before (' + ours(BN).map(sx).join(' ') + ')', at(ours(BN), en));
      var BU = D.keeper.fight('?keeperfight&watch&start=rune&lvl=3'); D.battle = BU; BU.enter(); var hd = D.keeperLog.text().split('\n')[1] || '';
      ok('?keeperfight&start=rune: by the rune (' + ours(BU).map(sx).join(' ') + '); the log\'s header says where they came in ("' + hd + '")', at(ours(BU), rr) && /, start rune\b/.test(hd));
      BW = spawn({ start: 'ledge' }); hd = D.keeperLog.text().split('\n')[1] || '';
      ok('... and a ledge fight\'s header says ledge ("' + hd + '")', /, start ledge\b/.test(hd));
      // the party's opening from the rune (K.opened, the drift): before the Keeper strikes, each hero's turn holds -- no step, no action, no drift (they are past the drift's
      // last row, the one below the wall); struck, they engage. (From the ledge the same is checked above, the drift a square a round toward the rune.)
      var BO = spawn({ start: 'rune' }), kO = keeper(BO), HO = ours(BO), chO = cardsOf(BO); HO.forEach(function (u) { u.guest = true; u.classAI = true; }); putK(kO);
      var held = HO.map(function (u) { var x = u.x, y = u.y; RU.startTurn(u); drain(D.tactics.turn(BO, u)); return u.x === x && u.y === y && u.turn.action === 1; });
      ok('the opening by the rune: every hero holds its square on its turn before it is struck (' + held.join(',') + '), no drift (' + K.st(BO).driftRound + '), nothing done (' + chO.length + ' cards), still unopened (' + !K.opened(BO) + ')', held.every(Boolean) && K.st(BO).driftRound == null && !chO.length && !K.opened(BO));
      var u0 = HO[0], x0 = u0.x, y0 = u0.y; kO.hp -= 5; RU.startTurn(u0); drain(D.tactics.turn(BO, u0));
      ok('... and engages once the Keeper is hurt (opened ' + K.opened(BO) + ', ' + u0.name + ' moved or acted: ' + (u0.turn.action === 0 || u0.x !== x0 || u0.y !== y0) + ')', K.opened(BO) && (u0.turn.action === 0 || u0.x !== x0 || u0.y !== y0));
      Object.assign(K.CFG, JSON.parse(cfg0)); D.battle = B3;
    })();
    // ---- 10-03 (the desk): every pose that is set is cleared; the deep is the first two steps; the rune's face
    (function () {
      var BA = battle({ lvl: 3 }), kA = keeper(BA), HA = ours(BA); BA.o.play = 'keeper'; delete kA.conds.hidden; HA.forEach(function (u) { delete u.conds.hidden; });
      function runA(cmd) { var g = BA.exec(kA, cmd), n = 0, v; while (n++ < 5000) { var r = g.next(v); v = undefined; if (r.done) break; if (r.value && r.value.prompt) v = 0; } }
      put(HA[0], 8, 9); put(HA[1], 9, 9); RU.startTurn(kA); runA({ do: 'kready' }); var aR = kA.anim;
      var ev = HA[0]; RU.startTurn(ev); ev.turn.move = 30; kA.anim = 'idle'; drain(BA.moveAlong(ev, [sq(8, 10)], { spend: true }));
      ok('the readied wall springs and the Keeper is back to the standing idle (wall ' + !!BA.kp.wall + ', after READY ' + aR + ', after the spring ' + kA.anim + ')', !!BA.kp.wall && aR === 'idle' && kA.anim === 'idle');
      var BB = battle({ lvl: 3 }), kB = keeper(BB), HB = ours(BB); BB.o.play = 'keeper'; delete kB.conds.hidden; HB.forEach(function (u) { delete u.conds.hidden; }); put(HB[0], 8, 6); RU.startTurn(kB);
      var runB = function (cmd) { var g = BB.exec(kB, cmd), n = 0, v; while (n++ < 5000) { var r = g.next(v); v = undefined; if (r.done) break; if (r.value && r.value.prompt) v = 0; } };
      var after = {}; ['kcast', 'kwave', 'kslam'].forEach(function (id) { RU.startTurn(kB); kB.anim = 'wall'; force(false); runB({ do: id, target: HB[0] }); unforce(); after[id] = kB.anim; });
      ok('after CAST, the Wave and the Slam from the ring the Keeper is idle (' + JSON.stringify(after) + ')', Object.keys(after).every(function (k) { return after[k] === 'idle'; }));
      var BO = battle({ lvl: 3 }), kO = keeper(BO), HO = ours(BO); delete kO.conds.hidden; HO.forEach(function (u) { delete u.conds.hidden; }); put(HO[0], 8, 6); RU.startTurn(HO[0]); HO[0].turn.move = 30; kO.reaction = 1; kO.anim = 'attack'; drain(BO.moveAlong(HO[0], [sq(8, 7), sq(8, 8)], { spend: true }));
      ok('after an opportunity attack the Keeper is idle (' + kO.anim + ', reaction ' + kO.reaction + ')', kO.anim === 'idle' || kO.reaction === 1);
      // the swirl's deep: the first two steps (default), only the last with deepDepth 1
      var BD = battle({ lvl: 3 }), kD = keeper(BD), HD = ours(BD); BD.o.play = 'keeper'; delete kD.conds.hidden; RU.startTurn(kD); put(HD[0], 8, 2); put(HD[1], 8, 3); var C = K.CFG, d0 = C.deepDepth;
      var wA = D.keeperPlay.swirlWhy(BD, kD, HD[0]), wB = D.keeperPlay.swirlWhy(BD, kD, HD[1]); C.deepDepth = 1; var wC = D.keeperPlay.swirlWhy(BD, kD, HD[0]), wE = deepL(8, 1) && !deepL(8, 2); C.deepDepth = d0;
      ok('the deep is along 1 and 2: along 2 swirlable ("' + wA + '"), along 3 not ("' + wB.slice(0, 40) + '"); with deepDepth 1 along 2 is refused ("' + wC.slice(0, 40) + '")', wA === '' && !!wB && !!wC && wE);
      var BW2 = battle({ lvl: 3 }), kW = keeper(BW2), HW = ours(BW2); delete kW.conds.hidden; HW.forEach(function (u) { delete u.conds.hidden; }); put(HW[0], 8, 4); HW[0].conds.prone = true; BW2.kp = null; K.st(BW2); kW.reaction = 1; drain(K.raiseWall(BW2, kW, null)); put(HW[0], 8, 4); HW[0].conds.prone = true; force(false); RU.startTurn(kW); drain(K.wave(BW2, kW)); unforce();
      ok('a hero swept from along 4 lands on along ' + K.A(HW[0]) + ' and is washed into the deep (flooding ' + !!kW.flooding + ')', K.A(HW[0]) <= 2 && !!kW.flooding);
      D.battle = B3;
    })();
    // ---- 10-03 (Griz): the drowning is 2d6 less CON; Active Suffocation does 1d6+3 at once and doubles the next; a held hero only struggles
    (function () {
      var BH2 = battle({ lvl: 3 }), kH2 = keeper(BH2), HH = ours(BH2), cH = cardsOf(BH2); BH2.o.play = 'keeper'; delete kH2.conds.hidden; HH.forEach(function (u) { delete u.conds.hidden; });
      var bar = HH[0], aur = HH[1]; put(bar, 8, 1); RU.startTurn(kH2); force(false); bar.hp = bar.maxhp = 60; drain(K.flood(BH2, kH2, bar)); unforce(); bar.hp = bar.maxhp = 60; kH2.turn.bonus = 1;
      var hp0 = bar.hp; cH.length = 0; drain(K.suffocate(BH2, kH2, bar)); var dmg = hp0 - bar.hp;
      ok('Active Suffocation: ' + dmg + ' at once (1d6+3, 4 to 9), the next drowning doubled (' + !!bar.conds.drowning.twice + '), a bonus action (' + kH2.turn.bonus + ')', dmg >= 4 && dmg <= 9 && bar.conds.drowning.twice === true && kH2.turn.bonus === 0);
      var rolls = []; for (var i = 0; i < 300; i++) { bar.hp = 60; bar.conds.drowning = { by: kH2.id, twice: false }; K.drownTick(BH2, bar); rolls.push(60 - bar.hp); } var mx = Math.max.apply(null, rolls), mean = rolls.reduce(function (a, b) { return a + b; }, 0) / rolls.length;
      ok('the drowning is 1d8+1 less CON (Barley +' + D.mod(bar.abil.con) + '): up to ' + mx + ', mean ' + mean.toFixed(1) + ' over 300 (1d6 was 1.5)', mx >= 5 && mx <= 6 && mean > 2.3);
      // struggle only
      RU.startTurn(bar); bar.conds.restrained = { by: kH2.id, dc: 13, water: true, grapple: true }; var kh0 = kH2.hp; cH.length = 0; put(kH2, 8, 3, 2); drain(BH2.exec(bar, { do: 'attack', target: kH2 })); var cmdOK = BH2.commands(bar).filter(function (e) { return e.id === 'attack'; })[0];
      ok('a held hero cannot attack (a card, the Keeper unhurt ' + kH2.hp + ' of ' + kh0 + ', the ring greys it: ' + (cmdOK && cmdOK.why) + '); BREAK FREE is on offer (' + BH2.commands(bar).filter(function (e) { return e.id === 'breakfree'; })[0].ok + ')', /held in the swirl/.test(cH.join(' ')) && kH2.hp === kh0 && cmdOK && !cmdOK.ok && BH2.commands(bar).filter(function (e) { return e.id === 'breakfree'; })[0].ok);
      var acts = bar.turn.action; bar.guest = true; bar.classAI = true; cH.length = 0; drain(D.tactics.turn(BH2, bar));
      ok('the AI hero held in the swirl struggles: the action went (' + acts + ' -> ' + bar.turn.action + '), a break-free try (' + (cH.join(' ').match(/BREAK|break free|escape|ESCAPE[^.]*/i) || ['no card'])[0].slice(0, 60) + '), no blow at the Keeper (' + kH2.hp + ')', bar.turn.action === 0 && kH2.hp === kh0);
      K.CFG.heldStruggle = false; RU.startTurn(bar); bar.conds.restrained = { by: kH2.id, dc: 13, water: true, grapple: true }; bar.weapon = Object.assign({}, bar.weapon, { atk: 60 }); cH.length = 0; drain(BH2.exec(bar, { do: 'attack', target: kH2 }));
      ok('heldStruggle false (the old): the held hero attacks (the Keeper ' + kH2.hp + ' of ' + kh0 + ')', kH2.hp < kh0 || /Threshing|Flail|MISS|HIT/.test(cH.join(' '))); K.CFG.heldStruggle = true;
      D.battle = B3;
    })();
    // ---- 10-03 (Griz): the swirl itself is 1d6+3 and one drowning roll; the log header carries the settings so playtests compare by them
    (function () {
      var BW = battle({ lvl: 3 }), kW = keeper(BW), HW = ours(BW), cW = cardsOf(BW); delete kW.conds.hidden; var v = HW[0]; put(v, 8, 1); v.hp = v.maxhp = 60; RU.startTurn(kW); force(false); var n0 = D.keeperLog.length; drain(K.flood(BW, kW, v)); unforce();
      var lost = 60 - v.hp, txt = cW.join(' ');
      ok('the swirl itself: ' + lost + ' lost at once (1d6+3 is 4 to 9, then a 2d6 less CON roll, 1 to 12: 5 to 21) -- ' + (txt.match(/closes on [^,]*\{?[^,]*/) || ['no card'])[0].slice(0, 70) + ', and a drowning card ' + /drowns/.test(txt), lost >= 5 && lost <= 21 && /closes on/.test(txt) && /drowns/.test(txt));
      K.CFG.swirlHit = false; var BX = battle({ lvl: 3 }), kX = keeper(BX), HX = ours(BX); delete kX.conds.hidden; put(HX[0], 8, 1); HX[0].hp = HX[0].maxhp = 60; RU.startTurn(kX); drain(K.flood(BX, kX, HX[0])); var lost2 = 60 - HX[0].hp; K.CFG.swirlHit = true;
      ok('swirlHit false (the old): the swirl itself costs nothing at once (' + lost2 + ')', lost2 === 0);
      var BL2 = battle({ lvl: 3 }), t = D.keeperLog.text().split('\n');
      var sl = t.filter(function (x) { return /^settings: /.test(x); })[0] || '';
      ok('the log header carries the Keeper\'s settings: ' + sl.slice(0, 150) + '...', /^settings: hp=160, slams=2, slamDice=3d4, slamAtk=6, waveDC=15,/.test(sl) && /heldStruggle=true/.test(sl) && /deepDepth=2/.test(sl) && /swirlHit=true/.test(sl) && D.keeperLog.meta.cfg && D.keeperLog.meta.cfg.hp === 160 && D.keeperLog.meta.fight === 'keeper');
      D.battle = B3;
    })();
    // ---- 10-03 (the desk): the Ice Wall's time, the ice about him, the stalemate breaker, the result
    (function () {
      function mk() { var B = battle({ lvl: 3 }), k = keeper(B), H = ours(B), c = cardsOf(B); delete k.conds.hidden; H.forEach(function (u) { delete u.conds.hidden; }); return { B: B, k: k, H: H, c: c }; }
      var S1 = mk(); S1.B.round = 1; K.st(S1.B); S1.k.reaction = 1; drain(K.raiseWall(S1.B, S1.k, null)); var w1 = S1.B.kp.wall;
      S1.B.round = 3; drain(K.upkeep(S1.B, S1.k)); var up3 = !!S1.B.kp.wall; S1.B.round = 4; S1.c.length = 0; var n1 = D.keeperLog.length; drain(K.upkeep(S1.B, S1.k));
      ok('the Ice Wall rose in round 1: still up in round 3 (' + up3 + '), thawed at the start of the Keeper\'s turn in round 4 (' + !S1.B.kp.wall + '), no wall in the grid (' + (S1.B.walls || []).length + ' walls), a card (' + (S1.c.join(' ').match(/Ice Wall thaws[^.]*/) || ['none'])[0] + '), a log line (' + D.keeperLog.slice(n1).map(function (e) { return e.action; }) + ')', up3 && !S1.B.kp.wall && !(S1.B.walls || []).length && /Ice Wall thaws/.test(S1.c.join(' ')) && D.keeperLog.slice(n1).some(function (e) { return /thaws/.test(e.action); }) && S1.B.kp.melting && S1.B.kp.melting.length === 1);
      var cc0 = K.canCastWall(S1.B, S1.k), rr0 = S1.B.round; S1.B.round++; var cc1 = K.canCastWall(S1.B, S1.k); S1.B.round = rr0;
      ok('the way is open once it thaws (the wall squares are standable: ' + standL(S1.H[0], 8, 11) + ') and the AI Keeper does not re-cast it the very round it thaws (canCast ' + cc0 + '; next round ' + cc1 + ', ' + S1.B.kp.uses + ' uses left)', standL(S1.H[0], 8, 11) === true && cc0 === false && cc1 === true);
      var S2 = mk(); K.CFG.wallRounds = 0; S2.B.round = 1; K.st(S2.B); S2.k.reaction = 1; drain(K.raiseWall(S2.B, S2.k, null)); S2.B.round = 40; drain(K.upkeep(S2.B, S2.k)); var never = !!S2.B.kp.wall; K.CFG.wallRounds = 3;
      ok('wallRounds 0: the wall never thaws (the old), even in round 40 (' + never + ')', never);
      // the ice about him
      var S3 = mk(); S3.B.round = 2; S3.k.conds.restrained = { dc: 7, by: 'ice', ice: true, round: 2 }; K.st(S3.B).ice[S3.k.x + ',' + S3.k.y] = true; S3.B.round = 4; drain(K.upkeep(S3.B, S3.k)); var still = !!S3.k.conds.restrained; S3.B.round = 5; S3.c.length = 0; drain(K.upkeep(S3.B, S3.k));
      ok('the ice that holds him lasts 3 rounds (round 2 to 4 still held ' + still + ', round 5 free ' + !S3.k.conds.restrained + ') or till he breaks out', still && !S3.k.conds.restrained && /ice about .* thaws/.test(S3.c.join(' ')));
      // legalize: a creature left on a square it cannot stand on is set right
      var S4 = mk(); put(S4.H[0], 8, 9); S4.H[0].x = 3; S4.H[0].y = 2; var bad = !G.canStand(S4.H[0], 3, 2, { ghost: true }); K.legalize(S4.B);
      ok('a creature on a square it cannot stand on is set right when a wall melts (was illegal ' + bad + ', now at ' + S4.H[0].x + ',' + S4.H[0].y + ' legal ' + G.canStand(S4.H[0], S4.H[0].x, S4.H[0].y, { ghost: true }) + ')', bad && G.canStand(S4.H[0], S4.H[0].x, S4.H[0].y, { ghost: true }));
      // the stalemate: the wall up, one melee hero on the dry side, the rest down; two rounds; the breaker melts it; again, the party is lost
      var S5 = mk(); S5.B.round = 5; K.st(S5.B); S5.k.reaction = 1; drain(K.raiseWall(S5.B, S5.k, null)); S5.B.kp.wall.round = 5; S5.H.forEach(function (u, i) { if (i !== 0) { u.hp = 0; u.ko = true; } }); put(S5.H[0], 8, 12); S5.H[0].weapon = Object.assign({}, S5.H[0].weapon, { ranged: false }); putK(S5.k);
      var eng0 = K.canEngage(S5.B); S5.B.round = 6; drain(K.upkeep(S5.B, S5.k)); var after1 = !!S5.B.kp.wall; S5.B.round = 7; S5.c.length = 0; var n5 = D.keeperLog.length; drain(K.upkeep(S5.B, S5.k)); var after2 = !!S5.B.kp.wall;
      ok('the stalemate breaker: no one can reach the other (canEngage ' + eng0 + '); round 6 the wall stands (' + after1 + '), round 7 it melts at once (' + !after2 + ') with a card (' + (S5.c.join(' ').match(/STALEMATE[^.]*/) || ['none'])[0].slice(0, 70) + ') and a log line (' + D.keeperLog.slice(n5).map(function (e) { return e.action; }).join(', ') + ')', !eng0 && after1 && !after2 && /STALEMATE/.test(S5.c.join(' ')) && D.keeperLog.slice(n5).some(function (e) { return /stalemate breaker/.test(e.action); }) && K.canEngage(S5.B));
      var S6 = mk(); S6.B.round = 5; K.st(S6.B); S6.k.reaction = 1; S6.B.kp.staleBroke = true; drain(K.raiseWall(S6.B, S6.k, null)); S6.H.forEach(function (u, i) { if (i !== 0) { u.hp = 0; u.ko = true; } }); put(S6.H[0], 8, 12); putK(S6.k); S6.B.round = 6; drain(K.upkeep(S6.B, S6.k)); S6.B.round = 7; drain(K.upkeep(S6.B, S6.k));
      ok('after the breaker has run and failed (the wall up again), two more such rounds end it in the Keeper\'s favour (over ' + S6.B.over() + ')', S6.B.over() === 'lost');
      // the result: every hero at 0 HP, held ones included, is a lost fight; held heroes keep their hold at 0 HP and the drowning stops
      var S7 = mk(); put(S7.H[0], 8, 1); S7.H[0].hp = S7.H[0].maxhp = 30; RU.startTurn(S7.k); force(false); drain(K.flood(S7.B, S7.k, S7.H[0])); unforce(); S7.H[0].hp = 0; S7.H[0].ko = true; var held0 = !!S7.H[0].conds.restrained; var hp7 = S7.H[0].hp; K.drownTick(S7.B, S7.H[0]);
      S7.H.forEach(function (u) { u.hp = 0; u.ko = true; });
      ok('a held hero at 0 HP stays held (' + held0 + ') and the drowning stops (hp ' + hp7 + ' -> ' + S7.H[0].hp + '); with every hero at 0 HP the fight is lost (' + S7.B.over() + ')', held0 && S7.H[0].hp === 0 && S7.B.over() === 'lost');
      // the swirl spends the rest of the turn: a hold that ends the same turn (the hero dead of it) gives nothing back (Griz 10-03: "two slams back changing forms after they died")
      (function () {
        function mk2() { var B = battle({ lvl: 3 }), k = keeper(B), H = ours(B), c = cardsOf(B); K.st(B); B.o.play = 'keeper'; delete k.conds.hidden; H.forEach(function (u) { delete u.conds.hidden; }); put(H[0], 8, 1); put(H[1], 8, 9); RU.startTurn(k); return { B: B, k: k, H: H, c: c }; }
        function run2(S, cmd) { var g = S.B.exec(S.k, cmd), n = 0, v; while (n++ < 5000) { var r = g.next(v); v = undefined; if (r.done) break; if (r.value && r.value.prompt) v = 0; } K.checkSwirl(S.B); } // (as KP.humanTurn does after each command)
        function st(k) { var T = k.turn; return T.action + '/' + T.bonus + '/' + (T.slamsLeft || 0); }
        function okRing(S) { var e = KP.entries(S.B, S.k).filter(function (x) { return /^(kslam|kwave|kcast|kready|kswirl)$/.test(x.id); }); return e.every(function (x) { return !x.ok; }); }
        var KP = D.keeperPlay;
        var A = mk2(); A.H[0].hp = 1; force(false); run2(A, { do: 'kswirl', target: A.H[0] }); unforce();
        ok('SWIRL kills the hero it takes: he rises out of it and has lost the rest of the turn (action/bonus/slams ' + st(A.k) + ', swirling ' + !!A.k.flooding + ', hero hp ' + A.H[0].hp + ')', !A.k.flooding && st(A.k) === '0/0/0' && A.H[0].hp <= 0);
        var A2 = mk2(); A2.H[0].hp = 40; A2.H[0].maxhp = 40; force(false); run2(A2, { do: 'kswirl', target: A2.H[0] }); unforce(); var keeps = A2.k.flooding && A2.k.turn.bonus > 0;
        A2.H[0].hp = 2; run2(A2, { do: 'ksuffocate' });
        ok('SUFFOCATE kills the held hero (the swirl itself left his bonus: ' + keeps + '): no Slam, Wave or wall afterwards (' + st(A2.k) + ', swirling ' + !!A2.k.flooding + ')', keeps && !A2.k.flooding && st(A2.k) === '0/0/0');
        // (10-03, his play=keeper log: Aurdin, suffocated to 0, lay held by a Keeper that had risen, till its fall let him go): the swirl over is the hold over
        ok('and it lets go of him: held ' + !!A2.H[0].conds.restrained + ', the Keeper holding ' + (A2.k.holding || []).length + '; the one the SWIRL killed too: held ' + !!A.H[0].conds.restrained, !A2.H[0].conds.restrained && !(A2.k.holding || []).length && !A.H[0].conds.restrained);
        var A3 = mk2(); A3.H[0].hp = 40; A3.H[0].maxhp = 40; force(false); drain(K.flood(A3.B, A3.k, A3.H[0], true)); unforce();
        ok('the Wave\'s auto-swirl ends the turn (action/bonus/move ' + st(A3.k) + '/' + A3.k.turn.move + ')', st(A3.k) === '0/0/0' && A3.k.turn.move === 0);
        var A4 = mk2(); A4.H[0].hp = 40; A4.H[0].maxhp = 40; force(false); drain(K.flood(A4.B, A4.k, A4.H[0], true)); unforce(); A4.H[0].hp = 0; A4.H[0].ko = true; K.checkSwirl(A4.B);
        ok('the auto-swirl\'s hold ends with the hero down: the ring offers nothing that takes an action or bonus (' + (KP ? okRing(A4) : 'no KP') + '), the click Slam is refused', KP && okRing(A4) && (run2(A4, { do: 'attack', target: A4.H[1] }), st(A4.k) === '0/0/0'));
      })();
      // READY on the ledge (Griz 10-03: "test barley standing on the ledge and readying a strike when keeper in range ... wave pushing him in range"): the strike is sprung by the Keeper's own step into reach;
      // what the Wave's backwash does to the readier (swept into the Keeper's reach) is told as it is
      (function () {
        function mk3() { var B = battle({ lvl: 3 }), k = keeper(B), H = ours(B), c = cardsOf(B); B.o.play = 'keeper'; delete k.conds.hidden; H.forEach(function (u) { delete u.conds.hidden; }); H.forEach(function (u, i) { if (i) put(u, 8, 12); }); H.forEach(function (u) { u.guest = true; u.classAI = true; }); RU.startTurn(k); return { B: B, k: k, H: H, c: c, bar: H.filter(function (u) { return /Barley/.test(u.name); })[0] || H[0] }; } // (the class AI plays the four, as in the fight: its readied strike is aimed by the AI)
        function runB(B, u, cmd) { var g = B.exec(u, cmd), n = 0, v; while (n++ < 5000) { var r = g.next(v); v = undefined; if (r.done) break; if (r.value && r.value.prompt) v = r.value.prompt.opts[0].value; } }
        var R = mk3(); put(R.bar, 8, 9); var o = K.at(4, 8, 2); R.k.x = o[0]; R.k.y = o[1]; RU.startTurn(R.bar); runB(R.B, R.bar, { do: 'ready', trigger: 'near', pick: 'weapon' });
        var armed = !!R.bar.ready, rr0 = R.bar.reaction, hp0 = R.k.hp; R.c.length = 0;
        R.bar.x = K.at(8, 8, 1)[0]; R.bar.y = K.at(8, 8, 1)[1]; // (the hero's own square, on the last wet step by the ledge; the Keeper comes to it)
        RU.startTurn(R.k); var rmK = G.reach(R.k, R.k.turn.move), tgtSq = null; Object.keys(rmK).forEach(function (kx) { var e = rmK[kx]; if (!e.stand) return; if (G.dist(R.k, R.bar, e.x, e.y) <= 5 && (!tgtSq || e.cost < tgtSq.cost)) tgtSq = e; });
        if (tgtSq) drain(R.B.moveAlong(R.k, G.path(rmK, tgtSq.x, tgtSq.y), { spend: true }));
        var sprang = R.bar.reaction === 0 || /readied/.test(R.c.join(' '));
        ok('Barley readies the flail on the ledge ("a foe comes within reach"): armed ' + armed + '; the Keeper walks up into his reach (' + K.A(R.k) + ' along): the strike sprang ' + sprang + ' (the Keeper ' + hp0 + ' -> ' + R.k.hp + ')', armed && sprang);
        var W = mk3(); put(W.bar, 8, 9); var o2 = K.at(5, 8, 2); W.k.x = o2[0]; W.k.y = o2[1]; RU.startTurn(W.bar); runB(W.B, W.bar, { do: 'ready', trigger: 'near', pick: 'weapon' });
        var armed2 = !!W.bar.ready; RU.startTurn(W.k); W.k.reaction = 1; drain(K.raiseWall(W.B, W.k, null)); RU.startTurn(W.k); W.c.length = 0; var hpW = W.k.hp, a0 = K.A(W.bar);
        force(false); drain(K.wave(W.B, W.k)); unforce();
        var swept = a0 - K.A(W.bar), spr2 = /\(readied\)/.test(W.c.join(' '));
        ok('the Wave bounces Barley (readied, on the ledge at ' + a0 + ' along) ' + swept + ' squares toward the Keeper, now ' + K.A(W.bar) + ' along beside it (reach ' + (G.dist(W.bar, W.k) <= G.reachOf(W.bar, W.bar.weapon && W.bar.weapon.reach)) + '): the readied strike SPRANG when he was forced into reach (' + spr2 + ', reaction ' + W.bar.reaction + ', ' + (W.c.join(' ').match(/Barley[^.]{0,40}\(readied\)[^.]{0,30}/) || ['no readied card'])[0].replace(/\{.\}|\{\/\}/g, '') + ')', armed2 && swept > 0 && spr2);
      })();
      D.battle = B3;
    })();
    D.battle = B3;
    // ---- THE STREAM'S FIXES (10-03, Griz after the two streamed Keeper fights: "1 yes", "2 SRD", "3 have it open with the wall", "4 please", "5 yes")
    (function () {
      var Z = battle({ lvl: 3 }), kz = keeper(Z), HZ = ours(Z), cz = cardsOf(Z), LG = D.keeperLog, strip = window.DS.stripCodes; delete kz.conds.hidden; HZ.forEach(function (u) { delete u.conds.hidden; }); RU.startTurn(kz);
      // 2: prone at range (SRD 5.1): within 5 ft advantage, else disadvantage -- a reach blow from 10 ft as much as a bow's
      put(HZ[0], 8, 7); HZ[0].conds.prone = true; var dz = G.dist(kz, HZ[0]), e10 = RU.edges(kz, HZ[0], kz.attacks.slam);
      put(HZ[0], 8, 6); var dz5 = G.dist(kz, HZ[0]), e5 = RU.edges(kz, HZ[0], kz.attacks.slam);
      ok('prone at reach (SRD): the Slam on a prone hero ' + dz + ' ft off has disadvantage (' + e10.dis.join(',') + '), ' + dz5 + ' ft off advantage (' + e5.adv.join(',') + ')', dz === 10 && e10.dis.indexOf('prone target') >= 0 && e10.adv.indexOf('prone target') < 0 && dz5 <= 5 && e5.adv.indexOf('prone target') >= 0);
      delete HZ[0].conds.prone;
      // 1d: a prone walker stands for half its speed if it has it (the reach is what is left), else it crawls (5 ft more a square)
      var h = HZ[1]; put(h, 8, 10); RU.startTurn(h); h.turn.move = 30; h.conds.prone = true; var far = function (rm) { return Object.keys(rm).reduce(function (m, k) { return Math.max(m, rm[k].cost); }, 0); };
      var rUp = far(G.reach(h, 30)), rStand = far(G.reach(h, 15, { upright: true })), rCrawl = far(G.reach(h, 10));
      cz.length = 0; var rmh = G.reach(h, 30), fb = null; Object.keys(rmh).forEach(function (k) { if (rmh[k].stand && (!fb || rmh[k].cost > fb.cost)) fb = rmh[k]; }); drain(Z.moveAlong(h, G.path(rmh, fb.x, fb.y), { spend: true }));
      ok('prone with 30 ft: its reach is 15 ft upright (' + rUp + ' = ' + rStand + '); it gets up as it sets off (prone ' + !!h.conds.prone + ', ' + h.turn.move + ' ft left, "' + ((cz.join(' ').match(/gets up[^.]*/) || [''])[0]) + '"); with 10 ft it crawls, a square for 10 (' + rCrawl + ')',
        rUp === rStand && rUp <= 15 && !h.conds.prone && /gets up/.test(cz.join(' ')) && h.turn.move >= 0 && h.turn.move <= 15 && rCrawl === 10);
      // 1d: knocked flat on the way by an opportunity blow: up for half its speed, and the walk ends where the walk runs out
      var hb = HZ[2]; put(hb, 8, 6); RU.startTurn(hb); hb.turn.move = 30; hb.turn.disengaged = false; kz.reaction = 1; var at0 = Z.attack;
      Z.attack = function* (att, tgt, atk, o) { if (o && o.oa) { tgt.conds.prone = true; Z.card(['(the probe: the blow puts it down)']); } };
      cz.length = 0; drain(Z.moveAlong(hb, [sq(8, 7), sq(8, 8), sq(8, 9), sq(8, 10), sq(8, 11)], { spend: true })); Z.attack = at0;
      ok('knocked flat mid-walk: it gets up (prone ' + !!hb.conds.prone + ', "gets up" ' + /gets up/.test(cz.join(' ')) + ') and walks on only as far as 15 ft takes it (at ' + K.A(hb) + ' along, ' + hb.turn.move + ' ft left; it set off at 6 for 11)',
        !hb.conds.prone && /gets up/.test(cz.join(' ')) && K.A(hb) > 6 && K.A(hb) < 11 && hb.turn.move >= 0);
      // 1a: the retreat in the water goes more than a square a move (the score's progress outweighs the water's cost)
      var hr = HZ[3]; put(HZ[0], 7, 12); put(HZ[1], 9, 12); put(HZ[2], 10, 12); put(hr, 8, 3); kz.reaction = 0; hr.guest = true; hr.classAI = true; K.st(Z).holdBroken = { round: Z.round }; RU.startTurn(hr); var a0r = K.A(hr); drain(D.tactics.turn(Z, hr));
      ok('the retreat: from ' + a0r + ' along in the water it reaches ' + K.A(hr) + ' (it went one square a move: ' + (a0r + 2) + ')', K.A(hr) > a0r + 2);
      K.st(Z).holdBroken = null; HZ.forEach(function (u) { delete u.guest; delete u.classAI; });
      // 1b: a held hero that breaks free walks off the deep
      var hf = HZ[0]; put(hf, 8, 1); hf.hp = hf.maxhp = 60; force(false); drain(K.flood(Z, kz, hf)); unforce(); hf.conds.restrained.dc = -99; hf.guest = true; hf.classAI = true; RU.startTurn(hf); drain(D.tactics.turn(Z, hf));
      ok('broken free of the swirl, out of the deep: restrained ' + !!hf.conds.restrained + ', at ' + K.A(hf) + ' along, the deep ' + K.isDeep(hf.x, hf.y), !hf.conds.restrained && !K.isDeep(hf.x, hf.y));
      delete hf.guest; delete hf.classAI; K.checkSwirl(Z);
      // 1c: a blow that breaks the hold ends the swirl at once, whoever struck it
      put(hf, 8, 1); force(false); drain(K.flood(Z, kz, hf)); var ac0 = RU.ac(kz); Z.hurt(kz, 6, 'slashing'); unforce();
      ok('a blow breaks the hold: the swirl ends then, not at the next command (flooding ' + !!kz.flooding + ', AC ' + ac0 + ' -> ' + RU.ac(kz) + ', retreat from round ' + (K.st(Z).holdBroken && K.st(Z).holdBroken.round) + ')', !kz.flooding && ac0 === 10 && RU.ac(kz) === 13 && K.st(Z).holdBroken);
      // 3: the AI Keeper opens with the wall, whoever is in reach; its next turn Slams
      var O = battle({ lvl: 3 }), ko = keeper(O), HO = ours(O), co = cardsOf(O); delete ko.conds.hidden; HO.forEach(function (u) { delete u.conds.hidden; }); put(HO[0], 8, 6); put(HO[1], 8, 7);
      RU.startTurn(ko); var ka0 = K.A(ko), krm = G.reach(ko, ko.turn.move), kmin = Object.keys(krm).reduce(function (m, k) { return krm[k].stand ? Math.min(m, K.A(krm[k])) : m; }, ka0);
      drain(K.turn(O, ko)); var w1 = !!(O.kp && O.kp.wall), s1 = co.filter(function (c) { return /> .*Slam/.test(c) && /d20/.test(c); }).length;
      ok('it opens with the wall, a hero in its reach: wall ' + w1 + ' (' + (O.kp && O.kp.uses) + ' left), Slams that turn ' + s1, w1 && O.kp.uses === K.CFG.wallUses - 1 && s1 === 0);
      // 3b (10-03, Griz: "add 'moves as deep as he can' to the end of his opener (even if he'll take an AOO)"): the opener ends in the deepest water its move reaches
      ok('and it ends its opener as deep as it can: along ' + ka0 + ' -> ' + K.A(ko) + ' (the deepest its move reached at the turn\'s start: ' + kmin + ')', kmin < ka0 && K.A(ko) <= kmin + 1 && K.A(ko) < ka0);
      // 5: its card: three lines of its own, the Slam twice, the Wave, the swirl and Active Suffocation; the elemental glyph
      var il = K.inspectLines(O, ko) || [], it = il.join(' | ');
      ok('its inspect card: ' + il.length + ' lines (' + strip(it).slice(0, 150) + '), type ' + D.ui.typeOf(ko), il.length === 3 && /Slam x2/.test(it) && /Wave/.test(it) && /Suffocate/.test(it) && it.indexOf('{p}Ice Wall{/} ' + O.kp.uses + '/' + K.CFG.wallUses) >= 0 && D.ui.typeOf(ko) === 'elemental');
      // 4: the log -- who plays, the AI's hide, a resisted blow, nothing for a click that did nothing, the round of a change caught at the next turn's door, the die in the drowning
      ok('the log names who plays: a benched fight ' + LG.meta.mode, LG.meta.mode === 'ai');
      RU.startTurn(HO[2]); drain(O.hide(HO[2])); var lh = LG[LG.length - 1];
      ok('the class AI\'s hide is a line (' + (lh && lh.actor + ': ' + lh.action) + ')', lh && lh.action === 'hide' && lh.actor === HO[2].name);
      var fire = { name: 'Firetest', atk: 99, dice: '2d6', mod: 4, type: 'fire', reach: 300 }, lf = null; // (a melee blow from wherever it stands: no ammunition asked)
      for (var t = 0; t < 6 && !lf; t++) { drain(O.attack(HO[3], ko, fire)); var le = LG[LG.length - 1]; if (le && /resists fire: \d+ becomes \d+/.test(le.result)) lf = le; }
      ok('a resisted blow says so: "' + (lf && (lf.result.match(/The Keeper resists fire: [^/]*/) || [''])[0]) + '"', !!lf);
      var hd = HO[1]; hd.hp = 0; O._klog.hp[hd.id] = 0; hd.conds.drowning = { by: ko.id }; var n0 = LG.length; K.drownTick(O, hd);
      ok('no line for the drowning of one already down (' + (LG.length - n0) + ')', LG.length === n0);
      hd.hp = 20; O._klog.round = 4; O.round = 5; O._klog.hp[hd.id] = 30; RU.startTurn(HO[3]); var lg2 = LG.filter(function (e) { return /hp change between/.test(e.action); }).pop();
      ok('a change caught at the next turn\'s door keeps its own round (R' + (lg2 && lg2.round) + ')', lg2 && lg2.round === 4);
      put(hd, 8, 1); hd.conds.drowning = { by: ko.id }; co.length = 0; K.drownTick(O, hd);
      ok('the drowning shows its die: "' + strip((co.join(' ').match(/drowns[^(]*/) || [''])[0]) + '"', /drowns: \S+ (less \d+ )?\[\d\]\+1 = \d+/.test(strip(co.join(' '))));
      var NB = battle({ lvl: 3, bench: false }); ok('played by hand (no play=, not benched): the log says mode ' + LG.meta.mode, LG.meta.mode === 'party');
      var NK = battle({ lvl: 3, bench: false, play: 'keeper' }); ok('play=keeper: mode ' + LG.meta.mode, LG.meta.mode === 'keeper');
      // (10-03, his play=keeper log) a click refused with a card has no line; the clicked Slam is "kslam", as the ring's; the breath comes on the move off the deep
      var KB = battle({ lvl: 3 }), kb = keeper(KB), HB = ours(KB), runK = function (cmd) { drain(KB.exec(kb, cmd)); K.checkSwirl(KB); }; KB.o.play = 'keeper'; delete kb.conds.hidden; HB.forEach(function (u) { delete u.conds.hidden; });
      put(HB[0], 8, 1); put(HB[1], 8, 6); HB[0].hp = HB[0].maxhp = 60; RU.startTurn(kb); force(false); runK({ do: 'kswirl', target: HB[0] }); unforce(); kb.turn.action = 1;
      var nr = LG.length, cr = cardsOf(KB); runK({ do: 'attack', target: HB[1] });
      ok('a refused click, no line: SLAM while swirling ("' + strip((cr.join(' ').match(/LET GO[^.]*/) || ['no card'])[0]) + '"), ' + (LG.length - nr) + ' new lines, the action kept ' + kb.turn.action, LG.length === nr && /LET GO first/.test(cr.join(' ')) && kb.turn.action === 1 && !!kb.flooding);
      HB[1].hp = HB[1].maxhp = 60; runK({ do: 'krise' }); kb.turn.action = 1; var ns = LG.length; runK({ do: 'attack', target: HB[1] }); var lsl = LG[LG.length - 1];
      ok('the clicked Slam is logged as the ring\'s: "' + (lsl && lsl.action) + '" (' + (lsl && lsl.rolls.length) + ' rolls)', LG.length === ns + 1 && lsl.action === 'kslam' && lsl.rolls.length > 0);
      var hbr = HB[2]; put(hbr, 7, 1); RU.startTurn(hbr); hbr.conds.drowning = { by: kb.id }; hbr.turn.move = 30; kb.reaction = 0; drain(KB.moveAlong(hbr, [sq(7, 2), sq(7, 3)], { spend: true })); var lbr = LG[LG.length - 1];
      ok('out of the deep, the breath on the move: drowning ' + !!hbr.conds.drowning + ' at ' + K.A(hbr) + ' along, the move\'s line "' + (lbr && lbr.action + ': ' + lbr.result).slice(0, 90) + '"', !hbr.conds.drowning && !K.isDeep(hbr.x, hbr.y) && lbr && lbr.action === 'move' && /gets a breath/.test(lbr.result));
      D.battle = B3;
    })();
    // ---- whole fights, the class AI on the party's side; runs=N per level (lvls=3,4,5), wall=<row> for the alt wall row, start=ledge|rune where the party comes in (10-03); the counts are what the mechanics did
    // (outside: heroes up on the exit side of the wall's row as it rose -- sealed out, not in)
    var q = {}; location.search.replace(/^\?/, '').split('&').forEach(function (kv) { var a = kv.split('='); if (a[0]) q[a[0]] = decodeURIComponent(a[1] || ''); });
    if (q.hide != null) K.CFG.hideAfter = q.hide !== '0'; if (q.oa != null) K.CFG.oaWave = q.oa === '1'; if (q.need) K.CFG.freezeNeeds = q.need; if (q.wallrounds != null) K.CFG.wallRounds = +q.wallrounds; if (q.ai != null) K.CFG.aiScript = q.ai === 'current' ? '' : q.ai; if (q.retreat != null) K.CFG.partyRetreat = q.retreat !== '0'; if (q.deep) K.CFG.deepDepth = +q.deep; if (q.drown) K.CFG.drown = q.drown; // (the settings the bench can flip: hide=0, oa=1, need=any)
    var N = +(q.runs || 2), lv = (q.lvls || '3,4,5').split(',').map(Number), rows = [];
    lv.forEach(function (L) {
      var agg = { won: 0, lost: 0, rounds: 0, downs: 0, waves: 0, swept: 0, floods: 0, drown: 0, twice: 0, breaks: 0, kept: 0, walls: 0, fire: 0, froze: 0, slams: 0, prone: 0, none: 0, thaws: 0, stale: 0, suff: 0, swirlA: 0, outside: 0 };
      var rw0 = K.raiseWall; K.raiseWall = function* (B, k, trig) { var wa = B.kp && B.kp.rowOverride != null ? B.kp.rowOverride : G.map.def.geo.wall; agg.outside += ours(B).filter(function (u) { return G.standing(u) && K.A(u) > wa; }).length; return yield* rw0.apply(this, arguments); };
      for (var f = 0; f < N; f++) {
        D.seed = (f + 1) * 7919 + L; var F = battle({ lvl: L, start: q.start || null }), cs = cardsOf(F); if (q.hp) { var kk = keeper(F); kk.hp = kk.maxhp = +q.hp; }
        if (q.wall) F.kp = { uses: 3, ready: null, wall: null, ice: {}, waves: 0, rowOverride: +q.wall };
        F.units.forEach(function (u) { if (u.side === 'party' && !u.familiar) { u.guest = true; u.classAI = true; } });
        F.heroTurn = function* (u) { yield* D.ai.turn(this, u); };
        var v, g = 0; while (F.co && g++ < 400000) { var r; try { r = F.co.next(v); } catch (e) { errs.push(String(e && e.stack || e).slice(0, 500)); break; } v = undefined; if (r.done) break; var y = r.value; if (y && y.prompt) v = y.prompt.opts[0].value; }
        var txt = cs.join('\n'), cnt = function (re) { return (txt.match(re) || []).length; };
        if (F.result === 'won') agg.won++; else if (F.result === 'lost') agg.lost++; else agg.none++;
        agg.rounds += F.round; agg.downs += cnt(/ goes down\./g); agg.waves += cnt(/sends a wave/g); agg.swept += cnt(/is swept/g); agg.floods += cnt(/is washed into the deep/g);
        agg.drown += cnt(/ drowns/g); agg.twice += cnt(/flooded: twice/g); agg.breaks += cnt(/THE HOLD BREAKS/g); agg.kept += cnt(/the hold keeps/g); agg.walls += cnt(/(springs|raises) the Ice Wall/g);
        agg.fire += cnt(/goes to steam/g); agg.froze += cnt(/freeze over/g); agg.slams += cnt(/ Slam/g); agg.prone += cnt(/KNOCKED PRONE/g); agg.thaws += cnt(/Ice Wall thaws/g); agg.stale += cnt(/STALEMATE/g); agg.suff += cnt(/ACTIVE SUFFOCATION/g);
      }
      K.raiseWall = rw0;
      rows.push('L' + L + ' x' + N + ' start=' + (q.start || 'ledge') + ' wr=' + K.CFG.wallRounds + ' ai=' + (K.CFG.aiScript || 'current') + (q.wall ? ' wall ' + q.wall : '') + ': ' + JSON.stringify(agg).replace(/"/g, ''));
    });
    ok('whole fights, no error (' + errs.length + ')', !errs.length && rows.every(function (r) { return !/none:[1-9]/.test(r); }));
    rows.forEach(function (r) { ok(r, true); });
    // ---- the way out (10-04, Griz: "Keeper Fight lacks fight escape", then "pull the rest of the party" as the Wet does): LEAVE THE FIGHT live on the corridor's east end, greyed off it; one out, all out
    var BX = battle({ embed: { start: 'ledge', canRun: true } }), bx = BX.units.filter(function (u) { return u.id === 'barley'; })[0];
    bx.x = 14; bx.y = 8; D.rules.startTurn(bx);
    var lx = (BX.commands(bx) || []).filter(function (c) { return c.id === 'leave'; })[0];
    bx.x = 12; D.rules.startTurn(bx); var gx = (BX.commands(bx) || []).filter(function (c) { return c.id === 'leave'; })[0]; bx.x = 14; D.rules.startTurn(bx);
    ok('the corridor\'s east end (14, 8) is a way out: LEAVE THE FIGHT live there (' + JSON.stringify(lx && [lx.ok, lx.why]) + '), greyed two squares in (' + JSON.stringify(gx && [gx.ok, gx.why]) + ')', !!lx && lx.ok === true && !!gx && !gx.ok && /way/.test(gx.why || ''));
    drain(BX.leave(bx));
    ok('Barley out by the corridor, and the party goes too (oneLeavesAll): left ' + bx.left + ', over() ' + BX.over(), bx.left === true && BX.over() === 'escaped');
  } catch (e) { errs.push(String(e && e.stack || e).slice(0, 800)); }
  var pre = document.createElement('pre'); pre.textContent = 'KEEPERPROBE ' + JSON.stringify({ checks: checks, errors: errs });
  document.body.appendChild(pre);
})();
