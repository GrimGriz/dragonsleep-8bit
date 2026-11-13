/* DEEP16 -- the Seep's own, shown (2026-11-13, the wisp-and-stirge seat): the will-o'-wisp by the SRD, the stirge's latch, and their two mirrors, played where the
   engine plays them, on the class floor, one beat after another, the dice pinned where a beat needs them to fall one way (its card says so). The shape is
   js/rulesshow.js's: at the end of each beat the show waits -- ENTER (or E, or a click) plays it again, RIGHT the next, LEFT the one before.

     deep16/?seepshow              every beat, in order · &only=wisp,mirror,stirge or a beat's id keeps to those · &beat=N starts at the Nth · &fast no pauses (the bench)

   Each beat is staged (who stands where, as its card says) and then run by the engine itself -- a creature's whole turn is AI.turn, a hero's PULL IT OFF is B.exec --
   so what it shows is what a fight does. Each beat checks what it showed; B.seepReport holds the tally (dev/bench16.js mode=seep1113 runs it headless with &fast).
   A show, not a rule: no fight reads this file, and the pins are the show's battle's only. On the class floor nothing is at stake past the fight, so one lost for good
   here is dead for the fight and it goes on; in a game being played the game is over on that line (the card: deep16/?slainfail). */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, I = D.input;
  var SS = D.seepshow = {};

  SS.make = function (q) {
    q = q || '';
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var FAST = /[?&]fast\b/.test(q), L = 3; // (level 3, as the story's doors are staged)
    var B = new D.Battle({ npc: { foes: ['wisp', 'mirrorwisp', 'stirge', 'mirrorstirge'], party: ['cleric:' + L + ':human', 'wizard:' + L + ':human', 'fighter:' + L + ':human'] },
      fightDef: D.classFight(L, { what: 'The Seep\'s own, shown', intro: 'A beat at a time. ENTER plays a beat again.' }) });
    B.seepshow = true;
    var enter0 = B.enter;
    B.enter = function () { enter0.apply(this, arguments); this.req = null; this.co = show(this, get, FAST); };
    return B;
  };

  function* show(B, get, FAST) {
    var S = D.seep, AI = D.ai;
    var W = function (n) { return FAST ? 1 : n * 2; };
    var all = B.units.slice(), party = all.filter(function (w) { return w.side === 'party' && !w.familiar; }), foes = all.filter(function (w) { return w.side === 'foe'; });
    var cls = function (c) { return party.filter(function (w) { return w.cls === c; })[0]; }, kind = function (k) { return foes.filter(function (w) { return w.kind === k; })[0]; };
    var cleric = cls('cleric'), wizard = cls('wizard'), fighter = cls('fighter');
    var wisp = kind('wisp'), mwisp = kind('mirrorwisp'), stirge = kind('stirge'), mstirge = kind('mirrorstirge');
    var keep = all.map(function (w) { return { u: w, hp: w.maxhp, slots: w.slots ? w.slots.slice() : null, glow: w.glow ? Object.assign({}, w.glow) : null }; });
    var cx = Math.floor(G.map.w / 2), cy = Math.floor(G.map.h / 2);
    var report = B.seepReport = [];
    D.iso.zoom = Math.max(D.iso.zoom || 1, 2.4);
    B.dark = false;

    // ---- the dice: pinned for a beat, and only while this battle is the one up (js/rulesshow.js's way)
    var d0 = D.d, save0 = RU.save, inSave = 0, k = 0, pin = { hit: null, saves: null };
    RU.save = function () { var k0 = k; inSave++; k = 0; try { return save0.apply(this, arguments); } finally { inSave--; k = k0; } };
    D.d = function (n) {
      if (D.battle === B && n === 20) {
        if (inSave && pin.saves && k < pin.saves.length) return pin.saves[k++];
        if (!inSave && pin.hit != null) return pin.hit;
      }
      return d0.apply(this, arguments);
    };
    function setPin(hit, saves) { pin.hit = hit; pin.saves = saves || null; }

    function stage(list, at) {
      keep.forEach(function (s) {
        var w = s.u; if (w.riding && B.dismount) { try { B.dismount(w); } catch (e) { } }
        w.maxhp = s.hp; w.hp = s.hp; w.temp = 0; w.conds = {}; w.dead = false; w.ko = false; w.slain = false; w.reaction = 1; w.anim = 'idle'; w.animT = B.t; w.flash = 0; w.fz = null;
        ['tween', 'ready', 'conc', 'lurked', 'drained', 'slainLine', 'downSaid', 'riding', 'attached', 'master'].forEach(function (key) { delete w[key]; });
        if (s.slots) w.slots = s.slots.slice(); if (s.glow) w.glow = Object.assign({}, s.glow);
        if (w.invis) w.invis.used = false;
      });
      B.slainLost = null; B.slainLine = null; B.riders = (B.riders || []).filter(function (r) { return all.indexOf(r) < 0; });
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
    var down = function (w) { w.hp = 0; w.ko = true; w.anim = 'hurt'; w.animT = B.t - 400; };
    var lit = function (w) { return (D.light && D.light.carried ? D.light.carried(w) : []).filter(function (l) { return l.kind === 'glow'; })[0] || null; };

    // ---- the beats
    function* consumeSaved() {
      stage([fighter, wisp, cleric], [[0, 0], [1, 0], [-6, 3]]); down(fighter); wisp.hp = 14; setPin(15, [15]);
      say([fighter.name + ' is down at 0 hit points, the will-o\'-wisp beside. Its bonus action is Consume Life: a CON save, DC 10 -- pinned at 15.']); yield W(70);
      var n = mark(), hp0 = wisp.hp; yield* go(wisp); yield W(60);
      var l = since(n), ok = /CONSUME LIFE/.test(l) && /SAVED/.test(l) && !fighter.dead && !fighter.slain && wisp.hp === hp0;
      return [ok, /CONSUME LIFE/.test(l) ? (/SAVED/.test(l) ? 'saved on 15: ' + fighter.name + ' holds on, still down, not dead; the wisp regains nothing' : 'no SAVED on a 15') : 'the wisp did not use Consume Life'];
    }
    function* consumeLife() {
      stage([fighter, wisp, cleric], [[0, 0], [1, 0], [-1, 0]]); down(fighter); wisp.hp = 5; setPin(2, [3]);
      say([fighter.name + ' is down again, and the save is pinned at 3. Failed, and ' + fighter.name + ' is dead for good: no healing reaches them. In a game being played the game is over on that line.']); yield W(80);
      var n = mark(), hp0 = wisp.hp; yield* go(wisp); yield W(90);
      var l = since(n), line = S.LINES.life(fighter.name), healed = wisp.hp - hp0;
      var n2 = mark(), back = B.heal(fighter, 8); yield W(60); var l2 = since(n2);
      var ok = /FAILED/.test(l) && l.indexOf(line) >= 0 && fighter.dead && fighter.slain && healed > 0 && back === 0 && /no healing reaches/.test(l2) && !B.slainLost;
      return [ok, (l.indexOf(line) >= 0 ? '"' + line + '"' : 'the line not said') + '; dead ' + !!fighter.dead + '; the wisp regained ' + healed + ' (3d6); a cure after: ' + (back === 0 ? 'nothing, no healing reaches them' : back + ' healed (wrong)') + '; on this floor the fight goes on (' + (!B.slainLost) + ')'];
    }
    function* wardHolds() {
      stage([fighter, wisp, cleric], [[0, 0], [1, 0], [-6, 3]]); down(fighter); fighter.conds.deathWard = { by: cleric.id }; setPin(2, [3]);
      say([fighter.name + ' is down under a Death Ward. SRD 5.1: an effect that would kill instantly without damage is negated, and the ward ends.']); yield W(70);
      var n = mark(); yield* go(wisp); yield W(60);
      var l = since(n), ok = /death ward/.test(l) && !fighter.dead && !fighter.conds.deathWard;
      return [ok, ok ? 'the ward took it and is spent; no save rolled, ' + fighter.name + ' alive' : 'the ward did not take it'];
    }
    function* grace() {
      stage([wizard, wisp, cleric], [[0, 0], [1, 0], [-6, 3]]); wizard.hp = 1; wizard.reaction = 0; setPin(15, [3]);
      say(['The wizard has 1 hit point. The wisp\'s Shock is pinned to hit. It does not take the one its own Shock drops (the seat\'s call: a round to get them up) -- its bonus action is its light.']); yield W(80);
      var n = mark(), b0 = wisp.glow.bright; yield* go(wisp); yield W(60);
      var l1 = since(n), spared = wizard.hp <= 0 && !wizard.dead && !/CONSUME LIFE/.test(l1), b1 = wisp.glow.bright, l20 = lit(wisp);
      say(['Its next turn, the wizard still down: now it takes them. The save is pinned at 3.']); yield W(60);
      n = mark(); yield* go(wisp); yield W(80);
      var l2 = since(n), took = /CONSUME LIFE/.test(l2) && wizard.dead && wizard.slain;
      return [spared && took && b0 === 5 && b1 === 20 && !!l20 && l20.bright === 20 && l20.dim === 20, 'the Shock dropped the wizard and the wisp did not take them that turn (' + spared + '); its light went ' + b0 + ' to ' + b1 + ' ft bright (dim ' + (l20 ? l20.dim : '?') + ' more), a bonus action; the turn after, Consume Life (' + took + ')'];
    }
    function* lurk() {
      stage([cleric, wisp, wizard], [[0, 0], [1, 0], [-1, 1]]); wisp.hp = 10; wisp.glow.bright = wisp.glow.dim = 20; setPin(15, null);
      say(['The wisp is bloodied (10 of 22) for the first time: it fades -- Invisibility, its action -- draws its light in to 5 ft, and drifts off. Its light is gone with it while it is unseen.']); yield W(80);
      var n = mark(), at0 = [wisp.x, wisp.y]; yield* go(wisp); yield W(60);
      var l1 = since(n), inv = !!wisp.conds.invisible, b = wisp.glow.bright, dark = !lit(wisp), far = Math.max(Math.abs(wisp.x - at0[0]), Math.abs(wisp.y - at0[1]));
      say(['Its next turn it comes back unseen and strikes: the blow ends the Invisibility, and its light flares to 20.']); yield W(60);
      n = mark(); yield* go(wisp); yield W(70);
      var l2 = since(n), back = !wisp.conds.invisible && /Shock/.test(l2) && wisp.glow.bright === 20;
      return [inv && b === 5 && dark && far >= 2 && back, 'faded ' + inv + ', its light ' + b + ' ft and out while unseen (' + dark + '), ' + far * 5 + ' ft off; back the next turn with its Shock, seen again, bright ' + wisp.glow.bright];
    }
    function* through() {
      // Incorporeal Movement: a row of three between it and one down; a stirge cannot pass a foe's square, the wisp can, at twice the feet
      stage([cleric, wizard, fighter, wisp, stirge], [[0, -1], [0, 0], [-2, 0], [2, 0], [2, 3]]); down(fighter); setPin(15, [15]);
      wisp.fz = null; stirge.fz = null; var fl = [wisp.flies, stirge.flies]; wisp.flies = false; stirge.flies = false; // (on the ground for the beat, so the squares are the question)
      var cW = G.stepCost(wisp, 1, 0, 0, 0, null), cS = G.stepCost(stirge, 1, 0, 0, 0, null), sx = wizard.x, sy = wizard.y;
      cW = G.stepCost(wisp, sx + 1, sy, sx, sy, null); cS = G.stepCost(stirge, sx + 1, sy, sx, sy, null);
      var st = G.canStand(wisp, sx, sy);
      say(['Incorporeal Movement (SRD): through other creatures and objects as difficult terrain. The wizard\'s square costs the wisp ' + cW + ' ft to cross and it cannot stop there; a stirge cannot enter it at all. ' + fighter.name + ' lies beyond.']); yield W(90);
      var n = mark(); RU.startTurn(wisp); B.active = wisp;
      var rm = G.reach(wisp, wisp.turn.move), e = rm[(fighter.x + 1) + ',' + fighter.y] || rm[(fighter.x) + ',' + (fighter.y + 1)], viaCost = e ? e.cost : null;
      yield* fire(AI.turn(B, wisp)); B.active = null; yield W(70);
      wisp.flies = fl[0]; stirge.flies = fl[1];
      var l = since(n), got = G.dist(wisp, fighter) <= 5 && /CONSUME LIFE/.test(l);
      return [cW === 10 && cS === Infinity && !st && got, 'a foe\'s square: ' + cW + ' ft for the wisp (difficult), ' + (cS === Infinity ? 'barred' : cS) + ' for the stirge; it may not end there (' + !st + '); it reached ' + fighter.name + ' and used Consume Life (' + got + ')'];
    }
    function* mirrorWisp() {
      stage([wizard, mwisp, fighter], [[0, 0], [1, 0], [5, 2]]); mwisp.hp = 12; wizard.maxhp = wizard.hp = 120; wizard.reaction = 0; setPin(15, [3]); // (no Shield: the slots the beat counts are the ones eaten)
      var s0 = wizard.slots.slice(), hi = S.highSlot(wizard);
      say(['The mirror wisp: the wisp as Mr. Ripples makes things. Where the wisp has Consume Life it has CONSUME MAGIC: a bonus action, one within 5 ft with a spell slot left, CON DC 10 (pinned at 3) or the highest slot is eaten, and it regains 1d6 a level of it. The wizard\'s slots: ' + s0.join('/') + '.']); yield W(100);
      var n = mark(), hp0 = mwisp.hp; yield* go(mwisp); yield W(80);
      var l1 = since(n), s1 = wizard.slots.slice(), ate = s1[hi - 1] === s0[hi - 1] - 1 && s1.reduce(function (a, b) { return a + b; }, 0) === s0.reduce(function (a, b) { return a + b; }, 0) - 1, healed = mwisp.hp - hp0;
      setPin(15, [15]); wizard.reaction = 0; say(['Again, the save pinned at 15: saved, and every slot is kept.']); yield W(60);
      n = mark(); yield* go(mwisp); yield W(70);
      var l2 = since(n), s2 = wizard.slots.slice(), kept = s2.join('/') === s1.join('/') && /SAVED/.test(l2);
      stage([fighter, mwisp], [[0, 0], [1, 0]]); fighter.maxhp = fighter.hp = 120; setPin(15, [3]);
      say(['And at ' + fighter.name + ', who has no magic to eat: its Shock, and nothing else.']); yield W(60);
      n = mark(); yield* go(mwisp); yield W(60);
      var l3 = since(n), none = !/CONSUME MAGIC/.test(l3) && /Shock/.test(l3);
      return [/CONSUME MAGIC/.test(l1) && ate && healed > 0 && kept && none && !wizard.dead, 'slots ' + s0.join('/') + ' to ' + s1.join('/') + ': the level ' + hi + ' slot eaten, the mirror wisp regained ' + healed + ' (' + hi + 'd6); on a 15, kept (' + s2.join('/') + '); at the fighter, no Consume Magic (' + none + '); nobody dies of it'];
    }
    function* mirrorStirge() {
      stage([wizard, mstirge, fighter], [[0, 0], [1, 0], [-1, 0]]); wizard.maxhp = wizard.hp = 120; wizard.reaction = 0; setPin(15, null);
      var s0 = wizard.slots.slice();
      say(['The mirror stirge: its bite is a stirge\'s (pinned to hit), and it latches on. What it drinks is magic: each of its turns the LOWEST spell slot its host has left, no blood -- 5 a level toward the 10 that fills it. The wizard\'s slots: ' + s0.join('/') + '.']); yield W(100);
      var n = mark(); yield* go(mstirge); yield W(60);
      var on = !!mstirge.riding && mstirge.master === wizard, hpA = wizard.hp;
      yield* go(mstirge); yield W(60); var s1 = wizard.slots.slice();
      yield* go(mstirge); yield W(70); var s2 = wizard.slots.slice(), l = since(n), off = !mstirge.riding, noBlood = wizard.hp === hpA;
      var two = s2[0] === s0[0] - 2 && /5 of 10 so far/.test(l) && /10 of 10: full/.test(l) && /lets go, glutted/.test(l);
      stage([fighter, mstirge], [[0, 0], [1, 0]]); fighter.maxhp = fighter.hp = 120; setPin(15, null);
      say(['On ' + fighter.name + ', who has no magic: it drinks blood, as any stirge does.']); yield W(60);
      n = mark(); yield* go(mstirge); var hpF = fighter.hp; yield* go(mstirge); yield W(70);
      var l2 = since(n), blood = fighter.hp < hpF && /piercing from/.test(l2);
      return [on && two && off && noBlood && blood, 'latched ' + on + '; slots ' + s0.join('/') + ' to ' + s1.join('/') + ' to ' + s2.join('/') + ' (two 1st-level slots, 5 and 10 of 10), no blood lost (' + noBlood + '), then it let go (' + off + '); on the fighter, blood (' + blood + ')'];
    }
    function* latch() {
      stage([wizard, stirge, fighter], [[0, 0], [1, 0], [-1, 0]]); wizard.maxhp = wizard.hp = 120; wizard.reaction = 0; setPin(15, null);
      say(['The stirge (SRD 5.1 Blood Drain): the bite pinned to hit, it latches on; at the start of each of its turns the host loses 1d4+3 to blood loss. A creature can use its action to detach it -- no check.']); yield W(90);
      var n = mark(); yield* go(stirge); yield W(60);
      var on = !!stirge.riding && stirge.master === wizard, hp1 = wizard.hp; stirge.drained = 0; // (so one drink never fills it before the pull: the beat is the pull)
      yield* go(stirge); yield W(60); var drank = hp1 - wizard.hp;
      RU.startTurn(fighter); B.active = fighter;
      var cmd = B.commands(fighter).filter(function (c) { return c.id === 'detach'; })[0], note = cmd ? cmd.note : '(no PULL IT OFF on the wheel)';
      say(['PULL IT OFF on ' + fighter.name + '\'s wheel reads: "' + note + '".']); yield W(60);
      if (cmd && cmd.ok) yield* fire(B.exec(fighter, { do: 'detach', target: stirge }));
      B.active = null; yield W(70);
      var l = since(n), off = !stirge.riding && !wizard.conds.attached;
      return [on && drank >= 4 && /an action, no check/.test(note) && !/DC 1\b/.test(note) && off && /OFF/.test(l), 'latched ' + on + '; it drank ' + drank + ' (1d4+3); the wheel: "' + note + '"; pulled off for the action (' + off + ')'];
    }

    var BEATS = [
      { id: 'consumesaved', group: 'wisp', name: 'Consume Life, saved', what: 'SRD 5.1: "As a bonus action, the will-o\'-wisp can target one creature it can see within 5 feet of it that has 0 hit points and is still alive. The target must succeed on a DC 10 Constitution saving throw against this magic or die." Your word, 11-13: "they get a save against consume life".', run: consumeSaved },
      { id: 'consumelife', group: 'wisp', name: 'Consume Life, failed: lost to the Seep', what: 'Failed, the target dies -- for good -- and the wisp regains 3d6. Your word: "build it and have it end the game". On this floor nothing is at stake, so the fight goes on with one dead; in the game the next thing on the screen is the game-over card with this line (deep16/?slainfail).', run: consumeLife },
      { id: 'deathward', group: 'wisp', name: 'Consume Life and a Death Ward', what: 'The SRD\'s Death Ward negates an effect that would kill instantly without dealing damage, and ends.', run: wardHolds },
      { id: 'grace', group: 'wisp', name: 'A round to get them up; its light', what: 'The seat\'s call, yours to overrule: the wisp takes only one who was already down as its turn began. Variable Illumination (SRD: bright 5 to 20 ft, dim as far again, a bonus action): 5 as it lurks before its first turn, 20 as it hunts.', run: grace },
      { id: 'lurk', group: 'wisp', name: 'It fades and lurks', what: 'Invisibility (SRD, an action, at will): "The will-o\'-wisp and its light magically become invisible until it attacks or uses its Consume Life." The seat\'s call: it fades once, the first time it is bloodied.', run: lurk },
      { id: 'through', group: 'wisp', name: 'Incorporeal Movement', what: 'SRD 5.1: "The will-o\'-wisp can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) force damage if it ends its turn inside an object."', run: through },
      { id: 'mirrorwisp', group: 'mirror', name: 'The mirror wisp: Consume Magic', what: 'Yours, 11-13: "also make a mirror version that consumes magic (eats spell slots)". The wisp\'s whole frame, its hunger turned from life to magic. Every number the seat\'s call.', run: mirrorWisp },
      { id: 'mirrorstirge', group: 'mirror', name: 'The mirror stirge: it drinks slots', what: 'Yours, 11-13: "Let\'s mirror version of the stirge similar (drains spell slots)". On the stirge\'s own sheet under the mirror ripple till its art comes.', run: mirrorStirge },
      { id: 'latch', group: 'stirge', name: 'The stirge\'s latch, and PULL IT OFF', what: 'The wheel\'s line said "a STR check, DC 1" (accurate, and odd): it says "an action, no check" now.', run: latch }
    ];

    var only = get('only'), list = BEATS.filter(function (b) { return !only || only.split(',').some(function (o) { return o === b.id || o === b.group; }); });
    var i = Math.max(0, Math.min(list.length - 1, (+(get('beat') || 1)) - 1));
    while (i < list.length) {
      var b = list[i];
      B.clearCards();
      B.card(['{y}THE SEEP\'S OWN, SHOWN  ' + (i + 1) + ' / ' + list.length + ':  ' + b.name.toUpperCase() + '{/}'].concat(D.wrap(b.what, 440).map(function (l) { return '{g}' + l + '{/}'; })), 1e9);
      yield W(60);
      var res;
      try { res = yield* b.run.call(b); } catch (e) { res = [false, 'threw: ' + String(e && e.message || e)]; if (window.console) console.error('seepshow ' + b.id, e); }
      setPin(null, null);
      var rep = { id: b.id, name: b.name, ok: !!res[0], why: res[1], log: (B.log || []).slice(-40).join(' | ') };
      var at = report.map(function (r) { return r.id; }).indexOf(b.id); if (at >= 0) report[at] = rep; else report.push(rep);
      B.clearCards();
      B.card(['{y}' + (i + 1) + ' / ' + list.length + ':  ' + b.name.toUpperCase() + '{/}  ' + (res[0] ? '{n}SHOWN{/}' : '{r}NOT AS IT SHOULD BE{/}'), '{g}' + res[1] + '{/}'].concat(FAST ? [] : ['', '{c}ENTER{/} again   {c}RIGHT{/} next   {c}LEFT{/} back']), 1e9);
      if (FAST) { i++; continue; }
      var v = yield { seepshow: true };
      if (v === 'again') continue;
      if (v === 'back') { i = Math.max(0, i - 1); continue; }
      i++;
    }
    B.clearCards();
    var okN = report.filter(function (r) { return r.ok; }).length;
    B.card(['{y}THE SEEP\'S OWN, SHOWN: ' + okN + ' OF ' + report.length + '{/}'].concat(report.map(function (r) { return (r.ok ? '{n}ok{/}  ' : '{r}NO{/}  ') + r.name + '  {g}' + r.why + '{/}'; })).concat(FAST ? [] : ['', '{c}ENTER{/} from the top   {c}LEFT{/} the last beat again']), 1e9);
    if (!FAST) { yield { seepshow: true, done: true }; B.co = show(B, get, FAST); }
  }
  var input0 = D.ui.input;
  D.ui.input = function (B, req) {
    if (!req.seepshow) return input0(B, req);
    D.ui.camera(B);
    var v = I.pressed('a') || I.mouse.click ? 'again' : I.repeat('right') || I.pressed('end') ? 'next' : I.repeat('left') ? 'back' : null;
    if (v) { D.sfx(v === 'again' ? 'confirm' : 'cursor'); B.answer(req.done ? 'again' : v); }
  };
})();
