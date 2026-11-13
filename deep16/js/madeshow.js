/* DEEP16 -- the made things of the Coldridge, shown (2026-11-13, the makings seat): the mirror wolf and the mirror worg, the two Mr. Ripples makes where he makes in the
   mountains (js/world.js W.MADE, the Doors' table), played where the engine plays them, on the class floor, a beat at a time, the dice pinned where a beat needs them to
   fall one way (its card says so). The shape is js/seepshow.js's: at the end of each beat the show waits -- ENTER (or E, or a click) plays it again, RIGHT the next, LEFT
   the one before.

     deep16/?madeshow              both beats, in order · &only=mirrorwolf or mirrorworg keeps to one · &beat=N starts at the Nth · &fast no pauses (the bench)

   Each beat is staged (who stands where, and the spell one of them holds, as its card says) and then run by the engine itself -- a creature's whole turn is AI.turn -- so
   what it shows is what a fight does. Each beat checks what it showed; B.madeReport holds the tally (dev/bench16.js mode=made1113 runs it headless with &fast).
   A show, not a rule: no fight reads this file, and the pins are the show's battle's only. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, I = D.input;
  var MS = D.madeshow = {};

  MS.make = function (q) {
    q = q || '';
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var FAST = /[?&]fast\b/.test(q), L = 3;
    var B = new D.Battle({ npc: { foes: ['mirrorwolf', 'mirrorworg'], party: ['cleric:' + L + ':human', 'wizard:' + L + ':human', 'fighter:' + L + ':human'] },
      fightDef: D.classFight(L, { what: 'The made things of the Coldridge, shown', intro: 'A beat at a time. ENTER plays a beat again.' }) });
    B.madeshow = true;
    var enter0 = B.enter;
    B.enter = function () { enter0.apply(this, arguments); this.req = null; this.co = show(this, get, FAST); };
    return B;
  };

  function* show(B, get, FAST) {
    var S = D.seep, AI = D.ai;
    var W = function (n) { return FAST ? 1 : n * 2; };
    var all = B.units.slice(), party = all.filter(function (w) { return w.side === 'party' && !w.familiar; }), foes = all.filter(function (w) { return w.side === 'foe'; });
    var cls = function (c) { return party.filter(function (w) { return w.cls === c; })[0]; }, kind = function (k) { return foes.filter(function (w) { return w.kind === k; })[0]; };
    var cleric = cls('cleric'), wizard = cls('wizard'), fighter = cls('fighter'), mwolf = kind('mirrorwolf'), mworg = kind('mirrorworg');
    var keep = all.map(function (w) { return { u: w, hp: w.maxhp, slots: w.slots ? w.slots.slice() : null }; });
    var cx = Math.floor(G.map.w / 2), cy = Math.floor(G.map.h / 2);
    var report = B.madeReport = [];
    D.iso.zoom = Math.max(D.iso.zoom || 1, 2.4);
    B.dark = false;

    // ---- the dice: pinned for a beat, and only while this battle is the one up. A save is pinned by its ability (the blow's own concentration save is CON, the bite's
    // rider STR: a beat needs them to fall different ways)
    var d0 = D.d, save0 = RU.save, inSave = [], pin = { hit: null, saves: null };
    RU.save = function (u, ab) { inSave.push(ab); try { return save0.apply(this, arguments); } finally { inSave.pop(); } };
    D.d = function (n) {
      if (D.battle === B && n === 20) {
        var ab = inSave[inSave.length - 1];
        if (ab && pin.saves && pin.saves[ab] != null) return pin.saves[ab];
        if (!ab && pin.hit != null) return pin.hit;
      }
      return d0.apply(this, arguments);
    };
    function setPin(hit, saves) { pin.hit = hit; pin.saves = saves || null; }

    function stage(list, at) {
      keep.forEach(function (s) {
        var w = s.u;
        w.maxhp = s.hp; w.hp = s.hp; w.temp = 0; w.conds = {}; w.dead = false; w.ko = false; w.slain = false; w.reaction = 1; w.anim = 'idle'; w.animT = B.t; w.flash = 0;
        ['tween', 'ready', 'conc', 'riding', 'attached', 'master'].forEach(function (key) { delete w[key]; });
        if (s.slots) w.slots = s.slots.slice();
      });
      B.units = list.slice();
      list.forEach(function (w, i) { w.x = cx + at[i][0]; w.y = cy + at[i][1]; });
      list.forEach(function (w) { var o = list.filter(function (x) { return x !== w; })[0]; if (o) w.facing = B.faceTo(w, o); });
      G.setup(G.map, B.units); B.cache = null;
      B.round = 1; B.order = B.units.slice(); B.active = null;
      B.units.forEach(function (w) { RU.startTurn(w); });
      var mx = list.reduce(function (a, w) { return a + w.x; }, 0) / list.length, my = list.reduce(function (a, w) { return a + w.y; }, 0) / list.length;
      D.iso.lookAt(mx, my, G.map.gz(cx, cy));
      setPin(null, null);
    }
    function* fire(gen) {
      var v;
      for (var n = 0; n < 20000; n++) {
        var r = gen.next(v); v = undefined;
        if (r.done) return r.value;
        var y = r.value;
        if (y && y.prompt) { v = y.prompt.opts[0].value; continue; }
        if (y && y.entry) continue;
        v = yield y;
      }
    }
    var mark = function () { return (B.log || []).length; };
    var since = function (n) { return (B.log || []).slice(n).join(' | ').replace(/\{\/?[a-z]*\}/g, ''); };
    var say = function (lines, n) { B.card(lines.map(function (l) { return '{c}' + l + '{/}'; }), W(n || 90)); };
    function* go(w) { RU.startTurn(w); B.active = w; yield* fire(AI.turn(B, w)); B.active = null; } // (its whole turn, the engine's)
    var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
    // (the spell held: staged, not cast -- the beat is what the bite does to it. Its ending is the engine's own, D.magic.endConc)
    function hold(w) { var st = { ended: false }; w.conc = { id: 'bless', name: 'Bless', undo: function () { st.ended = true; } }; return st; }

    // ---- the beats
    function* mirrorWolf() {
      stage([cleric, mwolf, fighter], [[0, 0], [1, 0], [6, 3]]); cleric.maxhp = cleric.hp = 120; cleric.reaction = 0; var h1 = hold(cleric); setPin(15, { con: 15, str: 3 });
      say(['The mirror wolf: the wolf as Mr. Ripples makes things. A wolf\'s bite pulls a body down (STR DC 11 or prone). The mirror wolf\'s pulls down the spell its prey is holding. The cleric holds Bless; the bite is pinned to hit, the blow\'s own concentration save (CON) pinned to hold, the STR save pinned at 3.']); yield W(110);
      var n = mark(); yield* go(mwolf); yield W(80);
      var l1 = since(n), down1 = /pulls it down/.test(l1) && h1.ended && !cleric.conc && !cleric.conds.prone;
      stage([cleric, mwolf, fighter], [[0, 0], [1, 0], [6, 3]]); cleric.maxhp = cleric.hp = 120; cleric.reaction = 0; var h2 = hold(cleric); setPin(15, { con: 15, str: 15 });
      say(['Again, the STR save pinned at 15: the spell is kept, and the cleric is not knocked down either -- the bite\'s one rider was spent on the spell.']); yield W(70);
      n = mark(); yield* go(mwolf); yield W(70);
      var l2 = since(n), kept = !h2.ended && !!cleric.conc && !cleric.conds.prone && /HOLDS/.test(l2);
      stage([fighter, mwolf], [[0, 0], [1, 0]]); fighter.maxhp = fighter.hp = 120; setPin(15, { str: 3 });
      say(['And at ' + fighter.name + ', who holds no spell: knocked prone, as under any wolf.']); yield W(60);
      n = mark(); yield* go(mwolf); yield W(70);
      var l3 = since(n), prone = !!fighter.conds.prone && /KNOCKED PRONE/.test(l3) && !/pulls it down/.test(l3);
      return [down1 && kept && prone, 'STR 3: Bless pulled down (' + (h1.ended && !/KNOCKED PRONE/.test(l1)) + '), the cleric on their feet (' + !/KNOCKED PRONE/.test(l1) + '); STR 15: Bless kept, no fall (' + kept + '); at the fighter, no spell held: knocked prone (' + prone + ')'];
    }
    function* mirrorWorg() {
      stage([wizard, mworg, fighter], [[0, 0], [1, 0], [6, 3]]); wizard.maxhp = wizard.hp = 120; wizard.reaction = 0; setPin(15, { str: 3 });
      var s0 = wizard.slots.slice(), lo = S.lowSlot(wizard);
      say(['The mirror worg: a worg\'s bite pulls a body down (STR DC 13 or prone). The mirror worg\'s tears out a spell not yet cast: STR DC 13 (pinned at 3) or the LOWEST spell slot left is gone, and its prey stays up. The wizard\'s slots: ' + s0.join('/') + '.']); yield W(110);
      var n = mark(); yield* go(mworg); yield W(80);
      var l1 = since(n), s1 = wizard.slots.slice(), tore = s1[lo - 1] === s0[lo - 1] - 1 && sum(s1) === sum(s0) - 1 && /tears it out/.test(l1) && !wizard.conds.prone;
      setPin(15, { str: 15 }); wizard.reaction = 0; say(['Again, the save pinned at 15: every slot kept, and no fall.']); yield W(60);
      n = mark(); yield* go(mworg); yield W(70);
      var l2 = since(n), s2 = wizard.slots.slice(), kept = s2.join('/') === s1.join('/') && /HOLDS/.test(l2) && !wizard.conds.prone;
      stage([fighter, mworg], [[0, 0], [1, 0]]); fighter.maxhp = fighter.hp = 120; setPin(15, { str: 3 });
      say(['And at ' + fighter.name + ', who has no magic: knocked prone, as under any worg.']); yield W(60);
      n = mark(); yield* go(mworg); yield W(70);
      var l3 = since(n), prone = !!fighter.conds.prone && /KNOCKED PRONE/.test(l3) && !/tears it out/.test(l3);
      return [tore && kept && prone, 'slots ' + s0.join('/') + ' to ' + s1.join('/') + ': a level ' + lo + ' slot torn out, the wizard on their feet (' + tore + '); on a 15, kept (' + s2.join('/') + ', ' + kept + '); at the fighter, no slot: knocked prone (' + prone + ')'];
    }

    var BEATS = [
      { id: 'mirrorwolf', name: 'The mirror wolf: its bite pulls the spell down', what: 'Yours, 11-13: "choose two creatures from each random encounter list to have him mirror-make". The Doors\' table has two, the wolf and the worg. The SRD Wolf whole; its bite\'s knockdown falls on the spell its prey holds. On the wolf\'s own sheet under the mirror ripple. The seat\'s call.', run: mirrorWolf },
      { id: 'mirrorworg', name: 'The mirror worg: its bite tears out a slot', what: 'The SRD Worg whole; its bite\'s knockdown falls on a spell not yet cast: the lowest slot left. On the worg\'s own sheet under the mirror ripple. The seat\'s call.', run: mirrorWorg }
    ];

    var only = get('only'), list = BEATS.filter(function (b) { return !only || only.split(',').some(function (o) { return o === b.id; }); });
    var i = Math.max(0, Math.min(list.length - 1, (+(get('beat') || 1)) - 1));
    while (i < list.length) {
      var b = list[i];
      B.clearCards();
      B.card(['{y}THE MADE THINGS OF THE COLDRIDGE  ' + (i + 1) + ' / ' + list.length + ':  ' + b.name.toUpperCase() + '{/}'].concat(D.wrap(b.what, 440).map(function (l) { return '{g}' + l + '{/}'; })), 1e9);
      yield W(60);
      var res;
      try { res = yield* b.run.call(b); } catch (e) { res = [false, 'threw: ' + String(e && e.message || e)]; if (window.console) console.error('madeshow ' + b.id, e); }
      setPin(null, null);
      var rep = { id: b.id, name: b.name, ok: !!res[0], why: res[1], log: (B.log || []).slice(-40).join(' | ') };
      var at = report.map(function (r) { return r.id; }).indexOf(b.id); if (at >= 0) report[at] = rep; else report.push(rep);
      B.clearCards();
      B.card(['{y}' + (i + 1) + ' / ' + list.length + ':  ' + b.name.toUpperCase() + '{/}  ' + (res[0] ? '{n}SHOWN{/}' : '{r}NOT AS IT SHOULD BE{/}'), '{g}' + res[1] + '{/}'].concat(FAST ? [] : ['', '{c}ENTER{/} again   {c}RIGHT{/} next   {c}LEFT{/} back']), 1e9);
      if (FAST) { i++; continue; }
      var v = yield { madeshow: true };
      if (v === 'again') continue;
      if (v === 'back') { i = Math.max(0, i - 1); continue; }
      i++;
    }
    B.clearCards();
    var okN = report.filter(function (r) { return r.ok; }).length;
    B.card(['{y}THE MADE THINGS OF THE COLDRIDGE: ' + okN + ' OF ' + report.length + '{/}'].concat(report.map(function (r) { return (r.ok ? '{n}ok{/}  ' : '{r}NO{/}  ') + r.name + '  {g}' + r.why + '{/}'; })).concat(FAST ? [] : ['', '{c}ENTER{/} from the top   {c}LEFT{/} the last beat again']), 1e9);
    if (!FAST) { yield { madeshow: true, done: true }; B.co = show(B, get, FAST); }
  }
  var input0 = D.ui.input;
  D.ui.input = function (B, req) {
    if (!req.madeshow) return input0(B, req);
    D.ui.camera(B);
    var v = I.pressed('a') || I.mouse.click ? 'again' : I.repeat('right') || I.pressed('end') ? 'next' : I.repeat('left') ? 'back' : null;
    if (v) { D.sfx(v === 'again' ? 'confirm' : 'cursor'); B.answer(req.done ? 'again' : v); }
  };
})();
