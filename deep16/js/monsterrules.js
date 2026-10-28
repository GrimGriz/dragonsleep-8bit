/* DEEP16 -- the monsters' grid rules (2026-10-28, the grid's rules seat, started by the lanes desk on Griz's "Start the seat"): the special moves
   of the SRD 5.1 foes the cutters put on the grid with stand-ins (handoff-2026-10-05-the-bestiary-after-the-bugs.md §36, its leans (2) to (5),
   and his answers of 10-28 -- on the rust monster "is that what the SRD has?", on the aboleth "until that exists?", on the harpy "so we need grid
   stuff for these monsters is the point?"). Each by its block in srd/monsters/:
     the rust monster (r.md) -- Antennae, its own action; Rust Metal, a trait; Iron Scent. Its rust is the fight's, what it rusts through gone -- the ooze's way (RULED 10-28);
     the aboleth (a.md) -- Enslave (3/day), Dominate Person's machinery (js/grimoire.js, 10-06) without the concentration, so its Psychic Drain
       (js/traits.js TR.legendary) finds the one it has charmed;
     the harpy (h.md) -- the Luring Song: charmed, incapacitated, walking to her by the most direct route, the saves the block names;
     the ankheg (a.md) -- its bite holds a Large or smaller one, and bites only that one, with advantage; its AC 11 while prone.
   Benched by dev/bench16.js mode=monsters1028 (in both lists of dev/check.py). Loaded after js/pocketdm.js: it wraps the Battle. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx, M = D.magic, AI = D.ai, BP = D.Battle.prototype;
  var MR = D.monsterRules = {};
  function R() { return window.DS.R; }
  function nm(u, cap) { return D.Battle.nm(u, cap); }
  function byId(B, id) { return B.units.filter(function (w) { return w.id === id; })[0] || null; }
  function rowOr(u, row, alt) { return u.sheet && D.spr.anim(u.sheet, row) ? row : alt; }
  function up(w) { return !!w && !w.dead && w.hp > 0; }
  D.traits.FIELDS.push('rustMetal', 'ironScent', 'antennae', 'enslave', 'luringSong', 'proneAC'); // (copied sheet to unit: battle.js makeFoe)

  // ================================================================== THE RUST MONSTER (SRD 5.1, srd/monsters/r.md)
  // Its rust is the fight's (RULED 10-28, Griz, on the seat's lean that the SRD's "permanent" be kept on the sheet: "yeah, we're leaving out wear, but
  // should probably also let rust destroy stuff during the fight the way we did the ooze?", then "negative. It's not 'then' is 'else' - if the rustmonster
  // kills it during the fight it stays dead, if it doesn't successfully finish destroying during the fight, there's no permanent damage"): the -1s hold for the rest of the fight -- kept on the
  // battle, B.rusts, by the sheet they are on and the item, so every reading in the fight takes them off (D.save.weaponOf, R.offhandDamage, R.ac: a
  // weapon swapped away and taken up again is as rusted as it was) and the next fight never sees them; a thing rusted through at the SRD's numbers --
  // a weapon at -5, armour at AC 10, a shield at +0 -- is gone off the sheet, as the gray ooze's eaten-through is (js/traits.js: `src.equip` emptied).
  // A foe's is on the unit. Magic never rusts.
  MR.WEAPON_GONE = 5;
  function rustMap(h, make) {
    var B = D.battle; if (!B || !h) return null;
    var e = (B.rusts || []).filter(function (x) { return x.h === h; })[0];
    if (!e && make) { e = { h: h, r: {} }; B.rusts = (B.rusts || []).concat([e]); }
    return e ? e.r : null;
  }
  function rustOf(h, id) { var r = rustMap(h); return (r && id && r[id]) || 0; }
  function addRust(h, id) { var r = rustMap(h, true); r[id] = (r[id] || 0) + 1; return r[id]; }
  function dropRust(h, id) { var r = rustMap(h); if (r) delete r[id]; }
  MR.rustOf = rustOf;
  // how much rust an item takes before it is destroyed: a weapon 5; armour down to AC 10 (chain mail's 16, six); a shield down to +0 (two)
  MR.rustLimit = function (it) { if (!it) return Infinity; if (it.kind === 'weapon' || it.weapon) return MR.WEAPON_GONE; if (it.armor) return Math.max(1, it.armor.base - 10); if (it.shield) return it.shield.ac; return Infinity; };
  function limOf(id) { return MR.rustLimit(id && R().item(id)); }
  // metal, by the weapon's name (js/grimoire.js M.metalWeapon's reading: not a club, staff, fist, sling, dart, bow, whip or net)
  var NOT_METAL = /club|staff|unarmed|fist|sling|dart|bow|whip|net\b|bite|claw|tentacle|slam|tail|horn|tusk|gore|beak|sting|hoof|talon|fang|touch/i;
  function metalName(a) { var s = (a && (a.id || a.name)) || ''; return !!s && (!NOT_METAL.test(s) || /crossbow/i.test(a.id || '')) && !/crossbow/i.test(a.name || '') && !(a.ranged && /bow/i.test(s)); }
  // a held shield: the grid's plain Shield is read as steel (the SRD's is "made from wood or metal") -- a druid's is wood (SRD 5.1, and js/rules.js R.canEquip)
  function metalShield(h, it) { return !!(it && it.shield && !it.magic && !it.shield.bonus && !it.shield.doorward && (it.shield.ac || 0) <= 2 && h.cls !== 'druid'); }

  // the deep16 page's own readings of the sheet (js/rules.js is the first game's, untouched): the rust taken off
  var ac0 = R().ac;
  R().ac = function (h) {
    var ac = ac0.apply(this, arguments), e = (h && h.equip) || {};
    if (!h || !rustMap(h)) return ac;
    return ac - Math.min(rustOf(h, e.armor), limOf(e.armor)) - Math.min(rustOf(h, e.shield), limOf(e.shield));
  };
  var od0 = R().offhandDamage;
  if (od0) R().offhandDamage = function (h, it) { var d = od0.apply(this, arguments), id = h && h.equip && h.equip.offhand, n = id && R().item(id) === it ? rustOf(h, id) : 0; if (n && d && !(it.weapon && (it.weapon.bonus || it.weapon.magic))) d = Object.assign({}, d, { mod: (d.mod || 0) - n }); return d; };
  var wo0 = D.save.weaponOf;
  D.save.weaponOf = function (h) { var w = wo0.apply(this, arguments), n = rustOf(h, w.id); if (n && !w.magic) { w.mod = (w.mod || 0) - n; w.rusted = n; } return w; };

  // what of a creature's the antennae could touch -- nonmagical ferrous metal worn or held: the weapon in its hand, its armour, its shield -- in the
  // order the AI reaches for them (RULED 10-28, Griz, to the desk's "Should the rust monster go for the weapon swinging at it first?": "Weapon first")
  var REACH_ORDER = { weapon: 0, armor: 1, shield: 2 };
  function ferrous(w, any) {
    var out = [], h = w.src && w.src.equip ? w.src : null, Rr = R();
    if (h) {
      var a = Rr.item(h.equip.armor), s = Rr.item(h.equip.shield), o = h.equip.offhand && Rr.item(h.equip.offhand);
      if (a && a.armor && M.metalArmor(w) && (any || !M.magicArmor(w))) out.push({ slot: 'armor', id: h.equip.armor, it: a });
      if (s && (any ? s.shield && h.cls !== 'druid' : metalShield(h, s))) out.push({ slot: 'shield', id: h.equip.shield, it: s });
      if (w.weapon && w.weapon.id && (any || !w.weapon.magic) && metalName(w.weapon)) out.push({ slot: 'weapon', id: w.weapon.id, it: Rr.item(w.weapon.id) });
      if (any && w.sheathed && metalName(w.sheathed)) out.push({ slot: 'sheathed' });
      if (any && o && o.weapon && metalName({ id: h.equip.offhand, name: o.name })) out.push({ slot: 'offhand' });
    } else {
      if (w.metalArmor && (any || !w.armorMagic)) out.push({ slot: 'armor', foe: true });
      if (w.shield && !w.shieldGone) out.push({ slot: 'shield', foe: true });
      var k = Object.keys(w.attacks || {}).filter(function (k) { var x = w.attacks[k]; return (any || !x.magic) && !x.ranged && metalName(x); })[0];
      if (k) out.push({ slot: 'weapon', key: k, foe: true });
    }
    return out.sort(function (a, b) { return (REACH_ORDER[a.slot] != null ? REACH_ORDER[a.slot] : 9) - (REACH_ORDER[b.slot] != null ? REACH_ORDER[b.slot] : 9); });
  }
  MR.ferrous = ferrous;
  MR.carriesFerrous = function (w) { return ferrous(w, true).length > 0; };

  // a weapon rusts (Rust Metal, and the Antennae on a held one): -1 to its damage for the fight; at -5 it is destroyed
  function* rustWeapon(B, w, atk, how) {
    var h = w.src && w.src.equip ? w.src : null, off = !!(atk && atk.offhandSwing), id = h && (off ? h.equip.offhand : atk && atk.id);
    if (h && id && (off || h.equip.weapon === id)) {
      var n = addRust(h, id), wn = (R().item(id) || {}).name || 'weapon';
      if (n >= MR.WEAPON_GONE) {
        dropRust(h, id); (w.rustGone = w.rustGone || []).push(id); // (gone for good: the Pocket DM's seat too, MR.seatGone below)
        if (off) { h.equip.offhand = null; w.offhand = null; } else { h.equip.weapon = null; w.weapon = D.save.weaponOf(h); }
        B.card(['{o}' + nm(w, true) + '\'s ' + wn.toLowerCase() + ' rusts through and crumbles.{/}  {g}(gone' + (off ? '' : ': ' + w.weapon.name.toLowerCase() + ' now') + '){/}'], 300);
      } else {
        if (off) { if (w.offhand) w.offhand = Object.assign({}, w.offhand, { mod: (w.offhand.mod || 0) - 1, rusted: n }); }
        else w.weapon = Object.assign({}, w.weapon, { mod: (w.weapon.mod || 0) - 1, rusted: n });
        B.card(['{o}' + nm(w, true) + '\'s ' + wn.toLowerCase() + ' ' + (how || 'rusts at the touch') + ': -' + n + ' to its damage.{/}  {g}(for the fight; it crumbles at -' + MR.WEAPON_GONE + '){/}'], 260);
      }
      return true;
    }
    // one of the foes' (or a guest's with no kit): its attack is the weapon, kept on the unit for the fight
    var key = Object.keys(w.attacks || {}).filter(function (k) { return w.attacks[k] === atk || (atk && w.attacks[k].name === atk.name); })[0];
    if (!key) return false;
    var a0 = w.attacks[key], n2 = (a0.rusted || 0) + 1;
    if (n2 >= MR.WEAPON_GONE) {
      w.attacks[key] = { name: 'Unarmed Strike', atk: a0.atk, dice: '1', mod: D.mod((w.abil || {}).str || 10), type: 'bludgeoning', reach: 5 };
      if (w.weapon === a0) w.weapon = w.attacks[key];
      B.card(['{o}' + nm(w, true) + '\'s ' + a0.name.toLowerCase() + ' rusts through and crumbles.{/}  {g}(gone){/}'], 300);
    } else {
      w.attacks[key] = Object.assign({}, a0, { mod: (a0.mod || 0) - 1, rusted: n2 }); if (w.weapon === a0) w.weapon = w.attacks[key];
      B.card(['{o}' + nm(w, true) + '\'s ' + a0.name.toLowerCase() + ' ' + (how || 'rusts at the touch') + ': -' + n2 + ' to its damage.{/}  {g}(it crumbles at -' + MR.WEAPON_GONE + '){/}'], 260);
    }
    return true;
  }

  // Rust Metal: "Any nonmagical weapon made of metal that hits the rust monster corrodes. After dealing damage, the weapon takes a permanent and
  // cumulative -1 penalty to damage rolls ... Nonmagical ammunition made of metal that hits the rust monster is destroyed after dealing damage."
  // (an arrow or a bolt is metal-headed here; the grid spends one a shot already -- battle.js spendAmmo -- so the card is all it changes)
  var owh = M.onWeaponHit;
  M.onWeaponHit = function* (B, att, tgt, atk, crit) {
    if (owh) yield* owh.apply(this, arguments);
    if (tgt.antennae && att && atk && !atk.spell) tgt.lastHitBy = att.id; // (the weapon swinging at it: its antennae go there first -- rustTurn)
    if (!tgt.rustMetal || !atk || atk.magic || atk.spell || att.dead) return;
    if (atk.ammo || (atk.ranged && /bow/i.test(atk.id || atk.name || ''))) { B.card(['{g}The ' + (/cross/i.test(atk.id || atk.name || '') ? 'bolt' : 'arrow') + ' rusts to nothing in the wound.{/}'], 160); return; }
    if (!metalName(atk) || atk.name === 'Unarmed Strike') return;
    yield* rustWeapon(B, att, atk);
  };

  // armour or a shield touched: -1 to the AC it offers, for the fight; armour at AC 10 and a shield at +0 destroyed
  function corrode(B, w, o) {
    var h = w.src && w.src.equip ? w.src : null;
    if (o.slot === 'weapon') return null; // (rustWeapon)
    if (h && o.id) {
      var n = addRust(h, o.id), lim = MR.rustLimit(o.it), name = (o.it.name || o.slot).toLowerCase();
      if (n >= lim) {
        dropRust(h, o.id); h.equip[o.slot] = null; (w.rustGone = w.rustGone || []).push(o.id);
        w.baseAC = R().ac(h); if (o.slot === 'armor') { w.armored = R().armored(h); if (w.conds.mageArmor) w.baseAC = Math.max(w.baseAC, 13 + D.mod(w.abil.dex)); }
        B.card(['{o}' + nm(w, true) + '\'s ' + name + ' rusts away and falls from ' + (w.side === 'foe' ? 'it' : 'them') + ' in flakes: AC ' + RU.ac(w) + '.{/}  {g}(gone){/}'], 300);
      } else {
        w.baseAC -= 1;
        B.card(['{o}' + nm(w, true) + '\'s ' + name + ' rusts where the antennae touch it: AC ' + RU.ac(w) + '.{/}  {g}(-' + n + ' for the fight; ' + (o.slot === 'armor' ? 'destroyed at AC 10' : 'destroyed at +0') + '){/}'], 260);
      }
      return true;
    }
    var bare = 10 + D.mod((w.abil || {}).dex || 10);
    if (o.slot === 'armor') {
      var sh = w.shield && !w.shieldGone ? 2 - (w.rustShield || 0) : 0;
      w.rustAC = (w.rustAC || 0) + 1; w.baseAC -= 1;
      if (w.baseAC - sh <= Math.max(10, bare)) { w.metalArmor = false; w.armored = false; w.baseAC = bare + sh; B.card(['{o}' + nm(w, true) + '\'s armour rusts away in flakes: AC ' + RU.ac(w) + '.{/}  {g}(gone){/}'], 300); }
      else B.card(['{o}' + nm(w, true) + '\'s armour rusts where the antennae touch it: AC ' + RU.ac(w) + '.{/}'], 260);
    } else if (o.slot === 'shield') {
      w.rustShield = (w.rustShield || 0) + 1; w.baseAC -= 1;
      if (w.rustShield >= 2) { w.shieldGone = true; B.card(['{o}' + nm(w, true) + '\'s shield rusts away: AC ' + RU.ac(w) + '.{/}  {g}(gone){/}'], 300); }
      else B.card(['{o}' + nm(w, true) + '\'s shield rusts where the antennae touch it: AC ' + RU.ac(w) + '.{/}'], 260);
    }
    return true;
  }

  // Antennae (an action): "corrodes a nonmagical ferrous metal object it can see within 5 feet of it ... If the object is being worn or carried by a
  // creature, the creature can make a DC 11 Dexterity saving throw to avoid the rust monster's touch." (An object no one holds -- the 1-foot cube --
  // the grid has none to touch.)
  MR.antennaeTargets = function (B, u) {
    return B.units.filter(function (w) { return w !== u && G.hostile(u, w) && G.standing(w) && !w.object && G.dist(u, w) <= ((u.antennae && u.antennae.reach) || 5) && M.sees(B, u, w) && ferrous(w).length; });
  };
  MR.antennae = function* (B, u, t, o) {
    o = o || ferrous(t)[0]; if (!o) return false;
    var dc = (u.antennae && u.antennae.dc) || 11, what = o.slot === 'weapon' ? (o.foe ? t.attacks[o.key].name : (o.it && o.it.name) || 'weapon') : o.foe ? o.slot === 'armor' ? 'armour' : 'shield' : (o.it.name || o.slot);
    if (u.turn) u.turn.action = 0;
    u.facing = B.faceTo(u, t); u.anim = rowOr(u, 'antennae', 'attack'); u.animT = B.t; D.sfx('swing');
    yield 14;
    var sv = RU.save(t, 'dex', dc);
    B.card(['{r}' + nm(u, true) + '{/} reaches its antennae for ' + nm(t) + '\'s ' + what.toLowerCase() + ': DEX ' + RU.saveText(sv) + ' vs DC ' + dc + '  ' + (sv.ok ? '{n}twists away{/}' : '{o}TOUCHED{/}')], 240);
    yield 18;
    if (!sv.ok) { FX.sparkle(t, 'bone', 14); D.sfx('poison'); if (o.slot === 'weapon') yield* rustWeapon(B, t, o.foe ? t.attacks[o.key] : t.weapon, 'rusts where the antennae touch it'); else corrode(B, t, o); }
    u.anim = 'idle';
    yield 16;
    return true;
  };
  // its turn ("Weapon first", RULED 10-28): the antennae at the metal weapon of the one that last hit it, when that one is in reach; else at the nearest
  // metal in reach -- on that one its weapon, then its armour, then its shield (ferrous's order); else to metal its move reaches, the one that last hit it
  // first, then the nearest, and the antennae there; else (no metal near) the bite, the brute's way
  function* rustTurn(B, u) {
    if (!RU.canAct(u) || !u.turn || !u.turn.action) return false;
    var last = u.lastHitBy ? byId(B, u.lastHitBy) : null;
    if (last && !ferrous(last).some(function (o) { return o.slot === 'weapon'; })) last = null; // (its weapon is the point: one that hit it bare-handed is no one first)
    var pickOf = function (ws) { return last && ws.indexOf(last) >= 0 ? last : ws.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0] || null; };
    var t = pickOf(MR.antennaeTargets(B, u));
    if (!t && u.turn.move > 0 && !u.conds.restrained && !u.conds.grappled) {
      var rm = G.reach(u, u.turn.move), go = null, rch = (u.antennae && u.antennae.reach) || 5;
      var cands = B.units.filter(function (w) { return w !== u && G.hostile(u, w) && G.standing(w) && !w.object && M.sees(B, u, w) && ferrous(w).length; })
        .sort(function (a, b) { return (b === last) - (a === last) || G.dist(u, a) - G.dist(u, b); });
      for (var ci = 0; ci < cands.length && !go; ci++) { var e = AI.approach(u, cands[ci], rm, rch); if (e && G.dist(u, cands[ci], e.x, e.y) <= rch) go = e; }
      if (go) { yield* AI.walkTo(B, u, go); if (!up(u) || !RU.canAct(u)) return true; t = pickOf(MR.antennaeTargets(B, u)); }
    }
    if (!t) return false;
    yield* MR.antennae(B, u, t);
    return true;
  }

  // ================================================================== THE ABOLETH'S ENSLAVE (SRD 5.1, srd/monsters/a.md)
  // "The target must succeed on a DC 14 Wisdom saving throw or be magically charmed by the aboleth until the aboleth dies or until it is on a different
  // plane of existence from the target. The charmed target is under the aboleth's control and can't take reactions ... Whenever the charmed target takes
  // damage, the target can repeat the saving throw." Dominate Person's machinery (js/grimoire.js, 10-06): its side turned, run by its class's own
  // tactics (a hero too -- the player's turn is the AI's while it lasts), its WIS save each time it is hurt (grimoire.js M.onHurt) -- no concentration;
  // its charm is the aboleth's (`conds.charmed.by`), so the legendary Psychic Drain (js/traits.js TR.legendary) finds it.
  function enslaved(w) { return !!(w && w.dominated && w.dominated.enslave); }
  MR.enslaveLeft = function (u) { if (u.enslaveLeft == null) u.enslaveLeft = (u.enslave && u.enslave.uses) || 3; return u.enslaveLeft; };
  MR.enslave = function* (B, u, t) {
    var e = u.enslave || {}, dc = e.dc || 14;
    MR.enslaveLeft(u); u.enslaveLeft--;
    if (u.turn) u.turn.action = 0;
    u.facing = B.faceTo(u, t); u.anim = rowOr(u, 'enslave', 'idle'); u.animT = B.t; FX.ring(u, 'violet', 26); D.sfx('magic');
    yield 18;
    if (RU.immuneTo(t, 'charmed', u)) { B.card(['{r}' + nm(u, true) + '{/} reaches into ' + nm(t) + '\'s mind -- ENSLAVE: {n}proof against it{/}  {g}(' + u.enslaveLeft + ' left today){/}'], 240); yield 20; u.anim = 'idle'; return; }
    var sv = RU.save(t, 'wis', dc, false, 'charmed');
    B.card(['{r}' + nm(u, true) + '{/} reaches into ' + nm(t) + '\'s mind -- ENSLAVE: WIS ' + RU.saveText(sv) + ' vs DC ' + dc + '  ' + (sv.ok ? '{n}shakes it off{/}' : '{o}ENSLAVED{/}: under its control, no reactions') + '  {g}(' + u.enslaveLeft + ' left today){/}'], 300);
    if (!sv.ok) {
      t.dominated = { by: u.id, side0: t.side, guest0: t.guest, classAI0: t.classAI, dc: dc, spell: 'enslave', enslave: true };
      t.side = u.side; t.guest = true; t.conds.charmed = { by: u.id, dominated: true, enslave: true };
      if (t.cls) t.classAI = true;
      t.conds.noReact = { by: u.id, enslave: true }; t.reaction = 0; // (grimoire.js M.onStart keeps it at none each turn)
      FX.sparkle(t, 'violet', 18); D.sfx('charm');
    }
    yield 24; u.anim = 'idle';
  };
  function freeEnslaved(B, t, why) {
    if (!enslaved(t)) return;
    var dm = t.dominated;
    t.side = dm.side0; t.guest = dm.guest0; if (t.cls) t.classAI = dm.classAI0; delete t.dominated;
    if (t.conds.charmed && t.conds.charmed.enslave) delete t.conds.charmed;
    if (t.conds.noReact && t.conds.noReact.enslave) delete t.conds.noReact;
    if (up(t)) B.card(['{g}' + nm(t, true) + ' is ' + (t.side === 'foe' ? 'its' : 'their') + ' own again' + (why ? ': ' + why : '') + '.{/}'], 240);
  }
  MR.freeEnslaved = freeEnslaved;
  // its turn: Enslave when no one is under its control yet and it has a use -- the one it sees within 30 ft that would cost its foes most, by the odds
  // of the save (the seat's call, written as a lean: one at a time; with one held it fights, and drains with its legendary actions)
  function* enslaveTurn(B, u) {
    if (!RU.canAct(u) || !u.turn || !u.turn.action || MR.enslaveLeft(u) <= 0) return false;
    if (B.units.some(function (w) { return enslaved(w) && w.dominated.by === u.id && up(w); })) return false;
    var dc = u.enslave.dc || 14, rng = u.enslave.range || 30, TX = D.tactics, best = null, bs = 0;
    B.units.forEach(function (w) {
      if (!G.hostile(u, w) || !G.standing(w) || w.object || w.dominated || w.summon || w.familiar || G.range(u, w) > rng || !M.sees(B, u, w) || RU.immuneTo(w, 'charmed', u)) return;
      var pf = TX && TX.pFail ? TX.pFail(w, 'wis', dc) : 0.5, s = pf * ((TX && TX.dpr ? TX.dpr(w) : 5) + 1);
      if (pf >= 0.2 && s > bs) { bs = s; best = w; }
    });
    if (!best) return false;
    yield* MR.enslave(B, u, best);
    return true;
  }

  // ================================================================== THE HARPY'S LURING SONG (SRD 5.1, srd/monsters/h.md)
  // "Every humanoid and giant within 300 feet of the harpy that can hear the song must succeed on a DC 11 Wisdom saving throw or be charmed until the
  // song ends. The harpy must take a bonus action on its subsequent turns to continue singing. It can stop singing at any time. The song ends if the
  // harpy is incapacitated. While charmed by the harpy, a target is incapacitated and ignores the songs of other harpies. If the charmed target is
  // more than 5 feet away from the harpy, the target must move on its turn toward the harpy by the most direct route, trying to get within 5 feet. It
  // doesn't avoid opportunity attacks, but before moving into damaging terrain, such as lava or a pit, and whenever it takes damage from a source
  // other than the harpy, the target can repeat the saving throw. A charmed target can also repeat the saving throw at the end of each of its turns.
  // If the saving throw is successful, the effect ends on it. A target that successfully saves is immune to this harpy's song for the next 24 hours."
  // (300 ft is any map; the 24 hours, the fight. Every humanoid and giant means its own side's too -- the AI weighs that. The save is made as the
  // song begins.)
  function kindOf(w) { if (w.beast) return 'beast'; var t = w.type || (D.FOES && D.FOES[w.kind] || {}).type; return t || (M.humanoid(w) ? 'humanoid' : ''); }
  function hears(w) { return !(w.conds && w.conds.deafened); }
  MR.songTakes = function (u, w) {
    var k = kindOf(w);
    return w !== u && up(w) && !w.object && !w.familiar && (k === 'humanoid' || k === 'giant') && hears(w) && !(w.songSafe && w.songSafe[u.id]) && !w.conds.charmed && !RU.immuneTo(w, 'charmed', u);
  };
  function lured(w) { var c = w && w.conds && w.conds.charmed; return c && c.song ? c : null; }
  MR.luredBy = function (B, u) { return B.units.filter(function (w) { var c = lured(w); return c && c.by === u.id && up(w); }); };
  function songOn(B, w) { var c = lured(w), h = c && byId(B, c.by); return !!(h && up(h) && h.singing && RU.canAct(h)); }
  function freeLured(B, w, why, safe) {
    var c = lured(w); if (!c) return;
    delete w.conds.charmed;
    if (w.conds.incapacitated && w.conds.incapacitated.song) delete w.conds.incapacitated;
    if (safe) (w.songSafe = w.songSafe || {})[c.by] = true;
    if (up(w)) B.card(['{g}' + nm(w, true) + (safe ? ' shakes off the song' : ' comes back to ' + (w.side === 'foe' ? 'itself' : 'themselves')) + (why ? ' -- ' + why : '') + '.{/}' + (safe ? '  {g}(proof against this harpy\'s song now){/}' : '')], 240);
  }
  MR.freeLured = freeLured;
  function songSave(B, w, why) {
    var c = lured(w), h = c && byId(B, c.by), dc = (h && h.luringSong && h.luringSong.dc) || 11, sv = RU.save(w, 'wis', dc, false, 'charmed');
    B.card([nm(w, true) + ', ' + why + ', fights the song: WIS ' + RU.saveText(sv) + ' vs DC ' + dc + '  ' + (sv.ok ? '{n}FREE{/}' : '{o}still hers{/}')], 220);
    if (sv.ok) freeLured(B, w, null, true);
    return sv.ok;
  }
  MR.sing = function* (B, u) {
    var dc = (u.luringSong && u.luringSong.dc) || 11, lines = [];
    if (u.turn) u.turn.action = 0;
    u.singing = { round: B.round }; u.anim = rowOr(u, 'song', 'idle'); u.animT = B.t; FX.ring(u, 'violet', 34); D.sfx('magic');
    B.card(['{r}' + nm(u, true) + ' sings the Luring Song!{/}  {g}(every humanoid and giant that hears it: WIS DC ' + dc + ' or charmed while it sings -- incapacitated, and walking to it){/}'], 300);
    yield 24;
    B.units.filter(function (w) { return MR.songTakes(u, w); }).forEach(function (w) {
      var sv = RU.save(w, 'wis', dc, false, 'charmed');
      if (sv.ok) (w.songSafe = w.songSafe || {})[u.id] = true;
      else {
        w.conds.charmed = { by: u.id, song: true };
        if (!w.conds.incapacitated) w.conds.incapacitated = { by: u.id, song: true };
        w.reaction = 0; FX.sparkle(w, 'violet', 12);
      }
      lines.push(nm(w, true) + ': WIS ' + RU.saveText(sv) + ' vs DC ' + dc + '  ' + (sv.ok ? '{n}resists it{/}' : '{o}CHARMED{/}'));
    });
    if (lines.length) { B.card(lines, 300); D.sfx('charm'); }
    yield 24; u.anim = 'idle';
  };
  function stopSong(B, u, why) { if (!u.singing) return; u.singing = null; MR.luredBy(B, u).forEach(function (w) { freeLured(B, w, why || 'the song ends'); }); }
  // its turn: the song, with its action, whenever a foe of hers could be held by it -- her own side's humanoids not weighed (RULED 10-28, Griz: "I don't
  // see why she'd care, who are we grouping with harpies?"; they still hear it and save, by the block); once singing, the bonus action keeps it while
  // anyone is held by it -- and it stops when no one is
  function* songTurn(B, u) {
    if (!RU.canAct(u) || !u.turn) return false;
    if (u.singing) {
      if (MR.luredBy(B, u).length && u.turn.bonus > 0) { u.turn.bonus = 0; u.singing.round = B.round; B.card(['{r}' + nm(u, true) + '{/} keeps singing.  {g}(the bonus action){/}'], 160); yield 12; }
      else stopSong(B, u, 'the harpy stops singing');
      return false;
    }
    if (!u.turn.action) return false;
    if (!B.units.some(function (w) { return G.hostile(u, w) && MR.songTakes(u, w); })) return false;
    yield* MR.sing(B, u);
    return false; // (its move is still its own: the flight or the walk after, js/flight-ai.js -- the action is spent)
  }
  // damaging terrain the lured would step into (the grid's lasting fire: a burning oil square, a wall of fire or blades) -- the save first
  MR.hurtsAt = function (B, x, y) {
    var o = D.oil && D.oil.at && D.oil.at(B, x, y); if (o && o.lit != null) return 'burning oil';
    var wl = G.wallAt && G.wallAt(x, y); if (wl && /fire|blade|thorn/i.test(String(wl.id || wl.spell || wl.name || ''))) return 'the wall';
    return null;
  };
  MR.lured = function (B, u) { if (!lured(u)) return false; if (!songOn(B, u)) { freeLured(B, u, 'the song ends'); return false; } return true; };
  // the lured one's turn (a player's and the AI's alike: js/battle.js heroTurn, js/ai.js AI.turn): to the harpy by the most direct route, square by square
  // (the opportunity attacks it walks into are taken -- each a save, being harm from another; a burning square ahead is a save first); no action, no
  // bonus action (incapacitated); the save at the turn's end. Freed on the way, the rest of the turn is its own (returns false)
  MR.luredTurn = function* (B, u) {
    var c = lured(u), h = byId(B, c.by);
    B.focus(u);
    if (u.conds.prone && RU.canRise(u) && u.turn.move >= RU.riseCost(u)) RU.rise(B, u);
    if (G.dist(u, h) <= 5) B.card(['{o}' + nm(u, true) + ' stands rapt beside ' + nm(h) + ', charmed by its song.{/}'], 200);
    else if (u.turn.move > 0 && !u.conds.grappled && !(u.conds.restrained && !u.conds.restrained.only)) {
      var rm = G.reach(u, u.turn.move), e = AI.approach(u, h, rm, 5), path = e && G.path(rm, e.x, e.y);
      B.card(['{o}' + nm(u, true) + ' is charmed by ' + nm(h) + '\'s song{/} and walks to it.  {g}(incapacitated: no action){/}'], 220);
      yield 10;
      for (var i = 0; path && i < path.length; i++) {
        var hz = MR.hurtsAt(B, path[i][0], path[i][1]);
        if (hz && songSave(B, u, 'at the edge of ' + hz)) break;
        if (!lured(u)) break;
        yield* B.moveAlong(u, [path[i]], { spend: true });
        if (!up(u) || !lured(u) || G.dist(u, h) <= 5) break;
      }
    } else B.card(['{o}' + nm(u, true) + ' strains toward ' + nm(h) + '\'s song, held where it stands.{/}'], 200);
    if (!lured(u)) return !up(u); // (freed on the way: the rest of the turn is its own)
    yield 16;
    songSave(B, u, 'at the end of its turn');
    return true;
  };

  // ================================================================== THE ANKHEG'S BITE AND ITS BELLY (SRD 5.1, srd/monsters/a.md)
  // "If the target is a Large or smaller creature, it is grappled (escape DC 13). Until this grapple ends, the ankheg can bite only the grappled creature
  // and has advantage on attack rolls to do so." (data/foes.js ankheg: grapple.bitesHeld); "Armor Class 14 (natural armor), 11 while prone" (proneAC)
  function heldOf(u) {
    var bites = Object.keys(u.attacks || {}).some(function (k) { var a = u.attacks[k]; return a.grapple && a.grapple.bitesHeld; });
    return bites ? (u.holding || []).filter(function (w) { return up(w) && w.conds.restrained && w.conds.restrained.by === u.id; }) : [];
  }
  MR.heldOf = heldOf;
  var rac0 = RU.ac;
  RU.ac = function (u) { var a = rac0.apply(this, arguments); if (u && u.proneAC != null && u.conds && u.conds.prone) a -= Math.max(0, (u.baseAC || u.ac) - u.proneAC); return a; };
  var edges0 = RU.edges;
  RU.edges = function (att, tgt, atk) {
    var e = edges0.apply(this, arguments);
    if (e && atk && atk.grapple && atk.grapple.bitesHeld && tgt && tgt.conds && tgt.conds.restrained && tgt.conds.restrained.by === att.id) {
      e.adv.push('its grip'); if ('net' in e) e.net = e.adv.length && !e.dis.length ? 1 : e.dis.length && !e.adv.length ? -1 : 0;
    }
    return e;
  };
  var start0 = RU.startTurn;
  RU.startTurn = function (u) {
    var r = start0.apply(this, arguments);
    if (heldOf(u).length) u.reaction = 0; // (its one reaction, the opportunity bite, is at no one else; the one it holds cannot walk away)
    // the song's incapacitation takes no walk (js/magic.js M.startTurn stops every incapacitated one): the lured must walk to the harpy
    var c = u.conds || {};
    if (lured(u) && c.incapacitated && c.incapacitated.song && u.turn && !c.restrained && !c.paralyzed && !c.asleep && !c.petrified) u.turn.move = u.turn.moveFull != null ? u.turn.moveFull : RU.speedNow(u);
    return r;
  };
  var attack1 = BP.attack;
  BP.attack = function* (att, tgt, atk, o) {
    var held = att ? heldOf(att) : [];
    if (held.length && tgt && held.indexOf(tgt) < 0) { this.card(['{g}' + nm(att, true) + ' can bite only the one it holds.{/}'], 160); return; }
    yield* attack1.apply(this, arguments);
    if (att && heldOf(att).length) att.reaction = 0;
  };
  // its turn, holding one: the bite at that one, with advantage, and no more (it does not walk off with it)
  function* holdTurn(B, u) {
    var held = heldOf(u); if (!held.length || !RU.canAct(u) || !u.turn || !u.turn.action) return false;
    var k = Object.keys(u.attacks).filter(function (k) { return u.attacks[k].grapple && u.attacks[k].grapple.bitesHeld; })[0];
    u.turn.action = 0; u.facing = B.faceTo(u, held[0]);
    yield* B.attack(u, held[0], u.attacks[k]);
    return true;
  }

  // ================================================================== a thing rusted through stays gone: the Pocket DM's seat
  // ("if the rustmonster kills it during the fight it stays dead", RULED 10-28): the house keeps the sheet it is gone from (js/house.js H.takeBack), the
  // Hex hands it back gone (js/hex.js); a Pocket DM seat is built from its word every fight, so the seat remembers -- a thing from the pack worn by its
  // GEAR comes off it (not back to the pack), a winning comes off its record, and its own kit is left off every build after (`rustGone`, handed to the
  // build as the word's spec, js/classes.js NPC.carry) -- till the pack gives that seat another of it
  MR.seatGone = function (st, B) {
    ((B && B.units) || []).forEach(function (u) {
      var m = /^p(\d+)-/.exec(u.id || ''), slot = m && st.party && st.party[+m[1]];
      if (!slot || !u.rustGone || !u.rustGone.length) return;
      var rec = slot.custom != null ? st.roster && st.roster[slot.custom] : slot; if (!rec) return;
      u.rustGone.forEach(function (id) {
        var g = slot.gear || {}, place = Object.keys(g).filter(function (k) { return String(g[k]).replace(/^off:/, '') === id; })[0];
        if (place) { delete g[place]; return; }
        var loot = slot.custom != null ? rec.loot || [] : slot.loot || [], li = loot.map(function (x) { return typeof x === 'string' ? x : x && x.id; }).indexOf(id);
        if (li >= 0) { loot.splice(li, 1); return; }
        if ((rec.rustGone || []).indexOf(id) < 0) rec.rustGone = (rec.rustGone || []).concat([id]);
      });
    });
  };
  var carry0 = D.npc.carry;
  D.npc.carry = function (h, spec) {
    var r = carry0.apply(this, arguments);
    if (spec && spec.rustGone && h && h.equip) ['weapon', 'offhand', 'armor', 'shield'].forEach(function (k) { if (h.equip[k] && spec.rustGone.indexOf(h.equip[k]) >= 0) h.equip[k] = null; });
    return r;
  };
  if (D.Pocket && D.pocket) {
    var PK = D.pocket, PP = D.Pocket.prototype, done0 = PP.done, fw0 = PP.fightWords;
    PP.done = function (res, B) { MR.seatGone(this.st, B); return done0.apply(this, arguments); };
    PP.fightWords = function () {
      var st = this.st, out = fw0.apply(this, arguments);
      return out.map(function (w, i) {
        var slot = st.party && st.party[i], rec = slot && (slot.custom != null ? st.roster && st.roster[slot.custom] : slot), gone = (rec && rec.rustGone) || [];
        if (!gone.length) return w;
        var keep = PK.gearIds(slot).map(function (x) { return String(x).replace(/^off:/, ''); }).concat(PK.winsOf ? PK.winsOf(st, slot) : []); // (one the pack or a win gave it since)
        gone = gone.filter(function (id) { return keep.indexOf(id) < 0; });
        if (!gone.length) return w;
        var o = typeof w === 'string' ? { word: w, id: 'p' + i + '-' + String(w).split('+')[0].split(':')[0].split('.')[0].replace(/^~/, '') } : w;
        o.rustGone = gone.slice(); return o;
      });
    };
  }

  // ================================================================== the enslaved knows its old party
  // ("very yes, bench a routine for competent party betrayal behavior" and "and knowing party comp enough to hit them where it hurts the most", RULED
  // 10-28): an enslaved hero turns its class's own tactics on its friends (Dominate's machinery), and weighs them as one who knows them -- a blow or a
  // spell at one concentrating (its spell broken with it) or at the party's healer is worth that much more to it (js/tactics.js TX.worth, read while its
  // turn is the class AI's). Its friends' AC and hit points the tactics read already (the odds of the hit, the kill)
  function healer(w) { return (w.known || []).some(function (id) { return /^(curewounds|healingword|masscurewounds|masshealingword|prayerofhealing|heal)$/.test(id); }) && (w.slots || []).some(function (n) { return n > 0; }); }
  MR.knowsWeak = function (a, w) { if (!a || !enslaved(a) || !w || w === a || w.side !== a.dominated.side0) return 1; return 1 + (w.conc ? 0.6 : 0) + (healer(w) ? 0.4 : 0); };
  var TXr = D.tactics, worth0 = TXr.worth, tturn0 = TXr.turn;
  TXr.worth = function (dmg, w) { var v = worth0.apply(this, arguments); return v > 0 ? v * MR.knowsWeak(MR.actor, w) : v; };
  TXr.turn = function* (B, u) { var a0 = MR.actor; MR.actor = u; try { return yield* tturn0.apply(this, arguments); } finally { MR.actor = a0; } };

  // ================================================================== the turns, and the sweep
  var trTurn = D.traits.turn;
  D.traits.turn = function* (B, u) {
    if (heldOf(u).length) { if (yield* holdTurn(B, u)) return true; }
    if (u.antennae) { if (yield* rustTurn(B, u)) return true; if (!up(u)) return true; }
    if (u.enslave) { if (yield* enslaveTurn(B, u)) return true; if (!up(u)) return true; }
    if (u.luringSong) { yield* songTurn(B, u); if (!up(u)) return true; }
    return yield* trTurn.apply(this, arguments);
  };
  // what has ended without a blow: the aboleth dead, or gone to another plane (Banishment), frees the enslaved; a harpy dead, or incapacitated, ends its
  // song. Swept before every count of who is left (Battle.over) and at every turn's start
  MR.sweep = function (B) {
    (B.units || []).forEach(function (w) {
      if (enslaved(w)) { var a = byId(B, w.dominated.by); if (!a || a.dead || !(a.hp > 0) || a.conds.banished) freeEnslaved(B, w, !a || a.dead || !(a.hp > 0) ? 'the aboleth is dead' : 'the aboleth is gone from this plane'); }
      if (w.singing && (!up(w) || !RU.canAct(w))) stopSong(B, w, up(w) ? 'the harpy cannot sing' : 'the harpy is dead');
      if (lured(w) && !songOn(B, w)) freeLured(B, w, 'the song ends');
    });
  };
  var over0 = BP.over;
  BP.over = function () { MR.sweep(this); return over0.apply(this, arguments); };
  // the enslaved free, and the song's held, on a hurt: the enslaved's save is Dominate's (grimoire.js M.onHurt) -- what it leaves is tidied here; the
  // lured save when the harm is not the harpy's (the one whose turn it is: an opportunity attack on the walk is the walker's turn, so it counts)
  var onHurt0 = M.onHurt;
  M.onHurt = function (B, u, n, type) {
    if (onHurt0) onHurt0.apply(this, arguments);
    if (u.conds && u.conds.noReact && u.conds.noReact.enslave && !enslaved(u)) delete u.conds.noReact;
    if (u.conds && u.conds.charmed && u.conds.charmed.enslave && !enslaved(u)) delete u.conds.charmed;
    var c = lured(u);
    if (c && n > 0 && up(u) && !(B.active && B.active.id === c.by)) songSave(B, u, 'hurt');
  };
})();
