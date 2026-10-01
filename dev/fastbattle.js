/* Dev-only (not shipped): battle balance spot-checks. Load after dev/harness.js.
   Messages resolve instantly; T.fight() drives one battle with a FIGHT-only bot (a pessimistic floor: no spells, no potions).
   One fight per javascript_tool call, step-capped (a long synchronous sweep locks the desktop app). */
(function () {
  var DS = window.DS, T = window.T, B = DS.Battle.prototype;
  B.say = function* (t) { this.msg = t; (T.blog = T.blog || []).push(DS.stripCodes(t)); };
  B.hold = function* (t) { this.msg = t; (T.blog = T.blog || []).push(DS.stripCodes(t)); };
  B.wait = function () { return DS.W8.frames(1); };
  T.fight = async function (cap, smart) {
    var steps = 0; cap = cap || 400;
    for (var w = 0; w < 120 && !DS.find('battle'); w++) T.step(1); // the flash before the battle
    while (steps < cap && DS.find('battle') && !DS.lastError) {
      var top = DS.top(), k = top && top.kind;
      if (k === 'menu') {
        var items = top.menu.items, pick = function (lbl) { return items.findIndex(function (it) { return it.label === lbl && !it.disabled; }); };
        var i = pick('FIGHT');
        if (smart && pick('MAGIC') >= 0 && Math.random() < 0.5) i = pick('MAGIC');
        top.menu.i = i >= 0 ? i : 0; T.tapf('a');
      }
      else if (k === 'target') { top.i = 0; T.tapf('a'); }
      else if (k === 'dialog') { if (top.chars < top.pageLen()) top.chars = top.pageLen(); T.tapf('a'); }
      else T.step(1);
      steps++;
      if (steps % 20 === 0) await new Promise(function (r) { setTimeout(r, 0); });
    }
    var b = DS.find('battle');
    return { steps: steps, over: b ? b.over || 'running' : 'done', round: b && b.round,
      foes: b && b.foes.filter(function (f) { return !f.dead; }).map(function (f) { return f.name + ' ' + f.hp; }).join(', '),
      party: DS.G.party.map(function (h) { return h.name + ' ' + h.hp + '/' + h.maxhp + (h.ko ? 'KO' : ''); }).join(' | '),
      guests: (DS.G.guests || []).map(function (x) { return x.h.name + ' ' + x.h.hp + '/' + x.h.maxhp; }).join(' | '),
      err: DS.lastError && String(DS.lastError.stack || DS.lastError) };
  };
  window.SETUP = function (lvl, flags, lead) {
    T.newGame(lead || 'barley'); T.party(lvl || 5); var g = DS.G; g.flags.lakeDone = 1; g.flags.noEncounters = 1; Object.assign(g.flags, flags || {});
    g.party.forEach(function (h) { if (h.pendingChoice === 'archetype') { h.subclass = 'Thief'; } delete h.pendingChoice; });
    DS.paused = true; return g;
  };
  // start a fight the way a script would, then T.fight() finishes it
  T.startFight = function (list, o) { T.blog = []; DS.run(function* () { T.res = yield DS.battle(Object.assign({ enemies: list, bg: 'cavern' }, o || {})); }); T.step(2); return 'started'; };
})();
