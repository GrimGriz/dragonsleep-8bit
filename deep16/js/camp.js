/* DEEP16 — the camp (Griz, 09-27: the camp screen; "spell prep should probably run before each fight"; "cost for mage
   armor"). Between a rung and its fight: the four as the 8-bit game builds them at that level, and the morning's three
   choices. EQUIP from the rung's armoury (free: nobody is fighting yet). PREPARE the day's spells (js/save.js: a wizard
   INT modifier + level from his book, a paladin CHA modifier + half his level from his list, the oath's always ready).
   CAST AHEAD the 8-hour spells, Mage Armor and Aid: they walk into the fight already on, and their slots are spent.
   The choices are kept per level (deep16.camp), so a rung fought again starts from the last morning.
   o.ours (09-29, the light handoff's Â§3b, Griz: a camp for the tester ladder "so we can test equipment etc"): our four's morning. No hero
   record stands behind them, so the choices become specs (js/classes.js NPC.sheet reads equip, prepared, conds, spend, aid, mageArmor);
   the fight builds its units from those specs (battle.js o.npc.party), and this screen shows the sheets the same specs make. Kept per
   level in deep16.camp.ours. The fire is back for them (Griz, 09-29: "bring the test campfire up to snuff"): the four sit the fire's four seats in order. */
