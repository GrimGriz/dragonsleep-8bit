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
  HL.SHOWN = 4; // (the rounds a fight is told in, however many the grid fought)
  // a unit as the grid's bodies need it (deep16/js/headless.js H.listOf), with its morale as the Snoot rates it. Its heroes go with the word the grid knows
  // each by (HL.wordOf), in the unit's own order, so what comes back says which of them is down; its make-up (comp) is cut to the men it has left
  HL.wordOf = function (h) { return SN.gridWord(h); }; // (js/rules.js, with the one table that reads the same words)
  HL.sent = function (u) { return SN.heroesOf(u).filter(function (h) { return !!HL.wordOf(h); }); };
  HL.comp = function (u) { return SN.compNow(u); };
  HL.pack = function (u, plus) {
    return { id: u.id, name: u.name, kind: u.kind, figs: u.figs || 0, comp: u.comp ? HL.comp(u) : null, harbinger: !!u.harbinger, volley: !!u.volley, mounted: !!u.mounted,
      groups: u.groups ? u.groups.map(function (g) { return { n: g.n, mounted: !!g.mounted, volley: !!g.volley }; }) : null,
      heroes: HL.sent(u).map(function (h) { return { name: h.name, grid: HL.wordOf(h) }; }),
      rating: SN.rating(u) + (plus || 0), never: SN.nevers(u) };
  };
  // the fight fought: done(res) -- res.result 'won' (a's) | 'lost' (b's) | 'both' | 'error', res.beats, res.a, res.b; null if the grid would not come up.
  // a and b: a unit of the board each, or several (a stack in a hex: the day's own fights); o.plus: { id: +n on its rating } (holding ground)
  HL.ask = function (a, b, o, done) {
    var fr = document.createElement('iframe'), closed = false, timer = null, id = 'h' + Date.now();
    var packs = function (x) { return (Array.isArray(x) ? x : [x]).map(function (u) { return HL.pack(u, o && o.plus && o.plus[u.id] || 0); }); };
    function close(m) { if (closed) return; closed = true; clearTimeout(timer); window.removeEventListener('message', on); if (fr.parentNode) fr.parentNode.removeChild(fr); done(m && m.type === 'd16h:done' ? m.res : null, m); }
    function on(e) {
      if (e.source !== fr.contentWindow || !e.data) return; var m = e.data;
      if (m.type === 'd16h:ready') { clearTimeout(timer); timer = setTimeout(function () { close({ type: 'd16h:crash', msg: 'no answer' }); }, HL.RUN_MS); fr.contentWindow.postMessage({ type: 'snh:fight', id: id, a: packs(a), b: packs(b), seed: o && o.seed, level: o && o.level }, '*'); }
      if ((m.type === 'd16h:done' || m.type === 'd16h:crash') && (m.id === id || m.type === 'd16h:crash')) close(m);
    }
    window.addEventListener('message', on);
    fr.title = 'DEEP16, unseen'; fr.setAttribute('aria-hidden', 'true'); fr.style.cssText = 'position:absolute;left:-9999px;top:0;width:480px;height:270px;border:0;visibility:hidden';
    fr.src = (SN.DEEP16 || '../deep16/') + 'index.html?headlessrun';
    document.body.appendChild(fr);
    timer = setTimeout(function () { close({ type: 'd16h:crash', msg: 'no ready' }); }, HL.READY_MS);
  };
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
  // A SIDE'S WHOLE TURN (11-14, Griz, having watched it a beat at a time: "try having this show all the attacks per turn rather than per beat, with only the loss
  // falling over, spells going off (with effects on the other side) during the whole side turn. We'll save the beat one for jankey headless viewing"): a round is
  // each side once, in the order they first acted in it -- every unit of the side that acted swings (only as many of its figures as acted), its spells go off as
  // it does (a light on its own for a blessing or a mending, a bolt or a fire at the other side, the spell's name over the caster), and then who fell in that
  // side's beats goes down, the other side's first. The beats themselves stay in the record (res.beats) and on the grid's own door.
  // byId: the board's units in the fight by id (a side may be several: the grid says whose each man is). Lays `round`, `hbeat`, `cas` and `herofall` into the
  // day's beats; the men who ran are not casualties (they leave at the end). Returns each unit's men left standing or away.
  HL.rounds = function (st, res, byId) {
    var men = {}, names = {}, sideOf = {}, nb = 0, rounds = [], byR = {};
    Object.keys(byId).forEach(function (id) { men[id] = byId[id].figs || 0; names[id] = HL.sent(byId[id]).map(function (h) { return h.name; }); });
    ['a', 'b'].forEach(function (g) { Object.keys(res[g].units || {}).forEach(function (id) { sideOf[id] = g; }); });
    var heroUp = {}; Object.keys(names).forEach(function (id) { heroUp[id] = names[id].length; });
    // FOUR ROUNDS SHOWN (11-14, Griz: "are the fight visualizations amenable to being reduced to 4 displayed 'rounds'"; "Yes, build it"): the grid's rounds,
    // however many it fought, are told as four at most -- each shown round a run of the grid's, every blow and every fall in them kept
    var rs = []; (res.beats || []).forEach(function (bt) { if (rs.indexOf(bt.round) < 0) rs.push(bt.round); });
    var NP = Math.min(HL.SHOWN, rs.length), phaseOf = {}; rs.forEach(function (r, i) { phaseOf[r] = Math.floor(i * NP / rs.length) + 1; });
    (res.beats || []).forEach(function (bt) {
      var pn = phaseOf[bt.round], R = byR[pn]; if (!R) { R = byR[pn] = { n: pn, order: [], g: {} }; rounds.push(R); }
      var S = R.g[bt.g]; if (!S) { S = R.g[bt.g] = { order: [], u: {}, fell: [] }; R.order.push(bt.g); }
      bt.turns.forEach(function (tn) {
        var X = S.u[tn.unit]; if (!X) { X = S.u[tn.unit] = { ids: {}, men: 0, heroes: 0, swings: 0, hits: 0, words: [], fx: {} }; S.order.push(tn.unit); }
        if (!X.ids[tn.id]) { X.ids[tn.id] = 1; if (tn.hero) X.heroes++; else X.men++; }
        (tn.blows || []).forEach(function (x) { X.swings++; if (x.hit && x.hit !== 'MISS') X.hits++; if (BOLT.test(x.with)) X.fx[FIRE.test(x.with) ? 'fire' : 'bolt'] = 'foe'; });
        var w = said(tn); if (w) { if (X.words.indexOf(w) < 0) X.words.push(w); if (KIND.test(w)) X.fx.pray = 'self'; else if (BOLT.test(w)) X.fx[FIRE.test(w) ? 'fire' : 'bolt'] = 'foe'; }
      });
      S.fell = S.fell.concat(bt.fell);
    });
    var standing = function (g) { return Object.keys(sideOf).filter(function (id) { return sideOf[id] === g && byId[id] && (men[id] > 0 || heroUp[id] > 0); }); };
    var sideName = function (g) { var us = Object.keys(sideOf).filter(function (id) { return sideOf[id] === g && byId[id]; }); return us.length === 1 ? byId[us[0]].name : (byId[us[0]] && byId[us[0]].side === 'ours' ? 'OURS' : 'THEIRS'); };
    rounds.forEach(function (R) {
      SN.beat(st, { t: 'round', n: R.n });
      R.order.forEach(function (g) {
        var S = R.g[g], og = g === 'a' ? 'b' : 'a', acts = [];
        S.order.forEach(function (id) {
          var X = S.u[id], U = byId[id]; if (!U) return;
          var foe = standing(og)[0] || Object.keys(sideOf).filter(function (k) { return sideOf[k] === og; })[0];
          // (men, heroes: how many of each acted, so only that many of the unit's figures swing -- js/show.js U.only; i: which few; fx: its spells' lights, on whom)
          acts.push({ u: id, foe: foe, n: X.men + X.heroes, men: X.men, heroes: X.heroes, i: nb++, swings: X.swings, hits: X.hits, words: X.words.slice(0, 1), name: U.name,
            fx: Object.keys(X.fx).map(function (k) { return { kind: k, on: X.fx[k] }; }) });
        });
        // (one beat a side: its first unit's, the rest of its stack riding in `also` -- js/show.js swings them together)
        if (acts.length) { var b0 = acts[0]; b0.t = 'hbeat'; b0.side = sideName(g); b0.also = acts.slice(1); SN.beat(st, b0); }
        var ids = []; S.fell.forEach(function (x) { if (ids.indexOf(x.unit) < 0) ids.push(x.unit); });
        ids.sort(function (x, y) { return (sideOf[x] === og ? 0 : 1) - (sideOf[y] === og ? 0 : 1); });
        ids.forEach(function (id) {
          if (!byId[id]) return; var m = 0;
          S.fell.filter(function (x) { return x.unit === id && !x.away; }).forEach(function (x) {
            if (x.hero == null) m++; else { heroUp[id] = Math.max(0, heroUp[id] - 1); SN.beat(st, { t: 'herofall', u: id, name: names[id][x.hero] || x.name }); }
          });
          if (m) { men[id] = Math.max(0, men[id] - m); SN.beat(st, { t: 'cas', u: id, n: m, figs: men[id], h: true }); } // (h: only as many figures go down as fell, js/show.js U.hurtN)
        });
      });
    });
    return men;
  };
  var endWords = function (res) {
    // (a side of several units is named by its first unit and a count: the banner is one line wide)
    var nm = function (g) { var t = res[g], ids = Object.keys(t.units || {}); return ids.length > 1 ? t.units[ids[0]].name + ' and ' + (ids.length - 1) + ' more' : t.name; };
    var tl = function (g) { var t = res[g]; return t.up + ' of ' + t.n + ' standing' + (t.away ? ', ' + t.away + ' ran' : ''); };
    return { big: res.result === 'won' ? nm('a').toUpperCase() + ' HOLD THE FIELD' : res.result === 'lost' ? nm('b').toUpperCase() + ' HOLD THE FIELD' : 'NOBODY HOLDS THE FIELD',
      small: tl('a') + ' -- ' + tl('b') + ' (' + res.rounds + ' rounds on the grid)' + (res.morale && res.morale.length ? ' -- ' + res.morale.filter(function (l) { return /BREAKS/.test(l); }).length + ' broke' : '') };
  };
  // the door's fight, two units in a hex of its own making: st.beats gains the fight from `at`; returns [from, to)
  HL.lay = function (st, a, b, at, res) {
    var from = (st.beats || []).length, byId = {}; byId[a.id] = a; byId[b.id] = b;
    var sa = SN.snap(a, at), sb = SN.snap(b, at); sa.from = -1; if (sb.from < 0) sb.from = 0; sa.face = sb.from; sa.form = 'line'; sb.form = 'line'; // (the first holds the hex, facing the side the second comes in through)
    SN.beat(st, { t: 'fight', at: at.slice(), place: SN.placeName(at), ter: SN.ter(at[0], at[1]), road: SN.road(at), ours: [sa], theirs: [sb], hexes: true });
    HL.rounds(st, res, byId);
    [['a', a], ['b', b]].forEach(function (x) { var t = res[x[0]]; if (!t.up) SN.beat(st, t.broke ? { t: 'fall', u: x[1].id, how: 'rout', dir: -1 } : { t: 'gone', u: x[1].id }); });
    var e = endWords(res); SN.beat(st, { t: 'hend', big: e.big, small: e.small });
    return [from, st.beats.length];
  };

  // ---------------------------------------------------------------- THE DAY'S OWN FIGHTS (11-14, Griz, asked whether the grid fight now replaces the CHAINMAIL
  // table for the board's fights: "Yes, replace it"; on the heroes, the lady's missile and the party's rank, "move to standard grid paladin where grid fights
  // determine what drops"; on morale, "go with your morale build"). js/rules.js SN.fightHex yields `headless` for a contested hex's units (the four's own fight
  // is still theirs to play, js/deep.js); js/ui.js calls HL.day, and what the grid answers comes back to SN.fightHex, which hands it to HL.apply. With no
  // answer (the gate's probe, which runs a day in one breath, or a grid that would not come up) the tables fight it, as the four's fight has its stand-in.
  HL.day = function (st, req, done) {
    var get = function (ids) { return (ids || []).map(function (id) { return SN.unit(st, id); }).filter(function (u) { return u && SN.alive(u); }); };
    var O = get(req.ours), T = get(req.theirs), plus = {};
    if (!O.length || !T.length) return done(null);
    O.concat(T).forEach(function (u) { if (SN.holding(st, u, req.at)) plus[u.id] = 1; }); // (holding ground: +1 on its morale, as on the tables)
    HL.ask(O, T, { seed: req.seed, level: 4, plus: plus }, function (res) { done(res && res.result !== 'error' && res.a && res.b ? res : null); });
  };
  // what the grid's fight came to, written back onto the board: the show's beats (HL.rounds), each unit's men down off its figures man for man, its heroes
  // down by name -- GreyFang is beaten back, never killed (he is the Harbinger's); the Harbinger down is the mirror's, back to the moot ground -- and a unit
  // that broke: its men run to the nearest steady unit of their own within two hexes and join it, or scatter (his rule of 10-15 for men; a gnoll band joins a
  // band of its own tribe, and with none in reach routs as it did), and the ones who never run stand where the men were
  HL.apply = function (st, h, O, T, res) {
    var byId = {}, sent = {}; O.concat(T).forEach(function (u) { byId[u.id] = u; sent[u.id] = HL.sent(u); });
    var stat = function (u, cls) { var k = u.side === 'ours' ? 'lost' : 'killed'; st.stats[k][u.side + ':' + cls] = (st.stats[k][u.side + ':' + cls] || 0) + 1; };
    SN.say(st, 'On the grid, unseen: ' + res.rounds + ' rounds, the ranks ' + res.gapFt + ' ft apart.', 'roll', h);
    // (the hexes view, js/show.js: this fight's own `fight` beat is marked, so the show draws it a unit to its hex)
    for (var bi = (st.beats || []).length - 1; bi >= 0; bi--) { var fb = st.beats[bi]; if (fb.t === 'fight' && SN.same(fb.at, h)) { fb.hexes = true; break; } }
    HL.rounds(st, res, byId);
    (res.morale || []).forEach(function (l) { SN.say(st, l.replace(/^R(\d+) MORALE\s+/, 'Morale, round $1: ').replace(/\s+/g, ' '), 'morale', h); });
    ['a', 'b'].forEach(function (g) {
      Object.keys(res[g].units || {}).forEach(function (id) {
        var u = byId[id], U = res[g].units[id]; if (!u || !SN.alive(u)) return;
        var back = false, harbDown = false, fell = [];
        (U.heroes || []).forEach(function (w, i) {
          var hh = sent[id][i]; if (!hh || w !== 'down') return;
          if (hh.fated) back = true; else if (hh.harbinger) harbDown = true; else { hh.dead = true; fell.push(hh.name); stat(u, hh.type); }
        });
        var down = Math.min(u.figs, U.men ? U.men.down : 0), away = U.men ? U.men.away : 0;
        if (down) { SN.take(st, u, down); u.lost = (u.lost || 0) + down; u.lostToday = true; }
        SN.say(st, u.name + ': ' + down + ' down' + (away ? ', ' + away + ' ran' : '') + (fell.length ? '; ' + fell.join(' and ') + ' fell' : '') + ' (' + u.figs + ' left).', 'roll', h);
        if (harbDown) { SN.say(st, 'The Harbinger goes down -- and the mirror takes him back to the moot ground.', 'roll', h); SN.beatHarb(st, u); return; }
        if (U.broke && u.figs > 0) { if (SN.menBreak(u) || SN.rallyTo(st, u)) SN.breakUp(st, u, true); else SN.fallBack(st, u, 'rout'); }
        if (!SN.alive(u) || !SN.same(u.at, h)) return;
        if (u.figs <= 0 && !SN.heroesOf(u).length && !u.party) { u.state = 'gone'; SN.beat(st, { t: 'gone', u: u.id }); SN.say(st, u.name + ' are destroyed.', 'roll', h); return; }
        if (back) { SN.say(st, 'GreyFang is beaten down and carried out of it, not killed -- he is the Harbinger\'s.', 'roll', h); SN.fallBack(st, u, 'back'); }
      });
    });
    var e = endWords(res); SN.beat(st, { t: 'hend', big: e.big, small: e.small });
    st.hl = true; // (a battle the grid has fought: CHAINMAIL's instability no longer checks, SN.after)
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
