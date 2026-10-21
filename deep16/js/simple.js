/* DEEP16 — THE SIMPLE FIGHT: the second game's random fights as the first game's battle screen (RULED 2026-10-21, Griz, on the simple encounter seat's seven).
   His words: "even simpler simple random encounters - interface matching the 8-bit with fight etc, with a screen where the new grid sits like the old 8 bit stuff did"
   (10-20 late); then, with a paste of the screen, "paste (but not a square screen) - where clicking on the grid is only for selecting targets, but the actual fighting
   uses the simplified for 8-bit stuff with no movement (except they step a square closer to the enemy on their turn) and start them further apart. Party area needs to
   include room for guests"; "correct, spell targeting is single foe"; "correct - up for debate later tho" (anyone strikes anyone); "correct - probably need to have a
   'spell effect scaler' accompanying simple combat..."; "yes, watch for compatibility issues due to simplifications" (DEEP16's own fight underneath); "yes" (an OPTIONS
   row, simple by default, and the encounter card's second button); "sand is 'hex' fights, silverton internal" (the Hex's arena bouts, when built, take it too).
   Then, seeing the first build: "(paste) is exactly what I asked for - can we keep the theme and do it better? Initial thoughts are that it's asking for the bottom to
   be side menus (right side) instead, with maybe one zoom deeper. Try it with some larger monsters as well"; and "yes to the simple fight leans" (the bonus action
   after the swing; the spell effect scaler as built; the Hex's sand fights simple by default).
   The screen: the line of words across the top (the newest card, or whose turn it is); the grid's picture on the left, the turn order along its top, the two lines
   across it as the first game's -- the foes on the left, the party on the right, each a column down the screen; the 8-bit's windows in a column down the right side --
   the party's hit points (guests under them), and FIGHT MAGIC SKILL ITEM RUN at the foot (the foes' names between turns). A click on the picture only picks a target;
   every command, list row and target is a click as well as a key (his "playable by mouse only").
   How it sits on the grid: the field is the simple fight's own (S.fieldOpts), the lines standing across the screen on it -- a square apart by the rules (a diagonal
   counts one: 128 px on the screen at the deeper zoom), so DEEP16's reach, rules, light and AI run as they are on the squares the picture shows. The one whose turn it
   is is drawn half a square forward (u.drawAt). Nobody walks: a walk is a jump to its end (moveAlong), nothing provokes (every turn disengaged), and at each turn's
   start every one not held stands on its own square again. A blow out of reach is struck from a square beside the target (attack). An area takes the creature it is
   aimed at and the nearest of its side by the first game's counts (S.AREA, THE SPELL EFFECT SCALER). The turn: any number of commands while the action or a bonus
   action is left -- FIGHT's attacks at the one picked, then the menu again for the bonus action (OFF HAND, Cunning Action, Healing Word) or END TURN. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, UI = D.ui, I = D.input, Battle = D.Battle;
  var S = D.simple = {};
  var W8 = D.WIN8, OFF = 30, RW = 152, PX0 = D.W - RW, GREY = '#7a7890'; // (OFF: the picture a band down, under two lines of words; RW: the side column's width)

  // ------------------------------------------------------------------ the switch: OPTIONS' RANDOM FIGHTS, simple by default (his "yes"); a per-device convenience
  S.KEY = 'deep16.randomfights';
  S.on = function () { var v = null; try { v = window.localStorage.getItem(S.KEY); } catch (e) { } return v !== 'grid'; };
  S.set = function (on) { try { window.localStorage.setItem(S.KEY, on ? 'simple' : 'grid'); } catch (e) { } };
  var MN = window.DS && window.DS.MENU; // (the one OPTIONS page, js/menu.js: its grid rows gain this one in the second game only -- this file loads only in deep16/)
  if (MN && MN.gridRows) { var rows0 = MN.gridRows; MN.gridRows = function () { var r = rows0.apply(this, arguments); r.push({ label: 'RANDOM FIGHTS', key: 'randomfights', get: function () { return S.on() ? 'SIMPLE' : 'FULL GRID'; }, step: function () { S.set(!S.on()); } }); return r; }; }

  // ------------------------------------------------------------------ the lineup, across the screen (his "keep the theme and do it better")
  // A square's place on the screen: c = x - y across (32 px a step at zoom 1), r = x + y down (16 px a step). Each side stands in columns of four down the screen,
  // three rows (48 px) apart and staggered half a square, as the first game staggers its four: the party's front at c +2/+3, the foes' at c -2/-1 -- the same row
  // a square apart by the rules on either side of the gap (a diagonal counts one), 128 px on the screen. Guests stand in the columns behind the four; the camp's fire
  // burns between. The foes fill their front column first, then the next back; the Large and the Huge after the small, as near the front as their bodies fit (none
  // past c -1). The field is 16 by 16 round C, open where the lineup can stand, its road across the screen
  S.W = 16; S.H = 16; S.C = [8, 7];
  S.FACE = [[-1, 1], [1, -1]]; // (the facing across the screen: the party to its left, the foes to its right -- D.spr.facingFor)
  function sq(c, r, s) { s = s || 1; var x2 = c + r - (s - 1); if (x2 % 2) return null; var x = x2 / 2; return [S.C[0] + x, S.C[1] + x - c]; } // (the anchor of a body s squares a side, its middle at c, r)
  // a column j of four, top to bottom: rows -5, -2, 1, 4, the odd rows half a square to the right -- both lines zigzag together, so a row's two stay a square
  // apart (side +1 the party's, -1 the foes')
  function column(side, j) { var e = side * (2 + 2 * j), o = e + 1; return [[o, -5], [e, -2], [o, 1], [e, 4]]; }
  S.PARTY = column(1, 0).concat(column(1, 1), column(1, 2)).map(function (q) { return sq(q[0], q[1]); });
  S.CAMP = sq(4, 0);
  S.TALL = { 1: 50, 2: 90, 3: 140 }; // (a figure's height by its size, px at zoom 1: the troll's 75, the ettin's 101, the stone giant's 137)
  S.lane = function (x, y) { var rx = x - S.C[0], ry = y - S.C[1], c = rx - ry, r = rx + ry; return x > 0 && y > 0 && x < S.W - 1 && y < S.H - 1 && c >= -12 && c <= 9 && r >= -9 && r <= 9; };
  S.road = function (x, y) { var r = (x - S.C[0]) + (y - S.C[1]); return r === -1 || r === 0; };
  S.fieldOpts = function () { return { w: S.W, h: S.H, lane: S.lane, road: S.road, entry: S.PARTY }; };
  S.seat = function (list) {
    var taken = {}, out = [], smalls = [];
    S.PARTY.concat([S.CAMP]).forEach(function (q) { taken[q[0] + ',' + q[1]] = 1; });
    [0, 1, 2, 3].forEach(function (j) { var cl = column(-1, j); [cl[1], cl[2], cl[0], cl[3]].forEach(function (q) { smalls.push(q); }); }); // (the middle rows first)
    function fits(a, s) { for (var j = 0; j < s; j++) for (var i = 0; i < s; i++) { var x = a[0] + i, y = a[1] + j; if (taken[x + ',' + y] || !S.lane(x, y) || (x - S.C[0]) - (y - S.C[1]) > -1) return false; } return true; }
    list.map(function (k, i) { var f = D.FOES && D.FOES[k]; return { k: k, i: i, s: Math.max(1, Math.min(3, (f && f.size) || 1)) }; })
      .sort(function (a, b) { return (a.s > 1) - (b.s > 1) || b.s - a.s || a.i - b.i; }) // (the small first: they hold the front; then the Huge before the Large, for a front place)
      .forEach(function (o) {
        var at = null;
        if (o.s === 1) for (var q = 0; q < smalls.length && !at; q++) { var a1 = sq(smalls[q][0], smalls[q][1]); if (a1 && fits(a1, 1)) at = a1; }
        // (a big one, or a small past the four columns: the open place nearest the front and the middle rows together -- a column back before a row far down -- and
        // a tall one low enough that its head stays under the party's top row (S.TALL px of figure; 16 px a row), so the picture stays one zoom deep)
        var best = 1e9, rmin = Math.ceil((S.TALL[o.s] - 128) / 16);
        if (!at) for (var c = -1 - o.s; c >= -12; c--) for (var r = -8; r <= 8; r++) {
          var a = sq(c, r, o.s), cost = (-1 - o.s - c) * 2 + (r < rmin ? (rmin - r) * 4 : 0) + (r > 5 ? (r - 5) * 4 : 0) + Math.abs(r - 0.5) * 0.4;
          if (a && cost < best && fits(a, o.s)) { best = cost; at = a; }
        }
        if (!at) return;
        for (var j = 0; j < o.s; j++) for (var i = 0; i < o.s; i++) taken[(at[0] + i) + ',' + (at[1] + j)] = 1;
        out.push({ id: 'w' + o.i + '-' + o.k, kind: o.k, at: at });
      });
    return out;
  };
  // the test doors (js/eyes.js): deep16/?world&simple=wolf,wolf,bandit -- THE WORLD with that encounter's card up at once, FIGHT and ON THE GRID on it;
  // &camp -- a fight in the night's watches, the camp's fire behind the party (js/world.js W.CAMP)
  var WW = D.world && D.world.World;
  if (WW) { var wen0 = WW.prototype.enter; WW.prototype.enter = function () {
    var r = wen0.apply(this, arguments), mq = /[?&]simple=([a-z0-9,]+)/.exec(this.q || '');
    if (mq && !this.simpleDoor) {
      this.simpleDoor = true;
      var list = mq[1].split(',').filter(function (k) { return D.FOES && D.FOES[k]; }).slice(0, 8), st = D.world.state(), e = D.world.M().hex[D.world.K(st.at[0], st.at[1])];
      if (list.length && e) this.encounter({ zone: D.world.zoneOf(e), list: list, mirror: false, camp: /[?&]camp\b/.test(this.q) }, e);
    }
    return r;
  }; }

  // ------------------------------------------------------------------ the fight's state: each one's own square, and where the picture draws it
  S.setup = function (B) { B.simple = { home: {}, last: {}, m: null, act: null, cam: null }; B.units.forEach(function (u) { S.homeOf(B, u); }); };
  S.homeOf = function (B, u) { var h = B.simple.home[u.id]; if (!h) h = B.simple.home[u.id] = [u.x, u.y]; return h; };
  S.dispOf = function (B, u) { return S.homeOf(B, u); };
  S.faceOf = function (u) { var f = S.FACE[u.side === 'party' ? 0 : 1]; return D.spr.facingFor(f[0], f[1]); };
  // held or holding (a grapple, a swallow, a rider, the carried): it stays where the rules put it, and the picture draws it by the one it is bound to
  S.boundTo = function (B, u) {
    var c = u.conds || {}, id = (c.grappled && c.grappled.by) || (c.engulfed && c.engulfed.by) || (u.carriedBy && (u.carriedBy.id || u.carriedBy)) || null;
    var held = Battle.heldBy && Battle.heldBy(B, u);
    if (held) return { w: held, holds: true };
    if (u.riding && u.master) return { w: u.master, rides: true };
    if (!id) return c.grappled || c.engulfed ? { w: null } : null;
    return { w: B.units.filter(function (x) { return x.id === id; })[0] || null };
  };
  // every one not held back on its own square (each turn's start): the rules' positions are the lineup again, each facing across
  S.snap = function (B) {
    B.units.forEach(function (u) {
      if (!G.present(u) || u.left || u.object || u.familiar || S.boundTo(B, u)) return;
      var h = S.homeOf(B, u);
      if (u.x === h[0] && u.y === h[1]) { if (u.hp > 0) u.facing = S.faceOf(u); return; }
      var x0 = u.x, y0 = u.y; u.x = -99; u.y = -99; // (its own body out of the way of the test)
      var ok = G.canStand(u, h[0], h[1]); u.x = x0; u.y = y0;
      if (!ok) return;
      u.x = h[0]; u.y = h[1]; delete u.tween;
      if (u.hp > 0) u.facing = S.faceOf(u);
    });
  };
  // where the picture draws each one: its own square, half a square forward on its turn (his "they step a square closer to the enemy on their turn"); one bound
  // drawn by its partner -- the grappler beside the one it holds, on its own side
  S.place = function (B) {
    B.units.forEach(function (u) {
      var b = S.boundTo(B, u), h = S.homeOf(B, u), f = S.FACE[u.side === 'party' ? 0 : 1];
      if (!b) { u.drawAt = B.simple.act === u && u.hp > 0 && !u.dead ? { x: h[0] + f[0] / 2, y: h[1] + f[1] / 2 } : { x: h[0], y: h[1] }; delete u.tween; return; }
      var w = b.w;
      if (!w || b.rides || (u.conds && u.conds.engulfed)) { delete u.drawAt; return; }
      if (b.holds) { var hw = S.homeOf(B, w), g = S.FACE[w.side === 'party' ? 0 : 1]; u.drawAt = { x: hw[0] + g[0], y: hw[1] + g[1] }; } // (beside the held, on the side it came from)
      else u.drawAt = { x: h[0], y: h[1] };
      delete u.tween;
    });
  };

  // ------------------------------------------------------------------ the engine's hooks (each only in a simple fight)
  var run0 = Battle.prototype.run;
  Battle.prototype.run = function* () { if (this.o.simple && !this.simple) S.setup(this); return yield* run0.apply(this, arguments); };
  // each turn's start (the hand's, battle.js heroTurn, and the AI's, ai.js AI.turn, both open with it): every one not held back on its own square, the one whose
  // turn it is drawn forward, its menu fresh; and nothing provokes all turn (no one walks). (A hook here, not a wrap of the turns: rulings0930 reads the AI turn's
  // own words)
  var st0 = RU.startTurn;
  RU.startTurn = function (u) {
    var B = D.battle, on = !!(B && B.simple && u && B.units.indexOf(u) >= 0);
    if (on) { S.snap(B); S.homeOf(B, u); B.simple.act = u; if (B.simple.m && B.simple.m.u === u) B.simple.m = null; }
    var r = st0.apply(this, arguments);
    if (on && u.turn) u.turn.disengaged = true;
    return r;
  };
  // a walk is a jump to its end: the picture never shows it, and nothing on the way is felt (no web, no ground, no opportunity attack)
  var mv0 = Battle.prototype.moveAlong;
  Battle.prototype.moveAlong = function* (u, path, o) {
    if (!this.simple || !path || !path.length || (u.conds && (u.conds.grappled || u.conds.engulfed)) || Battle.heldBy(this, u)) return yield* mv0.apply(this, arguments);
    var end = path[path.length - 1];
    if (o && o.spend && u.turn) u.turn.move = Math.max(0, u.turn.move - 5 * path.length);
    u.x = end[0]; u.y = end[1]; delete u.tween; u.anim = 'idle';
    if (u.turn) u.turn.moved = (u.turn.moved || 0) + 5 * path.length;
  };
  // a blow out of reach (anyone strikes anyone: his "correct - up for debate later"): struck from the nearest open square beside the target -- a shot past its
  // range from the nearest in range, not beside a foe
  S.closeIn = function (B, u, t, need, ranged) {
    if (!t || t.x == null || G.dist(u, t) <= need) return false;
    var h = S.homeOf(B, u), best = null, bs = 1e9;
    for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) {
      if (!G.canStand(u, x, y) || G.dist(u, t, x, y) > need) continue;
      var near = ranged && B.units.some(function (w) { return G.hostile(u, w) && G.standing(w) && G.dist(u, w, x, y) <= 5; }) ? 100 : 0, s = near + Math.abs(x - h[0]) + Math.abs(y - h[1]);
      if (s < bs) { bs = s; best = [x, y]; }
    }
    if (!best) return false;
    u.x = best[0]; u.y = best[1]; delete u.tween; if (B.faceTo) u.facing = B.faceTo(u, t);
    return true;
  };
  var atk0 = Battle.prototype.attack;
  Battle.prototype.attack = function* (att, tgt, atk, o) {
    if (this.simple && att && tgt && tgt.x != null && !(o && o.oa) && !S.boundTo(this, att)) {
      var melee = !atk || (!atk.ranged && (!atk.spell || atk.touch));
      S.closeIn(this, att, tgt, melee ? Math.max(G.reachOf(att), (atk && atk.reach) || 0) : (atk.range && atk.range[0]) || 60, !melee);
    }
    return yield* atk0.apply(this, arguments);
  };
  // RUN: the first game's (js/battle.js tryRun -- d20 + DEX against 10 + the quickest foe's DEX), the grid's law on who may go (none left behind down or held)
  var ex0 = Battle.prototype.exec;
  Battle.prototype.exec = function* (u, c) {
    if (!(this.simple && c && c.do === 'simplerun')) return yield* ex0.apply(this, arguments);
    var T = u.turn, hb = this.heldBack(u);
    if (hb) { D.sfx('miss'); this.card(['{o}' + Battle.refuseText(hb) + '{/}'], 260); yield 20; return; }
    var best = 0; this.units.forEach(function (w) { if (w.side === 'foe' && G.standing(w) && !w.object) best = Math.max(best, D.mod(w.abil.dex)); });
    var d = D.d(20), md = D.mod(u.abil.dex), tot = d + md, dc = 10 + best;
    T.action = 0; T.attacksLeft = 0;
    if (tot >= dc) { this.card(['{y}' + u.name + '{/}: RUN -- d20 ' + d + ' ' + RU.sign(md) + ' = ' + tot + ' against ' + dc + ': {n}the party slips away!{/}'], 300); yield 20; yield* this.leave(u); }
    else { D.sfx('miss'); this.card(['{y}' + u.name + '{/}: RUN -- d20 ' + d + ' ' + RU.sign(md) + ' = ' + tot + ' against ' + dc + ': {o}can\'t get away!{/}'], 300); yield 40; }
  };

  // ------------------------------------------------------------------ THE SPELL EFFECT SCALER (his "probably need to have a 'spell effect scaler' accompanying simple
  // combat"; the seat's lean, RULED 10-21 on his "yes to the simple fight leans"): an area is aimed at one creature, and takes it and the nearest standing of its side
  // -- the first game's counts (js/battle.js: a cone 3, a line 4, a wide burst every one), read off the grid's template: a cone, a cube, a wave or round the caster 3;
  // a line 4; a sphere of 15 ft or more, a cube of 20 ft or more, every one of that side; a smaller sphere 3. Both sides alike: a foe's Fireball takes the party, never
  // its own
  S.AREA = { cone: 3, cube: 3, wave: 3, around: 3, line: 4, sphere: 3, bigSphere: 15, bigCube: 20 };
  S.areaCount = function (g) {
    if (g.shape === 'sphere' && (g.r || 0) >= S.AREA.bigSphere) return 99;
    if (g.shape === 'cube' && (g.size || 0) >= S.AREA.bigCube) return 99;
    return S.AREA[g.shape] || 3;
  };
  S.areaUnits = function (B, u, g, cx, cy) {
    var live = function (w) { return G.standing(w) && !w.object && !w.left && !w.ethereal; }, pick = null;
    if (g.shape === 'around') pick = B.units.filter(function (w) { return G.hostile(u, w) && live(w); }).sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
    else {
      pick = G.occupant(cx, cy); if (pick && (pick === u && /^(cone|line|wave)$/.test(g.shape))) pick = null;
      if (!pick || !live(pick)) pick = B.units.filter(function (w) { return live(w) && !(w === u && /^(cone|line|wave)$/.test(g.shape)); })
        .sort(function (a, b) { return (Math.abs(a.x - cx) + Math.abs(a.y - cy)) - (Math.abs(b.x - cx) + Math.abs(b.y - cy)); })[0];
    }
    if (!pick) return [];
    var side = B.units.filter(function (w) { return w.side === pick.side && live(w) && w !== pick; }).sort(function (a, b) { return G.dist(pick, a) - G.dist(pick, b); });
    return [pick].concat(side).slice(0, S.areaCount(g));
  };
  var area0 = D.magic.area;
  D.magic.area = function (u, g, cx, cy, cz) {
    var B = D.battle;
    if (!B || !B.simple || !g || !/^(sphere|cube|cone|line|wave|around)$/.test(g.shape)) return area0.apply(this, arguments);
    var out = []; S.areaUnits(B, u, g, cx, cy).forEach(function (w) { G.foot(w).forEach(function (q) { out.push(q); }); });
    return out;
  };

  // ------------------------------------------------------------------ the hand's turn: the commands, the lists, the targets (the first game's battle, js/battle.js heroTurn)
  function T_(u) { return u.turn || {}; }
  S.acts = function (u) { var T = T_(u); return T.action > 0 || T.attacksLeft > 0 || T.hasteAction > 0; };
  S.cmd = function (B, u, id) { return B.commands(u).filter(function (c) { return c.id === id; })[0] || null; };
  function live(w) { return G.standing(w) && !w.object && !w.left && !w.ethereal; }
  S.foes = function (B, u) { return B.units.filter(function (w) { return G.hostile(u, w) && live(w) && !w.riding; }).sort(function (a, b) { var ha = S.homeOf(B, a), hb = S.homeOf(B, b); return (ha[0] + ha[1]) - (hb[0] + hb[1]) || (hb[0] - hb[1]) - (ha[0] - ha[1]); }); }; // (top of the screen first)
  S.friends = function (B, u, down) { return B.units.filter(function (w) { return w.side === u.side && G.present(w) && !w.object && !w.left && !w.familiar && (down || w.hp > 0); }); };
  function nearestFoe(B, u, t) { var fs = S.foes(B, u); if (t) fs.sort(function (a, b) { return G.dist(t, a) - G.dist(t, b); }); return fs[0] || null; }
  // the action spent, is a bonus action (or ACTION SURGE) still worth the menu? (his "yes to the simple fight leans": Cunning Action and Healing Word after the
  // swing, the SRD's bonus action any time in the turn). Second Wind at full health keeps no one waiting
  S.bonusLeft = function (B, u) {
    var T = T_(u), sg = S.cmd(B, u, 'surge');
    if (sg && sg.ok && S.foes(B, u).length) return true;
    if (!(T.bonus > 0) || !S.foes(B, u).length) return false;
    var off = S.cmd(B, u, 'offhand');
    if (off && off.ok) return true;
    if (S.spells(B, u).some(function (e) { return e.ok && /bonus/.test(e.right); })) return true;
    if (S.items(B, u).some(function (e) { return e.ok && e.right === 'bonus'; })) return true;
    return S.skills(B, u).some(function (e) { return e.ok && e.right === 'bonus' && !(e.c.id === 'secondwind' && u.hp >= u.maxhp); });
  };
  // what follows a command by itself: FIGHT's attacks left at the one picked (the next nearest if it fell); the action spent and no bonus action worth the menu,
  // the turn ends. null: the hand is asked
  S.autoNext = function (B, u) {
    var m = S.menu(B, u), T = T_(u);
    if (m.fight) {
      if (T.attacksLeft > 0 && T.attacksLeft !== m.left0) { var t = live(m.fight) ? m.fight : nearestFoe(B, u, m.fight); if (t) { m.fight = t; m.left0 = T.attacksLeft; return { do: 'attack', target: t }; } }
      m.lastPick = m.fight; m.fight = null;
    }
    if (!S.foes(B, u).length) return { do: 'end' };
    if (!S.acts(u)) { if (m.after == null) m.after = S.bonusLeft(B, u); if (!m.after) return { do: 'end' }; }
    return null;
  };
  S.menu = function (B, u) {
    var m = B.simple.m;
    if (!m || m.u !== u) m = B.simple.m = { u: u, mode: 'cmd', sel: B.simple.last[u.id] || 0, stack: [], t0: B.t };
    return m;
  };
  // the column's commands: the first game's five while the action is left -- FIGHT, MAGIC, SKILL, ITEM, RUN; after it, what a bonus action can do -- OFF HAND (the
  // second weapon's swing), MAGIC, SKILL, ITEM -- and END TURN
  S.root = function (B, u) {
    var T = T_(u), mg = S.spells(B, u), sk = S.skills(B, u), it = S.items(B, u), fast = u.subclass === 'Thief' && T.bonus > 0;
    var MAGIC = { label: 'MAGIC', ok: mg.some(function (e) { return e.ok; }), why: mg.length ? 'nothing castable now' : 'no spells', go: function () { S.openList(B, u, 'MAGIC', mg); } };
    var SKILL = { label: 'SKILL', ok: sk.some(function (e) { return e.ok; }), why: 'nothing to use now', go: function () { S.openList(B, u, 'SKILL', sk); } };
    var ITEM = { label: 'ITEM', right: fast ? 'bonus' : '', ok: it.some(function (e) { return e.ok; }), why: it.length ? 'nothing usable now' : 'nothing in the pack for a fight', go: function () { S.openList(B, u, 'ITEM', it); } };
    if (!S.acts(u)) {
      var off = S.cmd(B, u, 'offhand');
      return (off ? [{ label: 'OFF HAND', right: 'bonus', ok: !!off.ok, why: off.why, go: function () { S.pickFoe(B, u, 'OFF HAND', null, function (t) { return { do: 'offhand', target: t }; }); } }] : [])
        .concat([MAGIC, SKILL, ITEM, { label: 'END TURN', ok: true, go: function () { S.send(B, u, { do: 'end' }); } }]);
    }
    return [
      { label: 'FIGHT', ok: !!S.foes(B, u).length, why: 'no foe standing', go: function () { S.pickFoe(B, u, 'FIGHT', null, function (t) { return S.fightCmd(B, u, t); }); } },
      MAGIC, SKILL, ITEM,
      { label: 'RUN', ok: B.takesParty(), why: 'there is no running from this', go: function () { S.send(B, u, { do: 'simplerun' }); } }
    ];
  };
  // ---- FIGHT
  S.fightCmd = function (B, u, t) { var m = S.menu(B, u); m.fight = t; m.left0 = null; return { do: 'attack', target: t }; };
  // ---- MAGIC: the grid's own list (js/magic.js M.list) with range and reach let go -- a spell aimed at one creature, any one of the kind it takes
  var AIMS = { self: 'none', around: 'none', single: 'side', touch: 'friend', attack: 'foe', rays: 'foe', darts: 'foe', splash: 'foe', sphere: 'side', cube: 'side', cone: 'foe', line: 'foe', wave: 'foe', allies: 'friends' };
  // whom a spell offers, in the order the list shows them: the foes for a harm (an area with no side named is a harm -- Fireball offered our own first, and the
  // first pick burned the caster: 10-21, the seat's own walk), our own for a help -- a heal, a buff, a cure, a shape -- and a summons or a ground set by our own
  var HELPS = { heal: 1, buff: 1, cure: 1, shape: 1 }, OURS = { summon: 1, ground: 1 };
  S.targets = function (B, u, g, sp) {
    var kind = AIMS[g.shape], k = (sp && sp.kind) || '';
    if (kind === 'none' || kind === 'friends') return [];
    var ok = function (w) { return G.present(w) && !w.left && !w.ethereal; };
    if (kind === 'friend') return S.friends(B, u, true).filter(function (w) { return (!w.object || g.obj) && !D.magic.targetWhy(u, g, w, B); });
    var foes = S.foes(B, u).filter(function (w) { return D.magic.targetKind(B, u, g, w); }), ours = S.friends(B, u, HELPS[k] && k !== 'buff').filter(function (w) { return ok(w) && D.magic.targetKind(B, u, g, w); });
    if (kind === 'foe' || g.side === 'foe') return foes;
    if (g.side === 'ally' || OURS[k]) return ours;
    if (HELPS[k]) return ours.concat(foes);
    if (g.side === 'any' || g.shape === 'single') return foes.concat(ours);
    return foes;
  };
  S.spells = function (B, u) {
    if (!u.known || !u.known.length) return [];
    return D.magic.list(B, u, { anyTarget: true }).map(function (e) {
      var g = e.g, kind = AIMS[g.shape], why = e.why, ok = e.ok;
      if (!kind) { ok = false; why = why || 'aimed on the full grid'; }
      else if (ok && kind !== 'none' && kind !== 'friends' && !S.targets(B, u, g, e.sp).length) { ok = false; why = 'no one here it takes'; }
      return { label: e.name.toUpperCase(), right: (g.time === 'B' ? 'bonus ' : '') + (e.level ? 'L' + e.level : ''), ok: ok, why: why, e: e,
        go: function () { if (e.levels.length > 1) S.openSlots(B, u, e); else S.aimSpell(B, u, e, e.slot); } };
    });
  };
  S.openSlots = function (B, u, e) {
    S.openList(B, u, e.name.toUpperCase() + ': AT WHAT LEVEL?', e.levels.map(function (L) { return { label: 'LEVEL ' + L, right: (u.slots[L - 1] || 0) + ' left', ok: true, go: function () { S.aimSpell(B, u, e, L); } }; }));
  };
  S.spellCmd = function (B, u, e, slot, t) {
    var g = e.g, n = (g.n || 1) + Math.max(0, slot - (e.level || 0)), c = { do: 'cast', id: e.id, slot: slot };
    if (g.shape === 'self') c.target = u;
    else if (g.shape === 'around') { var f = nearestFoe(B, u, u); c.target = f ? { x: f.x, y: f.y } : { x: u.x, y: u.y }; }
    else if (g.shape === 'allies') { var fr = S.friends(B, u).filter(function (w) { return !D.magic.targetWhy(u, g, w, B); }); if (e.id === 'bless' || g.side !== 'foe') fr.sort(function (a, b) { return (b === u) - (a === u); }); c.target = { units: (g.side === 'foe' ? S.foes(B, u) : fr).slice(0, n) }; }
    else if (g.shape === 'rays' || g.shape === 'darts') { var us = []; for (var k = 0; k < n; k++) us.push(t); c.target = { units: us }; } // (all at the one: his "spell targeting is single foe")
    else if (/^(sphere|cube|cone|line|wave)$/.test(g.shape)) c.target = { x: t.x, y: t.y, z: D.magic.aimAt(t, g) };
    else c.target = t;
    if (t && t !== u && D.magic.touchRange(g)) S.closeIn(B, u, t, 5, false); // (a touch: from beside the one touched)
    return c;
  };
  S.aimSpell = function (B, u, e, slot) {
    var kind = AIMS[e.g.shape];
    if (kind === 'none' || kind === 'friends') return S.send(B, u, S.spellCmd(B, u, e, slot, null));
    S.pickFrom(B, u, e.name.toUpperCase() + (e.level ? ' (L' + slot + ')' : '') + ': at whom?', S.targets(B, u, e.g, e.sp), function (t) { return S.spellCmd(B, u, e, slot, t); });
  };
  // ---- ITEM: the grid's own list (battle.js itemList)
  S.items = function (B, u) {
    return B.itemList(u).map(function (e) {
      var fx = e.use && e.use.effect, ok = e.ok, why = e.why;
      if (fx === 'rope' || /torch|lantern/.test(e.id) && fx !== 'light') { ok = false; why = why || 'used on the full grid'; }
      return { label: String(e.name).toUpperCase() + (e.n > 1 ? ' x' + e.n : ''), right: e.cost === 'B' ? 'bonus' : '', ok: ok, why: why, go: function () { S.aimItem(B, u, e); } };
    });
  };
  S.itemCmd = function (B, u, e, t) { if (t && t !== u) S.closeIn(B, u, t, 5, false); return { do: 'item', id: e.id, target: t, putAway: !!e.putAway, cost: e.cost }; };
  S.aimItem = function (B, u, e) {
    var fx = e.use && e.use.effect;
    if (fx === 'bucket' || fx === 'light' || fx === 'fortify') return S.send(B, u, S.itemCmd(B, u, e, u));
    var list = fx === 'damage' || fx === 'mirror' ? S.foes(B, u) : fx === 'revive' ? S.friends(B, u, true).filter(function (w) { return w.hp <= 0; }) : S.friends(B, u);
    S.pickFrom(B, u, e.name.toUpperCase() + ': on whom?', list, function (t) { return S.itemCmd(B, u, e, t); });
  };
  // ---- SKILL: the grid's commands with no walk in them (battle.js commands) -- a feature aimed at one creature picks it
  var NOT = { attack: 1, skipattack: 1, spells: 1, items: 1, offhand: 1, end: 1, leave: 1, dash: 1, cdash: 1, disengage: 1, cdisengage: 1, ready: 1, stand: 1, land: 1, passage: 1, rope: 1, takerope: 1, ropeclimb: 1, cutrope: 1, bucketrope: 1, barreltorch: 1, throwtorch: 1, droptorch: 1, pickuptorch: 1, dashmove: 1, move: 1, drawoffhand: 1, putaway: 1 };
  var TOOLS = { shove: 'foe', grapple: 'foe', throw: 'foe', help: 'any', detach: 'friend', breaktendril: 'friend', pullout: 'friend', lay: 'friend' };
  S.skills = function (B, u) {
    var out = [];
    (function add(cs) { cs.forEach(function (c) { if (c.items) return add(c.items); if (!NOT[c.id] && !c.sub) out.push(c); }); })(B.commands(u));
    return out.map(function (c) {
      var aim = c.tool ? TOOLS[c.tool] : c.aim ? AIMS[c.aim.shape] : null, ok = c.ok, why = c.why;
      if ((c.tool && !aim) || (c.aim && !aim)) { ok = false; why = 'aimed on the full grid'; }
      else if (!ok && aim && /reach|beside (you|it)|in range|within \d+ ft/.test(why || '')) { ok = true; why = ''; } // (no one near: anyone strikes anyone, from beside them)
      return { label: c.label, right: c.cost === 'B' ? 'bonus' : c.cost === 'F' ? 'free' : '', ok: ok, why: why, c: c, go: function () { S.aimSkill(B, u, c, aim); } };
    });
  };
  S.skillCmd = function (B, u, c, t) {
    if (c.aim) { var e = { id: c.id, g: c.aim, level: 0 }, sc = S.spellCmd(B, u, e, 0, t); return { do: c.id, target: sc.target }; }
    if (t && t !== u && (c.tool && c.tool !== 'throw')) S.closeIn(B, u, t, G.reachOf(u), false);
    return t ? { do: c.id, target: t } : { do: c.id };
  };
  S.aimSkill = function (B, u, c, aim) {
    if (!aim || aim === 'none' || aim === 'friends') return S.send(B, u, S.skillCmd(B, u, c, null));
    var list = aim === 'foe' ? S.foes(B, u) : aim === 'friend' ? S.friends(B, u, true) : aim === 'any' ? S.foes(B, u).concat(S.friends(B, u, true).filter(function (w) { return w !== u; })) : c.aim ? S.targets(B, u, c.aim) : S.foes(B, u);
    S.pickFrom(B, u, c.label + ': at whom?', list, function (t) { return S.skillCmd(B, u, c, t); });
  };

  // ------------------------------------------------------------------ the menu's modes: the column's commands, a list (MAGIC, ITEM, SKILL, a spell's levels), a target pick
  S.openList = function (B, u, title, items) { var m = S.menu(B, u); m.stack.push({ mode: m.mode, sel: m.sel, list: m.list, pick: m.pick }); var f = 0; items.some(function (e, i) { if (e.ok) { f = i; return true; } return false; }); m.mode = 'list'; m.list = { title: title, items: items, top: 0 }; m.sel = f; m.msg = null; D.sfx('confirm'); };
  S.pickFrom = function (B, u, title, cands, then) {
    var m = S.menu(B, u);
    if (!cands.length) { D.sfx('error'); m.msg = '{g}' + title.replace(/: .*$/, '') + ': no one here it takes.{/}'; return; }
    m.stack.push({ mode: m.mode, sel: m.sel, list: m.list, pick: m.pick });
    var i0 = cands.indexOf(m.lastPick); m.mode = 'pick'; m.pick = { title: title, cands: cands, then: then }; m.sel = i0 >= 0 ? i0 : 0; m.msg = null; D.sfx('confirm');
  };
  S.pickFoe = function (B, u, title, _, then) { S.pickFrom(B, u, title + ': at whom?', S.foes(B, u), then); };
  S.back = function (B, u) { var m = S.menu(B, u), p = m.stack.pop(); if (!p) return; m.mode = p.mode; m.sel = p.sel; m.list = p.list; m.pick = p.pick; m.msg = null; D.sfx('cancel'); };
  S.send = function (B, u, cmd, auto) {
    var m = S.menu(B, u);
    if (!auto) { B.clearCards(); B.simple.last[u.id] = m.mode === 'cmd' && S.acts(u) ? m.sel : B.simple.last[u.id]; m.stack = []; m.mode = 'cmd'; m.list = null; m.pick = null; m.msg = null; m.sel = 0; }
    m.wait = true; m.root = null; m.after = null; B.answer(cmd);
  };
  S.rootOf = function (B, u) { var m = S.menu(B, u); if (!m.root) m.root = S.root(B, u); return m.root; }; // (built once a request: the lists ask the grid's rules)
  S.rows = function (B, u) { var m = S.menu(B, u); return m.mode === 'cmd' ? S.rootOf(B, u) : m.mode === 'list' ? m.list.items : []; };
  function choose(B, u, r) {
    var m = S.menu(B, u);
    if (!r) return;
    if (!r.ok) { D.sfx('error'); m.msg = '{g}' + r.label + ': ' + (r.why || 'not now') + '.{/}'; return; }
    if (m.mode === 'cmd' && S.acts(u)) B.simple.last[u.id] = m.sel;
    r.go();
  }
  function pickDone(B, u, t) { var m = S.menu(B, u); if (!t) return; m.lastPick = t; D.sfx('confirm'); S.send(B, u, m.pick.then(t)); }

  // ------------------------------------------------------------------ input: the keys and the mouse (UI.input, the turn's)
  function hit(r) { var mo = I.mouse; return mo.inside && mo.x >= r.x && mo.x < r.x + r.w && mo.y >= r.y && mo.y < r.y + r.h; }
  S.turnInput = function (B, u) {
    var m = S.menu(B, u);
    if (m.wait) return;
    var auto = S.autoNext(B, u); if (auto) { S.send(B, u, auto, true); return; }
    var rects = B.simple.rects || [], mo = I.mouse;
    if (m.mode === 'pick') {
      var C = m.pick.cands, n = C.length;
      if (I.repeat('up') || I.repeat('left')) { m.sel = (m.sel + n - 1) % n; D.sfx('cursor'); }
      if (I.repeat('down') || I.repeat('right')) { m.sel = (m.sel + 1) % n; D.sfx('cursor'); }
      var over = S.unitAt(B, mo.x, mo.y, C), row = rects.filter(function (r) { return r.kind === 'pick' && hit(r); })[0], back = rects.filter(function (r) { return r.kind === 'back' && hit(r); })[0], party = rects.filter(function (r) { return r.kind === 'party' && hit(r) && C.indexOf(r.u) >= 0; })[0];
      if (mo.moved) { if (over) m.sel = C.indexOf(over); else if (row) m.sel = row.i; else if (party) m.sel = C.indexOf(party.u); }
      if (mo.click) { if (back) return S.back(B, u); if (over) return pickDone(B, u, over); if (row) return pickDone(B, u, C[row.i]); if (party) return pickDone(B, u, party.u); }
      if (mo.rclick || I.pressed('b')) return S.back(B, u);
      if (I.pressed('a')) return pickDone(B, u, C[m.sel]);
      return;
    }
    var rows = S.rows(B, u), N = rows.length;
    if (!N) return;
    if (m.sel >= N) m.sel = N - 1;
    if (I.repeat('up')) { m.sel = (m.sel + N - 1) % N; m.msg = null; D.sfx('cursor'); }
    if (I.repeat('down')) { m.sel = (m.sel + 1) % N; m.msg = null; D.sfx('cursor'); }
    if (m.mode === 'list' && mo.wheel) { m.sel = Math.max(0, Math.min(N - 1, m.sel + (mo.wheel > 0 ? 1 : -1))); }
    var hr = rects.filter(function (r) { return r.kind === 'row' && hit(r); })[0], hb = rects.filter(function (r) { return r.kind === 'back' && hit(r); })[0];
    if (hr && mo.moved && hr.i !== m.sel) { m.sel = hr.i; D.sfx('cursor'); }
    for (var k = 1; k <= 9; k++) if (I.pressed('n' + k) && rows[k - 1]) { m.sel = k - 1; return choose(B, u, rows[k - 1]); }
    if (mo.click) { if (hb) return S.back(B, u); if (hr) { m.sel = hr.i; return choose(B, u, rows[hr.i]); } }
    if (I.pressed('a')) return choose(B, u, rows[m.sel]);
    if ((I.pressed('b') || mo.rclick) && m.mode === 'list') return S.back(B, u);
  };
  var in0 = UI.input;
  UI.input = function (B, req) {
    if (!B.simple) return in0.apply(this, arguments);
    if (req && req.turn && !B.menu) return S.turnInput(B, req.turn);
    var my = I.mouse.y; I.mouse.y = my - OFF; // (the grid's own windows -- a prompt, the entry card -- are drawn a band lower: S.draw)
    try { return in0.apply(this, arguments); } finally { I.mouse.y = my; }
  };
  var or0 = UI.onRequest;
  UI.onRequest = function (B, req) { var r = or0.apply(this, arguments); if (B.simple && req && req.turn) { var m = S.menu(B, req.turn); m.wait = false; m.root = null; } return r; };

  // ------------------------------------------------------------------ the picture's camera: the lineup filling the picture, one zoom deeper where it fits (his "maybe one
  // zoom deeper"), held still
  S.PIC = function () { return { x: 0, y: OFF + 14, w: PX0, h: D.H - OFF - 14 }; }; // (the picture: left of the column, under the words and the turn order)
  S.camera = function (B) {
    var iso = D.iso, c = B.simple.cam;
    if (!c) {
      var mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9, P = S.PIC();
      B.units.forEach(function (u) {
        if (!G.present(u) || u.left || u.object) return;
        var h = S.homeOf(B, u), s = u.size || 1, p = iso.center(h[0] + (s - 1) / 2, h[1] + (s - 1) / 2, 0), top = (D.spr.unitTop ? D.spr.unitTop(u) : 40) || 40, hw = 18 * s;
        mnx = Math.min(mnx, p.x - hw); mxx = Math.max(mxx, p.x + hw); mny = Math.min(mny, p.y - top - 6); mxy = Math.max(mxy, p.y + 10 * s);
      });
      if (mnx > mxx) { var p0 = iso.center(S.C[0], S.C[1], 0); mnx = p0.x - 100; mxx = p0.x + 100; mny = p0.y - 80; mxy = p0.y + 80; }
      var R = D.R || 1, fit = Math.min(P.w / (mxx - mnx), P.h / (mxy - mny)), z = fit >= 1 ? 1 : Math.max(1 / R, Math.floor(fit * R) / R);
      // the screen's middle of the picture: the world drawn a band down (S.draw), so its y is the band's
      c = B.simple.cam = { z: z, x: (mnx + mxx) / 2 - (P.x + P.w / 2 - D.W / 2) / z, y: (mny + mxy) / 2 - (P.y + P.h / 2 - OFF - D.H / 2) / z };
    }
    iso.zoom = c.z; iso.cam.x = Math.round(c.x); iso.cam.y = Math.round(c.y);
  };
  // the screen point a unit is drawn at (its feet), and the one under the mouse among `cands`
  S.screenOf = function (B, u) { var d = u.drawAt || u, s = u.size || 1, p = D.iso.center(d.x + (s - 1) / 2, d.y + (s - 1) / 2, G.gzAt(u, Math.round(d.x), Math.round(d.y))), q = D.iso.toScreen(p.x, p.y); return { x: q.x, y: q.y + OFF }; };
  S.unitAt = function (B, mx, my, cands) {
    if (my < OFF || mx >= PX0) return null;
    var z = D.iso.zoom, best = null, bd = 1e9;
    (cands || B.units).forEach(function (u) {
      var p = S.screenOf(B, u), top = (u.hp > 0 && D.spr.unitTop ? D.spr.unitTop(u) : 16) * z, hw = 12 * (u.size || 1) * z;
      if (mx < p.x - hw || mx > p.x + hw || my < p.y - top || my > p.y + 6 * z) return;
      var d = Math.abs(mx - p.x) + Math.abs(my - (p.y - top / 2)) * 0.5; if (d < bd) { bd = d; best = u; }
    });
    return best;
  };

  // ------------------------------------------------------------------ the draw: the grid's picture a band down, the words over it, the 8-bit's windows down the right
  var draw0 = UI.drawBattle;
  UI.drawBattle = function (ctx, B) {
    if (!B.o || !B.o.simple) return draw0.apply(this, arguments);
    if (!B.simple) S.setup(B);
    S.place(B); S.camera(B);
    var req = B.req, cards = B.cards, cur = B.cursor, cine = B.cine, ins = I.mouse.inside, act = B.active;
    B.req = null; B.cards = []; B.cursor = { x: -99, y: -99 }; B.cine = true; I.mouse.inside = false; B.active = null; // (no ring, bar, strip, cursor, active square, hover or cards of the grid's: the windows, the words and the turn order are this file's)
    ctx.save(); ctx.translate(0, OFF);
    try { draw0.call(this, ctx, B); } finally { ctx.restore(); B.req = req; B.cards = cards; B.cursor = cur; B.cine = cine; I.mouse.inside = ins; B.active = act; }
    S.draw(ctx, B);
    var my = I.mouse.y;
    if (req && (req.prompt || req.entry || req.scene) && UI.drawReq) { // (the grid's own window -- a prompt, the entry card -- over the windows, a band lower as the picture is)
      I.mouse.y = my - OFF; ctx.save(); ctx.translate(0, OFF);
      try { UI.drawReq(ctx, B, req); } finally { ctx.restore(); I.mouse.y = my; }
    }
  };
  S.banner = function (B) {
    var m = B.simple.m, act = B.simple.act, now = (B.cards || []).filter(function (c) { return B.t - c.t0 < c.life && (!m || c.t0 >= m.t0); }), c = now[now.length - 1];
    if (m && m.msg) return [m.msg];
    if (c) return c.lines.slice(0, 4);
    if (m && !m.wait) return [m.mode === 'pick' ? m.pick.title : !S.acts(m.u) ? '{y}' + m.u.name + '{/}: the action is spent -- a bonus action, or END TURN' : m.u.name];
    return act ? [act.side === 'party' ? act.name : '{r}' + (B.shortName ? B.shortName(act) : act.name) + '{/}'] : [''];
  };
  function fit(s, w) { s = String(s); if (D.textWidth(s) <= w) return s; while (s.length > 3 && D.textWidth(s + '…') > w) s = s.slice(0, -1); return s + '…'; }
  // the column: the four's hit points at its head, guests under them; the commands (or the foes' names between turns) at its foot
  S.COL = function (B) {
    var guests = B.units.filter(function (w) { return w.side === 'party' && (w.guest || w.ally || w.summon) && !w.familiar && !w.object && !w.left && !w.dead; }).slice(0, 6);
    var ph = 8 + 4 * 20, gh = guests.length ? 8 + guests.length * 12 : 0, rowsN = 5, ch = 10 + rowsN * 14, fy = OFF + ph + gh;
    return { x: PX0, w: RW, party: { y: OFF, h: ph }, guests: { y: OFF + ph, h: gh, list: guests }, foes: { y: fy, h: D.H - ch - fy }, cmds: { y: D.H - ch, h: ch } };
  };
  S.draw = function (ctx, B) {
    var m = B.simple.m, u = m && !m.wait ? m.u : null, rects = B.simple.rects = [], blink = ((B.t >> 4) & 1) === 0, L = S.COL(B);
    // the words
    var lines = S.banner(B), bh = Math.max(OFF, 8 + lines.length * 10), ty = Math.round((bh - lines.length * 10) / 2) + 1;
    D.win8(ctx, 0, 0, D.W, bh);
    lines.forEach(function (l, i) { D.text(ctx, fit(l, D.W - 16), 8, ty + i * 10, W8.text); });
    S.drawStrip(ctx, B);
    // the column
    ctx.fillStyle = '#05050c'; ctx.fillRect(L.x, OFF, L.w, D.H - OFF);
    D.win8(ctx, L.x, L.party.y, L.w, L.party.h);
    if (L.guests.h) D.win8(ctx, L.x, L.guests.y, L.w, L.guests.h);
    if (L.foes.h >= 20) D.win8(ctx, L.x, L.foes.y, L.w, L.foes.h);
    D.win8(ctx, L.x, L.cmds.y, L.w, L.cmds.h);
    S.drawParty(ctx, B, L, rects);
    S.drawFoes(ctx, B, L);
    if (u && m.mode === 'cmd') S.drawRows(ctx, B, S.rootOf(B, u), m.sel, L.x + 10, L.cmds.y + 7, L.w - 20, 14, rects);
    // a list or a pick: a window out of the column, over the picture, its foot on the screen's
    if (u && m.mode === 'list') S.drawList(ctx, B, m.list.title, m.list.items, m, rects);
    if (u && m.mode === 'pick') {
      var C = m.pick.cands;
      S.drawList(ctx, B, m.pick.title, C.map(function (w) { return { label: w.side === 'party' ? w.name : (B.shortName ? B.shortName(w) : w.name), right: w.hp > 0 ? (w.side === 'party' ? w.hp + '/' + w.maxhp : '') : 'down', ok: true, u: w }; }), m, rects, 'pick');
      var t = C[m.sel]; if (t && blink) { var p = S.screenOf(B, t), top = (D.spr.unitTop ? D.spr.unitTop(t) : 20) * D.iso.zoom; D.text(ctx, '▼', p.x, p.y - top - 12, W8.gold, 'center'); }
    }
  };
  // the turn order along the picture's top: the round, then each one still in it, ours blue and theirs red, whose turn it is in a box
  S.drawStrip = function (ctx, B) {
    var x = 6, y = OFF + 4, act = B.simple.act;
    ctx.fillStyle = 'rgba(6,6,16,.55)'; ctx.fillRect(0, OFF, PX0, 14);
    x += D.text(ctx, 'R' + Math.max(1, B.round || 1), x, y, W8.gold) + 6;
    (B.order || []).forEach(function (w) {
      if (w.dead || w.left || x > PX0 - 20) return;
      var nm = w.side === 'party' ? w.name : (B.shortName ? B.shortName(w) : w.name), tw = D.textWidth(nm);
      if (x + tw > PX0 - 6) { D.text(ctx, '…', x, y, GREY); x = PX0; return; }
      if (w === act) { ctx.fillStyle = W8.sel; ctx.fillRect(x - 2, y - 2, tw + 4, 11); ctx.strokeStyle = W8.gold; ctx.strokeRect(x - 1.5, y - 1.5, tw + 3, 10); }
      D.text(ctx, nm, x, y, w.side === 'party' ? (w === act ? W8.gold : '#9cc8f8') : '#f88070');
      x += tw + 6;
    });
  };
  S.drawRows = function (ctx, B, rows, sel, x, y, w, rh, rects) {
    rows.forEach(function (r, i) {
      var ry = y + i * rh, on = i === sel;
      D.text(ctx, r.label, x + 12, ry + 2, r.ok ? W8.text : GREY);
      if (r.right) D.text(ctx, r.right, x + w, ry + 2, r.ok ? '#b8b8f8' : GREY, 'right');
      if (on) D.text(ctx, '▶', x, ry + 2, W8.text);
      rects.push({ kind: 'row', i: i, x: x - 4, y: ry, w: w + 8, h: rh });
    });
  };
  S.drawList = function (ctx, B, title, items, m, rects, kind) {
    var vis = 12, n = items.length, rh = 11, w = 236, top = Math.max(0, Math.min(m.list && kind !== 'pick' ? m.list.top || 0 : 0, n - vis));
    if (m.sel < top) top = m.sel; if (m.sel >= top + vis) top = m.sel - vis + 1;
    if (m.list && kind !== 'pick') m.list.top = top;
    var shown = Math.min(vis, n), h = 22 + shown * rh + 14, y = D.H - h, x = PX0 - w;
    D.win8(ctx, x, y, w, h);
    D.text(ctx, fit(title, w - 16), x + 8, y + 6, W8.gold);
    for (var i = top; i < top + shown; i++) {
      var r = items[i], ry = y + 18 + (i - top) * rh, on = i === m.sel;
      if (on) { ctx.fillStyle = W8.sel; ctx.fillRect(x + 4, ry - 1, w - 8, rh); }
      D.text(ctx, fit(r.label, w - 90), x + 18, ry, r.ok ? W8.text : GREY);
      if (r.right) D.text(ctx, r.right, x + w - 10, ry, r.ok ? '#b8b8f8' : GREY, 'right');
      if (on) D.text(ctx, '▶', x + 7, ry, W8.text);
      rects.push({ kind: kind || 'row', i: i, x: x + 4, y: ry - 1, w: w - 8, h: rh });
    }
    if (top > 0) D.text(ctx, '▲', x + w - 14, y + 6, W8.mid);
    if (top + shown < n) D.text(ctx, '▼', x + w - 14, y + h - 12, W8.mid);
    var bk = { kind: 'back', x: x + 8, y: y + h - 13, w: 44, h: 11 }; rects.push(bk);
    D.text(ctx, 'BACK', bk.x + 10, bk.y + 1, hit(bk) ? W8.gold : '#b8b8f8');
  };
  // the foes' window between: their names, the first game's way (a name and how many)
  S.drawFoes = function (ctx, B, L) {
    var groups = {}, order = [], n = Math.max(0, Math.floor((L.foes.h - 10) / 12));
    B.units.forEach(function (w) { if (w.side !== 'foe' || !live(w) || w.riding) return; var nm = B.shortName ? B.shortName(w) : w.name; if (!groups[nm]) { groups[nm] = 0; order.push(nm); } groups[nm]++; });
    order.slice(0, n).forEach(function (nm, i) { var y = L.foes.y + 6 + i * 12; D.text(ctx, fit(nm, L.w - 46), L.x + 10, y, '#f0b8a8'); if (groups[nm] > 1) D.text(ctx, 'x' + groups[nm], L.x + L.w - 10, y, '#c8d0e8', 'right'); });
  };
  var TAGS = { prone: 'PRONE', grappled: 'HELD', restrained: 'HELD', poisoned: 'POISON', frightened: 'FEAR', charmed: 'CHARM', paralyzed: 'PARA', stunned: 'STUN', blinded: 'BLIND', invisible: 'INVIS', hidden: 'HID', blessed: 'BLESS', asleep: 'SLEEP', exhaustion: 'EXH', dodge: 'DODGE', raging: 'RAGE', hasted: 'HASTE', slowed: 'SLOW' };
  function hpCol(w) { var hp = Math.max(0, w.hp); return w.hp <= 0 || w.dead ? '#9c9c9c' : hp < w.maxhp / 4 ? '#f85838' : hp < w.maxhp / 2 ? '#f8d878' : W8.text; }
  S.drawParty = function (ctx, B, L, rects) {
    var four = B.units.filter(function (w) { return w.side === 'party' && !w.guest && !w.familiar && !w.summon && !w.object && !w.ally; }).slice(0, 4), act = B.simple.act, x = L.x + 8, bw = L.w - 16;
    four.forEach(function (w, i) {
      var y = L.party.y + 6 + i * 20, hp = Math.max(0, w.hp), c0 = hpCol(w);
      D.text(ctx, fit(w.name, bw - 44), x, y, act === w ? W8.gold : c0);
      D.text(ctx, (w.left ? 'OUT ' : w.hp <= 0 || w.dead ? 'KO ' : '') + hp + '/' + w.maxhp, x + bw, y, c0, 'right');
      ctx.fillStyle = '#1a1a2a'; ctx.fillRect(x, y + 11, bw, 3);
      ctx.fillStyle = c0 === W8.text ? '#58d854' : c0; ctx.fillRect(x, y + 11, Math.round(bw * Math.max(0, Math.min(1, hp / w.maxhp))), 3);
      var tags = Object.keys(w.conds || {}).filter(function (k) { return TAGS[k] && w.conds[k]; }).map(function (k) { return TAGS[k]; });
      if (w.conc && w.conc.name) tags.unshift('*' + String(w.conc.name).slice(0, 4).toUpperCase());
      if (tags.length) { ctx.fillStyle = W8.bg; var tx = tags.slice(0, 2).join(' '), tw = D.textWidth(tx); ctx.fillRect(x + bw - tw - 2, y + 9, tw + 2, 8); D.text(ctx, tx, x + bw, y + 8, '#b8b8f8', 'right'); }
      rects.push({ kind: 'party', u: w, x: x - 2, y: y - 2, w: bw + 4, h: 19 });
    });
    L.guests.list.forEach(function (w, i) {
      var y = L.guests.y + 5 + i * 12, c0 = hpCol(w);
      D.text(ctx, fit(w.name, bw - 44), x, y, act === w ? W8.gold : '#c8d0e8');
      D.text(ctx, Math.max(0, w.hp) + '/' + w.maxhp, x + bw, y, c0, 'right');
      rects.push({ kind: 'party', u: w, x: x - 2, y: y - 1, w: bw + 4, h: 12 });
    });
  };
})();
