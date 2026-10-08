/* DEEP16 — the show (10-02, Griz: "build a permanent 'test ground' with various lighting levels in it, and script a fight that should display all
   the animations twice ... Should probably include NPCs with different views (wizard with bat & snake, someone with dark vision)"): a creature's
   sheet in a real fight on the test ground (data/maps.js testground: bright, dim and dark; slate), every row of it played twice.

     deep16/?show=grick                two of it (&n=) against four who watch by different eyes, the class AI on both sides: a wizard with a bat
                                       (its blindsight: the sonar), a wizard with a snake (the tongue), a dwarf fighter (darkvision), a human rogue
                                       (by the room's lamp alone). &lvl= the watchers' level (3); &stone=brown|grey (the test ground is slate); several
                                       creatures: ?show=grick,xorn

   The director (the seat's calls, 10-02: a test, never a rule of the game) --
     * the creature goes first, so its Still and its Reveal play before anyone can wake it;
     * every blow at it or from it lands (js/battle.js attack: B.show), so a blow that follows a hit -- the grick's beak -- plays, and the flinch;
     * no one drops below 1 HP till the director says (the watchers stay up to watch; the creature lives till it has shown its rows), and the
       creature has three times its hit points, so it flinches a while before it is down to its last;
     * one that has not walked by the end of a turn is walked toward the watchers (a roper holds its ground): a step or two for its walk,
       three squares and more for its slither where it has one; one with a thrown blow of its own row it has not shown by the end of its
       second turn throws it at the nearest watcher (the stone giant's rock, 10-06); one no one has hit by the end of its second turn has a
       stone flung at it (its flinch);
     * once in the fight, at the end of its second turn, each is knocked flat: its prone frame, and getting up at its next turn;
     * at the start of a turn, one that has shown every row it has (or any, from round 8) goes down: its death row.
   The tally counts what the engine plays, not what is drawn: a row set on the unit (a run of sets between two steps of the fight is the last
   one), a fall, a death, the Still from the start. The fight's last card reads it -- each row's count, and what played fewer than twice;
   B.showTally and B.showReport hold it. dev/bench16.py <creature> mode=show runs it headless: FAIL for a row under two. Recipe:
   deep16/blender-monsters.md, step 12. */
