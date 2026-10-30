/* DEEP16 -- SILVERTON'S HOURS AND WORDS (10-28, the story window, started by the lanes desk; the lane `they live\handoff-2026-10-28-silvertons-hours-and-words.md`,
   RULED whole with him 10-28). His words that opened it: "Giving silverton time means shop hours and 'where should NPCs be when'"; "Talking to a 'nearby start' NPC to add
   the things to the journal, not just in there without trigger. i.e. warrens pete"; "Batch with NPC texts mapping to pinnable rumor missions".

   THE JOURNAL BY WORDS (the lane's 4.1, 4.2): nothing in it at NEW GAME; a mission opens on the word that names it (a talk branch's `set`, a rumour heard -- C.RUMOR_OPENS),
   and the moment it does a card says so in plain words, the first opened pinned when nothing is (H16.missionDue, H16.missionCard). The rumours stay in the JOURNAL's THE TALK
   as before (RULED, his "the way 'the talk' section currently works is good"). The missions the grid plays, the second game's records over the first game's (js/counter.js
   C.quests): the Company, Finding Work, The Missing Five, the cradles, the cull, the cloaker's tail, the fight night, Winters' errands, Ned's page. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, C = D.counter, T = D.town, H16 = D.hours = {};

  // ---------------------------------------------------------------- the day (THE WORLD's clock: js/world.js S.t, Day 0 the morning the game opens, the moot that night)
  H16.day = function () { var W = D.world, S = W && W.state && D.house && D.house.playing ? W.state() : null; if (S && S.t != null) return Math.floor(S.t / 24); var m = /[?&]day=(\d+)/.exec((window.location && location.search) || ''); return m ? +m[1] : 0; };

  // ---------------------------------------------------------------- the missions (the lane's 4.2): the second game's records, each over the first game's of its id
  // (content/quests.json stays the first game's); `where` says the place and the way to it (the words pass, 4.9)
  var EAST = 'walk off Silverton\'s east edge by the feed track and over the bridge. The town map (L) marks it.';
  H16.MISSIONS = [
    // THE MISSING FIVE (RULED 10-28, his "talking to pete makes 'the missing 5' a journal that points to the booking guy on the surface at the cradles as first waypoint"): Pete's
    // Five, renamed as he wrote it, taking in the way to the Warrens that `bc6f31e` opened on Pete's word -- its id kept ('warrens'), Edric Pellam first
    // (10-29, the story window, RULED on Griz's "Leans stand", his note "there's no real taking of the missing 5 quest - you talk to him about milking crawlers and it
    // mysteriously shows up in your journal ... Mission text says from warren's pete - should get from warrens pete, or with dialogue from Edric. Both should point to ask Skarn
    // step": it opens on words only -- Pete's, Edric's own telling as he books you, or Skarn's work past the pens (js/mines.js; fiveBy: who told it) -- never on the booking
    // alone; its words say who told it; Pete's goes to Edric, then Skarn, Edric's and Skarn's on from there -- the Edric step till the book is signed, which since 10-29 always tells the five)
    { id: 'warrens', name: 'The Missing Five', show: 'flag:heardWarrens|flag:heardPete|flag:heardFive', done: 'flag:fiveDone',
      text: function (st) { return H16.FIVE_BY[st.flags.fiveBy] || H16.FIVE_BY.pete; },
      doneText: 'The five came back up. Edric wrote their return lines.',
      steps: [{ 'if': 'has:fivetokens', map: 'warrens_a', npc: 'edric', where: 'Bring the five\'s tokens to Edric Pellam at the tally-house, the Warrens\' mouth camp.' },
        { 'if': '!flag:tallyMet & !flag:skarnOk', map: 'warrens_a', npc: 'edric', where: 'Edric Pellam at the tally-house, the Warrens\' mouth camp: ' + EAST },
        { 'if': '!flag:skarnOk', map: 'warrens_a', npc: 'skarn', where: 'Skarn, the Warrener, at the mouth camp: ask him about the five, and he opens his gate.' },
        { 'if': '!flag:fiveRecovered', map: 'warrens_d', trig: 'stair', where: 'The flooded stair past the wet: through Skarn\'s gate, up the drift, the daytime way down. Bring rope.' },
        { map: 'warrens_a', npc: 'edric', where: 'Back to Edric Pellam at the tally-house.' }] }, // (each step's floor the first game's, content/quests.json five: the way there is H16.wayTo)
    { id: 'cradles', name: 'The Cradles', show: 'flag:heardCradles|flag:tallyMet', done: 'flag:shifts',
      text: 'The Warrens\' cradles take hands by the shift: you milk a crawler for its venom, a silver for each clean thimble. Edric Pellam writes you into his book first.',
      steps: [{ 'if': '!flag:tallyMet', map: 'warrens_a', npc: 'edric', where: 'Edric Pellam at the tally-house, the Warrens\' mouth camp: ' + EAST },
        { map: 'warrens_a', trig: 'pen2', where: 'Pen Two, Four or Five: the gated mouths along the mountain wall at the mouth camp. WORK A SHIFT.' }] }, // (pen2: its square the marker's -- the first game's step)
    { id: 'cull', name: 'The Cull', show: 'flag:heardGalleries|flag:cullHired', done: 'flag:rescued',
      text: 'The guano mine, in the mountain west of town, hires cull hands: three silver a giant bat\'s head, a gold piece a darkmantle. Its one law: no fire and no noise under a roost.',
      steps: [{ 'if': '!flag:cullHired', npc: 'sabeth', where: 'Sabeth Pollard at the weigh-shed, the guano mine\'s mouth: out of Silverton by the west gate, then west on THE WORLD.' },
        { site: 'mouth', where: 'The dens, down past the working gallery. Listen for Old Wynn\'s rattle.' }] },
    { id: 'tail', show: 'flag:heardCloaker', done: 'flag:cloakerDone',
      text: 'Forty gold on Hessle\'s board for the cloaker in the guano mine\'s deep gallery. Nobody has ever collected. Bright light is its weakness.',
      steps: [{ 'if': 'has:cloakertail', door: 'hessle', where: 'Take the tail to Hessle at the Weigh-House, on Fountain Street.' },
        { site: 'mouth', where: 'The deep gallery, below the guano mine\'s dens: past the mark, down the last ladder. Bring light.' }] },
    // THE BRAIDING ETTERCAP (10-29, the story window, RULED on Griz's "Leans stand": a paper on Hessle's board is a mission once its ground is built -- his 10-28 "16 yes" -- and
    // Web Gulch's was, 10-28, js/gulch.js): the board read, the rumour, or the council's ask at a name made (H16.COUNCIL.looks) opens it; done when its fangs are paid at the scales
    { id: 'ettercap', name: 'The Braiding Ettercap', show: 'flag:heardEttercap', done: 'flag:ettercapDone',
      text: 'Forty gold on Hessle\'s board, and ten more since it snared a lad: an ettercap strung across Web Gulch, on the road south out of Silverton. Bring its fangs to the Weigh-House.',
      steps: [{ 'if': 'has:ettercapfangs', door: 'hessle', where: 'Take the fangs to Hessle at the Weigh-House, on Fountain Street.' },
        { site: 'webgulch', where: 'Web Gulch, on the road south: out of Silverton by the east gate, then down the road on THE WORLD past the fork. The ettercap braids at the strung end, up a side gully off the west bank.' }] },
    // CORWEN DACE (10-28, the deep gallery seat: his escort, js/mines.js THE DEEP GALLERY) -- open while he walks with the party, done when he is home with his thanks given
    { id: 'dace', name: 'Corwen Dace', show: 'flag:daceWith|flag:daceDone', done: 'flag:daceDone',
      text: 'Corwen Dace walks with you in the guano mine: he has wanted the deep gallery all his life. Bring him back up. If he falls, it is over.',
      doneText: 'Dace climbed back up to the house to tell it everything.',
      steps: [{ 'if': '!flag:cloakerKilled', site: 'mouth', where: 'The deep gallery, below the dens: past the mark, down the last ladder. His staff lights below the roost. Old Wynn, at the mouth, sends him home if you ask.' },
        { site: 'mouth', where: 'Walk the deep gallery with him: he wants to see where it lived.' }] }, // (invented.json deepgallery-dace-words)
    { id: 'hex', show: 'flag:heardHex', done: 'flag:talmokBeaten',
      text: 'The Hex, in the plaza at the heart of town: five silver to fight on the card, and the winner keeps ten. Korvin keeps the slate. Talmok is the champion.',
      steps: [{ map: 'hex', npc: 'korvinSlate', where: 'Korvin at the slate, on the Hex\'s ground floor.' }] },
    // THE COUNCIL SENDS FOR YOU (10-29 night, Griz on Papa's runner: "should put a quest in your journal to guide you to the third floor"): opened by the runner and pinned
    // (H16.runner), done when the party is up the spiral and the council sits for them (C2, councilSeen); the marker on the Hex's front doors, inside on the spiral up (hex3:
    // H16.pinSq). The words the story seat's draft, invented.json council-summons-1029
    { id: 'council', name: 'The Council Sends for You', show: 'flag:councilCalled', done: 'flag:councilSeen',
      text: 'Papa Urtusk sent a Hex boy running: Silverton\'s council wants you on the Hex\'s third floor, where it sits.',
      doneText: 'You went up. The council had work for you.',
      steps: [{ map: 'hex', hex3: true, where: 'The Hex, in the plaza at the heart of town: in at its front doors, then up the spiral stair to the third floor.' }] }
  ];
  // FINDING WORK (RULED 10-28, his "sounds like an AND when we should make it an OR. Finding work as a quest fills up with options as you talk to various NPC, getting a quest
  // from where it points (winters, the board) completes the finding work quest"): an option a place, each added by the first word that names it (`work:<k>`, js/counter.js
  // C.flagOn, in the order heard); done the moment the party takes up any one -- WORK from Winters, the board read, Edric's book, a bout on the slate
  H16.WORK = [
    { k: 'winters', short: 'Winters\' papers (Fountain Street)', step: { npc: 'winters', where: 'Ambrose Winters, Acquisitions & Estates, on Fountain Street: ask him for WORK.' } },
    { k: 'board', short: 'Hessle\'s board (the Weigh-House)', step: { door: 'hessle', where: 'Hessle\'s board, on the Weigh-House wall beside its door on Fountain Street: every paper on it is a bounty. Take one down.' } },
    { k: 'cradles', short: 'the Warrens\' cradles (over the bridge)', step: { npc: 'edric', where: 'The Warrens: ' + EAST.replace('. The town map', ': Edric Pellam at the tally-house books hands for the cradles. The town map') } },
    { k: 'slate', short: 'Korvin\'s slate (the Hex)', step: { map: 'hex', npc: 'korvinSlate', where: 'The Hex: Korvin at the slate. Five silver to fight, ten if you win.' } }
  ];
  H16.workHeard = function (st) { var o = ((st && st.flags.workOrder) || '').split(',').filter(Boolean); return o.map(function (k) { return H16.WORK.filter(function (w) { return w.k === k; })[0]; }).filter(Boolean); };
  H16.MISSIONS.unshift({ id: 'work', name: 'Finding Work', show: 'flag:heardWork',
    done: 'flag:wErrA|flag:boardRead|flag:tallyMet|flag:hex:brawl|flag:hex:freeman|flag:hex:card|flag:hex:talmok|flag:hex:festival',
    text: function (st) { var hd = H16.workHeard(st); return 'Silverton pays strangers who ask in the right places. Heard of so far: ' + (hd.length ? hd.map(function (w) { return w.short; }).join('; ') : 'nothing yet') + '. Take up any one.'; },
    doneText: 'Work found. Its own line is in the JOURNAL.',
    steps: function (st) { return H16.workHeard(st).map(function (w) { return w.step; }); } });
  H16.MISSIONS.forEach(function (q) { C.OWN_QUESTS = C.OWN_QUESTS.filter(function (o) { return o.id !== q.id; }).concat([q]); });
  C.QUESTS = ['company', 'council', 'work', 'warrens', 'cradles', 'cull', 'tail', 'ettercap', 'dace', 'hex', 'errands', 'nedpage'];
  // The Missing Five's words by who told it (js/mines.js fiveBy; Pete's when the town's word or the rumour opened it). The window's drafts, invented.json warrens-five-words-1029
  H16.FIVE_BY = {
    pete: 'Warrens Pete says six went down past the wet in the Crawler Warrens, and six came up. He says six too fast. The tally-house book has five names with no return line.',
    edric: 'Edric Pellam\'s book at the Warrens\' tally-house has five names with no return line: Warrens Pete\'s crew, gone down past the wet after leavings. Pete came up alone.',
    skarn: 'Skarn, the Warrener, has one job past the pens that nobody takes: five of Warrens Pete\'s crew went down past the wet and never came up. Edric Pellam\'s book has their names.'
  };

  // the rumours that point at work open their mission (the lane's 4.2; the rest stay lines in THE TALK); the Snoot's news is not in town till the morning after the moot
  // (the realm's campaign-start.md: the Pit's word, Day 1, Lucia first) -- before it, the gnolls ranging north is the whole of it
  Object.assign(C.RUMOR_OPENS, { 'r-pete': 'heardPete', 'r-doserate': 'heardCradles', 'r-mouths': 'heardCradles', 'r-guanowages': 'heardGalleries', 'r-roost': 'heardGalleries',
    'r-cloaker': 'heardCloaker', 'r-cloakerNumber': 'heardCloaker', 'r-nobodyCollected': 'heardCloaker', 'r-hexcard': 'heardHex', 'r-talmok': 'heardHex', 'r-fronted': 'heardHex',
    'r-winters': 'work:winters', 'r-ettercap': 'heardEttercap' });
  H16.NEWS = { 'r-snoot': 1 };
  C.rumorHeld = function (rid) { return !!H16.NEWS[rid] && H16.day() < 1; };

  // ---------------------------------------------------------------- the card a mission opens with (the lane's 4.1, 2): the moment it shows in the JOURNAL, its name and its
  // plain words, and the first pinned when nothing is. A save from before has its JOURNAL as it stood: what it shows at the first look is taken as seen, no cards
  H16.fresh = function (st) { return C.quests(st).filter(function (q) { return !st.flags['q:' + q.id]; }); };
  H16.missionDue = function (B) {
    // (at once, the party walking or not: 10-28 2258Z, his "got the journal popup for the cradle when I returned to silverton" -- it had waited for the party to stand still, and
    // he walked off the mouth camp straight after Edric's word, so it came on the next floor)
    var R = D.roam, R0 = B && B.roam; if (!R0 || !R.house || !R.house() || R0.mode !== 'walk' || (R.tracking && R.tracking(R0).length)) return false;
    var st = C.state(B); if (!st) return false;
    if (!st.flags.qSeen) { st.flags.qSeen = 1; H16.fresh(st).forEach(function (q) { st.flags['q:' + q.id] = 1; }); return false; }
    return H16.fresh(st).length > 0;
  };
  H16.DING = 'quest'; // (not played since 10-29 night: the card comes silent and the fly-in's chime says it went in -- H16.missionCard)
  // the pinned step's gold marker where the town's door marker has none (10-28 2258Z, his "cradle mission pinned not pointing to the guy who unlocks working cradles"): the one it
  // wants standing on this floor (Edric at the mouth camp), its own square on this floor (a pen's), or the way there -- off Silverton's street to the Warrens by the feed track, off
  // the mouth camp back to town by it. Drawn as js/company.js draws the Company's
  H16.pinSq = function (B, s) {
    var def = D.roam.def, id8 = def.src8 && def.src8.id, u = s.npc && B.units.filter(function (x) { return x.npc === s.npc; })[0]; if (u) return [u.x, u.y];
    if (s.hex3) { // (the third floor wanted -- the council's summons: on the street the Hex's front doors, inside the nearest spiral up, up there nothing)
      var HX = D.hex, tk = B.roam.token, best = null;
      if (!def.hexIn) return def.key === 'silverton' && !def.room && def.marks && def.marks.hexFront && def.marks.hexFront[0] ? def.marks.hexFront[0].slice() : null;
      if (def.hexIn >= 3 || !HX) return null;
      HX.spiralSq().forEach(function (q) { var dd = Math.abs(q[0] - tk.x) + Math.abs(q[1] - tk.y); if (!best || dd < best.d) best = { d: dd, q: q }; }); return best ? best.q.slice() : null;
    }
    var tr = s.trig && (!s.map || s.map === id8) && (def.src8 && def.src8.triggers || []).filter(function (t) { return t.id === s.trig; })[0];
    if (tr) { var r = tr.rect, my = r[1] + Math.floor(((r[3] || 1) - 1) / 2); return def.from8 ? def.from8(r[0], my) : [r[0], my]; } // (the Wet's stair by its middle, turned onto the grid)
    var toW = /^warrens/.test(s.map || '') || s.npc === 'edric' || s.npc === 'skarn' || !!s.trig && /^pen/.test(s.trig);
    if (def.key === 'silverton' && !def.room && toW && D.mines && D.mines.FEED && !def.cut) return D.mines.FEED.slice();
    if (def.key === 'warrens' && !toW && (s.door || s.npc)) { var g = D.mines && D.mines.FLOORS && D.mines.FLOORS.warrens.gates.feed; if (g) return def.from8 ? def.from8(g[0], g[1]) : [g[0], g[1]]; }
    if (s.map && id8 && s.map !== id8) return H16.wayTo(B, s.map); // (another floor below: the way there)
    return null;
  };
  // the way off this floor toward another of the first game's maps (10-29, his "not getting any mission arrows (unpinned and repinned) after talking to skarn": The Missing Five's
  // next step, the flooded stair, is two floors down, and the step had lost the first game's `map: 'warrens_d'`): the first game's rule (js/world.js route), the fewest maps by
  // their open warps, at the same count the way nearest the party -- and where the walk to it is shut by a gate that would open for a use (Skarn's, once he has taken them on), the gate
  H16.hops = function (from, to, flags) {
    var MP = (DS.DATA && DS.DATA.maps) || {}, seen = {}, q = [[from, 0]]; seen[from] = 1;
    for (var i = 0; i < q.length; i++) {
      if (q[i][0] === to) return q[i][1];
      ((MP[q[i][0]] || {}).warps || []).forEach(function (w) { if (MP[w.to] && !seen[w.to] && D.roam.cond(w.cond, flags)) { seen[w.to] = 1; q.push([w.to, q[i][1] + 1]); } });
    }
    return null;
  };
  H16.wayTo = function (B, map) {
    var R = D.roam, def = R.def, t = B.roam.token, flags = B.roam.flags || {}, best = null;
    var ways = (def.warps || []).map(function (w) { return { to: w.to, sq: w.at.slice(), cond: w.cond }; });
    if (!ways.length && def.src8 && def.src8.warps) ways = def.src8.warps.map(function (w) { return { to: w.to, sq: def.from8(w.x, w.y), cond: w.cond }; }); // (the Wet: the first game's own warps)
    ways.forEach(function (w) {
      if (!R.cond(w.cond, flags)) return;
      var h = w.to === map ? 0 : H16.hops(w.to, map, flags); if (h == null) return;
      var d = Math.abs(w.sq[0] - t.x) + Math.abs(w.sq[1] - t.y);
      if (!best || h < best.h || (h === best.h && d < best.d)) best = { h: h, d: d, sq: w.sq };
    });
    if (!best) return null;
    if (R.walkRoute && !R.walkRoute(t, best.sq)) {
      var gate = (def.src8.triggers || []).filter(function (g) { return g.opens && g.on === 'use' && R.cond(g.cond, flags) && R.cond(g.opens, flags); })[0];
      if (gate) return def.from8 ? def.from8(gate.rect[0], gate.rect[1]) : gate.rect.slice(0, 2);
    }
    return best.sq;
  };
  // the place on THE WORLD the pinned step wants (10-29, his "pinning quest doesn't give the yellow marker on the world map (Ned's Page)"): its `site`, else the place its map,
  // its person or its door is in -- the Warrens' floors and Edric, Skarn and the pens the mouth camp's; the guano mine's its mouth; anyone behind a town door Silverton. Drawn
  // over that place on the hex view by js/world.js (the gold marker the floors draw: C.paintPin), held at the screen's edge, pointing, when it is off it
  H16.SITE_OF = { edric: 'warrens', skarn: 'warrens', hob: 'warrens', sabeth: 'mouth', wynn: 'mouth', ottilie: 'mouth' };
  H16.pinSite = function (st) {
    var q = st && st.flags.pin && C.quests(st).filter(function (x) { return x.id === st.flags.pin && !x.done; })[0], s = q && q.step; if (!s) return null;
    if (s.site) return s.site;
    var m = s.map || '';
    if (/^warrens/.test(m) || (s.trig && /^pen/.test(s.trig))) return 'warrens';
    if (/^galleries/.test(m)) return 'mouth';
    if (/^(glowseep|webgulch)$/.test(m)) return m;
    if (s.npc && H16.SITE_OF[s.npc]) return H16.SITE_OF[s.npc];
    return s.door || s.npc || m === 'hex' ? 'silverton' : null;
  };
  var pinPaint0 = C.paintPin;
  C.paintPin = function (ctx, B) {
    pinPaint0.apply(this, arguments);
    var R = D.roam, R0 = B && B.roam, def = R && R.def; if (!R0 || !def || !(def.town || (def.src8 && def.src8.id === 'warrens_d')) || B.menu || R0.mode !== 'walk') return; // (the Wet too: the stair it wants)
    var st = C.state(B), q = st && st.flags.pin && C.quests(st).filter(function (x) { return x.id === st.flags.pin && !x.done; })[0], s = q && q.step; if (!s) return;
    if (def.key === 'silverton' && !def.room && C.pinned(st)) return; // (the town's door marker has it)
    if (s.hex3 ? def.room && !def.hexIn : def.room || def.hexIn) return; // (in a room or the Hex: the counter's and the Company's own markers -- but the council's summons, up the Hex's spirals: H16.pinSq)
    if (q.id === 'company' && D.company && D.company.HIRES && D.company.HIRES[s.npc]) return;
    var sq = H16.pinSq(B, s); H16.marked = sq ? sq.slice() : null; if (!sq) return;
    var iso = D.iso, c = iso.center(sq[0], sq[1], (B.map && B.map.gz ? B.map.gz(sq[0], sq[1]) : 0) + 30), p = iso.toScreen(c.x, c.y);
    var m = 14, x = Math.max(m, Math.min(D.W - m, p.x)), y = Math.max(m + 14, Math.min(D.H - 40, p.y)), off = x !== p.x || y !== p.y, bob = Math.sin(B.t / 10) * 2;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y + (off ? 0 : bob))); if (off) ctx.rotate(Math.atan2(p.y - y, p.x - x) - Math.PI / 2);
    ctx.fillStyle = '#1a1206'; ctx.beginPath(); ctx.moveTo(-7, -9); ctx.lineTo(7, -9); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = D.WIN8.gold; ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(5, -8); ctx.lineTo(0, 1); ctx.closePath(); ctx.fill(); ctx.restore();
  };
  H16.LINES = { opened: '{y}In your JOURNAL:{/} {name}.', pinned: '{g}Pinned: the gold arrow marks the next step. M, then JOURNAL, to read it again.{/}', more: '{g}And: {names}.{/}' };
  H16.missionCard = function* (B) {
    var R = D.roam, st = C.state(B), f = st.flags, nu = H16.fresh(st), live = C.quests(st).filter(function (q) { return q.id === f.pin && !q.done; })[0], lines = [], pinned = false;
    nu.forEach(function (q) { f['q:' + q.id] = 1; });
    var open = nu.filter(function (q) { return !q.done; }); if (!open.length) return;
    if (f.pinWant) { var pw = f.pinWant; delete f.pinWant; open.sort(function (a, b) { return (b.id === pw) - (a.id === pw); }); if (open[0].id === pw) live = null; } // (a mission given to be pinned -- the council's ask, H16.COUNCIL.looks -- pinned over what was)
    if (!live) { f.pin = open[0].id; pinned = true; }
    lines.push(H16.LINES.opened.replace('{name}', open[0].name), open[0].text);
    if (open.length > 1) lines.push(H16.LINES.more.replace('{names}', open.slice(1).map(function (q) { return q.name; }).join(', ')));
    if (pinned) lines.push(D.keys ? D.keys(H16.LINES.pinned) : H16.LINES.pinned);
    B.card(R.wrap(lines), 480); // (no sound as it appears since 10-29 night, his "remove first sound on appearance and keep the tucked away in journal sound": the 10-28 ding,
    // H16.DING, is no longer played; the chime as the words go into the JOURNAL is the fly-in's, below)
    // ... and into the JOURNAL (10-29, below): the card kept in the log, its words on the fly-in instead of the floor's card
    B.cards.pop(); yield* H16.fly(B, R.wrap(lines));
  };
  // THE JOURNAL'S FLY-IN (10-29, Griz, NOTES 1846Z at the Guano Galleries' mouth: "Added to Journal - can we show the text, the popup the part of the menu that has journal, and
  // the text collapsing and moving into 'journal' which highlights, then have that part of the menu disappear with a more pleasant sound" -- on the 10-28 ding above): the card's
  // words in the middle; then the M menu's command column slides in where the M menu stands it (js/ui.js UI.MENU_X/Y, js/menu.js Root's window), the card shrinks and flies into
  // its JOURNAL row, which lights gold; the column slides away to a soft chime (js/audio.js SFX.journal). On the floor's own clock and drawn over it (C.paintPin, below), so
  // the floor's script waits on it as on a card; a click or E moves it on from the words, and again skips to its end
  H16.FLY = { read: 270, slide: 12, fly: 26, glow: 30, out: 14 }; // (read: 360 till 10-29 night, his "little less time to read it before it goes in the journal please" -- 4.5 s, the story seat's call)
  H16.flyRows = function () { var r = ['ITEMS', 'GEAR', 'MAGIC', 'SKILLS', 'EQUIP', 'STATUS', 'ORDER', 'JOURNAL', 'SAVE', 'NOTES']; if (D.roam && D.roam.def && D.roam.def.hours) r.push('WAIT'); return r.concat(['OPTIONS', 'CREDITS', 'EXIT']); }; // (the second game's root, js/menu.js entriesOf)
  H16.fly = function* (B, lines) {
    var R0 = B.roam, F = H16.FLY, jf = B.jfly = { lines: lines, t0: B.t, n: 0, go: null, end: null, chimed: false };
    var at = function () { return Math.max(B.t - jf.t0, jf.n); }, after = F.slide + F.fly + F.glow + F.out;
    while (true) {
      var e = at(), poke = R0 && ((R0.clicks && R0.clicks.length) || (R0.keys && R0.keys.length)); if (R0) { R0.clicks.length = 0; R0.keys.length = 0; }
      if (jf.go == null && (poke || e >= F.read)) jf.go = e; else if (jf.go != null && poke) jf.n = jf.t0 = -1e6; // (a second poke: to the end)
      var s = jf.go == null ? -1 : at() - jf.go;
      if (s >= F.slide + F.fly + F.glow && !jf.chimed) { jf.chimed = true; D.sfx('journal'); }
      if (s >= after) break;
      jf.n += 6; yield 6;
    }
    if (!jf.chimed) D.sfx('journal');
    B.jfly = null; if (R0) { R0.clicks.length = 0; R0.keys.length = 0; }
  };
  H16.drawFly = function (ctx, B) {
    var jf = B.jfly; if (!jf) return; var F = H16.FLY, e = Math.max(B.t - jf.t0, jf.n), s = jf.go == null ? -1 : e - jf.go;
    var ease = function (k) { k = Math.max(0, Math.min(1, k)); return 1 - (1 - k) * (1 - k); };
    var tw = 0; jf.lines.forEach(function (l) { tw = Math.max(tw, D.textWidth(l)); });
    var cw = Math.min(D.W - 24, tw + 20), ch = jf.lines.length * 10 + 12, cx = Math.round((D.W - cw) / 2), cy = Math.round((D.H - ch) / 2) - 20;
    var rows = H16.flyRows(), n = rows.length, rh = n > 13 ? 10 : n > 12 ? 11 : 12, MX = (D.ui && D.ui.MENU_X) || 112, MY = (D.ui && D.ui.MENU_Y) || 15, wx = MX + 184, wy = MY + 4, ji = rows.indexOf('JOURNAL');
    var jr = { x: MX + 188, y: MY + 11 + ji * rh - 2, w: 62, h: rh };
    var mIn = s < 0 ? 0 : s < F.slide ? ease(s / F.slide) : s < F.slide + F.fly + F.glow ? 1 : 1 - ease((s - F.slide - F.fly - F.glow) / F.out), colX = Math.round(D.W + (wx - D.W) * mIn);
    if (mIn > 0) { // (the menu's command column, as js/menu.js Root draws it, JOURNAL lit once the words are in it)
      D.win8(ctx, colX, wy, 70, 160);
      var lit = s >= F.slide + F.fly && s < F.slide + F.fly + F.glow + F.out, pulse = 0.55 + 0.45 * Math.sin((s - F.slide - F.fly) / 3);
      rows.forEach(function (lb, i) {
        var ry = MY + 11 + i * rh;
        if (i === ji && lit) { ctx.save(); ctx.globalAlpha = Math.max(0.25, pulse); ctx.fillStyle = D.WIN8.gold; ctx.fillRect(colX + 4, ry - 2, 62, rh); ctx.restore(); }
        D.text(ctx, lb, colX + 6, ry, i === ji ? (lit ? '#1a1206' : D.WIN8.gold) : D.WIN8.text);
      });
    }
    var k = s < F.slide ? 0 : ease((s - F.slide) / F.fly); if (s >= F.slide + F.fly) return; // (the words in the JOURNAL now)
    var bx = Math.round(cx + (jr.x + (colX - wx) - cx) * k), by = Math.round(cy + (jr.y - cy) * k), bw = Math.max(8, Math.round(cw + (jr.w - cw) * k)), bh = Math.max(4, Math.round(ch + (jr.h - ch) * k));
    D.win8(ctx, bx, by, bw, bh);
    if (k < 0.45) { ctx.save(); ctx.globalAlpha = 1 - k / 0.45; ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip(); jf.lines.forEach(function (l, i) { D.text(ctx, l, bx + 10, by + 6 + i * 10, D.WIN8.text); }); ctx.restore(); }
    if (s < 0) D.hint(ctx, 'click or E', D.W / 2, cy + ch + 4, '#9a96a8', 'center');
  };
  var pinPaint1 = C.paintPin;
  C.paintPin = function (ctx, B) { pinPaint1.apply(this, arguments); if (B && B.jfly) H16.drawFly(ctx, B); }; // (over the floor and its markers: the fly-in)

  // ---------------------------------------------------------------- PAPA AND LYMEN AT THE HEX'S DOOR (the lane's 4.3; RULED 10-28, his "6 - yes" on his own note: "Have
  // Urtusk and Lymen being Lymen telling Urtusk about finding friends to investigate the rumblings about gnolls on the road and activate company as active quest"). The first
  // time the party comes within H16.DOOR_FT of Papa in the Hex's front door, any lead: Lymen in the door with him (or, Lymen leading, Lymen himself -- he starts there,
  // js/company.js CO.START), the talk played on the map's camera, a line a prompt; then the Company opens, pinned, and Finding Work beside it with Papa's four kinds of work.
  // The lines are the window's drafts (Papa and Lymen are reserved; the no-stubs law, RULED 09-24): invented.json company-papa-lymen
  H16.DOOR_FT = 90;
  H16.PAPA = {
    door: 'Papa Urtusk fills the Hex\'s front door. A young man in show-armorer\'s chain mail is talking up at him, a green token at his throat.',
    doorLy: 'Papa Urtusk fills the Hex\'s front door, the way he always has.',
    gnolls: 'Gnolls on the road at night, Papa, north of the Gulch where they never come. And the Dominion\'s wagons have been down there talking to them all summer. Nobody\'s going to look. I am.',
    alone: 'Alone.', friends: 'No. I\'ll find people who\'ll stand up. Friends.', few: 'There\'s a few standing about.',
    find: 'Make a name in this town first, then come and find me in the Hex. I\'m Lymen. Warda\'s youngest.', go: 'Then go and find some.',
    who: { barley: 'Barley\'s on the Hex\'s bench with ten silver and no sense.', vivian: 'Marta\'s girl sells candles on vice row.', aurdin: 'The farm boy sleeping on Aldwin\'s floor has a spellbook.' },
    work: 'Want a name? Winters pays for honest legs. Hessle\'s board pays for brave ones. The Warrens pay for strong backs. The sand pays for fools.',
    inside: '{g}Lymen goes back into the Hex.{/}'
  };
  H16.papaDue = function (B) {
    var R = D.roam, R0 = B && B.roam, def = R.def, Hs = D.house; if (!R0 || !def || !def.town || def.room || def.hexIn || !R.house() || R0.mode !== 'walk' || R0.path) return false;
    var st = C.state(B), rec = Hs && Hs.cur; if (!st || !rec || st.flags.papaLymen) return false;
    if (rec.lead !== 'lymen' && ((rec.hired || []).indexOf('lymen') >= 0 || (rec.party || []).length >= 4)) { st.flags.papaLymen = 1; return false; } // (Lymen already with them: a save from before)
    var p = B.units.filter(function (u) { return u.npc === 'papa'; })[0], t = R0.token; if (!p) return false;
    return Math.hypot(t.x - p.x, t.y - p.y) * (def.ft || 5) <= H16.DOOR_FT;
  };
  H16.HERO_NAME = { barley: 'Barley', vivian: 'Vivian', aurdin: 'Aurdin', lymen: 'Lymen' };
  H16.line = function (u, who, text) { return { prompt: { who: u, title: who, lines: D.roam.wrap([text]), opts: [{ label: 'NEXT', value: 0 }] } }; };
  // a place behind a counter screen played outside (js/counter.js o.bg, as H16.backdrop is the council's): the floor as its camera stands now, drawn under the boxes and dimmed --
  // live, so a figure turned mid-talk turns there too; behind the one speaking, nothing (the portrait's own window)
  H16.streetShot = function (B) {
    return function (ctx, x, y, w, h, behind) {
      if (behind || !D.ui || !D.ui.drawBattle) return false;
      var cards0 = B.cards; B.cards = []; // (the floor's own cards -- its hello, a show's note -- not under the screen's title: the street alone)
      ctx.save(); try { D.ui.drawBattle(ctx, B); } catch (e) { ctx.restore(); B.cards = cards0; return false; } ctx.restore(); B.cards = cards0;
      ctx.fillStyle = H16.SHOT.dim; ctx.fillRect(0, 0, D.W, D.H); return true;
    };
  };
  H16.papaScene = function* (B) {
    var R = D.roam, R0 = B.roam, t = R0.token, st = C.state(B), f = st.flags, rec = D.house.cur, P = H16.PAPA, lyLead = rec.lead === 'lymen', G = D.grid;
    var papa = B.units.filter(function (u) { return u.npc === 'papa'; })[0], ly = lyLead ? t : null;
    f.papaLymen = 1;
    if (!lyLead) { // (Lymen in the door beside Papa: his own figure, the save's look for him, as the hires stand -- js/company.js)
      var at = null, bd = Infinity; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var q = [papa.x + dx, papa.y + dy]; if ((dx || dy) && G.canStand && G.canStand(papa, q[0], q[1])) { var dd = Math.hypot(q[0] - t.x, q[1] - t.y); if (dd < bd) { bd = dd; at = q; } } }
      if (at) {
        ly = B.makeFoe({ id: 'lymenDoor', kind: 'brawler', at: at, side: 'party', ally: true }); ly.name = 'Lymen'; ly.look = true; ly.npc = 'lymenDoor'; ly.attacks = {}; ly.multi = 1; ly.hp = ly.maxhp = 4; ly.lvl = 1; ly.anim = 'idle'; ly.animT = B.t;
        var lk = D.save && D.save.look ? D.save.look('lymen', null, null) : null; if (lk && lk.sheet && D.SHEETS && D.SHEETS[lk.sheet]) { ly.sheet = lk.sheet; if (D.spr.prefetch) D.spr.prefetch([lk.sheet]); }
        ly.facing = D.spr.facingFor(papa.x - ly.x, papa.y - ly.y); B.units.push(ly); G.setup(G.map, B.units);
      }
    }
    papa.facing = D.spr.facingFor((ly || t).x - papa.x, (ly || t).y - papa.y);
    B.focus({ x: Math.round((t.x + papa.x) / 2), y: Math.round((t.y + papa.y) / 2), size: 1 }); D.sfx('popup');
    var hd = function (u) { return u && u !== t ? D.spr.facingFor(t.x - u.x, t.y - u.y) : null; };
    var others = ['barley', 'vivian', 'aurdin'].filter(function (id) { return id !== rec.lead && (rec.hired || []).indexOf(id) < 0; }).map(function (id) { return P.who[id]; });
    // the talk on the counter screen, the door behind it (10-30, his "do the scene that gives 'company' mission by overlaying (cropped as needed) portraits over the city
    // background (talking outside) with lymen bottom right (similar to ned and aurdin but for background)", then "will need to be mirrored to be bottom left screen" and "try to
    // get the lymen/papa company quest dialog finished"): Papa's portrait speaking, the street as the map's camera has it dimmed behind, Lymen the screen's hero bottom left
    // (js/counter.js Counter.drawHero, C.HERO_PT: pt_lymen, cut mirrored; his figure's face till it loads), his lines his own in the bubble as Aurdin's are at Ned's
    // (open: no frames round the two, their words' boxes run in under the portraits -- 10-30, his "can we lose the boxes around the characters and jam the edge of their textbox so
    // their portrait overlaps it?", and "this one is special for being wordy and outside, council is good until further notice": this scene's alone)
    var sc = new C.Counter(B, { id: 'papa', name: 'Papa Urtusk', place: 'The Hex', what: 'at the front door', room: true, open: true, bg: H16.streetShot(B), script: function (s) {
      s.hero = { id: 'lymen', key: 'lymen', name: 'Lymen' };
      return (function* () {
        yield s.narr([lyLead ? P.doorLy : P.door]); // (the door in the middle first, no one standing: his "papa's first card should be centered to start the conversation - its narration not dialog")
        yield s.ask([], [P.gnolls], 'attentive'); // (Lymen speaks first)
        yield s.ask([P.alone], [P.friends], 'skeptical');
        // the lead in (10-30, his "one of lymen's lines is to barley, try throwing his portrait on the bottom right, lymen size, when papa says finishes saying 'there are some
        // standing around', then remove lymen while papa finishes what he says to barley", "little pause and maybe a code-drawn blush on barley after 'standing around' then cut
        // urtusks text box while he says his line to barley"): Papa's "There's a few standing about.", a pause, the lead bottom right and a blush; Lymen to the lead, Papa's box
        // gone; then Lymen gone, and Papa to the lead (js/counter.js drawOpen: a wait's lead, blush, noHero)
        var lead = { id: rec.lead, key: rec.lead, name: H16.HERO_NAME[rec.lead] || rec.lead }, toLead = function (wt, o) { if (!lyLead) { wt.leadHero = lead; Object.assign(wt, o); } return wt; };
        if (!lyLead) {
          papa.facing = hd(papa); if (ly) ly.facing = hd(ly);
          yield toLead(s.say([P.few], 'idle'), { lead: 'after' });
          yield toLead(s.ask([], [P.find]), { lead: true, blush: true });
        }
        papa.facing = hd(papa) || papa.facing;
        if (lyLead || others.length) yield toLead(s.say([(lyLead ? P.go + ' ' : '') + others.join(' ')], 'attentive'), { lead: true, noHero: true });
        yield toLead(s.say([P.work], 'welcoming'), { lead: true, noHero: true });
      })();
    } });
    D.push(sc); while (!sc.done) yield 1;
    ['work:winters', 'work:board', 'work:cradles', 'work:slate'].forEach(function (k) { C.flagOn(st, k); });
    if (ly && ly !== t) { B.units = B.units.filter(function (u) { return u !== ly; }); G.setup(G.map, B.units); B.card(R.wrap([P.inside]), 200); }
    B.focus(t); yield 10;
  };
  // the Company opens on that talk (show: the first game's record's `party>=4` kept, so a save that has its four still has it); before it, nothing of it in the JOURNAL
  C.OWN_QUESTS.push({ id: 'company', show: 'flag:papaLymen|party>=4' });

  // ---------------------------------------------------------------- THE PEOPLE BESIDE EACH LEAD'S START (the lane's 4.5; RULED 10-28, his "7 - good"): the word that puts Finding
  // Work in the JOURNAL for a lead who walks the other way from the Hex -- Aldwin in the chapel (Aurdin's start), Marta at her stall (Vivian's), Kess at her door (Barley's);
  // Lymen's is Papa's. The second game's own branches (C.TALK16, over content/npcs.json's): the window's drafts, invented.json start-people-words
  Object.assign(C.TALK16, {
    aldwin: [{ 'if': '!flag:work:winters & hired:aurdin', say: ['Bread at six. At quarter past, for the proud.', 'The old priest looks at Aurdin and says nothing about the sun god. Fifty years at the bread line teaches a man when not to.', 'If it\'s coin you want, Ambrose Winters on Fountain Street pays for honest legs. Tell him the chapel sent you.'], set: 'work:winters' }, // (his first-game word to Aurdin kept, the pointer after it)
      { 'if': '!flag:work:winters', say: ['Bread at six. At quarter past, for the proud.', 'If it\'s coin you want, Ambrose Winters on Fountain Street pays for honest legs. Tell him the chapel sent you.'], set: 'work:winters' }],
    marta: [{ 'if': 'lead:vivian & !flag:work:board', say: ['You\'re up. Eat.', 'If you\'re working, work Hessle\'s board, where I can hear about it. Forty on the board for the thing in the guano mine. Fifty at my tables.'], set: 'work:board', rumor: 'r-cloakerNumber' },
      { 'if': '!hired:vivian & !flag:work:board', say: ['Pie two coppers, sausage three. Broth and small beer before dawn.', 'Fifty gold for the thing in the guano mine\'s deep gallery, they say at my tables. Forty on Hessle\'s board.'], set: 'work:board', rumor: 'r-cloakerNumber' }],
    kess: [{ 'if': '!flag:work:cradles', say: ['A penny a night, dreams included.', 'You want coin by tonight? The Warrens take anyone with two hands: out the east gate, over the bridge, a silver the thimble.'], set: ['work:cradles', 'heardCradles'] }],
    papa: [{ 'if': 'party>=4', say: ['Four of you. Bring them back.'] }, { 'if': 'flag:papaLymen', say: ['Make a name. Then they\'ll follow you.'] }]
  });

  // ---------------------------------------------------------------- LUCIA AT MAMA'S COUNTER (the lane's 4.6; RULED 10-28, his "8 - yes"; his note: "Mama should have more starter
  // character specific and current game state specific opening texts and possible interactions", and "Lucia wouldn't say "mama mixes" she'd say "I mix""). Her opener, the
  // first that holds; then THE SHELVES, CONSULT or LEAVE. CONSULT (the shop card's own word, "CONSULT LUCIA", RULED 09-02) is free: she looks the party over and names the
  // fix for each hurt. The first morning's news is the realm's own line (TarlynsPit/wiki/campaign-start.md, CANON 08-25); the rest the window's drafts, invented.json
  // lucia-openers, lucia-consult
  H16.LUCIA = {
    news: ['The Pit\'s word came up my back stairs before light. The gnoll king\'s dead at the moot, by Dominion hands, and their wagons already gone.', 'I had it that they were courting the gnolls. Then it was never the gnolls they were after.'],
    worn: 'Somebody here is grey with it. Eat first: Marta\'s stall, a silver a head. Then come back for anything stronger.',
    first: { aurdin: 'The boy with the hand-me-down book. When you want a familiar, the calling herbs are mine, and nobody else mixes them. They\'re dear. Save.',
      barley: 'The whole Hex saw you get up against Cutter. Getting up is a gift. Don\'t spend it every night.',
      vivian: 'Marta\'s girl. Urtusk\'s rules hold at my counter too.', lymen: 'Ly. You took your oath alone. Now you want company for it. Good.' },
    ly: 'Ly. Papa says you\'re out finding friends. Find ones who duck.',
    plain: 'I mix. Higertha sells at the hatch, in the Hex. What hurts?',
    ask: 'What hurts?',
    c: { down: '{name} is down. Davos Kren\'s door, by the Hex: five silver, and he stands them up.', poison: 'Poison in {name}. Antitoxin, off my shelf.',
      worn: '{name} is worn to the bone. Marta\'s hot meal takes a level of it off, and a night\'s sleep another.',
      bled: '{name} has lost a lot of blood. A healing potion off my shelf, or a night at Cassia\'s.', cut: '{name} is cut up. An hour\'s rest, or a night\'s sleep.',
      none: 'Nothing I can fix. Go and get hurt properly.' }
  };
  H16.consult = function (B) {
    var R0 = B && B.roam, L = H16.LUCIA.c, out = [], Hs = D.house;
    (R0 ? R0.members.filter(function (u) { return u.src; }) : []).forEach(function (u) {
      var nm = u.name, cs = Object.assign({}, (u.src && u.src.conds) || {}, u.conds || {}), say = function (k) { out.push(L[k].replace('{name}', nm)); };
      if (u.dead || u.ko || u.hp <= 0) say('down');
      else { if (cs.poisoned) say('poison'); if (Hs && Hs.exh && Hs.exh(u.src) > 0) say('worn'); if (u.hp <= u.maxhp / 2) say('bled'); else if (u.hp < u.maxhp) say('cut'); }
    });
    return out.length ? out : [L.none];
  };
  H16.luciaOpener = function (st, B) {
    var f = st.flags, Lc = H16.LUCIA, rec = D.house && D.house.playing && D.house.cur, lead = (rec && rec.lead) || '', names = st.party.map(function (h) { return h.key || h.id; });
    if (H16.day() >= 1 && !f.luciaSnoot) { f.luciaSnoot = 1; C.heard(st, 'r-snoot'); return Lc.news.slice(); }
    if (C.mealEaters(B).some(function (u) { return D.house.exh(u.src) > 0; })) return [Lc.worn];
    if (!f.luciaMet) { f.luciaMet = 1; if (Lc.first[lead]) return [Lc.first[lead], Lc.ask]; }
    if (lead !== 'lymen' && names.indexOf('lymen') >= 0 && !f.luciaLy) { f.luciaLy = 1; return [Lc.ly]; }
    return [Lc.plain];
  };
  C.VENDORS.lucia.script = 'lucia';
  C.SCRIPTS.lucia = function* (sc, B) {
    var said = H16.luciaOpener(sc.st, B), opts = ['THE SHELVES', 'CONSULT', 'LEAVE'], q = said, face = 'welcoming';
    if (!C.oneBox(said)) { yield sc.say(said.slice(0, -1), 'welcoming'); q = said[said.length - 1]; }
    while (true) {
      var a = yield sc.ask(q, opts, face);
      if (a === 0) { yield sc.shelves('lucia'); q = H16.LUCIA.ask; face = 'welcoming'; continue; }
      if (a === 1) { yield sc.say(H16.consult(B), 'attentive'); q = H16.LUCIA.ask; continue; }
      return;
    }
  };

  // ---------------------------------------------------------------- SYLVIA SWANN'S READING, 5 SP (the lane's 4.7; RULED 10-28, his "9 - yes, in the case of no pinned messages a
  // consult will pin one first"; his note: "Swann dialogue pointing to next quest or upcoming part of existing quest for 5 sp - consult story wiki for timeline on when she reads
  // the old one's presence"). The register: her reading fired at the moot through the object on Gnash, the Owl's brief "An Old One Walks!" (TarlynsPit/wiki/the-wizard-networks.md,
  // campaign-start.md, CANON 09-16/16b) -- the moot is the night of Day 0, so from the first morning she knows, and says so once. Her steer cap (RULED 08-29g, "won't send the
  // Aurdin-class up the hill"): no reading names the Tower. Her lines the window's drafts (she is Griz's reserved; the no-stubs law), invented.json swann-reading
  H16.SWANN = { price: 5,
    first: ['A draped table, a cup of tea going cold, and an owl on a perch that watches your hands, not your face.', 'Five silver, and I\'ll tell you what comes next for you. Not the far future. Nobody can afford that.'],
    again: 'Five silver for the cup.', read: 'READ (5 SP)', poor: 'Five silver. The cup doesn\'t read on credit.', dry: 'The cup\'s dry. Come back when the town\'s moved.',
    next: '{g}Next:{/} {where}', walks: 'Her hand stops over the cup. "An old thing walks. Not your business yet." She won\'t say more, whatever you pay.',
    q: { company: 'You\'re short of hands. They\'re nearer than you think.', work: 'Coin\'s on Fountain Street, and on a wall, and over the river, and on the sand. Pick one.',
      errands: 'Paper, a seal, a number. An old man who keeps the dead in order.', warrens: 'Water, and a stair under it, and five who didn\'t come up. Take rope.',
      cradles: 'A pen, a pole, a thimble. Steady hands.', cull: 'Wings in the dark. Keep your voice down and your light hooded.', tail: 'Something that looks like a cloak and isn\'t. It hates the light.',
      hex: 'Sand, and a crowd, and a big man who opens reckless.', nedpage: 'A snake\'s tongue, fresh. A page for it.',
      ettercap: 'Silk across a road, and something braiding it. Go at noon, when the spiders sulk.', // (ettercap: 10-29, the story window -- the silk-cutters' noon, wiki/web-gulch.md)
      council: 'A stair that turns and turns, and a long table at the top of it. Don\'t keep them waiting.' }, // (council: 10-29 night, the story seat -- the runner's summons)
    // with nothing open to read, the work she opens first, in this order (each its JOURNAL's door: js/counter.js C.flagOn)
    opens: [['work', 'work:winters'], ['warrens', 'heardPete'], ['cradles', 'heardCradles'], ['cull', 'heardGalleries'], ['hex', 'heardHex'], ['tail', 'heardCloaker']] };
  // what she reads: the pinned mission; none pinned, she pins the first open one; none open, she opens the first work not yet heard and pins it (null: nothing left)
  H16.swannPick = function (st) {
    var f = st.flags, qs = C.quests(st), live = qs.filter(function (q) { return q.id === f.pin && !q.done; })[0];
    if (live) return live;
    var open = qs.filter(function (q) { return !q.done; })[0]; if (open) { f.pin = open.id; return open; }
    var shown = qs.map(function (q) { return q.id; }), nu = H16.SWANN.opens.filter(function (o) { return shown.indexOf(o[0]) < 0; })[0]; if (!nu) return null;
    C.flagOn(st, nu[1]); f.pin = nu[0]; return C.quests(st).filter(function (q) { return q.id === nu[0]; })[0] || null;
  };
  C.VENDORS.sylvia.own = false; C.VENDORS.sylvia.script = 'swann'; delete C.OWN.sylvia;
  C.SCRIPTS.swann = function* (sc) {
    var st = sc.st, f = st.flags, S = H16.SWANN, q = f.swannMet ? S.again : S.first[1];
    if (!f.swannMet) { f.swannMet = 1; yield sc.say([S.first[0]], 'welcoming'); }
    while ((yield sc.ask(q, [S.read, 'LEAVE'], 'attentive')) === 0) {
      if (st.silver() < S.price) { D.sfx('error'); q = S.poor; continue; }
      var m = H16.swannPick(st); if (!m) { q = S.dry; continue; }
      st.silver(-S.price); D.sfx('coin');
      var lines = [S.q[m.id] || m.text, S.next.replace('{where}', m.where || m.text)];
      if (H16.day() >= 1 && !f.swannWalks) { f.swannWalks = 1; lines.push(S.walks); }
      var cards = H16.byBox(lines); for (var i = 0; i < cards.length; i++) yield sc.say(cards[i], 'work'); q = S.again;
    }
  };
  // a speech in cards that never cut a line across two (10-29 night, Griz on Swann: "Swann's second part should all be together on her second card" -- her NEXT line had run
  // from the foot of her first card onto a second): the lines that fit one box together, a line that doesn't start the next box
  H16.byBox = function (lines) { var out = [], cur = []; lines.forEach(function (l) { if (cur.length && !C.oneBox(cur.concat([l]))) { out.push(cur); cur = []; } cur.push(l); }); if (cur.length) out.push(cur); return out; };

  // ---------------------------------------------------------------- THE COUNCIL ON THE HEX'S THIRD FLOOR (the lane's 4.8; RULED 10-28: his "Consider C1 a cutscene that plays for
  // the player at the parties nearest (chronological) rest cycle", "C3 is that any crawler kill trigger or the thinning the herd too much amount", "18 - yes, lantern warning same
  // trigger as council meeting", "17 - yeah, that's good"). The register: Androit, Hessle, Casper Venn, Papa Urtusk, Ottak Harrow, and Merrick when word from outside matters; the
  // lounge under the Big Window; "the scales are lit", the Weigh-House lamp the signal (TarlynsPit/wiki/silverton.md, the-hex.md). One screen for every sitting: the counter's,
  // its portrait the one speaking, a line a page (a council member with no portrait yet -- Thrane's man -- the plain shape; Papa and Harrow on their own faces since 10-29, pt_papa and pt_harrow). C1 and C3 play at the party's next long
  // rest after the council sits, over the morning, the party not in the room; C2 is the party called up, at renown 2, played when they reach the third floor. Every line the
  // window's draft (the no-stubs law, RULED 09-24), invented.json council-notice-night, council-herd, council-looks
  H16.WHO = { hessle: 'Hessle', androit: 'Aldwyn Androit', casper: 'Casper Venn', merrick: 'Merrick', papa: 'Papa Urtusk', harrow: 'Ottak Harrow', thrane: 'The east side\'s man', warda: 'Warda' };
  H16.COUNCIL = {
    // C1: the night the Pit's word is in (Day 1; the realm's campaign-start.md, CANON 08-25: the notice funded, Merrick warned unexplained -- its "Papa struck the Lupine-head line"
    // a stale fold: the 08-25 story's footer item 22, "the Lupine-head line and Urtusk's strike are CUT")
    // (10-30, Griz, on the Lupine's head: "we're wasting expository space. What actually came in from newland? Summed up as 'all the tribes gathered for a moot, and now they've
    // gone snoot - most savage as the new gnoll king' - spin up a seat to write the scripting - someone at the table that likes things explicit clarifying what's there vague for
    // people that have never heard of gnolls, someone brusk cutting them off and keeping things moving?" -- the Lupine-head exchange cut, as his own 08-25 ruling cut it in the
    // realm (S1-22). Androit spells it out for the record (the realm's "historian fella", who wants the town's history written down true); Papa cuts him off and moves it on.
    // The news is the realm's (TarlynsPit/wiki/campaign-start.md, the-snoot.md, gnoll-hills.md: the full-moon moot, Gnash the Gnarled a hundred years under the Mane, killed by
    // the Dominion, the Snoot -- succession by battle-glory; Newland's patrols stop at the Pit); the lines the story seat's drafts, invented.json council-notice-night)
    notice: { flag: 'councilNotice', card: 'That night, in Silverton, the Weigh-House lamp burns past the fourth bell. On the Hex\'s third floor, the scales are lit.', lines: [
      ['hessle', 'Word\'s come up the road from Tarlyn\'s Pit, where Newland\'s patrols stop. Every gnoll tribe in the hills met at the full moon, for a moot.'],
      ['androit', 'Plainly, for the record. Gnolls are the hyena-folk of the hills down the road, and a moot is all their tribes together under one king.'],
      ['hessle', 'The Dominion killed that king at the moot. Gnash the Gnarled, a hundred years under their Mane, and the Dominion\'s wagons gone before he was cold.'],
      ['androit', 'So they\'ve gone Snoot. With no king, the Mane goes to whoever wins the most glory, and to a gnoll glory is killing: the most savage of them will be king. The last time a king died, the histories say --'],
      ['papa', 'Enough history, Aldwyn. They\'ll come up the road for their glory. What do we do?'],
      ['merrick', 'There\'s more coming up that road. Don\'t ask me how I know.'],
      ['androit', 'Then we post it. Fifty gold for true word of the gnolls, sworn before me. Ten a fortnight to anyone who keeps a watch on the road.'],
      ['harrow', 'My farms are the first thing a gnoll sees. Post it twice.']], end: 'In the morning it is on Hessle\'s board.' },
    // C3: the herd thinned (the lantern man's trigger, R.WARN_AT: `herdWarned`), and again if the whole stock dies (`stockDead`)
    herd: { flag: 'councilHerd', card: 'That night the scales are lit again. The east side\'s house has sent a man up the Hex\'s spiral.', lines: [
      ['thrane', 'Three of the House\'s stock dead on the stone. Somebody is culling a herd that isn\'t theirs.'], ['casper', 'Somebody went down the wet where nobody else would. Ask what they went for.'],
      ['hessle', 'The board pays for what\'s brought up. It doesn\'t fine anyone for what they killed getting there.'], ['papa', 'A warning\'s gone down. Once. Next.']] },
    stock: { flag: 'councilStock', card: 'The scales are lit. The east side\'s man doesn\'t sit down.', lines: [
      ['thrane', 'The stock\'s dead. All of it. The House is hiring the Captain\'s line to hold the mouth camp and the bridge.'], ['androit', 'Then it\'s sworn: the House\'s business, the House\'s guards.'],
      ['papa', 'Then they\'ll hold a bridge over an empty pen. Next.']] },
    // C2: a name made (renown 2), the party called up and looked over -- since 10-29 for a reason (the story window, RULED on Griz's "Leans stand", his note: "Council looking
    // you over dialogue seems same text as store-walk - why is the council taking a look at them, if not disappoint why not quest (true word gnolls?)"): the who's-who cut (each
    // said what their counter says); Papa vouched, the town's one road out wants keeping open, and Androit swears the party to the ettercap in Web Gulch -- The Braiding
    // Ettercap opened and pinned (opens, pin) -- with the gnolls named as the job after it, its mission waiting with the road south, which they are coming north up. invented.json council-looks-1029
    // (10-29 night, Griz on Papa's runner: "if warda has a portrait - warda shows you should be portrait version 'this is the group you asked about papa'" -- her word on pt_warda
    // first, and Papa's after it no longer says it again; "gnolls are coming up north along the south of silverton road (north road would point to the doors)" -- Merrick's line)
    looks: { flag: 'councilSeen', card: 'The council sits at the long table under the Big Window. Warda shows the party in, and nobody tells them to sit.', opens: 'heardEttercap', pin: 'ettercap', lines: [
      ['warda', 'This is the group you asked about, Papa.'],
      ['papa', 'That\'s them. They take work, and they come back from it.'],
      ['harrow', 'Then here\'s work. Every wagon out of Silverton goes south through Web Gulch, and there\'s an ettercap strung across the far end of it.'],
      ['hessle', 'Forty gold on my board for it, and ten more since it snared a lad. Nobody has collected.'],
      ['androit', 'Then it\'s sworn before me: the gulch cleared, and its fangs brought to Hessle\'s scales. It\'s yours, if you\'ll take it.'],
      ['merrick', 'After the gulch, the gnolls. They\'re coming north up that same road, out of the south. When it\'s time, we\'ll send for you again.'],
      ['papa', 'That\'s what this was. Go on.']] },
    place: 'The Hex, the third floor', what: 'the council'
  };
  H16.HESSLE = { before: 'The board. Read it. The scales pay what\'s posted, sworn before notary.', five: 'Five names off the book\'s dead side. The town noticed.' }; // (his word at the Weigh-House before the notice; after the five with no herd thinned)
  H16.NOTICE_AT = 24 + 17; // (the council's night: Day 1, from dusk -- THE WORLD's S.t in hours)
  H16.councilsDue = function (flags) {
    var W = D.world, S = W && W.state ? W.state() : null, t = S && S.t != null ? S.t : 0, out = [];
    if (!flags.councilNotice && t >= H16.NOTICE_AT) out.push('notice');
    if (flags.herdWarned && !flags.councilHerd) out.push('herd');
    if (flags.stockDead && !flags.councilStock) out.push('stock');
    return out;
  };
  // the sitting on the counter's screen: the card, then a line a page on the speaker's portrait; the flag on the save and the floor (the floor hands its own back later)
  // (cut: the night's cutscene played to its end, so its shots have said what the cards would -- 10-29, the story window, RULED on Griz's "Leans stand", his note "the first
  // cutscene has redundancy - explainer line replaced by shots. The background of the scene vs background in the portrait window": no card, the first speaker first; and the
  // screen a room, not a shop -- no counter under the one speaking, no purse, js/counter.js o.room)
  H16.sitting = function (B, ids, flagsets, seen, cut) { // (seen: its card already shown, at the table on the map -- H16.tableShot)
    var night = ids.some(function (id) { return id !== 'looks'; }); // (a council's night, played at the party's rest: over the third floor's picture -- H16.backdrop)
    var sc = new C.Counter(B || null, { id: 'council', name: 'The council', place: H16.COUNCIL.place, what: H16.COUNCIL.what, room: true, bg: night ? H16.backdrop(ids) : null, script: function (s) { return (function* () {
      for (var i = 0; i < ids.length; i++) {
        var cs = H16.COUNCIL[ids[i]]; flagsets.forEach(function (f) { if (f) { f[cs.flag] = 1; if (cs.opens) f[cs.opens] = 1; if (cs.pin) f.pinWant = cs.pin; } });
        if (!(seen && i === 0) && !cut) { s.sheet = null; s.bare = true; s.o.name = 'The council'; yield s.say([cs.card], 'attentive'); } // (bare: no one speaking -- over the third floor, the room alone)
        for (var k = 0; k < cs.lines.length; k++) { var who = cs.lines[k][0]; s.sheet = C.PT[who] || null; s.bare = false; s.o.name = H16.WHO[who] || who; yield s.say(['"' + cs.lines[k][1] + '"'], 'attentive'); }
        if (cs.end) { s.sheet = null; s.bare = true; s.o.name = 'The council'; yield s.say(['{g}' + cs.end + '{/}']); }
      }
    })(); } });
    D.push(sc); return sc;
  };
  // ---------------------------------------------------------------- THE THIRD FLOOR BEHIND THE NIGHT'S SITTING (10-29, Griz to the lanes desk: "In the cutscene at night - perhaps try
  // the third floor as background for the speaking parts" -- a try, his eye the ruling): a council's night sitting at the party's rest (C1, C3) plays its card and its portraits over
  // a picture of the Hex's third floor -- the council in their seats at the long table under the Big Window (H16.TABLE; who sits as H16.atTable has them on a night), Warda in the
  // lounge, the lamps low -- behind the whole screen and behind each one speaking (js/counter.js o.bg). The picture: the third floor laid as HX.lay lays it, on a Battle of its own that
  // never runs, one frame painted off the screen, and every shared thing put back as a pulled-in fight leaves the floor (js/roam.js R.pullIn0: the grid, the map, the camera and its
  // zoom; and the floor's def); painted again while a figure's sheet is still loading. C2 plays on the third floor itself, so it keeps the counter's own screen
  H16.SHOT = { wash: 'rgba(6,8,30,0.42)', glow: '255,170,90', dim: 'rgba(8,10,28,0.2)', tries: 8, every: 15 }; // (dim 0.36 till 10-29: the one background now, lit a little more)
  H16.seatFor = function (ids) { return { why: 'night', who: H16.whoFor(ids), stand: ids.indexOf('stock') >= 0 ? ['thrane'] : [] }; }; // (the stock dead: the east side's man won't sit -- H16.TABLE.stand, 10-29)
  H16.whoFor = function (ids) { var who = ['papa', 'androit', 'hessle', 'casper', 'harrow']; if (ids.indexOf('notice') >= 0) who.push('merrick'); if (ids.indexOf('herd') >= 0 || ids.indexOf('stock') >= 0) who.push('thrane'); return who; };
  // a stage: a floor laid on a Battle of its own that never runs (lay(st, b), on its first run), swapped in for fn and put back -- every shared thing as a pulled-in fight leaves
  // the floor (js/roam.js R.pullIn0: the grid, the map, the camera and its zoom), and the floor's def, the D.MAPS entries named, the mouse kept off it (no tooltip in a picture)
  H16.stage = function (keys, lay) {
    var st = { b: null, def: null, zoom: null, err: null, n: 0 };
    st.run = function (fn) {
      var R = D.roam, iso = D.iso, G = D.grid, mo = D.input.mouse, maps = {}, ok = false;
      var keep = { gm: G.map, gu: G.units, im: iso.map, cx: iso.cam.x, cy: iso.cam.y, zoom: iso.zoom, inW: iso.inWorld, def: R.def, mo: mo.inside };
      keys.forEach(function (k) { maps[k] = D.MAPS[k]; });
      try {
        mo.inside = false;
        if (!st.b) {
          var b = st.b = new D.Battle({}); b.units = []; b.t = 0; b.cine = true; b.cards = []; b.dark = false; b.cursor = { x: -99, y: -99 }; // (the cursor off the floor: no tooltip)
          b.roam = { token: { x: 0, y: 0, size: 1 }, flags: {}, fw: [0, 1], members: [] };
          lay(st, b); st.def = R.def; st.zoom = iso.zoom;
          b.units.forEach(function (u) { u.onCounter = true; }); // (no bar over a figure in a picture, as Ned's rat on his counter has none: js/ui.js)
        } else { R.def = st.def; iso.map = st.b.map; G.setup(st.b.map, st.b.units); iso.zoom = st.zoom; }
        if (fn) fn(st, st.b); ok = true;
      } catch (e) { st.err = String(e && e.message || e); }
      finally { R.def = keep.def; iso.map = keep.im; G.setup(keep.gm, keep.gu); iso.cam.x = keep.cx; iso.cam.y = keep.cy; iso.zoom = keep.zoom; iso.inWorld = keep.inW; keys.forEach(function (k) { if (maps[k]) D.MAPS[k] = maps[k]; else delete D.MAPS[k]; }); mo.inside = keep.mo; }
      st.n++; return ok;
    };
    return st;
  };
  // the third floor as HX.lay lays it, the party not on it (the token off the floor's units), and the long table's middle square
  H16.layThird = function (b) { var HX = D.hex, rows = HX.rows(3), sp = HX.spiralSq()[0]; HX.lay(b, 3, HX.near(rows, [sp[0], sp[1] + 1]) || HX.near(rows, sp), [0, 1]); };
  H16.tableSq = function () { return D.hex.sqAt(H16.TABLE.mid[0], H16.TABLE.mid[1]); };
  // the lamps low: a wash, and a warm pool at the table (p: its screen point)
  H16.lowLamps = function (x, p) { var N = H16.SHOT; x.fillStyle = N.wash; x.fillRect(0, 0, D.W, D.H); var g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, 90); g.addColorStop(0, 'rgba(' + N.glow + ',0.22)'); g.addColorStop(1, 'rgba(' + N.glow + ',0)'); x.fillStyle = g; x.fillRect(0, 0, D.W, D.H); };
  H16.thirdShot = function (ids) {
    if (!D.ctx || !D.hex || !D.hex.lay || !D.ui || !D.ui.drawBattle) return null;
    var st = H16.stage(['hex3'], function (s, b) { b.roam.seat = H16.seatFor(ids); H16.layThird(b); }); // (the council in their seats: H16.atTable's night)
    var shot = { ids: ids, b: null, c: null, at: null, n: 0, ready: false, err: null };
    shot.paint = function () {
      var c = shot.c || document.createElement('canvas'), dr = D.R || 1; c.width = Math.round(D.W * dr); c.height = Math.round(D.H * dr);
      var x = c.getContext('2d'); x.setTransform(dr, 0, 0, dr, 0, 0); x.imageSmoothingEnabled = false;
      var ok = st.run(function (s, b) {
        var m = H16.tableSq(); b.focus({ x: m[0], y: m[1], size: 1 }); D.ui.drawBattle(x, b);
        var cc = D.iso.center(m[0], m[1], 0), p = D.iso.toScreen(cc.x, cc.y); shot.at = [p.x, p.y]; H16.lowLamps(x, p);
        shot.ready = b.units.every(function (u) { return !u.sheet || !D.spr.has || D.spr.has(u.sheet); });
      });
      shot.c = ok ? c : null; shot.b = st.b; shot.err = st.err; shot.n = st.n; return ok;
    };
    return shot;
  };
  // the counter's picture (js/counter.js o.bg): the whole screen, dimmed under the boxes; behind the one speaking, nothing -- the portrait's own plain window (10-29, RULED on
  // Griz's "Leans stand", his note "The background of the scene vs background in the portrait window": one background, the scene's -- the table had been cropped in behind
  // the portrait as well, the same room twice)
  H16.backdrop = function (ids) {
    var shot = null, t = 0;
    var bg = function (ctx, x, y, w, h, behind) {
      if (behind) return false;
      if (!shot) { shot = H16.thirdShot(ids) || {}; if (shot.paint) shot.paint(); }
      else if (shot.paint && !shot.ready && shot.n < H16.SHOT.tries && ++t % H16.SHOT.every === 0) shot.paint(); // (a sheet still loading: painted again)
      var c = shot.c; if (!c) return false;
      ctx.drawImage(c, 0, 0, c.width, c.height, 0, 0, D.W, D.H); ctx.fillStyle = H16.SHOT.dim; ctx.fillRect(0, 0, D.W, D.H); return true;
    };
    bg.shot = function () { return shot; }; // (the bench's look at it)
    return bg;
  };

  // ---------------------------------------------------------------- THE COUNCIL'S NIGHT, AN EXPOSITORY CUTSCENE (RULED 10-29, Griz to the story window: "I think we should do a shot of
  // the lamp being lit a dusk and maybe them arriving and being seated on the third floor, expository cut scene" -- PATCHLOG 18ee529a, built by the notes seat). Before a council's
  // night sitting at the party's rest (C1, C3), cut away from wherever the party sleeps: Silverton at dusk, the camera on the Weigh-House, Hessle out to the lamp by its door and the
  // lamp lit (the scales are lit: H16.LIGHTS.scales); then the Hex's third floor, the council up the spiral one by one to their seats at the long table (H16.TABLE, who comes as
  // H16.whoFor has it), Warda in the lounge; then the sitting's speaking parts over the third floor (H16.sitting, H16.backdrop). A card a shot on the map's camera; a click or E goes
  // on (or finishes the walk), X goes straight to the sitting. Each shot's floor a stage (H16.stage), swapped in a frame at a time. The cards the seat's drafts (invented.json
  // council-night-cutscene)
  H16.CUT = {
    lamp: { title: 'SILVERTON, AT DUSK', line: 'Dusk. Hessle comes out of the Weigh-House and lights the lamp by its door: the scales are lit, and the council sits tonight.' },
    arrive: { title: 'THE HEX, THE THIRD FLOOR', line: '' }, // (its line till 10-29 said what the shot shows -- "Up the Hex's spiral, one by one, the council comes to the long table ..." -- cut on Griz's "Leans stand": the title alone)
    step: 8, gap: 26, out: 16, lit: 44, held: 80, win: [30, 20] // (frames a square; frames between arrivals; Hessle out, the lamp lit, the shot held; the town's window round the Weigh-House)
  };
  H16.duskHour = function () { for (var h = 15; h <= 21; h++) if (H16.phaseOf(h) === 'dusk') return h; return 18; };
  // the lamp's stage: a window of Silverton round the Weigh-House laid at dusk (js/town.js T.floor's &cut=; the hour held at dusk while it is laid), its people at their evening spots,
  // and Hessle at his door to come out of it
  H16.layLamp = function (st, b, flags) {
    var T = D.town, F = T.SCALE, L = (T.laidF = T.laidF || {})[F] || (T.laidF[F] = T.lay(null, F)), d = L.marks.doors[H16.LIGHTS.scales], w = H16.CUT.win, def, hn = H16.hourNow;
    var ox = Math.max(0, Math.min(L.w - w[0], d[0] - (w[0] >> 1))), oy = Math.max(0, Math.min(L.h - w[1], d[1] - (w[1] >> 1)));
    H16.hourNow = function () { return H16.duskHour(); };
    try { def = T.floor('?roam=silverton&cut=' + ox + ',' + oy + ',' + w[0] + ',' + w[1], flags || {}); } finally { H16.hourNow = hn; }
    D.roam.def = def; D.MAPS[def.key] = def; b.map = D.iso.load(def); D.grid.setup(b.map, b.units); T.people(b);
    var door = st.door = [d[0] - ox, d[1] - oy], to = [door[0] + 1, door[1]]; // (a town door's mark is its threshold, the wall with the door the square north of it)
    var h = st.hessle = b.makeFoe({ id: 'cuthessle', kind: 'crewman', at: door.slice(), side: 'party', ally: true });
    h.name = H16.WHO.hessle; h.look = true; h.npc = 'hessle'; h.attacks = {}; h.hp = h.maxhp = 4; h.left = true; h.facing = D.spr.facingFor(0, 1); h.anim = 'idle'; h.animT = 0;
    if (D.counter) D.counter.dress(h, 'hessle'); b.units.push(h); if (h.sheet && D.spr.prefetch) D.spr.prefetch([h.sheet]);
    st.walkers = [{ u: h, path: [to], face: D.spr.facingFor(-1, -1), at0: H16.CUT.out, i: 0 }]; // (out of his door, a step along the street, and turned back to the lamp beside it)
    b.focus({ x: door[0], y: door[1], size: 1 });
  };
  // the arrival's stage: the third floor with the council in their seats (as the night's picture), each then put at the spiral's head to walk to their seat in turn
  H16.layArrive = function (st, b, ids) {
    b.roam.seat = H16.seatFor(ids); H16.layThird(b);
    var HX = D.hex, rows = HX.rows(3), sp = HX.spiralSq()[0], start = HX.near(rows, [sp[0], sp[1] + 1]) || HX.near(rows, sp), m = b.map;
    st.walkers = b.units.filter(function (u) { return /^council/.test(u.npc || ''); }).map(function (u, i) {
      var seat = [u.x, u.y], w = { u: u, seat: seat, face: u.facing, path: H16.route(m, start, seat), at0: 6 + i * H16.CUT.gap, i: 0 };
      u.x = start[0]; u.y = start[1]; u.left = true; return w;
    });
    var tm = H16.tableSq(); b.focus({ x: tm[0], y: tm[1], size: 1 });
  };
  // a way across a stage's floor, square to square (its walkable squares; a corner cut only between two open ones): the squares after `a` up to `z`
  H16.route = function (m, a, z, bad) { // (bad: a square someone stands on, to go round -- the bread line's leaver, 10-30)
    var key = function (x, y) { return x + ',' + y; }, ok = function (x, y) { var s = m.at(x, y); return !!(s && s.walk) && !(bad && bad(x, y)); }, prev = {}, seen = {}, q = [a]; seen[key(a[0], a[1])] = 1;
    while (q.length) {
      var p = q.shift(); if (p[0] === z[0] && p[1] === z[1]) break;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var x = p[0] + dx, y = p[1] + dy, k = key(x, y); if ((!dx && !dy) || seen[k] || !(ok(x, y) || (x === z[0] && y === z[1]))) continue;
        if (dx && dy && !(ok(p[0] + dx, p[1]) && ok(p[0], p[1] + dy))) continue;
        seen[k] = 1; prev[k] = p; q.push([x, y]);
      }
    }
    if (!seen[key(z[0], z[1])]) return [z.slice()]; // (no way: there in one step)
    var out = [], c = z; while (c && !(c[0] === a[0] && c[1] === a[1])) { out.unshift(c.slice()); c = prev[key(c[0], c[1])]; } return out;
  };
  // a walker's frame: out at its time, a square every H16.CUT.step frames (the figure's tween between them), and turned as it stands at the end; true while it walks
  H16.walk = function (st, w, t) {
    var u = w.u; if (t < w.at0) return true;
    if (u.left) { u.left = false; u.anim = 'walk'; u.animT = t; }
    if (u.tween) { u.tween.t++; if (u.tween.t < u.tween.dur) return true; u.tween = null; }
    if (w.i < w.path.length) {
      var n = w.path[w.i++], dx = n[0] - u.x, dy = n[1] - u.y;
      u.tween = { t: 0, dur: H16.CUT.step, fx: u.x, fy: u.y, fz: st.b.map.gz(u.x, u.y) }; u.x = n[0]; u.y = n[1]; u.facing = D.spr.facingFor(Math.sign(dx), Math.sign(dy)); u.anim = 'walk'; return true;
    }
    if (!w.sat) { w.sat = true; u.facing = w.face; u.anim = 'idle'; u.animT = t; }
    return false;
  };
  H16.walkDone = function (w) { var u = w.u, z = w.path[w.path.length - 1]; if (z) { u.x = z[0]; u.y = z[1]; } u.tween = null; u.left = false; w.i = w.path.length; w.sat = true; u.facing = w.face; u.anim = 'idle'; };
  // the lamp lit by the Weigh-House door: a warm pool and a small flame on the wall east of the door, over its threshold (on the stage's camera)
  H16.lampGlow = function (ctx, door, t) {
    var cc = D.iso.center(door[0], door[1], 0), q = D.iso.toScreen(cc.x, cc.y), z = D.iso.zoom || 1, S = ((D.topview && D.topview.TS) || 48) * z, N = H16.SHOT, f = 0.85 + 0.15 * Math.sin(t / 3);
    var p = { x: q.x + 0.45 * S, y: q.y - 1.75 * S }, y = p.y; // (the top view draws the door's face up the wall square and over it -- 10-29, measured in the pane; the lamp at its east jamb)
    var g = ctx.createRadialGradient(p.x, y, 0, p.x, y, 70 * z); g.addColorStop(0, 'rgba(' + N.glow + ',' + (0.5 * f) + ')'); g.addColorStop(1, 'rgba(' + N.glow + ',0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, D.W, D.H);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(Math.round(p.x - 3 * z), Math.round(y - 4 * z), Math.round(6 * z), Math.round(8 * z)); // (the lamp's iron)
    ctx.fillStyle = 'rgba(255,214,120,' + f + ')'; ctx.fillRect(Math.round(p.x - 2 * z), Math.round(y - 3 * z), Math.round(4 * z), Math.round(5 * z)); // (its flame)
  };
  function Night(B, ids, flagsets) {
    this.kind = 'cutaway'; this.opaque = true; this.t = 0; this.seen = 0; this.B = B; this.ids = ids; this.flagsets = flagsets; this.k = 0; this.done = false; var self = this;
    var flags = (flagsets || []).filter(Boolean)[0] || {};
    this.shots = [
      { id: 'lamp', st: H16.stage(['silverton'], function (st, b) { H16.layLamp(st, b, flags); }) },
      { id: 'arrive', st: H16.stage(['hex3'], function (st, b) { H16.layArrive(st, b, self.ids); }) }
    ];
  }
  H16.Night = Night;
  Night.prototype.enter = function () { this.shots.forEach(function (sh) { sh.st.run(null); }); }; // (both floors laid at once, so the cut is not a pause)
  Night.prototype.shot = function () { return this.shots[this.k] || null; };
  Night.prototype.busy = function () {
    var sh = this.shot(), self = this; if (!sh || !sh.st.b) return false;
    return (sh.st.walkers || []).some(function (w) { return !w.sat; }) || (sh.id === 'lamp' && (!sh.st.lit || this.t < H16.CUT.held));
  };
  Night.prototype.ff = function () { var sh = this.shot(); if (!sh) return; (sh.st.walkers || []).forEach(H16.walkDone); if (sh.id === 'lamp' && !sh.st.lit) { sh.st.lit = true; D.sfx('fire'); } this.t = Math.max(this.t, H16.CUT.held); };
  Night.prototype.next = function (hand) { if (hand) this.seen++; this.k++; this.t = 0; if (this.k >= this.shots.length) this.finish(); else D.sfx(this.shot().id === 'arrive' ? 'stairs' : 'popup'); };
  Night.prototype.finish = function () { if (this.done) return; this.done = true; if (D.top() === this) D.pop(); H16.sitting(this.B, this.ids, this.flagsets, false, this.seen >= this.shots.length); }; // (every shot gone past by hand: the sitting's cards said already -- H16.sitting `cut`)
  Night.prototype.step = function () {
    var sh = this.shot(), st = sh && sh.st, t = this.t; if (!st) return;
    if (st.err || !st.b) { this.next(); return; } // (a floor that would not lay: on to the next, and at the last the sitting as before)
    (st.walkers || []).forEach(function (w) { H16.walk(st, w, t); });
    if (sh.id === 'lamp' && !st.lit && t >= H16.CUT.lit) { st.lit = true; D.sfx('fire'); }
  };
  Night.prototype.update = function () {
    var I = D.input, m = I.mouse; this.t++;
    if (I.pressed('b') || m.rclick) { this.finish(); return; }
    if (I.pressed('a') || (m.click && m.inside)) { if (this.busy()) this.ff(); else this.next(true); return; }
    this.step();
  };
  Night.prototype.draw = function (ctx) {
    var sh = this.shot(), self = this; ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, D.W, D.H); if (!sh) return;
    sh.st.run(function (s, b) {
      b.t = self.t; var at = sh.id === 'lamp' ? s.door : H16.tableSq();
      b.focus({ x: at[0], y: at[1], size: 1 }); D.ui.drawBattle(ctx, b);
      if (sh.id === 'lamp') { H16.paintNight(ctx, b); if (s.lit) H16.lampGlow(ctx, s.door, self.t); }
      else { var cc = D.iso.center(at[0], at[1], 0); H16.lowLamps(ctx, D.iso.toScreen(cc.x, cc.y)); }
    });
    var cd = H16.CUT[sh.id], W8 = D.WIN8, ls = cd.line ? D.wrap(cd.line, D.W - 40) : [], bh = 22 + ls.length * 10, by = D.H - 18 - bh;
    D.win8(ctx, 8, by, D.W - 16, bh); D.text(ctx, '{y}' + cd.title + '{/}', 18, by + 6, W8.text);
    ls.forEach(function (l, i) { D.text(ctx, l, 18, by + 17 + i * 10, W8.text); });
    ctx.fillStyle = 'rgba(4,3,10,.95)'; ctx.fillRect(0, D.H - 14, D.W, 14);
    D.hint(ctx, 'click or E: on · X: to the sitting', D.W / 2, D.H - 11, '#9a96a8', 'center');
  };
  // a council's night: the cutscene, then the sitting (a sitting that is not a night's -- C2 -- or no screen to play it on: the sitting alone, as before)
  H16.night = function (B, ids, flagsets) {
    if (!D.ctx || !ids.some(function (id) { return id !== 'looks'; })) return H16.sitting(B, ids, flagsets);
    var n = new Night(B, ids, flagsets); D.push(n); return n;
  };
  // C1 and C3 at the morning: the sitting over the morning screen, played first (a bench, no one watching, takes the flags without the screen -- as the morning's picks, js/house.js Morning)
  var morning0 = D.house.morning;
  D.house.morning = function (o) {
    var m = morning0.apply(this, arguments), Hs = D.house, ff = [Hs.cur && Hs.cur.flags, o && o.floor && o.floor.roam && o.floor.roam.flags], ids = ff[0] ? H16.councilsDue(Object.assign({}, ff[1] || {}, ff[0])) : [];
    if (ids.length) { if (DS.autoPicks || !D.ctx) ids.forEach(function (id) { ff.forEach(function (f) { if (f) f[H16.COUNCIL[id].flag] = 1; }); }); else H16.night(o && o.floor, ids, ff); } // (the night's cutscene, then the sitting: H16.night)
    return m;
  };
  // C2: renown 2 -- Papa's runner once, a Hex boy who finds the party on Silverton's street or in the Hex; on the third floor, the sitting
  H16.lookDue = function (B) {
    var R = D.roam, R0 = B && B.roam, def = R.def; if (!R0 || !def || !R.house() || R0.mode !== 'walk' || R0.path) return false;
    var street = def.key === 'silverton' && def.town && !def.room && !def.hexIn && !def.cut; if (!def.hexIn && !street) return false;
    var f = R0.flags; if (f.councilSeen || C.renownOf() < 2) return false;
    return def.hexIn === 3 || ((street || def.hexIn === 1) && !f.councilCalled);
  };
  // PAPA'S RUNNER (10-29, the story window, RULED on Griz's "Leans stand", his note "papa's runner should appear in game, probably as a popup portrait dialogue"): a Hex boy
  // -- the townsfolk's child -- runs up to the party from a few squares off, says it on the counter screen on his own face (pt_hexboy, the art desk's block; the plain shape till
  // it comes), and runs back the way he came. His words the window's draft, invented.json hexboy-runner-1029
  H16.RUNNER = { name: 'A Hex boy', sheet: 'pt_hexboy', from: [6, 5], lines: ['Papa Urtusk wants you on the Hex\'s third floor. Up the spiral stair, all the way to the top.', 'The council\'s sitting for you. Don\'t make them wait.'] };
  H16.runnerSq = function (B) { // (where he comes from: a free square a few off the party with a way to it; where he stops: beside them, on his side)
    var t = B.roam.token, m = B.map, free = function (x, y) { var s = m.at(x, y); return !!(s && s.walk) && !B.units.some(function (u) { return !u.dead && u.x === x && u.y === y; }); }, best = null;
    [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
      if (best) return; for (var r = H16.RUNNER.from[1]; r <= H16.RUNNER.from[0] + 2; r++) { var x = t.x + d[0] * r, y = t.y + d[1] * r; if (!free(x, y)) continue; var p = H16.route(m, [x, y], [t.x, t.y]); if (p.length > 1 && p.length <= r + 4) { best = { from: [x, y], path: p.slice(0, -1) }; return; } }
    });
    return best;
  };
  // (10-29 night, Griz: "the boy runs up and away a little too fast" -- 6 frames a square till then, now the party's own walk, the floor's step; "should put a quest in your
  // journal to guide you to the third floor" -- the summons is a mission, pinned, done when the party is up the spiral: H16.MISSIONS council)
  H16.runner = function* (B) {
    var R0 = B.roam, G = D.grid, f = R0.flags, w = H16.RUNNER, at = H16.runnerSq(B), boy = null, STEP = (D.roam.def && D.roam.def.step) || 10; f.councilCalled = 1; f.pinWant = 'council'; D.sfx('popup');
    if (at) {
      boy = B.makeFoe({ id: 'hexboy', kind: D.FOES.commonerchild ? 'commonerchild' : 'crewman', at: at.from.slice(), side: 'party', ally: true });
      boy.name = w.name; boy.look = true; boy.npc = 'hexboy'; boy.attacks = {}; boy.multi = 1; boy.hp = boy.maxhp = 4; boy.lvl = 1; boy.anim = 'walk'; boy.animT = B.t;
      B.units.push(boy); G.setup(G.map, B.units); B.focus({ x: Math.round((at.from[0] + R0.token.x) / 2), y: Math.round((at.from[1] + R0.token.y) / 2), size: 1 });
      for (var i = 0; i < at.path.length; i++) { var n = at.path[i]; boy.tween = { fx: boy.x, fy: boy.y, fz: 0, t: 0, dur: STEP, mode: null }; boy.facing = D.spr.facingFor(n[0] - boy.x, n[1] - boy.y); boy.x = n[0]; boy.y = n[1]; yield STEP; }
      boy.anim = 'idle'; boy.animT = B.t; boy.facing = D.spr.facingFor(R0.token.x - boy.x, R0.token.y - boy.y); G.setup(G.map, B.units);
    }
    var sc = new C.Counter(B, { id: 'hexboy', name: w.name, place: D.roam.def.name || 'Silverton', what: 'Papa\'s runner', room: true, script: function (s) { return (function* () { s.sheet = w.sheet; yield s.say(w.lines, 'attentive'); })(); } });
    D.push(sc); while (!sc.done) yield 1;
    if (boy) {
      var back = at.path.slice(0, -1).reverse().concat([at.from]); boy.anim = 'walk'; boy.animT = B.t;
      for (var j = 0; j < back.length; j++) { var b2 = back[j]; boy.tween = { fx: boy.x, fy: boy.y, fz: 0, t: 0, dur: STEP, mode: null }; boy.facing = D.spr.facingFor(b2[0] - boy.x, b2[1] - boy.y); boy.x = b2[0]; boy.y = b2[1]; yield STEP; }
      B.units = B.units.filter(function (u) { return u !== boy; }); G.setup(G.map, B.units);
    }
    B.focus(R0.token); yield 1;
  };
  H16.lookPlay = function* (B) {
    var R0 = B.roam, f = R0.flags;
    if (D.roam.def.hexIn !== 3) { yield* H16.runner(B); return; }
    yield* H16.tableShot(B, H16.COUNCIL.looks.card); // (the council at the long table first, on the map's camera: his "a scene at start or between that shows them on the 3rd floor")
    var sc = H16.sitting(B, ['looks'], [f, D.house && D.house.cur && D.house.cur.flags], true); while (!sc.done) yield 1;
    H16.rise(B);
  };

  // ---------------------------------------------------------------- THE COUNCIL AT THE LONG TABLE (RULED 10-28, his "yes but a scene at start or between that shows them on the 3rd
  // floor", on the window's four calls -- the sittings as portraits stand, and the council is seen at the table). When the council sits -- a council's night (C1's, C3's: the
  // scales lit, from dusk) or the party called up at renown 2 (C2) -- the Hex's third floor seats them at the long table under the Big Window, in their own figures where they
  // have them; the party that climbs up sees them there on the map's camera, the camera along the table and a card: C2 opens with it before its portraits, a council's night
  // shows it once (Warda: stand at the back), and the night's sitting plays at the party's rest as ruled. The seats: the chairs' own places (js/hex.js HX.THIRD: the table at
  // 0,-49 ft, its chairs at x -7.5..7.5, z -52 and -46); who sits where the window's draft (invented.json council-at-the-table)
  H16.TABLE = { mid: [0, -49], stand: [11.25, -49], seats: [['papa', 0, -52], ['androit', -3.75, -52], ['hessle', 3.75, -52], ['casper', -7.5, -52], ['harrow', 7.5, -52], ['merrick', -3.75, -46], ['thrane', 3.75, -46]],
    night: 'The scales are lit. The council sits at the long table under the Big Window, the lamps low. Warda at the lounge door: "Stand at the back. Say nothing."',
    rise: '{g}The council breaks up. Papa goes back down to his door.{/}', word: 'doesn\'t look up from the table. The council is sitting.' };
  // who sits tonight: 'looks' (C2 due), or the night's sittings due (the window's councilsDue) from dusk -- Merrick when word from outside matters (C1, C2), the east side's man for the herd
  H16.atTable = function (flags) {
    var ph = H16.phaseOf(H16.hourNow(D.roam && D.roam.q, null)), due = H16.councilsDue(flags), night = due.length && (ph === 'dusk' || ph === 'night');
    var why = night ? 'night' : !flags.councilSeen && C.renownOf() >= 2 ? 'looks' : null; if (!why) return null;
    var who = ['papa', 'androit', 'hessle', 'casper', 'harrow']; if (why === 'looks' || due.indexOf('notice') >= 0) who.push('merrick'); if (why === 'night' && (due.indexOf('herd') >= 0 || due.indexOf('stock') >= 0)) who.push('thrane');
    return { why: why, who: who };
  };
  var hexDef0 = D.hex.def;
  D.hex.def = function (lv, R0) {
    var def = hexDef0.apply(this, arguments), at = lv === 3 && R0 && R0.flags ? R0.seat || H16.atTable(R0.flags) : null; if (!at) return def; // (R0.seat: the night's picture seats its own -- H16.thirdShot)
    var HX = D.hex, used = {}; def.people.forEach(function (p) { used[p.at[0] + ',' + p.at[1]] = 1; });
    H16.TABLE.seats.forEach(function (s) {
      if (at.who.indexOf(s[0]) < 0) return; var up = (at.stand || []).indexOf(s[0]) >= 0, sp = up ? H16.TABLE.stand : [s[1], s[2]]; // (one who won't sit: at the table's end, facing it)
      var q = HX.near(def.rows, HX.sqAt(sp[0], sp[1]), used); if (!q) return; used[q[0] + ',' + q[1]] = 1;
      def.people.push({ id: 'council' + s[0], at: q, face: up ? [-1, 0] : s[2] < H16.TABLE.mid[1] ? [0, 1] : [0, -1], kind: s[0] === 'papa' ? 'thug' : 'crewman', fig: C.FIG[s[0]] ? s[0] : null, name: H16.WHO[s[0]], look: null, hire: null });
      def.src8.triggers.push({ id: 'talk:council' + s[0], on: 'use', rect: [q[0], q[1], 1, 1], town: 'talk', npc: 'council' + s[0] });
      C.TALK16['council' + s[0]] = [{ say: [H16.WHO[s[0]] + ' ' + H16.TABLE.word] }];
    });
    def.councilAt = at.why; return def;
  };
  // the shot: the camera along the table, then the card, anchored on Papa (his figure, or the plain shape's stand-in)
  H16.tableShot = function* (B, card) {
    var HX = D.hex, m = HX.sqAt(H16.TABLE.mid[0], H16.TABLE.mid[1]), papa = B.units.filter(function (u) { return u.npc === 'councilpapa'; })[0];
    B.focus({ x: m[0], y: m[1], size: 1 }); D.sfx('popup'); yield 30;
    yield { prompt: { who: papa || B.roam.token, title: 'THE HEX, THE THIRD FLOOR', lines: D.roam.wrap([card]), opts: [{ label: 'NEXT', value: 0 }] } };
  };
  // the council risen: off the floor, their squares and words gone with them
  H16.rise = function (B) {
    var R = D.roam, had = B.units.some(function (u) { return /^council/.test(u.npc || ''); }); if (!had) return;
    B.units = B.units.filter(function (u) { return !/^council/.test(u.npc || ''); }); R.def.src8.triggers = R.def.src8.triggers.filter(function (t) { return !/^council/.test(t.npc || ''); });
    R.def.councilAt = null; D.grid.setup(B.map, B.units); B.focus(B.roam.token); B.card(R.wrap([H16.TABLE.rise]), 240);
  };
  // a council's night on the third floor: the shot once a night, the party at the back
  H16.nightDue = function (B) { var R = D.roam, def = R.def, R0 = B && B.roam; return !!(def && def.hexIn === 3 && def.councilAt === 'night' && R0 && R0.mode === 'walk' && !R0.path && R0.tableDay !== H16.day()); };
  H16.nightPlay = function* (B) { B.roam.tableDay = H16.day(); yield* H16.tableShot(B, H16.TABLE.night); };

  // ---------------------------------------------------------------- SILVERTON'S HOURS (the lane's 3; RULED 10-28: his "1 - I'm onboard", the town's clock and WAIT; "2 - basically
  // the stuff the players actually use almost always open, with the shops the players are unlikely to use (or haven't been built yet ...) where those shop keeps roam around town
  // during the evening - breadline in the morning in the slums stuff, prep for what we'll do when the festival is in town - mouseover just 'closed' if closed"; "3 - easier to
  // make the party collection a time independent exception to hours of operation"; "4 - yes", night; "12 agree to script walkings later"; "13 yes, he'd give 4 to the party
  // token"; "14 yes"). THE WORLD's clock (S.t) runs on the town floor: walking moves it lightly (H16.FT_HOUR feet an hour, about the SRD's three miles -- his 10-21 "step-clock
  // will be lenient in towns"), a Hex bout a quarter hour (W.FIGHT_HOURS), a bed to the morning (js/house.js), WAIT to the next bell. Only the band's word is ever shown (his
  // 10-13 "make the players figure it out"). The day has four turns on the floor -- early (dawn, morning), day (midday, afternoon), dusk, night -- and at each the street is
  // laid again for it (H16.relay): the people where the hour puts them (H16.STREET), the keepers whose counters do nothing yet out at an evening spot at dusk with their doors
  // shut till morning (H16.EVENING, H16.SHUT), the bread line at Aldwin's in the early hours, and by night the dark with the lit places lit (H16.LIGHTS). The four hires stand
  // at their spots at every hour; what players use is open at every hour. One table for all of it, with room for a festival's set over it (H16.SETS, empty till the clock
  // lane fills it). The spots and lines the window's drafts, invented.json silverton-hours, silverton-night
  H16.FT_HOUR = 15000;
  H16.band = function (h) { return D.world && D.world.todAt ? D.world.todAt(((h % 24) + 24) % 24) : (h < 5 || h >= 20 ? 'night' : 'day'); };
  H16.phaseOf = function (h) { var b = H16.band(h); return b === 'dawn' || b === 'morning' ? 'early' : b === 'midday' || b === 'afternoon' ? 'day' : b; };
  H16.hourNow = function (q, B) { return D.mines && D.mines.hourNow ? D.mines.hourNow(q, B) : 12; }; // (THE WORLD's under the house; a test door's &hour=, else noon)
  H16.STREET = { // (who moves with the turn: `away` the turns they are off the street; a turn's own spot, a v6 pin and feet east, south)
    pete: { away: ['dusk', 'night'] }, // (to the Hex's bar: the Hex's own Pete, js/hex.js)
    idony: { away: ['night'] }, signy: { away: ['night'] }, towns4: { away: ['night'] }, towns6: { away: ['night'] }, towns7: { away: ['night'] }, towns8: { away: ['night'] },
    brennock: { dusk: { pin: '22', d: [-25, 20] }, away: ['night'] },
    gull: { dusk: { pin: '25', d: [45, 20] }, night: { pin: '25', d: [45, 20] } }, // (the Rows' end, the night crews gathering)
    kael: { dusk: { pin: '26', d: [-20, 25] }, night: { pin: '26', d: [-20, 25] } }, // (his yard's side gate: "After dark, at the side gate")
    oldhob: { dusk: { pin: '29', d: [20, 10] }, night: { pin: '29', d: [20, 10] } } // (by Kess's cellars, where he sleeps)
  };
  H16.EVENING = { marin: { pin: '22', d: [18, 22] }, barber: { mark: 'hexFront', d: [16, 12] }, mela: { pin: '4', d: [0, 40] }, venhale: { pin: '19', d: [0, 40] },
    aldric: { pin: '7', d: [12, 35] }, merrick: { pin: '34', d: [0, 22] }, tam: { pin: '40', d: [0, 22] } };
  // their word out on the street at dusk (10-29 night, Griz: "Out at dusk merchants - same inside text"): not their counter's, which priced what's behind a shut door -- where
  // they are and why, and that the shop is shut till morning, plainly. The story seat's drafts, invented.json dusk-keepers-words-1029
  H16.OUT = {
    marin: ['Shop\'s shut. The dye sits in the vats till morning.', 'Come by in the day for cloth. At dusk I eat Marta\'s pie like everyone else.'],
    barber: ['Fight night\'s coming in. I sit here at the Hex\'s door for whoever the house won\'t pay to stitch.', 'My shop\'s shut till morning. If one of yours is down, Davos Kren\'s door is by the Hex.'],
    mela: ['The baths are banked for the night. I sit by the fountains at dusk and let the town talk.', 'Shut till morning.'],
    venhale: ['The stables lock at dusk, and the fighters with them. I come out to see who walks in at the gate.', 'Want a fight tonight? Korvin\'s slate, inside the Hex. It never closes.'],
    aldric: ['The factor house is shut. At dusk I walk Fountain Street and count the wagons in.', 'Business is by day, at the house.'],
    merrick: ['The window\'s shut to callers. Dusk is when the lanterns talk, and I listen.', 'Come back by day.'],
    tam: ['The smoke room fills after dark, and it\'s no place for you.', 'Go and find a bed.']
  };
  H16.outWords = function (id) { var def = D.roam && D.roam.def; return def && def.hours && !def.room && !def.hexIn && def.phase === 'dusk' && H16.EVENING[id] && H16.OUT[id] ? H16.OUT[id].slice() : null; };
  var keeper0 = C.keeper;
  C.keeper = function* (sc, B, id) { var out = H16.outWords(id); if (out) { yield sc.say(out, 'welcoming'); return; } yield* keeper0.apply(this, arguments); };
  H16.SHUT = { 'keeper:marin': 1, 'keeper:barber': 1, 'keeper:mela': 1, 'keeper:venhale': 1, 'keeper:aldric': 1, 'keeper:falstaff': 1, 'keeper:merrick': 1, 'keeper:tam': 1 }; // (shut at dusk and by night)
  H16.BREAD = { pin: '30', d: [[-15, 18], [-5, 22], [5, 24], [15, 22]] }; // (the line at the chapel's door in the early hours: the Rows' people, the townsfolk's own figures)
  H16.LIGHTS = { doors: ['keeper:sylvia', 'warp:percy', 'keeper:tam', 'keeper:merrick', 'inn:cassia', 'chapel:aldwin', 'leech:davos'], hex: true, gate: 'west', scales: 'keeper:hessle' };
  H16.SETS = {}; // (a set laid over the table on its days -- the festival's, when the clock lane fills it: { festival: { when: fn(day, flags), STREET: {...}, EVENING: {...}, SHUT: {...} } })
  H16.shutNow = function (id) { var R = D.roam, ph = R && R.def && R.def.hours ? R.def.phase : (R && R.def && R.def.room && R.def.townPhase) || 'day'; return !!H16.SHUT[id] && (ph === 'dusk' || ph === 'night'); };
  H16.TURN = { early: 'The bells go for dawn. Silverton wakes: the stalls open, and the bread line forms at Aldwin\'s.', day: 'The bells go for midday.',
    dusk: 'The bells go for dusk. The town comes out: the shops\' keepers on the street, the Hex lit.', night: 'Night. The streets empty; the Hex and vice row stay lit.' };
  H16.WAIT = { bell: 'The bells go for {band}.', ask: 'WAIT' };

  // the town floor laid for its hour: T.floor as it was, then the street by the turn (the def's own people and talk squares), the dark and the lit places
  var floor0 = T.floor;
  T.floor = function (q, flags) {
    var def = floor0.apply(this, arguments); if (!def || !def.town || def.room) return def;
    var h = H16.hourNow(q, H16.relayB || null); // (a relay's floor: its own hour on a test door, kept on the floor as WAIT passes it)
    def.hours = true; def.hour = h; def.phase = H16.phaseOf(h); H16.lay(def, def.phase, flags || {});
    return def;
  };
  H16.lay = function (def, ph, flags) {
    var L = T.laidF && T.laidF[def.ft], ox = def.cut ? def.cut[0] : 0, oy = def.cut ? def.cut[1] : 0, M = def.marks || {}, trig = def.src8.triggers, used = {};
    if (!L) return;
    var key = function (x, y) { return (x + ox) + ',' + (y + oy); };
    def.people.forEach(function (p) { used[key(p.at[0], p.at[1])] = 1; });
    Object.keys(M.doors || {}).forEach(function (k) { var q = M.doors[k]; if (q) { used[key(q[0], q[1])] = 1; used[key(q[0], q[1] + 1)] = 1; } });
    var spot = function (s, dd) {
      var d0 = dd || s.d || [0, 0], m = s.mark && M[s.mark] && (Array.isArray(M[s.mark][0]) ? M[s.mark][0] : M[s.mark]), p0 = m ? [T.X0 + (m[0] + ox + 0.5) * L.F, T.Y0 + (m[1] + oy + 0.5) * L.F] : L.v6pins && L.v6pins[s.pin];
      if (!p0) return null; var sq = T.openNear(L, p0[0] + d0[0], p0[1] + d0[1], used); if (!sq) return null; used[sq[0] + ',' + sq[1]] = 1;
      var w = [sq[0] - ox, sq[1] - oy]; return w[0] >= 0 && w[1] >= 0 && w[0] < def.w && w[1] < def.h ? w : null;
    };
    var talkOf = function (id) { return trig.filter(function (t) { return t.town === 'talk' && t.npc === id && !t.stall; })[0]; };
    def.people = def.people.filter(function (p) {
      var s = H16.STREET[p.id]; if (!s) return true;
      if ((s.away || []).indexOf(ph) >= 0) { def.src8.triggers = trig = trig.filter(function (t) { return !(t.town === 'talk' && t.npc === p.id); }); return false; }
      if (s[ph]) { var w = spot(s[ph]); if (w) { p.at = w; var tt = talkOf(p.id); if (tt) tt.rect = w.concat([1, 1]); } }
      return true;
    });
    var add = function (id, w, kind) { def.people.push({ id: id, at: w, kind: kind || 'crewman', face: [0, 1], look: null, hire: null }); trig.push({ id: 'talk:' + id, on: 'use', rect: w.concat([1, 1]), town: 'talk', npc: id }); };
    if (ph === 'dusk') Object.keys(H16.EVENING).forEach(function (id) { var w = spot(H16.EVENING[id]); if (w) add(id, w); });
    if (ph === 'early') H16.BREAD.d.forEach(function (dd, k) { var w = spot(H16.BREAD, dd); if (w) add('breadline' + k, w, 'bandit'); });
    def.night = ph === 'night'; def.dusk = ph === 'dusk'; // (the street's own picture of the hour: H16.paintNight -- not the floor's dark, which the town's top view draws as black)
    var lights = [], lit = function (q, id, r) { if (q) lights.push({ id: 'town:' + id, kind: 'map', x: q[0], y: q[1], bright: r || 10, dim: r || 10, color: 'fire', flame: true, town: true }); };
    if (def.night) {
      H16.LIGHTS.doors.forEach(function (k) { var q = M.doors && M.doors[k]; if (q) lit([q[0], q[1] + 1], k); });
      if (H16.LIGHTS.hex) [].concat(M.hexFront || [], M.hexBack || []).forEach(function (q, i) { lit(q, 'hex' + i, 15); });
      lit(M.gates && M.gates[H16.LIGHTS.gate], 'gate');
      if (H16.councilsDue(flags).length) { var qh = M.doors && M.doors[H16.LIGHTS.scales]; if (qh) lit([qh[0], qh[1] + 1], 'scales', 15); } // (the Weigh-House lamp: the scales lit, the council sitting)
    }
    def.townLights = lights;
  };
  // the street laid again at a turn of the hour (or back out of a door the hour turned behind): its people, its talk squares, its dark and lights
  H16.relay = function (B, h) {
    var R = D.roam, def = R.def, keep = D.MAPS.silverton, nd; H16.relayB = B; try { nd = T.floor(R.q, B.roam.flags); } finally { H16.relayB = null; D.MAPS.silverton = keep; }
    def.people = nd.people; def.townLights = nd.townLights; def.night = nd.night; def.dusk = nd.dusk; def.phase = nd.phase; def.hour = h;
    def.src8.triggers = def.src8.triggers.filter(function (t) { return t.town !== 'talk'; }).concat(nd.src8.triggers.filter(function (t) { return t.town === 'talk'; }));
    B.units = B.units.filter(function (u) { return !u.npc; }); T.people(B); D.grid.setup(B.map, B.units); B.cache = null; B.lightMap = null;
  };
  // the street by night is the overlay's (H16.paintNight), not the floor's dark: the town's top view has no light map and draws a dark floor black (seen 10-28 in the pane) --
  // so the floor's dark stays off on the street, and a room or the Hex inside is lit as ever
  H16.light = function (B) { var def = D.roam && D.roam.def; if (B && def && def.hours && !def.room && !def.hexIn && B.dark) { B.dark = false; if (B.fight) B.fight.dark = false; B.lightMap = null; } };
  H16.nightOn = function (B) { var def = D.roam && D.roam.def; return !!(B && def && def.hours && !def.room && !def.hexIn && (def.night || def.dusk)); };
  // the hour's picture over the street, under the HUD: dusk a warm wash; night a dark one, cut away in pools at the lit places and round the party (and warm at the lamps)
  H16.NIGHT = { wash: 'rgba(6,8,30,0.72)', dusk: 'rgba(80,34,40,0.2)', glow: '255,170,90', party: 2.5 };
  H16.paintNight = function (ctx, B) {
    if (!H16.nightOn(B)) return; var def = D.roam.def, N = H16.NIGHT, iso = D.iso, c = H16.nc || (H16.nc = document.createElement('canvas'));
    if (c.width !== D.W || c.height !== D.H) { c.width = D.W; c.height = D.H; }
    var x = c.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, D.W, D.H); x.fillStyle = def.night ? N.wash : N.dusk; x.fillRect(0, 0, D.W, D.H);
    if (def.night) {
      var sq = function (gx, gy) { var cc = iso.center(gx, gy, 0); return iso.toScreen(cc.x, cc.y); }, a = sq(0, 0), b = sq(1, 0), px = Math.max(2, Math.hypot(b.x - a.x, b.y - a.y));
      var pool = function (gx, gy, rq, k, col) { var p = sq(gx, gy), r = rq * px, g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, 'rgba(' + (col || '0,0,0') + ',' + k + ')'); g.addColorStop(0.55, 'rgba(' + (col || '0,0,0') + ',' + (k * 0.55) + ')'); g.addColorStop(1, 'rgba(' + (col || '0,0,0') + ',0)'); x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, r, 0, Math.PI * 2); x.fill(); };
      var ls = def.townLights || [], t = B.roam && B.roam.token;
      x.globalCompositeOperation = 'destination-out'; ls.forEach(function (l) { pool(l.x, l.y, l.bright >= 15 ? 4 : 3, 0.95); }); if (t) pool(t.x, t.y, N.party, 0.8);
      x.globalCompositeOperation = 'source-over'; ls.forEach(function (l) { pool(l.x, l.y, 2, 0.3, N.glow); });
    }
    ctx.drawImage(c, 0, 0);
  };
  var over0 = D.roam.paintOver;
  D.roam.paintOver = function (ctx, B) { try { H16.paintNight(ctx, B); } catch (e) { } return over0.apply(this, arguments); };
  // the clock on the street: an hour each H16.FT_HOUR feet walked
  H16.pass = function (B, hrs) {
    var W = D.world, S = W && W.state && D.house && D.house.playing ? W.state() : null;
    if (S && S.t != null) { S.t += hrs; if (W.save) W.save(); } else if (B && B.roam) { var R0 = B.roam; R0.hour = (((R0.hour != null ? R0.hour : (D.roam.def.hour || 12)) + hrs) % 24 + 24) % 24; }
    var lo = S && D.house.lightsOut ? D.house.lightsOut(B) : []; if (lo.length && B && B.card) B.card(D.roam.wrap(['{g}' + lo.join(' ') + '{/}']), 220); // (a Light's hour up on the street: js/house.js H.lightsOut, 10-28)
  };
  var arrive0 = D.roam.arrive;
  D.roam.arrive = function* (B) {
    var ev = yield* arrive0.apply(this, arguments), def = D.roam.def;
    if (!ev && def && def.hours && !def.room && B.roam && D.battle === B) { var R0 = B.roam; R0.hourFt = (R0.hourFt || 0) + (def.ft || 5); if (R0.hourFt >= H16.FT_HOUR) { R0.hourFt -= H16.FT_HOUR; H16.pass(B, 1); } }
    return ev;
  };
  // the turn: the hour's turn now not the street's -- laid again, and said
  H16.turnDue = function (B) { var R = D.roam, def = R.def, R0 = B && B.roam; return !!(def && def.hours && !def.room && R0 && R0.mode === 'walk' && !R0.path && H16.phaseOf(H16.hourNow(R.q, B)) !== def.phase); };
  H16.turnPlay = function* (B) {
    var h = H16.hourNow(D.roam.q, B), was = D.roam.def.phase; H16.relay(B, h); H16.light(B);
    if (D.roam.def.phase !== was) { D.sfx('popup'); B.card(D.roam.wrap([H16.TURN[D.roam.def.phase]]), 320); yield 20; }
  };
  // WAIT (the field menu, on the street: js/menu.js host.wait): to the next bell -- its band's word, and the street laid again if the turn turned
  H16.canWait = function (B) { var def = D.roam && D.roam.def; return !!(def && def.hours && !def.room && B && B.roam && B.roam.mode === 'walk'); };
  H16.wait = function (B) { if (H16.canWait(B)) B.roam.waitAsk = 1; };
  H16.waitDue = function (B) { return !!(B && B.roam && B.roam.waitAsk && H16.canWait(B)); };
  H16.STARTS = [5, 7, 11, 14, 17, 20];
  H16.waitPlay = function* (B) {
    B.roam.waitAsk = 0; var h = H16.hourNow(D.roam.q, B), hh = ((h % 24) + 24) % 24, nx = H16.STARTS.filter(function (s) { return s > hh + 0.001; })[0], hrs = (nx != null ? nx : 24 + H16.STARTS[0]) - hh;
    H16.pass(B, hrs); var h2 = H16.hourNow(D.roam.q, B), was = D.roam.def.phase;
    if (H16.phaseOf(h2) !== was) { yield* H16.turnPlay(B); return; }
    D.roam.def.hour = h2; D.sfx('popup'); B.card(D.roam.wrap([H16.WAIT.bell.replace('{band}', H16.band(h2))]), 240); yield 20;
  };
  // a shut door: "Closed." -- on a click, and on its sign's mouseover (his "mouseover just 'closed' if closed")
  var fire0 = T.fire;
  T.fire = function* (B, trig) {
    if (trig && trig.town === 'door' && H16.shutNow(trig.id)) { B.card(D.roam.wrap(['{y}' + T.doorName(trig.id) + '{/}', 'Closed.']), 200); D.sfx('popup'); yield 10; return; }
    yield* fire0.apply(this, arguments);
  };
  var sign0 = T.signName;
  T.signName = function (id) { var o = sign0.apply(this, arguments); if (o && H16.shutNow(id)) { o = Object.assign({}, o); o.name = o.name + ' -- closed'; o.who = null; } return o; };
  // the bread line's loaf (his "13 yes, he'd give 4 to the party token"): a second game's own thing (content/items.json is the first game's), the SRD's day of rations as bread --
  // out of a fight it is eaten for a little; at Aldwin's in the early hours, a loaf a hero into the party's pack, once a morning
  if (DS.DATA && DS.DATA.items && !DS.DATA.items.missionbread) DS.DATA.items.missionbread = { name: 'Mission Bread', kind: 'use', price: 0, use: { effect: 'heal', dice: '1d2', target: 'ally', battle: false, field: true },
    desc: 'A loaf off Aldwin\'s bread line. Eaten on the road: 1d2 hit points and a full stomach.', src: 'the second game\'s (deep16/js/hours.js): his 10-28 "breadline in the morning in the slums"' };
  H16.BREADLINE = { give: '{g}Aldwin breaks the morning\'s bread for the line, and hands the party a loaf each: {n} Mission Bread.{/}', gone: '{g}The bread line\'s done for the morning.{/}' };
  var chapel0 = C.SCRIPTS.chapel;
  C.SCRIPTS.chapel = C.chapel = function* (sc, B) {
    var st = sc.st, f = st.flags, h = H16.hourNow(D.roam && D.roam.q, B), dk = 'bread:' + H16.day();
    if (H16.phaseOf(h) === 'early' && !f[dk]) { var n = st.party.filter(function (x) { return !x.dead; }).length; if (n) { f[dk] = 1; C.give(st, 'missionbread', n); D.sfx('chest'); yield sc.say([H16.BREADLINE.give.replace('{n}', n)], 'work'); } }
    yield* chapel0.apply(this, arguments);
  };
  C.VENDORS.aldwin.script = 'chapel';
  // a bed in town -- Cassia's rooms, Aldwin's floor -- is the SRD's long rest, eight hours from lying down, not on to the next morning (10-28 2258Z, his "in town sleeps seem to past
  // days rather than long rest": a bed at seven had slept a whole day round; the Glowseep's fire the same since 10-27, js/mines.js M.SEEP.restHours)
  H16.BED_HOURS = 8;
  C.sleep = function* (B) {
    if (!B || !B.roam || !D.house || !D.house.sleepOnFloor) return;
    var h1 = (H16.hourNow(D.roam && D.roam.q, B) + H16.BED_HOURS) % 24, wk = D.mines && D.mines.wakeAt ? D.mines.wakeAt(h1) : null; // (the waking card by the hour, as the Glowseep's fire: MORNING, AFTERNOON, DUSK, NIGHT)
    yield* D.house.sleepOnFloor(B, { music: 'inn', hours: H16.BED_HOURS, title: wk ? wk.title : null });
  };
  // a Hex bout a quarter of an hour on the clock (his 10-28 "fights should burn 15 minutes instead of an hour of worldtime": js/world.js W.FIGHT_HOURS)
  if (D.hex && D.hex.bout) { var bout0 = D.hex.bout; D.hex.bout = function* (B) { var r = yield* bout0.apply(this, arguments); H16.pass(B, (D.world && D.world.FIGHT_HOURS) || 0.25); return r; }; }
  // the town's lights laid with its people (the floor's first laying, and a relay's)
  var people0 = T.people;
  T.people = function (B) { people0.apply(this, arguments); (B.units || []).forEach(function (u) { if (/^breadline\d/.test(u.npc || '')) u.name = 'In the bread line'; }); H16.light(B); };
  [['Bread at six. Don\'t push.'], ['He gives it to everyone. Even the proud, at quarter past.'], ['Shift\'s at seven. Bread first.'], ['Mind the line. It moves.']].forEach(function (s, k) { C.TALK16['breadline' + k] = [{ say: s }]; });
  // THE LINE MOVES (10-29 night, Griz: "Breadline is good except it says that it moves and doesn't yet" -- the story seat's lean, built, a call standing: the line moves, the
  // word kept): in the early hours, every H16.BREAD.every frames on the street, the one at the front steps up to the chapel door and goes in, the rest each step up a place, and
  // a newcomer comes up behind. Their talk squares go with them. Asked each frame the floor's script asks its beats (H16.due), the party never waiting on it.
  // THEY GET THEIR BREAD AND LEAVE (10-30, Griz on the seat's call: "solid, i assume they get their bread and leave" -- RULED): the one at the door goes in, comes back out with a
  // loaf in hand, and walks down the street to the nearest other door and in at it (home, or the shift); later someone new comes up behind the line (the same figure again, out of
  // sight first: the line's four are one look). The legs: 0 to the door and the rest up, 1 inside, 2 out with the loaf, 3 the walk away, 4 the newcomer
  H16.BREAD.every = 420; H16.BREAD.step = 14; H16.BREAD.inside = 120; H16.BREAD.away = [6, 40]; // (away: the nearest other door at least this far from the chapel's, by a walk no longer)
  H16.breadTick = function (B) {
    var R = D.roam, def = R && R.def, R0 = B && B.roam; if (!def || !def.hours || def.room || def.hexIn || !R0 || !B.units || !B.map) return;
    var line = B.units.filter(function (u) { return /^breadline\d/.test(u.npc || '') && !u.dead; }), dq = def.marks && def.marks.doors && def.marks.doors['chapel:aldwin'], P = H16.BREAD;
    line.forEach(function (u) { if (u.walkTill != null && B.t >= u.walkTill) { u.anim = 'idle'; u.animT = B.t; u.walkTill = null; } });
    var st = R0.bread;
    if (st && st.u && line.some(function (u) { return u !== st.u && u.npc === st.npc; })) st = null; // (the street laid again under it: the line's own new four, the one out of it gone with the old)
    if (def.phase !== 'early') { if (st && st.u) { st.u.loaf = false; } R0.bread = null; return; }
    if (R0.mode !== 'walk' || D.top() !== B || !dq) return;
    if (!st) st = R0.bread = { t: B.t + P.every, leg: 0 };
    if (B.t < st.t || (!st.leg && line.length < 2)) return;
    var tk = R0.token, dist = function (q) { return Math.abs(q[0] - dq[0]) + Math.abs(q[1] - dq[1]); }, trOf = function (u) { return def.src8.triggers.filter(function (t) { return t.town === 'talk' && t.npc === u.npc; })[0]; };
    var free = function (x, y) { var s = B.map.at(x, y); return !!(s && s.walk) && !(tk && tk.x === x && tk.y === y) && !B.units.some(function (u) { return !u.dead && u.x === x && u.y === y; }); };
    var occ = null, taken = function (x, y) { // (for the walk away: round the line and the party -- who stands where, read once a tick)
      if (!occ) { occ = {}; B.units.forEach(function (o) { if (!o.dead && o !== st.u) occ[o.x + ',' + o.y] = 1; }); if (tk) occ[tk.x + ',' + tk.y] = 1; }
      return !!occ[x + ',' + y];
    };
    var move = function (u, q, talk) {
      var dx = q[0] - u.x, dy = q[1] - u.y, n = Math.max(Math.abs(dx), Math.abs(dy)) || 1, tr = trOf(u);
      u.tween = { fx: u.x, fy: u.y, fz: 0, t: 0, dur: P.step * n, mode: null }; u.facing = D.spr.facingFor(dx, dy); u.x = q[0]; u.y = q[1]; u.anim = 'walk'; u.animT = B.t; u.walkTill = B.t + P.step * n;
      if (tr) tr.rect = talk === false ? [-9, -9, 1, 1] : [q[0], q[1], 1, 1]; return P.step * n;
    };
    var off = function (u) { B.units = B.units.filter(function (x) { return x !== u; }); var tr = trOf(u); if (tr) tr.rect = [-9, -9, 1, 1]; }; // (out of sight: in at a door; no word to be had)
    var u = st.u, long = 0;
    if (st.leg === 0) { // (the front one to the door, the rest up a place)
      if (!free(dq[0], dq[1])) { st.t = B.t + 60; return; } // (someone in the doorway -- the party: wait a moment)
      line.sort(function (a, b) { return dist([a.x, a.y]) - dist([b.x, b.y]); });
      var spots = line.map(function (x) { return [x.x, x.y]; });
      long = move(line[0], dq, false); for (var k = 1; k < line.length; k++) long = Math.max(long, move(line[k], spots[k - 1]));
      st.leg = 1; st.u = line[0]; st.npc = line[0].npc; st.back = spots[spots.length - 1]; st.t = B.t + long + 10;
    } else if (st.leg === 1) { // (in at Aldwin's door)
      off(u); st.leg = 2; st.t = B.t + P.inside;
    } else if (st.leg === 2) { // (back out with the loaf, and the way to the nearest other door down the street)
      if (!free(dq[0], dq[1])) { st.t = B.t + 30; return; }
      u.x = dq[0]; u.y = dq[1]; u.tween = null; u.loaf = true; B.units.push(u);
      var M = def.marks.doors, cands = Object.keys(M).filter(function (k) { return k !== 'chapel:aldwin' && M[k] && Math.max(Math.abs(M[k][0] - dq[0]), Math.abs(M[k][1] - dq[1])) >= P.away[0]; }).map(function (k) { return M[k]; });
      cands.sort(function (a, b) { return dist(a) - dist(b); }); st.path = null; st.to = null;
      for (var c = 0; c < cands.length && c < 6 && !st.path; c++) { var pth = H16.route(B.map, dq, cands[c], taken); if (pth.length >= P.away[0] && pth.length <= P.away[1]) { st.path = pth.slice(); st.to = cands[c]; } } // (H16.route: the squares after the door, up to the other, round the line; a "path" shorter than the door's distance is its no-way)
      if (!st.path) st.path = []; // (no door in reach: back inside the way it came)
      st.leg = 3; st.t = B.t + 10;
    } else if (st.leg === 3) { // (down the street, a square a step; in at the door at the walk's end)
      var nx = st.path[0];
      if (nx && !free(nx[0], nx[1])) { // (someone stepped in the way -- the party: round them, or wait)
        var re = st.to ? H16.route(B.map, [u.x, u.y], st.to, taken) : []; if (re.length && re.length <= P.away[1] && free(re[0][0], re[0][1])) st.path = re; else { st.t = B.t + 20; return; }
        nx = st.path[0];
      }
      if (nx) { st.path.shift(); move(u, nx, false); st.t = B.t + P.step; return; }
      u.loaf = false; off(u); st.leg = 4; st.t = B.t + Math.round(P.every / 2);
    } else { // (a newcomer up behind, from the square past the back of the line)
      var bk = st.back, best = null;
      if (!free(bk[0], bk[1])) { st.t = B.t + 60; return; }
      [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].forEach(function (d) { var x = bk[0] + d[0], y = bk[1] + d[1]; if (free(x, y) && dist([x, y]) > dist(bk) && (!best || dist([x, y]) > dist(best))) best = [x, y]; });
      u.x = (best || bk)[0]; u.y = (best || bk)[1]; u.tween = null; B.units.push(u); move(u, bk); st.leg = 0; st.u = null; st.npc = null; st.t = B.t + P.every;
    }
    D.grid.setup(B.map, B.units);
  };
  // the loaf in the hand of the one walking off with it: a crust drawn at the hands, over the street (the floor's figures have no carried thing)
  H16.paintLoaves = function (ctx, B) {
    var R = D.roam, def = R && R.def; if (!B || !B.units || !def || !def.hours || def.room || def.hexIn) return 0;
    var iso = D.iso, n = 0, at = function (gx, gy, z) { var c = iso.center(gx, gy, z); return iso.toScreen(c.x, c.y); }, a = at(0, 0, 0), b = at(1, 0, 0), px = Math.max(2, Math.hypot(b.x - a.x, b.y - a.y));
    B.units.forEach(function (u) {
      if (!u.loaf) return; var tw = u.tween, k = tw ? Math.min(1, tw.t / tw.dur) : 1, gx = tw ? tw.fx + (u.x - tw.fx) * k : u.x, gy = tw ? tw.fy + (u.y - tw.fy) * k : u.y, p = at(gx, gy, 12);
      var w = Math.max(3, px * 0.28), h = Math.max(2, w * 0.55); ctx.save(); ctx.fillStyle = '#6b3d14'; ctx.beginPath(); ctx.ellipse(p.x + px * 0.18, p.y, w / 2 + 1, h / 2 + 1, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d0954a'; ctx.beginPath(); ctx.ellipse(p.x + px * 0.18, p.y, w / 2, h / 2, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); n++;
    });
    return n;
  };
  var overL = D.roam.paintOver;
  D.roam.paintOver = function (ctx, B) { try { H16.paintLoaves(ctx, B); } catch (e) { } return overL.apply(this, arguments); }; // (under the HUD, as the night's picture)

  // ---------------------------------------------------------------- HESSLE'S BOARD, ON THE WEIGH-HOUSE WALL (10-29, the story window, on the lanes desk's relay of Griz: "we actually
  // also need a visible board, either inside or outside of hessles - the way hessle reads the board should instead be clickable missions below it (as if they're taking the mission
  // off the board) - I think at present it's a multipart mission or something"). Outside, the window's call: on the Weigh-House's front wall beside its door on Fountain Street (the
  // story window's 10-28 words, "on the Weigh-House wall"), where the street sees it -- drawn in code on the wall's face (a plank board, a paper nailed up for each bounty standing,
  // the cloaker's gone brown, the Snoot's under its seal); E at it or a click: its own screen, the board in the portrait's place and each paper a TAKE of its own -- taken down, its
  // mission in the JOURNAL and pinned (pinWant), Finding Work done (boardRead); the Snoot's paper stays up (true word is brought, not fetched). Hessle keeps the scales and pays
  // there (js/counter.js C.hessle); he no longer reads the board aloud. The words the window's drafts, invented.json hessle-board-1029
  H16.BOARD = {
    name: 'Hessle\'s board', what: 'the Weigh-House wall, Fountain Street', size: [0.78, 0.5], tip: ['Hessle\'s board', 'The town\'s bounties: take a paper down'],
    head: ['Hessle\'s board, on the Weigh-House wall: the town\'s bounties, each one nailed up and sworn before notary.', 'Take a paper down and the job is yours. Bring proof to Hessle inside, and the scales pay it.'],
    ask: 'Which paper do you take down?', took: 'You take the paper down off its nail. It goes in your JOURNAL.',
    snoot: 'That one stays up: true word is brought to Hessle, whoever brings it.',
    papers: [ // (the order nailed up; `mission` its JOURNAL line, `flag` the word that opens it; `done` paid at the scales)
      { id: 'ettercap', label: 'FORTY GOLD: THE WEB GULCH ETTERCAP', text: 'hessle.boardEttercap', flag: 'heardEttercap', mission: 'ettercap', done: 'ettercapDone', ink: '#e8e0c8' },
      { id: 'cloaker', label: 'FORTY GOLD: THE CLOAKER IN THE GUANO MINE', text: 'hessle.boardCloaker', flag: 'heardCloaker', mission: 'tail', done: 'cloakerDone', ink: '#c8b088' },
      { id: 'snoot', text: 'hessle.boardSnoot', done: 'snootWord', stays: true, ink: '#e8e0c8', seal: true, up: function (f) { return C.noticeUp(f); } }
    ] };
  H16.papers = function (f) { f = f || {}; return H16.BOARD.papers.filter(function (p) { return !f[p.done] && !f['paper:' + p.id] && (!p.up || p.up(f)); }); }; // (what is nailed up now)
  H16.boardSq = function (def, m) { // (the wall square west of the Weigh-House's door, else east of it: solid, the street open in front of it)
    var d = def && def.marks && def.marks.doors && def.marks.doors['keeper:hessle']; if (!d || !m) return null;
    var ok = function (x) { var s = m.at(x, d[1] - 1), f = m.at(x, d[1]); return s && !s.open && f && f.open ? [x, d[1] - 1] : null; };
    return ok(d[0] - 1) || ok(d[0] + 1);
  };
  // the board on the wall's face, in a box (x, y, w, h: screen px; k the px a board px) -- planks framed dark, a paper for each nailed up
  H16.boardPaint = function (ctx, x, y, w, h, ps, k) {
    var r = function (c, a, b, ww, hh) { ctx.fillStyle = c; ctx.fillRect(Math.round(a), Math.round(b), Math.max(1, Math.round(ww)), Math.max(1, Math.round(hh))); };
    r('#2a1a0e', x, y, w, h); r('#7a5a34', x + 2 * k, y + 2 * k, w - 4 * k, h - 4 * k);
    for (var py = y + 2 * k + 5 * k; py < y + h - 3 * k; py += 5 * k) r('#684a2a', x + 2 * k, py, w - 4 * k, k); // (the planks)
    r('#9a7444', x + 2 * k, y + 2 * k, w - 4 * k, k); // (its top edge catching the light)
    var n = ps.length, pw = Math.min(9 * k, (w - 6 * k) / Math.max(1, n) - 2 * k), ph = Math.min(h - 7 * k, pw * 1.3);
    ps.forEach(function (p, i) {
      var cx = x + 3 * k + (i + 0.5) * (w - 6 * k) / n, px = cx - pw / 2, py = y + 3.5 * k + (i % 2) * k;
      r('rgba(20,12,6,0.45)', px + k, py + k, pw, ph); r(p.ink, px, py, pw, ph); // (its shadow, the paper)
      for (var l = 0; l < 3; l++) r('#5a5048', px + 1.5 * k, py + (3 + l * 2) * k, pw - 3 * k - (l === 2 ? pw * 0.3 : 0), Math.max(1, k * 0.6)); // (the ink)
      r('#9a9aa6', cx - 0.5 * k, py - 0.5 * k, k, k); // (its nail)
      if (p.seal) r('#b02828', cx - k, py + ph - 3 * k, 2 * k, 2 * k); // (sworn: the seal)
    });
  };
  H16.boardRect = function (m, s) { // (its box on the screen: standing at the wall's foot and up it, a store sign's size -- the top view's faces are low, js/topview.js TV.signAt)
    var TV = D.topview, T = TV.TS, z = D.iso.inWorld ? 1 : D.iso.zoom || 1, bot = (s.y + 1) * T - (s.gz || 0);
    var bw = T * H16.BOARD.size[0], bh = T * H16.BOARD.size[1], p = D.iso.toScreen(s.x * T + (T - bw) / 2, bot - 3 - bh);
    return { x: p.x, y: p.y, w: bw * z, h: bh * z, k: z * bw / 36 };
  };
  H16.boardLay = function (B) {
    var R = D.roam, def = R && R.def, m = B && B.map; if (!def || def.key !== 'silverton' || def.room || def.hexIn || !m || !m.top) return;
    var q = H16.boardSq(def, m); def.board = q; if (!q) return;
    var tr = def.src8 && def.src8.triggers; if (tr && !tr.some(function (t) { return t.id === 'board:hessle'; })) tr.push({ id: 'board:hessle', on: 'use', rect: [q[0], q[1], 1, 1], town: 'board' });
    m.props = (m.props || []).filter(function (p) { return !p.board; });
    var s = m.at(q[0], q[1]);
    m.props.push({ board: true, sq: s, draw: function (ctx) { var st = C.state(B), b = H16.boardRect(m, s); H16.boardPaint(ctx, b.x, b.y, b.w, b.h, H16.papers(st && st.flags), b.k); } });
  };
  var peopleB = T.people;
  T.people = function (B) { peopleB.apply(this, arguments); H16.boardLay(B); };
  // its name under the mouse, as a store's sign names the store (js/topview.js TV.signTip)
  if (D.topview && D.topview.signTip) {
    var tip0 = D.topview.signTip;
    D.topview.signTip = function (ctx, m, sx, sy) {
      var o = tip0.apply(this, arguments); if (o) return o;
      var def = m && m.def, q = def && def.board, s = q && m.at(q[0], q[1]); if (!s) return null;
      var b = H16.boardRect(m, s); if (sx < b.x || sx >= b.x + b.w || sy < b.y - 4 || sy >= b.y + b.h + 4) return null;
      var ls = H16.BOARD.tip, w = Math.max.apply(null, ls.map(function (l) { return D.textWidth(l); })) + 10, h = ls.length * 10 + 5, x = Math.max(2, Math.min(D.W - w - 2, Math.round(b.x + b.w / 2 - w / 2))), y = Math.max(2, Math.round(b.y - h - 2));
      ctx.fillStyle = 'rgba(10,12,34,0.9)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(232,208,112,0.85)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      D.text(ctx, ls[0], x + 5, y + 3, '#e8d070'); D.text(ctx, ls[1], x + 5, y + 13, '#b4b4c8');
      return { door: null, lines: ls };
    };
  }
  // the board's screen: the board in the portrait's place, a TAKE for each paper that can be taken, the Snoot's said and left up
  H16.boardPic = function (st) { return function (ctx, x, y, w, h) {
    ctx.fillStyle = '#4a4652'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#3a3742'; for (var yy = y + 10; yy < y + h; yy += 14) ctx.fillRect(x, yy, w, 1); // (the Weigh-House's stone, its courses)
    var bw = w * 0.86, bh = Math.min(h * 0.56, bw * 0.8); H16.boardPaint(ctx, x + (w - bw) / 2, y + h * 0.16, bw, bh, H16.papers(st && st.flags), bw / 36);
  }; };
  H16.boardPlay = function* (B) {
    var st = C.state(B), W = H16.BOARD; if (!st) return;
    var sc = new C.Counter(B, { id: 'board', name: W.name, place: W.name, what: W.what, room: true, pic: H16.boardPic(st), script: function (s) { return (function* () {
      var f = st.flags; yield s.say(W.head.slice(), 'attentive');
      while (true) {
        var ps = H16.papers(f), take = ps.filter(function (p) { return !p.stays; }), stay = ps.filter(function (p) { return p.stays; });
        var pre = stay.length ? [].concat(C.L(stay[0].text), [W.snoot]) : [];
        if (!take.length) { yield s.say(pre.concat(C.L('hessle.boardClear'))); return; }
        var a = yield s.ask(pre.concat([W.ask]), take.map(function (p) { return 'TAKE: ' + p.label; }).concat(['LEAVE']));
        if (a == null || a >= take.length) return;
        var p = take[a]; f['paper:' + p.id] = 1; f.boardRead = 1; C.flagOn(st, p.flag); f.pinWant = p.mission; D.sfx('confirm');
        yield s.say([].concat(C.L(p.text), [W.took]), 'work');
      }
    })(); } });
    D.push(sc); while (!sc.done) yield 1;
  };
  var fireB = T.fire;
  T.fire = function* (B, trig) { if (trig && trig.town === 'board') { yield* H16.boardPlay(B); return; } yield* fireB.apply(this, arguments); };
  H16.HESSLE.before = 'The board\'s on the wall outside my door. Take a paper down; the scales pay what\'s posted, sworn before notary.'; // (10-29: the board outside -- was "The board. Read it.")

  // ---------------------------------------------------------------- THE WORDS PASS, FOR NEW AND YOUNGER PLAYERS (the lane's 4.9; his note: "Dialogue review for vaguery reduction
  // for new and younger players"). Two layers: a person speaks in their own voice, and the card that opens a mission says plainly what to do and where (H16.missionCard). Here,
  // the lines that sent a player nowhere they could go, or priced what the second game doesn't sell, said plainly on the second game's side (C.TALK16 over content/npcs.json's;
  // H16.TEXT over content/text.json's, on this page only -- the first game keeps its own words). The window's drafts, invented.json words-pass-plain
  Object.assign(C.TALK16, {
    oldhob: [{ say: ['Hob Rennick. I milk the crawlers at the cradles, across the water. Years of it. The venom\'s in me now: that\'s what dosed means.', 'Work a shift at the cradles beside me and I\'ll talk.'], rumor: 'r-doserate' }],
    kael: [{ say: ['Ladders and poles, for the shafts. Half my props walk off by night.', 'Crews I know by sight. I don\'t name them.'] }],
    // (Vera since 10-29 night, Griz: "vera doesn't actually sell and claims to": she has no counter in the second game, so she says so -- nothing for strangers either way)
    vera: [{ say: ['Nothing on my table is for strangers, and I don\'t buy from them. Kessler, the pawnbroker on Fountain Street, buys: sell to him, not me.', 'Books don\'t come to me. Androit the notary pays for those: a real one, written by one hand from the first page to the last. Nobody in Silverton has brought him one.'] }],
    merrick: [{ say: ['I send word by the lantern network. A dusk sending is cheaper; a noon sending tells everyone it\'s urgent.', 'Thirty silver at the window frees a slave. No questions asked, either way.'], rumor: 'r-lantern' }],
    venhale: [{ say: ['The fighters\' stables. Part gymnasium, part debtors\' prison.', 'You want to fight? Korvin\'s slate, inside the Hex. That\'s where you put your name down.'], rumor: 'r-hexcard' }]
  });
  // THE WARRENS' WORDS, AND THE BARBER'S (10-29, the story window, RULED on Griz's "Leans stand", on his notes of 10-29 1808Z): Pete once the five are home stops saying six
  // ("post quest edric text" -- Edric's after-line below, Pete's beside it); Venn the barber-surgeon and Davos Kren by the realm's "shares arena surgery work on a territorial
  // understanding" (TarlynsPit/silverton-personae.md slot 10; the leech-house the arena's own surgery, the mother pays its bills -- the-hex.md), the territory the window's lean,
  // RULED: the house's fighters Davos's, what the house won't pay for Venn's, from the Hex's door on fight nights (his dusk spot, H16.EVENING). invented.json
  // warrens-five-words-1029, barber-davos-territory
  var PETE_AFTER = [{ 'if': 'flag:fiveDone', say: ['Five came up. Edric wrote them in, every one.', 'He doesn\'t say six any more. He doesn\'t say much.'] }];
  Object.assign(C.TALK16, {
    pete: PETE_AFTER, warrenspete: PETE_AFTER,
    barber: [{ say: ['Shave, tooth, stitch. The house\'s fighters are Davos Kren\'s. I taught him the needle.', 'Fight nights I sit at the Hex\'s door for what the house won\'t pay for. Three coppers, and I don\'t write it down.'] }]
  });
  H16.TEXT = { 'hire.lymenWait': 'He\'s watching who stands up in this town. Make a name first. (Renown 1: work for it -- Finding Work, in the JOURNAL.)',
    'hessle.greet': 'Fifty gold for true word; ten a fortnight for watch kept; sworn before notary. It\'s on the board outside my door: take a paper down.', // (10-29: the board on the wall outside -- H16.BOARD)
    // the Warrens' (js/mines.js Skarn, Edric, the pens): "paid at the pen", the first game's "at the board" read as Hessle's
    'w.shiftPaid': 'Shift done. {n} sealed thimble(s), paid at the pen: {n} silver.', 'w.cradle.paid': '{n} sealed, paid at the pen - {n} silver',
    'w16.skarnSay': 'He looks at you and waits. What do you say?',
    'w16.skarnAskFive': 'PETE\'S FIVE. WHERE DID THEY GO DOWN?', 'w16.skarnAskWork': 'ANY WORK BESIDES THE CRADLES?', 'w16.skarnRude': 'OPEN UP, COLLAR.',
    'w16.skarnFive': ['"Past the wet, after leavings. Six went down, and one came up: Pete."', 'He tells you what he wants to know: why the deep rate is three. It was two. Then the deep-margin scare.', 'He unlocks the gate between the pens and the honeycomb for you. "Bring them up. Edric can close his book."'],
    'w16.skarnWork': ['"Past the pens there\'s one job, and nobody takes it."', 'Five names in Edric\'s book have no return line: Warrens Pete\'s crew, gone down past the wet after leavings. Pete came up alone.', 'He tells you what he wants to know: why the deep rate is three. It was two. Then the deep-margin scare.', 'He unlocks the gate between the pens and the honeycomb for you. "Bring them up."'],
    'w16.edricFive': ['He turns back a page. "Five names in this book have no return line. Warrens Pete\'s crew, gone down past the wet after leavings, and Pete came up alone."'],
    'w16.edricSkarn': ['"Skarn holds the gate to where they went. Ask him, not me."'],
    'w16.edricAfter': ['"Five return lines. The book balances, for once."'], 'w16.edricOffice': ['"Skarn pays for it out of the office box. Tell him yourself."'] };
  if (DS.DATA && DS.DATA.text) Object.keys(H16.TEXT).forEach(function (k) { var r = DS.DATA.text[k]; DS.DATA.text[k] = r && typeof r === 'object' ? Object.assign({}, r, { t: H16.TEXT[k] }) : { t: H16.TEXT[k] }; });

  // ---------------------------------------------------------------- TELL ME ABOUT IT (RULED 10-28, his "TELL ME ABOUT IT", on the window's lean, after his "check with the story lane
  // regarding younger players and expository text, i.e. wagon provisioner talks about what wagons are used for around here"): on every keeper's counter and door, a button of its
  // own -- on a question beside its answers, on words beside their OK -- that says, in one or two plain sentences, what their trade is for here and why the party would want it;
  // asked again it says the same, and the screen goes back to where it was (no answer of the keeper's script moves: the button is the screen's, js/counter.js Counter). Mouse
  // first, as every button. Each line the window's draft against the register (the first game's records, the realm's pages), invented.json about-<id>
  H16.ABOUT_BTN = 'TELL ME ABOUT IT';
  H16.ABOUT = {
    marko: ['Wagons carry everything in and out of Silverton. There\'s no harbour this side of the mountains, so it all goes south: four days by wagon to Tarlyn\'s Pit, the only road out.', 'The harvest houses send guards with theirs now, with gnolls about on the road. My father took a wagon up the Coldridge road to the Doors once. It never came back.'],
    kasten: ['Candles and lamp-oil. Down a mine, or out on the road after dark, light is the difference between walking and falling. The crews buy before every shift.'],
    calla: ['Antitoxin is for poison -- the crawlers\' venom at the Warrens\' cradles, mostly. A healer\'s kit gets a fallen friend breathing again without any magic.'],
    kessler: ['Bring me what you don\'t need and I\'ll buy it: a third of what it\'s worth, no questions that matter. Whatever you carry back off the road, I\'ll look at.'],
    lisbet: ['Warding chalk: the night crews buy it by the stick to mark the old shafts. Charms are for luck. I make no promises about either.'],
    vilar: ['Weapons and armour. Better armour makes you harder to hit, and a better blade hits harder. The Hex\'s fighters buy here: show-steel that bites as well as it shines.'],
    percy: ['Road harvest: what you cut off the things you kill -- a gland, a tongue, a wing. I render it into jars the wizards and the alchemists pay for, and I pay you a fifth.'],
    ned: ['Wizards need odd things for their spells, and somebody has to jar and label them. I copy spell pages too, for a price.'],
    lucia: ['A potion mends you in a swallow; antitoxin takes the poison out. The calling herbs are for a wizard calling a familiar, and nobody else in Silverton mixes them.'],
    concession: ['Cold pies for the crowd. Nothing cooks in here: the hot food\'s Marta\'s, out on the street.'],
    winters: ['When somebody dies with nobody to take their things, I buy the estate and settle it. Magic things come through here, and I buy those too -- nothing else.'],
    cassia: ['A bed for the night. Sleep and you wake rested: wounds closed, spells back. A company takes the long room for one price.'],
    davos: ['The Hex\'s own surgeon. When someone falls and won\'t get up, bring them here: five silver, and I stand them up again.'],
    aldwin: ['A mission chapel: bread for anyone who comes in the morning, and the floor to sleep on for nothing. It\'s the poorest bed in town, and the only free one.'],
    hessle: ['The Weigh-House weighs what\'s sold in Silverton, honestly. The board on its wall is the town\'s bounties: bring proof the job\'s done and I pay it out of the drawer.'],
    marta: ['Hot food off the fire. A tired body mends faster fed: a hot meal takes the worst of the weariness off.', 'Bring me bat wings and I\'ll bake them into pies to eat in a fight.'],
    sylvia: ['I read what comes next for people. Five silver, and the cup tells you where your road goes from here.'],
    merrick: ['The lantern house sends word to the other lanterns, far off, faster than any rider. And thirty silver at this window frees a slave: that\'s the law here.'],
    casper: ['Coin comes into Silverton from everywhere -- Newland\'s mint, the dwarves\' old silver, wizard coin, the Hex\'s chits. I change one for another, and take a little for the trouble.'],
    androit: ['A notary writes things down so they\'re true: contracts, wills, freedom papers. My seal on a paper means the town has to believe it.'],
    aldric: ['A factor buys for a house far away. I buy Silverton\'s wool and grain for Newland and send it down the road.'],
    mical: ['Whatever comes in on a wagon waits in my warehouses till it\'s sold or sent on. I keep the manifests: the lists of what each load ought to hold.'],
    brennan: ['Horseshoes, wheels, barrels, harness: whatever keeps the wagons and the mines moving. Dwarven tools under rune-warranty cost three times as much.'],
    venhale: ['Fighters for the Hex train and sleep here, and some of them are owned. When you fight on the card, the one across the sand is often mine.'],
    kael: ['Timber props hold the shafts up so the mines don\'t come down on the crews. Ladders and poles for getting down them.'],
    vera: ['Rag-and-bone: what people throw out, or can\'t explain having, goes round the Rows through me. I trade with the Rows, not with strangers.'], // (10-29 night: no claim to sell to the party -- his "vera doesn't actually sell and claims to")
    brennock: ['When an animal dies, it comes to me. Tallow for the candles, glue for the joiners: nothing goes to waste.'],
    gull: ['Anyone who wants a day\'s work stands at my corner at dawn, and anyone who needs hands comes to pick them. The guano mine\'s taking cull hands now.'],
    kess: ['The cheapest beds in town, a penny a place, for the shift crews between work. You\'d rest better at Cassia\'s, or on Aldwin\'s floor for nothing.'],
    tam: ['People come here to forget things for a while. You\'ve no business forgetting anything yet.'],
    marin: ['Cloth and clothes, dyed in the back. The fine cuts go to the factors\' houses.'],
    barber: ['A barber-surgeon: shaves, teeth pulled, cuts stitched. The Hex\'s own fighters go to Davos Kren, on the house; on fight nights I sit at the Hex\'s door for whoever the house won\'t pay for.'], // (10-29: the territory RULED -- the barber's TALK16 above)
    mela: ['A hot bath, and a quiet room to have it in. People talk in the steam, and I hear all of it.'],
    korvin: ['The slate is the card: who fights whom, and the odds. Put five silver down to fight; win, and you walk away with ten.'],
    edric: ['The tally-house books the hands for the cradles. Your name in my book, and you can milk the crawlers for their venom: a silver a clean thimble.'],
    sabeth: ['I hire cull hands for the guano mine. Kill the giant bats in the dens and I pay by the head -- quietly, mind, under the roost.'],
    // (10-29, the notes seat, his "tell me more was absent from Skarn": invented.json about-skarn)
    skarn: ['I keep the Warrens\' gate: the stalls, the lit galleries, and the drift up to the daytime way down to the wet. Nobody goes past it that I haven\'t spoken with.']
  };
  (function () {
    var P = C.Counter.prototype, buttons0 = P.buttons, press0 = P.press, step0 = P.step, Lw = C.LAYOUT.words;
    // on the keeper's first screen alone, and that screen again when the talk comes back to it -- a shop's own words after THE SHELVES (10-29, Griz: "tell me more ... appears
    // when it shouldn't - still appears rather. It's associated with their first page, carrying into the ned conversation (for example) makes it seem like the 'tell me more'
    // function will include 'more' about current dialogue"): never on a later page of what they are saying, a quest's word or an answer's
    var waitKey = function (w) { return w ? JSON.stringify([w.say || null, w.ask || null, (w.opts || []).map(function (o) { return typeof o === 'object' ? o.label : o; })]) : ''; };
    P.step = function () { var r = step0.apply(this, arguments); var fk = this.firstKeys = this.firstKeys || {}; if (this.wait && fk[this.id] == null) fk[this.id] = waitKey(this.wait); return r; };
    P.aboutable = function () { var w = this.wait || {}; return !!H16.ABOUT[this.id] && !this.aboutBack && !this.sub && !w.shelves && !(this.bubbling && this.bubbling()) && !!(w.ask || (w.say && this.page >= (this.pages || []).length - 1)) && !!this.firstKeys && this.firstKeys[this.id] === waitKey(w); };
    P.buttons = function () {
      var bs = buttons0.apply(this, arguments); if (!this.aboutable()) return bs;
      var b = { x: Lw[0] + 8, y: Lw[1] + Lw[3] - 20, w: 124, h: 15, label: H16.ABOUT_BTN, go: 'about' };
      if ((this.wait || {}).ask) bs.splice(Math.max(0, bs.length - 1), 0, b); else bs.push(b); // (on a question before its last answer: back is still LEAVE)
      return bs;
    };
    P.press = function (q) {
      if (q && q.go === 'about') { D.sfx('confirm'); this.aboutBack = { wait: this.wait, pages: this.pages, page: this.page, hov: this.hov }; this.wait = { say: H16.ABOUT[this.id].slice(), face: 'welcoming', about: true }; this.pages = this.paginate(this.wait.say); this.page = 0; this.hov = -1; if (this.setFace) this.setFace('welcoming'); return; }
      if (q && q.go === 'next' && this.aboutBack && this.page >= this.pages.length - 1) { var a = this.aboutBack; this.aboutBack = null; this.wait = a.wait; this.pages = a.pages; this.page = a.page; this.hov = a.hov; D.sfx('cursor'); return; }
      return press0.apply(this, arguments);
    };
  })();

  // ---------------------------------------------------------------- THE SHOW (deep16/?hoursshow -- the eyes rows' door, the house's rule: a show first for what is to be seen): a NEW
  // GAME staged for each beat on the counter's show (js/counter.js ServicesShow, C.serviceStage), with this lane's own on top -- the lead alone, flags, renown, THE WORLD's hour
  // (the street turns to it on its first step), and a council's sitting played over it
  H16.SHOW_BEATS = [
    { hours: 1, id: 'papa', near: 'papa', lead: 'barley', label: 'PAPA AND LYMEN AT THE HEX\'S DOOR: Barley alone', note: 'Lymen in the door with Papa; the talk on a portrait screen over the street -- Papa\'s portrait speaking, Lymen bottom left with his lines in the bubble (click each); then the cards: the Company in the JOURNAL, pinned, and Finding Work with its four places.' },
    { hours: 1, id: 'papaly', near: 'papa', lead: 'lymen', label: 'PAPA AND LYMEN: Lymen leading', note: 'Lymen himself in front of Papa: "Then go and find some." -- Barley, Marta\'s girl, the farm boy named; the Company opens.' },
    { hours: 1, id: 'journal', near: 'pete', lead: 'barley', label: 'THE JOURNAL BY WORDS: Warrens Pete, then the town\'s talk', note: 'A click on Pete: THE MISSING FIVE, its card, pinned -- Edric first. Then the Hand (the Cradles), Gull (the Cull), the factor\'s man (Finding Work). M > JOURNAL; THE TALK.' },
    { hours: 1, id: 'lucia', door: 'shop:lucia', lead: 'aurdin', label: 'LUCIA AT MAMA\'S: Aurdin\'s first visit, CONSULT', note: 'In at the door, E at the counter: her word to Aurdin (the calling herbs), THE SHELVES / CONSULT / LEAVE; CONSULT on a whole party.' },
    { hours: 1, id: 'swann', door: 'keeper:sylvia', lead: 'vivian', silver: 20, t: 31, label: 'SWANN, 5 SP: the first morning after the moot', note: 'In at her booth: READ (5 SP). Nothing in the JOURNAL: she opens Finding Work and pins it, her line, the plain next step -- and once, "An old thing walks."' },
    { hours: 1, id: 'bread', door: 'chapel:aldwin', label: 'THE BREAD LINE: seven in the morning, Aldwin\'s', note: 'Four in line at the chapel door. Step off the doorway and watch: every seven seconds the front one goes in, comes back out with a loaf, and walks down the street to another door; the line steps up, someone new joins behind. In, E at Aldwin: a loaf a hero (Mission Bread). M > WAIT: the bells, bell to bell.' },
    { hours: 1, id: 'dusk', door: 'inn:cassia', t: 17.5, label: 'SILVERTON AT DUSK: the town comes out', note: 'One step: the bells go for dusk. Marin, the barber, Mela, Venn Hale, Aldric, Merrick and Tam out at their evening spots; their doors "Closed."' },
    { hours: 1, id: 'night', door: 'inn:cassia', t: 21, label: 'SILVERTON BY NIGHT: the lit places', note: 'One step: night. The dark wash, the pools at the Hex\'s doors, vice row, the lantern house, Cassia\'s, the chapel, Davos\'s, the west gate, round the party.' },
    { hours: 1, id: 'council1', door: 'inn:cassia', t: 55, sit: ['notice'], label: 'THE COUNCIL, C1: the Pit\'s word (at the rest)', note: 'The cutscene (the lamp at dusk; the council up the spiral), then the sitting: Hessle with the Pit\'s word -- the moot, the king dead -- Androit spelling it out for the record (the Snoot) till Papa cuts him off, Merrick\'s warning, the notice. No Lupine\'s head. X at the first shot keeps the card.' },
    { hours: 1, id: 'council2', door: 'inn:cassia', sit: ['looks'], renown: 2, label: 'THE COUNCIL, C2: a name made (renown 2)', note: 'The council\'s ask (10-29): Papa vouches, Harrow names the ettercap across Web Gulch, Hessle its forty and ten, Androit swears it to you, Merrick names the gnolls next; then The Braiding Ettercap in the JOURNAL, pinned.' },
    { hours: 1, id: 'about', door: 'shop:marko', label: 'TELL ME ABOUT IT: Marko the provisioner, and Fountain Street', note: 'In at Marko\'s door, E at the counter: TELL ME ABOUT IT beside THE SHELVES / LEAVE -- what wagons are for here; then back to his question. Next door Kasten, Calla, Kessler, Lisbet; the same at every keeper\'s counter and door.' },
    { hours: 1, id: 'table', near: 'papa', hex3: true, renown: 2, flags: { papaLymen: 1, councilCalled: 1 }, label: 'THE COUNCIL AT THE LONG TABLE: C2, the party called up', note: 'In at the Hex and up to the third floor: the council in their seats at the long table under the Big Window, the camera along it and the card; then the who\'s-who on their portraits, and they break up.' },
    { hours: 1, id: 'tablenight', near: 'papa', hex3: true, t: 42, flags: { papaLymen: 1 }, label: 'THE COUNCIL AT THE LONG TABLE: the night the Pit\'s word comes', note: 'Day 1 at dusk, up to the third floor: the scales are lit, the council at the table, Merrick among them; Warda: stand at the back. Their sitting plays at the party\'s next rest.' },
    { hours: 1, id: 'council3', door: 'inn:cassia', sit: ['herd'], flags: {herdWarned: 1 }, label: 'THE COUNCIL, C3: the herd thinned', note: 'The east side\'s man, Casper, Hessle, Papa ("A warning\'s gone down. Once. Next.").' },
    // (10-29, the story window, RULED on Griz's "Leans stand": his story notes of 10-29 1808Z, each a beat -- invented.json warrens-five-words-1029, hexboy-runner-1029)
    { hours: 1, id: 'council4', door: 'inn:cassia', sit: ['stock'], flags: { herdWarned: 1, councilHerd: 1, stockDead: 1 }, label: 'THE COUNCIL, C3: the stock dead', note: 'The cutscene: the east side\'s man comes up the spiral and stands at the table\'s end, the others at their places; the sitting with no card.' },
    { hours: 1, id: 'runner', door: 'inn:cassia', renown: 2, flags: { papaLymen: 1 }, label: 'PAPA\'S RUNNER: renown 2, on the street', note: 'At Cassia\'s door at renown 2: a Hex boy runs up from a few squares off, his word on his own screen (the plain shape till his face comes), and runs back. Then the Hex\'s third floor: C2.' },
    { hours: 1, id: 'five', camp: [8, 8], label: 'THE MISSING FIVE BY WORDS: Edric at the mouth camp', note: 'Beside Edric, nothing heard of the five: E on him -- the book, then the five in his own words, Skarn named; the card. East along the camp, Skarn: ANY WORK BESIDES THE CRADLES? or OPEN UP, COLLAR. A pen: the cradle in the portrait\'s place.' },
    { hours: 1, id: 'fiveafter', camp: [8, 8], flags: { heardPete: 1, tallyMet: 1, fiveKnown: 1, skarnOk: 1, fiveDone: 1, 'q:warrens': 1 }, label: 'AFTER THE FIVE: Edric, Skarn, Pete', note: 'E on Edric: the book balances, and Skarn\'s office box; Skarn pays from it. In town and in the Hex, Pete stops saying six.' },
    { hours: 1, id: 'board', door: 'keeper:hessle', label: 'HESSLE\'S BOARD on the Weigh-House wall', note: 'At the Weigh-House door: the board on the wall beside it, a paper nailed up for each bounty. E at it or a click: the board\'s screen, TAKE a paper down -- its mission in the JOURNAL, pinned. Hessle inside points you out to it, and pays at the scales.' },
    { hours: 1, id: 'barber', door: 'keeper:barber', label: 'VENN THE BARBER AND DAVOS KREN', note: 'At the barber-surgeon\'s door: the house\'s fighters are Davos Kren\'s, what the house won\'t pay for is his, at the Hex\'s door on fight nights; TELL ME ABOUT IT the same.' }
  ];
  var play0 = C.servicePlay;
  C.servicePlay = function (bt) {
    if (!bt || !bt.hours) return play0.apply(this, arguments);
    // (a beat at the Warrens' camp has no door of Silverton's to stand at: staged at Cassia's, then moved to the camp below -- 10-29 night, his "the first item in the situations
    // page opened to a menu of situations": C.serviceStage read the door of a beat with none, threw, and the show stayed on its menu -- the Five's two beats, every time)
    var Hs = D.house, rec = C.serviceStage(bt.camp && !bt.door && !bt.near && !bt.world ? Object.assign({}, bt, { door: 'inn:cassia' }) : bt);
    if (bt.lead) { var one = Hs.fresh(bt.lead); rec.party = one.party; rec.lead = one.lead; rec.hired = one.hired; }
    Object.assign(rec.flags, bt.flags || {}); if (bt.renown) rec.renown = bt.renown;
    if (bt.camp) rec.at = { town: 'warrens', gate: 'feed', sq: bt.camp.slice(), dir: D.roam.DIR8['-1,0'] }; // (at the Warrens' mouth camp, facing west: Edric at 7,8)
    Hs.begin(rec, 0);
    var S = D.world && D.world.state ? D.world.state() : null; if (bt.t != null && S) S.t = bt.t;
    if (bt.sit) H16.night(null, bt.sit, [rec.flags]); // (a night's sitting with its cutscene first, as at a rest)
    if (bt.hex3) H16.toHex3 = true;
  };
  H16.show = function (q) { return new C.ServicesShow(q, H16.SHOW_BEATS, '{y}SILVERTON\'S HOURS AND WORDS, 10-28{/} -- a NEW GAME staged; the rest is yours (a show)'); };

  // ---------------------------------------------------------------- the floor's beats, one hook (js/roam.js R.script): each `due` asked in turn, the first that is plays
  // (a show's beat that starts on the Hex's third floor: in at the front doors and up the spirals, as the party walks it -- js/hex.js HX.goIn, HX.lay)
  H16.toHex3Due = function (B) { var def = D.roam && D.roam.def; return !!(H16.toHex3 && def && def.town && !def.room && !def.hexIn && B && B.roam && B.roam.mode === 'walk'); };
  H16.toHex3Play = function* (B) {
    H16.toHex3 = false; var HX = D.hex; yield* HX.goIn(B, 'front');
    var sp = HX.spiralSq()[0], rows = HX.rows(3), at = HX.near(rows, [sp[0], sp[1] + 1]) || HX.near(rows, sp); HX.lay(B, 3, at, [0, 1]); B.card(D.roam.wrap(D.roam.def.hello), 300); yield 10;
  };
  H16.BEATS = [{ due: H16.turnDue, play: H16.turnPlay }, { due: H16.waitDue, play: H16.waitPlay }, { due: H16.toHex3Due, play: H16.toHex3Play }, { due: H16.papaDue, play: H16.papaScene }, { due: H16.nightDue, play: H16.nightPlay }, { due: H16.lookDue, play: H16.lookPlay }, { due: H16.missionDue, play: H16.missionCard }];
  // the first look before any beat (10-30, his "we didn't get the fancy 'missions in your journal now' animation on my pane clickthrough of the dialogue"): a save from before
  // has its JOURNAL taken as seen (H16.missionDue's rule) at the floor's first ask, not when the mission card's turn comes -- else a scene on the first beat (Papa's, the
  // party starting beside him: the show's door, a Lymen-led NEW GAME) gave the Company, and the late first look swallowed its card and fly-in as the save's own
  H16.firstLook = function (B) { var R = D.roam, st = B && B.roam && R.house && R.house() ? C.state(B) : null; if (!st || st.flags.qSeen) return; st.flags.qSeen = 1; H16.fresh(st).forEach(function (q) { st.flags['q:' + q.id] = 1; }); };
  H16.due = function (B) { H16.light(B); H16.breadTick(B); H16.firstLook(B); for (var i = 0; i < H16.BEATS.length; i++) if (H16.BEATS[i].due(B)) { H16.next = H16.BEATS[i]; return true; } return false; };
  H16.beat = function* (B) { var b = H16.next; H16.next = null; if (b) yield* b.play(B); };
})();
