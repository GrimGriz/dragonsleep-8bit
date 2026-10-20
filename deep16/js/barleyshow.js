/* DEEP16 — Barley, shown (10-20, Griz: "please do a show (not a gallery) of the eyes needed in question, with pauses between frame and 'enter' replay"):
   the new sheet's rows (ART-75/76, barley_p2) played where the engine plays them, on the class floor, one beat after another, in slow motion -- the
   engine's clock runs one frame in SLOW, so every drawing of a row holds on the screen -- and at the end of each beat the show waits: ENTER (or E, or a
   click) plays the beat again, → goes on to the next, ← back to the one before, ↑ and ↓ slow the clock or quicken it, SPACE skips to the next without waiting.

     deep16/?barleyshow            every beat, in order · &beat=N starts at the Nth · &only=walk,swings keeps to those · &slow=N the clock (5) · &fast no pauses, no waits (the bench)

   Each beat is staged (who stands where, as its card says) and then run by the engine itself -- the walk is B.moveAlong, the blows B.attack through B.exec, Second
   Wind, Action Surge and the Dodge the ring's own commands, the potion B.useItem, the fall and the prone and the get-up what js/ui.js draws for a hero at 0 or
   flat -- so what it shows is what a fight does; the two rows no floor can stage (a hand on a thing, the win: the test floor has no barrel, and the win ends a
   fight) are played bare, and their cards say so. Each beat checks what it showed (the anims and facings the hero passed through); the last card is the tally, and
   B.barleyReport holds it (dev/bench16.js mode=barleyshow runs it headless with &fast, a FAIL for a beat that did not show). A show, not a rule: no fight reads this. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, I = D.input;
  var BS = D.barleyshow = { slow: 5 };
  var STEP = [[1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0]]; // (js/sprites.js S.FACINGS' order: S, SW, W, NW, N, NE, E, SE)
  var FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];

  BS.make = function (q) {
    q = q || '';
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var FAST = /[?&]fast\b/.test(q), L = 5;
    BS.slow = FAST ? 1 : Math.max(1, Math.min(12, +(get('slow') || 5)));
    var B = new D.Battle({ npc: { foes: ['goblin'], party: ['fighter:' + L + ':human'] },
      fightDef: D.classFight(L, { what: 'Barley, shown', intro: 'His new figure, a beat at a time, slow. ENTER plays a beat again.' }) });
    B.show = true; B.showTally = {}; B.showKind = {}; B.barleyshow = true;
    var enter0 = B.enter, tick = 0, upd0 = B.update;
    B.enter = function () {
      enter0.apply(this, arguments);
      var u = this.units.filter(function (w) { return w.side === 'party' && !w.familiar; })[0];
      u.sheet = 'barley_p2'; u.name = 'Barley'; u.feats = u.feats || {}; u.feats.secondWind = 1; u.feats.actionSurge = 1;
      if (u.weapon) u.weapon = Object.assign({}, u.weapon, { name: 'Threshing Flail', dice: '1d10', type: 'bludgeoning', kind: null, icon: null }); // (his own tool, not the floor's greatsword: content/items.json threshingflail)
      D.spr.gate(this, this.sheets().now); // (held till his sheets have come -- barley_p2 and, under its walk, barley_p0: js/sprites.js S.gate)
      this.req = null; this.co = show(this, get, FAST);
    };
    // the clock: one engine frame in BS.slow while a beat runs ("pauses between frame"); between beats, waiting on a key, every frame
    B.update = function () { tick++; if (BS.slow > 1 && !(this.req && this.req.barley) && !this.menu && tick % BS.slow) { D.ui.camera(this); return; } upd0.apply(this, arguments); };
    return B;
  };

  function* show(B, get, FAST) {
    var W = function (n) { return FAST ? 1 : n; };
    var u = B.units.filter(function (w) { return w.side === 'party' && !w.familiar; })[0], f = B.units.filter(function (w) { return w.side === 'foe'; })[0];
    f.show = true; f.name = 'the goblin'; f.hp = f.maxhp = 400; f.init = -100;
    var cx = Math.floor(G.map.w / 2), cy = Math.floor(G.map.h / 2), home = [cx, cy];
    var report = B.barleyReport = [], seen;
    D.iso.zoom = Math.max(D.iso.zoom || 1, 2.4);

    // ---- the stage: the two of them whole, Barley at home, the goblin where the beat puts it (or off the field)
    function stage(fx, fy) {
      [u, f].forEach(function (w) { w.hp = w.maxhp; w.temp = 0; w.conds = {}; w.dead = false; w.ko = false; w.reaction = 1; w.anim = 'idle'; w.animT = B.t; w.flash = 0; ['tween', 'ready', 'conc', 'proneLook', 'proneT', 'deadT'].forEach(function (k) { delete w[k]; }); });
      u.x = home[0]; u.y = home[1]; u.facing = 0;
      B.units = fx == null ? [u] : [u, f];
      if (fx != null) { f.x = fx; f.y = fy; f.facing = B.faceTo(f, u); }
      G.setup(G.map, B.units);
      B.round = 1; B.order = B.units.slice(); B.active = null; B.inv = [{ id: 'potion', n: 3 }];
      B.units.forEach(function (w) { RU.startTurn(w); });
      D.iso.lookAt(u.x, u.y, G.map.gz(u.x, u.y));
    }
    function note() { var k = u.anim + '@' + FN[u.facing % 8]; if (seen.indexOf(k) < 0) seen.push(k); }
    // a generator run inside the show: a prompt answered with its first option; what Barley is drawn doing noted at every step
    function* fire(gen) {
      var v;
      for (var k = 0; k < 20000; k++) {
        var r = gen.next(v); v = undefined; note();
        if (r.done) return r.value;
        var y = r.value;
        if (y && y.prompt) { v = y.prompt.opts[0].value; continue; }
        if (y && y.entry) continue;
        v = yield y; note();
      }
    }
    function* hold(n) { for (var k = 0; k < n; k += 4) { yield 4; note(); } } // (a row playing on its own: watched as it goes)
    function sawAnim(a) { return seen.some(function (k) { return k.split('@')[0] === a; }); }
    function sawFacing(a, fn) { return seen.indexOf(a + '@' + fn) >= 0; }
    function* walkTo(tx, ty) {
      var rm = G.reach(u, 60), p = G.path(rm, tx, ty);
      if (!p || !p.length) return false;
      yield* fire(B.moveAlong(u, p, {})); yield W(10); return true;
    }
    var dur = function (r) { return D.spr.duration(u.sheet, r) || 30; };

    var BEATS = [
      { id: 'walk', name: 'His legs', what: 'Two squares each way: S and N on the new sheet (S the art desk\'s salvage, N assembled from its attempt), then SE, NW, E and W on his old LPC sheet -- the engine keeps barley_p0 for a walk the desk has not drawn clean. Watch the hand-off as he turns.',
        run: function* () {
          stage(null);
          var legs = [[0, 2, 2], [4, 0, 0], [7, 2, 0], [3, 0, 0], [6, 2, -2], [2, 0, 0]], went = [];
          for (var i = 0; i < legs.length; i++) { var l = legs[i]; if (yield* walkTo(home[0] + l[1], home[1] + l[2])) went.push(FN[l[0]]); }
          var okW = sawFacing('walk', 'S') && sawFacing('walk', 'N') && sawFacing('walk', 'SE') && sawFacing('walk', 'E');
          return [okW, 'walked ' + went.join(', ') + '; the walk drawn ' + seen.filter(function (k) { return k.indexOf('walk@') === 0; }).map(function (k) { return k.split('@')[1]; }).join(' ')];
        } },
      { id: 'swings', name: 'The flail, twice', what: 'A goblin in reach. His first blow of the turn is the Sweep (the beater lands on frame 4); Extra Attack gives him a second, and that one is the Overhead -- the sheet\'s attack2, the turn\'s second blow. Every blow lands: the show.',
        run: function* () {
          stage(home[0] + 1, home[1] + 1); B.active = u;
          yield* fire(B.exec(u, { do: 'attack', target: f })); yield W(20);
          yield* fire(B.exec(u, { do: 'attack', target: f })); yield W(20); B.active = null;
          return [sawAnim('attack') && sawAnim('attack2'), 'played ' + seen.filter(function (k) { return /^attack/.test(k); }).join(', ')];
        } },
      { id: 'wind', name: 'Second Wind', what: 'At 10 HP he takes his Second Wind (the bonus action): bent over the flail, the breath caught, the guard back up. The heal is the engine\'s own roll.',
        run: function* () {
          stage(home[0] + 3, home[1] + 3); u.hp = 10; B.active = u;
          yield* fire(B.exec(u, { do: 'secondwind' })); yield W(10); B.active = null;
          return [sawAnim('secondwind') && u.hp > 10, 'played ' + (sawAnim('secondwind') ? 'secondwind' : 'nothing') + ', HP 10 -> ' + u.hp];
        } },
      { id: 'surge', name: 'Action Surge', what: 'Both blows spent, he surges -- set for the extra action -- and swings a third time (the Sweep again: the sheet has no third row).',
        run: function* () {
          stage(home[0] + 1, home[1] + 1); B.active = u;
          yield* fire(B.exec(u, { do: 'attack', target: f })); yield* fire(B.exec(u, { do: 'attack', target: f })); seen = [];
          yield* fire(B.exec(u, { do: 'surge' })); yield W(10);
          yield* fire(B.exec(u, { do: 'attack', target: f })); yield W(20); B.active = null;
          return [sawAnim('actionsurge') && (sawAnim('attack') || sawAnim('attack2')), 'played ' + seen.map(function (k) { return k.split('@')[0]; }).filter(function (k, i, a) { return a.indexOf(k) === i; }).join(', ')];
        } },
      { id: 'dodge', name: 'The Dodge', what: 'DODGE on the ring: the guard up, the sheet\'s Defend row (the same row his Shield would use, had he one).',
        run: function* () {
          stage(home[0] + 3, home[1] + 3); B.active = u;
          yield* fire(B.exec(u, { do: 'dodge' })); yield* hold(dur('defend') + 10); B.active = null;
          return [sawAnim('defend') && !!u.conds.dodge, 'played ' + (sawAnim('defend') ? 'defend' : 'nothing') + ', dodging ' + !!u.conds.dodge];
        } },
      { id: 'potion', name: 'A potion', what: 'A healing potion from the pack: the sheet\'s UseItem row, the thing to the mouth and down.',
        run: function* () {
          stage(home[0] + 3, home[1] + 3); u.hp = 20; B.active = u;
          yield* fire(B.useItem(u, 'potion', u)); yield* hold(10); B.active = null;
          return [sawAnim('useitem') && u.hp > 20, 'played ' + (sawAnim('useitem') ? 'useitem' : 'nothing') + ', HP 20 -> ' + u.hp];
        } },
      { id: 'hand', name: 'A hand on a thing', what: 'The Interact row -- what he plays taking the rope, a torch from the barrel, a grapple from the bucket. The test floor has none of those, so the row is played bare here.',
        run: function* () {
          stage(null); u.anim = 'interact'; u.animT = B.t; yield* hold(dur('interact') + 10);
          return [sawAnim('interact'), 'played ' + (sawAnim('interact') ? 'interact (bare)' : 'nothing')];
        } },
      { id: 'fall', name: 'Down', what: 'At 0 HP he goes down: the sheet\'s Fall row (facing SE here; S is not drawn, so facing S he borrows SE), held at its last frame. Then whole again.',
        run: function* () {
          stage(null); u.facing = 7; u.hp = 0; u.ko = true; yield* hold(dur('hurt') + 40);
          var lay = u.hp === 0 && !!D.spr.anim(u.sheet, 'hurt');
          u.hp = u.maxhp; u.ko = false; u.anim = 'idle'; u.animT = B.t; yield* hold(20);
          return [lay, lay ? 'at 0 on the hurt row, then up' : 'no hurt row'];
        } },
      { id: 'prone', name: 'Knocked flat, and up', what: 'Knocked prone (facing E): he falls through Fall 2-5 and lies at Prone 1; the prone ends and he rises through GetUp 1-6, the sheet\'s own get-up.',
        run: function* () {
          // (js/ui.js draws the fall into the prone row and the get-up off `conds.prone` as it changes -- its own clock, u.proneT; headless, nothing draws, so the check is the condition and the rows)
          stage(null); u.facing = 6; u.conds.prone = true; yield* hold(dur('prone') + 50);
          var down = !!u.conds.prone && !!D.spr.anim(u.sheet, 'prone'), drawn = !!u.proneLook;
          delete u.conds.prone; yield* hold(dur('getup') + 40);
          var rose = !u.conds.prone && !!D.spr.anim(u.sheet, 'getup');
          return [down && rose, (down ? 'flat on the prone row' : 'never flat') + ', ' + (rose ? 'then up through the get-up' : 'no get-up') + (drawn ? '' : ' (the rows the UI draws; headless, undrawn)')];
        } },
      { id: 'win', name: 'The win', what: 'The Victory row -- what the fight won plays once for every hero standing (js/battle.js finish). A win ends the floor, so the row is played bare here.',
        run: function* () {
          stage(null); u.anim = 'victory'; u.animT = B.t; yield* hold(dur('victory') + 10);
          return [sawAnim('victory'), 'played ' + (sawAnim('victory') ? 'victory (bare)' : 'nothing')];
        } }
    ];

    var only = get('only'), list = only ? BEATS.filter(function (b) { return only.split(',').indexOf(b.id) >= 0; }) : BEATS;
    var i = Math.max(0, Math.min(list.length - 1, (+(get('beat') || 1)) - 1));
    D.music('camp');
    while (i < list.length) {
      var b = list[i];
      B.clearCards(); seen = [];
      B.card(['{y}BARLEY, SHOWN  ' + (i + 1) + ' / ' + list.length + ':  ' + b.name.toUpperCase() + '{/}'].concat(D.wrap(b.what, 440).map(function (l) { return '{g}' + l + '{/}'; })), 1e9);
      yield W(50);
      var res, n0 = (B.log || []).length;
      try { res = yield* b.run(); } catch (e) { res = [false, 'threw: ' + String(e && e.message || e)]; if (window.console) console.error('barleyshow ' + b.id, e); }
      var rep = { id: b.id, name: b.name, ok: !!res[0], why: res[1], seen: seen.slice() };
      var at = report.map(function (r) { return r.id; }).indexOf(b.id); if (at >= 0) report[at] = rep; else report.push(rep);
      B.clearCards();
      B.card(['{y}' + (i + 1) + ' / ' + list.length + ':  ' + b.name.toUpperCase() + '{/}  ' + (res[0] ? '{n}SHOWN{/}' : '{r}NOT AS IT SHOULD BE{/}'), '{g}' + res[1] + '{/}'].concat(FAST ? [] : ['', '{c}ENTER{/} again   {c}RIGHT{/} next   {c}LEFT{/} back   {c}UP / DOWN{/} slower / quicker (one frame in ' + BS.slow + ')']), 1e9);
      if (FAST) { i++; continue; }
      var v = yield { barley: true };
      if (v === 'again') continue;
      if (v === 'back') { i = Math.max(0, i - 1); continue; }
      i++;
    }
    B.clearCards();
    var okN = report.filter(function (r) { return r.ok; }).length;
    B.card(['{y}BARLEY, SHOWN: ' + okN + ' OF ' + report.length + '{/}'].concat(report.map(function (r) { return (r.ok ? '{n}ok{/}  ' : '{r}NO{/}  ') + r.name + '  {g}' + r.why + '{/}'; })).concat(FAST ? [] : ['', '{c}ENTER{/} from the top   {c}LEFT{/} the last beat again']), 1e9);
    if (window.console) console.log('DEEP16 barleyshow: ' + okN + ' of ' + report.length, report);
    if (!FAST) { yield { barley: true, done: true }; B.co = show(B, get, FAST); }
  }
  // the keys between beats (the show's own request; every other request is the UI's)
  var input0 = D.ui.input;
  D.ui.input = function (B, req) {
    if (!req.barley) return input0(B, req);
    D.ui.camera(B);
    if (I.pressed('up') || I.pressed('down')) { BS.slow = Math.max(1, Math.min(12, BS.slow + (I.pressed('up') ? 1 : -1))); D.sfx('cursor'); B.card(['{c}the clock: one frame in ' + BS.slow + '{/}'], 90); return; }
    var v = I.pressed('a') || I.mouse.click ? 'again' : I.repeat('right') || I.pressed('end') ? 'next' : I.repeat('left') ? 'back' : null;
    if (v) { D.sfx(v === 'again' ? 'confirm' : 'cursor'); B.answer(req.done ? 'again' : v); }
  };
})();
