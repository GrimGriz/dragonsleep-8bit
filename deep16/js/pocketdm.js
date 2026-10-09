/* DEEP16 — THE DM'S POCKET DM (10-09), and what both Pocket DMs gained that day. Griz: "on the Pocket DM main menu, if you click the throne and then the
   right lamp and then the left lamp, it takes you to the DM's Pocket DM where the cool new stuff in URLs and the stuff in test runs unlocks (i.e. GreyFang)";
   "only the DM, the current front face is 'release edition' with this secret tester feedback area the shape the front will likely eventually take";
   "CAMPAIGN button shows with the 3 clicks and thats where you build your own ladder".
   THE DOOR: the high seat, the right lamp, the left lamp, in that order, on the title (Pocket.titleClick); the same three put it away. st.dm is the switch.
   THE DM'S TABLE (js/pocket.js reads st.dm): no locks -- the level cap 12, Pyro without the trial, GreyFang and every Mascot on the roster, the story's named
   in the dial's pot; the class floor's knobs on the foes screen (the party flies, a legendary foe, a breath, the dark); DOORS, every door of URLS.md.
   THE CAMPAIGN (his: "each of the icons (and humanoids) is it's own shop and CR is in silver, i.e. 50 silver = 1/2 CR and the creatures are priced top to bottom
   (or otherwise sortable). Store the receipts of what they purchase as a 'unit' at that CR value"; "one store can be 'aberrations, oozes, etc.'"; "they start
   with 1000 and get double the CR of the ladder encounter for each fight on the ladder (always able to create units)"): five shops by the creature's type, 100 sp
   a CR (1/8 is 12 sp 5 cp -- the purse is kept in copper), the units newest first. THE LADDER (his: "a ladder button, where their stored units replace randomly
   assigned units on the ladder" -- "3 - yes", the units never spent, each once a rung, the newest first; "build a ladder. Next to each map a CR up/down, when you
   click the map it puts it in the next available slot of your campaign ladder, fills CR with units first, from most recently created units first"): five slots,
   four rungs and the trial; three floors struck from the random draw ("4 - yes": his "limited number of ladder map exclusions").
   BOTH EDITIONS: USEFULS' SITUATIONS opens a notes box that saves hero_situations_feedback-<UTC>.json, the campaign's particulars in it ("separate from the
   campaign file (but includes pertinent information from the campaign file)"; "No on opening the situations page ... we'll just see what they notice enough to
   type about"). THE EGGS, a Mascot each (10-06 night: "'make your own character the first time' = unlock denny"; 10-09: "Making a campaign should unlock Beholda
   when you haven't bothered to do the 3 clicks"; Goose: "let this unlock a lobstamonkee - flash an easter egg the first time they've actually typed something in
   and pressed the save button" -- "Goose is the only one I personally can't select at the moment"): js/mpmon.js MP.unlock keeps them in st.mascots. */
