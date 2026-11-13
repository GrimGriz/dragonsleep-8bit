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
  HL.SPREAD = 0.4; // (each formation's middle from the hex's, in hex radii)
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
  var HERO = /^(paladin|greyfang|katarina|patrollady|harbinger|gnollmatriarch(eldest|lama))/; // (the grid's words that are a unit's heroes, not its men)
  // a spell read off the grid's card or a blow's name, for its light in the show (the desk's first reading, to be widened as the fights show what is cast):
  // KIND -- on the caster's own side; BOLT -- thrown at the other; FIRE -- of those, the ones that burn
  var KIND = /bless|lays on hands|heal|cure|aid\b|shield of faith|sanctuary|prayer/i, BOLT = /blast|bolt|\bray\b|missile|flame|fire|burn|lightning|sacred|guiding|thunder|shatter/i, FIRE = /flame|fire|burn/i;
  // THE EXPERIMENT'S ROAD PATROL (11-13, Griz: "swap out 4 heavy horse for 2 more paladins", then "the road patrol for our experiment should be the 3 pallys"):
  // three paladins and the twelve heavy foot, no horse -- for a headless fight only; the board's own patrol (js/data.js) is as it was
  HL.experiment = function (u) {
    if (u.id !== 'patrol') return u;
    u.groups = (u.groups || []).filter(function (g) { return !g.mounted; }); u.figs = u.groups.reduce(function (s, g) { return s + g.n; }, 0);
    var p = (u.heroes || []).filter(function (h) { return h.paladin; })[0] || { type: 'hero', name: 'a paladin of the Sun-Father', paladin: true };
    u.heroes = [p, JSON.parse(JSON.stringify(p)), JSON.parse(JSON.stringify(p))].map(function (h, i) { h.name = ['a paladin of the Sun-Father', 'a second paladin', 'a third paladin'][i]; return h; });
    u.note = 'Three paladins and twelve heavy foot with a supply wagon (the headless experiment\'s).';
    return u;
  };
  // what a turn did, in a few words, when it struck no blow (a spell, a prayer, a trick)
  var said = function (tn) { var c = (tn.cards || [])[0] || ''; return tn.blows && tn.blows.length ? '' : c.replace(/\s+/g, ' ').replace(/^(.{0,40})[:,].*$/, '$1').slice(0, 44); }; // (to its first colon or comma: "Paladin 4: BLESS (L1)", not the names blessed)
  // the grid's beats into the day's: st.beats gains the fight from `at`; returns [from, to)
  HL.lay = function (st, a, b, at, res) {
    var from = (st.beats || []).length, U = { a: a, b: b }, men = { a: a.figs || 0, b: b.figs || 0 }, round = 0;
    var heroesLeft = { a: SN.heroesOf(a).map(function (h) { return h.name; }), b: SN.heroesOf(b).map(function (h) { return h.name; }) };
    var nb = 0, isMan = function (g, word) { var t = res[g].kinds[word]; return !HERO.test(word) || !heroesLeft[g].length || (t && t.n > heroesLeft[g].length + 2); };
    // (spread: the two formations this far either side of the hex's middle, facing -- js/show.js layout; his "Try tuning", on their standing close together)
    var sa = SN.snap(a, at), sb = SN.snap(b, at); sa.from = -1; sb.from = -1; sa.face = 0; sb.face = 3; sa.form = 'line'; sb.form = 'line';
    SN.beat(st, { t: 'fight', at: at.slice(), place: SN.placeName(at), ter: SN.ter(at[0], at[1]), road: SN.road(at), ours: [sa], theirs: [sb], spread: HL.SPREAD });
    // A SIDE'S WHOLE TURN (11-14, Griz, having watched it a beat at a time: "try having this show all the attacks per turn rather than per beat, with only the loss
    // falling over, spells going off (with effects on the other side) during the whole side turn. We'll save the beat one for jankey headless viewing"): a round is
    // each side once, in the order they first acted in it -- every one of the side that acted swings together, its spells go off as it does (a light on its own for
    // a blessing or a mending, a bolt or a fire at the other side, the spell's name over the caster), and then who fell in that side's beats goes down, the other
    // side's first. The beats themselves stay in the record (res.beats) and on the grid's own door.
    var rounds = [], byR = {};
    (res.beats || []).forEach(function (bt) {
      var R = byR[bt.round]; if (!R) { R = byR[bt.round] = { n: bt.round, order: [], g: {} }; rounds.push(R); }
      var S = R.g[bt.g]; if (!S) { S = R.g[bt.g] = { ids: {}, men: 0, heroes: 0, swings: 0, hits: 0, words: [], fx: {}, fell: [] }; R.order.push(bt.g); }
      bt.turns.forEach(function (tn) {
        if (!S.ids[tn.id]) { S.ids[tn.id] = 1; if (HERO.test(tn.word) && SN.heroesOf(U[bt.g]).length) S.heroes++; else S.men++; }
        (tn.blows || []).forEach(function (x) { S.swings++; if (x.hit && x.hit !== 'MISS') S.hits++; if (BOLT.test(x.with)) S.fx[FIRE.test(x.with) ? 'fire' : 'bolt'] = 'foe'; });
        var w = said(tn); if (w) { if (S.words.indexOf(w) < 0) S.words.push(w); if (KIND.test(w)) S.fx.pray = 'self'; else if (BOLT.test(w)) S.fx[FIRE.test(w) ? 'fire' : 'bolt'] = 'foe'; }
      });
      S.fell = S.fell.concat(bt.fell);
    });
    rounds.forEach(function (R) {
      SN.beat(st, { t: 'round', n: R.n });
      R.order.forEach(function (g) {
        var S = R.g[g], og = g === 'a' ? 'b' : 'a';
        // (men, heroes: how many of each acted, so only that many of the unit's figures swing -- js/show.js U.only; i: which few; fx: its spells' lights, on whom)
        SN.beat(st, { t: 'hbeat', u: U[g].id, foe: U[og].id, n: S.men + S.heroes, men: S.men, heroes: S.heroes, i: nb++, swings: S.swings, hits: S.hits, words: S.words.slice(0, 1), name: U[g].name,
          fx: Object.keys(S.fx).map(function (k) { return { kind: k, on: S.fx[k] }; }) });
        [og, g].forEach(function (x2) {
          var fell = S.fell.filter(function (x) { return x.g === x2; }), m = 0;
          fell.forEach(function (x) { if (isMan(x2, x.word)) m++; else SN.beat(st, { t: 'herofall', u: U[x2].id, name: heroesLeft[x2].shift() }); });
          if (m) { men[x2] = Math.max(0, men[x2] - m); SN.beat(st, { t: 'cas', u: U[x2].id, n: m, figs: men[x2], h: true }); } // (h: only as many figures go down as fell, js/show.js U.hurtN)
        });
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
    var UI = SN.UI, V = SN.V, st = SN.newGame(seed);
    var find = function (id) { // (a unit of the day-14 board, or one of the Dominion's wagons, which are not on it till they come)
      var u = SN.unit(st, id), d = u ? null : (SN.DOMINION || []).filter(function (x) { return x.id === id; })[0];
      if (d) { u = JSON.parse(JSON.stringify(d)); u.at = [8, 6]; u.figs0 = u.figs; u.form = 'line'; st.units.push(u); }
      return u;
    };
    var a = find(m[1]), b = find(m[2]);
    var card = function (html, btns) { UI.card(html, btns); };
    if (!a || !b) { card('<h1>THE HEADLESS FIGHT</h1><p>No such unit: ' + (a ? m[2] : m[1]) + '. The ids are js/data.js\'s (patrol, greyfang, sg1, sg3, gk1, wl1, harb, dm1 ...).</p>', [{ label: 'OK', go: true }]); return true; }
    HL.experiment(a); HL.experiment(b);
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
