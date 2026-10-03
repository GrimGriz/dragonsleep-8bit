/* The Keeper's combat log (10-03, Griz: "a persistent combat log for the Keeper fight").
   D16.keeperLog is an array of lines, kept for the whole fight (reset when the next Keeper fight enters):
     { round, turn, actor, action, targets: [names], rolls: [text], result: text, hpAfter: { name: hp }, flags: { flood, wall, swirl, frozen } }
   D16.keeperLog.meta = { seed, level, mode ('ai' = watched, 'keeper' = play=keeper, 'party' = play=party or the keys), result }.
   D16.keeperLog.text() -- the whole log as plain text; D16.keeperLog.download() -- the same as a file, keeper-seed<seed>-L<level>.txt; it downloads by itself when the
   fight ends (not in a bench: B.bench, nor with &nolog).
   How: every action of the fight is logged once, at its outermost call -- a hero's command or move (Battle.exec / moveAlong), a blow (attack), a spell (D.magic.cast),
   and the Keeper's own (K.wave, castWall, readyWall, flood, suffocate, iceTry, raiseWall, drownTick); the cards the action shows are caught as it runs (the rolls are the
   d20 and dice lines, the result the rest), the hit points and the conditions are read before and after (who it touched). Both play modes and the watched fight write it. */
