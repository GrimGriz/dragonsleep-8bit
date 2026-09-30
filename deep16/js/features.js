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
  function foesBeside(B, u) { return B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && G.dist(u, w) <= G.reachOf(u); }); }
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
  // (the rage begun: the AI's first thing, the player's RAGE -- F.commands below)
  F.rage = function (B, u) {
    u.turn.bonus = 0; u.feats.rage--;
    u.conds.raging = { dmg: u.lvl >= 16 ? 4 : u.lvl >= 9 ? 3 : 2, till: { who: u.id, at: 'start', n: 10 }, endText: '{who}\'s rage burns out.' };
    if (u.subclass === 'Path of the Berserker') u.conds.frenzy = true;
    D.sfx('crit'); FX.ring(u, 'red', 34);
    B.card(['{r}' + Nm(B, u) + ' RAGES!{/}  {g}(+' + u.conds.raging.dmg + ' damage, blades and blows halved' + (u.conds.frenzy ? ', and the frenzy: a swing for the bonus action' : '') + '){/}'], 300);
  };
  TX.FIRST.unshift(function* (B, u) {
    if (u.cls !== 'barbarian' || u.conds.raging || !feat(u, 'rage') || !u.turn.bonus || u.conds.incapacitated) return;
    var fs = TX.foesOf(B, u);
    if (!fs.some(function (t) { return G.dist(u, t) <= u.turn.move + G.reachOf(u) + (u.turn.action ? 0 : 0); })) return;
    F.rage(B, u);
    yield 20;
  });
  // Reckless Attack (2): the first swing of the turn decides -- advantage on its STR swings, and at it, till its next turn
  F.reckless = function (u) { return u.cls === 'barbarian' && u.lvl >= 2 && u.hp > u.maxhp * 0.35; };
  // Feral Instinct (7; 09-28h, the levels to nine): advantage on initiative (js/classes.js u.initAdv, battle.js run), and caught
  // unaware he acts all the same on his first turn if he rages before anything else (a use of Rage and the bonus action; not if he
  // is incapacitated, or already raging with nothing to pay). ai.js turn and battle.js heroTurn ask; true: he acts
  F.feral = function* (B, u) {
    if (u.cls !== 'barbarian' || u.lvl < 7 || !u.turn) return false;
    var s = u.conds.surprised; delete u.conds.surprised; var can = RU.canAct(u); u.conds.surprised = s; // (able, but for the surprise)
    if (!can) return false;
    if (!u.conds.raging) {
      if (!feat(u, 'rage') || !u.turn.bonus) return false;
      u.turn.bonus = 0; u.feats.rage--;
      u.conds.raging = { dmg: u.lvl >= 16 ? 4 : u.lvl >= 9 ? 3 : 2, till: { who: u.id, at: 'start', n: 10 }, endText: '{who}\'s rage burns out.' };
      if (u.subclass === 'Path of the Berserker') u.conds.frenzy = true;
      D.sfx('crit'); FX.ring(u, 'red', 34);
    }
    B.card(['{r}' + Nm(B, u) + ': FERAL INSTINCT -- caught unaware, he rages and comes on all the same!{/}  {g}(+' + u.conds.raging.dmg + ' damage, blades and blows halved){/}'], 300);
    yield 20;
    return true;
  };
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
    return { kind: 'feature', why: 'Turn Undead', score: sc, go: function* () { yield* F.turnUndead(B, u, dead); } };
  });
  // (the dead within 30 ft that are not turned already: the AI's plan and the player's TURN UNDEAD)
  F.undeadNear = function (B, u) { return hostileNear(B, u, 30).filter(function (w) { return w.type === 'undead' && !w.conds.turned; }); };
  F.turnUndead = function* (B, u, dead) {
    var dc = u.spellDC;
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
  };
  var onHurt0 = M.onHurt;
  M.onHurt = function (B, u, n, type) { if (onHurt0) onHurt0(B, u, n, type); if (u.conds.turned) { delete u.conds.turned; if (u.conds.feared && !u.conds.feared.dc) delete u.conds.feared; B.card(['{g}' + Nm(B, u) + ' is hurt out of its terror.{/}'], 200); } };

  // ------------------------------------------------------------------ the druid: Wild Shape (2; the Circle of the Land's: an action, a beast
  // of CR 1/4 with no flying or swimming till 4, 1/2 till 8) -- the wolf from the bestiary. Its HP is its own; at 0 the druid comes
  // back with the rest of the blow; no spells cast in it
  F.BEASTS = { 2: 'wolf', 4: 'wolf', 8: 'giantspider' };
  // the shapes on offer (the Circle of the Land: CR 1/4 with no flying or swimming from 2, swimming from 4, CR 1 from 8), of the beasts
  // the bestiary has; the player picks (F.commands WILD SHAPE, 09-29), the AI takes F.BEASTS' by level
  // (8: flying allowed -- the giant bat, CR 1/4, flies 60 with blindsight: the druid to twelve, 09-30; the bestiary's own giant bats still go round)
  F.SHAPES = [{ kind: 'wolf', lvl: 2 }, { kind: 'wolfspider', lvl: 2 }, { kind: 'axebeak', lvl: 2 }, { kind: 'giantfrog', lvl: 4 }, { kind: 'giantspider', lvl: 8 }, { kind: 'giantbat', lvl: 8, flies: true }];
  F.beastsFor = function (u) { return F.SHAPES.filter(function (s) { return u.lvl >= s.lvl && D.FOES[s.kind]; }).map(function (s) { return s.kind; }); };
  F.wildShape = function* (B, u, kind) {
    kind = kind || (u.lvl >= 8 ? F.BEASTS[8] : F.BEASTS[2]);
    var d = D.FOES[kind];
    if (!d) return;
    u.turn.action = 0; u.feats.wildShape--;
    var bite = d.attacks[Object.keys(d.attacks)[0]];
    var shp = F.SHAPES.filter(function (s) { return s.kind === kind; })[0];
    u.beast = { kind: kind, hp: d.hp, maxhp: d.hp, keep: { weapon: u.weapon, alt: u.alt, baseAC: u.baseAC, speed: u.speed, sheet: u.sheet, abil: u.abil, saves: u.saves, attacks: u.attacks, attacksBase: u.attacksBase, packTactics: u.packTactics, known: u.known, flies: u.flies, blindsight: u.blindsight } };
    // (the whole attack, so the spider's poison and the frog's grip ride with the bite; the figure keeps its own square -- a Large shape stands in one)
    u.weapon = Object.assign({}, bite, { magic: false });
    u.alt = null; u.baseAC = d.ac; u.speed = d.speed; u.sheet = d.sheet; u.abil = Object.assign({}, u.abil, { str: d.abil.str, dex: d.abil.dex, con: d.abil.con }); u.attacks = 1; u.attacksBase = 1; u.packTactics = !!d.packTactics; u.known = [];
    // (the beast's STR, DEX and CON saves -- the druid is proficient in none of the three: SRD 5.1 Wild Shape; its senses; a flier flies)
    var sv0 = u.saves || {}; ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function (k) { if (sv0[k] == null) sv0[k] = D.mod(u.beast.keep.abil[k]); });
    u.saves = Object.assign({}, sv0, { str: d.saves ? d.saves.str : D.mod(d.abil.str), dex: d.saves ? d.saves.dex : D.mod(d.abil.dex), con: d.saves ? d.saves.con : D.mod(d.abil.con) });
    if (d.blindsight) u.blindsight = Math.max(u.blindsight || 0, d.blindsight);
    u.flies = !!(shp && shp.flies);
    u.turn.move = Math.max(u.turn.move, d.speed - (u.keep0 || 0));
    FX.sparkle(u, 'moss', 24); D.sfx('buff');
    B.card(['{y}' + Nm(B, u) + '{/}: WILD SHAPE -- a ' + d.name.toLowerCase() + ' where the druid stood  {g}(' + d.hp + ' HP of its own){/}'], 300);
    yield 24;
  };
  F.unshape = function (B, u, over, willing) {
    var k = u.beast.keep; delete u.beast;
    Object.keys(k).forEach(function (f) { u[f] = k[f]; });
    FX.sparkle(u, 'moss', 16);
    B.card(['{g}' + Nm(B, u) + (willing ? ' takes their own shape again.' : ' is thrown back into their own shape.') + '{/}'], 240);
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

  // ================================================================== our own subclasses (RULED 09-28g, Griz, on the four past the SRD: "Sufficiently
  // distinct -- Kat supposed to be Cleric of trickster deity trapped in mirror"; the past-the-SRD principle, invented.json #past-the-srd:
  // our name, our words, a function of our own). Drafted by the seat, standing as approved (the game's law, 09-24); their lists are
  // js/classes.js NPC.SUBS, the words invented.json #path-of-the-sand #the-rimeglass #the-window #the-vigil
  function sub(u, name, lvl) { return u.subclass === name && u.lvl >= (lvl || 1); }
  function hostileNear(B, u, ft) { return B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && G.dist(u, w) <= ft; }); }

  // ------------------------------------------------------------------ the Path of the Sand (Talmok's; the barbarian, 3): the pit's own
  // FIRST BLOOD (3): stung, he rages -- when he takes damage and isn't raging, the reaction and a use of Rage start it
  var onHurt1 = M.onHurt;
  M.onHurt = function (B, u, n, type) {
    if (onHurt1) onHurt1(B, u, n, type);
    if (!sub(u, 'Path of the Sand', 3) || u.conds.raging || !feat(u, 'rage') || u.reaction <= 0 || u.hp <= 0 || u.dead || !RU.canAct(u)) return;
    u.reaction = 0; u.feats.rage--;
    u.conds.raging = { dmg: u.lvl >= 16 ? 4 : u.lvl >= 9 ? 3 : 2, till: { who: u.id, at: 'start', n: 10 }, endText: '{who}\'s rage burns out.' };
    D.sfx('crit'); FX.ring(u, 'red', 34);
    B.card(['{r}' + Nm(B, u) + ': FIRST BLOOD -- he rages!{/}  {g}(the reaction: +' + u.conds.raging.dmg + ' damage, blades and blows halved){/}'], 300);
  };
  // DOWN IN THE SAND (3): raging, once a turn, a melee hit on one no bigger than Large -- STR save or down on the sand
  var onWeaponHit1 = M.onWeaponHit;
  M.onWeaponHit = function* (B, att, tgt, atk, crit) {
    if (onWeaponHit1) yield* onWeaponHit1(B, att, tgt, atk, crit);
    if (!sub(att, 'Path of the Sand', 3) || !att.conds.raging || atk.ranged || !att.turn || att.turn.sanded || tgt.dead || tgt.hp <= 0 || tgt.conds.prone || tgt.noProne || RU.immuneTo(tgt, 'prone') || (tgt.size || 1) > 2) return;
    att.turn.sanded = true;
    var dc = 8 + att.prof + D.mod(att.abil.str), sv = RU.save(tgt, 'str', dc);
    B.card(['  {o}down in the sand{/}: ' + Nm(B, tgt) + ' STR ' + RU.saveText(sv) + ' vs DC ' + dc + '  ' + (sv.ok ? '{n}keeps its feet{/}' : '{o}PRONE{/}')], 240);
    if (!sv.ok) tgt.conds.prone = true;
    yield 10;
  };
  // ANSWER BACK (6): raging, one who misses him in melee gets one blow back (the reaction) -- battle.js attack calls it on a miss
  F.answerBack = function* (B, att, tgt, atk, melee) {
    if (!melee || atk.spell || !sub(tgt, 'Path of the Sand', 6) || !tgt.conds.raging || tgt.reaction <= 0 || !RU.canAct(tgt) || att.dead || att.hp <= 0 || G.dist(tgt, att) > G.reachOf(tgt) || !tgt.weapon) return;
    tgt.reaction = 0;
    B.card(['{r}' + Nm(B, tgt) + ' answers back!{/}  {g}(the reaction){/}'], 200);
    yield* B.attack(tgt, att, tgt.weapon, { oa: true });
  };

  // ------------------------------------------------------------------ the Rimeglass (Willem's; the wizard's tradition, 2): illusion with the
  // cold in it. RIME DOUBLES (2): a blow that breaks one of his false images (Mirror Image) breaks rime over the one who struck -- its
  // speed 10 ft less till its next turn is over (battle.js attack calls it)
  F.rimeDouble = function (B, att, tgt) {
    if (!sub(tgt, 'the Rimeglass', 2) || att.dead || att.hp <= 0) return;
    att.conds.frosted = { by: tgt.id, till: { who: att.id, at: 'end', n: 1 } };
    FX.sparkle(att, 'silver', 12);
    B.card(['  {c}the double breaks to rime{/} over ' + nm(B, att) + ': {g}-10 ft till its turn is over{/}'], 200);
  };
  // RIME STEP (6): his illusion of the 1st level or more, cast, and he is ten feet off -- to the square farthest from the foes
  var ILLUSION = ['silentimage', 'majorimage', 'mirrorimage', 'blur', 'invisibility', 'greaterinvisibility', 'hypnoticpattern', 'phantasmalkiller', 'mislead', 'disguiseself', 'colorspray'];
  var cast1 = M.cast;
  M.cast = function (B, u, id) {
    var g = cast1.apply(this, arguments);
    if (!sub(u, 'the Rimeglass', 6) || ILLUSION.indexOf(id) < 0) return g;
    return (function* () {
      var r = yield* g;
      if (u.dead || u.hp <= 0 || !hostileNear(B, u, 30).length) return r;
      var best = null, bs = -1;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
        var x = u.x + dx, y = u.y + dy; if ((!dx && !dy) || !G.canStand(u, x, y)) continue;
        var near = Math.min.apply(null, hostileNear(B, u, 200).map(function (w) { return Math.max(Math.abs(w.x - x), Math.abs(w.y - y)); }).concat([99]));
        if (near > bs) { bs = near; best = [x, y]; }
      }
      if (best && bs > Math.min.apply(null, hostileNear(B, u, 200).map(function (w) { return Math.max(Math.abs(w.x - u.x), Math.abs(w.y - u.y)); }).concat([99]))) {
        var x0 = u.x, y0 = u.y; u.x = best[0]; u.y = best[1]; u.tween = { fx: x0, fy: y0, fz: G.gzAt(u, x0, y0), t: 0, dur: 8 };
        FX.sparkle(u, 'silver', 14); B.card(['{c}' + Nm(B, u) + ' steps through the rime{/} {g}(Rime Step: 10 ft){/}'], 200); yield 10;
      }
      return r;
    })();
  };

  // ------------------------------------------------------------------ the Window (Kat's; the cleric's domain, 1): the menders of Tronupholen,
  // the Fey in the Mirror, who pray at their own reflections. THE HAND ON THE NECK (1; WIS a long rest): a bonus action, a touch --
  // the first blow that would land on the touched before the mender's next turn is rolled again, and the second roll stands (battle.js
  // attack reads conds.glassHand)
  // the AI weighs a bonus-action feature against the best bonus-action spell it has (tactics.js casts those first): the blow it
  // likely keeps off the one it guards, against the spell's own score
  function bestBonusSpell(B, u) { var p = TX.spellPlansFor(B, u).filter(function (x) { return x.bonus; }).sort(function (a, b) { return b.score - a.score; })[0]; return p ? p.score : 0; }
  function threatOn(B, w) { return hostileNear(B, w, 5).reduce(function (s, f) { return s + TX.dpr(f); }, 0) + hostileNear(B, w, 60).filter(function (f) { return G.dist(f, w) > 5; }).reduce(function (s, f) { return s + TX.dpr(f) * 0.4; }, 0); }
  TX.FIRST.unshift(function* (B, u) {
    var T = u.turn;
    if (!sub(u, 'the Window', 1) || !T.bonus || !feat(u, 'handOnNeck') || (u.side === 'party' && !u.guest)) return;
    var best = null;
    TX.alliesOf(B, u).forEach(function (w) {
      if (!G.standing(w) || w.conds.glassHand || G.dist(u, w) > 5) return; // (a touch: one beside her)
      var top = hostileNear(B, w, 10).reduce(function (m, f) { return Math.max(m, TX.dpr(f)); }, 0), sc = top * 0.45 * 1.2 * (w.hp < w.maxhp / 2 ? 1.5 : 1);
      if (!best || sc > best.sc) best = { t: w, sc: sc };
    });
    if (!best || best.sc < 2 || best.sc <= bestBonusSpell(B, u)) return;
    F.handOnNeck(B, u, best.t); yield 10;
  });
  F.handOnNeck = function (B, u, t) {
    u.turn.bonus = 0; u.feats.handOnNeck--; t.conds.glassHand = { by: u.id, till: { who: u.id, at: 'start', n: 1 } };
    FX.sparkle(t, 'violet', 12);
    B.card(['{y}' + Nm(B, u) + '{/}: THE HAND ON THE NECK on ' + (t === u ? 'herself' : t.name) + ' {g}(the glass takes the first blow that would land){/}'], 220);
  };
  // THE DOUBLING (2; Channel Divinity): two glass doubles step out of her mirror -- a blow at her may strike one instead (Mirror Image's)
  TX.ACTIONS.push(function (B, u, fs) {
    if (!sub(u, 'the Window', 2) || !feat(u, 'channel') || !u.turn.action || u.turn.attacksLeft || (u.images || 0) > 0 || (u.side === 'party' && !u.guest)) return null;
    var th = fs.filter(function (w) { return G.dist(u, w) <= 60; }).reduce(function (s, w) { return s + TX.dpr(w); }, 0);
    if (!th) return null;
    return { kind: 'feature', why: 'the Doubling', score: th * 0.3 * 2 + (u.hp < u.maxhp / 2 ? 3 : 0), go: function* () { yield* F.doubling(B, u); } };
  });
  F.doubling = function* (B, u) {
    u.turn.action = 0; u.feats.channel--; u.images = 2; D.sfx('magic'); FX.sparkle(u, 'violet', 24);
    B.card(['{y}' + Nm(B, u) + '{/} lifts her mirror: THE DOUBLING -- three of her, and which is which?  {g}(Channel Divinity){/}'], 300); yield 20;
  };
  // THE SHOWING (6; Channel Divinity): one within 30 ft that can see her mirror, WIS -- Tronupholen shows it something in the glass
  // (he shows, never speaks), and it can do nothing till its next turn is over
  TX.ACTIONS.push(function (B, u, fs) {
    if (!sub(u, 'the Window', 6) || !feat(u, 'channel') || !u.turn.action || u.turn.attacksLeft || (u.side === 'party' && !u.guest)) return null;
    var best = null;
    fs.forEach(function (w) { if (G.dist(u, w) > 30 || w.conds.incapacitated || RU.immuneTo(w, 'incapacitated') || !M.sees(B, w, u)) return; var sc = TX.pFail(w, 'wis', u.spellDC) * (TX.dpr(w) * 1.6 + 2); if (!best || sc > best.score) best = { t: w, score: sc }; });
    if (!best) return null;
    var t = best.t;
    return { kind: 'feature', why: 'the Showing at ' + t.name, score: best.score, go: function* () { yield* F.showing(B, u, t); } };
  });
  // (who the Showing may go to: within 30 ft, seeing her mirror, able to be held)
  F.showable = function (B, u) { return hostileNear(B, u, 30).filter(function (w) { return !w.conds.incapacitated && !RU.immuneTo(w, 'incapacitated') && M.sees(B, w, u); }); };
  F.showing = function* (B, u, t) {
    u.turn.action = 0; u.feats.channel--; D.sfx('magic'); FX.ring(u, 'violet', 40);
    var sv = RU.save(t, 'wis', u.spellDC);
    B.card(['{y}' + Nm(B, u) + '{/} turns her mirror on ' + nm(B, t) + ': THE SHOWING  WIS ' + RU.saveText(sv) + ' vs DC ' + u.spellDC + '  ' + (sv.ok ? '{n}it looks away{/}' : '{p}it is shown something, and can do nothing{/}')], 320);
    if (!sv.ok) t.conds.incapacitated = { by: u.id, till: { who: t.id, at: 'end', n: 1 }, endText: '{who} comes back from the glass.' };
    yield 20;
  };

  // ------------------------------------------------------------------ the Vigil (Torvald's; the cleric's domain, 1): Dvalgarda's, the Ward of
  // the Dormant, whose sect keeps the vigil over the sleeping Silver and the egg. KEEPER'S WARD (1; WIS a long rest): a bonus action,
  // one he can see within 30 ft (or himself) -- the next damage it takes before his next turn is cut by 1d8 + his level
  TX.FIRST.unshift(function* (B, u) {
    var T = u.turn;
    if (!sub(u, 'the Vigil', 1) || !T.bonus || !feat(u, 'keepersWard') || (u.side === 'party' && !u.guest)) return;
    var best = null, cut = 4.5 + u.lvl;
    TX.alliesOf(B, u).forEach(function (w) {
      if (!G.standing(w) || w.conds.keeperWard || G.dist(u, w) > 30) return;
      var sc = Math.min(threatOn(B, w), cut) * 0.9 * 1.2 * (w.hp < w.maxhp / 2 ? 1.5 : 1);
      if (!best || sc > best.sc) best = { t: w, sc: sc };
    });
    if (!best || best.sc < 2 || best.sc <= bestBonusSpell(B, u)) return;
    F.keepersWard(B, u, best.t); yield 10;
  });
  F.keepersWard = function (B, u, t) {
    u.turn.bonus = 0; u.feats.keepersWard--; t.conds.keeperWard = { by: u.id, n: u.lvl, till: { who: u.id, at: 'start', n: 1 } };
    FX.ring(t, 'silver', 26);
    B.card(['{y}' + Nm(B, u) + '{/}: KEEPER\'S WARD on ' + (t === u ? 'himself' : t.name) + ' {g}(the next blow cut by 1d8 + ' + u.lvl + '){/}'], 220);
  };
  // (battle.js hurt asks before the damage lands: what is left of it)
  M.preHurt = function (B, u, n) {
    var kw = u && u.conds && u.conds.keeperWard;
    if (!kw || n <= 0 || u.hp <= 0) return n;
    delete u.conds.keeperWard;
    var r = D.roll('1d8'), cut = Math.min(n, r.total + kw.n);
    FX.sparkle(u, 'silver', 12);
    B.card(['  {c}the keeper\'s ward{/} takes ' + cut + ' of it {g}(1d8 [' + r.rolls.join(',') + '] + ' + kw.n + '){/}'], 200);
    return n - cut;
  };
  // HOLD THE DOOR (2; Channel Divinity): the ones who would hem him in -- each foe within 10 ft, STR save or shoved 10 ft away from him
  TX.ACTIONS.push(function (B, u, fs) {
    if (!sub(u, 'the Vigil', 2) || !feat(u, 'channel') || !u.turn.action || u.turn.attacksLeft || (u.side === 'party' && !u.guest)) return null;
    var close = F.doorFoes(B, u);
    if (close.length < 2) return null;
    return { kind: 'feature', why: 'Hold the Door', score: close.reduce(function (s, w) { return s + TX.pFail(w, 'str', u.spellDC) * (TX.dpr(w) * 0.9 + 2); }, 0), go: function* () { yield* F.holdDoor(B, u, close); } };
  });
  // (the ones Hold the Door can shove: within 10 ft, not bound to their ground, Large or smaller)
  F.doorFoes = function (B, u) { return hostileNear(B, u, 10).filter(function (w) { return !w.bound && (w.size || 1) <= 2; }); };
  F.holdDoor = function* (B, u, close) {
    u.turn.action = 0; u.feats.channel--; D.sfx('crit'); FX.ring(u, 'silver', 50);
    var lines = ['{y}' + Nm(B, u) + '{/} plants his feet: HOLD THE DOOR  STR DC ' + u.spellDC + '  {g}(Channel Divinity){/}'];
    close.forEach(function (w) { var sv = RU.save(w, 'str', u.spellDC); lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}holds its ground{/}' : '{o}shoved back{/}')); if (!sv.ok) M.push(B, u, w, 2); });
    B.card(lines.slice(0, 8), 360); yield 24;
  };
  // WAKEFUL (6): magic cannot put him, or one of his within 10 ft, to sleep (magic.js Sleep asks)
  M.wakeful = function (B, w) { return B.units.some(function (k) { return sub(k, 'the Vigil', 6) && k.side === w.side && G.standing(k) && G.dist(k, w) <= 10; }); };

  // ------------------------------------------------------------------ DIVINE STRIKE (8; 09-28h, Griz: "can we do the levels for the original
  // classes up to nine" -- the seat's drafts for our two domains, standing as approved): the SRD Life Domain's feature, in each domain's
  // own kind. Once on each of the cleric's turns, a creature it hits with a weapon attack takes 1d8 more (2d8 at 14): the Window's
  // psychic ("the glass shows it a crack"), the Vigil's radiant (the Dormant's cold light); and the SRD's own Life Domain's radiant,
  // since the class NPC's cleric carries it. Dealt as its own blow so the card shows it (Colossus Slayer's way)
  var STRIKE = { 'the Window': 'psychic', 'the Vigil': 'radiant', 'Life Domain': 'radiant' };
  F.strikeType = function (u) { return u && u.cls === 'cleric' && u.lvl >= 8 && STRIKE[u.subclass] || null; };
  // (the class AI's weighing, tactics.js swing: what the strike adds to this turn's first blow)
  F.strikeBonus = function (u, wp) { return F.strikeType(u) && !(wp && wp.spell) && !(u.turn && u.turn.divineStrike) ? (u.lvl >= 14 ? 9 : 4.5) : 0; };
  var onWeaponHit2 = M.onWeaponHit;
  M.onWeaponHit = function* (B, att, tgt, atk, crit) {
    if (onWeaponHit2) yield* onWeaponHit2(B, att, tgt, atk, crit);
    var ty = F.strikeType(att);
    if (!ty || atk.spell || !att.turn || att.turn.divineStrike || B.active !== att || tgt.dead || tgt.hp <= 0) return;
    att.turn.divineStrike = true;
    var dd = (att.lvl >= 14 ? 2 : 1) + 'd8', r = D.roll(dd, { crit: crit });
    FX.sparkle(tgt, ty === 'psychic' ? 'violet' : 'gold', 12);
    B.card(['  ' + (ty === 'psychic' ? '{p}divine strike{/}: the glass shows ' + nm(B, tgt) + ' a crack' : '{y}divine strike{/}') + '  ' + dd + ' [' + r.rolls.join(',') + '] = {r}' + r.total + '{/} ' + ty], 200);
    B.hurt(tgt, r.total, ty);
    yield 8;
  };

  // ------------------------------------------------------------------ the player's buttons (09-29, Griz running our four on the tester
  // ladder, ?ladder&party=ours&play: "AI now, buttons later" -- now). What the AI above does for itself, on the ring's SKILLS for one the
  // player runs: battle.js commands() lists F.commands, battle.js exec hands their ids to F.exec. One that goes to a single creature asks
  // which by a prompt of those it may go to (the play record keeps the answer: js/record.js)
  function mine(u) { return u.side === 'party' && !u.guest; }
  function chan(u) { return feat(u, 'channel'); }
  var CHAN_WHY = 'Channel Divinity is spent (a short rest brings it back)';
  F.commands = function (B, u) {
    if (!mine(u)) return [];
    var T = u.turn, out = [], act = T.action > 0 && !T.attacksLeft;
    if (u.cls === 'barbarian') {
      out.push({ id: 'rage', label: 'RAGE', cost: 'B', icon: 'surge', skill: true, ok: T.bonus > 0 && feat(u, 'rage') && !u.conds.raging && !u.conds.incapacitated,
        why: u.conds.raging ? 'raging already' : !feat(u, 'rage') ? 'no rage left (a long rest)' : 'the bonus action is spent',
        note: '+' + (u.lvl >= 16 ? 4 : u.lvl >= 9 ? 3 : 2) + ' STR damage, blades and blows halved, a minute; ' + ((u.feats && u.feats.rage) || 0) + ' left' });
      if (u.lvl >= 2) out.push({ id: 'reckless', label: 'RECKLESS', cost: 'F', icon: 'attack', skill: true, ok: !u.conds.reckless && !T.attackAction && (T.action > 0 || T.attacksLeft > 0),
        why: u.conds.reckless ? 'reckless already, till your next turn' : 'it is decided on the turn\'s first swing', note: 'advantage on STR swings this turn; swings at you have it too till your next' });
    }
    // the druid (09-29, Higertha to nine): Wild Shape, and the way back
    if (u.cls === 'druid' && u.lvl >= 2 && !u.beast) out.push({ id: 'wildshape', label: 'WILD SHAPE', cost: 'A', icon: 'skills', skill: true, ok: act && feat(u, 'wildShape'),
      why: !feat(u, 'wildShape') ? 'no shape left (a short rest brings two back)' : 'the action is spent', note: 'a beast\'s shape (' + F.beastsFor(u).map(function (k) { return D.FOES[k].name.toLowerCase(); }).join(', ') + '): its hit points take the blows first, no spells; ' + ((u.feats && u.feats.wildShape) || 0) + ' left (short rest)' });
    if (u.cls === 'druid' && u.beast) out.push({ id: 'unshape', label: 'OWN SHAPE', cost: 'B', icon: 'skills', skill: true, ok: T.bonus > 0, why: 'the bonus action is spent', note: 'back to the druid (the beast\'s hit points left behind)' });
    if (u.cls === 'cleric' && u.lvl >= 2) out.push({ id: 'turnundead', label: 'TURN UNDEAD', cost: 'A', icon: 'sacred', skill: true, ok: act && chan(u) && F.undeadNear(B, u).length > 0,
      why: !chan(u) ? CHAN_WHY : !act ? 'the action is spent' : 'no undead within 30 ft', note: 'the dead within 30 ft: WIS DC ' + u.spellDC + ' or turned' + (u.lvl >= 5 ? ' (the weakest destroyed)' : '') });
    if (sub(u, 'the Window', 1)) out.push({ id: 'handonneck', label: 'HAND ON THE NECK', cost: 'B', icon: 'lay', skill: true, ok: T.bonus > 0 && feat(u, 'handOnNeck'),
      why: !feat(u, 'handOnNeck') ? 'spent (a long rest brings it back)' : 'the bonus action is spent', note: 'touch: the first blow to land on them is rolled again' });
    if (sub(u, 'the Window', 2)) out.push({ id: 'doubling', label: 'THE DOUBLING', cost: 'A', icon: 'sacred', skill: true, ok: act && chan(u) && !(u.images > 0),
      why: !chan(u) ? CHAN_WHY : u.images > 0 ? 'the doubles stand already' : 'the action is spent', note: 'two glass doubles: a blow at her may strike one' });
    if (sub(u, 'the Window', 6)) out.push({ id: 'showing', label: 'THE SHOWING', cost: 'A', icon: 'sacred', skill: true, ok: act && chan(u) && F.showable(B, u).length > 0,
      why: !chan(u) ? CHAN_WHY : !act ? 'the action is spent' : 'no one within 30 ft sees her mirror', note: 'one within 30 ft: WIS DC ' + u.spellDC + ' or it can do nothing' });
    if (sub(u, 'the Vigil', 1)) out.push({ id: 'keepersward', label: 'KEEPER\'S WARD', cost: 'B', icon: 'lay', skill: true, ok: T.bonus > 0 && feat(u, 'keepersWard'),
      why: !feat(u, 'keepersWard') ? 'spent (a long rest brings it back)' : 'the bonus action is spent', note: 'one within 30 ft: the next blow cut by 1d8 + ' + u.lvl });
    if (sub(u, 'the Vigil', 2)) out.push({ id: 'holddoor', label: 'HOLD THE DOOR', cost: 'A', icon: 'sacred', skill: true, ok: act && chan(u) && F.doorFoes(B, u).length > 0,
      why: !chan(u) ? CHAN_WHY : !act ? 'the action is spent' : 'no foe within 10 ft to shove', note: 'each foe within 10 ft: STR DC ' + u.spellDC + ' or shoved 10 ft' });
    return out;
  };
  // one of those it may go to, asked (0: not now)
  function* pickOne(B, u, title, list, line) {
    if (!list.length) return null;
    var opts = list.slice(0, 6).map(function (w, i) { return { label: (w === u ? 'YOURSELF' : Nm(B, w).toUpperCase() + ' (' + G.dist(u, w) + ' FT)'), value: i + 1 }; });
    opts.push({ label: 'NOT NOW', value: 0 });
    var v = yield { prompt: { who: u, title: u.name + ': ' + title, lines: [line], opts: opts } };
    return v ? list[v - 1] : null;
  }
  function alliesWithin(B, u, ft) { return B.units.filter(function (w) { return w.side === u.side && G.standing(w) && (w === u || G.dist(u, w) <= ft); }); }
  F.exec = function* (B, u, c) {
    var t;
    switch (c.do) {
      case 'rage': F.rage(B, u); yield 20; return;
      case 'reckless':
        u.conds.reckless = { till: { who: u.id, at: 'start', n: 1 } }; D.sfx('crit');
        B.card(['{r}' + u.name + ' swings recklessly.{/}  {g}(advantage on STR swings this turn; at him too till his next){/}'], 200); return;
      case 'wildshape': {
        var ks = F.beastsFor(u);
        var pick = yield { prompt: { who: u, title: u.name + ': WILD SHAPE', lines: ['Which beast? Its hit points take the blows first; no spells while in it; a bonus action ends it.'], opts: ks.map(function (k, i) { var d = D.FOES[k]; return { label: d.name.toUpperCase() + ' (' + d.hp + ' HP, AC ' + d.ac + ', ' + d.speed + ' FT)', value: i + 1 }; }).concat([{ label: 'NOT NOW', value: 0 }]) } };
        if (pick) yield* F.wildShape(B, u, ks[pick - 1]);
        return;
      }
      case 'unshape': u.turn.bonus = 0; F.unshape(B, u, 0, true); yield 12; return;
      case 'turnundead': yield* F.turnUndead(B, u, F.undeadNear(B, u)); return;
      case 'doubling': yield* F.doubling(B, u); return;
      case 'holddoor': yield* F.holdDoor(B, u, F.doorFoes(B, u)); return;
      case 'showing':
        t = yield* pickOne(B, u, 'THE SHOWING', F.showable(B, u), 'Which of them is shown the glass? (WIS DC ' + u.spellDC + ')');
        if (t) yield* F.showing(B, u, t);
        return;
      case 'handonneck':
        t = yield* pickOne(B, u, 'THE HAND ON THE NECK', alliesWithin(B, u, 5).filter(function (w) { return !w.conds.glassHand; }), 'A touch: yourself, or one beside you.');
        if (t) { F.handOnNeck(B, u, t); yield 10; }
        return;
      case 'keepersward':
        t = yield* pickOne(B, u, 'KEEPER\'S WARD', alliesWithin(B, u, 30).filter(function (w) { return !w.conds.keeperWard; }), 'Yourself, or one within 30 ft.');
        if (t) { F.keepersWard(B, u, t); yield 10; }
        return;
    }
  };
})();
