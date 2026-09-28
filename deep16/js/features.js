/* DEEP16 — the class features (handoff-2026-09-28-npc-classes-to-six.md §3A/3C): what each SRD 5.1 class brings to a fight at
   levels 1-6 beyond its weapon and its spells, and how the class tactics (js/tactics.js) use it. The four heroes' own features
   (the fighter's, the rogue's, the paladin's, the wizard's) live where they did (battle.js, the ring); these are the other
   classes', and the AI's hand for the ones the heroes share. Built for the class NPCs first; a hero of these classes (the
   Pocket DM's horizon) would want its ring buttons, not built yet. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx, M = D.magic, AI = D.ai, TX = D.tactics;
  var F = D.features = {};
  function nm(B, w) { return w.side === 'foe' ? (w.named ? B.shortName(w) : 'the ' + B.shortName(w)) : w.name; }
  function Nm(B, w) { var s = nm(B, w); return s.charAt(0).toUpperCase() + s.slice(1); }
  function feat(u, k) { return u.feats && u.feats[k] > 0; }
  function foesBeside(B, u) { return B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && G.dist(u, w) <= (u.reach || 5); }); }
  function kiDC(u) { return 8 + u.prof + D.mod(u.abil.wis); }

  // ------------------------------------------------------------------ the wizard: Sculpt Spells (evocation 2), Potent Cantrip (6)
  var EVOCATION = ['fireball', 'lightningbolt', 'burninghands', 'thunderwave', 'shatter', 'icestorm', 'coneofcold', 'magicmissile', 'daylight', 'light', 'dancinglights', 'firebolt', 'rayoffrost', 'shockinggrasp', 'sacredflame', 'produceflame', 'flameblade', 'gustofwind', 'calllightning', 'spiritualweapon', 'continualflame', 'guidingbolt'];
  M.sculpts = function (u, id) { return u.subclass === 'School of Evocation' && u.lvl >= 2 && EVOCATION.indexOf(id) >= 0; };
  M.sculpted = function (u, id, sp, caught) {
    if (!M.sculpts(u, id)) return [];
    return caught.filter(function (w) { return w.side === u.side; }).sort(function (a, b) { return (a === u) - (b === u); }).slice(0, 1 + (sp.level || 0));
  };
  // ------------------------------------------------------------------ the sorcerer: Elemental Affinity (Draconic 6)
  M.affinity = function (u, el) { return u.subclass === 'Draconic Bloodline' && u.lvl >= 6 && el === (u.src && u.src.ancestry || 'fire') ? Math.max(0, D.mod(u.abil.cha)) : 0; };

  // ------------------------------------------------------------------ the barbarian: Rage, Reckless Attack, Danger Sense, Frenzy
  // Rage (a bonus action; SRD 5.1): +2 to STR melee damage, blades and blows halved (battle.js hurt), advantage on STR checks and saves;
  // a minute (ten of its turns). Frenzy (the Berserker, 3): while raging, a bonus-action swing each turn after
  RU.saveAdv = function (u, ab) { return (ab === 'str' && !!u.conds.raging) || (ab === 'dex' && u.cls === 'barbarian' && u.lvl >= 2 && !u.conds.blinded); };
  TX.FIRST.unshift(function* (B, u) {
    if (u.cls !== 'barbarian' || u.conds.raging || !feat(u, 'rage') || !u.turn.bonus || u.conds.incapacitated) return;
    var fs = TX.foesOf(B, u);
    if (!fs.some(function (t) { return G.dist(u, t) <= u.turn.move + (u.reach || 5) + (u.turn.action ? 0 : 0); })) return;
    u.turn.bonus = 0; u.feats.rage--;
    u.conds.raging = { dmg: u.lvl >= 16 ? 4 : u.lvl >= 9 ? 3 : 2, till: { who: u.id, at: 'start', n: 10 }, endText: '{who}\'s rage burns out.' };
    if (u.subclass === 'Path of the Berserker') u.conds.frenzy = true;
    D.sfx('crit'); FX.ring(u, 'red', 34);
    B.card(['{r}' + Nm(B, u) + ' RAGES!{/}  {g}(+' + u.conds.raging.dmg + ' damage, blades and blows halved' + (u.conds.frenzy ? ', and the frenzy: a swing for the bonus action' : '') + '){/}'], 300);
    yield 20;
  });
  // Reckless Attack (2): the first swing of the turn decides -- advantage on its STR swings, and at it, till its next turn
  F.reckless = function (u) { return u.cls === 'barbarian' && u.lvl >= 2 && u.hp > u.maxhp * 0.35; };
  // ------------------------------------------------------------------ the monk: Martial Arts, Flurry of Blows, Patient Defense, Stunning Strike,
  // Open Hand Technique, Deflect Missiles, Ki-Empowered Strikes, Wholeness of Body
  F.fist = function (u) {
    var R = window.DS.R, h = u.src; if (!h) return null;
    var w = D.save.weaponOf(Object.assign({}, h, { equip: Object.assign({}, h.equip, { weapon: 'unarmed' }) }));
    w.name = 'Unarmed Strike'; if (u.lvl >= 6) w.magic = true; // (Ki-Empowered Strikes)
    return w;
  };
  // after the Attack action: the bonus action's strikes -- Flurry (1 ki, two) or Martial Arts (one)
  TX.AFTER.unshift(function* (B, u) {
    var T = u.turn;
    if (u.cls !== 'monk' || !T.bonus || !T.attackAction || u.conds.disarmed) return;
    var near = foesBeside(B, u); if (!near.length) return;
    var fist = F.fist(u), flurry = u.lvl >= 2 && feat(u, 'ki');
    T.bonus = 0;
    if (flurry) { u.feats.ki--; B.card(['{y}' + Nm(B, u) + '{/}: FLURRY OF BLOWS  {g}(1 ki, ' + u.feats.ki + ' left){/}'], 200); } else B.card(['{y}' + Nm(B, u) + '{/}: a strike of the martial arts {g}(bonus action){/}'], 160);
    for (var i = 0; i < (flurry ? 2 : 1); i++) {
      var t = foesBeside(B, u).sort(function (a, b) { return a.hp - b.hp; })[0]; if (!t) break;
      var keep = u.weapon; u.weapon = fist; T.flurry = flurry;
      yield* B.attack(u, t, fist);
      u.weapon = keep; T.flurry = false;
      if (u.dead || u.hp <= 0) return;
    }
  });
  // Stunning Strike (5) and Open Hand Technique (3): what the monk does with a hit (battle.js attack asks, M.onWeaponHit)
  M.onWeaponHit = function* (B, att, tgt, atk, crit) {
    if (tgt.dead || tgt.hp <= 0) return;
    // Open Hand Technique: a Flurry hit -- DEX or prone (the monk's choice: down, for the swings to come)
    if (att.cls === 'monk' && att.lvl >= 3 && att.subclass === 'Way of the Open Hand' && att.turn && att.turn.flurry && !tgt.conds.prone && !tgt.noProne && !RU.immuneTo(tgt, 'prone') && (tgt.size || 1) <= 2) {
      var sv = RU.save(tgt, 'dex', kiDC(att));
      B.card(['  {y}open hand{/}: ' + Nm(B, tgt) + ' DEX ' + RU.saveText(sv) + ' vs DC ' + kiDC(att) + '  ' + (sv.ok ? '{n}keeps their feet{/}' : '{o}PRONE{/}')], 240);
      if (!sv.ok) tgt.conds.prone = true;
      yield 12;
    }
    // Stunning Strike: 1 ki, CON or stunned till the end of the monk's next turn; the AI's monk spends it on one worth stunning
    if (att.cls === 'monk' && att.lvl >= 5 && feat(att, 'ki') && !tgt.conds.stunned && !RU.immuneTo(tgt, 'stunned') && !(att.turn && att.turn.stunTried) && (att.side !== 'party' || att.guest) && TX.dpr(tgt) >= 5 && TX.pFail(tgt, 'con', kiDC(att)) >= 0.3) {
      att.feats.ki--; att.turn.stunTried = true;
      var s2 = RU.save(tgt, 'con', kiDC(att));
      B.card(['  {y}stunning strike{/} {g}(1 ki){/}: ' + Nm(B, tgt) + ' CON ' + RU.saveText(s2) + ' vs DC ' + kiDC(att) + '  ' + (s2.ok ? '{n}shakes it off{/}' : '{p}STUNNED{/}')], 300);
      if (!s2.ok) { tgt.conds.stunned = { by: att.id, till: { who: att.id, at: 'end', n: 2 } }; FX.ring(tgt, 'gold', 26); }
      yield 16;
    }
    // Colossus Slayer (the Hunter ranger, 3): once a turn, +1d8 on a weapon hit on one already hurt
    // (dealt as its own blow so the card shows it)
    if (att.cls === 'ranger' && att.lvl >= 3 && att.subclass === 'Hunter' && att.turn && !att.turn.colossus && tgt.hp < tgt.maxhp && !atk.spell) {
      att.turn.colossus = true; var cs = D.roll('1d8', { crit: crit });
      B.card(['  {y}colossus slayer{/} 1d8 [' + cs.rolls.join(',') + '] = {r}' + cs.total + '{/}'], 200); B.hurt(tgt, cs.total, atk.type);
      yield 8;
    }
  };
  // Deflect Missiles (3): the reaction that catches a ranged weapon's blow -- 1d10 + DEX + level off it
  M.deflect = function (B, tgt, atk, dmg) {
    if (tgt.cls !== 'monk' || tgt.lvl < 3 || !atk.ranged || atk.spell || !tgt.reaction || !RU.canAct(tgt)) return 0;
    tgt.reaction = 0;
    var r = D.roll('1d10'), cut = Math.min(dmg, r.total + D.mod(tgt.abil.dex) + tgt.lvl);
    B.card(['  {c}' + Nm(B, tgt) + ' deflects the missile: -' + cut + '{/}'], 240); FX.sparkle(tgt, 'silver', 12);
    return cut;
  };
  // Patient Defense / Wholeness of Body: a monk that is losing
  TX.ACTIONS.push(function (B, u) {
    if (u.cls !== 'monk' || u.lvl < 6 || !feat(u, 'wholeness') || u.hp > u.maxhp * 0.35 || !u.turn.action) return null;
    return { kind: 'feature', why: 'Wholeness of Body', score: Math.min(u.maxhp - u.hp, 3 * u.lvl) * 1.3, go: function* () { u.turn.action = 0; u.feats.wholeness = 0; var got = B.heal(u, 3 * u.lvl); D.sfx('heal'); B.card(['{y}' + Nm(B, u) + '{/}: WHOLENESS OF BODY  {n}+' + got + '{/}'], 240); yield 20; } };
  });
  TX.AFTER.push(function* (B, u) {
    var T = u.turn;
    if (u.cls !== 'monk' || u.lvl < 2 || !T.bonus || !feat(u, 'ki') || u.hp > u.maxhp * 0.4 || !foesBeside(B, u).length) return;
    T.bonus = 0; u.feats.ki--; u.conds.dodge = true;
    B.card(['{y}' + Nm(B, u) + '{/}: PATIENT DEFENSE  {g}(1 ki: a Dodge){/}'], 200); yield 12;
  });

  // ------------------------------------------------------------------ the rogue: Cunning Action for the AI's rogues (the player's has the ring's)
  TX.AFTER.push(function* (B, u) {
    var T = u.turn;
    if (u.cls !== 'rogue' || u.lvl < 2 || !T.bonus || u.side === 'party' && !u.guest) return;
    var beside = foesBeside(B, u);
    if (beside.length && T.move >= 10) { T.bonus = 0; T.disengaged = true; B.card(['{y}' + Nm(B, u) + '{/} (Cunning Action) disengages.'], 160); yield 8; return; }
    if (!beside.length && !u.conds.hidden) { yield* B.hide(u); }
  });
  // ------------------------------------------------------------------ the paladin: Sacred Weapon for the AI's paladins
  TX.ACTIONS.push(function (B, u, fs) {
    if (u.cls !== 'paladin' || u.lvl < 3 || !feat(u, 'channel') || u.conds.sacred || !u.turn.action || u.turn.attacksLeft || (u.side === 'party' && !u.guest)) return null;
    if (!fs.some(function (t) { return G.dist(u, t) <= 30; }) || (B.fight && B.fight.roost)) return null;
    var sb = Math.max(1, D.mod(u.abil.cha));
    return { kind: 'feature', why: 'Sacred Weapon', score: (u.attacksBase || 1) * sb * 0.05 * 9 * 4 * 0.5, go: function* () { yield* B.exec(u, { do: 'sacred' }); } };
  });

  // ------------------------------------------------------------------ the bard: Bardic Inspiration (a bonus action: a die for an ally's roll),
  // Cutting Words (Lore 3: the reaction that takes a die off a foe's attack)
  function inspDie(u) { return u.lvl >= 15 ? 'd12' : u.lvl >= 10 ? 'd10' : u.lvl >= 5 ? 'd8' : 'd6'; }
  TX.AFTER.push(function* (B, u) {
    var T = u.turn;
    if (u.cls !== 'bard' || !T.bonus || !feat(u, 'inspiration') || u.lvl >= 3 && u.feats.inspiration <= 1) return; // (Lore: one kept for the Cutting Words)
    var t = TX.alliesOf(B, u).filter(function (w) { return w !== u && G.standing(w) && !w.conds.inspired && G.dist(u, w) <= 60; }).sort(function (a, b) { return TX.dpr(b) - TX.dpr(a); })[0];
    if (!t) return;
    T.bonus = 0; u.feats.inspiration--; t.conds.inspired = { die: inspDie(u), by: u.id };
    FX.sparkle(t, 'gold', 12); B.card(['{y}' + Nm(B, u) + '{/} inspires ' + t.name + ' {g}(a ' + inspDie(u) + ' for a roll that needs it){/}'], 200); yield 12;
  });
  // the die spent where it turns a miss into a hit or a failed save into a saved one (battle.js attack, rules.js save)
  F.inspire = function (u, need) {
    var c = u.conds.inspired; if (!c || need <= 0) return 0;
    var faces = +c.die.slice(1); if (need > faces) return 0;
    var r = D.d(faces); delete u.conds.inspired; return r;
  };
  // Cutting Words: a bard within 60 ft of the attacker, on the target's side, with a use and its reaction, and the blow within reach of the die
  F.cutting = function (B, att, tgt, over) {
    var bard = B.units.filter(function (w) { return w.cls === 'bard' && w.lvl >= 3 && w.subclass === 'College of Lore' && w.side === tgt.side && w.reaction > 0 && RU.canAct(w) && feat(w, 'inspiration') && G.dist(w, att) <= 60 && M.sees(B, w, att) && (w.side !== 'party' || w.guest); })[0];
    if (!bard) return 0;
    var faces = +inspDie(bard).slice(1); if (over >= faces) return 0;
    bard.reaction = 0; bard.feats.inspiration--;
    var r = D.d(faces);
    B.card(['{y}' + Nm(B, bard) + '{/}: CUTTING WORDS -- ' + r + ' off the roll'], 200);
    return r;
  };

  // ------------------------------------------------------------------ the cleric: Preserve Life (Life 2, Channel Divinity)
  TX.ACTIONS.push(function (B, u, fs, allies) {
    if (u.cls !== 'cleric' || u.lvl < 2 || u.subclass !== 'Life Domain' || !feat(u, 'channel') || !u.turn.action || u.turn.attacksLeft) return null;
    var low = allies.filter(function (w) { return !w.dead && G.dist(u, w) <= 30 && w.hp < w.maxhp / 2; });
    if (low.length < 2 && !low.some(function (w) { return w.hp <= 0; })) return null;
    var pool = 5 * u.lvl, sc = 0, left = pool;
    low.sort(function (a, b) { return a.hp - b.hp; }).forEach(function (w) { var g = Math.min(left, Math.floor(w.maxhp / 2) - Math.max(0, w.hp)); if (g > 0) { left -= g; sc += g * TX.healNeed(B, u, w) + (w.hp <= 0 ? TX.dpr(w) * 2 : 0); } });
    return { kind: 'feature', why: 'Preserve Life', score: sc, go: function* () {
      u.turn.action = 0; u.feats.channel--; var left2 = pool, got = [];
      low.forEach(function (w) { var g = Math.min(left2, Math.floor(w.maxhp / 2) - Math.max(0, w.hp)); if (g > 0) { left2 -= g; B.heal(w, g); got.push(w.name + ' +' + g); } });
      D.sfx('heal'); FX.ring(u, 'gold', 50);
      B.card(['{y}' + Nm(B, u) + '{/}: PRESERVE LIFE  {n}' + got.join(', ') + '{/}  {g}(Channel Divinity){/}'], 300); yield 24;
    } };
  });

  // Turn Undead (every cleric, 2; Channel Divinity): the dead within 30 ft that see or hear it save WIS or are turned -- they run from it
  // and do nothing else till hurt (a minute); Destroy Undead (5): a CR of 1/2 or less that fails is destroyed outright
  function crNum(cr) { return cr == null ? 99 : String(cr).indexOf('/') > 0 ? +cr.split('/')[0] / +cr.split('/')[1] : +cr; }
  TX.ACTIONS.push(function (B, u, fs) {
    if (u.cls !== 'cleric' || u.lvl < 2 || !feat(u, 'channel') || !u.turn.action || u.turn.attacksLeft) return null;
    var dead = fs.filter(function (w) { return w.type === 'undead' && G.dist(u, w) <= 30 && !w.conds.turned; });
    if (!dead.length) return null;
    var dc = u.spellDC, sc = dead.reduce(function (s, w) { return s + TX.pFail(w, 'wis', dc) * TX.dpr(w) * 3; }, 0);
    return { kind: 'feature', why: 'Turn Undead', score: sc, go: function* () {
      u.turn.action = 0; u.feats.channel--; D.sfx('buff'); FX.ring(u, 'gold', 60);
      var lines = ['{y}' + Nm(B, u) + '{/} presents the holy symbol: TURN UNDEAD  WIS DC ' + dc], gone = [];
      dead.forEach(function (w) {
        var sv = RU.save(w, 'wis', dc), destroy = !sv.ok && u.lvl >= 5 && crNum(w.cr) <= (u.lvl >= 17 ? 4 : u.lvl >= 14 ? 3 : u.lvl >= 11 ? 2 : u.lvl >= 8 ? 1 : 0.5);
        lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}stands{/}' : destroy ? '{y}DESTROYED{/}' : '{o}turned{/}'));
        if (destroy) gone.push(w); else if (!sv.ok) { w.conds.turned = { by: u.id }; w.conds.frightened = { by: u.id }; w.conds.feared = { by: u.id }; }
      });
      B.card(lines.slice(0, 8), 420); yield { fx: 1 };
      gone.forEach(function (w) { B.hurt(w, w.hp + (w.temp || 0), 'radiant'); });
      yield 24;
    } };
  });
  var onHurt0 = M.onHurt;
  M.onHurt = function (B, u, n, type) { if (onHurt0) onHurt0(B, u, n, type); if (u.conds.turned) { delete u.conds.turned; if (u.conds.feared && !u.conds.feared.dc) delete u.conds.feared; B.card(['{g}' + Nm(B, u) + ' is hurt out of its terror.{/}'], 200); } };

  // ------------------------------------------------------------------ the druid: Wild Shape (2; the Circle of the Land's: an action, a beast
  // of CR 1/4 with no flying or swimming till 4, 1/2 till 8) -- the wolf from the bestiary. Its HP is its own; at 0 the druid comes
  // back with the rest of the blow; no spells cast in it
  F.BEASTS = { 2: 'wolf', 4: 'wolf', 8: 'giantspider' };
  F.wildShape = function* (B, u) {
    var kind = u.lvl >= 8 ? F.BEASTS[8] : F.BEASTS[2], d = D.FOES[kind];
    if (!d) return;
    u.turn.action = 0; u.feats.wildShape--;
    var bite = d.attacks[Object.keys(d.attacks)[0]];
    u.beast = { kind: kind, hp: d.hp, maxhp: d.hp, keep: { weapon: u.weapon, alt: u.alt, baseAC: u.baseAC, speed: u.speed, sheet: u.sheet, abil: u.abil, attacks: u.attacks, attacksBase: u.attacksBase, packTactics: u.packTactics, known: u.known } };
    u.weapon = { name: bite.name, atk: bite.atk, dice: bite.dice, mod: bite.mod, type: bite.type, prone: bite.prone, magic: false };
    u.alt = null; u.baseAC = d.ac; u.speed = d.speed; u.sheet = d.sheet; u.abil = Object.assign({}, u.abil, { str: d.abil.str, dex: d.abil.dex, con: d.abil.con }); u.attacks = 1; u.attacksBase = 1; u.packTactics = !!d.packTactics; u.known = [];
    u.turn.move = Math.max(u.turn.move, d.speed - (u.keep0 || 0));
    FX.sparkle(u, 'moss', 24); D.sfx('buff');
    B.card(['{y}' + Nm(B, u) + '{/}: WILD SHAPE -- a ' + d.name.toLowerCase() + ' where the druid stood  {g}(' + d.hp + ' HP of its own){/}'], 300);
    yield 24;
  };
  F.unshape = function (B, u, over) {
    var k = u.beast.keep; delete u.beast;
    Object.keys(k).forEach(function (f) { u[f] = k[f]; });
    FX.sparkle(u, 'moss', 16);
    B.card(['{g}' + Nm(B, u) + ' is thrown back into their own shape.{/}'], 240);
    if (over > 0) B.hurt(u, over, 'bludgeoning');
  };
  TX.ACTIONS.push(function (B, u, fs) {
    if (u.cls !== 'druid' || u.lvl < 2 || u.beast || !feat(u, 'wildShape') || !u.turn.action) return null;
    var slots = (u.slots || []).reduce(function (a, n) { return a + n; }, 0);
    if (slots > 0 || !fs.length) return null; // (a caster first: the wolf when the day's spells are spent)
    return { kind: 'feature', why: 'Wild Shape', score: 6, go: function* () { yield* F.wildShape(B, u); } };
  });

  // ------------------------------------------------------------------ the sorcerer: Font of Magic (sorcery points into a slot, a bonus action),
  // Quickened Spell (3: two points, an action's spell as a bonus action)
  TX.FIRST.push(function* (B, u) {
    var T = u.turn;
    if (u.cls !== 'sorcerer' || u.lvl < 2 || !T.bonus) return;
    var slots = (u.slots || []).reduce(function (a, n) { return a + n; }, 0);
    // Quickened Spell: the best leveled action spell, now, as the bonus action (then only a cantrip with the action)
    if (u.lvl >= 3 && (u.feats.sorcery || 0) >= 2 && slots > 0) {
      T.quicken = true;
      var plans = TX.spellPlansFor(B, u).filter(function (p) { return !p.bonus && p.level > 0; }).sort(function (a, b) { return b.score - a.score; });
      if (plans[0] && plans[0].score > 12) { u.feats.sorcery -= 2; B.card(['{y}' + Nm(B, u) + '{/}: QUICKENED SPELL {g}(2 sorcery points, ' + u.feats.sorcery + ' left){/}'], 200); yield* plans[0].go(); T.quicken = false; return; }
      T.quicken = false;
    }
    // Font of Magic: out of slots, points into one (2 for a 1st, 3 for a 2nd, 5 for a 3rd)
    if (!slots && (u.feats.sorcery || 0) >= 2) {
      var cost = { 1: 2, 2: 3, 3: 5 }, top = 0;
      [3, 2, 1].forEach(function (L) { if (!top && L <= Math.ceil(u.lvl / 2) && u.feats.sorcery >= cost[L]) top = L; });
      if (!top) return;
      u.feats.sorcery -= cost[top]; T.bonus = 0; u.slots[top - 1] = (u.slots[top - 1] || 0) + 1;
      B.card(['{y}' + Nm(B, u) + '{/}: FONT OF MAGIC -- a level-' + top + ' slot out of ' + cost[top] + ' sorcery points {g}(' + u.feats.sorcery + ' left){/}'], 200); yield 12;
    }
  });

  // ------------------------------------------------------------------ the warlock: Dark One's Blessing (the Fiend, 1): a foe it drops gives it
  // CHA + its level in temporary HP (battle.js hurt, M.onKill)
  M.onKill = function (B, killer, u) {
    if (!killer || killer.subclass !== 'The Fiend' || !G.hostile(killer, u) || killer.hp <= 0) return;
    var n = Math.max(1, D.mod(killer.abil.cha) + killer.lvl);
    killer.temp = Math.max(killer.temp || 0, n); FX.sparkle(killer, 'fire', 14);
    B.card(['{r}' + Nm(B, killer) + '{/} drinks it in: {c}' + n + ' temporary HP{/} {g}(Dark One\'s Blessing){/}'], 240);
  };
})();
