/* DEEP16 — the class features (handoff-2026-09-28-npc-classes-to-six.md §3A/3C): what each SRD 5.1 class brings to a fight at
   levels 1-6 beyond its weapon and its spells, and how the class tactics (js/tactics.js) use it. The four heroes' own features
   (the fighter's, the rogue's, the paladin's, the wizard's) live where they did (battle.js, the ring); these are the other
   classes', and the AI's hand for the ones the heroes share. Built for the class NPCs first; a hero of these classes (the
   Pocket DM's horizon) would want its ring buttons, not built yet. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx, M = D.magic, AI = D.ai, TX = D.tactics;
  var F = D.features = {};
  function nm(B, w) { return B.theOf ? B.theOf(w) : w.name; } // (the article once: 11-18, battle.js Battle.prototype.theOf)
  function Nm(B, w) { var s = nm(B, w); return s.charAt(0).toUpperCase() + s.slice(1); }
  function feat(u, k) { return u.feats && u.feats[k] > 0; }
  function foesBeside(B, u) { return B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && G.dist(u, w) <= G.reachOf(u) && !RU.charmedBy(u, w); }); } // (charmed: never its charmer)
  function kiDC(u) { return 8 + u.prof + D.mod(u.abil.wis); }

  // ------------------------------------------------------------------ the wizard: Sculpt Spells (evocation 2), Potent Cantrip (6)
  // (an evocation by the spell's own record, the SRD's school -- js/rules.js R.school; 10-31, Griz: "have sculpt read the new tag you made". The hand list it replaced held Produce
  // Flame and Call Lightning, conjurations, and left out 33 evocations -- Wall of Fire, Flame Strike, Moonbeam, Sunbeam among them. Ours by his word: the Scourges, 10-14 "works with sculpt")
  M.sculpts = function (u, id) { return u.subclass === 'School of Evocation' && u.lvl >= 2 && window.DS.R.school(id) === 'evocation'; };
  M.sculpted = function (u, id, sp, caught) {
    if (!M.sculpts(u, id)) return [];
    // (SRD 5.1: "other creatures that you can see" -- not himself, and never an object: the Skylights' glass was being sculpted out of his Shatter, 10-05 night, the show's find)
    return caught.filter(function (w) { return w.side === u.side && w !== u && !w.object; }).slice(0, 1 + (sp.level || 0));
  };
  // ------------------------------------------------------------------ the sorcerer: Elemental Affinity (Draconic 6)
  M.affinity = function (u, el) { var a = u.src && u.src.ancestry; return u.subclass === 'Draconic Bloodline' && u.lvl >= 6 && el === ((D.npc && D.npc.DRAGONS || {})[a] || a || 'fire') ? // (the sheet's dragon ancestor's element: NPC.DRAGONS, 10-31)
    Math.max(0, D.mod(u.abil.cha)) : 0; };

  // ------------------------------------------------------------------ the barbarian: Rage, Reckless Attack, Danger Sense, Frenzy
  // Rage (a bonus action; SRD 5.1): +2 to STR melee damage, blades and blows halved (battle.js hurt), advantage on STR checks and saves;
  // a minute (ten of its turns). Frenzy (the Berserker, 3): while raging, a bonus-action swing each turn after
  RU.saveAdv = function (u, ab) { return (ab === 'str' && !!u.conds.raging) || (ab === 'dex' && u.cls === 'barbarian' && u.lvl >= 2 && !u.conds.blinded); };
  // (the rage begun: the AI's first thing, the player's RAGE -- F.commands below)
  // the rage as a condition: the damage, a minute, and what ends with it (Mindless Rage's suspended fear and charm come back: F.mindlessEnd)
  F.rageCond = function (u) { return { dmg: u.lvl >= 16 ? 4 : u.lvl >= 9 ? 3 : 2, till: { who: u.id, at: 'start', n: 10 }, endText: '{who}\'s rage burns out.', onEnd: function (w) { F.mindlessEnd(w); if (w.conds.frenzy) { delete w.conds.frenzy; if (!w.dead) RU.exhaust(D.battle, w, 1, 'the frenzy spent'); } } }; }; // (the Frenzy's price, SRD 5.1: "When your rage ends, you suffer one level of exhaustion" -- js/rules.js RU.exhaust, 10-08)
  // Mindless Rage (the Berserker, 6; SRD 5.1): while raging it cannot be charmed or frightened (js/rules.js RU.immuneTo), and a charm or a
  // fright it has when the rage begins is suspended for the rage's length (put by; it comes back when the rage ends, if what laid it still
  // holds: its caster on his feet, and his concentration where the spell needs it)
  F.mindless = function (B, u) {
    if (u.subclass !== 'Path of the Berserker' || u.lvl < 6) return;
    var held = [];
    ['charmed', 'frightened', 'feared'].forEach(function (k) { if (u.conds[k]) { held.push([k, u.conds[k]]); delete u.conds[k]; } });
    if (!held.length) return;
    u.suspended = (u.suspended || []).concat(held);
    B.card(['  {c}Mindless Rage{/}: ' + held.map(function (h) { return h[0] === 'feared' ? 'the terror' : h[0]; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(' and ') + ' on ' + nm(B, u) + ' is suspended for the rage'], 240);
  };
  F.mindlessEnd = function (u) {
    var B = D.battle, held = u.suspended; delete u.suspended;
    if (!held || !B || u.dead || u.hp <= 0) return;
    var back = [], hasFear = held.some(function (h) { return h[0] === 'feared'; });
    held.forEach(function (h) {
      var k = h[0], c = h[1], src = c && c.by && B.units.filter(function (w) { return w.id === c.by; })[0];
      if (u.conds[k]) return; // (laid again since: it stands)
      if (c && c.fresh) return; // (a moan's, a slam's: gone with the turn it was for)
      if (c && c.by && (!src || src.dead || src.hp <= 0)) return; // (what laid it is gone)
      if (c && c.by && (k === 'feared' || (k === 'frightened' && hasFear) || c.dc) && !(src && src.conc)) return; // (a Fear that was let go)
      u.conds[k] = c; back.push(k);
    });
    if (back.length) B.card(['{g}' + B.theOf(u, true) + '\'s rage is over: the ' + (hasFear ? 'terror' : back.join(' and ')) + ' comes back.{/}'], 240);
  };
  F.rage = function (B, u) {
    u.turn.bonus = 0; u.feats.rage--;
    u.conds.raging = F.rageCond(u);
    if (u.subclass === 'Path of the Berserker') u.conds.frenzy = true;
    F.mindless(B, u);
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
      u.conds.raging = F.rageCond(u);
      if (u.subclass === 'Path of the Berserker') u.conds.frenzy = true;
      F.mindless(B, u);
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
  // the same strikes for the player's monk (the ring's FLURRY OF BLOWS / BONUS STRIKE): each strike asks at whom when more than one stands beside
  F.bonusStrikes = function* (B, u) {
    var T = u.turn, fist = F.fist(u), flurry = u.lvl >= 2 && feat(u, 'ki'), n = flurry ? 2 : 1;
    T.bonus = 0; if (flurry) u.feats.ki--;
    B.card(['{y}' + Nm(B, u) + '{/}: ' + (flurry ? 'FLURRY OF BLOWS  {g}(1 ki, ' + u.feats.ki + ' left){/}' : 'a strike of the martial arts {g}(bonus action){/}')], 200);
    for (var i = 0; i < n; i++) {
      var near = foesBeside(B, u); if (!near.length) break;
      var t = near.length > 1 ? yield* pickOne(B, u, flurry ? 'FLURRY OF BLOWS' : 'BONUS STRIKE', near, 'Strike ' + (i + 1) + ' of ' + n + ': at whom?') : near[0];
      if (!t) { if (!i) { T.bonus = 1; if (flurry) u.feats.ki++; } break; } // (not now, before a blow: nothing spent)
      var keep = u.weapon; u.weapon = fist; T.flurry = flurry;
      yield* B.attack(u, t, fist);
      u.weapon = keep; T.flurry = false;
      if (u.dead || u.hp <= 0) return;
    }
  };
  // Stunning Strike (5) and Open Hand Technique (3): what the monk does with a hit (battle.js attack asks, M.onWeaponHit)
  M.onWeaponHit = function* (B, att, tgt, atk, crit) {
    if (tgt.dead || tgt.hp <= 0) return;
    // Open Hand Technique: a Flurry hit -- DEX or prone (the monk's choice: down, for the swings to come)
    if (att.cls === 'monk' && att.lvl >= 3 && att.subclass === 'Way of the Open Hand' && att.turn && att.turn.flurry && !tgt.conds.prone && !tgt.noProne && !RU.immuneTo(tgt, 'prone') && (tgt.size || 1) <= 2) {
      var sv = RU.save(tgt, 'dex', kiDC(att));
      B.card(['  {y}open hand{/}: ' + Nm(B, tgt) + ' DEX ' + RU.saveText(sv) + ' vs DC ' + kiDC(att) + '  ' + (sv.ok ? '{n}keeps their feet{/}' : '{o}PRONE{/}')], 240);
      if (!sv.ok && !(D.features && D.features.holdGround && D.features.holdGround(B, tgt, 'prone'))) tgt.conds.prone = true; // (HOLD GROUND, 10-30)
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
    // the player's monk is asked, on each melee hit while ki lasts (SRD 5.1: no limit a turn but the ki)
    else if (att.cls === 'monk' && att.lvl >= 5 && feat(att, 'ki') && att.side === 'party' && !att.guest && !atk.ranged && !tgt.conds.stunned && !RU.immuneTo(tgt, 'stunned') && tgt.hp > 0) {
      var yes = yield { prompt: { who: att, title: att.name + ': STUNNING STRIKE?', lines: ['1 ki (' + att.feats.ki + ' left): ' + Nm(B, tgt) + ' saves CON against DC ' + kiDC(att) + ' or is stunned till the end of your next turn.'], opts: [{ label: 'STUN', value: true }, { label: 'NOT THIS TIME', value: false }] } };
      if (yes) {
        att.feats.ki--;
        var s3 = RU.save(tgt, 'con', kiDC(att), false, 'stunned');
        B.card(['  {y}stunning strike{/} {g}(1 ki){/}: ' + Nm(B, tgt) + ' CON ' + RU.saveText(s3) + ' vs DC ' + kiDC(att) + '  ' + (s3.ok ? '{n}shakes it off{/}' : '{p}STUNNED{/}')], 300);
        if (!s3.ok) { tgt.conds.stunned = { by: att.id, till: { who: att.id, at: 'end', n: 2 } }; FX.ring(tgt, 'gold', 26); }
        yield 16;
      }
    }
    // Colossus Slayer (the Hunter ranger, 3): once a turn, +1d8 on a weapon hit on one already hurt
    // (dealt as its own blow so the card shows it)
    // (the Hunter's Prey is a choice of three since 11-20 -- u.prey, F.prey below; a Hunter with none named is the Colossus Slayer it always was)
    if (att.cls === 'ranger' && att.lvl >= 3 && att.subclass === 'Hunter' && (att.prey || 'colossus') === 'colossus' && att.turn && !att.turn.colossus && tgt.hp < tgt.maxhp && !atk.spell) {
      att.turn.colossus = true; var cs = D.roll('1d8', { crit: crit });
      B.card(['  {y}colossus slayer{/} 1d8 [' + cs.rolls.join(',') + '] = {r}' + cs.total + '{/}'], 200); B.hurt(tgt, cs.total, atk.type, { magic: !!(atk.magic || atk.spell), blow: tgt.blowIn }); // (the weapon's blow: one concentration save, battle.js blowEnd)
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
  // Help on a friend beside it (10-01c, Griz: "repurpose the help action to conditionally target allies"): a sleeper shaken awake -- worth the friend's next
  // turns of harm, more than most swings -- or a hand to one held in a web or a grip (its escape check at advantage: less). Anyone's (battle.js Battle.helpable)
  TX.ACTIONS.push(function (B, u) {
    if (!u.turn.action || u.turn.attacksLeft) return null;
    var best = null;
    B.units.forEach(function (w) {
      if (!D.Battle.helpable(u, w)) return;
      // (a hand to one held: not from one held itself -- its own grip first -- and not to one whose tactics would fight on from the grip rather than wrench at it
      // (js/tactics.js freeHow): the hand would go unspent. 10-02: on the roper's bench the four, all held, handed each other advantage for fifteen rounds)
      if ((w.conds.restrained || w.conds.attached) && (u.conds.restrained || (w.classAI && w.conds.restrained && TX.freeHow && TX.freeHow(B, w) !== 'escape'))) return;
      var shk = D.Battle.shakable(w), sc = shk ? TX.dpr(w) * 2.5 + 4 : TX.dpr(w) * 0.6 + 1; // (asleep or entranced -- a Hypnotic Pattern's stupor, shaken out of it: 11-10, his record)
      if (!best || sc > best.score) best = { kind: 'help', why: (shk ? 'shake ' : 'a hand to ') + w.name, score: sc, go: function* () { yield* B.exec(u, { do: 'help', target: w }); } };
    });
    return best;
  });
  // Patient Defense (2; SRD 5.1): 1 ki, the Dodge action as a bonus action -- attacks against it at disadvantage, advantage on its DEX
  // saves, till its next turn (rules.js edges and save read conds.dodge). The AI's and the player's PATIENT DEFENSE button (F.commands)
  F.patient = function* (B, u) {
    var T = u.turn; T.bonus = 0; u.feats.ki--; u.conds.dodge = true; FX.ring(u, 'silver', 22); D.sfx('buff');
    B.card(['{y}' + Nm(B, u) + '{/}: PATIENT DEFENSE  {g}(1 ki, ' + u.feats.ki + ' left: the Dodge, as a bonus action){/}'], 200); yield 12;
  };
  // Step of the Wind (2; SRD 5.1): 1 ki, Disengage or Dash as a bonus action (the jump's doubling is not read: the grid has no jump)
  F.stepWind = function* (B, u, how) {
    var T = u.turn; T.bonus = 0; u.feats.ki--; FX.sparkle(u, 'silver', 12); D.sfx('run');
    if (how === 'dash') { if (!(u.conds.restrained || u.conds.dancing)) T.move += u.speed; } else T.disengaged = true; // (the buttons and the AI already refuse a held or dancing monk; this is the belt to their braces)
    B.card(['{y}' + Nm(B, u) + '{/}: STEP OF THE WIND  {g}(1 ki, ' + u.feats.ki + ' left: ' + (how === 'dash' ? 'Dash, +' + u.speed + ' ft' : 'Disengage: leaving reach provokes nothing') + ', as a bonus action){/}'], 200); yield 12;
  };
  // a square within its move where fewer foes stand beside it (the way out of a crowd)
  function lessCrowded(B, u, n) {
    var rm = G.reach(u, u.turn.move);
    return Object.keys(rm).some(function (k) { var e = rm[k]; return e.stand && G.foesNear(u, e.x, e.y, 5).length < n; });
  }
  // what the monk's bonus action goes to after the Attack action (the AI's weighing, in hit points): Flurry of Blows (two strikes), Patient
  // Defense (a Dodge: a foe's blows at disadvantage, about two in five gone), or the Step of the Wind's Disengage out of a crowd. A hurt
  // monk weighs the two defences up (life); a whole one only strikes. null: none of the three (no ki, no foe beside)
  F.monkPick = function (B, u) {
    var T = u.turn;
    if (u.cls !== 'monk' || u.lvl < 2 || !T.bonus || !feat(u, 'ki') || u.conds.incapacitated) return null;
    var near = foesBeside(B, u); if (!near.length) return null;
    var frac = u.hp / Math.max(1, u.maxhp), life = 1 + (1 - frac) * 1.5, inc = near.reduce(function (s, w) { return s + TX.dpr(w); }, 0), fv = 0;
    if (T.attackAction && !u.conds.disarmed) {
      var fist = F.fist(u), tg = near.slice().sort(function (a, b) { return a.hp - b.hp; })[0];
      if (fist && tg) fv = 2 * TX.pHit(fist.atk, RU.ac(tg), 0) * (TX.avg(fist.dice) + (fist.mod || 0));
    }
    var pv = frac < 0.6 && !u.conds.dodge ? 0.4 * inc * life : 0;
    var sv = frac < 0.5 && T.move >= 10 && !u.conds.restrained && (near.length >= 2 || frac < 0.35) && lessCrowded(B, u, near.length) ? 0.55 * inc * life * (near.length >= 2 ? 1 : 0.7) - 3 : 0;
    if (sv > Math.max(fv, pv) + 1) return 'step';
    if (pv > fv + 1) return 'patient';
    return 'flurry';
  };
  TX.AFTER.unshift(function* (B, u) { // (ahead of the Flurry above: it takes the bonus action if this one does not)
    var pick = F.monkPick(B, u);
    if (pick === 'patient') yield* F.patient(B, u);
    else if (pick === 'step') yield* F.stepWind(B, u, 'disengage'); // (tactics.js keepOff then walks it to the square with fewer foes beside it)
  });
  // the Dash: a foe out of reach by the walk this turn, and in reach by the walk and the Dash -- the ki for the bonus action, and the action to strike
  TX.FIRST.push(function* (B, u) {
    var T = u.turn;
    if (u.cls !== 'monk' || u.lvl < 2 || !T.bonus || !feat(u, 'ki') || u.conds.restrained || u.conds.dancing || u.conds.incapacitated || (u.side === 'party' && !u.guest)) return; // (a dancer's move is all the dance: no Dash to add to it)
    var fs = TX.foesOf(B, u); if (!fs.length) return;
    // (a thrown weapon from where the walk leaves it is a swing too: the dagger's 60 ft -- then the ki stays)
    var thrown = u.alt && u.alt.ranged && !u.conds.disarmed ? u.alt.range[1] : 0;
    var can = function (mv) { var rm = G.reach(u, mv); return fs.some(function (t) { return Object.keys(rm).some(function (k) { var e = rm[k]; return e.stand && G.dist(u, t, e.x, e.y) <= Math.max(G.reachOf(u), thrown); }); }); };
    if (can(T.move) || !can(T.move + u.speed)) return;
    yield* F.stepWind(B, u, 'dash');
  });

  // ------------------------------------------------------------------ the rogue: Cunning Action for the AI's rogues (the player's has the ring's)
  TX.AFTER.push(function* (B, u) {
    var T = u.turn;
    if (u.cls !== 'rogue' || u.lvl < 2 || !T.bonus || u.side === 'party' && !u.guest) return;
    var beside = foesBeside(B, u);
    if (beside.length && T.move >= 10) { T.bonus = 0; T.disengaged = true; B.card(['{y}' + Nm(B, u) + '{/} (Cunning Action) disengages.'], 160); yield 8; return; }
    // (only where the Hide could take: with a foe that sees her clearly the roll is not even made -- the bonus action was thrown away, and "tries to hide, but ... plainly" said so)
    if (!beside.length && !u.conds.hidden && B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && RU.canAct(w); }).every(function (w) { return B.seenBy(w, u) < 2; })) { yield* B.hide(u); }
  });
  // ------------------------------------------------------------------ the paladin: Sacred Weapon for the AI's paladins
  TX.ACTIONS.push(function (B, u, fs) {
    if (u.cls !== 'paladin' || u.lvl < 3 || !RU.devoted(u) || !feat(u, 'channel') || u.conds.sacred || !u.turn.action || u.turn.attacksLeft || (u.side === 'party' && !u.guest)) return null;
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
    var t = TX.alliesOf(B, u).filter(function (w) { return w !== u && G.standing(w) && !w.conds.inspired && G.range(u, w) <= 60; }).sort(function (a, b) { return TX.dpr(b) - TX.dpr(a); })[0];
    if (!t) return;
    T.bonus = 0; u.feats.inspiration--; t.conds.inspired = { die: inspDie(u), by: u.id };
    FX.sparkle(t, 'gold', 12); B.card(['{y}' + Nm(B, u) + '{/} inspires ' + t.name + ' {g}(a ' + inspDie(u) + ' for a roll that needs it){/}'], 200); yield 12;
  });
  // the die spent where it turns a miss into a hit or a failed save into a saved one (battle.js attack, rules.js save)
  F.inspire = function (u, need) {
    var c = u.conds.inspired; if (!c || need <= 0) return 0;
    var faces = +c.die.slice(1); if (need > faces) return 0;
    var r = D.d(faces); if ((c.n || 1) > 1) c.n--; else delete u.conds.inspired; return r; // (Rascal's dice stack, c.n: one spent a roll, js/mpmon.js MP.sharing)
  };
  // Cutting Words: a bard within 60 ft of the attacker, on the target's side, with a use and its reaction, and the blow within reach of the die
  F.cutting = function (B, att, tgt, over) {
    var bard = B.units.filter(function (w) { return w.cls === 'bard' && w.lvl >= 3 && w.subclass === 'College of Lore' && w.side === tgt.side && w.reaction > 0 && RU.canAct(w) && feat(w, 'inspiration') && G.range(w, att) <= 60 && M.sees(B, w, att) && (w.side !== 'party' || w.guest); })[0];
    if (!bard) return 0;
    var faces = +inspDie(bard).slice(1); if (over >= faces) return 0;
    bard.reaction = 0; bard.feats.inspiration--;
    var r = D.d(faces);
    B.card(['{y}' + Nm(B, bard) + '{/}: CUTTING WORDS -- ' + r + ' off the roll'], 200);
    return r;
  };
  // Countercharm (6; SRD 5.1): an action; a performance till the end of its next turn -- it and the friends within 30 ft who can hear it have
  // advantage on saves against being frightened or charmed (js/rules.js RU.save `against`: Fear, Hypnotic Pattern, Charm Person, the moan ...).
  // Ends early if it is incapacitated (RU.countercharmed asks). The AI sings it when a foe that frightens or charms is up, or a friend is under such
  // a spell; the player's COUNTERCHARM button (F.commands)
  var FEARSOME = ['fear', 'hypnoticpattern', 'charmperson', 'animalfriendship', 'dominatebeast', 'dominateperson', 'phantasmalkiller', 'weird', 'eyebite'];
  F.countercharm = function* (B, u) {
    u.turn.action = 0; u.conds.countercharm = { till: { who: u.id, at: 'end', n: 2 }, endText: '{who}\'s countercharm ends.' };
    D.sfx('buff'); FX.ring(u, 'gold', 60);
    var n = TX.alliesOf(B, u).filter(function (w) { return G.standing(w) && (w === u || G.dist(u, w) <= 30); }).length;
    B.card(['{y}' + Nm(B, u) + '{/}: COUNTERCHARM  {g}(a song till the end of its next turn: advantage on saves against being frightened or charmed, ' + n + ' within 30 ft){/}'], 300); yield 24;
  };
  // a foe that frightens or charms: the cloaker's moan (ready), a caster with the spells to (a slot left), a bard
  function fearsome(w) {
    if (w.moan && w.moan.ready && (w.moan.cond || 'frightened') === 'frightened') return true;
    if (w.cls === 'bard' && w.lvl >= 6) return false; // (its own song is its concern)
    var top = 0; (w.slots || []).forEach(function (n, i) { if (n > 0) top = i + 1; });
    return !!top && (w.known || []).some(function (id) { var sp = M.data(id); return FEARSOME.indexOf(id) >= 0 && sp && sp.level <= top; });
  }
  TX.ACTIONS.push(function (B, u, fs, allies) {
    if (u.cls !== 'bard' || u.lvl < 6 || !u.turn.action || u.turn.attacksLeft || u.conds.countercharm || (u.side === 'party' && !u.guest)) return null;
    var near = allies.filter(function (w) { return G.standing(w) && (w === u || G.dist(u, w) <= 30); });
    var srcs = fs.filter(function (w) { return fearsome(w) && G.dist(u, w) <= 150; });
    var under = near.filter(function (w) { return (w.conds.feared && w.conds.feared.dc) || (w.conds.charmed && !w.conds.charmed.dominated); });
    if (!srcs.length && !under.length) return null;
    var sc = srcs.length * near.reduce(function (s, w) { return s + TX.dpr(w); }, 0) * 0.3 + under.reduce(function (s, w) { return s + TX.dpr(w) * 0.6; }, 0); // (a save at advantage fails a fifth less often; a Fear costs a friend two rounds)
    return { kind: 'feature', why: 'Countercharm', score: Math.min(sc, 20), go: function* () { yield* F.countercharm(B, u); } };
  });

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

  // the same, for a Life cleric the player runs (the CHANNEL DIVINITY list): the lowest first, each to half its maximum, from 5 x her level
  F.lifeLow = function (B, u) { return B.units.filter(function (w) { return w.side === u.side && !w.dead && !w.left && G.dist(u, w) <= 30 && w.hp < w.maxhp / 2 && w.type !== 'undead' && w.type !== 'construct'; }); };
  F.preserveLife = function* (B, u) {
    u.turn.action = 0; u.feats.channel--; var left = 5 * u.lvl, got = [];
    F.lifeLow(B, u).sort(function (a, b) { return a.hp - b.hp; }).forEach(function (w) { var g = Math.min(left, Math.floor(w.maxhp / 2) - Math.max(0, w.hp)); if (g > 0) { left -= g; B.heal(w, g); got.push(w.name + ' +' + g); } });
    D.sfx('heal'); FX.ring(u, 'gold', 50);
    B.card(['{y}' + Nm(B, u) + '{/}: PRESERVE LIFE  {n}' + (got.join(', ') || 'nobody needed it') + '{/}  {g}(Channel Divinity){/}'], 300); yield 24;
  };
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
  // (o: { name, noDestroy } -- the paladin's Turn the Unholy is this prayer with fiends among them, and no Destroy Undead)
  F.turnUndead = function* (B, u, dead, o) {
    o = o || {};
    var dc = u.spellDC, name = o.name || 'TURN UNDEAD';
    u.turn.action = 0; u.feats.channel--; D.sfx('buff'); FX.ring(u, 'gold', 60);
    var lines = ['{y}' + Nm(B, u) + '{/} presents the holy symbol: ' + name + '  WIS DC ' + dc], gone = [];
    dead.forEach(function (w) {
      var sv = RU.save(w, 'wis', dc, false, 'turned'), destroy = !o.noDestroy && !sv.ok && u.lvl >= 5 && crNum(w.cr) <= (u.lvl >= 17 ? 4 : u.lvl >= 14 ? 3 : u.lvl >= 11 ? 2 : u.lvl >= 8 ? 1 : 0.5);
      lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}stands{/}' : destroy ? '{y}DESTROYED{/}' : '{o}turned{/}'));
      if (destroy) gone.push(w); else if (!sv.ok) F.setTurned(w, u);
    });
    B.cardCut(lines, 8, 420); yield { fx: 1 };
    gone.forEach(function (w) { B.hurt(w, w.hp + (w.temp || 0), 'radiant'); });
    yield 24;
  };
  // Turned (SRD 5.1): for a minute (ten of its turns) or till it takes damage, it spends its turns moving as far from the one who turned it
  // as it can (js/tactics.js fleeFear: the Dash, and nothing else), takes no reactions, and may not step nearer (grid.js stepCost: frightened).
  // It carries `frightened` and `feared` beside `turned` for those; the sweeps that end a laid fright at its caster's turn's end leave it be
  // (ai.js, battle.js), and the turned one's own clock (M.tick) takes all three away together
  F.setTurned = function (w, u) {
    w.reaction = 0;
    w.conds.turned = { by: u.id, till: { who: w.id, at: 'start', n: 10 }, endText: '{who} is no longer turned.', onEnd: function (x) { F.unturn(x, u.id); } };
    w.conds.frightened = { by: u.id }; w.conds.feared = { by: u.id };
  };
  F.unturn = function (x, by) {
    if (x.conds.feared && x.conds.feared.by === by && !x.conds.feared.dc) delete x.conds.feared;
    if (x.conds.frightened && x.conds.frightened.by === by && !x.conds.feared) delete x.conds.frightened;
  };
  var onHurt0 = M.onHurt;
  M.onHurt = function (B, u, n, type) { if (onHurt0) onHurt0(B, u, n, type); if (u.conds.turned) { var by = u.conds.turned.by; delete u.conds.turned; F.unturn(u, by); B.card(['{g}' + Nm(B, u) + ' is hurt out of its terror.{/}'], 200); } };

  // ------------------------------------------------------------------ the paladin: Turn the Unholy (Oath of Devotion, 3; Channel Divinity)
  // An action: each fiend or undead within 30 ft that can see or hear it makes a WIS save (the paladin's DC) or is turned. It is Turn Undead
  // (above) with fiends among the dead and no Destroy Undead, and it draws on the one Channel Divinity Sacred Weapon does (feats.channel).
  // The AI turns them when two or more are near, or one that hits hard; the player's TURN THE UNHOLY button (F.commands). Class NPCs only:
  // Lymen, of the same oath, has Sacred Weapon in the 8-bit game and no more (his hero sheet is that game's)
  F.unholyNear = function (B, u) { return hostileNear(B, u, 30).filter(function (w) { return (w.type === 'undead' || w.type === 'fiend') && !w.conds.turned; }); };
  F.unholy = function (u) { return !!(u.cls === 'paladin' && u.lvl >= 3 && RU.devoted(u)); }; // (Lymen's too: RULED 09-30, Griz: "pretty sure he's supposed to have it")
  TX.ACTIONS.push(function (B, u, fs) {
    if (!F.unholy(u) || !feat(u, 'channel') || !u.turn.action || u.turn.attacksLeft || (u.side === 'party' && !u.guest)) return null;
    var foul = F.unholyNear(B, u), dc = u.spellDC;
    if (!foul.length) return null;
    var sc = foul.reduce(function (s, w) { return s + TX.pFail(w, 'wis', dc) * TX.dpr(w) * 3; }, 0);
    if (foul.length < 2 && !foul.some(function (w) { return TX.dpr(w) >= 10 || crNum(w.cr) >= 3; })) return null; // (two or more, or one worth the prayer)
    return { kind: 'feature', why: 'Turn the Unholy', score: sc, go: function* () { yield* F.turnUndead(B, u, foul, { name: 'TURN THE UNHOLY', noDestroy: true }); } };
  });

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
    u.beast = { kind: kind, hp: d.hp, maxhp: d.hp, keep: { weapon: u.weapon, alt: u.alt, baseAC: u.baseAC, speed: u.speed, walkSpeed: u.walkSpeed, sheet: u.sheet, abil: u.abil, saves: u.saves, attacks: u.attacks, attacksBase: u.attacksBase, packTactics: u.packTactics, known: u.known, flies: u.flies, blindsight: u.blindsight, climbs: u.climbs } };
    // (the whole attack, so the spider's poison and the frog's grip ride with the bite; the figure keeps its own square -- a Large shape stands in one)
    u.weapon = Object.assign({}, bite, { magic: false });
    u.alt = null; u.baseAC = d.ac; u.speed = d.speed; u.sheet = d.sheet; u.abil = Object.assign({}, u.abil, { str: d.abil.str, dex: d.abil.dex, con: d.abil.con }); u.attacks = 1; u.attacksBase = 1; u.packTactics = !!d.packTactics; u.known = [];
    // (the beast's STR, DEX and CON saves -- the druid is proficient in none of the three: SRD 5.1 Wild Shape; its senses; a flier flies)
    var sv0 = u.saves || {}; ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function (k) { if (sv0[k] == null) sv0[k] = D.mod(u.beast.keep.abil[k]); });
    u.saves = Object.assign({}, sv0, { str: d.saves ? d.saves.str : D.mod(d.abil.str), dex: d.saves ? d.saves.dex : D.mod(d.abil.dex), con: d.saves ? d.saves.con : D.mod(d.abil.con) });
    if (d.blindsight) u.blindsight = Math.max(u.blindsight || 0, d.blindsight);
    u.climbs = d.climbs || 0; if (u.turn && u.climbs) u.turn.climbLeft = Math.max(u.turn.climbLeft || 0, u.climbs - (u.turn.moved || 0)); // (and this turn's climb by it, less what was moved -- SRD 5.1 Movement, "switching between speeds") (the beast's climb speed too -- SRD 5.1 Wild Shape: "your game statistics are replaced by the statistics of the beast"; the wolf spider climbs 40: the grid's rules §2.18, 10-15)
    u.flies = !!(shp && shp.flies); u.walkSpeed = u.flies && d.walk != null ? d.walk : undefined; // (the bat walks 10 when it cannot fly: rules.js RU.speedNow, 10-08)
    if (!(u.conds.restrained || u.conds.dancing)) u.turn.move = Math.max(u.turn.move, d.speed - (u.keep0 || 0)); // (a beast's stride is no use to a druid held fast -- speed 0 -- or dancing in place: SRD 5.1, Restrained; Irresistible Dance)
    FX.sparkle(u, 'moss', 24); D.sfx('buff');
    B.card(['{y}' + Nm(B, u) + '{/}: WILD SHAPE -- a ' + d.name.toLowerCase() + ' where the druid stood  {g}(' + d.hp + ' HP of its own){/}'], 300);
    yield 24;
  };
  // Polymorph (SRD 5.1; js/grimoire.js E.polymorph): a creature made a beast -- its statistics the beast's, mind and all; its own hit points
  // kept behind the beast's (Battle.hurt's pool, as Wild Shape's); no spells. A foe the bestiary runs fights with the beast's own attacks; a
  // hero or a class NPC with its best one as a weapon (its turn is still its own). Its footprint stays its own (a giant made a rat keeps
  // his square; the rat is drawn in it)
  var MORPH_KEEP = ['weapon', 'alt', 'baseAC', 'speed', 'sheet', 'abil', 'saves', 'attacks', 'attacksBase', 'multi', 'packTactics', 'known', 'flies', 'blindsight', 'darkvision', 'type', 'resist', 'immune', 'condImmune', 'web', 'slam', 'weave', 'reach', 'drawScale', 'regen', 'split', 'climbs'];
  F.morph = function (B, u, kind, by) {
    var d = D.FOES[kind]; if (!d) return false;
    var keep = {}; MORPH_KEEP.forEach(function (k) { keep[k] = u[k]; });
    u.beast = { kind: kind, hp: d.hp, maxhp: d.hp, keep: keep, morph: { by: by.id } };
    var bite = d.attacks[Object.keys(d.attacks)[0]];
    u.baseAC = d.ac; u.speed = d.speed; u.sheet = d.sheet; u.abil = Object.assign({}, d.abil); u.saves = Object.assign({}, d.saves || {});
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function (k) { if (u.saves[k] == null) u.saves[k] = D.mod(u.abil[k]); });
    u.known = []; u.type = d.type || 'beast'; u.resist = d.resist || null; u.immune = d.immune || null; u.condImmune = d.condImmune || null;
    u.flies = false; u.blindsight = d.blindsight || 0; u.darkvision = d.darkvision || 0; u.packTactics = !!d.packTactics; u.climbs = d.climbs || 0; // (the beast's climb speed: a giant spider walks up a cliff, 10-04)
    u.web = null; u.slam = null; u.weave = null; u.reach = d.reach || 5; u.drawScale = 1; u.regen = 0; u.split = false;
    if (u.cls || u.side === 'party') { u.weapon = Object.assign({}, bite, { magic: false }); u.alt = null; u.attacks = d.multi || 1; u.attacksBase = u.attacks; }
    else { u.attacks = JSON.parse(JSON.stringify(d.attacks)); u.multi = d.multi || 1; }
    return true;
  };
  F.unshape = function (B, u, over, willing, type, src) { // (type, src: the blow that threw the beast off -- what is left of it lands as that kind, magic or not; 10-06, the grid's rules §2.2)
    var k = u.beast.keep, mb = u.beast.morph; delete u.beast;
    Object.keys(k).forEach(function (f) { u[f] = k[f]; });
    FX.sparkle(u, 'moss', 16);
    B.card(['{g}' + Nm(B, u) + (willing ? ' takes their own shape again.' : ' is thrown back into their own shape.') + '{/}'], 240);
    // (a Polymorph undone by the blow ends the spell: SRD "until the target drops to 0 hit points")
    if (mb) { var cst = B.units.filter(function (w) { return w.id === mb.by; })[0]; if (cst && cst.conc && cst.conc.id === 'polymorph' && cst.conc.t === u) delete cst.conc; }
    if (over > 0) B.hurt(u, over, type || 'bludgeoning', { carried: true, magic: !!(src && src.magic) }); // (carried: the blow's concentration save was rolled once already, Battle.hurt -- 10-03) (SRD 5.1 Wild Shape: "any excess damage carries over to your normal form" -- the blow's own kind, not a bludgeoning one: f854491 kept the amount and lost the kind)
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
    if (F.hasMeta(u, 'quickened') && (u.feats.sorcery || 0) >= 2 && slots > 0) {
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

  // ------------------------------------------------------------------ the sorcerer's metamagic (3; SRD 5.1): the options a sorcerer knows are
  // u.metamagic (js/classes.js: the generic one knows Quickened and Twinned; Careful and Heightened are here for a spec that lists them), paid
  // in sorcery points (feats.sorcery). One option to a spell (SRD). T.meta = { name } is the spell about to be cast: the player's toggle button
  // sets it (F.commands), the AI's plan sets it (tactics.js castGo, from F.metaPlan below) -- and the wrapper on M.cast, just under, pays for it,
  // makes it so, and clears it. Quickened is also the AI's own, above (T.quicken, magic.js M.cast)
  F.hasMeta = function (u, name) { var l = u.metamagic || (u.cls === 'sorcerer' && u.lvl >= 3 ? ['quickened'] : []); return l.indexOf(name) >= 0; };
  function points(u) { return (u.feats && u.feats.sorcery) || 0; }
  F.metaCost = function (name, sp) { return name === 'quickened' ? 2 : name === 'careful' || name === 'subtle' || name === 'empowered' ? 1 : name === 'heightened' ? 3 : Math.max(1, (sp && sp.level) || 0); }; // (Twinned: the spell's level, 1 for a cantrip)
  // Twinned Spell: a spell that targets one creature and only one, and not the caster alone -- the grid's single, attack and touch shapes
  // without concentration (the seat's call, 09-30: a twin of a concentration spell would be two records of one concentration); not Chain Lightning
  F.twinnable = function (id, sp, g, t) {
    if (!sp || !g || g.conc || g.free || g.shape === 'self' || id === 'chainlightning' || !/^(attack|single|touch)$/.test(g.shape)) return false;
    return !!(t && t.id && !t.units && t.x != null);
  };
  // why a metamagic does nothing for this spell ('' when it does)
  F.metaWhy = function (u, name, id, t) {
    var sp = M.data(id), g = M.geo(id), cost = F.metaCost(name, sp);
    if (!sp || !g) return 'no such spell';
    if (name === 'quickened' && !(sp.level && g.time === 'A')) return 'nothing to quicken: a leveled spell that takes an action';
    if (name === 'twinned' && !F.twinnable(id, sp, g, t)) return g.conc ? 'a spell held in concentration is not twinned (one record of it)' : 'it reaches more than one creature, or only yourself';
    if ((name === 'careful' || name === 'heightened') && !sp.save) return 'no creature saves against it';
    if (name === 'empowered' && !sp.dmg) return 'it deals no damage'; // (Empowered Spell, 10-31)
    if (points(u) < cost) return 'only ' + points(u) + ' sorcery point' + (points(u) === 1 ? '' : 's') + ' of ' + cost;
    return '';
  };
  // the creatures a save-spell aimed at t catches, foes first-hand for Heightened
  function metaCaught(B, u, g, t) {
    if (t && t.units) return t.units.filter(function (w) { return w.id && w.hp > 0; });
    if (t && t.x != null && !t.id) return B.units.filter(function (w) { return G.present(w) && w.hp > 0 && G.inArea(w, M.area(u, g, t.x, t.y, t.z)); });
    return t ? [t] : [];
  }
  var cast1m = M.cast;
  M.cast = function* (B, u, id, slot, t) {
    var T = u.turn, mm = T && T.meta;
    if (!mm || !u.feats) return yield* cast1m.apply(this, arguments);
    T.meta = null;
    var name = mm.name, sp = M.data(id), g = M.geo(id), cost = F.metaCost(name, sp), why = F.metaWhy(u, name, id, t), who = Nm(B, u), label = ({ quickened: 'QUICKENED SPELL', twinned: 'TWINNED SPELL', careful: 'CAREFUL SPELL', heightened: 'HEIGHTENED SPELL', subtle: 'SUBTLE SPELL', empowered: 'EMPOWERED SPELL' })[name];
    if (why) { B.card(['{o}' + who + ': ' + label + '{/} does nothing here: ' + why + ' -- cast as it is.'], 240); return yield* cast1m.apply(this, arguments); }
    var second = null, target = null;
    if (name === 'twinned') {
      // the second creature: the plan's, or the player's pick from those the spell may go to
      second = mm.t2 || null;
      if (!second) second = yield* pickOne(B, u, 'TWINNED SPELL', B.units.filter(function (w) { return w !== t && !w.dead && M.targetOK(B, u, g, w); }), 'A second creature for the same spell (' + cost + ' sorcery point' + (cost > 1 ? 's' : '') + ').');
      if (!second) { B.card(['{g}' + who + ': no second creature for the twin -- cast as it is.{/}'], 200); return yield* cast1m.apply(this, arguments); }
    }
    if (name === 'heightened') {
      target = mm.target || null;
      if (!target) {
        var cands = metaCaught(B, u, g, t).filter(function (w) { return G.hostile(u, w); });
        target = cands.length > 1 ? (!mine(u) ? cands.sort(function (a, b) { return TX.dpr(b) - TX.dpr(a); })[0] : yield* pickOne(B, u, 'HEIGHTENED SPELL', cands, 'Which one has disadvantage on its first save? (' + cost + ' sorcery points)')) : cands[0] || null;
      }
    }
    u.feats.sorcery -= cost; FX.ring(u, 'violet', 30);
    var left = u.feats.sorcery + ' left)';
    if (name === 'quickened') {
      B.card(['{y}' + who + '{/}: QUICKENED SPELL  {g}(' + cost + ' sorcery points, ' + left + ': the action\'s spell, as a bonus action){/}'], 200);
      T.quicken = true;
      try { return yield* cast1m.apply(this, arguments); } finally { T.quicken = false; }
    }
    if (name === 'twinned') {
      B.card(['{y}' + who + '{/}: TWINNED SPELL  {g}(' + cost + ' sorcery point' + (cost > 1 ? 's' : '') + ', ' + left + ': ' + sp.name + ' at ' + nm(B, t) + ' and at ' + nm(B, second) + '){/}'], 240);
      var r1 = yield* cast1m.apply(this, arguments);
      // the twin: the same spell, the same action, no second slot (one slot, one action, two creatures)
      if (!u.dead && u.hp > 0 && second.hp > 0 && !second.dead) {
        var keep = (u.slots || []).slice(), keepT = { action: T.action, bonus: T.bonus, bonusSpell: T.bonusSpell, spellAction: T.spellAction };
        yield* cast1m.call(this, B, u, id, slot, second);
        for (var si = 0; si < keep.length; si++) u.slots[si] = keep[si];
        T.action = keepT.action; T.bonus = keepT.bonus; T.bonusSpell = keepT.bonusSpell; T.spellAction = keepT.spellAction;
      }
      return r1;
    }
    // Subtle and Empowered (SRD 5.1 -- 10-31, the leveling lane §8 item 10, his "do the next two things"): Subtle, cast with no words or gestures -- none sees it cast, so no
    // Counterspell asks (js/grimoire.js M.counterAsk reads T.subtle); Empowered, its damage dice under the die's middle rolled again, up to CHA of them, the new rolls kept
    // (D.roll for this cast alone). Distant and Extended wait
    if (name === 'subtle') {
      B.card(['{y}' + who + '{/}: SUBTLE SPELL  {g}(' + cost + ' sorcery point, ' + left + ': no words, no gestures -- none sees it cast to counter it){/}'], 220);
      T.subtle = true;
      try { return yield* cast1m.apply(this, arguments); } finally { T.subtle = false; }
    }
    if (name === 'empowered') {
      var nE = Math.max(1, M.mod(u)), rollE = D.roll, reE = 0;
      B.card(['{y}' + who + '{/}: EMPOWERED SPELL  {g}(' + cost + ' sorcery point, ' + left + ': up to ' + nE + ' of its damage dice under the middle rolled again){/}'], 220);
      D.roll = function (expr, o) {
        var r = rollE.apply(this, arguments), p = D.parseDice(expr);
        if (p && p.s > 1) for (var k = 0; k < r.rolls.length && nE > 0; k++) if (r.rolls[k] < (p.s + 1) / 2) { var nr = D.d(p.s); r.total += nr - r.rolls[k]; r.rolls[k] = nr; nE--; reE++; }
        return r;
      };
      try { return yield* cast1m.apply(this, arguments); } finally { D.roll = rollE; if (reE) B.card(['{g}  (empowered: ' + reE + (reE > 1 ? ' dice' : ' die') + ' rolled again){/}'], 160); }
    }
    // Careful: up to CHA-mod of its friends caught (chosen at the save, in the order the creatures save) succeed on it; Heightened: the chosen
    // one has disadvantage on its first save. RU.save reads B.meta for the length of this cast (the first saves only: a hold's later ones stand)
    var n = Math.max(1, M.mod(u));
    B.meta = { by: u, ab: sp.save };
    if (name === 'careful') { B.meta.careful = { left: n, done: {} }; B.card(['{y}' + who + '{/}: CAREFUL SPELL  {g}(' + cost + ' sorcery point, ' + left + ': up to ' + n + ' of its friends caught in it succeed on the save){/}'], 240); }
    else { B.meta.heightened = { target: target, used: false }; B.card(['{y}' + who + '{/}: HEIGHTENED SPELL  {g}(' + cost + ' sorcery points, ' + left + ': ' + (target ? nm(B, target) : 'the first foe to save') + ' has disadvantage on its first save){/}'], 240); }
    try { return yield* cast1m.apply(this, arguments); } finally { B.meta = null; }
  };
  // the AI's weighing of a metamagic for the spell plan it has (tactics.js spellPlans, after the plan's own score): Twinned where a second
  // good target stands for a spell that reaches one; Careful where an area would catch its friends; Heightened on a save-or-lose against
  // one worth it and no sure thing. It raises the plan's score by what the option adds, less the points' price, and hangs `meta` on the plan
  F.metaPlan = function (B, u, e, slot, best, ev, fs, allies) {
    if (!u.metamagic || !u.metamagic.length || (u.turn && u.turn.quicken) || (u.side === 'party' && !u.guest)) return;
    var p = points(u); if (!p) return;
    if (F.hasMeta(u, 'twinned') && best.t && !best.from && F.twinnable(e.id, e.sp, e.g, best.t) && p >= F.metaCost('twinned', e.sp)) {
      var cost = F.metaCost('twinned', e.sp), b2 = null;
      try { b2 = ev(B, u, e, slot, fs.filter(function (w) { return w !== best.t; }), allies.filter(function (w) { return w !== best.t; })); } catch (err) { b2 = null; }
      if (b2 && !b2.from && b2.t && b2.t !== best.t && b2.t.id && !b2.t.units && b2.score >= 2.5 * cost + 1 && M.targetOK(B, u, e.g, b2.t)) { best.score += b2.score - 0.8 * cost; best.meta = { name: 'twinned', t2: b2.t }; return; }
    }
    if (F.hasMeta(u, 'careful') && p >= 1 && best.caught && e.sp.save && !(M.sculpts && M.sculpts(u, e.id))) {
      var fr = best.caught.filter(function (w) { return w.side === u.side && w.hp > 0; }).slice(0, Math.max(1, M.mod(u)));
      var gain = fr.reduce(function (s, w) { return s + TX.areaFriendCost(u, e, slot, w, false) - TX.areaFriendCost(u, e, slot, w, true); }, 0);
      if (gain > 3) { best.score += gain - 2; best.meta = { name: 'careful' }; return; }
    }
    if (F.hasMeta(u, 'heightened') && p >= 3 && best.t && best.t.id && !best.t.units && e.sp.save && !e.sp.dmg && G.hostile(u, best.t)) {
      var pf = TX.pFail(best.t, e.sp.save, u.spellDC), hg = best.score * (1 - pf);
      if (pf > 0.1 && pf < 0.75 && hg > 9) { best.score += hg - 7; best.meta = { name: 'heightened', target: best.t }; }
    }
  };

  // ------------------------------------------------------------------ the warlock: Dark One's Blessing (the Fiend, 1): a foe it drops gives it
  // CHA + its level in temporary HP (battle.js hurt, M.onKill)
  M.onKill = function (B, killer, u) {
    if (!killer || killer.subclass !== 'The Fiend' || !G.hostile(killer, u) || killer.hp <= 0) return;
    var n = Math.max(1, D.mod(killer.abil.cha) + killer.lvl);
    killer.temp = Math.max(killer.temp || 0, n); FX.sparkle(killer, 'fire', 14);
    B.card(['{r}' + Nm(B, killer) + '{/} drinks it in: {c}' + n + ' temporary HP{/} {g}(Dark One\'s Blessing){/}'], 240);
  };
  // ------------------------------------------------------------------ the paladin: the Oath of the Green Return (ours, 10-30 -- the leveling lane §8 D; RULED, Griz: "i'd say yes";
  // leveling-srd-by-class.md 2.2, "what falls, feeds"). Channel Divinity, GREEN AGAIN -- an action: one of its own at 0 HP within 30 ft that it can see stands with the paladin's
  // level in HP, and the paladin loses as many, which nothing reduces (offered only while that leaves it standing: the seat's call); WHAT FALLS, FEEDS -- the reaction as one it
  // can see drops within 30 ft: each friend within 10 ft of the fallen 1d6 + CHA (M.onKill, below). A player's paladin is ASKED, as every other reaction is (11-03, Griz on a
  // Pocket DM fight: "that paladin stuff auto-firing seemed weird" -- it had spent the only Channel Divinity six times unasked, and printed the roll, not the hp gained): the drop
  // comes inside a blow, in hurt() with no yield to ask from, so M.onKill only queues it (B.greenQ) and F.greenAsk puts the prompt once the blow, the cast or the command is
  // done (the seams for it are in js/battle.js: Battle.prototype.attack, .exec and the D.magic.cast wrapper call F.greenAsk). The AI's paladin (a
  // watch, the bench, a guest, an NPC) still takes it by a rule, but only when it is worth the Channel Divinity (F.greenWorth: the hp it would actually restore, not the hp
  // missing), and keeps the last use for GREEN AGAIN while one of its own is down; at 7 the AURA OF DEEP ROOTS -- it and friends within 10 ft (30 at 18) are not moved against
  // their will nor knocked prone (F.holdGround's guards: M.push and the knockdowns). Sacred Weapon, Turn the Unholy and the Aura of Devotion are Devotion's (RU.devoted)
  F.green = function (u, lvl) { return !!(u && u.cls === 'paladin' && u.subclass === 'the Oath of the Green Return' && u.lvl >= (lvl || 3)); };
  F.greenDown = function (B, u) { return B.units.filter(function (w) { return w !== u && w.side === u.side && !w.dead && !w.slain && !w.object && !w.familiar && w.hp <= 0 && G.dist(u, w) <= 30 && M.sees(B, u, w); }); };
  F.greenAgain = function* (B, u, t) {
    var n = u.lvl; u.turn.action = 0; u.feats.channel--;
    var gaR = D.spr.anim(u.sheet, 'greenagain'); if (gaR) { u.anim = 'greenagain'; u.animT = B.t; } // (a sheet's own Green Again row: the ground light rising, the sag on 6 -- Lymen's, art-wanted 59, 11-15)
    FX.ring(t, 'moss', 34); FX.sparkle(t, 'moss', 16); D.sfx('buff');
    B.heal(t, n); delete t.conds.prone;
    u.hp = Math.max(1, u.hp - n); FX.float('-' + n, u, D.PAL.ramps.moss[2]);
    B.card(['{y}' + Nm(B, u) + '{/}: {n}GREEN AGAIN{/} -- ' + nm(B, t) + ' stands with ' + t.hp + ' HP, and ' + u.name + ' gives ' + n + '.  {g}(Channel Divinity){/}'], 260);
    yield gaR ? Math.max(30, D.spr.duration(u.sheet, 'greenagain')) : 30;
  };
  F.deepRoots = function (B, w) {
    return !!(B && B.units && w && !w.dead && w.hp > 0 && B.units.some(function (p) { return F.green(p, 7) && p.side === w.side && G.standing(p) && RU.canAct(p) && G.dist(p, w) <= (p.lvl >= 18 ? 30 : 10); }));
  };
  // WHAT FALLS, FEEDS: can the paladin take it for the fallen u (the reaction and a Channel Divinity to spend, standing and able, within 30 ft, in sight)
  // FEED THEM: ASK or HOLD (RULED 2026-11-24, Griz: "Toggle the feed them as free action channel divinity ring"; his note of 11-22, "Discuss the notion of channel divinity toggle
  // for 'feed them' as a free action, which turns on/off the feed them popup" -- it asked about nine times in the gulch and he said NOT NOW to seven): a free entry under CHANNEL
  // DIVINITY on a player's Green Return paladin's ring (js/ui.js CHANNEL; F.commands 'feedthem', F.exec). ASK, the default, is the popup as it was; HOLD asks nothing when one falls
  // and keeps the reaction and the use. No auto-feed (his 11-03 "that paladin stuff auto-firing seemed weird", 89d3be97). Kept on the sheet's uses (feats.feedHold), which every
  // fight hands back and a rest leaves alone (js/rules.js R.refresh sets the counts only), so it holds across turns, fights and rests until he flips it
  F.feedHeld = function (p) { return !!(p && p.feats && p.feats.feedHold); };
  F.greenCan = function (B, p, u) { return F.green(p) && p.reaction > 0 && feat(p, 'channel') && G.standing(p) && RU.canAct(p) && G.dist(p, u) <= 30 && M.sees(B, p, u); };
  // who it would feed and by how much: each friend within 10 ft of the fallen that is hurt and can be healed, its hp gain at the lowest roll (1 + CHA) and the highest (6 + CHA)
  // -- both capped at what it is missing -- and the gain the roll is expected to give (the six faces, capped); `exp` and `hi` are the sums
  F.greenFeed = function (B, p, u) {
    var cm = Math.max(0, D.mod(p.abil.cha)), list = B.units.filter(function (w) { return w.side === p.side && G.standing(w) && !w.object && !w.slain && !w.conds.noHeal && w.hp < w.maxhp && G.dist(w, u) <= 10; }).map(function (w) {
      var miss = w.maxhp - w.hp, e = 0; for (var r = 1; r <= 6; r++) e += Math.min(miss, r + cm);
      return { w: w, lo: Math.min(miss, 1 + cm), hi: Math.min(miss, 6 + cm), exp: e / 6 };
    });
    return { cm: cm, list: list, exp: list.reduce(function (s, q) { return s + q.exp; }, 0), hi: list.reduce(function (s, q) { return s + q.hi; }, 0) };
  };
  // the AI's weighing (11-03, the seat's call): the hp it would actually restore, not the hp missing -- 8 or more expected, about two friends' worth of the roll; or 4 or more when
  // one of them is down to a quarter of its hit points (the heal that keeps it standing); and never the last use while one of its own is down (GREEN AGAIN's)
  F.greenWorth = function (B, p, feed) {
    if (p.feats.channel < 2 && F.greenDown(B, p).length) return false;
    var low = feed.list.some(function (q) { return q.w.hp * 4 <= q.w.maxhp; });
    return feed.exp >= 8 || (low && feed.exp >= 4);
  };
  // the heal itself: the reaction and the use spent, each friend's own roll, and the card says the hp each one gained (B.heal's return: capped at its maximum), not the roll
  F.greenGive = function (B, p, u, feed) {
    p.reaction = 0; p.feats.channel--;
    if (D.spr.anim(p.sheet, 'whatfallsfeeds')) { p.anim = 'whatfallsfeeds'; p.animT = B.t; } // (a sheet's own What Falls, Feeds row: the motes in the left hand -- Lymen's, art-wanted 59, 11-15)
    var got = [];
    feed.list.forEach(function (q) { var r = D.roll('1d6').total + feed.cm, n = B.heal(q.w, r); if (n > 0) got.push(nm(B, q.w) + ' +' + n); });
    FX.ring(u, 'moss', 30);
    B.card(['{y}' + Nm(B, p) + '{/}: {n}WHAT FALLS, FEEDS{/} -- ' + (got.length ? got.join(', ') : 'no one the better') + '.  {g}(the reaction and Channel Divinity){/}'], 260);
  };
  // a player's paladin is asked, once the blow, the cast or the command that dropped it is done (a drop seen in hurt() is only queued there)
  F.greenAsk = function* (B) {
    var q = B && B.greenQ; if (!q || !q.length) return;
    B.greenQ = [];
    for (var i = 0; i < q.length; i++) {
      var p = q[i].p, u = q[i].u;
      if (q[i].round !== B.round || !F.greenCan(B, p, u)) continue; // (a drop of an earlier round, or the reaction spent since, is not asked)
      var feed = F.greenFeed(B, p, u); if (!feed.list.length) continue;
      var lines = [Nm(B, u) + ' falls. Each friend within 10 ft of it regains 1d6' + (feed.cm ? ' + ' + feed.cm : '') + ':'];
      feed.list.slice(0, 5).forEach(function (r) { lines.push('  ' + Nm(B, r.w) + ' ' + r.w.hp + '/' + r.w.maxhp + ':  +' + (r.lo === r.hi ? r.hi : r.lo + ' to +' + r.hi)); });
      if (feed.list.length > 5) lines.push('  and ' + (feed.list.length - 5) + ' more');
      lines.push('(your reaction and a use of Channel Divinity: ' + p.feats.channel + ' left)');
      var down = p.feats.channel < 2 ? F.greenDown(B, p) : [];
      if (down.length) lines.push('{o}GREEN AGAIN needs a use: ' + nm(B, down[0]) + ' is down.{/}');
      var go = yield { prompt: { who: p, title: p.name + ': WHAT FALLS, FEEDS?', lines: lines, opts: [{ label: 'FEED THEM', value: true }, { label: 'NOT NOW', value: false }] } };
      if (!go) continue;
      F.greenGive(B, p, u, feed);
      yield 24;
    }
  };
  // (11-03: the ask has its seams in js/battle.js now -- `if (D.features && D.features.greenAsk) yield* D.features.greenAsk(this)` after the blow in Battle.prototype.attack, at the end of
  // .exec, and at the end of the D.magic.cast wrapper: the blow, the command and the spell that can drop a creature -- so it asks once, whoever queued it. F.greenHook used to lay the same ask
  // over those three from here, the first time a drop was queued; it is a no-op now, kept so a caller does not break)
  F.greenHook = function () { };
  var onKillG = M.onKill;
  M.onKill = function (B, killer, u) {
    onKillG.apply(this, arguments);
    if (!u || u.object || u.familiar) return;
    B.units.forEach(function (p) {
      if (!F.greenCan(B, p, u)) return;
      var feed = F.greenFeed(B, p, u); if (!feed.list.length) return;
      if (mine(p) && !p.ally) { if (F.feedHeld(p)) return; (B.greenQ = B.greenQ || []).push({ p: p, u: u, round: B.round }); return; } // (a player's: asked, below -- unless his FEED THEM is on HOLD: no ask, the reaction and the use kept, F.feedHeld)
      if (F.greenWorth(B, p, feed)) F.greenGive(B, p, u, feed);
    });
  };
  TX.ACTIONS.push(function (B, u, fs) {
    if (!F.green(u) || !feat(u, 'channel') || !u.turn.action || u.turn.attacksLeft || (u.side === 'party' && !u.guest) || u.hp <= u.lvl) return null;
    var t = F.greenDown(B, u).sort(function (a, b) { return (b.maxhp || 0) - (a.maxhp || 0); })[0];
    return t ? { kind: 'feature', why: 'Green Again', score: 40, go: function* () { yield* F.greenAgain(B, u, t); } } : null;
  });

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
    u.conds.raging = F.rageCond(u);
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
    if (!sv.ok && !(D.features && D.features.holdGround && D.features.holdGround(B, tgt, 'prone'))) tgt.conds.prone = true; // (HOLD GROUND, 10-30)
    yield 10;
  };
  // ANSWER BACK (6): raging, one who misses him in melee gets one blow back (the reaction) -- battle.js attack calls it on a miss
  // ONCE A RAGE (TRIMMED 11-25, Griz: "8 - The bar is weird. There's the thin SRD thinness vs what players with PHB/DMG are used to for subclasses. Answer Back seems a little strong,
  // the other two can sit as they are" -- the beefiness check's trim, the smallest reading: every round it was the Berserker's Retaliation, which the SRD gives at 14). Kept on the
  // rage's own condition, so a new rage -- FIRST BLOOD's too -- brings it back
  F.answerBack = function* (B, att, tgt, atk, melee) {
    if (!melee || atk.spell || !sub(tgt, 'Path of the Sand', 6) || !tgt.conds.raging || tgt.conds.raging.answered || tgt.reaction <= 0 || !RU.canAct(tgt) || att.dead || att.hp <= 0 || G.dist(tgt, att) > G.reachOf(tgt) || !tgt.weapon) return;
    tgt.reaction = 0; tgt.conds.raging.answered = true;
    B.card(['{r}' + Nm(B, tgt) + ' answers back!{/}  {g}(the reaction; once a rage){/}'], 200);
    yield* B.attack(tgt, att, tgt.weapon, { oa: true, answer: true }); // (a blow back, not an opportunity attack: Escape the Horde is not asked)
  };
  // ------------------------------------------------------------------ the Hunter's Prey (SRD 5.1, the Hunter's choice at 3; the leveling lane §8 item 10 -- 2026-11-20, Griz:
  // "pick two of the SRD unbuilt to add tonight"): the sheet's `prey` (js/classes.js NPC.OPTIONS.ranger) is 'colossus' (Colossus Slayer, in M.onWeaponHit above),
  // 'giantkiller' or 'hordebreaker'. Both are asked once an attack is wholly done (battle.js attack's last wrapper, F.preyAfter)
  F.prey = function (u, id) { return !!(u && u.cls === 'ranger' && u.subclass === 'Hunter' && u.lvl >= 3 && (u.prey || 'colossus') === id); };
  F.PREY_NAMES = { colossus: 'colossus slayer', giantkiller: 'giant killer', hordebreaker: 'horde breaker' };
  // GIANT KILLER: "When a Large or larger creature within 5 feet of you hits or misses you with an attack, you can use your reaction to attack that creature immediately
  // after its attack, provided that you can see the creature." A player's Hunter is asked; the AI's always answers. Its own weapon, as it stands (a bow at 5 ft shoots at
  // the disadvantage the grid gives any shot with a foe beside)
  F.giantKiller = function* (B, att, tgt) {
    if (!F.prey(tgt, 'giantkiller') || !att || att === tgt || att.dead || att.hp <= 0 || tgt.dead || tgt.hp <= 0 || tgt.reaction <= 0 || !RU.canAct(tgt) || !tgt.weapon) return;
    if (!((att.size || 1) >= 2) || !G.hostile(tgt, att) || G.dist(tgt, att) > 5 || !B.canHit(tgt, att) || !M.sees(B, tgt, att)) return;
    if (tgt.weapon.ammo && !B.ammoLeft(tgt)) return;
    if (mine(tgt)) {
      var go = yield { prompt: { who: tgt, title: tgt.name + ': GIANT KILLER?', lines: [Nm(B, att) + ' has swung at you. One attack back at it with the ' + tgt.weapon.name.toLowerCase() + ' (your reaction).'], opts: [{ label: 'STRIKE BACK', value: 1 }, { label: 'NOT THIS TIME', value: 0, no: true }] } };
      if (!go) return;
    }
    tgt.reaction = 0; if (tgt.weapon.ammo) B.spendAmmo(tgt);
    B.card(['{y}' + Nm(B, tgt) + '{/}: {o}GIANT KILLER{/}  {g}(the reaction: one attack back at ' + nm(B, att) + '){/}'], 200);
    yield* B.attack(tgt, att, tgt.weapon, { oa: true, answer: true }); // (as Answer Back's: a blow back, not an opportunity attack)
  };
  // HORDE BREAKER: "Once on each of your turns when you make a weapon attack, you can make another attack with the same weapon against a different creature that is within
  // 5 feet of the original target and within range of your weapon." A player's Hunter picks the one (NOT NOW keeps it for a later attack this turn); the AI's takes the one
  // with the fewest hit points. Not on a thrown weapon (the throw is gone with the first)
  F.hordeBreaker = function* (B, att, tgt, atk, o) {
    var T = att && att.turn;
    if (!F.prey(att, 'hordebreaker') || B.active !== att || !T || T.hordeDone || !tgt || !atk || atk.spell || o.oa || o.horde || att.dead || att.hp <= 0 || !RU.canAct(att)) return;
    if (B.thrownLeft(att, atk) !== Infinity) return;
    if (atk.ammo && !B.ammoLeft(att)) return;
    var list = B.units.filter(function (w) {
      if (w === tgt || w === att || w.dead || w.hp <= 0 || w.object || !G.hostile(att, w) || !G.standing(w) || RU.charmedBy(att, w) || G.dist(w, tgt) > 5 || !M.sees(B, att, w)) return false;
      return atk.ranged ? G.range(att, w) <= atk.range[1] && G.los(att, w).clear : G.dist(att, w) <= G.reachOf(att, atk.reach || null);
    });
    if (!list.length) return;
    var t2 = mine(att) ? yield* pickOne(B, att, 'HORDE BREAKER', list, 'One more attack with the ' + atk.name.toLowerCase() + ', at another beside ' + nm(B, tgt) + '. (once a turn)') : list.sort(function (a, b) { return a.hp - b.hp; })[0];
    if (!t2) return;
    T.hordeDone = true; if (atk.ammo) B.spendAmmo(att);
    B.card(['{y}' + Nm(B, att) + '{/}: {o}HORDE BREAKER{/}  {g}(one more attack, at ' + nm(B, t2) + '){/}'], 180);
    yield* B.attack(att, t2, atk, { horde: true });
  };
  F.preyAfter = function* (B, att, tgt, atk, o) {
    o = o || {};
    if (!o.answer) yield* F.giantKiller(B, att, tgt);
    yield* F.hordeBreaker(B, att, tgt, atk, o);
  };

  // ------------------------------------------------------------------ the Grey Road (GreyFang's; the ranger's archetype, 3; ours, 10-08): the pit-master's way --
  // guard the one beside you, give the ground you choose, answer from the bow. Griz, 10-08: "If we do not already have a subclass option for folks to choose, please
  // invent one based on this fellow"; "Turn it aside is good"; "Clear the ring as 'sweep the ring' attack up to 3 within 5 ft, DC15 dex save or prone"; Large or
  // smaller, "less the rules lawyers try to trip a dragon". The words: invented.json #the-grey-road. Rows: his sheet's parry, backstep, climb, volley, whirlwind.
  // PIT-WISE (3) is rules.js RU.riseCost (up for 5 ft) and grid.js stepCost (a climb costs no extra, Second-Story Work's way); the rest is here
  function meleeIn(w) { if (w.conds.disarmed) return null; return w.weapon && w.weapon.name && !w.weapon.ranged ? w.weapon : w.alt && w.alt.name && !w.alt.ranged ? w.alt : null; }
  function bowIn(w) { if (w.conds.disarmed) return null; return w.weapon && w.weapon.ranged && !w.weapon.thrown ? w.weapon : w.alt && w.alt.ranged && !w.alt.thrown ? w.alt : null; }
  function avgDice(s) { var m = /^(\d+)d(\d+)/.exec(String(s || '')); return m ? +m[1] * (+m[2] + 1) / 2 : 0; }
  // TURN IT ASIDE (3): a creature he can see attacks one within 5 ft of him while he holds a melee weapon -- his reaction adds his WIS (1 at least) to that
  // one's AC against it. battle.js attack asks after the roll, and only when the bonus turns the hit (as Parry and Shield are taken): { w, bonus } or null
  F.turnAside = function (B, att, tgt, atk, total, ac) {
    var best = null;
    B.units.forEach(function (w) {
      if (best || w === tgt || w === att || w.side !== tgt.side || !sub(w, 'the Grey Road', 3) || w.reaction <= 0 || !G.standing(w) || !RU.canAct(w)) return;
      if (G.dist(w, tgt) > 5 || !meleeIn(w) || !M.sees(B, w, att)) return;
      var bonus = Math.max(1, D.mod(w.abil.wis));
      if (total < ac + bonus) best = { w: w, bonus: bonus };
    });
    return best;
  };
  // GIVE GROUND (7): a foe steps within his reach -- his reaction takes him 5 ft away without provoking; out of its reach after it, his next bow shot at it
  // before his next turn ends has advantage (battle.js attack reads u.gaveGround). battle.js moveAlong asks it after every step. The AI's call (the seat's):
  // he gives ground only with a bow to answer from and no friend beside him to guard -- there the reaction is Turn It Aside's
  F.giveGround = function* (B, mover, from) {
    var ws = B.units.filter(function (w) { return w !== mover && G.hostile(w, mover) && sub(w, 'the Grey Road', 7) && w.reaction > 0 && G.standing(w) && RU.canAct(w) && !w.conds.prone && !w.conds.grappled && !w.conds.restrained && !(w.hang && G.hanging(w)) && RU.speedNow(w) > 0; });
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i], r = G.reachOf(w, (meleeIn(w) || {}).reach);
      if (!(G.dist(mover, w) <= r && G.dist(mover, w, from.x, from.y) > r) || !bowIn(w) || mover.dead || mover.hp <= 0) continue; // (this step brought it into his reach)
      if (B.units.some(function (a) { return a !== w && a.side === w.side && G.standing(a) && !a.familiar && G.dist(a, w) <= 5; })) continue;
      var mr = G.reachOf(mover), rm = G.reach(w, 5, { upright: true }), d0 = G.dist(w, mover), pick = null;
      Object.keys(rm).forEach(function (k) {
        var e = rm[k]; if (!e.stand || (e.x === w.x && e.y === w.y)) return;
        var d = G.dist(w, mover, e.x, e.y), sc = (d > mr ? 100 : 0) + d;
        if (d > d0 && (!pick || sc > pick.sc)) pick = { x: e.x, y: e.y, out: d > mr, sc: sc };
      });
      if (!pick) continue;
      w.reaction = 0; D.sfx('run');
      B.card(['{y}' + Nm(B, w) + '{/} gives ground!  {g}(the reaction: 5 ft back, no opening' + (pick.out ? '; the bow has the next shot at ' + nm(B, mover) : '') + '){/}'], 220);
      if (!w.turn) w.turn = { move: 0, action: 0, bonus: 0 };
      yield* B.moveAlong(w, [[pick.x, pick.y]], { noOA: true, gait: 'backstep', keepFacing: true, noGive: true });
      w.facing = D.spr.facingFor(mover.x - w.x, mover.y - w.y); w.anim = 'idle';
      if (pick.out) w.gaveGround = { on: mover.id, till: B.round + 1 };
    }
  };
  // THE 11TH (GreyFang's, past the class's 9 by name): the action, one of two (the class AI weighs them beside the Attack action: js/tactics.js TX.ACTIONS) --
  // SWEEP THE RING: a melee attack at each of up to three within 5 ft, and each one it hits, Large or smaller, makes a DC 15 DEX save or falls prone (his whirlwind row);
  // COVERING VOLLEY: up to three arrows, a ranged attack each at a different foe within 10 ft of a friend he can see; each one hit has disadvantage on its next attack
  // roll before his next turn (his volley row; battle.js attack reads conds.covered)
  F.SWEEP_DC = 15;
  var onWeaponHitGR = M.onWeaponHit;
  M.onWeaponHit = function* (B, att, tgt, atk, crit) {
    if (onWeaponHitGR) yield* onWeaponHitGR(B, att, tgt, atk, crit);
    if (atk.sweep && !tgt.dead && tgt.hp > 0 && !tgt.conds.prone && !tgt.noProne && !RU.immuneTo(tgt, 'prone') && (tgt.size || 1) <= 2) {
      var sv = RU.save(tgt, 'dex', F.SWEEP_DC);
      B.card(['  {o}swept{/}: ' + nm(B, tgt) + ' DEX ' + RU.saveText(sv) + ' vs DC ' + F.SWEEP_DC + '  ' + (sv.ok ? '{n}keeps its feet{/}' : '{o}PRONE{/}')], 200);
      if (!sv.ok && !(D.features && D.features.holdGround && D.features.holdGround(B, tgt, 'prone'))) tgt.conds.prone = true; // (HOLD GROUND, 10-30)
      yield 8;
    }
    if (atk.cover && !tgt.dead && tgt.hp > 0) { tgt.conds.covered = { by: att.id, till: { who: att.id, at: 'start', n: 1 } }; B.card(['  {c}covered{/}: ' + nm(B, tgt) + "'s next attack at disadvantage"], 160); }
  };
  if (TX && TX.ACTIONS) TX.ACTIONS.push(function (B, u, fs) {
    var T = u.turn;
    if (!sub(u, 'the Grey Road', 11) || !T || !T.action || T.attacksLeft) return null;
    var out = [], sw = meleeIn(u), bw = bowIn(u);
    var hitWorth = function (wp, t) { var e = RU.edges(u, t, wp); return TX.pHit(wp.atk + (e.pen || 0), RU.ac(t), e.net) * (avgDice(wp.dice) + (wp.mod || 0)); };
    if (sw) {
      var ring = fs.filter(function (t) { return G.standing(t) && G.dist(u, t) <= 5; }).sort(function (a, b) { return a.hp - b.hp; }).slice(0, 3);
      if (ring.length >= 2) {
        var ss = 0; ring.forEach(function (t) { var p = hitWorth(sw, t); ss += TX.worth(p, t) + ((t.size || 1) <= 2 && !t.conds.prone && !RU.immuneTo(t, 'prone') ? (p > 0 ? 0.6 : 0) * TX.pFail(t, 'dex', F.SWEEP_DC) * TX.dpr(t) * 0.4 : 0); });
        out.push({ kind: 'sweep', score: ss, why: 'sweeps the ring (' + ring.length + ')', go: function* () {
          T.action = 0; B.card(['{y}' + u.name + '{/}: SWEEP THE RING  {g}(a blow at each, up to three within 5 ft; DEX ' + F.SWEEP_DC + ' or down){/}'], 220);
          var a = Object.assign({}, sw, { row: 'whirlwind', sweep: true }), first = true;
          for (var i = 0; i < ring.length; i++) { var t = ring[i]; if (u.dead || u.hp <= 0 || !G.standing(t) || G.dist(u, t) > 5) continue; yield* B.attack(u, t, a, first ? {} : { ride: true }); first = false; }
          u.anim = 'idle';
        } });
      }
    }
    if (bw && !fs.some(function (t) { return G.standing(t) && G.dist(u, t) <= 5; })) { // (a bow beside a foe shoots at disadvantage: the volley is for the open)
      var best = null;
      B.units.forEach(function (a) {
        if (a === u || a.side !== u.side || !G.standing(a) || a.familiar || !M.sees(B, u, a)) return;
        var near = fs.filter(function (t) { return G.standing(t) && G.dist(a, t) <= 10 && G.range(u, t) <= bw.range[1] && G.los(u, t).clear && M.sees(B, u, t); }).sort(function (x, y) { return TX.dpr(y) - TX.dpr(x); }).slice(0, 3);
        if (near.length < 2) return;
        var vs = 0; near.forEach(function (t) { var p = hitWorth(bw, t); vs += TX.worth(p, t) + (p > 0 ? 0.6 : 0) * TX.dpr(t) * 0.25; });
        if (!best || vs > best.score) best = { score: vs, a: a, near: near };
      });
      if (best) out.push({ kind: 'volley', score: best.score, why: 'covers ' + best.a.name + ' (' + best.near.length + ' arrows)', go: function* () {
        T.action = 0; B.card(['{y}' + u.name + '{/}: COVERING VOLLEY  {g}(three arrows round ' + best.a.name + '; each one hit attacks at disadvantage){/}'], 220);
        var a = Object.assign({}, bw, { row: 'volley', cover: true }), first = true;
        for (var i = 0; i < best.near.length; i++) { var t = best.near[i]; if (u.dead || u.hp <= 0 || !G.standing(t)) continue; yield* B.attack(u, t, a, first ? {} : { ride: true }); first = false; }
        u.anim = 'idle';
      } });
    }
    return out.length ? out : null;
  });

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
  // (11-15, the lanes desk, on Griz's "that now then please": an illusion of the 1st level or more is read off the spell's own record
  // (content/spells.json: school and level, as DS.DATA.spells carries it) in place of a hand list that named three spells the game
  // doesn't have -- silent image, major image, disguise self -- and left out Fear and Weird; Color Spray is the 1st-level one he meant)
  function illusion1(id) { var s = window.DS && DS.DATA && DS.DATA.spells && DS.DATA.spells[id]; return !!s && s.school === 'illusion' && (s.level || 0) >= 1; }
  var cast1 = M.cast;
  M.cast = function (B, u, id) {
    var g = cast1.apply(this, arguments);
    if (!sub(u, 'the Rimeglass', 6) || !illusion1(id)) return g;
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
        var x0 = u.x, y0 = u.y; u.x = best[0]; u.y = best[1]; u.tween = { fx: x0, fy: y0, fz: G.gzAt(u, x0, y0), t: 0, dur: B.pace(8, true) }; // (an AI-run caster's step through the rime keeps to its wait below: Battle.prototype.pace)
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
    B.cardCut(lines, 8, 360); yield 24;
  };
  // WAKEFUL (6): magic cannot put him, or one of his within 10 ft, to sleep (magic.js Sleep asks)
  M.wakeful = function (B, w) { return B.units.some(function (k) { return sub(k, 'the Vigil', 6) && k.side === w.side && G.standing(k) && G.dist(k, w) <= 10; }); };

  // ------------------------------------------------------------------ the Pact of the Fae King (ours, the warlock's patron, 1; 11-25 -- the leveling lane, Griz: "Build the pact";
  // his name, "lane 'Pact of the Fae King' that most recent draft"; invented.json #pact-of-the-fae-king): Tronupholen's, the Trickster in the glass -- he shows, never speaks. Cut to
  // the SRD Fiend's weight. GLAMOUR (1) is the sheet's alone (Disguise Self is not on the grid); HE SHOWS, NEVER SPEAKS (10) is js/classes.js NPC.unit's (no charm). Here: GONE FROM
  // SIGHT (6) and THE PASTIME (14). The lines name the warlock, never a pronoun: a made one may be anyone
  var FAE = 'the Pact of the Fae King';
  function unitById(B, id) { return B.units.filter(function (w) { return w.id === id; })[0] || null; }
  // GONE FROM SIGHT (6; once a short rest): hit, the reaction makes the warlock invisible until the start of the warlock's next turn (the Sprite's Invisibility, the Green Hag's
  // Invisible Passage; no teleport). Asked before Hellish Rebuke (battle.js attack): one reaction, and the AI's is to go unseen when the blow leaves it at half or less, else to answer
  F.goneFromSight = function* (B, u, att) {
    if (!sub(u, FAE, 6) || !feat(u, 'goneFromSight') || !u.reaction || u.dead || u.hp <= 0 || !RU.canAct(u) || (u.conds.invisible && !u.conds.invisible.ends) || u.conds.banished) return;
    var auto = u.side !== 'party' || u.guest;
    if (auto && u.hp > u.maxhp / 2) return;
    var yes = auto ? true : yield { prompt: { who: u, title: u.name + ': GONE FROM SIGHT?', lines: [Nm(B, att) + ' hit you. The glass takes you from sight till your turn begins: blows at you at disadvantage, yours at advantage. (the reaction; once a short rest)'], opts: [{ label: 'GO UNSEEN', value: true }, { label: 'STAY', value: false }] } };
    if (!yes) return;
    u.reaction = 0; u.feats.goneFromSight--; delete u.conds.hidden;
    u.conds.invisible = { by: u.id, fae: true, till: { who: u.id, at: 'start', n: 1 }, endText: '{who} steps back out of the glass.' }; // (no `ends`: it lasts its turn's length whatever -- battle.js endInvis)
    D.sfx('magic'); FX.sparkle(u, 'violet', 20); FX.ring(u, 'violet', 26);
    B.card(['{p}' + Nm(B, u) + ': GONE FROM SIGHT{/} -- the glass takes ' + nm(B, u) + ' from sight  {g}(invisible till ' + nm(B, u) + '\'s next turn; the reaction, a short rest){/}'], 260);
    yield 16;
  };
  // THE PASTIME (14; once a long rest): a creature the warlock hits, or one that fails a save against the warlock's spell, is drawn into the glass until the end of the warlock's
  // next turn (the banished's own handling -- no turn, not on the field), takes 10d10 psychic (the Fiend's Hurl Through Hell's size), and comes back to a square the warlock picks
  // within 30 ft of where it stood. The AI draws a foe of 30 HP or more, or the strongest standing; the player's warlock is asked. The square: the one within 30 ft farthest from
  // the warlock's own side (the player's too -- the seat's call, no square-picking by hand yet). A keeper fallen or gone before then: the glass lets go at the drawn one's turn
  F.pastimeWants = function (B, u, t) {
    if (!sub(u, FAE, 14) || !feat(u, 'pastime') || !t || t === u || t.dead || t.hp <= 0 || t.object || t.conds.banished || t.ethereal || !G.hostile(u, t)) return false;
    var top = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && !w.object; }).reduce(function (m, w) { return Math.max(m, w.hp); }, 0);
    return t.hp >= 30 || (t.hp >= top && t.hp >= 12);
  };
  F.pastime = function* (B, u, t, how) {
    if (!sub(u, FAE, 14) || !feat(u, 'pastime') || !t || t === u || t.dead || t.hp <= 0 || t.object || t.conds.banished || t.ethereal || !G.hostile(u, t) || u.dead || u.hp <= 0) return false;
    var auto = u.side !== 'party' || u.guest;
    if (auto && !F.pastimeWants(B, u, t)) return false;
    var yes = auto ? true : yield { prompt: { who: u, title: u.name + ': THE PASTIME?', lines: [(how === 'save' ? Nm(B, t) + ' failed the save.' : 'You hit ' + nm(B, t) + '.') + ' Draw it into the glass till the end of your next turn: 10d10 psychic, and back within 30 ft where you put it. (once a long rest)'], opts: [{ label: 'INTO THE GLASS', value: true }, { label: 'NOT NOW', value: false }] } };
    if (!yes) return false;
    u.feats.pastime--;
    var c = { by: u.id, x: t.x, y: t.y, glass: true, till: { who: u.id, at: 'end', n: B.active === u ? 2 : 1 } }; // (drawn on the warlock's own turn: that turn's end is not "the next")
    c.onEnd = function (w) { F.pastimeBack(D.battle || B, unitById(D.battle || B, c.by), w, c); };
    t.conds.banished = c; t.ethereal = true;
    D.sfx('magic'); FX.sparkle(t, 'violet', 30); FX.ring(t, 'violet', 40);
    B.card(['{p}' + Nm(B, u) + ': THE PASTIME{/} -- ' + nm(B, t) + ' is drawn into the glass  {g}(till the end of ' + nm(B, u) + '\'s next turn; a long rest){/}'], 300);
    yield 24;
    return true;
  };
  // back out of the glass: the square (within 30 ft of where it stood, as far from the keeper's side as it can be), then the 10d10
  F.pastimeBack = function (B, k, w, c) {
    if (!B || !w || w.dead) return;
    delete w.conds.banished; w.ethereal = false;
    var x0 = c.x, y0 = c.y, best = null, mine = k ? B.units.filter(function (o) { return o !== w && o.side === k.side && G.standing(o); }) : [];
    for (var y = y0 - 6; y <= y0 + 6; y++) for (var x = x0 - 6; x <= x0 + 6; x++) {
      if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h || !G.canStand(w, x, y)) continue;
      var far = mine.length ? mine.reduce(function (m, o) { return Math.min(m, Math.max(Math.abs(o.x - x), Math.abs(o.y - y))); }, 99) : 0, near = Math.max(Math.abs(x - x0), Math.abs(y - y0));
      var sc = far * 10 - near; if (!best || sc > best.sc) best = { sc: sc, x: x, y: y };
    }
    if (best) { w.x = best.x; w.y = best.y; }
    var r = D.roll('10d10');
    FX.sparkle(w, 'violet', 24);
    B.card(['{p}' + Nm(B, w) + ' is put back out of the glass' + (best ? ' ' + Math.max(Math.abs(w.x - x0), Math.abs(w.y - y0)) * 5 + ' ft from where it stood' : '') + '{/}: the Pastime  10d10 ' + RU.fmtRolls(r.rolls) + ' = {r}' + r.total + '{/} psychic'], 300);
    B.hurt(w, r.total, 'psychic', { magic: true });
  };
  // the glass lets go of one whose keeper is down or gone, at its own turn's start
  var onStartFae = M.onStart;
  M.onStart = function (B, u) {
    var c = u && u.conds && u.conds.banished;
    if (B && c && c.glass) { var k = unitById(B, c.by); if (!k || k.dead || k.hp <= 0) F.pastimeBack(B, k, u, c); }
    return onStartFae.apply(this, arguments);
  };
  // a failed save against the warlock's spell (js/grimoire.js saveAll): the first one that failed that THE PASTIME would take
  F.pastimeSave = function* (B, u, failed) {
    if (!u || !sub(u, FAE, 14) || !feat(u, 'pastime')) return;
    for (var i = 0; i < failed.length; i++) { if (yield* F.pastime(B, u, failed[i], 'save')) return; }
  };

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
    B.hurt(tgt, r.total, ty, { blow: tgt.blowIn }); // (the weapon's blow: one concentration save, battle.js blowEnd)
    yield 8;
  };

  // the class line of the party panel (js/ui.js), for the features past the four heroes': short, since the row is only so wide
  F.classLine = function (u) {
    var f = u.feats || {}, out = [];
    if (u.cls === 'monk' && u.lvl >= 2) out.push('ki ' + (f.ki || 0) + ', patient defense, step of the wind' + (u.lvl >= 7 ? ', evasion' : ''));
    if (F.unholy(u)) out.push('turn the unholy');
    if (u.cls === 'bard' && u.lvl >= 6) out.push('countercharm');
    if (u.cls === 'sorcerer' && u.metamagic && u.metamagic.length) out.push((f.sorcery || 0) + ' pts: ' + u.metamagic.join(', '));
    if (u.cls === 'warlock' && u.pact) out.push('pact of the ' + u.pact);
    if (u.subclass === 'The Fiend' && u.lvl >= 6) out.push('dark luck ' + (f.darkLuck ? 'ready' : 'spent'));
    if (u.subclass === 'the Pact of the Fae King' && u.lvl >= 6) out.push('gone from sight ' + (f.goneFromSight ? 'ready' : 'spent') + (u.lvl >= 14 ? ', the pastime ' + (f.pastime ? 'ready' : 'spent') : '')); // (ours, 11-25)
    if (u.cls === 'barbarian' && u.subclass === 'Path of the Berserker' && u.lvl >= 6) out.push('mindless rage');
    if (u.prey && u.prey !== 'colossus') out.push(F.PREY_NAMES[u.prey] || ''); // (the Hunter's Prey when it is not the Colossus Slayer every Hunter had: 11-20)
    if (u.hunterDef) out.push({ horde: 'escape the horde', multiattack: 'multiattack defense', steelwill: 'steel will' }[u.hunterDef] || '');
    if (u.cls === 'rogue' && u.subclass === 'Thief' && u.lvl >= 9) out.push('supreme sneak');
    if (u.style && window.DS.R.STYLES[u.style]) out.push(window.DS.R.STYLES[u.style].short); // (the fighting style, 10-06: the Pocket DM's picked ones)
    return out.filter(Boolean).join(', ');
  };

  // ------------------------------------------------------------------ the player's buttons (09-29, Griz running our four on the tester
  // ladder, ?ladder&party=ours&play: "AI now, buttons later" -- now). What the AI above does for itself, on the ring's SKILLS for one the
  // player runs: battle.js commands() lists F.commands, battle.js exec hands their ids to F.exec. One that goes to a single creature asks
  // which by a prompt of those it may go to (the play record keeps the answer: js/record.js)
  function mine(u) { return u.side === 'party' && !u.guest; }
  function chan(u) { return feat(u, 'channel'); }
  var CHAN_WHY = 'Channel Divinity is spent (a short rest brings it back)';
  // ------------------------------------------------------------------ the fighter: the Drillyard (ours, 10-30 -- the leveling lane; RULED, Griz: "take leveling's leans
  // and it can start building"; leveling-srd-by-class.md 6.1): set plays, each a fixed effect bought with an opening -- two a short rest (three at 7: feats.openings), one
  // play a turn (turn.playDone). The plays it knows are the sheet's `plays` (js/classes.js NPC.OPTIONS.fighter). On a weapon hit: WHEEL (it and a friend within 5 ft trade
  // places, no opportunity attacks), BIND (no reactions till its next turn), BREAK STRIDE (10 ft less speed through its next turn: rules.js RU.speedNow), PIN THE SHIELD
  // (its shield's +2 off its AC till the fighter's next turn: RU.ac). CALL THE MARK, a bonus action: each friend's first hit on one creature +2 till the fighter's next turn
  // (battle.js). HOLD GROUND, the reaction to a push or a knockdown, spends itself (F.holdGround: no prompt -- the push is not a turn's)
  F.drill = function (u) { return !!(u && u.cls === 'fighter' && u.subclass === 'the Drillyard' && u.lvl >= 3); };
  F.knowsPlay = function (u, id) { return F.drill(u) && (u.plays || []).indexOf(id) >= 0; };
  F.bearsShield = function (u) { return !!(u && ((u.src && u.src.equip && u.src.equip.shield) || (u.kind && D.FOES && D.FOES[u.kind] && D.FOES[u.kind].shield))); };
  function canPlay(u) { return F.drill(u) && feat(u, 'openings') && u.turn && !u.turn.playDone; }
  function spendPlay(u) { u.feats.openings--; u.turn.playDone = true; }
  var onWeaponHit3 = M.onWeaponHit;
  M.onWeaponHit = function* (B, att, tgt, atk, crit) {
    if (onWeaponHit3) yield* onWeaponHit3(B, att, tgt, atk, crit);
    if (!canPlay(att) || B.active !== att || !tgt || tgt.dead || tgt.hp <= 0 || atk.spell || tgt.side === att.side) return;
    var friends = B.units.filter(function (w) { return w !== att && w.side === att.side && !w.dead && w.hp > 0 && !w.object && !w.riding && G.dist(w, att) <= 5 && !(G.aloft && (G.aloft(w) || G.aloft(att))); });
    var opts = [];
    if (F.knowsPlay(att, 'pinshield') && F.bearsShield(tgt) && !tgt.conds.shieldPinned) opts.push({ label: 'PIN THE SHIELD: its shield off its AC', value: 'pinshield' });
    // (BIND takes a reaction the creature could take: not offered on one that cannot react now -- paralyzed, stunned, surprised, incapacitated, petrified (RU.canAct), 11-03, the desk's read of his
    // record where the AI spent it on a hobgoblin it had hit asleep. That one was AWAKE by then -- battle.js hurt() wakes a sleeper on the damage, before this runs -- so its reaction was a real one
    // and the play stood; only a target the blow leaves unable to react is cut)
    if (F.knowsPlay(att, 'bind') && tgt.reaction > 0 && RU.canAct(tgt)) opts.push({ label: 'BIND: no reactions till its turn', value: 'bind' });
    if (F.knowsPlay(att, 'breakstride') && !tgt.conds.stride) opts.push({ label: 'BREAK STRIDE: 10 ft less speed', value: 'breakstride' });
    // THE LEDGER'S PLAYS (2026-11-25, the seat snoot-1125 -- RULED, Griz: "Ledger:  Drilyard plays:  with 'spook' instead of 'cow"; the leveling lane's 11-25 ~16:35Z section):
    // TAKE THE LEGS, a STR save or prone (Large or smaller -- a shove's own reach, SRD 5.1: the seat's, his to overrule); SPOOK, a WIS save or frightened of the fighter till the
    // end of its next turn. The DC 8 + proficiency + STR (F.playDC)
    if (F.knowsPlay(att, 'takelegs') && F.legsTakeable(tgt)) opts.push({ label: 'TAKE THE LEGS: a STR save or prone', value: 'takelegs' });
    if (F.knowsPlay(att, 'spook') && !RU.immuneTo(tgt, 'frightened') && !(tgt.conds.frightened && tgt.conds.frightened.by === att.id)) opts.push({ label: 'SPOOK: a WIS save or frightened', value: 'spook' });
    var pick;
    if (!mine(att)) { if (!opts.length) return; pick = opts[0].value; // (the class AI: the first that bears on the fight -- a pinned shield, a bind, a broken stride. WHEEL left for the feat Soldiering, 11-20: F.wheel)
      // (TAKE THE LEGS or SPOOK, both open: the one whose save the creature is the weaker at -- STR or WIS, a tie the legs; the seat's, 11-25: first-listed alone, SPOOK came only
      // on a creature already down, none in six watched fights)
      if (pick === 'takelegs' && opts.some(function (o) { return o.value === 'spook'; }) && F.saveOf(tgt, 'wis') < F.saveOf(tgt, 'str')) pick = 'spook'; }
    else {
      // A CHOSEN MOVE, NOT A HIT'S QUESTION (RULED 2026-11-20, Griz: "Rather than a hit reaction, a chosen move?", then "3 - agreed"): the player readies the play on the ring's
      // PLAYS before the swing (F.readyPlay, below), and the hit carries it out with no prompt; a miss keeps it readied for the turn's next swing, and the opening is spent only on
      // the hit. A readied play that has nothing in this hit (BIND on one that cannot react, PIN THE SHIELD on one with no shield) stays readied and says so
      var arm = att.turn.armPlay; if (!arm) return;
      if (!opts.some(function (o) { return o.value === arm; })) { B.card(['  {g}' + PLAY_WORD[arm] + ' readied: nothing in it on ' + D.Battle.nm(tgt) + ' -- kept for the next hit{/}'], 160); return; }
      pick = arm; delete att.turn.armPlay;
    }
    if (!pick) return;
    spendPlay(att); D.sfx('confirm');
    if (pick === 'pinshield') { tgt.conds.shieldPinned = { by: att.id }; B.card(['  {y}PIN THE SHIELD{/}: ' + D.Battle.nm(tgt) + '\'s shield is pinned  {g}(-2 AC till ' + att.name + '\'s next turn){/}'], 220); }
    else if (pick === 'bind') { tgt.reaction = 0; B.card(['  {y}BIND{/}: ' + D.Battle.nm(tgt) + ' is bound up  {g}(no reactions till its next turn){/}'], 220); }
    else if (pick === 'breakstride') { tgt.conds.stride = { by: att.id }; B.card(['  {y}BREAK STRIDE{/}: ' + D.Battle.nm(tgt) + ' is slowed  {g}(10 ft less speed through its next turn){/}'], 220); }
    else if (pick === 'takelegs') {
      var dcL = F.playDC(att), svL = RU.save(tgt, 'str', dcL);
      B.card(['  {y}TAKE THE LEGS{/}: ' + D.Battle.nm(tgt) + ' STR ' + RU.saveText(svL) + ' vs DC ' + dcL + '  ' + (svL.ok ? '{n}keeps its feet{/}' : '{o}PRONE{/}')], 240);
      if (!svL.ok && !(F.holdGround && F.holdGround(B, tgt, 'prone'))) tgt.conds.prone = true; // (HOLD GROUND, 10-30)
    }
    else if (pick === 'spook') {
      var dcS = F.playDC(att), svS = RU.save(tgt, 'wis', dcS, false, 'frightened');
      B.card(['  {y}SPOOK{/}: ' + D.Battle.nm(tgt) + ' WIS ' + RU.saveText(svS) + ' vs DC ' + dcS + '  ' + (svS.ok ? '{n}holds its nerve{/}' : '{o}FRIGHTENED{/}  {g}(of ' + att.name + ', till the end of ' + att.name + '\'s next turn){/}')], 240);
      // (till the end of the fighter's next turn: `fresh` for the AI's turn-end sweep, js/ai.js AI.turn -- kept one turn-end, gone the next -- and `till` for a player's fighter,
      // whose turns that sweep never ends: the end of this turn and then of the next, grimoire.js)
      if (!svS.ok) tgt.conds.frightened = { by: att.id, fresh: true, till: { who: att.id, at: 'end', n: B.active === att ? 2 : 1 }, endText: '{who} gets a grip on itself.' };
    }
    yield 12;
  };
  // the save DC of a play that asks one (the Ledger's, 11-25): 8 + proficiency + STR -- 13 for the Ledger, his page's
  F.playDC = function (u) { return 8 + (u.prof || 2) + D.mod((u.abil || {}).str || 10); };
  // a creature's save bonus at an ability, as RU.save reads it before its auras and conditions
  F.saveOf = function (t, ab) { return t.saves && t.saves[ab] != null ? t.saves[ab] : D.mod((t.abil || {})[ab] || 10); };
  // TAKE THE LEGS finds legs to take: standing, not proof against prone, Large or smaller
  F.legsTakeable = function (t) { return !!t && !t.dead && t.hp > 0 && !t.conds.prone && !t.noProne && !RU.immuneTo(t, 'prone') && (t.size || 1) <= 2; };
  var PLAY_WORD = { pinshield: 'PIN THE SHIELD', bind: 'BIND', breakstride: 'BREAK STRIDE', takelegs: 'TAKE THE LEGS', spook: 'SPOOK' };
  var PLAY_NOTE = { pinshield: 'on your next hit, its shield\'s +2 off its AC till your next turn', bind: 'on your next hit, it takes no reactions till its next turn', breakstride: 'on your next hit, 10 ft less speed through its next turn',
    takelegs: 'on your next hit, a STR save or it falls prone', spook: 'on your next hit, a WIS save or it is frightened of you till the end of your next turn' };
  F.PLAY_WORD = PLAY_WORD;
  // STRIKE BACK (the Ledger's third, 11-25, his ruling as above): a play and the reaction -- a creature that misses the fighter in melee takes one weapon attack back. On Answer Back's
  // hook (battle.js attack calls F.answerBack on a miss): Answer Back first, and a reaction it spent is spent. No once-a-turn: it is the foe's turn (as HOLD GROUND). A player's fighter
  // is asked (an opening is spent); the AI's always strikes back while it has one
  var answerBack0 = F.answerBack;
  F.answerBack = function* (B, att, tgt, atk, melee) {
    if (answerBack0) yield* answerBack0.apply(this, arguments);
    if (!melee || !atk || atk.spell || !F.knowsPlay(tgt, 'strikeback') || !feat(tgt, 'openings') || !(tgt.reaction > 0) || !RU.canAct(tgt) || tgt.dead || tgt.hp <= 0) return;
    if (!att || att === tgt || att.dead || att.hp <= 0 || !G.hostile(tgt, att) || !tgt.weapon || tgt.weapon.ranged || G.dist(tgt, att) > G.reachOf(tgt)) return;
    if (mine(tgt)) {
      var go = yield { prompt: { who: tgt, title: tgt.name + ': STRIKE BACK?', lines: [Nm(B, att) + ' has missed you. One attack back with the ' + tgt.weapon.name.toLowerCase() + ' (your reaction and an opening; ' + tgt.feats.openings + ' left).'], opts: [{ label: 'STRIKE BACK', value: 1 }, { label: 'NOT THIS TIME', value: 0, no: true }] } };
      if (!go) return;
    }
    tgt.reaction = 0; tgt.feats.openings--; D.sfx('confirm');
    B.card(['{y}' + Nm(B, tgt) + '{/}: {o}STRIKE BACK{/}  {g}(the reaction and an opening: one attack back at ' + nm(B, att) + '){/}'], 200);
    yield* B.attack(tgt, att, tgt.weapon, { oa: true, answer: true }); // (as Answer Back's: a blow back, not an opportunity attack)
  };
  // readying a play (the player's, on the ring's PLAYS): picked again, it is set down. Free -- the opening goes on the hit
  F.readyPlay = function (B, u, id) {
    if (u.turn.armPlay === id) { delete u.turn.armPlay; B.card(['{g}' + u.name + ' sets down ' + PLAY_WORD[id] + '.{/}'], 140); return; }
    u.turn.armPlay = id; D.sfx('confirm');
    B.card(['{y}' + u.name + '{/} readies {y}' + PLAY_WORD[id] + '{/}  {g}(' + PLAY_NOTE[id] + '; an opening, spent on the hit -- a miss keeps it readied){/}'], 200);
  };
  // ------------------------------------------------------------------ the feat Soldiering (ours -- js/rules.js R.FEATS.soldiering; the leveling lane's 2026-11-20 sections, the
  // formation training: RULED, Griz: "1 one feat", "1 wheel leaves", "2 - trained only, they'll have to use a feat slot if they want to do it with the party, but should work with
  // NPCs that have it"; his principle, "properly balanced compared to the feats offered in the 2014 PHB/DMG"). TRAINED: a hero by the feat (and STR 13, as the other feats read
  // theirs); a monster or an NPC by a trait on its block (`soldiering: true` in D.FOES) or on the unit itself (u.soldiering: a fight's roster, a bench)
  F.soldiering = function (u) {
    if (!u || u.dead || u.object) return false;
    if (u.soldiering || (u.kind && D.FOES && D.FOES[u.kind] && D.FOES[u.kind].soldiering)) return true;
    var h = u.src; return !!(h && window.DS.R.hasFeat(h, 'soldiering') && (u.abil || h.abil).str >= 13);
  };
  // WHEEL: on its own weapon hit on its own turn (not a spell, a foe), the trained one and a trained friend within 5 ft who has a reaction trade places; the friend's reaction
  // is spent; no opportunity attacks; no openings, no once-a-turn. A player's friend is asked and may refuse; an AI friend agrees. A player's hitter is asked first (the hit
  // is its turn's); the AI's hitter wheels by F.wheelWant (the formation's AI, below). The friends: as the Drillyard's were -- standing, not aloft, not riding, no object
  F.wheelFriends = function (B, att) {
    return B.units.filter(function (w) { return w !== att && w.side === att.side && !w.dead && w.hp > 0 && !w.object && !w.riding && F.soldiering(w) && w.reaction > 0 && RU.canAct(w) && G.dist(w, att) <= 5 && !(G.aloft && (G.aloft(w) || G.aloft(att))); });
  };
  F.wheelWant = function (B, att, friends) { return null; };
  // where w stands from u, in words: the eight ways on the map, and BEHIND / IN FRONT for a set member's own front
  F.whereFrom = function (u, w) {
    var dx = Math.sign(w.x - u.x), dy = Math.sign(w.y - u.y), word = { '0,-1': 'north', '0,1': 'south', '1,0': 'east', '-1,0': 'west', '1,-1': 'north-east', '-1,-1': 'north-west', '1,1': 'south-east', '-1,1': 'south-west' }[dx + ',' + dy] || 'here';
    var fc = u.conds && u.conds.wall && u.conds.wall.face;
    if (fc && dx === fc[0] && dy === fc[1]) word += ', in front';
    else if (fc && dx === -fc[0] && dy === -fc[1]) word += ', behind';
    return word.toUpperCase();
  }; // (the AI's: none till the formation's AI is built -- set below it)
  F.wheel = function (B, a, f) {
    var ax = a.x, ay = a.y; a.x = f.x; a.y = f.y; f.x = ax; f.y = ay; f.reaction = 0; D.sfx('confirm');
    if (G.setup && B.map) G.setup(B.map, B.units);
    B.card(['  {y}WHEEL{/}: ' + a.name + ' and ' + f.name + ' trade places  {g}(' + f.name + '\'s reaction; no opportunity attacks){/}'], 220);
  };
  var onWeaponHitW = M.onWeaponHit;
  M.onWeaponHit = function* (B, att, tgt, atk, crit) {
    if (onWeaponHitW) yield* onWeaponHitW(B, att, tgt, atk, crit);
    if (!F.soldiering(att) || B.active !== att || att.dead || att.hp <= 0 || !tgt || atk.spell || tgt.side === att.side || !RU.canAct(att)) return;
    var friends = F.wheelFriends(B, att);
    var f = null;
    if (mine(att)) {
      // A CHOSEN MOVE (RULED 2026-11-20, Griz: "Rather than a hit reaction, a chosen move?", then "3 - agreed"): the friend is picked when WHEEL is readied on the ring's PLAYS
      // (F.readyWheel, below -- on the floor, as his "it wasn't clear which ally I'd wheel-with" asked), and the hit makes the trade with no prompt; a miss keeps it readied.
      // The friend no longer beside, or its reaction gone: kept, and said
      var aw = att.turn.armWheel; if (!aw) return;
      if (friends.indexOf(aw) < 0) { B.card(['  {g}WHEEL readied with ' + aw.name + ', who is ' + (aw.dead || aw.hp <= 0 ? 'down' : !(aw.reaction > 0) ? 'out of reactions' : 'not beside you') + ' -- kept for the next hit{/}'], 160); return; }
      f = aw; delete att.turn.armWheel;
    } else { if (!friends.length) return; f = F.wheelWant(B, att, friends); }
    if (!f) return;
    if (mine(f) && !mine(att)) { // (the player's friend asked, and may refuse -- the hitter lit on the floor, a click on it the yes)
      var yes = yield { prompt: { who: f, title: f.name + ': WHEEL WITH ' + att.name.toUpperCase() + '?', lines: [att.name + ', ' + F.whereFrom(f, att) + ', calls the wheel: trade places (your reaction; no opportunity attacks).'], opts: [{ label: 'WHEEL WITH ' + att.name.toUpperCase(), value: 1 }, { label: 'REFUSE', value: 0, no: true }], pick: [att] } };
      if (!yes) return;
    }
    F.wheel(B, att, f); yield 12;
  };
  // readying WHEEL (the player's, on the ring's PLAYS): which friend, on the floor -- each trained friend beside with its reaction lit, named with where it stands (NORTH,
  // BEHIND...); STAY readies nothing. Readied already: picked again, it is set down
  F.readyWheel = function* (B, u) {
    if (u.turn.armWheel) { B.card(['{g}' + u.name + ' sets down the WHEEL with ' + u.turn.armWheel.name + '.{/}'], 140); delete u.turn.armWheel; return; }
    var friends = F.wheelFriends(B, u); if (!friends.length) return;
    var wv = yield { prompt: { who: u, title: u.name + ': WHEEL WITH WHOM?', lines: ['On your next hit, trade places with a trained friend beside you, lit on the floor (its reaction; no opportunity attacks).'],
      opts: friends.map(function (w, i) { return { label: Nm(B, w).toUpperCase() + ' -- ' + F.whereFrom(u, w), value: i + 1 }; }).concat([{ label: 'STAY', value: 0, no: true }]), pick: friends } };
    var f = wv ? friends[wv - 1] : null; if (!f) return;
    u.turn.armWheel = f; D.sfx('confirm');
    B.card(['{y}' + u.name + '{/} readies the {y}WHEEL{/} with ' + f.name + ' (' + F.whereFrom(u, f).toLowerCase() + ')  {g}(on the next hit the two trade places -- ' + f.name + '\'s reaction; a miss keeps it readied){/}'], 200);
  };
  // the ring's PLAYS (RULED 2026-11-20 with the chosen move -- his question, "doe plays get their own tab like channel divinity or something?": yes, a tab of their own, as
  // CHANNEL DIVINITY is; js/ui.js PLAYS): the Drillyard's on-hit plays it knows, CALL THE MARK (its bonus-action play), and Soldiering's WHEEL. Each readied one reads READIED
  F.playCommands = function (B, u) {
    var T = u.turn, out = [], swing = T.action > 0 || T.attacksLeft > 0;
    if (F.drill(u)) ['pinshield', 'bind', 'breakstride', 'takelegs', 'spook'].forEach(function (id) { // (TAKE THE LEGS and SPOOK, the Ledger's, 11-25)
      if (!F.knowsPlay(u, id)) return;
      var on = T.armPlay === id;
      out.push({ id: 'play_' + id, label: PLAY_WORD[id] + (on ? ' (READIED)' : ''), cost: 'F', icon: 'attack', skill: true, ok: on || (canPlay(u) && swing),
        why: !feat(u, 'openings') ? 'no openings left (a short rest)' : T.playDone ? 'a play this turn already' : 'no swing left this turn', note: on ? 'readied: pick it again to set it down' : PLAY_NOTE[id] + '; ' + ((u.feats && u.feats.openings) || 0) + ' openings left' });
    });
    if (F.soldiering(u)) {
      var aw = T.armWheel, fr = F.wheelFriends(B, u);
      out.push({ id: 'play_wheel', label: aw ? 'WHEEL WITH ' + aw.name.toUpperCase() + ' (READIED)' : 'WHEEL', cost: 'F', icon: 'attack', skill: true, ok: !!aw || (swing && fr.length > 0),
        why: !swing ? 'no swing left this turn' : 'no trained friend beside you with its reaction', note: aw ? 'readied: pick it again to set it down' : 'on your next hit, trade places with a trained friend beside you (its reaction; no opportunity attacks)' });
    }
    return out;
  };
  // THE SHIELD WALL (Soldiering's; Griz: "a 'shield wall' feat that cost a bonus action to 'create, join or leave' and your reaction when you do, but does a +2 AC and 1d6 blunt
  // damage shove each round, pushing back what's in front of the shield wall 5 ft and moving the wall into the square they just cleared"; "4 - save"; the members keep their own
  // Attack). RE-CUT 11-20 on his play of the door -- "my imagination required the 'push' to be a unified movement of the wall. Either the first guy calling it and everyone's
  // reaction burns... or something", "Something similar with the reactions of the pike wall, maybe even one triggered by the shield wall pushing"; then, on the lanes desk's six,
  // "I like your unified suggestions and the pike build, but review pane-play and re-opine" and "Yes, build it":
  //   1 ONE FRONT: the first to set picks it, one of the four straight ways (toward the nearest foe); every one who joins that wall takes it -- a mate is one with the same front.
  //   2 THE WHOLE LINE MOVES OR NONE OF IT: one call, one DC; each foe ahead of the line saves; all fail, all are pushed and the line steps as one; any holds, nobody steps, and
  //     the ones that failed still take the 1d6 (the bend, his 11-20 trial, is gone).
  //   3 SET SHIELDS costs the bonus action alone (not the reaction): a wall formed this round pushes next round with every mate's reaction to spend.
  //   4 NO FREE ADVANCE: with no foe ahead the push is not offered; ADVANCE is its own command, the whole line together (below).
  //   5 THE PIKES: when the wall pushes, each trained piker behind a member may spend its reaction to thrust at a foe that failed.
  //   6 THE PUSH WRITTEN: every call, save, step and thrust is a card, so the fight's log and the play record carry it.
  // The formation seat's calls where the six are silent, standing for his overrule: LEAVE costs the bonus action alone, as SET does; a set member's own move is held till it
  // leaves; the DC is 8 + the caller's proficiency + STR, +1 for each mate that pushes; a foe larger than Large holds the line with no save (not shoved, no 1d6); the pikers
  // standing behind members step with the line, so the shoved foe is still at the pike's 10 ft; ADVANCE takes the caller's bonus action and every mate's reaction.
  // Pushed or traded out of its square, prone, or unable to act: out at no cost. JOINED: set, with a set mate of its side and front in one of the 8 squares beside -- only a joined
  // one has the +2 (rules.js RU.ac), gives cover (G.los) and calls THE PUSH
  // WHAT TAKES A MEMBER OUT (11-20, Griz on the show's Engulf: "might need to check what legitimately breaks a shield wall or a character out of one re 'engulf'"): moved off its
  // square by anything (a shove, Thunderwave, a pull, a grapple that drags it, a WHEEL trade); knocked prone; restrained (a web, a net, a grip that holds -- the shambling
  // mound's slam before its Engulf, the cloaker's); unable to act (stunned, paralysed, asleep, incapacitated, petrified, surprised); down to 0 or dead; its shield gone, or its
  // training. OUT IS OUT: the shields are down there and then, and setting them again is a bonus action (till 11-20 the check was lazy, and a member knocked flat stood up at
  // its own turn still in the wall). NOT out, the formation seat's calls standing for his overrule: grappled and not restrained (the SRD's grappled is speed 0, and it holds
  // its square), frightened (it holds ground; it cannot come nearer anyway), blinded, charmed, deafened, poisoned, invisible, hidden. The rest of the line: the wall is read
  // fresh each time from who is set, side by side with the same front -- one taken out of the middle leaves two walls, each with the front it had, and a lone one left is set
  // but not joined (no +2, no cover, no push) till a mate sets beside it
  F.wallSet = function (u) {
    var w = u && u.conds && u.conds.wall;
    if (!w) return false;
    var on = !u.dead && u.hp > 0 && w.x === u.x && w.y === u.y && !u.conds.prone && !u.conds.restrained && RU.canAct(u) && F.bearsShield(u) && F.soldiering(u);
    if (!on) { delete u.conds.wall; if (u.turn && u.turn.wallMove != null && !(u.turn.move > 0)) { u.turn.move = u.turn.wallMove; delete u.turn.wallMove; } } // (out: its move given back, where held)
    return on;
  };
  function sameFace(a, b) { return a.conds.wall.face[0] === b.conds.wall.face[0] && a.conds.wall.face[1] === b.conds.wall.face[1]; }
  F.wallMates = function (B, u) {
    if (!B || !F.wallSet(u)) return [];
    return B.units.filter(function (w) { return w !== u && w.side === u.side && F.wallSet(w) && sameFace(u, w) && Math.max(Math.abs(w.x - u.x), Math.abs(w.y - u.y)) === 1; });
  };
  F.joined = function (u, B) { B = B || D.battle; return F.wallMates(B, u).length > 0; };
  // the wall a joined one stands in: every joined member linked to it through mates
  F.wallOf = function (B, u) {
    var out = [u], i = 0;
    while (i < out.length) F.wallMates(B, out[i++]).forEach(function (w) { if (out.indexOf(w) < 0) out.push(w); });
    return out.length > 1 ? out : [];
  };
  // (nor restrained, as F.wallSet has it -- 11-26, the seat module-1125, on the team-fable seat's find: a Trooper in a Web passed this, F.setShields laid its wall, F.wallSet took it
  // straight off again, and the turn threw reading its front -- 8 of 10 garrison fights against a Web)
  F.canSet = function (u) { return !!(u && F.soldiering(u) && F.bearsShield(u) && !F.wallSet(u) && !u.conds.prone && !u.conds.restrained && RU.canAct(u) && u.turn && u.turn.bonus > 0); };
  // the front: a set mate's beside it (it joins that wall), else the straight way toward the nearest foe (the longer of the two distances; up/down on a tie)
  F.faceOf = function (B, u) {
    var m = B.units.filter(function (w) { return w !== u && w.side === u.side && F.wallSet(w) && Math.max(Math.abs(w.x - u.x), Math.abs(w.y - u.y)) === 1; })[0] || chainWall(B, u); // (chainWall: a set one down the row, its mates between still to set -- 11-25)
    if (m) return m.conds.wall.face.slice();
    // (the nearest foe it KNOWS of -- js/ai.js AI.heroes: seen, or heard beside it -- 11-25, the grid seat on the Line: watched at seed 1125, Vivian hid 30 ft west and the four
    // set their wall facing her, west, with the rest of the party plain to the south; a foe hidden and not found is no front)
    var kn = D.ai && D.ai.heroes ? D.ai.heroes(B, u).filter(function (w) { return G.hostile(u, w) && !w.dead && w.hp > 0 && !w.object; }) : null;
    var t = (kn || B.units.filter(function (w) { return G.hostile(u, w) && !w.dead && w.hp > 0 && !w.object; })).sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
    if (!t) return [0, -1];
    var dx = t.x - u.x, dy = t.y - u.y;
    return Math.abs(dy) >= Math.abs(dx) ? [0, Math.sign(dy) || -1] : [Math.sign(dx), 0];
  };
  var FACE_WORD = { '0,-1': 'north', '0,1': 'south', '1,0': 'east', '-1,0': 'west' };
  // A SET WALL FACES ITS FRONT (2026-11-25, Griz: "41 - yes", on the 11-22 tab's "can" -- his ask from the BUGBEAR AMBUSH, "When in a shield wall can we make them face the
  // direction the wall is pointed ... i think it'd help make it more obvious players are looking at a formation"): a set shield or a set pike turns to its front when it sets,
  // and at rest it is turned back to it (F.restFront, each frame: battle.js frame) -- after a blow, a throw, a flinch or a push has played its row, after a MARCH or a step of
  // the push. Its watch turns with it (battle.js nearOf: the cone ahead is the front). Till now the stored front (conds.wall.face) was the rules' alone, and each figure kept
  // the facing of its last step or blow
  F.frontOf = function (u) {
    var c = u && u.conds, f = c && ((c.wall && c.wall.x === u.x && c.wall.y === u.y && c.wall.face) || (c.pikes && c.pikes.x === u.x && c.pikes.y === u.y && c.pikes.face));
    return f ? D.spr.facingFor(f[0], f[1]) : null;
  };
  F.faceFront = function (B, u) { var f = F.frontOf(u); if (f != null && B && B.turnTo) B.turnTo(u, f); };
  F.restFront = function (B) {
    if (!B || !B.units) return;
    B.units.forEach(function (u) {
      if (!u.conds || u.dead || u.hp <= 0 || u.conds.prone || u.tween || u.inClaws || u.riding) return;
      var f = F.frontOf(u); if (f == null || u.facing === f) return;
      if (u.anim && u.anim !== 'idle' && B.t - (u.animT || 0) <= (D.spr.duration(u.sheet, u.anim) || 18) + 6) return; // (a row still playing: it turns back once it is done, as js/ui.js draws idle)
      u.facing = f; // (set directly: a figure settling back to its watch, not a turn that looks for the hidden -- Battle.turnTo -- in the middle of another's action)
    });
  };
  F.setShields = function (B, u, face) { // (face: a front given -- a second wall holding the first one's front, F.ownWall; else F.faceOf)
    u.turn.bonus = 0; u.conds.wall = { x: u.x, y: u.y, face: face ? face.slice() : F.faceOf(B, u) };
    u.turn.wallMove = u.turn.move; u.turn.move = 0; D.sfx('confirm'); F.faceFront(B, u);
    var n = F.wallMates(B, u).length; if (!u.conds.wall) return false; // (F.wallSet takes off a wall that cannot stand -- prone, restrained, out of the fight: nothing set, nothing said)
    var fw = FACE_WORD[u.conds.wall.face.join(',')] || '';
    B.card(['{y}' + u.name + '{/} sets shields, facing ' + fw + (n ? ', joined to ' + n + ' beside' : ', alone') + '  {g}(the bonus action; ' + (n ? '+2 AC, cover behind, THE PUSH' : 'nothing till a trained mate sets beside it') + '; its square held till it leaves){/}'], 220);
  };
  F.leaveWall = function (B, u, free) {
    if (!u.conds.wall) return;
    delete u.conds.wall;
    if (!free && u.turn) { u.turn.bonus = 0; if (u.turn.wallMove != null) { u.turn.move = u.turn.wallMove; delete u.turn.wallMove; } }
    if (B && B.card && !free) B.card(['{g}' + u.name + ' leaves the shield wall (the bonus action).{/}'], 180);
  };
  // the turn: a set one's move held (kept in turn.wallMove for a LEAVE); one no longer set (pushed off, prone, out of its shield) is out at no cost
  var startTurnW = RU.startTurn;
  RU.startTurn = function (u) {
    var r = startTurnW.apply(this, arguments);
    if (u && u.conds && u.conds.wall) { if (F.wallSet(u)) { u.turn.wallMove = u.turn.move; u.turn.move = 0; } else delete u.conds.wall; }
    if (u && u.conds && u.conds.pikes) { if (F.pikeSet(u)) { u.turn.pikeMove = u.turn.move; u.turn.move = 0; u.turn.rankHeld = true; } else delete u.conds.pikes; } // (THE PIKE WALL, 11-21: a set pike's move held as a set shield's)
    return r;
  };
  F.ahead = function (B, s, face) {
    var x = s.x + face[0], y = s.y + face[1];
    var who = B.units.filter(function (w) { return w !== s && !w.dead && w.hp > 0 && !w.riding && G.foot(w).some(function (p) { return p[0] === x && p[1] === y; }); })[0] || null;
    return { x: x, y: y, who: who };
  };
  // the foes ahead of the line, each once (a Large one may stand before two members)
  F.lineFoes = function (B, wall, face) {
    var out = [];
    wall.forEach(function (s) { var a = F.ahead(B, s, face); if (a.who && G.hostile(s, a.who) && !a.who.object && out.indexOf(a.who) < 0) out.push(a.who); });
    return out;
  };
  F.pushers = function (B, u) { return [u].concat(F.wallOf(B, u).filter(function (w) { return w !== u && w.reaction > 0 && RU.canAct(w); })); };
  // (the brace, THE PIKE WALL 11-21: +1 a bracing pike, a Long Guard's +2, at most +2 in all -- F.braceOf)
  F.pushDC = function (B, u, braced) { var ab = u.abil || (u.src && u.src.abil) || { str: 10 }; return 8 + (u.prof || 2) + D.mod(ab.str) + Math.max(0, F.pushers(B, u).length - 1) + F.braceBonus(braced); };
  // ONE PUSH A ROUND for a wall (11-20, his "leans 1-4 approved"): a call marks every member with the round, and no member of a wall so marked calls again that round
  F.wallPushedNow = function (B, wall) { return wall.some(function (w) { return w.conds.wall && w.conds.wall.pushed === B.round; }); };
  F.canPush = function (B, u) { if (!(u && u.turn && u.turn.bonus > 0 && F.joined(u, B))) return false; var wall = F.wallOf(B, u); return !F.wallPushedNow(B, wall) && F.lineFoes(B, wall, u.conds.wall.face).length > 0; };
  // can the whole line (and the pikers behind it) step one square forward? Each member's square ahead open, or a member's
  function lineCanStep(B, wall, face) {
    return wall.every(function (s) {
      var x = s.x + face[0], y = s.y + face[1], occ = G.occupant(x, y);
      return occ && wall.indexOf(occ) >= 0 ? true : G.canStand(s, x, y);
    });
  }
  // the pikes of the rank: SET PIKES (THE PIKE WALL, 11-21 -- till then any trained one with a pike behind a member), the wall's front, standing in the square behind a member.
  // Only these step with the line, at a push or a MARCH (his "maybe move with marches and successful pushes"; a pike not set stays where it is), and only these brace
  F.rankPikes = function (B, wall, face) {
    return B.units.filter(function (p) {
      return p.side === wall[0].side && wall.indexOf(p) < 0 && F.pikeSet(p, B) && p.conds.pikes.face[0] === face[0] && p.conds.pikes.face[1] === face[1] && wall.some(function (s) { return p.x === s.x - face[0] && p.y === s.y - face[1]; });
    });
  };
  function stepLine(B, wall, face) {
    var pikes = F.rankPikes(B, wall, face);
    wall.slice().sort(function (a, b) { return (b.x - a.x) * face[0] + (b.y - a.y) * face[1]; }).forEach(function (s) { F.wallStep(B, s, s.x + face[0], s.y + face[1]); }); // (the front rank first)
    pikes.forEach(function (p) { if (G.canStand(p, p.x + face[0], p.y + face[1])) F.wallStep(B, p, p.x + face[0], p.y + face[1]); });
    if (G.setup && B.map) G.setup(B.map, B.units);
    return pikes;
  }
  // the braced pike's thrust: the foe before its own shield, else a foe of the push, else -- the 11-24 oddity, his 4-ogre door -- any foe in its reach it can see (one at
  // the wall's corner), so a brace paid for a thrust never ends on nothing with a foe in reach
  function pikeTarget(B, p, foes, face) {
    var rch = G.armOf(p), sh = p.conds.pikes ? F.pikeFront(B, p, p.conds.pikes.face) : null, own = sh ? F.ahead(B, sh, face).who : null;
    var live = function (f) { return f && !f.dead && f.hp > 0 && !f.object && G.dist(p, f) <= rch; };
    var ts = foes.filter(live); if (own && ts.indexOf(own) >= 0) return own; if (ts.length) return ts[0];
    return B.units.filter(function (f) { return G.hostile(p, f) && live(f) && D.magic.sees(B, p, f); }).sort(function (a, b) { return G.dist(p, a) - G.dist(p, b); })[0] || null;
  }
  F.pikeTarget = pikeTarget;
  F.wallPush = function* (B, u) {
    if (!F.canPush(B, u)) return;
    var face = u.conds.wall.face, wall = F.wallOf(B, u), pushers = F.pushers(B, u), foes = F.lineFoes(B, wall, face);
    // THE BRACE (THE PIKE WALL, 11-21 -- his "something they do when the shield wall pushes"): each set pike behind the line with its reaction may brace over its shield's
    // shoulder -- the reaction spent, +1 on the push's DC (a Long Guard's +2), at most +2 in all; it thrusts after, hit or hold. One reaction with KEEP BACK (the wrinkle, standing):
    // a pike that kept a foe back this round has none to brace with. A player's pike asked; the AI's always braces
    // A BRACE THAT GIVES NOTHING IS NOT ASKED (11-24, the grid seat on his 4-ogre door of 11-24 08:42Z -- his "counting on your analysis to find any oddities": in R3 four pikes
    // braced, the first two filled the +2, and the third and fourth paid their reactions for no DC; the fourth's thrust then found the push's two ogres dead and "nothing in
    // the pike's reach", with a third ogre 5 ft from it): past the +2 a brace adds only its thrust, so a pike with no foe in its reach is not asked and keeps its reaction (KEEP
    // BACK's too); one that is asked is told when the DC is full. The AI's the same
    var braced = [], cand = F.rankPikes(B, wall, face).filter(function (p) { return p.reaction > 0 && RU.canAct(p); });
    for (var bi = 0; bi < cand.length; bi++) {
      var bp = cand[bi], addsDC = F.braceBonus(braced.concat([bp])) > F.braceBonus(braced), canThrust = !!pikeTarget(B, bp, foes, face);
      if (!addsDC && !canThrust) continue;
      if (mine(bp)) {
        var bgo = yield { prompt: { who: bp, title: bp.name + ': BRACE?', lines: [addsDC ? u.name + ' calls the push: brace your pike over the shield (your reaction) -- +' + (F.braceBonus(braced.concat([bp])) - F.braceBonus(braced)) + ' on the push\'s DC (at most +2 in all), and thrust after it, hit or hold.' : u.name + ' calls the push: the pikes have braced it to +2 already -- brace only to thrust after it, hit or hold (your reaction).'], opts: [{ label: 'BRACE', value: 1 }, { label: 'HOLD', value: 0, no: true }] } };
        if (!bgo) continue;
      }
      bp.reaction = 0; braced.push(bp);
    }
    var dc = F.pushDC(B, u, braced);
    u.turn.bonus = 0; pushers.forEach(function (w) { if (w !== u) w.reaction = 0; }); wall.forEach(function (w) { w.conds.wall.pushed = B.round; });
    // (the price on the card and over each head, 11-20 -- Griz at his door: "The wall push isn't costing anything for the guys who didn't call the push": it cost each
    // pushing mate its reaction, said only as a count; now named, a mate with none left named too, and "reaction spent" floated over each who paid)
    var mts = pushers.filter(function (w) { return w !== u; }), idle = wall.filter(function (w) { return w !== u && pushers.indexOf(w) < 0; });
    B.card(['{y}' + u.name + '{/} calls the push: the wall of ' + wall.length + ' shoves as one, STR DC ' + dc + '  {g}(' + u.name + '\'s bonus action' + (mts.length ? '; the reactions of ' + mts.map(function (w) { return w.name; }).join(', ') : '') + (idle.length ? '; ' + idle.map(function (w) { return w.name; }).join(', ') + ' with no reaction left, not pushing' : '') + (braced.length ? '; braced by ' + braced.map(function (w) { return w.name; }).join(', ') + ', +' + F.braceBonus(braced) + ' (their reactions)' : '') + '){/}'], 260);
    if (FX && FX.float) mts.forEach(function (w) { FX.float('reaction spent', w, D.PAL.ramps.silver ? D.PAL.ramps.silver[5] : '#ccc'); });
    D.sfx('confirm'); yield 10;
    // THE PUSH ROW (11-20: the first drawn, Halldor's `push` on halldor_p2 -- six frames, the shove on the fourth): every pusher whose sheet has one plays it toward the front
    // together, and the saves fall on its release frame; a sheet without one stands as before
    var rowers = pushers.filter(function (w) { return D.spr && D.spr.anim && D.spr.anim(w.sheet, 'push'); });
    if (rowers.length) {
      rowers.forEach(function (w) { if (B.faceTo) w.facing = B.faceTo(w, { x: w.x + face[0], y: w.y + face[1] }); w.anim = 'push'; w.animT = B.t; });
      var pr = D.spr.anim(rowers[0].sheet, 'push'), rel = pr.release != null ? pr.release : 3;
      yield Math.max(4, Math.ceil(rel * 60 / (pr.fps || 8)));
    }
    var failed = [], held = [];
    foes.forEach(function (f) {
      if ((f.size || 1) > 2) { held.push(f); B.card(['  ' + Nm(B, f) + ' is too big to shove  {n}IT HOLDS{/}'], 200); return; }
      var sv = RU.save(f, 'str', dc); D.sfx(sv.ok ? 'miss' : 'hit');
      B.card(['  ' + Nm(B, f) + ': STR ' + RU.saveText(sv) + ' vs DC ' + dc + '  ' + (sv.ok ? '{n}IT HOLDS{/}' : '{o}FAILS{/}')], 200);
      (sv.ok ? held : failed).push(f);
    });
    yield 10;
    var stepped = false, stuck = [];
    if (!held.length) {
      failed.forEach(function (f) { var x0 = f.x, y0 = f.y; D.magic.push(B, { x: f.x - face[0], y: f.y - face[1] }, f, 1); if (f.x === x0 && f.y === y0) stuck.push(f); }); // (not moved: no room behind it, or it held its ground -- HOLD GROUND, the roots)
      if (!stuck.length && lineCanStep(B, wall, face)) { stepLine(B, wall, face); stepped = true; }
    }
    failed.forEach(function (f) { var dmg = D.roll('1d6').total; B.card(['  ' + Nm(B, f) + ' takes {r}' + dmg + '{/} bludgeoning' + (stepped ? ', driven back 5 ft' : '')], 200); B.hurt(f, dmg, 'bludgeoning', {}); });
    B.card([stepped ? '  {y}THE LINE STEPS FORWARD{/} 5 ft, as one' : '  {n}THE LINE HOLDS ITS GROUND{/}  {g}(' + (held.length ? held.map(function (f) { return nm(B, f); }).join(', ') + ' held' : stuck.length ? stuck.map(function (f) { return nm(B, f); }).join(', ') + ' not moved' : 'no room for the line to step') + '; nobody steps){/}'], 240);
    yield stepped ? 14 : 8;
    rowers.forEach(function (w) { if (w.anim === 'push') { w.anim = 'idle'; w.animT = B.t; } }); // (the row played out: back to idle)
    // the pikes' thrust: each pike that braced, HIT OR HOLD (THE PIKE WALL, 11-21; till then a piker behind thrust with its reaction only at a foe that failed) -- the foe before
    // its own shield first, else any foe of the push in its reach; its reaction went on the brace
    for (var i = 0; i < braced.length; i++) {
      var p = braced[i]; if (p.dead || p.hp <= 0 || !RU.canAct(p)) continue;
      var arm = F.pikeArm(p) || F.pikeOf(p), t = pikeTarget(B, p, foes, face);
      if (!t) { B.card(['  {g}' + p.name + ' braced; nothing in the ' + (arm && arm.name ? arm.name.toLowerCase() : 'pike') + '\'s reach to thrust at.{/}'], 160); continue; }
      B.card(['  {y}' + p.name + '{/} thrusts past the wall  {g}(braced: its reaction){/}'], 200);
      yield* B.attack(p, t, arm, { pikeRank: true });
      yield 8;
    }
  };
  // MARCH (11-20, Griz: "1 - half move of the slowest wall member = march movement, approved"; it takes the place of the re-cut's ADVANCE, 5 ft for the bonus action and the
  // mates' reactions): a formed line, no foe ahead, moves together as its move -- straight along its front, as far as half the speed of its slowest member, square by square,
  // stopping where a foe comes ahead of it or the ground will not take the whole line. The formation seat's calls, standing for his overrule: any joined member calls it and
  // spends its own (held) move; the mates spend nothing (their moves stay held as ever); once a round for a wall; the pikers behind step with it, as with a push; the bonus
  // action is left, so a march that brings the line up to a foe can be followed by the push; difficult ground is not read (a square is a square)
  // (half the slowest one's speed ROUNDED UP to a whole square -- RULED 11-20, Griz: "do the round up on the march": a dwarf wall's 25 ft marches 15 ft, not 10. F.marchPace, a bench's
  // switch only -- dev/bench16.js soldier1120 measure=half|up|full -- to set the three paces side by side)
  F.marchFt = function (B, u) {
    var wall = F.wallOf(B, u); if (!wall.length) return 0;
    var slow = Math.min.apply(null, wall.map(function (w) { return RU.speedNow(w) || w.speed || 30; }));
    return F.marchPace === 'full' ? 5 * Math.floor(slow / 5) : F.marchPace === 'half' ? 5 * Math.floor(slow / 2 / 5) : 5 * Math.ceil(slow / 2 / 5);
  };
  F.canMarch = function (B, u) {
    if (!u || !u.turn || !F.joined(u, B) || !(u.turn.wallMove > 0)) return false;
    var wall = F.wallOf(B, u), face = u.conds.wall.face;
    return F.marchFt(B, u) >= 5 && !wall.some(function (w) { return w.conds.wall.marched === B.round; }) && !F.lineFoes(B, wall, face).length && lineCanStep(B, wall, face);
  };
  F.canAdvance = F.canMarch; // (the re-cut's ADVANCE, folded into MARCH)
  F.wallMarch = function* (B, u) {
    if (!F.canMarch(B, u)) return;
    var wall = F.wallOf(B, u), face = u.conds.wall.face, ft = F.marchFt(B, u), n = 0;
    u.turn.wallMove = 0; wall.forEach(function (w) { w.conds.wall.marched = B.round; w.conds.wall.shotRounds = 0; w.conds.wall.shot = false; }); // (his "reset after a march move")
    D.sfx('confirm');
    while (n * 5 < ft && !F.lineFoes(B, wall, face).length && lineCanStep(B, wall, face)) { stepLine(B, wall, face); n++; yield 10; }
    B.card(['{y}' + u.name + '{/} calls MARCH: the wall of ' + wall.length + ' moves ' + n * 5 + ' ft ' + (FACE_WORD[face.join(',')] || 'forward') + ', as one  {g}(half the slowest one\'s speed, rounded up: ' + ft + ' ft; ' + u.name + '\'s move' + (n * 5 < ft ? '; it stops ' + (F.lineFoes(B, wall, face).length ? 'with a foe ahead' : 'where the ground stops it') : '') + '){/}'], 240);
    yield 8;
  };
  F.wallAdvance = F.wallMarch;
  // the missiles a set member takes (his "2 - 2 rounds, reset after a march move"): a shot or a spell's attack from beyond its reach marks it (battle.js attack calls this);
  // its own turn counts the rounds (F.aiWall)
  F.wallShot = function (att, tgt, atk, melee) { if (tgt && atk && !melee && tgt.conds && tgt.conds.wall && F.wallSet(tgt)) tgt.conds.wall.shot = true; };
  // SAVE SPELLS COUNT AS MISSILES (RULED 11-22, Griz: "also c", on the Code tab's "(c) let save spells count toward the missiles break as well"): a set member that makes a save
  // against a spell cast by a foe out of its reach is marked as a shot marks it, and its turn counts the round (F.aiWall). In his BUGBEAR AMBUSH fight 2 (11-22) Sacred Flame, Acid
  // Splash and two Burning Hands never counted, and the set wall held with every foe behind it. The caster is the cast's (M.cast, wrapped: F.castBy for its length); RU.save asks it
  var castW = M.cast;
  M.cast = function* (B, u) { var prev = F.castBy; F.castBy = u; try { return yield* castW.apply(this, arguments); } finally { F.castBy = prev; } };
  var saveW = RU.save;
  RU.save = function (u) {
    var r = saveW.apply(this, arguments), c = F.castBy;
    if (c && u && u.conds && u.conds.wall && c !== u && G.hostile(c, u) && G.dist(c, u) > G.armOf(u) && F.wallSet(u)) u.conds.wall.shot = true;
    return r;
  };
  // IN FRONT OF THE WALL (11-25, on his "1 - break and re-form facing enemies, so mostly a"; the 11-22 tab's "Read the march's half-plane 'ahead' with it"): past the line's front,
  // and no farther out beyond the line's ends than it is ahead -- the cone off each end, as a watch's widens (battle.js nearOf). Till 11-25 the MARCH read the half-plane: the made
  // wizard 2 squares west and 4 south of a west-facing Trooper was "ahead" of it, and the wall marched past him. `wall`: its members (one, set alone), `face` its front
  F.inFront = function (wall, face, w) {
    var p = [-face[1], face[0]], line = Math.max.apply(null, wall.map(function (s) { return s.x * face[0] + s.y * face[1]; }));
    var al = wall.map(function (s) { return s.x * p[0] + s.y * p[1]; }), lo = Math.min.apply(null, al), hi = Math.max.apply(null, al);
    return G.foot(w).some(function (q) { var fwd = q[0] * face[0] + q[1] * face[1] - line, a = q[0] * p[0] + q[1] * p[1], lat = a < lo ? lo - a : a > hi ? a - hi : 0; return fwd > 0 && lat <= fwd; });
  };
  // the front a re-form takes with no re-formed mate beside it (F.aiWall): of the four straight ways, the one with the most foes it knows of within 60 ft in front of it -- a tie,
  // F.faceOf's (toward the nearest). F.faceOf alone reads a diagonal tie as up or down, and a front with no foe in front of it would break again at the next turn
  // (THE LINE SQUARE TO THEM, 11-25 -- Griz: "13 - seems like the form should depend on where the foe is, if by column you just mean east to west line"; the desk's build: the
  // re-formed wall joins side by side across the front that faces where its foes are, whatever the compass says): the front is weighed for the whole re-forming group -- it and
  // its mates still to re-form beside it, as one wall (F.inFront) -- and a tie goes to the front the group already stands across (no depth along it), then F.faceOf's. Till then
  // the first to set weighed its own square alone: three troopers standing north to south with the party east of them set facing south, one behind another -- a file, not a line)
  F.reformGroup = function (B, u) {
    var out = [u], i = 0;
    while (i < out.length) { var s = out[i++]; B.units.forEach(function (w) { if (out.indexOf(w) < 0 && w.side === u.side && !w.familiar && w.wallReform != null && F.wallReady(w) && F.bearsShield(w) && !F.wallSet(w) && sqDist(s, w) <= 1) out.push(w); }); }
    return out;
  };
  F.reformFace = function (B, u) {
    var kf = knownFoes(B, u).filter(function (w) { return G.dist(u, w) <= 60; }), grp = F.reformGroup(B, u), f0 = F.faceOf(B, u), best = f0, bn = -1, bd = Infinity;
    [f0, [0, -1], [1, 0], [0, 1], [-1, 0]].forEach(function (f) {
      var n = kf.filter(function (w) { return F.inFront(grp, f, w); }).length, at = grp.map(function (s) { return s.x * f[0] + s.y * f[1]; }), dep = Math.max.apply(null, at) - Math.min.apply(null, at);
      if (n > bn || (n === bn && dep < bd)) { bn = n; bd = dep; best = f; }
    });
    return best.slice();
  };
  // THE COVER BEHIND THE WALL (G.los asks it of each creature in a line): a joined member w, and of the two the line joins the one behind w (against the wall's facing) --
  // 5 (three-quarters) in the first square behind, 2 (half) in the second; one larger than w, 2 in the first and none of the wall's past it. The one in front gets nothing
  // of the wall's own (the ordinary half a creature in the line gives stays G.los's)
  F.wallCover = function (w, a, b) {
    if (!F.joined(w)) return 0;
    var fc = w.conds.wall.face, h = [a, b].filter(function (u) { return u && (u.x - w.x) * fc[0] + (u.y - w.y) * fc[1] < 0; })[0];
    if (!h) return 0;
    var n = Math.max(Math.abs(h.x - w.x), Math.abs(h.y - w.y)), big = (h.size || 1) > (w.size || 1);
    return n === 1 ? (big ? 2 : 5) : n === 2 && !big ? 2 : 0;
  };
  // THE PIKE RANK (Soldiering's; RULED, Griz: "2 pikes only no attack penalty, but let other pole-arms work with cover penalty", "3 - no adjusting to your cover model"): a
  // trained one with a pike in hand strikes through the wall's members at no penalty (battle.js attack: G.los's `wall` -- the line's only cover the wall's); any other reach
  // weapon takes the cover as it stands; the piker's own cover stays what it is
  F.pikeOf = function (u) { if (u.weapon && (u.weapon.kind === 'pike' || /^pike$/i.test(u.weapon.name || ''))) return u.weapon; var ks = Object.keys(u.attacks || {}).filter(function (k) { var a = u.attacks[k]; return a.kind === 'pike' || /^pike$/i.test(a.name || ''); }); return ks.length ? u.attacks[ks[0]] : u.weapon; };
  F.pikeThrough = function (u, atk) {
    var pa = !atk && u && !u.weapon && u.attacks ? Object.keys(u.attacks).map(function (k) { return u.attacks[k]; }).filter(function (a) { return a.kind === 'pike' || /^pike$/i.test(a.name || ''); })[0] : null; // (a block's pike: the pike trooper, 11-20)
    var w = atk && !atk.spell ? atk : pa || (u && u.weapon);
    return !!(F.soldiering(u) && w && !w.ranged && (w.kind === 'pike' || /^pike$/i.test(w.name || '')));
  };
  // THE FORMATION'S AI (Soldiering's, 11-20; the push re-cut the same day; THE FORMING his, the same day -- "make it a default for a trained group to use their training on the
  // first round, not a measure of contact. i.e. their response to initiative being rolled is to try to form a shield wall and a pike line (probably some ai check (allies contain
  // trained and shield/pike - to not try to form a wall when the only trained and properly equipped in party)"). At the head of a trained one's turn (TX.FIRST; a bestiary
  // block's from ai.js), before its blows:
  //   HIS GUARD: a shield-bearer forms only with another trained shield-bearer of its side on the field; a piker only with a trained shield-bearer (a pike rank wants a wall).
  //   THE FIRST ROUND, whatever the distance: the first trained shield-bearer to act sets where it stands, its front straight toward the nearest foe (the line's place and way:
  //   the formation seat's call); each that acts after walks to the nearest open square at the end of that line, beside a member, and sets (it takes the wall's front). A piker
  //   walks to the nearest open square behind a member and holds there; with no wall yet it holds where it is and waits for one.
  //   AFTER IT: an unset shield-bearer with a wall of its side standing walks to its end and joins while no foe is in its reach (with one in reach it sets where it is when a
  //   trained shield-bearer stands beside it). A piker keeps to the rank. A set member LEAVES when no foe is within 60 ft (the wall has nothing to hold against); with foes
  //   about and none in its reach, the first of the wall to act calls ADVANCE when the nearest foe is ahead of the front. THE PUSH: the first of the wall to act with a foe
  //   ahead of the line and a mate's reaction to spend (one a round, F.canPush). WHEEL (F.wheelWant): on a hit, the hitter at half its hit points or less trades with a trained
  //   friend beside it that is not, the friend with the most hit points
  F.wheelWant = function (B, att, friends) {
    if (att.hp > att.maxhp / 2) return null;
    if (F.wallSet(att) || F.pikeSet(att, B)) return null; // (never out of a set wall, nor with a set member: the trade would break the line -- the desk's read of his watched door, 11-20: "the AI's wheel pulls a set member out"; a set pike the same, 11-25)
    return friends.filter(function (w) { return w.hp > w.maxhp / 2 && !F.wallSet(w) && !F.pikeSet(w, B) && sameRank(att, w); }).sort(function (a, b) { return b.hp - a.hp; })[0] || null;
  };
  // WHEEL KEEPS THE PIKES BEHIND THE SHIELDS (2026-11-25, the leveling seat's lean, Griz: "rest of part A leans approved"): a pike-bearer (trained, a reach weapon, no shield)
  // wheels only with another pike-bearer, so the AI's trade never brings a pike into the front rank nor sends a shield back into the rank. Found on the watched Line
  // (?fight=line&watch&seed=1125, the grid seat grid-1125): a hurt guard wheeled with the pikeman behind him. The player's own WHEEL, a chosen move, is left as it was
  function pikeRank(w) { return !F.bearsShield(w) && !!F.pikeArm(w); }
  function sameRank(a, b) { return pikeRank(a) === pikeRank(b); }
  F.sameRank = sameRank;
  function foeWithin(B, u, ft) { return B.units.some(function (w) { return G.hostile(u, w) && !w.dead && w.hp > 0 && !w.object && G.dist(u, w) <= ft; }); }
  F.wallReady = function (u) { return !!(u && !u.dead && u.hp > 0 && F.soldiering(u) && F.bearsShield(u)); };
  F.pikeReady = function (u) { return !!(u && !u.dead && u.hp > 0 && F.soldiering(u) && F.pikeThrough(u)); };
  // his guard: another of its side trained and fit to form with
  F.formGuard = function (B, u) {
    return B.units.some(function (w) { return w !== u && w.side === u.side && !w.familiar && F.wallReady(w); });
  };
  function sideWalls(B, u) { return B.units.filter(function (w) { return w !== u && w.side === u.side && F.wallSet(w); }); }
  // the set member whose front's row runs to u through trained shield-bearers standing in it, set the same way or still to set (11-25, the grid seat on the Line: four abreast
  // on the bridge, the end man set first, and the man two along -- his mate between still to set -- found no open end to walk to and charged; in round one he sets where he
  // stands, the wall's way, and the line fills in -- as rankSpots counts the squares behind Shields still to set)
  function chainWall(B, u) {
    if (!B || !u) return null;
    var hit = null;
    sideWalls(B, u).some(function (m) {
      var f = m.conds.wall.face, p = [-f[1], f[0]];
      return [1, -1].some(function (s) {
        for (var i = 1; i <= 8; i++) {
          var x = m.x + s * p[0] * i, y = m.y + s * p[1] * i;
          if (x === u.x && y === u.y) { hit = m; return true; }
          var o = G.occupant(x, y);
          if (!o || o === u || o.side !== u.side || !F.wallReady(o) || !F.bearsShield(o) || (F.wallSet(o) && !sameFace(o, m))) return false;
        }
        return false;
      });
    });
    return hit;
  }
  // the squares at the line's ends (beside a set member, across its front) and behind it (the rank), open
  function lineSpots(B, u, set) {
    var out = [];
    set.forEach(function (m) { var f = m.conds.wall.face, p = [-f[1], f[0]]; [[m.x + p[0], m.y + p[1]], [m.x - p[0], m.y - p[1]]].forEach(function (q) { if ((q[0] === u.x && q[1] === u.y) || (!G.occupant(q[0], q[1]) && G.canStand(u, q[0], q[1]))) out.push(q); }); });
    return out; // (its own square counts, as rankSpots' does -- 11-25, the grid seat on the Line: four guards abreast, the first set and the three beside it never joined, their own squares refused as occupied)
  }
  function rankSpots(B, u, set) {
    var out = [];
    set.forEach(function (m) { var f = m.conds.wall.face, q = [m.x - f[0], m.y - f[1]]; if ((q[0] === u.x && q[1] === u.y) || (!G.occupant(q[0], q[1]) && G.canStand(u, q[0], q[1]))) out.push(q); });
    return out;
  }
  // TWO WALLS, WEIGHED BY THE GROUND (2026-11-25, Griz, on the Dominion seat's lean -- the snootwagon fight stands each sergeant's squad on its own flank, and the wall AI closed
  // all five shields into one: "I say add it to the AI as an option, but have them weight the walls so separate isn't necessarily what happens every fight (since wall AC goes up
  // if they make one wall?)"). A shield-bearer still to set, with a wall of its side standing more than two squares off and a trained mate of its own beside it (within two
  // squares, still to set), may set a wall of its own where it stands instead of walking to the other's end; its mates then join it, as the nearest end. Rolled once a fight
  // for each (B.wallPlan), weighed by the lanes desk's read of the ground: likelier when the foes come at it from another way than the standing wall faces (two flanks) or
  // spread wider across that wall's front than all the side's shields could hold, a little likelier when its nearest foe is nearer it than the wall; unlikely otherwise. The
  // AC is no reason either way: a joined member's +2 is the same in a wall of two or of five (rules.js RU.ac); THE PUSH's DC is what one long wall buys, +1 a pushing mate
  // (F.pushDC). The seat's weights, standing for his overrule (F.TWO_WALLS)
  F.TWO_WALLS = { base: 0.2, flanks: 0.6, wide: 0.4, own: 0.15, most: 0.9 };
  function sqDist(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }
  function knownFoes(B, u) { var kn = D.ai && D.ai.heroes ? D.ai.heroes(B, u) : B.units; return kn.filter(function (w) { return G.hostile(u, w) && !w.dead && w.hp > 0 && !w.object; }); }
  function straightWay(u, t) { var dx = t.x - u.x, dy = t.y - u.y; return Math.abs(dy) >= Math.abs(dx) ? [0, Math.sign(dy) || -1] : [Math.sign(dx), 0]; } // (F.faceOf's own rule)
  F.ownWall = function (B, u, walls) {
    var near = walls.slice().sort(function (a, b) { return sqDist(u, a) - sqDist(u, b); })[0];
    if (!near || sqDist(u, near) <= 2) return null; // (close by the wall: it joins)
    var mates = B.units.filter(function (w) { return w !== u && w.side === u.side && !w.familiar && F.wallReady(w) && F.bearsShield(w) && !F.wallSet(w) && sqDist(u, w) <= 2; });
    if (!mates.length) return null; // (no mate of its own to set beside it: a wall of one gives nothing)
    var plan = B.wallPlan = B.wallPlan || {};
    if (plan[u.id]) return plan[u.id];
    var W = F.TWO_WALLS, foes = knownFoes(B, u), wf = near.conds.wall.face, why = [];
    var t = foes.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
    var flanks = !!t && (t.x - near.x) * wf[0] + (t.y - near.y) * wf[1] <= 0; // (its nearest foe not ahead of the standing wall's front: beside it or behind it -- a second flank)
    var p = [-wf[1], wf[0]], across = foes.map(function (w) { return w.x * p[0] + w.y * p[1]; }), span = across.length ? Math.max.apply(null, across) - Math.min.apply(null, across) + 1 : 0;
    var shields = B.units.filter(function (w) { return w.side === u.side && !w.familiar && F.wallReady(w) && F.bearsShield(w); }).length, wide = span > shields;
    var wall = F.wallOf(B, near), line = wall.length ? wall : [near], own = !!t && G.dist(u, t) < Math.min.apply(null, line.map(function (w) { return G.dist(w, t); }));
    var chance = W.base + (flanks ? W.flanks : 0) + (wide ? W.wide : 0) + (own ? W.own : 0); chance = Math.min(W.most, chance);
    if (flanks) why.push('the foes come at it from the ' + (FACE_WORD[straightWay(u, t).join(',')] || 'side') + ', the wall faces ' + (FACE_WORD[wf.join(',')] || 'away'));
    if (wide) why.push('their front ' + span + ' squares wide, ' + shields + ' shields to hold it');
    if (own) why.push('its foe nearer it than the wall');
    var roll = D.rand();
    // (its front: its own foe's way at a second flank; else the standing wall's -- the same front held in two places, not turned to a foe off at a slant)
    return (plan[u.id] = { own: roll < chance, chance: chance, roll: roll, face: flanks ? null : wf.slice(), why: why.length ? why.join('; ') : 'one wall stands, the ground asks no second' });
  };
  // walk to the nearest of the spots it can reach this turn, or as near as it can come; true when it stands on one
  function* walkTo(B, u, spots) {
    if (!spots.length) return false;
    if (spots.some(function (q) { return q[0] === u.x && q[1] === u.y; })) return true;
    var mv = u.turn ? u.turn.move : 0; if (!(mv > 0)) return false;
    var rm = G.reach(u, mv), best = null;
    spots.forEach(function (q) { var e = rm[q[0] + ',' + q[1]]; if (e && e.stand && (!best || e.cost < best.c)) best = { q: q, c: e.cost }; });
    var to = best ? best.q : null;
    if (!to) { // (none in reach: as near to the nearest spot as the move goes)
      var nd = null; Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand) return; var xy = k.split(',').map(Number), d = Math.min.apply(null, spots.map(function (q) { return Math.max(Math.abs(q[0] - xy[0]), Math.abs(q[1] - xy[1])); })); if (!nd || d < nd.d) nd = { q: xy, d: d }; });
      to = nd && (nd.q[0] !== u.x || nd.q[1] !== u.y) ? nd.q : null;
    }
    if (!to) return false;
    yield* B.exec(u, { do: 'move', x: to[0], y: to[1] });
    return spots.some(function (q) { return q[0] === u.x && q[1] === u.y; });
  }
  function holdRank(u) { if (u.turn) { u.turn.move = 0; u.turn.rankHeld = true; } } // (rankHeld: tactics.js walks it nowhere, no Dash either -- 11-20)
  F.aiWall = function* (B, u) {
    if (mine(u) || !u.turn || u.dead || u.hp <= 0) return;
    if (F.pikeReady(u) && !F.bearsShield(u)) { // (a piker: to the rank)
      // THE PIKE WALL (11-21, the draft's AI): set, it holds -- it leaves only with no foe within 60 ft, as a set shield does; KEEP BACK always and the brace whenever its
      // wall pushes are F.keepBack's and F.wallPush's (the AI's pike is never asked); it throws nothing from the rank (rankHeld, tactics.js)
      if (F.pikeSet(u, B)) { if (!foeWithin(B, u, 60)) { F.leavePikes(B, u); yield 8; } return; }
      if (!F.formGuard(B, u) || foeWithin(B, u, 5)) return; // (a foe at its elbow: it fights as it can)
      var set = sideWalls(B, u);
      // NO WALL YET, ROUND ONE: TO WHERE THE RANK WILL FORM (RULED 2026-11-20 "for test AI", Griz: "4 - good for test AI", on the formation seat's lean that "waits holding for
      // the wall to form" would want a Ready -- a trial to watch): no Ready, no waiting; the piker walks to the square behind a Shield that will set, across the front it will
      // take (F.faceOf -- toward the nearest foe, or a set mate's), and holds there for the pike's 10 ft. Till 11-20 it held where it stood and threw its handaxes
      // (round one, the wall half-formed: the squares behind the Shields still to set count too -- one set with its back to the map's edge has no rank behind it, seed 1)
      if (!set.length && B.round !== 1) return;
      var spots = rankSpots(B, u, set);
      if (B.round === 1) B.units.forEach(function (m) {
        if (m === u || m.side !== u.side || F.wallSet(m) || !F.wallReady(m) || !F.bearsShield(m)) return;
        var f = F.faceOf(B, m), q = [m.x - f[0], m.y - f[1]]; if ((q[0] === u.x && q[1] === u.y) || (!G.occupant(q[0], q[1]) && G.canStand(u, q[0], q[1]))) spots.push(q);
      });
      var inRank = yield* walkTo(B, u, spots);
      if (inRank && B.round === 1 && !(u.turn && u.turn.rankHeld)) { B.card(['{g}' + u.name + ' takes the rank behind the shields, pike levelled.{/}'], 160); yield 6; }
      if (inRank) holdRank(u);
      if (inRank && F.canSetPikes(B, u)) { F.setPikes(B, u); yield 8; } // (the turn it stands behind a set member: SET PIKES, the bonus action -- the draft's AI)
      return;
    }
    if (!F.wallReady(u) || !(u.turn.bonus > 0)) return;
    var reach = G.armOf(u), walls = sideWalls(B, u);
    if (!F.wallSet(u)) {
      if (u.wallReform != null && B.round - u.wallReform > 2) delete u.wallReform; // (a re-form never made: stale)
      if (!F.canSet(u) || !F.formGuard(B, u)) return;
      // THE RE-FORM'S SECOND TURN (below, the break): set again where it stands, facing the foes -- the nearest one's way, or a mate's already turned (F.faceOf); a wall of its side
      // standing farther off, it goes to that as ever
      if (u.wallReform != null && u.wallReform < B.round) {
        delete u.wallReform;
        // (side by side, 11-25 -- his "13", above F.reformGroup: a re-formed mate beside it ACROSS its front, it joins; beside it but before or behind it along that front, it goes to
        // the line's end and sets there, rather than set as a file behind it; no end it can reach this turn, it tries again next turn)
        var matesR = walls.filter(function (w) { return Math.max(Math.abs(w.x - u.x), Math.abs(w.y - u.y)) === 1; });
        var across = matesR.filter(function (m) { var f = m.conds.wall.face; return (u.x - m.x) * f[0] + (u.y - m.y) * f[1] === 0; });
        if (!walls.length || across.length) { B.card(['{y}' + u.name + '{/} re-forms the wall to face them.'], 160); F.setShields(B, u, across.length ? across[0].conds.wall.face : F.reformFace(B, u)); yield 10; return; }
        if (matesR.length) {
          var lineR = F.wallOf(B, matesR[0]), endR = yield* walkTo(B, u, lineSpots(B, u, lineR.length ? lineR : [matesR[0]]));
          if (endR && F.canSet(u)) { B.card(['{y}' + u.name + '{/} takes the end of the re-formed line.'], 160); F.setShields(B, u); yield 10; return; }
          u.wallReform = B.round; return;
        }
      }
      if (!walls.length) { // (no wall of its side yet)
        if (B.round === 1 || foeWithin(B, u, reach) && B.units.some(function (w) { return w !== u && w.side === u.side && F.wallReady(w) && Math.max(Math.abs(w.x - u.x), Math.abs(w.y - u.y)) === 1; })) { F.setShields(B, u); yield 10; }
        return;
      }
      if (foeWithin(B, u, reach)) { // (engaged: set where it stands if a set mate is beside it; else fight)
        if (walls.some(function (w) { return Math.max(Math.abs(w.x - u.x), Math.abs(w.y - u.y)) === 1; })) { F.setShields(B, u); yield 10; }
        return;
      }
      if (B.round === 1 && chainWall(B, u)) { F.setShields(B, u); yield 10; return; } // (round one, in the row a set member's front runs along, its mates between still to set: here -- chainWall, 11-25)
      var ow = F.ownWall(B, u, walls); // (TWO WALLS, 11-25: a wall of its own here, with its own mates, weighed by the ground -- F.ownWall)
      if (ow && ow.own) { B.card(['{y}' + u.name + '{/} stands apart from ' + nm(B, walls.slice().sort(function (a, b) { return sqDist(u, a) - sqDist(u, b); })[0]) + '\'s wall: a second wall here  {g}(' + ow.why + '){/}'], 220); F.setShields(B, u, ow.face); yield 10; return; }
      var atEnd = yield* walkTo(B, u, lineSpots(B, u, walls));
      if (atEnd && F.canSet(u)) { F.setShields(B, u); yield 10; }
      return;
    }
    if (!foeWithin(B, u, 60)) { F.leaveWall(B, u); yield 8; return; }
    // missiles (his "2 - 2 rounds, reset after a march move"): a round it was shot at, with no foe in its reach, counts; two and it leaves the wall; a foe in reach or a march resets it
    var Wm = u.conds.wall; if (Wm.shot) { Wm.shotRounds = (Wm.shotRounds || 0) + 1; Wm.shot = false; }
    if (foeWithin(B, u, reach)) Wm.shotRounds = 0;
    else if ((Wm.shotRounds || 0) >= 2) { B.card(['{g}' + u.name + ' breaks from the wall: two rounds of missiles and nothing comes on.{/}'], 200); F.leaveWall(B, u); yield 8; return; }
    // BREAK AND RE-FORM FACING THE FOES (RULED 11-22, Griz: "1 - break and re-form facing enemies, so mostly a", on the Code tab's "The wall: when every foe is behind it or on its
    // flank, what should it do?"): the foes it knows of within 60 ft, none of them in front of its wall (F.inFront), it leaves (the bonus action) and at its next turn sets again
    // where it stands, facing them (above). LEAVE and SET SHIELDS are each the bonus action, so the re-form spans two turns; one in a single turn would be a new rule, and his.
    // Its set pikes come out with it (F.pikeSet: the shield before them gone) and take the rank behind the new front. In his fight 2 the patrol's wall set facing west at Drill,
    // marched past the made wizard, and from round 3 every foe was behind it: the three set logged 18 "paces" to round 9, the File Leader 10 ft from the made wizard
    var wl = F.wallOf(B, u), fr = knownFoes(B, u).filter(function (w) { return G.dist(u, w) <= 60; });
    if (fr.length && !fr.some(function (w) { return F.inFront(wl.length ? wl : [u], u.conds.wall.face, w); })) {
      B.card(['{g}' + u.name + ' breaks from the wall to re-form it: every foe behind it or on its flank.{/}'], 200); F.leaveWall(B, u); u.wallReform = B.round; yield 8; return;
    }
    if (F.canPush(B, u) && F.pushers(B, u).length > 1) { yield* F.wallPush(B, u); return; }
    if (!foeWithin(B, u, reach) && F.canMarch(B, u)) {
      var fc = u.conds.wall.face, nf = B.units.filter(function (w) { return G.hostile(u, w) && !w.dead && w.hp > 0 && !w.object; }).sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
      if (nf && F.inFront(wl.length ? wl : [u], fc, nf)) { yield* F.wallMarch(B, u); if (F.canPush(B, u) && F.pushers(B, u).length > 1) yield* F.wallPush(B, u); } // (in front of it, not the half-plane: F.inFront, 11-25)
    }
  };
  TX.FIRST.unshift(function* (B, u) { yield* F.aiWall(B, u); });
  F.wallStep = function (B, s, x, y) {
    var x0 = s.x, y0 = s.y; s.x = x; s.y = y; if (s.conds.wall) { s.conds.wall.x = x; s.conds.wall.y = y; } if (s.conds.pikes) { s.conds.pikes.x = x; s.conds.pikes.y = y; }
    s.tween = { fx: x0, fy: y0, fz: G.gzAt(s, x0, y0), t: 0, dur: B.pace ? B.pace(10, true) : 10 };
  };
  // THE PIKE WALL (Soldiering's, Shape A -- built 2026-11-21 on Griz's "Go on 1-5" to the lanes desk's list, whose first item was this draft, the wrinkle standing). His lean,
  // verbatim (11-20): "currently lean is join the pike wall (or just pike wall) like 'set shield' is under skills, where non-polearm masters get to use set and push back as moves
  // called similar to the wall calling push (and polearm-masters in the pike wall get a bonus to theirs) - and maybe move with marches and successful pushes". As drafted:
  //   SET PIKES: a trained one with a reach weapon (a pike, a reach polearm, a spear) and no shield, in the square behind a set shield member -- a bonus action; it takes that
  //   member's front; its move held till it leaves. LEAVE THE PIKE WALL: a bonus action; a move click asks first, as the wall's does. JOINED: set behind a joined member.
  //   KEEP BACK, given by the formation: a foe moving into the square ahead of the shield before a joined pike -- the pike's reaction, a STR save (DC 8 + its proficiency + STR)
  //   or pushed 5 ft back and its move ended (F.keepBack). SET AGAINST THE CHARGE, given: a foe come 20 ft or more straight at that shield and in the pike's reach -- its next hit
  //   on it deals one more weapon die (F.chargeStep). THE BRACE (F.wallPush): +1 on the push's DC a bracing pike, at most +2, and the thrust after, hit or hold. LONG GUARD in the
  //   pike wall: KEEP BACK's DC +2, the brace +2. MOVING: set pikes step with MARCH and a successful push; a pike not set stays. OUT: the shield's table (moved off its square,
  //   prone, restrained, unable to act, 0 HP, its reach weapon or its training gone, its own LEAVE), and the shield before it out of the wall. KEEP BACK and the brace are the
  //   pike's one reaction (the wrinkle, standing on the desk's reading of his "Go on 1-5"): a pike that keeps a foe back cannot brace that round.
  // The seat's calls where the draft is silent, standing for his overrule: a shield-bearer sets shields, never pikes; a spear may set, but its 5 ft reaches nothing ahead of the
  // shield, so it braces (the DC) and neither keeps back nor thrusts; a set pike's KEEP BACK fires only for the square ahead of its own shield (a Long Guard's own KEEP BACK
  // still fires on any step into its reach, at +2 while joined); the brace's +2 cap counts a Long Guard's +2, so one Long Guard pike fills it
  F.pikeArm = function (u) {
    if (!u || (u.conds && u.conds.disarmed)) return null;
    var ok = function (w) { return w && !w.ranged && !w.spell && (w.kind === 'pike' || /^pike$/i.test(w.name || '') || w.kind === 'spear' || (w.reach >= 10 && w.kind !== 'whip' && !/whip/i.test(w.name || ''))); };
    if (u.weapon) return ok(u.weapon) ? u.weapon : null;
    var ks = u.attacks ? Object.keys(u.attacks) : [];
    for (var i = 0; i < ks.length; i++) if (ok(u.attacks[ks[i]])) return u.attacks[ks[i]];
    return null;
  };
  // the set shield member in the square ahead of u along `face`, of its side and front
  F.pikeFront = function (B, u, face) {
    B = B || D.battle; if (!B || !face) return null;
    var x = u.x + face[0], y = u.y + face[1];
    return B.units.filter(function (s) { return s !== u && s.side === u.side && s.x === x && s.y === y && s.conds && s.conds.wall && F.wallSet(s) && sameFace(s, { conds: { wall: { face: face } } }); })[0] || null;
  };
  // the set member u stands behind (the square behind it, against its front), if any
  F.pikeBehind = function (B, u) {
    B = B || D.battle; if (!B) return null;
    return B.units.filter(function (s) { return s !== u && s.side === u.side && s.conds && s.conds.wall && F.wallSet(s) && u.x === s.x - s.conds.wall.face[0] && u.y === s.y - s.conds.wall.face[1]; })[0] || null;
  };
  F.pikeSet = function (u, B) {
    var p = u && u.conds && u.conds.pikes;
    if (!p) return false;
    var on = !u.dead && u.hp > 0 && p.x === u.x && p.y === u.y && !u.conds.prone && !u.conds.restrained && RU.canAct(u) && F.soldiering(u) && !F.bearsShield(u) && !!F.pikeArm(u) && !!F.pikeFront(B, u, p.face);
    if (!on) { delete u.conds.pikes; if (u.turn && u.turn.pikeMove != null && !(u.turn.move > 0)) { u.turn.move = u.turn.pikeMove; delete u.turn.pikeMove; delete u.turn.rankHeld; } } // (out is out: its move given back, where held)
    return on;
  };
  F.pikeJoined = function (u, B) { B = B || D.battle; if (!F.pikeSet(u, B)) return false; var s = F.pikeFront(B, u, u.conds.pikes.face); return !!(s && F.joined(s, B)); };
  F.heldLine = function (u, B) { return F.wallSet(u) || F.pikeSet(u, B); }; // (a set shield or a set pike: its square held, no Dash, a move click asks)
  F.braceOf = function (p) { return F.longGuard(p) ? 2 : 1; };
  F.braceBonus = function (braced) { var n = 0; (braced || []).forEach(function (p) { n += F.braceOf(p); }); return Math.min(2, n); };
  F.canSetPikes = function (B, u) { return !!(u && u.turn && u.turn.bonus > 0 && F.soldiering(u) && !F.bearsShield(u) && F.pikeArm(u) && !F.pikeSet(u, B) && !u.conds.prone && !u.conds.restrained && RU.canAct(u) && F.pikeBehind(B, u)); };
  F.setPikes = function (B, u) {
    var s = F.pikeBehind(B, u); if (!s) return;
    u.turn.bonus = 0; u.conds.pikes = { x: u.x, y: u.y, face: s.conds.wall.face.slice() };
    u.turn.pikeMove = u.turn.move; u.turn.move = 0; u.turn.rankHeld = true; D.sfx('confirm'); F.faceFront(B, u); // (it turns to the front it takes: F.frontOf, 11-25)
    var j = F.joined(s, B), arm = F.pikeArm(u);
    B.card(['{y}' + u.name + '{/} sets ' + (arm && arm.name ? 'the ' + arm.name.toLowerCase() : 'pikes') + ' behind ' + s.name + ', facing ' + (FACE_WORD[u.conds.pikes.face.join(',')] || '') + '  {g}(the bonus action; ' + (j ? 'KEEP BACK on the square ahead of the shield, set against the charge, the brace on the push' : 'nothing till ' + s.name + ' is joined in a wall') + '; its square held till it leaves){/}'], 220);
  };
  F.leavePikes = function (B, u, free) {
    if (!u.conds.pikes) return;
    delete u.conds.pikes;
    if (!free && u.turn) { u.turn.bonus = 0; if (u.turn.pikeMove != null) { u.turn.move = u.turn.pikeMove; delete u.turn.pikeMove; delete u.turn.rankHeld; } }
    if (B && B.card && !free) B.card(['{g}' + u.name + ' leaves the pike wall (the bonus action).{/}'], 180);
  };
  // WAGON DRILL (RULED 2026-11-25, Griz: "3 - it more just how the patrol handles its encounters, recruitable or hostile. Dragging into unfavorable flanking could make it exciting
  // without a rescue", then "6 - yes", built on this seat; the road and its rewards lane's 11-25 sections). His patrol page, The Fare Home, THE DRAGGERS: "Wagon Drill. Trained
  // collectors, not killers: shove, grapple, drag. One dragger moves a grappled or unconscious body at half speed; two on one body move it at full speed. Against a standing foe they
  // fight at pike-reach and give ground; the pike drops the moment there is cargo to carry." and "Bearing. ... They watch the downed, not the fight." A block with `wagonDrill`
  // (the dragger, data/foes.js), at the head of its turn (js/ai.js): the downed first --
  //   CARGO: a hero of the other side at 0 and not dead, held by no one, that it can come beside this turn -- it drops the pike (out of the pike wall at no cost: its reach weapon
  //   gone), walks beside it and takes hold (the Attack; no contest from one unconscious -- the seat's call), and with the rest of its move drags it at half speed; a body a fellow
  //   dragger already holds, it takes the other side, and the two carry it at full speed (the holder drags; the second keeps beside it).
  //   WHERE: toward the patrol's footmen and sergeants -- its side's trained ranks, not a dragger -- the nearest of them, till it stands beside one: the hero lies in the patrol's
  //   flank, away from the party (his "dragging into unfavorable flanking"); no wagon off the map, no rescue. Delivered, it holds on and watches the downed (a standing foe beside
  //   it is struck with the cestus, the hand still free -- "a dragger can grapple and still strike"); it does not walk off with it.
  //   UP AGAIN: the one it holds back on its feet, it lets go and takes the pike up (a standing foe is fought at pike-reach).
  // Not built: giving ground before a standing foe; the footmen and sergeants turning on the dragged (his 01:00Z "the footmen and sergeants to focus dragged heroes" -- the 12:40Z
  // ruling makes the flank the danger; their own choice of target is unchanged)
  // THE DRAGGERS' NETS AND HOOKED PIKES (2026-11-25, the seat nets-1125; the road and its rewards lane, "THE DRAGGERS' NETS AND HOOKED PIKES"). His words: "seems like you're only
  // dragging zero hp heroes"; "lane the draggers get nets a hooked piked, and with a prone-inducing move, drag prone not 0 hp"; and of the wagons, "they'll net and drag recruits to
  // the foot/sgt who incapacitate them, fill the wagon with recruits and return them to training"; his answers to the seat's three, to the lanes desk: "1 - table stuff, won't
  // apply in grid (i.e. full damage attacks)" (no knock-out on the grid), "2 - c" (as built: heroes dragged to the flank, never caged; the wagon the NPC recruits' cell once a
  // recruiting encounter exists -- not built), "3 - not in shops" (the net the Dominion's alone).
  // Each dragger carries one net and a hooked pike (the block's `net`):
  //   THE NET (SRD 5.1, srd/04-equipment.md: martial ranged, thrown 5/15, no damage -- "A Large or smaller creature hit by a net is restrained until it is freed. A net has no effect
  //   on creatures that are formless, or creatures that are Huge or larger. A creature can use its action to make a DC 10 Strength check, freeing itself or another creature within its
  //   reach on a success. Dealing 5 slashing damage to the net (AC 10) also frees the creature without harming it, ending the effect and destroying the net. When you use an action,
  //   bonus action, or reaction to attack with a net, you can make only one attack"): thrown once a fight, the Attack action whole; the long range and a foe beside it are the
  //   ranged attack's disadvantages (rules.js RU.edges). The restraint is the webbing's (battle.js Battle.webStub: struck at on the netted one's square) marked `net`: only slashing
  //   cuts it (every other kind is in its `immune`); BREAK FREE is the netted one's own check (magic.js breakFree, DC 10), FREE FROM THE NET a friend's within its reach (F.freeNet)
  //   THE HOOK (ours, after the page's "shove, grapple, drag"; the SRD's Shove "either to knock it prone or push it away", "within your reach"): the pike's hook -- the Shove to knock
  //   prone, made at the pike's 10 ft; one attack of the Attack action, its Athletics against the other's Athletics or Acrobatics (js/ai.js shoveOff). Hooked when a fellow dragger,
  //   free of cargo, can come beside the one it fells this round; else the pike is thrust as before
  //   THE PRONE AND THE NETTED ARE CARGO TOO ("drag prone not 0 hp"): a dragger takes hold of one down, prone or netted -- against one awake the SRD's grapple contest (its Athletics
  //   against the better of the other's Athletics and Acrobatics: D.ai.grappleCheck), against one down none, as built -- and drags it as it drags the downed. Held, its speed is 0,
  //   so one prone cannot stand (SRD 5.1: standing costs half its speed -- rules.js RU.canRise); ESCAPE THE HOLD (battle.js) is its action. Up on its feet and out of the net, the
  //   one held is let go and the pike taken up (as UP AGAIN above)
  F.wagonDrill = function (u) { return !!(u && !u.dead && u.kind && D.FOES && D.FOES[u.kind] && D.FOES[u.kind].wagonDrill); };
  function downedOne(w) { return !!w && !w.dead && w.hp <= 0 && !w.object && !w.left && !w.fled && !w.familiar && !w.summon; }
  F.netted = function (w) { var r = w && w.conds && w.conds.restrained; return !!(r && r.net); };
  // what the drill takes hold of: one down, or one awake and prone or netted (not a familiar, a summoned thing or an object -- as the downed); one awake, no more than one size
  // larger and not beyond holding (SRD 5.1, Grappling)
  function cargoOne(w, u) {
    if (downedOne(w)) return true;
    if (!w || w.dead || w.hp <= 0 || w.object || w.left || w.fled || w.familiar || w.summon || w.ethereal) return false;
    if (!(w.conds.prone || F.netted(w))) return false;
    return !(u && D.Battle && D.Battle.sizeCat(w) > D.Battle.sizeCat(u) + 1) && !RU.immuneTo(w, 'grappled');
  }
  F.cargoOne = cargoOne;
  // the net: one of the other side it could land on (Large or smaller; not formless -- an ooze, the SRD's amorphous ones; not one held fast already)
  var NET_IMMUNE = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'thunder']; // (only slashing cuts it)
  function formless(w) { var f = D.FOES && w.kind && D.FOES[w.kind]; return w.type === 'ooze' || !!(f && f.type === 'ooze'); }
  F.netCan = function (u, w) { return !!(w && D.Battle && D.Battle.sizeCat(w) <= D.Battle.SIZE.L && !formless(w) && !RU.immuneTo(w, 'restrained') && !w.conds.restrained && !w.object); };
  F.netOf = function (u) { var f = u && !u.dead && u.kind && D.FOES && D.FOES[u.kind]; return f && f.net || null; }; // (read off the block: the net is the dragger's kit, not a unit field)
  F.netOn = function (B, u, w) { w.conds.restrained = { dc: 10, by: u.id, net: true, webbing: { ac: 10, hp: 5, max: 5, immune: NET_IMMUNE.slice(), net: true } }; FX.ring(w, 'bone', 26); FX.sparkle(w, 'bone', 12); };
  F.throwNet = function* (B, u, w) {
    var N = F.netOf(u), T = u.turn; if (!N || u.netGone) return false;
    T.action = 0; T.attacksLeft = 0; u.netGone = true; // ("you can make only one attack": the Attack action whole)
    var shot = { name: 'Net', atk: N.atk, dice: '0', mod: 0, type: 'net', range: N.range || [5, 15], ranged: true, fx: 'bolt' };
    u.facing = B.faceTo(u, w); u.anim = D.spr && D.spr.anim(u.sheet, 'net') ? 'net' : 'attack'; u.animT = B.t; // (a sheet's own `net` row when it comes: art-wanted 106)
    FX.projectile(u, w, 'bolt'); yield { fx: 1 };
    var e = RU.edges(u, w, shot), r = RU.d20(e.net, u), tot = r.pick + N.atk + (e.pen || 0), ac = RU.ac(w) + G.los(u, w).cover, hit = r.pick === 20 || (r.pick !== 1 && tot >= ac);
    var why = (e.adv.length ? '  {n}adv: ' + e.adv.join(', ') + '{/}' : '') + (e.dis.length ? '  {o}dis: ' + e.dis.join(', ') + '{/}' : '') + (e.pen ? '  {o}' + e.penWhy + ' ' + e.pen + '{/}' : '');
    B.card(['{r}' + Nm(B, u) + '{/} > {y}' + nm(B, w) + '{/}  NET  {g}(Wagon Drill: thrown, 5/15 ft){/}', 'd20 ' + (r.rolls.length > 1 ? RU.fmtRolls(r.rolls) + '>' : '') + r.pick + ' ' + RU.sign(N.atk) + ' = ' + tot + '  vs AC ' + ac + '  ' + (hit ? '{n}HIT{/}: {o}RESTRAINED{/} {g}(free: a DC 10 STR check, an action -- or 5 slashing to the net, AC 10){/}' : '{g}MISS{/}') + why], 360);
    D.sfx(hit ? 'hit' : 'miss');
    if (hit) F.netOn(B, u, w); else FX.float('MISS', w, D.PAL.ramps.silver[5]);
    yield 34; u.anim = 'idle';
    return hit;
  };
  // the net's chance on w from where u stands: its +4 against w's AC and cover, with the ranged attack's edges (the seat's: thrown at 1 in 5 or better, F.NET_FAIR)
  F.NET_FAIR = 0.2;
  F.pNet = function (u, w) {
    var N = F.netOf(u); if (!N) return 0;
    var shot = { name: 'Net', atk: N.atk, dice: '0', mod: 0, type: 'net', range: N.range || [5, 15], ranged: true }, e = RU.edges(u, w, shot);
    var net = e.adv.length && !e.dis.length ? 1 : e.dis.length && !e.adv.length ? -1 : 0, p = Math.max(0.05, Math.min(0.95, (21 - (RU.ac(w) + G.los(u, w).cover - N.atk - (e.pen || 0))) / 20));
    return net > 0 ? 1 - (1 - p) * (1 - p) : net < 0 ? p * p : p;
  };
  // FREE FROM THE NET (the SRD's "freeing itself or another creature within its reach"): the netted within u's reach, its own side's (BREAK FREE is the netted one's own)
  F.freeNetFor = function (B, u) { return B.units.filter(function (w) { return w !== u && F.netted(w) && !G.hostile(u, w) && G.standing(w) && G.dist(u, w) <= G.reachOf(u); }); };
  F.freeNet = function* (B, u, w) {
    var r = w && w.conds.restrained; if (!r || !r.net || !u.turn || !(u.turn.action > 0)) return false;
    var en = u.conds.enlarged, ce = RU.checkEdges(u, 'str'), adv = !!(en && !en.down) || ce.adv.length > 0, dis = !!(u.conds.poisoned || u.conds.frightened || (en && en.down)) || ce.dis.length > 0;
    var a = D.d(20), b = D.d(20), d20 = adv && !dis ? Math.max(a, b) : dis && !adv ? Math.min(a, b) : a;
    var own = u.athletics, bonus = (own != null ? own : D.mod(u.abil.str) + (u.cls === 'fighter' ? u.prof : 0)) - RU.shaken(u), tot = d20 + bonus; // (Athletics, as breakFree and PULL OUT read it)
    u.turn.action = 0; RU.spendHelp(u); u.facing = B.faceTo(u, w); u.anim = 'attack'; u.animT = B.t;
    B.card([(u.side === 'foe' ? '{r}' + Nm(B, u) : '{y}' + u.name) + '{/} pulls at the net on ' + nm(B, w) + ': STR d20 ' + d20 + (adv !== dis ? (adv ? ' {n}(advantage){/}' : ' {o}(disadvantage){/}') : '') + ' ' + RU.sign(bonus) + ' = ' + tot + ' vs DC ' + r.dc + '  ' + (tot >= r.dc ? '{n}FREE{/}' : '{g}still caught{/}')], 260);
    D.sfx(tot >= r.dc ? 'confirm' : 'miss'); yield 20; u.anim = 'idle';
    if (tot >= r.dc) { B.webGone(w, 'pulled off'); return true; }
    return false;
  };
  // THE HOOK: the Shove to knock prone at the pike's reach (js/ai.js shoveOff, how 'prone')
  F.hook = function* (B, u, w) {
    var T = u.turn; if (!T || !(T.action > 0) || !u.attacks || !u.attacks.pike) return false;
    B.card(['{r}' + Nm(B, u) + '{/} reaches the pike\'s hook for ' + nm(B, w) + ': {o}HOOK{/}  {g}(Wagon Drill: the Shove, to knock prone, at the pike\'s 10 ft){/}'], 200);
    yield 8;
    yield* D.ai.shoveOff(B, u, w, { how: 'prone', anim: 'hook' }); // (its sheet's `hook` row when it comes: art-wanted 106)
    T.action = 0; T.attacksLeft = 0;
    return !!w.conds.prone;
  };
  // a fellow dragger free of cargo that could come beside w this round (the hook's reason: the one felled is taken before it stands)
  function mateFor(B, u, w) { return B.units.some(function (x) { return x !== u && x.side === u.side && F.wagonDrill(x) && !x.dead && x.hp > 0 && RU.canAct(x) && !F.cargoOf(B, x) && !x.sharing && G.dist(x, w) <= (x.speed || 30) + 5; }); }
  // the quarry (the page's "the draggers pick their target: the smallest, the hurt, the one standing apart"): the most hurt, then the nearest
  function quarry(list, u) { return list.slice().sort(function (a, b) { return (a.hp / Math.max(1, a.maxhp)) - (b.hp / Math.max(1, b.maxhp)) || G.dist(u, a) - G.dist(u, b); })[0] || null; }
  function* netOrHook(B, u) {
    var T = u.turn; if (!(T.action > 0)) return false;
    yield* F.aiWall(B, u); // (the rank first, as a piker takes it -- the walk and SET PIKES, the bonus action; then the hook or the net with the action, from there)
    if (u.dead || u.hp <= 0 || !(T.action > 0) || !RU.canAct(u)) return false;
    // (not one the patrol holds already: "two draggers break for the body while the line screens; the other two circle wide for the next drop" -- his page, the quarry logic)
    var hs = B.units.filter(function (w) { var g = w.conds.grappled, hd = g && B.units.filter(function (x) { return x.id === g.by; })[0]; return G.hostile(u, w) && G.standing(w) && !w.object && !w.dead && w.hp > 0 && !RU.charmedBy(u, w) && !(hd && hd.side === u.side); });
    // the hook first, where a fellow can take the one it fells (a contest, about even); then the net (a ranged attack, at disadvantage beside a foe and past 5 ft: the SRD's)
    if (u.attacks && u.attacks.pike) {
      var hq = quarry(hs.filter(function (w) { return !w.conds.prone && !w.noProne && !RU.immuneTo(w, 'prone') && (w.size || 1) <= (u.size || 1) + 1 && G.dist(u, w) <= G.reachOf(u, u.attacks.pike.reach) && mateFor(B, u, w); }), u);
      if (hq) { yield* F.hook(B, u, hq); return true; }
    }
    var N = F.netOf(u);
    if (N && !u.netGone) { // (thrown where it is likeliest to land -- the soft one, then the hurt -- and only at a fair chance, F.NET_FAIR: else the pike, as before)
      var nq = hs.filter(function (w) { return F.netCan(u, w) && G.range(u, w) <= (N.range || [5, 15])[1] && G.los(u, w).clear !== false; }).map(function (w) { return { w: w, p: F.pNet(u, w) }; })
        .filter(function (o) { return o.p >= F.NET_FAIR; }).sort(function (a, b) { return b.p - a.p || (a.w.hp / Math.max(1, a.w.maxhp)) - (b.w.hp / Math.max(1, b.w.maxhp)); })[0];
      if (nq) { yield* F.throwNet(B, u, nq.w); return true; }
    }
    return false;
  }
  F.cargoOf = function (B, u) { var w = u && u.grappling ? B.units.filter(function (x) { return x.id === u.grappling; })[0] : null; return w && !w.dead && w.conds.grappled && w.conds.grappled.by === u.id ? w : null; };
  function drillRanks(B, u) { return B.units.filter(function (w) { return w !== u && w.side === u.side && !w.dead && w.hp > 0 && !w.object && !F.wagonDrill(w) && F.soldiering(w); }); }
  function dropPike(B, u) {
    if (u.conds.pikes) { delete u.conds.pikes; if (u.turn && u.turn.pikeMove != null) { u.turn.move = u.turn.pikeMove; delete u.turn.pikeMove; } } // (out of the pike wall at no cost: its reach weapon gone)
    if (u.turn) delete u.turn.rankHeld;
    if (u.pikeDown || !u.attacks || !u.attacks.pike) return;
    u.pikeDown = { atk: u.attacks.pike, reach: u.reach }; var rest = {}; Object.keys(u.attacks).forEach(function (k) { if (k !== 'pike') rest[k] = u.attacks[k]; }); u.attacks = rest; u.reach = 5;
    B.card(['{y}' + u.name + '{/} drops the pike: there is cargo to carry  {g}(Wagon Drill: the cestus leaves the hand free){/}'], 200);
  }
  function takePike(B, u) { if (!u.pikeDown) return; u.attacks = Object.assign({ pike: u.pikeDown.atk }, u.attacks); u.reach = u.pikeDown.reach; delete u.pikeDown; B.card(['{g}' + u.name + ' takes the pike up again.{/}'], 160); }
  function nearestTo(list, p) { return list.slice().sort(function (a, b) { return G.dist(p, a) - G.dist(p, b); })[0] || null; }
  // a square beside `w` the dragger can stand on and reach with `mv` feet, the cheapest (its own, if it stands beside already)
  function besideSq(B, u, w, mv) {
    if (G.dist(u, w) <= 5) return [u.x, u.y];
    var rm = G.reach(u, mv), best = null;
    Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand) return; var xy = k.split(',').map(Number); if (G.dist(u, w, xy[0], xy[1]) > 5) return; if (!best || e.cost < best.c) best = { q: xy, c: e.cost }; }); // (u stood at xy: G.dist's ax, ay)
    return best ? best.q : null;
  }
  // the drag: toward the nearest of the patrol's ranks, the body trailing (battle.js moveAlong pulls it into the square behind); a second dragger sharing it walks beside
  // (judged by where the BODY lies: beside one of the ranks is delivered; else the dragger's square, of those its drag reaches, whose free square beside it puts the body nearest a
  // rank -- and, between two alike, farther from the party -- the body set down there, beside the dragger, at the drag's end)
  function bodyNear(ranks, body, x, y) { return ranks.length ? Math.min.apply(null, ranks.map(function (r) { return G.dist(r, body, null, null, x, y); })) : 1e9; }
  function bodySpot(B, u, body, ranks, ux, uy) {
    var best = null;
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      var x = ux + dx, y = uy + dy, oc = G.occupant(x, y); if ((!dx && !dy) || (oc && oc !== body) || !G.canStand(body, x, y)) continue;
      var d = bodyNear(ranks, body, x, y); if (!best || d < best.d) best = { q: [x, y], d: d };
    }
    return best;
  }
  F.drillDone = function (B, u, body) { return bodyNear(drillRanks(B, u), body, body.x, body.y) <= 5; };
  function* drillDrag(B, u, body, mv) {
    var ranks = drillRanks(B, u); if (!ranks.length || !(mv >= 5)) return false;
    var now = bodyNear(ranks, body, body.x, body.y); if (now <= 5) return false; // (delivered: it lies beside the patrol's ranks)
    var heroes = B.units.filter(function (w) { return G.hostile(u, w) && !w.dead && w.hp > 0 && !w.object; });
    var rm = G.reach(u, mv), best = null;
    Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand || !e.cost) return; var xy = k.split(',').map(Number), sp = bodySpot(B, u, body, ranks, xy[0], xy[1]); if (!sp) return; var far = heroes.length ? Math.min.apply(null, heroes.map(function (h) { return G.dist(h, body, null, null, sp.q[0], sp.q[1]); })) : 0, s = sp.d * 10 - far; if (!best || s < best.s) best = { q: xy, d: sp.d, s: s }; });
    if (!best || best.d >= now) return false;
    var sh = body.conds.grappled && body.conds.grappled.share ? B.units.filter(function (x) { return x.id === body.conds.grappled.share; })[0] : null;
    u.turn.move = mv; yield* B.exec(u, { do: 'move', x: best.q[0], y: best.q[1] }); u.turn.move = 0;
    var put = bodySpot(B, u, body, ranks, u.x, u.y); // (set down beside it where it lies nearest the ranks -- the drag's end)
    if (put && (put.q[0] !== body.x || put.q[1] !== body.y)) { body.tween = { fx: body.x, fy: body.y, fz: G.gzAt(body, body.x, body.y), t: 0, dur: B.pace ? B.pace(10, true) : 10, mode: 'walk' }; body.x = put.q[0]; body.y = put.q[1]; if (G.setup && B.map) G.setup(B.map, B.units); }
    if (sh && !sh.dead && sh.hp > 0 && G.dist(sh, body) > 5) { // (the second keeps beside it: the free square beside the body nearest where it stood)
      var spot = null; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var x = body.x + dx, y = body.y + dy; if ((dx || dy) && G.canStand(sh, x, y) && !G.occupant(x, y) && (!spot || G.dist(sh, sh, null, null, x, y) < G.dist(sh, sh, null, null, spot[0], spot[1]))) spot = [x, y]; }
      if (spot) { sh.tween = { fx: sh.x, fy: sh.y, fz: G.gzAt(sh, sh.x, sh.y), t: 0, dur: B.pace ? B.pace(10, true) : 10, mode: 'walk' }; sh.x = spot[0]; sh.y = spot[1]; if (G.setup && B.map) G.setup(B.map, B.units); }
    }
    var m = nearestTo(ranks, body);
    B.card(['{y}' + u.name + '{/} drags ' + nm(B, body) + ' toward ' + nm(B, m) + ' -- into the patrol\'s flank  {g}(' + (sh ? 'two carry it: full speed' : 'half speed') + '){/}'], 220);
    return true;
  }
  F.aiWagonDrill = function* (B, u) {
    if (!F.wagonDrill(u) || mine(u) || !u.turn || u.dead || u.hp <= 0 || !RU.canAct(u)) return false;
    var T = u.turn, held = F.cargoOf(B, u);
    if (held && !cargoOne(held, u)) { B.letGo(u, held, 'release'); takePike(B, u); return false; } // (up again -- on its feet and out of the net: a standing foe, fought at pike-reach)
    if (!held && u.sharing) { var shd = B.units.filter(function (x) { return x.id === u.sharing; })[0]; if (shd && cargoOne(shd, u) && shd.conds.grappled && shd.conds.grappled.share === u.id && G.dist(u, shd) <= 5) return true; delete u.sharing; } // (the second's turn: it keeps its side)
    var mvAll = function () { return Math.max(T.move || 0, T.pikeMove || 0); }; // (a set pike's move is held in pikeMove)
    if (held) {
      var two = held.conds.grappled.share && B.units.some(function (x) { return x.id === held.conds.grappled.share && !x.dead && x.hp > 0 && G.dist(x, held) <= 5; });
      var mv = two ? T.move : 5 * Math.floor((T.move || 0) / 10);
      var moved = yield* drillDrag(B, u, held, mv);
      if (!moved) { var foeBy = B.units.filter(function (w) { return G.hostile(u, w) && !w.dead && w.hp > 0 && !w.object && G.dist(u, w) <= 5; })[0]; T.move = 0; return !foeBy; } // (delivered: it holds on, and strikes a standing foe beside it with the cestus)
      return true;
    }
    // no cargo yet: the downed, the prone and the netted, nearest first -- one held by no one, or one a fellow dragger holds alone (the other side)
    var downs = B.units.filter(function (w) { if (!cargoOne(w, u) || !G.hostile(u, w)) return false; var g = w.conds.grappled; if (!g) return true; var hd = B.units.filter(function (x) { return x.id === g.by; })[0]; return !!(hd && F.wagonDrill(hd) && hd.side === u.side && !g.share); });
    var pick = null, mvNow = mvAll();
    downs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); }).some(function (w) { var q = besideSq(B, u, w, mvNow); if (q) pick = { w: w, q: q }; return !!q; });
    if (!pick) { if (u.pikeDown) takePike(B, u); return yield* netOrHook(B, u); } // (none it can come beside this turn: the pike in hand -- the net, the hook, or it fights as it can)
    dropPike(B, u); // (out of the pike wall at no cost, its held move given back)
    if (T.move < mvNow) T.move = mvNow;
    if (pick.q[0] !== u.x || pick.q[1] !== u.y) yield* B.exec(u, { do: 'move', x: pick.q[0], y: pick.q[1] });
    var w = pick.w; if (G.dist(u, w) > 5 || !cargoOne(w, u)) return true;
    var g0 = w.conds.grappled;
    if (g0) { g0.share = u.id; u.sharing = w.id; T.move = 0; B.card(['{y}' + u.name + '{/} takes the other side of ' + nm(B, w) + '  {g}(Wagon Drill: two on one body carry it at full speed){/}'], 200); return true; }
    if (!(T.action > 0 || T.attacksLeft > 0)) return true;
    T.action = 0; T.attacksLeft = 0;
    var awake = w.hp > 0, how = w.hp <= 0 ? 'down' : F.netted(w) ? 'in the net' : 'prone';
    if (awake) { // (one awake: the SRD's grapple, its Athletics against the better of the other's -- lost, the attack is spent and the drill waits a turn)
      var won = yield* D.ai.grappleCheck(B, u, w, 'WAGON DRILL'); u.anim = 'idle';
      if (!won || w.dead) return true;
    }
    w.conds.grappled = { by: u.id }; u.grappling = w.id; D.sfx('confirm');
    B.card(['{y}' + u.name + '{/} takes hold of ' + nm(B, w) + ', ' + how + ': {o}WAGON DRILL{/}  {g}(the Attack; ' + (awake ? 'held, its speed 0' + (w.conds.prone ? ': it cannot stand' : '') : 'no contest from one unconscious') + '; dragged at half speed){/}'], 240);
    yield 10;
    yield* drillDrag(B, u, w, 5 * Math.floor((T.move || 0) / 10));
    return true;
  };
  F.markTargets = function (B, u) { return hostileNear(B, u, 60).filter(function (w) { return !w.dead && w.hp > 0 && !w.object && !(w.conds.calledMark && w.conds.calledMark.by === u.id); }); };
  F.callMark = function (B, u, t) {
    u.turn.bonus = 0; spendPlay(u); t.conds.calledMark = { by: u.id, side: u.side, hit: {} }; D.sfx('confirm');
    B.card(['{y}' + u.name + '{/} calls the mark: {r}' + D.Battle.nm(t) + '{/}  {g}(each friend\'s first hit on it +2 till ' + u.name + '\'s next turn){/}'], 240);
  };
  // the class AI's: a bonus action on a foe that two or more friends stand beside (TX.FIRST, as the Window's Hand on the Neck)
  TX.FIRST.unshift(function* (B, u) {
    if (!F.knowsPlay(u, 'callmark') || !canPlay(u) || !(u.turn.bonus > 0) || mine(u)) return;
    var best = null;
    F.markTargets(B, u).forEach(function (t) { var n = TX.alliesOf(B, u).filter(function (w) { return w !== u && G.standing(w) && G.dist(w, t) <= 5; }).length; if (n >= 2 && (!best || n > best.n)) best = { t: t, n: n }; });
    if (best) { F.callMark(B, u, best.t); yield 10; }
  });
  // HOLD GROUND: a push or a knockdown the fighter would take -- the reaction and an opening, spent on their own; true when it holds (magic.js M.push, battle.js, here)
  F.holdGround = function (B, w, what) {
    if (F.deepRoots && F.deepRoots(B, w)) { if (B && B.card) B.card(['{n}The roots hold{/} ' + w.name + '  {g}(the Aura of Deep Roots: not ' + (what === 'push' ? 'moved' : 'knocked prone') + '){/}'], 220); return true; } // (the Green Return's, 7: no reaction -- 10-30)
    if (!F.knowsPlay(w, 'holdground') || !(w.reaction > 0) || !feat(w, 'openings') || w.dead || w.hp <= 0 || !RU.canAct(w)) return false;
    w.reaction = 0; w.feats.openings--; w.conds.heldGround = true; // (held: a shove's "nowhere to go, knocked flat" reads it -- ai.js; gone at its own turn)
    if (B && B.card) B.card(['{y}' + w.name + '{/} holds ground  {g}(HOLD GROUND: not ' + (what === 'push' ? 'moved' : 'knocked prone') + '; the reaction and an opening){/}'], 220);
    return true;
  };
  // ------------------------------------------------------------------ the feat Follow-Through (ours, 10-30 -- js/rules.js R.FEATS.followthrough; the role of the PHB's
  // Great Weapon Master): with a heavy melee weapon, the blow that drops a foe carries its excess on (battle.js), and WIDE SWING, once a turn before a swing, free -- a hit
  // twice the proficiency bonus more, a miss the next attack that turn at disadvantage. The class AI swings wide when the blow is near sure (TX.FIRST)
  // the feat Held Breath (ours, 10-30 -- js/rules.js R.FEATS.heldbreath): on while the hero has not moved this turn (turn.moved); battle.js and rules.js read it
  F.heldBreath = function (u) { var h = u && u.src; return !!(h && window.DS.R.hasFeat(h, 'heldbreath') && (u.abil || h.abil).dex >= 13); };
  F.breathOn = function (u) { return F.heldBreath(u) && !!u.turn && !(u.turn.moved > 0); };
  F.followThrough = function (u) { var h = u && u.src; return !!(h && window.DS.R.hasFeat(h, 'followthrough') && (u.abil || h.abil).str >= 13); };
  F.heavyInHand = function (u) { return !!(u && u.weapon && !u.weapon.ranged && (u.weapon.props || []).indexOf('heavy') >= 0); };
  F.wideSwing = function (B, u) { u.conds.wideSwing = true; u.turn.wideDone = true; D.sfx('crit'); B.card(['{o}' + u.name + ' winds up a wide swing.{/}  {g}(a hit: ' + 2 * (u.prof || 2) + ' more; a miss: the next attack this turn at disadvantage){/}'], 200); };
  TX.FIRST.unshift(function* (B, u) {
    var T = u.turn;
    if (mine(u) || !F.followThrough(u) || !F.heavyInHand(u) || !T || T.wideDone || u.conds.wideSwing || !(T.action > 0 || T.attacksLeft > 0)) return;
    var t = hostileNear(B, u, G.armOf(u)).sort(function (a, b) { return RU.ac(a) - RU.ac(b); })[0]; // (a glaive's 10 ft: G.armOf, 10-30)
    if (t && RU.ac(t) - (u.weapon.atk || 0) <= 5) { F.wideSwing(B, u); yield 6; } // (a hit on 6 or better: four in five)
  });
  // ------------------------------------------------------------------ the feat Long Guard (ours, 10-30 -- js/rules.js R.FEATS.longguard; the leveling lane §8 B, the role of the
  // PHB's Polearm Master, leveling-srd-by-class.md 6.3; RULED, Griz: "go with the leans" -- the SRD's reach weapons first, then this as drafted). With a reach weapon in hand:
  // KEEP BACK, the reaction when a creature it can see moves into its reach -- a STR save (DC 8 + proficiency + STR) or pushed 5 ft back, out of reach, and its move ends
  // there (battle.js moveAlong, where a step lands, as GIVE GROUND; a player's hero asked, the AI's always); SET AGAINST THE CHARGE -- one that came 20 ft or more straight
  // at it this turn and stands within its reach: its next hit on that one before the end of its next turn deals one more weapon die (F.chargeStep each step; battle.js)
  F.longGuard = function (u) { var h = u && u.src; return !!(h && window.DS.R.hasFeat(h, 'longguard') && (u.abil || h.abil).str >= 13); };
  // THE SPEAR TOO (RULED 2026-11-19, Griz: "wouldn't pushback applied to the spear keep the foe out of the 8 squares around then, keeping them 5 ft away versus 10 for longer
  // polearms? If so, we'll include spears in the feat"): a spear in hand uses both halves at its own 5 ft -- KEEP BACK on the step to adjacent, the mover left 10 ft off
  F.reachInHand = function (u) { return !!(u && u.weapon && !u.weapon.ranged && (u.weapon.reach >= 10 || u.weapon.kind === 'spear')); };
  // THE PIKE WALL gives it (11-21, Shape A): a joined pike keeps back a foe stepping into the square ahead of its own shield, Long Guard or not; a Long Guard pike joined, +2 on the DC
  function pikeWatch(B, w, mover, from) {
    if (!F.pikeJoined(w, B)) return false;
    var fc = w.conds.pikes.face, s = F.pikeFront(B, w, fc), ax = s.x + fc[0], ay = s.y + fc[1];
    var on = function (ft) { return ft.some(function (p) { return p[0] === ax && p[1] === ay; }); };
    return on(G.foot(mover)) && !on(G.foot(mover, from.x, from.y)) && G.dist(w, mover) <= G.armOf(w);
  }
  F.keepBack = function* (B, mover, from) {
    var ws = B.units.filter(function (w) { return w !== mover && G.hostile(w, mover) && ((F.longGuard(w) && F.reachInHand(w)) || F.pikeJoined(w, B)) && w.reaction > 0 && G.standing(w) && RU.canAct(w) && !mover.object && D.magic.sees(B, w, mover); });
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i], r = G.armOf(w), lg = F.longGuard(w) && F.reachInHand(w), pw = F.pikeJoined(w, B), arm = (lg ? w.weapon : F.pikeArm(w)) || w.weapon || { name: 'pike' }, ab = w.abil || (w.src && w.src.abil) || { str: 10 };
      var dc = 8 + (w.prof || 2) + D.mod(ab.str) + (lg && pw ? 2 : 0); // (Long Guard in the pike wall: +2 -- his "polearm-masters in the pike wall get a bonus to theirs")
      if (mover.dead || mover.hp <= 0) continue;
      var came = lg && G.dist(w, mover) <= r && G.dist(w, mover, null, null, from.x, from.y) > r; // (this step brought it into the reach)
      if (!came && !(pw && pikeWatch(B, w, mover, from))) continue;
      if (mine(w)) {
        var go = yield { prompt: { who: w, title: w.name + ': KEEP BACK?', lines: [Nm(B, mover) + (pw && !came ? ' steps up to the shield before you' : ' comes within the ' + arm.name.toLowerCase() + '\'s reach') + ': STR DC ' + dc + ', or pushed 5 ft back and its move ended (your reaction' + (pw ? '; it is the brace\'s too' : '') + ').'], opts: [{ label: 'KEEP IT BACK', value: 1 }, { label: 'LET IT COME', value: 0, no: true }] } };
        if (!go) continue;
      }
      w.reaction = 0; var sv = RU.save(mover, 'str', dc); D.sfx(sv.ok ? 'miss' : 'hit');
      if (D.spr && D.spr.anim(w.sheet, 'keepback')) { w.facing = B.faceTo(w, mover); w.anim = 'keepback'; w.animT = B.t; yield D.spr.duration(w.sheet, 'keepback') || 30; if (w.anim === 'keepback') w.anim = 'idle'; } // (the point out, where the sheet has it: guard_p2's, ART-WANTED-86, 11-19 -- his "stabbing empty space to keep the foe out of that space")
      B.card(['{y}' + Nm(B, w) + '{/} keeps ' + nm(B, mover) + ' back with the ' + arm.name.toLowerCase() + (pw ? ' over the shield' : '') + '  STR ' + RU.saveText(sv) + ' vs DC ' + dc + '  ' + (sv.ok ? '{n}PRESSES IN{/}' : '{o}HELD OFF{/}') + (pw ? '  {g}(the pike wall: its reaction)' + (lg ? ' +2 Long Guard' : '') + '{/}' : '')], 240);
      if (sv.ok) continue;
      D.magic.push(B, w, mover, 1);
      return true; // (held off: its move ends there, pushed or not)
    }
    return false;
  };
  // SET AGAINST THE CHARGE, kept on the mover's turn: for each Long Guard one hostile to it, where it began (the distance) and whether every step has closed on it. Come 20 ft or
  // more straight at it and within its reach, the mark; out of its reach again this turn, gone
  F.chargeStep = function (B, mover, from) {
    var T = mover.turn; if (!T) return;
    // (THE PIKE WALL gives it, 11-21: for a joined pike the charge is measured at the shield before it -- "came 20 ft or more straight at the shield" -- and the mark wants the foe
    // in the pike's reach)
    B.units.forEach(function (w) {
      if (w === mover || !G.hostile(w, mover) || !G.standing(w)) return;
      var lg = F.longGuard(w) && F.reachInHand(w), pw = !lg && F.pikeJoined(w, B);
      if (!lg && !pw) return;
      var at = lg ? w : F.pikeFront(B, w, w.conds.pikes.face), arm = (lg ? w.weapon : F.pikeArm(w)) || { name: 'pike' };
      var c = (T.charge = T.charge || {})[w.id], d0 = G.dist(at, mover, null, null, from.x, from.y), d1 = G.dist(at, mover), dw = G.dist(w, mover);
      if (!c) c = T.charge[w.id] = { d0: d0, straight: true };
      if (d1 >= d0) c.straight = false;
      var sa = mover.conds.setAgainst;
      if (c.straight && c.d0 - d1 >= 20 && dw <= G.armOf(w)) { if (!(sa && sa.by === w.id)) { mover.conds.setAgainst = { by: w.id, till: { who: w.id, at: 'end', n: w === B.active ? 2 : 1 } }; B.card(['{y}' + Nm(B, w) + '{/} sets the ' + arm.name.toLowerCase() + ' against the charge' + (pw ? ' over ' + at.name + '\'s shield' : '') + '.  {g}(the next hit on ' + nm(B, mover) + ': one more weapon die){/}'], 200); } }
      else if (sa && sa.by === w.id && dw > G.armOf(w)) delete mover.conds.setAgainst;
    });
  };
  // ------------------------------------------------------------------ the feat Fortune's Due (ours, 10-30 -- js/rules.js R.FEATS.fortunesdue; the leveling lane §8 C, the role of the
  // PHB's Lucky, leveling-srd-by-class.md 6.3; RULED 10-30 by the desk's relay, his "go with the leans"): each attack the hero misses, save it fails or check it fails gives a Due
  // (three at most; all gone at a short or long rest -- js/rules.js R.refresh, deep16/js/pocket.js PK.shortRest; kept in u.feats.dues, so they ride wherever a feature's uses do).
  // Spent all at once, 1d4 apiece, after the d20: on the hero's own attack roll a prompt, asked only where the Dues could turn the miss (battle.js attack; an AI-run hero by the
  // save's rule); on a save by the rule, when their average (2.5 a Due) reaches the DC (deep16/js/rules.js RU.save). Checks give Dues; they are not spent on them
  F.fortune = function (u) { var h = u && u.src; return !!(h && window.DS.R.hasFeat(h, 'fortunesdue')); };
  F.dues = function (u) { return F.fortune(u) && u.feats ? u.feats.dues || 0 : 0; };
  F.dueGain = function (u) {
    if (!u || u.dead || !F.fortune(u)) return;
    u.feats = u.feats || {}; var n = u.feats.dues || 0;
    if (n < 3) { u.feats.dues = n + 1; if (FX && FX.float) FX.float('a due (' + (n + 1) + ')', u, D.PAL.ramps.gold ? D.PAL.ramps.gold[4] : '#fc0'); }
  };
  F.dueSpend = function (u) { var n = F.dues(u); if (!n) return 0; u.feats.dues = 0; D.sfx('crit'); return D.roll(n + 'd4').total; };
  F.fortuneSave = function (u, need) { var n = F.dues(u); return n && need > 0 && 2.5 * n >= need ? F.dueSpend(u) : 0; };
  F.fortuneAtk = function* (B, u, need, total, ac) {
    var n = F.dues(u); if (!n || need <= 0 || 4 * n < need) return 0; // (only where the Dues could turn it)
    if (mine(u)) {
      var go = yield { prompt: { who: u, title: u.name + ': FORTUNE\'S DUE?', lines: ['The ' + total + ' misses AC ' + ac + ' by ' + need + '.', 'Spend ' + (n === 1 ? 'the Due' : 'all ' + n + ' Dues') + ': +' + n + 'd4 (' + n + ' to ' + 4 * n + ').'], opts: [{ label: n === 1 ? 'SPEND IT' : 'SPEND THEM', value: 1 }, { label: 'NOT NOW', value: 0 }] } };
      if (!go) return 0;
    } else if (2.5 * n < need) return 0;
    return F.dueSpend(u);
  };
  // ------------------------------------------------------------------ the first batch's feats (ours, 10-30 -- js/rules.js R.FEATS; the leveling lane §8 E, his "approve all in the side by
  // side"; leveling-srd-by-class.md 2.3). Each read off the hero's sheet (u.src)
  F.hasFeat = function (u, id) { return !!(u && u.src && window.DS.R.hasFeat(u.src, id)); };
  // HOLD THE THREAD (War Caster's role): a failed CON save for concentration kept for a slot of 1st level or higher -- the lowest no higher than the spell's own, taken at once
  // (magic.js M.concCheck: the save comes at a blow's end, with no asking; the seat's call, his to overrule); 0 when none is spent
  F.holdThread = function (u) {
    if (!F.hasFeat(u, 'holdthethread') || !u.conc || !u.slots) return 0;
    var sp = M.data && M.data(u.conc.id), L = Math.max(1, (sp && sp.level) || 1);
    for (var i = 0; i < Math.min(L, u.slots.length); i++) if (u.slots[i] > 0) { u.slots[i]--; return i + 1; }
    return 0;
  };
  // SUDDEN DARK (Skulker's role): a bonus action, one flame within 30 ft it can see that no magic made goes out -- a torch or a lantern in a hand or on the floor, a map's
  // brazier or sconce, a campfire (a Flaming Sphere is magic). Picked on the grid as Rootdrag's squares are (ui.js `squares`); a hero's torch goes back in the pack
  F.darkTargets = function (B, u) {
    var out = [], L = D.light;
    (B.lights || []).forEach(function (l) {
      if (!l.flame || l.kind === 'sphere') return;
      var q = { x: Math.round(l.x), y: Math.round(l.y), size: 1 }; if (G.dist(u, q) > 30 || !G.los(u, q).clear) return;
      out.push({ x: q.x, y: q.y, l: l, name: l.kind === 'map' ? 'the fire' : 'the ' + (L && L.word ? L.word(l) : l.kind) + ' on the floor' });
    });
    B.units.forEach(function (w) {
      if (!w.torch || !w.torch.lit || !G.present(w) || G.dist(u, w) > 30 || (w !== u && !M.sees(B, u, w))) return;
      out.push({ x: w.x, y: w.y, w: w, name: (w === u ? 'your' : nm(B, w) + '\'s') + ' ' + (L && L.word ? L.word(w.torch) : 'torch') });
    });
    return out;
  };
  F.suddenDark = function (B, u, q) {
    u.turn.bonus = 0; D.sfx('cancel');
    if (q.w) { if (q.w.side === 'party' && !q.w.familiar) D.light.douseTorch(B, q.w); else { delete q.w.torch; D.light.regrip(q.w); } }
    if (q.l) B.lights = (B.lights || []).filter(function (l) { return l !== q.l; });
    B.lightMap = null; FX.ring({ x: q.x, y: q.y, size: 1 }, 'violet', 20);
    B.card(['{y}' + u.name + '{/}: {p}SUDDEN DARK{/} -- ' + q.name + ' goes out.  {g}(a bonus action){/}'], 220);
  };
  // STAND IN (Sentinel's and the Protection style's role): the reaction when an attack hits a friend within 5 ft -- the hero leans in and takes it, and the blow meets the
  // hero's own AC (battle.js attack, after the hit and before the damage). Nobody moves (10-31, Griz: "that bonus action swap positions feat or whatever isn't gonna work,
  // forced movement change. Mechanically similar without swapping character locations (leans in, takes hit, returns to square) should be fine" -- till then the two traded
  // places). A player's hero asked; the AI's when the blow would miss it, or the friend is near its last
  F.standIn = function* (B, att, tgt, total, nat) {
    var ws = B.units.filter(function (w) { return w !== tgt && w !== att && w.side === tgt.side && F.hasFeat(w, 'standin') && w.reaction > 0 && G.standing(w) && RU.canAct(w) && !w.conds.prone && !w.conds.restrained && G.dist(w, tgt) <= 5 && !(w.hang && G.hanging(w)) && !tgt.object && !w.riding; });
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i], ac = RU.ac(w), miss = nat !== 20 && total < ac;
      if (mine(w)) {
        var go = yield { prompt: { who: w, title: w.name + ': STAND IN?', lines: [Nm(B, att) + '\'s ' + total + ' hits ' + nm(B, tgt) + '.', 'Lean in and take it: against your AC ' + ac + (miss ? ' it misses.' : ' it still hits -- you.') + ' (your reaction)'], opts: [{ label: 'STAND IN', value: 1 }, { label: 'NOT THIS TIME', value: 0 }] } };
        if (!go) continue;
      } else if (!miss && !(tgt.hp <= Math.max(6, tgt.maxhp / 4))) continue;
      w.reaction = 0; D.sfx('run');
      // the lean: drawn from halfway to the friend back to the hero's own square, which it never leaves
      w.tween = { fx: (w.x + tgt.x) / 2, fy: (w.y + tgt.y) / 2, fz: G.gzAt(w, w.x, w.y), t: 0, dur: B.pace(10, true) };
      return w;
    }
    return null;
  };
  // ------------------------------------------------------------------ the druid: the Circle of the Pelt (ours, 10-30 -- the leveling lane; RULED, Griz: "take leveling's
  // leans and it can start building"; leveling-srd-by-class.md 6.2): WEAR THE BEAST, a bonus action and a use of Wild Shape -- one beast part on the druid's own body for
  // the fight (two at 6), its HP, gear, spells and concentration its own: CLAWS (unarmed strikes 1d8 slashing, WIS for the hit and the damage; magical at 6), HIDE (AC at
  // least 13 + WIS: rules.js RU.ac), HAUNCHES (10 ft more speed, up for 5 ft: RU.speedNow, RU.riseCost); THICK PELT, temporary HP twice the druid level as a part goes on.
  // The parts go at 0 HP (battle.js) or by SHED THE BEAST (a bonus action). No Wild Shape while a part is worn
  F.pelt = function (u) { return !!(u && u.cls === 'druid' && u.subclass === 'the Circle of the Pelt' && u.lvl >= 2); };
  F.PARTS = { claws: 'CLAWS', hide: 'HIDE', haunches: 'HAUNCHES' };
  // (each part's words under WEAR THE BEAST's ring -- THE POPUP RULE, js/ui.js promptRing, 11-18)
  var PART_NOTE = { claws: function (u) { return 'Your unarmed strikes deal 1d8 slashing, WIS for the hit and the damage' + (u.lvl >= 6 ? ', and are magical' : '') + '.'; }, hide: function (u) { return 'Your AC is at least 13 + WIS: ' + (13 + D.mod(u.abil.wis)) + '.'; }, haunches: function () { return '10 ft more speed.'; } };
  // HAUNCHES put on or shed on the druid's own turn: the speed changes then, and what is left of the turn's move with it (SRD 5.1's way with a speed that changes mid-turn,
  // as Haste cast on oneself adds its speed at once: grimoire.js; Battle.dashFeet, the speed after modifiers). 11-10, his record of 11-09 -- the beast worn mid-turn added nothing
  function peltMove(B, u, f) {
    var T = u.turn, mine0 = !!(T && B && B.active === u && D.Battle && D.Battle.dashFeet), s0 = mine0 ? D.Battle.dashFeet(u) : 0; f();
    if (!mine0 || u.conds.restrained || u.conds.dancing) return;
    var dd = D.Battle.dashFeet(u) - s0; if (!dd) return;
    T.move = Math.max(0, T.move + dd); if (T.moveFull != null) T.moveFull = Math.max(0, T.moveFull + dd); if (B.cache) B.cache = null;
  }
  F.wearBeast = function (B, u, parts) { peltMove(B, u, function () { F.wearBeast0(B, u, parts); }); };
  F.wearBeast0 = function (B, u, parts) {
    if (u.conds.pelt) F.peltOff(B, u, true);
    u.turn.bonus = 0; u.feats.wildShape--;
    u.conds.pelt = { parts: parts.slice(0, u.lvl >= 6 ? 2 : 1) };
    if (u.conds.pelt.parts.indexOf('claws') >= 0) { var wm = D.mod(u.abil.wis); u.peltWas = u.weapon; u.weapon = { name: 'Claws', atk: (u.prof || 2) + wm, dice: '1d8', mod: wm, type: 'slashing', props: [], magic: u.lvl >= 6, ranged: false, finesse: false }; }
    u.temp = Math.max(u.temp || 0, 2 * u.lvl);
    D.sfx('magic'); FX.ring(u, 'moss', 26);
    B.card(['{y}' + u.name + '{/} wears the beast: ' + u.conds.pelt.parts.map(function (k) { return F.PARTS[k]; }).join(' and ') + '  {g}(' + u.temp + ' temporary HP; spells and concentration kept){/}'], 240);
  };
  F.peltOff = function (B, u, quiet) {
    if (!u.conds.pelt) return;
    if (u.peltWas) { u.weapon = u.peltWas; delete u.peltWas; }
    delete u.conds.pelt;
    if (!quiet && B && B.card) B.card(['{g}' + u.name + '\'s beast parts fall away.{/}'], 160);
  };
  // the class AI's: hide on (and the claws too, from 6) once a foe is within 30 ft (TX.FIRST, as the Window's Hand on the Neck)
  TX.FIRST.unshift(function* (B, u) {
    if (mine(u) || !F.pelt(u) || u.conds.pelt || u.beast || !u.turn || !(u.turn.bonus > 0) || !feat(u, 'wildShape') || !hostileNear(B, u, 30).length) return;
    F.wearBeast(B, u, u.lvl >= 6 ? ['hide', 'claws'] : ['hide']); yield 10;
  });
  // ------------------------------------------------------------------ the rogue: the Lampwright (ours, 11-03 -- the leveling lane, the story party's classes; Griz, "1 yes", to
  // building it before the Halfway Inn; leveling-srd-by-class.md 7.2 as redrafted 10-31 on his "Go on shutter redraft"): WICK-LORE, Light and Dancing Lights by INT (js/rules.js
  // R.subFeats, classes.js NPC.sheet); HOODED LAMP, light she made never shows her (light.js L.levelSeen); PIN THE LIGHT, her Cunning Action -- a mote on one creature within
  // 30 ft she can see, a DEX save against 8 + proficiency + INT, till the start of her next turn: it sheds bright light 10 ft and dim 10 more, and the creature can neither hide
  // nor gain anything from being invisible (no advantage given); at 9, BY HER OWN LIGHT -- against one standing in light she made, her Sneak Attack needs neither advantage nor a
  // friend beside it, and it cannot hide from her while it stands there
  // OPENING NIGHT (Cutthroat's 9th, ours -- 11-03, Griz: "build cutthroat's 9"; Stab Debut's road on): advantage on initiative (js/save.js unitOf's initAdv), and a creature
  // that has not had its first turn makes no opportunity attack on her (battle.js moveAlong and provoke). The seat's design, his to overrule
  F.openingNight = function (u) { return !!(u && u.cls === 'rogue' && u.subclass === 'Cutthroat' && u.lvl >= 9); };
  F.lamp = function (u, lvl) { return !!(u && u.cls === 'rogue' && u.subclass === 'the Lampwright' && u.lvl >= (lvl || 3)); };
  F.pinTargets = function (B, u) { return B.units.filter(function (w) { return w !== u && G.standing(w) && !w.object && !w.familiar && G.dist(u, w) <= 30 && M.sees(B, u, w) && !(w.conds.pinned && w.conds.pinned.by === u.id); }); };
  F.pinLight = function* (B, u, t) {
    u.turn.bonus = 0; D.sfx('magic'); FX.projectile(u, t, 'glow'); yield { fx: 1 };
    var sv = RU.save(t, 'dex', u.spellDC), line = '{y}' + Nm(B, u) + '{/}: {c}PIN THE LIGHT{/} on ' + nm(B, t) + ' -- DEX ' + RU.saveText(sv) + ' (DC ' + u.spellDC + ') ';
    if (sv.ok) { B.card([line + '{n}it slips the mote{/}  {g}(the bonus action){/}'], 220); yield 16; return false; }
    t.conds.pinned = { by: u.id, till: { who: u.id, at: 'start', n: 1 }, endText: 'The mote of light on {who} goes out.' };
    if (t.conds.hidden) { delete t.conds.hidden; delete t.hidTotal; }
    B.lightMap = null; FX.sparkle(t, 'glow', 16);
    B.card([line + '{o}a mote clings to it{/}: bright 10 ft, no hiding, nothing gained by being invisible, till ' + u.name + '\'s next turn.  {g}(the bonus action){/}'], 260); yield 16;
    return true;
  };
  // BY HER OWN LIGHT (9): t stands in light u made -- her mote on it, or her Light or Dancing Lights reaching its square
  F.ownLight = function (B, u, t) {
    if (!F.lamp(u, 9) || !t || t === u) return false;
    if (t.conds && t.conds.pinned && t.conds.pinned.by === u.id) return true;
    return !!(D.light && D.light.levelFrom && D.light.levelFrom(B, t, u.id) > 0);
  };
  // the class AI's (the seat's call, his to overrule): at 9, before her blow, a mote on the nearest foe she sees with no friend of hers beside it -- her Sneak Attack then rides By
  // Her Own Light; below 9 her bonus action hides, as any rogue's
  TX.FIRST.unshift(function* (B, u) {
    if (mine(u) || !F.lamp(u, 9) || !u.turn || !(u.turn.bonus > 0) || u.turn.attackAction) return;
    var ts = F.pinTargets(B, u).filter(function (w) { return G.hostile(u, w) && !B.units.some(function (k) { return k !== u && k.side === u.side && G.standing(k) && G.dist(k, w) <= 5; }) && !F.ownLight(B, u, w); })
      .sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); });
    if (ts.length) yield* F.pinLight(B, u, ts[0]);
  });
  F.commands = function (B, u) {
    if (!mine(u)) return [];
    var T = u.turn, out = [], act = T.action > 0 && !T.attacksLeft;
    if (F.followThrough(u) && F.heavyInHand(u)) out.push({ id: 'wideswing', label: 'WIDE SWING', cost: 'F', icon: 'attack', skill: true, ok: !T.wideDone && !u.conds.wideSwing && (T.action > 0 || T.attacksLeft > 0),
      why: T.wideDone || u.conds.wideSwing ? 'once a turn' : 'no swing left this turn', note: 'the next heavy blow: a hit ' + 2 * (u.prof || 2) + ' more; a miss, the next attack this turn at disadvantage' }); // (Follow-Through's, 10-30)
    if (F.knowsPlay(u, 'callmark')) out.push({ id: 'callmark', label: 'CALL THE MARK', cost: 'B', icon: 'attack', skill: true, ok: T.bonus > 0 && canPlay(u) && F.markTargets(B, u).length > 0,
      why: !feat(u, 'openings') ? 'no openings left (a short rest)' : T.playDone ? 'a play this turn already' : !(T.bonus > 0) ? 'the bonus action is spent' : 'no foe within 60 ft',
      note: 'each friend\'s first hit on one foe +2 till your next turn; ' + ((u.feats && u.feats.openings) || 0) + ' openings left' }); // (the Drillyard's, 10-30)
    F.playCommands(B, u).forEach(function (x) { out.push(x); }); // (the plays readied before the swing, and WHEEL: the ring's PLAYS, 11-20)
    if (u.cls === 'barbarian') {
      out.push({ id: 'rage', label: 'RAGE', cost: 'B', icon: 'surge', skill: true, ok: T.bonus > 0 && feat(u, 'rage') && !u.conds.raging && !u.conds.incapacitated,
        why: u.conds.raging ? 'raging already' : !feat(u, 'rage') ? 'no rage left (a long rest)' : 'the bonus action is spent',
        note: '+' + (u.lvl >= 16 ? 4 : u.lvl >= 9 ? 3 : 2) + ' STR damage, blades and blows halved, a minute; ' + ((u.feats && u.feats.rage) || 0) + ' left' });
      if (u.lvl >= 2) out.push({ id: 'reckless', label: 'RECKLESS', cost: 'F', icon: 'attack', skill: true, ok: !u.conds.reckless && !T.attackAction && (T.action > 0 || T.attacksLeft > 0),
        why: u.conds.reckless ? 'reckless already, till your next turn' : 'it is decided on the turn\'s first swing', note: 'advantage on STR swings this turn; swings at you have it too till your next' });
    }
    // the druid (09-29, Higertha to nine): Wild Shape, and the way back
    if (F.pelt(u) && !u.beast) out.push(u.conds.pelt ? { id: 'shedbeast', label: 'SHED THE BEAST', cost: 'B', icon: 'skills', skill: true, ok: T.bonus > 0, why: 'the bonus action is spent', note: 'the parts off: ' + u.conds.pelt.parts.map(function (k) { return F.PARTS[k]; }).join(', ') }
      : { id: 'wearbeast', label: 'WEAR THE BEAST', cost: 'B', icon: 'skills', skill: true, ok: T.bonus > 0 && feat(u, 'wildShape'), why: !feat(u, 'wildShape') ? 'no Wild Shape left (a short rest)' : 'the bonus action is spent',
        note: (u.lvl >= 6 ? 'two parts' : 'a part') + ' on your own body -- claws (1d8, WIS), hide (AC 13 + WIS), haunches (+10 ft) -- and ' + 2 * u.lvl + ' temporary HP' }); // (the Pelt's, ours: 10-30)
    if (u.cls === 'druid' && u.lvl >= 2 && !u.beast && !u.conds.pelt) out.push({ id: 'wildshape', label: 'WILD SHAPE', cost: 'A', icon: 'skills', skill: true, ok: act && feat(u, 'wildShape'),
      why: !feat(u, 'wildShape') ? 'no shape left (a short rest brings two back)' : 'the action is spent', note: 'a beast\'s shape (' + F.beastsFor(u).map(function (k) { return D.FOES[k].name.toLowerCase(); }).join(', ') + '): its hit points take the blows first, no spells; ' + ((u.feats && u.feats.wildShape) || 0) + ' left (short rest)' });
    if (u.cls === 'druid' && u.beast && !u.beast.morph) out.push({ id: 'unshape', label: 'OWN SHAPE', cost: 'B', icon: 'skills', skill: true, ok: T.bonus > 0, why: 'the bonus action is spent', note: 'back to the druid (the beast\'s hit points left behind)' });
    if (u.cls === 'cleric' && u.lvl >= 2 && u.subclass === 'Life Domain') out.push({ id: 'preservelife', label: 'PRESERVE LIFE', cost: 'A', icon: 'sacred', skill: true, ok: act && chan(u) && F.lifeLow(B, u).length > 0,
      why: !chan(u) ? CHAN_WHY : !act ? 'the action is spent' : 'nobody within 30 ft is under half', note: 'heal ' + 5 * u.lvl + ' HP among friends within 30 ft, the lowest first, none past half its maximum' });
    if (u.cls === 'cleric' && u.lvl >= 2) out.push({ id: 'turnundead', label: 'TURN UNDEAD', cost: 'A', icon: 'sacred', skill: true, ok: act && chan(u) && F.undeadNear(B, u).length > 0,
      why: !chan(u) ? CHAN_WHY : !act ? 'the action is spent' : 'no undead within 30 ft', note: 'the dead within 30 ft: WIS DC ' + u.spellDC + ' or turned' + (u.lvl >= 5 ? ' (the weakest destroyed)' : '') });
    // 09-30, the class feature gaps: the monk's ki bonus actions, the paladin's Turn the Unholy, the bard's Countercharm, the sorcerer's metamagic
    if (u.cls === 'monk' && u.lvl >= 2) {
      var kiOk = T.bonus > 0 && feat(u, 'ki') && !u.conds.incapacitated, kiWhy = !feat(u, 'ki') ? 'no ki left (a short rest brings it back)' : 'the bonus action is spent', kiLeft = ((u.feats && u.feats.ki) || 0) + ' ki left';
      out.push({ id: 'patient', label: 'PATIENT DEFENSE', cost: 'B', icon: 'dodge', skill: true, ok: kiOk && !u.conds.dodge, why: u.conds.dodge ? 'dodging already' : kiWhy, note: '1 ki: the Dodge as a bonus action; ' + kiLeft });
      out.push({ id: 'stepdisengage', label: 'STEP: DISENGAGE', cost: 'B', icon: 'disengage', skill: true, ok: kiOk && !T.disengaged, why: T.disengaged ? 'disengaged already' : kiWhy, note: 'Step of the Wind, 1 ki: leaving reach provokes nothing this turn; ' + kiLeft });
      out.push({ id: 'stepdash', label: 'STEP: DASH', cost: 'B', icon: 'dash', skill: true, ok: kiOk && !u.conds.restrained && !u.conds.dancing, why: u.conds.dancing ? 'dancing in place: no move to add a Dash to' : u.conds.restrained ? 'held fast: the speed is 0, and a Dash adds your speed' : kiWhy, note: 'Step of the Wind, 1 ki: +' + u.speed + ' ft this turn; ' + kiLeft });
    }
    // the player's monk (RULED 09-30, Griz: "yes please"): after the Attack action, the bonus action's strikes -- Flurry of Blows (2, 1 ki, two
    // unarmed strikes) or Martial Arts' one without ki -- and Wholeness of Body (the Open Hand's 6: an action, three times its level in HP, a long rest)
    if (u.cls === 'monk') {
      var fl = u.lvl >= 2 && feat(u, 'ki'), besideN = foesBeside(B, u).length;
      out.push({ id: 'flurry', label: fl ? 'FLURRY OF BLOWS' : 'BONUS STRIKE', cost: 'B', icon: 'attack', skill: true, ok: !!T.attackAction && T.bonus > 0 && besideN > 0 && !u.conds.disarmed,
        why: !T.attackAction ? 'after the Attack action' : T.bonus <= 0 ? 'the bonus action is spent' : 'no foe beside you', note: fl ? '1 ki: two unarmed strikes at foes beside you; ' + ((u.feats && u.feats.ki) || 0) + ' ki left' : 'Martial Arts: one unarmed strike' + (u.lvl >= 2 ? ' (no ki left)' : '') });
      if (u.lvl >= 6 && u.subclass === 'Way of the Open Hand') out.push({ id: 'wholeness', label: 'WHOLENESS OF BODY', cost: 'A', icon: 'secondwind', skill: true, ok: act && feat(u, 'wholeness') && u.hp < u.maxhp,
        why: !feat(u, 'wholeness') ? 'used (a long rest brings it back)' : !act ? 'the action is spent' : 'unhurt', note: 'heal yourself ' + 3 * u.lvl + ' HP, once a long rest' });
    }
    if (F.soldiering(u) && F.bearsShield(u)) { // (Soldiering's shield wall, ours: 11-20)
      if (!F.wallSet(u)) out.push({ id: 'setshields', label: 'SET SHIELDS', cost: 'B', icon: 'shield', skill: true, ok: F.canSet(u),
        why: !(T.bonus > 0) ? 'the bonus action is spent' : 'not now', note: 'a bonus action: shields set, the wall\'s front (a mate\'s, or the straight way to the nearest foe); joined to a trained mate beside, +2 AC, cover behind, THE PUSH; your square held till you leave' });
      else {
        var jW = F.joined(u, B), fW = jW ? F.lineFoes(B, F.wallOf(B, u), u.conds.wall.face).length : 0;
        if (!jW || fW) out.push({ id: 'wallpush', label: 'THE PUSH', cost: 'B', icon: 'shove', skill: true, ok: F.canPush(B, u), why: !(T.bonus > 0) ? 'the bonus action is spent' : !jW ? 'no set mate beside you' : F.wallPushedNow(B, F.wallOf(B, u)) ? 'the wall has pushed this round' : 'no foe ahead of the wall',
          note: 'the whole wall shoves as one (each mate its reaction): STR DC ' + F.pushDC(B, u) + '; every foe ahead fails and the line steps 5 ft, any holds and nobody steps (the failed take 1d6 either way)' });
        else out.push({ id: 'wallmarch', label: 'MARCH', cost: 'M', icon: 'move', skill: true, ok: F.canMarch(B, u), why: !(u.turn.wallMove > 0) ? 'your move is spent' : F.wallOf(B, u).some(function (w) { return w.conds.wall.marched === B.round; }) ? 'the wall has marched this round' : 'no room ahead', note: 'no foe ahead: the whole wall moves ' + F.marchFt(B, u) + ' ft forward together (half the slowest one\'s speed, rounded up; your move)' });
        out.push({ id: 'leavewall', label: 'LEAVE THE WALL', cost: 'B', icon: 'shield', skill: true, ok: T.bonus > 0, why: 'the bonus action is spent', note: 'a bonus action: your move back' });
      }
    }
    if (F.soldiering(u) && !F.bearsShield(u) && F.pikeArm(u)) { // (Soldiering's pike wall, beside SET SHIELDS: 11-21, his "join the pike wall ... like 'set shield' is under skills")
      if (!F.pikeSet(u, B)) out.push({ id: 'setpikes', label: 'SET PIKES', cost: 'B', icon: 'attack', skill: true, ok: F.canSetPikes(B, u),
        why: !(T.bonus > 0) ? 'the bonus action is spent' : !F.pikeBehind(B, u) ? 'stand in the square behind a set shield' : 'not now',
        note: 'a bonus action, behind a set shield: its front; joined, KEEP BACK on the square ahead of that shield and SET AGAINST THE CHARGE (your reaction), the brace on the wall\'s push; you step with its march and push' + (F.longGuard(u) ? '; Long Guard +2 on both' : '') + '; your square held till you leave' });
      else out.push({ id: 'leavepikes', label: 'LEAVE THE PIKE WALL', cost: 'B', icon: 'attack', skill: true, ok: T.bonus > 0, why: 'the bonus action is spent', note: 'a bonus action: your move back' + (F.pikeJoined(u, B) ? '' : ' (the shield before you is not joined: no pike wall yet)') });
    }
    if (F.unholy(u)) out.push({ id: 'turnunholy', label: 'TURN THE UNHOLY', cost: 'A', icon: 'sacred', skill: true, ok: act && chan(u) && F.unholyNear(B, u).length > 0,
      why: !chan(u) ? CHAN_WHY : !act ? 'the action is spent' : 'no fiend or undead within 30 ft', note: 'fiends and undead within 30 ft: WIS DC ' + u.spellDC + ' or turned for a minute (the Channel Divinity Sacred Weapon uses)' });
    if (F.hasFeat(u, 'suddendark')) { var sdC = F.darkTargets(B, u); out.push({ id: 'suddendark', label: 'SUDDEN DARK', cost: 'B', icon: 'lantern', skill: true, ok: T.bonus > 0 && sdC.length > 0, // (the feat Sudden Dark, ours: 10-30)
      why: !(T.bonus > 0) ? 'the bonus action is spent' : 'no flame within 30 ft that you can see', note: 'a bonus action: one flame no magic made goes out -- a torch, a lantern, a brazier' }); }
    if (F.lamp(u)) { var plC = F.pinTargets(B, u); out.push({ id: 'pinlight', label: 'PIN THE LIGHT', cost: 'B', icon: 'lantern', skill: true, ok: T.bonus > 0 && plC.length > 0, // (the Lampwright's, ours: 11-03)
      why: !(T.bonus > 0) ? 'the bonus action is spent' : 'no one within 30 ft that you can see', note: 'Cunning Action: a mote on one within 30 ft -- DEX DC ' + u.spellDC + ' -- bright 10 ft, no hiding, nothing gained by being invisible, till your next turn' }); }
    if (F.green(u)) { var gdC = F.greenDown(B, u); out.push({ id: 'greenagain', label: 'GREEN AGAIN', cost: 'A', icon: 'sacred', skill: true, ok: act && chan(u) && gdC.length > 0 && u.hp > u.lvl, // (the Oath of the Green Return, ours: 10-30)
      why: !chan(u) ? CHAN_WHY : !act ? 'the action is spent' : !gdC.length ? 'no one of yours down within 30 ft that you can see' : 'it would take your last hit points', note: 'Channel Divinity: one of yours at 0 HP within 30 ft stands with ' + u.lvl + ' HP, and you lose as many' }); }
    if (F.green(u) && mine(u) && !u.ally) { var fdH = F.feedHeld(u); out.push({ id: 'feedthem', label: 'FEED THEM: ' + (fdH ? 'HOLD' : 'ASK'), cost: 'F', icon: 'sacred', skill: true, ok: true, // (WHAT FALLS, FEEDS asked or held: F.feedHeld, 11-24)
      note: fdH ? 'free: WHAT FALLS, FEEDS is held -- no ask when one falls, the reaction and the use kept. A click asks again' : 'free: WHAT FALLS, FEEDS is asked when one falls near a hurt friend. A click holds it -- no ask, the use kept -- till you turn it back' }); }
    if (u.cls === 'bard' && u.lvl >= 6) out.push({ id: 'countercharm', label: 'COUNTERCHARM', cost: 'A', icon: 'sacred', skill: true, ok: act && !u.conds.countercharm && !u.conds.incapacitated,
      why: u.conds.countercharm ? 'the song is up already' : 'the action is spent', note: 'till the end of your next turn: you and friends within 30 ft, advantage on saves against being frightened or charmed' });
    if (u.cls === 'sorcerer' && u.lvl >= 3) (u.metamagic || []).forEach(function (mn) {
      var on = !!(T.meta && T.meta.name === mn), cost = F.metaCost(mn, null), pt = points(u);
      out.push({ id: 'meta-' + mn, label: mn.toUpperCase() + (on ? ' (ON)' : ''), cost: 'F', icon: 'skills', skill: true, ok: on || pt >= cost, why: 'only ' + pt + ' sorcery point' + (pt === 1 ? '' : 's') + ' of ' + cost,
        note: ({ quickened: '2 points: the next action-spell (a leveled one) is cast as a bonus action', twinned: 'the next spell that reaches one creature also reaches a second: its level in points (1 a cantrip); not concentration',
          careful: '1 point: the next spell creatures save against: up to ' + Math.max(1, M.mod(u)) + ' of your friends caught in it succeed', heightened: '3 points: the next spell creatures save against: one has disadvantage on its first save',
          subtle: '1 point: the next spell is cast with no words or gestures -- no one can Counterspell it', empowered: '1 point: the next spell that deals damage: up to ' + Math.max(1, M.mod(u)) + ' of its damage dice under the middle rolled again' })[mn] + '; ' + pt + ' points left' });
    });
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
  // one of those it may go to, picked on the grid as a spell's target is (10-01, Griz: "I don't know why 'number selection by distance' was
  // used instead of the normal method of selecting targets of stuff. With torvald theres 5 choices like the ability has more range, and
  // half of the number choices are off screen"): the prompt carries the list as `pick`, and js/ui.js shows them in gold on the grid -- E or
  // a click on one takes it, X is not now. The options stay under it (the benches and the play record answer a prompt by them; 0: not now)
  function* pickOne(B, u, title, list, line) {
    if (!list.length) return null;
    var opts = list.map(function (w, i) { return { label: (w === u ? 'YOURSELF' : Nm(B, w).toUpperCase() + ' (' + G.dist(u, w) + ' FT)'), value: i + 1 }; });
    opts.push({ label: 'NOT NOW', value: 0 });
    var v = yield { prompt: { who: u, title: u.name + ': ' + title, lines: [line], opts: opts, pick: list } };
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
        var pick = yield { prompt: { who: u, ring: true, title: u.name + ': WILD SHAPE', lines: ['Which beast? Its hit points take the blows first; no spells while in it; a bonus action ends it.'], opts: ks.map(function (k, i) { var d = D.FOES[k]; return { label: d.name.toUpperCase() + ' (' + d.hp + ' HP, AC ' + d.ac + ', ' + d.speed + ' FT)', value: i + 1, fig: d.sheet, icon: 'claw', note: (/^[aeiou]/i.test(d.name) ? 'An ' : 'A ') + d.name.toLowerCase() + ': ' + d.hp + ' HP of its own, AC ' + d.ac + ', ' + d.speed + ' ft' + (F.SHAPES.some(function (s) { return s.kind === k && s.flies; }) ? ', flying' : '') + '.' }; }).concat([{ label: 'NOT NOW', value: 0, icon: 'back', note: 'No shape taken: the use kept.' }]) } }; // (ring, the beast's own figure: THE POPUP RULE -- js/ui.js promptRing, 11-18)
        if (pick) yield* F.wildShape(B, u, ks[pick - 1]);
        return;
      }
      case 'unshape': u.turn.bonus = 0; F.unshape(B, u, 0, true); yield 12; return;
      case 'turnundead': yield* F.turnUndead(B, u, F.undeadNear(B, u)); return;
      case 'preservelife': yield* F.preserveLife(B, u); return;
      case 'turnunholy': yield* F.turnUndead(B, u, F.unholyNear(B, u), { name: 'TURN THE UNHOLY', noDestroy: true }); return;
      case 'suddendark': { // (the feat Sudden Dark, ours: 10-30) -- the flame picked on the grid, as Rootdrag's squares
        var sdL = F.darkTargets(B, u); if (!sdL.length || !(u.turn.bonus > 0)) return;
        var pkD = c.target && (c.target.l || c.target.w) ? c.target : sdL.length === 1 ? sdL[0] : null;
        if (!pkD) { var vD = yield { prompt: { who: u, title: u.name + ': SUDDEN DARK -- WHICH FLAME?', lines: ['A gold square: the flame that goes out.'], opts: sdL.map(function (q, i) { return { label: q.name.toUpperCase(), value: i + 1 }; }).concat([{ label: 'NOT NOW', value: 0 }]), pick: sdL, squares: true } }; if (!vD) return; pkD = sdL[vD - 1]; }
        F.suddenDark(B, u, pkD); return;
      }
      case 'pinlight': { // (the Lampwright's Cunning Action, ours: 11-03) -- the creature picked on the grid, as a spell's target
        var plE = F.pinTargets(B, u); if (!plE.length || !(u.turn.bonus > 0)) return;
        t = c.target && plE.indexOf(c.target) >= 0 ? c.target : yield* pickOne(B, u, 'PIN THE LIGHT', plE, 'One within 30 ft that you can see: a DEX save (DC ' + u.spellDC + ') or a mote of your light clings to it.');
        if (t) yield* F.pinLight(B, u, t); return;
      }
      case 'greenagain': { // (the Oath of the Green Return's Channel Divinity, ours: 10-30)
        var gdE = F.greenDown(B, u); if (!gdE.length || !chan(u) || u.hp <= u.lvl || !(u.turn.action > 0)) return;
        t = c.target && gdE.indexOf(c.target) >= 0 ? c.target : gdE.length > 1 ? yield* pickOne(B, u, 'GREEN AGAIN', gdE, 'One at 0 HP: it stands with ' + u.lvl + ' HP, and you lose as many.') : gdE[0];
        if (t) yield* F.greenAgain(B, u, t); return;
      }
      case 'feedthem': { // (FEED THEM: ASK or HOLD, free -- F.feedHeld, 11-24)
        u.feats = u.feats || {};
        if (u.feats.feedHold) delete u.feats.feedHold; else u.feats.feedHold = true;
        B.card(['{y}' + u.name + '{/}: WHAT FALLS, FEEDS -- ' + (u.feats.feedHold ? '{g}HOLD: no ask when one falls; the reaction and the use kept.{/}' : 'ASK: asked again when one falls near a hurt friend.')], 180);
        return;
      }
      case 'patient': yield* F.patient(B, u); return;
      case 'flurry': yield* F.bonusStrikes(B, u); return;
      case 'wholeness': { u.turn.action = 0; u.feats.wholeness = 0; var gotW = B.heal(u, 3 * u.lvl); D.sfx('heal'); FX.sparkle(u, 'moss', 16); B.card(['{y}' + Nm(B, u) + '{/}: WHOLENESS OF BODY  {n}+' + gotW + ' HP{/}  {g}(a long rest brings it back){/}'], 240); yield 16; return; }
      case 'stepdisengage': yield* F.stepWind(B, u, 'disengage'); return;
      case 'stepdash': yield* F.stepWind(B, u, 'dash'); return;
      case 'countercharm': yield* F.countercharm(B, u); return;
      case 'doubling': yield* F.doubling(B, u); return;
      case 'holddoor': yield* F.holdDoor(B, u, F.doorFoes(B, u)); return;
      case 'showing':
        t = yield* pickOne(B, u, 'THE SHOWING', F.showable(B, u), 'Which of them is shown the glass? (WIS DC ' + u.spellDC + ')');
        if (t) yield* F.showing(B, u, t);
        return;
      case 'wearbeast': {
        if (!F.pelt(u) || !feat(u, 'wildShape') || !(u.turn.bonus > 0)) return;
        var picked = [], nP = u.lvl >= 6 ? 2 : 1;
        for (var iP = 0; iP < nP; iP++) {
          var optsP = Object.keys(F.PARTS).filter(function (k) { return picked.indexOf(k) < 0; }).map(function (k) { return { label: F.PARTS[k] + (k === 'claws' ? ': 1d8 slashing, WIS' : k === 'hide' ? ': AC ' + (13 + D.mod(u.abil.wis)) + ' at least' : ': 10 ft more speed'), value: k }; });
          optsP.push({ label: iP ? 'NO SECOND' : 'NOT NOW', value: 0, no: true, icon: 'back', note: iP ? 'Only the one part worn.' : 'Nothing worn: the bonus action and the use kept.' });
          optsP.forEach(function (o) { if (o.value) { o.icon = { claws: 'claw', hide: 'dodge', haunches: 'dash' }[o.value]; o.note = PART_NOTE[o.value] ? PART_NOTE[o.value](u) : ''; } }); // (each on the ring -- THE POPUP RULE, js/ui.js promptRing, 11-18)
          var vP = yield { prompt: { who: u, ring: true, title: u.name + ': WEAR THE BEAST' + (nP > 1 ? ' (' + (iP + 1) + ' of 2)' : ''), lines: ['A part of a beast on your own body, for the fight.'], opts: optsP } };
          if (!vP) break; picked.push(vP);
        }
        if (picked.length) { F.wearBeast(B, u, picked); yield 10; }
        return;
      }
      case 'shedbeast': if (u.conds.pelt && u.turn.bonus > 0) { u.turn.bonus = 0; peltMove(B, u, function () { F.peltOff(B, u); }); yield 8; } return; // (HAUNCHES shed: its 10 ft off what is left of the move)
      case 'setshields': if (F.canSet(u)) { F.setShields(B, u); yield 10; } return; // (Soldiering's, 11-20)
      case 'leavewall': if (F.wallSet(u) && u.turn.bonus > 0) { F.leaveWall(B, u); yield 8; } return;
      case 'walladvance': case 'wallmarch': yield* F.wallMarch(B, u); return;
      case 'wallpush': yield* F.wallPush(B, u); return;
      case 'setpikes': if (F.canSetPikes(B, u)) { F.setPikes(B, u); yield 10; } return; // (THE PIKE WALL, 11-21)
      case 'leavepikes': if (F.pikeSet(u, B) && u.turn.bonus > 0) { F.leavePikes(B, u); yield 8; } return;
      case 'wallmove': { // (a move click with shields set: asked -- LEAVE THE WALL? Yes leaves at LEAVE's cost and walks there; no holds. Griz, 11-20; ui.js actAt. Pikes set: the same, 11-21)
        var pkW = !F.wallSet(u) && F.pikeSet(u, B), wWord = pkW ? 'THE PIKE WALL' : 'THE WALL';
        if (!F.wallSet(u) && !pkW) return;
        if (!(u.turn.bonus > 0)) { D.sfx('error'); B.card(['{o}' + u.name + ' holds ' + wWord.toLowerCase() + ': leaving it takes a bonus action, and the bonus action is spent.{/}'], 180); return; }
        var lv = yield { prompt: { who: u, title: u.name + ': LEAVE ' + wWord + '?', lines: [(pkW ? 'Pikes are set' : 'Shields are set') + ': your square is held.', 'Leave ' + wWord.toLowerCase() + ' (your bonus action) and go there?'], opts: [{ label: 'LEAVE AND GO', value: 1 }, { label: 'HOLD ' + wWord, value: 0, no: true }] } };
        if (!lv) return;
        if (pkW) F.leavePikes(B, u); else F.leaveWall(B, u); yield 6;
        var rmW = G.reach(u, u.turn.move), spot = rmW[c.x + ',' + c.y];
        yield* B.exec(u, { do: spot && spot.stand ? 'move' : 'dashmove', x: c.x, y: c.y });
        return;
      }
      case 'wideswing': if (F.followThrough(u) && F.heavyInHand(u) && !u.turn.wideDone) F.wideSwing(B, u); yield 10; return;
      case 'play_pinshield': case 'play_bind': case 'play_breakstride': case 'play_takelegs': case 'play_spook': { var pid = c.do.slice(5); if (F.knowsPlay(u, pid) && (u.turn.armPlay === pid || canPlay(u))) { F.readyPlay(B, u, pid); yield 8; } return; } // (the ring's PLAYS: readied before the swing, 11-20)
      case 'play_wheel': if (F.soldiering(u)) { yield* F.readyWheel(B, u); yield 8; } return;
      case 'callmark':
        t = yield* pickOne(B, u, 'CALL THE MARK', F.markTargets(B, u), 'A foe within 60 ft: each friend\'s first hit on it +2.');
        if (t) { F.callMark(B, u, t); yield 10; }
        return;
      case 'handonneck':
        t = yield* pickOne(B, u, 'THE HAND ON THE NECK', alliesWithin(B, u, 5).filter(function (w) { return !w.conds.glassHand; }), 'A touch: yourself, or one beside you.');
        if (t) { F.handOnNeck(B, u, t); yield 10; }
        return;
      case 'keepersward':
        t = yield* pickOne(B, u, 'KEEPER\'S WARD', alliesWithin(B, u, 30).filter(function (w) { return !w.conds.keeperWard; }), 'Yourself, or one within 30 ft.');
        if (t) { F.keepersWard(B, u, t); yield 10; }
        return;
      default:
        // a metamagic, chosen for the next spell (a second press takes it back): M.cast pays it, and does it
        if (/^meta-/.test(c.do)) {
          var mn = c.do.slice(5), on = u.turn.meta && u.turn.meta.name === mn;
          u.turn.meta = on ? null : { name: mn };
          B.card(['{y}' + u.name + '{/}: ' + (on ? 'no metamagic on the next spell.' : mn.toUpperCase() + ' -- on the next spell you cast (' + F.metaCost(mn, null) + '+ sorcery points).')], 160);
        }
    }
  };
})();
