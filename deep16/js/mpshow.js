/* DEEP16 — MPMon, shown (10-06): Denny and Beholda's specials one beat at a time, the way the Skylights are shown (js/skyshow.js; Griz, 10-06: "see if this
   showing method works as first consideration when creating URLs for things that need to be seen (vs tested)").

     deep16/?mpshow               every beat, one after another, on the class floor: Denny and Beholda (js/mpmon.js) against goblins, hobgoblins and an ogre
     &beat=N · &only=gaze,taunt   start at the Nth, or keep to those · &fast cuts the pauses · &lvl=N their level (5; 5 to 9, the Big Screen and the Cannonball come at 5)

   Each beat is staged (who stands where) and then run by the engine itself -- the special as the ring's button runs it, the foes' own AI turns -- with the dice pinned
   where a beat needs them to go one way (the card says how). Each beat checks what it showed; the last card is the tally, and B.mpReport holds it (dev/bench16.js
   mode=mpmon1006 runs it headless). A show, not a rule: no fight reads this file, and the pins are the show's battle's only. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules;
  var MS = D.mpshow = {};

  MS.make = function (q) {
    q = q || '';
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var L = Math.max(5, Math.min(9, +(get('lvl') || 5))), FAST = /[?&]fast\b/.test(q);
    var B = D.npcFight('?npc=goblin,goblin,goblin,hobgoblin,ogre&vs=denny:' + L + ',beholda:' + L + '&lvl=' + L, {});
    var enter0 = B.enter;
    B.enter = function () { enter0.apply(this, arguments); this.req = null; this.co = show(this, get, FAST, L); };
    return B;
  };

  function* show(B, get, FAST, L) {
    var W = function (n) { return FAST ? 1 : n; }, MP = D.mpmon;
    var pool = B.units.slice(), kind = function (k) { return pool.filter(function (u) { return u.kind === k; }); };
    var dn = pool.filter(function (u) { return u.mpmon === 'denny'; })[0], bh = pool.filter(function (u) { return u.mpmon === 'beholda'; })[0];
    var gob = kind('goblin'), hob = kind('hobgoblin')[0], ogre = kind('ogre')[0];
    var orig = pool.map(function (u) { return { u: u, maxhp: u.maxhp }; });
    var report = B.mpReport = [], home = { x: dn.x, y: dn.y };

    // ---- the dice: pinned for a beat, and only while this battle is the one up
    var d0 = D.d, save0 = RU.save, inSave = 0, pin = { d20: null, save: null, top: false };
    RU.save = function () { inSave++; try { return save0.apply(this, arguments); } finally { inSave--; } };
    D.d = function (n) { if (D.battle === B) { if (n === 20) { if (inSave && pin.save != null) return pin.save; if (!inSave && pin.d20 != null) return pin.d20; } else if (pin.top) return n; } return d0.apply(this, arguments); };
    function setPin(d20, sv, top) { pin.d20 = d20; pin.save = sv; pin.top = !!top; }

    // ---- the stage
    function fresh(u, hp) {
      var o = orig.filter(function (x) { return x.u === u; })[0];
      u.maxhp = hp || (o ? o.maxhp : u.maxhp); u.hp = u.maxhp; u.temp = 0; u.conds = {}; u.dead = false; u.ko = false;
      ['tween', 'ready', 'conc'].forEach(function (k) { delete u[k]; });
      u.reaction = 1; u.anim = 'idle'; u.animT = B.t; u.flash = 0;
      if (u.mpmon) u.feats.specials = MP.SPECIALS;
    }
    function free(u, x, y) { return G.canStand(u, x, y) && !B.units.some(function (w) { return w !== u && !w.dead && w.x === x && w.y === y; }); }
    function spot(u, x, y) { for (var r = 0; r < 8; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; if (free(u, x + dx, y + dy)) return [x + dx, y + dy]; } return [x, y]; }
    function stage(list, focus) { // [unit, dx, dy, hp?] from Denny's square at the start
      B.units = [];
      list.forEach(function (e) { var u = e[0]; if (!u) return; fresh(u, e[3]); u.x = -99; u.y = -99; B.units.push(u); var q = spot(u, home.x + e[1], home.y + e[2]); u.x = q[0]; u.y = q[1]; });
      G.setup(G.map, B.units);
      B.round = 1; B.order = B.units.slice(); B.active = null;
      B.units.forEach(function (u) { RU.startTurn(u); });
      if (B.readySnap) B.readySnap();
      if (B.focus) B.focus(focus || list[0][0]);
    }
    function* fire(gen) { var v; for (var k = 0; k < 20000; k++) { var r = gen.next(v); v = undefined; if (r.done) return r.value; var y = r.value; if (y && y.prompt) { v = y.prompt.opts[0].value; continue; } if (y && y.turn) { v = { do: 'end' }; continue; } v = yield y; } }
    function* turn(u, d20, sv, top) { var n = (B.log || []).length; B.active = u; RU.startTurn(u); setPin(d20, sv, top); yield* fire(D.ai.turn(B, u)); setPin(null, null); B.active = null; yield W(40); return logFrom(n); }
    function* act(u, gen, d20, sv, top) { var n = (B.log || []).length; B.active = u; setPin(d20, sv, top); yield* fire(gen); setPin(null, null); B.active = null; yield W(40); return logFrom(n); }
    function txt(e) { return (typeof e === 'string' ? e : (e && e.text) || '').replace(/\{\/?[a-z]*\}/g, ''); }
    function logFrom(n) { return (B.log || []).slice(n).map(txt).join(' | '); }

    var BEATS = [
      { id: 'bubble', name: 'The VNA Bubble', what: 'Beholda raises the bubble: +' + MP.bubbleAC(L) + ' AC to her and Denny till her next turn. Then a goblin looses at them, its d20 pinned at 11 -- 15, a hit on AC 14, turned by the bubble.', run: function* () {
        stage([[dn, 0, 0], [bh, -1, 1], [gob[0], 6, 0]], bh);
        RU.startTurn(bh); yield* act(bh, MP.bubble(B, bh));
        var lg = yield* turn(gob[0], 11, null), ac = 14 + MP.bubbleAC(L), turned = new RegExp('vs AC ' + ac + '\\s+MISS').test(lg);
        return [turned, 'AC ' + RU.ac(dn) + ' in the bubble; the goblin: ' + ((lg.match(/d20[^|]*(MISS|HIT)/) || ['no attack'])[0])];
      } },
      { id: 'gaze', name: 'Baleful Gaze', what: 'Beholda\'s eye on the hobgoblin (given 60 HP to live through it): its save pinned at 2, the dice at their top -- ' + L + 'd8 psychic and DOMINATED. On its turn it goes at the goblin beside it.', run: function* () {
        stage([[bh, 0, 0], [dn, -1, -1], [hob, 4, 0, 60], [gob[0], 5, 0, 30]], hob);
        RU.startTurn(bh); yield* act(bh, MP.gaze(B, bh, hob), null, 2, true);
        var dom = !!hob.conds.dominated, g0 = gob[0].hp;
        var lg = yield* turn(hob, 15, null), turned = /turns on/.test(lg) && gob[0].hp < g0;
        return [dom && turned, 'dominated ' + dom + '; it turned on the goblin ' + turned + ' (' + g0 + ' -> ' + gob[0].hp + ' HP)'];
      } },
      { id: 'screen', name: 'The Big Screen', what: 'The projection: a 30-ft cone at the middle goblin of three (60 HP each), their saves pinned at 2 and the dice at their top -- ' + MP.screenDice(L) + ' psychic each, and every one DOMINATED.', run: function* () {
        stage([[bh, 0, 0], [dn, -1, 1], [gob[0], 3, 0, 60], [gob[1], 4, 1, 60], [gob[2], 4, -1, 60]], gob[0]);
        var caught = MP.screenCatch(B, bh, gob[0]).foes;
        RU.startTurn(bh); yield* act(bh, MP.screen(B, bh, gob[0]), null, 2, true);
        var doms = caught.filter(function (w) { return w.conds.dominated; }).length;
        return [caught.length >= 2 && doms === caught.length, caught.length + ' in the cone, ' + doms + ' dominated, ' + caught.map(function (w) { return w.maxhp - w.hp; }).join('/') + ' psychic'];
      } },
      { id: 'taunt', name: 'Taunt', what: 'Denny swings at the hobgoblin and taunts: the goblins by Beholda fail (saves pinned at 2) -- on its turn the goblin beside her goes at Denny instead.', run: function* () {
        stage([[dn, 0, 0], [hob, 1, 0, 60], [bh, -2, 2], [gob[0], -2, 3, 30], [gob[1], -3, 2, 30]], dn);
        RU.startTurn(dn); yield* act(dn, MP.taunt(B, dn, hob), 15, 2);
        var tn = [gob[0], gob[1]].filter(function (w) { return w.conds.taunted; }).length;
        var lg = yield* turn(gob[0], 15, null), atDenny = /Goblin > Denny/.test(lg) && !/Goblin > Beholda/.test(lg);
        return [tn === 2 && atDenny, tn + ' goblins taunted; the goblin beside Beholda went at ' + (atDenny ? 'Denny' : 'someone else') + ' (' + ((lg.match(/Goblin > [A-Za-z]+/) || ['no attack'])[0]) + ')'];
      } },
      { id: 'denim', name: 'Denim Damage', what: 'Denny on the ogre, every d20 at 15 and the dice at their top: ' + (L >= 5 ? 'two swings' : 'a swing') + ', the first that lands with +' + MP.denimDice(L) + ' on it.', run: function* () {
        stage([[ogre, 2, 0], [dn, 0, 0], [bh, -2, 1]], ogre);
        if (G.dist(dn, ogre) > 5) { var near = null; for (var y = ogre.y - 1; y <= ogre.y + (ogre.size || 1) && !near; y++) for (var x = ogre.x - 1; x <= ogre.x + (ogre.size || 1) && !near; x++) if (free(dn, x, y) && G.dist(dn, ogre, x, y) <= 5) near = [x, y]; if (near) { dn.x = near[0]; dn.y = near[1]; G.setup(G.map, B.units); } } // (the ogre is Large: Denny beside it)
        var o0 = ogre.hp; RU.startTurn(dn); var lg = yield* act(dn, MP.denim(B, dn, ogre), 15, null, true);
        var want = (L >= 5 ? 2 : 1) * (8 + dn.weapon.mod) + +MP.denimDice(L).split('d')[0] * 8, got = o0 - ogre.hp;
        return [got === Math.min(o0, want), 'the ogre ' + o0 + ' -> ' + ogre.hp + ' (' + got + '; ' + want + ' wanted)'];
      } },
      { id: 'cannonball', name: 'Cannonball', what: 'Denny leaps 20 ft and comes down beside two goblins (60 HP each): their DEX saves pinned at 2, the dice at their top -- ' + MP.cannonDice(L) + ' and PRONE, then a swing.', run: function* () {
        stage([[dn, 0, 0], [bh, -1, 1], [gob[0], 4, 0, 60], [gob[1], 5, 0, 60]], dn);
        var x0 = dn.x; RU.startTurn(dn); yield* act(dn, MP.cannonball(B, dn, gob[1]), 15, 2, true);
        var flat = [gob[0], gob[1]].filter(function (w) { return w.conds.prone; }).length;
        return [flat === 2 && dn.x !== x0, 'Denny ' + Math.abs(dn.x - x0) * 5 + ' ft through the air; ' + flat + ' prone; ' + [gob[0], gob[1]].map(function (w) { return w.maxhp - w.hp; }).join('/') + ' damage'];
      } }
    ];

    var only = get('only'), list = only ? BEATS.filter(function (b) { return only.split(',').indexOf(b.id) >= 0; }) : BEATS;
    list = list.slice(Math.max(0, (+(get('beat') || 1)) - 1));
    try {
      for (var i = 0; i < list.length; i++) {
        var b = list[i];
        B.clearCards();
        B.card(['{y}DENNY AND BEHOLDA, SHOWN  ' + (i + 1) + ' / ' + list.length + ':  ' + b.name.toUpperCase() + '{/}'].concat(D.wrap(b.what, 440).map(function (l) { return '{g}' + l + '{/}'; })), W(480));
        yield W(140);
        var res, n0 = (B.log || []).length;
        try { res = yield* b.run(); } catch (e) { res = [false, 'threw: ' + String(e && e.message || e)]; if (window.console) console.error('mpshow ' + b.id, e); }
        setPin(null, null);
        report.push({ id: b.id, name: b.name, ok: !!res[0], why: res[1], log: logFrom(n0) });
        B.card([(res[0] ? '{n}SHOWN{/}  ' : '{r}NOT AS IT SHOULD BE{/}  ') + b.name, '{g}' + res[1] + '{/}'], W(420));
        yield W(170);
      }
    } finally { D.d = d0; RU.save = save0; }
    B.clearCards();
    var okN = report.filter(function (r) { return r.ok; }).length;
    B.card(['{y}DENNY AND BEHOLDA, SHOWN: ' + okN + ' OF ' + report.length + '{/}'].concat(report.map(function (r) { return (r.ok ? '{n}ok{/}  ' : '{r}NO{/}  ') + r.name; })), 1e9);
    if (window.console) console.log('DEEP16 mpshow: ' + okN + ' of ' + report.length, report);
  }
})();
