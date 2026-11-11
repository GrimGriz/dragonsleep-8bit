/* DEEP16 -- THE CATCH ON THE GULCH ROAM (11-04, the Inn build seat 2; the Halfway Inn lane's item 3. RULED 11-04 twice: Griz, "Go with your leans on the pursuit, horses or not
   the 'catch' is on the Gulch roam, with horses losing them there is losing them" (the Inn seat's §1), and "approve chase suggested mechanics" (the first build seat's lean):
   on foot -- a blow on Willem before the traces are loose -- the pair make 2 squares to the party's 3 from a 12-square start, run down in the gulch (the first game's
   caught1), away again, a last catch at the fork by dawn (caught2, nowhere left to run) or lost down the west road, Willem's false pair at the fork if he is still up; with
   the team, square for square from a 10-square start, lost at the north mouth unless the party is faster (Haste, Longstrider, a mount); lost with the horses is lost for
   good, the Tower in words only ("They'll be in Silverton by morning, and the Tower's door opens for them" -- THE WORLD has no Tower site). No pursuit across THE WORLD's
   hexes beyond the night walk from the inn to the gulch mouth; the eight children and the strongbox wait in the yard (the first game's chase first, the yard after: Griz 09-25).
   HOW IT RUNS: the yard's "away" (js/inn.js In.wagonNight) asks AFTER THEM or LET THEM GO; after them, the night walk is a card and the clock (the inn to the gulch's south
   mouth, about eight road miles), and the party stands on Web Gulch's floor at the south mouth with the pair ahead on the road as figures (js/inn.js In.unit); every step the
   party takes up the road the pair take their share (Ch.PACE), and the party closing to two squares is the catch -- a fight on the gulch floor's own squares, the roam's own
   (js/roam.js R.engage), the pair running again from the first turn (fledEnds; the way off, the road eight squares on); away again, they run square for square to the north
   mouth and pull up at the fork, where Willem's false pair (the first game's wagon.fakeRider) throws the party a choice; the last catch is to the end (noFlee). Then the walk
   back (wagon.back), the yard's own aftermath and the morning (In.chaseBack). The flags' one record is `wagonChase` (the registry under content/). The first game's chase is the
   reference only (first/js/events.js S.wagonChase; frozen, never edited). Bench: dev/bench16.js mode=chase1104. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, M = D.mines, W = D.world, In = D.inn, Gu = D.gulch, Ch = D.chase = {};
  if (!M || !W || !In || !Gu) return;
  var L = function (k, o) { return D.counter.L(k, o); };
  Ch.PACE = { foot: 2 / 3, horses: 1, fork: 1 }; // (the pair's squares a square of the party's: on foot 2 to 3 till the first catch; with the team, and on the run to the fork, square for square)
  Ch.START = { foot: 12, horses: 10 };
  Ch.CATCH = 2;              // (the party this close up the road, and the fight is on)
  Ch.AWAY = 8;               // (the first catch's way off: the road this many squares on from where it began -- a full stride and a half)
  Ch.WALK_HOURS = 2.7;       // (the inn to the gulch's south mouth, about eight road miles at the SRD's three an hour, and the same back)
  Ch.SQ_HOUR = 300;          // (the gulch's clock: js/gulch.js Gu.RATE)
  // ONE AWAY (11-06, the yard's end RULED, his "4 - lean": the chase goes after the one who got away, the other down in the yard or the first catch): a lone runner's lines, `{name}` the
  // one -- the seat's drafts (invented.json halfway-chase-one-away). Willem's trick at the fork keeps its own lines: a pair of runners made of nothing is his to make, alone or not
  Ch.ONE = {
    chase1: 'Running feet, north up the road: one shape going hard in the dark. You go after {name}.',
    heard: 'Running feet, north up the road: one shape going hard in the dark -- {name}.', // (the yard's ask: heard, not yet chased -- 11-11)
    mouth: 'Web Gulch, the south mouth, and ahead up the cut one shape on the road, going hard: {name}.',
    foot: '{g}On foot {name} is slower than you: every three squares of yours, two. Run {name} down.{/}',
    horses: '{g}On a grey {name} is as fast as you are, and the north mouth is the end of it unless you are faster.{/}',
    faster: '{g}You are faster than the grey on this road: every square of yours it makes less than one. Run {name} down.{/}',
    caught1: 'Where the road climbs past the gulch, you run {name} down.',
    caught2: 'You catch {name} at last. There is nowhere left to run.',
    chase2: '{name} is away again, north toward the fork and the Tower.',
    again: 'Square for square now up the cut: catch {name} before the mouth.',
    fork: 'The north mouth, and the fork beyond it in the first grey of the dawn. {name} pulls up a moment at the parting of the roads --',
    forkOne: 'There is nowhere left to run.',
    lostHorses: 'The north mouth, and the grey takes {name} up out of the cut and away. By morning {name} will be in Silverton, and the Tower\'s door opens.',
    lostEscaped: 'You let {name} go. North, and gone; by morning the Tower\'s door opens.'
  };
  Ch.one = function (c) { return !c ? null : c.amara !== false && !c.willem ? 'Amara' : c.amara === false && c.willem ? 'Willem' : null; };
  Ch.ln = function (c, k, dflt) { var n = Ch.one(c); return n && Ch.ONE[k] ? Ch.ONE[k].split('{name}').join(n) : dflt; };
  Ch.LINES = { // (the seat's drafts beside the first game's wagon.* lines: invented.json halfway-gulch-chase)
    heard: 'Running feet, north up the road: two shapes going hard in the dark.', // (the yard's ask, AFTER THEM or LET THEM GO: heard, not yet chased -- wagon.chase1 without its "You go after them", which Ch.start says once it is chosen; 11-11, on his 11-06 "Text says you do give chase then offers to chase or not")
    // the walk back by the hour it sets out (11-11, his note on eyes-gulchchase-1104: "The 'walk back in the dark' happened after morning in the gulch..."): the dark's is wagon.back
    backDawn: 'The long walk back down the road in the first grey of the morning, to the inn.',
    backDay: 'The long walk back down the road in the morning, to the inn.',
    walk:'The Pit road north in the dark, at a run where the road allows it: two hours and more to where the cut opens. Nothing on the road but the road.',
    mouth: 'Web Gulch, the south mouth, and ahead up the cut two shapes on the road, going hard.',
    foot: '{g}On foot they are slower than you: every three squares of yours they make two. Run them down.{/}',
    horses: '{g}On the greys they are as fast as you are, and the north mouth is the end of it unless you are faster.{/}',
    faster: '{g}You are faster than the greys on this road: every square of yours they make less than one. Run them down.{/}',
    caught: 'Where the road climbs, you run them down.',
    again: 'They are away again, north up the cut toward the fork. Square for square now: catch them before the mouth.',
    fork: 'The north mouth, and the fork beyond it in the first grey of the dawn. They pull up a moment at the parting of the roads --',
    forkTwo: '-- and then there are two pairs: one going north up the Silverton road, one west down the Castegut road.',
    forkOne: 'There is nowhere left to run, and they know it.',
    west: 'Down the west road after them, and your hand goes through them. Willem\'s trick: a pair of runners made of nothing. The real pair are gone north, and the Tower\'s door opens for them.',
    lostHorses: 'The north mouth, and the greys take them up out of the cut and away. By morning they will be in Silverton, and the Tower\'s door opens for them.',
    lostEscaped: 'You let them go. North, and gone; by morning the Tower\'s door opens for them.',
    done: 'It is over on the road. Behind you, back at the inn, the wagon and its seven wait in the yard.',
    opts: { north: 'THE PAIR GOING NORTH', west: 'THE PAIR GOING WEST', after: 'AFTER THEM', let: 'LET THEM GO' }
  };
  Ch.state = function (B) { return B && B.roam && B.roam.flags && B.roam.flags.wagonChase || null; };
  Ch.roadX = function (y) { var r = Gu.ROWS[Math.max(0, Math.min(Gu.ROWS.length - 1, y))]; var i = r.indexOf(','); return i < 0 ? 19 : i; }; // (the road's left square on that row)
  Ch.partySpeed = function (B) { var s = 30; (B.roam.members || []).forEach(function (u) { if (u.hp <= 0) return; var v = (u.speed || 30) * (u.conds && u.conds.haste ? 2 : 1); if (v > s) s = v; }); return s; };
  Ch.pace = function (B, c) { // (the pair's squares a square of the party's, now)
    if (c.leg >= 2) return Ch.PACE.fork;
    if (!c.horses) return Ch.PACE.foot;
    var spd = Ch.partySpeed(B); return spd > 30 ? Ch.PACE.horses * 30 / spd : Ch.PACE.horses; // (the party faster than the greys: the gap closes)
  };

  // ---------------------------------------------------------------- from the yard: AFTER THEM
  Ch.start = function* (B, o) { // (o: { horses, willem } -- the yard's own: the team loose or not, Willem still up)
    var R = D.roam, R0 = B.roam, f = R0.flags;
    f.wagonChase = { horses: !!o.horses, willem: !!o.willem, amara: o.amara !== false, leg: 1, gap: o.horses ? Ch.START.horses : Ch.START.foot, acc: 0, on: false, steps: 0, back: null, willemDead: !!o.willemDead }; // (amara: she is up -- the chase goes after whoever got away, 11-06; willemDead: killed in the yard, his book at the walk back)
    if (D.house && D.house.trail) D.house.trail('chase', 'after the wagon pair, ' + (o.horses ? 'on the greys' : 'on foot'));
    yield* In.card(B, [Ch.ln(f.wagonChase, 'chase1', L('wagon.chase1')), Ch.LINES.walk], 420);
    yield* M.pass(B, Ch.WALK_HOURS);
    yield* M.go(B, Gu.KEY, [22, 109], [0, -1]); // (the south mouth: js/gulch.js's south gate, a step in)
  };
  // on the gulch floor: the pair ahead on the road, the chase on (the floor's script runs this first -- R.script, below)
  Ch.run = function* (B) {
    var R = D.roam, R0 = B.roam, f = R0.flags, c = f.wagonChase, t = R0.token;
    if (!c || c.on || c.back) return;
    R0.encIn = 1e9; // (no spiders in the chase: the pair ahead have stirred the silk, and the party is running)
    Ch.place(B, c, Math.max(1, t.y - c.gap));
    c.on = true;
    yield* B.camTo({ gx: Ch.roadX(t.y - Math.floor(c.gap / 2)), gy: t.y - Math.floor(c.gap / 2), gz: 0 }, D.iso.zoom, 30);
    var faster = c.horses && Ch.partySpeed(B) > 30;
    yield* In.card(B, [Ch.ln(c, 'mouth', Ch.LINES.mouth), c.horses ? (faster ? Ch.ln(c, 'faster', Ch.LINES.faster) : Ch.ln(c, 'horses', Ch.LINES.horses)) : Ch.ln(c, 'foot', Ch.LINES.foot)], 480);
    B.focus(t);
  };
  Ch.place = function (B, c, y) { // (the pair stood on the road at row y, side by side; each only if still up -- Amara too since 11-06: a dead Amara rode in the chase)
    var x = Ch.roadX(y);
    Ch.clear(B);
    var mt = !!c.horses; // (on the greys, the pair drawn mounted and one behind the other on the two-square road: each a Large 2x2 -- js/battle.js Battle.mountUp, 11-05, RULED "Yes, as leaned")
    Ch.amara = c.amara !== false ? In.unit(B, { id: 'chaseAmara', kind: 'amara', at: [x, y], name: 'Amara', face: [0, -1], foe: true }) : null;
    Ch.willem = c.willem ? In.unit(B, { id: 'chaseWillem', kind: 'willem', at: mt && Ch.amara ? [Ch.roadX(y + 2), y + 2] : [x + (Ch.amara ? 1 : 0), y], name: 'Willem Glass', face: [0, -1], foe: true }) : null;
    if (mt) [Ch.amara, Ch.willem].forEach(function (u) { if (u) D.Battle.mountUp(B, u, 40); });
    c.y = y;
  };
  Ch.clear = function (B) { [Ch.amara, Ch.willem].forEach(function (u) { if (u && B.units.indexOf(u) >= 0) In.gone(B, u); }); Ch.amara = Ch.willem = null; };
  Ch.pair = function (B) { return [Ch.amara, Ch.willem].filter(function (u) { return u && B.units.indexOf(u) >= 0 && u.hp > 0 && !u.dead; }); };
  // each square the party walks up the road: the pair take their share, in sight or not; closed to two squares, the catch; the north mouth reached, the fork or the loss
  Ch.tick = function* (B) {
    var R0 = B.roam, f = R0.flags, c = f.wagonChase, t = R0.token; if (!c || !c.on) return null;
    R0.encIn = 1e9; c.steps++;
    var pair = Ch.pair(B); if (!pair.length) { c.on = false; return null; }
    c.acc += Ch.pace(B, c); var n = Math.floor(c.acc + 1e-9); c.acc -= n;
    var y1 = Math.max(1, c.y - n);
    if (y1 !== c.y) { var x1 = Ch.roadX(y1); pair.forEach(function (u, i) { u.tween = { fx: u.x, fy: u.y, fz: 0, t: 0, dur: In.PACE, mode: null }; u.facing = D.spr.facingFor(0, -1); u.anim = D.spr.anim(u.sheet, 'run') ? 'run' : 'walk'; u.animT = B.t; if ((u.size || 1) > 1) { u.x = Ch.roadX(y1 + 2 * i); u.y = y1 + 2 * i; } else { u.x = x1 + i; u.y = y1; } }); /* (a rider on a grey a 2x2 on the two-square road, one behind the other) */ c.y = y1; D.grid.setup(B.map, B.units); B.cache = null; } // (the pair's own run row where the sheet has one -- Amara's amara_p2; 11-04, Griz: "sure")
    if (t.y - c.y <= Ch.CATCH) { yield* Ch.caught(B, c); return 'chase'; }
    if (c.y <= 1) { yield* Ch.mouth(B, c); return 'chase'; }
    return null;
  };
  // the catch: a fight on the floor's own squares. The first: the pair run again from the first turn, and the road eight squares on is the way off; the last: nowhere left to run
  Ch.caught = function* (B, c) {
    var R = D.roam, R0 = B.roam, f = R0.flags, F = B.fight, keep = {}, pair = Ch.pair(B), last = c.leg >= 2;
    ['runWhenHurt', 'fledEnds', 'loosen', 'exit', 'noFlee'].forEach(function (k) { keep[k] = F[k]; });
    c.on = false;
    yield* In.card(B, [last ? Ch.ln(c, 'caught2', L('wagon.caught2')) : Ch.ln(c, 'caught1', L('wagon.caught1'))], 360);
    var exits = [];
    if (!last) { for (var y = Math.max(0, c.y - Ch.AWAY - 3); y <= Math.max(0, c.y - Ch.AWAY); y++) { var x = Ch.roadX(y); exits.push([x, y], [x + 1, y]); } }
    F.runWhenHurt = null; F.fledEnds = !last; F.loosen = null; F.exit = exits; F.noFlee = last;
    pair.forEach(function (u) { u.flees = !last; if (c.horses) D.Battle.mountUp(B, u, 40); delete u.roamAside; u.facing = D.spr.facingFor(0, 1); });
    R0.fights++; R0.lastOutcome = null;
    try { D.music('boss'); } catch (e) { }
    yield* R.engage(B, { foes: pair, why: 'chase', zone: null }, false, 'chase');
    var o = R0.lastOutcome;
    Object.keys(keep).forEach(function (k) { if (keep[k] === undefined) delete F[k]; else F[k] = keep[k]; });
    if (Ch.willem && (Ch.willem.hp <= 0 || Ch.willem.dead) && !Ch.willem.fled) c.willemDead = true;
    if (/^(lost|lose|dead|ko)$/.test(String(o))) return; // (the title: js/roam.js R.after)
    if (o === 'won' || (last && o !== 'escaped')) { yield* Ch.done(B, c, 'road'); return; }
    if (o === 'escaped') { yield* In.card(B, [Ch.ln(c, 'lostEscaped', Ch.LINES.lostEscaped)], 420); yield* Ch.done(B, c, 'fled'); return; }
    // away again: up the cut toward the fork, square for square (the first game's chase2)
    c.leg = 2; c.willem = !!(Ch.willem && Ch.willem.hp > 0 && (!Ch.willem.dead || Ch.willem.fled)); c.amara = !!(Ch.amara && Ch.amara.hp > 0 && (!Ch.amara.dead || Ch.amara.fled)); c.acc = 0; // (away off the floor is `dead` to the grid and `fled`: still up; the one killed in the first catch is not placed again -- 11-06)
    var t = R0.token; Ch.place(B, c, Math.max(1, t.y - Ch.START.foot));
    yield* In.card(B, [Ch.ln(c, 'chase2', L('wagon.chase2')), Ch.ln(c, 'again', Ch.LINES.again)], 420);
    c.on = true;
  };
  // the north mouth: with the greys, lost; on foot, the fork -- Willem's false pair if he is up, and the last catch
  Ch.mouth = function* (B, c) {
    var R0 = B.roam, f = R0.flags, t = R0.token;
    c.on = false;
    if (c.horses) { yield* In.card(B, [Ch.ln(c, 'lostHorses', Ch.LINES.lostHorses)], 480); f.towerFled = 1; Ch.clear(B); yield* Ch.done(B, c, 'fled'); return; }
    yield* In.card(B, [Ch.forkLine(c, M.hourNow(D.roam.q, B))], 360);
    if (c.willem) {
      yield* In.card(B, [Ch.LINES.forkTwo], 360);
      var a = yield* In.ask(B, 'THE FORK', [Ch.LINES.forkTwo], [Ch.LINES.opts.north, Ch.LINES.opts.west]);
      if (a !== 0) { yield* In.card(B, [L('wagon.fakeRider'), Ch.LINES.west], 480); f.towerFled = 1; Ch.clear(B); yield* Ch.done(B, c, 'fled'); return; }
      yield* In.card(B, [L('wagon.fakeRider').replace('Your hand goes through them. ', 'The pair going west thin and are gone: ')], 300);
    } else yield* In.card(B, [Ch.ln(c, 'forkOne', Ch.LINES.forkOne)], 300);
    // the last catch at the mouth: the pair stood two squares up the road from the party, nowhere left to run
    Ch.place(B, c, Math.max(1, t.y - Ch.CATCH)); c.leg = 2;
    yield* Ch.caught(B, c);
  };
  // the end, either way: the hours the chase took, the walk back to the inn's one lit window, the yard's own aftermath there (In.chaseBack)
  // (11-11, his note on eyes-gulchchase-1104: "The 'walk back in the dark' happened after morning in the gulch...": the walk's own hours had been passed on the gulch's floor
  // with the chase's -- its morning said there, the party still in it -- and then the dark's line. Now the chase's hours on the gulch, the walk back's line by the hour it sets
  // out, and the walk's hours spent off the gulch's floor: the inn's floor is laid at the hour they come in (M.go, the house's clock or the test door's &hour))
  Ch.backLine = function (h) { var tod = W.todAt ? W.todAt(h) : (M.night(h) ? 'night' : 'morning'); return tod === 'night' ? L('wagon.back') : tod === 'dawn' ? Ch.LINES.backDawn : Ch.LINES.backDay; };
  Ch.forkLine = function (c, h) { var ln = Ch.ln(c, 'fork', Ch.LINES.fork), tod = W.todAt ? W.todAt(h) : 'dawn'; return tod === 'night' ? ln.replace(' in the first grey of the dawn', ' in the dark') : ln; }; // (the fork by its hour too: the chase is often there by three in the morning)
  Ch.passWalk = function (B, hrs) { // (the clock on with no floor laid for it -- the party walking off this one; a Light's hour up said at the inn: js/house.js H.lightsOut)
    var S = W.state && W.state(), R0 = B.roam;
    if (D.roam.house() && S && S.t != null) { S.t += hrs; W.save(); } else R0.hour = ((R0.hour != null ? R0.hour : M.hourNow(D.roam.q, B)) + hrs) % 24;
    return D.roam.house() && D.house.lightsOut ? D.house.lightsOut(B) : [];
  };
  Ch.done = function* (B, c, how) {
    var R0 = B.roam, f = R0.flags;
    c.on = false; c.back = how; f.wagonOutcome = how === 'road' ? 'road' : 'fled';
    Ch.clear(B);
    if (how === 'road') yield* In.card(B, [Ch.LINES.done], 420);
    yield* M.pass(B, Math.round(c.steps / Ch.SQ_HOUR * 10) / 10);
    c.backAt = M.hourNow(D.roam.q, B);
    yield* In.card(B, [Ch.backLine(c.backAt)], 360);
    var lo = Ch.passWalk(B, Ch.WALK_HOURS);
    yield* M.go(B, In.KEY, [In.WAGONAT[0] + 6, In.WAGONAT[1] + 2], [-1, 0], lo.length ? ['{g}' + lo.join(' ') + '{/}'] : null);
  };

  // ---------------------------------------------------------------- the floors' scripts: the chase first on the gulch floor; the walk back's yard first on the inn's
  var script0 = D.roam.script;
  D.roam.script = function* (B) {
    var def = D.roam.def, c = Ch.state(B);
    if (c && def && def.key === Gu.KEY && !c.back) yield* Ch.run(B);
    if (c && def && def.key === In.KEY && c.back && In.chaseBack) yield* In.chaseBack(B);
    yield* script0.apply(this, arguments);
  };
  var arrive0 = D.roam.arrive;
  D.roam.arrive = function* (B) {
    var ev = yield* arrive0.apply(this, arguments), def = D.roam.def;
    if (!ev && def && def.key === Gu.KEY && Ch.state(B) && Ch.state(B).on && D.battle === B) return yield* Ch.tick(B);
    return ev;
  };
})();
