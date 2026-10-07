/* DEEP16 — the Monster Party Game Show (10-07; the lane: they live\handoff-2026-10-07-the-monster-party-game-show.md, seat 1 -- every screen
   and cutscene). Griz: "Monster Party Game Show / Scene 1 - Lobster Monkey Lighthouse / This will be the idle screen and the title screen
   background. Until I click the center of portal, every 33 seconds fires a trigger that picks a random lobstamonkee walks him 5 squares and does a
   search. / On center portal click: / Scene 2 - LAMP MAP / Pyro and his Cleric are by the lamp / Exit animation (lobstamonkees arrives, portal
   goes dormant) / Pyro tells them the Lamp is under heavy pressure, but Solskaft is under attack on the surface. 'Hold out here Lobstamonkees, as
   long as you can.' As long as the lamp stays lit, you're Virtually Not Alone. / Then the portal spins up and Pyro and the Cleric jump in - Cleric
   might give additional instructions after Pyro jumps in - a chest/barrel she explains may contain (when the audience sent supplies to the folks in
   the Hunger Games)." His rulings on it: the Cleric is Ingrith, and "she should hold up the ledger lamp to activate the portal before they arrive and
   before the king leaves (it should stay open for her while she does her lines)"; "the walk and search is just in the lighthouse while I'm trying to
   get people to come on the stream and play - the seat making it can be as creative as it wants - lighthouse music as surface 8bit music"; "party
   wipe doesn't end the run - slow mo walk to the lamp by surviving villain then darkness - pause - game over <insert group name> - high score
   screen (add high score button on title screen)"; "in between waves (end of rest - main walks from bed to portal) all 4 lobstamonkees walk into
   the same square and beholda becomes 'party token'".

     deep16/?gameshow           the show: the title over the lighthouse, then Third Lamp
     &fast                      every wait cut short (a look at the beats, not the show); &at=lamp straight to Third Lamp's arrival

   Each scene is a fight on its map run by a script of its own in place of the turns (js/skyshow.js's way): nobody takes a turn while the show
   has the floor. The fight itself is seat 2's (the lane's §3 D): the show hands Third Lamp's battle to `D.gameshow.waves` when it is set --
       D.gameshow.waves = function* (B, show) { ... }      the run: waves, rests, the lamp; until it is set, the show waits on the floor
   and seat 2 calls the show back for its two scenes:
       yield* D.gameshow.between(B, { bed: [x, y] })       the rest's end: the four walk into one square, Beholda the party token to the circle
       yield* D.gameshow.gameOver(B, villain, { waves, tier })   the lamp's end: the villain's slow walk to it, the dark, GAME OVER, the scores
   The circle itself is js/circles.js (D.circles: wake, spin, sink, the hub). The show draws over the fight with `B.cine` set (js/ui.js leaves
   off the turn strip and the bar). */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, C = D.circles, FX = D.fx;
  var GS = D.gameshow = {};
  var LOBSTAMONKEES = ['denny', 'rascal', 'goose'];                // (Beholda is an EyeGregore: she keeps her place while they wander)
  var WANDER = 33 * 60, SCORES = 'deep16.gameshow.scores', NAME = 'deep16.gameshow.group', TUT = 'deep16.gameshow.tutorial';
  var FAST = false;
  function W(n) { return FAST ? Math.min(n, 2) : n; }
  function P(r, i) { return D.PAL.ramps[r][i]; }
  function mascot(B, key) { return B.units.filter(function (u) { return u.mpmon === key; })[0] || null; }

  // ------------------------------------------------------------------ the scores and the group's name (this browser's: D.store)
  GS.scores = function () { var s = D.store.get(SCORES); return Array.isArray(s) ? s : []; };
  GS.record = function (row) {
    var s = GS.scores().concat([row]).sort(function (a, b) { return (b.waves - a.waves) || (b.tier - a.tier) || (a.t - b.t); }).slice(0, 10);
    D.store.set(SCORES, s); return s.indexOf(row);
  };
  GS.group = function () { var g = D.store.get(NAME); return typeof g === 'string' && g ? g : 'THE LOBSTAMONKEES'; };
  // THE TUTORIAL (10-07, Griz: "a spell gallery version of the heroes abilities with a front page toggle for 'tutorial'"; "build for denny as test"): a
  // toggle on the title. On, the show opens with each Mascot's lesson on the lighthouse floor before the jump in (js/gstutorial.js GS.teach: his own words,
  // then a real turn played on the game's own ring by a ghost of the mouse -- Griz, 10-07: "i should see text like the lines Pyro and Ingrith give from Denny
  // about his ability and when to use it, then the wheel popup - highlight - like you click it - show the cursor moving to the target"), then the circle
  // wakes as ever. Denny alone for now (his "as test"); TUTORIAL_WHO is the list to grow. It is this browser's, as the group's name is
  GS.tutorial = function () { return !!D.store.get(TUT); };
  GS.TUTORIAL_WHO = ['denny'];

  // ------------------------------------------------------------------ the show's fights
  function stage(map, extra, lvl) {
    var L = lvl || 1, vs = ['denny', 'beholda', 'rascal', 'goose'].map(function (k) { return k + ':' + L; }).concat(extra || []);
    return D.npcFight('?npc=goblin&vs=' + vs.join(',') + '&map=' + map + '&lvl=' + L, {});
  }
  // the fight as a show: its own script, its picture's overlay, its clicks read every frame (a click while a beat runs is kept for the next look)
  function asShow(B, script) {
    var enter0 = B.enter, paint0 = B.paint, update0 = B.update;
    B.cine = true; B.gs = B.gs || { clicks: [], fade: 0 };
    B.enter = function () {
      enter0.apply(this, arguments);
      this.units = this.units.filter(function (u) { return u.side === 'party'; });   // (the class floor's foe: a show has none of its own)
      G.setup(G.map, this.units); this.order = []; this.active = null; this.req = null;
      this.co = script(this);
    };
    B.update = function () {
      var m = D.input.mouse;
      if (!(this.gs && this.gs.ghost && GS.ghostTick && GS.ghostTick(this)) && m.click && this.gs) this.gs.clicks.push({ x: m.x, y: m.y });   // (the tutorial's ghost has the mouse while it drives: js/gstutorial.js)
      var r = update0.apply(this, arguments), L = this.gs && this.gs.lock;
      if (L) { D.iso.zoom = L.zoom; D.iso.cam.x = L.x; D.iso.cam.y = L.y; }
      return r;
    };
    B.paint = function (ctx) { paint0.apply(this, arguments); GS.paintOver(ctx, this); };
    return B;
  }
  GS.make = function (q) {
    q = q || ''; FAST = /[?&]fast\b/.test(q); GS.q = q;   // (the address the show was made from: the waves read &tier, &wave, &auto from it -- js/waves.js)
    if (/[?&]at=lamp\b/.test(q)) return GS.lamp(null);
    return asShow(stage('lighthouse'), lighthouse);
  };
  // go on to the next fight: this one off the stack, the next on
  function swap(B, next) { D.pop(); D.push(next); }

  // ------------------------------------------------------------------ scene 1: the lighthouse, the title and the idle
  var FINDS = [
    'a lobster pot. Empty. Suspicious.', 'a coil of rope, and a smaller coil inside it.', 'a message in a bottle. It says COME PLAY.',
    'the keeper\'s logbook. The last entry just says VNA.', 'one sock. The other is somewhere in Deepholm.', 'a crab. It leaves.',
    'a brass key to nothing in particular.', 'nothing. Checks again. Still nothing.', 'a bag of salt-water taffy, already opened.',
    'a gull feather, and keeps it.', 'an empty chair, just right for one more player.', 'the spare lens for the light, polished to a shine.',
    'a ticket stub: MONSTER PARTY, ADMIT FOUR.', 'a sea shanty scratched into the wall. Hums it.'
  ];
  var OWN = {
    denny: ['a patch of denim, and sews it on.', 'his own reflection in the lens, and taunts it.'],
    rascal: ['a seashell, and posts it. Eleven likes.', 'a hot take scratched into the stair rail. Agrees with it.'],
    goose: ['a hermit crab with no shell, and hugs it.', 'a lost gull. HONK. It is found now.']
  };
  var FLOURISH = { denny: 'taunt', rascal: 'hottake', goose: 'honk' };

  function* lighthouse(B) {
    var st = B.gs, def = G.map.def, ctr = def.circle.at, next = B.t + W(6 * 60);
    st.mode = 'title'; st.name = GS.group(); st.tutorial = GS.tutorial();
    D.music('corridor');                                            // (the 8-bit's surface music -- his "lighthouse music as surface 8bit music")
    hold(B, ctr, 1);
    while (true) {
      var ck = st.clicks.shift();
      if (ck) {
        var hit = titleHit(B, ck);
        if (hit === 'scores') { st.mode = st.mode === 'scores' ? 'title' : 'scores'; continue; }
        if (hit === 'name') { nameEdit(B); continue; }
        if (hit === 'tutorial') { st.tutorial = !st.tutorial; D.store.set(TUT, st.tutorial); D.sfx('cursor'); continue; }
        if (st.mode === 'title' && !st.editing) {
          var sq = D.iso.pick(ck.x, ck.y, 0);
          if (sq && sq.x === ctr[0] && sq.y === ctr[1]) break;      // the circle's centre: the show begins
        }
        continue;
      }
      if (B.t >= next && st.mode === 'title' && !st.editing) { yield* wander(B); next = B.t + W(WANDER); continue; }
      yield 1;
    }
    st.editing = false; D.store.set(NAME, st.name);
    // the tutorial first, when its toggle is on: each Mascot's lesson on this floor (js/gstutorial.js), before anyone jumps in
    if (st.tutorial && GS.teach) {
      st.mode = 'tutorial'; st.lock = null;
      yield* GS.teach(B, { who: GS.TUTORIAL_WHO, home: [ctr[0], ctr[1]], fast: FAST });
      st.clicks = []; hold(B, ctr, 1);
      B.card(['{y}That\'s the kit.{/}  Now, in they go.'], W(240)); yield W(60);
    }
    // the jump in: the circle wakes and spins, and they go in one by one (the storyboard's, tools/wheel-play.html?scene)
    st.mode = 'go'; st.lock = null;
    var sign = D.SHEETS[def.circle.sheet].signs[Math.floor(D.rand() * 12)];
    yield* B.camTo({ gx: ctr[0], gy: ctr[1], gz: 0 }, 1.25, W(40));
    yield* wake(B, sign, { turns: 3, T: 3.6 });
    B.card(['{y}' + NAMES(sign) + '.{/}  In they go.'], 240);
    var four = ['denny', 'rascal', 'goose', 'beholda'].map(function (k) { return mascot(B, k); }).filter(Boolean);
    for (var i = 0; i < four.length; i++) { jumpIn(B, four[i], W(i * 21)); }
    yield W(four.length * 21 + 60);
    yield* fade(B, 1, W(36));
    swap(B, GS.lamp(sign));
  }
  function NAMES(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  // the camera locked on a square at a zoom, its centre the screen's (Griz, 10-07: "center the circle in the middle middle and don't follow the
  // characters with the cam on idle"): asShow's update puts it back every frame, so neither the mouse's edge-scroll nor a walk's own camera moves it
  function hold(B, at, zoom) { var c = D.iso.center(at[0], at[1], 0); B.gs.lock = { x: c.x, y: c.y, zoom: zoom }; D.iso.zoom = zoom; D.iso.cam.x = c.x; D.iso.cam.y = c.y; }

  // one of the three walks five squares and searches (Griz: "the seat making it can be as creative as it wants")
  function* wander(B) {
    var who = LOBSTAMONKEES.map(function (k) { return mascot(B, k); }).filter(function (u) { return u && G.standing(u); });
    if (!who.length) return;
    var u = who[Math.floor(D.rand() * who.length)];
    RU.startTurn(u);
    var rm = G.reach(u, 25), far = [];
    Object.keys(rm).forEach(function (k) { var r = rm[k], p = G.path(rm, r.x, r.y); if (p && p.length === 5 && !G.occupant(r.x, r.y, u)) far.push(p); });
    if (!far.length) Object.keys(rm).forEach(function (k) { var r = rm[k], p = G.path(rm, r.x, r.y); if (p && p.length >= 3 && !G.occupant(r.x, r.y, u)) far.push(p); });
    if (far.length) { yield* B.moveAlong(u, far[Math.floor(D.rand() * far.length)], { noOA: true }); u.anim = 'idle'; }
    // the search: a look one way and the other, a question over the head, and what turns up
    var f0 = u.facing || 0;
    FX.float('?', u, P('gold', 4));
    for (var k = 0; k < 4; k++) { u.facing = (f0 + (k % 2 ? 6 : 2)) % 8; yield W(22); }
    u.facing = f0;
    var own = OWN[u.mpmon] || [], pool = FINDS.concat(own, own), find = pool[Math.floor(D.rand() * pool.length)];
    if (D.rand() < 0.35 && FLOURISH[u.mpmon] && D.spr.anim(u.sheet, FLOURISH[u.mpmon])) { u.anim = FLOURISH[u.mpmon]; u.animT = B.t; if (u.anim === 'honk') D.sfx('honk'); /* (his honk on the synth, js/audio.js SFX.honk, 10-07) */ yield W(Math.min(90, D.spr.duration(u.sheet, u.anim) || 40)); u.anim = 'idle'; }
    D.sfx('popup'); FX.sparkle(u, 'gold', 14);
    B.gs.caption = { s: '{y}' + u.name + '{/} searches the lighthouse and finds ' + find, t0: B.t, life: 330 };
    yield W(60);
  }

  // ------------------------------------------------------------------ through the circle: in, and out
  // a figure off the board for its flight: drawn by a prop of its own along a path in the grid (gx, gy, and a height in world px), the
  // circle's hub clipping it while it is down in the hole
  function flyer(B, u, legs, done) {
    var t0 = B.t, total = legs.reduce(function (n, l) { return n + l.dur; }, 0), m = G.map;
    var p = { kind: 'gsfly', sq: m.at(u.x, u.y), depth: u.x + u.y + 0.6, gz: 0, draw: function (ctx) {
      var t = B.t - t0, k = 0, leg = legs[0];
      for (var i = 0; i < legs.length; i++) { if (t < legs[i].dur || i === legs.length - 1) { leg = legs[i]; k = Math.min(1, t / legs[i].dur); break; } t -= legs[i].dur; }
      var gx = leg.from[0] + (leg.to[0] - leg.from[0]) * k, gy = leg.from[1] + (leg.to[1] - leg.from[1]) * k;
      var z = (leg.z0 || 0) + ((leg.z1 || 0) - (leg.z0 || 0)) * k + (leg.arc || 0) * 4 * k * (1 - k);
      p.depth = gx + gy + 0.6;
      var c = D.iso.center(gx, gy, 0), s = D.iso.toScreen(c.x, c.y);
      ctx.save();
      if (leg.clip) { var h = C.hub(B); ctx.beginPath(); ctx.moveTo(-9999, -9999); ctx.lineTo(9999, -9999); ctx.lineTo(9999, h.y); ctx.lineTo(h.x + h.A, h.y); ctx.ellipse(h.x, h.y, h.A, h.B, 0, 0, Math.PI); ctx.lineTo(-9999, h.y); ctx.closePath(); ctx.clip(); }
      D.spr.draw(ctx, u.sheet, 'idle', leg.face != null ? leg.face : (u.facing || 0), B.t, s.x, s.y - z);
      ctx.restore();
      if (leg.shadow && z > 2) { ctx.globalAlpha = 0.4; ctx.fillStyle = P('outline', 0); ctx.beginPath(); ctx.ellipse(s.x, s.y, 9, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    } };
    m.props.push(p); m.sorted = null;
    var tick = function () { m.sorted = null; if (B.t - t0 >= total) { var i = m.props.indexOf(p); if (i >= 0) m.props.splice(i, 1); m.sorted = null; if (done) done(); } else setTimeout(tick, 16); };
    // (the prop ends itself by the fight's own clock, checked on the wall clock's beat; the fight's frames move it)
    setTimeout(tick, 16);
    return p;
  }
  // into the hole: a hop from where it stands to the hub, then down past the near rim. Off the board at once (spliced out of the fight)
  function jumpIn(B, u, delay) {
    var ctr = G.map.def.circle.at, i = B.units.indexOf(u);
    var go = function () {
      var j = B.units.indexOf(u); if (j >= 0) B.units.splice(j, 1); G.setup(G.map, B.units);
      var face = D.spr.facingFor(ctr[0] - u.x, ctr[1] - u.y);
      flyer(B, u, [{ from: [u.x, u.y], to: ctr, dur: 33, arc: 46, z1: 6, face: face, shadow: true }, { from: ctr, to: ctr, dur: 16, z0: 6, z1: -70, clip: true, face: face }]);
      D.sfx('confirm');
    };
    if (i < 0) return;
    if (delay > 0) { var t0 = B.t, wait = function () { if (B.t - t0 >= delay) go(); else setTimeout(wait, 16); }; wait(); } else go();
  }
  // out of the hole: up past the near rim, a hop to its square, and back on the board there
  function popOut(B, u, to, face, delay, done) {
    var ctr = G.map.def.circle.at;
    var go = function () {
      flyer(B, u, [{ from: ctr, to: ctr, dur: 15, z0: -70, z1: 6, clip: true, face: 0 }, { from: ctr, to: to, dur: 33, z0: 6, arc: 46, face: face, shadow: true }], function () {
        u.x = to[0]; u.y = to[1]; u.facing = face; u.anim = 'idle'; u.left = false; u.dead = false;
        if (B.units.indexOf(u) < 0) B.units.push(u);
        G.setup(G.map, B.units); FX.ring(u, 'bone', 16); D.sfx('bump');
        if (done) done();
      });
      D.sfx('confirm');
    };
    if (delay > 0) { var t0 = B.t, wait = function () { if (B.t - t0 >= delay) go(); else setTimeout(wait, 16); }; wait(); } else go();
  }
  // the circle set going and waited on
  function* wake(B, sign, o) { var done = false; C.wake(B, sign, o, function () { done = true; }); while (!done) yield 1; }
  function* spin(B, sign, o) { var done = false; C.spin(B, sign, o, function () { done = true; }); while (!done) yield 1; }
  function* sink(B) { var done = false; C.sink(B, function () { done = true; }); while (!done) yield 1; }
  function* fade(B, to, n) { var f0 = B.gs.fade; for (var i = 1; i <= n; i++) { B.gs.fade = f0 + (to - f0) * i / n; yield 1; } B.gs.fade = to; }
  function corners(at, n) { var r = (n - 1) / 2; return [[at[0] - r, at[1] - r], [at[0] + r, at[1] - r], [at[0] - r, at[1] + r], [at[0] + r, at[1] + r]]; }
  // a scripted walk to a square, no rules (the arrivals' way, battle.js walkIn): a step at a time by the route round what is solid
  function* walkTo(B, u, to, frames) {
    var D8 = frames || 8, path = D.Battle.route(u, to, false) || [];   // (false: the ground alone -- the four may walk into one square)
    u.anim = 'walk';
    for (var i = 0; i < path.length; i++) {
      var q = path[i]; if (q[0] === u.x && q[1] === u.y) continue;
      u.facing = D.spr.facingFor(q[0] - u.x, q[1] - u.y);
      u.tween = { fx: u.x, fy: u.y, fz: 0, t: 0, dur: D8, mode: null }; u.x = q[0]; u.y = q[1];
      yield D8;
    }
    u.anim = 'idle';
  }

  // ------------------------------------------------------------------ scene 2: Third Lamp, before the first wave
  GS.lamp = function (sign) {
    var B = stage('lampcircle', ['pyro', 'ingrith']);
    B.gs = { clicks: [], fade: 1, sign: sign || 'pisces' };
    return asShow(B, lampScene);
  };
  function* lampScene(B) {
    var st = B.gs, def = G.map.def, ctr = def.circle.at, sh = D.SHEETS[def.circle.sheet], tower = def.tower;
    st.mode = 'lamp';
    D.music('highway');
    var pyro = B.units.filter(function (u) { return u.name === 'Pyro' || /^pyro/.test(u.sheet || ''); })[0];
    // (the word 'ingrith' builds her cleric -- js/classes.js NPC.NAMED.ingrith, the stats -- with no name or figure of her own: hers are the 8-bit's)
    var ing = B.units.filter(function (u) { return u.side === 'party' && !u.mpmon && u !== pyro; })[0];
    if (ing) { ing.name = 'Ingrith'; if (D.SHEETS && D.SHEETS.ingrith_p0) ing.sheet = 'ingrith_p0'; }
    var four = ['denny', 'rascal', 'goose', 'beholda'].map(function (k) { return mascot(B, k); }).filter(Boolean);
    four.forEach(function (u) { var j = B.units.indexOf(u); if (j >= 0) B.units.splice(j, 1); });    // (they are on the far side of the circle yet)
    if (pyro) { pyro.x = tower[0] - 1; pyro.y = tower[1] + 1; pyro.facing = 1; }
    if (ing) { ing.x = tower[0] + 1; ing.y = tower[1] + 1; ing.facing = 1; }
    G.setup(G.map, B.units);
    C.run(B).a = 30 * Math.max(0, sh.rest.indexOf(st.sign));                  // (the circle rests on the sign the lighthouse landed on)
    hold(B, [tower[0], tower[1] + 3], 1.25); B.gs.lock = null;   // (the opening shot; the scene's camera moves from it)
    yield* fade(B, 0, W(40));
    B.card(['{y}THIRD LAMP.{/}  The king and his cleric keep the light.'], 300);
    yield W(90);
    // to the circle: she goes first, with the Ledger-Lamp
    yield* B.camTo({ gx: ctr[0], gy: ctr[1] - 1, gz: 0 }, 1.1, W(50));
    var cc = D.iso.center(ctr[0], ctr[1] - 1, 0); st.lock = { x: cc.x, y: cc.y - 20, zoom: 1.1 };   // (the shot held on the circle: the speaker never pulls the camera off it)
    var spotI = [ctr[0] - 1, ctr[1] - 3], spotP = [ctr[0] + 2, ctr[1] - 3];
    if (ing) yield* walkTo(B, ing, spotI);
    if (pyro) yield* walkTo(B, pyro, spotP);
    if (ing) {
      ing.facing = 0; st.ledger = ing;                                               // she holds up the Ledger-Lamp: its light, and the circle wakes to it
      B.lights.push({ id: 'ledger', kind: 'map', x: ing.x, y: ing.y, bright: 15, dim: 15, color: 'gold', flame: false });
      D.sfx('shine'); FX.ring(ing, 'gold', 30); FX.sparkle(ing, 'gold', 30);
      B.card(['{y}Ingrith{/} holds up the Ledger-Lamp.'], 260);
      yield W(60);
    }
    B.lights.push({ id: 'circle', kind: 'map', x: ctr[0], y: ctr[1], bright: 15, dim: 20, color: 'violet', flame: false });
    yield* wake(B, st.sign, { dir: -1, turns: 2, T: 2.8 });                         // (out counter-clockwise -- his "spin opposite direction on exit")
    var cs = corners(ctr, sh.squares), order = [cs[3], cs[1], cs[2], cs[0]], fo = [0, 6, 2, 0];   // Denny to the front, Rascal right, Goose left, Beholda behind
    for (var i = 0; i < four.length; i++) popOut(B, four[i], order[i], fo[i], W(i * 21));
    yield W(four.length * 21 + 60);
    G.setup(G.map, B.units);
    // the king's charge (his lines as he wrote them; round them, the seat's)
    if (pyro) {
      D.sfx('popup'); pyro.facing = 1;
      B.card(['{y}Pyro{/}: "The lamp is under heavy pressure, and Sólskaft is under attack on the surface. I am needed up there."'], W(420)); yield W(200);
      B.card(['{y}Pyro{/}: "Hold out here, Lobstamonkees, as long as you can."'], W(360)); yield W(170);
      B.card(['{y}Pyro{/}: "As long as the lamp stays lit, you\'re Virtually Not Alone."'], W(360)); yield W(190);
      jumpIn(B, pyro, 0); yield W(60);
    }
    // the cleric's word on the chest, the circle open for her while she says it
    if (ing) {
      D.sfx('popup');
      B.card(['{y}Ingrith{/}: "One more thing. The chest by the lamp -- whatever the folk up top send down for you lands in it."'], W(420)); yield W(200);
      B.card(['{y}Ingrith{/}: "They\'re watching. Give them a show, and they\'ll keep you fed. Check it between waves."'], W(420)); yield W(200);
      st.ledger = null; B.lights = B.lights.filter(function (l) { return l.id !== 'ledger'; });
      jumpIn(B, ing, 0); yield W(60);
    }
    yield* sink(B);                                                                   // dormant again
    B.lights = B.lights.filter(function (l) { return l.id !== 'circle'; });
    st.mode = 'fight'; st.lock = null;
    // the run is seat 2's: the waves, the rests, the lamp
    if (GS.waves) { yield* GS.waves(B, GS); return; }
    B.card(['{p}The waves come here (the lane\'s seat 2).{/}  {g}Click the circle to see the token walk; the lantern to see the end.{/}'], 100000, 'gsstub');
    while (true) {
      var ck = B.gs.clicks.shift();
      if (ck) {
        var sq = D.iso.pick(ck.x, ck.y, 0);
        if (sq && sq.x === ctr[0] && sq.y === ctr[1]) yield* GS.between(B, { bed: [35, 13] });
        else if (sq && tower && sq.x === tower[0] && sq.y === tower[1]) { yield* GS.gameOver(B, null, { waves: 0, tier: 1 }); return; }
      }
      yield 1;
    }
  }

  // ------------------------------------------------------------------ between waves (seat 2 calls it): the token
  // (Griz: "in between waves (end of rest - main walks from bed to portal) all 4 lobstamonkees walk into the same square and beholda becomes 'party
  // token'"): the four walk into the bed's square and are one; Beholda, the token, walks to the circle; the others come out round it
  GS.between = function* (B, o) {
    o = o || {};
    var def = G.map.def, ctr = def.circle.at, bed = o.bed || ctr, sh = D.SHEETS[def.circle.sheet];
    var four = ['denny', 'rascal', 'goose', 'beholda'].map(function (k) { return mascot(B, k); }).filter(function (u) { return u && G.standing(u); });
    var token = four.filter(function (u) { return u.mpmon === 'beholda'; })[0] || four[0];
    if (!token) return;
    var was = B.cine; B.cine = true;
    yield* B.camTo({ gx: bed[0], gy: bed[1], gz: 0 }, 1.25, W(30));
    // into one square: the others walk onto the token's ground and are gone into it
    var meet = bed;
    for (var i = 0; i < four.length; i++) if (four[i] !== token) yield* walkTo(B, four[i], meet, 6);
    yield* walkTo(B, token, meet, 6);
    four.forEach(function (u) { if (u !== token) { var j = B.units.indexOf(u); if (j >= 0) B.units.splice(j, 1); } });
    G.setup(G.map, B.units); FX.ring(token, 'glow', 22); D.sfx('popup');
    B.card(['{y}The party{/} sets out.'], 200);
    // the token to the circle
    yield* walkTo(B, token, [ctr[0], ctr[1] - (sh.squares - 1) / 2 - 1], 8);
    yield* B.camTo({ gx: ctr[0], gy: ctr[1], gz: 0 }, 1.25, W(24));
    // and the four round it again: the token steps to its corner, the others come out of it
    var cs = corners(ctr, sh.squares);
    yield* walkTo(B, token, cs[0], 8);
    var rest = four.filter(function (u) { return u !== token; });
    // (each out of it in turn, ten frames apart, walked on the fight's own frames -- not the wall clock's, so a bench stepping the loop sees them come out, and the waves
    // never roll initiative before they are back: js/waves.js, 10-07)
    var outs = rest.map(function (u, k) { u.x = token.x; u.y = token.y; return { u: u, at: W(k * 10), to: cs[k + 1], co: null, wait: 0, done: false }; });
    for (var f = 0; f < 900 && outs.some(function (o) { return !o.done; }); f++) {
      outs.forEach(function (o) {
        if (o.done || f < o.at) return;
        if (!o.co) { if (B.units.indexOf(o.u) < 0) B.units.push(o.u); G.setup(G.map, B.units); o.co = walkTo(B, o.u, o.to, 7); }
        if (o.wait > 0) { o.wait--; return; }
        var r = o.co.next(); if (r.done) o.done = true; else o.wait = (r.value || 1) - 1;
      });
      yield 1;
    }
    yield W(30);
    G.setup(G.map, B.units);
    B.cine = was;
  };

  // ------------------------------------------------------------------ the end (seat 2 calls it when the lamp goes out)
  // (Griz: "slow mo walk to the lamp by surviving villain then darkness - pause - game over <insert group name> - high score screen")
  GS.gameOver = function* (B, villain, stats) {
    var st = B.gs || (B.gs = { clicks: [], fade: 0 }), tower = G.map.def.tower;
    B.cine = true; st.mode = 'end';
    D.music(null);
    if (villain && tower) {
      yield* B.camTo(villain, 2, W(40));
      var near = [tower[0], tower[1] + 1];
      // slow: four times a step's beat, the camera with it
      var path = D.Battle.route(villain, near, false);
      villain.anim = 'walk';
      for (var i = 0; path && i < path.length; i++) {
        var q = path[i]; villain.facing = D.spr.facingFor(q[0] - villain.x, q[1] - villain.y);
        villain.tween = { fx: villain.x, fy: villain.y, fz: 0, t: 0, dur: 32, mode: null }; villain.x = q[0]; villain.y = q[1];
        for (var k = 0; k < 32; k++) { var c = D.iso.center(villain.x, villain.y, 0); D.iso.cam.x += (c.x - D.iso.cam.x) * 0.06; D.iso.cam.y += (c.y - 30 - D.iso.cam.y) * 0.06; yield 1; }
      }
      villain.anim = 'attack'; villain.animT = B.t; yield W(30);
    }
    B.lampOut = true;                                                                 // the lamp goes out: its flame (js/circles.js) and its light
    B.lights = (B.lights || []).filter(function (l) { return !(tower && l.x === tower[0] && l.y === tower[1]); });
    D.sfx('shadow');
    yield* fade(B, 1, W(70));
    yield W(90);                                                                      // the pause
    st.over = { group: GS.group(), waves: (stats && stats.waves) || 0, tier: (stats && stats.tier) || 1 };
    D.music('gameover');
    st.mode = 'gameover'; yield W(240);
    var row = { group: st.over.group, waves: st.over.waves, tier: st.over.tier, t: Date.now() };
    st.mine = GS.record(row); st.mode = 'scores';
    while (true) {
      var ck = st.clicks.shift();
      if (ck && titleHit(B, ck) === 'again') { location.search = '?gameshow'; return; }
      yield 1;
    }
  };

  // ------------------------------------------------------------------ the run held to its end (seat 2 calls it when tier 9's last wave is down, js/waves.js):
  // the lamp still lit, THE LAMP HOLDS over the group's name, the high scores with the run on them
  GS.victory = function* (B, stats) {
    var st = B.gs || (B.gs = { clicks: [], fade: 0 }), tower = G.map.def.tower;
    B.cine = true; st.mode = 'end'; st.clicks = [];
    D.music('victory');
    if (tower) yield* B.camTo({ gx: tower[0], gy: tower[1] + 2, gz: 0 }, 1.5, W(60));
    D.sfx('levelup'); B.units.forEach(function (u) { if (u.mpmon && G.standing(u)) FX.sparkle(u, 'gold', 24); });
    yield W(90);
    st.over = { group: GS.group(), waves: (stats && stats.waves) || 0, tier: (stats && stats.tier) || 9, won: true };
    st.mode = 'won'; yield W(300);
    var row = { group: st.over.group, waves: st.over.waves, tier: st.over.tier, t: Date.now() };
    st.mine = GS.record(row); st.mode = 'scores';
    while (true) {
      var ck = st.clicks.shift();
      if (ck && titleHit(B, ck) === 'again') { location.search = '?gameshow'; return; }
      yield 1;
    }
  };

  // ------------------------------------------------------------------ the overlay: the title, the scores, the fade, GAME OVER
  var BTN = {};
  function big(ctx, s, x, y, color, k) {         // the 8-bit's letters, k times their size (whole pixels)
    var w = D.textWidth(s), c = big.c || (big.c = document.createElement('canvas'));
    c.width = w + 2; c.height = 12; var x2 = c.getContext('2d'); x2.clearRect(0, 0, c.width, c.height); D.text(x2, s, 0, 0, color);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(c, 0, 0, c.width, c.height, Math.round(x - c.width * k / 2), y, c.width * k, c.height * k);
  }
  function button(ctx, id, label, x, y, w, h, on) {
    D.win8(ctx, x, y, w, h, on ? P('red', 1) : null); D.text(ctx, label, x + w / 2, y + Math.round(h / 2) - 4, on ? P('gold', 4) : P('bone', 1), 'center');
    BTN[id] = { x: x, y: y, w: w, h: h };
  }
  function titleHit(B, ck) {
    var sx = ck.x, sy = ck.y;
    for (var id in BTN) { var b = BTN[id]; if (b && sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) return id; }
    return null;
  }
  function nameEdit(B) {
    var st = B.gs; if (st.editing) return;
    st.editing = true; st.name = st.name === 'THE LOBSTAMONKEES' ? '' : st.name;
    var kd = function (e) {
      if (!st.editing) { window.removeEventListener('keydown', kd, true); return; }
      if (e.key === 'Enter' || e.key === 'Escape') { st.editing = false; if (!st.name) st.name = GS.group(); D.store.set(NAME, st.name); window.removeEventListener('keydown', kd, true); }
      else if (e.key === 'Backspace') st.name = st.name.slice(0, -1);
      else if (e.key.length === 1 && st.name.length < 22) st.name += e.key.toUpperCase();
      e.preventDefault(); e.stopPropagation();
    };
    window.addEventListener('keydown', kd, true);
  }
  GS.paintOver = function (ctx, B) {
    var st = B.gs; if (!st) return;
    BTN = {};
    var Wd = D.W, Hd = D.H;
    if (st.fade > 0) { ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, st.fade) + ')'; ctx.fillRect(0, 0, Wd, Hd); }
    if (st.ledger && G.standing(st.ledger)) ledgerLamp(ctx, B, st.ledger);
    if (st.mode === 'title') {
      ctx.fillStyle = 'rgba(10,8,16,0.55)'; ctx.fillRect(0, 0, Wd, 64);
      big(ctx, 'MONSTER PARTY', Wd / 2, 6, P('red', 4), 3);
      big(ctx, 'GAME SHOW', Wd / 2, 40, P('gold', 4), 2);
      ctx.fillStyle = 'rgba(10,8,16,0.6)'; ctx.fillRect(0, Hd - 40, Wd, 40);
      button(ctx, 'name', 'GROUP: ' + (st.name || '') + (st.editing && (B.t >> 4) & 1 ? '_' : ''), 12, Hd - 34, 220, 18, st.editing);
      button(ctx, 'tutorial', 'TUTORIAL ' + (st.tutorial ? 'ON' : 'OFF'), 240, Hd - 34, 120, 18, !!st.tutorial);
      button(ctx, 'scores', 'HIGH SCORES', Wd - 112, Hd - 34, 100, 18);
      if ((B.t >> 5) & 1) D.text(ctx, 'click the centre of the circle to begin', Wd / 2, Hd - 12, P('bone', 1), 'center');
      var cp = st.caption;
      if (cp && B.t - cp.t0 < cp.life) { var tw = Math.min(Wd - 20, D.textWidth(cp.s) + 16); D.win8(ctx, Wd / 2 - tw / 2, 70, tw, 18); D.text(ctx, cp.s, Wd / 2, 75, P('bone', 1), 'center'); }
    }
    if (st.mode === 'scores') scoresPanel(ctx, B, st.mine);
    if (st.mode === 'gameover' && st.over) {
      big(ctx, 'GAME OVER', Wd / 2, Hd / 2 - 40, P('red', 4), 3);
      big(ctx, st.over.group, Wd / 2, Hd / 2 + 4, P('gold', 4), 2);
      D.text(ctx, 'waves held: ' + st.over.waves + '   tier ' + st.over.tier, Wd / 2, Hd / 2 + 40, P('bone', 1), 'center');
    }
    if (st.mode === 'won' && st.over) {
      ctx.fillStyle = 'rgba(10,8,16,0.55)'; ctx.fillRect(0, Hd / 2 - 50, Wd, 104);
      big(ctx, 'THE LAMP HOLDS', Wd / 2, Hd / 2 - 40, P('gold', 4), 3);
      big(ctx, st.over.group, Wd / 2, Hd / 2 + 4, P('red', 4), 2);
      D.text(ctx, 'every wave held: ' + st.over.waves + '   tier ' + st.over.tier, Wd / 2, Hd / 2 + 40, P('bone', 1), 'center');
    }
    if (st.mode === 'scores' && st.over) { button(ctx, 'again', 'BACK TO THE LIGHTHOUSE', Wd / 2 - 90, Hd - 30, 180, 18); }
  };
  // the Ledger-Lamp held up over her head while the circle is open for her: a lantern on her raised hand, lit, its glow round it (screen px, at the zoom)
  function ledgerLamp(ctx, B, u) {
    var z = D.iso.zoom, c = D.iso.center(u.x, u.y, G.gzAt(u, u.x, u.y)), sc = D.iso.toScreen(c.x, c.y), top = D.spr.unitTop(u) * z;
    var x = Math.round(sc.x + 5 * z), y = Math.round(sc.y - top - 12 * z), k = Math.max(1, Math.round(z)), fl = Math.sin(B.t / 5);
    ctx.globalAlpha = 0.25 + 0.08 * fl; ctx.fillStyle = P('gold', 4); ctx.beginPath(); ctx.arc(x + 3 * k, y + 5 * k, 14 * k, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = P('outline', 0); ctx.fillRect(x, y, 7 * k, k); ctx.fillRect(x, y + 9 * k, 7 * k, k); ctx.fillRect(x, y, k, 10 * k); ctx.fillRect(x + 6 * k, y, k, 10 * k); ctx.fillRect(x + 3 * k, y - 2 * k, k, 2 * k);
    ctx.fillStyle = P('gold', 3); ctx.fillRect(x + k, y + k, 5 * k, 8 * k);
    ctx.fillStyle = P('fire', 1); ctx.fillRect(x + 2 * k, y + (fl > 0.6 ? 3 : 4) * k, 3 * k, 4 * k);
    ctx.fillStyle = P('bone', 2); ctx.fillRect(x + 3 * k, y + 5 * k, k, 2 * k);
    ctx.fillStyle = P('skin', 3); ctx.fillRect(x + 2 * k, y + 10 * k, 3 * k, 2 * k);                     // (her hand under it)
  }
  function scoresPanel(ctx, B, mine) {
    var Wd = D.W, Hd = D.H, s = GS.scores(), x = Wd / 2 - 150, y = 30, w = 300, h = Math.max(70, 40 + s.length * 14);
    D.win8(ctx, x, y, w, h);
    D.text(ctx, 'HIGH SCORES', Wd / 2, y + 8, P('gold', 4), 'center');
    if (!s.length) D.text(ctx, 'none yet: be the first', Wd / 2, y + 30, P('bone', 1), 'center');
    s.forEach(function (r, i) {
      var yy = y + 26 + i * 14, col = i === mine ? P('gold', 4) : P('bone', 1);
      D.text(ctx, (i + 1) + '.', x + 14, yy, col); D.text(ctx, r.group, x + 34, yy, col);
      D.text(ctx, r.waves + ' waves', x + w - 80, yy, col, 'right'); D.text(ctx, 'tier ' + r.tier, x + w - 14, yy, col, 'right');
    });
    if (!B.gs.over) button(ctx, 'scores', 'BACK', Wd / 2 - 40, y + h + 6, 80, 18);
  }
  // what the tutorial (js/gstutorial.js) borrows: the waits (cut short by &fast), a scripted walk, a Mascot by key
  GS._ = { W: W, walkTo: walkTo, mascot: mascot, hold: hold };
})();
