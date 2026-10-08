/* DEEP16 — the Skylights, shown (10-05 night, Griz: "can you script a 'show me' like the art render windows do - where we test all the things we added/changed/reverted in the
   edifice fight today (current only). Like you'll have to walk a giant just right so that his climb speed leaves him 10 above the ground or a fountain wall to test the move under
   and melee and dropping on said melee guy - the easter egg firing").

     deep16/?skyshow              every beat, one after another, on the Edifice's own map with the fight's own cast
     &beat=N                      start at the Nth (1 is the first) · &only=lane,booth keeps to those · &fast cuts the pauses · &lvl=N the four's level (8)

   Each beat is staged where it happens (who stands where, as the card says) and then run by the engine itself -- the AI's own turns, the heroes' own commands, the
   falls, the egg -- so what it shows is what a fight does. Where a beat needs a roll to go one way the dice are pinned, and its card says so (pin: every d20 the fight
   rolls; a save's d20 apart). Each beat checks what it showed; the last card is the tally, and B.skyReport holds it (dev/bench16.js mode=skyshow runs it headless, a FAIL
   for a beat that did not show). A show, not a rule: no fight reads this file, and the pins are the show's battle's only.
   The beats, as the fight stands tonight: Hallvör's own lane (tonight) · under a climber, and the giant comes down on the one under (the cushion, the split dice, both
   flat) · the Shove · Steinarr's rock at the edge and the Dunking Booth · the whistle, her call (the clip, tonight) and the spiders · a spider down the face to a climber on a
   rope · a troll at 0 that knits, then Pyro's flask, "Torch him!", and a torch from the barrel behind the houses thrown at it (the barrel and the card's new words, tonight) · oil on a troll on its feet, its sheen, then fire, and on one lying at 0 (10-06) · the class AI to the barrel by itself (tonight) · only Shatter touches the glass · Pyro's handaxe
   and its return · READY ends the turn (tonight). */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules;
  var SS = D.skyshow = {};

  SS.make = function (q) {
    q = q || '';
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var L = +(get('lvl') || 8), FAST = /[?&]fast\b/.test(q);
    var B = new D.Battle({ ladder: true, fight: 'edifice', level: L, skyshow: true });
    var enter0 = B.enter;
    B.enter = function () { enter0.apply(this, arguments); this.req = null; this.co = show(this, get, FAST); };
    return B;
  };

  function* show(B, get, FAST) {
    var W = function (n) { return FAST ? 1 : n; };
    var F = B.fight, A = B.arriving || {}, pool = B.units.concat(A.foes || [], A.ours || [], A.riders || [], A.allies || [], B.held || []);
    B.arriving = null; B.held = [];
    var sky = B.skyUp();
    var by = function (id) { return pool.filter(function (u) { return u.id === id; })[0]; };
    var nm = function (re) { return pool.filter(function (u) { return re.test(u.name || ''); })[0]; };
    var C = { hv: by('giant1'), st: by('giant2'), troll: by('troll3'), troll1: by('troll1'), sp1: by('spider1'), sp2: by('spider2'),
      pyro: by('pyro') || nm(/^Pyro/), barley: nm(/^Barley/), aurdin: nm(/^Aurdin/), vivian: nm(/^Vivian/), lymen: nm(/^Lymen/) };
    var orig = pool.map(function (u) { return { u: u, rocks: u.rocks, roofGuard: u.roofGuard, noGlass: u.noGlass, guard: u.guard, ownFlask: u.ownFlask, web: u.web ? Object.assign({}, u.web) : null, slots: u.slots ? u.slots.slice() : null, feats: u.feats ? Object.assign({}, u.feats) : null }; });
    var report = B.skyReport = [];
    D.music(F.music || 'boss');

    // ---- the dice: pinned for a beat, and only while this battle is the one up (a show left mid-beat rigs nothing after it)
    var d0 = D.d, save0 = RU.save, inSave = 0, pin = { d20: null, save: null };
    RU.save = function () { inSave++; try { return save0.apply(this, arguments); } finally { inSave--; } };
    D.d = function (n) { if (D.battle === B) { if (n === 20) { if (inSave && pin.save != null) return pin.save; if (!inSave && pin.d20 != null) return pin.d20; } else if (pin.top) return n; } return d0.apply(this, arguments); };
    function setPin(d20, sv, top) { pin.d20 = d20; pin.save = sv; pin.top = !!top; } // (top: every other die at its top face -- a damage roll a beat needs over a threshold)

    // ---- the stage: who is on the field for a beat, made whole, where the beat puts them
    function fresh(u) {
      var o = orig.filter(function (x) { return x.u === u; })[0];
      u.hp = u.maxhp; u.temp = 0; u.conds = {}; u.dead = false; u.ko = false; u.burned = false;
      ['hang', 'regenDown', 'knit', 'tween','ready', 'conc', 'away', 'whistled', 'axeOut', 'torch', 'oilBurnt'].forEach(function (k) { delete u[k]; });
      if (o) { u.rocks = o.rocks; u.roofGuard = o.roofGuard; u.noGlass = o.noGlass; u.guard = o.guard; u.ownFlask = o.ownFlask; if (o.web) u.web = Object.assign({}, o.web); if (o.slots) u.slots = o.slots.slice(); if (o.feats) u.feats = Object.assign({}, o.feats); }
      u.reaction = 1; u.anim = 'idle'; u.animT = B.t; u.flash = 0;
      if (D.light && D.light.regrip) D.light.regrip(u);
      if (u.side === 'foe' && !u.free) u.mission = 'skylight';
    }
    function stage(list, round) {
      B.units = [sky];
      list.forEach(function (e) { var u = e[0]; if (!u) return; fresh(u); u.x = e[1]; u.y = e[2]; B.units.push(u); });
      sky.hp = sky.maxhp; sky.dead = false;
      G.setup(G.map, B.units);
      ['grounds', 'auras', 'wards', 'spirits', 'darks', 'webs', 'zones', 'beads', 'walls', 'shells'].forEach(function (k) { if (B[k]) B[k] = []; }); B.wallMap = null; B.overgrown = null;
      B.oils = []; B.ropes = []; B.lights = (B.lights || []).filter(function (l) { return l.kind === 'map'; }); B.lightMap = null;
      B.late = []; B.folkStay = null; B.map.doorsOpen = false; B.skyHit = null; B.flags8 = {};
      B.round = round || 1; B.order = B.units.filter(function (u) { return !u.object; }); B.active = null;
      B.units.forEach(function (u) { if (!u.object) RU.startTurn(u); });
      if (B.readySnap) B.readySnap();
    }
    // a square near (tx,ty) a unit can stand on, dmin..dmax feet from it (by G.dist), on the roof (45 ft) if `roof`
    function spotNear(u, tx, ty, dmin, dmax, roof) {
      var x0 = u.x, y0 = u.y, best = null, bd = 1e9, t = { x: tx, y: ty, size: 1 };
      for (var y = Math.max(0, ty - 9); y <= ty + 9; y++) for (var x = Math.max(0, tx - 12); x <= tx + 12; x++) {
        u.x = x; u.y = y;
        if (!G.canStand(u, x, y)) continue;
        if (roof && G.gzAt(u, x, y) < 4 * 45) continue;
        var d = G.dist(u, t); if (d < dmin || d > dmax) continue;
        if (d < bd) { bd = d; best = [x, y]; }
      }
      u.x = x0; u.y = y0; return best;
    }
    // ---- a generator run inside the show: a prompt answered with its first option, a readied thing aimed where its trigger points, a hero's turn asked from `o.cmds`
    function* fire(gen, o) {
      o = o || {}; var v;
      for (var k = 0; k < 20000; k++) {
        var r = gen.next(v); v = undefined;
        if (r.done) return r.value;
        var y = r.value;
        if (y && y.prompt) { v = y.prompt.opts[0].value; continue; }
        if (y && y.aim) { v = B.readyAuto(y.aim.who, y.aim.rd, y.aim.ctx); continue; }
        if (y && y.turn) { o.asked = (o.asked || 0) + 1; v = o.cmds && o.cmds.length ? o.cmds.shift() : { do: 'end' }; continue; }
        if (y && y.entry) continue;
        v = yield y;
      }
    }
    function txt(e) { return (typeof e === 'string' ? e : (e && e.text) || '').replace(/\{\/?[a-z]*\}/g, ''); }
    function logFrom(n) { return (B.log || []).slice(n).map(txt).join(' | '); }
    function ftUp(u) { return u.hang && G.hanging(u) ? Math.round((u.hang.z - G.map.gz(u.x, u.y)) / G.map.def.step) * 2.5 : 0; }
    function* turnOf(u) { B.active = u; B.focus(u); yield* fire(D.ai.turn(B, u)); B.active = null; yield W(24); }

    var BEATS = [
      { id: 'lane', name: 'Hallvor\'s own lane', what: 'Tonight: she goes up the west bay (x 13-16), by Steinarr\'s climb and 65 ft from the vault doors. The bench had her at the doors in 32 fights of 32, and the party came out at her feet. Her first two turns, the party still behind the doors.',
        run: function* () {
          stage([[C.hv, 21, 19], [C.st, 18, 16]], 1); // (the party behind the vault doors for rounds 1 and 2, as in the fight)
          var n = (B.log || []).length;
          for (var r = 1; r <= 2; r++) { B.round = r; yield* turnOf(C.hv); }
          var lg = logFrom(n), up = !!(C.hv.hang && G.hanging(C.hv)), rock = /Hallv\S* > [^|]*Rock/.test(lg);
          return [C.hv.x >= 13 && C.hv.x <= 16 && up && !rock, 'at (' + C.hv.x + ',' + C.hv.y + ')' + (up ? ', ' + ftUp(C.hv) + ' ft up her lane' : ', not on the face') + (rock ? ', a rock thrown' : ', no rock')];
        } },
      { id: 'under', name: 'Under a climber, and the giant comes down on him', what: 'Steinarr over the first fountain, his climb held to 5 ft: his feet 7.5 ft over the street. Barley steps up onto the fountain\'s rim under him and swings (feet to feet, 5 ft: in reach). Pinned: Barley\'s d20 17, the giant\'s hold (DEX save) 2. He falls on Barley: shoved out, both flat. Then again from 10 ft up (staged), so the fall rolls its 1d6 and splits it.',
        run: function* () {
          stage([[C.st, 14, 16], [C.barley, 15, 20], [C.aurdin, 23, 21]], 3);
          B.active = C.st; B.focus(C.st); RU.startTurn(C.st); C.st.turn.climbLeft = 5;
          var rm = G.reach(C.st, C.st.turn.move), p = G.path(rm, 14, 15);
          if (p && p.length) yield* fire(B.moveAlong(C.st, p, { spend: true }));
          var z1 = C.st.hang && G.hanging(C.st) ? C.st.hang.z : null; B.active = null;
          B.card(['{y}Steinarr{/} clings ' + ftUp(C.st) + ' ft up from the fountain\'s floor -- his feet 7.5 ft over the street, 5 ft over the rim.'], W(240)); yield W(60);
          B.active = C.barley; RU.startTurn(C.barley); B.focus(C.barley);
          yield* fire(B.exec(C.barley, { do: 'move', x: 15, y: 18 }));
          var under = C.barley.x === 15 && C.barley.y === 18, dist = G.dist(C.barley, C.st); yield W(30);
          var n = (B.log || []).length; setPin(17, 2);
          yield* fire(B.exec(C.barley, { do: 'attack', target: C.st })); setPin(null, null); B.active = null; yield W(40);
          var lg = logFrom(n), fell = !(C.st.hang && G.hanging(C.st)), shoved = !(C.barley.x === 15 && C.barley.y === 18), flat = !!C.st.conds.prone && !!C.barley.conds.prone;
          B.card(['{g}7.5 ft is under the SRD\'s 10: no dice for the fall. Again, from 10 ft up -- set there: from the rim a climb digs in 5 ft marks (7.5, 12.5), so 10 is staged.{/}'], W(320)); yield W(120);
          // ... and from 10 ft over the street: Barley on the rim still reaches him (7.5 ft, rounded down to 5), and the fall rolls its 1d6, split
          stage([[C.st, 14, 16], [C.barley, 15, 20], [C.aurdin, 23, 21]], 3);
          C.st.hang = { face: [14, 15], foot: [14, 16], z: 40 }; B.focus(C.st); yield W(40);
          B.active = C.barley; RU.startTurn(C.barley); B.focus(C.barley);
          yield* fire(B.exec(C.barley, { do: 'move', x: 15, y: 18 }));
          var under2 = C.barley.x === 15 && C.barley.y === 18, dist2 = G.dist(C.barley, C.st), hp2 = C.barley.hp; yield W(30);
          var n2 = (B.log || []).length; setPin(17, 2);
          yield* fire(B.exec(C.barley, { do: 'attack', target: C.st })); setPin(null, null); B.active = null; yield W(40);
          var lg2 = logFrom(n2), split = /bludgeoning, split/.test(lg2) && C.barley.hp < hp2;
          return [z1 === 30 && under && dist <= 5 && fell && flat && shoved && /comes down on Barley/.test(lg) && under2 && dist2 <= 5 && split && !!C.st.conds.prone && !!C.barley.conds.prone,
            'climbed to ' + (z1 == null ? '-' : z1 / 4) + ' ft: Barley under ' + under + ' (' + dist + ' ft), the fall ' + fell + ', both flat ' + flat + ', shoved ' + shoved + '; from 10 ft: under ' + under2 + ' (' + dist2 + ' ft), the 1d6 split ' + split + ' (Barley ' + hp2 + ' -> ' + C.barley.hp + ')'];
        } },
      { id: 'shove', name: 'Little men do not block a giant\'s way', what: 'Steinarr 42.5 ft up, Lymen standing where he would climb on. His Shove (the SRD\'s, one attack of his Attack action): Athletics against Lymen\'s. Pinned: every d20 15.',
        run: function* () {
          stage([[C.st, 14, 16], [C.lymen, 15, 15]], 4);
          C.st.hang = { face: [14, 15], foot: [14, 16], z: 170 };
          var n = (B.log || []).length; setPin(15, null);
          yield* turnOf(C.st); setPin(null, null);
          var lg = logFrom(n), on = !(C.st.hang && G.hanging(C.st)) && G.gzAt(C.st, C.st.x, C.st.y) >= 170;
          return [/SHOVED/.test(lg) && on, 'shove ' + /SHOVE/.test(lg) + ', won ' + /SHOVED/.test(lg) + '; Steinarr on the roof ' + on + ', Lymen at (' + C.lymen.x + ',' + C.lymen.y + ')' + (C.lymen.conds.prone ? ' flat' : '')];
        } },
      { id: 'booth', name: 'The rock at the edge, and the Dunking Booth', what: 'Steinarr at the window with his rocks; Vivian on the edge over the first fountain. Pinned: every d20 15 (the rock hits), her STR save 2. Over she goes, into the water -- the blue egg.',
        run: function* () {
          stage([[C.st, 24, 6], [C.vivian, 15, 15]], 6);
          var pick = null;
          for (var y = 2; y <= 12 && !pick; y++) for (var x = 18; x <= 34 && !pick; x++) {
            C.st.x = x; C.st.y = y;
            if (!G.canStand(C.st, x, y) || G.gzAt(C.st, x, y) < 170 || G.dist(C.st, sky) > 15) continue;
            [[15, 15], [14, 15], [16, 15], [13, 15]].forEach(function (v) {
              if (pick) return; C.vivian.x = v[0]; C.vivian.y = v[1];
              var k = D.Battle.knockSq(C.st, C.vivian);
              if (k && k.at[0] >= 14 && k.at[0] <= 16 && k.at[1] >= 16 && k.at[1] <= 17 && G.los(C.st, C.vivian).clear) pick = { st: [x, y], v: v.slice(), k: k.at };
            });
          }
          if (!pick) return [false, 'no square at the window throws her into the fountain (staging)'];
          C.st.x = pick.st[0]; C.st.y = pick.st[1]; C.vivian.x = pick.v[0]; C.vivian.y = pick.v[1];
          var n = (B.log || []).length; setPin(15, 2);
          yield* turnOf(C.st); setPin(null, null);
          var lg = logFrom(n), wet = C.vivian.x >= 14 && C.vivian.x <= 16 && C.vivian.y >= 16 && C.vivian.y <= 17;
          return [wet && !!C.vivian.conds.prone && !!(B.flags8 && B.flags8.eggDunk) && /into the fountain/.test(lg),
            'Steinarr at (' + pick.st + '), Vivian from (' + pick.v + ') to (' + C.vivian.x + ',' + C.vivian.y + '); in the water ' + wet + ', prone ' + !!C.vivian.conds.prone + ', the egg ' + !!(B.flags8 && B.flags8.eggDunk)];
        } },
      { id: 'whistle', name: 'The whistle, her call, and the spiders', what: 'Hallvor 42.5 ft up her lane; she tops out, whistles, and calls -- tonight the call is a recorded clip (deep16/audio/come_on_down.mp3, Windows\' Zira voice pitched down), the browser\'s voice only if it will not play. Two giant spiders come down.',
        run: function* () {
          stage([[C.hv, 14, 16], [C.st, 40, 20]], 5);
          C.hv.hang = { face: [14, 15], foot: [14, 16], z: 170 };
          var wv = (F.arrive.waves || []).filter(function (w) { return w.whistle; })[0];
          [C.sp1, C.sp2].forEach(function (s) { fresh(s); }); C.sp1.x = 19; C.sp1.y = 2; C.sp2.x = 39; C.sp2.y = 2;
          B.late = [{ round: Infinity, king: 0, whistle: true, wave: wv, foes: [C.sp1, C.sp2], allies: [] }];
          var n = (B.log || []).length;
          yield* turnOf(C.hv);
          var lg = logFrom(n), down = B.units.indexOf(C.sp1) >= 0 && B.units.indexOf(C.sp2) >= 0;
          return [!!C.hv.whistled && down && /Come on down!/.test(lg), 'on the roof ' + !(C.hv.hang && G.hanging(C.hv)) + ', whistled ' + !!C.hv.whistled + ', the spiders down ' + down];
        } },
      { id: 'spiders', name: 'A spider down the face to a climber', what: 'Lymen on a rope 22.5 ft up the east bay, a giant spider on the roof above with its web spent: over the lip and down the face beside him, and the bite. Pinned: every d20 15.',
        run: function* () {
          stage([[C.sp1, 35, 12], [C.lymen, 36, 16]], 6);
          var rope = { at: [36, 15], foot: [36, 16], hp: 2, by: C.lymen.id }; B.ropes = [rope];
          C.lymen.hang = { rope: rope, z: 90 };
          if (C.sp1.web) C.sp1.web.ready = false;
          var n = (B.log || []).length; setPin(15, null);
          yield* turnOf(C.sp1); setPin(null, null);
          var lg = logFrom(n), onFace = !!(C.sp1.hang && C.sp1.hang.face && G.hanging(C.sp1)), bit = /> Lymen\s+Bite/.test(lg);
          return [onFace && bit, 'the spider on the face ' + onFace + (onFace ? ' (' + ftUp(C.sp1) + ' ft up)' : '') + ', the bite ' + bit];
        } },
      { id: 'troll', name: 'A troll at 0, Pyro\'s flask, and the torch', what: 'A troll knocked to 0 knits at its turn. Down again: Pyro\'s own flask at it, "Torch him!" -- then Barley takes a torch from the barrel behind the houses and throws it (the card\'s new words: it lands at its feet). The oil burns 5 more, it burned, and at its turn it does not knit. Pinned: every d20 15.',
        run: function* () {
          stage([[C.troll, 22, 33], [C.pyro, 24, 34], [C.barley, 23, 31]], 7); // (behind the houses south of the street: Barley beside the torch barrel at (22,30), the troll on the grass past it)
          var n = (B.log || []).length; B.focus(C.troll);
          B.hurt(C.troll, C.troll.hp + (C.troll.temp || 0), 'slashing', {}); yield W(40);
          var down1 = !!C.troll.regenDown;
          yield* turnOf(C.troll);
          var knit = C.troll.hp > 0 && !C.troll.dead;
          B.round++; B.hurt(C.troll, C.troll.hp + (C.troll.temp || 0), 'slashing', {}); yield W(30);
          RU.startTurn(C.pyro); C.pyro.ownFlask = 1; setPin(15, null);
          yield* turnOf(C.pyro); setPin(null, null);
          var oiled = !!(C.troll.conds && C.troll.conds.oiled), called = /Torch him!/.test(logFrom(n));
          B.active = C.barley; RU.startTurn(C.barley); B.focus(C.barley);
          var ring = B.commands(C.barley).some(function (c) { return c.id === 'barreltorch' && c.ok; });
          yield* fire(B.exec(C.barley, { do: 'barreltorch' })); var took = ring && !!C.barley.torch; yield W(20);
          setPin(15, null); yield* fire(B.exec(C.barley, { do: 'throwtorch', x: C.troll.x, y: C.troll.y })); setPin(null, null); B.active = null; yield W(30);
          var burned = !!C.troll.burned;
          yield* turnOf(C.troll);
          var lg = logFrom(n);
          return [down1 && knit && called && oiled && took && burned && !!C.troll.dead && /lands at its feet/.test(lg),
            'down ' + down1 + ', knit ' + knit + '; "Torch him!" ' + called + ', oiled ' + oiled + '; a torch from the barrel ' + took + ', burned ' + burned + ', its words ' + /lands at its feet/.test(lg) + '; dead ' + !!C.troll.dead];
        } },
      { id: 'oil', name: 'Oil on a troll on its feet, then fire', what: 'Added 10-06 (his three throws had missed): Barley throws the party\'s flask at a troll standing on the street, and it hits -- the dark sheen over it, the gloss and the drip (hover it: its card says oiled, and that the oiled burn 5 more). Then Aurdin\'s Fire Bolt: the oil catches, 5 fire more, and the troll smoulders where it stands. Pinned: every d20 15.',
        run: function* () {
          stage([[C.barley, 16, 22], [C.troll1, 19, 21], [C.aurdin, 14, 19]], 7); // (all on the open street, y 19-23: the troll 15 ft from Barley, in the flask's 20; Aurdin 25 ft off it, out of its reach, no one in his line)
          if (D.oil.lit(C.barley)) delete C.barley.torch; // (a torch burning in his hand would light the flask: the plain throw is the one that coats)
          var fl = (B.inv || []).filter(function (s) { return s.id === 'oil'; })[0]; if (!fl) B.inv = (B.inv || []).concat([{ id: 'oil', n: 1 }]); else if (fl.n < 1) fl.n = 1; // (the party's one flask, whatever came before)
          var n = (B.log || []).length;
          B.active = C.barley; RU.startTurn(C.barley); B.focus(C.troll1);
          setPin(15, null); yield* fire(B.exec(C.barley, { do: 'item', id: 'oil', target: C.troll1 })); setPin(null, null); B.active = null;
          var oiled = !!(C.troll1.conds && C.troll1.conds.oiled);
          B.focus(C.troll1); yield W(300); // (the sheen, held)
          var e = D.magic.list(B, C.aurdin, { anyTarget: true }).filter(function (x) { return x.id === 'firebolt'; })[0];
          B.active = C.aurdin; RU.startTurn(C.aurdin);
          setPin(15, null); if (e && e.ok) yield* fire(B.exec(C.aurdin, { do: 'cast', id: 'firebolt', slot: e.slot, target: C.troll1 })); setPin(null, null); B.active = null;
          B.focus(C.troll1); yield W(300); // (the smoulder on a troll still on its feet, held)
          var lg = logFrom(n), coat = /covered in oil/.test(lg), caught = /The oil on [^|]* catches/.test(lg), burned = !!C.troll1.burned, dry = !(C.troll1.conds && C.troll1.conds.oiled), up = C.troll1.hp > 0 && !C.troll1.dead && !C.troll1.regenDown;
          return [oiled && coat && caught && burned && dry && up, 'the flask hits and coats it ' + (oiled && coat) + '; Fire Bolt ' + (e && e.ok ? 'cast' : 'not castable (' + (e ? e.why : 'unknown') + ')') + ', the oil catches ' + caught + ', burned ' + burned + ', the coat gone ' + dry + ', on its feet ' + up + ' (' + C.troll1.hp + ' HP)'];
        } },
      { id: 'oildown', name: 'Oil on a troll where it lies, then fire', what: 'Added 10-06 (Griz: "we\'ll need on prone as well"): a troll knocked to 0 lies knitting; Barley\'s flask hits it where it lies -- the same band and drips, over the height it lies at. Then Aurdin\'s Fire Bolt: a troll burned at 0 dies. Pinned: every d20 15.',
        run: function* () {
          stage([[C.barley, 16, 22], [C.troll1, 19, 21], [C.aurdin, 14, 19]], 7);
          if (D.oil.lit(C.barley)) delete C.barley.torch;
          var fl = (B.inv || []).filter(function (s) { return s.id === 'oil'; })[0]; if (!fl) B.inv = (B.inv || []).concat([{ id: 'oil', n: 1 }]); else if (fl.n < 1) fl.n = 1;
          var n = (B.log || []).length; B.focus(C.troll1);
          B.hurt(C.troll1, C.troll1.hp + (C.troll1.temp || 0), 'slashing', {}); yield W(50);
          var down1 = !!C.troll1.regenDown;
          B.active = C.barley; RU.startTurn(C.barley);
          setPin(15, null); yield* fire(B.exec(C.barley, { do: 'item', id: 'oil', target: C.troll1 })); setPin(null, null); B.active = null;
          var oiled = !!(C.troll1.conds && C.troll1.conds.oiled);
          B.focus(C.troll1); yield W(300); // (the sheen on one lying, held)
          var e = D.magic.list(B, C.aurdin, { anyTarget: true }).filter(function (x) { return x.id === 'firebolt'; })[0];
          B.active = C.aurdin; RU.startTurn(C.aurdin);
          setPin(15, null); if (e && e.ok) yield* fire(B.exec(C.aurdin, { do: 'cast', id: 'firebolt', slot: e.slot, target: C.troll1 })); setPin(null, null); B.active = null;
          B.focus(C.troll1); yield W(120);
          var lg = logFrom(n), caught = /The oil on [^|]* catches/.test(lg);
          // (the fire kills a troll at 0 outright, so the oil's 5 more never comes: js/oil.js spares the dead)
          return [down1 && oiled && !!C.troll1.dead, 'down at 0 ' + down1 + '; the flask hits it where it lies ' + oiled + '; Fire Bolt ' + (e && e.ok ? 'cast' : 'not castable (' + (e ? e.why : 'unknown') + ')') + ', dead ' + !!C.troll1.dead + (caught ? ' (the oil caught first)' : '')];
        } },
      { id: 'barrel', name: 'The torch barrel, by the class AI', what: 'Tonight: the barrel in the fence behind the houses, (22,30). A troll lies at 0 and nobody has fire: Barley, run by the class AI, walks to the barrel, takes a torch (free) and throws it. Pinned: every d20 15.',
        run: function* () {
          stage([[C.troll, 22, 33], [C.barley, 27, 29]], 8); // (Barley a walk from the barrel, the troll down on the grass past it)
          B.hurt(C.troll, C.troll.hp + (C.troll.temp || 0), 'slashing', {}); yield W(30);
          var n = (B.log || []).length, ai0 = C.barley.classAI; C.barley.classAI = true; setPin(15, null);
          try { yield* turnOf(C.barley); } finally { C.barley.classAI = ai0; setPin(null, null); }
          var lg = logFrom(n), took = /takes a torch from the barrel/.test(lg), threw = /throws the torch/.test(lg);
          return [took && threw && !!C.troll.burned, 'to the barrel and a torch ' + took + ', thrown ' + threw + ', the troll burned ' + !!C.troll.burned];
        } },
      { id: 'glass', name: 'Only Shatter touches the glass', what: 'Aurdin on the roof: Fire Bolt will not take the skylight (no aimed spell does); Shatter\'s thunder does, the glass making no save. Pinned: Shatter\'s dice at their top (the glass shrugs off anything under 8).',
        run: function* () {
          stage([[C.aurdin, 20, 12]], 8);
          var sp = spotNear(C.aurdin, sky.x, sky.y, 20, 30, true); if (sp) { C.aurdin.x = sp[0]; C.aurdin.y = sp[1]; }
          var gF = D.magic.geo ? D.magic.geo('firebolt') : null, fbOK = gF ? !!D.magic.targetOK(B, C.aurdin, gF, sky) : null;
          if ((C.aurdin.known || []).indexOf('shatter') < 0) C.aurdin.known = (C.aurdin.known || []).concat(['shatter']);
          var e = D.magic.list(B, C.aurdin, { anyTarget: true }).filter(function (x) { return x.id === 'shatter'; })[0], hp0 = sky.hp;
          B.active = C.aurdin; B.focus(sky);
          setPin(null, null, true); // (its 3d8 at the top: the glass shrugs off anything under 8)
          if (e && e.ok) yield* fire(B.exec(C.aurdin, { do: 'cast', id: 'shatter', slot: e.slot, target: { x: sky.x, y: sky.y } }));
          setPin(null, null); B.active = null; yield W(30);
          return [fbOK === false && sky.hp < hp0, 'Fire Bolt at the glass ' + (fbOK === false ? 'refused' : 'TAKEN') + '; Shatter ' + (e && e.ok ? 'cast: the glass ' + hp0 + ' -> ' + sky.hp : 'not castable (' + (e ? e.why : 'unknown') + ')')];
        } },
      { id: 'axe', name: 'Pyro\'s handaxe, and its return', what: 'Hallvor 20 ft up her lane, nobody in the king\'s reach: he throws the handaxe +3 at the one highest on the face, and it is back in his hand at the end of his next turn. Pinned: every d20 15, her hold 18 (she keeps it).',
        run: function* () {
          stage([[C.pyro, 21, 21], [C.hv, 14, 16]], 9);
          C.hv.hang = { face: [14, 15], foot: [14, 16], z: 90 };
          var n = (B.log || []).length; setPin(15, 18);
          yield* turnOf(C.pyro);
          var threw = /throws the handaxe/.test(logFrom(n)) && !!C.pyro.axeOut;
          B.round++; RU.startTurn(C.pyro); yield* turnOf(C.pyro); setPin(null, null);
          var back = /handaxe comes back/.test(logFrom(n)) && !C.pyro.axeOut;
          return [threw && back, 'thrown ' + threw + ', back at the end of his next turn ' + back];
        } },
      { id: 'ready', name: 'READY ends the turn', what: 'Tonight\'s ruling: Barley readies his flail with move left, and his turn is over. A troll walks up on its own turn, and the readied blow springs. Pinned: every d20 15.',
        run: function* () {
          stage([[C.barley, 20, 20], [C.troll1, 20, 26]], 10);
          var tS = spotNear(C.troll1, 20, 20, 20, 25, false); if (tS) { C.troll1.x = tS[0]; C.troll1.y = tS[1]; } // (on the street, 20-25 ft off: one turn's walk into his reach)
          var o = { cmds: [{ do: 'ready', pick: 'weapon' }] };
          B.active = C.barley; B.focus(C.barley);
          yield* fire(B.heroTurn(C.barley), o); B.active = null; yield W(30);
          var ended = !!C.barley.ready && o.asked === 1 && C.barley.turn.move === 0 && !!C.barley.turn.waits;
          var n = (B.log || []).length;
          B.active = C.troll1; RU.startTurn(C.troll1); B.focus(C.troll1);
          var rm = G.reach(C.troll1, C.troll1.turn.move), gT = null;
          Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand || G.dist(C.barley, { x: e.x, y: e.y, size: C.troll1.size || 1 }) > 5) return; if (!gT || e.cost < gT.cost) gT = e; });
          var p = gT ? G.path(rm, gT.x, gT.y) : null;
          setPin(15, null); if (p && p.length) yield* fire(B.moveAlong(C.troll1, p, { spend: true })); setPin(null, null); B.active = null; yield W(30);
          var lg = logFrom(n), sprung = /\(readied\)/.test(lg) && C.barley.reaction === 0;
          return [ended && sprung, 'one ask, then over ' + (o.asked === 1) + ', move left ' + C.barley.turn.move + '; the readied blow on the troll\'s turn ' + sprung];
        } }
    ];

    var only = get('only'), list = only ? BEATS.filter(function (b) { return only.split(',').indexOf(b.id) >= 0; }) : BEATS;
    var start = Math.max(0, (+(get('beat') || 1)) - 1); list = list.slice(start);
    try {
      for (var i = 0; i < list.length; i++) {
        var b = list[i];
        B.clearCards();
        B.card(['{y}THE SKYLIGHTS, SHOWN  ' + (i + 1) + ' / ' + list.length + ':  ' + b.name.toUpperCase() + '{/}'].concat(D.wrap(b.what, 440).map(function (l) { return '{g}' + l + '{/}'; })), W(480));
        yield W(140);
        var res, n0 = (B.log || []).length;
        try { res = yield* b.run(); } catch (e) { res = [false, 'threw: ' + String(e && e.message || e)]; if (window.console) console.error('skyshow ' + b.id, e); }
        setPin(null, null);
        report.push({ id: b.id, name: b.name, ok: !!res[0], why: res[1], log: logFrom(n0) });
        B.card([(res[0] ? '{n}SHOWN{/}  ' : '{r}NOT AS IT SHOULD BE{/}  ') + b.name, '{g}' + res[1] + '{/}'], W(420));
        yield W(170);
      }
    } finally { D.d = d0; RU.save = save0; }
    B.clearCards();
    var okN = report.filter(function (r) { return r.ok; }).length;
    B.card(['{y}THE SKYLIGHTS, SHOWN: ' + okN + ' OF ' + report.length + '{/}'].concat(report.map(function (r) { return (r.ok ? '{n}ok{/}  ' : '{r}NO{/}  ') + r.name; })), 1e9);
    if (window.console) console.log('DEEP16 skyshow: ' + okN + ' of ' + report.length, report);
  }
})();
