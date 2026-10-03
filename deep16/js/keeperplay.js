/* DEEP16 — THE KEEPER, PLAYED (10-03, Griz asked for two play modes; js/keeper.js is the rules and the AI's turn, this is the hands).
   ?keeperfight&play=keeper&lvl=3  A HUMAN IS THE KEEPER, the class AI the party. Its turn is the game's own ring (Q, as the heroes' turns use): MOVE (click a square it can walk to in its
     water), SLAM (then a gold square), the WAVE (bonus), CAST WALL or READY WALL, SWIRL (a gold square: a hero on the deep), SUFFOCATE (bonus, only while a hero is held), LET GO
     (likewise), BREAK FREE (bonus, then action; only while frozen), END TURN. Its reaction (the opportunity attack) is automatic.
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

  // ================================================================== A: the Keeper's turn on the game's own RING (the Q wheel the heroes' turns use)
  // (Griz 10-03: "use the game's own ring menu, not the prompt window"): the turn is the ordinary one -- yield { turn: u }, the ring built from B.commands / UI.cmds, a click on a ring entry
  // answered as { do: <id> } -- with the Keeper's own entries in it. MOVE is the ring's own (click a square: the reach it can walk in its water); the picks of a target are the gold squares of
  // a prompt's `pick`, as the Channel Divinities' are.
  function human(B, u) { return !!(B && B.o && B.o.play === 'keeper' && u && u.kind === 'keeper' && u.side === 'foe'); }
  // what the Keeper may do now: only what applies (Griz 10-03: no Active Suffocation with no one held, no let-go or break-free but where they fit)
  KP.entries = function (B, u) {
    var T = u.turn, heroes = K.foesOf(B, u), reach = G.reachOf(u, u.reach), out = [], A = T.action > 0, Bo = T.bonus > 0;
    var vic = u.flooding ? B.units.filter(function (w) { return w.id === u.flooding.vic; })[0] : null;
    var held = !!(u.conds.restrained && u.conds.restrained.ice), holding = !!(vic && G.standing(vic) && vic.conds.restrained && vic.conds.restrained.by === u.id);
    var near = heroes.filter(function (w) { return (!w.conds.hidden || G.dist(u, w) <= (u.blindsight || 0)) && G.dist(u, w) <= reach; });
    var deepHeroes = heroes.filter(function (w) { return K.isDeep(w.x, w.y) && !w.conds.restrained; });
    var S = K.st(B);
    if (held) {
      out.push({ id: 'kicebonus', label: 'BREAK FREE (B)', cost: 'B', ok: Bo, why: 'the bonus action is spent', note: 'DC ' + K.CFG.iceDC + ' STR, a bonus action', icon: 'free' });
      out.push({ id: 'kiceaction', label: 'BREAK FREE (A)', cost: 'A', ok: A, why: 'the action is spent', note: 'a second try, as an action', icon: 'free' });
    } else if (holding) {
      out.push({ id: 'ksuffocate', label: 'SUFFOCATE', cost: 'B', ok: Bo, why: 'the bonus action is spent', note: 'Active Suffocation: the drowning twice at ' + vic.name + '\'s next turn', icon: 'spell' });
      out.push({ id: 'krise', label: 'LET GO', cost: 'F', ok: true, note: 'rise out of the swirl; ' + vic.name + ' is free of the hold', icon: 'free' });
    } else {
      out.push({ id: 'kslam', label: 'SLAM', cost: 'A', ok: (A || T.slamsLeft > 0) && near.length > 0, why: A ? 'no one in reach (10 ft)' : 'the action is spent', note: 'DC 15 STR or prone', icon: 'attack' });
      out.push({ id: 'kwave', label: 'WAVE', cost: 'B', ok: Bo && K.canWave(B, u), why: Bo ? 'no one for it to take' : 'the bonus action is spent', note: 'DC ' + K.CFG.waveDC + ' STR or prone; the backwash off the wall', icon: 'spell' });
      out.push({ id: 'kcast', label: 'CAST WALL', cost: 'A', ok: A && K.canCastWall(B, u), why: !A ? 'the action is spent' : S.wall ? 'the wall is up' : 'no use left', note: 'the Ice Wall rises at once (' + S.uses + ' left)', icon: 'spell' });
      out.push({ id: 'kready', label: 'READY WALL', cost: 'A', ok: A && K.canReadyWall(B, u), why: !A ? 'the action is spent' : S.ready ? 'readied already' : S.wall ? 'the wall is up' : 'nothing for it to seal in', note: 'sprung when one of you steps toward the exit', icon: 'spell' });
      out.push({ id: 'kswirl', label: 'SWIRL', cost: 'A', ok: A && deepHeroes.length > 0, why: A ? 'no one is on the deep (the last step, by the sealed door)' : 'the action is spent', note: 'a hero on the deep (the last step): the swirl about it', icon: 'spell' });
    }
    return out;
  }
  var cmds0 = D.Battle.prototype.commands;
  D.Battle.prototype.commands = function (u) { return human(this, u) ? KP.entries(this, u) : cmds0.apply(this, arguments); };
  // the ring's list for the Keeper (js/ui.js UI.cmds asks): MOVE, what applies, END TURN
  KP.human = human;
  KP.ring = function (B, u) {
    var c = KP.entries(B, u), out = [{ id: 'move', label: 'MOVE', cost: 'M', ok: u.turn.move > 0 && !u.conds.restrained, tool: 'move', icon: 'move' }].concat(c);
    return out.concat([{ id: 'end', label: 'END TURN', cost: 'F', ok: true, icon: 'end' }]);
  };
  KP.humanTurn = function* (B, u) {
    var S = K.st(B); K.pose(); K.face(B, u); B.focus(u);
    if (S.ready) { S.ready = null; B.card(['{g}Your readied wall: the moment passed.{/}'], 160); }
    K.checkSwirl(B);   // (a hold that ended since: the swirl is over before the turn begins)
    D.sfx('popup');
    B.tool = 'move'; B.cursor = { x: u.x, y: u.y };
    var guard = 0;
    while (guard++ < 60 && !u.dead && u.hp > 0 && !B.over()) {
      var cmd = yield { turn: u };
      if (!cmd || cmd.do === 'end') break;
      yield* B.exec(u, cmd);
      K.checkSwirl(B);
      if (B.over() || u.dead) break;
      B.keepInView(u);
    }
    K.finish(B, u);
    B.tool = 'move';
  };
  // the Keeper's commands, through the one exec the keys use
  var exec1 = D.Battle.prototype.exec;
  // a move of the Keeper to an anchor square: his body is the 2x2 from it (G.foot), and every one of the four has to be water he can be in. '' if it can, else why not (the card)
  KP.moveWhy = function (B, u, x, y) {
    var f = G.foot(u, x, y), S = B.kp, rm = G.reach(u, u.turn.move), bad = '';
    for (var i = 0; i < f.length && !bad; i++) {
      var q = f[i], s = G.map.at(q[0], q[1]), at = '(' + K.A({ x: q[0], y: q[1] }) + ',' + K.C({ x: q[0], y: q[1] }) + ')';
      if (!s || !s.open) bad = 'a square of his body would be off the map or in the rock ' + at;
      else if (G.wallAt && G.wallAt(q[0], q[1]) && G.wallAt(q[0], q[1]).solid) bad = 'the Ice Wall is in the way ' + at;
      else if (S && S.ice && S.ice[q[0] + ',' + q[1]]) bad = 'that water is frozen: he cannot stand in ice ' + at;
      else if (s.ch !== '~') bad = 'part of him would be on the dry landing, not in water ' + at;
      else { var w = G.occupant(q[0], q[1], u); if (w) bad = (w.name || 'something') + ' is in the way ' + at; }
    }
    if (bad) return 'he is 2x2 here: ' + bad;
    if (u.conds.restrained) return 'he is frozen in ice: BREAK FREE first';
    if (!rm[x + ',' + y] || !rm[x + ',' + y].stand) { var d = G.dist(u, { x: x, y: y, size: u.size }); return 'too far for the move he has left (' + (u.turn.move) + ' ft)'; }
    return '';
  };
  // what the Slam needs of a target that was clicked (the default attack): '' if it can, else why not -- spent nothing, said on a card
  KP.slamWhy = function (B, u, t) {
    if (!t || t.dead || t.hp <= 0 || t.isWall || t.side === u.side) return 'Not a foe there';
    if (u.turn.action <= 0 && !(u.turn.slamsLeft > 0)) return 'the action is spent';
    if (u.flooding) return 'it is in the swirl: LET GO first';
    if (t.conds && t.conds.hidden && G.dist(u, t) > (u.blindsight || 0)) return 'it cannot find ' + t.name;
    if (G.dist(u, t) > G.reachOf(u, u.reach)) return t.name + ' is out of reach (' + G.dist(u, t) + ' ft; the Slam is 10)';
    return '';
  };
  // what the swirl needs of its victim: standing, on the deep (the last step, by the sealed door: its squares are the map's `deeps`; a frozen one is a footing), not already held, not immune to being
  // held; and the Keeper itself: not already in a swirl, not frozen in ice, the action unspent. No reach and no prone: the water that pours in is any water square beside the victim (Griz 10-03)
  KP.swirlWhy = function (B, u, t) { return K.swirlWhy(B, u, t); };
  D.Battle.prototype.exec = function* (u, c) {
    if (c && c.do === 'attack' && u.kind === 'keeper' && human(this, u)) { // (a click on a hostile with no ring item: the default attack is the Slam on it)
      var why = KP.slamWhy(this, u, c.target);
      if (why) { this.card(['{o}' + why + '.{/}'], 140); return; }
      yield* KP.keeperDo(this, u, { do: 'kslam', target: c.target }); return;
    }
    if (c && c.do === 'move' && u.kind === 'keeper' && human(this, u)) { // (the move pick: the 2x2 at the anchor; refused with a card that says why, nothing spent)
      var mw = KP.moveWhy(this, u, c.x, c.y); if (mw) { this.card(['{o}MOVE: ' + mw + '.{/}'], 160); D.sfx('error'); return; }
    }
    if (c && c.do === 'attack' && !u.weapon) { this.card(['{o}' + u.name + ' has nothing to strike with.{/}'], 120); return; } // (never a throw: a unit with no weapon)
    if (!(c && /^k(slam|wave|cast|ready|swirl|suffocate|rise|icebonus|iceaction)$/.test(c.do)) || u.kind !== 'keeper') return yield* exec1.apply(this, arguments);
    if (c.do === 'kswirl' && (c.target || c.id)) { var tw = c.target || this.units.filter(function (w) { return w.id === c.id; })[0], why2 = KP.swirlWhy(this, u, tw); if (why2) { this.card(['{o}SWIRL: ' + why2 + '.{/}'], 160); return; } }
    var legalNow = KP.entries(this, u).filter(function (e) { return e.id === c.do; })[0];
    if (!legalNow || !legalNow.ok) { this.card(['{g}' + (legalNow ? legalNow.label + ': ' + (legalNow.why || 'not now') : 'Not now') + '.{/}'], 120); return; }
    yield* KP.keeperDo(this, u, c);
  };
  // one thing the Keeper does (the ring's, and the scripted Keeper's); a target not named is picked on the grid, in gold
  // pick a hero on the grid, in gold: every hero that is up is offered, and one the move cannot take says why on a card (the prompt stays; nothing is spent) -- never a silent refusal
  function* pickHero(B, u, title, list, whyFn) {
    var all = list && list.length ? list : [];
    for (var tries = 0; tries < 12; tries++) {
      if (!all.length) return null;
      var opts = all.map(function (w, i) { return { label: w.name.toUpperCase() + ' (' + G.dist(u, w) + ' FT)', value: i + 1 }; }); opts.push({ label: 'NOT NOW', value: 0 });
      var v = yield { prompt: { who: u, title: 'THE KEEPER: ' + title, lines: ['A gold square, E or a click; X is not now.'], opts: opts, pick: all } };
      if (!v) return null;
      var h = all[v - 1], why = whyFn ? whyFn(B, u, h) : '';
      if (!why) return h;
      B.card(['{o}' + title.replace(/ WHOM\?/, '') + ': ' + why + '.{/}'], 160); D.sfx('error');
    }
    return null;
  }
  KP.keeperDo = function* (B, u, c) {
    var T = u.turn, t = c.id ? B.units.filter(function (w) { return w.id === c.id; })[0] : (c.target && c.target.id ? c.target : null), reach = G.reachOf(u, u.reach);
    switch (c.do) {
      case 'kslam': case 'slam': {
        if (!t) t = yield* pickHero(B, u, 'SLAM WHOM?', K.foesOf(B, u).filter(function (w) { return G.standing(w) && !w.isWall; }), KP.slamWhy);
        if (!t || (T.action <= 0 && !(T.slamsLeft > 0))) return;
        if (T.action > 0) { T.action = 0; T.slamsLeft = K.CFG.slams - 1; } else T.slamsLeft--; // (K.CFG.slams: the multiattack, the second Slam out of the same action)
        K.face(B, u, t); D.fx.keeperSlam(u, t); yield* B.attack(u, t, u.attacks.slam); u.anim = 'idle'; u.animT = B.t; if (u.conds.hidden) delete u.conds.hidden; return;
      }
      case 'kwave': case 'wave': if (T.bonus > 0 && (yield* K.wave(B, u))) T.bonus = 0; return;
      case 'kcast': if (T.action > 0 && K.canCastWall(B, u)) yield* K.castWall(B, u); return;
      case 'kready': case 'ready': if (T.action > 0 && K.canReadyWall(B, u)) yield* K.readyWall(B, u); return;
      case 'kswirl': case 'swirl': {
        if (!t) t = yield* pickHero(B, u, 'SWIRL WHOM?', K.foesOf(B, u).filter(function (w) { return G.standing(w) && !w.isWall; }), KP.swirlWhy);
        if (!t || T.action <= 0) return;
        T.action = 0; yield* K.flood(B, u, t); return;
      }
      case 'ksuffocate': case 'suffocate': { if (!u.flooding || T.bonus <= 0) return; var v = B.units.filter(function (w) { return w.id === u.flooding.vic; })[0]; if (v) yield* K.suffocate(B, u, v); return; }
      case 'krise': case 'rise': { if (!u.flooding) return; var h = B.units.filter(function (w) { return w.id === u.flooding.vic; })[0]; K.surface(B, u, 'it lets go'); if (h) B.release(u, h); return; }
      case 'kicebonus': if (u.conds.restrained && u.conds.restrained.ice && T.bonus > 0) yield* K.iceTry(B, u, 'bonus'); return;
      case 'kiceaction': if (u.conds.restrained && u.conds.restrained.ice && T.action > 0) yield* K.iceTry(B, u, 'action'); return;
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
