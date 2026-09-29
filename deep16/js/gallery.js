/* DEEP16 — the spell gallery (?fxgallery; the spell animation pass, 09-28h: "every look gets judged in the pane"). Every spell on the
   grid cast in turn, at game speed, on the class floor: a caster (a wizard for the arcane, a cleric for the divine, a druid for the
   wild -- 09-29), a friend beside them, three foes a few squares off. Between casts everyone is made whole again and whatever the last
   spell left on the floor is swept away. Keys: left/right the spell before or after, up/down ten at a time, E (or A) cast it again, M
   the menu. &spell=<id> starts at that spell; &auto casts on down the list by itself; &only=a,b,c keeps to those; &keep skips the
   sweep between casts (E casts the same spell again at the same creature, on whatever the last cast left -- Enlarge twice).
   A showcase, not a testground (Griz, 09-29: "please have the animation gallery show the animation and spell description only; the
   testing rooms will have to be set-up special per spell that needs testing on demand"): the card is the spell's name, its
   description (the 8-bit game's player-facing text, where it has one) and the rules line the ring shows. It rides the class floor's
   battle (js/classes.js D.npcFight) and runs the spell through the battle's own exec, so what it shows is what a fight shows. The
   same pick of target as the bench's mode=spells (dev/bench16.js). */
