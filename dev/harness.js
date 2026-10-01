/* Dev-only test harness (not shipped): drives the game through DS.input from the console. */
(function () {
  var DS = window.DS;
  var T = window.T = {
    tap: function (b, ms) { DS.input.press(b, 't'); setTimeout(function () { DS.input.release(b, 't'); }, ms || 50); },
    sleep: function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); },
    topKind: function () { var t = DS.top(); return t && t.kind; },
    newGame: function (lead) {
      DS.lastError = null; DS.scripts = [];
      DS.newGame(lead); DS.bindState(DS.G); DS.clearScenes();
      var F = DS.field = new DS.Field(); DS.push(F);
      var st = DS.DATA.config.start; F.load(st.map, st.x, st.y, st.dir); return 'ok';
    },
    party: function (lvl) {
      ['barley', 'aurdin', 'vivian', 'lymen'].forEach(function (id) { if (!DS.G.hero(id)) { var h = DS.R.makeHero(id, lvl); DS.G.party.push(h); DS.G.hired.push(id); } });
      DS.G.party = DS.G.party.map(function (h) { return DS.R.makeHero(h.id, lvl); });
      ['potion', 'kit', 'antitoxin', 'oil', 'torch', 'simples'].forEach(function (i) { DS.G.give(i, 3); });
      return DS.G.party.map(function (h) { return h.name + ' L' + h.lvl + ' ' + h.hp + ' AC' + DS.R.ac(h); });
    },
    // run a battle with a random-choice bot in the background; poll T.last
    battle: function (enemies, opts) {
      T.last = null; T.log = []; DS.lastError = null;
      var result = null;
      DS.run(function* () { result = yield DS.battle(Object.assign({ enemies: enemies }, opts || {})); });
      var steps = 0;
      var iv = setInterval(function () {
        steps++;
        var top = DS.top(), k = top && top.kind, b = DS.find('battle');
        if (b && b.msg) { var m = DS.stripCodes(b.msg); if (T.log[T.log.length - 1] !== m) T.log.push(m); }
        if ((result !== null && !b && k !== 'dialog' && k !== 'flash') || steps > 6000 || DS.lastError) {
          clearInterval(iv);
          T.last = { result: result, steps: steps, err: DS.lastError && String(DS.lastError.stack || DS.lastError), party: DS.G.party.map(function (h) { return h.name + ' ' + h.hp + '/' + h.maxhp + (h.ko ? ' KO' : '') + ' L' + h.lvl; }) };
          return;
        }
        if (k === 'menu') {
          var items = top.menu.items, ok = [];
          items.forEach(function (it, j) { if (!it.disabled && it.label !== 'RUN' && !(opts && opts.fightOnly && it.label !== 'FIGHT')) ok.push(j); });
          if (!ok.length) { T.tap('b', 30); return; }
          top.menu.i = ok[Math.floor(Math.random() * ok.length)]; T.tap('a', 30);
        } else if (k === 'target') { top.i = Math.floor(Math.random() * top.list.length); T.tap('a', 30); }
        else T.tap('a', 30);
      }, 45);
      return 'started';
    },
    state: function () {
      var b = DS.find('battle');
      return { top: T.topKind(), round: b && b.round, foes: b && b.foes.map(function (f) { return f.name + ' ' + f.hp + (f.dead ? ' dead' : ''); }), last: T.last, logTail: T.log.slice(-12) };
    },
    goto: function (map, x, y) { DS.field.load(map, x, y, 'down'); return DS.G.map + ' ' + x + ',' + y + ' ' + DS.field.map.at(x, y); }
  };
})();
(function () {
  var DS = window.DS, T = window.T;
  // run a script with an answer queue; dialogs auto-advance, menus take answers (index) in order
  T.script = function (gen, answers) {
    T.answers = (answers || []).slice(); T.said = []; T.done = false; DS.lastError = null;
    var s = DS.run(gen, function () { T.done = true; });
    var steps = 0;
    var iv = setInterval(function () {
      steps++;
      var top = DS.top(), k = top && top.kind;
      if (k === 'dialog') {
        var pg = top.pages[top.p]; if (pg) { var t = pg.lines.join(' '); if (T.said[T.said.length - 1] !== t) T.said.push(DS.stripCodes(t)); }
        if (top.menu) { top.menu.i = T.answers.length ? T.answers.shift() : 0; }
        T.tap('a', 25);
      } else if (k === 'menu' || k === 'popup') {
        var m = top.menu; m.i = T.answers.length ? T.answers.shift() : 0; T.tap('a', 25);
      } else if (k === 'target') { T.tap('a', 25); }
      else if (k === 'battle' || k === 'flash') { }
      if ((T.done && k !== 'dialog' && k !== 'menu') || steps > 3000 || DS.lastError) { clearInterval(iv); T.scriptDone = true; }
    }, 40);
    T.scriptDone = false;
    return 'started';
  };
  T.S = function (name, arg) { return function* () { yield* DS.SCRIPTS[name](arg, DS.DATA.npcs[arg] || {}); }; };
})();
(function () {
  var DS = window.DS, T = window.T;
  T.sweep = async function (lists, lvl) {
    T.sweepLog = [];
    for (var i = 0; i < lists.length; i++) {
      T.newGame('barley'); T.party(lvl || 3); DS.G.flags.noEncounters = 1;
      DS.G.party[3].equip.ring = 'ringofbinding';
      T.battle(lists[i], { bg: 'cave' });
      var t0 = Date.now();
      while (!T.last && Date.now() - t0 < 90000) await T.sleep(250);
      if (!T.last) { var b = DS.find('battle'); T.last = { result: 'HUNG', err: null, party: [], hung: b && { msg: b.msg, active: b.active && (b.active.name || b.active.h.name), top: T.topKind(), scripts: DS.scripts.length } }; }
      await T.sleep(400);
      T.sweepLog.push({ enemies: lists[i].join(','), result: T.last && T.last.result, err: T.last && T.last.err, hung: T.last && T.last.hung, party: T.last && T.last.party.join(' | ') });
      if (T.last && T.last.err) break;
    }
    T.sweepDone = true;
    return T.sweepLog;
  };
})();
(function () {
  // 2026-09-25 (code tab): a synchronous driver. Set DS.paused = true, then T.step(n) replicates core.js update();
  // T.drive answers dialogs and menus by label and awaits a macrotask each step (scene waiters resume on one).
  // ONE SCENE PER javascript_tool CALL, step caps in the low hundreds: a long drive locks the desktop app.
  var DS = window.DS, T = window.T;
  T.step = function (n) {
    for (var i = 0; i < (n || 1); i++) {
      DS.frame++;
      var top = DS.top(); if (top && top.update) { try { top.update(); } catch (e) { console.error(e); DS.lastError = e; } }
      for (var k = 0; k < DS.scenes.length - 1; k++) if (DS.scenes[k].tick) DS.scenes[k].tick();
      for (var j = 0; j < DS.scripts.length; j++) DS.scripts[j].update();
      DS.scripts = DS.scripts.filter(function (s) { return !s.done; });
      if (DS.wave && ++DS.wave.t >= DS.wave.dur) DS.wave = null;
      DS.input.clearEdges();
    }
  };
  T.tapf = function (b, hold) { DS.input.press(b, 't'); T.step(hold || 1); DS.input.release(b, 't'); T.step(1); };
  T.drive = async function (answers, maxSteps, opts) {
    answers = (answers || []).slice(); opts = opts || {};
    var log = [], lastTxt = null, lastB = null, steps = 0, started = false;
    function pick(menu) {
      var items = menu.items, idx = -1;
      if (answers.length) { var a = String(answers[0]).toUpperCase(); idx = items.findIndex(function (it) { return !it.disabled && String(it.label).toUpperCase().indexOf(a) === 0; }); if (idx >= 0) answers.shift(); }
      if (idx < 0) { var ok = []; items.forEach(function (it, j) { if (!it.disabled && it.label !== 'RUN') ok.push(j); }); idx = ok.length ? ok[Math.floor(Math.random() * ok.length)] : 0; }
      menu.i = idx; log.push('MENU[' + items.map(function (it) { return it.label; }).join('|') + '] -> ' + items[idx].label);
    }
    function done() { return opts.until ? opts.until() : (started && !DS.scriptActive() && !(DS.top() && DS.top().kind === 'dialog')); }
    while (steps < (maxSteps || 400) && !done() && !DS.lastError) {
      started = started || DS.scriptActive();
      var top = DS.top(), k = top && top.kind;
      var b = DS.find && DS.find('battle'); if (b && b.msg) { var m = DS.stripCodes(b.msg); if (m !== lastB) { log.push('B: ' + m); lastB = m; } }
      if (k === 'dialog') {
        var pg = top.pages[top.p]; if (pg) { var t = DS.stripCodes(pg.lines.join(' ')); if (t !== lastTxt) { log.push((pg.who ? pg.who + ': ' : '') + t); lastTxt = t; } }
        if (top.menu) { pick(top.menu); T.tapf('a'); }
        else if (top.chars < top.pageLen()) { top.chars = top.pageLen(); T.step(1); }
        else if (top.auto) T.step(1);
        else T.tapf('a');
      } else if (k === 'menu' || k === 'popup') { pick(top.menu); T.tapf('a'); }
      else if (k === 'target') { top.i = Math.floor(Math.random() * top.list.length); T.tapf('a'); }
      else if (k === 'check') { if (top.t > 60) { log.push('CHECK ' + top.o.skill + ' ' + top.o.dc + ': ' + top.o.name + ' ' + top.o.nat + '+' + top.o.mod + '=' + top.o.total + (top.o.ok ? ' OK' : ' FAIL')); T.tapf('a'); } else T.step(4); }
      else if (k === 'battle') { if (steps % 3 === 0) T.tapf('a'); else T.step(1); }
      else T.step(1);
      steps++;
      await new Promise(function (r) { setTimeout(r, 0); });
    }
    return { log: log, steps: steps, err: DS.lastError && String(DS.lastError.stack || DS.lastError), top: DS.top() && DS.top().kind };
  };
})();
