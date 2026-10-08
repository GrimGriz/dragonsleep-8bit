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
  var ID8 = { landlord: 'otyugh', jelly: 'ochrejelly', poolooze: 'grayooze', harness: 'crawler' }; // (the 8-bit game's ids, for the ending's XP; harness: the deep-rate crawler roused at its cradle, 09-30g)
  var FLAG8 = { landlord: 'otyughDead', jelly: 'jellyDead', poolooze: 'poolOozeDead' }; // (and their flags: the dead stay dead)
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
      var f8 = (this.o.data && this.o.data.flags) || {}, gone = {}; Object.keys(FLAG8).forEach(function (r) { gone[r] = f8[FLAG8[r]]; });
      if (f8.otyughFed) gone.landlord = true; // (fed, it is under the water for good: not on the grid -- RULED 09-30g)
      // a deep-rate crawler roused at its cradle (the 8-bit's S.deepCradle, 09-30g: "if player error makes a whip, start your combat"): awake, at its harness
      var hz = this.o.embed && this.o.embed.harness, foes0 = F0.foes.concat(hz ? [{ id: 'harness', kind: 'crawler', at: hz, wet: 'harness' }] : []);
      // the fight's squares are the 8-bit map's; the grid is turned (RULED 09-30b: counter-clockwise; data/maps.js wet from8)
      var c = (D.MAPS[F0.map] && D.MAPS[F0.map].from8) || function (x, y) { return [x, y]; }, cl = function (l) { return (l || []).map(function (p) { return c(p[0], p[1]); }); };
      // each sleeper's spots, and the 3 x 3 round each (the 8-bit's squares, turned); the picture's squares as they are
      var T1 = { picture: cl(F0.picture) }, ring = function (l) { var o = [], seen = {}; (l || []).forEach(function (p) { for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var k = (p[0] + dx) + ',' + (p[1] + dy); if (!seen[k]) { seen[k] = 1; o.push([p[0] + dx, p[1] + dy]); } } }); return o; };
      Object.keys(F0.spots || {}).forEach(function (k) { T1[k] = cl(ring(F0.spots[k])); });
      this.o.fightDef = Object.assign({}, F0, {
        foes: foes0.filter(function (f) { return !gone[f.wet]; }).map(function (f) { return Object.assign({}, f, { at: c(f.at[0], f.at[1], (D.FOES[f.kind] || {}).size || 1) }); }),
        triggers: T1, entrances: cl(F0.entrances), bucket: F0.bucket ? c(F0.bucket[0], F0.bucket[1]) : null });
      if (this.o.embed) this.o.embed = Object.assign({}, this.o.embed, { enemies: null, only: null, at: this.o.embed.at ? c(this.o.embed.at[0], this.o.embed.at[1]) : null });
    }
    enter0.apply(this, arguments);
    if (this.fight && this.fight.settling) W.setup(this);
  };
  W.setup = function (B) {
    var F = B.fight, f8 = fl(B), wake = (B.o.embed && B.o.embed.wake) || B.o.wake || null;
    B.wet = { round: 0, downAt: {}, beside: {}, spoke: !!f8.landlordSpoke, sleepers: {}, present: {}, sunk: {}, crawlers: 0, bucket: null, bucketBy: null, speakFirst: null, purge: null };
    B.flags8 = B.flags8 || {};
    W.loadPictures(); // his paintings, fetched now so they are in before the landlord sends one
    var self = B;
    B.units.slice().forEach(function (u) {
      if (u.side !== 'foe') return;
      var role = { otyugh: 'landlord', jelly: 'jelly', poolooze: 'poolooze', harness: 'harness' }[u.id]; if (!role) return;
      u.wet = role; B.wet.present[role] = true;
      if (role === 'landlord') { u.bound = 'D'; if (f8.otyughFed) u.fed = true; } // (it keeps to its deep water under the fall)
      if (role === 'jelly') u.swims = true; // (it lives in the settling pool, and comes out of it)
      if (role === wake && !u.fed) return; // (the one whose square the lead stands on is awake)
      if (role === 'landlord') { u.dormant = true; return; } // (in sight, in its pool: it waits -- the table decides whether it is fought)
      // the ooze in its puddle at the pool's edge, the jelly under the pool: not there at all till their squares are stepped on
      self.units.splice(self.units.indexOf(u), 1); B.wet.sleepers[role] = u;
    });
    // the roused crawler off its cradle (a timber crib: no square to stand on) onto the nearest free one
    B.units.forEach(function (u) { if (u.wet === 'harness' && !G.canStand(u, u.x, u.y)) W.shift(B, u); });
    // one of them where a hero stands (the lead on the pool ooze's own puddle): out onto the nearest free square
    B.units.forEach(function (u) { if (u.side === 'foe' && B.units.some(function (w) { return w !== u && w.side === 'party' && G.dist(u, w) === 0; })) W.shift(B, u); });
    // the milker on the square the party worked the cradle from (the lead's), the rest beside; touched, stiff with the poison (the crawler's own
    // feelers: poisoned, and paralyzed while it lasts, a CON save each turn)
    var E = B.o.embed || {}, mk = E.milker && ours(B).filter(function (w) { return w.id === E.milker; })[0], ld = ours(B)[0];
    if (mk && ld && ld !== mk) { var sx = ld.x, sy = ld.y; ld.x = mk.x; ld.y = mk.y; mk.x = sx; mk.y = sy; }
    if (mk && E.touched) { mk.conds.poisoned = { paralysis: true }; mk.conds.paralyzed = { save: 'con', dc: 13, by: 'harness', poison: true }; }
    // the bucket on its square (the 8-bit's (3, 7), by the stair since 10-08): unless the party carries it, or the landlord has had it. Carried, it is in one hand:
    // whoever took it up (the 8-bit's lead at the station, or whoever walked onto it here), else the lead (RULED 09-30g, Griz: "Only the
    // character that picked up the bucket should be able to use it as an item")
    var has = (B.inv || []).some(function (s) { return s.id === 'bucket' && s.n > 0; });
    if (F.bucket) W.layCrate(B, F.bucket); // (the deep station's crate under the bucket -- 10-04, Griz: "a visible draw on the grid")
    if (B.map && B.map.def && B.map.def.lampAt) W.layLamp(B, B.map.def.lampAt); // (its lamp on a post beside the crate, the map's light on that square -- 10-04)
    if (B.map && B.map.def && B.map.def.doors) W.layStair(B, B.map.def.doors); // (the stair up on its squares -- 10-08)
    if (!has && !f8.otyughFed && F.bucket) W.layBucket(B, F.bucket);
    if (has) { var cw = ours(B).filter(function (w) { return w.id === f8.bucketBy && w.hp > 0; })[0] || ours(B).filter(function (w) { return w.hp > 0; })[0]; if (cw) { B.wet.bucketBy = cw.id; B.flags8.bucketBy = cw.id; } }
    // in by the rim (the 8-bit's picture squares, 09-30g: "the 8-bit landlord trigger should pull them into the grid area at the trigger spot"):
    // the landlord asleep in its water, and its picture before anyone moves
    if (wake === 'rim' && !B.wet.spoke) B.wet.speakFirst = ours(B)[0] || null;
    var woke = B.units.filter(function (u) { return u.wet === wake; })[0];
    if (woke) B.card(['{r}' + W.WAKE[wake] + '{/}'], 360);
    // the door `deep16/?fight=wet&station` (his eye on the deep station's props, 10-08): the lead beside the crate, and the first turn's
    // camera on the crate and its lamp (BP.focus below) -- not the party's walk-in at the far end of the map
    if (/[?&]station\b/.test(location.search) && F.bucket) {
      var L = ours(B)[0], spot = [[2, 0], [1, 1], [2, 1], [0, 1]].map(function (o) { return [F.bucket[0] + o[0], F.bucket[1] + o[1]]; }).filter(function (q) { var s = G.map.at(q[0], q[1]); return s && s.walk && !G.occupant(q[0], q[1]); })[0];
      if (L && spot) { L.x = spot[0]; L.y = spot[1]; G.map.sorted = null; } // (beside it on the screen, clear of the crate and the lantern)
      B.wet.station = F.bucket.slice();
    }
  };
  var focus0 = BP.focus;
  BP.focus = function (u) {
    var st = on(this) && this.wet.station; if (!st) return focus0.apply(this, arguments);
    this.wet.station = null; D.iso.lookAt(st[0] + 1, st[1], 0); D.iso.zoom = 2;
  };
  W.WAKE = { landlord: 'The water under the fall heaves: the landlord rises, all eye-stalk and tentacle.', jelly: 'Something ochre heaves up out of the settling pool.', poolooze: 'The puddle at the pool\'s edge moves.', harness: 'The crawler tears loose of its harness.' };
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
    B.card(['{r}' + W.WAKE[role] + '{/}' + (why === 'patience' ? '  {g}(you stood at its edge too long){/}' : why === 'hurt' ? '  {g}(struck, it wakes){/}' : why === 'rise' ? '  {g}(it was waiting){/}' : '')], 360);
    if (B.focus) B.focus(u);
  };
  // struck, it wakes; a crawler struck forgets the downed (09-30b: "If damaged, ignore downed hero")
  var hurt0 = BP.hurt;
  BP.hurt = function (u, n, type) {
    var hp0 = u.hp, r = hurt0.apply(this, arguments);
    if (on(this) && u.hp < hp0) {
      if (u.dormant && u.side === 'foe' && u.hp > 0) W.wake(this, u, 'hurt');
      if (u.wetCrawler) u.blooded = true;
      if (u.side === 'party' && u.hp <= 0 && this.wet.bucketBy === u.id) W.dropBucket(this, u);
    }
    return r;
  };

  // ------------------------------------------------------------------ the squares: the sleepers' triggers, the picture, the bucket
  var move0 = BP.moveAlong;
  BP.moveAlong = function* (u, path, o) {
    yield* move0.apply(this, arguments);
    if (!on(this) || u.side !== 'party' || u.summon || u.familiar) return;
    var sq = (path || []).map(function (p) { return [p[0], p[1]]; }).concat([[u.x, u.y]]);
    if (!u.flies) yield* W.stepped(this, u, sq);
    yield* W.offer(this, u);
  };
  // at the edge of it -- the south line, or the stair -- it asks (RULED 09-30e, Griz: "Do an auto-pop-up 'leave the area? yes/no' when they hit
  // the stairs or the south line"): YES, and he is out (a foe beside him still gets its swing), and all of them with him; NO, and he stands
  // there (LEAVE THE FIGHT is still on the ring). A hero the AI runs is not asked
  W.offer = function* (B, u) {
    if (u.guest || u.classAI || u.left || u.dead || u.hp <= 0 || u.conds.restrained || !B.onExit(u) || (B.o.embed && B.o.embed.canRun === false) || B.over()) return;
    var stair = ((B.map && B.map.def && B.map.def.doors) || []).some(function (q) { return q[0] === u.x && q[1] === u.y; }); // (the map's doors: the stair's squares, already the grid's)
    var near = B.units.some(function (w) { return G.hostile(u, w) && G.standing(w) && !w.dormant && !w.ethereal && G.dist(w, u) <= G.reachOf(w); });
    var yes = yield { prompt: { who: u, title: 'LEAVE THE AREA?', lines: [(stair ? 'Up the stair' : 'Out of the wet to the south') + ': ' + u.name + ' goes, and the party goes too.' + (near ? ' Something beside ' + u.name + ' gets its swing.' : '')], opts: [{ label: 'YES', value: true }, { label: 'NO', value: false }] } };
    if (yes) yield* B.leave(u);
  };
  W.stepped = function* (B, u, sq) {
    var T = B.fight.triggers || {}, self = B;
    ['jelly', 'poolooze'].forEach(function (role) {
      var s = self.wet.sleepers[role];
      if (s && sq.some(function (p) { return inSet(T[role], p[0], p[1]); })) W.wake(self, s, 'stepped');
    });
    if (!B.wet.spoke && sq.some(function (p) { return inSet(T.picture, p[0], p[1]); })) yield* W.speak(B, u);
    var bk = B.wet.bucket;
    if (bk && sq.some(function (p) { return p[0] === bk.at[0] && p[1] === bk.at[1]; })) W.takeBucket(B, u);
    // the landlord waiting under the water rises for anyone it could get at now (W.submerge)
    var sl = B.wet.sleepers.landlord; if (sl && !sl.fed && W.canReach(B, sl, sl.speed || 30)) W.wake(B, sl, 'rise');
  };
  // can it get at anyone standing, keeping to its water, with `move` feet to spend? (the squares it could reach, and its reach from each)
  W.canReach = function (B, u, move) {
    var hs = ours(B).filter(function (w) { return !w.left && !w.dead && w.hp > 0; }); if (!hs.length) return false;
    var rm = G.reach(u, move) || {}, x0 = u.x, y0 = u.y, R = G.reachOf(u), ok = false;
    var sqs = Object.keys(rm).map(function (k) { return k.split(',').map(Number); }).concat([[x0, y0]]);
    for (var i = 0; i < sqs.length && !ok; i++) { u.x = sqs[i][0]; u.y = sqs[i][1]; ok = hs.some(function (w) { return G.dist(u, w) <= R; }); }
    u.x = x0; u.y = y0; return ok;
  };
  // awake, and no one it can get at: it sinks and waits (RULED 09-30g, Griz: "i like sink and wait, drag is good but too harsh for a reload
  // likely coming anyway"): off the grid, out of the order at the next turn's start, its wounds kept; it rises when someone comes where it can reach
  W.submerge = function* (B, u) {
    if (B.focus) B.focus(u);
    D.sfx('splash'); FX.sparkle(u, 'moss', 16);
    B.card(['{g}The landlord sinks under the fall, and waits.{/}'], 300);
    yield 50;
    B.wet.sleepers[u.wet] = u; u.anim = 'idle'; u.animT = B.t;
    var i = B.units.indexOf(u); if (i >= 0) B.units.splice(i, 1);
    B.wet.purge = (B.wet.purge || []).concat([u]);
  };

  // ------------------------------------------------------------------ the landlord: it waits in its pool, and speaks in pictures
  // standing at the edge of its water counts, round by round, one hero at a time; the fourth round there wakes it (RULED 09-30: "if
  // character is in adjacent square more than 3 rounds"; 09-30b: "the 3 rounds just the edge of his water")
  W.landlordWaits = function* (B, u) {
    if (u.fed) { yield* W.sink(B, u); return true; }
    var near = ours(B).filter(function (w) { return !w.left && w.hp > 0 && (G.dist(u, w) <= 5 || besideDeep(w)); }), bs = B.wet.beside, woke = false;
    ours(B).forEach(function (w) { if (near.indexOf(w) < 0) delete bs[w.id]; });
    near.forEach(function (w) { bs[w.id] = (bs[w.id] || 0) + 1; if (bs[w.id] > 3 && !u.fed) woke = true; });
    if (near.length && !B.wet.spoke) yield* W.speak(B, near[0]);
    if (woke) { W.wake(B, u, 'patience'); return false; } // (and its turn goes on: the tentacles)
    // (the warning: the camera goes to it and holds long enough to read -- 09-30e, Griz: "Need a little bit longer pause for the 'the landlord
    // is looking at you' (gist) warnings cause the camera has to pan and such")
    if (B.focus) B.focus(u);
    B.card(['{g}' + (near.length ? 'The landlord watches ' + near.map(function (w) { return w.name; }).join(', ') + ' from the water.' : 'Something watches from the deep water under the fall.') + '{/}'], 260);
    yield 60;
    return true;
  };
  // fed, it settles and goes under, its next turn (RULED 09-30g, Griz: "Landlord should settle and go underwater turn after bucket telepathy
  // and be removed from having turns - even if people are at his pool edge"): off the grid now, and out of the order at the next turn's start
  // (W.first: taken out mid-turn, the battle's loop would lose its place in the round)
  W.sink = function* (B, u) {
    if (B.focus) B.focus(u);
    D.sfx('splash'); FX.sparkle(u, 'moss', 18);
    B.card(['{g}The landlord settles, fed, and sinks out of sight under the fall.{/}'], 300);
    yield 50;
    B.wet.sunk[u.wet] = true; u.sunk = true;
    var i = B.units.indexOf(u); if (i >= 0) B.units.splice(i, 1);
    B.wet.purge = (B.wet.purge || []).concat([u]);
  };
  // the start of anyone's turn in the wet: the sunk out of the order; the landlord's picture first, when they came in by its rim
  W.first = function* (B) {
    if (B.wet.purge) { B.wet.purge.forEach(function (w) { var k = B.order.indexOf(w); if (k >= 0) B.order.splice(k, 1); }); B.wet.purge = null; }
    var w = B.wet.speakFirst; if (w) { B.wet.speakFirst = null; if (!B.wet.spoke) yield* W.speak(B, w); }
  };
  var heroTurn0 = BP.heroTurn;
  BP.heroTurn = function* (u) { if (on(this)) yield* W.first(this); yield* heroTurn0.apply(this, arguments); };
  // the first time: a picture of a bucket, in the head of whoever is nearest the water (the canon)
  W.speak = function* (B, w) {
    B.wet.spoke = true; B.flags8.landlordSpoke = 1;
    D.sfx('magic');
    yield { scene: { draw: W.picture('bucket'), frames: 200 } };
    B.card(['{p}A picture, not a word, in ' + w.name + '\'s head: a bucket, lowered on a rope. It is hungry, and it is patient.{/}'], 420);
    yield 20;
  };

  // ------------------------------------------------------------------ the deep station's three props, from Griz's sheet (10-08)
  // tools/wetprops-sheet.py cuts his one sheet into wetcrate_p1, wetbucket_p1 and wetlamp_p1 (lit, four frames of the flame), each on
  // the square's middle (the lamp on its post's foot); `up` lifts a drawing (the bucket on the crate's top, the crate's `lift`). False
  // while the image loads, and the code's own drawing below stands in (10-06, his ear file: "All 3 are very very 2D, particularly the lantern")
  function sheetProp(ctx, name, row, f, at, up) {
    var sh = D.SHEETS && D.SHEETS[name]; if (!sh) return false;
    var im = D.images && D.images[sh.image]; if (!im || !im.naturalWidth) { if (D.spr && !im) D.spr.load(sh.image); return false; }
    var iso = D.iso, c = iso.center(at[0], at[1], 0), s = iso.toScreen(c.x, c.y), a = sh.anims[row];
    ctx.drawImage(im, (f % a.frames) * sh.fw, a.row * sh.fh, sh.fw, sh.fh, Math.round(s.x - sh.ax), Math.round(s.y - sh.ay - (up || 0)), sh.fw, sh.fh);
    return true;
  }
  function onCrate(B, at) { var F = B.fight; return !!(F && F.bucket && F.bucket[0] === at[0] && F.bucket[1] === at[1]); }
  function crateLift() { var sh = D.SHEETS && D.SHEETS.wetcrate_p1; return sh && sh.lift || 0; }

  // ------------------------------------------------------------------ the bucket: on its square, picked up by walking onto it
  W.layBucket = function (B, at) {
    var sq = G.map.at(at[0], at[1]); if (!sq) return;
    // (10-04, Griz: "double check the sprite we're using to make it more a visible draw on the grid": half again as big, lifted onto the crate, lit by its lamp)
    var p = { kind: 'bucket', sq: sq, depth: at[0] + at[1] + 0.45, gz: 0, draw: function (ctx) {
      if (sheetProp(ctx, 'wetbucket_p1', 'bucket', 0, at, onCrate(B, at) ? crateLift() : 0)) return;
      var iso = D.iso, c = iso.center(at[0], at[1], 0), s = iso.toScreen(c.x, c.y), x = Math.round(s.x), y = Math.round(s.y) - 7;
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 7, y - 13, 14, 13);                        // the staves
      ctx.fillStyle = '#7a5634'; ctx.fillRect(x - 6, y - 13, 12, 12);
      ctx.fillStyle = '#a07a4e'; ctx.fillRect(x - 6, y - 13, 3, 12); ctx.fillRect(x + 1, y - 13, 2, 12);
      ctx.fillStyle = '#b4b4b4'; ctx.fillRect(x - 7, y - 10, 14, 1); ctx.fillRect(x - 7, y - 4, 14, 1); // the hoops
      ctx.fillStyle = '#1a120c'; ctx.fillRect(x - 5, y - 14, 10, 2);                         // the mouth, dark
      ctx.strokeStyle = '#9a8a70'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y - 14, 7, Math.PI, 0); ctx.stroke(); // the rope handle
    } };
    G.map.props.push(p);
    B.wet.bucket = { at: at, prop: p };
  };
  // the station's lamp: an iron lantern on a post, lit (the map's `lights` sits on this square, so the glow has a body -- 10-04, Griz: "the bucket glows like its a light")
  W.layLamp = function (B, at) {
    var sq = G.map.at(at[0], at[1]); if (!sq) return;
    G.map.props.push({ kind: 'lamp', sq: sq, depth: at[0] + at[1] + 0.4, gz: 0, draw: function (ctx) {
      var sh = D.SHEETS && D.SHEETS.wetlamp_p1;
      if (sh && sheetProp(ctx, 'wetlamp_p1', 'lit', Math.floor(B.t * sh.anims.lit.fps / 60), at, 0)) return;
      var iso = D.iso, c = iso.center(at[0], at[1], 0), s = iso.toScreen(c.x, c.y), x = Math.round(s.x), y = Math.round(s.y), P = D.PAL.ramps, fl = 0.6 + 0.4 * Math.sin(B.t / 5 + at[0]);
      ctx.fillStyle = P.outline[0]; ctx.fillRect(x - 4, y - 2, 8, 2); ctx.fillRect(x - 1, y - 26, 2, 24);      // the foot and the post
      ctx.fillRect(x - 1, y - 28, 6, 1); ctx.fillRect(x + 4, y - 28, 1, 3);                                        // the arm and the hook
      ctx.fillRect(x + 1, y - 25, 7, 1); ctx.fillRect(x + 1, y - 24, 1, 8); ctx.fillRect(x + 7, y - 24, 1, 8); ctx.fillRect(x + 1, y - 16, 7, 1); // the cage
      ctx.globalAlpha = 0.85; ctx.fillStyle = P.gold[3]; ctx.fillRect(x + 2, y - 24, 5, 8); ctx.globalAlpha = 1;   // the glass, lit
      ctx.fillStyle = P.fire[1]; ctx.fillRect(x + 4, y - 21 + (fl > 0.8 ? -1 : 0), 2, 3);                           // the flame
    } });
  };
  // the deep station's crate, where the 8-bit's 'k' stands (the grid's rows have floor there): always drawn, the bucket on it while it lies (10-04)
  W.layCrate = function (B, at) {
    var sq = G.map.at(at[0], at[1]); if (!sq) return;
    G.map.props.push({ kind: 'crate', sq: sq, depth: at[0] + at[1] + 0.4, gz: 0, draw: function (ctx) {
      if (sheetProp(ctx, 'wetcrate_p1', 'crate', 0, at, 0)) return;
      var iso = D.iso, c = iso.center(at[0], at[1], 0), s = iso.toScreen(c.x, c.y), x = Math.round(s.x), y = Math.round(s.y);
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 11, y - 9, 22, 11);                        // the crate
      ctx.fillStyle = '#6e4e2e'; ctx.fillRect(x - 10, y - 8, 20, 9);
      ctx.fillStyle = '#8a6840'; ctx.fillRect(x - 10, y - 8, 20, 2); ctx.fillRect(x - 10, y - 3, 20, 1); // the planks' edges
      ctx.fillStyle = '#3a2816'; ctx.fillRect(x - 1, y - 8, 2, 9); ctx.fillRect(x - 10, y - 5, 20, 1); // the nailed cross
    } });
  };
  // the stair up, on the map's `doors` (10-08, Griz: "Exit tiles don't resemble stairs and probably should somehow"; the 8-bit's are `u`, stairs up).
  // The grid turned the 8-bit's west edge to its near side, where the walls are cut to a stub (iso.js), and a flight climbing out toward the camera
  // shows only its treads -- a striped slab. So it is drawn as a flight along the wall over the door squares, climbing toward their far end (-x),
  // its risers and its side toward the camera: the shape that reads as a stair on this projection. Drawn once into a canvas in the map's stone,
  // outlined as the props are; the squares' rules are unchanged (stand on one and LEAVE THE AREA? asks), and anyone on it is drawn over it.
  W.STAIR = { steps: 6, rise: 5 };
  W.layStair = function (B, doors) {
    var xs = doors.map(function (p) { return p[0]; }), ys = doors.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs) + 1, y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys) + 1;
    var sq = G.map.at(x0, y0); if (!sq) return;
    var n = W.STAIR.steps, rise = W.STAIR.rise, d = (x1 - x0) / n, img = null;
    function wp(cx, cy, z) { return { x: (cx - cy) * D.iso.TW / 2, y: (cx + cy) * D.iso.TH / 2 - z }; } // (a corner of the grid, in world pixels)
    function bake() {
      var pts = [wp(x0, y0, n * rise), wp(x1, y0, 0), wp(x1, y1, 0), wp(x0, y1, 0), wp(x0, y1, n * rise), wp(x0, y0, 0)];
      var ox = Math.floor(Math.min.apply(null, pts.map(function (p) { return p.x; }))) - 2, oy = Math.floor(Math.min.apply(null, pts.map(function (p) { return p.y; }))) - 2;
      var W2 = Math.ceil(Math.max.apply(null, pts.map(function (p) { return p.x; }))) - ox + 3, H2 = Math.ceil(Math.max.apply(null, pts.map(function (p) { return p.y; }))) - oy + 3;
      var cv = document.createElement('canvas'); cv.width = W2; cv.height = H2;
      var cx = cv.getContext('2d'), st = D.iso.ramp('stone'), rgb = function (c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; };
      function quad(q, c) { cx.fillStyle = rgb(c); cx.beginPath(); q.forEach(function (p, i) { if (i) cx.lineTo(p.x - ox, p.y - oy); else cx.moveTo(p.x - ox, p.y - oy); }); cx.closePath(); cx.fill(); }
      for (var k = n - 1; k >= 0; k--) { // the high (far) end first; step k spans xa..xb, its top at (k + 1) rises
        var xb = x1 - k * d, xa = xb - d, z = (k + 1) * rise;
        quad([wp(xa, y1, 0), wp(xb, y1, 0), wp(xb, y1, z), wp(xa, y1, z)], st[3]);                    // its side (+y, lower left): the sawtooth
        quad([wp(xb, y0, z - rise), wp(xb, y1, z - rise), wp(xb, y1, z), wp(xb, y0, z)], st[2]);      // its riser (+x, lower right)
        quad([wp(xa, y0, z), wp(xb, y0, z), wp(xb, y1, z), wp(xa, y1, z)], st[4]);                    // its tread
        var a = wp(xb, y0, z), b = wp(xb, y1, z); cx.strokeStyle = rgb(st[6]); cx.lineWidth = 1;   // its nosing, catching the light
        cx.beginPath(); cx.moveTo(a.x - ox, a.y - oy + 0.5); cx.lineTo(b.x - ox, b.y - oy + 0.5); cx.stroke();
      }
      // the stone's grain (a fixed hash, so it never crawls), then the outline round the whole flight
      var id = cx.getImageData(0, 0, W2, H2), px = id.data, ol = D.iso.ramp('outline')[0], solid = new Uint8Array(W2 * H2);
      for (var i = 0; i < W2 * H2; i++) {
        if (px[i * 4 + 3] < 128) continue; solid[i] = 1; px[i * 4 + 3] = 255;
        var h = ((i * 2654435761) >>> 0) % 997 / 997, f = h < 0.08 ? 0.82 : h > 0.94 ? 1.1 : 0.96 + h * 0.08;
        for (var c = 0; c < 3; c++) px[i * 4 + c] = Math.min(255, Math.round(px[i * 4 + c] * f));
      }
      for (var y = 0; y < H2; y++) for (var x = 0; x < W2; x++) {
        var j = y * W2 + x; if (solid[j]) continue;
        if ((x > 0 && solid[j - 1]) || (x < W2 - 1 && solid[j + 1]) || (y > 0 && solid[j - W2]) || (y < H2 - 1 && solid[j + W2])) { px[j * 4] = ol[0]; px[j * 4 + 1] = ol[1]; px[j * 4 + 2] = ol[2]; px[j * 4 + 3] = 255; }
      }
      cx.putImageData(id, 0, 0);
      return { cv: cv, ox: ox, oy: oy };
    }
    G.map.props.push({ kind: 'stair', sq: sq, depth: x0 + y0 + 0.5, gz: 0, draw: function (ctx) {
      if (!img) img = bake();
      var s = D.iso.toScreen(img.ox, img.oy); ctx.drawImage(img.cv, s.x, s.y);
    } });
  };
  W.takeBucket = function (B, u) {
    var bk = B.wet.bucket; if (!bk) return;
    B.wet.bucket = null;
    var i = G.map.props.indexOf(bk.prop); if (i >= 0) G.map.props.splice(i, 1);
    var s = (B.inv || []).filter(function (x) { return x.id === 'bucket'; })[0];
    if (s) s.n++; else (B.inv = B.inv || []).push({ id: 'bucket', n: 1 });
    B.wet.bucketBy = u.id; B.flags8.bucketBy = u.id;
    D.sfx('popup');
    B.card(['{y}' + u.name + '{/} picks up the bucket: the deep station\'s, rope and all.  {g}(ITEM: ' + u.name + ' may USE it beside the deep water, or on the landlord){/}'], 360);
  };
  // the one carrying it falls: it rolls out of the hand onto the nearest free ground, for another to take up (RULED 09-30g, Griz: "if they fall
  // the bucket should become an item in a nearby available ground tile for a diff character to pickup")
  W.dropBucket = function (B, u) {
    var s = (B.inv || []).filter(function (x) { return x.id === 'bucket' && x.n > 0; })[0]; if (!s || B.wet.bucket) return;
    var best = null, bd = Infinity;
    for (var y = u.y - 3; y <= u.y + 3; y++) for (var x = u.x - 3; x <= u.x + 3; x++) {
      if (x === u.x && y === u.y) continue;
      var q = G.map.at(x, y); if (!q || !q.walk || G.occupant(x, y)) continue;
      var d = Math.max(Math.abs(x - u.x), Math.abs(y - u.y)) + 0.01 * Math.hypot(x - u.x, y - u.y);
      if (d < bd) { bd = d; best = [x, y]; }
    }
    if (!best) return;
    s.n--; B.wet.bucketBy = null; B.flags8.bucketBy = null;
    W.layBucket(B, best); D.sfx('miss');
    B.card(['{o}The bucket rolls out of ' + u.name + '\'s grip{/} onto the stone.  {g}(another may walk onto it and take it up){/}'], 360);
  };
  // USE BUCKET: beside the deep water, or touching the landlord -- fed, it does not fight, and its pictures play
  function landlordOf(B) { return B.units.filter(function (w) { return w.wet === 'landlord' && !w.dead && w.hp > 0; })[0] || null; }
  function besideDeep(u) { for (var dy = -1; dy <= u.size; dy++) for (var dx = -1; dx <= u.size; dx++) { var s = G.map.at(u.x + dx, u.y + dy); if (s && s.ch === 'D') return true; } return false; }
  var itemOK0 = BP.itemTargetOK;
  BP.itemTargetOK = function (u, id, w) { if (id === 'bucket') return w === u; return itemOK0.apply(this, arguments); };
  var itemList0 = BP.itemList;
  BP.itemList = function (u) {
    var out = itemList0.apply(this, arguments), L = landlordOf(this), by = this.wet && this.wet.bucketBy, self = this;
    out.forEach(function (e) {
      if (e.id !== 'bucket' || !e.ok) return;
      if (by && by !== u.id) { var cw = self.units.filter(function (w) { return w.id === by; })[0]; e.ok = false; e.why = (cw ? cw.name : 'another') + ' carries it'; return; } // (the carrier's alone: 09-30g)
      if (!(L && G.dist(u, L) <= 5) && !besideDeep(u)) { e.ok = false; e.why = 'nothing here takes it: the deep water under the fall'; }
    });
    return out;
  };
  var useItem0 = BP.useItem;
  BP.useItem = function* (u, id, w) {
    if (id !== 'bucket') { yield* useItem0.apply(this, arguments); return; }
    var L = landlordOf(this), s = this.inv.filter(function (x) { return x.id === 'bucket'; })[0];
    u.turn.action = 0; if (s) s.n--;
    D.sfx('splash'); FX.sparkle(L || u, 'moss', 16);
    this.card(['{y}' + u.name + '{/} lowers the bucket into the deep water. ' + (L ? 'The landlord takes it, and settles.' : 'Something below takes it.')], 360);
    this.flags8.otyughFed = 1; this.flags8['heard:r-stream'] = 1; this.wet.bucketBy = null; this.flags8.bucketBy = null;
    if (L) { L.fed = true; L.dormant = true; if (L.holding && L.holding.length) this.release(L); }
    yield 20;
    // fed, it tells them things in pictures: what comes down the stream (the canon's crook upstream)
    D.sfx('magic');
    var pics = ['fall', 'crook', 'clackers', 'bats'];
    for (var k = 0; k < pics.length; k++) yield { scene: { draw: W.picture(pics[k]), frames: 150, tick: W.SOUND[pics[k]] || null } };
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
    var n = Math.min(2, D.d(2)), came = [];
    for (var i = 0; i < n; i++) { var c = W.crawlerOut(this, long[0], i); if (c) came.push(c); }
    if (!came.length) return;
    // noticed or not (RULED 09-30e, Griz: "can we do passive perception checks silently when the crawlers show up, then cam pause on them with
    // 'your comrades fall has attracted the herd'"): the herd's Stealth, rolled once and never shown, against each standing hero's passive
    // Perception. Seen: the camera on them, held, and the line. Unseen: they come in out of the dark with nothing said
    if (W.noticed(this, came)) { D.sfx('encounter'); if (this.focus) this.focus(came[0]); this.card(['{r}Your comrade\'s fall has attracted the herd.{/}'], 420); yield 75; }
    else yield 30; // (the walk in from past the edge, unannounced)
    this.units.forEach(function (w) { if (w.wetCrawler && w.anim === 'walk') w.anim = 'idle'; });
  };
  W.noticed = function (B, came) {
    var sk = Math.max.apply(null, came.map(function (c) { return c.stealth || Math.floor(((c.abil && c.abil.dex) || 10) / 2) - 5; })), roll = D.d(20) + sk;
    var seen = ours(B).some(function (w) { return !w.left && !w.dead && w.hp > 0 && (w.perception != null ? w.perception : 10) >= roll; });
    B.wet.notice = { roll: roll, seen: seen }; // (for the probe; nothing on the screen)
    return seen;
  };
  // in over the south edge, out of the dark (RULED 09-30c): the entrance nearest the downed first, the other for a second; each crawler on
  // the free square nearest its entrance, walking in from past the edge
  W.crawlerOut = function (B, prey, k) {
    var ways = (B.fight.entrances || []).slice().sort(function (a, b) { return Math.hypot(a[0] - prey.x, a[1] - prey.y) - Math.hypot(b[0] - prey.x, b[1] - prey.y); });
    if (k && ways.length > 1) ways.push(ways.shift()); // (a second this round: the other way in)
    var n = ++B.wet.crawlers, u = B.makeFoe({ id: 'crawler' + n, kind: 'crawler', at: [0, 0] });
    for (var pi = 0; pi < ways.length; pi++) {
      var pen = ways[pi], best = null, bd = Infinity;
      for (var y = pen[1] - 4; y <= pen[1] + 4; y++) for (var x = pen[0] - 4; x <= pen[0] + 4; x++) {
        if (!G.canStand(u, x, y)) continue;
        var d = Math.hypot(x + 0.5 - pen[0], y + 0.5 - pen[1]);
        if (d < bd) { bd = d; best = [x, y]; }
      }
      if (best) {
        u.x = best[0]; u.y = best[1]; u.facing = 0; u.anim = 'walk'; u.animT = B.t; u.reaction = 1;
        u.tween = { fx: pen[0], fy: pen[1], fz: 0, t: 0, dur: B.pace ? B.pace(30, true) : 30 }; // (out of the dark past the edge; paced on an AI's turn, as a step is -- 10-01c)
        // (full speed: RULED 09-30g, Griz: "restore the crawlers get attracted in to full movement speed" -- 09-30b's "Half normal movement speed" lifted)
        u.wetCrawler = true;
        B.units.push(u);
        u.initRoll = D.d(20) + u.init;
        var at = 0; while (at < B.order.length && (B.order[at].initRoll > u.initRoll || (B.order[at].initRoll === u.initRoll && B.order[at].abil.dex >= u.abil.dex))) at++;
        B.order.splice(at, 0, u);
        FX.sparkle(u, 'moss', 16);
        return u;
      }
    }
    return null;
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
    if (on(B)) yield* W.first(B);
    if (on(B) && u.dormant) return yield* W.landlordWaits(B, u);
    if (on(B) && u.wet === 'landlord' && !u.fed && !(u.holding && u.holding.length) && !W.canReach(B, u, (u.turn && u.turn.move) || u.speed || 30)) { yield* W.submerge(B, u); return true; }
    if (on(B) && u.wetCrawler && (yield* W.crawlerTurn(B, u))) return true;
    return tturn0 ? yield* tturn0(B, u) : false;
  };

  // ------------------------------------------------------------------ the end: the wet keeps them till one of them walks off it; what died, for the 8-bit
  // (RULED 09-30d, Griz: "Can we keep on the grid after everything is dead (or as yet unrevealed) ... and do have the xp award when the
  // players finally leave it"): nothing dead, asleep or quiet ends it now -- only one of the party off the south edge or up the stair (all of
  // them out: a win if something died here, its XP at the 8-bit's Victory; else a run), or all of them down (lost). A hero down: the herd comes
  var over0 = BP.over;
  BP.over = function () {
    var o = over0.apply(this, arguments);
    if (!on(this) || o === 'lost' || o === 'pyro' || o === 'roost') return o;
    if (this.fight.oneLeavesAll && ours(this).some(function (w) { return w.left; })) return 'escaped';
    return null;
  };
  // where the one who walked out left the grid, in the 8-bit map's squares (data/maps.js wet to8): the 8-bit puts the party there (js/events.js EV.wetOut)
  W.exitOf = function (B) {
    var w = ours(B).filter(function (u) { return u.left && !u.summon; })[0], to8 = B.map && B.map.def && B.map.def.to8;
    return w && to8 ? to8(w.x, w.y) : null;
  };
  // the 8-bit game's ids of what died here: the three by name, each crawler
  W.killed = function (B) {
    var out = [];
    Object.keys(ID8).forEach(function (role) {
      if (!B.wet.present[role] || B.wet.sleepers[role] || B.wet.sunk[role]) return; // (sunk, fed: not killed)
      var alive = B.units.some(function (w) { return w.side === 'foe' && (w.wet === role || (role === 'jelly' && w.kind === 'ochrejelly')) && !w.dead && w.hp > 0; });
      if (!alive) out.push(ID8[role]);
    });
    B.units.forEach(function (w) { if (w.wetCrawler && (w.dead || w.hp <= 0) && !w.fled) out.push('crawler'); });
    return out;
  };
  var finish0 = BP.finish;
  BP.finish = function* (o) {
    if (on(this)) {
      var k = W.killed(this), F8 = this.flags8, self = this;
      Object.keys(FLAG8).forEach(function (r) { if (self.wet.present[r] && !self.wet.sleepers[r] && k.indexOf(ID8[r]) >= 0) F8[FLAG8[r]] = 1; });
      if (o === 'escaped' && k.length) o = 'won'; // (walked out with something dead behind them: a win, its XP as they come up)
      this.enemies8 = o === 'won' ? k : null;
      this.exit8 = o === 'lost' ? null : W.exitOf(this);
      yield* finish0.call(this, o);
      if (o === 'escaped' && window.DS && window.DS.audio && window.DS.audio.stop) window.DS.audio.stop(); // (a walk-out: no game-over tune)
      // no end card (RULED 09-30c: "no press e, just go"; 09-30e: not the head either -- "the wet, out the way they came in -- let's remove that"):
      // the head the ending posts is taken down at once, a beat, and back
      if (this.fight.noCards) this.clearCards();
      if (this.fight.noCards && this.o.onDone) { yield 12; if (D.top && D.top() === this) D.pop(); else if (D.pop) D.pop(); this.o.onDone(this.result); }
      return;
    }
    yield* finish0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ the pictures (the telepathy: screen effects, not a text box)
  // his paintings (10-01, from his image runs, dev/visions/: "Landlord telepathy art dev/visions"), brought to 360 wide and a palette of
  // their own by tools/visions.py; each fades in over the dark, swaying and breathing, a vignette closing from the corners. The clackers'
  // jolts on each clack (W.SOUND's frames). Till a painting is in (or if one fails) the code's 96 x 72 sketch below stands in for it.
  W.PICS = { bucket: 'bucket.png?v=009f57bc70', fall: 'fall.png?v=595293ecd2', crook: 'crook.png?v=1327d44854', clackers: 'clackers.png?v=a95a75de7b', bats: 'bats.png?v=a73a9d9a21' };
  var IMG = {};
  W.loadPictures = function () {
    Object.keys(W.PICS).forEach(function (k) { if (IMG[k]) return; var im = new Image(); im.src = 'art/visions/' + W.PICS[k]; IMG[k] = im; });
  };
  function vignette(ctx, WW, HH) {
    var g = ctx.createRadialGradient(WW / 2, HH / 2, Math.min(WW, HH) * 0.2, WW / 2, HH / 2, Math.max(WW, HH) * 0.62);
    g.addColorStop(0, 'rgba(40,60,30,0)'); g.addColorStop(1, 'rgba(10,20,8,0.92)'); ctx.fillStyle = g; ctx.fillRect(0, 0, WW, HH);
  }
  // each sketch drawn small (96 x 72) in a few colours and blown up soft-edged, swaying, the landlord's eye behind it
  var PAL = { bg: '#0c0a10', ink: '#1a2420', murk: '#2c3a30', sick: '#6a8a4a', pale: '#b8c8a0', wood: '#6b4a2c', woodL: '#8a6a44', rope: '#9a8a6a', water: '#2a4458', waterL: '#5a8aa0', bone: '#d8d0b8', fungus: '#c8b8d8', fungusD: '#7a6a90', eye: '#e8d060' };
  W.picture = function (kind) {
    var cv = document.createElement('canvas'); cv.width = 96; cv.height = 72;
    var c = cv.getContext('2d');
    W.loadPictures();
    return function (ctx, t, WW, HH) {
      var im = IMG[kind] || IMG.bucket;
      if (im && im.complete && im.naturalWidth) {
        ctx.fillStyle = 'rgba(6,8,6,0.96)'; ctx.fillRect(0, 0, WW, HH);
        var p = t % 32, jolt = kind === 'clackers' && (p === 8 || p === 9 || p === 16 || p === 17) ? 1.015 : 1;
        var fd = Math.min(1, t / 25), sw = Math.sin(t / 17) * 3, kk = Math.min(WW / im.width, HH / im.height) * 0.9;
        ctx.save(); ctx.globalAlpha = fd; ctx.imageSmoothingEnabled = true;
        ctx.translate(WW / 2 + sw, HH / 2 - 6); ctx.scale(kk * (1 + 0.02 * Math.sin(t / 11)) * jolt, kk * jolt);
        ctx.drawImage(im, -im.width / 2, -im.height / 2);
        ctx.restore();
        vignette(ctx, WW, HH);
        return;
      }
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
      vignette(ctx, WW, HH);
    };
  };
  // a picture's sounds, on the frames its drawing moves (the scene's `tick`, deep16/js/ui.js sceneInput): the clackers' claws snap shut at
  // 8 and 16 of every 32 (DRAW.clackers' `open`), a clack each (09-30e, Griz: "can we add clacker sound effects for when the appropriate
  // telepathy image shows?")
  W.SOUND = { clackers: function (t) { var p = t % 32; if (p === 8 || p === 16) D.sfx('clack'); } };
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
