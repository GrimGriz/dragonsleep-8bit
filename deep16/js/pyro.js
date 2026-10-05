/* DEEP16 — Pyro's measure: a named NPC's own turn (ai.js turn reads the sheet's `script` from D.scripts), and the frame for the
   next one. RULED 09-30, Griz: "Have him be level 12, use a single attack with his regular mace in his main hand and then end
   turn, start using the mace of disruption and two attacks if he gets to half hp or a party member goes down - at which time have
   the party incur a major xp penalty and him say something (he's taking the measure of the party). If any character in the party
   leaves the fight, he goes into full lvl 12 combat until the fight is over, and player has to load from a save. If he ever goes
   down player has to load from a save." RULED 09-30b: "The Pyro scripting is intended to be for every fight he guests with the
   party ... the party either loses half XP and continues, or it goes so bad they have to reload - not a particular fight. Custom
   script for custom important NPC." -- "Yes regarding offhand. If we can manage it, he flips the mace of disruption to main hand
   if a party character has exited the fight."

   Phase 1: one swing of the plain mace, then his turn is over; the Mace of Disruption hangs at his belt, unlit.
   Phase 2 (he is at half his HP, or one of the party is down): he draws it -- two swings a turn, one a hand -- and says his piece;
     the party loses half its XP (the 8-bit side takes it: js/pyro.js, off B.pyro through the seam).
   Phase 3 (one of the party has left the fight, out the way they came in: battle.js leave): the white mace into his main hand,
     and full level 12 to the end -- Extra Attack's three, one off-hand strike in the Attack action (Hammer and Tongs, our style at
     his 10th, invented.json #hammer-and-tongs), the off-hand's own bonus-action strike, Action Surge, Second Wind; then the
     player loads from a save.
   Down: the fight ends there (over: 'pyro'), and the player loads from a save.
   He holds back only where he is taking the party's measure: inside the 8-bit game (B.o.embed) or a bench that says so
   (B.o.measure). On the grid's own ladders, and as a foe, he fights at full from the first round. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx, M = D.magic, AI = D.ai, BP = D.Battle.prototype;
  var S = D.scripts = D.scripts || {};
  function tx(k) { var t = window.DS && window.DS.DATA && window.DS.DATA.text[k]; return t ? t.t : k; }
  // the party he is measuring: the player's own, not the guests, the summoned or the familiars
  function party(B) { return B.units.filter(function (w) { return w.side === 'party' && !w.guest && !w.summon && !w.familiar && !w.dominated && !w.loose; }); }
  function kings(B) { return B.units.filter(function (w) { return w.script === 'measure'; }); }
  function foesUp(B, u) { return AI.heroes(B, u).filter(function (w) { return !w.regenDown; }); } // (a troll down and knitting is no blow's -- his maces do not burn: 10-05, the fight log -- he swung five times at one down in a round)
  function inReach(B, u, wp) { var r = G.reachOf(u, wp && wp.reach); return foesUp(B, u).filter(function (w) { return G.dist(u, w) <= r; }); }

  // the measure, kept on the battle (deep16/js/embed.js sends it back as `pyro`)
  function measure(B, u) {
    if (!B.pyro) {
      var held = u.side === 'party' && (B.o.measure != null ? !!B.o.measure : B.fight && B.fight.measure != null ? !!B.fight.measure : !!B.o.embed); // (a fight may say: `measure: false` -- the Skylights, his own city, 10-05, Griz: "pyro full serious business mode" -- at full inside the 8-bit game too; o.measure, the door's &full or the bench's measure=0|1, over both)
      B.pyro = { phase: held ? 1 : 3, held: held, down: false, why: null };
      u.offhandSheathed = held; // (phase 1: the white mace at his belt; from the first round at full it is in his hand)
      if (!held) flip(u);
    }
    return B.pyro;
  }
  function flip(u) { if (u.flipped || !u.offhand) return; var w = u.weapon; u.weapon = u.offhand; u.offhand = w; u.flipped = true; u.offhandSheathed = false; }

  // after every turn (the battle's wave(), its per-turn generator) and at the top of his own: has it gone bad?
  function* watch(B) {
    var ks = kings(B); if (!ks.length) return;
    var u = ks[0], P = measure(B, u);
    if (!P.held) return;
    if (u.hp <= 0 && !P.down) { P.down = true; B.card(['{r}Pyronimus is down.{/}'], 360); D.sfx('ko'); yield 40; return; }
    var ours = party(B), left = ours.some(function (w) { return w.left && w.hp > 0; }), down = ours.some(function (w) { return !w.left && w.hp <= 0; });
    if (P.phase < 3 && left) {
      P.phase = 3; flip(u); B.lightMap = null; D.sfx('encounter');
      yield { scene: { who: u, anim: 'attack', facing: 0, scale: 2.6, frames: 170, tone: 'red', caption: 'RUN, THEN.' } };
      B.card(['{y}Pyronimus{/}: "' + tx('pyro.m3') + '"', '{g}' + tx('pyro.m3Flip') + '{/}'], 480);
      yield 50;
    } else if (P.phase < 2 && (down || u.hp <= u.maxhp / 2)) {
      P.phase = 2; P.why = down ? 'down' : 'hurt'; u.offhandSheathed = false; B.lightMap = null; D.sfx('buff');
      yield { scene: { who: u, anim: 'attack', facing: 0, scale: 2.4, frames: 160, caption: 'THE KING DRAWS THE SECOND MACE.' } };
      FX.sparkle(u, 'bone', 18);
      B.card(['{y}Pyronimus{/}: "' + tx(down ? 'pyro.m2Down' : 'pyro.m2Hurt') + '"', '{g}' + tx('pyro.m2Draw') + '{/}', '{r}' + tx('pyro.m2Xp') + '{/}'], 520);
      yield 60;
    }
  }
  S.watch = watch;
  var wave0 = BP.wave;
  BP.wave = function* () { yield* wave0.apply(this, arguments); yield* watch(this); };
  // his fall ends the fight where it stands
  var over0 = BP.over;
  BP.over = function () { if (this.pyro && this.pyro.held && this.pyro.down) return 'pyro'; return over0.apply(this, arguments); };
  var finish0 = BP.finish;
  BP.finish = function* (o) {
    if (o === 'pyro') { this.fight = Object.assign({}, this.fight, { lost: 'THE KING FALLS.' }); o = 'lost'; }
    yield* finish0.call(this, o);
  };

  // ------------------------------------------------------------------ his turn
  // the king's own way to the roof (a fight's `kingsWay`, the Skylights; 10-05, Griz: "come out the door with the party and in the door when one actually makes the roof, out the waterfall
  // next turn?"): one of the foes standing on the roof -- not clinging to the face -- and he below it: to the vault's doors and in (off the field, his place in the order kept), and at the
  // next round's start out of the falls' curtain at the back of the roof (Battle.lateOut). True when he went for it
  S.toRoof = function* (B, u) {
    var KW = B.fight && B.fight.kingsWay; if (!KW || u.wentIn) return false;
    var st = G.map.def.step, zOut = G.map.gz(KW.out[0][0], KW.out[0][1]);
    if (G.gzAt(u, u.x, u.y) >= zOut - st) return false;
    if (!B.units.some(function (w) { return w.side === 'foe' && G.standing(w) && !w.regenDown && !(w.hang && G.hanging(w)) && G.gzAt(w, w.x, w.y) >= zOut - st; })) return false;
    var T = u.turn, onDoor = function () { return KW.doors.some(function (q) { return q[0] === u.x && q[1] === u.y; }); };
    if (!onDoor()) {
      var pick = function () { var rm = G.reach(u, T.move); return KW.doors.map(function (q) { return rm[q[0] + ',' + q[1]]; }).filter(function (e) { return e && e.stand; }).sort(function (a, b) { return a.cost - b.cost; })[0]; };
      var e = pick(); if (!e && T.action && !T.attacksLeft) { yield* B.exec(u, { do: 'dash' }); e = pick(); }
      if (!e) { var eA = AI.approach(u, { x: KW.doors[0][0], y: KW.doors[0][1], size: 1 }, G.reach(u, T.move), 0); if (eA && (eA.x !== u.x || eA.y !== u.y)) yield* AI.walkTo(B, u, eA); return true; }
      yield* AI.walkTo(B, u, e);
      if (u.hp <= 0 || u.dead || !onDoor()) return true;
    }
    u.wentIn = true; B.map.doorsOpen = true; D.sfx('earth'); B.focus(u);
    B.card(['{y}' + u.name + '{/} goes back in through the vault doors, for the stair to the roof.'], 300); yield 30;
    var k = B.units.indexOf(u); if (k >= 0) B.units.splice(k, 1); u.away = true; B.map.doorsOpen = B.passagesOpen;
    B.late = (B.late || []).concat([{ round: B.round + 1, walk: [{ u: u, from: KW.out[0], to: KW.to || KW.out[0] }], card: KW.card }]);
    yield 20; return true;
  };
  S.measure = function* (B, u) {
    var P = measure(B, u), T = u.turn;
    yield* watch(B);
    if (u.hp <= 0 || !RU.canAct(u) || B.over()) return;
    if (yield* S.toRoof(B, u)) return;
    var foes = foesUp(B, u); if (!foes.length) { yield 16; return; }
    var full = P.phase >= 3, main = u.weapon, off = u.offhand, bonusUsed = false;
    // Second Wind (at full): hurt below two fifths, the bonus action
    if (full && u.feats && u.feats.secondWind && u.hp < u.maxhp * 0.4 && T.bonus) {
      u.feats.secondWind = 0; T.bonus = 0; bonusUsed = true;
      var sw = D.roll('1d10+' + u.lvl); B.heal(u, sw.total); D.sfx('heal'); FX.sparkle(u, 'glow', 14);
      B.card(['{y}' + u.name + '{/}: SECOND WIND  +' + sw.total]); yield 20;
    }
    // the nearest foe; walk to it
    var tgt = foes.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
    if (G.dist(u, tgt) > G.reachOf(u)) { var x0 = u.x, y0 = u.y; yield* AI.walkTo(B, u, AI.approach(u, tgt, G.reach(u, T.move))); if (u.x === x0 && u.y === y0 && !inReach(B, u).length && AI.ropeUp && (yield* AI.ropeUp(B, u, tgt))) return; } // (no way to it on his feet: a rope, as the garrison's -- 10-05)
    if (u.hp <= 0 || !T.action) return;
    if (!inReach(B, u).length) { B.card(['{g}' + u.name + ' cannot reach any of them from here.{/}'], 160); yield 16; return; } // (said, not silent -- 10-05: he stood at the vault ten rounds with no word, the foes all up the face)
    T.action = 0;
    var n = u.attacksBase || 3, plan;
    if (P.phase === 1) plan = [main];
    else if (P.phase === 2) plan = off ? [main, off] : [main, main]; // (the off-hand's is the bonus action's, SRD Two-Weapon Fighting)
    else { plan = []; for (var i = 0; i < n; i++) plan.push(main); if (off) plan.push(off); } // Extra Attack's three; Hammer and Tongs' off-hand in the action
    // Action Surge (at full): once, when two or more stand in his reach -- the Attack action again
    if (full && u.feats && u.feats.actionSurge > 0 && inReach(B, u).length >= 2) {
      u.feats.actionSurge = 0; D.sfx('buff'); B.card(['{y}' + u.name + '{/} surges!  {g}(Action Surge: the attacks again){/}']); yield 16;
      plan = plan.concat(plan.slice());
    }
    if (full && off && !bonusUsed && T.bonus) { plan.push(off); T.bonus = 0; } // the off-hand's own strike, the bonus action
    if (P.phase === 2) T.bonus = 0;
    var first = true;
    for (var k = 0; k < plan.length; k++) {
      var wp = plan[k], rs = inReach(B, u, wp);
      var t = first && G.standing(tgt) && rs.indexOf(tgt) >= 0 ? tgt : rs.sort(function (a, b) { return a.hp - b.hp; })[0];
      first = false;
      if (!t) break;
      yield* B.attack(u, t, wp);
      if (u.hp <= 0 || u.dead) return;
    }
    if (!full) T.move = 0; // (holding back: his swing, and that's his turn)
  };

  // ------------------------------------------------------------------ the King's Mantle: +5 to saving throws against spells (RULED 09-30b)
  // B.spellNow for the length of a cast; RU.save adds the cloak's number to the save it rolls then (js/rules.js R.spellSave)
  var cast0 = M.cast;
  M.cast = function* (B) {
    var was = B.spellNow; B.spellNow = true;
    try { return yield* cast0.apply(this, arguments); } finally { B.spellNow = was; }
  };
  var save0 = RU.save;
  RU.save = function (u, ab) {
    var b = D.battle && D.battle.spellNow && u && u.src && u.saves ? window.DS.R.spellSave(u.src) : 0;
    if (!b) return save0.apply(this, arguments);
    u.saves[ab] += b;
    try { var r = save0.apply(this, arguments); if (r) r.cloak = b; return r; } finally { u.saves[ab] -= b; }
  };
})();
