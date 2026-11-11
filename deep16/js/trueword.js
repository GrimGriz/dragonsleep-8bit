/* DEEP16 -- THE GLORY-SEEKERS ON THE ROAD, AND TRUE WORD OF THE GNOLLS (11-11, the trueword seat, started by the lanes desk on Griz's 11-10: "A priority for this new
   5-hours window will be the gnoll fight/true word/hideous easter egg port over"). The first game's road south (its js/events.js S.snoot: a glory-seeker, three gnolls,
   three hyenas, the challenge by day; won, the anchor-pin and renown) brought onto THE WORLD's Pit road, with the council's true word as one quest in the JOURNAL:
     - the clock lane's 2026-11-04 night item 4, RULED, his "yes, and a quest for it in their journal": the council points the party down the road past the inn for a
       true word on the Snoot;
     - its 2026-11-05 design, his words: "It seems like 'true word' is going to be completable with various levels of thoroughness (i.e. whether they got certain
       information from the waterby's (or mirror beast encounters) and the traditional mission complete on ye'olde hideous laughter - and whether they deliver kat's book
       before collecting - and that while the gold-pay out should be static, xp should increase for story info completeness".
   THE MEETING (RULED 11-11, Griz to the lanes desk: "1 - lean, happens once doesn't apply to 'back away' / 2 - lean / 3 - hessle / 4 - lean / 5 - the easy way and I'll look at it / 6 - both" -- the seat's six as leaned; the clock lane's 2026-11-11 section): on THE WORLD's Pit road south of the Halfway Inn (more than TW.CLEAR miles south of the inn's
   mile and short of the Pit by as much), by day (TW.HOURS), from day TW.FROM_DAY (the Gray Keeping's young blood harry the edge farms first, RULED 11-04 item 3; the farmers reach
   the inn on day 7), the first step the party takes there -- the first game's card (road.snoot), FIGHT or BACK AWAY (back up the road a hex, as the first game's run walked
   back; met again on the next step south). The fight is the grid's own `snoot` (data/fights.js, the map snootroad), the house's: the joke egg can come up in it
   (js/grimoire.js M.jokeMain reads B.o.house). Won: snootDone, the anchor-pin (road.snootPin), renown 1 (renown.snoot). One meeting a save.
   THE QUEST: `trueword` in the JOURNAL, opened by the board's Snoot paper (js/hours.js H16.boardPlay) or the win; done when Hessle pays true word (js/counter.js C.hessle,
   `snootWord`). THE PIECES (TW.PIECES) are what the party brings back, shown in the JOURNAL as they are gathered; at the scales the gold is the board's, static (500 sp),
   and Hessle writes down each piece, TW.XP to each one standing for each (banked for the long rest, js/house.js H.bank). The words are the seat's drafts (RULED 09-24: the
   drafts stand; invented.json trueword-road-1111). The show: deep16/?trueshow. The bench: dev/bench16.js mode=trueword1111. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, W = D.world, Wg = D.wagon, C = D.counter, In = D.inn, TW = D.trueword = {};
  if (!W || !Wg || !C) return;
  var L = function (k, o) { return C.L(k, o); };
  var K = function (q, r) { return q + ',' + r; };

  // ---------------------------------------------------------------- where and when (RULED 11-11, his "1 - lean": once a save, BACK AWAY not counted)
  TW.FROM_DAY = 5;       // (THE WORLD's day, W.day: Day 1 the sunrise after the moot -- the young blood out after the edge farms from the first making day)
  TW.HOURS = [7, 19];    // (the challenge by day: seven to seven, the cart's hours -- js/wagon.js Wg.CART)
  TW.CLEAR = 2;          // (miles: past the inn's yard, short of the Pit's edge)
  TW.flags = function () { return (W.house() && D.house.cur.flags) || TW.testFlags || {}; };
  TW.due = function (f) { f = f || TW.flags(); if (f.snootDone) return false; var h = W.hour(); return W.day() >= TW.FROM_DAY && h >= TW.HOURS[0] && h < TW.HOURS[1]; };
  TW.south = function () { // (the party's mile on the Pit road south of the inn, or null)
    var S = W.state(), m = W.M(), R = Wg.route(); if (!S || !m || !R) return null;
    var P = m.road && m.road[K(S.at[0], S.at[1])]; if (!P || P.id !== 'pitroad') return null;
    var p = Wg.roadS(W.restPt()); if (p.d > m.w) return null;
    return p.s < R.inn - TW.CLEAR && p.s > TW.CLEAR ? p : null;
  };
  TW.meeting = function (scene) { if (!W.house() || /[?&]nosnoot\b/.test((scene && scene.q) || '')) return false; return TW.due() && !!TW.south(); };
  var step0 = W.onStep;
  W.onStep = function (scene, st) { // (THE WORLD's step: the wagon first where both fall on one step -- js/wagon.js; then the glory-seekers; then the gulch and the road's fights)
    if (Wg.meeting && Wg.meeting(scene, st)) return step0.apply(this, arguments);
    if (TW.meeting(scene)) { TW.meet(scene); return true; }
    return step0 ? step0.apply(this, arguments) : false;
  };

  // ---------------------------------------------------------------- the meeting: the first game's card, FIGHT or BACK AWAY
  TW.meet = function (scene) {
    var f = TW.flags(), self = scene; f.snootMet = (f.snootMet || 0) + 1;
    if (D.house && D.house.trail) D.house.trail('talk', 'the glory-seekers on the Pit road south of the inn, day ' + W.day());
    D.sfx('encounter'); scene.walk = null; scene.plan = null;
    scene.card(['{r}The Pit road{/}, ' + W.timeOfDay() + ':'].concat(Wg.wrap([].concat(L('road.snoot')))).concat(['', D.keys('{g}E{/}: fight    {g}X{/}: back away')]), null,
      [['a', function () { TW.fight(self); }, 'FIGHT'], ['b', function () { TW.backAway(self); self.say(TW.WORDS.back); }, 'BACK AWAY']]);
  };
  TW.backAway = function (scene) { // (a hex back up the road, the way the party came: the first game's run walked back a step)
    var S = W.state(); if (!S || !S.from) return;
    var fr = S.from.slice(); S.from = S.at.slice(); S.at = fr; S.pos = W.hc(fr[0], fr[1]); S.rv = null; W.save();
  };

  // ---------------------------------------------------------------- the fight: the grid's `snoot` on snootroad, the house's own (the joke egg's main game)
  TW.fight = function (scene) {
    var H = D.house, F0 = D.fight && D.fight('snoot'); if (!F0 || !H || !H.playing) return;
    var F = Object.assign({}, F0, { level: (H.cur.party[0] || {}).lvl || F0.level, sub: 'the Pit road, south of the Halfway Inn, by day' });
    var rec = { fight: 'snoot', name: 'The Pit road: ' + F.name, level: (H.cur.party[0] || {}).lvl, simple: false };
    var recEnd = function (b, res) { if (b && b.rec && D.rec && D.rec.finish) { try { D.rec.finish(b, res || 'left'); } catch (e) { /* (the record must never stop the way back) */ } } };
    var b = new D.Battle({ fightDef: F, data: H.living(H.cur), house: true, world: true, record: rec,
      payNow: function (bb, res) { var pf = H.payFight(bb, res); bb.housePay = pf; return pf.lines; },
      onDone: function (res) { recEnd(b, res); TW.afterFight(scene, res, b); } });
    TW.lastFight = b; D.push(b);
    return b;
  };
  TW.afterFight = function (scene, res, b) {
    var H = D.house, f = TW.flags(), S = W.state();
    try { D.music('corridor'); } catch (e) { }
    var ln = H.afterFight(b, res); if (ln === null) return; // (a loss: the title, js/house.js H.lost -- the egg, if it came up, kept first)
    S.t += W.FIGHT_HOURS; W.save();
    if (res !== 'won') { TW.backAway(scene); scene.say(TW.WORDS.fled); return; }
    TW.won(scene);
  };
  TW.won = function (scene) { // (the win's spoils and its card: snootDone, the pin, renown 1 -- the first game's S.snoot)
    var f = TW.flags(); f.snootDone = 1; f.heardTrueWord = 1;
    var st = C.state(null); C.give(st, 'anchorpin', 1); D.sfx('chest');
    var lines = [].concat(L('road.snootDone'), L('road.snootPin'), [L('g.got', { item: DS.DATA.items.anchorpin.name })], C.renown(st, 1, 'renown.snoot'));
    W.save();
    var sc = new C.Counter(null, { id: 'snootRoad', name: 'The glory-seekers', place: 'The Pit road', what: 'south of the Halfway Inn', pic: TW.pic, script: function (s) { return (function* () { yield s.narr(lines); })(); } });
    D.push(sc);
    if (scene) Wg.then(scene, function () { scene.say(TW.WORDS.open + ' ' + W.timeOfDay().replace(/^./, function (c) { return c.toUpperCase(); }) + '.'); });
    return sc;
  };
  // the counter's picture: the road by day, the glory-seeker on it (its own figure, data/foes.js gloryseeker)
  TW.pic = function (ctx, x, y, wd, h, t) {
    ctx.fillStyle = '#3a4a70'; ctx.fillRect(x, y, wd, h); ctx.fillStyle = '#5a6a3a'; ctx.fillRect(x, y + h * 0.55, wd, h * 0.45);
    ctx.fillStyle = '#7a6040'; ctx.fillRect(x + wd * 0.38, y + h * 0.55, wd * 0.24, h * 0.45); // (the road, going south)
    try { var sh = (D.FOES.gloryseeker || {}).sheet; if (D.spr && D.spr.draw && D.SHEETS[sh]) D.spr.draw(ctx, sh, 'idle', D.spr.facingFor(0, 1), t, x + wd * 0.5, y + h * 0.8, {}); } catch (e) { }
    ctx.fillStyle = '#f8d878'; ctx.font = '10px monospace'; ctx.fillText('the road south', x + 10, y + 16);
  };
  TW.WORDS = { // (the seat's drafts: invented.json trueword-road-1111)
    back: 'The party falls back up the road. The gnolls stay where they are, laughing at it.',
    fled: 'The party got clear of them, back up the road. The glory-seekers hold it, yelping after you.',
    open: 'The road south is open, for now.'
  };

  // ---------------------------------------------------------------- what the party brings back (his 11-05 list): each a flag the JOURNAL shows as it is gathered
  TW.PIECES = [
    { id: 'meal', label: 'what the Waterbys told at their table', has: function (f) { return !!(In && In.MEAL) && In.MEAL.bands.some(function (b) { return f[b.id] === 'true'; }); },
      told: '"The Waterbys\' table at the Halfway Inn hears the whole road, and they told you this?" Hessle writes it down word for word.' },
    { id: 'mirror', label: 'the mirror-made, met on the road', has: function (f) { return !!f.sawMirror; },
      told: '"Beasts with your own face in their eyes. On the road." His pen stops, then goes on. "The council hears that first."' },
    { id: 'vision', label: 'the traveler\'s vision of the moot', has: function (f) { return !!f.katVision; },
      told: '"A vision of the moot, and of something made there that walked away north." He writes it slowly, all of it.' },
    { id: 'book', label: 'Katarina\'s book, in Androit\'s hands', has: function (f) { return !!f.katBookAndroit; },
      told: '"Androit has her book already? Then he\'ll swear to the rest of this." He turns back a page and adds a line.' }
  ];
  TW.XP = 150; // (each one standing, a piece -- RULED 11-11, his "4 - lean"; the gold is static, at Hessle's scales: "3 - hessle")
  TW.gathered = function (f) { f = f || {}; return TW.PIECES.filter(function (p) { return p.has(f); }); };
  TW.TEXT = 'Fifty gold on Hessle\'s board for true word of the gnolls, sworn before Androit: what lit the Snoot, and who stood by when it caught. Their young blood are on the road south past the Halfway Inn, by day. Whatever else you learn of it, Hessle writes down.';
  TW.MISSION = { id: 'trueword', name: 'True Word of the Gnolls', show: 'flag:heardTrueWord|flag:snootDone|has:anchorpin', done: 'flag:snootWord',
    text: function (st) { var g = TW.gathered(st && st.flags); return TW.TEXT + ' Brought back so far: ' + (g.length ? g.map(function (p) { return p.label; }).join('; ') : 'nothing yet') + '.'; },
    doneText: 'Hessle weighed the pin, wrote down all you brought back of the gnolls, and paid the fifty gold.',
    steps: [{ 'if': 'has:anchorpin', key: 'pin', door: 'hessle', where: 'Take the anchor-pin to Hessle at the Weigh-House, on Fountain Street. Tell him the rest there: the scales pay the same gold, but he writes down everything.' },
      { 'if': '!flag:snootDone', site: 'inn', where: 'THE SNOOT\'S YOUNG BLOOD: gnoll glory-seekers range south of the Halfway Inn. The challenge by day. The Pit road south of the inn, toward Tarlyn\'s Pit: the Snoot\'s young blood are on it by day. Out of Silverton by the east gate, down the road past the fork, through Web Gulch to the inn, then on south.' }] };
  if (D.hours && D.hours.GATE_TO && !D.hours.GATE_TO.inn) D.hours.GATE_TO.inn = 'east'; // (the street's arrow for the step on the road past the inn: the east gate, as Web Gulch's -- js/hours.js H16.pinSq)
  C.OWN_QUESTS = C.OWN_QUESTS.filter(function (q) { return q.id !== 'trueword'; }).concat([TW.MISSION]);
  if (C.QUESTS.indexOf('trueword') < 0) { var ie = C.QUESTS.indexOf('ettercap'); C.QUESTS.splice(ie >= 0 ? ie + 1 : C.QUESTS.length, 0, 'trueword'); }

  // the turn-in at the scales (js/counter.js C.hessle, the anchor-pin paid): the board's gold as built; each piece told, a line of Hessle\'s; the XP by the pieces. Returns the lines
  TW.turnIn = function (st) {
    var f = st.flags, g = TW.gathered(f), lines = [], H = D.house; f.trueWordPieces = g.map(function (p) { return p.id; }).join(',') || 'none';
    if (!g.length) lines.push(TW.NONE);
    g.forEach(function (p) { lines.push(p.told); });
    var standing = st.party.filter(function (h) { return h.hp > 0 && !h.dead; });
    if (g.length && H && H.bank && standing.length) { var bk = H.bank(TW.XP * g.length * standing.length, standing); if (bk.line) lines.push(bk.line); }
    return lines;
  };
  TW.NONE = '"The pin\'s enough to pay on. It isn\'t much of a story." He writes one line.';

  // ---------------------------------------------------------------- THE COUNCIL SENDS FOR YOU AGAIN (RULED 11-04, the clock lane's item 4, his "yes, and a quest for it in their
  // journal": the council points the party down the road past the inn for a true word; Merrick at C2 had said it, "After the gulch, the gnolls ... When it's time, we'll send for
  // you again"). RULED 11-11, his "2 - lean" (both ways in, one quest): once the council has looked them over (C2, councilSeen) and the gulch's fangs are paid (ettercapDone), Papa's runner again --
  // on Silverton's street or the Hex's ground floor -- and up on the third floor the council at the long table swears them to the true word: TRUE WORD OF THE GNOLLS opened and
  // pinned (councilWord). Not once the true word is paid (snootWord). The same machine as C2 (js/hours.js H16.lookDue, H16.lookPlay, H16.atTable, H16.sitting); the lines the
  // seat's drafts (invented.json trueword-council-1111)
  var H16 = D.hours;
  if (H16 && H16.COUNCIL && H16.lookDue && H16.lookPlay && H16.atTable && H16.sitting) {
    H16.COUNCIL.word = { flag: 'councilWord', card: 'The council sits at the long table again. Warda shows the party in. Hessle has the board\'s sealed paper in front of him.', opens: 'heardTrueWord', pin: 'trueword', lines: [
      ['papa', 'The gulch is clear and the wagons are moving. You did that. Now the other thing.'],
      ['androit', 'Fifty gold for true word of the gnolls, sworn before me. Not what the drovers say: what lit the Snoot, and who stood by when it caught.'],
      ['harrow', 'Past the Halfway Inn the farms run out to the edge of the hills. If the gnolls come north, those farms see them first.'],
      ['merrick', 'I said we\'d send for you again. Down the road past the inn, south. That\'s where they are.'],
      ['hessle', 'Bring me something I can weigh. Whatever else you hear on the way, bring that too. I write it all down.'],
      ['papa', 'That\'s all this was. Go on.']] };
    TW.wordDue = function (f) { return !!(f && f.councilSeen && f.ettercapDone && !f.councilWord && !f.snootWord); };
    TW.wordCallDue = function (B) {
      var R = D.roam, R0 = B && B.roam, def = R.def; if (!R0 || !def || !R.house || !R.house() || R0.mode !== 'walk' || R0.path) return false;
      var street = def.key === 'silverton' && def.town && !def.room && !def.hexIn && !def.cut; if (!def.hexIn && !street) return false;
      var f = R0.flags; if (!TW.wordDue(f)) return false;
      return def.hexIn === 3 ? def.councilAt === 'word' : ((street || def.hexIn === 1) && !f.wordCalled);
    };
    var atTable0 = H16.atTable;
    H16.atTable = function (flags) { var at = atTable0.apply(this, arguments); if (at) return at; return TW.wordDue(flags || {}) ? { why: 'word', who: ['papa', 'androit', 'hessle', 'casper', 'harrow', 'merrick'] } : null; };
    var lookDue0 = H16.lookDue;
    H16.lookDue = function (B) { return lookDue0.apply(this, arguments) || TW.wordCallDue(B); };
    var lookPlay0 = H16.lookPlay;
    H16.lookPlay = function* (B) {
      var R0 = B.roam, f = R0.flags;
      if (!f.councilSeen || !TW.wordCallDue(B)) { yield* lookPlay0.apply(this, arguments); return; } // (C2 first, as ever)
      if (D.roam.def.hexIn !== 3) { yield* H16.runner(B); f.wordCalled = 1; f.pinWant = 'trueword'; delete f['q:trueword']; return; } // (the Hex boy again; the true word in the JOURNAL, its first step the third floor)
      yield* H16.tableShot(B, H16.COUNCIL.word.card);
      var sc = H16.sitting(B, ['word'], [f, D.house && D.house.cur && D.house.cur.flags], true, false, true); while (!sc.done) yield 1;
      H16.rise(B);
    };
    (H16.BEATS || []).forEach(function (bt) { if (bt.due === lookDue0) bt.due = H16.lookDue; if (bt.play === lookPlay0) bt.play = H16.lookPlay; }); // (the floor's beats hold the functions themselves: js/hours.js H16.BEATS)
    TW.MISSION.show = 'flag:heardTrueWord|flag:wordCalled|flag:snootDone|has:anchorpin';
    TW.MISSION.steps.unshift({ 'if': 'flag:wordCalled & !flag:councilWord & !flag:snootDone', map: 'hex', hex3: true, where: 'The Hex, in the plaza at the heart of town: the council has sent for you again. In at its front doors, then up the spiral stair to the third floor.' });
  }

  // THE SNOOT'S TABLE ON THE ROAD SOUTH (RULED 11-11, Griz to the lanes desk, "6 - both", on the seat's sixth: the first game's Snoot overlay -- content/encounters.json
  // `snoot`, gnoll packs, hyenas, worgs -- in place of the road south's own on the Pit road's hexes south of the Halfway Inn, from the day the young blood are out; and "The
  // Snoot's Young Blood" a step of the true word, below). A hex on the Pit road whose zone was `south` (js/world.js W.zoneOf: past the inn), from TW.FROM_DAY
  var zoneOf0 = W.zoneOf;
  TW.SNOOT_ZONE = 'snoot';
  W.zoneOf = function (e) {
    var z = zoneOf0.apply(this, arguments); if (z !== 'south' || !e || W.day() < TW.FROM_DAY) return z;
    var m = W.M(), P = m && m.road && m.road[K(e.q, e.r)]; return P && P.id === 'pitroad' ? TW.SNOOT_ZONE : z;
  };

  // the mirror-made met on the road (js/world.js World.encounter: THE MIRROR-MADE, p.mirror) -- the piece is seen, not won
  var enc0 = W.World.prototype.encounter;
  W.World.prototype.encounter = function (p) { if (p && p.mirror && W.house()) D.house.cur.flags.sawMirror = 1; return enc0.apply(this, arguments); };

  // ---------------------------------------------------------------- THE GLORY-SEEKERS AND THE TRUE WORD, shown (deep16/?trueshow -- the eyes rows' door): a NEW GAME's four
  // at 3rd staged by the beat. `road` is his hands on THE WORLD; `joke` the fight staged and run by the engine, the seed pinned, Aurdin's first turn the cast at himself
  // (the cutscene, the laughing, the egg), then the fight his to play; `won` the win's card; `scales` the turn-in with all four pieces
  TW.SEED = 1111;
  TW.BEATS = [
    { id: 'road', label: 'THE ROAD SOUTH BY DAY: the glory-seekers met past the inn (his hands)', note: 'Day 6 at ten, the four at 3rd on the Pit road three miles south of the Halfway Inn, Kat\'s vision had and Hideous Laughter in Aurdin\'s book and among the day\'s. Walk one hex south (an arrow, or click the next hex): the first game\'s card, FIGHT or BACK AWAY; the fight is the grid\'s snoot, the house\'s own -- Aurdin may cast it at himself.', walk: true },
    { id: 'joke', label: 'GUESS I\'M THE JOKE, NOW: the egg in the road\'s fight (the engine casts, the seed pinned)', note: 'The same fight, the seed pinned (' + TW.SEED + '): on Aurdin\'s first turn the engine casts Hideous Laughter at himself -- he cracks up and goes down laughing, the hyena\'s face, the gnoll knows that laugh, the hyenas over cackling, the gnolls down howling two rounds, the red egg. Then the fight is yours to play on.', joke: true },
    { id: 'won', label: 'THE ROAD OPEN: the win\'s card (the anchor-pin, renown)', note: 'The card after the glory-seekers break: the last of them runs south, the anchor-pin off a Dominion wagoneer among the leader\'s trophies, renown +1 and its milestone XP. TRUE WORD OF THE GNOLLS is in the JOURNAL after it (J).', won: true },
    { id: 'scales', label: 'TRUE WORD AT THE SCALES: Hessle with the pin and all four pieces', note: 'Hessle\'s counter with the anchor-pin in the pack and all four pieces gathered (the Waterbys\' word, the mirror-made, Kat\'s vision, her book with Androit): the board\'s fifty gold, four lines in his hand, 600 XP to each one standing.', scales: true },
    { id: 'council', label: 'THE COUNCIL SENDS FOR YOU AGAIN: the gulch paid, the Hex boy, the third floor (his hands)', note: 'Silverton\'s street, the council\'s C2 had and the ettercap\'s fangs paid at the scales: the Hex boy runs up again (Papa wants you on the third floor), TRUE WORD OF THE GNOLLS goes in the JOURNAL with the Hex its step. Walk in at the Hex\'s front doors and up the spiral: the council at the long table swears you to the true word, and the step turns to the road south past the inn.', council: true }
  ];
  TW.play = function (bt) {
    var H = D.house, rec = H.fresh(); rec.silver = 60;
    if (bt.council) { Object.assign(rec.flags, { councilSeen: 1, councilCalled: 1, councilNotice: 1, heardEttercap: 1, ettercapDone: 1 }); rec.renown = 3; H.begin(rec, 0); return; } // (Silverton's street at the west gate: the floor's own beats bring the Hex boy -- js/hours.js H16.BEATS)
    rec.at = { town: null };
    if (D.save && D.save.fixture) rec.party = D.save.fixture(3).party; // (the four at 3rd: the fight is the first game's HARD for four at 3)
    rec.flags = { katVision: 1, katInk: 1, councilNotice: 1, heardTrueWord: 1 };
    var au = rec.party.filter(function (h) { return (h.key || h.id) === 'aurdin'; })[0];
    if (au) { au.known = (au.known || []).filter(function (id) { return id !== 'hideouslaughter'; }).concat(['hideouslaughter']); if (Array.isArray(au.prepared)) au.prepared = au.prepared.filter(function (id) { return id !== 'hideouslaughter'; }).slice(0, -1).concat(['hideouslaughter']); }
    if (bt.scales) { Object.assign(rec.flags, { snootDone: 1, heardTribes: 'true', sawMirror: 1, katBookAndroit: 1 }); rec.inv.push({ id: 'anchorpin', n: 1 }); }
    H.begin(rec, 0, '?world&nowagon');
    var S = W.state(), R = Wg.route(); S.t = 5 * 24 + 10; S.today = 0; S.todayHex = 0; // (day 6 at ten)
    var s = R ? R.inn - (bt.walk ? 3 : 8) : 0, pt = Wg.pt(s), pt0 = Wg.pt(s + W.M().w);
    if (pt) { S.pos = pt.slice(); if (W.place(pt)) W.scene.onMap(); S.from = pt0 ? W.hexOf(pt0[0], pt0[1]) : null; S.rv = null; var sc = W.scene, lk = sc.lookAt(pt[0], pt[1]); sc.cam.cx = lk[0]; sc.cam.cy = lk[1]; }
    W.save();
    if (bt.walk) { W.scene.say('The Pit road, south of the inn, ' + W.timeOfDay() + ': walk a hex south.'); return; }
    if (bt.won) { TW.won(W.scene); return; }
    if (bt.scales) { D.push(new C.Counter(null, { id: 'hessle', name: 'Hessle', place: 'The Weigh-House', what: 'Fountain Street', script: function (s2) { return C.hessle(s2); } })); return; }
    if (bt.joke) { D.seed = TW.SEED; var b = TW.fight(W.scene); if (b) TW.jokeTurn(b); }
  };
  TW.jokeTurn = function (b) { // (the show's: Aurdin's first turn is the cast at himself, by the engine -- B.exec, as a player's command; after it, his turns are the player's)
    var ht0 = b.heroTurn;
    b.heroTurn = function* (u) {
      if (u.id === 'aurdin' && !this.showJoked && D.magic.jokeReady(this, u)) {
        this.showJoked = true; D.rules.startTurn(u); this.focus(u); this.active = u; yield 30;
        yield* this.exec(u, { do: 'cast', id: 'hideouslaughter', slot: 1, target: u });
        this.active = null; yield 20; D.magic.endTurn(this, u); return;
      }
      return yield* ht0.call(this, u);
    };
  };
  TW.show = function (q) { return new D.roam.WetShow(q, { kind: 'trueshow', beats: TW.BEATS, play: TW.play, title: '{y}THE GLORY-SEEKERS AND THE TRUE WORD, 11-11{/} -- the road south past the inn, the joke, the pin, the scales (a show)' }); };
})();
