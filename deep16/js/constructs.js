/* DEEP16 -- THE POCKET DM'S CONSTRUCTS BY THE SRD (2026-11-26, the cutter seat cutter-1126-constructs, on Griz's word to the lanes desk: "there are 3 in Fresh,
   two for the Pocket DM stores"): what the grid did not carry of the rug of smothering (srd/monsters/a.md, Animated Objects) and the shield guardian (srd/monsters/s.md).
   Both are Pocket DM additions, unmet in the story till it needs them (the 11-15 precedent); data/foes.js rugofsmothering, shieldguardian.

   THE SHIELD GUARDIAN, A BRUTE (RULED 2026-11-26, Griz to the lanes desk: "cutter can leave it a brute, the rest is grid seat stuff if all the animations are wired"):
   its Regeneration here, at its turn's start; its two Fists the engine's Multiattack. Its amulet's parts -- Bound, the Shield reaction, Spell Storing -- wait for a grid
   seat; its sheet carries their rows already (`shield`, `bound`, `storedcast`), cut and named, for that seat to hook.

   THE RUG OF SMOTHERING. Smother (SRD 5.1: "Melee Weapon Attack: +5 to hit, reach 5 ft., one Medium or smaller creature. Hit: The creature is grappled (escape DC 13).
   Until this grapple ends, the target is restrained, blinded, and at risk of suffocating, and the rug can't smother another target. In addition, at the start of each of
   the target's turns, the target takes 10 (2d6 + 3) bludgeoning damage"): the hit deals nothing (its attack is `noDamage` -- no damage roll, no flinch, no critical's
   dice: battle.js attack hands the hit to C.take), and the grip is the grid's own -- conds.restrained { grapple, dc 13, by } with `smother` on it, the rug's `holding`,
   blinded by the hold (released with it: battle.js release) -- so escape (magic.js breakFree), reach lost, the rug incapacitated or down all end it as any grip does.
   The 2d6 + 3 at the start of the HELD ONE's turn (C.turnStart, from battle.js's turn loop); the air: SRD 5.1 Suffocating, "a number of minutes equal to 1 + its
   Constitution modifier (minimum of 30 seconds)", then "a number of rounds equal to its Constitution modifier (minimum of 1 round)", then 0 hit points and dying -- ten
   rounds a minute, counted on the held one's turns. One at a time (`grapple.max` 1), Medium or smaller (`grapple.size` 'M'). Damage Transfer is the cloaker's
   (battle.js hurt, `transfer`: the rug keeps half rounded down, the one it holds takes the rest). False Appearance its `still` row till its first turn (js/ui.js).
   While it holds one it stays (ai.js brute: C.smothering) -- it has no other action.

   THE LOOK (the art desk's WIRING, ART-171): the rug is drawn alone, the one it holds its own figure. Its Smother row lunges the rug's sprite from its 2x2 onto the
   target as the cloth rises -- the sheet's `wrap`, a facing's column foot, eased onto the target's square by the contact frame (4) -- and holds there over the held
   one (drawn after it), its Hold row looped; on a miss it backs out through 3-2-1 and never shows the wrap; let go, its Release row plays once as it slides home.
   C.look keeps that on the rug (one state a tick), C.wrapPos and C.row give js/ui.js the place and the row. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, Battle = D.Battle, RU = D.rules;
  var C = D.constructs = {};
  var FX = function () { return D.fx; };
  var unitOf = function (B, id) { var us = (B && B.units) || []; for (var i = 0; i < us.length; i++) if (us[i].id === id) return us[i]; return null; };

  // ------------------------------------------------------------------ THE RUG OF SMOTHERING: the grip
  // the one u smothers, or null
  C.heldBy = function (u) {
    var hs = (u && u.holding) || [];
    for (var i = 0; i < hs.length; i++) { var r = hs[i].conds && hs[i].conds.restrained; if (r && r.by === u.id && r.smother && !hs[i].dead) return hs[i]; }
    return null;
  };
  C.smothering = function (u) { return !!C.heldBy(u); };
  // why this hit takes no hold, or null
  C.cannotTake = function (att, tgt, atk) {
    if (!tgt || tgt.dead || !(tgt.hp > 0) || tgt.object) return 'nothing there to hold';
    var sz = Battle.gripSize(att, atk);
    if (sz && Battle.sizeCat(tgt) > Battle.SIZE[sz]) return Battle.nm(tgt) + ' is too big (Medium or smaller)';
    if (RU.immuneTo(tgt, 'grappled')) return Battle.nm(tgt) + ' cannot be held';
    if (C.heldBy(att)) return 'it holds one already';
    if (tgt.conds.restrained) return Battle.nm(tgt) + ' is held fast already';
    return null;
  };
  // the air the one held has (SRD 5.1 Suffocating): breath held, in rounds, then the choking rounds
  C.air = function (w) {
    var cm = D.mod((w.abil && w.abil.con) || 10);
    return { breath: Math.max(5, (1 + cm) * 10), choke: Math.max(1, cm) };
  };
  // a Smother that hit (battle.js attack, `noDamage`): the grip, or why not
  C.take = function* (B, att, tgt, atk) {
    var why = C.cannotTake(att, tgt, atk);
    if (why) { B.card(['{g}' + Battle.nm(att, true) + ' cannot take hold: ' + why + '.{/}'], 220); yield 18; return false; }
    var air = C.air(tgt);
    tgt.conds.restrained = { dc: atk.grapple.dc, by: att.id, grapple: true, smother: { dice: atk.dice, mod: atk.mod || 0, type: atk.type || 'bludgeoning', turns: 0, breath: air.breath, choke: air.choke } };
    att.holding = (att.holding || []).concat([tgt]);
    if (!tgt.conds.blinded && !RU.immuneTo(tgt, 'blinded')) tgt.conds.blinded = { by: att.id, held: true }; // (battle.js release takes a held blindness off with the grip)
    D.sfx('poison'); FX().ring(tgt, 'red', 26);
    B.card(['{r}' + Battle.nm(att, true) + '{/} wraps ' + Battle.nm(tgt) + ': {o}GRAPPLED, RESTRAINED and BLINDED{/}, no air to draw.  {g}(escape DC ' + atk.grapple.dc + ', an action; ' +
      atk.dice + RU.sign(atk.mod || 0) + ' ' + (atk.type || 'bludgeoning') + ' at the start of each of ' + Battle.nm(tgt) + '\'s turns; blows at the rug land half on ' + Battle.nm(tgt) + '){/}'], 420);
    yield 30;
    return true;
  };
  // at the start of a turn (battle.js's turn loop): the held one's 2d6 + 3, and its air; the shield guardian's Regeneration
  C.turnStart = function* (B, u) {
    yield* smotherTick(B, u);
    var gc = C.gcfg(u);
    if (gc && gc.regen && !u.dead && u.hp >= 1 && u.hp < u.maxhp) { // (SRD 5.1: "regains 10 hit points at the start of its turn if it has at least 1 hit point")
      var hp0 = u.hp; B.heal(u, gc.regen); var got = u.hp - hp0;
      if (got > 0) {
        if (D.spr.anim(u.sheet, 'regenerate')) { u.anim = 'regenerate'; u.animT = B.t; }
        FX().sparkle(u, 'gold', 12); B.card(['{r}' + Battle.nm(u, true) + '{/} regenerates: {n}+' + got + '{/}  {g}(Regeneration: 10 at the start of its turn, from 1 hit point up){/}'], 240);
        yield Math.max(20, D.spr.duration(u.sheet, 'regenerate') || 0); if (u.anim === 'regenerate') u.anim = 'idle';
      }
    }
  };
  var smotherTick = function* (B, u) {
    var r = u.conds && u.conds.restrained, sm = r && r.smother;
    if (!sm || u.dead || !(u.hp > 0)) return;
    var h = unitOf(B, r.by);
    if (!h || h.dead || !(h.hp > 0) || (h.holding || []).indexOf(u) < 0) return;
    var dr = RU.damage(sm.dice, sm.mod, {});
    B.card(['{r}' + Battle.nm(h, true) + '{/} tightens round ' + Battle.nm(u) + ':  ' + sm.dice + RU.sign(sm.mod) + ' ' + RU.fmtRolls(dr.rolls) + RU.sign(sm.mod) + ' = {r}' + dr.total + '{/} ' + sm.type], 300);
    D.sfx('hit'); B.hurt(u, dr.total, sm.type, {});
    yield 24;
    if (u.dead || !(u.hp > 0) || !u.conds.restrained || u.conds.restrained.smother !== sm) return;
    sm.turns++;
    if (sm.turns === sm.breath + 1) { B.card(['{o}' + Battle.nm(u, true) + ' is out of breath{/} under the rug, choking.  {g}(' + sm.choke + ' round' + (sm.choke > 1 ? 's' : '') + ' left: SRD 5.1 Suffocating){/}'], 360); yield 24; }
    else if (sm.turns > sm.breath + sm.choke) {
      u.temp = 0; B.card(['{r}' + Battle.nm(u, true) + ' suffocates{/} under the rug: 0 hit points, dying.'], 360);
      B.hurt(u, u.hp, 'suffocation', {}); yield 30;
    }
  };

  // ------------------------------------------------------------------ THE SHIELD GUARDIAN, A BRUTE (srd/monsters/s.md; data/foes.js shieldguardian `guardian`)
  C.gcfg = function (u) { var d = u && !u.object && u.kind && D.FOES && D.FOES[u.kind]; return (d && d.guardian) || null; };
  // (its Regeneration: C.turnStart above. Bound, the Shield reaction and Spell Storing wait for a grid seat -- his ruling of 11-26, the head of this file; the rows
  // `shield`, `bound` and `storedcast` are on its sheet, cut and named, for that seat)

  // ------------------------------------------------------------------ THE RUG: the look
  var FPS = function (sheet, row) { var a = D.spr.anim(sheet, row); return a ? a.fps || 8 : 8; };
  var frameAt = function (B, sheet, row, t0) { return Math.floor((B.t - t0) * FPS(sheet, row) / 60); };
  // one state a tick: the one it wraps (or lunges at, or slides home from), how far its sprite is set over onto them (0..1), and the row and frame it plays
  C.look = function (B, u) {
    var sh = D.SHEETS && D.SHEETS[u.sheet];
    if (!sh || !sh.wrap || !B) return null;
    if (u._cLook && u._cLook.t === B.t) return u._cLook.v;
    var v = null, w = C.heldBy(u), down = u.dead || !(u.hp > 0);
    if (w) { u.wrapOn = w.id; u.relT = null; }
    if (down) { u.wrapOn = null; u.relT = null; }
    else if (u.anim === 'smother' && u.smotherAt) {
      var at = unitOf(B, u.smotherAt), k = frameAt(B, u.sheet, 'smother', u.animT || 0);
      if (at && w === at) v = { on: at, k: Math.min(1, k / 3) };                                   // (it took hold: on them by the contact frame)
      else if (at && k <= 3) v = { on: at, k: k / 3 };                                              // (lunging)
      else if (at) v = { on: at, k: Math.max(0, 1 - (k - 3) / 3), frame: Math.max(0, 3 - (k - 3)) }; // (a miss: back out through 3-2-1, the wrap never shown)
    } else if (w) v = { on: w, k: 1, row: 'smotherhold' };
    else if (u.wrapOn && u.relT == null) u.relT = B.t;                                             // (let go: its Release once, sliding home)
    if (!w && !down && u.relT != null && !(u.anim === 'smother' && u.smotherAt)) {
      var rf = frameAt(B, u.sheet, 'smotherrelease', u.relT), ra = D.spr.anim(u.sheet, 'smotherrelease');
      if (!ra || rf >= ra.frames) { u.relT = null; u.wrapOn = null; }
      else v = { on: unitOf(B, u.wrapOn), k: Math.max(0, 1 - rf / 2), row: 'smotherrelease', frame: rf };
    }
    u._cLook = { t: B.t, v: v };
    return v;
  };
  // where js/ui.js draws the rug: its own place, or set over onto the one it wraps (its facing's column foot on their foot), drawn after them
  C.wrapPos = function (B, u, p) {
    if (!u || !u.sheet || !p) return null;
    var v = C.look(B, u); if (!v || !v.on || !(v.k > 0)) return null;
    var wr = (D.SHEETS[u.sheet].wrap || [])[u.facing || 0]; if (!wr) return null;
    var q = D.ui.unitPos(B, v.on), dx = (q.x - (p.x + wr[0])) * v.k, dy = (q.y - (p.y + wr[1])) * v.k;
    return Object.assign({}, p, { x: Math.round(p.x + dx), y: Math.round(p.y + dy), depth: v.k >= 0.5 ? Math.max(p.depth, q.depth + 0.05) : p.depth });
  };
  // the row js/ui.js plays: the Hold while it holds (its idle, its walk, a flinch -- the Hold's silhouette kept, the hit's flash on it), the Release as it lets go,
  // the Smother's frames backed out on a miss
  C.row = function (B, u, anim, down) {
    if (down || !u || !u.sheet) return null;
    var v = C.look(B, u); if (!v) return null;
    if (v.row === 'smotherhold' && (anim === 'idle' || anim === 'walk' || anim === 'flinch' || anim === 'still')) return { anim: 'smotherhold' };
    if (v.row === 'smotherrelease' && (anim === 'idle' || anim === 'walk' || anim === 'still')) return { anim: 'smotherrelease', frame: v.frame };
    if (anim === 'smother' && v.frame != null) return { anim: 'smother', frame: v.frame };
    return null;
  };
})();
