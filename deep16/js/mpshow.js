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
    var B = D.npcFight('?npc=goblin,goblin,goblin,hobgoblin,ogre&vs=denny:' + L + ',beholda:' + L + ',rascal:' + L + ',goose:' + L + '&lvl=' + L, {});
    var enter0 = B.enter;
    B.enter = function () { enter0.apply(this, arguments); this.req = null; this.co = show(this, get, FAST, L); };
    return B;
  };

  function* show(B, get, FAST, L) {
    var W = function (n) { return FAST ? 1 : n; }, MP = D.mpmon;
    var pool = B.units.slice(), kind = function (k) { return pool.filter(function (u) { return u.kind === k; }); };
    var dn = pool.filter(function (u) { return u.mpmon === 'denny'; })[0], bh = pool.filter(function (u) { return u.mpmon === 'beholda'; })[0], rs = pool.filter(function (u) { return u.mpmon === 'rascal'; })[0], gs = pool.filter(function (u) { return u.mpmon === 'goose'; })[0];
    var gob = kind('goblin'), hob = kind('hobgoblin')[0], ogre = kind('ogre')[0];
    var orig = pool.map(function (u) { return { u: u, maxhp: u.maxhp }; });
    var report = B.mpReport = [], home = { x: dn.x, y: dn.y };
    // the stage's middle: the open square nearest the floor's middle with ground round it (10-06 night: the party's own start sits by a wall, and a knock or a
    // shove out of the ring met the stone)
    (function () {
      var cx = Math.floor(G.map.w / 2), cy = Math.floor(G.map.h / 2), best = null; G.setup(G.map, []); // (the ground alone: the bodies at their starts are no wall)
      function open(x, y) { for (var dy = -3; dy <= 3; dy++) for (var dx = -6; dx <= 10; dx++) if (!G.canStand(dn, x + dx, y + dy)) return false; return true; }
      for (var r = 0; r < 12 && !best; r++) for (var y = cy - r; y <= cy + r && !best; y++) for (var x = cx - r; x <= cx + r && !best; x++) if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) === r && open(x, y)) best = { x: x, y: y };
      if (best) home = best;
      G.setup(G.map, B.units);
    })();

    // ---- the dice: pinned for a beat, and only while this battle is the one up
    var d0 = D.d, save0 = RU.save, inSave = 0, pin = { d20: null, save: null, top: false };
    RU.save = function () { inSave++; try { return save0.apply(this, arguments); } finally { inSave--; } };
    D.d = function (n) { if (D.battle === B) { if (n === 20) { if (inSave && pin.save != null) return pin.save; if (!inSave && pin.d20 != null) return typeof pin.d20 === 'function' ? pin.d20() : pin.d20; } else if (pin.top) return n; } return d0.apply(this, arguments); };
    function setPin(d20, sv, top) { pin.d20 = d20; pin.save = sv; pin.top = !!top; }

    // ---- the stage
    function fresh(u, hp) {
      var o = orig.filter(function (x) { return x.u === u; })[0];
      u.maxhp = hp || (o ? o.maxhp : u.maxhp); u.hp = u.maxhp; u.temp = 0; u.conds = {}; u.dead = false; u.ko = false;
      ['tween', 'ready', 'conc'].forEach(function (k) { delete u[k]; });
      u.reaction = 1; u.anim = 'idle'; u.animT = B.t; u.flash = 0;
      if (u.mpmon) { MP.refill(u); delete u.holding; }
    }
    function free(u, x, y) { return G.canStand(u, x, y) && !B.units.some(function (w) { return w !== u && !w.dead && w.x === x && w.y === y; }); }
    function spot(u, x, y) { for (var r = 0; r < 8; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; if (free(u, x + dx, y + dy)) return [x + dx, y + dy]; } return [x, y]; }
    function stage(list, focus) { // [unit, dx, dy, hp?] from Denny's square at the start
      B.units = []; pool.forEach(function (u) { u.x = -99; u.y = -99; }); G.setup(G.map, []); // (the floor cleared first: the last beat's bodies still stood in the grid's own list, and a square they held turned the new one aside -- 10-06 night)
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
      { id: 'gaze', name: 'Baleful Gaze', what: 'Beholda\'s eye on the hobgoblin (given 60 HP to live through it): its save pinned at 2, the dice at their top -- ' + MP.gazeDice(L) + ' psychic and DOMINATED. On its turn it goes at the goblin beside it.', run: function* () {
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
      { id: 'taunt', name: 'Taunt', what: 'A bonus action now, no swing of its own: Denny taunts the ' + MP.tauntN(L) + ' nearest within ' + MP.tauntR(L) + ' ft -- the hobgoblin and the goblins by Beholda fail (saves pinned at 2), his action still his. On its turn the goblin beside her goes at Denny instead.', run: function* () {
        stage([[dn, 0, 0], [hob, 1, 0, 60], [bh, -2, 2], [gob[0], -2, 3, 30], [gob[1], -3, 2, 30]], dn);
        RU.startTurn(dn); yield* act(dn, MP.taunt(B, dn), 15, 2);
        var tn = [gob[0], gob[1]].filter(function (w) { return w.conds.taunted; }).length, kept = dn.turn.action > 0 && dn.turn.bonus === 0;
        var lg = yield* turn(gob[0], 15, null), atDenny = /Goblin > Denny/.test(lg) && !/Goblin > Beholda/.test(lg);
        return [tn === 2 && kept && atDenny, tn + ' goblins taunted, the action ' + (kept ? 'kept' : 'spent') + '; the goblin beside Beholda went at ' + (atDenny ? 'Denny' : 'someone else') + ' (' + ((lg.match(/Goblin > [A-Za-z]+/) || ['no attack'])[0]) + ')'];
      } },
      { id: 'denim', name: 'Denim Damage', what: 'Denny on the ogre, every d20 at 15 and the dice at their top: ' + (L >= 5 ? 'two swings' : 'a swing') + ', the first that lands with +' + MP.denimDice(L) + ' on it' + (MP.denimPush(L) ? ', and the denim knocks it ' + MP.denimPush(L) + ' ft back' : '') + '.', run: function* () {
        stage([[ogre, 2, 0], [dn, 0, 0], [bh, -2, 1]], ogre);
        if (G.dist(dn, ogre) > 5) { var near = null, cand = [[ogre.x - 1, ogre.y], [ogre.x - 1, ogre.y + 1]]; for (var y = ogre.y - 1; y <= ogre.y + (ogre.size || 1); y++) for (var x = ogre.x - 1; x <= ogre.x + (ogre.size || 1); x++) cand.push([x, y]); cand.some(function (q) { if (free(dn, q[0], q[1]) && G.dist(dn, ogre, q[0], q[1]) <= 5) { near = q; return true; } return false; }); if (near) { dn.x = near[0]; dn.y = near[1]; G.setup(G.map, B.units); } } // (the ogre is Large: Denny beside it)
        var o0 = ogre.hp, d0 = G.dist(dn, ogre); RU.startTurn(dn); var lg = yield* act(dn, MP.denim(B, dn, ogre), 15, null, true);
        var want = (L >= 5 ? 2 : 1) * (8 + dn.weapon.mod) + +MP.denimDice(L).split('d')[0] * 6, got = o0 - ogre.hp, d1 = G.dist(dn, ogre), knock = MP.denimPush(L);
        return [got === Math.min(o0, want) && (ogre.dead || d1 >= d0 + Math.min(knock, 5)), 'the ogre ' + o0 + ' -> ' + ogre.hp + ' (' + got + '; ' + want + ' wanted), knocked from ' + d0 + ' ft to ' + d1 + ' ft (' + knock + ' wanted)'];
      } },
      { id: 'cannonball', name: 'Cannonball', what: 'Denny leaps 20 ft and comes down beside two goblins (60 HP each): their DEX saves pinned at 2, the dice at their top -- ' + MP.cannonDice(L) + ' and PRONE, then a swing.', run: function* () {
        stage([[dn, 0, 0], [bh, -1, 1], [gob[0], 4, 0, 60], [gob[1], 5, 0, 60]], dn);
        var x0 = dn.x; RU.startTurn(dn); yield* act(dn, MP.cannonball(B, dn, gob[1]), 15, 2, true);
        var flat = [gob[0], gob[1]].filter(function (w) { return w.conds.prone; }).length;
        return [flat === 2 && dn.x !== x0, 'Denny ' + Math.abs(dn.x - x0) * 5 + ' ft through the air; ' + flat + ' prone; ' + [gob[0], gob[1]].map(function (w) { return w.maxhp - w.hp; }).join('/') + ' damage'];
      } },
      // Rascal's three (10-06): the hat-removing bow, the dance with the claw clapping, the cone that sends them running
      { id: 'sharing', name: 'Social Sharing', what: 'Rascal sweeps off his hat and bows, a bonus action: Denny and Beholda each get a ' + MP.shareDie(L) + '. Then Denny swings at the hobgoblin (AC 18) with his d20 pinned a point short -- and the die, rolled at its top, turns it into a hit.', run: function* () {
        stage([[rs, 0, 0], [dn, 2, 0], [bh, -1, 1], [hob, 3, 0, 60]], rs);
        RU.startTurn(rs); yield* act(rs, MP.sharing(B, rs));
        var got = [dn, bh].filter(function (w) { return w.conds.inspired; }).length, h0 = hob.hp, d20 = RU.ac(hob) - 1 - dn.weapon.atk;
        RU.startTurn(dn); var lg = yield* act(dn, B.attack(dn, hob, dn.weapon), d20, null, true);
        var hit = hob.hp < h0, spent = !dn.conds.inspired;
        return [got === 2 && hit && spent, got + ' of 2 hold a die; Denny\'s ' + d20 + ' + ' + dn.weapon.atk + ' = ' + (d20 + dn.weapon.atk) + ' on AC ' + RU.ac(hob) + ' ' + (hit ? 'turned into a hit by the die' : 'missed') + ' (' + h0 + ' -> ' + hob.hp + ' HP), the die ' + (spent ? 'spent' : 'kept')];
      } },
      { id: 'flame', name: 'Social Flame', what: 'Rascal dances, the claw clapping over his head, and a ball of fire bursts round the middle goblin of three (60 HP each), ' + MP.flameR(L) + ' ft out from it: their DEX saves pinned at 2, the dice at their top -- ' + MP.flameDice(L) + ' fire each. Denny and Beholda stand well back.', run: function* () {
        stage([[rs, 0, 0], [dn, -3, -3], [bh, -3, 3], [gob[0], 5, 0, 60], [gob[1], 6, 1, 60], [gob[2], 6, -1, 60]], gob[1]);
        var caught = MP.flameCatch(B, rs, gob[1]).all, want = +MP.flameDice(L).split('d')[0] * 6;
        RU.startTurn(rs); yield* act(rs, MP.flame(B, rs, gob[1]), null, 2, true);
        var burned = caught.filter(function (w) { return w.maxhp - w.hp === want; }).length, friends = caught.filter(function (w) { return w.side === rs.side; }).length;
        return [caught.length === 3 && burned === 3 && !friends, caught.length + ' in the fire (' + friends + ' friends), ' + burned + ' took ' + want + ' (' + caught.map(function (w) { return w.maxhp - w.hp; }).join('/') + ')'];
      } },
      { id: 'distancing', name: 'Social Distancing', what: 'Two goblins (60 HP) crowd Rascal, right beside him; he clears the ring round him (' + MP.distR(L) + ' ft): their WIS saves pinned at 2, the dice at their top -- ' + MP.distDice(L) + ' psychic each, SHOVED out of the ring and FRIGHTENED. On its turn the nearer one keeps away instead of swinging.', run: function* () {
        stage([[rs, 0, 0], [dn, -3, 3], [bh, -3, -3], [gob[0], 1, 0, 60], [gob[1], -1, 0, 60]], rs);
        // the two sides of him with the ground open behind them, out past the ring (the Hex floor has its walls: a shove into stone stops at it)
        var far = MP.distR(L) / 5 + 1, sides = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].filter(function (d) {
          for (var k = 1; k <= far; k++) { var x = rs.x + d[0] * k, y = rs.y + d[1] * k; if (!G.canStand(gob[0], x, y, { ghost: true }) || B.units.some(function (w) { return w !== gob[0] && w !== gob[1] && w.x === x && w.y === y; })) return false; } return true;
        });
        if (sides.length >= 2) { gob[0].x = rs.x + sides[0][0]; gob[0].y = rs.y + sides[0][1]; gob[1].x = rs.x + sides[1][0]; gob[1].y = rs.y + sides[1][1]; G.setup(G.map, B.units); }
        var caught = MP.distCatch(B, rs).foes;
        RU.startTurn(rs); yield* act(rs, MP.distancing(B, rs), null, 2, true);

        var scared = [gob[0], gob[1]].filter(function (w) { return w.conds.frightened; }).length, want = +MP.distDice(L).split('d')[0] * 8, out = [gob[0], gob[1]].filter(function (w) { return G.dist(rs, w) > MP.distR(L); }).length, d0 = G.dist(rs, gob[0]), hp0 = rs.hp;
        var lg = yield* turn(gob[0], 15, null), d1 = G.dist(rs, gob[0]);
        return [caught.length === 2 && scared === 2 && out === 2 && d1 >= d0 && rs.hp === hp0, scared + ' of ' + caught.length + ' frightened (' + [gob[0], gob[1]].map(function (w) { return w.maxhp - w.hp; }).join('/') + ' psychic, ' + want + ' wanted), ' + out + ' shoved out of the ring; the near goblin from ' + d0 + ' ft to ' + d1 + ' ft off on its turn, Rascal ' + (rs.hp === hp0 ? 'untouched' : 'hit')];
      } },
      // Goose's (10-07): the heals in the heal's green -- the jump with the glow between his hands
      { id: 'heart', name: 'Heart to Heart', what: 'Denny is down to 3 HP across the floor. Goose, a bonus action: HEART TO HEART -- ' + MP.heartDice(L) + ' + WIS + ' + L + ' (his big heart), the dice at their top -- and his action is still his.', run: function* () {
        stage([[gs, 0, 0], [dn, 6, 0], [bh, -2, 2]], dn);
        dn.hp = 3; var want = Math.min(dn.maxhp - 3, +MP.heartDice(L).split('d')[0] * 6 + Math.floor((gs.abil.wis - 10) / 2) + L);
        RU.startTurn(gs); yield* act(gs, MP.heart(B, gs, dn), null, null, true);
        var got = dn.hp - 3, kept = gs.turn.action > 0 && gs.turn.bonus === 0;
        return [got === want && kept, 'Denny 3 -> ' + dn.hp + ' (+' + got + '; ' + want + ' wanted), the action ' + (gs.turn.action ? 'kept' : 'spent') + ', the bonus ' + (gs.turn.bonus ? 'kept' : 'spent')];
      } },
      { id: 'group', name: 'Group Hug', what: 'Denny, Beholda and Rascal hurt to 2 HP round Goose, within ' + MP.groupR(L) + ' ft, a goblin among them: GROUP HUG -- ' + MP.groupDice(L) + ' + WIS + ' + L + ' each at their top, Goose too; the goblin gets nothing.', run: function* () {
        stage([[gs, 0, 0], [dn, 2, 0], [bh, -2, 1], [rs, 0, 2], [gob[0], 3, 1, 30]], gs);
        [dn, bh, rs].forEach(function (w) { w.hp = 2; }); gs.hp = gs.maxhp - 5; gob[0].hp = 10;
        var each = +MP.groupDice(L).split('d')[0] * 4 + Math.floor((gs.abil.wis - 10) / 2) + L;
        RU.startTurn(gs); yield* act(gs, MP.group(B, gs), null, null, true);
        var ok3 = [dn, bh, rs].filter(function (w) { return w.hp === Math.min(w.maxhp, 2 + each); }).length;
        return [ok3 === 3 && gs.hp === gs.maxhp && gob[0].hp === 10, ok3 + ' of 3 friends +' + each + ' (' + [dn, bh, rs].map(function (w) { return w.hp; }).join('/') + ' HP), Goose whole ' + (gs.hp === gs.maxhp) + ', the goblin ' + gob[0].hp + ' HP'];
      } },
      { id: 'fountain', name: 'Fountain', what: 'Denny poisoned, Rascal blinded, Beholda paralysed, each 20 HP down, all within ' + MP.fountR(L) + ' ft of Goose: FOUNTAIN ends each one\'s ailment and heals ' + MP.fountDice(L) + ' + ' + L + ', the dice at their top.', run: function* () {
        stage([[gs, 0, 0], [dn, 3, 0], [rs, -3, 1], [bh, 0, 3]], gs);
        dn.conds.poisoned = {}; rs.conds.blinded = {}; bh.conds.paralyzed = {}; [dn, rs, bh].forEach(function (w) { w.hp = w.maxhp - 20; });
        var each = +MP.fountDice(L).split('d')[0] * 8 + L;
        RU.startTurn(gs); yield* act(gs, MP.fountain(B, gs), null, null, true);
        var clean = !dn.conds.poisoned && !rs.conds.blinded && !bh.conds.paralyzed, healed = [dn, rs, bh].filter(function (w) { return w.hp === Math.min(w.maxhp, w.maxhp - 20 + each); }).length;
        return [clean && healed === 3, 'ailments ended ' + clean + ' (poisoned ' + !!dn.conds.poisoned + ', blinded ' + !!rs.conds.blinded + ', paralysed ' + !!bh.conds.paralyzed + '), ' + healed + ' of 3 healed +' + each];
      } },
      // THE MASCOT's in-between levels and fourths (10-06 night): a beat each; those past the show's level wait for &lvl=7 or &lvl=9
      { id: 'flurry', at: 2, name: 'Monkey Flurry', what: 'Denny swings at the hobgoblin (60 HP) -- the Attack action -- then MONKEY FLURRY, his free bonus action: a punch more. Every d20 at 15, the dice at their top.', run: function* () {
        stage([[dn, 0, 0], [hob, 1, 0, 60], [bh, -3, 2]], dn);
        RU.startTurn(dn); var h0 = hob.hp; dn.turn.action = 0; dn.turn.attackAction = true;
        yield* act(dn, B.attack(dn, hob, dn.weapon), 15, null, true);
        yield* act(dn, MP.flurry(B, dn, hob), 15, null, true);
        var want = 2 * (8 + dn.weapon.mod), got = h0 - hob.hp;
        return [got === want && dn.turn.bonus === 0, 'the hobgoblin ' + h0 + ' -> ' + hob.hp + ' (' + got + '; ' + want + ' wanted: the swing and the flurry), the bonus action ' + (dn.turn.bonus ? 'kept' : 'spent')];
      } },
      { id: 'standfirm', at: 3, name: 'Stand Firm', what: 'A blow at Denny\'s feet: his DEX save against being knocked prone rolls two d20s and keeps the better (STAND FIRM), where Beholda beside him rolls one.', run: function* () {
        stage([[dn, 0, 0], [bh, -1, 0]], dn);
        var sd = RU.save(dn, 'dex', 30, false, 'prone'), sb = RU.save(bh, 'dex', 30, false, 'prone');
        B.card(['{y}Denny{/}: DEX vs prone  ' + RU.saveText(sd) + '   {y}Beholda{/}: ' + RU.saveText(sb)], W(260)); yield W(60);
        return [sd.rolls.length === 2 && sb.rolls.length === 1, 'Denny rolled ' + sd.rolls.length + ' d20s (' + sd.rolls.join(', ') + '), Beholda ' + sb.rolls.length];
      } },
      { id: 'eye', at: 2, name: 'Eye On It', what: 'Beholda, a free bonus action: EYE ON IT at the hobgoblin 20 ft off -- the Help from 30 ft -- and the next swing at it, Denny\'s, has advantage.', run: function* () {
        stage([[bh, 0, 0], [dn, 3, 1], [hob, 4, 0, 60]], hob);
        RU.startTurn(bh); yield* act(bh, MP.eyeOnIt(B, bh, hob));
        var marked = !!hob.conds.helped, kept = bh.turn.action > 0;
        RU.startTurn(dn); var lg = yield* act(dn, B.attack(dn, hob, dn.weapon), 15, null, true);
        return [marked && kept && !hob.conds.helped, 'marked ' + marked + ', her action ' + (kept ? 'kept' : 'spent') + '; Denny\'s swing ' + ((lg.match(/d20[^|]*/) || ['none'])[0]) + ', the mark ' + (hob.conds.helped ? 'kept' : 'spent on it')];
      } },
      { id: 'lucky', at: 3, name: 'Lucky Dice', what: 'Denny\'s d20 comes up a 1 at the hobgoblin -- Beholda\'s LUCKY DICE, a passive: he rolls it again (a 15 the second time).', run: function* () {
        stage([[dn, 0, 0], [hob, 1, 0, 60], [bh, -1, 1]], dn);
        RU.startTurn(dn); var h0 = hob.hp, l0 = bh.feats.lucky, k = 0;
        var lg = yield* act(dn, B.attack(dn, hob, dn.weapon), function () { return k++ ? 15 : 1; }, null, true);
        return [bh.feats.lucky === l0 - 1 && hob.hp < h0 && /LUCKY DICE/.test(lg), 'her dice ' + l0 + ' -> ' + bh.feats.lucky + '; the hobgoblin ' + h0 + ' -> ' + hob.hp];
      } },
      { id: 'spicy', at: 3, name: 'Spicy', what: 'Rascal\'s Fire Bolt at the hobgoblin, his CHA on its damage (SPICY, a passive). The d20 at 15, the dice at their top.', run: function* () {
        stage([[rs, 0, 0], [dn, -3, 3], [hob, 4, 0, 60]], hob);
        var h0 = hob.hp; RU.startTurn(rs);
        yield* act(rs, D.magic.cast(B, rs, 'firebolt', 0, hob), 15, null, true);
        var want = (L >= 5 ? 20 : 10) + Math.max(0, Math.floor((rs.abil.cha - 10) / 2)), got = h0 - hob.hp;
        return [got === want, 'the hobgoblin ' + h0 + ' -> ' + hob.hp + ' (' + got + '; ' + want + ' wanted)'];
      } },
      { id: 'scuttle', at: 2, name: 'Scuttle', what: 'A goblin beside Rascal: SCUTTLE, a free bonus action -- he disengages (the rogue\'s Cunning Action), his action still his.', run: function* () {
        stage([[rs, 0, 0], [gob[0], 1, 0, 30], [dn, -4, 3]], rs);
        RU.startTurn(rs); yield* act(rs, B.exec(rs, { do: 'cdisengage' }));
        var T = rs.turn;
        return [!!T.disengaged && T.bonus === 0 && T.action > 0, 'disengaged ' + !!T.disengaged + ', the bonus action ' + (T.bonus ? 'kept' : 'spent') + ', the action ' + (T.action ? 'kept' : 'spent')];
      } },
      { id: 'honk', at: 2, name: 'Honk', what: 'A goblin by Rascal: Goose HONKS at it, a free bonus action -- its next swing has disadvantage. It swings at Rascal with two d20s, a 15 and a 3, and keeps the 3.', run: function* () {
        stage([[gs, 0, 0], [rs, 3, 0], [gob[0], 4, 0, 30], [dn, -3, 3]], gs);
        RU.startTurn(gs); yield* act(gs, MP.honk(B, gs, gob[0]));
        var marked = !!gob[0].conds.mocked, kept = gs.turn.action > 0 && gs.turn.bonus === 0, h0 = rs.hp, k = 0;
        var lg = yield* act(gob[0], B.attack(gob[0], rs, MP.meleeOf(gob[0]).atk), function () { return k++ % 2 ? 3 : 15; }, null);
        return [marked && kept && rs.hp === h0 && !gob[0].conds.mocked, 'honked ' + marked + ', his action ' + (kept ? 'kept' : 'spent') + '; the goblin\'s swing ' + ((lg.match(/d20[^|]*/) || ['none'])[0]) + ', Rascal ' + h0 + ' -> ' + rs.hp + ', the mark ' + (gob[0].conds.mocked ? 'kept' : 'spent')];
      } },
      { id: 'nottoday', at: 6, name: 'Not Today', what: 'Beholda at 4 HP takes a goblin\'s blow that would drop her (its d20 at 19, the dice at their top) -- Goose 15 ft off: NOT TODAY, his reaction, and she stays up at 1.', run: function* () {
        stage([[bh, 0, 0], [gs, -3, 0], [gob[0], 1, 0, 30]], bh);
        bh.hp = 4; var n0 = gs.feats.notToday;
        var lg = yield* act(gob[0], B.attack(gob[0], bh, MP.meleeOf(gob[0]).atk), 19, null, true);
        return [bh.hp === 1 && !bh.dead && gs.reaction === 0 && gs.feats.notToday === n0 - 1 && /NOT TODAY/.test(lg), 'Beholda 4 -> ' + bh.hp + ' HP, Goose\'s reaction ' + (gs.reaction ? 'kept' : 'spent') + ', ' + gs.feats.notToday + ' left this fight'];
      } },
      { id: 'bodyguard', at: 6, name: 'Bodyguard', what: 'A goblin swings at Beholda with Denny beside her: BODYGUARD, his reaction -- he steps in, the roll at disadvantage (the Protection style, no shield).', run: function* () {
        stage([[bh, 0, 0], [dn, 1, 0], [gob[0], -1, 0, 30]], bh);
        var lg = yield* act(gob[0], B.attack(gob[0], bh, MP.meleeOf(gob[0]).atk), 15, null);
        return [dn.reaction === 0, 'Denny\'s reaction ' + (dn.reaction ? 'kept' : 'spent') + '; the goblin: ' + ((lg.match(/d20[^|]*/) || ['no swing'])[0])];
      } },
      { id: 'eyecontact', at: 6, name: 'Eye Contact', what: 'A goblin\'s blow lands on Rascal by a point (its d20 pinned at 11) -- Beholda 30 ft off meets its eye: EYE CONTACT, her reaction, 1d6 off the roll (at its top): a miss.', run: function* () {
        stage([[rs, 0, 0], [bh, -6, 0], [dn, -6, 3], [gob[0], 1, 0, 30]], rs);
        var h0 = rs.hp, e0 = bh.feats.eyeContact;
        var lg = yield* act(gob[0], B.attack(gob[0], rs, MP.meleeOf(gob[0]).atk), 11, null, true);
        return [bh.reaction === 0 && bh.feats.eyeContact === e0 - 1 && rs.hp === h0, 'her reaction ' + (bh.reaction ? 'kept' : 'spent') + ', ' + bh.feats.eyeContact + ' left; Rascal ' + h0 + ' -> ' + rs.hp + ' HP'];
      } },
      { id: 'hottake', at: 6, name: 'Hot Take', what: 'A goblin (60 HP) hits Rascal -- HOT TAKE, his reaction: 2d10 fire back, its DEX save pinned at 2, the dice at their top.', run: function* () {
        stage([[rs, 0, 0], [dn, -4, 3], [bh, -4, -3], [gob[0], 1, 0, 60]], rs);
        var g0 = gob[0].hp, t0 = rs.feats.hotTake;
        var lg = yield* act(gob[0], B.attack(gob[0], rs, MP.meleeOf(gob[0]).atk), 19, 2, true);
        return [g0 - gob[0].hp === 20 && rs.feats.hotTake === t0 - 1, 'the goblin ' + g0 + ' -> ' + gob[0].hp + ' (20 wanted), ' + rs.feats.hotTake + ' left'];
      } },
      { id: 'hug', at: 7, name: 'Lobstah Hug', what: 'Denny grabs the hobgoblin (60 HP), its STR save pinned at 2: HELD, and taunted to him -- at the start of his next turn he squeezes, ' + MP.hugDice(L) + ' + STR at their top.', run: function* () {
        stage([[dn, 0, 0], [hob, 1, 0, 60], [bh, -3, 3]], dn);
        RU.startTurn(dn); yield* act(dn, MP.hug(B, dn, hob), null, 2, true);
        var held = !!(hob.conds.restrained && hob.conds.restrained.hug) && !!hob.conds.taunted, h0 = hob.hp;
        setPin(null, null, true); D.magic.onStart(B, dn); setPin(null, null); yield W(60);
        var want = +MP.hugDice(L).split('d')[0] * 8 + Math.max(0, Math.floor((dn.abil.str - 10) / 2)), got = h0 - hob.hp;
        return [held && got === want, 'held ' + held + '; the squeeze ' + got + ' (' + want + ' wanted)'];
      } },
      { id: 'spotlight', at: 7, name: 'Spotlight', what: 'Beholda puts Denny in the SPOTLIGHT: HASTED till the end of his next turn -- +2 AC, his speed doubled, an attack more -- and no lethargy after.', run: function* () {
        stage([[bh, 0, 0], [dn, 2, 0], [rs, -2, 1], [gob[0], 6, 0]], bh);
        var ac0 = RU.ac(dn); RU.startTurn(bh); yield* act(bh, MP.spotlight(B, bh, [dn]));
        var on = !!(dn.conds.hasted && dn.conds.hasted.spotlight), ac1 = RU.ac(dn);
        return [on && ac1 === ac0 + 2, 'Denny hasted ' + on + ', AC ' + ac0 + ' -> ' + ac1];
      } },
      { id: 'viral', at: 7, name: 'Going Viral', what: 'Rascal\'s fire spreads: the near goblin, then the next within 30 ft of it, and the next -- their DEX saves pinned at 2, ' + MP.viralDice(L) + ' at its top each.', run: function* () {
        stage([[rs, 0, 0], [dn, -3, 3], [bh, -3, -3], [gob[0], 4, 0, 60], [gob[1], 7, 0, 60], [gob[2], 10, 0, 60]], gob[1]);
        var ch = MP.viralChain(B, rs, gob[0]); RU.startTurn(rs); yield* act(rs, MP.viral(B, rs, gob[0]), null, 2, true);
        var want = +MP.viralDice(L).split('d')[0] * 8, burned = [gob[0], gob[1], gob[2]].filter(function (w) { return w.maxhp - w.hp === want; }).length;
        return [ch.length === 3 && burned === 3, ch.length + ' in the chain, ' + burned + ' took ' + want + ' (' + [gob[0], gob[1], gob[2]].map(function (w) { return w.maxhp - w.hp; }).join('/') + ')'];
      } },
      { id: 'lifeline', at: 7, name: 'Lifeline', what: 'Goose ties Rascal to Denny, the fight long: a goblin hits Rascal (its d20 at 19, the dice at their top) -- Rascal takes half the blow, Denny the other half down the green thread.', run: function* () {
        stage([[gs, 0, 0], [rs, 3, 0], [dn, 0, 2], [gob[0], 4, 0, 30]], gs);
        RU.startTurn(gs); yield* act(gs, MP.lifeline(B, gs, rs, dn));
        var tied = !!(rs.conds.lifeline && rs.conds.lifeline.to === dn.id), r0 = rs.hp, d0 = dn.hp;
        var lg = yield* act(gob[0], B.attack(gob[0], rs, MP.meleeOf(gob[0]).atk), 19, null, true);
        var n = (r0 - rs.hp) + (d0 - dn.hp), half = Math.floor(n / 2);
        return [tied && n > 0 && d0 - dn.hp === half && r0 - rs.hp === n - half, 'tied ' + tied + '; the blow ' + n + ': Rascal ' + r0 + ' -> ' + rs.hp + ', Denny ' + d0 + ' -> ' + dn.hp + ' (' + half + ' wanted down the line)'];
      } },
      { id: 'hivemind', at: 9, name: 'The Hivemind', what: 'A new round, the four at 9th: THE HIVEMIND cheers each -- Denny\'s WARD, Beholda\'s AIM, Rascal\'s HEAT, a token each for every Mascot\'s next special, and Goose\'s LOVE, temporary hit points at once. Then Rascal\'s Social Flame takes the heat (1d6 more fire) and the aim (each save 1d6 harder: pinned at 16, it would have made it), and the ward is on him till his next turn.', run: function* () {
        stage([[rs, 0, 0], [dn, -3, 3], [bh, -3, -3], [gs, -4, 0], [gob[0], 5, 0, 90], [gob[1], 6, 1, 90]], rs);
        B.round = 2; B.mpHive = 1; D.magic.onStart(B, rs); yield W(80);
        var all = [dn, bh, rs].every(function (w) { var h = w.conds.hive || {}; return h.ward && h.aim && h.heat; }) && [dn, bh, rs, gs].every(function (w) { return (w.temp || 0) > 0; });
        RU.startTurn(rs); yield* act(rs, MP.flame(B, rs, gob[0]), null, 16, true);
        var want = +MP.flameDice(L).split('d')[0] * 6 + 6, took = [gob[0], gob[1]].map(function (w) { return w.maxhp - w.hp; }), h = rs.conds.hive || {};
        return [all && took.every(function (n) { return n === want; }) && !h.aim && !h.heat && !!rs.conds.hiveWard, 'tokens to all three and the love to all four ' + all + '; the flame ' + took.join('/') + ' (' + want + ' wanted: the dice and the heat, every save failed by the aim), Rascal\'s aim and heat spent ' + (!h.aim && !h.heat) + ', warded ' + !!rs.conds.hiveWard];
      } }
    ];

    BEATS = BEATS.filter(function (b) { return !b.at || L >= b.at; });
    var only = get('only'), list = only ? BEATS.filter(function (b) { return only.split(',').indexOf(b.id) >= 0; }) : BEATS;
    list = list.slice(Math.max(0, (+(get('beat') || 1)) - 1));
    try {
      for (var i = 0; i < list.length; i++) {
        var b = list[i];
        B.clearCards();
        B.card(['{y}THE MASCOTS, SHOWN  ' + (i + 1) + ' / ' + list.length + ':  ' + b.name.toUpperCase() + '{/}'].concat(D.wrap(b.what, 440).map(function (l) { return '{g}' + l + '{/}'; })), W(480));
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
    B.card(['{y}THE MASCOTS, SHOWN: ' + okN + ' OF ' + report.length + '{/}'].concat(report.map(function (r) { return (r.ok ? '{n}ok{/}  ' : '{r}NO{/}  ') + r.name; })), 1e9);
    if (window.console) console.log('DEEP16 mpshow: ' + okN + ' of ' + report.length, report);
  }
})();
