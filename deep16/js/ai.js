/* DEEP16 — the foes (and any guest), simple and honest (spec §2): move toward the nearest hero you can reach and hit
   it; ranged foes hold at range and shoot the lowest-AC target in sight; a foe at a quarter of its HP or less breaks
   away from the nearest hero -- without Disengage, so the player's opportunity attacks get tested; a spellcaster
   throws its area at the biggest cluster. The phase spider bites and fades into the Ethereal, then steps back out of
   the rock beside the weakest hero. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx;
  var AI = D.ai = {};

  // "The troll", but "Willem" (a foe with a name of its own is `named`)
  function the(B, u) { return (u.named ? '' : 'The ') + B.shortName(u); }
  // the foes a creature knows of: those it can see (magic.js seeWhy: the light, the dark, its darkvision, the fog, the invisible)
  // and any beside it (heard, felt); a hidden one only beside it (torchdark, 09-28)
  function heroes(B, u) {
    var ch = u.conds && u.conds.charmed, charmer = ch && ch.by; // (charmed: never its charmer -- SRD 5.1; Charm Person, Animal Friendship)
    // (a familiar riding its wizard is no one's target; a darkmantle riding the one it is attached to is -- battle.js mount: the class AI's foes too, tactics.js
    // foesOf, or a fight stalls on one nobody will strike, 10-01 bench)
    // (blindsight perceives without sight -- SRD 5.1 -- so a hidden one inside its reach is known to it: the bulette's tremorsense under the road found no hidden Vivian 10 ft
    // off and the Breach never ended, 10-02)
    var seen = B.units.filter(function (w) { return w.side !== u.side && G.standing(w) && !(w.riding && !w.attached) && w.id !== charmer && (((!w.conds.hidden || D.magic.inMirror(B, u, w) || (u.blindsight && G.dist(u, w) <= u.blindsight)) && D.magic.sees(B, u, w)) || G.dist(u, w) <= 5); }); // (the Mirror's eye: no hiding before it)
    if (seen.length) return seen;
    // nothing seen (inside a Darkness, blinded, the dark with no darkvision): it goes by ear -- toward the nearest it knows is there,
    // and swings or shoots at the unseen (the -4, the disadvantage). Nobody stands still all fight (the raid's stall, 09-28)
    return B.units.filter(function (w) { return w.side !== u.side && G.standing(w) && !(w.riding && !w.attached) && !w.conds.hidden && w.id !== charmer; }).sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); });
  }
  // the creature's own eyes from another square (the AI weighing a move)
  function eyesAt(u, x, y) { return { x: x, y: y, size: u.size || 1, darkvision: u.darkvision, blindsight: u.blindsight, blind: u.blind, truesight: u.truesight, devilSight: u.devilSight, seeInvisible: u.seeInvisible, conds: u.conds }; }
  // the square to walk to: in reach of the target for least movement, else as close as the move allows
  function approach(u, tgt, rm, reach) {
    var best = null, bs = Infinity;
    Object.keys(rm).forEach(function (k) {
      var e = rm[k];
      if (!e.stand) return;
      var d = G.dist(u, tgt, e.x, e.y), s = (d <= (reach || G.reachOf(u)) ? 0 : 1000 + d * 10) + e.cost;
      if (s < bs) { bs = s; best = e; }
    });
    // nothing this turn's move reaches is in reach of the target, on a map with a high face (10-04, the Edifice: the AI stood at the foot of a 45 ft face, nearest the one it hunts, and
    // the stair round the east end was never "closer"): the way is the cheapest whole route to any square in reach of it, walked as far as the move allows
    // (a single step the move cannot pay but a Dash would -- a climber's 45 ft face -- is on the route while the action is free: the brute dashes toward the foot and up it next turn, or this one)
    if (bs >= 1000 && G.tall && G.tall() && !u.flies) {
      var far = G.reach(u, 600, { noRope: true, maxStep: (u.speed || 30) * (u.turn && u.turn.action > 0 && !u.conds.restrained ? 2 : 1) }), goal = null, gc = Infinity, rch = reach || G.reachOf(u);
      Object.keys(far).forEach(function (k) { var f = far[k]; if (f.stand && f.cost < gc && G.dist(u, tgt, f.x, f.y) <= rch) { gc = f.cost; goal = f; } });
      var route = goal && G.path(far, goal.x, goal.y);
      if (route) for (var ri = route.length - 1; ri >= 0; ri--) { var re = rm[route[ri][0] + ',' + route[ri][1]]; if (re && re.stand) return re; }
    }
    return best;
  }
  function* walkTo(B, u, e, o) {
    if (!e || (e.x === u.x && e.y === u.y)) return;
    var rm = G.reach(u, u.turn.move, o), path = G.path(rm, e.x, e.y);
    if (path && path.length) yield* B.moveAlong(u, path, { spend: true, noOA: o && o.ghost });
  }

  AI.turn = function* (B, u) {
    var wasStill = !u.acted && !u.woken; // (the roper's False Appearance: a stalagmite till its first turn or a wound -- js/ui.js)
    RU.startTurn(u);
    if (u.dead) return;
    if (u.conds.surprised && D.features && D.features.feral && (yield* D.features.feral(B, u))) delete u.conds.surprised; // (Feral Instinct, js/features.js: he rages, and acts)
    if (u.conds.surprised) { delete u.conds.surprised; B.card(['{g}' + (u.side === 'foe' ? the(B, u) : u.name) + ' is caught unaware: no turn this round.{/}']); yield 30; return; }
    if (u.conds.recoiling) { delete u.conds.recoiling; B.card(['{g}' + the(B, u) + ' recoils from the light, shrinking up away from it: no turn.{/}']); yield 30; return; }
    // a troll down at 0 (battle.js hurt, u.regenDown): its turn starts it knitting -- up at its regeneration, still prone (it stands for half its move) -- or, if it burned since
    // its last turn, it does not, and it dies there (SRD 5.1 Regeneration; 10-05, Griz: "i think the regen is there it's just turning off when they die")
    if (u.regenDown && !u.dead) {
      delete u.regenDown;
      if (u.burned) { u.burned = false; u.dead = true; u.deadT = B.t; D.sfx('die'); B.card(['{y}' + the(B, u, true) + ' does not knit: it burned. It is dead.{/}'], 300); yield 30; return; }
      B.heal(u, u.regen);
      if (!(u.hp > 0)) { u.dead = true; u.deadT = B.t; D.sfx('die'); B.card(['{y}' + the(B, u) + ' cannot knit: it is dead.{/}'], 300); yield 30; return; } // (no healing on it -- Chill Touch: it did not regenerate)
      u.regenRose = true; u.anim = 'idle'; u.animT = B.t; FX.sparkle(u, 'moss', 14);
      B.card(['{r}' + the(B, u, true) + '{/} knits back together and stirs.  +' + u.regen + '  {g}(fire or acid keeps a troll down){/}'], 300); yield 30;
    }
    if (u.hp <= 0) { B.card(['{g}' + u.name + ' is down.{/}']); yield 30; return; }
    if (!RU.canAct(u) && !u.ethereal) { B.card(['{g}' + (u.side === 'foe' ? the(B, u) : u.name) + (u.conds.asleep ? ' sleeps.' : u.conds.paralyzed ? ' is held fast.' : u.conds.stunned ? ' is stunned.' : ' cannot act.') + '{/}']); yield 30; D.magic.endTurn(B, u); return; }
    if (!u.ethereal || u.under) B.focus(u); // (a burrower under the ground: the camera on its mound)
    // clinging to a face part way up (a slow climb speed: battle.js moveAlong, 10-04 night): the climb goes on before anything else; still on the face after, the turn is spent
    if (u.hang && u.hang.face && G.hanging(u)) { yield* B.moveAlong(u, [u.hang.face], { spend: true }); if (u.hang && G.hanging(u)) { yield 20; return; } }
    // the clacker strikes its hooks together as its turn begins, the clacking that is their speech (10-01, Griz's sheet's CLACK row;
    // data/foes.js clacker): the row plays once (js/ui.js), a clack on each strike, then the turn
    if (u.kind && D.FOES[u.kind] && D.FOES[u.kind].clacks && !u.conds.banished) {
      u.anim = 'clack'; u.animT = B.t; yield 12; D.sfx('clack'); yield 12; D.sfx('clack'); yield 12; u.anim = 'idle';
    }
    // the roper stood as a stalagmite (its Still row) till now: its Reveal plays first -- the eye opens, the tendrils come out of it --
    // then it acts (10-01e, the Blender roper; SRD 5.1 False Appearance: indistinguishable from a cave formation while motionless)
    if (wasStill && D.spr.anim(u.sheet, 'still') && D.spr.anim(u.sheet, 'reveal') && !u.conds.banished) {
      u.anim = 'reveal'; u.animT = B.t; yield D.spr.duration(u.sheet, 'reveal') + 4; u.anim = 'idle';
    }
    // banished, or sealed in a sphere (js/grimoire.js): no turn here
    if (u.conds.banished) { B.card(['{g}' + (u.side === 'foe' ? the(B, u) : u.name) + ' is not here.{/}'], 160); yield 16; D.magic.endTurn(B, u); u.anim = 'idle'; return; }
    // confused (Confusion): the d10 may take the turn
    if (u.conds.confused && D.magic.confusedTurn && (yield* D.magic.confusedTurn(B, u))) { D.magic.endTurn(B, u); u.anim = 'idle'; return; }
    // a word of Command it must obey (js/grimoire.js): halted, grovelling, or away from the one who spoke, and nothing more
    if (u.turn.lost) { if (u.turn.fleeFrom) yield* D.magic.flee(B, u); yield 20; D.magic.endTurn(B, u); u.anim = 'idle'; return; }
    // Fear's run (js/grimoire.js): any creature under it Dashes away from the one it fears
    if (D.magic.mustFlee && D.magic.mustFlee(u) && !u.classAI && (yield* D.tactics.fleeFear(B, u))) { D.magic.endTurn(B, u); u.anim = 'idle'; return; } // (cornered: it fights after all, js/tactics.js TX.cornered)
    if (u.conds.restrained && !(u.conds.restrained.ice && D.keeper)) { // (not the Keeper's ice: it breaks out in js/keeper.js, a bonus action and then its action) a web: tear at it first. A grip -- the class AI weighs the escape, cutting the roper's tendril, or fighting from where it is (js/tactics.js freeHow, 10-02)
      var how = u.classAI && D.tactics && D.tactics.freeHow ? D.tactics.freeHow(B, u) : 'escape';
      if (how === 'escape') yield* D.magic.breakFree(B, u); else if (how === 'strike') yield* D.tactics.strikeHeld(B, u);
    }
    // a darkmantle over its head (attached and blinding: battle.js mount): it pulls it off first -- an action, a DC 13 STR check (SRD 5.1; PULL IT OFF)
    var onMe = D.Battle.riderOn(u, u, B.units);
    if (onMe && u.turn.action && !u.conds.restrained && u.conds.blinded && u.conds.blinded.by === onMe.id) yield* B.exec(u, { do: 'detach', target: onMe });
    // the wagon yard: once Willem has been hit at the traces, in the 8-bit game's yard (runWhenHurt) each of the pair runs from its
    // own next move (battle.js startRun); on the ladder, where nobody runs, he lets the traces go and turns to fight
    if (B.hitAtTraces && u.side === 'foe') {
      if (B.fight.runWhenHurt && !u.flees && D.FOES[u.kind] && D.FOES[u.kind].flees) { B.startRun(u); yield 30; }
      else if (u.traces) { u.traces = false; B.card(['{r}' + u.name + ' lets go of the traces{/} and turns on you.'], 360); yield 30; }
    }
    // the bestiary's own turn-taking (js/traits.js): the broodmother in the rock
    var handled = u.side === 'foe' && D.traits && D.traits.turn ? yield* D.traits.turn(B, u) : false;
    if (handled) { D.magic.endTurn(B, u); u.anim = 'idle'; return; }
    if (u.traces) yield* traces(B, u);
    else if (u.familiar && D.familiar) yield* D.familiar.turn(B, u); // a wizard's familiar: Help, and the owl flies back out (js/familiar.js)
    else if (u.script && D.scripts && D.scripts[u.script]) yield* D.scripts[u.script](B, u); // a named NPC's own turn (js/pyro.js: Pyro's measure, 09-30)
    else if ((u.summon || u.dominated || u.loose || u.ally) && !u.classAI) yield* brute(B, u); // (an ally a fight lent -- the Hex's men, the garrison in the Skylights, 10-05: the brute, as a summon) // a summoned creature, or a beast dominated for its caster (js/grimoire.js) (js/grimoire.js summonSpell): it fights for its caster's side, as if commanded (RULED 09-30)
    else if (u.classAI && D.tactics) yield* D.tactics.turn(B, u); // a class NPC (js/classes.js), or a hero on the bench: the class's own tactics (js/tactics.js)
    else if (u.kind === 'phasespider') yield* spider(B, u);
    else if (u.kind === 'keeper' && u.side === 'foe' && D.keeper) yield* D.keeper.turn(B, u); // (the Keeper of the Flooded Stair: the Slam, the Wave, the deep, the Ice Wall -- js/keeper.js, 10-03)
    else if (u.burrow && u.side === 'foe') yield* burrower(B, u); // (the bulette: under the ground and up beside you, 10-01d)
    else if (u.kind === 'drow') yield* drow(B, u);
    else if (u.kind === 'drider') yield* drider(B, u);
    else if (u.weave) yield* weaver(B, u);
    else if (u.side === 'foe') yield* brute(B, u);
    else yield* guest(B, u);
    if (u.side === 'foe' && D.traits && D.traits.after) yield* D.traits.after(B, u); // (the gnoll's Rampage, the goblin's Nimble Escape)
    // a Slam's stun and a Moan's fright last till the end of the foe's next turn
    // (a stun laid with no `fresh` is not this sweep's: a spell's -- Power Word Stun, Divine Word, Symbol -- holds by its own rule, the save at the
    // end of the stunned one's turns, and a monk's Stunning Strike by its own clock, js/features.js; 09-30)
    // (not the fright of the turned -- a prayer's, a minute by the turned one's own clock, js/features.js F.setTurned. NOTE, 09-30, not touched: Fear's and
    // the Killer's fright is swept here too when an AI caster ends its turn, so `feared` stays and `frightened` does not, and M.mustFlee is false)
    B.units.forEach(function (w) { ['stunned', 'frightened'].forEach(function (c) { var s = w.conds[c]; if (s && s.by === u.id && !(c === 'stunned' && s.fresh === undefined) && !(c === 'frightened' && (w.conds.turned || (w.conds.feared && w.conds.feared.by === u.id) || (w.conds.killer && w.conds.killer.by === u.id)))) { if (s.fresh) s.fresh = false; else delete w.conds[c]; } }); }); // (a spell's fright -- Fear, Phantasmal Killer, Weird -- holds as long as the spell: RULED 09-30, Griz: "yes", it bites)
    D.magic.endTurn(B, u);
    u.anim = 'idle';
    yield 16;
  };

  // ------------------------------------------------------------------ Willem at the team's heads (the 8-bit wagon yard, a foe placed with
  // `traces`; Griz 09-27): each turn his action goes on the harness -- no step, no blow -- until a blow lands on him
  // (battle.js hurt: fight.runWhenHurt; the pair run from their next moves). He gets nowhere: nothing comes loose, the horses
  // stay hitched and the wagon stays put (Griz: they are out of the script's escape), so no line says otherwise
  var FUMBLE = ['fumbles at the traces with shaking hands.', 'drops a buckle in the dark and gropes for it.',
    'cannot find the strap end in the dark.', 'yanks at a buckle. It will not give.', 'curses the harness. Nothing comes loose.'];
  function* traces(B, u) {
    u.turn.action = 0; u.turn.move = 0; u.turn.bonus = 0;
    var n = u.fumbles = (u.fumbles || 0) + 1;
    var team = B.riders.filter(function (r) { return r.team; }).sort(function (a, b) { return Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y); })[0];
    if (team) u.facing = B.faceTo(u, { x: team.x, y: team.y, size: 1 }); // (turned to the horses, his back to the fight)
    B.card(['{o}' + u.name + '{/} ' + FUMBLE[(n - 1) % FUMBLE.length] + '  {g}(his action: the harness){/}']);
    yield 40;
  }

  // ------------------------------------------------------------------ the phase spider
  function* spider(B, u) {
    var T = u.turn, bite = u.attacks.bite, hs = heroes(B, u);
    if (!hs.length) return;
    if (u.ethereal) {
      // unseen, it walks the Ethereal to the weakest, and steps out of the rock at their side (a bonus action)
      var tgt = hs.slice().sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; })[0];
      var rm = G.reach(u, T.move, { ghost: true }), best = null, bs = Infinity;
      Object.keys(rm).forEach(function (k) {
        var e = rm[k];
        if (!G.canStand(u, e.x, e.y)) return; // must come out where there's room
        var d = G.dist(u, tgt, e.x, e.y), s = (d <= 5 ? 0 : 1000 + d * 10) + e.cost;
        if (s < bs) { bs = s; best = e; }
      });
      if (best) { u.x = best.x; u.y = best.y; T.move -= best.cost; }
      T.bonus = 0; u.ethereal = false; D.sfx('magic');
      B.focus(u);
      FX.sparkle(u, 'violet', 22); FX.ring(u, 'violet', 36);
      B.card(['{r}The phase spider{/} steps out of the rock ' + (G.dist(u, tgt) <= 5 ? 'beside ' : 'near ') + tgt.name + '!', '{g}(Ethereal Jaunt, a bonus action: back on the Material Plane){/}']);
      yield 30;
      if (B.readyHook) { yield* B.readyHook(u); if (u.dead || u.hp <= 0) return; } // (out of the Ethereal into a readier's reach or sight: the readied strikes, 10-02)
      if (G.dist(u, tgt) <= G.reachOf(u) && T.action) { T.action = 0; yield* B.attack(u, tgt, bite); }
      return;
    }
    // on this plane: bite the weakest in reach, else close and bite; then fade (a bonus action)
    var near = hs.filter(function (w) { return G.dist(u, w) <= G.reachOf(u); }).sort(function (a, b) { return a.hp - b.hp; });
    var t2 = near[0];
    if (!t2) {
      t2 = hs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
      yield* walkTo(B, u, approach(u, t2, G.reach(u, T.move)));
      if (u.dead || u.hp <= 0) return;
    }
    if (G.dist(u, t2) <= G.reachOf(u) && !t2.dead && T.action) { T.action = 0; yield* B.attack(u, t2, bite); }
    if (u.dead || u.hp <= 0) return;
    if (T.bonus) {
      T.bonus = 0; u.ethereal = true; D.sfx('run');
      FX.sparkle(u, 'violet', 22);
      B.card(['{r}The phase spider{/} fades out of the world.', '{g}(Ethereal Jaunt: it cannot be seen, struck or blocked till it steps back){/}']);
      yield 30;
    }
  }

  // ------------------------------------------------------------------ the drow captains
  function bestCube(B, u, n, range) {
    var best = null;
    for (var y0 = 0; y0 < G.map.h - 1; y0++) for (var x0 = 0; x0 < G.map.w - 1; x0++) {
      var sq = G.cube(x0, y0, n), cx = x0 + n / 2 - 0.5, cy = y0 + n / 2 - 0.5;
      if (!sq.length) continue;
      if (Math.max(Math.abs(cx - u.x), Math.abs(cy - u.y)) * 5 > range) continue;
      if (!G.losPoint(u.x, u.y, Math.round(cx), Math.round(cy))) continue;
      var got = B.units.filter(function (w) { return G.standing(w) && G.inArea(w, sq); });
      var hs = got.filter(function (w) { return w.side !== u.side; }).length, fs = got.length - hs;
      if (fs) continue;
      if (!best || hs > best.count) best = { x0: x0, y0: y0, sq: sq, count: hs };
    }
    return best;
  }
  function* faerieFire(B, u, cube) {
    var T = u.turn, ff = u.faerie;
    T.action = 0; ff.used = true;
    D.sfx('magic');
    u.anim = 'attack'; u.animT = B.t;
    FX.bloom(cube.x0 + 1.5, cube.y0 + 1.5, cube.sq, 'violet');
    var lines = ['{r}' + u.name + '{/}: FAERIE FIRE -- a 20-ft cube of violet light.  DEX DC ' + ff.dc];
    var got = B.units.filter(function (w) { return G.standing(w) && G.inArea(w, cube.sq); });
    yield 10;
    got.forEach(function (w) {
      var sv = RU.save(w, 'dex', ff.dc);
      lines.push('  ' + w.name + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{p}outlined: attacks on them have advantage{/}'));
      if (!sv.ok) w.conds.faerie = { by: u.id };
    });
    // concentration (SRD 5.1): the violet light goes out when the drow falls, is incapacitated or loses it to a blow (it lasted
    // the whole fight before, whatever became of her)
    if (got.some(function (w) { return w.conds.faerie && w.conds.faerie.by === u.id; }))
      D.magic.concentrate(B, u, 'faeriefire', 'Faerie Fire', function () { B.units.forEach(function (w) { if (w.conds.faerie && w.conds.faerie.by === u.id) delete w.conds.faerie; }); });
    B.card(lines, 420);
    yield { fx: 1 };
    yield 30;
  }
  function visibleFrom(u, x, y, hs) { return hs.filter(function (w) { var l = G.los(u, w, x, y); return l.clear && D.magic.sees(D.battle, eyesAt(u, x, y), w); }); }
  // a bright light near the drow: they throw their Darkness at once, to swallow it (the Light cantrip, a torch); else on the 8-bit's chance
  function wantsDark(B, u) { return D.light.brightNear(B, u, 60) || D.d(100) <= u.darkness.chance * 100; }
  function* drow(B, u) {
    var T = u.turn, hs = heroes(B, u), bow = u.attacks.crossbow, blade = u.attacks.shortsword, self = this;
    if (!hs.length) { B.card(['{g}The captain looks for someone to shoot and finds no one.{/}']); yield 30; return; }
    // innate Darkness, once (the 8-bit's chance, or at once to swallow a Light): review 09-28 #6
    if (u.darkness && u.darkness.chance != null && !u.darkness.used && T.action && wantsDark(B, u)) {
      if (yield* D.magic.castDarkness(B, u)) return;
    }
    // Faerie Fire, once: on the biggest cluster (two or more, or anyone on the first round)
    if (u.faerie && !u.faerie.used && T.action) {
      var cube = bestCube(B, u, u.faerie.cube, u.faerie.range);
      if (cube && (cube.count >= 2 || (B.round === 1 && cube.count >= 1))) { yield* faerieFire(B, u, cube); return; }
    }
    var adj = hs.filter(function (w) { return G.dist(u, w) <= 5; });
    // a quarter of its HP or less: break away (no Disengage), then shoot
    if (u.hp <= u.maxhp / 4) {
      var rm = G.reach(u, T.move), best = null, bs = -1;
      Object.keys(rm).forEach(function (k) {
        var e = rm[k]; if (!e.stand) return;
        var near = Math.min.apply(null, hs.map(function (w) { return G.dist(u, w, e.x, e.y); }));
        var s = near + G.gzAt(u, e.x, e.y) / G.map.def.step * 5 - e.cost / 20; // (height in steps: the ledge is worth 10, as when a step was 20 px)
        if (s > bs) { bs = s; best = e; }
      });
      B.card(['{r}' + u.name + '{/} breaks away, bleeding.']);
      yield 20;
      yield* walkTo(B, u, best);
      if (u.dead || u.hp <= 0) return;
      hs = heroes(B, u);
    } else if (adj.length) {
      // pressed: two shortsword cuts at the weakest in reach
      if (!T.action) return;
      T.action = 0;
      for (var a = 0; a < u.multi; a++) {
        var tg = heroes(B, u).filter(function (w) { return G.dist(u, w) <= 5; }).sort(function (p, q) { return p.hp - q.hp; })[0];
        if (!tg) break;
        yield* B.attack(u, tg, blade);
        if (u.dead || u.hp <= 0) return;
      }
      return;
    } else {
      // hold at range: a square in reach from which the lowest-AC hero is in plain range, not beside anyone; the ledge preferred
      var rm2 = G.reach(u, T.move), pick = null, ps = -1e9;
      Object.keys(rm2).forEach(function (k) {
        var e = rm2[k]; if (!e.stand) return;
        var vis = visibleFrom(u, e.x, e.y, hs).filter(function (w) { return G.dist(u, w, e.x, e.y) <= bow.range[1]; });
        if (!vis.length) return;
        var tgt = vis.sort(function (p, q) { return RU.ac(p) - RU.ac(q) || p.hp - q.hp; })[0];
        var d = G.dist(u, tgt, e.x, e.y), besides = G.foesNear(u, e.x, e.y, 5).length;
        var s = (d <= bow.range[0] ? 6 : 0) - besides * 12 + (G.gzAt(u, e.x, e.y) ? 3 : 0) - e.cost / 10 + (e.cost === 0 ? 1 : 0) - RU.ac(tgt) / 4;
        if (s > ps) { ps = s; pick = e; }
      });
      if (pick) yield* walkTo(B, u, pick);
      else yield* walkTo(B, u, approach(u, hs[0], G.reach(u, T.move), bow.range[0]));
      if (u.dead || u.hp <= 0) return;
    }
    // shoot: twice, the lowest AC in sight each time
    if (!T.action) return;
    T.action = 0;
    for (var s2 = 0; s2 < u.multi; s2++) {
      var inSight = visibleFrom(u, u.x, u.y, heroes(B, u)).filter(function (w) { return G.dist(u, w) <= bow.range[1]; });
      if (!inSight.length) { B.card(['{g}The captain has no clear shot.{/}']); yield 20; break; }
      var t3 = inSight.sort(function (p, q) { return RU.ac(p) - RU.ac(q) || p.hp - q.hp; })[0];
      yield* B.attack(u, t3, bow);
      if (u.dead || u.hp <= 0) return;
    }
  }

  // ------------------------------------------------------------------ the drider (the second wave): three attacks, the bite first
  // It closes on the nearest hero it can reach this turn and fights there -- the bite at the weakest beside it, then
  // two longsword cuts; with no one in reach it stands and looses three arrows at the lowest AC in sight. Faerie Fire
  // once, only on three or more (its three attacks are worth more than the light).
  function* drider(B, u) {
    var T = u.turn, hs = heroes(B, u), sw = u.attacks.longsword, bite = u.attacks.bite, bow = u.attacks.longbow;
    if (!hs.length) return;
    if (u.faerie && !u.faerie.used && T.action) {
      var cube = bestCube(B, u, u.faerie.cube, u.faerie.range);
      if (cube && cube.count >= 3) { yield* faerieFire(B, u, cube); return; }
    }
    var inReach = function () { return heroes(B, u).filter(function (w) { return G.dist(u, w) <= G.reachOf(u); }); };
    if (!inReach().length) {
      var tgt = hs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0], e = approach(u, tgt, G.reach(u, T.move));
      if (e && G.dist(u, tgt, e.x, e.y) <= G.reachOf(u)) { yield* walkTo(B, u, e); if (u.dead || u.hp <= 0) return; }
    }
    if (!T.action) return;
    T.action = 0;
    if (inReach().length) {
      for (var a = 0; a < u.multi; a++) {
        var tg = inReach().sort(function (p, q) { return p.hp - q.hp; })[0];
        if (!tg) break;
        yield* B.attack(u, tg, a === 0 ? bite : sw);
        if (u.dead || u.hp <= 0) return;
      }
      return;
    }
    for (var s = 0; s < u.multi; s++) {
      var seen = visibleFrom(u, u.x, u.y, heroes(B, u)).filter(function (w) { return G.dist(u, w) <= bow.range[1]; });
      if (!seen.length) { B.card(['{g}The drider has no clear shot.{/}']); yield 20; break; }
      yield* B.attack(u, seen.sort(function (p, q) { return RU.ac(p) - RU.ac(q) || p.hp - q.hp; })[0], bow);
      if (u.dead || u.hp <= 0) return;
    }
  }

  // ------------------------------------------------------------------ the spell-weaver (Third Lamp, 09-27): she keeps her distance; Hold once,
  // early, on the one who hits hardest; a line of lightning when it would catch two or more (recharge 5-6); else Fire Bolt
  // at the lowest AC in sight. Pressed, she steps away first (no Disengage: the player's opportunity attack is the test).
  function bestLine(B, u, len) {
    var best = null;
    heroes(B, u).forEach(function (t) {
      var sq = D.magic.area(u, { shape: 'line', len: len }, t.x, t.y);
      var got = B.units.filter(function (w) { return G.standing(w) && G.inArea(w, sq); }), hs = got.filter(function (w) { return w.side !== u.side; }).length;
      if (got.length > hs) return; // not through her own
      if (!best || hs > best.count) best = { sq: sq, count: hs, t: t };
    });
    return best;
  }
  function* weaver(B, u) {
    var T = u.turn, W = u.weave, hs = heroes(B, u), bolt = u.attacks.firebolt;
    if (!hs.length) return;
    // innate Darkness, once (the weaver's, the 8-bit's `darkness` special; at once to swallow a Light): review 09-28 #6
    if (u.darkness && u.darkness.chance != null && !u.darkness.used && T.action && wantsDark(B, u)) {
      if (yield* D.magic.castDarkness(B, u)) return;
    }
    if (W.bolt.spent) { var rc = D.d(6); if (rc >= W.bolt.recharge) { W.bolt.spent = false; B.card(['{g}' + the(B, u) + ' ' + (W.bolt.again || 'draws the dark in again') + ' (d6 ' + rc + ').{/}'], 200); yield 12; } }
    // pressed: a step back to somewhere she can still see someone from, and no one beside her (not the naga: it bites)
    if (bolt && G.foesNear(u, u.x, u.y, 5).length) {
      var rm = G.reach(u, T.move), pick = null, ps = -1e9;
      Object.keys(rm).forEach(function (k) {
        var e = rm[k]; if (!e.stand) return;
        var vis = visibleFrom(u, e.x, e.y, hs).length; if (!vis) return;
        var s = -G.foesNear(u, e.x, e.y, 5).length * 20 + Math.min.apply(null, hs.map(function (w) { return G.dist(u, w, e.x, e.y); })) / 5 + (G.gzAt(u, e.x, e.y) ? 3 : 0) - e.cost / 10;
        if (s > ps) { ps = s; pick = e; }
      });
      if (pick && (pick.x !== u.x || pick.y !== u.y)) { B.card(['{r}The weaver{/} slips back.']); yield 12; yield* walkTo(B, u, pick); if (u.dead || u.hp <= 0) return; hs = heroes(B, u); }
    }
    if (!T.action || !hs.length) return;
    // Hold, once, in the first rounds: the hardest hitter she can see within range
    if (!W.hold.used && B.round <= 3) {
      var ht = visibleFrom(u, u.x, u.y, hs).filter(function (w) { return !w.conds.paralyzed && G.dist(u, w) <= W.hold.range && !w.fey; })
        .sort(function (a, b) { return (b.attacks || 1) * (b.lvl || 1) + b.maxhp / 20 - ((a.attacks || 1) * (a.lvl || 1) + a.maxhp / 20); })[0];
      if (ht) {
        T.action = 0; W.hold.used = true; u.anim = D.spr.anim(u.sheet, 'cast') ? 'cast' : 'attack'; u.animT = B.t; D.sfx('charm'); FX.ring(ht, 'violet', 40); FX.reach(u, ht, 'charm');
        var sv = RU.save(ht, 'wis', W.hold.dc, false, 'paralyzed');
        B.card(['{r}' + the(B, u) + '{/} ' + (W.hold.text || 'closes a hand') + ': HOLD {y}' + ht.name + '{/}.  WIS ' + RU.saveText(sv) + ' vs DC ' + W.hold.dc + '  ' + (sv.ok ? '{n}SHRUGS IT OFF{/}' : '{p}PARALYZED{/} {g}(a WIS save at the end of each turn){/}')], 400);
        if (!sv.ok) { ht.conds.paralyzed = { save: 'wis', dc: W.hold.dc, by: u.id }; D.magic.concentrate(B, u, 'holdperson', 'Hold Person', function () { if (ht.conds.paralyzed && ht.conds.paralyzed.by === u.id) delete ht.conds.paralyzed; }); }
        yield 40; u.anim = 'idle'; return;
      }
    }
    // the line of lightning, on two or more
    if (!W.bolt.spent) {
      var ln = bestLine(B, u, W.bolt.len);
      if (ln && ln.count >= 2) {
        T.action = 0; W.bolt.spent = true; u.anim = D.spr.anim(u.sheet, 'cast') ? 'cast' : 'attack'; u.animT = B.t; D.sfx('zap2');
        u.facing = B.faceTo(u, ln.t);
        FX.bloom(u.x, u.y, ln.sq, 'glow');
        var roll = D.roll(W.bolt.dice), lines = ['{r}' + the(B, u) + '{/} ' + (W.bolt.text || 'draws the dark into a line of lightning!') + '  ' + W.bolt.dice + ' ' + RU.fmtRolls(roll.rolls) + ' = ' + roll.total + '  DEX DC ' + W.bolt.dc], hits = [];
        yield 12;
        B.units.filter(function (w) { return G.standing(w) && w.side !== u.side && G.inArea(w, ln.sq); }).forEach(function (w) {
          var s2 = RU.save(w, 'dex', W.bolt.dc, false, null, roll.total), ev = RU.evasion(w);
          var n = s2.ok ? (ev ? 0 : Math.floor(roll.total / 2)) : (ev ? Math.floor(roll.total / 2) : roll.total);
          lines.push('  ' + w.name + ': ' + RU.saveText(s2) + ' ' + (s2.ok ? '{n}saved{/}' : '{o}failed{/}') + (ev ? ' {c}evasion{/}' : '') + '  {r}' + n + '{/}');
          hits.push([w, n]);
        });
        B.card(lines.slice(0, 7), 420);
        yield { fx: 1 };
        hits.forEach(function (h) { B.hurt(h[0], h[1], W.bolt.type); });
        yield 34; u.anim = 'idle'; return;
      }
    }
    // no bolt of her own (the naga): the bite, as any brute
    if (!bolt) { yield* brute(B, u); return; }
    // Fire Bolt at the lowest AC in sight
    var seen = visibleFrom(u, u.x, u.y, hs).filter(function (w) { return G.dist(u, w) <= bolt.range[1]; });
    if (!seen.length) { B.card(['{g}The weaver has no one in sight.{/}']); yield 20; return; }
    T.action = 0;
    yield* B.attack(u, seen.sort(function (p, q) { return RU.ac(p) - RU.ac(q) || p.hp - q.hp; })[0], bolt);
  }

  // ------------------------------------------------------------------ a guest (Brann, Hedda, Ingrith, Pyro): the nearest foe, Extra Attack
  // ------------------------------------------------------------------ brute: any foe with no routine of its own (the bestiary, 09-27):
  // regenerate if it can; close on the nearest hero (the weakest already in reach first); then run `multi` --
  // a list of attack names in order, or a count of the first attack -- on the weakest in reach each time
  // the bestiary's traits (09-27, the ladder): a Web shot on a recharge (the giant spider, the ettercap), a grip held
  // and a Tentacle Slam (the otyugh), a creature bound to its ground (bound: the chars of the squares it keeps to)
  // the reach it acts at: the longest of the attacks it can still use -- a seizing attack (the roper's tendril) with no tendril to spare (all holding, or cut and not regrown:
  // battle.js tendrilGone) counts for nothing, and it walks in for the bite (10-02, Griz: "have the party keep their distance and kill all the tendrils, then see if it walks
  // to bite"). gripReach: the longest of all of them, for what it holds already
  function noSpare(u, a) { return !!(a && a.holdOnly && a.grapple && (u.holding || []).length + (u.tendrilsLost || 0) >= (a.grapple.max || 1)); }
  // a seizing attack is of no use on one it holds already, or one it cannot hold (Freedom of Movement: RU.immuneTo 'grappled'; 10-02, Griz: "when feared? (or immune or
  // something)" -- a party nothing can hold is bitten, not lashed at forever): with `hs`, the heroes it knows of, the tendril's reach counts only while someone in it can be held
  function usableOn(u, a, w) { return !(a && a.holdOnly && a.grapple && (noSpare(u, a) || (u.holding || []).indexOf(w) >= 0 || RU.immuneTo(w, 'grappled') || RU.immuneTo(w, 'restrained'))); }
  function reachOf(u, hs) { var r = u.reach; Object.keys(u.attacks || {}).forEach(function (k) { var a = u.attacks[k]; if (noSpare(u, a)) return; if (hs && a.holdOnly && a.grapple && !hs.some(function (w) { return usableOn(u, a, w) && G.dist(u, w) <= G.reachOf(u, a.reach); })) return; r = Math.max(r, a.reach || 0); }); return G.reachOf(u, r); }
  function gripReach(u) { var r = u.reach; Object.keys(u.attacks || {}).forEach(function (k) { r = Math.max(r, u.attacks[k].reach || 0); }); return G.reachOf(u, r); }
  function* webShot(B, u, tgt) {
    var W = u.web, T = u.turn;
    T.action = 0; W.ready = false;
    var shot = { name: 'Web', atk: W.atk, dice: '0', mod: 0, type: 'web', range: W.range, ranged: true, fx: 'bolt' };
    u.facing = B.faceTo(u, tgt); u.anim = D.spr.anim(u.sheet, 'cast') ? 'cast' : 'attack'; u.animT = B.t; // (a sheet's throw row, if it has one: the ettercap's Web Shot)
    FX.projectile(u, tgt, 'bolt'); yield { fx: 1 };
    var e = RU.edges(u, tgt, shot), r = RU.d20(e.net), tot = r.pick + W.atk + (e.pen || 0), ac = RU.ac(tgt) + G.los(u, tgt).cover;
    var hit = r.pick === 20 || (r.pick !== 1 && tot >= ac);
    var why = (e.adv.length ? '  {n}adv: ' + e.adv.join(', ') + '{/}' : '') + (e.dis.length ? '  {o}dis: ' + e.dis.join(', ') + '{/}' : '') + (e.pen ? '  {o}' + e.penWhy + ' ' + e.pen + '{/}' : '');
    B.card(['{r}' + u.name + '{/} > {y}' + tgt.name + '{/}  WEB (recharge ' + W.recharge + '-6)', 'd20 ' + (r.rolls.length > 1 ? RU.fmtRolls(r.rolls) + '>' : '') + r.pick + ' ' + RU.sign(W.atk) + ' = ' + tot + '  vs AC ' + ac + '  ' + (hit ? '{n}HIT{/}: {o}RESTRAINED{/} {g}(escape DC ' + W.dc + ', an action){/}' : '{g}MISS{/}') + why], 360);
    D.sfx(hit ? 'hit' : 'miss');
    if (hit) { tgt.conds.restrained = { dc: W.dc, by: u.id }; FX.ring(tgt, 'bone', 26); FX.sparkle(tgt, 'bone', 12); }
    else FX.float('MISS', tgt, D.PAL.ramps.silver[5]);
    yield 34;
    u.anim = 'idle';
  }
  function* slam(B, u) {
    var S = u.slam, held = u.holding.slice();
    u.turn.action = 0; u.anim = 'attack'; u.animT = B.t;
    B.card(['{r}' + u.name + '{/}: TENTACLE SLAM -- it beats what it holds against the stone.  CON DC ' + S.dc]);
    yield 24;
    for (var i = 0; i < held.length; i++) {
      var w = held[i]; if (w.dead || w.hp <= 0) continue;
      var sv = RU.save(w, 'con', S.dc), roll = D.roll(S.dice), n = sv.ok ? Math.floor(roll.total / 2) : roll.total;
      B.card(['  ' + w.name + ': CON ' + RU.saveText(sv) + ' vs DC ' + S.dc + '  ' + (sv.ok ? '{n}SAVED{/} (half)' : '{o}STUNNED{/}') + '  ' + S.dice + ' ' + RU.fmtRolls(roll.rolls) + ' = {r}' + n + '{/} bludgeoning'], 360);
      D.sfx('crit'); FX.slash(w, D.PAL.ramps.red[4]);
      B.hurt(w, n, 'bludgeoning');
      if (!sv.ok && w.hp > 0) w.conds.stunned = { by: u.id, fresh: true };
      yield 34;
    }
    u.anim = 'idle';
  }
  // its ranged routine (the multiattack's ranged names, else its first ranged attack once), each at the lowest AC in sight
  function* volley(B, u) {
    var keys = Array.isArray(u.multi) ? u.multi.filter(function (k) { return u.attacks[k] && u.attacks[k].ranged; }) : [];
    // a ranged Multiattack of its own (`rangedMulti`: the Bandit Captain's "two ranged attacks with its daggers", SRD 5.1 -- the melee `multi` stays the melee routine)
    if (!keys.length && Array.isArray(u.rangedMulti)) keys = u.rangedMulti.filter(function (k) { return u.attacks[k] && u.attacks[k].ranged; });
    // else its best one weapon: with two to choose from (the gnoll's longbow and its thrown spear) the likelier, bigger blow at the lowest AC it can see -- a thrown weapon past its
    // normal range at disadvantage (RU.edges), so the spear is for 20 ft and the bow for the rest (10-02)
    if (!keys.length) {
      var rks = Object.keys(u.attacks).filter(function (k) { return u.attacks[k].ranged; }), see0 = visibleFrom(u, u.x, u.y, heroes(B, u)), bestS = -1;
      rks.forEach(function (k) {
        var a = u.attacks[k], tg = see0.filter(function (w) { return G.dist(u, w) <= a.range[1]; }).sort(function (p, q) { return RU.ac(p) - RU.ac(q); })[0]; if (!tg) return;
        var p1 = Math.max(0.05, Math.min(0.95, (21 - (RU.ac(tg) - a.atk)) / 20)), pp = G.dist(u, tg) > a.range[0] ? p1 * p1 : p1, sc = pp * D.tactics.avg(a.dice) + pp * (a.mod || 0);
        if (sc > bestS + 1e-9) { bestS = sc; keys = [k]; }
      });
      if (!keys.length) keys = rks.slice(0, 1);
    }
    if (!keys.length || !u.turn.action) return false;
    var first = u.attacks[keys[0]];
    if (!visibleFrom(u, u.x, u.y, heroes(B, u)).some(function (w) { return G.dist(u, w) <= first.range[1]; })) return false;
    u.turn.action = 0;
    for (var i = 0; i < keys.length; i++) {
      var atk = u.attacks[keys[i]], seen = visibleFrom(u, u.x, u.y, heroes(B, u)).filter(function (w) { return G.dist(u, w) <= atk.range[1]; });
      if (!seen.length) break;
      yield* B.attack(u, seen.sort(function (p, q) { return RU.ac(p) - RU.ac(q) || p.hp - q.hp; })[0], atk);
      if (u.dead || u.hp <= 0) break;
    }
    return true;
  }
  function* shooter(B, u) {
    var T = u.turn, hs = heroes(B, u), far = u.attacks[Object.keys(u.attacks)[0]].range[0], exits = B.fight.exit || B.map.def.exit || [];
    // one who fights only to get away (the wagon pair): each turn a move toward the way out, then the blasts. On the ladder
    // they give ground a step at a time; in the 8-bit yard (fight.runWhenHurt), once they run, it is a full stride (on foot)
    if (u.flees && exits.length) {
      // her Darkness the turn she breaks (the 8-bit game's: "Amara throws darkness over the yard!"), then the run
      if (u.darkness && !u.darkness.used && T.action) yield* D.magic.castDarkness(B, u);
      var rx = G.reach(u, B.fight.runWhenHurt || B.fight.fledEnds ? T.move : Math.min(T.move, 15)), go = null, gd = Infinity; // (the 8-bit's story fights: fledEnds too)
      Object.keys(rx).forEach(function (k) { var e = rx[k]; if (!e.stand) return; var d = Math.min.apply(null, exits.map(function (x) { return Math.max(Math.abs(x[0] - e.x), Math.abs(x[1] - e.y)); })) * 10 + e.cost / 10; if (d < gd) { gd = d; go = e; } });
      if (go && (go.x !== u.x || go.y !== u.y)) { yield* walkTo(B, u, go); if (u.dead || u.hp <= 0) return; }
      if (exits.some(function (x) { return x[0] === u.x && x[1] === u.y; })) {
        u.dead = true; u.fled = true; u.deadT = B.t; D.sfx('run');
        B.card(['{o}' + u.name + ' is gone' + (B.map.def.exitName ? ' ' + B.map.def.exitName : '') + '.{/}']); yield 30; return;
      }
      if (!(yield* volley(B, u))) { B.card(['{g}' + u.name + ' makes for the way out.{/}']); yield 16; }
      return;
    }
    if (G.foesNear(u, u.x, u.y, 5).length || !visibleFrom(u, u.x, u.y, hs).length) {
      var rm = G.reach(u, T.move), pick = null, ps = -1e9;
      Object.keys(rm).forEach(function (k) {
        var e = rm[k]; if (!e.stand) return;
        var vis = visibleFrom(u, e.x, e.y, hs); if (!vis.length) return;
        var near = Math.min.apply(null, hs.map(function (w) { return G.dist(u, w, e.x, e.y); }));
        var s = -G.foesNear(u, e.x, e.y, 5).length * 20 - Math.abs(near - Math.min(far, 30)) / 5 - e.cost / 10;
        if (s > ps) { ps = s; pick = e; }
      });
      if (pick && (pick.x !== u.x || pick.y !== u.y)) { yield* walkTo(B, u, pick); if (u.dead || u.hp <= 0) return; }
    }
    if (!(yield* volley(B, u))) { B.card(['{g}' + the(B, u) + ' has no clear shot.{/}']); yield 20; }
  }
  function* leap(B, u, hs) {
    var L = u.leap, best = null;
    hs.forEach(function (t) {
      if (G.dist(u, t) > L.range || !G.los(u, t).clear) return;
      var pair = hs.filter(function (w) { return w !== t && G.dist(w, t) <= 5; }).length;
      // a landing: free for its body, beside the target
      var land = null, ld = Infinity;
      for (var y = t.y - u.size; y <= t.y + (t.size || 1); y++) for (var x = t.x - u.size; x <= t.x + (t.size || 1); x++) {
        if (!G.canStand(u, x, y) || G.dist(u, t, x, y) > 5) continue;
        var d = Math.hypot(x - u.x, y - u.y); if (d < ld) { ld = d; land = [x, y]; }
      }
      if (land && (!best || pair > best.pair)) best = { t: t, pair: pair, land: land };
    });
    if (!best) return false;
    var T = u.turn; T.action = 0; L.ready = false;
    u.tween = { fx: u.x, fy: u.y, fz: 60, t: 0, dur: B.pace(22, true) }; u.x = best.land[0]; u.y = best.land[1]; // (the leap's flight is paced with its waits below, as a step is: Battle.prototype.pace)
    u.facing = B.faceTo(u, best.t); u.anim = 'attack'; u.animT = B.t; D.sfx('crit');
    var hit = [best.t].concat(hs.filter(function (w) { return w !== best.t && G.dist(w, best.t) <= 5 && G.dist(u, w) <= 5; }).slice(0, (L.targets || 2) - 1));
    if (u.turn) u.turn.attacked = (u.turn.attacked || 0) + 1; // (the Leap is its attack this turn: it may dive after -- diveAfter, 10-02)
    // the Deadly Leap by the SRD 5.1 (10-02 runner): "DC 16 Strength or Dexterity saving throw (target's choice) or be knocked prone and take 14 (3d6 + 4) bludgeoning damage plus 14 (3d6 + 4) slashing damage. On a
    // successful save, the creature takes only half the damage, isn't knocked prone, and is pushed 5 feet out of the bulette's space" -- one roll of each, shared by those it comes down on; each type is hurt on its own, so
    // a resistance reads per type (B.hurt). It lands beside its mark, never in a hero's square, so no one is in its space to be pushed out of
    var abs = L.abs || ['dex'], parts = (L.dmg || [[L.dice, 'bludgeoning']]).map(function (p) { var r = D.roll(p[0]); return { type: p[1], r: r, txt: p[0] + ' ' + RU.fmtRolls(r.rolls) + ' = ' + r.total + ' ' + p[1] }; });
    var tot = parts.reduce(function (a, p) { return a + p.r.total; }, 0), lines = ['{r}' + the(B, u) + '{/} leaps, and comes down on them like a falling wall!', '  ' + parts.map(function (p) { return p.txt; }).join('  +  ') + '  ' + abs.map(function (a) { return a.toUpperCase(); }).join(' or ') + ' DC ' + L.dc + (abs.length > 1 ? ' (their choice)' : '')], hurt = [];
    yield 24;
    hit.forEach(function (w) {
      var ab = RU.bestSave(w, abs), sv = RU.save(w, ab, L.dc, false, null, tot), ev = ab === 'dex' && RU.evasion(w); // (the better of the two: RU.bestSave)
      var share = parts.map(function (p) { return sv.ok ? (ev ? 0 : Math.floor(p.r.total / 2)) : (ev ? Math.floor(p.r.total / 2) : p.r.total); }), n = share.reduce(function (a, x) { return a + x; }, 0);
      lines.push('  ' + w.name + ': ' + ab.toUpperCase() + ' ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{o}failed: prone{/}') + '  {r}' + n + '{/}' + (parts.length > 1 ? ' (' + share.join(' + ') + ')' : '')); hurt.push([w, share]);
      if (!sv.ok && !w.noProne && !RU.immuneTo(w, 'prone')) w.conds.prone = true; // the Leap flattens those who fail
    });
    B.card(lines, 400);
    hurt.forEach(function (h) { FX.slash(h[0], D.PAL.ramps.red[4]); parts.forEach(function (p, i) { if (h[1][i] > 0 && !h[0].dead && h[0].hp > 0) B.hurt(h[0], h[1][i], p.type); }); }); // (a second type on one the first dropped is no second fall: no "goes down" twice)
    yield 34; u.anim = 'idle';
    if (B.readyHook) yield* B.readyHook(u); // (it came down within their reach: the readied strikes, once its own blow is done -- battle.js exec 'ready', 10-02)
    return true;
  }
  function* bolt(B, u) {
    var T = u.turn, exits = B.fight.exit || B.map.def.exit || [];
    if (!exits.length || !T.action || u.conds.restrained || u.conds.dancing) return false; // (held fast, or a dancer "must use all its movement to dance": no Dash to make for the door)
    T.action = 0; T.move = u.speed * 2; // Dash
    // Cunning Action (the Spy): the bonus action Dashes again, or -- with a hero beside it, whose blow the run would draw -- Disengages first
    if (u.cunning && T.bonus > 0) {
      if (G.foesNear(u, u.x, u.y, 5).some(function (w) { return w.reaction > 0 && RU.canAct(w); })) yield* B.exec(u, { do: 'cdisengage' });
      else { T.bonus = 0; T.move = u.speed * 3; B.card(['{y}' + the(B, u) + '{/} (Cunning Action) dashes again.'], 160); }
    }
    var rm = G.reach(u, T.move), best = null, bc = Infinity;
    exits.forEach(function (x) { var e = rm[x[0] + ',' + x[1]]; if (e && e.stand && e.cost < bc) { bc = e.cost; best = e; } });
    if (!best) { // not this turn: as close as the dash goes
      Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand) return; var d = Math.min.apply(null, exits.map(function (x) { return Math.max(Math.abs(x[0] - e.x), Math.abs(x[1] - e.y)); })); if (d * 100 + e.cost / 5 < bc) { bc = d * 100 + e.cost / 5; best = e; } });
    }
    B.card(['{r}' + the(B, u) + '{/} breaks and runs!  {g}(Dash){/}']); yield 16;
    if (best) yield* walkTo(B, u, best);
    if (u.dead || u.hp <= 0) return true;
    if (exits.some(function (x) { return x[0] === u.x && x[1] === u.y; })) {
      u.dead = true; u.fled = true; u.deadT = B.t; D.sfx('run');
      if (u.holding && u.holding.length) B.release(u);
      B.card(['{o}' + the(B, u) + ' is gone' + (B.map.def.exitName ? ' ' + B.map.def.exitName : '') + '.{/}']); yield 30;
    }
    return true;
  }
  // the Spy's Cunning Action (SRD 5.1 Spy: "a bonus action to take the Dash, Disengage, or Hide action"; the class NPC rogue's choices, js/features.js and js/tactics.js, for a stat
  // block): pressed -- hurt with a foe beside it, or two -- it Disengages (bonus), steps to a square with no foe beside it and a clear shot, and looses its crossbow (the action);
  // with no one in reach by the walk and one in reach by the walk and the Dash it Dashes (bonus) to close; the Hide is traits.js after. Returns true when the turn is spent
  function* cunning(B, u, hs) {
    var T = u.turn;
    if (!T.bonus || !T.action || u.conds.restrained || u.conds.dancing || !hs.length) return false;
    var beside = G.foesNear(u, u.x, u.y, 5), rk = Object.keys(u.attacks || {}).filter(function (k) { return u.attacks[k].ranged; })[0], ra = rk && u.attacks[rk];
    var pressed = beside.length && (u.hp < u.maxhp * 0.5 || (beside.length >= 2 && u.hp < u.maxhp * 0.75));
    if (pressed && ra && !u.conds.disarmed) {
      var rm = G.reach(u, T.move), pick = null, ps = -1e9;
      Object.keys(rm).forEach(function (k) {
        var e = rm[k]; if (!e.stand || G.foesNear(u, e.x, e.y, 5).length) return;
        var vis = visibleFrom(u, e.x, e.y, hs).filter(function (w) { return G.dist(u, w, e.x, e.y) <= ra.range[1]; }); if (!vis.length) return;
        var near = Math.min.apply(null, hs.map(function (w) { return G.dist(u, w, e.x, e.y); }));
        var s = Math.min(near, 40) - e.cost / 20; if (s > ps) { ps = s; pick = e; }
      });
      if (pick) {
        yield* B.exec(u, { do: 'cdisengage' });
        yield* walkTo(B, u, pick); if (u.dead || u.hp <= 0) return true;
        if (!(yield* volley(B, u))) { B.card(['{g}' + the(B, u) + ' has no clear shot.{/}']); yield 12; }
        return true;
      }
    }
    // cover first (the rogue's cover play, tactics.js rogueCoverTurn, for a stat block): with no one in reach and a crossbow, a square within the walk where no foe sees it clearly,
    // none beside it and a hero in range with a line -- walk there, shoot from it, and traits.js after Hides (the bonus action)
    if (ra && !u.conds.disarmed && !u.conds.hidden && !beside.length && !hs.some(function (w) { return G.dist(u, w) <= reachOf(u, hs); })) {
      var foesAll = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && RU.canAct(w); }), rm2 = G.reach(u, T.move), cov = null, cc = Infinity, ox = u.x, oy = u.y;
      Object.keys(rm2).forEach(function (k) {
        var e = rm2[k]; if (!e.stand || e.cost >= cc || (e.x === ox && e.y === oy)) return;
        u.x = e.x; u.y = e.y;
        try {
          if (foesAll.every(function (f) { return B.seenBy(f, u) < 2; }) && !G.foesNear(u, e.x, e.y, 5).length && visibleFrom(u, e.x, e.y, hs).some(function (w) { return G.dist(u, w, e.x, e.y) <= ra.range[1]; })) { cov = e; cc = e.cost; }
        } finally { u.x = ox; u.y = oy; }
      });
      if (cov) { yield* walkTo(B, u, cov); if (u.dead || u.hp <= 0) return true; if (!(yield* volley(B, u))) { B.card(['{g}' + the(B, u) + ' has no clear shot.{/}']); yield 12; } return true; }
    }
    // the Dash to close: out of reach by the walk, in reach by the walk and the Dash
    var rc = reachOf(u, hs), can = function (mv) { var m = G.reach(u, mv); return hs.some(function (t) { return Object.keys(m).some(function (k) { var e = m[k]; return e.stand && G.dist(u, t, e.x, e.y) <= rc; }); }); };
    if (hs.some(function (w) { return G.dist(u, w) <= rc; }) || can(T.move) || !can(T.move + u.speed)) return false;
    yield* B.exec(u, { do: 'cdash' });
    return false;
  }
  // ------------------------------------------------------------------ a burrower (the bulette, SRD 5.1 "burrow 40 ft."; Griz 10-01d: "go ahead and
  // wire in the bulette"). Under the ground it is out of every reach -- u.under for the look (its mound: js/ui.js), u.ethereal for the rules, so no
  // blow, spell or opportunity attack finds it and it passes under feet -- and it hunts by its tremorsense (blindsight on the sheet). Up, with
  // someone in its reach, it fights where it stands (brute), unless it is bloodied with two at it; with no one in reach, or so pressed, it dives
  // (its Burrow row), goes under to the one it wants and comes up beside them (its Emerge row) -- or 15 to 30 ft off when its Leap is ready, the
  // jump the Deadly Leap asks for -- and fights. It comes up only where its body has room, and stays up through the party's turns (the seat's
  // call, 10-01d: never up, bite and down again in one turn). Its ground is any open floor, never the rock (SRD 5.1: "A monster can't burrow
  // through solid rock"), and not a map whose floor is worked stone (a map's `noBurrow`). Moving under, it has its burrow speed
  function canDig(B, u) { return u.burrow > 0 && G.foot(u).every(function (q) { return !G.solidFloor(q[0], q[1]); }) && !u.conds.restrained && !u.conds.prone && !(u.holding && u.holding.length); } // (not off worked stone: a map's noBurrow, data/maps.js)
  function* sink(B, u) {
    // (under from the first frame of the row: js/ui.js plays the row and then holds its last frame, whatever the pace -- a row played
    // "once" that ran out before the wait did fell back to idle, and he stood whole on the floor before he went: Griz's fight, 10-01d)
    u.under = true; u.ethereal = true;
    u.anim = 'burrow'; u.animT = B.t; D.sfx('earth'); if (!u.earthGlide) FX.ring(u, 'stone', 30);
    // (Earth Glide, the xorn's: "the xorn doesn't disturb the material it moves through" -- no dust, no mound, and nothing to follow)
    B.card(u.earthGlide ? ['{r}' + the(B, u) + '{/} sinks into the floor like a stone into water.  {g}(Earth Glide: it cannot be seen, struck or followed till it comes up){/}']
      : ['{r}' + the(B, u) + '{/} dives into the ground!  {g}(burrowing: it cannot be seen, struck or blocked till it comes up){/}'], 300);
    yield Math.max(24, D.spr.duration(u.sheet, 'burrow') || 0);
    u.anim = 'idle';
  }
  function* rise(B, u, tgt) {
    u.under = false; u.ethereal = false; B.focus(u);
    if (tgt) u.facing = B.faceTo(u, tgt);
    u.anim = 'reveal'; u.animT = B.t; D.sfx('earth'); FX.ring(u, 'stone', 40);
    B.card(['{r}' + the(B, u) + '{/} ' + (u.earthGlide ? 'rises out of the floor' : 'bursts up out of the ground') + (tgt ? (G.dist(u, tgt) <= reachOf(u) ? ' beside ' : ' near ') + tgt.name : '') + '!'], 300);
    yield Math.max(24, D.spr.duration(u.sheet, 'reveal') || 0);
    u.anim = 'idle';
    // up, it sees: one hidden that it now sees clearly is found, as on a step (battle.js moveAlong; SRD 5.1, "You can't hide from a creature that can see you clearly" -- 10-02)
    B.findsHidden(u);
    if (B.readyHook) yield* B.readyHook(u); // (up into a readier's reach or sight: the readied strikes -- battle.js exec 'ready', 10-02)
  }
  function* burrower(B, u) {
    var T = u.turn, hs = heroes(B, u), L = u.leap, pressed = false;
    if (!u.under) {
      var inReach = hs.filter(function (w) { return G.dist(u, w) <= reachOf(u); });
      pressed = u.hp <= u.maxhp / 2 && inReach.length >= 2;
      // (a burrower with `walkWithin` walks to one that close, on its feet -- the xorn, 15 ft: Griz, 10-01d, "have them walk within 15")
      var walks = !inReach.length && u.walkWithin && hs.some(function (w) { return G.dist(u, w) <= u.walkWithin; });
      if (!hs.length || !canDig(B, u) || (inReach.length && !pressed) || walks) { yield* brute(B, u); yield* diveAfter(B, u); return; }
      yield* sink(B, u);
    }
    var all = hs;
    if (pressed) { var away = hs.filter(function (w) { return inReach.indexOf(w) < 0; }); if (away.length) hs = away; } // (somewhere else: not the two at it)
    // the Leap's recharge, before it picks where to come up (brute does not roll it again this turn)
    if (L && !L.ready && D.d(6) >= L.recharge) L.ready = true;
    T.recharged = true;
    if (!hs.length) { B.card([u.earthGlide ? '{g}Nothing shows where it went.{/}' : '{g}The ground heaves: something moves under it.{/}'], 160); yield 16; return; }
    var m0 = T.move, cap = Math.min(m0, u.burrow), rm = G.reach(u, cap, { ghost: true }), leapNow = !!(L && L.ready && T.action);
    // where to come up: beside the weakest it can reach this turn (or, Leap ready, 15-30 ft off with a clear jump), the shortest dig first
    function pick(leapBand) {
      var best = null, bs = Infinity;
      hs.forEach(function (t) {
        Object.keys(rm).forEach(function (k) {
          var e = rm[k], d = G.dist(u, t, e.x, e.y);
          if (leapBand ? d < 15 || d > Math.min(30, L.range) : d > reachOf(u)) return;
          if (!G.canStand(u, e.x, e.y)) return; // (room for its body: it comes up where no one stands)
          if (leapBand && !G.los(u, t, e.x, e.y).clear) return;
          var s = (t.hp / t.maxhp) * 100 + e.cost / 5;
          if (pressed) s += 60 * all.filter(function (w) { return w !== t && G.dist(u, w, e.x, e.y) <= reachOf(u); }).length; // (it dove to get clear: not up among them again)
          if (s < bs) { bs = s; best = { e: e, t: t }; }
        });
      });
      return best;
    }
    var up = (leapNow && pick(true)) || pick(false);
    if (!up) {
      // no one it can reach this turn: closer, under the ground
      var near = hs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0], e0 = approach(u, near, rm);
      // ... unless there is no square beside anyone its body fits in at all (a target boxed in by the walls and the fallen: the Breach's road with three down round Vivian,
      // 10-02) -- then up at the nearest it can stand in within a stride (15 ft) of its mark, to walk and bite on its feet; it stayed under for good before
      var e1 = Object.keys(rm).map(function (k) { return rm[k]; }).filter(function (e) { return e.stand && G.canStand(u, e.x, e.y); }).sort(function (a, b) { return G.dist(u, near, a.x, a.y) - G.dist(u, near, b.x, b.y) || a.cost - b.cost; })[0];
      if (e1 && G.dist(u, near, e1.x, e1.y) <= 15 && (!e0 || G.dist(u, near, e0.x, e0.y) >= G.dist(u, near, e1.x, e1.y) - 5)) {
        T.move = cap; yield* walkTo(B, u, e1, { ghost: true }); T.move = Math.max(0, m0 - (cap - T.move));
        if (u.dead || u.hp <= 0) return;
        yield* rise(B, u, near);
        if (u.dead || u.hp <= 0) return;
        yield* brute(B, u);
        yield* diveAfter(B, u);
        return;
      }
      if (e0 && (e0.x !== u.x || e0.y !== u.y)) { T.move = cap; yield* walkTo(B, u, e0, { ghost: true }); T.move = Math.max(0, m0 - (cap - T.move)); }
      B.card([u.earthGlide ? '{g}Nothing shows where it went.{/}' : '{g}The ground heaves: something moves under it' + (near ? ', toward ' + near.name : '') + '.{/}'], 200); yield 16;
      return;
    }
    T.move = cap; yield* walkTo(B, u, up.e, { ghost: true }); T.move = Math.max(0, m0 - (cap - T.move));
    if (u.dead || u.hp <= 0) return;
    yield* rise(B, u, up.t);
    if (u.dead || u.hp <= 0) return; // (the readied strikes may have ended it as it came up)
    yield* brute(B, u); // (the Leap if it is ready, else the bite)
    yield* diveAfter(B, u);
  }
  // ... and under again, the bite given (10-02, handoff-2026-10-01-the-tendrils-and-ready §4.2; Griz's rule, 10-01d: "If the mechanics allow it and a smart player or AI would
  // do it, we'll allow it" -- the seat's call of 10-01d that kept it up through the party's turns is lifted now that READY answers it): a foe with `diveAfter` (data/foes.js:
  // the bulette) that has 5 ft of its move left after the bite goes under where it stands -- out of everyone's reach at once, so those beside it that see it get their
  // opportunity attacks first (battle.js provoke) -- and digs on with what is left, as far from them as that goes; next turn it comes up again beside the weakest. The
  // xorn, which resists plain steel and claws three times, stays up and fights (the seat's call)
  function* diveAfter(B, u) {
    var T = u.turn;
    // (bite AND dive: a turn it came up and struck at no one -- the Leap recharged, it surfaced 15-30 ft off and found no landing -- it stays up, as before, where they can
    // get at it; diving after nothing made the Breach a fight nobody could end, the bench's 600 s, 10-02)
    if (u.dead || u.hp <= 0 || u.under || !(D.FOES[u.kind] && D.FOES[u.kind].diveAfter) || !canDig(B, u) || T.move < 5 || !(T.attacked > 0)) return;
    yield* B.provoke(u, 'diving under');
    if (u.dead || u.hp <= 0 || !canDig(B, u)) return;
    yield* sink(B, u); T.move -= 5;
    var hs = heroes(B, u), cap = Math.min(T.move, Math.max(0, u.burrow - 5)), rm = G.reach(u, cap, { ghost: true }), far = null, fd = -Infinity;
    Object.keys(rm).forEach(function (k) { var e = rm[k], dmin = hs.length ? Math.min.apply(null, hs.map(function (w) { return G.dist(u, w, e.x, e.y); })) : 0, sc = dmin - e.cost / 50; if (sc > fd) { fd = sc; far = e; } });
    if (far && (far.x !== u.x || far.y !== u.y)) { var m0 = T.move; T.move = cap; yield* walkTo(B, u, far, { ghost: true }); T.move = Math.max(0, m0 - (cap - T.move)); }
    B.card([u.earthGlide ? '{g}Nothing shows where it went.{/}' : '{g}The ground heaves: it is off under the floor.{/}'], 160); yield 16;
  }
  // up a rope to a fight above (10-05, Griz: "dwarves climbing ropes (much less getting from barrel and tossing)" -- the garrison out of the vault doors paced on the street, "it cannot get at
  // anyone", while the giants broke the glass above it, two ropes hanging there): one of size 1 with no climb of its own, its target a level above. A rope already hanging from up there --
  // the one it hangs on, or the nearest whose foot it reaches -- climbed as far as the move pays (exec 'ropeclimb' with its rung: no question), the Dash first when nothing else wants the
  // action; none it can reach this turn, walk for the nearest's foot. No rope up: its own Rope & Grapple (a lent ally's, never the party's pack -- Griz: "each trooper get one grappling hook
  // ... had to send barley back coz the troopers kept throwing them"; the party's pack for one of the party's own) thrown from the FOOT of the face under the lip nearest its target ("especially
  // if that means throw from the bottom": walked there first, thrown when it stands there with the action); none, a Rope & Grapple out of the bucket first (free, one a turn). True when it did any
  // of it. Every brute that wants it -- not this fight's alone: it only fires where a rope hangs, or the map has a face and a rope to throw (10-05, Griz: "is the rope code something we should
  // leave in for NPCs")
  function hasRope(B, u) { if (u.ownRope != null) return u.ownRope > 0; return u.side === 'party' && (B.inv || []).some(function (x) { return x.id === 'rope' && x.n > 0; }); }
  // the lips of the face at level z near (cx, cy) a rope can be set on, each with the square under it the rope hangs to (Battle.ropeSq read as if one stood on the lip)
  function doorway(B, q) { var ds = ((B.fight && B.fight.arrive && B.fight.arrive.doors) || []).slice(); (B.passages || []).forEach(function (p) { ds.push(p.at, p.to); }); return ds.some(function (d) { return d && d[0] === q[0] && d[1] === q[1]; }); }
  function lipsNear(B, z, cx, cy, r) {
    var out = [], st = G.map.def.step;
    for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      var x = cx + dx, y = cy + dy, s = G.map.at(x, y); if (!s || !s.walk || Math.abs(G.map.gz(x, y) - z) > st) continue;
      var q = D.Battle.ropeSq(B, { x: x, y: y, size: 1, id: 'probe' }, x, y); if (q && q.top && !doorway(B, q.foot)) out.push({ at: [x, y], foot: q.foot }); // (not down onto a doorway: the vault's doors are the party's way in and out)
    }
    return out;
  }
  function* ropeUp(B, u, tgt) {
    var T = u.turn, st = G.map.def.step, Bt = D.Battle;
    if (!tgt || (u.size || 1) > 1 || u.climbs || u.flies || !(T.move > 0) || u.conds.restrained || u.conds.grappled || u.under) return false;
    if (u.ownRope == null && (u.ally || u.guest)) u.ownRope = 0; // (a lent ally or a story guest -- Pyro -- throws its own, never the party's pack: 10-05)
    var zU = G.gzAt(u, u.x, u.y), zT = G.gzAt(tgt, tgt.x, tgt.y), hangR = u.hang && G.hanging(u) && u.hang.rope;
    if (!hangR && zT <= zU + 2 * st) return false; // (not above it: the walk is the way)
    var ropes = (B.ropes || []).filter(function (r) {
      if (r.cut) return false; if (hangR) return r === hangR;
      var zTop = G.map.gz(r.at[0], r.at[1]), h = Bt.ropeHanger(B, r);
      return zTop > zU + st && zTop >= zT - 2 * st && (!h || h === u);
    });
    var rm = G.reach(u, T.move), best = null;
    ropes.forEach(function (r) {
      var here = hangR === r || (u.x === r.foot[0] && u.y === r.foot[1]), e = here ? { cost: 0, stand: true } : rm[r.foot[0] + ',' + r.foot[1]];
      if (!e || !e.stand) return;
      var sc = (e.cost || 0) + G.dist({ x: r.at[0], y: r.at[1], size: 1 }, tgt);
      if (!best || sc < best.sc) best = { r: r, cost: e.cost || 0, sc: sc };
    });
    if (best) {
      var r = best.r, zFrom = hangR === r ? u.hang.z : G.map.gz(r.foot[0], r.foot[1]), need = Math.round((G.map.gz(r.at[0], r.at[1]) - zFrom) / st);
      if (T.action && !T.attacksLeft && Bt.ropeSteps(r, zFrom, true, T.move - best.cost) < need) yield* B.exec(u, { do: 'dash' }); // (nothing to strike from the rope: the Dash for more of it -- the climb costs double)
      var n = Bt.ropeSteps(r, zFrom, true, T.move - best.cost);
      if (n > 0) { yield* B.exec(u, { do: 'ropeclimb', x: r.at[0], y: r.at[1], z: zFrom + n * st }); return true; }
      if (best.cost > 0) { yield* walkTo(B, u, rm[r.foot[0] + ',' + r.foot[1]]); return true; } // (to its foot: the climb next turn)
      return false;
    }
    if (hangR) return false;
    if (ropes.length) { // (a rope up there, its foot past this turn's move: make for it)
      var rn = ropes.slice().sort(function (a, b) { return G.dist(u, { x: a.foot[0], y: a.foot[1], size: 1 }) - G.dist(u, { x: b.foot[0], y: b.foot[1], size: 1 }); })[0], eF = approach(u, { x: rn.foot[0], y: rn.foot[1], size: 1 }, rm, 0);
      if (eF && (eF.x !== u.x || eF.y !== u.y)) { yield* walkTo(B, u, eF); return true; }
      return false;
    }
    if (u.side !== 'party') return false;
    // none hanging from up there: its own rope thrown from the foot of the face under the lip nearest its target
    if (hasRope(B, u)) {
      var lips = lipsNear(B, zT, tgt.x, tgt.y, 8).filter(function (l) { return !(G.occupant(l.foot[0], l.foot[1]) && G.occupant(l.foot[0], l.foot[1]) !== u); });
      lips.sort(function (a, b) { var ea = rm[a.foot[0] + ',' + a.foot[1]], eb = rm[b.foot[0] + ',' + b.foot[1]]; return ((ea && ea.stand ? ea.cost : 500 + G.dist(u, { x: a.foot[0], y: a.foot[1], size: 1 }) * 2) + G.dist({ x: a.at[0], y: a.at[1], size: 1 }, tgt)) - ((eb && eb.stand ? eb.cost : 500 + G.dist(u, { x: b.foot[0], y: b.foot[1], size: 1 }) * 2) + G.dist({ x: b.at[0], y: b.at[1], size: 1 }, tgt)); });
      var lp = lips[0]; if (!lp) return false;
      var atFoot = u.x === lp.foot[0] && u.y === lp.foot[1], eL = rm[lp.foot[0] + ',' + lp.foot[1]];
      if (!atFoot) { if (eL && eL.stand) { yield* walkTo(B, u, eL); atFoot = u.x === lp.foot[0] && u.y === lp.foot[1]; } else { var eA = approach(u, { x: lp.foot[0], y: lp.foot[1], size: 1 }, rm, 0); if (eA && (eA.x !== u.x || eA.y !== u.y)) yield* walkTo(B, u, eA); return true; } }
      if (atFoot && T.action && !T.attacksLeft && Bt.ropeSq(B, u, lp.at[0], lp.at[1], lp.foot)) yield* B.exec(u, { do: 'rope', x: lp.at[0], y: lp.at[1], foot: lp.foot });
      return true;
    }
    // no rope of its own: the bucket (Fountain Street's), walked to and a rope taken out -- free -- to be thrown from the foot next
    if (B.ropeBucket && !T.tookRope) {
      if (!Bt.besideBucket(B, u)) { var eB = approach(u, { x: B.ropeBucket[0], y: B.ropeBucket[1], size: 1 }, rm, 5); if (eB && (eB.x !== u.x || eB.y !== u.y)) yield* walkTo(B, u, eB); }
      if (Bt.besideBucket(B, u)) { var g0 = u.guest; u.guest = false; yield* B.exec(u, { do: 'bucketrope' }); if (g0 !== undefined) u.guest = g0; else delete u.guest; }
      return true;
    }
    return false;
  }
  AI.ropeUp = ropeUp; // (Pyro's own turn reads it too: js/pyro.js)
  AI.lipsNear = lipsNear; // (the bench)
  // a rope set down from the lip (10-05, Griz: "if no ropes down and two on roof, maybe have a dwarf run to the ledge and set a hook/rope down?"): a lent ally with its own rope, up on a level
  // with a face below it where two or more of ours stand, no rope hanging from there, and none of the foes in its reach -- one of them (the first to take it up: B.ropeTier) goes to the lip
  // nearest ours below and ties it off (exec 'rope' from beside the lip: no roll), so the street can climb to it
  function* tieDown(B, u) {
    var T = u.turn, st = G.map.def.step; if (!(u.ownRope > 0) || (u.size || 1) > 1 || !T.action || T.attacksLeft || u.hang) return false;
    if (B.ropeTier && B.ropeTier !== u.id && B.units.some(function (w) { return w.id === B.ropeTier && G.standing(w); })) return false;
    var zU = G.gzAt(u, u.x, u.y);
    if ((B.ropes || []).some(function (r) { return !r.cut && Math.abs(G.map.gz(r.at[0], r.at[1]) - zU) <= st; })) return false; // (one hangs from up here already)
    var mates = B.units.filter(function (w) { return w.side === u.side && !w.object && !w.look && G.standing(w) && Math.abs(G.gzAt(w, w.x, w.y) - zU) <= st; });
    if (mates.length < 2) return false;
    if (B.units.some(function (w) { return G.hostile(u, w) && G.standing(w) && !w.regenDown && G.dist(u, w) <= reachOf(u, [w]) + 5; })) return false; // (a foe at hand: the fight first)
    var below = B.units.filter(function (w) { return w.side === u.side && !w.object && !w.look && G.standing(w) && G.gzAt(w, w.x, w.y) < zU - 2 * st; }); if (!below.length) return false;
    var cx = Math.round(below.reduce(function (s, w) { return s + w.x; }, 0) / below.length), cy = Math.round(below.reduce(function (s, w) { return s + w.y; }, 0) / below.length);
    var rm = G.reach(u, T.move), all = lipsNear(B, zU, cx, cy, 14); // (the lips nearest ours below)
    if (!all.length) return false;
    var lips = all.map(function (l) {
      var stand = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].map(function (d) { var k = (l.at[0] + d[0]) + ',' + (l.at[1] + d[1]); return (l.at[0] + d[0] === u.x && l.at[1] + d[1] === u.y) ? { x: u.x, y: u.y, cost: 0, stand: true } : rm[k]; }).filter(function (e) { return e && e.stand && Math.abs(G.map.gz(e.x, e.y) - zU) <= st; }).sort(function (a, b) { return a.cost - b.cost; })[0];
      return stand ? { at: l.at, foot: l.foot, e: stand, sc: Math.hypot(l.foot[0] - cx, l.foot[1] - cy) + stand.cost / 25 } : null; // (the straight line to ours: the grid's distance tied every lip along the facade)
    }).filter(Boolean).sort(function (a, b) { return a.sc - b.sc; });
    B.ropeTier = u.id;
    if (!lips.length) { // (the lip past this turn's move: make for the one nearest ours below, and tie it off when there)
      var far = all.slice().sort(function (a, b) { return Math.hypot(a.foot[0] - cx, a.foot[1] - cy) - Math.hypot(b.foot[0] - cx, b.foot[1] - cy); })[0];
      if (T.action && !T.attacksLeft) yield* B.exec(u, { do: 'dash' });
      var eW = approach(u, { x: far.at[0], y: far.at[1], size: 1 }, G.reach(u, T.move), 5); if (eW && (eW.x !== u.x || eW.y !== u.y)) yield* walkTo(B, u, eW);
      return true;
    }
    var L = lips[0];
    if (L.e.x !== u.x || L.e.y !== u.y) yield* walkTo(B, u, L.e);
    if (u.dead || u.hp <= 0 || !T.action) return true;
    if (D.Battle.ropeSq(B, u, L.at[0], L.at[1], L.foot)) yield* B.exec(u, { do: 'rope', x: L.at[0], y: L.at[1], foot: L.foot });
    return true;
  }
  function* brute(B, u) {
    var T = u.turn, hs = heroes(B, u), grudge = false;
    // a scripted run (a fight's foe `chase`: the Skylights' first trolls after the street's people in round 1 -- 10-05, Griz: "have the first trolls chase the civilians more"): no one of ours
    // in its reach, it runs -- the Dash -- for its square, and that is its turn
    if (u.chase && B.round <= u.chase.till && !hs.some(function (w) { return !w.object && G.dist(u, w) <= reachOf(u, hs); })) {
      if (T.action && !T.attacksLeft) yield* B.exec(u, { do: 'dash' });
      var rmC = G.reach(u, T.move), kC = u.chase.to[0] + ',' + u.chase.to[1], eC = rmC[kC] && rmC[kC].stand ? rmC[kC] : approach(u, { x: u.chase.to[0], y: u.chase.to[1], size: u.size || 1 }, rmC, 0);
      if (eC && (eC.x !== u.x || eC.y !== u.y)) yield* walkTo(B, u, eC);
      return;
    }
    if (u.ally && (yield* tieDown(B, u))) return; // (two of ours up top and no rope down: one sets one at the lip -- 10-05)
    // the darkness attacks back (the gimmick, magic.js): the one the darts found comes for the caster this turn, nothing else
    if (u.grudge) { var gr = B.units.filter(function (w) { return w.id === u.grudge && G.standing(w); })[0]; delete u.grudge; if (gr) { hs = [gr]; grudge = true; B.card(['{r}' + the(B, u) + '{/} turns on {y}' + gr.name + '{/}.'], 240); yield 16; } }
    // the cloaker and the one the party swore to bring back (RULED 10-01c, Griz: "cloaker focuses on kid if they bring him to that fight"): it hunts him while he stands
    if (!grudge && u.kind === 'cloaker') { var vt = hs.filter(function (w) { return w.vital; })[0]; if (vt) hs = [vt]; }
    // the mission (a defend fight, 10-04 night): the skylight is what it came for -- it goes for the glass unless one of theirs stands within its reach, in the way
    if (!grudge && u.mission) { var msn = hs.filter(function (w) { return w.object && w.id === u.mission; })[0], rchM = reachOf(u, hs); if (msn && !hs.some(function (w) { return !w.object && G.dist(u, w) <= rchM; })) hs = [msn]; else if (msn) hs = hs.filter(function (w) { return !w.object; }).concat([msn]); }
    // nothing but the window (a fight's foe `only`; the Skylights' male giant, 10-05, Griz: "Male stone giant nothing but window, female leads trolls against anyone that tries to stop
    // him"): the glass whoever stands in its reach -- no rock thrown, no blow or opportunity attack at anyone (below; battle.js moveAlong) -- and those set to guard it (`guard`, its id)
    // go for whoever comes within 30 ft of it, the nearest to it first, while it stands; with no one near it, or one of ours in their own reach, the mission as above
    if (!grudge && u.missionOnly && u.mission) { var msO = B.units.filter(function (w) { return w.object && w.id === u.mission && G.standing(w); })[0]; hs = msO ? [msO] : []; }
    if (!grudge && u.guard) {
      var ward = B.units.filter(function (w) { return w.id === u.guard && G.standing(w); })[0];
      var thr = ward ? heroes(B, u).filter(function (w) { return !w.object && G.dist(ward, w) <= 30; }).sort(function (a, b) { return G.dist(ward, a) - G.dist(ward, b); }) : [];
      if (thr.length && !hs.some(function (w) { return !w.object && G.dist(u, w) <= reachOf(u, hs); })) hs = [thr[0]];
    }
    // lost to every eye (magical darkness, fog, a pillar between): the natural lurker -- one the fight began with hidden: the darkmantle, the grick, the roper -- slips back into hiding
    // for nothing, a Stealth roll held as a hero's is; any other foe with a Stealth score pays the Hide action, and only with nothing within its reach to strike (Griz, 10-04: "if
    // a monster is natural stealth and gets found there should be conditions in which it would be lost and found again ... magical darkness"; "only the natural get a free re-hide")
    if (!grudge && !u.conds.hidden && !u.ethereal && !u.riding && T.action > 0 && ((u.stealth || 0) > 0 || u.hidden0) && B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && RU.canAct(w); }).every(function (w) { return B.seenBy(w, u, true) === 0; })) {
      if (u.hidden0) { u.conds.hidden = true; u.hidTotal = B.stealthRoll(u).total; B.card(['{r}' + the(B, u) + '{/} is lost to every eye: hidden again.  {g}(a natural lurker: Stealth ' + u.hidTotal + '){/}'], 200); yield 16; }
      else if (!hs.some(function (w) { return G.dist(u, w) <= reachOf(u, hs); })) { yield* B.hide(u); hs = heroes(B, u); }
    }
    // no one it can see: it goes for where the last blow or spell against its side came from (SRD 5.1, Hiding: "you give away your location when the attack
    // hits or misses" -- battle.js noteHeard); there, one beside it is found by touch (heroes: within 5 ft) -- 10-01c, the rogue runner's find
    if (!hs.length && !grudge && B.heardOf && T.move > 0) {
      var hd = B.heardOf(u);
      if (hd) {
        var eh = approach(u, hd, G.reach(u, T.move), reachOf(u));
        if (eh && (eh.x !== u.x || eh.y !== u.y)) { B.card(['{r}' + the(B, u) + '{/} goes for where the last blow came from.'], 200); yield* walkTo(B, u, eh); if (u.dead || u.hp <= 0) return; }
        hs = heroes(B, u);
      }
    }
    // and sees no one still, with a hidden enemy about: it searches (SRD 5.1: an action; a Perception check against a hider's Stealth -- battle.js search, 10-04); at once with a
    // place to look (a blow heard), and from round 2 without -- Griz: "they should know they're in a fight and searching is a better option than idle"
    if (!hs.length && !grudge && T.action > 0 && !u.conds.disarmed && (B.round >= 2 || (B.heardOf && B.heardOf(u))) && B.units.some(function (w) { return w.conds.hidden && G.hostile(u, w) && G.standing(w); })) { yield* B.search(u); hs = heroes(B, u); }
    // a rope one of its enemies hangs on (10-04, Griz: "so long as they only bother to consider it as a target when someone is climbing it"): it goes for the rope from
    // beside its top -- a melee blow at an object, battle.js cutRope -- walking there first if it can; a rope nobody hangs on is no target
    if (!grudge && T.action > 0 && !u.conds.disarmed && B.ropes && B.ropes.length && !u.missionOnly) { // (nothing but the window cuts no rope: 10-05, the fight log -- the male parted Barley's)
      var ropeT = B.ropes.filter(function (r) { return !r.cut && B.units.some(function (h) { return h.hang && h.hang.rope === r && G.hanging(h) && G.hostile(u, h) && G.standing(h); }); })[0];
      var meleeA = ropeT && Object.keys(u.attacks || {}).map(function (k) { return u.attacks[k]; }).filter(function (a) { return a && !a.ranged && a.dice; })[0];
      if (ropeT && meleeA) {
        var rSpot = { x: ropeT.at[0], y: ropeT.at[1], size: 1 }, rRch = reachOf(u);
        if (G.dist(u, rSpot) > rRch && T.move > 0) { var rEp = approach(u, rSpot, G.reach(u, T.move), rRch); if (rEp && (rEp.x !== u.x || rEp.y !== u.y)) { yield* walkTo(B, u, rEp); if (u.dead || u.hp <= 0) return; } }
        if (G.dist(u, rSpot) <= rRch && T.action > 0) { yield* B.cutRope(u, ropeT, meleeA); return; }
      }
    }
    if (u.regen > 0 && u.hp > 0 && u.hp < u.maxhp && !u.regenRose) { // (regenRose: up from 0 this turn, its knitting already done -- AI.turn, 10-05)
      if (u.burned) { B.card(['{g}' + u.name + ' does not knit: it burned.{/}']); yield 16; }
      else { B.heal(u, u.regen); B.card(['{r}' + u.name + '{/} knits back together.  +' + u.regen]); yield 20; }
    }
    u.burned = false; u.regenRose = false;
    // Second Wind (the Dominion line soldier: 1d10+2 as a bonus action, once, under half)
    if (u.secondWind && !u.secondWindUsed && u.hp > 0 && u.hp < u.maxhp / 2) {
      u.secondWindUsed = true; var sw = D.roll(u.secondWind); B.heal(u, sw.total);
      B.card(['{r}' + the(B, u) + '{/} catches a second wind.  +' + sw.total]); yield 20;
    }
    // innate Darkness (the drow, the captain, the weaver: once, on the 8-bit's chance, or at once to swallow a Light): magic.js castDarkness
    if (u.darkness && u.darkness.chance != null && !u.darkness.used && T.action && hs.length && wantsDark(B, u)) {
      if (yield* D.magic.castDarkness(B, u)) return;
    }
    // the darkmantle's Darkness Aura (SRD, 1/day; torchdark 09-28): the dark pulled in round it the turn it first has someone to
    // hunt -- it hunts by blindsight, they do not (magic.js castAura; the sphere goes where it goes)
    if (u.aura && !u.aura.used && T.action && hs.length && !u.conds.hidden) { if (yield* D.magic.castAura(B, u)) return; }
    // the duergar's Invisibility (SRD, an action; torchdark 09-28): with no one in reach yet it fades from sight and closes unseen;
    // the first blow, a spell or its Enlarge ends it (battle.js attack)
    if (u.invis && !u.invis.used && !u.conds.invisible && T.action && hs.length && !hs.some(function (w) { return G.dist(u, w) <= reachOf(u); })) {
      T.action = 0; u.invis.used = !u.invis.atWill; u.conds.invisible = { ends: true }; delete u.conds.hidden; D.sfx('magic'); FX.sparkle(u, 'silver', 18);
      B.card(['{r}' + the(B, u) + '{/} fades out of sight.  {g}(Invisibility: till it attacks, casts or grows){/}'], 360);
      yield 30;
      var closeOn = hs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0], e0 = approach(u, closeOn, G.reach(u, T.move), reachOf(u));
      if (e0 && (e0.x !== u.x || e0.y !== u.y)) yield* walkTo(B, u, e0);
      return;
    }
    // it bolts (the wheelwright, when Hask is down): Dash for the map's exit and gone -- the player's opportunity attacks are
    // the only stop. (Amara and Willem, who fight only to get away, give ground a step at a time instead: shooter())
    if (u.bolts && B.units.some(function (w) { return w.kind === u.bolts && w.dead; })) { if (yield* bolt(B, u)) return; }
    // recharges (5-6 at the start of its turn): the Moan, the Leap (once a turn: a burrower rolls before it picks where to come up -- burrower)
    if (!T.recharged) [u.moan, u.leap].forEach(function (s) { if (s && !s.ready && D.d(6) >= s.recharge) s.ready = true; });
    // Phantasms (the cloaker when bloodied; Willem at once): three false images, its action
    if (!grudge && u.phantasms && !u.phantasms.used && T.action && (u.phantasms.when === 'start' || u.hp <= u.maxhp / 2)) {
      T.action = 0; u.phantasms.used = true; u.images = 3; D.sfx('magic'); FX.sparkle(u, 'violet', 30);
      B.card(['{r}' + the(B, u) + '{/} splits into shadows: three false shapes wheel about it!  {g}(each blow may go at an image){/}'], 360);
      yield 34;
      if (!hs.length) return;
    }
    // the Moan (the cloaker): every hero within 60 ft, WIS or frightened till the end of its next turn; the mouther's
    // Gibbering is the same shape (20 ft, stunned) -- moan: { dc, recharge, cond, range, text }
    var MO = u.moan, mcond = MO && (MO.cond || 'frightened'), mrange = MO && (MO.range || 60);
    if (!grudge && MO && MO.ready && T.action && hs.filter(function (w) { return G.dist(u, w) <= mrange && !w.conds[mcond]; }).length >= (MO.min || 2)) {
      T.action = 0; MO.ready = false; D.sfx('encounter');
      var ml = ['{r}' + the(B, u) + '{/} ' + (MO.text || 'moans. The sound gets inside you.') + '  WIS DC ' + MO.dc];
      hs.filter(function (w) { return G.dist(u, w) <= mrange; }).forEach(function (w) {
        if (mcond === 'frightened' && w.conds.heroism) { ml.push('  ' + w.name + ': {n}fearless{/} (Heroism)'); return; }
        if (mcond === 'frightened' && RU.immuneTo(w, 'frightened', u)) { ml.push('  ' + w.name + ': {n}fearless{/} (proof against it)'); return; } // (Mindless Rage)
        var sv = RU.save(w, 'wis', MO.dc, false, mcond === 'frightened' ? 'frightened' : 'stunned');
        ml.push('  ' + w.name + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}steady{/}' : mcond === 'stunned' ? '{p}STUNNED{/} (no turn)' : '{o}FRIGHTENED{/} (disadvantage to attack)'));
        if (!sv.ok) w.conds[mcond] = { by: u.id, fresh: true };
      });
      B.card(ml, 420); yield 40; return;
    }
    // the Leap (the bulette): into the air and down on up to two of them standing together (DEX, half on a save)
    if (u.leap && u.leap.ready && T.action && hs.length) { if (yield* leap(B, u, hs)) return; }
    // a spent Web comes back on a 5 or 6 (at the start of its turn)
    if (u.web && !u.web.ready) { var rc = D.d(6); if (rc >= u.web.recharge) { u.web.ready = true; B.card(['{g}' + the(B, u) + ' has web again (d6 ' + rc + ').{/}'], 200); yield 12; } }
    // a grip it can no longer reach goes slack
    (u.holding || []).slice().forEach(function (w) { if (w.dead || w.hp <= 0 || !w.conds.restrained || w.conds.restrained.by !== u.id || G.dist(u, w) > gripReach(u)) B.release(u, w); }); // (gripReach: a grip it has keeps its own reach, whatever it has left to throw -- 10-02)
    // riding the one it holds (the darkmantle attached, battle.js mount; SRD 5.1: "can attack no other creature except the target", its speed 0, it moves with
    // the target): no step of its own -- it squeezes the one it rides
    if (u.riding && u.attached) {
      var host = u.master, ra = Object.keys(u.attacks).map(function (k) { return u.attacks[k]; }).filter(function (a) { return a.rides; })[0];
      // a stirge (SRD 5.1 Blood Drain: the target takes 1d4+3 piercing at the start of each of the stirge's turns, and it lets go after 10 HP drunk or the target's fall)
      if (ra && ra.stinger) {
        if (!host || !G.standing(host)) { B.dismount(u); return; }
        var dn = ra.dice ? D.roll(ra.dice).total + (ra.mod || 0) : 5;
        B.card(['{r}' + the(B, u) + '{/} drinks: ' + dn + ' piercing from ' + host.name + '.  {g}(' + (u.drained || 0) + ' of 10 so far){/}'], 120); FX.sparkle(host, 'red', 8); D.sfx('poison');
        u.drained = (u.drained || 0) + dn; B.hurt(host, dn, ra.type || 'piercing', {}); yield 20;
        if (u.drained >= 10 || !G.standing(host)) { B.card(['{g}' + the(B, u) + ' lets go, swollen.{/}'], 160); B.dismount(u); }
        return;
      }
      if (host && G.standing(host) && T.action && ra) { T.action = 0; yield* B.attack(u, host, ra); }
      return;
    }
    if (!hs.length) return;
    // the Ring of Binding (the chuul, rounds 1/4/7/10): it must turn on whoever wears the ring
    if (B.taunt && B.taunt.rounds.indexOf(B.round) >= 0 && G.standing(B.taunt.u) && hs.indexOf(B.taunt.u) >= 0) {
      hs = [B.taunt.u]; B.card(['{r}' + the(B, u) + '{/} turns on {y}' + B.taunt.u.name + '{/}: the ring binds it  {g}(round ' + B.round + '){/}']); yield 20;
    }
    // Tentacle Slam, instead of the bites and lashes, on what it already holds (the 8-bit game: half the time)
    if (u.slam && u.holding.length && T.action && D.d(100) <= (u.slam.chance || 0.5) * 100) { yield* slam(B, u); return; }
    var near = hs.filter(function (w) { return G.dist(u, w) <= reachOf(u, hs); }).sort(function (a, b) { return a.hp - b.hp; }); // (reachOf with hs: a tendril no one in its reach can be held by counts for nothing, and it walks in to bite -- 10-02)
    // Web: at the start, or whenever no one is in reach -- the nearest free hero it can see, in range
    if (u.web && u.web.ready && T.action && (!near.length || B.round === 1)) {
      var free = hs.filter(function (w) { return !w.conds.restrained && G.dist(u, w) <= u.web.range[1] && G.los(u, w).clear; }).sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); });
      if (free.length) {
        yield* webShot(B, u, free[0]);
        if (u.dead || u.hp <= 0) return;
        // then close on whoever is caught, for next turn's bite
        var caught = hs.filter(function (w) { return w.conds.restrained; })[0] || free[0];
        if (G.dist(u, caught) > G.reachOf(u)) yield* walkTo(B, u, approach(u, caught, G.reach(u, T.move)));
        return;
      }
    }
    if (u.cunning && !grudge && (yield* cunning(B, u, hs))) return; // (the Spy's Cunning Action: the kite, the Dash to close)
    var tgt = near[0], ranged = Object.keys(u.attacks || {}).filter(function (k) { return u.attacks[k].ranged; }).map(function (k) { return u.attacks[k]; });
    // all its attacks at range (Amara, Willem): keep off, step away when pressed, and shoot
    if (ranged.length && ranged.length === Object.keys(u.attacks).length) { yield* shooter(B, u); return; }
    if (!tgt) {
      tgt = hs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
      if (yield* ropeUp(B, u, tgt)) return; // (the fight above it: up a rope, or a rope thrown, or one out of the bucket first -- 10-05)
      var e = approach(u, tgt, G.reach(u, T.move), reachOf(u, hs));
      if (e && (e.x !== u.x || e.y !== u.y)) yield* walkTo(B, u, e);
      else if (u.bound) { // (the camera on it, churning, long enough to read: out of reach it looked frozen -- 09-30g)
        // a bound caster whose class turn picked "its attacks" on someone its pool never reaches (tactics.js weighs the bite by move + reach, not by where the water is) still has its
        // spells: the best of them, before it churns. The Pocket DM's level 3 naga stalled on a sleeping Lymen to the 200-round cap -- its Ray of Frost scored 3.7 and the bite 14 (10-02 runner)
        var alt = u.classAI && T.action && D.tactics && D.tactics.plans ? D.tactics.plans(B, u).filter(function (p) { return p.kind === 'spell' && p.score > 0.5; })[0] : null;
        if (alt) { yield* alt.go(); return; }
        if (B.focus) B.focus(u); var churn = D.spr && D.spr.anim && D.spr.anim(u.sheet, 'flinch'); if (churn) { u.anim = 'flinch'; u.animT = B.t; }
        B.card(['{g}' + the(B, u) + ' churns in its pool; no one is in its reach.{/}'], 260); yield 60; if (churn) { u.anim = 'idle'; u.animT = B.t; }
      }
      else if (!ranged.length) { B.card(['{g}' + the(B, u) + ' paces: it cannot get at anyone.{/}']); yield 20; }
      if (u.dead || u.hp <= 0) return;
    }
    if (!T.action) return;
    var hsNow = heroes(B, u), inReachNow = hsNow.filter(function (w) { return G.dist(u, w) <= reachOf(u, hsNow); });
    if (u.kind === 'cloaker' && inReachNow.some(function (w) { return w.vital; })) inReachNow = inReachNow.filter(function (w) { return w.vital; }); // (the one it hunts, if it got to him: 10-01c)
    // (the roper's tendrils cut or broken come back free at its turn -- rules.js startTurn; RULED 10-02, Griz: "go with SRD for combat". The seat had read the extruding as
    // its action, so a party that cut them all would see it walk in; by the SRD it never has to, and walks only when nothing it has can hold anyone: reachOf, usableOn)
    // Enlarge (the duergar), once, when there is no one to hit yet: its pick hits for the bigger dice from now on (and its Invisibility ends) -- before any throw
    // (10-02: its javelin came in, SRD 5.1; thrown first, it would never grow -- the data runner's find)
    if (!inReachNow.length && u.enlarge && !u.enlarge.used) {
      T.action = 0; u.enlarge.used = true;
      if (u.conds.invisible && u.conds.invisible.ends) { delete u.conds.invisible; B.card(['{g}' + the(B, u) + ' comes back into sight, swelling.{/}'], 200); }
      var big = {}; Object.keys(u.attacks).forEach(function (k) { big[k] = Object.assign({}, u.attacks[k]); if (!big[k].ranged) big[k].dice = u.enlarge.dice; else if (big[k].enlarged) big[k].dice = big[k].enlarged; }); u.attacks = big; // (the javelin's 2d6 enlarged: SRD 5.1)
      var k0 = D.spr.scaleOf(u); u.grown = true; D.spr.regrow(u, k0); // (the look alone: drawn 1.5x, no conds.enlarged -- its dice are already the grown ones)
      D.sfx('buff'); FX.ring(u, 'stone', 30); B.card(['{r}' + the(B, u) + '{/} swells to twice its size!  {g}(Enlarge: its blows hit for ' + u.enlarge.dice + '){/}']);
      yield 30; return;
    }
    // no one in reach after moving: a ranged attack if it has one (the giant's rock, the drow's hand crossbow)
    // nothing but the window, at the window: its rocks -- only what it carried (a fight's foe `rocks`) -- at whoever stands on the edge where a blow knocks them off, the save against
    // going over (battle.js attack, atk.knockOff), the nearest first; else its blows at the glass (10-05, Griz: "be problematic if the male has infinite rocks - two max"; "can we make
    // it so the male throws his two rocks at people on the edge (once he's made it to the window) with a save vs knockback off the edge?")
    var rk = ranged[0], rocksLeft = function () { return u.rocks == null || u.rocks > 0; };
    if (u.missionOnly && rk && rk.range && rocksLeft()) {
      var skyR = B.units.filter(function (w) { return w.object && w.id === u.mission && G.standing(w); })[0];
      var edgeT = skyR && G.dist(u, skyR) <= reachOf(u) ? heroes(B, u).filter(function (w) { return !w.object && G.standing(w) && D.Battle.knockSq(u, w) && G.dist(u, w) <= rk.range[1] && G.los(u, w).clear; }).sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0] : null;
      if (edgeT) { T.action = 0; yield* rockAt(edgeT, Object.assign({}, rk, { knockOff: true })); return; }
    }
    function* rockAt(t, a) { if (u.rocks != null) u.rocks--; yield* B.attack(u, t, a); if (u.rocks != null && !u.dead && u.hp > 0) { B.card(['{g}(' + (u.rocks ? u.rocks + ' rock' + (u.rocks > 1 ? 's' : '') + ' left' : 'its last rock') + '){/}'], 160); yield 10; } }
    // (a fight's `rocks` on the others too -- the female, 10-05, Griz: "1 - yes": the throw while it has one, then none)
    if (!inReachNow.length && ranged.length && !u.missionOnly && rocksLeft()) { var rk0 = u.rocks; if (yield* volley(B, u)) { if (rk0 != null) { u.rocks = Math.max(0, rk0 - 1); B.card(['{g}(' + (u.rocks ? u.rocks + ' rock' + (u.rocks > 1 ? 's' : '') + ' left' : 'its last rock') + '){/}'], 160); } return; } } // (nothing but the window throws at no one but those on the edge: 10-05)
    T.action = 0;
    var names = Object.keys(u.attacks || {}), routine = Array.isArray(u.multi) ? u.multi : [];
    if (!routine.length) for (var i = 0; i < (u.multi || 1); i++) routine.push(names[0]);
    // Action Surge (the Dominion line soldier), once, with two or more in its reach: the routine over again
    if (u.actionSurge && !u.surged && heroes(B, u).filter(function (w) { return G.dist(u, w) <= reachOf(u); }).length >= 2) {
      u.surged = true; routine = routine.concat(routine); D.sfx('buff'); B.card(['{r}' + the(B, u) + '{/} surges!  {g}(Action Surge){/}']); yield 16;
    }
    // Reel (the roper: SRD 5.1, "makes four attacks with its tendrils, uses Reel, and makes one attack with its bite"): after its
    // grappling attacks and before the first that is not one, everyone it holds comes in (reel, below); data/foes.js `reel` in feet
    var reelFt = u.kind && D.FOES[u.kind] && D.FOES[u.kind].reel, reeled = !reelFt;
    // a blow that only follows another's hit (the grick, SRD 5.1: "makes one attack with its tentacles. If that attack hits, the grick
    // can make one beak attack against the same target" -- data/foes.js `afterHit`, 10-02): who each of its blows landed on this turn
    var landed = {};
    for (var k = 0; k < routine.length; k++) {
      var atk = u.attacks[routine[k]];
      if (!atk) break;
      if (atk.afterHit) {
        var on = landed[atk.afterHit];
        if (!on || !G.standing(on) || G.dist(u, on) > G.reachOf(u, atk.reach)) continue;
        yield* B.attack(u, on, atk);
        if (u.dead || u.hp <= 0) return;
        continue;
      }
      if (!reeled && !atk.grapple) { reeled = true; yield* reel(B, u, reelFt); if (u.dead || u.hp <= 0) return; }
      // the weakest in this attack's reach; a grappling attack reaches first for someone it does not already hold; an
      // attack only for the held (the Keeper's Drag Under, the chuul's tentacles) goes at one it holds, or not at all
      var pool = atk.needsHeld ? (u.holding || []).filter(function (w) { return G.standing(w); }) : heroes(B, u).filter(function (w) { return usableOn(u, atk, w); }); // (a tendril is not thrown at one it cannot hold -- 10-02)
      if (B.taunt && B.taunt.rounds.indexOf(B.round) >= 0 && G.standing(B.taunt.u) && !atk.needsHeld) pool = pool.filter(function (w) { return w === B.taunt.u; });
      if (u.kind === 'cloaker' && !atk.needsHeld) { var vp = pool.filter(function (w) { return w.vital && G.dist(u, w) <= G.reachOf(u, atk.reach); }); if (vp.length) pool = vp; } // (the one it hunts, in reach: him first -- 10-01c)
      if (u.missionOnly && !atk.needsHeld) pool = B.units.filter(function (w) { return w.object && w.id === u.mission && G.standing(w); }); // (nothing but the window: 10-05)
      var t = pool.filter(function (w) { return G.dist(u, w) <= G.reachOf(u, atk.reach); }).sort(function (a, b) {
        if (atk.grapple) { var ha = u.holding.indexOf(a) >= 0, hb = u.holding.indexOf(b) >= 0; if (ha !== hb) return ha ? 1 : -1; }
        return a.hp - b.hp;
      })[0];
      if (!t) continue;
      // a hit that only seizes (the roper's tendril, which does no harm) is not thrown at one it holds already, nor with every
      // tendril taken (SRD 5.1: "the roper can't use the same tendril on another target"; grapple.max, its six)
      if (atk.holdOnly && ((u.holding || []).indexOf(t) >= 0 || (u.holding || []).length + (u.tendrilsLost || 0) >= (atk.grapple.max || 1))) continue; // (tendrilsLost: the ones cut or broken this round, battle.js tendrilGone -- 10-02)
      yield* B.attack(u, t, atk, { onHit: (function (key) { return function (w) { landed[key] = w; }; })(routine[k]) });
      if (u.dead || u.hp <= 0) return;
    }
    if (!reeled) yield* reel(B, u, reelFt);
  }

  // Reel (the roper, SRD 5.1: "pulls each creature grappled by it up to 25 feet straight toward it"): a square at a time along the
  // line to the nearest of its squares (the straight step, else the side step that still closes), through its friends' squares
  // but not its foes' (G.canPass: a friend down on the floor is no wall -- the bench's fights stalled on one, 10-01e), landing on
  // the last square on the way it can stand in; beside it, it stops. Dragged, so no opportunity attacks. (Before 10-01e each
  // tendril's hit dragged its one all the way in -- Griz: "we've often been too lenient, 4 please")
  function* reel(B, u, ft) {
    var held = (u.holding || []).filter(function (w) { var r = w.conds.restrained; return r && r.by === u.id && !w.dead && G.dist(u, w) > 5; });
    if (!held.length) return;
    if (D.spr.anim(u.sheet, 'reel')) { u.anim = 'reel'; u.animT = B.t; }
    var S = u.size || 1, said = [];
    held.forEach(function (w) {
      var x0 = w.x, y0 = w.y, x = x0, y = y0, land = null;
      for (var n = Math.floor(ft / 5); n > 0 && G.dist(u, w, null, null, x, y) > 5; n--) {
        var tx = Math.max(u.x, Math.min(u.x + S - 1, x)), ty = Math.max(u.y, Math.min(u.y + S - 1, y)), sx = Math.sign(tx - x), sy = Math.sign(ty - y);
        var step = [[sx, sy], [sx, 0], [0, sy]].filter(function (s) { return (s[0] || s[1]) && G.canPass(w, x + s[0], y + s[1]) && G.dist(u, w, null, null, x + s[0], y + s[1]) < G.dist(u, w, null, null, x, y); })[0];
        if (!step) break;
        x += step[0]; y += step[1];
        if (G.canStand(w, x, y)) land = [x, y];
      }
      // (the line in ends on a square taken -- a friend down beside it: the bench's long fights, 10-01e -- then the open square
      // beside it nearest, if the pull reaches it)
      if (!land || G.dist(u, w, null, null, land[0], land[1]) > 5) {
        var bd = Infinity;
        for (var yy = u.y - 1; yy <= u.y + S; yy++) for (var xx = u.x - 1; xx <= u.x + S; xx++) {
          var dd = Math.max(Math.abs(xx - x0), Math.abs(yy - y0));
          if (dd * 5 > ft || !G.canStand(w, xx, yy) || G.dist(u, w, null, null, xx, yy) > 5) continue;
          if (dd < bd) { bd = dd; land = [xx, yy]; }
        }
      }
      if (land) { w.x = land[0]; w.y = land[1]; }
      var by = 5 * Math.max(Math.abs(w.x - x0), Math.abs(w.y - y0));
      if (by) { w.tween = { fx: x0, fy: y0, fz: 0, t: 0, dur: B.pace(18, true) }; said.push([w.name, by + ' ft' + (G.dist(u, w) <= 5 ? '' : ' (still out of its reach)')]); }
    });
    if (said.length) { B.card(['{r}' + the(B, u) + '{/} reels ' + (said.length > 1 ? 'them in: ' + said.map(function (s) { return s.join(' '); }).join(', ') : said[0][0] + ' in ' + said[0][1]) + '.']); D.sfx('run'); yield 24; }
    // (back to idle once it has reeled: left at 'reel', a roper that ended its turn reeling -- no one in reach for the bite -- never flinched
    // under a blow till its next turn, battle.js hurt reading only an idle one. The test ground's show found it, 10-02)
    if (u.anim === 'reel') u.anim = 'idle';
  }

  // the helpers the class tactics share (js/tactics.js)
  AI.brute = brute; AI.wantsDark = function (B, u) { return wantsDark(B, u); };
  AI.heroes = heroes; AI.approach = approach; AI.walkTo = walkTo; AI.visibleFrom = visibleFrom; AI.eyesAt = eyesAt; AI.reachOf = reachOf; AI.the = the;
  function* guest(B, u) {
    var T = u.turn, fs = heroes(B, u), h = u.src || {}, f = u.feats || {};
    if (!fs.length) { // no one it knows of: a foe under the ground or out of the world gets its weapon readied (SRD 5.1 Ready; battle.js exec 'ready', 10-02), else it waits
      if (T.action && !u.ready && u.weapon && u.weapon.name && B.units.some(function (w) { return G.hostile(u, w) && !w.dead && w.hp > 0 && (w.ethereal || w.under); })) yield* B.exec(u, { do: 'ready', pick: 'weapon' });
      return;
    }
    // a guest who heals (Ingrith: the 8-bit's `healer`, feats.heals): a hand on whoever of her side is worst off under half
    var hurt = B.units.filter(function (w) { return w.side === u.side && G.standing(w) && w.hp < w.maxhp / 2; }).sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; })[0];
    if (h.healer && (f.heals || 0) > 0 && hurt && T.action) {
      if (G.dist(u, hurt) > 5) yield* walkTo(B, u, approach(u, hurt, G.reach(u, T.move), 5));
      if (G.dist(u, hurt) <= 5) {
        T.action = 0; f.heals--; var hv = D.roll('2d8+3'); var got = B.heal(hurt, hv.total); D.sfx('heal'); FX.sparkle(hurt, 'glow', 14);
        B.card(['{y}' + u.name + '{/} lays a hand on ' + hurt.name + ': {n}+' + got + '{/}  {g}(Rekknar balances the account: ' + f.heals + ' left){/}']); yield 24;
        return;
      }
    }
    // a fighter's second wind when hurt -- not a wounded one (Halldor at a third of himself neither winds nor surges, the 8-bit's `wounded`)
    if (u.hp < u.maxhp / 2 && f.secondWind && !h.wounded) {
      T.bonus = 0; f.secondWind = 0;
      var r = D.roll('1d10+' + u.lvl); B.heal(u, r.total);
      B.card(['{y}' + u.name + '{/}: SECOND WIND  +' + r.total]); yield 20;
    }
    var tgt = fs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
    if (G.dist(u, tgt) > G.reachOf(u)) yield* walkTo(B, u, approach(u, tgt, G.reach(u, T.move)));
    if (u.hp <= 0 || !T.action) return;
    T.action = 0;
    // Action Surge (Pyro: the 8-bit's `surgeAI`), once, when two or more stand against him: the attacks over again
    var rounds = h.surgeAI && f.actionSurge && !h.wounded && heroes(B, u).filter(function (w) { return G.dist(u, w) <= G.reachOf(u); }).length >= 2 ? 2 : 1;
    if (rounds > 1) { f.actionSurge = 0; D.sfx('buff'); B.card(['{y}' + u.name + '{/} surges!  {g}(Action Surge: the attacks again){/}']); yield 16; }
    for (var rr = 0; rr < rounds; rr++) for (var k = 0; k < (u.attacks || 1); k++) {
      var t = heroes(B, u).filter(function (w) { return G.dist(u, w) <= G.reachOf(u); })[0];
      if (!t) break;
      yield* B.attack(u, t, u.weapon);
      if (u.hp <= 0) return;
    }
  }
})();
