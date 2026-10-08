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
  // (Protection from Evil and Good, SRD 5.1: "The target also can't be charmed, frightened, or possessed by them" -- the six types; 10-03, it gave the disadvantage only)
  var OTHERWORLD = /^(aberration|celestial|elemental|fey|fiend|undead)$/, FEAR_CHARM = /^(charmed|hypnotized|frightened|feared|possessed)$/;
  RU.immuneTo = function (u, cond, by) { return !!(u && ((u.condImmune && (u.condImmune.all || (u.condImmune.indexOf && u.condImmune.indexOf(cond) >= 0))) || /* (condImmune { all: true }: a thing, the Edifice's skylight -- a giant's rock that knocks prone threw on it, 10-05 bench) */ (u.natureWard && by && /^(elemental|fey)$/.test(by.type) && /^(charmed|hypnotized|frightened|feared)$/.test(cond)) || (u.conds && u.conds.freeMove && /restrained|paralyzed|grappled/.test(cond))
    || (u.conds && u.conds.pfeg && by && OTHERWORLD.test(by.type || '') && FEAR_CHARM.test(cond))
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

  // can it get up off the floor (SRD 5.1: not with a speed of 0 -- paralyzed, stunned, asleep, restrained (a grapple is one here), incapacitated; not while
  // it laughs or dances): the turn's start asks (below), and so does a walk begun prone (grid.js G.reach)
  RU.canRise = function (u) { var c = u.conds || {}; return !(c.laughing || c.dancing || c.paralyzed || c.stunned || c.asleep || c.restrained || c.incapacitated || u.speed === 0); };
  // up off the floor in the middle of a turn -- knocked flat on the way by an opportunity attack, or flat when it sets off (10-03, the stream: Vivian ran
  // on 20 ft lying down): standing "costs an amount of movement equal to half your speed" (SRD 5.1), paid from the walk if the walk has it; else it crawls (grid.js)
  RU.rise = function (B, u) {
    var half = Math.floor(u.speed / 2);
    if (!u.conds.prone || u.hp <= 0 || !RU.canRise(u) || !u.turn || u.turn.move < half) return false;
    delete u.conds.prone; u.turn.move -= half;
    if (B) B.card(['{g}' + u.name + ' gets up (half the move).{/}'], 200);
    return true;
  };
  // the turn's economy: MOVE (ft left), ACTION, BONUS, REACTION (the reaction comes back at the start of your own turn)
  RU.startTurn = function (u) {
    u.turn = { move: u.speed, action: 1, bonus: 1, attacksLeft: 0, attackAction: false, sneakUsed: false, disengaged: false, spellAction: null, bonusSpell: false, moved: 0, freeObj: false, climbLeft: u.climbs || 0 }; // (climbLeft: the feet of face a climb speed may take this turn -- grid.js G.stepCost, battle.js moveAlong, 10-04 night) // (freeObj: the turn's one free hand on an object -- a torch dropped, put out or taken up)
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
    var noMove = !RU.canRise(u); /* (dancing: "must use all its movement to dance" -- none to stand with; a runner found it standing free, 10-01b) */
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
    if (!p || p.cls !== 'paladin' || p.lvl < 6 || !G.standing(p) || p.conds.asleep) return null; // (either side: a class NPC paladin's too) (SRD 5.1: "You must be conscious" -- asleep is unconscious; held or stunned he is awake and it holds. 10-06: it read able-to-act)
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
  RU.save = function (u, ab, dc, adv0, against, dmg, dis0) { // (dis0: a disadvantage the caller knows of -- Shatter on a creature of stone, js/magic.js area, 10-06)
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
    // Protection from Evil and Good, a charm or fright already on it from one of the six types (SRD 5.1: "advantage on any new saving throw against the relevant effect" -- 10-03)
    var held = c.pfeg && against && FEAR_CHARM.test(against) ? c[/^(frightened|feared)$/.test(against) ? 'frightened' : against] || (/^(frightened|feared)$/.test(against) && c.feared) : null;
    var pfg = !!(held && held.by && D.battle && (D.battle.units || []).some(function (w) { return w.id === held.by && OTHERWORLD.test(w.type || ''); }));
    // Duergar Resilience (SRD 5.1: "advantage on saving throws against poison, spells, and illusions, as well as to resist being charmed or paralyzed" -- sheet flag `resilient`, 10-02 runner). A save
    // against a spell is one made while a cast is under way (js/grimoire.js M.cast sets B.castLevel -- 0 for a cantrip -- for the whole of it), or while the effects of a spell already running are
    // resolved on this creature (js/traits.js: B.spellRun = u, round its turn's start and end, its steps, its hurts -- Spirit Guardians' turn-start save, a zone's, a web's; 10-02); a poison that harms rides in as `adv0` (RU.vsPoison), a condition as `against`
    var resil = !!(u.resilient && ((D.battle && (D.battle.castLevel != null || D.battle.spellRun === u) && against !== 'concentration') || (against && /^(poison(ed)?|charmed|hypnotized|paralyzed)$/.test(against))));
    // Two Heads (SRD 5.1: the ettin has "advantage on saving throws against being blinded, charmed, deafened, frightened, stunned, and knocked unconscious" -- not on WIS and CON saves at large: 10-02 runner)
    var heads = !!(u.twoHeads && against && /^(blinded|charmed|hypnotized|deafened|frightened|feared|stunned|asleep|unconscious)$/.test(against));
    var adv = !!adv0 || counter || pfp || pfg || resil || heads || (ab === 'dex' && (c.dodge || c.hasted || (c.dangerSense && !c.blinded))) || (ab === 'wis' && c.beacon) || !!(c.holyAura || c.foresight) || !!(RU.saveAdv && RU.saveAdv(u, ab)) || (ab === 'str' && !!c.enlarged && !c.enlarged.down), dis = !!dis0 || heightened || (ab === 'dex' && c.restrained) || !!(RU.saveDis && RU.saveDis(u, ab)) || (ab === 'str' && !!c.enlarged && !!c.enlarged.down); // (Enlarge: advantage on STR saves and checks, Reduce: disadvantage) // (the roper's grip on STR: js/traits.js)
    if ((ab === 'str' || ab === 'dex') && (c.paralyzed || c.asleep || c.stunned || (u.hp <= 0 && !u.dead && !u.object))) return { rolls: [0], d20: 0, bonus: bonus, total: 0, dc: dc, ok: false, aura: 0, auto: true }; // (SRD 5.1: the paralyzed, the stunned, the unconscious -- not Hideous Laughter's incapacitated and prone, 10-02, Griz: "yes". At 0 and not dead is unconscious: a troll lying there knitting dodges no flask -- 10-05, Griz: "dead trolls can't dodge! :)")
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
      res.first = res.d20; res.indomitable = again; res.d20 = again; res.total = again + bonus; res.ok = res.total >= dc; // (first: the die it had kept, for the line -- RU.saveText)
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
    // disadvantage; a prone target is easy to hit from beside it and hard from afar -- SRD 5.1: "advantage if the attacker is within 5 feet of the
    // creature. Otherwise, the attack roll has disadvantage", a reach weapon's blow from 10 ft as much as a bow's (10-03, Griz: "If SRD disadvantages
    // for prone at reach, all the normal fights definitely should. It's a tough fight, giving him some disadvantage would do well, SRD please." --
    // the Keeper's Slam from 10 ft on the ones its Wave put down had rolled straight)
    if (att.conds.prone) dis.push('prone');
    if (tgt.conds.prone) { if (G.dist(att, tgt, ax, ay) <= 5) adv.push('prone target'); else dis.push('prone target'); }
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
    if (att.conds.restrained && !att.conds.restrained.only) dis.push('restrained'); // (only: a grip that grapples and does not restrain -- the chuul's, 10-06)
    if (tgt.conds.restrained && !tgt.conds.restrained.only) adv.push('restrained target');
    if (att.attached && att.riding && att.master === tgt) adv.push('attached'); // (the darkmantle on the one it rides: SRD 5.1, "has advantage on its attack rolls")
    if (tgt.conds.paralyzed || tgt.conds.asleep) adv.push(tgt.conds.asleep ? 'asleep' : 'paralyzed');
    if (tgt.conds.stunned) adv.push('stunned');
    if (tgt.conds.surprised && att.assassinate) adv.push('assassinate');
    // Pack Tactics (the rats, the wolves): advantage while an ally of the attacker who can act stands within 5 ft of the target
    if (att.packTactics && G.units.some(function (w) { return w !== att && w.side === att.side && G.standing(w) && RU.canAct(w) && G.dist(w, tgt) <= 5; })) adv.push('pack tactics');
    // (a hidden target is unseen at any distance -- 10-04 night, Griz: "one line", RULED; it was outside 5 ft only, 09-28's torchdark 'heard and felt' beside you. The foe still knows
    // where she is beside it (ai.js heroes) and swings at disadvantage; a hit finds her -- battle.js attack: "it can tell where you are from the force of the blow")
    if (tgt.conds.hidden && !mirror(att, tgt) && !(att.senseHidden && G.dist(att, tgt, ax, ay) <= att.senseHidden)) dis.push('unseen target');
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
    if (tgt.hp <= 0 && !tgt.dead) adv.push('down'); // (SRD 5.1 unconscious: "Attack rolls against the creature have advantage" -- at any range; within 5 ft a hit is a critical, battle.js attack. Till 10-05 only within 5 ft, so a flask or a torch thrown at a troll lying at 0 met the prone's disadvantage alone)
    if (melee && G.flank(att, tgt, ax, ay)) adv.push('flanking');
    if (!melee) {
      if (G.foesNear(att, ax == null ? att.x : ax, ay == null ? att.y : ay, 5).filter(function (w) { return w.hp > 0 && !w.conds.paralyzed && !w.conds.asleep && !w.conds.stunned && !w.conds.incapacitated; }).length) dis.push('in melee'); // (SRD 5.1: a hostile within 5 ft "who can see you and who isn't incapacitated" -- a troll lying at 0 is not: 10-05, his Scorching Ray beside one)
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
    if (sv.auto) return '{o}auto-fail{/} (held, asleep or down)';
    if (sv.careful) return '{c}spared{/} (Careful Spell)';
    var bits = []; if (sv.aura) bits.push('aura +' + sv.aura); if (sv.bless) bits.push('bless +' + sv.bless); if (sv.bane) bits.push('bane -' + sv.bane); if (sv.resist) bits.push('resistance +' + sv.resist);
    if (sv.counter) bits.push(sv.counter === 2 ? 'advantage: steel will' : 'advantage: countercharm'); if (sv.heightened) bits.push('disadvantage: heightened'); if (sv.pfp) bits.push('advantage: protection from poison'); if (sv.resil) bits.push('advantage: duergar resilience'); if (sv.heads) bits.push('advantage: two heads'); if (sv.luck) bits.push('dark one\'s own luck +' + sv.luck);
    // (both dice when it rolled two, as an attack's line shows them: the cast's own advantage -- Dominate's "it is being fought" -- had read as one die in the gallery; the grid's rules §2c, 10-08)
    var kept = sv.indomitable ? sv.first : sv.d20, die = sv.rolls && sv.rolls.length === 2 ? '[' + sv.rolls.join(',') + ']>' + kept : kept; // (and Indomitable's reroll after the die it had kept, not after the first rolled)
    return 'd20 ' + die + (sv.indomitable ? ', again ' + sv.indomitable : '') + ' ' + RU.sign(sv.bonus) + (bits.length ? ' {y}(' + bits.join(', ') + '){/}' : '') + ' = ' + sv.total;
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

  // ------------------------------------------------------------------ the stream's log (10-07, Griz, the Game Show lane's note: "no dice roll lines ... under the heart line, just
  // Rascal and the HP, and under the group hug line, all 3 names and green HP numbers on one line")
  // D.STREAM (js/core.js: `&stream` in the address, or ?gameshow): Battle.prototype.card runs every card's lines through RU.streamLines before the card is kept or drawn -- the one
  // choke point, so no caller has a stream branch. What it makes of a card: the creatures one move touches become ONE line joined with " · ", each a name and a number (a heal
  // "Rascal {n}+36{/}" in the green, a blow's damage "Goblin {r}-12{/}", a rider that matters beside it: PRONE, DOMINATED, "poisoned ended"); an attack's d20 line and its damage
  // line become one line, the outcome and what it did ("HIT  Goblin -12"; "MISS"); any other roll line (a check, a save, a total) loses its dice expression, its rolls and the
  // reasons riding on them. Prose that only has a dice word in it (the show's captions, "4d6 + WIS + 7") is left alone: a roll line is a dice expression followed by its rolls,
  // or a d20 followed by its "=". Off, nothing here is read, so a fight's cards are what they were
  var RE_D20 = /\bd20\s+(?:\[\d+(?:,\d+)*\]>)?\d+(?:\s*[+-]\s*\d+|\s+\{[a-z]\}[^{}]*\{\/\}|\s+\([^()]*\))*\s*=\s*/g;                          // d20 [5,3]>3 +7 (front) =
  var ROLL = '\\b\\d*d\\d+(?:\\s*[+-]\\s*\\d+(?![\\dd]))*(?:\\s+\\{[a-z]\\}[^{}]*\\{\\/\\})*\\s*\\[(?:\\d+(?:,\\d+)*)?\\](?:\\s*[+-]\\s*\\d+(?![\\dd]))?(?:\\s+\\{[a-z]\\}[^{}]*\\{\\/\\})*';   // 5d6+5 +9 {g}(big heart){/} [6,4,5,6,1] {y}+4 affinity{/}
  var RE_ROLLS = new RegExp(ROLL + '(?:\\s*\\+\\s*' + ROLL + ')*(?:\\s*=\\s*)?', 'g');                                                       // (and a second kind beside it: Ice Storm's "2d8 [2,7] + 4d6 [3,5,1,5] =")
  var RE_DC = /\s+(?:STR|DEX|CON|INT|WIS|CHA) DC \d+/g, RE_VSDC = /\s*(?:(?:STR|DEX|CON|INT|WIS|CHA)(?: save)?)?\s+\d+ vs DC \d+/g, RE_TARGET = /^ {2}([^:{}]+): (.*)$/;   // (a save left as its total against its DC: "CON 9 vs DC 10")
  var RE_INLINE = /(\b[A-Z][^:{}]*?): (?:\d+ )?-> \{r\}(\d+)\{\/\}/, RE_TOTAL = /\s+\{o\}\d+\{\/\} [a-z]+(?: \+ \{o\}\d+\{\/\} [a-z]+)*(?=\s|$)/;                       // (a creature and its damage inside a head line: Hot Take)
  function streamPlain(l) {
    if (typeof l !== 'string') return l;
    var s = l.replace(RE_D20, '').replace(RE_ROLLS, '').replace(RE_DC, '').replace(RE_VSDC, '');
    if (s === l) return l;
    s = s.replace(/^( {2}[^:{}]+:) \d+ (?=\S)/, '$1 ').replace(/: {2,}/g, ': ');                                                            // (a save's bare total: "  The Ogre: 17 keeps its head")
    var inl = s.replace(RE_INLINE, function (m, n, d) { return n + ' {r}' + (+d ? '-' : '') + d + '{/}'; });
    if (inl !== s) s = inl.replace(RE_TOTAL, '');                                                                                            // (it said what it rolled in total; the creature says what it took)
    return s.replace(/: \{n\}(\d+)\{\/\}/g, ' {n}+$1{/}').replace(/: \{r\}(\d+)\{\/\}(?: [a-z]+)?/g, ' {r}-$1{/}').replace(/ {3,}/g, '  ').replace(/\s+$/, ''); // (a heal or a blow in a head line: "on Fighter 7 +13", "squeezes the Ogre -27")
  }
  // what rides on a creature's line besides the number: a condition in capitals (PRONE, DOMINATED, FRIGHTENED) or a cure ("poisoned ended"), in the colour it had
  function streamRiders(rest) {
    var out = [], rx = /\{([a-z])\}([^{}]*)\{\/\}/g, m;
    while ((m = rx.exec(rest))) {
      var caps = m[2].match(/[A-Z]{3,}(?: [A-Z]{3,})*/g), fl = /^failed: ([a-z]+)$/.exec(m[2]);
      if (caps) caps.forEach(function (c) { out.push(' {' + m[1] + '}' + c + '{/}'); });
      else if (fl) out.push(' {' + m[1] + '}' + fl[1].toUpperCase() + '{/}');
      else if (/ ended$/.test(m[2])) out.push(' {' + m[1] + '}' + m[2] + '{/}');
    }
    return out.join('');
  }
  // one creature's result line ("  Denny: 4d4+4 +7 (big heart) [1,2,1,4] = +19", "  The Wolf: d20 9 +2 = 11 failed: PRONE -> 11") as name + number
  function streamTarget(l) {
    var m = typeof l === 'string' ? RE_TARGET.exec(l) : null; if (!m) return null;
    var d = /->\s*\{r\}(\d+)\{\/\}/.exec(m[2]) || (/\bd20\b/.test(m[2]) && /\{r\}(\d+)\{\/\}(?: \([^()]*\))?\s*$/.exec(m[2])), h = d ? null : /=\s*\{n\}\+(\d+)\{\/\}/.exec(m[2]); // (the arrow, or -- on a save's line -- the number last on it: the Leap's "  {r}13{/} (8 + 5)")
    if (!d && !h) return null;
    return { heal: !!h, text: m[1] + ' ' + (h ? '{n}+' + h[1] + '{/}' : '{r}' + (+d[1] ? '-' : '') + d[1] + '{/}') + streamRiders(m[2]) };
  }
  // a damage line under a blow ("1d8+4 [4]+4 = 8 bludgeoning  4d6 [2,1,5,6] bludgeoning  = 22"): what is left of it is the total at its end, or null if it is not one
  function streamBlow(l) { var s = String(l), m = /\s=\s\{r\}(\d+)\{\/\}\s*$/.exec(s); return m && /^(?:\{[a-z]\})?\d/.test(s) ? +m[1] : null; }
  RU.streamLines = function (ls) {
    var out = [], run = [], isRun = [], dmg = false, who = /\{r\}([^{}]+)\{\/\}/.exec(String(ls[0])), at = who ? who[1] + ' ' : ''; // (the one a card's head names as struck: "{y}Denny{/} > {r}Ogre{/}  Greatclub", "{r}Denny{/}: CON save")
    function flush() { if (run.length) { out.push('  ' + run.join(' · ')); isRun[out.length - 1] = true; run = []; } }
    // an attack's card, [the head, its d20 line, its damage line]: the head, then ONE line -- the outcome words (HIT, CRITICAL, MISS, SHIELD +5), and the blow's total on the one it struck
    var s1 = ls.length >= 2 ? String(ls[1]) : '';
    if (/^d20 /.test(s1)) {
      var outcome = [], rx = /\{[a-z]\}([^{}]*)\{\/\}/g, t, rest = [], total = null;
      while ((t = rx.exec(s1))) if (/^(?:[A-Z]{3,}|the image bursts|a false image)/.test(t[1])) outcome.push(t[0]);
      for (var j = 2; j < ls.length; j++) { var bj = total === null ? streamBlow(ls[j]) : null; if (bj !== null) total = bj; else rest.push(ls[j]); }
      if (outcome.length) return [streamPlain(ls[0]), outcome.join('  ') + (total === null ? '' : '  ' + at + '{r}' + (total ? '-' : '') + total + '{/}')].concat(rest.map(streamPlain));
    }
    ls.forEach(function (l, i) {
      var t = streamTarget(l), b = !t && i > 0 ? streamBlow(l) : null;
      if (t) { run.push(t.text); if (!t.heal) dmg = true; return; }
      flush();
      out.push(b === null ? streamPlain(l) : at + '{r}' + (b ? '-' : '') + b + '{/}'); // (a save-or-bite card: "{r}Denny{/}: CON save ... SAVED", then the poison's dice line and its total)
    });
    flush();
    // (a move's head said what it rolled in total; the lines under it say what each creature took)
    if (dmg) out = out.map(function (l, i) { return isRun[i] || typeof l !== 'string' ? l : l.replace(RE_TOTAL, ''); });
    return out;
  };
})();
