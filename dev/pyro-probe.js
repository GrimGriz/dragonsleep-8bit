/* Pyro's measure on the grid (dev/pyro-probe.py; 09-30b). Checks the sheet, the three phases, his fall, the Mace of Disruption, the
   King's Mantle, the Pocket DM's Pyro, and a whole road fight run through with him walking. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, checks = [], errs = [];
  D.sfx = function () {}; D.music = function () {}; D.clip = function (u, done) { if (done) done(); };
  function ok(name, v) { checks.push([name, !!v]); }
  function drain(g) { var v, n = 0; while (g && n++ < 200000) { var r = g.next(v); v = undefined; if (r.done) return r.value; var y = r.value; if (y && y.prompt) v = y.prompt.opts[0].value; if (y && y.turn) v = { do: 'end' }; } }
  function sheet() { var R = DS.R, dd = DS.DATA.heroes.pyro, h = R.makeHero('pyro', dd.level); h.attacks = dd.attacks; h.resist = dd.resist; h.guest = true; h.surgeAI = !!dd.surgeAI; h.script = dd.script; h.key = 'pyro'; return h; }
  function battle(fid, o) { var d = D.save.fixture(o.lvl || 5); d.guests = [sheet()]; var B = new D.Battle(Object.assign({ fight: fid, data: d, bench: true }, o)); D.battle = B; B.enter(); return B; }
  function king(B) { return B.units.filter(function (u) { return u.script === 'measure'; })[0]; }
  function swings(B) { var n = []; var a0 = B.attack; B.attack = function* (att, tgt, atk) { if (att.script === 'measure') n.push(atk.id || atk.name); return yield* a0.apply(this, arguments); }; return n; }
  function cardsOf(B) { var got = []; var c0 = B.card; B.card = function (lines) { got.push((lines || []).join(' | ')); return c0.apply(this, arguments); }; return got; }
  // stand him beside a foe (and make that foe hard to kill, so every swing has somewhere to go)
  function beside(B, P, f) {
    var G = D.grid;
    for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) { var x = f.x + dx, y = f.y + dy; if ((dx || dy) && G.canStand(P, x, y)) { P.x = x; P.y = y; return true; } }
    return false;
  }
  try {
    var h = sheet();
    ok('the 8-bit sheet: level ' + h.lvl + ', HP ' + h.maxhp + ', AC ' + DS.R.ac(h) + ', attacks ' + DS.R.attacksPerTurn(h) + ', script ' + h.script, h.lvl === 12 && h.maxhp === 112 && DS.R.ac(h) === 21 && DS.R.attacksPerTurn(h) === 3 && h.script === 'measure');
    ok('the King\'s Mantle: +' + DS.R.spellSave(h) + ' against spells', DS.R.spellSave(h) === 5);

    // ---- the measure, on a road fight (the cut seal), held as the 8-bit game holds him
    var B = battle('cutseal', { measure: true, lvl: 5 }), P = king(B);
    ok('on the grid: ' + (P && P.name) + ' lvl ' + (P && P.lvl) + ', main ' + (P && P.weapon.id) + ', off ' + (P && P.offhand && P.offhand.id) + ', AC ' + (P && D.rules.ac(P)), P && P.lvl === 12 && P.weapon.id === 'mace' && P.offhand && P.offhand.id === 'macedisruption' && !!P.offhand.disrupt && P.offhand.magic && D.rules.ac(P) === 21);
    var foe = B.units.filter(function (u) { return u.side === 'foe'; })[0];
    B.units.filter(function (u) { return u.side === 'foe'; }).forEach(function (f) { f.hp = f.maxhp = 999; });
    ok('stood beside the ' + foe.name, beside(B, P, foe));
    var sw = swings(B);
    D.rules.startTurn(P); drain(D.scripts.measure(B, P));
    ok('phase 1: one swing of the plain mace (' + sw.join(',') + '), phase ' + B.pyro.phase, B.pyro.phase === 1 && B.pyro.held && sw.length === 1 && sw[0] === 'mace');
    ok('phase 1: the white mace at his belt, no light off it', P.offhandSheathed && !D.light.carried(P).some(function (l) { return l.kind === 'weapon'; }));
    var ours = B.units.filter(function (u) { return u.side === 'party' && !u.guest && !u.familiar; });
    ours[0].hp = 0; ours[0].ko = true;
    drain(D.scripts.watch(B));
    ok('phase 2 when one of the party is down: phase ' + B.pyro.phase + ', why ' + B.pyro.why, B.pyro.phase === 2 && B.pyro.why === 'down');
    var ls = D.light.carried(P).map(function (l) { return [l.bright, l.dim, l.kind]; });
    ok('the white mace drawn, and lit: ' + JSON.stringify(ls), ls.some(function (l) { return l[0] === 20 && l[1] === 20 && l[2] === 'weapon'; }));
    sw.length = 0; D.rules.startTurn(P); drain(D.scripts.measure(B, P));
    ok('phase 2: two swings, one a hand (' + sw.join(',') + ')', sw.length === 2 && sw[0] === 'mace' && sw[1] === 'macedisruption');
    ours[1].left = true; ours[1].dead = true;
    drain(D.scripts.watch(B));
    ok('phase 3 when one has left the fight: phase ' + B.pyro.phase + ', main ' + P.weapon.id + ', off ' + P.offhand.id, B.pyro.phase === 3 && P.weapon.id === 'macedisruption' && P.offhand.id === 'mace');
    sw.length = 0; D.rules.startTurn(P); P.feats.actionSurge = 0; drain(D.scripts.measure(B, P));
    ok('phase 3: five swings -- three white, the plain one in the action, the plain one the bonus (' + sw.join(',') + ')', sw.length === 5 && sw.slice(0, 3).every(function (s) { return s === 'macedisruption'; }) && sw[3] === 'mace' && sw[4] === 'mace');
    // Action Surge with two in reach
    var foe2 = B.units.filter(function (u) { return u.side === 'foe' && u !== foe; })[0], G = D.grid, placed = false;
    for (var dx = -1; dx <= 1 && !placed; dx++) for (var dy = -1; dy <= 1 && !placed; dy++) { var x = P.x + dx, y = P.y + dy; if ((dx || dy) && !(x === foe.x && y === foe.y) && G.canStand(foe2, x, y)) { foe2.x = x; foe2.y = y; placed = true; } }
    sw.length = 0; D.rules.startTurn(P); P.feats.actionSurge = 1; drain(D.scripts.measure(B, P));
    ok('phase 3 with two in reach: Action Surge, nine swings (' + sw.length + ')', placed && sw.length === 9 && P.feats.actionSurge === 0);
    // the Mantle
    P.feats.indomitable = 0; B.spellNow = true; var s1 = D.rules.save(P, 'wis', 30); B.spellNow = false; var s2 = D.rules.save(P, 'wis', 30);
    ok('the Mantle: +5 on a save against a spell (' + s1.bonus + ' against ' + s2.bonus + ')', s1.bonus - s2.bonus === 5 && s1.cloak === 5);
    // his fall
    P.hp = 0; P.ko = true; drain(D.scripts.watch(B));
    ok('down: over() says ' + B.over() + ', the measure ' + JSON.stringify(B.pyro), B.over() === 'pyro' && B.pyro.down);
    drain(B.finish(B.over()));
    ok('the fight ends: ' + B.result, B.result === 'lost');

    // ---- the Mace of Disruption at the dead (the crypt's skeletons), on the ladder: at full from the first
    var C = battle('crypt', { lvl: 5 }), Q = king(C), cards = cardsOf(C);
    drain(D.scripts.watch(C));
    ok('on the ladder he fights at full from the first: phase ' + C.pyro.phase + ', held ' + C.pyro.held + ', main ' + Q.weapon.id, C.pyro.phase === 3 && !C.pyro.held && Q.weapon.id === 'macedisruption');
    var sk = C.units.filter(function (u) { return u.side === 'foe'; })[0];
    sk.hp = sk.maxhp = 200; beside(C, Q, sk);
    var got = false;
    for (var i = 0; i < 40 && !got; i++) { cards.length = 0; drain(C.attack(Q, sk, Q.weapon)); got = cards.some(function (c) { return /disruption 2d6/.test(c); }); }
    ok('a hit on a skeleton: +2d6 radiant (' + (cards.filter(function (c) { return /disruption/.test(c); })[0] || '').slice(0, 160) + ')', got);
    var sk2 = C.units.filter(function (u) { return u.side === 'foe' && u !== sk && !u.dead; })[0], seen = null;
    for (var j = 0; j < 60 && !seen; j++) { sk2.hp = 20; sk2.dead = false; delete sk2.conds.frightened; beside(C, Q, sk2); cards.length = 0; drain(C.attack(Q, sk2, Q.weapon)); seen = cards.filter(function (c) { return /the mace of disruption/.test(c); })[0] || null; }
    ok('left at 25 or fewer: WIS 15 or destroyed (' + (seen || '').replace(/\{[a-z\/]*\}/g, '').slice(0, 140) + ')', !!seen && (sk2.dead || sk2.hp <= 0 || !!sk2.conds.frightened));

    // ---- the Pocket DM's Pyro
    var np = D.npc.build('pyro', 12, 'foe');
    ok('?npc=pyro: lvl ' + np.lvl + ', HP ' + np.maxhp + ', AC ' + D.rules.ac(np) + ', script ' + np.script + ', off ' + (np.offhand && np.offhand.id) + ', STR ' + np.abil.str, np.lvl === 12 && np.maxhp === 112 && D.rules.ac(np) === 21 && np.script === 'measure' && np.offhand && np.offhand.id === 'macedisruption');
    var nf = D.npc.build('fighter', 12, 'foe');
    ok('a generic fighter still stops at 9 (' + nf.lvl + ')', nf.lvl === 9);

    // ---- a whole road fight with him walking, the party run by the AI: nothing thrown
    var runs = [];
    for (var k = 0; k < 3; k++) {
      var F = battle('cutseal', { measure: true, lvl: 6 });
      F.units.forEach(function (u) { if (u.side === 'party' && !u.familiar) { u.guest = true; u.classAI = true; } }); // (run by the AI; the measure still watches the four)
      F.units.forEach(function (u) { if (u.side === 'party' && !u.familiar && u.script !== 'measure') u.guest = false; }); // (but they count as the party)
      // (heroTurn would ask for the player: run them by the tactics instead)
      var ht0 = F.heroTurn; F.heroTurn = function* (u) { yield* D.ai.turn(this, u); };
      var v, g = 0; while (F.co && g++ < 400000) { var r; try { r = F.co.next(v); } catch (e) { errs.push(String(e && e.stack || e).slice(0, 500)); break; } v = undefined; if (r.done) break; var y = r.value; if (y && y.prompt) v = y.prompt.opts[0].value; if (y && y.turn) v = { do: 'end' }; }
      runs.push((F.result || 'none') + ' R' + F.round + ' phase ' + (F.pyro && F.pyro.phase) + (F.pyro && F.pyro.down ? ' DOWN' : ''));
    }
    ok('three road fights run through (' + runs.join('; ') + ')', runs.length === 3 && !errs.length);
  } catch (e) { errs.push(String(e && e.stack || e).slice(0, 800)); }
  var pre = document.createElement('pre'); pre.textContent = 'PYROPROBE ' + JSON.stringify({ checks: checks, errors: errs });
  document.body.appendChild(pre);
})();
