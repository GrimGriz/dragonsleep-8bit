/* DEEP16 — torchdark (09-28; Griz: "The players will need to be able to still see in the dark, even if the characters
   can't. I think shooting blind is just handled with a -4."). Light with a place: every light is a thing on the grid, a
   radius of bright light and a ring of dim past it, from a square (a torch dropped or thrown, a lamp or a fire the map
   keeps, a Daylight set at a point, Dancing Lights) or from a creature (a torch in hand, the Light cantrip on him, a
   burning blade, the Sunshaft staff, Sacred Weapon's glow, a Continual Flame). On dark ground (the map's `dark`, the
   fight's, or the 8-bit map's when the fight is fought from there) the characters see by those lights and by their own
   darkvision; the player sees the whole grid, greyed and dimmed where no one of the party can. A creature in the dark to
   its attacker is unseen: an attack at it has disadvantage (the SRD 5.1; his first "-4" was AD&D's and stays as a switch,
   js/rules.js R.BLIND), an attack from it has advantage, and a spell that wants "a creature you can see" cannot take it.
   The AI reads the same rule
   (ai.js heroes, visibleFrom). The look is the campfire's light pass laid over the fight's world canvas (ui.js). */
'use strict';
(function () {
  var D = window.D16, G = D.grid;
  var L = D.light = {};
  // shooting blind (an attack at a creature the attacker cannot see for want of light): the SRD's disadvantage, or a flat penalty --
  // one switch in js/rules.js R.BLIND (AMENDED 09-28: the -4 was AD&D's number; the game's law is the SRD 5.1)
  L.BLIND = (window.DS && window.DS.R && window.DS.R.BLIND != null) ? window.DS.R.BLIND : 'disadvantage';
  L.TORCH = { bright: 20, dim: 20 };   // SRD 5.1 torch: bright 20 ft, dim 20 more, an hour (no fight runs that long)
  // the hooded lantern (RULED 09-29, Griz: "like a mode that sort of lights and doesn't wake the bats"): SRD 5.1 bright 30 ft and
  // dim 30 more; hood down, dim light 5 ft only -- no bright light, so nothing that hates light is dazzled and a roost sleeps.
  // It takes a hand like a torch, is not spent (put out, it goes back in the pack), and is never thrown
  L.LANTERN = { bright: 30, dim: 30, hood: { bright: 0, dim: 5 } };
  // the light in a hand: u.torch = { lit, kind ('torch' | 'lantern'), item, hood }; kind unset is a torch (the fights before 09-29).
  // `item` is the pack's id when the lantern is not the plain hooded lantern: the Ledger-Lamp (RULED 09-30, Griz: "now should function
  // like a lantern but better" -- '3 perfect'), a lantern-kind light that reads its own `light` record (bright 40, dim 40, hood 0/5),
  // never spent, and put out it is the pack's again. A hooded light is any pack item whose `light` record has a `hood`
  L.kindOf = function (t) { return (t && t.kind) || 'torch'; };
  L.isLantern = function (id) { var l = itemLight(id); return id === 'lantern' || !!(l && l.hood); };
  L.make = function (id, hood) { var t = { lit: true, kind: 'lantern', hood: !!hood }; if (id && id !== 'lantern') t.item = id; return t; }; // (a hooded light in a hand)
  L.radii = function (t) {
    if (L.kindOf(t) !== 'lantern') return L.TORCH;
    var base = (t.item && itemLight(t.item)) || L.LANTERN;
    return t.hood ? (base.hood || L.LANTERN.hood) : base;
  };
  L.kindName = function (t) { return L.kindOf(t) === 'lantern' ? 'lantern' : 'torch'; };
  // what to call it in a line: 'torch', 'lantern', or the item's own name (the Ledger-Lamp); `x` is a light in a hand or on the floor, or a pack id
  L.word = function (x) {
    var id = typeof x === 'string' ? x : (x && x.item), it = id && id !== 'torch' && id !== 'lantern' && window.DS && window.DS.DATA && window.DS.DATA.items[id];
    if (it) return it.name;
    return typeof x === 'string' ? (L.isLantern(x) ? 'lantern' : 'torch') : L.kindName(x);
  };
  L.tag = function (x) { var id = typeof x === 'string' ? x : (x && x.item); return id && id !== 'lantern' && id !== 'torch' ? 'LAMP' : L.kindName(typeof x === 'string' ? { kind: L.isLantern(x) ? 'lantern' : 'torch' } : x).toUpperCase(); }; // (a wheel label)
  // the ITEM list's line under a light in the pack
  L.blurb = function (id) {
    var r = L.radii(L.isLantern(id) ? L.make(id, false) : { lit: true });
    if (id === 'lantern') return 'a hooded lantern, lit: bright ' + r.bright + ' ft, dim ' + r.dim + ' more; hood down, dim 5 ft and a roost sleeps; it takes a hand';
    if (L.isLantern(id)) return 'the ' + L.word(id) + ', lit: bright ' + r.bright + ' ft, dim ' + r.dim + ' more; hood down, dim 5 ft, a roost sleeps; never dry; one hand'; // (one line, no wider than the lantern's: the panel does not wrap it)
    return 'a torch, lit: bright ' + r.bright + ' ft, dim ' + r.dim + ' more; it takes a hand';
  };
  L.LIGHT_COST = 'A';                  // lighting a torch: an action (SRD 5.1 tinderbox: "takes an action"); the Thief's Fast Hands make it a bonus. RULED 09-28h (Griz: "yes to action cost"); 'B' would make it a bonus action for all
  // who sees in the dark by blood (SRD 5.1), keyed on the 8-bit sheets' `race`
  L.RACE_DV = { 'Half-orc': 60, 'Dwarf': 60, 'Elf': 60, 'Gnome': 60, 'Tiefling': 60, 'Drow': 120, 'Human': 0, 'Halfling': 0 };
  L.raceDV = function (race) { return L.RACE_DV[race] || 0; };
  var COL = { gold: '255,214,150', fire: '255,168,88', glow: '176,216,255', bone: '244,238,222', violet: '196,156,255', moss: '160,224,160', red: '255,120,90' };

  // ---------------------------------------------------------------- the lights on the field now
  // placed (B.lights): { x, y, bright, dim, color, flame, kind, by, id }; carried: read off each unit every time it's asked
  function itemLight(id) { var it = id && window.DS && window.DS.DATA && window.DS.DATA.items[id]; return it && it.light ? it.light : null; }
  L.carried = function (u) {
    var out = [];
    if (!u || u.dead || u.ethereal || u.left) return out;
    var cx = u.x + ((u.size || 1) - 1) / 2, cy = u.y + ((u.size || 1) - 1) / 2;
    // (`rec`: the spell's own record on him, { by, from, lv } -- where it was cast from and its level, for a Globe of Invulnerability: L.map carves the globe's squares out of it)
    var add = function (b, d, color, flame, kind, rec) { var l = { x: cx, y: cy, bright: b, dim: d, color: color, flame: !!flame, kind: kind, unit: u }; if (rec && typeof rec === 'object' && rec.from) { l.from = rec.from; l.lv = rec.lv; l.by = rec.by; } out.push(l); };
    if (u.torch && u.torch.lit) { var tr = L.radii(u.torch); add(tr.bright, tr.dim, 'gold', true, L.kindOf(u.torch)); }
    if (u.conds.light) add(20, 20, 'glow', false, 'light', u.conds.light);       // the Light cantrip, on him or his gear
    if (u.conds.daylight) add(60, 60, 'bone', false, 'daylight', u.conds.daylight); // Daylight cast on a point he stood on: it goes with him
    if (u.conds.sacred && u.hp > 0) add(20, 20, 'gold', false, 'sacred');         // Sacred Weapon's glow (SRD: bright 20 ft)
    // a Continual Flame rides the weapon it was set on (the 8-bit keeps the weapon's id): it shines while that weapon is in hand
    var cf = u.conds.continualFlame || (u.src && u.src.conds && u.src.conds.continualFlame);
    if (cf && (typeof cf !== 'string' || (u.weapon && u.weapon.id === cf))) add(20, 20, 'fire', false, 'flame', typeof cf === 'object' && cf.from ? cf : { from: D.magic && D.magic.OUTSIDE, lv: 2 }); // torch-bright, no heat (one from the 8-bit sheet was cast before any globe rose: from outside every one -- 10-01c, Griz: "everything cast before the globe has a 'where' of 'outside'")
    var wl = u.weapon && itemLight(u.weapon.id);
    if (wl && (wl.when === 'always' || (wl.when === 'lit' && u.conds.ablaze))) add(wl.bright, wl.dim, wl.when === 'lit' ? 'fire' : 'bone', wl.when === 'lit', 'weapon');
    var ol = u.offhand && !u.offhandSheathed && itemLight(u.offhand.id); // (the other hand's: Pyro's Mace of Disruption once it is out, js/pyro.js)
    if (ol && ol.when === 'always') add(ol.bright, ol.dim, 'bone', false, 'weapon');
    return out;
  };
  L.all = function (B) {
    var out = (B.lights || []).slice();
    (B.units || []).forEach(function (u) { L.carried(u).forEach(function (l) { out.push(l); }); });
    return out;
  };

  // ---------------------------------------------------------------- how light lies on every square: 0 dark, 1 dim, 2 bright
  // (a lit place has no map: everything is bright). Recomputed only when a light moves or changes; a wall stops light
  function sig(B) {
    var ls = L.all(B), k = (B.map ? B.map.def.name : '') + '|';
    ls.forEach(function (l) { k += Math.round(l.x * 2) + ',' + Math.round(l.y * 2) + ',' + l.bright + ',' + l.dim + ';'; });
    (B.darks || []).forEach(function (d) { if (d.kind !== 'fog' && d.kind !== 'sleet' && d.kind !== 'stink' && d.kind !== 'kill') k += 'D' + d.sq.length + (d.follow || '') + ';'; });
    (B.globes || []).forEach(function (g) { k += 'G' + g.x + ',' + g.y + ',' + g.max + ',' + (g.grow == null ? 1 : g.grow) + ';'; }); // (and while it swells: 10-01c) // (a Globe of Invulnerability up or down changes where a darkness and a spell's light lie: SRD 5.1, "the area within the barrier is excluded")
    return { k: k, ls: ls };
  }
  L.map = function (B) {
    if (!B || !B.map || !B.dark) return null;
    var kk = sig(B);
    if (B.lightMap && B.lightMap.k === kk.k) return B.lightMap;
    var m = B.map, lv = new Array(m.w * m.h), M = D.magic, carve = !!(M && M.zoneGlobed && (B.globes || []).length);
    for (var i = 0; i < lv.length; i++) lv[i] = 0;
    kk.ls.forEach(function (l) {
      var lx = Math.round(l.x), ly = Math.round(l.y), R = Math.ceil((l.bright + l.dim) / 5);
      for (var y = ly - R; y <= ly + R; y++) for (var x = lx - R; x <= lx + R; x++) {
        var s = m.at(x, y); if (!s || !s.open) continue;
        var d = Math.hypot(x - l.x, y - l.y) * 5, v = l.bright > 0 && d <= l.bright + 0.01 ? 2 : d <= l.bright + l.dim + 0.01 ? 1 : 0; // (a dim-only light -- a hooded lantern, a dim lamp, Dancing Lights -- is dim on its own square too: 09-29)
        if (!v) continue;
        var i2 = y * m.w + x;
        if (lv[i2] >= v) continue;
        // a light a spell laid (Daylight, Dancing Lights, Light, a Continual Flame: `from` and `lv` stamped where it was cast) lies on no square inside a Globe of
        // Invulnerability it was cast from outside of -- SRD 5.1: "the area within the barrier is excluded from the areas affected by such spells" (10-01, Griz: "let's fix it
        // now"; the runner's call on Daylight: it does not light the inside either, by the same sentence). A torch, a lamp, a map's own light has no `from`: lights what it lights
        if (carve && l.from && M.zoneGlobed(B, l, { x: x, y: y })) continue;
        if (!(x === lx && y === ly) && !G.losPoint(lx, ly, x, y)) continue;
        lv[i2] = v;
      }
    });
    // magical darkness: no light lies in it, a torch's or a lamp's (SRD: "nonmagical light can't illuminate it")
    if (M && (B.darks || []).length) for (var y2 = 0; y2 < m.h; y2++) for (var x2 = 0; x2 < m.w; x2++) if (lv[y2 * m.w + x2] && M.darkKindAt(B, x2, y2) === 'darkness') lv[y2 * m.w + x2] = 0;
    B.lightMap = { k: kk.k, lv: lv, w: m.w, lights: kk.ls };
    return B.lightMap;
  };
  L.levelAt = function (B, x, y) {
    if (!B || !B.dark) return 2;
    var lm = L.map(B); if (!lm) return 2;
    var s = B.map.at(x, y); if (!s || !s.open) return 0;
    return lm.lv[y * lm.w + x] || 0;
  };
  L.levelOf = function (B, u) { var best = 0; G.foot(u).forEach(function (p) { best = Math.max(best, L.levelAt(B, p[0], p[1])); }); return best; };
  L.brightAt = function (B, u) { return L.levelOf(B, u) === 2; };
  // bright light the party made reaching a creature (a torch, the Light cantrip, Daylight, a burning blade): what hates light is
  // dazzled by that, never by its own campfire or the place's lamp (a map light is the creature's own ground)
  L.litByParty = function (B, u) {
    var cx = u.x + ((u.size || 1) - 1) / 2, cy = u.y + ((u.size || 1) - 1) / 2;
    var M = D.magic; // (a spell's light, cast from outside a Globe of Invulnerability the creature stands in, does not reach it: SRD 5.1, "the area within the barrier is excluded")
    return L.all(B).some(function (l) { return l.kind !== 'map' && l.bright > 0 && Math.hypot(l.x - cx, l.y - cy) * 5 <= l.bright + 2.5 && G.losPoint(Math.round(l.x), Math.round(l.y), Math.round(cx), Math.round(cy)) && !(l.from && M && M.zoneGlobed && M.zoneGlobed(B, l, { x: Math.round(cx), y: Math.round(cy) })); });
  };
  // does the light l really lie on the square (x, y)? A light a spell laid (Daylight, Dancing Lights, Light, a Continual Flame: `from` and `lv` stamped where it was
  // cast from) lies on no square inside a Globe of Invulnerability it was cast from outside of -- SRD 5.1: "the area within the barrier is excluded from the areas
  // affected by such spells" -- the carve L.map makes, asked of one square for the readers that do not read the map (L.brightNear below; the Daylight a Darkness would
  // burn away: magic.js castDarkness, grimoire.js M.darknessAt). A torch, a lamp, a map's own light has no `from`: it lies where it lies
  L.reaches = function (B, l, x, y) {
    var M = D.magic;
    return !(l.from && M && M.zoneGlobed && B && (B.globes || []).length && M.zoneGlobed(B, l, { x: Math.round(x), y: Math.round(y) }));
  };
  // a bright light within `ft` of a creature (the drow's cue to throw their Darkness: at once, to swallow a Light). One a spell laid counts only while some square it lights
  // bright within that reach is one a Globe of Invulnerability has not carved out of it (10-01, the fog-and-dark runner's find: the whole sphere was counted)
  L.brightNear = function (B, u, ft) {
    if (!B || !B.dark) return false;
    var carve = !!((B.globes || []).length && D.magic && D.magic.zoneGlobed);
    return L.all(B).some(function (l) {
      if (!(l.bright > 0) || Math.max(Math.abs(l.x - u.x), Math.abs(l.y - u.y)) * 5 > ft) return false;
      if (!carve || !l.from) return true;
      var lx = Math.round(l.x), ly = Math.round(l.y), R = Math.ceil(l.bright / 5), n = Math.ceil(ft / 5);
      for (var y = Math.max(ly - R, u.y - n); y <= Math.min(ly + R, u.y + n); y++) for (var x = Math.max(lx - R, u.x - n); x <= Math.min(lx + R, u.x + n); x++) {
        if (Math.hypot(x - l.x, y - l.y) * 5 <= l.bright + 0.01 && Math.max(Math.abs(x - u.x), Math.abs(y - u.y)) * 5 <= ft && L.reaches(B, l, x, y)) return true;
      }
      return false;
    });
  };
  L.name = function (lv) { return lv === 2 ? 'bright light' : lv === 1 ? 'dim light' : 'dark'; };

  // ---------------------------------------------------------------- sight by light (natural light only: magic.js seeWhy asks about magical darkness,
  // fog, invisibility and blindness first). `a` may be a probe { x, y, size, darkvision, blindsight, truesight } (the AI asking
  // "from that square"). Dim light is light enough to see by (SRD: lightly obscured); in the dark only darkvision serves,
  // and only to its reach (what it shows is dim and grey: it is still seen)
  L.seesBy = function (B, a, b) {
    if (!B || !B.dark) return { ok: true };
    if (a.truesight && G.dist(a, b) <= a.truesight) return { ok: true };
    if (a.blindsight && G.dist(a, b) <= a.blindsight) return { ok: true };
    if (a.blind) return { ok: false, why: 'blind' }; // (a grimlock past its blindsight: eyeless)
    if (L.levelOf(B, b) >= 1) return { ok: true };
    var dv = a.darkvision || 0;
    if (dv && G.dist(a, b) <= dv) return { ok: true, dv: true };
    return { ok: false, why: 'dark' };
  };

  // what the party can see, square by square: 2 by light, 1 by darkvision only (grey), 0 not at all (the player still sees)
  L.partyMap = function (B) {
    if (!B || !B.dark) return null;
    var lm = L.map(B), m = B.map;
    // (10-01b: a lit square is seen when one of ours has a line to it -- what the party knows, not every lit square on the map: a torch
    // round a corner no longer lights that room for the player. Griz, of it: "Good catch")
    var all = B.units.filter(function (u) { return u.side === 'party' && G.standing(u) && !u.left && !(u.conds && u.conds.blinded); });
    var eyes = all.filter(function (u) { return u.darkvision || u.blindsight || u.truesight; });
    var k = lm.k + '|' + all.map(function (u) { return u.id + u.x + ',' + u.y + (u.darkvision || 0) + (u.blindsight || 0) + (u.truesight || 0); }).join(';');
    if (B.partyMap && B.partyMap.k === k) return B.partyMap;
    var out = new Array(m.w * m.h);
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
      var i = y * m.w + x, s = m.sq[i];
      if (!s.open) { out[i] = 0; continue; }
      var v = lm.lv[i] && all.some(function (u) { return G.losPoint(u.x, u.y, x, y); }) ? 2 : 0;
      if (!v) for (var e = 0; e < eyes.length; e++) {
        var u = eyes[e], r = Math.max(u.darkvision || 0, u.blindsight || 0, u.truesight || 0);
        if (G.dist(u, { x: x, y: y, size: 1 }) <= r && G.losPoint(u.x, u.y, x, y)) { v = 1; break; }
      }
      out[i] = v;
    }
    B.partyMap = { k: k, v: out, w: m.w };
    return B.partyMap;
  };
  // what ONE of ours sees, square by square, light and all (10-01, Griz: "How about regardless of turn if you mouseover a party
  // member/guest/ally it switches to their vision filter ... it'd be cool if I could mouseover it and as a player see what the vision is like
  // for each party member"): 2 a lit square it has a line to, or within its blindsight or truesight; 1 dark but within its darkvision and
  // in line; 0 neither (behind the rock, past its darkvision, or it is blinded). L.pass draws it in the party's map's place while hovered
  L.viewMap = function (B, u) {
    var lm = L.map(B), m = B.map, bs = Math.max(u.blindsight || 0, u.truesight || 0), blind = !!(u.conds && u.conds.blinded), dv = blind ? 0 : u.darkvision || 0;
    var k = lm.k + '|' + u.id + ':' + u.x + ',' + u.y + '|' + bs + '|' + dv + (blind ? 'b' : '');
    if (B.viewMap && B.viewMap.k === k) return B.viewMap;
    var out = new Array(m.w * m.h);
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
      var i = y * m.w + x, s = m.sq[i], d = G.dist(u, { x: x, y: y, size: 1 });
      if (!s.open) { out[i] = 0; continue; }
      if (d <= bs) { out[i] = 2; continue; }
      out[i] = blind || !G.losPoint(u.x, u.y, x, y) ? 0 : lm.lv[i] ? 2 : d <= dv ? 1 : 0;
    }
    B.viewMap = { k: k, u: u, v: out, w: m.w, bs: bs, dv: dv, blind: blind };
    return B.viewMap;
  };
  L.partySeesSq = function (B, x, y) { var pm = L.partyMap(B); return pm ? (pm.v[y * pm.w + x] || 0) : 2; };
  L.partySees = function (B, u) { var best = 0; G.foot(u).forEach(function (p) { best = Math.max(best, L.partySeesSq(B, p[0], p[1])); }); return best; };

  // ---------------------------------------------------------------- hands (Griz, 09-28: "Aurdin would pretty much have to carry it lest lyman drop
  // shield"): a two-handed weapon takes both hands, a shield one, a torch one; fists none. A versatile weapon is one hand
  // while a torch is held (and hits for its one-handed die: js/rules.js R.twoHanded reads equip.torch)
  L.handsUsed = function (u) {
    var w = u.weapon, props = (w && w.props) || [], two = props.indexOf('two-handed') >= 0, sh = !!(u.src && u.src.equip && u.src.equip.shield);
    return { weapon: w && w.id && w.id !== 'unarmed' ? (two ? 2 : 1) : 0, shield: sh ? 1 : 0, torch: u.torch ? 1 : 0, two: two, sh: sh };
  };
  L.handsFree = function (u) { var h = L.handsUsed(u); return Math.max(0, 2 - h.weapon - h.shield - h.torch); };
  L.handsWhy = function (u) {
    var h = L.handsUsed(u), bits = [];
    if (h.two) bits.push('both hands on the ' + u.weapon.name.toLowerCase()); else if (h.weapon) bits.push('the ' + u.weapon.name.toLowerCase());
    if (h.sh) bits.push('the shield');
    if (h.torch) bits.push('a ' + L.kindName(u.torch) + ' already');
    return 'no free hand: ' + (bits.join(' and ') || 'both hands full');
  };
  // the weapon in hand again (a torch taken up or set down changes a versatile weapon's grip)
  L.regrip = function (u) {
    if (!u.src || !u.src.equip || u.guest) return;
    if (u.torch) u.src.equip.torch = 1; else delete u.src.equip.torch;
    u.weapon = D.save.weaponOf(u.src); u.attacks = u.weapon.loading ? 1 : u.attacksBase;
  };

  // ---------------------------------------------------------------- torches: in the pack (B.inv), in a hand (u.torch), on the floor (B.lights, kind 'torch')
  function packOf(B, id) { return (B.inv || []).filter(function (x) { return x.id === id; })[0]; }
  L.inPack = function (B, id) { var s = packOf(B, id || 'torch'); return s ? s.n : 0; };
  L.torchesInPack = function (B) { return L.inPack(B, 'torch'); };
  // a torch or a lantern burning on that square
  L.torchAt = function (B, x, y) { return (B.lights || []).filter(function (l) { return (l.kind === 'torch' || l.kind === 'lantern') && l.x === x && l.y === y; })[0] || null; };
  // may he light one (`id`: 'torch' or 'lantern')? Under a roost a torch is no (its one law: no fire); a lantern is lit hood down
  L.canLight = function (B, u, id) {
    id = id || 'torch';
    if (u.torch) return { ok: false, why: 'a ' + L.word(u.torch) + ' in hand already' };
    if (!L.inPack(B, id)) return { ok: false, why: 'no ' + L.word(id) + ' in the pack' };
    if (B.fight && B.fight.roost && !L.isLantern(id)) return { ok: false, why: 'the roost overhead: no fire' };
    if (!L.handsFree(u)) return { ok: false, why: L.handsWhy(u) };
    return { ok: true, why: '' };
  };
  // light one: a torch (or a lantern, or the Ledger-Lamp) out of the pack, in the free hand; the light-shy recoil from it (magic.js brighten).
  // A hooded light lit under a roost starts with its hood down: dim 5 ft, and the roof sleeps
  L.lightTorch = function* (B, u, id) {
    id = id || 'torch';
    var s = packOf(B, id), M = D.magic, lantern = L.isLantern(id), hood = lantern && !!(B.fight && B.fight.roost);
    if (!s || s.n <= 0) return;
    s.n--; u.torch = lantern ? L.make(id, hood) : { lit: true }; L.regrip(u);
    var r = L.radii(u.torch), grip = L.handsUsed(u).weapon === 1 && u.weapon.props.indexOf('versatile') >= 0 ? '  {g}(the ' + u.weapon.name.toLowerCase() + ' in one hand){/}' : '';
    D.sfx('fire'); D.fx.sparkle(u, 'fire', 14);
    if (hood) { if (B.lightMap) B.lightMap = null; B.card(['{y}' + u.name + '{/} lights the ' + L.word(u.torch) + ' with the hood down: {o}dim light 5 ft{/}, and nothing overhead stirs.' + grip], 420); yield 30; return; }
    yield* M.brighten(B, u, 'torch', '{y}' + u.name + '{/} strikes a light: ' + (id === 'lantern' ? 'a hooded lantern' : lantern ? 'the ' + L.word(id) : 'a torch') + ', {o}bright ' + r.bright + ' ft{/} and dim ' + r.dim + ' more.' + grip, { x: u.x, y: u.y, bright: r.bright });
  };
  // the hood (a lantern in hand; the turn's free hand on an object): down, dim 5 ft and no bright light; up, its bright light again --
  // the light-shy recoil, the hidden are shown, and under a roost it is the one law broken (battle.js refuses HOOD UP there)
  L.hood = function* (B, u, down) {
    if (!u.torch || L.kindOf(u.torch) !== 'lantern' || !!u.torch.hood === !!down) return;
    u.torch.hood = !!down;
    if (B.lightMap) B.lightMap = null;
    if (down) { B.card(['{y}' + u.name + '{/} lowers the hood: {o}dim light 5 ft{/}, no more.']); return; }
    D.sfx('fire');
    var up = L.radii(u.torch);
    yield* D.magic.brighten(B, u, 'torch', '{y}' + u.name + '{/} raises the hood: {o}bright ' + up.bright + ' ft{/} and dim ' + up.dim + ' more.', { x: u.x, y: u.y, bright: up.bright });
  };
  // a light set down on a square keeps its kind, its hood and its pack id (a lantern is 'lantern', the Ledger-Lamp 'ledgerlamp': the seam
  // -- embed.js -- puts one left burning back in the pack as the fight ends: a lantern is never lost)
  function place(B, x, y, by, t) {
    var n = (B.torchSeq = (B.torchSeq || 0) + 1), r = L.radii(t), lantern = L.kindOf(t) === 'lantern';
    B.lights = (B.lights || []).concat([{ id: 'torch' + n, kind: L.kindOf(t), hood: !!(t && t.hood), item: lantern ? (t.item || 'lantern') : undefined, x: x, y: y, bright: r.bright, dim: r.dim, color: 'gold', flame: true, by: by }]);
  }
  // set down where he stands (the turn's free hand on an object): it keeps burning there
  L.dropTorch = function (B, u, silent) {
    if (!u.torch) return;
    var t = u.torch; delete u.torch; L.regrip(u);
    place(B, u.x, u.y, u.id, t);
    if (!silent) B.card(['{y}' + u.name + '{/} ' + (L.kindOf(t) === 'lantern' ? 'sets the ' + L.word(t) + ' down. It burns where it stands.' : 'drops the torch. It burns where it fell.')]);
  };
  // thrown (an action): it lands on a square within 20 ft it can see and burns there -- the way to light up the far end
  L.throwTorch = function* (B, u, x, y) {
    if (!u.torch || L.kindOf(u.torch) === 'lantern') return; // (a lantern is set down, never thrown)
    u.turn.action = 0; u.facing = B.faceTo(u, { x: x, y: y, size: 1 }); u.anim = 'attack'; u.animT = B.t;
    D.fx.projectile(u, { x: x, y: y, size: 1 }, 'fire'); yield { fx: 1 };
    delete u.torch; L.regrip(u);
    place(B, x, y, u.id);
    D.sfx('fire');
    if (D.magic.burnWebs) D.magic.burnWebs(B, [[x, y]], u.id); // (a torch landing on a web burns it: magic.js)
    yield* D.magic.brighten(B, u, 'torch', '{y}' + u.name + '{/} throws the torch. It lands ' + (Math.max(Math.abs(x - u.x), Math.abs(y - u.y)) * 5) + ' ft off and burns there.', { x: x, y: y, bright: L.TORCH.bright });
    u.anim = 'idle';
  };
  // put it out (free): back in the pack, unspent
  L.douseTorch = function (B, u) {
    if (!u.torch) return;
    var t = u.torch, id = L.kindOf(t) === 'lantern' ? (t.item || 'lantern') : 'torch'; delete u.torch; L.regrip(u); // (the pack's own id: 'ledgerlamp' goes back as itself)
    var s = packOf(B, id); if (s) s.n++; else (B.inv = B.inv || []).push({ id: id, n: 1 });
    B.card(['{y}' + u.name + '{/} puts the ' + L.word(t) + ' out and stows it.']);
  };
  // pick up the one burning at his feet (free, a free hand)
  L.pickUp = function (B, u) {
    var t = L.torchAt(B, u.x, u.y); if (!t || u.torch) return;
    B.lights = B.lights.filter(function (l) { return l !== t; });
    u.torch = t.kind === 'lantern' ? L.make(t.item, t.hood) : { lit: true }; L.regrip(u);
    B.card(['{y}' + u.name + '{/} takes up the ' + L.word(t) + ' again.']);
  };
  // a fall (battle.js hurt): the torch goes down with him and burns on the floor
  L.fell = function (B, u) { if (u.torch) L.dropTorch(B, u, true); };
  // exposed flames doused in an area (Sleet Storm): torches in hand and on the floor
  L.douseIn = function (B, sq) {
    var out = [];
    (B.units || []).forEach(function (u) { if (u.torch && L.kindOf(u.torch) !== 'lantern' && G.inArea(u, sq)) { delete u.torch; L.regrip(u); out.push(u.name + '\'s torch'); } }); // (a lantern's flame is not exposed: it burns on)
    B.lights = (B.lights || []).filter(function (l) { var hit = l.kind === 'torch' && sq.some(function (q) { return q[0] === l.x && q[1] === l.y; }); if (hit) out.push('a torch on the floor'); return !hit; });
    return out;
  };

  // ---------------------------------------------------------------- the look: the campfire's pass (js/campfire.js) over the fight's world canvas,
  // called from ui.js drawBattle while iso.inWorld: a night ambient multiplied over everything, each light's pool added in
  // (a flame breathes), then the floor greyed where no one of the party sees (darkvision's reach: grey, no darker; past it:
  // grey and dim). The player sees the whole grid, the characters do not (RULED 09-28)
  var lit = null;
  function flick(t) { return Math.sin(t * 0.21) * 0.5 + Math.sin(t * 0.53 + 1.3) * 0.3 + Math.sin(t * 1.7) * 0.2; }
  L.pass = function (ctx, B, W, H) {
    if (!B || !B.dark || !B.map) return;
    var iso = D.iso, t = B.t, m = B.map;
    if (!lit) lit = document.createElement('canvas');
    if (lit.width !== W || lit.height !== H) { lit.width = W; lit.height = H; }
    var l = lit.getContext('2d');
    l.globalCompositeOperation = 'source-over';
    l.fillStyle = 'rgb(52,56,86)'; l.fillRect(0, 0, W, H);   // the night: blue-black, not black -- the player sees
    l.globalCompositeOperation = 'lighter';
    var lights = L.all(B);
    lights.forEach(function (lg) {
      var gx = Math.round(lg.x), gy = Math.round(lg.y), c = iso.center(lg.x, lg.y, m.gz(gx, gy)), s = iso.toScreen(c.x, c.y);
      var f = lg.flame ? flick(t + gx * 7 + gy * 3) : 0, hw = iso.TW / 2;
      var rb = (lg.bright / 5) * hw * (1 + f * 0.05), rd = ((lg.bright + lg.dim) / 5) * hw * (1 + f * 0.03);
      if (rd <= 0) return;
      var col = COL[lg.color] || COL.gold;
      l.save(); l.translate(s.x, s.y - 4); l.scale(1, 0.5);
      var g = l.createRadialGradient(0, 0, 1, 0, 0, rd);
      g.addColorStop(0, 'rgba(' + col + ',' + (lg.bright ? 1 : 0.5) + ')');
      if (lg.bright) g.addColorStop(Math.min(0.97, rb / rd), 'rgba(' + col + ',0.7)');
      g.addColorStop(1, 'rgba(' + col + ',0)');
      l.fillStyle = g; l.fillRect(-rd, -rd, rd * 2, rd * 2);
      l.restore();
    });
    ctx.save();
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(lit, 0, 0);
    // whose eyes: the party's together, or one of ours (L.viewMap), what it can't see darker. One of ours is the one under the mouse (ui.js
    // sets B.viewAs), or, on a hero's own turn with no light anywhere (RULED 09-30, Griz: "when map = no light source and player turn, active
    // player vision filter on dark map (i.e. bat familiar sonar sight filter unless light on map)"), the hero whose turn it is -- the same
    // view either way (10-01b, Griz: "the hover should be the same. when you mouseover someone in your party you should see things how they
    // do on their turn. the too much on her turn is still an active fix though")
    // 10-01b, the bond (Griz: "make sure that in lit rooms ... the party is still getting the dark vision of characters outside the range
    // of the light... (the characters telepathic bond resulting from being played by a single human)" -- then, of the three ways, "yes 3"):
    // every turn draws what the party sees together, lit or not -- the 09-30 own-eyes filter in a room with no light is gone -- and the one
    // whose turn it is keeps its own senses on top (the sonar, the tongue); the mouse on one of ours still shows the dark by that one's eyes
    var a = B.active, own = a && a.side === 'party' && !a.guest && G.standing(a) ? a : null;
    var va = B.viewAs && G.standing(B.viewAs) ? B.viewAs : null, pm = va ? L.viewMap(B, va) : L.partyMap(B);
    B.eyes = va; // (whose eyes these are: ui.js names them over the tooltip)
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#7c7c84';
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) { var s2 = m.sq[y * m.w + x]; if (!s2.open || pm.v[y * m.w + x] === 2) continue; iso.rhombus(ctx, x, y, s2.gz, 0); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = va ? 'rgba(4,4,12,0.62)' : 'rgba(6,6,16,0.4)';
    for (var y2 = 0; y2 < m.h; y2++) for (var x2 = 0; x2 < m.w; x2++) { var s3 = m.sq[y2 * m.w + x2]; if (!s3.open || pm.v[y2 * m.w + x2]) continue; iso.rhombus(ctx, x2, y2, s3.gz, 0); ctx.fill(); }
    var sn = va || own; // (whose senses ride on top: the hovered one's, else the one whose turn it is)
    if (sn) { if (sn.sense === 'tongue') tongue(ctx, B, sn, t, sn.blindsight || 0); else sonar(ctx, B, sn, t); if (sn.senseHidden) tongue(ctx, B, sn, t, sn.senseHidden); }
    ctx.restore();
  };
  // the tongue (10-01b, Griz: "Talk to me about the snake vs other familiars. Are we giving it's tongue-smell nearby detection like the bats?
  // maybe similar to the sonar with orange highlight of the tiles only on the side/corners pointing at the snake"): the snake familiar's
  // blindsight (SRD 5.1's poisonous snake: 10 ft) is its tongue -- each creature within it has the side of its square that faces the snake
  // lit orange, or the corner where it stands on the diagonal, flicking: two quick flicks and a rest. Through its caster's eyes it flicks
  // on every creature within the 15 ft the snake lends him (its perk, RULED 09-30: the hidden and the unseen too -- js/familiar.js), as
  // the bat's sonar runs through its wizard's (10-01b, Griz, in his snake wizard's turn: "the snake highlight is only hitting one of the
  // goblins i would expect it to" -- it had been the hidden alone)
  // (10-01b, seeing it: "too flashy, like a wave of water hitting that edge of the square" -- no glow under it, dimmer; then "I'm seeing
  // flashing on and off 3 times - can we get starts 33% (middle third) full, then 66% full from the middle, then that whole side with a
  // slight dimming rather than off between flashes?"): three steps, each lit and then dimmed a little, the mark growing from the middle
  // of the side -- a third, two thirds, all of it -- then a fade, and a rest
  var FLICK = { beat: 100, step: 12, lit: 9, dim: 0.6, fade: 14, peak: 0.6 }; // (frames: the beat, a step, lit in a step; a step's dim; the fade after the third; the brightest)
  function tongue(ctx, B, u, t, reach) {
    if (!reach) return;
    var ph = (t + (u.id || '').length * 11) % FLICK.beat, s3 = FLICK.step * 3, stage, k;
    if (ph < s3) { stage = Math.floor(ph / FLICK.step); k = ph % FLICK.step < FLICK.lit ? 1 : FLICK.dim; }
    else if (ph < s3 + FLICK.fade) { stage = 2; k = FLICK.dim * (1 - (ph - s3) / FLICK.fade); }
    else return;
    var hl = 0.5 * (stage + 1) / 3; // (the mark's half-length along the side, in squares: a third, two thirds, the whole)
    var m = B.map, iso = D.iso, o = ((u.size || 1) - 1) / 2, cx = u.x + o, cy = u.y + o;
    B.units.forEach(function (w) {
      if (w === u || w.left || w.unseen || w.riding || !G.standing(w) || G.dist(u, w) > reach) return;
      var foot = G.foot(w), near = Math.min.apply(null, foot.map(function (q) { return Math.max(Math.abs(cx - q[0]), Math.abs(cy - q[1])); }));
      foot.forEach(function (q) {
        var s = m.sq[q[1] * m.w + q[0]], dx = cx - q[0], dy = cy - q[1], ax = Math.abs(dx), ay = Math.abs(dy), sx = Math.sign(dx), sy = Math.sign(dy), seg = [];
        if (!s || (!ax && !ay) || Math.max(ax, ay) > near + 0.01) return; // (the squares of it nearest the snake; none under the snake itself)
        if (ax > ay + 0.01) seg.push([sx * 0.5, -hl, sx * 0.5, hl]); // the side toward it, from its middle out
        else if (ay > ax + 0.01) seg.push([-hl, sy * 0.5, hl, sy * 0.5]);
        else seg.push([sx * 0.5, sy * 0.5, sx * 0.5, sy * (0.5 - 2 * hl)], [sx * 0.5, sy * 0.5, sx * (0.5 - 2 * hl), sy * 0.5]); // the corner toward it, its two arms growing from the corner
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,170,80,' + (FLICK.peak * k).toFixed(2) + ')';
        seg.forEach(function (g) {
          var p = iso.center(q[0] + g[0], q[1] + g[1], s.gz), p2 = iso.center(q[0] + g[2], q[1] + g[3], s.gz), a = iso.toScreen(p.x, p.y), b = iso.toScreen(p2.x, p2.y);
          ctx.beginPath(); ctx.moveTo(a.x + 0.5, a.y + 0.5); ctx.lineTo(b.x + 0.5, b.y + 0.5); ctx.stroke();
        });
      });
    });
  }
  // the sonar (Griz, 09-30: "if we wanna try something fancy with the sonar like that, it'd have to be only on the npcs and party around her -
  // or glimmers on the tiles their on if that's too much"; 10-01b, seeing the glimmers: "can we keep the highlight in the sonar pulse fashion
  // that previously existed, it was cool, just too much ... rather than whole-square highlights we could shift to highlight lines that run
  // the tile away from the active vision character"): the 09-30 ping runs out from the one whose eyes these are -- its front a square about
  // it, as the grid counts distance -- and is drawn only where it crosses a creature its blindsight finds: a bright line running across that
  // creature's squares, away from the one sensing, a fainter echo behind it. No tint, no ring over the bare floor
  var PING = { perTile: 7, rest: 18, echo: 0.3 }; // (frames to cross a square; a rest between pings; the echo's lag, in squares)
  function sonar(ctx, B, u, t) {
    var bs = u.blindsight || 0, m = B.map, iso = D.iso;
    if (!bs) return;
    var o = ((u.size || 1) - 1) / 2, cx = u.x + o, cy = u.y + o, reach = bs / 5 + 0.5;
    var beat = Math.ceil(reach * PING.perTile) + PING.rest, front = o + 0.5 + (t % beat) / PING.perTile; // (the front's distance from her middle, in squares: out from her own edge)
    // where the front -- max(|du|, |dv|) = R about her middle -- crosses the square dx, dy from her middle: one segment, or an L at a corner
    function cross(R, dx, dy) {
      var out = [];
      [-1, 1].forEach(function (sg) {
        var U = sg * R, a = Math.max(dy - 0.5, -R), b = Math.min(dy + 0.5, R);
        if (U >= dx - 0.5 && U <= dx + 0.5 && a < b) out.push([U, a, U, b]);
        var V = sg * R, a2 = Math.max(dx - 0.5, -R), b2 = Math.min(dx + 0.5, R);
        if (V >= dy - 0.5 && V <= dy + 0.5 && a2 < b2) out.push([a2, V, b2, V]);
      });
      return out;
    }
    ctx.lineWidth = 1;
    B.units.forEach(function (w) {
      if (w === u || w.left || w.unseen || w.riding || !G.standing(w) || G.dist(u, w) > bs) return;
      G.foot(w).forEach(function (q) {
        var s = m.sq[q[1] * m.w + q[0]]; if (!s) return;
        [0, PING.echo].forEach(function (lag) {
          var R = front - lag, fade = Math.max(0, 1 - (R - o) / (reach + 1)) * (lag ? 0.4 : 0.9);
          cross(R, q[0] - cx, q[1] - cy).forEach(function (sg) {
            var p = iso.center(cx + sg[0], cy + sg[1], s.gz), p2 = iso.center(cx + sg[2], cy + sg[3], s.gz), a = iso.toScreen(p.x, p.y), b = iso.toScreen(p2.x, p2.y);
            ctx.strokeStyle = 'rgba(160,232,255,' + fade.toFixed(2) + ')'; ctx.beginPath(); ctx.moveTo(a.x + 0.5, a.y + 0.5); ctx.lineTo(b.x + 0.5, b.y + 0.5); ctx.stroke();
          });
        });
      });
    });
  }
  // the lights that stand on the floor, drawn in the sort: a dropped torch, Dancing Lights, a Daylight set at a point
  L.props = function (B) {
    // (a Dancing Lights orb on a square inside a Globe of Invulnerability its spell was cast from outside of is not drawn: the light there is carved out of it, L.map, and the square is
    // no part of the spell -- SRD 5.1, "the area within the barrier is excluded". 10-01, the fog-and-dark runner's find: the orbs were still drawn inside)
    return (B.lights || []).filter(function (l) { return (l.kind === 'torch' || l.kind === 'lantern' || l.kind === 'dance' || l.kind === 'daylight') && !(l.kind === 'dance' && !L.reaches(B, l, l.x, l.y)); }).map(function (l) {
      return { depth: l.x + l.y + 0.4, gz: B.map.gz(l.x, l.y), layer: 1, draw: function (ctx) {
        var c = D.iso.center(l.x, l.y, B.map.gz(l.x, l.y)), s = D.iso.toScreen(c.x, c.y), P = D.PAL.ramps;
        if (l.kind === 'torch') {
          ctx.fillStyle = P.leather[2]; ctx.fillRect(s.x - 5, s.y - 3, 10, 2); ctx.fillStyle = P.leather[3]; ctx.fillRect(s.x - 5, s.y - 4, 10, 1);
          if (D.campfire) D.campfire.flames(ctx, s.x + 5, s.y - 4, B.t + l.x * 9, 0.5);
        } else if (l.kind === 'lantern') {
          // a hooded lantern set down: a dark cage on a plate, a ring on top, the glass lit; hood down, a slit of light at the foot
          var fl = 0.6 + 0.4 * Math.sin(B.t / 5 + l.x);
          ctx.fillStyle = P.outline[0]; ctx.fillRect(s.x - 3, s.y - 3, 6, 2); ctx.fillRect(s.x - 2, s.y - 11, 4, 1); ctx.fillRect(s.x - 3, s.y - 10, 1, 7); ctx.fillRect(s.x + 2, s.y - 10, 1, 7);
          ctx.fillStyle = P.gold[2]; ctx.fillRect(s.x - 1, s.y - 13, 2, 1); ctx.fillRect(s.x - 2, s.y - 12, 1, 1); ctx.fillRect(s.x + 1, s.y - 12, 1, 1);
          if (l.hood) { ctx.fillStyle = P.leather[1]; ctx.fillRect(s.x - 2, s.y - 10, 4, 7); ctx.globalAlpha = 0.5 + 0.3 * fl; ctx.fillStyle = P.gold[4]; ctx.fillRect(s.x - 2, s.y - 4, 4, 1); ctx.globalAlpha = 1; }
          else { ctx.globalAlpha = 0.85; ctx.fillStyle = P.gold[3]; ctx.fillRect(s.x - 2, s.y - 10, 4, 7); ctx.globalAlpha = 1; ctx.fillStyle = P.fire[1]; ctx.fillRect(s.x - 1, s.y - 8 + (fl > 0.8 ? -1 : 0), 2, 3); ctx.fillStyle = P.bone[2]; ctx.fillRect(s.x - 1, s.y - 6, 2, 1); }
        } else if (l.kind === 'dance') {
          // (the spell animation pass, 09-28h: the drow's lights were lackluster) a flickering will-o'-light, sparks turning about it
          var k = 2.4 + Math.sin(B.t / 8 + l.x * 2) * 0.6 + ((B.t + l.x * 5) % 13 < 2 ? 0.8 : 0), yy = s.y - 22 + Math.sin(B.t / 11 + l.y * 3) * 3, xx = s.x + Math.sin(B.t / 17 + l.x) * 2;
          ctx.globalAlpha = 0.18; ctx.fillStyle = P.glow[1]; ctx.beginPath(); ctx.ellipse(s.x, s.y, 10, 4, 0, 0, 7); ctx.fill();
          ctx.globalAlpha = 0.3; ctx.fillStyle = P.glow[1]; ctx.beginPath(); ctx.ellipse(xx, yy, k * 3.4, k * 3.4, 0, 0, 7); ctx.fill();
          ctx.globalAlpha = 0.95; ctx.fillStyle = P.glow[2]; ctx.beginPath(); ctx.ellipse(xx, yy, k, k, 0, 0, 7); ctx.fill();
          ctx.fillStyle = P.bone[2]; ctx.fillRect(Math.round(xx - 1), Math.round(yy - 1), 2, 2);
          for (var sp = 0; sp < 3; sp++) { var sa = B.t / 9 + sp * 2.09 + l.y; ctx.globalAlpha = 0.8; ctx.fillStyle = sp ? P.glow[2] : P.bone[2]; ctx.fillRect(Math.round(xx + Math.cos(sa) * 7), Math.round(yy + Math.sin(sa) * 3), sp ? 1 : 2, sp ? 1 : 2); }
          ctx.globalAlpha = 1;
        } else if (l.kind === 'daylight') {
          ctx.globalAlpha = 0.8 + 0.2 * Math.sin(B.t / 9); ctx.fillStyle = P.bone[2]; ctx.beginPath(); ctx.ellipse(s.x, s.y - 16, 4, 4, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        }
      } };
    });
  };
})();