'use strict';
(function () {
  var D = window.D16, I = D.input;
  function onList(cls, id) { var c = D.npc.CLASSES[cls], sp = (c && c.spells) || {}; return Object.keys(sp).some(function (k) { return Array.isArray(sp[k]) && sp[k].indexOf(id) >= 0; }); }
  // who casts it: the druid for a druid's or ranger's spell that no wizard or cleric has; the cleric for a divine one; the wizard for the rest
  function casterOf(id) {
    var arcane = ['wizard', 'sorcerer', 'warlock'].some(function (c) { return onList(c, id); }), divine = ['cleric', 'paladin'].some(function (c) { return onList(c, id); });
    var wild = ['druid', 'ranger'].some(function (c) { return onList(c, id); });
    return wild && !arcane && !divine ? 'druid' : divine && !arcane ? 'cleric' : 'wizard';
  }

  D.fxGallery = function (q) {
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var only = get('only'), auto = /[?&]auto\b/.test(q), keep = /[?&]keep\b/.test(q); // (&keep: the stage is not swept between casts: E casts again at the same one)
    var ids = Object.keys(D.SPELLS).filter(function (id) {
      var g = D.magic.geo(id), sp = D.magic.data(id);
      return sp && g.shape !== 'none' && g.shape !== 'reaction';
    }).sort(function (a, b) { var A = D.magic.data(a), Bq = D.magic.data(b); return (A.level - Bq.level) || (A.name < Bq.name ? -1 : 1); });
    if (only) ids = only.split(',').filter(function (id) { return ids.indexOf(id) >= 0; });
    var start = Math.max(0, ids.indexOf(get('spell') || ''));
    var B = new D.Battle({ gallery: true, npc: { party: ['wizard:9', 'cleric:9', 'druid:9', 'fighter:9'], foes: ['fighter:9', 'fighter:9', 'fighter:9'] },
      fightDef: D.classFight(9, { what: 'the spell gallery', intro: 'Every spell on the grid, one after another.' }) });
    var S = B.gallery = { i: start, ids: ids, auto: auto, home: null, units: null };
    var enter0 = B.enter;
    B.enter = function () {
      enter0.apply(this, arguments);
      var P = B.units.filter(function (w) { return w.side === 'party'; }), F = B.units.filter(function (w) { return w.side === 'foe'; });
      // the stage: the casters at the south (the friend behind them), the foes four squares north of them, bunched so an area catches two
      var cx = Math.floor(D.grid.map.w / 2), cy = Math.floor(D.grid.map.h / 2) + 3;
      var spots = { party: [[cx, cy], [cx + 1, cy], [cx - 1, cy], [cx, cy + 1]], foe: [[cx, cy - 4], [cx + 1, cy - 5], [cx - 1, cy - 5]] };
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
        if (w.beast && D.features && D.features.unshape) { try { D.features.unshape(B, w, 0, true); } catch (e2) { delete w.beast; } }
        w.x = h.x; w.y = h.y; w.facing = h.facing; w.maxhp = h.hp; w.hp = h.hp; w.temp = 0; w.conds = {}; w.dead = false; w.ko = false;
        w.images = 0; w._imgs = 0; w.anim = 'idle'; w.animT = B.t; w.torch = null; w.fled = false; w.left = false; w.reaction = 1;
        w.slots = h.slots.slice(); w.known = h.known.slice();
      });
      ['grounds', 'auras', 'wards', 'spirits', 'darks', 'webs', 'zones', 'beads'].forEach(function (k) { if (B[k]) B[k] = []; });
      B.lights = (B.lights || []).filter(function (l) { return l.kind === 'map'; });
      B.lightMap = null;
      D.grid.setup(D.grid.map, B.units);
    }
    // the card: the spell's name, what the 8-bit game says of it (where it says anything), the rules line the ring shows, the keys.
    // B.card does not wrap a line, so the description and the rules line are wrapped here, at a width that leaves the card inside the screen
    function header(id, sp, e, u) {
      var wrapAt = 440, rules = '';
      try { rules = e ? D.magic.summary(e, u) : ''; } catch (x) { rules = ''; }
      var lines = ['{y}' + (S.i + 1) + ' / ' + S.ids.length + '   ' + sp.name.toUpperCase() + '{/}' + (sp.level ? '  (level ' + sp.level + ')' : '  (cantrip)')];
      // the creature types they name show as their glyphs (Griz, 09-29), and "(inspect)" once after both when any is named
      var desc = D.typeText(sp.desc || '', true); rules = D.typeText(rules, true);
      if (/\{:/.test(desc + rules)) { if (rules) rules += ' (inspect)'; else desc += ' {g}(inspect){/}'; }
      if (desc) lines = lines.concat(D.wrap(desc, wrapAt));
      if (rules) lines = lines.concat(D.wrap(rules, wrapAt).map(function (l) { return '{g}' + l + '{/}'; }));
      lines.push('{g}left/right the next · up/down ten · E again{/}');
      B.clearCards(); S.card = null;
      B.card(lines, 1e9, 'gallery'); S.card = B.cards[B.cards.length - 1];
    }
    // B.card keeps three cards and lets the oldest go: a cast that says three things (Eldritch Blast, Moonbeam, Scorching Ray,
    // the mass heals, Meteor Swarm) would push the spell's own card off the screen mid-animation. This one stays, first, and the cast's
    // own cards take the other two places.
    var card0 = B.card;
    B.card = function () {
      var r = card0.apply(this, arguments), g = S.card;
      if (g && this.cards.indexOf(g) < 0) { this.cards.unshift(g); while (this.cards.length > 3) this.cards.splice(1, 1); }
      return r;
    };
    function* loop() {
      for (var round = 0; ; round++) {
        if (!keep || !round) reset(); // (&keep: only the first time, to set the stage; after it what the last cast did stays)
        var id = S.ids[S.i], sp = D.magic.data(id);
        var P = S.units.filter(function (w) { return w.side === 'party'; }), byCls = {}; P.forEach(function (w) { byCls[w.cls] = w; });
        var u = byCls[casterOf(id)] || P[0], mate = P[3], pals = P.filter(function (w) { return w !== u && w !== mate; });
        u.known = [id]; u.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; u.slotsMax = u.slots.slice();
        if (!keep || !round) mate.hp = Math.floor(mate.maxhp / 3); // (a heal wants someone hurt)
        B.round = 1; D.rules.startTurn(u);
        var foes = S.units.filter(function (w) { return w.side === 'foe'; });
        var e = D.magic.list(B, u).filter(function (x) { return x.id === id; })[0];
        header(id, sp, e, u);
        if (!e || !e.ok) { B.card(['{r}' + sp.name + ': not castable here (' + (e ? e.why : 'no entry') + '){/}'], 1e9, 'gallery-why'); }
        else {
          var ev = (D.magic.EFFECT[id] && D.magic.EFFECT[id].ai) || D.tactics.EVAL[id] || D.tactics.EVAL['shape:' + e.g.shape], t = null;
          var pick = null; try { pick = ev ? ev(B, u, e, e.slot, D.tactics.foesOf(B, u), D.tactics.alliesOf(B, u)) : null; } catch (x) { pick = null; }
          t = pick && pick.t;
          // &keep, the same spell again: at the same creature as the last cast (a second Enlarge on the one already enlarged), whatever the weighing says now
          if (keep && S.last && S.last.id === id && S.last.t && S.last.t.conds && S.last.t.hp > 0) t = S.last.t;
          if (!t) t = e.g.shape === 'self' ? u : /touch|allies/.test(e.g.shape) || e.g.side === 'ally' ? (e.g.shape === 'allies' ? { units: [u].concat(pals, [mate]) } : (D.grid.dist(u, mate) <= 5 ? mate : u))
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
