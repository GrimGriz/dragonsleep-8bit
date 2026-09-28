/* DEEP16 — the rules slice (SRD 5.1): the action economy's bookkeeping, advantage and disadvantage and why, cover,
   saves (with Lymen's Aura of Protection), damage (crits double the dice; Great Weapon Fighting rerolls 1s and 2s).
   The heroes' numbers come from the 8-bit game's own rules.js (js/save.js); this layer is the grid's. */
'use strict';
(function () {
  var D = window.D16, G = D.grid;
  var RU = D.rules = {};

  RU.canAct = function (u) { return !u.dead && u.hp > 0 && !u.ethereal && !u.conds.paralyzed && !u.conds.asleep && !u.conds.unconscious && !u.conds.stunned && !u.conds.surprised && !u.conds.incapacitated; };
  // AC: armour, Shield, Shield of Faith; and the class NPCs' spells (09-28, js/grimoire.js): Barkskin's floor of 16, Haste's +2,
  // Slow's -2, Warding Bond's +1
  RU.ac = function (u) {
    var c = u.conds, ac = (u.baseAC || u.ac);
    if (c.barkskin) ac = Math.max(ac, 16);
    return ac + (c.shield ? 5 : 0) + (c.shieldOfFaith ? 2 : 0) + (c.hasted ? 2 : 0) - (c.slowed ? 2 : 0) + (c.wardingBond ? 1 : 0);
  };
  // a condition it cannot be given (the 8-bit sheet's condImmune, carried by battle.js makeFoe; review 09-28 #9)
  RU.immuneTo = function (u, cond) { return !!(u && ((u.condImmune && u.condImmune.indexOf(cond) >= 0) || (u.conds && u.conds.freeMove && /restrained|paralyzed|grappled/.test(cond)))); }; // (Freedom of Movement: js/grimoire.js)

  // the turn's economy: MOVE (ft left), ACTION, BONUS, REACTION (the reaction comes back at the start of your own turn)
  RU.startTurn = function (u) {
    u.turn = { move: u.speed, action: 1, bonus: 1, attacksLeft: 0, attackAction: false, sneakUsed: false, disengaged: false, spellAction: null, bonusSpell: false, moved: 0, freeObj: false }; // (freeObj: the turn's one free hand on an object -- a torch dropped, put out or taken up)
    u.reaction = 1;
    delete u.conds.dodge;
    u.acted = true; // it has had a turn (the Cutthroat's Opening Cut reads it)
    delete u.conds.displaceOff; // a Cloak of Displacement works again from the wearer's own turn
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
    var best = 0;
    G.units.forEach(function (p) {
      if (p.cls !== 'paladin' || p.lvl < 6 || p.side !== u.side || !G.standing(p) || !RU.canAct(p)) return; // (either side: a class NPC paladin's too)
      if (p === u || G.dist(p, u) <= 10) best = Math.max(best, Math.max(1, D.mod(p.abil.cha)));
    });
    return best;
  };
  RU.save = function (u, ab, dc) {
    var c = u.conds, bonus = (u.saves ? u.saves[ab] : D.mod(u.abil[ab])) + RU.aura(u) + (c.wardingBond ? 1 : 0) - (ab === 'dex' && c.slowed ? 2 : 0);
    // advantage: Dodge and Haste on DEX; Beacon of Hope on WIS; a creature's own (Danger Sense, Magic Resistance: o.adv). Disadvantage: restrained on DEX
    var adv = (ab === 'dex' && (c.dodge || c.hasted || (c.dangerSense && !c.blinded))) || (ab === 'wis' && c.beacon) || !!(RU.saveAdv && RU.saveAdv(u, ab)), dis = (ab === 'dex' && c.restrained) || !!(RU.saveDis && RU.saveDis(u, ab)); // (the roper's grip on STR: js/traits.js)
    if ((ab === 'str' || ab === 'dex') && (c.paralyzed || c.asleep || c.stunned || c.incapacitated && c.laughing)) return { rolls: [0], d20: 0, bonus: bonus, total: 0, dc: dc, ok: false, aura: 0, auto: true };
    var both = adv !== dis, r1 = D.d(20), r2 = both ? D.d(20) : null, d = both ? (adv ? Math.max(r1, r2) : Math.min(r1, r2)) : r1;
    var bl = c.blessed ? D.d(4) : 0; bonus += bl;
    // Bane (-1d4), Resistance (+1d4, once)
    var bn = c.baned ? D.d(4) : 0; bonus -= bn;
    var rs = c.resistance ? D.d(4) : 0; if (rs) { bonus += rs; delete c.resistance; }
    var res = { rolls: both ? [r1, r2] : [r1], d20: d, bonus: bonus, total: d + bonus, dc: dc, ok: d + bonus >= dc, aura: RU.aura(u), bless: bl, bane: bn, resist: rs };
    // Bardic Inspiration (js/features.js): the die on a save it would turn
    if (!res.ok && c.inspired && D.features) { var ins = D.features.inspire(u, dc - res.total); if (ins) { res.bonus += ins; res.total += ins; res.ok = res.total >= dc; res.bless = (res.bless || 0) + ins; } }
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
    var adv = [], dis = [], melee = !atk.ranged && (!atk.spell || atk.touch); // (a touch spell is a melee attack)
    if (att.conds.poisoned) dis.push('poisoned');
    if (att.conds.frightened) dis.push('frightened');
    // bright light where it stands (js/light.js: a torch's reach, the Light cantrip, Daylight) on one that hates it (the 8-bit's
    // lightSensitive: drow, duergar, the cloaker) -- in the dark, or once a light has been lit in a lit place (the old fight-wide
    // dazzle) -- and a wounded guest swinging anyway (Halldor at a third of himself, the 8-bit js/battle.js) -- review 09-28 #7, #4
    if (att.lightSensitive && D.battle && D.light && (D.battle.dark ? D.light.litByParty(D.battle, att) : D.battle.brightLit)) dis.push('dazzled');
    if (att.guest && att.src && att.src.wounded) dis.push('wounded');
    // prone (09-27: the wolves' and worgs' knockdown, Talmok's, the bulette's Leap, the giant's rock): a prone attacker is at
    // disadvantage; a prone target is easy to hit from beside it and hard from afar
    if (att.conds.prone) dis.push('prone');
    if (tgt.conds.prone) { if (melee && G.dist(att, tgt, ax, ay) <= 5) adv.push('prone target'); else if (!melee) dis.push('prone target'); }
    // Reckless (Talmok, the berserker): it swings with advantage, and everyone swings at it with advantage
    if ((att.reckless || att.conds.reckless) && melee) adv.push('reckless');
    if ((tgt.reckless || tgt.conds.reckless) && melee) adv.push('reckless target'); // (a class barbarian's Reckless Attack: js/tactics.js)
    var DB = D.battle, pen = 0, penWhy = '', mirror = function (eye, seen) { return !!(D.magic && DB && eye.mirrorEye && D.magic.inMirror(DB, eye, seen)); };
    if (att.conds.hidden && !mirror(tgt, att)) adv.push('unseen'); // (the Mirror's eye on her: no hiding in front of it)
    // who cannot see whom (magic.js seeWhy: blinded, magical darkness, fog, the invisible, the dark). An unseen target is attacked
    // at disadvantage (SRD 5.1; AMENDED 09-28 from his -4, which was AD&D's -- R.BLIND keeps the flat penalty as a switch); an
    // unseen attacker attacks with advantage; a blinded creature is both
    if (DB && D.magic) {
      var v1 = D.magic.seeWhy(DB, att, tgt);
      if (!v1.ok) { if (v1.why === 'dark' && D.light && typeof D.light.BLIND === 'number') { pen = D.light.BLIND; penWhy = 'blind'; } else dis.push(v1.why === 'blinded' ? 'blinded' : 'unseen target: ' + v1.why); }
      var v2 = D.magic.seeWhy(DB, tgt, att);
      if (!v2.ok) adv.push(v2.why === 'blinded' ? 'blinded target' : 'unseen attacker: ' + v2.why);
    }
    if (att.conds.restrained) dis.push('restrained');
    if (tgt.conds.restrained) adv.push('restrained target');
    if (tgt.conds.paralyzed || tgt.conds.asleep) adv.push(tgt.conds.asleep ? 'asleep' : 'paralyzed');
    if (tgt.conds.stunned) adv.push('stunned');
    if (tgt.conds.surprised && att.assassinate) adv.push('assassinate');
    // Pack Tactics (the rats, the wolves): advantage while an ally of the attacker who can act stands within 5 ft of the target
    if (att.packTactics && G.units.some(function (w) { return w !== att && w.side === att.side && G.standing(w) && RU.canAct(w) && G.dist(w, tgt) <= 5; })) adv.push('pack tactics');
    if (tgt.conds.hidden && G.dist(att, tgt, ax, ay) > 5 && !mirror(att, tgt)) dis.push('unseen target');
    if (tgt.conds.faerie) adv.push('faerie fire');
    // the class NPCs' spells (09-28, js/grimoire.js): Guiding Bolt's glow (the next attack at it), Vicious Mockery (its own next attack),
    // True Strike (the caster's first at it), Blur (at the blurred: not for blindsight or truesight), Reckless Attack's price
    if (tgt.conds.guided) adv.push('guiding bolt');
    if (tgt.conds.metalEdge && atk.spell) adv.push('metal armour');
    if (att.conds.mocked) dis.push('mocked');
    if (att.conds.trueStrike && att.conds.trueStrike.at === tgt.id) adv.push('true strike');
    if (tgt.conds.blur && !(att.blindsight && G.dist(att, tgt, ax, ay) <= att.blindsight) && !att.truesight) dis.push('blur');
    if (att.conds.disAt && att.conds.disAt.id === tgt.id) dis.push(att.conds.disAt.why || 'cursed'); // (Bestow Curse, Chill Touch on the dead)
    if (tgt.conds.pfeg && /aberration|celestial|elemental|fey|fiend|undead/.test(att.type || '')) dis.push('protection from evil');
    if (tgt.conds.dodge && !att.conds.hidden) dis.push('dodging');
    // Opening Cut (the game's Cutthroat): in the first round, advantage on a foe that hasn't acted yet
    if (att.subclass === 'Cutthroat' && D.battle && D.battle.round === 1 && !tgt.acted && tgt.side !== att.side) adv.push('opening cut');
    // a Cloak of Displacement (SRD 5.1): at disadvantage, until a blow lands on the wearer (back at their turn); nothing while
    // they can't act or can't move (held, stunned, asleep, restrained, down)
    if (tgt.displacement && !tgt.conds.displaceOff && tgt.hp > 0 && !tgt.conds.paralyzed && !tgt.conds.stunned && !tgt.conds.asleep && !tgt.conds.restrained && !tgt.conds.unconscious) dis.push('displacement');
    if (tgt.conds.helped && tgt.conds.helped.side === att.side) adv.push('help');
    if (tgt.hp <= 0 && !tgt.dead && G.dist(att, tgt, ax, ay) <= 5) adv.push('down');
    if (melee && G.flank(att, tgt, ax, ay)) adv.push('flanking');
    if (!melee) {
      if (G.foesNear(att, ax == null ? att.x : ax, ay == null ? att.y : ay, 5).length) dis.push('in melee');
      if (atk.range && G.dist(att, tgt, ax, ay) > atk.range[0]) dis.push('long range');
    }
    return { adv: adv, dis: dis, net: adv.length && !dis.length ? 1 : dis.length && !adv.length ? -1 : 0, pen: pen, penWhy: penWhy };
  };
  // a save's numbers for a card: the d20, the bonus, and what's in it (the aura, Bless)
  RU.saveText = function (sv) {
    if (sv.auto) return '{o}auto-fail{/} (held or asleep)';
    var bits = []; if (sv.aura) bits.push('aura +' + sv.aura); if (sv.bless) bits.push('bless +' + sv.bless); if (sv.bane) bits.push('bane -' + sv.bane); if (sv.resist) bits.push('resistance +' + sv.resist);
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
