/* DEEP16 — the play record (09-29, Griz at the usage cliff: "give &party=ours a 'you play them human' mode that records how I
   play them into a file I can run by you"). On the tester ladder with P (YOU PLAY), a fight's o.record keeps every answer the
   player gives: the command (or the prompt answered), where the one answering stood and what was left of the turn, and at the start
   of each of our four's turns the state round them and what the class AI would have done there (js/tactics.js TX.plans, its best
   three for the action and two for the bonus action). What happened after each answer (the fight's log lines) rides with it.
   Kept per browser (deep16.plays, the last 40 fights); R on the tester ladder saves them all to one file. */
'use strict';
(function () {
  var D = window.D16, G = D.grid;
  var KEY = 'deep16.plays', KEEP = 40;
  var REC = D.rec = {};

  function logText(e) { return typeof e === 'string' ? e : (e && e.text) || ''; }
  function isUnit(v) { return v && typeof v === 'object' && v.id != null && v.side && v.hp != null; }
  // a command made plain for the file: a unit becomes its id, the rest kept to a shallow copy (no functions, no loops)
  function plain(v, depth) {
    depth = depth || 0;
    if (v == null || typeof v !== 'object') return typeof v === 'function' ? undefined : v;
    if (isUnit(v)) return v.id;
    if (depth > 3) return '...';
    if (Array.isArray(v)) return v.map(function (x) { return plain(x, depth + 1); });
    var o = {};
    Object.keys(v).forEach(function (k) { var x = plain(v[k], depth + 1); if (x !== undefined) o[k] = x; });
    return o;
  }
  function brief(B, w, u) {
    var o = { id: w.id, name: w.name, at: [w.x, w.y], hp: w.hp, maxhp: w.maxhp, conds: Object.keys(w.conds || {}) };
    if (u) { o.dist = G.dist(u, w); try { o.seen = !!D.magic.sees(B, u, w); } catch (e) { /* (the sight question can't be asked here) */ } }
    return o;
  }
  function sheet(u) {
    return { id: u.id, name: u.name, cls: u.cls, lvl: u.lvl, subclass: u.subclass, hp: u.maxhp, ac: D.rules && D.rules.ac ? D.rules.ac(u) : u.baseAC,
      weapon: u.weapon && u.weapon.id, slots: u.slotsMax && u.slotsMax.slice(), known: (u.known || []).slice(), darkvision: u.darkvision || 0 };
  }
  function plans(B, u, bonus, n) {
    try { return D.tactics.plans(B, u, bonus).slice(0, n).map(function (p) { return { why: p.why, score: Math.round(p.score * 100) / 100 }; }); }
    catch (e) { return [{ why: 'the AI could not weigh this turn: ' + e, score: 0 }]; }
  }
  // the state at the start of one of our four's turns, and what the AI would do there
  function turnStart(B, u) {
    var live = function (w) { return !w.dead && w.hp > 0 && !w.left && !w.fled; };
    var o = { slots: u.slots && u.slots.slice(), conds: Object.keys(u.conds || {}), torch: !!(u.torch && u.torch.lit),
      foes: B.units.filter(function (w) { return w.side !== u.side && live(w); }).map(function (w) { return brief(B, w, u); }),
      allies: B.units.filter(function (w) { return w.side === u.side && w !== u && live(w); }).map(function (w) { return brief(B, w, u); }),
      ai: plans(B, u, false, 3), aiBonus: plans(B, u, true, 2) };
    try { o.light = D.light.name(D.light.levelAt(B, u.x, u.y)); } catch (e) { /* (a lit map: nothing to say) */ }
    return o;
  }
  // the log since the last answer goes to it: what that answer did
  function flush(B) {
    var r = B.rec, ls = B.logEntries || [];
    if (r.last && ls.length > r.logAt) r.last.then = (r.last.then || []).concat(ls.slice(r.logAt).map(logText));
    r.logAt = ls.length;
  }
  function note(B, v) {
    var r = B.rec, req = B.req;
    if (!req || r.done) return;
    var u = req.turn || (req.prompt && req.prompt.who);
    if (!u || u.side !== 'party') return; // (a prompt of the foes' is the AI's; only ours are the player's)
    flush(B);
    if (!r.party.length) r.party = B.units.filter(function (w) { return w.side === 'party'; }).map(sheet);
    var step = { round: B.round, who: u.id, at: [u.x, u.y], hp: u.hp };
    if (req.turn) {
      var key = B.round + ':' + u.id;
      if (r.turnKey !== key) { r.turnKey = key; step.turnStart = turnStart(B, u); }
      step.cmd = plain(v);
      var T = u.turn || {};
      step.left = { move: T.move, action: T.action, bonus: T.bonus, attacksLeft: T.attacksLeft };
    } else {
      var p = req.prompt, opts = p.opts || [], hit = opts.filter(function (o) { return o.value === v; })[0];
      step.prompt = { title: p.title, lines: p.lines, opts: opts.map(function (o) { return o.label; }) };
      step.answer = hit ? hit.label : plain(v);
    }
    r.steps.push(step); r.last = step;
  }

  REC.start = function (B, what) {
    B.rec = { v: 1, fight: what.fight, name: what.name, level: what.level, started: new Date().toISOString(), party: [], steps: [], logAt: 0 };
  };
  REC.finish = function (B, result) {
    var r = B.rec;
    if (!r || r.done) return;
    flush(B);
    r.done = true; r.result = result; r.rounds = B.round; r.ended = new Date().toISOString();
    r.partyEnd = B.units.filter(function (w) { return w.side === 'party'; }).map(function (w) { return { id: w.id, hp: Math.max(0, w.hp), maxhp: w.maxhp, down: !!(w.ko || w.hp <= 0 || w.dead) }; });
    r.log = (B.logEntries || []).map(logText);
    var out = {}; Object.keys(r).forEach(function (k) { if (k !== 'last' && k !== 'turnKey' && k !== 'logAt' && k !== 'done') out[k] = r[k]; });
    var all = D.store.get(KEY) || [];
    all.push(out);
    while (all.length > KEEP) all.shift();
    // (browser storage is small: past its room, the oldest fights go first, then the full logs, which the steps repeat)
    while (!D.store.set(KEY, all) && all.length > 1) all.shift();
    if (!D.store.set(KEY, all)) { all.forEach(function (f) { delete f.log; }); D.store.set(KEY, all); }
  };
  REC.count = function () { return (D.store.get(KEY) || []).length; };
  // R on the tester ladder: every kept fight to one file (a download: the browser asks where, or drops it in Downloads)
  REC.save = function () {
    var all = D.store.get(KEY) || [];
    if (!all.length) return false;
    var d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var name = 'deep16-play-record-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.json';
    var body = JSON.stringify({ what: 'DEEP16 play record: ?ladder&party=ours, the player running our four (js/record.js)', saved: d.toISOString(), fights: all }, null, 1);
    var a = document.createElement('a'), url = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    return name;
  };

  // the seam: every answer passes Battle.answer; a fight asked to record starts at its enter (so RESTART records the new one, and
  // the one it replaced is kept as 'restarted')
  var P = D.Battle.prototype, answer0 = P.answer, enter0 = P.enter;
  P.answer = function (v) {
    if (this.rec) { try { note(this, v); } catch (e) { (this.rec.errors = this.rec.errors || []).push(String(e)); } }
    return answer0.call(this, v);
  };
  P.enter = function () {
    var prev = D.battle;
    if (prev && prev !== this && prev.rec && !prev.rec.done && prev.rec.steps.length) REC.finish(prev, 'restarted');
    if (this.o.record && !this.rec) REC.start(this, this.o.record);
    return enter0.apply(this, arguments);
  };
})();
