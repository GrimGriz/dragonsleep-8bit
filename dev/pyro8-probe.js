/* Pyro's measure in the 8-bit battle (dev/pyro8-probe.py; 09-30b): the guest sheet, the three phases, half the XP, the RUN, his fall,
   the Mace of Disruption at the dead, a grid fight's measure coming back through the seam, and a whole road fight run through. */
(function () {
  var DS = window.DS, T = window.T, R = DS.R, out = { checks: [], errors: [] };
  function check(what, ok) { out.checks.push([what, !!ok]); }
  DS.DATA = window.DS_DATA;
  try { DS.initCanvas(); } catch (e) { }
  ['sfx', 'play', 'stop'].forEach(function (k) { if (DS.audio) DS.audio[k] = function () { }; });
  var pending = [];
  DS.W8.scene = function (sc) { return { start: function (script) { var self = this; sc.onClose = function (res) { self.finished = true; self.result = res; pending.push(function () { script.resume(self, res); }); }; DS.push(sc); } }; };
  var step0 = T.step;
  T.step = function (n) { for (var i = 0; i < (n || 1); i++) { step0(1); while (pending.length) pending.shift()(); } };
  function drain(g) { var n = 0, r; do { r = g.next(); } while (!r.done && n++ < 100000); return r.value; }
  function battleNow(list) { T.startFight(list); for (var w = 0; w < 400 && !DS.find('battle'); w++) T.step(1); return DS.find('battle'); }
  function said() { return (T.blog || []).join(' | '); }
  // (the dice seeded, 10-06, the 8-bit battle lane §2.7: "left at 25 or fewer" went RED about one run in ten on unseeded dice -- a 12-HP undead a strong blow
  // kills outright, and then neither line is said; seeded, the probe reads the same every run)
  if (DS.seedDice) DS.seedDice(930);
  try {
    SETUP(6);
    var g = DS.G;
    DS.EV.addGuest('pyro');
    var ph = g.guests[0].h;
    check('the guest: ' + ph.name + ' lvl ' + ph.lvl + ', HP ' + ph.maxhp + ', AC ' + R.ac(ph) + ', script ' + ph.script + ', off ' + ph.equip.offhand + ', cloak ' + ph.equip.cloak, ph.lvl === 12 && ph.maxhp === 112 && R.ac(ph) === 21 && ph.script === 'measure' && ph.equip.offhand === 'macedisruption');
    check('the road weighs him as one and a half: ' + DS.EV.guestWeight(), DS.EV.guestWeight() === 1.5);

    // ---- the phases, in one fight with two ogres (tough enough to swing at)
    var b = battleNow(['ogre', 'ogre']), pu = b.heroes.filter(function (u) { return u.guest && u.h.id === 'pyro'; })[0];
    b.foes.forEach(function (f) { f.hp = f.maxhp = 999; });
    var calls = [], ha0 = b.heroAttack;
    b.heroAttack = function* (u, t, st) { if (u === pu) calls.push((st.w ? st.w.name : 'default') + ' x' + (st.n || 'n')); yield* ha0.apply(this, arguments); };
    drain(DS.scripts8.measure.call(b, pu));
    check('phase 1: one swing of the plain mace (' + calls.join(', ') + ')', calls.length === 1 && calls[0] === 'Mace x1');
    var xp0 = g.party.map(function (h) { return h.xp; });
    g.party[1].hp = 0; g.party[1].ko = true;
    drain(DS.scripts8.watch(b));
    var xp1 = g.party.map(function (h) { return h.xp; });
    check('phase 2 when one of the party is down: phase ' + b.pyro8.phase + '; the words said: ' + /Winters/.test(said()) + '; the fight\'s XP to be halved ' + b.xpHalf + '; the party\'s own XP untouched ' + xp0.join('/') + ' -> ' + xp1.join('/'), b.pyro8.phase === 2 && /Winters/.test(said()) && /XP will be halved/.test(said()) && b.xpHalf && xp1.every(function (x, i) { return x === xp0[i]; }));
    calls.length = 0; drain(DS.scripts8.measure.call(b, pu));
    check('phase 2: two swings, one a hand (' + calls.join(', ') + ')', calls.length === 2 && calls[0] === 'Mace x1' && calls[1] === 'Mace of Disruption x1');
    // the RUN: forced to succeed
    var d0 = DS.d; DS.d = function (n) { return n === 20 ? 20 : d0.apply(this, arguments); };
    b.o.canRun = true;
    drain(b.tryRun(b.heroes[0]));
    DS.d = d0;
    check('the party runs from an 8-bit fight: over ' + b.over + ', phase ' + b.pyro8.phase + ' -- no harm, no foul', b.over === 'run' && b.pyro8.phase === 2 && !/Run, then/.test(said()));
    calls.length = 0; b.over = null; b.pyro8.phase = 3; pu.h.feats.actionSurge = 0; drain(DS.scripts8.measure.call(b, pu)); b.over = 'run';
    check('(his full turn, forced: the white mace in his main hand, five swings: ' + calls.join(', ') + ')', calls.length === 3 && calls[0] === 'Mace of Disruption x3' && calls[1] === 'Mace x1' && calls[2] === 'Mace x1');
    drain(b.finish());
    check('and the run ends as a run: no load screen (' + (DS.top() && DS.top().kind) + ')', !(DS.top() && DS.top().constructor === DS.PyroFail));
    while (DS.find('battle')) DS.pop(DS.find('battle'));

    // ---- his fall
    SETUP(6); g = DS.G; DS.EV.addGuest('pyro');
    var b2 = battleNow(['ogre']), p2 = b2.heroes.filter(function (u) { return u.guest && u.h.id === 'pyro'; })[0];
    p2.h.hp = 0; p2.h.ko = true; b2.checkEnd();
    check('down: over ' + b2.over, b2.over === 'pyro');
    drain(b2.finish());
    var pf = DS.top(); for (var tt = 0; tt < 160 && pf && pf.update; tt++) pf.update();
    var cv8 = document.createElement('canvas'); cv8.width = 256; cv8.height = 240; var drew = true; try { pf.draw(cv8.getContext('2d')); } catch (e) { drew = 'threw: ' + e; }
    check('and the save is loaded: ' + (pf && pf.why) + ', his line "' + DS.DATA.text['fail.pyroDown'].t + '", the one choice ' + JSON.stringify(pf && pf.menu && pf.menu.items.map(function (i) { return i.label; })) + ', drawn ' + drew, pf && pf.constructor === DS.PyroFail && pf.why === 'down' && drew === true && /obviously that didn/.test(DS.DATA.text['fail.pyroDown'].t));
    DS.pop(DS.top());
    while (DS.find('battle')) DS.pop(DS.find('battle'));

    // ---- the Mace of Disruption at the dead (a wisp? the 8-bit's undead)
    SETUP(6); g = DS.G; DS.EV.addGuest('pyro');
    var und = Object.keys(DS.DATA.monsters).filter(function (k) { return (DS.DATA.monsters[k].tags || [])[0] === 'undead'; });
    var b3 = battleNow([und[0]]), p3 = b3.heroes.filter(function (u) { return u.guest && u.h.id === 'pyro'; })[0], white = R.item('macedisruption');
    var hitSeen = false;
    for (var i = 0; i < 40 && !hitSeen; i++) { var f3 = b3.foes[0]; f3.hp = 200; f3.dead = false; T.blog = []; drain(b3.heroAttack(p3, f3, { actions: 1, bonus: 0, sneakUsed: true, w: white, n: 1 }, null)); hitSeen = /Disruption!/.test(said()); }
    check('a hit on the ' + und[0] + ': Disruption! (' + (said().match(/[^|]*Disruption![^|]*/) || [''])[0].trim() + ')', hitSeen);
    var gone = false;
    for (var j = 0; j < 60 && !gone; j++) { var f4 = b3.foes[0]; f4.hp = 12; f4.dead = false; f4.fade = 0; delete f4.conds.frightened; T.blog = []; drain(b3.heroAttack(p3, f4, { actions: 1, bonus: 0, sneakUsed: true, w: white, n: 1 }, null)); gone = /Destroyed!|Frightened!/.test(said()); }
    check('left at 25 or fewer: ' + (said().match(/Destroyed!|Frightened!/) || ['nothing'])[0], gone);
    while (DS.find('battle')) DS.pop(DS.find('battle'));

    // ---- a grid fight's measure back through the seam: phase 2 takes half the XP at the ending
    SETUP(6); g = DS.G; DS.EV.addGuest('pyro');
    var xa = g.party.map(function (h) { return h.xp; });
    var b5 = new DS.Battle({ enemies: ['ogre'], bg: 'cavern' }); b5.over = 'win'; b5.fromDeep = true; b5.foes.forEach(function (f) { f.dead = true; });
    DS.pyroBack = { phase: 2, held: true, down: false };
    T.blog = []; DS.push(b5); // (enter(): fromDeep runs only the ending)
    for (var s5 = 0; s5 < 3000 && DS.find('battle'); s5++) { var t5 = DS.top(); if (t5 && t5.kind === 'dialog') { if (t5.chars < t5.pageLen()) t5.chars = t5.pageLen(); T.tapf('a'); } else T.step(1); }
    var xb = g.party.map(function (h) { return h.xp; });
    // (the guests stand in the split since 7c05f91, RULED 10-05, Griz: "count guests as 'standing' for xp." -- the four and Pyro: five shares)
    var split = g.party.filter(function (h) { return !h.ko; }).length + b5.heroes.filter(function (u) { return u.guest && !(u.h.ko || u.h.hp <= 0); }).length;
    var ogreXp = DS.R.CR_XP[DS.DATA.monsters.ogre.cr], want = Math.floor(Math.floor(ogreXp / 2) / split);
    check('the grid said phase 2: the fight\'s XP halved at the ending (' + xa.join('/') + ' -> ' + xb.join('/') + '; the ogre\'s ' + ogreXp + ', halved and shared ' + want + ' each among ' + split + ', Pyro one)', split === 5 && xb.every(function (x, i) { return x - xa[i] === want; }) && !DS.pyroBack);
    while (DS.find('battle')) DS.pop(DS.find('battle'));

    // ---- a whole road fight, driven: nothing thrown
    SETUP(6); g = DS.G; DS.EV.addGuest('pyro');
    T.startFight(['bugbear', 'hobgoblin', 'hobgoblin']);
    var steps = 0;
    for (var w = 0; w < 400 && !DS.find('battle'); w++) T.step(1);
    while (steps++ < 8000 && DS.find('battle') && !DS.lastError) {
      var top = DS.top(), k = top && top.kind;
      if (k === 'menu') { var its = top.menu.items, ix = its.findIndex(function (it) { return it.label === 'FIGHT' && !it.disabled; }); top.menu.i = ix >= 0 ? ix : 0; T.tapf('a'); }
      else if (k === 'target') { top.i = 0; T.tapf('a'); }
      else if (k === 'dialog') { if (top.chars < top.pageLen()) top.chars = top.pageLen(); T.tapf('a'); }
      else T.step(1);
    }
    var bl = said();
    check('a road fight run through: ' + (DS.find('battle') ? 'still running' : 'over') + ' after ' + steps + ' steps; Pyro swung: ' + (bl.match(/Pyro[^|]*(hits|misses)/g) || []).length + ' times; error ' + (DS.lastError ? String(DS.lastError).slice(0, 120) : 'none'), !DS.lastError && !DS.find('battle'));
  } catch (e) { out.errors.push(String(e && e.stack || e).slice(0, 800)); }
  if (DS.lastError) out.errors.push('lastError: ' + String(DS.lastError.stack || DS.lastError).slice(0, 600));
  var p = document.createElement('pre'); p.textContent = 'PYRO8 ' + JSON.stringify(out); document.body.appendChild(p);
})();
