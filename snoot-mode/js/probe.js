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
    ok(Y.figs === 6 && Z.figs === Z.figs0, 'witness: three hexes off gives nothing, the death-watch gives nothing');
    W.figs = 5; X.figs = 5; SN.witness(st, W);
    ok(W.figs === 6 && X.figs === 4, 'witness: never past the winner\'s starting size (6): the giver keeps the rest (' + X.figs + ')');
    // ---- the warlock by the book (CHAINMAIL pp.30-33; RULED 10-15: "Book basics for sure")
    function domDay(seed, setup) { var s = SN.newGame(seed); s.party8 = null; s.units.forEach(function (u) { u.on = false; }); s.beats = []; SN.DOMINION.forEach(function (f) { s.units.push(SN.make(f, false)); }); setup(s); var g = SN.resolve(s), r = g.next(); while (!r.done) { var v = r.value; r = g.next(v && v.deep ? SN.standIn(s, v.deep) : undefined); } return s; }
    function on(s, id, at) { var u = SN.unit(s, id); u.on = true; u.state = 'ok'; u.at = at.slice(); u.order = { type: 'hold' }; return u; }
    ok(SN.POINTS.wizard === 80, 'p.33: a warlock is worth 80 points (was ' + SN.POINTS.wizard + ')');
    ok(SN.SAVES && SN.SAVES.hero === 9 && SN.SAVES.superhero === 6 && SN.SAVES.wraith === 7, 'p.31: a missile\'s saves -- heroes 9+, super-heroes 6+, wraiths 7+');
    ok(SN.bonus({ figs: 1, heroes: [{ type: 'wizard' }] }) === 0 && SN.bonus({ figs: 1, heroes: [{ type: 'hero' }] }) === 1 && SN.bonus({ figs: 1, heroes: [{ type: 'wraith' }] }) === 0, 'p.30: a hero adds 1 to his unit\'s dice; a wizard or a wraith adds nothing');
    var sw = domDay(11, function (s) { on(s, 'bat2', [8, 5]); var d = on(s, 'dm1', [8, 4]); d.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; });
    ok(sw.beats.some(function (b) { return b.t === 'atk' && b.u === 'dm1' && b.wiz && b.cls === 'AF' && b.f === 2; }), 'p.30: the patrol lady fights as two Armored Foot, her own dice');
    ok(sw.beats.some(function (b) { return b.t === 'shock' && b.by === 'dm1'; }), 'p.30: a wizard affects enemy morale as a super-hero -- her charge makes them check');
    var sv = domDay(12, function (s) { var b = on(s, 'bat2', [8, 5]); b.figs = b.figs0 = 60; var d = on(s, 'dm1', [8, 5]); d.figs = 0; });
    var vol = sv.beats.filter(function (b) { return b.t === 'atk' && b.volley && b.tg === 'dm1'; })[0];
    ok(vol && vol.dice.some(function (x) { return x >= vol.need; }) && vol.k === 0, 'p.30: a wizard is impervious to normal missiles -- the volley hits and kills nothing' + (vol ? ' ([' + vol.dice.filter(function (x) { return x >= vol.need; }).length + ' hits] -> ' + vol.k + ')' : ' (no volley at her)'));
    var sl = domDay(13, function (s) { on(s, 'bat2', [8, 5]); on(s, 'patrol', [8, 5]); on(s, 'dm2', [8, 5]); });
    ok(sl.beats.some(function (b) { return b.t === 'fb' && b.kind === 'lightning' && (b.tgs || []).length === 2; }), 'p.31: a lightning bolt strikes along a line -- two units');
    // (the first day of these whose fire ball falls on the patrol -- on some the patrol shies from her charge before a round is fought)
    var sf = null, sfs = 0; for (var q4 = 14; q4 < 90 && !sf; q4++) { var sx4 = domDay(q4, function (s) { on(s, 'patrol', [8, 5]); var d = on(s, 'dm1', [8, 4]); d.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; }); if (sx4.beats.some(function (b) { return b.t === 'fb' && b.tg === 'patrol'; })) { sf = sx4; sfs = q4; } }
    ok(sf && sf.beats.some(function (b) { return b.t === 'save' && b.need === 9; }), 'p.31: the fire ball falls on the paladin\'s unit and the paladin rolls his save (9+)' + (sf ? ' (day ' + sfs + ')' : ' (no fire ball fell on the patrol)'));
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
    ok(tk(function () { var sq = SN.newGame(52); SN.dawn(sq); var pq = SN.unit(sq, 'bat1'); return !SN.setForm(sq, SN.unit(sq, 'bat3'), 'square') && SN.setForm(sq, pq, 'square') && SN.moveOf(pq) === 1; }),
      'p.10: a square is foot only, and holds its ground (a hex a day)');
    var q1 = fday(53, function (s) { var g = on(s, 'gk1', [8, 5]); g.form = 'square'; var b = on(s, 'bat3', [7, 5]); b.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; });
    var q2 = fday(53, function (s) { var g = on(s, 'gk1', [8, 5]); g.form = 'line'; g.face = 3; var b = on(s, 'bat3', [7, 5]); b.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; });
    ok(atk1(q1, 'bat3') && !atk1(q1, 'bat3').imp && atk1(q2, 'bat3') && atk1(q2, 'bat3').imp, 'p.10: horse charging a square get no charge die; the same charge on a line\'s front does');
    var c5 = fday(54, function (s) { var g = on(s, 'gk1', [8, 5]); g.form = 'line'; g.face = 3; g.reformed = true; var p = on(s, 'patrol', [7, 5]); p.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; });
    ok(atk1(c5, 'patrol') && atk1(c5, 'patrol').asp === 'flank', 'p.10: a unit caught in a fight the day it changed formation is flanked -- the patrol hits the band\'s front as a flank');
    ok(SN.ROADS.every(function (rd) { return rd.hexes.every(function (x, i) { return !i || SN.dist(x, rd.hexes[i - 1]) === 1; }); }), 'every road runs hex to neighbouring hex (the Pit road and the pirate road each skipped one)');
    ok(tk(function () { var cr = SN.newGame(55); SN.dawn(cr); var pc = SN.unit(cr, 'patrol'), hc = SN.unit(cr, 'bat3'), p = SN.path([9, 8], [8, 2]), q = SN.path([9, 9], [8, 0]), w = SN.path([0, 0], [8, 0]);
      SN.setForm(cr, pc, 'line'); var l1 = SN.reach(pc, p).length; SN.setForm(cr, pc, 'column'); var c1 = SN.reach(pc, p).length;
      SN.setForm(cr, hc, 'line'); var l2 = SN.reach(hc, q).length; SN.setForm(cr, hc, 'column'); var c2 = SN.reach(hc, q).length;
      var dw = SN.make(SN.DOMINION[0], true); dw.at = [0, 0]; var c3 = SN.reach(dw, w).length; dw.form = 'line'; var l3 = SN.reach(dw, w).length;
      return p.every(SN.road) && q.every(SN.road) && c1 === l1 && c2 === l2 + 2 && c3 === l3 + 2; }),
      'p.10 (RULED 10-15, "1 book"): the road bonus is horse\'s and wagons\' -- foot in column march no further; medium horse and the Dominion\'s wagons in column, two hexes further on the road');
    // ---- surprise (OD&D Book III p.9, p.17; RULED 10-15, "2 lean": surprise first)
    function surpDay(seed, three) { return fday(seed, function (s) { var g = on(s, 'sg1', [8, 5]); g.form = 'line'; g.face = 3; ['patrol'].concat(three ? ['bat2', 'bat1'] : []).forEach(function (id) { var p = on(s, id, [7, 5]); p.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; }); }); }
    var sp1 = null, sp3 = null, rolled = 0;
    for (var q3 = 60; q3 < 400 && (!sp1 || !sp3); q3++) {
      if (!sp1) { var s1 = surpDay(q3, false), b1s = s1.beats.filter(function (b) { return b.t === 'surp'; })[0]; if (b1s) rolled++; if (b1s && b1s.side === 'theirs') sp1 = s1; }
      if (!sp3) { var s3 = surpDay(q3, true), b3s = s3.beats.filter(function (b) { return b.t === 'surp'; })[0]; if (b3s && b3s.side === 'theirs' && b3s.circle) sp3 = s3; }
    }
    var a1 = sp1 && atk1(sp1, 'patrol'), a3 = sp3 && atk1(sp3, 'patrol');
    ok(rolled > 0 && a1 && a1.asp === 'flank', 'Book III p.9: each side rolls for surprise as a fight begins; a band caught unready (1-2) is taken in the flank in the first round -- the patrol came at its front' + (a1 ? ' (' + a1.asp + ')' : ' (no band caught unready)'));
    ok(a3 && a3.asp === 'rear' && !atk1(sp3, 'sg1'), 'Book III p.17: three units of ours surprising a band are "moved into a circle" -- from the rear, and the band strikes nothing back in the first round');

    // ---- evasion (OD&D Book III p.20; RULED 10-15: "go on evasion")
    ok(tk(function () { var c = function (u, P, s) { return SN.evadeChance({}, Object.assign({ side: 'ours', cls: 'HF', heroes: [] }, u), P.map(function (x) { return Object.assign({ cls: 'HF', heroes: [] }, x); }), s).c; };
      var big = { figs: 6, figs0: 6 }, half = { figs: 3, figs0: 6 }, lone = { figs: 1, figs0: 6 };
      return c({ figs: 3 }, [big]) === 90 && c({ figs: 5 }, [half]) === 50 && c({ figs: 30 }, [lone]) === 5 && c({ figs: 5 }, [big], { side: 'theirs' }) === 100 && c({ figs: 5 }, [big], { side: 'ours' }) === 0 &&
        c({ figs: 5, heroes: [{ type: 'wizard', missile: 'fireball' }] }, [big], { side: 'ours' }) === 70 && c({ figs: 5, cls: 'LH', mounted: true }, [big]) === 95; }),
      'Book III p.20: the evasion table -- 3 figures from a band at full strength 90%, 5 from one at half 50%, 30 from a remnant 5%; doubled when they were surprised, none when the evader was unless it has magic, +25% twice as fast');
    var ev = null; for (var q5 = 100; q5 < 300 && !ev; q5++) { var se = fday(q5, function (s) { var p = on(s, 'patrol', [8, 5]); p.order = { type: 'avoid' }; var g = on(s, 'sg1', [7, 5]); g.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; }); var eb = se.beats.filter(function (b) { return b.t === 'evade'; })[0]; if (eb && eb.ok) ev = se; }
    var pe = ev && SN.unit(ev, 'patrol');
    ok(ev && !SN.same(pe.at, [8, 5]) && !atk1(ev, 'patrol') && !atk1(ev, 'sg1'), 'Book III p.20: a unit under AVOID that a band comes at rolls to slip a hex away -- and no blow is struck' + (pe ? ' (the patrol now at ' + pe.at + ')' : ''));
    ok(tk(function () { var sd = SN.newGame(61); sd.party8 = null; SN.DOMINION.forEach(function (f) { sd.units.push(SN.make(f, true)); }); var w1 = SN.unit(sd, 'dm1'); w1.at = [8, 3]; SN.AI.dominion(sd, w1); return w1.order.type === 'avoid'; }),
      'the Dominion\'s wagons at the inn are under AVOID (the seat\'s lean, ruled)');
    // ---- one man a figure, the mixed units, his numbers, COMBINE, the grid beside the four (RULED 10-15)
    var FF = function (id) { return SN.FORCES.filter(function (f) { return f.id === id; })[0]; };
    ok(tk(function () { return FF('greyfang').figs === 40 && FF('greyfang').cls === 'HF' && FF('greyfang').def === 'HF' && !FF('greyfang').morale && FF('patrol').groups.map(function (g) { return g.n + g.cls; }).join() === '12HF,4MH' && FF('patrol').wagon && !FF('bows') &&
      FF('bat1').figs === 40 && FF('bat2').figs === 40 && FF('bat3').figs === 20 && [FF('bat1'), FF('bat2'), FF('bat3')].every(function (f) { return f.arrive === 18; }) &&
      FF('bb1').figs + FF('bb2').figs + FF('bb3').figs === 100 && FF('bb1').figs === 60 && FF('bb1').escort && FF('sg1').figs === 18 && FF('sg1').comp.gloryseeker === 3 && FF('sg1').comp.gnoll === 9 && FF('sg1').comp.hyena === 6 && FF('gk1').youngblood; }),
      'his numbers (10-15), one man a figure: the Pit 40 Heavy Foot; the road patrol a paladin, 12 heavy foot, 4 horse and a wagon; Newland\'s 40, 40 and 20 on Day 18; the plains 100, 60 the horse escort; a war-band 18; the Gray Keeping\'s young blood');
    var mx = fday(43, function (s) { var g = on(s, 'sg1', [8, 5]); g.face = 3; var p = on(s, 'patrol', [7, 5]); p.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; });
    var mrows = mx.beats.filter(function (b) { return b.t === 'atk' && b.u === 'patrol' && b.round === 1 && !b.wiz; }), pu = SN.make(FF('patrol'), true);
    ok(mrows.length >= 2 && mrows[0].cls0 === 'HF' && mrows[1].cls0 === 'MH' && Math.abs(SN.rating(pu) - (12 * 5 + 4 * 8) / 16) < 0.06 && SN.moveOf(pu) === 3 && !SN.foot(pu),
      'p.15: a mixed unit rolls each type on its own row (the patrol\'s heavy foot, then its horse), its morale by type, its pace its slowest\'s; no square with horse in it (' + mrows.map(function (b) { return b.cls0; }).join(' ') + ')');
    ok(tk(function () { var sc = SN.newGame(62); sc.party8 = null; SN.dawn(sc); var a = SN.unit(sc, 'patrol'), g = SN.unit(sc, 'greyfang'), big = SN.combine(sc, a, g);
      return big && big.id === 'greyfang' && big.figs === 56 && big.groups.length === 2 && big.groups[0].n === 52 && SN.heroesOf(big).length === 2 && a.state === 'merged' && !SN.alive(a) && !big.reformed && SN.greyfang(sc) === big; }),
      'COMBINE: the patrol joins GreyFang\'s fighters -- one mixed unit of 56 men, the heavy foot together (52) and the horse, both heroes; GreyFang\'s keeps him (the quarry); free on Day 14');
    ok(tk(function () { var sa = SN.newGame(63); sa.party8 = null; SN.dawn(sa); var al = SN.allies(sa, SN.PIT), P = SN.unit(sa, 'party'), b = SN.unit(sa, 'sg1'); b.at = SN.PIT.slice();
      var req = SN.band(sa, [b], SN.PIT); SN.partyResult(sa, P, [b], req, { result: 'won', share: 0.5, dead: 10, allyDead: { patrol: 2 } }, SN.PIT);
      return al.length === 6 && al.every(function (x) { return x.unit === 'greyfang' || x.unit === 'patrol'; }) && req.enemies.length === 18 && req.contrib[0].n === 18 && b.figs === 8 && SN.unit(sa, 'patrol').figs === 14; }),
      'the grid at one man a figure: the band goes whole (18), six men of ours stand beside the four, and what falls there comes off man for man (10 of the band, 2 of the patrol)');
    ok(tk(function () { var se = SN.newGame(64); se.party8 = null; se.day = 16; SN.dawn(se); var e = SN.unit(se, 'bb1'), o = SN.unit(se, 'bb2');
      var s14 = SN.newGame(64); s14.party8 = null; SN.dawn(s14); var y14 = SN.unit(s14, 'gk1');
      return e.order.type === 'move' && SN.same(e.order.to, SN.PIT) && o.order.type === 'move' && !SN.same(o.order.to, SN.PIT) && y14.order.type === 'move'; }),
      'the horse escort marches for the Pit with the herd while the outriders peel off for the Snoot; the Gray Keeping\'s young blood are out from Day 14 (his words 10-15)');
    // ---- a surrender takes the men, never the heroes (p.30; found 10-15 in his play: GreyFang went prisoner with his forty)
    ok(tk(function () { var sp = SN.newGame(65); sp.party8 = null; SN.dawn(sp); var g = SN.unit(sp, 'greyfang'), b = SN.unit(sp, 'sg1'); b.at = [8, 2];
      SN.surrender(sp, g); SN.surrender(sp, b);
      return g.figs === 0 && SN.alive(g) && g.state !== 'prisoner' && SN.greyfang(sp) === g && !SN.same(g.at, SN.PIT) && b.state === 'prisoner' && !SN.alive(b) && sp.stats.prisoners['ours:HF'] === 40; }),
      'p.30: a surrender takes the men, never the heroes -- GreyFang\'s forty are taken, GreyFang cuts free and falls back alone; a band with no hero is taken whole');
    // ---- holding ground (his word 10-15: "are we giving a defense bonus for people in the pit or at the halfway inn or snoot grounds (gnolls)")
    var wP = fday(66, function (s) { on(s, 'greyfang', SN.PIT); var b = on(s, 'sg1', [9, 7]); b.order = { type: 'move', to: SN.PIT.slice(), path: [SN.PIT.slice()] }; });
    var wO = fday(66, function (s) { on(s, 'greyfang', [8, 5]); var b = on(s, 'sg1', [7, 5]); b.order = { type: 'move', to: [8, 5], path: [[8, 5]] }; });
    // (the morale's rating straight off SN.morale: the Pit's forty and GreyFang often end a lone band in the first round, before any morale)
    var morRate = function (walled) { var sm = SN.newGame(68); sm.party8 = null; SN.dawn(sm); var g = SN.unit(sm, 'greyfang'), b = SN.unit(sm, 'sg1'), bf = {}; b.at = SN.PIT.slice(); b.came = [9, 7];
      bf.greyfang = SN.fightFigs(g); bf.sg1 = SN.fightFigs(b); sm.walls = walled ? SN.walls(sm, SN.PIT, [g], [b]) : null; sm.beats = []; SN.morale(sm, [g], [b], bf, SN.PIT);
      return sm.beats.filter(function (x) { return x.t === 'mor'; })[0].parts.ours.rate; };
    var wPa = atk1(wP, 'sg1'), wOa = atk1(wO, 'sg1'), rg = SN.rating(SN.make(FF('greyfang'), true)), mw = tk(function () { return morRate(true); }), mn = tk(function () { return morRate(false); });
    ok(wPa && !wPa.imp && wPa.held && wOa && wOa.imp && !wOa.held && wP.beats.some(function (b) { return b.t === 'walls' && b.units.join() === 'greyfang'; }) && mw === rg + 1 && mn === rg,
      'his word 10-15, holding ground: a band charging GreyFang\'s men in the Pit gets no charge die (p.17: only "across smooth, level terrain") and the Pit\'s men stand a step firmer (morale ' + mn + ' to ' + mw + ') -- the same charge on open ground has its die');
    var wv = null; for (var q6 = 66; q6 < 140 && !wv; q6++) { var sv = fday(q6, function (s) { on(s, 'gk2', SN.MOOT); var c = on(s, 'bat2', [4, 5]); c.order = { type: 'move', to: SN.MOOT.slice(), path: [SN.MOOT.slice()] }; }); var vb = sv.beats.filter(function (b) { return b.t === 'atk' && b.u === 'bat2' && b.volley; })[0]; if (vb && vb.cover >= 2) wv = vb; }
    var pv = tk(function () { var sx = SN.newGame(67); sx.party8 = null; SN.dawn(sx); var g = SN.unit(sx, 'gk2'), c = SN.unit(sx, 'patrol'); g.at = SN.MOOT.slice(); c.at = [4, 5]; return SN.preview(sx, c, SN.MOOT); });
    ok(wv && wv.k === Math.floor(wv.cover / 2) && wv.held && pv && pv.lines.some(function (l) { return l.indexOf('They hold the moot ground') === 0; }),
      'p.12: the Gray Keeping on the moot ground -- the crossbows\' volley at them halved behind their cover (' + (wv ? wv.cover + ' to ' + wv.k : 'no volley of two or more found') + '), and the march\'s pop-up says they hold it');
    // ---- no surrender, and a rout of men joins or disbands (his rules 10-15: "when the humans get routed can we do a 'joins group within two' OR ELSE
    // disbands?", "Rout over surrender for the gnolls as well")
    ok(tk(function () { return SN.react(176) === 'rout' && SN.react(100) === 'rout' && SN.react(85) === 'rout' && SN.react(65) === 'retreat' && SN.react(45) === 'back' && SN.react(25) === 'backoff'; }),
      'his rule 10-15, no one surrenders: a gap of 100 and over routs, as 80-99 does (GreyFang\'s forty at 176 would have run)');
    var rj = tk(function () { var sr = SN.newGame(69); sr.party8 = null; SN.dawn(sr); sr.units.forEach(function (u) { u.on = false; }); sr.beats = [];
      var a = on(sr, 'bat2', [8, 5]), f = on(sr, 'patrol', [8, 3]), p = on(sr, 'bat1', [2, 8]), g = on(sr, 'greyfang', [12, 2]), f0 = f.figs, a0 = a.figs;
      var d = SN.make(SN.DOMINION[0], true); sr.units.push(d); d.on = true; d.state = 'ok'; d.at = [13, 1];
      SN.fallBack(sr, a, 'rout'); var joined = f.figs === f0 + a0 && a.state === 'merged' && !SN.alive(a) && sr.beats.some(function (b) { return b.t === 'wit' && b.kind === 'rally' && b.to === 'patrol' && b.n === a0; });
      var l0 = sr.stats.lost['ours:HF'] || 0; SN.fallBack(sr, p, 'rout'); var pal = p.figs === 0 && SN.alive(p) && p.state === 'retreat' && SN.heroesOf(p).length === 1 && sr.stats.lost['ours:HF'] === l0 + 40;
      var d0 = d.figs; SN.fallBack(sr, d, 'rout'); var dg = d.state === 'gone' && !SN.alive(d) && sr.stats.fled['dominion:' + d.cls] === d0;
      SN.fallBack(sr, g, 'rout'); var gf = SN.greyfang(sr) === g && g.figs === 0;
      var gn = on(sr, 'sg1', [5, 2]); SN.fallBack(sr, gn, 'rout'); return [joined, pal, dg, gf, gn.state === 'rout' && gn.figs === 18 && !SN.same(gn.at, [5, 2])]; });
    ok(rj && rj.every(Boolean), 'his rule 10-15, a rout of men: Newland\'s crossbows run to the road patrol two hexes off and join it; Newland\'s heavy foot with no steady friend in reach scatter, their paladin cut free (p.30); a Dominion wagon\'s men scatter and it is gone; GreyFang\'s men scatter and he cuts free; a gnoll band routs as the book has it (' + (rj ? rj.join(' ') : 'threw') + ')');
    // ---- the Dominion on the grid: each wagon's patrol lady goes, and one who falls there falls on the map (his note 10-15: "there wasn't any warlocks")
    var wl = tk(function () { var sw = SN.newGame(70); sw.party8 = null; SN.dawn(sw); var D3 = SN.DOMINION.map(function (f) { var u = SN.make(f, true); u.at = [7, 0]; sw.units.push(u); return u; }), P = SN.unit(sw, 'party');
      var req = SN.band(sw, D3, [7, 0]), nl = req.enemies.filter(function (e) { return e === 'patrollady'; }).length, i = +Object.keys(req.ladies)[0], ld = {}; ld[req.ladies[i]] = true; sw.beats = [];
      SN.partyResult(sw, P, D3, req, { result: 'won', share: 0.4, dead: 4, ladyDead: ld }, [7, 0]);
      return [nl === 3, req.enemies[i] === 'patrollady', req.contrib.reduce(function (s, c) { return s + c.n; }, 0) === 27, SN.heroesOf(SN.unit(sw, req.ladies[i])).length === 0, (sw.stats.killed['dominion:wizard'] || 0) === 1]; });
    ok(wl && wl.every(Boolean), 'his note 10-15, the Dominion on the grid: three wagons send their three patrol ladies and 27 soldiers (thirty a grid), and a lady killed there dies on the map (' + (wl ? wl.join(' ') : 'threw') + ')');
    // ---- the Gray Keeping's matriarchs (10-16, Griz: "let's give one group a superhero matriarch and the other hero, with clerics with the gray young
    // ones. Give the superhero entangle?"; "all 8 leans are go"): OD&D Book I's clerics -- the Eldest a Patriarch ("Superhero - 1"), the band's a Lama
    var MW = FF('gkw'), MB = FF('gk2'), MY = FF('gk1'), Me = (MW.heroes || [])[0], Ml = (MB.heroes || [])[0];
    ok(!!Me && Me.type === 'superhero' && Me.ft === -1 && eq(Me.prays, ['insectplague', 'entangle']) && Me.grid === 'gnollmatriarcheldest' && MW.def === 'AF' && MW.figs === 11 && MW.cleric && MW.watch &&
      !!Ml && Ml.type === 'hero' && eq(Ml.prays, ['bless']) && Ml.grid === 'gnollmatriarchlama' && MB.relic && MY.cleric && MY.relic && !(MY.heroes || []).length,
      'his design 10-16: the death-watch\'s Eldest a Super-hero at -1 on the Fantasy table (Book I\'s Patriarch of 9th) praying Insect Plague and Entangle, eleven more defending as Armored Foot; the band\'s matriarch a Hero (Book I\'s Lama) who Blesses; clerics with the young blood; the band and the young blood carry a relic');
    // Insect Plague and Entangle: two units of the plains come onto the moot -- the bigger is driven off in rout (berserkers too: no morale check), the
    // other held (no charge die, struck as from the flank); each once that day
    var mp = tk(function () {
      var s = fday(71, function (s) { on(s, 'gkw', SN.MOOT); [['bb2', 20], ['bb3', 20]].forEach(function (x, i) { var u = on(s, x[0], [4, 5]); u.figs = x[1] + (i ? 0 : 4); u.figs0 = u.figs; u.order = { type: 'move', to: SN.MOOT.slice(), path: [SN.MOOT.slice()] }; }); });
      var pr = s.beats.filter(function (b) { return b.t === 'pray'; }), ip = pr.filter(function (b) { return b.id === 'insectplague'; }), en = pr.filter(function (b) { return b.id === 'entangle'; });
      var a3 = atk1(s, 'bb3'), gk = s.beats.filter(function (b) { return b.t === 'atk' && b.u === 'gkw' && b.tg === 'bb3' && b.round === 1; })[0], e = SN.unit(s, 'gkw').heroes[0];
      var b2 = SN.unit(s, 'bb2');
      return [ip.length === 1 && ip[0].tg === 'bb2', s.beats.some(function (b) { return b.t === 'menrun' && b.u === 'bb2'; }) && !(SN.alive(b2) && SN.same(b2.at, SN.MOOT)), en.length === 1 && en[0].tg === 'bb3', !!a3 && !a3.imp, !!gk && gk.asp !== 'front', !!ip[0] && e.prayed.insectplague === ip[0].day && e.prayed.entangle === ip[0].day];
    });
    ok(mp && mp.every(Boolean), 'his design 10-16, the Eldest\'s prayers: Insect Plague drives the bigger unit of the plains off the moot in rout (Book I: "less than three hit dice ... off in rout"), Entangle holds the other -- no charge die, the death-watch strikes it as from the flank -- each once that day (' + (mp ? mp.join(' ') : 'threw') + ')');
    // the heroes stand: the road patrol comes at the moot -- its men are driven off, its paladin stands alone where they were and meets the Eldest on the
    // Fantasy table at her -1
    var mh = tk(function () {
      var s = fday(72, function (s) { on(s, 'gkw', SN.MOOT); var p = on(s, 'patrol', [4, 5]); p.order = { type: 'move', to: SN.MOOT.slice(), path: [SN.MOOT.slice()] }; });
      var run = s.beats.filter(function (b) { return b.t === 'menrun' && b.u === 'patrol'; })[0], ft = s.beats.filter(function (b) { return b.t === 'ft' && b.ah === 'the Eldest'; })[0];
      return [!!run && run.heroes, s.log.some(function (l) { return /stands alone where the men were/.test(l.text); }), !!ft && ft.mod === -1, SN.unit(s, 'patrol').figs === 0];
    });
    ok(mh && mh.every(Boolean), 'his design 10-16: Insect Plague takes the men, never the heroes -- the road patrol\'s men are driven off and its paladin stands alone, meeting the Eldest on the Fantasy table at her -1 (' + (mh ? mh.join(' ') : 'threw') + ')');
    // Entangle holds them: a unit held fast does not fall back on a lost morale -- the melee goes on
    var mm = tk(function () { var s = SN.newGame(73); s.party8 = null; SN.dawn(s); var p = SN.unit(s, 'patrol'), b = SN.unit(s, 'gk2'), bf = {}; p.at = SN.MOOT.slice(); b.at = SN.MOOT.slice(); p.entangled = true; s.beats = [];
      bf.patrol = SN.fightFigs(p) + 40; bf.gk2 = SN.fightFigs(b); var dec = SN.morale(s, [p], [b], bf, SN.MOOT);
      return [dec === false, SN.same(p.at, SN.MOOT), s.beats.some(function (x) { return x.t === 'held' && x.u === 'patrol'; })]; });
    ok(mm && mm.every(Boolean), 'his design 10-16, Entangle: a unit held fast that loses the morale cannot fall back -- the melee goes on (' + (mm ? mm.join(' ') : 'threw') + ')');
    // Bless: the band's matriarch blesses it as its fight begins -- +1 to its dice (a Hero's +1 and the blessing's) and its morale
    var mb = tk(function () {
      var s = fday(74, function (s) { on(s, 'gk2', [5, 5]); var p = on(s, 'bat2', [6, 5]); p.order = { type: 'move', to: [5, 5], path: [[5, 5]] }; });
      var g = SN.unit(s, 'gk2'), a = atk1(s, 'gk2'), pr = s.beats.filter(function (b) { return b.t === 'pray' && b.id === 'bless' && b.u === 'gk2'; });
      return [pr.length === 1, g.blessed, !!a && a.bonus - (a.up || 0) === 2, SN.rating(g) === 8 - (g.fatigued ? 1 : 0)];
    });
    ok(mb && mb.every(Boolean), 'his design 10-16, Bless (Book I: "raises morale by +1 and also adds +1 to attack dice"): the band\'s matriarch blesses it as its fight begins -- +2 on its dice with her own Hero\'s +1, morale 7 to 8 (' + (mb ? mb.join(' ') : 'threw') + ')');
    // only where a relic is (gnoll-hills.md, RULED 08-13d): the death-watch off the moot ground neither prays nor mends; on it, it mends
    var mr = tk(function () {
      var s = fday(75, function (s) { on(s, 'gkw', [5, 5]); var u = on(s, 'bb2', [6, 5]); u.order = { type: 'move', to: [5, 5], path: [[5, 5]] }; });
      var none = !s.beats.some(function (b) { return b.t === 'pray'; });
      var t = SN.newGame(76); t.party8 = null; SN.dawn(t); var w = SN.unit(t, 'gkw'); w.at = [5, 5]; w.figs = 5; SN.dusk(t); var off = w.figs === 5; w.at = SN.MOOT.slice(); SN.dusk(t);
      return [none, off, w.figs > 5, SN.relicHere(SN.unit(t, 'gk1')) && !SN.relicHere(Object.assign({}, w, { at: [5, 5] }))];
    });
    ok(mr && mr.every(Boolean), 'the register, RULED 08-13d ("keepers cast only in a relic\'s presence"): the death-watch off the moot ground neither prays nor mends; on it, with the Mane, it mends at dusk; the young blood carry their relic (' + (mr ? mr.join(' ') : 'threw') + ')');
    // the moot holds (his note 10-16: "I found it a little easy to clear the moot point"): the plains' outriders against the death-watch on the moot,
    // twenty seeds -- with her prayers, and on the tables alone (the Eldest kept from praying): the death-watch and the Eldest still there at nightfall
    var holds = function (pray) { var n = 0; for (var q = 0; q < 20; q++) { var s = fday(300 + q, function (s) { var w = on(s, 'gkw', SN.MOOT); if (!pray) w.heroes[0].prays = []; var u = on(s, 'bb2', [4, 5]); u.order = { type: 'move', to: SN.MOOT.slice(), path: [SN.MOOT.slice()] }; });
      var w = SN.unit(s, 'gkw'); if (SN.alive(w) && SN.same(w.at, SN.MOOT) && SN.heroesOf(w).length) n++; } return n; };
    var hP = tk(function () { return holds(true); }), hT = tk(function () { return holds(false); });
    // (a hundred seeds, 10-16: 100 with her prayers, 76 on the tables alone -- 17 of the 24 lost when the death-watch is caught unready and taken in
    // the flank; the sixty of the horse escort take the moot every time on the tables alone, and never once she prays)
    ok(hP === 20 && hT >= 12, 'his note 10-16 ("a little easy to clear the moot point"): twenty outriders come onto the moot -- the death-watch holds it ' + hP + ' times of 20 with the Eldest\'s prayers, ' + hT + ' of 20 on the tables alone (it was wiped in a round: twelve common gnolls defending as Heavy Foot, no hero)');
    // on the grid: the death-watch sends the Eldest first, then its matriarchs man for man; she falls on the map when she falls there
    var mg = tk(function () { var s = SN.newGame(77); s.party8 = null; SN.dawn(s); var w = SN.unit(s, 'gkw'), P = SN.unit(s, 'party'); w.at = SN.MOOT.slice();
      var req = SN.band(s, [w], SN.MOOT), cd = {}; cd.gkw = [0]; s.beats = [];
      var words = SN.gnollWords(s, req); SN.partyResult(s, P, [w], req, { result: 'won', share: 0.5, dead: 5, chiefDead: cd }, SN.MOOT);
      return [req.enemies[0] === 'gnollmatriarcheldest', eq(req.chiefs[0], ['gkw', 0]), req.enemies.filter(function (k) { return k === 'gnollmatriarchguard'; }).length === 3 && req.enemies.filter(function (k) { return k === 'gnollmatriarch'; }).length === 8 && req.enemies.length === 12, req.contrib[0].n === 11, /the Eldest/.test(words), w.heroes[0].dead, (s.stats.killed['gnoll:superhero'] || 0) === 1]; });
    ok(mg && mg.every(Boolean), 'his design 10-16, the death-watch on the grid: the Eldest (DEEP16\'s cleric 9 of the Keeping, a boss) first, then her three bodyguards (Book II\'s, as trolls) and eight matriarchs, and she dies on the map when she falls there (' + (mg ? mg.join(' ') : 'threw') + ')');
    // the death-watch is the seat-tribe's women: glory's followers do not join it; and the march's pop-up says what waits on the moot
    var mx = tk(function () { var s = SN.newGame(78); s.party8 = null; SN.dawn(s); var w = SN.unit(s, 'gkw'), b = SN.unit(s, 'gk2'), c = SN.unit(s, 'patrol'); w.at = SN.MOOT.slice(); b.at = [2, 5]; w.figs = 4; SN.witness(s, w);
      c.at = [4, 5]; var pv = SN.preview(s, c, SN.MOOT); return [w.figs === 4, b.figs === 18, !!pv && pv.warn.some(function (l) { return /Insect Plague/.test(l); }) && pv.warn.some(function (l) { return /Entangle/.test(l); })]; });
    ok(mx && mx.every(Boolean), 'his design 10-16: the witness never fills the death-watch (the seat-tribe\'s women), and the march\'s pop-up warns of Insect Plague and Entangle on the moot (' + (mx ? mx.join(' ') : 'threw') + ')');
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
