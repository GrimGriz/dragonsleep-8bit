/* DEEP16 — the Monster Party Game Show's supplies (10-07; the lane: they live\handoff-2026-10-07-the-monster-party-game-show.md, seat 3 -- §3 C). What the
   audience sends down, tier by tier, into the chest by the lamp. The items are the game's own (content/items.json: the tier 2 weapons and armour, the tier 3
   and 4 pieces, the epic amulets), worn by the item machinery (js/rules.js R.gear, attunement); this file is the show's hand on them: the lantern's buttons,
   the roll-offs, the score, the chest, the bed, and the few rules the items need on the grid.

   His words, the ones that bind it (10-07): "Me clicking on the lantern opens a wheel with 4 tiers of items/equip" · "the wheel I get from the lamp is buttons,
   I click the button based on chat activity (member activity/dono amounts)" · "Whenever a package magic item is to be determined, characters that have not
   already received them will have a d20 roll off (no stat bonuses) - highest wins. Solo Nat 20 is +3 to next roll off. Pair of Nat 20 (or more) grants nat20
   roller next item for them (if they have the weapon already, the nat20 gets them the item (not package) from the next tier up" · "Tier 1 is 0.1, Tier 2 is 3,
   Tier 3 is 12, and tier 4 is 20. When that score = 100, pop-up announce epic amulet (ring slot) awarded - check the (chest/barrel)!" · and his picks, RULED
   (dragonsleep-8bit\deep16-gameshow-supplies.md "Your picks"): "Tier 1 - roll 1d4 and add one of them, unless Goose is <10 ammo, then ammo goes in chest /
   Tier 2 - 2c, 2e, 2g - add small rule, 2j - beholda 'Janny Jerkin' / Tier 3 - one item unless the rolloff has more than one nat 20 - all items approved /
   Tier 4 - Roll off, one item unless more than one nat 20 / 23a +4 / 23b - check pyro's handaxe code (comes back next round) / 23c +4 / 24b - each hero diff
   resist, choose wisely (check gameshow benches?) / 24c - cures poison start of turn, no shove modifier"; "3 - it can, ammo button will get pressed often
   enough" (the sling runs dry); "4 - yes, they'll have to choose if enough support comes in" (attunement, three bonds); "one by roll off (with roll of 20
   bonus - could be all 4 with a yahtzee, usually 1)" (tier 2's armour); "Yes" (tier 3's and 4's armour add their plus to the armour worn).

   THE FLOW. His click on the lantern (the tower's lamp, or its square -- or the LAMP box in the corner, there whenever the tower is off the screen) opens four
   buttons, one a supply tier; his click on one sends it: tier 1 one thing by a
   d4 (the sling bullets whenever Goose has under 10), tier 2 the package (three Greater Potions and a Bat-Wing Pie, and a roll-off each for a +1 weapon and
   an armour), tiers 3 and 4 one item by a roll-off (each natural 20 of two or more its own). It lands in the chest (D.circles.chest 'thump'); the score
   goes up, and at every 100 the epic amulet pops. After a wave the token stands by the lamp for his turn with chat (js/waves.js afterWave, the mode
   'lamp': the buttons work there too, and TO THE BED with chat's supplies still in the chest asks first, as END on an idle turn does); at the chest
   (afterWave calls GS.supplies with ctx.at 'chest'):
   what is in it is handed out -- the potions and the bullets to the pack, each piece onto its winner, his pick where a Mascot must choose (a second cloak,
   a third ring, a fourth bond) -- and the armour waits for the bed: it goes on at the rest, never mid-fight (the Mascots are made again before they set
   out, their gear in the words WV.loot[key] that the long rest's rebuild reads too).

   THE SEAT'S READINGS (his to overrule; the lane's §3 C): who rolls is everyone who has not had the item (or, for tier 2's +1 weapon, any better weapon);
   a tie rolls again; a solo natural 20 is +3 on that Mascot's next roll-off, won or not; if no one is left to roll, all four roll and the winner takes
   an item of the next tier up (tier 4's: another of tier 4's). Tiers 3 and 4: the roll-off first, then a die picks the winner's item from the tier's pool,
   the ones that fit it and it has not had (23b is Denny's, 23c Rascal's, 23a the other three's). The plus laid over the armour is one piece at a time
   (a second is a choice). The epic amulet's winner by a roll-off too; until he picks 25a or 25b (SU.EPIC), the pop-up asks chat on his click. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, R = DS.R, G = D.grid, RU = D.rules, FX = D.fx, NPC = D.npc, MP = D.mpmon, F = D.features, IT = DS.DATA.items;
  var GS = D.gameshow, WV = GS && GS.wave; if (!GS || !WV || !MP || !NPC) return;
  var SU = GS.supply = {};
  var KEYS = ['denny', 'beholda', 'rascal', 'goose'];
  function W(n) { return (GS._ && GS._.W ? GS._.W(n) : n); }
  function P(r, i) { return D.PAL.ramps[r][i]; }
  function nm(id) { var it = IT[id]; return it ? it.name.replace(/\.$/, '') : id; }
  function many(id, n) { var s = nm(id); return n > 1 ? (/^Potion of/.test(s) ? s.replace(/^Potion/, 'Potions') : /(ch|sh|s)$/.test(s) ? s + (/s$/.test(s) ? '' : 'es') : s + 's') : s; }   // (3 Greater Potions, 3 Torches)
  function who(k) { return (MP.BUILDS[k] || {}).name || k; }

  // ------------------------------------------------------------------ the levers and the tiers
  SU.SCORE = { 1: 1, 2: 30, 3: 120, 4: 200 };       // the score in tenths (his 0.1 / 3 / 12 / 20)
  SU.EPIC_AT = 1000;                                  // an epic amulet at every 100
  SU.EPIC = null;                                     // his pick: 'virtuallyinvulnerable' (25a) or 'vnaamulet' (25b); null, chat picks at the pop-up
  SU.EPICS = ['virtuallyinvulnerable', 'vnaamulet'];
  SU.START_AMMO = 20; SU.LOW_AMMO = 10;               // Goose's pouch at the run's start (the SRD's twenty), and "under 10" (his)
  SU.SHOW_T = 480;                                    // how long a roll-off's panel stays up (frames; a click on it closes it)
  SU.TIER1 = [['slingbullets', 20], ['potion', 2], ['torch', 3], ['elixir', 1]];   // the d4: 1a sling bullets, 1b healing potions, 1c torches, 1d the elixir
  SU.TIER2 = { pack: [['greaterpotion', 3], ['batpie', 1]],
    weapon: { denny: 'playbuttonknuckles', beholda: 'loadeddice', rascal: 'flamewarclaw', goose: 'heartstringsling' },
    armour: { denny: 'doubledenim', beholda: 'jannyjerkin', rascal: 'thermidorplate', goose: 'pufferplate' } };
  SU.TIER3 = ['freshfit', 'rivetjob', 'gainsring', 'modcape', 'lagcloak'];
  SU.TIER4 = ['hardcarry', 'banhammer', 'hottake', 'sponsoredskin', 'boiledshell', 'dwarvendenim'];
  SU.FOR = { hardcarry: ['denny', 'beholda', 'goose'], banhammer: ['denny'], hottake: ['rascal'] };
  // the dice (a bench pins them)
  SU.d = function (n) { return D.d(n); };

  // an item of the pool for a Mascot: its own (hardcarry_denny, boiledshell_goose), or the one for all; null if it is not for that one
  function own(k, base) { if (SU.FOR[base] && SU.FOR[base].indexOf(k) < 0) return null; return IT[base + '_' + k] ? base + '_' + k : IT[base] ? base : null; }
  SU.own = own;
  // where it is worn, and how many of those a body has room for (two rings; one of the rest)
  function place(id) { var it = IT[id]; if (!it) return null; if (it.kind === 'worn') return it.place; return /^(weapon|armor|cloak|ring)$/.test(it.kind) ? it.kind : null; }
  var ROOM = { weapon: 1, armor: 1, over: 1, cloak: 1, neck: 1, ring: 2 };
  function plus(id) { var it = IT[id] || {}; return it.weapon ? it.weapon.bonus || 0 : it.over ? it.over.ac || 0 : 0; }
  function plain(id) { var it = IT[id]; return !!(it && it.kind === 'weapon' && !it.attune && !it.weapon.throw); }   // (a +N weapon and nothing else)
  SU.place = place;

  // ------------------------------------------------------------------ the gear on the sheet (attunement on, the armour, the Gains Ring)
  // the Mascots' class takes no armour and no weapon but its own (js/mpmon.js), so the show puts the armour on the sheet itself; attunement is switched on for
  // a Mascot that wears something (SRD 5.1: three bonds -- js/rules.js R.attune bonds what is worn, three at most); the Gains Ring adds its d4 to the stat it was
  // cut to (WV.gains[key], rolled when it came down), and a CON change is a hit-point change
  WV.gains = WV.gains || {};
  var sheet0 = MP.sheet;
  MP.sheet = function (spec) {
    var h = sheet0.apply(this, arguments), loot = (spec && spec.loot) || [];
    if (!loot.length) return h;
    loot.forEach(function (id) { var it = IT[id]; if (it && it.kind === 'armor') h.equip.armor = id; });
    h.attuned = []; R.attune(h);
    var g = WV.gains[h.build];
    if (g && R.wears(h, 'gainsring') && R.bonded(h, 'gainsring')) {
      var c0 = Math.floor((h.abil.con - 10) / 2);
      h.abil[g.ab] = (h.abil[g.ab] || 10) + g.n;
      var dc = Math.floor((h.abil.con - 10) / 2) - c0;
      if (dc) { h.maxhp += dc * h.lvl; h.hp = spec.hpLeft != null ? Math.max(0, Math.min(h.maxhp, spec.hpLeft)) : h.maxhp; }
    }
    h.gsLoot = loot.join('+');
    return h;
  };
  // the unit: what the grid reads off the worn things -- Rivet Job's no-crit, Dwarven Denim's poison, the VNA Amulet's aura, a weapon's spell bonus (2g, 23c),
  // and the Ban Hammer to throw
  function gearOf(h) { return h && h.equip ? R.gear(h) : []; }
  var unit0 = NPC.unit;
  NPC.unit = function (h, side, o) {
    var u = unit0.apply(this, arguments);
    if (!h || h.cls !== 'mpmon') return u;
    u.gsLoot = h.gsLoot || '';
    gearOf(h).forEach(function (g) {
      if (g.over && g.over.critProof) u.critProof = true;
      if (g.over && g.over.endsPoison) u.endsPoison = true;
      if (g.aura) u.gsAura = g.aura;
      if (g.weapon && g.weapon.spellAtk && u.spellAtk != null && h.equip.weapon === g.id) u.spellAtk += g.weapon.spellAtk;
    });
    if (h.equip.weapon === 'banhammer' && R.bonded(h, 'banhammer')) { u.banHammer = true; u.alt = throwOf(u); }
    return u;
  };
  // the Ban Hammer thrown (23b; SRD 5.1's Dwarven Thrower, a +3 warhammer thrown 20/60): one-handed, so the d8; back in his hand at the end of his next turn, the turn
  // he is without it (Pyro's handaxe, js/pyro.js -- his "comes back next round")
  function throwOf(u) { var w = u.weapon || {}; return { id: 'banhammer', name: 'Ban Hammer (thrown)', atk: w.atk, dice: '1d8', mod: w.mod, type: 'bludgeoning', props: ['thrown'], magic: true, ranged: true, thrown: true, range: [20, 60], fx: 'bolt', banThrow: true }; }
  function fistsOf(u) { var h = u.src; return D.save.weaponOf(Object.assign({}, h, { equip: Object.assign({}, h.equip, { weapon: 'monkeyfists' }) })); }
  SU.throwOf = throwOf;

  // ------------------------------------------------------------------ the rules on the grid
  // the VNA Amulet (25b): +2 to saves for the wearer and friends within 10 ft -- an aura of protection by its shape (js/rules.js RU.inAura)
  var auraOf0 = RU.auraOf;
  RU.auraOf = function (p) { var a = auraOf0.apply(this, arguments); if (a || !p || !p.gsAura || !G.standing(p)) return a; return { r: p.gsAura.r || 10, protect: p.gsAura.protect || 0 }; };
  // the start of a turn: Dwarven Denim works the poison out (24c), and Goose's sling as the pack has bullets
  var start0 = RU.startTurn;
  RU.startTurn = function (u) {
    var r = start0.apply(this, arguments);
    if (u && u.endsPoison && u.conds && u.hp > 0) {
      var c = u.conds, had = !!c.poisoned;
      Object.keys(c).forEach(function (k) { var v = c[k]; if (v && typeof v === 'object' && (v.linked === 'poisoned' || v.poison)) { delete c[k]; had = true; } });
      delete c.poisoned;
      if (had && D.battle) { D.battle.card(['{y}' + u.name + '{/}\'s Dwarven Denim: the poison works out.'], 200); FX.sparkle(u, 'moss', 10); }
    }
    if (u && u.mpmon === 'goose' && D.battle && SU.live(D.battle)) arm(D.battle, u);
    return r;
  };
  // THE SLING RUNS DRY (his "3 - it can"): in the show Goose's sling takes a bullet from the pack a shot (battle.js ammoLeft / spendAmmo); dry, his blow is the
  // empty sling swung (SRD 5.1: a ranged weapon in melee is an improvised weapon, 1d4, no proficiency), till the chest brings more
  function bonkOf(u) { var s = D.mod(u.abil.str); return { id: 'goosebonk', name: 'Empty Sling (a bonk)', atk: s, dice: '1d4', mod: s, type: 'bludgeoning', props: [], magic: false, ranged: false, range: null, fx: 'bolt', bonk: true }; }
  function arm(B, u) {
    if (!u || u.mpmon !== 'goose') return;
    var sl = u.slingW || u.weapon;
    if (!sl || sl.bonk) return;
    if (sl.id === 'goosesling' && !sl.ammo) sl.ammo = 'slingbullets';
    if (!sl.ammo) return;
    var left = B.ammoLeft({ weapon: sl });
    if (!left && !u.slingW) { u.slingW = sl; u.weapon = bonkOf(u); }
    else if (left && u.slingW) { u.weapon = u.slingW; delete u.slingW; }
  }
  SU.arm = arm;
  // a shot by the class AI (js/tactics.js swingAll calls B.attack itself; a player's ATTACK is battle.js exec's, which spends the bullet before it): the bullet
  // from the pack here; and the Ban Hammer thrown, out of his hand
  var Bp = D.Battle.prototype, attack0 = Bp.attack, exec0 = Bp.exec, hero0 = Bp.heroTurn;
  Bp.attack = function* (att, tgt, atk, o) {
    if (!SU.live(this) || !att || !att.mpmon || !atk) { yield* attack0.apply(this, arguments); return; }
    o = o || {};
    if (atk.banThrow && att.hammerOut != null) {                                                   // (the second swing of the Attack after the throw: the fists, if it is in reach)
      if (!tgt || G.dist(att, tgt) > G.reachOf(att)) return;
      atk = att.weapon;
    }
    if (atk.ammo && !att.gsExec && !o.ready && !o.oa) {
      if (!this.ammoLeft({ weapon: atk })) { this.card(['{o}' + att.name + ' has no ' + this.itemName(atk.ammo).toLowerCase() + ' left.{/}'], 120); return; }
      this.spendAmmo({ weapon: atk });
    }
    yield* attack0.call(this, att, tgt, atk, o);
    if (atk.banThrow) hammerOut(this, att);
    if (att.mpmon === 'goose') arm(this, att);
  };
  Bp.exec = function* (u, c) {
    if (!(c && c.do === 'attack' && u && u.mpmon)) return yield* exec0.apply(this, arguments);
    u.gsExec = true;
    try { return yield* exec0.apply(this, arguments); } finally { u.gsExec = false; }
  };
  function hammerOut(B, u) {
    u.hammerOut = B.round; u.hammerW = u.weapon && !u.weapon.banThrow && u.weapon.id === 'banhammer' ? u.weapon : u.hammerW;
    u.weapon = fistsOf(u); u.alt = null;
    B.card(['{g}The Ban Hammer is out of ' + u.name + '\'s hand till the end of the next turn.{/}'], 160);
  }
  function hammerBack(B, u, why) {
    if (u.hammerOut == null) return;
    var w = u.hammerW || D.save.weaponOf(u.src);
    delete u.hammerOut; delete u.hammerW; u.weapon = w; u.alt = throwOf(u);
    if (B && why !== 'quiet') B.card(['{g}The Ban Hammer comes back to ' + u.name + '\'s hand.{/}'], 160);
  }
  // the end of a turn: the hammer back at the end of the turn after the throw (B.round past the one it went in); and still in his hand as the turn ends
  function endTurn(B, u) {
    if (!SU.live(B) || !u || !u.banHammer) return;
    if (u.hammerOut != null && B.round > u.hammerOut && !u.dead) hammerBack(B, u);
    else if (u.hammerOut != null) { u.weapon = fistsOf(u); u.alt = null; }   // (js/tactics.js swingAll puts back the weapon it found; out is out)
  }
  Bp.heroTurn = function* (u) { yield* hero0.apply(this, arguments); endTurn(this, u); };
  if (D.tactics && D.tactics.AFTER) D.tactics.AFTER.push(function* (B, u) { endTurn(B, u); });   // (the class AI's turn's end -- not a wrap of D.ai.turn, whose own text a bench reads)
  // the ring's THROW for a player's Denny (the Mascots' buttons are js/features.js F.commands, wrapped as js/mpmon.js does): the Attack action's first blow, or
  // one of its blows; aimed as the specials are
  var cmd0 = F.commands, fexec0 = F.exec;
  F.commands = function (B, u) {
    var out = cmd0.apply(this, arguments);
    if (!SU.live(B) || !u || !u.banHammer || u.side !== 'party' || u.guest) return out;
    var T = u.turn || {}, can = T.attacksLeft > 0 || (T.action > 0 && !T.attacksLeft), t = u.alt || throwOf(u);
    var why = u.hammerOut != null ? 'the hammer is out (back at the end of your next turn)' : !can ? 'the action is spent' : '';
    out.push({ id: 'gs-throw', label: 'THROW THE BAN HAMMER', cost: 'A', icon: 'attack', skill: true, ok: !why, why: why,
      note: 'one of the Attack\'s blows: ' + RU.sign(t.atk) + ', 1d8' + RU.sign(t.mod) + ' bludgeoning, 20/60 ft; back in your hand at the end of your next turn',
      aim: { shape: 'single', side: 'foe', range: 60, see: true, kind: 'attack' }, aimText: 'a foe you see within 60 ft' });
    return out;
  };
  F.exec = function* (B, u, c) {
    if (!c || c.do !== 'gs-throw') { yield* fexec0.apply(this, arguments); return; }
    var T = u.turn, t = c.target;
    if (!u.banHammer || u.hammerOut != null || !t || !t.side || !G.hostile(u, t) || !G.standing(t) || G.dist(u, t) > 60 || !G.los(u, t).clear) { D.sfx('error'); B.card(['{o}The Ban Hammer: a foe you see within 60 ft.{/}'], 160); return; }
    if (!T.attacksLeft) { if (!T.action) return; T.action = 0; T.attackAction = true; T.attacksLeft = T.slowed ? 1 : u.attacks + (T.hasteAction ? 1 : 0); }
    T.attacksLeft--;
    B.card(['{y}' + u.name + '{/} throws the Ban Hammer.'], 160);
    yield* B.attack(u, t, u.alt || throwOf(u));
  };

  // ------------------------------------------------------------------ the run's state (B.su; GS.run.supplies for whoever reads the run)
  SU.live = function (B) { return !!(B && B.su && WV.B === B && GS.run); };
  function S0() { return { chest: [], stash: [], score10: 0, bonus: {}, ask: null, show: null, epic: [], open: false, sent: { 1: 0, 2: 0, 3: 0, 4: 0 }, lines: [], bed: [], amulets: 0 }; }
  // the run starts (js/waves.js GS.waves): the hooks on the battle once its own are on (its paint, its update), Goose's pouch, the sling on the bullets
  var waves0 = GS.waves;
  GS.waves = function* (B, GSx) {
    var co = waves0.apply(this, arguments), r = co.next();
    install(B);
    while (!r.done) { var v = yield r.value; r = co.next(v); }
    return r.value;
  };
  function install(B) {
    if (B.su) return;
    var S = B.su = S0(); if (GS.run) GS.run.supplies = S;
    S.auto = !!(GS.run && GS.run.auto);
    var inv = B.inv = B.inv || [], s = inv.filter(function (x) { return x.id === 'slingbullets'; })[0];
    if (!s) inv.push({ id: 'slingbullets', n: SU.START_AMMO });
    B.units.forEach(function (u) { if (u.mpmon === 'goose') arm(B, u); });
    var up0 = B.update, pt0 = B.paint;
    B.update = function () {
      var m = D.input.mouse;
      SU.tick(this);
      if (m.click && this.su && SU.click(this, m.x, m.y)) m.click = false;   // (a click on the show's own buttons goes no further: not the ring, not the show's queue)
      return up0.apply(this, arguments);
    };
    B.paint = function (ctx) { pt0.apply(this, arguments); SU.paint(ctx, this); };
  }
  SU.state = function (B) { return B && B.su; };

  // ------------------------------------------------------------------ what each Mascot has had (worn, waiting in the chest, or put by in it)
  function worn(k) { return (WV.loot[k] = WV.loot[k] || []); }
  function had(S, k) { return worn(k).concat(S.chest.filter(function (e) { return e.to === k; }).map(function (e) { return e.id; }), S.stash.filter(function (e) { return e.to === k; }).map(function (e) { return e.id; }), S.ask && S.ask.e.to === k ? [S.ask.e.id] : []); }
  function holds(S, k, id, better) {
    var all = had(S, k);
    if (all.indexOf(id) >= 0) return true;
    if (better && place(id) === 'weapon') return all.some(function (x) { return place(x) === 'weapon' && plus(x) >= plus(id); });   // (tier 2's +1: any weapon as good)
    return false;
  }
  SU.holds = holds;
  function poolFor(S, k, tier) { return (SU['TIER' + tier] || []).map(function (b) { return own(k, b); }).filter(function (id) { return id && !holds(S, k, id); }); }

  // ------------------------------------------------------------------ the roll-off: a d20 each, no bonuses (his) but a natural 20's +3 from the last one
  function rollOff(S, keys) {
    var rows = keys.map(function (k) { var d = SU.d(20), b = S.bonus[k] ? 3 : 0; delete S.bonus[k]; return { key: k, d: d, b: b, tot: d + b }; });
    var n20 = rows.filter(function (r) { return r.d === 20; }), win;
    if (n20.length >= 2) win = n20.map(function (r) { return r.key; });       // (two or more natural 20s: each of them has it)
    else {
      var tied = rows.filter(function (r) { return r.tot === Math.max.apply(null, rows.map(function (q) { return q.tot; })); }), again = [];
      for (var g = 0; tied.length > 1 && g < 20; g++) {                         // (a tie rolls again, the tied alone)
        tied.forEach(function (r) { r.re = SU.d(20); }); again.push(tied.map(function (r) { return who(r.key) + ' ' + r.re; }).join(' · '));
        var top = Math.max.apply(null, tied.map(function (r) { return r.re; })); tied = tied.filter(function (r) { return r.re === top; });
      }
      win = [tied[0].key];
      if (n20.length === 1) S.bonus[n20[0].key] = true;                         // (a solo natural 20: +3 on that one's next roll-off)
      rows.again = again;
    }
    rows.win = win;
    return rows;
  }
  function rowText(rows) { return rows.map(function (r) { return who(r.key) + ' ' + (r.d === 20 ? '{y}20!{/}' : r.d) + (r.b ? '{c}+3{/}' : ''); }).join(' · '); }
  // one item to determine: who rolls (those who have not had it), the roll-off, the winners'; if no one is left to roll, all four, and the winner takes an
  // item from the next tier up (his "the item (not package) from the next tier up")
  function award(B, S, show, label, idFor, tier, better) {
    var keys = KEYS.filter(function (k) { var id = idFor(k); return id && !holds(S, k, id, better); }), up = false;
    if (!keys.length) { keys = KEYS.slice(); up = true; }
    var rows = rollOff(S, keys), got = [];
    rows.win.forEach(function (k) {
      var id = up ? pickUp(S, k, tier) : idFor(k);
      if (!id) { got.push(who(k) + ': {g}has it all already{/}'); return; }
      land(S, { id: id, to: k, tier: up ? Math.min(4, tier + 1) : tier });
      got.push('{y}' + who(k) + '{/}: the ' + nm(id) + (up ? ' {c}(from the tier up: ' + (tier >= 4 ? 'another of tier 4' : 'tier ' + (tier + 1)) + '){/}' : ''));
    });
    var n20 = rows.filter(function (r) { return r.d === 20; });
    show.rows.push({ label: label + (up ? ' (everyone has one: all four roll)' : ''), dice: rowText(rows), again: rows.again || [], got: got,
      note: n20.length === 1 ? 'a natural 20: +3 on ' + who(n20[0].key) + '\'s next roll-off' : n20.length > 1 ? n20.length + ' natural 20s: each of them has it' : '' });
  }
  // an item from a pool by a die: the ones that fit k and it has not had
  function pickFrom(S, k, tier) { var pool = poolFor(S, k, tier); return pool.length ? pool[SU.d(pool.length) - 1] : null; }
  function pickUp(S, k, tier) { return pickFrom(S, k, Math.min(4, tier + 1)) || (tier >= 3 ? pickFrom(S, k, 4) : null); }
  // a tier 3 or 4 click: the roll-off among those the pool still has something for, then the die for each winner's item
  function awardPool(B, S, show, tier) {
    var keys = KEYS.filter(function (k) { return poolFor(S, k, tier).length; }), up = false;
    if (!keys.length) { keys = KEYS.slice(); up = true; }
    var rows = rollOff(S, keys), got = [];
    rows.win.forEach(function (k) {
      var id = up ? pickUp(S, k, tier) : pickFrom(S, k, tier);
      if (!id) { got.push(who(k) + ': {g}has it all already{/}'); return; }
      var e = { id: id, to: k, tier: tier };
      land(S, e);
      got.push('{y}' + who(k) + '{/}: the ' + nm(id) + (e.gains ? ' {c}(' + e.gains.ab.toUpperCase() + ' +' + e.gains.n + ': a d4 rolls ' + e.gains.n + '){/}' : ''));
    });
    var n20 = rows.filter(function (r) { return r.d === 20; });
    show.rows.push({ label: 'ONE ' + (tier === 4 ? 'EPIC ' : '') + 'ITEM' + (up ? ' (everyone has the lot: all four roll)' : ''), dice: rowText(rows), again: rows.again || [], got: got,
      note: n20.length === 1 ? 'a natural 20: +3 on ' + who(n20[0].key) + '\'s next roll-off' : n20.length > 1 ? n20.length + ' natural 20s: an item each' : '' });
  }
  // the stat the Gains Ring is cut to: the highest score, the role's own on a tie (Denny STR, Beholda WIS, Rascal CHA, Goose WIS)
  function bestStat(k) {
    var b = MP.BUILDS[k], u = mascot(WV.B, k), ab = (u && u.abil) || b.abil, key = MP.SUBS[b.sub].key, best = key;
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function (s) { if ((ab[s] || 0) > (ab[best] || 0)) best = s; });
    return best;
  }
  function mascot(B, k) {
    var P0 = B && B.gs && B.gs.party, all = (B ? B.units : []).concat(P0 ? [P0.token].concat(P0.rest) : []);
    return all.filter(function (u) { return u && u.mpmon === k; })[0] || null;
  }
  // into the chest (the Gains Ring's d4 rolled as it lands -- his "your click rolls 1d4" -- cut to its winner's best stat)
  function land(S, e) { if (e.id === 'gainsring' && e.to && !e.gains) e.gains = { ab: bestStat(e.to), n: SU.d(4) }; S.chest.push(e); }
  function packN(B, id) { var s = (B.inv || []).filter(function (x) { return x.id === id; })[0]; return s ? s.n : 0; }
  function chestN(S, id) { return S.chest.reduce(function (n, e) { return n + (e.id === id && !e.to ? e.n || 1 : 0); }, 0); }

  // ------------------------------------------------------------------ his click on a tier: what lands in the chest
  SU.send = function (B, tier) {
    var S = B.su; if (!S) return null;
    var show = { tier: tier, t0: B.t, rows: [], title: '' }, lines = [];
    S.sent[tier] = (S.sent[tier] || 0) + 1;
    if (tier === 1) {
      // the d4, or the ammo (his "unless Goose is <10 ammo, then ammo goes in chest": the pouch and what the chest holds for it)
      var have = packN(B, 'slingbullets') + chestN(S, 'slingbullets'), pick, why;
      if (have < SU.LOW_AMMO) { pick = SU.TIER1[0]; why = 'Goose has ' + have + ' bullets: the ammo'; }
      else { var d4 = SU.d(4); pick = SU.TIER1[d4 - 1]; why = 'a d4 rolls ' + d4; }
      land(S, { id: pick[0], n: pick[1] });
      show.title = 'TIER 1: THE SMALL STUFF';
      show.rows.push({ label: why, got: [pick[1] + ' ' + many(pick[0], pick[1])] });
    } else if (tier === 2) {
      SU.TIER2.pack.forEach(function (p) { land(S, { id: p[0], n: p[1] }); });
      show.title = 'TIER 2: THE PACKAGE';
      show.rows.push({ label: 'for the pack', got: SU.TIER2.pack.map(function (p) { return p[1] + ' ' + many(p[0], p[1]); }) });
      award(B, S, show, '+1 WEAPON', function (k) { return SU.TIER2.weapon[k]; }, 2, true);
      award(B, S, show, 'ARMOUR', function (k) { return SU.TIER2.armour[k]; }, 2);
    } else {
      show.title = tier === 3 ? 'TIER 3: THE PACKAGE' : 'TIER 4: EPIC';
      awardPool(B, S, show, tier);
    }
    // the score, and an epic amulet at every 100
    var s0 = S.score10; S.score10 += SU.SCORE[tier] || 0;
    for (var n = Math.floor(s0 / SU.EPIC_AT) + 1; n <= Math.floor(S.score10 / SU.EPIC_AT); n++) S.epic.push({ t0: B.t, at: n * SU.EPIC_AT / 10, pick: SU.EPIC });
    S.show = show;
    if (D.circles && D.circles.chest) D.circles.chest(B, 'thump');
    D.sfx('popup');
    // the log: what came, and the roll-offs as the stream sees them (names and numbers)
    lines.push('{y}' + show.title + '{/} from chat.  {g}score ' + score(S) + '{/}');
    show.rows.forEach(function (r) { lines.push((r.dice ? r.label + ': ' + r.dice : r.label) + '  -> ' + r.got.join(' · ')); });
    B.card(lines.slice(0, 6), W(360));
    S.epic.forEach(function (e) { if (!e.carded) { e.carded = true; B.card(['{y}THE SCORE IS ' + e.at + '!{/}  An epic amulet for the party: check the chest!'], W(420)); } });
    return show;
  };
  function score(S) { return (S.score10 / 10).toFixed(1).replace(/\.0$/, ''); }
  SU.score = function (B) { return B && B.su ? S0score(B.su) : 0; };
  function S0score(S) { return S.score10 / 10; }
  // the epic amulet, picked (his lever, or chat's on his click): a roll-off among those with nothing at the neck, and into the chest
  function epicGo(B, S, e, id) {
    e.pick = id; e.done = true;
    var show = { tier: 'epic', t0: B.t, rows: [], title: 'THE EPIC AMULET: ' + nm(id).toUpperCase() };
    award(B, S, show, 'THE AMULET', function () { return id; }, 4);
    S.show = show; D.sfx('levelup');
    B.card(['{y}THE EPIC AMULET{/}: the ' + nm(id) + '.  ' + show.rows[0].dice + '  -> ' + show.rows[0].got.join(' · ') + '  {y}Check the chest!{/}'], W(420));
    if (D.circles && D.circles.chest) D.circles.chest(B, 'thump');
  }
  // each frame: an amulet due with its pick made (his lever) goes to its roll-off; with no one to pick it (&auto, a bench) the first
  SU.tick = function (B) {
    var S = B && B.su; if (!S || !usable(B)) return;
    S.epic.forEach(function (e) { if (!e.done && (e.pick || S.auto)) epicGo(B, S, e, e.pick || SU.EPICS[0]); });
    if (B.gs.mode !== 'lamp') S.bedAsk = null;
    if (S.show && B.t - S.show.t0 > SU.SHOW_T + (S.show.rows.length > 2 ? 120 : 0)) S.show = null;   // (its own time, not the show's waits: &fast cuts those)
  };
  SU.epicGo = function (B, id) { var S = B.su, e = S && S.epic.filter(function (x) { return !x.done; })[0]; if (e) epicGo(B, S, e, id || e.pick || SU.EPIC || SU.EPICS[0]); };

  // ------------------------------------------------------------------ the chest, between waves (js/waves.js afterWave: the token there, the chest open)
  // what is in it handed out, one thing at a beat: the potions and the bullets into the pack; each piece onto its winner, a choice where it must be one (his
  // pick: "they'll have to choose if enough support comes in"); the armour kept for the bed. Whatever chat sends while the chest is open is handed out as it
  // lands. His click on to the bed (or on the chest or the bed) ends it -- left in the queue for js/waves.js, which waits on it
  GS.supplies = function* (B, ctx) {
    if (!ctx || ctx.at !== 'chest' || !B.su) return;
    var S = B.su, st = B.gs; S.at = true; S.lines = []; S.handed = 0;
    try {
      for (var f = 0; ; f++) {
        if (S.ask) { if (S.auto || SU.autoPick) answer(B, S, autoPick(S, S.ask)); }
        else if (S.chest.length) { yield* give(B, S, S.chest.shift()); continue; }
        else if (S.auto) return;
        var ck = st.clicks[0];
        if (ck) { if (onward(ck)) { if (S.ask) { S.chest.unshift(S.ask.e); S.ask = null; } return; } st.clicks.shift(); }
        yield 1;
      }
    } finally { S.at = false; S.ask = null; }
  };
  function onward(ck) {
    var hit = WV.hit && WV.hit(ck), sq = !hit && D.iso.pick(ck.x, ck.y, 0), cs = G.map.def.chest, bed = WV.bed;
    return hit === 'onward' || !!(sq && ((cs && sq.x === cs[0] && sq.y === cs[1]) || (bed && sq.x === bed[0] && sq.y === bed[1])));
  }
  function say(B, S, s) { S.lines.push(s); if (S.lines.length > 7) S.lines.shift(); B.card([s], W(300)); }
  function* give(B, S, e) {
    if (!e.to) {
      var inv = B.inv = B.inv || [], s = inv.filter(function (x) { return x.id === e.id; })[0];
      if (s) s.n += e.n || 1; else inv.push({ id: e.id, n: e.n || 1 });
      say(B, S, '{y}Into the pack{/}: ' + (e.n || 1) + ' ' + many(e.id, e.n || 1) + (e.id === 'slingbullets' ? '  {g}(Goose has ' + packN(B, 'slingbullets') + '){/}' : ''));
      D.sfx('chest'); S.handed++;
      yield W(36); return;
    }
    if (e.gains) WV.gains[e.to] = e.gains;
    var opts = fit(S, e);
    if (opts.length === 1) { put(B, S, e, opts[0]); yield W(40); return; }
    S.ask = { e: e, opts: opts, t0: B.t };
    D.sfx('popup');
    S.lines.push('{y}' + who(e.to) + '{/} must choose:'); B.card(['{y}' + who(e.to) + '{/} must choose: ' + S.ask.opts.map(function (o) { return o.label.toLowerCase(); }).join(', or ') + '?'], W(300));   // (the panel's buttons say the rest)
    while (S.ask) {
      if (S.auto || SU.autoPick) answer(B, S, autoPick(S, S.ask));
      var c0 = st0(B).clicks[0];
      if (S.ask && c0) { if (onward(c0)) return; st0(B).clicks.shift(); }   // (on to the bed unanswered: it waits in the chest -- the loop above; any other click is nothing here)
      yield 1;
    }
    yield W(40);
  }
  function st0(B) { return B.gs || { clicks: [] }; }
  // the ways an item can go on: the room free -- on it goes; full -- the new one for each that is there, or kept in the chest; then three bonds at most (SRD 5.1):
  // over three, which of them is let go (back in the chest)
  function fit(S, e) {
    var k = e.to, w0 = worn(k).slice(), pl = place(e.id), same = w0.filter(function (x) { return place(x) === pl; }), opts = [];
    if (same.length < (ROOM[pl] || 1)) opts.push({ worn: w0.concat([e.id]), off: [], label: 'TAKE THE ' + nm(e.id).toUpperCase() });
    else if (pl === 'weapon' && plain(e.id) && same.every(plain) && same.every(function (x) { return plus(x) < plus(e.id); })) opts.push({ worn: w0.filter(function (x) { return same.indexOf(x) < 0; }).concat([e.id]), off: same.slice(), label: 'TAKE THE ' + nm(e.id).toUpperCase() });
    else if (pl === 'weapon' && plain(e.id) && same.some(function (x) { return plus(x) >= plus(e.id); })) opts.push({ worn: w0, off: [e.id], label: 'KEEP THE ' + nm(same[0]).toUpperCase() });
    else {
      same.forEach(function (x) { opts.push({ worn: w0.filter(function (y) { return y !== x; }).concat([e.id]), off: [x], label: 'TAKE THE ' + nm(e.id).toUpperCase() + (same.length > 1 || x !== e.id ? ' (OFF: ' + nm(x).toUpperCase() + ')' : '') }); });
      opts.push({ worn: w0, off: [e.id], label: 'KEEP ' + same.map(function (x) { return 'THE ' + nm(x).toUpperCase(); }).join(' AND ') });
    }
    var out = [];
    opts.forEach(function (o) {
      var b = o.worn.filter(function (x) { return IT[x] && IT[x].attune; });
      if (b.length <= R.ATTUNE_MAX) { out.push(o); return; }
      b.forEach(function (x) { if (x === e.id) return; out.push({ worn: o.worn.filter(function (y) { return y !== x; }), off: o.off.concat([x]), label: 'BOND THE ' + nm(e.id).toUpperCase() + ', LET GO OF THE ' + nm(x).toUpperCase() }); });
      out.push({ worn: o.worn.filter(function (y) { return y !== e.id; }), off: o.off.concat([e.id]), label: 'KEEP THE THREE BONDS' });
    });
    return out.length > 5 ? out.slice(0, 4).concat([out[out.length - 1]]) : out;   // (five buttons at most, the keep-it-all last)
  }
  SU.fit = fit;
  // the auto's pick (&auto, a bench): the new one on, and of the rest let go the one worth least
  function autoPick(S, a) { var best = 0, bs = -1e9; a.opts.forEach(function (o, i) { var s = (o.worn.indexOf(a.e.id) >= 0 ? 10 : 0) - o.off.reduce(function (n, x) { return n + plus(x) + (IT[x] && IT[x].attune ? 1 : 0); }, 0); if (s > bs) { bs = s; best = i; } }); return best; }
  function answer(B, S, i) { var a = S.ask; if (!a || !a.opts[i]) return; S.ask = null; put(B, S, a.e, a.opts[i]); D.sfx('confirm'); }
  SU.answer = function (B, i) { if (B.su && B.su.ask) answer(B, B.su, i); };
  // on it goes (in the words the Mascot is made from: WV.loot), the rest back in the chest; the armour's for the bed
  function put(B, S, e, o) {
    var k = e.to, nmK = who(k), on = o.worn.indexOf(e.id) >= 0, pl = place(e.id), it = IT[e.id];
    WV.loot[k] = o.worn.slice();
    o.off.forEach(function (x) { S.stash.push({ id: x, to: k }); });
    S.handed++;
    var bond = on && it.attune ? ' and bonds with it' : '';
    if (!on) say(B, S, '{y}' + nmK + '{/} keeps what is worn: the ' + nm(e.id) + ' stays in the chest.');
    else if (pl === 'armor' || pl === 'over') { S.bed.push({ k: k, id: e.id }); say(B, S, '{y}' + nmK + '{/}: the ' + nm(e.id) + ', for the bed  {g}(armour goes on at the rest){/}'); }
    else if (k === 'beholda' && (pl === 'ring' || pl === 'cloak' || pl === 'neck')) say(B, S, '{y}Goose{/} ' + (pl === 'ring' ? 'slips the ' + nm(e.id) + ' onto one of Beholda\'s eyestalks' : pl === 'cloak' ? 'ties the ' + nm(e.id) + ' round Beholda' : 'hangs the ' + nm(e.id) + ' on Beholda') + (bond ? '; Beholda bonds with it' : '') + '.');
    else say(B, S, '{y}' + nmK + '{/} ' + (pl === 'weapon' ? 'takes up' : 'puts on') + ' the ' + nm(e.id) + bond + (e.gains ? ' {c}(' + e.gains.ab.toUpperCase() + ' +' + e.gains.n + '){/}' : '') + '.');
    o.off.filter(function (x) { return x !== e.id; }).forEach(function (x) { say(B, S, '{g}The ' + nm(x) + ' goes back in the chest.{/}'); });
    D.sfx('chest');
  }

  // ------------------------------------------------------------------ the bed: the armour on, and each Mascot made again in what it now wears
  // (GS.scatter is called at the rest's end, the four still in the token: js/waves.js afterWave. A long rest's rebuild read WV.loot already; a short rest's did not)
  var scatter0 = GS.scatter;
  GS.scatter = function* (B) {
    if (SU.live(B)) dress(B);
    yield* scatter0.apply(this, arguments);
  };
  function wordOf(k, L) { return k + ':' + L + (WV.loot[k] || []).map(function (id) { return '+' + id; }).join(''); }
  function dress(B) {
    var S = B.su, P0 = B.gs && B.gs.party, four = P0 ? [P0.token].concat(P0.rest) : B.units.filter(function (u) { return u.mpmon; });
    S.bed.forEach(function (b) { B.card(['{y}' + who(b.k) + '{/} ' + (place(b.id) === 'armor' ? 'changes into the ' + nm(b.id) : 'has the ' + nm(b.id) + ' laid over ' + (b.k === 'beholda' ? 'the eye\'s armour' : 'the armour')) + '.'], W(300)); });
    S.bed = [];
    four.forEach(function (u) { if (u && u.mpmon && (u.gsLoot || '') !== (WV.loot[u.mpmon] || []).join('+')) remake(B, u); });
  }
  // made again at its level from its words, its hit points, its specials and where it stands kept
  function remake(B, u) {
    var L = u.lvl || 1, n = NPC.build({ word: wordOf(u.mpmon, L), hpLeft: Math.max(0, u.hp), featsLeft: u.feats }, L, 'party', { id: u.id });
    if (!n) return u;
    n.x = u.x; n.y = u.y; n.facing = u.facing; n.anim = 'idle'; n.animT = B.t; n.flash = 0; n.reaction = 1; n.conds = {}; n.temp = u.temp || 0;
    if (u.guest) { n.guest = true; n.classAI = true; }
    var swap = function (w) { return w === u ? n : w; }, P0 = B.gs && B.gs.party;
    B.units = B.units.map(swap); B.order = (B.order || []).map(swap);
    if (P0) { P0.token = swap(P0.token); P0.rest = P0.rest.map(swap); }
    if (GS.run && GS.run.party) GS.run.party = GS.run.party.map(swap);
    G.setup(G.map, B.units);
    arm(B, n);
    return n;
  }
  SU.remake = remake;
  // a wave's end: the hammer home (the four go into the token)
  var gather0 = GS.gather;
  GS.gather = function* (B, o) {
    if (SU.live(B)) B.units.concat((o && o.party) || []).forEach(function (u) { if (u && u.hammerOut != null) hammerBack(B, u, 'quiet'); });
    return yield* gather0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ his clicks: the lantern, its buttons, a roll-off's panel, the amulet, a choice
  var BTN = {};
  SU.btn = function (id) { return BTN[id] || null; };   // (where a button was last drawn: a bench's click)
  function inR(b, x, y) { return b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
  SU.lanternAt = function (B) {   // the lamp on its tower, on the screen (js/circles.js towerProp: 40 wide, 92 tall, its foot on the square)
    var tw = G.map && G.map.def.tower; if (!tw) return null;
    var q = G.map.at(tw[0], tw[1]), c = D.iso.center(tw[0], tw[1], q ? q.gz : 0), s = D.iso.toScreen(c.x, c.y), z = D.iso.zoom;
    return { x: s.x - 11 * z, y: s.y - 88 * z, w: 22 * z, h: 74 * z, sx: s.x, sy: s.y - 80 * z };
  };
  function onLantern(B, x, y) {
    var tw = G.map.def.tower, sq = D.iso.pick(x, y, 0);
    if (sq && tw && sq.x === tw[0] && sq.y === tw[1]) return true;
    var cs = G.map.def.chest; if (sq && cs && sq.x === cs[0] && sq.y === cs[1]) return false;
    return inR(SU.lanternAt(B), x, y);
  }
  function usable(B) { var m = B.gs && B.gs.mode; return m === 'fight' || m === 'rest' || m === 'chest' || m === 'lamp'; }   // (the lamp's turn after a wave, js/waves.js: where he checks in with chat)
  function onBedSq(x, y) { var q = D.iso.pick(x, y, 0); return !!(q && ((WV.bed && q.x === WV.bed[0] && q.y === WV.bed[1]) || (WV.cots || []).some(function (c) { return c[0] === q.x && c[1] === q.y; }))); }
  SU.click = function (B, x, y) {
    var S = B.su; if (!S || !usable(B)) return false;
    var ep = S.epic.filter(function (e) { return !e.done; })[0];
    if (ep) { for (var j = 0; j < SU.EPICS.length; j++) if (inR(BTN['epic' + j], x, y)) { epicGo(B, S, ep, SU.EPICS[j]); return true; } }
    if (S.ask) { for (var i = 0; i < S.ask.opts.length; i++) if (inR(BTN['ask' + i], x, y)) { answer(B, S, i); return true; } }
    if (S.show && inR(BTN.show, x, y)) { S.show = null; return true; }
    // THE IDLE TURN'S SAFETY, on the lamp's turn (Griz, 10-07: "ensure the idle-turn safety works on lamp turns"): as END on a turn with nothing done asks first
    // (js/ui.js idleTurn), TO THE BED with chat's supplies still in the chest asks first -- the same click again goes (they wait for the next wave's chest)
    if (B.gs.mode === 'lamp' && S.chest.length && !S.auto && ((WV.hit && WV.hit({ x: x, y: y }) === 'tobed') || onBedSq(x, y)) && S.bedAsk !== S.chest.length) {
      S.bedAsk = S.chest.length; D.sfx('popup');
      B.card(['{y}The chest holds ' + S.chest.length + ' from chat.{/}  TO THE BED again skips it (it waits for the next wave); TO THE CHEST hands it out.'], 420);
      return true;
    }
    if (S.open) {
      for (var t = 1; t <= 4; t++) if (inR(BTN['tier' + t], x, y)) { SU.send(B, t); return true; }
      if (inR(BTN.close, x, y) || inR(BTN.panel, x, y)) { if (inR(BTN.close, x, y)) S.open = false; return true; }
    }
    if (WV.hit && WV.hit({ x: x, y: y })) return false;   // (the show's own buttons -- TO THE CHEST, ON TO THE BED, a rest's -- lie over the floor: the tower under one is not clicked)
    // the lamp: on its tower, or its box in the run's corner (always on the screen -- the tower is off it whenever the fight is elsewhere)
    if (onLantern(B, x, y) || inR({ x: D.W - 132, y: D.H - 102, w: 128, h: 30 }, x, y)) { S.open = !S.open; D.sfx(S.open ? 'popup' : 'cancel'); return true; }
    return false;
  };

  // ------------------------------------------------------------------ the picture
  function big(ctx, s, x, y, color, k) {
    var w = D.textWidth(s), c = big.c || (big.c = document.createElement('canvas'));
    c.width = w + 2; c.height = 12; var x2 = c.getContext('2d'); x2.clearRect(0, 0, c.width, c.height); D.text(x2, s, 0, 0, color);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(c, 0, 0, c.width, c.height, Math.round(x - c.width * k / 2), y, c.width * k, c.height * k);
  }
  function button(ctx, id, label, x, y, w, h, bg, col) { D.win8(ctx, x, y, w, h, bg || null); D.text(ctx, label, x + w / 2, y + Math.round(h / 2) - 4, col || P('gold', 4), 'center'); BTN[id] = { x: x, y: y, w: w, h: h }; }
  function fitText(s, w) { s = String(s); while (s.length > 4 && D.textWidth(s) > w) s = s.slice(0, -2); return s; }
  SU.paint = function (ctx, B) {
    var S = B.su; BTN = {};
    if (!S || !usable(B)) return;
    var Wd = D.W, Hd = D.H;
    // the lantern's buttons, over the run's box (bottom right: js/waves.js WV.hud)
    if (S.open) {
      var x = Wd - 132, y = Hd - 192, w = 128;
      D.win8(ctx, x, y, w, 88); BTN.panel = { x: x, y: y, w: w, h: 88 };
      D.text(ctx, 'SUPPLIES', x + 6, y + 5, P('gold', 4)); D.text(ctx, score(S) + '/100', x + w - 20, y + 5, P('bone', 1), 'right');
      button(ctx, 'close', 'x', x + w - 16, y + 3, 12, 11, P('red', 1));
      [['1', 'SMALL STUFF', 'moss'], ['2', 'THE PACKAGE', 'blue'], ['3', 'THE PACKAGE', 'violet'], ['4', 'EPIC', 'red']].forEach(function (r, i) {
        button(ctx, 'tier' + r[0], 'TIER ' + r[0] + '  ' + r[1], x + 4, y + 18 + i * 17, w - 8, 15, P(r[2], 1));
      });
    } else if (S.chest.length || S.score10) {
      var n = S.chest.length;
      D.text(ctx, (n ? 'CHEST ' + n + '  ' : '') + 'SCORE ' + score(S), Wd - 6, Hd - 113, n ? P('gold', 4) : P('bone', 1), 'right');
    }
    // the chest's moment: what came out of it, and a choice to make; on the lamp's turn, what is waiting in it
    if (B.gs.mode === 'chest' && S.at) chestPanel(ctx, B, S);
    if (B.gs.mode === 'lamp' && S.chest.length) { D.win8(ctx, Wd / 2 - 90, 110, 180, 16); D.text(ctx, 'THE CHEST: ' + S.chest.length + ' from chat', Wd / 2, 114, P('gold', 4), 'center'); }
    // a roll-off's panel
    if (S.show) showPanel(ctx, B, S.show);
    // the epic amulet, waiting on chat's pick
    var ep = S.epic.filter(function (e) { return !e.done; })[0];
    if (ep) {
      if (!ep.pick) {
        ctx.fillStyle = 'rgba(10,8,16,0.6)'; ctx.fillRect(0, Hd / 2 - 54, Wd, 100);
        big(ctx, 'EPIC AMULET!', Wd / 2, Hd / 2 - 48, P('gold', 4), 3);
        D.text(ctx, 'The score is ' + ep.at + '.  Check the chest!  Chat picks:', Wd / 2, Hd / 2 - 8, P('bone', 1), 'center');
        SU.EPICS.forEach(function (id, i) { button(ctx, 'epic' + i, nm(id).toUpperCase(), Wd / 2 - 150 + i * 154, Hd / 2 + 8, 146, 18, P(i ? 'blue' : 'red', 1)); });
      }
    }
  };
  function showPanel(ctx, B, sh) {
    var Wd = D.W, w = Wd - 144, lines = [];
    sh.rows.forEach(function (r) {
      lines.push(['{y}' + r.label + '{/}' + (r.dice ? '  ' + r.dice : ''), 'bone']);
      (r.again || []).forEach(function (a) { lines.push(['  tie, again: ' + a, 'bone']); });
      lines.push(['  -> ' + r.got.join(' · '), 'bone']);
      if (r.note) lines.push(['  {c}' + r.note + '{/}', 'bone']);
    });
    var h = 22 + lines.length * 11, x = 8, y = B.gs.mode === 'chest' || B.gs.mode === 'lamp' ? D.H - 44 - h : 58;   // (left of the lantern's buttons, so chat can keep sending; under the fight's cards, or at the chest moment under its panels)
    D.win8(ctx, x, y, w, h); BTN.show = { x: x, y: y, w: w, h: h };
    D.text(ctx, sh.title, x + w / 2, y + 6, P('gold', 4), 'center');
    lines.forEach(function (l, i) { D.text(ctx, fitText(l[0], w - 14), x + 7, y + 19 + i * 11, P(l[1], 1)); });
  }
  function chestPanel(ctx, B, S) {
    var Wd = D.W, w = Wd - 144, x = 8, y = 112, ls = S.lines.slice(-5), a = S.ask;   // (left of the run's box and the lantern's buttons)
    var h = 10 + Math.max(1, ls.length) * 11 + (a ? 14 + a.opts.length * 17 : 0) + (S.chest.length ? 11 : 0);
    D.win8(ctx, x, y, w, h);
    if (!ls.length) D.text(ctx, S.chest.length ? 'opening it...' : 'empty: nothing from chat yet (click the lamp to send)', x + w / 2, y + 6, P('bone', 1), 'center');
    ls.forEach(function (l, i) { D.text(ctx, fitText(l, w - 14), x + 7, y + 6 + i * 11, P('bone', 1)); });
    var yy = y + 6 + Math.max(1, ls.length) * 11;
    if (S.chest.length) { D.text(ctx, '{g}' + S.chest.length + ' more in the chest{/}', x + 7, yy, P('bone', 1)); yy += 11; }
    if (a) {
      D.text(ctx, '{y}' + who(a.e.to).toUpperCase() + '{/}: the ' + nm(a.e.id) + ' -- chat, which?', x + 7, yy + 2, P('bone', 1)); yy += 14;
      a.opts.forEach(function (o, i) { button(ctx, 'ask' + i, fitText(o.label, w - 24), x + 6, yy + i * 17, w - 12, 15, P(i === a.opts.length - 1 ? 'accent' : 'moss', 1)); });
    }
  }
})();
