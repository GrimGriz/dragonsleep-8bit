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
   a CR (1/8 is 12 sp 5 cp -- the purse is kept in copper; CR 0 is 10 sp, his "CR 0 at 10 SP or something"). A purchase is a receipt; receipts picked (click, shift+
   click, ctrl+click) and bound are one UNIT, its CR theirs summed (his: "Visiting Barbarian and two stable fighters - that was supposed to make a 'unit'"). THE
   LADDER (his: "a ladder button, where their stored units replace randomly assigned units on the ladder" -- "3 - yes"; "build a ladder. Next to each map a CR
   up/down, when you click the map it puts it in the next available slot of your campaign ladder, fills CR with units first, from most recently created units
   first"): a table's CR filled with whole units, the newest first, never spent, each once a table; five slots, four rungs and the trial; three floors struck
   from the random draw ("4 - yes": his "limited number of ladder map exclusions").
   BOTH EDITIONS: DOORS' SITUATIONS (USEFULS' till 10-17) opens a notes box that saves hero_situations_feedback-<UTC>.json, the campaign's particulars in it ("separate from the
   campaign file (but includes pertinent information from the campaign file)"; "No on opening the situations page ... we'll just see what they notice enough to
   type about"). THE EGGS, a Mascot each (10-06 night: "'make your own character the first time' = unlock denny"; 10-09: "Making a campaign should unlock Beholda
   when you haven't bothered to do the 3 clicks"; Goose: "let this unlock a lobstamonkee - flash an easter egg the first time they've actually typed something in
   and pressed the save button" -- "Goose is the only one I personally can't select at the moment"; Rascal: "Creating first 'unit' ;)"): js/mpmon.js MP.unlock keeps
   them in st.mascots. */