'use strict';
(function () {
  var D = window.D16, I = D.input, DS = window.DS, SV = D.save;
  var P = function (r, i) { return D.PAL.ramps[r][i]; };
  var KEY = 'deep16.camp';
  // (10-06: the worn places -- js/rules.js R.PLACES -- two rings, the cloak, the feet, the neck; a thing's own place is R.slotFor)
  var SLOTS = [['weapon', 'WEAPON'], ['armor', 'ARMOUR'], ['shield', 'SHIELD'], ['ring', 'RING'], ['ring2', 'RING (2ND)'], ['cloak', 'CLOAK'], ['feet', 'FEET'], ['neck', 'NECK']];

  // the armoury a rung offers: the 8-bit game's gear by then. Silverton's racks (the Show-Armorer, the Pawnbroker) from the
  // start; from 5, after the lake, its hoard given back and Winters' cases; from 6 what's behind the fountains; plate at 8
  var ARMOURY = [
    [1, ['longsword', 'battleaxe', 'warhammer', 'greatsword', 'greataxe', 'maul', 'mace', 'spear', 'handaxe', 'shortsword', 'rapier', 'shortbow',
         'leather', 'studded', 'hide', 'chainshirt', 'scalemail', 'ringmail', 'chainmail', 'splint', 'shield']],
    // and two that aren't a plus (Griz, 09-27: "create two of the 'magic other than a +' items"): Flame Tongue, the Cloak of Displacement
    // and the worn things of 10-06 (SRD 5.1): the Boots of Elvenkind, uncommon, from 5 with the plus-ones; the rares -- the Ring of Resistance (fire), the Periapt of Proof against Poison -- from 6
    [5, ['longsword1', 'maul1', 'dagger1', 'staff1', 'leather1', 'studded1', 'hide1', 'chainshirt1', 'scalemail1', 'chainmail1', 'splint1', 'robes1', 'ringofprotection',
         'flametongue', 'cloakdisplacement', 'bootselvenkind']],
    [6, ['doorshield', 'lighthammer', 'ringresistfire', 'periaptpoison']],
    [8, ['dwarfplate']]
  ];
  function armoury(L) {
    var out = [];
    ARMOURY.forEach(function (a) { if (L >= a[0]) out = out.concat(a[1]); });
    return out.filter(function (id) { return DS.DATA.items[id]; });
  }
  function item(id) { return id ? DS.DATA.items[id] : null; }
  // the 8-bit game has no cloak slot: anyone can wear a cloak
  function canWear(h, it) { return it.kind === 'cloak' || DS.R.canEquip(h, it); }
  // a thing goes in a slot of its own kind; a ring in either hand; a `worn` thing (boots, a periapt) in the place it names (js/rules.js R.slotFor)
  function fits(it, slot) { return it.kind === 'worn' ? it.place === slot : it.kind === 'ring' ? slot === 'ring' || slot === 'ring2' : it.kind === slot; }
  // what a worn thing does, in the list's right-hand column (the AC for the armour, the ring's AC when it has one)
  function wornWords(it) {
    var bits = [];
    if (it.resist) bits.push('resists ' + it.resist.join(', '));
    if (it.immune) bits.push('immune ' + it.immune.join(', '));
    if (it.adv) bits.push('adv. ' + it.adv.join(', '));
    return bits.join('; ');
  }
  function twoHanded(id) { var it = item(id); return !!(it && it.weapon && (it.weapon.props || []).indexOf('two-handed') >= 0); }
  // the lowest slot of a level or higher with one left (index), or -1
  function slotAt(h, lvl) { for (var i = lvl - 1; i < (h.slots || []).length; i++) if (h.slots[i] > 0) return i; return -1; }

  // o.climb (js/climb.js): the climb's own party, rested, instead of the ladder's fixture; its gear stays with it
  function Camp(L, F, done, o) { this.L = L; this.F = F; this.done = done; this.t = 0; this.o = o || {}; }
  D.Camp = Camp;
  Camp.prototype.opaque = true;
  Camp.prototype.enter = function () {
    var all = D.store.get(KEY) || {}, cl = this.o.climb, ours = this.o.ours;
    this.st = cl ? (cl.campState() || this.fresh()) : ours ? ((D.store.get(KEY + '.ours') || {})[this.L] || this.fresh()) : all[this.L] || this.fresh();
    if (ours) this.st.cast.light = this.st.cast.light || { on: null, who: null };
    this.st.cast.elemental = this.st.cast.elemental || { on: false, kind: null };
    this.base = cl ? cl.rested() : ours ? null : SV.fixture(this.L, { bare: true });
    this.mode = 'menu'; this.sel = 0; this.top = 0; this.stack = []; this.msg = null;
    this.rebuild();
    // the four's figures before the camp draws, and the coming fight's foes and scenery fetched behind (10-03, the lazy sheets: js/sprites.js)
    var self = this, F = this.F, mapDef = D.MAPS[F.map] || {};
    D.spr.gate(this, this.data.party.map(function (h) { return self.look(h.id).sheet || h.id + '_p0'; }));
    D.spr.prefetch((F.foes || mapDef.foes || []).map(function (f) { return D.FOES[f.kind] && D.FOES[f.kind].sheet; })
      .concat((F.riders || []).map(function (r) { return r.sheet; }), this.o.ours ? [] : this.data.party.map(function (h) { return SV.look(h.id, self.o.climb ? null : F).sheet; })));
  };
  Camp.prototype.fresh = function () {
    if (this.o.ours) return { equip: {}, prep: {}, cast: { mageArmor: { on: true, who: null }, aid: { on: false, out: null }, light: { on: null, who: null }, elemental: { on: false, kind: null } }, torch: null, torchKind: 'torch' };
    return { equip: {}, prep: {}, cast: { mageArmor: { on: true, who: 'aurdin' }, aid: { on: false, out: 'lymen' }, elemental: { on: false, kind: null } }, torchKind: 'torch' };
  };
  Camp.prototype.save = function () {
    if (this.o.climb) { this.o.climb.setCamp(this.st); return; }
    if (this.o.ours) { var oa = D.store.get(KEY + '.ours') || {}; oa[this.L] = this.st; D.store.set(KEY + '.ours', oa); return; }
    var all = D.store.get(KEY) || {}; all[this.L] = this.st; D.store.set(KEY, all);
  };
  Camp.prototype.look = function (id) {
    if (this.o.ours) { var h = this.hero(id); return h ? { name: h.name, sheet: D.npc.lookOf(h.spec) } : {}; } // (a named one's own figure, else the class's)
    return SV.look(id, this.o.climb ? null : this.F); // the climb: Barley is Barley
  };
  Camp.prototype.dark = function () { return !!(this.F.dark != null ? this.F.dark : D.MAPS[this.F.map] && D.MAPS[this.F.map].dark); };
  // the day's spells: the heroes' by js/save.js; our four's by js/classes.js NPC.prepInfo (o.ours)
  Camp.prototype.prepCount = function (h) { return this.o.ours ? (this.pinfo[h.id] ? this.pinfo[h.id].n : 0) : SV.prepCount(h); };
  Camp.prototype.prepPool = function (h) { return this.o.ours ? (this.pinfo[h.id] ? this.pinfo[h.id].pool : []) : SV.prepPool(h); };
  Camp.prototype.isCaster = function (h) { return this.o.ours ? !!this.pinfo[h.id] : h.cls === 'wizard' || h.cls === 'paladin'; };

  // ------------------------------------------------------------------ the morning, built from the choices
  Camp.prototype.build = function () {
    var R = DS.R, st = this.st, data = JSON.parse(JSON.stringify(this.base)), hs = data.party, by = {};
    hs.forEach(function (h) { by[h.id] = h; });
    // the armoury: one of each; what a hero sets down goes back in it, for anyone
    var avail = {}; armoury(this.L).forEach(function (id) { avail[id] = (avail[id] || 0) + 1; });
    var give = function (id) { if (id) avail[id] = (avail[id] || 0) + 1; };
    var take = function (id) { if (!id || !avail[id]) return false; avail[id]--; return true; };
    var want = {};
    hs.forEach(function (h) {
      var ch = st.equip[h.id] || {};
      Object.keys(ch).forEach(function (s) { if (ch[s] === h.equip[s]) return; (want[h.id] = want[h.id] || {})[s] = { id: ch[s], def: h.equip[s] }; give(h.equip[s]); h.equip[s] = null; });
    });
    hs.forEach(function (h) {
      var w = want[h.id] || {};
      Object.keys(w).forEach(function (s) { if (!w[s].id) return; if (take(w[s].id)) h.equip[s] = w[s].id; else if (take(w[s].def)) h.equip[s] = w[s].def; });
    });
    this.avail = avail;
    // the camp is the night's rest: what is worn and wants a bond takes it up, what was set down lets go (js/rules.js R.attune -- a fixture's hero keeps a list of bonds);
    // what was let go on THE NIGHT'S BONDS stays let go while it is worn (st.noBond, a hero's list: R.attune reads h.noBond -- 10-07, the menus lane §2.4)
    var nb = st.noBond || {};
    hs.forEach(function (h) { if (!h.attuned) return; if (nb[h.id] && nb[h.id].length) h.noBond = nb[h.id].slice(); R.attune(h); });
    // the day's spells
    hs.forEach(function (h) {
      if (!SV.prepCount(h)) return;
      var pool = SV.prepPool(h);
      h.prepared = (st.prep[h.id] || SV.prepDefault(h)).filter(function (id) { return pool.indexOf(id) >= 0; }).slice(0, SV.prepCount(h));
    });
    // cast ahead: Mage Armor (a creature in no armour; robes aren't armour to it), Aid (three of the four, a 2nd-level slot)
    var az = by.aurdin, ly = by.lymen, info = {};
    var ma = st.cast.mageArmor, mt = by[ma.who] || az, mwhy = '';
    if (!az || !az.prepared || az.prepared.indexOf('mageArmor') < 0) mwhy = az && SV.prepPool(az).indexOf('mageArmor') >= 0 ? 'not prepared' : 'not in Aurdin\'s book';
    else if (R.armored(mt)) mwhy = mt.name + ' wears armour';
    else if (slotAt(az, 1) < 0) mwhy = 'no slot left';
    if (ma.on && !mwhy) { az.slots[slotAt(az, 1)]--; mt.conds.mageArmor = 1; }
    info.mageArmor = { why: mwhy, target: mt, on: ma.on && !mwhy, has: !!az && SV.prepPool(az).indexOf('mageArmor') >= 0 };
    var aid = st.cast.aid, at = hs.filter(function (h) { return h.id !== aid.out; }).slice(0, 3), awhy = '';
    if (!ly || !ly.prepared || ly.prepared.indexOf('aid') < 0) awhy = ly && SV.prepPool(ly).indexOf('aid') >= 0 ? 'not prepared' : 'Lymen has it from level 5';
    else if (slotAt(ly, 2) < 0) awhy = 'no 2nd-level slot left';
    if (aid.on && !awhy) { ly.slots[slotAt(ly, 2)]--; at.forEach(function (h) { h.maxhp += 5; h.hp += 5; h.conds.aid = (h.conds.aid || 0) + 5; }); }
    info.aid = { why: awhy, targets: at, on: aid.on && !awhy, has: !!ly && SV.prepPool(ly).indexOf('aid') >= 0 };
    info.elemental = { has: false };
    // a torch in hand (Griz, 09-28h: "Can we add 'Aurdin torch' as a campfire prepare?"): lit at the camp, out of the pack, so
    // nobody spends the fight's first action on the tinderbox; it takes a hand, as on the grid (js/light.js L.handsFree)
    // (09-29: or a hooded lantern, when the pack has one -- bright 30 and dim 30, hood down in the fight: dim 5 ft and a roost sleeps)
    // (09-30: and the Ledger-Lamp when the pack has it -- a hooded light of its own, bright 40 and dim 40, never spent; any pack item whose use is `light`)
    var lights = ['torch', 'lantern'].concat(Object.keys(DS.DATA.items).filter(function (k) { var u = DS.DATA.items[k].use; return k !== 'torch' && k !== 'lantern' && u && u.effect === 'light'; })),
      kinds = lights.filter(function (k) { return (data.inv || []).some(function (s) { return s.id === k && s.n > 0; }); }), kind = lights.indexOf(st.torchKind) >= 0 ? st.torchKind : 'torch';
    var tb = by[st.torch], tpack = (data.inv || []).filter(function (s) { return s.id === kind; })[0], twhy = '';
    if (tb) {
      if (!tpack || tpack.n < 1) twhy = 'no ' + D.light.word(kind) + ' in the pack';
      else if (twoHanded(tb.equip.weapon)) twhy = tb.name + '\'s ' + item(tb.equip.weapon).name + ' takes both hands';
      else if (tb.equip.weapon && tb.equip.shield) twhy = tb.name + ' has a weapon and a shield';
      if (!twhy) { tpack.n--; data.torchBy = tb.id; data.torchKind = kind; }
    }
    info.torch = { who: tb || null, why: twhy, on: !!tb && !twhy, left: tpack ? tpack.n : 0, kind: kind, kinds: kinds };
    this.info = info;
    return data;
  };
  Camp.prototype.rebuild = function () { this.data = this.o.ours ? this.buildOurs() : this.build(); };

  // ------------------------------------------------------------------ our four's morning (o.ours). The class's own morning first (its kit, its
  // list), the choices laid over it as specs, and the sheets those specs make, so what is shown is what the fight will build
  Camp.prototype.buildOurs = function () {
    var N = D.npc, R = DS.R, st = this.st, self = this, info = {}, at = function (hs, h) { return h ? hs.filter(function (x) { return x.id === h.id; })[0] || null : null; };
    var base = this.o.ours.party.map(function (w, i) { var s = N.spec(w); s.id = 'p' + i + '-' + String(w).split(':')[0]; s.mageArmor = false; return s; });
    var own = base.map(function (s) { return N.sheet(s); });
    // the armoury: one of each; what one sets down goes back in it, for anyone
    var avail = {}; armoury(this.L).forEach(function (id) { avail[id] = (avail[id] || 0) + 1; });
    var give = function (id) { if (id) avail[id] = (avail[id] || 0) + 1; };
    var take = function (id) { if (!id || !avail[id]) return false; avail[id]--; return true; };
    var eq = own.map(function (h) { var e = Object.assign({}, h.equip), ch = st.equip[h.id] || {}; Object.keys(ch).forEach(function (sl) { if (ch[sl] === h.equip[sl]) return; give(h.equip[sl]); e[sl] = null; }); return e; });
    own.forEach(function (h, i) { var ch = st.equip[h.id] || {}; Object.keys(ch).forEach(function (sl) { if (ch[sl] === h.equip[sl] || !ch[sl]) return; if (take(ch[sl])) eq[i][sl] = ch[sl]; else if (take(h.equip[sl])) eq[i][sl] = h.equip[sl]; }); });
    this.avail = avail;
    // the day's spells (js/classes.js NPC.prepInfo: the pool, the count, the class's default day)
    this.pinfo = {};
    var specs = base.map(function (s, i) {
      var sp = Object.assign({}, s, { equip: eq[i], conds: {}, spend: [], aid: 0 }), pi = N.prepInfo(s);
      if (pi) { self.pinfo[s.id] = pi; sp.prepared = (st.prep[s.id] || pi.def).filter(function (id) { return pi.pool.indexOf(id) >= 0; }).slice(0, pi.n); }
      return sp;
    });
    var hs = specs.map(function (sp) { var h = N.sheet(sp); h.spec = sp; return h; }), by = {}; hs.forEach(function (h) { by[h.id] = h; });
    var knows = function (id, lv) { return hs.filter(function (h) { return h.known.indexOf(id) >= 0 && (!lv || slotAt(h, lv) >= 0); })[0] || null; };
    var could = function (id) { return Object.keys(self.pinfo).some(function (k) { return self.pinfo[k].pool.indexOf(id) >= 0; }); }; // (on someone's list, just not prepared today)
    var front = hs.filter(function (h) { return /barbarian|fighter|paladin|monk/.test(h.cls); })[0] || hs[0];
    // Mage Armor: whoever knows it (Willem), on a creature in no armour -- himself unless told otherwise
    var ma = st.cast.mageArmor, mc = knows('mageArmor', 1), mt = by[ma.who] || mc || hs[0], mwhy = '';
    if (!mc) mwhy = knows('mageArmor') ? 'no 1st-level slot left' : could('mageArmor') ? 'not prepared' : 'nobody knows it';
    else if (R.armored(mt)) mwhy = mt.name + ' wears armour';
    if (ma.on && !mwhy) { mc.spec.spend.push(1); mt.spec.conds.mageArmor = 1; }
    info.mageArmor = { why: mwhy, target: mt, caster: mc, on: ma.on && !mwhy, has: !!knows('mageArmor') || could('mageArmor') };
    // Aid: a cleric with it prepared and a 2nd-level slot, on three of the four (the caster goes without unless told otherwise)
    var aid = st.cast.aid, ac = knows('aid', 2), out = by[aid.out] || ac || hs[hs.length - 1], tg = hs.filter(function (h) { return h !== out; }).slice(0, 3), awhy = '';
    if (!ac) awhy = knows('aid') ? 'no 2nd-level slot left' : could('aid') ? 'not prepared' : 'nobody has it yet';
    if (aid.on && !awhy) { ac.spec.spend.push(2); tg.forEach(function (h) { h.spec.aid = 5; }); }
    info.aid = { why: awhy, targets: tg, out: out, caster: ac, on: aid.on && !awhy, has: !!knows('aid') || could('aid') };
    // Light: a cantrip, free, on the front man's gear (RULED 09-29: "the various participants should already be holding torch, lantern, or
    // someone glowing with Light as logical"): on by itself when the fight is in the dark
    var li = st.cast.light || {}, lc = knows('light'), lt = by[li.who] || front, lon = li.on != null ? !!li.on : this.dark(), lwhy = lc ? '' : 'nobody knows it';
    if (lon && !lwhy) lt.spec.conds.light = { by: lc.id };
    info.light = { why: lwhy, target: lt, caster: lc, on: lon && !lwhy, has: !!lc };
    // Conjure Elemental (RULED 09-30, Griz: "Let's add the earth elemental to camp and hold off on the rest"): a minute to cast, so the camp's;
    // whoever has it prepared and a 5th-level slot; the elemental walks in beside him and holds his concentration (js/walls.js W.seatConjured)
    var el = st.cast.elemental || { on: false }, ec = knows('conjureelemental', 5), kinds = D.walls ? D.walls.elementals() : [], ek = kinds.indexOf(el.kind) >= 0 ? el.kind : kinds[0], ewhy = '';
    if (!ec) ewhy = knows('conjureelemental') ? 'no 5th-level slot left' : could('conjureelemental') ? 'not prepared' : 'nobody has it';
    else if (!ek) ewhy = 'no elemental in the world to answer';
    if (el.on && !ewhy) { ec.spec.spend.push(5); ec.spec.conjured = ek; }
    info.elemental = { why: ewhy, caster: ec, kind: ek, kinds: kinds, on: !!el.on && !ewhy, has: !!knows('conjureelemental') || could('conjureelemental') };
    // a torch, or a hooded lantern (09-29), in hand: it takes a hand (no pack to count here: our four have both)
    var kind = st.torchKind === 'lantern' ? 'lantern' : 'torch', tb = by[st.torch], twhy = '';
    if (tb) {
      if (twoHanded(tb.equip.weapon)) twhy = tb.name + '\'s ' + item(tb.equip.weapon).name + ' takes both hands';
      else if (tb.equip.weapon && tb.equip.weapon !== 'unarmed' && tb.equip.shield) twhy = tb.name + ' has a weapon and a shield';
    }
    info.torch = { who: tb || null, why: twhy, on: !!tb && !twhy, left: 1, kind: kind, kinds: ['torch', 'lantern'] };
    // the sheets as the fight will build them, the casts laid on; the lists' names point at these
    var fin = specs.map(function (sp) { var h = N.sheet(sp); h.spec = sp; h.prepared = self.pinfo[h.id] ? sp.prepared : null; return h; });
    ['mageArmor', 'aid', 'light', 'elemental'].forEach(function (k) { var x = info[k]; x.target = at(fin, x.target); x.caster = at(fin, x.caster); if (x.targets) x.targets = x.targets.map(function (t) { return at(fin, t); }); if (x.out) x.out = at(fin, x.out); });
    info.torch.who = at(fin, info.torch.who);
    this.info = info; this.specs = specs;
    return { party: fin };
  };
  Camp.prototype.hero = function (id) { return this.data.party.filter(function (h) { return h.id === id; })[0]; };

  // what a hero's numbers would be with one slot changed (for the lists' right-hand column)
  function withItem(h, slot, id) {
    var R = DS.R, h2 = JSON.parse(JSON.stringify(h));
    h2.equip[slot] = id;
    if (slot === 'weapon' && twoHanded(id)) h2.equip.shield = null;
    if (slot === 'armor' && R.armored(h2)) delete h2.conds.mageArmor;
    if (slot === 'weapon' && !id) return 'bare hands';
    if (slot === 'cloak') { var ck = id && item(id) && item(id).cloak; return !ck ? '' : ck.displacement ? 'foes at disadvantage' : ck.spellSave ? '+' + ck.spellSave + ' saves vs spells' : wornWords(item(id)); } // (each cloak its own: the King's Mantle read "foes at disadvantage" -- the wearables runner, 10-06)
    var wi = id && item(id), ww = wi && wornWords(wi);
    if (ww) return ww; // (10-06: a worn thing says what it gives -- a ring of AC still says its AC)
    if (slot === 'feet' || slot === 'neck') return '';
    if (slot === 'weapon') { var w = R.weaponOf(h2), dm = R.damageExpr(h2, w); return D.rules.sign(R.attackBonus(h2, w)) + ' ' + dm.dice + (dm.mod ? D.rules.sign(dm.mod) : ''); }
    return 'AC ' + R.ac(h2);
  }

  // ------------------------------------------------------------------ the lists (the right-hand panel), one per mode
  Camp.prototype.list = function () {
    var self = this, R = DS.R, st = this.st, hs = this.data.party;
    var go = function (mode, extra) { return function () { self.stack.push({ mode: self.mode, sel: self.sel, top: self.top, pick: self.pick }); self.mode = mode; self.sel = 0; self.top = 0; if (extra) self.pick = Object.assign({}, self.pick, extra); }; };
    switch (this.mode) {
      case 'menu': return { title: 'THE CAMP', rows: [
        { label: 'EQUIP', right: armoury(this.L).length + ' in the armoury', act: go('hero'), desc: 'Weapons, armour, shields and rings from the armoury, free: nobody is fighting yet. What one hero sets down, another can take up.' },
        // THE NIGHT'S BONDS before the day's spells, as the 8-bit's morning has them (js/events.js EV.bonds; Griz, 10-06: "put bondings in front of spell prep in the morning") --
        // the grid camp's own since 10-07 (the menus lane §2.4: it bonded in silence)
        this.bondRows().length ? { label: 'THE NIGHT\'S BONDS', right: this.bondSum(), act: go('bonds'), desc: 'What the four wear that wants a bond (attunement, three at most each): bonded in the night, or waiting for room. E on one to let it go, or to take it up again.' } : null,
        { label: 'PREPARE SPELLS', right: hs.filter(function (h) { return h.prepared; }).map(function (h) { return (self.o.ours ? h.name.charAt(0) : h.name) + ' ' + h.prepared.length + '/' + self.prepCount(h); }).join('  '), act: go('caster'), desc: this.o.ours ? 'The day\'s spells. Willem prepares INT + his level from his book (the register\'s list and the Rimeglass\'s growth); Katarina and Torvald WIS + level from the cleric\'s list. Cantrips and the domain\'s own are always ready.' : 'The day\'s spells. Aurdin prepares INT + his level from his book; Lymen CHA + half his level from the paladin list. Cantrips, and Lymen\'s oath spells, are always ready.' },
        // (RULED 09-30, Griz: "what's in there should be dependent on party members": only what someone in the party has on their list)
        this.castAny() ? { label: 'CAST AHEAD', right: [this.info.mageArmor.on ? 'mage armor' : '', this.info.aid.on ? 'aid' : '', this.info.light && this.info.light.on ? 'light' : '', this.info.elemental && this.info.elemental.on ? D.FOES[this.info.elemental.kind].name.toLowerCase() : ''].filter(Boolean).join(', ') || 'nothing', act: go('cast'), desc: 'The long spells, cast this morning: they are on when the fight starts, and their slots are spent. Only what someone in the party can cast is here.' } : null,
        { label: 'A LIGHT IN HAND', right: this.info.torch.why || (this.info.torch.who ? this.info.torch.who.name + ', ' + D.light.word(this.info.torch.kind) : 'nobody'), ok: !this.info.torch.why || !!this.info.torch.who,
          act: function () { self.cycleTorch(1); }, cycle: function (d) { self.cycleTorch(d); },
          desc: 'Who walks in holding a light lit at the camp, from the pack: a torch (bright 20 ft, dim 20 more) or a hooded lantern (bright 30 ft, dim 30 more; HOOD DOWN in the fight for dim 5 ft only, and a roost sleeps), or the Ledger-Lamp when the pack has it (the lantern\'s law, bright 40 ft and dim 40 more, never runs dry), from the first round, no action spent on the tinderbox. It takes a hand (a versatile weapon is held in one); not with a two-handed weapon, or a weapon and a shield. Left/right or E: who, and which.' + ((this.F.dark != null ? this.F.dark : D.MAPS[this.F.map] && D.MAPS[this.F.map].dark) ? '  This fight is in the dark.' : '  This fight is not in the dark.') },
        // Find Familiar at the camp (Griz, 09-29: "yes - at appropriate level if caster in party"): a wizard of any level (it's his 1st-level ritual)
        this.famWiz() ? { label: 'A FAMILIAR', right: this.st.familiar ? this.famWiz().name + ', ' + DS.R.FAMILIARS[this.st.familiar].name : 'none', act: function () { self.cycleFamiliar(1); }, cycle: function (d) { self.cycleFamiliar(d); },
          desc: 'Find Familiar, called at the camp: a spirit in the shape of a small creature rides ' + this.famWiz().name + ' -- the owls on his shoulder, the rest at his feet -- and takes the Help action on the foe the party is on (the next blow at it with advantage). The owl flies back out untouched; the others stay, and carry his touch spells to what is beside them. It cannot attack, and has 1 or 2 HP.' } : null,
        { label: 'FIGHT', right: this.F.name, act: function () { self.fight(); }, desc: this.F.intro || '' },
        this.o.ours
          ? { label: 'THE CLASS\'S MORNING', right: 'reset', act: function () { self.st = self.fresh(); self.save(); self.rebuild(); D.sfx('confirm'); }, desc: 'Back to how the class builds them: their own kits, the register\'s lists, Mage Armor on Willem, Light on the front man when the fight is dark.' }
          : this.o.climb
          ? { label: 'RESET THE MORNING', right: 'reset', act: function () { self.st = self.fresh(); self.save(); self.rebuild(); D.sfx('confirm'); }, desc: 'The day\'s spells back to the default picks from what they know, Mage Armor on Aurdin if he knows it, and today\'s gear changes undone.' }
          : { label: 'THE BUILD\'S MORNING', right: 'reset', act: function () { self.st = self.fresh(); self.save(); self.rebuild(); D.sfx('confirm'); }, desc: 'Back to the 8-bit game\'s own picks: their own gear, the build\'s spells, Mage Armor on Aurdin.' },
        { label: this.o.climb ? 'BACK TO THE CLIMB' : 'BACK TO THE LADDER', right: '', act: function () { self.leave(null); }, desc: '' }
      ].filter(Boolean) }; // (A FAMILIAR only when a wizard is in the party)
      case 'hero': return { title: 'EQUIP WHOM?', rows: hs.map(function (h) { return { label: h.name.toUpperCase(), right: 'AC ' + R.ac(h) + '  ' + R.weaponOf(h).name, act: go('slot', { hero: h.id }), hero: h.id }; }) };
      case 'slot': {
        var h = this.hero(this.pick.hero);
        return { title: 'EQUIP ' + h.name.toUpperCase(), rows: SLOTS.map(function (s) {
          var it = item(h.equip[s[0]]);
          return { label: s[1], right: it ? it.name : '-', act: go('item', { slot: s[0] }), hero: h.id };
        }) };
      }
      case 'item': {
        var h2 = this.hero(this.pick.hero), slot = this.pick.slot, cur = h2.equip[slot], rows = [];
        if (cur) rows.push({ label: '(take it off)', right: withItem(h2, slot, null), act: function () { self.setEquip(h2, slot, null); }, hero: h2.id });
        if (cur) rows.push({ label: item(cur).name + '  (worn)', right: withItem(h2, slot, cur), ok: false, why: 'already worn', hero: h2.id, desc: item(cur).desc });
        Object.keys(this.avail).sort().forEach(function (id) {
          var it = item(id);
          if (!it || !self.avail[id] || !fits(it, slot) || !canWear(h2, it)) return;
          var why = slot === 'shield' && twoHanded(h2.equip.weapon) ? R.weaponOf(h2).name + ' takes both hands' : '';
          rows.push({ label: it.name, right: withItem(h2, slot, id), ok: !why, why: why, act: function () { self.setEquip(h2, slot, id); }, hero: h2.id, desc: it.desc });
        });
        if (!rows.length) rows.push({ label: '(nothing here ' + h2.name + ' can use)', ok: false, why: 'the armoury has nothing for that slot' });
        return { title: h2.name.toUpperCase() + ': ' + slot.toUpperCase(), rows: rows };
      }
      case 'bonds': return { title: 'THE NIGHT\'S BONDS', rows: this.bondRows().map(function (b) {
        var it = item(b.id);
        return { label: b.h.name.toUpperCase() + ': ' + it.name, right: b.state, hero: b.h.id, act: function () { self.toggleBond(b); },
          desc: (it.desc || '') + (b.state === 'BONDED' ? '  E: let it go.' : b.state === 'LET GO' ? '  E: bond with it again.' : '  Three bonds held: let one go first.') };
      }) };
      case 'caster': return { title: 'PREPARE WHOSE SPELLS?', rows: hs.filter(function (h) { return self.isCaster(h); }).map(function (h) {
        var n = self.prepCount(h);
        return { label: h.name.toUpperCase(), right: n ? h.prepared.length + ' of ' + n + ' prepared' : 'no spells yet', ok: !!n, why: 'a paladin has no spells until level 2', act: go('spells', { hero: h.id }), hero: h.id };
      }) };
      case 'spells': {
        var c = this.hero(this.pick.hero), n2 = self.prepCount(c), ours = !!this.o.ours, oath = ours ? self.pinfo[c.id].always : SV.oath(c);
        var rows2 = self.prepPool(c).map(function (id) {
          var sp = SV.spell(id), on = c.prepared.indexOf(id) >= 0;
          return { label: (on ? '[x] ' : '[ ] ') + sp.name, right: 'L' + sp.level + (D.SPELLS[id] && D.SPELLS[id].shape === 'none' ? '  no use in a fight' : ''), on: on, desc: D.typeText(sp.desc), hero: c.id,
            act: function () { self.togglePrep(c, id); } };
        });
        oath.forEach(function (id) { rows2.push({ label: '[*] ' + SV.spell(id).name, right: ours ? 'domain: always ready' : 'oath: always ready', ok: false, why: ours ? (c.subclass || 'the domain') + ' keeps it ready' : 'the Oath of Devotion keeps it ready', hero: c.id, desc: SV.spell(id).desc }); });
        (ours ? [] : SV.rituals(c)).forEach(function (id) { rows2.push({ label: '[*] ' + SV.spell(id).name, right: 'ritual: from the book', ok: false, why: 'a ritual: cast from the book, never prepared', hero: c.id, desc: SV.spell(id).desc }); });
        return { title: c.name.toUpperCase() + ': ' + c.prepared.length + ' OF ' + n2 + ' PREPARED', rows: rows2 };
      }
      case 'cast': {
        if (this.o.ours) return this.castListOurs();
        var mi = this.info.mageArmor, ai = this.info.aid;
        return { title: 'CAST AHEAD (left/right: on whom)', rows: [].concat(!mi.has ? [] : [
          { label: (mi.on ? '[x] ' : '[ ] ') + 'MAGE ARMOR on ' + mi.target.name, right: mi.why || '1st-level slot', ok: !mi.why || mi.on, why: mi.why, hero: mi.target.id,
            act: function () { st.cast.mageArmor.on = !st.cast.mageArmor.on; self.changed(); }, cycle: function (d) { self.cycleMage(d); },
            desc: 'Aurdin, on a creature in no armour: AC 13 + DEX for 8 hours. Robes are not armour to it. It ends if the wearer puts on armour.' },
          // the target by a click as well as left/right (a mouse or the phone pad has no left/right on a row -- Griz, 09-28)
          { label: '     on whom: ' + mi.target.name, right: 'next', act: function () { self.cycleMage(1); }, hero: mi.target.id,
            desc: 'Whom Aurdin casts it on: anyone in no armour (robes are not armour to it), himself included.' }], !ai.has ? [] : [
          { label: (ai.on ? '[x] ' : '[ ] ') + 'AID on ' + ai.targets.map(function (h) { return h.name; }).join(', '), right: ai.why || '2nd-level slot, +5 HP', ok: !ai.why || ai.on, why: ai.why,
            act: function () { st.cast.aid.on = !st.cast.aid.on; self.changed(); }, cycle: function (d) { self.cycleAid(d); },
            desc: 'Lymen, on three of the four: +5 to their maximum and current HP for 8 hours.' },
          { label: '     goes without: ' + (this.data.party.filter(function (h) { return h.id === st.cast.aid.out; })[0] || {}).name, right: 'next', act: function () { self.cycleAid(1); },
            desc: 'Aid takes three of the four (SRD: up to three creatures of the caster\'s choice). Lymen may be one of them: pick who goes without.' }]) };
      }
    }
    return { title: '', rows: [] };
  };

  // CAST AHEAD for our four (o.ours): whoever knows the spell casts it -- Mage Armor (Willem), Aid (a cleric from 3), Light (a cleric's
  // cantrip, free) on the front man
  Camp.prototype.castListOurs = function () {
    var self = this, st = this.st, mi = this.info.mageArmor, ai = this.info.aid, li = this.info.light, ei = this.info.elemental, nm = function (h) { return h ? h.name : 'nobody'; };
    return { title: 'CAST AHEAD (left/right: on whom)', rows: [].concat(!mi.has ? [] : [
      { label: (mi.on ? '[x] ' : '[ ] ') + 'MAGE ARMOR on ' + nm(mi.target), right: mi.why || '1st-level slot', ok: !mi.why || mi.on, why: mi.why, hero: mi.target && mi.target.id,
        act: function () { st.cast.mageArmor.on = !st.cast.mageArmor.on; self.changed(); }, cycle: function (d) { self.cycleMage(d); },
        desc: (mi.caster ? mi.caster.name : 'A wizard') + ', on a creature in no armour: AC 13 + DEX for 8 hours. Robes are not armour to it. It ends if the wearer puts on armour.' },
      { label: '     on whom: ' + nm(mi.target), right: 'next', act: function () { self.cycleMage(1); }, hero: mi.target && mi.target.id, desc: 'Whom it is cast on: anyone in no armour, the caster included. Talmok fights bare: it fits him.' }], !ai.has ? [] : [
      { label: (ai.on ? '[x] ' : '[ ] ') + 'AID on ' + ai.targets.map(nm).join(', '), right: ai.why || '2nd-level slot, +5 HP', ok: !ai.why || ai.on, why: ai.why,
        act: function () { st.cast.aid.on = !st.cast.aid.on; self.changed(); }, cycle: function (d) { self.cycleAid(d); },
        desc: (ai.caster ? ai.caster.name : 'A cleric') + ', on three of the four: +5 to their maximum and current HP for 8 hours.' },
      { label: '     goes without: ' + nm(ai.out), right: 'next', act: function () { self.cycleAid(1); }, desc: 'Aid takes three of the four (SRD: up to three creatures). Pick who goes without.' }], !li.has ? [] : [
      { label: (li.on ? '[x] ' : '[ ] ') + 'LIGHT on ' + nm(li.target), right: li.why || 'a cantrip: free', ok: !li.why || li.on, why: li.why, hero: li.target && li.target.id,
        act: function () { st.cast.light.on = !li.on; self.changed(); }, cycle: function (d) { self.cycleLight(d); },
        desc: (li.caster ? li.caster.name : 'A cleric') + ' puts Light on the front man\'s gear: bright 20 ft and dim 20 more for an hour, no hand taken. On by itself when the fight is in the dark' + (this.dark() ? ' -- as this one is.' : '; this one is not.') },
      { label: '     on whom: ' + nm(li.target), right: 'next', act: function () { self.cycleLight(1); }, hero: li.target && li.target.id, desc: 'Whom the Light goes on: the one who meets the foes first, so they are lit where he stands.' }], !ei || !ei.has ? [] : [
      { label: (ei.on ? '[x] ' : '[ ] ') + 'CONJURE ELEMENTAL' + (ei.caster ? ' by ' + ei.caster.name : ''), right: ei.why || '5th-level slot', ok: !ei.why || ei.on, why: ei.why, hero: ei.caster && ei.caster.id,
        act: function () { st.cast.elemental.on = !st.cast.elemental.on; self.changed(); }, cycle: function (d) { self.cycleElemental(d); },
        desc: (ei.caster ? ei.caster.name : 'A druid or a wizard') + ' spends the minute it takes this morning: an elemental of CR 5 or less walks into the fight beside him, his to command, with its own initiative, and holds his concentration. If that breaks -- a hard blow, another spell that wants it -- it breaks loose and turns on the party.' },
      { label: '     which: ' + (ei.kind ? D.FOES[ei.kind].name : 'none'), right: ei.kinds.length > 1 ? 'next' : '', act: function () { self.cycleElemental(1); }, desc: 'The world\'s elementals of CR 5 or less: ' + ei.kinds.map(function (k) { return D.FOES[k].name; }).join(', ') + '.' }
    ]) };
  };
  Camp.prototype.castAny = function () { var i = this.info; return !!((i.mageArmor && i.mageArmor.has) || (i.aid && i.aid.has) || (i.light && i.light.has) || (i.elemental && i.elemental.has)); };
  Camp.prototype.cycleElemental = function (d) {
    var ks = (this.info.elemental && this.info.elemental.kinds) || []; if (!ks.length) return;
    var i = Math.max(0, ks.indexOf(this.st.cast.elemental.kind));
    this.st.cast.elemental.kind = ks[((i + d) % ks.length + ks.length) % ks.length];
    this.changed();
  };
  Camp.prototype.cycleLight = function (d) {
    var ids = this.data.party.map(function (h) { return h.id; }), cur = this.info.light.target ? this.info.light.target.id : null, i = ids.indexOf(cur);
    this.st.cast.light.who = ids[((i + d) % ids.length + ids.length) % ids.length];
    this.changed();
  };

  // THE NIGHT'S BONDS' rows: every bond-wanting thing a hero with a list of bonds wears (a fixture's, the climb's; our four keep no list), and what the night did --
  // BONDED, WAITING (three held already), LET GO (the player's, st.noBond)
  Camp.prototype.bondRows = function () {
    var out = [], nb = this.st.noBond || {};
    (this.data.party || []).forEach(function (h) {
      if (!h.attuned) return;
      var seen = [];
      Object.keys(h.equip || {}).forEach(function (s) { var id = h.equip[s], it = item(id); if (s === 'torch' || !it || !it.attune || seen.indexOf(id) >= 0) return; seen.push(id);
        out.push({ h: h, id: id, state: h.attuned.indexOf(id) >= 0 ? 'BONDED' : (nb[h.id] || []).indexOf(id) >= 0 ? 'LET GO' : 'WAITING' }); });
    });
    return out;
  };
  Camp.prototype.bondSum = function () { var n = { BONDED: 0, WAITING: 0, 'LET GO': 0 }; this.bondRows().forEach(function (b) { n[b.state]++; }); return [n.BONDED + ' bonded', n.WAITING ? n.WAITING + ' waiting' : '', n['LET GO'] ? n['LET GO'] + ' let go' : ''].filter(Boolean).join(', '); };
  Camp.prototype.toggleBond = function (b) {
    var nb = this.st.noBond = this.st.noBond || {}, l = nb[b.h.id] = (nb[b.h.id] || []).slice(), i = l.indexOf(b.id);
    if (b.state === 'WAITING') { D.sfx('error'); this.say(b.h.name + ' holds three bonds already. Let one go first.'); return; }
    if (b.state === 'BONDED' && i < 0) l.push(b.id);
    if (b.state === 'LET GO' && i >= 0) l.splice(i, 1);
    if (!l.length) delete nb[b.h.id];
    this.changed();
  };
  Camp.prototype.changed = function () { this.save(); this.rebuild(); D.sfx('confirm'); };
  Camp.prototype.setEquip = function (h, slot, id) {
    var e = this.st.equip[h.id] = this.st.equip[h.id] || {};
    e[slot] = id;
    if (slot === 'weapon' && twoHanded(id) && h.equip.shield) e.shield = null; // both hands: the shield goes back in the armoury
    this.changed();
    this.back();
  };
  Camp.prototype.togglePrep = function (h, id) {
    var cur = h.prepared.slice(), i = cur.indexOf(id);
    if (i >= 0) cur.splice(i, 1);
    else if (cur.length >= this.prepCount(h)) { D.sfx('error'); this.say(h.name + ' can prepare ' + this.prepCount(h) + ': take one off first.'); return; }
    else cur.push(id);
    this.st.prep[h.id] = cur;
    this.changed();
  };
  Camp.prototype.cycleMage = function (d) {
    var R = DS.R, hs = this.data.party, ok = hs.filter(function (h) { return !R.armored(h); });
    if (!ok.length) { D.sfx('error'); return; }
    var i = ok.map(function (h) { return h.id; }).indexOf(this.st.cast.mageArmor.who);
    this.st.cast.mageArmor.who = ok[((i < 0 ? 0 : i + d) % ok.length + ok.length) % ok.length].id;
    this.changed();
  };
  Camp.prototype.cycleTorch = function (d) { // nobody, then Aurdin first (his word), then the rest in the party's order -- each with a torch, then a lantern when the pack has one
    var kinds = (this.info.torch && this.info.torch.kinds && this.info.torch.kinds.length) ? this.info.torch.kinds : ['torch'];
    var heroes = [].concat(this.o.ours ? [] : ['aurdin'], this.data.party.map(function (h) { return h.id; }).filter(function (id) { return id !== 'aurdin'; }));
    var opts = [{ id: null, kind: 'torch' }];
    heroes.forEach(function (id) { kinds.forEach(function (k) { opts.push({ id: id, kind: k }); }); });
    var cur = this.st.torch || null, ck = kinds.indexOf(this.st.torchKind) >= 0 ? this.st.torchKind : 'torch', i = 0;
    opts.forEach(function (o, j) { if (o.id === cur && (cur == null || o.kind === ck)) i = j; });
    var o = opts[((i + d) % opts.length + opts.length) % opts.length];
    this.st.torch = o.id; this.st.torchKind = o.kind;
    this.changed();
  };
  // the party's wizard, if it has one (the ladder's Aurdin, our Willem): the familiar's master
  Camp.prototype.famWiz = function () { return this.data.party.filter(function (h) { return h.cls === 'wizard' && !h.ko && h.hp > 0; })[0] || null; };
  Camp.prototype.cycleFamiliar = function (d) {
    var ks = [null].concat(Object.keys(DS.R.FAMILIARS)), i = Math.max(0, ks.indexOf(this.st.familiar || null));
    this.st.familiar = ks[((i + d) % ks.length + ks.length) % ks.length];
    this.changed();
  };
  // the familiar the fight seats (deep16/js/familiar.js FM.unit reads flags.familiar)
  Camp.prototype.famFlag = function () { var w = this.famWiz(), k = this.st.familiar; return w && k && DS.R.FAMILIARS[k] ? { kind: k, by: w.id, hp: DS.R.FAMILIARS[k].hp } : null; };
  Camp.prototype.cycleAid = function (d) {
    var ids = this.data.party.map(function (h) { return h.id; }), i = ids.indexOf(this.st.cast.aid.out);
    this.st.cast.aid.out = ids[((i + d) % ids.length + ids.length) % ids.length];
    this.changed();
  };
  Camp.prototype.back = function () {
    var s = this.stack.pop();
    if (!s) return;
    this.mode = s.mode; this.sel = s.sel; this.top = s.top; this.pick = s.pick;
  };
  Camp.prototype.say = function (s) { this.msg = { text: s, t: this.t }; };

  Camp.prototype.fight = function () {
    var self = this;
    this.save();
    D.sfx('confirm');
    // our four (o.ours): the fight builds them from the morning's specs (battle.js o.npc.party); a watch, or your play, recorded (record.js)
    if (this.o.ours) {
      var O = this.o.ours, tw = this.info.torch.on ? this.info.torch.who.id : null, tk = this.info.torch.kind;
      this.rebuild();
      var ob = new D.Battle({ ladder: true, watch: !O.play, record: O.play ? { fight: this.F.id, name: this.F.name, level: this.L } : null, fight: this.F.id,
        npc: { party: this.specs, foes: [] }, torch: tw, torchKind: tk, familiar: this.famFlag(), onDone: function (res, why) { if (ob.rec) D.rec.finish(ob, res); self.leave(res, why); } });
      this.launch(ob); return;
    }
    var data = this.build();
    var ff = this.famFlag(); data.flags = Object.assign({}, data.flags || {}); if (ff) data.flags.familiar = ff; else delete data.flags.familiar;
    // the climb: the gear chosen here goes with the party from now on
    if (this.o.climb) { this.o.climb.keep(data.party); this.st.equip = {}; this.save(); }
    // (who went down in it, for the climb's campfire: the DM's hands bring them back -- climb.js)
    var fb = new D.Battle({ ladder: true, climb: !!this.o.climb, fight: this.F.id, data: data, torch: data.torchBy, torchKind: data.torchKind, onDone: function (res, why) {
      var down = (fb.units || []).filter(function (u) { return u.side === 'party' && !u.guest && (u.ko || u.hp <= 0); }).map(function (u) { return u.id; });
      self.leave(res, Object.assign({ down: down }, why || {}));
    } });
    this.launch(fb);
  };
  // the floor (10-03, Griz: "1 - yes"): a fight that throws while it sets the field goes back as one that broke mid-way does (js/battle.js Battle.broke) -- the ladder
  // or the climb says THE FIGHT BROKE, and no result is written
  Camp.prototype.launch = function (B) {
    try { D.push(B); }
    catch (e) {
      if (window.console) console.error('DEEP16: the fight would not set', e);
      if (D.top() === B) D.pop();
      if (B.rec) B.rec.done = true; // (a half-set fight has nothing to keep: the record's write would read its units)
      B.o.onDone(null, { broke: String(e && e.message || e), how: 'setting the field' });
    }
  };
  // back to the ladder (the fight has popped itself already)
  Camp.prototype.leave = function (res, info) { if (D.top() === this) D.pop(); this.done(res, info || {}); };

  // ------------------------------------------------------------------ input
  var PX = 244, PY = 30, PW = D.W - 244 - 6, ROW = 11, VIS = 15;
  Camp.prototype.update = function () {
    if (D.spr.held(this)) return; // (the four's figures still coming: js/sprites.js S.gate)
    this.t++;
    var L = this.list(), n = L.rows.length, s0 = this.sel;
    if (this.sel >= n) this.sel = Math.max(0, n - 1);
    if (n) {
      if (I.repeat('up')) this.sel = (this.sel + n - 1) % n;
      if (I.repeat('down')) this.sel = (this.sel + 1) % n;
    }
    var hitRow = -1, m = I.mouse;
    if (m.inside && this.rowRects) this.rowRects.forEach(function (r) { if (m.x >= r.x && m.x < r.x + r.w && m.y >= r.y && m.y < r.y + r.h) hitRow = r.i; });
    if (m.moved && hitRow >= 0) this.sel = hitRow;
    if (this.sel !== s0) D.sfx('cursor');
    if (this.sel < this.top) this.top = this.sel;
    if (this.sel >= this.top + VIS) this.top = this.sel - VIS + 1;
    var row = L.rows[this.sel];
    if (row && row.cycle && (I.repeat('left') || I.repeat('right'))) { row.cycle(I.repeat('left') ? -1 : 1); return; }
    if (I.pressed('a') || (m.click && hitRow >= 0)) {
      if (!row) return;
      if (row.ok === false || !row.act) { D.sfx('error'); if (row.why) this.say(row.why); return; }
      row.act(); return;
    }
    if (I.pressed('b') || I.pressed('menu')) { D.sfx('cancel'); if (this.stack.length) this.back(); else this.leave(null); }
  };

  // ------------------------------------------------------------------ drawing
  function box(ctx, x, y, w, h) { D.win8(ctx, x, y, w, h); } // (the 8-bit game's window, as every DEEP16 menu: js/core.js D.win8, 10-01)
  // a line cut to fit w px, with '..' where it was cut (from the start when `left`); the {c}-style colour tags are not counted
  function fit(s, w, left) {
    if (D.textWidth(s) <= w) return s;
    var plain = s.replace(/\{[a-z\/]+\}/g, ''), t = plain;
    while (t.length > 1 && D.textWidth(left ? '..' + t : t + '..') > w) t = left ? t.slice(1) : t.slice(0, -1);
    return left ? '..' + t : t + '..';
  }
  var FIRE_AT = [PX + 115, 206]; // the campfire's fire on screen: in the window the list leaves open (js/campfire.js)
  Camp.prototype.draw = function (ctx) {
    if (D.spr.held(this, true)) return D.spr.beat(ctx, this);
    var R = DS.R, self = this, hs = this.data.party, L = this.list(), row = L.rows[this.sel], focus = row && row.hero;
    // the backdrop: the four round the fire in a night clearing (Griz, 09-28), the panels over it let it through
    // (our four take the fire's four seats in order -- the seats are keyed by the 8-bit four's ids: Griz, 09-29, "bring the test campfire up to snuff")
    var SEATKEY = ['barley', 'aurdin', 'lymen', 'vivian'], seatKey = function (id) { if (!self.o.ours) return id; for (var k = 0; k < hs.length; k++) if (hs[k].id === id) return SEATKEY[k] || id; return id; };
    D.campfire.draw(ctx, { cx: FIRE_AT[0], cy: FIRE_AT[1], t: this.t, dim: 0.8, heroes: hs.map(function (h) { return { id: seatKey(h.id), sheet: self.look(h.id).sheet || h.id + '_p0' }; }) });
    var seat = focus && D.campfire.seatAt(seatKey(focus), FIRE_AT[0], FIRE_AT[1]);
    if (seat) { var bob = Math.round(Math.sin(this.t / 8) * 2); D.text(ctx, '▼', seat.x, seat.y - 50 + bob, P('gold', 4), 'center'); }
    ctx.save(); ctx.translate(6, 5); ctx.scale(2, 2); D.text(ctx, 'THE CAMP', 0, 0, P('gold', 4)); ctx.restore();
    D.text(ctx, (this.o.climb ? '{p}the climb{/}  ·  ' : this.o.ours ? '{p}ours{/}  ·  ' : '') + 'level ' + this.L + '  ·  before {y}' + this.F.name + '{/}  ·  ' + (this.F.sub || ''), 98, 9, P('silver', 5));
    // the four
    hs.forEach(function (h, i) {
      var x = 6, y = PY + i * 56, w = 232, hh = 53, look = self.look(h.id), on = focus === h.id;
      box(ctx, x, y, w, hh, on ? P('gold', 4) : P('stone', 3), 0.8);
      ctx.save(); ctx.beginPath(); ctx.rect(x + 3, y + 3, 32, hh - 6); ctx.clip();
      var sheet = look.sheet || h.id + '_p0';
      D.spr.draw(ctx, sheet, 'idle', 0, self.t, x + 19, y + Math.min(D.spr.top(sheet), 46) + 3, {});
      ctx.restore();
      var w0 = R.weaponOf(h), dm = R.damageExpr(h, w0), gear = [item(h.equip.armor), item(h.equip.shield)].concat(R.PLACES.map(function (s) { return item(h.equip[s]); })).filter(Boolean).map(function (it) { return it.name; });
      D.text(ctx, '{y}' + (look.name || h.name) + '{/}  ' + D.clsLabel(h.cls) + ' ' + h.lvl + '   HP ' + h.maxhp + '   AC ' + R.ac(h), x + 40, y + 4, P('bone', 1));
      D.text(ctx, w0.name + ' ' + D.rules.sign(R.attackBonus(h, w0)) + ', ' + dm.dice + (dm.mod ? D.rules.sign(dm.mod) : ''), x + 40, y + 14, P('silver', 5));
      D.text(ctx, fit(gear.join(', ') || 'no armour', w - 46), x + 40, y + 23, P('silver', 5)); // (cut where the box ends: seven places can be worn now)
      // the slots left after the morning (by level), what's on them, and the day's spells
      var bits = [];
      if (h.slots && h.slots.length) bits.push('slots ' + h.slots.map(function (s, j) { return s + '/' + h.slotsMax[j]; }).join(' '));
      if (h.conds.mageArmor) bits.push('{c}mage armor{/}');
      if (h.conds.aid) bits.push('{n}aid +' + h.conds.aid + '{/}');
      D.text(ctx, bits.join('  '), x + 40, y + 34, P('accent', 2));
      // the day's spells on one line: cut with '..' where the box ends (D.wrap's first line ran past it on a phone; the whole list is on the PREPARE rows)
      if (h.prepared) D.text(ctx, fit(h.prepared.length + '/' + self.prepCount(h) + ': ' + h.prepared.map(function (id) { return SV.spell(id).name; }).join(', '), w - 46), x + 40, y + 43, P('stone', 5));
    });
    // the list, as tall as its rows (the fire shows below it), and the chosen row's words in their own box at the foot
    var shown = Math.min(VIS, L.rows.length);
    box(ctx, PX, PY, PW, 18 + shown * ROW + 5, P('gold', 3), 0.84);
    D.text(ctx, L.title, PX + 6, PY + 5, P('gold', 4));
    this.rowRects = [];
    L.rows.slice(this.top, this.top + VIS).forEach(function (r, j) {
      var i = self.top + j, ry = PY + 18 + j * ROW, rr = { x: PX + 3, y: ry - 1, w: PW - 6, h: ROW, i: i };
      self.rowRects.push(rr);
      if (i === self.sel) { ctx.fillStyle = P('gold', 1); ctx.fillRect(rr.x, rr.y, rr.w, rr.h); }
      var dim = r.ok === false;
      D.text(ctx, r.label, PX + 7, ry + 1, dim ? P('stone', 5) : i === self.sel ? P('gold', 4) : P('bone', 1));
      if (r.right) D.text(ctx, fit(r.right, PW - 20 - D.textWidth(r.label), true), PX + PW - 7, ry + 1, dim ? P('stone', 4) : P('stone', 6), 'right'); // (the right-hand words give way to the label, cut from the left)
    });
    if (L.rows.length > VIS) D.text(ctx, (this.top + 1) + '-' + Math.min(L.rows.length, this.top + VIS) + ' of ' + L.rows.length, PX + PW - 7, PY + 5, P('stone', 5), 'right');
    // the chosen row's words
    var desc = D.keys(row ? (row.ok === false && row.why ? '{o}' + row.why + '{/}' + (row.desc ? '  ' + row.desc : '') : row.desc || '') : ''); // (D.keys: a phone reads A and B, not E and X)
    // as many lines as the room under the list gives (the torch's words ran past four and were cut on a phone: Griz, 09-29)
    var listBot = PY + 18 + shown * ROW + 5, maxL = Math.max(4, Math.min(9, Math.floor((D.H - 18 - 6 - listBot - 3) / 8)));
    var dl = D.wrap(desc, PW - 12).slice(0, maxL), said = this.msg && this.t - this.msg.t < 150;
    if (said) dl = ['{o}' + this.msg.text + '{/}'].concat(dl.slice(0, maxL - 1));
    if (dl.length) { var dy = D.H - 18 - dl.length * 8 - 6; box(ctx, PX, dy, PW, dl.length * 8 + 6, P('stone', 3), 0.86); dl.forEach(function (l, j) { D.text(ctx, l, PX + 6, dy + 4 + j * 8, P('bone', 2)); }); }
    D.hint(ctx, 'up/down choose  ·  E pick  ·  X back' + (row && row.cycle ? '  ·  left/right: on whom' : ''), D.W / 2, D.H - 10, P('stone', 5), 'center');
  };
})();
