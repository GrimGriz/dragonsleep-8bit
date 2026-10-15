/* THE SNOOT -- the probe (?probe): what dev/snoot-probe.py reads in headless Edge. The books' numbers spot-checked against the
   pages they came from, his rules as unit checks (the around, the witness, the Dominion's day), then whole battles played by
   both hands -- the AI's for the gnolls and the Dominion, the bench's for ours (SN.AI.ours), the party's fights on the tables
   (SN.standIn) -- every invariant held each day. Prints "ok"/"FAIL" lines into #probe and a last line SNOOTPROBE. */
'use strict';
(function () {
  var SN = window.SN, out = [], bad = 0;
  function ok(c, what) { out.push((c ? 'ok   ' : 'FAIL ') + what); if (!c) bad++; }
  function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  // drive a day to its end: each { deep } on the tables, each { anim } passed
  function play(st, deepLog) {
    var g = SN.resolve(st), r = g.next(), n = 0;
    while (!r.done && n++ < 200) { var v = r.value, back; if (v && v.deep) { if (deepLog) deepLog.push(v.deep.kind); back = SN.standIn(st, v.deep); } r = g.next(back); }
  }
  SN.probe = function () {
    // ---- the books' numbers (CHAINMAIL p.40, p.44, p.15-16)
    ok(eq(SN.CT.HH.LF, [4, 1, 5]), 'p.40: Heavy Horse against Light Foot, 4 dice a man, kills on 5-6');
    ok(eq(SN.CT.LF.HH, [1, 4, 6]), 'p.40: Light Foot against Heavy Horse, 1 die per four men, kills on 6');
    ok(eq(SN.CT.AF.LF, [1, 1, 4]) && eq(SN.CT.MH.HF, [2, 1, 5]) && eq(SN.CT.LH.AF, [1, 1, 6]), 'p.40: three more cells as printed');
    ok(SN.FT.superhero.wraith === 8 && SN.FT.wraith.superhero === 10 && SN.FT.hero.wraith === 11 && SN.FT.wizard.wraith === 5, 'p.44: the Fantasy table cells the mode uses');
    ok(SN.MORALE.HF === 5 && SN.MORALE.HH === 9 && SN.MORALE.LF === 4, 'p.15-16: morale ratings');
    // ---- the map
    ok(SN.ROWS.length === SN.H && SN.ROWS.every(function (r) { return r.length === SN.W; }), 'the map is ' + SN.W + ' by ' + SN.H);
    ok(SN.ROADS.every(function (r) { return r.hexes.every(function (h) { return SN.on(h) && SN.cost(h) === 1; }); }), 'every road hex is on the map and costs 1');
    ok(!!SN.path(SN.WEST, SN.PIT) && !!SN.path([14, 4], SN.PIT) && !!SN.path(SN.SOUTH, SN.MOOT), 'the west road, the Verge and the south road all reach the Pit and the moot');
    ok(SN.cost([9, 3]) >= 99, 'no one walks on Halfway Lake');
    // ---- the forces (his rulings 10-14)
    var nl = SN.FORCES.filter(function (f) { return f.kind === 'Newland'; });
    ok(nl.length >= 4 && nl.every(function (f) { return f.cleric || (f.heroes || []).some(function (h) { return h.paladin; }); }), 'every Newland unit carries a paladin, a cleric or both (' + nl.length + ')');
    ok(SN.DOMINION.length === 3 && SN.DOMINION.every(function (f) { return (f.heroes || []).some(function (h) { return h.warlock; }) && f.wagon; }), 'three Dominion units, each a patrol lady (warlock) with her wagon');
    // ---- his around (RULED 10-14): with GreyFang, next to him, or next to the Harbinger's group when it starts
    var st = SN.newGame(7), G = SN.unit(st, 'greyfang'), H = SN.unit(st, 'harb'), P = SN.unit(st, 'party');
    G.at = [5, 7]; H.at = [5, 7];
    P.at = [5, 7]; ok(SN.around(st, G, H), 'around: the four in GreyFang\'s hex');
    P.at = [6, 7]; ok(SN.around(st, G, H), 'around: the four next to the fight');
    P.at = [7, 7]; ok(!SN.around(st, G, H), 'not around: the four two hexes off');
    H.at = [4, 7]; P.at = [3, 7]; ok(SN.around(st, G, H), 'around: next to the Harbinger\'s group though not next to GreyFang');
    // the collision both ways: around goes to the grid's `greyfang` fight; not around, the head on the map, no fight
    st = SN.newGame(8); G = SN.unit(st, 'greyfang'); H = SN.unit(st, 'harb'); P = SN.unit(st, 'party');
    G.at = [5, 7]; H.at = [5, 7]; P.at = [6, 7];
    var gen = SN.collide(st, H, G), r1 = gen.next();
    ok(!r1.done && r1.value.deep && r1.value.deep.fight === 'greyfang', 'the collision with the four around asks the grid for `greyfang`');
    gen.next({ result: 'won', share: 1 });
    ok(st.head && st.head.how === 'grid' && st.head.witnessed, 'the head is taken in the grid\'s fight, witnessed');
    ok(st.units.filter(function (u) { return u.side === 'gnoll' && SN.alive(u) && !u.watch && !u.harbinger; }).every(function (u) { return u.state === 'withdraw'; }), 'after the head every snooting unit goes home (the death-watch stays)');
    ok(SN.same(SN.unit(st, 'harb').at, SN.MOOT) || SN.dist(SN.unit(st, 'harb').at, SN.MOOT) <= 1, 'the Harbinger goes back to the moot ground');
    st = SN.newGame(9); G = SN.unit(st, 'greyfang'); H = SN.unit(st, 'harb'); P = SN.unit(st, 'party');
    G.at = [5, 7]; H.at = [5, 7]; P.at = [9, 8];
    var gen2 = SN.collide(st, H, G), r2 = gen2.next();
    ok(r2.done && st.head && st.head.how === 'map' && !st.head.witnessed, 'the collision with no one around: the head on the map, no fight');
    // ---- the witness (his rule): within two hexes, up to half, never past the winner's start; not the death-watch
    st = SN.newGame(10);
    var W = SN.unit(st, 'sg1'), X = SN.unit(st, 'sg2'), Y = SN.unit(st, 'wl1'), Z = SN.unit(st, 'gkw');
    st.units.forEach(function (u) { if (u.side === 'gnoll') u.at = [14, 9]; }); // (the rest of the Snoot far off: only these four near)
    W.at = [5, 3]; W.figs = 2; X.at = [6, 4]; X.figs = 5; Y.at = [5, 6]; Y.figs = 6; Z.at = [4, 3]; W.figs0 = 6;
    SN.witness(st, W);
    ok(W.figs === 4 && X.figs === 3, 'witness: a band two hexes off gives two of its five to the winner (now ' + W.figs + ', the giver ' + X.figs + ')');
    ok(Y.figs === 6 && Z.figs === 8, 'witness: three hexes off gives nothing, the death-watch gives nothing');
    W.figs = 5; X.figs = 5; SN.witness(st, W);
    ok(W.figs === 6 && X.figs === 4, 'witness: never past the winner\'s starting size (6): the giver keeps the rest (' + X.figs + ')');
    // ---- the warlock by the book (CHAINMAIL pp.30-33; RULED 10-15: "Book basics for sure")
    function domDay(seed, setup) { var s = SN.newGame(seed); s.party8 = null; s.units.forEach(function (u) { u.on = false; }); s.beats = []; SN.DOMINION.forEach(function (f) { s.units.push(SN.make(f, false)); }); setup(s); var g = SN.resolve(s), r = g.next(); while (!r.done) { var v = r.value; r = g.next(v && v.deep ? SN.standIn(s, v.deep) : undefined); } return s; }
    function on(s, id, at) { var u = SN.unit(s, id); u.on = true; u.state = 'ok'; u.at = at.slice(); u.order = { type: 'hold' }; return u; }
    ok(SN.POINTS.wizard === 80, 'p.33: a warlock is worth 80 points (was ' + SN.POINTS.wizard + ')');
    ok(SN.SAVES && SN.SAVES.hero === 9 && SN.SAVES.superhero === 6 && SN.SAVES.wraith === 7, 'p.31: a missile\'s saves -- heroes 9+, super-heroes 6+, wraiths 7+');
    ok(SN.bonus({ figs: 1, heroes: [{ type: 'wizard' }] }) === 0 && SN.bonus({ figs: 1, heroes: [{ type: 'hero' }] }) === 1 && SN.bonus({ figs: 1, heroes: [{ type: 'wraith' }] }) === 0, 'p.30: a hero adds 1 to his unit\'s dice; a wizard or a wraith adds nothing');
    var sw = domDay(11, function (s) { on(s, 'bows', [8, 5]); var d = on(s, 'dm1', [8, 4]); d.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; });
    ok(sw.beats.some(function (b) { return b.t === 'atk' && b.u === 'dm1' && b.wiz && b.cls === 'AF' && b.f === 2; }), 'p.30: the patrol lady fights as two Armored Foot, her own dice');
    ok(sw.beats.some(function (b) { return b.t === 'shock' && b.by === 'dm1'; }), 'p.30: a wizard affects enemy morale as a super-hero -- her charge makes them check');
    var sv = domDay(12, function (s) { var b = on(s, 'bows', [8, 5]); b.figs = b.figs0 = 60; var d = on(s, 'dm1', [8, 5]); d.figs = 0; });
    var vol = sv.beats.filter(function (b) { return b.t === 'atk' && b.volley && b.tg === 'dm1'; })[0];
    ok(vol && vol.dice.some(function (x) { return x >= vol.need; }) && vol.k === 0, 'p.30: a wizard is impervious to normal missiles -- the volley hits and kills nothing' + (vol ? ' ([' + vol.dice.filter(function (x) { return x >= vol.need; }).length + ' hits] -> ' + vol.k + ')' : ' (no volley at her)'));
    var sl = domDay(13, function (s) { on(s, 'bows', [8, 5]); on(s, 'patrol', [8, 5]); on(s, 'dm2', [8, 5]); });
    ok(sl.beats.some(function (b) { return b.t === 'fb' && b.kind === 'lightning' && (b.tgs || []).length === 2; }), 'p.31: a lightning bolt strikes along a line -- two units');
    var sf = domDay(14, function (s) { on(s, 'patrol', [8, 5]); var d = on(s, 'dm1', [8, 4]); d.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; });
    ok(sf.beats.some(function (b) { return b.t === 'save' && b.need === 9; }), 'p.31: the fire ball falls on the paladin\'s unit and the paladin rolls his save (9+)');
    var sk = domDay(15, function (s) { on(s, 'patrol', [8, 5]); var d = on(s, 'dm1', [8, 5]); d.figs = 0; d.heroes = [{ type: 'hero', name: 'a Warlock keyed as a Hero', missile: 'fireball' }]; });
    ok(sk.beats.some(function (b) { return b.t === 'fb' && b.u === 'dm1'; }) && !sk.beats.some(function (b) { return b.t === 'atk' && b.u === 'dm1' && b.wiz; }) && sk.beats.some(function (b) { return b.t === 'atk' && b.u === 'dm1' && b.f === 4 && b.bonus === 1; }),
      'Book I p.17: a Warlock keyed as a Hero fights as a Hero (four figures, +1) and still throws his missile (RULED 10-15: the four by Book I)');
    // ---- the bench's stand-in (RULED 10-15: "the bench should read a complete gnoll slaughter ... keep at 32 figures") and the plains tribes (RULED 10-15)
    var sx = SN.newGame(21), wins = 0; sx.party8 = null;
    for (var q = 0; q < 40; q++) { var rq = SN.band(sx, [SN.unit(sx, 'sg1')], SN.unit(sx, 'sg1').at); var rs = SN.standIn(sx, rq); if (rs.result === 'won' && rs.share >= 1) wins++; }
    ok(wins >= 38, 'the stand-in: the four as 32 Armored Foot at +2 against a band\'s own figures read a slaughter, as the grid does (' + wins + ' of 40)');
    var sb = SN.newGame(31); sb.party8 = null; sb.day = 16; SN.dawn(sb); var b1 = SN.unit(sb, 'bb1');
    ok(b1.on && !SN.canOrder(sb, b1) && b1.order.type === 'move', 'the plains tribes are the mode\'s AI\'s: no orders of the player\'s, and they march on the Snoot (' + b1.order.type + ')');
    // ---- formation and facing (CHAINMAIL p.10, p.16; RULED 10-15: "3 - Formations", "4 - Round 1 have the player set the formation before play without
    // cost, change formation half-day")
    function tk(f) { try { return f(); } catch (e) { return false; } }
    function fday(seed, setup) { var s = SN.newGame(seed); s.party8 = null; s.units.forEach(function (u) { u.on = false; }); s.beats = []; setup(s); var g = SN.resolve(s), r = g.next(); while (!r.done) { var v = r.value; r = g.next(v && v.deep ? SN.standIn(s, v.deep) : undefined); } return s; }
    function atk1(s, id) { return (s.beats || []).filter(function (b) { return b.t === 'atk' && b.u === id && b.round === 1 && !b.wiz; })[0]; }
    ok(tk(function () { var hx = [6, 5], nb = SN.nbrs(hx), asp = function (d, s) { return SN.aspect({ day: 15 }, { came: nb[s] }, d, hx); }, all = function (d) { return [0, 1, 2, 3, 4, 5].map(function (s) { return asp(d, s); }).join(); };
      return all({ form: 'line', face: 0 }) === 'front,front,flank,rear,flank,front' && all({ form: 'column', face: 0 }) === 'front,flank,flank,rear,flank,flank' && all({ form: 'square', face: 3 }) === 'front,front,front,front,front,front' && all({ form: 'line', face: 2 }) === 'flank,front,front,front,flank,rear'; }),
      'p.10, p.16: a line\'s front is three sides, a column\'s one, a square\'s all six; the side behind is the rear');
    var sr = fday(41, function (s) { var g = on(s, 'sg1', [8, 5]); g.form = 'line'; g.face = 0; var p = on(s, 'patrol', [7, 5]); p.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; });
    var ra = atk1(sr, 'patrol'), rb = atk1(sr, 'sg1');
    ok(ra && ra.asp === 'rear' && ra.cls === 'AF' && !rb, 'p.16: the patrol takes a band from behind -- Heavy Foot fights as Armored Foot, and the band strikes nothing back in the first round' + (ra ? ' (' + ra.asp + ', ' + ra.cls + ')' : ''));
    var sl = fday(42, function (s) { var g = on(s, 'sg1', [8, 5]); g.form = 'line'; g.face = 1; var p = on(s, 'patrol', [7, 5]); p.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; });
    var fa = atk1(sl, 'patrol'), fb2 = atk1(sl, 'sg1');
    ok(fa && fa.asp === 'flank' && fa.cls === 'AF' && fb2 && fb2.tg === 'patrol', 'p.16: from the flank, a class up -- and the band strikes back');
    ok(tk(function () { var sf = SN.newGame(51); sf.party8 = null; SN.dawn(sf); var pf = SN.unit(sf, 'patrol'), m0 = SN.moveOf(pf);
      SN.setForm(sf, pf, 'column'); var free = !pf.reformed && SN.moveOf(pf) === m0;
      sf.day = 15; SN.dawn(sf); SN.setForm(sf, pf, 'line'); var half = pf.reformed && SN.moveOf(pf) === Math.max(1, Math.floor(m0 / 2));
      SN.setForm(sf, pf, 'column'); return free && half && !pf.reformed && SN.moveOf(pf) === m0; }),
      'RULED 10-15: a formation set on Day 14 before the first orders is free; a change after costs half the day\'s move; back to the dawn\'s costs nothing');
    ok(tk(function () { var sq = SN.newGame(52); SN.dawn(sq); var pq = SN.unit(sq, 'patrol'); return !SN.setForm(sq, SN.unit(sq, 'bat3'), 'square') && SN.setForm(sq, pq, 'square') && SN.moveOf(pq) === 1; }),
      'p.10: a square is foot only, and holds its ground (a hex a day)');
    var q1 = fday(53, function (s) { var g = on(s, 'gk1', [8, 5]); g.form = 'square'; var b = on(s, 'bat3', [7, 5]); b.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; });
    var q2 = fday(53, function (s) { var g = on(s, 'gk1', [8, 5]); g.form = 'line'; g.face = 3; var b = on(s, 'bat3', [7, 5]); b.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; });
    ok(atk1(q1, 'bat3') && !atk1(q1, 'bat3').imp && atk1(q2, 'bat3') && atk1(q2, 'bat3').imp, 'p.10: horse charging a square get no charge die; the same charge on a line\'s front does');
    var c5 = fday(54, function (s) { var g = on(s, 'gk1', [8, 5]); g.form = 'line'; g.face = 3; g.reformed = true; var p = on(s, 'patrol', [7, 5]); p.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; });
    ok(atk1(c5, 'patrol') && atk1(c5, 'patrol').asp === 'flank', 'p.10: a unit caught in a fight the day it changed formation is flanked -- the patrol hits the band\'s front as a flank');
    ok(SN.ROADS.every(function (rd) { return rd.hexes.every(function (x, i) { return !i || SN.dist(x, rd.hexes[i - 1]) === 1; }); }), 'every road runs hex to neighbouring hex (the Pit road and the pirate road each skipped one)');
    ok(tk(function () { var cr = SN.newGame(55); SN.dawn(cr); var pc = SN.unit(cr, 'patrol'), p = SN.path([9, 8], [8, 2]); SN.setForm(cr, pc, 'line'); var l1 = SN.reach(pc, p).length; SN.setForm(cr, pc, 'column'); var c1 = SN.reach(pc, p).length; return p.every(SN.road) && c1 === l1 + 1; }),
      'a column on the road marches a hex further (the seat\'s reading, ruled with the formations); the march from the Pit keeps to the road');
    // ---- whole battles, both hands, the party's part on the tables
    var heads = 0, grids = 0, maps = 0, fills = 0, bands = 0, ends = [], domOk = true, inv = [], dom0 = [], nightShared = 0;
    for (var seed = 1; seed <= 8; seed++) {
      var s = SN.newGame(seed * 7919); s.party8 = null; var deeps = [], days = 0;
      while (!s.over && days++ < 40) {
        SN.dawn(s);
        if (s.domIn && dom0.indexOf(seed) < 0) { dom0.push(seed); if (s.day !== s.huntDay + 2) domOk = false; }
        SN.AI.ours(s); play(s, deeps);
        s.units.forEach(function (u) {
          if (u.figs < 0 || u.figs > Math.max(u.figs0, 0)) inv.push(seed + ':' + u.id + ' figs ' + u.figs + '/' + u.figs0);
          if (SN.alive(u) && (!SN.on(u.at) || SN.cost(u.at) >= 99)) inv.push(seed + ':' + u.id + ' stands off the map or in the lake ' + u.at);
        });
        if (s.head && s.units.some(function (u) { return u.side === 'gnoll' && SN.alive(u) && !u.watch && u.state === 'ok'; })) inv.push(seed + ': a gnoll unit still snooting after the head');
        var shared = SN.contested(s); if (shared.length) { nightShared++; if (nightShared <= 2) inv.push(seed + ': Day ' + (s.over ? s.day : s.day - 1) + ' ends with enemies sharing ' + shared.map(SN.key).join(' ')); } // (RULED 10-14 night: no hex ends the day shared)
      }
      if (s.head) { heads++; if (s.head.how === 'grid') grids++; else maps++; }
      fills += s.stats.witness; bands += deeps.filter(function (k) { return k === 'band'; }).length;
      ends.push('seed ' + seed * 7919 + ': ' + (s.over ? 'over Day ' + s.day : 'NOT OVER') + (s.head ? ', head Day ' + s.head.day + ' (' + s.head.how + ')' : ', no head') + ', score ' + (s.tally ? s.tally.score : '?') + ', witness ' + s.stats.witness);
      var txt = s.log.map(function (l) { return l.text; }).join('\n');
      if (seed === 1 && /[?&]dump\b/.test(location.search)) s.log.forEach(function (l) { out.push('LOG d' + l.day + ' [' + l.kind + '] ' + l.text); });
      if (/undefined|NaN|\[object/.test(txt)) inv.push(seed + ': the log says ' + (/undefined|NaN|\[object[^\]]*\]/.exec(txt) || [''])[0]);
      if (!s.over) inv.push(seed + ': the battle never ended');
      if (s.over && !s.tally) inv.push(seed + ': over with no tally');
    }
    ends.forEach(function (e) { out.push('     ' + e); });
    ok(!inv.length, 'eight whole battles keep every invariant' + (inv.length ? ': ' + inv.slice(0, 6).join('; ') : ''));
    ok(heads >= 6, 'the head falls in most battles (' + heads + ' of 8: ' + grids + ' on the grid, ' + maps + ' on the map)');
    ok(domOk && dom0.length >= 6, 'the Dominion comes on the west road two days after the hunt began (' + dom0.length + ' battles)');
    ok(fills > 0, 'the witness fills a winner somewhere (' + fills + ' figures went over in eight battles)');
    ok(bands > 0, 'the four fight a war-band on the grid somewhere (' + bands + ' asks)');
    out.push('SNOOTPROBE ' + out.filter(function (l) { return /^(ok|FAIL)/.test(l); }).length + ' checks, ' + (bad ? bad + ' FAILED' : 'all ok'));
    return out;
  };
})();
