/* DEEP16 — the grid's rules, shown (10-21 night, the grid's rules lane; his ear file of 10-21: on the antitoxin's door "heat metal concentration continues after
   target dies / bane can't be cast on a single target / antitoxin not tested", on the pudding's "Successfully ate Vivians Leather. All the weapons except crossbow in
   that link are magic."): the rules his eye wants played where the engine plays them, on the class floor, one beat after another, the dice pinned where a beat needs
   them to fall one way (its card says so). At the end of each beat the show waits: ENTER (or E, or a click) plays it again, → the next, ← the one before.

     deep16/?rulesshow             every beat, in order · &only=antitoxin,pudding,heatmetal keeps to those (a beat's id or its group) · &beat=N starts at the Nth
                                   · &fast no pauses, no waits (the bench)

   Each beat is staged (who stands where, as its card says) and then run by the engine itself -- the bite and the blows B.attack, the antitoxin B.useItem, Heat Metal
   B.exec's cast and its bonus-action flare, the housekeeping at a turn's end B.sweep -- so what it shows is what a fight does. A hero's hit points are made deep for a
   beat that would drop them (its card says so). Each beat checks what it showed; the last card is the tally, and B.rulesReport holds it (dev/bench16.js mode=rules1021b
   runs it headless with &fast, a FAIL for a beat that did not show). A show, not a rule: no fight reads this file, and the pins are the show's battle's only. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, I = D.input;
  var RS = D.rulesshow = {};

  RS.make = function (q) {
    q = q || '';
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var FAST = /[?&]fast\b/.test(q), L = 5;
    var B = new D.Battle({ npc: { foes: ['giantspider', 'pudding', 'hobgoblin'], party: ['cleric:' + L + ':human', 'bard:' + L + ':human'] },
      fightDef: D.classFight(L, { what: 'The grid\'s rules, shown', intro: 'A beat at a time. ENTER plays a beat again.' }) });
    B.rulesshow = true;
    var enter0 = B.enter;
    B.enter = function () { enter0.apply(this, arguments); this.req = null; this.co = show(this, get, FAST); };
    return B;
  };

  function* show(B, get, FAST) {
    var W = function (n) { return FAST ? 1 : n * 2; }; // (time to read each card before the next blow)
    var all = B.units.slice(), party = all.filter(function (w) { return w.side === 'party' && !w.familiar; }), foes = all.filter(function (w) { return w.side === 'foe'; });
    var cleric = party.filter(function (w) { return w.cls === 'cleric'; })[0], bard = party.filter(function (w) { return w.cls === 'bard'; })[0];
    var kind = function (k) { return foes.filter(function (w) { return w.kind === k; })[0]; };
    var spider = kind('giantspider'), pudding = kind('pudding'), hob = kind('hobgoblin');
    var keep = all.map(function (w) { return { u: w, hp: w.maxhp, baseAC: w.baseAC, armored: w.armored, metalArmor: w.metalArmor, weapon: w.weapon, equip: w.src && w.src.equip ? Object.assign({}, w.src.equip) : null, slots: w.slots ? w.slots.slice() : null, known: w.known ? w.known.slice() : null }; });
    var cx = Math.floor(G.map.w / 2), cy = Math.floor(G.map.h / 2);
    var report = B.rulesReport = [];
    D.iso.zoom = Math.max(D.iso.zoom || 1, 2.4);

    // ---- the dice: pinned for a beat, and only while this battle is the one up. pin.hit: every d20 outside a save (an attack's); pin.saves: a save's d20s in
    // order, from the first again at each save (one die for a plain save, two for one with advantage)
    var d0 = D.d, save0 = RU.save, inSave = 0, k = 0, pin = { hit: null, saves: null };
    var saves = []; // (every save the show's battle made, in order: a beat reads its own dice off it)
    RU.save = function () { var k0 = k; inSave++; k = 0; try { var r = save0.apply(this, arguments); if (D.battle === B) saves.push(r); return r; } finally { inSave--; k = k0; } };
    D.d = function (n) {
      if (D.battle === B && n === 20) {
        if (inSave && pin.saves && k < pin.saves.length) return pin.saves[k++];
        if (!inSave && pin.hit != null) return pin.hit;
      }
      return d0.apply(this, arguments);
    };
    function setPin(hit, saves) { pin.hit = hit; pin.saves = saves || null; }

    // ---- the stage: the beat's own on the field, whole and as they came, where the beat puts them
    function stage(list, at) {
      keep.forEach(function (s) {
        var w = s.u; w.maxhp = s.hp; w.hp = s.hp; w.temp = 0; w.conds = {}; w.dead = false; w.ko = false; w.reaction = 1; w.anim = 'idle'; w.animT = B.t; w.flash = 0;
        ['tween', 'ready', 'conc', 'corrodedAC', 'armorMagic'].forEach(function (key) { delete w[key]; });
        w.baseAC = s.baseAC; w.armored = s.armored; w.metalArmor = s.metalArmor; w.weapon = s.weapon;
        if (s.equip) w.src.equip = Object.assign({}, s.equip); if (s.slots) w.slots = s.slots.slice(); if (s.known) w.known = s.known.slice();
      });
      B.units = list.slice();
      list.forEach(function (w, i) { w.x = cx + at[i][0]; w.y = cy + at[i][1]; });
      list.forEach(function (w) { var o = list.filter(function (x) { return x !== w; })[0]; if (o) w.facing = B.faceTo(w, o); });
      G.setup(G.map, B.units);
      B.round = 1; B.order = B.units.slice(); B.active = null; B.inv = [{ id: 'antitoxin', n: 1 }];
      B.units.forEach(function (w) { RU.startTurn(w); });
      var mx = list.reduce(function (a, w) { return a + w.x; }, 0) / list.length, my = list.reduce(function (a, w) { return a + w.y; }, 0) / list.length;
      D.iso.lookAt(mx, my, G.map.gz(cx, cy)); // (between the beat's own, so both are on the screen)
      setPin(null, null);
    }
    // a generator run inside the show: a prompt answered with its first option
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
    var turn = function (w) { RU.startTurn(w); B.active = w; };
    var say = function (lines, n) { B.card(lines.map(function (l) { return '{c}' + l + '{/}'; }), W(n || 90)); };

    // ---- the beats
    function* antitoxin() {
      // the giant spider's bite (SRD 5.1: a CON save DC 11, 2d8 poison, half on a success), twice at the cleric: the bite pinned to hit, the save's d20s 4 then 15
      stage([cleric, spider], [[0, 0], [1, 0]]); setPin(15, [4, 15]);
      say(['The cleric, no antitoxin: the spider bites. The bite is pinned to hit; the save\'s dice to 4, then 15.']); yield W(60);
      var s1 = saves.length, hp1 = cleric.hp; turn(spider); yield* fire(B.attack(spider, cleric, spider.attacks.bite)); B.active = null; yield W(40);
      var sv1 = saves.slice(s1).pop(), one = !!sv1 && sv1.rolls.length === 1 && sv1.rolls[0] === 4 && !sv1.ok, lost1 = hp1 - cleric.hp;
      cleric.hp = cleric.maxhp; say(['Now the cleric drinks the antitoxin (ITEM), and the spider bites again on the same dice.']); yield W(60);
      turn(cleric); yield* fire(B.useItem(cleric, 'antitoxin', cleric)); B.active = null; yield W(40);
      var drank = !!cleric.conds.antitoxin, hp2 = cleric.hp, s2 = saves.length; turn(spider); yield* fire(B.attack(spider, cleric, spider.attacks.bite)); B.active = null; yield W(60);
      var sv2 = saves.slice(s2).pop(), two = !!sv2 && sv2.rolls.length === 2 && sv2.ok && /antitoxin/.test(RU.saveText(sv2)), lost2 = hp2 - cleric.hp;
      return [drank && one && two, (one ? 'without it one die, 4: failed, ' + lost1 + ' lost' : 'the first save not as pinned') + '; ' + (drank ? 'the antitoxin on (the bar reads it)' : 'no antitoxin on') + '; ' + (two ? 'with it two dice, 4 and 15 (advantage: antitoxin): saved, ' + lost2 + ' lost' : 'the second save without the antitoxin\'s advantage')];
    }
    function* puddingWeapon() {
      // the cleric's plain mace (bludgeoning: no split) at the pudding, three blows pinned to land: the Corrosive Form burns the striker; the mace -1, -2, then eaten through
      stage([cleric, pudding], [[0, 0], [1, 0]]); cleric.maxhp = cleric.hp = 200; setPin(15, null);
      say(['The cleric\'s plain mace at the black pudding, three blows pinned to land (the cleric\'s hit points deep for the show).']); yield W(60);
      var n = mark(), w0 = cleric.weapon && cleric.weapon.name, magic0 = !!(cleric.weapon && cleric.weapon.magic);
      for (var i = 0; i < 3; i++) { turn(cleric); yield* fire(B.attack(cleric, pudding, cleric.weapon)); B.active = null; yield W(50); }
      var l = since(n), gone = /eaten through and comes apart/.test(l) && cleric.src.equip.weapon == null, burned = (l.match(/burned by the pudding/g) || []).length;
      return [!magic0 && /eaten by the acid: -1/.test(l) && /eaten by the acid: -2/.test(l) && gone && burned === 3, 'the ' + String(w0).toLowerCase() + (magic0 ? ' (MAGIC: the door is wrong)' : ' (plain)') + ': -1, -2, ' + (gone ? 'then eaten through, ' + (cleric.weapon ? cleric.weapon.name.toLowerCase() : 'nothing') + ' after' : 'never eaten through') + '; burned by its touch ' + burned + ' times'];
    }
    function* puddingArmour() {
      // the pudding's pseudopod at the cleric in plain chain mail, three bites pinned to land: AC -1, -2, then the mail eaten through (the shield still counts)
      stage([cleric, pudding], [[0, 0], [1, 0]]); cleric.maxhp = cleric.hp = 200; setPin(15, null);
      var ac0 = RU.ac(cleric);
      say(['The pudding\'s pseudopod at the cleric in plain chain mail, three bites pinned to land (AC ' + ac0 + ', the cleric\'s hit points deep for the show).']); yield W(60);
      var n = mark(), acs = [];
      for (var i = 0; i < 3; i++) { turn(pudding); yield* fire(B.attack(pudding, cleric, pudding.attacks.pseudopod)); B.active = null; acs.push(RU.ac(cleric)); yield W(50); }
      var l = since(n), gone = /eaten through and falls away/.test(l) && cleric.src.equip.armor == null;
      return [acs[0] === ac0 - 1 && acs[1] === ac0 - 2 && gone && acs[2] < ac0 - 2, 'AC ' + ac0 + ' -> ' + acs.join(' -> ') + (gone ? ' (the mail gone)' : ' (the mail never eaten through)')];
    }
    function* puddingMagic() {
      // the same three blows with the mace made +1 (magic), and three bites on the mail made magic: neither is eaten
      stage([cleric, pudding], [[0, 0], [1, 0]]); cleric.maxhp = cleric.hp = 200; setPin(15, null);
      cleric.weapon = Object.assign({}, cleric.weapon, { name: cleric.weapon.name + ' +1', magic: true, atk: cleric.weapon.atk + 1, mod: (cleric.weapon.mod || 0) + 1 }); cleric.armorMagic = true;
      var ac0 = RU.ac(cleric);
      say(['The same, the mace made +1 and the mail magic: the acid eats neither.']); yield W(60);
      var n = mark();
      for (var i = 0; i < 3; i++) { turn(cleric); yield* fire(B.attack(cleric, pudding, cleric.weapon)); B.active = null; yield W(30); turn(pudding); yield* fire(B.attack(pudding, cleric, pudding.attacks.pseudopod)); B.active = null; yield W(30); }
      var l = since(n), held = !/eaten/.test(l) && !cleric.weapon.corroded && RU.ac(cleric) === ac0 && cleric.src.equip.weapon != null;
      delete cleric.armorMagic;
      return [held, held ? 'the mace +1 and the magic mail whole after three blows and three bites, AC ' + ac0 : 'the acid ate magic: ' + (l.match(/eaten[^|]*/g) || []).slice(0, 2).join('; ')];
    }
    function* heatMetal() {
      // the bard's Heat Metal on the hobgoblin's longsword (no foe sheet marks its armour metal yet: the grimoire's M.metalArmor reads a hero's gear); the bard's bonus action flares it the next turn; the cleric fells it -- the bard lets go, no flare, no END
      stage([bard, hob, cleric], [[-2, 0], [1, 0], [2, 1]]); setPin(15, [3]); hob.maxhp = hob.hp = 80;
      if ((bard.known || []).indexOf('heatmetal') < 0) (bard.known = bard.known || []).push('heatmetal');
      bard.slots = [4, 3, 2, 0, 0, 0, 0, 0, 0];
      say(['The bard heats the hobgoblin\'s longsword. Its saves are pinned to fail (its hit points deep for the show).']); yield W(60);
      var n = mark(); turn(bard); yield* fire(B.exec(bard, { do: 'cast', id: 'heatmetal', slot: 2, target: hob })); B.active = null; yield W(40);
      var held = !!(bard.conc && bard.conc.id === 'heatmetal' && hob.conds.heated);
      B.round++; turn(bard);
      var again = (D.magic.list(B, bard) || []).filter(function (e) { return e.id === 'heatmetal' && e.g && e.g.again; })[0];
      say(['The bard\'s next turn: the bonus action flares the metal again.']); yield W(40);
      if (again) { yield* fire(B.exec(bard, { do: 'cast', id: 'heatmetal', slot: again.slot, target: hob })); yield W(40); }
      B.active = null;
      say(['The cleric fells the hobgoblin. Its turn ends: what it held is swept.']); yield W(40);
      hob.hp = 1; turn(cleric); yield* fire(B.attack(cleric, hob, cleric.weapon)); B.active = null; B.sweep(); yield W(40);
      B.round++; turn(bard);
      var l = since(n), free = !bard.conc && /lets go of Heat Metal \(nothing left to hold\)/.test(l), endOn = (B.commands(bard) || []).some(function (c) { return c.id === 'endconc'; });
      var flare = (D.magic.list(B, bard) || []).some(function (e) { return e.id === 'heatmetal' && e.g && e.g.again; });
      B.active = null;
      return [held && !!again && hob.dead && free && !endOn && !flare, (held ? 'heated' : 'never heated') + ', ' + (again ? 'flared again' : 'no flare the next turn') + ', the hobgoblin ' + (hob.dead ? 'dead' : 'up') + '; the bard ' + (free ? 'let go (nothing left to hold)' : 'still holding ' + (bard.conc ? bard.conc.name : '?')) + ', END on the ring ' + endOn + ', the flare offered ' + flare];
    }

    var BEATS = [
      { id: 'antitoxin', group: 'antitoxin', name: 'The antitoxin', what: 'A giant spider\'s bite is a CON save against poison (DC 11; 2d8 poison, half on a save). Without the antitoxin the cleric rolls one die; with it, two, and keeps the better -- the SRD\'s advantage on saves against poison. The bar reads antitoxin while it lasts (the fight).', run: antitoxin },
      { id: 'puddingweapon', group: 'pudding', name: 'The pudding and a plain weapon', what: 'The cleric\'s mace is plain (nothing magic in this party): each blow that lands on the black pudding burns the cleric (its Corrosive Form, 1d8 acid) and eats the mace, -1 and -2 to its damage, and the third eats it through -- gone, fists after.', run: puddingWeapon },
      { id: 'puddingarmour', group: 'pudding', name: 'The pudding and plain armour', what: 'Its pseudopod on the cleric\'s plain chain mail: -1 AC, -2, and the third bite eats it through -- the mail gone, the AC what it is without it (the shield still counts).', run: puddingArmour },
      { id: 'puddingmagic', group: 'pudding', name: 'The pudding and magic', what: 'The same blows and bites with the mace made +1 and the mail magic: the acid eats neither (a magic weapon and magic armour are never eaten).', run: puddingMagic },
      { id: 'heatmetal', group: 'heatmetal', name: 'Heat Metal ends with the one it heats', what: 'The bard heats the hobgoblin\'s longsword and flares it with a bonus action the next turn. The cleric fells the hobgoblin: at its turn\'s end the bard lets go of Heat Metal (nothing left to hold) -- no flare offered, no END HEAT METAL on the ring, and the bard is free to concentrate on something else.', run: heatMetal }
    ];

    var only = get('only'), list = BEATS.filter(function (b) { return !only || only.split(',').some(function (o) { return o === b.id || o === b.group; }); });
    var i = Math.max(0, Math.min(list.length - 1, (+(get('beat') || 1)) - 1));
    while (i < list.length) {
      var b = list[i];
      B.clearCards();
      B.card(['{y}THE GRID\'S RULES, SHOWN  ' + (i + 1) + ' / ' + list.length + ':  ' + b.name.toUpperCase() + '{/}'].concat(D.wrap(b.what, 440).map(function (l) { return '{g}' + l + '{/}'; })), 1e9);
      yield W(60);
      var res;
      try { res = yield* b.run.call(b); } catch (e) { res = [false, 'threw: ' + String(e && e.message || e)]; if (window.console) console.error('rulesshow ' + b.id, e); }
      setPin(null, null);
      var rep = { id: b.id, name: b.name, ok: !!res[0], why: res[1], log: (B.log || []).slice(-40).join(' | ') };
      var at = report.map(function (r) { return r.id; }).indexOf(b.id); if (at >= 0) report[at] = rep; else report.push(rep);
      B.clearCards();
      B.card(['{y}' + (i + 1) + ' / ' + list.length + ':  ' + b.name.toUpperCase() + '{/}  ' + (res[0] ? '{n}SHOWN{/}' : '{r}NOT AS IT SHOULD BE{/}'), '{g}' + res[1] + '{/}'].concat(FAST ? [] : ['', '{c}ENTER{/} again   {c}RIGHT{/} next   {c}LEFT{/} back']), 1e9);
      if (FAST) { i++; continue; }
      var v = yield { rulesshow: true };
      if (v === 'again') continue;
      if (v === 'back') { i = Math.max(0, i - 1); continue; }
      i++;
    }
    B.clearCards();
    var okN = report.filter(function (r) { return r.ok; }).length;
    B.card(['{y}THE GRID\'S RULES, SHOWN: ' + okN + ' OF ' + report.length + '{/}'].concat(report.map(function (r) { return (r.ok ? '{n}ok{/}  ' : '{r}NO{/}  ') + r.name + '  {g}' + r.why + '{/}'; })).concat(FAST ? [] : ['', '{c}ENTER{/} from the top   {c}LEFT{/} the last beat again']), 1e9);
    if (window.console) console.log('DEEP16 rulesshow: ' + okN + ' of ' + report.length, report);
    if (!FAST) { var v2 = yield { rulesshow: true, done: true }; B.co = show(B, get, FAST); }
  }
  // the keys between beats (the show's own request; every other request is the UI's)
  var input0 = D.ui.input;
  D.ui.input = function (B, req) {
    if (!req.rulesshow) return input0(B, req);
    D.ui.camera(B);
    var v = I.pressed('a') || I.mouse.click ? 'again' : I.repeat('right') || I.pressed('end') ? 'next' : I.repeat('left') ? 'back' : null;
    if (v) { D.sfx(v === 'again' ? 'confirm' : 'cursor'); B.answer(req.done ? 'again' : v); }
  };
})();
