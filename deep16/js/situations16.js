/* DEEP16 -- THE SECOND GAME's situations from a link (10-30, the house seat, started by the lanes desk; ..\handoff-2026-10-21-the-second-games-house.md, 10-30 later item 2).
   His question, on THE WORLD's pinned-quest row: "the 8bit made me games that when i started load a specific situation (level, quest completed or not, in the journal or not)
   etc - is that something we can't do in the 16bit for these situations.html links?"; RULED 10-30, his "yes to both" on the desk's lean: a second-game ?at= writes a save from
   the door's words and opens it, as the 8-bit's ?at= does (js/situations.js).
   deep16/?at=<id>: a whole save, the shape js/house.js H.fresh makes -- the party at the situation's level (each sheet made at it as the level-up makes one: js/rules.js
   R.makeHero, the build's picks, R.autoPicks for an archetype as the fixture does), their gear (`kit`: what they buy by that level, js/save.js SV.KIT; `gear`: a slot named),
   the pack and the purse, the JOURNAL's missions open or done (`open`, `done`: by each mission's own show and done words -- js/counter.js C.quests, js/hours.js H16.MISSIONS --
   the flags their first way names; `flags` the rest), the pinned one, the place (a town of THE WORLD's DOORS, its gate, beside someone or on a mark) and THE WORLD's day and
   hour -- then opened as CONTINUE opens a slot (H.begin).
   HIS SAVES ARE HIS: a situation's save is held in memory for the page's life (H.cur, slot 0) and written nowhere -- not deep16.game.1..3, not the first game's ds8-save-*, not
   deep16.world. SAVE inside one refuses and says so (H.saveTo reads rec.situation); its link starts it again. dev/bench16.py x mode=sit1030 builds each and checks it.
   One table, DS.SIT16: it needs no game loaded, so situations.html reads it too and lists each as a row (url deep16/?at=<id>).
   TO ADD ONE: a row below -- group, title, pt, look (what to try, what should happen); lead (the one who leads; default barley), hired (who walks with them; default the four),
   lvl (default each hero's own), kit, gear { hero: { slot: item } }, give [[item, n]], silver, renown; open / done (mission ids, js/hours.js C.QUESTS), flags, pin; at { town:
   'silverton' | 'warrens' | 'mouth' | 'glowseep', gate, near: a Silverton person's id, mark: a Silverton mark, sq, dir }; day (0 the morning the game opens), hour. Then
   `python tools/deep16-build.py`, and the bench's table (mode=sit1030) checks it -- add its expected journal there. */
