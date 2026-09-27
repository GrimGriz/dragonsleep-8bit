/* DEEP16 — the fight (proof 2): four heroes (+ a guest if the save has one) against two drow and a phase spider, on
   the grid, with the fuller rules: movement you can split round your action, one action, one bonus action if a
   feature gives one, one reaction a round, opportunity attacks, cover, flanking, one area spell, and END TURN one press
   away with anything unspent -- no prompt, no nag (Griz: "people end up with bonus actions available they end their
   turn without using"). The fight runs as a generator: it yields a number to wait, {fx} to let effects land, or an
   input request (the hero's turn, a reaction prompt) that the player answers. */
'use strict';
(function () {
  var D = window.D16, I = D.input, G = D.grid, RU = D.rules, FX = D.fx;
  var STEP_FRAMES = 8;

  function Battle(o) { this.o = o || {}; }
  D.Battle = Battle;

  Battle.prototype.enter = function () {
    var m = this.map = D.iso.load(D.MAPS.cavern), self = this;
    // walk in from the save (the door's snapshot or the newest slot), or as the fixture: the entry card offers both
    this.from = this.o.fixture ? { from: 'the fixture', when: null, data: D.save.fixture() } : D.save.load();
    this.canSwap = this.o.fixture || this.from.from !== 'the fixture';
    var party = D.save.units(this.from.data);
    var entry = m.def.entry.slice();
    party.forEach(function (u, i) { var e = entry[i % entry.length]; u.x = e[0]; u.y = e[1]; u.facing = 5; });
    var foes = m.def.foes.map(function (f) { return self.makeFoe(f); });
    this.units = party.concat(foes);
    this.inv = JSON.parse(JSON.stringify(this.from.data.inv || [])).map(function (s) { return Array.isArray(s) ? { id: s[0], n: s[1] } : s; });
    this.units.forEach(function (u) { u.anim = 'idle'; u.animT = 0; u.flash = 0; u.reaction = 1; u.conds = u.conds || {}; if (u.hp <= 0 && u.side === 'party') u.ko = true; });
    G.setup(m, this.units);
    FX.clear();
    this.t = 0; this.cards = []; this.round = 0; this.order = []; this.active = null;
    this.tool = 'move'; this.cursor = { x: 5, y: 10 }; this.req = null; this.wait = 0; this.waitFx = false; this.result = null;
    D.iso.lookAt(5, 10);
    this.co = this.run();
    D.battle = this;
  };

  Battle.prototype.makeFoe = function (f) {
    var d = D.FOES[f.kind];
    return {
      id: f.id, kind: f.kind, name: d.name, side: 'foe', sheet: d.sheet, rider: d.rider || null, x: f.at ? f.at[0] : 0, y: f.at ? f.at[1] : 0, facing: 1,
      hp: d.hp, maxhp: d.hp, baseAC: d.ac, speed: d.speed, size: d.size, reach: d.reach, abil: d.abil, saves: d.saves,
      init: d.init, perception: d.perception, attacks: d.attacks, multi: d.multi, jaunt: d.jaunt, faerie: d.faerieFire ? JSON.parse(JSON.stringify(d.faerieFire)) : null,
      fey: !!d.fey, webWalker: !!d.webWalker, conds: {}, lvl: 5
    };
  };

  // ------------------------------------------------------------------ the coroutine
  Battle.prototype.step = function (v) {
    for (var guard = 0; guard < 200; guard++) {
      var r = this.co.next(v); v = undefined;
      if (r.done) { this.co = null; return; }
      var y = r.value;
      if (typeof y === 'number') { if (y > 0) { this.wait = y; return; } continue; }
      if (y && y.fx) { this.waitFx = true; return; }
      if (y) { this.req = y; this.onRequest(y); return; }
    }
  };
  Battle.prototype.answer = function (v) { this.req = null; this.step(v); };
  Battle.prototype.update = function () {
    this.t++;
    FX.update();
    this.units.forEach(function (u) { if (u.flash > 0) u.flash--; if (u.tween) { u.tween.t++; if (u.tween.t >= u.tween.dur) delete u.tween; } });
    this.cards = this.cards.filter(function (c) { return this.t - c.t0 < c.life; }, this);
    if (this.menu) { D.ui.menuInput(this); return; }
    if (I.pressed('menu')) { D.ui.openMenu(this); return; }
    if (this.req) { D.ui.input(this, this.req); return; }
    D.ui.camera(this);
    if (this.waitFx) { if (FX.busy()) return; this.waitFx = false; }
    if (this.wait > 0) { this.wait--; return; }
    if (this.co) this.step();
    else if (this.result) D.ui.resultInput(this);
  };

  // ------------------------------------------------------------------ cards: every roll on screen, the 8-bit game's CheckScene in small
  // a card with an id updates in place (an attack's card grows as the reactions and the damage come in), in the log too:
  // the log keeps { id, text } so an update replaces its own lines even after the screen's cards were cleared
  Battle.prototype.card = function (lines, life, id) {
    var round = this.round, ls = [].concat(lines), last = this.cards[this.cards.length - 1];
    this.logEntries = (this.logEntries || []).filter(function (e) { return !id || e.id !== id; });
    ls.forEach(function (l) { if (l) this.logEntries.push({ id: id, text: 'R' + round + ' ' + window.DS.stripCodes(l) }); }, this);
    this.log = this.logEntries.map(function (e) { return e.text; });
    if (id && last && last.id === id) { last.lines = ls; last.t0 = this.t; return; }
    this.cards.push({ lines: ls, t0: this.t, life: life || 300, id: id });
    if (this.cards.length > 3) this.cards.shift();
  };
  Battle.prototype.clearCards = function () { this.cards = []; };

  Battle.prototype.alive = function (side) { return this.units.filter(function (u) { return u.side === side && !u.dead && u.hp > 0; }); };
  Battle.prototype.over = function () {
    if (!this.alive('foe').length) return 'won';
    if (!this.alive('party').length) return 'lost';
    return null;
  };

  // ------------------------------------------------------------------ the run: entry card, initiative, rounds
  Battle.prototype.run = function* () {
    var self = this;
    D.music('battle'); // (it starts on the first key or click: browsers hold sound till then)
    yield { entry: true };
    // initiative: d20 + DEX (and the fighter's Remarkable Athlete), rolled once
    var rolls = this.units.map(function (u) { var d = D.d(20); u.initRoll = d + u.init; return { u: u, d: d }; });
    this.order = this.units.slice().sort(function (a, b) { return b.initRoll - a.initRoll || b.abil.dex - a.abil.dex; });
    this.card(['{y}INITIATIVE{/}  ' + this.order.map(function (u) { return shortName(u) + ' ' + u.initRoll; }).join(' · ')], 360);
    yield 50;
    while (true) {
      this.round++;
      for (var i = 0; i < this.order.length; i++) {
        var u = this.order[i];
        if (u.dead) continue;
        this.active = u;
        if (u.side === 'party' && !u.guest) yield* this.heroTurn(u);
        else yield* D.ai.turn(this, u);
        this.active = null;
        yield* this.wave();
        var o = this.over();
        if (o) { yield* this.finish(o); return; }
        i = this.order.indexOf(u); // (a new foe may have been dealt in ahead of it)
      }
    }
  };
  function shortName(u) { return u.side === 'foe' ? ({ drow: 'Captain', phasespider: 'Spider', drider: 'Drider' }[u.kind] || u.name) : u.name; }

  // the second wave: when the gallery goes still, the cocoon on the far wall splits and what was in it drops out,
  // dealt into the initiative on its own roll. The hero whose blow did it keeps the rest of the turn.
  Battle.prototype.wave = function* () {
    var w = this.map.def.wave;
    if (!w || this.waved || this.over() !== 'won') return;
    this.waved = true;
    var u = this.makeFoe(w), best = null, bd = Infinity;
    for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) {
      if (!G.canStand(u, x, y)) continue;
      var d = Math.hypot(x + (u.size - 1) / 2 - w.from[0], y + (u.size - 1) / 2 - w.from[1]);
      if (d < bd) { bd = d; best = [x, y]; }
    }
    if (!best) return;
    u.x = best[0]; u.y = best[1]; u.facing = 0;
    u.anim = 'idle'; u.animT = this.t; u.flash = 0; u.reaction = 1;
    u.tween = { fx: w.from[0] - (u.size - 1) / 2, fy: w.from[1] - (u.size - 1) / 2, fz: 46, t: 0, dur: 26 }; // the drop from the wall
    this.units.push(u);
    // the split cocoon stays on the wall as a husk
    this.map.props.forEach(function (p) { if (p.kind === 'cocoon' && p.sq.x === w.from[0] && p.sq.y === w.from[1]) p.alpha = 0.3; });
    u.initRoll = D.d(20) + u.init;
    var at = 0;
    while (at < this.order.length && (this.order[at].initRoll > u.initRoll || (this.order[at].initRoll === u.initRoll && this.order[at].abil.dex >= u.abil.dex))) at++;
    this.order.splice(at, 0, u);
    this.focus(u);
    FX.sparkle(u, 'bone', 24);
    D.sfx('encounter'); D.music('boss');
    this.card(['{r}A cocoon on the far wall splits.{/} Something drops out of it on eight legs.', '{r}A DRIDER{/}: a drow above, a spider below.  {g}initiative ' + u.initRoll + '{/}'], 420);
    yield 70;
  };
  Battle.prototype.shortName = shortName;

  Battle.prototype.finish = function* (o) {
    this.result = o;
    D.music(o === 'won' ? 'victory' : 'gameover');
    yield 30;
    this.card([o === 'won' ? '{y}THE GALLERY IS STILL.{/}' : '{r}THE DARK KEEPS THEM.{/}', '{g}E fight again · M the menu{/}'], 1e9);
  };

  // ------------------------------------------------------------------ a hero's turn: the player acts until END TURN
  Battle.prototype.heroTurn = function* (u) {
    RU.startTurn(u);
    this.focus(u);
    if (RU.canAct(u)) D.sfx('popup'); // your turn
    if (!RU.canAct(u)) {
      this.card(['{g}' + u.name + (u.hp <= 0 ? ' is down.' : ' cannot act.') + '{/}']);
      yield 40; return;
    }
    this.tool = 'move'; this.cursor = { x: u.x, y: u.y };
    while (true) {
      var cmd = yield { turn: u };
      if (!cmd || cmd.do === 'end') break;
      yield* this.exec(u, cmd);
      yield* this.wave();
      if (this.over() || !RU.canAct(u)) break;
      this.keepInView(u);
    }
    D.magic.endTurn(this, u);
    this.tool = 'move';
  };

  // what a hero can do right now (the bar's buttons, and the harness's)
  Battle.prototype.commands = function (u) {
    var T = u.turn, out = [], has = function (id) { return u.known && u.known.indexOf(id) >= 0; };
    var slot = function (min) { for (var i = min - 1; i < (u.slots || []).length; i++) if (u.slots[i] > 0) return i + 1; return 0; };
    // a swing is only there to take with a foe in reach, or the feet left to walk to one (Lymen's second attack, 09-27)
    var foeNear = this.foeInReach(u), canWalk = T.move > 0 && !u.conds.restrained;
    out.push({ id: 'attack', label: T.attacksLeft ? 'ATTACK (' + T.attacksLeft + ')' : 'ATTACK' + (u.attacks > 1 ? ' x' + u.attacks : ''), cost: 'A', ok: (T.attacksLeft > 0 || T.action > 0) && (foeNear || canWalk), why: foeNear || canWalk ? '' : 'no foe in reach, and no feet left', tool: 'attack' });
    if (u.conds.restrained) out.push({ id: 'breakfree', label: 'BREAK FREE', cost: 'A', ok: T.action > 0 && !T.attacksLeft, icon: 'free' });
    var spells = D.magic.list(this, u);
    if (spells.length) out.push({ id: 'spells', label: 'SPELLS', cost: 'A', ok: spells.some(function (e) { return e.ok; }), sub: 'spells', icon: 'spell' });
    var items = this.itemList(u);
    if (items.length) out.push({ id: 'items', label: 'ITEM', cost: 'A', ok: T.action > 0 && !T.attacksLeft, sub: 'items', icon: 'item' });
    if (u.cls === 'fighter') {
      out.push({ id: 'secondwind', label: '2ND WIND', cost: 'B', ok: T.bonus > 0 && u.feats.secondWind > 0 });
      out.push({ id: 'surge', label: 'SURGE', cost: 'F', ok: u.feats.actionSurge > 0 && !T.action && !T.attacksLeft });
    }
    if (u.cls === 'rogue' && u.lvl >= 2) {
      out.push({ id: 'hide', label: 'HIDE', cost: 'B', ok: T.bonus > 0 || T.action > 0 });
      out.push({ id: 'cdash', label: 'DASH', cost: 'B', ok: T.bonus > 0 });
      out.push({ id: 'cdisengage', label: 'DISENGAGE', cost: 'B', ok: T.bonus > 0 && !T.disengaged });
    }
    if (u.cls === 'paladin') out.push({ id: 'lay', label: 'LAY HANDS', cost: 'A', ok: T.action > 0 && !T.attacksLeft && u.feats.lay > 0, tool: 'lay' });
    // Sacred Weapon (Channel Divinity, Oath of Devotion): the 8-bit game's SKILL beside Lay on Hands, an action there as here
    if (u.cls === 'paladin' && u.lvl >= 3) out.push({ id: 'sacred', label: 'SACRED WEAPON', cost: 'A', ok: T.action > 0 && !T.attacksLeft && u.feats.channel > 0 && !u.conds.sacred, why: u.conds.sacred ? 'it is shining already' : u.feats.channel > 0 ? '' : 'Channel Divinity is spent (a rest brings it back)' });
    if (u.cls !== 'rogue') out.push({ id: 'dash', label: 'DASH', cost: 'A', ok: T.action > 0 && !T.attacksLeft });
    if (u.cls !== 'rogue') out.push({ id: 'disengage', label: 'DISENGAGE', cost: 'A', ok: T.action > 0 && !T.attacksLeft && !T.disengaged });
    out.push({ id: 'dodge', label: 'DODGE', cost: 'A', ok: T.action > 0 && !T.attacksLeft });
    out.push({ id: 'help', label: 'HELP', cost: 'A', ok: T.action > 0 && !T.attacksLeft, tool: 'help' });
    return out.slice(0, 9);
  };

  // ------------------------------------------------------------------ commands
  Battle.prototype.exec = function* (u, c) {
    var T = u.turn, self = this;
    switch (c.do) {
      case 'move': {
        var rm = G.reach(u, T.move), path = G.path(rm, c.x, c.y);
        if (!path || !path.length || !rm[c.x + ',' + c.y].stand) return;
        yield* this.moveAlong(u, path, { spend: true });
        return;
      }
      case 'attack': {
        if (!T.attacksLeft) { if (!T.action) return; T.action = 0; T.attackAction = true; T.attacksLeft = u.attacks; }
        T.attacksLeft--;
        yield* this.attack(u, c.target, u.weapon);
        if (u.conds.hidden) delete u.conds.hidden;
        return;
      }
      case 'cast': {
        yield* D.magic.cast(this, u, c.id, c.slot, c.target);
        if (u.conds.hidden && D.magic.data(c.id).kind !== 'buff') delete u.conds.hidden;
        return;
      }
      case 'item': { yield* this.useItem(u, c.id, c.target); return; }
      case 'breakfree': { yield* D.magic.breakFree(this, u); return; }
      case 'dashmove': {
        var far = G.reach(u, T.move + u.speed)[c.x + ',' + c.y], opts = [];
        if (!far) return;
        if (u.cls === 'rogue' && u.lvl >= 2 && T.bonus) opts.push({ label: 'CUNNING DASH (bonus)', value: 'b' });
        if (T.action && !T.attacksLeft) opts.push({ label: 'DASH (your action)', value: 'a' });
        if (!opts.length) { this.card(['{g}No dash left this turn.{/}']); return; }
        opts.push({ label: 'NOT THAT FAR', value: 0 });
        var how = yield { prompt: { who: u, title: u.name + ': DASH THERE?', lines: ['That square is ' + far.cost + ' ft away; ' + T.move + ' ft of move is left.'], opts: opts } };
        if (!how) return;
        if (how === 'b') T.bonus = 0; else T.action = 0;
        T.move += u.speed;
        this.card(['{y}' + u.name + '{/}' + (how === 'b' ? ' (Cunning Action)' : '') + ' dashes: {c}+' + u.speed + ' ft{/}.']);
        var rm2 = G.reach(u, T.move), path2 = G.path(rm2, c.x, c.y);
        if (path2 && path2.length) yield* this.moveAlong(u, path2, { spend: true });
        return;
      }
      case 'dash': D.sfx('run'); T.action = 0; T.move += u.speed; this.card(['{y}' + u.name + '{/} dashes: {c}+' + u.speed + ' ft{/}.']); return;
      case 'cdash': D.sfx('run'); T.bonus = 0; T.move += u.speed; this.card(['{y}' + u.name + '{/} (Cunning Action) dashes: {c}+' + u.speed + ' ft{/}.']); return;
      case 'disengage': D.sfx('run'); T.action = 0; T.disengaged = true; this.card(['{y}' + u.name + '{/} disengages: leaving reach provokes nothing this turn.']); return;
      case 'cdisengage': D.sfx('run'); T.bonus = 0; T.disengaged = true; this.card(['{y}' + u.name + '{/} (Cunning Action) disengages.']); return;
      case 'sacred': {
        D.sfx('buff');
        T.action = 0; u.feats.channel = 0;
        var sb = Math.max(1, D.mod(u.abil.cha));
        u.conds.sacred = { atk: sb, rounds: 10 };
        FX.ring(u, 'gold', 40); FX.sparkle(u, 'gold', 16);
        this.card(['{y}' + u.name + '{/}: SACRED WEAPON. The blade takes Kalindel\'s light: +' + sb + ' to hit with it for a minute (Channel Divinity).']);
        return;
      }
      case 'dodge': D.sfx('bump'); T.action = 0; u.conds.dodge = true; this.card(['{y}' + u.name + '{/} dodges: attacks against at disadvantage till the next turn.']); return;
      case 'help': {
        D.sfx('buff');
        T.action = 0;
        c.target.conds.helped = { by: u.id, side: u.side };
        this.card(['{y}' + u.name + '{/} helps: the next ally to swing at the ' + shortName(c.target) + ' does it with advantage.']);
        FX.sparkle(c.target, 'bone', 8);
        return;
      }
      case 'secondwind': {
        T.bonus = 0; u.feats.secondWind = 0;
        var r = D.roll('1d10+' + u.lvl), n = Math.min(u.maxhp - u.hp, r.total);
        u.hp += n; FX.float('+' + n, u, D.PAL.ramps.moss[2]); FX.sparkle(u, 'moss', 10);
        this.card(['{y}' + u.name + '{/}: SECOND WIND  1d10+' + u.lvl + ' ' + RU.fmtRolls(r.rolls) + ' = {n}' + r.total + '{/}' + (n < r.total ? ' (' + n + ' to full)' : '')]);
        yield 20; return;
      }
      case 'surge': {
        D.sfx('buff');
        u.feats.actionSurge = 0; T.action = 1;
        this.card(['{y}' + u.name + '{/}: ACTION SURGE -- a second action.']); FX.ring(u, 'gold', 30);
        yield 20; return;
      }
      case 'hide': { yield* this.hide(u); return; }
      case 'lay': { yield* this.layOnHands(u, c.target, c.cure); return; }
    }
  };

  // ------------------------------------------------------------------ movement, square by square, provoking as it goes
  Battle.prototype.moveAlong = function* (u, path, o) {
    var T = u.turn;
    u.anim = 'walk';
    for (var i = 0; i < path.length; i++) {
      var nx = path[i][0], ny = path[i][1], cost = G.stepCost(u, u.x, u.y, nx, ny, { ghost: u.ethereal });
      // leaving a hostile's reach without Disengage provokes, right before the step
      if (!T.disengaged && !u.ethereal && !(o && o.noOA)) {
        var prov = this.units.filter(function (w) {
          return G.hostile(u, w) && G.standing(w) && RU.canAct(w) && w.reaction > 0 && !w.ethereal
            && G.dist(w, u) <= w.reach && G.dist(w, u, null, null, nx, ny) > w.reach && !(w.conds.hidden && false);
        });
        for (var k = 0; k < prov.length; k++) {
          var w = prov[k], take = true;
          if (w.side === 'party' && !w.guest) {
            u.anim = 'idle';
            take = yield { prompt: { who: w, title: w.name + ': OPPORTUNITY ATTACK?', lines: [(u.side === 'foe' ? 'The ' + shortName(u) : u.name) + ' is leaving ' + w.name + "'s reach."], opts: [{ label: 'STRIKE', value: true }, { label: 'LET IT GO', value: false }] } };
            u.anim = 'walk';
          }
          if (take) {
            w.reaction = 0;
            this.card(['{o}' + w.name + '{/}: an opportunity attack on ' + (u.side === 'foe' ? 'the ' + shortName(u) : u.name) + '.']);
            var atk = w.weapon || w.attacks.shortsword || w.attacks.longsword || w.attacks.bite;
            yield* this.attack(w, u, atk, { oa: true });
            if (u.hp <= 0 || u.dead) { u.anim = 'idle'; return; }
          }
        }
      }
      u.facing = D.spr.facingFor(nx - u.x, ny - u.y);
      u.tween = { fx: u.x, fy: u.y, fz: G.gzAt(u, u.x, u.y), t: 0, dur: STEP_FRAMES };
      u.x = nx; u.y = ny;
      if (o && o.spend) T.move -= cost;
      this.keepInView(u);
      yield STEP_FRAMES;
    }
    u.anim = 'idle';
  };

  // ------------------------------------------------------------------ an attack: the roll, the reactions, the damage
  Battle.prototype.attack = function* (att, tgt, atk, o) {
    o = o || {};
    if (!tgt || tgt.dead || tgt.ethereal) return;
    var self = this, melee = !atk.ranged && !atk.spell, cid = 'atk' + (++this.cardSeq || (this.cardSeq = 1));
    att.facing = faceTo(att, tgt);
    att.anim = 'attack'; att.animT = this.t;
    if (!o.oa) yield 10;
    if (!melee) { FX.projectile(att, tgt, atk.fx || 'bolt'); yield { fx: 1 }; }
    var los = G.los(att, tgt), cover = melee && G.dist(att, tgt) <= 5 ? 0 : los.cover;
    var ac = RU.ac(tgt) + cover, e = RU.edges(att, tgt, atk);
    if (tgt.conds.helped && tgt.conds.helped.side === att.side) delete tgt.conds.helped; // help is spent on the first swing
    var sacred = att.conds.sacred && !atk.spell && !atk.ranged ? att.conds.sacred.atk : 0;
    var r = RU.d20(e.net), nat = r.pick, bless = att.conds.blessed ? D.d(4) : 0, total = nat + atk.atk + bless + sacred;
    var critAt = att.crit || 20;
    var hit = nat === 20 || (nat !== 1 && total >= ac);
    var crit = hit && (nat >= critAt || (melee && ((tgt.hp <= 0 && !tgt.dead) || tgt.conds.paralyzed || tgt.conds.asleep) && G.dist(att, tgt) <= 5));
    var head = '{y}' + nameOf(att) + '{/} > {r}' + nameOf(tgt) + '{/}  ' + atk.name;
    var line = 'd20 ' + (r.rolls.length > 1 ? RU.fmtRolls(r.rolls) + '>' : '') + nat + ' ' + RU.sign(atk.atk) + (bless ? ' {y}+' + bless + ' bless{/}' : '') + (sacred ? ' {y}+' + sacred + ' sacred{/}' : '') + ' = ' + total + '  vs AC ' + RU.ac(tgt) + (cover ? ' {c}+' + cover + ' cover{/}' : '');
    var why = (e.adv.length ? '  {n}adv: ' + e.adv.join(', ') + '{/}' : '') + (e.dis.length ? '  {o}dis: ' + e.dis.join(', ') + '{/}' : '');
    // Shield: Aurdin's reaction, +5 AC against this and every attack till his turn
    if (hit && nat !== 20 && tgt.cls === 'wizard' && tgt.reaction > 0 && !tgt.conds.shield && RU.canAct(tgt) && tgt.known.indexOf('shield') >= 0 && slotFor(tgt, 1) && total < ac + 5 && !tgt.guest) {
      this.card([head, line + why], 300, cid);
      var yes = yield { prompt: { who: tgt, title: tgt.name + ': SHIELD?', lines: ['The ' + total + ' would hit AC ' + ac + '.', '+5 AC makes it ' + (ac + 5) + ': a miss. (a level-' + slotFor(tgt, 1) + ' slot, the reaction)'], opts: [{ label: 'CAST SHIELD', value: true }, { label: 'TAKE IT', value: false }] } };
      if (yes) {
        var sl = slotFor(tgt, 1); tgt.slots[sl - 1]--; tgt.reaction = 0; tgt.conds.shield = true;
        FX.ring(tgt, 'glow', 50); D.sfx('buff');
        ac += 5; hit = false; crit = false;
        line += '  {c}SHIELD +5{/}';
      }
    }
    D.sfx(crit ? 'crit' : hit ? 'hit' : 'miss');
    this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : hit ? '{n}HIT{/}' : '{g}MISS{/}') + why], 300, cid);
    if (!hit) { FX.float('MISS', tgt, D.PAL.ramps.silver[5]); yield o.oa ? 16 : 24; att.anim = 'idle'; return; }
    // damage
    var dr = RU.damage(atk.dice, atk.mod, { crit: crit, gwf: atk.gwf }), dmg = dr.total, parts = [atk.dice + RU.sign(atk.mod) + ' ' + RU.fmtRolls(dr.rolls) + RU.sign(atk.mod) + ' = ' + dr.total + ' ' + atk.type];
    // Sneak Attack: once a turn, a finesse or ranged weapon, with advantage or an ally at the target's side
    if (att.cls === 'rogue' && att.turn && !att.turn.sneakUsed && (atk.finesse || atk.ranged) && e.net >= 0) {
      var ally = this.units.some(function (w) { return w !== att && w.side === att.side && G.standing(w) && RU.canAct(w) && G.dist(w, tgt) <= 5; });
      if (e.net > 0 || ally) {
        att.turn.sneakUsed = true;
        var sn = D.roll(RU.sneakDice(att), { crit: crit }); dmg += sn.total;
        parts.push('{p}sneak ' + RU.sneakDice(att) + ' ' + RU.fmtRolls(sn.rolls) + ' = ' + sn.total + '{/}');
      }
    }
    if (att.conds.divineFavor && !atk.spell) { var df = D.roll('1d4', { crit: crit }); dmg += df.total; parts.push('{y}favor 1d4 [' + df.rolls.join(',') + '] radiant{/}'); }
    // a foe's poisoned blade
    if (atk.extra) { var ex = D.roll(atk.extra, { crit: crit }); dmg += ex.total; parts.push(atk.extra + ' ' + RU.fmtRolls(ex.rolls) + ' ' + atk.extraType); }
    // Divine Smite: after the hit, spend a slot
    if (att.cls === 'paladin' && melee && !att.guest && (att.slots || []).some(function (n) { return n > 0; })) {
      var opts = [];
      [1, 2, 3].forEach(function (lv) { if (att.slots[lv - 1] > 0) opts.push({ label: 'L' + lv + ' ' + Math.min(5, 1 + lv) + 'd8', value: lv }); });
      opts.push({ label: 'NO SMITE', value: 0 });
      this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : '{n}HIT{/}') + why], 300, cid);
      var lv = yield { prompt: { who: att, title: att.name + ': DIVINE SMITE?', lines: ['The blow lands' + (crit ? ' -- a critical: the smite dice double.' : '.')], opts: opts } };
      if (lv) {
        att.slots[lv - 1]--; D.sfx('magic');
        var sm = D.roll(Math.min(5, 1 + lv) + 'd8', { crit: crit }); dmg += sm.total;
        parts.push('{y}smite ' + Math.min(5, 1 + lv) + 'd8 ' + RU.fmtRolls(sm.rolls) + ' = ' + sm.total + ' radiant{/}');
        FX.ring(tgt, 'gold', 30); FX.sparkle(tgt, 'gold', 16);
      }
    }
    // Uncanny Dodge: Vivian's reaction halves a hit from an attacker she can see
    if (tgt.cls === 'rogue' && tgt.lvl >= 5 && tgt.reaction > 0 && RU.canAct(tgt) && !tgt.guest) {
      this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : '{n}HIT{/}') + why, parts.join('  ')], 300, cid);
      var ud = yield { prompt: { who: tgt, title: tgt.name + ': UNCANNY DODGE?', lines: ['The blow would deal ' + dmg + '. Halve it to ' + Math.floor(dmg / 2) + '? (the reaction)'], opts: [{ label: 'DODGE IT', value: true }, { label: 'TAKE IT', value: false }] } };
      if (ud) { D.sfx('run'); tgt.reaction = 0; dmg = Math.floor(dmg / 2); parts.push('{c}uncanny dodge: halved to ' + dmg + '{/}'); }
    }
    this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : '{n}HIT{/}') + why, parts.join('  ') + '  = {r}' + dmg + '{/}'], 300, cid);
    if (melee) FX.slash(tgt, crit ? D.PAL.ramps.gold[4] : null);
    this.hurt(tgt, dmg, atk.type);
    yield o.oa ? 18 : 26;
    // riders: the drow's poisoned bolt, the spider's venom
    if (!tgt.dead && tgt.hp > 0 && atk.poison && !tgt.conds.poisoned) {
      var sv = RU.save(tgt, 'con', atk.poison.dc);
      this.card(['{r}' + nameOf(tgt) + '{/}: CON save vs poison  ' + RU.saveText(sv) + ' vs DC ' + sv.dc + '  ' + (sv.ok ? '{n}SAVED{/}' : '{o}POISONED{/}')]);
      if (!sv.ok) { D.sfx('poison'); tgt.conds.poisoned = true; FX.sparkle(tgt, 'moss', 10); }
      yield 30;
    }
    if (!tgt.dead && atk.save && tgt.hp > 0) {
      var s2 = RU.save(tgt, atk.save.ab, atk.save.dc), pr = D.roll(atk.save.dice), pd = s2.ok && atk.save.half ? Math.floor(pr.total / 2) : s2.ok ? 0 : pr.total;
      this.card(['{r}' + nameOf(tgt) + '{/}: ' + atk.save.ab.toUpperCase() + ' save  ' + RU.saveText(s2) + ' vs DC ' + s2.dc + '  ' + (s2.ok ? '{n}SAVED{/} (half)' : '{o}FAILED{/}'), atk.save.dice + ' ' + RU.fmtRolls(pr.rolls) + ' = ' + pr.total + ' ' + atk.save.type + '  = {r}' + pd + '{/}']);
      if (pd) this.hurt(tgt, pd, atk.save.type);
      yield 30;
    }
    att.anim = 'idle';
  };
  function nameOf(u) { return u.side === 'foe' ? u.name : u.name; }
  function slotFor(u, min) { for (var i = min - 1; i < (u.slots || []).length; i++) if (u.slots[i] > 0) return i + 1; return 0; }
  function faceTo(a, b) {
    var ax = a.x + ((a.size || 1) - 1) / 2, ay = a.y + ((a.size || 1) - 1) / 2, bx = b.x + ((b.size || 1) - 1) / 2, by = b.y + ((b.size || 1) - 1) / 2;
    var dx = bx - ax, dy = by - ay, m = Math.max(Math.abs(dx), Math.abs(dy)) || 1;
    return D.spr.facingFor(Math.round(dx / m), Math.round(dy / m));
  }
  Battle.prototype.faceTo = faceTo;

  // damage lands: a flash, a number, and at 0 a hero goes down (and can be brought back), a foe dies
  Battle.prototype.hurt = function (u, n, type) {
    if (n <= 0) return;
    if (u.conds.stoneskin && /bludgeoning|piercing|slashing/.test(type || '')) { n = Math.floor(n / 2); FX.float('stoneskin', u, D.PAL.ramps.silver[5]); }
    if (u.temp > 0) { var soak = Math.min(u.temp, n); u.temp -= soak; n -= soak; }
    if (u.conds.asleep) { delete u.conds.asleep; FX.float('awake!', u, D.PAL.ramps.bone[2]); }
    if (n <= 0) return;
    u.hp = Math.max(0, u.hp - n);
    u.flash = 10;
    FX.float('-' + n, u, D.PAL.ramps.red[4]);
    if (u.conds.hidden) delete u.conds.hidden;
    if (u.hp <= 0) {
      u.anim = 'hurt'; u.animT = this.t;
      D.sfx(u.side === 'party' ? 'ko' : 'die');
      if (u.side === 'party') { u.ko = true; this.card(['{r}' + u.name + ' goes down.{/}']); }
      else { u.dead = true; u.deadT = this.t; this.card(['{y}The ' + shortName(u) + ' falls.{/}']); }
      if (u.conc) D.magic.endConc(this, u, 'down');
    } else D.magic.concCheck(this, u, n);
  };
  Battle.prototype.heal = function (u, n) {
    var was = u.hp;
    u.hp = Math.min(u.maxhp, u.hp + n);
    if (was <= 0 && u.hp > 0) { u.ko = false; u.anim = 'idle'; }
    FX.float('+' + (u.hp - was), u, D.PAL.ramps.moss[2]);
    if (u.hp > was) D.sfx('heal');
    return u.hp - was;
  };

  // ------------------------------------------------------------------ items: the save's own (a potion, a kit, an antitoxin, an oil flask)
  var ITEM_OK = { heal: 1, revive: 1, antitoxin: 1, cure: 1, damage: 1 };
  Battle.prototype.itemList = function (u) {
    var T = u.turn;
    return (this.inv || []).map(function (s) {
      var it = window.DS.DATA.items[s.id];
      if (!it || !it.use || !it.use.battle || !ITEM_OK[it.use.effect] || s.n <= 0) return null;
      return { id: s.id, name: it.name, n: s.n, use: it.use, ok: T.action > 0 && !T.attacksLeft, why: T.action > 0 ? '' : 'the action is spent' };
    }).filter(Boolean);
  };
  Battle.prototype.itemTargetOK = function (u, id, w) {
    var use = window.DS.DATA.items[id].use;
    if (!w || w.dead) return false;
    if (use.effect === 'damage') return G.hostile(u, w) && w.hp > 0 && G.dist(u, w) <= 20 && G.los(u, w).clear;
    if (w.side !== u.side || (w !== u && G.dist(u, w) > 5)) return false;
    if (use.effect === 'revive') return w.hp <= 0;
    if (use.effect === 'heal') return w.hp < w.maxhp;
    return true;
  };
  Battle.prototype.useItem = function* (u, id, w) {
    var it = window.DS.DATA.items[id], use = it.use, s = this.inv.filter(function (x) { return x.id === id; })[0];
    u.turn.action = 0; s.n--;
    var who = w === u ? 'drinks' : 'gives ' + w.name;
    if (use.effect === 'heal') { var r = D.roll(use.dice), got = this.heal(w, r.total); this.card(['{y}' + u.name + '{/} ' + who + ' a ' + it.name + ': ' + use.dice + ' ' + RU.fmtRolls(r.rolls) + ' = {n}' + r.total + '{/}' + (got < r.total ? ' (' + got + ' to full)' : '')]); FX.sparkle(w, 'moss', 12); }
    if (use.effect === 'revive') { this.heal(w, use.hp || 1); this.card(['{y}' + u.name + '{/} works the ' + it.name + ' on ' + w.name + ': up, on ' + w.hp + ' HP.']); }
    if (use.effect === 'antitoxin' || use.effect === 'cure') { var had = !!w.conds.poisoned; delete w.conds.poisoned; this.card(['{y}' + u.name + '{/} ' + who + ' the ' + it.name + (had ? ': the poison goes out.' : ': nothing to cure.')]); FX.sparkle(w, 'moss', 10); }
    if (use.effect === 'damage') {
      D.sfx('fire');
      FX.projectile(u, w, 'fire'); yield { fx: 1 };
      var sv = RU.save(w, use.save || 'dex', use.dc || 10), dmg = sv.ok ? 0 : D.roll(String(use.dice)).total;
      this.card(['{y}' + u.name + '{/} throws the ' + it.name + ' at the ' + shortName(w) + ': DEX ' + RU.saveText(sv) + ' vs DC ' + (use.dc || 10) + '  ' + (sv.ok ? '{n}dodged{/}' : '{o}burning: ' + dmg + ' fire{/}')]);
      if (dmg) this.hurt(w, dmg, 'fire');
    }
    yield 30;
  };

  // ------------------------------------------------------------------ Fireball: the area proof (DEX save for half; Evasion; the aura)
  Battle.prototype.fireball = function* (u, cx, cy) {
    var T = u.turn, sl = slotFor(u, 3), self = this;
    T.action = 0; T.spell = 'leveled'; u.slots[sl - 1]--;
    var sq = G.sphere(cx, cy, 20), dice = (8 + sl - 3) + 'd6';
    u.facing = faceTo(u, { x: cx, y: cy, size: 1 });
    u.anim = 'attack'; u.animT = this.t;
    yield 12;
    FX.projectile(u, { x: cx, y: cy, size: 1 }, 'fire'); yield { fx: 1 };
    FX.bloom(cx, cy, sq);
    var r = D.roll(dice), caught = this.units.filter(function (w) { return G.present(w) && G.inArea(w, sq); });
    var lines = ['{y}' + u.name + '{/}: FIREBALL (L' + sl + ')  ' + dice + ' ' + RU.fmtRolls(r.rolls) + ' = {o}' + r.total + '{/} fire  DEX DC ' + u.spellDC];
    var hits = [];
    caught.forEach(function (w) {
      var sv = RU.save(w, 'dex', u.spellDC), evade = w.cls === 'rogue' && w.lvl >= 7;
      var d = sv.ok ? (evade ? 0 : Math.floor(r.total / 2)) : (evade ? Math.floor(r.total / 2) : r.total);
      lines.push('  ' + nameOf(w) + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{o}failed{/}') + (evade ? ' {c}evasion{/}' : '') + ' -> {r}' + d + '{/}');
      hits.push([w, d]);
    });
    if (!caught.length) lines.push('  {g}no one in it.{/}');
    this.card(lines.slice(0, 6), 420);
    yield { fx: 1 };
    hits.forEach(function (h) { self.hurt(h[0], h[1], 'fire'); });
    u.anim = 'idle';
    yield 30;
  };

  // ------------------------------------------------------------------ Misty Step: a bonus action, 30 ft to a square you can see
  Battle.prototype.mistyTargets = function (u) {
    var out = [];
    for (var y = u.y - 6; y <= u.y + 6; y++) for (var x = u.x - 6; x <= u.x + 6; x++) {
      if (x === u.x && y === u.y) continue;
      if (!G.canStand(u, x, y) || !G.losPoint(u.x, u.y, x, y)) continue;
      out.push([x, y]);
    }
    return out;
  };
  Battle.prototype.misty = function* (u, x, y) {
    var T = u.turn, sl = slotFor(u, 2);
    T.bonus = 0; T.bonusSpell = true; u.slots[sl - 1]--;
    D.sfx('magic');
    if (u.conds.hidden) delete u.conds.hidden;
    FX.sparkle(u, 'silver', 16);
    this.card(['{y}' + u.name + '{/}: MISTY STEP (L' + sl + ') -- silver mist, and he is ' + (Math.max(Math.abs(x - u.x), Math.abs(y - u.y)) * 5) + ' ft away.']);
    yield 16;
    u.x = x; u.y = y; delete u.tween;
    FX.sparkle(u, 'silver', 16);
    this.keepInView(u);
    yield 16;
  };

  // ------------------------------------------------------------------ Hide (Cunning Action): Stealth against each foe's passive Perception;
  // a foe with a clear, coverless look at her sees her anyway
  Battle.prototype.hide = function* (u) {
    var T = u.turn;
    if (T.bonus > 0) T.bonus = 0; else T.action = 0;
    D.sfx('run');
    var foes = this.units.filter(function (w) { return w.side === 'foe' && G.standing(w) && RU.canAct(w); });
    var plain = foes.filter(function (w) { var l = G.los(w, u); return l.clear && !l.cover; });
    var r = D.d(20), total = r + u.stealth, top = Math.max.apply(null, foes.map(function (w) { return w.perception; }).concat([0]));
    if (plain.length) {
      this.card(['{y}' + u.name + '{/} tries to hide, but the ' + plain.map(shortName).join(' and the ') + ' can see her plainly (no cover).', '{g}Put a stalagmite or a body between you first.{/}']);
    } else {
      var ok = total >= top;
      this.card(['{y}' + u.name + '{/} hides: Stealth d20 ' + r + ' ' + RU.sign(u.stealth) + ' = ' + total + ' vs passive Perception ' + top + '  ' + (ok ? '{n}HIDDEN{/}' : '{o}SEEN{/}'), ok ? '{g}Her next attack has advantage (and Sneak Attack).{/}' : '']);
      if (ok) u.conds.hidden = true;
    }
    yield 30;
  };

  // ------------------------------------------------------------------ Lay on Hands: an action, touch -- the target must be adjacent (or himself)
  Battle.prototype.layOnHands = function* (u, tgt, cure) {
    var T = u.turn;
    if (tgt !== u && G.dist(u, tgt) > 5) { this.card(['{o}Lay on Hands is touch: ' + tgt.name + ' is ' + G.dist(u, tgt) + ' ft away.{/}']); return; }
    var pool = u.feats.lay;
    if (cure === undefined && tgt.conds.poisoned && pool >= 5) {
      cure = yield { prompt: { who: u, title: u.name + ': LAY ON HANDS', lines: [tgt.name + ' is poisoned. Pool: ' + pool + '.'], opts: [{ label: 'HEAL', value: false }, { label: 'CURE POISON (5)', value: true }] } };
    }
    T.action = 0;
    if (cure) {
      u.feats.lay -= 5; delete tgt.conds.poisoned;
      this.card(['{y}' + u.name + '{/} lays on hands: the poison goes out of ' + tgt.name + '. {g}(pool ' + u.feats.lay + '){/}']);
    } else {
      var want = Math.min(tgt.maxhp - tgt.hp, pool);
      u.feats.lay -= want;
      var got = this.heal(tgt, want);
      this.card(['{y}' + u.name + '{/} lays on hands: {n}+' + got + '{/} to ' + tgt.name + '. {g}(pool ' + u.feats.lay + '){/}']);
    }
    FX.sparkle(tgt, 'gold', 18);
    yield 30;
  };

  // ------------------------------------------------------------------ the camera: snap to a unit; recentre only when it nears the edge
  Battle.prototype.foeInReach = function (u) {
    return this.units.some(function (w) { return G.hostile(u, w) && G.standing(w) && !w.dead && w.hp > 0 && G.dist(u, w) <= u.reach; });
  };
  Battle.prototype.focus = function (u) { var c = FX.at(u); D.iso.lookAt(c.gx, c.gy, c.gz); };
  Battle.prototype.keepInView = function (u) {
    var c = FX.at(u), w = D.iso.center(c.gx, c.gy, c.gz), s = D.iso.toScreen(w.x, w.y);
    if (s.x < 110 || s.x > D.W - 110 || s.y < 70 || s.y > D.H - 90) this.focus(u);
  };

  Battle.prototype.draw = function (ctx) { D.ui.drawBattle(ctx, this); };
  Battle.prototype.onRequest = function (req) { D.ui.onRequest(this, req); };
})();
