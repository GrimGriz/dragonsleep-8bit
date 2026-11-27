/* DEEP16 -- THE FEAST (2026-11-26, the Thanksgiving seat: a Claude Code tab Griz opened on "Special Thanksgiving LobstaMonkee Fight (as they exist in the gameshow)").
   The art desk's three for the Lobstamonkees' Thanksgiving special, on his "if we can get them as 'abberations' and into the pocket DM with your map on the pocket DM, I
   should be able to build the module": their blocks in data/foes.js from the art desk's own STATBLOCK.md each (deep16/_src/<id>/2026-11-26-<NAME>-COMBAT/), every one
   typed an ABERRATION on his word (the art desk wrote a plant, a monstrosity and a construct) -- so all three stand on the Pocket DM's ABERRATIONS, OOZES, ETC. shelf --
   and their floor the Harvest Bowl (data/maps.js harvestbowl). Ours, not the SRD's. Their rules, here:

   THE JACKET BRUISER (jacketbruiser; sheets jacketbruiser_p1 the baked form, _p2 the mash):
   * Jacket Punch grapples on a hit -- Medium or smaller, escape DC 14, grappled only -- while it has no captive (its `grapple`, battle.js attack; one held at a time).
   * FOLD IN: "The bruiser can replace the second punch with Fold In if it has a creature grappled" -- the second punch of its turn is the Fold In when it holds one
     grappled (the attack wrapper below): the held one goes inside its split jacket, js/engulf.js's ENGULFED with the block's `engulf` (kind 'jacket'): blinded,
     restrained, total cover from everything outside it, 2d6 fire at the start of each of the bruiser's turns, out by its action (STR (Athletics) or DEX (Acrobatics)
     against DC 14, the grapple's escape), one at a time. Its `hold` row is its idle while one is inside; the one inside is SEEN, sunk into it as the mound's,
     the jacket's flaps drawn over it (F.drawJacket; Griz, 11-26: "where you can see the fella inside" -- over the art desk's "Hide the captive after closure").
   * SPLIT JACKET: "The first time the baked form reaches 0 HP, its skin bursts" -- the blow's excess lost, the captive set down beside it (engulf.js E.free), and in its
     square the mash at full hit points, its block's `split` (AC 11, 52 HP, speed 20, two Steaming Chunks at range); its initiative, its conditions and what it has
     spent this turn kept. It plays its `split` row, then wears jacketbruiser_p2. The XP is the block's once, when the mash falls (the baked never dies: TR.refuse).
   THE GALLOWS GOBBLER (gallowsgobbler, Huge, 3 x 3): two talons by its routine, each its own roll, row and target (`multi`); GALLOWS GOBBLE, Recharge 5-6, its whole action:
     each enemy within 30 ft of it that can hear it (not deafened), WIS DC 16 or FRIGHTENED of it for a minute, the save again at the end of each of its turns (M.endTurn
     below). The AI gobbles when it catches two not frightened of it already; spent, a d6 at its turn's start brings it back on a 5 or 6.
   THE CRANBERRY CAN (cranberrycan, Small): Cranberry Shot at range, the berry flying as drawn (`fx: 'row:berry'`, FX.projectile below); SAUCE SPILL, Recharge 5-6: a
     10-ft square (2 x 2) whose middle is a point within 60 ft -- the 2014 Grease ground (grimoire.js's slip on entering and ending a turn) at DC 12, drawn as its sauce,
     ten rounds, no concentration; each one standing in it DEX 12 or prone. The AI spills where it catches two foes and none of its own, or one foe in arm's reach.
   THE SEAT'S CALLS, his to overrule: the mash keeps the bruiser's name; the Fold In is the second punch whatever that punch was aimed at; the gobble's minute is ten rounds;
   the spill aims at its foes' squares (no empty-ground spills to block a way); a spilled can's own square never in its patch. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, Battle = D.Battle, RU = D.rules, M = D.magic, TR = D.traits, E = D.engulf;
  if (!Battle || !TR || !E || !G || !RU) return;
  var F = D.feast = {};
  var FX = function () { return D.fx; };
  ['sizeClass', 'gobble', 'spill', 'split', 'closes'].forEach(function (k) { if (TR.FIELDS.indexOf(k) < 0) TR.FIELDS.push(k); });
  function Nm(B, u) { return B.theOf ? B.theOf(u, true) : u.name; }
  function nm(B, u) { return u.side === 'foe' ? Nm(B, u) : u.name; }
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }

  // ================================================================== THE JACKET BRUISER
  // the one it has grappled (by a punch), not yet inside
  F.heldOnly = function (B, h) {
    return (h.holding || []).filter(function (w) { return w && !w.dead && w.hp > 0 && !w.left && !(w.conds && w.conds.engulfed) && w.conds && w.conds.restrained && w.conds.restrained.by === h.id; })[0] || null;
  };
  F.foldIn = function* (B, h, w) {
    if (B.focus) B.focus(h);
    B.card(['{r}' + Nm(B, h) + '{/} splits its jacket down the front and folds ' + nm(B, w) + ' in.  {g}(Fold In, in place of its second punch){/}'], 240);
    yield 12;
    return yield* E.take(B, h, w);
  };
  var at0 = Battle.prototype.attack;
  Battle.prototype.attack = function* (att, tgt, atk, o) {
    var T = att && att.turn;
    if (atk && atk.foldIn && T && this.active === att && !(o && o.oa)) {
      T.punches = (T.punches || 0) + 1;
      var held = T.punches >= 2 ? F.heldOnly(this, att) : null;
      if (held && E.fits(this, att, held)) { yield* F.foldIn(this, att, held); return; }
    }
    return yield* at0.call(this, att, tgt, atk, o);
  };
  // SPLIT JACKET: at 0 the first time, the mash (TR.refuse: battle.js hurt asks it before a foe falls)
  F.splitJacket = function (B, u) {
    var s = u.split; u.splitDone = true;
    var held = (u.holding || []).slice();
    if (held.length) B.release(u); // (the captive set down beside it -- engulf.js's release; a grappled one let go)
    u.hp = u.maxhp = s.hp; u.baseAC = s.ac; u.armor = s.armor || undefined; u.speed = s.speed; u.abil = clone(s.abil); u.saves = clone(s.saves);
    u.attacks = clone(s.attacks); u.multi = Array.isArray(s.multi) ? s.multi.slice() : s.multi; u.reach = 5; u.init = s.init != null ? s.init : u.init;
    u.mashed = true; u.temp = 0;
    if (D.spr && D.spr.anim(u.sheet, 'split')) { u.anim = 'split'; u.animT = B.t; u.mashAt = B.t + (D.spr.duration(u.sheet, 'split') || 40); }
    else F.mashNow(B, u);
    D.sfx('crit'); if (FX()) { FX().ring(u, 'bone', 30); FX().sparkle(u, 'bone', 18); }
    B.card(['{r}' + Nm(B, u) + '\'s skin bursts!{/} It slumps out of its jacket, a steaming heap of mash.' + (held.length ? '  ' + held.map(function (w) { return nm(B, w); }).join(' and ') + ' tumbles out.' : ''),
      '{g}(Split Jacket: the mash at ' + s.hp + ' HP, AC ' + s.ac + ', speed ' + s.speed + '; two Steaming Chunks at range; its turn kept){/}'], 380);
    B.cache = null;
  };
  F.mashNow = function (B, u) { if (!u.split) return; u.sheet = u.split.sheet; delete u.mashAt; if (u.anim === 'split' || !u.anim) { u.anim = 'idle'; u.animT = B ? B.t : 0; } };
  var ref0 = TR.refuse;
  TR.refuse = function (B, u, n) {
    if (u && u.split && !u.splitDone && u.hp <= 0 && !u.dead && u.side === 'foe') { F.splitJacket(B, u); return true; }
    return ref0 ? ref0.apply(this, arguments) : false;
  };
  // the mash's sheet once the split has played (the frames run on, the bench's too: Battle.prototype.update)
  var up0 = Battle.prototype.update;
  Battle.prototype.update = function () {
    var self = this;
    (this.units || []).forEach(function (u) { if (u.mashAt != null && self.t >= u.mashAt) F.mashNow(self, u); });
    return up0.apply(this, arguments);
  };

  // ================================================================== THE GALLOWS GOBBLER
  F.gobbleCaught = function (B, u) {
    var gb = u.gobble;
    return B.units.filter(function (w) {
      return G.hostile(u, w) && G.standing(w) && !w.object && !w.left && !(w.conds && w.conds.deafened) && !(E.sealedFrom && E.sealedFrom(u, w)) && G.dist(u, w) <= gb.ft;
    });
  };
  F.gobbleNow = function* (B, u) {
    var gb = u.gobble, caught = F.gobbleCaught(B, u);
    if (u.turn) u.turn.action = 0; u.gobbleSpent = true;
    if (B.focus) B.focus(u);
    u.anim = D.spr && D.spr.anim(u.sheet, 'gobble') ? 'gobble' : 'attack'; u.animT = B.t;
    D.sfx('crit'); yield Math.min(40, (D.spr && D.spr.duration(u.sheet, 'gobble')) || 30);
    if (FX()) FX().ripples(u, caught, gb.ft, { ramp: 'red' });
    var lines = ['{r}' + Nm(B, u) + '{/}: ' + (gb.name || 'Gallows Gobble').toUpperCase() + '  ' + gb.ft + ' ft  WIS DC ' + gb.dc];
    caught.forEach(function (w) {
      var f0 = w.conds.frightened;
      if (RU.immuneTo(w, 'frightened', u)) { lines.push('  ' + nm(B, w) + ': {g}not frightened (immune){/}'); return; }
      if (f0 && f0.by === u.id) { lines.push('  ' + nm(B, w) + ': {g}afraid of it already{/}'); return; }
      var sv = RU.save(w, gb.ab || 'wis', gb.dc, false, 'frightened');
      lines.push('  ' + nm(B, w) + ': WIS ' + RU.saveText(sv) + '  ' + (sv.ok ? '{n}holds firm{/}' : '{o}FRIGHTENED{/}'));
      if (!sv.ok) w.conds.frightened = { by: u.id, gobble: { ab: gb.ab || 'wis', dc: gb.dc, till: (B.round || 0) + 10 } };
    });
    if (!caught.length) lines.push('  {g}no one near enough to hear it{/}');
    B.card(lines.slice(0, 8), 360); yield 30;
    u.anim = 'idle'; u.animT = B.t;
  };
  // the recharge at its turn's start (the breath's way: traits.js)
  var start0 = RU.startTurn;
  RU.startTurn = function (u) {
    start0.apply(this, arguments);
    var B = D.battle;
    if (u && !u.dead && u.hp > 0) [['gobble', 'gobbleSpent', 'Gallows Gobble'], ['spill', 'spillSpent', 'Sauce Spill']].forEach(function (k) {
      if (!u[k[0]] || !u[k[1]]) return;
      var rc = D.d(6), back = rc >= (u[k[0]].recharge || 5); if (back) u[k[1]] = false;
      if (B) B.card(['{g}' + Nm(B, u) + ': ' + k[2] + (back ? ' is back' : ' not yet') + ' (d6 ' + rc + ', ' + (u[k[0]].recharge || 5) + '-6){/}'], 160);
    });
  };
  // the fear's save at the end of each of the frightened one's turns, and its minute
  if (M && M.endTurn) {
    var end0 = M.endTurn;
    M.endTurn = function (B, u) {
      var r = end0.apply(this, arguments);
      var f = u && u.conds && u.conds.frightened;
      if (B && f && f.gobble && !u.dead) {
        var src = B.units.filter(function (w) { return w.id === f.by; })[0];
        if (!src || src.dead || src.left || src.hp <= 0) { delete u.conds.frightened; B.card(['{g}' + nm(B, u) + ' is not afraid any more: the gobbler is down.{/}'], 200); } // (the seat's call: the fright ends with the one it is of)
        else if ((B.round || 0) >= f.gobble.till) { delete u.conds.frightened; B.card(['{g}' + nm(B, u) + ' shakes off the gobble: the minute is up.{/}'], 200); }
        else {
          var sv = RU.save(u, f.gobble.ab, f.gobble.dc, false, 'frightened');
          B.card([nm(B, u) + ' steadies against the gobble: ' + f.gobble.ab.toUpperCase() + ' ' + RU.saveText(sv) + ' vs DC ' + f.gobble.dc + '  ' + (sv.ok ? '{n}NO LONGER AFRAID{/}' : '{g}still afraid{/}')], 220);
          if (sv.ok) delete u.conds.frightened;
        }
      }
      return r;
    };
  }

  // ================================================================== THE CRANBERRY CAN
  F.spillSquares = function (x, y) { return [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]; };
  F.spillAim = function (B, u) {
    var sp = u.spill, best = null, seen = {};
    B.units.forEach(function (w) {
      if (!G.hostile(u, w) || !G.standing(w) || w.object || w.left || G.dist(u, w) > sp.range) return;
      for (var dy = -1; dy <= 0; dy++) for (var dx = -1; dx <= 0; dx++) {
        var x0 = w.x + dx, y0 = w.y + dy, k = x0 + ',' + y0; if (seen[k]) continue; seen[k] = 1;
        var sq = F.spillSquares(x0, y0);
        if (!sq.every(function (q) { var s = G.map.at(q[0], q[1]); return s && s.walk; })) continue;
        var foes = 0, friends = 0, near = false;
        B.units.forEach(function (x) {
          if (!G.present(x) || x.object || x.left || !G.inArea(x, sq)) return;
          if (x === u || !G.hostile(u, x)) { friends++; return; }
          if (!G.standing(x) || x.conds.prone || x.noProne || RU.immuneTo(x, 'prone')) return;
          foes++; if (G.dist(u, x) <= 5) near = true;
        });
        var sc = foes * 10 - friends * 25 + (near ? 4 : 0);
        if (foes && !friends && (!best || sc > best.sc)) best = { x: x0, y: y0, sq: sq, foes: foes, near: near, sc: sc };
      }
    });
    return best;
  };
  F.spillNow = function* (B, u, aim) {
    var sp = u.spill;
    if (u.turn) u.turn.action = 0; u.spillSpent = true;
    if (B.focus) B.focus(u);
    u.facing = D.spr.facingFor(aim.x - u.x, aim.y - u.y);
    u.anim = D.spr && D.spr.anim(u.sheet, 'spill') ? 'spill' : 'attack'; u.animT = B.t;
    D.sfx('poison'); yield Math.min(36, (D.spr && D.spr.duration(u.sheet, 'spill')) || 30);
    var rec = { kind: 'grease', sauce: true, sq: aim.sq, by: u.id, dc: sp.dc, difficult: true, till: sp.rounds || 10 };
    B.grounds = (B.grounds || []).concat([rec]);
    if (FX()) FX().bloom(aim.x + 0.5, aim.y + 0.5, aim.sq, 'red');
    var caught = B.units.filter(function (w) { return w !== u && G.present(w) && w.hp > 0 && !w.object && !w.left && G.inArea(w, aim.sq) && !w.conds.prone && !w.noProne && !RU.immuneTo(w, 'prone'); });
    var lines = ['{r}' + Nm(B, u) + '{/}: ' + (sp.name || 'Sauce Spill').toUpperCase() + '  a 10-ft square of cranberry sauce  DEX DC ' + sp.dc + ' or prone  {g}(difficult; ten rounds){/}'];
    caught.forEach(function (w) {
      var sv = RU.save(w, 'dex', sp.dc);
      lines.push('  ' + nm(B, w) + ': DEX ' + RU.saveText(sv) + '  ' + (sv.ok ? '{n}keeps their feet{/}' : '{o}down in the sauce{/}'));
      if (!sv.ok) w.conds.prone = true;
    });
    if (!caught.length) lines.push('  {g}it slicks the ground{/}');
    B.card(lines.slice(0, 8), 340); yield 26;
    u.anim = 'idle'; u.animT = B.t;
  };

  // ================================================================== their turns: the gobble and the spill before the routine (traits.js TR.turn, as the breath)
  var turn0 = TR.turn;
  TR.turn = function* (B, u) {
    if (u.side === 'foe' && u.hp > 0 && !u.dead && RU.canAct(u) && u.turn && u.turn.action) {
      if (u.gobble && !u.gobbleSpent) {
        var fresh = F.gobbleCaught(B, u).filter(function (w) { return !(w.conds.frightened && w.conds.frightened.by === u.id) && !RU.immuneTo(w, 'frightened', u); });
        if (fresh.length >= 2) { yield* F.gobbleNow(B, u); return yield* turn0.apply(this, arguments); } // (its action spent: the routine may still move it)
      }
      if (u.spill && !u.spillSpent && !u.conds.prone) {
        var aim = F.spillAim(B, u);
        if (aim && (aim.foes >= 2 || aim.near)) { yield* F.spillNow(B, u, aim); return yield* turn0.apply(this, arguments); }
      }
    }
    return yield* turn0.apply(this, arguments);
  };

  // ================================================================== a missile flown as its sheet draws it (`fx: 'row:<row>'` on an attack: the can's berry, the mash's chunk)
  if (D.fx && D.fx.projectile) {
    var proj0 = D.fx.projectile;
    D.fx.projectile = function (from, to, kind, o) {
      var row = typeof kind === 'string' && kind.indexOf('row:') === 0 ? kind.slice(4) : null;
      if (!row || !from || !from.sheet || !D.spr.anim(from.sheet, row)) return proj0.call(this, from, to, row ? 'rock' : kind, o);
      var a = D.fx.at(from), b = D.fx.at(to), dist = Math.hypot(a.gx - b.gx, a.gy - b.gy), dur = Math.max(12, Math.round(dist * 3.2)), sheet = from.sheet;
      var ha = D.spr.unitTop(from) * 0.6, hb = D.spr.unitTop(to) * 0.5, arc = 10 + dist * 2;
      return D.fx.add({ kind: 'proj', blocking: true, dur: dur, draw: function (ctx) {
        var t = this.t / this.dur, gx = a.gx + (b.gx - a.gx) * t, gy = a.gy + (b.gy - a.gy) * t, g0 = a.gz + (b.gz - a.gz) * t;
        var c = D.iso.center(gx, gy, g0 + ha + (hb - ha) * t + Math.sin(t * Math.PI) * arc), s = D.iso.toScreen(c.x, c.y);
        D.spr.draw(ctx, sheet, row, 0, this.t, Math.round(s.x), Math.round(s.y));
      } });
    };
  }

  // ================================================================== the one inside the jacket, seen (Griz, 11-26: "if the visuals on the potato engulf were more like the gelatinous
  // cube/shambling mound we just did - where you can see the fella inside" -- over the art desk's "Hide the captive after closure"): js/ui.js draws the one inside sunk into
  // the bruiser as the mound's (insidePos, a little deeper), and this draws its jacket's two russet flaps closed round it from the sides, breathing, and a wisp of steam
  F.drawJacket = function (ctx, B, u, p, k) {
    // (from the bruiser's own foot line, p.base -- the one inside is drawn sunk below it and clipped there -- up over the lower two thirds of what shows of it)
    var top = D.spr.unitTop(u) * (k || 1), x = p.x, yb = (p.base != null ? p.base - 2 : p.y), seen = Math.max(14, top - (p.y - yb)), y = yb - 3, h = seen * 0.5, br = Math.sin(B.t / 12 + (u.id || '').length) * 1.5;
    var R = function (r, i) { return D.PAL.ramps[r][i]; };
    ctx.save(); ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.rect(x - 60, yb - 200, 120, 200); ctx.clip();
    [-1, 1].forEach(function (sd) {
      var ox = sd * (19 + br), ix = sd * (10 - br * 0.4); // (the lips held apart: the one inside shows between them -- his "where you can see the fella inside")
      ctx.beginPath(); ctx.moveTo(x + ox, y + 3);
      ctx.quadraticCurveTo(x + sd * (22 + br), y - h * 0.62, x + ix, y - h);       // the flap's outer curve up to its lip
      ctx.lineTo(x + ix - sd * 2, y - h * 0.52);
      ctx.quadraticCurveTo(x + sd * 13, y - h * 0.12, x + sd * 15, y + 3);         // its inner edge back down
      ctx.closePath();
      ctx.fillStyle = R('leather', 2); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = R('outline', 0); ctx.stroke();
      ctx.fillStyle = R('leather', 3); ctx.fillRect(Math.round(x + sd * 13) - 1, Math.round(y - h * 0.55), 2, 2); ctx.fillRect(Math.round(x + sd * 15) - 1, Math.round(y - h * 0.25), 2, 2); // (the peel's eyes)
      ctx.strokeStyle = R('stone', 7); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + ix - sd * 1, y - h + 2); ctx.lineTo(x + ix - sd * 2, y - h * 0.56); ctx.stroke(); // (the mash showing at the lip)
    });
    for (var i = 0; i < 2; i++) { // a wisp of steam off the top
      var ph = ((B.t + i * 23) % 46) / 46, sx = x - 4 + i * 8 + Math.sin((B.t + i * 11) / 7) * 2, sy = y - h - 6 - ph * 16;
      ctx.globalAlpha = 0.55 * (1 - ph); ctx.fillStyle = R('silver', 5); ctx.fillRect(Math.round(sx), Math.round(sy), 2, 3);
    }
    ctx.restore();
  };

  // ================================================================== the sauce's floor (js/looks.js draws a ground whose record is `sauce` with this tile when it has come)
  F.SAUCE = 'art/cranberrysauce_tile.png';
  F.sauceImg = function () { var im = D.images && D.images[F.SAUCE]; if (!im && D.spr && D.spr.load) { D.spr.load(F.SAUCE); im = D.images && D.images[F.SAUCE]; } return im && im.naturalWidth ? im : null; };
})();
