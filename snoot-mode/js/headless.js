/* THE SNOOT -- the headless fight, asked for and shown (11-13, the lanes desk). Griz: "the fight runs headless and is communicated to the player translated
   into simultaneous turns per side, with special effects from spells and stuff - as if it was a 'simple' fight..."; "we're still doing the simple representation
   on a zoomed in world map for the player"; a beat, "where one beat would probably be x seconds of idle, appropriate attack animation, x seconds of idle".
   Two of the board's units are sent to DEEP16 in a frame nobody sees (deep16/js/headless.js H.serve: the fight fought whole on a field with no map), and what
   comes back -- its beats, a run of one group's turns each -- is laid into the day's own beats (SN.beat) as the show's `hbeat`, `cas`, `herofall`, `fall`, `gone`
   and `hend`, so js/show.js plays it as it plays every fight: the map's camera down into the hex, the two formations, the side whose beat it is swinging together.
   An experiment beside the CHAINMAIL table ("we're experimenting if we prefer this to replace chainmail table"): no day of the game calls this yet. Its door:
     snoot-mode/?headless=patrol,sg1&seed=7      (two unit ids of js/data.js; &at=x,y the hex; &lvl=)
   The door plays a game of its own making and never writes the save. */
'use strict';
(function () {
  var SN = window.SN, HL = SN.Headless = {};
  HL.READY_MS = 30000; HL.RUN_MS = 120000;
  // a unit as the grid's bodies need it (deep16/js/headless.js H.listOf), with its morale as the Snoot rates it
  HL.pack = function (u) {
    return { id: u.id, name: u.name, kind: u.kind, figs: u.figs || 0, comp: u.comp || null, harbinger: !!u.harbinger, volley: !!u.volley, mounted: !!u.mounted,
      groups: u.groups ? u.groups.map(function (g) { return { n: g.n, mounted: !!g.mounted, volley: !!g.volley }; }) : null,
      heroes: SN.heroesOf(u).map(function (h) { return { name: h.name, grid: h.grid || null, paladin: !!h.paladin, warlock: !!h.warlock, harbinger: !!h.harbinger }; }),
      rating: SN.rating(u), never: SN.nevers(u) };
  };
  // the fight fought: done(res) -- res.result 'won' (a's) | 'lost' (b's) | 'both' | 'error', res.beats, res.a, res.b; null if the grid would not come up
  HL.ask = function (a, b, o, done) {
    var fr = document.createElement('iframe'), closed = false, timer = null, id = 'h' + Date.now();
    function close(m) { if (closed) return; closed = true; clearTimeout(timer); window.removeEventListener('message', on); if (fr.parentNode) fr.parentNode.removeChild(fr); done(m && m.type === 'd16h:done' ? m.res : null, m); }
    function on(e) {
      if (e.source !== fr.contentWindow || !e.data) return; var m = e.data;
      if (m.type === 'd16h:ready') { clearTimeout(timer); timer = setTimeout(function () { close({ type: 'd16h:crash', msg: 'no answer' }); }, HL.RUN_MS); fr.contentWindow.postMessage({ type: 'snh:fight', id: id, a: HL.pack(a), b: HL.pack(b), seed: o && o.seed, level: o && o.level }, '*'); }
      if ((m.type === 'd16h:done' || m.type === 'd16h:crash') && (m.id === id || m.type === 'd16h:crash')) close(m);
    }
    window.addEventListener('message', on);
    fr.title = 'DEEP16, unseen'; fr.setAttribute('aria-hidden', 'true'); fr.style.cssText = 'position:absolute;left:-9999px;top:0;width:480px;height:270px;border:0;visibility:hidden';
    fr.src = (SN.DEEP16 || '../deep16/') + 'index.html?headlessrun';
    document.body.appendChild(fr);
    timer = setTimeout(function () { close({ type: 'd16h:crash', msg: 'no ready' }); }, HL.READY_MS);
  };
  // what a turn did, in a few words, when it struck no blow (a spell, a prayer, a trick)
  var said = function (tn) { var c = (tn.cards || [])[0] || ''; return tn.blows && tn.blows.length ? '' : c.replace(/\s+/g, ' ').slice(0, 64); };
  // the grid's beats into the day's: st.beats gains the fight from `at`; returns [from, to)
  HL.lay = function (st, a, b, at, res) {
    var from = (st.beats || []).length, U = { a: a, b: b }, men = { a: a.figs || 0, b: b.figs || 0 }, round = 0;
    var heroesLeft = { a: SN.heroesOf(a).map(function (h) { return h.name; }), b: SN.heroesOf(b).map(function (h) { return h.name; }) };
    var isMan = function (g, word) { var t = res[g].kinds[word]; return !/^(paladin|greyfang|katarina|patrollady|harbinger|gnollmatriarch(eldest|lama))/.test(word) || !heroesLeft[g].length || (t && t.n > heroesLeft[g].length + 2); };
    SN.beat(st, { t: 'fight', at: at.slice(), place: SN.placeName(at), ter: SN.ter(at[0], at[1]), road: SN.road(at), ours: [SN.snap(a, at)], theirs: [SN.snap(b, at)] });
    (res.beats || []).forEach(function (bt) {
      if (bt.round !== round) { round = bt.round; SN.beat(st, { t: 'round', n: round }); }
      var hits = 0, swings = 0, words = [];
      bt.turns.forEach(function (tn) { (tn.blows || []).forEach(function (x) { swings++; if (x.hit && x.hit !== 'MISS') hits++; }); var w = said(tn); if (w) words.push(w); });
      SN.beat(st, { t: 'hbeat', u: U[bt.g].id, n: bt.turns.length, swings: swings, hits: hits, words: words.slice(0, 2), name: U[bt.g].name });
      ['a', 'b'].forEach(function (g) {
        var fell = bt.fell.filter(function (x) { return x.g === g; }), m = 0;
        fell.forEach(function (x) { if (isMan(g, x.word)) m++; else SN.beat(st, { t: 'herofall', u: U[g].id, name: heroesLeft[g].shift() }); });
        if (m) { men[g] = Math.max(0, men[g] - m); SN.beat(st, { t: 'cas', u: U[g].id, n: m, figs: men[g] }); }
      });
    });
    ['a', 'b'].forEach(function (g) { var t = res[g]; if (!t.up) SN.beat(st, t.broke ? { t: 'fall', u: U[g].id, how: 'rout', dir: -1 } : { t: 'gone', u: U[g].id }); });
    var tl = function (g) { var t = res[g]; return t.name + ': ' + t.up + ' of ' + t.n + ' standing' + (t.away ? ', ' + t.away + ' away' : ''); };
    SN.beat(st, { t: 'hend', big: res.result === 'won' ? a.name.toUpperCase() + ' HOLD THE FIELD' : res.result === 'lost' ? b.name.toUpperCase() + ' HOLD THE FIELD' : 'NOBODY HOLDS THE FIELD',
      small: tl('a') + ' -- ' + tl('b') + ' (' + res.rounds + ' rounds, the ranks ' + res.gapFt + ' ft apart)' + (res.morale && res.morale.length ? ' -- ' + res.morale.filter(function (l) { return /BREAKS/.test(l); }).length + ' broke' : '') });
    return [from, st.beats.length];
  };

  // ---------------------------------------------------------------- the door: two units of the board, a hex, the fight, the show
  HL.door = function () {
    var Q = location.search, m = /[?&]headless=([\w-]+),([\w-]+)/.exec(Q); if (!m) return false;
    var sd = /[?&]seed=(\d+)/.exec(Q), atq = /[?&]at=(\d+),(\d+)/.exec(Q), lv = /[?&]lvl=(\d+)/.exec(Q), seed = sd ? +sd[1] : 7;
    var UI = SN.UI, V = SN.V, st = SN.newGame(seed), a = SN.unit(st, m[1]), b = SN.unit(st, m[2]);
    var card = function (html, btns) { UI.card(html, btns); };
    if (!a || !b) { card('<h1>THE HEADLESS FIGHT</h1><p>No such unit: ' + (a ? m[2] : m[1]) + '. The ids are js/data.js\'s (patrol, greyfang, sg1, sg3, gk1, wl1, harb, dm1 ...).</p>', [{ label: 'OK', go: true }]); return true; }
    if (!a.figs && a.groups) a.figs = a.groups.reduce(function (s, g) { return s + g.n; }, 0); if (!b.figs && b.groups) b.figs = b.groups.reduce(function (s, g) { return s + g.n; }, 0);
    var at = atq ? [+atq[1], +atq[2]] : a.at.slice();
    st.units = st.units.filter(function (u) { return u === a || u === b; }); // (the board bare but for the two)
    b.came = b.at.slice(); a.at = at.slice(); b.at = at.slice(); if (SN.same(b.came, at)) b.came = [at[0] + 1, at[1]];
    V.preload(st);
    var play = function (res) {
      st.beats = []; var r = HL.lay(st, a, b, at, res);
      SN.Show.skipDay = false;
      SN.Show.play(st, r[0], r[1], at, function () {
        var row = function (g) { var t = res[g]; return '<p><b>' + t.name + '</b>: ' + t.up + ' of ' + t.n + ' standing' + (t.away ? ', ' + t.away + ' away' : '') + (t.broke ? ' (broke)' : '') + '</p>'; };
        card('<h1>' + (res.result === 'won' ? a.name : res.result === 'lost' ? b.name : 'Nobody') + ' ' + (res.result === 'both' ? 'holds' : 'hold') + ' the field</h1>' + row('a') + row('b') + '<p>' + res.rounds + ' rounds, ' + res.beats.length + ' beats, the ranks ' + res.gapFt + ' ft apart. Seed ' + seed + '.</p>' + (res.morale || []).map(function (l) { return '<p>' + l.replace(/</g, '&lt;') + '</p>'; }).join(''),
          [{ label: 'AGAIN', go: true, fn: function () { play(res); } }, { label: 'ANOTHER SEED', fn: function () { location.search = Q.replace(/([?&])seed=\d+/, '').replace(/^\?&/, '?') + '&seed=' + (seed + 1); } }]);
      });
    };
    card('<h1>THE HEADLESS FIGHT</h1><p>' + a.name + ' and ' + b.name + ' at ' + SN.placeName(at) + '. The grid is fighting it where nobody sees...</p>', []);
    HL.ask(a, b, { seed: seed, level: lv ? +lv[1] : 4 }, function (res, m2) {
      UI.closeCard();
      if (!res || res.result === 'error') { card('<h1>THE HEADLESS FIGHT</h1><p>The grid would not fight it (' + (res && res.error || m2 && m2.msg || 'no answer') + ').</p>', [{ label: 'OK', go: true }]); return; }
      HL.last = res; play(res);
    });
    return true;
  };
  window.addEventListener('load', function () { setTimeout(function () { try { HL.door(); } catch (e) { if (window.console) console.error(e); } }, 50); });
})();
