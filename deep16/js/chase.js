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
    done: 'It is over on the road. The inn is a long walk behind you.', // (11-12, ruling 51: it had said the wagon and its seven wait in the yard -- Doran has driven them off by now)
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
    if (c.leg === 1 && !c.webbed && !Ch.OLD_SILK) { yield* Ch.mouthCatch(B, c); B.focus(t); return; } // (RULED 11-12, ruling 55: the catch at the south mouth -- the run up the cut from here is only for a chase already past its strand)
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
  // THE SILK ACROSS THE ROAD (RULED 11-11, Griz: "yes to the gulch and greys", on the inn seat's lean to his 11-06 ask on eyes-wagonwatch-1105, "chase needs work (either the
  // horseback or not runners get stuck in webbing/jumped by a spider) or something that sensibly slows them down", and his 11-11 "like with a note to have amara and/or willem
  // caught in webbing at the gulch"; for the gulch it supersedes 11-04's "with horses losing them there is losing them"): midway up the cut, where the gulch's own webs come
  // down to the road (js/gulch.js Gu.ROWS 53-55), silk is strung across it -- on the chase's night the road's squares on that row are webbing (the floor's look, walked as
  // the bed). The pair run into it, on the greys or on foot, and are caught: restrained as by the SRD's Web, a Strength check at DC 12 to tear free, one try a turn (the
  // floor's turn, six of the party's steps -- js/roam.js R.tickGroups' round). One torn free runs on up the cut toward the fork; both torn free, the chase goes on as it was
  // (the greys lost at the north mouth). The party within two squares of one still caught: the catch is there, the one caught restrained in the fight (the grid's web: it
  // tears at it with its action, js/ai.js) -- and after it, the one who ran on is chased to the fork as after any catch. The seat's lines: invented.json halfway-chase-web
  Ch.WEB = { y: 104, dc: 12, round: 6 }; // (y: the strand's row -- the south mouth since 11-12, five squares in from the gate, ruling 55; it was 55, midway up the cut)
  Ch.WEBL = {
    caught: 'Midway up the cut the silk is strung across the road, and they run straight into it: caught fast.',
    caughtHorses: 'Midway up the cut the silk is strung across the road, and the greys run straight into it, screaming: the pair caught fast in the saddle.',
    caughtOne: 'Midway up the cut the silk is strung across the road, and {name} runs straight into it: caught fast.',
    free: '{name} tears free of the silk and is away up the cut.',
    both: 'Free of the silk, and away up the cut again.',
    catch: 'You come up on them where the silk holds them.',
    catchOne: 'You come up on {name} where the silk holds.'
  };
  Ch.strMod = function (u) { var a = u.abil || (D.FOES[u.kind] || {}).abil || {}; return Math.floor(((a.str != null ? a.str : 10) - 10) / 2); };
  Ch.webbed = function (B) { return Ch.pair(B).filter(function (u) { return u.webbed; }); };
  Ch.webCaught = function* (B, c, pair) {
    c.webbed = true; c.web = { on: true, steps: 0, ahead: null };
    pair.forEach(function (u) { u.webbed = true; u.anim = 'idle'; u.animT = B.t; if (D.fx) D.fx.sparkle(u, 'bone', 12); });
    if (D.house && D.house.trail) D.house.trail('chase', 'the pair caught in the silk across the road, row ' + Ch.WEB.y);
    D.sfx('miss');
    yield* In.card(B, [pair.length > 1 ? (c.horses ? Ch.WEBL.caughtHorses : Ch.WEBL.caught) : Ch.WEBL.caughtOne.split('{name}').join(pair[0].name)], 420);
  };
  // a turn at the strand: each one caught tries its Strength once (the party's six steps); the one torn free runs on out of sight, or both on together
  Ch.webTick = function* (B, c) {
    var w = c.web; w.steps++;
    if (w.steps % Ch.WEB.round) return;
    var stuck = Ch.webbed(B), freed = [];
    stuck.forEach(function (u) {
      var r = In.d20(), m = Ch.strMod(u), ok = r + m >= Ch.WEB.dc;
      if (D.house && D.house.trail) D.house.trail('check', 'the silk: ' + u.name + ' Strength ' + r + (m < 0 ? ' - ' : ' + ') + Math.abs(m) + ' vs DC ' + Ch.WEB.dc + (ok ? ', torn free' : ', held'));
      if (ok) { u.webbed = false; freed.push(u); }
    });
    if (!freed.length) return;
    if (!Ch.webbed(B).length) { // (none held now: on up the cut, the one who ran on first with them)
      w.on = false; if (w.ahead) Ch.place(B, c, c.y);
      yield* In.card(B, [stuck.length + (w.ahead ? 1 : 0) > 1 ? Ch.WEBL.both : Ch.WEBL.free.split('{name}').join(freed[0].name)], 360); return;
    }
    freed.forEach(function (u) { w.ahead = u.name; In.gone(B, u); }); // (out of sight up the cut: Ch.willem or Ch.amara kept, still up, for the chase after the catch)
    yield* In.card(B, freed.map(function (u) { return Ch.WEBL.free.split('{name}').join(u.name); }), 360);
  };
  // the strand on the floor while the chase is on (the gulch's own webbing on the road's squares of its row)
  var gmap0 = M.FLOORS[Gu.KEY] && M.FLOORS[Gu.KEY].map;
  if (gmap0) M.FLOORS[Gu.KEY].map = function (hour, flags) {
    var d = gmap0.apply(this, arguments), c = flags && flags.wagonChase; if (!c || c.back || !d || !d.rows) return d;
    d.rows = d.rows.map(function (r, y) { return y === Ch.WEB.y ? r.replace(/,/g, 'x') : r; });
    return d;
  };
  // each square the party walks up the road: the pair take their share, in sight or not; closed to two squares, the catch; the north mouth reached, the fork or the loss
  Ch.tick = function* (B) {
    var R0 = B.roam, f = R0.flags, c = f.wagonChase, t = R0.token; if (!c || !c.on) return null;
    R0.encIn = 1e9; c.steps++;
    var pair = Ch.pair(B); if (!pair.length && !(c.web && c.web.on && c.web.ahead)) { c.on = false; return null; }
    if (c.web && c.web.on) { // (held in the silk: they stay; a turn's try; the party up to them, the catch there)
      yield* Ch.webTick(B, c);
      if (c.web.on) { if (t.y - c.y <= Ch.CATCH) { yield* Ch.caught(B, c, true); return 'chase'; } return null; }
      pair = Ch.pair(B);
    }
    c.acc += Ch.pace(B, c); var n = Math.floor(c.acc + 1e-9); c.acc -= n;
    var y1 = Math.max(1, c.y - n), web = !c.webbed && c.y > Ch.WEB.y && y1 <= Ch.WEB.y; if (web) y1 = Ch.WEB.y; // (the strand stops them on its row)
    if (y1 !== c.y) { var x1 = Ch.roadX(y1); pair.forEach(function (u, i) { u.tween = { fx: u.x, fy: u.y, fz: 0, t: 0, dur: In.PACE, mode: null }; u.facing = D.spr.facingFor(0, -1); u.anim = D.spr.anim(u.sheet, 'run') ? 'run' : 'walk'; u.animT = B.t; if ((u.size || 1) > 1) { u.x = Ch.roadX(y1 + 2 * i); u.y = y1 + 2 * i; } else { u.x = x1 + i; u.y = y1; } }); /* (a rider on a grey a 2x2 on the two-square road, one behind the other) */ c.y = y1; D.grid.setup(B.map, B.units); B.cache = null; } // (the pair's own run row where the sheet has one -- Amara's amara_p2; 11-04, Griz: "sure")
    if (web) { yield* Ch.webCaught(B, c, pair); if (t.y - c.y <= Ch.CATCH) { yield* Ch.caught(B, c, true); return 'chase'; } return null; }
    if (t.y - c.y <= Ch.CATCH) { yield* Ch.caught(B, c); return 'chase'; }
    if (c.y <= 1) { yield* Ch.mouth(B, c); return 'chase'; }
    return null;
  };
  // the catch: a fight on the floor's own squares. The first: the pair run again from the first turn, and the road eight squares on is the way off; the last: nowhere left to run
  // (web: the catch at the silk -- the ones held there restrained in the fight, never the last catch; one who tore free and ran on is chased after it, Ch.webTick)
  Ch.caught = function* (B, c, web) {
    var R = D.roam, R0 = B.roam, f = R0.flags, F = B.fight, keep = {}, pair = Ch.pair(B), last = c.leg >= 2 && !web, ahead = web && c.web ? c.web.ahead : null;
    ['runWhenHurt', 'fledEnds', 'loosen', 'exit', 'noFlee'].forEach(function (k) { keep[k] = F[k]; });
    c.on = false; if (c.web) c.web.on = false;
    yield* In.card(B, [web ? (pair.length > 1 ? Ch.WEBL.catch : Ch.WEBL.catchOne.split('{name}').join(pair[0] ? pair[0].name : '')) : last ? Ch.ln(c, 'caught2', L('wagon.caught2')) : Ch.ln(c, 'caught1', L('wagon.caught1'))], 360);
    if (web) pair.forEach(function (u) { if (u.webbed) { u.conds = u.conds || {}; u.conds.restrained = { dc: Ch.WEB.dc, by: 'web', kind: 'web' }; } u.webbed = false; }); // (the grid's web: it tears at it with its action, js/ai.js)
    var exits = [];
    if (!last) { for (var y = Math.max(0, c.y - Ch.AWAY - 3); y <= Math.max(0, c.y - Ch.AWAY); y++) { var x = Ch.roadX(y); exits.push([x, y], [x + 1, y]); } }
    F.runWhenHurt = null; F.fledEnds = !last; F.loosen = null; F.exit = exits; F.noFlee = last;
    pair.forEach(function (u) { u.flees = !last; if (c.horses) D.Battle.mountUp(B, u, 40); delete u.roamAside; u.facing = D.spr.facingFor(0, 1); });
    R0.fights++; R0.lastOutcome = null;
    try { D.music('boss'); } catch (e) { }
    var unBook = Ch.bookPay(B, c), unBy = Ch.onlookers(B);
    try { yield* R.engage(B, { foes: pair, why: 'chase', zone: null }, false, 'chase'); } finally { unBook(); unBy(); }
    var o = R0.lastOutcome;
    Object.keys(keep).forEach(function (k) { if (keep[k] === undefined) delete F[k]; else F[k] = keep[k]; });
    if (Ch.willem && (Ch.willem.hp <= 0 || Ch.willem.dead) && !Ch.willem.fled) c.willemDead = true;
    if (/^(lost|lose|dead|ko)$/.test(String(o))) return; // (the title: js/roam.js R.after)
    if ((o === 'won' && !ahead) || (last && o !== 'escaped')) { yield* Ch.done(B, c, 'road'); return; } // (won at the silk with one run on ahead: after that one, below)
    if (o === 'escaped') { yield* In.card(B, [Ch.ln(c, 'lostEscaped', Ch.LINES.lostEscaped)], 420); yield* Ch.done(B, c, 'fled'); return; }
    // away again: up the cut toward the fork, square for square (the first game's chase2)
    c.leg = 2; c.willem = !!(Ch.willem && Ch.willem.hp > 0 && (!Ch.willem.dead || Ch.willem.fled)); c.amara = !!(Ch.amara && Ch.amara.hp > 0 && (!Ch.amara.dead || Ch.amara.fled)); c.acc = 0; // (away off the floor is `dead` to the grid and `fled`: still up; the one killed in the first catch is not placed again -- 11-06)
    var t = R0.token; Ch.place(B, c, Math.max(1, t.y - Ch.START.foot));
    yield* In.card(B, [Ch.ln(c, 'chase2', L('wagon.chase2')), Ch.ln(c, 'again', Ch.LINES.again)], 420);
    c.on = true;
  };
  // THE CATCH AT THE SOUTH MOUTH (RULED 11-12, ruling 55, Griz on the reading page's lean "build your 10:01Z shape as written, the fight opening at the gulch's south
  // mouth ... once Willem is free the two make for the horses at the north exit squares": "yes"; his 10:01Z note of 11-11 on the silk: "Prefer instant combat (they're
  // caught in the web at the gulch entrance), if they strike him she'd turn back to fight til he was free, then try to escape - have them get exit squares like the
  // party does on a roam, and if they hit him dismount them both to fight a round with the horses at the northern exit squares"). It supersedes the silk midway up the
  // cut (11-11): the strand is strung at the south mouth (Ch.WEB.y), the party comes in on it and the fight opens AT ONCE. Willem is fast in the silk (the grid's web:
  // restrained, he tears at it with his action); Amara is past it and RUNS for the pair's exit squares, the road eight squares on -- unless Willem is struck at: then
  // she turns back and fights until he is free (on the greys, both come down to fight and the greys stand at the north exit squares); once he is out of the silk the
  // two make for the exits, and one who gets there is away. After it, whoever got away is chased up the cut as after any catch (the fork; on a grey, the north mouth).
  // With only one of them on the road, that one is the one caught
  Ch.MOUTHL = {
    caught: 'Web Gulch, the south mouth. Silk is strung across the road, and Willem Glass is fast in it. Amara is three strides past it, and running.',
    caughtHorses: 'Web Gulch, the south mouth. Silk is strung across the road, and Willem\'s grey is fast in it, screaming. Amara\'s is through, and she does not look back.',
    caughtOne: 'Web Gulch, the south mouth. Silk is strung across the road, and {name} is fast in it.',
    turn: '{r}Amara{/} turns back for him.', turnHorses: '{r}Amara{/} comes down off her grey and turns back for him. The greys go on up the road, and stand.',
    free: '{r}{name}{/} is out of the silk. They make for the road north.', freeHorses: '{r}{name}{/} is out of the silk. They make for the greys.', freeOne: '{r}{name}{/} is out of the silk, and runs.'
  };
  // HIS BOOK ON THE FIGHT'S OWN VICTORY (11-13, Griz on eyes-chase-southmouth-1112f, 0327Z: "the book reward should come in the gulch as part of the victory screen"): Willem
  // killed in a catch on the road, his book is a line of that fight's VICTORY panel (js/roam.js R.pay's lines, the gather's) and in the pack there and then -- not a card back
  // in the inn's yard. One killed in the yard before the chase began (c.willemDead as it starts) is still the yard's to give, at the walk back (In.chaseBack's panel)
  Ch.bookPay = function (B, c) {
    var R = D.roam, pay0 = R.pay;
    R.pay = function (Bp) {
      var ls = pay0.apply(this, arguments) || [], st = D.counter.state(Bp), w = Ch.willem;
      if (Bp === B && w && (w.hp <= 0 || w.dead) && !w.fled && !In.has(st, 'willembook')) { D.counter.give(st, 'willembook', 1); c.willemDead = true; c.bookRoad = 1; In.trail("his book, on the road: a line of that fight's own VICTORY"); ls = ls.concat([In.WN.book, L('g.got', { item: DS.DATA.items.willembook.name })]); }
      return ls;
    };
    return function () { R.pay = pay0; };
  };
  // NOBODY ELSE ON THE ROAD IS THE PAIR'S TO GO AT (11-13, Griz on eyes-chase-southmouth-1112f, 0327Z: "amara turned back the round after willem was hit (her turn that round
  // she ran past the horses)"; his fight of 03:09Z, R1: struck at, the card said she turned back, and on her own turn she dashed 80 ft north). What it was: in the gulch's
  // dark she saw none of the four, and did see the children by the ettercap's fire at the far end of the cut -- the party's side, lit, 490 ft off -- so "close on the
  // nearest" (js/tactics.js act) took her up the road toward them. For a catch on the road those who are not the party's own are onlookers (js/ai.js `bystander`): with
  // nobody seen she goes by ear at the nearest of the four, the turn she is given
  Ch.onlookers = function (B) {
    var ms = (B.roam && B.roam.members) || [], set = B.units.filter(function (u) { return u.side === 'party' && ms.indexOf(u) < 0 && !u.bystander && !u.summon && !u.familiar; });
    set.forEach(function (u) { u.bystander = true; });
    return function () { set.forEach(function (u) { delete u.bystander; }); };
  };
  Ch.mouthCatch = function* (B, c) {
    var R = D.roam, R0 = B.roam, f = R0.flags, F = B.fight, G = D.grid, keep = {}, t = R0.token, y = Ch.WEB.y, x = Ch.roadX(y), mt = !!c.horses;
    ['runWhenHurt', 'fledEnds', 'loosen', 'exit', 'noFlee'].forEach(function (k) { keep[k] = F[k]; });
    c.webbed = true; c.on = false; c.y = y; Ch.clear(B);
    Ch.willem = c.willem ? In.unit(B, { id: 'chaseWillem', kind: 'willem', at: [x, y], name: 'Willem Glass', face: [0, -1], foe: true }) : null;
    Ch.amara = c.amara !== false ? In.unit(B, { id: 'chaseAmara', kind: 'amara', at: Ch.willem ? [Ch.roadX(y - 3), y - 3] : [x, y], name: 'Amara', face: [0, -1], foe: true }) : null;
    var held = Ch.willem || Ch.amara, other = held === Ch.willem ? Ch.amara : null; if (!held) return;
    if (mt) [Ch.amara, Ch.willem].forEach(function (u) { if (u) D.Battle.mountUp(B, u, 40); });
    held.conds = held.conds || {}; held.conds.restrained = { dc: Ch.WEB.dc, by: 'web', kind: 'web' };
    if (D.house && D.house.trail) D.house.trail('chase', 'the catch at the south mouth: ' + held.name + ' in the silk' + (other ? ', ' + other.name + ' running' : ''));
    yield* B.camTo({ gx: x, gy: y - 1, gz: 0 }, D.iso.zoom, 30);
    yield* In.card(B, [other ? (mt ? Ch.MOUTHL.caughtHorses : Ch.MOUTHL.caught) : Ch.MOUTHL.caughtOne.split('{name}').join(held.name)], 420);
    var exits = [], ey; for (ey = Math.max(0, y - Ch.AWAY - 3); ey <= Math.max(0, y - Ch.AWAY); ey++) { var ex = Ch.roadX(ey); exits.push([ex, ey], [ex + 1, ey]); }
    F.runWhenHurt = null; F.fledEnds = true; F.loosen = null; F.exit = exits; F.noFlee = false;
    held.flees = false; delete held.roamAside; if (other) { other.flees = true; delete other.roamAside; }
    var S = Ch.mouthS = { held: held, other: other, struck: false, freed: false, exits: exits, riders: [] }, self = B;
    S.turn = function () { // (struck at: she turns back; on the greys both come down, and the greys stand at the north exit squares)
      if (S.struck || S.freed) return; S.struck = true;
      if (other && G.standing(other)) { other.flees = false; other.fleeing = false; }
      if (mt) {
        [held, other].forEach(function (u) { if (u && u.mounted) D.Battle.dismount(self, u); });
        S.riders = [0, 2].map(function (k) { var ry = Math.max(0, y - Ch.AWAY - 1 - k); return { x: Ch.roadX(ry), y: ry, sheet: 'horsegrey_p1', facing: 3, gz: 0, foot: [2, 1], chase: true, anim: 'idle', animT: 0 }; }).slice(0, other ? 2 : 1);
        self.riders = (self.riders || []).concat(S.riders);
      }
      G.setup(self.map, self.units); self.cache = null;
      if (other && G.standing(other)) self.card([mt ? Ch.MOUTHL.turnHorses : Ch.MOUTHL.turn], 300);
      if (D.house && D.house.trail) D.house.trail('chase', held.name + ' struck at in the silk' + (other ? ': ' + other.name + ' turns back' : ''));
    };
    S.check = function () { // (out of the silk: the two make for the exits)
      if (S.freed || !G.standing(held) || (held.conds && held.conds.restrained)) return; S.freed = true;
      held.flees = true; if (other && G.standing(other)) other.flees = true;
      self.card([(other && G.standing(other) ? (mt ? Ch.MOUTHL.freeHorses : Ch.MOUTHL.free) : Ch.MOUTHL.freeOne).split('{name}').join(held.name)], 300);
    };
    var ownAtk = B.hasOwnProperty('attack'), atk0 = B.attack, hurt0 = B.hurt, turn0 = D.ai.turn, unBook = Ch.bookPay(B, c), unBy = Ch.onlookers(B);
    B.attack = function* (att, tgt) { if (tgt === held && att && att.side === 'party') S.turn(); return yield* atk0.apply(this, arguments); };
    B.hurt = function (u, n) { if (u === held && n > 0 && self.active && self.active.side === 'party') S.turn(); return hurt0.apply(this, arguments); };
    D.ai.turn = function* (Bf, u) { if (Bf === self) S.check(); yield* turn0.apply(this, arguments); if (Bf === self) S.check(); };
    R0.fights++; R0.lastOutcome = null;
    try { D.music('boss'); } catch (e) { }
    try { yield* R.engage(B, { foes: [held].concat(other ? [other] : []), why: 'chase', zone: null }, false, 'chase'); }
    finally { if (!ownAtk) delete B.attack; else B.attack = atk0; B.hurt = hurt0; D.ai.turn = turn0; B.riders = (B.riders || []).filter(function (r) { return !r.chase; }); Ch.mouthS = null; unBook(); unBy(); }
    var o = R0.lastOutcome;
    Object.keys(keep).forEach(function (k) { if (keep[k] === undefined) delete F[k]; else F[k] = keep[k]; });
    if (Ch.willem && (Ch.willem.hp <= 0 || Ch.willem.dead) && !Ch.willem.fled) c.willemDead = true;
    if (/^(lost|lose|dead|ko)$/.test(String(o))) return;
    if (o === 'won') { yield* Ch.done(B, c, 'road'); return; }
    if (o === 'escaped') { yield* In.card(B, [Ch.ln(c, 'lostEscaped', Ch.LINES.lostEscaped)], 420); yield* Ch.done(B, c, 'fled'); return; }
    // away: up the cut toward the fork, as after any catch
    c.leg = 2; c.willem = !!(Ch.willem && Ch.willem.hp > 0 && (!Ch.willem.dead || Ch.willem.fled)); c.amara = !!(Ch.amara && Ch.amara.hp > 0 && (!Ch.amara.dead || Ch.amara.fled)); c.acc = 0;
    Ch.place(B, c, Math.max(1, t.y - Ch.START.foot));
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
