/* THE KEEPER'S STAIR, the 8-bit half (dev/keeper-probe.py runs it after the grid's checks; 10-03): the quest's ways through js/events.js S.stair and S.mark, and the
   seam (js/embed.js) carrying where the party comes in -- WADE IN starts the fight with the party on the ledge ('ledge'); a hand on the mark starts it by the rune ('rune');
   the rope with the Keeper asleep brings the five up with no fight at all; the rope with it awake fights first, by the rune. DEEP16 is not run: a stub battle answers
   (what the scene asked for, and a result), and through the seam the grid's 'd16:ready' and 'd16:done' are dispatched as its iframe would send them (dev/wet8-probe.js's way). */
(function () {
  var DS = window.DS, T = window.T, out = { checks: [], errors: [] };
  function check(what, ok) { out.checks.push([what, !!ok]); }
  DS.DATA = window.DS_DATA;
  try { DS.initCanvas(); } catch (e) { }
  ['sfx', 'play', 'stop'].forEach(function (k) { if (DS.audio) DS.audio[k] = function () { }; });
  // a scene's close resumes its script on the next step, not on a macrotask (the probe steps the game itself)
  var pending = [];
  DS.W8.scene = function (sc) { return { start: function (script) { var self = this; sc.onClose = function (res) { self.finished = true; self.result = res; pending.push(function () { script.resume(self, res); }); }; DS.push(sc); } }; };
  var step0 = T.step;
  T.step = function (n) { for (var i = 0; i < (n || 1); i++) { step0(1); while (pending.length) pending.shift()(); } };
  var said = [], sent = [], base = DS.battle;
  // the stub battle: records what the scene sent and answers with `res`
  function stub(res) { sent = []; DS.battle = function (o) { sent.push(o); return { start: function (script) { var self = this; self.finished = true; self.result = res; pending.push(function () { script.resume(self, res); }); } }; }; }
  // run a script to its end, answering its menus by label (the first item when none is queued)
  function play(gen, answers, cap) {
    answers = (answers || []).slice(); said = []; var fin = false; DS.run(gen, function () { fin = true; });
    for (var i = 0; i < (cap || 3000); i++) {
      var tp = DS.top(), k = tp && tp.kind;
      if (k === 'dialog') { var pg = tp.pages && tp.pages[tp.p]; if (pg) { var t = DS.stripCodes(pg.lines.join(' ')); if (said[said.length - 1] !== t) said.push(t); } }
      var menu = (k === 'dialog' || k === 'menu' || k === 'popup') ? tp.menu : null;
      if (menu) { var idx = 0; if (answers.length) { var a = String(answers[0]).toUpperCase(), j = menu.items.findIndex(function (it) { return !it.disabled && String(it.label).toUpperCase().indexOf(a) === 0; }); if (j >= 0) { idx = j; answers.shift(); } } menu.i = idx; T.tapf('a'); }
      else if (k === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); }
      else if (k === 'battle') { T.tapf('a'); }
      else T.step(1);
      if (fin && !DS.scriptActive() && k !== 'dialog' && k !== 'menu' && k !== 'battle') break;
    }
    return fin;
  }
  function L(id) { return DS.stripCodes((DS.DATA.text[id] || {}).t || id); }
  function heard(id) { var t = L(id); return said.some(function (s) { return s.indexOf(t.slice(0, 30)) >= 0; }); }
  function fresh(at) { var g = SETUP(5); DS.field.load('warrens_d', at[0], at[1], 'left'); g.flags.noEncounters = 1; return g; }
  var STAIR = [19, 21], MARK = [22, 19];
  function fl(g) { return ['keeperAwake', 'keeperDone', 'fiveRecovered'].map(function (k) { return k + ' ' + (g.flags[k] || 0); }).join(', ') + ', tokens ' + g.count('fivetokens'); }
  try {
    // ---- THE ROPE, the Keeper asleep: the quest passes, no fight
    var g = fresh(STAIR); g.give('rope', 1); stub('win');
    var fin = play(DS.SCRIPTS.stair, ['ROPE']);
    check('ROPE THEM OUT, rope in hand, the Keeper not woken: no fight (' + sent.length + ' asked), the five up (' + fl(g) + '), "' + L('w.ropeOut').slice(0, 40) + '..." heard ' + heard('w.ropeOut'),
      fin && sent.length === 0 && g.flags.fiveRecovered === 1 && g.count('fivetokens') === 1 && !g.flags.keeperDone && heard('w.ropeOut') && !heard('w.ropeAwake'));
    g = fresh(STAIR); stub('win'); fin = play(DS.SCRIPTS.stair, ['ROPE']);
    check('ROPE THEM OUT with no rope: no fight (' + sent.length + '), nothing recovered (' + fl(g) + ')', fin && sent.length === 0 && !g.flags.fiveRecovered && heard('w.noRope'));
    // ---- WADE IN: the fight at the ledge
    g = fresh(STAIR); stub('win'); fin = play(DS.SCRIPTS.stair, ['WADE']);
    var o = sent[0] || {};
    check('WADE IN: one fight on the grid, ' + JSON.stringify({ deep16: o.deep16, start: o.start, enemies: o.enemies, canRun: o.canRun }) + '; won, the five up (' + fl(g) + ')',
      fin && sent.length === 1 && o.deep16 === 'keeper' && o.start === 'ledge' && o.canRun === true && (o.enemies || []).join() === 'keeper' && g.flags.keeperDone === 1 && g.flags.fiveRecovered === 1 && g.count('fivetokens') === 1 && heard('w.keeperGone'));
    // ---- WADE IN and out again (10-04, Griz: "Keeper Fight lacks fight escape"): a run leaves it awake and unbeaten, nothing recovered
    g = fresh(STAIR); stub('run'); fin = play(DS.SCRIPTS.stair, ['WADE']);
    check('WADE IN, then LEAVE THE FIGHT (the grid says run): the Keeper awake and unbeaten, the five still down (' + fl(g) + ')',
      fin && sent.length === 1 && g.flags.keeperAwake === 1 && !g.flags.keeperDone && !g.flags.fiveRecovered && g.count('fivetokens') === 0 && !heard('w.keeperGone'));
    // ---- the mark: a hand on it starts the fight there, by the rune
    g = fresh(MARK); stub('win'); fin = play(DS.SCRIPTS.mark, ['PUT']);
    o = sent[0] || {};
    check('PUT A HAND ON IT: "' + L('w.markWake').slice(0, 34) + '..." (' + heard('w.markWake') + '), then the fight at once, ' + JSON.stringify({ deep16: o.deep16, start: o.start, enemies: o.enemies, canRun: o.canRun }) + '; won, the five up as WADE IN\'s win (' + fl(g) + ')',
      fin && sent.length === 1 && o.deep16 === 'keeper' && o.start === 'rune' && o.canRun === true && g.flags.keeperAwake === 1 && g.flags.keeperDone === 1 && g.flags.fiveRecovered === 1 && g.count('fivetokens') === 1 && heard('w.markWake') && heard('w.keeperGone'));
    var g2 = g; stub('win'); fin = play(DS.SCRIPTS.mark, []);
    var fin2 = play(DS.SCRIPTS.stair, []);
    check('after it: the mark is only a mark (no ask, no fight: ' + sent.length + '), the stair still ("' + L('w.stairDone') + '" ' + heard('w.stairDone') + ')', fin && fin2 && sent.length === 0 && heard('w.stairDone') && g2.count('fivetokens') === 1);
    g = fresh(MARK); stub('win'); fin = play(DS.SCRIPTS.mark, ['LEAVE']);
    check('LEAVE IT: no fight (' + sent.length + '), nothing woken (' + fl(g) + ')', fin && sent.length === 0 && !g.flags.keeperAwake && !g.flags.fiveRecovered);
    // ---- woken and not beaten (the fight at the mark lost, or a save from before 10-03 with only the flag): the rope fights first, by the rune
    g = fresh(MARK); stub('lose'); fin = play(DS.SCRIPTS.mark, ['PUT']);
    var lostOk = sent.length === 1 && g.flags.keeperAwake === 1 && !g.flags.keeperDone && !g.flags.fiveRecovered;
    DS.field.load('warrens_d', STAIR[0], STAIR[1], 'left'); g.give('rope', 1); stub('win'); fin = play(DS.SCRIPTS.stair, ['ROPE']);
    o = sent[0] || {};
    check('the mark\'s fight lost (awake, not done: ' + lostOk + '); then the rope: "' + L('w.ropeAwake').slice(0, 30) + '..." and the fight first, ' + JSON.stringify({ deep16: o.deep16, start: o.start }) + '; won, the five up (' + fl(g) + ')',
      lostOk && fin && sent.length === 1 && o.deep16 === 'keeper' && o.start === 'rune' && heard('w.ropeAwake') && g.flags.keeperDone === 1 && g.flags.fiveRecovered === 1);
    DS.battle = base;
    // ---- THE SEAM (js/embed.js open): what the grid is handed -- the fight and where the party comes in -- and the grid's win back through it
    function seam(script, answers, at) {
      var gs = fresh(at); if (answers[0] === 'ROPE') gs.give('rope', 1); var opts = null, fight = null, fin3 = false;
      said = []; var answ = answers.slice();
      DS.run(script, function () { fin3 = true; });
      for (var i = 0; i < 600 && !document.getElementById('d16'); i++) {
        var tp = DS.top(), k = tp && tp.kind, menu = k === 'dialog' ? tp.menu : null;
        if (menu) { var a = answ.length ? String(answ[0]).toUpperCase() : null, j = a ? menu.items.findIndex(function (it) { return String(it.label).toUpperCase().indexOf(a) === 0; }) : -1; if (j >= 0) answ.shift(); menu.i = Math.max(0, j); T.tapf('a'); }
        else if (k === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); } else T.step(1);
      }
      var fr = document.getElementById('d16'), st0 = window.setTimeout;
      if (fr) {
        window.setTimeout = function (fn) { pending.push(fn); return 0; }; // (the 8-bit battle resumes its script on a macrotask: here it waits in the queue T.step drains -- dev/bench8.js's way)
        try { fr.contentWindow.postMessage = function (m) { opts = m && m.opts; fight = m && m.fight; }; } catch (e) { }
        window.dispatchEvent(new MessageEvent('message', { source: fr.contentWindow, data: { type: 'd16:ready' } }));
        window.dispatchEvent(new MessageEvent('message', { source: fr.contentWindow, data: { type: 'd16:done', result: 'won', party: [], foes: [{ id: 'keeper', kind: 'keeper', i8: 0, dead: true }], inv0: {}, inv1: {} } }));
        for (var s = 0; s < 4000 && !(fin3 && !DS.scriptActive()); s++) { // (the 8-bit battle's ending on the grid's result -- Victory!, the XP -- and the scene after it)
          var t2 = DS.top(), k2 = t2 && t2.kind; if (k2 === 'dialog') { if (t2.chars < t2.pageLen()) t2.chars = t2.pageLen(); T.tapf('a'); } else if (k2 === 'menu' || k2 === 'battle') T.tapf('a'); else T.step(1); }
        window.setTimeout = st0;
      }
      return { g: gs, opts: opts, fight: fight, iframe: !!fr, fin: fin3 };
    }
    var sw = seam(DS.SCRIPTS.stair, ['WADE'], STAIR);
    check('through the seam, WADE IN: the grid is handed ' + JSON.stringify({ fight: sw.fight, start: sw.opts && sw.opts.start, canRun: sw.opts && sw.opts.canRun }) + '; the grid\'s win comes back and the five come up (' + fl(sw.g) + ')',
      sw.iframe && sw.fight === 'keeper' && sw.opts && sw.opts.start === 'ledge' && sw.opts.canRun === true && sw.g.flags.fiveRecovered === 1 && sw.g.flags.keeperDone === 1);
    var sm = seam(DS.SCRIPTS.mark, ['PUT'], MARK);
    check('through the seam, a hand on the mark: the grid is handed ' + JSON.stringify({ fight: sm.fight, start: sm.opts && sm.opts.start }) + '; won, the five up (' + fl(sm.g) + ')',
      sm.iframe && sm.fight === 'keeper' && sm.opts && sm.opts.start === 'rune' && sm.g.flags.fiveRecovered === 1 && sm.g.flags.keeperDone === 1);
    var sr = seam(DS.SCRIPTS.stair, ['ROPE'], STAIR);
    check('through the seam, the rope with the Keeper asleep: no grid at all (iframe ' + sr.iframe + '), the five up (' + fl(sr.g) + ')', !sr.iframe && sr.g.flags.fiveRecovered === 1 && !sr.g.flags.keeperDone);
  } catch (e) { out.errors.push(String(e && e.stack || e).slice(0, 800)); }
  if (DS.lastError) out.errors.push('lastError: ' + String(DS.lastError.stack || DS.lastError).slice(0, 600));
  var p = document.createElement('pre'); p.textContent = 'KEEPER8 ' + JSON.stringify(out); document.body.appendChild(p);
})();
