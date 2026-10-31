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
    if (back.length) B.card(['{g}' + (u.side === 'foe' ? 'The ' + B.shortName(u) : u.name) + '\'s rage is over: the ' + (hasFear ? 'terror' : back.join(' and ')) + ' comes back.{/}'], 240);
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
    if (att.cls === 'ranger' && att.lvl >= 3 && att.subclass === 'Hunter' && att.turn && !att.turn.colossus && tgt.hp < tgt.maxhp && !atk.spell) {
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
      var sc = w.conds.asleep ? TX.dpr(w) * 2.5 + 4 : TX.dpr(w) * 0.6 + 1;
      if (!best || sc > best.score) best = { kind: 'help', why: (w.conds.asleep ? 'shake ' : 'a hand to ') + w.name, score: sc, go: function* () { yield* B.exec(u, { do: 'help', target: w }); } };
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
    B.card(lines.slice(0, 8), 420); yield { fx: 1 };
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
  // can see drops within 30 ft: each friend within 10 ft of the fallen 1d6 + CHA (M.onKill, below -- taken by a rule, as the drop comes inside a blow with no asking: some healing
  // to be had, and the last use kept for GREEN AGAIN while one of its own is down); at 7 the AURA OF DEEP ROOTS -- it and friends within 10 ft (30 at 18) are not moved against
  // their will nor knocked prone (F.holdGround's guards: M.push and the knockdowns). Sacred Weapon, Turn the Unholy and the Aura of Devotion are Devotion's (RU.devoted)
  F.green = function (u, lvl) { return !!(u && u.cls === 'paladin' && u.subclass === 'the Oath of the Green Return' && u.lvl >= (lvl || 3)); };
  F.greenDown = function (B, u) { return B.units.filter(function (w) { return w !== u && w.side === u.side && !w.dead && !w.slain && !w.object && !w.familiar && w.hp <= 0 && G.dist(u, w) <= 30 && M.sees(B, u, w); }); };
  F.greenAgain = function* (B, u, t) {
    var n = u.lvl; u.turn.action = 0; u.feats.channel--;
    FX.ring(t, 'moss', 34); FX.sparkle(t, 'moss', 16); D.sfx('buff');
    B.heal(t, n); delete t.conds.prone;
    u.hp = Math.max(1, u.hp - n); FX.float('-' + n, u, D.PAL.ramps.moss[2]);
    B.card(['{y}' + Nm(B, u) + '{/}: {n}GREEN AGAIN{/} -- ' + nm(B, t) + ' stands with ' + t.hp + ' HP, and ' + u.name + ' gives ' + n + '.  {g}(Channel Divinity){/}'], 260);
    yield 30;
  };
  F.deepRoots = function (B, w) {
    return !!(B && B.units && w && !w.dead && w.hp > 0 && B.units.some(function (p) { return F.green(p, 7) && p.side === w.side && G.standing(p) && RU.canAct(p) && G.dist(p, w) <= (p.lvl >= 18 ? 30 : 10); }));
  };
  var onKillG = M.onKill;
  M.onKill = function (B, killer, u) {
    onKillG.apply(this, arguments);
    if (!u || u.object || u.familiar) return;
    B.units.forEach(function (p) {
      if (!F.green(p) || !(p.reaction > 0) || !feat(p, 'channel') || !G.standing(p) || !RU.canAct(p) || G.dist(p, u) > 30 || !M.sees(B, p, u)) return;
      var near = B.units.filter(function (w) { return w.side === p.side && G.standing(w) && !w.object && w.hp < w.maxhp && G.dist(w, u) <= 10; });
      var missing = near.reduce(function (s, w) { return s + w.maxhp - w.hp; }, 0);
      if (missing < 4 || (p.feats.channel < 2 && F.greenDown(B, p).length)) return;
      p.reaction = 0; p.feats.channel--;
      var cm = Math.max(0, D.mod(p.abil.cha)), got = near.map(function (w) { var r = D.roll('1d6').total + cm; B.heal(w, r); return nm(B, w) + ' +' + r; });
      FX.ring(u, 'moss', 30);
      B.card(['{y}' + Nm(B, p) + '{/}: {n}WHAT FALLS, FEEDS{/} -- ' + got.join(', ') + '.  {g}(the reaction and Channel Divinity){/}'], 260);
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
  F.answerBack = function* (B, att, tgt, atk, melee) {
    if (!melee || atk.spell || !sub(tgt, 'Path of the Sand', 6) || !tgt.conds.raging || tgt.reaction <= 0 || !RU.canAct(tgt) || att.dead || att.hp <= 0 || G.dist(tgt, att) > G.reachOf(tgt) || !tgt.weapon) return;
    tgt.reaction = 0;
    B.card(['{r}' + Nm(B, tgt) + ' answers back!{/}  {g}(the reaction){/}'], 200);
    yield* B.attack(tgt, att, tgt.weapon, { oa: true, answer: true }); // (a blow back, not an opportunity attack: Escape the Horde is not asked)
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
    if (u.cls === 'barbarian' && u.subclass === 'Path of the Berserker' && u.lvl >= 6) out.push('mindless rage');
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
    if (F.knowsPlay(att, 'bind') && tgt.reaction > 0) opts.push({ label: 'BIND: no reactions till its turn', value: 'bind' });
    if (F.knowsPlay(att, 'breakstride') && !tgt.conds.stride) opts.push({ label: 'BREAK STRIDE: 10 ft less speed', value: 'breakstride' });
    if (F.knowsPlay(att, 'wheel') && friends.length) opts.push({ label: 'WHEEL: trade places with a friend', value: 'wheel' });
    if (!opts.length) return;
    var pick;
    if (!mine(att)) pick = opts[0].value === 'wheel' ? 0 : opts[0].value; // (the class AI: the first that bears on the fight -- a pinned shield, a bind, a broken stride; never the wheel, which wants a plan)
    else {
      opts.push({ label: 'NO PLAY', value: 0 });
      pick = yield { prompt: { who: att, title: att.name + ': A PLAY? (' + att.feats.openings + ' opening' + (att.feats.openings === 1 ? '' : 's') + ' left)', lines: ['The blow lands on ' + (tgt.side === 'foe' ? 'the ' : '') + tgt.name + '.'], opts: opts } };
    }
    if (!pick) return;
    var f = null;
    if (pick === 'wheel') { f = friends.length > 1 && mine(att) ? yield* pickOne(B, att, 'WHEEL', friends, 'The friend to trade places with.') : friends[0]; if (!f) return; }
    spendPlay(att); D.sfx('confirm');
    if (pick === 'pinshield') { tgt.conds.shieldPinned = { by: att.id }; B.card(['  {y}PIN THE SHIELD{/}: ' + D.Battle.nm(tgt) + '\'s shield is pinned  {g}(-2 AC till ' + att.name + '\'s next turn){/}'], 220); }
    else if (pick === 'bind') { tgt.reaction = 0; B.card(['  {y}BIND{/}: ' + D.Battle.nm(tgt) + ' is bound up  {g}(no reactions till its next turn){/}'], 220); }
    else if (pick === 'breakstride') { tgt.conds.stride = { by: att.id }; B.card(['  {y}BREAK STRIDE{/}: ' + D.Battle.nm(tgt) + ' is slowed  {g}(10 ft less speed through its next turn){/}'], 220); }
    else if (pick === 'wheel') { var ax = att.x, ay = att.y; att.x = f.x; att.y = f.y; f.x = ax; f.y = ay; B.card(['  {y}WHEEL{/}: ' + att.name + ' and ' + f.name + ' trade places  {g}(no opportunity attacks){/}'], 220); }
    yield 12;
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
  F.reachInHand = function (u) { return !!(u && u.weapon && !u.weapon.ranged && u.weapon.reach >= 10); };
  F.keepBack = function* (B, mover, from) {
    var ws = B.units.filter(function (w) { return w !== mover && G.hostile(w, mover) && F.longGuard(w) && F.reachInHand(w) && w.reaction > 0 && G.standing(w) && RU.canAct(w) && !mover.object && D.magic.sees(B, w, mover); });
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i], r = G.armOf(w), dc = 8 + (w.prof || 2) + D.mod((w.abil || w.src.abil).str);
      if (mover.dead || mover.hp <= 0 || !(G.dist(w, mover) <= r && G.dist(w, mover, null, null, from.x, from.y) > r)) continue; // (this step brought it into the reach)
      if (mine(w)) {
        var go = yield { prompt: { who: w, title: w.name + ': KEEP BACK?', lines: [Nm(B, mover) + ' comes within the ' + w.weapon.name.toLowerCase() + '\'s reach: STR DC ' + dc + ', or pushed 5 ft back and its move ended (your reaction).'], opts: [{ label: 'KEEP IT BACK', value: 1 }, { label: 'LET IT COME', value: 0, no: true }] } };
        if (!go) continue;
      }
      w.reaction = 0; var sv = RU.save(mover, 'str', dc); D.sfx(sv.ok ? 'miss' : 'hit');
      B.card(['{y}' + Nm(B, w) + '{/} keeps ' + nm(B, mover) + ' back with the ' + w.weapon.name.toLowerCase() + '  STR ' + RU.saveText(sv) + ' vs DC ' + dc + '  ' + (sv.ok ? '{n}PRESSES IN{/}' : '{o}HELD OFF{/}')], 240);
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
    B.units.forEach(function (w) {
      if (w === mover || !G.hostile(w, mover) || !F.longGuard(w) || !F.reachInHand(w) || !G.standing(w)) return;
      var c = (T.charge = T.charge || {})[w.id], d0 = G.dist(w, mover, null, null, from.x, from.y), d1 = G.dist(w, mover);
      if (!c) c = T.charge[w.id] = { d0: d0, straight: true };
      if (d1 >= d0) c.straight = false;
      var sa = mover.conds.setAgainst;
      if (c.straight && c.d0 - d1 >= 20 && d1 <= G.armOf(w)) { if (!(sa && sa.by === w.id)) { mover.conds.setAgainst = { by: w.id, till: { who: w.id, at: 'end', n: w === B.active ? 2 : 1 } }; B.card(['{y}' + Nm(B, w) + '{/} sets the ' + w.weapon.name.toLowerCase() + ' against the charge.  {g}(the next hit on ' + nm(B, mover) + ': one more weapon die){/}'], 200); } }
      else if (sa && sa.by === w.id && d1 > G.armOf(w)) delete mover.conds.setAgainst;
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
  // STAND IN (Sentinel's and the Protection style's role): the reaction when an attack hits a friend within 5 ft -- the two trade places, and the blow meets the hero's own AC
  // (battle.js attack, after the hit and before the damage). A player's hero asked; the AI's when the blow would miss it, or the friend is near its last
  F.standIn = function* (B, att, tgt, total, nat) {
    var ws = B.units.filter(function (w) { return w !== tgt && w !== att && w.side === tgt.side && F.hasFeat(w, 'standin') && w.reaction > 0 && G.standing(w) && RU.canAct(w) && !w.conds.prone && !w.conds.grappled && !w.conds.restrained && (w.size || 1) === (tgt.size || 1) && G.dist(w, tgt) <= 5 && !(w.hang && G.hanging(w)) && !(tgt.hang && G.hanging(tgt)) && !tgt.object && !tgt.riding && !w.riding; });
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i], ac = RU.ac(w), miss = nat !== 20 && total < ac;
      if (mine(w)) {
        var go = yield { prompt: { who: w, title: w.name + ': STAND IN?', lines: [Nm(B, att) + '\'s ' + total + ' hits ' + nm(B, tgt) + '.', 'Trade places: against your AC ' + ac + (miss ? ' it misses.' : ' it still hits -- you.') + ' (your reaction)'], opts: [{ label: 'STAND IN', value: 1 }, { label: 'NOT THIS TIME', value: 0 }] } };
        if (!go) continue;
      } else if (!miss && !(tgt.hp <= Math.max(6, tgt.maxhp / 4))) continue;
      w.reaction = 0; D.sfx('run');
      var wx = w.x, wy = w.y;
      w.tween = { fx: wx, fy: wy, fz: G.gzAt(w, wx, wy), t: 0, dur: B.pace(10, true) }; tgt.tween = { fx: tgt.x, fy: tgt.y, fz: G.gzAt(tgt, tgt.x, tgt.y), t: 0, dur: B.pace(10, true) };
      w.x = tgt.x; w.y = tgt.y; tgt.x = wx; tgt.y = wy;
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
  F.wearBeast = function (B, u, parts) {
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
  F.commands = function (B, u) {
    if (!mine(u)) return [];
    var T = u.turn, out = [], act = T.action > 0 && !T.attacksLeft;
    if (F.followThrough(u) && F.heavyInHand(u)) out.push({ id: 'wideswing', label: 'WIDE SWING', cost: 'F', icon: 'attack', skill: true, ok: !T.wideDone && !u.conds.wideSwing && (T.action > 0 || T.attacksLeft > 0),
      why: T.wideDone || u.conds.wideSwing ? 'once a turn' : 'no swing left this turn', note: 'the next heavy blow: a hit ' + 2 * (u.prof || 2) + ' more; a miss, the next attack this turn at disadvantage' }); // (Follow-Through's, 10-30)
    if (F.knowsPlay(u, 'callmark')) out.push({ id: 'callmark', label: 'CALL THE MARK', cost: 'B', icon: 'attack', skill: true, ok: T.bonus > 0 && canPlay(u) && F.markTargets(B, u).length > 0,
      why: !feat(u, 'openings') ? 'no openings left (a short rest)' : T.playDone ? 'a play this turn already' : !(T.bonus > 0) ? 'the bonus action is spent' : 'no foe within 60 ft',
      note: 'each friend\'s first hit on one foe +2 till your next turn; ' + ((u.feats && u.feats.openings) || 0) + ' openings left' }); // (the Drillyard's, 10-30)
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
    if (F.unholy(u)) out.push({ id: 'turnunholy', label: 'TURN THE UNHOLY', cost: 'A', icon: 'sacred', skill: true, ok: act && chan(u) && F.unholyNear(B, u).length > 0,
      why: !chan(u) ? CHAN_WHY : !act ? 'the action is spent' : 'no fiend or undead within 30 ft', note: 'fiends and undead within 30 ft: WIS DC ' + u.spellDC + ' or turned for a minute (the Channel Divinity Sacred Weapon uses)' });
    if (F.hasFeat(u, 'suddendark')) { var sdC = F.darkTargets(B, u); out.push({ id: 'suddendark', label: 'SUDDEN DARK', cost: 'B', icon: 'lantern', skill: true, ok: T.bonus > 0 && sdC.length > 0, // (the feat Sudden Dark, ours: 10-30)
      why: !(T.bonus > 0) ? 'the bonus action is spent' : 'no flame within 30 ft that you can see', note: 'a bonus action: one flame no magic made goes out -- a torch, a lantern, a brazier' }); }
    if (F.green(u)) { var gdC = F.greenDown(B, u); out.push({ id: 'greenagain', label: 'GREEN AGAIN', cost: 'A', icon: 'sacred', skill: true, ok: act && chan(u) && gdC.length > 0 && u.hp > u.lvl, // (the Oath of the Green Return, ours: 10-30)
      why: !chan(u) ? CHAN_WHY : !act ? 'the action is spent' : !gdC.length ? 'no one of yours down within 30 ft that you can see' : 'it would take your last hit points', note: 'Channel Divinity: one of yours at 0 HP within 30 ft stands with ' + u.lvl + ' HP, and you lose as many' }); }
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
        var pick = yield { prompt: { who: u, title: u.name + ': WILD SHAPE', lines: ['Which beast? Its hit points take the blows first; no spells while in it; a bonus action ends it.'], opts: ks.map(function (k, i) { var d = D.FOES[k]; return { label: d.name.toUpperCase() + ' (' + d.hp + ' HP, AC ' + d.ac + ', ' + d.speed + ' FT)', value: i + 1 }; }).concat([{ label: 'NOT NOW', value: 0 }]) } };
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
      case 'greenagain': { // (the Oath of the Green Return's Channel Divinity, ours: 10-30)
        var gdE = F.greenDown(B, u); if (!gdE.length || !chan(u) || u.hp <= u.lvl || !(u.turn.action > 0)) return;
        t = c.target && gdE.indexOf(c.target) >= 0 ? c.target : gdE.length > 1 ? yield* pickOne(B, u, 'GREEN AGAIN', gdE, 'One at 0 HP: it stands with ' + u.lvl + ' HP, and you lose as many.') : gdE[0];
        if (t) yield* F.greenAgain(B, u, t); return;
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
          optsP.push({ label: iP ? 'NO SECOND' : 'NOT NOW', value: 0 });
          var vP = yield { prompt: { who: u, title: u.name + ': WEAR THE BEAST' + (nP > 1 ? ' (' + (iP + 1) + ' of 2)' : ''), lines: ['A part of a beast on your own body, for the fight.'], opts: optsP } };
          if (!vP) break; picked.push(vP);
        }
        if (picked.length) { F.wearBeast(B, u, picked); yield 10; }
        return;
      }
      case 'shedbeast': if (u.conds.pelt && u.turn.bonus > 0) { u.turn.bonus = 0; F.peltOff(B, u); yield 8; } return;
      case 'wideswing': if (F.followThrough(u) && F.heavyInHand(u) && !u.turn.wideDone) F.wideSwing(B, u); yield 10; return;
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
