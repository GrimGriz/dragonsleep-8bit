/* DEEP16 — THE KEEPER, PLAYED (10-03, Griz asked for two play modes; js/keeper.js is the rules and the AI's turn, this is the hands).
   ?keeperfight&play=keeper&lvl=3  A HUMAN IS THE KEEPER, the class AI the party. Its turn is a menu in the page's own style (the prompt window, numbered buttons, gold squares to
     pick where to move): MOVE within its water, SLAM one in its reach, the WAVE (bonus), READY THE ICE WALL, SWIRL a hero on the deep, ACTIVE SUFFOCATION (bonus, swirling),
     LET GO, BREAK FREE of the ice (a bonus action, then the action), END TURN. Its reaction (the opportunity attack) is automatic.
   ?keeperfight&play=party&lvl=3   THE PARTY IS PLAYED: by the page as ever (the keys, the mouse) or by a script, D16.keeperPlay, one call a turn, returning the state; the Keeper is the AI.
     D16.keeperPlay.state()            the whole state as JSON: round, who is deciding, every unit (square, lane frame, HP, conditions, who holds whom), the Keeper's (swirling who, frozen, hidden),
                                       the wall's sections, the ice, the map's lane geometry, and for the hero deciding what is legal: reachable squares, who it can strike, the spells it can cast, the rest
     D16.keeperPlay.act(plan)          one turn: plan = { move: {x,y} | {a,c}, do: 'attack'|'cast'|'dodge'|'dash'|'disengage'|'help'|'breakfree'|'hide'|'none', target: <id> | {x,y} | {wall:[x,y]}
                                       | {units:[ids]}, spell: <id>, slot: <n>, keep: true } -- the move, then the action, then the turn ends (unless keep: true, which leaves it his to go on)
                                       -- returns a Promise of the state at the next decision (the page's own frame loop runs the foe's turns between); a prompt the game puts to the hero (an
                                       opportunity attack, a dash) is in state().pending.prompt and is answered by act({ answer: <value> })
     D16.keeperPlay.actSync(plan)      the same, stepping the game itself (the probe, a page with no frame loop): returns the state
   Both are the real rules: the same B.exec the keys and the mouse use, the same K.* the AI uses. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, K = D.keeper, M = D.magic;
  var KP = D.keeperPlay = {};
  function Nm(B, u) { return K.Nm(B, u); }

  // ================================================================== A: the Keeper's turn as a menu
  KP.humanTurn = function* (B, u) {
    var S = K.st(B); K.pose(); K.face(B, u);
    if (S.ready) { S.ready = null; B.card(['{g}Your readied wall: the moment passed.{/}'], 160); }
    var guard = 0;
    while (guard++ < 40 && !u.dead && u.hp > 0 && !B.over()) {
      var T = u.turn, heroes = K.foesOf(B, u), reach = G.reachOf(u, u.reach), opts = [], held = u.conds.restrained && u.conds.restrained.ice;
      var vic = u.flooding ? B.units.filter(function (w) { return w.id === u.flooding.vic; })[0] : null;
      if (held) {
        if (T.bonus > 0) opts.push({ label: 'BREAK FREE (BONUS, DC ' + K.CFG.iceDC + ')', value: { do: 'ice', slot: 'bonus' } });
        if (T.action > 0) opts.push({ label: 'BREAK FREE (ACTION)', value: { do: 'ice', slot: 'action' } });
      } else if (u.flooding) {
        if (T.bonus > 0 && vic) opts.push({ label: 'ACTIVE SUFFOCATION (BONUS)', value: { do: 'suffocate' } });
        opts.push({ label: 'LET GO, RISE', value: { do: 'rise' } });
      } else {
        if (T.action > 0) heroes.filter(function (w) { return !w.conds.hidden || G.dist(u, w) <= (u.blindsight || 0); }).filter(function (w) { return G.dist(u, w) <= reach; }).slice(0, 4)
          .forEach(function (w) { opts.push({ label: 'SLAM ' + w.name.toUpperCase() + ' (DC 15 STR OR PRONE)', value: { do: 'slam', id: w.id } }); });
        if (T.bonus > 0 && K.canWave(B, u)) opts.push({ label: 'THE WAVE (BONUS)', value: { do: 'wave' } });
        if (T.action > 0 && K.canReadyWall(B, u)) opts.push({ label: 'READY THE ICE WALL', value: { do: 'ready' } });
        if (T.action > 0) heroes.filter(function (w) { return K.isDeep(w.x, w.y) && !w.conds.restrained; }).slice(0, 2).forEach(function (w) { opts.push({ label: 'SWIRL ' + w.name.toUpperCase(), value: { do: 'swirl', id: w.id } }); });
        if (T.move > 0 && !u.conds.restrained) opts.push({ label: 'MOVE (' + T.move + ' FT)', value: { do: 'move' } });
      }
      opts.push({ label: 'END TURN', value: { do: 'end' } });
      var lines = ['MOVE ' + T.move + ' FT   ACTION ' + (T.action > 0 ? 'READY' : 'spent') + '   BONUS ' + (T.bonus > 0 ? 'READY' : 'spent') + '   AC ' + RU.ac(u) + '  HP ' + u.hp + '/' + u.maxhp,
        held ? 'You are held in ice.' : u.flooding ? 'You are the swirl about ' + (vic ? vic.name : 'no one') + '.' : 'You are in your water: ' + heroes.map(function (w) { return w.name + ' ' + G.dist(u, w) + ' ft' + (w.conds.prone ? ' (prone)' : ''); }).join(', ') + '.'];
      var pick = yield { prompt: { who: u, title: 'THE KEEPER: YOUR TURN', lines: lines, opts: opts } };
      if (!pick || pick.do === 'end') break;
      yield* KP.keeperDo(B, u, pick);
      if (B.over()) break;
    }
    K.finish(B, u);
  };
  // one thing the Keeper does (the menu's, and the scripted Keeper's)
  KP.keeperDo = function* (B, u, c) {
    var T = u.turn, t = c.id ? B.units.filter(function (w) { return w.id === c.id; })[0] : null;
    switch (c.do) {
      case 'slam': if (t && T.action > 0) { T.action = 0; K.face(B, u, t); D.fx.keeperSlam(u, t); yield* B.attack(u, t, u.attacks.slam); u.anim = 'idle'; u.animT = B.t; if (u.conds.hidden) delete u.conds.hidden; } return;
      case 'wave': if (T.bonus > 0 && (yield* K.wave(B, u))) T.bonus = 0; return;
      case 'ready': if (T.action > 0 && K.canReadyWall(B, u)) yield* K.readyWall(B, u); return;
      case 'swirl': if (t && T.action > 0) { T.action = 0; yield* K.flood(B, u, t); } return;
      case 'suffocate': if (u.flooding && T.bonus > 0) { var v = B.units.filter(function (w) { return w.id === u.flooding.vic; })[0]; if (v) yield* K.suffocate(B, u, v); } return;
      case 'rise': if (u.flooding) { var h = B.units.filter(function (w) { return w.id === u.flooding.vic; })[0]; K.surface(B, u, 'it lets go'); if (h) B.release(u, h); } return;
      case 'ice': if (u.conds.restrained && u.conds.restrained.ice) yield* K.iceTry(B, u, c.slot); return;
      case 'move': {
        var rm = G.reach(u, T.move), list = [];
        Object.keys(rm).forEach(function (k) { var e = rm[k]; if (e.stand && e.cost > 0) list.push({ x: e.x, y: e.y, size: u.size, conds: {}, name: 'HERE', cost: e.cost }); });
        if (!list.length) return;
        var opts = list.map(function (e, i) { return { label: 'LANE ' + K.A(e) + '/' + K.C(e) + ' (' + e.cost + ' FT)', value: i + 1 }; }); opts.push({ label: 'NOT NOW', value: 0 });
        var a = yield { prompt: { who: u, title: 'THE KEEPER: MOVE WHERE?', lines: ['A gold square, E or a click; X is not now.'], opts: opts, pick: list } };
        if (!a) return;
        var sq = list[a - 1], path = G.path(rm, sq.x, sq.y);
        if (path && path.length) { K.face(B, u); yield* B.moveAlong(u, path, { spend: true }); K.face(B, u); }
        return;
      }
    }
  };

  // ================================================================== B: the party as a script
  function lane(p) { return { a: K.A(p), c: K.C(p) }; }
  function brief(B, u) {
    var r = u.conds && u.conds.restrained;
    return { id: u.id, name: u.name, side: u.side, kind: u.kind || u.cls || null, x: u.x, y: u.y, size: u.size || 1, lane: lane(u), hp: u.hp, maxhp: u.maxhp, ac: RU.ac(u), down: u.hp <= 0, dead: !!u.dead,
      conds: Object.keys(u.conds || {}).filter(function (k) { return u.conds[k]; }), prone: !!(u.conds && u.conds.prone), hidden: !!(u.conds && u.conds.hidden),
      held: r ? { by: r.by, water: !!r.water, ice: !!r.ice, dc: r.dc } : null, drowning: !!(u.conds && u.conds.drowning),
      turn: u.turn ? { move: u.turn.move, action: u.turn.action, bonus: u.turn.bonus, reaction: u.reaction } : null,
      swirling: u.flooding ? u.flooding.vic : null };
  }
  function pending(B) {
    var r = B.req; if (!r) return B.co ? { type: 'running' } : { type: 'over' };
    if (r.turn) return { type: 'turn', who: r.turn.id };
    if (r.prompt) return { type: 'prompt', who: r.prompt.who && r.prompt.who.id, title: r.prompt.title, lines: r.prompt.lines, opts: r.prompt.opts.map(function (o) { return { label: o.label, value: o.value }; }) };
    if (r.entry) return { type: 'entry' };
    return { type: 'other', keys: Object.keys(r) };
  }
  function legal(B, u) {
    var T = u.turn, rm = G.reach(u, T.move), moves = [], k;
    Object.keys(rm).forEach(function (key) { var e = rm[key]; if (e.stand) moves.push({ x: e.x, y: e.y, lane: lane(e), cost: e.cost }); });
    var melee = !(u.weapon && u.weapon.ranged), range = melee ? G.reachOf(u, 5) : ((u.weapon && u.weapon.range) || 60), targets = [];
    B.units.forEach(function (w) { if (w.side !== u.side && G.standing(w) && G.dist(u, w) <= range) targets.push({ id: w.id, name: w.name, dist: G.dist(u, w) }); });
    var kp = B.kp, wall = [];
    if (kp && kp.wall) kp.wall.sections.forEach(function (sec) { (sec.targets || []).forEach(function (p) { if (G.dist(u, p) <= range) wall.push({ wall: [p.x, p.y], dist: G.dist(u, p) }); }); });
    var spells = []; try { spells = M.list(B, u).filter(function (e) { return e.ok; }).map(function (e) { return { id: e.id, name: e.name, slot: e.slot, shape: e.g && e.g.shape, range: e.g && e.g.range }; }); } catch (e) { spells = []; }
    var swirlSq = []; var kk = K.keeperOf(B); if (kk && kk.flooding) G.foot(kk).forEach(function (q) { swirlSq.push({ x: q[0], y: q[1] }); });
    return { moves: moves, strike: targets, strikeWall: wall, swirlSquares: swirlSq, spells: spells,
      other: { dodge: T.action > 0, dash: T.action > 0 && !u.conds.restrained, disengage: T.action > 0, breakfree: !!u.conds.restrained && T.action > 0, help: T.action > 0, hide: T.action > 0, end: true } };
  }
  KP.state = function () {
    var B = D.battle; if (!B) return null;
    var u = B.req && B.req.turn ? B.req.turn : null, kk = K.keeperOf(B), S = B.kp;
    return { mode: B.o && B.o.play, round: B.round, over: !!(B.result || !B.co), result: B.result || null, pending: pending(B), active: u && u.id, t: B.t,
      units: B.units.filter(function (w) { return !w.isWall; }).map(function (w) { return brief(B, w); }),
      keeper: kk ? { id: kk.id, lane: lane(kk), swirling: kk.flooding ? kk.flooding.vic : null, frozen: !!(kk.conds.restrained && kk.conds.restrained.ice), hidden: !!kk.conds.hidden, ac: RU.ac(kk), hp: kk.hp } : null,
      wall: S && S.wall ? { a: S.wall.a, sections: S.wall.sections.map(function (sec) { return { sq: sec.sq, hp: sec.hp }; }) } : null, wallUses: S ? S.uses : K.CFG.wallUses, wallReady: !!(S && S.ready),
      ice: S ? Object.keys(S.ice) : [], map: { w: G.map.w, h: G.map.h, geo: G.map.def.geo, deeps: G.map.def.deeps },
      legal: u ? legal(B, u) : null };
  };
  function target(B, t) {
    if (t == null) return null;
    if (typeof t === 'string') return B.units.filter(function (w) { return w.id === t || w.name === t; })[0] || null;
    if (t.wall) return K.wallAt(B, t.wall[0], t.wall[1]);
    if (t.units) return { units: t.units.map(function (i) { return target(B, i); }).filter(Boolean) };
    if (t.a != null) { var o = K.at(t.a, t.c); return { x: o[0], y: o[1], size: 1 }; }
    if (t.x != null) return { x: t.x, y: t.y, size: 1 };
    return null;
  }
  // the commands a plan comes to, in the order the keys would give them
  function commands(B, u, plan) {
    var out = [];
    if (plan.move) { var m = plan.move, sq = m.a != null ? K.at(m.a, m.c) : [m.x, m.y]; out.push({ do: 'move', x: sq[0], y: sq[1] }); }
    var d = plan.do && plan.do !== 'none' ? plan.do : null, t = target(B, plan.target);
    if (d === 'attack') out.push({ do: 'attack', target: t });
    else if (d === 'cast') out.push({ do: 'cast', id: plan.spell, slot: plan.slot != null ? plan.slot : (M.data(plan.spell) || {}).level || 0, target: t });
    else if (d) out.push({ do: d, target: t });
    if (!plan.keep) out.push({ do: 'end' });
    return out;
  }
  var queue = [];
  function ready(B) { return !B.req ? (B.co ? false : true) : true; }
  function drive(B, sync) {
    var guard = 0;
    while (queue.length && B.req && B.req.turn && guard++ < 50) { var c = queue.shift(); B.answer(c); if (sync) settle(B, 600); else return false; }
    return true;
  }
  function settle(B, frames) { var n = 0; while (!B.req && B.co && n++ < frames) { B.waitFx = false; B.wait = 0; B.step(); D.fx.update(); } } // (no frames to wait for: the coroutine is stepped on, the waits and effects let go)
  // one plan, the game stepped by hand
  KP.actSync = function (plan) {
    var B = D.battle; if (!B) return null;
    if (plan && plan.answer !== undefined) { B.answer(plan.answer); settle(B, 2000); return KP.state(); }
    if (!B.req || !B.req.turn) settle(B, 4000);
    if (!B.req || !B.req.turn) return KP.state();
    queue = commands(B, B.req.turn, plan || { do: 'none' });
    drive(B, true);
    settle(B, 4000);
    return KP.state();
  };
  // one plan, the page's frame loop running the rest: a Promise of the state at the next decision
  KP.act = function (plan) {
    var B = D.battle;
    return new Promise(function (resolve) {
      if (!B) return resolve(null);
      if (plan && plan.answer !== undefined && B.req && B.req.prompt) B.answer(plan.answer);
      else if (B.req && B.req.turn) queue = commands(B, B.req.turn, plan || { do: 'none' });
      var tries = 0, tick = function () {
        if (queue.length && B.req && B.req.turn) { var c = queue.shift(); B.answer(c); }
        var done = !queue.length && (!B.co || (B.req && (B.req.turn || B.req.prompt || B.req.entry)));
        if (done || tries++ > 1200) return resolve(KP.state());
        setTimeout(tick, 30);
      };
      tick();
    });
  };
})();
