/* DEEP16 -- ENGULF BY THE SRD (2026-11-25, the seat engulf-1125; the grid's rules lane, its 2026-11-22 ~19:30Z item 2 -- the lanes desk's lean "build both by the SRD,
   with one engulfed condition they share", and Griz's answer: "sounds like both are enemy and player sharing a square conditions as well, with the cutter firing out some
   fancy wiring").

   ENGULFED (w.conds.engulfed = { by, kind, slot, at }): the held one is inside its holder's space -- on one of the holder's squares (its `slot`), holding no square of its
   own (grid.js G.occupant passes it by), restrained by it (conds.restrained { grapple, engulf, dc: the escape }), and it moves with the holder (battle.js moveAlong's step,
   B.forced and the sweep call E.sync). Out by BREAK FREE (magic.js breakFree: the escape's DC), by being pulled out (the cube: battle.js exec 'pullout'), or when the holder
   falls or is gone -- set down in a square within 5 ft of it, the one nearest its own friends (SRD 5.1: "a space of its choice within 5 feet"). As every grip on the grid,
   one at 0 HP is let go (battle.js sweep: the ai.js grip that goes slack). Its riders, as each SRD block says (data/foes.js `engulf`):

   THE SHAMBLING MOUND (srd/monsters/s.md): "makes two slam attacks. If both attacks hit a Medium or smaller target, the target is grappled (escape DC 14), and the
   shambling mound uses its Engulf on it" -- the two Slams' hits counted on the turn (the attack wrapper below, `engulfPair`); engulfed, it is blinded, restrained and
   unable to breathe; "a DC 14 Constitution saving throw at the start of each of the mound's turns or take 13 (2d8 + 4) bludgeoning damage" (E.turnStart, called from
   battle.js's turn loop for every holder, the hand's or the AI's); "only one creature engulfed at a time" -- a second one both Slams hit is grappled only (the seat's
   reading of the two sentences together).
   THE GELATINOUS CUBE (srd/monsters/o.md): its action Pseudopod or Engulf -- "The cube moves up to its speed. While doing so, it can enter Large or smaller creatures'
   spaces ... a DC 12 Dexterity saving throw. On a successful save, the creature can choose to be pushed 5 feet back or to the side of the cube ... On a failed save, the
   cube enters the creature's space, and the creature takes 10 (3d6) acid damage and is engulfed" (E.cubeEngulf: the move its own, not the turn's walk -- the seat's
   reading); "21 (6d6) acid damage at the start of each of the cube's turns"; out by "an action to make a DC 12 Strength check" (no Acrobatics); "A creature within 5 feet
   of the cube can take an action to pull a creature or object out of the cube ... a successful DC 12 Strength check, and the creature making the attempt takes 10 (3d6)
   acid damage"; Ooze Cube -- "Creatures inside the cube can be seen but have total cover" (G.los below: no line in or out but to the cube itself), "a creature that [enters
   its space] is subjected to the cube's Engulf and has disadvantage on the saving throw" (pushed in: magic.js M.push calls E.oozeIn), "one Large creature or up to four
   Medium or smaller creatures inside it at a time".

   THE LOOK (his "fancy wiring", engine first; a drawn effect is his to rule -- art-wanted 107 if he does): UI.insidePos -- the one inside drawn at its holder's middle,
   over the holder's figure: in the cube held up in the ooze, faint and tinted its green, drifting; in the mound sunk to the chest, faint, and the mound's vines drawn over it
   (E.drawVines, ui.js unitObj). The holder plays its own `engulf` row at the take, the cube its `digest` at the turn's acid. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, Battle = D.Battle, RU = D.rules;
  var E = D.engulf = {};
  var FX = function () { return D.fx; };

  // ------------------------------------------------------------------ who holds whom
  E.cfg = function (u) { return (u && !u.object && (u.engulfCfg || (u.kind && D.FOES && D.FOES[u.kind] && D.FOES[u.kind].engulf))) || null; };
  E.holderOf = function (w, units) {
    var e = w && w.conds && w.conds.engulfed; if (!e) return null;
    var us = units || (D.battle && D.battle.units) || []; for (var i = 0; i < us.length; i++) if (us[i].id === e.by) return us[i];
    return null;
  };
  E.inside = function (B, h) { return ((B && B.units) || []).filter(function (w) { return w !== h && w.conds && w.conds.engulfed && w.conds.engulfed.by === h.id && !w.left; }); };
  E.holds = function (B, h) { return !!(h && h.engulfing && E.inside(B, h).length); };
  // the one inside a holder whose inside is sealed (the cube's total cover): its holder, else null
  E.sealedIn = function (w) { if (!w || !w.conds || !w.conds.engulfed) return null; var h = E.holderOf(w); var c = h && E.cfg(h); return c && c.cover ? h : null; };
  // no line between a and b: one of them inside a cube the other is not (the cube itself excepted) -- SRD 5.1 Ooze Cube, total cover
  E.sealedFrom = function (a, b) {
    if (!a || !b || a === b) return false;
    var ha = a.conds ? E.sealedIn(a) : null, hb = b.conds ? E.sealedIn(b) : null;
    if (!ha && !hb) return false;
    if (ha && hb && ha === hb) return false; // (two inside the one cube)
    if (ha && ha === b) return false; if (hb && hb === a) return false; // (the cube and one inside it)
    return true;
  };
  // the room left: the mound one at a time; the cube one Large or four Medium or smaller (a Large one fills it)
  var cost = function (w) { return Battle.sizeCat(w) >= Battle.SIZE.L ? 4 : 1; };
  E.room = function (B, h) {
    var c = E.cfg(h); if (!c) return 0;
    var ins = E.inside(B, h).filter(function (w) { return !w.dead; });
    if (c.kind === 'mound') return ins.length ? 0 : 1;
    return Math.max(0, (c.room || 4) - ins.reduce(function (s, w) { return s + cost(w); }, 0));
  };
  E.fits = function (B, h, w) {
    var c = E.cfg(h); if (!c || !w || w === h || w.object || w.dead || w.left || w.riding || w.carriedBy || w.inClaws) return false;
    if (w.conds.engulfed) return false;
    if (Battle.sizeCat(w) > Battle.SIZE[c.size || 'M']) return false;
    if (RU.immuneTo(w, 'grappled') || RU.immuneTo(w, 'restrained')) return false;
    return E.room(B, h) >= cost(w);
  };

  // ------------------------------------------------------------------ where the one inside is: a square of the holder's, kept with it
  E.slotFor = function (B, h, w) {
    var s = h.size || 1, ws = w.size || 1; if (ws >= s) return [0, 0];
    var taken = {}; E.inside(B, h).forEach(function (o) { var sl = o !== w && o.conds.engulfed.slot; if (sl) taken[sl.join()] = 1; });
    var best = null, bd = 1e9;
    for (var j = 0; j <= s - ws; j++) for (var i = 0; i <= s - ws; i++) {
      if (taken[i + ',' + j]) continue;
      var d = Math.hypot(h.x + i - w.x, h.y + j - w.y); if (d < bd - 1e-9) { bd = d; best = [i, j]; }
    }
    return best || [0, 0];
  };
  E.sync = function (B, h) {
    if (!h) return;
    E.inside(B, h).forEach(function (w) {
      var e = w.conds.engulfed, sl = e.slot || (e.slot = E.slotFor(B, h, w));
      w.x = h.x + sl[0]; w.y = h.y + sl[1]; e.at = [w.x, w.y];
      if (w.fz != null) w.fz = h.fz != null ? h.fz : null;
    });
  };
  function nameOf(u) { return u.side === 'foe' ? Battle.nm(u, true) : u.name; }
  function the(u) { return Battle.nm(u, true); }

  // ------------------------------------------------------------------ in and out
  E.take = function* (B, h, w, o) {
    o = o || {};
    var c = E.cfg(h); if (!c || !E.fits(B, h, w)) return false;
    var fx = w.x, fy = w.y;
    w.conds.engulfed = { by: h.id, kind: c.kind, slot: null };
    w.conds.restrained = { dc: c.escape, by: h.id, grapple: true, engulf: true, str: !!c.str };
    if (c.blind && !RU.immuneTo(w, 'blinded') && !w.conds.blinded) w.conds.blinded = { by: h.id, held: true };
    delete w.conds.hidden; if (w.conds.dodge) delete w.conds.dodge;
    if (w.hang) delete w.hang;
    h.holding = (h.holding || []).filter(function (x) { return x !== w; }).concat([w]);
    h.engulfing = true;
    if (!h.huntsEng) { // (its blows go at those outside while one is near enough to reach this turn, else at the one inside -- ai.js heroes reads u.hunts; it paced with only the one inside in reach)
      var prev = h.hunts; h.huntsEng = true;
      h.hunts = function (x) {
        if (prev && !prev(x)) return false;
        if (!(x && x.conds && x.conds.engulfed && x.conds.engulfed.by === h.id)) return true;
        var BB = D.battle; return !(BB && BB.units.some(function (o) { return o !== x && G.hostile(h, o) && G.standing(o) && !o.object && !(o.conds && o.conds.engulfed) && G.dist(h, o) <= (h.speed || 0) + G.reachOf(h); }));
      };
    }
    w.conds.engulfed.slot = E.slotFor(B, h, w);
    E.sync(B, h);
    w.tween = { fx: fx, fy: fy, fz: G.gzAt(w, fx, fy), t: 0, dur: B.pace ? B.pace(14, true) : 14, mode: 'walk' }; // (drawn going in: UI.insidePos eases it there)
    w.anim = 'idle'; w.animT = B.t;
    if (D.spr.anim(h.sheet, 'engulf')) { h.anim = 'engulf'; h.animT = B.t; }
    D.sfx('poison'); if (FX()) FX().sparkle(w, c.kind === 'cube' ? 'blue' : 'moss', 16);
    var riders = c.kind === 'mound' ? 'BLINDED, RESTRAINED, no air' : 'RESTRAINED, no air';
    B.card(['{r}' + the(h) + '{/} ' + (c.kind === 'mound' ? 'folds over ' : 'takes in ') + nameOf(w) + ': {o}ENGULFED{/} -- ' + riders + '.  {g}(' +
      (c.kind === 'mound' ? 'grappled, escape DC ' + c.escape + '; a DC ' + c.start.dc + ' CON save at the start of each of its turns or ' + c.start.dice + '+' + c.start.mod + ' ' + c.start.type
        : c.start.dice + ' ' + c.start.type + ' at the start of each of its turns; out by a DC ' + c.escape + ' STR check, or pulled out by one beside it') + '){/}'], o.quick ? 160 : 320);
    yield o.quick ? 10 : 30;
    return true;
  };
  // out of it: the condition gone, set down beside the holder (`stay`: moved out some other way -- left where it went)
  E.free = function (B, w, o) {
    o = o || {};
    var e = w && w.conds && w.conds.engulfed; if (!e) return;
    var h = E.holderOf(w, B.units);
    delete w.conds.engulfed;
    var r = w.conds.restrained; if (r && r.engulf && (!h || r.by === h.id)) delete w.conds.restrained;
    var bl = w.conds.blinded; if (bl && bl.held && h && bl.by === h.id) delete w.conds.blinded;
    if (h) { h.holding = (h.holding || []).filter(function (x) { return x !== w; }); if (!E.inside(B, h).length) delete h.engulfing; }
    if (o.stay || w.left) return;
    var moved = e.at && (w.x !== e.at[0] || w.y !== e.at[1]) && h && !(w.x >= h.x && w.y >= h.y && w.x < h.x + (h.size || 1) && w.y < h.y + (h.size || 1));
    if (moved) return; // (it went out some other way -- a teleport: it stays where it went)
    var hx = h ? h.x : w.x, hy = h ? h.y : w.y, hs = h ? h.size || 1 : 1;
    var friends = B.units.filter(function (x) { return x !== w && x.side === w.side && G.standing(x) && !(x.conds && x.conds.engulfed); });
    var best = null, bs = 1e9, x0 = w.x, y0 = w.y, ws = w.size || 1;
    var x00 = w.x; w.x = -99; // (its own body out of the way of the test)
    for (var rr = 1; rr <= 6 && !best; rr++) for (var y = hy - rr - ws + 1; y <= hy + hs + rr - 1; y++) for (var x = hx - rr - ws + 1; x <= hx + hs + rr - 1; x++) {
      if (!G.canStand(w, x, y)) continue;
      if (x + ws > hx && y + ws > hy && x < hx + hs && y < hy + hs) continue; // (not in its space)
      if (h && G.dist(h, w, null, null, x, y) > 5 * rr) continue;
      var fd = friends.length ? Math.min.apply(null, friends.map(function (f) { return Math.max(Math.abs(f.x - x), Math.abs(f.y - y)); })) : 0;
      var sc = fd * 10 + Math.hypot(x - x0, y - y0);
      if (sc < bs - 1e-9) { bs = sc; best = [x, y]; }
    }
    w.x = x00;
    if (!best) return;
    w.tween = { fx: x0, fy: y0, fz: G.gzAt(w, x0, y0) + 4, t: 0, dur: B.pace ? B.pace(12, true) : 12, mode: 'walk' };
    w.x = best[0]; w.y = best[1]; w.anim = 'idle'; w.animT = B.t;
    if (B.forced) B.forced(w);
  };

  // ------------------------------------------------------------------ the start of the holder's turn (battle.js's turn loop, every holder)
  E.turnStart = function* (B, h) {
    var c = E.cfg(h); if (!c || !h.engulfing) return;
    E.check(B);
    var ins = E.inside(B, h).filter(function (w) { return !w.dead && w.hp > 0; }); if (!ins.length || h.dead || h.hp <= 0) return;
    if (B.focus) B.focus(h);
    for (var i = 0; i < ins.length; i++) {
      var w = ins[i]; if (w.dead || w.hp <= 0 || !w.conds.engulfed) continue;
      var st = c.start;
      if (st.ab) { // (the mound: a CON save or the crush)
        var sv = RU.save(w, st.ab, st.dc), roll = D.roll(st.dice), n = roll.total + (st.mod || 0);
        if (D.spr.anim(h.sheet, 'engulf')) { h.anim = 'engulf'; h.animT = B.t; }
        B.card(['{r}' + the(h) + '{/} crushes ' + nameOf(w) + ' inside it, and there is no air: ' + st.ab.toUpperCase() + ' ' + RU.saveText(sv) + ' vs DC ' + st.dc + '  ' +
          (sv.ok ? '{n}SAVED{/}' : st.dice + '+' + st.mod + ' ' + RU.fmtRolls(roll.rolls) + ' = {r}' + n + '{/} ' + st.type)], 320);
        if (!sv.ok) { D.sfx('hit'); if (FX()) FX().slash(w, D.PAL.ramps.red[4]); B.hurt(w, n, st.type, {}); }
      } else { // (the cube: the acid, no save)
        var ra = D.roll(st.dice), na = ra.total + (st.mod || 0);
        if (D.spr.anim(h.sheet, 'digest')) { h.anim = 'digest'; h.animT = B.t; }
        B.card(['{r}' + the(h) + '{/} digests ' + nameOf(w) + ': ' + st.dice + ' ' + RU.fmtRolls(ra.rolls) + ' = {r}' + na + '{/} ' + st.type + '.  {g}(out by a DC ' + c.escape + ' STR check, or pulled out by one beside it){/}'], 320);
        D.sfx('poison'); if (FX()) FX().sparkle(w, 'moss', 12); B.hurt(w, na, st.type, {});
      }
      yield 30;
    }
    E.check(B);
  };

  // ------------------------------------------------------------------ the mound's two Slams: both hitting one Medium or smaller -> grappled and engulfed
  E.pairHit = function* (B, h, w) {
    var T = h.turn; if (!T) return;
    var pr = T.engulfPair = T.engulfPair || {}; pr[w.id] = (pr[w.id] || 0) + 1;
    if (pr[w.id] !== 2) return;
    var c = E.cfg(h); if (!c || w.dead || w.hp <= 0 || w.object || w.conds.engulfed) return;
    if (Battle.sizeCat(w) > Battle.SIZE[c.size || 'M'] || RU.immuneTo(w, 'grappled')) return;
    if (E.fits(B, h, w)) { yield* E.take(B, h, w); return; }
    // one inside already: grappled only (escape DC 14), held beside it
    var r0 = w.conds.restrained; if (r0 && r0.by === h.id) return;
    if (r0 && !r0.only) return; // (held fast by something else already)
    w.conds.restrained = { dc: c.escape, by: h.id, grapple: true, only: true };
    h.holding = (h.holding || []).filter(function (x) { return x !== w; }).concat([w]);
    D.sfx('poison'); if (FX()) FX().ring(w, 'bone', 22);
    B.card(['{r}' + the(h) + '{/} has ' + nameOf(w) + ': {o}GRAPPLED{/}  {g}(escape DC ' + c.escape + ', an action; it has one inside already -- one at a time){/}'], 260);
    yield 24;
  };

  // ------------------------------------------------------------------ the cube's Engulf: its action, a move into their squares
  // the squares its foot may stand on as it goes: open ground, and no one in it but those it may take in (or has)
  function footOK(B, h, x, y) {
    if (!G.canStand(h, x, y, { ghost: true })) return false;
    var f = G.foot(h, x, y);
    for (var i = 0; i < B.units.length; i++) {
      var w = B.units[i]; if (w === h || !G.present(w) || w.riding || w.carriedBy || w.inClaws || (w.conds && w.conds.engulfed)) continue;
      var s = w.size || 1, hit = f.some(function (q) { return q[0] >= w.x && q[1] >= w.y && q[0] < w.x + s && q[1] < w.y + s; });
      if (!hit) continue;
      if (!G.hostile(h, w) || w.object || Battle.sizeCat(w) > Battle.SIZE.L) return false;
    }
    return true;
  }
  function under(B, h, x, y) { // (the creatures its foot at x, y covers)
    var f = G.foot(h, x, y);
    return B.units.filter(function (w) { if (w === h || !G.present(w) || w.dead || w.riding || w.carriedBy || w.inClaws || (w.conds && w.conds.engulfed)) return false; var s = w.size || 1; return f.some(function (q) { return q[0] >= w.x && q[1] >= w.y && q[0] < w.x + s && q[1] < w.y + s; }); });
  }
  // the way: the fewest steps to where its foot covers the most it can take in, within its speed
  E.plan = function (B, h, want, ft) {
    var c = E.cfg(h); if (!c) return null;
    var budget = ft != null ? ft : h.speed || 15, key = function (x, y) { return x + ',' + y; }, seen = {}, q = [{ x: h.x, y: h.y, cost: 0, path: [] }], best = null;
    seen[key(h.x, h.y)] = 0;
    while (q.length) {
      var n = q.shift();
      var cov = n.path.length ? under(B, h, n.x, n.y).filter(function (w) { return want(w); }) : [];
      if (cov.length) {
        var sc = Math.min(cov.length, E.room(B, h)) * 1000 - n.cost - cov.reduce(function (s, w) { return s + w.hp; }, 0) / 1000;
        if (!best || sc > best.sc) best = { x: n.x, y: n.y, path: n.path, sc: sc, cov: cov };
      }
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        var nx = n.x + dx, ny = n.y + dy; if (!footOK(B, h, nx, ny)) continue;
        var sc0 = G.stepCost(h, n.x, n.y, nx, ny, { ghost: true }); if (!isFinite(sc0)) continue;
        var nc = n.cost + sc0; if (nc > budget) continue;
        var k = key(nx, ny); if (seen[k] != null && seen[k] <= nc) continue; seen[k] = nc;
        q.push({ x: nx, y: ny, cost: nc, path: n.path.concat([[nx, ny]]) });
      }
    }
    return best;
  };
  // one under its foot as it comes in: the DEX save (`dis`: entered it, the Ooze Cube's disadvantage) -- pushed aside on a success, taken in on a failure
  E.enterSave = function* (B, h, w, o) {
    o = o || {};
    var c = E.cfg(h), sv = RU.save(w, c.save.ab, c.save.dc, null, null, null, !!o.dis);
    var line = '  ' + nameOf(w) + ': ' + c.save.ab.toUpperCase() + ' ' + RU.saveText(sv) + ' vs DC ' + c.save.dc + (o.dis ? ' {o}(disadvantage: into the cube){/}' : '');
    var to = null;
    if (sv.ok && !o.noPush) to = E.pushSq(B, h, w, o.dir);
    if (sv.ok && to) {
      B.card([line + '  {n}SAVED{/} -- pushed 5 ft clear of it'], 260);
      w.tween = { fx: w.x, fy: w.y, fz: G.gzAt(w, w.x, w.y), t: 0, dur: B.pace ? B.pace(10, true) : 10 }; w.x = to[0]; w.y = to[1]; if (B.forced) B.forced(w);
      yield 18; return false;
    }
    if (sv.ok && !o.noPush) line += '  {o}SAVED, but there is nowhere to be pushed{/}';
    var roll = D.roll(c.dice), n = roll.total + (c.mod || 0);
    B.card([line + (sv.ok ? '' : '  {o}FAILED{/}') + '  ' + c.dice + ' ' + RU.fmtRolls(roll.rolls) + ' = {r}' + n + '{/} ' + c.type], 300);
    D.sfx('hit'); if (FX()) FX().sparkle(w, 'moss', 12); B.hurt(w, n, c.type, {});
    yield 20;
    if (!w.dead && w.hp > 0 && E.fits(B, h, w)) yield* E.take(B, h, w, { quick: true });
    return true;
  };
  // pushed 5 ft back or to the side of it: an open square beside it, out of the cube's space, back the way the cube came at it first
  E.pushSq = function (B, h, w, dir) {
    var s = h.size || 1, cx = h.x + (s - 1) / 2, cy = h.y + (s - 1) / 2, best = null, bd = -1e9;
    var x0 = w.x, y0 = w.y; w.x = -99;
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      var x = x0 + dx, y = y0 + dy;
      if (x >= h.x && y >= h.y && x < h.x + s && y < h.y + s) continue;
      if (!G.canStand(w, x, y)) continue;
      var away = Math.hypot(x - cx, y - cy), along = dir ? dx * dir[0] + dy * dir[1] : 0;
      var sc = away + along * 0.5; if (sc > bd) { bd = sc; best = [x, y]; }
    }
    w.x = x0;
    return best;
  };
  // the AI's Engulf, when someone it can take in is in its move: true when the action went on it
  E.cubeEngulf = function* (B, h, hs) {
    var c = E.cfg(h), T = h.turn; if (!c || !c.move || !T || !T.action || h.conds.restrained || h.conds.grappled || !RU.canAct(h)) return false;
    if (E.room(B, h) <= 0) return false;
    var want = function (w) { return G.hostile(h, w) && !w.object && !w.bystander && G.standing(w) && E.fits(B, h, w) && (!hs || hs.indexOf(w) >= 0 || !hs.length); };
    var p = E.plan(B, h, want, h.speed || 15); if (!p) return false;
    T.action = 0;
    if (B.focus) B.focus(h);
    if (D.spr.anim(h.sheet, 'engulf')) { h.anim = 'engulf'; h.animT = B.t; }
    B.card(['{r}' + the(h) + '{/}: ENGULF -- it slides over ' + p.cov.map(nameOf).join(' and ') + '.  DEX DC ' + c.save.dc + ' each'], 320);
    yield 24;
    var inc = h.incorporeal, got = [];
    for (var i = 0; i < p.path.length; i++) {
      if (h.dead || h.hp <= 0 || h.conds.restrained || !RU.canAct(h)) break;
      var q = p.path[i];
      if (!footOK(B, h, q[0], q[1])) break; // (the way shut since it planned: one pushed into it)
      var dir = [Math.sign(q[0] - h.x), Math.sign(q[1] - h.y)];
      h.incorporeal = true; // (through the ones it goes over: grid.js canPass -- this step alone)
      try { yield* B.moveAlong(h, [q], { gait: 'walk' }); } finally { if (inc) h.incorporeal = inc; else delete h.incorporeal; }
      E.sync(B, h);
      var news = under(B, h, h.x, h.y);
      for (var k = 0; k < news.length; k++) {
        var w = news[k]; if (w.conds.engulfed || got.indexOf(w) >= 0) continue;
        if (!E.fits(B, h, w)) { // (no room for it, or too big: it cannot go on into that square -- back off it)
          var pb = E.pushSq(B, h, w, dir); if (pb) { w.x = pb[0]; w.y = pb[1]; if (B.forced) B.forced(w); continue; }
          continue;
        }
        if (yield* E.enterSave(B, h, w, { dir: dir })) got.push(w);
      }
    }
    E.sync(B, h);
    return true;
  };
  // Ooze Cube: one pushed into its space (js/magic.js M.push) -- the Engulf at disadvantage; on a failure it is inside, on a success it stays where the push left it
  E.oozeAt = function (B, x, y, w) {
    var h = G.occupant(x, y, w); var c = h && E.cfg(h);
    return c && c.ooze && h !== w && E.fits(B, h, w) ? h : null;
  };
  E.oozeIn = function (B, h, w) {
    var c = E.cfg(h); if (!c) return false;
    var sv = RU.save(w, c.save.ab, c.save.dc, null, null, null, true);
    var line = '{r}' + nameOf(w) + '{/} goes into ' + Battle.theWord(h) + ': ' + c.save.ab.toUpperCase() + ' ' + RU.saveText(sv) + ' vs DC ' + c.save.dc + ' {o}(disadvantage){/}';
    if (sv.ok) { B.card([line + '  {n}SAVED{/} -- it pulls back out'], 260); return false; }
    var roll = D.roll(c.dice), n = roll.total + (c.mod || 0);
    B.card([line + '  {o}FAILED{/}  ' + c.dice + ' ' + RU.fmtRolls(roll.rolls) + ' = {r}' + n + '{/} ' + c.type], 300);
    B.hurt(w, n, c.type, {});
    if (w.dead || w.hp <= 0) return false;
    var g = E.take(B, h, w, { quick: true }), r; do { r = g.next(); } while (!r.done); // (no beat of its own: inside a push)
    return true;
  };

  // ------------------------------------------------------------------ the housekeeping: the one inside kept with its holder, let go when the holder is gone
  E.check = function (B) {
    if (!B || !B.units) return;
    B.units.forEach(function (w) {
      var e = w.conds && w.conds.engulfed; if (!e) return;
      var h = E.holderOf(w, B.units);
      if (!h || h.dead || h.left || h.fled || h.hp <= 0) { var hn = h; E.free(B, w); if (hn) B.card(['{g}' + nameOf(w) + ' is out of ' + Battle.theWord(hn) + '.{/}'], 200); return; }
      if (w.dead || w.left) { E.free(B, w, { stay: true }); return; }
      if (w.hp <= 0) { E.free(B, w); B.card(['{g}' + Battle.theWord(h).replace(/^t/, 'T') + ' lets ' + nameOf(w) + ' go, limp.{/}'], 200); return; }
      if (!w.conds.restrained || w.conds.restrained.by !== h.id) { E.free(B, w); return; } // (the hold gone some other way: Freedom of Movement)
      var inF = w.x >= h.x && w.y >= h.y && w.x < h.x + (h.size || 1) && w.y < h.y + (h.size || 1);
      if (!inF && e.at && (w.x !== e.at[0] || w.y !== e.at[1])) { E.free(B, w, { stay: true }); B.card(['{g}' + nameOf(w) + ' is out of ' + Battle.theWord(h) + '.{/}'], 200); return; } // (out some other way: a teleport)
    });
    B.units.forEach(function (h) { if (h.engulfing) E.sync(B, h); });
  };

  // ------------------------------------------------------------------ the engine's hooks
  // release (a holder's grip let go however -- breakFree's success, PULL OUT, the holder incapacitated): the ones inside set down beside it
  var rel0 = Battle.prototype.release;
  Battle.prototype.release = function (u, only) {
    var self = this, ins = E.inside(this, u).filter(function (w) { return !only || w === only; });
    var r = rel0.apply(this, arguments);
    ins.forEach(function (w) { if (w.conds.engulfed) E.free(self, w); });
    return r;
  };
  // the sweep after every turn: kept with its holder first
  var sw0 = Battle.prototype.sweep;
  Battle.prototype.sweep = function () { E.check(this); return sw0.apply(this, arguments); };
  // a holder moved by another's doing (a push): the ones inside go with it
  var fo0 = Battle.prototype.forced;
  Battle.prototype.forced = function (w) { if (w && w.engulfing) E.sync(this, w); return fo0.apply(this, arguments); };
  // the blows: none into or out of the cube but between it and those inside; the mound's two Slams counted
  var at0 = Battle.prototype.attack;
  Battle.prototype.attack = function* (att, tgt, atk, o) {
    if (att && tgt && E.sealedFrom(att, tgt)) {
      this.card(['{g}' + nameOf(att) + ' cannot reach ' + nameOf(tgt) + ': inside ' + Battle.theWord(E.sealedIn(tgt) || E.sealedIn(att)) + ', total cover.{/}'], 160);
      return;
    }
    var pair = atk && atk.engulfPair && tgt && !(o && o.oa) && this.active === att && att.turn ? tgt : null, hit = false;
    if (pair) { o = Object.assign({}, o || {}); var oh = o.onHit; o.onHit = function () { hit = true; if (oh) return oh.apply(this, arguments); }; }
    var r = yield* at0.call(this, att, tgt, atk, o);
    if (pair && hit && !att.dead && att.hp > 0) yield* E.pairHit(this, att, pair);
    return r;
  };
  Battle.prototype.canHit = (function (ch0) { return function (u, w) { if (E.sealedFrom(u, w)) return false; return ch0.apply(this, arguments); }; })(Battle.prototype.canHit);
  // total cover: no line into the cube or out of it, but between it and those inside (SRD 5.1 Ooze Cube: "can be seen but have total cover" -- no attack or spell aimed through it)
  var los0 = G.los;
  G.los = function (a, b) {
    var r = los0.apply(this, arguments);
    if (!r.clear || !a || !b || (!(a.conds && a.conds.engulfed) && !(b.conds && b.conds.engulfed))) return r;
    if (E.sealedFrom(a, b)) return { clear: false, cover: 0, why: 'inside the cube: total cover', sealed: true };
    return r;
  };
  // PULL OUT (battle.js exec 'pullout', the water elemental's): one of ours inside a cube that names a pull, the cube within 5 ft
  var wh0 = Battle.whelmed;
  Battle.whelmed = function (u, units) {
    var out = wh0.apply(this, arguments);
    units.forEach(function (w) {
      var e = w.conds && w.conds.engulfed; if (!e || w === u || G.hostile(u, w) || w.dead || out.indexOf(w) >= 0) return;
      var h = E.holderOf(w, units), c = h && E.cfg(h);
      if (c && c.pull && G.standing(h) && !(u.conds && u.conds.engulfed) && G.dist(u, h) <= 5) out.push(w);
    });
    return out;
  };
  // the one inside a holder with no cover (the mound) is touched through its square: ui.js heldAll (a heal, an item) and its reach to the holder
  E.heldFor = function (B, u, w) { if (!w || !G.hostile(u, w)) return []; var c = E.cfg(w); if (!c || c.cover) return []; return E.inside(B, w).filter(function (h) { return h.side === u.side && !h.dead; }); };
  E.near = function (B, u, h) { var by = E.holderOf(h, B.units); return !!by && G.dist(u, by) <= 5; };

  // ------------------------------------------------------------------ the look
  // the vines over one inside the mound (ui.js unitObj, after its figure): five dark strands across it, swaying, from the heap's sides
  E.drawVines = function (ctx, B, u, p, k) {
    var t = B.t / 9 + (u.id || '').length, top = D.spr.unitTop(u) * (k || 1);
    var cols = ['#2f4a1c', '#3d5d22', '#25391a', '#4a6a2e', '#334f1f'];
    ctx.save(); ctx.lineCap = 'round';
    for (var i = 0; i < 5; i++) {
      var y0 = p.y - top * (0.15 + 0.15 * i), sw = Math.sin(t + i * 1.7) * 2.5, side = i % 2 ? 1 : -1;
      ctx.strokeStyle = cols[i]; ctx.lineWidth = i === 2 ? 3 : 2;
      ctx.beginPath(); ctx.moveTo(p.x + side * 16, y0 + 4 + sw);
      ctx.quadraticCurveTo(p.x + sw, y0 - 5 + (i % 3) * 3, p.x - side * 15, y0 + 2 - sw);
      ctx.stroke();
    }
    ctx.restore();
  };
})();