'use strict';
(function () {
  var D = window.D16, I = D.input, PK = D.pocket, Pocket = D.Pocket, MP = D.mpmon;
  if (!PK || !Pocket) return;
  var P = function (r, i) { return D.PAL.ramps[r][i]; };
  var PD = D.pocketdm = {};

  // ------------------------------------------------------------------ the DM's roster: GreyFang (js/classes.js NPC.NAMED.greyfang, a ranger to his 11), and every Mascot
  var pyAt = PK.STOCK.map(function (s) { return s.w; }).indexOf('pyro');
  PK.STOCK.splice(pyAt < 0 ? PK.STOCK.length : pyAt, 0, { w: 'greyfang', lo: 1, hi: 11, dm: true });
  if (MP && MP.unlocked) { var unl0 = MP.unlocked; MP.unlocked = function (st, w) { return !!(st && st.dm) || unl0(st, w); }; }

  // ------------------------------------------------------------------ the campaign's store (st.camp, kept with the rest in deep16.pocket and in SAVE CAMPAIGN's file)
  PD.START = 10000;          // the purse at the start: 1000 sp, in copper
  PD.CP8 = 125;              // an eighth of a CR in copper: 100 sp a CR, so 50 sp is 1/2 and 12 sp 5 cp is 1/8
  PD.SLOTS = 5;              // the built ladder: four rungs and the trial
  PD.STRIKES = 3;            // the floors the random draw may be kept off
  PD.camp = function (st) {
    var c = st.camp = st.camp && typeof st.camp === 'object' ? st.camp : {};
    if (typeof c.purse !== 'number') c.purse = PD.START;
    c.units = Array.isArray(c.units) ? c.units : []; c.strike = Array.isArray(c.strike) ? c.strike : []; c.plan = Array.isArray(c.plan) ? c.plan : [];
    c.mapCR = c.mapCR && typeof c.mapCR === 'object' ? c.mapCR : {}; c.next = c.next || 1;
    return c;
  };
  PD.price = function (kind) { var f = D.FOES[kind]; return f ? PK.cr8(f.cr) * PD.CP8 : 0; };
  PD.fmt = function (cp) {
    cp = Math.round(cp || 0); var neg = cp < 0; cp = Math.abs(cp);
    var sp = Math.floor(cp / 10), c = cp % 10, s = String(sp).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + s + ' sp' + (c ? ' ' + c + ' cp' : '');
  };
  // the units newest first (his "from most recently created units first")
  PD.newest = function (cp) { return cp.units.slice().sort(function (a, b) { return (b.at - a.at) || (b.id - a.id); }); };
  function water(mapId) { var def = D.MAPS[mapId]; return !!def && def.rows.join('').indexOf('~') >= 0; }
  function fits(kind, mapId) { var f = D.FOES[kind]; return !!f && !(f.bound && !water(mapId)); }

  // ------------------------------------------------------------------ the five shops
  PD.SHOPS = [
    { id: 'beasts', name: 'BEASTS', types: ['beast'], icon: 'paw', sub: 'the wild and the hungry' },
    { id: 'monstrosities', name: 'MONSTROSITIES', types: ['monstrosity'], icon: 'claw', sub: 'the made wrong and the made on purpose' },
    { id: 'humanoids', name: 'HUMANOIDS', types: ['humanoid'], icon: 'sword', sub: 'bandits, drow, gnolls, the story\'s named' },
    { id: 'giants', name: 'GIANTS', types: ['giant'], icon: 'boulder', sub: 'the big ones' },
    { id: 'etc', name: 'ABERRATIONS, OOZES, ETC.', short: 'ABERRATIONS, OOZES, ETC.', types: null, icon: 'eye', sub: 'aberrations, oozes, elementals, the undead, the rest' }
  ];
  var TYPED = ['beast', 'monstrosity', 'humanoid', 'giant'];
  PD.OUT = ['keeperold', 'stonegiantm']; // (the ladder's old Keeper; the stone giant's second look, the same block -- one of each on the shelf)
  PD.shelf = function (shop, sort) {
    var out = Object.keys(D.FOES).filter(function (k) {
      var f = D.FOES[k]; if (!f || /^fam_/.test(k) || f.object || PD.OUT.indexOf(k) >= 0 || PK.cr8(f.cr) <= 0) return false; // (CR 0 costs nothing and fills nothing: off the shelves)
      return shop.types ? shop.types.indexOf(f.type) >= 0 : TYPED.indexOf(f.type) < 0;
    });
    var nm = function (k) { return String(D.FOES[k].name || k); };
    out.sort(sort === 'name' ? function (a, b) { return nm(a) < nm(b) ? -1 : nm(a) > nm(b) ? 1 : 0; }
      : sort === 'dear' ? function (a, b) { return PD.price(b) - PD.price(a) || (nm(a) < nm(b) ? -1 : 1); }
      : function (a, b) { return PD.price(a) - PD.price(b) || (nm(a) < nm(b) ? -1 : 1); });
    return out;
  };
  PD.buy = function (st, kind) {
    var cp = PD.camp(st), cost = PD.price(kind);
    if (!D.FOES[kind] || cost <= 0) return { ok: false, why: 'not for sale' };
    if (cp.purse < cost) return { ok: false, why: 'the purse holds ' + PD.fmt(cp.purse) + ': ' + D.FOES[kind].name + ' is ' + PD.fmt(cost) };
    cp.purse -= cost; var u = { id: cp.next++, kind: kind, at: Date.now(), paid: cost }; cp.units.push(u);
    return { ok: true, unit: u };
  };
  // a unit let go goes back to its shop for what was paid (the seat's call: the purse is a limit on how many at once, not a tax)
  PD.dismiss = function (st, id) {
    var cp = PD.camp(st), u = cp.units.filter(function (x) { return x.id === id; })[0]; if (!u) return null;
    cp.units = cp.units.filter(function (x) { return x !== u; }); cp.purse += u.paid || PD.price(u.kind); return u;
  };

  // ------------------------------------------------------------------ the units on a ladder
  // the random ladder (his 3): each rolled foe whose CR a unit has is that unit -- the newest first, each unit once a rung, never spent; the reading stays the DMG's
  PD.swap = function (st, kinds, mapId) {
    var cp = PD.camp(st), used = {}, units = PD.newest(cp), n = 0;
    var out = kinds.map(function (k) {
      var c = PK.cr8((D.FOES[k] || {}).cr);
      var u = units.filter(function (x) { return !used[x.id] && D.FOES[x.kind] && PK.cr8(D.FOES[x.kind].cr) === c && fits(x.kind, mapId); })[0];
      if (!u) return k;
      used[u.id] = true; n++; return u.kind;
    });
    return { foes: out, mine: n };
  };
  // a slot of the built ladder (his 4): the CR filled from the units first, the newest first, as many as fit it and the floor's room; the rest rolled from the DM's pot
  PD.fill = function (pk, mapId, cr8) {
    var cp = PD.camp(pk.st), room = PK.roomOn(mapId), rem = cr8, take = [];
    PD.newest(cp).forEach(function (u) {
      var f = D.FOES[u.kind]; if (!f || take.length >= room) return;
      var c = PK.cr8(f.cr); if (c <= 0 || c > rem || !fits(u.kind, mapId)) return;
      take.push(u.kind); rem -= c;
    });
    var rest = rem > 0 && take.length < room ? PK.roll(rem, PK.pot(pk.words(), mapId, true), room - take.length) : [];
    return { foes: take.concat(rest), mine: take.length };
  };
  Pocket.prototype.ladderFoes = function (kinds, mapId) {
    if (!this.st.dm) return kinds;
    var r = PD.swap(this.st, kinds, mapId); if (this.st.run) this.st.run.mine = r.mine;
    return r.foes;
  };
  Pocket.prototype.planRung = function (run) {
    if (!run || !run.plan) return false;
    var slot = run.plan[run.trial ? 4 : run.rung - 1]; if (!slot) return false;
    var map = this.mapIds().indexOf(slot.map) >= 0 ? slot.map : this.randomMap();
    var fresh = this.rerolling || !slot.foes || !slot.foes.length || map !== slot.map;
    var f = fresh ? PD.fill(this, map, slot.cr8) : { foes: slot.foes.slice(), mine: slot.mine || 0 };
    this.fightMap = run.map = map; this.foes = run.foes = f.foes; run.mine = f.mine;
    return true;
  };
  PD.startPlan = function (pk) {
    var cp = PD.camp(pk.st); if (!cp.plan.length) return false;
    var here = pk.st.run, ask = pk.ask || function (q) { return window.confirm(q); };
    if (here && !ask('A ladder is under way (' + (here.trial ? 'the trial' : 'rung ' + here.rung) + '). Put it away for yours?')) { pk.say('kept the ladder under way', 240); return false; }
    var levels = pk.levels();
    pk.st.run = { rung: 1, trial: false, base8: cp.plan[0].cr8, carry: null, hd: levels.slice(), arcane: levels.map(function () { return false; }), won: 0, startedAt: Date.now(), plan: JSON.parse(JSON.stringify(cp.plan)), foes: null, map: null };
    pk.planRung(pk.st.run); pk.keep();
    return true;
  };
  // what a ladder fight pays the DM (his: "double the CR of the ladder encounter for each fight on the ladder"): won or lost, twice the table's CR in silver
  Pocket.prototype.afterFight = function (res, run, info) {
    if (!this.st.dm || !run || (res !== 'won' && res !== 'lost')) return;
    var cp = PD.camp(this.st), pay = PK.sum8(info.kinds) * PD.CP8 * 2;
    cp.purse += pay;
    if (this.result) (this.result.lines = this.result.lines || []).push('The DM\'s purse: +' + PD.fmt(pay) + ' (twice the table\'s CR) -- ' + PD.fmt(cp.purse) + ' now');
  };

  // ------------------------------------------------------------------ the knobs (the class floor's, js/classes.js D.npcFight: &fly &legend &breath= &dark)
  var BREATHS = [null, 'cold', 'fire', 'lightning', 'stone'], DARKS = [null, true, false];
  Pocket.prototype.knobs = function () { if (!this.st.dm) return null; var k = this.st.knobs = this.st.knobs || {}; return { fly: !!k.fly, legend: !!k.legend, breath: k.breath || null, dark: k.dark === true ? true : k.dark === false ? false : null }; };
  Pocket.prototype.drawKnobs = function (ctx) {
    if (!this.st.dm) return;
    var self = this, k = this.st.knobs = this.st.knobs || {}, y = 184, step = function (list, v) { var i = list.indexOf(v === undefined ? null : v); return list[(i + 1) % list.length]; };
    var set = function (key, v) { k[key] = v; self.keep(); };
    this.btn(ctx, 'PARTY FLIES: ' + (k.fly ? 'ON' : 'OFF'), 60, y, 92, 13, function () { set('fly', !k.fly); }, { on: !!k.fly, small: true });
    this.btn(ctx, 'LEGENDARY FOE: ' + (k.legend ? 'ON' : 'OFF'), 156, y, 108, 13, function () { set('legend', !k.legend); }, { on: !!k.legend, small: true });
    this.btn(ctx, 'BREATH: ' + (k.breath ? k.breath.toUpperCase() : 'NONE'), 268, y, 92, 13, function () { set('breath', step(BREATHS, k.breath || null)); }, { on: !!k.breath, small: true });
    this.btn(ctx, 'DARK: ' + (k.dark === true ? 'ON' : k.dark === false ? 'OFF' : 'THE MAP\'S'), 364, y, 96, 13, function () { set('dark', step(DARKS, k.dark === true || k.dark === false ? k.dark : null)); }, { on: k.dark != null, small: true });
  };

  // ------------------------------------------------------------------ the door: the high seat, the right lamp, the left lamp (js/pocket.js drawHall draws them)
  var THRONE = [218, 54, 262, 122], RLAMP = [322, 80, 340, 108], LLAMP = [140, 80, 158, 108], ORDER = ['throne', 'right', 'left'];
  function inR(r, m) { return m.x >= r[0] && m.x < r[2] && m.y >= r[1] && m.y < r[3]; }
  Pocket.prototype.titleClick = function () {
    var m = I.mouse; if (!m.click || !m.inside) return false;
    var what = inR(THRONE, m) ? 'throne' : inR(RLAMP, m) ? 'right' : inR(LLAMP, m) ? 'left' : null;
    if (!what) { this.seq = 0; return false; } // (a click anywhere else breaks it -- a button's click still goes to the button)
    this.flare = { what: what, t: this.t };
    if (what === ORDER[this.seq || 0]) { this.seq = (this.seq || 0) + 1; if (this.seq === 3) { this.seq = 0; PD.toggle(this); } }
    else this.seq = what === 'throne' ? 1 : 0;
    return true;
  };
  PD.toggle = function (pk) {
    pk.st.dm = !pk.st.dm; if (pk.st.dm) PD.camp(pk.st);
    pk.cache = {}; pk.keep();
    PD.egg(pk, pk.st.dm ? 'dm' : 'release');
  };
  Pocket.prototype.drawTitleDM = function (ctx) {
    var self = this, f = this.flare, dt = f ? this.t - f.t : 99;
    if (dt < 24) { // (each of the three answers a click: a lamp flares, the high seat glints -- nothing says which order)
      var a = 1 - dt / 24;
      if (f.what === 'throne') { ctx.strokeStyle = 'rgba(248,214,122,' + a + ')'; ctx.strokeRect(220.5, 53.5, 39, 71); }
      else { var lx = f.what === 'right' ? 330 : 150; ctx.fillStyle = 'rgba(255,226,140,' + (a * 0.45) + ')'; ctx.fillRect(lx - 12, 82, 25, 26); ctx.fillStyle = 'rgba(255,248,214,' + a + ')'; ctx.fillRect(lx - 2, 90, 5, 9); }
    }
    if (!this.st.dm) return;
    var cp = PD.camp(this.st), x = 22, w = 110, y = 120;
    this.btn(ctx, 'CAMPAIGN', x, y, w, 18, function () { self.go('camp'); }, { pri: true });
    this.btn(ctx, 'DOORS', x, y + 22, w, 16, function () { self.go('doors'); });
    D.text(ctx, '{y}' + PD.fmt(cp.purse) + '{/}  ' + cp.units.length + ' unit' + (cp.units.length === 1 ? '' : 's'), x + w / 2, y + 44, P('bone', 1), 'center');
  };

  // ------------------------------------------------------------------ the screens: the campaign, a shop, the units, the builder, the doors, the notes
  Pocket.prototype.backMore = function (s) {
    if (s === 'camp' || s === 'doors') { this.keep(); this.go('title'); return true; }
    if (s === 'shop' || s === 'units' || s === 'build') { this.keep(); this.go('camp'); return true; }
    if (s === 'feedback') { this.keep(); this.go('useful'); return true; }
    return false;
  };
  Pocket.prototype.scrolls = function (s) { return s === 'shop' || s === 'units' || s === 'build' || s === 'doors'; };
  Pocket.prototype.drawMore = function (ctx, s) {
    if (s === 'camp') this.drawCamp(ctx);
    else if (s === 'shop') this.drawShop(ctx);
    else if (s === 'units') this.drawUnits(ctx);
    else if (s === 'build') this.drawBuild(ctx);
    else if (s === 'doors') this.drawDoors(ctx);
    else if (s === 'feedback') this.drawFeedback(ctx);
  };
  function head(ctx, title, sub) {
    ctx.save(); ctx.translate(D.W / 2, 6); ctx.scale(2, 2); D.text(ctx, title, 0, 0, P('gold', 4), 'center'); ctx.restore();
    if (sub) D.text(ctx, sub, D.W / 2, 24, P('silver', 5), 'center');
  }
  function crOf(kind) { return String((D.FOES[kind] || {}).cr || '?'); }
  function nameOf(kind) { return (D.FOES[kind] || {}).name || kind; }
  function cut(s, w) { s = String(s); if (D.textWidth(s) <= w) return s; while (s.length > 1 && D.textWidth(s + '..') > w) s = s.slice(0, -1); return s + '..'; }

  // the campaign: the purse, the five shops, the units, the ladder of your own
  Pocket.prototype.drawCamp = function (ctx) {
    var self = this, st = this.st, cp = PD.camp(st);
    head(ctx, 'THE CAMPAIGN', 'your purse, your villains, your own ladder · CR in silver: 100 sp a CR');
    ctx.save(); ctx.translate(20, 36); ctx.scale(2, 2); D.text(ctx, PD.fmt(cp.purse), 0, 0, P('gold', 4)); ctx.restore();
    D.text(ctx, 'the purse · each ladder fight pays twice its CR in silver, won or lost', 20, 54, P('stone', 5));
    // the shops, an icon each
    var tw = 86, gap = 6, x0 = Math.round((D.W - (5 * tw + 4 * gap)) / 2), ty = 66, th = 44;
    PD.SHOPS.forEach(function (sh, i) {
      var x = x0 + i * (tw + gap), n = PD.shelf(sh).length;
      self.btn(ctx, '', x, ty, tw, th, function () { self.shop = sh.id; self.scroll = 0; self.go('shop'); });
      var ic = icon(sh.icon); ctx.drawImage(ic, 0, 0, 12, 12, x + tw / 2 - 12, ty + 4, 24, 24);
      var lines = sh.id === 'etc' ? ['ABERRATIONS,', 'OOZES, ETC.'] : [sh.name];
      lines.forEach(function (l, j) { D.text(ctx, l, x + tw / 2, ty + 29 + j * 8 - (lines.length - 1) * 4, P('bone', 2), 'center'); });
      D.text(ctx, '{g}' + n + '{/}', x + tw - 4, ty + 3, P('stone', 5), 'right');
    });
    // the units
    var us = PD.newest(cp), uy = 116;
    var uHead = 'THE UNITS  ' + us.length + (us.length ? ', newest first: ' : ' -- buy some in a shop'), uRoom = D.W - 130 - 20 - D.textWidth(uHead);
    D.text(ctx, '{y}THE UNITS{/}  ' + us.length + (us.length ? ', newest first: ' + cut(us.slice(0, 8).map(function (u) { return nameOf(u.kind) + ' (' + crOf(u.kind) + ')'; }).join(', '), uRoom) : ' -- buy some in a shop'), 20, uy + 3, P('bone', 1)); // (cut short of THE UNITS button)
    this.btn(ctx, 'THE UNITS', D.W - 110, uy, 90, 14, function () { self.scroll = 0; self.go('units'); }, { dis: !us.length, why: 'no units yet: buy one in a shop' });
    // the ladder of your own
    var ly = 136;
    D.text(ctx, '{y}YOUR LADDER{/}  ' + cp.plan.length + ' of ' + PD.SLOTS + ' slots' + (cp.plan.length ? '' : ' -- BUILD it: a floor, a CR, your units first'), 20, ly, P('bone', 1));
    for (var i = 0; i < PD.SLOTS; i++) {
      var sl = cp.plan[i], yy = ly + 11 + i * 10, tag = i === 4 ? 'TRIAL' : 'RUNG ' + (i + 1);
      if (!sl) { D.text(ctx, '{g}' + tag + '  --{/}', 28, yy, P('stone', 4)); continue; }
      D.text(ctx, '{y}' + tag + '{/}  ' + cut(((D.MAPS[sl.map] || {}).name || sl.map), 110) + '  {g}CR ' + PK.fmt8(PK.sum8(sl.foes || [])) + '{/}  ' + cut(PK.foesText(sl.foes || []), 250) + (sl.mine ? '  {n}(' + sl.mine + ' yours){/}' : ''), 28, yy, P('bone', 1));
    }
    var by = 200, ready = this.ready();
    this.btn(ctx, 'BUILD THE LADDER', 20, by, 130, 15, function () { self.scroll = 0; self.go('build'); }, { pri: true });
    this.btn(ctx, 'FIGHT YOUR LADDER', 156, by, 130, 15, function () { if (PD.startPlan(self)) self.go('cr'); }, { pri: true, dis: !cp.plan.length || !ready, why: !cp.plan.length ? 'no slots yet: BUILD THE LADDER' : 'every seat at THE PARTY wants a character' });
    this.btn(ctx, 'CLEAR IT', 292, by, 70, 15, function () { cp.plan = []; self.keep(); }, { dis: !cp.plan.length, small: true });
    this.btn(ctx, 'THE PARTY', 368, by, 92, 15, function () { self.go('party'); }, { small: true });
    D.text(ctx, 'struck from the random draw (' + cp.strike.length + ' of ' + PD.STRIKES + '): ' + (cp.strike.length ? cut(cp.strike.map(function (id) { return (D.MAPS[id] || {}).name || id; }).join(', '), 300) : 'none -- strike them on BUILD'), 20, 220, P('stone', 5));
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'SAVE CAMPAIGN', 88, 236, 114, 15, function () { self.saveTable(); });
    this.btn(ctx, 'LOAD CAMPAIGN', 208, 236, 114, 15, function () { self.loadTable(); });
    if (st.run) D.text(ctx, '{o}a ladder is under way: ' + (st.run.trial ? 'the trial' : 'rung ' + st.run.rung) + '{/}', D.W - 20, 240, P('fire', 1), 'right');
  };
  // a shop: its creatures priced top to bottom, or by name, or the dearest first
  var SORTS = [['cheap', 'PRICE: LOW FIRST'], ['dear', 'PRICE: HIGH FIRST'], ['name', 'BY NAME']];
  Pocket.prototype.drawShop = function (ctx) {
    var self = this, st = this.st, cp = PD.camp(st), sh = PD.SHOPS.filter(function (s) { return s.id === self.shop; })[0] || PD.SHOPS[0];
    var sort = this.shopSort || 'cheap', list = PD.shelf(sh, sort), per = 12;
    head(ctx, sh.name, sh.sub + ' · the purse: ' + PD.fmt(cp.purse));
    ctx.drawImage(icon(sh.icon), 0, 0, 12, 12, 14, 4, 24, 24);
    var from = Math.min(this.scroll, Math.max(0, list.length - per)); this.scroll = from;
    var have = {}; cp.units.forEach(function (u) { have[u.kind] = (have[u.kind] || 0) + 1; });
    // two kinds of one name on a shelf (the trooper and the trooper with the crossbow) are told apart by their first blow
    var nmN = {}; list.forEach(function (k) { var n = D.FOES[k].name; nmN[n] = (nmN[n] || 0) + 1; });
    var label = function (k) { var f = D.FOES[k], a = f.attacks && f.attacks[Object.keys(f.attacks)[0]]; return nmN[f.name] > 1 && a ? f.name + ' (' + a.name + ')' : f.name; };
    D.text(ctx, '{g}price{/}', 14, 34, P('stone', 5)); D.text(ctx, '{g}creature{/}', 112, 34, P('stone', 5)); D.text(ctx, '{g}CR{/}', 300, 34, P('stone', 5)); D.text(ctx, '{g}yours{/}', 350, 34, P('stone', 5));
    list.slice(from, from + per).forEach(function (k, i) {
      var yy = 44 + i * 15, cost = PD.price(k), f = D.FOES[k];
      self.btn(ctx, 'BUY  ' + PD.fmt(cost), 14, yy, 92, 13, function () {
        var r = PD.buy(st, k);
        if (r.ok) { self.keep(); self.say('bought ' + (/^[aeiou]/i.test(f.name) ? 'an ' : 'a ') + f.name + ' for ' + PD.fmt(cost) + ' -- ' + PD.fmt(PD.camp(st).purse) + ' left', 240); }
        else { D.sfx('error'); self.say(r.why, 300); }
      }, { small: true, dis: cp.purse < cost, why: 'the purse holds ' + PD.fmt(cp.purse) + ': a ladder fight pays twice its CR' });
      D.text(ctx, cut(label(k), 180), 112, yy + 3, P('bone', 1));
      D.text(ctx, crOf(k), 300, yy + 3, P('gold', 4));
      if (have[k]) D.text(ctx, '{n}' + have[k] + '{/}', 350, yy + 3, P('moss', 2));
      if (f.bound) D.text(ctx, '{g}water{/}', 380, yy + 3, P('stone', 5));
    });
    if (list.length > per) D.text(ctx, 'wheel: ' + (from + 1) + '-' + Math.min(list.length, from + per) + ' of ' + list.length, 14, 44 + per * 15 + 2, P('stone', 5));
    var si = SORTS.map(function (s) { return s[0]; }).indexOf(sort);
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, SORTS[si < 0 ? 0 : si][1], 88, 236, 130, 15, function () { self.shopSort = SORTS[(si + 1) % SORTS.length][0]; self.scroll = 0; }, { small: true });
    this.btn(ctx, 'THE UNITS (' + cp.units.length + ')', 224, 236, 110, 15, function () { self.scroll = 0; self.go('units'); }, { dis: !cp.units.length, why: 'no units yet' });
    var j = PD.SHOPS.indexOf(sh);
    this.btn(ctx, 'NEXT SHOP >', D.W - 110, 236, 90, 15, function () { self.shop = PD.SHOPS[(j + 1) % PD.SHOPS.length].id; self.scroll = 0; });
  };
  // the units: the receipts, newest first; one let go goes back to its shop for what was paid
  Pocket.prototype.drawUnits = function (ctx) {
    var self = this, st = this.st, cp = PD.camp(st), us = PD.newest(cp), per = 12;
    head(ctx, 'THE UNITS', us.length + ' · newest first · on a ladder each takes the place of a rolled foe of its CR · the purse: ' + PD.fmt(cp.purse));
    var from = Math.min(this.scroll, Math.max(0, us.length - per)); this.scroll = from;
    us.slice(from, from + per).forEach(function (u, i) {
      var yy = 38 + i * 15, d = new Date(u.at), when = (d.getMonth() + 1) + '-' + d.getDate() + ' ' + (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
      D.text(ctx, '{g}#' + u.id + '{/}', 14, yy + 3, P('stone', 5));
      D.text(ctx, cut(nameOf(u.kind), 170), 50, yy + 3, P('bone', 1));
      D.text(ctx, 'CR ' + crOf(u.kind), 230, yy + 3, P('gold', 4));
      D.text(ctx, '{g}' + PD.fmt(u.paid || PD.price(u.kind)) + '  ' + when + '{/}', 290, yy + 3, P('stone', 5));
      self.btn(ctx, 'LET GO', D.W - 70, yy, 56, 13, function () { var g = PD.dismiss(st, u.id); if (g) { self.keep(); self.say(nameOf(g.kind) + ' goes back to the shop: +' + PD.fmt(g.paid || PD.price(g.kind)), 240); } }, { small: true });
    });
    if (!us.length) D.text(ctx, 'no units yet: buy them in the campaign\'s shops', D.W / 2, 80, P('stone', 5), 'center');
    if (us.length > per) D.text(ctx, 'wheel: ' + (from + 1) + '-' + Math.min(us.length, from + per) + ' of ' + us.length, 14, 38 + per * 15 + 2, P('stone', 5));
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
  };
  // the builder (his: "Next to each map a CR up/down, when you click the map it puts it in the next available slot of your campaign ladder"), and the strikes
  Pocket.prototype.drawBuild = function (ctx) {
    var self = this, st = this.st, cp = PD.camp(st), ids = this.mapIds(), per = 11;
    head(ctx, 'BUILD YOUR LADDER', 'a floor clicked goes in the next empty slot at its CR: your newest units first, the rest rolled');
    var from = Math.min(this.scroll, Math.max(0, ids.length - per)); this.scroll = from;
    var dflt = this.crI >= 0 ? this.crI : 5;
    ids.slice(from, from + per).forEach(function (id, i) {
      var def = D.MAPS[id], yy = 36 + i * 16, ci = cp.mapCR[id] == null ? dflt : cp.mapCR[id], struck = cp.strike.indexOf(id) >= 0, full = cp.plan.length >= PD.SLOTS;
      self.btn(ctx, cut(def.name || id, 124), 14, yy, 132, 14, function () {
        if (cp.plan.length >= PD.SLOTS) { D.sfx('error'); self.say('all ' + PD.SLOTS + ' slots are full: clear one on the right', 240); return; }
        var cr8 = PK.VALUES[ci], f = PD.fill(self, id, cr8);
        cp.plan.push({ map: id, cr8: cr8, foes: f.foes, mine: f.mine }); self.keep();
        self.say((cp.plan.length === 5 ? 'THE TRIAL' : 'RUNG ' + cp.plan.length) + ': ' + (def.name || id) + ', ' + PK.foesText(f.foes) + (f.mine ? ' (' + f.mine + ' yours)' : ''), 300);
      }, { small: true, dis: full, why: 'all ' + PD.SLOTS + ' slots are full: clear one on the right' });
      if (def.dark) D.text(ctx, '{p}D{/}', 150, yy + 3, P('violet', 5));
      self.btn(ctx, '<', 160, yy, 14, 14, function () { cp.mapCR[id] = Math.max(0, ci - 1); self.keep(); }, { small: true });
      D.text(ctx, 'CR ' + PK.fmt8(PK.VALUES[ci]), 202, yy + 3, P('gold', 4), 'center');
      self.btn(ctx, '>', 230, yy, 14, 14, function () { cp.mapCR[id] = Math.min(PK.VALUES.length - 1, ci + 1); self.keep(); }, { small: true });
      self.btn(ctx, struck ? 'STRUCK' : 'STRIKE', 248, yy, 50, 14, function () {
        if (struck) cp.strike = cp.strike.filter(function (x) { return x !== id; });
        else if (cp.strike.length >= PD.STRIKES) { D.sfx('error'); self.say('three floors struck already: let one back in first', 240); return; }
        else cp.strike.push(id);
        self.keep();
      }, { small: true, on: struck });
    });
    if (ids.length > per) D.text(ctx, 'wheel: ' + (from + 1) + '-' + Math.min(ids.length, from + per) + ' of ' + ids.length + '  ·  {p}D{/} dark', 14, 36 + per * 16 + 2, P('stone', 5));
    // the slots
    var px = 306, pw = D.W - px - 8;
    D.win8(ctx, px, 34, pw, 172);
    D.text(ctx, '{y}YOUR LADDER{/}  ' + cp.plan.length + ' of ' + PD.SLOTS, px + 6, 40, P('bone', 1));
    for (var i = 0; i < PD.SLOTS; i++) {
      (function (i) {
        var sl = cp.plan[i], yy = 54 + i * 30, tag = i === 4 ? 'THE TRIAL' : 'RUNG ' + (i + 1);
        if (!sl) { D.text(ctx, '{g}' + tag + ': the next floor clicked' + (i === cp.plan.length ? '' : '') + '{/}', px + 6, yy, P('stone', 4)); return; }
        D.text(ctx, '{y}' + tag + '{/}  ' + cut((D.MAPS[sl.map] || {}).name || sl.map, pw - 90), px + 6, yy, P('bone', 1));
        D.text(ctx, '{g}CR ' + PK.fmt8(PK.sum8(sl.foes || [])) + (sl.mine ? '  ' + sl.mine + ' yours' : '') + '{/}', px + 6, yy + 9, P('stone', 5));
        D.text(ctx, cut(PK.foesText(sl.foes || []), pw - 12), px + 6, yy + 18, P('bone', 1));
        self.btn(ctx, 'x', px + pw - 18, yy - 2, 12, 11, function () { cp.plan.splice(i, 1); self.keep(); }, { small: true });
        self.btn(ctx, 'R', px + pw - 32, yy - 2, 12, 11, function () { var f = PD.fill(self, sl.map, sl.cr8); sl.foes = f.foes; sl.mine = f.mine; self.keep(); }, { small: true }); // (filled again: the units as they stand now, a fresh roll for the rest)
      })(i);
    }
    D.text(ctx, '{g}R{/} fills it again  ·  {g}x{/} clears it', px + 6, 196, P('stone', 5));
    D.text(ctx, 'STRIKE keeps a floor out of every random draw at this table (' + cp.strike.length + ' of ' + PD.STRIKES + ')', 14, 224, P('stone', 5));
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'FIGHT YOUR LADDER', D.W - 150, 236, 130, 15, function () { if (PD.startPlan(self)) self.go('cr'); }, { pri: true, dis: !cp.plan.length || !this.ready(), why: !cp.plan.length ? 'click a floor first' : 'every seat at THE PARTY wants a character' });
  };

  // DOORS: every door of URLS.md (10-08 and before), opened in a tab of its own so the table stays where it is
  PD.DOORS = [
    ['THE 8-BIT GAME', '../', 'the story, from the title'],
    ['ROUND SIX', '../?round6', 'all four at 4th on Fountain Street, nearly every quest done'],
    ['LEVEL THREE', '../?lvl3', 'all four just made 3rd, the first two quests done'],
    ['DOWN TO THE WET', '../?at=wet3&lead=lymen', 'a level-3 party led by Lymen, the gates down to the Wet open'],
    ['PRONE, 8-BIT', '../?at=prone8', 'a show: sleet over two ogres and a worg, each falling on its side'],
    ['THE SKYLIGHTS', '?fight=edifice', 'the Edifice\'s defend fight: two stone giants, two trolls, Pyro'],
    ['THE SKYLIGHTS, TALL', '?fight=edifice&hscale=2', 'the same with every height drawn twice as tall'],
    ['GREYFANG\'S PIT', '?fight=greyfang', 'the Harbinger comes for GreyFang in public; GreyFang\'s end'],
    ['GREYFANG\'S PIT, READ', '?fight=greyfang&callN=read', 'the pack, the toying and the mirror double read off the party'],
    ['THE HARBINGER', '?fight=harbinger', 'the made gnoll on the Gnoll Hills: the ladder\'s 7th'],
    ['RINGS OF FLYING', '?fight=flyingrings', 'four rings in the pack, put them on and fly at bats and stirges'],
    ['RINGS OF FLYING, WATCHED', '?fight=flyingrings&watch', 'the AI puts the rings on and flies'],
    ['THE ONE GALLERY', '?gallery&from=pocket', 'spells, features, the Mascots, every creature\'s rows'],
    ['THE KEEPER\'S LOOKS', '?fxgallery&keeper', 'the Keeper\'s looks and rules, a scene at a time'],
    ['ROWS: DARKMANTLE', '?rows=darkmantle', 'every row of a creature\'s sheet (rows=<creature>)'],
    ['SHOW: THE GRICK', '?show=grick', 'two of a creature against four watchers, every row twice'],
    ['THE GAME SHOW', '?gameshow', 'the Monster Party Game Show: the lighthouse, the jump in'],
    ['THE GAME SHOW AT THE LAMP', '?gameshow&at=lamp', 'straight to Third Lamp Station'],
    ['THE MASCOT GALLERY', '?mpgallery', 'the four Mascots\' kits, an ability at a time, 1st to 9th'],
    ['THE MASCOTS, OPEN', '?pocket&mascots', 'this table with all four Mascots on the roster'],
    ['THE LADDER', '?ladder', 'the story\'s fights, rung by rung, the four heroes'],
    ['THE TESTER LADDER', '?ladder&party=ours', 'Talmok, Willem, Katarina, Torvald: watched, or P to play'],
    ['THE CLIMB', '?climb', 'one party from 1st to 9th'],
    ['THE CLASS FLOOR', '?npc=cleric,wizard&lvl=5', 'the listed foes against our four at a level'],
    ['HIDEOUS LAUGHTER', '?npc=hyena,hyena,hyena&vs=bard&lvl=3', 'a bard against three hyenas: cast it yourself'],
    ['SEVEN FAMILIARS', '?npc=clacker,goblin,goblin&vs=wizard,wizard,wizard,wizard,wizard,wizard,wizard&fam=owl,snowyowl,bat,rat,spider,frog,snake&lvl=5&dark', 'seven wizards, one of each familiar, in the dark'],
    ['THE CLACKERS', '?npc=clacker,clacker&lvl=4', 'two clackers against our four at 4th'],
    ['THE COCOON GALLERY', './', 'two drow captains and a phase spider'],
    ['THE GATE', '?gate', 'the stop-and-look gate'],
    ['THE CAVERN', '?view', 'the cavern with a cursor, and no fight'],
    ['THE BROKEN CARD', '?broke', 'the card a door shows when it breaks, with a sample'],
    ['TEST RUNS', '../test-runs.html', 'the page that builds any URL of the game, row by row'],
    ['SITUATIONS PAGE', '../situations.html', 'the eyes rows and the ?at= situations, marked and saved'],
    ['EVERY URL', 'https://github.com/GrimGriz/dragonsleep-8bit/blob/main/URLS.md', 'URLS.md: the whole list, with what each does']
  ];
  PD.doorUrl = function (u) { if (/^https?:/.test(u)) return u; if (/^\.\.\//.test(u) || u === './') return new URL(u, location.href).href; return location.origin + location.pathname + u; };
  Pocket.prototype.drawDoors = function (ctx) {
    var self = this, per = 11, list = PD.DOORS;
    head(ctx, 'DOORS', 'every door of the game, each in a tab of its own · the whole list is URLS.md');
    var from = Math.min(this.scroll, Math.max(0, list.length - per)); this.scroll = from;
    list.slice(from, from + per).forEach(function (r, i) {
      var yy = 36 + i * 16;
      self.btn(ctx, cut(r[0], 150), 14, yy, 160, 14, function () { self.open(PD.doorUrl(r[1])); }, { small: true });
      D.text(ctx, cut(r[2], D.W - 200), 182, yy + 3, P('bone', 1));
    });
    if (list.length > per) D.text(ctx, 'wheel: ' + (from + 1) + '-' + Math.min(list.length, from + per) + ' of ' + list.length, 14, 36 + per * 16 + 2, P('stone', 5));
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
  };

  // ------------------------------------------------------------------ SITUATIONS: the notes, and their own file
  PD.feedbackFile = function (pk) {
    var st = pk.st, sh = pk.sheets(), run = st.run, cp = st.camp, fights = (st.fights || []).slice(0, 5);
    return {
      game: 'DRAGONSLEEP', kind: 'hero-situations-feedback', v: 1, at: new Date().toISOString(), notes: String((st.feedback || {}).draft || ''),
      edition: st.dm ? 'the DM\'s Pocket DM' : 'release', page: location.origin + location.pathname,
      campaign: {
        party: sh.map(function (s) { return s.h ? { name: s.h.name, cls: s.h.cls, lvl: s.h.lvl, word: PK.wordOf(st, s.slot) } : null; }).filter(Boolean),
        roster: (st.roster || []).map(function (c) { return { name: c.name, cls: c.cls, lvl: c.lvl, code: c.code }; }), pyro: !!st.pyro, mascots: st.mascots || {},
        ladder: run ? { rung: run.trial ? 'trial' : run.rung, won: run.won || 0, map: run.map, foes: run.foes, built: !!run.plan } : null,
        dm: cp ? { purse: PD.fmt(cp.purse), units: (cp.units || []).map(function (u) { return u.kind; }), strike: cp.strike || [], ladder: (cp.plan || []).map(function (s) { return s.map + ' CR ' + PK.fmt8(s.cr8); }) } : null
      },
      fights: fights.map(function (f) { return { at: new Date(f.t).toISOString(), result: f.result, rounds: f.rounds, foes: f.foes, cr: f.cr, diff: f.diff, map: f.mapName, party: f.party, rung: f.rung, notes: f.notes || '' }; })
    };
  };
  PD.feedbackName = function (d) { d = d || new Date(); var p = function (n) { return (n < 10 ? '0' : '') + n; }; return 'hero_situations_feedback-' + d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + '-' + p(d.getUTCHours()) + p(d.getUTCMinutes()) + 'Z.json'; };
  Pocket.prototype.saveFeedback = function () {
    var st = this.st, fb = st.feedback = st.feedback || {}, text = String(fb.draft || '');
    if (!text.trim()) { D.sfx('error'); this.say('nothing written yet: type what you noticed, then SAVE', 300); return null; }
    var name = PD.feedbackName();
    try {
      var a = document.createElement('a'), url = URL.createObjectURL(new Blob([JSON.stringify(PD.feedbackFile(this), null, 1)], { type: 'application/json' }));
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    } catch (e) { this.msg = { text: 'could not write the file: ' + e, t: 300, bad: true }; return null; }
    fb.saved = new Date().toISOString(); fb.n = (fb.n || 0) + 1;
    var goose = MP && MP.unlock ? MP.unlock(st, 'goose') : false; // (the first notes saved: Goose -- MP.unlock says true only the once)
    this.keep();
    this.say('saved ' + name + ' -- where your browser puts downloads', 360);
    if (goose) PD.egg(this, 'goose');
    return name;
  };
  Pocket.prototype.drawFeedback = function (ctx) {
    var self = this, st = this.st, fb = st.feedback = st.feedback || {};
    head(ctx, 'SITUATIONS', 'what did you notice? what broke, what surprised you, what felt right or wrong -- in your own words');
    if (!this.egg) this.useField('area', { x: 20, y: 36, w: D.W - 40, h: 170 }, fb.draft || '', function (v) { fb.draft = v; self.keep(); }); // (the box sits over the canvas: not over an egg)
    D.text(ctx, 'SAVE writes hero_situations_feedback-<the time>.json, your party and campaign in it' + (fb.saved ? '  ·  {y}last saved ' + new Date(fb.saved).toLocaleTimeString() + '{/}' : ''), 20, 214, P('stone', 5));
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'SAVE', D.W - 100, 236, 80, 15, function () { self.saveFeedback(); }, { pri: true });
    this.btn(ctx, 'THE DISCORD', D.W - 200, 236, 90, 15, function () { self.open(PK.DISCORD); }, { small: true });
  };

  // ------------------------------------------------------------------ the eggs: Denny on the first character made, Beholda on the first campaign saved (the release
  // edition's), Goose on the first notes saved; and the door itself
  var made0 = Pocket.prototype.saveMade;
  Pocket.prototype.saveMade = function () {
    var r = made0.apply(this, arguments);
    if (MP && MP.unlock && MP.unlock(this.st, 'denny')) { this.keep(); PD.egg(this, 'denny'); }
    return r;
  };
  Pocket.prototype.onCampaignSaved = function () {
    if (this.st.dm || !MP || !MP.unlock) return; // (his "when you haven't bothered to do the 3 clicks": at the DM's table she is already there)
    if (MP.unlock(this.st, 'beholda')) { this.keep(); PD.egg(this, 'beholda'); }
  };
  // the words are the seat's drafts (CLAUDE.md: the drafts stand till he changes them; invented.json pocket-dm-eggs)
  PD.EGGS = {
    dm: { title: 'THE DM\'S POCKET DM', lines: ['The high seat takes you.', 'Every creature on the shelves, every door of the game, and a campaign of your own: CAMPAIGN and DOORS, on the left.', '{g}The seat, the right lamp, the left lamp again puts it away.{/}'], sfx: 'levelup' },
    release: { title: 'THE RELEASE EDITION', lines: ['The high seat is empty again.', '{g}Your campaign keeps; the DM\'s screens wait behind the same three.{/}'], sfx: 'cancel' },
    denny: { who: 'denny', title: 'DENNY JOINS THE ROSTER', lines: ['A Lobstamonkee in a denim jacket drops off the high seat.', '"Somebody new at the table? Make room. DENIM DAMAGE!"', '{g}Denny is on the roster now: cycle a seat at THE PARTY.{/}'], sfx: 'levelup', clip: 'audio/denim_damage.mp3' },
    beholda: { who: 'beholda', title: 'BEHOLDA JOINS THE ROSTER', lines: ['An eye opens in the Sunshaft\'s light, and floats down to the stone.', '"A whole campaign, saved? Oh, I have to watch this one."', '{g}Beholda is on the roster now: cycle a seat at THE PARTY.{/}'], sfx: 'levelup' },
    goose: { who: 'goose', title: 'GOOSE JOINS THE ROSTER', lines: ['HONK.', '"You wrote it down! Somebody reads these, you know."', '{g}Goose is on the roster now: cycle a seat at THE PARTY.{/}'], sfx: 'honk' }
  };
  PD.egg = function (pk, id) {
    var e = PD.EGGS[id]; if (!e) return;
    pk.dropField();
    pk.egg = { id: id, t0: pk.t };
    if (e.who) { var sp = null; try { sp = D.npc.spec(e.who + ':5'); } catch (x) { sp = null; } pk.egg.look = PK.lookOf(sp); if (pk.egg.look) D.spr.ensure([pk.egg.look]); }
    D.sfx(e.sfx);
    if (e.clip && D.clip) setTimeout(function () { D.clip(e.clip, function () { }); }, 500);
    if (id === 'goose') setTimeout(function () { D.sfx('honk'); }, 700);
  };
  Pocket.prototype.eggUpdate = function () {
    var g = this.egg; if (!g) return;
    if (this.t - g.t0 < 40) return; // (a beat before it can be let go: a click that saved is not the click that closes)
    if (I.pressed('a') || I.pressed('b') || I.mouse.click) { D.sfx('confirm'); var back = this.screen; this.egg = null; if (back === 'feedback') this.go('feedback'); }
  };
  Pocket.prototype.drawEgg = function (ctx) {
    var g = this.egg, e = PD.EGGS[g.id], dt = this.t - g.t0, a = Math.min(1, dt / 20);
    ctx.fillStyle = 'rgba(5,4,10,' + (0.72 * a) + ')'; ctx.fillRect(0, 0, D.W, D.H);
    var w = 380, h = 150, x = (D.W - w) / 2, y = 54 + Math.round((1 - a) * 20);
    // the burst behind the window: gold rays turning
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(D.W / 2, y + 50);
    for (var i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6 + dt / 400); ctx.fillStyle = 'rgba(248,214,122,' + (0.06 * a) + ')'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, -170); ctx.lineTo(14, -170); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    D.win8(ctx, x, y, w, h);
    ctx.save(); ctx.translate(D.W / 2, y + 8); ctx.scale(2, 2); D.text(ctx, '{y}' + e.title + '{/}', 0, 0, P('gold', 4), 'center'); ctx.restore();
    var ty = y + 30, tx = x + 16, tw = w - 32;
    if (g.look) {
      var fx = x + 50, fy = y + 112;
      if (D.spr.has(g.look)) { ctx.save(); ctx.globalAlpha = a; D.spr.draw(ctx, g.look, 'idle', 0, this.t, fx, fy, {}); ctx.restore(); }
      else if (!D.spr.failed(g.look)) D.text(ctx, ['.', '..', '...'][(this.t >> 4) % 3], fx, fy - 30, P('stone', 5), 'center');
      for (var s = 0; s < 8; s++) { var an = s * Math.PI / 4 + dt / 30, rr = 26 + Math.sin(dt / 12 + s) * 4; ctx.fillStyle = s % 2 ? P('gold', 4) : P('bone', 2); ctx.fillRect(Math.round(fx + Math.cos(an) * rr), Math.round(fy - 26 + Math.sin(an) * rr * 0.8), 2, 2); }
      tx = x + 100; tw = w - 116;
    }
    e.lines.forEach(function (l) { D.wrap(l, tw).forEach(function (t) { D.text(ctx, t, tx, ty, P('bone', 1)); ty += 10; }); ty += 4; });
    if (dt >= 40) D.hint(ctx, 'E, X or a click', D.W / 2, y + h - 12, P('stone', 4), 'center');
  };

  // ------------------------------------------------------------------ the shops' icons, 12 x 12 (as js/icons.js draws the ring's: a map, the palette's colours)
  var ICONS = {
    paw: ['............', '..oo....oo..', '.oLLo..oLLo.', '.oLLo..oLLo.', '..oo.oo.oo..', '....oLLo....', '..ooLLLLoo..', '.oLLLllLLLo.', '.oLLllllLLo.', '..oLLLLLLo..', '...oooooo...', '............'],
    claw: ['............', '..oooo......', '.oRRRRo.....', 'oRRRRRRo....', 'oRRooRRRo...', '.oo..oRRRo..', '......oRRRoo', '...oooooRRRo', '..oRRRRRRRo.', '.oRRRRRRRo..', '..oooooo....', '............'],
    sword: ['.........oo.', '........oSso', '.......oSso.', '......oSso..', '.oo..oSso...', '.ogo.Sso....', '..ogoso.....', '...ogo......', '..oLgo......', '.oLo.ogo....', 'oLo...oo....', '.o..........'],
    boulder: ['............', '....oooo....', '..ooSSSSoo..', '.oSSsSSSSSo.', '.oSsssSSSSo.', 'oSSSSSSsSSSo', 'oSSSSSSssSSo', 'oSSsSSSSSSSo', '.oSSSSSSSSo.', '..ooSSSSoo..', '....oooo....', '............'],
    eye: ['............', '....oooo....', '..ooVVVVoo..', '.oVVwwwwVVo.', 'oVVwwoowwVVo', 'oVwwooMowwVo', 'oVwwoooowwVo', 'oVVwwoowwVVo', '.oVVwwwwVVo.', '..ooVVVVoo..', '....oooo....', '............']
  };
  var icache = {};
  function icon(name) {
    if (icache[name]) return icache[name];
    var R = D.PAL.ramps, col = { o: R.outline[0], w: R.bone[2], s: R.silver[6], S: R.silver[4], g: R.gold[3], R: R.red[4], L: R.leather[3], l: R.leather[1], V: R.violet[4], M: R.moss[2] };
    var map = ICONS[name] || ICONS.eye, cv = document.createElement('canvas'); cv.width = 12; cv.height = 12;
    var x = cv.getContext('2d');
    for (var r = 0; r < 12; r++) for (var q = 0; q < 12; q++) { var ch = map[r][q]; if (ch !== '.' && col[ch]) { x.fillStyle = col[ch]; x.fillRect(q, r, 1, 1); } }
    return (icache[name] = cv);
  }
  PD.icon = icon;
})();
