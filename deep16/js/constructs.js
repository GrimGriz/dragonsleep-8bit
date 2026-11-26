/* DEEP16 -- THE POCKET DM'S CONSTRUCTS BY THE SRD (2026-11-26, the cutter seat cutter-1126-constructs, on Griz's word to the lanes desk: "there are 3 in Fresh,
   two for the Pocket DM stores"): what the grid did not carry of the rug of smothering (srd/monsters/a.md, Animated Objects) and the shield guardian (srd/monsters/s.md).
   Both are Pocket DM additions, unmet in the story till it needs them (the 11-15 precedent); data/foes.js rugofsmothering, shieldguardian.

   THE SHIELD GUARDIAN (its section below): Regeneration at its turn's start; Bound, half its amulet's wearer's damage rounded up to it within 60 ft (battle.js hurt);
   Shield, its reaction, +2 to the wearer's AC as an attack is made at it, within 5 ft (battle.js attack); Spell Storing, one spell to 4th level cast on the wearer's
   trigger at a turn's end (battle.js's turn loop); the amulet's wearer, the stored spell and its keeping beside the wearer are the seat's leans, his to rule.

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

  // ------------------------------------------------------------------ THE SHIELD GUARDIAN (srd/monsters/s.md; data/foes.js shieldguardian `guardian`)
  C.gcfg = function (u) { var d = u && !u.object && u.kind && D.FOES && D.FOES[u.kind]; return (d && d.guardian) || null; };
  C.caster = function (w) { return !!(w && ((w.known && w.known.length) || (w.slots && w.slots.some(function (n) { return n > 0; })))); };
  var cr8Of = function (w) {
    var d = w.kind && D.FOES && D.FOES[w.kind], PK = D.pocket;
    if (d && d.cr != null && PK) return PK.cr8(d.cr);
    if (w.lvl && PK && PK.levelCR) return PK.cr8(PK.levelCR(w.lvl));
    return 0;
  };
  // THE AMULET'S WEARER (a lean, his to rule -- the seat's report, question 1): the guardian's own side's strongest other creature when the fight asks first, a spellcaster
  // before any other (only a caster can store a spell in it), then by CR (a class NPC by its level's, js/pocket.js PK.levelCR); never another guardian, a familiar, a summons
  // or an object. Alone, no one wears it: no Shield, no Bound, nothing stored -- a brute that regenerates. Kept on the guardian (g.amuletOn, the wearer's id, or false); a
  // fallen wearer's amulet is worn by no one after (SRD 5.1 says nothing of a new wearer in a fight)
  C.pickWearer = function (B, g) {
    var cs = (B.units || []).filter(function (w) { return w !== g && w.side === g.side && !w.object && !w.familiar && !w.summon && !w.look && !w.bystander && !C.gcfg(w) && !w.dead; });
    cs.sort(function (a, b) { return (C.caster(b) - C.caster(a)) || (cr8Of(b) - cr8Of(a)) || (B.units.indexOf(a) - B.units.indexOf(b)); });
    return cs.length ? cs[0].id : false;
  };
  C.wearer = function (B, g) {
    if (!B || !C.gcfg(g)) return null;
    if (g.amuletOn === undefined) { g.amuletOn = C.pickWearer(B, g); C.store(B, g); }
    var w = g.amuletOn ? unitOf(B, g.amuletOn) : null;
    return w && !w.dead && !w.left ? w : null;
  };
  // SHIELD (its reaction): +2 to the wearer's AC against an attack made at it, the guardian within 5 ft and able to act -- spent as the attack is made (battle.js attack)
  C.shieldFor = function (B, att, tgt) {
    if (!B || !att || !tgt || att === tgt || !B.units) return 0;
    for (var i = 0; i < B.units.length; i++) {
      var g = B.units[i], gc = C.gcfg(g);
      if (!gc || !gc.shield || g === att || !G.standing(g) || !(g.reaction > 0) || !RU.canAct(g) || C.wearer(B, g) !== tgt || G.dist(g, tgt) > 5) continue;
      g.reaction = 0;
      if (D.spr.anim(g.sheet, 'shield')) { g.anim = 'shield'; g.animT = B.t; g.facing = B.faceTo ? B.faceTo(g, att) : g.facing; }
      FX().ring(tgt, 'silver', 26); D.sfx('bump');
      return gc.shield;
    }
    return 0;
  };
  // BOUND: half the wearer's damage, rounded up, to the guardian within 60 ft (battle.js hurt, once the wearer's own resistances have had it) -- the wearer keeps the rest
  C.bound = function (B, u, n, type, src) {
    if (!B || !(n > 0) || !B.units || (src && src.boundFrom)) return n;
    for (var i = 0; i < B.units.length; i++) {
      var g = B.units[i], gc = C.gcfg(g);
      if (!gc || !gc.bound || g === u || g.dead || !(g.hp > 0) || C.wearer(B, g) !== u || G.dist(g, u) > gc.bound) continue;
      var pass = Math.ceil(n / 2);
      if (D.spr.anim(g.sheet, 'bound') && RU.canAct(g)) { g.anim = 'bound'; g.animT = B.t; }
      FX().float('bound', g, D.PAL.ramps.gold[4]);
      if (src && src.blow) src.blow.bound = (src.blow.bound || 0) + pass;
      B.card(['{g}' + Battle.nm(g, true) + ' takes ' + pass + ' of the ' + n + ' for ' + Battle.nm(u) + ' (Bound: half, rounded up).{/}'], 200);
      B.hurt(g, pass, type, { boundFrom: u.id, magic: !!(src && src.magic) });
      return n - pass;
    }
    return n;
  };
  // SPELL STORING (a lean, his to rule -- the seat's report, question 2): a caster wearing the amulet came with one spell stored in it, cast on the guardian before the
  // fight at its best slot up to 4th -- its own Cure Wounds, else its Healing Word, the healing on its list the grid's caster knows; none on its list, nothing stored. The
  // situation it named: the wearer at half its hit points or under (and above 0), at the end of a turn -- the guardian casts it on the wearer, no components, no action of
  // its own, with the original caster's numbers (the dice by the slot it was stored at, the wearer's casting modifier: js/magic.js M.mod); Cure Wounds a touch, so the
  // guardian beside it, Healing Word within 60 ft. Cast, it is gone (SRD 5.1: "When the spell is cast or a new spell is stored, any previously stored spell is lost")
  C.STORE = [['curewounds', 'Cure Wounds', 'd8', 5], ['healingword', 'Healing Word', 'd4', 60]];
  C.store = function (B, g) {
    var w = g.amuletOn ? unitOf(B, g.amuletOn) : null, gc = C.gcfg(g); g.stored = null;
    if (!w || !gc || !gc.store || !C.caster(w)) return null;
    var top = 0; (w.slots || []).forEach(function (n, i) { if (n > 0 || (w.slotsMax && w.slotsMax[i] > 0)) top = i + 1; }); top = Math.min(gc.store, Math.max(1, top || 1));
    for (var i = 0; i < C.STORE.length; i++) { var s = C.STORE[i]; if ((w.known || []).indexOf(s[0]) >= 0) { g.stored = { id: s[0], name: s[1], die: s[2], reach: s[3], slot: top, by: w.id, mod: D.magic && D.magic.mod ? D.magic.mod(w) : 0 }; break; } }
    return g.stored;
  };
  C.afterTurn = function* (B) {
    var gs = (B.units || []).filter(function (g) { return C.gcfg(g) && g.stored && G.standing(g) && RU.canAct(g); });
    for (var i = 0; i < gs.length; i++) {
      var g = gs[i], st = g.stored, w = C.wearer(B, g);
      if (!w || !(w.hp > 0) || w.hp > w.maxhp / 2 || G.dist(g, w) > st.reach) continue;
      g.stored = null; // (cast: gone)
      if (D.spr.anim(g.sheet, 'storedcast')) { g.anim = 'storedcast'; g.animT = B.t; g.facing = B.faceTo ? B.faceTo(g, w) : g.facing; }
      yield Math.max(10, Math.round((D.spr.duration(g.sheet, 'storedcast') || 18) * 0.55));
      var dice = st.slot + st.die, r = RU.damage(dice, st.mod, {}), hp0 = w.hp; B.heal(w, r.total);
      FX().sparkle(w, 'gold', 16); D.sfx('buff');
      B.card(['{y}' + Battle.nm(g, true) + '{/}: the STORED ' + st.name.toUpperCase() + ' (L' + st.slot + '), on ' + Battle.nm(w) + ' at half its hit points:  ' + dice + RU.sign(st.mod) + ' ' + RU.fmtRolls(r.rolls) + RU.sign(st.mod) + ' = {n}+' + (w.hp - hp0) + '{/}  {g}(Spell Storing: the trigger ' + Battle.nm(w) + ' set; gone once cast){/}'], 360);
      yield 30; if (g.anim === 'storedcast') g.anim = 'idle';
    }
  };
  // its turn (ai.js brute): its wearer up and more than 5 ft off, it goes to the wearer's side first, by the nearest free square beside it (the telepathic call --
  // SRD 5.1: "the guardian knows the distance and direction to the amulet"); beside it, it walks no farther and strikes what is in its reach (a lean, his to rule -- question 3)
  C.guard = function* (B, g) {
    var w = C.wearer(B, g), T = g.turn; if (!w || !T) return false;
    if (G.dist(g, w) > 5 && T.move > 0 && !g.conds.restrained && !g.conds.grappled) {
      var rm = G.reach(g, T.move), best = null, bl = Infinity;
      Object.keys(rm).forEach(function (k) { var c = rm[k]; if (!c.stand || G.dist(g, w, c.x, c.y) > 5) return; var len = c.prev ? G.path(rm, c.x, c.y).length : 0; if (len < bl) { bl = len; best = c; } });
      if (!best) { var far = null, fd = Infinity; Object.keys(rm).forEach(function (k) { var c = rm[k]; if (!c.stand) return; var d = G.dist(g, w, c.x, c.y); if (d < fd) { fd = d; far = c; } }); best = far; }
      if (best && best.prev) { yield* B.moveAlong(g, G.path(rm, best.x, best.y), { spend: true }); g.anim = 'idle'; }
    }
    if (G.dist(g, w) <= 5) T.move = 0;
    return true;
  };

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
