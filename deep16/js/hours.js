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

  // ---------------------------------------------------------------- THE COUNCIL ON THE HEX'S THIRD FLOOR (the lane's 4.8; RULED 10-28: his "Consider C1 a cutscene that plays for
  // the player at the parties nearest (chronological) rest cycle", "C3 is that any crawler kill trigger or the thinning the herd too much amount", "18 - yes, lantern warning same
  // trigger as council meeting", "17 - yeah, that's good"). The register: Androit, Hessle, Casper Venn, Papa Urtusk, Ottak Harrow, and Merrick when word from outside matters; the
  // lounge under the Big Window; "the scales are lit", the Weigh-House lamp the signal (TarlynsPit/wiki/silverton.md, the-hex.md). One screen for every sitting: the counter's,
  // its portrait the one speaking, a line a page (a council member with no portrait yet -- Papa, Harrow, Thrane's man -- the plain shape). C1 and C3 play at the party's next long
  // rest after the council sits, over the morning, the party not in the room; C2 is the party called up, at renown 2, played when they reach the third floor. Every line the
  // window's draft (the no-stubs law, RULED 09-24), invented.json council-notice-night, council-herd, council-looks
  H16.WHO = { hessle: 'Hessle', androit: 'Aldwyn Androit', casper: 'Casper Venn', merrick: 'Merrick', papa: 'Papa Urtusk', harrow: 'Ottak Harrow', thrane: 'The east side\'s man', warda: 'Warda' };
  H16.COUNCIL = {
    // C1: the night the Pit's word is in (Day 1; the realm's campaign-start.md, CANON 08-25: the notice funded, Papa struck the Lupine-head line, Merrick warned unexplained)
    notice: { flag: 'councilNotice', card: 'That night, in Silverton, the Weigh-House lamp burns past the fourth bell. On the Hex\'s third floor, the scales are lit.', lines: [
      ['hessle', 'The Pit\'s word. The gnoll king\'s dead at the moot, by Dominion hands, and their wagons gone south.'], ['merrick', 'There\'s more coming up that road. Don\'t ask me how I know.'],
      ['androit', 'Then we post it. Fifty gold for true word of the gnolls, sworn before me. Ten a fortnight to anyone who keeps a watch on the road.'], ['harrow', 'My farms are the first thing a gnoll sees. Post it twice.'],
      ['hessle', 'And a hundred for a Lupine\'s head --'], ['papa', 'Strike it. We pay for word.'], ['hessle', 'Struck.']], end: 'In the morning it is on Hessle\'s board.' },
    // C3: the herd thinned (the lantern man's trigger, R.WARN_AT: `herdWarned`), and again if the whole stock dies (`stockDead`)
    herd: { flag: 'councilHerd', card: 'That night the scales are lit again. The east side\'s house has sent a man up the Hex\'s spiral.', lines: [
      ['thrane', 'Three of the House\'s stock dead on the stone. Somebody is culling a herd that isn\'t theirs.'], ['casper', 'Somebody went down the wet where nobody else would. Ask what they went for.'],
      ['hessle', 'The board pays for what\'s brought up. It doesn\'t fine anyone for what they killed getting there.'], ['papa', 'A warning\'s gone down. Once. Next.']] },
    stock: { flag: 'councilStock', card: 'The scales are lit. The east side\'s man doesn\'t sit down.', lines: [
      ['thrane', 'The stock\'s dead. All of it. The House is hiring the Captain\'s line to hold the mouth camp and the bridge.'], ['androit', 'Then it\'s sworn: the House\'s business, the House\'s guards.'],
      ['papa', 'Then they\'ll hold a bridge over an empty pen. Next.']] },
    // C2: a name made (renown 2), the party called up and looked over -- a who's-who, a line each
    looks: { flag: 'councilSeen', card: 'The council sits at the long table under the Big Window. Warda shows the party in, and nobody tells them to sit.', lines: [
      ['androit', 'Aldwyn Androit. My seal makes paper true. If it isn\'t sealed, it isn\'t so.'], ['hessle', 'Hessle. The Weigh-House: I weigh what you bring in, and I pay what the board says.'],
      ['casper', 'Casper Venn. I change any coin you\'ve got into any coin you need.'], ['harrow', 'Harrow. I farm south of the river. When the road goes bad, I hear it first.'],
      ['merrick', 'Merrick. The lantern house. Messages go out through my window.'], ['papa', 'They\'ve seen you. That\'s all this was. Go on.']] },
    call: 'A Hex boy runs up: "Papa wants you on the third floor. The spiral, all the way up."', place: 'The Hex, the third floor', what: 'the council'
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
  H16.sitting = function (B, ids, flagsets) {
    var sc = new C.Counter(B || null, { id: 'council', name: 'The council', place: H16.COUNCIL.place, what: H16.COUNCIL.what, script: function (s) { return (function* () {
      for (var i = 0; i < ids.length; i++) {
        var cs = H16.COUNCIL[ids[i]]; flagsets.forEach(function (f) { if (f) f[cs.flag] = 1; });
        s.sheet = null; s.o.name = 'The council'; yield s.say([cs.card], 'attentive');
        for (var k = 0; k < cs.lines.length; k++) { var who = cs.lines[k][0]; s.sheet = C.PT[who] || null; s.o.name = H16.WHO[who] || who; yield s.say(['"' + cs.lines[k][1] + '"'], 'attentive'); }
        if (cs.end) { s.sheet = null; s.o.name = 'The council'; yield s.say(['{g}' + cs.end + '{/}']); }
      }
    })(); } });
    D.push(sc); return sc;
  };
  // C1 and C3 at the morning: the sitting over the morning screen, played first (a bench, no one watching, takes the flags without the screen -- as the morning's picks, js/house.js Morning)
  var morning0 = D.house.morning;
  D.house.morning = function (o) {
    var m = morning0.apply(this, arguments), Hs = D.house, ff = [Hs.cur && Hs.cur.flags, o && o.floor && o.floor.roam && o.floor.roam.flags], ids = ff[0] ? H16.councilsDue(Object.assign({}, ff[1] || {}, ff[0])) : [];
    if (ids.length) { if (DS.autoPicks || !D.ctx) ids.forEach(function (id) { ff.forEach(function (f) { if (f) f[H16.COUNCIL[id].flag] = 1; }); }); else H16.sitting(o && o.floor, ids, ff); }
    return m;
  };
  // C2: renown 2 -- in the Hex, a Hex boy's call once; on the third floor, the sitting
  H16.lookDue = function (B) {
    var R = D.roam, R0 = B && B.roam, def = R.def; if (!R0 || !def || !def.hexIn || !R.house() || R0.mode !== 'walk' || R0.path) return false;
    var f = R0.flags; if (f.councilSeen || C.renownOf() < 2) return false;
    return def.hexIn === 3 || (def.hexIn === 1 && !f.councilCalled);
  };
  H16.lookPlay = function* (B) {
    var R0 = B.roam, f = R0.flags;
    if (D.roam.def.hexIn !== 3) { f.councilCalled = 1; D.sfx('popup'); B.card(D.roam.wrap([H16.COUNCIL.call]), 360); yield 20; return; }
    var sc = H16.sitting(B, ['looks'], [f, D.house && D.house.cur && D.house.cur.flags]); while (!sc.done) yield 1;
  };

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
  // a Hex bout a quarter of an hour on the clock (his 10-28 "fights should burn 15 minutes instead of an hour of worldtime": js/world.js W.FIGHT_HOURS)
  if (D.hex && D.hex.bout) { var bout0 = D.hex.bout; D.hex.bout = function* (B) { var r = yield* bout0.apply(this, arguments); H16.pass(B, (D.world && D.world.FIGHT_HOURS) || 0.25); return r; }; }
  // the town's lights laid with its people (the floor's first laying, and a relay's)
  var people0 = T.people;
  T.people = function (B) { people0.apply(this, arguments); (B.units || []).forEach(function (u) { if (/^breadline\d/.test(u.npc || '')) u.name = 'In the bread line'; }); H16.light(B); };
  [['Bread at six. Don\'t push.'], ['He gives it to everyone. Even the proud, at quarter past.'], ['Shift\'s at seven. Bread first.'], ['Mind the line. It moves.']].forEach(function (s, k) { C.TALK16['breadline' + k] = [{ say: s }]; });

  // ---------------------------------------------------------------- the floor's beats, one hook (js/roam.js R.script): each `due` asked in turn, the first that is plays
  H16.BEATS = [{ due: H16.turnDue, play: H16.turnPlay }, { due: H16.waitDue, play: H16.waitPlay }, { due: H16.papaDue, play: H16.papaScene }, { due: H16.lookDue, play: H16.lookPlay }, { due: H16.missionDue, play: H16.missionCard }];
  H16.due = function (B) { H16.light(B); for (var i = 0; i < H16.BEATS.length; i++) if (H16.BEATS[i].due(B)) { H16.next = H16.BEATS[i]; return true; } return false; };
  H16.beat = function* (B) { var b = H16.next; H16.next = null; if (b) yield* b.play(B); };
})();
