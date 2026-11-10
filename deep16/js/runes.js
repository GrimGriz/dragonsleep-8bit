/* DEEP16 — THE DM'S RUNES (11-10, runes seat A). His ask, 11-07: a DM walks or flies his map, "casts a spell" that lays a bound unit at its start for when the players run his
   module, and clicks the laid rune to remove it or set a posture (the plan, every file:line and his nine answers RULED: cloud-notes/pocket-dm-runes-look-2026-11-07.md). 11-10, Griz:
   "seats on the DM placing his bound units on specific locations in the map is the big one for our usage window"; and his refinements, RULED: "This is to work like current spell
   selection, where the first choice is the CR range of the DMs bound unit instead of the level of spell"; "bound units contain multiple units to be placed, should probably open the
   'formation' style placement for the bound unit after the rune is placed"; "2 - yes, and stomping starts at placing a rune at his altitude, where it drops to the floor of that square
   if the unit doesn't contain all flyers, else that's the altitude that binding group starts at".

   THE LAY FLOOR (RN.floor): W on one of BUILD's fights (js/pocketdm.js drawBuild) opens that fight's floor -- any D.MAPS id -- as a Battle with no turns, after the roam's pattern
   (js/roam.js R.make): the grid's own renderer, its camera, no strip and no bar. Lit: the DM's eye sees the whole floor. The DM is the elder mage (eldermage_p1, js/classes.js
   NPC.NAMED.eldermage): he flies with the cursor on his `fly` row and hangs on his `hover` row when it stops; Shift+wheel or [ and ] take him up and down a layer (5 ft), under
   the floor's ceiling (js/grid.js G.ceilAt). LAY THE RUNE (E) opens the pick as the M menu's MAGIC opens a caster's book (js/menu.js MagicPage): a tab a CR band of his bound units
   (as MAGIC's a tab a spell level), then the unit, then the aim -- the unit's members as ghosts where they would stand, the square green where it may go and red, with why, where
   not. A click: he stomps (the `stomp` row) and on its ground pulse (the sheet's `pulse` frame, 3) the rune is laid on that square at his height -- on the square's floor unless every
   member of the unit flies; then that height is where they start (rune.z, ft over the floor; js/battle.js seatRunes sets u.fz). Then THE FORMATION, as ORDER on the roam lays the four
   round their leader (js/roam.js R.order): the members out round the rune, the first on it, a click on one then a lit square in the box two round it to move it, a right click turns
   them; E when done, and the rune's card. The refusals (the plan's step 2): rock; a square cut off from the party's way in (a walk from it, as js/battle.js seatBand's reach); dry
   ground for those bound to water (js/pocketdm.js fits); a Large body with no room.
   THE RUNE'S CARD (a click on a laid rune): STAND, AMBUSH, PATROL (then its second square: there and back), DEFEND (then its ward -- the desk's lean on his 4, "that square set like
   patrol (so it can be an item or location)?": picked as PATROL's second square, and a thing on that square or beside it -- a door, a crate, a well, the chest -- is the ward by name,
   else the place), the radius (15 ft, his "aye"), FORMATION again, REMOVE.
   BUY ANOTHER (the desk's lean on his 3, "where would be a good place to let them 'buy another set' of that particular bound unit?"): on the pick, a unit whose every copy is laid
   on this fight shows BUY ANOTHER at the market's price for its members (js/pocketdm.js PD.price), and binds a copy there and then -- the DM never leaves the map.
   THE RUNE'S LOOK (his 1 of 11-07, "icons we had to invent for 'protection from' spells" -- found: the creature-type chips, js/ui.js GLYPH and UI.drawGlyph): the chip laid on the
   floor at the unit's type (a mixed unit's highest-CR member's), its edge and a ring round it in the posture's colour, so the glyph keeps its own colours and its type reads.
   THE PARTY'S WAY IN (his 6 of 11-07): a rune of its own the DM may move (slot.entry; js/data/fights.js classFight's `entry`), red with a warning while a foe rune is within 30 ft.
   A LAID FIGHT IS ITS RUNES (his 7): the first rune laid makes the fight's foes exactly the units on its runes -- no roll, no seating north -- its CR their sum (RN.sync); a unit once a
   fight, the same unit in several fights (the fill's own rule). R on a laid fight asks first (js/pocketdm.js drawBuild). The last rune taken off rolls the fight again at its CR.
   THE SAVE (the plan's step 6): slot.runes (and slot.entry) in the campaign, in this browser; in the module file v2 by kind, not by unit id (ids do not survive a file); a v1 file loads
   as today, and a rune that does not check out is dropped with a line (RN.clean).
   THE SEAM with runes seat B ("Runes B: the postures"): each foe a rune seats carries u.post = { kind, at, to, r } (js/battle.js seatRunes); js/ai.js and js/tactics.js read it. */
