/* DEEP16 — the bestiary's traits the sheets owed (handoff-2026-09-28-npc-classes-to-six.md §3G; the `todo`s of data/foes.js): each
   SRD 5.1 trait as the grid reads it, keyed off the sheet (D.FOES[kind]). The roper's grip weakens; the black pudding and the gray
   ooze eat weapons and armour (for the fight: their lasting wear waits on the 8-bit's gear); the broodmother folds into the rock
   once, bloodied; the gnoll rampages; the giant boar charges and will not drop to a small blow; the goblin slips away; the ettin's
   two heads; the xorn and the earth elemental glide through the stone. The naga's rejuvenation (days after) and the giant frog's
   Swallow (Small or smaller: none of the four) are not a fight's. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx, M = D.magic, AI = D.ai;
  var TR = D.traits = {};
  function sh(u) { return (u && D.FOES[u.kind]) || {}; }
  function Nm(B, u) { return u.side === 'foe' ? (u.named ? B.shortName(u) : 'The ' + B.shortName(u)) : u.name; }

  // the traits a unit carries from its sheet (battle.js makeFoe copies these)
  TR.FIELDS = ['earthGlide', 'rampage', 'charge', 'relentlessBeast', 'nimble', 'twoHeads', 'corrosive', 'jaunt'];

  // ------------------------------------------------------------------ the roper's tendrils: the grappled one has disadvantage on STR checks
  // and saves (rules.js save reads restrained.weak; magic.js breakFree too)
  var saveAdv0 = RU.saveAdv;
  RU.saveAdv = function (u, ab) { return !!(saveAdv0 && saveAdv0(u, ab)) || (u.twoHeads && (ab === 'wis' || ab === 'con')); }; // (the ettin's Two Heads: its saves against charm, fright and stun, read as WIS and CON)
  RU.saveDis = function (u, ab) { return ab === 'str' && !!(u.conds.restrained && u.conds.restrained.weak); };

  // ------------------------------------------------------------------ the weapon's hit: corrosion both ways, the boar's charge
  var owh = M.onWeaponHit;
  M.onWeaponHit = function* (B, att, tgt, atk, crit) {
    if (owh) yield* owh(B, att, tgt, atk, crit);
    var melee = !atk.ranged;
    // struck in melee: the pudding's Corrosive Form burns the striker (1d8 acid), and a nonmagical weapon of metal or wood that hit it is
    // eaten (-1 damage, cumulative); the gray ooze's Corrode Metal eats a nonmagical metal one
    if (tgt.corrosive && melee && att.weapon && att.weapon === atk) {
      if (tgt.corrosive === 'form' && G.dist(att, tgt) <= 5 && !att.dead && att.hp > 0) { var r = D.roll('1d8'); B.card(['{o}' + Nm(B, att) + ' is burned by the pudding\'s touch{/}  1d8 [' + r.rolls.join(',') + '] = ' + r.total + ' acid'], 240); B.hurt(att, r.total, 'acid'); }
      if (!atk.magic && (tgt.corrosive === 'form' || M.metalWeapon(att)) && att.weapon.name !== 'Unarmed Strike') {
        att.weapon = Object.assign({}, att.weapon, { mod: (att.weapon.mod || 0) - 1, corroded: (att.weapon.corroded || 0) + 1 });
        B.card(['{o}' + Nm(B, att) + '\'s ' + att.weapon.name.toLowerCase() + ' is eaten by the acid: -' + att.weapon.corroded + ' to its damage.{/}  {g}(for the fight){/}'], 260);
      }
    }
    // its pseudopod on a creature in armour: the armour is eaten (-1 AC, cumulative; the ooze only metal)
    if (att.corrosive && !tgt.dead && tgt.baseAC && (tgt.armored || tgt.metalArmor) && (att.corrosive === 'form' || M.metalArmor(tgt))) {
      tgt.baseAC -= 1; tgt.corrodedAC = (tgt.corrodedAC || 0) + 1;
      B.card(['{o}' + Nm(B, tgt) + '\'s armour is eaten: AC ' + RU.ac(tgt) + '.{/}  {g}(for the fight){/}'], 260);
    }
    // Fire Shield (js/grimoire.js): a blow from beside it burns back, 2d8 fire (the warm) or cold (the chill)
    if (tgt.conds.fireShield && melee && G.dist(att, tgt) <= 5 && !att.dead && att.hp > 0) { var fs0 = D.roll('2d8'); B.card(['{o}' + Nm(B, att) + ' is burned by the fire shield{/}  2d8 = ' + fs0.total + ' ' + tgt.conds.fireShield.type], 200); B.hurt(att, fs0.total, tgt.conds.fireShield.type); }
    // the giant boar's Charge: 20 ft straight at it and a tusk that lands -- 2d6 more, and STR or prone
    if (att.charge && att.turn && !att.turn.charged && (att.speed - att.turn.move) >= 20 && !tgt.dead && tgt.hp > 0) {
      att.turn.charged = true;
      var c = att.charge, cr = D.roll(c.dice, { crit: crit }), sv = RU.save(tgt, 'str', c.dc);
      B.card(['{r}' + Nm(B, att) + ' charges home!{/}  ' + c.dice + ' [' + cr.rolls.join(',') + '] = ' + cr.total + '  STR ' + RU.saveText(sv) + ' vs DC ' + c.dc + '  ' + (sv.ok ? '{n}keeps their feet{/}' : '{o}KNOCKED DOWN{/}')], 300);
      B.hurt(tgt, cr.total, atk.type);
      if (!sv.ok && tgt.hp > 0 && !tgt.noProne) tgt.conds.prone = true;
      yield 16;
    }
  };
  // ------------------------------------------------------------------ Relentless (the giant boar, once): a blow of 10 or less that would drop it leaves 1
  TR.refuse = function (B, u, n) {
    if (!u.relentlessBeast || u.relentlessUsed || n > u.relentlessBeast) return false;
    u.relentlessUsed = true; u.hp = 1; FX.ring(u, 'red', 26);
    B.card(['{r}' + Nm(B, u) + ' will not go down!{/}  {g}(Relentless: once, at 1 HP){/}'], 260);
    return true;
  };
  // ------------------------------------------------------------------ a creature dropped: the gnoll's Rampage is ready (its turn, a melee blow)
  TR.onDown = function (B, by, u) { if (by && by.rampage && by.turn && B.active === by && !by.turn.rampaged) by.turn.rampage = true; };

  // ------------------------------------------------------------------ before its turn: the broodmother's jaunt (bloodied, once: into the rock
  // for four of her turns, then out beside the weakest, and the bite)
  TR.turn = function* (B, u) {
    var j = u.jaunt;
    if (!j) return false;
    if (u.ethereal && u.jauntLeft > 0) {
      if (--u.jauntLeft > 0) { B.card(['{g}Something moves in the rock.{/}'], 160); yield 16; return true; }
      var hs = AI.heroes(B, u), tgt = hs.slice().sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; })[0];
      u.ethereal = false; D.sfx('magic');
      if (tgt) { var best = null, bd = Infinity; for (var y = tgt.y - u.size; y <= tgt.y + (tgt.size || 1); y++) for (var x = tgt.x - u.size; x <= tgt.x + (tgt.size || 1); x++) { if (!G.canStand(u, x, y) || G.dist(u, tgt, x, y) > 5) continue; var d = Math.hypot(x - u.x, y - u.y); if (d < bd) { bd = d; best = [x, y]; } } if (best) { u.x = best[0]; u.y = best[1]; } }
      FX.sparkle(u, 'violet', 26); B.focus(u);
      B.card(['{r}' + Nm(B, u) + ' comes out of the rock' + (tgt ? ' beside ' + tgt.name : '') + '!{/}'], 300); yield 24;
      return false; // (and her turn goes on: the bites)
    }
    if (!u.jaunted && u.hp <= u.maxhp / 2) {
      u.jaunted = true; u.ethereal = true; u.jauntLeft = j.rounds || 4;
      if (u.holding && u.holding.length) B.release(u);
      FX.sparkle(u, 'violet', 26); D.sfx('run');
      B.card(['{r}' + Nm(B, u) + ' ' + (j.text || 'folds herself into the rock.') + '{/}  {g}(the Ethereal: ' + u.jauntLeft + ' turns){/}'], 320);
      yield 24; return true;
    }
    return false;
  };
  // ------------------------------------------------------------------ after its routine: the gnoll's Rampage, the goblin's Nimble Escape
  TR.after = function* (B, u) {
    var T = u.turn;
    if (u.dead || u.hp <= 0 || !T) return;
    // Rampage: a bonus action -- half its speed toward the nearest, and a bite
    if (u.rampage && T.rampage && T.bonus) {
      T.bonus = 0; T.rampaged = true;
      var hs = AI.heroes(B, u), t = hs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0], bite = u.attacks && (u.attacks.bite || u.attacks[Object.keys(u.attacks)[0]]);
      if (t && bite) {
        B.card(['{r}' + Nm(B, u) + ' rampages!{/}  {g}(a bite for the bonus action){/}'], 240); yield 12;
        if (G.dist(u, t) > 5) { var mv = T.move; T.move = Math.floor(u.speed / 2); yield* AI.walkTo(B, u, AI.approach(u, t, G.reach(u, T.move), 5)); T.move = Math.min(mv, T.move); }
        if (!u.dead && u.hp > 0 && G.dist(u, t) <= 5) yield* B.attack(u, t, bite);
      }
    }
    // Nimble Escape: Disengage as a bonus action, and back off a step from the one beside it
    if (u.nimble && T.bonus && T.move > 0 && G.foesNear(u, u.x, u.y, 5).length) {
      T.bonus = 0; T.disengaged = true;
      var rm = G.reach(u, T.move), pick = null, ps = -1e9;
      Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand) return; var s = -G.foesNear(u, e.x, e.y, 5).length * 20 - e.cost / 10; if (s > ps) { ps = s; pick = e; } });
      if (pick && G.foesNear(u, pick.x, pick.y, 5).length === 0) { B.card(['{r}' + Nm(B, u) + '{/} darts back.  {g}(Nimble Escape){/}'], 160); yield* AI.walkTo(B, u, pick); }
    }
  };
})();
