/* DEEP16 — the play record (09-29, Griz at the usage cliff: "give &party=ours a 'you play them human' mode that records how I
   play them into a file I can run by you"). On the tester ladder with P (YOU PLAY), a fight's o.record keeps every answer the
   player gives: the command (or the prompt answered), where the one answering stood and what was left of the turn, and at the start
   of each of our four's turns the state round them and what the class AI would have done there (js/tactics.js TX.plans, its best
   three for the action and two for the bonus action). What happened after each answer (the fight's log lines) rides with it.
   Kept per browser (deep16.plays, the last 40 fights); R on the tester ladder saves them all to one file, and C after it clears the ones
   that file holds (10-04: each save writes the whole record, so an uncleared one is written again into the next). */
'use strict';
(function () {
  var D = window.D16, G = D.grid;
  // (and no more than ROOM characters of the browser's storage, 10-03: forty whole fights filled it to its edge and the Pocket DM's roster
  // write was the one refused -- and grimgriz.github.io is one origin for every game on his Pages, so the room is shared)
  var KEY = 'deep16.plays', KEEP = 40, ROOM = 1500000;
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
  // (11-03, the desk's read of his Hex bout: `hp: u.maxhp` read 26 for a hero who came in at 13/26, hiding the wounds carried into the fight. hp is the hero's hit points as the
  // block is taken -- at the first answer the player gives, note() below -- and maxhp stands beside it; a fight's rec.hp0 { id: hp }, where REC.start snapshots it, is the
  // hp at the very start and wins when it is there, for a hero struck before that first answer)
  function startHp(u) { var h0 = D.battle && D.battle.rec && D.battle.rec.hp0; return h0 && h0[u.id] != null ? h0[u.id] : u.hp; }
  function sheet(u) {
    return { id: u.id, name: u.name, cls: u.cls, lvl: u.lvl, subclass: u.subclass, hp: startHp(u), maxhp: u.maxhp, ac: D.rules && D.rules.ac ? D.rules.ac(u) : u.baseAC,
      weapon: u.weapon && u.weapon.id, slots: u.slotsMax && u.slotsMax.slice(), known: (u.known || []).slice(), darkvision: u.darkvision || 0 };
  }
  function plans(B, u, bonus, n) {
    try { return D.tactics.plans(B, u, bonus).slice(0, n).map(function (p) { return { why: p.why, score: Math.round(p.score * 100) / 100 }; }); }
    catch (e) { return [{ why: 'the AI could not weigh this turn: ' + e, score: 0 }]; }
  }
  // the state at the start of one of our four's turns, and what the AI would do there
  function turnStart(B, u) {
    var live = function (w) { return !w.dead && w.hp > 0 && !w.left && !w.fled; };
    var o = { slots: u.slots && u.slots.slice(), conds: Object.keys(u.conds || {}), torch: u.torch && u.torch.lit ? (u.torch.kind === 'lantern' ? (u.torch.hood ? (u.torch.item || 'lantern') + ' (hooded)' : (u.torch.item || 'lantern')) : true) : false,
      foes: B.units.filter(function (w) { return w.side !== u.side && live(w); }).map(function (w) { return brief(B, w, u); }),
      allies: B.units.filter(function (w) { return w.side === u.side && w !== u && live(w); }).map(function (w) { return brief(B, w, u); }),
      ai: plans(B, u, false, 3), aiBonus: plans(B, u, true, 2) };
    try { o.light = D.light.name(D.light.levelAt(B, u.x, u.y)); } catch (e) { /* (a lit map: nothing to say) */ }
    return o;
  }
  // the log since the last answer goes to it: what that answer did
  // (11-03, the desk's read of his record: a card with an id REPLACES its own log entries -- battle.js Battle.card filters them out and pushes the new ones at the END, the log the
  // same length -- so flushing by count never saw a re-carded line: the Shield reaction's "SHIELD +5 ... MISS" and a TAKE IT's "HIT" never reached a transcript. Now the entries are
  // told by identity: an entry not seen before is new; one that re-cards a card's line is kept only where its text differs from what that card's line said when last written)
  // (11-03 night, the play records lane 2: written so, an amended line read twice -- the d20 once without its verdict, once with. A card AMENDED in place -- its head line
  // the same, as an attack's card is when the Shield or a TAKE IT changes its verdict -- now takes its earlier form of a changed line out of wherever it was written, so the
  // transcript reads the final form once, where it was last written. A card id reused for a NEW card, its head changed (the trophy's beats, one after another under one id),
  // keeps every line: those are the story, not drafts. cardAt[k][i] { s: the step it went under, or null for the opening; text }: where each card line was last written)
  function flush(B) {
    var r = B.rec, ls = B.logEntries || [], seen = r.seen || (r.seen = new WeakSet()), card = r.cardTxt || (r.cardTxt = {}), at = r.cardAt || (r.cardAt = {}), pos = {}, amend = {}, fresh = [], placed = [];
    var bare = function (t) { return String(t || '').replace(/^R\d+ /, ''); }; // (the round on the front of every card line: an amendment a round later is still the same card)
    ls.forEach(function (e) { // (the log's entries are all { id, text } objects: battle.js Battle.card, ai.js, roam.js, hex.js)
      if (!e || typeof e !== 'object') return;
      var k = e.id != null ? String(e.id) : null, i = k == null ? 0 : (pos[k] = (pos[k] == null ? 0 : pos[k] + 1));
      if (seen.has(e)) return;
      seen.add(e);
      if (k == null) { fresh.push(logText(e)); return; } // (an entry with no card: new once, as ever)
      var was = card[k] || (card[k] = []), wh = at[k] || (at[k] = []);
      if (i === 0) amend[k] = was[0] != null && bare(was[0]) === bare(e.text); // (the head the same: this card amended, not a new one under the old id)
      if (was[i] === e.text) return;
      if (amend[k] && wh[i]) unwrite(r, wh[i]); // (the line's earlier form out: only its final form stays)
      was[i] = e.text; fresh.push(logText(e)); placed.push({ k: k, i: i, text: logText(e) }); // (a card's line: new, or changed since it was last written)
    });
    if (!fresh.length) return;
    var dest = r.last || null;
    if (dest) dest.then = (dest.then || []).concat(fresh);
    else r.opening = (r.opening || []).concat(fresh); // (before the first answer -- the foes' first turns: kept for the transcript's head, 10-29)
    placed.forEach(function (p) { at[p.k][p.i] = { s: dest, text: p.text }; });
  }
  function unwrite(r, w) { var arr = w.s ? w.s.then : r.opening, j = arr ? arr.lastIndexOf(w.text) : -1; if (j >= 0) arr.splice(j, 1); }
  // what the answer came from, so a slip (a click that was meant for the wheel, the space bar early) can be told from a choice:
  // a mouse click (with where), the END key (space), the confirm key, another key by its name, or code (a helper, a test)
  function via() {
    var I = D.input, m = I.mouse, E = I.edge || {}, k = Object.keys(E).filter(function (n) { return E[n]; });
    if (m.click) return 'click ' + m.x + ',' + m.y;
    if (E.end) return 'space (END)';
    if (E.a) return 'confirm key';
    return k.length ? 'key ' + k.join('+') : 'code';
  }
  var short = function (c) {
    if (!c || typeof c !== 'object') return String(c);
    var t = c.target && typeof c.target === 'object' ? (c.target.name || c.target.id || (c.target.units ? c.target.units.length + ' aimed' : '')) : c.target;
    return c.do + (c.id ? ' ' + c.id : '') + (c.slot ? ' L' + c.slot : '') + (t ? ' -> ' + t : '') + (c.x != null ? ' to ' + c.x + ',' + c.y : '');
  };
  // what a refused click was on: the tool, the square, the figure there (REC.refused)
  var clicked = function (c) { return (c.tool ? c.tool + ' ' : '') + (c.x != null ? 'at ' + c.x + ',' + c.y : '') + (c.name ? ' (' + c.name + ')' : ''); };
  // the fight as plain reading, for comparing tactics: each turn's start, each answer with how it was made, and what the log said after
  function transcript(steps, opening) {
    var out = (opening || []).length ? ['== before the first answer'].concat(opening.map(function (l) { return '      ' + l; })) : []; // (10-29, the notes seat in his record: the wolf spider's opening bite that dropped Aurdin was in the log alone)
    steps.forEach(function (s) {
      if (s.turnStart) out.push('', '== R' + s.round + ' ' + s.who + '  hp ' + s.hp + '  at ' + s.at.join(',') + '  AI would: ' + (s.turnStart.ai || []).map(function (a) { return a.why + ' ' + a.score; }).join(' | '));
      out.push('  ' + (s.cmd ? short(s.cmd) : s.refused != null ? 'REFUSED' + (s.times > 1 ? ' x' + s.times : '') + ': ' + s.refused + (s.clicked ? '  -- ' + clicked(s.clicked) : '') : (s.prompt ? '[' + s.prompt.title + '] ' + s.answer : '?')) + '   (' + s.via + ')' + (s.left ? '  left: move ' + s.left.move + ', action ' + s.left.action + ', bonus ' + s.left.bonus : ''));
      (s.screen || []).forEach(function (l) { out.push('      on screen: ' + l); });
      (s.then || []).forEach(function (l) { out.push('      ' + l); });
    });
    return out;
  }
  function note(B, v) {
    var r = B.rec, req = B.req;
    if (!req || r.done) return;
    var u = req.turn || (req.prompt && req.prompt.who);
    if (!u || u.side !== 'party') return; // (a prompt of the foes' is the AI's; only ours are the player's)
    flush(B);
    if (!r.party.length) r.party = B.units.filter(function (w) { return w.side === 'party'; }).map(sheet);
    var step = { round: B.round, who: u.id, at: [u.x, u.y], hp: u.hp, via: via() };
    var shown = (B.cards || []).map(function (c) { return (c.lines || []).map(function (l) { return window.DS.stripCodes(String(l)); }).join(' / '); }).filter(Boolean);
    if (shown.length) step.screen = shown; // (the cards on the screen when it was answered: what the player was looking at)
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
  // A CLICK THE GAME TURNS AWAY (11-03, the play records lane 1: his clicks refused -- "No attack left this turn", out of reach, a dart refused -- reached the record only as a
  // card line in the log, never as a step, so a desk could not see what he tried; the 11-01 off-hand clicks were found only by their cards). A step of its own, `refused`
  // (the why: the card's words, or the error sound alone) and `clicked` { x, y, who, name, tool }, in its place among the answers; no `cmd`, so a reader counting the
  // answers skips it. The same refusal again at once counts up (`times`) rather than writing another
  REC.refused = function (B, u, why, at) {
    var r = B && B.rec;
    if (!r || r.done || !u || u.side !== 'party') return;
    flush(B);
    var L = r.last, same = L && L.refused === why && L.who === u.id && L.round === B.round && JSON.stringify(L.clicked || null) === JSON.stringify(at || null);
    if (same) { L.times = (L.times || 1) + 1; return; }
    if (!r.party.length) r.party = B.units.filter(function (w) { return w.side === 'party'; }).map(sheet);
    var step = { round: B.round, who: u.id, at: [u.x, u.y], hp: u.hp, via: via(), refused: why };
    if (at) step.clicked = at;
    if (B.req && B.req.turn === u) {
      var key = B.round + ':' + u.id, T = u.turn || {};
      if (r.turnKey !== key) { r.turnKey = key; step.turnStart = turnStart(B, u); }
      step.left = { move: T.move, action: T.action, bonus: T.bonus, attacksLeft: T.attacksLeft };
    }
    r.steps.push(step); r.last = step;
  };
  // the click run (js/ui.js actAt, READY's aim): an answer came of it -- note() wrote it -- or it was turned away, with a refusal's card ({o} or {p}, the orange and the fear's
  // purple) or the error sound; a click that did nothing and said nothing (a wall clicked on MOVE) is not a refusal and leaves nothing. The card's own log lines are the why,
  // so they are not written again under it
  var CARD_NO = /^\{[op]\}/;
  REC.tried = function (B, u, at, run) {
    var r = B && B.rec;
    if (!r || r.done || r.trying || !u || u.side !== 'party') return run();
    flush(B);
    var n0 = r.steps.length, cards0 = (B.cards || []).slice(), err = false, sfx0 = D.sfx, out;
    r.trying = true;
    D.sfx = function (id) { if (id === 'error') err = true; return sfx0.apply(this, arguments); };
    try { out = run(); } finally { D.sfx = sfx0; r.trying = false; }
    if (r.done || r.steps.length !== n0) return out;
    var said = [];
    (B.cards || []).forEach(function (c) { if (cards0.indexOf(c) < 0 && c.lines && CARD_NO.test(String(c.lines[0] || ''))) c.lines.forEach(function (l) { said.push(window.DS.stripCodes(String(l))); }); });
    if (!said.length && !err) return out;
    try {
      var seen = r.seen || (r.seen = new WeakSet());
      (B.logEntries || []).forEach(function (e) { if (e && typeof e === 'object' && !seen.has(e) && said.some(function (s) { return logText(e).slice(-s.length) === s; })) seen.add(e); });
      REC.refused(B, u, said.length ? said.join(' / ') : 'the error sound, no card', at);
    } catch (e) { (r.errors = r.errors || []).push(String(e)); } // (the record must never stop the click)
    return out;
  };

  // (a fight on a floor's own squares starts mid-log, the walk's lines above it: logFrom keeps only its own -- js/roam.js R.engage, 10-31)
  REC.start = function (B, what) {
    var n = (B.logEntries || []).length;
    B.rec = { v: 1, fight: what.fight, name: what.name, level: what.level, started: new Date().toISOString(), party: [], steps: [], logAt: n, logFrom: n, seen: new WeakSet((B.logEntries || []).filter(function (e) { return e && typeof e === 'object'; })), cardTxt: {}, cardAt: {}, hp0: {} }; // (seen: what the log held before this fight -- not its own) (hp0: each party unit's hit points as the fight begins, for the PARTY block -- startHp, above)
    REC.snap(B);
  };
  // hp0 { id: hp }: written once a unit, never over (11-03, the desk's read of his Hex bout). REC.start runs at the top of Battle.enter, before the units are built, so this runs again as enter returns (below)
  REC.snap = function (B) {
    var r = B && B.rec; if (!r) return;
    r.hp0 = r.hp0 || {};
    (B.units || []).forEach(function (w) { if (w.side === 'party' && r.hp0[w.id] == null) r.hp0[w.id] = w.hp; });
  };
  REC.finish = function (B, result) {
    var r = B.rec;
    if (!r || r.done) return;
    r.done = true;
    write(B, result);
  };
  // a fight not over yet, kept as far as it has gone: at each round's turn (battle.js, the round's top) and as the tab goes (pagehide,
  // below) -- 10-02, Griz, a bulette fight lost to a closed tab: "yes, if it's overwriting (or not really) that should be pretty cheap".
  // It writes over its own line in deep16.plays (the fight and its start), and REC.finish writes over it again at the end
  REC.checkpoint = function (B) {
    var r = B && B.rec;
    if (!r || r.done || (!r.steps.length && !(B.logEntries || []).length)) return; // (a fight the AI plays has no hand's steps, only its log: kept too -- todo §6, the Skylights' small ones, 10-14)
    write(B, 'unfinished');
  };
  function write(B, result) {
    var r = B.rec;
    flush(B);
    r.result = result; r.rounds = B.round; r.ended = new Date().toISOString();
    r.partyEnd = B.units.filter(function (w) { return w.side === 'party'; }).map(function (w) { return { id: w.id, hp: Math.max(0, w.hp), maxhp: w.maxhp, down: !!(w.ko || w.hp <= 0 || w.dead) }; });
    r.log = (B.logEntries || []).slice(r.logFrom || 0).map(logText);
    try { r.transcript = transcript(r.steps, r.opening); } catch (e) { (r.errors = r.errors || []).push(String(e)); }
    var out = {}; Object.keys(r).forEach(function (k) { if (k !== 'last' && k !== 'turnKey' && k !== 'logAt' && k !== 'logFrom' && k !== 'done' && k !== 'seen' && k !== 'cardTxt' && k !== 'cardAt' && k !== 'trying') out[k] = r[k]; });
    out = JSON.parse(JSON.stringify(out)); // (a copy: the live record goes on growing, and the shrink below must not cut its log)
    var all = D.store.get(KEY) || [], at = -1;
    all.forEach(function (f, i) { if (f.fight === r.fight && f.started === r.started) at = i; });
    if (at >= 0) all[at] = out; else all.push(out);
    while (all.length > KEEP) all.shift();
    // (browser storage is small: past ROOM, or past what the browser will take, the oldest fights go first, then the full logs, which the steps repeat)
    var sizes = all.map(function (f) { return JSON.stringify(f).length; }), total = sizes.reduce(function (a, b) { return a + b; }, 0);
    while (total > ROOM && all.length > 1) { total -= sizes.shift(); all.shift(); }
    if (total > ROOM) all.forEach(function (f) { delete f.log; });
    while (!D.store.set(KEY, all) && all.length > 1) all.shift();
    if (!D.store.set(KEY, all)) { all.forEach(function (f) { delete f.log; }); D.store.set(KEY, all); }
  }
  REC.count = function () { return (D.store.get(KEY) || []).length; };
  REC.ROOM = ROOM;
  // room for a save the browser refused (D.store.set, js/core.js): the oldest half of the kept fights go, and the save is tried again --
  // a roster, a camp or a ladder is worth more than an old fight's record (false: nothing left to give)
  REC.room = function () {
    var all = D.store.get(KEY) || [];
    if (!all.length) return false;
    all.splice(0, Math.ceil(all.length / 2));
    if (!D.store.set(KEY, all)) { try { window.localStorage.removeItem(KEY); } catch (e) { return false; } } // (a shorter list refused too: the record goes whole, so the asking stops)
    return true;
  };
  // what the last save wrote (10-04, Griz: "add a 'clear record' after you save on the ladder"): every R writes every kept fight, so a record that is
  // never cleared is written again whole into the next file (seven saves held 72 fights, 34 of them once each). CLEAR RECORD, after a save, takes the
  // fights that file holds and none played since -- and only after a save, so nothing goes that no file has
  var fileHas = null;
  function tag(f) { return f.fight + '|' + f.started; }
  REC.lastFile = function () { return fileHas ? fileHas.name : null; };
  // how many of the kept fights the last save holds (0: nothing saved yet, or all cleared)
  REC.clearable = function () {
    if (!fileHas) return 0;
    return (D.store.get(KEY) || []).filter(function (f) { return fileHas.tags.indexOf(tag(f)) >= 0; }).length;
  };
  // the fights the last save holds leave the browser; { gone, kept (played since), file }, or false (nothing saved, or the browser refused)
  REC.clear = function () {
    if (!fileHas) return false;
    var all = D.store.get(KEY) || [], keep = all.filter(function (f) { return fileHas.tags.indexOf(tag(f)) < 0; });
    if (!D.store.set(KEY, keep)) return false;
    var r = { gone: all.length - keep.length, kept: keep.length, file: fileHas.name };
    fileHas = null;
    return r;
  };
  // R on the tester ladder: every kept fight to one file (a download: the browser asks where, or drops it in Downloads)
  REC.save = function () {
    var all = D.store.get(KEY) || [];
    if (!all.length) return false;
    var d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var name = 'deep16-play-record-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.json';
    var body = JSON.stringify({ what: 'DEEP16 play record: every fight this browser kept at this address -- the tester ladder played (P), ?fight=, ?npc= (the class floor, since 10-06), the Pocket DM, the story inside the 8-bit (js/record.js)', saved: d.toISOString(), fights: all }, null, 1);
    var a = document.createElement('a'), url = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    fileHas = { name: name, tags: all.map(tag) };
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
    var r = enter0.apply(this, arguments);
    if (this.rec) REC.snap(this); // (the units are built: their hit points as the fight begins -- before the first blow, the first answer)
    return r;
  };
  // the fight's end closes its record where no door of its own does (10-06: ?fight= and ?npc= have no onDone -- the ladder, the climb and the Pocket DM finish
  // theirs there -- so their records stood 'unfinished' at the last round's checkpoint; Griz's Skylights of 10-05 is one). The story inside the 8-bit HAS an
  // onDone (js/embed.js E.done, which hands the fight back and never finished the record): every story fight he played to 10-12, won or run from, read
  // 'unfinished' (10-13, the road §7g; Griz: "a lot of story fights I ran from, fix if broken") -- so an embedded fight closes its record here too
  var finish0 = P.finish;
  P.finish = function* (o) {
    if (this.rec && !this.rec.done && (typeof this.o.onDone !== 'function' || this.o.embed)) { try { REC.finish(this, o || 'ended'); } catch (e) { /* (the record must never stop the fight's end) */ } }
    return yield* finish0.apply(this, arguments);
  };
  // the tab closed, reloaded or sent away mid-fight: the fight as far as it went (REC.checkpoint)
  window.addEventListener('pagehide', function () { try { REC.checkpoint(D.battle); } catch (e) { /* (nothing to keep) */ } });
})();
