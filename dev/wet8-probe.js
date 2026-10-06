/* THE SETTLING, the 8-bit half (dev/wet8-probe.py; 09-30b): the wet's triggers (back till their creature dies; the ooze's ring), the
   three scripts sending the fight to the grid with the lead's square and the woken one, the bucket in the 8-bit battle, and the seam
   bringing the grid's report home -- the flags, the bucket, the max HP the herd took, the XP of what died. DEEP16 is not run: its
   'd16:done' is dispatched as the iframe would send it (the runner's ledgerlamp8seam way). */
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
  function said() { return (T.blog || []).join(' | '); }
  function pump(cap) { for (var i = 0; i < (cap || 1500); i++) { var tp = DS.top(), k = tp && tp.kind; if (k === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); } else if (k === 'menu') { tp.menu.i = 0; T.tapf('a'); } else T.step(1); } }
  try {
    var wd = DS.DATA.maps.warrens_d, tr = function (id) { return wd.triggers.filter(function (t) { return t.id === id; })[0]; };
    var tj = tr('jelly'), tn = tr('jellyNorth'), tp = tr('poolOoze'), to = tr('ooze');
    check('the jelly\'s spots, both shores, back till it dies: ' + JSON.stringify([tj && tj.rect, tn && tn.rect, tj && tj.cond]), tj && tn && !tj.once && tj.cond === '!flag:jellyDead' && tn.cond === '!flag:jellyDead' && tj.rect.join() === '21,14,4,1' && tn.rect.join() === '22,9,1,1' && tn.script === 'jelly');
    check('the pool ooze at its puddle (' + JSON.stringify(tp && tp.rect) + ', ' + (wd.rows[13][29]) + '), back till it dies; the southern ooze its own 8-bit fight (' + JSON.stringify(to && [to.rect, to.cond]) + ')', tp && tp.rect.join() === '29,13,1,1' && tp.cond === '!flag:poolOozeDead' && wd.rows[13][29] === 'o' && to && to.rect.join() === '12,16,1,1' && to.cond === '!flag:oozeDead');
    var bk = DS.DATA.items.bucket;
    check('the bucket is on the battle\'s ITEM list: ' + JSON.stringify(bk.use), bk.use && bk.use.battle && bk.use.effect === 'bucket');

    // the scripts: each sends the fight to the grid's wet, the lead's square and the woken one
    SETUP(5); var g = DS.G, sent = [], base = DS.battle;
    DS.battle = function (o) { sent.push(o); return { start: function (script) { var self = this; self.finished = true; self.result = 'run'; pending.push(function () { script.resume(self, 'run'); }); } }; };
    g.x = 23; g.y = 14; var done = false; DS.run(DS.SCRIPTS.jelly, function () { done = true; }); pump(400);
    g.x = 29; g.y = 13; DS.run(DS.SCRIPTS.poolOoze, function () { }); pump(400);
    g.x = 12; g.y = 16; DS.run(DS.SCRIPTS.oozeFight, function () { }); pump(400);
    DS.battle = base;
    check('the jelly\'s square: ' + JSON.stringify(sent[0] && { deep16: sent[0].deep16, wake: sent[0].wake, at: sent[0].at, canRun: sent[0].canRun }), sent[0] && sent[0].deep16 === 'wet' && sent[0].wake === 'jelly' && sent[0].at.join() === '23,14');
    check('the pool ooze\'s puddle: ' + JSON.stringify(sent[1] && { deep16: sent[1].deep16, wake: sent[1].wake, at: sent[1].at }), sent[1] && sent[1].deep16 === 'wet' && sent[1].wake === 'poolooze' && sent[1].at.join() === '29,13');
    check('the southern ooze stays the 8-bit\'s: ' + JSON.stringify(sent[2] && { deep16: sent[2].deep16 || null, enemies: sent[2].enemies }), sent[2] && !sent[2].deep16 && sent[2].enemies.join() === 'grayooze');

    // the bucket in an 8-bit fight: listed, and nothing takes it
    SETUP(5); g = DS.G; g.give('bucket', 1);
    T.startFight(['ogre']); for (var w = 0; w < 400 && !DS.find('battle'); w++) T.step(1);
    var b = DS.find('battle'), hu = b.heroes[0], li = b.battleItems(hu).filter(function (x) { return x.value === 'bucket'; })[0];
    var gen = b.useItem(hu, 'bucket'), r, v; do { r = gen.next(v); } while (!r.done);
    check('in an 8-bit fight: listed ' + !!li + ', "' + (said().match(/Nothing here takes it[^|]*/) || [''])[0] + '", still carried x' + g.count('bucket'), !!li && r.value === false && g.count('bucket') === 1);
    while (DS.find('battle')) DS.pop(DS.find('battle'));

    // the seam: the grid's report of a won wet -- the jelly dead, the bucket picked up, Vivian drained by the herd
    function seam(name, rep, expect) {
      SETUP(5); var gg = DS.G; DS.EV.darkHere = function () { return true; };
      var xp0 = gg.party.map(function (h) { return h.xp; }), mx0 = gg.party.map(function (h) { return h.maxhp; });
      gg.x = 23; gg.y = 14;
      var res = null; DS.run(function* () { res = yield* DS.EV.fight(['ochrejelly'], { bg: 'wet', music: 'boss', canRun: true, deep16: 'wet', wake: 'jelly', at: [gg.x, gg.y] }); });
      for (var i = 0; i < 400 && !document.getElementById('d16'); i++) T.step(1);
      var fr = document.getElementById('d16'); if (!fr) { check(name + ': the iframe never opened', false); return; }
      window.dispatchEvent(new MessageEvent('message', { source: fr.contentWindow, data: Object.assign({ type: 'd16:done', party: gg.party.map(function (h) { return { id: h.id, hp: h.hp, maxhp: h.maxhp - (h.id === 'vivian' ? 4 : 0), slots: h.slots, feats: h.feats, drained: h.id === 'vivian' ? 4 : 0 }; }), foes: [], inv0: {}, inv1: {} }, rep) }));
      pump(1500);
      var viv = gg.hero('vivian'), i2 = gg.party.map(function (h) { return h.id; }).indexOf('vivian');
      var r2 = expect(gg, xp0, mx0, viv, i2, res);
      check(name + ': result ' + res + '; flags jellyDead ' + gg.flags.jellyDead + ', landlordSpoke ' + gg.flags.landlordSpoke + '; bucket x' + gg.count('bucket') + '; Vivian max ' + mx0[i2] + ' -> ' + viv.maxhp + '; XP ' + xp0.join('/') + ' -> ' + gg.party.map(function (h) { return h.xp; }).join('/') + (DS.lastError ? ' ERR ' + String(DS.lastError).slice(0, 160) : ''), r2 && !DS.lastError);
    }
    seam('won (the jelly dead)', { result: 'won', flags: { jellyDead: 1, landlordSpoke: 1 }, enemies8: ['ochrejelly'], inv1: { bucket: 1 } },
      function (gg, xp0, mx0, viv, i2, res) { return gg.flags.jellyDead && gg.flags.landlordSpoke && gg.count('bucket') === 1 && viv.maxhp === mx0[i2] - 4 && gg.party.some(function (h, k) { return h.xp > xp0[k]; }); });
    seam('out the way they came (one left the edge)', { result: 'escaped', flags: { poolOozeDead: 1 }, enemies8: null },
      function (gg, xp0, mx0, viv, i2, res) { return viv.maxhp === mx0[i2] - 4 && gg.flags.poolOozeDead && !gg.flags.jellyDead && gg.party.every(function (h, k) { return h.xp === xp0[k]; }); });

    // ---- 09-30d: the lantern sticks (map to map, a rest, a fight on lit ground); a torch still goes out; EQUIP's LIGHT puts it away
    SETUP(5); g = DS.G; DS.field.load('warrens_b', 12, 3, 'down'); g.give('lantern', 1); g.give('torch', 1);
    var lh = g.party.filter(function (h) { return R.freeHands(h); })[0];
    DS.run(function* () { yield* DS.EV.useFieldItem('lantern', lh); }); pump(200);
    var l0 = g.flags.torchBy === lh.id && g.flags.torchKind === 'lantern' && !!lh.equip.torch;
    DS.run(function* () { yield* DS.EV.warp('warrens_d', 2, 12, 'right'); }); pump(200);
    var l1 = g.map === 'warrens_d' && g.flags.torchBy === lh.id && !!lh.equip.torch;
    DS.EV.longRest(); var l2 = !g.flags.torchBy && !lh.equip.torch && g.count('lantern') === 1;
    check('a lantern lit (' + lh.name + ') stays lit down the stair to the wet, and a rest puts it away (09-30e): ' + [l0, l1, l2].join(',') + ', the pack x' + g.count('lantern'), l0 && l1 && l2);
    DS.run(function* () { yield* DS.EV.useFieldItem('lantern', lh); }); pump(200); // (lit again, for EQUIP's LIGHT)
    // (the one menu since 10-06, js/menu.js: EQUIP's LIGHT row, then its one choice)
    var seen = [], pp = g.party; g.party = [lh];
    var keyA = { pressed: function (x) { return x === 'a'; }, repeat: function (x) { return x === 'a'; } };
    try {
      var mm = new DS.FieldMenu().m; mm.root.go('equip'); var ep = mm.pages[mm.pages.length - 1];
      var row = ep.list.items.filter(function (x) { return x.value === 'light'; })[0]; seen.push(row);
      ep.list.i = ep.list.items.indexOf(row); mm.update(keyA);
      var cp = mm.pages[mm.pages.length - 1]; seen.push(cp && cp.list && cp.list.items[0]);
      mm.update(keyA); T.step(30);
    } finally { g.party = pp; }
    check('EQUIP shows LIGHT (' + (row && row.right) + ', ' + JSON.stringify(seen[1] && seen[1].label) + ') and puts the lantern away: the pack x' + g.count('lantern') + ', in hand ' + !!lh.equip.torch + ', torchBy ' + g.flags.torchBy, row && !row.disabled && seen[1] && seen[1].label === '(put it away)' && g.count('lantern') === 1 && !lh.equip.torch && !g.flags.torchBy);
    var tn0 = g.count('torch');
    DS.run(function* () { yield* DS.EV.useFieldItem('torch', lh); }); pump(200);
    var t0 = g.flags.torchBy === lh.id && g.flags.torchKind === 'torch';
    DS.run(function* () { yield* DS.EV.warp('warrens_b', 12, 3, 'down'); }); pump(200);
    check('a torch still goes out leaving the map, spent: lit ' + t0 + ', after ' + (g.flags.torchBy || 'none') + ', torches x' + tn0 + ' -> x' + g.count('torch'), t0 && !g.flags.torchBy && !lh.equip.torch && g.count('torch') === tn0 - 1);
    // an 8-bit fight on lit ground: the lantern stays in the hand
    DS.run(function* () { yield* DS.EV.useFieldItem('lantern', lh); }); pump(200);
    T.startFight(['giantrat'], { dark: false, torch: g.flags.torchBy }); for (var w2 = 0; w2 < 400 && !DS.find('battle'); w2++) T.step(1);
    var b8 = DS.find('battle');
    for (var st = 0; st < 1500 && DS.find('battle') && !DS.lastError; st++) { var tq = DS.top(), kq = tq && tq.kind; if (kq === 'menu') { var fi = tq.menu.items.findIndex(function (it) { return it.label === 'FIGHT' && !it.disabled; }); tq.menu.i = fi >= 0 ? fi : 0; T.tapf('a'); } else if (kq === 'target') { tq.i = 0; T.tapf('a'); } else if (kq === 'dialog') { if (tq.chars < tq.pageLen()) tq.chars = tq.pageLen(); T.tapf('a'); } else T.step(1); }
    pump(300);
    check('an 8-bit fight on lit ground: the lantern still in ' + lh.name + '\'s hand after (' + g.flags.torchBy + ', pack x' + g.count('lantern') + ')', b8 && g.flags.torchBy === lh.id && !!lh.equip.torch && g.count('lantern') === 0);

    // ---- 09-30d: whole trips through the wet's own scripts -- the grid's report dispatched as the iframe would send it
    // (the 8-bit battle hands the script back through setTimeout(.., 0), which never fires inside this synchronous probe: run it on the step)
    var sto0 = window.setTimeout; window.setTimeout = function (f, ms) { if (!ms && typeof f === 'function') { pending.push(f); return 0; } return sto0.apply(window, arguments); };
    function trip(script, at, rep, pre) {
      SETUP(5); var gg = DS.G; DS.field.load('warrens_d', at[0], at[1], 'down'); DS.EV.darkHere = function () { return rep.dark !== false; };
      if (pre) pre(gg);
      var xp0 = gg.party.map(function (h) { return h.xp; }), done = false;
      DS.run(DS.SCRIPTS[script], function () { done = true; });
      for (var i = 0; i < 800 && !document.getElementById('d16'); i++) { var tp = DS.top(), k = tp && tp.kind; if (k === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); } else if (k === 'menu') { tp.menu.i = rep.menu || 0; T.tapf('a'); } else T.step(1); }
      var fr = document.getElementById('d16');
      if (fr) {
        var party = gg.party.map(function (h) { return Object.assign({ id: h.id, hp: h.hp, maxhp: h.maxhp, slots: h.slots, feats: h.feats }, (rep.party || {})[h.id] || {}); });
        window.dispatchEvent(new MessageEvent('message', { source: fr.contentWindow, data: Object.assign({ type: 'd16:done', party: party, foes: [], inv0: {}, inv1: {} }, rep.msg) }));
      }
      pump(1500);
      return { gg: gg, xp0: xp0, done: done, fr: !!fr, gain: gg.party.map(function (h, n) { return h.xp - xp0[n]; }) };
    }
    // (where the party stands when the Victory is said, and when the bucket's XP is: 09-30e, "land them on the stair, reward and then stair them up")
    var posV = null, posF = null, say0 = DS.say, fed0 = DS.EV.fedXp;
    DS.say = function (t) { if (/Victory/.test(String(t))) posV = [DS.G.map, DS.G.x, DS.G.y]; return say0.apply(this, arguments); };
    DS.EV.fedXp = function* () { if (DS.G.flags.otyughFed && !DS.G.flags.otyughFedXp) posF = [DS.G.map, DS.G.x, DS.G.y]; yield* fed0.apply(this, arguments); };
    var POOL = Math.round(1.25 * DS.DATA.monsters.otyugh.xp);
    var t1 = trip('jelly', [23, 14], { msg: { result: 'won', flags: { jellyDead: 1 }, enemies8: ['ochrejelly'], exit8: [20, 18] } });
    check('the jelly killed, out at the south edge: at ' + [t1.gg.map, t1.gg.x, t1.gg.y].join(',') + ' (there already at the Victory: ' + JSON.stringify(posV) + '), XP +' + t1.gain.join('/') + ', jellyDead ' + t1.gg.flags.jellyDead + ', script done ' + t1.done, t1.fr && t1.done && t1.gg.map === 'warrens_d' && t1.gg.x === 20 && t1.gg.y === 18 && JSON.stringify(posV) === '["warrens_d",20,18]' && t1.gain.every(function (n) { return n > 0; }) && t1.gg.flags.jellyDead && !DS.wetExit);
    var t2 = trip('poolOoze', [29, 13], { msg: { result: 'escaped', flags: {}, exit8: [1, 12] } });
    check('nothing dead, up the stair: on ' + [t2.gg.map, t2.gg.x, t2.gg.y].join(',') + ', XP +' + t2.gain.join('/'), t2.fr && t2.done && t2.gg.map === 'warrens_b' && t2.gain.every(function (n) { return n === 0; }));
    posV = null; posF = null;
    var t2b = trip('jelly', [23, 14], { msg: { result: 'won', flags: { jellyDead: 1, otyughFed: 1 }, enemies8: ['ochrejelly'], exit8: [1, 13] } });
    check('the jelly killed and the landlord fed, out by the stair: on the stair at the Victory ' + JSON.stringify(posV) + ' and at the bucket\'s XP ' + JSON.stringify(posF) + ', then up: ' + [t2b.gg.map, t2b.gg.x, t2b.gg.y].join(','), JSON.stringify(posV) === '["warrens_d",1,13]' && JSON.stringify(posF) === '["warrens_d",1,13]' && t2b.gg.map === 'warrens_b' && t2b.done);
    var t3 = trip('jelly', [22, 9], { msg: { result: 'escaped', flags: { otyughFed: 1, 'heard:r-stream': 1 }, exit8: [15, 18] } });
    var t3b = null; (function () { var gg = t3.gg, xp1 = gg.party.map(function (h) { return h.xp; }); gg.x = 23; gg.y = 14; DS.run(DS.SCRIPTS.jelly, function () { }); for (var i = 0; i < 800 && !document.getElementById('d16'); i++) { var tp = DS.top(); if (tp && tp.kind === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); } else T.step(1); } var fr = document.getElementById('d16'); if (fr) window.dispatchEvent(new MessageEvent('message', { source: fr.contentWindow, data: { type: 'd16:done', result: 'escaped', party: [], foes: [], inv0: {}, inv1: {}, exit8: [16, 18] } })); pump(1500); t3b = gg.party.map(function (h, n) { return h.xp - xp1[n]; }); })();
    check('fed on the grid, walked out: +' + t3.gain.join('/') + ' (125% of the otyugh\'s ' + DS.DATA.monsters.otyugh.xp + ' = ' + POOL + ', shared among ' + t3.gg.party.filter(function (h) { return !h.ko; }).length + '); the next trip pays nothing more: +' + (t3b || []).join('/'), t3.fr && t3.gain.every(function (n) { return n === Math.floor(POOL / t3.gg.party.length); }) && t3.gg.flags.otyughFedXp && t3b && t3b.every(function (n) { return n === 0; }));
    DS.say = say0; DS.EV.fedXp = fed0;
    var lh5 = null, rep5 = { dark: false, msg: { result: 'escaped', flags: {}, exit8: [20, 18] }, party: {} };
    var t5 = trip('jelly', [23, 14], rep5, function (gg) { gg.give('lantern', 1); lh5 = gg.party.filter(function (h) { return R.freeHands(h); })[0]; gg.flags.torchBy = lh5.id; gg.flags.torchKind = 'lantern'; gg.take('lantern', 1); lh5.equip.torch = 1; rep5.party[lh5.id] = { torch: 'lantern' }; });
    check('a lantern still lit in the hand comes back up in the hand, dark or not (the seam on lit ground): ' + (t5.gg.flags.torchBy || 'none') + ', pack x' + t5.gg.count('lantern'), t5.fr && lh5 && t5.gg.flags.torchBy === lh5.id && !!lh5.equip.torch && t5.gg.count('lantern') === 0);
    // ---- 09-30g: the rim takes them onto the grid; fed, it is only stone
    var wd2 = DS.DATA.maps.warrens_d, rimT = wd2.triggers.filter(function (t) { return t.id === 'landlordStep'; })[0], dc = wd2.triggers.filter(function (t) { return /^deepCradle/.test(t.id); });
    check('the rim\'s trigger quiet once fed or dead (' + (rimT && rimT.cond) + '); three deep-rate stations (' + dc.map(function (t) { return t.rect.slice(0, 2).join(',') + ':' + t.arg; }).join(' ') + ')', rimT && /otyughFed/.test(rimT.cond) && /otyughDead/.test(rimT.cond) && dc.length === 3 && dc.every(function (t) { return t.on === 'use' && t.script === 'deepCradle'; }));
    var sent2 = [], base2 = DS.battle;
    DS.battle = function (o) { sent2.push(o); return { start: function (script) { var self = this; self.finished = true; self.result = 'run'; pending.push(function () { script.resume(self, 'run'); }); } }; };
    SETUP(5); g = DS.G; DS.field.load('warrens_d', 8, 8, 'down'); DS.run(DS.SCRIPTS.landlordNear, function () { }); pump(400);
    SETUP(5); g = DS.G; g.flags.otyughFed = 1; DS.field.load('warrens_d', 9, 8, 'down'); DS.run(DS.SCRIPTS.landlordNear, function () { }); pump(400);
    check('the rim: onto the grid ' + JSON.stringify(sent2[0] && { deep16: sent2[0].deep16, wake: sent2[0].wake, at: sent2[0].at }) + '; fed, nothing (' + sent2.length + ' fight)', sent2.length === 1 && sent2[0].deep16 === 'wet' && sent2[0].wake === 'rim' && sent2[0].at.join() === '8,8');
    // ---- 10-01: E at the water, the landlord alive and unfed, goes onto the grid as the rim does (no 8-bit LOWER THE BUCKET: Griz, testing
    // ?at=wet, "the pictures didn't run in the 8-bit"); the bucket goes in with them, unfed
    var n0 = sent2.length;
    SETUP(5); g = DS.G; g.give('bucket', 1); DS.field.load('warrens_d', 13, 4, 'left'); DS.run(DS.SCRIPTS.landlord, function () { }); pump(400);
    var s4 = sent2[n0];
    check('E at the water (10-01): onto the grid ' + JSON.stringify(s4 && { deep16: s4.deep16, wake: s4.wake, at: s4.at }) + ', fed ' + !!g.flags.otyughFed + ', the bucket carried x' + g.count('bucket'), sent2.length === n0 + 1 && s4.deep16 === 'wet' && s4.wake === 'rim' && s4.at.join() === '13,4' && !g.flags.otyughFed && g.count('bucket') === 1);
    sent2.length = n0; // (the deep-rate checks below count this list from the rim's one)
    // ---- 09-30g: the deep rate -- not in the book, no shift; in the book, a shift at three silver a thimble; a whip, the fight at its cradle
    var CS0 = DS.CradleScene, W80 = DS.W8.scene, madeWith = null;
    SETUP(5); g = DS.G; DS.field.load('warrens_d', 16, 6, 'left'); T.blog = [];
    var sh0 = g.silver; DS.run(function* () { yield* DS.SCRIPTS.deepCradle(0); }, function () { }); pump(300);
    check('not in the book: no shift (silver ' + sh0 + ' -> ' + g.silver + ', ' + sent2.length + ' fights)', g.silver === sh0 && sent2.length === 1);
    DS.CradleScene = function (o) { madeWith = o; this.fake = { got: 2, touched: true, perfect: 0, roused: true }; };
    DS.W8.scene = function (sc) { if (sc && sc.fake) return { start: function (script) { var self = this; self.finished = true; self.result = sc.fake; pending.push(function () { script.resume(self, sc.fake); }); } }; return W80(sc); };
    g.flags.tallyMet = 1; var sh1 = g.silver, done2 = false;
    DS.run(function* () { yield* DS.SCRIPTS.deepCradle(0); }, function () { done2 = true; }); pump(800);
    DS.CradleScene = CS0; DS.W8.scene = W80;
    var fo = sent2[1];
    check('in the book, a deep shift: the scene made deep ' + !!(madeWith && madeWith.deep) + ' for ' + (madeWith && madeWith.hero && madeWith.hero.name) + '; 2 thimbles paid ' + (g.silver - sh1) + ' silver; roused, the fight ' + JSON.stringify(fo && { deep16: fo.deep16, wake: fo.wake, harness: fo.harness, at: fo.at, milker: fo.milker, touched: fo.touched }), madeWith && madeWith.deep && g.silver - sh1 === 6 && fo && fo.deep16 === 'wet' && fo.wake === 'harness' && fo.harness.join() === '15,6' && fo.at.join() === '16,6' && fo.milker === madeWith.hero.id && fo.touched === true);
    DS.battle = base2;
    // the seam hands the grid the deep rate's options (js/embed.js open)
    var seamOpts = null; SETUP(5); g = DS.G; DS.field.load('warrens_d', 16, 6, 'left');
    DS.run(function* () { yield* DS.EV.fight(['crawler'], { bg: 'wet', deep16: 'wet', wake: 'harness', harness: [15, 6], at: [16, 6], milker: 'aurdin', touched: true }); });
    for (var q2 = 0; q2 < 400 && !document.getElementById('d16'); q2++) T.step(1);
    var fr2 = document.getElementById('d16');
    if (fr2) { var pm0 = fr2.contentWindow.postMessage; try { fr2.contentWindow.postMessage = function (m) { seamOpts = m && m.opts; }; } catch (e) { } window.dispatchEvent(new MessageEvent('message', { source: fr2.contentWindow, data: { type: 'd16:ready' } })); window.dispatchEvent(new MessageEvent('message', { source: fr2.contentWindow, data: { type: 'd16:done', result: 'escaped', party: [], foes: [], inv0: {}, inv1: {} } })); pump(800); }
    check('the seam carries the deep rate across: ' + JSON.stringify(seamOpts && { harness: seamOpts.harness, milker: seamOpts.milker, touched: seamOpts.touched, wake: seamOpts.wake }), seamOpts && seamOpts.harness && seamOpts.harness.join() === '15,6' && seamOpts.milker === 'aurdin' && seamOpts.touched === true && seamOpts.wake === 'harness');
    // the cradle scene itself at the deep rate: un-settled from the first draw, a narrower gold, a whip ends the shift roused
    SETUP(5); g = DS.G; var ch = g.hero('aurdin');
    var pens = new DS.CradleScene({ hero: ch, skill: 3, skillName: 'Nature', mouth: 2, shifts: 1 }), deep = new DS.CradleScene({ hero: ch, skill: 3, skillName: 'Nature', deep: true, shifts: 1 });
    pens.makeBand(); deep.makeBand(); var wp = pens.band.w / pens.cur().ripe, wdp = deep.band.w / deep.cur().ripe;
    check('the deep scene: unrest ' + deep.unrest() + ' at the first draw (pens ' + pens.unrest() + '); the gold ' + wdp.toFixed(3) + ' against the pens\' ' + wp.toFixed(3) + '; "' + deep.sub.slice(0, 26) + '"', deep.unrest() === 1 && pens.unrest() === 0 && wdp < wp && /^The wet/.test(deep.sub));
    [pens, deep].forEach(function (sc) { sc.draws = 1; sc.phase = 'save'; sc.pt = 170; sc.save = { r1: 15, r2: 0, bonus: 2, roll: 15, total: 17, holds: true, show1: 15, show2: 0 }; sc.ph_save(); });
    check('a whip, the touch held: the pens draw on (' + pens.phase + ', roused ' + pens.roused + '); the deep rate is over, roused (' + deep.phase + ', roused ' + deep.roused + ')', pens.phase === 'ready' && !pens.roused && deep.phase === 'tally' && deep.roused === true);
  } catch (e) { out.errors.push(String(e && e.stack || e).slice(0, 800)); }
  if (DS.lastError) out.errors.push('lastError: ' + String(DS.lastError.stack || DS.lastError).slice(0, 600));
  var p = document.createElement('pre'); p.textContent = 'WET8 ' + JSON.stringify(out); document.body.appendChild(p);
})();
