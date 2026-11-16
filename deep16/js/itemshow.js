/* DEEP16 -- three magic items of the SRD, shown (2026-11-15, the magic-items seat): the Rope of Climbing, the Ring of Water Walking and the Wand of Web (js/magicitems.js),
   played where the engine plays them, a beat at a time, on the Edifice (a 45 ft face to climb, the channel's deep water, the street), by a party of level 3, the dice pinned
   where a beat needs them to fall one way (its card says so). The shape is js/madeshow.js's: at the end of each beat the show waits -- ENTER (or E, or a click) plays it again,
   RIGHT the next, LEFT the one before.

     deep16/?itemshow              every beat, in order · &only=rope,ring,wand,lastcharge,dawn,bond keeps to those · &beat=N starts at the Nth · &fast no pauses (the bench)

   Each beat is staged (who stands where, what each holds, as its card says) and then run by the engine itself -- the rope set by exec 'rope', struck by Battle.cutRope, taken
   up by exec 'takerope'; the walk by exec 'move'; the wand by exec 'wand', its Web the engine's M.cast; the dawn by js/rules.js R.refresh -- so what it shows is what a fight
   does. Each beat checks what it showed; B.itemReport holds the tally (dev/bench16.js mode=magicitems1115 runs it headless with &fast). Where each item is met in the story
   is his word: nothing here places one. A show, not a rule: no fight reads this file, and the pins are the show's battle's only. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, I = D.input;
  var IS = D.itemshow = {};

  IS.make = function (q) {
    q = q || '';
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var FAST = /[?&]fast\b/.test(q), L = 3;
    var B = new D.Battle({ npc: { foes: ['goblin', 'goblin', 'goblin', 'goblin'], party: ['wizard:' + L + ':human+wandofweb', 'fighter:' + L + ':human+ringwaterwalking', 'rogue:' + L + ':human'] },
      itemsTest: [['ropeclimbing', 1], ['rope', 1]],
      fightDef: D.classFight(L, { what: 'Three magic items of the SRD, shown', map: 'edifice', intro: 'A beat at a time. ENTER plays a beat again.' }) });
    B.itemshow = true;
    var enter0 = B.enter;
    B.enter = function () { enter0.apply(this, arguments); this.req = null; this.co = show(this, get, FAST); };
    return B;
  };

  function* show(B, get, FAST) {
    var W = function (n) { return FAST ? 1 : n * 2; }, Rr = window.DS.R, MI = D.magicItems, I0 = window.DS.DATA.items;
    var all = B.units.slice(), party = all.filter(function (w) { return w.side === 'party' && !w.familiar; }), foes = all.filter(function (w) { return w.side === 'foe'; });
    var cls = function (c) { return party.filter(function (w) { return w.cls === c; })[0]; }, kind = function (k) { return foes.filter(function (w) { return w.kind === k; }); };
    var wizard = cls('wizard'), fighter = cls('fighter'), rogue = cls('rogue'), gobs = kind('goblin').slice(0, 3), ogre = kind('goblin')[3]; // (ogre: the one that goes for the rope, a goblin)
    var keep = all.map(function (w) { return { u: w, hp: w.maxhp, slots: w.slots ? w.slots.slice() : null, equip: w.src && w.src.equip ? JSON.parse(JSON.stringify(w.src.equip)) : null, attuned: w.src && w.src.attuned ? w.src.attuned.slice() : null }; });
    var report = B.itemReport = [];
    D.iso.zoom = Math.max(D.iso.zoom || 1, 2.2);
    B.dark = false;
    var m = G.map, st = m.def.step;

    // ---- the dice: pinned for a beat, and only while this battle is the one up (a queue of d20s outside a save, the saves by their ability, the d6 of the dawn)
    var d0 = D.d, save0 = RU.save, inSave = [], pin = { q: null, saves: null, d6: null };
    RU.save = function (u, ab) { inSave.push(ab); try { return save0.apply(this, arguments); } finally { inSave.pop(); } };
    D.d = function (n) {
      if (D.battle === B && n === 20) {
        var ab = inSave[inSave.length - 1];
        if (ab && pin.saves && pin.saves[ab] != null) return pin.saves[ab];
        if (!ab && pin.q && pin.q.length) return pin.q.shift();
      }
      if (D.battle === B && n === 6 && pin.d6 != null) return pin.d6;
      return d0.apply(this, arguments);
    };
    function setPin(q, saves, d6) { pin.q = q ? q.slice() : null; pin.saves = saves || null; pin.d6 = d6 == null ? null : d6; }

    // the squares the beats stand on, read off the Edifice (the bench's own: the 45 ft face at x 18, the rim (18,15) over the street (18,16); the channel's deep water east)
    var open = function (x, y, z) { var s = m.at(x, y); return !!(s && s.walk && !s.deep && (z == null || m.gz(x, y) === z)); };
    var TOP = [18, 15], FOOT = [18, 16];
    var tops = [[17, 15], [19, 15], [18, 14], [17, 14], [19, 14]].filter(function (p) { return open(p[0], p[1], m.gz(TOP[0], TOP[1])); });
    // the water walk: a run of deep water three squares or more long, a walked square at its west end, the row it lies on
    var shore = null;
    for (var y0 = 1; y0 < m.h - 1 && !shore; y0++) for (var x0 = 1; x0 < m.w - 4 && !shore; x0++) if (open(x0, y0, 0) && m.at(x0 + 1, y0).deep && m.at(x0 + 2, y0).deep && m.at(x0 + 3, y0).deep) shore = [x0, y0];
    // the street for the wand: the wizard at a walked square, three goblins bunched six to eight squares north of it on the level street
    var lane = null;
    for (var y1 = 24; y1 < m.h - 1 && !lane; y1++) for (var x1 = 20; x1 < m.w - 6 && !lane; x1++) {
      var ok = [[0, 0], [0, -6], [1, -6], [0, -7], [1, 0], [3, 0]].every(function (d) { return open(x1 + d[0], y1 + d[1], 0); });
      if (ok) lane = [x1, y1];
    }

    function stage(list, at) {
      keep.forEach(function (s) {
        var w = s.u;
        w.maxhp = s.hp; w.hp = s.hp; w.temp = 0; w.conds = {}; w.dead = false; w.ko = false; w.reaction = 1; w.anim = 'idle'; w.animT = B.t; w.flash = 0; w.fz = null;
        ['tween', 'ready', 'conc', 'hang', 'equip0'].forEach(function (key) { delete w[key]; });
        if (s.slots) w.slots = s.slots.slice();
        if (s.equip && w.src) { w.src.equip = JSON.parse(JSON.stringify(s.equip)); if (s.attuned) w.src.attuned = s.attuned.slice(); else delete w.src.attuned; }
        if (w.feats) Object.keys(w.feats).forEach(function (k) { if (/^charges_/.test(k)) delete w.feats[k]; });
      });
      if (D.magic && D.magic.endConc) B.units.forEach(function (w) { if (w.conc) { try { D.magic.endConc(B, w, 'the show'); } catch (e) { w.conc = null; } } });
      B.webs = []; B.ropes = (B.ropes || []).filter(function (r) { return r.fixed; });
      B.inv = [{ id: 'ropeclimbing', n: 1 }, { id: 'rope', n: 1 }];
      B.units = list.slice();
      list.forEach(function (w, i) { w.x = at[i][0]; w.y = at[i][1]; });
      list.forEach(function (w) { var o = list.filter(function (x) { return x !== w; })[0]; if (o) w.facing = B.faceTo(w, o); });
      G.setup(G.map, B.units); B.cache = null;
      B.round = 1; B.order = B.units.slice(); B.active = null;
      B.units.forEach(function (w) { RU.startTurn(w); });
      var mx = list.reduce(function (a, w) { return a + w.x; }, 0) / list.length, my = list.reduce(function (a, w) { return a + w.y; }, 0) / list.length;
      D.iso.lookAt(mx, my, G.map.gz(Math.round(mx), Math.round(my)));
      setPin(null, null, null);
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
    function* act(w, c) { RU.startTurn(w); B.active = w; yield* fire(B.exec(w, c)); B.active = null; }
    var ropeOf = function (id) { return (B.ropes || []).filter(function (r) { return !r.cut && r.item === id; })[0] || null; };
    var packN = function (id) { return (B.inv || []).filter(function (s) { return s.id === id; }).reduce(function (a, s) { return a + (s.n || 0); }, 0); };

    // ---- the beats
    function* rope() {
      if (tops.length < 2) return [false, 'no two squares beside the lip at ' + TOP.join(',')];
      stage([rogue, fighter, ogre], [FOOT, tops[0], tops[1]]); ogre.hp = ogre.maxhp = 200;
      var plain = D.Battle.ropeSq(B, rogue, TOP[0], TOP[1]), silk = D.Battle.ropeSq(B, rogue, TOP[0], TOP[1], null, 'ropeclimbing');
      say(['The Rope of Climbing: sixty feet of silk that moves when told. ' + rogue.name + ' stands in the street under the 45-ft face. The Rope & Grapple would be thrown up it, ' + (plain ? plain.ft + ' ft, DEX DC ' + plain.dc : 'out of its reach') + '. The silk is told: its far end climbs the face and fastens at the lip -- the action, no throw.']); yield W(130);
      var n = mark(); yield* act(rogue, { do: 'rope', x: TOP[0], y: TOP[1], item: 'ropeclimbing' }); yield W(70);
      var r1 = ropeOf('ropeclimbing'), l1 = since(n), set = !!r1 && r1.hp === 20 && r1.ac === 20 && !/throws the grapple/.test(l1) && packN('ropeclimbing') === 0 && !!silk && !silk.dc;
      // the ogre at it from up top, with one of ours on it: AC 20 and 20 hit points
      if (r1) { rogue.hang = { rope: r1, z: G.map.gz(FOOT[0], FOOT[1]) + 4 * st }; }
      var club = Object.keys(ogre.attacks).map(function (k) { return ogre.attacks[k]; }).filter(function (a) { return a && !a.ranged && a.dice; })[0];
      setPin([12, 17]);
      say(['Its AC 20 and 20 hit points, where a rope has AC 11 and 2. ' + rogue.name + ' hangs on it 10 ft up; a goblin goes for the rope at the lip: its d20 pinned at 12 (' + (12 + (club.atk || 0)) + ', a hit on any rope, a miss on this one), then at 17 (' + (17 + (club.atk || 0)) + ', a hit).']); yield W(130);
      n = mark(); RU.startTurn(ogre); yield* fire(B.cutRope(ogre, r1, club)); yield W(50); var hp1 = r1 && r1.hp;
      RU.startTurn(ogre); yield* fire(B.cutRope(ogre, r1, club)); yield W(70);
      var l2 = since(n), held = !!r1 && !r1.cut && hp1 === 20 && r1.hp < 20 && r1.hp > 0 && /vs AC 20/.test(l2) && !!rogue.hang;
      // taken up: back into the pack as itself
      delete rogue.hang; rogue.x = FOOT[0]; rogue.y = FOOT[1]; G.setup(G.map, B.units); B.cache = null;
      say([fighter.name + ' is told to take it up from the lip: it unfastens, coils itself and goes back into the pack.']); yield W(80);
      n = mark(); if (r1) yield* act(fighter, { do: 'takerope', x: TOP[0], y: TOP[1] }); yield W(60);
      var back = !ropeOf('ropeclimbing') && packN('ropeclimbing') === 1 && packN('rope') === 1;
      return [set && held && back, 'set from the street ' + (silk ? silk.ft + ' ft up' : '') + ', no throw, AC 20 and 20 HP (' + set + '); the goblin\'s 12 missed, its 17 hit for ' + (20 - (r1 ? r1.hp : 20)) + ' and the rope held with ' + (r1 ? r1.hp : '?') + ' left, ' + rogue.name + ' still on it (' + held + '); taken up, the pack has it again (' + back + ')'];
    }
    function* ring() {
      if (!shore) return [false, 'no deep water on this floor to walk'];
      stage([fighter, rogue], [shore, [shore[0], shore[1] - 1]]);
      var to = [shore[0] + 3, shore[1]], rmF = G.reach(fighter, fighter.turn.move), rmR = G.reach(rogue, rogue.turn.move), deepF = Object.keys(rmF).filter(function (k) { var a = k.split(','); return m.at(+a[0], +a[1]).deep && rmF[k].stand; }).length, deepR = Object.keys(rmR).filter(function (k) { var a = k.split(','); return m.at(+a[0], +a[1]).deep && rmR[k].stand; }).length;
      say(['The Ring of Water Walking: ' + fighter.name + ' wears it, ' + rogue.name + ' does not. The channel is deep water, walked by nothing that does not swim or fly. With the ring it is ground: ' + fighter.name + ' can stand on ' + deepF + ' squares of it this turn, ' + rogue.name + ' on ' + deepR + '.']); yield W(130);
      var path = G.path(rmF, to[0], to[1]), n = mark();
      if (path) { RU.startTurn(fighter); B.active = fighter; yield* fire(B.moveAlong(fighter, path, { spend: true })); B.active = null; }
      yield W(70);
      var on = m.at(fighter.x, fighter.y), walked = !!path && fighter.x === to[0] && fighter.y === to[1] && on.deep && !D.ui.wading(B, fighter) && deepF > 0 && deepR === 0;
      var still = null; for (var yy = 1; yy < m.h - 1 && !still; yy++) for (var xx = 1; xx < m.w - 1 && !still; xx++) { var q0 = m.at(xx, yy); if (q0 && q0.ch === '~' && q0.walk && !q0.deep && open(xx - 1, yy, m.gz(xx, yy))) still = [xx, yy]; }
      var cF = still ? G.stepCost(fighter, still[0] - 1, still[1], still[0], still[1]) : null, cR = still ? G.stepCost(rogue, still[0] - 1, still[1], still[0], still[1]) : null;
      say(['And the still water of a fountain\'s pool is ground to it too: a step in costs ' + cF + ' ft with the ring, ' + cR + ' ft without (difficult terrain).']); yield W(90);
      return [walked && cF === 5 && cR === 10, fighter.name + ' with the ring: ' + deepF + ' squares of deep water to stand on, walked 15 ft out onto it and stands there, drawn on it, not in it (' + walked + '); ' + rogue.name + ' without: ' + deepR + '; a step into a fountain\'s pool ' + cF + ' ft with it, ' + cR + ' without'];
    }
    function* wand() {
      if (!lane) return [false, 'no open street for the wand'];
      stage([wizard, fighter].concat(gobs), [lane, [lane[0] + 3, lane[1]], [lane[0], lane[1] - 6], [lane[0] + 1, lane[1] - 6], [lane[0], lane[1] - 7]]);
      gobs.forEach(function (g) { g.hp = g.maxhp = 100; });
      var s0 = wizard.slots.slice(), w0 = MI.wandOf(wizard), ring0 = B.commands(wizard).filter(function (c) { return c.id === 'wand'; })[0];
      setPin(null, { dex: 3 });
      say(['The Wand of Web: seven charges. ' + wizard.name + ' holds it, bonded. On the ring: ' + (ring0 ? ring0.label : 'NOTHING') + '. The action and a charge cast Web from it, DEX DC 15 (not the wizard\'s own DC ' + wizard.spellDC + '), and no slot is spent. The goblins\' DEX saves pinned at 3.']); yield W(140);
      var n = mark(); yield* act(wizard, { do: 'wand', target: { x: lane[0], y: lane[1] - 6 } }); yield W(80);
      var l = since(n), w1 = MI.wandOf(wizard), held = gobs.filter(function (g) { return g.conds.restrained && g.conds.restrained.dc === 15; }).length;
      var ok = !!ring0 && w0.n === 7 && w1.n === 6 && s0.join('/') === wizard.slots.join('/') && /DEX DC 15/.test(l) && held >= 2 && !!wizard.conc && wizard.conc.id === 'web' && wizard.turn.action === 0;
      return [ok, 'the ring\'s ' + (ring0 && ring0.label) + '; Web from it at DC 15 (' + /DEX DC 15/.test(l) + '), ' + held + ' goblins held, the wizard concentrating on it; the charges ' + w0.n + ' to ' + w1.n + ', the slots untouched (' + s0.join('/') + ')'];
    }
    function* lastCharge() {
      if (!lane) return [false, 'no open street for the wand'];
      stage([wizard].concat(gobs), [lane, [lane[0], lane[1] - 6], [lane[0] + 1, lane[1] - 6], [lane[0], lane[1] - 7]]); gobs.forEach(function (g) { g.hp = g.maxhp = 100; });
      MI.setCharges(wizard, 'wandofweb', 1); setPin([2], { dex: 3 });
      say(['Its last charge. The wand has 1 left; when the last is spent, a d20: on a 1 it crumbles into ashes. Here the d20 pinned at 2: it holds, empty till dawn.']); yield W(120);
      var n = mark(); yield* act(wizard, { do: 'wand', target: { x: lane[0], y: lane[1] - 6 } }); yield W(70);
      var l1 = since(n), wE = MI.wandOf(wizard), kept = !!wE && wE.n === 0 && !wE.ok && wizard.src.equip.wand === 'wandofweb' && /d20 2 -- it holds/.test(l1);
      var ringE = B.commands(wizard).filter(function (c) { return c.id === 'wand'; })[0];
      stage([wizard].concat(gobs), [lane, [lane[0], lane[1] - 6], [lane[0] + 1, lane[1] - 6], [lane[0], lane[1] - 7]]); gobs.forEach(function (g) { g.hp = g.maxhp = 100; });
      MI.setCharges(wizard, 'wandofweb', 1); setPin([1], { dex: 3 });
      say(['Again, the d20 pinned at 1.']); yield W(70);
      n = mark(); yield* act(wizard, { do: 'wand', target: { x: lane[0], y: lane[1] - 6 } }); yield W(90);
      var l2 = since(n), gone = !wizard.src.equip.wand && !MI.wandOf(wizard) && /crumbles into ashes/.test(l2) && (wizard.src.attuned || []).indexOf('wandofweb') < 0 && !B.commands(wizard).some(function (c) { return c.id === 'wand'; });
      return [kept && !!ringE && !ringE.ok && gone, 'the last charge on a 2: held, 0 of 7, its ring button grey (' + (ringE && ringE.why) + ') (' + kept + '); on a 1: crumbled, out of the hand and its bond gone (' + gone + ')'];
    }
    function* dawn() {
      stage([wizard], [lane || FOOT]);
      var h = JSON.parse(JSON.stringify(wizard.src)); h.feats = h.feats || {}; h.feats[Rr.chargeKey('wandofweb')] = 0;
      setPin(null, null, 4); D.battle = B;
      say(['At dawn -- the long rest -- the wand gets 1d6 + 1 charges back. From 0, the d6 pinned at 4: 5. From 5, the same 5 would go past 7: it stops at 7.']); yield W(120);
      Rr.refresh(h, true); var a = Rr.charges(h, 'wandofweb');
      h.feats[Rr.chargeKey('wandofweb')] = 5; Rr.refresh(h, true); var b = Rr.charges(h, 'wandofweb'), full = !(Rr.chargeKey('wandofweb') in h.feats);
      setPin(null, null, null);
      say(['From 0: ' + a + ' charges. From 5: ' + b + '.']); yield W(80);
      return [a === 5 && b === 7 && full, 'from 0 with a 4: ' + a + '; from 5: ' + b + ', full (' + full + ')'];
    }
    function* bond() {
      stage([wizard, fighter], [lane || FOOT, [(lane || FOOT)[0] + 2, (lane || FOOT)[1]]]);
      var hf = JSON.parse(JSON.stringify(fighter.src)); hf.equip.wand = 'wandofweb'; hf.attuned = []; var said = Rr.attune(hf);
      var hw = JSON.parse(JSON.stringify(wizard.src)); hw.attuned = []; var saidW = Rr.attune(hw);
      fighter.src.equip.wand = 'wandofweb'; var cF = B.commands(fighter).filter(function (c) { return c.id === 'wand'; })[0];
      say(['It takes a bond, and only a spellcaster\'s. Held by ' + fighter.name + ' at a rest: "' + said.join(' ') + '" Held by ' + wizard.name + ': "' + saidW.join(' ') + '"']); yield W(140);
      var ok = /wants a spellcaster/.test(said.join(' ')) && hf.attuned.indexOf('wandofweb') < 0 && hw.attuned.indexOf('wandofweb') >= 0 && !!cF && !cF.ok && /spellcaster/.test(cF.why || '') && !Rr.bonded(hf, 'wandofweb');
      return [ok, fighter.name + ': "' + said.join(' ') + '", the ring\'s button grey (' + (cF && cF.why) + '); ' + wizard.name + ': "' + saidW.join(' ') + '"'];
    }

    var BEATS = [
      { id: 'rope', name: 'The Rope of Climbing: set with no throw, AC 20 and 20 hit points', what: 'SRD 5.1 Rope of Climbing (wondrous, uncommon): 60 ft of silk; its far end goes where it is told and fastens; AC 20, 20 hit points. Your route words for the Missing Five: "they should get a rope and drag up the five". Where it is met is your word.', run: rope },
      { id: 'ring', name: 'The Ring of Water Walking: deep water is ground', what: 'SRD 5.1 Ring of Water Walking (ring, uncommon): "you can stand on and move across any liquid surface as if it were solid ground". For Halfway Lake and the Wet. Where it is met is your word.', run: ring },
      { id: 'wand', name: 'The Wand of Web: an action and a charge, DC 15', what: 'SRD 5.1 Wand of Web (wand, uncommon, requires attunement by a spellcaster): 7 charges; an action and a charge cast Web from it at save DC 15. For Web Gulch and the Braiding Ettercap. Where it is met is your word.', run: wand },
      { id: 'lastcharge', name: 'The wand\'s last charge: the d20', what: 'SRD 5.1: "If you expend the wand\'s last charge, roll a d20. On a 1, the wand crumbles into ashes and is destroyed."', run: lastCharge },
      { id: 'dawn', name: 'The wand at dawn: 1d6 + 1 back', what: 'SRD 5.1: "The wand regains 1d6 + 1 expended charges daily at dawn." The game\'s dawn is the long rest.', run: dawn },
      { id: 'bond', name: 'The wand\'s bond: a spellcaster\'s only', what: 'SRD 5.1: "requires attunement by a spellcaster". A bond is made at a rest while it is held (the game\'s attunement since 10-06).', run: bond }
    ];

    var only = get('only'), list = BEATS.filter(function (b) { return !only || only.split(',').some(function (o) { return o === b.id; }); });
    var i = Math.max(0, Math.min(list.length - 1, (+(get('beat') || 1)) - 1));
    try {
      while (i < list.length) {
        var b = list[i];
        B.clearCards();
        B.card(['{y}THREE MAGIC ITEMS OF THE SRD  ' + (i + 1) + ' / ' + list.length + ':  ' + b.name.toUpperCase() + '{/}'].concat(D.wrap(b.what, 440).map(function (l) { return '{g}' + l + '{/}'; })), 1e9);
        yield W(60);
        var res;
        try { res = yield* b.run.call(b); } catch (e) { res = [false, 'threw: ' + String(e && e.message || e)]; if (window.console) console.error('itemshow ' + b.id, e); }
        setPin(null, null, null);
        var rep = { id: b.id, name: b.name, ok: !!res[0], why: res[1], log: (B.log || []).slice(-40).join(' | ') };
        var at = report.map(function (r) { return r.id; }).indexOf(b.id); if (at >= 0) report[at] = rep; else report.push(rep);
        B.clearCards();
        B.card(['{y}' + (i + 1) + ' / ' + list.length + ':  ' + b.name.toUpperCase() + '{/}  ' + (res[0] ? '{n}SHOWN{/}' : '{r}NOT AS IT SHOULD BE{/}'), '{g}' + res[1] + '{/}'].concat(FAST ? [] : ['', '{c}ENTER{/} again   {c}RIGHT{/} next   {c}LEFT{/} back']), 1e9);
        if (FAST) { i++; continue; }
        var v = yield { itemshow: true };
        if (v === 'again') continue;
        if (v === 'back') { i = Math.max(0, i - 1); continue; }
        i++;
      }
    } finally { if (FAST) { D.d = d0; RU.save = save0; } }
    B.clearCards();
    var okN = report.filter(function (r) { return r.ok; }).length;
    B.card(['{y}THREE MAGIC ITEMS OF THE SRD: ' + okN + ' OF ' + report.length + '{/}'].concat(report.map(function (r) { return (r.ok ? '{n}ok{/}  ' : '{r}NO{/}  ') + r.name + '  {g}' + r.why + '{/}'; })).concat(FAST ? [] : ['', '{c}ENTER{/} from the top   {c}LEFT{/} the last beat again']), 1e9);
    if (!FAST) { yield { itemshow: true, done: true }; D.d = d0; RU.save = save0; B.co = show(B, get, FAST); }
  }
  var input0 = D.ui.input;
  D.ui.input = function (B, req) {
    if (!req.itemshow) return input0(B, req);
    D.ui.camera(B);
    var v = I.pressed('a') || I.mouse.click ? 'again' : I.repeat('right') || I.pressed('end') ? 'next' : I.repeat('left') ? 'back' : null;
    if (v) { D.sfx(v === 'again' ? 'confirm' : 'cursor'); B.answer(req.done ? 'again' : v); }
  };
})();
