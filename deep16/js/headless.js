/* DEEP16 — THE HEADLESS FIGHT (11-13, the lanes desk): two of the Snoot's groups fought on the grid with nobody at the pad, on a field with no map.
   Griz: "The 3 hexes are the snoot positions on the snoot board, we zoom into an invisible grid that has no 'map' - the group 'charging' on the other via snoot
   movements get a 'charge' movement (or something). Then the fight runs headless and is communicated to the player translated into simultaneous turns per side, with
   special effects from spells and stuff - as if it was a 'simple' fight..."; the field, "more like their ranks at 60' to 90 feet - so 75 to 105 feet apart"; the
   bodies, "grab appropriate substitutes from 'humanoid' store in pocket DM list"; "we'll have to add some version of morale checks for the headless fight and allow
   escape endings I think"; "we're experimenting if we prefer this to replace chainmail table"; and "we'll need a janky head for me to watch the headless fights we're
   happy with" (the door, below).
   What is here: the bodies (H.BODY, H.listOf: a Snoot unit as a list of the grid's words); the field (flat earth made to the two groups' ranks, three squares round
   them, the front ranks 75 to 105 ft apart by the seed); the two groups each run by the grid's own AI (a class or a named one by its class turn, a creature of the
   bestiary by the brute's, as a fight's lent ally is); the fight's own ending (H.over: a group with nobody standing has lost it); morale (H.morale: the seat's
   draft, his to change); H.run, the whole fight unseen and what it came to; H.door, the same fight on the screen to be watched.
   Not here yet: the playback (a beat a side a round), the charge, more sides than two, and the Snoot's own page asking for one. */
