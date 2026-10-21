/* DEEP16 — Barley, shown (10-20, Griz: "please do a show (not a gallery) of the eyes needed in question, with pauses between frame and 'enter' replay"):
   his two looks played where the engine plays them, on the class floor, one beat after another, in slow motion -- the engine's clock runs one frame in
   SLOW, so every drawing of a row holds on the screen -- and at the end of each beat the show waits: ENTER (or E, or a click) plays the beat again, → goes on
   to the next, ← back to the one before, ↑ and ↓ slow the clock or quicken it, SPACE skips to the next without waiting.

     deep16/?barleyshow            every beat, in order · &look=chain or &look=coat keeps to one look · &beat=N starts at the Nth · &only=walk,swings keeps to
                                   those · &slow=N the clock (5) · &fast no pauses, no waits (the bench)

   The looks (10-20, the chain seat; Griz: "make the best of what we have, with barley barefoot until he's wearing chain shirt+ AC gear"): THE CHAIN, barley_p3
   (the art desk's ART-109, every slot its best attempt, broken ones included -- "as if it was good enough"), drawn empty-handed, his weapon drawn by the engine
   in his hands (js/sprites.js S.wield: "try code flail and battle axe implementation") -- the threshing flail, then a battleaxe; THE COAT, barley_p2 (ART-75/76,
   and ART-77 and the third pass folded in: every view filled, the SE NE E walks the least bad of attempts that each lead with one leg). The first beat is the
   rule between them: what he wears (js/save.js SV.look `mail`). Each beat is staged (who stands where, as its card says) and then run by the engine itself -- the
   walk is B.moveAlong, the blows B.attack through B.exec, Second Wind, Action Surge and the Dodge the ring's own commands, the potion B.useItem, the fall and the
   prone and the get-up what js/ui.js draws for a hero at 0 or flat -- so what it shows is what a fight does; the two rows no floor can stage (a hand on a thing,
   the win) are played bare, and their cards say so. Each beat checks what it showed (the anims and facings the hero passed through, the sheet, what the hand
   holds); the last card is the tally, and B.barleyReport holds it (dev/bench16.js mode=barleyshow runs it headless with &fast, a FAIL for a beat that did not
   show). A show, not a rule: no fight reads this. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, I = D.input;
  var BS = D.barleyshow = { slow: 5 };
  var FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
  var SHEET = { chain: 'barley_p3', coat: 'barley_p2' };
  var WPN = { // (his own tool, not the floor's greatsword: content/items.json threshingflail; the battleaxe two-handed, the SRD's versatile d10)
    flail: { id: 'threshingflail', name: 'Threshing Flail', dice: '1d10', type: 'bludgeoning', kind: null, icon: null },
    battleaxe: { id: 'battleaxe', name: 'Battleaxe', dice: '1d10', type: 'slashing', kind: 'battleaxe', icon: null }
  };

  BS.make = function (q) {
    q = q || '';
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var FAST = /[?&]fast\b/.test(q), L = 5;
    BS.slow = FAST ? 1 : Math.max(1, Math.min(12, +(get('slow') || 5)));
    var B = new D.Battle({ npc: { foes: ['goblin'], party: ['fighter:' + L + ':human'] },
      fightDef: D.classFight(L, { what: 'Barley, shown', intro: 'His two looks, a beat at a time, slow. ENTER plays a beat again.' }) });
    B.show = true; B.showTally = {}; B.showKind = {}; B.barleyshow = true;
    var enter0 = B.enter, tick = 0, upd0 = B.update;
    B.enter = function () {
      enter0.apply(this, arguments);
      var u = this.units.filter(function (w) { return w.side === 'party' && !w.familiar; })[0];
      u.sheet = SHEET.chain; u.name = 'Barley'; u.feats = u.feats || {}; u.feats.secondWind = 1; u.feats.actionSurge = 1;
      if (u.weapon) u.weapon = Object.assign({}, u.weapon, WPN.flail);
      D.spr.gate(this, this.sheets().now.concat([SHEET.chain, SHEET.coat])); // (held till both looks have come: js/sprites.js S.gate)
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

    // ---- the stage: the two of them whole, Barley at home in the beat's look holding the beat's weapon, the goblin where the beat puts it (or off the field)
    function stage(fx, fy, look, wpn) {
      [u, f].forEach(function (w) { w.hp = w.maxhp; w.temp = 0; w.conds = {}; w.dead = false; w.ko = false; w.reaction = 1; w.anim = 'idle'; w.animT = B.t; w.flash = 0; ['tween', 'ready', 'conc', 'proneLook', 'proneT', 'deadT'].forEach(function (k) { delete w[k]; }); });
      u.x = home[0]; u.y = home[1]; u.facing = 0; u.sheet = SHEET[look || 'chain']; u.weapon = Object.assign({}, u.weapon, WPN[wpn || 'flail']);
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
    var holds = function () { return D.spr.wieldOf(u); };
    var full = function (r) { var a = D.spr.anim(u.sheet, r); return !!a && !a.drawn && !a.under; };

    // the beats each look plays (`look` its sheet; the chain's weapon drawn by code, the coat's drawn on him)
    function* walkBeat() {
      stage(null, null, this.look);
      var legs = [[0, 2, 2], [4, 0, 0], [7, 2, 0], [3, 0, 0], [6, 2, -2], [2, 0, 0], [5, 0, -2], [1, 0, 0]], went = []; // ([facing, to x, to y] from home: a grid step +x is SE, +y SW)
      for (var i = 0; i < legs.length; i++) { var l = legs[i]; if (yield* walkTo(home[0] + l[1], home[1] + l[2])) went.push(FN[l[0]]); }
      var okW = ['S', 'N', 'SE', 'E', 'NE'].every(function (fn) { return sawFacing('walk', fn); }) && full('walk');
      return [okW, 'walked ' + went.join(', ') + ' on ' + u.sheet + (holds() ? ', holding the ' + holds() : '') + '; the walk drawn ' + seen.filter(function (k) { return k.indexOf('walk@') === 0; }).map(function (k) { return k.split('@')[1]; }).join(' ')];
    }
    function* swingBeat() {
      stage(home[0] + 1, home[1] + 1, this.look, this.wpn); B.active = u;
      yield* fire(B.exec(u, { do: 'attack', target: f })); yield W(20);
      yield* fire(B.exec(u, { do: 'attack', target: f })); yield W(20); B.active = null;
      var want = this.look === 'chain' ? (this.wpn || 'flail') : null;
      return [sawAnim('attack') && sawAnim('attack2') && holds() === want, 'on ' + u.sheet + (holds() ? ' holding the ' + holds() : '') + ': played ' + seen.filter(function (k) { return /^attack/.test(k); }).join(', ')];
    }
    function* windBeat() {
      stage(home[0] + 3, home[1] + 3, this.look); u.hp = 10; B.active = u;
      yield* fire(B.exec(u, { do: 'secondwind' })); yield W(10); B.active = null;
      return [sawAnim('secondwind') && u.hp > 10, 'on ' + u.sheet + ': played ' + (sawAnim('secondwind') ? 'secondwind' : 'nothing') + ', HP 10 -> ' + u.hp];
    }
    function* surgeBeat() {
      stage(home[0] + 1, home[1] + 1, this.look); B.active = u;
      yield* fire(B.exec(u, { do: 'attack', target: f })); yield* fire(B.exec(u, { do: 'attack', target: f })); seen = [];
      yield* fire(B.exec(u, { do: 'surge' })); yield W(10);
      yield* fire(B.exec(u, { do: 'attack', target: f })); yield W(20); B.active = null;
      return [sawAnim('actionsurge') && (sawAnim('attack') || sawAnim('attack2')), 'on ' + u.sheet + ': played ' + seen.map(function (k) { return k.split('@')[0]; }).filter(function (k, i, a) { return a.indexOf(k) === i; }).join(', ')];
    }
    function* handsBeat() { // the Dodge, a potion, a hand on a thing (bare), the win (bare): the rows that hold the weapon in one hand or across him
      stage(home[0] + 3, home[1] + 3, this.look); B.active = u;
      yield* fire(B.exec(u, { do: 'dodge' })); yield* hold(dur('defend') + 10);
      RU.startTurn(u); u.hp = 20; yield* fire(B.useItem(u, 'potion', u)); yield* hold(10); B.active = null;
      u.anim = 'interact'; u.animT = B.t; yield* hold(dur('interact') + 10);
      u.anim = 'victory'; u.animT = B.t; yield* hold(dur('victory') + 10);
      var got = ['defend', 'useitem', 'interact', 'victory'].filter(sawAnim);
      return [got.length === 4 && u.hp > 20, 'on ' + u.sheet + ': played ' + got.join(', ') + ' (interact and victory bare), HP 20 -> ' + u.hp];
    }
    function* downBeat() {
      stage(null, null, this.look); u.facing = this.facing; u.hp = 0; u.ko = true; yield* hold(dur('hurt') + 40);
      var lay = u.hp === 0 && !!D.spr.anim(u.sheet, 'hurt') && full('hurt');
      u.hp = u.maxhp; u.ko = false; u.anim = 'idle'; u.animT = B.t; yield* hold(20);
      return [lay, lay ? 'on ' + u.sheet + ': at 0 on the hurt row facing ' + FN[this.facing] + ', then up' : 'no hurt row drawn'];
    }
    function* proneBeat() {
      // (js/ui.js draws the fall into the prone row and the get-up off `conds.prone` as it changes -- its own clock, u.proneT; headless, nothing draws, so the check is the condition and the rows)
      stage(null, null, this.look); u.facing = this.facing; u.conds.prone = true; yield* hold(dur('prone') + 50);
      var down = !!u.conds.prone && full('prone'), drawn = !!u.proneLook;
      delete u.conds.prone; yield* hold(dur('getup') + 40);
      var rose = !u.conds.prone && full('getup');
      return [down && rose, 'on ' + u.sheet + ' facing ' + FN[this.facing] + ': ' + (down ? 'flat on the prone row' : 'never flat') + ', ' + (rose ? 'then up through the get-up' : 'no get-up') + (drawn ? '' : ' (the rows the UI draws; headless, undrawn)')];
    }

    var BEATS = [
      { id: 'mail', look: 'coat', name: 'What he wears', what: 'His look by his armour (the rule): barefoot in his coat in no armour, leather, studded or hide; the chainmail and boots in a chain shirt or better -- medium or heavy armour of AC 13 and up (the SRD\'s Chain Shirt, Scale Mail, Breastplate, Ring Mail, Half Plate, Chain Mail, Splint, Plate). Watch him change as each goes on.',
        run: function* () {
          stage(null, null, 'coat');
          var steps = [null, 'leather', 'hide', 'chainshirt', 'chainmail', 'splint', null], got = [];
          for (var i = 0; i < steps.length; i++) {
            var a = steps[i], it = a && window.DS.DATA.items[a], sh = D.save.look('barley', null, { id: 'barley', equip: { armor: a } }).sheet;
            u.sheet = sh; got.push((it ? it.name : 'no armour') + ' ' + sh.replace('barley_', ''));
            B.card(['{y}' + (it ? it.name + ' (AC ' + it.armor.base + ', ' + it.armor.type + ')' : 'No armour') + '{/}  {g}' + (sh === SHEET.chain ? 'the chain' : 'the coat') + '{/}'], W(70));
            yield* hold(W(70));
          }
          return [got.join() === 'no armour p2,Leather p2,Hide p2,Chain Shirt p3,Chain Mail p3,Splint p3,no armour p2', got.join(', ')];
        } },
      { id: 'chainwalk', look: 'chain', name: 'In mail: his legs', what: 'Two squares each way in all eight facings, holding the threshing flail the engine draws in his hands. S and N are the desk\'s new walks with their frames put in step order; SE, NE and E are its attempts that land every step on the same leg (broken, used as they are), and their mirrors.', run: walkBeat },
      { id: 'chainflail', look: 'chain', wpn: 'flail', name: 'In mail: the flail', what: 'A goblin in reach. The Sweep, then Extra Attack\'s Overhead, with the threshing flail drawn by code: the staff through both fists, the beater swinging on its link and out straight on the blow (frame 4).', run: swingBeat },
      { id: 'chainaxe', look: 'chain', wpn: 'battleaxe', name: 'In mail: a battleaxe', what: 'The same two blows with a battleaxe in his hands instead: the haft through both fists, one bearded blade at its head, the edge the way he faces.', run: swingBeat },
      { id: 'chainwind', look: 'chain', name: 'In mail: Second Wind', what: 'At 10 HP he takes his Second Wind: the standing breath, the chest lifting, the guard back up, the flail in his hands throughout.', run: windBeat },
      { id: 'chainsurge', look: 'chain', name: 'In mail: Action Surge', what: 'Both blows spent, he surges -- the grip raised high and ready -- and swings a third time.', run: surgeBeat },
      { id: 'chainhands', look: 'chain', name: 'In mail: a hand free', what: 'The Dodge (the weapon across him), a potion, a hand on a thing and the win (both bare): one fist lets go and the other keeps the flail at its guard.', run: handsBeat },
      { id: 'chaindown', look: 'chain', facing: 7, name: 'In mail: down', what: 'At 0 HP facing SE: the Fall row, the flail dropped to the floor beside him. Then whole again.', run: downBeat },
      { id: 'chainprone', look: 'chain', facing: 6, name: 'In mail: flat, and up', what: 'Knocked prone facing E: Fall 2-5 into Prone 1, the flail on the floor; the prone ends and he rises through the get-up, taking it up at the last.', run: proneBeat },
      { id: 'walk', look: 'coat', name: 'In his coat: his legs', what: 'All eight facings now on his own figure: S the desk\'s salvage, N the second shot\'s grip-fixed walk in step order, SE NE E the third pass\'s attempts, each landing every step on one leg (the least bad there is: the old LPC walk was another man).', run: walkBeat },
      { id: 'swings', look: 'coat', name: 'In his coat: the flail, twice', what: 'The Sweep and the Overhead, the flail drawn on him (the desk\'s own), the N Overhead now the second shot\'s.', run: swingBeat },
      { id: 'wind', look: 'coat', name: 'In his coat: Second Wind', what: 'The second shot\'s standing Second Wind (his "him squatting" redrawn): the breath caught on his feet, the guard back up.', run: windBeat },
      { id: 'surge', look: 'coat', name: 'In his coat: Action Surge', what: 'The second shot\'s standing Action Surge, then a third swing.', run: surgeBeat },
      { id: 'hands', look: 'coat', name: 'In his coat: a hand free', what: 'The Dodge, a potion, a hand on a thing and the win (both bare); the N Victory the second shot\'s.', run: handsBeat },
      { id: 'fall', look: 'coat', facing: 0, name: 'In his coat: down', what: 'At 0 HP facing S -- the view the desk had left open, now the second shot\'s Fall S. Then whole again.', run: downBeat },
      { id: 'prone', look: 'coat', facing: 0, name: 'In his coat: flat, and up', what: 'Knocked prone facing S: the second shot\'s Fall S into its Prone S, up through its GetUp S.', run: proneBeat }
    ];

    var only = get('only'), look = get('look'), list = BEATS.filter(function (b) { return (!only || only.split(',').indexOf(b.id) >= 0) && (!look || b.look === look || b.id === 'mail'); });
    var i = Math.max(0, Math.min(list.length - 1, (+(get('beat') || 1)) - 1));
    D.music('camp');
    while (i < list.length) {
      var b = list[i];
      B.clearCards(); seen = [];
      B.card(['{y}BARLEY, SHOWN  ' + (i + 1) + ' / ' + list.length + ':  ' + b.name.toUpperCase() + '{/}'].concat(D.wrap(b.what, 440).map(function (l) { return '{g}' + l + '{/}'; })), 1e9);
      yield W(50);
      var res;
      try { res = yield* b.run.call(b); } catch (e) { res = [false, 'threw: ' + String(e && e.message || e)]; if (window.console) console.error('barleyshow ' + b.id, e); }
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