'use strict';
(function () {
  var D = window.D16, K = D.keeper, G = D.grid, RU = D.rules;
  if (!K || !D.Battle) return;
  var L = D.keeperLog = [];
  L.meta = {};
  function plain(s) { return String(s).replace(/\{[a-z\/]+\}/g, '').replace(/\s+/g, ' ').trim(); }
  function mine(B) { return !!(B && B.fight && K.isFight(B.fight) && B._klog); }
  // who plays (10-03: the 8-bit's own fight, played by hand, wrote "mode ai"): play= when the page names it, else 'ai' for a watched or benched fight, 'party' for the keys
  function modeOf(B) { return (B.o && B.o.play) || (B.bench || (B.o && B.o.bench) ? 'ai' : 'party'); }
  // a blow's damage halved, nothing or doubled by what it is (battle.js typed: the Keeper resists fire) -- 10-03: the log said "= 9 fire" and the Keeper lost 4; one line an action, each blow's before and after
  function resLines(st) {
    var by = {}, out = []; (st.res || []).forEach(function (r) { var k = r.who + ' ' + r.why + ' ' + r.type; (by[k] = by[k] || []).push(r.n + ' becomes ' + r.to); });
    Object.keys(by).forEach(function (k) { out.push(k + ': ' + by[k].join(', ')); }); st.res = [];
    return out;
  }
  // the file by itself at the fight's end (10-03, Griz: "they've been useful as is, better not broken (though live should no longer be saving them)"): on the live site only when
  // asked -- &log on the address (the 8-bit's ?log goes on to the grid's frame: js/embed.js), or D16.keeperLog.download() -- and by itself as before when served from this machine
  // (the preview server, a file); &nolog never
  function wantFile() {
    var q = location.search; if (/[?&]nolog\b/.test(q)) return false; if (/[?&]log\b/.test(q)) return true;
    return location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname);
  }
  // what the actor has to spend, and where it stands: a command that changed none of it, no one's HP or conditions, and rolled nothing was refused -- a card said why (10-03, Griz's
  // play=keeper log: "it is in the swirl: LET GO first" had a line of its own)
  function spendOf(u) {
    if (!u) return '';
    var t = u.turn || {}, o = Object.keys(t).sort().map(function (k) { var v = t[k]; return k + '=' + (v != null && typeof v === 'object' ? (v.id || Object.keys(v).length) : v); });
    var f = ''; try { f = JSON.stringify(u.feats || {}); } catch (e) { f = ''; }
    return o.join(';') + '|' + u.x + ',' + u.y + '|' + u.reaction + '|' + (u.slots || []).join('/') + '|' + f;
  }
  function snap(B) { var o = {}; B.units.forEach(function (u) { o[u.id] = { u: u, hp: u.hp, c: Object.keys(u.conds || {}).filter(function (k) { return u.conds[k]; }).sort().join(',') }; }); return o; }
  function flagsOf(B, text) {
    var S = B.kp, k = B.units.filter(function (u) { return u.kind === 'keeper'; })[0], f = {};
    f.flood = B.units.some(function (u) { var r = u.conds && u.conds.restrained; return r && r.water && u.hp > 0; }) || /washed into the deep|pours? over/.test(text);
    f.wall = !!(S && S.wall);
    f.swirl = !!(k && k.flooding);
    f.frozen = !!(S && S.ice && Object.keys(S.ice).length) || !!(k && k.conds && k.conds.restrained && k.conds.restrained.ice);
    return f;
  }
  var ROLL = /\bd20\b|\b\d+d\d+\b/;
  var OUT = /CRITICAL|HIT|MISS|KNOCKED DOWN|keeps its feet|STAYS UP|SAVED|FAILED|BREAKS|SPRINGS/g;
  // ---- the gap: an HP change nothing above logged (a feature's bonus action called straight from the AI -- Lay on Hands, a word of healing -- the start of a turn, a rule) is a line of its own,
  // with the cards that were shown between the actions; every HP change in the fight has a line (10-03, the desk: Vivian down at 0 and up at 15 with no line between: it was Lymen's Lay on Hands)
  function hpMap(B) { var o = {}; B.units.forEach(function (w) { if (!w.isWall) o[w.id] = w.hp; }); return o; }
  function gap(B, why) {
    var st = B._klog; if (!st || st.depth > 0) return;
    var now = hpMap(B), ch = B.units.filter(function (w) { return !w.isWall && st.hp && st.hp[w.id] != null && st.hp[w.id] !== w.hp; }), amb = st.amb || []; st.amb = [];
    if (ch.length) {
      var lines = [], seen = {}; amb.forEach(function (c) { c.split(' | ').forEach(function (ln) { var s = plain(ln); if (s && !seen[s]) { seen[s] = 1; lines.push(s); } }); });
      resLines(st).forEach(function (s) { lines.push(s); });
      var rolls = lines.filter(function (x) { return ROLL.test(x); }), rest = lines.filter(function (x) { return !ROLL.test(x); }), actor = '';
      B.units.some(function (w) { return rest.some(function (x) { if (x.indexOf(w.name) === 0 && !w.isWall) { actor = w.name; return true; } return false; }); });
      var hp = {}; B.units.forEach(function (w) { if (!w.familiar && !w.isWall) hp[w.name] = w.hp; });
      var delta = ch.map(function (w) { return w.name + ' ' + st.hp[w.id] + ' -> ' + w.hp; }).join(', ');
      L.meta.mode = modeOf(B);
      // (round: the round of the turn it happened in -- caught at the next turn's door, it had the next round's number; 10-03)
      L.push({ round: st.round != null ? st.round : B.round, turn: st.turn, actor: actor, action: 'hp change between actions (' + why + ')', targets: ch.map(function (w) { return w.name; }), rolls: rolls, result: delta + (rest.length ? ' / ' + rest.join(' / ') : ''), hpAfter: hp, flags: flagsOf(B, lines.join(' ')) });
    }
    st.res = []; st.hp = now;
  }
  function wrap(B, u, action, targets, gen, cmd) { // gen: the generator the action is; returns its value. cmd: a command (Battle.exec), which a card may refuse
    return (function* () {
      if (!mine(B) || B._klog.depth > 0) return yield* gen;
      gap(B, 'before ' + action);
      var st = B._klog, before = snap(B), had = cmd ? spendOf(u) : null, cards = []; st.depth++; st.cap = cards;
      var v; try { v = yield* gen; } finally { st.depth--; st.cap = null; }
      push(B, u, action, targets, cards, before, had);
      return v;
    })();
  }
  function plainCall(B, u, action, targets, fn) { // the same for a plain function
    if (!mine(B) || B._klog.depth > 0) return fn();
    gap(B, 'before ' + action);
    var st = B._klog, before = snap(B), cards = []; st.depth++; st.cap = cards;
    var v; try { v = fn(); } finally { st.depth--; st.cap = null; }
    push(B, u, action, targets, cards, before);
    return v;
  }
  function push(B, u, action, targets, cards, before, had) {
    var lines = [], seen = {};
    cards.forEach(function (c) { c.split(' | ').forEach(function (ln) { var s = plain(ln); if (s && !seen[s]) { seen[s] = 1; lines.push(s); } }); });
    resLines(B._klog).forEach(function (s) { lines.push(s); });
    var rolls = lines.filter(function (s) { return ROLL.test(s); }), rest = lines.filter(function (s) { return !ROLL.test(s); }), text = lines.join(' ');
    var result = rest.join(' / '); if (!result) result = (rolls.join(' ').match(OUT) || []).join(' ');
    var tg = (targets || []).filter(Boolean).map(function (t) { return t.name || String(t); }), changed = false;
    B.units.forEach(function (w) { var b = before[w.id]; if (b && (b.hp !== w.hp || b.c !== Object.keys(w.conds || {}).filter(function (k) { return w.conds[k]; }).sort().join(',')) && !w.isWall) { changed = true; if (w !== u && tg.indexOf(w.name) < 0) tg.push(w.name); } });
    var hp = {}; B.units.forEach(function (w) { if (!w.familiar && !w.isWall) hp[w.name] = w.hp; });
    B._klog.hp = hpMap(B); B._klog.amb = [];
    if (action === 'end' || action === 'none' || action == null) return;
    if (!rolls.length && !result && !changed) return; // (a click that did nothing -- a DASHMOVE with no square picked, a READY that opened its menu -- and the drowning of one already down: no line; 10-03)
    if (!rolls.length && !changed && had != null && u && spendOf(u) === had) return; // (a click refused with a card -- nothing spent, nothing moved: no line; spendOf above)
    L.meta.mode = modeOf(B); // (play= is set after enter: read on every line)
    L.push({ round: B.round, turn: B._klog.turn, actor: u ? u.name : '', action: action, targets: tg, rolls: rolls, result: result, hpAfter: hp, flags: flagsOf(B, text) });
  }
  function nm(t) { return t && t.name ? t : null; }
  function wrapProto(obj, name, f) { var f0 = obj[name]; obj[name] = f(f0); }

  // ---- the fight begins: a new log
  wrapProto(D.Battle.prototype, 'enter', function (enter0) {
    return function () {
      var seed = D.seed >>> 0, r = enter0.apply(this, arguments), B = this;
      if (!(B.fight && K.isFight(B.fight))) return r;
      L.length = 0; B._klog = { depth: 0, cap: null, turn: 0, amb: [], res: [], hp: hpMap(B) };
      var lv = 0; B.units.forEach(function (u) { if (u.side === 'party' && u.lvl > lv) lv = u.lvl; });
      L.meta = { seed: seed, level: lv, mode: modeOf(B), result: null, fight: B.fight.id, start: B.startAt || 'ledge', cfg: Object.assign({}, K.CFG) }; // (the Keeper's settings as the fight began: a playtest is compared by them; start: where the party came in, the ledge or the rune -- 10-03)
      var c0 = B.card; B.card = function (lines) { if (B._klog) { if (B._klog.cap) B._klog.cap.push((lines || []).join(' | ')); else if (B._klog.depth === 0) B._klog.amb.push((lines || []).join(' | ')); } return c0.apply(this, arguments); };
      return r;
    };
  });
  // a turn begins: the turn counter (the rules' startTurn is one function for everyone)
  var st0 = RU.startTurn; RU.startTurn = function (u) { var B = D.battle, on = mine(B); if (on) gap(B, 'before ' + (u && u.name) + '\'s turn'); if (on) { B._klog.turn++; B._klog.round = B.round; } var r = st0.apply(this, arguments); if (on) gap(B, 'the start of ' + (u && u.name) + '\'s turn'); return r; };

  // ---- the heroes' and the human Keeper's commands, moves, blows, spells
  wrapProto(D.Battle.prototype, 'exec', function (e0) { return function* (u, c) { var B = this; if (!mine(B)) return yield* e0.apply(this, arguments); return yield* wrap(B, u, c && c.do === 'attack' && u && u.kind === 'keeper' ? 'kslam' : c && c.do, [nm(c && c.target), c && c.id ? B.units.filter(function (w) { return w.id === c.id; })[0] : null], e0.apply(this, arguments), true); }; });
  wrapProto(D.Battle.prototype, 'moveAlong', function (m0) {
    return function* (u, path, o) {
      var B = this; if (!mine(B)) return yield* m0.apply(this, arguments); // (inert outside the Keeper's fight)
      var f = [K.A(u), K.C(u)], g = m0.apply(this, arguments);
      return yield* wrap(B, u, 'move', [], (function* () { var v = yield* g; if (B._klog && B._klog.cap) if (B._klog && B._klog.cap && (f[0] !== K.A(u) || f[1] !== K.C(u))) B._klog.cap.push('from ' + f[0] + ',' + f[1] + ' to ' + K.A(u) + ',' + K.C(u) + ' (along, across' + ((u.size || 1) > 1 ? '; the anchor of its ' + u.size + 'x' + u.size + ' body, the rest of it implied' : '') + ')'); return v; })());
    };
  });
  wrapProto(D.Battle.prototype, 'attack', function (a0) { return function* (att, tgt, atk, o) { return yield* wrap(this, att, (o && o.oa ? 'opportunity attack: ' : 'attack: ') + ((atk && atk.name) || 'blow'), [tgt], a0.apply(this, arguments)); }; });
  wrapProto(D.magic, 'cast', function (c0) { return function* (B, u, id, slot, t) { var sp = D.magic.data && D.magic.data(id); return yield* wrap(B, u, 'cast: ' + ((sp && sp.name) || id) + (slot ? ' (L' + slot + ')' : ''), [t && t.name ? t : null], c0.apply(this, arguments)); }; });
  // the class AI's Hide (js/tactics.js calls B.hide itself, not a command: 10-03, Vivian "no longer hidden" with no hide in the log); a hero's HIDE command is logged once, as before
  wrapProto(D.Battle.prototype, 'hide', function (h0) { return function* (u) { return yield* wrap(this, u, 'hide', [], h0.apply(this, arguments)); }; });
  // resisted, immune, vulnerable: kept for the action's line (resLines above)
  wrapProto(D.Battle.prototype, 'typed', function (t0) { return function (u, n, type) { var r = t0.apply(this, arguments); if (mine(this) && r && r.why && r.n !== n) this._klog.res.push({ who: u.name, why: r.why, type: type || 'it', n: n, to: r.n }); return r; }; });

  // ---- the Keeper's own
  [['wave', function (B, u) { return [u, 'the Wave', []]; }],
   ['castWall', function (B, u) { return [u, 'CAST Ice Wall', []]; }],
   ['readyWall', function (B, u) { return [u, 'READY Ice Wall', []]; }],
   ['flood', function (B, u, h) { return [u, 'swirl', [h]]; }],
   ['suffocate', function (B, u, v) { return [u, 'Active Suffocation', [v]]; }],
   ['iceTry', function (B, u, how) { return [u, 'break free of the ice (' + how + ')', []]; }],
   ['raiseWall', function (B, u, trig) { return [u, trig ? 'Ice Wall springs' : 'Ice Wall rises', [trig]]; }],
   ['oaWave', function (B, u, v) { return [u, 'opportunity wave', [v]]; }]
  ].forEach(function (p) {
    var n = p[0], d = p[1], f0 = K[n]; if (!f0) return;
    K[n] = function* (B) { var x = d.apply(null, arguments); return yield* wrap(B, x[0], x[1], x[2], f0.apply(this, arguments)); };
  });
  var dt0 = K.drownTick; K.drownTick = function (B, v) { var a = arguments; return plainCall(B, v, 'drowning', [], function () { return dt0.apply(K, a); }); };

  // ---- the end: the result line, and the file
  L.text = function () {
    var m = L.meta || {}, out = ['THE KEEPER OF THE FLOODED STAIR -- combat log', 'seed ' + m.seed + ', level ' + m.level + ', mode ' + m.mode + (m.fight ? ', fight ' + m.fight : '') + (m.start ? ', start ' + m.start : '') + (m.result ? ', result ' + m.result : '')];
    if (m.cfg) { var c = m.cfg, ORDER = ['hp', 'slams', 'slamDice', 'slamAtk', 'waveDC', 'sweepUpFree', 'washNoWall', 'drown', 'suffocateDice', 'suffocateBonus', 'swirlHit', 'heldStruggle', 'deepDepth', 'swirlAny', 'deepAC', 'wallUses', 'wallHP', 'wallAC', 'initBonus', 'aiCast', 'visible', 'glow', 'partyOpening', 'openingDrift', 'weaponResist', 'oaWave'];
      out.push('settings: ' + ORDER.filter(function (k) { return k in c; }).concat(Object.keys(c).filter(function (k) { return ORDER.indexOf(k) < 0; }).sort()).map(function (k) { return k + '=' + (c[k] === null ? 'null' : c[k]); }).join(', ')); }
    out.push('');
    L.forEach(function (e) {
      var fl = Object.keys(e.flags || {}).filter(function (k) { return e.flags[k]; }).join(',');
      out.push('R' + e.round + ' T' + e.turn + '  ' + e.actor + ': ' + e.action + (e.targets && e.targets.length ? ' -> ' + e.targets.join(', ') : ''));
      (e.rolls || []).forEach(function (r) { out.push('    roll: ' + r); });
      if (e.result) out.push('    result: ' + e.result);
      out.push('    hp: ' + Object.keys(e.hpAfter || {}).map(function (k) { return k + ' ' + e.hpAfter[k]; }).join(', ') + (fl ? '    [' + fl + ']' : ''));
    });
    return out.join('\n') + '\n';
  };
  // a line of the log that no action made (the wall thawing, the stalemate breaker): who, what, why
  L.say = function (B, who, action, result) { if (!mine(B)) return; var hp = {}; B.units.forEach(function (w) { if (!w.familiar && !w.isWall) hp[w.name] = w.hp; }); L.push({ round: B.round, turn: B._klog.turn, actor: who || '', action: action, targets: [], rolls: [], result: result || '', hpAfter: hp, flags: flagsOf(B, '') }); };
  L.filename = function () { var m = L.meta || {}; return 'keeper-seed' + m.seed + '-L' + m.level + '.txt'; };
  L.download = function () {
    if (typeof document === 'undefined' || typeof Blob === 'undefined' || !document.body) return false;
    try { var a = document.createElement('a'), url = URL.createObjectURL(new Blob([L.text()], { type: 'text/plain' })); a.href = url; a.download = L.filename(); document.body.appendChild(a); a.click(); setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500); return true; } catch (e) { return false; }
  };
  wrapProto(D.Battle.prototype, 'finish', function (f0) {
    return function* (o) {
      var B = this;
      if (mine(B)) { gap(B, 'the end'); L.meta.result = o; L.push({ round: B.round, turn: B._klog.turn, actor: '', action: 'the fight ends', targets: [], rolls: [], result: String(o), hpAfter: (function () { var h = {}; B.units.forEach(function (w) { if (!w.familiar && !w.isWall) h[w.name] = w.hp; }); return h; })(), flags: flagsOf(B, '') });
        if (!B.bench && !(B.o && B.o.bench) && wantFile() && !B._klog.saved) { B._klog.saved = true; L.download(); } }
      return yield* f0.apply(this, arguments);
    };
  });
})();
