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
    var F = this.fight = this.o.fightDef || D.fight(this.o.fight || 'gallery'), m = this.map = D.iso.load(D.MAPS[F.map]), self = this;
    // on the ladder: the four at the fight's level, by the 8-bit game's own rules (nothing read from a save).
    // Otherwise walk in from the save (the door's snapshot or the newest slot), or as the fixture: the entry card offers both
    // from the camp (js/camp.js): the four as the morning left them; copied, so RESTART starts from the camp again
    // inside the 8-bit game (js/embed.js, this.o.embed): the party it handed over, as it stood when the fight began
    if (this.o.data) this.from = { from: this.o.embed ? 'the 8-bit game' : 'the camp', when: null, data: JSON.parse(JSON.stringify(this.o.data)) };
    else if (this.o.ladder || this.o.npc) this.from = { from: this.o.npc ? 'the class floor' : 'the ladder', when: null, data: D.save.fixture(F.level) };
    else this.from = this.o.fixture ? { from: 'the fixture', when: null, data: D.save.fixture() } : D.save.load();
    this.canSwap = !this.o.ladder && !this.o.npc && !this.o.embed && (this.o.fixture || this.from.from !== 'the fixture');
    var party = D.save.units(this.from.data, this.o.climb ? Object.assign({}, F, { looks: null }) : F); // the climb: Barley is Barley
    // the class floor (js/classes.js): a band of class NPCs instead of the four when asked (class against class), and on the bench
    // everyone on the party's side is run by the class tactics too (js/tactics.js)
    var NB = this.o.npc;
    if (NB && NB.party) party = NB.party.map(function (w, i) { return D.npc.build(w, F.level, 'party', { id: 'p' + i + '-' + String(w).split(':')[0] }); }).filter(Boolean);
    if (NB && this.o.bench) party.forEach(function (u) { u.guest = true; u.classAI = true; });
    var entry = (F.entry || m.def.entry).slice();
    // the ways out (LEAVE THE FIGHT): every square on an open edge of the map you can stand on (a road running on, the mouth
    // the party came in by), and a map's named doors (`doors`: the inn's); a map closed all round keeps the way in
    // riders (a fight's scenery figures: the wagon's glamoured children, the team in its traces): drawn where they stand,
    // never in the fight. `foot` [w, h] for a big one (a horse is 2 x 1), `blocks` holds its squares, `team` startles when the run begins
    this.riders = (F.riders || []).map(function (r) { return { x: r.at[0], y: r.at[1], sheet: r.sheet, after: r.after, facing: r.facing || 0, gz: r.gz || 0, foot: r.foot || [1, 1], team: !!r.team, anim: 'idle', animT: 0 }; });
    (F.riders || []).forEach(function (r) { if (!r.blocks) return; var f = r.foot || [1, 1]; for (var j = 0; j < f[1]; j++) for (var i = 0; i < f[0]; i++) { var s = m.at(r.at[0] + i, r.at[1] + j); if (s) s.walk = false; } });
    // the lone investigator (the 8-bit wagon night's INVESTIGATE, this.o.embed.solo): one hero in the yard; the rest come out
    // of the inn at round this.o.embed.join (the 8-bit battle's `join`), onto the squares by the door
    var solo = this.o.embed && this.o.embed.solo;
    var out = solo && party.some(function (u) { return u.id === solo; }) ? party.filter(function (u) { return u.id !== solo; }) : [];
    this.reserve = out.filter(function (u) { return u.hp > 0; });
    this.stayed = out.filter(function (u) { return u.hp <= 0; }); // (one already down stays in the inn: embed.js still reports them)
    party = party.filter(function (u) { return out.indexOf(u) < 0; });
    this.exits = [];
    for (var ey = 0; ey < m.h; ey++) for (var ex = 0; ex < m.w; ex++) { var es = m.at(ex, ey); if (es && es.walk && (ex === 0 || ey === 0 || ex === m.w - 1 || ey === m.h - 1)) this.exits.push([ex, ey]); }
    (m.def.doors || []).forEach(function (q) { self.exits.push(q); });
    if (!this.exits.length) this.exits = entry.slice();
    // more of them than the map has entry squares (the 8-bit game's guests: the nest's Halldor and his four) stand on the
    // nearest free squares behind the first
    var seat = {};
    party.forEach(function (u, i) {
      var e = entry[i];
      if (!e || seat[e[0] + ',' + e[1]]) {
        var bd = Infinity, e0 = entry[0];
        for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
          var q = m.at(x, y); if (!q || !q.walk || seat[x + ',' + y]) continue;
          var dd = Math.max(Math.abs(x - e0[0]), Math.abs(y - e0[1])) + (y < e0[1] ? 0.5 : 0) + 0.01 * Math.hypot(x - e0[0], y - e0[1]);
          if (dd < bd) { bd = dd; e = [x, y]; }
        }
      }
      seat[e[0] + ',' + e[1]] = 1; u.x = e[0]; u.y = e[1]; u.facing = 5;
    });
    // inside the 8-bit game, the 8-bit scene's own foes (this.o.embed.enemies, Battle.roster), or only those still out there
    // (this.o.embed.only: the chase's road fights)
    var only = this.o.embed && this.o.embed.only, list = this.o.embed && this.o.embed.enemies;
    var foes = (list ? this.roster(F.foes || m.def.foes, list, m, party) : (F.foes || m.def.foes).filter(function (f) { return !only || only.indexOf(f.kind) >= 0; }))
      .map(function (f) { return self.makeFoe(f); });
    if (NB) foes = this.seatBand(NB.foes.map(function (w, i) { return D.npc.build(w, F.level, 'foe', { id: 'f' + i + '-' + String(w).split(':')[0] }); }).filter(Boolean), m, party);
    if (this.o.embed && this.o.embed.revealed) foes.forEach(function (u) { u.hidden0 = false; }); // (seen coming: the roper under the ledger-lamp)
    this.units = party.concat(foes);
    // the pack: DEEP16 lends every ladder and climb party a crossbow and bolts (save.js armoury); inside the 8-bit game the party
    // carries only what it brought (Griz, 09-27: "unless the players bring crossbows/range, they shouldn't have one")
    var pack = JSON.parse(JSON.stringify(this.from.data.inv || [])).map(function (s) { return Array.isArray(s) ? { id: s[0], n: s[1] } : s; });
    this.inv = this.o.embed ? pack : D.save.armoury(pack);
    this.units.forEach(function (u) { u.anim = 'idle'; u.animT = 0; u.flash = 0; u.reaction = 1; u.conds = u.conds || {}; if (u.hp <= 0 && u.side === 'party') u.ko = true; if (u.hidden0) u.conds.hidden = true; });    G.setup(m, this.units);
    // torchdark (09-28): dark ground -- the fight's own word, else the 8-bit map's `dark` when the fight is fought from there
    // (js/embed.js), else the grid map's -- and the lights the place keeps (a lamp, a fire, a glow: [x, y, r, color, dimOnly]);
    // a torch the party walked in holding (the 8-bit field's) is in that hero's hand from the first round
    this.dark = F.dark != null ? !!F.dark : (this.o.embed && this.o.embed.dark != null) ? !!this.o.embed.dark : !!m.def.dark;
    this.lights = (F.lights || m.def.lights || []).map(function (l, i) { return { id: 'map' + i, kind: 'map', x: l[0], y: l[1], bright: l[4] ? 0 : l[2], dim: l[2], color: l[3] || 'gold', flame: !l[3] || l[3] === 'gold' || l[3] === 'fire' }; });
    var torchBy = this.o.embed && this.o.embed.torch;
    if (torchBy) this.units.forEach(function (u) { if (u.id === torchBy && u.side === 'party' && u.hp > 0 && D.light.handsFree(u) > 0) { u.torch = { lit: true }; D.light.regrip(u); } });
    // strung webs a fight starts with (Web Gulch): difficult ground for all but the web-walkers, drawn like the spell's
    var webs = F.webs || m.def.webs;
    this.webs = webs ? [{ by: 'the ground', sq: webs.slice() }] : [];
    // a Ring of Binding (the lake: fight.ring { hero, rounds, con }): its wearer saves CON better, and on the named rounds
    // the thing in the water must turn on them (ai.js brute)
    this.taunt = null; this.intro = (this.o.embed && this.o.embed.revealed && F.introSeen) || F.intro;
    var ring = F.ring;
    // inside the 8-bit game the ring is whoever wears it, standing (its S.lakeFight), and its +3 is already in their saves
    // (the 8-bit R.saveBonus); nobody wearing it, no taunt, and the card says so (fight.introNoRing)
    if (ring && this.o.embed) {
      var wr = party.filter(function (u) { return u.hp > 0 && u.src && u.src.equip && u.src.equip.ring === 'ringofbinding'; })[0];
      ring = wr ? Object.assign({}, ring, { hero: wr.id, con: 0 }) : null;
      this.intro = wr ? (F.introRing || F.intro).replace('{ring}', wr.name) : F.introNoRing || F.intro;
    }
    if (ring) { var rw = party.filter(function (u) { return u.id === ring.hero; })[0]; if (rw) { rw.saves = Object.assign({}, rw.saves); rw.saves.con += ring.con || 0; rw.ring = true; this.taunt = { u: rw, rounds: ring.rounds }; } }
    FX.clear();
    this.t = 0; this.cards = []; this.round = 0; this.order = []; this.active = null;
    this.tool = 'move'; this.cursor = { x: 5, y: 10 }; this.req = null; this.wait = 0; this.waitFx = false; this.result = null;
    D.iso.lookAt(5, 10);
    this.co = this.run();
    D.battle = this;
  };

  // the 8-bit game's monster ids where DEEP16's kinds differ (its drow are DEEP16's drowlings; its blade-captain, DEEP16's drow)
  var KIND8 = { drow: 'drowling', drowcaptain: 'drow' };
  D.kind8 = function (id8) { return KIND8[id8] || id8; };
  // the fight inside the 8-bit game (RULED 09-28, Griz: the 8-bit's list): the foes the 8-bit scene sends, sized there for
  // the party and its guests (EV.guestWeight: Pyro is worth two), each on the fight's own spot for its kind; one the fight
  // has no spot for is set down on the nearest free square beside one of its kind (hidden or in the rock as that one is),
  // else beside the fight's first foe. Spots nobody takes stay empty. Each carries its place in the 8-bit list (i8), so
  // js/embed.js knows which 8-bit foe died or got away
  Battle.prototype.roster = function (spots, list, m, party) {
    var used = [], taken = {}, out = [], extra = [];
    function mark(x, y, s) { for (var j = 0; j < s; j++) for (var i = 0; i < s; i++) taken[(x + i) + ',' + (y + j)] = 1; }
    party.forEach(function (u) { mark(u.x, u.y, 1); });
    list.forEach(function (id8, n) {
      var kind = D.kind8(id8);
      if (!D.FOES[kind]) { console.warn('DEEP16: no foe for the 8-bit game\'s ' + id8); return; }
      for (var j = 0; j < spots.length; j++) if (used.indexOf(j) < 0 && spots[j].kind === kind) { used.push(j); out.push(Object.assign({}, spots[j], { i8: n })); mark(spots[j].at[0], spots[j].at[1], D.FOES[kind].size || 1); return; }
      extra.push({ kind: kind, i8: n });
    });
    var nth = {};
    extra.forEach(function (e) {
      // (beside each spot of its kind in turn: five phase spiders out of three walls, not two out of one)
      var d = D.FOES[e.kind], s = d.size || 1, likes = spots.filter(function (p) { return p.kind === e.kind; });
      var like = likes.length ? likes[(nth[e.kind] = (nth[e.kind] || 0) + 1) % likes.length] : null;
      var at = (like || spots[0] || { at: [Math.floor(m.w / 2), 2] }).at, best = null, bd = Infinity;
      for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
        var ok = true;
        for (var j = 0; j < s && ok; j++) for (var i = 0; i < s && ok; i++) { var q = m.at(x + i, y + j); ok = !!(q && q.walk && !taken[(x + i) + ',' + (y + j)] && (!d.bound || q.ch === d.bound)); }
        if (!ok) continue;
        var dd = Math.max(Math.abs(x - at[0]), Math.abs(y - at[1])) + 0.01 * Math.hypot(x - at[0], y - at[1]);
        // (not in the party's lap: a square beside a hero costs as if it were three further off)
        if (party.some(function (u) { return Math.abs(u.x - x) <= s && Math.abs(u.y - y) <= s; })) dd += 3;
        if (dd < bd) { bd = dd; best = [x, y]; }
      }
      if (!best) { console.warn('DEEP16: no room for the 8-bit game\'s ' + e.kind); return; }
      mark(best[0], best[1], s);
      var hidden = like ? like.hidden : spots.length && spots.every(function (p) { return p.hidden; });
      out.push({ id: e.kind + '-' + e.i8, kind: e.kind, at: best, hidden: !!hidden, ethereal: !!(like && like.ethereal), i8: e.i8 });
    });
    return out.sort(function (a, b) { return a.i8 - b.i8; });
  };

  // a band of class NPCs across the floor from the party: the free squares farthest north, spread a square apart
  Battle.prototype.seatBand = function (band, m, party) {
    var taken = {}, pts = [];
    party.forEach(function (u) { taken[u.x + ',' + u.y] = 1; });
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) { var q = m.at(x, y); if (q && q.walk) pts.push([x, y]); }
    var cx = (m.w - 1) / 2;
    pts.sort(function (a, b) { return a[1] - b[1] || Math.abs(a[0] - cx) - Math.abs(b[0] - cx); });
    band.forEach(function (u) {
      var at = pts.filter(function (p) { for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) if (taken[(p[0] + i) + ',' + (p[1] + j)]) return false; return true; })[0] || pts.filter(function (p) { return !taken[p[0] + ',' + p[1]]; })[0];
      if (!at) return;
      u.x = at[0]; u.y = at[1]; u.facing = 1; taken[at[0] + ',' + at[1]] = 1;
    });
    return band;
  };
  Battle.prototype.makeFoe = function (f) {
    var d = D.FOES[f.kind];
    return {
      id: f.id, kind: f.kind, name: d.name, i8: f.i8, side: 'foe', sheet: d.sheet, rider: d.rider || null, x: f.at ? f.at[0] : 0, y: f.at ? f.at[1] : 0, facing: 1,
      hp: d.hp, maxhp: d.hp, baseAC: d.ac, speed: d.speed, size: d.size, reach: d.reach, abil: d.abil, saves: d.saves,
      init: d.init, perception: d.perception, attacks: d.attacks, multi: d.multi, jaunt: d.jaunt, faerie: d.faerieFire ? JSON.parse(JSON.stringify(d.faerieFire)) : null,
      fey: !!d.fey, webWalker: !!d.webWalker, regen: d.regen || 0, conds: {}, lvl: 5,
      // the bestiary's traits (09-27, the ladder): read by rules.js (packTactics), hurt() (resist/immune/vulnerable),
      // ai.js brute() (web, slam, bound, martial, surprise) and attack() (a grapple on a hit)
      packTactics: !!d.packTactics, resist: d.resist || null, immune: d.immune || null, vulnerable: d.vulnerable || null,
      // condition immunities cross from the 8-bit sheet (review 09-28 #9: the Keeper is not webbed, the pudding not put to sleep, the
      // roper not knocked down); a grid-only kind names its own. Light sensitivity (#7): bright light (the Light cantrip, Daylight)
      // costs it its next turn the first time and disadvantage while the light holds, as the 8-bit battle's dazzle does
      condImmune: (d.condImmune || (window.DS.DATA.monsters[f.kind] || {}).condImmune || null),
      lightSensitive: !!(d.lightSensitive || ((window.DS.DATA.monsters[f.kind] || {}).traits || {}).lightSensitive),
      // a soldier's own second wind and action surge (the Dominion line, review 09-28 #16): ai.js brute()
      secondWind: d.secondWind || null, actionSurge: !!d.actionSurge,
      web: d.web ? { atk: d.web.atk, range: d.web.range, dc: d.web.dc, recharge: d.web.recharge, ready: true } : null,
      slam: d.slam || null, bound: d.bound || null, martial: d.martial || null, surprise: d.surprise || null, holding: [],
      ethereal: !!f.ethereal, // a phase spider may start in the rock (the north cut: "They come out of the walls")
      weave: d.weave ? JSON.parse(JSON.stringify(d.weave)) : null, sneak: d.sneak || null, assassinate: !!d.assassinate, stealth: d.stealth || 0,
      enlarge: d.enlarge ? { dice: d.enlarge.dice, used: false } : null, split: !!d.split, small: d.small || null,
      bolts: d.bolts || null, // runs for the map's exit when the named one falls (the wheelwright, when Hask does)
      reckless: !!d.reckless, rageOnHit: !!d.rageOnHit, raging: false,
      // (the 8-bit wagon yard, fight.runWhenHurt: nobody runs until the one at the traces is hit -- then both do, Battle.startRun)
      yields: !!d.yields, // (stops at half his hit points: Battle.over's 'yielded', the 8-bit game's yield)
      flees: !!d.flees && !(this.fight && (this.fight.noFlee || this.fight.runWhenHurt)), traces: !!f.traces, transfer: !!d.transfer, images: 0, named: !!d.named, swims: !!d.swims, swarm: !!d.swarm, noProne: !!d.noProne,
      moan: d.moan ? Object.assign({ ready: true }, d.moan) : null,
      leap: d.leap ? Object.assign({ ready: true }, d.leap) : null,
      phantasms: d.phantasms ? { when: d.phantasms, used: false } : null,
      darkness: d.darkness ? { r: d.darkness.r, range: d.darkness.range, chance: d.darkness.chance, used: false } : null, // (Amara's, once, the turn she runs; the drow's on the 8-bit's chance: magic.js castDarkness)
      hidden0: !!f.hidden,
      // senses (SRD 5.1; torchdark 09-28): how far it sees in the dark, or by blindsight (and blind past it: the oozes, the darkmantle),
      // and what it does with the dark itself (the darkmantle's aura, the duergar's Invisibility: ai.js brute)
      darkvision: d.darkvision || 0, blindsight: d.blindsight || 0, blind: !!d.blind, truesight: d.truesight || 0, devilSight: !!d.devilSight,
      aura: d.darknessAura ? { used: false } : null, invis: d.invisibility ? { used: false } : null,
      mirrorEye: !!d.mirrorEye // the Mirror's warlocks (RULED 09-28): no hiding or invisibility before her, in light (magic.js inMirror)
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
      if (w.conds.blinded && w.conds.blinded.by === u.id && w.conds.blinded.held && (!only || only === w)) delete w.conds.blinded; // (the darkmantle off his head, the cloaker's fold)
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
    if (this.shakeT > 0) this.shakeT--;
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
    // a fight that ends the moment one gets away (the 8-bit wagon yard, fight.fledEnds: either of the pair on the road is the chase)
    if (this.fight.fledEnds && this.units.some(function (u) { return u.side === 'foe' && u.fled; })) return 'fled';
    // bright light under the roost (the Light cantrip, Daylight): the roof lets go -- the 8-bit game's RoostFail runs on it
    // (RULED 09-28: the roost law is canon; fire and thunder stay greyed, the one thing to remember is not to cast light)
    if (this.roostBroken) return 'roost';
    if (!this.alive('foe').length) return 'won';
    // one who yields when he is beaten (the cleric at Deepholm's door): at half his hit points, standing, it is over (the
    // 8-bit battle's `yields`: a blow that drops him from above half to nothing kills him instead)
    if (this.units.some(function (u) { return u.side === 'foe' && u.yields && u.hp > 0 && u.hp <= u.maxhp / 2; })) return 'yielded';
    // none of the party left on the field: lost, unless one of them got out (the climb's campfire; Griz, 09-27), or the rest
    // are still on their way out of the inn (this.reserve)
    if (!this.alive('party').length) return this.reserve.length ? null : this.units.some(function (u) { return u.left; }) ? 'escaped' : 'lost';
    return null;
  };
  // the rest of the party out of the inn (the lone investigator's round-two help): onto the free squares nearest the fight's
  // entry, each on its own initiative
  Battle.prototype.joinReserve = function* () {
    var self = this, come = this.reserve, e0 = (this.fight.entry || this.map.def.entry)[0], names = [];
    this.reserve = [];
    come.forEach(function (u) {
      var at = null, bd = Infinity;
      for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) { if (!G.canStand(u, x, y)) continue; var d = Math.hypot(x - e0[0], y - e0[1]); if (d < bd) { bd = d; at = [x, y]; } }
      if (!at) return;
      u.x = at[0]; u.y = at[1]; u.facing = 5; u.anim = 'idle'; u.animT = self.t; u.flash = 0; u.reaction = 1; u.conds = u.conds || {};
      if (u.hp <= 0) u.ko = true;
      self.units.push(u); names.push(u.name);
      u.initRoll = D.d(20) + u.init;
      var k = 0; while (k < self.order.length && self.order[k].initRoll >= u.initRoll) k++;
      self.order.splice(k, 0, u);
      FX.sparkle(u, 'gold', 10);
    });
    if (!names.length) return;
    this.focus(come[0]); D.sfx('popup');
    this.card(['{y}' + names.join(', ') + '{/} ' + (names.length > 1 ? 'come' : 'comes') + ' out of the inn!  {g}(' + come.map(function (u) { return shortName(u) + ' ' + u.initRoll; }).join(' · ') + '){/}'], 360);
    yield 50;
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
    // inside the 8-bit game its scene has already said who saw whom (the 8-bit battle's `surprised`: the watch that missed
    // the blades, the roper's grab, the crept-up raid), so that side loses the first round and nothing is rolled here
    var sur = this.o.embed && this.o.embed.surprised;
    if (sur === 'party' || sur === 'foes') {
      var side = sur === 'party' ? 'party' : 'foe';
      this.units.forEach(function (w) { if (w.side === side && w.hp > 0) w.conds.surprised = true; });
      this.card([sur === 'party' ? '{r}CAUGHT OFF GUARD{/}: they have the first round.' : '{y}THEY NEVER SAW YOU COMING{/}: the first round is yours.'], 360);
      D.sfx(sur === 'party' ? 'encounter' : 'popup');
      yield 60;
    } else if (this.fight.ambush && !this.o.embed) {
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
      if (this.reserve.length && this.round >= ((this.o.embed && this.o.embed.join) || 2)) yield* this.joinReserve();
      for (var i = 0; i < this.order.length; i++) {
        var u = this.order[i];
        if (u.dead) continue;
        this.active = u;
        if (u.side === 'party' && !u.guest) yield* this.heroTurn(u);
        else yield* D.ai.turn(this, u);
        this.active = null;
        yield* this.wave();
        this.sweep();
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

  // the conditions' housekeeping after every turn (09-27, Griz: "check the rest of the status effects for the similar issue
  // poison and restrained were having"): what a creature holds ends with it. A stun or a fright it laid (the slam's, the
  // Moan's: till the end of its next turn) ends when it is gone, since that turn never comes; its concentration ends when it
  // is incapacitated (paralyzed, stunned, asleep: SRD), and so does a grip it holds (a grapple ends when the grappler is)
  Battle.prototype.sweep = function () {
    var self = this;
    this.units.forEach(function (s) {
      var gone = s.dead || s.fled || s.left || s.hp <= 0, incap = gone || s.conds.paralyzed || s.conds.stunned || s.conds.asleep;
      if (gone) self.units.forEach(function (w) { ['stunned', 'frightened'].forEach(function (c) { if (w.conds[c] && w.conds[c].by === s.id) delete w.conds[c]; }); });
      if (incap && s.conc) D.magic.endConc(self, s, gone ? 'gone' : 'incapacitated');
      if (incap && s.holding && s.holding.length) self.release(s);
      // a blinding hold (the darkmantle over the head, the cloaker's fold) ends with the grip, however the grip ended
      var bl = s.conds.blinded;
      if (bl && bl.held && !(s.conds.restrained && s.conds.restrained.by === bl.by && s.conds.restrained.grapple)) { delete s.conds.blinded; self.card(['{g}' + (s.side === 'foe' ? 'The ' + shortName(s) : s.name) + ' can see again.{/}'], 200); }
    });
  };

  // the pair run (the 8-bit wagon yard, fight.runWhenHurt; Griz 09-27: "willem try to unhook them for the first part of the
  // fight (until he takes damage) - then amara and willem will try to make the escape on foot"; and "him getting hit should
  // not [do anything] in the fight - but start them both running for the escape tile on their next move"): the blow only
  // marks it (hurt: this.hitAtTraces); each of the pair breaks for the road at the start of its own next turn (ai.js turn)
  Battle.prototype.startRun = function (u) {
    u.flees = true;
    D.sfx('run');
    if (u.traces) {
      u.traces = false;
      this.riders.forEach(function (r) { if (r.team) { r.anim = 'hurt'; r.animT = this.t; } }, this); // (the team flinches in its harness; it stays hitched)
      this.card(['{r}' + shortName(u) + ' lets go of the traces.{/}  "Leave them!"  He breaks for the road, on foot.'], 400);
    } else this.card(['{r}' + shortName(u) + ' breaks for the road, on foot.{/}'], 400);
  };

  Battle.prototype.finish = function* (o) {
    this.result = o;
    // the glamour broken: the riders are what they were all along (the wagon yard's children)
    if (o === 'won') this.riders.forEach(function (r) { if (r.after) { r.sheet = r.after; FX.sparkle({ x: r.x, y: r.y, size: 1 }, 'gold', 14); } });
    if (o !== 'fled' && o !== 'yielded') D.music(o === 'won' ? 'victory' : 'gameover'); // (one got away: the boss tune runs on into the chase)
    // the roost coming down as a picture on the grid (torchdark 09-28; the 8-bit's swarm() the model): the ceiling lets go over the
    // iso map, the shake every ten frames, then the hand-off to the 8-bit game's RoostFail as before
    if (o === 'roost') { D.sfx('encounter'); this.card(['{r}' + (this.roostBroken === 'daylight' ? 'Daylight' : 'Bright light') + ' under a roosted ceiling. The whole roof shifts at once: millions of wings.{/}'], 1e9); FX.swarm(); this.shakeT = 170; for (var sk = 0; sk < 17; sk++) { D.sfx('miss'); yield 10; } yield 30; }
    yield 30;
    var F = this.fight, gone = this.units.some(function (u) { return u.fled; }) && this.alive('party').length;
    var head = o === 'roost' ? '{r}THE ROOST COMES DOWN.{/}' : o === 'yielded' ? '{y}' + ((this.o.embed && this.o.embed.yieldText) || F.yielded || 'HE LOWERS HIS HANDS.') + '{/}' : o === 'won' ? '{y}' + (F.won || 'THE GALLERY IS STILL.') + '{/}' : o === 'escaped' ? '{y}OUT THE WAY THEY CAME IN.{/}' : '{r}' + (gone ? (F.escaped || 'THEY GOT AWAY.') : (F.lost || 'THE DARK KEEPS THEM.')) + '{/}';
    this.card([head, '{g}' + (this.o.embed ? 'E to go on' : this.o.onDone ? (this.o.climb ? 'E back to the climb' : 'E back to the ladder') : 'E fight again') + ' · M the menu{/}'], 1e9);
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
    // a word of Command obeyed (a foe's Command, js/grimoire.js): the turn is the word's
    if (u.turn.lost) { if (u.turn.fleeFrom) yield* D.magic.flee(this, u); yield 40; D.magic.endTurn(this, u); return; }
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
    // torches are hands (torchdark, 09-28; the lighting is ITEM: a torch out of the pack, an action): the lit one in his hand may be
    // dropped (the turn's free hand on an object: it burns where it falls), thrown to a square within 20 ft (an action), or put out
    // (free, back in the pack); one burning at his feet is taken up (free, a free hand)
    var Lt = D.light, freeWhy = 'the free hand on an object is spent this turn';
    if (u.torch && !u.guest) {
      out.push({ id: 'droptorch', label: 'DROP TORCH', cost: 'F', icon: 'torch', ok: !T.freeObj, why: freeWhy, note: 'it burns where it falls' });
      out.push({ id: 'throwtorch', label: 'THROW TORCH', cost: 'A', icon: 'torch', ok: T.action > 0 && !T.attacksLeft, why: 'the action is spent', tool: 'torch', note: 'to a square within 20 ft: it burns there' });
      out.push({ id: 'dousetorch', label: 'DOUSE TORCH', cost: 'F', icon: 'torch', ok: !T.freeObj, why: freeWhy, note: 'out, and back in the pack' });
    } else if (!u.guest && Lt.torchAt(this, u.x, u.y)) out.push({ id: 'pickuptorch', label: 'TAKE UP TORCH', cost: 'F', icon: 'torch', ok: !T.freeObj && Lt.handsFree(u) > 0, why: T.freeObj ? freeWhy : Lt.handsWhy(u), note: 'the one burning at your feet' });
    if (u.cls === 'paladin') out.push({ id: 'lay', label: 'LAY HANDS', cost: 'A', ok: T.action > 0 && !T.attacksLeft && u.feats.lay > 0, tool: 'lay', note: 'a pool of ' + (u.feats.lay || 0) + ' HP (long rest), touch' });
    // Sacred Weapon (Channel Divinity, Oath of Devotion): the 8-bit game's SKILL beside Lay on Hands, an action there as here
    if (u.cls === 'paladin' && u.lvl >= 3) out.push({ id: 'sacred', label: 'SACRED WEAPON', cost: 'A', ok: T.action > 0 && !T.attacksLeft && u.feats.channel > 0 && !u.conds.sacred, why: u.conds.sacred ? 'it is shining already' : u.feats.channel > 0 ? '' : 'Channel Divinity is spent (a short rest brings it back)', note: '+' + Math.max(1, D.mod(u.abil.cha)) + ' to hit for a minute; Channel Divinity ' + (u.feats.channel > 0 ? '1/1' : '0/1') + ' (short rest)' + (this.fight && this.fight.roost ? ' -- {r}BRIGHT LIGHT, UNDER THE ROOST{/}' : '') });
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
    // (inside the 8-bit game, only where its own battle had RUN: this.o.embed.canRun)
    if (this.onExit(u) && !(this.o.embed && this.o.embed.canRun === false)) out.push({ id: 'leave', label: 'LEAVE THE FIGHT', cost: 'M', icon: 'back', ok: T.move >= 5 && !u.conds.restrained, why: u.conds.restrained ? 'held fast' : 'no move left', note: 'out the way you came in: a foe beside you gets its swing' });
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
        if (!(c.id === 'dancinglights' && u.conc && u.conc.id === 'dancinglights' && u.turn.bonusSpell === false)) this.endInvis(u, 'the spell'); // (Invisibility, Mislead: a spell cast ends it)
        return;
      }
      case 'item': { yield* this.useItem(u, c.id, c.target); return; }
      case 'breakfree': { yield* D.magic.breakFree(this, u); return; }
      case 'droptorch': T.freeObj = true; D.light.dropTorch(this, u); return;
      case 'dousetorch': T.freeObj = true; D.light.douseTorch(this, u); return;
      case 'pickuptorch': T.freeObj = true; D.light.pickUp(this, u); return;
      case 'throwtorch': { yield* D.light.throwTorch(this, u, c.x, c.y); return; }
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
        var sacredLines = ['{y}' + u.name + '{/}: SACRED WEAPON. The blade takes Kalindel\'s light: +' + sb + ' to hit with it for a minute (Channel Divinity).'];
        // its glow is bright light (SRD: 20 ft): under the roost the one law broken, as the Light cantrip (RULED 09-28: "paladin
        // weapon glows and such should probably roost too"); the fight ends 'roost' and the 8-bit game's RoostFail runs
        if (this.fight && this.fight.roost && !this.roostBroken) { this.roostBroken = 'sacred'; sacredLines.push('{r}Bright light under a roosted ceiling.{/}'); D.sfx('encounter'); }
        this.card(sacredLines);
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
            && G.dist(w, u) <= w.reach && G.dist(w, u, null, null, nx, ny) > w.reach && !(w.conds.hidden && false)
            && D.magic.sees(D.battle, w, u); // (a creature you can see: not into or out of darkness)
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
      var wasIn = D.magic.webAt(this, u);
      u.tween = { fx: u.x, fy: u.y, fz: G.gzAt(u, u.x, u.y), t: 0, dur: STEP_FRAMES };
      u.x = nx; u.y = ny;
      if (o && o.spend) T.move -= cost;
      this.keepInView(u);
      yield STEP_FRAMES;
      // into a spell's web (from outside it): the SRD's save for one who enters it during its turn; stuck, it stops there
      if (!u.ethereal && !wasIn && D.magic.webCatch(this, u, 'enters')) { if (o && o.spend) T.move = 0; yield 24; break; }
      // onto a Sleet Storm's ice (the first square of it this turn): DEX or down, and the move ends there
      if (!u.ethereal && D.magic.sleetCatch(this, u)) { if (o && o.spend) T.move = 0; yield 24; break; }
      // a spell's ground (09-28, js/grimoire.js): grease underfoot, spikes, the guardians' ring -- a fall ends the move there
      if (!u.ethereal && D.magic.stepInto) { var si = D.magic.stepInto(this, u); if (u.hp <= 0 || u.dead) { u.anim = 'idle'; return; } if (si) { if (o && o.spend) T.move = 0; yield 24; break; } }
    }
    u.anim = 'idle';
  };
  // Invisibility and Mislead end for one who attacks or casts (SRD); the caster's concentration goes with them (Greater
  // Invisibility, the duergar's own, keep on: theirs has no `ends`)
  Battle.prototype.endInvis = function (u, why) {
    var iv = u.conds.invisible;
    if (!iv || !iv.ends) return;
    var caster = iv.by && this.units.filter(function (w) { return w.id === iv.by && w.conc && (w.conc.id === 'invisibility' || w.conc.id === 'mislead'); })[0];
    if (caster) D.magic.endConc(this, caster, why); else { delete u.conds.invisible; this.card(['{g}' + (u.side === 'foe' ? 'The ' + shortName(u) : u.name) + ' is seen again (' + why + ').{/}'], 240); }
    if (u.conds.invisible && u.conds.invisible.ends) delete u.conds.invisible; // (the undo missed it: a foe's own)
  };

  // ------------------------------------------------------------------ an attack: the roll, the reactions, the damage
  Battle.prototype.attack = function* (att, tgt, atk, o) {
    o = o || {};
    if (!tgt || tgt.dead || tgt.ethereal) return;
    var self = this, melee = !atk.ranged && (!atk.spell || atk.touch), cid = 'atk' + (++this.cardSeq || (this.cardSeq = 1));
    att.facing = faceTo(att, tgt);
    att.anim = 'attack'; att.animT = this.t;
    if (!o.oa) yield 10;
    if (!melee) { FX.projectile(att, tgt, atk.fx || 'bolt'); yield { fx: 1 }; }
    var los = G.los(att, tgt), cover = melee && G.dist(att, tgt) <= 5 ? 0 : los.cover;
    var ac = RU.ac(tgt) + cover, e = RU.edges(att, tgt, atk);
    if (att.side === 'foe' && att.conds.hidden) delete att.conds.hidden; // a foe that strikes from hiding is seen (the gricks)
    this.endInvis(att, 'the attack'); // (Invisibility: the swing has its advantage, then the spell is gone)
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
    // Sanctuary (SRD 5.1; 09-28, js/grimoire.js): whoever would strike the warded makes a WIS save first, or the blow is lost
    if (tgt.conds.sanctuary && G.hostile(att, tgt) && D.magic.sanctuary && !D.magic.sanctuary(this, att, tgt)) { yield o.oa ? 16 : 24; att.anim = 'idle'; return; }
    // the one-shot marks, spent by this roll: Guiding Bolt's glow on the target, Vicious Mockery on the attacker, True Strike
    if (tgt.conds.guided) delete tgt.conds.guided;
    if (att.conds.mocked) delete att.conds.mocked;
    if (att.conds.trueStrike && att.conds.trueStrike.at === tgt.id) delete att.conds.trueStrike;
    var sacred = att.conds.sacred && !atk.spell && !atk.ranged ? att.conds.sacred.atk : 0;
    var baneR = att.conds.baned ? D.d(4) : 0;
    var r = RU.d20(e.net), nat = r.pick, bless = att.conds.blessed ? D.d(4) : 0, pen = (e.pen || 0) - baneR, total = nat + atk.atk + bless + sacred + pen;
    if (baneR && !e.pen) e.penWhy = 'bane';
    var critAt = att.crit || 20;
    var hit = nat === 20 || (nat !== 1 && total >= ac)
      || !!(atk.autoHitHeld && tgt.conds.restrained && tgt.conds.restrained.by === att.id); // the cloaker's bite on the one it has engulfed
    var crit = hit && (nat >= critAt || (melee && ((tgt.hp <= 0 && !tgt.dead) || tgt.conds.paralyzed || tgt.conds.asleep) && G.dist(att, tgt) <= 5)
      || (att.assassinate && tgt.conds.surprised) // Assassinate: any hit on one caught unaware is a critical
      || (att.subclass === 'Cutthroat' && this.round === 1 && !tgt.acted)); // Opening Cut (the game's Cutthroat): the same, in the first round
    var head = '{y}' + nameOf(att) + '{/} > {r}' + nameOf(tgt) + '{/}  ' + atk.name;
    var line = 'd20 ' + (r.rolls.length > 1 ? RU.fmtRolls(r.rolls) + '>' : '') + nat + ' ' + RU.sign(atk.atk) + (bless ? ' {y}+' + bless + ' bless{/}' : '') + (sacred ? ' {y}+' + sacred + ' sacred{/}' : '') + (pen ? ' {o}' + pen + ' ' + e.penWhy + '{/}' : '') + ' = ' + total + '  vs AC ' + RU.ac(tgt) + (cover ? ' {c}+' + cover + ' cover{/}' : '');
    var why = (e.adv.length ? '  {n}adv: ' + e.adv.join(', ') + '{/}' : '') + (e.dis.length ? '  {o}dis: ' + e.dis.join(', ') + '{/}' : '');
    // Shield: Aurdin's reaction, +5 AC against this and every attack till his turn (a class NPC's too, 09-28: it takes it whenever
    // the +5 turns the blow; one run by the AI never asks)
    if (hit && nat !== 20 && tgt.reaction > 0 && !tgt.conds.shield && RU.canAct(tgt) && (tgt.known || []).indexOf('shield') >= 0 && slotFor(tgt, 1) && total < ac + 5 && (!tgt.guest || tgt.classAI)) {
      this.card([head, line + why], 300, cid);
      var yes = byAI(tgt) ? true : yield { prompt: { who: tgt, title: tgt.name + ': SHIELD?', lines: ['The ' + total + ' would hit AC ' + ac + '.', '+5 AC makes it ' + (ac + 5) + ': a miss. (a level-' + slotFor(tgt, 1) + ' slot, the reaction)'], opts: [{ label: 'CAST SHIELD', value: true }, { label: 'TAKE IT', value: false }] } };
      if (yes) {
        var sl = slotFor(tgt, 1); tgt.slots[sl - 1]--; tgt.reaction = 0; tgt.conds.shield = true;
        FX.ring(tgt, 'glow', 50); D.sfx('buff');
        ac += 5; hit = false; crit = false;
        line += '  {c}SHIELD +5{/}';
      }
    }
    D.sfx(crit ? 'crit' : hit ? 'hit' : 'miss');
    this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : hit ? '{n}HIT{/}' : '{g}MISS{/}') + why], 300, cid);
    if (!hit) { if (o.onMiss) o.onMiss(tgt); FX.float('MISS', tgt, D.PAL.ramps.silver[5]); yield o.oa ? 16 : 24; att.anim = 'idle'; return; }
    // damage
    var dice = att.swarm && atk.halfHP && att.hp <= att.maxhp / 2 ? atk.halfHP : atk.dice; // a swarm at half its hit points bites for less
    var dr = RU.damage(dice, atk.mod, { crit: crit, gwf: atk.gwf }), dmg = dr.total, parts = [dice + RU.sign(atk.mod) + ' ' + RU.fmtRolls(dr.rolls) + RU.sign(atk.mod) + ' = ' + dr.total + ' ' + atk.type];
    // Savage Attacks (the half-orc, SRD 5.1): a melee critical rolls one of the weapon's dice once more
    if (crit && melee && att.savage && /d/.test(dice)) { var sv0 = D.roll('1' + String(dice).replace(/^\d*/, '')); dmg += sv0.total; parts.push('{o}savage +' + sv0.total + '{/}'); }
    // the class NPCs' riders (09-28): Rage's +2 on a STR blow; Enlarge's +1d4 (Reduce's -1d4); Ray of Enfeeblement halves a STR weapon's
    var strBlow = melee && !atk.finesse || (atk.finesse && att.abil && att.abil.str >= att.abil.dex && melee);
    if (att.conds.raging && strBlow) { dmg += att.conds.raging.dmg || 2; parts.push('{o}rage +' + (att.conds.raging.dmg || 2) + '{/}'); }
    if (att.conds.enlarged && !atk.spell) { var en = D.roll('1d4', { crit: crit }); dmg += att.conds.enlarged.down ? -en.total : en.total; parts.push((att.conds.enlarged.down ? '{g}reduced -' : '{o}enlarged +') + en.total + '{/}'); dmg = Math.max(1, dmg); }
    if (att.conds.enfeebled && strBlow && !atk.spell) { var cut0 = Math.ceil(dmg / 2); dmg -= cut0; parts.push('{g}enfeebled -' + cut0 + '{/}'); }
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
    // the riders land as their own kind of damage (09-28: the ochre jelly is immune to slashing, not to a smite): fire, radiant, a foe's extra
    var fire = 0, rad = 0, ext = 0, xtra = []; // (xtra: [n, type] riders of their own kind: a mark's psychic, a curse's necrotic)
    if (atk.flame && att.conds.ablaze && !atk.spell) { var fl = D.roll(atk.flame, { crit: crit }); fire = fl.total; parts.push('{o}flame ' + atk.flame + ' ' + RU.fmtRolls(fl.rolls) + ' = ' + fl.total + ' fire{/}'); }
    if (att.conds.divineFavor && !atk.spell) { var df = D.roll('1d4', { crit: crit }); rad += df.total; parts.push('{y}favor 1d4 [' + df.rolls.join(',') + '] radiant{/}'); }
    // the marks (09-28, js/grimoire.js): Hunter's Mark (+1d6 on a weapon's hit), Mirror's Gaze (+1d6 psychic on any of her hits), Bestow
    // Curse's +1d8 necrotic, Branding Smite's +2d6 radiant on the next weapon hit (and the struck one glows, seen)
    var mk = tgt.conds.marked;
    if (mk && mk.by === att.id && (mk.any || !atk.spell)) { var hm = D.roll('1d6', { crit: crit }); if (mk.type) xtra.push([hm.total, mk.type]); else dmg += hm.total; parts.push('{p}' + (mk.name || 'mark') + ' 1d6 [' + hm.rolls.join(',') + ']' + (mk.type ? ' ' + mk.type : '') + '{/}'); }
    if (tgt.conds.cursed && tgt.conds.cursed.by === att.id && tgt.conds.cursed.dmg) { var bc = D.roll('1d8', { crit: crit }); xtra.push([bc.total, 'necrotic']); parts.push('{p}curse 1d8 [' + bc.rolls.join(',') + '] necrotic{/}'); }
    if (att.conds.branding && !atk.spell) { var bs = D.roll(att.conds.branding.dice || '2d6', { crit: crit }); rad += bs.total; parts.push('{y}branding ' + (att.conds.branding.dice || '2d6') + ' [' + bs.rolls.join(',') + '] radiant{/}'); delete att.conds.branding; tgt.conds.branded = { by: att.id }; if (tgt.conds.invisible) delete tgt.conds.invisible; }
    // a foe's poisoned blade
    if (atk.extra) { var ex = D.roll(atk.extra, { crit: crit }); ext += ex.total; parts.push(atk.extra + ' ' + RU.fmtRolls(ex.rolls) + ' ' + atk.extraType); }
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
    if (att.cls === 'paladin' && melee && (!att.guest || att.classAI) && (att.slots || []).some(function (n) { return n > 0; })) {
      var opts = [];
      [1, 2, 3].forEach(function (lv) { if (att.slots[lv - 1] > 0) opts.push({ label: 'L' + lv + ' ' + Math.min(5, 1 + lv) + 'd8', value: lv }); });
      opts.push({ label: 'NO SMITE', value: 0 });
      this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : '{n}HIT{/}') + why], 300, cid);
      // the AI's paladin (09-28): the best slot on a critical; else the lowest, on one the blow alone won't drop and worth the slot
      var lv = byAI(att) ? (crit ? opts[opts.length - 2].value : (tgt.hp > dmg + 4 && tgt.maxhp >= 15 ? opts[0].value : 0)) : yield { prompt: { who: att, title: att.name + ': DIVINE SMITE?', lines: ['The blow lands' + (crit ? ' -- a critical: the smite dice double.' : '.')], opts: opts } };
      if (lv) {
        att.slots[lv - 1]--; D.sfx('magic');
        var sm = D.roll(Math.min(5, 1 + lv) + 'd8', { crit: crit }); rad += sm.total;
        parts.push('{y}smite ' + Math.min(5, 1 + lv) + 'd8 ' + RU.fmtRolls(sm.rolls) + ' = ' + sm.total + ' radiant{/}');
        FX.ring(tgt, 'gold', 30); FX.sparkle(tgt, 'gold', 16);
      }
    }
    // Uncanny Dodge: Vivian's reaction halves a hit from an attacker she can see
    if (tgt.cls === 'rogue' && tgt.lvl >= 5 && tgt.reaction > 0 && RU.canAct(tgt) && (!tgt.guest || tgt.classAI) && M16().sees(this, tgt, att)) {
      this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : '{n}HIT{/}') + why, parts.join('  ')], 300, cid);
      var ud = byAI(tgt) ? (dmg + fire + rad + ext >= 6) : yield { prompt: { who: tgt, title: tgt.name + ': UNCANNY DODGE?', lines: ['The blow would deal ' + (dmg + fire + rad + ext) + '. Halve it to ' + (Math.floor(dmg / 2) + Math.floor(fire / 2) + Math.floor(rad / 2) + Math.floor(ext / 2)) + '? (the reaction)'], opts: [{ label: 'DODGE IT', value: true }, { label: 'TAKE IT', value: false }] } };
      if (ud) { D.sfx('run'); tgt.reaction = 0; dmg = Math.floor(dmg / 2); fire = Math.floor(fire / 2); rad = Math.floor(rad / 2); ext = Math.floor(ext / 2); parts.push('{c}uncanny dodge: halved to ' + (dmg + fire + rad + ext) + '{/}'); }
    }
    // resistance to non-magical weapons (the grick): the weapon's own damage halved unless the weapon is magic
    // (the whole of it: the dice, the sneak, the martial advantage -- resistance halves the damage of that type, SRD; review 09-28 #10)
    if (tgt.resist && tgt.resist.indexOf('mundane') >= 0 && !atk.spell && !atk.magic && /bludgeoning|piercing|slashing/.test(atk.type)) {
      var cut = dmg - Math.floor(dmg / 2); dmg -= cut; parts.push('{g}-' + cut + ': it shrugs off plain steel{/}');
    }
    this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : '{n}HIT{/}') + why, parts.join('  ') + '  = {r}' + (dmg + fire + rad + ext + xtra.reduce(function (a, x) { return a + x[0]; }, 0)) + '{/}'], 300, cid);
    if (melee) FX.slash(tgt, crit ? D.PAL.ramps.gold[4] : null);
    if (fire) { FX.sparkle(tgt, 'fire', 12); this.hurt(tgt, fire, 'fire'); }
    if (rad && !tgt.dead) this.hurt(tgt, rad, 'radiant');
    if (ext && !tgt.dead) this.hurt(tgt, ext, atk.extraType || atk.type);
    for (var xi = 0; xi < xtra.length; xi++) if (!tgt.dead) this.hurt(tgt, xtra[xi][0], xtra[xi][1]);
    if (!tgt.dead) this.hurt(tgt, dmg, atk.type);
    if (o.onHit) o.onHit(tgt, crit); // (a spell attack's rider: js/grimoire.js)
    yield o.oa ? 18 : 26;
    // a reaction to the blow (09-28, js/grimoire.js): Hellish Rebuke from one who took it and can see who gave it
    if (D.magic.rebuke && !tgt.dead && tgt.hp > 0 && !att.dead) yield* D.magic.rebuke(this, tgt, att);
    // riders: the drow's poisoned bolt, the spider's venom
    if (!tgt.dead && tgt.hp > 0 && atk.poison && !tgt.conds.poisoned && !RU.immuneTo(tgt, 'poisoned')) {
      var sv = RU.save(tgt, 'con', atk.poison.dc);
      this.card(['{r}' + nameOf(tgt) + '{/}: CON save vs poison  ' + RU.saveText(sv) + ' vs DC ' + sv.dc + '  ' + (sv.ok ? '{n}SAVED{/}' : '{o}POISONED{/}')]);
      // (a poison that wears off, the ettercap's: a CON save at the end of each of its turns, magic.js endTurn; the drow's lasts the fight)
      if (!sv.ok) { D.sfx('poison'); tgt.conds.poisoned = atk.poison.repeat ? { save: 'con', dc: atk.poison.dc } : true; FX.sparkle(tgt, 'moss', 10); }
      yield 30;
    }
    // a grapple on the hit (the otyugh's tentacles): Medium or smaller, while it has a tentacle free; grappled and restrained
    if (atk.grapple && !tgt.dead && tgt.hp > 0 && (tgt.size || 1) <= 1 && !tgt.conds.restrained && !RU.immuneTo(tgt, 'grappled') && (att.holding || []).length < (atk.grapple.max || 1)) {
      tgt.conds.restrained = { dc: atk.grapple.dc, by: att.id, grapple: true };
      att.holding = (att.holding || []).concat([tgt]);
      D.sfx('poison'); FX.ring(tgt, 'bone', 26);
      this.card(['{r}' + nameOf(att) + '{/} has ' + nameOf(tgt) + ': {o}GRAPPLED and RESTRAINED{/}  {g}(escape DC ' + atk.grapple.dc + ', an action){/}']);
      yield 30;
      // a hold over the eyes (torchdark 09-28: the sheet todos): the cloaker's fold blinds the one it engulfs; the darkmantle's
      // crush blinds when it had advantage on the roll (SRD: it engulfs the head). Blind till the grip is broken (release)
      if (atk.blindHeld && !tgt.conds.blinded && (atk.blindHeld === 'always' || e.net > 0)) {
        tgt.conds.blinded = { by: att.id, held: true };
        this.card(['{r}' + nameOf(tgt) + '{/} is {o}BLINDED{/}: ' + (atk.blindHeld === 'always' ? 'folded inside it' : 'it is over his head') + ' -- nothing seen till the grip is broken.']);
        yield 24;
      }
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
    if (atk.prone && !tgt.dead && tgt.hp > 0 && !tgt.conds.prone && !tgt.noProne && !RU.immuneTo(tgt, 'prone')) {
      var ks = RU.save(tgt, 'str', atk.prone);
      this.card(['{r}' + nameOf(tgt) + '{/}: STR save  ' + RU.saveText(ks) + ' vs DC ' + ks.dc + '  ' + (ks.ok ? '{n}KEEPS HIS FEET{/}' : '{o}KNOCKED PRONE{/} {g}(half his move to rise){/}')]);
      if (!ks.ok) { tgt.conds.prone = true; D.sfx('hit'); }
      yield 24;
    }
    // the chuul's tentacles on one it holds: CON or poisoned, and paralyzed while the poison lasts (a CON save each turn)
    if (atk.paralyze && !tgt.dead && tgt.hp > 0 && !tgt.conds.paralyzed && !RU.immuneTo(tgt, 'paralyzed') && !RU.immuneTo(tgt, 'poisoned')) {
      var ps = RU.save(tgt, 'con', atk.paralyze.dc);
      this.card(['{r}' + nameOf(tgt) + '{/}: CON save  ' + RU.saveText(ps) + ' vs DC ' + ps.dc + '  ' + (ps.ok ? '{n}SAVED{/}' : '{p}POISONED and PARALYZED{/} {g}(a CON save at the end of each turn){/}')]);
      if (!ps.ok) { D.sfx('poison'); tgt.conds.poisoned = { paralysis: true }; tgt.conds.paralyzed = { save: 'con', dc: atk.paralyze.dc, by: att.id, poison: true }; FX.sparkle(tgt, 'moss', 12); }
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
  // a unit the AI runs (a foe, a guest, a hero on the bench): its reactions are decided, never asked (09-28, the class NPCs)
  function byAI(u) { return u.side !== 'party' || !!u.guest; }
  function M16() { return D.magic; }
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
      if (ty.why) FX.float(ty.why === 'immune' ? 'immune: ' + type : ty.why, u, ty.why === 'vulnerable' ? D.PAL.ramps.gold[4] : D.PAL.ramps.silver[5]); // (says to what: the jelly and a blade)
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
    if (u.traces) this.hitAtTraces = true; // (nothing shows now: from their next moves they run, or he turns to fight: ai.js turn)
    if (u.displacement) u.conds.displaceOff = true; // the cloak falters when a blow lands
    u.flash = 10;
    FX.float('-' + n, u, D.PAL.ramps.red[4]);
    if (u.conds.hidden) delete u.conds.hidden;
    if (u.hp <= 0 && (u.side === 'party' && !u.guest || u.npc) && u.feats && u.feats.relentless > 0) {
      // Relentless (the 8-bit game's own, js/battle.js: Lymen, once a day): the blow that would drop him leaves him at 1 (review 09-28 #3)
      // (a half-orc class NPC's Relentless Endurance too: js/classes.js)
      u.feats.relentless = 0; u.hp = 1; FX.ring(u, 'gold', 30); D.sfx('buff');
      this.card(['{y}' + u.name + ' refuses to fall!{/}  {g}(Relentless: once a day, at 1 HP){/}']);
      D.magic.concCheck(this, u, n);
      return;
    }
    if (u.hp <= 0) {
      u.anim = 'hurt'; u.animT = this.t;
      D.sfx(u.side === 'party' ? 'ko' : 'die');
      if (u.side === 'party') { u.ko = true; delete u.conds.ablaze; D.light.fell(this, u); this.card(['{r}' + u.name + ' goes down.{/}' + (D.light.torchAt(this, u.x, u.y) ? '  {g}The torch burns beside him.{/}' : '')]); }
      else { u.dead = true; u.deadT = this.t; this.card(['{y}The ' + shortName(u) + ' falls.{/}']); if (u.holding && u.holding.length) this.release(u); }
      if (u.conc) D.magic.endConc(this, u, 'down');
      // one who runs the moment the one in charge is down (the wheelwright, when Hask falls): gone up the stair at once, before
      // anyone can cut him down -- the 8-bit's foeBolt, certain (review 09-28 #11: the wheelwright quest hangs on his getting away)
      if (u.side === 'foe') { var self = this; this.units.forEach(function (w) { if (w.side === 'foe' && w.bolts && w.bolts === u.kind && !w.dead && w.hp > 0) { w.dead = true; w.fled = true; w.deadT = self.t; if (w.holding && w.holding.length) self.release(w); D.sfx('run'); self.card(['{r}' + w.name + '{/} drops what he was holding and runs for the stair. He is gone.']); } }); }
    } else D.magic.concCheck(this, u, n);
    if (D.magic.onHurt && u.hp > 0) D.magic.onHurt(this, u, n, type); // (a laughing one's save with advantage, a pattern broken: js/grimoire.js)
  };
  Battle.prototype.heal = function (u, n) {
    var was = u.hp;
    // Chill Touch (SRD 5.1): no hit points come back till the caster's next turn
    if (u.conds.noHeal) { FX.float('no healing', u, D.PAL.ramps.violet[4]); this.card(['{p}' + u.name + ' cannot be healed: the grave\'s hand is on them.{/}'], 240); return 0; }
    // Beacon of Hope (SRD 5.1): a heal on one under it is the most it could be (the caster's heal says so: o.max)
    if (u.conds.beacon && arguments[2] && arguments[2].max) n = arguments[2].max;
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
      var wd = it.weapon, two = (wd.props || []).indexOf('two-handed') >= 0, why = busy || (two && h.equip.shield ? 'two hands: the shield comes off first' : two && u.torch ? 'two hands: the torch goes down first' : '');
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
      if (sh) out.push({ kind: 'shieldon', id: sh.id, label: 'SHIELD ON: ' + this.itemName(sh.id), note: '', ok: !busy && !curTwo && !u.torch, why: busy || (curTwo ? 'the weapon takes both hands' : u.torch ? 'the torch is in that hand' : '') });
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
  var ITEM_OK = { heal: 1, revive: 1, antitoxin: 1, cure: 1, damage: 1, light: 1 };
  // a torch is lit as a bonus action by the Thief (Fast Hands), or by anyone if the seat's default is flipped (js/light.js LIGHT_COST)
  function torchFast(u) { return u.subclass === 'Thief' || D.light.LIGHT_COST === 'B'; }
  Battle.prototype.itemList = function (u) {
    var T = u.turn, roost = this.fight && this.fight.roost, self = this;
    return (this.inv || []).map(function (s) {
      var it = window.DS.DATA.items[s.id];
      if (!it || !it.use || !it.use.battle || !ITEM_OK[it.use.effect] || s.n <= 0) return null;
      if (roost && (it.use.effect === 'damage' || it.use.effect === 'light')) return { id: s.id, name: it.name, n: s.n, use: it.use, ok: false, why: 'the roost overhead: no fire' };
      if (it.use.effect === 'light') { // a torch (torchdark 09-28): a free hand, and the action (or the Thief's bonus)
        var cl = D.light.canLight(self, u), can = (torchFast(u) && T.bonus > 0) || (T.action > 0 && !T.attacksLeft);
        return { id: s.id, name: it.name, n: s.n, use: it.use, ok: cl.ok && can && !u.guest, why: !cl.ok ? cl.why : can ? '' : 'the action is spent', cost: torchFast(u) && T.bonus > 0 ? 'B' : 'A' };
      }
      return { id: s.id, name: it.name, n: s.n, use: it.use, ok: (u.subclass === 'Thief' && T.bonus > 0) || (T.action > 0 && !T.attacksLeft), why: T.action > 0 ? '' : 'the action is spent' };
    }).filter(Boolean);
  };
  Battle.prototype.itemTargetOK = function (u, id, w) {
    var use = window.DS.DATA.items[id].use;
    if (!w || w.dead) return false;
    if (use.effect === 'damage') return G.hostile(u, w) && w.hp > 0 && G.dist(u, w) <= 20 && G.los(u, w).clear;
    if (use.effect === 'light') return w === u;
    if (w.side !== u.side || (w !== u && G.dist(u, w) > 5)) return false;
    if (use.effect === 'revive') return w.hp <= 0;
    if (use.effect === 'heal') return w.hp < w.maxhp;
    return true;
  };
  Battle.prototype.useItem = function* (u, id, w) {
    var it = window.DS.DATA.items[id], use = it.use, s = this.inv.filter(function (x) { return x.id === id; })[0];
    if (((use.effect === 'light' && torchFast(u)) || u.subclass === 'Thief') && u.turn.bonus > 0) u.turn.bonus = 0; else u.turn.action = 0; // Fast Hands
    if (use.effect === 'light') { yield* D.light.lightTorch(this, u); yield 20; return; } // (lightTorch takes it from the pack)
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
    var foes = this.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && RU.canAct(w); }), self = this; // (whoever is against her: a rogue NPC hides from the four)
    var plain = foes.filter(function (w) { var l = G.los(w, u); return l.clear && !l.cover; });
    var mirror = foes.filter(function (w) { return w.mirrorEye && G.los(w, u).clear && D.magic.inMirror(self, w, u); }); // (the Mirror's eye: no hiding before it, in light)
    var r = D.d(20), total = r + u.stealth + (u.conds.pwt ? 10 : 0), top = Math.max.apply(null, foes.map(function (w) { return w.perception; }).concat([0]));
    if (mirror.length) {
      this.card(['{y}' + u.name + '{/} tries to hide, but the mirror on ' + mirror.map(shortName).join(' and ') + ' has her: {p}nothing hides in front of the Mirror\'s eye{/}.', '{g}Get behind her, or into the dark.{/}']);
    } else if (plain.length) {
      this.card(['{y}' + u.name + '{/} tries to hide, but the ' + plain.map(shortName).join(' and the ') + ' can see her plainly (no cover).', '{g}Put a stalagmite or a body between you first.{/}']);
    } else {
      var ok = total >= top && !u.conds.faerie; // (outlined in violet light: nowhere to hide)
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
