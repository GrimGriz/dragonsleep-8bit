/* DEEP16 — the rules slice (SRD 5.1): the action economy's bookkeeping, advantage and disadvantage and why, cover,
   saves (with Lymen's Aura of Protection), damage (crits double the dice; Great Weapon Fighting rerolls 1s and 2s).
   The heroes' numbers come from the 8-bit game's own rules.js (js/save.js); this layer is the grid's. */
'use strict';
(function () {
  var D = window.D16, G = D.grid;
  var RU = D.rules = {};

  RU.canAct = function (u) { return !u.dead && u.hp > 0 && !u.ethereal && !u.conds.paralyzed && !u.conds.asleep && !u.conds.unconscious && !u.conds.stunned && !u.conds.surprised; };
  RU.ac = function (u) { return (u.baseAC || u.ac) + (u.conds.shield ? 5 : 0) + (u.conds.shieldOfFaith ? 2 : 0); };

  // the turn's economy: MOVE (ft left), ACTION, BONUS, REACTION (the reaction comes back at the start of your own turn)
  RU.startTurn = function (u) {
    u.turn = { move: u.speed, action: 1, bonus: 1, attacksLeft: 0, attackAction: false, sneakUsed: false, disengaged: false, spellAction: null, bonusSpell: false, moved: 0 };
    u.reaction = 1;
    delete u.conds.dodge;
    // up off the floor: half its speed (09-27, prone)
    if (u.conds.prone && u.hp > 0) { delete u.conds.prone; u.turn.move = Math.floor(u.speed / 2); if (D.battle) D.battle.card(['{g}' + u.name + ' gets up (half the move).{/}'], 200); }
    delete u.conds.shield;
    D.grid.units.forEach(function (w) { if (w.conds.helped && w.conds.helped.by === u.id) delete w.conds.helped; });
    // Sacred Weapon lasts a minute: ten of his turns (and goes out if he fell)
    if (u.conds.sacred && (u.hp <= 0 || --u.conds.sacred.rounds <= 0)) { delete u.conds.sacred; if (D.battle) D.battle.card(['{g}' + u.name + '\'s blade goes back to steel: Sacred Weapon ends.{/}']); }
    if (D.magic) D.magic.startTurn(D.battle, u);
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
    var adv = ab === 'dex' && u.conds.dodge, dis = ab === 'dex' && u.conds.restrained;
    if ((ab === 'str' || ab === 'dex') && (u.conds.paralyzed || u.conds.asleep || u.conds.stunned)) return { rolls: [0], d20: 0, bonus: bonus, total: 0, dc: dc, ok: false, aura: 0, auto: true };
    var both = adv !== dis, r1 = D.d(20), r2 = both ? D.d(20) : null, d = both ? (adv ? Math.max(r1, r2) : Math.min(r1, r2)) : r1;
    var bl = u.conds.blessed ? D.d(4) : 0; bonus += bl;
    var res = { rolls: both ? [r1, r2] : [r1], d20: d, bonus: bonus, total: d + bonus, dc: dc, ok: d + bonus >= dc, aura: RU.aura(u), bless: bl };
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
    if (att.conds.frightened) dis.push('frightened');
    // prone (09-27: the wolves' and worgs' knockdown, Talmok's, the bulette's Leap, the giant's rock): a prone attacker is at
    // disadvantage; a prone target is easy to hit from beside it and hard from afar
    if (att.conds.prone) dis.push('prone');
    if (tgt.conds.prone) { if (melee && G.dist(att, tgt, ax, ay) <= 5) adv.push('prone target'); else if (!melee) dis.push('prone target'); }
    // Reckless (Talmok, the berserker): it swings with advantage, and everyone swings at it with advantage
    if (att.reckless && melee) adv.push('reckless');
    if (tgt.reckless && melee) adv.push('reckless target');
    if (att.conds.hidden) adv.push('unseen');
    if (att.conds.invisible) adv.push('invisible');
    if (tgt.conds.invisible && !att.conds.invisible) dis.push('invisible target');
    if (att.conds.restrained) dis.push('restrained');
    if (tgt.conds.restrained) adv.push('restrained target');
    if (tgt.conds.paralyzed || tgt.conds.asleep) adv.push(tgt.conds.asleep ? 'asleep' : 'paralyzed');
    if (tgt.conds.stunned) adv.push('stunned');
    if (tgt.conds.surprised && att.assassinate) adv.push('assassinate');
    // Pack Tactics (the rats, the wolves): advantage while an ally of the attacker who can act stands within 5 ft of the target
    if (att.packTactics && G.units.some(function (w) { return w !== att && w.side === att.side && G.standing(w) && RU.canAct(w) && G.dist(w, tgt) <= 5; })) adv.push('pack tactics');
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
  // a save's numbers for a card: the d20, the bonus, and what's in it (the aura, Bless)
  RU.saveText = function (sv) {
    if (sv.auto) return '{o}auto-fail{/} (held or asleep)';
    var bits = []; if (sv.aura) bits.push('aura +' + sv.aura); if (sv.bless) bits.push('bless +' + sv.bless);
    return 'd20 ' + (sv.indomitable ? sv.rolls[0] + ', again ' + sv.indomitable : sv.d20) + ' ' + RU.sign(sv.bonus) + (bits.length ? ' {y}(' + bits.join(', ') + '){/}' : '') + ' = ' + sv.total;
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
