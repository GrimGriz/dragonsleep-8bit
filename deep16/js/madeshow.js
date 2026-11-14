/* DEEP16 -- the made things of the Coldridge, shown (2026-11-13, the makings seat): the mirror wolf and the mirror worg, the two Mr. Ripples makes where he makes in the
   mountains (js/world.js W.MADE, the Doors' table), played where the engine plays them, on the class floor, a beat at a time, the dice pinned where a beat needs them to
   fall one way (its card says so). The shape is js/seepshow.js's: at the end of each beat the show waits -- ENTER (or E, or a click) plays it again, RIGHT the next, LEFT
   the one before.

     deep16/?madeshow              every beat, in order · &only=mirrorwolf, mirrorworg, withered, fed, charged or mirrorwisp keeps to those · &beat=N starts at the Nth ·
                                   &fast no pauses (the bench)

   THE STATES (2026-11-14, the made-states seat; RULED that day -- js/seep.js THE MADE THINGS' STATES has his words): four more beats. `withered`, a mirror worg met
   three days unfed, on its Emaciated sheet; `fed`, a withered mirror wolf whose bite pulls a spell down and is normal again, and again and is charged, the sheet changing
   on screen each time; `charged`, a mirror worg that tears out a slot and bites again with the bigger die; `mirrorwisp`, the mirror wisp's three states, drawn in code.

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
    var B = new D.Battle({ npc: { foes: ['mirrorwolf', 'mirrorworg', 'mirrorwisp'], party: ['cleric:' + L + ':human', 'wizard:' + L + ':human', 'fighter:' + L + ':human'] },
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
    var cleric = cls('cleric'), wizard = cls('wizard'), fighter = cls('fighter'), mwolf = kind('mirrorwolf'), mworg = kind('mirrorworg'), mwisp = kind('mirrorwisp');
    // (&state=emaciated or overcharged, 11-13, the cutter of the wolves: the art desk drew each in three states and no rule chooses between them yet -- the two wear
    // that state's sheet for the show; a look, the blocks and the beats unchanged)
    // (since 11-14 the states are RULED and worn by rule -- the four beats below; &state= is still the look alone, on the first two beats)
    var state = get('state'), look = function () { if (state === 'emaciated' || state === 'overcharged') [mwolf, mworg].forEach(function (w) { var sh = w && w.kind + '_' + state + '_p1'; if (w && D.SHEETS && D.SHEETS[sh]) { w.sheet = sh; if (D.spr.prefetch) D.spr.prefetch([sh]); } }); };
    look();
    var keep = all.map(function (w) { return { u: w, hp: w.maxhp, slots: w.slots ? w.slots.slice() : null, glow: w.glow ? Object.assign({}, w.glow) : null }; });
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
        if (w.made0 && S.setState(B, w, 'normal')) look(); // (a made thing starts each staging normal: the states' beats lay their own on)
        w.maxhp = s.hp; w.hp = s.hp; w.temp = 0; w.conds = {}; w.dead = false; w.ko = false; w.slain = false; w.reaction = 1; w.anim = 'idle'; w.animT = B.t; w.flash = 0; w.fz = null;
        ['tween', 'ready', 'conc', 'riding', 'attached', 'master', 'lurked', 'fedN'].forEach(function (key) { delete w[key]; });
        if (s.slots) w.slots = s.slots.slice(); if (s.glow) w.glow = Object.assign({}, s.glow);
        if (w.invis) w.invis.used = false;
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
    // ---- the states (RULED 11-14): the numbers are read off the unit and the engine's own lines, the sheet off the unit
    var bite = function (w) { return w.attacks.bite; }, condOf = function (w) { return String(D.ui.condText ? D.ui.condText(w) : '').replace(/\{\/?[a-z]*\}/g, '').trim(); };
    var tell = function (w) { var a = w.attacks[Object.keys(w.attacks)[0]]; return w.madeState + ', sheet ' + w.sheet + ', HP ' + w.hp + '/' + w.maxhp + (w.temp ? ' +' + w.temp : '') + ', speed ' + w.speed + ', ' + a.name + ' ' + RU.sign(a.atk) + ' ' + a.dice; };
    var plain = function (ls) { return ls.map(function (l) { return String(l).replace(/, sheet [a-z0-9_]+/g, ''); }); }; // (a card names no sheet: the tally does)
    function* withered() {
      stage([fighter, mworg], [[0, 0], [1, 0]]); fighter.maxhp = fighter.hp = 120; var n0 = { hp: mworg.maxhp, sp: mworg.speed, atk: bite(mworg).atk, dice: bite(mworg).dice, sheet: mworg.sheet };
      say(plain(['A mirror worg as it is made: ' + tell(mworg) + '.'])); yield W(90);
      S.setState(B, mworg, 'withered'); if (D.ripple) D.ripple(mworg, { region: 'body', dur: 40 });
      say(plain(['Met three days after its making with nothing eaten, it is WITHERED: half its hit points, its speed 10 less, -2 to hit. Now: ' + tell(mworg) + '. Its bite at ' + fighter.name + ', the d20 pinned at 10.'])); yield W(120);
      setPin(10, { str: 15 }); var n = mark(); yield* go(mworg); yield W(80);
      var l = since(n), a = bite(mworg), okN = mworg.maxhp === Math.floor(n0.hp / 2) && mworg.speed === n0.sp - 10 && a.atk === n0.atk - 2 && a.dice === n0.dice, okS = mworg.sheet === 'mirrorworg_emaciated_p1', okL = l.indexOf('d20 10 ' + RU.sign(n0.atk - 2)) >= 0, okC = /WITHERED/.test(condOf(mworg));
      return [okN && okS && okL && okC && mworg.madeState === 'withered', 'made ' + n0.hp + ' HP, speed ' + n0.sp + ', bite ' + RU.sign(n0.atk) + ' ' + n0.dice + ' on ' + n0.sheet + '; withered ' + mworg.maxhp + ' HP, speed ' + mworg.speed + ', bite ' + RU.sign(a.atk) + ' ' + a.dice + ' (' + okN + ') on ' + mworg.sheet + ' (' + okS + '); the roll read ' + RU.sign(a.atk) + ' (' + okL + '); its card says ' + (condOf(mworg) || 'nothing') + ' (' + okC + ')'];
    }
    function* fed() {
      stage([cleric, mwolf, fighter], [[0, 0], [1, 0], [6, 3]]); cleric.maxhp = cleric.hp = 120; cleric.reaction = 0; var h1 = hold(cleric), base = { hp: mwolf.maxhp, sp: mwolf.speed, atk: bite(mwolf).atk, dice: bite(mwolf).dice };
      S.setState(B, mwolf, 'withered'); var w0 = tell(mwolf), sh0 = mwolf.sheet; setPin(18, { con: 15, str: 3 }); // (18: withered it is -2, and the cleric's AC is 18 -- at the 15 the other beats pin it missed)
      say(plain(['FED is its rider landing. A WITHERED mirror wolf (' + w0 + ') bites the cleric, who holds Bless: the bite pinned to hit, the STR save pinned at 3. Watch it as the spell comes down.'])); yield W(120);
      var n = mark(); yield* go(mwolf); yield W(110);
      var l1 = since(n), sh1 = mwolf.sheet, st1 = mwolf.madeState, n1 = tell(mwolf), back = st1 === 'normal' && mwolf.maxhp === base.hp && mwolf.speed === base.sp && bite(mwolf).atk === base.atk && bite(mwolf).dice === base.dice && !mwolf.temp && /has FED: withered no longer/.test(l1) && h1.ended;
      cleric.reaction = 0; var h2 = hold(cleric); RU.startTurn(mwolf); setPin(15, { con: 15, str: 3 });
      say(plain(['Withered to normal: ' + n1 + '. The cleric holds Bless again, and it bites again: normal goes to CHARGED.'])); yield W(110);
      n = mark(); yield* go(mwolf); yield W(120);
      var l2 = since(n), sh2 = mwolf.sheet, a2 = bite(mwolf), ch = mwolf.madeState === 'charged' && mwolf.temp === 5 && a2.atk === base.atk + 2 && a2.dice === S.dieUp(base.dice) && mwolf.maxhp === base.hp && /has FED: CHARGED/.test(l2) && h2.ended && /CHARGED/.test(condOf(mwolf));
      var sheets = sh0 === 'mirrorwolf_emaciated_p1' && sh1 === 'mirrorwolf_p1' && sh2 === 'mirrorwolf_overcharged_p1';
      return [back && ch && sheets, 'withered (' + w0 + '); fed, normal again: ' + n1 + ' (' + back + '); fed again, charged: ' + tell(mwolf) + ' -- 5 temporary hit points for Bless, a level-1 spell (' + ch + '); the sheets ' + [sh0, sh1, sh2].join(' > ') + ' (' + sheets + ')'];
    }
    function* charged() {
      stage([wizard, mworg, fighter], [[0, 0], [1, 0], [0, 1]]); wizard.maxhp = wizard.hp = 120; wizard.reaction = 0; fighter.maxhp = fighter.hp = 120; fighter.reaction = 0;
      wizard.slots = wizard.slots.map(function (k, i) { return i === 1 ? k : 0; }); // (only its 2nd-level slots left: the lowest slot left is a level-2 one)
      var base = { atk: bite(mworg).atk, dice: bite(mworg).dice, hp: mworg.maxhp }, lo = S.lowSlot(wizard); setPin(15, { str: 3 });
      say(plain(['CHARGED: for the rest of the fight 5 temporary hit points a level of the spell it took, +2 to hit, its damage die one step up. A mirror worg (' + tell(mworg) + ') bites the wizard, whose lowest slot left is level ' + lo + ' (STR pinned at 3).'])); yield W(120);
      var n = mark(); yield* go(mworg); yield W(110);
      var l1 = since(n), a = bite(mworg), ch = mworg.madeState === 'charged' && mworg.temp === 5 * lo && a.atk === base.atk + 2 && a.dice === S.dieUp(base.dice) && mworg.sheet === 'mirrorworg_overcharged_p1' && /has FED: CHARGED/.test(l1) && mworg.maxhp === base.hp;
      var t1 = tell(mworg); wizard.slots = wizard.slots.map(function () { return 0; }); wizard.dead = true; B.units = B.units.filter(function (w) { return w !== wizard; }); G.setup(G.map, B.units); B.cache = null; RU.startTurn(mworg); setPin(15, { str: 15 });
      say(plain(['Charged: ' + t1 + '. Its next bite, at ' + fighter.name + ': the roll at ' + RU.sign(a.atk) + ', the damage ' + a.dice + '.'])); yield W(100);
      n = mark(); yield* go(mworg); yield W(90);
      var l2 = since(n), okL = l2.indexOf('d20 15 ' + RU.sign(base.atk + 2)) >= 0 && l2.indexOf(a.dice + RU.sign(a.mod)) >= 0, stay = mworg.madeState === 'charged';
      return [ch && okL && stay, 'a level-' + lo + ' slot torn out: ' + t1 + ' (' + ch + '); its next bite rolled ' + RU.sign(base.atk + 2) + ' and ' + a.dice + RU.sign(a.mod) + ' where a worg\'s is ' + RU.sign(base.atk) + ' and ' + base.dice + RU.sign(a.mod) + ' (' + okL + '); still charged (' + stay + ')'];
    }
    function* mirrorWispStates() {
      stage([wizard, mwisp, fighter], [[0, 0], [1, 0], [5, 2]]); wizard.maxhp = wizard.hp = 120; wizard.reaction = 0;
      var sk = mwisp.attacks[Object.keys(mwisp.attacks)[0]], base = { hp: mwisp.maxhp, sp: mwisp.speed, atk: sk.atk, dice: sk.dice };
      S.setState(B, mwisp, 'withered'); var w0 = tell(mwisp), sh0 = mwisp.sheet, hi = S.highSlot(wizard); setPin(15, { con: 3 });
      say(plain(['The mirror wisp, drawn in code in its three states. WITHERED (' + w0 + '): a small light, its heart gone grey. Its Shock is pinned to hit and the wizard\'s CON save against Consume Magic pinned at 3.'])); yield W(120);
      var n = mark(); yield* go(mwisp); yield W(110);
      var l1 = since(n), sh1 = mwisp.sheet, n1 = tell(mwisp), back = mwisp.madeState === 'normal' && mwisp.maxhp === base.hp && /has FED: withered no longer/.test(l1);
      wizard.reaction = 0; var hi2 = S.highSlot(wizard); setPin(15, { con: 3 });
      say(plain(['Fed, and normal again: ' + n1 + '. It eats again: CHARGED.'])); yield W(100);
      n = mark(); yield* go(mwisp); yield W(120);
      var l2 = since(n), sh2 = mwisp.sheet, a2 = mwisp.attacks[Object.keys(mwisp.attacks)[0]], ch = mwisp.madeState === 'charged' && mwisp.temp === 5 * hi2 && a2.atk === base.atk + 2 && a2.dice === S.dieUp(base.dice) && /has FED: CHARGED/.test(l2);
      var sheets = sh0 === 'mirrorwisp_emaciated_p1' && sh1 === 'mirrorwisp_p1' && sh2 === 'mirrorwisp_overcharged_p1';
      return [back && ch && sheets, 'withered (' + w0 + '); a level-' + hi + ' slot eaten, normal: ' + n1 + ' (' + back + '); a level-' + hi2 + ' slot eaten, charged: ' + tell(mwisp) + ' (' + ch + '); the sheets ' + [sh0, sh1, sh2].join(' > ') + ' (' + sheets + ')'];
    }

    var BEATS = [
      { id: 'mirrorwolf', name: 'The mirror wolf: its bite pulls the spell down', what: 'Yours, 11-13: "choose two creatures from each random encounter list to have him mirror-make". The Doors\' table has two, the wolf and the worg. The SRD Wolf whole; its bite\'s knockdown falls on the spell its prey holds. On its own sheet since 11-13, the art desk\'s, under the mirror ripple. The seat\'s call.', run: mirrorWolf },
      { id: 'mirrorworg', name: 'The mirror worg: its bite tears out a slot', what: 'The SRD Worg whole; its bite\'s knockdown falls on a spell not yet cast: the lowest slot left. On its own sheet since 11-13, the art desk\'s, under the mirror ripple. The seat\'s call.', run: mirrorWorg },
      { id: 'withered', name: 'Withered: three days unfed', what: 'Yours, 11-14: "2 - more than 3 days without feeding they poof out of existence. Approved." -- on the desk\'s lean that one met three or more days after its making with nothing eaten is withered: half HP, speed -10, -2 to hit. On the art desk\'s Emaciated sheet.', run: withered },
      { id: 'fed', name: 'Fed: withered to normal, normal to charged', what: 'Yours, 11-14: "1 - good" -- on the desk\'s lean that fed is its rider landing, and it changes sheet right there in the fight. The mirror wolf, twice: the sheet changes on screen each time.', run: fed },
      { id: 'charged', name: 'Charged: the bigger bite', what: 'Yours, 11-14: "3 - rather than 1d6 force on the bite, HP as you said, +2 to hit, damage die steps up 1 (i.e. 1d6 becomes 1d8)". For the rest of the fight. On the art desk\'s Overcharged sheet.', run: charged },
      { id: 'mirrorwisp', name: 'The mirror wisp: its three states, drawn in code', what: 'Yours, 11-14: "0a - wisp is code drawn so we should be able to do the withered and charged variants". Its fed is Consume Magic landing (the family\'s rule, the desk\'s reading).', run: mirrorWispStates }
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
