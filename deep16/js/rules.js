/* DEEP16 — the rules slice (SRD 5.1): the action economy's bookkeeping, advantage and disadvantage and why, cover,
   saves (with Lymen's Aura of Protection), damage (crits double the dice; Great Weapon Fighting rerolls 1s and 2s).
   The heroes' numbers come from the 8-bit game's own rules.js (js/save.js); this layer is the grid's. */
'use strict';
(function () {
  var D = window.D16, G = D.grid;
  var RU = D.rules = {};

  RU.canAct = function (u) { return !u.dead && u.hp > 0 && !u.ethereal && !u.conds.paralyzed && !u.conds.unconscious; };
  RU.ac = function (u) { return (u.baseAC || u.ac) + (u.conds.shield ? 5 : 0); };

  // the turn's economy: MOVE (ft left), ACTION, BONUS, REACTION (the reaction comes back at the start of your own turn)
  RU.startTurn = function (u) {
    u.turn = { move: u.speed, action: 1, bonus: 1, attacksLeft: 0, attackAction: false, sneakUsed: false, disengaged: false, spell: null, bonusSpell: false, moved: 0 };
    u.reaction = 1;
    delete u.conds.dodge;
    delete u.conds.shield;
    D.grid.units.forEach(function (w) { if (w.conds.helped && w.conds.helped.by === u.id) delete w.conds.helped; });
  };

  // Aura of Protection: while the paladin stands, allies within 10 ft (and he) add his CHA to saves
  RU.aura = function (u) {
    if (u.side !== 'party') return 0;
    var best = 0;
    G.units.forEach(function (p) {
      if (p.cls !== 'paladin' || p.lvl < 6 || p.side !== u.side || !G.standing(p) || !RU.canAct(p)) return;
      if (p === u || G.dist(p, u) <= 10) best = Math.max(best, Math.max(1, D.mod(p.abil.cha)));
    });
    return best;
  };
  RU.save = function (u, ab, dc) {
    var bonus = (u.saves ? u.saves[ab] : D.mod(u.abil[ab])) + RU.aura(u);
    var adv = ab === 'dex' && u.conds.dodge;
    var r1 = D.d(20), r2 = adv ? D.d(20) : null, d = adv ? Math.max(r1, r2) : r1;
    var res = { rolls: adv ? [r1, r2] : [r1], d20: d, bonus: bonus, total: d + bonus, dc: dc, ok: d + bonus >= dc, aura: RU.aura(u) };
    // Indomitable (fighter 9): a failed save is rolled again, once a day -- taken at once, and said so
    if (!res.ok && u.cls === 'fighter' && u.feats && u.feats.indomitable) {
      u.feats.indomitable = 0;
      var again = D.d(20);
      res.indomitable = again; res.d20 = again; res.total = again + bonus; res.ok = res.total >= dc;
    }
    return res;
  };

  // advantage and disadvantage for an attack, each with its reason (the card shows them)
  RU.edges = function (att, tgt, atk, ax, ay) {
    var adv = [], dis = [], melee = !atk.ranged && !atk.spell;
    if (att.conds.poisoned) dis.push('poisoned');
    if (att.conds.hidden) adv.push('unseen');
    if (tgt.conds.hidden && G.dist(att, tgt, ax, ay) > 5) dis.push('unseen target');
    if (tgt.conds.faerie) adv.push('faerie fire');
    if (tgt.conds.dodge && !att.conds.hidden) dis.push('dodging');
    if (tgt.conds.helped && tgt.conds.helped.side === att.side) adv.push('help');
    if (tgt.hp <= 0 && !tgt.dead && G.dist(att, tgt, ax, ay) <= 5) adv.push('down');
    if (melee && G.flank(att, tgt, ax, ay)) adv.push('flanking');
    if (!melee) {
      if (G.foesNear(att, ax == null ? att.x : ax, ay == null ? att.y : ay, 5).length) dis.push('in melee');
      if (atk.range && G.dist(att, tgt, ax, ay) > atk.range[0]) dis.push('long range');
    }
    return { adv: adv, dis: dis, net: adv.length && !dis.length ? 1 : dis.length && !adv.length ? -1 : 0 };
  };
  RU.d20 = function (net) {
    var a = D.d(20);
    if (!net) return { rolls: [a], pick: a };
    var b = D.d(20);
    return { rolls: [a, b], pick: net > 0 ? Math.max(a, b) : Math.min(a, b) };
  };
  RU.damage = function (dice, mod, o) {
    var r = D.roll(dice + (mod ? (mod > 0 ? '+' : '') + mod : ''), o);
    return r;
  };
  RU.sneakDice = function (u) { return Math.ceil(u.lvl / 2) + 'd6'; };
  RU.fmtRolls = function (rolls) { return '[' + rolls.join(',') + ']'; };
  RU.sign = function (n) { return (n >= 0 ? '+' : '') + n; };
})();
