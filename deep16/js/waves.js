/* DEEP16 — the Monster Party Game Show's waves (10-07; the lane: they live\handoff-2026-10-07-the-monster-party-game-show.md, seat 2 -- §3 D). The fight
   after Third Lamp's arrival: the waves by tier, the lamp as the foes' target, the bed's rests, the XP and the levels, the run's end. Seat 1's show hands
   its battle over (js/gameshow.js, the lane's §5): D.gameshow.waves = function* (B, GS) runs here, and calls the show back for its scenes -- after a wave
   GS.gather, GS.tokenWalk (to the chest, then the bed), GS.scatter (afterWave, below), and yield* GS.gameOver(B, villain, { waves, tier }) when the lamp goes out.

   His words, the ones that bind it (10-07): "1 - the most famous monsters that fit the CR requirements (i.e. goblins) - surface monsters from the back, cave
   types from the deepholm side" · "add a bed that offers a short rest at between wave increments and a long rest after every 'tier'. First tier will be 2
   waves with one short rest, then only long rest highlighted. Tier will get higher twice, then add an additional wave increment." · "5 - that is right, 7-9
   we'll aim for third is a 'boss monster' (tough CR, not our customs - save 9 - which can be the edifice team) - we'll fudge the numbers on xp if we have to
   with the aim that if none of the heroes are down when the fight ends and xp is awarded they'll hit 9 when the 9th wave starts." · "yes" (the lamp is the
   foes' target) · "party wipe doesn't end the run - slow mo walk to the lamp by surviving villain then darkness - pause - game over" · "all benching is
   pending lobstamonkee effect gallery thing" (build and gate; the numbers below are levers, not a balance).

     deep16/?gameshow&at=lamp     straight to Third Lamp; the waves start when the king and the cleric have gone
     &watch                       the Mascots run by their class AI (his click still takes each rest) · &auto the same, and the rests taken by themselves
     &tier=N&wave=M               start at tier N (the four at level N, their XP at its threshold), wave M of it · &lamp=N the lamp's hit points
     &end=lamp | &end=wipe        the end staged for a look: after the first foe's turn the lamp is out, or no Mascot stands (a show door)
     &oldwalk                     after a wave the token walks to the chest by itself, no lamp's turn (the walk before 10-07's lamp turn)

   THE RUN: nine tiers, the four at level 1 at tier 1. Tiers 1-3 two waves, 4-9 three; at 7-9 the third is a boss -- an SRD monster with a tough CR, none
   of our own, and tier 9's the Edifice team (the Skylights' stone giants and trolls). Surface kinds come in from the west (the road up from Second Lamp),
   cave kinds from the east (over the causeway from Deepholm). Each wave is a fight of its own: the foes walk in, everyone rolls initiative, it ends when
   the wave is down (cleared), the lamp is broken, or no Mascot stands. THE LAMP is a thing on the field on the party's side (the Skylights' glass is the
   model, Battle.skyUp): AC, hit points, resistance to everything; every foe's mission (ai.js: it goes for the lamp unless one of ours stands in its reach).
   Its hit points carry from wave to wave and come back whole at the long rest. THE BED (the station's cots in the south room) lights the rest that is due:
   a short rest between waves, the long rest after the tier's last; his click on it (or its button) takes it. THE XP: each Mascot's share of a wave is
   fudged so the tier's waves bring it exactly to the next level's threshold -- level 2 after tier 1, 9 when tier 9 starts -- and one down when the wave
   ends takes half its share (it catches up over the next tier's waves). The levels come at the long rest. PAST THE NINTH (RULED 10-07, Griz: "3 keep going"): the
   run never ends on a win -- tier 10 and on are tier 9's waves with more of each wave's smallest kind every tier (WV.tierWaves), the lamp's hit points still
   growing, the XP banked, till the lamp goes out; the score is the waves held. The road's dim lamps RULED the same day ("1 - keep"); tier 1's weight waits on
   the bench ("2 bench"). */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, R = DS.R, G = D.grid, RU = D.rules, FX = D.fx;
  var GS = D.gameshow; if (!GS) return;
  var WV = GS.wave = {};

  // ------------------------------------------------------------------ the levers (nothing here is benched yet: his "all benching is pending")
  WV.CFG = {
    // (the cots are read off the map at the run's start -- its `y` squares, Third Lamp's three in the south room, drawn from his cot sheet by js/circles.js -- and
    // the bed, where the four meet at a rest's end, is the floor square beside the first: a cot itself is not walked into. WV.cots, WV.bed)
    lampAC: 15, lampHP: function (tier) { return 40 + 20 * tier; },   // the lamp: 60 at tier 1 to 220 at tier 9, resisting everything (halved)
    stall: 40,                                       // rounds before a wave that cannot end is called (the rest of it melts back into the dark)
    // the road's own lamps, dim (RULED 10-07, Griz: "1 - keep"): Third Lamp is the 8-bit's dark map and past the tower's 30 ft the halls are black -- the goblins'
    // darkvision shot three Mascots without it from where they could not be seen (the first run, 10-07). Dim light is enough to be seen by (no disadvantage), so
    // the waves are fought where the stream can see them; the supplies' torches still give bright light. 0 keeps the 8-bit's dark
    // (10-07, after he watched tier 1: "Lamps/Lanterns on the floor back toward 2nd lamp" -- each light a lantern set on the floor at the hall's edge, drawn: lanternProp)
    roadLight: 25, roadLamps: [[4, 7], [11, 10], [18, 7], [44, 10], [51, 7], [58, 10], [65, 7], [69, 10]]
  };
  var WEST = { from: [[0, 8], [0, 9], [0, 7], [0, 10]], at: [6, 8] }, EAST = { from: [[82, 8], [82, 9]], at: [64, 8] };

  // THE WAVES (the seat's draft, his to recut): by tier, each { west: [kinds], east: [kinds], boss, card }. The SRD's own monsters only; against the DMG's
  // table for four at the tier's level the waves read MEDIUM to HARD, the bosses HARD to DEADLY, the Edifice team past it (his, on the Skylights: "kinda
  // hoping players have to load once or twice")
  WV.TIERS = {
    1: [{ west: ['goblin', 'goblin', 'goblin'], card: 'Goblins, up the road from Second Lamp!' },
        { west: ['goblin', 'goblin'], east: ['giantrat', 'giantrat', 'giantrat'], card: 'Goblins behind -- and giant rats over the causeway from Deepholm!' }],
    2: [{ west: ['hobgoblin', 'hobgoblin', 'goblin', 'goblin'], card: 'Hobgoblins, in step, with goblins at their heels.' },
        { east: ['giantspider', 'giantrat', 'giantrat', 'giantrat'], card: 'Something on eight legs comes over the causeway, and the rats run ahead of it.' }],
    3: [{ west: ['bugbear', 'hobgoblin', 'hobgoblin', 'goblin', 'goblin'], card: 'A bugbear drives a goblin war band down the road.' },
        { east: ['duergar', 'duergar', 'darkmantle', 'darkmantle'], card: 'Duergar out of the Deepholm dark -- and the ceiling moves.' }],
    4: [{ west: ['gnoll', 'gnoll', 'gnoll', 'gnoll', 'gnoll', 'hyena', 'hyena'], card: 'Gnolls, laughing, and their hyenas with them.' },
        { east: ['ochrejelly', 'grimlock', 'grimlock', 'grimlock'], card: 'Grimlocks feel their way along the wall. Behind them the floor oozes.' },
        { west: ['ogre', 'worg', 'worg'], east: ['grimlock', 'grimlock'], card: 'An ogre and its worgs from the road; grimlocks over the causeway.' }],
    5: [{ west: ['ogre', 'ogre', 'bugbear', 'bugbear', 'goblin', 'goblin'], card: 'Two ogres, and bugbears in their shadow.' },
        { east: ['phasespider', 'phasespider', 'giantspider', 'giantspider'], card: 'Phase spiders blink out of the rock; giant spiders come down after them.' },
        { west: ['bugbear', 'hobgoblin', 'hobgoblin', 'hobgoblin', 'hobgoblin'], east: ['grick', 'grick'], card: 'A war band from the road, gricks from the dark.' }],
    6: [{ west: ['ettin', 'ogre', 'ogre'], card: 'An ettin, both heads arguing, and two ogres.' },
        { east: ['chuul', 'grick', 'grick'], card: 'A chuul hauls itself out of the black water. Gricks follow.' },
        { west: ['troll', 'worg', 'worg'], east: ['grayooze', 'grayooze'], card: 'A troll from the road; the causeway grows slick.' }],
    7: [{ west: ['troll', 'troll'], card: 'Two trolls, hungry.' },
        { east: ['xorn', 'earthelemental'], card: 'The rock itself comes for the lamp: a xorn, and the earth walking.' },
        { east: ['drider', 'giantspider', 'giantspider'], boss: 'drider', card: 'A drider climbs out of Deepholm, its spiders before it.' }],
    8: [{ west: ['troll', 'troll', 'ogre'], card: 'Trolls, and an ogre, all teeth.' },
        { east: ['otyugh', 'chuul', 'grick', 'grick'], card: 'An otyugh and a chuul out of the water, gricks on the walls.' },
        { east: ['cloaker', 'darkmantle', 'darkmantle', 'darkmantle'], boss: 'cloaker', card: 'A cloaker unfolds from the dark, and the darkmantles drop.' }],
    9: [{ west: ['troll', 'troll', 'ettin'], card: 'Trolls and an ettin, down the road at a run.' },
        { east: ['drider', 'phasespider', 'phasespider', 'giantspider', 'giantspider'], card: 'A drider and its spiders -- the deep is emptying.' },
        { west: ['stonegiant', 'stonegiant', 'troll', 'troll'], boss: 'stonegiant', card: 'THE EDIFICE TEAM: the stone giants, and the trolls they brought.' }]
  };
  // PAST THE NINTH (RULED 10-07, Griz, asked whether the run ends on THE LAMP HOLDS or goes on for a high score: "3 keep going"): every tier after 9 is tier 9's three
  // waves again, the Edifice team the boss, with one more of each wave's smallest kind for each tier past 9 (on that kind's own side), till the lamp goes out
  WV.tierWaves = function (t) {
    if (t <= 9) return WV.TIERS[t];
    var more = t - 9;
    return WV.TIERS[9].map(function (wv) {
      var all = (wv.west || []).map(function (k) { return ['west', k]; }).concat((wv.east || []).map(function (k) { return ['east', k]; }));
      var small = all.slice().sort(function (a, b) { return (R.CR_XP[String((D.FOES[a[1]] || {}).cr)] || 0) - (R.CR_XP[String((D.FOES[b[1]] || {}).cr)] || 0); })[0];
      var out = { west: (wv.west || []).slice(), east: (wv.east || []).slice(), boss: wv.boss, card: wv.card + '  {o}And ' + more + ' more of them.{/}' };
      for (var i = 0; i < more; i++) out[small[0]].push(small[1]);
      return out;
    });
  };
  WV.xpOf = function (wave) { var n = 0; (wave.west || []).concat(wave.east || []).forEach(function (k) { var f = D.FOES[k]; n += f ? (R.CR_XP[String(f.cr)] || 0) : 0; }); return n; };

  // ------------------------------------------------------------------ the four: their XP, their level, what a rest gives back
  var KEYS = ['denny', 'beholda', 'rascal', 'goose'];
  function four(B) { return KEYS.map(function (k) { return B.units.filter(function (u) { return u.mpmon === k; })[0]; }).filter(Boolean); }
  function standingM(u) { return u && G.standing(u) && !u.left && !u.dead; }
  function levelFor(xp) { var L = 1; while (L < 9 && xp >= R.XP_LEVEL[L + 1]) L++; return L; }
  // the word a Mascot is built from: its level and whatever the run has given it to wear (WV.loot[key], the supplies' seat's to fill: '+itemid' words, js/classes.js NPC.spec)
  WV.loot = {};
  function word(key, L) { return key + ':' + L + (WV.loot[key] || []).map(function (id) { return '+' + id; }).join(''); }
  // a Mascot made again at a level, where the old one stood (the long rest; the run's start at a later tier)
  function rebuild(B, u, L) {
    var n = D.npc.build(word(u.mpmon, L), L, 'party', { id: u.id });
    if (!n) return u;
    n.x = u.x; n.y = u.y; n.facing = u.facing; n.anim = 'idle'; n.animT = B.t; n.flash = 0; n.reaction = 1; n.conds = {};
    if (u.guest) { n.guest = true; n.classAI = true; }
    var i = B.units.indexOf(u); if (i >= 0) B.units[i] = n; // (one carried in the token stays off the field: GS.scatter sets it down)
    var j = B.order.indexOf(u); if (j >= 0) B.order[j] = n;
    return n;
  }
  // a short rest (SRD 5.1: an hour, hit dice spent to heal): the fallen stand first (the Pocket DM's rest, his: "SRD + free rez for the fallen before the short rest
  // applies is good"), then their hit dice till whole or out; the specials back (MP.refill: both pools, the passives' uses)
  function shortRest(B, u, S) {
    var b = (D.mpmon && D.mpmon.BUILDS && D.mpmon.BUILDS[u.mpmon]) || { hd: 8 }, con = Math.floor(((u.abil && u.abil.con) || 10) - 10) >> 1, notes = [], spent = 0, healed = 0;
    if (u.hp <= 0 || u.dead) { u.hp = 1; u.dead = false; u.ko = false; u.slain = false; notes.push('back on their feet'); }
    var hd = S.hd[u.mpmon] != null ? S.hd[u.mpmon] : u.lvl || 1;
    while (u.hp < u.maxhp && hd > 0) { var g = Math.max(0, D.d(b.hd || 8) + con); u.hp = Math.min(u.maxhp, u.hp + g); healed += g; hd--; spent++; }
    S.hd[u.mpmon] = hd;
    if (spent) notes.push(spent + ' hit ' + (spent === 1 ? 'die' : 'dice') + ', +' + healed);
    else notes.push(u.hp >= u.maxhp ? 'whole' : 'no hit dice left');
    if (D.mpmon && D.mpmon.refill) D.mpmon.refill(u);
    return notes.join(', ');
  }

  // ------------------------------------------------------------------ the lamp, on the field
  function lampUp(B, S) {
    var tw = G.map.def.tower, hp = S.lampMax;
    var L = { id: 'lamp', name: 'the lamp', kind: 'object', object: true, spellProof: true, side: 'party', x: tw[0], y: tw[1], size: 1, hp: S.lampHP, maxhp: hp, ac: WV.CFG.lampAC, baseAC: WV.CFG.lampAC,
      threshold: 0, resistAll: true, immune: ['poison', 'psychic'], condImmune: { all: true }, abil: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, saves: {}, conds: {}, attacks: {},
      speed: 0, initRoll: -99, lvl: 1, prof: 0, sheet: null, facing: 0 };
    B.units.push(L); S.lamp = L; G.setup(G.map, B.units);
    return L;
  }

  // ------------------------------------------------------------------ the foes in: made at their end of the road, walked to their squares
  // a square for each near its side's mark, clear of the walls, of each other and of anyone already standing (a big one's whole footing)
  function seat(B, list, side) {
    var taken = {}, out = [], mark = side.at;
    B.units.forEach(function (w) { if (w.dead || w.object) return; for (var j = 0; j < (w.size || 1); j++) for (var i = 0; i < (w.size || 1); i++) taken[(w.x + i) + ',' + (w.y + j)] = 1; });
    list.forEach(function (u) {
      var best = null, bd = 1e9, n = u.size || 1;
      for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) {
        var d = Math.hypot(x - mark[0], y - mark[1]); if (d >= bd || d > 14) continue;
        var free = true; for (var j = 0; j < n && free; j++) for (var i = 0; i < n && free; i++) if (taken[(x + i) + ',' + (y + j)]) free = false;
        if (!free) continue;
        u.x = x; u.y = y; if (!G.canStand(u, x, y)) continue;
        bd = d; best = [x, y];
      }
      if (!best) return;
      for (var j = 0; j < n; j++) for (var i = 0; i < n; i++) taken[(best[0] + i) + ',' + (best[1] + j)] = 1;
      u.x = best[0]; u.y = best[1]; out.push(u);
    });
    return out;
  }
  function* comeIn(B, S, wave) {
    var file = [], made = [], k = 0;
    [['west', WEST], ['east', EAST]].forEach(function (e) {
      var kinds = wave[e[0]] || []; if (!kinds.length) return;
      var us = kinds.map(function (kind) { var u = B.makeFoe({ id: 'gs' + S.count + '-' + (k++) + '-' + kind, kind: kind }); u.mission = 'lamp'; u.gsSide = e[0]; return u; });
      seat(B, us, e[1]).forEach(function (u, i) {
        var from = e[1].from[i % e[1].from.length];
        u.from0 = from.slice();
        file.push({ u: u, from: from, to: [u.x, u.y], face: D.spr.facingFor(e[0] === 'west' ? 1 : -1, 0) });
        made.push(u);
      });
    });
    S.foes = made;
    var first = file[0];
    if (first) { B.focus({ x: first.from[0] + (first.from[0] ? -4 : 4), y: first.from[1], size: 1 }); D.sfx('encounter'); }
    B.card(['{r}' + (wave.boss ? 'BOSS: ' : '') + '{/}' + wave.card], W(420));
    if (file.length) { yield* B.walkIn(file, function (g) { if (g) B.keepInView(g.u); }); yield W(20); }
    // both ends at once: the second side's walk is the first's (walkIn takes a file in step; the camera follows the file's head)
    made.forEach(function (u) { u.anim = 'idle'; u.animT = B.t; });
    return made;
  }

  // ------------------------------------------------------------------ one wave: initiative, the rounds, its end
  // its end: 'lamp' (broken), 'wipe' (no Mascot stands), 'cleared' (the wave is down -- a troll knitting at 0 still holds it open), or null
  function waveOver(B, S) {
    if (!S.lamp || S.lamp.hp <= 0 || S.lamp.dead) return 'lamp';
    if (!four(B).some(standingM)) return 'wipe';
    var up = B.units.filter(function (u) { return u.side === 'foe' && !u.dead && u.hp > 0 && !u.fled && !u.left && !u.summon && !u.dominated && !(u.conds.stoning && u.conds.stoning.done); });
    if (!up.length && !B.units.some(function (u) { return u.side === 'foe' && u.regenDown && !u.dead; })) return 'cleared';
    return null;
  }
  function* fight(B, S) {
    B.round = 0; B.mpHiveDone = {}; B.active = null;
    var rolls = B.units.filter(function (u) { return !u.familiar && !u.object && !u.look && !u.dead; });
    rolls.forEach(function (u) { var d = D.d(20); if (u.initAdv) d = Math.max(d, D.d(20)); u.initRoll = d + (u.init || 0); });
    B.order = rolls.sort(function (a, b) { return b.initRoll - a.initRoll || ((b.abil && b.abil.dex) || 10) - ((a.abil && a.abil.dex) || 10); });
    B.card(['{y}INITIATIVE{/}  ' + B.order.map(function (u) { return B.shortName(u) + ' ' + u.initRoll; }).join(' · ')], 360);
    yield 50;
    while (true) {
      B.round++;
      if (B.round > WV.CFG.stall) {
        B.units.forEach(function (u) { if (u.side === 'foe' && !u.dead) { u.left = true; u.dead = true; } });
        B.card(['{g}The rest of them melt back into the dark.{/}'], 300); yield 40; return 'cleared';
      }
      for (var i = 0; i < B.order.length; i++) {
        var u = B.order[i];
        if (u.dead || u.away) continue;
        B.active = u;
        if (u.side === 'party' && !u.guest && !u.ally) yield* B.heroTurn(u);
        else yield* D.ai.turn(B, u);
        B.active = null;
        if (B.readyArmed()) yield* B.readyAfter({ turnOf: u });
        if (D.familiar && !u.familiar) yield* D.familiar.after(B, u);
        B.sweep();
        // the end staged for a look (&end=lamp or &end=wipe -- a show door, 10-07: his "&lamp=1 didn't show the ending"; a lamp at 1 HP waits on a blow that lands on it):
        // after the first foe's turn the lamp is out, or no Mascot stands, and the run ends as it would
        if (S.end0 && u.side === 'foe') {
          B.card(['{c}THE SHOW{/}: the end, staged (&end=' + S.end0 + ').'], 240);
          if (S.end0 === 'lamp') S.lamp.hp = 0; else four(B).forEach(function (m) { m.hp = 0; m.ko = true; });
          S.end0 = null; yield 30;
        }
        var o = waveOver(B, S);
        if (o) { S.last = u; return o; }
        i = B.order.indexOf(u);
      }
    }
  }

  // ------------------------------------------------------------------ the XP (fudged to the tier: his "we'll fudge the numbers on xp if we have to")
  // (past tier 9 there is no level to reach: each takes a quarter of the wave's own XP, banked for the show)
  function award(B, S, waves, wi) {
    var target = R.XP_LEVEL[Math.min(10, S.tier + 1)], rest = 0, w = WV.xpOf(waves[wi]), lines = [];
    for (var j = wi; j < waves.length; j++) rest += WV.xpOf(waves[j]);
    four(B).forEach(function (u) {
      var have = S.xp[u.mpmon] || 0, share = S.tier > 9 ? Math.ceil(w / 4) : Math.max(0, Math.ceil((target - have) * w / Math.max(1, rest))), down = !standingM(u);
      if (down) share = Math.floor(share / 2);
      S.xp[u.mpmon] = have + share;
      lines.push(u.name + ' {g}+' + share + '{/}' + (down ? ' {o}(down: half){/}' : ''));
    });
    return lines;
  }

  // ------------------------------------------------------------------ the bed: the rest that is due, lit; his click takes it
  function* bedRest(B, S, kind) {
    var st = B.gs, bed = WV.bed, party = S.party || four(B);   // (the four: on the field or carried in the token, GS.gather)
    st.mode = 'rest'; st.clicks = []; S.rest = { due: kind, t0: B.t };
    yield* B.camTo({ gx: bed[0], gy: bed[1], gz: 0 }, 1.25, W(30));
    D.sfx('popup');
    var wait = 0;
    while (true) {
      var ck = st.clicks.shift();
      if (ck) {
        var hit = WV.hit(ck), sq = !hit && D.iso.pick(ck.x, ck.y, 0);
        if (hit === kind || (sq && WV.cots.some(function (c) { return c[0] === sq.x && c[1] === sq.y; })) || (sq && sq.x === bed[0] && sq.y === bed[1])) break;
      }
      if (S.auto && ++wait > W(90)) break;
      yield 1;
    }
    S.rest = null; st.mode = 'fight'; D.sfx('confirm');
    var lines = [];
    // whatever the wave left on the field goes with the hour: the bodies, the spells, the conditions
    B.units = B.units.filter(function (u) { return u.side !== 'foe' && !u.summon; });
    ['grounds', 'auras', 'wards', 'spirits', 'darks', 'zones', 'beads', 'walls', 'shells', 'oils'].forEach(function (k) { if (B[k]) B[k] = []; });
    B.webs = (B.webs || []).filter(function (w) { return w.ground; }); B.wallMap = null; B.lightMap = null;
    party.forEach(function (u) { if (u.conc && D.magic && D.magic.endConc) D.magic.endConc(B, u, 'rest'); u.conds = {}; u.temp = kind === 'long' ? 0 : u.temp; });
    if (kind === 'short') {
      lines.push('{y}SHORT REST{/} at the cots.');
      party.forEach(function (u) { lines.push(u.name + ': ' + shortRest(B, u, S)); });
    } else {
      lines.push('{y}LONG REST{/}: the night at the cots, and the dwarves\' wardens mend the lamp.');
      var ups = [], made = party.map(function (u) {
        var L0 = u.lvl || 1, L = Math.max(L0, levelFor(S.xp[u.mpmon] || 0));
        var n = rebuild(B, u, L); S.hd[n.mpmon] = L;
        if (L > L0) ups.push(n.name + ' is level ' + L);
        return n;
      });
      // (made anew: the token and the ones it carries are the new four)
      var P = st.party, swap = function (u) { var k = party.indexOf(u); return k >= 0 ? made[k] : u; };
      if (P) { P.token = swap(P.token); P.rest = P.rest.map(swap); }
      S.party = made; party = made;
      S.lampHP = S.lampMax = WV.CFG.lampHP(S.tier + 1);
      if (ups.length) { lines.push('{y}LEVEL UP!{/}  ' + ups.join(' · ')); D.sfx('levelup'); party.forEach(function (u) { if (B.units.indexOf(u) >= 0) FX.sparkle(u, 'gold', 20); }); }
    }
    G.setup(G.map, B.units);
    B.card(lines, W(480)); yield W(150);
  }

  // ------------------------------------------------------------------ after a wave (Griz, 10-07, after watching tier 1: "when combat ends, don't auto-popup the rest - do the
  // token combine - walk around to the chest, check in with chat - then walk to bed and interact as party token"): the four into one where they stand (the fallen carried
  // in), the token to the chest -- it opens; THE CHEST, check in with chat (the supplies' seat's buttons hang here: GS.supplies) till his click -- then to the bed, where the
  // due rest lights for its click; then out to the circle and onto its corners
  // a walkable square beside a prop (the chest, the tower), not `not`; on a cot or the bed
  function beside(at, not) {
    return at && [[0, 1], [1, 1], [-1, 1], [1, 0], [-1, 0], [0, -1]].map(function (d) { return [at[0] + d[0], at[1] + d[1]]; }).filter(function (q) {
      var s = G.map.at(q[0], q[1]); return s && s.walk && !(not && q[0] === not[0] && q[1] === not[1]);
    })[0];
  }
  function onBed(q) { return (q.x === WV.bed[0] && q.y === WV.bed[1]) || (WV.cots || []).some(function (c) { return c[0] === q.x && c[1] === q.y; }); }
  function* afterWave(B, S, kind) {
    var st = B.gs;
    B.order = []; B.active = null;   // (the strip of the wave just fought off the screen)
    S.party = four(B); S.trail = [];
    if (!(yield* GS.gather(B, { party: S.party }))) return;
    S.trail.push('gather');
    var cs = G.map.def.chest, side = beside(cs);
    // THE LAMP'S TURN (10-07, Griz, on the after-wave row: "I'm hoping for player (my) control after the token merge" · "you could walk the token over near the lamp
    // first - then lamp turn while I talk to chat, then i can send the party token to the supply box and then to bed"): the token to the tower by itself; then it is
    // his -- chat, the lantern's buttons (the supplies' seat's) -- till his click sends it to the chest (TO THE CHEST, or the chest) or straight to the bed (TO THE
    // BED, the bed or a cot); &oldwalk the walk as it was (the chest, then the bed)
    var go = 'chest';
    if (!S.oldwalk) {
      var nl = beside(G.map.def.tower, side);
      if (nl) { yield* GS.tokenWalk(B, nl); S.trail.push('lamp'); }
      st.mode = 'lamp'; st.clicks = []; S.chat = { t0: B.t };
      for (var w0 = 0; ; w0++) {
        var c0 = st.clicks.shift();
        if (c0) {
          var h0 = WV.hit(c0), q0 = !h0 && D.iso.pick(c0.x, c0.y, 0);
          if (h0 === 'tochest' || (q0 && cs && q0.x === cs[0] && q0.y === cs[1])) { go = 'chest'; break; }
          if (h0 === 'tobed' || (q0 && onBed(q0))) { go = 'bed'; break; }
        }
        if (S.auto && w0 > W(90)) break;
        yield 1;
      }
      S.chat = null; st.mode = 'fight'; D.sfx('confirm');
    }
    if (side && go === 'chest') {
      yield* GS.tokenWalk(B, side); S.trail.push('chest');
      if (D.circles && D.circles.chest) D.circles.chest(B, 'open');
      st.mode = 'chest'; st.clicks = []; S.chat = { t0: B.t };
      if (GS.supplies) yield* GS.supplies(B, { tier: S.tier, wave: S.wi + 1, run: S, at: 'chest' }); // (the supplies' seat: the lane's §3 C)
      for (var wait = 0; ; wait++) {
        var ck = st.clicks.shift();
        if (ck) { var hit = WV.hit(ck), sq = !hit && D.iso.pick(ck.x, ck.y, 0); if (hit === 'onward' || (sq && ((sq.x === cs[0] && sq.y === cs[1]) || (sq.x === WV.bed[0] && sq.y === WV.bed[1])))) break; }
        if (S.auto && wait > W(90)) break;
        yield 1;
      }
      S.chat = null; st.mode = 'fight'; D.sfx('confirm');
      if (D.circles && D.circles.chest) D.circles.chest(B, 'close');
    }
    yield* GS.tokenWalk(B, WV.bed); S.trail.push('bed');
    yield* bedRest(B, S, kind);
    yield* GS.scatter(B); S.trail.push('scatter');
    S.party = null;
  }

  // ------------------------------------------------------------------ the run
  GS.waves = function* (B, GSx) {
    var q = GS.q || location.search;
    var num = function (k) { var m = new RegExp('[?&]' + k + '=(\\d+)').exec(q); return m ? +m[1] : null; };
    var S = GS.run = { tier: Math.max(1, Math.min(99, num('tier') || 1)), wi: Math.max(0, (num('wave') || 1) - 1), count: 0, held: 0, xp: {}, hd: {}, foes: [], rest: null,
      ai: /[?&](auto|watch)\b/.test(q), auto: /[?&]auto\b/.test(q), oldwalk: /[?&]oldwalk\b/.test(q), end0: (/[?&]end=(lamp|wipe)\b/.exec(q) || [])[1] || null };
    S.lampHP = S.lampMax = num('lamp') || WV.CFG.lampHP(S.tier);
    var st = B.gs; B.cine = false; st.mode = 'fight'; st.lock = null; st.clicks = [];
    // the play record (10-07, Griz: "is saving the stream fights a less than 5 minute fix?"): the whole run one fight in deep16.plays, kept at each round's top
    // (js/record.js, battle.js) and as the tab goes; R on the tester ladder saves it with the rest. Never a bench's
    if (D.rec && D.rec.start && !B.rec && !B.bench && !(B.o && B.o.bench)) D.rec.start(B, { fight: 'gameshow', name: 'The Game Show from tier ' + S.tier, level: Math.min(9, S.tier) });
    // the cots off the map (its `y` squares) and the bed, the floor beside the first of them
    WV.cots = []; (G.map.def.rows || []).forEach(function (r, y) { for (var x = 0; x < r.length; x++) if (r.charAt(x) === 'y') WV.cots.push([x, y]); });
    var c0 = WV.cots[0] || G.map.def.circle.at;
    WV.bed = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]].map(function (d) { return [c0[0] + d[0], c0[1] + d[1]]; }).filter(function (q) { var s = G.map.at(q[0], q[1]); return s && s.walk; })[0] || c0;
    WV.B = B; WV.S = S; W = (GS._ && GS._.W) || function (n) { return n; };
    // the run's start at a later tier (&tier=N): the four at that level (9 at most), their XP at its threshold
    var L0 = Math.min(9, S.tier);
    four(B).forEach(function (u) {
      if (S.ai) { u.guest = true; u.classAI = true; }
      S.xp[u.mpmon] = R.XP_LEVEL[L0] || 0;
      var n = L0 > 1 ? rebuild(B, u, L0) : u; S.hd[n.mpmon] = n.lvl || L0;
    });
    lampUp(B, S);
    if (WV.CFG.roadLight > 0) {
      WV.CFG.roadLamps.forEach(function (p, i) { B.lights.push({ id: 'road' + i, kind: 'map', x: p[0], y: p[1], bright: 5, dim: WV.CFG.roadLight, color: 'gold', flame: false }); }); // (bright on its own square, so the lantern reads lit; dim round it)
      if (!G.map.props.some(function (pp) { return pp.kind === 'roadlamp'; })) { WV.CFG.roadLamps.forEach(function (p) { G.map.props.push(lanternProp(G.map, p)); }); G.map.sorted = null; }
      B.lightMap = null;
    }
    var pw0 = B.paint; B.paint = function (ctx) { pw0.apply(this, arguments); WV.hud(ctx, this); };
    while (true) {
      var waves = WV.tierWaves(S.tier);
      if (S.tier === 10 && S.wi === 0) { B.card(['{y}PAST THE NINTH.{/}  The deep keeps coming: every tier from here, more of them.'], W(360)); yield W(90); }
      B.card(['{y}TIER ' + S.tier + '{/}  ' + waves.length + ' waves' + (S.tier >= 7 ? ', the last a boss' : '') + '.  Keep the lamp lit.'], W(360)); yield W(90);
      for (; S.wi < waves.length; S.wi++) {
        var wave = waves[S.wi]; S.count++;
        D.music(wave.boss ? 'boss' : 'battle');
        yield* comeIn(B, S, wave);
        var how = yield* fight(B, S);
        if (how === 'lamp' || how === 'wipe') {
          var villain = how === 'lamp' && S.last && S.last.side === 'foe' && G.standing(S.last) ? S.last : WV.villain(B);
          B.card([how === 'lamp' ? '{r}THE LAMP BREAKS.{/}' : '{r}NO ONE IS LEFT STANDING.{/}  ' + (villain ? B.shortName(villain) + ' turns to the lamp.' : '')], W(300)); yield W(80);
          S.end = how;
          yield* GS.gameOver(B, villain, { waves: S.held, tier: S.tier });
          return;
        }
        S.held++; S.lampHP = S.lamp.hp;
        D.music(null); D.sfx('popup');
        var xl = award(B, S, waves, S.wi);
        B.card(['{y}WAVE ' + (S.wi + 1) + ' OF ' + waves.length + ' HELD.{/}  XP: ' + xl.join(' · ')], W(420)); yield W(120);
        var last = S.wi === waves.length - 1;
        // the lamp off the field for the rest, back after it (its hit points kept, or made whole by the long rest)
        B.units = B.units.filter(function (u) { return u !== S.lamp; });
        yield* afterWave(B, S, last ? 'long' : 'short');
        // (all four back on the field and still before anyone rolls: the token's walk-out is the show's, js/gameshow.js)
        for (var g = 0; g < 600 && (four(B).length < 4 || four(B).some(function (u) { return u.tween || u.anim === 'walk'; })); g++) yield 1;
        lampUp(B, S);
      }
      S.tier++; S.wi = 0;
    }
  };
  var W = function (n) { return n; };
  // the one that walks to the lamp when no Mascot stands (his "slow mo walk to the lamp by surviving villain"): the toughest still up, the nearest the lamp of those
  WV.villain = function (B) {
    var tw = G.map.def.tower, up = B.units.filter(function (u) { return u.side === 'foe' && G.standing(u) && !u.left; });
    up.sort(function (a, b) { return (R.CR_XP[String(b.cr)] || 0) - (R.CR_XP[String(a.cr)] || 0) || (Math.hypot(a.x - tw[0], a.y - tw[1]) - Math.hypot(b.x - tw[0], b.y - tw[1])); });
    return up[0] || null;
  };

  // ------------------------------------------------------------------ the picture: the run's line, the lamp, the bed lit and its two buttons
  var BTN = {};
  WV.hit = function (ck) { for (var id in BTN) { var b = BTN[id]; if (b && ck.x >= b.x && ck.x <= b.x + b.w && ck.y >= b.y && ck.y <= b.y + b.h) return id; } return null; };
  function P(r, i) { return D.PAL.ramps[r][i]; }
  WV.hud = function (ctx, B) {
    var S = GS.run, st = B.gs; BTN = {};
    if (!S || !st || (st.mode !== 'fight' && st.mode !== 'rest' && st.mode !== 'chest' && st.mode !== 'lamp')) return;
    if (st.mode === 'chest' && S.chat) chestPanel(ctx, B, S);
    if (st.mode === 'lamp' && S.chat) lampPanel(ctx, B, S);
    var Wd = D.W, waves = WV.tierWaves(S.tier) || [], x = Wd - 132, y = D.H - 102;   // (bottom right, over the unit panel: the cards and the strip keep the top)
    D.win8(ctx, x, y, 128, 30);
    D.text(ctx, 'TIER ' + S.tier + '  WAVE ' + Math.min(waves.length, S.wi + 1) + '/' + waves.length, x + 6, y + 5, P('gold', 4));
    var L = S.lamp, hp = L && B.units.indexOf(L) >= 0 ? L.hp : S.lampHP, mx = S.lampMax || 1, k = Math.max(0, Math.min(1, hp / mx));
    D.text(ctx, 'LAMP', x + 6, y + 17, P('bone', 1));
    ctx.fillStyle = P('outline', 0); ctx.fillRect(x + 36, y + 18, 60, 6);
    ctx.fillStyle = k > 0.5 ? P('gold', 4) : k > 0.25 ? P('fire', 2) : P('red', 3); ctx.fillRect(x + 37, y + 19, Math.round(58 * k), 4);
    D.text(ctx, Math.max(0, hp) + '', x + 100, y + 17, P('bone', 1));
    if (st.mode === 'rest' && S.rest) restPanel(ctx, B, S);
  };
  // the lamp's turn: the box over the top, and his two ways on (a click on the chest, or on the bed or a cot, does the same)
  function lampPanel(ctx, B, S) {
    var Wd = D.W, w = 236, x = Math.round(Wd / 2 - w / 2), y = 50;
    D.win8(ctx, x, y, w, 58);
    D.text(ctx, 'THE LAMP', Wd / 2, y + 5, P('gold', 4), 'center');
    D.text(ctx, 'check in with chat', Wd / 2, y + 18, P('bone', 1), 'center');
    var by = y + 33;
    D.win8(ctx, x + 10, by, 104, 18, P('red', 1)); D.text(ctx, 'TO THE CHEST', x + 62, by + 5, P('gold', 4), 'center');
    BTN.tochest = { x: x + 10, y: by, w: 104, h: 18 };
    D.win8(ctx, x + w - 114, by, 104, 18, P('red', 1)); D.text(ctx, 'TO THE BED', x + w - 62, by + 5, P('gold', 4), 'center');
    BTN.tobed = { x: x + w - 114, y: by, w: 104, h: 18 };
  }
  // the chest's moment: the box over the top, and the button on to the bed (a click on the chest or the bed does the same)
  function chestPanel(ctx, B, S) {
    var Wd = D.W, w = 236, x = Math.round(Wd / 2 - w / 2), y = 50;
    D.win8(ctx, x, y, w, 58);
    D.text(ctx, 'THE CHEST', Wd / 2, y + 5, P('gold', 4), 'center');
    D.text(ctx, 'check in with chat', Wd / 2, y + 18, P('bone', 1), 'center');
    var bx = Math.round(Wd / 2 - 60), by = y + 33;
    D.win8(ctx, bx, by, 120, 18, P('red', 1)); D.text(ctx, 'ON TO THE BED', bx + 60, by + 5, P('gold', 4), 'center');
    BTN.onward = { x: bx, y: by, w: 120, h: 18 };
  }
  // a road lamp: a dwarf lantern set on the floor at the hall's edge -- an iron cage, gold glass, the flame flickering, a little glow on the stone (world pixels, as the tower's
  // own lamp is drawn: js/circles.js towerProp)
  function lanternProp(m, at) {
    var sq = m.at(at[0], at[1]);
    return { kind: 'roadlamp', sq: sq, depth: at[0] + at[1] + 0.4, gz: sq ? sq.gz : 0, draw: function (ctx) {
      var p = D.iso.center(at[0], at[1], sq ? sq.gz : 0), s = D.iso.toScreen(p.x, p.y), x = Math.round(s.x), y = Math.round(s.y);
      var t = Date.now() / 16, fl = Math.sin(t / 5 + at[0]) + Math.sin(t / 3.3 + at[1]);
      ctx.globalAlpha = 0.2 + 0.06 * fl; ctx.fillStyle = P('fire', 2); ctx.beginPath(); ctx.ellipse(x, y, 18, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = P('outline', 0); ctx.fillRect(x - 6, y - 3, 13, 3);                         // its foot
      ctx.fillRect(x - 6, y - 18, 2, 15); ctx.fillRect(x + 5, y - 18, 2, 15); ctx.fillRect(x - 6, y - 19, 13, 2); // the cage
      ctx.fillRect(x - 3, y - 22, 7, 3); ctx.fillStyle = P('gold', 1); ctx.fillRect(x - 1, y - 25, 3, 3); ctx.fillStyle = P('outline', 0); ctx.fillRect(x, y - 24, 1, 1); // the cap, the ring
      ctx.fillStyle = P('gold', 3); ctx.fillRect(x - 4, y - 17, 9, 14); ctx.fillStyle = P('gold', 4); ctx.fillRect(x - 4, y - 17, 2, 14);
      ctx.fillStyle = P('outline', 0); ctx.fillRect(x, y - 17, 1, 14);                            // the cage's middle bar
      ctx.fillStyle = P('fire', 1); ctx.fillRect(x - 2, y - 13 - (fl > 0.8 ? 1 : 0), 5, 7);
      ctx.fillStyle = P('fire', 2); ctx.fillRect(x - 1, y - 11 - (fl > 0.3 ? 1 : 0), 3, 4);
      ctx.fillStyle = P('bone', 2); ctx.fillRect(x, y - 8, 1, 2);
    } };
  }
  function restPanel(ctx, B, S) {
    var due = S.rest.due, pulse = 0.5 + 0.5 * Math.sin((B.t - S.rest.t0) / 8);
    // the cots lit: a glow on each, the due rest's colour
    WV.cots.forEach(function (c) {
      var p = D.iso.center(c[0], c[1], G.map.gz(c[0], c[1])), s = D.iso.toScreen(p.x, p.y), z = D.iso.zoom;
      ctx.globalAlpha = 0.25 + 0.3 * pulse; ctx.fillStyle = due === 'long' ? P('gold', 4) : P('glow', 2);
      ctx.beginPath(); ctx.moveTo(s.x, s.y - 8 * z); ctx.lineTo(s.x + 16 * z, s.y); ctx.lineTo(s.x, s.y + 8 * z); ctx.lineTo(s.x - 16 * z, s.y); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    });
    var Wd = D.W, w = 236, x = Math.round(Wd / 2 - w / 2), y = 50;
    D.win8(ctx, x, y, w, 46);
    D.text(ctx, 'THE BED', Wd / 2, y + 5, P('gold', 4), 'center');
    [['short', 'SHORT REST'], ['long', 'LONG REST']].forEach(function (b, i) {
      var bx = x + 10 + i * 112, by = y + 20, on = b[0] === due;
      D.win8(ctx, bx, by, 104, 18, on ? (b[0] === 'long' ? P('red', 1) : P('moss', 1)) : null);
      D.text(ctx, b[1], bx + 52, by + 5, on ? P('gold', 4) : P('accent', 2), 'center');
      if (on) BTN[b[0]] = { x: bx, y: by, w: 104, h: 18 };
    });
  }
})();