'use strict';
(function () {
  var D = window.D16;
  var SH = D.show = {};
  SH.ROUNDS = 8;    // by this round every one on show goes down, shown or not
  SH.HP = 3;        // its hit points, times
  var LOOPS = { idle: 1, walk: 1, slither: 1, roost: 1, braid: 1, run: 1, still: 1, fly: 1, sit: 1, rofl: 1 }; // (a loop counts when it starts, not each time it is set again)

  // the rows a sheet has, and 'prone' where it has a prone frame (js/sprites.js S.PRONE, the LPC fall row)
  SH.rowsOf = function (sheet) {
    var sh = D.SHEETS && D.SHEETS[sheet]; if (!sh) return [];
    var r = Object.keys(sh.anims);
    if (D.spr.proneFrame(sheet) >= 0 && r.indexOf('prone') < 0) r.push('prone'); // (a `prone` row of its own counts as the fall: the tally's 'prone')
    return r;
  };
  function see(B, u, row) {
    var t = B.showTally[u.sheet] = B.showTally[u.sheet] || {};
    t[row] = (t[row] || 0) + 1;
    (u.showSeen = u.showSeen || {})[row] = (u.showSeen[row] || 0) + 1;
  }
  // every set of u.anim bumps a count; the step after reads what it was left at
  function watch(u) {
    var cur = u.anim;
    u.showSeq = 0;
    Object.defineProperty(u, 'anim', { configurable: true, enumerable: true, get: function () { return cur; }, set: function (v) { cur = v; u.showSeq++; } });
  }
  function poll(B) {
    B.units.forEach(function (u) {
      if (!u.show) return;
      var s = u.showState = u.showState || { seq: 0, anim: u.anim, down: false, prone: false }, down = u.hp <= 0 || !!u.dead;
      if (!down && u.showSeq !== s.seq) {
        s.seq = u.showSeq;
        if (u.anim && D.spr.anim(u.sheet, u.anim) && (!LOOPS[u.anim] || u.anim !== s.anim)) see(B, u, u.anim);
        s.anim = u.anim;
      }
      if (down && !s.down && D.spr.anim(u.sheet, 'hurt')) see(B, u, 'hurt');
      s.down = down;
      var pr = !!u.conds.prone && !down;
      if (pr && !s.prone && D.spr.proneFrame(u.sheet) >= 0) see(B, u, 'prone');
      s.prone = pr;
      var cl = !down && !!u.riding && u.perch === 'over' && !!D.spr.anim(u.sheet, 'clamp'); // (on a head: js/ui.js plays its Clamp row there, the darkmantle's -- 10-08)
      if (cl && !s.clamp) see(B, u, 'clamp');
      s.clamp = cl;
    });
  }
  // a sheet's `attack` row is only the fallback for a blow with no row of its own: where every one of the creature's attacks has its own (the
  // xorn's claw, claw2, claw3, bite -- js/battle.js attack picks the attack's name), it never plays. Not wanted twice; the report says so
  SH.fallback = function (sheet, kind) {
    var d = kind && D.FOES[kind], sh = D.SHEETS && D.SHEETS[sheet];
    if (!d || !sh || !sh.anims.attack) return false;
    var ks = Object.keys(d.attacks || {});
    return ks.length > 0 && ks.every(function (k) { var a = d.attacks[k]; return a.spell || sh.anims[String(a.name || k).toLowerCase().replace(/[^a-z]/g, '')]; });
  };
  // (a climb row is not wanted here: the test ground is flat, nothing to climb -- it plays on a face or a rope, js/ui.js; the troll's and the stone giant's, 10-04.
  // A hide row is: the goblin's Hide is built since 10-07 -- the AI's own after its turn, and the director's beat below where it has not shown it twice)
  SH.wanted = function (sheet, kind) { var fb = SH.fallback(sheet, kind); return SH.rowsOf(sheet).filter(function (r) { return !(fb && r === 'attack') && r !== 'climb'; }); };
  // has it shown every row it has (but its death)?
  function shown(u) { return SH.wanted(u.sheet, u.kind).every(function (r) { return r === 'hurt' || (u.showSeen || {})[r]; }); }

  // ------------------------------------------------------------------ the director: the creature's turns (js/battle.js run hands them here; D.ai.turn
  // itself is left as it is -- dev/bench16.js reads its source for a rule)
  var turn0 = function (B, u) { return D.ai.turn(B, u); };
  SH.turn = function* (B, u) {
    if (u.hp > 0 && !u.dead && ((shown(u) && !u.conds.prone) || B.round >= SH.ROUNDS)) { // (one knocked flat gets up first: the prone row played back)
      u.showFree = true; B.focus(u);
      B.card(['{c}THE SHOW{/}: the ' + u.name + (shown(u) ? ' has shown every row it has.' : ' is out of time (round ' + SH.ROUNDS + ').') + ' Down it goes.'], 260);
      yield 30; B.hurt(u, u.hp, 'force'); yield 60; return;
    }
    yield* turn0(B, u);
    if (u.hp <= 0 || u.dead) return;
    var seen = u.showSeen || {}, RU = D.rules;
    u.showTurns = (u.showTurns || 0) + 1;
    // one that has not walked by the end of its turn (a roper holds its ground and reels): a few squares toward the watchers, to see its walk --
    // a step or two for its `walk`, three squares or more for its `slither` where it has one (js/battle.js moveAlong picks the gait by the length)
    var gaits = [['walk', 1, 2], ['slither', 3, 6]].filter(function (g) { return !seen[g[0]] && D.spr.anim(u.sheet, g[0]) && (g[0] === 'walk' || D.spr.anim(u.sheet, 'walk')); });
    if (gaits.length && u.speed > 0 && RU.canAct(u) && !u.conds.restrained && !u.conds.prone) { // (holding someone too: a roper's tendrils reach 50 ft)
      var g = gaits[0], them = B.units.filter(function (w) { return w.side === 'party' && D.grid.standing(w) && !w.familiar; });
      var rm = D.grid.reach(u, Math.min(g[2] * 5 + 10, u.speed)), best = null, bd = Infinity;
      Object.keys(rm).forEach(function (k) {
        var c = rm[k]; if (!c.stand || !c.prev) return;
        var len = D.grid.path(rm, c.x, c.y).length; if (len < g[1] || len > g[2]) return;
        var d = Math.min.apply(null, them.map(function (w) { return Math.max(Math.abs(w.x - c.x), Math.abs(w.y - c.y)); }).concat([99]));
        if (d >= 1 && d < bd) { bd = d; best = c; }
      });
      if (best) {
        B.card(['{c}THE SHOW{/}: the ' + u.name + ' has not shown its ' + g[0] + ' yet. ' + (g[0] === 'walk' ? 'A step or two' : 'Three squares and more') + ', to see it.'], 200);
        yield* B.moveAlong(u, D.grid.path(rm, best.x, best.y), { noOA: true });
        u.anim = 'idle';
      }
    }
    // one with a thrown or shot blow of its own row it has not shown by the end of its second turn (the stone giant's rock: the AI throws only
    // with no one in its reach, and on the test ground a giant's 15 ft always has someone -- 10-06): one throw at the nearest watcher it sees,
    // through the engine's own attack
    var rk = Object.keys(u.attacks || {}).filter(function (k) { var a = u.attacks[k], r = String(a.name || k).toLowerCase().replace(/[^a-z]/g, ''); return a.ranged && a.range && !(u.showSeen || {})[r] && D.spr.anim(u.sheet, r); })[0];
    if (rk && u.showTurns >= 2 && RU.canAct(u) && !u.conds.prone) {
      var ra = u.attacks[rk], tw = B.units.filter(function (w) { return w.side === 'party' && D.grid.standing(w) && !w.familiar && D.grid.dist(u, w) <= ra.range[1] && D.magic.sees(B, u, w); }).sort(function (a, b) { return D.grid.dist(u, a) - D.grid.dist(u, b); })[0];
      if (tw) {
        B.card(['{c}THE SHOW{/}: the ' + u.name + ' has not shown its ' + String(ra.name || rk).toLowerCase() + ' yet. One at ' + tw.name + ', to see it.'], 200);
        yield* B.attack(u, tw, ra); u.anim = 'idle';
      }
    }
    // one with a catch row it has not shown by the end of its second turn (the stone giant's Rock Catching, 10-08: in a fight only another giant ever throws a rock at
    // her): a rock hurled at it through the engine's own attack -- a fellow's Rock where one stands (its own kind first), else the nearest watcher's stone -- with the
    // d20 pinned to a 20, so the DEX save holds and the catch is seen (js/battle.js attack: CAUGHT, its row)
    if (u.rockCatch && D.spr.anim(u.sheet, 'catch') && !(u.showSeen || {}).catch && u.showTurns >= 2 && u.hp > 1 && !u.conds.prone) {
      var hurls = function (w) { return Object.keys(w.attacks || {}).filter(function (k) { return w.attacks[k].hurled; })[0]; };
      var by = B.units.filter(function (w) { return w !== u && !w.dead && w.hp > 0 && hurls(w) && RU.canAct(w); }).sort(function (a, b) { return (a.kind === u.kind ? 0 : 1) - (b.kind === u.kind ? 0 : 1) || D.grid.dist(u, a) - D.grid.dist(u, b); })[0];
      var ha = by ? by.attacks[hurls(by)] : { name: 'Stone', atk: 5, dice: '1d4', mod: 0, type: 'bludgeoning', range: [20, 60], ranged: true, fx: 'rock', hurled: true };
      if (!by) by = B.units.filter(function (w) { return w.side === 'party' && D.grid.standing(w) && !w.familiar; }).sort(function (a, b) { return D.grid.dist(u, a) - D.grid.dist(u, b); })[0];
      if (by) {
        B.card(['{c}THE SHOW{/}: the ' + u.name + ' has not shown its catch yet. ' + (by.side === u.side ? 'A fellow giant' : by.name) + ' hurls a rock at it, the d20 pinned, to see it caught.'], 220);
        var dc0 = D.d; D.d = function (n) { return n === 20 ? 20 : dc0.apply(this, arguments); };
        try { yield* B.attack(by, u, ha); } finally { D.d = dc0; }
        by.anim = 'idle'; u.anim = 'idle';
      }
    }
    // one with a hide row it has not shown twice by the end of its second turn (the goblin's crouch behind its shield, 10-07): its Hide through the engine's own Battle.hide -- the
    // bonus action, the d20 pinned to a 20 and its Stealth lifted past what any watcher's eyes could beat (the human rogue's passive Perception 18 and the front's +11 stood at 29 on
    // the first run: the dice must bring a Hide that holds, so that the row is seen held) -- one it already holds from the AI's own Hide is let go first (the watchers looked), and
    // one the AI hid this turn is not hidden again. The row is held while it stays hidden (js/ui.js); a watcher's Search or a blow at it ends it
    if (D.spr.anim(u.sheet, 'hide') && ((u.showSeen || {}).hide || 0) < 2 && u.showTurns >= 2 && u.turn && !u.turn.hid && RU.canAct(u) && !u.conds.prone && u.hp > 0) {
      delete u.conds.hidden; delete u.hidTotal; u.turn.bonus = 1;
      B.card(['{c}THE SHOW{/}: the ' + u.name + ' has not shown its hide yet. Its Hide, the d20 pinned, a Stealth no watcher beats, to see it held.'], 200);
      var d0 = D.d, st0 = u.stealth; D.d = function (n) { return n === 20 ? 20 : d0.apply(this, arguments); }; u.stealth = 40;
      try { yield* B.hide(u, true); } finally { D.d = d0; u.stealth = st0; }
      u.anim = 'idle'; u.animT = B.t;
    }
    // one with a clamp row it has not shown by the end of its second turn (the darkmantle over a head, his sheet, 10-08): its Crush takes the head only with
    // advantage on one Medium or smaller (js/battle.js attack, perch 'over'; js/ui.js plays the row there), and the watchers rarely give it that -- one Crush
    // through the engine's own attack at the one it rides or the nearest such watcher in reach, the d20 pinned to a 20 and its edge set to advantage
    var ck = Object.keys(u.attacks || {}).filter(function (k) { return u.attacks[k].attach && !u.attacks[k].stinger; })[0];
    if (ck && D.spr.anim(u.sheet, 'clamp') && !(u.showSeen || {}).clamp && u.showTurns >= 2 && RU.canAct(u) && u.hp > 1 && !u.conds.prone && u.perch !== 'over') {
      var ca = u.attacks[ck], cw = u.riding && u.master && !D.Battle.overMedium(u.master) ? u.master : B.units.filter(function (w) { return w.side === 'party' && D.grid.standing(w) && !w.familiar && !D.Battle.overMedium(w) && D.grid.dist(u, w) <= (ca.reach || 5); }).sort(function (a, b) { return D.grid.dist(u, a) - D.grid.dist(u, b); })[0];
      if (cw) {
        B.card(['{c}THE SHOW{/}: the ' + u.name + ' has not shown its clamp yet. Its ' + (ca.name || ck) + ' at ' + cw.name + ', the d20 pinned and with advantage, to see it take the head.'], 220);
        var dk0 = D.d, ed0 = RU.edges; D.d = function (n) { return n === 20 ? 20 : dk0.apply(this, arguments); };
        RU.edges = function (a) { var e = ed0.apply(this, arguments); if (a === u) { e.adv = (e.adv || []).concat(['the show']); e.dis = []; e.net = 1; } return e; };
        try { yield* B.attack(u, cw, ca); } finally { D.d = dk0; RU.edges = ed0; }
        u.anim = 'idle'; u.animT = B.t;
      }
    }
    // one with a blow of its own row it has not shown by the end of its second turn, a watcher in its reach (the spirit naga casts every turn and never bit, 10-08):
    // one swing through the engine's own attack, the dice as they fall -- a miss shows the row as well as a hit
    var mk = Object.keys(u.attacks || {}).filter(function (k) { var a = u.attacks[k], r = String(a.name || k).toLowerCase().replace(/[^a-z]/g, ''); return !a.ranged && !a.spell && !a.needsHeld && D.spr.anim(u.sheet, r) && !(u.showSeen || {})[r]; })[0];
    if (mk && u.showTurns >= 2 && RU.canAct(u) && !u.conds.prone && u.hp > 0 && !u.riding) {
      var ma = u.attacks[mk], mreach = ma.reach || u.reach || 5, mwatch = B.units.filter(function (w) { return w.side === 'party' && D.grid.standing(w) && !w.familiar; });
      var near = function () { return mwatch.filter(function (w) { return D.grid.dist(u, w) <= mreach; }).sort(function (a, b) { return D.grid.dist(u, a) - D.grid.dist(u, b); })[0]; };
      var mw = near();
      if (!mw && u.speed > 0 && !u.conds.restrained) { // (it keeps its distance -- a caster: up into reach first, by the shortest way)
        var mrm = D.grid.reach(u, u.speed), mbest = null, mlen = Infinity;
        Object.keys(mrm).forEach(function (k) {
          var c = mrm[k]; if (!c.stand || !c.prev) return;
          if (!mwatch.some(function (w) { return Math.max(Math.abs(w.x - c.x), Math.abs(w.y - c.y)) * 5 <= mreach; })) return;
          var len = D.grid.path(mrm, c.x, c.y).length; if (len < mlen) { mlen = len; mbest = c; }
        });
        if (mbest) { yield* B.moveAlong(u, D.grid.path(mrm, mbest.x, mbest.y), { noOA: true }); u.anim = 'idle'; mw = near(); }
      }
      if (mw) {
        B.card(['{c}THE SHOW{/}: the ' + u.name + ' has not shown its ' + String(ma.name || mk).toLowerCase() + ' yet. One at ' + mw.name + ', to see it.'], 200);
        yield* B.attack(u, mw, ma); u.anim = 'idle'; u.animT = B.t;
      }
    }
    // one no one has hit by the end of its second turn (the watchers fight what is nearest; a roper stays back): a stone flung at it, through
    // the engine's own hurt, to see it flinch
    if (!(u.showSeen || {}).flinch && D.spr.anim(u.sheet, 'flinch') && u.showTurns >= 2 && u.hp > 1) {
      u.anim = 'idle';
      B.card(['{c}THE SHOW{/}: a stone flung at the ' + u.name + ', to see it flinch.'], 200);
      B.hurt(u, 1, 'bludgeoning'); yield 30;
    }
    if (!u.conds.prone && !seen.prone && D.spr.proneFrame(u.sheet) >= 0 && !u.noProne && u.showTurns >= 2) {
      u.conds.prone = true;
      B.card(['{c}THE SHOW{/}: the ' + u.name + ' is knocked flat, to see it lie there. It gets up on its turn.'], 240);
      yield 50;
    }
  };
  // no one drops below 1 HP till the director lets it
  var hurt0 = D.Battle.prototype.hurt;
  D.Battle.prototype.hurt = function (u, n, type) {
    if (this.show && u && u.hp > 0 && !u.showFree && (u.show || u.side === 'party')) n = Math.min(n, u.hp - 1);
    return hurt0.call(this, u, n, type, arguments[3]); // (the blow's magic, Stoneskin's: 10-03)
  };

  // ------------------------------------------------------------------ the report
  SH.report = function (B) {
    var lines = ['{c}THE SHOW{/}: what the engine played (two of each wanted)'];
    Object.keys(B.showTally).forEach(function (sheet) {
      var t = B.showTally[sheet], kind = B.showKind[sheet], rows = SH.wanted(sheet, kind), bits = rows.map(function (r) { var c = t[r] || 0; return (c >= 2 ? '{n}' : '{r}') + r + ' ' + c + '{/}'; });
      lines.push(sheet + ':');
      for (var i = 0; i < bits.length; i += 5) lines.push('  ' + bits.slice(i, i + 5).join('  '));
      var low = rows.filter(function (r) { return (t[r] || 0) < 2; });
      lines.push(low.length ? '  {r}under two: ' + low.join(', ') + '{/}' : '  {n}every row twice{/}');
      if (SH.fallback(sheet, kind)) lines.push('  {g}(its `attack` row never plays: every blow has a row of its own){/}');
      // (10-02, Griz: "make sure if it can be prone it looks prone when it is": one that can be knocked flat but has no frame for it stands while prone)
      var d = kind && D.FOES[kind];
      if (D.spr.proneFrame(sheet) < 0 && d && !d.noProne && (d.condImmune || []).indexOf('prone') < 0) lines.push('  {o}no prone frame: it stands while prone (deep16-art-wanted.md, PRONE someday){/}');
    });
    return lines;
  };

  // ------------------------------------------------------------------ the fight
  SH.fight = function (q, o) {
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var L = Math.max(1, Math.min(9, +get('lvl') || 3)), kinds = (get('show') || 'grick').split(',').filter(function (k) { return D.FOES[k]; }), n = Math.max(1, +get('n') || 2);
    if (!kinds.length) kinds = ['grick'];
    var stone = get('stone'), mapId = 'testground';
    if (stone && stone !== 'slate') { mapId = 'testground_' + stone; D.MAPS[mapId] = Object.assign({}, D.MAPS.testground, { stone: stone === 'brown' ? undefined : stone }); }
    var foes = []; kinds.forEach(function (k) { for (var i = 0; i < n; i++) foes.push(k); });
    var F = { id: 'show', level: L, map: mapId, name: 'The Test Ground', sub: 'the show: ' + kinds.join(', ') + (stone ? ' (' + stone + ')' : ''),
      intro: 'Bright by the lamp, dim past it, dark at the far end. Four watch by their own eyes. Every row, twice.',
      from: 'js/show.js (10-02)', won: 'THE SHOW IS OVER.', lost: 'THE SHOW WENT WRONG.', foes: [], wave: null, noFlee: true };
    var B = new D.Battle(Object.assign({ npc: { foes: foes, party: ['wizard:' + L, 'wizard:' + L, 'fighter:' + L + ':dwarf', 'rogue:' + L + ':human'] }, watch: true,
      familiars: [{ kind: 'bat', by: 'p0-wizard' }, { kind: 'snake', by: 'p1-wizard' }], fightDef: F }, o || {}));
    B.show = true; B.showTally = {}; B.showKind = {};
    var enter0 = B.enter;
    B.enter = function () { enter0.apply(this, arguments); SH.setup(this); };
    B.finish = function* (res) { this.showReport = SH.report(this); this.card(this.showReport, 1e9); yield* D.Battle.prototype.finish.call(this, res); };
    return B;
  };
  SH.setup = function (B) {
    B.units.forEach(function (u) {
      if (u.side !== 'foe') return;
      u.show = true; u.maxhp = u.hp = u.hp * SH.HP; u.init = (u.init || 0) + 100; // (first in the order: its Still and Reveal before anyone wakes it)
      if (u.bound) u.bound = null; // (bound to water -- the spirit naga, `bound: '~'` -- on a dry test ground it never moved: let loose for the show, 10-08)
      watch(u);
      B.showTally[u.sheet] = B.showTally[u.sheet] || {}; B.showKind[u.sheet] = u.kind;
      if (D.spr.anim(u.sheet, 'still')) see(B, u, 'still'); // (shown from the start till its first turn: js/ui.js)
    });
    // (no torch: the room's own lamp is the light -- 10-02, Griz: "please pull the torch ... and have the test room light source be in the room")
    var inner = B.co;
    B.co = (function* () { var v; while (true) { var r = inner.next(v); poll(B); if (r.done) return r.value; v = yield r.value; } })();
  };
})();