'use strict';
(function () {
  var D = window.D16, I = D.input, PK = D.pocket, Pocket = D.Pocket, MP = D.mpmon, NPC = D.npc, DS = window.DS;
  if (!PK || !Pocket) return;
  var P = function (r, i) { return D.PAL.ramps[r][i]; };
  var PD = D.pocketdm = {};

  // ------------------------------------------------------------------ the DM's roster: GreyFang (js/classes.js NPC.NAMED.greyfang, a ranger to his 11), and every Mascot
  var pyAt = PK.STOCK.map(function (s) { return s.w; }).indexOf('pyro');
  PK.STOCK.splice(pyAt < 0 ? PK.STOCK.length : pyAt, 0, { w: 'greyfang', lo: 1, hi: 11, dm: true },
    // the story's villains of a class on the play roster at the DM's table (10-17, step C; Griz: "allows villains in the play roster in that mode also"): the Gray
    // Keeping's two matriarchs, clerics of the Keeping by js/classes.js NPC.NAMED (their bestiary blocks on THE VILLAINS' shelf, gnollmatriarcheldest and -lama)
    { w: 'matriarch', lo: 1, hi: 12, dm: true, villain: true }, { w: 'matriarchlama', lo: 1, hi: 12, dm: true, villain: true });
  if (MP && MP.unlocked) { var unl0 = MP.unlocked; MP.unlocked = function (st, w) { return !!(st && st.dm) || unl0(st, w); }; }

  // ------------------------------------------------------------------ the campaign's store (st.camp, kept with the rest in deep16.pocket and in SAVE CAMPAIGN's file)
  PD.START = 10000;          // the purse at the start: 1000 sp, in copper
  PD.CP8 = 125;              // an eighth of a CR in copper: 100 sp a CR, so 50 sp is 1/2 and 12 sp 5 cp is 1/8
  PD.CP0 = 100;              // a CR 0 creature: 10 sp (10-09, Griz: "CR 0 at 10 SP or something, should be able to include them")
  PD.SLOTS = 5;              // the built ladder: four rungs and the trial
  PD.STRIKES = 3;            // the floors the random draw may be kept off
  // THE RECEIPTS AND THE UNITS (10-09, Griz, on the first cut: "I went to the store and got Visiting Barbarian and two stable fighters - that was supposed to make a
  // 'unit'. click, shift click and ctrl click to select units then a 'bind as unit' button?"): a purchase is a receipt (c.bought); receipts picked and bound are ONE
  // unit (c.units: { id, members: [{ kind, paid }], at }), its CR the sum of theirs -- the unit is what a ladder takes, whole
  PD.camp = function (st) {
    var c = st.camp = st.camp && typeof st.camp === 'object' ? st.camp : {};
    if (typeof c.purse !== 'number') c.purse = PD.START;
    c.bought = Array.isArray(c.bought) ? c.bought : []; c.units = Array.isArray(c.units) ? c.units : [];
    // (the first cut's units were single purchases: those are receipts, to bind)
    if (c.units.some(function (u) { return u && u.kind && !u.members; })) { c.bought = c.bought.concat(c.units.filter(function (u) { return u && u.kind && !u.members; })); c.units = c.units.filter(function (u) { return u && u.members; }); }
    c.strike = Array.isArray(c.strike) ? c.strike : []; c.plan = Array.isArray(c.plan) ? c.plan : [];
    c.mapCR = c.mapCR && typeof c.mapCR === 'object' ? c.mapCR : {}; c.next = c.next || 1;
    // (10-17, step C) the maps bought (c.maps: { id, paid, at }), the modules by name (c.modules: { id, name, about, slots, at }; c.edit the one on BUILD), the
    // stock cards' marks (c.marks: word -> 'villain' | 'only'), a stock villain's level on the shelf (c.vlvl)
    c.maps = Array.isArray(c.maps) ? c.maps : []; c.modules = Array.isArray(c.modules) ? c.modules : [];
    c.marks = c.marks && typeof c.marks === 'object' ? c.marks : {}; c.vlvl = c.vlvl && typeof c.vlvl === 'object' ? c.vlvl : {};
    // (the one ladder of 10-09 to 10-17 is a module now, its rests as its file read: a short rest and the market between, a long rest before a fifth)
    if (c.plan.length && !c.planMoved) {
      var m0 = PK.moduleOf({ game: 'DRAGONSLEEP', kind: PK.LADDER_KIND, plan: c.plan });
      c.modules.push({ id: c.next++, name: 'YOUR LADDER', about: '', at: Date.now(), slots: c.plan.map(function (s, i) { return Object.assign(JSON.parse(JSON.stringify(s)), { rest: m0 && m0.slots[i] ? m0.slots[i].rest : { short: true, long: false, market: false } }); }) });
      c.plan = []; c.planMoved = true;
    }
    // (a map a module already stands on is the campaign's, paid nothing: what was built before THE LOCATIONS keeps its floors)
    c.modules.forEach(function (m) { (m.slots || []).forEach(function (s) { if (s && s.map && D.MAPS[s.map] && !c.maps.some(function (x) { return x.id === s.map; })) c.maps.push({ id: s.map, paid: 0, at: Date.now() }); }); });
    return c;
  };
  PD.price = function (kind) { var f = PK.foe(kind); if (!f) return 0; var e = PK.cr8(f.cr); return e > 0 ? e * PD.CP8 : PD.CP0; }; // (a villain's word at its level's CR, js/pocket.js PK.foe)
  PD.unitCR8 = function (u) { return PK.sum8((u.members || []).map(function (m) { return m.kind; })); };
  PD.unitKinds = function (u) { return (u.members || []).map(function (m) { return m.kind; }); };
  PD.unitName = function (u) { return PK.foesText(PD.unitKinds(u)); };
  PD.fmt = function (cp) {
    cp = Math.round(cp || 0); var neg = cp < 0; cp = Math.abs(cp);
    var sp = Math.floor(cp / 10), c = cp % 10, s = String(sp).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + s + ' sp' + (c ? ' ' + c + ' cp' : '');
  };
  // the units in the order a table takes them: the newest first (his "from most recently created units first"), and a unit that has fought on a ladder at the back of
  // the line, the longest ago used first (10-09b, Griz: "Once a unit is used in a ladder, treat it as 'used' or 'purchased last'"); `back` (the builder's) puts units
  // already in a slot behind the rest, by the slot, so five slots built in a row don't all take the same newest unit
  PD.newest = function (cp, back) {
    back = back || {};
    var rank = function (u) { return back[u.id] != null ? 1e15 + back[u.id] : (u.usedAt || 0); };
    return cp.units.slice().sort(function (a, b) { var ra = rank(a), rb = rank(b); if (!ra !== !rb) return ra ? 1 : -1; if (ra && rb && ra !== rb) return ra - rb; return (b.at - a.at) || (b.id - a.id); });
  };
  PD.placed = function (plan, skip) { var back = {}; (plan || []).forEach(function (s, i) { if (i !== skip) (s.units || []).forEach(function (id) { if (back[id] == null) back[id] = i; }); }); return back; };
  function water(mapId) { var def = D.MAPS[mapId]; return !!def && def.rows.join('').indexOf('~') >= 0; }
  function fits(kind, mapId) { var f = PK.foe(kind); return !!f && !(f.bound && !water(mapId)); }

  // ------------------------------------------------------------------ the five shops
  PD.SHOPS = [
    { id: 'beasts', name: 'BEASTS', types: ['beast'], icon: 'paw', sub: 'the wild and the hungry' },
    { id: 'monstrosities', name: 'MONSTROSITIES', types: ['monstrosity'], icon: 'claw', sub: 'the made wrong and the made on purpose' },
    { id: 'humanoids', name: 'HUMANOIDS', types: ['humanoid'], icon: 'sword', sub: 'bandits, drow, gnolls, the plain folk' }, // (the story's named to VILLAINS, RULED 10-17: "4-8 yes")
    { id: 'giants', name: 'GIANTS', types: ['giant'], icon: 'boulder', sub: 'the big ones' },
    { id: 'etc', name: 'ABERRATIONS, OOZES, ETC.', short: 'ABERRATIONS, OOZES, ETC.', types: null, icon: 'eye', sub: 'aberrations, oozes, elementals, the undead, the rest' },
    // THE VILLAINS (10-17, step C; Griz: "pull villains into a new store and allow 'make' from there as well as going through the existing roster and being able to
    // mark as villain or villain only"): the story's named, of every type, and yours -- made here, or marked on THE MARKS -- at their level's CR (PK.levelCR)
    { id: 'villains', name: 'VILLAINS', named: true, icon: 'crown', sub: 'the story\'s named, and your own: made here or marked from the roster' }
  ];
  var TYPED = ['beast', 'monstrosity', 'humanoid', 'giant'];
  PD.OUT = ['keeperold', 'stonegiantm', 'gnollgray', 'gloryseekergray', 'gnollmatriarch', 'gnollmatriarchguard']; // (the ladder's old Keeper; the stone giant's second look and the Gray Keeping's gnolls and matriarchs, the same blocks -- one of each on the shelf)
  PD.shelf = function (shop, sort) {
    var out = Object.keys(D.FOES).filter(function (k) {
      var f = D.FOES[k]; if (!f || /^fam_/.test(k) || f.object || PD.OUT.indexOf(k) >= 0) return false; // (CR 0 on the shelves since his 10-09, at 10 sp: a hyena in a unit)
      if (shop.named || f.named) return !!shop.named && !!f.named; // (the story's named on THE VILLAINS' shelf alone)
      return shop.types ? shop.types.indexOf(f.type) >= 0 : TYPED.indexOf(f.type) < 0;
    });
    var nm = function (k) { return String(D.FOES[k].name || k); };
    out.sort(sort === 'name' ? function (a, b) { return nm(a) < nm(b) ? -1 : nm(a) > nm(b) ? 1 : 0; }
      : sort === 'dear' ? function (a, b) { return PD.price(b) - PD.price(a) || (nm(a) < nm(b) ? -1 : 1); }
      : function (a, b) { return PD.price(a) - PD.price(b) || (nm(a) < nm(b) ? -1 : 1); });
    return out;
  };
  // a purchase is a receipt, to bind into a unit
  PD.buy = function (st, kind) {
    var cp = PD.camp(st), cost = PD.price(kind), fk = PK.foe(kind);
    if (!fk || cost <= 0) return { ok: false, why: 'not for sale' };
    if (cp.purse < cost) return { ok: false, why: 'the purse holds ' + PD.fmt(cp.purse) + ': ' + fk.name + ' is ' + PD.fmt(cost) };
    cp.purse -= cost; var r = { id: cp.next++, kind: kind, at: Date.now(), paid: cost }; cp.bought.push(r);
    return { ok: true, receipt: r };
  };
  // a receipt let go goes back to its shop for what was paid (the seat's call: the purse is a limit on how many at once, not a tax)
  PD.dismiss = function (st, id) {
    var cp = PD.camp(st), r = cp.bought.filter(function (x) { return x.id === id; })[0]; if (!r) return null;
    cp.bought = cp.bought.filter(function (x) { return x !== r; }); cp.purse += r.paid || PD.price(r.kind); return r;
  };
  // BIND AS UNIT: the receipts picked become one unit (in the order bought); UNBIND gives them back as receipts
  PD.bind = function (st, ids) {
    var cp = PD.camp(st), pick = cp.bought.filter(function (x) { return ids.indexOf(x.id) >= 0; });
    if (!pick.length) return null;
    cp.bought = cp.bought.filter(function (x) { return pick.indexOf(x) < 0; });
    var u = { id: cp.next++, members: pick.map(function (x) { return { kind: x.kind, paid: x.paid }; }), at: Date.now() };
    cp.units.push(u);
    return u;
  };
  PD.unbind = function (st, id) {
    var cp = PD.camp(st), u = cp.units.filter(function (x) { return x.id === id; })[0]; if (!u) return null;
    cp.units = cp.units.filter(function (x) { return x !== u; });
    u.members.forEach(function (m) { cp.bought.push({ id: cp.next++, kind: m.kind, at: Date.now(), paid: m.paid }); });
    return u;
  };

  // ------------------------------------------------------------------ the units on a ladder
  // a table at a CR, filled from the units first (his 4: "fills CR with units first, from most recently created units first"): each unit whole, the newest first, while its
  // CR fits what is left and its heads fit the floor's room; each unit once a table, never spent; the rest rolled from the DM's pot. The dial's own ladder (his 3: "their stored
  // units replace randomly assigned units on the ladder") is the same at the rung's rolled CR: the units take the place of rolled foes, the CR the same
  PD.fill = function (pk, mapId, cr8, back) {
    var cp = PD.camp(pk.st), room = PK.roomOn(mapId), rem = cr8, take = [], used = [];
    PD.newest(cp, back).forEach(function (u) {
      var ks = PD.unitKinds(u), c = PD.unitCR8(u);
      if (!ks.length || c > rem || take.length + ks.length > room || !ks.every(function (k) { return fits(k, mapId); })) return;
      if (c === 0 && rem === 0) return; // (a unit of CR 0s rides with a table that has CR to fill, not on its own)
      take = take.concat(ks); rem -= c; used.push(u.id);
    });
    var rest = rem > 0 && take.length < room ? PK.roll(rem, PK.pot(pk.words(), mapId, true), room - take.length) : [];
    return { foes: take.concat(rest), mine: take.length, units: used };
  };
  Pocket.prototype.ladderFoes = function (kinds, mapId) {
    if (!this.st.dm || !PD.camp(this.st).units.length) return kinds;
    var r = PD.fill(this, mapId, PK.sum8(kinds)); if (this.st.run) { this.st.run.mine = r.mine; this.st.run.units = r.units; }
    return r.foes;
  };
  Pocket.prototype.planRung = function (run) {
    if (!run || !run.plan) return false;
    var slot = run.plan[run.trial ? 4 : run.rung - 1]; if (!slot) return false;
    var map = this.mapIds().indexOf(slot.map) >= 0 ? slot.map : this.randomMap();
    var fresh = !run.module && (this.rerolling || !slot.foes || !slot.foes.length || map !== slot.map); // (a module's foes are its own, whatever floor: js/pocket.js startModule, 10-17)
    var f = fresh ? PD.fill(this, map, slot.cr8) : { foes: slot.foes.slice(), mine: slot.mine || 0, units: (slot.units || []).slice() };
    this.fightMap = run.map = map; this.foes = run.foes = f.foes; run.mine = f.mine; run.units = f.units;
    return true;
  };
  // ------------------------------------------------------------------ THE MODULES of the campaign (10-17, step C; Griz: "A DM will want to save multiple ladders (modules?)",
  // "First page ... should be the DMs units and maps, with load module or build module", "DM flag when he adds each map if he allows short rest, long rest, market visit
  // between runs of his module(ladder)"): several, each a name, up to PK.MODULE_MAX fights, each fight a floor, its CR, the foes its units made and what follows it
  // (`rest`: a short rest on, a long rest and the market off -- RULED 10-17, "4-8 yes"). c.edit is the one on BUILD. They play at the DM's table from THE CAMP's
  // LOAD MODULE (js/pocket.js PK.modules, 'table:<id>') and go out as a file to the modules folder (SAVE TO THE FOLDER)
  PD.REST0 = function () { return { short: true, long: false, market: false }; };
  PD.MODULES_MAX = 30;
  PD.module = function (st, id) { var cp = PD.camp(st); return cp.modules.filter(function (m) { return m.id === id; })[0] || null; };
  PD.editing = function (st) { var cp = PD.camp(st); return cp.edit != null ? PD.module(st, cp.edit) : null; };
  PD.newModule = function (st, name) {
    var cp = PD.camp(st); if (cp.modules.length >= PD.MODULES_MAX) return null;
    var n = 1; while (cp.modules.some(function (m) { return m.name === 'MODULE ' + n; })) n++;
    var m = { id: cp.next++, name: String(name || 'MODULE ' + n).toUpperCase().slice(0, 24), about: '', at: Date.now(), slots: [] };
    cp.modules.push(m); cp.edit = m.id; return m;
  };
  PD.copyModule = function (st, id) {
    var cp = PD.camp(st), m = PD.module(st, id); if (!m || cp.modules.length >= PD.MODULES_MAX) return null;
    var c = JSON.parse(JSON.stringify(m)); c.id = cp.next++; c.name = (m.name + ' AGAIN').slice(0, 24); c.at = Date.now(); cp.modules.push(c); return c;
  };
  PD.dropModule = function (st, id) { var cp = PD.camp(st); cp.modules = cp.modules.filter(function (m) { return m.id !== id; }); if (cp.edit === id) cp.edit = null; };
  // a fight onto the module: the floor at a CR, its units first (the ones in its other fights behind the rest -- his 'used' rule, 10-09b)
  PD.addSlot = function (pk, m, mapId, cr8) {
    if (!m || m.slots.length >= PK.MODULE_MAX) return null;
    var f = PD.fill(pk, mapId, cr8, PD.placed(m.slots)), s = { map: mapId, cr8: cr8, foes: f.foes, mine: f.mine, units: f.units, rest: PD.REST0() };
    m.slots.push(s); return s;
  };
  // a module from a file (FROM A FILE on LOAD MODULE): the campaign's to change, its maps the campaign's at no cost (they came with it)
  PD.takeModule = function (st, mod) {
    var cp = PD.camp(st); if (!mod || cp.modules.length >= PD.MODULES_MAX) return null;
    var m = { id: cp.next++, name: String(mod.name || 'A MODULE').toUpperCase().slice(0, 24), about: mod.about || '', at: Date.now(),
      slots: mod.slots.map(function (s) { return { map: s.map, cr8: PK.sum8(s.foes), foes: s.foes.slice(), mine: 0, units: [], name: s.name || null, intro: s.intro || null, rest: Object.assign(PD.REST0(), s.rest || {}) }; }) };
    cp.modules.push(m); PD.camp(st); return m;
  };
  // the module as a file (PK.moduleOf reads it at any table: its villains' words build anywhere)
  PD.moduleFile = function (m) {
    return { game: 'DRAGONSLEEP', kind: PK.MODULE_KIND, v: 1, at: new Date().toISOString(), name: m.name, by: 'a DM', party: null, about: m.about || ('A module of ' + m.slots.length + ' fight' + (m.slots.length === 1 ? '' : 's') + '.'),
      slots: m.slots.map(function (s) { var o = { map: s.map, foes: s.foes.slice(), rest: Object.assign(PD.REST0(), s.rest || {}) }; if (s.name) o.name = s.name; if (s.intro) o.intro = s.intro; return o; }) };
  };
  // SAVE TO THE FOLDER (10-17, the two Pocket DMs; his "re 5 - can we when DM saves module store a pointer to a folder" -- "2 yes"): written into the modules folder --
  // picked the first time, kept after (PK.folder), one allow after a restart -- where THE CAMP's LOAD MODULE reads it; without folder access, a download
  PD.saveModule = function (pk, m) {
    m = m || PD.editing(pk.st); if (!m || !m.slots.length) return null;
    var d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; }, stamp = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes());
    var slug = String(m.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'module', file = 'pocket-module-' + slug + '-' + stamp + '.json', text = JSON.stringify(PD.moduleFile(m), null, 1);
    var download = function () {
      try { var a = document.createElement('a'), url = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.href = url; a.download = file; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000); pk.say('saved ' + file + ': THE CAMP, LOAD MODULE, FROM A FILE plays it', 420); }
      catch (e) { pk.msg = { text: 'could not write the file: ' + e, t: 300, bad: true }; }
    };
    if (!PK.canFolder()) { download(); return file; }
    var h = PK.folder, got = h ? PK.folderAllowed(h, true, true).then(function (ok) { return ok ? h : PK.folderPick(); }) : PK.folderPick();
    got.then(function (fh) { return PK.folderWrite(fh, file, text).then(function () { pk.say('saved ' + m.name + ' to the folder ' + fh.name + ': THE CAMP\'s LOAD MODULE lists it', 420); }); })
      .catch(function (e) { if (e && e.name === 'AbortError') { pk.say('no folder picked: nothing saved', 300); return; } pk.say('the folder would not take it (' + (e && e.message || e) + '): a download instead', 300); download(); });
    return file;
  };

  // ------------------------------------------------------------------ THE LOCATIONS (10-17, step C; Griz: "We'll need a 'locations' store that works like the monster store by tileset
  // (i.e. underground, urban, outdoors - probably matching world tile) sorted by map size. Maps chosen/bought here show up on the ladder building screen (instead of all
  // available maps)"): every floor the table deals, by its ground -- a map's own `land` where it has one, else this table (the seat's read of each floor, 10-17; a floor
  // not here goes UNDERGROUND when dark and OUTDOORS when not) -- sorted small to large by the squares one can stand on, priced by size band (RULED 10-17, "4-8 yes":
  // 50 / 100 / 200 sp). A map bought is the campaign's (c.maps); let go, its silver back. STRIKE (the random draw's) lives here since BUILD shows only maps bought
  PD.LANDS = [['underground', 'UNDERGROUND', 'caves, the king\'s road, the Warrens'], ['urban', 'URBAN', 'halls, yards, the made places'], ['outdoors', 'OUTDOORS', 'roads, hills, water, open sky']];
  PD.LAND = {
    floodstair: 'underground', pool: 'underground', drain: 'underground', cut: 'underground', siphon: 'underground', roost: 'underground', cutwalls: 'underground',
    threshold: 'underground', settling: 'underground', seamwall: 'underground', giantcamp: 'underground', trollcave: 'underground', camp: 'underground', burial: 'underground',
    grickden: 'underground', deep: 'underground', roperfork: 'underground', nest: 'underground', barricade: 'underground', breach: 'underground', lamp: 'underground',
    cavern: 'underground', causeway: 'underground', restcamp: 'underground', cistern: 'underground', lampcircle: 'underground',
    hexfloor: 'urban', yard: 'urban', greyfangpit: 'urban', edifice: 'urban', lighthouse: 'urban',
    gulch: 'outdoors', bridge: 'outdoors', bog: 'outdoors', snootroad: 'outdoors', northroad: 'outdoors', gnollhills: 'outdoors', point: 'outdoors', climbfloor: 'outdoors'
  };
  PD.landOf = function (id) { var d = D.MAPS[id] || {}; return d.land || PD.LAND[id] || (d.dark ? 'underground' : 'outdoors'); };
  var sizeC = {};
  PD.sizeOf = function (id) { // (the squares one can stand on, as PK.roomOn counts them)
    if (sizeC[id] != null) return sizeC[id];
    var def = D.MAPS[id], n = 0; if (!def) return 0;
    try { var m = D.iso.load(def); for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) { var q = m.at(x, y); if (q && q.walk) n++; } } catch (e) { n = 0; }
    return (sizeC[id] = n);
  };
  PD.BANDS = [[150, 'SMALL', 500], [250, 'MEDIUM', 1000], [Infinity, 'LARGE', 2000]]; // (under 150 squares, under 250, the rest; the price in copper: 50 / 100 / 200 sp)
  PD.bandOf = function (id) { var n = PD.sizeOf(id); for (var i = 0; i < PD.BANDS.length; i++) if (n < PD.BANDS[i][0]) return PD.BANDS[i]; return PD.BANDS[PD.BANDS.length - 1]; };
  PD.mapPrice = function (id) { return PD.bandOf(id)[2]; };
  PD.owns = function (st, id) { return PD.camp(st).maps.some(function (x) { return x.id === id; }); };
  PD.locations = function (pk, land) {
    return pk.mapIds().filter(function (id) { return !land || PD.landOf(id) === land; }).sort(function (a, b) { return PD.sizeOf(a) - PD.sizeOf(b) || (String((D.MAPS[a] || {}).name) < String((D.MAPS[b] || {}).name) ? -1 : 1); });
  };
  PD.buyMap = function (st, id) {
    var cp = PD.camp(st), cost = PD.mapPrice(id);
    if (!D.MAPS[id]) return { ok: false, why: 'no such floor' };
    if (PD.owns(st, id)) return { ok: false, why: 'yours already' };
    if (cp.purse < cost) return { ok: false, why: 'the purse holds ' + PD.fmt(cp.purse) + ': ' + (D.MAPS[id].name || id) + ' is ' + PD.fmt(cost) };
    cp.purse -= cost; cp.maps.push({ id: id, paid: cost, at: Date.now() }); return { ok: true };
  };
  PD.letGoMap = function (st, id) {
    var cp = PD.camp(st), r = cp.maps.filter(function (x) { return x.id === id; })[0]; if (!r) return null;
    if (cp.modules.some(function (m) { return m.slots.some(function (s) { return s.map === id; }); })) return { ok: false, why: 'a module of yours stands on it: take its fight off first' };
    cp.maps = cp.maps.filter(function (x) { return x !== r; }); cp.purse += r.paid || 0; return { ok: true, back: r.paid || 0 };
  };
  PD.myMaps = function (pk) { var cp = PD.camp(pk.st), ids = pk.mapIds(); return cp.maps.map(function (x) { return x.id; }).filter(function (id) { return ids.indexOf(id) >= 0; }).sort(function (a, b) { var la = PD.landOf(a), lb = PD.landOf(b); return la !== lb ? (la < lb ? -1 : 1) : PD.sizeOf(a) - PD.sizeOf(b); }); };

  // ------------------------------------------------------------------ THE VILLAINS of a class: what THE MARKS and MAKE put on THE VILLAINS' shelf, each at a level (its CR, PK.levelCR)
  // a stock card marked (st.camp.marks) at the level the shelf's arrows set (c.vlvl, the card's own lowest at first); a made one -- MAKE's, or one of the roster marked
  // -- at its own (EDIT it in the maker for another)
  PD.stockName = function (w) { var n = NPC.NAMED[w], h = DS.DATA.heroes && DS.DATA.heroes[w]; return (n && n.name) || (h && h.name) || (w.charAt(0).toUpperCase() + w.slice(1)); }; // (Ingrith's register names her nowhere else)
  PD.villainRows = function (st) {
    var cp = PD.camp(st), out = [];
    PK.STOCK.forEach(function (s) {
      if (s.king || !cp.marks[s.w]) return;
      var hi = Math.min(s.hi || 12, 12), L = Math.max(s.lo, Math.min(hi, cp.vlvl[s.w] || Math.max(s.lo, 5)));
      var sp = null; try { sp = NPC.spec(s.w + ':' + L); } catch (e) { sp = null; } if (!sp) return;
      out.push({ key: 'w:' + s.w, w: s.w, word: s.w + ':' + L, lvl: L, lo: s.lo, hi: hi, name: PD.stockName(s.w), cls: sp.cls || (DS.DATA.heroes[sp.hero] || {}).cls, mark: cp.marks[s.w], tag: 'MARKED' });
    });
    st.roster.forEach(function (c, i) {
      if (!c.dm && !c.mark) return;
      out.push({ key: 'c:' + i, i: i, word: c.code, lvl: c.lvl, name: c.name, cls: c.cls, mark: c.mark || 'villain', tag: c.dm ? 'MADE' : 'MARKED' });
    });
    return out;
  };
  PD.MARKS = [null, 'villain', 'only'];
  PD.markWord = function (m) { return m === 'only' ? 'VILLAIN ONLY' : m === 'villain' ? 'VILLAIN' : '--'; };
  PD.setMark = function (st, e, m) { var cp = PD.camp(st); if (e.kind === 'custom') { var c = st.roster[e.i]; if (!c) return; if (m) c.mark = m; else delete c.mark; } else if (m) cp.marks[e.w] = m; else delete cp.marks[e.w]; };
  Pocket.prototype.makeVillain = function (i) { var rec = i != null ? this.st.roster[i] : null; this.makeNew(-1, rec, i != null ? i : null); this.mk.villain = true; };
  // what a ladder fight pays the DM (his: "double the CR of the ladder encounter for each fight on the ladder"): won or lost, twice the table's CR in silver
  Pocket.prototype.afterFight = function (res, run, info) {
    if (!this.st.dm || !run || (res !== 'won' && res !== 'lost')) return;
    var cp = PD.camp(this.st), pay = PK.sum8(info.kinds) * PD.CP8 * 2, now = Date.now();
    cp.purse += pay;
    // the units that fought go to the back of the line, in the order they stood (his "treat it as 'used' or 'purchased last'")
    (run.units || []).forEach(function (id, i) { var u = cp.units.filter(function (x) { return x.id === id; })[0]; if (u) u.usedAt = now + i; });
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
    this.btn(ctx, 'CAMPAIGN', x, y, w, 18, function () { self.go('camp'); }, { pri: true }); // (DOORS stands in the right column on both tables since 10-17)
    D.text(ctx, '{y}' + PD.fmt(cp.purse) + '{/}  ' + cp.units.length + ' unit' + (cp.units.length === 1 ? '' : 's') + (cp.bought.length ? ' {g}+' + cp.bought.length + '{/}' : ''), x + w / 2, y + 22, P('bone', 1), 'center');
  };

  // ------------------------------------------------------------------ the screens: the campaign, the shops, a shop, the villains, the marks, the units, the locations, the modules,
  // the builder, the doors, the notes
  var BACKTO = { camp: 'title', doors: 'title', shops: 'camp', units: 'camp', build: 'camp', locations: 'camp', dmmods: 'camp', shop: 'shops', villains: 'shops', marks: 'villains', feedback: 'doors' };
  Pocket.prototype.backMore = function (s) {
    if (!BACKTO[s]) return false;
    if (s === 'build' && this.naming) { this.naming = false; this.dropField(); return true; } // (X from the name's field lets the field go, not the builder)
    this.keep(); this.go(BACKTO[s]); return true; // (USEFULS till 10-17 for the notes; THE CAMPAIGN's own pages back to it, a shop's to THE SHOPS since 10-17)
  };
  Pocket.prototype.scrolls = function (s) { return ['shop', 'units', 'build', 'doors', 'locations', 'villains', 'marks', 'dmmods'].indexOf(s) >= 0; };
  Pocket.prototype.drawMore = function (ctx, s) {
    if (s === 'camp') this.drawCamp(ctx);
    else if (s === 'shops') this.drawShops(ctx);
    else if (s === 'shop') this.drawShop(ctx);
    else if (s === 'villains') this.drawVillains(ctx);
    else if (s === 'marks') this.drawMarks(ctx);
    else if (s === 'units') this.drawUnits(ctx);
    else if (s === 'locations') this.drawLocations(ctx);
    else if (s === 'dmmods') this.drawDmMods(ctx);
    else if (s === 'build') this.drawBuild(ctx);
    else if (s === 'doors') this.drawDoors(ctx);
    else if (s === 'feedback') this.drawFeedback(ctx);
  };
  function head(ctx, title, sub) {
    ctx.save(); ctx.translate(D.W / 2, 6); ctx.scale(2, 2); D.text(ctx, title, 0, 0, P('gold', 4), 'center'); ctx.restore();
    if (sub) D.text(ctx, sub, D.W / 2, 24, P('silver', 5), 'center');
  }
  function panel(ctx, x, y, w, h) { ctx.fillStyle = 'rgba(14,12,24,.84)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = P('stone', 3); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
  function crOf(kind) { return String((PK.foe(kind) || {}).cr || '?'); }
  function nameOf(kind) { return (PK.foe(kind) || {}).name || kind; }
  function cut(s, w) { s = String(s); if (D.textWidth(s) <= w) return s; while (s.length > 1 && D.textWidth(s + '..') > w) s = s.slice(0, -1); return s + '..'; }
  function clsOf(c) { return c && DS.R.CLASSES[c] ? DS.R.CLASSES[c].name : ''; }
  PD.shopById = function (id) { return PD.SHOPS.filter(function (s) { return s.id === id; })[0] || null; };
  Pocket.prototype.toShop = function (id) { this.shop = id; this.scroll = 0; this.go(id === 'villains' ? 'villains' : 'shop'); };

  // THE CAMPAIGN, the first page (10-17, step C; Griz: "First page (currently when DM clicks 'campaign') should be the DMs units and maps, with load module or build
  // module - or clicking a button near their units and maps where they can buy and add more to their campaign without starting to build a module"): the purse; your
  // units with THE SHOPS and THE UNITS beside them; your maps with THE LOCATIONS; your modules with BUILD MODULE and LOAD MODULE; the campaign's file
  Pocket.prototype.drawCamp = function (ctx) {
    var self = this, st = this.st, cp = PD.camp(st);
    head(ctx, 'THE CAMPAIGN', 'your units and your maps, then your modules · CR in silver: 100 sp a CR');
    ctx.save(); ctx.translate(20, 34); ctx.scale(2, 2); D.text(ctx, PD.fmt(cp.purse), 0, 0, P('gold', 4)); ctx.restore();
    D.text(ctx, 'the purse · a fight of yours played here pays twice its CR in silver, won or lost', 20, 52, P('stone', 5));
    var ty = 64, ph = 92, lx = 16, lw = 218, us = PD.newest(cp), nb = cp.bought.length;
    panel(ctx, lx, ty, lw, ph);
    D.text(ctx, '{y}YOUR UNITS{/}  ' + us.length + (nb ? '  {g}+' + nb + ' receipt' + (nb === 1 ? '' : 's') + ' to bind{/}' : ''), lx + 6, ty + 5, P('bone', 1));
    us.slice(0, 5).forEach(function (u, i) { D.text(ctx, cut(PD.unitName(u), lw - 56), lx + 6, ty + 17 + i * 10, P('bone', 1)); D.text(ctx, 'CR ' + PK.fmt8(PD.unitCR8(u)), lx + lw - 6, ty + 17 + i * 10, P('gold', 4), 'right'); });
    if (!us.length) D.text(ctx, nb ? 'bind your receipts into a unit: THE UNITS' : 'none yet: buy in THE SHOPS, then bind', lx + 6, ty + 17, P('stone', 5));
    else if (us.length > 5) D.text(ctx, '{g}and ' + (us.length - 5) + ' more{/}', lx + 6, ty + 67, P('stone', 5));
    this.btn(ctx, 'THE SHOPS', lx + 6, ty + 74, 100, 14, function () { self.go('shops'); }, { pri: true });
    this.btn(ctx, 'THE UNITS', lx + 112, ty + 74, 100, 14, function () { self.scroll = 0; self.scroll2 = 0; self.go('units'); }, { dis: !us.length && !nb, why: 'nothing bought yet: THE SHOPS' });
    var rx = 246, rw = D.W - rx - 16, mine = PD.myMaps(this);
    panel(ctx, rx, ty, rw, ph);
    D.text(ctx, '{y}YOUR MAPS{/}  ' + mine.length, rx + 6, ty + 5, P('bone', 1));
    mine.slice(0, 5).forEach(function (id, i) { D.text(ctx, cut((D.MAPS[id] || {}).name || id, rw - 92), rx + 6, ty + 17 + i * 10, P('bone', 1)); D.text(ctx, '{g}' + PD.landOf(id).toUpperCase() + '{/}', rx + rw - 6, ty + 17 + i * 10, P('stone', 5), 'right'); });
    if (!mine.length) D.text(ctx, 'none yet: THE LOCATIONS sells them', rx + 6, ty + 17, P('stone', 5));
    else if (mine.length > 5) D.text(ctx, '{g}and ' + (mine.length - 5) + ' more{/}', rx + 6, ty + 67, P('stone', 5));
    this.btn(ctx, 'THE LOCATIONS', rx + 6, ty + 74, 112, 14, function () { self.scroll = 0; self.go('locations'); }, { pri: true });
    // the modules, the newest first
    var my = 162, mods = cp.modules.slice().sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    panel(ctx, 16, my, D.W - 32, 66);
    D.text(ctx, '{y}YOUR MODULES{/}  ' + mods.length + '  {g}play one from THE CAMP\'s LOAD MODULE: with DM mode on it pays this purse{/}', 22, my + 5, P('bone', 1));
    mods.slice(0, 4).forEach(function (m, i) {
      self.btn(ctx, cut(m.name, 150) + '  {g}' + m.slots.length + ' fight' + (m.slots.length === 1 ? '' : 's') + '{/}', 22 + (i % 2) * 220, my + 17 + Math.floor(i / 2) * 14, 212, 12, function () { cp.edit = m.id; self.scroll = 0; self.keep(); self.go('build'); }, { small: true });
    });
    if (!mods.length) D.text(ctx, 'none yet: BUILD MODULE -- a fight a map, your units first', 22, my + 19, P('stone', 5));
    this.btn(ctx, 'BUILD MODULE', 22, my + 47, 120, 14, function () { var m = PD.newModule(st); if (!m) { D.sfx('error'); self.say(PD.MODULES_MAX + ' modules already: let one go on LOAD MODULE', 300); return; } self.scroll = 0; self.keep(); self.go('build'); }, { pri: true });
    this.btn(ctx, 'LOAD MODULE', 148, my + 47, 110, 14, function () { self.scroll = 0; self.go('dmmods'); });
    if (mods.length > 4) D.text(ctx, '{g}and ' + (mods.length - 4) + ' more on LOAD MODULE{/}', 266, my + 51, P('stone', 5));
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'SAVE CAMPAIGN', 88, 236, 114, 15, function () { self.saveTable(); });
    this.btn(ctx, 'LOAD CAMPAIGN', 208, 236, 114, 15, function () { self.loadTable(); });
    if (st.run) D.text(ctx, '{o}under way: ' + (st.run.module ? cut(st.run.module.name, 80) + ', fight ' + st.run.rung : st.run.trial ? 'the trial' : 'rung ' + st.run.rung) + '{/}', D.W - 20, 240, P('fire', 1), 'right');
  };

  // THE SHOPS: the six, an icon each (THE VILLAINS the sixth since 10-17)
  Pocket.prototype.drawShops = function (ctx) {
    var self = this, cp = PD.camp(this.st), tw = 70, gap = 6, x0 = Math.round((D.W - (PD.SHOPS.length * tw + (PD.SHOPS.length - 1) * gap)) / 2), ty = 46, th = 50, hov = null;
    head(ctx, 'THE SHOPS', 'creatures by kind, priced top to bottom · CR in silver: 100 sp a CR · the purse ' + PD.fmt(cp.purse));
    PD.SHOPS.forEach(function (sh, i) {
      var x = x0 + i * (tw + gap), n = sh.id === 'villains' ? PD.shelf(sh).length + PD.villainRows(self.st).length : PD.shelf(sh).length;
      var b = self.btn(ctx, '', x, ty, tw, th, function () { self.toShop(sh.id); }); if (self.btns.length - 1 === self.ksel) hov = sh;
      ctx.drawImage(icon(sh.icon), 0, 0, 12, 12, x + tw / 2 - 12, ty + 5, 24, 24);
      var lines = sh.id === 'etc' ? ['ABERRATIONS,', 'OOZES, ETC.'] : [sh.name];
      lines.forEach(function (l, j) { D.text(ctx, l, x + tw / 2, ty + 34 + j * 8 - (lines.length - 1) * 4, P('bone', 2), 'center'); });
      D.text(ctx, '{g}' + n + '{/}', x + tw - 4, ty + 3, P('stone', 5), 'right');
      return b;
    });
    D.text(ctx, hov ? '{y}' + hov.name + '{/}: ' + hov.sub : 'a purchase is a receipt; receipts bound on THE UNITS are one unit, at their CRs summed', D.W / 2, ty + th + 10, P('bone', 1), 'center');
    D.text(ctx, '{y}THE RECEIPTS{/}  ' + cp.bought.length + ' to bind  ·  {y}THE UNITS{/}  ' + cp.units.length, D.W / 2, ty + th + 26, P('bone', 1), 'center');
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'THE UNITS (' + cp.bought.length + ' TO BIND)', 88, 236, 160, 15, function () { self.scroll = 0; self.scroll2 = 0; self.go('units'); }, { dis: !cp.bought.length && !cp.units.length, why: 'nothing bought yet' });
    this.btn(ctx, 'THE LOCATIONS', D.W - 130, 236, 110, 15, function () { self.scroll = 0; self.go('locations'); });
  };

  // THE VILLAINS (10-17, step C): the story's named, and yours -- a stock card marked on THE MARKS at the level its arrows set, one of your own marked, one MAKE made
  Pocket.prototype.drawVillains = function (ctx) {
    var self = this, st = this.st, cp = PD.camp(st), sh = PD.shopById('villains'), per = 11;
    var rows = PD.villainRows(st).map(function (v) { return { v: v, word: v.word }; }).concat(PD.shelf(sh, 'cheap').map(function (k) { return { story: true, word: k }; }));
    head(ctx, 'VILLAINS', 'yours first, then the story\'s named · a villain of a class at its level\'s CR · the purse ' + PD.fmt(cp.purse));
    ctx.drawImage(icon('crown'), 0, 0, 12, 12, 14, 4, 24, 24);
    var from = Math.min(this.scroll, Math.max(0, rows.length - per)); this.scroll = from;
    var have = {}; cp.bought.forEach(function (r) { have[r.kind] = (have[r.kind] || 0) + 1; }); cp.units.forEach(function (u) { PD.unitKinds(u).forEach(function (k) { have[k] = (have[k] || 0) + 1; }); });
    D.text(ctx, '{g}price{/}', 14, 34, P('stone', 5)); D.text(ctx, '{g}villain{/}', 112, 34, P('stone', 5)); D.text(ctx, '{g}level{/}', 240, 34, P('stone', 5)); D.text(ctx, '{g}CR{/}', 306, 34, P('stone', 5)); D.text(ctx, '{g}yours{/}', 334, 34, P('stone', 5));
    rows.slice(from, from + per).forEach(function (r, i) {
      var yy = 44 + i * 16, k = r.word, cost = PD.price(k), f = PK.foe(k) || { name: k }, v = r.v;
      self.btn(ctx, 'BUY  ' + PD.fmt(cost), 14, yy, 92, 13, function () {
        var res = PD.buy(st, k);
        if (res.ok) { self.keep(); self.say('bought ' + f.name + ' for ' + PD.fmt(cost) + ' -- ' + PD.fmt(PD.camp(st).purse) + ' left; bind it on THE UNITS', 240); }
        else { D.sfx('error'); self.say(res.why, 300); }
      }, { small: true, dis: cp.purse < cost, why: 'the purse holds ' + PD.fmt(cp.purse) + ': a fight of yours pays twice its CR' });
      D.text(ctx, cut(v ? v.name : f.name, 120), 112, yy + 3, r.story ? P('bone', 1) : P('gold', 4));
      if (v && v.w) { // (a stock card: its level by the arrows)
        self.btn(ctx, '<', 236, yy, 13, 13, function () { cp.vlvl[v.w] = Math.max(v.lo, v.lvl - 1); self.keep(); }, { small: true, dis: v.lvl <= v.lo });
        D.text(ctx, clsOf(v.cls).slice(0, 3).toUpperCase() + ' ' + v.lvl, 271, yy + 3, P('bone', 1), 'center');
        self.btn(ctx, '>', 292, yy, 13, 13, function () { cp.vlvl[v.w] = Math.min(v.hi, v.lvl + 1); self.keep(); }, { small: true, dis: v.lvl >= v.hi });
      } else if (v) D.text(ctx, cut(clsOf(v.cls) + ' ' + v.lvl, 62), 240, yy + 3, P('bone', 1));
      else D.text(ctx, '{g}' + (f.type || '') + '{/}', 240, yy + 3, P('stone', 5));
      D.text(ctx, crOf(k), 310, yy + 3, P('gold', 4));
      if (have[k]) D.text(ctx, '{n}' + have[k] + '{/}', 340, yy + 3, P('moss', 2));
      D.text(ctx, '{g}' + (r.story ? 'STORY' : v.mark === 'only' ? 'ONLY' : v.tag) + '{/}', 358, yy + 3, P('stone', 5));
      if (v && v.i != null) self.btn(ctx, 'EDIT', D.W - 50, yy, 36, 13, function () { self.makeVillain(v.i); }, { small: true }); // (the maker on it: its level, its gear, its spells)
    });
    if (!PD.villainRows(st).length) D.text(ctx, '{g}none of your own yet: MAKE A VILLAIN, or mark one of the roster on THE MARKS{/}', D.W / 2, 44 + Math.min(per, rows.length) * 16 + 4, P('stone', 5), 'center');
    if (rows.length > per) D.text(ctx, 'wheel: ' + (from + 1) + '-' + Math.min(rows.length, from + per) + ' of ' + rows.length, 14, 224, P('stone', 5));
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'MAKE A VILLAIN', 88, 236, 120, 15, function () { self.makeVillain(null); }, { pri: true });
    this.btn(ctx, 'THE MARKS', 214, 236, 90, 15, function () { self.scroll = 0; self.go('marks'); });
    this.btn(ctx, 'THE UNITS (' + cp.bought.length + ')', 310, 236, 100, 15, function () { self.scroll = 0; self.scroll2 = 0; self.go('units'); }, { dis: !cp.bought.length && !cp.units.length, why: 'nothing bought yet' });
  };
  // THE MARKS (his "going through the existing roster and being able to mark as villain or villain only to add to villain store and remove from 'campaign' available
  // party members"): every card of the roster, the king aside, and the mark it carries -- --, VILLAIN, VILLAIN ONLY, a click the next
  Pocket.prototype.drawMarks = function (ctx) {
    var self = this, st = this.st, per = 11;
    var es = PK.STOCK.filter(function (s) { return !s.king && !s.mascot; }).map(function (s) { return { kind: 'stock', w: s.w, word: s.w + ':' + s.lo }; })
      .concat(st.roster.map(function (c, i) { return { kind: 'custom', i: i, word: c.code, made: !!c.dm }; }));
    head(ctx, 'THE MARKS', 'VILLAIN: on THE VILLAINS\' shelf too  ·  VILLAIN ONLY: there, and off the roster at this table');
    var from = Math.min(this.scroll, Math.max(0, es.length - per)); this.scroll = from;
    es.slice(from, from + per).forEach(function (e, k) {
      var yy = 36 + k * 16, f = PK.foe(e.word) || {}, m = PK.markOf(st, e), at = PD.MARKS.indexOf(m);
      D.text(ctx, (m ? '{y}' : '') + cut(e.kind === 'custom' ? st.roster[e.i].name : PD.stockName(e.w), 150) + (m ? '{/}' : ''), 20, yy + 3, P('bone', 1));
      D.text(ctx, '{g}' + clsOf(f.cls) + (e.kind === 'custom' ? ' ' + st.roster[e.i].lvl + (e.made ? ', made in THE VILLAINS' : ', your own') : '') + '{/}', 180, yy + 3, P('stone', 5));
      self.btn(ctx, PD.markWord(m), D.W - 140, yy, 120, 13, function () { PD.setMark(st, e, PD.MARKS[(at + 1) % PD.MARKS.length]); self.cache = {}; self.keep(); }, { small: true, on: !!m });
    });
    if (es.length > per) D.text(ctx, 'wheel: ' + (from + 1) + '-' + Math.min(es.length, from + per) + ' of ' + es.length, 20, 36 + per * 16 + 2, P('stone', 5));
    D.text(ctx, 'a seat already holding one marked VILLAIN ONLY keeps it till the arrows move on', D.W / 2, 224, P('stone', 5), 'center');
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'THE VILLAINS', D.W - 120, 236, 100, 15, function () { self.back(); });
  };
  // THE LOCATIONS: by ground, small to large; BUY (or LET GO, its silver back); STRIKE keeps a floor out of the random draw at this table
  Pocket.prototype.drawLocations = function (ctx) {
    var self = this, st = this.st, cp = PD.camp(st), land = this.landTab || 'underground', per = 9;
    head(ctx, 'THE LOCATIONS', 'the floors by their ground, small to large · 50 / 100 / 200 sp by size · the purse ' + PD.fmt(cp.purse));
    PD.LANDS.forEach(function (L, k) { self.btn(ctx, L[1] + '  ' + PD.locations(self, L[0]).length, 20 + k * 148, 34, 142, 13, function () { self.landTab = L[0]; self.scroll = 0; }, { on: land === L[0], small: true }); });
    var list = PD.locations(this, land), from = Math.min(this.scroll, Math.max(0, list.length - per)); this.scroll = from;
    D.text(ctx, '{g}' + (PD.LANDS.filter(function (L) { return L[0] === land; })[0] || [])[2] + '{/}', 20, 52, P('stone', 5));
    list.slice(from, from + per).forEach(function (id, i) {
      var yy = 62 + i * 16, d = D.MAPS[id], own = PD.owns(st, id), band = PD.bandOf(id), cost = band[2], struck = cp.strike.indexOf(id) >= 0;
      if (own) self.btn(ctx, 'YOURS: LET GO', 14, yy, 96, 13, function () { var r = PD.letGoMap(st, id); if (r && r.ok) { self.keep(); self.say((d.name || id) + ' let go: +' + PD.fmt(r.back), 240); } else { D.sfx('error'); self.say(r ? r.why : 'not yours', 300); } }, { small: true, on: true });
      else self.btn(ctx, 'BUY  ' + PD.fmt(cost), 14, yy, 96, 13, function () { var r = PD.buyMap(st, id); if (r.ok) { self.keep(); self.say((d.name || id) + ' is yours: BUILD offers it', 240); } else { D.sfx('error'); self.say(r.why, 300); } }, { small: true, dis: cp.purse < cost, why: 'the purse holds ' + PD.fmt(cp.purse) });
      D.text(ctx, cut(d.name || id, 150), 116, yy + 3, own ? P('gold', 4) : P('bone', 1));
      D.text(ctx, band[1] + '  {g}' + PD.sizeOf(id) + ' squares{/}', 272, yy + 3, P('bone', 1));
      if (d.dark) D.text(ctx, '{p}DARK{/}', 372, yy + 3, P('violet', 5));
      self.btn(ctx, struck ? 'STRUCK' : 'STRIKE', D.W - 64, yy, 50, 13, function () {
        if (struck) cp.strike = cp.strike.filter(function (x) { return x !== id; });
        else if (cp.strike.length >= PD.STRIKES) { D.sfx('error'); self.say('three floors struck already: let one back in first', 240); return; }
        else cp.strike.push(id);
        self.keep();
      }, { small: true, on: struck });
    });
    if (list.length > per) D.text(ctx, 'wheel: ' + (from + 1) + '-' + Math.min(list.length, from + per) + ' of ' + list.length, 14, 62 + per * 16 + 2, P('stone', 5));
    D.text(ctx, 'STRIKE keeps a floor out of every random draw at this table (' + cp.strike.length + ' of ' + PD.STRIKES + ') · BUILD offers the floors you own (' + cp.maps.length + ')', D.W / 2, 224, P('stone', 5), 'center');
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    var ed = PD.editing(st); if (ed) this.btn(ctx, 'BACK TO BUILD', D.W - 130, 236, 110, 15, function () { self.scroll = 0; self.go('build'); });
  };
  // LOAD MODULE at the DM's side: the campaign's modules, one picked shown whole; OPEN it on BUILD, COPY, LET GO, or one FROM A FILE taken into the campaign
  Pocket.prototype.drawDmMods = function (ctx) {
    var self = this, st = this.st, cp = PD.camp(st), mods = cp.modules.slice().sort(function (a, b) { return (b.at || 0) - (a.at || 0); }), per = 10;
    head(ctx, 'YOUR MODULES', 'open one on BUILD, copy it, let it go -- or take one in FROM A FILE to change it');
    if (!mods.some(function (m) { return m.id === self.dmSel; })) this.dmSel = mods.length ? mods[0].id : null;
    var from = Math.min(this.scroll, Math.max(0, mods.length - per)); this.scroll = from;
    mods.slice(from, from + per).forEach(function (m, i) { self.btn(ctx, cut(m.name, 128), 14, 36 + i * 17, 140, 15, function () { self.dmSel = m.id; }, { on: self.dmSel === m.id, small: true }); });
    if (mods.length > per) D.text(ctx, 'wheel: ' + (from + 1) + '-' + Math.min(mods.length, from + per) + ' of ' + mods.length, 14, 36 + per * 17 + 2, P('stone', 5));
    var m = PD.module(st, this.dmSel), px = 162, py = 34, pw = D.W - px - 10, ph = 194;
    panel(ctx, px, py, pw, ph);
    if (m) {
      var yy = py + 5;
      D.text(ctx, '{y}' + cut(m.name, pw - 20) + '{/}  {g}' + m.slots.length + ' of ' + PK.MODULE_MAX + ' fights{/}', px + 6, yy, P('gold', 4)); yy += 12;
      m.slots.forEach(function (s, i) {
        D.text(ctx, cut('{y}' + (i + 1) + '{/} ' + ((D.MAPS[s.map] || {}).name || s.map) + '  {g}CR ' + PK.fmt8(PK.sum8(s.foes || [])) + '{/}  ' + PK.foesText(s.foes || []), pw - 12), px + 6, yy, P('bone', 1)); yy += 9;
        if (i < m.slots.length - 1) { D.text(ctx, '{g}then ' + PK.restText(s.rest) + '{/}', px + 16, yy, P('stone', 5)); yy += 9; }
      });
      if (!m.slots.length) D.text(ctx, 'no fights yet: OPEN it on BUILD', px + 6, yy, P('stone', 5));
    } else D.text(ctx, 'none yet: BUILD MODULE on THE CAMPAIGN, or FROM A FILE', px + pw / 2, py + 80, P('stone', 5), 'center');
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'FROM A FILE', 86, 236, 90, 15, function () { PK.readJSON(function (text) { var x = self.readModule(text); if (!x) return; var t = PD.takeModule(st, x); if (!t) { self.say(PD.MODULES_MAX + ' modules already', 300); return; } self.dmSel = t.id; self.keep(); self.say(t.name + ': ' + t.slots.length + ' fights, yours to change', 300); }); });
    this.btn(ctx, 'COPY', 182, 236, 54, 15, function () { var c = PD.copyModule(st, m.id); if (c) { self.dmSel = c.id; self.keep(); } }, { dis: !m, small: true });
    this.btn(ctx, 'LET GO', 242, 236, 62, 15, function () { var ask = self.ask || function (q) { return window.confirm(q); }; if (ask('Let ' + m.name + ' go? It cannot be had back (but a file of it can).')) { PD.dropModule(st, m.id); self.keep(); } }, { dis: !m, small: true });
    this.btn(ctx, 'OPEN ON BUILD', D.W - 130, 236, 110, 15, function () { cp.edit = m.id; self.scroll = 0; self.keep(); self.go('build'); }, { pri: true, dis: !m, why: 'no module picked' });
  };
  // a shop: its creatures priced top to bottom, or by name, or the dearest first
  var SORTS = [['cheap', 'PRICE: LOW FIRST'], ['dear', 'PRICE: HIGH FIRST'], ['name', 'BY NAME']];
  Pocket.prototype.drawShop = function (ctx) {
    var self = this, st = this.st, cp = PD.camp(st), sh = PD.SHOPS.filter(function (s) { return s.id === self.shop; })[0] || PD.SHOPS[0];
    var sort = this.shopSort || 'cheap', list = PD.shelf(sh, sort), per = 12;
    head(ctx, sh.name, sh.sub + ' · the purse: ' + PD.fmt(cp.purse));
    ctx.drawImage(icon(sh.icon), 0, 0, 12, 12, 14, 4, 24, 24);
    var from = Math.min(this.scroll, Math.max(0, list.length - per)); this.scroll = from;
    var have = {}; cp.bought.forEach(function (r) { have[r.kind] = (have[r.kind] || 0) + 1; }); cp.units.forEach(function (u) { PD.unitKinds(u).forEach(function (k) { have[k] = (have[k] || 0) + 1; }); });
    // two kinds of one name on a shelf (the trooper and the trooper with the crossbow) are told apart by their first blow
    var nmN = {}; list.forEach(function (k) { var n = D.FOES[k].name; nmN[n] = (nmN[n] || 0) + 1; });
    var label = function (k) { var f = D.FOES[k], a = f.attacks && f.attacks[Object.keys(f.attacks)[0]]; return nmN[f.name] > 1 && a ? f.name + ' (' + a.name + ')' : f.name; };
    D.text(ctx, '{g}price{/}', 14, 34, P('stone', 5)); D.text(ctx, '{g}creature{/}', 112, 34, P('stone', 5)); D.text(ctx, '{g}CR{/}', 300, 34, P('stone', 5)); D.text(ctx, '{g}yours{/}', 350, 34, P('stone', 5));
    list.slice(from, from + per).forEach(function (k, i) {
      var yy = 44 + i * 15, cost = PD.price(k), f = D.FOES[k];
      self.btn(ctx, 'BUY  ' + PD.fmt(cost), 14, yy, 92, 13, function () {
        var r = PD.buy(st, k);
        if (r.ok) { self.keep(); self.say('bought ' + (/^[aeiou]/i.test(f.name) ? 'an ' : 'a ') + f.name + ' for ' + PD.fmt(cost) + ' -- ' + PD.fmt(PD.camp(st).purse) + ' left; BIND makes your receipts a unit', 240); }
        else { D.sfx('error'); self.say(r.why, 300); }
      }, { small: true, dis: cp.purse < cost, why: 'the purse holds ' + PD.fmt(cp.purse) + ': a fight of yours pays twice its CR' });
      D.text(ctx, cut(label(k), 180), 112, yy + 3, P('bone', 1));
      D.text(ctx, crOf(k), 300, yy + 3, P('gold', 4));
      if (have[k]) D.text(ctx, '{n}' + have[k] + '{/}', 350, yy + 3, P('moss', 2));
      if (f.bound) D.text(ctx, '{g}water{/}', 380, yy + 3, P('stone', 5));
    });
    if (list.length > per) D.text(ctx, 'wheel: ' + (from + 1) + '-' + Math.min(list.length, from + per) + ' of ' + list.length, 14, 44 + per * 15 + 2, P('stone', 5));
    var si = SORTS.map(function (s) { return s[0]; }).indexOf(sort);
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, SORTS[si < 0 ? 0 : si][1], 88, 236, 130, 15, function () { self.shopSort = SORTS[(si + 1) % SORTS.length][0]; self.scroll = 0; }, { small: true });
    this.btn(ctx, 'BIND (' + cp.bought.length + ')', 224, 236, 110, 15, function () { self.scroll = 0; self.scroll2 = 0; self.go('units'); }, { dis: !cp.bought.length && !cp.units.length, why: 'nothing bought yet' }); // (to THE UNITS, where receipts bind)
    var j = PD.SHOPS.indexOf(sh);
    this.btn(ctx, 'NEXT SHOP >', D.W - 110, 236, 90, 15, function () { self.toShop(PD.SHOPS[(j + 1) % PD.SHOPS.length].id); }); // (THE VILLAINS the sixth: its own page, 10-17)
  };
  // THE UNITS: the receipts on the left, picked as a file list picks (a click one, shift+click a run from the last, ctrl+click adds or drops one; E on a row
  // adds or drops it, for the keys and a pad), BIND AS UNIT makes them one; the units on the right, newest first, each UNBIND back to receipts
  PD.pick = function (pk, list, i) {
    var m = I.mouse, id = list[i].id, sel = pk.picked = pk.picked || {}, mouse = !!m.click;
    if (mouse && m.shift && pk.anchor != null && list[pk.anchor]) {
      if (!m.ctrl) Object.keys(sel).forEach(function (k) { delete sel[k]; });
      for (var j = Math.min(pk.anchor, i); j <= Math.max(pk.anchor, i); j++) sel[list[j].id] = true;
      return;
    }
    if (!mouse || m.ctrl) { if (sel[id]) delete sel[id]; else sel[id] = true; }
    else { Object.keys(sel).forEach(function (k) { delete sel[k]; }); sel[id] = true; }
    pk.anchor = i;
  };
  Pocket.prototype.wheelTo = function (w) { if (this.screen === 'units' && I.mouse.x >= 244) { this.scroll2 = Math.max(0, (this.scroll2 || 0) + w); return true; } return false; };
  Pocket.prototype.drawUnits = function (ctx) {
    var self = this, st = this.st, cp = PD.camp(st), rs = cp.bought, us = PD.newest(cp), per = 12, sel = this.picked = this.picked || {};
    Object.keys(sel).forEach(function (k) { if (!rs.some(function (r) { return String(r.id) === k; })) delete sel[k]; });
    var ids = rs.filter(function (r) { return sel[r.id]; }).map(function (r) { return r.id; }), pickedKinds = rs.filter(function (r) { return sel[r.id]; }).map(function (r) { return r.kind; });
    head(ctx, 'THE UNITS', 'click one · shift+click a run · ctrl+click one more or less · then BIND AS UNIT · purse ' + PD.fmt(cp.purse));
    // the receipts
    var lx = 10, lw = 228, rx = 246, rw = D.W - rx - 10;
    D.text(ctx, '{y}THE RECEIPTS{/}  ' + rs.length + (ids.length ? '  {g}' + ids.length + ' picked: CR ' + PK.fmt8(PK.sum8(pickedKinds)) + '{/}' : ''), lx, 34, P('bone', 1));
    var from = Math.min(this.scroll, Math.max(0, rs.length - per)); this.scroll = from;
    rs.slice(from, from + per).forEach(function (r, k) {
      var i = from + k, yy = 44 + k * 14, on = !!sel[r.id];
      self.btn(ctx, '', lx, yy, lw, 13, function () { PD.pick(self, rs, i); }, { on: on, small: true });
      D.text(ctx, (on ? '{y}x{/}' : '{g}.{/}'), lx + 5, yy + 3, P('bone', 1));
      D.text(ctx, cut(nameOf(r.kind), 128), lx + 16, yy + 3, on ? P('stone', 1) : P('bone', 1));
      D.text(ctx, 'CR ' + crOf(r.kind), lx + 150, yy + 3, on ? P('stone', 1) : P('gold', 4));
      D.text(ctx, PD.fmt(r.paid || PD.price(r.kind)), lx + lw - 4, yy + 3, on ? P('stone', 1) : P('stone', 5), 'right');
    });
    if (!rs.length) D.text(ctx, 'none: buy in the shops, and they wait here', lx + 6, 50, P('stone', 5));
    if (rs.length > per) D.text(ctx, 'wheel: ' + (from + 1) + '-' + Math.min(rs.length, from + per) + ' of ' + rs.length, lx, 44 + per * 14 + 2, P('stone', 5));
    // the units
    D.text(ctx, '{y}YOUR UNITS{/}  ' + us.length + ' · in the order a table takes them', rx, 34, P('bone', 1));
    var per2 = 7, from2 = Math.min(this.scroll2 || 0, Math.max(0, us.length - per2)); this.scroll2 = from2; // (two lines a unit: its name whole, then its CR, its heads and UNBIND)
    us.slice(from2, from2 + per2).forEach(function (u, k) {
      var yy = 44 + k * 24;
      ctx.fillStyle = 'rgba(20,16,30,.9)'; ctx.fillRect(rx, yy, rw, 22); ctx.strokeStyle = P('stone', 3); ctx.strokeRect(rx + 0.5, yy + 0.5, rw - 1, 21);
      D.text(ctx, cut(PD.unitName(u), rw - 8), rx + 4, yy + 3, P('bone', 1));
      D.text(ctx, 'CR ' + PK.fmt8(PD.unitCR8(u)) + '  {g}' + u.members.length + ' head' + (u.members.length === 1 ? '' : 's') + (u.usedAt ? ' · fought: last' : '') + '{/}', rx + 4, yy + 12, P('gold', 4));
      self.btn(ctx, 'UNBIND', rx + rw - 48, yy + 10, 46, 11, function () { var g = PD.unbind(st, u.id); if (g) { self.keep(); self.say(PD.unitName(g) + ': receipts again', 240); } }, { small: true });
    });
    if (!us.length) D.text(ctx, 'none yet: pick receipts and BIND AS UNIT', rx + 6, 50, P('stone', 5));
    if (us.length > per2) D.text(ctx, 'wheel: ' + (from2 + 1) + '-' + Math.min(us.length, from2 + per2) + ' of ' + us.length, rx, 44 + per2 * 24 + 2, P('stone', 5));
    D.text(ctx, 'on a ladder a unit fights whole, at the sum of its CRs, your newest first · E on a receipt adds or drops it', D.W / 2, 224, P('stone', 5), 'center');
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, ids.length ? 'BIND AS UNIT (' + ids.length + ': CR ' + PK.fmt8(PK.sum8(pickedKinds)) + ')' : 'BIND AS UNIT', 88, 236, 170, 15, function () {
      var u = PD.bind(st, ids); if (!u) return;
      self.picked = {}; self.anchor = null;
      var rascal = MP && MP.unlock ? MP.unlock(st, 'rascal') : false; // (the first unit bound: Rascal -- his 10-09, "Creating first 'unit' ;)")
      self.keep(); self.say('one unit: ' + PD.unitName(u) + ', CR ' + PK.fmt8(PD.unitCR8(u)), 300);
      if (rascal) PD.egg(self, 'rascal');
    }, { pri: true, dis: !ids.length, why: 'pick a receipt or more first: a click, shift+click, ctrl+click' });
    this.btn(ctx, 'LET GO', 264, 236, 70, 15, function () {
      var back = 0, n = 0; ids.forEach(function (id) { var g = PD.dismiss(st, id); if (g) { back += g.paid || PD.price(g.kind); n++; } });
      self.picked = {}; self.anchor = null; self.keep(); self.say(n + ' back to the shops: +' + PD.fmt(back), 240);
    }, { dis: !ids.length, why: 'pick the receipts to let go first', small: true });
    this.btn(ctx, ids.length === rs.length && rs.length ? 'NONE' : 'ALL', 340, 236, 50, 15, function () { var all = ids.length !== rs.length; self.picked = {}; if (all) rs.forEach(function (r) { self.picked[r.id] = true; }); }, { dis: !rs.length, small: true });
    this.btn(ctx, 'THE SHOPS', D.W - 86, 236, 70, 15, function () { self.go('shops'); }, { small: true }); // (THE SHOPS' own page since 10-17)
  };
  // BUILD (his: "Next to each map a CR up/down, when you click the map it puts it in the next available slot"; 10-17, step C: "Maps chosen/bought here show up on the ladder
  // building screen (instead of all available maps). DM flag when he adds each map if he allows short rest, long rest, market visit between runs of his module(ladder)"):
  // the maps you own on the left, a CR each; the module on the right -- its name (RENAME), its fights, each with R (filled again), x (taken off) and what follows it,
  // S a short rest, L a long rest, M the market (a short rest on, the rest off: RULED 10-17); SAVE TO THE FOLDER writes it as a module file
  Pocket.prototype.drawBuild = function (ctx) {
    var self = this, st = this.st, cp = PD.camp(st), m = PD.editing(st), ids = PD.myMaps(this), per = 11;
    if (!m) { this.go('camp'); return; }
    head(ctx, 'BUILD A MODULE', 'a map clicked adds a fight at its CR: your newest units first, the rest rolled');
    var from = Math.min(this.scroll, Math.max(0, ids.length - per)); this.scroll = from;
    var dflt = this.crI >= 0 ? this.crI : 5, full = m.slots.length >= PK.MODULE_MAX;
    ids.slice(from, from + per).forEach(function (id, i) {
      var def = D.MAPS[id], yy = 36 + i * 16, ci = cp.mapCR[id] == null ? dflt : cp.mapCR[id];
      self.btn(ctx, cut(def.name || id, 124), 14, yy, 132, 14, function () {
        var s = PD.addSlot(self, m, id, PK.VALUES[ci]); if (!s) { D.sfx('error'); self.say('all ' + PK.MODULE_MAX + ' fights are set: take one off on the right', 240); return; }
        m.at = Date.now(); self.keep(); self.say('FIGHT ' + m.slots.length + ': ' + (def.name || id) + ', ' + PK.foesText(s.foes) + (s.mine ? ' (' + s.mine + ' yours)' : ''), 300);
      }, { small: true, dis: full, why: 'all ' + PK.MODULE_MAX + ' fights are set: take one off on the right' });
      D.text(ctx, '{g}' + ({ underground: 'U', urban: 'R', outdoors: 'O' }[PD.landOf(id)] || '?') + '{/}' + (def.dark ? '{p}D{/}' : ''), 150, yy + 3, P('stone', 5));
      self.btn(ctx, '<', 166, yy, 14, 14, function () { cp.mapCR[id] = Math.max(0, ci - 1); self.keep(); }, { small: true });
      D.text(ctx, 'CR ' + PK.fmt8(PK.VALUES[ci]), 208, yy + 3, P('gold', 4), 'center');
      self.btn(ctx, '>', 236, yy, 14, 14, function () { cp.mapCR[id] = Math.min(PK.VALUES.length - 1, ci + 1); self.keep(); }, { small: true });
    });
    if (!ids.length) { D.text(ctx, 'no maps of your own yet:', 20, 44, P('stone', 5)); this.btn(ctx, 'THE LOCATIONS', 20, 56, 120, 14, function () { self.scroll = 0; self.go('locations'); }, { pri: true }); }
    if (ids.length > per) D.text(ctx, 'wheel: ' + (from + 1) + '-' + Math.min(ids.length, from + per) + ' of ' + ids.length, 14, 36 + per * 16 + 2, P('stone', 5));
    D.text(ctx, '{g}U{/} underground  {g}R{/} urban  {g}O{/} outdoors  {p}D{/} dark', 14, 214, P('stone', 5));
    // the module
    var px = 258, pw = D.W - px - 8;
    D.win8(ctx, px, 32, pw, 192);
    if (this.naming) {
      this.useField('input', { x: px + 6, y: 35, w: pw - 60, h: 13 }, m.name, function (v) { m.name = String(v || '').toUpperCase().slice(0, 24) || 'A MODULE'; self.keep(); });
      if (this.field && this.t - (this.nameT || 0) > 10 && document.activeElement !== this.field.el) { this.naming = false; this.dropField(); } // (Enter or a click away: the name kept)
    } else D.text(ctx, '{y}' + cut(m.name, pw - 70) + '{/}', px + 6, 38, P('gold', 4));
    this.btn(ctx, this.naming ? 'DONE' : 'RENAME', px + pw - 52, 35, 46, 12, function () { if (self.naming) { self.naming = false; self.dropField(); } else { self.naming = true; self.nameT = self.t; } }, { small: true, on: !!this.naming });
    D.text(ctx, '{g}' + m.slots.length + ' of ' + PK.MODULE_MAX + ' fights · then S short, L long, M market{/}', px + 6, 50, P('stone', 5));
    m.slots.forEach(function (sl, i) {
      var yy = 60 + i * 16, last = i === m.slots.length - 1, rs = sl.rest = sl.rest || PD.REST0();
      D.text(ctx, '{y}' + (i + 1) + '{/} ' + cut((D.MAPS[sl.map] || {}).name || sl.map, pw - 128) + '  {g}CR ' + PK.fmt8(PK.sum8(sl.foes || [])) + (sl.mine ? ' · ' + sl.mine + ' yours' : '') + '{/}', px + 6, yy, P('bone', 1));
      D.text(ctx, cut(PK.foesText(sl.foes || []), pw - 104), px + 14, yy + 8, P('stone', 6));
      self.btn(ctx, 'R', px + pw - 84, yy + 7, 12, 9, function () { var f = PD.fill(self, sl.map, sl.cr8, PD.placed(m.slots, i)); sl.foes = f.foes; sl.mine = f.mine; sl.units = f.units; self.keep(); }, { small: true }); // (filled again: the units as they stand now, a fresh roll for the rest)
      self.btn(ctx, 'x', px + pw - 70, yy + 7, 12, 9, function () { m.slots.splice(i, 1); self.keep(); }, { small: true });
      if (!last) [['short', 'S'], ['long', 'L'], ['market', 'M']].forEach(function (q, k) {
        self.btn(ctx, q[1], px + pw - 46 + k * 13, yy + 7, 12, 9, function () { rs[q[0]] = !rs[q[0]]; if (q[0] === 'long' && rs.long) rs.short = false; if (q[0] === 'short' && rs.short) rs.long = false; self.keep(); }, { small: true, on: !!rs[q[0]] }); // (a long rest or a short one, not both)
      });
      else D.text(ctx, '{g}the end{/}', px + pw - 6, yy + 8, P('stone', 5), 'right');
    });
    if (!m.slots.length) D.text(ctx, 'click a map on the left: it is fight 1', px + pw / 2, 90, P('stone', 5), 'center');
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'THE LOCATIONS', 86, 236, 100, 15, function () { self.scroll = 0; self.go('locations'); }, { small: true });
    this.btn(ctx, 'CLEAR IT', 192, 236, 64, 15, function () { var ask = self.ask || function (q) { return window.confirm(q); }; if (ask('Take every fight off ' + m.name + '?')) { m.slots = []; self.keep(); } }, { dis: !m.slots.length, small: true });
    this.btn(ctx, 'SAVE TO THE FOLDER', D.W - 150, 236, 130, 15, function () { PD.saveModule(self, m); }, { pri: true, dis: !m.slots.length, why: 'no fights yet' }); // (into the modules folder, THE CAMP's LOAD MODULE reads it; a download without one)
  };
  // DOORS: every door of URLS.md (10-08 and before), opened in a tab of its own so the table stays where it is
  PD.DOORS = [
    ['THE 8-BIT GAME', '../', 'the story, from the title'],
    ['ROUND SIX', '../?round6', 'all four at 4th on Fountain Street, nearly every quest done'],
    ['LEVEL THREE', '../?lvl3', 'all four just made 3rd, the first two quests done'],
    ['DOWN TO THE WET', '../?at=wet3&lead=lymen', 'a level-3 party led by Lymen, the gates down to the Wet open'],
    ['PRONE, 8-BIT', '../?at=prone8', 'a show: sleet over two ogres and a worg, each falling on its side'],
    ['THE SKYLIGHTS', '?fight=edifice', 'the Edifice\'s defend fight: two stone giants, two trolls, Pyro'],
    ['THE SKYLIGHTS, SQUASHED', '?fight=edifice&hscale=1', 'the same with heights drawn half as tall, as every map was before 10-14'],
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
  // ONE DOORS (10-17, Griz: "Usefuls is a less functional version of DOORS"): the release's title had USEFULS, eight rows that left the page; both tables now have
  // DOORS, each door in a tab of its own. The release's are the eight (PD.PUBLIC); the DM's table every door above, with the notes first and the Discord last.
  // A row's link 'notes:' opens SITUATIONS' notes box, not a page
  PD.NOTES = ['SITUATIONS', 'notes:', 'what you noticed, in your own words: a notes file of its own (hero_situations_feedback)'];
  PD.DISCORD = ['THE DISCORD', PK.DISCORD, 'the game\'s Discord'];
  PD.PUBLIC = [
    ['THE LADDER', '?ladder', 'the story\'s fights, rung by rung, the four at each level'],
    ['THE TESTER LADDER', '?ladder&party=ours', 'Talmok, Willem, Katarina and Torvald; you watch, or play (P) and it is recorded'],
    ['THE CLIMB', '?climb', 'one party from level 1 to 9, your own picks at each level'],
    ['THE GALLERY', '?gallery&from=pocket', 'spells, features, the Mascots and every creature\'s rows: one door, one set of keys'],
    ['TEST RUNS', '../test-runs.html', 'the page that builds any URL of the game, row by row'],
    PD.NOTES,
    ['EVERY URL', 'https://github.com/GrimGriz/dragonsleep-8bit/blob/main/URLS.md', 'URLS.md: the whole list, with what each does'],
    PD.DISCORD
  ];
  PD.doorsFor = function (st) { return st && st.dm ? [PD.NOTES].concat(PD.DOORS, [PD.DISCORD]) : PD.PUBLIC; };
  PD.doorUrl = function (u) { if (/^https?:/.test(u)) return u; if (/^\.\.\//.test(u) || u === './') return new URL(u, location.href).href; return location.origin + location.pathname + u; };
  Pocket.prototype.drawDoors = function (ctx) {
    var self = this, per = 11, list = PD.doorsFor(this.st);
    head(ctx, 'DOORS', this.st.dm ? 'every door of the game, each in a tab of its own · the whole list is URLS.md' : 'the other doors of the grid and the pages beside the game, each in a tab of its own');
    var from = Math.min(this.scroll, Math.max(0, list.length - per)); this.scroll = from;
    list.slice(from, from + per).forEach(function (r, i) {
      var yy = 36 + i * 16;
      self.btn(ctx, cut(r[0], 150), 14, yy, 160, 14, function () { if (r[1] === 'notes:') self.go('feedback'); else self.open(PD.doorUrl(r[1])); }, { small: true });
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
        dm: cp ? { purse: PD.fmt(cp.purse), units: (cp.units || []).map(function (u) { return PD.unitName(u) + ' (CR ' + PK.fmt8(PD.unitCR8(u)) + ')'; }), receipts: (cp.bought || []).map(function (r) { return r.kind; }), strike: cp.strike || [], maps: (cp.maps || []).map(function (x) { return x.id; }), modules: (cp.modules || []).map(function (m) { return m.name + ': ' + (m.slots || []).map(function (s) { return s.map + ' CR ' + PK.fmt8(PK.sum8(s.foes || [])); }).join(', '); }), marks: cp.marks || {} } : null
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
    rascal: { who: 'rascal', title: 'RASCAL JOINS THE ROSTER', lines: ['A Lobstamonkee pops up from between the receipts, grinning.', '"A unit of villains? Every unit needs a rascal."', '{g}Rascal is on the roster now: cycle a seat at THE PARTY.{/}'], sfx: 'levelup' },
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
    eye: ['............', '....oooo....', '..ooVVVVoo..', '.oVVwwwwVVo.', 'oVVwwoowwVVo', 'oVwwooMowwVo', 'oVwwoooowwVo', 'oVVwwoowwVVo', '.oVVwwwwVVo.', '..ooVVVVoo..', '....oooo....', '............'],
    crown: ['............', '............', '.o...oo...o.', 'oRo.oRRo.oRo', 'ogo.oggo.ogo', 'oggoggggoggo', 'oggggggggggo', 'ogRggVVggRgo', 'oggggggggggo', 'oooooooooooo', '............', '............'] // (THE VILLAINS, 10-17)
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
