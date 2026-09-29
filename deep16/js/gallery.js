/* DEEP16 — the spell gallery (?fxgallery; the spell animation pass, 09-28h: "every look gets judged in the pane"). Every spell on the
   grid cast in turn, at game speed, on the class floor: a caster (a wizard for the arcane, a cleric for the divine), a friend
   beside him, three foes a few squares off. Between casts everyone is made whole again and whatever the last spell left on the
   floor is swept away. Keys: left/right the spell before or after, up/down ten at a time, E (or A) cast it again, M the menu.
   &spell=<id> starts at that spell; &auto casts on down the list by itself; &only=a,b,c keeps to those; &keep skips the sweep between
   casts (a testground: E casts the same spell again at the same creature, on whatever the last cast left -- Enlarge twice). It rides the class
   floor's battle (js/classes.js D.npcFight) and runs the spell through the battle's own exec, so what it shows is what a fight
   shows. The same pick of target as the bench's mode=spells (dev/bench16.js). */
'use strict';
(function () {
  var D = window.D16, I = D.input;
  // a divine spell (on a cleric's, druid's, paladin's or ranger's list and on no arcane one) is cast by the cleric
  function onList(cls, id) { var c = D.npc.CLASSES[cls], sp = (c && c.spells) || {}; return Object.keys(sp).some(function (k) { return Array.isArray(sp[k]) && sp[k].indexOf(id) >= 0; }); }
  function divine(id) { return ['cleric', 'druid', 'paladin', 'ranger'].some(function (c) { return onList(c, id); }) && !['wizard', 'sorcerer', 'warlock'].some(function (c) { return onList(c, id); }); }

  D.fxGallery = function (q) {
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var only = get('only'), auto = /[?&]auto\b/.test(q), keep = /[?&]keep\b/.test(q); // (&keep: the stage is not swept between casts -- a testground: E casts again at the same one)
    var ids = Object.keys(D.SPELLS).filter(function (id) {
      var g = D.magic.geo(id), sp = D.magic.data(id);
      return sp && g.shape !== 'none' && g.shape !== 'reaction';
    }).sort(function (a, b) { var A = D.magic.data(a), Bq = D.magic.data(b); return (A.level - Bq.level) || (A.name < Bq.name ? -1 : 1); });
    if (only) ids = only.split(',').filter(function (id) { return ids.indexOf(id) >= 0; });
    var start = Math.max(0, ids.indexOf(get('spell') || ''));
    var B = new D.Battle({ gallery: true, npc: { party: ['wizard:9', 'cleric:9', 'fighter:9'], foes: ['fighter:9', 'fighter:9', 'fighter:9'] },
      fightDef: D.classFight(9, { what: 'the spell gallery', intro: 'Every spell on the grid, one after another.' }) });
    var S = B.gallery = { i: start, ids: ids, auto: auto, home: null, units: null };
    var enter0 = B.enter;
    B.enter = function () {
      enter0.apply(this, arguments);
      var P = B.units.filter(function (w) { return w.side === 'party'; }), F = B.units.filter(function (w) { return w.side === 'foe'; });
      // the stage: the casters at the south, the foes four squares north of them, bunched so an area catches two
      var cx = Math.floor(D.grid.map.w / 2), cy = Math.floor(D.grid.map.h / 2) + 3;
      var spots = { party: [[cx, cy], [cx + 1, cy], [cx - 1, cy]], foe: [[cx, cy - 4], [cx + 1, cy - 5], [cx - 1, cy - 5]] };
      P.forEach(function (w, i) { w.x = spots.party[i][0]; w.y = spots.party[i][1]; w.facing = 4; });
      F.forEach(function (w, i) { w.x = spots.foe[i][0]; w.y = spots.foe[i][1]; w.facing = 0; });
      S.units = B.units.slice();
      S.home = S.units.map(function (w) { return { w: w, x: w.x, y: w.y, facing: w.facing, hp: w.maxhp, slots: (w.slots || []).slice(), known: (w.known || []).slice() }; });
      B.req = null;
      B.co = loop();
    };
    function reset() {
      B.units = S.units.slice();
      S.home.forEach(function (h) {
        var w = h.w;
        if (w.conc && D.magic.endConc) { try { D.magic.endConc(B, w, 'the gallery'); } catch (e) { w.conc = null; } }
        w.x = h.x; w.y = h.y; w.facing = h.facing; w.maxhp = h.hp; w.hp = h.hp; w.temp = 0; w.conds = {}; w.dead = false; w.ko = false;
        w.images = 0; w._imgs = 0; w.anim = 'idle'; w.animT = B.t; w.torch = null; w.fled = false; w.left = false;
        w.slots = h.slots.slice(); w.known = h.known.slice();
      });
      ['grounds', 'auras', 'wards', 'spirits', 'darks', 'webs', 'zones'].forEach(function (k) { if (B[k]) B[k] = []; });
      B.lights = (B.lights || []).filter(function (l) { return l.kind === 'map'; });
      B.lightMap = null;
      D.grid.setup(D.grid.map, B.units);
    }
    function* loop() {
      for (var round = 0; ; round++) {
        if (!keep || !round) reset(); // (&keep: only the first time, to set the stage; after it what the last cast did stays)
        var id = S.ids[S.i], sp = D.magic.data(id);
        var P = S.units.filter(function (w) { return w.side === 'party'; }), wiz = P[0], cle = P[1], mate = P[2];
        var u = divine(id) ? cle : wiz, pal = u === wiz ? cle : wiz;
        u.known = [id]; u.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; u.slotsMax = u.slots.slice();
        if (!keep || !round) mate.hp = Math.floor(mate.maxhp / 3); // (a heal wants someone hurt)
        B.round = 1; D.rules.startTurn(u);
        var foes = S.units.filter(function (w) { return w.side === 'foe'; });
        var e = D.magic.list(B, u).filter(function (x) { return x.id === id; })[0];
        B.clearCards();
        B.card(['{y}' + (S.i + 1) + ' / ' + S.ids.length + '   ' + sp.name.toUpperCase() + '{/}' + (sp.level ? '  (level ' + sp.level + ')' : '  (cantrip)'),
          '{g}' + [sp.el || sp.kind || '', D.magic.geo(id).shape].filter(Boolean).join(' · ') + '   left/right the next, up/down ten, E again' + (keep ? '  ·  &keep: no sweep between casts' : '') + '{/}'], 1e9, 'gallery');
        if (!e || !e.ok) { B.card(['{r}' + sp.name + ': not castable here (' + (e ? e.why : 'no entry') + '){/}'], 1e9, 'gallery-why'); }
        else {
          var ev = (D.magic.EFFECT[id] && D.magic.EFFECT[id].ai) || D.tactics.EVAL[id] || D.tactics.EVAL['shape:' + e.g.shape], t = null;
          var pick = null; try { pick = ev ? ev(B, u, e, e.slot, D.tactics.foesOf(B, u), D.tactics.alliesOf(B, u)) : null; } catch (x) { pick = null; }
          t = pick && pick.t;
          // &keep, the same spell again: at the same creature as the last cast (a second Enlarge on the one already enlarged), whatever the weighing says now
          if (keep && S.last && S.last.id === id && S.last.t && S.last.t.conds && S.last.t.hp > 0) t = S.last.t;
          if (!t) t = e.g.shape === 'self' ? u : /touch|allies/.test(e.g.shape) || e.g.side === 'ally' ? (e.g.shape === 'allies' ? { units: [u, pal, mate] } : (D.grid.dist(u, mate) <= 5 ? mate : u))
            : /sphere|cube|cone|line|wave|teleport/.test(e.g.shape) ? { x: foes[0].x, y: foes[0].y } : /rays|darts/.test(e.g.shape) ? { units: [foes[0], foes[1], foes[0]].slice(0, e.g.n || 3) } : foes[0];
          S.last = { id: id, t: t };
          var f0 = t.units ? t.units[0] : t;
          if (f0 && f0.x != null) { var mx = Math.round((u.x + f0.x) / 2), my = Math.round((u.y + f0.y) / 2); D.iso.lookAt(mx, my, D.grid.map.gz(mx, my)); }
          yield 20;
          yield* B.exec(u, { do: 'cast', id: id, slot: e.slot, target: t });
        }
        yield 50;
        var v = S.auto ? 1 : yield { gallery: true };
        S.i = ((S.i + (v == null ? 1 : v)) % S.ids.length + S.ids.length) % S.ids.length;
      }
    }
    return B;
  };

  // the gallery waits between casts on its own request (the battle's other requests -- a spell's prompt -- go as ever)
  var input0 = D.ui.input;
  D.ui.input = function (B, req) {
    if (!req.gallery) return input0(B, req);
    D.ui.camera(B);
    var d = I.repeat('right') ? 1 : I.repeat('left') ? -1 : I.repeat('down') ? 10 : I.repeat('up') ? -10 : I.pressed('a') || I.mouse.click ? 0 : null;
    if (d != null) { D.sfx(d ? 'cursor' : 'confirm'); B.answer(d); }
  };
})();
