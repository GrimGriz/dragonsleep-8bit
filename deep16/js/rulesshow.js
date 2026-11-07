/* DEEP16 — the grid's rules, shown (10-21 night, the grid's rules lane; his ear file of 10-21: on the antitoxin's door "heat metal concentration continues after
   target dies / bane can't be cast on a single target / antitoxin not tested", on the pudding's "Successfully ate Vivians Leather. All the weapons except crossbow in
   that link are magic."): the rules his eye wants played where the engine plays them, on the class floor, one beat after another, the dice pinned where a beat needs
   them to fall one way (its card says so). At the end of each beat the show waits: ENTER (or E, or a click) plays it again, → the next, ← the one before.

     deep16/?rulesshow             every beat, in order · &only=antitoxin,pudding,leather,heatmetal,metal,gust,gridfixes1106,gridfix1107 keeps to those (a beat's id or its group) · &beat=N starts at the Nth
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
    var B = new D.Battle({ npc: { foes: ['giantspider', 'pudding', 'hobgoblin', 'grayooze', 'goblin', 'gennet', 'wolf', 'wolf'], party: ['cleric:' + L + ':human', 'bard:' + L + ':human', 'wizard:' + L + ':human', 'rogue:' + L + ':human', 'paladin:' + L + ':human'] },
      fightDef: D.classFight(L, { what: 'The grid\'s rules, shown', intro: 'A beat at a time. ENTER plays a beat again.' }) });
    B.rulesshow = true;
    var enter0 = B.enter;
    B.enter = function () { enter0.apply(this, arguments); this.req = null; this.co = show(this, get, FAST); };
    return B;
  };

  function* show(B, get, FAST) {
    var W = function (n) { return FAST ? 1 : n * 2; }; // (time to read each card before the next blow)
    var all = B.units.slice(), party = all.filter(function (w) { return w.side === 'party' && !w.familiar; }), foes = all.filter(function (w) { return w.side === 'foe'; });
    var cleric = party.filter(function (w) { return w.cls === 'cleric'; })[0], bard = party.filter(function (w) { return w.cls === 'bard'; })[0], wizard = party.filter(function (w) { return w.cls === 'wizard'; })[0];
    var rogue = party.filter(function (w) { return w.cls === 'rogue'; })[0], paladin = party.filter(function (w) { return w.cls === 'paladin'; })[0]; // (the grid's fixes of 11-06: their beats, below)
    var kind = function (k) { return foes.filter(function (w) { return w.kind === k; })[0]; };
    var spider = kind('giantspider'), pudding = kind('pudding'), hob = kind('hobgoblin'), ooze = kind('grayooze'), gob = kind('goblin');
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
    function* puddingLeather() {
      // the pudding's pseudopod at the goblin's leather and shield, three bites pinned to land (SRD 5.1: any nonmagical armour; the third bite eats it through, his 10-13
      // ruling): AC 15, then 14 -- leather gives 1, so the first bite spends it and none takes it lower than none (10-22) -- and the leather gone, the shield still on its arm
      stage([gob, pudding], [[0, 0], [1, 0]]); setPin(15, null); gob.maxhp = gob.hp = 200;
      var ac0 = RU.ac(gob);
      say(['The pudding\'s pseudopod at the goblin in leather armour and a shield, three bites pinned to land (AC ' + ac0 + '; the show sets one foe on another, the goblin\'s hit points deep).']); yield W(60);
      var n = mark(), acs = [];
      for (var i = 0; i < 3; i++) { turn(pudding); yield* fire(B.attack(pudding, gob, pudding.attacks.pseudopod)); B.active = null; acs.push(RU.ac(gob)); yield W(50); }
      var l = since(n), gone = /leather armor is eaten through and falls away/.test(l) && !gob.armored;
      return [ac0 === 15 && acs.join() === '14,14,14' && gone, 'AC ' + ac0 + ' -> ' + acs.join(' -> ') + (gone ? ' (the leather gone, the shield kept)' : ' (the leather never eaten through)')];
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
      // the bard's Heat Metal on the hobgoblin's chain mail (its sheet names it since 10-21 night, data/foes.js metalArmor: the armour's case, not the longsword's -- it cannot
      // shed it, so attacks and checks at disadvantage); the bard's bonus action flares it the next turn; the cleric fells it -- the bard lets go, no flare, no END
      stage([bard, hob, cleric], [[-2, 0], [1, 0], [2, 1]]); setPin(15, [3]); hob.maxhp = hob.hp = 80;
      if ((bard.known || []).indexOf('heatmetal') < 0) (bard.known = bard.known || []).push('heatmetal');
      bard.slots = [4, 3, 2, 0, 0, 0, 0, 0, 0];
      say(['The bard heats the hobgoblin\'s chain mail. Its saves are pinned to fail (its hit points deep for the show).']); yield W(60);
      var n = mark(); turn(bard); yield* fire(B.exec(bard, { do: 'cast', id: 'heatmetal', slot: 2, target: hob })); B.active = null; yield W(40);
      var held = !!(bard.conc && bard.conc.id === 'heatmetal' && hob.conds.heated), mail = !!(hob.conds.disAt && hob.conds.disAt.id === '*') && !hob.conds.disarmed;
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
      return [held && mail && !!again && hob.dead && free && !endOn && !flare, (held ? 'heated' : 'never heated') + (mail ? ' (the mail: attacks and checks at disadvantage)' : hob.conds.disarmed ? ' (the sword dropped: its mail not read as metal)' : ' (no disadvantage)') + ', ' + (again ? 'flared again' : 'no flare the next turn') + ', the hobgoblin ' + (hob.dead ? 'dead' : 'up') + '; the bard ' + (free ? 'let go (nothing left to hold)' : 'still holding ' + (bard.conc ? bard.conc.name : '?')) + ', END on the ring ' + endOn + ', the flare offered ' + flare];
    }
    function* metalGrasp() {
      // the wizard's Shocking Grasp at the hobgoblin in chain mail (SRD 5.1: "advantage on the attack roll if the target is wearing armor made of metal"), then at the giant spider
      stage([wizard, hob, spider], [[0, 0], [1, 0], [0, 1]]); setPin(12, null); hob.maxhp = hob.hp = 80; spider.maxhp = spider.hp = 80;
      if ((wizard.known || []).indexOf('shockinggrasp') < 0) (wizard.known = wizard.known || []).push('shockinggrasp');
      say(['The wizard\'s Shocking Grasp at the hobgoblin in chain mail, then at the giant spider (the d20s pinned to 12, the hit points deep for the show).']); yield W(60);
      var n = mark(); turn(wizard); yield* fire(B.exec(wizard, { do: 'cast', id: 'shockinggrasp', slot: 0, target: hob })); B.active = null; yield W(50);
      var l1 = since(n), n2 = mark(); turn(wizard); yield* fire(B.exec(wizard, { do: 'cast', id: 'shockinggrasp', slot: 0, target: spider })); B.active = null; yield W(50);
      var l2 = since(n2), adv1 = /metal armou?r/.test(l1), adv2 = /metal armou?r/.test(l2);
      return [adv1 && !adv2, 'at the hobgoblin ' + (adv1 ? 'with advantage (metal armour)' : 'no advantage') + '; at the spider ' + (adv2 ? 'with advantage: wrong' : 'none')];
    }
    function* oozeMail() {
      // the gray ooze's pseudopod at the hobgoblin's chain mail, three bites pinned to land (SRD 5.1 Corrode Metal; the grid's third bite eats it through, his 10-13 ruling): AC 18,
      // 17, 16, then the mail gone -- 13, the shield still on its arm
      stage([hob, ooze], [[0, 0], [1, 0]]); setPin(15, null); hob.maxhp = hob.hp = 120;
      var ac0 = RU.ac(hob);
      say(['The gray ooze\'s pseudopod at the hobgoblin in chain mail, three bites pinned to land (AC ' + ac0 + '; the show sets one foe on another, the hobgoblin\'s hit points deep).']); yield W(60);
      var n = mark(), acs = [];
      for (var i = 0; i < 3; i++) { turn(ooze); yield* fire(B.attack(ooze, hob, ooze.attacks.pseudopod)); B.active = null; acs.push(RU.ac(hob)); yield W(50); }
      var l = since(n), gone = /chain mail is eaten through and falls away/.test(l) && !hob.metalArmor;
      return [acs[0] === ac0 - 1 && acs[1] === ac0 - 2 && gone && acs[2] === ac0 - 5, 'AC ' + ac0 + ' -> ' + acs.join(' -> ') + (gone ? ' (the mail gone, the shield kept)' : ' (the mail never eaten through)')];
    }

    // an open flat run of n squares east and two rows deep, nearest the floor's middle, as offsets from it (the wind's line wants room)
    function flatRun(n) {
      var best = null, bd = 1e9;
      for (var y = 1; y < G.map.h - 2; y++) for (var x = 1; x < G.map.w - n - 1; x++) {
        var ok = true; for (var k = 0; k <= n && ok; k++) for (var j = 0; j <= 1; j++) { var s = G.map.at(x + k, y + j); if (!s || !s.open || G.map.gz(x + k, y + j) !== G.map.gz(x, y)) ok = false; }
        var d = Math.abs(x + n / 2 - cx) + Math.abs(y - cy); if (ok && d < bd) { bd = d; best = [x - cx, y - cy]; }
      }
      return best || [-4, 0];
    }
    function* gust() {
      // the wizard's Gust of Wind east (SRD 5.1, built 10-21 night): the cast pushes no one, and its line blows the fog apart and puts out the cleric's torch (back in the pack); the
      // hobgoblin starts its turn in it, its save pinned to fail: blown 15 ft along it; the gray ooze's pinned to pass: it stands, and toward the wizard its 10 ft of move is 5;
      // the wizard's bonus action turns the line north
      var r = flatRun(10), o = [r[0], r[1]];
      stage([wizard, hob, ooze, cleric], [[o[0], o[1]], [o[0] + 3, o[1]], [o[0] + 4, o[1] + 1], [o[0] + 1, o[1] + 1]]); hob.maxhp = hob.hp = 80; ooze.maxhp = ooze.hp = 80;
      if ((wizard.known || []).indexOf('gustofwind') < 0) (wizard.known = wizard.known || []).push('gustofwind');
      wizard.slots = [4, 3, 2, 0, 0, 0, 0, 0, 0]; cleric.torch = { lit: true }; B.inv.push({ id: 'torch', n: 1 });
      B.darks = (B.darks || []).concat([{ kind: 'fog', sq: [[wizard.x + 6, wizard.y], [wizard.x + 6, wizard.y + 1], [wizard.x + 7, wizard.y], [wizard.x + 7, wizard.y + 1]], by: 'show' }]); if (B.lightMap) B.lightMap = null;
      say(['The wizard casts Gust of Wind east: a line of wind 60 ft long and 10 ft wide, held. The cleric\'s torch and a patch of fog are in it.']); yield W(60);
      var hx = hob.x, ox = ooze.x, n = mark(); turn(wizard); yield* fire(B.exec(wizard, { do: 'cast', id: 'gustofwind', slot: 2, target: { x: wizard.x + 6, y: wizard.y } })); B.active = null; yield W(60);
      var still = hob.x === hx && ooze.x === ox, fogGone = !(B.darks || []).some(function (d) { return d.by === 'show'; }), torchOut = !cleric.torch && (B.inv.filter(function (s) { return s.id === 'torch'; })[0] || {}).n === 2;
      say(['The hobgoblin starts its turn in the wind: its STR save pinned to fail.']); yield W(40);
      setPin(null, [2]); turn(hob); B.active = null; yield W(60); var blown = hob.x - hx;
      say(['The gray ooze starts its turn in it: its save pinned to pass. Toward the wizard every foot costs two.']); yield W(40);
      setPin(null, [19]); turn(ooze); B.active = null; yield W(40); setPin(null, null);
      var rc = G.reach(ooze, ooze.turn.move), one = rc[(ooze.x - 1) + ',' + ooze.y], two = rc[(ooze.x - 2) + ',' + ooze.y], away = rc[(ooze.x + 1) + ',' + ooze.y], creep = !!one && one.cost === 10 && !two && !!away && away.cost === 5;
      say(['The wizard\'s next turn: the bonus action turns the line north.']); yield W(40);
      B.round++; turn(wizard); var again = (D.magic.list(B, wizard) || []).filter(function (e) { return e.id === 'gustofwind' && e.g && e.g.again; })[0];
      if (again) { yield* fire(B.exec(wizard, { do: 'cast', id: 'gustofwind', slot: again.slot, target: { x: wizard.x, y: wizard.y - 6 } })); yield W(60); }
      var z = (B.zones || []).filter(function (q) { return q.id === 'gustofwind'; })[0], north = !!z && z.vy < -0.9;
      B.active = null; if (wizard.conc) D.magic.endConc(B, wizard, 'the show'); yield W(30);
      return [still && fogGone && torchOut && blown === 3 && ooze.x === ox && creep && !!again && north, (still ? 'the cast pushed no one' : 'the cast pushed someone') + '; the fog ' + (fogGone ? 'torn apart' : 'still there') + ', the cleric\'s torch ' + (torchOut ? 'out and back in the pack' : 'still lit') + '; the hobgoblin blown ' + blown * 5 + ' ft, the ooze ' + (ooze.x === ox ? 'stood firm' : 'moved') + ', toward the wizard ' + (creep ? 'its 10 ft goes 5' : 'not at double cost') + '; ' + (again && north ? 'the bonus action turned it north' : 'not turned')];
    }

    // ---- the grid's fixes of 11-06 (his fights of 11-05/11-06, the grid's rules lane; &only=gridfixes1106): the rogue and the paladin joined the show's party for them
    var sneakIn = function (n) { return /sneak \d+d6/.test(since(n)); };
    function* sneakTurn() {
      // SRD 5.1 Sneak Attack, "once per turn": any creature's turn, not only hers (battle.js Battle.turnKey). The rogue beside the goblin, the cleric at its other side; every d20 15
      stage([rogue, gob, cleric], [[0, 0], [1, 0], [2, 0]]); setPin(15, null); gob.maxhp = gob.hp = 200; rogue.maxhp = rogue.hp = 200;
      delete rogue.turn; delete rogue.sneakAt;
      say(['Before the rogue has had a turn: the goblin\'s turn, and it walks away from her -- her opportunity attack, the cleric at its side (the d20s pinned to 15, the goblin\'s hit points deep).']); yield W(60);
      var n = mark(); turn(gob); yield* fire(B.attack(rogue, gob, rogue.weapon, { oa: true })); yield W(50); var a = sneakIn(n);
      say(['A second blow of hers on the same goblin turn (a readied one, say): no Sneak Attack -- once a turn.']); yield W(50);
      n = mark(); yield* fire(B.attack(rogue, gob, rogue.weapon, { oa: true })); B.active = null; yield W(50); var b = sneakIn(n);
      say(['Her own turn: Sneak Attack.']); yield W(40);
      n = mark(); turn(rogue); yield* fire(B.attack(rogue, gob, rogue.weapon)); B.active = null; yield W(50); var c = sneakIn(n);
      say(['The goblin\'s next turn, her opportunity attack: Sneak Attack again -- another creature\'s turn, a turn of its own.']); yield W(50);
      B.round++; n = mark(); turn(gob); yield* fire(B.attack(rogue, gob, rogue.weapon, { oa: true })); B.active = null; yield W(60); var d = sneakIn(n);
      return [a && !b && c && d, 'before her first turn ' + (a ? 'sneak' : 'none') + '; again that turn ' + (b ? 'sneak: wrong' : 'none') + '; her own turn ' + (c ? 'sneak' : 'none') + '; the goblin\'s next ' + (d ? 'sneak' : 'none')];
    }
    function* hideBlind() {
      // the rogue hides 20 ft from the gray ooze, which is blind and perceives by its blindsight (60 ft): SEEN, with the reason (battle.js spots -- before, HIDDEN, and the edges took the advantage away)
      stage([rogue, ooze], [[0, 0], [4, 0]]); setPin(18, null);
      say(['The rogue hides 20 ft from the gray ooze. It has no eyes: its blindsight perceives all round it, 60 ft (her Stealth d20 pinned to 18).']); yield W(60);
      var n = mark(); turn(rogue); yield* fire(B.hide(rogue)); B.active = null; yield W(70);
      var l = since(n), seen = !rogue.conds.hidden && /SEEN/.test(l) && /blindsight \(60 ft\)/.test(l);
      return [seen, seen ? 'SEEN: "' + ((l.match(/within [^|]*/) || [''])[0]).trim() + '"' : 'not as it should be: ' + l.slice(0, 160)];
    }
    function* layHelp() {
      // Lay on Hands on a sleeper at full hit points: turned away, the action kept, the card pointing at HELP (battle.js Battle.layNothing); HELP's note names the sleeper; HELP clicked on one
      // down at 0 hp says why (Battle.helpWhyNot); HELP on the sleeper shakes him awake
      stage([paladin, wizard, cleric], [[0, 0], [1, 0], [0, 1]]); wizard.conds.asleep = { by: wizard.id }; cleric.hp = 0; cleric.ko = true;
      say(['The wizard asleep at full hit points beside the paladin; the cleric down at 0 beside him. The paladin lays on hands on the wizard.']); yield W(60);
      turn(paladin); B.req = { turn: paladin }; var n = mark(); yield* fire(B.layOnHands(paladin, wizard)); yield W(80);
      var kept = paladin.turn.action === 1 && /full hit points/.test(since(n)) && /HELP shakes/.test(since(n));
      var hc = (B.commands(paladin) || []).filter(function (c) { return c.id === 'help'; })[0] || {};
      say(['HELP on the paladin\'s ring reads: "' + hc.note + '". He tries HELP on the cleric first.']); yield W(70);
      B.tool = 'help'; var an0 = B.answer, got = []; B.answer = function (c) { got.push(c); }; try { D.ui.actAt(B, paladin, cleric.x, cleric.y, false); } finally { B.answer = an0; }
      var why = (B.cards[B.cards.length - 1] || { lines: [] }).lines.join(' '); yield W(80);
      say(['Then HELP on the wizard.']); yield W(30);
      yield* fire(B.exec(paladin, { do: 'help', target: wizard })); B.tool = null; B.req = null; B.active = null; yield W(60);
      var woke = !wizard.conds.asleep, named = new RegExp('shake ' + wizard.name + ' awake').test(hc.note || ''), down = new RegExp(cleric.name + ' is down, not asleep').test(why) && !got.length;
      return [kept && named && down && woke, (kept ? 'the touch turned away, the action kept' : 'the action spent on +0') + '; the note ' + (named ? 'names him' : '"' + hc.note + '"') + '; on the cleric ' + (down ? '"down, not asleep"' : 'no why') + '; ' + (woke ? 'the wizard shaken awake' : 'still asleep')];
    }
    function* foundBlow() {
      // the cleric strikes the goblin hidden beside it (out of any passive Perception's reach): the blow, then "found by the blow" under it (before, above the blow's lines)
      stage([cleric, gob], [[0, 0], [1, 0]]); setPin(15, null); gob.maxhp = gob.hp = 200; gob.conds.hidden = true; gob.hidTotal = 60;
      say(['The goblin is hidden beside the cleric. The cleric swings at where it is (the d20 pinned to 15).']); yield W(60);
      var n = mark(); turn(cleric); yield* fire(B.attack(cleric, gob, cleric.weapon)); B.active = null; yield W(70);
      var ls = (B.log || []).slice(n), iH = -1, iF = -1; ls.forEach(function (l, i) { if (iH < 0 && l.indexOf(cleric.name + ' > ') >= 0) iH = i; if (/found by the blow/.test(l)) iF = i; });
      return [iH >= 0 && iF > iH + 1, iF > iH + 1 ? 'the blow, its damage, then "found by the blow"' : 'the found line at ' + iF + ', the blow at ' + iH];
    }
    function* sleepAim() {
      // Sleep aimed with the bard beside the goblins: the words beside the cursor name the bard (ui.js -- the gold outline alone before). The beat holds the aim up on the wizard's turn
      stage([wizard, gob, bard], [[0, 0], [5, 0], [4, 1]]);
      if ((wizard.known || []).indexOf('sleep') < 0) (wizard.known = wizard.known || []).push('sleep'); wizard.slots = [4, 3, 2, 0, 0, 0, 0, 0, 0];
      turn(wizard); B.req = { turn: wizard }; B.tool = 'spell'; B.spell = { id: 'sleep', slot: 1, g: D.magic.geo('sleep'), sp: D.magic.data('sleep'), n: 1, name: 'Sleep' }; B.picks = []; B.cursor = { x: gob.x, y: gob.y };
      say(['The wizard aims Sleep at the goblin, the bard beside it: beside the cursor, who of ours is in the sphere.']); yield W(140);
      var said = [], tx0 = D.text, cv = document.createElement('canvas'); cv.width = D.W; cv.height = D.H; var c0 = D.ctx;
      D.text = function (c, s) { said.push(String(s).replace(/\{\/?[a-z]*\}/g, '')); return tx0.apply(this, arguments); }; D.ctx = cv.getContext('2d');
      try { B.draw(D.ctx); } catch (eD) { said.push('threw ' + eD); } finally { D.text = tx0; D.ctx = c0; }
      B.tool = null; B.spell = null; B.req = null; B.active = null;
      var line = said.filter(function (s) { return /Sleep takes/.test(s); })[0] || '';
      return [new RegExp('^' + bard.name + ' \\(\\d+\\) is in it').test(line), line ? '"' + line + '"' : 'no words beside the cursor'];
    }
    // ---- the grid's fixes of 11-07 (his fights of 11-06 evening, the grid's rules lane; &only=gridfix1107): Gennet and two wolves joined the show's foes for them
    var gennet = foes.filter(function (w) { return w.kind === 'gennet' || /^Gennet/.test(w.name); })[0], wolves = foes.filter(function (w) { return w.kind === 'wolf'; });
    // the simple fight's Hide (js/simple.js Battle.hide, S.judge), run whole on this stage: B.simple on for the roll alone, the picture the grid's
    function* simpleHide(u) {
      var s0 = B.simple, g = B.hide(u), v, r; B.simple = true;
      try { for (var n = 0; n < 4000; n++) { r = g.next(v); v = undefined; if (r.done) break; if (r.value && r.value.prompt) v = r.value.prompt.opts[0].value; } } finally { B.simple = s0; }
    }
    function* yieldStop() {
      // a foe that yields at half stops when it does (battle.js Battle.overStop, ai.js AI.TURN_OVER): Gennet walks off the rogue and the paladin to shoot the wizard -- her turn the
      // AI's own (D.ai.turn), its plan scripted for the beat; the rogue's opportunity attack takes her to half: the walk stops there, the paladin is asked nothing, no shot comes
      stage([gennet, rogue, paladin, wizard], [[1, 0], [0, 0], [2, 0], [1, -5]]); setPin(15, null); gennet.maxhp = 200; gennet.hp = 101; gennet.yields = true; // (her sheet's yields: data/foes.js -- the class floor's build of her leaves it off)
      // (deep hit points: the blow that takes her to half never drops her)
      var bow = { name: 'Light Crossbow', atk: 4, dice: '1d8', mod: 2, type: 'piercing', ranged: true, range: [80, 320] }, tx0 = D.tactics.turn, ai0 = gennet.classAI, wz0 = wizard.hp;
      say(['Gennet yields at half her hit points (101 of 200 here). She walks off the rogue and the paladin to shoot the wizard; both may strike as she leaves (the d20s pinned to 15).']); yield W(80);
      var n = mark();
      D.tactics.turn = function* (Bx, u) { if (u !== gennet) return yield* tx0.apply(this, arguments); yield* Bx.moveAlong(u, [[u.x, u.y - 1], [u.x, u.y - 2], [u.x, u.y - 3]], { spend: true }); yield* Bx.attack(u, wizard, bow); };
      gennet.classAI = true;
      try { yield* fire(D.ai.turn(B, gennet)); } finally { D.tactics.turn = tx0; gennet.classAI = ai0; }
      B.active = null; yield W(90);
      var l = since(n), oas = (l.match(/an opportunity attack on/g) || []).length, shot = wizard.hp < wz0 || l.indexOf(gennet.name + ' > ') >= 0, over = B.over();
      return [oas === 1 && !shot && over === 'yielded' && gennet.hp <= 100, oas + ' opportunity attack' + (oas === 1 ? '' : 's') + ' (want 1: the paladin asked nothing once she yields); ' + (shot ? 'her shot came: wrong' : 'no shot') + '; the fight ' + (over || 'not over') + ' (' + gennet.hp + ' of 200)'];
    }
    function* meleeBlind() {
      // a simple fight strikes a melee blow from the square beside its target, inside the giant spider's 10 ft of blindsight: a hider with a blade in hand is seen by it, the card
      // saying why; with a bow in hand the lineup's 40 ft stands between them -- hidden (simple.js S.meetsInMelee)
      stage([rogue, spider], [[4, 0], [-4, 0]]); var sk = rogue.stealth || 0; setPin(Math.max(1, Math.min(20, 20 - sk)), null);
      say(['A simple fight: the rogue hides from the giant spider across the lineup, 40 ft off. Its blindsight reaches 10 ft -- and a melee blow here is struck from the square beside it (her Stealth pinned past its passive 10).']); yield W(80);
      var n = mark(); turn(rogue); yield* simpleHide(rogue); B.active = null; yield W(100);
      var l1 = since(n), seen = !rogue.conds.hidden && /Seen by: [^|]*blindsight 10 ft, met in melee/.test(l1);
      delete rogue.conds.hidden; delete rogue.hidTotal;
      rogue.weapon = { name: 'Shortbow', atk: (rogue.weapon && rogue.weapon.atk) || 6, dice: '1d6', mod: (rogue.weapon && rogue.weapon.mod) || 4, type: 'piercing', ranged: true, range: [80, 320] };
      say(['The same hide with a bow in hand: from the lineup the blindsight does not reach her.']); yield W(60);
      n = mark(); turn(rogue); yield* simpleHide(rogue); B.active = null; yield W(100);
      var l2 = since(n), hid = !!rogue.conds.hidden && /Beat passive Perception: Spider \(10\)/.test(l2);
      delete rogue.conds.hidden; delete rogue.hidTotal;
      return [seen && hid, (seen ? 'blade in hand: SEEN, "blindsight 10 ft, met in melee"' : 'blade in hand: ' + l1.slice(0, 160)) + '; ' + (hid ? 'bow in hand: HIDDEN' : 'bow in hand: ' + l2.slice(0, 160))];
    }
    function* keenWolves() {
      // Keen Hearing and Smell (SRD 5.1: advantage on Perception that relies on hearing or smell) counts in the Perception that finds a hider: a passive 13 is 18 (rules.js RU.keen)
      stage([rogue, wolves[0], wolves[1], gob], [[4, 0], [-4, -1], [-4, 1], [-4, 0]]); var sk = rogue.stealth || 0; setPin(Math.max(1, Math.min(20, 15 - sk)), null);
      say(['A simple fight: the rogue hides from two wolves and a goblin across the lineup (her Stealth pinned to 15). A wolf\'s passive Perception is 13; its Keen Hearing and Smell makes it 18. The goblin\'s is 9.']); yield W(90);
      var n = mark(); turn(rogue); yield* simpleHide(rogue); B.active = null; yield W(110);
      var l = since(n), ok = !!rogue.conds.hidden && /Seen by: Wolf x2 \(18, keen hearing and smell\)/.test(l) && /Beat passive Perception: Goblin \(9\)/.test(l);
      delete rogue.conds.hidden; delete rogue.hidTotal;
      return [ok, ok ? 'HIDDEN from the goblin; "Seen by: Wolf x2 (18, keen hearing and smell)"' : l.slice(0, 220)];
    }
    var BEATS = [
      { id: 'antitoxin', group: 'antitoxin', name: 'The antitoxin', what: 'A giant spider\'s bite is a CON save against poison (DC 11; 2d8 poison, half on a save). Without the antitoxin the cleric rolls one die; with it, two, and keeps the better -- the SRD\'s advantage on saves against poison. The bar reads antitoxin while it lasts (the fight).', run: antitoxin },
      { id: 'puddingweapon', group: 'pudding', name: 'The pudding and a plain weapon', what: 'The cleric\'s mace is plain (nothing magic in this party): each blow that lands on the black pudding burns the cleric (its Corrosive Form, 1d8 acid) and eats the mace, -1 and -2 to its damage, and the third eats it through -- gone, fists after.', run: puddingWeapon },
      { id: 'puddingarmour', group: 'pudding', name: 'The pudding and plain armour', what: 'Its pseudopod on the cleric\'s plain chain mail: -1 AC, -2, and the third bite eats it through -- the mail gone, the AC what it is without it (the shield still counts).', run: puddingArmour },
      { id: 'leather', group: 'pudding', name: 'The pudding and a foe\'s leather', what: 'A foe\'s sheet names its leather and hide now, by the SRD block\'s AC (the goblin\'s leather armour and shield, the gnoll\'s hide, the bandit captain\'s studded leather). The pudding\'s pseudopod eats any plain armour: leather is worth 1 AC, so the first bite spends it (AC 14), no bite takes it lower than none, and the third eats it through -- the shield still counting.', run: puddingLeather },
      { id: 'puddingmagic', group: 'pudding', name: 'The pudding and magic', what: 'The same blows and bites with the mace made +1 and the mail magic: the acid eats neither (a magic weapon and magic armour are never eaten).', run: puddingMagic },
      { id: 'heatmetal', group: 'heatmetal', name: 'Heat Metal ends with the one it heats', what: 'The bard heats the hobgoblin\'s chain mail (it cannot shed it: attacks and checks at disadvantage) and flares it with a bonus action the next turn. The cleric fells the hobgoblin: at its turn\'s end the bard lets go of Heat Metal (nothing left to hold) -- no flare offered, no END HEAT METAL on the ring, and the bard is free to concentrate on something else.', run: heatMetal },
      { id: 'metalgrasp', group: 'metal', name: 'Shocking Grasp and a foe\'s mail', what: 'A foe\'s sheet names its metal armour now, by the SRD block\'s AC (the hobgoblin\'s chain mail, the guard\'s chain shirt, the veteran\'s splint). The wizard\'s Shocking Grasp at the hobgoblin has advantage (metal armour); at the giant spider, none.', run: metalGrasp },
      { id: 'oozemail', group: 'metal', name: 'The gray ooze and a foe\'s mail', what: 'The gray ooze\'s pseudopod eats metal armour: on the hobgoblin\'s chain mail -1 AC, -2, and the third bite eats it through -- the mail gone, its shield still counting (AC 13).', run: oozeMail },
      { id: 'gust', group: 'gust', name: 'Gust of Wind, held', what: 'The SRD\'s Gust of Wind: a line of wind 60 ft long and 10 ft wide blasts from the wizard while it is held (a minute). The cast pushes no one; it tears the fog apart and blows the torch out (a lantern half the time). Whoever starts a turn in it saves STR or is blown 15 ft along it; walking toward the wizard in it costs 2 ft a foot; a bonus action turns the line.', run: gust },
      { id: 'sneakturn', group: 'gridfixes1106', name: 'Sneak Attack on another\'s turn', what: 'SRD 5.1: Sneak Attack is once per turn -- any creature\'s turn, not only hers. Her opportunity attack on the goblin\'s turn sneaks (even before her own first turn), a second blow that same turn does not, her own turn sneaks, and the goblin\'s next turn sneaks again. (11-06, his fight of 19:30:08Z R2: Vivian\'s opportunity attack with Barley and Lymen at the target, no sneak.)', run: sneakTurn },
      { id: 'hideblind', group: 'gridfixes1106', name: 'Hiding from what has no eyes', what: 'A creature with blindsight perceives all round it without sight, to its range: nothing hides from it there. The rogue hides 20 ft from the gray ooze (blindsight 60 ft): SEEN, and the card says why. (11-06, his guano dens: HIDDEN against a giant bat, and then neither the advantage nor the Sneak Attack came.)', run: hideBlind },
      { id: 'layhelp', group: 'gridfixes1106', name: 'A sleeper, a touch and a shake', what: 'Lay on Hands on the wizard asleep at full hit points mends nothing: turned away, the action kept, and the card says healing wakes no sleeper -- HELP does. HELP\'s note names him. HELP on the cleric, down at 0, says why not; HELP on the wizard shakes him awake. (11-06, his "ah yes, the sleeping heroes - \'help\' should be the \'shake to wake\', like I tried to click".)', run: layHelp },
      { id: 'foundblow', group: 'gridfixes1106', name: 'Found by the blow, said after it', what: 'A hit on one hidden finds it: the line says so under the blow that found it, not above it. (11-06, his 21:43:45Z R2, the Crawler.)', run: foundBlow },
      { id: 'sleepaim', group: 'gridfixes1106', name: 'Sleep and the party in its sphere', what: 'Sleep takes the weakest first, friend or foe. Aimed with the bard beside the goblin, the words beside the cursor name the bard and the bard\'s hit points. (11-06, his fights of 17:42 and 17:49: Aurdin\'s Sleep took Aurdin, then two of the four.)', run: sleepAim },
      { id: 'yieldstop', group: 'gridfix1107', name: 'A foe that yields stops there', what: 'Gennet yields at half her hit points. She walks off the rogue and the paladin to shoot the wizard; the rogue\'s opportunity attack takes her to half -- her walk stops there, the paladin is asked for no opportunity attack, and the shot never comes. (11-06, his path fight: Gennet took both opportunity attacks below her yield, then shot Aurdin; Lymen was offered a Divine Smite on her.)', run: yieldStop },
      { id: 'meleeblind', group: 'gridfix1107', name: 'A simple fight, blindsight and a blade', what: 'In a simple fight a melee blow is struck from the square beside the target. Hiding from the giant spider (blindsight 10 ft) with a blade in hand: SEEN, the card saying why -- the blow would land inside its blindsight. With a bow in hand: HIDDEN, the lineup\'s 40 ft out of its reach. (11-06, his Web Gulch: HIDDEN from the spider, then a single d20 at it.)', run: meleeBlind },
      { id: 'keenwolves', group: 'gridfix1107', name: 'Keen hearing and smell', what: 'A wolf\'s Keen Hearing and Smell (advantage on Perception that relies on hearing or smell) counts in the Perception that finds a hider: its passive 13 is 18. The rogue hides from two wolves and a goblin, Stealth 15: hidden from the goblin (9), seen by the wolves -- "Wolf x2 (18, keen hearing and smell)". (11-06, his road fight: "Seen by: Wolf x2 (13)".)', run: keenWolves }
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
