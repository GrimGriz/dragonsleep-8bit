/* DEEP16 — THREE MORE MAGIC ITEMS OF THE SRD ON THE GRID (2026-11-15, the magic-items seat; the lanes desk's picks on Griz's "pick 3 more magic items to add from the SRD and
   have a seat start those"). Where each is met in the story is his word: none is placed yet -- the Pocket DM's market and winnings have them, and deep16/?itemshow shows them.

     the Wand of Web        (content/items.json wandofweb; SRD 5.1: "This wand has 7 charges. While holding it, you can use an action to expend 1 of its charges to cast the web
                            spell (save DC 15) from it. The wand regains 1d6 + 1 expended charges daily at dawn. If you expend the wand's last charge, roll a d20. On a 1, the
                            wand crumbles into ashes and is destroyed." -- requires attunement by a spellcaster): held in a place of its own, WAND (js/rules.js R.PLACES), bonded
                            at a rest as any worn thing is, and only by one who casts spells (R.casts). On the ring, WAND OF WEB n/7: the action and a charge, aimed as the spell
                            is (js/ui.js aimCommand), and cast by the engine's own M.cast with the item's DC and no slot (js/magic.js B.itemCast). The charges are the holder's
                            sheet's (R.charges, kept among its uses so every fight writes them back); the dawn is the long rest (R.refresh, R.wandDawn); the last one spent rolls
                            the d20 here, and on a 1 the wand is gone from the hand, the bond with it.
     the Ring of Water Walking   (ringwaterwalking): js/grid.js G.waterWalker -- deep water is floor to the wearer and the still water does not slow it; js/ui.js draws the
                            wearer on the water, not in it.
     the Rope of Climbing   (ropeclimbing): js/battle.js exec 'rope' with its item -- set on a face as the Rope & Grapple is, from up top or from below, but with no throw and
                            as far as its 60 ft; AC 20 and 20 hit points against the blows at it (Battle.cutRope), destroyed at 0; taken up, it coils back into the pack as itself.

   What of the SRD's text the grid leaves out is said in the seat's report and in the lane (handoff-2026-10-21-the-second-games-house.md, the magic-items room). */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx, Battle = D.Battle;
  var MI = D.magicItems = {};
  function item(id) { return window.DS && DS.DATA && DS.DATA.items ? DS.DATA.items[id] : null; }
  function R() { return window.DS && DS.R; }

  // the wand in a unit's hand: { id, it, n (charges left), max, ok (bonded and its holder able), why } or null. The count is the unit's own uses (u.feats, a copy of the
  // sheet's that the fight writes back), by the item's id; none written is a wand full
  MI.wandOf = function (u) {
    var e = u && u.src && u.src.equip, id = e && e.wand, it = item(id); if (!it || !it.wand) return null;
    var k = R().chargeKey(id), v = u.feats ? u.feats[k] : null, max = it.wand.charges, n = typeof v === 'number' ? Math.max(0, Math.min(max, v)) : max;
    var bond = R().bonded(u.src, id), why = !bond ? (it.attune === 'caster' && !R().casts(u.src) ? 'it wants a spellcaster' : 'not yet bonded: a rest while it is held') : !n ? 'no charges left till dawn' : '';
    return { id: id, it: it, n: n, max: max, ok: bond && n > 0, why: why };
  };
  // THE WAND IN THE MAIN HAND (RULED 11-24, Griz: "Like a main hand weapon, with it's function showing on the front wheel when equipped in place of 'attack'"; his note of 11-23
  // on the road, "no way to use the wand? Wouldn't the wand go in a weapon hand?" -- the classic ring drew no WAND at all, js/ui.js): the main hand holds a weapon or the wand.
  // EQUIP puts it there as it puts a weapon (js/menu.js, the WEAPON row: the other to the pack) and keeps it on its own place, equip.wand, with no weapon beside it -- so the bond
  // and the charges read as they did. In a fight it is in hand while the main hand holds no weapon: none on the sheet, or the weapon PUT AWAY (u.sheathed) -- a sheet saved with
  // both (the WAND place of 11-15 and a weapon) has the weapon in hand and the wand at the belt till the weapon is put away, or a swap in the fight takes one up (the weapon in
  // hand, the wand back at the belt). In hand, WAND OF WEB stands on the ring's front in ATTACK's place on both rings, the ATTACK (a fist) among the ACTIONS (js/ui.js)
  MI.inHand = function (u) { var e = u && u.src && u.src.equip; return !!(e && e.wand && (!e.weapon || u.sheathed)); };
  MI.setCharges = function (u, id, n) { var it = item(id); if (!it || !it.wand) return; u.feats = u.feats || {}; var k = R().chargeKey(id); if (n >= it.wand.charges) delete u.feats[k]; else u.feats[k] = Math.max(0, n); };

  // ------------------------------------------------------------------ the Rope of Climbing at the fight's end
  // a held field (as the thrown weapons are gathered, Battle.gatherThrown): a Rope of Climbing still fastened on a face is told to come down and coils itself back into the
  // pack -- a magic item is not left hanging on the Edifice (a Rope & Grapple left on a face stays there, as it always has)
  var gather0 = Battle.prototype.gatherThrown;
  Battle.prototype.gatherThrown = function (o) {
    var line = gather0.apply(this, arguments), self = this;
    if (o !== 'won' && o !== 'yielded' && o !== 'fled') return line;
    var back = (this.ropes || []).filter(function (r) { return !r.cut && r.item && Battle.ropeItem(r.item); });
    if (!back.length) return line;
    back.forEach(function (r) { r.cut = true; var s = (self.inv = self.inv || []).filter(function (x) { return x.id === r.item; })[0]; if (s) s.n = (s.n || 0) + 1; else self.inv.push({ id: r.item, n: 1 }); });
    this.ropes = (this.ropes || []).filter(function (r) { return back.indexOf(r) < 0; });
    var said = '{g}The Rope of Climbing is told to come down: it coils itself back into the pack.{/}';
    return line ? line + ' ' + said : said;
  };

  // ------------------------------------------------------------------ the ring: WAND OF WEB n/7
  var cmds0 = Battle.prototype.commands;
  Battle.prototype.commands = function (u) {
    var out = cmds0.apply(this, arguments);
    var w = u && !u.familiar && !u.beast && !u.object && MI.inHand(u) ? MI.wandOf(u) : null; // (only in the main hand: 11-24)
    if (w) {
      var T = u.turn || {}, W = w.it.wand, g = D.magic.geo(W.spell), sp = D.magic.data(W.spell) || { name: W.spell };
      var can = T.action > 0 && !T.attacksLeft && RU.canAct(u);
      out.push({ id: 'wand', label: w.it.name.toUpperCase() + ' ' + w.n + '/' + w.max, cost: 'A', icon: 'spell', item: w.id, aim: Object.assign({}, g, { kind: 'save' }),
        ok: w.ok && can, why: !w.ok ? w.why : !can ? (T.action > 0 ? 'not now' : 'the action is spent') : '',
        aimText: 'a ' + g.size + '-ft cube within ' + g.range + ' ft: ' + sp.name + ' from the wand, DEX DC ' + W.dc + ' or restrained (concentration)',
        note: 'the action and one of its charges: ' + sp.name + ' cast from it at DC ' + W.dc + ', no slot spent (' + w.n + ' of ' + w.max + ' charges; 1d6+1 back at dawn; the last one spent, a d20 -- on a 1 it crumbles)' });
    }
    return out;
  };
  var exec0 = Battle.prototype.exec;
  Battle.prototype.exec = function* (u, c) {
    if (c && c.do === 'wand') return yield* wandCast(this, u, c);
    return yield* exec0.apply(this, arguments);
  };
  // the cast: the engine's own (exec 'cast'), with the item's DC and no slot -- B.itemCast for that one cast (js/magic.js M.cast and area read it). The charge is spent when the
  // action was (a counterspell still spends it, as it spends a slot); the last one spent, the d20 (MI.d20, the dice the show pins)
  MI.d20 = function () { return D.d(20); };
  function* wandCast(B, u, c) {
    var w = MI.wandOf(u), T = u.turn; if (!w || !w.ok || !MI.inHand(u) || !T || !(T.action > 0) || T.attacksLeft || !c.target || !RU.canAct(u)) return;
    var W = w.it.wand, a0 = T.action;
    B.itemCast = { by: u.id, spell: W.spell, dc: W.dc, item: w.id, name: w.it.name.toUpperCase() };
    try { yield* B.exec(u, { do: 'cast', id: W.spell, slot: W.slot || 1, target: c.target }); } finally { B.itemCast = null; }
    if (!(a0 > 0 && !(T.action > 0))) return; // (nothing went off: no charge)
    var left = w.n - 1; MI.setCharges(u, w.id, left);
    if (left > 0) { B.card(['{g}The ' + w.it.name + ': ' + left + ' of ' + w.max + ' charges left.{/}'], 200); yield 10; return; }
    var r = MI.d20();
    if (r !== 1) { B.card(['{g}The ' + w.it.name + '\'s last charge: d20 ' + r + ' -- it holds, empty till dawn.{/}'], 260); yield 20; return; }
    // on a 1 it crumbles into ashes and is destroyed: out of the hand, the bond gone with it (u.equip0: the Pocket DM keeps the change, js/pocket.js PK.fightKept -- and the fight's
    // pack never had it, so nothing comes back to the table's)
    if (u.src && u.src.equip) { if (!u.equip0) u.equip0 = JSON.parse(JSON.stringify(u.src.equip)); u.src.equip.wand = null; if (u.src.attuned) u.src.attuned = u.src.attuned.filter(function (id) { return id !== w.id; }); }
    if (u.feats) delete u.feats[R().chargeKey(w.id)];
    D.sfx('bump'); if (FX && FX.sparkle) FX.sparkle(u, 'stone', 18);
    B.card(['{o}The ' + w.it.name + '\'s last charge: d20 1 -- it crumbles into ashes in ' + (u.side === 'foe' ? Battle.nm(u) : u.name) + '\'s hand.{/}'], 320); yield 30;
  }
})();
