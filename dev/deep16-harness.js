/* DEEP16 harness (dev/, gitignored): drive the fight synchronously, one turn per pane call.
   Load in the page:  var s=document.createElement('script'); s.src='../dev/deep16-harness.js?'+Date.now(); document.head.appendChild(s)
   D16.paused stops rAF's updates; T16.until steps D16.update() by hand (no draw) until a request needs an answer. */
'use strict';
(function () {
  var D = window.D16;
  var T = window.T16 = {};
  // the pace (10-01 fa88930: D.PACE, 1.25 by default, stretches an AI turn's waits and walks a quarter longer for a person watching). The harness steps
  // frames by hand and watches nothing, so it runs at 1, as bench16.js does: T.until's frame counts stay what they were (a whole fight run by the AI
  // is 1400-5300 frames at 1 and a quarter more at 1.25; the pace is never persisted here, only D.PACE in this page, and a reload gives it back).
  // T16.pace(1.5) to test the pace itself (then pass T.until / T.run a bigger max)
  T.pace = function (p) { D.PACE = p || 1; return D.PACE; };
  T.pace(1);
  T.B = function () { return D.battle; };
  T.until = function (pred, max) {
    D.paused = true;
    var i = 0;
    for (; i < (max || 4000); i++) { if (pred()) break; D.update(); }
    D.draw();
    return i;
  };
  T.waitReq = function (max) { return T.until(function () { var B = D.battle; return !B.co || (B.req && !B.wait); }, max); };
  T.answer = function (v) { D.battle.clearCards(); D.battle.answer(v); T.waitReq(); return T.state(); };
  T.cmd = function (c) { return T.answer(c); };
  T.u = function (name) { return D.battle.units.filter(function (u) { return u.name === name || u.id === name; })[0]; };
  T.foe = function (id) { return D.battle.units.filter(function (u) { return u.id === id; })[0]; };
  T.state = function (n) {
    var B = D.battle, r = B.req;
    return {
      err: D.lastError ? String(D.lastError.stack || D.lastError).slice(0, 400) : null,
      round: B.round, active: B.active && B.active.name, result: B.result,
      req: r ? (r.turn ? 'turn:' + r.turn.name : r.prompt ? 'prompt:' + r.prompt.title : r.entry ? 'entry' : '?') : null,
      turn: r && r.turn ? r.turn.turn : null,
      units: B.units.map(function (u) { return u.name + '@' + u.x + ',' + u.y + ' ' + u.hp + '/' + u.maxhp + (u.dead ? ' DEAD' : '') + (u.ethereal ? ' ETH' : '') + (Object.keys(u.conds).length ? ' ' + Object.keys(u.conds).join('|') : '') + (u.reaction ? '' : ' noR'); }),
      log: (B.log || []).slice(-(n || 14))
    };
  };
  // rig the dice: the next d() calls return these (then the RNG as usual)
  var origD = D.d, rigQ = [];
  D.d = function (s) { return rigQ.length ? rigQ.shift() : origD(s); };
  T.rig = function (vals) { rigQ = vals.slice(); };
  // run a generator (an attack, say) now, then hand the pending request back to the fight as it was
  T.inject = function (gen) {
    var B = D.battle, main = B.co, pending = B.req;
    B.req = null;
    B.co = (function* () {
      yield* gen;
      var v = yield pending, r = main.next(v);
      while (!r.done) { v = yield r.value; r = main.next(v); }
    })();
    B.step();
    T.waitReq();
    return T.state();
  };
  // cast one spell from a hero now (fresh turn, full slots), whatever the turn: for testing resolution
  T.tryCast = function (heroId, id, target) {
    var B = D.battle, u = T.u(heroId), sp = D.magic.data(id);
    D.rules.startTurn(u); u.slots = u.slotsMax.slice();
    var slot = sp.level ? D.magic.slotLevels(u, sp.level)[0] : 0, n0 = (B.log || []).length;
    D.lastError = null;
    T.inject(D.magic.cast(B, u, id, slot, target));
    return { id: id, err: D.lastError ? String(D.lastError) : null, log: (B.log || []).slice(n0).slice(-5) };
  };
  // replay a list of commands from a fresh fight: strings name units ('@drow1' a foe by id, 'viv' a hero), prompts answered by value
  T.play = function (seed, steps) {
    T.fresh(seed);
    steps.forEach(function (c) {
      if (c && typeof c === 'object' && !('do' in c) && 'answer' in c) { T.answer(c.answer); return; }
      var cc = {}; Object.keys(c).forEach(function (k) { var v = c[k]; cc[k] = typeof v === 'string' && v[0] === '@' ? (T.foe(v.slice(1)) || T.u(v.slice(1))) : v; });
      T.cmd(cc);
    });
    return T.state(20);
  };
  // a ladder fight by id (09-27 ladder seat): T16.ladder('ettercap', 7)
  T.ladder = function (id, seed) {
    D.seed = seed || 12345;
    if (D.battle && D.top && D.top() === D.battle) D.pop();
    D.push(new D.Battle({ ladder: true, fight: id, onDone: function () {} }));
    T.waitReq();
    D.battle.answer();
    T.waitReq();
    return T.state(30);
  };
  // the four fight themselves as guests (walk to the nearest foe, swing): a smoke test, not a balance oracle (no spells).
  // T16.auto() then T16.run(n) to step n updates; returns the state (result: 'won' / 'lost' when done)
  T.auto = function () {
    var B = D.battle;
    B.units.forEach(function (u) { if (u.side === 'party') u.guest = true; });
    if (B.req && B.req.turn) B.answer({ do: 'end' });
    return T.run(3000);
  };
  T.run = function (n) {
    T.until(function () { var B = D.battle; return !B.co || (B.req && !B.wait); }, n || 3000);
    var B = D.battle; if (B.req && B.req.prompt) { B.answer(B.req.prompt.opts[B.req.prompt.opts.length - 1].value); }
    return T.state(8);
  };
  T.fresh = function (seed) {
    D.seed = seed || 12345;
    D.pop(); D.push(new D.Battle());
    T.waitReq();
    D.battle.answer(); // the entry card
    T.waitReq();
    return T.state(30);
  };
})();
