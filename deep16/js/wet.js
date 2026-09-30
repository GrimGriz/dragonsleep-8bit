/* DEEP16 — THE SETTLING: the wet as one grid (RULED 09-30, Griz: "make a grid identical to the Wet map that covers the landlord and
   the 3 pools, then have the triggers nearest the water for those fights put the group near (lead character on) the grid equivalent
   of the trigger square in the grid fight. Bucket to become a usable item near the landlord water or touch to the landlord himself.
   Trigger squares are still trigger squares on the grid, and if a player goes down 1-2 crawlers appear on the map the following
   round - for every round a player is down. Single character leaving the grid edge pulls the whole party back to 8-bit map, as if
   successful 'run' from 8-bit." His answers: "this is big special thing, only place the 'this is a crawler warren' danger really
   comes in" · "give the second puddle trigger an extra square of sensitivity" · the bucket "in pack and also show on the wheel where
   they use potions (same in grid, regardless of character that auto-picks it up by walking on that square). Telepath will be this
   build" · the landlord "only when damaged, or if character is in adjacent square more than 3 rounds" · "crawlers triggered, they
   better be GTFO... but reset the trigger tiles for the oozes if they haven't been killed". 09-30b, the crawlers: "Max of 2 per
   round. Mechanically, they'll permanently reduce down character HP by 2 every round. If damaged, ignore downed hero. Half normal
   movement speed. (we expect and encourage for this to be an exciting reload scenario in most cases)".

   The map and the fight: data/maps.js `wet`, data/fights.js `wet` (the triggers, the bucket's square, the pens). The canon:
   TarlynsPit/WarrensModule/crawler-warrens-DM.md §2 -- the herd passive while fed, "Blood and bodies rouse them ... they go for the
   downed creature first"; the landlord "speaks first, in the head, to whoever is nearest the water, and what it sends is a picture of
   a bucket"; fed, "it will tell them things -- in pictures -- about what comes down the stream". */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx, AI = D.ai, TR = D.traits, BP = D.Battle.prototype;
  var W = D.wet = {};
  var ID8 = { landlord: 'otyugh', jelly: 'ochrejelly', ooze: 'grayooze' }; // (the 8-bit game's ids, for the ending's XP)
  function on(B) { return !!(B && B.fight && B.fight.settling && B.wet); }
  function fl(B) { return (B.from && B.from.data && B.from.data.flags) || {}; }
  // the party on the wet floor: anyone of theirs who can bleed (not a summoned thing, not a familiar)
  function ours(B) { return B.units.filter(function (w) { return w.side === 'party' && !w.summon && !w.familiar && !w.dominated && !w.loose; }); }
  function downed(B) { return ours(B).filter(function (w) { return !w.left && !w.dead && w.hp <= 0; }); }
  function Nm(B, u) { return u.side === 'foe' ? (u.named ? B.shortName(u) : 'the ' + B.shortName(u)) : u.name; }
  function inSet(list, x, y) { return (list || []).some(function (p) { return p[0] === x && p[1] === y; }); }

  // ------------------------------------------------------------------ the fight as it walks in
  var enter0 = BP.enter;
  BP.enter = function () {
    var F0 = !this.o.fightDef && !this.o.npc && D.fight(this.o.fight || 'gallery');
    if (F0 && F0.settling) {
      // what is dead stays dead (the 8-bit flags, through the seam); the grid holds the wet's own creatures, not the 8-bit scene's
      // list -- the ending counts what it killed here (B.enemies8, js/embed.js)
      var f8 = (this.o.data && this.o.data.flags) || {}, gone = { landlord: f8.otyughDead, jelly: f8.jellyDead, ooze: f8.oozeDead };
      this.o.fightDef = Object.assign({}, F0, { foes: F0.foes.filter(function (f) { return !gone[f.wet]; }) });
      if (this.o.embed) this.o.embed = Object.assign({}, this.o.embed, { enemies: null, only: null });
    }
    enter0.apply(this, arguments);
    if (this.fight && this.fight.settling) W.setup(this);
  };
  W.setup = function (B) {
    var F = B.fight, f8 = fl(B), wake = (B.o.embed && B.o.embed.wake) || B.o.wake || null;
    B.wet = { round: 0, downAt: {}, beside: {}, spoke: !!f8.landlordSpoke, sleepers: {}, present: {}, crawlers: 0, bucket: null };
    B.flags8 = B.flags8 || {};
    var self = B;
    B.units.slice().forEach(function (u) {
      if (u.side !== 'foe') return;
      var role = { otyugh: 'landlord', jelly: 'jelly', ooze: 'ooze' }[u.id]; if (!role) return;
      u.wet = role; B.wet.present[role] = true;
      if (role === 'landlord') { u.bound = 'D'; if (f8.otyughFed) u.fed = true; } // (it keeps to its deep water under the fall)
      if (role === 'jelly') u.swims = true; // (it lives in the settling pool, and comes out of it)
      if (role === wake && !u.fed) return; // (the one whose square the lead stands on is awake)
      if (role === 'landlord') { u.dormant = true; return; } // (in sight, in its pool: it waits -- the table decides whether it is fought)
      // the ooze in its puddle, the jelly under the pool: not there at all till their squares are stepped on
      self.units.splice(self.units.indexOf(u), 1); B.wet.sleepers[role] = u;
    });
    // one of them where a hero stands (the lead on the ooze's own puddle): out onto the nearest free square
    B.units.forEach(function (u) { if (u.side === 'foe' && B.units.some(function (w) { return w !== u && w.side === 'party' && G.dist(u, w) === 0; })) W.shift(B, u); });
    // the bucket on its square (the 8-bit's (13, 5)): unless the party carries it, or the landlord has had it
    var has = (B.inv || []).some(function (s) { return s.id === 'bucket' && s.n > 0; });
    if (!has && !f8.otyughFed && F.bucket) W.layBucket(B, F.bucket);
    var woke = B.units.filter(function (u) { return u.wet === wake; })[0];
    if (woke) B.card(['{r}' + W.WAKE[wake] + '{/}'], 360);
  };
  W.WAKE = { landlord: 'The water under the fall heaves: the landlord rises, all eye-stalk and tentacle.', jelly: 'Something ochre heaves up out of the settling pool.', ooze: 'The puddle underfoot moves.' };
  // the nearest square it may stand on, free of everyone
  W.shift = function (B, u) {
    var best = null, bd = Infinity, x0 = u.x, y0 = u.y;
    for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) {
      if (!G.canStand(u, x, y)) continue;
      var d = Math.max(Math.abs(x - x0), Math.abs(y - y0)) + 0.01 * Math.hypot(x - x0, y - y0);
      if (d < bd) { bd = d; best = [x, y]; }
    }
    if (best) { u.x = best[0]; u.y = best[1]; }
  };

  // ------------------------------------------------------------------ waking
  W.wake = function (B, u, why) {
    if (!u || !u.dormant && !B.wet.sleepers[u.wet]) return;
    var role = u.wet;
    if (B.wet.sleepers[role] === u) { // back into the fight: on its square (or the nearest free one), dealt into the initiative
      delete B.wet.sleepers[role];
      B.units.push(u); if (!G.canStand(u, u.x, u.y)) W.shift(B, u);
      u.initRoll = D.d(20) + u.init;
      var at = 0; while (at < B.order.length && (B.order[at].initRoll > u.initRoll || (B.order[at].initRoll === u.initRoll && B.order[at].abil.dex >= u.abil.dex))) at++;
      B.order.splice(at, 0, u);
      u.anim = 'idle'; u.animT = B.t; u.reaction = 1;
    }
    u.dormant = false; u.fed = role === 'landlord' && why === 'fed' ? true : u.fed && why !== 'hurt';
    if (why === 'hurt') u.fed = false; // (struck, fed or not, it fights)
    FX.sparkle(u, 'moss', 20); D.sfx('encounter');
    B.card(['{r}' + W.WAKE[role] + '{/}' + (why === 'patience' ? '  {g}(you stood at its edge too long){/}' : why === 'hurt' ? '  {g}(struck, it wakes){/}' : '')], 360);
    if (B.focus) B.focus(u);
  };
  // struck, it wakes; a crawler struck forgets the downed (09-30b: "If damaged, ignore downed hero")
  var hurt0 = BP.hurt;
  BP.hurt = function (u, n, type) {
    var hp0 = u.hp, r = hurt0.apply(this, arguments);
    if (on(this) && u.hp < hp0) {
      if (u.dormant && u.side === 'foe' && u.hp > 0) W.wake(this, u, 'hurt');
      if (u.wetCrawler) u.blooded = true;
    }
    return r;
  };

  // ------------------------------------------------------------------ the squares: the sleepers' triggers, the picture, the bucket
  var move0 = BP.moveAlong;
  BP.moveAlong = function* (u, path, o) {
    yield* move0.apply(this, arguments);
    if (!on(this) || u.side !== 'party' || u.flies || u.summon || u.familiar) return;
    var sq = (path || []).map(function (p) { return [p[0], p[1]]; }).concat([[u.x, u.y]]);
    yield* W.stepped(this, u, sq);
  };
  W.stepped = function* (B, u, sq) {
    var T = B.fight.triggers || {}, self = B;
    ['jelly', 'ooze'].forEach(function (role) {
      var s = self.wet.sleepers[role];
      if (s && sq.some(function (p) { return inSet(T[role], p[0], p[1]); })) W.wake(self, s, 'stepped');
    });
    if (!B.wet.spoke && sq.some(function (p) { return inSet(T.picture, p[0], p[1]); })) yield* W.speak(B, u);
    var bk = B.wet.bucket;
    if (bk && sq.some(function (p) { return p[0] === bk.at[0] && p[1] === bk.at[1]; })) W.takeBucket(B, u);
  };

  // ------------------------------------------------------------------ the landlord: it waits in its pool, and speaks in pictures
  // standing beside it counts, round by round, one hero at a time; the fourth round beside it wakes it (09-30: "more than 3 rounds")
  W.landlordWaits = function* (B, u) {
    var near = ours(B).filter(function (w) { return !w.left && w.hp > 0 && G.dist(u, w) <= 5; }), bs = B.wet.beside, woke = false;
    ours(B).forEach(function (w) { if (near.indexOf(w) < 0) delete bs[w.id]; });
    near.forEach(function (w) { bs[w.id] = (bs[w.id] || 0) + 1; if (bs[w.id] > 3 && !u.fed) woke = true; });
    if (near.length && !B.wet.spoke) yield* W.speak(B, near[0]);
    if (woke) { W.wake(B, u, 'patience'); return false; } // (and its turn goes on: the tentacles)
    B.card(['{g}' + (u.fed ? 'The landlord settles in its pool, fed.' : near.length ? 'The landlord watches ' + near.map(function (w) { return w.name; }).join(', ') + ' from the water.' : 'Something watches from the deep water under the fall.') + '{/}'], 160);
    yield 12;
    return true;
  };
  // the first time: a picture of a bucket, in the head of whoever is nearest the water (the canon)
  W.speak = function* (B, w) {
    B.wet.spoke = true; B.flags8.landlordSpoke = 1;
    D.sfx('magic');
    yield { scene: { draw: W.picture('bucket'), frames: 200 } };
    B.card(['{p}A picture, not a word, in ' + w.name + '\'s head: a bucket, lowered on a rope. It is hungry, and it is patient.{/}'], 420);
    yield 20;
  };

  // ------------------------------------------------------------------ the bucket: on its square, picked up by walking onto it
  W.layBucket = function (B, at) {
    var sq = G.map.at(at[0], at[1]); if (!sq) return;
    var p = { kind: 'bucket', sq: sq, depth: at[0] + at[1] + 0.45, gz: 0, draw: function (ctx) {
      var iso = D.iso, c = iso.center(at[0], at[1], 0), s = iso.toScreen(c.x, c.y), x = Math.round(s.x), y = Math.round(s.y);
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 5, y - 9, 10, 9);                         // the staves
      ctx.fillStyle = '#6b4a2c'; ctx.fillRect(x - 4, y - 9, 8, 8);
      ctx.fillStyle = '#8a6a44'; ctx.fillRect(x - 4, y - 9, 2, 8); ctx.fillRect(x + 1, y - 9, 1, 8);
      ctx.fillStyle = '#9c9c9c'; ctx.fillRect(x - 5, y - 7, 10, 1); ctx.fillRect(x - 5, y - 3, 10, 1); // the hoops
      ctx.fillStyle = '#1a120c'; ctx.fillRect(x - 3, y - 10, 6, 1);                          // the mouth, dark
      ctx.strokeStyle = '#7a6a54'; ctx.beginPath(); ctx.arc(x, y - 10, 5, Math.PI, 0); ctx.stroke(); // the rope handle
    } };
    G.map.props.push(p);
    B.wet.bucket = { at: at, prop: p };
  };
  W.takeBucket = function (B, u) {
    var bk = B.wet.bucket; if (!bk) return;
    B.wet.bucket = null;
    var i = G.map.props.indexOf(bk.prop); if (i >= 0) G.map.props.splice(i, 1);
    var s = (B.inv || []).filter(function (x) { return x.id === 'bucket'; })[0];
    if (s) s.n++; else (B.inv = B.inv || []).push({ id: 'bucket', n: 1 });
    D.sfx('popup');
    B.card(['{y}' + u.name + '{/} picks up the bucket: the deep station\'s, rope and all.  {g}(ITEM: USE it beside the deep water, or on the landlord){/}'], 360);
  };
  // USE BUCKET: beside the deep water, or touching the landlord -- fed, it does not fight, and its pictures play
  function landlordOf(B) { return B.units.filter(function (w) { return w.wet === 'landlord' && !w.dead && w.hp > 0; })[0] || null; }
  function besideDeep(u) { for (var dy = -1; dy <= u.size; dy++) for (var dx = -1; dx <= u.size; dx++) { var s = G.map.at(u.x + dx, u.y + dy); if (s && s.ch === 'D') return true; } return false; }
  var itemOK0 = BP.itemTargetOK;
  BP.itemTargetOK = function (u, id, w) { if (id === 'bucket') return w === u; return itemOK0.apply(this, arguments); };
  var itemList0 = BP.itemList;
  BP.itemList = function (u) {
    var out = itemList0.apply(this, arguments), L = landlordOf(this);
    out.forEach(function (e) { if (e.id !== 'bucket' || !e.ok) return; if (!(L && G.dist(u, L) <= 5) && !besideDeep(u)) { e.ok = false; e.why = 'nothing here takes it: the deep water under the fall'; } });
    return out;
  };
  var useItem0 = BP.useItem;
  BP.useItem = function* (u, id, w) {
    if (id !== 'bucket') { yield* useItem0.apply(this, arguments); return; }
    var L = landlordOf(this), s = this.inv.filter(function (x) { return x.id === 'bucket'; })[0];
    u.turn.action = 0; if (s) s.n--;
    D.sfx('splash'); FX.sparkle(L || u, 'moss', 16);
    this.card(['{y}' + u.name + '{/} lowers the bucket into the deep water. ' + (L ? 'The landlord takes it, and settles.' : 'Something below takes it.')], 360);
    this.flags8.otyughFed = 1; this.flags8['heard:r-stream'] = 1;
    if (L) { L.fed = true; L.dormant = true; if (L.holding && L.holding.length) this.release(L); }
    yield 20;
    // fed, it tells them things in pictures: what comes down the stream (the canon's crook upstream)
    D.sfx('magic');
    var pics = ['fall', 'crook', 'clackers', 'bats'];
    for (var k = 0; k < pics.length; k++) yield { scene: { draw: W.picture(pics[k]), frames: 150 } };
    this.card(['{p}Pictures, one after another, in ' + u.name + '\'s head: the stream coming down out of the hills; a cave of pale fungus and still water; hooked things clacking in the dark; and a chimney full of wings.{/}'], 480);
    yield 30;
  };

  // ------------------------------------------------------------------ the herd: blood on the stone
  // each new round (the first turn's end of it: the battle's per-turn wave()), for anyone who has been down since an earlier round,
  // one or two crawlers come out of the pen nearest the downed -- two at most, however many are down
  var wave0 = BP.wave;
  BP.wave = function* () {
    yield* wave0.apply(this, arguments);
    if (!on(this)) return;
    var P = this.wet, r = this.round;
    ours(this).forEach(function (w) { if (!w.left && !w.dead && w.hp <= 0) { if (P.downAt[w.id] == null) P.downAt[w.id] = r; } else delete P.downAt[w.id]; });
    if (P.round === r) return;
    P.round = r;
    var long = downed(this).filter(function (w) { return P.downAt[w.id] < r; });
    if (!long.length) return;
    var n = Math.min(2, D.d(2)), got = 0;
    for (var i = 0; i < n; i++) if (W.crawlerOut(this, long[0])) got++;
    if (got) { D.sfx('encounter'); this.card(['{r}Blood on the stone. ' + (got > 1 ? 'Two crawlers come' : 'A crawler comes') + ' out of the herd, for ' + long[0].name + '.{/}  {g}(a round they are down, the herd comes: get them up, or get out){/}'], 420); yield 40; }
  };
  W.crawlerOut = function (B, prey) {
    var pens = (B.fight.pens || []).slice().sort(function (a, b) { return Math.hypot(a[0] - prey.x, a[1] - prey.y) - Math.hypot(b[0] - prey.x, b[1] - prey.y); });
    var n = ++B.wet.crawlers, u = B.makeFoe({ id: 'crawler' + n, kind: 'crawler', at: [0, 0] });
    for (var pi = 0; pi < pens.length; pi++) {
      var pen = pens[pi], best = null, bd = Infinity;
      for (var y = pen[1] - 3; y <= pen[1] + 3; y++) for (var x = pen[0] - 3; x <= pen[0] + 3; x++) {
        if (!G.canStand(u, x, y)) continue;
        var d = Math.hypot(x + 0.5 - pen[0], y + 0.5 - pen[1]);
        if (d < bd) { bd = d; best = [x, y]; }
      }
      if (best) {
        u.x = best[0]; u.y = best[1]; u.facing = 0; u.anim = 'idle'; u.animT = B.t; u.reaction = 1;
        u.speed = Math.floor((u.speed || 30) / 2); // (09-30b: "Half normal movement speed")
        u.wetCrawler = true;
        B.units.push(u);
        u.initRoll = D.d(20) + u.init;
        var at = 0; while (at < B.order.length && (B.order[at].initRoll > u.initRoll || (B.order[at].initRoll === u.initRoll && B.order[at].abil.dex >= u.abil.dex))) at++;
        B.order.splice(at, 0, u);
        FX.sparkle(u, 'moss', 16);
        return true;
      }
    }
    return false;
  };
  // a crawler's turn: to the downed first, and feed -- 2 of his HP maximum, for good (09-30b); struck, it forgets them and fights
  W.crawlerTurn = function* (B, u) {
    if (u.blooded) return false;
    var prey = downed(B).sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
    if (!prey) return false;
    var T = u.turn;
    if (G.dist(u, prey) > 5) yield* AI.walkTo(B, u, AI.approach(u, prey, G.reach(u, T.move), 5));
    if (u.dead || u.hp <= 0) return true;
    if (G.dist(u, prey) <= 5 && prey.hp <= 0 && !prey.left) {
      T.action = 0; u.facing = B.faceTo(u, prey); u.anim = 'attack'; u.animT = B.t;
      var cut = Math.min(2, Math.max(0, prey.maxhp - 1));
      prey.maxhp -= cut; prey.drained = (prey.drained || 0) + cut;
      D.sfx('hit'); FX.slash(prey, D.PAL.ramps.red[4]);
      B.card(['{r}The crawler feeds on ' + prey.name + '{/}: {o}-' + cut + ' HP maximum, for good{/}  {g}(' + prey.maxhp + ' now; ' + prey.drained + ' taken){/}'], 300);
      yield 26; u.anim = 'idle';
    } else B.card(['{g}The crawler drags itself toward ' + prey.name + '.{/}'], 160);
    return true;
  };
  var tturn0 = TR.turn;
  TR.turn = function* (B, u) {
    if (on(B) && u.dormant) return yield* W.landlordWaits(B, u);
    if (on(B) && u.wetCrawler && (yield* W.crawlerTurn(B, u))) return true;
    return tturn0 ? yield* tturn0(B, u) : false;
  };

  // ------------------------------------------------------------------ the end: one out takes them all; quiet, or won; what died, for the 8-bit
  var over0 = BP.over;
  BP.over = function () {
    var o = over0.apply(this, arguments);
    if (!on(this) || o === 'lost' || o === 'pyro' || o === 'roost') return o;
    if (this.fight.oneLeavesAll && ours(this).some(function (w) { return w.left; })) return 'escaped';
    var awake = this.units.filter(function (w) { return w.side === 'foe' && !w.dead && w.hp > 0 && !w.dormant && !w.ethereal; });
    if (awake.length || downed(this).length) return null; // (a hero down: the herd is coming -- nothing is over)
    return W.killed(this).length ? 'won' : 'quiet';
  };
  // the 8-bit game's ids of what died here: the three by name, each crawler
  W.killed = function (B) {
    var out = [];
    Object.keys(ID8).forEach(function (role) {
      if (!B.wet.present[role] || B.wet.sleepers[role]) return;
      var alive = B.units.some(function (w) { return w.side === 'foe' && (w.wet === role || (role === 'jelly' && w.kind === 'ochrejelly')) && !w.dead && w.hp > 0; });
      if (!alive) out.push(ID8[role]);
    });
    B.units.forEach(function (w) { if (w.wetCrawler && (w.dead || w.hp <= 0) && !w.fled) out.push('crawler'); });
    return out;
  };
  var finish0 = BP.finish;
  BP.finish = function* (o) {
    if (on(this)) {
      var k = W.killed(this), F8 = this.flags8;
      if (k.indexOf('otyugh') >= 0) F8.otyughDead = 1;
      if (k.indexOf('ochrejelly') >= 0) F8.jellyDead = 1;
      if (k.indexOf('grayooze') >= 0) F8.oozeDead = 1;
      this.enemies8 = o === 'won' ? k : null;
      if (o === 'quiet') {
        this.result = 'escaped'; D.music('victory'); yield 30;
        this.card(['{y}THE WET GOES QUIET.{/}', D.keys('{g}' + (this.o.embed ? 'E to go on' : this.o.onDone ? 'E back to the ladder' : 'E fight again') + ' · M the menu{/}')], 1e9);
        return;
      }
    }
    yield* finish0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ the pictures (the telepathy: screen effects, not a text box)
  // each drawn small (96 x 72) in a few colours and blown up soft-edged, swaying, the landlord's eye behind it
  var PAL = { bg: '#0c0a10', ink: '#1a2420', murk: '#2c3a30', sick: '#6a8a4a', pale: '#b8c8a0', wood: '#6b4a2c', woodL: '#8a6a44', rope: '#9a8a6a', water: '#2a4458', waterL: '#5a8aa0', bone: '#d8d0b8', fungus: '#c8b8d8', fungusD: '#7a6a90', eye: '#e8d060' };
  W.picture = function (kind) {
    var cv = document.createElement('canvas'); cv.width = 96; cv.height = 72;
    var c = cv.getContext('2d');
    return function (ctx, t, WW, HH) {
      c.fillStyle = PAL.bg; c.fillRect(0, 0, 96, 72);
      (DRAW[kind] || DRAW.bucket)(c, t);
      // the landlord's one eye, behind the picture, opening and closing
      var blink = Math.abs(Math.sin(t / 40)), ey = 8 + Math.round(2 * Math.sin(t / 23));
      c.globalAlpha = 0.35; c.fillStyle = PAL.eye; c.fillRect(44, ey, 8, Math.max(1, Math.round(4 * blink))); c.fillStyle = PAL.ink; c.fillRect(47, ey, 2, Math.max(1, Math.round(4 * blink))); c.globalAlpha = 1;
      ctx.fillStyle = 'rgba(6,8,6,0.96)'; ctx.fillRect(0, 0, WW, HH);
      var fade = Math.min(1, t / 25), sway = Math.sin(t / 17) * 3, k = Math.min(WW / 96, HH / 72) * 0.8;
      ctx.save(); ctx.globalAlpha = fade; ctx.imageSmoothingEnabled = false;
      ctx.translate(WW / 2 + sway, HH / 2 - 6); ctx.scale(k * (1 + 0.02 * Math.sin(t / 11)), k);
      ctx.drawImage(cv, -48, -36);
      ctx.restore();
      var g = ctx.createRadialGradient(WW / 2, HH / 2, Math.min(WW, HH) * 0.2, WW / 2, HH / 2, Math.max(WW, HH) * 0.62);
      g.addColorStop(0, 'rgba(40,60,30,0)'); g.addColorStop(1, 'rgba(10,20,8,0.92)'); ctx.fillStyle = g; ctx.fillRect(0, 0, WW, HH);
    };
  };
  function drop(c, x, y, t, speed, col) { var yy = y + ((t * speed) % 30); c.fillStyle = col; c.fillRect(x, yy, 1, 2); }
  var DRAW = {
    // hungry: a bucket, lowered on a rope, dripping
    bucket: function (c, t) {
      var low = 18 + Math.round(6 * Math.sin(t / 30)), x = 40 + Math.round(3 * Math.sin(t / 19));
      c.fillStyle = PAL.rope; c.fillRect(x + 7, 0, 1, low);
      c.fillStyle = PAL.wood; c.fillRect(x, low, 16, 18); c.fillStyle = PAL.woodL; for (var i = 1; i < 16; i += 4) c.fillRect(x + i, low, 1, 18);
      c.fillStyle = PAL.rope; c.fillRect(x - 1, low + 4, 18, 1); c.fillRect(x - 1, low + 13, 18, 1);
      c.fillStyle = PAL.ink; c.fillRect(x + 1, low - 1, 14, 2);
      c.fillStyle = PAL.bone; c.fillRect(x + 3, low - 3, 3, 2); c.fillRect(x + 9, low - 2, 4, 1); // what's in it
      drop(c, x + 4, low + 18, t, 0.7, PAL.sick); drop(c, x + 11, low + 18, t + 13, 0.9, PAL.sick);
      c.fillStyle = PAL.water; c.fillRect(0, 62, 96, 10); c.fillStyle = PAL.waterL; for (var j = 0; j < 96; j += 7) c.fillRect((j + Math.round(t / 4)) % 96, 63, 3, 1);
    },
    // fed: the stream comes down the fall with what the hills send it
    fall: function (c, t) {
      c.fillStyle = PAL.murk; c.fillRect(0, 0, 30, 72); c.fillRect(66, 0, 30, 72);
      c.fillStyle = PAL.water; c.fillRect(30, 0, 36, 72);
      c.fillStyle = PAL.waterL; for (var i = 0; i < 12; i++) c.fillRect(32 + (i * 7) % 32, (i * 13 + t) % 72, 1, 6);
      var things = [[PAL.bone, 5, 2], [PAL.wood, 4, 4], [PAL.bone, 2, 6], [PAL.sick, 6, 3]];
      things.forEach(function (th, k) { var y = (t * 0.8 + k * 19) % 80 - 8; c.fillStyle = th[0]; c.fillRect(36 + k * 6, y, th[1], th[2]); });
    },
    // the crook: a cave of pale fungus over still water
    crook: function (c, t) {
      c.fillStyle = PAL.murk; c.fillRect(0, 0, 96, 40);
      c.fillStyle = PAL.water; c.fillRect(0, 50, 96, 22); c.fillStyle = PAL.waterL; c.fillRect((t >> 2) % 96, 56, 6, 1);
      [[14, 30, 12], [34, 22, 16], [60, 28, 12], [80, 34, 9]].forEach(function (f, i) {
        c.fillStyle = PAL.fungusD; c.fillRect(f[0] + f[2] / 2 - 1, f[1], 3, 50 - f[1]);
        c.fillStyle = PAL.fungus; c.fillRect(f[0], f[1] - 4 + Math.round(Math.sin(t / 25 + i)), f[2], 5);
        c.fillStyle = PAL.pale; c.fillRect(f[0] + 2, f[1] - 4 + Math.round(Math.sin(t / 25 + i)), f[2] - 4, 1);
      });
    },
    // hooked things in the dark, clacking (the canon's hook horrors; nothing named)
    clackers: function (c, t) {
      [[26, 30], [62, 34]].forEach(function (p, i) {
        var open = ((t >> 3) + i) % 4 < 2 ? 2 : 0;
        c.fillStyle = PAL.murk; c.fillRect(p[0], p[1], 12, 26); c.fillRect(p[0] + 2, p[1] - 8, 8, 9);
        c.fillStyle = PAL.pale; c.fillRect(p[0] - 5 - open, p[1] + 2, 5, 2); c.fillRect(p[0] - 5 - open, p[1] + 2, 2, 7); c.fillRect(p[0] + 12 + open, p[1] + 2, 5, 2); c.fillRect(p[0] + 15 + open, p[1] + 2, 2, 7);
        c.fillStyle = PAL.eye; c.fillRect(p[0] + 4, p[1] - 5, 1, 1); c.fillRect(p[0] + 7, p[1] - 5, 1, 1);
        if (open) { c.fillStyle = PAL.bone; c.fillRect(p[0] - 9, p[1] - 2, 2, 1); c.fillRect(p[0] + 20, p[1] - 2, 2, 1); }
      });
    },
    // a chimney full of wings
    bats: function (c, t) {
      c.fillStyle = PAL.murk; c.fillRect(0, 0, 38, 72); c.fillRect(58, 0, 38, 72);
      c.fillStyle = PAL.ink; c.fillRect(38, 0, 20, 72);
      for (var i = 0; i < 18; i++) { var y = 72 - ((t * (1 + (i % 3) * 0.4) + i * 11) % 90), x = 40 + (i * 5) % 16, f = ((t >> 2) + i) % 2; c.fillStyle = PAL.pale; c.fillRect(x - 2, y - f, 2, 1); c.fillRect(x + 1, y - f, 2, 1); c.fillRect(x, y, 1, 1); }
    }
  };
})();