'use strict';
(function () {
  var D = window.D16, I = D.input, G = D.grid, FX = D.fx, PK = D.pocket, Pocket = D.Pocket, PD = D.pocketdm;
  if (!PK || !Pocket || !PD) return;
  var P = function (r, i) { return D.PAL.ramps[r][i]; };
  var RN = D.runes = {};

  RN.POSTS = ['stand', 'ambush', 'patrol', 'defend'];
  RN.WORD = { stand: 'STAND', ambush: 'AMBUSH', patrol: 'PATROL', defend: 'DEFEND' };
  RN.SAY = { stand: 'stands its ground, readied', ambush: 'lies in wait, hidden', patrol: 'walks the rune to its second square and back', defend: 'holds its ward' };
  // the postures' colours (the seat's call, his to overrule): STAND gold, AMBUSH violet, PATROL green, DEFEND blue; the party's way in pale, red while a foe rune is within 30 ft
  RN.COL = { stand: '#f0d070', ambush: '#b47cf4', patrol: '#7cdc8c', defend: '#64b4fc', entry: '#dceaff', warn: '#f45a4c', ok: '#96eb96', bad: '#f05a50', ghost: '#9cdcff' };
  RN.R = 15;          // a rune's radius, ft (his "aye" on the 15 ft, 11-10)
  RN.RADII = [5, 10, 15, 20, 30, 40, 60];
  RN.WARN_FT = 30;    // a foe rune this near the party's way in: the warning (his 6, 11-07)
  RN.BOX = 2;         // the formation's box: two squares round the rune (the roam's ORDER's)
  RN.FORM = [[0, 0]].concat((D.roam && D.roam.FORM0) || [[0, 1], [-1, 0], [-1, 1], [-2, 0], [-2, 1], [-3, 0], [-3, 1], [-4, 0]]); // ([ahead, right] off the rune: the first on it, then two abreast behind, as the roam's)
  RN.MAGE = 'eldermage:12';
  RN.MAX_TABS = 8;

  // ------------------------------------------------------------------ the data: a fight's runes
  RN.kindsOf = function (u) { return (u && u.members || []).map(function (m) { return m.kind; }); };
  RN.sig = function (kinds) { return kinds.slice().sort().join(','); };
  RN.list = function (slot) { if (!slot) return []; if (!Array.isArray(slot.runes)) slot.runes = []; return slot.runes; };
  RN.laid = function (slot) { return !!(slot && Array.isArray(slot.runes) && slot.runes.length); };
  // A LAID FIGHT IS ITS RUNES (his 7, 11-07): the foes exactly the runes' units, in the order laid; the DM's units among them; the CR their sum
  RN.sync = function (slot) {
    var rs = RN.list(slot); if (!rs.length) return slot;
    var foes = [], units = [], mine = 0;
    rs.forEach(function (r) { foes = foes.concat(r.foes); if (r.unit != null) { units.push(r.unit); mine += r.foes.length; } });
    slot.foes = foes; slot.units = units; slot.mine = mine; slot.cr8 = PK.sum8(foes);
    return slot;
  };
  // the type a rune shows: its highest-CR member's (the lean, 11-07: "A unit of mixed types shows its highest-CR member's type")
  RN.typeOf = function (kinds) {
    var best = null, b8 = -1;
    (kinds || []).forEach(function (k) { var f = PK.foe(k), c = f ? PK.cr8(f.cr) : -1; if (f && c > b8) { b8 = c; best = f; } });
    return best ? (best.type || 'humanoid') : 'humanoid';
  };
  RN.name = function (kinds) { return PK.foesText(kinds || []); };

  // ------------------------------------------------------------------ the pick: the DM's bound units by CR band, as MAGIC's tabs by spell level
  // each make of unit (the same members) is one row, its copies counted: free on this fight, or laid here already (a unit once a fight -- the fill's rule)
  RN.groups = function (st, slot) {
    var cp = PD.camp(st), laid = {}, by = {}, out = [];
    RN.list(slot).forEach(function (r) { if (r.unit != null) laid[r.unit] = 1; });
    PD.newest(cp).forEach(function (u) {
      var ks = RN.kindsOf(u); if (!ks.length) return;
      var s = RN.sig(ks), g = by[s];
      if (!g) { g = by[s] = { sig: s, kinds: ks, cr8: PD.unitCR8(u), name: PD.unitName(u), type: RN.typeOf(ks), units: [], free: [] }; out.push(g); }
      g.units.push(u); if (!laid[u.id]) g.free.push(u);
    });
    return out;
  };
  RN.band = function (cr8) { return cr8 < 8 ? 0 : Math.floor(cr8 / 8); }; // (under CR 1 together, then a whole CR a band: as spell levels go a level a tab)
  RN.bandWord = function (lo, hi) { var w = function (b) { return b ? String(b) : '<1'; }; return 'CR ' + w(lo) + (hi !== lo ? '-' + w(hi) : ''); };
  RN.tabs = function (groups) {
    var seen = {}; groups.forEach(function (g) { seen[RN.band(g.cr8)] = 1; });
    var keys = Object.keys(seen).map(Number).sort(function (a, b) { return a - b; }), per = Math.max(1, Math.ceil(keys.length / RN.MAX_TABS)), tabs = []; // (more bands than eight: runs of them share a tab)
    for (var i = 0; i < keys.length; i += per) {
      var ks = keys.slice(i, i + per);
      tabs.push({ lo: ks[0], hi: ks[ks.length - 1], label: RN.bandWord(ks[0], ks[ks.length - 1]), groups: groups.filter(function (g) { return ks.indexOf(RN.band(g.cr8)) >= 0; }) });
    }
    return tabs;
  };
  RN.price = function (kinds) { return kinds.reduce(function (n, k) { return n + PD.price(k); }, 0); };
  // BUY ANOTHER (the desk's lean on his 3): the members bought at the market's price and bound as one unit, there and then
  RN.buyAnother = function (st, kinds) {
    var cp = PD.camp(st), cost = RN.price(kinds);
    if (!kinds.length || cost <= 0) return { ok: false, why: 'not for sale' };
    if (cp.purse < cost) return { ok: false, why: 'the purse holds ' + PD.fmt(cp.purse) + ': another ' + RN.name(kinds) + ' is ' + PD.fmt(cost) };
    var ids = [];
    for (var i = 0; i < kinds.length; i++) {
      var r = PD.buy(st, kinds[i]);
      if (!r.ok) { ids.forEach(function (id) { PD.dismiss(st, id); }); return r; }
      ids.push(r.receipt.id);
    }
    return { ok: true, unit: PD.bind(st, ids), cost: cost };
  };

  // ------------------------------------------------------------------ the file: runes by kind (an id does not survive a file), checked on the way in
  RN.fileRunes = function (slot) {
    return RN.list(slot).map(function (r) {
      var o = { foes: r.foes.slice(), at: r.at.slice(), post: r.post, r: r.r || RN.R };
      if (r.to) o.to = r.to.slice(); if (r.ward) o.ward = r.ward; if (r.z) o.z = r.z; if (r.fw) o.fw = r.fw.slice();
      if (r.sq && r.sq.length) o.sq = r.sq.map(function (p) { return p ? p.slice() : null; });
      return o;
    });
  };
  function mapWH(def) { return { w: def.rows[0].length, h: def.rows.length }; }
  function rockAt(def, x, y) { var row = def.rows[y]; var c = row && row.charAt(x); return !c || c === '#' || c === ' '; }
  function sqIn(def, p) { if (!Array.isArray(p) || p.length !== 2) return false; var wh = mapWH(def), x = p[0], y = p[1]; return x === (x | 0) && y === (y | 0) && x >= 0 && y >= 0 && x < wh.w && y < wh.h; }
  // a fight's runes as a file or an older page left them: each must name kinds the bestiary builds and the fight's foes hold, stand on the map and not on rock, else it is
  // dropped with a line (the plan's format: "A rune that does not check out ... is dropped with a line"); `quiet` for the read that only asks
  RN.clean = function (runes, mapId, foes, quiet) {
    var def = D.MAPS[mapId]; if (!Array.isArray(runes) || !runes.length || !def) return null;
    var pool = Array.isArray(foes) ? foes.slice() : null, out = [];
    runes.forEach(function (r, i) {
      var bad = !r || !Array.isArray(r.foes) || !r.foes.length ? 'no creatures' : !r.foes.every(function (k) { return typeof k === 'string' && !!PK.foe(k); }) ? 'a creature the bestiary has not got' : !sqIn(def, r.at) ? 'off the map' : rockAt(def, r.at[0], r.at[1]) ? 'on rock' : null;
      if (!bad && pool) { var take = pool.slice(); if (r.foes.every(function (k) { var j = take.indexOf(k); if (j < 0) return false; take.splice(j, 1); return true; })) pool = take; else bad = 'creatures the fight has not got'; }
      if (bad) { if (!quiet && window.console) console.warn('DEEP16 runes: rune ' + (i + 1) + ' on ' + mapId + ' dropped -- ' + bad); return; }
      var post = RN.POSTS.indexOf(r.post) >= 0 ? r.post : 'stand', to = sqIn(def, r.to) ? [r.to[0], r.to[1]] : null;
      if ((post === 'patrol' || post === 'defend') && !to) post = 'stand';
      out.push({ unit: r.unit != null ? r.unit : null, foes: r.foes.slice(), at: [r.at[0], r.at[1]], post: post, to: post === 'patrol' || post === 'defend' ? to : null, ward: post === 'defend' && r.ward ? String(r.ward).slice(0, 40) : null,
        r: Math.max(5, Math.min(60, +r.r || RN.R)), z: +r.z > 0 ? Math.min(300, Math.round(+r.z)) : null, fw: Array.isArray(r.fw) && r.fw.length === 2 ? [Math.sign(r.fw[0]) | 0, Math.sign(r.fw[1]) | 0] : null,
        sq: Array.isArray(r.sq) ? r.sq.slice(0, r.foes.length).map(function (p) { return sqIn(def, p) ? [p[0], p[1]] : null; }) : [] });
    });
    return out.length ? out : null;
  };
  RN.cleanEntry = function (e, mapId) { var def = D.MAPS[mapId]; return def && sqIn(def, e) && !rockAt(def, e[0], e[1]) ? [e[0], e[1]] : null; };
  // what the launch hands the fight (js/pocket.js launch): the runes that check out against the fight's own foes, and the party's way in
  RN.atPlay = function (slot, kinds, mapId) {
    if (!slot || slot.map !== mapId) return null;
    var rs = RN.clean(slot.runes, mapId, kinds, true), en = RN.cleanEntry(slot.entry, mapId);
    return rs || en ? { runes: rs, entry: en } : null;
  };

  // ------------------------------------------------------------------ the floor's reading: where a unit may stand
  // the squares a walk reaches from the party's way in (js/battle.js seatBand's reach, four ways), deep water too for those that fly or swim over it
  RN.reach = function (m, from) {
    var out = {}, q = [], open = function (x, y) { var s = m.at(x, y); return !!(s && (s.walk || s.deep)); };
    if (!from || !open(from[0], from[1])) return out;
    out[from[0] + ',' + from[1]] = 1; q.push(from);
    while (q.length) { var p = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var x = p[0] + d[0], y = p[1] + d[1], k = x + ',' + y; if (!out[k] && open(x, y)) { out[k] = 1; q.push([x, y]); } }); }
    return out;
  };
  // may u stand at (x, y): its whole footprint on ground it can hold (the water for one bound to it; deep water only aloft or swimming), none of it taken, reached from the way in
  RN.why = function (m, u, x, y, taken, reach, aloft) {
    var s = u.size || 1;
    for (var j = 0; j < s; j++) for (var i = 0; i < s; i++) {
      var q = m.at(x + i, y + j); if (!q) return 'off the floor';
      if (!q.walk && !(q.deep && (aloft || u.flies || u.swims))) return q.deep ? 'deep water' : 'rock';
      if (u.bound && u.bound.indexOf(q.ch) < 0) return 'dry: ' + (u.name || 'it') + ' keeps to the water';
      if (taken && taken[(x + i) + ',' + (y + j)]) return 'taken';
      if (reach && !reach[(x + i) + ',' + (y + j)]) return 'cut off from the party\'s way in';
    }
    if (s > 1) { var lo = 1e9, hi = -1e9; for (var jj = 0; jj < s; jj++) for (var ii = 0; ii < s; ii++) { var z = m.gz(x + ii, y + jj); lo = Math.min(lo, z); hi = Math.max(hi, z); } if (hi - lo > (m.def.step || 10)) return 'no room for ' + (u.name || 'it') + ' (' + (s === 2 ? 'Large' : s === 3 ? 'Huge' : 'Gargantuan') + ')'; }
    return null;
  };
  function axes(fw) { return { f: fw, r: [-fw[1], fw[0]] }; }
  function snap(dx, dy) { if (!dx && !dy) return [0, 1]; return Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]; }
  RN.faceTo = function (from, to) { return snap(to[0] - from[0], to[1] - from[1]); };
  // THE FORMATION round a rune (his "'formation' style placement"): each member on its slot of RN.FORM turned to fw -- the first on the rune -- or, taken or refused, the nearest square
  // in the box two round the rune it may hold; `want` keeps squares already set. { sq: [[x, y] | null], why }
  RN.formation = function (m, units, at, fw, taken, reach, aloft, want) {
    var A = axes(fw), used = Object.assign({}, taken || {}), out = [], why = null;
    var mark = function (u, x, y) { var s = u.size || 1; for (var j = 0; j < s; j++) for (var i = 0; i < s; i++) used[(x + i) + ',' + (y + j)] = 1; };
    units.forEach(function (u, k) {
      var w = want && want[k], o = RN.FORM[k] || [-(k + 1), 0], sl = w || [at[0] + o[0] * A.f[0] + o[1] * A.r[0], at[1] + o[0] * A.f[1] + o[1] * A.r[1]], best = null;
      if (!RN.why(m, u, sl[0], sl[1], used, reach, aloft) && Math.max(Math.abs(sl[0] - at[0]), Math.abs(sl[1] - at[1])) <= RN.BOX) best = sl;
      else {
        var bd = Infinity, b = RN.BOX + (u.size || 1) - 1;
        for (var y = at[1] - b; y <= at[1] + b; y++) for (var x = at[0] - b; x <= at[0] + b; x++) {
          if (RN.why(m, u, x, y, used, reach, aloft)) continue;
          var d = Math.max(Math.abs(x - sl[0]), Math.abs(y - sl[1])) + 0.01 * Math.hypot(x - sl[0], y - sl[1]); if (d < bd) { bd = d; best = [x, y]; }
        }
      }
      if (!best && !why) { var w0 = RN.why(m, u, sl[0], sl[1], null, reach, aloft); why = w0 && k === 0 ? w0 : 'no room round it for ' + (u.name || 'one of them') + ((u.size || 1) > 1 ? ' (' + ((u.size || 1) === 2 ? 'Large' : 'Huge') + ')' : ''); }
      out.push(best); if (best) mark(u, best[0], best[1]);
    });
    return { sq: out, why: why };
  };

  // ------------------------------------------------------------------ THE LAY FLOOR
  RN.floor = function (pk, mod, si, o) {
    o = o || {};
    var slot = mod.slots[si], def = D.MAPS[slot.map];
    var F = { id: 'runes', level: 5, map: slot.map, dark: false, name: 'WALK IT: ' + String(def.name || slot.map).toUpperCase(), sub: mod.name + ', fight ' + (si + 1), foes: [], wave: null, noFlee: true,
      entry: slot.entry ? [slot.entry.slice()] : undefined, intro: '' };
    var B = new D.Battle({ npc: { party: [RN.MAGE], foes: [] }, fightDef: F, pocket: true, lay: true, onDone: function () { } });
    var enter0 = B.enter;
    B.cine = true;
    B.enter = function () { enter0.apply(this, arguments); RN.setup(this, pk, mod, si, o); };
    B.update = function () {
      if (this.baking) { if (++this.bakeT >= 2) { this.baking = false; this.enter(); } return; }
      try { RN.frame(this); } catch (e) { RN.broke(this, e); }
    };
    B.floorMarks = function (c) { RN.floorMarks(c, this); };
    B.marksOver = function (c) { RN.marksOver(c, this); };
    B.screenOver = function (c) { RN.screenOver(c, this); };
    return B;
  };
  RN.broke = function (B, e) {
    if (window.console) console.error('DEEP16 runes: the lay floor broke', e);
    var L = B.lay; if (D.top() === B) D.pop();
    if (L && L.pk) { L.pk.msg = { text: 'THE LAY FLOOR BROKE: ' + String(e && e.message || e).slice(0, 80) + ' -- the runes laid are kept', t: 600, sticky: true, bad: true }; L.pk.keep(); }
  };
  // a fight's member as the grid fields it: a villain's word by its class, else the bestiary's (js/battle.js enter's npc foes)
  RN.member = function (B, kind, id) {
    var u = null;
    try { u = (D.npc && D.npc.build ? D.npc.build(kind, B.fight.level, 'foe', { id: id }) : null) || (D.FOES[kind] ? B.makeFoe({ id: id, kind: kind }) : null); } catch (e) { u = null; }
    if (!u) return null;
    u.side = 'foe'; u.anim = 'idle'; u.animT = 0; u.flash = 0; u.conds = u.conds || {}; u.rword = kind; u.laid = true;
    if (!u.flies && u.kind && D.FOES[u.kind] && D.FOES[u.kind].fly) u.flies = true; // (a sheet's fly speed is wings in every fight: js/flight-ai.js FA.on)
    return u;
  };
  RN.setup = function (B, pk, mod, si, o) {
    var slot = mod.slots[si], m = B.map;
    B.order = []; B.active = null; B.req = null; B.co = null; B.exits = []; B.dark = false; B.intro = null;
    var mage = B.units.filter(function (u) { return u.side === 'party' && !u.familiar; })[0];
    B.units = B.units.filter(function (u) { return u === mage; }); // (a familiar the wizard's sheet brings stays home)
    var en = RN.cleanEntry(slot.entry, slot.map) || (B.entrySq && B.entrySq[0]) || m.def.entry[0];
    var L = B.lay = { pk: pk, mod: mod, si: si, slot: slot, o: o, mage: mage, mode: 'fly', entry: en.slice(), cur: { x: en[0], y: en[1] }, hover: null, floorHover: null, btns: [], card: null, pick: null, tab: 0, row: 0,
      msg: null, step: (m.def.step || 10), t0: B.t, moveT: -99 };
    mage.flies = true; mage.laid = true; mage.name = 'The Elder Mage'; mage.x = en[0]; mage.y = en[1]; mage.facing = 1; mage.anim = 'hover'; mage.animT = 0; mage.torch = null;
    L.z = m.gz(en[0], en[1]) + 2 * G.LAYER(); mage.fz = L.z;
    RN.list(slot).forEach(function (r, i) { RN.seatRune(B, r, i); });
    G.setup(m, B.units);
    D.spr.ensure([mage.sheet]);
    B.focus(mage);
    B.card(['{y}' + F_name(B) + '{/}: the floor as the party will find it.', '{g}E: LAY THE RUNE -- a unit of yours, by its CR. A click on a rune: its posture; on the pale one, the party\'s way in. Shift+wheel or [ ]: the mage up and down. X: back to BUILD.{/}'], 420, 'lay');
    RN.warnCheck(B, true);
    if (o.show) RN.stage(B);
  };
  function F_name(B) { return (B.fight && B.fight.name || 'WALK IT').replace(/^WALK IT: /, ''); }
  // a laid rune's members on the floor where it set them (or as near as the floor lets them now), at its height if they all fly
  RN.seatRune = function (B, r, i) {
    var m = B.map, us = r.foes.map(function (k, j) { return RN.member(B, k, 'r' + i + '-' + j + '-' + k); }).filter(Boolean);
    if (us.length !== r.foes.length) return;
    var taken = RN.takenBy(B, null), reach = RN.reach(m, B.lay.entry), aloft = !!r.z && us.every(function (u) { return u.flies; });
    var fw = r.fw || RN.faceTo(r.at, B.lay.entry), f = RN.formation(m, us, r.at, fw, taken, null, aloft, r.sq);
    us.forEach(function (u, j) {
      var p = f.sq[j]; if (!p) return;
      u.x = p[0]; u.y = p[1]; u.facing = D.spr.facingFor(fw[0], fw[1]); u.rune = r;
      if (aloft) u.fz = RN.groundOf(m, u, p[0], p[1]) + r.z / 2.5 * B.lay.step;
      B.units.push(u);
    });
    r.sq = f.sq.map(function (p) { return p ? p.slice() : null; });
    r.cut = !reach[r.at[0] + ',' + r.at[1]];
    D.spr.ensure(us.map(function (u) { return u.sheet; }).filter(Boolean));
  };
  RN.groundOf = function (m, u, x, y) { var z = 0, s = u.size || 1; for (var j = 0; j < s; j++) for (var i = 0; i < s; i++) z = Math.max(z, m.gz(x + i, y + j)); return z; };
  RN.takenBy = function (B, except) { var t = {}; B.units.forEach(function (u) { if (u.side !== 'foe' || (except && u.rune === except)) return; var s = u.size || 1; for (var j = 0; j < s; j++) for (var i = 0; i < s; i++) t[(u.x + i) + ',' + (u.y + j)] = 1; }); return t; };
  RN.unseat = function (B, r) { B.units = B.units.filter(function (u) { return u.rune !== r; }); G.setup(B.map, B.units); };
  // the party's way in and the foe runes near it: a warning (his 6)
  RN.near = function (B) {
    var e = B.lay.entry, n = RN.WARN_FT / 5;
    return RN.list(B.lay.slot).filter(function (r) { return Math.max(Math.abs(r.at[0] - e[0]), Math.abs(r.at[1] - e[1])) <= n || (r.sq || []).some(function (p) { return p && Math.max(Math.abs(p[0] - e[0]), Math.abs(p[1] - e[1])) <= n; }); });
  };
  RN.warnCheck = function (B, quiet) {
    var nr = RN.near(B), L = B.lay, cut = RN.list(L.slot).filter(function (r) { return r.cut; });
    L.warn = nr.length > 0;
    if (!quiet && nr.length) B.card(['{o}' + nr.map(function (r) { return RN.name(r.foes); }).join(' and ') + (nr.length === 1 ? ' is' : ' are') + ' within ' + RN.WARN_FT + ' ft of the party\'s way in.{/}', '{g}They meet at the door. Move the rune, or the way in, if that is not what you meant.{/}'], 360, 'laywarn');
    if (!quiet && cut.length) B.card(['{o}' + cut.map(function (r) { return RN.name(r.foes); }).join(' and ') + ': cut off from the party\'s way in -- seated at play as near as a walk reaches.{/}'], 360, 'laycut');
  };
  RN.save = function (B) { var L = B.lay; RN.sync(L.slot); L.mod.at = Date.now(); L.pk.keep(); };

  // ------------------------------------------------------------------ the frame: input by mode, the mage after the cursor, the camera
  RN.frame = function (B) { if (D.spr.held(B)) return; RN.tick(B); }; // (its figures still coming: nothing moves -- js/sprites.js S.gate; the bench drives RN.tick)
  RN.tick = function (B) {
    B.t++;
    FX.update();
    B.units.forEach(function (u) { if (u.flash > 0) u.flash--; if (u.tween) { u.tween.t++; if (u.tween.t >= u.tween.dur) delete u.tween; } });
    B.cards = B.cards.filter(function (c) { return B.t - c.t0 < c.life; });
    var L = B.lay, m = I.mouse;
    if (L.msg && --L.msg.t <= 0) L.msg = null;
    L.hover = m.inside ? D.iso.pickAt(m.x, m.y, L.z) : null;
    B.cursor = L.cur; // (the square's numbers top right, the grid's own: js/ui.js drawBattle -- he says "4,1" and means it)
    L.floorHover = m.inside ? D.iso.pick(m.x, m.y, null) : null;
    if (L.hover && (m.moved || m.click) && !RN.overPanel(B) && m.y >= 13 && m.y < D.H - 20) { L.cur.x = L.hover.x; L.cur.y = L.hover.y; } // (not while the pointer is on the head, the foot's bar or a window: a click on DONE is not a square)
    // the mage's height: Shift+wheel, [ and ], the pad's layer keys
    var dz = (m.wheel && m.wheelShift && m.inside ? (m.wheel < 0 ? 1 : -1) : 0) + (I.repeat('layerup') || I.repeat('bracketr') ? 1 : 0) - (I.repeat('layerdown') || I.repeat('bracketl') ? 1 : 0);
    if (m.wheel && m.wheelShift) m.wheel = 0;
    if (dz && L.mode !== 'stomp') RN.lift(B, dz);
    var btnHit = RN.readButtons(B);
    if (!btnHit) RN.input(B);
    RN.mageStep(B);
    RN.tickStomp(B);
    if (!RN.overPanel(B)) D.ui.camera(B); else { m.wheel = 0; } // (the wheel over the pick scrolls nothing on the floor)
  };
  RN.lift = function (B, d) {
    var L = B.lay, mg = L.mage, lo = 0, top = G.ceilAt(mg, mg.x, mg.y), ly = G.LAYER(), g = G.groundAt(mg, mg.x, mg.y);
    var z1 = Math.max(Math.max(lo, g), Math.min(top, L.z + d * ly));
    if (z1 === L.z) { D.sfx('error'); L.msg = { text: d > 0 ? 'the ceiling here' : 'the floor', t: 90 }; return; }
    L.z = z1; D.sfx('cursor');
  };
  RN.altFt = function (B, x, y) { var L = B.lay, g = RN.groundOf(B.map, L.mage, x, y); return Math.max(0, Math.round((L.z - g) / L.step * 2.5 / 5) * 5); };
  // the mage after the cursor, a square at a time, flying; hanging still when it stops
  RN.mageStep = function (B) {
    var L = B.lay, mg = L.mage, tgt = L.stompAt || [L.cur.x, L.cur.y];
    if (L.mode === 'stomp' && L.stompT != null) { mg.fz = L.z > G.groundAt(mg, mg.x, mg.y) ? L.z : null; return; }
    var dx = Math.sign(tgt[0] - mg.x), dy = Math.sign(tgt[1] - mg.y), g = G.groundAt(mg, mg.x, mg.y);
    if ((dx || dy) && !mg.tween && B.t - (L.moveT || 0) >= 3) {
      var fz0 = G.gzAt(mg, mg.x, mg.y), nx = mg.x + dx, ny = mg.y + dy, s = B.map.at(nx, ny);
      if (!s) { if (B.map.at(nx, mg.y)) ny = mg.y; else if (B.map.at(mg.x, ny)) nx = mg.x; else { nx = mg.x; ny = mg.y; } }
      if (nx !== mg.x || ny !== mg.y) {
        mg.tween = { fx: mg.x, fy: mg.y, fz: fz0, t: 0, dur: 4, mode: null }; mg.x = nx; mg.y = ny; mg.facing = D.spr.facingFor(dx, dy); L.moveT = B.t;
        if (mg.anim !== 'fly') { mg.anim = 'fly'; mg.animT = B.t; }
      }
    } else if (!dx && !dy && !mg.tween && mg.anim !== 'hover' && L.mode !== 'stomp') { mg.anim = 'hover'; mg.animT = B.t; }
    g = G.groundAt(mg, mg.x, mg.y); mg.fz = L.z > g ? L.z : null;
    if (L.mode === 'stomp' && L.stompT == null && mg.x === tgt[0] && mg.y === tgt[1] && !mg.tween) RN.stompStart(B);
  };

  // ------------------------------------------------------------------ the buttons drawn on the screen (read the next frame, as js/pocket.js's)
  function inR(r, m) { return m.inside && m.x >= r.x && m.x < r.x + r.w && m.y >= r.y && m.y < r.y + r.h; }
  RN.btn = function (B, ctx, label, x, y, w, h, fn, o) {
    o = o || {}; var b = { label: label, x: x, y: y, w: w, h: h, fn: fn, dis: !!o.dis, why: o.why || null, on: !!o.on, col: o.col || null };
    B.lay.btns.push(b);
    var hov = inR(b, I.mouse);
    ctx.fillStyle = b.on ? 'rgba(60,64,128,.95)' : hov && !b.dis ? 'rgba(44,48,100,.95)' : 'rgba(16,18,48,.92)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = b.col || (b.on ? P('gold', 3) : P('stone', 4)); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    D.text(ctx, label, x + w / 2, y + Math.round((h - 7) / 2), b.dis ? P('stone', 4) : b.on ? P('gold', 4) : P('bone', 1), 'center');
    return b;
  };
  RN.readButtons = function (B) {
    var L = B.lay, m = I.mouse; if (!m.click) return false;
    var hitB = null; (L.btnsDrawn || []).forEach(function (b) { if (inR(b, m)) hitB = b; });
    if (!hitB) return RN.overPanel(B);
    if (hitB.dis) { D.sfx('error'); if (hitB.why) L.msg = { text: hitB.why, t: 200 }; return true; }
    D.sfx('cursor'); hitB.fn(); return true;
  };
  RN.overPanel = function (B) { var m = I.mouse; return (B.lay.panels || []).some(function (r) { return inR(r, m); }); };

  // ------------------------------------------------------------------ the input, by mode
  RN.input = function (B) {
    var L = B.lay, m = I.mouse, a = I.pressed('a'), b = I.pressed('b');
    if (L.mode === 'pick') return RN.pickInput(B);
    if (L.mode === 'stomp') return;
    // the keys' cursor: the arrows step it a square, as the grid's own (js/iso.js nudge)
    ['up', 'down', 'left', 'right'].forEach(function (d) {
      if (!I.repeat(d) || !D.iso.nudge(L.cur, d, B.map.w, B.map.h)) return;
      var cc = D.iso.center(L.cur.x, L.cur.y, B.map.gz(L.cur.x, L.cur.y)), sp = D.iso.toScreen(cc.x, cc.y); // (the keys' cursor kept on the screen)
      if (sp.x < 48 || sp.x > D.W - 48 || sp.y < 36 || sp.y > D.H - 44) { D.iso.lookAt(L.cur.x, L.cur.y, B.map.gz(L.cur.x, L.cur.y)); D.ui.clampCam(); }
    });
    if (L.mode === 'fly') {
      if (a) return RN.openPick(B);
      if (b) return RN.leave(B);
      if (m.click && L.floorHover) { var hr = RN.runeAt(B, L.floorHover.x, L.floorHover.y); if (hr === 'entry') return RN.openEntry(B); if (hr) return RN.openCard(B, hr); }
      if (m.click && L.hover) { var hr2 = RN.runeAt(B, L.hover.x, L.hover.y); if (hr2 === 'entry') return RN.openEntry(B); if (hr2) return RN.openCard(B, hr2); }
      return;
    }
    if (L.mode === 'aim') {
      if (b || m.rclick) { D.sfx('cancel'); L.mode = 'pick'; return; }
      if (a || m.click) { var sq = m.click ? L.hover : B.map.at(L.cur.x, L.cur.y); if (!sq) return; var ok = RN.aimAt(B, sq.x, sq.y); if (ok.why) { D.sfx('error'); L.msg = { text: ok.why, t: 200 }; return; } L.stompAt = [sq.x, sq.y]; L.stompPlan = ok; L.mode = 'stomp'; L.stompT = null; return; }
      return;
    }
    if (L.mode === 'form') return RN.formInput(B);
    if (L.mode === 'card') {
      if (b || m.rclick) { RN.closeCard(B); return; }
      if (m.click && L.floorHover) { var hc = RN.runeAt(B, L.floorHover.x, L.floorHover.y); if (hc && hc !== 'entry') return RN.openCard(B, hc); if (hc === 'entry') return RN.openEntry(B); }
      return;
    }
    if (L.mode === 'second' || L.mode === 'ward' || L.mode === 'moveEntry') {
      if (b || m.rclick) { D.sfx('cancel'); if (L.mode === 'moveEntry') L.mode = 'fly'; else L.mode = 'card'; return; }
      var at = m.click ? L.floorHover : a ? B.map.at(L.cur.x, L.cur.y) : null; if (!at) return;
      if (L.mode === 'moveEntry') return RN.moveEntry(B, at.x, at.y);
      return RN.setTo(B, L.card, at.x, at.y);
    }
  };
  RN.runeAt = function (B, x, y) {
    var L = B.lay; if (L.entry[0] === x && L.entry[1] === y) return 'entry';
    var rs = RN.list(L.slot);
    for (var i = rs.length - 1; i >= 0; i--) if (rs[i].at[0] === x && rs[i].at[1] === y) return rs[i];
    for (var j = rs.length - 1; j >= 0; j--) if ((rs[j].sq || []).some(function (p) { return p && p[0] === x && p[1] === y; })) return rs[j];
    return null;
  };

  // ------------------------------------------------------------------ LAY THE RUNE: the pick (tabs by CR band, then the unit), as MAGIC's
  RN.openPick = function (B) {
    var L = B.lay, gs = RN.groups(L.pk.st, L.slot);
    if (!gs.length) { D.sfx('error'); B.card(['{g}No units bound yet: THE CAMPAIGN\'s shops, then BIND on THE UNITS. Then LAY THE RUNE.{/}'], 300, 'lay'); return; }
    D.sfx('popup'); L.mode = 'pick'; L.pick = null;
    var tabs = RN.tabs(gs); L.tab = Math.min(L.tab, tabs.length - 1);
    if (!tabs[L.tab] || !tabs[L.tab].groups.some(function (g) { return g.free.length; })) tabs.some(function (t, i) { if (t.groups.some(function (g) { return g.free.length; })) { L.tab = i; return true; } return false; }); // (the first tab with a unit to lay, as MAGIC opens on the first level with a spell to cast)
    L.row = 0;
  };
  RN.pickState = function (B) { var L = B.lay, gs = RN.groups(L.pk.st, L.slot), tabs = RN.tabs(gs); L.tab = Math.max(0, Math.min(L.tab, tabs.length - 1)); var tb = tabs[L.tab] || { groups: [] }; L.row = Math.max(0, Math.min(L.row, tb.groups.length - 1)); return { tabs: tabs, tab: tb, g: tb.groups[L.row] || null }; };
  RN.pickInput = function (B) {
    var L = B.lay, ps = RN.pickState(B), n = ps.tabs.length, k = ps.tab.groups.length;
    if (I.repeat('right') && n > 1) { L.tab = (L.tab + 1) % n; L.row = 0; D.sfx('cursor'); }
    if (I.repeat('left') && n > 1) { L.tab = (L.tab - 1 + n) % n; L.row = 0; D.sfx('cursor'); }
    if (I.repeat('down') && k) { L.row = (L.row + 1) % k; D.sfx('cursor'); }
    if (I.repeat('up') && k) { L.row = (L.row - 1 + k) % k; D.sfx('cursor'); }
    if (I.pressed('a') && ps.g) { if (ps.g.free.length) RN.aim(B, ps.g); else RN.buy(B, ps.g); return; }
    if (I.pressed('b') || I.mouse.rclick) { D.sfx('cancel'); L.mode = 'fly'; }
  };
  RN.buy = function (B, g) {
    var L = B.lay, r = RN.buyAnother(L.pk.st, g.kinds);
    if (!r.ok) { D.sfx('error'); L.msg = { text: r.why, t: 300 }; return null; }
    D.sfx('coin'); L.pk.keep();
    B.card(['{y}BOUGHT ANOTHER{/}: ' + RN.name(g.kinds) + ' for ' + PD.fmt(r.cost) + ', bound as one unit -- ' + PD.fmt(PD.camp(L.pk.st).purse) + ' left.'], 300, 'laybuy');
    return r.unit;
  };
  // the aim: the unit's members made as the fight will make them, ghosts at the cursor
  RN.aim = function (B, g) {
    var L = B.lay, u = g.free[0];
    var us = g.kinds.map(function (k, j) { return RN.member(B, k, 'aim' + j); });
    if (us.some(function (x) { return !x; })) { D.sfx('error'); L.msg = { text: 'one of them would not build: ' + RN.name(g.kinds), t: 240 }; return; }
    D.sfx('confirm'); L.pick = { g: g, unit: u, us: us, flies: us.every(function (x) { return x.flies; }) }; L.mode = 'aim';
    D.spr.ensure(us.map(function (x) { return x.sheet; }).filter(Boolean));
  };
  // a rune at (x, y) for the unit picked: its formation, or why not
  RN.aimAt = function (B, x, y) {
    var L = B.lay, p = L.pick, m = B.map; if (!p) return { why: 'nothing picked' };
    var q = m.at(x, y); if (!q || (!q.walk && !q.deep)) return { why: 'rock' };
    var reach = RN.reach(m, L.entry); if (!reach[x + ',' + y]) return { why: 'cut off from the party\'s way in' };
    var zft = RN.altFt(B, x, y), aloft = p.flies && zft > 0;
    if (q.deep && !q.walk && !aloft && !p.us.every(function (u) { return u.swims || (u.bound && u.bound.indexOf(q.ch) >= 0); })) return { why: 'deep water' + (p.flies ? ': lift the mage to lay them aloft' : '') };
    var fw = RN.faceTo([x, y], L.entry), f = RN.formation(m, p.us, [x, y], fw, RN.takenBy(B, null), reach, aloft);
    if (f.why) return { why: f.why };
    return { sq: f.sq, fw: fw, z: aloft ? zft : null };
  };
  RN.stompStart = function (B) {
    var L = B.lay, mg = L.mage; L.stompT = B.t; mg.anim = 'stomp'; mg.animT = B.t;
    var an = D.spr.anim(mg.sheet, 'stomp'), dur = D.spr.duration(mg.sheet, 'stomp') || 36, fr = an && an.frames || 6, pu = an && an.pulse != null ? an.pulse : 3;
    L.pulseAt = B.t + Math.max(1, Math.round(dur * pu / fr)); L.stompEnd = B.t + dur + 4;
  };
  // the ground pulse: the rune laid, the unit stood on its formation, and THE FORMATION to set
  RN.tickStomp = function (B) {
    var L = B.lay; if (L.mode !== 'stomp' || L.stompT == null) return;
    if (!L.laidNow && B.t >= L.pulseAt) {
      var p = L.pick, at = L.stompAt, plan = RN.aimAt(B, at[0], at[1]); if (plan.why) plan = L.stompPlan;
      var r = { unit: p.unit ? p.unit.id : null, foes: p.g.kinds.slice(), at: at.slice(), post: 'stand', to: null, ward: null, r: RN.R, z: plan.z || null, fw: plan.fw, sq: plan.sq.map(function (q) { return q.slice(); }) };
      var rs = RN.list(L.slot), first = !rs.length;
      rs.push(r); RN.seatRune(B, r, rs.length - 1); G.setup(B.map, B.units); RN.save(B);
      RN.formUnits(B, r).forEach(function (u) { FX.sparkle(u, 'glow', 8); });
      D.sfx('earth'); setTimeout(function () { D.sfx('magic'); }, 120); B.shakeT = 8;
      L.laidNow = r;
      B.card(['{y}THE RUNE IS LAID{/}: ' + RN.name(r.foes) + (r.z ? ', aloft at ' + r.z + ' ft' : '') + '.' + (first && L.slot.foes ? '  {g}The fight is its runes now: CR ' + PK.fmt8(PK.sum8(L.slot.foes)) + '.{/}' : '')], 300, 'lay');
      RN.warnCheck(B);
    }
    if (B.t >= L.stompEnd) { var rr = L.laidNow; L.laidNow = null; L.stompT = null; L.stompAt = null; L.mage.anim = 'hover'; L.mage.animT = B.t; if (rr) RN.openForm(B, rr); else L.mode = 'fly'; }
  };

  // ------------------------------------------------------------------ THE FORMATION after the rune (his 11-10), as ORDER round the roam's leader
  RN.openForm = function (B, r) {
    var L = B.lay; L.mode = 'form'; L.form = { r: r, sel: null };
    B.card(['{y}THE FORMATION{/}: ' + RN.name(r.foes) + ' round the rune.', '{g}Click one of them, then a lit square in the box. Right click: they face the next way. E when done.{/}'], 100000, 'layform');
  };
  RN.formUnits = function (B, r) { return B.units.filter(function (u) { return u.rune === r; }); };
  RN.formLegit = function (B, u, x, y) {
    var r = u.rune || (B.lay.form && B.lay.form.r); if (!r || Math.max(Math.abs(x - r.at[0]), Math.abs(y - r.at[1])) > RN.BOX) return false;
    var aloft = u.fz != null, taken = RN.takenBy(B, null), s = u.size || 1;
    for (var jj = 0; jj < s; jj++) for (var ii = 0; ii < s; ii++) delete taken[(u.x + ii) + ',' + (u.y + jj)]; // (its own squares are free to it)
    return !RN.why(B.map, u, x, y, taken, RN.reach(B.map, B.lay.entry), aloft);
  };
  RN.formInput = function (B) {
    var L = B.lay, F = L.form, m = I.mouse, r = F.r;
    if (I.pressed('a') || I.pressed('b')) { RN.formDone(B); return; }
    if (m.rclick) { // (a right click: the formation as it stands, a quarter turn -- the roam's ORDER)
      var fw = r.fw || [0, 1]; r.fw = [-fw[1], fw[0]];
      var us = RN.formUnits(B, r); RN.unseat(B, r); r.sq = [];
      RN.seatRune(B, r, RN.list(L.slot).indexOf(r)); G.setup(B.map, B.units); RN.save(B); F.sel = null; D.sfx('confirm'); void us;
      return;
    }
    if (!m.click || !L.floorHover) return;
    var x = L.floorHover.x, y = L.floorHover.y, us2 = RN.formUnits(B, r);
    var who = us2.filter(function (u) { var s = u.size || 1; return x >= u.x && y >= u.y && x < u.x + s && y < u.y + s; })[0];
    if (who) { F.sel = who; D.sfx('confirm'); return; }
    if (F.sel && RN.formMove(B, F.sel, x, y)) return;
    D.sfx('miss');
  };
  // one of the formation to (x, y), if it may stand there: its square kept on the rune
  RN.formMove = function (B, u, x, y) {
    var L = B.lay, r = u.rune; if (!r || !RN.formLegit(B, u, x, y)) return false;
    var j = RN.formUnits(B, r).indexOf(u), g0 = G.gzAt(u, u.x, u.y);
    u.tween = { fx: u.x, fy: u.y, fz: g0, t: 0, dur: 6, mode: null }; u.x = x; u.y = y;
    if (u.fz != null) u.fz = RN.groundOf(B.map, u, x, y) + (r.z || 0) / 2.5 * L.step;
    r.sq[j] = [x, y]; G.setup(B.map, B.units); RN.save(B); D.sfx('confirm'); RN.warnCheck(B, true);
    return true;
  };
  RN.formDone = function (B) {
    var L = B.lay, r = L.form && L.form.r; B.cards = B.cards.filter(function (c) { return c.id !== 'layform'; });
    L.form = null; RN.save(B); D.sfx('confirm');
    if (r) RN.openCard(B, r); else L.mode = 'fly';
  };

  // ------------------------------------------------------------------ THE RUNE'S CARD
  RN.openCard = function (B, r) { var L = B.lay; L.card = r; L.mode = 'card'; D.sfx('popup'); };
  RN.closeCard = function (B) { var L = B.lay; L.card = null; L.mode = 'fly'; D.sfx('cancel'); };
  RN.setPost = function (B, r, post) {
    var L = B.lay;
    if (post === 'patrol' || post === 'defend') { L.mode = post === 'patrol' ? 'second' : 'ward'; L.wantPost = post; B.card(['{y}' + RN.WORD[post] + '{/}: ' + (post === 'patrol' ? 'click its second square -- the rune walked there and back.' : 'click its ward -- a square, or a thing on the floor (a door, a crate, the chest): held within ' + (r.r || RN.R) + ' ft of it.') + '  {g}X back{/}'], 100000, 'laysecond'); return; }
    r.post = post; r.to = null; r.ward = null; RN.save(B); D.sfx('confirm');
  };
  RN.setTo = function (B, r, x, y) {
    var L = B.lay, m = B.map, q = m.at(x, y), post = L.wantPost;
    if (!r) { L.mode = 'fly'; return; }
    if (post === 'patrol') {
      if (!q || !q.walk) { D.sfx('error'); L.msg = { text: 'not a square to walk to', t: 200 }; return; }
      var reach = RN.reach(m, r.at); if (!reach[x + ',' + y]) { D.sfx('error'); L.msg = { text: 'no walk from the rune to there', t: 200 }; return; }
      if (x === r.at[0] && y === r.at[1]) { D.sfx('error'); L.msg = { text: 'the rune\'s own square: pick another', t: 200 }; return; }
      r.post = 'patrol'; r.to = [x, y]; r.ward = null;
    } else {
      var th = RN.thingAt(m, x, y);
      if ((!q || (!q.walk && !q.deep)) && !th) { D.sfx('error'); L.msg = { text: 'rock: pick a square, or a thing on the floor', t: 200 }; return; }
      r.post = 'defend'; r.to = th ? th.at.slice() : [x, y]; r.ward = th ? th.name : null;
    }
    B.cards = B.cards.filter(function (c) { return c.id !== 'laysecond'; });
    RN.save(B); D.sfx('confirm'); L.mode = 'card';
  };
  RN.remove = function (B, r) {
    var L = B.lay, rs = RN.list(L.slot), i = rs.indexOf(r); if (i < 0) return;
    rs.splice(i, 1); RN.unseat(B, r); L.card = null; L.mode = 'fly';
    if (!rs.length) { var f = PD.fill(L.pk, L.slot.map, L.slot.cr8 || 0, PD.placed(L.mod.slots, L.si)); L.slot.foes = f.foes; L.slot.mine = f.mine; L.slot.units = f.units; B.card(['{g}The last rune is off: the fight rolls its CR again, as before the runes (CR ' + PK.fmt8(PK.sum8(f.foes)) + ').{/}'], 300, 'lay'); } // (a fight with no runes keeps today's fill -- his 7)
    RN.save(B); RN.warnCheck(B, true); D.sfx('cancel');
  };
  // the things on a floor a DEFEND may ward by name: a map's own (its doors, the chest, the barrel, the bucket, the skylight, its lamps) and what the squares are (a door's threshold, a
  // crate, a well, a cradle, a tent, a tree, a cocoon) -- on the square, or beside it
  RN.THINGS = { d: 'the door', k: 'the crate', w: 'the well', y: 'the cradle', W: 'the tent', T: 'the tree', c: 'the cocoon', f: 'the fence', K: 'the cart', V: 'the wagon', S: 'the stall' };
  RN.thingAt = function (m, x, y) {
    var def = m.def, list = [];
    (def.doors || []).forEach(function (q) { list.push({ at: [q[0], q[1]], name: 'the door' }); });
    (def.passages || []).forEach(function (p) { list.push({ at: [p[0], p[1]], name: p[4] || 'the door' }); });
    if (def.chest) list.push({ at: def.chest.slice(0, 2), name: 'the chest' });
    if (def.torchBarrel) list.push({ at: def.torchBarrel.slice(0, 2), name: 'the torch barrel' });
    if (def.ropeBucket) list.push({ at: def.ropeBucket.slice(0, 2), name: 'the rope bucket' });
    if (def.skylight) list.push({ at: (def.skylight.at || def.skylight).slice(0, 2), name: 'the skylight' });
    (def.lights || []).forEach(function (l) { list.push({ at: [l[0], l[1]], name: l[3] === 'fire' || !l[3] || l[3] === 'gold' ? 'the fire' : 'the lamp' }); });
    var hit = function (d) { return list.filter(function (t) { return Math.max(Math.abs(t.at[0] - x), Math.abs(t.at[1] - y)) <= d; })[0] || null; };
    var th = hit(0); if (th) return th;
    var q = m.at(x, y); if (q && RN.THINGS[q.ch]) return { at: [x, y], name: RN.THINGS[q.ch] };
    th = hit(1); if (th) return th;
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var n = m.at(x + dx, y + dy); if (n && RN.THINGS[n.ch] && (dx || dy)) return { at: [x + dx, y + dy], name: RN.THINGS[n.ch] }; }
    return null;
  };
  RN.radius = function (B, r, d) { var i = RN.RADII.indexOf(r.r || RN.R); if (i < 0) i = RN.RADII.indexOf(RN.R); r.r = RN.RADII[Math.max(0, Math.min(RN.RADII.length - 1, i + d))]; RN.save(B); };

  // ------------------------------------------------------------------ THE PARTY'S WAY IN (his 6): a rune of its own, moved; red with a warning while a foe rune is near it
  RN.openEntry = function (B) { var L = B.lay; L.mode = 'moveEntry'; D.sfx('popup'); B.card(['{y}THE PARTY\'S WAY IN{/}: click the square they come in on.  {g}X back{/}'], 100000, 'layentry'); };
  RN.moveEntry = function (B, x, y) {
    var L = B.lay, q = B.map.at(x, y);
    if (!q || !q.walk) { D.sfx('error'); L.msg = { text: 'not a square to stand on', t: 200 }; return; }
    if (RN.list(L.slot).some(function (r) { return (r.sq || []).some(function (p) { return p && p[0] === x && p[1] === y; }); })) { D.sfx('error'); L.msg = { text: 'one of yours stands there', t: 200 }; return; }
    L.entry = [x, y]; L.slot.entry = [x, y];
    B.cards = B.cards.filter(function (c) { return c.id !== 'layentry'; });
    var reach = RN.reach(B.map, L.entry); RN.list(L.slot).forEach(function (r) { r.cut = !reach[r.at[0] + ',' + r.at[1]]; });
    RN.save(B); D.sfx('confirm'); L.mode = 'fly'; RN.warnCheck(B);
  };
  RN.leave = function (B) {
    var L = B.lay; RN.save(B); D.sfx('cancel');
    if (D.top() === B) D.pop();
    var n = RN.list(L.slot).length;
    L.pk.say('FIGHT ' + (L.si + 1) + ': ' + (n ? n + ' rune' + (n === 1 ? '' : 's') + ' laid, CR ' + PK.fmt8(PK.sum8(L.slot.foes || [])) : 'no runes: its CR rolled as before'), 300);
    if (L.o && L.o.onLeave) L.o.onLeave(L);
  };

  // ------------------------------------------------------------------ the look: on the floor (under the figures), over the light, over the screen
  function ell(c, x, y, gz, rx, ry, col, w, fill) {
    var cc = D.iso.center(x, y, gz), s = D.iso.toScreen(cc.x, cc.y);
    c.beginPath(); c.ellipse(s.x, s.y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (col) { c.strokeStyle = col; c.lineWidth = w || 1.5; c.stroke(); c.lineWidth = 1; }
    return s;
  }
  function sqPt(B, x, y, lift) { var cc = D.iso.center(x, y, B.map.gz(x, y) + (lift || 0)); return D.iso.toScreen(cc.x, cc.y); }
  RN.colOf = function (B, r) { return r === 'entry' ? (B.lay.warn ? RN.COL.warn : RN.COL.entry) : RN.COL[r.post] || RN.COL.stand; };
  RN.floorMarks = function (c, B) {
    var L = B.lay; if (!L) return;
    var iso = D.iso;
    // the formation's box (as ORDER's): its squares lit where the one picked may go
    if (L.mode === 'form' && L.form) {
      var r = L.form.r, who = L.form.sel || RN.formUnits(B, r)[0];
      for (var y = r.at[1] - RN.BOX; y <= r.at[1] + RN.BOX; y++) for (var x = r.at[0] - RN.BOX; x <= r.at[0] + RN.BOX; x++) {
        if (!B.map.at(x, y) || !who || !RN.formLegit(B, who, x, y)) continue;
        iso.rhombus(c, x, y, B.map.gz(x, y), 1); c.globalAlpha = 0.32; c.fillStyle = 'rgb(150,210,255)'; c.fill(); c.globalAlpha = 1;
      }
    }
    // each rune's ring on its floor, in its posture's colour; a patrol's way, a ward's reach
    RN.list(L.slot).forEach(function (r) {
      var col = RN.colOf(B, r), gz = B.map.gz(r.at[0], r.at[1]);
      if (r.post === 'patrol' && r.to) RN.dash(c, B, r.at, r.to, col);
      if (r.post === 'defend' && r.to) { var rr = (r.r || RN.R) / 5; ell(c, r.to[0], r.to[1], B.map.gz(r.to[0], r.to[1]), (rr + 0.5) * iso.TW / 2 * 1.0, (rr + 0.5) * iso.TH / 2, col, 1, 'rgba(100,180,252,0.08)'); RN.dash(c, B, r.at, r.to, col); }
      ell(c, r.at[0], r.at[1], gz, 14, 7, col, 2, r === L.card ? 'rgba(255,255,255,0.10)' : null);
      if (r.cut) ell(c, r.at[0], r.at[1], gz, 17, 9, RN.COL.bad, 1);
    });
    var e = L.entry; ell(c, e[0], e[1], B.map.gz(e[0], e[1]), 14, 7, RN.colOf(B, 'entry'), 2);
    if (L.warn) ell(c, e[0], e[1], B.map.gz(e[0], e[1]), (RN.WARN_FT / 5 + 0.5) * iso.TW / 2, (RN.WARN_FT / 5 + 0.5) * iso.TH / 2, 'rgba(244,90,76,0.55)', 1);
  };
  RN.dash = function (c, B, a, b, col) {
    var p = sqPt(B, a[0], a[1]), q = sqPt(B, b[0], b[1]);
    c.save(); c.strokeStyle = col; c.globalAlpha = 0.85; c.setLineDash([3, 3]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke(); c.restore();
    D.iso.rhombus(c, b[0], b[1], B.map.gz(b[0], b[1]), 6); c.fillStyle = col; c.globalAlpha = 0.8; c.fill(); c.globalAlpha = 1;
  };
  RN.marksOver = function (c, B) {
    var L = B.lay; if (!L) return;
    // the chips: each rune's type on the floor, its edge the posture's colour; the party's way in, a person's chip in pale
    RN.list(L.slot).forEach(function (r) { var p = sqPt(B, r.at[0], r.at[1]); D.ui.drawGlyph(c, RN.typeOf(r.foes), p.x, p.y + 1, { edge: RN.colOf(B, r) }); });
    var e = L.entry, pe = sqPt(B, e[0], e[1]); D.ui.drawGlyph(c, 'humanoid', pe.x, pe.y + 1, { edge: RN.colOf(B, 'entry') });
    // the cursor: the square under the mage (and the plane he flies at); the aim's ghosts and its verdict
    var cq = L.mode === 'fly' || L.mode === 'aim' ? L.hover || B.map.at(L.cur.x, L.cur.y) : L.floorHover;
    if (L.mode === 'aim' && cq) {
      var ok = RN.aimAt(B, cq.x, cq.y), col = ok.why ? RN.COL.bad : RN.COL.ok;
      if (!ok.why) L.pick.us.forEach(function (u, j) {
        var sq = ok.sq[j]; if (!sq) return;
        var g = RN.groundOf(B.map, u, sq[0], sq[1]), zz = ok.z ? g + ok.z / 2.5 * L.step : g, s0 = (u.size || 1) - 1, cc = D.iso.center(sq[0] + s0 / 2, sq[1] + s0 / 2, zz), s = D.iso.toScreen(cc.x, cc.y);
        D.iso.rhombus(c, sq[0], sq[1], g, 3); c.strokeStyle = 'rgba(156,220,255,0.8)'; c.stroke();
        if (u.sheet && D.spr.has(u.sheet)) D.spr.draw(c, u.sheet, 'idle', D.spr.facingFor(ok.fw[0], ok.fw[1]), B.t, s.x, s.y, { alpha: 0.5 });
      });
      D.iso.rhombus(c, cq.x, cq.y, B.map.gz(cq.x, cq.y), 2); c.strokeStyle = col; c.lineWidth = 2; c.stroke(); c.lineWidth = 1;
      L.aimWhy = ok.why || null;
    } else if (cq && L.mode !== 'stomp' && L.mode !== 'pick') {
      var over = RN.runeAt(B, cq.x, cq.y), want = L.mode === 'second' || L.mode === 'ward' || L.mode === 'moveEntry';
      D.iso.rhombus(c, cq.x, cq.y, B.map.gz(cq.x, cq.y), 2); c.strokeStyle = over ? '#ffe080' : want ? RN.COL.ok : 'rgba(220,234,255,0.7)'; c.lineWidth = over ? 2 : 1.5; c.stroke(); c.lineWidth = 1;
      if (L.mode === 'ward') { var th = RN.thingAt(B.map, cq.x, cq.y); L.wardHover = th ? th.name : null; if (th) { D.iso.rhombus(c, th.at[0], th.at[1], B.map.gz(th.at[0], th.at[1]), 1); c.strokeStyle = RN.COL.defend; c.lineWidth = 2; c.stroke(); c.lineWidth = 1; } }
    }
    if (L.mode === 'form' && L.form && L.form.sel) { var su = L.form.sel; D.iso.rhombus(c, su.x, su.y, B.map.gz(su.x, su.y), 2); c.strokeStyle = '#ffe080'; c.lineWidth = 2; c.stroke(); c.lineWidth = 1; }
    // the mage's shadow on the floor under him, so his square reads while he is aloft
    var mg = L.mage; if (mg.fz != null) ell(c, mg.x, mg.y, G.groundAt(mg, mg.x, mg.y), 8, 4, null, 1, 'rgba(0,0,0,0.35)');
  };
  RN.screenOver = function (c, B) {
    var L = B.lay; if (!L) return;
    L.btnsDrawn = L.btns; L.btns = []; L.panels = [];
    var st = L.pk.st, cp = PD.camp(st), slot = L.slot, n = RN.list(slot).length;
    // the head: the floor, the fight, its CR -- a laid fight is its runes
    c.fillStyle = 'rgba(8,8,20,.78)'; c.fillRect(0, 0, D.W, 13);
    D.text(c, '{y}WALK IT{/}  ' + String(B.map.def.name || slot.map).toUpperCase() + '  {g}' + L.mod.name + ', fight ' + (L.si + 1) + '{/}', 5, 3, P('bone', 1));
    D.text(c, (n ? '{y}' + n + ' rune' + (n === 1 ? '' : 's') + '{/} CR ' + PK.fmt8(PK.sum8(slot.foes || [])) : '{g}no runes: CR ' + PK.fmt8(PK.sum8(slot.foes || [])) + ' rolled{/}') + '   {g}purse{/} ' + PD.fmt(cp.purse), D.W - 40, 3, P('gold', 4), 'right'); // (the square under the cursor stands top right: js/ui.js drawBattle, B.cursor)
    // the bar along the foot, and the mage's height on it
    var by = D.H - 17, mg = L.mage, ft = RN.altFt(B, mg.x, mg.y);
    c.fillStyle = 'rgba(8,8,20,.6)'; c.fillRect(0, by - 3, D.W, 20);
    if (L.mode === 'fly') {
      RN.btn(B, c, 'LAY THE RUNE (E)', 6, by, 112, 14, function () { RN.openPick(B); }, { on: false });
      RN.btn(B, c, 'THE WAY IN', 122, by, 80, 14, function () { RN.openEntry(B); });
      RN.btn(B, c, 'DONE (X)', D.W - 76, by, 70, 14, function () { RN.leave(B); });
      D.text(c, 'THE MAGE ' + (ft ? '{c}' + ft + ' FT UP{/}' : 'ON THE FLOOR') + '  {g}Shift+wheel or [ ]{/}', 210, by + 4, P('bone', 2));
    }
    if (L.mode === 'aim') {
      var p = L.pick; D.text(c, '{y}AIM{/} ' + RN.name(p.g.kinds) + (p.flies ? (RN.altFt(B, L.cur.x, L.cur.y) ? '  {c}laid aloft at ' + RN.altFt(B, L.cur.x, L.cur.y) + ' ft (all of them fly){/}' : '  {g}all fly: lift the mage to lay them aloft{/}') : '') + (L.aimWhy ? '   {o}' + L.aimWhy + '{/}' : '   {g}click: the stomp lays the rune{/}'), 6, by - 10, P('bone', 1));
      RN.btn(B, c, 'BACK (X)', D.W - 76, by, 70, 14, function () { L.mode = 'pick'; });
    }
    if (L.mode === 'form') RN.btn(B, c, 'DONE (E)', D.W - 76, by, 70, 14, function () { RN.formDone(B); });
    if (L.mode === 'second' || L.mode === 'ward' || L.mode === 'moveEntry') {
      D.text(c, L.mode === 'second' ? '{y}PATROL{/}: its second square' : L.mode === 'ward' ? '{y}DEFEND{/}: its ward' + (L.wardHover ? ' -- {c}' + L.wardHover + '{/}' : ' -- a square, or a thing') : '{y}THE WAY IN{/}: a square to stand on', 6, by - 10, P('bone', 1));
      RN.btn(B, c, 'BACK (X)', D.W - 76, by, 70, 14, function () { L.mode = L.mode === 'moveEntry' ? 'fly' : 'card'; B.cards = B.cards.filter(function (q) { return q.id !== 'laysecond' && q.id !== 'layentry'; }); });
    }
    if (L.mode === 'pick') RN.drawPick(c, B);
    if (L.mode === 'card' && L.card) RN.drawCard(c, B, L.card);
    if (L.msg) D.text(c, '{o}' + L.msg.text + '{/}', D.W / 2, D.H - 32, P('bone', 1), 'center');
  };
  // the pick: a window as MAGIC's -- the tabs a CR band each, the rows the units, the box under them the one the cursor is on
  RN.drawPick = function (c, B) {
    var L = B.lay, ps = RN.pickState(B), x = D.W - 214, y = 24, w = 208, h = 214, cp = PD.camp(L.pk.st);
    L.panels.push({ x: x, y: y, w: w, h: h });
    D.win8(c, x, y, w, h);
    D.text(c, '{y}LAY THE RUNE{/}  {g}your bound units, by CR{/}', x + 6, y + 5, P('bone', 1));
    // the tabs
    var tw = Math.floor((w - 12) / Math.max(1, ps.tabs.length));
    ps.tabs.forEach(function (t, i) {
      var tx = x + 6 + i * tw, on = i === L.tab, free = t.groups.some(function (g) { return g.free.length; });
      RN.btn(B, c, t.label, tx, y + 16, tw - 2, 12, function () { L.tab = i; L.row = 0; }, { on: on, col: free ? null : P('stone', 3) });
    });
    // the rows: a unit's make, its CR, its copies -- free on this fight, or all laid (then BUY ANOTHER)
    var per = 9, from = Math.max(0, Math.min(L.row - per + 1, ps.tab.groups.length - per)), ry = y + 32;
    if (from < 0) from = 0;
    ps.tab.groups.slice(from, from + per).forEach(function (g, k) {
      var i = from + k, yy = ry + k * 14, on = i === L.row, have = g.free.length;
      RN.btn(B, c, '', x + 6, yy, w - 12, 13, function () { if (L.row === i) { if (g.free.length) RN.aim(B, g); else RN.buy(B, g); } else { L.row = i; D.sfx('cursor'); } }, { on: on });
      D.ui.drawGlyph(c, g.type, x + 14, yy + 6, { edge: on ? 'gold' : 'grey' });
      D.text(c, cut(g.name, 106), x + 24, yy + 3, have ? (on ? P('gold', 4) : P('bone', 1)) : P('stone', 5));
      D.text(c, 'CR ' + PK.fmt8(g.cr8), x + 152, yy + 3, P('gold', 4), 'right');
      D.text(c, have ? have + '/' + g.units.length : 'LAID', x + w - 10, yy + 3, have ? P('moss', 2) : P('stone', 5), 'right');
    });
    if (!ps.tab.groups.length) D.text(c, '{g}none in this band{/}', x + 10, ry + 4, P('stone', 5));
    // the box: the one the cursor is on
    var g0 = ps.g, bx = y + 32 + per * 14 + 2;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + 6, bx, w - 12, h - (bx - y) - 22);
    if (g0) {
      var lines = [g0.units.length + ' bound · ' + g0.kinds.length + ' head' + (g0.kinds.length === 1 ? '' : 's') + ' · CR ' + PK.fmt8(g0.cr8) + (g0.kinds.every(function (k) { var f = PK.foe(k); return f && (f.fly || f.flies || f.speedFly); }) ? ' · all fly' : '')];
      lines.push(g0.free.length ? '{g}E or a click again: aim it on the floor{/}' : '{o}every copy is laid on this fight{/}');
      lines.forEach(function (l, k) { D.text(c, l, x + 10, bx + 3 + k * 10, P('bone', 2)); });
      if (!g0.free.length) { var cost = RN.price(g0.kinds); RN.btn(B, c, 'BUY ANOTHER  ' + PD.fmt(cost), x + 10, bx + 24, 124, 13, function () { RN.buy(B, g0); }, { dis: cp.purse < cost, why: 'the purse holds ' + PD.fmt(cp.purse) + ': another is ' + PD.fmt(cost) }); }
    }
    RN.btn(B, c, 'BACK (X)', x + w - 66, y + h - 18, 60, 13, function () { L.mode = 'fly'; });
    D.text(c, '{g}< > a band  ^ v a unit{/}', x + 8, y + h - 15, P('stone', 5));
  };
  function cut(s, w) { s = String(s); if (D.textWidth(s) <= w) return s; while (s.length > 1 && D.textWidth(s + '.') > w) s = s.slice(0, -1); return s + '.'; }
  // the rune's card: its unit, its posture's four, its radius, FORMATION and REMOVE
  RN.drawCard = function (c, B, r) {
    var L = B.lay, x = 6, y = 30, w = 168, h = 158;
    L.panels.push({ x: x, y: y, w: w, h: h });
    D.win8(c, x, y, w, h);
    D.ui.drawGlyph(c, RN.typeOf(r.foes), x + 12, y + 11, { edge: RN.colOf(B, r) });
    D.text(c, '{y}' + cut(RN.name(r.foes), w - 30) + '{/}', x + 22, y + 5, P('bone', 1));
    D.text(c, 'CR ' + PK.fmt8(PK.sum8(r.foes)) + (r.z ? '  {c}aloft ' + r.z + ' ft{/}' : '') + (r.unit == null ? '  {g}from a file{/}' : ''), x + 22, y + 15, P('gold', 4));
    D.text(c, RN.WORD[r.post] + ': ' + RN.SAY[r.post] + (r.post === 'defend' && r.to ? ' -- ' + (r.ward || 'the place at ' + r.to.join(',')) : ''), x + 6, y + 28, RN.colOf(B, r));
    RN.POSTS.forEach(function (p, k) {
      RN.btn(B, c, RN.WORD[p], x + 6 + (k % 2) * 79, y + 40 + Math.floor(k / 2) * 16, 76, 14, function () { RN.setPost(B, r, p); }, { on: r.post === p, col: RN.COL[p] });
    });
    D.text(c, 'RADIUS', x + 8, y + 78, P('bone', 2));
    RN.btn(B, c, '<', x + 60, y + 75, 14, 13, function () { RN.radius(B, r, -1); });
    D.text(c, (r.r || RN.R) + ' ft', x + 92, y + 78, P('gold', 4), 'center');
    RN.btn(B, c, '>', x + 110, y + 75, 14, 13, function () { RN.radius(B, r, 1); });
    RN.btn(B, c, 'FORMATION', x + 6, y + 96, 76, 14, function () { L.card = null; RN.openForm(B, r); });
    RN.btn(B, c, 'REMOVE', x + 85, y + 96, 76, 14, function () { RN.remove(B, r); }, { col: RN.COL.bad });
    if (r.cut) D.text(c, '{o}cut off from the way in{/}', x + 8, y + 116, P('bone', 1));
    else if (RN.near(B).indexOf(r) >= 0) D.text(c, '{o}within ' + RN.WARN_FT + ' ft of the way in{/}', x + 8, y + 116, P('bone', 1));
    RN.btn(B, c, 'CLOSE (X)', x + w - 66, y + h - 18, 60, 13, function () { RN.closeCard(B); });
  };

  // ------------------------------------------------------------------ the door: deep16/?runes -- a scratch DM's table (nothing kept), three units bound, a module of one
  // fight on &map= (the Hex floor by default), its lay floor open; &show stages the look: four runes, one a posture, the party's way in warned (the eyes rows' doors)
  RN.SCRATCH = [['goblin', 'goblin', 'hobgoblin'], ['ogre'], ['giantbat', 'giantbat'], ['wolf', 'wolf', 'wolf'], ['bugbear']];
  RN.scratch = function (q) {
    var mp = (/[?&]map=([a-z0-9_]+)/.exec(q || '') || [])[1], st = { dm: true, party: PK.defaultParty ? PK.defaultParty() : null };
    var cp = PD.camp(st); cp.purse = 50000;
    RN.SCRATCH.forEach(function (ks) { if (!ks.every(function (k) { return PK.foe(k); })) return; var ids = ks.map(function (k) { return PD.buy(st, k).receipt.id; }); PD.bind(st, ids); });
    var map = mp && D.MAPS[mp] ? mp : 'hexfloor';
    cp.maps.push({ id: map, paid: 0, at: Date.now() });
    var m = PD.newModule(st, 'THE RUNES TEST'); m.slots.push({ map: map, cr8: 16, foes: ['goblin', 'goblin'], mine: 0, units: [], rest: PD.REST0() });
    return st;
  };
  RN.door = function (q) {
    var st = RN.scratch(q), pk = new D.Pocket(), e0 = pk.enter, show = /[?&]show\b/.test(q || '');
    pk.enter = function () {
      var ld = PK.load; PK.load = function () { return st; };
      try { e0.call(this); } finally { PK.load = ld; }
      this.keep = function () { return true; }; // (a scratch table: nothing written to this browser's Pocket DM)
      this.go('build');
      this.say('a scratch DM\'s table for the runes: nothing here is kept', 400);
      D.push(RN.floor(this, PD.editing(this.st), 0, { show: show }));
    };
    return pk;
  };
  // the look, staged (&show): the four postures laid by hand, the party's way in moved beside one of them (the warning), every unit at the first free square the aim allows
  RN.stage = function (B) {
    var L = B.lay, gs = RN.groups(L.pk.st, L.slot), m = B.map, posts = ['stand', 'ambush', 'patrol', 'defend'], laid = 0;
    var cand = []; for (var y = 1; y < m.h - 1; y++) for (var x = 1; x < m.w - 1; x++) { var s = m.at(x, y); if (s && s.walk) cand.push([x, y]); }
    var spot = function (k) { var n = cand.length; return cand[Math.floor(n * (0.15 + 0.7 * k / 4)) % n]; };
    gs.slice(0, 4).forEach(function (g, k) {
      RN.aim(B, g); if (L.mode !== 'aim') return;
      var at = spot(k), ok = null;
      for (var t = 0; t < 40 && (!ok || ok.why); t++) { at = cand[(cand.indexOf(at) + 7 * t) % cand.length]; ok = RN.aimAt(B, at[0], at[1]); }
      if (!ok || ok.why) return;
      var r = { unit: L.pick.unit.id, foes: g.kinds.slice(), at: at.slice(), post: posts[k], to: null, ward: null, r: RN.R, z: null, fw: ok.fw, sq: ok.sq };
      if (posts[k] === 'patrol' || posts[k] === 'defend') { var to = cand[(cand.indexOf(at) + 23) % cand.length]; r.to = to.slice(); if (posts[k] === 'defend') { var th = RN.thingAt(m, to[0], to[1]); if (th) { r.to = th.at.slice(); r.ward = th.name; } } }
      RN.list(L.slot).push(r); RN.seatRune(B, r, RN.list(L.slot).length - 1); laid++;
    });
    var r0 = RN.list(L.slot)[0]; if (r0) { var near = cand.filter(function (p) { return Math.max(Math.abs(p[0] - r0.at[0]), Math.abs(p[1] - r0.at[1])) === 4 && !RN.runeAt(B, p[0], p[1]); })[0]; if (near) { L.entry = near.slice(); L.slot.entry = near.slice(); } }
    L.mode = 'fly'; L.pick = null; G.setup(m, B.units); RN.save(B); RN.warnCheck(B);
    if (r0) L.cur = { x: r0.at[0], y: r0.at[1] };
    return laid;
  };
})();