'use strict';
(function () {
  var DS = window.DS = window.DS || {};
  var G = 'The second game (from a link)';
  DS.SIT16 = {
    company16: { group: G, title: 'Silverton, the Company half made: Lymen and Aurdin, Vivian on vice row (10-30)', pt: 'the house lane · the Company · situations from a link',
      lead: 'lymen', hired: ['lymen', 'aurdin'], silver: 5, flags: { papaLymen: 1, 'work:winters': 1, 'work:board': 1, 'work:cradles': 1, 'work:slate': 1 }, open: ['company', 'work'], pin: 'company',
      at: { town: 'silverton', near: 'vivian' }, day: 0, hour: 11,
      look: 'Day 1, late morning, level 2: Lymen leads with Aurdin hired (20 silver paid at the chapel, 5 left), beside Vivian selling candles on vice row. The JOURNAL: the Company open and pinned (Barley and Vivian to find), Finding Work with its four places. Talk to Vivian -- she joins. SAVE says a situation keeps no save.' },
    taken16: { group: G, title: 'Silverton, the Company taken: the four at the Hex\'s doors (10-30)', pt: 'the house lane · the Company done · situations from a link',
      lead: 'lymen', silver: 12, renown: 1, flags: { papaLymen: 1, 'work:winters': 1, 'work:board': 1, 'work:cradles': 1, 'work:slate': 1 }, open: ['work'], done: ['company'], pin: 'work',
      at: { town: 'silverton', mark: 'hexFront' }, day: 0, hour: 15,
      look: 'Day 1, afternoon, level 2, renown 1: the four hired, at the Hex\'s front doors. The JOURNAL: the Company done (Four of you), Finding Work open and pinned with Winters, the board, the cradles and the slate. Take up any one and Finding Work is done.' },
    five16: { group: G, title: 'The Warrens\' mouth camp: the Missing Five open, Edric first (10-30)', pt: 'the house lane · the Missing Five · situations from a link',
      lead: 'lymen', lvl: 3, silver: 30, renown: 1, give: [['potion', 2], ['torch', 2]], flags: { papaLymen: 1, 'work:winters': 1, 'work:cradles': 1, 'hex:brawl': 1, fiveBy: 'pete' },
      open: ['warrens'], done: ['company', 'work'], pin: 'warrens',
      at: { town: 'warrens', gate: 'feed' }, day: 1, hour: 9,
      look: 'Day 2, morning, level 3 (Vivian a thief): the four at the Warrens\' mouth camp, in by the feed track. The JOURNAL: the Missing Five open and pinned in Warrens Pete\'s words, its marker on Edric Pellam at the tally-house; the Company and Finding Work done. Edric books you, Skarn opens his gate.' },
    cull16: { group: G, title: 'The Guano Galleries\' mouth: Sabeth\'s cull taken (10-30)', pt: 'the house lane · the Cull · situations from a link',
      lead: 'lymen', lvl: 4, kit: true, silver: 40, renown: 1, give: [['potion', 2], ['antitoxin', 1]], flags: { papaLymen: 1, 'work:winters': 1, 'hex:brawl': 1, heardGalleries: 1, cullHired: 1, paidBats: 0, paidMantles: 0 }, // (Sabeth's yes: js/mines.js, its kills at the hire)
      open: ['cull'], done: ['company', 'work'], pin: 'cull',
      at: { town: 'mouth', gate: 'east' }, day: 1, hour: 13,
      look: 'Day 2, early afternoon, level 4 (Vivian in the studded leather she buys at 4): the four at the guano mine\'s mouth, in by the east gate. The JOURNAL: the Cull taken and pinned -- the dens, Old Wynn\'s rattle -- Sabeth paying three silver a giant bat\'s head from here on. Her law: no fire and no noise under a roost.' },
    // (Find Familiar in the second game, 10-31 -- the Halloween desk, his "can you get find familiar working": two sheets and two bundles of Calling Herbs, a floor and THE WORLD east of it)
    familiar16: { group: G, title: 'The Guano Galleries\' mouth with two Find Familiar sheets and two bundles of Calling Herbs: the ritual on a floor and on THE WORLD (10-31)', pt: 'the second game\'s house · Find Familiar · situations from a link',
      lead: 'aurdin', lvl: 3, kit: true, silver: 40, give: [['sheet_findfamiliar', 2], ['callingherbs', 2]], flags: { papaLymen: 1, 'work:winters': 1, heardGalleries: 1 },
      open: ['cull'], done: ['company', 'work'], pin: 'cull',
      at: { town: 'mouth', gate: 'east' }, day: 1, hour: 10,
      look: 'Day 2, mid-morning, level 3: the four at the guano mine\'s mouth, Aurdin leading, two Find Familiar sheets and two bundles of Calling Herbs in the pack. M, ITEMS, the sheet: WHO COPIES IT? Aurdin copies it. M, MAGIC, Aurdin, FIND FAMILIAR (a ritual): WHAT SHAPE? -- a bat, a rat or a spider, a cave\'s -- and the hour goes by, the menu shuts and the lines say the spirit settles on his shoulder; the next fight seats it. Then out east to THE WORLD: ITEMS, the second sheet (it crashed the game there: now "Aurdin knows Find Familiar already"), and MAGIC, FIND FAMILIAR again -- the shapes of the ground the party stands on (an owl or a rat on the plains), "ripples like smoke" for the new one, an hour on the clock. With no herbs left: the line, no page.' },
    // (the deep gallery's door, 10-30 -- eyes-deepgallery-1028's, a test floor at level 6 till then: the desk's "review situations.html and urls better than they knew to make", his word)
    dace16: { group: G, title: 'The Guano Galleries\' mouth at level 6: the cloaker\'s tail on the board, Dace by the beam (10-30)', pt: 'the warrens and galleries on the tiles · the deep gallery · situations from a link',
      lead: 'lymen', lvl: 6, kit: true, silver: 60, renown: 2, give: [['potion', 3], ['torch', 2]], flags: { papaLymen: 1, 'work:winters': 1, 'hex:brawl': 1, heardGalleries: 1, cullHired: 1, paidBats: 0, paidMantles: 0, heardCloaker: 1 },
      open: ['cull', 'tail'], done: ['company', 'work'], pin: 'tail',
      at: { town: 'mouth', gate: 'east' }, day: 2, hour: 10,
      look: 'Day 3, mid-morning, level 6 (the kit they buy by 6: Vivian\'s studded leather, Lymen\'s Longsword +1): the four at the guano mine\'s mouth. The JOURNAL: the cloaker\'s tail pinned (forty gold, the deep gallery) and the Cull taken. Dace by the beam: TAKE HIM and his mission opens; Old Wynn sends him home if asked. Down the working gallery to the slide, then the deep gallery: his staff lights, the cloaker hunts him.' }
  };

  var D = window.D16; if (!D || !D.house) return; // (situations.html reads the table alone)
  var H = D.house, S16 = D.sit16 = {};
  S16.id = function (q) { var m = /[?&]at=([a-z0-9-]+)/.exec(q || ''); return m && DS.SIT16[m[1]] ? m[1] : null; };
  // a mission as C.quests reads it: the first game's record with the second game's over it
  S16.quest = function (id) {
    var C = D.counter, q = null;
    (DS.DATA.quests || []).forEach(function (x) { if (x.id === id) q = x; });
    C.OWN_QUESTS.forEach(function (x) { if (x.id === id) q = q ? Object.assign({}, q, x) : x; });
    return q;
  };
  // its show or done words met: when they don't hold already, the flags of their first way (`flag:a & flag:b | ...` -- a, b); a way that is not flags (party>=4, has:) is met by
  // the party and the pack the situation gives, and the bench says when it is not
  S16.meet = function (st, id, key) {
    var C = D.counter, q = S16.quest(id), c = q && q[key];
    if (!c || C.cond(c, st)) return;
    String(c).split('|')[0].split('&').forEach(function (t) { var m = /^\s*flag:([^\s]+)\s*$/.exec(t); if (m) C.flagOn(st, m[1]); });
  };
  // a hero at the level (as the level-up makes one), what the second game takes out (H.start: Ned's page), what they bought, and rested
  S16.hero = function (id, s) {
    var R = DS.R, d = DS.DATA.heroes[id], h = H.start(R.makeHero(id, s.lvl && s.lvl > d.level ? s.lvl : undefined));
    R.autoPicks(h);
    if (s.kit && D.save.KIT) D.save.KIT.forEach(function (k) { if (h.lvl >= k[0] && k[1] === id && DS.DATA.items[k[3]]) h.equip[k[2]] = k[3]; });
    var g = (s.gear || {})[id]; if (g) Object.keys(g).forEach(function (sl) { h.equip[sl] = g[sl]; });
    R.refresh(h, true); // (what is worn bonds: R.attune)
    return h;
  };
  // the square beside a Silverton person (js/company.js CO.stage's way), or on a mark
  function besideOn(fl, at) {
    var R = D.roam;
    if (at.mark) { var mk = (fl.marks[at.mark] || [])[0]; return mk ? { sq: mk.slice(), dir: R.DIR8['0,-1'] } : null; }
    var pp = fl.people.filter(function (p) { return p.id === at.near; })[0], taken = {}; if (!pp) return null;
    fl.people.forEach(function (p) { taken[p.at[0] + ',' + p.at[1]] = 1; });
    var o0 = [[0, 1], [-1, 0], [1, 0], [0, -1], [1, 1], [-1, 1]].filter(function (o) { var x = pp.at[0] + o[0], y = pp.at[1] + o[1], r = fl.rows[y]; return r && '.,='.indexOf(r.charAt(x)) >= 0 && !taken[x + ',' + y]; })[0];
    return o0 ? { sq: [pp.at[0] + o0[0], pp.at[1] + o0[1]], dir: R.DIR8[(-o0[0]) + ',' + (-o0[1])] || null } : null;
  }
  // THE SAVE, from the door's words (nothing written: the caller holds it)
  S16.save = function (id) {
    var s = DS.SIT16[id]; if (!s) return null;
    var C = D.counter, W = D.world, was = H.playing; H.playing = false; // (the JOURNAL's words read this save's party, not a game's in play)
    try {
      var lead = s.lead || H.HEROES[0], ids = [lead].concat((s.hired || H.HEROES).filter(function (x) { return x !== lead; }));
      var rec = H.fresh(lead);
      rec.hired = ids.slice(); rec.party = ids.map(function (x) { return S16.hero(x, s); });
      (s.give || []).forEach(function (g) { if (DS.DATA.items[g[0]]) H.add(rec.inv, g[0], g[1]); });
      if (s.silver != null) rec.silver = s.silver;
      if (s.renown) rec.renown = s.renown;
      var st = { flags: rec.flags, inv: rec.inv, party: rec.party };
      Object.keys(s.flags || {}).forEach(function (k) { if (s.flags[k] === 1) C.flagOn(st, k); else rec.flags[k] = s.flags[k]; });
      (s.open || []).forEach(function (q) { S16.meet(st, q, 'show'); });
      (s.done || []).forEach(function (q) { S16.meet(st, q, 'show'); S16.meet(st, q, 'done'); });
      if (s.pin) rec.flags.pin = s.pin;
      rec.flags.qSeen = 1; C.quests(st).forEach(function (q) { rec.flags['q:' + q.id] = 1; }); // (the JOURNAL as it stands, seen: no card flies for what it opens with -- js/hours.js H16.missionDue)
      var at = s.at || {}, town = at.town || 'silverton', dr = W.DOORS[town], pl = null;
      if (town === 'silverton' && (at.near || at.mark) && D.town && D.town.floor) pl = besideOn(D.town.floor('', rec.flags), at);
      rec.at = { town: town, gate: at.gate || (dr ? Object.keys(dr.gates)[0] : 'west'), sq: at.sq || (pl && pl.sq) || null, dir: at.dir || (pl && pl.dir) || null };
      // THE WORLD under it: the place's hex (the Warrens have none of their own -- Silverton's feed track), the day and the hour
      if (W.index) W.index(); // (THE WORLD's map is indexed on its first look: js/world.js W.index)
      var Mw = W.map && W.map('world'), sid = dr && town !== 'warrens' ? town : 'silverton', site = Mw && (Mw.sites || []).filter(function (x) { return x.id === sid; })[0];
      rec.world = site ? { at: site.hex.slice(), from: null, t: (s.day || 0) * 24 + (s.hour != null ? s.hour : W.MORNING), today: 0, seed: (Date.now() >>> 0) } : null;
      rec.situation = id; rec.saved = 0;
      return rec;
    } finally { H.playing = was; }
  };
  // ...and opened as CONTINUE opens a slot, in no slot (slot 0: SAVE refuses -- H.saveTo)
  S16.open = function (id) {
    var rec = S16.save(id); if (!rec) return false;
    DS.G = { flags: rec.flags };
    H.begin(rec, 0); H.trail('situation', id + ' (deep16/?at=' + id + ')');
    return true;
  };
})();
