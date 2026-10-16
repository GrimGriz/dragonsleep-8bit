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
        if (SN.road(n)) c -= 0.001; // (of two ways as good, the road: where a column gains its hex)
        if (avoid && avoid(n) && !SN.same(n, b)) c += 6; // (a hex to go round if it can: the party's guard, for a band that wants glory not grief)
        var nk = SN.key(n), d = cur[0] + c;
        if (best[nk] == null || d < best[nk]) { best[nk] = d; prev[nk] = h; open.push([d, n]); }
      });
    }
    if (best[SN.key(b)] == null) return null;
    var out = [], at = b; while (!SN.same(at, a)) { out.unshift(at); at = prev[SN.key(at)]; }
    return out;
  };
  // how far a path gets in a day: the hexes it reaches (a unit can always take its first step, whatever the ground -- Book III's day). Horse and
  // wagons in column march further while they keep to the road: CHAINMAIL p.10's road bonus, heavy horse +3", medium and light horse +6", wagons
  // +6" -- a hex for every 3", as the foot's 9" is its 3 hexes; foot get none (RULED 10-15, his "1 book"; the column, the march formation, the seat's)
  SN.ROADBONUS = { HH: 1, MH: 2, LH: 2 };
  SN.roadBonus = function (u) { return u.form !== 'column' ? 0 : u.wagon && !u.groups ? 2 : Math.min.apply(null, SN.parts(u).map(function (g) { return g.mounted ? (SN.ROADBONUS[g.cls] || 0) : 0; })); }; // (a mixed unit: its slowest type's; foot none)
  SN.reach = function (u, path) {
    var col = SN.roadBonus(u), left = SN.moveOf(u) + col, road = true, out = [];
    for (var i = 0; i < (path || []).length; i++) {
      road = road && SN.road(path[i]);
      var c = SN.cost(path[i]), cap = left - (road ? 0 : col);
      if (c > cap && i > 0) break; left -= c; out.push(path[i]); if (left - (road ? 0 : col) <= 0) break;
    }
    return out;
  };
  SN.moveOf = function (u) {
    var m = Math.max(1, (u.move || Math.min.apply(null, SN.parts(u).map(function (g) { return SN.MOVE[g.cls] || 3; }))) - (u.fatigued ? 1 : 0)); // (a mixed unit at its slowest type's pace)
    if (u.form === 'square') m = 1; // (a square holds its ground: a hex a day)
    if (u.reformed) m = Math.max(1, Math.floor(m / 2)); // (a formation changed today: half the day's move -- RULED 10-15)
    return m;
  };

  // ---------------------------------------------------------------- the units
  SN.alive = function (u) { return u.on && (u.state === 'ok' || u.state === 'retreat' || u.state === 'rout' || u.state === 'withdraw'); };
  SN.heroesOf = function (u) { return (u.heroes || []).filter(function (h) { return !h.dead; }); };
  SN.hostile = function (a, b) { return a.side !== b.side && (a.side === 'ours' || b.side === 'ours'); }; // (the gnolls and the Dominion do not fight each other: the Dominion lit this)
  SN.unitsAt = function (st, h) { return st.units.filter(function (u) { return SN.alive(u) && SN.same(u.at, h); }); };
  SN.unit = function (st, id) { return st.units.filter(function (u) { return u.id === id; })[0]; };
  SN.isWiz = function (h) { return h.type === 'wizard'; };
  SN.casts = function (h) { return h.type === 'wizard' || !!h.missile; }; // (who throws a missile: every wizard, and a hero who carries one -- Book I p.17 keys an 8th-level magic-user, the Warlock, to fight as a Hero; his missile is still the Warlock's, p.31)
  SN.nevers = function (u) { var hs = SN.heroesOf(u); return !!(u.party || u.berserk || u.watch || u.harbinger || (!u.figs && hs.length && !hs.every(SN.isWiz))); }; // (a wizard alone checks, at her own rating: p.33) // (never check morale: the heroes (p.30), berserkers (p.20), the death-watch "unto death", the Harbinger's pack)
  SN.rating = function (u) {
    var base = u.morale || SN.MORALE[u.def] || 5;
    if (u.groups && u.figs > 0) base = Math.round(u.groups.reduce(function (s, g) { return s + g.n * (g.morale || SN.MORALE[g.def] || 5); }, 0) / u.figs * 10) / 10; // (by type, p.15)
    return base + (u.cleric ? 1 : 0) + (u.blessed ? 1 : 0) - (u.fatigued ? 1 : 0); // (blessed: a matriarch's Bless today, SN.pray -- Book I, "raises morale by +1")
  };
  SN.greyfang = function (st) { var u = SN.unit(st, 'greyfang'); return u && SN.alive(u) && SN.heroesOf(u).some(function (h) { return h.fated; }) ? u : null; };
  SN.harb = function (st) { var u = SN.unit(st, 'harb'); return u && SN.alive(u) && !st.head ? u : null; };
  SN.party = function (st) { var u = SN.unit(st, 'party'); return u && SN.alive(u) && !u.out ? u : null; };
  // the figures a unit counts in a fight: its own, and its fantastic figures at what they fight as (a hero four, a super-hero eight, a wraith
  // or a warlock two: p.30, p.33, p.43) -- the party is never in this count but on the bench's stand-in
  // ---------------------------------------------------------------- one man a figure, and the mixed units (RULED 10-15, his "1 let's try it out", "2 try that
  // too"): a unit's figs are its men (Book III p.25's basic system), so Book I's Fighting Capability reads straight -- a Hero four men, a Super-hero eight.
  // A unit of one type keeps cls/def/figs; a MIXED one carries u.groups ({ cls, def, n, n0, volley, mounted, name }), each group its own row on the
  // Combat Table, morale "separating them by type" (p.15); its cls/def are its biggest group's, its figs their sum
  SN.parts = function (u) { return u.groups && u.groups.length ? u.groups : [{ cls: u.cls, def: u.def, n: u.figs || 0, n0: u.figs0 || 0, volley: !!u.volley, mounted: !!u.mounted, morale: u.morale, name: u.name }]; };
  SN.sync = function (u) {
    if (!u.groups) return;
    u.figs = u.groups.reduce(function (s, g) { return s + g.n; }, 0);
    var big = u.groups.slice().sort(function (a, b) { return b.n - a.n || b.n0 - a.n0; })[0]; if (big) { u.cls = big.cls; u.def = big.def; }
    u.volley = u.groups.some(function (g) { return g.volley && g.n > 0; }); u.mounted = u.groups.every(function (g) { return g.mounted; });
  };
  // n men off a unit, the biggest group giving first (the owner's to choose, p.14: read as keeping the unit's shape); the tally by type
  SN.take = function (st, u, n, kind) {
    var k = kind || (u.side === 'ours' ? 'lost' : 'killed'), got = 0, add = function (cls, m) { st.stats[k][u.side + ':' + cls] = (st.stats[k][u.side + ':' + cls] || 0) + m; };
    if (!u.groups) { got = Math.max(0, Math.min(u.figs, n)); u.figs -= got; if (got) add(u.cls, got); return got; }
    while (got < n) { var g = u.groups.filter(function (x) { return x.n > 0; }).sort(function (a, b) { return b.n - a.n; })[0]; if (!g) break; g.n--; got++; add(g.cls, 1); }
    SN.sync(u); return got;
  };
  SN.addMen = function (u, n) { if (!u.groups) { u.figs += n; return; } var g = u.groups.filter(function (x) { return x.n < x.n0; })[0] || u.groups[0]; g.n += n; SN.sync(u); };
  SN.fightFigs = function (u) { return u.figs + SN.heroesOf(u).reduce(function (s, h) { return s + ({ hero: 4, superhero: 8, wraith: 2, wizard: 2 }[h.type] || 0); }, 0); };
  // ---------------------------------------------------------------- formation and facing (CHAINMAIL p.10, p.16; RULED 10-15, his "3 - Formations" and
  // "4 - Round 1 have the player set the formation before play without cost, change formation half-day")
  // A unit stands in LINE, COLUMN or SQUARE (foot only) and faces one of its hex's six sides; an attacker strikes the side it came in through. A
  // line's front is the facing side and the two beside it, its flanks the next two, its rear the side behind; a column's front is the facing side
  // alone, four flanks and the rear; a square is all front. From a flank the attacker is "at the next higher class, i.e., Heavy Foot equals Armored
  // Foot and Heavy Horse equals +1 on each die"; from the rear the same, and it deals "casualties without receiving any in return" -- here, the first
  // round's (p.16). A unit "caught in melee during formation change" is flanked (p.10). Set free before Day 14's first orders (and on a unit's
  // arrival day); a change after costs half the day's move; a unit that marches faces the way it goes, and turning in place is free.
  SN.FORMS = { line: ['front', 'front', 'flank', 'rear', 'flank', 'front'], column: ['front', 'flank', 'flank', 'rear', 'flank', 'flank'], square: ['front', 'front', 'front', 'front', 'front', 'front'] };
  SN.HIGHER = { LF: 'HF', HF: 'AF', LH: 'MH', MH: 'HH' }; // (Armored Foot and Heavy Horse: +1 a die instead)
  SN.foot = function (u) { return !u.mounted && SN.parts(u).every(function (g) { return !g.mounted && !!{ LF: 1, HF: 1, AF: 1 }[g.cls]; }); };
  SN.formFree = function (st, u) { return st.day === SN.DAY0 || u.arrivedOn === st.day; };
  SN.setForm = function (st, u, form, face) {
    if (form && !SN.FORMS[form]) return false;
    if (form === 'square' && !SN.foot(u)) return false;
    if (face != null) u.face = ((face % 6) + 6) % 6;
    if (form) { u.form = form; u.reformed = !SN.formFree(st, u) && u.form !== u.formDawn; } // (changing back to the dawn's formation costs nothing)
    if (u.order && u.order.type === 'move' && u.order.to) { var p = SN.path(u.at, u.order.to); if (p && p.length) u.order = { type: 'move', to: u.order.to.slice(), path: SN.reach(u, p), full: p }; }
    return true;
  };
  // the side of d that a strikes in hex h: the side a came in through, against d's facing and formation ('front', 'flank', 'rear')
  SN.aspect = function (st, a, d, h) {
    if (d.party || !SN.FORMS[d.form]) return 'front';
    var s = a.came ? SN.dirTo(h, a.came) : -1, asp = s >= 0 ? SN.FORMS[d.form][(s - (d.face || 0) + 6) % 6] : 'front';
    if (asp === 'front' && d.reformed) asp = 'flank';
    return asp;
  };
  SN.bonus = function (u) { var hs = SN.heroesOf(u), b = 0; if (hs.some(function (h) { return h.type === 'superhero'; })) b = 2; else if (hs.some(function (h) { return h.type === 'hero'; })) b = 1; return b + (u.berserk ? 2 : 0) + (u.blessed ? 1 : 0); }; // (blessed: Book I's Bless, "+1 to attack dice") // (only a hero adds to his unit's dice, a super-hero twice, p.30; a wizard or a wraith works on morale) // (a hero adds 1 to the unit's dice, a super-hero 2 (p.30: doubled); berserkers +2, p.20)

  SN.newGame = function (seed) {
    var st = { v: 1, seed: seed >>> 0, rs: seed >>> 0, day: SN.DAY0, units: [], log: [], head: null, huntDay: null, domDay: null, pitFell: false, over: false,
      tally: null, gone: {}, events: [], orders: {}, rec: [], stats: { killed: {}, lost: {}, prisoners: {}, beaten: 0, witness: 0 } };
    SN.FORCES.forEach(function (f) { st.units.push(SN.make(f, !f.arrive)); });
    SN.say(st, 'Day ' + st.day + '. The four come down the road to Tarlyn\'s Pit two days after the giants. The Snoot burns in the hills.', 'day');
    return st;
  };
  SN.make = function (f, on) {
    var u = JSON.parse(JSON.stringify(f));
    if (u.groups) { u.groups.forEach(function (g) { g.n0 = g.n; }); SN.sync(u); }
    u.figs0 = u.figs; u.on = !!on; u.state = 'ok'; u.at = (u.at || SN.WEST).slice(); u.home = u.at.slice(); u.lost = 0; u.rounds = 0; u.order = { type: 'hold' };
    (u.heroes || []).forEach(function (h) { h.dead = false; });
    if (u.tribe === 'skull') u.home = [7, 1]; else if (u.tribe === 'gray' || u.harbinger) u.home = SN.MOOT.slice(); else if (u.tribe === 'wall') u.home = [0, 1];
    if (u.side === 'dominion') u.home = SN.WEST.slice();
    // the formation each unit takes the field in: the death-watch in square round the Mane, the Dominion and Newland's battalions on the march in
    // column, the rest in line; ours face the hills (NW), the gnolls the road and the Pit (SE), the plains the hills (W), the Dominion east
    if (!u.form) u.form = u.watch ? 'square' : (u.side === 'dominion' || (u.arrive && u.kind === 'Newland')) ? 'column' : 'line';
    if (u.face == null) u.face = u.side === 'ours' ? (u.kind === 'the plains' ? 3 : 2) : u.side === 'gnoll' ? 5 : 0;
    if (u.side === 'ours') u.home = u.kind === 'the plains' ? u.at.slice() : SN.PIT.slice(); // (the plains tribes go back to the Verge)
    return u;
  };
  SN.say = function (st, text, kind, at) { st.log.push({ day: st.day, text: text, kind: kind || 'info', at: at || null }); };
  // the show's beats (RULED 10-14 night, "the resolution should be a show"): what happened in a fight, in the order it happened, with its
  // dice -- the log is for reading, the beats for js/show.js to stage. A unit as it stood when its fight began: SN.snap
  SN.beat = function (st, d) { d.day = st.day; (st.beats = st.beats || []).push(d); };
  SN.snap = function (u, h) { return { id: u.id, name: u.name, side: u.side, party: !!u.party, figs: u.figs || 0, cls: u.cls, sheets: (u.sheets || []).slice(), heroes: SN.heroesOf(u).map(function (x) { return { name: x.name, type: x.type }; }), harbinger: !!u.harbinger,
    from: h && u.came ? SN.dirTo(h, u.came) : -1, face: u.face || 0, form: u.form || 'line', mounted: !!u.mounted }; }; // (from: the side it came in through, -1 if it stood there)

  // ---------------------------------------------------------------- the day begins: arrivals, the hunt, the Dominion, the AI's orders
  SN.dawn = function (st) {
    st.events = [];
    st.units.forEach(function (u) {
      if (!u.on && u.arrive && u.arrive <= st.day && !u.arrived) { u.arrived = true; u.on = true; u.arrivedOn = st.day; u.at = SN.freeNear(st, u.at, u); SN.say(st, u.name + ' arrive' + (u.kind === 'the plains' ? ' off the Verge' : ' up the south road') + '.', 'arrive', u.at); st.events.push({ kind: 'arrive', id: u.id }); }
      u.rounds = 0; u.moved = false; u.charged = false; u.berserkOrder = false; u.held = false; u.fought = false; u.lostToday = false; u.wonToday = false; u.drawn = false;
      u.came = null; u.reformed = false; u.formDawn = u.form; u.blessed = false; u.entangled = false; // (the matriarchs' prayers last the day: SN.pray)
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

  // COMBINE (RULED 10-15, his "5 - let's try that out"): two of ours in one hex become one mixed unit -- the smaller joins the bigger (GreyFang's always
  // keeps him: he is the Snoot's quarry), its men by type, its heroes with it; no splitting back. The day's order is the bigger's, and the joining
  // counts as a formation changed (half the day's move after Day 14, flanked if caught)
  SN.canCombine = function (st, a, b) { return !!a && !!b && a !== b && SN.canOrder(st, a) && SN.canOrder(st, b) && !a.party && !b.party && SN.same(a.at, b.at); };
  // the men of sm poured into big by type (one group a class, armour, missile, horse and morale); full: their starting strength comes too (COMBINE),
  // else only the men who come (a rout's: SN.breakUp)
  SN.pour = function (big, sm, full) {
    var gs = SN.parts(big).map(function (g) { return Object.assign({}, g, { name: g.name || big.name }); });
    SN.parts(sm).forEach(function (g) {
      if (!full && !g.n) return;
      var n0 = full ? g.n0 : g.n, same = gs.filter(function (x) { return x.cls === g.cls && x.def === g.def && !!x.volley === !!g.volley && !!x.mounted === !!g.mounted && (x.morale || 0) === (g.morale || 0); })[0];
      if (same) { same.n += g.n; same.n0 += n0; } else gs.push(Object.assign({}, g, { n0: n0, name: g.name || sm.name }));
    });
    big.groups = gs; big.figs0 = gs.reduce(function (s, g) { return s + g.n0; }, 0); SN.sync(big);
    big.sheets = (big.sheets || []).concat((sm.sheets || []).filter(function (s) { return (big.sheets || []).indexOf(s) < 0; }));
  };
  SN.combine = function (st, a, b) {
    if (!SN.canCombine(st, a, b)) return null;
    var fated = function (u) { return SN.heroesOf(u).some(function (x) { return x.fated; }); };
    var big = fated(a) ? a : fated(b) ? b : SN.fightFigs(a) >= SN.fightFigs(b) ? a : b, sm = big === a ? b : a;
    SN.pour(big, sm, true); big.heroes = (big.heroes || []).concat(sm.heroes || []);
    big.cleric = big.cleric || sm.cleric; big.wagon = big.wagon || sm.wagon; big.lost = (big.lost || 0) + (sm.lost || 0);
    var was = big.name; big.name = was + ' with ' + sm.name.replace(/^(the|a) /i, '');
    sm.on = false; sm.state = 'merged'; sm.mergedInto = big.id; sm.figs = 0;
    if (!SN.formFree(st, big)) big.reformed = true;
    SN.setForm(st, big, null); // (its march re-reckoned at the new pace)
    SN.say(st, sm.name + ' join ' + was + ': one unit of ' + big.figs + ' men.', 'info', big.at);
    return big;
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
        steps.push({ id: u.id, from: u.at.slice(), to: e.to.slice(), t: e.t }); SN.stepTo(u, e.to); u.moved = true; return;
      }
      if (foes.length && foes.every(hunting) && !holds(u)) { u.halted = true; SN.say(st, u.name + ' cannot close with the Harbinger.', 'move', e.to); return; }
      steps.push({ id: u.id, from: u.at.slice(), to: e.to.slice(), t: e.t });
      SN.stepTo(u, e.to); u.moved = true;
      if (foes.length) {
        u.halted = true; u.charged = true;
        foes.forEach(function (f) { f.halted = true; });
        if (SN.heroesOf(u).some(function (h) { return h.type === 'superhero' || h.type === 'wraith' || h.type === 'wizard'; })) st.shock = (st.shock || []).concat([{ at: e.to.slice(), by: u.id }]);
      }
    });
    return steps;
  };
  SN.stepTo = function (u, to) { var d = SN.dirTo(u.at, to); if (d >= 0) u.face = d; u.came = u.at.slice(); u.at = to.slice(); }; // (a marching unit faces the way it goes)
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
        SN.stepTo(u, h); u.drawn = true; u.moved = true;
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
    SN.beat(st, { t: 'head', at: G.at.slice(), around: around, how: how, g: SN.snap(G, G.at), h: SN.snap(H, G.at) });
    st.stats.lostHeads = 1;
    SN.say(st, around ? 'The Harbinger takes GreyFang\'s head in front of the four. "The Mane is mine."' : 'No one is there to stop it. The Harbinger takes GreyFang\'s head. "The Mane is mine."', 'head', G.at);
    st.events.push({ kind: 'head', around: around });
    // then: the Harbinger back to where the Snoot started, and every snooting unit goes home (his rule)
    H.at = SN.freeNear(st, SN.MOOT, H); H.came = null; H.state = 'home'; H.on = true; H.home = SN.MOOT.slice();
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

  // holding ground (his word 10-15: "are we giving a defense bonus for people in the pit or at the halfway inn or snoot grounds (gnolls) - i think we
  // should at least a little"): a unit that stood its ground -- it did not march in that day -- in Tarlyn's Pit or at the Halfway Inn, or a gnoll on
  // the tribes' seats, against foes who came at it. CHAINMAIL has no mass-melee rule for a wall (its sieges are man to man, pp.22-24), so the seat's
  // reading takes what the book gives: no charge die at them -- the impetus is only "across smooth, level terrain" (p.17; on the seats, hills, it
  // never was); walls and stakes are soft cover, the volleys at them halved, "drop all fractions" (p.12); and they stand a step firmer, +1 on their
  // morale rating (the book's own scale, p.15: heavy foot 5, elite heavy foot 6). The four's fights are the grid's, and the grid has its own ground
  SN.holdsGround = function (u, h) { var t = SN.TERRAIN[SN.ter(h[0], h[1])] || {}; return !u.came && !u.party && (t.walls || (t.seat && u.side === 'gnoll')) ? t.name : ''; };
  SN.walls = function (st, h, O, T) {
    var ids = {}, n = 0;
    [[O, T], [T, O]].forEach(function (p) { if (!p[1].some(function (x) { return !!x.came; })) return; p[0].forEach(function (u) { if (SN.holdsGround(u, h)) { ids[u.id] = true; n++; } }); });
    return n ? { at: h.slice(), ids: ids } : null;
  };
  SN.holding = function (st, u, h) { return !!(st.walls && SN.same(st.walls.at, h) && st.walls.ids[u.id]); };

  // ---------------------------------------------------------------- a contested hex: the shock, the grid for the party, then the tables
  SN.fightHex = function* (st, h) {
    var here = function () { return SN.unitsAt(st, h); };
    var ours = function () { return here().filter(function (u) { return u.side === 'ours'; }); }, theirs = function () { return here().filter(function (u) { return u.side !== 'ours'; }); };
    if (!ours().length || !theirs().length) return;
    var name = SN.placeName(h);
    SN.say(st, 'A fight at ' + name + ': ' + ours().map(SN.label).join(', ') + ' against ' + theirs().map(SN.label).join(', ') + '.', 'fight', h);
    SN.beat(st, { t: 'fight', at: h.slice(), place: name, ter: SN.ter(h[0], h[1]), road: SN.road(h), ours: ours().map(function (u) { return SN.snap(u, h); }), theirs: theirs().map(function (u) { return SN.snap(u, h); }) });
    SN.surprise(st, h, ours(), theirs());
    SN.evasion(st, h, ours(), theirs());
    if (!ours().length || !theirs().length) return; // (it slipped away: no fight, and no one won one)
    here().forEach(function (u) { u.fought = true; });
    st.walls = SN.walls(st, h, ours(), theirs());
    if (st.walls) {
      var hw = here().filter(function (u) { return st.walls.ids[u.id]; });
      SN.beat(st, { t: 'walls', units: hw.map(function (u) { return u.id; }), names: hw.map(function (u) { return u.name; }), place: SN.TERRAIN[SN.ter(h[0], h[1])].name });
      SN.say(st, hw.map(function (u) { return u.name; }).join(' and ') + ' hold ' + SN.TERRAIN[SN.ter(h[0], h[1])].name + ': no charge die against them, the volleys at them halved (cover, p.12), +1 on their morale.', 'info', h);
    }
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
    // the matriarchs' prayers, before the grid or the tables (Insect Plague may leave the four alone with the death-watch)
    SN.pray(st, h, ours(), theirs());
    if (!ours().length || !theirs().length) return SN.after(st, h, null);
    // the party: the grid
    var P = ours().filter(function (u) { return u.party && !u.out; })[0];
    if (P) {
      var foes = theirs(), H = foes.filter(function (u) { return u.harbinger; })[0], req;
      if (H) req = { kind: 'harbinger', fight: 'harbinger', at: h.slice(), foes: [H.id] };
      else req = SN.band(st, foes, h);
      req.allies = SN.allies(st, h);
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
  // the matriarchs' prayers (10-16, Griz: "let's give one group a superhero matriarch and the other hero, with clerics with the gray young ones. Give
  // the superhero entangle? There's good cleric stuff high level that didn't exist in chainmail I think"; then "all 8 leans are go"). CHAINMAIL has no
  // clerics; these are OD&D Book I's at a day's scale, each once a day by each who prays it, and only where a relic is (SN.relicHere):
  // - Bless (Book I, 2nd: "During any turn the prospective recipients of a Bless spell are not in combat the Cleric may give them this benison. A
  //   blessing raises morale by +1 and also adds +1 to attack dice"): the Lama, her own unit, as its fight begins -- +1 to its dice and morale today
  // - Insect Plague (Book I, 5th: "drive creatures with less than three hit dice off in rout", range 48"): the Eldest, from the moot ground, into a
  //   fight on it or next to it -- the biggest unit of men there routs (no morale check: berserkers go too); the heroes in it stand (SN.breakUp)
  // - Entangle (his word; the SRD 5.1's, not Book I's -- Rhollor's, the god under the ground): the Eldest, in a fight on the moot -- the biggest unit
  //   of ours still there is held where it stands for the day: no charge die, struck as from the flank (restrained: attacked at advantage), no
  //   falling back till nightfall lets it go
  SN.PRAYER = { bless: 'BLESS', insectplague: 'INSECT PLAGUE', entangle: 'ENTANGLE' };
  SN.relicHere = function (u) { return !!u.relic || SN.same(u.at, SN.MOOT); }; // (the Mane on the moot ground; a minor relic of the tribe carried)
  SN.prays = function (st, u, id) { return SN.heroesOf(u).filter(function (x) { return (x.prays || []).indexOf(id) >= 0 && !(x.prayed && x.prayed[id] === st.day); })[0] || null; };
  SN.pray = function (st, h, O, T) {
    var here = function (U) { return U.filter(function (u) { return SN.alive(u) && SN.same(u.at, h); }); };
    var said = function (u, w, id, tg, text) {
      (w.prayed = w.prayed || {})[id] = st.day;
      SN.beat(st, { t: 'pray', u: u.id, who: w.name, id: id, word: SN.PRAYER[id], tg: tg ? tg.id : u.id, tgName: tg ? tg.name : u.name });
      SN.say(st, text, 'roll', h);
    };
    here(T).forEach(function (u) {
      var w = u.side === 'gnoll' && !u.blessed && SN.relicHere(u) ? SN.prays(st, u, 'bless') : null; if (!w) return;
      u.blessed = true; said(u, w, 'bless', null, w.name + ' blesses ' + u.name + ' (Book I\'s Bless): +1 to their dice and their morale today.');
    });
    var men = function () { return here(O).filter(function (u) { return !u.party && u.figs > 0; }).sort(function (a, b) { return b.figs - a.figs; }); };
    st.units.forEach(function (u) {
      if (u.side !== 'gnoll' || !SN.alive(u) || !SN.same(u.at, SN.MOOT) || SN.dist(u.at, h) > 1) return;
      var w = SN.prays(st, u, 'insectplague'), tg = w && men()[0]; if (!tg) return;
      said(u, w, 'insectplague', tg, w.name + ' prays Insect Plague from the moot ground (Book I): a cloud of insects drives ' + tg.name + ' off in rout' + (SN.heroesOf(tg).some(function (x) { return x.type !== 'wizard'; }) ? '; the heroes with them stand.' : '.'));
      SN.breakUp(st, tg, true);
    });
    if (!SN.same(h, SN.MOOT)) return;
    here(T).forEach(function (u) {
      var w = SN.prays(st, u, 'entangle'), tg = w && here(O).filter(function (x) { return !x.party && !x.entangled; }).sort(function (a, b) { return SN.fightFigs(b) - SN.fightFigs(a); })[0]; if (!tg) return;
      tg.entangled = true; said(u, w, 'entangle', tg, w.name + ' prays Entangle: the ground takes ' + tg.name + ' by the legs -- no charge, struck as from the flank, and they cannot fall back today.');
    });
  };
  // surprise (OD&D Book III p.9, the wilderness's the same, p.17; RULED 10-15, his "2 lean" -- surprise first): "roll a six-sided die for each party
  // concerned. A roll of 1 or 2 indicates the party is surprised" -- not a side all of whose units have fought today (they are awake to it); both
  // caught, neither gains. "Surprise gives the advantage of a free move segment": in the first round the surprising side's units come at the
  // surprised side's from the flank -- from the rear if three or more of them are in the fight, since "if there are three or more monsters involved
  // they will have moved into a circle around the adventurers" (p.17)
  SN.surprise = function (st, h, O, T) {
    st.surp = null;
    var dO = SN.d6(st), dT = SN.d6(st), awake = function (U) { return U.every(function (u) { return u.fought; }); };
    var sO = dO <= 2 && !awake(O), sT = dT <= 2 && !awake(T), side = sO && !sT ? 'ours' : sT && !sO ? 'theirs' : null;
    var by = side === 'ours' ? T : O, circle = !!side && by.filter(function (u) { return !u.party; }).length >= 3;
    if (side) st.surp = { at: h.slice(), side: side, circle: circle };
    SN.beat(st, { t: 'surp', dO: dO, dT: dT, side: side, circle: circle, both: sO && sT });
    SN.say(st, 'Surprise (Book III): ours roll ' + dO + ', theirs ' + dT + (side ? ' -- ' + (side === 'ours' ? 'ours are' : 'they are') + ' caught unready: in the first round they are taken ' + (circle ? 'from the rear (three or more come at them, in a circle)' : 'in the flank') + '.' : sO && sT ? ' -- both caught unready: neither gains.' : ' -- no one is caught unready.'), 'roll', h);
  };
  // evasion (OD&D Book III p.20; RULED 10-15, his "go on evasion" on the seat's lean): a unit under orders to AVOID that something comes at tries
  // to slip a hex away instead of fighting, on Book III's table -- the party's size (here the unit's figures; the four count four) against "the number
  // of monsters encountered" as a share of the "possible #" (here the pursuers' figures against their starting figures). "Surprise by party means
  // that evasion chances are doubled. Surprise by monsters negates all chance of evasion unless party is able to use some form of magic" (a wizard
  // or a caster with it); "if ... one is at least twice as fast as the other, the faster will have the effect of increasing/decreasing evasion
  // chances by 25%". A failed evasion is the fight (no pursuit at a day's scale). The Dominion's wagons avoid whenever they hold
  SN.EVADE = [[3, [50, 70, 90]], [9, [30, 50, 70]], [24, [15, 30, 50]], [1e9, [5, 20, 35]]]; // (party size up to, then the chance by the monsters' share: 25% or less, 26-60%, over 60%)
  SN.evadeChance = function (st, u, P, surp) {
    var size = u.party ? 4 : SN.fightFigs(u), row = SN.EVADE.filter(function (r) { return size <= r[0]; })[0][1];
    var a = P.reduce(function (s, x) { return s + (x.figs || 0); }, 0), b = P.reduce(function (s, x) { return s + (x.figs0 || 0); }, 0), share = b ? a / b : 1;
    var c = row[share <= 0.25 ? 0 : share <= 0.6 ? 1 : 2], why = [size + (u.party ? ' of the four' : ' figures') + ' against ' + Math.round(share * 100) + '% of their strength: ' + c + '%'];
    var mine = u.side === 'ours' ? 'ours' : 'theirs';
    if (surp && surp.side && surp.side !== mine) { c *= 2; why.push('they were surprised: doubled'); }
    else if (surp && surp.side === mine) { if (SN.heroesOf(u).some(SN.casts)) why.push('surprised, but magic with them'); else { c = 0; why.push('caught unready: no chance'); } }
    var mu = SN.moveOf(u), mp = Math.max.apply(null, P.map(SN.moveOf));
    if (c > 0 && mu >= 2 * mp) { c += 25; why.push('twice as fast: +25'); } else if (c > 0 && mp >= 2 * mu) { c -= 25; why.push('they are twice as fast: -25'); }
    return { c: Math.max(0, Math.min(100, c)), why: why.join('; ') };
  };
  SN.evasion = function (st, h, O, T) {
    var surp = st.surp && SN.same(st.surp.at, h) ? st.surp : null;
    [[O, T], [T, O]].forEach(function (pr) {
      pr[0].filter(function (u) { return u.order && u.order.type === 'avoid' && u.state === 'ok' && SN.same(u.at, h); }).forEach(function (u) {
        var P = pr[1].filter(function (x) { return SN.alive(x) && SN.same(x.at, h); }); if (!P.length) return;
        var e = SN.evadeChance(st, u, P, surp), roll = 1 + Math.floor(SN.rng(st) * 100), room = SN.nbrs(u.at).some(function (x) { return SN.cost(x) < 99 && !SN.unitsAt(st, x).some(function (y) { return SN.hostile(u, y); }); });
        var ok = roll <= e.c && room, nm = u.party ? 'the four' : u.name;
        SN.beat(st, { t: 'evade', u: u.id, name: nm, roll: roll, chance: e.c, ok: ok, why: e.why, room: room });
        SN.say(st, nm + ' try to slip away (Book III): ' + e.why + ' -- rolled ' + roll + (ok ? ': they are gone a hex.' : !room ? ': nowhere to go -- caught.' : ': caught.'), 'roll', h);
        if (ok) SN.fallBack(st, u, 'evade');
      });
    });
  };
  // nightfall (RULED 10-14 night, his "enemies can't end the day on the hex?" and the seat's lean): three rounds and both still standing, the
  // side with the lower morale total backs off a hex in good order -- CHAINMAIL's mildest result (p.16); a side that never yields (berserkers,
  // the death-watch, the four) makes the other back off; both never yield, the fewer figures do; if they cannot move, the other side does
  SN.nightfall = function (st, h, O, T) {
    O.concat(T).forEach(function (u) { u.entangled = false; }); // (Entangle holds for the day: nightfall lets it go -- SN.pray)
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
    var need = w.figs0 - w.figs; if (need <= 0 || !SN.alive(w) || w.watch) return; // (the death-watch is the seat-tribe's women: glory's followers do not join it -- 10-16)
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
    if (SN.heroesOf(u).length && u.figs > 0) { if (u.groups) u.groups.forEach(function (g) { g.n = 0; }); u.figs = 0; return; } // (the heroes stay: the last figures killed are always theirs, p.30)
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
          var mod = (ha.warlock ? -SN.WARLOCK : 0) + (ha.ft || 0), r = SN.dice(st, 2), s = r[0] + r[1] + mod; // (ft: a rank's own, the Eldest's "Superhero - 1", OD&D Book I)
          SN.beat(st, { t: 'ft', a: a.id, ah: ha.name, b: b.id, bh: hb.name, dice: r, mod: mod, need: need, res: s > need ? (hb.fated ? 'spared' : hb.harbinger ? 'beaten' : 'kill') : s === need ? 'back' : 'none' });
          var line = ha.name + ' against ' + hb.name + ' on the Fantasy table: ' + r.join('+') + (mod ? (mod > 0 ? '+' : '') + mod : '') + '=' + s + ' against ' + need;
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
    // who takes whom from the rear in the first round: the attacker strikes and takes nothing back (p.16)
    var biggest = function (B) { return B.slice().sort(function (x, y) { return SN.fightFigs(y) - SN.fightFigs(x); })[0]; }, rearOf = {};
    // a side caught unready (SN.surprise) is taken in the flank in the first round, or in the rear by a circle of three or more
    var sur = round === 1 && st.surp && SN.same(st.surp.at, h) ? st.surp : null;
    var aspOf = function (a, tg) { var asp = SN.aspect(st, a, tg, h); if (sur && (tg.side === 'ours') === (sur.side === 'ours') && asp !== 'rear') asp = sur.circle ? 'rear' : 'flank'; if (tg.entangled && asp === 'front') asp = 'flank'; return asp; }; // (entangled: restrained, struck as from the flank -- SN.pray)
    if (round === 1) [[o, t], [t, o]].forEach(function (pr) { pr[0].forEach(function (a) { var tg = biggest(pr[1]); if (tg && aspOf(a, tg) === 'rear') (rearOf[tg.id] = rearOf[tg.id] || []).push(a.id); }); });
    function attack(a, B, volley) {
      if (!volley && rearOf[a.id]) { B = B.filter(function (x) { return rearOf[a.id].indexOf(x.id) < 0; }); if (!B.length) SN.say(st, a.name + ' are taken from behind: they strike nothing back this round.', 'roll', h); }
      if (!B.length) return;
      var tgt = biggest(B), dcls = tgt.fatigued ? SN.LOWER[tgt.def] : tgt.def, horse = { LH: 1, MH: 1, HH: 1 }, hd = SN.holding(st, tgt, h); // (hd: they hold their ground here)
      if (horse[dcls] && !tgt.charged) dcls = SN.LOWER[dcls]; // (standing horse defends a class down, p.17)
      var asp = volley ? 'front' : aspOf(a, tgt); // (from the flank or the rear: the next class up, Armored Foot and Heavy Horse +1 a die, p.16)
      var wf = volley ? 0 : SN.heroesOf(a).filter(SN.isWiz).length * 2, ter = SN.TERRAIN[SN.ter(h[0], h[1])]; // (a wizard fights as two Armored Foot, p.30: her own dice, below)
      if (wf) wizDice(a, tgt, dcls, wf, ter, asp);
      var heroF = volley ? 0 : SN.fightFigs(a) - (a.figs || 0) - wf; // (the heroes fight with the unit's first type)
      // each type of a mixed unit rolls its own row (p.15, "separating them by type"); a unit of one type is one
      SN.parts(a).forEach(function (g, gi) {
        if (volley && !g.volley) return;
        var f = (volley ? g.n : g.n + (gi === 0 ? heroF : 0)); if (f <= 0) return;
        var cls0 = a.fatigued ? SN.LOWER[g.cls] : g.cls, cls = cls0, up = 0;
        if (asp !== 'front') { if (SN.HIGHER[cls]) cls = SN.HIGHER[cls]; else up = 1; }
        var row = SN.CT[cls][dcls];
        // impetus, p.17: heavy and armored foot and all horse charging over open ground add a die -- not a square (it cannot charge), and not horse
        // against a square (p.10's square, the seat's reading of what it is for)
        var imp = !volley && round === 1 && a.charged && !a.entangled && cls0 !== 'LF' && !ter.hill && !ter.rough && a.form !== 'square' && !(horse[cls0] && tgt.form === 'square') && !hd;
        var n = Math.ceil(f / row[1]) * row[0] + (imp ? Math.ceil(f / row[1]) : 0), b = SN.bonus(a) + up, need = Math.max(2, row[2] - b), r = SN.dice(st, n), k = r.filter(function (x) { return x >= need; }).length;
        var k0 = k; if (volley && hd) k = Math.floor(k / 2); // (behind their walls: soft cover halves it, "drop all fractions", p.12)
        if (tgt.harbinger && !SN.heroesOf(a).length && !tgt.figs) k = 0; // (a wraith alone: only magic and the fantastic harm him, p.34)
        if (volley && SN.heroesOf(tgt).some(SN.isWiz)) k = Math.min(k, tgt.figs); // (a wizard is impervious to normal missile fire, p.30: the volley kills her men, never her)
        var gname = a.groups ? g.name || SN.CLASSNAME[g.cls] : null;
        SN.beat(st, { t: 'atk', u: a.id, tg: tgt.id, cls: cls, dcls: dcls, dice: r, need: need, k: k, volley: !!volley, imp: !!imp, round: round, f: f, row: row.slice(), bonus: b, asp: asp, up: up, cls0: cls0, noBack: asp === 'rear' && round === 1, grp: gname, held: !!hd, cover: volley && hd ? k0 : null });
        SN.say(st, a.name + (gname ? ' (' + gname + ')' : '') + (volley ? ' loose a volley' : imp ? ' charge' : '') + (asp === 'rear' ? ' from the rear' : asp === 'flank' ? ' on the flank' : '') + ' (' + f + ' ' + cls + (cls !== cls0 ? ' -- ' + cls0 + ' a class up' : '') + ' against ' + dcls + (imp ? ', +1 die a figure for the charge' : '') + ') roll ' + n + (n === 1 ? ' die' : ' dice') + ', kill on ' + need + '+' + (b ? ' (+' + b + ')' : '') + ': [' + r.join(' ') + '] -> ' + (volley && hd ? k0 + ', halved behind their cover: ' : '') + k + (k === 1 ? ' kill' : ' kills') + (!volley && hd && round === 1 && a.charged && cls0 !== 'LF' ? ' (no charge die: they hold their ground)' : ''), 'roll', h);
        if (k) hit(tgt, k);
      });
    }
    function wizDice(a, tgt, dcls, wf, ter, asp) {
      var up = asp && asp !== 'front' ? 1 : 0, need = Math.max(2, SN.CT.AF[dcls][2] - up);
      var row = SN.CT.AF[dcls], imp = round === 1 && a.charged && !a.entangled && !ter.hill && !ter.rough && !SN.holding(st, tgt, h), n = Math.ceil(wf / row[1]) * row[0] + (imp ? Math.ceil(wf / row[1]) : 0), r = SN.dice(st, n), k = r.filter(function (x) { return x >= need; }).length;
      var w = SN.heroesOf(a).filter(SN.isWiz)[0];
      SN.beat(st, { t: 'atk', u: a.id, tg: tgt.id, cls: 'AF', dcls: dcls, dice: r, need: need, k: k, volley: false, imp: !!imp, round: round, f: wf, row: row.slice(), bonus: up, wiz: true, who: w.name, asp: asp || 'front' });
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
        var hitsOn = tgs.map(function (u) { return { tg: u.id, n: light ? 1 + Math.floor(SN.rng(st) * 6) : 2 + Math.floor(SN.rng(st) * 6) + Math.floor(SN.rng(st) * 6) }; }); // (one man a figure: a fire ball 2d6 men of the unit it falls on, a bolt 1d6 of each of two -- the seat's reading of the catapult's hit area)
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
      o.concat(t).filter(function (a) { return a.volley && a.figs > 0; }).forEach(function (a) { attack(a, a.side === 'ours' ? t : o, true); }); // (a mixed unit's missile troops alone)
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
    var take = SN.take(st, u, Math.min(u.figs, n)); u.lost += take; n -= take;
    if (take) { SN.beat(st, { t: 'cas', u: u.id, n: take, figs: u.figs }); u.lostToday = true; }
    if (heroKilled) { st.stats[u.side === 'ours' ? 'lost' : 'killed'][u.side + ':' + heroKilled.type] = (st.stats[u.side === 'ours' ? 'lost' : 'killed'][u.side + ':' + heroKilled.type] || 0) + 1; }
    SN.heroesOf(u).forEach(function (hh) {
      var needHits = hh.type === 'superhero' ? 8 : 4;
      if (n >= needHits && !hh.fated && !hh.harbinger) { hh.dead = true; n -= needHits; SN.beat(st, { t: 'herofall', u: u.id, name: hh.name }); SN.say(st, hh.name + ' falls, the last of ' + u.name + '.', 'roll', u.at); st.stats[u.side === 'ours' ? 'lost' : 'killed'][u.side + ':' + hh.type] = (st.stats[u.side === 'ours' ? 'lost' : 'killed'][u.side + ':' + hh.type] || 0) + 1; }
    });
    if (heroKilled) SN.beat(st, { t: 'herofall', u: u.id, name: heroKilled.name });
    if (u.figs <= 0 && !SN.heroesOf(u).length && !u.party) { u.state = 'gone'; SN.beat(st, { t: 'gone', u: u.id }); SN.say(st, u.name + ' are destroyed.', 'roll', u.at); }
    else if (u.figs <= 0 && SN.heroesOf(u).some(function (x) { return x.fated; }) && n > 0 && u.figs0) SN.fallBack(st, u, 'back'); // (GreyFang's men gone: he is carried out of it -- his end is the Harbinger's)
  };
  // the lower total reacts by the gap (p.16) -- but no one here surrenders (his rules 10-15: "I don't think either side would accept them", then
  // "Rout over surrender for the gnolls as well"): the book's 100 and over is a rout, as 80-99 is; a rout of men joins or disbands (SN.breakUp)
  SN.react = function (gap) { return gap >= 80 ? 'rout' : gap >= 60 ? 'retreat' : gap >= 40 ? 'back' : 'backoff'; };
  // post-melee morale (pp.15-16): fewer casualties scores the difference times a die, more survivors the difference, each side adds its
  // survivors times its rating; under twenty figures a side everything doubles; the lower total reacts by the gap
  SN.morale = function (st, o, t, before, h) {
    function side(U) { var surv = 0, cas = 0, rate = 0, n = 0; U.forEach(function (u) { var f = SN.fightFigs(u), wf = SN.heroesOf(u).filter(SN.isWiz).length * 2; surv += f; cas += Math.max(0, before[u.id] - f); rate += (SN.rating(u) + (SN.holding(st, u, h) ? 1 : 0)) * Math.max(1, f - wf) + SN.WIZARD.morale * wf; n += Math.max(1, f - wf) + wf; }); return { U: U, surv: surv, cas: cas, rate: n ? rate / n : 5, never: U.every(SN.nevers) }; } // (a wizard's figures at her own rating, p.33)
    var A = side(o), B = side(t), dA = SN.d6(st), dB = SN.d6(st);
    var sA = (A.cas < B.cas ? (B.cas - A.cas) * dA : 0) + (A.surv > B.surv ? A.surv - B.surv : 0) + A.surv * A.rate;
    var sB = (B.cas < A.cas ? (A.cas - B.cas) * dB : 0) + (B.surv > A.surv ? B.surv - A.surv : 0) + B.surv * B.rate;
    if (A.surv < 20 && B.surv < 20) { sA *= 2; sB *= 2; }
    sA = Math.round(sA); sB = Math.round(sB);
    var lo = sA < sB ? A : B, gap = Math.abs(sA - sB);
    st._mor = { at: h.slice(), sA: sA, sB: sB };
    SN.say(st, 'Morale: ours ' + sA + ', theirs ' + sB + ' (the gap ' + gap + ').', 'morale', h);
    var how = gap < 20 || lo.never ? 'continue' : SN.react(gap);
    SN.beat(st, { t: 'mor', sA: sA, sB: sB, gap: gap, how: how, never: gap >= 20 && lo.never, lo: lo === A ? 'ours' : 'theirs', doubled: A.surv < 20 && B.surv < 20,
      parts: { ours: { surv: A.surv, cas: A.cas, rate: Math.round(A.rate * 10) / 10, die: dA, never: A.never }, theirs: { surv: B.surv, cas: B.cas, rate: Math.round(B.rate * 10) / 10, die: dB, never: B.never } } });
    if (how === 'continue') { if (gap >= 20) SN.say(st, 'They do not check morale; the melee goes on.', 'morale', h); return false; }
    var word = { rout: 'rout', retreat: 'retreat a move', back: 'fall back a move in good order', backoff: 'back off half a move in good order' }[how];
    var moved = false;
    lo.U.forEach(function (u) {
      if (SN.nevers(u)) return;
      if (u.entangled) { SN.say(st, u.name + ' would ' + word + ', but the ground holds them fast: the melee goes on.', 'morale', h); SN.beat(st, { t: 'held', u: u.id }); return; } // (Entangle: no falling back today -- SN.pray)
      SN.say(st, u.name + ' ' + word + '.', 'morale', h);
      SN.fallBack(st, u, how); moved = true;
    });
    return moved;
  };
  // a surrender takes the men; a hero, a super-hero or a wraith with them "never checks morale" (p.30) and is not taken -- cut free, falling back alone
  // (since his "Rout over surrender" 10-15 the morale never calls it: kept for a surrender he may want back, between men)
  // (found 10-15 in his play: GreyFang's forty surrendered at the Pit and he went with them; the Harbinger's quarry is never a prisoner)
  SN.surrender = function (st, u) {
    var hs = SN.heroesOf(u).filter(function (h) { return h.type !== 'wizard'; });
    SN.take(st, u, u.figs, 'prisoners');
    SN.beat(st, { t: 'surrender', u: u.id, heroesLeft: hs.length > 0 });
    if (hs.length) { SN.say(st, hs.map(function (h) { return h.name; }).join(' and ') + ' will not be taken: cut free, falling back alone.', 'morale', u.at); SN.fallBack(st, u, 'retreat'); return; }
    u.state = 'prisoner'; u.on = false;
  };
  // falling back: a hex away from the enemy, toward home; a rout two (a move and a half), and a routing unit routs the friends it runs into (p.16)
  // a rout of men (his rule 10-15: "Routing typically disbans the units - when the humans get routed can we do a 'joins group within two' OR ELSE
  // disbands?"): a unit of men -- ours or the Dominion's; the gnolls rout as the book has it -- does not run its move and a half: its men run to the
  // nearest steady unit of their own side within two hexes (the witness's reach), not in a fight, and join it; with none, they scatter for home and
  // the unit is gone (CHAINMAIL p.16: a rout off the table, or past its rally table, is removed from play). A hero, a super-hero or a wraith does not
  // run (p.30): cut free, falling back alone, as from a surrender; a warlock goes with the men
  SN.menBreak = function (u) { return u.side !== 'gnoll' && !u.party; };
  // (stay: the heroes do not fall back -- an Insect Plague drives off the men alone, "less than three hit dice", SN.pray; a berserker's men, who only
  // ever rout by it, run to their own people, the plains tribes)
  SN.breakUp = function (st, u, stay) {
    var hs = SN.heroesOf(u).filter(function (x) { return x.type !== 'wizard'; }), wz = SN.heroesOf(u).filter(SN.isWiz), n = u.figs, h = u.at.slice();
    var to = st.units.filter(function (x) {
      return x !== u && x.side === u.side && SN.alive(x) && x.state === 'ok' && !x.party && (u.berserk ? x.kind === u.kind : !x.berserk) && SN.dist(x.at, h) <= 2 && !SN.same(x.at, h) &&
        !SN.unitsAt(st, x.at).some(function (y) { return SN.hostile(x, y); });
    }).sort(function (a, b) { return SN.dist(a.at, h) - SN.dist(b.at, h) || b.figs - a.figs; })[0];
    SN.beat(st, { t: 'menrun', u: u.id, n: n, to: to ? to.id : null, toName: to ? to.name : null, heroes: hs.length > 0, word: to ? 'THEY RUN TO ' + to.name.toUpperCase() : 'THEY SCATTER' });
    if (to && n > 0) {
      SN.pour(to, u, false); if (u.groups) u.groups.forEach(function (g) { g.n = 0; }); u.figs = 0; SN.sync(u);
      if (wz.length) { to.heroes = (to.heroes || []).concat(wz); u.heroes = (u.heroes || []).filter(function (x) { return wz.indexOf(x) < 0; }); }
      SN.beat(st, { t: 'wit', kind: 'rally', from: u.id, fromName: u.name, to: to.id, toName: to.name, n: n, sheets: (u.sheets || []).slice() });
      SN.say(st, u.name + ' break: ' + n + ' men run to ' + to.name + ' and join them (' + to.name + ' now ' + to.figs + ').', 'morale', h);
    } else if (n > 0) {
      st.stats.fled = st.stats.fled || {}; SN.take(st, u, n, u.side === 'ours' ? 'lost' : 'fled');
      SN.say(st, u.name + ' break with no steady friends within two hexes: ' + n + ' men scatter for home' + (hs.length ? '.' : ', and the unit is gone.'), 'morale', h);
    }
    if (hs.length && stay) { SN.say(st, hs.map(function (x) { return x.name; }).join(' and ') + ' stand' + (hs.length > 1 ? '' : 's') + ' alone where the men were.', 'morale', h); return; }
    if (hs.length) { SN.say(st, hs.map(function (x) { return x.name; }).join(' and ') + ' will not run: cut free, falling back alone.', 'morale', h); SN.fallBack(st, u, 'retreat'); return; }
    u.on = false;
    if (to) { u.state = 'merged'; u.mergedInto = to.id; } else { u.state = 'gone'; st.stats.scattered = (st.stats.scattered || 0) + 1; }
  };
  SN.fallBack = function (st, u, how, depth) {
    if (!SN.alive(u)) return;
    if (how === 'rout' && SN.menBreak(u)) return SN.breakUp(st, u);
    var n = how === 'rout' ? 2 : 1;
    for (var i = 0; i < n; i++) {
      var opts = SN.nbrs(u.at).filter(function (x) { return SN.cost(x) < 99 && !SN.unitsAt(st, x).some(function (y) { return SN.hostile(u, y); }); });
      if (!opts.length) { if (how === 'rout') { SN.say(st, u.name + ' have nowhere to run and are cut down.', 'morale', u.at); SN.lose(st, u, u.figs); u.state = 'gone'; } return; }
      opts.sort(function (a, b) { return (SN.dist(a, u.home) - SN.dist(b, u.home)) - 0.5 * (SN.away(st, u, a) - SN.away(st, u, b)); });
      if (i === 0) SN.beat(st, { t: 'fall', u: u.id, how: how, from: u.at.slice(), dir: SN.dirTo(u.at, opts[0]) });
      var fd = SN.dirTo(u.at, opts[0]); if (fd >= 0) u.face = how === 'rout' || how === 'retreat' ? fd : (fd + 3) % 6; // (in good order they face the enemy; a retreat or a rout has its back to them, p.16)
      u.at = opts[0].slice(); u.came = null;
    }
    u.moved = true;
    if (how === 'rout' || how === 'retreat') { u.state = how; u.rally = 0; }
    if (how === 'rout' && (depth || 0) < 3) SN.unitsAt(st, u.at).filter(function (x) { return x !== u && x.side === u.side && x.state === 'ok' && !SN.nevers(x); }).forEach(function (x) {
      SN.say(st, u.name + ' run through ' + x.name + ', and they rout too.', 'morale', u.at); SN.fallBack(st, x, 'rout', (depth || 0) + 1);
    });
  };
  SN.away = function (st, u, h) { var d = 99; st.units.forEach(function (x) { if (SN.alive(x) && SN.hostile(u, x)) d = Math.min(d, SN.dist(x.at, h)); }); return d; };
  SN.beatHarb = function (st, H) { H.beaten = st.day + 2; H.at = SN.freeNear(st, SN.MOOT, H); H.came = null; H.moved = true; st.stats.beaten++; st.events.push({ kind: 'beaten' }); };

  // ---------------------------------------------------------------- the party's part: what the grid sends, and what comes back
  // a war-band from the units it meets: the road's glory-seekers fight (`snoot`, its map the road south) with the 8-bit's own list, sized from the
  // figures there (a hard fight for four at 8, the seat's lean RULED 10-14); against the Dominion the wagon yard's own (`wagon`: its soldiers)
  // one man a figure (RULED 10-15): the band on the grid is the band -- each unit's men by its make-up (comp), as many as are left of them, up to thirty
  // creatures a grid; `contrib` says how many each unit sent, so what falls there comes off it man for man
  SN.GRIDMAX = 30;
  SN.band = function (st, foes, h) {
    var g = foes.filter(function (u) { return u.side === 'gnoll'; }), list = [], contrib = [], room = SN.GRIDMAX;
    var send = function (u, comp) {
      var keys = Object.keys(comp), tot = keys.reduce(function (s, k) { return s + comp[k]; }, 0) || 1, n = Math.min(room, u.figs), sent = 0;
      keys.forEach(function (k, i) { var m = i === keys.length - 1 ? n - sent : Math.min(n - sent, Math.round(n * comp[k] / tot)); for (var j = 0; j < m; j++) list.push(k); sent += m; });
      if (n > 0) contrib.push({ id: u.id, n: n }); room -= n;
    };
    // a matriarch is her unit's hero, not one of its men (10-16): her own grid kind first -- DEEP16's cleric of the Keeping (deep16/data/foes.js
    // gnollmatriarcheldest, gnollmatriarchlama) -- and `chiefs` says whose each list place is, so one who falls on the grid falls on the map, as the
    // Dominion's ladies do below
    var chiefs = {};
    if (g.length) {
      g.forEach(function (u) { (u.heroes || []).forEach(function (x, i) { if (!x.dead && x.grid && room > 0) { chiefs[list.length] = [u.id, i]; list.push(x.grid); room--; } }); send(u, u.comp || { gnoll: 1 }); });
      return { kind: 'band', fight: 'snoot', at: h.slice(), enemies: list, chiefs: chiefs, foes: foes.map(function (u) { return u.id; }), contrib: contrib };
    }
    // the Dominion: each wagon's patrol lady first -- DEEP16's patrollady, a warlock of the Mirror (his note 10-15: "there wasn't any warlocks when I
    // ran the party into a dominion fight": the band sent only the soldiers) -- then its soldiers man for man; `ladies` says whose each list place is
    var ladies = {};
    foes.filter(function (u) { return u.side === 'dominion'; }).forEach(function (u) { if (room > 0 && SN.heroesOf(u).some(SN.isWiz)) { ladies[list.length] = u.id; list.push('patrollady'); room--; } send(u, { trooper: 1 }); });
    return { kind: 'band', fight: 'snoot', at: h.slice(), enemies: list, dominion: true, ladies: ladies, foes: foes.map(function (u) { return u.id; }), contrib: contrib };
  };
  SN.gnollWords = function (st, b) { var cs = Object.keys(b.chiefs || {}).map(function (k) { var c = b.chiefs[k], u = SN.unit(st, c[0]); return u.heroes[c[1]].name; }); return b.enemies.length + ' (' + (cs.length ? cs.join(', ') + ', and ' + (b.enemies.length - cs.length) + ' more' : 'glory-seekers, gnolls, hyenas') + ')'; };
  SN.bandWords = function (b) { var nL = Object.keys(b.ladies || {}).length; return (b.enemies.length - nL) + ' soldiers' + (nL ? ' and ' + nL + ' patrol lad' + (nL === 1 ? 'y' : 'ies') : ''); };
  // the men of ours beside the four (RULED 10-15, his "4 - I'd like to"): ours in the four's hex send men to the grid with them -- DEEP16's own soldier
  // (js/party8.js SN.TROOPER8), fought by the class AI -- up to six, from each unit by its share; the rest of them fight on the tables after
  SN.ALLIES = 6;
  SN.allies = function (st, h) {
    var U = SN.unitsAt(st, h).filter(function (u) { return u.side === 'ours' && !u.party && u.figs > 0 && u.state === 'ok'; }), tot = U.reduce(function (s, u) { return s + u.figs; }, 0), out = [], given = 0;
    if (!tot || !SN.TROOPER8) return out;
    var cap = Math.min(SN.ALLIES, tot);
    U.forEach(function (u, i) { var n = Math.min(u.figs, cap - given, i === U.length - 1 ? cap - given : Math.max(1, Math.round(cap * u.figs / tot))); for (var j = 0; j < n; j++) out.push({ unit: u.id, key: 'ally-' + u.id + '-' + j }); given += n; });
    return out;
  };
  // the result on the hex: won, the band's units break -- they lose figures by the share of the band that fell and rout (the shock of four
  // super-heroes, p.30); the four ran, they fall back a hex and the enemy has won; the four fell, they are carried back to the Pit for a day
  SN.partyResult = function (st, P, foes, req, res, h) {
    var r = res && res.result || 'lost', share = res && res.share != null ? res.share : (r === 'won' ? 1 : 0.3);
    SN.beat(st, { t: 'grid', kind: req.kind, res: r, share: share, n: (req.enemies || []).length });
    // the men of ours who fell on the grid beside the four, each from its own unit (RULED 10-15)
    // a patrol lady who fell on the grid falls on the map: her wagon's warlock (CHAINMAIL p.30's wizard; the grid's patrollady)
    if (res && res.ladyDead) Object.keys(res.ladyDead).forEach(function (id) { var u = SN.unit(st, id), w = u && SN.heroesOf(u).filter(SN.isWiz)[0]; if (!w) return; w.dead = true; SN.say(st, 'The ' + w.name.replace(/^a /, '') + ' of ' + u.name + ' falls on the grid.', 'party', h); SN.lose(st, u, 0, w); });
    // a matriarch who fell on the grid falls on the map (10-16: the band's chiefs, SN.band)
    if (res && res.chiefDead) Object.keys(res.chiefDead).forEach(function (id) { var u = SN.unit(st, id); if (!u) return; res.chiefDead[id].forEach(function (i) { var x = (u.heroes || [])[i]; if (!x || x.dead) return; x.dead = true; SN.say(st, x.name + ' of ' + u.name + ' falls on the grid.', 'party', h); SN.lose(st, u, 0, x); }); });
    if (res && res.allyDead) Object.keys(res.allyDead).forEach(function (id) { var u = SN.unit(st, id), n = res.allyDead[id]; if (u && SN.alive(u) && n > 0) { SN.say(st, n + ' of ' + u.name + ' fell on the grid beside the four.', 'party', h); SN.lose(st, u, n); } });
    // what fell on the grid comes off the units that sent it, man for man (one man a figure); the bench's stand-in has no grid -- its share of each
    var killed = function () {
      if (res && res.dead != null && req.contrib) {
        var sent = req.contrib.reduce(function (s, c) { return s + c.n; }, 0), left = Math.min(res.dead, sent);
        req.contrib.forEach(function (c, i) { var u = SN.unit(st, c.id); if (!u || !SN.alive(u)) return; var n = Math.min(u.figs, left, i === req.contrib.length - 1 ? left : Math.round(res.dead * c.n / Math.max(1, sent))); if (n > 0) SN.lose(st, u, n); left -= n; });
      } else foes.forEach(function (u) { if (SN.alive(u) && SN.same(u.at, h)) { var n = Math.ceil(u.figs * share); if (n > 0) SN.lose(st, u, n); } });
    };
    if (req.kind === 'harbinger') {
      var H = foes.filter(function (u) { return u.harbinger; })[0];
      if (r === 'won' || r === 'yielded') { SN.say(st, 'The four put the Harbinger down -- and the mirror takes him back to the moot ground. He will come again.', 'party', h); if (H) SN.beatHarb(st, H); }
      else SN.partyBeaten(st, P, r, h);
      return;
    }
    if (r === 'won' || r === 'yielded' || r === 'fled') {
      SN.say(st, 'The four win their part of it on the grid (' + Math.round(share * 100) + '% of the band down).', 'party', h);
      killed();
      foes.forEach(function (u) { if (SN.alive(u) && SN.same(u.at, h) && !SN.nevers(u)) { SN.say(st, u.name + ' break before the four and rout.', 'morale', h); SN.fallBack(st, u, 'rout'); } });
      P.wonToday = true;
    } else { killed(); SN.partyBeaten(st, P, r, h); }
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
    else SN.shortRest(st); // (a short rest after every fight -- RULED 10-15, his "Heroes get a short rest between fights and a long rest between days")
  };
  // the rests (SRD 5.1, as DEEP16's own: deep16/js/pocket.js PK.shortRest -- the fallen stand first, his ruling for the Pocket DM, then hit dice till
  // whole or out; Second Wind and Action Surge, Channel Divinity, Wild Shape, ki, pact slots back; a wizard's Arcane Recovery once a day). The long
  // rest is every dusk, wherever the four stand: whole, slots and features back, half their hit dice back
  SN.HITDIE = { barbarian: 12, fighter: 10, paladin: 10, ranger: 10, bard: 8, cleric: 8, druid: 8, monk: 8, rogue: 8, warlock: 8, sorcerer: 6, wizard: 6 };
  SN.shortRest = function (st) {
    if (!st.party8) return;
    var said = [];
    st.party8.party.forEach(function (c) {
      if (c.hdLeft == null) c.hdLeft = c.lvl;
      var hd = SN.HITDIE[c.cls] || 8, con = Math.floor((((c.abil || {}).con || 10) - 10) / 2), spent = 0, healed = 0, back = [], f = c.feats = c.feats || {};
      if (c.hp <= 0) { c.hp = 1; c.ko = false; back.push('back on their feet'); }
      while (c.hp < c.maxhp && c.hdLeft > 0) { var g = Math.max(0, 1 + Math.floor(SN.rng(st) * hd) + con); c.hp = Math.min(c.maxhp, c.hp + g); healed += g; c.hdLeft--; spent++; }
      if (c.cls === 'fighter') { if (!(f.secondWind > 0) || !(f.actionSurge > 0)) back.push('Second Wind, Action Surge'); f.secondWind = 1; f.actionSurge = 1; }
      if (c.cls === 'paladin' && c.lvl >= 3 && !(f.channel > 0)) { f.channel = 1; back.push('Channel Divinity'); }
      if (c.cls === 'cleric' && c.lvl >= 2) { var ch = c.lvl >= 18 ? 3 : c.lvl >= 6 ? 2 : 1; if (!(f.channel >= ch)) back.push('Channel Divinity'); f.channel = ch; }
      if (c.cls === 'druid' && c.lvl >= 2 && !(f.wildShape >= 2)) { f.wildShape = 2; back.push('Wild Shape'); }
      if (c.cls === 'monk' && c.lvl >= 2 && !(f.ki >= c.lvl)) { f.ki = c.lvl; back.push('ki'); }
      if (c.cls === 'warlock' && c.slotsMax) { c.slots = c.slotsMax.slice(); back.push('pact slots'); }
      if (c.cls === 'wizard' && f.arcaneRecovery > 0 && c.slotsMax && c.slots) {
        var budget = Math.ceil(c.lvl / 2), got = 0;
        for (var L = Math.min(5, c.slotsMax.length); L >= 1; L--) while (c.slots[L - 1] < c.slotsMax[L - 1] && budget >= L) { c.slots[L - 1]++; budget -= L; got++; }
        if (got) { f.arcaneRecovery = 0; back.push('Arcane Recovery: ' + got + ' slot' + (got === 1 ? '' : 's')); }
      }
      if (spent || back.length) said.push(c.name + (spent ? ' ' + spent + ' hit ' + (spent === 1 ? 'die' : 'dice') + ', +' + healed + ' HP' : '') + (back.length ? (spent ? '; ' : ' ') + back.join(', ') + ' back' : ''));
    });
    if (said.length) SN.say(st, 'The four take a short rest: ' + said.join('; ') + '.', 'party');
  };
  // the bench's hand (the probe; and the fallback when the grid will not come up): the party's part on the tables, the four as eight-figure super-heroes --
  // 32 Armored Foot at +2 against the units' own figures on the Combat Table (RULED 10-15, his "the bench should read a complete gnoll slaughter, as
  // that's the result in the grid most times.. probably better to keep at 32 figures"): against a war-band it comes out a slaughter, as the grid does
  SN.standIn = function (st, req) {
    if (req.kind === 'greyfang') return { result: 'won', share: 1, stand: true };
    if (req.kind === 'harbinger') { var r = SN.dice(st, 2), s = r[0] + r[1]; SN.say(st, 'On the tables: the four against the Harbinger, ' + r.join('+') + '=' + s + ' against 8.', 'roll'); return { result: s > 8 ? 'won' : s === 8 ? 'escaped' : 'lost', share: s > 8 ? 1 : 0, stand: true }; }
    var foes = (req.foes || []).map(function (id) { return SN.unit(st, id); }).filter(function (u) { return u && SN.alive(u); }), figs = foes.reduce(function (s, u) { return s + (u.figs || 0); }, 0);
    var dcls = foes.length ? foes[0].def : 'HF', row = SN.CT.AF[dcls], need = Math.max(2, row[2] - 2), n = Math.ceil(32 / row[1]) * row[0], k = 0, rd = 0; // (32 Armored Foot, +2 a die for the super-heroes, p.30, p.40)
    while (rd < 3 && k < figs) { k += SN.dice(st, n).filter(function (x) { return x >= need; }).length; rd++; } // (one man a figure: up to a day's three rounds, till the band is down)
    SN.say(st, 'On the tables: the four (32 Armored Foot, +2) roll ' + n + ' dice a round against ' + SN.CLASSNAME[dcls] + ', kill on ' + need + '+: ' + k + ' kills of ' + figs + ' in ' + rd + ' round' + (rd > 1 ? 's' : '') + '.', 'roll');
    return { result: k * 2 >= figs ? 'won' : 'escaped', share: Math.min(1, k / Math.max(1, figs)), stand: true };
  };

  // ---------------------------------------------------------------- the day ends: rally, rest, the cleric, the Pit, home, the end
  SN.dusk = function (st) {
    st.shock = []; st.surp = null;
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
      if (u.cleric && (u.side !== 'gnoll' || SN.relicHere(u)) && u.figs < u.figs0 && u.figs > 0) { var mend = Math.min(u.figs0 - u.figs, 1 + Math.floor(SN.rng(st) * 3)); SN.addMen(u, mend); SN.say(st, 'The cleric' + (u.side === 'gnoll' ? 's' : '') + ' with ' + u.name + ' mend' + (u.side === 'gnoll' ? '' : 's') + ' ' + mend + ' (' + u.figs + ').', 'info', u.at); } // (one man a figure: 1d3 a day; a gnoll keeper prays only where a relic is: gnoll-hills.md, RULED 08-13d)
      if (u.state === 'withdraw' && SN.same(u.at, u.home)) { u.state = 'home'; SN.say(st, u.name + ' are home.', 'info', u.at); }
    });
    // the four's long rest, every dusk wherever they stand (RULED 10-15, his "a long rest between days"; it was a day held in the Pit with no fight):
    // whole, their slots and features back, half their hit dice back (SRD 5.1)
    var P = SN.unit(st, 'party');
    if (P && SN.alive(P) && st.party8 && st.party80) {
      var hurt = st.party8.party.some(function (x, i) { return x.hp < x.maxhp || JSON.stringify(x.slots) !== JSON.stringify(st.party80.party[i].slots) || JSON.stringify(x.feats) !== JSON.stringify(st.party80.party[i].feats); });
      st.party8.party.forEach(function (x, i) { var y = st.party80.party[i]; x.hp = x.maxhp; x.ko = false; x.slots = (y.slots || []).slice(); x.feats = JSON.parse(JSON.stringify(y.feats || {})); x.hdLeft = Math.min(x.lvl, (x.hdLeft == null ? x.lvl : x.hdLeft) + Math.max(1, Math.floor(x.lvl / 2))); });
      if (hurt) SN.say(st, 'The four take a long rest' + (SN.same(P.at, SN.PIT) ? ' in the Pit' : '') + '.', 'party', P.at);
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
  SN.odds = function (st, a, d, at, charging, asp) {
    var cls0 = a.fatigued ? SN.LOWER[a.cls] : a.cls, cls = cls0, dcls = d.fatigued ? SN.LOWER[d.def] : d.def, ter = SN.TERRAIN[SN.ter(at[0], at[1])], horse = { LH: 1, MH: 1, HH: 1 }, up = 0;
    if (horse[dcls] && !charging.d) dcls = SN.LOWER[dcls];
    if (asp && asp !== 'front') { if (SN.HIGHER[cls]) cls = SN.HIGHER[cls]; else up = 1; }
    var row = SN.CT[cls][dcls], f = SN.fightFigs(a), imp = charging.a && cls0 !== 'LF' && !ter.hill && !ter.rough && a.form !== 'square' && !(horse[cls0] && d.form === 'square') && !charging.held;
    var n = Math.ceil(f / row[1]) * row[0] + (imp ? Math.ceil(f / row[1]) : 0), need = Math.max(2, row[2] - SN.bonus(a) - up);
    return { cls: cls, dcls: dcls, n: n, need: need, imp: imp, held: !!charging.held, hill: !!ter.hill || !!ter.rough, kills: Math.round(n * Math.max(0, 7 - need) / 6 * 10) / 10, f: f };
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
      out.lines.push('The four\'s fight goes to the grid (DEEP16): ' + (H ? 'the Harbinger himself.' : 'a war-band of ' + (b.dominion ? SN.bandWords(b) : SN.gnollWords(st, b)) + '. Win it and they break; LEAVE THE FIGHT and you fall back a hex.'));
    } else {
      var tg = foes2.slice().sort(function (x, y) { return SN.fightFigs(y) - SN.fightFigs(x); })[0];
      var hi = day.indexOf(day.filter(function (x) { return SN.same(x, hit.at); })[0]), prev = hi > 0 ? day[hi - 1] : u.at, side = SN.dirTo(hit.at, prev);
      var asp = SN.aspect(st, { came: prev }, tg, hit.at), FN = { line: 'line', column: 'column', square: 'square' };
      out.lines.push('They stand in ' + FN[tg.form] + ', facing ' + SN.DIRS[tg.face || 0] + '; you come in from the ' + (side >= 0 ? SN.DIRS[side] : 'side') + ': ' + (asp === 'rear' ? 'their REAR -- you fight a class up, and they strike nothing back in the first round (p.16).' : asp === 'flank' ? 'their FLANK -- you fight a class up (p.16).' : 'their front.'));
      var tgHolds = SN.holdsGround(tg, hit.at), me = SN.odds(st, u, tg, hit.at, { a: true, d: false, held: !!tgHolds }, asp);
      if (tgHolds) out.lines.push('They hold ' + tgHolds + ': no charge die at them, your volleys halved (cover, CHAINMAIL p.12), and +1 on their morale.');
      out.lines.push('You: ' + me.f + ' ' + me.cls + ' against their ' + me.dcls + ' -- ' + me.n + ' dice, kill on ' + me.need + '+, about ' + me.kills + ' kills a round' + (me.imp ? ' (with your charge die)' : me.held ? ' (no charge die: they hold their ground)' : me.hill ? ' (no charge die up here)' : tg.form === 'square' ? ' (no charge die against a square)' : '') + '.');
      if (u.reformed) out.warn.push('You change formation today: caught in a fight, you count as flanked (p.10).');
      var back = 0, bn = 0; foes2.forEach(function (x) { var o = SN.odds(st, x, u, hit.at, { a: false, d: true }); back += o.kills; bn += o.n; });
      out.lines.push('Them: ' + bn + ' dice back -- about ' + Math.round(back * 10) / 10 + ' kills a round. You have ' + SN.fightFigs(u) + ' to lose.');
      var rt = foes2.reduce(function (s, x) { return s + SN.rating(x) + (SN.holdsGround(x, hit.at) ? 1 : 0); }, 0) / foes2.length;
      out.lines.push('Morale: yours ' + SN.rating(u) + (SN.nevers(u) ? ' (never checks)' : '') + ', theirs ' + Math.round(rt * 10) / 10 + (foes2.every(SN.nevers) ? ' (they never check)' : '') + '.');
    }
    if (SN.heroesOf(u).some(function (hh) { return hh.type === 'superhero'; }) || u.party) {
      var chk = foes2.filter(function (x) { return !SN.nevers(x); });
      if (chk.length) { var need = SN.UNSTABLE[chk[0].def][1]; out.lines.push((u.party ? 'The four\'s' : 'Your super-hero\'s') + ' charge makes them check first: they need ' + need + ' on two dice -- about ' + Math.round((1 - SN.p2d6(need)) * 100) + '% shy and fall back without a fight.'); }
    }
    var wit = st.units.filter(function (x) { return x.side === 'gnoll' && SN.alive(x) && x.state === 'ok' && !x.watch && x.figs >= 2 && SN.dist(x.at, hit.at) <= 2 && foes2.indexOf(x) < 0; });
    if (foes2.some(function (x) { return x.side === 'gnoll'; }) && wit.length) out.warn.push('If the gnolls win, the witness fills them from ' + wit.map(function (x) { return x.name + ' (' + x.figs + ')'; }).join(', ') + ' -- within two hexes.');
    // the matriarchs' prayers (10-16, SN.pray): what waits for you on the moot ground and next to it
    if (!u.party && u.figs > 0) st.units.forEach(function (x) {
      if (x.side !== 'gnoll' || !SN.alive(x) || !SN.same(x.at, SN.MOOT) || SN.dist(x.at, hit.at) > 1) return;
      var ip = SN.prays(st, x, 'insectplague'), en = SN.same(hit.at, SN.MOOT) && SN.prays(st, x, 'entangle');
      if (ip) out.warn.push(ip.name + ' can pray Insect Plague from the moot ground (once a day, OD&D Book I): the biggest unit of men in the fight is driven off in rout -- the heroes with it stand.');
      if (en) out.warn.push(en.name + ' can pray Entangle on the moot: the biggest unit of ours left is held for the day -- no charge die, struck as from the flank, no falling back.');
    });
    foes2.forEach(function (x) { var w = SN.relicHere(x) && !x.blessed && SN.prays(st, x, 'bless'); if (w) out.lines.push(w.name + ' with ' + x.name + ' blesses them as the fight begins (OD&D Book I): +1 to their dice and their morale.'); });
    var wag = foes2.filter(function (x) { return x.side === 'dominion'; })[0];
    if (wag) out.lines.push('The Dominion\'s wagons slip away if they can (Book III\'s evasion): about ' + SN.evadeChance(st, wag, [u], null).c + '% against you.');
    if (!u.party) out.lines.push('Either side may be caught unready: a 1 or 2 on its die (OD&D Book III) -- then it is taken in the flank in the first round, in the rear if three or more units come at it.');
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
