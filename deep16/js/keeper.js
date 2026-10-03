/* DEEP16 — THE KEEPER of the Flooded Stair (handoff-2026-10-02-the-keeper.md, Griz's design 10-02 and his answers 10-03). Ours, not the SRD's: the signature rules
   below are named as such in invented.json (#the-keeper). The numbers are in K.CFG, so the bench can move them.
   - ABOVE the water (its own squares in the pool) its action is a Slam at anyone in its 10 ft (data/foes.js keeper: DC 15 STR or prone) and its bonus action,
     every round, the WAVE: up the stair's lane toward the party, STR DC 13 or prone; it bounces off the front wall (the Ice Wall's row, else the exit) and the
     backwash sweeps every prone creature 10 ft toward the deep, where "pushed by the wave, you stand up free" -- no movement spent to rise.
   - WASHED INTO THE DEEP (a map's `deeps`): restrained, and the Keeper pours itself into the water around that one -- AC 10, its bonus action ACTIVE SUFFOCATION.
     Drowning is ours: at the start of the victim's turn 1d6 less its CON bonus (at least 1) while its head is under (not on a `deeps` square); rolled twice after
     an Active Suffocation. A blow to the Keeper in the water is a concentration check (CON, DC 10 or half the damage): lost, the victim is free of the hold but
     still drowning till its head is over water.
   - THE ICE WALL (3 uses; READY, then a hero moving toward the exit springs it): see the second half of this file. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx;
  var K = D.keeper = {};
  // THE POSES (Griz: neither Grok sheet is canon, any pose from either): each is a row of the sheet keeper_p2 (art/keeper_p2.json): a_* is the first Grok sheet's, b_* the
  // second's -- idle, wall, dive, wave -- `stand` (the standing idle: the third sheet's poses, one a facing), slam_b3a (the second sheet's dive with the first sheet's frame 3, the arcing
  // wave, for its third: the default, Griz 10-03), slam_ab (the first sheet's dive to the launch, the second's the smash and the return), slam_ba (the other way about).
  // Swap one in the pane with D16.keeper.pose({ slam: 'slam_ba' }) -- or any row: pose({ idle: 'b_idle', wave: 'a_wave', wall: 'b_wall', slam: 'b_dive' }); it holds for the page
  K.POSE = { idle: 'stand', slam: 'slam_b3a', wave: 'b_wave', wall: 'a_wall', hurt: 'hurt_b', die: 'die_b' };
  K.pose = function (o) {
    if (o) Object.keys(o).forEach(function (k) { K.POSE[k] = o[k]; });
    var sh = D.SHEETS && D.SHEETS.keeper_p2; if (!sh) return K.POSE;
    var link = { idle: 'idle', walk: 'idle', attack: 'slam', wave: 'wave', cast: 'wave', wall: 'wall', hurt: 'hurt', die: 'die' };
    Object.keys(link).forEach(function (a) { var row = sh.anims[K.POSE[link[a]]]; if (row) sh.anims[a] = Object.assign({}, row); });
    return K.POSE;
  };
  K.CFG = { waveDC: 13, sweep: 2, deepAC: 10, drown: '1d6', concMin: 10, wallUses: 3, wallHP: 30, wallAC: 12, hideAfter: true, iceDC: 7, oaWave: false, freezeNeeds: 'all' }; // (hideAfter: back into the water, unseen, when its turn ends -- Griz 10-03 "he is invisible in water"; iceDC: the save to break out of ice, a bonus action then an action; oaWave: its opportunity attack a wave that pushes the provoker toward the deep -- not ruled, off; freezeNeeds: all four of its squares frozen to hold it (or 'any')) // (sweep: squares of backwash per wave, 2 = 10 ft; Griz 10-03)

  function def() { return (G.map && G.map.def) || {}; }
  function Nm(B, u) { return u.side === 'foe' ? (u.named ? B.shortName(u) : 'The ' + B.shortName(u)) : u.name; }
  function st(B) { return B.kp || (B.kp = { uses: K.CFG.wallUses, ready: null, wall: null, ice: {}, waves: 0 }); }
  function keeperOf(B) { return B.units.filter(function (w) { return w.kind === 'keeper' && w.side === 'foe' && !w.dead && w.hp > 0; })[0] || null; }
  function foesOf(B, u) { return B.units.filter(function (w) { return w.side !== u.side && G.standing(w) && !(w.riding && !w.attached); }); }
  function tween(B, u) { u.tween = { fx: u.x, fy: u.y, fz: G.gzAt(u, u.x, u.y), t: 0, dur: B.pace ? B.pace(12, true) : 12 }; }

  K.isDeep = function (x, y) { // (a frozen square is a footing, not the deep: the head is over the ice)
    var B = D.battle; if (B && B.kp && B.kp.ice[x + ',' + y]) return false;
    return (def().deeps || []).some(function (p) { return p[0] === x && p[1] === y; });
  };
  function inLane(x, y) { var l = def().lane; return !!l && x >= l.x0 && x <= l.x1 && y >= l.y0 && y <= l.y1; }
  function deepD(x, y) { var best = 1e9; (def().deeps || []).forEach(function (p) { best = Math.min(best, Math.max(Math.abs(p[0] - x), Math.abs(p[1] - y)) + 0.01 * Math.hypot(p[0] - x, p[1] - y)); }); return best; }
  // the stair's front wall: the Ice Wall's row if it stands, else the exit
  function frontRow(B) { var S = st(B); return S.wall ? S.wall.cy : (def().lane || {}).y1; }

  // ------------------------------------------------------------------ the Wave: the save, the bounce, the sweep
  // a hero on frozen water is anchored (Griz: "defensive icing approved"); set in K.freeze below
  function anchored(B, v) { return !!st(B).ice[v.x + ',' + v.y]; }
  function sweep(B, v) {
    var moved = 0;
    for (var i = 0; i < K.CFG.sweep; i++) {
      var best = null, bd = deepD(v.x, v.y);
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        var nx = v.x + dx, ny = v.y + dy;
        if (!G.canStand(v, nx, ny)) continue;
        var d = deepD(nx, ny); if (d < bd - 1e-9) { bd = d; best = [nx, ny]; }
      }
      if (!best) break;
      tween(B, v); v.x = best[0]; v.y = best[1]; moved++;
    }
    return moved;
  }
  K.wave = function* (B, u) {
    var S = st(B), l = def().lane, y1 = frontRow(B) - (S.wall ? 1 : 0);
    var top = u.y + (u.size || 1), hit = foesOf(B, u).filter(function (w) { return !w.conds.hidden && w.x >= l.x0 && w.x <= l.x1 && w.y >= top && w.y <= y1; }); // (the lane: the stair's width, from the water it rises in to the front wall -- a hero in the pool below the Keeper is in it too)
    var lying = foesOf(B, u).filter(function (w) { return w.conds.prone && w.x <= l.x1 + 6 && w.y <= y1; });
    if (!hit.length && !lying.length) return false;
    S.waves++;
    B.focus(u); D.sfx('splash'); u.anim = 'wave'; u.animT = B.t;
    var rows = [], lane = [];
    for (var yy = top; yy <= y1; yy++) for (var xx = l.x0; xx <= l.x1; xx++) { var q = G.map.at(xx, yy); if (q && q.open) lane.push([xx, yy]); }
    if (lane.length) FX.keeperWave(lane, top, y1);
    rows.push('{r}' + Nm(B, u) + '{/} sends a wave up the stair.  {g}(the Wave, a bonus action: STR DC ' + K.CFG.waveDC + ' or prone){/}');
    hit.forEach(function (w) {
      if (w.conds.prone) return;
      var sv = RU.save(w, 'str', K.CFG.waveDC);
      if (sv.ok || w.noProne || RU.immuneTo(w, 'prone')) rows.push('  ' + w.name + ': STR ' + RU.saveText(sv) + ' vs DC ' + K.CFG.waveDC + '  {n}keeps its feet{/}');
      else { w.conds.prone = true; rows.push('  ' + w.name + ': STR ' + RU.saveText(sv) + ' vs DC ' + K.CFG.waveDC + '  {o}KNOCKED DOWN{/}'); }
    });
    B.card(rows, 260); yield 30;
    // the bounce off the front wall: every prone creature (not on frozen water) is swept toward the deep, and stands up free
    var swept = foesOf(B, u).filter(function (w) { return w.conds.prone && w.y <= y1; }), out = [], deep = [];
    swept.forEach(function (w) {
      if (anchored(B, w)) { out.push('  ' + w.name + ' is held by the ice underfoot: the backwash goes round.'); return; }
      if (w.conds.restrained) return;
      var n = sweep(B, w);
      if (n) { delete w.conds.prone; out.push('  ' + w.name + ' is swept ' + (n * 5) + ' ft toward the deep, and stands.  {g}(pushed by the wave: up free){/}'); if (K.isDeep(w.x, w.y)) deep.push(w); }
    });
    if (out.length) { B.card(['{c}The wave bounces off the ' + (S.wall ? 'ice' : 'wall') + ' and drags back.{/}'].concat(out), 260); yield 30; }
    for (var i = 0; i < deep.length; i++) { if (!u.flooding && G.standing(deep[i])) yield* K.flood(B, u, deep[i]); }
    u.anim = 'idle'; u.animT = B.t; // (the cast is over: back to the standing idle)
    return true;
  };

  // ------------------------------------------------------------------ washed into the deep: it pours itself into the water around the one it has
  function nearestSpot(B, u, v) {
    var best = null, bd = 1e9;
    for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) {
      if (!G.canStand(u, x, y) || G.dist(u, v, x, y) > 5) continue;
      var d = Math.max(Math.abs(x - u.x), Math.abs(y - u.y)); if (d < bd) { bd = d; best = [x, y]; }
    }
    return best;
  }
  K.flood = function* (B, u, v) {
    if (u.flooding || !G.standing(v) || RU.immuneTo(v, 'grappled')) return;
    v.conds.restrained = { dc: 13, by: u.id, grapple: true, water: true };
    v.conds.drowning = { by: u.id, twice: false };
    delete v.conds.prone;
    u.holding = (u.holding || []).concat([v]);
    u.flooding = { vic: v.id }; u.aboveAC = u.baseAC || u.ac; u.baseAC = K.CFG.deepAC;
    var spot = nearestSpot(B, u, v);
    if (spot && (spot[0] !== u.x || spot[1] !== u.y)) { tween(B, u); u.x = spot[0]; u.y = spot[1]; }
    B.focus(v); D.sfx('splash'); FX.keeperPour(u, v); yield { fx: 1 }; // (rings and bubbles: the swirl closing about it; the swirl itself stays, drawn with the walls' props below)
    B.card(['{r}' + Nm(B, v) + '{/} is washed into the deep: {o}RESTRAINED{/}, and the Keeper pours into the water around ' + v.name + '.',
      '{g}(AC ' + K.CFG.deepAC + ' in the water: anything that strikes the water beside ' + v.name + ' strikes it. Escape DC 13, an action; or climb out where the head is over water){/}'], 320);
    yield 40;
  };
  K.surface = function (B, u, why) {
    if (!u.flooding) return;
    u.baseAC = u.aboveAC; u.aboveAC = null; u.flooding = null;
    B.card(['{g}' + Nm(B, u) + ' rises out of the water' + (why ? ' (' + why + ')' : '') + '.{/}'], 220);
  };
  // a blow to the Keeper in the water: a concentration check on the hold (the SRD's DC: 10 or half the damage)
  var hurt0 = D.Battle.prototype.hurt;
  D.Battle.prototype.hurt = function (u, n, type) {
    var f = u && u.kind === 'keeper' && u.flooding && u.hp > 0, hp0 = u.hp;
    var r = hurt0.apply(this, arguments);
    if (f && u.hp > 0 && u.hp < hp0 && u.flooding) {
      var v = this.units.filter(function (w) { return w.id === u.flooding.vic; })[0], dmg = hp0 - u.hp;
      if (v && v.conds.restrained && v.conds.restrained.by === u.id) {
        var dc = Math.max(K.CFG.concMin, Math.floor(dmg / 2)), sv = RU.save(u, 'con', dc);
        this.card(['  {c}' + Nm(this, u) + ' holds ' + v.name + ' under:{/} CON ' + RU.saveText(sv) + ' vs DC ' + dc + '  ' + (sv.ok ? '{n}the hold keeps{/}' : '{o}THE HOLD BREAKS{/}  {g}(' + v.name + ' is free of it, but drowns till its head is over water){/}')], 260);
        if (!sv.ok) this.release(u, v);
      }
    }
    return r;
  };

  // drowning is ours (see the head): the start of the drowned one's turn
  var start0 = RU.startTurn;
  RU.startTurn = function (u) {
    var r = start0.apply(this, arguments);
    if (u && u.conds && u.conds.drowning && D.battle) K.drownTick(D.battle, u);
    return r;
  };
  K.drownTick = function (B, u) {
    var dr = u.conds.drowning;
    if (!dr || u.hp <= 0) return;
    if (!K.isDeep(u.x, u.y)) { delete u.conds.drowning; B.card(['{n}' + u.name + ' gets a breath: head over the water.{/}'], 200); return; }
    var k = B.units.filter(function (w) { return w.id === dr.by; })[0], n = dr.twice ? 2 : 1, tot = 0, rolls = [], con = D.mod(u.abil ? u.abil.con : 10);
    for (var i = 0; i < n; i++) { var r = D.roll(K.CFG.drown), d = Math.max(1, r.total - con); tot += d; rolls.push(r.total); }
    dr.twice = false;
    D.sfx('splash');
    B.card(['{r}' + u.name + '{/} drowns' + (n > 1 ? ' {o}(flooded: twice){/}' : '') + ': ' + K.CFG.drown + (con ? ' less ' + con : '') + ' [' + rolls.join(', ') + '] = {r}' + tot + '{/}  {g}(Keeper\'s drowning, not the SRD\'s){/}'], 260);
    B.hurt(u, tot, 'drowning');
  };


  // ------------------------------------------------------------------ the looks (10-03, in the style of js/fx.js and js/looks.js): the Slam's wave, the Wave up the stair, the pour
  // All drawn from the cold element's own ramp (FX.EL.cold), pixel by pixel, over the world; a blocking one makes the battle wait for it (yield { fx: 1 }).
  function scr(gx, gy, gz) { var c = D.iso.center(gx, gy, gz || 0); return D.iso.toScreen(c.x, c.y); }
  function rc(ctx, x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  function ramp() { return FX.el('cold').c; } // light to dark: foam, light water, water, deep water
  // THE SLAM'S WAVE: it launches itself as an arcing wave, smashes down on the target's square, and returns into the pool (Griz: "launches itself as an arcing wave and smashes down
  // then returns into the pool ... a wave effect like a spell effect to accompany the last part")
  FX.keeperSlam = function (from, to) {
    var a = FX.at(from), b = FX.at(to), T1 = 28, T2 = 52;
    return FX.add({ kind: 'keeperslam', blocking: false, dur: 84, draw: function (ctx) {
      var t = this.t, C = ramp(), A = scr(a.gx, a.gy, a.gz), Bp = scr(b.gx, b.gy, b.gz), ay = A.y - 14, by = Bp.y - 6, i, k;
      if (t < T1 + 4) { // the crest: a ribbon of water arcing over, thin at the tail, heavy at the head, a foaming top and a curl tipping over at the front
        k = Math.min(1, t / T1);
        var N = 22, up = [], dn = [], hx = 0, hy = 0, fade = t > T1 ? 1 - (t - T1) / 4 : 1;
        for (i = 0; i <= N; i++) {
          var kk = k - (N - i) * 0.026; if (kk < 0) continue;
          var x = A.x + (Bp.x - A.x) * kk, y = ay + (by - ay) * kk - Math.sin(Math.PI * kk) * (46 + Math.abs(Bp.x - A.x) * 0.15), th = 3 + 15 * Math.pow(i / N, 0.8);
          up.push([x, y - th * 0.62]); dn.push([x - th * 0.1, y + th * 0.38]); hx = x; hy = y;
        }
        if (up.length > 2) {
          ctx.globalAlpha = fade;
          var poly = function (top, bot, col) { ctx.fillStyle = col; ctx.beginPath(); top.forEach(function (p, j) { j ? ctx.lineTo(Math.round(p[0]), Math.round(p[1])) : ctx.moveTo(Math.round(p[0]), Math.round(p[1])); }); for (var j = bot.length - 1; j >= 0; j--) ctx.lineTo(Math.round(bot[j][0]), Math.round(bot[j][1])); ctx.closePath(); ctx.fill(); };
          poly(up, dn, C[2]);
          poly(up, up.map(function (p, j) { return [p[0], p[1] + (dn[j][1] - p[1]) * 0.55]; }), C[1]);
          ctx.strokeStyle = C[0]; ctx.lineWidth = 2; ctx.beginPath(); up.forEach(function (p, j) { j ? ctx.lineTo(Math.round(p[0]), Math.round(p[1])) : ctx.moveTo(Math.round(p[0]), Math.round(p[1])); }); ctx.stroke();
          ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx + 1, hy - 9, 8, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); // the curl
          for (i = 0; i < 9; i++) rc(ctx, hx - 16 + i * 4 + (t % 3), hy - 18 - ((i * 5 + t) % 7), 2, 2, C[0]); // foam and spray off the crest
          ctx.globalAlpha = 1;
        }
      }
      if (t >= T1 && t < T2 + 10) { // it comes down: a ring of foam on the square, droplets thrown up and out
        var d = t - T1, e = Math.min(1, d / 18), al = d < 20 ? 1 : Math.max(0, 1 - (d - 20) / 12);
        ctx.globalAlpha = al * 0.55; D.iso.rhombus(ctx, Math.round(b.gx), Math.round(b.gy), b.gz, 1); ctx.fillStyle = C[1]; ctx.fill();
        ctx.globalAlpha = al; ctx.strokeStyle = C[0]; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(Bp.x, Bp.y, 6 + e * 22, 3 + e * 11, 0, 0, 7); ctx.stroke();
        ctx.strokeStyle = C[2]; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(Bp.x, Bp.y, 3 + e * 13, 2 + e * 6, 0, 0, 7); ctx.stroke();
        for (i = 0; i < 14; i++) {
          var ang = i * 2.399, v = 10 + (i % 5) * 3, px = Bp.x + Math.cos(ang) * v * e * 1.2, py = Bp.y - 6 - Math.sin(Math.PI * e) * (14 + (i % 4) * 7) + Math.sin(ang) * v * e * 0.4;
          rc(ctx, px, py, 2, 2, i % 2 ? C[0] : C[1]);
        }
        for (i = 0; i < 7; i++) { var cph = Math.min(1, d / 14), colh = Math.sin(Math.PI * cph) * (20 + (i % 3) * 8); rc(ctx, Bp.x - 14 + i * 5, Bp.y - 6 - colh, 3, colh + 2, i % 2 ? C[1] : C[0]); } // the spray thrown up
        ctx.globalAlpha = 1;
      }
      if (t >= T1 + 14 && t < this.dur) { // and goes back: a low wake from the square to the pool, ripples at the Keeper's foot
        var r = Math.min(1, (t - T1 - 14) / 36), fade = t > this.dur - 16 ? (this.dur - t) / 16 : 1;
        ctx.globalAlpha = 0.8 * fade;
        for (i = 0; i < 8; i++) {
          var kr = r - i * 0.05; if (kr < 0 || kr > 1) continue;
          var wx = Bp.x + (A.x - Bp.x) * kr, wy = by + (ay - by) * kr + 2;
          rc(ctx, wx - 5 + i % 2, wy, 10 - i, 2, i < 2 ? C[0] : C[1]); rc(ctx, wx - 3, wy + 2, 6, 1, C[2]);
        }
        if (r > 0.7) { var q = (r - 0.7) / 0.3; ctx.strokeStyle = C[1]; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(A.x, A.y - 4, 8 + q * 20, 4 + q * 10, 0, 0, 7); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
    } });
  };
  // THE WAVE: the front runs up the stair's lane, a row at a time, breaks on the front wall and drags back
  FX.keeperWave = function (squares, top, y1) {
    var n = y1 - top + 1, STEP = 3;
    return FX.add({ kind: 'keeperwave', blocking: false, dur: n * STEP * 2 + 26, draw: function (ctx) {
      var t = this.t, C = ramp();
      squares.forEach(function (q) {
        var row = q[1] - top, out = row * STEP, back = n * STEP + 8 + (n - 1 - row) * STEP, k = t - out, kb = t - back, s = scr(q[0], q[1], D.iso.map.gz(q[0], q[1]));
        if (k >= 0 && k < 14) { ctx.globalAlpha = 0.8 * (1 - k / 14); D.iso.rhombus(ctx, q[0], q[1], D.iso.map.gz(q[0], q[1]), 1); ctx.fillStyle = k < 5 ? C[0] : C[1]; ctx.fill(); ctx.globalAlpha = 1; for (var i = 0; i < 5; i++) rc(ctx, s.x - 12 + i * 5 + (k % 3), s.y - 4 - Math.sin((k + i) / 3) * 4 - k * 0.6, 3, 2, C[0]); }
        if (kb >= 0 && kb < 14) { ctx.globalAlpha = 0.65 * (1 - kb / 14); D.iso.rhombus(ctx, q[0], q[1], D.iso.map.gz(q[0], q[1]), 1); ctx.fillStyle = C[2]; ctx.fill(); ctx.globalAlpha = 1; for (var j = 0; j < 4; j++) rc(ctx, s.x - 9 + j * 5, s.y - 2 - (kb % 4), 3, 1, C[1]); }
      });
    } });
  };
  // THE POUR: rings spreading on the square and bubbles rising as the swirl closes about the held one (the swirl itself is a persistent idle, drawn below)
  FX.keeperPour = function (from, to) {
    var b = FX.at(to);
    return FX.add({ kind: 'keeperpour', blocking: true, dur: 44, draw: function (ctx) {
      var t = this.t, C = ramp(), Bp = scr(b.gx, b.gy, b.gz), i, fade = t > 30 ? (44 - t) / 14 : 1;
      for (i = 0; i < 4; i++) { var ph = ((t - i * 8) / 30); if (ph < 0 || ph > 1) continue; ctx.globalAlpha = (1 - ph) * fade; ctx.strokeStyle = i % 2 ? C[1] : C[0]; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(Bp.x, Bp.y, 6 + ph * 28, 3 + ph * 14, 0, 0, 7); ctx.stroke(); }
      for (i = 0; i < 8; i++) { var bph = ((t * 0.8 + i * 7) % 36), bx = Bp.x - 10 + i * 3 + Math.sin(bph / 4 + i) * 2; ctx.globalAlpha = (1 - bph / 36) * fade; rc(ctx, bx, Bp.y - 4 - bph, 2, 2, C[0]); }
      ctx.globalAlpha = 1;
    } });
  };

  // ------------------------------------------------------------------ the Keeper's turn
  function* inWater(B, u) { // true: it has come up out of the water, and goes on as above
    var f = u.flooding, v = B.units.filter(function (w) { return w.id === f.vic; })[0];
    if (!v || !G.standing(v) || !v.conds.restrained || v.conds.restrained.by !== u.id) { K.surface(B, u, v && G.standing(v) ? 'its hold is gone' : 'no one is left in it'); return true; }
    if (u.turn.bonus > 0) { // ACTIVE SUFFOCATION: its bonus action, and the drowning is doubled at the victim's next turn
      u.turn.bonus = 0; v.conds.drowning = v.conds.drowning || { by: u.id }; v.conds.drowning.twice = true;
      B.focus(v); v.conds.drowning.pulse = B.t; // (it stays as it stands: the swirl about the held one quickens)
      B.card(['{r}' + Nm(B, u) + '{/} floods ' + v.name + ': {o}ACTIVE SUFFOCATION{/}  {g}(a bonus action: the drowning is rolled twice at ' + v.name + '\'s next turn){/}'], 260); yield 40;
    }
    return false;
  }
  function* approachFoe(B, u, hs) { // keeps to its water: the square it can stand in that gets a foe into its reach, for the least move
    var T = u.turn, reach = G.reachOf(u, u.reach), rm = G.reach(u, T.move), best = null, bs = Infinity;
    var tgt = hs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
    if (!tgt) return;
    Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand) return; var d = G.dist(u, tgt, e.x, e.y), s = (d <= reach ? 0 : 1000 + d * 10) + e.cost; if (s < bs) { bs = s; best = e; } });
    if (!best || (best.x === u.x && best.y === u.y)) return;
    var path = G.path(rm, best.x, best.y);
    if (path && path.length) yield* B.moveAlong(u, path, { spend: true });
  }
  function* above(B, u) {
    var T = u.turn, S = st(B), hs = foesOf(B, u).filter(function (w) { return !w.conds.hidden || G.dist(u, w) <= (u.blindsight || 0); }), reach = G.reachOf(u, u.reach);
    var near = hs.filter(function (w) { return G.dist(u, w) <= reach; });
    if (!near.length && T.action > 0 && K.canReadyWall(B, u)) yield* K.readyWall(B, u); // (no one in reach yet: the action goes on the wall -- Griz: "an action it uses to prep" -- and the move closes)
    if (!near.length && hs.length) { yield* approachFoe(B, u, hs); if (u.dead || u.hp <= 0) return; near = foesOf(B, u).filter(function (w) { return G.dist(u, w) <= reach; }); }
    if (T.action > 0 && near.length) { // the Slam: the weakest in its reach, one the Wave has not just taken the footing from first
      T.action = 0;
      var t = near.sort(function (a, b) { return a.hp - b.hp; })[0];
      FX.keeperSlam(u, t);
      yield* B.attack(u, t, u.attacks.slam);
      u.anim = 'idle'; u.animT = B.t; // (the Slam is over: back to the standing idle, and into the water)
      if (u.dead || u.hp <= 0) return;
    } else if (T.action > 0 && K.canReadyWall(B, u)) { yield* K.readyWall(B, u); }
    if (T.bonus > 0 && !u.dead && u.hp > 0 && (yield* K.wave(B, u))) T.bonus = 0;
  }
  // out of the ice (Griz 10-03: "a DC 7 save as a bonus action to break free; if he fails he spends his action on a second try the same turn"; the SRD has no such rule: ours, STR as
  // the strength of the thing). Breaking free destroys the ice he was in and 1 to 2 of the iced squares about it.
  function* breakIce(B, u) {
    var T = u.turn, ok = false, lines = [];
    var go = function (what) { var sv = RU.save(u, 'str', K.CFG.iceDC); ok = sv.ok; lines.push('  ' + what + ': STR ' + RU.saveText(sv) + ' vs DC ' + K.CFG.iceDC + '  ' + (sv.ok ? '{n}BREAKS FREE{/}' : '{o}held{/}')); };
    if (T.bonus > 0) { T.bonus = 0; go('bonus action'); }
    if (!ok && T.action > 0) { T.action = 0; go('and its action, a second try'); }
    T.move = 0;
    if (ok) {
      var S = st(B), body = G.foot(u).map(function (p) { return p[0] + ',' + p[1]; }), gone = 0, ring = [];
      body.forEach(function (k) { if (S.ice[k]) { delete S.ice[k]; gone++; } });
      Object.keys(S.ice).forEach(function (k) { var p = k.split(',').map(Number); if (G.foot(u).some(function (f) { return Math.max(Math.abs(f[0] - p[0]), Math.abs(f[1] - p[1])) <= 1; })) ring.push(k); });
      for (var n = D.d(2); n > 0 && ring.length; n--) { var j = D.d(ring.length) - 1; delete S.ice[ring[j]]; ring.splice(j, 1); gone++; }
      delete u.conds.restrained; FX.bloom(u.x, u.y, G.foot(u), 'cold', { core: false }); D.sfx('crit');
      lines.push('{r}' + Nm(B, u) + '{/} bursts out of the ice: {c}' + gone + ' square' + (gone === 1 ? '' : 's') + ' of it destroyed.{/}');
    }
    B.card(['{c}' + Nm(B, u) + ' strains against the ice.{/}'].concat(lines), 280); yield 40;
  }
  // frozen where it stands: all four of its squares iced (K.CFG.freezeNeeds 'any': one) -- restrained, DC iceDC to break
  K.checkIce = function (B) {
    var k = keeperOf(B), S = st(B); if (!k || k.conds.restrained) return;
    var f = G.foot(k), n = f.filter(function (p) { return S.ice[p[0] + ',' + p[1]]; }).length;
    if (K.CFG.freezeNeeds === 'any' ? n > 0 : n === f.length) { k.conds.restrained = { dc: K.CFG.iceDC, by: 'ice', ice: true }; B.card(['{c}The water the Keeper stands in freezes: {o}RESTRAINED{/}  {g}(it breaks out with a DC ' + K.CFG.iceDC + ' STR save, its bonus action, then its action){/}'], 300); }
  };
  function finish(B, u) { u.anim = 'idle'; u.animT = B.t; if (K.CFG.hideAfter && !u.flooding && u.hp > 0 && !u.dead) u.conds.hidden = true; } // (back into the water, unseen: it is invisible in it)
  K.turn = function* (B, u) {
    var S = st(B); K.pose();
    if (S.ready) { S.ready = null; B.card(['{g}' + Nm(B, u) + '\'s readied wall: the moment passed.{/}'], 160); }
    if (u.conds.restrained && u.conds.restrained.ice) yield* breakIce(B, u);
    if (u.conds.restrained) u.turn.move = 0;
    if (u.flooding && !(yield* inWater(B, u))) { finish(B, u); return; }
    yield* above(B, u);
    finish(B, u);
  };

  // ------------------------------------------------------------------ the Ice Wall (3 uses). Griz 10-03: row 11 ("if there's enough room between that and his pool we might
  // alt-bench some at 6 or 7": the bench's wallRow param, B.kp.rowOverride), readied -- "'ready' the wall with a trigger of 'party member moves toward exit'" -- not up from
  // the first; the SRD's Wall of Ice for its body ("AC 12 and 30 hit points per 10-foot section"), and, beyond the SRD, a fire spell destroys a section at once.
  function wallRow(B) { var S = st(B); return S.rowOverride != null ? S.rowOverride : def().wallRow; }
  K.canReadyWall = function (B, u) {
    var S = st(B), l = def().lane, row = wallRow(B);
    if (!l || row == null || S.uses <= 0 || S.wall || S.ready || u.flooding) return false;
    return foesOf(B, u).some(function (w) { return w.x >= l.x0 && w.x <= l.x1 && w.y >= l.y0 && w.y < row; }); // (someone on the pool side of the row: to be sealed in)
  };
  K.readyWall = function* (B, u) {
    var S = st(B); u.turn.action = 0; S.ready = { round: B.round };
    B.focus(u); u.anim = 'wall'; u.animT = B.t;
    B.card(['{r}' + Nm(B, u) + '{/} gathers the water at the stair\'s edge, and holds it.  {g}(READY: the Ice Wall -- when one of you moves toward the exit; ' + S.uses + ' left){/}'], 300); yield 30; u.anim = 'idle'; u.animT = B.t;
  };
  // after a creature's step (battle.js moveAlong): a hero moving toward the exit, on the stair, springs it
  K.watch = function* (B, u, fromY) {
    var S = B.kp; if (!S || !S.ready || u.side === 'foe' || u.dead || u.hp <= 0) return;
    var k = keeperOf(B); if (!k || k.reaction <= 0 || !k.hp) return;
    if (!(u.y > fromY) || !inLane(u.x, u.y)) return;
    yield* K.raiseWall(B, k, u);
  };
  K.raiseWall = function* (B, k, trig) {
    var S = st(B), l = def().lane, row = wallRow(B), sq = [], x;
    for (x = l.x0; x <= l.x1; x++) { var q = G.map.at(x, row); if (q && q.open) sq.push([x, row]); }
    if (!sq.length) return;
    S.uses--; S.ready = null; k.reaction = 0;
    var secs = [], i; for (i = 0; i < sq.length; i += 2) secs.push({ sq: sq.slice(i, i + 2), hp: K.CFG.wallHP, max: K.CFG.wallHP, born: B.t });
    var w = { id: 'keeperice-' + S.uses, spell: 'keeperice', by: k.id, kind: 'ice', sight: false, solid: true, cost: 0, sq: sq.slice(), cx: Math.round((l.x0 + l.x1) / 2), cy: row, dir: [0, 1], dc: 13, sections: secs };
    // whoever stands where it rises is set back onto the pool side
    B.units.forEach(function (v) {
      if (!G.present(v) || !sq.some(function (p) { return p[0] === v.x && p[1] === v.y; })) return;
      var best = null, bd = 1e9;
      for (var yy = row - 1; yy >= l.y0; yy--) for (var xx = l.x0; xx <= l.x1; xx++) { if (!G.canStand(v, xx, yy)) continue; var d = Math.abs(yy - row) + Math.abs(xx - v.x) * 0.1; if (d < bd) { bd = d; best = [xx, yy]; } }
      if (best) { tween(B, v); v.x = best[0]; v.y = best[1]; }
    });
    B.walls = (B.walls || []).concat([w]); B.wallMap = null; S.wall = w;
    B.focus(k); k.anim = 'wall'; k.animT = B.t; D.sfx('earth'); FX.bloom(w.cx, row, sq, 'glow');
    B.card(['{r}' + Nm(B, k) + '{/} springs the Ice Wall: {c}the water on the stair freezes across, behind ' + trig.name + '.{/}',
      '{g}(row ' + row + ', AC ' + K.CFG.wallAC + ', ' + K.CFG.wallHP + ' HP a 10-ft section; fire destroys a section at once; ' + S.uses + ' use' + (S.uses === 1 ? '' : 's') + ' left){/}'], 340);
    yield 40;
  };
  function dropSection(B, w, sec, why) {
    var S = st(B);
    w.sq = w.sq.filter(function (p) { return !sec.sq.some(function (q) { return q[0] === p[0] && q[1] === p[1]; }); });
    w.sections = w.sections.filter(function (x) { return x !== sec; }); B.wallMap = null;
    if (!w.sq.length) { B.walls = (B.walls || []).filter(function (x) { return x !== w; }); if (S.wall === w) S.wall = null; }
    FX.bloom(sec.sq[0][0], sec.sq[0][1], sec.sq, 'fire');
    B.card(['{g}A section of the Ice Wall ' + why + '.' + (S.wall ? '' : ' The wall is down.') + '{/}'], 240);
  }
  // the spells: fire destroys a section of the wall at once (signature) and melts ice; cold freezes the water it covers (1d4 cold to the caster's friends standing in it;
  // the spell's own damage to the Keeper in the water is the spell's); any other area spell hurts a section. Single-target spells and weapons at the wall: not built
  var cast0 = D.magic.cast;
  D.magic.cast = function* (B, u, id, slot, t) {
    var r = yield* cast0.apply(this, arguments);
    if (B.kp && B.fight && B.fight.id === 'keeper') yield* K.spellOn(B, u, id, slot, t);
    return r;
  };
  K.spellOn = function* (B, u, id, slot, t) {
    var S = st(B), sp = D.magic.data(id); if (!sp) return;
    var els = [sp.el, sp.el2].filter(Boolean), fire = els.indexOf('fire') >= 0 || els.indexOf('thunder') >= 0 /* (thunder, shatter: an instant blow, like fire -- Griz 10-03) */, melt = els.indexOf('fire') >= 0, cold = els.indexOf('cold') >= 0, g = D.magic.geo(id);
    if (!g || !/^(sphere|cone|cube|line|wall)$/.test(g.shape)) return;
    var at = t && t.x != null ? t : t && t.units ? t.units[0] : t; if (!at || at.x == null) return;
    // (a solid wall bars the grid's own sight and spread: the area is read with the Ice Wall taken down for a moment, so the wall's squares are in it)
    var w = S.wall, walls0 = B.walls; if (w) { B.walls = (B.walls || []).filter(function (x) { return x !== w; }); B.wallMap = null; }
    var sq = D.magic.area(u, g, at.x, at.y) || []; if (w) { B.walls = walls0; B.wallMap = null; }
    var inSq = function (p) { return sq.some(function (q) { return q[0] === p[0] && q[1] === p[1]; }); };
    if (w) w.sections.slice().forEach(function (sec) {
      if (!sec.sq.some(inSq)) return;
      if (fire) { dropSection(B, w, sec, 'goes to steam'); return; }
      if (sp.dmg) { var d = D.roll(sp.dmg).total; sec.hp -= d; if (sec.hp <= 0) dropSection(B, w, sec, 'shatters ({r}' + d + '{/} to it)'); else B.card(['{g}The Ice Wall takes ' + d + ': ' + sec.hp + '/' + sec.max + '.{/}'], 160); }
    });
    if (melt) { var melted = Object.keys(S.ice).filter(function (k) { var p = k.split(',').map(Number); return inSq(p); }); if (melted.length) { melted.forEach(function (k) { delete S.ice[k]; }); B.card(['{g}The fire melts ' + melted.length + ' square' + (melted.length > 1 ? 's' : '') + ' of ice.{/}'], 200); } }
    if (cold) {
      var froze = sq.filter(function (p) { var c = G.map.at(p[0], p[1]); return c && c.ch === '~' && !S.ice[p[0] + ',' + p[1]]; });
      // swirling someone (Griz 10-03): the cold gives it a save to resist the freeze when it changes back. Which: the spell's own, its save ability (CON where it names none) against
      // the caster's spell save DC (the SRD: a spell that asks a save asks it of whoever it catches); a spell that rolls an attack has none, and the water freezes
      var kp = keeperOf(B);
      if (kp && kp.flooding && froze.length) {
        var vic = B.units.filter(function (w) { return w.id === kp.flooding.vic; })[0], body = G.foot(kp).concat(vic ? [[vic.x, vic.y]] : []);
        var inBody = function (p) { return body.some(function (q) { return q[0] === p[0] && q[1] === p[1]; }); };
        if (froze.some(inBody) && sp.save) {
          var ab = String(sp.save).toLowerCase().slice(0, 3), svk = RU.save(kp, ab, u.spellDC || 13);
          B.card(['  {c}' + Nm(B, kp) + ' holds its swirl against the cold:{/} ' + ab.toUpperCase() + ' ' + RU.saveText(svk) + ' vs DC ' + (u.spellDC || 13) + '  ' + (svk.ok ? '{n}the water about ' + (vic ? vic.name : 'it') + ' does not freeze{/}' : '{o}it changes back, and lets go{/}')], 280);
          if (svk.ok) froze = froze.filter(function (p) { return !inBody(p); });
          else { K.surface(B, kp, 'the cold takes its swirl'); if (vic) B.release(kp, vic); }
        } else if (froze.some(inBody)) { K.surface(B, kp, 'the cold takes its swirl'); if (vic) B.release(kp, vic); }
      }
      if (froze.length) {
        froze.forEach(function (p) { S.ice[p[0] + ',' + p[1]] = true; }); FX.bloom(at.x, at.y, froze, 'cold', { core: false });
        var lines = ['{c}' + froze.length + ' square' + (froze.length > 1 ? 's' : '') + ' of water freeze over.{/}  {g}(ice underfoot: the backwash goes round; a head over the ice is over water){/}'], hurt = [];
        B.units.forEach(function (v) { if (G.standing(v) && v.side === u.side && froze.some(function (p) { return G.foot(v).some(function (f) { return f[0] === p[0] && f[1] === p[1]; }); })) { var d = D.roll('1d4').total; lines.push('  ' + v.name + ' is caught in it: {r}' + d + '{/} cold'); hurt.push([v, d]); } });
        B.card(lines, 280); hurt.forEach(function (h) { B.hurt(h[0], h[1], 'cold'); }); K.checkIce(B); yield 20;
      }
    }
  };
  // what the Keeper puts on the floor is drawn with the walls (js/walls.js W.props, the world's sort): the ice on the pool; the Ice Wall's sections (the third sheet's ice-wall form, keeper_p3:
  // the Keeper turning to ice, then the solid wall); and the swirl a held hero sits in, an idle that goes on while it is held
  K.CFG.wallScale = 0.55; K.CFG.swirlScale = 0.5;
  function sprite(ctx, sheet, anim, t, x, y, k, alpha, ky) { ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(k, k * (ky == null ? 1 : ky)); D.spr.draw(ctx, sheet, anim, 0, t, 0, 0, { alpha: alpha == null ? 1 : alpha }); ctx.restore(); }
  var props0 = D.walls && D.walls.props;
  if (props0) D.walls.props = function (B) {
    var out = props0.apply(this, arguments);
    if (!B.kp) return out;
    Object.keys(B.kp.ice).forEach(function (key) {
      var p = key.split(',').map(Number), gz = B.map.gz(p[0], p[1]);
      out.push({ depth: p[0] + p[1] + 0.2, gz: gz, layer: 0, draw: function (ctx) {
        var iso = D.iso, c = iso.center(p[0], p[1], gz), s = iso.toScreen(c.x, c.y), hw = iso.TW / 2, hh = iso.TH / 2;
        ctx.globalAlpha = 0.55; ctx.fillStyle = '#bfe6f2'; ctx.beginPath(); ctx.moveTo(s.x, s.y - hh); ctx.lineTo(s.x + hw, s.y); ctx.lineTo(s.x, s.y + hh); ctx.lineTo(s.x - hw, s.y); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s.x - hw * 0.4, s.y - 1); ctx.lineTo(s.x + hw * 0.1, s.y + hh * 0.3); ctx.stroke(); ctx.globalAlpha = 1;
      } });
    });
    var w = B.kp.wall;
    if (w) w.sections.forEach(function (sec) {
      var q0 = sec.sq[0], q1 = sec.sq[sec.sq.length - 1], g0 = B.map.gz(q0[0], q0[1]);
      out.push({ depth: (q0[0] + q0[1] + q1[0] + q1[1]) / 2 + 0.5, gz: g0, layer: 1, draw: function (ctx) {
        var a = scr(q0[0], q0[1], g0), b = scr(q1[0], q1[1], g0), age = B.t - (sec.born || 0), rising = age < 30;
        sprite(ctx, 'keeper_p3', 'wallsolid', age + sec.sq[0][0] * 7, (a.x + b.x) / 2, (a.y + b.y) / 2 + 10, K.CFG.wallScale, rising ? 0.5 + age / 60 : 1, rising ? Math.min(1, age / 24) : 1); // (it grows up out of the floor; the third sheet's frames 4-6, the solid wall)
      } });
    });
    B.units.forEach(function (v) {
      var r = v.conds && v.conds.restrained; if (!r || !r.water || v.dead || v.hp <= 0) return;
      var gz = B.map.gz(v.x, v.y), pulse = v.conds.drowning && (v.conds.drowning.twice || (v.conds.drowning.pulse != null && B.t - v.conds.drowning.pulse < 40));
      out.push({ depth: v.x + v.y + 0.6, gz: gz, layer: 1, draw: function (ctx) {
        var s = scr(v.x, v.y, gz); sprite(ctx, 'keeper_p3', 'swirl', B.t * (pulse ? 2 : 1), s.x, s.y + 8, K.CFG.swirlScale * (pulse ? 1.1 : 1), pulse ? 0.95 : 0.8);
      } });
    });
    return out;
  };

  // ------------------------------------------------------------------ the gallery: ?fxgallery&keeper (10-03). The Keeper's looks and rules, one scene at a time on its own stair, through the
  // real code (the dice are put to the scene: a save the scene wants failed fails). Keys as the spell gallery's: left/right the scene before or after, E again, &scene=<id>, &auto.
  K.SCENES = [
    { id: 'slam', name: 'THE SLAM', words: 'It launches itself as an arcing wave and smashes down on one in its reach (DC 15 STR or prone), then returns into the pool.' },
    { id: 'wave', name: 'THE WAVE', words: 'A bonus action each round: a wave up the stair (STR DC 13 or prone), off the front wall, and the backwash sweeps the prone 10 ft toward the deep -- up free.' },
    { id: 'pour', name: 'THE POUR', words: 'Swept onto the deep, a hero is restrained and the Keeper pours into the water around it (AC 10); Active Suffocation doubles the drowning.' },
    { id: 'wall', name: 'THE ICE WALL', words: 'Readied, and sprung when one of you moves toward the exit: the water on the stair freezes across, behind you.' },
    { id: 'fire', name: 'FIRE ON THE WALL', words: 'A fire spell whose area takes in a section destroys it at once (not the SRD: the Keeper\'s own).' },
    { id: 'freeze', name: 'FREEZING THE WATER', words: 'A cold area spell freezes the water it covers: 1d4 cold to its caster\'s friends in it, ice underfoot against the backwash, no deep where the ice is.' }
  ];
  D.fxKeeper = function (q) {
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var auto = /[?&]auto\b/.test(q), ids = K.SCENES.map(function (x) { return x.id; });
    var B = new D.Battle({ gallery: true, fight: 'keeper', data: D.save.fixture(3), bench: true });
    var S = B.gallery = { keeper: true, i: Math.max(0, ids.indexOf(get('scene') || '')), ids: ids, auto: auto, card: null, home: null };
    var enter0 = B.enter;
    B.enter = function () {
      enter0.apply(this, arguments);
      var P = B.units.filter(function (w) { return w.side === 'party' && !w.familiar; }), k = keeperOf(B);
      S.units = B.units.slice(); S.P = P; S.k = k;
      S.home = S.units.map(function (w) { return { w: w, hp: w.maxhp, x: w.x, y: w.y, facing: w.facing, baseAC: w.baseAC, slots: (w.slots || []).slice() }; });
      B.dark = /[?&]dark\b/.test(q); // (lit, so the looks can be judged; &dark keeps the stair's torchdark)
      B.req = null; B.co = loop();
    };
    function reset() {
      B.units = S.units.slice(); D.battle = B; B.kp = null; B.walls = []; B.wallMap = null; B.cards && B.clearCards && B.clearCards();
      S.home.forEach(function (h) { var w = h.w; w.hp = w.maxhp = h.hp; w.x = h.x; w.y = h.y; w.facing = h.facing; w.conds = {}; w.dead = false; w.ko = false; w.baseAC = h.baseAC; w.anim = 'idle'; w.animT = B.t; w.reaction = 1; w.slots = h.slots.slice(); if (w.kind === 'keeper') { w.flooding = null; w.holding = []; w.aboveAC = null; } });
      S.k.hp = S.k.maxhp; S.k.x = 8; S.k.y = 4; S.k.facing = 0; delete S.k.conds.hidden; S.k.hidden0 = false;
      S.P.forEach(function (w) { delete w.conds.hidden; });
      D.grid.setup(D.grid.map, B.units);
    }
    var card0 = B.card;
    B.card = function () { var r = card0.apply(this, arguments), g = S.card; if (g && this.cards.indexOf(g) < 0) { this.cards.unshift(g); while (this.cards.length > 3) this.cards.splice(1, 1); } return r; };
    function header(sc) {
      var lines = ['{y}' + (S.i + 1) + ' / ' + ids.length + '   ' + sc.name + '{/}'].concat(D.wrap(sc.words, 440).map(function (l) { return '{g}' + l + '{/}'; }), ['{g}left/right the next · E again{/}']);
      B.clearCards(); S.card = null; card0.call(B, lines, 1e9, 'gallery'); S.card = B.cards[B.cards.length - 1];
    }
    var save0 = RU.save;
    function failSaves(on) { RU.save = on ? function () { var r = save0.apply(this, arguments); r.ok = false; return r; } : save0; }
    function look(x, y) { D.iso.lookAt(x, y, D.grid.map.gz(x, y)); }
    function put(u, x, y) { u.x = x; u.y = y; u.hp = u.maxhp; }
    var RUNS = {
      slam: function* () {
        var k = S.k, h = S.P[0]; put(h, 8, 7); h.baseAC = 1; k.reaction = 1; RU.startTurn(k); look(8, 6); yield 20; failSaves(true);
        FX.keeperSlam(k, h); yield* B.attack(k, h, k.attacks.slam); failSaves(false); yield 60;
      },
      wave: function* () {
        var k = S.k; S.P.forEach(function (h, i) { put(h, 7 + i, 9); }); look(8, 7); RU.startTurn(k); yield 20; failSaves(true);
        yield* K.wave(B, k); yield 30; failSaves(false);
      },
      pour: function* () {
        var k = S.k, h = S.P[0]; put(h, 8, 3); h.conds.prone = true; look(8, 3); RU.startTurn(k); yield 20; failSaves(true);
        yield* K.flood(B, k, h); failSaves(false); h.hp = h.maxhp = 60; RU.startTurn(k); yield* K.turn(B, k); yield 30; K.drownTick(B, h); yield 40;
      },
      wall: function* () {
        var k = S.k; S.P.forEach(function (h, i) { put(h, 7 + i, 9); }); look(8, 9); RU.startTurn(k); yield 20; yield* K.readyWall(B, k); yield 30;
        var h = S.P[1]; RU.startTurn(h); h.turn.move = 30; yield* B.moveAlong(h, [[h.x, h.y + 1]], { spend: true }); yield 40;
      },
      fire: function* () {
        var k = S.k, c = S.P[1]; S.P.forEach(function (h, i) { put(h, 7 + i, 9); }); look(8, 10); k.reaction = 1; yield* K.raiseWall(B, k, S.P[0]); yield 40;
        put(c, 8, 10); c.spellDC = 13; yield* K.spellOn(B, c, 'burninghands', 1, { x: 8, y: 11 }); yield 40;
      },
      freeze: function* () {
        var k = S.k, c = S.P[1]; S.P.forEach(function (h, i) { put(h, 7 + i, 9); }); put(S.P[2], 8, 7); look(8, 7); put(c, 8, 9); c.spellDC = 13; yield 20;
        yield* K.spellOn(B, c, 'coneofcold', 5, { x: 8, y: 6 }); yield 40;
      }
    };
    function* loop() {
      for (var round = 0; ; round++) {
        reset(); var sc = K.SCENES[S.i]; header(sc); yield 10;
        yield* RUNS[sc.id](); yield 50;
        var v = S.auto ? 1 : yield { gallery: true };
        S.i = ((S.i + (v == null ? 1 : v)) % ids.length + ids.length) % ids.length;
      }
    }
    return B;
  };


  // ------------------------------------------------------------------ ?keeperfight (10-03): the Keeper's fight from a URL. &lvl=3 the party's level, &wall=<row> the Ice Wall's row, &hp=<n>.
  // Played by you (the fixture party) unless &watch: then the class AI runs the four, and &seed=<n> replays a bench fight roll for roll (dev/keeper-probe.py's seeds: the
  // probe's fight number f at level L is seed (f+1)*7919+L -- 174221 is the level 3 fight with two floods, a broken hold and a wall).
  K.fight = function (q) {
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    if (get('seed')) D.seed = +get('seed') | 0;
    var B = new D.Battle({ fight: 'keeper', data: D.save.fixture(+(get('lvl') || 3)), bench: !!get('seed') || /[?&]watch\b/.test(q) });
    var enter0 = B.enter;
    B.enter = function () {
      enter0.apply(this, arguments);
      if (get('wall')) B.kp = { uses: K.CFG.wallUses, ready: null, wall: null, ice: {}, waves: 0, rowOverride: +get('wall') };
      if (get('hp')) { var k = keeperOf(B); if (k) k.hp = k.maxhp = +get('hp'); }
      if (/[?&]watch\b/.test(q) || get('seed')) { B.units.forEach(function (u) { if (u.side === 'party' && !u.familiar) { u.guest = true; u.classAI = true; } }); B.heroTurn = function* (u) { yield* D.ai.turn(this, u); }; }
      if (/[?&]watch\b/.test(q) || get('seed')) B.fight = Object.assign({}, B.fight, { noCards: true }); // (no entry card to press E on: the fight just goes)
      if (/[?&]lit\b/.test(q)) B.dark = false;
    };
    return B;
  };

  // (Griz 10-03: "attacking the swirl is attacking the Keeper, so the held hero's friends may strike the water around them": while it swirls someone, whoever is within reach of
  // the held one is within reach of it -- the grid's distance to the Keeper is the least of the two)
  var dist0 = G.dist;
  G.dist = function (a, b, ax, ay, bx, by) {
    var d = dist0.apply(this, arguments);
    if (b && b.flooding && bx == null && D.battle && d > 0) { var v = D.battle.units.filter(function (w) { return w.id === b.flooding.vic; })[0]; if (v && v !== a) d = Math.min(d, dist0(a, v, ax, ay)); }
    return d;
  };
  // the standing depth (Griz 10-03: it "looks perched on top of the water while heroes look submerged"): UI.wading draws the Keeper into the pool -- from the ankle in the shallows
  // to the waist at the deep end, by how far its square is from the deep; waist-deep and a little more while it swirls someone. A drawing only: the map's heights and the rules are as they were
  K.wade = function (B, u) {
    var d = (def().deeps || []).length ? Math.min.apply(null, def().deeps.map(function (p) { return Math.max(Math.abs(p[0] - u.x), Math.abs(p[1] - u.y)); })) : 6;
    var f = Math.max(0, Math.min(1, 1 - (d - 1) / 6)), cut = Math.round(8 + f * 40 + (u.flooding ? 6 : 0));
    return { cut: cut, sink: 0 };
  };
  K.pose(); // (the engine's anim names point at the rows from the start)
})();
