/* DEEP16 -- THE SCENE SIMULATOR's own code (deep16/scenes.html; 2026-11-25, scenes-1125, a seat of the lanes desk; the eyes lane). Griz, 11-24: "Can we do an html -
   scene simulator - that does these dialogs for rapid review without having to load into the game, where depth series lines are marked (snoot 1, snoot 2) (mirror 1,
   mirror 2) etc the back of the lines in question - front page to all major dialog scenes and one we add to review later (i.e. this batch) - with a notes save like the
   main menu notes"; 11-25, "start scene simulator - working through the dialog without loading the game is going to be useful".

   WHAT RUNS: the game's own scripts (scenes.html loads deep16/index.html's list, main.js left out). A scene is STAGED by the game's own staging -- a show's beat (the inn's
   In.BEATS by In.play, Silverton's H16.SHOW_BEATS and C.SERVICE_BEATS by C.servicePlay, the wagon's, the survivors', the General's, the true word's, the second act's,
   Solskaft's, the black egg's by their own play), a second-game situation (DS.SIT16 by D.sit16.open) or a door (?roam=... by D.roam.make, as an eyes row's link) -- with
   the conditions on the page's left laid over it (the day, the hour, the renown, the level, the lead, the flags). Then the floor's own script runs, and a talk is fired as
   a click on the person does (D.roam.walkTo / walkBeside / fire); every screen that comes up is read here as the walkthrough bench reads it (dev/bench16.js playK): a
   counter's words (js/counter.js Counter: its say, its ask, the supper's flip), a floor's prompt and cards, the morning. The answers are the player's, clicked here.
   NOTHING IS SAVED TO THE GAME: scenes.html's sandbox holds the game's storage in memory, and each staging empties it.

   THE MARKS AT A LINE'S BACK (his "depth series lines are marked"): what the game itself consulted between the last thing said and this one --
     the SERIES (gold): the line's place in a table the game picks from by depth -- the supper's gossip threads (In.MEAL.bands: the moot, the gnolls since -- the Snoot
       among them -- the made things, mirror-eyed: a thread's word n of m, its telling garbled, put right or settled), the house's silent reads (In.SUP.READS), the town's
       renown greetings (C.RENOWN_SAYS: the band and the line of its pair), the council's sittings (H16.COUNCIL: a sitting's line n of m), a person's talk branches
       (content/npcs.json `talk`: branch i of n and its `if`), the text table's key (content/text.json);
     WHO speaks (blue); the FLAGS read (green set, grey not), and what the line set; the game's own conditions asked (In.day, In.renown, In.supKind ...); the CHECKS the
       game rolled and wrote to its trail; and WHERE in the code the line is written, with the code just before it (its ternary, its `if`) -- file:line.
   THE NOTES: a NOTE on a line stamps the draft with the staged day and hour, the place, the scene, the line and its marks (a stamp the M menu's NOTES' shape, "-- day ...
   --", so js/house.js H.unstamp and dev/records.py read it), and SAVE writes hero_situations_feedback-<UTC>.json -- `from: 'the scene simulator'`, the notes, and
   `scenes`: each note's scene, line, speaker, words, marks and stage, for the desk.

   TO ADD A SCENE TO THE REVIEW SHELF (his "one we add to review later"): a row in SIM.REVIEW below -- id, title, why (whose ask, which lane), and `stage`: { show:
   '<source id>', beat: '<beat id>' } or { door: 'deep16/?roam=...' } or { sit: '<DS.SIT16 id>' }, `talk` the person to fire once it is laid (an npc id, or a door
   trigger's id), `use` an item to use from the pack, and `more` the stage's own overrides (flags, renown, day, hour, inv). Cut a row once he has seen it. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, $ = function (id) { return document.getElementById(id); };
  var SIM = window.SCENES = {}, statusEl = $('status');
  if (!D || !D.inn || !D.counter || !D.house || !D.roam) { statusEl.textContent = 'the game did not load: ' + (window.SCENES_LOADERR || []).slice(0, 3).join(' · '); statusEl.className = 'bad'; return; }
  var In = D.inn, C = D.counter, H = D.house, R = D.roam, W = D.world, H16 = D.hours;
  var strip = function (s) { return DS.stripCodes ? DS.stripCodes(String(s == null ? '' : s)) : String(s == null ? '' : s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var norm = function (s) { return strip(s).replace(/^[\s"'(]+|[\s"')]+$/g, '').replace(/\s+/g, ' ').trim(); };
  // a quiet page: no sound, no music (the house's rule for the pane: DS.audio.musicVol = 0 first)
  D.sfx = function () { }; try { if (DS.audio) { DS.audio.musicVol = 0; if (DS.audio.stop) DS.audio.stop(); } } catch (e) { /* (no audio) */ }

  // ================================================================ THE CATALOG: the game's own staged scenes, grouped as he plays them
  var beatsOf = function (o, k) { return o && Array.isArray(o[k]) ? o[k] : []; };
  // the inn's beats that are a place to look at, not a talk (walls, roofs, the water's edge): left off the front page
  var INN_LOOKS = { yard: 1, door: 1, upstairs: 1, night: 1, barn: 1, doorcut: 1, behindfire: 1, behindstack: 1, behindhouse: 1, lakeedge: 1, world: 1, silk: 1, southmouth: 1, wagonyard: 1, shore: 1 };
  var SUPPERS = { room: 1, supwarm: 1, meal8: 1, meal14: 1, suplater: 1, supamara: 1, supalone: 1, doranhome: 1, supsacr: 1, sacfaint: 1, sacnone: 1, sackept: 1, duestair: 1, wagon: 1, wagonseen: 1 };
  var BARN = { barnunseen: 1, barnseen: 1, barnaway: 1, barnknown: 1, childtow: 1 };
  var COUNCIL = { council1: 1, council2: 1, council3: 1, council4: 1, table: 1, tablenight: 1, pitaway: 1, pittown: 1 };
  // the beats that say nothing here, found by ?probe=all on 11-25: each stands the party on THE WORLD for the player to walk, or is a fight's own beat -- their words
  // come of the walk or the fight, which the simulator does not play (a new one that says nothing shows in ?probe=all; add it here with its reason)
  var NOT_HERE = {
    'wagon-mark': 'the wagon\'s mark on THE WORLD: seen by wheeling the map, met by walking to it', 'wagon-roadday': 'the road by day on THE WORLD: walked', 'wagon-roadnorth': 'the road north on THE WORLD: walked',
    'trueword-road': 'the road south past the inn on THE WORLD: walked to the glory-seekers', 'trueword-joke': 'the egg inside the road\'s fight: its words are the fight\'s (the engine casts, the seed pinned)',
    'blackegg-pass': 'the pass on THE WORLD: nothing is said, by design', 'blackegg-dawn': 'the third dawn on THE WORLD: comes of the night walked',
    'sit-camp16': 'a camp on THE WORLD: the camp page, no talk', 'sit-book16': 'Katarina\'s book on THE WORLD: a page to read, no talk'
  };
  SIM.SOURCES = {
    inn: { name: 'THE HALFWAY INN', beats: function () { return beatsOf(In, 'BEATS'); }, play: function (bt) { In.play(bt); } },
    hours: { name: 'SILVERTON\'S HOURS AND WORDS', beats: function () { return beatsOf(H16, 'SHOW_BEATS'); }, play: function (bt) { C.servicePlay(bt); } },
    services: { name: 'SILVERTON\'S SERVICES', beats: function () { return beatsOf(C, 'SERVICE_BEATS'); }, play: function (bt) { C.servicePlay(bt); } },
    wagon: { name: 'THE WAGON ON THE ROAD', beats: function () { return beatsOf(D.wagon, 'BEATS'); }, play: function (bt) { D.wagon.play(bt); } },
    survivors: { name: 'THE SURVIVORS\' TALK', beats: function () { return beatsOf(D.survivors, 'BEATS'); }, play: function (bt) { D.survivors.play(bt); } },
    general: { name: 'GENERAL GRIMLOCK GRIM', beats: function () { return beatsOf(D.general, 'BEATS'); }, play: function (bt) { D.general.play(bt); } },
    trueword: { name: 'THE GLORY-SEEKERS AND THE TRUE WORD', beats: function () { return beatsOf(D.trueword, 'BEATS'); }, play: function (bt) { D.trueword.play(bt); } },
    secondact: { name: 'THE SECOND ACT', beats: function () { return beatsOf(D.secondact, 'BEATS'); }, play: function (bt) { D.secondact.play(bt); } },
    solskaft: { name: 'SÓLSKAFT', beats: function () { return beatsOf(D.solskaft, 'BEATS'); }, play: function (bt) { D.solskaft.play(bt); } },
    blackegg: { name: 'SOMETHING WENT BY (the black egg)', beats: function () { return beatsOf(D.blackEgg, 'BEATS'); }, play: function (bt) { D.blackEgg.play(bt); } }
  };
  // THE REVIEW SHELF (his "one we add to review later (i.e. this batch)"): the scenes of 11-24 and 11-25, each staged as its eyes row's door stages it
  SIM.REVIEW = [
    { id: 'r-nell', title: 'NELL OUT BACK: her name, her road in pieces, TAKE HER (11-24)', why: 'inn-1124; his "Nell is approved, add the scene". In.nellVisit, In.NELL, In.nellTake. Talk to her a few times: her name first, then a piece of her road a visit.',
      stage: { door: 'deep16/?roam=halfway&hour=10&day=13&at=42,12&lvl=3&flags=reachedInn,gennetNamed,mealHad,kidAtInn,glamourBroken,glamourSeen' }, talk: 'adoptedKid' },
    { id: 'r-elsbeth', title: 'ELSBETH IN HER OWN WORDS: one opening a visit, on the flip (11-24)', why: 'inn-1124; his "Elsbeth scene go". In.elsVisit, In.elsFlip, In.ELSV. Vivian leads after the supper\'s counting; her tellings in her own voice.',
      stage: { door: 'deep16/?roam=halfway&hour=9&day=13&at=32,21&inside&lvl=3&flags=reachedInn,gennetNamed,mealHad,mealWrong' }, talk: 'elsbeth' },
    { id: 'r-gennet', title: 'GENNET THE MORNING AFTER THE WAGON (11-24)', why: 'inn-1124; his "Gennet scene go". In.gennetAfterVisit, In.GAFTER. Doran\'s drive, the girl out back, her lie read by the best Insight.',
      stage: { door: 'deep16/?roam=halfway&hour=9&day=13&at=10,16&lvl=3&flags=reachedInn,gennetNamed,mealHad,kidAtInn,glamourBroken,doranAway,doranPit,wagonOutcome,gennetOwed' }, talk: 'gennet' },
    { id: 'r-doran', title: 'DORAN BACK FROM THE PIT: said once, then one question (11-24)', why: 'inn-1124; his "Doran scene go". In.doranBackVisit, In.DBACK. GreyFang\'s house, the road, the Pit, the night\'s drive.',
      stage: { door: 'deep16/?roam=halfway&hour=10&day=16&at=16,24&lvl=3&flags=reachedInn,gennetNamed,mealHad,doranPit,kidAtInn,glamourBroken' }, talk: 'doranYard' },
    { id: 'r-pages', title: 'WILLEM\'S BOOK INTO ITS PAGES (11-24)', why: 'inn-1124; his "Splitting into pages is good". In.willemPages: the book used from the pack (USE below), six sheets; Falstaff\'s prices.',
      stage: { show: 'inn', beat: 'willempages' }, use: 'willembook' },
    { id: 'r-ring', title: 'WINTERS REFUSES HIS OWN RING on his SELL shelf (11-25)', why: 'world-1124; his "Yes, refuse it". C.WINTERS_KEEP: the Ring of Water Walking at "--"; offer it and he keeps his word instead.',
      stage: { sit: 'winters3', more: { inv: [['ringwaterwalking', 1]], flags: { wintersRing: 1 } } }, talk: 'winters' },
    { id: 'r-renown', title: 'THE TOWN KNOWS YOU: the townsfolk\'s first line by renown (11-24)', why: 'world-1124; his "NPC dialog one-liners changing with renown level". C.RENOWN_SAYS. Change the renown on the left and talk to anyone in costume.',
      stage: { show: 'trueword', beat: 'council', more: { renown: 3 } } },
    { id: 'r-doranhome', title: 'DORAN\'S FIRST SUPPER HOME (the Snoot getting worse)', why: 'The supper with Doran\'s two lines before her opener (ruling 56); the gnolls thread at the Pit.', stage: { show: 'inn', beat: 'doranhome' }, talk: 'gennet' }
  ];
  SIM.entries = []; SIM.byId = {}; SIM.unreached = [];
  function addEntry(e) { if (SIM.byId[e.id]) return; if (NOT_HERE[e.id]) { SIM.unreached.push(e.id + ': ' + NOT_HERE[e.id]); return; } SIM.entries.push(e); SIM.byId[e.id] = e; }
  function catalog() {
    SIM.REVIEW.forEach(function (r) { addEntry(Object.assign({ group: 'review', review: true }, r)); });
    var grp = function (src, bt) {
      if (src === 'inn') return SUPPERS[bt.id] ? 'suppers' : BARN[bt.id] ? 'barn' : 'inn';
      if (src === 'hours') return COUNCIL[bt.id] ? 'council' : 'silverton';
      if (src === 'services') return 'silverton';
      return 'cutscenes';
    };
    Object.keys(SIM.SOURCES).forEach(function (k) {
      var S = SIM.SOURCES[k], bs = [];
      try { bs = S.beats(); } catch (e) { bs = []; }
      bs.forEach(function (bt) {
        if (!bt || !bt.id || (k === 'inn' && INN_LOOKS[bt.id])) return;
        if (bt.world && !bt.run) { SIM.unreached.push(k + '/' + bt.id + ': on THE WORLD with nothing run at once -- its scene comes of walking the map'); return; } // (a beat that stands the party on THE WORLD and leaves the walk to the player: nothing is said till the map is walked)
        addEntry({ id: k + '-' + bt.id, group: grp(k, bt), source: k, title: strip(bt.label || bt.id), why: strip(bt.note || ''), stage: { show: k, beat: bt.id } });
      });
    });
    Object.keys(DS.SIT16 || {}).forEach(function (id) { var s = DS.SIT16[id]; addEntry({ id: 'sit-' + id, group: 'situations', title: strip(s.title || id), why: strip(s.look || ''), stage: { sit: id } }); });
  }
  SIM.GROUPS = [
    ['review', 'REVIEW -- this batch (11-24 and 11-25)', 'The scenes waiting on his eye. A seat adds its new scenes here (SIM.REVIEW in deep16/scenes.js); a row is cut once he has seen it.'],
    ['suppers', 'THE SUPPERS at the Halfway Inn', 'Each supper as the game stages it: the four on the flip, the silent reads, the gossip by the day (the moot, the gnolls since and the Snoot, the made things), the regard. E on the inn lady fires by itself.'],
    ['inn', 'THE HALFWAY INN: its people', 'Katarina, Elsbeth, Gennet by day, the wagon\'s nights, the runner from the Pit, the big room, the rite.'],
    ['barn', 'THE BARN: the one in the end stall', 'Out of the barn with the child, by state.'],
    ['silverton', 'SILVERTON: its talks and counters', 'Papa and Lymen, the JOURNAL by words, Lucia, Swann, Hessle, the Five, the services.'],
    ['council', 'THE COUNCIL', 'The sittings, the long table, the Pit\'s word at its hour.'],
    ['cutscenes', 'THE ROAD\'S SCENES AND CUTSCENES', 'The wagon, the survivors, the General, the glory-seekers and the true word, the second act, Sólskaft, the black egg.'],
    ['situations', 'THE SECOND GAME\'S SITUATIONS (deep16/?at=)', 'Whole saves from a link: walk up to whoever is there and talk.']
  ];

  // ================================================================ THE MARKS: what chose a line
  // (1) the series tables, by their words: a line found in one is marked with its place in it
  var SERIES = Object.create(null);
  var putS = function (text, tag) { var k = norm(text); if (k.length >= 6 && !SERIES[k]) SERIES[k] = tag; };
  function buildSeries() {
    var MD = In.MEAL || {}, TH = MD.THREADS || {}, TNAME = { moot: 'the moot', gnolls: 'the gnolls since (the Snoot at the Pit its last)', made: 'the made things (mirror-eyed)' };
    Object.keys(TH).forEach(function (th) {
      TH[th].forEach(function (bid, i) {
        var b = (MD.bands || []).filter(function (x) { return x.id === bid; })[0]; if (!b) return;
        var at = TNAME[th] || th, n = (i + 1) + ' of ' + TH[th].length, from = ' -- from day ' + b.day + (b.lag ? ', garbled ' + b.lag + ' days' : '');
        if (b.garble) putS(b.garble, 'gossip: ' + at + ', word ' + n + ' (' + bid + ') -- the first telling, garbled' + from);
        if (b.fix) putS(b.fix, 'gossip: ' + at + ', word ' + n + ' (' + bid + ') -- put right, when they had it wrong');
        if (b.ok) putS(b.ok, 'gossip: ' + at + ', word ' + n + ' (' + bid + ') -- the settled word' + from);
      });
    });
    (MD.pit || []).forEach(function (l, i) { putS(l, 'Doran\'s first supper home, line ' + (i + 1) + ' of ' + MD.pit.length + ' (ruling 56)'); });
    (MD.more || []).forEach(function (l, i) { putS(l, 'the supper\'s lull, line ' + (i + 1) + ' of ' + MD.more.length); });
    (MD.close || []).forEach(function (l, i) { putS(l, 'the supper\'s close, ' + (i + 1) + ' of ' + MD.close.length); });
    Object.keys(MD.tell || {}).forEach(function (k) { putS(MD.tell[k], 'the table\'s warmth shown: ' + k); });
    if (MD.witness) putS(MD.witness, 'the witness line');
    var RD = (In.SUP || {}).READS || {};
    Object.keys(RD).forEach(function (k) { var r = RD[k]; if (typeof r.text === 'string' && r.text) putS(r.text, 'a silent read: ' + k + ' (' + r.skill + ' ' + (typeof r.dc === 'number' ? r.dc : '') + (r.opens ? ', opens ' + r.opens : '') + ')'); });
    var RS = C.RENOWN_SAYS || [], titles = (((DS.DATA || {}).config || {}).renownTitles) || [];
    RS.forEach(function (ls, band) { (ls || []).forEach(function (l, i) { putS(l, 'renown ' + band + (titles[band] ? ' (' + strip(titles[band]) + ')' : '') + ', greeting ' + (i + 1) + ' of ' + ls.length + ', turn and turn about'); }); });
    var CO = (H16 && H16.COUNCIL) || {};
    Object.keys(CO).forEach(function (id) { var cs = CO[id]; if (!cs || !cs.lines) return; if (cs.card) putS(cs.card, 'the council: ' + id + ', its card'); cs.lines.forEach(function (ln, k) { putS(ln[1], 'the council: ' + id + ', line ' + (k + 1) + ' of ' + cs.lines.length + ' (' + ln[0] + ')'); }); if (cs.end) putS(cs.end, 'the council: ' + id + ', the board'); });
    var NP = (DS.DATA || {}).npcs || {};
    Object.keys(NP).forEach(function (id) { var t = NP[id].talk; if (!Array.isArray(t)) return; t.forEach(function (br, i) { [].concat(br.say || []).forEach(function (l) { putS(l, (NP[id].name || id) + '\'s talk, branch ' + (i + 1) + ' of ' + t.length + (br.if ? ' -- if ' + br.if : ' -- no condition')); }); }); });
    var TX = (DS.DATA || {}).text || {};
    Object.keys(TX).forEach(function (k) { var v = TX[k] && TX[k].t; [].concat(v || []).forEach(function (l, i) { if (typeof l === 'string') putS(l, 'text ' + k + (Array.isArray(v) && v.length > 1 ? ' [' + (i + 1) + ' of ' + v.length + ']' : '')); }); });
  }
  // (2) where in the code a line is written: every string in the scene files, by file and line, with the code just before it
  var CODE = [], CODEX = Object.create(null);
  function buildCode() {
    var files = ['inn.js', 'counter.js', 'hours.js', 'town.js', 'mines.js', 'secondact.js', 'wagon.js', 'survivors.js', 'general.js', 'trueword.js', 'asdis.js', 'company.js', 'house.js', 'world.js', 'chase.js', 'solskaft.js', 'blackegg.js', 'snootroad.js', 'gulch.js', 'cradle.js', 'roam.js', 'hunger.js', 'hex.js', 'innprops.js', 'campfire.js', 'camp.js'];
    var srcOf = {}; Array.prototype.forEach.call(document.scripts, function (s) { var m = /(?:^|\/)js\/([a-z0-9]+\.js)\?/.exec(s.getAttribute('src') || ''); if (m && !/\.\.\//.test(s.getAttribute('src'))) srcOf[m[1]] = s.getAttribute('src'); });
    return Promise.all(files.filter(function (f) { return srcOf[f]; }).map(function (f) {
      return window.SCENES_GET(srcOf[f].split('?')[0]).then(function (txt) {
        var lineAt = []; for (var i = 0; i < txt.length; i++) { if (txt.charCodeAt(i) === 10) lineAt.push(i); }
        var lineOf = function (pos) { var lo = 0, hi = lineAt.length; while (lo < hi) { var mid = (lo + hi) >> 1; if (lineAt[mid] < pos) lo = mid + 1; else hi = mid; } return lo + 1; };
        // the file's strings read as the parser reads them, a quote at a time (a pattern over the whole file paired an apostrophe in one string with the next
        // string's quote); the comments skipped -- a line quoted in a comment is a ruling's words, not where the game says it
        var emit = function (at, raw) {
          if (raw.length < 14 || !/ /.test(raw) || (/\$\{/.test(raw) && raw.replace(/\$\{[^}]*\}/g, '').length < 14)) return;
          var said = raw.replace(/\\'/g, '\'').replace(/\\"/g, '"').replace(/\\`/g, '`').replace(/\\n/g, ' ');
          var pre = txt.slice(Math.max(0, at - 140), at), cut = Math.max(pre.lastIndexOf(';'), pre.lastIndexOf('{'), pre.lastIndexOf('}'), pre.lastIndexOf('\n'));
          var why = pre.slice(cut + 1).replace(/\s+/g, ' ').trim();
          var row = { file: f, line: lineOf(at), said: norm(said.replace(/\$\{[^}]*\}/g, '\u0000')), why: why.length > 110 ? '…' + why.slice(-110) : why };
          if (row.said.length < 8) return;
          CODE.push(row); if (row.said.indexOf('\u0000') < 0 && !CODEX[row.said]) CODEX[row.said] = row;
        };
        for (var p = 0, N = txt.length; p < N; p++) {
          var ch = txt.charAt(p);
          if (ch === '/' && txt.charAt(p + 1) === '/') { p = txt.indexOf('\n', p); if (p < 0) break; continue; }
          if (ch === '/' && txt.charAt(p + 1) === '*') { p = txt.indexOf('*/', p + 2) + 1; if (p <= 0) break; continue; }
          if (ch === '\'' || ch === '"' || ch === '`') {
            var j = p + 1, ok = true;
            while (j < N) { var d = txt.charAt(j); if (d === '\\') { j += 2; continue; } if (d === ch) break; if (d === '\n' && ch !== '`') { ok = false; break; } j++; }
            if (ok && j < N) emit(p, txt.slice(p + 1, j));
            p = j; continue;
          }
        }
      }).catch(function () { });
    }));
  }
  function codeOf(text) {
    var k = norm(text); if (CODEX[k]) return CODEX[k];
    var best = null, score = function (c) { return c.said.replace(/\u0000/g, '').length; };
    for (var i = 0; i < CODE.length; i++) {
      var c = CODE[i], parts = c.said.split('\u0000'), ok = true, at = 0;
      if (parts.length === 1) { if (c.said.length >= 20 && k.indexOf(c.said) >= 0 && (!best || score(c) > score(best))) best = c; continue; }
      for (var j = 0; j < parts.length && ok; j++) { var p = parts[j].trim(); if (!p) continue; var q = k.indexOf(p, at); if (q < 0) ok = false; else at = q + p.length; }
      if (ok && c.said.replace(/\u0000/g, '').length >= 16 && (!best || score(c) > score(best))) best = c;
    }
    return best;
  }
  function seriesOf(text) {
    var k = norm(text); if (SERIES[k]) return SERIES[k];
    var hit = null; Object.keys(SERIES).some(function (s) { if (s.length >= 24 && k.indexOf(s) >= 0) { hit = SERIES[s]; return true; } return false; });
    return hit;
  }
  // (3) what the game consulted as it ran: the floor's flags (read and set), its own conditions, the text keys, its trail
  var BUCKET = null, REC = false;
  var fresh = function () { return { reads: {}, sets: {}, calls: [], keys: [], trail: [] }; };
  SIM.flush = function () { var b = BUCKET || fresh(); BUCKET = fresh(); return b; };
  BUCKET = fresh();
  var IGN = { toJSON: 1, constructor: 1, then: 1, length: 1 };
  function proxyFlags(obj) {
    if (!obj || obj.__simProxy) return obj;
    return new Proxy(obj, {
      get: function (t, k) { if (k === '__simProxy') return true; var v = t[k]; if (REC && typeof k === 'string' && !IGN[k] && !(k in BUCKET.reads) && !(k in BUCKET.sets)) BUCKET.reads[k] = v === undefined ? null : v; return v; },
      set: function (t, k, v) { if (REC && typeof k === 'string') BUCKET.sets[k] = v; t[k] = v; return true; },
      deleteProperty: function (t, k) { if (REC && typeof k === 'string') BUCKET.sets[k] = null; delete t[k]; return true; }
    });
  }
  SIM.watch = function (B) { if (B && B.roam && B.roam.flags && !B.roam.flags.__simProxy) B.roam.flags = proxyFlags(B.roam.flags); };
  var wrapCall = function (obj, name, label) {
    if (!obj || typeof obj[name] !== 'function' || obj[name].__sim) return;
    var f0 = obj[name], f = function () { var r = f0.apply(this, arguments); if (REC && (typeof r === 'number' || typeof r === 'string' || typeof r === 'boolean' || r === null)) { var s = label + '=' + (typeof r === 'string' ? r : JSON.stringify(r)); if (BUCKET.calls.indexOf(s) < 0) BUCKET.calls.push(s); } return r; };
    f.__sim = true; obj[name] = f;
  };
  function instrument() {
    [['day', 'day'], ['renown', 'renown'], ['supKind', 'the supper'], ['katOpen', 'Katarina open'], ['katHere', 'Katarina here'], ['dueTonightOn', 'the due tonight'], ['snootOn', 'the Snoot on'], ['named', 'her name'], ['cycle', 'the due\'s cycle'], ['nightsToDue', 'nights to the due']].forEach(function (p) { wrapCall(In, p[0], p[1]); });
    [['renownOf', 'renown'], ['ringReady', 'the ring ready (lead level 3)'], ['nedOpen', 'Ned open']].forEach(function (p) { wrapCall(C, p[0], p[1]); });
    if (W) [['dayAt', 'day'], ['hour', 'hour']].forEach(function (p) { wrapCall(W, p[0], p[1]); });
    if (typeof C.L === 'function' && !C.L.__sim) { var L0 = C.L; C.L = function (k) { if (REC && typeof k === 'string' && BUCKET.keys.indexOf(k) < 0) BUCKET.keys.push(k); return L0.apply(this, arguments); }; C.L.__sim = true; }
    if (typeof H.trail === 'function' && !H.trail.__sim) { var T0 = H.trail; H.trail = function (k, s) { if (REC && k !== 'talk') BUCKET.trail.push(strip(String(s || k)).replace(/^THE MEAL: /, '')); return T0.apply(this, arguments); }; H.trail.__sim = true; } // (the inn's trail heads every line THE MEAL: the channel's name, not what happened)
  }

  // ================================================================ THE NOTES (the M menu's NOTES' shape: a draft kept, stamps, SAVE a hero_situations_feedback file)
  var NKEY = 'deep16.scenes.notes';
  var notes = (function () { try { return JSON.parse(window.SCENES_STORE.real.get.call(window.localStorage, NKEY) || 'null') || {}; } catch (e) { return {}; } })();
  notes.draft = typeof notes.draft === 'string' ? notes.draft : ''; notes.items = Array.isArray(notes.items) ? notes.items : [];
  var keepNotes = function () { try { window.SCENES_STORE.real.set.call(window.localStorage, NKEY, JSON.stringify(notes)); } catch (e) { $('notesMsg').textContent = 'could not keep the draft: ' + e; } };
  var STAMP_RE = (H && H.STAMP_RE) || /^-- day .* --$/;
  var unstamp = function (t) { return H && H.unstamp ? H.unstamp(t, STAMP_RE) : t; };
  SIM.openNotes = function (stamp) {
    var ta = $('notesText'); $('notes').classList.remove('hidden');
    if (stamp) { var t = unstamp(notes.draft); notes.draft = t.replace(/\s+$/, '') + (t.trim() ? '\n\n' : '') + stamp + '\n'; keepNotes(); }
    ta.value = notes.draft; ta.focus(); ta.selectionStart = ta.selectionEnd = ta.value.length; ta.scrollTop = ta.scrollHeight;
  };
  $('notesText').addEventListener('input', function () { notes.draft = this.value; keepNotes(); });
  $('notesBtn').onclick = function () { SIM.openNotes(null); };
  $('notesClose').onclick = function () { notes.draft = unstamp($('notesText').value); keepNotes(); $('notes').classList.add('hidden'); markNoted(); };
  $('notesSave').onclick = function () {
    var text = unstamp($('notesText').value);
    if (!text.replace(/^--.*--$/gm, '').trim()) { $('notesMsg').textContent = 'Nothing written yet: type what you noticed under a stamp, then SAVE.'; return; }
    var live = notes.items.filter(function (it) { var i = text.indexOf(it.stamp); if (i < 0) return false; var after = text.slice(i + it.stamp.length).split(/\n-- day .* --\n?/)[0]; it.note = after.trim(); return !!it.note; });
    var name = H.notesName ? H.notesName() : 'hero_situations_feedback-' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 13) + 'Z.json';
    var file = { game: 'DRAGONSLEEP', kind: 'hero-situations-feedback', v: 2, from: 'the scene simulator', at: new Date().toISOString(), notes: text, page: location.origin + location.pathname,
      scenes: live, game2: null, trail: [], card: null, save: null };
    try {
      var a = document.createElement('a'), url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 1)], { type: 'application/json' }));
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      $('notesMsg').textContent = 'Saved ' + name + ' where your browser puts downloads (' + live.length + ' scene note' + (live.length === 1 ? '' : 's') + ').';
      SIM.lastSaved = file;
    } catch (e) { $('notesMsg').textContent = 'Could not write the file: ' + e; }
  };
  function markNoted() {
    var ids = {}; notes.items.forEach(function (it) { if (notes.draft.indexOf(it.stamp) >= 0) ids[it.scene] = 1; });
    Array.prototype.forEach.call(document.querySelectorAll('.row[data-id]'), function (r) { r.classList.toggle('noted', !!ids[r.getAttribute('data-id')]); });
  }

  // ================================================================ THE FRONT PAGE
  function front() {
    var box = $('shelves'), q = ($('filter').value || '').toLowerCase(), n = 0, html = '';
    SIM.GROUPS.forEach(function (g) {
      var es = SIM.entries.filter(function (e) { return e.group === g[0] && (!q || (e.title + ' ' + e.why + ' ' + e.id).toLowerCase().indexOf(q) >= 0); });
      if (!es.length) return; n += es.length;
      html += '<div class="shelf"><h2>' + esc(g[1]) + ' <i style="color:var(--faint);font-style:normal">(' + es.length + ')</i></h2><p class="why">' + esc(g[2]) + '</p><div class="rows">' +
        es.map(function (e) { return '<button class="row' + (e.review ? ' review' : '') + '" data-id="' + esc(e.id) + '"><b>' + esc(e.title) + '</b><span>' + esc(e.why) + '</span><i>' + esc(e.id) + '</i></button>'; }).join('') + '</div></div>';
    });
    if (!q && SIM.unreached.length) html += '<div class="shelf"><h2>NOT REACHABLE HERE YET</h2><p class="why">The game stages these on THE WORLD and leaves the walk to the player, or plays them inside a fight: their words come of walking the map or fighting, which the simulator does not do.</p><div class="lede" style="font-size:12.5px">' + SIM.unreached.map(esc).join('<br>') + '</div></div>';
    box.innerHTML = html; $('count').textContent = n + ' scenes';
    Array.prototype.forEach.call(box.querySelectorAll('.row'), function (b) { b.onclick = function () { location.hash = b.getAttribute('data-id'); }; });
    markNoted();
  }
  $('filter').addEventListener('input', front);
  $('toFront').onclick = function () { location.hash = ''; };

  // ================================================================ THE STAGE: the conditions, laid over the game's own staging
  var CUR = null; // { e: entry, o: the overrides the page holds }
  function baseOf(e) { // what the game's own staging sets: { day, hour, renown, lvl, lead, flags }
    var st = e.stage || {}, m = st.more || {}, b = { flags: {} };
    if (st.door) {
      var q = st.door.split('?')[1] || '', g = function (k) { var r = new RegExp('[?&]' + k + '=([^&]+)').exec('?' + q); return r ? decodeURIComponent(r[1]) : null; };
      b.day = g('day') != null ? +g('day') : null; b.hour = g('hour') != null ? +g('hour') : null; b.lvl = g('lvl') != null ? +g('lvl') : 3; b.renown = null; // (renown null: the stage's own -- a beat's play may set it after the NEW GAME is made, the true word's 3)
      (g('flags') || '').split(',').forEach(function (k) { if (k) b.flags[k] = 1; });
    } else if (st.show) {
      var bt = beatOf(st.show, st.beat) || {};
      b.day = bt.day != null ? bt.day : null; b.hour = bt.hour != null ? bt.hour : bt.t != null ? bt.t % 24 : null; b.renown = bt.renown != null ? bt.renown : null; b.lvl = bt.lvl || 3; b.lead = bt.lead || '';
      Object.keys(bt.flags || {}).forEach(function (k) { b.flags[k] = bt.flags[k]; });
    } else if (st.sit) {
      var s = (DS.SIT16 || {})[st.sit] || {};
      b.day = s.day != null ? s.day : null; b.hour = s.hour != null ? s.hour : null; b.renown = s.renown != null ? s.renown : null; b.lvl = s.lvl || 3; b.lead = s.lead || '';
      Object.keys(s.flags || {}).forEach(function (k) { b.flags[k] = s.flags[k]; });
    }
    if (m.renown != null) b.renown = m.renown; if (m.day != null) b.day = m.day; if (m.hour != null) b.hour = m.hour;
    Object.keys(m.flags || {}).forEach(function (k) { b.flags[k] = m.flags[k]; });
    return b;
  }
  function beatOf(src, id) { var S = SIM.SOURCES[src]; if (!S) return null; try { return S.beats().filter(function (b) { return b.id === id; })[0] || null; } catch (e) { return null; } }
  function drawStage() {
    var o = CUR.o, e = CUR.e, st = e.stage || {};
    $('stageFrom').innerHTML = 'staged by ' + (st.door ? 'the door <code>' + esc(st.door) + '</code>' : st.show ? 'the show beat <code>' + esc(st.show + ' · ' + st.beat) + '</code>' : st.sit ? 'the situation <code>?at=' + esc(st.sit) + '</code>' : '?');
    $('sDay').value = o.day == null ? '' : o.day; $('sHour').value = o.hour == null ? '' : o.hour; $('sRenown').value = o.renown == null ? '' : o.renown; $('sRenown').placeholder = o.had != null ? String(o.had) : ''; $('sLvl').value = o.lvl || 3; $('sLead').value = o.lead || ''; $('sDice').value = o.dice || '';
    $('sDayNote').textContent = o.day == null ? '(the stage\'s own)' : '';
    var fl = $('flags'); fl.innerHTML = '';
    o.off = o.off || {};
    Object.keys(o.flags).sort().forEach(function (k) { // (a flag's own value kept, 0 too -- dueOffC: 0 is the due's first cycle handled; turned off is o.off, the flag not laid at all)
      var v = o.flags[k], on = !o.off[k], b = document.createElement('span'); b.className = 'flag' + (on ? ' on' : ''); b.textContent = k + (v !== 1 && v != null && v !== true ? '=' + (typeof v === 'object' ? JSON.stringify(v).slice(0, 40) : v) : '');
      b.title = on ? 'laid on the stage -- click to leave it off' : 'left off -- click to lay it'; b.onclick = function () { if (on) o.off[k] = 1; else delete o.off[k]; drawStage(); };
      fl.appendChild(b);
    });
  }
  ['sDay', 'sHour', 'sRenown', 'sLvl', 'sLead', 'sDice'].forEach(function (id) { $(id).addEventListener('change', function () { var o = CUR.o, v = $(id).value; if (id === 'sDay') o.day = v === '' ? null : +v; if (id === 'sHour') o.hour = v === '' ? null : +v; if (id === 'sRenown') o.renown = v === '' ? null : +v || 0; if (id === 'sLvl') o.lvl = +v || 3; if (id === 'sLead') o.lead = v; if (id === 'sDice') o.dice = v; }); });
  var diceOf = function (o) { if (!o.dice) return null; var a = []; for (var i = 0; i < 200; i++) a.push(o.dice === 'high' ? 19 : 2); return a; }; // (the inn's d20s, In.d20: In.pinned as a show beat pins them)
  $('addFlagBtn').onclick = function () { var v = $('addFlag').value.trim(); if (!v) return; var p = v.split('='), k = p[0].trim(), val = p.length > 1 ? (isNaN(+p[1]) ? p[1].trim() : +p[1]) : 1; CUR.o.flags[k] = val; $('addFlag').value = ''; drawStage(); };
  $('addFlag').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') $('addFlagBtn').onclick(); });
  $('restage').onclick = function () { SIM.play(CUR.e, CUR.o); };
  $('resetStage').onclick = function () { var b = baseOf(CUR.e); CUR.o = Object.assign({}, b, { flags: Object.assign({}, b.flags), flagsWas: Object.assign({}, b.flags) }); drawStage(); SIM.play(CUR.e, CUR.o); };

  // the world emptied as a new page's would be: no screens, no game in the house, the sandbox cleared
  function clean() {
    SIM.stop = true; SIM.gen = (SIM.gen || 0) + 1; if (SIM.resolve) { var r = SIM.resolve; SIM.resolve = null; r(STOP); }
    $('ask').innerHTML = ''; $('here').innerHTML = '';
    try { while (D.scenes.length) D.pop(); } catch (e) { D.scenes.length = 0; }
    D.scenes.length = 0; D.battle = null; H.playing = false; H.cur = null; H.freshLvl = 0;
    ['duePlay', 'watching', 'bedding', 'woke', 'pinned', 'beatRun'].forEach(function (k) { if (k in In) In[k] = null; });
    C.testRenown = 0;
    var mem = window.SCENES_STORE.mem; Object.keys(mem).forEach(function (k) { delete mem[k]; });
  }
  // the overrides on the staging: the NEW GAME's record (H.fresh) takes the renown, the lead and the pack's extras; the flags go to the beat
  function withFresh(o, extra, fn) {
    var f0 = H.fresh;
    H.fresh = function () {
      var rec = f0.apply(this, arguments);
      if (o.renown != null) rec.renown = o.renown;
      if (o.lead && rec.party.some(function (h) { return (h.key || h.id) === o.lead; })) rec.lead = o.lead;
      ((extra && extra.inv) || []).forEach(function (s) { H.add(rec.inv, s[0], s[1]); });
      return rec;
    };
    var lv0 = H.freshLvl; H.freshLvl = o.lvl || 3;
    try { fn(); } finally { H.fresh = f0; H.freshLvl = lv0; }
  }
  function stage(e, o) {
    clean(); SIM.stop = false;
    var st = e.stage || {}, m = st.more || {}, flags = {}, off = o.off || {};
    Object.keys(o.flags).forEach(function (k) { if (!off[k]) flags[k] = o.flags[k]; });
    if (st.door) {
      var q = '?' + (st.door.split('?')[1] || '');
      q = q.replace(/[?&](day|hour|lvl|flags)=[^&]*/g, '').replace(/^&/, '?'); if (q === '') q = '?';
      q += (q.length > 1 ? '&' : '') + 'lvl=' + (o.lvl || 3) + (o.day != null ? '&day=' + o.day : '') + (o.hour != null ? '&hour=' + o.hour : '');
      var plain = Object.keys(flags).filter(function (k) { return /^[A-Za-z0-9_:]+$/.test(k); });
      if (plain.length) q += '&flags=' + plain.join(',');
      C.testRenown = o.renown != null ? o.renown : 0;
      var nb = R.make(q); D.push(nb);
      if (nb.roam) Object.keys(flags).forEach(function (k) { if (flags[k] !== 1) nb.roam.flags[k] = flags[k]; }); // (a flag with a value of its own -- wagonOutcome: 'quiet' -- set on the floor; the door's &flags= sets only 1)
      if (o.dice) In.pinned = diceOf(o);
      return 'door ' + q + (o.dice ? ' · the inn\'s dice all ' + o.dice : '');
    }
    if (st.show) {
      var bt0 = beatOf(st.show, st.beat); if (!bt0) throw new Error('no beat ' + st.show + '/' + st.beat + ' in the game');
      var bt = Object.assign({}, bt0, { flags: flags }); if (o.renown != null) bt.renown = o.renown;
      if (o.day != null) bt.day = o.day; if (o.hour != null) { bt.hour = o.hour; if (bt.t != null) bt.t = (o.day != null ? o.day : Math.floor(bt.t / 24)) * 24 + o.hour; }
      if (o.lead) bt.lead = o.lead;
      if (o.dice) bt.dice = diceOf(o);
      if (m.inv) bt.inv = (bt.inv || []).concat(m.inv.map(function (s) { return st.show === 'inn' ? s[0] : s; }));
      withFresh(o, null, function () { SIM.SOURCES[st.show].play(bt); });
      if (o.dice && st.show !== 'inn') In.pinned = diceOf(o); // (In.play pins its own from bt.dice; the other shows' beats leave the inn's dice to this)
      return 'beat ' + st.show + '/' + st.beat + (o.dice ? ' · the inn\'s dice all ' + o.dice : '');
    }
    if (st.sit) {
      var s0 = (DS.SIT16 || {})[st.sit]; if (!s0) throw new Error('no situation ' + st.sit);
      var s1 = Object.assign({}, s0, { flags: flags, lvl: o.lvl || s0.lvl }); if (o.renown != null) s1.renown = o.renown;
      if (o.day != null) s1.day = o.day; if (o.hour != null) s1.hour = o.hour; if (o.lead) s1.lead = o.lead;
      if (m.inv) s1.give = (s0.give || []).concat(m.inv);
      DS.SIT16.__sim = s1;
      try { withFresh(o, null, function () { D.sit16.open('__sim'); }); } finally { delete DS.SIT16.__sim; }
      return 'situation ' + st.sit;
    }
    throw new Error('no stage');
  }

  // ================================================================ THE LOG
  var LINE = 0;
  function addLine(kind, who, said, tags, meta) {
    var log = $('log'), d = document.createElement('div'); LINE++;
    d.className = 'ln ' + kind; d.setAttribute('data-n', LINE);
    if (kind === 'sys') { d.textContent = said; log.appendChild(d); return d; }
    var tagHtml = (tags || []).map(function (t, i) { return '<span class="tag ' + (t.c || '') + '" data-t="' + i + '" title="' + esc(t.title || t.t) + '">' + esc(t.t) + '</span>'; }).join('');
    d.innerHTML = '<div class="who">' + esc(who || '') + '</div><div><div class="said">' + esc(said) + '</div>' + (tagHtml ? '<div class="tags">' + tagHtml + '</div>' : '') + '</div><button class="noteBtn">NOTE</button>';
    var n = LINE; d.querySelector('.noteBtn').onclick = function () { noteOn(n, who, said, tags, meta); d.classList.add('noted'); };
    Array.prototype.forEach.call(d.querySelectorAll('.tag.more'), function (x) { x.onclick = function () { var t = tags[+x.getAttribute('data-t')]; (t.all || []).forEach(function (s) { var y = document.createElement('span'); y.className = 'tag ' + t.c.replace('more', ''); y.textContent = s; x.parentNode.insertBefore(y, x); }); x.remove(); }; });
    log.appendChild(d); d.scrollIntoView({ block: 'nearest' });
    return d;
  }
  var sys = function (s) { return addLine('sys', '', s); };
  // the marks for a line: its series, its speaker, the step's consulted conditions (shared by every line the step said), where in the code it is written
  function marks(said, who, b, opt) {
    var t = [], sr = seriesOf(said), cd = codeOf(said);
    if (sr) t.push({ c: 'series', t: sr });
    if (who && opt && opt.hero) t.push({ c: 'who', t: 'said by ' + who });
    if (opt && opt.extra) opt.extra.forEach(function (x) { t.push(x); });
    if (b) {
      b.calls.forEach(function (c) { t.push({ t: c, title: 'a condition the game asked as it chose this' }); });
      b.trail.forEach(function (c) { t.push({ c: 'chk', t: c, title: 'the game\'s own trail: a check rolled, a thread told' }); });
      var rk = opt && opt.card ? [] : Object.keys(b.reads), sk = opt && opt.card ? [] : Object.keys(b.sets);
      var isOn = function (v) { return v != null && v !== 0 && v !== false && v !== ''; }, on = rk.filter(function (k) { return isOn(b.reads[k]); }), off = rk.filter(function (k) { return !isOn(b.reads[k]); });
      on.forEach(function (k) { var v = b.reads[k]; t.push({ c: 'fset', t: k + (v === 1 || v === true ? '' : '=' + (typeof v === 'object' ? JSON.stringify(v).slice(0, 30) : v)), title: 'a flag read before this line, and set' }); });
      off.slice(0, off.length > 6 ? 4 : 6).forEach(function (k) { t.push({ c: 'funset', t: k + ' unset', title: 'a flag read before this line, not set' }); });
      if (off.length > 6) t.push({ c: 'funset more', t: '+' + (off.length - 4) + ' more unset', title: off.slice(4).join(', '), all: off.slice(4).map(function (k) { return k + ' unset'; }) });
      sk.slice(0, 8).forEach(function (k) { t.push({ c: 'fset', t: '→ sets ' + k + (b.sets[k] === 1 ? '' : '=' + JSON.stringify(b.sets[k]).slice(0, 30)), title: 'what this step set' }); });
      if (sk.length > 8) t.push({ c: 'fset more', t: '→ +' + (sk.length - 8) + ' more set', title: sk.slice(8).join(', '), all: sk.slice(8).map(function (k) { return '→ sets ' + k; }) });
      b.keys.forEach(function (k) { t.push({ t: 'text ' + k, title: 'content/text.json key' }); });
    }
    if (cd) t.push({ t: cd.file + ':' + cd.line + (cd.why ? '  ' + cd.why : ''), title: 'where the line is written, and the code just before it' });
    return t;
  }
  function stageWords() {
    var o = CUR.o, hr = null, dy = null;
    try { if (W && W.state && W.state() && W.hour) hr = W.hour(); } catch (e) { hr = null; }
    try { dy = H.playing && H.cur ? H.day(H.cur) : In.day(R.q); } catch (e) { dy = o.day; }
    if (hr == null) hr = o.hour;
    var place = (R.def && R.def.name) || (CUR.e.source ? SIM.SOURCES[CUR.e.source].name : '');
    return { day: dy, hour: hr, place: strip(place) };
  }
  function noteOn(n, who, said, tags, meta) {
    var sw = stageWords(), o = CUR.o, e = CUR.e, hh = sw.hour != null ? ('0' + Math.floor(sw.hour)).slice(-2) + ':' + ('0' + Math.round((sw.hour % 1) * 60)).slice(-2) : '';
    var cond = (tags || []).filter(function (t) { return t.c === 'series'; }).map(function (t) { return t.t; }).concat(['renown ' + (o.had != null ? o.had : o.renown || 0), 'level ' + (o.lvl || 3)]).join(' · ');
    var w0 = norm(said), stamp = '-- day ' + (sw.day != null ? sw.day : '?') + (hh ? ' · ' + hh : '') + ' · ' + sw.place + ' · the scene simulator: ' + e.title + ' · line ' + n + (who ? ' (' + who + ')' : '') + ': "' + w0.slice(0, 70) + (w0.length > 70 ? '…' : '') + '" · ' + cond + ' --';
    stamp = stamp.replace(/\n/g, ' ');
    notes.items.push({ stamp: stamp, scene: e.id, title: e.title, stage: JSON.parse(JSON.stringify(e.stage)), staged: { day: sw.day, hour: sw.hour, place: sw.place },
      conditions: { day: o.day, hour: o.hour, renown: o.had != null ? o.had : o.renown, lvl: o.lvl, lead: o.lead || null, flags: Object.assign({}, o.flags), off: Object.keys(o.off || {}) },
      line: n, who: who || null, said: strip(said), marks: (tags || []).map(function (t) { return t.t; }), page: location.href, at: new Date().toISOString() });
    if (notes.items.length > 400) notes.items.splice(0, notes.items.length - 400);
    SIM.openNotes(stamp);
  }

  // ================================================================ THE DRIVER (dev/bench16.js playK, with the player's hands)
  function topK() { var s = D.top(); if (s && s.baking) { s.baking = false; s.enter(); } if (s && s.roam) { D.battle = s; SIM.watch(s); } return s; }
  function runOn(B, gen) { var co0 = B.co, box = { done: false }; B.co = (function* () { yield* gen; box.done = true; yield* co0; })(); return box; }
  var nameOf = function (s, w) { if (w && w.narr) return ''; var who = w && w.who; var n = who ? (who.name || (who.unit && who.unit.name) || '') : (s.o && s.o.name) || ''; return strip(n); };
  var heroName = function (h) { return h ? strip(h.name || (h.src && h.src.name) || h.key || h.id || '') : ''; };
  var STOP = { stop: true }; // (a scene left while it waited on a click: its driver ends there -- a new staging never shares the floor with the old one's driver)
  function choose(render) { REC = false; var gen = SIM.gen; return new Promise(function (res) { SIM.resolve = res; if (SIM.auto) setTimeout(function () { if (SIM.resolve === res) SIM.auto.next(); }, 0); render(function (v) { if (SIM.resolve === res) { SIM.resolve = null; $('ask').innerHTML = ''; $('here').innerHTML = ''; res(v); } }); }).then(function (v) { if (v === STOP || gen !== SIM.gen) throw STOP; REC = true; return v; }); } // (the answer's own press runs the scene's code: what it reads is the next line's)
  function optLabel(o) { return o && typeof o === 'object' ? String(o.label != null ? o.label : '') : String(o); }
  // a counter's ask answered as a click does: paged to the answers, the hero flipped to, `k` pressed
  function pressOpt(s, k, hero) {
    if (hero != null && s.flipTo) s.flipTo(hero);
    for (var i = 0; i < 12; i++) {
      var bs = s.buttons(), b = bs.filter(function (q) { return q.go === 'opt' && q.k === k; })[0];
      if (b) { s.press(b); return true; }
      var mb = bs.filter(function (q) { return q.go === 'more' || q.go === 'next'; })[0]; if (!mb) break; s.press(mb);
    }
    return false;
  }
  async function counterStep(s) {
    var w = s.wait || {};
    if (w.say) {
      var b = SIM.flush(), who = nameOf(s, w), kind = w.narr ? 'narr' : w.look ? 'look' : 'say';
      [].concat(w.say).forEach(function (l, i) { if (strip(l).trim()) addLine(kind, i ? '' : (w.look ? who + ' (a look)' : who), strip(l), marks(l, who, i ? null : b)); });
      for (var i = 0; i < 30 && s.wait === w && !s.done; i++) { var bs = s.buttons(), nx = bs.filter(function (q) { return q.go === 'next' || q.go === 'more'; })[0] || bs[0]; if (!nx) { s.step(); break; } s.press(nx); }
      if (s.wait === w && !s.done) s.step();
      return;
    }
    if (w.ask) {
      var b2 = SIM.flush(), who2 = nameOf(s, w), f = w.flip;
      var prompt = [].concat(w.ask).map(strip).filter(function (l) { return l.trim(); });
      prompt.forEach(function (l, i) { addLine('say', i ? '' : who2, l, marks(l, who2, i ? null : b2)); });
      var pick = await choose(function (done) {
        var box = document.createElement('div'); box.className = 'askBox';
        if (f) {
          var at = f.at, draw = function () {
            var e = f.list[at], hs = f.list.map(function (x, i) { return '<button data-h="' + i + '" class="' + (i === at ? 'on' : '') + '">' + esc(heroName(x.hero) || x.key) + '</button>'; }).join('');
            box.innerHTML = '<div class="q">THE FLIP: each of the four has their own answers and their own silent read. Click a name to flip.</div><div class="heroes">' + hs + '</div>' +
              ((e.reads || []).length ? '<div class="reads">' + e.reads.map(function (r) { return esc(strip(r)) + ' <span class="tag series">' + esc(seriesOf(r) || 'a silent read') + '</span>'; }).join('<br>') + '</div>' : '') +
              '<div class="opts">' + (e.opts || []).map(function (o, j) { var l = optLabel(o), sk = (C.FLIP && C.FLIP.said && C.FLIP.said.exec(l)) || null, id = (e.ids || [])[j]; return '<button class="opt" data-j="' + j + '">' + esc(C.flipSaid ? C.flipSaid(l) : l) + (id ? ' <span class="tag">' + esc(id) + '</span>' : '') + (sk ? '<span class="sk">' + esc(sk[1]) + ' (shaded)</span>' : '') + '</button>'; }).join('') + '</div>';
            Array.prototype.forEach.call(box.querySelectorAll('[data-h]'), function (x) { x.onclick = function () { at = +x.getAttribute('data-h'); draw(); }; });
            Array.prototype.forEach.call(box.querySelectorAll('[data-j]'), function (x) { x.onclick = function () { done({ hero: at, k: +x.getAttribute('data-j') }); }; });
          };
          draw();
        } else {
          box.innerHTML = '<div class="q">' + esc(s.hero ? heroName(s.hero) + ' answers:' : 'choose:') + '</div><div class="opts">' + (w.opts || []).map(function (o, j) { var off = o && typeof o === 'object' && o.off; return '<button class="opt' + (off ? ' off' : '') + '" data-j="' + j + '">' + esc(strip(optLabel(o))) + '</button>'; }).join('') + '</div>';
          Array.prototype.forEach.call(box.querySelectorAll('[data-j]'), function (x) { x.onclick = function () { done({ k: +x.getAttribute('data-j') }); }; });
        }
        $('ask').appendChild(box); box.scrollIntoView({ block: 'nearest' });
      });
      if (!pick || SIM.stop) return;
      if (f) {
        var e = f.list[pick.hero], l = optLabel(e.opts[pick.k]), id = (e.ids || [])[pick.k], hn = heroName(e.hero) || e.key;
        addLine('pick', hn, C.flipSaid ? C.flipSaid(strip(l)) : strip(l), marks(l, hn, null, { hero: true, extra: (id ? [{ c: 'who', t: 'answer ' + id }] : []) }));
        pressOpt(s, pick.k, pick.hero);
      } else {
        var l2 = strip(optLabel(w.opts[pick.k]));
        addLine('pick', s.hero ? heroName(s.hero) : '>', l2, s.hero ? marks(l2, heroName(s.hero), null, { hero: true }) : []);
        pressOpt(s, pick.k, null);
      }
      return;
    }
    if (w.shelves || s.shop) { await shelves(s); return; }
    s.step();
  }
  // a counter's shelves (THE SHELVES: buy and sell): every button it draws, a click each, its words read after
  async function shelves(s) { // (the counter's own buttons, as it draws them: BUY, SELL, BACK, a row each, and SELL IT?'s SELL / BACK -- js/counter.js Counter.buttons)
    var msg0 = s.msg, bs = s.buttons().filter(function (b) { return b.label; }), sub = s.sub;
    var pick = await choose(function (done) {
      var box = document.createElement('div'); box.className = 'askBox';
      box.innerHTML = '<div class="q">THE SHELVES -- ' + esc(sub ? (sub.sell ? 'SELL IT? ' : 'BUY: ') + strip((DS.DATA.items[sub.id] || {}).name || sub.id) + ' for ' + sub.price + ' sp' : (s.tab || 'buy').toUpperCase()) + (s.msg ? ' · ' + esc(strip(s.msg)) : '') + '</div><div class="opts">' +
        bs.map(function (b, i) { return '<button class="opt' + (b.off ? ' off' : '') + (b.on ? ' gold' : '') + '" data-i="' + i + '">' + (b.go === 'row' ? esc(strip(b.label)) + ' <span class="sk">' + esc(b.right || '') + '</span>' : '[' + esc(strip(b.label)) + ']') + '</button>'; }).join('') + '</div>';
      Array.prototype.forEach.call(box.querySelectorAll('[data-i]'), function (x) { x.onclick = function () { done(+x.getAttribute('data-i')); }; });
      $('ask').appendChild(box); box.scrollIntoView({ block: 'nearest' });
    });
    var b = bs[pick]; SIM.flush();
    addLine('pick', '>', strip(b.label) + (b.right ? '  (' + b.right + ')' : ''), []);
    s.press(b);
    var bk = SIM.flush();
    if (s.msg && s.msg !== msg0) addLine('say', nameOf(s, null), strip(s.msg), marks(s.msg, nameOf(s, null), bk));
  }
  function trigsHere(B) {
    var tr = ((R.def && R.def.src8 && R.def.src8.triggers) || []).slice(), t = B.roam.token, units = B.units || [];
    var out = [];
    tr.forEach(function (g) {
      if (!g.rect) return; var who = null;
      if (g.town === 'talk' || /^talk:/.test(g.id || '')) { var u = units.filter(function (x) { return x.npc && (x.npc === g.npc || 'talk:' + x.npc === g.id) && !x.dead && x.hp !== 0; })[0]; if (!u) return; who = strip(u.name || g.npc || g.id); }
      else if (/^(keeper|shop|inn|chapel|leech|warp|vault|hex)\b/.test(String(g.town || '')) || /^(keeper|shop|inn|chapel|leech|warp|vault|hex):/.test(g.id || '')) { var dn = D.town && D.town.doorName ? D.town.doorName(g.id) : null; who = strip((g.name || dn || g.id)) + (/^(warp|vault|hex):/.test(g.id || '') || g.town === 'warp' ? ' (the door)' : ''); }
      else return;
      var d = Math.max(Math.abs(g.rect[0] - t.x), Math.abs(g.rect[1] - t.y));
      out.push({ g: g, who: who, d: d, door: !(g.town === 'talk' || /^talk:/.test(g.id || '')) });
    });
    out.sort(function (a, b) { return a.d - b.d; });
    var seen = {}; return out.filter(function (p) { if (seen[p.who]) return false; seen[p.who] = 1; return true; }); // (a counter is a row of squares: its keeper once, the nearest)
  }
  function fire(B, g) {
    var sq = [g.rect[0], g.rect[1]], t = B.roam.token;
    SIM.flush();
    return runOn(B, (function* () { var p = t.x === sq[0] && t.y === sq[1] ? [] : R.walkRoute(t, sq); if (p) { if (yield* R.walkTo(B, sq)) yield* R.fire(B, g, sq); } else if (yield* R.walkBeside(B, sq)) yield* R.fire(B, g, sq); })());
  }
  function usable(B) { var inv = B.inv || []; return inv.filter(function (s) { var it = DS.DATA.items[s.id]; return s.n > 0 && it && it.use && it.use.field; }); }
  async function idle(B) { // the floor quiet: whoever is here to talk to, the pack's things to use
    var people = trigsHere(B), uses = usable(B);
    var pick = await choose(function (done) {
      var box = document.createElement('div'); box.className = 'card';
      box.innerHTML = '<h3>WHO IS HERE</h3><div class="opts">' + people.slice(0, 40).map(function (p, i) { return '<button class="opt" data-p="' + i + '">E: ' + esc(p.who) + ' <span class="sk">' + p.d + ' sq</span></button>'; }).join('') + '</div>' +
        (uses.length ? '<h3 style="margin-top:8px">THE PACK</h3><div class="opts">' + uses.map(function (u, i) { return '<button class="opt" data-u="' + i + '">USE ' + esc(DS.DATA.items[u.id].name) + ' x' + u.n + '</button>'; }).join('') + '</div>' : '') +
        '<div class="bar"><button id="endScene">THE FRONT PAGE</button><button id="againScene" class="gold">STAGE IT AGAIN</button></div>';
      Array.prototype.forEach.call(box.querySelectorAll('[data-p]'), function (x) { x.onclick = function () { done({ talk: people[+x.getAttribute('data-p')] }); }; });
      Array.prototype.forEach.call(box.querySelectorAll('[data-u]'), function (x) { x.onclick = function () { done({ use: uses[+x.getAttribute('data-u')].id }); }; });
      box.querySelector('#endScene').onclick = function () { location.hash = ''; };
      box.querySelector('#againScene').onclick = function () { SIM.play(CUR.e, CUR.o); };
      $('here').appendChild(box);
    });
    if (!pick || SIM.stop) return false;
    if (pick.talk) { sys('E on ' + pick.talk.who + (pick.talk.d > 1 ? ' (walked to)' : '')); fire(B, pick.talk.g); return true; }
    if (pick.use) { useItem(B, pick.use); return true; }
    return false;
  }
  function useItem(B, id) {
    SIM.flush(); REC = true; var ls;
    try { ls = H.fieldOnFloor ? H.fieldOnFloor(B, 'item', { id: id }, function (h) { return (B.roam.members || []).filter(function (u) { return u.src === h; })[0] || null; }) : null; } finally { REC = false; }
    var b = SIM.flush(); sys('USE ' + DS.DATA.items[id].name + ' (from the pack)');
    [].concat(ls || ['(nothing to do with it here)']).forEach(function (l, i) { addLine('narr', '', strip(l), marks(l, '', i ? null : b)); });
  }
  function wake(m) { var ls = []; for (var k = 0; k < 24 && !m.over; k++) { if (m.phase === 'night') m.next(); else if (m.phase === 'dawn') { ls = m.dawnLines ? m.dawnLines() : []; m.next(); } else if (m.phase === 'picks') { (m.due || []).forEach(DS.R.autoPicks); if (m.pm) m.pm.close(); m.update(); } else if (m.cancel) m.cancel(); else break; } return ls.filter(Boolean).map(strip); }
  SIM.drive = async function (o) {
    o = o || {}; var v, quiet = 0, busyN = 0, cards = {}, cur = null, fired = !o.talk, used = !o.use, k = 0, gen = SIM.gen;
    while (!SIM.stop && gen === SIM.gen) {
      if (++k % 400 === 0) { await new Promise(function (r) { setTimeout(r, 0); }); if (gen !== SIM.gen) return; } // (the page breathes on a long walk)
      var s = topK(); if (!s) { sys('-- the scene is over: no screen left --'); break; }
      REC = true;
      try {
        if (s instanceof C.Counter) { quiet = 0; if (o.pending) { fired = true; o.pending = false; } if (s.done) { D.pop(); continue; } await counterStep(s); continue; }
        if (H.Morning && s instanceof H.Morning) { quiet = 0; var b = SIM.flush(), ls = wake(s); ls.forEach(function (l, i) { addLine('narr', i ? '' : 'MORNING', l, marks(l, '', i ? null : b)); }); continue; }
        if (s.kind === 'housewatches') { quiet = 0; Object.keys(s.asg || {}).forEach(function (id) { s.asg[id] = 1; }); sys('the watches: set as the game sets them, and begun'); s.go('begin'); continue; }
        if (s.kind === 'houseslots') { sys('(a SAVE screen: shut -- the simulator saves nothing)'); D.pop(); continue; }
        if (D.Battle && s instanceof D.Battle && !s.roam) {
          REC = false; var fid = (s.fight && (s.fight.name || s.fight.id)) || 'a fight';
          var res = await choose(function (done) { var box = document.createElement('div'); box.className = 'askBox'; box.innerHTML = '<div class="q">A FIGHT: ' + esc(strip(fid)) + ' -- the simulator plays no fights. How did it end?</div><div class="opts"><button class="opt" data-r="won">WON</button><button class="opt" data-r="lost">LOST</button></div>'; Array.prototype.forEach.call(box.querySelectorAll('[data-r]'), function (x) { x.onclick = function () { done(x.getAttribute('data-r')); }; }); $('ask').appendChild(box); });
          if (!res) break; sys('the fight: ' + res); if (D.top() === s) D.pop(); if (s.o && s.o.onDone) s.o.onDone(res); continue;
        }
        if (W && W.scene && s === W.scene) {
          var cd = (s.cards || [])[0];
          if (!cd) { sys('-- on THE WORLD: the scene has played out --'); break; }
          var bw = SIM.flush(); (cd.lines || []).forEach(function (l, i) { addLine('card', i ? '' : 'THE WORLD', strip(l), marks(l, '', i ? null : bw)); });
          var keys = (cd.keys || []).filter(function (x) { return !x[3]; });
          if (!keys.length) { s.cards.shift(); if (cd.then) cd.then(); continue; }
          REC = false; var kk = await choose(function (done) { var box = document.createElement('div'); box.className = 'askBox'; box.innerHTML = '<div class="opts">' + keys.map(function (x, i) { return '<button class="opt" data-i="' + i + '">' + esc(strip(x[2] || '?')) + '</button>'; }).join('') + '</div>'; Array.prototype.forEach.call(box.querySelectorAll('[data-i]'), function (x) { x.onclick = function () { done(+x.getAttribute('data-i')); }; }); $('ask').appendChild(box); });
          if (kk == null) break; addLine('pick', '>', strip(keys[kk][2] || ''), []); if (s.cards[0] === cd) s.cards.shift(); keys[kk][1](); continue;
        }
        if (s.roam) {
          if (s !== cur) { cur = s; quiet = 0; sys('on ' + strip((R.def && R.def.name) || R.def.key) + (R.def.sub ? ' (' + strip(R.def.sub) + ')' : '') + ' · ' + s.roam.token.x + ',' + s.roam.token.y); }
          (s.cards || []).forEach(function (c) { var key = c.t0 + ':' + (c.lines || []).join('|'); if (!cards[key]) { cards[key] = 1; SIM.flush(); var txt = strip((c.lines || []).join(' ')).replace(/\s+/g, ' ').trim(); if (txt) addLine('card', 'a card', txt, marks(txt, '', null, { card: true })); } });
          var st = s.co.next(v); v = undefined;
          if (st.done) { if (D.top() !== s) continue; sys('-- the floor\'s script ended --'); break; }
          if (st.value && st.value.prompt) {
            quiet = 0; REC = false; var p = st.value.prompt, bp = SIM.flush(), title = strip(p.title || '');
            [].concat(p.lines || []).forEach(function (l, i) { addLine('say', i ? '' : (title || 'a prompt'), strip(l), marks(l, title, i ? null : bp)); });
            var lb = (p.opts || []).map(function (x) { return strip(x.label); });
            var ch = await choose(function (done) { var box = document.createElement('div'); box.className = 'askBox'; box.innerHTML = '<div class="q">' + esc(title) + '</div><div class="opts">' + lb.map(function (l, i) { return '<button class="opt' + (p.opts[i].off ? ' off' : '') + '" data-i="' + i + '">' + esc(l) + '</button>'; }).join('') + '</div>'; Array.prototype.forEach.call(box.querySelectorAll('[data-i]'), function (x) { x.onclick = function () { done(+x.getAttribute('data-i')); }; }); $('ask').appendChild(box); box.scrollIntoView({ block: 'nearest' }); });
            if (ch == null) break; addLine('pick', '>', lb[ch], []); v = p.opts[ch].value; continue;
          }
          var mine = [s.roam.token].concat(s.roam.members || []), busy = (s.cards || []).some(function (c) { return s.t < c.t0 + (c.life || 300); }) || mine.some(function (u) { return u && u.tween && (u.tween.t || 0) < (u.tween.dur || 0); }); // (the party walking or a card up: a scene playing -- the town's own folk walk all day, and are no scene)
          if (busy && ++busyN > 600) busy = false; else if (!busy) busyN = 0; // (a turn-to-face the floor's own frame would finish, and nothing here steps: not a scene playing past 600 steps)
          if (typeof st.value === 'number') { s.t += Math.max(1, st.value); if (!busy) quiet++; } else if (!st.value) { if (!busy) quiet++; } else quiet = 0;
          if (quiet >= 120) {
            quiet = 0; REC = false;
            if (!fired && o.talk === '@near') { fired = true; var nr = trigsHere(s).filter(function (p) { return p.d <= 1 && !p.door; }); if (nr.length === 1) { sys('E on ' + nr[0].who + ' (the one the stage stood you beside)'); fire(s, nr[0].g); continue; } }
            if (!fired) { // (the scene's own talk; through a door first, then the talk on the floor beyond it -- Winters' counter, in at his door): done once a screen of words has come up
              var want = String(o.talk).split('|'), tried = (o.tried = o.tried || []), tgs = trigsHere(s).filter(function (p) { return want.some(function (w) { return p.g.npc === w || p.g.id === w || p.g.id === 'talk:' + w || String(p.g.id).indexOf(':' + w) > 0 || (w.indexOf(':') > 0 && String(p.g.id).indexOf(w.split(':')[1]) >= 0); }) && !tried.some(function (t) { return t[0] === s && t[1] === p.g; }); });
              var tg = tgs.filter(function (p) { return !p.door; })[0] || tgs[0];
              if (tg) { tried.push([s, tg.g]); o.pending = true; sys('E on ' + tg.who + ' (the scene\'s own talk)'); fire(s, tg.g); continue; }
              fired = true; if (!o.pending) sys('(' + o.talk + ' is not standing here on this stage)');
            }
            if (!used) { used = true; if ((s.inv || []).some(function (x) { return x.id === o.use && x.n > 0; })) { useItem(s, o.use); continue; } sys('(no ' + o.use + ' in the pack on this stage)'); }
            if (!(await idle(s))) break; continue;
          }
          continue;
        }
        sys('(a ' + (s.kind || (s.constructor && s.constructor.name) || '?') + ' screen: left)'); D.pop();
      } catch (err) { REC = false; if (err === STOP) return; addLine('sys', '', 'the scene broke: ' + (err && err.message) + ' -- ' + String(err && err.stack || '').split('\n').slice(1, 3).join(' '), []).className = 'ln sys err'; console.error(err); break; }
      finally { REC = false; }
    }
    if (gen === SIM.gen && !$('here').innerHTML) { // (the scene played out: the way back, or the same stage again)
      var eb = document.createElement('div'); eb.className = 'bar'; eb.innerHTML = '<button id="endScene2">THE FRONT PAGE</button><button id="againScene2" class="gold">STAGE IT AGAIN</button>';
      $('here').appendChild(eb); eb.querySelector('#endScene2').onclick = function () { location.hash = ''; }; eb.querySelector('#againScene2').onclick = function () { SIM.play(CUR.e, CUR.o); };
    }
  };

  // ================================================================ OPEN A SCENE
  SIM.play = function (e, o) {
    CUR = { e: e, o: o }; drawStage();
    $('log').innerHTML = ''; $('ask').innerHTML = ''; $('here').innerHTML = ''; LINE = 0; SIM.flush();
    $('sceneTitle').textContent = e.title; $('sceneSub').textContent = e.why || '';
    var how;
    try { REC = false; how = stage(e, o); } catch (err) { sys('could not stage it: ' + err.message); console.error(err); return Promise.resolve(); }
    if (o.renown != null) { if (H.playing && H.cur) H.cur.renown = o.renown; else C.testRenown = o.renown; } // (his renown laid after the staging: a beat's play may set its own once the NEW GAME is made)
    try { o.had = C.renownOf ? C.renownOf() : o.renown; } catch (e2) { o.had = o.renown; } drawStage();
    sys('staged: ' + how + ' · renown ' + o.had + (o.renown == null ? ' (the stage\'s own)' : '') + ' · level ' + (o.lvl || 3) + (o.lead ? ' · ' + o.lead + ' leads' : ''));
    SIM.flush();
    return SIM.drive({ talk: e.talk || autoTalk(e), use: e.use }).then(function () { }, function (err) { if (err !== STOP) sys('the scene broke: ' + (err && err.message)); });
  };
  function autoTalk(e) { // a supper beat or a beat stood beside someone: E on the inn lady, as each beat's note says (E on the inn lady / the traveler / Elsbeth / him)
    var st = e.stage || {}, bt = st.show ? beatOf(st.show, st.beat) : null, n = String((bt && bt.note) || '');
    if (st.show === 'inn' && SUPPERS[st.beat]) return 'gennet'; // (every supper is had of the inn lady: a room, then the table)
    if (st.show === 'inn' && /^barn/.test(st.beat)) return 'barnGoblin';
    if (st.show === 'inn') { var m = /E on (the inn lady|the traveler|Elsbeth|Doran|the girl|him|her|the runner|it)/.exec(n); if (m) return { 'the inn lady': 'gennet', 'the traveler': 'katarina', Elsbeth: 'elsbeth', Doran: 'doranYard|doranIn', 'the girl': 'adoptedKid', 'the runner': 'snootRunner', it: 'barnGoblin', him: 'snootRunner' }[m[1]] || null; }
    if (bt && bt.near) return bt.near;
    if (bt && bt.door) return bt.door; // (a beat stood at a door: in at it, and the counter or the keeper beyond -- Cassia's rooms, Aldwin's floor, Davos, Hessle's board)
    return '@near'; // (else whoever the stage stood the party beside, if one alone: a beat stands the party facing who it is about)
  }
  function route() {
    var id = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    var e = id && SIM.byId[id];
    $('front').classList.toggle('hidden', !!e); $('player').classList.toggle('hidden', !e); $('toFront').classList.toggle('hidden', !e);
    if (!e) { clean(); front(); window.scrollTo(0, 0); return; }
    var b = baseOf(e); SIM.play(e, Object.assign({}, b, { flags: Object.assign({}, b.flags), flagsWas: Object.assign({}, b.flags) }));
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ================================================================ THE PROBE (deep16/scenes.html?probe: dev/scenes-probe.py opens it headless) -- each REVIEW row and a scene of each
  // kind played by a hand of its own: its `picks` clicked in order (a button's words, or 'Hero:answer-id' on the flip; 'E:<name>' for whoever is here), till the
  // picks run out; then what was said is checked: `expect` in the words, `mark` among the marks. ?probe=all stages every scene on the front page to its first choice
  SIM.PROBES = [
    { id: 'r-nell', picks: ['Lymen:name'], expect: 'Nell' },
    { id: 'r-elsbeth', picks: [], expect: 'does not turn round', mark: 'inn\\.js:' },
    { id: 'r-gennet', picks: [], expect: 'taken the little ones home' },
    { id: 'r-doran', picks: [], expect: 'GreyFang\'s house at the Pit took them', mark: 'Doran\'s first supper home, line 1 of 2' },
    { id: 'r-pages', picks: [], expect: 'comes apart at its stitching' },
    { id: 'r-ring', picks: ['THE SHELVES', '[SELL]', 'Water Walking'], expect: 'Not that one\\. Keep it', mark: 'WINTERS_KEEP' },
    { id: 'r-renown', picks: ['Gate hand'], mark: 'renown 3 \\(.*\\), greeting 1 of 2' },
    { id: 'r-doranhome', picks: ['LONG REST'], expect: 'GreyFang\'s house', mark: 'Doran\'s first supper home' },
    { id: 'inn-room', picks: ['LONG REST', 'Lymen:council', 'Aurdin:news'], mark: 'gossip: the moot, word 1 of 2', expect: 'What brings you down the road' },
    { id: 'inn-meal14', picks: ['LONG REST', 'Lymen:council', 'Lymen:news'], mark: 'gossip: the gnolls since \\(the Snoot at the Pit its last\\), word 4 of 4' },
    { id: 'hours-council1', picks: [], mark: 'the council: notice, line 1 of' },
    { id: 'inn-barnunseen', picks: [], expect: '.' },
    { id: 'inn-katvisit', picks: [], expect: '.' }
  ];
  function autoHand(queue, end) {
    return { next: function () {
      var spec = queue.shift(); if (spec == null) { end('picks done'); return; }
      var opts = function () { return Array.prototype.slice.call(document.querySelectorAll('#ask .opt, #here .opt')); };
      var hit = null, m = /^([A-Z][a-z]+|any):([a-zA-Z0-9_]+)$/.exec(spec);
      if (m && m[1] === 'any' && document.querySelector('#ask .heroes')) { // ('any:news': whichever of the four has that answer this opening)
        var hs = Array.prototype.slice.call(document.querySelectorAll('#ask .heroes button')).map(function (x) { return x.textContent; });
        hs.some(function (h) { var b0 = Array.prototype.slice.call(document.querySelectorAll('#ask .heroes button')).filter(function (x) { return x.textContent === h; })[0]; if (b0) b0.click(); hit = opts().filter(function (x) { var t = x.querySelector('.tag'); return t && t.textContent === m[2]; })[0]; return !!hit; });
      } else if (m && document.querySelector('#ask .heroes')) {
        var hb = Array.prototype.slice.call(document.querySelectorAll('#ask .heroes button')).filter(function (x) { return x.textContent === m[1]; })[0]; if (hb) hb.click();
        hit = opts().filter(function (x) { var t = x.querySelector('.tag'); return t && t.textContent === m[2]; })[0];
      } else hit = opts().filter(function (x) { return x.textContent.toUpperCase().indexOf(spec.toUpperCase()) >= 0; })[0];
      if (hit) hit.click(); else end('no ' + spec + ' among: ' + opts().map(function (x) { return x.textContent.slice(0, 30); }).join(' | '));
    } };
  }
  SIM.probe = async function (all) {
    var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); }, out = [];
    $('front').classList.add('hidden'); $('player').classList.remove('hidden');
    var list = all ? SIM.entries.map(function (e) { return { id: e.id, picks: [] }; }) : SIM.PROBES;
    for (var i = 0; i < list.length; i++) {
      var p = list[i], e = SIM.byId[p.id]; if (!e) { out.push({ id: p.id, ok: false, why: 'no such scene on the front page' }); continue; }
      var endR, ended = new Promise(function (r) { endR = r; });
      SIM.auto = autoHand((p.picks || []).slice(), endR);
      var b = baseOf(e), how = await Promise.race([SIM.play(e, Object.assign({}, b, { flags: Object.assign({}, b.flags) })).then(function () { return 'played out'; }), ended, sleep(all ? 9000 : 20000).then(function () { return 'timeout'; })]);
      var lns = Array.prototype.slice.call(document.querySelectorAll('#log .ln')), said = lns.filter(function (d) { return !d.classList.contains('sys'); });
      var text = said.map(function (d) { return (d.querySelector('.said') || {}).textContent || ''; }).join('\n'), tags = Array.prototype.slice.call(document.querySelectorAll('#log .tag')).map(function (t) { return t.textContent; });
      var r = { id: p.id, end: how, lines: said.length, broke: lns.some(function (d) { return /the scene broke|could not stage/.test(d.textContent); }), first: said.filter(function (d) { return !d.classList.contains('card'); }).slice(0, 2).map(function (d) { return d.textContent.slice(0, 120); }) };
      if (p.expect) r.expect = new RegExp(p.expect).test(text);
      if (p.mark) r.mark = tags.some(function (t) { return new RegExp(p.mark).test(t); });
      r.ok = !r.broke && r.lines > 0 && how !== 'timeout' && r.expect !== false && r.mark !== false && !/^no /.test(how);
      out.push(r);
    }
    SIM.auto = null; clean();
    var realKeys = []; for (var j = 0; ; j++) { var k = window.SCENES_STORE.real.key.call(window.localStorage, j); if (k == null) break; realKeys.push(k); }
    var res = { scenes: SIM.entries.length, code: CODE.length, series: Object.keys(SERIES).length, loadErrors: (window.SCENES_LOADERR || []).slice(0, 5), all: !!all, runs: out,
      storage: { browser: realKeys, gameKeysOutside: realKeys.filter(function (k) { return !window.SCENES_STORE.mine.test(k); }) }, unreached: SIM.unreached };
    var pre = document.createElement('pre'); pre.id = 'scenes-probe'; pre.textContent = 'SCENES ' + JSON.stringify(res); document.body.appendChild(pre);
    return res;
  };

  // ================================================================ BOOT
  instrument(); buildSeries(); catalog();
  statusEl.textContent = 'reading the scene files…';
  buildCode().then(function () {
    statusEl.textContent = 'the game\'s own scripts: ' + window.SCENES_SCRIPTS + ' loaded' + ((window.SCENES_LOADERR || []).length ? ', ' + window.SCENES_LOADERR.length + ' errors' : '') + ' · ' + SIM.entries.length + ' scenes · ' + CODE.length + ' lines of the code indexed · saves nothing';
    var pq = /[?&]probe(=all)?\b/.exec(location.search);
    if (pq) { SIM.probe(!!pq[1]); return; }
    route();
  });
  SIM.CODE = CODE; SIM.SERIES = SERIES; SIM.codeOf = codeOf; SIM.seriesOf = seriesOf;
})();
