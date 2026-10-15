/* THE SNOOT -- the rules: the hexes, the day's orders, and the resolve (10-14, the Snoot mode seat).
   The turn is CHAINMAIL's simultaneous system (p.9; RULED 10-13: "build it straight that way first"): every unit of ours gets
   written orders, the AI writes the gnolls' and the Dominion's, then the day resolves -- everyone moves at once (each step at its
   own hour of the day, so the fast arrive first), a unit that walks into an enemy stops there and so does the enemy, units with
   CHARGE IF CHARGED next to a fight are drawn into it (p.16), and each contested hex fights up to three rounds on the Combat
   Tables (p.40) with post-melee morale after each (pp.15-16). A fight the party stands in is DEEP16's (RULED 10-13: "Chef's
   dice", the grid only where the party stands): the resolve is a generator and yields { deep } for the page to fight on the
   grid and send the result back in (js/deep.js), or the bench's stand-in on the tables (SN.standIn).
   His rules (10-13, RULED 10-14): the WITNESS -- a gnoll unit that wins is filled from every gnoll unit within two hexes, each
   giving up to half, never past its starting size; the COLLISION -- the Harbinger's unit meets GreyFang's: if the party is with
   GreyFang or next to the fight, DEEP16's `greyfang` fight (its trophy ending takes the head), else the head is taken on the map;
   then the Harbinger goes back to the moot ground and every gnoll unit goes home. Then the Dominion is mopped up, and the tally. */
