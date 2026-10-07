/* DEEP16 — the spell gallery (?fxgallery; the spell animation pass, 09-28h: "every look gets judged in the pane"). Every spell on the
   grid cast in turn, at game speed, on the class floor: a caster (a wizard for the arcane, a cleric for the divine, a druid for the
   wild -- 09-29), a friend beside them, three foes a few squares off. Between casts everyone is made whole again and whatever the last
   spell left on the floor is swept away. Keys: left/right the spell before or after, up/down ten at a time, E (or A) cast it again, M
   the menu. &spell=<id> starts at that spell; &auto casts on down the list by itself; &only=a,b,c keeps to those; &keep skips the
   sweep between casts (E casts the same spell again at the same creature, on whatever the last cast left -- Enlarge twice); &foe=<kind>
   puts three of a bestiary creature (data/foes.js) where the fighters stand (&foe=hyena, first for Hideous Laughter's hyena egg, 09-30; since 10-02 the egg is Aurdin's joke on the gnolls -- js/grimoire.js).
   A showcase, not a testground (Griz, 09-29: "please have the animation gallery show the animation and spell description only; the
   testing rooms will have to be set-up special per spell that needs testing on demand"): the card is the spell's name, its
   description (the 8-bit game's player-facing text, where it has one) and the rules line the ring shows. It rides the class floor's
   battle (js/classes.js D.npcFight) and runs the spell through the battle's own exec, so what it shows is what a fight shows. The
   same pick of target as the bench's mode=spells (dev/bench16.js).
   ?fxgallery&features is the twin for the CLASS FEATURES (09-30, the feature walk; below, D.fxFeatures): the same stage and keys, the
   register data/features.js, dev/bench16.js mode=featurewalk, dev/feature-walk-lamp.html. Everything above it is the spell mode, as it was. */
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

  // the gallery's foes are normies (10-02, Griz: "targets of the effects are normies with all 8s on their stats but like 100 hp"): every score 8
  // (-1), no proficient saves, no Indomitable, no Second Wind -- a save or a blow shows what the spell does, not what a ninth-level fighter
  // shrugs off -- and 100 hp so nothing dies mid-demonstration
  function normie(w) {
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function (k) { w.abil[k] = 8; if (w.base) w.base[k] = 8; });
    w.saves = { str: -1, dex: -1, con: -1, int: -1, wis: -1, cha: -1 }; w.saveProf = []; w.feats = {};
    w.maxhp = w.hp = 100; w.temp = 0;
    return w;
  }

  D.fxGallery = function (q) {
    if (/[?&]keeper\b/.test(q) && D.fxKeeper) return D.fxKeeper(q); // (the Keeper's looks and rules, one scene at a time: js/keeper.js, 10-03)
    if (/[?&]features\b/.test(q)) return D.fxFeatures(q); // (the feature walk, below: &features; the spell mode is as it was)
    if (/[?&]mascots\b/.test(q) && D.fxMascots) return D.fxMascots(q); // (the Mascots' kits, one ability at a time, up/down the level: js/mpgallery.js, 10-07; ?mpgallery is the short door)
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
      // &foe=hyena: the three foes are that creature of the bestiary (data/foes.js) in the fighters' place -- a testing room on demand
      // (09-30, Hideous Laughter's hyena: ?fxgallery&spell=hideouslaughter&foe=hyena)
      var fk = get('foe');
      if (fk && D.FOES[fk]) { F = F.map(function (w, i) { return B.makeFoe({ id: 'gf' + i + '-' + fk, kind: fk }); }); B.units = P.concat(F); }
      // the stage: the casters at the south (the friend behind them), the foes four squares north of them, bunched so an area catches two
      if (!(fk && D.FOES[fk]) && !/[?&]raw/.test(q)) F.forEach(normie); // (the plain foes only: a bestiary creature asked for by &foe= keeps its own sheet)
      var cx = Math.floor(D.grid.map.w / 2), cy = Math.floor(D.grid.map.h / 2) + 3;
      var spots = { party: [[cx, cy], [cx + 1, cy], [cx - 1, cy], [cx, cy + 1]], foe: [[cx, cy - 4], [cx + 1, cy - 5], [cx - 1, cy - 5]] };
      P.forEach(function (w, i) { w.x = spots.party[i][0]; w.y = spots.party[i][1]; w.facing = 4; });
      F.forEach(function (w, i) { w.x = spots.foe[i][0]; w.y = spots.foe[i][1]; w.facing = 0; });
      S.units = B.units.slice();
      // (and what a spell writes on the figure itself, not in its conds, which reset() empties without running their undo: the weapon in hand
      // -- Shillelagh, Magic Weapon -- its speed -- Longstrider's +10 stacked a scene at a time -- its AC, size and look. 10-01b, Griz: "in
      // the spell gallery last time I checked the ethereal state of one spell was carrying over multiple scenes")
      S.home = S.units.map(function (w) { return { w: w, x: w.x, y: w.y, facing: w.facing, hp: w.maxhp, slots: (w.slots || []).slice(), known: (w.known || []).slice(), weapon: w.weapon, attacks: w.attacks, speed: w.speed, baseAC: w.baseAC, size: w.size, drawScale: w.drawScale, sheet: w.sheet }; });
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
        w.ethereal = false; w.weapon = h.weapon; w.attacks = h.attacks; w.speed = h.speed; w.baseAC = h.baseAC; w.size = h.size; w.drawScale = h.drawScale; w.sheet = h.sheet; // (out of the Ethereal, Banishment, the Maze or the sphere; the rest as it first stood)
        delete w.corrodedAC; delete w.scaleEase; delete w.proneLook; delete w.proneT; delete w.helpedRound;
      });
      ['grounds', 'auras', 'wards', 'spirits', 'darks', 'webs', 'zones', 'beads', 'walls', 'shells'].forEach(function (k) { if (B[k]) B[k] = []; }); B.wallMap = null; B.overgrown = null;
      B.lights = (B.lights || []).filter(function (l) { return l.kind === 'map'; });
      B.lightMap = null;
      D.grid.setup(D.grid.map, B.units);
    }
    // the card: the spell's name, what the 8-bit game says of it (where it says anything), the rules line the ring shows, the keys.
    // B.card does not wrap a line, so the description and the rules line are wrapped here, at a width that leaves the card inside the screen
    function header(id, sp, e, u, st) {
      var wrapAt = 440, rules = '';
      try { rules = e ? D.magic.summary(e, u) : ''; } catch (x) { rules = ''; }
      var lines = ['{y}' + (S.i + 1) + ' / ' + S.ids.length + '   ' + sp.name.toUpperCase() + '{/}' + (sp.level ? '  (level ' + sp.level + ')' : '  (cantrip)')];
      // the creature types they name show as their glyphs (Griz, 09-29), and "(inspect)" once after both when any is named
      var desc = D.typeText(sp.desc || '', true); rules = D.typeText(rules, true);
      if (/\{:/.test(desc + rules)) { if (rules) rules += ' (inspect)'; else desc += ' {g}(inspect){/}'; }
      if (desc) lines = lines.concat(D.wrap(desc, wrapAt));
      if (rules) lines = lines.concat(D.wrap(rules, wrapAt).map(function (l) { return '{g}' + l + '{/}'; }));
      if (st && st.tip) lines = lines.concat(D.wrap('TIP: ' + st.tip, wrapAt).map(function (l) { return '{c}' + l + '{/}'; })); // (what a new player takes from it: how to aim it)
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
    function cx0() { return Math.floor(D.grid.map.w / 2); }
    function cy0() { return Math.floor(D.grid.map.h / 2) + 3; }
    // a stage (D16.SPELLSTAGE[id], deep16/data/stages/<class>.js): a spell shown the way it is meant to be used.
    //   foes:  [{ word: 'fighter:3' | kind: 'wolf', at: [dx, dy], hp, abil: { wis: 8 }, conds: { prone: true }, normie: false }] -- dx east, dy NORTH of the
    //          party's centre square; replaces the three fighters for this spell. A `fighter:N` word is made a normie (every score 8, 100 hp) unless it
    //          says `normie: false`; a bestiary `kind` keeps its own sheet unless `hp` / `abil` say otherwise. Left off, the three normie fighters stand
    //   mate:  { hp: 'full' | n, at: [dx, dy], conds: {} } -- the friend (hurt to a third by default, for a heal; `hp: 'full'` for a ward)
    //   target(c, e) -> a unit, { x, y } or { units: [...] }: the aim; pre(c, t, e) / after(c, t, e): generators run before and after the cast
    //   slot: the slot to cast at; tip: a line or two on the card -- how to use the spell
    // c = { B, S, D, id, u (the caster), mate, pals, foes, cx, cy }; reset() sweeps everything between spells
    function* applyStage(c, st) {
      if (st.foes) {
        var P = S.units.filter(function (w) { return w.side === 'party'; }), fs = st.foes.map(function (f, i) {
          var w = f.kind ? B.makeFoe({ id: 'gs' + i + '-' + f.kind, kind: f.kind }) : D.npc.build(f.word, null, 'foe', { id: 'gs' + i + '-' + String(f.word).split(':')[0] });
          if (!w) throw new Error('stage ' + c.id + ': no foe for ' + (f.kind || f.word));
          if (!f.kind && f.normie !== false && !/[?&]raw/.test(q)) normie(w);
          if (f.abil) Object.keys(f.abil).forEach(function (k) { w.abil[k] = f.abil[k]; if (w.saves && !f.keepSaves) w.saves[k] = D.mod(f.abil[k]); });
          if (f.hp) { w.maxhp = w.hp = f.hp; }
          var at = f.at || [i, 4];
          w.x = c.cx + at[0]; w.y = c.cy - at[1]; w.facing = 0; w.anim = 'idle'; w.animT = B.t; w.flash = 0; w.reaction = 1; w.conds = Object.assign({}, f.conds || {}); w.dead = false; w.ko = false;
          return w;
        });
        B.units = P.concat(fs); c.foes = fs; D.grid.setup(D.grid.map, B.units);
      }
      if (st.mate) {
        var m = c.mate, ms = st.mate;
        if (ms.at) { m.x = c.cx + ms.at[0]; m.y = c.cy - ms.at[1]; }
        if (ms.hp === 'full') m.hp = m.maxhp; else if (typeof ms.hp === 'number') m.hp = ms.hp;
        if (ms.conds) Object.assign(m.conds, ms.conds);
        D.grid.setup(D.grid.map, B.units);
      }
    }
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
        var st = (D.SPELLSTAGE || {})[id] || null, c = { B: B, S: S, D: D, id: id, u: u, mate: mate, pals: pals, foes: foes, cx: cx0(), cy: cy0() };
        if (st) { yield* applyStage(c, st); foes = c.foes; }
        var e = D.magic.list(B, u).filter(function (x) { return x.id === id; })[0];
        header(id, sp, e, u, st);
        if (!e || !e.ok) { B.card(['{r}' + sp.name + ': not castable here (' + (e ? e.why : 'no entry') + '){/}'], 1e9, 'gallery-why'); }
        else {
          var ev = (D.magic.EFFECT[id] && D.magic.EFFECT[id].ai) || D.tactics.EVAL[id] || D.tactics.EVAL['shape:' + e.g.shape], t = null;
          var pick = null; try { pick = ev ? ev(B, u, e, e.slot, D.tactics.foesOf(B, u), D.tactics.alliesOf(B, u)) : null; } catch (x) { pick = null; }
          t = pick && pick.t;
          // &keep, the same spell again: at the same creature as the last cast (a second Enlarge on the one already enlarged), whatever the weighing says now
          if (keep && S.last && S.last.id === id && S.last.t && S.last.t.conds && S.last.t.hp > 0) t = S.last.t;
          if (!t) t = e.g.shape === 'self' ? u : /touch|allies/.test(e.g.shape) || e.g.side === 'ally' ? (e.g.shape === 'allies' ? { units: [u].concat(pals, [mate]) } : (D.grid.dist(u, mate) <= 5 ? mate : u))
            : /sphere|cube|cone|line|wave|teleport/.test(e.g.shape) ? { x: foes[0].x, y: foes[0].y } : /rays|darts/.test(e.g.shape) ? { units: [foes[0], foes[1], foes[0]].slice(0, e.g.n || 3) } : foes[0];
          if (st && st.target) t = st.target(c, e) || t; // (the stage's own aim: the creature, the square, the spell's whole point)
          S.last = { id: id, t: t };
          var f0 = t.units ? t.units[0] : t;
          if (f0 && f0.x != null) { var mx = Math.round((u.x + f0.x) / 2), my = Math.round((u.y + f0.y) / 2); D.iso.lookAt(mx, my, D.grid.map.gz(mx, my)); }
          yield 20;
          if (st && st.pre) yield* st.pre(c, t, e); // (what the scene needs first: a foe struck, a wall raised, a friend's blessing)
          yield* B.exec(u, { do: 'cast', id: id, slot: st && st.slot ? st.slot : e.slot, target: t });
          if (st && st.after) { yield 30; yield* st.after(c, t, e); } // (and what follows: the blow that lands on the sleeper)
        }
        yield 50;
        var v = S.auto ? 1 : yield { gallery: true };
        S.i = ((S.i + (v == null ? 1 : v)) % S.ids.length + S.ids.length) % S.ids.length;
      }
    }
    return B;
  };

  // ==================================================================== the feature gallery (?fxgallery&features)
  // The feature walk (09-30; Griz, on whether the new spell-like effects go into the spell gallery: "4 separate"): the class features
  // get a gallery of their own beside the spells', the same stage and the same keys. Every feature in the register (data/features.js,
  // D16.FEATURES), one at a time, by class and then level: the class NPC built at the feature's level on the party side, a hurt friend
  // beside it, a foe (or the dead, for a turning) across the floor, and the feature fired through the battle's own exec -- what the ring
  // fires (B.commands says whether the button is there and ok; a button that is not shows why, in red). A prompt the feature asks is
  // answered with its first option. A feature that is always on, or the class AI's alone, is its card; and where a short
  // demonstration is cheap (a blow for a Divine Smite, a fireball at a monk for Evasion, a blow at a rogue for Uncanny Dodge) it is
  // shown. The card is the feature's name, its class and level, and its words. &feature=<id> starts at one; &only=a,b,c keeps to
  // those; &auto goes on by itself. The register absent (index.html not yet loading data/features.js): a card that says so.
  var CLASS_ORDER = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
  var KIND_TAG = { button: 'a ring button', passive: 'always on', ai: 'the class AI uses it (no button)' };
  // the stage a feature asks of the floor (all optional). foe: rows north of the hero (default 1, beside; 0 none); skel: skeletons where
  // the foes would stand (a turning wants the dead); mate: 'hurt' (default), 'flank' (beside the foe), 'whole', or null (none);
  // lvl: the hero built at this level for the demonstration; wiz: a wizard across the floor, to cast at the hero; hurt: the hero hurt
  // to half; foeHurt: the foe already hurt
  var STAGE = {
    sneakattack: { mate: 'flank' },
    colossusslayer: { foe: 3, foeHurt: 1 }, fightingstyle_archery: { foe: 3 }, extraattack_ranger: { foe: 3 },
    turnundead: { skel: 2 }, turntheunholy: { skel: 2 }, destroyundead: { skel: 2 },
    deflectmissiles: { foe: 4, mate: null }, uncannydodge: { mate: null }, firstblood: { mate: null }, answerback: { mate: null }, rimedoubles: { mate: null },
    evasion_monk: { foe: 0, mate: null, wiz: 1 }, evasion_rogue: { foe: 0, mate: null, wiz: 1 },
    sculptspells: { foe: 3, mate: 'flank', lvl: 5 }, potentcantrip: { foe: 3, mate: null }, elementalaffinity: { foe: 2 }, rimestep: { foe: 3 },
    quickenedspell: { foe: 3 }, twinnedspell: { foe: 3 }, carefulspell: { foe: 2, mate: 'flank' }, heightenedspell: { foe: 2 },
    secondwind: { hurt: 1 }, wholenessofbody: { hurt: 1 }, blessedhealer: { hurt: 1 },
    hide: { foe: 3, nfoe: 1, mate: 'between' }, supremesneak: { foe: 3, nfoe: 1, mate: 'between' }, cunningaction: { foe: 3, nfoe: 1, mate: 'between' },
    steelwill: { foe: 0, mate: null, wiz: 1 }, mindlessrage: { foe: 0, mate: null, wiz: 1 },
    auraofprotection: { foe: 0, mate: 'whole', wiz: 1 }, auraofdevotion: { foe: 0, mate: 'whole', wiz: 1 }, wakeful: { foe: 0, mate: 'whole', wiz: 1 },
    darkonesblessing: { foe: 3, foeHurt: 1 }, agonizingblast: { foe: 3 }, repellingblast: { foe: 3 }
  };
  // what the hero is built from beyond its class and level (js/classes.js NPC.spec); the register's subclass is added
  var SPEC = {
    pitfists: { equip: { weapon: 'unarmed' }, alt: null },
    carefulspell: { metamagic: ['careful', 'heightened'] }, heightenedspell: { metamagic: ['careful', 'heightened'] },
    // (the ranger's kit weapon, js/classes.js, is 'longbow', which content/items.json does not have -- a ranger built as it stands swings Fists; the gallery gives it the shortbow)
    fightingstyle_archery: { equip: { weapon: 'shortbow' } }, colossusslayer: { equip: { weapon: 'shortbow' } }, extraattack_ranger: { equip: { weapon: 'shortbow' } },
    escapethehorde: { hunterDefense: 'horde', equip: { weapon: 'shortbow' } }, multiattackdefense: { hunterDefense: 'multiattack', equip: { weapon: 'shortbow' } }, steelwill: { hunterDefense: 'steelwill', equip: { weapon: 'shortbow' } },
    pactoftheblade: { pact: 'blade' }, mirrorseye: { patron: 'mirror' }, fiendishvigor: { invocations: ['agonizing', 'fiendishvigor'] }
  };

  D.fxFeatures = function (q) {
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var only = get('only'), auto = /[?&]auto\b/.test(q), FEAT = D.FEATURES || null;
    var ids = FEAT ? Object.keys(FEAT).sort(function (a, b) {
      var A = FEAT[a], Bq = FEAT[b];
      return (CLASS_ORDER.indexOf(A.cls) - CLASS_ORDER.indexOf(Bq.cls)) || (A.lvl - Bq.lvl) || ((A.sub || '') < (Bq.sub || '') ? -1 : (A.sub || '') > (Bq.sub || '') ? 1 : 0) || (A.name < Bq.name ? -1 : A.name > Bq.name ? 1 : 0) || (a < b ? -1 : 1);
    }) : [];
    if (only) ids = only.split(',').filter(function (id) { return ids.indexOf(id) >= 0; });
    var start = Math.max(0, ids.indexOf(get('feature') || ''));
    var B = new D.Battle({ gallery: true, npc: { party: ['fighter:9'], foes: ['fighter:9'] },
      fightDef: D.classFight(9, { what: 'the feature gallery', intro: 'Every class feature on the grid, one after another.' }) });
    var S = B.gallery = { features: true, i: start, ids: ids, auto: auto, report: {}, card: null };
    var enter0 = B.enter, cx = 0, cy = 0;
    B.enter = function () {
      enter0.apply(this, arguments);
      cx = Math.floor(D.grid.map.w / 2); cy = Math.floor(D.grid.map.h / 2) + 3;
      B.req = null;
      B.co = loop();
    };

    // ---- the stage
    function place(w, x, y, facing) { w.x = x; w.y = y; w.facing = facing; w.anim = 'idle'; w.animT = B.t; w.flash = 0; w.reaction = 1; w.conds = w.conds || {}; w.dead = false; w.ko = false; return w; }
    function make(word, side, id, x, y, facing) {
      var w = word === 'skeleton' ? B.makeFoe({ id: id, kind: 'skeleton', at: [x, y] }) : D.npc.build(word, null, side, { id: id });
      if (!w) throw new Error('no unit for ' + word);
      return place(w, x, y, facing);
    }
    function stage(id, f) {
      var st = STAGE[id] || {}, spec = { cls: f.cls, lvl: st.lvl || f.lvl, race: 'human' };
      if (f.sub && f.sub !== 'The Mirror') spec.subclass = f.sub;
      if (f.cls === 'warlock') spec.pact = 'tome';
      Object.assign(spec, SPEC[id] || {});
      var rows = st.foe == null ? 1 : st.foe, hero = place(D.npc.build(spec, spec.lvl, 'party', { id: 'g-hero' }), cx, cy, 4);
      var units = [], foes = [], skel = [], mate = null, wiz = null;
      if (st.mate !== null) {
        mate = st.mate === 'between' ? make('fighter:5', 'party', 'g-mate', cx, cy - 1, 4) // (a body in the way: cover, for a rogue who would hide)
          : make('fighter:5', 'party', 'g-mate', cx - 1, st.mate === 'flank' ? cy - Math.max(1, rows) : cy, 4);
        if (st.mate !== 'whole') mate.hp = Math.max(1, Math.floor(mate.maxhp / 3)); // (a heal wants someone hurt)
        units.push(mate);
      }
      units.push(hero);
      if (st.skel) { for (var s = 0; s < st.skel; s++) { var sk = make('skeleton', 'foe', 'g-sk' + s, cx + s, cy - 3, 0); skel.push(sk); units.push(sk); } }
      else if (rows > 0) {
        // (the foes are soft, AC 10: a demonstration should land its blow, not miss it four times running)
        for (var k = 0; k < (st.nfoe || 2); k++) { var fo = make('fighter:9', 'foe', 'g-foe' + k, cx + k, cy - rows, 0); fo.baseAC = 10; if (!/[?&]raw/.test(q)) normie(fo); if (st.foeHurt) fo.hp = fo.maxhp - 6; foes.push(fo); units.push(fo); }
      }
      if (st.wiz) { wiz = make('wizard:9', 'foe', 'g-wiz', cx, cy - 5, 0); units.push(wiz); }
      if (st.hurt) hero.hp = Math.max(1, Math.floor(hero.maxhp / 2));
      B.units = units; D.grid.setup(D.grid.map, B.units);
      ['grounds', 'auras', 'wards', 'spirits', 'darks', 'webs', 'zones', 'beads', 'walls', 'shells'].forEach(function (k2) { if (B[k2]) B[k2] = []; }); B.wallMap = null; B.overgrown = null;
      B.lights = (B.lights || []).filter(function (l) { return l.kind === 'map'; }); B.lightMap = null;
      // (a bow needs its arrows in the pack; the pack is the fixture's)
      if (hero.weapon && hero.weapon.ammo && !B.inv.some(function (x) { return x.id === hero.weapon.ammo; })) B.inv.push({ id: hero.weapon.ammo, n: 99 });
      B.round = 1; B.active = hero; D.rules.startTurn(hero);
      var tg = foes[0] || skel[0] || wiz || mate, mx = Math.round((hero.x + tg.x) / 2), my = Math.round((hero.y + tg.y) / 2);
      D.iso.lookAt(mx, my, D.grid.map.gz(mx, my));
      return { id: id, f: f, st: st, hero: hero, mate: mate, foes: foes, skel: skel, wiz: wiz };
    }

    // ---- the card: the feature's name, its class and level, its words (B.card does not wrap a line: wrapped here, as the spell mode's)
    function header(id, f) {
      var desc = D.typeText(f.words, true), lines = ['{y}' + (S.i + 1) + ' / ' + S.ids.length + '   ' + f.name.toUpperCase() + '{/}  (' + f.cls + ' ' + f.lvl + (f.sub ? ', ' + f.sub : '') + ')'];
      if (/\{:/.test(desc)) desc += ' {g}(inspect){/}';
      lines = lines.concat(D.wrap(desc, 440));
      lines.push('{g}' + KIND_TAG[f.kind] + (/\bours\b|our own/i.test(f.src || '') ? ' · ours' : '') + '{/}');
      lines.push('{g}left/right the next · up/down ten · E again{/}');
      B.clearCards(); S.card = null;
      B.card(lines, 1e9, 'gallery'); S.card = B.cards[B.cards.length - 1];
    }
    var card0 = B.card;
    B.card = function () {
      var r = card0.apply(this, arguments), g = S.card;
      if (g && this.cards.indexOf(g) < 0) { this.cards.unshift(g); while (this.cards.length > 3) this.cards.splice(1, 1); }
      return r;
    };

    // ---- firing: a feature's generator run inside this one, any prompt it asks answered with its first option
    function* fire(gen) {
      var v;
      for (;;) {
        var r = gen.next(v); v = undefined;
        if (r.done) return r.value;
        var y = r.value;
        if (y && y.prompt) { v = y.prompt.opts[0].value; continue; }
        v = yield y;
      }
    }
    // a swing at t (the first on the turn as it stands when keep, a fresh turn else), again up to tries times till it lands
    function* swing(c, t, tries, keep) {
      var u = c.hero; t = t || c.foes[0] || c.skel[0]; if (!t) return false;
      for (var i = 0; i < (tries || 3); i++) {
        if (i || !keep) D.rules.startTurn(u);
        B.active = u;
        var hp0 = t.hp + (t.temp || 0);
        yield* fire(B.exec(u, { do: 'attack', target: t }));
        if (t.dead || t.hp + (t.temp || 0) < hp0) return true;
        yield 14;
      }
      return false;
    }
    function* twice(c) { // (Extra Attack: two swings on the one action)
      var u = c.hero, t = c.foes[0] || c.skel[0]; D.rules.startTurn(u); B.active = u;
      yield* fire(B.exec(u, { do: 'attack', target: t })); yield 14;
      yield* fire(B.exec(u, { do: 'attack', target: t }));
    }
    // a foe swings at the hero (its blow made sure to land unless o.atk says otherwise; the hero made whole between) until o.until says done
    function* foeStrike(c, tries, o) {
      var u = c.hero, foe = c.foes[0]; if (!foe) return;
      for (var i = 0; i < tries; i++) {
        D.rules.startTurn(foe); B.active = foe; u.hp = u.maxhp; u.reaction = 1;
        var wp = Object.assign({}, o.ranged ? foe.alt : foe.weapon, { atk: o.atk != null ? o.atk : 40 });
        yield* fire(B.attack(foe, u, wp));
        if (o.until(c)) break;
        yield 14;
      }
      B.active = u;
    }
    // the spell picks its target the way the spell mode does (the AI's weighing, else a plain one for its shape)
    function autoTarget(c, e) {
      var u = c.hero, foes = c.foes.concat(c.skel), ev = (D.magic.EFFECT[e.id] && D.magic.EFFECT[e.id].ai) || D.tactics.EVAL[e.id] || D.tactics.EVAL['shape:' + e.g.shape], pick = null;
      try { pick = ev ? ev(B, u, e, e.slot, D.tactics.foesOf(B, u), D.tactics.alliesOf(B, u)) : null; } catch (x) { pick = null; }
      if (pick && pick.t) return pick.t;
      return e.g.shape === 'self' ? u : /touch|allies/.test(e.g.shape) || e.g.side === 'ally' ? (e.g.shape === 'allies' ? { units: [u].concat(c.mate ? [c.mate] : []) } : (c.mate && D.grid.dist(u, c.mate) <= 5 ? c.mate : u))
        : /sphere|cube|cone|line|wave|teleport/.test(e.g.shape) ? { x: foes[0].x, y: foes[0].y } : /rays|darts/.test(e.g.shape) ? { units: [foes[0], foes[1] || foes[0], foes[0]].slice(0, e.g.n || 3) } : foes[0];
    }
    function* castOne(c, id, target) {
      var u = c.hero;
      if ((u.known || []).indexOf(id) < 0) u.known = (u.known || []).concat([id]);
      var e = D.magic.list(B, u).filter(function (x) { return x.id === id; })[0];
      if (!e || !e.ok) { B.card(['{r}' + id + ': not castable here (' + (e ? e.why : 'no entry') + '){/}'], 300); return; }
      yield* fire(B.exec(u, { do: 'cast', id: id, slot: e.slot, target: target || autoTarget(c, e) }));
    }

    // ---- a button: what must be so before the ring offers it (PRE), who it is aimed at (AIM), and what follows to show it working (THEN)
    var PRE = {
      surge: function* (c) { yield* swing(c, null, 1, true); c.hero.turn.action = 0; c.hero.turn.attacksLeft = 0; }, // (Action Surge is after the action)
      flurry: function* (c) { yield* swing(c, null, 1, true); },                                                    // (after the Attack action)
      unshape: function* (c) { yield* D.features.wildShape(B, c.hero, 'wolf'); }                                    // (a shape to come out of)
    };
    var AIM = { lay: function (c) { return c.mate || c.hero; } };
    var THEN = {
      rage: function* (c) { yield* swing(c, null, 3, true); }, reckless: function* (c) { yield* swing(c, null, 1, true); }, sacred: function* (c) { yield* swing(c, null, 3, false); },
      'meta-quickened': function* (c) { yield* castOne(c, 'magicmissile'); },
      'meta-twinned': function* (c) { if (c.hero.turn.meta && c.foes[1]) c.hero.turn.meta.t2 = c.foes[1]; yield* castOne(c, 'firebolt', c.foes[0]); },
      'meta-careful': function* (c) { yield* castOne(c, 'burninghands', { x: c.foes[0].x, y: c.foes[0].y }); },
      'meta-heightened': function* (c) { yield* castOne(c, 'burninghands', { x: c.foes[0].x, y: c.foes[0].y }); }
    };
    // ---- a feature that is always on: the short demonstration, where one is cheap
    // (the wizard across the floor casts at the hero: a fireball for Evasion and Danger Sense, a Fear for Steel Will, a Charm Person for the Aura of Devotion ...)
    function wizCast(id) { return function* (c) {
      var w = c.wiz; if (!w) return;
      w.known = [id]; w.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; w.slotsMax = w.slots.slice(); B.active = w; D.rules.startTurn(w);
      var e = D.magic.list(B, w).filter(function (x) { return x.id === id; })[0];
      if (!e || !e.ok) { B.card(['{r}' + id + ': not castable here (' + (e ? e.why : 'no entry') + '){/}'], 300); return; }
      yield* fire(B.exec(w, { do: 'cast', id: id, slot: e.slot, target: /sphere|cube|cone|line|wave/.test(e.g.shape) ? { x: c.hero.x, y: c.hero.y } : c.hero }));
      B.active = c.hero;
    }; }
    var evasion = wizCast('fireball');
    function struck(c) { return c.hero.hp < c.hero.maxhp || c.hero.reaction === 0; }
    function swings(n) { return function* (c) { yield* swing(c, null, n); }; }
    // a spell at the foe, again on a fresh turn till it has hurt it (a bolt can miss)
    function* castTry(c, id, tries) {
      var t = c.foes[0];
      for (var i = 0; i < (tries || 3); i++) {
        if (i) { D.rules.startTurn(c.hero); B.active = c.hero; }
        var hp0 = t.hp + (t.temp || 0);
        yield* castOne(c, id, t);
        if (t.dead || t.hp + (t.temp || 0) < hp0) return true;
        yield 14;
      }
      return false;
    }
    var DEMO = {
      sneakattack: swings(6), fightingstyle_gwf: swings(2), fightingstyle_archery: swings(5), colossusslayer: swings(5), pitfists: swings(5),
      divinesmite: swings(5), stunningstrike: swings(5), divinestrike_life: swings(6), divinestrike_window: swings(6), divinestrike_vigil: swings(6),
      extraattack_barbarian: twice, extraattack_fighter: twice, extraattack_monk: twice, extraattack_paladin: twice, extraattack_ranger: twice,
      openhandtechnique: function* (c) { // (a flurry after a swing, again till the foe is down on the floor)
        var t = c.foes[0];
        for (var i = 0; i < 3 && !t.conds.prone; i++) { yield* swing(c, t, 1, false); yield* fire(B.exec(c.hero, { do: 'flurry' })); yield 14; }
      },
      downinthesand: function* (c) { yield* fire(B.exec(c.hero, { do: 'rage' })); yield* swing(c, null, 4, true); },
      firstblood: function* (c) { yield* foeStrike(c, 4, { until: function (k) { return !!k.hero.conds.raging; } }); },
      answerback: function* (c) { yield* fire(B.exec(c.hero, { do: 'rage' })); yield* foeStrike(c, 4, { atk: -20, until: function (k) { return k.hero.reaction === 0; } }); },
      uncannydodge: function* (c) { yield* foeStrike(c, 5, { until: struck }); },
      deflectmissiles: function* (c) { yield* foeStrike(c, 5, { ranged: true, until: struck }); },
      rimedoubles: function* (c) { c.hero.images = 3; yield* foeStrike(c, 6, { atk: 40, until: function (k) { return !!(k.foes[0].conds.frosted); } }); },
      evasion_monk: evasion, evasion_rogue: evasion,
      destroyundead: function* (c) { yield* fire(B.exec(c.hero, { do: 'turnundead' })); },
      discipleoflife: function* (c) { yield* castOne(c, 'curewounds', c.mate); },
      blessedhealer: function* (c) { yield* castOne(c, 'curewounds', c.mate); },
      elementalaffinity: function* (c) { yield* castOne(c, 'burninghands', { x: c.foes[0].x, y: c.foes[0].y }); }, // (a cantrip's attack roll carries no affinity: a spell the target saves against does)
      sculptspells: function* (c) { yield* castOne(c, 'fireball', { x: c.foes[0].x, y: c.foes[0].y }); },
      potentcantrip: function* (c) { yield* castOne(c, 'acidsplash', c.foes[0]); },
      rimestep: function* (c) { yield* castOne(c, 'mirrorimage', c.hero); },
      auraofprotection: evasion,
      steelwill: wizCast('fear'), auraofdevotion: wizCast('charmperson'), wakeful: wizCast('sleep'),
      mindlessrage: function* (c) { yield* fire(B.exec(c.hero, { do: 'rage' })); yield* wizCast('fear')(c); },
      supremesneak: function* (c) { yield* fire(B.exec(c.hero, { do: 'hide' })); },
      darkonesblessing: function* (c) { c.foes[0].hp = 1; yield* castTry(c, 'eldritchblast', 5); },
      agonizingblast: function* (c) { yield* castTry(c, 'eldritchblast', 5); }, repellingblast: function* (c) { yield* castTry(c, 'eldritchblast', 5); },
      pactofthetome: function* (c) { yield* castTry(c, 'sacredflame', 3); },
      pactoftheblade: swings(5)
    };

    function* run(c) {
      var f = c.f, u = c.hero, n0 = (B.logEntries || []).length, pre = (B.logEntries || []).slice(), how = 'card', why = '';
      if (f.kind === 'button' && f.cmd) {
        var cmds = f.cmd.split(/\s+/).filter(Boolean), fired = 0;
        for (var k = 0; k < cmds.length && !why; k++) {
          var id = cmds[k];
          if (k) { D.rules.startTurn(u); B.active = u; }
          if (PRE[id]) yield* fire(PRE[id](c));
          var e = B.commands(u).filter(function (x) { return x.id === id; })[0];
          if (!e || !e.ok) { why = id + ': ' + (e ? (e.why || 'not now') : 'no such button'); break; }
          var cmd = { do: id }; if (AIM[id]) cmd.target = AIM[id](c);
          yield 20;
          yield* fire(B.exec(u, cmd)); fired++;
          if (THEN[id]) yield* fire(THEN[id](c));
          yield 30;
        }
        how = why ? 'blocked: ' + why : 'fired';
        if (why) B.card(['{r}' + f.name + ': not usable here (' + why + '){/}'], 1e9, 'gallery-why');
      } else if (DEMO[c.id]) { yield 20; yield* fire(DEMO[c.id](c)); how = 'demo'; }
      S.report[c.id] = { how: how, cards: (B.logEntries || []).length - n0, tail: (B.logEntries || []).filter(function (e) { return pre.indexOf(e) < 0; }).map(function (e) { return e.text; }).slice(-24) }; // (the bench reads it: dev/bench16.js mode=featurewalk)
    }

    function* loop() {
      for (;;) {
        var id = S.ids[S.i], f = FEAT && id ? FEAT[id] : null;
        B.clearCards(); S.card = null;
        if (!f) {
          B.card(['{r}The feature register is not loaded.{/}', 'deep16/index.html wants  <script src="data/features.js">  after data/summons.js.'], 1e9, 'gallery'); S.card = B.cards[B.cards.length - 1];
        } else {
          try { var c = stage(id, f); header(id, f); yield 20; yield* run(c); }
          catch (err) {
            S.report[id] = { how: 'error: ' + String(err && err.stack || err).slice(0, 400), cards: 0 };
            B.card(['{r}' + f.name + ': something broke (' + String(err && err.message || err).slice(0, 90) + '){/}'], 1e9, 'gallery-why');
          }
        }
        yield 50;
        var v = S.auto ? 1 : yield { gallery: true };
        if (S.ids.length) S.i = ((S.i + (v == null ? 1 : v)) % S.ids.length + S.ids.length) % S.ids.length;
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
