/* DRAGONSLEEP — title, lead select, field menu, shops, inn, save slots, game over, credits. */
'use strict';
(function () {
  var DS = window.DS, R = DS.R, I = DS.input, W8 = DS.W8;
  var SAVE_KEY = 'ds8-save-';

  // ------------------------------------------------------------------ saves
  DS.saveGame = function (slot) {
    var G = DS.G;
    var data = JSON.parse(JSON.stringify({ v: G.v, lead: G.lead, party: G.party, inv: G.inv, silver: G.silver, flags: G.flags, renown: G.renown, map: G.map, x: G.x, y: G.y, dir: G.dir, steps: G.steps, time: G.time, kills: G.kills, hired: G.hired, guests: G.guests || [] }));
    data.saved = Date.now();
    return DS.store.set(SAVE_KEY + slot, data);
  };
  DS.loadSlot = function (slot) { return DS.store.get(SAVE_KEY + slot); };
  // the slots this game came from and went to (09-30, Griz: "color the save spot loaded from and have it be the slot select by default
  // when the 'save where' opens"; 10-01b, a load from 2 and a save to 3 marks 3: "correct, and if we're fancy they'd be similar color with
  // the older one just slightly darker"): the newest -- loaded from or saved to -- gold, the one before it a darker gold, the cursor on the
  // newest; a NEW GAME has none. Kept in the tab's sessionStorage, not the save, so the marks ride the trip past the door (deep16/ and back
  // is a page load) and go with the tab
  var SLOTS_KEY = 'ds8-slots', SLOT_GOLD = ['#F8D878', '#B89848'];
  DS.slotsUsed = function () { try { return JSON.parse(sessionStorage.getItem(SLOTS_KEY)) || []; } catch (e) { return []; } };
  DS.slotUsed = function (n) {
    var s = n ? [n].concat(DS.slotsUsed().filter(function (x) { return x !== n; })).slice(0, 2) : [];
    try { if (s.length) sessionStorage.setItem(SLOTS_KEY, JSON.stringify(s)); else sessionStorage.removeItem(SLOTS_KEY); } catch (e) {}
  };
  // the save's version and its file (09-30, Griz: "6 - yes" to a real save version and a file export before the next expansion; 10-01b,
  // where: "2 continue screen"). A save says which version of the game wrote it (v). One from before is brought up to date as it loads --
  // every field a fresh game has and the save lacks takes the fresh game's value, then MIGRATE's steps run in order -- so an expansion
  // that adds to the state never breaks a save made before it. One newer than this page (a cached page, an old tab) is refused, not half-read
  DS.SAVE_V = 1;
  var MIGRATE = {}; // MIGRATE[n](d): a save at version n brought to n + 1 (a renamed flag, a moved field); none yet
  DS.migrateSave = function (d) {
    if (!d || !d.party || !d.party.length) return 'not a save';
    var v = d.v || 1;
    if (v > DS.SAVE_V) return 'made by a newer version of the game: reload the page';
    var fresh = DS.freshState(d.lead || d.party[0].id);
    Object.keys(fresh).forEach(function (k) { if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(fresh[k])); });
    for (; v < DS.SAVE_V; v++) if (MIGRATE[v]) MIGRATE[v](d);
    d.v = DS.SAVE_V;
    // (10-03, the review's floor under the player: a save that names an item or a map this page does not have -- an item since renamed or cut, a save from a newer
    // build on a cached page -- is brought to ones it has, and the console says what was dropped; it must not break the ITEM menu or black the screen after the scenes are cleared)
    var items = DS.DATA.items;
    if (Array.isArray(d.inv)) d.inv = d.inv.filter(function (s) { var ok = !!(s && items[s.id]); if (!ok) console.warn('save: dropped unknown item ' + (s && s.id) + ' from the pack'); return ok; });
    [d.party, (d.guests || []).map(function (x) { return x && x.h; })].forEach(function (list) {
      (list || []).forEach(function (h) {
        if (!h || !h.equip) return;
        Object.keys(h.equip).forEach(function (k) { // (an item slot holds an id; the torch's slot holds a 1, a light in the hand, and is left alone)
          var id = h.equip[k];
          if (typeof id === 'string' && id && !items[id]) { console.warn('save: ' + (h.name || h.id) + "'s " + k + ' named unknown item ' + id + ': emptied'); h.equip[k] = null; }
        });
      });
    });
    // the map: one this page has not got goes in at the way a new game opens (config.start, Silverton's square) rather than throw in Field.load after the scenes are
    // cleared. The save keeps no place of its own to fall back on, and the start is the one the data names -- no place invented here
    if (!DS.DATA.maps[d.map]) {
      var st = DS.DATA.config.start;
      console.warn('save: unknown map ' + d.map + ' at ' + d.x + ',' + d.y + ': back to ' + st.map + ' ' + st.x + ',' + st.y);
      d.map = st.map; d.x = st.x; d.y = st.y; d.dir = st.dir;
    }
    return '';
  };
  // the file: the three slots and the grid's own keeping (the ladder's rungs, the climb, the camps) -- the whole game this browser holds,
  // in one file, so a cleared browser or another device loses nothing (the saves live in one browser's localStorage: js/core.js DS.store)
  var FILE_KEYS = /^(ds8-save-[123]|deep16\.(ladder|climb|camp)[\w.-]*)$/;
  function gameKeys() { var out = {}; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (FILE_KEYS.test(k)) out[k] = JSON.parse(localStorage.getItem(k)); } } catch (e) { } return out; }
  function filed(keys) { var n = keys.filter(function (k) { return /^ds8-save-/.test(k); }).length, g = keys.length > n; return (n ? n + ' slot' + (n === 1 ? '' : 's') : '') + (n && g ? ' and ' : '') + (g ? 'the ladder' : ''); }
  DS.exportSaves = function () {
    var keys = gameKeys(), ks = Object.keys(keys);
    if (!ks.length) return 'Nothing saved yet.';
    var file = { game: 'DRAGONSLEEP', kind: 'saves', v: DS.SAVE_V, at: new Date().toISOString(), keys: keys };
    try {
      var url = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: 'application/json' })), a = document.createElement('a');
      a.href = url; a.download = 'dragonsleep-saves-' + file.at.slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    } catch (e) { return 'Could not write the file.'; }
    return 'To a file: ' + filed(ks) + '.';
  };
  // pick a file (the browser's own picker); done(why) on a bad one, done('', file, keys) on a good one -- nothing is written yet
  DS.importSaves = function (done) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var file = null; try { file = JSON.parse(rd.result); } catch (e) { }
        if (!file || file.game !== 'DRAGONSLEEP' || !file.keys) return done('That file is not a DRAGONSLEEP save.');
        if ((file.v || 1) > DS.SAVE_V) return done('A newer game made that file: reload the page.');
        var keys = Object.keys(file.keys).filter(function (k) { return FILE_KEYS.test(k); });
        if (!keys.length) return done('Nothing in that file to bring in.');
        done('', file, keys);
      };
      rd.readAsText(f);
    };
    inp.click();
  };
  DS.startFrom = function (data) {
    DS.migrateSave(data); // (an older save filled out to this version's state)
    DS.G = data; DS.bindState(DS.G);
    DS.G.party.forEach(R.migrate);
    DS.clearScenes();
    var F = DS.field = new DS.Field();
    DS.push(F);
    // (10-06, the 8-bit battle lane §2.4, the floor's last holes: a map that throws as it loads -- its enter hook, a flag tile, a bad row -- must not leave the
    // screen black with the scenes cleared. The console says so, the party goes in at the way a new game opens (config.start, as migrateSave does for a map
    // this page has not got) and is told; a start that throws too goes back to the title. A square off its own map or on one no body stands on is the nearest
    // one that is: Field.footing)
    try { F.load(data.map, data.x, data.y, data.dir); }
    catch (e) {
      var st = DS.DATA.config.start, was = data.map;
      console.error('load: map ' + was + ' threw as it loaded (' + String(e && e.message || e) + '): back to ' + st.map + ' ' + st.x + ',' + st.y, e);
      try { DS.clearScenes(); F = DS.field = new DS.Field(); DS.push(F); F.load(st.map, st.x, st.y, st.dir); }
      catch (e2) { console.error('load: the start threw too (' + String(e2 && e2.message || e2) + '): to the title', e2); DS.clearScenes(); DS.field = null; DS.push(new Title()); return; }
      F.banner = 90;
      DS.run(function* () { yield DS.say('The place you saved in would not open. You go on from ' + (F.map.name || 'the start') + '.'); });
      return;
    }
    var moved = F.footing();
    if (moved) console.warn('save: ' + data.map + ' ' + moved.from.x + ',' + moved.from.y + (moved.from.off ? ' is off the map' : ' is no square to stand on') + ': moved to ' + moved.to.x + ',' + moved.to.y);
    F.banner = 90;
  };
  function fmtTime(frames) { var s = Math.floor(frames / 60), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return h + ':' + ('0' + m).slice(-2); }
  DS.fmtTime = fmtTime;
  function slotItems(saving) {
    var out = [], used = DS.slotsUsed();
    for (var i = 1; i <= 3; i++) {
      var d = DS.loadSlot(i), mk = SLOT_GOLD[used.indexOf(i)]; // (gold: the slot this game last loaded from or saved to; darker: the one before)
      if (d) {
        var lead = d.party[0];
        out.push({ label: 'SLOT ' + i + '  ' + lead.name + ' L' + lead.lvl + '  ' + (DS.DATA.maps[d.map] ? DS.DATA.maps[d.map].name : ''), right: fmtTime(d.time), value: i, color: mk, rightColor: mk });
      } else out.push({ label: 'SLOT ' + i + '  — empty —', value: i, disabled: !saving });
    }
    return out;
  }

  // ------------------------------------------------------------------ Title
  function Title() { this.kind = 'title'; this.opaque = true; this.t = 0; this.stars = []; for (var i = 0; i < 70; i++) this.stars.push([DS.fxInt(256), DS.fxInt(120), DS.fxInt(3)]); this.menu = null; }
  DS.Title = Title;
  Title.prototype.enter = function () { DS.audio.play('title'); DS.fadeLevel = 0; this.buildMenu(); };
  Title.prototype.buildMenu = function () {
    var self = this, any = [1, 2, 3].some(function (i) { return !!DS.loadSlot(i); });
    // 09-29, Griz: "add at least 'combat ladder' (deep16) if not both that and 'playtester ladder' to the 8bit homescreen menu please." The first is the DEEP16 ladder, the combat engine's fifty fights; the second is the tester ladder where the player runs our four. Both leave for deep16/. Six rows are 86 tall, so the frame rides at y 124 and ends at 210, clear of the credit lines at 218.
    this.menu = new DS.Menu({
      // (the Pocket DM, 10-02: a seventh row, so the frame rides at y 112 and still ends at 210)
      items: [{ label: 'NEW GAME', value: 'new' }, { label: 'CONTINUE', value: 'load', color: any ? null : '#C8D0E8' }, /* (open with no saves too: IMPORT SAVES is behind it -- 10-01b) */ { label: 'COMBAT LADDER', value: 'ladder' }, { label: 'PLAYTESTER LADDER', value: 'tester' }, { label: 'POCKET DM (ALPHA)', value: 'pocket' }, { label: 'CREDITS', value: 'credits' }, { label: '♥ SUPPORT THE EXPANSION', value: 'kofi', color: '#F8A4C0' }],
      x: 44, y: 112, w: 168, rowH: 12, cancelable: false,
      onSelect: function (it) {
        if (it.value === 'new') DS.push(new LeadSelect());
        if (it.value === 'load') DS.push(new SlotScene(false));
        if (it.value === 'ladder') location.href = 'deep16/?ladder';
        if (it.value === 'tester') location.href = 'deep16/?ladder&party=ours';
        if (it.value === 'pocket') location.href = 'deep16/?pocket';
        if (it.value === 'credits') DS.push(new Credits());
        if (it.value === 'kofi') DS.openKofi();
      }
    });
  };
  Title.prototype.update = function () { this.t++; this.menu.update(); };
  Title.prototype.draw = function (ctx) {
    drawNightScene(ctx, this.stars, this.t);
    DS.bigText(ctx, 'DRAGONSLEEP', 128, 34, 3);
    DS.textCenter(ctx, 'SILVERTON · THE WARRENS · THE ROAD', 128, 70, '#C8D0E8');
    this.menu.draw(ctx);
    DS.textCenter(ctx, 'a world by GrimGriz', 128, 218, '#9C9C9C');
    DS.textCenter(ctx, 'SRD 5.1 rules · CC BY 4.0', 128, 229, '#6C6C84');
  };
  function drawNightScene(ctx, stars, t) {
    var g = ctx.createLinearGradient(0, 0, 0, 240); g.addColorStop(0, '#04061a'); g.addColorStop(0.55, '#141a44'); g.addColorStop(1, '#1a1030');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 240);
    stars.forEach(function (s, i) { ctx.fillStyle = ((t >> 4) + i) % 7 === 0 ? '#F8F8F8' : ['#6C6C84', '#9C9C9C', '#C8D0E8'][s[2]]; ctx.fillRect(s[0], s[1], 1, 1); });
    // the chain
    ctx.fillStyle = '#0c0c1c';
    ctx.beginPath(); ctx.moveTo(0, 150);
    [[20, 118], [44, 132], [70, 96], [96, 124], [118, 88], [138, 112], [160, 84], [186, 120], [210, 100], [236, 126], [256, 110]].forEach(function (p) { ctx.lineTo(p[0], p[1]); });
    ctx.lineTo(256, 240); ctx.lineTo(0, 240); ctx.fill();
    ctx.fillStyle = '#e8e8f4'; [[118, 88], [160, 84], [70, 96]].forEach(function (p) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] - 5, p[1] + 7); ctx.lineTo(p[0] + 5, p[1] + 7); ctx.fill(); });
    // the Edifice facade and its falls
    ctx.fillStyle = '#20202e'; ctx.fillRect(92, 118, 72, 30);
    ctx.fillStyle = '#2c2c3e'; for (var x = 96; x < 160; x += 12) ctx.fillRect(x, 124, 6, 24);
    ctx.fillStyle = '#3CBCFC'; ctx.fillRect(126, 96, 4, 52);
    ctx.fillStyle = '#A4E4FC'; for (var k = 0; k < 6; k++) ctx.fillRect(127, 96 + ((t / 2 + k * 9) % 52), 1, 3);
    // town lights
    ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 148, 256, 92);
    for (var i = 0; i < 28; i++) { var lx = (i * 37) % 250 + 3, ly = 150 + (i * 13) % 8; ctx.fillStyle = (i + (t >> 5)) % 9 === 0 ? '#FCA044' : '#F8D878'; ctx.fillRect(lx, ly, 1, 1); }
  }
  // big title text: glyphs scaled with a silver sheen
  var bigCache = {};
  DS.bigText = function (ctx, str, xc, y, s) {
    var key = str + '|' + s, c = bigCache[key];
    if (!c) {
      var w = DS.textWidth(str), t = document.createElement('canvas');
      t.width = w + 1; t.height = 8;
      DS.text(t.getContext('2d'), str, 0, 0, '#F8F8F8');
      c = document.createElement('canvas'); c.width = (w + 1) * s + s; c.height = 8 * s + s;
      var x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      // silver: white crown, cool steel below, a dark drop shadow
      var body = document.createElement('canvas'); body.width = t.width * s; body.height = t.height * s;
      var bx = body.getContext('2d'); bx.imageSmoothingEnabled = false;
      bx.drawImage(t, 0, 0, body.width, body.height);
      bx.globalCompositeOperation = 'source-atop';
      bx.fillStyle = '#C8D0F0'; bx.fillRect(0, Math.round(body.height * 0.45), body.width, body.height);
      bx.fillStyle = '#8890C0'; bx.fillRect(0, Math.round(body.height * 0.75), body.width, body.height);
      var sh = document.createElement('canvas'); sh.width = body.width; sh.height = body.height;
      var sx = sh.getContext('2d'); sx.drawImage(body, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#101018'; sx.fillRect(0, 0, sh.width, sh.height);
      x.drawImage(sh, s, s); x.drawImage(body, 0, 0);
      c = bigCache[key] = c;
    }
    ctx.drawImage(c, Math.round(xc - c.width / 2), y);
  };
  DS.openKofi = function () {
    try { window.open(DS.DATA.config.kofi, '_blank', 'noopener'); } catch (e) { }
  };

  // ------------------------------------------------------------------ the round-six start (Griz 09-27, for the re-cut's playtest)
  // "all the char at lvl 4, all quests done but as if they've never gone to the half-way in the whole game, start in Silverton".
  // Reached with ?round6 on the URL: the lead is picked as usual, then the party stands on Fountain Street in this state.
  // Flag names per events.js (errands 396-473, the five 602-720, cradles 596, cull 731-761, tail/ettercap 356-371 and 777-807,
  // the Hex 524-564, the Snoot 810-821, Winters' ring 409-417); the six majors put everyone on their +2 weapon (events.js 153-173).
  DS.round6 = /[?&]round6\b/.test(location.search || '');
  DS.roundSix = function (G) {
    var D = DS.DATA, f = G.flags;
    function set(o) { Object.keys(o).forEach(function (k) { f[k] = o[k]; }); }
    var ids = [G.lead].concat(['barley', 'aurdin', 'vivian', 'lymen'].filter(function (id) { return id !== G.lead; }));
    G.party = ids.map(function (id) { return R.makeHero(id, 4); }); // Vivian's archetype stays pending: the field asks, the player chooses
    G.hired = ids.slice(); G.guests = [];
    G.inv = [];
    [['potion', 3], ['greaterpotion', 1], ['simples', 4], ['kit', 3], ['draught', 2], ['batpie', 2], ['rope', 1], ['oil', 3], ['torch', 2], ['cord', 1], ['tent', 1]]
      .forEach(function (s) { if (D.items[s[0]]) G.give(s[0], s[1]); });
    if (G.lead !== 'vivian' && D.items.candle) G.give('candle', 1);
    G.party.forEach(function (h) { var rw = D.heroes[h.id].rewardWeapons; if (rw) h.equip.weapon = rw[1]; });
    f.majors = 6;
    G.main().equip.ring = 'ringofbinding';                                 // When You're Ready: Winters' ring, to the lead
    var bare = G.party.filter(function (h) { return !h.equip.ring; }).sort(function (a, b) { return R.ac(a) - R.ac(b); })[0];
    if (bare) bare.equip.ring = 'ringofprotection';                        // the dens' chest
    G.party.forEach(function (h) { if (h.attuned) R.attune(h); });         // (a rested party: what it wears is bonded -- 10-06, attunement)
    set({ wintersMet: 1, heardWinters: 1, wErrA: 1, wSealed: 1, wValued: 1, wErrADone: 1, wErrB: 1, wSigned: 1, wPaid: 1, wErrBDone: 1 });
    set({ heardPete: 1, heardWarrens: 1, tallyMet: 1, fiveKnown: 1, skarnOk: 1, skarnGateOpen: 1, landlordSpoke: 1, otyughFed: 1,
          markRead: 1, fiveRecovered: 1, fiveDone: 1, skarnPaid: 1, fiveNotice: 1, 'trig:jelly': 1, 'trig:ooze': 1 });
    set({ shifts: 3, hobMet: 1 });
    set({ heardGalleries: 1, cullHired: 1, rescued: 1, cullDone: 1, 'trig:rescue': 1, paidBats: 8, paidMantles: 2 });
    set({ heardCloaker: 1, cloakerDone: 1, heardEttercap: 1, ettercapDone: 1, 'trig:snared': 1 });
    set({ heardHex: 1, 'hex:brawl': 1, 'hex:freeman': 1, 'hex:card': 1, 'hex:talmok': 1, talmokBeaten: 1 });
    set({ heardSnoot: 1, snootDone: 1, snootWord: 1 });
    ['r-ettercap', 'r-cloaker', 'r-cloakerNumber', 'r-nobodyCollected', 'r-lantern', 'r-dwarves', 'r-hexcard', 'r-fronted', 'r-boxes', 'r-deathround',
     'r-talmok', 'r-snoot', 'r-snootreach', 'r-escort', 'r-scaleslit', 'r-doserate', 'r-mouths', 'r-shibboleth', 'r-guanowages', 'r-roost', 'r-coldridge',
     'r-maps', 'r-pete', 'r-promised', 'r-stream', 'r-winters', 'r-webgulch'].forEach(function (id) { f['heard:' + id] = 1; });
    ['warrens_b:1,9', 'warrens_c:13,14', 'warrens_c:30,5', 'warrens_c:41,5', 'warrens_d:38,21', 'galleries_g3:50,17', 'galleries_g4:25,17', 'gulch:33,8', 'gulch:19,24']
      .forEach(function (k) { f['chest:' + k] = 1; });
    G.kills = { crawler: 3, 'warrens_d:crawler': 3, giantbat: 12, 'g3:giantbat': 8, darkmantle: 2, 'g3:darkmantle': 2, cloaker: 1, ettercap: 1, talmok: 1 };
    G.renown = 8; G.silver = 1500;
    set({ heardLake: 1, 'heard:r-lake': 1, 'heard:r-halfway': 1, pin: 'lake' });
    G.map = 'silverton'; G.x = 29; G.y = 8; G.dir = 'down';
    G.time = 6 * 3600 * 60;
    return G;
  };

  // ------------------------------------------------------------------ the level-three start (Griz 09-30, for a testing day)
  // "everyone just hit lvl 3 and only the silverton paper delivery and collect the party missions are done".
  // Reached with ?lvl3 on the URL: the journal's Company (all four hired) and Winters' Errands (both errands, events.js
  // 555-588: the one renown they pay is what lets Lymen join) are done, and nothing else -- no Warrens, no Hex card, no bounties.
  // Each hero stands at level 3's XP to the point; Vivian's archetype asks at once, as it does at rogue 3.
  DS.lvl3 = /[?&]lvl3\b/.test(location.search || '');
  DS.levelThree = function (G) {
    var f = G.flags;
    var ids = [G.lead].concat(['barley', 'aurdin', 'vivian', 'lymen'].filter(function (id) { return id !== G.lead; }));
    G.party = ids.map(function (id) { return R.makeHero(id, 3); });
    G.hired = ids.slice(); G.guests = [];
    // the purse as those two jobs leave it: 12 and 20 from Winters, a potion from Brennan's job; the hires' fees out (Barley 5,
    // Aurdin 20, Vivian's candle 1), and Barley's five back from his bout
    var fees = { barley: 5, aurdin: 20, vivian: 1, lymen: 0 };
    G.silver += 12 + 20 - ids.slice(1).reduce(function (s, id) { return s + fees[id]; }, 0) + (G.lead !== 'barley' ? 5 : 0);
    G.give('potion', 1);
    if (G.lead !== 'vivian' && DS.DATA.items.candle) G.give('candle', 1);
    ['wintersMet', 'heardWinters', 'wErrA', 'wSealed', 'wValued', 'wErrADone', 'wErrB', 'wSigned', 'wPaid', 'wErrBDone'].forEach(function (k) { f[k] = 1; });
    G.renown = 1;
    G.map = 'silverton'; G.x = 29; G.y = 8; G.dir = 'down';
    G.time = 6 * 3600 * 60;
    return G;
  };

  // ------------------------------------------------------------------ Lead select
  function LeadSelect() {
    this.kind = 'lead'; this.opaque = true; this.ids = ['barley', 'aurdin', 'vivian', 'lymen'];
    var pre = /[?&]lead=(barley|aurdin|vivian|lymen)\b/i.exec(location.search || ''); // (&lead=lymen: the cursor starts on him -- a testing URL's convenience, 10-03)
    this.i = pre ? this.ids.indexOf(pre[1].toLowerCase()) : 0;
  }
  LeadSelect.prototype.update = function () {
    var self = this;
    if (I.repeat('right') || I.repeat('down')) { this.i = (this.i + 1) % 4; DS.audio.sfx('cursor'); }
    if (I.repeat('left') || I.repeat('up')) { this.i = (this.i + 3) % 4; DS.audio.sfx('cursor'); }
    if (I.pressed('b')) { DS.audio.sfx('cancel'); DS.pop(this); return; }
    if (I.pressed('a')) {
      DS.audio.sfx('confirm');
      var id = this.ids[this.i], d = DS.DATA.heroes[id];
      DS.run(function* () {
        var sit = DS.at && DS.SITUATIONS && DS.SITUATIONS[DS.at]; // ?at=<id>: a playtest situation (js/situations.js)
        var ok = yield DS.ask(sit ? sit.title.toUpperCase() + ', led by ' + d.name + '? The other three are already with you.' : DS.round6 ? 'Round six, led by ' + d.name + '? The other three are already with you.' : DS.lvl3 ? 'Level three, led by ' + d.name + '? The other three are already with you.' : 'Begin as ' + d.name + '? The other three can be found in play, and hired.', ['BEGIN', 'BACK']);
        if (ok !== 0) return;
        DS.newGame(id); DS.bindState(DS.G);
        if (sit) DS.situation(DS.G, sit);
        else if (DS.round6) DS.roundSix(DS.G);
        else if (DS.lvl3) DS.levelThree(DS.G);
        yield DS.fade(1, 30);
        DS.clearScenes();
        var F = DS.field = new DS.Field();
        DS.push(F);
        var st = sit || DS.round6 || DS.lvl3 ? { map: DS.G.map, x: DS.G.x, y: DS.G.y, dir: DS.G.dir } : DS.DATA.config.start;
        F.load(st.map, st.x, st.y, st.dir);
        yield DS.fade(0, 30);
        if (sit) { yield* DS.situationStart(sit); return; }
        if (DS.round6) { yield DS.say('ROUND SIX. All four of you at level 4, every quest done but the Halfway Inn and the lake. Fountain Street, and the road south is waiting.'); return; }
        if (DS.lvl3) { yield DS.say('LEVEL THREE. All four of you just made level 3. Winters\' errands are run and the four of you have found each other; nothing else is done yet. Fountain Street.'); return; }
        yield* DS.EV.intro(id);
      });
    }
  };
  LeadSelect.prototype.draw = function (ctx) {
    ctx.fillStyle = '#0a0c24'; ctx.fillRect(0, 0, 256, 240);
    DS.textCenter(ctx, 'CHOOSE WHO YOU ARE', 128, 8, '#F8D878');
    var self = this;
    this.ids.forEach(function (id, i) {
      var d = DS.DATA.heroes[id], x = 8 + i * 62, sel = i === self.i;
      DS.win(ctx, x, 20, 58, 70, sel ? '#26206a' : null);
      var spr = DS.fighter(DS.LOOKS[d.look], d.weaponArt);
      ctx.drawImage(spr[sel && ((DS.frame >> 4) & 1) ? 'act' : 'stand'], x + 13, 28, 32, 48);
      DS.textCenter(ctx, d.name, x + 29, 78, sel ? '#F8D878' : '#F8F8F8');
    });
    var d = DS.DATA.heroes[this.ids[this.i]], h = R.makeHero(this.ids[this.i]);
    DS.win(ctx, 4, 94, 248, 132);
    DS.text(ctx, d.fullName || d.name, 12, 102, '#F8D878');
    DS.text(ctx, d.classLine, 12, 114, '#C8D0E8');
    var ab = R.ABIL.map(function (a) { return a.toUpperCase() + ' ' + h.abil[a]; });
    DS.text(ctx, ab.slice(0, 3).join('  '), 12, 128); DS.text(ctx, ab.slice(3).join('  '), 12, 139);
    DS.text(ctx, 'HP ' + h.maxhp + '   AC ' + R.ac(h) + '   ' + R.weaponOf(h).name, 12, 152, '#F8F8F8');
    var lines = DS.wrap(d.blurb, 232);
    for (var k = 0; k < Math.min(6, lines.length); k++) DS.text(ctx, lines[k], 12, 166 + k * 11, '#E0C8A0');
    DS.textCenter(ctx, DS.keys('◀ ▶ choose   E/ENTER confirm   X back'), 128, 230, '#6C6C84');
  };

  // ------------------------------------------------------------------ save / load slots
  // CONTINUE FROM carries the file too (10-01b, Griz: "2 continue screen"): EXPORT SAVES writes this browser's game to a file, IMPORT
  // SAVES brings one in (asking first: the slots in the file replace the ones here)
  function slotRows(saving) {
    var rows = slotItems(saving);
    if (!saving) rows.push({ label: 'EXPORT SAVES  (to a file)', value: 'export', disabled: !Object.keys(gameKeys()).length, color: '#C8D0E8' }, { label: 'IMPORT SAVES  (from a file)', value: 'import', color: '#C8D0E8' });
    return rows;
  }
  function SlotScene(saving) {
    var self = this;
    this.kind = 'slots'; this.saving = saving;
    var last = DS.slotsUsed()[0], rows = slotRows(saving), first = 0;
    while (first < rows.length - 1 && rows[first].disabled) first++; // (nothing marked: the first row there is to take -- IMPORT, on a browser with no saves)
    if (last && rows[last - 1].disabled) last = 0; // (a marked slot since emptied: not a row to start on)
    this.menu = new DS.Menu({
      items: rows, x: 16, y: 80, w: 224, rowH: 14, title: saving ? 'SAVE WHERE?' : 'CONTINUE FROM', index: last ? last - 1 : first,
      onSelect: function (it) {
        if (it.value === 'export') { var m = DS.exportSaves(); DS.audio.sfx(/^To a file/.test(m) ? 'save' : 'error'); self.msg = m; return; }
        if (it.value === 'import') {
          DS.importSaves(function (why, file, keys) {
            if (why) { DS.audio.sfx('error'); self.msg = why; return; }
            DS.run(function* () {
              var ok = yield DS.ask('Bring in ' + filed(keys) + ' from the file? The slots in it replace the ones here.', ['IMPORT', 'BACK']);
              if (ok !== 0) return;
              var bad = keys.filter(function (k) { return !DS.store.set(k, file.keys[k]); }).length;
              DS.audio.sfx(bad ? 'error' : 'save');
              self.msg = bad ? 'Could not write it all (storage blocked).' : 'Imported: ' + filed(keys) + '.';
              self.menu.items = slotRows(false);
            });
          });
          return;
        }
        if (saving) {
          var ok = DS.saveGame(it.value);
          DS.audio.sfx(ok ? 'save' : 'error');
          if (ok) DS.slotUsed(it.value);
          self.msg = ok ? 'Saved to slot ' + it.value + '.' : 'Could not save (storage blocked).';
          self.menu.items = slotItems(true); self.done = 50;
        } else {
          var d = DS.loadSlot(it.value), why = d ? DS.migrateSave(d) : 'empty';
          if (why) { DS.audio.sfx('error'); self.msg = 'That save was ' + why + '.'; return; }
          DS.slotUsed(it.value); DS.startFrom(d);
        }
      },
      onCancel: function () { DS.pop(self); }
    });
  }
  SlotScene.prototype.update = function () { if (this.done > 0) { if (--this.done === 0) DS.pop(this); return; } this.menu.update(); };
  SlotScene.prototype.draw = function (ctx) {
    this.menu.draw(ctx);
    if (this.msg) { var ln = DS.wrap(this.msg, 208).slice(0, 2); DS.win(ctx, 16, this.menu.y + this.menu.h + 6, 224, 8 + ln.length * 11); ln.forEach(function (l, i) { DS.textCenter(ctx, l, 128, this.menu.y + this.menu.h + 12 + i * 11, '#F8D878'); }, this); }
  };
  DS.SlotScene = SlotScene;

  // ------------------------------------------------------------------ Field menu
  // The one menu (js/menu.js; RULED 10-06, Griz: "ideal = identical menus") held as a scene: this is the 8-bit's host for it -- the party,
  // the pack, and the actions that talk in the game's own voice (a potion drunk, a spell cast, the save). o.battle: opened from a fight's
  // commands with X/ESC (RULED 09-30c, Griz: "I thought it always opened this menu and that's how we changed equip in 8-bit fights ... I
  // couldn't turn sound off or exit the game during a fight"): the fight has its own ITEM, MAGIC and SKILL (here a look only), ORDER and SAVE
  // wait till it is over, and EQUIP is the one whose turn it is -- his weapon and shield, while he has not spent his action (RULED 09-30c,
  // Griz: "weapon and shield should be changable if the character hasn't spent an action - greyed if he has")
  function FieldMenu(o) {
    var self = this; o = o || {};
    this.kind = 'fieldmenu'; this.battle = o.battle || null; this.picked = null;
    o.picked = function (p) { self.picked = p; }; // (a fight's command picked on the menu: { cmd, value } -- js/battle.js heroTurn reads it when the menu closes, 10-07)
    this.m = DS.MENU.open(host8(o, function () { DS.pop(self); }));
  }
  DS.FieldMenu = FieldMenu;
  FieldMenu.prototype.update = function () { this.m.update(I); };
  FieldMenu.prototype.draw = function (ctx) { this.m.draw(ctx); };
  function host8(o, close) {
    var G = DS.G, fight = o.battle ? { hero: o.hero || null, acted: !!o.acted } : null;
    // in a fight, the fight's own lists for the hero whose turn it is (10-07, Griz: "1 - you're the instance for it if its not too big of a job" -- the grid's menu does
    // this, deep16/js/ui.js gridHost): ITEMS, MAGIC and SKILLS lit and greyed as the battle's own commands are (js/battle.js battleItems, spellRows, skillList,
    // channelList), each with its cost for the menu's colour (the action yellow, the bonus blue, free white), and a pick is this turn's command -- the battle's own
    // target picker after it, as from its own lists
    var B8 = o.battle, u8 = o.unit, st8 = o.st;
    if (fight && u8 && st8 && B8.spellRows) {
      var SK = { secondWind: ['B', '1d10 + level HP back'], actionSurge: ['F', 'one more action this turn'], hideAttack: ['B', 'hide, then strike from hiding'], attackHide: ['B', 'strike, then hide'],
        lay: ['A', 'heal by touch from the pool'], sacred: ['A', 'Sacred Weapon: +CHA to hit for a minute'], unholy: ['A', 'Turn the Unholy: fiends and undead save or flee'] };
      fight.ring = function (kind) {
        if (kind === 'items') { var fast = o.hero.subclass === 'Thief' && st8.bonus > 0; return B8.battleItems(u8).map(function (r) { return { id: r.value, name: r.label, ok: !r.disabled, why: r.right === 'ROOST' ? 'the roost overhead: no fire' : r.right === 'hands' ? 'no free hand to hold it' : '', cost: fast ? 'B' : 'A' }; }); }
        if (kind === 'spells') return B8.spellRows(u8, B8.castableFor(u8), st8).map(function (r) { var sp = r.value; return { id: sp.id, name: sp.name, level: sp.level || 0, levels: r.lv ? [r.lv] : [], slot: r.lv || 0, g: { time: sp.bonus ? 'B' : 'A' }, sp: sp, spell: sp, ok: !r.disabled, why: r.why }; });
        var out = [];
        B8.skillList(u8, st8).forEach(function (r) {
          if (r.value === 'channel') { // (its options on the list itself, as the grid's ring has them: no second list)
            if (r.disabled) out.push({ id: 'channel', label: r.label, cost: 'A', ok: false, why: 'Channel Divinity is spent (a short rest brings it back)', value: 'channel' });
            else B8.channelList(u8).forEach(function (c) { out.push({ id: c.value, label: c.label, cost: 'A', ok: !c.disabled, why: c.disabled ? 'no fiend or undead here to turn' : '', note: (SK[c.value] || [])[1] || '', value: c.value }); });
            return;
          }
          var k = SK[r.value] || ['A', ''];
          out.push({ id: r.value, label: r.label, cost: k[0], ok: !r.disabled, why: r.disabled ? 'the bonus action is spent' : '', note: k[1] + (r.value === 'lay' ? ' (' + r.right + ' left)' : ''), value: r.value });
        });
        return out;
      };
      fight.pick = function (kind, e) { o.picked({ cmd: kind === 'items' ? 'item' : kind === 'spells' ? 'magic' : 'skill', value: kind === 'items' ? e.id : kind === 'spells' ? e.spell : e.value }); };
    }
    return {
      fight: fight,
      party: function () { return G.party; },
      guests: function () { return (G.guests || []).map(function (x) { return x.h; }); },
      pack: function () { return G.inv; },
      give: function (id, n) { G.give(id, n || 1); },
      take: function (id, n) { G.take(id, n || 1); },
      info: function () { var pq = DS.pinnedQuest && DS.pinnedQuest(); return { silver: G.silver, renown: G.renown, place: DS.field && DS.field.map ? DS.field.map.name : '', time: fmtTime(G.time), steps: G.steps, pin: pq ? pq.name : null }; },
      canSave: function () { return !fight && !!(DS.field && DS.field.map && DS.field.map.src.save !== false); },
      walker: function (h) { return DS.walker(DS.LOOKS[h.look]).down[0]; },
      portrait: function (h) { return DS.fighter(DS.LOOKS[h.look], h.weapon).stand; },
      // a spell sheet no one here can copy: why not ('' when someone can -- RULED 10-01c, "unusable if not")
      whyNot: function (id, h) { var it = DS.DATA.items[id]; return it && it.use && it.use.effect === 'learn' ? DS.EV.learnWhy(id, h || null) : ''; },
      // the light in this hero's hand: a lantern or the lamp stays lit till it is put away here (RULED 09-30d: "using a lantern should stick")
      light: function (h) { if (!h.equip.torch || G.flags.torchBy !== h.id) return null; var k = G.flags.torchKind || 'torch'; return { id: k, name: (DS.DATA.items[k] || { name: 'Torch' }).name, hooded: R.hooded(k) }; },
      journal: function () {
        var all = (DS.DATA.quests || []).filter(function (q) { return DS.cond(q.show); }), titles = DS.DATA.config.renownTitles;
        return {
          renown: G.renown, title: titles[Math.min(G.renown, titles.length - 1)], pin: G.flags.pin || null,
          quests: all.map(function (q) { var done = DS.cond(q.done), st = !done && DS.questStep(q); return { id: q.id, name: q.name, text: q.text, doneText: q.doneText, done: done, where: st && st.where }; }),
          rumors: (DS.DATA.rumors || []).filter(function (r) { return G.flags['heard:' + r.id]; }).map(function (r) { return r.t; }),
          setPin: function (id) { if (id) { G.flags.pin = id; DS.audio.sfx('confirm'); } else { delete G.flags.pin; DS.audio.sfx('cancel'); } }
        };
      },
      exits: function () { return [{ label: 'TO THE TITLE', value: 'title', warn: 'Unsaved progress is lost.' }]; },
      run: function (kind, a, done) {
        DS.run(function* () {
          if (kind === 'item') yield* DS.EV.useFieldItem(a.id, a.h || null);
          else if (kind === 'cast') yield* DS.EV.fieldCast(a.h, a.sp, a.t);
          else if (kind === 'skill') yield* DS.EV.fieldSkill(a.h, a.s, a.t);
          else if (kind === 'save') yield W8.scene(new SlotScene(true));
          else if (kind === 'light-off') { DS.EV.torchOut(true); DS.audio.sfx('confirm'); }
          else if (kind === 'kofi') DS.openKofi();
          else if (kind === 'exit') {
            // (from inside a fight, the fight's own scripts and the one that started it are waiting on this menu: end them, or the field
            // would think a script still runs and never take a step again)
            if (fight) DS.scripts.forEach(function (s) { s.done = true; });
            DS.clearScenes(); DS.push(new Title());
          }
        }, function () { done(); });
      },
      close: close
    };
  }
  DS.host8 = host8;
  function pickHero(title, filter) {
    var items = DS.G.party.map(function (h) { return { label: h.name, right: (h.ko ? 'KO ' : '') + h.hp + '/' + h.maxhp, value: h, disabled: filter ? !filter(h) : false }; });
    return DS.choose({ items: items, x: 60, y: 60, w: 136, title: title, rowH: 12 });
  }
  // +1 better, -1 worse, 0 same: average weapon damage, or AC (the shops' arrows)
  function better(h, it) {
    var slot = it.kind, save = h.equip[slot], before, after;
    function score() {
      if (slot === 'weapon') { var d = R.damageExpr(h); return (d.dice === '0' ? 0 : DS.avgDice(d.dice)) + d.mod + R.attackBonus(h) * 0.5; }
      return R.ac(h);
    }
    before = score(); h.equip[slot] = it.id; after = score(); h.equip[slot] = save;
    return after > before ? 1 : after < before ? -1 : 0;
  }

  // ------------------------------------------------------------------ Shop
  function Shop(def) {
    this.kind = 'shop'; this.def = def; this.mode = null; this.msg = def.greeting || 'Welcome.';
    var self = this;
    this.menu = new DS.Menu({
      items: [{ label: 'BUY', value: 'buy', disabled: !def.items || !def.items.length }, { label: 'SELL', value: 'sell', disabled: def.buys === false }, { label: 'LEAVE', value: 'leave' }],
      x: 4, y: 58, w: 64, rowH: 12, pad: 7,
      onSelect: function (it) { DS.run(function* () { self.menu.active = false; yield* self.go(it.value); self.menu.active = true; }); },
      onCancel: function () { DS.pop(self); }
    });
  }
  DS.Shop = Shop;
  Shop.prototype.price = function (id) { var o = this.def.prices && this.def.prices[id]; return o != null ? o : DS.DATA.items[id].price; };
  Shop.prototype.go = function* (what) {
    var G = DS.G, self = this;
    if (what === 'leave') { DS.pop(this); return; }
    if (what === 'buy') {
      while (true) {
        var items = this.def.items.map(function (id) { var it = DS.DATA.items[id], p = self.price(id); return { label: it.name, right: p + ' sp', value: id, disabled: p > G.silver }; });
        var id = yield DS.choose({ items: items, x: 70, y: 58, w: 182, visible: 9, rowH: 12, drawExtra: function (ctx, m) { self.drawWho(ctx, m); } });
        if (!id) return;
        var it = DS.DATA.items[id], p = this.price(id), n = 1;
        if (it.kind === 'use' || it.stack) { n = yield DS.qty({ max: Math.min(99, Math.floor(G.silver / p)), price: p, label: it.name }); if (!n) continue; }
        G.silver -= p * n; G.give(id, n); DS.audio.sfx('coin');
        this.msg = DS.pick(this.def.thanks || ['A fair trade.', 'Yours.', 'Mind how you carry it.']);
        if (it.kind === 'weapon' || it.kind === 'armor' || it.kind === 'shield') {
          var fits = G.party.filter(function (h) { return R.canEquip(h, it); });
          if (fits.length) {
            var eq = yield DS.ask('Equip it now?', ['YES', 'NO']);
            if (eq === 0) {
              var h = fits.length === 1 ? fits[0] : yield pickHero('WHO TAKES IT?', function (x) { return R.canEquip(x, it); });
              if (h) {
                if (it.kind === 'shield') { var w = R.item(h.equip.weapon); if (w && (w.weapon.props || []).indexOf('two-handed') >= 0) { yield DS.say(h.name + "'s weapon needs both hands."); continue; } }
                if (it.kind === 'weapon' && (it.weapon.props || []).indexOf('two-handed') >= 0 && h.equip.shield) { G.give(h.equip.shield, 1); h.equip.shield = null; }
                if (h.equip[it.kind]) G.give(h.equip[it.kind], 1);
                G.take(id, 1); h.equip[it.kind] = id; DS.audio.sfx('confirm');
              }
            }
          }
        }
      }
    }
    if (what === 'sell') {
      // most shops buy at half and won't touch gristle; Percy buys only parts, at a fifth of their rendered price
      var d = this.def, rate = d.buyRate || 0.5;
      var offer = function (it) { return Math.max(1, Math.floor(it.price * rate)); };
      while (true) {
        var inv = G.inv.filter(function (s) { var it = DS.DATA.items[s.id]; return it.kind !== 'key' && it.price > 0 && (d.buysKind ? d.buysKind.indexOf(it.kind) >= 0 : it.kind !== 'part'); })
          .map(function (s) { var it = DS.DATA.items[s.id]; return { label: it.name + ' x' + s.n, right: offer(it) + ' sp', value: s.id }; });
        if (!inv.length) { this.msg = d.nothingText || 'You have nothing I want.'; return; }
        var sid = yield DS.choose({ items: inv, x: 70, y: 58, w: 182, visible: 9, rowH: 12 });
        if (!sid) return;
        var sit = DS.DATA.items[sid], cnt = G.count(sid), k = 1;
        if (cnt > 1) { k = yield DS.qty({ max: cnt, price: offer(sit), label: sit.name }); if (!k) continue; }
        G.take(sid, k); G.silver += offer(sit) * k; DS.audio.sfx('coin');
        this.msg = DS.pick(d.boughtText || ['Done.']);
      }
    }
  };
  Shop.prototype.drawWho = function (ctx, menu) {
    var id = menu.current() && menu.current().value, it = id && DS.DATA.items[id], G = DS.G;
    DS.win(ctx, 4, 196, 248, 40);
    if (!it) return;
    var ln = DS.wrap(it.desc || '', 150);
    for (var i = 0; i < Math.min(3, ln.length); i++) DS.text(ctx, ln[i], 10, 203 + i * 10, '#E0C8A0');
    if (it.kind === 'weapon' || it.kind === 'armor' || it.kind === 'shield') {
      G.party.forEach(function (h, k) {
        var ok = R.canEquip(h, it), spr = DS.walker(DS.LOOKS[h.look]);
        var x = 164 + k * 22;
        ctx.globalAlpha = ok ? 1 : 0.25; ctx.drawImage(spr.down[ok && ((DS.frame >> 4) & 1) ? 1 : 0], x, 200); ctx.globalAlpha = 1;
        if (ok) { var d = better(h, it); DS.textCenter(ctx, d > 0 ? '▲' : d < 0 ? '▼' : '=', x + 8, 219, d > 0 ? '#58F898' : d < 0 ? '#F85838' : '#C8D0E8'); }
      });
    }
  };
  Shop.prototype.update = function () { this.menu.update(); };
  Shop.prototype.draw = function (ctx) {
    var G = DS.G, d = this.def;
    DS.win(ctx, 4, 4, 248, 50);
    if (d.look) ctx.drawImage(DS.walker(DS.LOOKS[d.look]).down[(DS.frame >> 5) & 1], 12, 12, 32, 32);
    DS.text(ctx, d.name, 52, 10, '#F8D878');
    DS.text(ctx, d.keeper || '', 52, 21, '#9C9C9C');
    DS.wrap(this.msg, 190).slice(0, 2).forEach(function (l, i) { DS.text(ctx, l, 52, 32 + i * 10, '#F8F8F8'); });
    DS.win(ctx, 4, 170, 64, 22);
    DS.text(ctx, '◆' + G.silver, 10, 177, '#F8F8F8');
    this.menu.draw(ctx);
  };
  DS.shop = function (id) { return W8.scene(new Shop(DS.DATA.shops[id])); };

  // ------------------------------------------------------------------ Game over
  function GameOver() { this.kind = 'gameover'; this.opaque = true; this.t = 0; var self = this; this.menu = null; }
  DS.GameOver = GameOver;
  GameOver.prototype.update = function () {
    this.t++;
    if (this.t === 90) {
      var self = this, any = [1, 2, 3].some(function (i) { return !!DS.loadSlot(i); });
      this.menu = new DS.Menu({ items: [{ label: 'CONTINUE FROM A SAVE', value: 'load', disabled: !any }, { label: 'TITLE', value: 'title' }], x: 56, y: 150, w: 144, cancelable: false,
        onSelect: function (it) { if (it.value === 'load') DS.push(new SlotScene(false)); else { DS.clearScenes(); DS.push(new Title()); } } });
    }
    if (this.menu) this.menu.update();
  };
  GameOver.prototype.draw = function (ctx) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 240);
    ctx.globalAlpha = Math.min(1, this.t / 60);
    DS.bigText(ctx, 'THE PARTY FALLS', 128, 80, 2);
    DS.textCenter(ctx, 'The corridor keeps what it takes.', 128, 116, '#9C9C9C');
    ctx.globalAlpha = 1;
    if (this.menu) this.menu.draw(ctx);
  };

  // ------------------------------------------------------------------ the roost law broken (RULED 09-24, Griz)
  // Not a death: a failure of the other kind. You came to make a name. You made one.
  function RoostFail() {
    this.kind = 'gameover'; this.opaque = true; this.t = 0; this.menu = null; this.bats = [];
    for (var i = 0; i < 260; i++) this.bats.push(DS.newBat(false));
  }
  DS.RoostFail = RoostFail;
  RoostFail.prototype.update = function () {
    this.t++;
    if (this.t === 150) {
      var any = [1, 2, 3].some(function (i) { return !!DS.loadSlot(i); });
      this.menu = new DS.Menu({ items: [{ label: 'CONTINUE FROM A SAVE', value: 'load', disabled: !any }, { label: 'TITLE', value: 'title' }], x: 56, y: 176, w: 144, cancelable: false,
        onSelect: function (it) { if (it.value === 'load') DS.push(new SlotScene(false)); else { DS.clearScenes(); DS.push(new Title()); } } });
    }
    if (this.menu) this.menu.update();
  };
  RoostFail.prototype.draw = function (ctx) {
    ctx.fillStyle = '#060406'; ctx.fillRect(0, 0, 256, 240);
    var keep = Math.max(40, 260 - this.t * 2); // the swarm thins out as the words come up
    DS.drawBats(ctx, this.bats.slice(0, keep));
    ctx.globalAlpha = Math.min(1, Math.max(0, (this.t - 30) / 60));
    DS.bigText(ctx, 'NOT THIS KIND', 128, 44, 2);
    DS.bigText(ctx, 'OF NAME', 128, 66, 2);
    DS.wrap(DS.L('fail.roost'), 220).forEach(function (l, i) { DS.textCenter(ctx, l, 128, 104 + i * 11, '#C8D0E8'); });
    ctx.globalAlpha = 1;
    if (this.menu) this.menu.draw(ctx);
  };

  // ------------------------------------------------------------------ a book, read on its own page (Katarina's)
  function BookScene(title, paras) {
    this.kind = 'book'; this.opaque = true; this.p = 0; this.title = title;
    var lines = [];
    paras.forEach(function (t, i) { if (i) lines.push(''); DS.wrap(t, 216).forEach(function (l) { lines.push(l); }); });
    this.pages = [];
    for (var k = 0; k < lines.length; k += 17) this.pages.push(lines.slice(k, k + 17));
  }
  DS.BookScene = BookScene;
  BookScene.prototype.update = function () {
    if (I.pressed('b')) { DS.audio.sfx('cancel'); DS.pop(this); return; }
    if (I.pressed('a') || I.pressed('right')) {
      if (this.p < this.pages.length - 1) { this.p++; DS.audio.sfx('cursor'); } else { DS.audio.sfx('cancel'); DS.pop(this); }
    }
    if (I.pressed('left') && this.p > 0) { this.p--; DS.audio.sfx('cursor'); }
  };
  BookScene.prototype.draw = function (ctx) {
    ctx.fillStyle = '#1a1210'; ctx.fillRect(0, 0, 256, 240);
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(10, 6, 236, 228);
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(14, 10, 228, 220);
    ctx.fillStyle = '#d8c8a0'; ctx.fillRect(14, 10, 228, 2); ctx.fillRect(14, 228, 228, 2);
    DS.textCenter(ctx, this.title, 128, 16, '#6a3a1a');
    var pg = this.pages[this.p] || [];
    for (var i = 0; i < pg.length; i++) DS.text(ctx, pg[i], 20, 30 + i * 11, '#2a1a10');
    DS.textCenter(ctx, DS.keys((this.p + 1) + ' / ' + this.pages.length + (this.p < this.pages.length - 1 ? '   E: turn the page' : '   E: close the book')), 128, 219, '#8a6a4a');
  };

  // ------------------------------------------------------------------ Credits
  function Credits(ending, o) { this.kind = 'credits'; this.opaque = true; this.y = 240; this.ending = ending; this.o = o || {}; this.lines = this.o.lines || DS.DATA.credits; }
  DS.Credits = Credits;
  Credits.prototype.enter = function () { if (this.ending) DS.audio.play('ending'); };
  Credits.prototype.update = function () {
    this.y -= I.down('a') ? 1.6 : 0.4;
    if (I.pressed('b') || this.y < -this.lines.length * 12 - 40) {
      if (this.ending) { DS.pop(this); DS.push(new AfterCredits(this.o)); }
      else DS.pop(this);
    }
    if (I.pressed('menu')) DS.openKofi();
  };
  // after the ending: carry on in a corridor with the lake quiet, or go to the title
  function AfterCredits(o) {
    var self = this;
    this.kind = 'after'; this.opaque = true; this.t = 0; this.o = o || {};
    var items = [{ label: 'CONTINUE', value: 'go' }, { label: 'TITLE', value: 'title' }];
    if (this.o.pastDoor) items.push({ label: 'PAST THE DOOR', value: 'door', color: '#F8D878' }); // the DEEP16 POC's seam
    this.menu = new DS.Menu({ items: items, x: 76, y: 150, w: 104, cancelable: false,
      onSelect: function (it) {
        if (it.value === 'title') { DS.clearScenes(); DS.push(new Title()); return; }
        if (it.value === 'door') { self.o.pastDoor(); return; }
        DS.run(self.o.onContinue || function* () { yield* DS.EV.afterTheLake(); });
      } });
  }
  AfterCredits.prototype.update = function () { this.t++; this.menu.update(); };
  AfterCredits.prototype.draw = function (ctx) {
    ctx.fillStyle = '#04061a'; ctx.fillRect(0, 0, 256, 240);
    DS.bigText(ctx, this.o.title || 'THE LAKE IS QUIET', 128, 70, 1);
    DS.wrap(this.o.prompt || DS.L('after.prompt'), 220).forEach(function (l, i) { DS.textCenter(ctx, l, 128, 96 + i * 11, '#C8D0E8'); });
    this.menu.draw(ctx);
  };
  Credits.prototype.draw = function (ctx) {
    ctx.fillStyle = '#04061a'; ctx.fillRect(0, 0, 256, 240);
    var y = this.y, self = this;
    this.lines.forEach(function (l) {
      if (y > -12 && y < 240) {
        if (l.big) DS.bigText(ctx, l.t, 128, y, 2);
        else DS.wrap(l.t, 232).forEach(function (s, i) { DS.textCenter(ctx, s, 128, y + i * 10, l.c || '#F8F8F8'); });
      }
      y += l.big ? 24 : (DS.wrap(l.t, 232).length * 10 + (l.gap || 4));
    });
    DS.win(ctx, 0, 222, 256, 18); DS.textCenter(ctx, 'B: back   M/SHIFT: open Ko-fi', 128, 227, '#9C9C9C');
  };
})();