'use strict';
(function () {
  var SN = window.SN;

  // ---------------------------------------------------------------- the dice (seeded: the file he sends back carries the seed)
  SN.rng = function (st) { var t = (st.rs = (st.rs + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  SN.d6 = function (st) { return 1 + Math.floor(SN.rng(st) * 6); };
  SN.dice = function (st, n) { var a = []; for (var i = 0; i < n; i++) a.push(SN.d6(st)); return a; };

  // ---------------------------------------------------------------- the hexes (pointy-top, odd rows half a hex right)
  function cube(c, r) { var x = c - (r - (r & 1)) / 2; return [x, -x - r, r]; }
  SN.dist = function (a, b) { var p = cube(a[0], a[1]), q = cube(b[0], b[1]); return Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]), Math.abs(p[2] - q[2])); };
  // the six neighbours in the order E, NE, NW, W, SW, SE (the facings a pointy-top hex has: the lane §8)
  var NB = [[[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]], [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]]];
  SN.DIRS = ['E', 'NE', 'NW', 'W', 'SW', 'SE'];
  SN.on = function (h) { return h && h[0] >= 0 && h[1] >= 0 && h[0] < SN.W && h[1] < SN.H; };
  SN.nbrs = function (h) { return NB[h[1] & 1].map(function (d) { return [h[0] + d[0], h[1] + d[1]]; }).filter(SN.on); };
  SN.dirTo = function (a, b) { var n = NB[a[1] & 1]; for (var i = 0; i < 6; i++) if (a[0] + n[i][0] === b[0] && a[1] + n[i][1] === b[1]) return i; return -1; };
  SN.key = function (h) { return h[0] + ',' + h[1]; };
  SN.same = function (a, b) { return !!a && !!b && a[0] === b[0] && a[1] === b[1]; };
  var ROAD = null;
  SN.road = function (h) { if (!ROAD) { ROAD = {}; SN.ROADS.forEach(function (r) { r.hexes.forEach(function (x) { ROAD[SN.key(x)] = 1; }); }); } return !!ROAD[SN.key(h)]; };
  SN.cost = function (h) { var t = SN.TERRAIN[SN.ter(h[0], h[1])]; if (!t || t.water) return 99; return SN.road(h) ? 1 : t.cost; };
  // the cheapest way from a to b (Dijkstra; 99 is no way): the hexes after a, in order, or null
  SN.path = function (a, b, avoid) {
    if (!SN.on(b) || SN.cost(b) >= 99) return null;
    var best = {}, prev = {}, open = [[0, a]]; best[SN.key(a)] = 0;
    while (open.length) {
      open.sort(function (x, y) { return x[0] - y[0]; });
      var cur = open.shift(), h = cur[1], k = SN.key(h);
      if (cur[0] > best[k]) continue;
      if (SN.same(h, b)) break;
      SN.nbrs(h).forEach(function (n) {
        var c = SN.cost(n); if (c >= 99) return;
        if (avoid && avoid(n) && !SN.same(n, b)) c += 6; // (a hex to go round if it can: the party's guard, for a band that wants glory not grief)
        var nk = SN.key(n), d = cur[0] + c;
        if (best[nk] == null || d < best[nk]) { best[nk] = d; prev[nk] = h; open.push([d, n]); }
      });
    }
    if (best[SN.key(b)] == null) return null;
    var out = [], at = b; while (!SN.same(at, a)) { out.unshift(at); at = prev[SN.key(at)]; }
    return out;
  };
  // how far a path gets in a day: the hexes it reaches (a unit can always take its first step, whatever the ground -- Book III's day)
  SN.reach = function (u, path) {
    var left = SN.moveOf(u), out = [];
    for (var i = 0; i < (path || []).length; i++) { var c = SN.cost(path[i]); if (c > left && i > 0) break; left -= c; out.push(path[i]); if (left <= 0) break; }
    return out;
  };
  SN.moveOf = function (u) { return Math.max(1, (u.move || SN.MOVE[u.cls] || 3) - (u.fatigued ? 1 : 0)); };

  // ---------------------------------------------------------------- the units
  SN.alive = function (u) { return u.on && (u.state === 'ok' || u.state === 'retreat' || u.state === 'rout' || u.state === 'withdraw'); };
  SN.heroesOf = function (u) { return (u.heroes || []).filter(function (h) { return !h.dead; }); };
  SN.hostile = function (a, b) { return a.side !== b.side && (a.side === 'ours' || b.side === 'ours'); }; // (the gnolls and the Dominion do not fight each other: the Dominion lit this)
  SN.unitsAt = function (st, h) { return st.units.filter(function (u) { return SN.alive(u) && SN.same(u.at, h); }); };
  SN.unit = function (st, id) { return st.units.filter(function (u) { return u.id === id; })[0]; };
  SN.isWiz = function (h) { return h.type === 'wizard'; };
  SN.casts = function (h) { return h.type === 'wizard' || !!h.missile; }; // (who throws a missile: every wizard, and a hero who carries one -- Book I p.17 keys an 8th-level magic-user, the Warlock, to fight as a Hero; his missile is still the Warlock's, p.31)
  SN.nevers = function (u) { var hs = SN.heroesOf(u); return !!(u.party || u.berserk || u.watch || u.harbinger || (!u.figs && hs.length && !hs.every(SN.isWiz))); }; // (a wizard alone checks, at her own rating: p.33) // (never check morale: the heroes (p.30), berserkers (p.20), the death-watch "unto death", the Harbinger's pack)
  SN.rating = function (u) { return (u.morale || SN.MORALE[u.def] || 5) + (u.cleric ? 1 : 0) - (u.fatigued ? 1 : 0); };
  SN.greyfang = function (st) { var u = SN.unit(st, 'greyfang'); return u && SN.alive(u) && SN.heroesOf(u).some(function (h) { return h.fated; }) ? u : null; };
  SN.harb = function (st) { var u = SN.unit(st, 'harb'); return u && SN.alive(u) && !st.head ? u : null; };
  SN.party = function (st) { var u = SN.unit(st, 'party'); return u && SN.alive(u) && !u.out ? u : null; };
  // the figures a unit counts in a fight: its own, and its fantastic figures at what they fight as (a hero four, a super-hero eight, a wraith
  // or a warlock two: p.30, p.33, p.43) -- the party is never in this count but on the bench's stand-in
  SN.fightFigs = function (u) { return u.figs + SN.heroesOf(u).reduce(function (s, h) { return s + ({ hero: 4, superhero: 8, wraith: 2, wizard: 2 }[h.type] || 0); }, 0); };
  SN.bonus = function (u) { var hs = SN.heroesOf(u), b = 0; if (hs.some(function (h) { return h.type === 'superhero'; })) b = 2; else if (hs.some(function (h) { return h.type === 'hero'; })) b = 1; return b + (u.berserk ? 2 : 0); }; // (only a hero adds to his unit's dice, a super-hero twice, p.30; a wizard or a wraith works on morale) // (a hero adds 1 to the unit's dice, a super-hero 2 (p.30: doubled); berserkers +2, p.20)

  SN.newGame = function (seed) {
    var st = { v: 1, seed: seed >>> 0, rs: seed >>> 0, day: SN.DAY0, units: [], log: [], head: null, huntDay: null, domDay: null, pitFell: false, over: false,
      tally: null, gone: {}, events: [], orders: {}, rec: [], stats: { killed: {}, lost: {}, prisoners: {}, beaten: 0, witness: 0 } };
    SN.FORCES.forEach(function (f) { st.units.push(SN.make(f, !f.arrive)); });
    SN.say(st, 'Day ' + st.day + '. The four come down the road to Tarlyn\'s Pit two days after the giants. The Snoot burns in the hills.', 'day');
    return st;
  };
  SN.make = function (f, on) {
    var u = JSON.parse(JSON.stringify(f));
    u.figs0 = u.figs; u.on = !!on; u.state = 'ok'; u.at = (u.at || SN.WEST).slice(); u.home = u.at.slice(); u.lost = 0; u.rounds = 0; u.order = { type: 'hold' };
    (u.heroes || []).forEach(function (h) { h.dead = false; });
    if (u.tribe === 'skull') u.home = [7, 1]; else if (u.tribe === 'gray' || u.harbinger) u.home = SN.MOOT.slice(); else if (u.tribe === 'wall') u.home = [0, 1];
    if (u.side === 'dominion') u.home = SN.WEST.slice();
    if (u.side === 'ours') u.home = u.kind === 'the plains' ? u.at.slice() : SN.PIT.slice(); // (the plains tribes go back to the Verge)
    return u;
  };
  SN.say = function (st, text, kind, at) { st.log.push({ day: st.day, text: text, kind: kind || 'info', at: at || null }); };
  // the show's beats (RULED 10-14 night, "the resolution should be a show"): what happened in a fight, in the order it happened, with its
  // dice -- the log is for reading, the beats for js/show.js to stage. A unit as it stood when its fight began: SN.snap
  SN.beat = function (st, d) { d.day = st.day; (st.beats = st.beats || []).push(d); };
  SN.snap = function (u) { return { id: u.id, name: u.name, side: u.side, party: !!u.party, figs: u.figs || 0, cls: u.cls, sheets: (u.sheets || []).slice(), heroes: SN.heroesOf(u).map(function (h) { return { name: h.name, type: h.type }; }), harbinger: !!u.harbinger }; };

  // ---------------------------------------------------------------- the day begins: arrivals, the hunt, the Dominion, the AI's orders
  SN.dawn = function (st) {
    st.events = [];
    st.units.forEach(function (u) {
      if (!u.on && u.arrive && u.arrive <= st.day && !u.arrived) { u.arrived = true; u.on = true; u.at = SN.freeNear(st, u.at, u); SN.say(st, u.name + ' arrive' + (u.kind === 'the plains' ? ' off the Verge' : ' up the south road') + '.', 'arrive', u.at); st.events.push({ kind: 'arrive', id: u.id }); }
      u.rounds = 0; u.moved = false; u.charged = false; u.berserkOrder = false; u.held = false; u.fought = false; u.lostToday = false; u.wonToday = false; u.drawn = false;
      if (u.out && u.out <= st.day) { u.out = 0; SN.say(st, 'The four are on their feet again.', 'party'); }
    });
    // the hunt: the Harbinger holds in the hills till the exchange (Day 18) -- or till GreyFang comes within two hexes of him (RULED 10-14, lean 1)
    var H = SN.harb(st), G = SN.greyfang(st);
    if (H && st.huntDay == null && (st.day >= SN.HUNT || (G && SN.dist(H.at, G.at) <= 2))) {
      st.huntDay = st.day; st.domDay = st.day + 2;
      SN.say(st, 'On the crown of a hill a gnoll stands too still, and both its eyes are mirrors. The Harbinger is hunting GreyFang.', 'hunt', H.at);
      st.events.push({ kind: 'hunt' });
    }
    // the Dominion: three wagons on the west road two days after the hunt began (his word 10-14)
    if (st.domDay != null && st.day >= st.domDay && !st.domIn) {
      st.domIn = true;
      SN.DOMINION.forEach(function (f) { var u = SN.make(f, true); u.at = SN.freeNear(st, SN.WEST, u); st.units.push(u); });
      SN.say(st, 'Three Dominion wagons come along the west road, soldiers walking beside them and a lady on each bench. They have come to watch.', 'dominion', SN.WEST);
      st.events.push({ kind: 'dominion' });
    }
    if (st.huntDay != null && !st.head) { var hb = SN.unit(st, 'harb'); if (hb && hb.beaten && hb.beaten <= st.day) { hb.beaten = 0; SN.say(st, 'The Harbinger walks out of the mirror again on the moot ground.', 'hunt', hb.at); } }
    SN.say(st, 'Day ' + st.day + '.', 'day');
    // orders: ours hold unless written; routing and withdrawing units go home; the berserkers will not wait (p.20); the AI writes the rest
    st.units.forEach(function (u) { if (!SN.alive(u)) return; u.order = { type: 'hold' }; });
    SN.AI.orders(st);
  };
  SN.freeNear = function (st, h, u) {
    var ring = [h].concat(SN.nbrs(h)), i, j;
    for (i = 0; i < ring.length; i++) if (SN.cost(ring[i]) < 99 && SN.room(st, ring[i], u)) return ring[i].slice();
    for (i = 0; i < ring.length; i++) { var r2 = SN.nbrs(ring[i]); for (j = 0; j < r2.length; j++) if (SN.cost(r2[j]) < 99 && SN.room(st, r2[j], u)) return r2[j].slice(); }
    return h.slice();
  };
  SN.room = function (st, h, u) {
    if (SN.same(h, SN.PIT)) return true;
    return SN.unitsAt(st, h).filter(function (x) { return x !== u && x.side === u.side; }).length < SN.STACK;
  };
  // an order for a unit of ours (the page writes these): { type: 'move', to: [c, r] } | { type: 'hold' } | { type: 'support' } (charge if charged)
  SN.canOrder = function (st, u) { return SN.alive(u) && u.side === 'ours' && u.state === 'ok' && !u.out && !(u.stand >= st.day) && !u.berserk; }; // (the plains tribes are the mode's AI's: RULED 10-15)
  SN.setOrder = function (st, u, o) {
    if (!SN.canOrder(st, u)) return false;
    if (o.type === 'move') { var p = SN.path(u.at, o.to); if (!p || !p.length) return false; u.order = { type: 'move', to: o.to.slice(), path: SN.reach(u, p), full: p }; }
    else u.order = { type: o.type };
    return true;
  };

  // ---------------------------------------------------------------- the resolve (a generator: yields { anim } and { deep }; the page drives it)
  SN.resolve = function* (st) {
    st.rec.push({ day: st.day, orders: st.units.filter(SN.alive).map(function (u) { return [u.id, u.order.type, u.order.path ? u.order.path.map(SN.key).join(' ') : '']; }) });
    var steps = SN.move(st);
    if (steps.length) yield { anim: steps };
    SN.drawIn(st);
    // the collision first: the head is the Snoot's commander-piece (p.21, inverted -- the lane §5.4)
    var H = SN.harb(st), G = SN.greyfang(st);
    st.shown = (st.beats || []).length;
    if (H && G && SN.same(H.at, G.at)) { yield* SN.collide(st, H, G); yield* SN.flush(st, G.at); }
    // every contested hex fights (the nearer the Pit, the sooner: the order the log reads); a hex shared again by what the day moved (the four
    // carried to the Pit, a beaten Harbinger set down) fights too -- no hex ends the day shared (RULED 10-14 night)
    for (var pass = 0; pass < 3; pass++) {
      var hexes = SN.contested(st); if (!hexes.length) break;
      for (var i = 0; i < hexes.length; i++) { yield* SN.fightHex(st, hexes[i]); yield* SN.flush(st, hexes[i]); }
    }
    SN.dusk(st);
  };
  // the beats not yet shown, to the page as one show (js/show.js); the bench's driver passes over it
  SN.flush = function* (st, at) {
    var n = (st.beats || []).length; if (n <= (st.shown || 0)) return;
    var from = st.shown || 0; st.shown = n;
    yield { show: { from: from, to: n, at: at ? at.slice() : null } };
  };

  // everyone moves at once: each step happens at its own hour (the sum of its costs over the unit's move), the earliest first. A step into a
  // hex an enemy stands in stops both there: a contact (p.9, "unordered contacts"). A hex full of friends stops a unit before it
  SN.move = function (st) {
    var ev = [], steps = [];
    st.units.forEach(function (u) {
      if (!SN.alive(u) || u.order.type !== 'move' || !u.order.path) return;
      var mv = SN.moveOf(u), t = 0;
      u.order.path.forEach(function (h, i) { t += SN.cost(h) / mv; ev.push({ t: Math.min(t, 1) + i * 1e-6, u: u, to: h, tie: SN.rng(st) }); });
      u.halted = false;
    });
    ev.sort(function (a, b) { return a.t - b.t || a.tie - b.tie; });
    ev.forEach(function (e) {
      var u = e.u; if (u.halted || !SN.alive(u)) return;
      var here = SN.unitsAt(st, e.to), foes = here.filter(function (x) { return SN.hostile(u, x); });
      if (!foes.length && !SN.room(st, e.to, u)) { u.halted = true; return; }
      // the Harbinger on the hunt: a wraith may walk away from anything that cannot harm him (p.44's note; p.34: only magic and the fantastic
      // harm a wraith) -- so only a unit with a hero in it (a paladin, GreyFang) or the four can hold him. He walks through the rest, and the
      // rest cannot close with him
      var hunting = function (x) { return x.harbinger && st.huntDay != null && !x.beaten && !st.head; };
      var holds = function (x) { return x.party || SN.heroesOf(x).some(function (hh) { return hh.type === 'hero' || hh.type === 'superhero'; }); };
      if (hunting(u) && foes.length && !foes.some(holds)) {
        SN.say(st, foes.map(function (x) { return x.name; }).join(' and ') + ' cannot hold the Harbinger: he walks through them.', 'move', e.to);
        steps.push({ id: u.id, from: u.at.slice(), to: e.to.slice(), t: e.t }); u.at = e.to.slice(); u.moved = true; return;
      }
      if (foes.length && foes.every(hunting) && !holds(u)) { u.halted = true; SN.say(st, u.name + ' cannot close with the Harbinger.', 'move', e.to); return; }
      steps.push({ id: u.id, from: u.at.slice(), to: e.to.slice(), t: e.t });
      u.at = e.to.slice(); u.moved = true;
      if (foes.length) {
        u.halted = true; u.charged = true;
        foes.forEach(function (f) { f.halted = true; });
        if (SN.heroesOf(u).some(function (h) { return h.type === 'superhero' || h.type === 'wraith' || h.type === 'wizard'; })) st.shock = (st.shock || []).concat([{ at: e.to.slice(), by: u.id }]);
      }
    });
    return steps;
  };
  // CHARGE IF CHARGED (p.9) and the drawn-in rule (p.16: within reach of a melee, a unit may join it): ours by the order, the gnolls by the AI's
  SN.drawIn = function (st) {
    var fighting = {}; SN.contested(st).forEach(function (h) { fighting[SN.key(h)] = 1; }); // (a unit already in a fight is not drawn out of it into another)
    SN.contested(st).forEach(function (h) {
      var sides = {}; SN.unitsAt(st, h).forEach(function (x) { sides[x.side] = 1; });
      st.units.forEach(function (u) {
        if (!SN.alive(u) || u.state !== 'ok' || u.moved || SN.same(u.at, h) || SN.dist(u.at, h) !== 1 || fighting[SN.key(u.at)]) return;
        var join = (u.order.type === 'support' && u.side === 'ours' && (sides.gnoll || sides.dominion)) ||
          (u.side !== 'ours' && u.order.type === 'support' && sides.ours && sides[u.side]) || (u.berserk && sides.gnoll);
        if (!join || !SN.room(st, h, u) || SN.cost(h) >= 99) return;
        u.at = h.slice(); u.drawn = true; u.moved = true;
        SN.say(st, u.name + (u.berserk ? ' will not wait: they run into the fight.' : ' are drawn into the fight.'), 'move', h);
      });
    });
  };
  SN.contested = function (st) {
    var seen = {}, out = [];
    st.units.forEach(function (u) {
      if (!SN.alive(u)) return; var k = SN.key(u.at); if (seen[k]) return; seen[k] = 1;
      var here = SN.unitsAt(st, u.at); if (here.some(function (a) { return here.some(function (b) { return SN.hostile(a, b); }); })) out.push(u.at.slice());
    });
    return out.sort(function (a, b) { return SN.dist(a, SN.PIT) - SN.dist(b, SN.PIT); });
  };

  // ---------------------------------------------------------------- the collision (his rule, 10-13; "around" RULED 10-14)
  SN.around = function (st, G, H) { var P = SN.party(st); return !!P && (SN.dist(P.at, G.at) <= 1 || SN.dist(P.at, H.at) <= 1); };
  SN.collide = function* (st, H, G) {
    var P = SN.party(st), around = SN.around(st, G, H), gf = SN.heroesOf(G).filter(function (h) { return h.fated; })[0];
    SN.say(st, 'The Harbinger\'s pack reaches GreyFang at ' + SN.placeName(G.at) + '.', 'head', G.at);
    var how = 'map', res = null;
    if (around) {
      P.at = G.at.slice(); // (with him, or next to the fight: the four are in it -- RULED 10-14, "adjacent to harbingers group when the fight starts also")
      SN.say(st, 'The four are there. The fight goes to the grid: GreyFang\'s Pit.', 'party', G.at);
      yield* SN.flush(st, G.at);
      res = yield { deep: { kind: 'greyfang', fight: 'greyfang', at: G.at.slice(), foes: [H.id] } };
      SN.partyBack(st, res);
      how = 'grid';
    }
    gf.dead = true;
    st.head = { day: st.day, at: G.at.slice(), how: how, witnessed: around, result: res && res.result || null };
    SN.beat(st, { t: 'head', at: G.at.slice(), around: around, how: how, g: SN.snap(G), h: SN.snap(H) });
    st.stats.lostHeads = 1;
    SN.say(st, around ? 'The Harbinger takes GreyFang\'s head in front of the four. "The Mane is mine."' : 'No one is there to stop it. The Harbinger takes GreyFang\'s head. "The Mane is mine."', 'head', G.at);
    st.events.push({ kind: 'head', around: around });
    // then: the Harbinger back to where the Snoot started, and every snooting unit goes home (his rule)
    H.at = SN.freeNear(st, SN.MOOT, H); H.state = 'home'; H.on = true; H.home = SN.MOOT.slice();
    st.units.forEach(function (u) {
      if (u.side !== 'gnoll' || !SN.alive(u) || u === H) return;
      if (u.watch) return; // (the death-watch stays on the moot ground: they keep the Mane, and now its claimant comes to them)
      u.state = 'withdraw'; u.order = { type: 'hold' };
      if (SN.unitsAt(st, u.at).some(function (x) { return x.side === 'ours'; })) SN.fallBack(st, u, 'back'); // (they break off: whatever they were fighting, they turn for home)
      u.state = 'withdraw';
    });
    SN.say(st, 'Every gnoll on the field turns for home. The Snoot has its head.', 'head');
    if (G.figs <= 0 && !SN.heroesOf(G).length) G.state = 'gone';
  };

  // ---------------------------------------------------------------- a contested hex: the shock, the grid for the party, then the tables
  SN.fightHex = function* (st, h) {
    var here = function () { return SN.unitsAt(st, h); };
    var ours = function () { return here().filter(function (u) { return u.side === 'ours'; }); }, theirs = function () { return here().filter(function (u) { return u.side !== 'ours'; }); };
    if (!ours().length || !theirs().length) return;
    var name = SN.placeName(h);
    SN.say(st, 'A fight at ' + name + ': ' + ours().map(SN.label).join(', ') + ' against ' + theirs().map(SN.label).join(', ') + '.', 'fight', h);
    SN.beat(st, { t: 'fight', at: h.slice(), place: name, ter: SN.ter(h[0], h[1]), road: SN.road(h), ours: ours().map(SN.snap), theirs: theirs().map(SN.snap) });
    here().forEach(function (u) { u.fought = true; });
    // the shock: a super-hero's or a wraith's charge makes every enemy unit it reaches check as if over its line (p.30, p.34; p.18 for what failing is)
    (st.shock || []).filter(function (s) { return SN.same(s.at, h); }).forEach(function (s) {
      var by = SN.unit(st, s.by); if (!by || !SN.alive(by)) return;
      here().filter(function (u) { return SN.hostile(u, by) && !SN.nevers(u) && u.state === 'ok'; }).forEach(function (u) {
        var need = SN.UNSTABLE[u.def][1], r = SN.dice(st, 2), sum = r[0] + r[1];
        SN.beat(st, { t: 'shock', u: u.id, by: by.id, byName: SN.heroName(by), dice: r, need: need, ok: sum >= need });
        if (sum >= need) SN.say(st, u.name + ' stand before ' + SN.heroName(by) + ' (' + r.join('+') + '=' + sum + ', needed ' + need + ').', 'roll', h);
        else { SN.say(st, u.name + ' shy from ' + SN.heroName(by) + ' (' + r.join('+') + '=' + sum + ', needed ' + need + ') and fall back.', 'roll', h); SN.fallBack(st, u, 'retreat'); }
      });
    });
    if (!ours().length || !theirs().length) return SN.after(st, h, null);
    // the party: the grid
    var P = ours().filter(function (u) { return u.party && !u.out; })[0];
    if (P) {
      var foes = theirs(), H = foes.filter(function (u) { return u.harbinger; })[0], req;
      if (H) req = { kind: 'harbinger', fight: 'harbinger', at: h.slice(), foes: [H.id] };
      else req = SN.band(st, foes, h);
      yield* SN.flush(st, h);
      var res = yield { deep: req };
      SN.partyBack(st, res);
      SN.partyResult(st, P, foes, req, res, h);
      if (!ours().length || !theirs().length) return SN.after(st, h, P);
    }
    // the tables: up to three rounds in a day (fatigue, p.11), morale after each
    var round = 0, decided = false;
    while (round < 3 && !decided) {
      round++;
      var o = ours().filter(function (u) { return !u.party; }), t = theirs();
      if (!o.length || !t.length) break;
      decided = SN.round(st, o, t, round, h);
      o.concat(t).forEach(function (u) { u.rounds++; });
    }
    here().forEach(function (u) { if (u.rounds >= 3 && !u.fatigued) { u.fatigued = true; SN.say(st, u.name + ' are fatigued (three rounds of melee: a class down and -1 morale till a day\'s rest).', 'info', h); } });
    if (ours().length && theirs().length) SN.nightfall(st, h, ours(), theirs());
    SN.after(st, h, null);
  };
  // nightfall (RULED 10-14 night, his "enemies can't end the day on the hex?" and the seat's lean): three rounds and both still standing, the
  // side with the lower morale total backs off a hex in good order -- CHAINMAIL's mildest result (p.16); a side that never yields (berserkers,
  // the death-watch, the four) makes the other back off; both never yield, the fewer figures do; if they cannot move, the other side does
  SN.nightfall = function (st, h, O, T) {
    var figs = function (U) { return U.reduce(function (s, u) { return s + SN.fightFigs(u); }, 0); };
    var nO = O.every(SN.nevers), nT = T.every(SN.nevers), m = st._mor && SN.same(st._mor.at, h) ? st._mor : null, back;
    if (nO && !nT) back = T; else if (nT && !nO) back = O;
    else if (nO && nT) back = figs(O) < figs(T) ? O : T;
    else back = m ? (m.sA < m.sB ? O : T) : (figs(O) < figs(T) ? O : T);
    var tryBack = function (U) { U.forEach(function (u) { if (SN.alive(u) && SN.same(u.at, h)) SN.fallBack(st, u, 'backoff'); }); };
    SN.say(st, 'Night falls on the fight at ' + SN.placeName(h) + ': ' + back.map(function (u) { return u.party ? 'the four' : u.name; }).join(' and ') + ' back off a hex in good order.', 'morale', h);
    SN.beat(st, { t: 'night', units: back.map(function (u) { return u.id; }) });
    tryBack(back);
    var o2 = SN.unitsAt(st, h).filter(function (u) { return u.side === 'ours'; }), t2 = SN.unitsAt(st, h).filter(function (u) { return u.side !== 'ours'; });
    if (o2.length && t2.length) tryBack(back === O ? t2 : o2);
  };
  // after a hex's fight: who won it, the witness, instability
  SN.after = function (st, h, P) {
    var left = SN.unitsAt(st, h), o = left.filter(function (u) { return u.side === 'ours'; }), t = left.filter(function (u) { return u.side !== 'ours'; });
    var winner = o.length && !t.length ? 'ours' : t.length && !o.length ? 'them' : null;
    if (winner === 'them') t.forEach(function (u) { u.wonToday = true; });
    if (winner === 'ours') o.forEach(function (u) { u.wonToday = true; });
    if (winner === 'them') t.filter(function (u) { return u.side === 'gnoll'; }).forEach(function (w) { SN.witness(st, w); });
    st.units.forEach(function (u) { if (SN.alive(u) && u.figs0 && !u.unstable && !SN.nevers(u) && u.lost >= SN.UNSTABLE[u.def][0] * u.figs0 && u.figs > 0) SN.instability(st, u); });
  };
  // the witness (his rule): every gnoll unit within two hexes of a gnoll win gives up to half its figures to the winner, never past its starting size;
  // the Harbinger's pack counts (glory draws followers to him); the death-watch never leaves the Mane
  SN.witness = function (st, w) {
    var need = w.figs0 - w.figs; if (need <= 0 || !SN.alive(w)) return;
    st.units.filter(function (x) { return x !== w && x.side === 'gnoll' && SN.alive(x) && x.state === 'ok' && !x.watch && !x.lostToday && x.figs >= 2 && SN.dist(x.at, w.at) <= 2; })
      .sort(function (a, b) { return SN.dist(a.at, w.at) - SN.dist(b.at, w.at); })
      .forEach(function (x) {
        if (need <= 0) return; var give = Math.min(Math.floor(x.figs / 2), need); if (give <= 0) return;
        x.figs -= give; w.figs += give; need -= give; st.stats.witness += give;
        SN.beat(st, { t: 'wit', from: x.id, fromName: x.name, to: w.id, n: give, sheets: (x.sheets || []).slice() });
        SN.say(st, 'WITNESS: ' + x.name + ' saw ' + w.name + ' win, and ' + give + ' figure' + (give > 1 ? 's' : '') + ' go over to the winner (' + w.name + ' now ' + w.figs + ').', 'witness', w.at);
        st.events.push({ kind: 'witness', from: x.id, to: w.id, n: give });
      });
  };
  SN.instability = function (st, u) {
    u.unstable = true;
    var need = SN.UNSTABLE[u.def][1], r = SN.dice(st, 2), s = r[0] + r[1];
    SN.beat(st, { t: 'inst', u: u.id, dice: r, need: need, ok: s >= need });
    if (s >= need) SN.say(st, u.name + ' have lost ' + u.lost + ' of ' + u.figs0 + ' and hold together (' + r.join('+') + '=' + s + ', needed ' + need + ').', 'roll', u.at);
    else { SN.say(st, u.name + ' have lost ' + u.lost + ' of ' + u.figs0 + ' and break apart (' + r.join('+') + '=' + s + ', needed ' + need + '): ' + (SN.heroesOf(u).length ? 'the men scatter; ' + SN.heroesOf(u).map(function (x) { return x.name; }).join(' and ') + ' fight on alone.' : 'the unit is gone.'), 'roll', u.at); SN.scatter(st, u); }
  };
  SN.scatter = function (st, u) {
    if (SN.heroesOf(u).length && u.figs > 0) { u.figs = 0; return; } // (the heroes stay: the last figures killed are always theirs, p.30)
    u.state = 'gone'; u.on = false;
    st.stats.scattered = (st.stats.scattered || 0) + 1;
  };

  // one round on the tables, simultaneous (p.14): the fantastic figures meet first on the Fantasy table, the volley and the warlock's fire
  // ball before the first melee, then every unit's dice; casualties come off before morale (p.15)
  SN.round = function (st, o, t, round, h) {
    var kills = new Map();
    function hit(u, n) { kills.set(u, (kills.get(u) || 0) + n); }
    // the Fantasy table (p.44): each fantastic figure of ours against one of theirs, and theirs against ours
    function fantastic(A, B) {
      A.forEach(function (a) {
        SN.heroesOf(a).forEach(function (ha) {
          var targets = []; B.forEach(function (b) { SN.heroesOf(b).forEach(function (hb) { targets.push([b, hb]); }); });
          if (!targets.length) return;
          var tg = targets[Math.floor(SN.rng(st) * targets.length)], b = tg[0], hb = tg[1];
          var need = SN.FT[ha.type] && SN.FT[ha.type][hb.type]; if (!need) return;
          var r = SN.dice(st, 2), s = r[0] + r[1] - (ha.warlock ? SN.WARLOCK : 0);
          SN.beat(st, { t: 'ft', a: a.id, ah: ha.name, b: b.id, bh: hb.name, dice: r, mod: ha.warlock ? -SN.WARLOCK : 0, need: need, res: s > need ? (hb.fated ? 'spared' : hb.harbinger ? 'beaten' : 'kill') : s === need ? 'back' : 'none' });
          var line = ha.name + ' against ' + hb.name + ' on the Fantasy table: ' + r.join('+') + (ha.warlock ? '-2' : '') + '=' + s + ' against ' + need;
          if (s > need) {
            if (hb.fated) { SN.say(st, line + ': GreyFang is beaten back, not killed -- he is the Harbinger\'s.', 'roll', h); SN.fallBack(st, b, 'back'); }
            else if (hb.harbinger) { SN.say(st, line + ': the Harbinger goes down -- and the mirror takes him back to the moot ground.', 'roll', h); SN.beatHarb(st, b); }
            else { hb.dead = true; SN.say(st, line + ': ' + hb.name + ' is killed.', 'roll', h); SN.lose(st, b, 0, hb); }
          } else if (s === need) { SN.say(st, line + ': ' + hb.name + ' falls back.', 'roll', h); SN.fallBack(st, b, 'back'); }
          else SN.say(st, line + ': no effect.', 'roll', h);
        });
      });
    }
    SN.beat(st, { t: 'round', n: round });
    fantastic(o, t); fantastic(t, o);
    o = o.filter(SN.alive).filter(function (u) { return SN.same(u.at, h); }); t = t.filter(SN.alive).filter(function (u) { return SN.same(u.at, h); });
    if (!o.length || !t.length) return true;
    var before = {}; o.concat(t).forEach(function (u) { before[u.id] = SN.fightFigs(u); });
    function attack(a, B, volley) {
      if (!B.length) return;
      var tgt = B.slice().sort(function (x, y) { return SN.fightFigs(y) - SN.fightFigs(x); })[0], cls = a.fatigued ? SN.LOWER[a.cls] : a.cls;
      var dcls = tgt.fatigued ? SN.LOWER[tgt.def] : tgt.def, horse = { LH: 1, MH: 1, HH: 1 };
      if (horse[dcls] && !tgt.charged) dcls = SN.LOWER[dcls]; // (standing horse defends a class down, p.17)
      var wf = volley ? 0 : SN.heroesOf(a).filter(SN.isWiz).length * 2; // (a wizard fights as two Armored Foot, p.30: her own dice, below)
      var row = SN.CT[cls][dcls], f = volley ? a.figs : SN.fightFigs(a) - wf, ter = SN.TERRAIN[SN.ter(h[0], h[1])];
      if (wf) wizDice(a, tgt, dcls, wf, ter);
      if (f <= 0) return;
      var imp = !volley && round === 1 && a.charged && cls !== 'LF' && !ter.hill && !ter.rough; // (impetus, p.17: heavy and armored foot and all horse charging over open ground add a die)
      var n = Math.ceil(f / row[1]) * row[0] + (imp ? Math.ceil(f / row[1]) : 0), b = SN.bonus(a), need = Math.max(2, row[2] - b), r = SN.dice(st, n), k = r.filter(function (x) { return x >= need; }).length;
      if (tgt.harbinger && !SN.heroesOf(a).length && !tgt.figs) k = 0; // (a wraith alone: only magic and the fantastic harm him, p.34)
      if (volley && SN.heroesOf(tgt).some(SN.isWiz)) k = Math.min(k, tgt.figs); // (a wizard is impervious to normal missile fire, p.30: the volley kills her men, never her)
      SN.beat(st, { t: 'atk', u: a.id, tg: tgt.id, cls: cls, dcls: dcls, dice: r, need: need, k: k, volley: !!volley, imp: !!imp, round: round, f: f, row: row.slice(), bonus: SN.bonus(a) });
      SN.say(st, a.name + (volley ? ' loose a volley' : imp ? ' charge' : '') + ' (' + f + ' ' + cls + ' against ' + dcls + (imp ? ', +1 die a figure for the charge' : '') + ') roll ' + n + (n === 1 ? ' die' : ' dice') + ', kill on ' + need + '+' + (b ? ' (+' + b + ')' : '') + ': [' + r.join(' ') + '] -> ' + k + (k === 1 ? ' kill' : ' kills'), 'roll', h);
      if (k) hit(tgt, k);
    }
    function wizDice(a, tgt, dcls, wf, ter) {
      var row = SN.CT.AF[dcls], imp = round === 1 && a.charged && !ter.hill && !ter.rough, n = Math.ceil(wf / row[1]) * row[0] + (imp ? Math.ceil(wf / row[1]) : 0), r = SN.dice(st, n), k = r.filter(function (x) { return x >= row[2]; }).length;
      var w = SN.heroesOf(a).filter(SN.isWiz)[0];
      SN.beat(st, { t: 'atk', u: a.id, tg: tgt.id, cls: 'AF', dcls: dcls, dice: r, need: row[2], k: k, volley: false, imp: !!imp, round: round, f: wf, row: row.slice(), bonus: 0, wiz: true, who: w.name });
      SN.say(st, w.name + ' fights as two Armored Foot (against ' + dcls + ') rolls ' + n + (n === 1 ? ' die' : ' dice') + ', kill on ' + row[2] + '+: [' + r.join(' ') + '] -> ' + k + (k === 1 ? ' kill' : ' kills'), 'roll', h);
      if (k) hit(tgt, k);
    }
    // a wizard's missile, every round before the melee (p.31): chosen before the battle, a fire ball (a large catapult's hit area: one or two figures of
    // the unit it falls on) or a lightning bolt (a line: a figure in each of up to two units); it kills whatever it strikes, but a fantastic figure in the
    // struck unit rolls its save -- heroes 9+, super-heroes 6+, wraiths 7+ (GreyFang is beaten back, never killed; the Harbinger is the mirror's)
    o.concat(t).forEach(function (a) {
      SN.heroesOf(a).filter(SN.casts).forEach(function (w) {
        var B = (a.side === 'ours' ? t : o).filter(function (u) { return SN.alive(u) && SN.same(u.at, h); }); if (!B.length) return;
        var light = w.missile === 'lightning', pick = B.slice().sort(function () { return SN.rng(st) - 0.5; }), tgs = light ? pick.slice(0, 2) : pick.slice(0, 1);
        var hitsOn = tgs.map(function (u) { return { tg: u.id, n: light ? 1 : 1 + Math.floor(SN.rng(st) * 2) }; });
        SN.beat(st, { t: 'fb', u: a.id, w: w.name, kind: light ? 'lightning' : 'fireball', tg: hitsOn[0].tg, n: hitsOn[0].n, tgs: hitsOn });
        hitsOn.forEach(function (x) {
          var u = SN.unit(st, x.tg); hit(u, Math.min(x.n, u.figs));
          SN.say(st, w.name + (light ? ' throws a lightning bolt through ' : ' throws a fire ball into ') + u.name + ': ' + x.n + (x.n > 1 ? ' figures die.' : ' figure dies.'), 'roll', h);
          var fx = SN.heroesOf(u).filter(function (hh) { return SN.SAVES[hh.type]; }); if (!fx.length) return;
          var hh = fx[Math.floor(SN.rng(st) * fx.length)], need = SN.SAVES[hh.type], r = SN.dice(st, 2), ok = r[0] + r[1] >= need;
          SN.beat(st, { t: 'save', u: u.id, name: hh.name, type: hh.type, dice: r, need: need, ok: ok });
          SN.say(st, hh.name + ' is caught by it: [' + r.join(' + ') + '] = ' + (r[0] + r[1]) + ' against ' + need + (ok ? ': saved.' : hh.fated ? ': beaten back -- he is the Harbinger\'s.' : hh.harbinger ? ': the mirror takes him back to the moot ground.' : ': killed.'), 'roll', h);
          if (ok) return;
          if (hh.fated) SN.fallBack(st, u, 'back'); else if (hh.harbinger) SN.beatHarb(st, u); else { hh.dead = true; SN.lose(st, u, 0, hh); }
        });
      });
    });
    if (round === 1) {
      // missiles first (p.9): the crossbows' volley, nothing back
      o.concat(t).filter(function (a) { return a.volley && a.figs > 0; }).forEach(function (a) { attack(a, a.side === 'ours' ? t : o, true); });
    }
    o.forEach(function (a) { attack(a, t); });
    t.forEach(function (a) { attack(a, o); });
    kills.forEach(function (n, u) { SN.lose(st, u, n); });
    // post-melee morale (pp.15-16), side against side
    o = o.filter(function (u) { return SN.alive(u) && SN.same(u.at, h); }); t = t.filter(function (u) { return SN.alive(u) && SN.same(u.at, h); });
    if (!o.length || !t.length) return true;
    return SN.morale(st, o, t, before, h);
  };
  // casualties: off the figures first, the heroes last (p.30) -- a hero needs four hits at once from regular troops, a super-hero eight
  SN.lose = function (st, u, n, heroKilled) {
    var take = Math.min(u.figs, n); u.figs -= take; u.lost += take; n -= take;
    if (take) SN.beat(st, { t: 'cas', u: u.id, n: take, figs: u.figs });
    if (take) { var k = u.side === 'ours' ? 'lost' : 'killed'; st.stats[k][u.side + ':' + u.cls] = (st.stats[k][u.side + ':' + u.cls] || 0) + take; u.lostToday = true; }
    if (heroKilled) { st.stats[u.side === 'ours' ? 'lost' : 'killed'][u.side + ':' + heroKilled.type] = (st.stats[u.side === 'ours' ? 'lost' : 'killed'][u.side + ':' + heroKilled.type] || 0) + 1; }
    SN.heroesOf(u).forEach(function (hh) {
      var needHits = hh.type === 'superhero' ? 8 : 4;
      if (n >= needHits && !hh.fated && !hh.harbinger) { hh.dead = true; n -= needHits; SN.beat(st, { t: 'herofall', u: u.id, name: hh.name }); SN.say(st, hh.name + ' falls, the last of ' + u.name + '.', 'roll', u.at); st.stats[u.side === 'ours' ? 'lost' : 'killed'][u.side + ':' + hh.type] = (st.stats[u.side === 'ours' ? 'lost' : 'killed'][u.side + ':' + hh.type] || 0) + 1; }
    });
    if (heroKilled) SN.beat(st, { t: 'herofall', u: u.id, name: heroKilled.name });
    if (u.figs <= 0 && !SN.heroesOf(u).length && !u.party) { u.state = 'gone'; SN.beat(st, { t: 'gone', u: u.id }); SN.say(st, u.name + ' are destroyed.', 'roll', u.at); }
    else if (u.figs <= 0 && SN.heroesOf(u).some(function (x) { return x.fated; }) && n > 0 && u.figs0) SN.fallBack(st, u, 'back'); // (GreyFang's men gone: he is carried out of it -- his end is the Harbinger's)
  };
  // post-melee morale (pp.15-16): fewer casualties scores the difference times a die, more survivors the difference, each side adds its
  // survivors times its rating; under twenty figures a side everything doubles; the lower total reacts by the gap
  SN.morale = function (st, o, t, before, h) {
    function side(U) { var surv = 0, cas = 0, rate = 0, n = 0; U.forEach(function (u) { var f = SN.fightFigs(u), wf = SN.heroesOf(u).filter(SN.isWiz).length * 2; surv += f; cas += Math.max(0, before[u.id] - f); rate += SN.rating(u) * Math.max(1, f - wf) + SN.WIZARD.morale * wf; n += Math.max(1, f - wf) + wf; }); return { U: U, surv: surv, cas: cas, rate: n ? rate / n : 5, never: U.every(SN.nevers) }; } // (a wizard's figures at her own rating, p.33)
    var A = side(o), B = side(t), dA = SN.d6(st), dB = SN.d6(st);
    var sA = (A.cas < B.cas ? (B.cas - A.cas) * dA : 0) + (A.surv > B.surv ? A.surv - B.surv : 0) + A.surv * A.rate;
    var sB = (B.cas < A.cas ? (A.cas - B.cas) * dB : 0) + (B.surv > A.surv ? B.surv - A.surv : 0) + B.surv * B.rate;
    if (A.surv < 20 && B.surv < 20) { sA *= 2; sB *= 2; }
    sA = Math.round(sA); sB = Math.round(sB);
    var lo = sA < sB ? A : B, gap = Math.abs(sA - sB);
    st._mor = { at: h.slice(), sA: sA, sB: sB };
    SN.say(st, 'Morale: ours ' + sA + ', theirs ' + sB + ' (the gap ' + gap + ').', 'morale', h);
    var how = gap < 20 || lo.never ? 'continue' : gap >= 100 ? 'surrender' : gap >= 80 ? 'rout' : gap >= 60 ? 'retreat' : gap >= 40 ? 'back' : 'backoff';
    SN.beat(st, { t: 'mor', sA: sA, sB: sB, gap: gap, how: how, never: gap >= 20 && lo.never, lo: lo === A ? 'ours' : 'theirs', doubled: A.surv < 20 && B.surv < 20,
      parts: { ours: { surv: A.surv, cas: A.cas, rate: Math.round(A.rate * 10) / 10, die: dA, never: A.never }, theirs: { surv: B.surv, cas: B.cas, rate: Math.round(B.rate * 10) / 10, die: dB, never: B.never } } });
    if (how === 'continue') { if (gap >= 20) SN.say(st, 'They do not check morale; the melee goes on.', 'morale', h); return false; }
    var word = { surrender: 'surrender', rout: 'rout', retreat: 'retreat a move', back: 'fall back a move in good order', backoff: 'back off half a move in good order' }[how];
    lo.U.forEach(function (u) {
      if (SN.nevers(u)) return;
      if (how === 'surrender' && (u.cleric || u.berserk)) { SN.say(st, u.name + ' will not surrender (a religious order: p.19): they rout instead.', 'morale', h); SN.fallBack(st, u, 'rout'); return; }
      SN.say(st, u.name + ' ' + word + '.', 'morale', h);
      if (how === 'surrender') SN.surrender(st, u); else SN.fallBack(st, u, how);
    });
    return true;
  };
  SN.surrender = function (st, u) {
    var k = u.side + ':' + u.cls; st.stats.prisoners[k] = (st.stats.prisoners[k] || 0) + u.figs;
    SN.beat(st, { t: 'surrender', u: u.id });
    u.state = 'prisoner'; u.on = false;
  };
  // falling back: a hex away from the enemy, toward home; a rout two (a move and a half), and a routing unit routs the friends it runs into (p.16)
  SN.fallBack = function (st, u, how, depth) {
    if (!SN.alive(u)) return;
    var n = how === 'rout' ? 2 : 1;
    for (var i = 0; i < n; i++) {
      var opts = SN.nbrs(u.at).filter(function (x) { return SN.cost(x) < 99 && !SN.unitsAt(st, x).some(function (y) { return SN.hostile(u, y); }); });
      if (!opts.length) { if (how === 'rout') { SN.say(st, u.name + ' have nowhere to run and are cut down.', 'morale', u.at); SN.lose(st, u, u.figs); u.state = 'gone'; } return; }
      opts.sort(function (a, b) { return (SN.dist(a, u.home) - SN.dist(b, u.home)) - 0.5 * (SN.away(st, u, a) - SN.away(st, u, b)); });
      if (i === 0) SN.beat(st, { t: 'fall', u: u.id, how: how, from: u.at.slice() });
      u.at = opts[0].slice();
    }
    u.moved = true;
    if (how === 'rout' || how === 'retreat') { u.state = how; u.rally = 0; }
    if (how === 'rout' && (depth || 0) < 3) SN.unitsAt(st, u.at).filter(function (x) { return x !== u && x.side === u.side && x.state === 'ok' && !SN.nevers(x); }).forEach(function (x) {
      SN.say(st, u.name + ' run through ' + x.name + ', and they rout too.', 'morale', u.at); SN.fallBack(st, x, 'rout', (depth || 0) + 1);
    });
  };
  SN.away = function (st, u, h) { var d = 99; st.units.forEach(function (x) { if (SN.alive(x) && SN.hostile(u, x)) d = Math.min(d, SN.dist(x.at, h)); }); return d; };
  SN.beatHarb = function (st, H) { H.beaten = st.day + 2; H.at = SN.freeNear(st, SN.MOOT, H); H.moved = true; st.stats.beaten++; st.events.push({ kind: 'beaten' }); };

  // ---------------------------------------------------------------- the party's part: what the grid sends, and what comes back
  // a war-band from the units it meets: the road's glory-seekers fight (`snoot`, its map the road south) with the 8-bit's own list, sized from the
  // figures there (a hard fight for four at 8, the seat's lean RULED 10-14); against the Dominion the wagon yard's own (`wagon`: its soldiers)
  SN.band = function (st, foes, h) {
    var g = foes.filter(function (u) { return u.side === 'gnoll'; }), f = Math.min(8, g.reduce(function (s, u) { return s + u.figs; }, 0)), list = [];
    if (g.length) {
      var gs = Math.min(3, Math.max(1, Math.ceil(f / 2))), gn = Math.min(10, 3 + f), hy = Math.min(6, Math.max(1, f));
      for (var i = 0; i < gs; i++) list.push('gloryseeker'); for (i = 0; i < gn; i++) list.push('gnoll'); for (i = 0; i < hy; i++) list.push('hyena');
      return { kind: 'band', fight: 'snoot', at: h.slice(), enemies: list, foes: foes.map(function (u) { return u.id; }) };
    }
    var d = foes.filter(function (u) { return u.side === 'dominion'; }), n = Math.min(12, 6 * d.length);
    for (i = 0; i < n; i++) list.push('trooper');
    return { kind: 'band', fight: 'snoot', at: h.slice(), enemies: list, dominion: true, foes: foes.map(function (u) { return u.id; }) };
  };
  // the result on the hex: won, the band's units break -- they lose figures by the share of the band that fell and rout (the shock of four
  // super-heroes, p.30); the four ran, they fall back a hex and the enemy has won; the four fell, they are carried back to the Pit for a day
  SN.partyResult = function (st, P, foes, req, res, h) {
    var r = res && res.result || 'lost', share = res && res.share != null ? res.share : (r === 'won' ? 1 : 0.3);
    SN.beat(st, { t: 'grid', kind: req.kind, res: r, share: share, n: (req.enemies || []).length });
    if (req.kind === 'harbinger') {
      var H = foes.filter(function (u) { return u.harbinger; })[0];
      if (r === 'won' || r === 'yielded') { SN.say(st, 'The four put the Harbinger down -- and the mirror takes him back to the moot ground. He will come again.', 'party', h); if (H) SN.beatHarb(st, H); }
      else SN.partyBeaten(st, P, r, h);
      return;
    }
    if (r === 'won' || r === 'yielded' || r === 'fled') {
      SN.say(st, 'The four win their part of it on the grid (' + Math.round(share * 100) + '% of the band down).', 'party', h);
      foes.forEach(function (u) {
        if (!SN.alive(u) || !SN.same(u.at, h)) return;
        var n = Math.max(1, Math.ceil(u.figs * share / (SN.nevers(u) ? 1 : 2)));
        SN.lose(st, u, n);
        if (SN.alive(u) && !SN.nevers(u)) { SN.say(st, u.name + ' break before the four and rout.', 'morale', h); SN.fallBack(st, u, 'rout'); }
      });
      P.wonToday = true;
    } else SN.partyBeaten(st, P, r, h);
  };
  SN.partyBeaten = function (st, P, r, h) {
    if (r === 'escaped') { SN.say(st, 'The four get out of it and fall back a hex.', 'party', h); SN.fallBack(st, P, 'back'); }
    else { SN.say(st, 'The four go down on the grid. They are carried back to the Pit and are out of it till tomorrow.', 'party', h); P.at = SN.PIT.slice(); P.out = st.day + 1; P.moved = true; }
    SN.unitsAt(st, h).filter(function (u) { return u.side === 'gnoll'; }).forEach(function (w) { w.wonToday = true; SN.witness(st, w); });
  };
  // the four's sheets as the grid sent them back (HP, slots, uses: what is spent stays spent -- the 8-bit's own rule, js/embed.js apply)
  SN.partyBack = function (st, res) {
    if (!res || !res.party || !st.party8) return;
    res.party.forEach(function (r) {
      var hh = st.party8.party.filter(function (x) { return x.id === r.id; })[0]; if (!hh) return;
      hh.hp = Math.max(0, Math.min(hh.maxhp, r.hp)); hh.ko = hh.hp <= 0;
      if (r.slots && hh.slots) hh.slots = hh.slots.map(function (n, i) { return r.slots[i] == null ? n : Math.min(n, r.slots[i]); });
      if (r.feats && hh.feats) Object.keys(hh.feats).forEach(function (k) { if (typeof hh.feats[k] === 'number' && typeof r.feats[k] === 'number') hh.feats[k] = Math.min(hh.feats[k], r.feats[k]); });
    });
    if (st.party8.party.every(function (x) { return x.hp <= 0; })) st.party8.party.forEach(function (x) { x.hp = 1; x.ko = false; }); // (carried off and bound up: one HP each, the rest at the Pit)
  };
  // the bench's hand (the probe; and the fallback when the grid will not come up): the party's part on the tables, the four as eight-figure super-heroes --
  // 32 Armored Foot at +2 against the units' own figures on the Combat Table (RULED 10-15, his "the bench should read a complete gnoll slaughter, as
  // that's the result in the grid most times.. probably better to keep at 32 figures"): against a war-band it comes out a slaughter, as the grid does
  SN.standIn = function (st, req) {
    if (req.kind === 'greyfang') return { result: 'won', share: 1, stand: true };
    if (req.kind === 'harbinger') { var r = SN.dice(st, 2), s = r[0] + r[1]; SN.say(st, 'On the tables: the four against the Harbinger, ' + r.join('+') + '=' + s + ' against 8.', 'roll'); return { result: s > 8 ? 'won' : s === 8 ? 'escaped' : 'lost', share: s > 8 ? 1 : 0, stand: true }; }
    var foes = (req.foes || []).map(function (id) { return SN.unit(st, id); }).filter(function (u) { return u && SN.alive(u); }), figs = foes.reduce(function (s, u) { return s + (u.figs || 0); }, 0);
    var dcls = foes.length ? foes[0].def : 'HF', row = SN.CT.AF[dcls], need = Math.max(2, row[2] - 2), n = Math.ceil(32 / row[1]) * row[0], dice = SN.dice(st, n), k = dice.filter(function (x) { return x >= need; }).length; // (32 Armored Foot, +2 a die for the super-heroes, p.30, p.40)
    SN.say(st, 'On the tables: the four (32 Armored Foot, +2) roll ' + n + ' dice against ' + SN.CLASSNAME[dcls] + ', kill on ' + need + '+: ' + k + ' kills of ' + figs + ' figures.', 'roll');
    return { result: k * 2 >= figs ? 'won' : 'escaped', share: Math.min(1, k / Math.max(1, figs)), stand: true };
  };

  // ---------------------------------------------------------------- the day ends: rally, rest, the cleric, the Pit, home, the end
  SN.dusk = function (st) {
    st.shock = [];
    st.units.forEach(function (u) {
      if (!SN.alive(u)) return;
      if (u.state === 'retreat') { u.state = 'ok'; u.stand = st.day + 1; } // (a retreat stands a day while it rallies, p.16: no orders tomorrow)
      if (u.state === 'rout') { // (the rally table by turn of rout, p.16: the first rallies if not attacked, the second on 3-6, the third on a 6, the fourth is gone)
        u.rally = (u.rally || 0) + 1; var r = SN.d6(st);
        var ok = u.rally === 1 ? !u.fought : u.rally === 2 ? r >= 3 : u.rally === 3 ? r >= 6 : false;
        if (ok) { u.state = 'ok'; u.stand = st.day + 1; SN.say(st, u.name + ' rally' + (u.rally > 1 ? ' (' + r + ')' : '') + '.', 'morale', u.at); }
        else if (u.rally >= 4) { SN.say(st, u.name + ' never rally: they are gone from the field.', 'morale', u.at); SN.scatter(st, u); u.state = 'gone'; u.on = false; }
      }
      if (!u.fought && !u.moved && u.fatigued) { u.fatigued = false; }
      if (u.cleric && u.figs < u.figs0 && u.figs > 0) { u.figs++; SN.say(st, 'The cleric with ' + u.name + ' mends a figure (' + u.figs + ').', 'info', u.at); }
      if (u.state === 'withdraw' && SN.same(u.at, u.home)) { u.state = 'home'; SN.say(st, u.name + ' are home.', 'info', u.at); }
    });
    // the four rest at the Pit: a day held there with no fight is a long rest
    var P = SN.unit(st, 'party');
    if (P && SN.alive(P) && SN.same(P.at, SN.PIT) && !P.fought && st.party8 && st.party80) {
      var hurt = st.party8.party.some(function (x, i) { return x.hp < x.maxhp || JSON.stringify(x.slots) !== JSON.stringify(st.party80.party[i].slots); });
      st.party8.party.forEach(function (x, i) { var y = st.party80.party[i]; x.hp = x.maxhp; x.ko = false; x.slots = (y.slots || []).slice(); x.feats = JSON.parse(JSON.stringify(y.feats || {})); });
      if (hurt) SN.say(st, 'The four take a long rest in the Pit.', 'party', SN.PIT);
    }
    // after the head, every snooting unit is going home whatever the day did to it (a rout rallies into the road home, not back into the fight)
    if (st.head) st.units.forEach(function (u) { if (u.side === 'gnoll' && SN.alive(u) && !u.watch && !u.harbinger && u.state !== 'withdraw') u.state = 'withdraw'; });
    var inPit = SN.unitsAt(st, SN.PIT);
    if (!st.pitFell && inPit.some(function (u) { return u.side !== 'ours'; }) && !inPit.some(function (u) { return u.side === 'ours'; })) { st.pitFell = st.day; SN.say(st, 'The Pit falls: there is no one of ours in it.', 'head', SN.PIT); }
    // the end: the head taken and the Dominion gone; or nothing of ours left; or the season
    var dom = st.units.filter(function (u) { return u.side === 'dominion' && SN.alive(u); });
    var oursLeft = st.units.some(function (u) { return u.side === 'ours' && SN.alive(u) && !u.party; }) || !!SN.party(st);
    if ((st.head && st.domIn && !dom.length) || !oursLeft || st.day >= SN.LAST) { st.over = true; st.tally = SN.tallyOf(st); SN.say(st, 'The battle is over.', 'end'); }
    else st.day++;
  };
  SN.placeName = function (h) {
    var p = SN.PLACES.filter(function (x) { return SN.same(x.at, h); })[0]; if (p) return p.name;
    var t = SN.TERRAIN[SN.ter(h[0], h[1])]; return (t ? t.name : 'the field') + ' (' + h[0] + ',' + h[1] + ')';
  };
  SN.label = function (u) { return u.party ? 'the four' : u.name + ' (' + (u.figs || 0) + (SN.heroesOf(u).length ? '+' + SN.heroesOf(u).map(function (x) { return x.name.replace(/^a /, ''); }).join(', ') : '') + ')'; };
  SN.heroName = function (u) { var hs = SN.heroesOf(u).filter(function (h) { return h.type === 'superhero' || h.type === 'wraith'; }); return u.party ? 'the four' : hs.length ? hs[0].name : u.name; };

  // ---------------------------------------------------------------- the move's preview (his question 10-14 night: "is 'if moving here is likely to make combat
  // pop-up info a player would want to know'" -- the seat's yes, built with the show as a lean): where a march would meet an enemy if the enemy
  // holds (their orders are secret), and the tables' numbers both ways; or who stands next to where it ends and might charge it
  var S2 = {}; (function () { for (var a = 1; a <= 6; a++) for (var b = 1; b <= 6; b++) S2[a + b] = (S2[a + b] || 0) + 1; })();
  SN.p2d6 = function (n) { var c = 0; for (var s = n; s <= 12; s++) c += S2[s] || 0; return c / 36; }; // (two dice scoring n or more)
  SN.odds = function (st, a, d, at, charging) {
    var cls = a.fatigued ? SN.LOWER[a.cls] : a.cls, dcls = d.fatigued ? SN.LOWER[d.def] : d.def, ter = SN.TERRAIN[SN.ter(at[0], at[1])];
    if ({ LH: 1, MH: 1, HH: 1 }[dcls] && !charging.d) dcls = SN.LOWER[dcls];
    var row = SN.CT[cls][dcls], f = SN.fightFigs(a), imp = charging.a && cls !== 'LF' && !ter.hill && !ter.rough;
    var n = Math.ceil(f / row[1]) * row[0] + (imp ? Math.ceil(f / row[1]) : 0), need = Math.max(2, row[2] - SN.bonus(a));
    return { cls: cls, dcls: dcls, n: n, need: need, imp: imp, hill: !!ter.hill || !!ter.rough, kills: Math.round(n * Math.max(0, 7 - need) / 6 * 10) / 10, f: f };
  };
  SN.preview = function (st, u, to) {
    if (!u || !SN.on(to)) return null;
    var p = SN.path(u.at, to); if (!p) return null;
    var day = SN.reach(u, p), hit = null, i;
    for (i = 0; i < day.length; i++) { var foes = SN.unitsAt(st, day[i]).filter(function (x) { return SN.hostile(u, x); }); if (foes.length) { hit = { at: day[i], foes: foes }; break; } }
    var end = hit ? hit.at : day[day.length - 1] || u.at, out = { at: end, place: SN.placeName(end), hit: !!hit, lines: [], warn: [] };
    if (!hit) {
      var near = []; SN.nbrs(end).forEach(function (h) { SN.unitsAt(st, h).forEach(function (x) { if (SN.hostile(u, x) && x.state === 'ok') near.push(x); }); });
      if (!near.length) return null;
      out.lines.push('No fight on the way, if they hold. Next to where you stop: ' + near.map(SN.label).join(', ') + ' -- they may charge you.');
      near.slice(0, 2).forEach(function (x) { if (u.party) return; var o = SN.odds(st, x, u, end, { a: true, d: false }); out.lines.push(x.name + ' charging you: ' + o.n + ' dice, kill on ' + o.need + '+ -- about ' + o.kills + ' a round' + (o.imp ? ' (their charge die)' : '') + '.'); });
      return out;
    }
    var foes2 = hit.foes, H = foes2.filter(function (x) { return x.harbinger; })[0];
    out.lines.push('If they hold, you meet ' + foes2.map(SN.label).join(', ') + ' at ' + out.place + (!SN.same(hit.at, day[day.length - 1]) ? ' (your march stops there)' : '') + '.');
    var holds = u.party || SN.heroesOf(u).some(function (hh) { return hh.type === 'hero' || hh.type === 'superhero'; });
    if (H && st.huntDay != null && !H.beaten && !holds) out.warn.push('The Harbinger walks through you: only a paladin, GreyFang or the four can hold him.');
    if (u.party) {
      var b = H ? null : SN.band(st, foes2, hit.at);
      out.lines.push('The four\'s fight goes to the grid (DEEP16): ' + (H ? 'the Harbinger himself.' : 'a war-band of ' + b.enemies.length + (b.dominion ? ' soldiers' : ' (glory-seekers, gnolls, hyenas)') + '. Win it and they break; LEAVE THE FIGHT and you fall back a hex.'));
    } else {
      var tg = foes2.slice().sort(function (x, y) { return SN.fightFigs(y) - SN.fightFigs(x); })[0], me = SN.odds(st, u, tg, hit.at, { a: true, d: false });
      out.lines.push('You: ' + me.f + ' ' + me.cls + ' against their ' + me.dcls + ' -- ' + me.n + ' dice, kill on ' + me.need + '+, about ' + me.kills + ' kills a round' + (me.imp ? ' (with your charge die)' : me.hill ? ' (no charge die up here)' : '') + '.');
      var back = 0, bn = 0; foes2.forEach(function (x) { var o = SN.odds(st, x, u, hit.at, { a: false, d: true }); back += o.kills; bn += o.n; });
      out.lines.push('Them: ' + bn + ' dice back -- about ' + Math.round(back * 10) / 10 + ' kills a round. You have ' + SN.fightFigs(u) + ' to lose.');
      var rt = foes2.reduce(function (s, x) { return s + SN.rating(x); }, 0) / foes2.length;
      out.lines.push('Morale: yours ' + SN.rating(u) + (SN.nevers(u) ? ' (never checks)' : '') + ', theirs ' + Math.round(rt * 10) / 10 + (foes2.every(SN.nevers) ? ' (they never check)' : '') + '.');
    }
    if (SN.heroesOf(u).some(function (hh) { return hh.type === 'superhero'; }) || u.party) {
      var chk = foes2.filter(function (x) { return !SN.nevers(x); });
      if (chk.length) { var need = SN.UNSTABLE[chk[0].def][1]; out.lines.push((u.party ? 'The four\'s' : 'Your super-hero\'s') + ' charge makes them check first: they need ' + need + ' on two dice -- about ' + Math.round((1 - SN.p2d6(need)) * 100) + '% shy and fall back without a fight.'); }
    }
    var wit = st.units.filter(function (x) { return x.side === 'gnoll' && SN.alive(x) && x.state === 'ok' && !x.watch && x.figs >= 2 && SN.dist(x.at, hit.at) <= 2 && foes2.indexOf(x) < 0; });
    if (foes2.some(function (x) { return x.side === 'gnoll'; }) && wit.length) out.warn.push('If the gnolls win, the witness fills them from ' + wit.map(function (x) { return x.name + ' (' + x.figs + ')'; }).join(', ') + ' -- within two hexes.');
    out.lines.push('Their orders are secret: they may move, or others may charge in.');
    return out;
  };

  // ---------------------------------------------------------------- the tally (CHAINMAIL's points, p.27; RULED 10-14, lean 4)
  SN.tallyOf = function (st) {
    function pts(map, side) { var s = 0; Object.keys(map).forEach(function (k) { var p = k.split(':'); if (p[0] === side) s += (SN.POINTS[p[1]] != null ? SN.POINTS[p[1]] : 2) * map[k]; }); return s; }
    var gk = 0, gp = 0, dk = 0, dp = 0;
    Object.keys(st.stats.killed).forEach(function (k) { var n = st.stats.killed[k], p = k.split(':'); if (p[0] === 'gnoll') gk += n * (p[1] === 'AF' ? 2.5 : SN.POINTS[p[1]] || 2); else dk += n * (SN.POINTS[p[1]] || 2); });
    Object.keys(st.stats.prisoners).forEach(function (k) { var n = st.stats.prisoners[k], p = k.split(':'); if (p[0] === 'gnoll') gp += n * 2.5; else if (p[0] === 'dominion') dp += n * 2; });
    var lost = pts(st.stats.lost, 'ours') + (st.head ? SN.POINTS.superhero : 0); // (GreyFang, when the head is taken: he does not make it -- RULED 10-08)
    var score = Math.round(gk + gp + dk + dp - lost);
    return { gnollKilled: gk, gnollPrisoners: gp, dominionKilled: dk, dominionPrisoners: dp, oursLost: lost, score: score,
      pitHeld: !st.pitFell, head: st.head, witnessed: !!(st.head && st.head.witnessed), day: st.day, witness: st.stats.witness, beaten: st.stats.beaten };
  };
})();
