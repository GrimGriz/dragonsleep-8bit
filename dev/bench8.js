/* The 8-bit battle's bench (dev/, gitignored; 09-28g; dev/bench8.py builds the page). Synchronous: T.step replicates core.js's
   update; the battle's messages are instant (fastbattle.js). A plan answers each hero's menus by label, one queue a hero; guests
   run themselves. Writes BENCH8 {...} into the page for --dump-dom. */
(function () {
  var DS = window.DS, T = window.T, R = DS.R;
  var Q = new URLSearchParams(location.search), test = Q.get('test') || 'lymen';
  var out = { log: [], checks: [] };
  function finish() { var p = document.createElement('pre'); p.textContent = 'BENCH8 ' + JSON.stringify(out); document.body.appendChild(p); }
  DS.DATA = window.DS_DATA;
  try { DS.initCanvas(); } catch (e) { }
  ['sfx', 'play', 'stop'].forEach(function (k) { if (DS.audio) DS.audio[k] = function () { }; });
  // a scene's close resumes its script on a macrotask (core.js W8.scene); this page runs in one go, so the resumes queue here
  // and the driver runs them between steps, as the event loop would
  var pending = [];
  DS.W8.scene = function (sc) {
    return { start: function (script) { var self = this; sc.onClose = function (res) { self.finished = true; self.result = res; pending.push(function () { script.resume(self, res); }); }; DS.push(sc); } };
  };
  var step0 = T.step;
  T.step = function (n) { for (var i = 0; i < (n || 1); i++) { step0(1); while (pending.length) pending.shift()(); } };
  var cerr = console.error;
  console.error = function () { out.errors = (out.errors || []).concat([Array.prototype.map.call(arguments, function (a) { return a && a.stack ? a.stack : String(a); }).join(' ').slice(0, 600)]); cerr.apply(console, arguments); };

  // drive one battle: plans = { heroId: [labels...] } answered in order on that hero's turns; the rest FIGHT the first foe
  function drive(plans, cap) {
    var steps = 0;
    for (var w = 0; w < 200 && !DS.find('battle'); w++) T.step(1);
    while (steps < (cap || 6000) && DS.find('battle') && !DS.lastError) {
      var top = DS.top(), k = top && top.kind, b = DS.find('battle'), who = b && b.active && b.active.h ? b.active.h.id : null;
      var q = who && plans[who] || [];
      function want(labels) {
        if (!q.length) return -1;
        var a = String(q[0]).toUpperCase(), i = labels.findIndex(function (l, j) { return String(l).toUpperCase().indexOf(a) === 0; });
        if (i >= 0) { q.shift(); (T.blog = T.blog || []).push('  [' + who + ' picks ' + labels[i] + ']'); }
        return i;
      }
      if (k === 'menu') {
        var items = top.menu.items, i = want(items.map(function (it) { return it.disabled ? '\u0000' : it.label; }));
        if (i < 0) i = items.findIndex(function (it) { return it.label === 'FIGHT' && !it.disabled; });
        if (i < 0) i = items.findIndex(function (it) { return !it.disabled && it.label !== 'RUN'; });
        top.menu.i = Math.max(0, i); T.tapf('a');
      } else if (k === 'target') {
        var j = want(top.list.map(function (u) { return u.h ? u.h.name : u.name; }));
        if (j < 0 && q.length && !/^(MAGIC|FIGHT|SKILL|ITEM|RUN)$/i.test(q[0])) q.shift(); // (a name not here: the first will do)
        top.i = Math.max(0, j); T.tapf('a');
      } else if (k === 'dialog') { if (top.chars < top.pageLen()) top.chars = top.pageLen(); T.tapf('a'); }
      else T.step(1);
      steps++;
    }
    var b2 = DS.find('battle');
    out.result = b2 ? (b2.over || 'running') + ' after ' + steps + ' steps' : 'done (' + steps + ' steps)';
    if (b2 && !b2.over) { var sc = DS.scripts.map(function (s) { return s.done + ' wait=' + (s.wait ? JSON.stringify(Object.keys(s.wait)) + (s.wait.until ? String(s.wait.until).slice(0, 160) : '') + (s.wait.scene ? ' scene=' + s.wait.scene.kind : '') + (s.wait.n != null ? ' n=' + s.wait.n : '') : 'none'); });
      out.stuck = { top: DS.top() && DS.top().kind, active: b2.active && (b2.active.name || b2.active.h.name), msg: b2.msg, round: b2.round, scripts: sc, scenes: DS.scenes.map(function (s) { return s.kind; }) }; }
    out.err = DS.lastError && String(DS.lastError.stack || DS.lastError);
  }
  function snap() {
    out.party = DS.G.party.map(function (h) { return h.name + ' ' + h.hp + '/' + h.maxhp + (h.ko ? ' KO' : '') + ' slots ' + JSON.stringify(h.slots); }).join(' | ');
    out.guests = (DS.G.guests || []).map(function (x) { return x.h.name + ' (' + x.h.cls + ' ' + x.h.subclass + ') ' + x.h.hp + '/' + x.h.maxhp + ' slots ' + JSON.stringify(x.h.slots) + ' ch ' + x.h.feats.channel; }).join(' | ');
  }
  function check(what, ok) { out.checks.push((ok ? 'ok   ' : 'FAIL ') + what); }

  try {
    SETUP(+(Q.get('lvl') || 5));
    DS.EV = DS.EV || {};
    var g = DS.G, ly = g.hero('lymen');
    if (test === 'lymen') {
      ly.prepared = ['command', 'brandingsmite', 'magicweapon', 'bless'];
      check('the oath at 5: ' + R.oathSpells(ly).join(','), R.oathSpells(ly).join() === 'protectionfromevilandgood,sanctuary,lesserrestoration');
      check('the pool at 5 has Command, Branding Smite, Magic Weapon', ['command', 'brandingsmite', 'magicweapon'].every(function (id) { return R.prepPool(ly).indexOf(id) >= 0; }));
      check('the battle list: ' + R.spellList(ly, 'battle').map(function (s) { return s.id; }).join(','), R.spellList(ly, 'battle').length === 7);
      T.startFight(Q.get('foes') ? Q.get('foes').split(',') : ['gnoll', 'gloryseeker', 'wisp']);
      drive({ lymen: ['MAGIC', 'Magic Weapon', 'Barley', 'FIGHT', 'MAGIC', 'Command', 'Gnoll', 'GROVEL', 'MAGIC', 'Protection', 'Lymen', 'MAGIC', 'Branding', 'FIGHT', 'MAGIC', 'Sanctuary', 'Aurdin', 'FIGHT'] });
    } else if (test === 'command') {
      // the word landing: the ogres' WIS saves made hopeless, one GROVEL and one DROP
      ly.prepared = ['command', 'bless'];
      T.startFight(['ogre', 'ogre']);
      for (var w0 = 0; w0 < 400 && !DS.find('battle'); w0++) T.step(1);
      DS.find('battle').foes.forEach(function (f) { f.m = Object.assign({}, f.m, { saves: Object.assign({}, f.m.saves, { wis: -30 }) }); });
      drive({ lymen: ['MAGIC', 'Command', 'Ogre', 'GROVEL', 'MAGIC', 'Command', 'Ogre', 'HALT'] });
    } else if (test === 'unholy') {
      // Turn the Unholy (RULED 09-30): Lymen's SKILL; the wisps' WIS made hopeless, so they cower
      T.startFight(['wisp', 'wisp', 'gnoll']);
      for (var w9 = 0; w9 < 400 && !DS.find('battle'); w9++) T.step(1);
      var b9 = DS.find('battle'), L9 = b9.heroes.filter(function (x) { return x.h.id === 'lymen'; })[0];
      check('his SKILL list: ' + b9.skillList(L9, {}).map(function (s) { return s.label + (s.disabled ? ' (grey)' : ''); }).join(', ') + '; CHANNEL DIVINITY opens ' + b9.channelList(L9).map(function (s) { return s.label + (s.disabled ? ' (grey)' : ''); }).join(', '), b9.skillList(L9, {}).some(function (s) { return s.value === 'channel' && !s.disabled; }) && b9.channelList(L9).some(function (s) { return s.value === 'unholy' && !s.disabled; }));
      b9.foes.forEach(function (f) { if (f.m.tags && f.m.tags[0] === 'undead') f.m = Object.assign({}, f.m, { saves: Object.assign({}, f.m.saves, { wis: -30 }) }); });
      drive({ lymen: ['SKILL', 'CHANNEL', 'TURN'] }, 3000);
      var said9 = (T.blog || []).concat(out.log).join(' | ');
      check('he turns the wisps: ' + /TURN THE UNHOLY/.test(said9) + ', they cower: ' + /cower/.test(said9), /TURN THE UNHOLY/.test(said9) && /cower/.test(said9));
    } else if (test === 'charmward') {
      // Lisbet's charm (RULED 09-30, hidden): the moan never frightens its wearer, and nothing is said of it
      g.hero('aurdin').equip.ring = 'charm';
      T.startFight(['ogre']);
      for (var w8 = 0; w8 < 400 && !DS.find('battle'); w8++) T.step(1);
      var b8 = DS.find('battle'), f8 = b8.foes[0];
      b8.save = (function (s0) { return function (u, ab, dc) { return u && u.h ? { success: false, roll: 1, total: 1 } : s0.apply(this, arguments); }; })(b8.save); // (every hero fails)
      var gen = b8.special(f8, { id: 'moan', dc: 30 }), st8; do { st8 = gen.next(); } while (!st8.done);
      var au8 = b8.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], ba8 = b8.heroes.filter(function (x) { return x.h.id === 'barley'; })[0];
      var said8 = (T.blog || []).concat(out.log).join(' | ');
      check('the moan: Aurdin in the charm frightened ' + !!au8.conds.frightened + ', Barley ' + !!ba8.conds.frightened + '; the charm named nowhere: ' + !/charm/i.test(said8.replace(/charmed/gi, '')), !au8.conds.frightened && !!ba8.conds.frightened && !/charm/i.test(said8.replace(/charmed/gi, '')));
    } else if (test === 'sheets1001c') {
      // the story sheets' spells in the 8-bit battle (RULED 10-01c, Griz: "work a simplified version into 8-bit battles please - laughter is single target (no 8-bit
      // easter egg)"): Mirror Image's three images, Hideous Laughter on one foe (a hyena, INT 2, unmoved), Grease's prone
      var auS = g.hero('aurdin');
      ['hideouslaughter', 'grease', 'mirrorimage'].forEach(function (sid) { if (auS.known.indexOf(sid) < 0) auS.known.push(sid); if (auS.prepared && auS.prepared.indexOf(sid) < 0) auS.prepared.push(sid); });
      var blS = R.spellList(auS, 'battle').map(function (s) { return s.id; });
      check('his battle list has the three: ' + ['hideouslaughter', 'grease', 'mirrorimage'].filter(function (sid) { return blS.indexOf(sid) >= 0; }).join(','), ['hideouslaughter', 'grease', 'mirrorimage'].every(function (sid) { return blS.indexOf(sid) >= 0; }));
      auS.maxhp = Math.max(auS.maxhp, 400); auS.hp = auS.maxhp; auS.ko = false; // (two clubs before his second turn dropped a 30-HP Aurdin and the last three checks went RED: the check was dice, 10-02 -- as the familiar test's, 09-30)
      T.startFight(['ogre', 'hyena']);
      for (var wS = 0; wS < 400 && !DS.find('battle'); wS++) T.step(1);
      var bS = DS.find('battle'), aS = bS.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], seenImages = 0;
      bS.foes.forEach(function (f) { f.m = Object.assign({}, f.m, { saves: Object.assign({}, f.m.saves, { wis: -30, dex: -30 }) }); f.hp = f.maxhp = 400; }); // (long enough for his four casts)
      var say0S = bS.say; bS.say = function (m) { if (aS.images > seenImages) seenImages = aS.images; return say0S.apply(this, arguments); };
      drive({ aurdin: ['MAGIC', 'Mirror', 'MAGIC', 'Hideous', 'Ogre', 'MAGIC', 'Hideous', 'Hyena', 'MAGIC', 'Grease', 'Ogre'] }, 5000);
      var saidS = (T.blog || []).concat(out.log).join(' | '), castS = (saidS.match(/Aurdin casts /g) || []).length;
      check('Aurdin stood for his four casts: ' + castS + ' cast, ' + (/Aurdin falls!/.test(saidS) ? 'he fell' : 'never fell'), castS === 4 && !/Aurdin falls!/.test(saidS)); // (when this goes RED, the three below are not the spells' fault)
      check('Mirror Image: three images on Aurdin (' + seenImages + ')', seenImages === 3);
      check('Hideous Laughter on the ogre: laughing ' + /is laughing!/.test(saidS) + ', its turn lost ' + /helpless with laughter/.test(saidS), /is laughing!/.test(saidS) && /helpless with laughter/.test(saidS));
      check('on the hyena (INT 2): unmoved ' + /not affected/.test(saidS), /not affected/.test(saidS));
      check('Grease: prone ' + /is prone!/.test(saidS), /is prone!/.test(saidS));
    } else if (test === 'srd1002') {
      // 10-02 (Griz: "yes please fix mirror image in 8 bit"; the conditions by the SRD, "yes"): the dice queued -- DS.d answers from a list, then as it
      // would -- so each blow is the one meant. Mirror Image on a hero: a foe's blow goes at a double on the d20 (6+ with three, 8+ with two, 11+ with one),
      // meets 10 + his DEX there, and a hit bursts it; a miss leaves it. The conditions: a laughing foe saves DEX on its own roll and the paralyzed fail it;
      // the laughing have the prone's advantage and disadvantage and no more; a close hit on the laughing is no critical, on the paralyzed it is
      var d0 = DS.d, roll0 = DS.roll, Qd = [], crits = [];
      DS.d = function (n) { return Qd.length ? Qd.shift() : d0(n); };
      DS.roll = function (e, o) { crits.push(!!(o && o.crit)); return roll0(e, o); };
      function runM(gen) { var s; do { s = gen.next(); } while (!s.done); return s.value; }
      try {
        T.startFight(['ogre', 'ogre']);
        for (var wM = 0; wM < 400 && !DS.find('battle'); wM++) T.step(1);
        var bM = DS.find('battle'), AM = bM.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], BM = bM.heroes.filter(function (x) { return x.h.id === 'barley'; })[0], OM = bM.foes[0], club = OM.m.attacks.club;
        bM.intro = 0; AM.h.maxhp = AM.h.hp = 400; AM.conds = {}; OM.conds = {};
        var iac = 10 + DS.mod(AM.h.abil.dex);
        function blow(q, what, want) { // the ogre's club at Aurdin with the dice q: want { images, hurt, said }
          var im0 = AM.images, hp0 = AM.h.hp; T.blog = []; Qd = q.slice(); runM(bM.foeAttack(OM, AM, club)); Qd = [];
          var said = (T.blog || []).join(' | '), hurt = AM.h.hp < hp0;
          check(what + ': images ' + im0 + ' -> ' + AM.images + ', hurt ' + hurt + ' -- "' + said + '"', AM.images === want.images && hurt === want.hurt && want.said.test(said));
        }
        AM.images = 3;
        blow([15, 15, 6], 'three up, the double\'s d20 a 6, the club 15+6 against its AC ' + iac, { images: 2, hurt: false, said: /an image of Aurdin\. It bursts! \(2 left\)/ });
        blow([15, 15, 7], 'two up, a 7 (it wants 8): the club is his', { images: 2, hurt: true, said: /clubs Aurdin for/ });
        blow([1, 1, 8], 'two up, an 8: at a double, and a 1 misses it', { images: 2, hurt: false, said: /an image of Aurdin\.\.\. miss/ });
        blow([15, 15, 8], 'two up, an 8 and a hit', { images: 1, hurt: false, said: /It bursts! \(1 left\)/ });
        blow([15, 15, 10], 'one up, a 10 (it wants 11): his', { images: 1, hurt: true, said: /clubs Aurdin for/ });
        blow([15, 15, 11], 'one up, an 11', { images: 0, hurt: false, said: /It bursts! \(the last of them\)/ });
        blow([15, 15], 'none left: no d20 for a double, the club is his', { images: 0, hurt: true, said: /clubs Aurdin for/ });
        // the conditions
        OM.m = Object.assign({}, OM.m, { saves: Object.assign({}, OM.m.saves, { dex: 30 }) });
        OM.conds = { laughing: { rounds: 5 }, prone: true }; var svL = bM.save(OM, 'dex', 20);
        OM.conds = { paralyzed: { rounds: 3 } }; var svP = bM.save(OM, 'dex', 20);
        OM.conds = { stunned: { rounds: 3 } }; var svS = bM.save(OM, 'dex', 20);
        check('DEX saves: laughing on its own roll (' + svL.success + '), paralyzed (' + svP.success + ') and stunned (' + svS.success + ') fail outright', svL.success && !svP.success && !svS.success);
        OM.conds = { laughing: { rounds: 5 }, prone: true }; var aLm = bM.advantage(BM, OM, true), aLr = bM.advantage(BM, OM, false);
        OM.conds = { stunned: { rounds: 3 } }; var aSm = bM.advantage(BM, OM, true), aSr = bM.advantage(BM, OM, false);
        check('advantage on the laughing: close ' + aLm + ', from afar ' + aLr + ' (the prone\'s); on the stunned ' + aSm + ', ' + aSr, aLm === 1 && aLr === -1 && aSm === 1 && aSr === 1);
        function swing(conds, what, wantCrit) { OM.conds = conds; OM.hp = OM.maxhp = 400; BM.h.ko = false; T.blog = []; crits = []; Qd = [12, 12]; runM(bM.heroAttack(BM, OM, { n: 1 })); Qd = []; var said = (T.blog || []).join(' | '); check(what + ': "' + said + '" (crit dice ' + crits[0] + ')', crits[0] === wantCrit && /hits/.test(said) && /Critical!/.test(said) === wantCrit); }
        swing({ laughing: { rounds: 5 }, prone: true }, 'Barley rolls 12 on the laughing ogre: a hit, no critical', false);
        swing({ stunned: { rounds: 3 } }, 'on the stunned: a hit, no critical', false);
        swing({ paralyzed: { rounds: 3 } }, 'on the paralyzed: a critical (SRD 5.1)', true);
      } finally { DS.d = d0; DS.roll = roll0; }
    } else if (test === 'fixes1003') {
      // the cheap SRD fixes (10-03, Griz: "4 yes" to "The cheap SRD fixes as one Sonnet or cloud batch?"; spells-two-books.md §2): castSpell run
      // straight, its pickers answered from a queue (a foe's or hero's name, a menu's label, null to cancel; nothing queued takes the first),
      // the dice counted. Each check failed before its fix (spell-fixes-notes.md)
      var roll0F = DS.roll, d0F = DS.d, scene0F = DS.W8.scene, rollsF = [], ansF = [], offeredF = [], QdF = [];
      DS.roll = function (e, o) { rollsF.push(e); return roll0F(e, o); };
      DS.d = function (n) { return QdF.length ? QdF.shift() : d0F(n); };
      function nmF(u) { return u.h ? u.h.name : u.name; }
      function answerF(sc) {
        var a = ansF.length ? ansF.shift() : undefined, up = function (x) { return String(x).toUpperCase(); };
        if (sc.kind === 'target') {
          offeredF.push(sc.list.map(nmF));
          if (a === null) return null; if (a && typeof a === 'object') return a;
          return a === undefined ? sc.list[0] : sc.list.filter(function (u) { return up(nmF(u)).indexOf(up(a)) === 0; })[0] || null;
        }
        if (sc.kind === 'menu') {
          var items = sc.menu.items; offeredF.push(items.map(function (it) { return it.label + (it.disabled ? ' (grey)' : ''); }));
          if (a === null) return null;
          var it = a === undefined ? items.filter(function (x) { return !x.disabled; })[0] : items.filter(function (x) { return !x.disabled && up(x.label).indexOf(up(a)) === 0; })[0];
          return it ? (it.value !== undefined ? it.value : it) : null;
        }
      }
      function runF(gen) { var s, v; DS.W8.scene = function (sc) { return { __sc: sc }; }; try { do { s = gen.next(v); v = s.value && s.value.__sc ? answerF(s.value.__sc) : undefined; } while (!s.done); } finally { DS.W8.scene = scene0F; } return s.value; }
      try {
        T.startFight(['ogre', 'ogre', 'ogre']);
        for (var wF = 0; wF < 400 && !DS.find('battle'); wF++) T.step(1);
        var bF = DS.find('battle'), heroF = function (id) { return bF.heroes.filter(function (x) { return x.h.id === id; })[0]; };
        var AF = heroF('aurdin'), stF = function () { return { actions: 1, bonus: 1, surged: false, sneakUsed: false }; };
        bF.intro = 0;
        function foesF(ids, hp) { // a fresh line of foes on the same field, each with hp to spare
          var n = {}; bF.foes = ids.map(function (id) { var m = DS.DATA.monsters[id]; n[id] = (n[id] || 0) + 1; var f = bF.makeFoe(m, m.name + ' ' + String.fromCharCode(64 + n[id])); if (hp) f.hp = f.maxhp = hp; return f; });
          bF.layoutFoes(); return bF.foes;
        }
        function savesF(f, o) { f.m = Object.assign({}, f.m, { saves: Object.assign({}, f.m.saves, o) }); }
        function castF(u, id, answers, slots) { ansF = (answers || []).slice(); offeredF = []; rollsF = []; T.blog = []; if (slots) { u.h.slots = slots.slice(); u.h.slotsMax = slots.slice(); } return runF(bF.castSpell(u, DS.DATA.spells[id], stF())); }
        function saidF() { return (T.blog || []).join(' | '); }

        // 1. one damage roll for an area (SRD 5.1, Damage Rolls: "If a spell or other effect deals damage to more than one target at the same time,
        // roll the damage once for all of them"): Fireball on three ogres, two failing and one saving; Ice Storm's two dice the same
        var o1 = foesF(['ogre', 'ogre', 'ogre'], 400); savesF(o1[0], { dex: -30 }); savesF(o1[1], { dex: -30 }); savesF(o1[2], { dex: 30 });
        castF(AF, 'fireball', [], [4, 3, 3]);
        var lost1 = o1.map(function (f) { return 400 - f.hp; }), n1 = rollsF.filter(function (e) { return e === '8d6'; }).length;
        check('1. Fireball on three ogres: 8d6 rolled ' + n1 + ' time(s); the two caught lose ' + lost1[0] + ' and ' + lost1[1] + ', the one who saved ' + lost1[2], n1 === 1 && lost1[0] === lost1[1] && lost1[2] === Math.floor(lost1[0] / 2));
        var o1b = foesF(['ogre', 'ogre', 'ogre'], 400); o1b.forEach(function (f) { savesF(f, { dex: -30 }); });
        castF(AF, 'icestorm', [], [4, 3, 3, 1]);
        var lost1b = o1b.map(function (f) { return 400 - f.hp; }), n1b = rollsF.filter(function (e) { return e === '2d8' || e === '4d6'; }).length;
        check('1. Ice Storm on three ogres: its 2d8 and 4d6 rolled ' + n1b + ' times in all; each loses ' + lost1b.join(', '), n1b === 2 && lost1b[0] === lost1b[1] && lost1b[1] === lost1b[2]);

        // 2. Mislead's double (SRD 5.1: "You become invisible at the same time that an illusory double of you appears where you are standing"): one image
        // stands, and an ogre's club goes at it on the d20 (11+ with one, Mirror Image's rule); the club 15 (at disadvantage: he is unseen) bursts it
        var o2 = foesF(['ogre'], 400); AF.conds = {}; AF.images = 0; AF.h.maxhp = AF.h.hp = 400;
        castF(AF, 'mislead', [], [4, 3, 3, 3, 1]);
        var inv2 = !!AF.conds.invisible, im2 = AF.images, hp2 = AF.h.hp;
        T.blog = []; QdF = [15, 15, 11]; runF(bF.foeAttack(o2[0], AF, o2[0].m.attacks.club)); QdF = [];
        check('2. Mislead: invisible ' + inv2 + ', a double up (' + im2 + '); the club goes at it -- "' + saidF() + '" -- and he is unhurt (' + (AF.h.hp === hp2) + ')', inv2 && im2 === 1 && AF.images === 0 && AF.h.hp === hp2 && /an image of Aurdin\. It bursts!/.test(saidF()));
      } finally { DS.roll = roll0F; DS.d = d0F; DS.W8.scene = scene0F; }
    } else if (test === 'ingrith') {
      DS.EV.addGuest('ingrith');
      var ing = g.guests[0].h;
      check('Ingrith is a ' + ing.cls + ' of the ' + ing.subclass + ', ' + ing.hp + ' HP, slots ' + JSON.stringify(ing.slots) + ', channel ' + ing.feats.channel, ing.cls === 'cleric' && ing.maxhp === 31 && ing.slots.join() === '4,3' && ing.feats.channel === 1);
      check('her battle list: ' + R.spellList(ing, 'battle').map(function (s) { return s.id; }).join(','), R.spellList(ing, 'battle').some(function (s) { return s.id === 'healingword'; }));
      // the party hurt, one down, so the heals have work
      g.party[0].hp = 4; g.party[2].hp = 0; g.party[2].ko = true; g.party[1].hp = 5;
      T.startFight(Q.get('foes') ? Q.get('foes').split(',') : ['wisp', 'wisp', 'gnoll']);
      drive({});
    } else if (test === 'familiar') {
      // Find Familiar (09-29): in the book and castable in the field; the shoulder's help (his own first attack, else the first ally's
      // after his turn); a blast on him takes it
      var au = g.hero('aurdin');
      check('in Aurdin\'s book: ' + (au.known.indexOf('findfamiliar') >= 0) + ', castable in the field: ' + R.spellList(au, 'field').some(function (s) { return s.id === 'findfamiliar'; }), au.known.indexOf('findfamiliar') >= 0 && R.spellList(au, 'field').some(function (s) { return s.id === 'findfamiliar'; }));
      check('the forms on grass: ' + R.famForms('.', 'world').join(',') + '; on snow: ' + R.famForms('o', 'world').join(',') + '; in a cave map: ' + R.famForms(null, 'cave').join(','), R.famForms('o', 'world')[0] === 'snowyowl');
      check('Mama sells Calling Herbs at ' + (DS.DATA.shops.lucia.prices || {}).callingherbs + ' sp', DS.DATA.shops.lucia.items.indexOf('callingherbs') >= 0 && DS.DATA.shops.lucia.prices.callingherbs === 50); // (50 sp: RULED 10-01c)
      g.flags.familiar = { kind: 'owl', by: 'aurdin', hp: 1 };
      T.startFight(['ogre', 'ogre']);
      for (var w1 = 0; w1 < 400 && !DS.find('battle'); w1++) T.step(1);
      var bt = DS.find('battle'), A = bt.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], Bb = bt.heroes.filter(function (x) { return x.h.id === 'barley'; })[0], fo = bt.foes[0];
      var live = { famTurn: bt.famTurn, famAttacked: bt.famAttacked, famPending: bt.famPending }; // (the intro is instant, so the first turn is already open here: when Aurdin won initiative, js/familiar.js had set famTurn on him and the probes below wiped it, so his real turn could never dart -- 1 run in 8 went RED on his initiative, 10-02; they put it back as they found it)
      bt.famTurn = A; bt.famAttacked = false;
      check('his own first attack helped, the second not: ' + bt.famHelps(A, fo) + ', ' + bt.famHelps(A, fo), bt.famAttacked && !bt.famHelps(A, fo));
      bt.famTurn = null; bt.famPending = true;
      var foeFirst = bt.famHelps(fo, A), adv1 = bt.advantage(Bb, fo, true), adv2 = bt.advantage(Bb, fo, true);
      check('a foe does not take it (' + foeFirst + '); the first ally after him has advantage (' + adv1 + '), the next swing not (' + adv2 + ')', !foeFirst && adv1 === 1 && adv2 === 0);
      var gsp = bt.famSplash(A, 7), gs; do { gs = gsp.next(); } while (!gs.done);
      check('a blast on him takes it: familiar ' + JSON.stringify(g.flags.familiar) + ', gone ' + g.flags.familiarGone, !g.flags.familiar && g.flags.familiarGone === 'owl');
      // a real round: Aurdin casts Burning Hands (a save, no attack roll), so the owl darts out for the next ally
      g.flags.familiar = { kind: 'owl', by: 'aurdin', hp: 1 }; delete g.flags.familiarGone; Object.assign(bt, live);
      bt.foes.forEach(function (f) { f.hp = f.maxhp = 200; }); // (no round can drop both before his turn, so the fight is never over before he casts)
      au.prepared = (au.prepared || []).concat(['sleep']).filter(function (id, i, a) { return a.indexOf(id) === i; });
      au.maxhp = Math.max(au.maxhp, 400); au.hp = au.maxhp; au.ko = false; // (the ogres going first must not drop him before his turn: the check was dice, 09-30)
      drive({ aurdin: ['MAGIC', 'Burning'] }, 2500);
      var said = (T.blog || []).concat(out.log).join(' | ');
      check('Aurdin cast Burning Hands and stood: cast ' + /Aurdin casts Burning Hands!/.test(said) + ', ' + (/Aurdin falls!/.test(said) ? 'he fell' : 'never fell'), /Aurdin casts Burning Hands!/.test(said) && !/Aurdin falls!/.test(said)); // (when this goes RED, the dart below is not the owl's fault)
      check('the owl darted out after his turn (the log says so): ' + /darts out/.test(said), /darts out/.test(said));
    } else if (test === 'perks') {
      // The familiar's look and perks in the 8-bit (RULED 09-30, Griz): the help flight, the bat about his head, and the caster's
      // perks (rat/bat dark, snake senseHidden + charm DC + Persuasion, spider web, frog alarm). Add `shots=1` to get stills into out.shots.
      var au2 = g.hero('aurdin'), B8 = DS.Battle.prototype;
      function fam(kind, by) { g.flags.familiar = { kind: kind, by: by || 'aurdin', hp: R.FAMILIARS[kind].hp }; delete g.flags.familiarGone; }
      function runGen(gen) { var s; do { s = gen.next(); } while (!s.done); return s.value; }
      function persuade(skill, heroId) { // EV.check on screen: the scene's own record (adv, note, name), read as it lands
        var res = null, seen = null;
        DS.run(function* () { res = yield* DS.EV.check(skill, skill === 'Persuasion' ? 'cha' : 'wis', 10, heroId ? { hero: g.hero(heroId) } : {}); });
        for (var i = 0; i < 600 && res === null; i++) { var tp = DS.top(); if (tp && tp.kind === 'check') seen = tp.o; T.step(1); }
        return seen;
      }
      // 1. whose perk it is
      fam('rat');
      check('famPerk: the rat lends Aurdin darkvision (' + DS.famPerk('aurdin', 'darkvision') + '), not Barley (' + DS.famPerk('barley', 'darkvision') + '), no sonar (' + DS.famPerk('aurdin', 'sonar') + ')', DS.famPerk('aurdin', 'darkvision') === 30 && DS.famPerk('barley', 'darkvision') === null && DS.famPerk('aurdin', 'sonar') === null);
      fam('rat', 'nobody');
      check('famPerk: a familiar of one not in the party gives nothing (' + DS.famPerk('nobody', 'darkvision') + ')', DS.famPerk('nobody', 'darkvision') === null);
      delete g.flags.familiar;
      check('famPerk: none with no familiar (' + DS.famPerk('aurdin', 'darkvision') + ')', DS.famPerk('aurdin', 'darkvision') === null);
      // 2. Persuasion (EV.check): the snake's caster has advantage; another hand, another skill, another familiar do not
      fam('snake');
      var pa = persuade('Persuasion', 'aurdin'), pbar = persuade('Persuasion', 'barley'), pper = persuade('Perception', 'aurdin'), pnamed = persuade('Persuasion');
      fam('owl'); var pow = persuade('Persuasion', 'aurdin');
      check('Persuasion: the snake gives its caster advantage (' + (pa && pa.adv) + ', note ' + (pa && pa.note) + '); Barley (' + (pbar && pbar.adv) + '), Perception (' + (pper && pper.adv) + ') and an owl (' + (pow && pow.adv) + ') do not',
        !!pa && pa.adv === true && !!pa.note && !!pbar && !pbar.adv && !pbar.note && !!pper && !pper.adv && !!pow && !pow.adv);
      out.log.push('the unnamed Persuasion check with the snake was rolled by ' + (pnamed && pnamed.name) + ' (adv ' + (pnamed && pnamed.adv) + ')');
      out.log.push('the check window is 160 wide; the note "The snake lends its charm." is ' + DS.textWidth('The snake lends its charm.') + ' px, the name line "Aurdin  (two dice, the higher)" ' + DS.textWidth('Aurdin  (two dice, the higher)'));

      // 3. a dark fight: the rat's and the bat's caster sees
      fam('rat');
      T.startFight(['ogre', 'ogre'], { dark: true });
      for (var w2 = 0; w2 < 400 && !DS.find('battle'); w2++) T.step(1);
      var pb = DS.find('battle'), PA = pb.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], PB = pb.heroes.filter(function (x) { return x.h.id === 'barley'; })[0], PF = pb.foes[0];
      var dk = ['rat', 'bat', 'owl', 'snake'].map(function (k) { fam(k); return k + ':' + pb.seesDark(PA); }).join(' ');
      fam('rat'); var ratBlind = pb.blindTo(PA); fam('owl'); var owlBlind = pb.blindTo(PA);
      check('the dark (dark ' + pb.dark + ', lit ' + pb.lit + '): Aurdin sees with ' + dk + '; Barley (' + pb.seesDark(PB) + ') does not; blind with the rat ' + ratBlind + ', with the owl ' + owlBlind,
        pb.dark && !pb.lit && dk === 'rat:true bat:true owl:false snake:false' && !pb.seesDark(PB) && !ratBlind && owlBlind);
      pb.lit = true; pb.intro = 0;

      // 4. the help flight, every form: out, a beat, home; under 40 frames; the help is still there for the roll, then taken
      var ctx2 = DS.ctx, shots = Q.get('shots') ? (out.shots = {}) : null;
      Object.keys(R.FAMILIARS).forEach(function (k) {
        fam(k); pb.famTurn = PA; pb.famAttacked = false; pb.famPending = false;
        var will0 = pb.famWill(PA), gen = pb.famFly(PA, PF), s = gen.next(), n = 0, start = null, mid = null, end = null, err = null;
        try {
          while (!s.done) {
            DS.frame++; pb.draw(ctx2);
            var fl = pb.famFlight; if (!fl || !fl.at) throw new Error('no flight drawn at frame ' + n);
            if (fl.n === 0) start = fl.at.slice();
            if (fl.n === 19) { mid = fl.at.slice(); if (shots && /^(owl|bat|rat|frog)$/.test(k)) shots[k] = DS.canvas.toDataURL('image/png'); }
            end = fl.at.slice(); n++; s = gen.next();
          }
        } catch (e) { err = String(e.stack || e).slice(0, 300); }
        var still = pb.famWill(PA), took = pb.advantage(PA, PF, true), gone = !pb.famWill(PA);
        var atTarget = !!mid && mid[0] >= PF.x - 4 && mid[0] <= PF.x + PF.art.w + 8 && mid[1] >= PF.y - 8 && mid[1] <= PF.y + PF.art.h + 4;
        var nearPerch = !!start && start[0] >= PA.x - 8 && start[0] <= PA.x + 24 && start[1] >= PA.y - 8 && start[1] <= PA.y + 26, slack = k === 'bat' ? 22 : 12, home = !!start && !!end && Math.abs(end[0] - start[0]) < slack && Math.abs(end[1] - start[1]) < slack; // (the bat's own loop moves on meanwhile)
        out.log.push('flight ' + k + ': ' + n + ' frames, from ' + JSON.stringify(start) + ' via ' + JSON.stringify(mid) + ' to ' + JSON.stringify(end) + ' (foe at ' + PF.x + ',' + PF.y + ' ' + PF.art.w + 'x' + PF.art.h + ')' + (err ? ' ERR ' + err : ''));
        check('the ' + k + ' flies: ' + n + ' frames, starts at the wizard ' + nearPerch + ', reaches the target ' + atTarget + ', comes home ' + home + '; the help waits (' + will0 + '/' + still + ') and is then taken (adv ' + took + ', gone ' + gone + ')',
          !err && n > 20 && n <= 40 && nearPerch && atTarget && home && will0 && still && took === 1 && gone && !pb.famFlight);
      });
      // the ally's flight: the first ally after his turn, not the wizard, not a foe
      fam('owl'); pb.famTurn = null; pb.famAttacked = false; pb.famPending = true;
      check('the ally case: Barley ' + pb.famWill(PB) + ', Aurdin ' + pb.famWill(PA) + ', a foe ' + pb.famWill(PF), pb.famWill(PB) && !pb.famWill(PA) && !pb.famWill(PF));
      pb.famPending = false;
      // the bat, whose help the 16-bit game withholds, still helps here
      fam('bat'); pb.famTurn = PA; pb.famAttacked = false;
      var batAdv = pb.advantage(PA, PF, true), batAgain = pb.advantage(PA, PF, true);
      check('the bat still helps his own first attack in the 8-bit (' + batAdv + ', then ' + batAgain + ')', batAdv === 1 && batAgain === 0);
      pb.famTurn = null;
      // 5. the bat about his head; the others where they were
      fam('bat'); var bx = [], by2 = [];
      for (var fr = 0; fr < 160; fr += 4) { DS.frame = fr; pb.draw(ctx2); bx.push(pb.famAt[0] - PA.x); by2.push(pb.famAt[1] - PA.y); }
      var bxr = [Math.min.apply(null, bx), Math.max.apply(null, bx)], byr = [Math.min.apply(null, by2), Math.max.apply(null, by2)];
      check('the bat flutters about his head: x ' + bxr + ', y ' + byr + ' from his corner', bxr[1] - bxr[0] >= 10 && byr[1] - byr[0] >= 4 && bxr[0] >= -8 && bxr[1] <= 20 && byr[0] >= -10 && byr[1] <= 8);
      if (shots) { DS.frame = 30; pb.draw(ctx2); shots.batperch = DS.canvas.toDataURL('image/png'); }
      fam('rat'); DS.frame = 3; pb.draw(ctx2); var r1 = pb.famAt.slice(); DS.frame = 40; pb.draw(ctx2);
      check('the rat stays at his heel (' + r1 + ' -> ' + pb.famAt + ')', r1[0] === pb.famAt[0] && r1[1] === pb.famAt[1]);
      // 6. the snake: the unseen and the invisible are plain to its caster (no ranges in the 8-bit: always); the charm and Web DCs
      pb.famTurn = null; pb.famPending = false; PF.conds.invisible = { rounds: 3 };
      fam('owl'); var invOwl = pb.advantage(PA, PF, false); fam('snake'); var invSnake = pb.advantage(PA, PF, false); var invBarley = pb.advantage(PB, PF, false);
      delete PF.conds.invisible; var m0 = PF.m; PF.m = Object.assign({}, m0, { traits: Object.assign({}, m0.traits, { unseen: true }) });
      fam('owl'); var unOwl = pb.advantage(PA, PF, false); fam('snake'); var unSnake = pb.advantage(PA, PF, false);
      PF.m = m0;
      check('senseHidden: an invisible foe is at disadvantage with an owl (' + invOwl + '), plain to the snake\'s caster (' + invSnake + '), not to Barley (' + invBarley + '); an unseen one too (' + unOwl + '/' + unSnake + ')', invOwl === -1 && invSnake === 0 && invBarley === -1 && unOwl === -1 && unSnake === 0);
      var web = DS.DATA.spells.web, hyp = DS.DATA.spells.hypnoticpattern;
      fam('snake'); var dSnake = [pb.famDC(PA, hyp), pb.famDC(PA, web), pb.famDC(PB, hyp)];
      fam('spider'); var dSpider = [pb.famDC(PA, hyp), pb.famDC(PA, web), pb.famDC(PB, web)];
      fam('owl'); var dOwl = [pb.famDC(PA, hyp), pb.famDC(PA, web)];
      check('DCs: the snake +1 to a charm only (' + dSnake + '), the spider +1 to Web only (' + dSpider + '), an owl none (' + dOwl + ')', dSnake.join() === '1,0,0' && dSpider.join() === '0,1,0' && dOwl.join() === '0,0');
      // 7. the spider: a foe's web does not hold its caster (a hopeless DC 40 for the rest)
      pb.pickHeroFor = function () { return PA; };
      fam('spider'); PA.conds = {}; runGen(pb.special(PF, { id: 'web', dc: 40 })); var spHeld = !!PA.conds.restrained;
      fam('owl'); PA.conds = {}; runGen(pb.special(PF, { id: 'web', dc: 40 })); var owHeld = !!PA.conds.restrained;
      check('webwalk: restrained by a DC 40 web with the spider ' + spHeld + ', with the owl ' + owHeld, !spHeld && owHeld);
      fam('frog'); check('alarm: the frog\'s caster ' + pb.famAlarm(PA) + ', Barley ' + pb.famAlarm(PB) + ', a foe ' + pb.famAlarm(PF), pb.famAlarm(PA) && !pb.famAlarm(PB) && !pb.famAlarm(PF));
      delete g.flags.familiar;
    } else if (test === 'perks2') {
      // (a second page for the fights that run on to their end) the spider's Web at DC+1 as cast, and the frog in a surprised first round
      var au3 = g.hero('aurdin'); au3.prepared = (au3.prepared || []).concat(['web']).filter(function (id, i, a) { return a.indexOf(id) === i; });
      g.flags.familiar = { kind: 'spider', by: 'aurdin', hp: 1 };
      T.startFight(['ogre', 'ogre']);
      for (var w3 = 0; w3 < 400 && !DS.find('battle'); w3++) T.step(1);
      var wb = DS.find('battle'), dcs = [], wsave = wb.save;
      wb.save = function (u, ab, dc, opt) { if (!u.h) dcs.push(ab + ' ' + dc); return wsave.apply(this, arguments); };
      drive({ aurdin: ['MAGIC', 'Web'] }, 300);
      var want = R.spellDC(au3) + 1;
      check('Aurdin\'s Web with the spider saves at DC ' + want + ' (the foes\' saves this fight: ' + dcs.join(', ') + ')', dcs.indexOf('dex ' + want) >= 0 && dcs.indexOf('dex ' + (want - 1)) < 0);
      // the frog: surprised party, only its caster acts in round one, and the croak plays
      var seen = {};
      ['frog', 'owl'].forEach(function (kind) {
        SETUP(+(Q.get('lvl') || 5));   // (a fresh game and party for each run)
        DS.G.flags.familiar = { kind: kind, by: 'aurdin', hp: 1 };
        // (the recorders go in before the fight starts: its first beats run inside T.startFight)
        var turns = [], croaks = 0, oturn = DS.Battle.prototype.turn, osfx = DS.audio.sfx;
        DS.Battle.prototype.turn = function* (u) { if (this.round === 1) turns.push(u.h ? u.h.id : 'foe'); yield* oturn.call(this, u); };
        DS.audio.sfx = function (n) { if (n === 'croak') croaks++; };
        T.startFight(['ogre'], { surprised: 'party' });
        drive({}, 200);
        DS.Battle.prototype.turn = oturn; DS.audio.sfx = osfx;
        seen[kind] = { turns: turns.join(','), croaks: croaks };
      });
      check('the surprised party, frog: round one ' + seen.frog.turns + ', croaks ' + seen.frog.croaks + '; with an owl: ' + seen.owl.turns + ', croaks ' + seen.owl.croaks,
        /aurdin/.test(seen.frog.turns) && !/barley|vivian|lymen/.test(seen.frog.turns) && seen.frog.croaks === 1 && !/aurdin|barley|vivian|lymen/.test(seen.owl.turns) && seen.owl.croaks === 0);
    } else if (test === 'ledgerlamp8') {
      // the Ledger-Lamp as a lantern, but better (RULED 09-30, Griz: "now should function like a lantern but better" -- "3 perfect"), the 8-bit half:
      // lit in the field (out of the pack, torchKind 'ledgerlamp', still the party's: g.has), put out at a rest, no need in the light; lit in a
      // dark battle from the ITEM list (a key item with a use), carried on or, with its bearer down, back in the pack; lit hood down under the roost
      function runScript(fn) {
        var done = false, said = []; DS.lastError = null; DS.run(fn, function () { done = true; });
        for (var i = 0; i < 800 && !done && !DS.lastError; i++) {
          var tp = DS.top(), k = tp && tp.kind;
          if (k === 'dialog') { var pg = tp.pages[tp.p]; if (pg) { var tx = DS.stripCodes(pg.lines.join(' ')); if (said[said.length - 1] !== tx) said.push(tx); } if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); }
          else T.step(1);
        }
        return said;
      }
      function runG(gen) { var s; do { s = gen.next(); } while (!s.done); return s.value; }
      var dark0 = DS.EV.darkHere, LAMP = DS.DATA.items.ledgerlamp;
      check('the record: a key item with a field and a battle use; hooded light ' + R.hooded('ledgerlamp') + ' (lantern ' + R.hooded('lantern') + ', torch ' + R.hooded('torch') + ', potion ' + R.hooded('potion') + ')', LAMP.kind === 'key' && LAMP.use.field && LAMP.use.battle && R.hooded('ledgerlamp') && R.hooded('lantern') && !R.hooded('torch') && !R.hooded('potion'));
      // 1. the field
      var au4 = g.hero('aurdin'); g.give('ledgerlamp', 1);
      check('the pack shows it under ITEMS (a key item that can be used in the field): x' + g.count('ledgerlamp'), g.count('ledgerlamp') === 1 && !!(LAMP.use && LAMP.use.field));
      DS.EV.darkHere = function () { return false; };
      var s0 = runScript(function* () { yield* DS.EV.useFieldItem('ledgerlamp', au4); });
      check('in the light (RULED 09-30c: lit anywhere, carried into the next fight): "' + s0.join(' ') + '"; carried by ' + g.flags.torchBy + ', the pack x' + g.count('ledgerlamp'), /ready for the dark/.test(s0.join(' ')) && g.flags.torchBy === 'aurdin' && g.count('ledgerlamp') === 0);
      DS.EV.torchOut(true); // (put away again, EQUIP's LIGHT: the dark case starts with it in the pack)
      DS.EV.darkHere = function () { return true; };
      var s1 = runScript(function* () { yield* DS.EV.useFieldItem('ledgerlamp', au4); });
      check('in the dark: "' + s1.join(' ') + '"; torchBy ' + g.flags.torchBy + ', torchKind ' + g.flags.torchKind + ', the pack x' + g.count('ledgerlamp') + ', his hand ' + au4.equip.torch, /Ledger-Lamp/.test(s1.join(' ')) && /Forty feet/.test(s1.join(' ')) && g.flags.torchBy === 'aurdin' && g.flags.torchKind === 'ledgerlamp' && g.count('ledgerlamp') === 0 && au4.equip.torch === 1);
      check('lit, it is still the party\'s (the highway light, the seals and the roper read g.has): ' + g.has('ledgerlamp'), g.has('ledgerlamp') === true);
      var s2 = runScript(function* () { yield* DS.EV.useFieldItem('ledgerlamp', g.hero('barley')); });
      check('a second light: "' + s2.join(' ') + '"', /light already|carries a light/.test(s2.join(' ')));
      DS.EV.torchOut(); // (another map: 09-30d, a hooded light stays lit; a rest puts it away, 09-30e -- EV.longRest's torchOut(true))
      check('another map leaves it lit (RULED 09-30d): torchBy ' + g.flags.torchBy + ', his hand ' + au4.equip.torch, g.flags.torchBy === 'aurdin' && au4.equip.torch === 1);
      DS.EV.torchOut(true); // (EQUIP's LIGHT: put away)
      check('put away (EQUIP LIGHT): the pack x' + g.count('ledgerlamp') + ', flags ' + JSON.stringify([g.flags.torchBy, g.flags.torchKind]) + ', his hand ' + au4.equip.torch + ', still had ' + g.has('ledgerlamp'), g.count('ledgerlamp') === 1 && !g.flags.torchBy && !g.flags.torchKind && !au4.equip.torch && g.has('ledgerlamp'));
      // 2. the lantern still behaves (its own id back in the pack, not the lamp's)
      g.give('lantern', 1); runScript(function* () { yield* DS.EV.useFieldItem('lantern', au4); });
      check('the lantern: torchKind ' + g.flags.torchKind + ', the lantern out of the pack x' + g.count('lantern') + ', the lamp still x' + g.count('ledgerlamp') + ', g.has lamp ' + g.has('ledgerlamp'), g.flags.torchKind === 'lantern' && g.count('lantern') === 0 && g.count('ledgerlamp') === 1);
      DS.EV.torchOut(true); check('the lantern back x' + g.count('lantern') + ', the lamp x' + g.count('ledgerlamp'), g.count('lantern') === 1 && g.count('ledgerlamp') === 1);
      // 3. a dark battle: the ITEM list, lit from it, carried on
      T.startFight(['ogre'], { dark: true });
      for (var w5 = 0; w5 < 400 && !DS.find('battle'); w5++) T.step(1);
      var b5 = DS.find('battle'), A5 = b5.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], it5 = b5.battleItems(A5).filter(function (x) { return x.value === 'ledgerlamp'; })[0];
      check('the battle ITEM list: ' + (it5 ? it5.label + ' ' + it5.right + (it5.disabled ? ' (grey)' : '') : 'missing') + '; dark ' + b5.dark + ', lit ' + b5.lit, !!it5 && !it5.disabled && it5.label === 'Ledger-Lamp' && b5.dark && !b5.lit);
      T.blog = []; b5.intro = 0; runG(b5.useItem(A5, 'ledgerlamp'));
      check('lit in the fight: torchBy ' + b5.torchBy + ', kind ' + b5.torchKind + ', lit ' + b5.lit + ', bright ' + b5.bright + ', the pack x' + g.count('ledgerlamp') + '; "' + (T.blog || []).join(' ') + '"', b5.torchBy === 'aurdin' && b5.torchKind === 'ledgerlamp' && b5.lit && b5.bright && g.count('ledgerlamp') === 0 && /lights the Ledger-Lamp\. Forty feet of the dark gives way/.test((T.blog || []).join(' ')));
      b5.foes.forEach(function (f) { f.hp = 0; f.dead = true; });
      drive({}, 1500);
      check('the fight over (' + out.result + '): carried on into the dark map, torchBy ' + g.flags.torchBy + ', torchKind ' + g.flags.torchKind + ', out of the pack x' + g.count('ledgerlamp') + ', still had ' + g.has('ledgerlamp'), g.flags.torchBy === 'aurdin' && g.flags.torchKind === 'ledgerlamp' && g.count('ledgerlamp') === 0 && g.has('ledgerlamp'));
      DS.EV.torchOut(true); check('put away (EQUIP LIGHT): the pack x' + g.count('ledgerlamp'), g.count('ledgerlamp') === 1);
      // 4. the bearer down when it ends: not lost (a lantern is, unless carried out; the lamp never is)
      SETUP(+(Q.get('lvl') || 5)); DS.EV.darkHere = function () { return true; }; g = DS.G; g.give('ledgerlamp', 1);
      T.startFight(['ogre'], { dark: true });
      for (var w6 = 0; w6 < 400 && !DS.find('battle'); w6++) T.step(1);
      var b6 = DS.find('battle'), A6 = b6.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0]; b6.intro = 0;
      runG(b6.useItem(A6, 'ledgerlamp'));
      A6.h.hp = 0; A6.h.ko = true; b6.foes.forEach(function (f) { f.hp = 0; f.dead = true; });
      drive({}, 1500);
      check('the bearer down when the fight ends: the pack x' + g.count('ledgerlamp') + ', torchBy ' + g.flags.torchBy, g.count('ledgerlamp') === 1 && !g.flags.torchBy);
      // 5. under the roost: lit hood down, no bright light, no fire (a torch stays grey)
      SETUP(+(Q.get('lvl') || 5)); DS.EV.darkHere = function () { return true; }; g = DS.G; g.give('ledgerlamp', 1);
      T.startFight(['ogre'], { dark: true, roost: true });
      for (var w7 = 0; w7 < 400 && !DS.find('battle'); w7++) T.step(1);
      var b7 = DS.find('battle'), A7 = b7.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], li7 = b7.battleItems(A7), lamp7 = li7.filter(function (x) { return x.value === 'ledgerlamp'; })[0], torch7 = li7.filter(function (x) { return x.value === 'torch'; })[0];
      check('the roost: the lamp ' + (lamp7 && (lamp7.disabled ? 'grey' : 'open')) + ', the torch ' + (torch7 && (torch7.disabled ? 'grey (' + torch7.right + ')' : 'open')), !!lamp7 && !lamp7.disabled && !!torch7 && torch7.disabled);
      T.blog = []; b7.intro = 0; runG(b7.useItem(A7, 'ledgerlamp'));
      check('lit hood down under the roost: "' + (T.blog || []).join(' ') + '"; bright ' + b7.bright + ', fire used ' + !!b7.usedFire + ', lit ' + b7.lit, /Ledger-Lamp, hood down/.test((T.blog || []).join(' ')) && !b7.bright && !b7.usedFire && b7.lit);
      DS.EV.darkHere = dark0;
    } else if (test === 'ledgerlamp8seam') {
      // the seam's 8-bit half (js/embed.js apply) for the Ledger-Lamp: DEEP16 is not run; its 'd16:done' report is dispatched on the page as the
      // iframe would send it (a MessageEvent whose source is the iframe's window), and the 8-bit battle's own ending runs on it. What the pack and
      // the field's flags hold afterward is what is checked: the lamp is never lost, never doubled
      function runScript2(fn) { var done = false; DS.lastError = null; DS.run(fn, function () { done = true; }); for (var i = 0; i < 800 && !done && !DS.lastError; i++) { var tp = DS.top(), k = tp && tp.kind; if (k === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); } else T.step(1); } }
      var dark1 = DS.EV.darkHere;
      function seam(name, o) { // o: dark, fieldLit (lit in the field first), pack (lamp in the pack at the start), report (the party entry for Aurdin), inv0, inv1, expect(g) -> [ok, what]
        SETUP(+(Q.get('lvl') || 5)); DS.EV.darkHere = function () { return !!o.dark; }; var gg = DS.G, aur = gg.hero('aurdin');
        if (o.pack) gg.give('ledgerlamp', 1);
        if (o.fieldLit) { DS.EV.darkHere = function () { return true; }; gg.give('ledgerlamp', 1); runScript2(function* () { yield* DS.EV.useFieldItem('ledgerlamp', aur); }); DS.EV.darkHere = function () { return !!o.dark; }; }
        T.startFight(['ogre'], { deep16: 'trolls', dark: !!o.dark, torch: gg.flags.torchBy || null });
        for (var i = 0; i < 400 && !document.getElementById('d16'); i++) T.step(1);
        var fr = document.getElementById('d16'); if (!fr) { check(name + ': the iframe never opened', false); return; }
        window.dispatchEvent(new MessageEvent('message', { source: fr.contentWindow, data: { type: 'd16:done', result: 'won', party: gg.party.map(function (h) { return { id: h.id, hp: h.hp, maxhp: h.maxhp, slots: h.slots, feats: h.feats, torch: h.id === 'aurdin' ? o.report : false }; }), foes: [{ id: 'ogre', kind: 'ogre', i8: 0, dead: true }], inv0: o.inv0 || {}, inv1: o.inv1 || {} } }));
        drive({}, 1500);
        var ran = +((/\((\d+) steps\)/.exec(out.result) || [])[1]) > 0; // (the 8-bit battle's own ending must have run on the report: a listener that threw would pass vacuously)
        var r = o.expect(gg) && ran; check(name + ': the 8-bit ending ran ' + ran + ', pack x' + gg.count('ledgerlamp') + ', torchBy ' + gg.flags.torchBy + ', torchKind ' + gg.flags.torchKind + ', his hand ' + gg.hero('aurdin').equip.torch + ', still had ' + gg.has('ledgerlamp') + (out.err ? ' ERR ' + String(out.err).slice(0, 200) : ''), r);
      }
      seam('walked in holding it, still lit in the dark', { dark: true, fieldLit: true, report: 'ledgerlamp', expect: function (gg) { return gg.count('ledgerlamp') === 0 && gg.flags.torchBy === 'aurdin' && gg.flags.torchKind === 'ledgerlamp' && gg.has('ledgerlamp'); } });
      seam('walked in holding it, put out on the grid (inv1 has it)', { dark: true, fieldLit: true, report: false, inv0: {}, inv1: { ledgerlamp: 1 }, expect: function (gg) { return gg.count('ledgerlamp') === 1 && !gg.flags.torchBy && !gg.hero('aurdin').equip.torch; } });
      seam('walked in holding it, set down and left (the seam counts the floor)', { dark: true, fieldLit: true, report: false, inv0: {}, inv1: { ledgerlamp: 1 }, expect: function (gg) { return gg.count('ledgerlamp') === 1 && !gg.flags.torchBy; } });
      seam('lit on the grid from the pack, still lit in the dark', { dark: true, pack: true, report: 'ledgerlamp', inv0: { ledgerlamp: 1 }, inv1: {}, expect: function (gg) { return gg.count('ledgerlamp') === 0 && gg.flags.torchBy === 'aurdin' && gg.flags.torchKind === 'ledgerlamp' && gg.has('ledgerlamp'); } });
      seam('lit on the grid from the pack, the place light enough (09-30d: still in the hand)', { dark: false, pack: true, report: 'ledgerlamp', inv0: { ledgerlamp: 1 }, inv1: {}, expect: function (gg) { return gg.count('ledgerlamp') === 0 && gg.flags.torchBy === 'aurdin' && gg.flags.torchKind === 'ledgerlamp'; } });
      seam('lit on the grid from the pack, put out again', { dark: true, pack: true, report: false, inv0: { ledgerlamp: 1 }, inv1: { ledgerlamp: 1 }, expect: function (gg) { return gg.count('ledgerlamp') === 1 && !gg.flags.torchBy; } });
      DS.EV.darkHere = dark1;
    } else if (test === 'migrate') {
      // an older save: Ingrith a fighter with a heals counter, hurt; DS.startFrom walks her on as the cleric she is
      DS.EV.addGuest('ingrith');
      var old = g.guests[0].h; old.cls = 'fighter'; old.maxhp = 36; old.hp = 18; old.healer = 3; old.feats = { heals: 1 };
      var data = JSON.parse(JSON.stringify(g)); DS.startFrom(data);
      var nh = DS.G.guests[0].h;
      check('migrated: ' + nh.cls + ' ' + nh.hp + '/' + nh.maxhp + ' slots ' + JSON.stringify(nh.slots), nh.cls === 'cleric' && nh.maxhp === 31 && nh.hp === 16 && !nh.healer);
    }
    snap();
    if (DS.find('battle')) { var bb = DS.find('battle'); out.foes = bb.foes.map(function (f) { return f.name + ' ' + f.hp + (f.dead ? ' dead' : '') + ' ' + JSON.stringify(f.conds); }).join(' | '); }
  } catch (e) { out.err = String(e.stack || e); }
  out.log = out.log.concat(T.blog || []);
  finish();
})();
