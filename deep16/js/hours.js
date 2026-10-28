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
    { id: 'warrens', name: 'The Missing Five', show: 'flag:heardWarrens|flag:heardPete|flag:tallyMet', done: 'flag:fiveDone',
      text: 'Warrens Pete says six went down past the wet in the Crawler Warrens, and six came up. He says six too fast. The tally-house book has five names with no return line.',
      doneText: 'The five came back up. Edric wrote their return lines.',
      steps: [{ 'if': 'has:fivetokens', npc: 'edric', where: 'Bring the five\'s tokens to Edric Pellam at the tally-house, the Warrens\' mouth camp.' },
        { 'if': '!flag:tallyMet', npc: 'edric', where: 'Edric Pellam at the tally-house, the Warrens\' mouth camp: ' + EAST },
        { 'if': '!flag:skarnOk', npc: 'skarn', where: 'Skarn, at the mouth camp: speak to him as a man, and his gate opens.' },
        { 'if': '!flag:fiveRecovered', where: 'The flooded stair past the wet: through Skarn\'s gate, up the drift, the daytime way down. Bring rope.' },
        { npc: 'edric', where: 'Back to Edric Pellam at the tally-house.' }] },
    { id: 'cradles', name: 'The Cradles', show: 'flag:heardCradles|flag:tallyMet', done: 'flag:shifts',
      text: 'The Warrens\' cradles take hands by the shift: you milk a crawler for its venom, a silver for each clean thimble. Edric Pellam writes you into his book first.',
      steps: [{ 'if': '!flag:tallyMet', npc: 'edric', where: 'Edric Pellam at the tally-house, the Warrens\' mouth camp: ' + EAST },
        { where: 'Pen Two, Four or Five: the gated mouths along the mountain wall at the mouth camp. WORK A SHIFT.' }] },
    { id: 'cull', name: 'The Cull', show: 'flag:heardGalleries|flag:cullHired', done: 'flag:rescued',
      text: 'The guano mine, in the mountain west of town, hires cull hands: three silver a giant bat\'s head, a gold piece a darkmantle. Its one law: no fire and no noise under a roost.',
      steps: [{ 'if': '!flag:cullHired', npc: 'sabeth', where: 'Sabeth Pollard at the weigh-shed, the guano mine\'s mouth: out of Silverton by the west gate, then west on THE WORLD.' },
        { where: 'The dens, down past the working gallery. Listen for Old Wynn\'s rattle.' }] },
    { id: 'tail', show: 'flag:heardCloaker', done: 'flag:cloakerDone',
      text: 'Forty gold on Hessle\'s board for the cloaker in the guano mine\'s deep gallery. Nobody has ever collected. Bright light is its weakness.',
      steps: [{ 'if': 'has:cloakertail', door: 'hessle', where: 'Take the tail to Hessle at the Weigh-House, on Fountain Street.' },
        { where: 'The deep gallery, below the guano mine\'s dens: past the mark, down the last ladder. Bring light.' }] },
    { id: 'hex', show: 'flag:heardHex', done: 'flag:talmokBeaten',
      text: 'The Hex, in the plaza at the heart of town: five silver to fight on the card, and the winner keeps ten. Korvin keeps the slate. Talmok is the champion.',
      steps: [{ map: 'hex', npc: 'korvinSlate', where: 'Korvin at the slate, on the Hex\'s ground floor.' }] }
  ];
  // FINDING WORK (RULED 10-28, his "sounds like an AND when we should make it an OR. Finding work as a quest fills up with options as you talk to various NPC, getting a quest
  // from where it points (winters, the board) completes the finding work quest"): an option a place, each added by the first word that names it (`work:<k>`, js/counter.js
  // C.flagOn, in the order heard); done the moment the party takes up any one -- WORK from Winters, the board read, Edric's book, a bout on the slate
  H16.WORK = [
    { k: 'winters', short: 'Winters\' papers (Fountain Street)', step: { npc: 'winters', where: 'Ambrose Winters, Acquisitions & Estates, on Fountain Street: ask him for WORK.' } },
    { k: 'board', short: 'Hessle\'s board (the Weigh-House)', step: { door: 'hessle', where: 'Hessle\'s board, at the Weigh-House on Fountain Street: every paper on it is a bounty.' } },
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
  C.QUESTS = ['company', 'work', 'warrens', 'cradles', 'cull', 'tail', 'hex', 'errands', 'nedpage'];

  // the rumours that point at work open their mission (the lane's 4.2; the rest stay lines in THE TALK); the Snoot's news is not in town till the morning after the moot
  // (the realm's campaign-start.md: the Pit's word, Day 1, Lucia first) -- before it, the gnolls ranging north is the whole of it
  Object.assign(C.RUMOR_OPENS, { 'r-pete': 'heardPete', 'r-doserate': 'heardCradles', 'r-mouths': 'heardCradles', 'r-guanowages': 'heardGalleries', 'r-roost': 'heardGalleries',
    'r-cloaker': 'heardCloaker', 'r-cloakerNumber': 'heardCloaker', 'r-nobodyCollected': 'heardCloaker', 'r-hexcard': 'heardHex', 'r-talmok': 'heardHex', 'r-fronted': 'heardHex',
    'r-winters': 'work:winters' });
  H16.NEWS = { 'r-snoot': 1 };
  C.rumorHeld = function (rid) { return !!H16.NEWS[rid] && H16.day() < 1; };

  // ---------------------------------------------------------------- the card a mission opens with (the lane's 4.1, 2): the moment it shows in the JOURNAL, its name and its
  // plain words, and the first pinned when nothing is. A save from before has its JOURNAL as it stood: what it shows at the first look is taken as seen, no cards
  H16.fresh = function (st) { return C.quests(st).filter(function (q) { return !st.flags['q:' + q.id]; }); };
  H16.missionDue = function (B) {
    var R = D.roam, R0 = B && B.roam; if (!R0 || !R.house || !R.house() || R0.mode !== 'walk' || R0.path || (R.tracking && R.tracking(R0).length)) return false;
    var st = C.state(B); if (!st) return false;
    if (!st.flags.qSeen) { st.flags.qSeen = 1; H16.fresh(st).forEach(function (q) { st.flags['q:' + q.id] = 1; }); return false; }
    return H16.fresh(st).length > 0;
  };
  H16.LINES = { opened: '{y}In your JOURNAL:{/} {name}.', pinned: '{g}Pinned: the gold arrow marks the next step. M, then JOURNAL, to read it again.{/}', more: '{g}And: {names}.{/}' };
  H16.missionCard = function* (B) {
    var R = D.roam, st = C.state(B), f = st.flags, nu = H16.fresh(st), live = C.quests(st).filter(function (q) { return q.id === f.pin && !q.done; })[0], lines = [], pinned = false;
    nu.forEach(function (q) { f['q:' + q.id] = 1; });
    var open = nu.filter(function (q) { return !q.done; }); if (!open.length) return;
    if (!live) { f.pin = open[0].id; pinned = true; }
    lines.push(H16.LINES.opened.replace('{name}', open[0].name), open[0].text);
    if (open.length > 1) lines.push(H16.LINES.more.replace('{names}', open.slice(1).map(function (q) { return q.name; }).join(', ')));
    if (pinned) lines.push(D.keys ? D.keys(H16.LINES.pinned) : H16.LINES.pinned);
    D.sfx('confirm'); B.card(R.wrap(lines), 480); yield 30;
  };

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
  H16.line = function (u, who, text) { return { prompt: { who: u, title: who, lines: D.roam.wrap([text]), opts: [{ label: 'NEXT', value: 0 }] } }; };
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
    yield H16.line(papa, 'THE HEX\'S DOOR', lyLead ? P.doorLy : P.door);
    yield H16.line(ly || t, 'LYMEN', P.gnolls);
    yield H16.line(papa, 'PAPA URTUSK', P.alone);
    yield H16.line(ly || t, 'LYMEN', P.friends);
    if (!lyLead) { papa.facing = hd(papa); yield H16.line(papa, 'PAPA URTUSK', P.few); if (ly) ly.facing = hd(ly); yield H16.line(ly || papa, 'LYMEN', P.find); }
    var others = ['barley', 'vivian', 'aurdin'].filter(function (id) { return id !== rec.lead && (rec.hired || []).indexOf(id) < 0; }).map(function (id) { return P.who[id]; });
    papa.facing = hd(papa) || papa.facing;
    if (lyLead || others.length) yield H16.line(papa, 'PAPA URTUSK', (lyLead ? P.go + ' ' : '') + others.join(' '));
    yield H16.line(papa, 'PAPA URTUSK', P.work);
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
    aldwin: [{ 'if': '!flag:work:winters', say: ['Bread at six. At quarter past, for the proud.', 'If it\'s coin you want, Ambrose Winters on Fountain Street pays for honest legs. Tell him the chapel sent you.'], set: 'work:winters' }],
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
      hex: 'Sand, and a crowd, and a big man who opens reckless.', nedpage: 'A snake\'s tongue, fresh. A page for it.' },
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
      yield sc.say(lines, 'work'); q = S.again;
    }
  };

  // ---------------------------------------------------------------- the floor's beats, one hook (js/roam.js R.script): each `due` asked in turn, the first that is plays
  H16.BEATS = [{ due: H16.papaDue, play: H16.papaScene }, { due: H16.missionDue, play: H16.missionCard }];
  H16.due = function (B) { for (var i = 0; i < H16.BEATS.length; i++) if (H16.BEATS[i].due(B)) { H16.next = H16.BEATS[i]; return true; } return false; };
  H16.beat = function* (B) { var b = H16.next; H16.next = null; if (b) yield* b.play(B); };
})();
