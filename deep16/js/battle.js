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
    var F = this.fight = D.fight(this.o.fight || 'gallery'), m = this.map = D.iso.load(D.MAPS[F.map]), self = this;
    // on the ladder: the four at the fight's level, by the 8-bit game's own rules (nothing read from a save).
    // Otherwise walk in from the save (the door's snapshot or the newest slot), or as the fixture: the entry card offers both
    // from the camp (js/camp.js): the four as the morning left them; copied, so RESTART starts from the camp again
    if (this.o.data) this.from = { from: 'the camp', when: null, data: JSON.parse(JSON.stringify(this.o.data)) };
    else if (this.o.ladder) this.from = { from: 'the ladder', when: null, data: D.save.fixture(F.level) };
    else this.from = this.o.fixture ? { from: 'the fixture', when: null, data: D.save.fixture() } : D.save.load();
    this.canSwap = !this.o.ladder && (this.o.fixture || this.from.from !== 'the fixture');
    var party = D.save.units(this.from.data, this.o.climb ? Object.assign({}, F, { looks: null }) : F); // the climb: Barley is Barley
    var entry = (F.entry || m.def.entry).slice();
    // the ways out (LEAVE THE FIGHT): every square on an open edge of the map you can stand on (a road running on, the mouth
    // the party came in by), and a map's named doors (`doors`: the inn's); a map closed all round keeps the way in
    // riders (a fight's scenery figures: the wagon's glamoured children): drawn where they stand, never in the fight
    this.riders = (F.riders || []).map(function (r) { return { x: r.at[0], y: r.at[1], sheet: r.sheet, after: r.after, facing: r.facing || 0, gz: r.gz || 0 }; });
    this.exits = [];
    for (var ey = 0; ey < m.h; ey++) for (var ex = 0; ex < m.w; ex++) { var es = m.at(ex, ey); if (es && es.walk && (ex === 0 || ey === 0 || ex === m.w - 1 || ey === m.h - 1)) this.exits.push([ex, ey]); }
    (m.def.doors || []).forEach(function (q) { self.exits.push(q); });
    if (!this.exits.length) this.exits = entry.slice();
    party.forEach(function (u, i) { var e = entry[i % entry.length]; u.x = e[0]; u.y = e[1]; u.facing = 5; });
    var foes = (F.foes || m.def.foes).map(function (f) { return self.makeFoe(f); });
    this.units = party.concat(foes);
    this.inv = D.save.armoury(JSON.parse(JSON.stringify(this.from.data.inv || [])).map(function (s) { return Array.isArray(s) ? { id: s[0], n: s[1] } : s; }));
    this.units.forEach(function (u) { u.anim = 'idle'; u.animT = 0; u.flash = 0; u.reaction = 1; u.conds = u.conds || {}; if (u.hp <= 0 && u.side === 'party') u.ko = true; if (u.hidden0) u.conds.hidden = true; });    G.setup(m, this.units);
    // strung webs a fight starts with (Web Gulch): difficult ground for all but the web-walkers, drawn like the spell's
    var webs = F.webs || m.def.webs;
    this.webs = webs ? [{ by: 'the ground', sq: webs.slice() }] : [];
    // a Ring of Binding (the lake: fight.ring { hero, rounds, con }): its wearer saves CON better, and on the named rounds
    // the thing in the water must turn on them (ai.js brute)
    this.taunt = null;
    if (F.ring) { var rw = party.filter(function (u) { return u.id === F.ring.hero; })[0]; if (rw) { rw.saves = Object.assign({}, rw.saves); rw.saves.con += F.ring.con || 0; rw.ring = true; this.taunt = { u: rw, rounds: F.ring.rounds }; } }
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
      fey: !!d.fey, webWalker: !!d.webWalker, regen: d.regen || 0, conds: {}, lvl: 5,
      // the bestiary's traits (09-27, the ladder): read by rules.js (packTactics), hurt() (resist/immune/vulnerable),
      // ai.js brute() (web, slam, bound, martial, surprise) and attack() (a grapple on a hit)
      packTactics: !!d.packTactics, resist: d.resist || null, immune: d.immune || null, vulnerable: d.vulnerable || null,
      web: d.web ? { atk: d.web.atk, range: d.web.range, dc: d.web.dc, recharge: d.web.recharge, ready: true } : null,
      slam: d.slam || null, bound: d.bound || null, martial: d.martial || null, surprise: d.surprise || null, holding: [],
      ethereal: !!f.ethereal, // a phase spider may start in the rock (the north cut: "They come out of the walls")
      weave: d.weave ? JSON.parse(JSON.stringify(d.weave)) : null, sneak: d.sneak || null, assassinate: !!d.assassinate, stealth: d.stealth || 0,
      enlarge: d.enlarge ? { dice: d.enlarge.dice, used: false } : null, split: !!d.split, small: d.small || null,
      bolts: d.bolts || null, // runs for the map's exit when the named one falls (the wheelwright, when Hask does)
      reckless: !!d.reckless, rageOnHit: !!d.rageOnHit, raging: false,
      flees: !!d.flees && !(this.fight && this.fight.noFlee), transfer: !!d.transfer, images: 0, named: !!d.named, swims: !!d.swims, swarm: !!d.swarm, noProne: !!d.noProne,
      moan: d.moan ? Object.assign({ ready: true }, d.moan) : null,
      leap: d.leap ? Object.assign({ ready: true }, d.leap) : null,
      phantasms: d.phantasms ? { when: d.phantasms, used: false } : null,
      hidden0: !!f.hidden
    };
  };
  // a damage type against a foe's resistances, immunities and vulnerabilities (SRD: immune 0, resist half, vulnerable x2)
  Battle.prototype.typed = function (u, n, type) {
    var t = type || '', has = function (l) { return l && l.some(function (k) { return t.indexOf(k) >= 0; }); };
    if (has(u.immune)) return { n: 0, why: 'immune' };
    if (has(u.resist)) return { n: Math.floor(n / 2), why: 'resists' };
    if (has(u.vulnerable)) return { n: n * 2, why: 'vulnerable' };
    return { n: n, why: '' };
  };
  // the pudding splits: each half has half its hit points and is one size smaller (Large -> Medium -> Small, and a Small
  // one does not split); the new one takes the nearest free square and acts right after it in the order
  Battle.prototype.splitOff = function (u) {
    var cls = u.sizeClass || (u.size > 1 ? 'L' : 'M'), next = cls === 'L' ? 'M' : 'S', half = Math.floor(u.hp / 2);
    var n = this.makeFoe({ id: u.id + '-' + (this.splitSeq = (this.splitSeq || 0) + 1), kind: u.kind });
    n.size = 1; if (u.small) n.sheet = u.small;
    var best = null, bd = Infinity, ux = u.x + ((u.size || 1) - 1) / 2, uy = u.y + ((u.size || 1) - 1) / 2;
    var wasSize = u.size; u.size = 1; // (its own footprint shrinks first, so the half can take a square it held)
    for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) {
      if ((x === u.x && y === u.y) || !G.canStand(n, x, y)) continue;
      var d = Math.hypot(x - ux, y - uy); if (d < bd) { bd = d; best = [x, y]; }
    }
    if (!best) { u.size = wasSize; return; } // no room: it does not split
    u.hp = u.maxhp = half; u.sizeClass = next; if (u.small) u.sheet = u.small;
    n.hp = n.maxhp = half; n.sizeClass = next; n.x = best[0]; n.y = best[1]; n.facing = u.facing;
    n.anim = 'idle'; n.animT = this.t; n.flash = 10; n.reaction = 1; n.initRoll = u.initRoll;
    this.units.push(n);
    this.order.splice(this.order.indexOf(u) + 1, 0, n);
    FX.sparkle(n, 'stone', 16); FX.sparkle(u, 'stone', 16); D.sfx('poison');
    this.card(['{r}The ' + shortName(u) + ' splits in two!{/}  {g}(' + half + ' HP each, one size smaller){/}'], 360);
  };
  // let go of whatever u holds (it fell, or its grip was out of reach)
  Battle.prototype.release = function (u, only) {
    this.units.forEach(function (w) {
      var r = w.conds.restrained;
      if (r && r.by === u.id && r.grapple && (!only || only === w)) delete w.conds.restrained;
      if (w.conds.stunned && w.conds.stunned.by === u.id && !only) delete w.conds.stunned;
    });
    u.holding = (u.holding || []).filter(function (w) { return only && w !== only && w.conds.restrained && w.conds.restrained.by === u.id; });
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
    // a fight that must not let them go (the wagon yard: fight.noEscape): one got away, and it is lost
    if (this.fight.noEscape && !this.alive('foe').length && this.units.some(function (u) { return u.fled; })) return 'lost';
    if (!this.alive('foe').length) return 'won';
    // none of the party left on the field: lost, unless one of them got out (the climb's campfire; Griz, 09-27)
    if (!this.alive('party').length) return this.units.some(function (u) { return u.left; }) ? 'escaped' : 'lost';
    return null;
  };

  // ------------------------------------------------------------------ the run: entry card, initiative, rounds
  Battle.prototype.run = function* () {
    var self = this;
    D.music(this.fight.music || 'battle'); // (it starts on the first key or click: browsers hold sound till then; a set piece's boss tune)
    yield { entry: true };
    // initiative: d20 + DEX (and the fighter's Remarkable Athlete), rolled once
    var rolls = this.units.map(function (u) { var d = D.d(20); u.initRoll = d + u.init; return { u: u, d: d }; });
    this.order = this.units.slice().sort(function (a, b) { return b.initRoll - a.initRoll || b.abil.dex - a.abil.dex; });
    this.card(['{y}INITIATIVE{/}  ' + this.order.map(function (u) { return shortName(u) + ' ' + u.initRoll; }).join(' · ')], 360);
    yield 50;
    // an ambush (the sect blades at the rest): the foes' Stealth, rolled once, against each hero's passive Perception;
    // whoever does not notice is caught unaware -- no turn in the first round, no reactions till then
    if (this.fight.ambush) {
      var sk = Math.max.apply(null, this.units.filter(function (w) { return w.side === 'foe'; }).map(function (w) { return w.stealth || 0; }));
      var sr = D.d(20), st = sr + sk, caught = [], lines = ['{r}AMBUSH{/}: their Stealth d20 ' + sr + ' ' + RU.sign(sk) + ' = ' + st + ' against each passive Perception'];
      this.units.forEach(function (w) {
        if (w.side !== 'party' || w.hp <= 0) return;
        var ok = (w.perception || 10) >= st;
        lines.push('  ' + w.name + ' ' + (w.perception || 10) + ': ' + (ok ? '{n}sees them coming{/}' : '{o}caught unaware{/}'));
        if (!ok) { w.conds.surprised = true; caught.push(w); }
      });
      this.card(lines, 480);
      D.sfx(caught.length ? 'encounter' : 'popup');
      yield 70;
    }
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
  function shortName(u) { return u.side === 'foe' ? ({ drow: 'Captain', phasespider: 'Spider', drider: 'Drider', spellweaver: 'Weaver', bugbearchief: 'Chief', hobsergeant: 'Sergeant', assassin: 'Blade', stonegiant: 'Giant', pudding: 'Pudding', giantspider: 'Spider', willem: 'Willem' }[u.kind] || u.name) : u.name; }

  // the second wave: when the gallery goes still, the cocoon on the far wall splits and what was in it drops out,
  // dealt into the initiative on its own roll. The hero whose blow did it keeps the rest of the turn.
  Battle.prototype.wave = function* () {
    var w = this.fight.wave !== undefined ? this.fight.wave : this.map.def.wave;
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
    // the glamour broken: the riders are what they were all along (the wagon yard's children)
    if (o === 'won') this.riders.forEach(function (r) { if (r.after) { r.sheet = r.after; FX.sparkle({ x: r.x, y: r.y, size: 1 }, 'gold', 14); } });
    D.music(o === 'won' ? 'victory' : 'gameover');
    yield 30;
    var F = this.fight, gone = this.units.some(function (u) { return u.fled; }) && this.alive('party').length;
    var head = o === 'won' ? '{y}' + (F.won || 'THE GALLERY IS STILL.') + '{/}' : o === 'escaped' ? '{y}OUT THE WAY THEY CAME IN.{/}' : '{r}' + (gone ? (F.escaped || 'THEY GOT AWAY.') : (F.lost || 'THE DARK KEEPS THEM.')) + '{/}';
    this.card([head, '{g}' + (this.o.onDone ? (this.o.climb ? 'E back to the climb' : 'E back to the ladder') : 'E fight again') + ' · M the menu{/}'], 1e9);
  };

  // ------------------------------------------------------------------ a hero's turn: the player acts until END TURN
  Battle.prototype.heroTurn = function* (u) {
    RU.startTurn(u);
    this.focus(u);
    if (u.conds.surprised) { delete u.conds.surprised; this.card(['{g}' + u.name + ' is caught unaware: no turn this round.{/}']); yield 40; return; }
    if (RU.canAct(u)) D.sfx('popup'); // your turn
    if (!RU.canAct(u)) {
      this.card(['{g}' + u.name + (u.hp <= 0 ? ' is down.' : u.conds.paralyzed ? ' is held fast.' : u.conds.stunned ? ' is stunned.' : ' cannot act.') + '{/}']);
      yield 40;
      if (u.hp > 0) D.magic.endTurn(this, u); // a held hero still gets the save at the end of the turn (the weaver's Hold, the chuul)
      return;
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
    var fast = u.subclass === 'Thief' && T.bonus > 0; // Fast Hands: the Thief uses an item with her bonus action
    if (items.length) out.push({ id: 'items', label: 'ITEM', cost: fast ? 'B' : 'A', ok: fast || (T.action > 0 && !T.attacksLeft), sub: 'items', icon: 'item' });
    if (u.cls === 'fighter') {
      out.push({ id: 'secondwind', label: '2ND WIND', cost: 'B', ok: T.bonus > 0 && u.feats.secondWind > 0, why: u.feats.secondWind > 0 ? '' : 'spent (a short rest brings it back)', note: '1d10+' + u.lvl + ' HP, ' + (u.feats.secondWind > 0 ? '1 use' : 'spent') + ' (short rest)' });
      if (u.lvl >= 2) out.push({ id: 'surge', label: 'SURGE', cost: 'F', ok: u.feats.actionSurge > 0 && !T.action && !T.attacksLeft, why: u.feats.actionSurge > 0 ? 'after your action' : 'spent (a short rest brings it back)', note: 'one more action, ' + (u.feats.actionSurge > 0 ? '1 use' : 'spent') + ' (short rest)' });
    }
    // HIDE sits on the rogue's first ring (Griz, 09-27: "Rogues gonna hide allatime"): Cunning Action's bonus action from
    // level 2, and the action when the bonus is gone (or before level 2, as the tabletop's Hide action)
    var cun = u.cls === 'rogue' && u.lvl >= 2 && T.bonus > 0;
    if (u.cls === 'rogue') out.push({ id: 'hide', label: 'HIDE', cost: cun ? 'B' : 'A', ok: cun || (T.action > 0 && !T.attacksLeft), note: (cun ? 'Cunning Action: ' : '') + 'Stealth against their eyes' });
    // Flame Tongue: a bonus action lights it or puts it out (not under the roost: its one law is no fire)
    if (u.weapon && u.weapon.flame) {
      var roostF = this.fight && this.fight.roost && !u.conds.ablaze;
      out.push({ id: u.conds.ablaze ? 'douse' : 'ignite', label: u.conds.ablaze ? 'DOUSE' : 'IGNITE', cost: 'B', icon: 'sacred', ok: T.bonus > 0 && !roostF, why: roostF ? 'the roost overhead: no fire' : 'the bonus action is spent', note: u.conds.ablaze ? 'the blade goes dark' : u.weapon.name + ': +' + u.weapon.flame + ' fire on a hit, light 40 ft' });
    }
    if (u.cls === 'paladin') out.push({ id: 'lay', label: 'LAY HANDS', cost: 'A', ok: T.action > 0 && !T.attacksLeft && u.feats.lay > 0, tool: 'lay', note: 'a pool of ' + (u.feats.lay || 0) + ' HP (long rest), touch' });
    // Sacred Weapon (Channel Divinity, Oath of Devotion): the 8-bit game's SKILL beside Lay on Hands, an action there as here
    if (u.cls === 'paladin' && u.lvl >= 3) out.push({ id: 'sacred', label: 'SACRED WEAPON', cost: 'A', ok: T.action > 0 && !T.attacksLeft && u.feats.channel > 0 && !u.conds.sacred, why: u.conds.sacred ? 'it is shining already' : u.feats.channel > 0 ? '' : 'Channel Divinity is spent (a short rest brings it back)', note: '+' + Math.max(1, D.mod(u.abil.cha)) + ' to hit for a minute; Channel Divinity ' + (u.feats.channel > 0 ? '1/1' : '0/1') + ' (short rest)' });
    // DASH, DISENGAGE, DODGE, HELP: the same ACTIONS for all four (Griz, 09-27: "uniform like the paladin"). The rogue's
    // Dash and Disengage are Cunning Action's (the bonus action) while she has the bonus, the plain actions after
    if (cun) {
      out.push({ id: 'cdash', label: 'DASH', cost: 'B', ok: !u.conds.restrained, why: 'held fast: her speed is 0, and a Dash adds her speed', note: 'Cunning Action: +' + u.speed + ' ft this turn', icon: 'dash' });
      out.push({ id: 'cdisengage', label: 'DISENGAGE', cost: 'B', ok: !T.disengaged, note: 'Cunning Action: leaving reach provokes nothing', icon: 'disengage' });
    } else {
      out.push({ id: 'dash', label: 'DASH', cost: 'A', ok: T.action > 0 && !T.attacksLeft && !u.conds.restrained, why: u.conds.restrained ? 'held fast: the speed is 0, and a Dash adds your speed' : 'the action is spent', note: '+' + u.speed + ' ft this turn' });
      out.push({ id: 'disengage', label: 'DISENGAGE', cost: 'A', ok: T.action > 0 && !T.attacksLeft && !T.disengaged, note: 'leaving reach provokes nothing this turn' });
    }
    // out the way the party came in (the fight's entry squares): the tabletop's walking off the table (Griz, 09-27: the climb's escape)
    if (this.onExit(u)) out.push({ id: 'leave', label: 'LEAVE THE FIGHT', cost: 'M', icon: 'back', ok: T.move >= 5 && !u.conds.restrained, why: u.conds.restrained ? 'held fast' : 'no move left', note: 'out the way you came in: a foe beside you gets its swing' });
    out.push({ id: 'dodge', label: 'DODGE', cost: 'A', ok: T.action > 0 && !T.attacksLeft, note: 'attacks at you at disadvantage till your next turn' });
    // Help (the attack kind) only with a foe beside you (Griz, 09-27)
    if (this.units.some(function (w) { return G.hostile(u, w) && G.standing(w) && G.dist(u, w) <= 5; }))
      out.push({ id: 'help', label: 'HELP', cost: 'A', ok: T.action > 0 && !T.attacksLeft, tool: 'help', note: 'the next ally to swing at a foe beside you has advantage' });
    return out;
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
        if (u.weapon.ammo && !this.ammoLeft(u)) { this.card(['{o}' + u.name + ' has no ' + this.itemName(u.weapon.ammo).toLowerCase() + ' left.{/}'], 120); return; }
        T.attacksLeft--;
        if (u.weapon.ammo) this.spendAmmo(u);
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
        if (!far || u.conds.restrained) return;
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
      case 'leave': { yield* this.leave(u); return; }
      case 'ignite': T.bonus = 0; u.conds.ablaze = true; D.sfx('fire'); FX.sparkle(u, 'fire', 18); this.card(['{y}' + u.name + '{/} speaks the word: the ' + u.weapon.name + ' {o}bursts into flame{/} (+' + u.weapon.flame + ' fire on a hit).']); return;
      case 'douse': T.bonus = 0; delete u.conds.ablaze; this.card(['{y}' + u.name + '{/} speaks the word again: the blade goes dark.']); return;
      case 'dash': if (u.conds.restrained) return; D.sfx('run'); T.action = 0; T.move += u.speed; this.card(['{y}' + u.name + '{/} dashes: {c}+' + u.speed + ' ft{/}.']); return;
      case 'cdash': if (u.conds.restrained) return; D.sfx('run'); T.bonus = 0; T.move += u.speed; this.card(['{y}' + u.name + '{/} (Cunning Action) dashes: {c}+' + u.speed + ' ft{/}.']); return;
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
          return G.hostile(u, w) && G.standing(w) && RU.canAct(w) && w.reaction > 0 && !w.ethereal && !(w.weapon && w.weapon.ranged)
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
            var atk = w.weapon || w.attacks.shortsword || w.attacks.longsword || w.attacks.bite
              || w.attacks[Object.keys(w.attacks).filter(function (k) { return !w.attacks[k].ranged; })[0]]; // any melee attack (the morningstar)
            if (!atk) continue;
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
    if (att.side === 'foe' && att.conds.hidden) delete att.conds.hidden; // a foe that strikes from hiding is seen (the gricks)
    // false images (the cloaker's phantasms, Willem's): a d20 says whether the blow goes at an image (3: 6+, 2: 8+, 1: 11+)
    if (tgt.images > 0 && !atk.save) {
      var need = [0, 11, 8, 6][Math.min(3, tgt.images)], id20 = D.d(20);
      if (id20 >= need) {
        var ir = RU.d20(e.net), itot = ir.pick + atk.atk, iac = 10 + D.mod(tgt.abil.dex), ihit = ir.pick === 20 || (ir.pick !== 1 && itot >= iac);
        if (ihit) tgt.images--;
        D.sfx(ihit ? 'hit' : 'miss'); FX.sparkle(tgt, 'violet', 14);
        this.card(['{y}' + nameOf(att) + '{/} > {r}' + nameOf(tgt) + '{/}  ' + atk.name, 'd20 ' + id20 + ' vs ' + need + ': {p}a false image{/}  d20 ' + ir.pick + ' ' + RU.sign(atk.atk) + ' = ' + itot + ' vs AC ' + iac + '  ' + (ihit ? '{n}the image bursts{/} (' + tgt.images + ' left)' : '{g}MISS{/}')], 300, cid);
        yield o.oa ? 16 : 26; att.anim = 'idle'; return;
      }
    }
    if (tgt.conds.helped && tgt.conds.helped.side === att.side) delete tgt.conds.helped; // help is spent on the first swing
    var sacred = att.conds.sacred && !atk.spell && !atk.ranged ? att.conds.sacred.atk : 0;
    var r = RU.d20(e.net), nat = r.pick, bless = att.conds.blessed ? D.d(4) : 0, total = nat + atk.atk + bless + sacred;
    var critAt = att.crit || 20;
    var hit = nat === 20 || (nat !== 1 && total >= ac)
      || !!(atk.autoHitHeld && tgt.conds.restrained && tgt.conds.restrained.by === att.id); // the cloaker's bite on the one it has engulfed
    var crit = hit && (nat >= critAt || (melee && ((tgt.hp <= 0 && !tgt.dead) || tgt.conds.paralyzed || tgt.conds.asleep) && G.dist(att, tgt) <= 5)
      || (att.assassinate && tgt.conds.surprised) // Assassinate: any hit on one caught unaware is a critical
      || (att.subclass === 'Cutthroat' && this.round === 1 && !tgt.acted)); // Opening Cut (the game's Cutthroat): the same, in the first round
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
    var dice = att.swarm && atk.halfHP && att.hp <= att.maxhp / 2 ? atk.halfHP : atk.dice; // a swarm at half its hit points bites for less
    var dr = RU.damage(dice, atk.mod, { crit: crit, gwf: atk.gwf }), dmg = dr.total, parts = [dice + RU.sign(atk.mod) + ' ' + RU.fmtRolls(dr.rolls) + RU.sign(atk.mod) + ' = ' + dr.total + ' ' + atk.type];
    // Sneak Attack: once a turn, a finesse or ranged weapon, with advantage or an ally at the target's side
    if (att.cls === 'rogue' && att.turn && !att.turn.sneakUsed && (atk.finesse || atk.ranged) && e.net >= 0) {
      var ally = this.units.some(function (w) { return w !== att && w.side === att.side && G.standing(w) && RU.canAct(w) && G.dist(w, tgt) <= 5; });
      if (e.net > 0 || ally) {
        att.turn.sneakUsed = true;
        var sn = D.roll(RU.sneakDice(att), { crit: crit }); dmg += sn.total;
        parts.push('{p}sneak ' + RU.sneakDice(att) + ' ' + RU.fmtRolls(sn.rolls) + ' = ' + sn.total + '{/}');
      }
    }
    // Flame Tongue (SRD 5.1): while it burns, +2d6 fire on a hit, dealt as fire (a troll's knitting reads it; fire resistance halves it)
    var fire = 0;
    if (atk.flame && att.conds.ablaze && !atk.spell) { var fl = D.roll(atk.flame, { crit: crit }); fire = fl.total; parts.push('{o}flame ' + atk.flame + ' ' + RU.fmtRolls(fl.rolls) + ' = ' + fl.total + ' fire{/}'); }
    if (att.conds.divineFavor && !atk.spell) { var df = D.roll('1d4', { crit: crit }); dmg += df.total; parts.push('{y}favor 1d4 [' + df.rolls.join(',') + '] radiant{/}'); }
    // a foe's poisoned blade
    if (atk.extra) { var ex = D.roll(atk.extra, { crit: crit }); dmg += ex.total; parts.push(atk.extra + ' ' + RU.fmtRolls(ex.rolls) + ' ' + atk.extraType); }
    // Martial Advantage (the hobgoblins): once a turn, +2d6 while an ally who can act stands within 5 ft of the target
    if (att.martial && att.turn && !att.turn.martialUsed && this.units.some(function (w) { return w !== att && w.side === att.side && G.standing(w) && RU.canAct(w) && G.dist(w, tgt) <= 5; })) {
      att.turn.martialUsed = true; var ma = D.roll(att.martial, { crit: crit }); dmg += ma.total; parts.push('{o}martial ' + att.martial + ' ' + RU.fmtRolls(ma.rolls) + '{/}');
    }
    // a foe's Sneak Attack (the sect blades): once a turn, with advantage or an ally beside the target, and not at disadvantage
    if (att.sneak && att.turn && !att.turn.sneakUsed && e.net >= 0 && (e.net > 0 || this.units.some(function (w) { return w !== att && w.side === att.side && G.standing(w) && RU.canAct(w) && G.dist(w, tgt) <= 5; }))) {
      att.turn.sneakUsed = true; var fs = D.roll(att.sneak, { crit: crit }); dmg += fs.total; parts.push('{p}sneak ' + att.sneak + ' ' + RU.fmtRolls(fs.rolls) + ' = ' + fs.total + '{/}');
    }
    // Surprise Attack (the bugbears; the 8-bit game's reading): the first round's hits bite harder
    if (att.raging && atk.rage) { dmg += atk.rage; parts.push('{o}rage +' + atk.rage + '{/}'); }
    if (att.surprise && this.round === 1) { var sa = D.roll(att.surprise, { crit: crit }); dmg += sa.total; parts.push('{o}first blow ' + att.surprise + ' ' + RU.fmtRolls(sa.rolls) + '{/}'); }
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
    // resistance to non-magical weapons (the grick): the weapon's own damage halved unless the weapon is magic
    if (tgt.resist && tgt.resist.indexOf('mundane') >= 0 && !atk.spell && !atk.magic && /bludgeoning|piercing|slashing/.test(atk.type)) {
      var cut = Math.ceil(dr.total / 2); dmg -= cut; parts.push('{g}-' + cut + ': it shrugs off plain steel{/}');
    }
    this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : '{n}HIT{/}') + why, parts.join('  ') + '  = {r}' + (dmg + fire) + '{/}'], 300, cid);
    if (melee) FX.slash(tgt, crit ? D.PAL.ramps.gold[4] : null);
    if (fire) { FX.sparkle(tgt, 'fire', 12); this.hurt(tgt, fire, 'fire'); }
    if (!tgt.dead) this.hurt(tgt, dmg, atk.type);
    yield o.oa ? 18 : 26;
    // riders: the drow's poisoned bolt, the spider's venom
    if (!tgt.dead && tgt.hp > 0 && atk.poison && !tgt.conds.poisoned) {
      var sv = RU.save(tgt, 'con', atk.poison.dc);
      this.card(['{r}' + nameOf(tgt) + '{/}: CON save vs poison  ' + RU.saveText(sv) + ' vs DC ' + sv.dc + '  ' + (sv.ok ? '{n}SAVED{/}' : '{o}POISONED{/}')]);
      if (!sv.ok) { D.sfx('poison'); tgt.conds.poisoned = true; FX.sparkle(tgt, 'moss', 10); }
      yield 30;
    }
    // a grapple on the hit (the otyugh's tentacles): Medium or smaller, while it has a tentacle free; grappled and restrained
    if (atk.grapple && !tgt.dead && tgt.hp > 0 && (tgt.size || 1) <= 1 && !tgt.conds.restrained && (att.holding || []).length < (atk.grapple.max || 1)) {
      tgt.conds.restrained = { dc: atk.grapple.dc, by: att.id, grapple: true };
      att.holding = (att.holding || []).concat([tgt]);
      D.sfx('poison'); FX.ring(tgt, 'bone', 26);
      this.card(['{r}' + nameOf(att) + '{/} has ' + nameOf(tgt) + ': {o}GRAPPLED and RESTRAINED{/}  {g}(escape DC ' + atk.grapple.dc + ', an action){/}']);
      yield 30;
      // Reel (the roper's tendril): the one it holds is dragged in to its side
      if (atk.reel && G.dist(att, tgt) > 5) {
        var rs = null, rd = Infinity, S = att.size || 1;
        for (var ry = att.y - 1; ry <= att.y + S; ry++) for (var rx = att.x - 1; rx <= att.x + S; rx++) {
          if (!G.canStand(tgt, rx, ry) || G.dist(att, tgt, null, null, rx, ry) > 5) continue;
          var dd = Math.hypot(rx - tgt.x, ry - tgt.y); if (dd < rd) { rd = dd; rs = [rx, ry]; }
        }
        if (rs) { tgt.tween = { fx: tgt.x, fy: tgt.y, fz: 0, t: 0, dur: 18 }; tgt.x = rs[0]; tgt.y = rs[1]; this.card(['{r}' + nameOf(att) + '{/} reels ' + nameOf(tgt) + ' in.']); D.sfx('run'); yield 24; }
      }
    }
    // a knockdown (the wolf's bite, the worg's, Talmok's fists, the giant's rock): STR or prone
    if (atk.prone && !tgt.dead && tgt.hp > 0 && !tgt.conds.prone && !tgt.noProne) {
      var ks = RU.save(tgt, 'str', atk.prone);
      this.card(['{r}' + nameOf(tgt) + '{/}: STR save  ' + RU.saveText(ks) + ' vs DC ' + ks.dc + '  ' + (ks.ok ? '{n}KEEPS HIS FEET{/}' : '{o}KNOCKED PRONE{/} {g}(half his move to rise){/}')]);
      if (!ks.ok) { tgt.conds.prone = true; D.sfx('hit'); }
      yield 24;
    }
    // the chuul's tentacles on one it holds: CON or poisoned, and paralyzed while the poison lasts (a CON save each turn)
    if (atk.paralyze && !tgt.dead && tgt.hp > 0 && !tgt.conds.paralyzed) {
      var ps = RU.save(tgt, 'con', atk.paralyze.dc);
      this.card(['{r}' + nameOf(tgt) + '{/}: CON save  ' + RU.saveText(ps) + ' vs DC ' + ps.dc + '  ' + (ps.ok ? '{n}SAVED{/}' : '{p}POISONED and PARALYZED{/} {g}(a CON save at the end of each turn){/}')]);
      if (!ps.ok) { D.sfx('poison'); tgt.conds.poisoned = true; tgt.conds.paralyzed = { save: 'con', dc: atk.paralyze.dc, by: att.id }; FX.sparkle(tgt, 'moss', 12); }
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
    if (/fire|acid/.test(type || '')) u.burned = true; // a troll's regeneration reads this at its next turn
    // Talmok rages when he is first hit: blades and fists do half from then on, his own blows +2
    if (u.rageOnHit && !u.raging && !u.dead) { u.raging = true; u.resist = ['bludgeoning', 'piercing', 'slashing']; FX.ring(u, 'red', 30); D.sfx('crit'); this.card(['{r}' + u.name + '{/} roars and rages!  {g}(half from blades and blows; +2 to his own){/}']); }
    // Split (the black pudding): slashing or lightning on one of Medium size or more with 10 HP or more halves it into two
    if (u.split && !u.dead && /slashing|lightning/.test(type || '') && u.hp >= 10 && (u.sizeClass || (u.size > 1 ? 'L' : 'M')) !== 'S' && this.alive('foe').length < 8) this.splitOff(u);
    if (u.immune || u.resist || u.vulnerable) {
      var ty = this.typed(u, n, type);
      if (ty.why) FX.float(ty.why, u, ty.why === 'vulnerable' ? D.PAL.ramps.gold[4] : D.PAL.ramps.silver[5]);
      n = ty.n;
      if (n <= 0) return;
    }
    // Damage Transfer (the cloaker): while it has someone engulfed, half of what it takes goes to them
    if (u.transfer && u.holding && u.holding.length && n > 1) {
      var vic = u.holding[0], half = Math.floor(n / 2);
      if (vic && !vic.dead && vic.hp > 0) { n -= half; FX.float('transfer', vic, D.PAL.ramps.violet[4]); this.hurt(vic, half, type); }
    }
    if (u.conds.stoneskin && /bludgeoning|piercing|slashing/.test(type || '')) { n = Math.floor(n / 2); FX.float('stoneskin', u, D.PAL.ramps.silver[5]); }
    if (u.temp > 0) { var soak = Math.min(u.temp, n); u.temp -= soak; n -= soak; }
    if (u.conds.asleep) { delete u.conds.asleep; FX.float('awake!', u, D.PAL.ramps.bone[2]); }
    if (n <= 0) return;
    u.hp = Math.max(0, u.hp - n);
    if (u.displacement) u.conds.displaceOff = true; // the cloak falters when a blow lands
    u.flash = 10;
    FX.float('-' + n, u, D.PAL.ramps.red[4]);
    if (u.conds.hidden) delete u.conds.hidden;
    if (u.hp <= 0) {
      u.anim = 'hurt'; u.animT = this.t;
      D.sfx(u.side === 'party' ? 'ko' : 'die');
      if (u.side === 'party') { u.ko = true; delete u.conds.ablaze; this.card(['{r}' + u.name + ' goes down.{/}']); }
      else { u.dead = true; u.deadT = this.t; this.card(['{y}The ' + shortName(u) + ' falls.{/}']); if (u.holding && u.holding.length) this.release(u); }
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

  // ------------------------------------------------------------------ gear in the fight: the MENU's EQUIP, not a ring button (Griz, 09-27: "Don't add
  // a button for gear swapping, but ... apply the action cost for weapon swaps"). A swap is stowing one weapon and drawing
  // another: the turn's one free object interaction and a second one, which takes the action (SRD 5.1, Use an Object),
  // so a swap costs the action. A shield on or off is an action too; armour doesn't change in a fight.
  Battle.prototype.itemName = function (id) { var it = window.DS.DATA.items[id]; return it ? it.name : id; };
  function packOf(B, id) { return B.inv.filter(function (x) { return x.id === id; })[0]; }
  Battle.prototype.ammoLeft = function (u) { var s = packOf(this, u.weapon.ammo); return s ? s.n : 0; };
  Battle.prototype.spendAmmo = function (u) { var s = packOf(this, u.weapon.ammo); if (s && s.n > 0) s.n--; };
  Battle.prototype.gearOptions = function (u) {
    var R = window.DS.R, h = u.src, T = u.turn, B = this, out = [];
    if (!h || u.guest || !T || !h.equip) return out;
    var busy = T.action > 0 && !T.attacksLeft ? '' : 'the action is spent', cur = R.item(h.equip.weapon);
    var curTwo = cur && cur.weapon && (cur.weapon.props || []).indexOf('two-handed') >= 0;
    this.inv.forEach(function (s) {
      var it = window.DS.DATA.items[s.id];
      if (!it || it.kind !== 'weapon' || s.n <= 0 || !R.canEquip(h, it)) return;
      var wd = it.weapon, two = (wd.props || []).indexOf('two-handed') >= 0, why = busy || (two && h.equip.shield ? 'two hands: the shield comes off first' : '');
      var ammo = wd.ammo ? ', ' + (packOf(B, wd.ammo) ? packOf(B, wd.ammo).n : 0) + ' ' + B.itemName(wd.ammo).toLowerCase() : '';
      out.push({ kind: 'weapon', id: s.id, label: it.name, note: wd.dmg + ' ' + wd.type + (wd.range ? ', ' + wd.range.join('/') + ' ft' : ', melee') + ammo, ok: !why, why: why });
    });
    // armour: not in a fight on the tabletop (it takes minutes), but the ladder's test bench allows it, for the action
    // (Griz, 09-27: "Allow for in-combat armor swapping on the non-climbing ladder"); a climb (this.o.climb) will not
    if (this.o.ladder && !this.o.climb) {
      var worn = R.item(h.equip.armor);
      if (worn) out.push({ kind: 'armoroff', label: 'ARMOUR OFF: ' + worn.name, note: 'into the pack (the ladder only)', ok: !busy, why: busy });
      this.inv.forEach(function (s) {
        var it = window.DS.DATA.items[s.id];
        if (!it || it.kind !== 'armor' || s.n <= 0 || !R.canEquip(h, it)) return;
        out.push({ kind: 'armor', id: s.id, label: 'WEAR: ' + it.name, note: it.desc ? it.desc.split('.')[0] : '', ok: !busy, why: busy });
      });
    }
    if (h.equip.shield) out.push({ kind: 'shieldoff', label: 'SHIELD OFF', note: 'into the pack: -' + ((R.item(h.equip.shield).shield || {}).ac || 2) + ' AC', ok: !busy, why: busy });
    else {
      var sh = this.inv.filter(function (s) { var it = window.DS.DATA.items[s.id]; return it && it.kind === 'shield' && s.n > 0 && R.canEquip(h, it); })[0];
      if (sh) out.push({ kind: 'shieldon', id: sh.id, label: 'SHIELD ON: ' + this.itemName(sh.id), note: '', ok: !busy && !curTwo, why: busy || (curTwo ? 'the weapon takes both hands' : '') });
    }
    return out;
  };
  Battle.prototype.swapGear = function (u, o) {
    var R = window.DS.R, h = u.src, B = this;
    function give(id) { if (!id) return; var s = packOf(B, id); if (s) s.n++; else B.inv.push({ id: id, n: 1 }); }
    function take(id) { var s = packOf(B, id); if (s) s.n--; }
    u.turn.action = 0; D.sfx('confirm');
    if (o.kind === 'weapon') { give(h.equip.weapon); take(o.id); h.equip.weapon = o.id; delete u.conds.ablaze; } // sheathed: the flame goes out
    if (o.kind === 'shieldoff') { give(h.equip.shield); h.equip.shield = null; }
    if (o.kind === 'shieldon') { take(o.id); h.equip.shield = o.id; }
    if (o.kind === 'armoroff') { give(h.equip.armor); h.equip.armor = null; }
    if (o.kind === 'armor') { give(h.equip.armor); take(o.id); h.equip.armor = o.id; }
    u.weapon = D.save.weaponOf(h); u.attacks = u.weapon.loading ? 1 : u.attacksBase;
    // Mage Armor ends when its wearer puts on armour (robes aren't armour to it)
    if (R.armored(h) && (u.conds.mageArmor || (h.conds && h.conds.mageArmor))) { delete u.conds.mageArmor; if (h.conds) delete h.conds.mageArmor; }
    var ac = R.ac(h); if (u.conds.mageArmor && !R.armored(h)) ac = Math.max(ac, 13 + D.mod(u.abil.dex)); // Mage Armor cast in this fight
    u.baseAC = ac; u.armored = R.armored(h);
    var did = { weapon: 'stows one weapon and takes up the ' + u.weapon.name, shieldoff: 'slings the shield', shieldon: 'takes up the shield',
      armoroff: 'sheds the armour', armor: 'buckles on the ' + this.itemName(o.id) }[o.kind];
    this.card(['{y}' + u.name + '{/} ' + did + ' (the action).  AC ' + RU.ac(u) + '  ' + u.weapon.name + ' ' + RU.sign(u.weapon.atk) + ', ' + u.weapon.dice + RU.sign(u.weapon.mod) + (u.weapon.ranged ? '  ' + u.weapon.range.join('/') + ' ft' : '')], 240);
  };

  // ------------------------------------------------------------------ leaving: out the way the party came in. Stepping off the map leaves any foe's reach,
  // so its opportunity attack comes first (unless the hero disengaged); then the hero is out of the fight, not dead
  Battle.prototype.onExit = function (u) { return (this.exits || []).some(function (q) { return q[0] === u.x && q[1] === u.y; }); };
  Battle.prototype.leave = function* (u) {
    var T = u.turn;
    if (!T.disengaged) {
      var prov = this.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && RU.canAct(w) && w.reaction > 0 && !w.ethereal && G.dist(w, u) <= w.reach && !(w.weapon && w.weapon.ranged); });
      for (var k = 0; k < prov.length; k++) {
        var w = prov[k], keys = Object.keys(w.attacks || {}).filter(function (key) { return !w.attacks[key].ranged; }), atk = w.weapon || (keys.length ? w.attacks[keys[0]] : null);
        if (!atk) continue;
        w.reaction = 0;
        this.card(['{o}' + (w.side === 'foe' ? 'The ' + shortName(w) : w.name) + '{/}: an opportunity attack on ' + u.name + ', leaving.']);
        yield* this.attack(w, u, atk, { oa: true });
        if (u.hp <= 0) return;
      }
    }
    T.move = 0; u.left = true; u.dead = true; u.deadT = this.t; delete u.conds.ablaze;
    if (u.conc) D.magic.endConc(this, u, 'out of the fight');
    D.sfx('run');
    this.card(['{y}' + u.name + '{/} gets out the way the party came in.  {g}(out of the fight){/}']);
    yield 30;
  };

  // ------------------------------------------------------------------ items: the save's own (a potion, a kit, an antitoxin, an oil flask)
  var ITEM_OK = { heal: 1, revive: 1, antitoxin: 1, cure: 1, damage: 1 };
  Battle.prototype.itemList = function (u) {
    var T = u.turn, roost = this.fight && this.fight.roost;
    return (this.inv || []).map(function (s) {
      var it = window.DS.DATA.items[s.id];
      if (!it || !it.use || !it.use.battle || !ITEM_OK[it.use.effect] || s.n <= 0) return null;
      if (roost && it.use.effect === 'damage') return { id: s.id, name: it.name, n: s.n, use: it.use, ok: false, why: 'the roost overhead: no fire' };
      return { id: s.id, name: it.name, n: s.n, use: it.use, ok: (u.subclass === 'Thief' && T.bonus > 0) || (T.action > 0 && !T.attacksLeft), why: T.action > 0 ? '' : 'the action is spent' };
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
    if (u.subclass === 'Thief' && u.turn.bonus > 0) u.turn.bonus = 0; else u.turn.action = 0; // Fast Hands
    s.n--;
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
    if (T.bonus > 0 && u.lvl >= 2) T.bonus = 0; else T.action = 0; // Cunning Action from level 2; the Hide action before
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
    var self = this;
    return this.units.some(function (w) { return G.hostile(u, w) && G.standing(w) && !w.dead && w.hp > 0 && self.canHit(u, w); });
  };
  // can u's weapon reach w from where u stands? A ranged one (a hero's crossbow) out to its long range, if it can see w
  Battle.prototype.canHit = function (u, w) {
    var wp = u.weapon;
    if (wp && wp.ranged) return G.dist(u, w) <= wp.range[1] && G.los(u, w).clear;
    return G.dist(u, w) <= u.reach;
  };
  Battle.prototype.focus = function (u) { var c = FX.at(u); D.iso.lookAt(c.gx, c.gy, c.gz); };
  Battle.prototype.keepInView = function (u) {
    var c = FX.at(u), w = D.iso.center(c.gx, c.gy, c.gz), s = D.iso.toScreen(w.x, w.y);
    if (s.x < 110 || s.x > D.W - 110 || s.y < 70 || s.y > D.H - 90) this.focus(u);
  };

  Battle.prototype.opaque = true; // (the ladder under it needn't draw)
  Battle.prototype.draw = function (ctx) { D.ui.drawBattle(ctx, this); };
  Battle.prototype.onRequest = function (req) { D.ui.onRequest(this, req); };
})();
