/* DEEP16 — the rules slice (SRD 5.1): the action economy's bookkeeping, advantage and disadvantage and why, cover,
   saves (with Lymen's Aura of Protection), damage (crits double the dice; Great Weapon Fighting rerolls 1s and 2s).
   The heroes' numbers come from the 8-bit game's own rules.js (js/save.js); this layer is the grid's. */
'use strict';
(function () {
  var D = window.D16, G = D.grid;
  var RU = D.rules = {};

  RU.canAct = function (u) { return !u.dead && u.hp > 0 && !u.ethereal && !u.conds.paralyzed && !u.conds.asleep && !u.conds.stunned && !u.conds.surprised && !u.conds.incapacitated; };
  // AC: armour, Shield, Shield of Faith; and the class NPCs' spells (09-28, js/grimoire.js): Barkskin's floor of 16, Haste's +2,
  // Slow's -2, Warding Bond's +1
  RU.ac = function (u) {
    var c = u.conds, ac = (u.baseAC || u.ac);
    if (c.barkskin) ac = Math.max(ac, 16);
    var ward = D.battle && D.battle.doorWardOn && u.side === 'party' && u.hp > 0 ? 3 : 0; // the Door-Shield protects the party (battle.js doorWard)
    return ac + (c.shield ? 5 : 0) + (c.shieldOfFaith ? 2 : 0) + (c.hasted ? 2 : 0) - (c.slowed ? 2 : 0) + (c.wardingBond ? 1 : 0) + ward;
  };
  // a condition it cannot be given (the 8-bit sheet's condImmune, carried by battle.js makeFoe; review 09-28 #9)
  // (by: the one laying it, where the caller knows -- Nature's Ward, the druid's 10: no elemental or fey charms or frightens it)
  RU.immuneTo = function (u, cond, by) { return !!(u && ((u.condImmune && u.condImmune.indexOf(cond) >= 0) || (u.natureWard && by && /^(elemental|fey)$/.test(by.type) && /^(charmed|hypnotized|frightened|feared)$/.test(cond)) || (u.conds && u.conds.freeMove && /restrained|paralyzed|grappled/.test(cond))
    || (u.conds && u.conds.raging && u.subclass === 'Path of the Berserker' && u.lvl >= 6 && /^(charmed|hypnotized|frightened|feared)$/.test(cond)) // (Mindless Rage, the Berserker's 6: js/features.js F.mindless suspends what it had)
    || (/^(charmed|hypnotized)$/.test(cond) && G.units && RU.inAura(u, 'devotion')))); }; // (Freedom of Movement: js/grimoire.js; Aura of Devotion: RU.auraOf below)

  // Evasion (SRD 5.1: the rogue's 7, the monk's 7): a DEX save for half -- none on a success, half on a failure; not while incapacitated
  // (the one test for the spells' saves, the breath weapons', the bolts': js/magic.js, js/grimoire.js, js/battle.js, js/ai.js)
  // charmed (SRD 5.1): it cannot attack its charmer or target it with harmful abilities or magical effects -- the AI's lists (ai.js heroes)
  // and the player's hands alike (RULED 09-30, Griz: "yes": battle.js canHit and the attack, magic.js targetOK, the opportunity attack)
  RU.charmedBy = function (u, w) { var c = u && w && u.conds && u.conds.charmed; return !!(c && c.by === w.id); };
  RU.evasion = function (u) {
    if (!u || !(u.evasion || ((u.cls === 'rogue' || u.cls === 'monk') && u.lvl >= 7)) || u.hp <= 0 || u.dead) return false; // (u.evasion: a stat block's -- the assassin's, SRD 5.1; 10-02)
    var c = u.conds || {};
    return !(c.paralyzed || c.asleep || c.stunned || c.incapacitated);
  };
  // Countercharm (the bard's 6): until the end of his next turn, he and the friends within 30 ft who can hear him have advantage on saves
  // against being frightened or charmed -- js/features.js F.countercharm lays it on the bard; he must be able to act
  RU.countercharmed = function (u) {
    return !!(u && G.units && G.units.some(function (b) { return b.cls === 'bard' && b.side === u.side && b.conds && b.conds.countercharm && G.standing(b) && RU.canAct(b) && (b === u || G.dist(b, u) <= 30); }));
  };
  var FRIGHT_CHARM = /^(frightened|feared|charmed|hypnotized)$/;

  // the turn's economy: MOVE (ft left), ACTION, BONUS, REACTION (the reaction comes back at the start of your own turn)
  RU.startTurn = function (u) {
    u.turn = { move: u.speed, action: 1, bonus: 1, attacksLeft: 0, attackAction: false, sneakUsed: false, disengaged: false, spellAction: null, bonusSpell: false, moved: 0, freeObj: false }; // (freeObj: the turn's one free hand on an object -- a torch dropped, put out or taken up)
    u.reaction = 1;
    // the roper's tendrils cut or broken (battle.js tendrilGone, u.tendrilsLost): back at its turn, free, every one -- SRD 5.1, "can extrude a replacement tendril on its next turn"
    // (RULED 10-02, Griz: "go with SRD for combat"; the seat had read the extruding as its action, so a party that cut them all saw it walk in -- by the SRD it never has to)
    if (u.tendrilsLost) { u.tendrilsLost = 0; if (D.battle) D.battle.card(['{g}The ' + u.name + ' extrudes new tendrils.{/}'], 200); }
    // Ready (SRD 5.1: "lets you act using your reaction before the start of your next turn"): a readied strike not sprung by now is let go; a readied spell's held magic
    // dissipates with it -- the concentration it took, and the slot (battle.js exec 'ready', readyHook; 10-02)
    if (u.ready) { var rd0 = u.ready; delete u.ready; if (rd0.what === 'spell') { if (u.conc && u.conc.id === 'ready') delete u.conc; if (D.battle) D.battle.card(['{g}' + u.name + '\'s readied ' + rd0.name + ' dissipates: the moment passed.{/}'], 200); } } // (a weapon lowered says nothing: the ring offers READY again, and a hero waiting on a burrower readies every turn)
    delete u.conds.dodge;
    if (D.battle && D.battle.doorWardOn === u) D.battle.doorWardOn = null; // (the Door-Shield's +3 lasts till its bearer's turn)
    u.acted = true; // it has had a turn (the Cutthroat's Opening Cut reads it)
    delete u.conds.displaceOff; // a Cloak of Displacement works again from the wearer's own turn
    // up off the floor: half its speed (09-27, prone) -- not while it laughs (SRD 5.1 Hideous Laughter: "unable to stand up for the duration"),
    // nor with no speed to pay it with (SRD 5.1: you can't stand up if your speed is 0; Griz, 09-30: "getting up from prone is supposed to
    // cost movement"): paralyzed, stunned, asleep, restrained (a grapple is one here), or incapacitated (magic.js startTurn: no move)
    var noMove = u.conds.laughing || u.conds.dancing || u.conds.paralyzed /* (dancing: "must use all its movement to dance" -- none to stand with; a runner found it standing free, 10-01b) */ || u.conds.stunned || u.conds.asleep || u.conds.restrained || u.conds.incapacitated || u.speed === 0;
    if (u.conds.prone && u.hp > 0 && !noMove) { delete u.conds.prone; u.turn.move = Math.floor(u.speed / 2); if (D.battle) D.battle.card(['{g}' + u.name + ' gets up (half the move).{/}'], 200); }
    delete u.conds.shield;
    D.grid.units.forEach(function (w) { if (w.conds.helped && w.conds.helped.by === u.id) delete w.conds.helped; if (w.conds.helpedCheck && w.conds.helpedCheck.by === u.id) delete w.conds.helpedCheck; }); // (a Help on a friend's check, unspent, lapses at the helper's turn: SRD 5.1)
    // Sacred Weapon lasts a minute: ten of his turns (and goes out if he fell)
    if (u.conds.sacred && (u.hp <= 0 || --u.conds.sacred.rounds <= 0)) { delete u.conds.sacred; if (D.battle) D.battle.card(['{g}' + u.name + '\'s blade goes back to steel: Sacred Weapon ends.{/}']); }
    if (D.magic) D.magic.startTurn(D.battle, u);
  };

  // A paladin's auras (SRD 5.1), up while he stands and can act (conscious): Aura of Protection from 6 (he and allies within
  // 10 ft add his CHA to saves), Aura of Devotion from 7 for the Oath of Devotion (they can't be charmed). null when none is up.
  // One test for the rules and the looks (js/looks.js draws the ring from it).
  RU.auraOf = function (p) {
    if (!p || p.cls !== 'paladin' || p.lvl < 6 || !G.standing(p) || !RU.canAct(p)) return null; // (either side: a class NPC paladin's too)
    return { r: 10, protect: Math.max(1, D.mod(p.abil.cha)), devotion: p.lvl >= 7 && RU.devoted(p) };
  };
  RU.devoted = function (p) { return /devotion/i.test(p.subclass || '') || p.id === 'lymen'; }; // (Lymen's oath is Devotion: its spells are PfEG and Sanctuary)
  RU.inAura = function (u, key) {
    var best = 0;
    G.units.forEach(function (p) {
      if (p.side !== u.side) return;
      var a = RU.auraOf(p); if (!a || !a[key] || (p !== u && G.dist(p, u) > a.r)) return;
      best = Math.max(best, a[key] === true ? 1 : a[key]);
    });
    return best;
  };
  // Aura of Protection: while the paladin stands, allies within 10 ft (and he) add his CHA to saves
  RU.aura = function (u) { return RU.inAura(u, 'protect'); };
  // (adv0: an advantage the caller knows of -- Land's Stride against Entangle. against: the condition the save is against -- 'frightened',
  // 'charmed', or any other a spell lays -- for the bard's Countercharm, the Hunter's Steel Will, and the Fiend's Dark One's Own Luck (it
  // matters). dmg: the damage that rides on it, for that luck too)
  RU.save = function (u, ab, dc, adv0, against, dmg) {
    var c = u.conds, bonus = (u.saves ? u.saves[ab] : D.mod(u.abil[ab])) + RU.aura(u) + (c.wardingBond ? 1 : 0) - (ab === 'dex' && c.slowed ? 2 : 0);
    // the sorcerer's metamagic, for the spell being cast now (js/features.js M.cast: B.meta): Careful Spell -- a chosen friend of his simply
    // succeeds; Heightened Spell -- the chosen target has disadvantage on its first save against it
    var mt = D.battle && D.battle.meta, heightened = false;
    if (mt && mt.ab === ab) {
      if (mt.careful && mt.careful.left > 0 && u.side === mt.by.side && !mt.careful.done[u.id]) { mt.careful.left--; mt.careful.done[u.id] = 1; return { rolls: [0], d20: 0, bonus: bonus, total: 99, dc: dc, ok: true, aura: 0, careful: true }; }
      if (mt.heightened && !mt.heightened.used && G.hostile(mt.by, u) && (!mt.heightened.target || mt.heightened.target === u)) { mt.heightened.used = true; heightened = true; }
    }
    // advantage: Dodge and Haste on DEX; Beacon of Hope on WIS; a creature's own (Danger Sense, Magic Resistance: o.adv). Disadvantage: restrained on DEX
    var ccm = !!(against && FRIGHT_CHARM.test(against) && RU.countercharmed(u)), stw = !!(against && u.hunterDef === 'steelwill' && /^(frightened|feared)$/.test(against)), counter = ccm ? 1 : stw ? 2 : 0; // (Countercharm; Steel Will, the Hunter's 7)
    var pfp = !!(c.poisonWard && /^poison(ed)?$/.test(against || '')); // (Protection from Poison: advantage on saves against being poisoned, and against poison -- js/grimoire.js lays the ward)
    // Duergar Resilience (SRD 5.1: "advantage on saving throws against poison, spells, and illusions, as well as to resist being charmed or paralyzed" -- sheet flag `resilient`, 10-02 runner). A save
    // against a spell is one made while a cast is under way (js/grimoire.js M.cast sets B.castLevel -- 0 for a cantrip -- for the whole of it); a poison that harms rides in as `adv0` (RU.vsPoison), a condition as `against`
    var resil = !!(u.resilient && ((D.battle && D.battle.castLevel != null && against !== 'concentration') || (against && /^(poison(ed)?|charmed|hypnotized|paralyzed)$/.test(against))));
    // Two Heads (SRD 5.1: the ettin has "advantage on saving throws against being blinded, charmed, deafened, frightened, stunned, and knocked unconscious" -- not on WIS and CON saves at large: 10-02 runner)
    var heads = !!(u.twoHeads && against && /^(blinded|charmed|hypnotized|deafened|frightened|feared|stunned|asleep|unconscious)$/.test(against));
    var adv = !!adv0 || counter || pfp || resil || heads || (ab === 'dex' && (c.dodge || c.hasted || (c.dangerSense && !c.blinded))) || (ab === 'wis' && c.beacon) || !!(c.holyAura || c.foresight) || !!(RU.saveAdv && RU.saveAdv(u, ab)) || (ab === 'str' && !!c.enlarged && !c.enlarged.down), dis = heightened || (ab === 'dex' && c.restrained) || !!(RU.saveDis && RU.saveDis(u, ab)) || (ab === 'str' && !!c.enlarged && !!c.enlarged.down); // (Enlarge: advantage on STR saves and checks, Reduce: disadvantage) // (the roper's grip on STR: js/traits.js)
    if ((ab === 'str' || ab === 'dex') && (c.paralyzed || c.asleep || c.stunned)) return { rolls: [0], d20: 0, bonus: bonus, total: 0, dc: dc, ok: false, aura: 0, auto: true }; // (SRD 5.1: the paralyzed, the stunned, the unconscious -- not Hideous Laughter's incapacitated and prone, 10-02, Griz: "yes")
    var both = adv !== dis, r1 = D.d(20), r2 = both ? D.d(20) : null, d = both ? (adv ? Math.max(r1, r2) : Math.min(r1, r2)) : r1;
    var bl = c.blessed ? D.d(4) : 0; bonus += bl;
    // Bane (-1d4), Resistance (+1d4, once)
    var bn = c.baned ? D.d(4) : 0; bonus -= bn;
    var rs = c.resistance ? D.d(4) : 0; if (rs) { bonus += rs; delete c.resistance; }
    var res = { rolls: both ? [r1, r2] : [r1], d20: d, bonus: bonus, total: d + bonus, dc: dc, ok: d + bonus >= dc, aura: RU.aura(u), bless: bl, bane: bn, resist: rs, counter: counter && adv && !dis ? counter : 0, heightened: heightened ? 1 : 0, pfp: pfp && adv && !dis ? 1 : 0, resil: resil && adv && !dis ? 1 : 0, heads: heads && adv && !dis ? 1 : 0 };
    // Bardic Inspiration (js/features.js): the die on a save it would turn
    if (!res.ok && c.inspired && D.features) { var ins = D.features.inspire(u, dc - res.total); if (ins) { res.bonus += ins; res.total += ins; res.ok = res.total >= dc; res.bless = (res.bless || 0) + ins; } }
    // Indomitable (fighter 9): a failed save is rolled again, once a day -- taken at once, and said so
    if (!res.ok && u.cls === 'fighter' && u.feats && u.feats.indomitable) {
      u.feats.indomitable = 0;
      var again = D.d(20);
      res.indomitable = again; res.d20 = again; res.total = again + bonus; res.ok = res.total >= dc;
    }
    // Dark One's Own Luck (the Fiend warlock's 6; SRD 5.1): once a short rest, a d10 on the roll, after it is seen and before it is felt.
    // Taken at once, without asking, when the save fails by 10 or less and the failure matters -- a save against a condition (`against`),
    // or against a heavy blow (`dmg`: as much as 40% of what the creature has left, and 12 at least)
    if (!res.ok && (against || (dmg && dmg >= Math.max(12, u.hp * 0.4)))) {
      var lk = RU.darkLuck(u, dc - res.total);
      if (lk) { res.luck = lk; res.bonus += lk; res.total += lk; res.ok = res.total >= dc; }
    }
    if (!res.ok && against && /^(frightened|feared)$/.test(against) && window.DS.R.fearWard(u.src)) res.ok = true; // (js/rules.js R.fearWard: hidden by ruling -- nothing says why)
    return res;
  };
  // The save a creature takes among `abs` when the effect lets it choose ("a Strength or Dexterity saving throw (target's choice)" -- the bulette's Deadly Leap, SRD 5.1; 10-02 runner):
  // the better bonus (RU.save's own), nudged by what the roll would carry -- advantage or disadvantage (about 3 on the d20), Evasion on a DEX one; a tie goes to the first listed
  RU.bestSave = function (u, abs) {
    var c = u.conds || {}, best = abs[0], bs = -1e9;
    abs.forEach(function (ab) {
      var s = (u.saves ? u.saves[ab] : D.mod(u.abil[ab])) + RU.aura(u) + (c.wardingBond ? 1 : 0) - (ab === 'dex' && c.slowed ? 2 : 0);
      var adv = (ab === 'dex' && (c.dodge || c.hasted || (c.dangerSense && !c.blinded))) || !!(RU.saveAdv && RU.saveAdv(u, ab)) || (ab === 'str' && !!c.enlarged && !c.enlarged.down);
      var dis = (ab === 'dex' && c.restrained) || !!(RU.saveDis && RU.saveDis(u, ab)) || (ab === 'str' && !!c.enlarged && !!c.enlarged.down);
      s += (adv && !dis ? 3 : dis && !adv ? -3 : 0) + (ab === 'dex' && RU.evasion(u) ? 3 : 0);
      if (s > bs) { bs = s; best = ab; }
    });
    return best;
  };
  // Dark One's Own Luck's die for a roll that falls short by `deficit`: 0 when it does not apply (not the Fiend's 6th, spent, or the roll is
  // too far short for a d10 to matter); else the d10, and the use is spent (a short rest brings it back). Saves above; the breaking of a web
  RU.darkLuck = function (u, deficit) {
    if (!(deficit > 0 && deficit <= 10) || !u || u.subclass !== 'The Fiend' || u.lvl < 6 || !u.feats || !(u.feats.darkLuck > 0)) return 0;
    u.feats.darkLuck = 0;
    return D.d(10);
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
    var senses = function (a, b) { return !!(a.senseHidden && G.dist(a, b) <= a.senseHidden); }; // (the snake familiar's caster: the hidden within 15 ft, RULED 09-30)
    if (att.conds.hidden && !mirror(tgt, att) && !senses(tgt, att)) adv.push('unseen'); // (the Mirror's eye on her: no hiding in front of it)
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
    if (att.attached && att.riding && att.master === tgt) adv.push('attached'); // (the darkmantle on the one it rides: SRD 5.1, "has advantage on its attack rolls")
    if (tgt.conds.paralyzed || tgt.conds.asleep) adv.push(tgt.conds.asleep ? 'asleep' : 'paralyzed');
    if (tgt.conds.stunned) adv.push('stunned');
    if (tgt.conds.surprised && att.assassinate) adv.push('assassinate');
    // Pack Tactics (the rats, the wolves): advantage while an ally of the attacker who can act stands within 5 ft of the target
    if (att.packTactics && G.units.some(function (w) { return w !== att && w.side === att.side && G.standing(w) && RU.canAct(w) && G.dist(w, tgt) <= 5; })) adv.push('pack tactics');
    if (tgt.conds.hidden && G.dist(att, tgt, ax, ay) > 5 && !mirror(att, tgt) && !(att.senseHidden && G.dist(att, tgt, ax, ay) <= att.senseHidden)) dis.push('unseen target');
    if (tgt.conds.faerie) adv.push('faerie fire');
    // the class NPCs' spells (09-28, js/grimoire.js): Guiding Bolt's glow (the next attack at it), Vicious Mockery (its own next attack),
    // True Strike (the caster's first at it), Blur (at the blurred: not for blindsight or truesight), Reckless Attack's price
    if (tgt.conds.guided) adv.push('guiding bolt');
    if (att.conds.sickened) dis.push('sickened'); // (Eyebite)
    if (tgt.conds.holyAura) dis.push('holy aura');
    if (tgt.conds.foresight) dis.push('foresight'); if (att.conds.foresight) adv.push('foresight');
    if (tgt.conds.metalEdge && atk.spell) adv.push('metal armour');
    if (att.conds.mocked) dis.push('mocked');
    if (att.conds.trueStrike && att.conds.trueStrike.ready && att.conds.trueStrike.at === tgt.id) adv.push('true strike'); // (`ready`: the caster's next turn has begun, magic.js startTurn)
    if (tgt.conds.blur && !(att.blindsight && G.dist(att, tgt, ax, ay) <= att.blindsight) && !att.truesight) dis.push('blur');
    // (disAt: Bestow Curse, Chill Touch on the dead -- at one target `id`; Heat Metal on armour it cannot shed -- id '*', every attack roll, and every ability check: RU.checkEdges)
    if (att.conds.disAt && (att.conds.disAt.id === tgt.id || att.conds.disAt.id === '*')) dis.push(att.conds.disAt.why || 'cursed');
    if (tgt.conds.pfeg && /aberration|celestial|elemental|fey|fiend|undead/.test(att.type || '')) dis.push('protection from evil');
    if (tgt.conds.dodge && !att.conds.hidden) dis.push('dodging');
    // Opening Cut (the game's Cutthroat): in the first round, advantage on a foe that hasn't acted yet
    if (att.subclass === 'Cutthroat' && D.battle && D.battle.round === 1 && !tgt.acted && tgt.side !== att.side) adv.push('opening cut');
    // a Cloak of Displacement (SRD 5.1): at disadvantage, until a blow lands on the wearer (back at their turn); nothing while
    // they can't act or can't move (held, stunned, asleep, restrained, down)
    if (tgt.displacement && !tgt.conds.displaceOff && tgt.hp > 0 && !tgt.conds.paralyzed && !tgt.conds.stunned && !tgt.conds.asleep && !tgt.conds.restrained) dis.push('displacement');
    if (tgt.conds.helped && tgt.conds.helped.side === att.side) adv.push('help');
    if (tgt.hp <= 0 && !tgt.dead && G.dist(att, tgt, ax, ay) <= 5) adv.push('down');
    if (melee && G.flank(att, tgt, ax, ay)) adv.push('flanking');
    if (!melee) {
      if (G.foesNear(att, ax == null ? att.x : ax, ay == null ? att.y : ay, 5).length) dis.push('in melee');
      if (atk.range && G.dist(att, tgt, ax, ay) > atk.range[0]) dis.push('long range');
    }
    return { adv: adv, dis: dis, net: adv.length && !dis.length ? 1 : dis.length && !adv.length ? -1 : 0, pen: pen, penWhy: penWhy };
  };
  // Protection from Poison (SRD 5.1): "advantage on saving throws against being poisoned". Asked of a save by what it is against: 'poisoned'
  // (the condition) or 'poison' (the stinking cloud's, a poison that does harm) -- RU.save reads it; a caller with no `against` to give
  // (a damage save, where `against` would also wake Dark One's Own Luck) passes RU.vsPoison(w) as the save's `adv0` when the harm is poison
  // (the duergar's Resilience too -- "advantage on saving throws against poison": its sheet's `resilient`, 10-02 runner; RU.save reads the rest of it)
  RU.vsPoison = function (u) { return !!(u && ((u.conds && u.conds.poisonWard) || u.resilient)); };
  // advantage and disadvantage on an ability check of `abil` (SRD 5.1), each with its reason: Enhance Ability (conds.enhanced.abil is the aspect's
  // ability, the one the caster chose among the six -- con, str, dex, cha, int, wis; a record with none is Bear's Endurance, so CON) and Heat Metal's burning armour (disAt '*': every attack roll
  // and ability check). The grid's checks: a web's or a grip's break-free (js/magic.js breakFree) and Hide (js/battle.js)
  RU.checkEdges = function (u, abil) {
    var c = (u && u.conds) || {}, adv = [], dis = [];
    if (c.enhanced && (c.enhanced.abil || 'con') === abil) adv.push('enhance ability');
    if (c.disAt && c.disAt.id === '*') dis.push(c.disAt.why || 'burning metal');
    if (c.helpedCheck) adv.push('help'); // (a friend's Help, SRD 5.1: "advantage on the next ability check it makes ... before the start of your next turn" -- 10-01c; spent by RU.spendHelp)
    return { adv: adv, dis: dis };
  };
  // the check made: a friend's Help is spent on it (the callers of RU.checkEdges that roll -- breakFree, Hide -- call this after the roll)
  RU.spendHelp = function (u) { if (u && u.conds && u.conds.helpedCheck) delete u.conds.helpedCheck; };
  // a save's numbers for a card: the d20, the bonus, and what's in it (the aura, Bless)
  RU.saveText = function (sv) {
    if (sv.auto) return '{o}auto-fail{/} (held or asleep)';
    if (sv.careful) return '{c}spared{/} (Careful Spell)';
    var bits = []; if (sv.aura) bits.push('aura +' + sv.aura); if (sv.bless) bits.push('bless +' + sv.bless); if (sv.bane) bits.push('bane -' + sv.bane); if (sv.resist) bits.push('resistance +' + sv.resist);
    if (sv.counter) bits.push(sv.counter === 2 ? 'advantage: steel will' : 'advantage: countercharm'); if (sv.heightened) bits.push('disadvantage: heightened'); if (sv.pfp) bits.push('advantage: protection from poison'); if (sv.resil) bits.push('advantage: duergar resilience'); if (sv.heads) bits.push('advantage: two heads'); if (sv.luck) bits.push('dark one\'s own luck +' + sv.luck);
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