'use strict';
(function () {
  var D = window.D16, H = D.headless = {};
  H.FIELD = 'headless-field';
  H.FILES = 8;      // men across a rank (a line)
  H.COLUMN = 3;     // men across a column
  H.MARGIN = 3;     // squares of field round the ranks (his "3 more squares")
  H.GAP = [75, 105]; // the front ranks apart, ft (his "75 to 105 feet apart")
  // THE BODIES: what each of the Snoot's men is on the grid, from the bestiary's humanoids (data/foes.js). The seat's picks, his to change:
  //   heavy foot, the Pit's fighters, Newland's horse dismounted -- the Line Guard (the SRD Guard); crossbows and the plains' outriders -- the Bandit (the SRD's, a
  //   light crossbow); the plains tribes -- the Visiting Barbarian (the SRD Berserker); the Dominion's -- its own soldier and patrol lady; the gnolls -- their own
  //   kinds (a unit's `comp`); the Harbinger's six -- the mirror hyena. No horse stands on this field: a mounted man fights on foot.
  H.BODY = { foot: 'guard', horse: 'guard', missile: 'bandit', plains: 'berserker', dominion: 'dominion', mirror: 'mirrorhyena' };
  H.PALADIN = 'paladin:4'; // (his "drop the pally's to 4")
  H.HEROES = { GreyFang: 'greyfang', Katarina: 'katarina', 'the Harbinger': 'harbinger' };
  var rep = function (w, n) { var a = []; for (var i = 0; i < n; i++) a.push(w); return a; };
  H.bodyOf = function (u, g) {
    if (u.kind === 'the Dominion') return H.BODY.dominion;
    if (u.kind === 'the plains') return (g || u).mounted ? H.BODY.missile : H.BODY.plains;
    if ((g || u).volley) return H.BODY.missile;
    return (g || u).mounted ? H.BODY.horse : H.BODY.foot;
  };
  // a Snoot unit (snoot-mode/js/data.js SN.FORCES, as it stands that hour: figs, groups, comp scaled by the caller) as the grid's words, the heroes first
  H.heroWords = function (u) {
    var out = [];
    (u.heroes || []).forEach(function (h) {
      if (h.dead) return;
      var w = h.grid || H.HEROES[h.name] || (h.paladin ? H.PALADIN : h.warlock ? 'patrollady' : h.harbinger ? 'harbinger' : null);
      if (w) out.push(w);
    });
    return out;
  };
  H.listOf = function (u) {
    var out = H.heroWords(u);
    if (u.comp) Object.keys(u.comp).forEach(function (k) { out = out.concat(rep(u.harbinger && k === 'hyena' ? H.BODY.mirror : k, u.comp[k])); });
    else if (u.groups && u.groups.length) u.groups.forEach(function (g) { out = out.concat(rep(H.bodyOf(u, g), g.n || 0)); });
    else out = out.concat(rep(H.bodyOf(u), u.figs || 0));
    return out;
  };
  // 'paladin:4,guard*12' -> the words, each a man
  H.words = function (s) {
    var out = [];
    String(s || '').split(',').filter(Boolean).forEach(function (w) { var m = /^(.+)\*(\d+)$/.exec(w); if (m) out = out.concat(rep(m[1], +m[2])); else out.push(w); });
    return out;
  };

  var up = function (u) { return !u.dead && !u.fled && u.hp > 0 && !u.hless; };
  // (a turn's start on the headless field: the charge's Dash in the first round -- RU.startTurn is called as a turn opens, by the battle and again by the AI's own
  // turn, so the feet are given each time it is, and never after round 1)
  var RU = D.rules, startTurn0 = RU.startTurn;
  RU.startTurn = function (u) {
    var r = startTurn0.apply(this, arguments), B = D.battle;
    if (B && B.hl && u && u.hdash) {
      if (!(B.round > 1) && u.turn) { u.turn.move += D.Battle.dashFeet ? D.Battle.dashFeet(u) : (u.speed || 30); if (!u.hdashSaid) { u.hdashSaid = true; B.hl.charged = (B.hl.charged || 0) + 1; } }
      else delete u.hdash;
    }
    if (B && B.hl && B.hl.frames && u && u.hgroup) { // (the replay's record, H.frame: once a turn, though the turn's start is called twice)
      var fl = B.hl.frames[B.hl.frames.length - 1];
      if (!fl || fl.id !== u.id || fl.round !== B.round) B.hl.frames.push({ id: u.id, i: B.hl.ids.indexOf(u.id), g: u.hgroup, round: B.round, struck: false, at: H.frame(B) });
    }
    return r;
  };
  // where every body of the fight is and how it stands, in the order the fight made them: [x, y, 0 up | 1 down | 2 away, hp]
  H.frame = function (B) { return B.hl.ids.map(function (id) { var w = B.hl.byId[id]; return [w.x, w.y, up(w) ? 0 : w.fled ? 2 : 1, Math.max(0, w.hp || 0)]; }); };
  H.men = function (B, k) { return B.units.filter(function (u) { return u.hgroup === k; }); };
  H.tally = function (B, k) {
    var us = H.men(B, k), t = { name: B.hl[k].name, n: us.length, up: 0, away: 0, down: 0, broke: false, kinds: {}, units: {} };
    us.forEach(function (u) {
      var kd = u.hword, r = t.kinds[kd] = t.kinds[kd] || { n: 0, up: 0, away: 0, down: 0 }, w = up(u) ? 'up' : u.fled ? 'away' : 'down';
      var g = B.hl.units[u.hunit] || {}, U = t.units[u.hunit] = t.units[u.hunit] || { name: g.name, n: 0, up: 0, away: 0, down: 0, broke: !!g.broke, withdrew: !!g.withdrew, kinds: {}, men: { n: 0, up: 0, away: 0, down: 0 }, heroes: [] }, ru = U.kinds[kd] = U.kinds[kd] || { n: 0, up: 0, away: 0, down: 0 };
      r.n++; r[w]++; t[w]++; U.n++; U[w]++; ru.n++; ru[w]++;
      if (u.hhero != null) U.heroes[u.hhero] = w; else { U.men.n++; U.men[w]++; } // (heroes: the unit's own, in the order it sent them -- 'up', 'away' or 'down')
    });
    t.broke = Object.keys(t.units).some(function (id) { return t.units[id].broke; }); t.withdrew = Object.keys(t.units).some(function (id) { return t.units[id].withdrew; });
    return t;
  };

  // MORALE (11-14, Griz: "sketch our own moral system for the snoot, look at how routing works and have the routed join nearby groups", then "go with your
  // morale build" -- the Snoot seat's sketch, in place of CHAINMAIL's post-melee sum, its doubling under twenty and its instability). Each UNIT of a side
  // checks for itself, at the end of a round: when it first stands at half its bodies or fewer, again at a quarter, and once when one who leads it is down.
  // 2d6, and it breaks on a roll over its rating and two (the Snoot's own ratings, sent with the unit: heavy foot 5, the gnolls 7, +1 holding ground, +1
  // blessed). One result, a break: its men still standing leave the field. The ones who never run (STAYS: a paladin, GreyFang, Katarina, the Harbinger, a
  // matriarch) fight on where the men were; a patrol lady goes with her soldiers. `never`: the units the Snoot never checks (SN.nevers).
  H.STEPS = [0.5, 0.25];
  var STAYS = /^(paladin|greyfang|katarina|harbinger|gnollmatriarch)/, LEADS = /^(paladin|greyfang|katarina|harbinger|gnollmatriarch|patrollady)/;
  H.unitMen = function (B, id) { return B.units.filter(function (u) { return u.hunit === id; }); };
  H.morale = function (B) {
    // (glory: a band with its kill goes, before anyone checks)
    Object.keys(B.hl.units).forEach(function (id) {
      var g = B.hl.units[id]; if (!g.glory || g.withdrew || g.broke) return;
      var og = g.g === 'a' ? 'b' : 'a'; if (!(B.hl.lead0 && B.hl.lead0[og] > 0)) return;
      var leads = B.units.filter(function (u) { return u.hgroup === og && u.hhero != null; });
      if (leads.some(up) || !leads.some(function (u) { return !up(u) && !u.fled; })) return;
      var us = H.unitMen(B, id).filter(up); if (!us.length) return;
      g.withdrew = true; us.forEach(function (u) { u.dead = true; u.fled = true; u.deadT = B.t; }); B.cache = null;
      var line = 'R' + B.round + ' GLORY  ' + g.name + ' have their kill and go (' + us.length + ' of them)';
      if (B.log) B.log.push(line); B.hl.lines.push(line);
    });
    Object.keys(B.hl.units).forEach(function (id) {
      var g = B.hl.units[id]; if (g.never || g.broke) return;
      var us = H.unitMen(B, id), n = us.length, st = us.filter(up).length; if (!st || !n) return;
      var runners = us.filter(function (u) { return up(u) && !STAYS.test(u.hword) && !(u.hhero != null && !/^patrollady/.test(u.hword)); }); if (!runners.length) return;
      var why = [];
      if (!g.led && us.some(function (u) { return LEADS.test(u.hword) && !up(u) && !u.fled; })) { g.led = true; why.push('its leader down'); }
      while (g.step < H.STEPS.length && st <= n * H.STEPS[g.step]) { g.step++; why.push(st + ' of ' + n + ' standing'); }
      for (var i = 0; i < why.length && !g.broke; i++) {
        var d1 = 1 + Math.floor(D.rand() * 6), d2 = 1 + Math.floor(D.rand() * 6), need = (g.morale || 5) + 2, broke = d1 + d2 > need;
        var line = 'R' + B.round + ' MORALE  ' + g.name + ' (' + why[i] + ')  2d6 [' + d1 + ',' + d2 + '] = ' + (d1 + d2) + '  vs ' + need + '  ' + (broke ? 'BREAKS' : 'HOLDS');
        if (B.log) B.log.push(line); B.hl.lines.push(line);
        if (broke) { g.broke = true; runners.forEach(function (u) { u.dead = true; u.fled = true; u.deadT = B.t; }); B.cache = null; }
      }
    });
  };
  // the fight's ending: nobody of a group standing, and it is the other's ('won': group a's, 'lost': group b's -- the grid's own two words)
  H.over = function (B) {
    if (B.hl.round !== B.round) { B.hl.round = B.round; if (B.round > 1) H.morale(B); }
    var a = H.men(B, 'a').filter(up).length, b = H.men(B, 'b').filter(up).length;
    if (!b) return 'won'; if (!a) return 'lost'; return null;
  };

  // THE BEATS (11-13, Griz, on whether turns could run at once: "what if it's just the group that currently has initiative. I.e. gnoll with init 20, the 2 pallies
  // with init 17 and 15, then the 3 gnolls with inits ranging 13 to 8, then the third pally at 7"): the fight is fought turn by turn as ever, and its record is cut
  // into beats -- a beat is a run of one group's turns in the initiative order as rolled, a new beat where the group changes. Each turn in a beat: who (name, word),
  // the cards the grid wrote on that turn (plain words), and the blows read off them -- `by`, `at`, `with` (a blow: "Name > Target  Weapon") and `hit` (HIT, CRIT or
  // MISS). Each beat: who of either group went down or away in it. The player's playback is the Snoot page's, a beat at a time; this is what it reads.
  var plain = function (s) { return String(s).replace(/\{\/?[a-z]?\}/g, ''); };
  H.listen = function (B) {
    var card0 = B.card, hl = B.hl; hl.beats = []; hl.stood = {};
    B.units.forEach(function (u) { if (u.hgroup) hl.stood[u.id] = up(u); });
    var close = function () { // who fell since the last look, into the beat that was running
      var bt = hl.beats[hl.beats.length - 1];
      B.units.forEach(function (u) { if (!u.hgroup || !hl.stood[u.id] || up(u)) return; hl.stood[u.id] = false; if (bt) bt.fell.push({ g: u.hgroup, unit: u.hunit, hero: u.hhero != null ? u.hhero : null, name: u.name, word: u.hword, away: !!u.fled }); });
    };
    B.card = function (lines) {
      var u = this.active;
      if (u && u.hgroup) {
        close();
        var bt = hl.beats[hl.beats.length - 1];
        if (!bt || bt.g !== u.hgroup || bt.round !== this.round) { bt = { round: this.round, g: u.hgroup, turns: [], fell: [] }; hl.beats.push(bt); }
        var tn = bt.turns[bt.turns.length - 1];
        if (!tn || tn.id !== u.id) { tn = { id: u.id, unit: u.hunit, hero: u.hhero != null, name: u.name, word: u.hword, cards: [], blows: [], last: [] }; bt.turns.push(tn); }
        // (a card grows as its blow goes on -- the same lines come again with the next under them: only what is new is kept)
        var ls = (lines || []).map(plain), n0 = tn.last.length <= ls.length && tn.last.every(function (x, i) { return x === ls[i]; }) ? tn.last.length : 0;
        tn.last = ls;
        ls.slice(n0).forEach(function (p) {
          var m = /^(.+?) > (.+?)  +(.+?)(?:  |$)/.exec(p), h = /\b(CRIT|HIT|MISS)\b/.exec(p), bl = tn.blows[tn.blows.length - 1];
          tn.cards.push(p);
          if (m) { tn.blows.push({ by: m[1], at: m[2], with: m[3], hit: null }); var fr = hl.frames && hl.frames[hl.frames.length - 1]; if (fr && fr.id === u.id) fr.struck = true; } // (`by`: not always the one whose turn it is -- a blow at one who walks away is the other group's)
          else if (h && bl && !bl.hit) bl.hit = h[1];
        });
      }
      return card0.apply(this, arguments);
    };
    hl.close = close;
  };

  // the field and the fight. spec: { a: { name, list, morale, never }, b: { ... }, level, seed, gap (ft) }; o: the Battle's own options ({ bench: true } unseen).
  // A side may be several of the board's units (11-14, the day's own fights: a stack in a hex): { name, units: [{ id, name, list, morale, never }] } -- each
  // body knows its unit (u.hunit), each unit checks its own morale, and the tally and the beats say whose each man is
  H.make = function (spec, o) {
    var L = Math.max(1, Math.min(12, spec.level || 4)), NPC = D.npc;
    if (spec.seed != null) D.seed = spec.seed | 0;
    var isClass = function (w) { return !!(NPC.spec && NPC.spec(w, L)); };
    var norm = function (sd, k) { var us = sd.units && sd.units.length ? sd.units : [{ id: k, name: sd.name, list: sd.list, morale: sd.morale, never: sd.never, form: sd.form, asp: sd.asp, cover: sd.cover, charge: sd.charge, glory: sd.glory, nh: sd.nh }]; return { name: sd.name || us.map(function (x) { return x.name; }).join(' and '), units: us }; };
    var SA = norm(spec.a, 'a'), SB = norm(spec.b, 'b'), A = [], Au = [], Ah = [], Bl = [], Bu = [], Bh = [], hu = {};
    SA.units.forEach(function (x) { hu[x.id] = { g: 'a', name: x.name, morale: x.morale, never: !!x.never, step: 0, cover: !!x.cover, charge: !!x.charge, glory: !!x.glory }; (x.list || []).forEach(function (wd, j) { A.push(wd); Au.push(x.id); Ah.push(j < (x.nh || 0) ? j : null); }); });
    SB.units.forEach(function (x) { hu[x.id] = { g: 'b', name: x.name, morale: x.morale, never: !!x.never, step: 0, cover: !!x.cover, charge: !!x.charge, glory: !!x.glory }; (x.list || []).forEach(function (wd, j) { Bl.push(wd); Bu.push(x.id); Bh.push(j < (x.nh || 0) ? j : null); }); });
    var aClass = A.filter(isClass), ph = !aClass.length;
    var steps = Math.round((H.GAP[1] - H.GAP[0]) / 5) + 1, gap = spec.gap || (H.GAP[0] + 5 * Math.floor(D.rand() * steps)), g = Math.round(gap / 5);
    // THE SEATING (11-14, Griz: "think about the formation settings from the snoot that was and the surprise and walls lines"; on the seat's lean, "Yes, all
    // three"): what the board's formations and sides of entry were as dice is here where the bodies stand when the fight opens. A unit's FORMATION is its shape
    // -- a line H.FILES abreast, a column H.COLUMN abreast and deep, a square a block with its shooters in the middle; a side's units stand abreast. Its ASPECT
    // (`asp`, how it strikes the other side: the board's SN.aspect) is where it is seated -- 'front' across the gap from them, 'flank' off their side, 'rear'
    // behind their last rank, each the same gap away. A unit with neither is a line at the front, as every fight was seated before.
    var M = H.MARGIN, widthOf = function (x) { var n = (x.list || []).length; return Math.max(1, x.form === 'column' ? Math.min(H.COLUMN, n) : x.form === 'square' ? Math.ceil(Math.sqrt(n)) : Math.min(H.FILES, n)); };
    var SHOOTS = /^(bandit|patrollady)/, cellsOf = function (x, ox, oy, dx, dy) { // (front-centre ox,oy; the ranks go back along dx,dy; the files along the other way)
      var n = (x.list || []).length, W = widthOf(x), lx = dy ? 1 : 0, ly = dy ? 0 : 1, out = [], i;
      for (i = 0; i < n; i++) { var off = (i % W) - Math.floor(W / 2), rk = Math.floor(i / W); out.push([ox + lx * off + dx * rk, oy + ly * off + dy * rk]); }
      if (x.form === 'square' && n > 2) { // (the shooters in the middle of it)
        var cx0 = out.reduce(function (t, c) { return t + c[0]; }, 0) / n, cy0 = out.reduce(function (t, c) { return t + c[1]; }, 0) / n;
        var byIn = out.slice().sort(function (p1, p2) { return (Math.abs(p1[0] - cx0) + Math.abs(p1[1] - cy0)) - (Math.abs(p2[0] - cx0) + Math.abs(p2[1] - cy0)); });
        var order = x.list.map(function (wd, j) { return j; }).sort(function (j1, j2) { return (SHOOTS.test(x.list[j2]) ? 1 : 0) - (SHOOTS.test(x.list[j1]) ? 1 : 0) || j1 - j2; }), sq = [];
        order.forEach(function (j, k) { sq[j] = byIn[k]; }); out = sq;
      }
      return { cells: out, face: [-dx, -dy] };
    };
    var seatSide = function (S, y0, dy) { // (the ones at the front, abreast: the first rank on y0, the ranks going back by dy)
      var us = S.units.filter(function (x) { return !x.asp || x.asp === 'front'; }), tot = us.reduce(function (t, x) { return t + widthOf(x) + 2; }, -2), cur = -Math.floor(tot / 2), box = { x0: 0, x1: 0, y0: y0, y1: y0 };
      us.forEach(function (x, k) { var W = widthOf(x); x.seat = cellsOf(x, cur + Math.floor(W / 2), y0, 0, dy); cur += W + 2; });
      var all = []; us.forEach(function (x) { all = all.concat(x.seat.cells); });
      if (all.length) box = { x0: Math.min.apply(null, all.map(function (c) { return c[0]; })), x1: Math.max.apply(null, all.map(function (c) { return c[0]; })), y0: Math.min.apply(null, all.map(function (c) { return c[1]; })), y1: Math.max.apply(null, all.map(function (c) { return c[1]; })) };
      return box;
    };
    var boxA = seatSide(SA, 0, -1), boxB = seatSide(SB, g, 1);
    var seatRound = function (S, E, backY, backDy) { // (the ones on the other side's flank or behind it: E the other side's box, backY its last rank, backDy the way its ranks go back)
      var nf = 0, nr = 0, my = Math.round((E.y0 + E.y1) / 2), mx = Math.round((E.x0 + E.x1) / 2);
      S.units.forEach(function (x) {
        if (x.asp === 'flank') { var left = nf % 2 === 0, k = Math.floor(nf / 2), W = widthOf(x); nf++; x.seat = cellsOf(x, left ? E.x0 - g : E.x1 + g, my + k * (W + 2), left ? -1 : 1, 0); }
        else if (x.asp === 'rear') { var W2 = widthOf(x); x.seat = cellsOf(x, mx + nr * (W2 + 2), backY + backDy * g, 0, backDy); nr++; }
      });
    };
    seatRound(SA, boxB, boxB.y1, 1); seatRound(SB, boxA, boxA.y0, -1);
    var PA = [], PB = [], FA = [], FB = [];
    SA.units.forEach(function (x) { (x.seat ? x.seat.cells : []).forEach(function (c) { PA.push(c); FA.push(x.seat.face); }); });
    SB.units.forEach(function (x) { (x.seat ? x.seat.cells : []).forEach(function (c) { PB.push(c); FB.push(x.seat.face); }); });
    var every = PA.concat(PB), minX = Math.min.apply(null, every.map(function (c) { return c[0]; })), minY = Math.min.apply(null, every.map(function (c) { return c[1]; }));
    var taken = {}; every.forEach(function (c) { while (taken[c[0] + ',' + c[1]]) c[0]++; taken[c[0] + ',' + c[1]] = 1; }); // (never two on a square)
    every.forEach(function (c) { c[0] += M - minX; c[1] += M - minY; });
    var w = Math.max.apply(null, every.map(function (c) { return c[0]; })) + 1 + M, h = Math.max.apply(null, every.map(function (c) { return c[1]; })) + 1 + M, rows = [], hts = [];
    // A SQUARE FIELD (11-14, Griz, of a flank's field in his pane: "these grid fights aren't on squares and north-south looks like the map squeezes the number
    // of units"; "i just meant the field in my pane was wider than long"): the field is as long as it is wide, the seating in the middle of it, so there is
    // as much room to come round north and south as east and west
    if (w !== h) { var side = Math.max(w, h), sx = Math.floor((side - w) / 2), sy = Math.floor((side - h) / 2); every.forEach(function (c) { c[0] += sx; c[1] += sy; }); w = h = side; }
    for (var y = 0; y < h; y++) { rows.push(new Array(w + 1).join('.')); hts.push(new Array(w + 1).join('0')); }
    D.MAPS[H.FIELD] = Object.assign({}, D.MAPS.gnollhills, { name: 'The Field', sub: SA.name + ' and ' + SB.name, rows: rows, heights: hts });
    var q = '?npc=' + Bl.join(',') + '&lvl=' + L + '&vs=' + (ph ? 'fighter:1' : aClass.join(',')) + '&map=' + H.FIELD + (o && o.bench ? '' : '&watch');
    var B = D.npcFight(q, o || {});
    B.hl = { a: { name: SA.name }, b: { name: SB.name }, units: hu, gap: g * 5, w: w, h: h, round: 0, lines: [] };
    var enter0 = B.enter;
    B.enter = function () {
      enter0.apply(this, arguments);
      var self = this, P = this.units.filter(function (u) { return u.side === 'party'; }), Fo = this.units.filter(function (u) { return u.side === 'foe'; });
      if (ph) P.forEach(function (u) { u.hless = true; u.dead = true; u.fled = true; u.x = -99; u.y = -99; }); // (a group with no class or named one in it: the Battle's own hero stands nowhere)
      var ci = 0, mine = [];
      A.forEach(function (wd, i) {
        var u;
        if (isClass(wd)) { u = P[ci++]; if (u) { u.guest = true; u.classAI = true; } }
        else if (D.FOES[wd]) { u = self.makeFoe({ id: 'a' + i + '-' + wd, kind: wd, at: [0, 0], side: 'party', ally: true }); self.units.push(u); }
        if (u) { u.hgroup = 'a'; u.hword = wd; u.hunit = Au[i]; u.hhero = Ah[i]; u.hseat = PA[i]; u.hface = FA[i]; mine.push(u); }
      });
      Fo.forEach(function (u, i) { u.hgroup = 'b'; u.hword = u.rword || Bl[i] || u.kind; u.hunit = Bu[i]; u.hhero = Bh[i]; u.hseat = PB[i]; u.hface = FB[i]; });
      mine.concat(Fo).forEach(function (u) {
        if (u.hseat) { u.x = u.hseat[0]; u.y = u.hseat[1]; if (D.spr && D.spr.facingFor && u.hface) u.facing = D.spr.facingFor(u.hface[0], u.hface[1]); }
        // THE WALLS (the board's holding ground: the Pit's and the inn's walls, the tribes' seats): the ones who hold are behind half cover from every shot
        // (SRD 5.1, Cover: +2 to AC -- js/battle.js reads u.hcover), with the +1 on their morale the board already sends
        if (hu[u.hunit] && hu[u.hunit].cover) u.hcover = true;
        // SURPRISE (the board's die, Book III): the side caught unready is surprised as the grid has it (SRD 5.1: no turn in the first round)
        if (spec.surprised && u.hgroup === spec.surprised && u.conds) u.conds.surprised = true;
        // THE CHARGE (11-14, Griz: "grant the 'charging' units a free dash?", then "yes to all four"): the ones that marched into the hex that day come on at a
        // run -- in the first round each has a Dash's feet over its own and its action still to use (ours; the SRD's Dash is the action). Not one caught unready
        if (hu[u.hunit] && hu[u.hunit].charge && spec.surprised !== u.hgroup) u.hdash = true;
        // GLORY (11-14, Griz: "would glory seeking gnoll types do a kill the warlock and flee (assuming they can recognize superior force?)", "yes to all four"):
        // a band that knows itself outmatched (the board says so: `glory`) sends its glory-seekers at the other side's leaders while one stands (js/ai.js u.hunts);
        // when none of them stands and one at least is down, the band has its kill and goes -- H.morale, `withdrew`
        if (hu[u.hunit] && hu[u.hunit].glory && /^gloryseeker/.test(u.hword)) u.hunts = function (w) { return w.hhero != null; };
      });
      this.hl.ids = mine.concat(Fo).map(function (u) { return u.id; }); this.hl.byId = {}; mine.concat(Fo).forEach(function (u) { self.hl.byId[u.id] = u; }); if (spec.rec) this.hl.frames = [];
      this.hl.lead0 = { a: mine.filter(function (u) { return u.hhero != null; }).length, b: Fo.filter(function (u) { return u.hhero != null; }).length };
      this.cache = null;
      this.over = function () { return H.over(this); };
      H.listen(this);
    };
    return B;
  };
  // the whole fight unseen: what it came to
  H.run = function (spec) {
    var B = H.make(spec, { bench: true }), v, guard = 0, err = null; D.battle = B; B.enter();
    while (B.co && guard++ < 600000 && !(B.round > 60)) {
      var r; try { r = B.co.next(v); } catch (e) { err = String(e && e.stack || e).slice(0, 600); break; }
      v = undefined; if (r.done) break;
      var y = r.value; if (typeof y === 'number' || !y) continue;
      if (y.prompt) v = y.prompt.opts[0].value; else if (y.turn) v = { do: 'end' };
    }
    if (B.hl.close) B.hl.close();
    if (B.hl.frames) B.hl.frames.push({ end: true, at: H.frame(B) });
    (B.hl.beats || []).forEach(function (bt) { bt.turns.forEach(function (tn) { delete tn.last; }); });
    var res = B.result && B.result.result ? B.result.result : (typeof B.result === 'string' ? B.result : H.over(B));
    if (!err && !H.men(B, 'a').some(up) && !H.men(B, 'b').some(up)) res = 'both'; // (the last of each down or away in the one round: nobody's)
    return { result: err ? 'error' : res || 'unended', error: err, rounds: B.round, gapFt: B.hl.gap, field: B.hl.w + 'x' + B.hl.h, a: H.tally(B, 'a'), b: H.tally(B, 'b'), morale: B.hl.lines, charged: B.hl.charged || 0, frames: B.hl.frames || null, beats: B.hl.beats || [], log: B.log || [] };
  };
  // THE SNOOT'S ASK (deep16/?headlessrun, in a frame nobody sees: snoot-mode/js/headless.js HL.ask): 'd16h:ready' up to the page that holds the frame; its
  // 'snh:fight' (two of the board's units as HL.pack sends them, a seed, a level) is fought whole and answered 'd16h:done' with H.run's result, the log left off
  H.serve = function () {
    var post = function (m) { try { window.parent.postMessage(m, '*'); } catch (e) { } };
    var side = function (x) { var us = Array.isArray(x) ? x : [x]; return { name: us.map(function (u) { return u.name; }).join(' and '), units: us.map(function (u) { return { id: u.id, name: u.name, list: H.listOf(u), nh: H.heroWords(u).length, morale: u.rating, never: !!u.never, form: u.form || null, asp: u.asp || null, cover: !!u.cover, charge: !!u.charge, glory: !!u.glory }; }) }; };
    window.addEventListener('message', function (e) {
      var m = e.data; if (!m || m.type !== 'snh:fight' || e.source !== window.parent) return;
      try { var r = H.run({ a: side(m.a), b: side(m.b), level: m.level || 4, seed: m.seed, surprised: m.surprised || null }); delete r.log; delete r.frames; post({ type: 'd16h:done', id: m.id, res: r }); }
      catch (err) { post({ type: 'd16h:crash', id: m.id, msg: String(err && err.message || err).slice(0, 200) }); }
    });
    setTimeout(function () { post({ type: 'd16h:ready' }); }, 0);
    return { update: function () { }, draw: function () { } };
  };
  // THE REPLAY (11-14, Griz: "i thought the one thing was going to let us animate an entire 'initiative group' at the same time in the janky viewer", then "yes to
  // all four, build them"): the fight is fought whole, unseen, with a frame kept as each turn opens (H.frame); then the same field is made again to be looked at
  // and the record played on it a BEAT at a time -- a beat the run of one side's turns in the initiative order, as the Snoot's show has it. In a beat every body
  // that moved walks at once to where the beat left it, every one that struck swings at once, and the ones who went down or away in it go. Nothing is rolled in
  // the replay: it is the fought fight's own record. The fight a turn at a time, as the engine plays it, is the door's &turns.
  H.ZOOM = 0.6; H.WALK = 12; H.STEP = 3; H.SWING = 26; // (a beat's walk in steps, the ticks a step, the ticks a swing holds)
  H.play = function* (B, rec) {
    var hl = B.hl, us = hl.ids.map(function (id) { return hl.byId[id]; }), beats = [];
    (rec.frames || []).forEach(function (f) {
      var bt = beats[beats.length - 1];
      if (f.end) { beats.push({ end: true, at: f.at }); return; }
      if (!bt || bt.g !== f.g || bt.round !== f.round) { bt = { g: f.g, round: f.round, at: f.at, acts: 0, struck: [] }; beats.push(bt); }
      bt.acts++; if (f.struck && f.i >= 0) bt.struck.push(f.i);
    });
    var set = function (st) { st.forEach(function (q, i) { var u = us[i]; if (!u) return; u.x = q[0]; u.y = q[1]; u.hp = q[3]; if (q[2]) { u.dead = true; u.fled = q[2] === 2; if (u.deadT == null) u.deadT = B.t; } }); B.cache = null; };
    var faceTo = function (u, dx, dy) { if (D.spr && D.spr.facingFor && (dx || dy)) u.facing = D.spr.facingFor(dx, dy); };
    if (D.iso && D.iso.zoom) D.iso.zoom = H.ZOOM; // (more of the field in the frame than a played fight wants; the wheel still zooms)
    yield 30;
    for (var k = 0; k < beats.length; k++) {
      var bt = beats[k]; if (bt.end) break;
      var nx = beats[k + 1], a0 = bt.at, a1 = nx.at; B.round = bt.round;
      set(a0);
      // (the camera on the middle of who is still up, a little toward the side whose beat it is)
      var seen = []; us.forEach(function (u, i) { if (u && !a0[i][2]) seen.push(a0[i]); }); var mine = []; us.forEach(function (u, i) { if (u && !a0[i][2] && u.hgroup === bt.g) mine.push(a0[i]); });
      if (seen.length && D.iso && D.iso.lookAt) { var avg = function (L, c) { return L.reduce(function (t, q) { return t + q[c]; }, 0) / L.length; }, mm = mine.length ? mine : seen; D.iso.lookAt(Math.round((avg(seen, 0) * 2 + avg(mm, 0)) / 3), Math.round((avg(seen, 1) * 2 + avg(mm, 1)) / 3)); }
      B.card(['{y}R' + bt.round + '{/}  ' + hl[bt.g].name + ':  ' + bt.acts + (bt.acts > 1 ? ' turns' : ' turn') + ', ' + bt.struck.length + ' strike'], 200);
      // the walk: everyone the beat moved, at once
      var mv = []; us.forEach(function (u, i) { if (u && !a0[i][2] && (a0[i][0] !== a1[i][0] || a0[i][1] !== a1[i][1])) mv.push(i); });
      if (mv.length) {
        mv.forEach(function (i) { var u = us[i]; u.anim = 'walk'; u.animT = B.t; faceTo(u, a1[i][0] - a0[i][0], a1[i][1] - a0[i][1]); });
        for (var sN = 1; sN <= H.WALK; sN++) { mv.forEach(function (i) { us[i].x = Math.round(a0[i][0] + (a1[i][0] - a0[i][0]) * sN / H.WALK); us[i].y = Math.round(a0[i][1] + (a1[i][1] - a0[i][1]) * sN / H.WALK); }); B.cache = null; yield H.STEP; }
        mv.forEach(function (i) { us[i].anim = 'idle'; us[i].animT = B.t; });
      }
      // the blows: everyone who struck in it, at once, each turned to the nearest of the other side still up
      if (bt.struck.length) {
        bt.struck.forEach(function (i) {
          var u = us[i], best = null, bd = 1e9; if (!u) return;
          us.forEach(function (w, j) { if (!w || w.hgroup === u.hgroup || a0[j][2]) return; var d = Math.abs(a1[j][0] - u.x) + Math.abs(a1[j][1] - u.y); if (d < bd) { bd = d; best = j; } });
          if (best != null) faceTo(u, a1[best][0] - u.x, a1[best][1] - u.y);
          u.anim = 'attack'; u.animT = B.t;
        });
        yield H.SWING;
        bt.struck.forEach(function (i) { if (us[i]) { us[i].anim = 'idle'; us[i].animT = B.t; } });
      }
      // who went down or away in it
      var fell = 0, ran = 0; us.forEach(function (u, i) { if (u && !a0[i][2] && a1[i][2]) { if (a1[i][2] === 2) ran++; else fell++; } });
      set(a1);
      if (fell || ran) { B.card(['{y}R' + bt.round + '{/}  ' + (fell ? fell + ' down' : '') + (fell && ran ? ', ' : '') + (ran ? ran + ' away' : '')], 200); if (D.sfx && fell) D.sfx('die'); }
      yield fell || ran ? 22 : 8;
    }
    var tl = function (g) { var t = rec[g]; return t.name + ' ' + t.up + ' of ' + t.n + ' standing' + (t.away ? ', ' + t.away + ' away' : ''); };
    B.card(['{y}' + (rec.result === 'won' ? rec.a.name + ' hold the field' : rec.result === 'lost' ? rec.b.name + ' hold the field' : 'Nobody holds the field') + '{/}  (' + rec.rounds + ' rounds)', tl('a'), tl('b')].concat(rec.morale || []), 6000);
    while (true) yield 600; // (the field as the fight left it: reload for it again, another &seed= for another)
  };
  H.replay = function (spec) {
    var rec = H.run(Object.assign({}, spec, { rec: true }));
    var B = H.make(Object.assign({}, spec, { gap: rec.gapFt, rec: false }), {}), enter1 = B.enter;
    B.hrec = rec;
    B.enter = function () { enter1.apply(this, arguments); if (rec.frames && rec.frames.length > 1 && rec.result !== 'error') this.co = H.play(this, rec); };
    return B;
  };
  // THE JANKY HEAD: the fight on the screen, both groups run by the AI, replayed a beat at a time (H.replay); &turns for the engine's own turn at a time --
  H.door = function (q) {
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    // (11-14, the seating: &af= &bf= line | column | square; &aa= &ba= how each strikes the other, front | flank | rear; &ac=1 &bc=1 behind the walls; &sur=a | b caught unready; &ach=1 &bch=1 it marched in: the charge; &ag=1 &bg=1 outmatched glory-seekers; &anh= &bnh= how many of the list's first are its leaders)
    var specD = { a: { name: get('an') || 'the first', list: H.words(get('a') || 'paladin:4*3,guard*12'), morale: +get('am') || 5, form: get('af'), asp: get('aa'), cover: !!get('ac'), charge: !!get('ach'), glory: !!get('ag'), nh: +get('anh') || 0 }, b: { name: get('bn') || 'the second', list: H.words(get('b') || 'gloryseeker*3,gnoll*9,hyena*6'), morale: +get('bm') || 7, form: get('bf'), asp: get('ba'), cover: !!get('bc'), charge: !!get('bch'), glory: !!get('bg'), nh: +get('bnh') || 0 },
      level: +get('lvl') || 4, seed: get('seed') != null ? +get('seed') : null, gap: +get('gap') || 0, surprised: get('sur') };
    return /[?&]turns\b/.test(q) ? H.make(specD, {}) : H.replay(specD);
  };
})();
