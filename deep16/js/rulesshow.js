/* DEEP16 — the grid's rules, shown (10-21 night, the grid's rules lane; his ear file of 10-21: on the antitoxin's door "heat metal concentration continues after
   target dies / bane can't be cast on a single target / antitoxin not tested", on the pudding's "Successfully ate Vivians Leather. All the weapons except crossbow in
   that link are magic."): the rules his eye wants played where the engine plays them, on the class floor, one beat after another, the dice pinned where a beat needs
   them to fall one way (its card says so). At the end of each beat the show waits: ENTER (or E, or a click) plays it again, → the next, ← the one before.

     deep16/?rulesshow             every beat, in order · &only=antitoxin,pudding,leather,heatmetal,metal,gust,gridfixes1106,gridfix1107,gridfix1110,postures keeps to those (a beat's id or its group) · &beat=N starts at the Nth
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
    var B = new D.Battle({ npc: { foes: ['giantspider', 'pudding', 'hobgoblin', 'grayooze', 'goblin', 'gennet', 'wolf', 'wolf', 'bandit', 'chuul', 'harpy', 'bugbear'], party: ['cleric:' + L + ':human', 'bard:' + L + ':human', 'wizard:' + L + ':human', 'rogue:' + L + ':human', 'paladin:' + L + ':human'] },
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
    var gennet = foes.filter(function (w) { return w.kind === 'gennet' || /^Gennet/.test(w.name); })[0], bandit = kind('bandit'), wolves = foes.filter(function (w) { return w.kind === 'wolf'; });
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
      // the fight ended yielded: she sits on her Sit row, as Battle.finish has her do (Battle.sitYielded, 11-05) -- 11-11, his note on the show: "doesn't yielding use 'sit' if they
      // have one" (the beat stopped short of it)
      var canSit = !!D.spr.anim(gennet.sheet, 'sit'); if (over === 'yielded') { D.Battle.sitYielded(B); say([canSit ? 'Gennet yields: she sits down where she stands (her Sit row).' : 'Gennet yields (no Sit row on her sheet).']); yield W(100); }
      var sat = !canSit || gennet.anim === 'sit';
      return [oas === 1 && !shot && over === 'yielded' && gennet.hp <= 100 && sat, (canSit ? (sat ? 'she sits; ' : 'she does NOT sit; ') : 'no Sit row; ') + oas + ' opportunity attack' + (oas === 1 ? '' : 's') + ' (want 1: the paladin asked nothing once she yields); ' + (shot ? 'her shot came: wrong' : 'no shot') + '; the fight ' + (over || 'not over') + ' (' + gennet.hp + ' of 200)'];
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
    function* keenDark() {
      // by ear and nose (RULED 11-07, rules.js RU.earNose): in the dark the wolf cannot see the rogue, and its keen hearing and smell find her all the same; the bandit -- no
      // darkvision, no keen sense -- cannot
      stage([rogue, wolves[0], bandit], [[4, 0], [-4, -1], [-4, 1]]); var sk = rogue.stealth || 0; setPin(Math.max(1, Math.min(20, 15 - sk)), null); var dk0 = B.dark;
      try {
        B.dark = true;
        say(['A simple fight in the dark: the rogue hides from a wolf and a bandit across the lineup (her Stealth pinned to 15). Neither can see her. The wolf\'s keen hearing and smell need no eyes: its passive 13 +5 is 18. The bandit has nothing but eyes.']); yield W(100);
        var n = mark(); turn(rogue); yield* simpleHide(rogue); B.active = null; yield W(120);
        var l = since(n), ok = !!rogue.conds.hidden && /Seen by: Wolf \(18, keen hearing and smell, without sight\)/.test(l) && /Bandit \(cannot see her\)/.test(l);
        return [ok, ok ? 'HIDDEN from the bandit (cannot see her); "Seen by: Wolf (18, keen hearing and smell, without sight)"' : l.slice(0, 220)];
      } finally { B.dark = dk0; delete rogue.conds.hidden; delete rogue.hidTotal; }
    }
    // ---- the grid's fixes of 11-10 (his record of 11-09, the grid's rules lane; &only=gridfix1110): the chuul and a harpy joined the show's foes for them
    var chuul = kind('chuul'), harpy = kind('harpy');
    // a generator run as fire() runs it, counting the prompts it asks (each answered with its first option)
    function* fireAsks(gen, asked) {
      var v;
      for (var n = 0; n < 20000; n++) { var r = gen.next(v); v = undefined; if (r.done) return r.value; var y = r.value; if (y && y.prompt) { asked.push(y.prompt.title || ''); v = y.prompt.opts[0].value; continue; } if (y && y.entry) continue; v = yield y; }
    }
    function* shakeTrance() {
      // HELP shakes an entranced friend out of a Hypnotic Pattern (SRD 5.1: "someone else uses an action to shake the creature out of its stupor"), and a blow its temporary hit
      // points take whole still breaks the trance ("if it takes any damage" -- battle.js Battle.hurt's hooks). The pattern's marks laid as its failed save lays them (grimoire.js)
      stage([cleric, wizard, bard, gob], [[0, 0], [1, 0], [0, 2], [1, 2]]); setPin(15, null);
      [wizard, bard].forEach(function (w) { w.conds.hypnotized = { by: gob.id }; w.conds.incapacitated = { by: gob.id }; w.conds.charmed = { by: gob.id }; });
      bard.temp = 20;
      say(['The wizard and the bard stand entranced by a Hypnotic Pattern. The cleric, beside the wizard, takes HELP on him: a shake out of the stupor.']); yield W(70);
      var n = mark(); turn(cleric); yield* fire(B.exec(cleric, { do: 'help', target: wizard })); B.active = null; yield W(50);
      var woke = !wizard.conds.hypnotized && !wizard.conds.incapacitated && !wizard.conds.charmed;
      say(['The goblin\'s scimitar at the bard (pinned to hit). The bard has 20 temporary hit points: they take the blow whole.']); yield W(60);
      var hp0 = bard.hp; turn(gob); yield* fire(B.attack(gob, bard, gob.attacks.scimitar)); B.active = null; yield W(60);
      var l = since(n), jolt = !bard.conds.hypnotized && !bard.conds.incapacitated && !bard.conds.charmed, soaked = bard.hp === hp0 && bard.temp < 20;
      return [woke && jolt && soaked && /shakes [^|]* out of the pattern/.test(l) && /jolted out of the pattern/.test(l), (woke ? 'the wizard shaken out of the pattern' : 'the wizard still entranced') + '; ' + (soaked ? 'the bard\'s blow all temporary hit points (' + bard.temp + ' left), ' : 'the blow reached the bard\'s hit points, ') + (jolt ? 'and the bard jolted out of it' : 'and the bard still entranced')];
    }
    function* chuulTentacles() {
      // the chuul's tentacles (SRD 5.1): "One creature grappled by the chuul must succeed on a DC 13 Constitution saving throw" -- no attack roll, so nothing that answers one: the
      // cleric beside the held paladin, a shield on and the Protection style for the beat, is asked nothing; the d20s to hit pinned to 1, the save's die to 4. The hold is the fight's
      // own (11-11, his note on the show: "i thought we had a graphic of held in a chuul claw more visibly in the claw, but the tentacle mechanics works" -- the beat had set the
      // grip by hand, the paladin left standing beside it): its pincer pinned to hit first, the lunge and the carry in its claw (battle.js Battle.clawIn), then the tentacles
      stage([chuul, paladin, cleric], [[0, 0], [2, 0], [2, 1]]); setPin(15, null);
      var st0 = cleric.style;
      say(['The chuul\'s pincer at the paladin, pinned to hit: the lunge, and the paladin carried in its claw.']); yield W(70);
      try {
        turn(chuul); yield* fire(B.attack(chuul, paladin, chuul.attacks.pincer)); B.active = null; yield W(70);
        var inClaw = !!(paladin.inClaws && paladin.inClaws.by === chuul.id) && paladin.x === chuul.x && paladin.y === chuul.y;
        say(['Its tentacles on the one in its claw: a CON save, DC 13 -- no attack roll. The cleric beside them has a shield and the Protection style; every d20 to hit is pinned to 1, the save\'s die to 4.']); yield W(80);
        cleric.style = 'protection'; cleric.reaction = 1; setPin(1, [4]); var n = mark(), asked = []; // (Protection from here on: the grab's own roll was an attack, and nothing is asked of it)
        turn(chuul); yield* fireAsks(B.attack(chuul, paladin, chuul.attacks.tentacles), asked); B.active = null; yield W(80);
      } finally { B.active = null; cleric.style = st0; }
      var l = since(n), saved = /CON save/.test(l), roll = /d20 1 /.test(l), held = !!paladin.conds.paralyzed && !!paladin.conds.poisoned;
      if (B.release) B.release(chuul); delete chuul.holding; delete paladin.inClaws; delete chuul.clawing; // (let go for the next beat)
      return [inClaw && saved && !roll && held && !asked.length, (inClaw ? 'the paladin in its claw; ' : 'the paladin NOT in its claw; ') + (asked.length ? 'asked: ' + asked.join(', ') : 'Protection asked nothing') + '; ' + (roll ? 'a d20 to hit was rolled' : 'no attack roll') + '; ' + (held ? 'the save failed on its 4: POISONED and PARALYZED' : 'the paladin not paralyzed')];
    }
    function* spikeFlier() {
      // Spike Growth is the ground's: a harpy holding 5 ft over it crosses untouched; on the surface the thorns reach it (RULED 11-10, Griz: "spiked shouldn't impact fliers over 5ft
      // unless SRD contradicts", then "spare 5ft too, head cannon says it's about 3 ft deep" -- grimoire.js M.overSpikes). The spikes laid on three squares of its line for the beat
      stage([harpy, wizard], [[0, 0], [0, 5]]); setPin(15, null);
      var sq = [[cx + 1, cy], [cx + 2, cy], [cx + 3, cy]], g0 = B.grounds, path = [[cx + 1, cy], [cx + 2, cy], [cx + 3, cy], [cx + 4, cy]], L = G.LAYER(), gz = G.groundAt(harpy, cx, cy), fl0 = harpy.flies;
      B.grounds = (B.grounds || []).concat([{ kind: 'spikes', sq: sq, by: wizard.id, difficult: true }]); harpy.flies = true;
      try {
        harpy.fz = gz + L; say(['Spike Growth on three squares. The harpy flies across them 5 ft up.']); yield W(60);
        var hp0 = harpy.hp, n = mark(); turn(harpy); yield* fire(B.moveAlong(harpy, path, {})); B.active = null; yield W(40);
        var high = harpy.hp === hp0 && !/in the spikes/.test(since(n));
        harpy.x = cx; harpy.y = cy; harpy.fz = null; G.setup(G.map, B.units); say(['Back, and across again on the surface, no height held: the thorns reach it.']); yield W(60);
        var n2 = mark(); turn(harpy); yield* fire(B.moveAlong(harpy, path, {})); B.active = null; yield W(50);
        var hits = (since(n2).match(/in the spikes/g) || []).length, low = hits === 3 && harpy.hp < hp0;
        return [high && low, (high ? '5 ft up: untouched' : '5 ft up: spiked') + '; on the surface: ' + hits + ' squares of spikes (want 3), ' + (hp0 - harpy.hp) + ' piercing'];
      } finally { B.grounds = g0; harpy.fz = null; harpy.flies = fl0; }
    }
    function* thrownPickup() {
      // a thrown weapon picked up (RULED 11-10, Griz: "pickup with auto-pack ground items at fight end"; battle.js Battle.landThrow, groundStep, gatherThrown): the paladin's handaxe
      // at the goblin, pinned to miss -- it lands past it; the paladin walks over it and takes it up (the free object); thrown again, pinned to hit -- at the goblin's feet; the
      // fight's end gathers it. The goblin's hit points deep for the beat
      stage([paladin, gob], [[0, 0], [3, 0]]); gob.maxhp = gob.hp = 200; var alt0 = paladin.alt, th0 = paladin.thrown, gr0 = B.ground; delete paladin.thrown; B.ground = [];
      try {
        var ax = paladin.alt; if (!ax || !ax.thrown) return [false, 'the paladin has no handaxe to throw'];
        say(['The paladin throws the handaxe at the goblin 15 ft off, pinned to miss: it lands on the square past it.']); yield W(70);
        setPin(2, null); turn(paladin); yield* fire(B.attack(paladin, gob, ax)); B.active = null; yield W(50);
        var miss = (B.ground || []).map(function (g) { return g.x - cx + ',' + (g.y - cy); }).join(' ');
        say(['The paladin walks round the goblin and over it: taken up on the way (the hand on an object, free).']); yield W(60);
        var n = mark(); turn(paladin); yield* fire(B.moveAlong(paladin, [[cx + 1, cy + 1], [cx + 2, cy + 1], [cx + 3, cy + 1], [cx + 4, cy]], {})); B.active = null; yield W(50);
        var took = /takes up the handaxe on the way/.test(since(n)) && !(B.ground || []).length && !!paladin.alt;
        say(['Thrown again from beside it, pinned to hit: at the goblin\'s feet. Then the fight is over and won.']); yield W(60);
        setPin(15, null); turn(paladin); yield* fire(B.attack(paladin, gob, paladin.alt)); B.active = null; yield W(40);
        var hitAt = (B.ground || []).map(function (g) { return g.x - cx + ',' + (g.y - cy); }).join(' '), gl = B.gatherThrown('won'); say([gl.replace(/\{\/?[a-z]*\}/g, '')]); yield W(80);
        return [miss === '4,0' && took && hitAt === '3,0' && /gathered up: a handaxe/.test(gl), 'the miss lay at ' + miss + ' (past the goblin at 3,0); ' + (took ? 'taken up on the walk' : 'not taken up') + '; the hit at ' + hitAt + '; ' + gl.replace(/\{\/?[a-z]*\}/g, '')];
      } finally { paladin.alt = alt0; if (th0) paladin.thrown = th0; else delete paladin.thrown; B.ground = gr0; }
    }
    // ---- the postures (the Pocket DM's runes, 11-10, runes seat B -- js/postures.js; &only=postures): a foe the DM laid on a rune fights by its posture. Each beat lays the posts
    // as the lay floor's placement will (u.post), D.postures.start as the fight's head does, and the engine plays the turns; the ward's ground and a patrol's squares are drawn on
    // the floor. The bugbear joined the show's foes for its Surprise Attack
    var bugbear = kind('bugbear'), postMarks = null, fmP = B.floorMarks;
    B.floorMarks = function (c) {
      if (fmP) fmP.apply(this, arguments); if (!postMarks) return;
      postMarks.forEach(function (m) { D.iso.rhombus(c, m[0], m[1], G.map.gz(m[0], m[1]), 1); c.globalAlpha = m[3] || 0.3; c.fillStyle = m[2]; c.fill(); c.globalAlpha = 1; });
    };
    function groundMarks(sq, r, col) { var out = []; for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) { var s = G.map.at(x, y); if (s && s.walk && G.dist({ x: x, y: y, size: 1 }, { x: sq[0], y: sq[1], size: 1 }) <= r) out.push([x, y, col, x === sq[0] && y === sq[1] ? 0.55 : 0.22]); } return out; }
    function unpost(list) { list.forEach(function (w) { ['post', 'postBroke', 'postHome', 'postHp', 'postPool', 'postOff', 'postLeg', 'postRoll', 'caughtR1', 'hidTotal'].forEach(function (k) { delete w[k]; }); if (w.conds) { delete w.conds.hidden; delete w.conds.surprised; } }); postMarks = null; }
    var freshEars = function () { B.heard = {}; B.seen = {}; }; // (a beat's own: the blows heard and the sights kept from the beat before are not this one's -- battle.js heardOf, lastSeenOf)
    var walkUp = function* (w, x, y) { turn(w); w.turn.move = Math.max(w.turn.move, 60); var p = G.path(G.reach(w, w.turn.move), x, y); if (p && p.length) yield* fire(B.moveAlong(w, p, { spend: true })); B.active = null; };
    var aiTurn = function* (w) { B.active = w; yield* fire(D.ai.turn(B, w)); B.active = null; };
    var sqOf = function (w) { return '(' + w.x + ',' + w.y + ')'; };
    function* postAmbush() {
      // a goblin laid in AMBUSH (Stealth +6, the d20 pinned at 15: 21), the wizard and the cleric 30 ft off: hidden from the start; the surprise; its turn -- the wizard in sight,
      // out of reach: it holds still and readies its scimitar, unseen; the wizard walks up beside it, and the readied blade springs from hiding
      stage([wizard, cleric, gob], [[0, 3], [2, 3], [0, -3]]); setPin(15, null); wizard.maxhp = wizard.hp = 200; cleric.maxhp = cleric.hp = 200;
      try {
        gob.post = { kind: 'ambush', at: [gob.x, gob.y] }; freshEars(); D.postures.start(B); B.round = 0;
        say(['A goblin laid in AMBUSH: hidden from the start, its own Stealth held (' + gob.hidTotal + '). The SRD\'s surprise: its Stealth against each passive Perception.']); yield W(80);
        yield* fire(D.postures.surprise(B)); yield W(60); var hid0 = !!gob.conds.hidden, caught = [wizard, cleric].filter(function (w) { return w.conds.surprised; }).map(function (w) { return w.name; });
        wizard.conds = {}; cleric.conds = {}; B.round = 1; var x0 = gob.x, y0 = gob.y;
        say(['Its turn: the wizard in sight, 30 ft off, out of reach. It holds still and readies its scimitar -- unseen: no ring, no word.']); yield W(60);
        yield* aiTurn(gob); yield W(40); var held = gob.x === x0 && gob.y === y0 && !!gob.conds.hidden && !!gob.ready;
        say(['The wizard walks up beside it (the wizard\'s hit points deep for the show).']); yield W(50);
        B.round = 2; var n = mark(); yield* walkUp(wizard, gob.x, gob.y + 1); yield W(80); var l = since(n), sprung = /readied/.test(l) && !!gob.postBroke;
        return [hid0 && caught.length > 0 && held && sprung, 'hidden from the start ' + hid0 + ', caught unaware: ' + (caught.join(', ') || 'no one') + '; its turn: ' + (held ? 'held still, hidden, the scimitar readied' : 'NOT held at ' + sqOf(gob)) + '; the wizard beside it: ' + (sprung ? 'the readied blade from hiding, the ambush sprung' : l.slice(0, 120))];
      } finally { unpost([gob, wizard, cleric]); }
    }
    function* postDefend() {
      // a wolf laid to DEFEND its square, 15 ft round (drawn): the cleric 35 ft off -- it holds and readies; the cleric at 20 ft from the ward -- it goes at the cleric from inside
      // its ground; the cleric steps back out -- it holds again. Never further than 15 ft from the ward
      stage([cleric, wolves[0]], [[0, 4], [0, -3]]); setPin(15, null); cleric.maxhp = cleric.hp = 200; var w = wolves[0], ward = [w.x, w.y], far = [];
      try {
        w.post = { kind: 'defend', at: ward.slice(), to: ward.slice(), r: 15 }; freshEars(); D.postures.start(B); postMarks = groundMarks(ward, 15, 'rgb(120,170,255)');
        var check = function () { var d = G.dist(w, { x: ward[0], y: ward[1], size: 1 }); far.push(d); return d; };
        say(['A wolf laid to DEFEND the square under it: it holds within 15 ft of that ward (drawn). The cleric 35 ft off.']); yield W(70);
        yield* aiTurn(w); yield W(40); check(); var rd1 = !!w.ready;
        say(['The cleric comes to 20 ft from the ward: near enough to reach from inside the wolf\'s ground.']); yield W(50);
        yield* walkUp(cleric, ward[0], ward[1] + 4); B.round = 2; var n = mark(); yield* aiTurn(w); yield W(60); check(); var bit = /Wolf[^|]*>[^|]*Bite/.test(since(n));
        say(['The cleric steps back out of its ground.']); yield W(40);
        yield* walkUp(cleric, ward[0], ward[1] + 7); B.round = 3; yield* aiTurn(w); yield W(60); var dLast = check();
        var kept = far.every(function (d) { return d <= 15; });
        return [rd1 && bit && kept && !w.postBroke, 'held and readied at 35 ft ' + rd1 + '; at 20 ft it bit ' + bit + '; the cleric gone, it stayed ' + dLast + ' ft from the ward; its distances ' + far.join(', ') + ' ft (never past 15: ' + kept + ')'];
      } finally { unpost([w, cleric]); }
    }
    function* postPatrol() {
      // a wolf laid on PATROL in the dark, its rune and its second square drawn: it walks there and back knowing of no one; the light comes up, it sees the cleric, the patrol breaks
      stage([cleric, wolves[0]], [[0, 5], [-6, -3]]); setPin(15, null); cleric.maxhp = cleric.hp = 200; var w = wolves[0], a = [w.x, w.y], b = [w.x + 11, w.y], dk0 = B.dark, legs = [];
      try {
        B.dark = true; w.post = { kind: 'patrol', at: a.slice(), to: b.slice() }; freshEars(); D.postures.start(B); postMarks = [[a[0], a[1], 'rgb(240,200,90)', 0.5], [b[0], b[1], 'rgb(240,200,90)', 0.5]];
        say(['A wolf laid on PATROL in the dark: from its rune to the second square (both drawn) and back, while it knows of no one. It has no darkvision; the cleric is out there unseen.']); yield W(80);
        for (var t = 1; t <= 3; t++) { B.round = t; yield* aiTurn(w); legs.push(sqOf(w)); yield W(30); }
        var walked = legs[1] === sqOf({ x: b[0], y: b[1] }) && w.x < b[0] && !w.postBroke;
        say(['The light comes up: it sees the cleric.']); yield W(40);
        B.dark = false; B.round = 4; var d0 = G.dist(w, cleric); yield* aiTurn(w); yield W(60); var broke = /^sees/.test(w.postBroke || '') && G.dist(w, cleric) < d0;
        return [walked && broke, 'three turns: ' + legs.join(' -> ') + ' (there and turning back: ' + walked + '); in the light: ' + (broke ? 'it broke off ("' + w.postBroke + '") and came on' : 'not broken: ' + (w.postBroke || 'none'))];
      } finally { B.dark = dk0; unpost([w, cleric]); }
    }
    function* postStand() {
      // a wolf laid to STAND, waiting with a Ready (SRD 5.1): the cleric 30 ft off -- it holds, its bite readied; the cleric walks up -- the readied bite; it is in the fight now,
      // and when the cleric steps back it comes on
      stage([cleric, wolves[1]], [[0, 3], [0, -3]]); setPin(15, null); cleric.maxhp = cleric.hp = 200; var w = wolves[1], x0 = w.x, y0 = w.y;
      try {
        w.post = { kind: 'stand', at: [w.x, w.y] }; freshEars(); D.postures.start(B); postMarks = [[x0, y0, 'rgb(200,200,210)', 0.45]];
        say(['A wolf laid to STAND: it waits where it was laid, with a Ready. The cleric 30 ft off.']); yield W(60);
        yield* aiTurn(w); yield W(40); var held = w.x === x0 && w.y === y0 && !!w.ready;
        say(['The cleric walks up to it.']); yield W(40);
        B.round = 2; var n = mark(); yield* walkUp(cleric, x0, y0 + 1); yield W(70); var sprung = /readied/.test(since(n)) && w.postBroke === 'strikes';
        say(['In the fight now: the cleric steps back, and it comes on.']); yield W(40);
        yield* walkUp(cleric, x0, y0 + 5); B.round = 3; yield* aiTurn(w); yield W(60); var came = w.x !== x0 || w.y !== y0;
        return [held && sprung && came, 'held, its bite readied ' + held + '; the cleric beside it: ' + (sprung ? 'the readied bite, the stand broken' : 'no readied bite') + '; the cleric back: it ' + (came ? 'came on to ' + sqOf(w) : 'stayed')];
      } finally { unpost([w, cleric]); }
    }
    function* surpriseAttack() {
      // the bugbear's Surprise Attack by the SRD (11-10, his "5 - aye"): round 1, its morningstar pinned to hit the paladin (not surprised) and the cleric (caught unaware): the 2d6
      // on the cleric only
      stage([paladin, cleric, bugbear], [[-1, 1], [1, 1], [0, 0]]); setPin(18, null); paladin.maxhp = paladin.hp = 200; cleric.maxhp = cleric.hp = 200;
      try {
        cleric.conds.surprised = true; B.round = 1;
        say(['Round 1. The cleric was caught unaware at the fight\'s start; the paladin was not. The bugbear\'s morningstar is pinned to hit both. SRD 5.1: "If the bugbear surprises a creature and hits it with an attack during the first round of combat, the target takes an extra 7 (2d6) damage."']); yield W(110);
        turn(bugbear); var n = mark(); yield* fire(B.attack(bugbear, paladin, bugbear.attacks.morningstar)); yield W(60); var lp = since(n);
        turn(bugbear); n = mark(); yield* fire(B.attack(bugbear, cleric, bugbear.attacks.morningstar)); B.active = null; yield W(80); var lc = since(n);
        var ok = !/surprise attack/.test(lp) && /surprise attack 2d6/.test(lc);
        return [ok, 'at the paladin: ' + (/surprise attack/.test(lp) ? 'the 2d6 (wrong)' : 'no extra') + '; at the cleric: ' + (/surprise attack 2d6/.test(lc) ? 'the 2d6' : 'no extra (wrong)')];
      } finally { unpost([paladin, cleric, bugbear]); }
    }
    function* realSurprise() {
      // real surprise in any fight (11-10, his "we should have 'real' surprise"; battle.js Battle.surpriseRoll): a giant spider lurking hidden, no rune -- its Stealth rolled for
      // the surprise alone, the d20 pinned at 10; then the other side: the rogue hid before the fight (Stealth 25), a goblin alone against her
      stage([cleric, wizard, spider], [[-1, 3], [1, 3], [0, -3]]); setPin(10, null); freshEars();
      try {
        spider.conds.hidden = true;
        say(['A giant spider lurks unseen in the dark corner -- no rune, no posture. Any fight where someone starts hidden rolls the SRD\'s surprise: its Stealth against each passive Perception (the d20 pinned at 10).']); yield W(90);
        var n = mark(); var c1 = yield* fire(B.surpriseRoll()); yield W(60); var l1 = since(n), t1 = +((l1.match(/Spider (\d+)/) || [])[1] || 0);
        var fair = [cleric, wizard].every(function (h) { return !!h.conds.surprised === ((h.perception || 10) < t1); }), plain = spider.conds.hidden && spider.hidTotal == null;
        var caughtN = [cleric, wizard].filter(function (h) { return h.conds.surprised; }).map(function (h) { return h.name + ' (' + h.perception + ')'; });
        cleric.conds = {}; wizard.conds = {}; delete spider.conds.hidden;
        stage([rogue, gob], [[0, 2], [0, -2]]); freshEars(); rogue.conds.hidden = true; rogue.hidTotal = 25;
        say(['The other side: the rogue hid before the fight began (her Stealth 25). The goblin, alone, has a passive Perception of 9.']); yield W(70);
        n = mark(); yield* fire(B.surpriseRoll()); yield W(60); var l2 = since(n), gc = !!gob.conds.surprised;
        return [/AMBUSH/.test(l1) && t1 > 0 && fair && plain && /UNSEEN/.test(l2) && gc, 'the spider\'s Stealth ' + t1 + ': caught ' + (caughtN.join(', ') || 'no one') + ' (' + (fair ? 'those below it, as the rule says' : 'NOT as the rule says') + '), its hide the plain one after ' + plain + '; the rogue unseen: the goblin ' + (gc ? 'caught unaware' : 'not caught (wrong)')];
      } finally { unpost([cleric, wizard, spider, rogue, gob]); delete rogue.hidTotal; }
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
      { id: 'keenwolves', group: 'gridfix1107', name: 'Keen hearing and smell', what: 'A wolf\'s Keen Hearing and Smell (advantage on Perception that relies on hearing or smell) counts in the Perception that finds a hider: its passive 13 is 18. The rogue hides from two wolves and a goblin, Stealth 15: hidden from the goblin (9), seen by the wolves -- "Wolf x2 (18, keen hearing and smell)". (11-06, his road fight: "Seen by: Wolf x2 (13)".)', run: keenWolves },
      { id: 'keendark', group: 'gridfix1107', name: 'By ear and nose, in the dark', what: 'A keen hearing or smell finds a hider without sight. In the dark the rogue hides from a wolf and a bandit, Stealth 15: neither can see her; the wolf\'s nose and ears find her by its passive 13 +5, "Wolf (18, keen hearing and smell, without sight)"; the bandit cannot. (11-07, his "yeah - for all the monsters with non-vision senses notes".)', run: keenDark },
      { id: 'shaketrance', group: 'gridfix1110', name: 'Shaken out of a Hypnotic Pattern', what: 'The wizard and the bard stand entranced. HELP from the cleric beside the wizard shakes him out of the stupor (SRD 5.1: "someone else uses an action to shake the creature out of its stupor"). The goblin\'s blow on the bard lands on 20 temporary hit points: still damage taken, and the trance breaks. (11-09, his stream\'s fight 2: Vivian stood entranced five rounds, friends beside her and a blow on her temporary hit points.)', run: shakeTrance },
      { id: 'chuultentacles', group: 'gridfix1110', name: 'The chuul\'s tentacles: a save, no roll', what: 'SRD 5.1: "One creature grappled by the chuul must succeed on a DC 13 Constitution saving throw or be poisoned for 1 minute. Until this poison ends, the target is paralyzed." No attack roll: the cleric\'s Protection is not asked, a d20 of 1 changes nothing, and there is no damage. (11-09, his record: Protection\'s prompt and a nat-1 HIT on the tentacles.)', run: chuulTentacles },
      { id: 'spikeflier', group: 'gridfix1110', name: 'Spike Growth and a flier', what: 'Spike Growth is the ground\'s. A harpy 5 ft up crosses the spikes untouched; on the surface, no height held, the thorns reach it, 2d4 a square. (11-10, your rulings: "spiked shouldn\'t impact fliers over 5ft unless SRD contradicts", then "spare 5ft too, head cannon says it\'s about 3 ft deep".)', run: spikeFlier },
      { id: 'thrownpickup', group: 'gridfix1110', name: 'A thrown weapon picked up', what: 'A thrown weapon lands: a miss on the square past the target, a hit at its feet. Walked onto, one of the party takes it up (the hand on an object, free); the fight won, what still lies there is gathered into the pack. (11-10, your "pickup with auto-pack ground items at fight end".)', run: thrownPickup },
      { id: 'postambush', group: 'postures', name: 'A rune\'s AMBUSH', what: 'The Pocket DM\'s runes (11-10): a foe the DM laid in ambush is hidden from the start, its own Stealth held, and the SRD\'s surprise is rolled -- its Stealth against each passive Perception; caught unaware, no turn in round 1. It holds still: one of ours in sight but out of reach, it readies its blade unseen; one walks up, and the readied blow comes from hiding.', run: postAmbush },
      { id: 'postdefend', group: 'postures', name: 'A rune\'s DEFEND', what: 'A foe laid to defend holds within 15 ft of its ward (drawn): it readies against what comes, goes at one near the ward from inside its ground, and never chases out of it -- whatever it hears.', run: postDefend },
      { id: 'postpatrol', group: 'postures', name: 'A rune\'s PATROL', what: 'A foe laid on patrol walks from its rune to the second square (both drawn) and back while it knows of no one. A sight of one of ours (or a blow heard within 60 ft) breaks it, and it hunts as any foe.', run: postPatrol },
      { id: 'poststand', group: 'postures', name: 'A rune\'s STAND', what: 'A foe laid to stand waits where it was laid with a Ready (SRD 5.1). The first that comes into its reach gets the readied blow; struck or striking, it is in the fight, and fights as any foe.', run: postStand },
      { id: 'surpriseattack', group: 'postures', name: 'The bugbear\'s Surprise Attack', what: 'SRD 5.1: the bugbear\'s extra 2d6 lands on a hit in round 1 at a creature it surprised -- not on every round-1 hit, as it did till 11-10 (his record of 11-09: a fighter 36 to 0 in a round with nobody surprised; his "5 - aye").', run: surpriseAttack },
      { id: 'realsurprise', group: 'postures', name: 'Real surprise, any fight', what: 'Your "we should have \'real\' surprise": any fight where someone starts hidden -- a lurker, a rune\'s ambush, a story\'s hidden foes, one of ours who hid -- rolls the SRD\'s surprise, each hider\'s Stealth against each passive Perception on the other side; whoever notices no threat takes no turn in round 1. A spider lurking against the cleric and the wizard; then the rogue, hidden, against a goblin.', run: realSurprise },
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
