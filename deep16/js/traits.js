/* DEEP16 — the bestiary's traits the sheets owed (handoff-2026-09-28-npc-classes-to-six.md §3G; the `todo`s of data/foes.js): each
   SRD 5.1 trait as the grid reads it, keyed off the sheet (D.FOES[kind]). The roper's grip weakens; the black pudding and the gray
   ooze eat weapons and armour (for the fight only: RULED 09-28g, Griz, "Should the ooze's acid wear gear down for good?" -- "No"); the broodmother folds into the rock
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
  TR.FIELDS = ['earthGlide', 'rampage', 'charge', 'relentlessBeast', 'nimble', 'twoHeads', 'corrosive', 'jaunt', 'resilient', 'evasion', 'cunning', 'parry', 'rangedMulti', 'rockCatch', 'pounce', 'drinkLight', 'foretell', 'kneel', 'rise', 'gaze']; // (gaze: a petrifying gaze, the basilisk's and the medusa's -- below, 10-08) (pounce, drinkLight, foretell, kneel, rise: the Harbinger's, 10-08 -- below) // (resilient: the duergar's Resilience, SRD 5.1 -- rules.js RU.save; 10-02 runner) (rockCatch: the stone giant's Rock Catching, its DC -- battle.js attack, 10-08)

  // ------------------------------------------------------------------ Duergar Resilience on a spell already running (SRD 5.1: "advantage on saving throws against poison, spells, and illusions")
  // rules.js RU.save reads B.castLevel only while a cast is under way. The saves a spell asks later -- Spirit Guardians at the start of the turn, a zone's, Web's, Moonbeam's, a wall's, the
  // charm's on a hurt -- are resolved in magic.js startTurn/endTurn and the stepInto/onHurt/confusedTurn/danceAsk chains (the spell's own stamp, castId/lv, rides on the zone record the
  // Globe reads): while one runs on a creature that has the trait, B.spellRun names it and RU.save gives it the advantage. (A concentration save is none against a spell: RU.save)
  ['startTurn', 'endTurn', 'stepInto', 'onHurt', 'danceSave'].forEach(function (k) {
    var f0 = M[k]; if (!f0) return;
    M[k] = function (B, u) {
      if (!B || !u || !u.resilient) return f0.apply(this, arguments);
      var was = B.spellRun; B.spellRun = u;
      try { return f0.apply(this, arguments); } finally { B.spellRun = was; }
    };
  });
  ['confusedTurn', 'danceAsk'].forEach(function (k) {
    var f0 = M[k]; if (!f0) return;
    M[k] = function* (B, u) {
      if (!B || !u || !u.resilient) return yield* f0.apply(this, arguments);
      var was = B.spellRun; B.spellRun = u;
      try { return yield* f0.apply(this, arguments); } finally { B.spellRun = was; }
    };
  });

  // ------------------------------------------------------------------ the roper's tendrils: the grappled one has disadvantage on STR checks
  // and saves (rules.js save reads restrained.weak; magic.js breakFree too)
  var saveAdv0 = RU.saveAdv;
  RU.saveAdv = function (u, ab) { return !!(saveAdv0 && saveAdv0(u, ab)); }; // (the ettin's Two Heads is no blanket on WIS and CON saves, SRD 5.1: "advantage on saving throws against being blinded, charmed, deafened, frightened, stunned, and knocked unconscious" -- rules.js RU.save reads it off `against`; Duergar Resilience likewise; 10-02 runner)
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
    if (att.charge && att.turn && !att.turn.charged && (att.turn.moved || 0) >= 20 && !tgt.dead && tgt.hp > 0) { // (what it walked this turn, battle.js moveAlong: not its speed less what is left -- a held, slowed or Longstrided boar read that wrong, a runner found 10-01b)
      att.turn.charged = true;
      var c = att.charge, cr = D.roll(c.dice, { crit: crit }), sv = RU.save(tgt, 'str', c.dc);
      B.card(['{r}' + Nm(B, att) + ' charges home!{/}  ' + c.dice + ' [' + cr.rolls.join(',') + '] = ' + cr.total + '  STR ' + RU.saveText(sv) + ' vs DC ' + c.dc + '  ' + (sv.ok ? '{n}keeps their feet{/}' : '{o}KNOCKED DOWN{/}')], 300);
      B.hurt(tgt, cr.total, atk.type, { magic: !!atk.magic });
      if (!sv.ok && tgt.hp > 0 && !tgt.noProne) tgt.conds.prone = true;
      yield 16;
    }
    // the Harbinger's Pounce (ours, 10-08, the SRD lion's shape): the blow battle.js played on his `pounce` row -- 20 ft of his turn, the leap, the hit
    // on the row's frame 6 (its `release`; Griz: "Frame 6 is impact -- trigger damage and the target's prone animation there") -- more dice, and STR or
    // prone (ui.js lays the target down as the flag flips); the mirror ripple runs over him as he lands (D.ripple, js/looks.js)
    if (att.pounce && att.anim === 'pounce' && att.turn && !att.turn.pounced && !tgt.dead && tgt.hp > 0) {
      att.turn.pounced = true;
      var pc = att.pounce, pr = D.roll(pc.dice, { crit: crit }), psv = RU.save(tgt, 'str', pc.dc);
      var pdown = !psv.ok && !tgt.noProne && !(RU.immuneTo && RU.immuneTo(tgt, 'prone'));
      if (D.ripple) D.ripple(att, { region: 'body' });
      B.card(['{r}' + Nm(B, att) + ' pounces!{/}  ' + pc.dice + ' [' + pr.rolls.join(',') + '] = ' + pr.total + '  STR ' + RU.saveText(psv) + ' vs DC ' + pc.dc + '  ' + (pdown ? '{o}KNOCKED DOWN{/}' : '{n}keeps their feet{/}')], 300);
      B.hurt(tgt, pr.total, atk.type, { magic: !!atk.magic });
      if (pdown && tgt.hp > 0) tgt.conds.prone = true;
      yield 16;
    }
  };

  // ------------------------------------------------------------------ the Harbinger's Drink Light (ours, 10-08; Griz: "The Mirror drains the Castegut girls magic - I think that one
  // where he grows larger should be a counterspell/heal"): his reaction, at a levelled spell a creature he can see casts within 60 ft -- drunk as a Counterspell would take it (3rd
  // level and under at once; higher, his CHA check against 10 + its level), and he heals 'per' a level of it and grows a step (S.regrow, to 1.24 at most); failed, he OVERFILLS --
  // the light goes through him and the spell is cast. 'uses' a fight. Asked ahead of every Counterspell (grimoire.js M.counterAsk)
  var ca0 = M.counterAsk;
  M.counterAsk = function* (B, u, id, slot, g) {
    var sp = M.data(id), lv = (sp && sp.level) || 0;
    if (B && B.units && sp && lv >= 1 && !(g && (g.free || g.again || g.move)) && !(u.turn && u.turn.readied)) {
      var m = B.units.filter(function (w) { return w !== u && w.drinkLight && G.hostile(u, w) && G.standing(w) && w.reaction > 0 && RU.canAct(w) && (w.drinkLeft == null ? w.drinkLight.uses : w.drinkLeft) > 0 && G.dist(w, u) <= 60 && M.sees(B, w, u) && !RU.charmedBy(w, u); })[0];
      if (m) {
        m.reaction = 0; m.drinkLeft = (m.drinkLeft == null ? m.drinkLight.uses : m.drinkLeft) - 1;
        var ok = lv <= 3, r = 0, tot = 0;
        if (!ok) { r = D.d(20); tot = r + M.mod(m); ok = tot >= 10 + lv; }
        var cn = u.side === 'foe' ? 'the ' + B.shortName(u) : u.name;
        m.anim = ok ? 'drain' : 'overfill'; m.animT = B.t; D.sfx('magic'); FX.ring(m, 'silver', 30);
        B.card(['{r}' + Nm(B, m) + ' drinks the light{/} of ' + cn + '\'s ' + sp.name + (r ? '  (d20 ' + r + RU.sign(M.mod(m)) + ' = ' + tot + ' vs DC ' + (10 + lv) + ')' : '') + ' -- ' + (ok ? '{c}it goes out{/}' : '{o}too much: it overfills him and goes through{/}')], 280);
        yield Math.max(30, D.spr.duration(m.sheet, m.anim) || 40);
        if (ok) {
          var k0 = D.spr.scaleOf(m); m.drinkGrow = Math.min(1.24, (m.drinkGrow || 1) * 1.07); m.drawScale = m.drinkGrow * (m.risen && m.rise ? m.rise.grow || 1 : 1); D.spr.regrow(m, k0);
          B.heal(m, m.drinkLight.per * lv);
        }
        m.anim = 'idle';
        if (ok) return true;
      }
    }
    return ca0 ? yield* ca0.apply(this, arguments) : false;
  };

  // ------------------------------------------------------------------ the Harbinger's Kneel (ours, 10-08; Griz: "Kneel can be Hold Person with flair of some kind"): the word
  // said, his `cast` row (the sheet's kneel), and on whoever the hold takes the mirror ripple runs head to foot
  // the word, spoken (10-08, Griz: "can we voice his 'kneel' like we did denim damage"): a recorded clip, deep16/audio/kneel.mp3 (tools/voice-clip.ps1: Windows' David, a growl
  // lower, slow, a hall's echo), the browser's own voice when it will not play -- as js/mpmon.js denimVoice
  function kneelVoice() { var say = function () { if (D.say) D.say('Kneel.', { pitch: 0.4, rate: 0.8 }); }; if (D.clip) D.clip('audio/kneel.mp3', function (ok) { if (!ok) say(); }); else say(); }
  var castK = M.cast;
  M.cast = function* (B, u, id, slot, t) {
    if (!B || !u || !u.kneel || id !== 'holdperson') return yield* castK.apply(this, arguments);
    kneelVoice();
    B.card(['{r}' + Nm(B, u) + ': "Kneel."{/}'], 200); yield 8;
    var held0 = {}; B.units.forEach(function (w) { if (w.conds && w.conds.paralyzed) held0[w.id] = 1; });
    var res = yield* castK.apply(this, arguments);
    B.units.forEach(function (w) {
      if (!w.conds || !w.conds.paralyzed || w.conds.paralyzed.by !== u.id || held0[w.id]) return;
      if (D.ripple) D.ripple(w, { region: 'body', dur: 80 });
      B.card(['{o}' + w.name + ' kneels.{/}'], 200);
    });
    return res;
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
  // the Harbinger's hunt (ours, 10-08, the seat's call): before his routine, the softest he can see -- a spell-caster first, then the fewest hit
  // points -- if 20 ft or more off and reachable this turn, he goes to them, so his first blow is the Pounce (battle.js; the routine's blows then
  // fall on the one in reach with the fewest hit points). Nobody to hunt, or one already in his reach: his routine as it is
  function* hunt(B, u) {
    var T = u.turn, min = u.pounce.min || 20;
    if (!T || !(T.move >= min) || u.conds.prone || u.conds.restrained || u.conds.grappled || u.holding && u.holding.length || !RU.canAct(u)) return;
    var hs = AI.heroes(B, u).filter(function (w) { return G.standing(w) && !w.ethereal && !w.under && M.sees(B, u, w); });
    if (!hs.length) return;
    var soft = function (w) { return ((w.known || []).length ? 0 : 1000) + w.hp; };
    var t = hs.slice().sort(function (a, b) { return soft(a) - soft(b); })[0], reach = G.reachOf(u);
    if (G.dist(u, t) <= reach) return;
    var rm = G.reach(u, T.move), best = null;
    Object.keys(rm).forEach(function (k) {
      var e = rm[k];
      if (!e.stand || e.cost < min || G.dist(u, t, e.x, e.y) > reach) return;
      if (!best || e.cost < best.cost) best = e;
    });
    if (!best) return;
    yield* AI.walkTo(B, u, best);
  }
  // the Harbinger's rise (ours, 10-08: Griz handed it over -- "He's yours" -- and "Assuming ascend ties into upright"): the first turn he starts at half his
  // hit points or under, he stands up to his full height -- his `ascend` row, the mirror ripple over him -- and from then on stands upright between blows
  // (ui.js, his `uprightidle` row); standing, his reach is the rise's (15 ft) and his Drink Light is full again
  function* rise(B, u) {
    u.risen = true; u.anim = 'ascend'; u.animT = B.t; D.sfx('magic');
    if (D.ripple) D.ripple(u, { region: 'body', dur: 90 });
    B.card(['{r}' + Nm(B, u) + ' straightens, and keeps straightening.{/}  {g}Something far bigger than a gnoll stands up in him.{/}'], 320);
    yield Math.max(40, D.spr.duration(u.sheet, 'ascend') || 60);
    u.upright = true; u.anim = 'idle';
    if (u.rise.grow) { var g0 = D.spr.scaleOf(u); u.drawScale = (u.drinkGrow || 1) * u.rise.grow; D.spr.regrow(u, g0); } // (his figure the Enlarge way -- eased, overshooting; his 2 x 2 stays: Griz, 10-08, "can you put the enlarge effect on - or should he become 9 square?")
    if (u.rise.reach) { // (his reach, and his blows' own with it -- the unit's reach alone told the AI a hero 15 ft off was in reach while the Backhand still reached 10: he stood and
      u.reach = u.rise.reach; // spent his action on nothing, round after round -- the bench's long tails, 10-08. His attacks are the sheet's own object, so his copy first)
      u.attacks = JSON.parse(JSON.stringify(u.attacks || {}));
      Object.keys(u.attacks).forEach(function (k) { var a = u.attacks[k]; if (!a.ranged && (a.reach || 5) < u.rise.reach) a.reach = u.rise.reach; });
      if (u.foretell && !u.foretell.ranged) u.foretell.reach = Math.max(u.foretell.reach || 5, u.rise.reach);
      if (u.weapon && !u.weapon.ranged) u.weapon = u.attacks[Object.keys(u.attacks).filter(function (k) { return u.attacks[k].name === u.weapon.name; })[0]] || u.weapon;
    }
    if (u.drinkLight) u.drinkLeft = u.drinkLight.uses;
    B.card(['{g}(Upright: reach ' + G.reachOf(u) + ' ft' + (u.drinkLight ? ', Drink Light full again' : '') + '){/}'], 220);
    yield 16;
    if (u.rise.call) {
      var came = callPack(B, u, u.rise.call);
      if (came.length) { D.sfx('run'); B.card(['{r}' + came.length + ' mirror hyenas spill out from behind ' + Nm(B, u).replace(/^The /, 'the ') + ' and run at you!{/}'], 300); yield 30; }
    }
  }
  // his call (Griz, 10-08: "a hyena summons - maybe even mirror hyenas - with him rising and standing tall as they run past him to attack the party"): `n` of the
  // `kind` out of the ground behind him -- the far side from the party -- each sliding out from his square and dealt into the order on its own roll (battle.js
  // dealIn, as the brood's cocoons drop), the mirror ripple over each as it comes; `calledBy` ties the pack to him (his stance, TR.turn)
  function callPack(B, u, c) {
    var hs = AI.heroes(B, u).filter(function (w) { return G.standing(w); }), mx = u.x + (u.size - 1) / 2, my = u.y + (u.size - 1) / 2;
    var cx = hs.length ? hs.reduce(function (a, w) { return a + w.x; }, 0) / hs.length : mx, cy = hs.length ? hs.reduce(function (a, w) { return a + w.y; }, 0) / hs.length : my + 1;
    var dx = mx - cx, dy = my - cy, dl = Math.hypot(dx, dy) || 1, came = [], def = D.FOES[c.kind];
    if (!def) return came;
    for (var k = 0; k < (c.n || 1); k++) {
      // out at his flanks, left and right by turns, half a square behind him -- from behind his back on the crown they could not get past him and its trees,
      // and parked there (Griz, 10-08: "they just park behind him most of the fight instead of being a swarm of attackers")
      var side = k % 2 ? 1 : -1, far = 2 + Math.floor(k / 2), bx = mx + (-dy / dl) * side * far + dx / dl * 0.5, by = my + (dx / dl) * side * far + dy / dl * 0.5;
      var h = B.makeFoe({ id: 'mh' + (B.mhN = (B.mhN || 0) + 1), kind: c.kind }), best = null, bd = Infinity;
      for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) {
        if (!G.canStand(h, x, y)) continue;
        var d = Math.hypot(x + (h.size - 1) / 2 - bx, y + (h.size - 1) / 2 - by);
        if (d < bd) { bd = d; best = [x, y]; }
      }
      if (!best) break;
      h.x = best[0]; h.y = best[1]; h.facing = u.facing || 0; h.anim = 'idle'; h.animT = B.t; h.flash = 0; h.reaction = 1; h.calledBy = u.id;
      if (def.drawScale) h.drawScale = def.drawScale;
      h.tween = { fx: mx - (h.size - 1) / 2, fy: my - (h.size - 1) / 2, fz: 0, t: 0, dur: B.pace(20, true) };
      B.units.push(h); G.setup(G.map, B.units); came.push(h);
      if (D.ripple) D.ripple(h, { region: 'body' });
    }
    if (came.length) B.dealIn(came);
    return came;
  }
  // his stance once risen (the seat's call, 10-08 -- Griz: "Mode switch is hot, does it tactics change?"): while a hyena of his stands, he holds his ground on
  // the crown -- no hunt, no step; with nobody in his reach he Kneels the nearest he can hold (Hold Person) and Foretells, the pack doing the running; with
  // somebody in reach, his blows as ever. His pack gone, he hunts again
  function* stand(B, u) {
    if (G.foesNear(u, u.x, u.y, G.reachOf(u)).length) return false;
    var T = u.turn, hs = AI.heroes(B, u).filter(function (w) { return G.standing(w) && !w.conds.paralyzed && G.dist(u, w) <= 60 && M.sees(B, u, w); });
    hs.sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); });
    var g = M.geo('holdperson'), t = hs.filter(function (w) { return !g || M.targetOK(B, u, g, w); })[0];
    if (t && T && T.action > 0 && u.slots && u.slots[1] > 0 && (u.known || []).indexOf('holdperson') >= 0) yield* B.exec(u, { do: 'cast', id: 'holdperson', slot: 2, target: t });
    yield* foretellUp(B, u);
    return true;
  }
  function* foretellUp(B, u) {
    if (u.foretell && u.reaction > 0 && !u.ready && RU.canAct(u) && !u.dead && u.hp > 0 && !G.foesNear(u, u.x, u.y, G.reachOf(u)).length && AI.heroes(B, u).length) {
      u.ready = { trigger: 'near', what: 'weapon', name: u.foretell.name, wp: u.foretell };
      u.ready.had = B.readyHad(u, u.ready); B.readySnap();
      u.anim = 'foretell'; u.animT = B.t;
      B.card(['{r}' + Nm(B, u) + ' raises a hand and waits.{/}  {g}(Foretell: ' + u.foretell.name + ' at the first to step within ' + G.reachOf(u) + ' ft){/}'], 240);
      yield 24;
    }
  }
  TR.turn = function* (B, u) {
    if (u.rise && !u.risen && u.side === 'foe' && u.hp > 0 && u.hp <= u.maxhp * (u.rise.at || 0.5) && RU.canAct(u)) yield* rise(B, u);
    if (u.upright && u.side === 'foe' && RU.canAct(u) && B.units.some(function (w) { return w.calledBy === u.id && !w.dead && w.hp > 0; })) { // (his stance: below)
      if (u.dead || u.hp <= 0) return true;
      if (yield* stand(B, u)) return true;
      return false;
    }
    if (u.pounce && u.side === 'foe' && !u.ethereal) yield* hunt(B, u);
    if (u.dead || u.hp <= 0) return true;
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
    // Cunning Action (the Spy, SRD 5.1: "On each of its turns, the spy can use a bonus action to take the Dash, Disengage, or Hide action"): the Dash to close and the Disengage
    // to get clear are ai.js cunning / bolt; the Hide is here, once its turn is done -- nowhere to hide with a foe beside it, or one that sees it clearly (battle.js seenBy, the
    // same question the Hide action asks: it is not even tried where it could not take)
    if (u.cunning && T.bonus > 0 && !u.conds.hidden && !u.conds.restrained && !u.conds.dancing && !G.foesNear(u, u.x, u.y, 5).length) {
      var all = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && RU.canAct(w); });
      if (all.length && all.every(function (w) { return B.seenBy(w, u) < 2; })) yield* B.hide(u);
    }
    // Rampage: a bonus action -- half its speed toward the nearest, and a bite
    if (u.rampage && T.rampage && T.bonus) {
      T.bonus = 0; T.rampaged = true;
      var hs = AI.heroes(B, u), t = hs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0], bite = u.attacks && (u.attacks.bite || u.attacks[Object.keys(u.attacks)[0]]);
      if (t && bite) {
        B.card(['{r}' + Nm(B, u) + ' rampages!{/}  {g}(a bite for the bonus action){/}'], 240); yield 12;
        if (G.dist(u, t) > 5 && !u.conds.restrained && !u.conds.dancing) { var mv = T.move; T.move = Math.floor(u.speed / 2); yield* AI.walkTo(B, u, AI.approach(u, t, G.reach(u, T.move), 5)); T.move = Math.min(mv, T.move); }
        if (!u.dead && u.hp > 0 && G.dist(u, t) <= 5) yield* B.attack(u, t, bite);
      }
    }
    // Nimble Escape: Disengage as a bonus action, and back off a step from the one beside it
    if (u.nimble && T.bonus && T.move > 0 && G.foesNear(u, u.x, u.y, 5).length) {
      T.bonus = 0; T.disengaged = true;
      var rm = G.reach(u, T.move), pick = null, ps = -1e9;
      Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand) return; var s = -G.foesNear(u, e.x, e.y, 5).length * 20 - e.cost / 10; if (s > ps) { ps = s; pick = e; } });
      if (pick && G.foesNear(u, pick.x, pick.y, 5).length === 0) {
        B.card(['{r}' + Nm(B, u) + '{/} darts back.  {g}(Nimble Escape){/}'], 160);
        if (D.spr.anim(u.sheet, 'nimble')) { u.anim = 'nimble'; u.animT = B.t; yield D.spr.duration(u.sheet, 'nimble'); } // (its hop, then the steps: the goblin's sheet, 10-07)
        yield* AI.walkTo(B, u, pick);
      }
    }
    // Nimble Escape's other half (SRD 5.1 Goblin: "the Disengage or Hide action as a bonus action on each of its turns"; 10-07, Griz: "4 yes" -- the Disengage above was all the grid read
    // of it): the bonus action still its own, no foe beside it (the Disengage is for that), not hidden already, no Hide yet this turn (battle.js T.hid: the lost-to-every-eye re-hide in
    // ai.js may have taken it), it Hides -- where it stands if no foe's watch would find it, else a step first: the move it has left, the nearest square that does hold, by a way that
    // brushes no foe's reach, and then the Hide. "Holds" is the Hide's own question (battle.js nearOf, a foe's passive Perception and the bonus of its watch against the Stealth roll)
    // read at an average roll, as the class rogue's cover play reads it (tactics.js): it is not tried where it could not take. The BONUS, never the action (B.hide's `bonus`) -- and
    // after the turn's blow, so a goblin that shot is out of sight for the answer, and a hit from hiding gives it away again (battle.js attack: a foe that strikes from hiding is seen)
    if (u.nimble && T.bonus > 0 && !T.hid && !u.conds.hidden && !u.conds.restrained && !u.conds.dancing && !u.conds.faerie && !u.ethereal && !G.foesNear(u, u.x, u.y, 5).length) {
      var seers = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && RU.canAct(w); });
      if (seers.length && !seers.some(function (w) { return w.mirrorEye; })) { // (nothing hides in front of the Mirror's eye: the Hide would only fail)
        var holds = function () { return seers.every(function (w) { var n = B.nearOf(w, u); return !n || !n.bonus || w.perception + (w.twoHeads ? 5 : 0) + n.bonus <= u.stealth + 10; }); }, spot = null;
        if (!holds() && T.move > 0) {
          var rmH = G.reach(u, T.move), ox = u.x, oy = u.y;
          var cand = Object.keys(rmH).map(function (k) { return rmH[k]; }).filter(function (e) { return e.stand && (e.x !== ox || e.y !== oy); }).sort(function (a, b) { return a.cost - b.cost; });
          for (var ci = 0; ci < cand.length && !spot; ci++) {
            var ce = cand[ci], way = G.path(rmH, ce.x, ce.y);
            if (!way || way.some(function (p) { return G.foesNear(u, p[0], p[1], 5).length; })) continue; // (never through a foe's reach: that is an opportunity attack the Hide was to avoid)
            u.x = ce.x; u.y = ce.y;
            try { if (!G.foesNear(u, ce.x, ce.y, 5).length && holds()) spot = ce; } finally { u.x = ox; u.y = oy; }
          }
        }
        if (spot || holds()) {
          if (spot) { B.card(['{r}' + Nm(B, u) + '{/} slips out of their watch.  {g}(Nimble Escape){/}'], 160); yield* AI.walkTo(B, u, spot); }
          if (!u.dead && u.hp > 0) yield* B.hide(u, true);
        }
      }
    }
    // the Harbinger's Foretell (ours, 10-08: the Astra draft's pose -- Griz had "nothing for the foretell pose", the seat's call): a turn that ends with
    // no one in his reach, he holds the pose (its row loops) and readies Mirror Strike -- his reaction, at the first that steps within his reach
    // (battle.js readyHook / readySpring, as a hero's READY; it lapses at his next turn's start, rules.js)
    yield* foretellUp(B, u);
  };

  // ------------------------------------------------------------------ the gibbering mouther (SRD 5.1; 10-06, Griz: "SRD what you can" -- it was a stun on a recharge, the 8-bit's
  // reading). Aberrant Ground: 10 ft about it is doughlike difficult ground (M.rough), and one that starts its turn in it makes a DC 10 STR save or has no move that turn.
  // Gibbering, while it can see and isn't incapacitated: one that starts its turn within 20 ft of it and can hear it makes a DC 10 WIS save, or has no reactions till its
  // next turn and rolls a d8 for this one (grimoire.js M.confusedTurn, `gibber`). Each creature, by the SRD's words -- another mouther too. The Spittle: ai.js spit
  function nearM(m, x, y) { return Math.max(Math.abs(x - m.x), Math.abs(y - m.y)) * 5; }
  var rough1 = M.rough;
  M.rough = function (B, x, y, u) {
    if (rough1.apply(this, arguments)) return true;
    return !!B && (B.units || []).some(function (m) { return m.aberrant && m !== u && G.standing(m) && nearM(m, x, y) <= m.aberrant.r; });
  };
  var onStartM = M.onStart;
  M.onStart = function (B, u) {
    onStartM.apply(this, arguments);
    if (!B || !u || u.dead || u.hp <= 0 || u.object || !u.turn) return;
    var ms = B.units.filter(function (m) { return m !== u && (m.gibber || m.aberrant) && G.standing(m) && !m.dead; }); if (!ms.length) return;
    var T = u.turn, lines = [];
    ms.forEach(function (m) {
      if (!m.aberrant || T.move === 0 || nearM(m, u.x, u.y) > m.aberrant.r) return;
      var sv = RU.save(u, 'str', m.aberrant.dc);
      lines.push(Nm(B, u) + ' in the doughlike ground: STR ' + RU.saveText(sv) + ' vs DC ' + m.aberrant.dc + '  ' + (sv.ok ? '{n}pulls free{/}' : '{o}stuck fast: no move this turn{/}'));
      if (!sv.ok) T.move = 0;
    });
    ms.filter(function (m) { return m.gibber && RU.canAct(m) && !m.conds.blinded && !u.conds.deafened && G.dist(m, u) <= m.gibber.range; }).forEach(function (m) {
      if (u.conds.confused) return; // (one babble is enough to lose a turn to)
      var sv = RU.save(u, 'wis', m.gibber.dc);
      lines.push('{p}' + Nm(B, m) + ' gibbers{/} at ' + Nm(B, u) + ': WIS ' + RU.saveText(sv) + ' vs DC ' + m.gibber.dc + '  ' + (sv.ok ? '{n}steady{/}' : '{p}the mind slips: no reactions, a d8 for the turn{/}'));
      if (!sv.ok) { u.conds.confused = { gibber: true, by: m.id }; u.reaction = 0; }
    });
    if (lines.length) B.card(lines, 300);
  };

  // ------------------------------------------------------------------ A GAZE (SRD 5.1: the basilisk's and the medusa's Petrifying Gaze; the grid's rules §2.7, 10-08 -- the rule built
  // before the monsters that use it, the lanes window's order): a sheet's `gaze: { range, dc, ab, stone, now5, title }`. A creature that starts its turn within its range, the two
  // seeing each other and the gazer not incapacitated, makes the save -- unless it averts its eyes (not when surprised): then it cannot see the gazer till the start of its next
  // turn (magic.js seeWhy: its blows at the gazer at disadvantage, the gazer's at it with advantage). A failed save begins the stone (M.stoneBegin: restrained, the save again at
  // the end of its next turn); with `now5` (the medusa) a failure by 5 or more is stone at once (M.petrify). The AI looks away when the save is lost one time in three or more; a
  // player's hero is asked (M.gazeAsk, battle.js heroTurn). Not built: looking at it in the meantime forcing the save; the reflection in bright light turning it on itself
  function gazersOf(B, u) {
    return B.units.filter(function (m) { return m !== u && m.gaze && G.standing(m) && RU.canAct(m) && G.hostile(m, u) && G.dist(m, u) <= (m.gaze.range || 30) && M.sees(B, m, u) && M.sees(B, u, m); });
  }
  M.gazeSave = function (B, u, m) {
    var g = m.gaze, ab = g.ab || 'con', sv = RU.save(u, ab, g.dc, false, g.stone ? 'petrified' : null), now = !!(g.now5 && !sv.ok && sv.total <= g.dc - 5);
    B.card(['{p}' + Nm(B, m) + '\'s gaze{/} on ' + Nm(B, u) + ': ' + ab.toUpperCase() + ' ' + RU.saveText(sv) + ' vs DC ' + g.dc + '  ' + (sv.ok ? '{n}it holds{/}' : now ? '{o}stone at once{/}' : '{o}it begins to turn to stone{/}')], 260);
    if (!sv.ok && g.stone) { if (now) M.petrify(B, u, { by: m.id }); else M.stoneBegin(B, u, { dc: g.dc, by: m.id }); }
    return sv.ok;
  };
  M.avert = function (B, u, m) {
    var av = u.conds.averted;
    if (!av) av = u.conds.averted = { from: [], till: { who: u.id, at: 'start', n: 1 } };
    if (av.from.indexOf(m.id) < 0) av.from.push(m.id);
    B.card(['{g}' + Nm(B, u) + ' looks away from ' + (m.side === 'foe' && !m.named ? 'the ' + B.shortName(m) : m.name) + ' (it cannot be seen till the next turn).{/}'], 220);
  };
  M.gazeAsk = function* (B, u) {
    var ids = (u.turn && u.turn.gazeAsk) || []; if (u.turn) u.turn.gazeAsk = null;
    for (var i = 0; i < ids.length; i++) {
      var m = B.units.filter(function (w) { return w.id === ids[i]; })[0];
      if (!m || !G.standing(m) || u.dead || u.hp <= 0 || u.conds.stoning || u.conds.petrified) continue;
      var nm = m.side === 'foe' && !m.named ? 'The ' + B.shortName(m) : m.name, g = m.gaze;
      var look = yield { prompt: { who: u, title: u.name + ': ' + (g.title || 'THE GAZE'), lines: [nm + ' meets your eyes from ' + G.dist(m, u) + ' ft.', 'LOOK AWAY: no save; you cannot see it till your next turn (your blows at it at disadvantage, its blows at you with advantage).', 'MEET IT: ' + (g.ab || 'con').toUpperCase() + ' save, DC ' + g.dc + ', or begin to turn to stone.'], opts: [{ label: 'LOOK AWAY', value: 0 }, { label: 'MEET IT', value: 1 }] } };
      if (look) M.gazeSave(B, u, m); else M.avert(B, u, m);
    }
  };
  var onStartGz = M.onStart;
  M.onStart = function (B, u) {
    onStartGz.apply(this, arguments);
    if (!B || !u || u.dead || u.hp <= 0 || u.object || !u.turn || u.conds.petrified) return;
    var ms = gazersOf(B, u); if (!ms.length) return;
    var hand = u.side === 'party' && !u.guest && !u.ally && RU.canAct(u); // (the player's own -- battle.js run gives it heroTurn -- asked at the turn's top)
    ms.forEach(function (m) {
      if (u.conds.stoning || u.conds.petrified) return;
      if (!u.conds.surprised && hand) { (u.turn.gazeAsk = u.turn.gazeAsk || []).push(m.id); return; }
      if (!u.conds.surprised && RU.canAct(u) && D.tactics.pFail(u, m.gaze.ab || 'con', m.gaze.dc) >= 0.34) M.avert(B, u, m); else M.gazeSave(B, u, m);
    });
  };
})();
