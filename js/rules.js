/* DRAGONSLEEP — 5E-flavoured, FF-simple rules. Mechanics from the SRD 5.1 (CC BY 4.0):
   ability modifiers, proficiency, class tables, spell slots, XP by CR. */
'use strict';
(function () {
  var DS = window.DS;
  var R = DS.R = {};
  R.ABIL = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  R.XP_LEVEL = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000]; // xp needed to BE level n (5E 2014; 10-12 for DEEP16's NPCs past the cap, 09-30)
  R.CAP = 9; // the dwarven expansion raises the cap 5 -> 9 (spec §9) ...
  R.cap = function () { return DS.G && DS.G.flags && DS.G.flags.lakeDone ? R.CAP : 5; }; // ... once the chuul is dead: the base game stays capped at 5
  R.CR_XP = { '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900, '9': 5000 };
  R.prof = function (lvl) { return lvl >= 9 ? 4 : lvl >= 5 ? 3 : 2; };
  // (10-12: the SRD 5.1's rows, for DEEP16's class NPCs past the heroes' cap -- the druid to twelve, Griz 09-29: "game probably gonna get to
  // the big boys at some point"; 09-30: "the above 9's we're just prepping in case we have combat involving special NPCs")
  var SLOTS_FULL = { 1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3], 7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2], 11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1] };
  var SLOTS_HALF = { 1: [], 2: [2], 3: [3], 4: [3], 5: [4, 2], 6: [4, 2], 7: [4, 3], 8: [4, 3], 9: [4, 3, 2], 10: [4, 3, 2], 11: [4, 3, 3], 12: [4, 3, 3] };

  R.CLASSES = {
    fighter: {
      name: 'Fighter', hd: 10, saves: ['str', 'con'], armor: ['light', 'medium', 'heavy', 'shield'], weapons: ['simple', 'martial'],
      primary: 'str', asi: { str: 2 }
    },
    wizard: {
      name: 'Wizard', hd: 6, saves: ['int', 'wis'], armor: ['robe'], weapons: ['dagger', 'dart', 'sling', 'quarterstaff', 'lightcrossbow'],
      caster: 'full', cast: 'int', primary: 'int', asi: { int: 1, con: 1 }
    },
    rogue: {
      name: 'Rogue', hd: 8, saves: ['dex', 'int'], armor: ['light'], weapons: ['simple', 'handcrossbow', 'longsword', 'rapier', 'shortsword'],
      primary: 'dex', asi: { dex: 2 }
    },
    paladin: {
      name: 'Paladin', hd: 10, saves: ['wis', 'cha'], armor: ['light', 'medium', 'heavy', 'shield'], weapons: ['simple', 'martial'],
      caster: 'half', cast: 'cha', primary: 'str', asi: { str: 1, cha: 1 }
    },
    // the other eight SRD 5.1 classes (09-28, the class NPCs: handoff-2026-09-28-npc-classes-to-six.md). No hero of the four
    // is one of these; DEEP16's class NPCs (deep16/js/classes.js) are built on the same numbers, and the 8-bit guests may be
    barbarian: {
      name: 'Barbarian', hd: 12, saves: ['str', 'con'], armor: ['light', 'medium', 'shield'], weapons: ['simple', 'martial'],
      primary: 'str', asi: { str: 2 }, unarmored: 'con'
    },
    bard: {
      name: 'Bard', hd: 8, saves: ['dex', 'cha'], armor: ['light'], weapons: ['simple', 'handcrossbow', 'longsword', 'rapier', 'shortsword'],
      caster: 'full', cast: 'cha', primary: 'cha', asi: { cha: 2 }
    },
    cleric: {
      name: 'Cleric', hd: 8, saves: ['wis', 'cha'], armor: ['light', 'medium', 'heavy', 'shield'], weapons: ['simple'], // (heavy: the Life domain's)
      caster: 'full', cast: 'wis', primary: 'wis', asi: { wis: 2 }
    },
    druid: {
      name: 'Druid', hd: 8, saves: ['int', 'wis'], armor: ['light', 'medium', 'shield'], weapons: ['club', 'dagger', 'dart', 'javelin', 'mace', 'quarterstaff', 'scimitar', 'sickle', 'sling', 'spear'],
      caster: 'full', cast: 'wis', primary: 'wis', asi: { wis: 2 }
    },
    monk: {
      name: 'Monk', hd: 8, saves: ['str', 'dex'], armor: [], weapons: ['simple', 'shortsword'],
      primary: 'dex', asi: { dex: 2 }, unarmored: 'wis'
    },
    ranger: {
      name: 'Ranger', hd: 10, saves: ['str', 'dex'], armor: ['light', 'medium', 'shield'], weapons: ['simple', 'martial'],
      caster: 'half', cast: 'wis', primary: 'dex', asi: { dex: 2 }
    },
    sorcerer: {
      name: 'Sorcerer', hd: 6, saves: ['con', 'cha'], armor: [], weapons: ['dagger', 'dart', 'sling', 'quarterstaff', 'lightcrossbow'],
      caster: 'full', cast: 'cha', primary: 'cha', asi: { cha: 2 }
    },
    warlock: {
      name: 'Warlock', hd: 8, saves: ['wis', 'cha'], armor: ['light'], weapons: ['simple'],
      caster: 'pact', cast: 'cha', primary: 'cha', asi: { cha: 2 }
    }
  };
  // the warlock's Pact Magic (SRD 5.1): few slots, all of one level, back on a short rest
  var SLOTS_PACT = { 1: [1], 2: [2], 3: [0, 2], 4: [0, 2], 5: [0, 0, 2], 6: [0, 0, 2], 7: [0, 0, 0, 2], 8: [0, 0, 0, 2], 9: [0, 0, 0, 0, 2], 10: [0, 0, 0, 0, 2], 11: [0, 0, 0, 0, 3], 12: [0, 0, 0, 0, 3] };
  R.slotsFor = function (h) {
    var c = R.CLASSES[h.cls];
    if (c.caster === 'full') return (SLOTS_FULL[h.lvl] || []).slice();
    if (c.caster === 'half') return (SLOTS_HALF[h.lvl] || []).slice();
    if (c.caster === 'pact') return (SLOTS_PACT[h.lvl] || []).slice();
    return [];
  };
  R.sneakDice = function (lvl) { return Math.ceil(lvl / 2) + 'd6'; };

  // ---------------------------------------------------------------- hero construction
  R.makeHero = function (id, level) {
    var d = DS.DATA.heroes[id];
    var h = {
      id: id, name: d.name, cls: d.cls, lvl: d.level, xp: R.XP_LEVEL[d.level], base: JSON.parse(JSON.stringify(d.abil)),
      abil: JSON.parse(JSON.stringify(d.abil)), maxhp: d.hp, hp: d.hp, equip: JSON.parse(JSON.stringify(d.equip)),
      known: (d.spells || []).slice(), feats: {}, conds: {}, ko: false, subclass: null, look: d.look, weapon: d.weaponArt,
      skills: d.skills || {}, saveProf: d.saveProf || R.CLASSES[d.cls].saves, attuned: [] // (the kit bonds at the refresh below)
    };
    h.subclass = d.subclassStart || null;
    R.refresh(h, true);
    while (level && h.lvl < level) { h.xp = R.XP_LEVEL[h.lvl + 1]; R.levelUp(h); }
    R.settlePicks(h); // (a hero made at a level stands with the build's picks; an archetype still waits, as it always has)
    h.hp = h.maxhp;
    if (R.prepCount(h)) h.prepared = R.prepDefault(h); // a caster walks in with the build's day prepared
    return h;
  };
  // restore per-rest resources; long = long rest
  R.refresh = function (h, long) {
    var f = h.feats;
    if (h.cls === 'fighter') { f.secondWind = 1; f.actionSurge = 1; if (long) f.indomitable = h.lvl >= 9 ? 1 : 0; }
    if (h.cls === 'paladin') { f.channel = h.lvl >= 3 ? 1 : 0; if (long) { f.lay = 5 * h.lvl; f.relentless = 1; } }
    if (h.cls === 'wizard' && long) f.arcaneRecovery = 1;
    // the other eight classes' per-rest resources (SRD 5.1; 09-28, the class NPCs)
    if (h.cls === 'barbarian' && long) f.rage = h.lvl >= 17 ? 6 : h.lvl >= 12 ? 5 : h.lvl >= 6 ? 4 : h.lvl >= 3 ? 3 : 2;
    if (h.cls === 'bard' && (long || h.lvl >= 5)) f.inspiration = Math.max(1, DS.mod(h.abil.cha)); // (Font of Inspiration at 5: a short rest too)
    if (h.cls === 'cleric') f.channel = h.lvl >= 18 ? 3 : h.lvl >= 6 ? 2 : h.lvl >= 2 ? 1 : 0;
    if (h.cls === 'druid') f.wildShape = h.lvl >= 2 ? 2 : 0;
    if (h.cls === 'monk') { f.ki = h.lvl >= 2 ? h.lvl : 0; if (long) f.wholeness = h.lvl >= 6 ? 1 : 0; }
    if (h.cls === 'sorcerer' && long) f.sorcery = h.lvl >= 2 ? h.lvl : 0;
    if (h.cls === 'warlock') { h.slotsMax = R.slotsFor(h); h.slots = h.slotsMax.slice(); } // (Pact Magic comes back on a short rest)
    if (long) {
      h.slotsMax = R.slotsFor(h);
      h.slots = h.slotsMax.slice();
      var flame = h.conds && h.conds.continualFlame; // (a Continual Flame never goes out: it outlasts the night)
      h.hp = h.maxhp; h.ko = false; h.conds = {};
      if (flame) h.conds.continualFlame = flame;
      if (h.id === 'lymen') f.relentless = 1;
    }
    if (!h.slots) { h.slotsMax = R.slotsFor(h); h.slots = h.slotsMax.slice(); }
    if (h.attuned) R.attune(h); // (any rest: what is worn bonds, what was taken off lets go -- 10-06, the menus' attunement)
    if (h.equip) R.ward(h); // (and a condition a worn thing bars ends on him -- the Periapt against a poison he carried to it, 10-07; after the bonds, which decide what works)
  };
  R.levelUp = function (h) {
    var msgs = [], c = R.CLASSES[h.cls];
    h.lvl++;
    var gain = c.hd + DS.mod(h.abil.con); // RULED 09-25 (Griz): a max hit die at every level
    gain = Math.max(1, gain);
    h.maxhp += gain; h.hp += gain;
    msgs.push(h.name + ' is now level ' + h.lvl + '! Max HP +' + gain + '.');
    var oldMax = h.slotsMax || [];
    h.slotsMax = R.slotsFor(h);
    h.slots = h.slots || [];
    for (var i = 0; i < h.slotsMax.length; i++) h.slots[i] = (h.slots[i] || 0) + (h.slotsMax[i] - (oldMax[i] || 0));
    var d = DS.DATA.heroes[h.id];
    var lu = (d.levels && d.levels[h.lvl]) || {};
    var asks = [], said = []; // (what this level gives that the player chooses, the build's default already taken: R.ask below, the level-up pick -- 10-14; `said`, its lines)
    if (lu.expertise) { h.expertise = (h.expertise || []).concat(lu.expertise); said.push('Expertise: ' + lu.expertise.join(', ') + '.'); msgs.push(said[said.length - 1]); asks.push({ kind: 'expertise', need: lu.expertise.length, took: lu.expertise.slice() }); }
    if (lu.asi || R.asiLevels(h.cls).indexOf(h.lvl) >= 0) { // (the class's levels for a sheet that does not name one: Brann at 6, 10-14 -- "I just clicked brann from L5 to L6 and expected choices")
      var asi = lu.asi || c.asi, parts = [], got = {};
      Object.keys(asi).forEach(function (k) { var to = Math.min(20, h.abil[k] + asi[k]); got[k] = to - h.abil[k]; h.abil[k] = to; parts.push(k.toUpperCase() + ' +' + asi[k]); });
      asks.push({ kind: 'asi', need: 2, took: got });
      said.push('Ability scores: ' + parts.join(', ') + '.'); msgs.push(said[said.length - 1]);
      var want = h.lvl * Math.max(1, c.hd + DS.mod(h.abil.con)), base = h.maxhp - ((h.conds && h.conds.aid) || 0); // CON counts back to level 1
      if (base < want) { h.hp += want - base; h.maxhp += want - base; }
    }
    var nlearn = msgs.length, wholeList = h.cls === 'paladin'; // (one who prepares from the whole class list, R.prepPool: nothing is "learned" -- what opens is a spell level)
    var tookN = [], tookC = [], book = h.cls === 'wizard'; // (a wizard's two for the book and his cantrip at 4 are his to choose: the sheet's are the default)
    if (lu.learn) lu.learn.forEach(function (s) { if (h.known.indexOf(s) < 0) { h.known.push(s); (DS.DATA.spells[s].level ? tookN : tookC).push(s); if (!wholeList) { msgs.push(h.name + ' learns ' + DS.DATA.spells[s].name + '.'); if (book) said.push(msgs[msgs.length - 1]); } } });
    if (book && lu.learn) {
      var nN = lu.learn.filter(function (s) { return DS.DATA.spells[s] && DS.DATA.spells[s].level; }).length, nC = lu.learn.length - nN;
      if (nN) asks.push({ kind: 'spells', need: nN, took: tookN });
      if (nC) asks.push({ kind: 'cantrip', need: nC, took: tookC });
    }
    // a new spell level for a whole-list preparer: the spells it opens (10-13, the level-up pick §6 -- "Lymen learns Heroism" after a rung, when he had prepared it since 2nd;
    // Griz: "Pretty sure I did the ladder and it said Lymen learned heroism after, even though he had it to prep before the fight")
    if (wholeList && h.slotsMax.length > oldMax.length) {
      var nL = h.slotsMax.length, oathL = R.oathSpells(h), opens = R.PALADIN_SPELLS.filter(function (id) { var sp = DS.DATA.spells[id]; return sp && sp.level === nL && !sp.ritual && oathL.indexOf(id) < 0; });
      if (opens.length) msgs.push(h.name + ' can prepare level ' + nL + ' spells now: ' + opens.map(function (id) { return DS.DATA.spells[id].name; }).join(', ') + '.');
    }
    if (h.prepared && msgs.length > nlearn) msgs.push('New spells are prepared after a long rest.'); // (SRD: the day is chosen on waking)
    if (lu.subclass) { h.subclass = lu.subclass; msgs.push(h.name + ': ' + lu.subclass + '.'); }
    if (lu.choose === 'archetype') { asks.push({ kind: 'archetype', need: 1, took: null }); said.push(h.name + ' has a choice to make.'); msgs.push(said[said.length - 1]); } // (no default: RULED 09-24, the player's choice)
    if (asks.length) R.ask(h, h.lvl, asks);
    // (the lines that told the build's picks, and one that says what is to choose: R.gainXP shows that one in their place, the pick page next -- 10-14, Griz: "all the old
    // level up text played before picker opened"; the climb's and the ladder's cards read the lines as they were)
    msgs.asked = said; msgs.chooses = asks.length ? R.choosesLine(h, asks) : '';
    (lu.feats || []).forEach(function (t) { msgs.push(t); });
    if (h.cls === 'paladin') { h.feats.lay = (h.feats.lay || 0) + 5; if (h.lvl === 3) h.feats.channel = 1; }
    if (h.cls === 'rogue' && h.lvl % 2 === 1) msgs.push('Sneak Attack is now ' + R.sneakDice(h.lvl) + '.');
    if (h.lvl === 5 && (h.cls === 'fighter' || h.cls === 'paladin')) msgs.push('Extra Attack: two attacks with FIGHT.');
    if (h.lvl === 3 && h.cls === 'fighter') msgs.push('Champion: critical hits on 19 or 20.');
    if (h.lvl === 5 && h.cls === 'rogue') msgs.push('Uncanny Dodge: the first hit each round is halved.');
    if (h.cls === 'fighter' && h.lvl === 9) h.feats.indomitable = 1;
    return msgs;
  };
  R.gainXP = function (h, xp) {
    var msgs = [];
    var cap = R.cap();
    if (h.lvl >= cap) { h.xp = R.XP_LEVEL[cap]; return msgs; } // at the cap nothing banks (so the chuul isn't a jump to 9)
    h.xp += xp;
    while (h.lvl < cap && h.xp >= R.XP_LEVEL[h.lvl + 1]) {
      var m = R.levelUp(h), asked = m.asked || [], put = false;
      m.forEach(function (x) { if (asked.indexOf(x) < 0) msgs.push(x); else if (!put) { put = true; msgs.push(m.chooses); } }); // (the pick page follows: what is to choose, not the build's picks)
      if (m.chooses && !put) msgs.push(m.chooses);
    }
    if (h.lvl >= cap) h.xp = R.XP_LEVEL[cap];
    return msgs;
  };
  R.nextXP = function (h) { return h.lvl >= R.cap() ? null : R.XP_LEVEL[h.lvl + 1]; };

  // ------------------------------------------------------------------ what a fight pays, one copy for both games (lifted 10-14 out of js/battle.js finish, so the grid's
  // roam pays by the same rules -- the party-token map lane §6d, RULED 10-14, Griz: "perfect for the roam seat"). Each piece reads the 8-bit's monster records; the
  // dice come in from the game calling it (the 8-bit's DS.roll and DS.rng; DEEP16's D.roll and D.rand)
  // the kill tally (DS.G.kills): one more of each 8-bit id that fell, and of it in its zone -- the quota clock's fork reads the crawlers (fiveUp, below)
  R.tally = function (K, ids, zone) { ids.forEach(function (id) { K[id] = (K[id] || 0) + 1; if (zone) K[zone + ':' + id] = (K[zone + ':' + id] || 0) + 1; }); };
  // the XP: the pool divided by those standing and each guest fielded and standing (RULED 10-05, Griz: "count guests as 'standing' for xp."), banked by the heroes
  // standing only. Returns { each, ups (the level-up lines), line }
  R.shareXP = function (xp, living, guestsUp) {
    var each = living.length ? Math.floor(xp / (living.length + (guestsUp || 0))) : 0, ups = [];
    living.forEach(function (h) { ups = ups.concat(R.gainXP(h, each)); });
    return { each: each, ups: ups, line: each ? 'Each fighter standing gains ' + each + ' XP.' : '' };
  };
  // a won fight's spoils: coin and salvage, the drops (each foe's in turn, as the dice fall), and the parts someone standing has the skill to harvest. foes: [{ m: its 8-bit
  // monster, fled, surrendered }] -- one that fled leaves nothing, one that yielded keeps its parts; hands: the heroes standing; dice: { roll(expr) -> a number, rng() -> [0, 1) };
  // give(id, n) puts a thing in the pack. The coin is the caller's to add. Returns { silver, lines }
  R.spoils = function (foes, hands, dice, give) {
    var silver = 0, drops = [], got = {}, order = [], lines = [];
    foes.forEach(function (f) {
      if (f.fled) return;
      if (f.m.silver) silver += dice.roll(f.m.silver);
      (f.m.drops || []).forEach(function (d) { if (dice.rng() < d.chance) drops.push(d.item); });
    });
    if (silver) lines.push('Found ' + silver + ' sp in coin and salvage.');
    drops.forEach(function (id) { give(id, 1); lines.push('Found ' + DS.DATA.items[id].name + '!'); });
    foes.forEach(function (f) {
      if (f.surrendered || f.fled) return;
      (f.m.parts || []).forEach(function (pt) {
        var h = hands.filter(function (x) { return pt.skill.some(function (s) { return x.skills && x.skills[s] != null; }); })[0];
        if (!h) return;
        if (!got[pt.item]) { got[pt.item] = { n: 0, who: h.name }; order.push(pt.item); }
        got[pt.item].n++;
      });
    });
    order.forEach(function (id) { give(id, got[id].n); lines.push(got[id].who + ' harvests ' + DS.DATA.items[id].name + (got[id].n > 1 ? ' x' + got[id].n : '') + '.'); });
    return { silver: silver, lines: lines };
  };
  // the landlord fed from the bucket: a quarter again what killing it pays (RULED 09-30e, Griz: "let's make it 125% the xp they get if they kill it"), once (js/events.js EV.fedXp)
  R.fedPool = function () { var m = DS.DATA.monsters.otyugh; return Math.round(1.25 * ((m && m.xp) || 0)); };
  // the five brought up -- the rope, the Keeper beaten, the stair drained (js/events.js fiveUp, js/deep.js S.dryStair, the roam's floor): the flag, the tokens for Edric's book,
  // and the quota clock's fork, the stock (Griz 09-17e) -- one copy (10-14, the roam lane §6c: the roam set the flag alone, so Edric had nothing to take). The lines are the scene's
  R.fiveUp = function (flags, give, kills) {
    flags.fiveRecovered = 1; give('fivetokens', 1);
    if (((kills || {}).crawler || 0) >= 6) flags.stockDead = 1;
  };
  // bring an older save's heroes up to the current rules (spells cut, choices added since)
  R.migrate = function (h) {
    if (h.lvl <= 5 && h.xp >= R.XP_LEVEL[6]) h.xp = R.XP_LEVEL[6] - 1; // XP banked under the old cap of 5: one step short of 6, no more
    h.known = (h.known || []).filter(function (id) { return !!DS.DATA.spells[id]; });
    // the day's spells (AMENDED 09-27): an older save's casters wake with the build's picks, as a new hero does
    if (h.prepared) h.prepared = h.prepared.filter(function (id) { return !!DS.DATA.spells[id]; });
    else if (R.prepCount(h)) h.prepared = R.prepDefault(h);
    // RULED 09-25: every level is a max hit die. An older save's heroes catch up (Aid's +5 set aside first).
    var c = R.CLASSES[h.cls], want = h.lvl * Math.max(1, c.hd + DS.mod(h.abil.con)), base = h.maxhp - ((h.conds && h.conds.aid) || 0);
    if (base < want) { h.maxhp += want - base; h.hp += want - base; }
    if (h.id === 'aurdin' && !h.equip.armor && DS.DATA.items.robes) h.equip.armor = 'robes'; // 09-25: robes for the armor slot
    if (h.id === 'aurdin' && DS.DATA.spells.findfamiliar && h.known.indexOf('findfamiliar') < 0) h.known.push('findfamiliar'); // 09-29: the ritual in his book
    // what his sheet says is due by his level, learned now (10-01c: Aurdin's book filled to the SRD's count -- "match SRD expectations when possible" --
    // an older save's Aurdin had fewer; nothing is taken away, a sheet's spell included)
    var dd = DS.DATA.heroes[h.id];
    if (dd && dd.levels && h.known && !h.guest) {
      // (a level whose spells the player chose keeps his choice: the sheet's pair for it is not due -- 10-14, the level-up pick)
      var due = (dd.spells || []).slice(); for (var lv = 2; lv <= h.lvl; lv++) if (!R.chosen(h, lv, 'spells')) due = due.concat((dd.levels[lv] && dd.levels[lv].learn) || []);
      due.forEach(function (s) { if (DS.DATA.spells[s] && h.known.indexOf(s) < 0) h.known.push(s); });
    }
    var d = DS.DATA.heroes[h.id], arch = (d && d.archetypes) || [];
    if (arch.length && h.lvl >= 3 && !arch.some(function (a) { return a.name === h.subclass; })) { h.subclass = null; if (!R.asking(h, 'archetype')) R.ask(h, 3, [{ kind: 'archetype', need: 1, took: null }]); }
    R.pendSync(h);
    if (!h.attuned) { h.attuned = []; R.attune(h); } // (10-06: an older save's heroes keep what works on them now -- bonded on load)
  };
  R.isArch = function (h, name) { return h.subclass === name; };

  // ---------------------------------------------------------------- the level-up pick (10-14, the level-up pick lane; Griz: "this will be taking over that function and
  // including all class level choices (at least the 4 for the game for now)"; the screen's shape his 10-06 "4 - lean", the build's picks his 10-14 "1-3 lean").
  // What a level gives that the player chooses -- the ability scores at 4 and 8 (the fighter's at 6), a wizard's two spells a level and his cantrip at 4, the
  // rogue's Expertise at 6 and her archetype at 3 (the climb's rule since 09-27, deep16/js/climb.js, now read from the sheet's levels) -- R.levelUp takes the
  // build's default at once, so the AI, the benches, the ladder's card and any path that never asks keep today's numbers, and leaves an ask on the sheet:
  // `h.picks`, one record a level { lvl, asks: [{ kind, need, took }] }. The one pick page (js/menu.js MN.openPicks) shows each with the default marked, and
  // R.applyPick swaps the default for the player's. An archetype has no default (RULED 09-24, the player's choice in this game): it waits, as it always did.
  // `h.chose[lvl]` keeps what was chosen (R.migrate reads it); `h.pendingChoice` is the flag the 8-bit's field opens the page on ('archetype' while one waits,
  // so the benches' own archetype line still finds it).
  // The wizard's list (the climb's, lifted here 10-14: the 8-bit game's spells, Misty Step, the class NPCs' built 09-28, ours of 10-14) and his cantrips
  R.WIZARD_SPELLS = ['burninghands', 'magicmissile', 'shield', 'sleep', 'detectmagic', 'mageArmor', 'thunderwave', 'scorchingray', 'shatter', 'web',
    'holdperson', 'mistystep', 'fireball', 'lightningbolt', 'icestorm', 'greaterinvisibility', 'stoneskin', 'coneofcold', 'holdmonster', 'ropetrick', 'tinyhut',
    'colorspray', 'grease', 'hideouslaughter', 'falselife', 'expeditiousretreat', 'longstrider', 'protectionfromevilandgood', 'fogcloud',
    'acidarrow', 'blur', 'mirrorimage', 'rayofenfeeblement', 'gustofwind', 'enlargereduce', 'magicweapon', 'invisibility', 'darkvision', 'seeinvisibility', 'continualflame', 'darkness',
    'haste', 'slow', 'hypnoticpattern', 'fear', 'vampirictouch', 'blink', 'protectionfromenergy', 'dispelmagic', 'stinkingcloud', 'sleetstorm', 'counterspell',
    'searingscourge', 'deathhandsscourge'];
  R.WIZARD_CANTRIPS = ['firebolt', 'acidsplash', 'light', 'rayoffrost', 'shockinggrasp', 'chilltouch', 'poisonspray', 'truestrike', 'dancinglights'];
  // the subclass a class chooses, the SRD's and ours (10-14, the level-up pick §5, routed 10-08 from the GreyFang window; Griz, 10-14: "better build it for the
  // pocket DM as well, there are actual choices to work with"): `at` the class level it comes, `word` the SRD's name for it, the options with their `id` (the
  // Pocket DM's code word keeps it) and a line of what each does on the grid (deep16/js/features.js, grimoire.js, battle.js). A class not here has the SRD's
  // one alone (deep16/js/classes.js NPC.CLASSES[c].sub). The 8-bit's four read their own sheet's (content/heroes.json archetypes: Vivian's)
  R.SUBCLASSES = {
    barbarian: { at: 3, word: 'PRIMAL PATH', opts: [
      { id: 'berserker', name: 'Path of the Berserker', srd: true, desc: 'Frenzy: raging, a bonus-action attack each turn. At 6, Mindless Rage: no charm or fear while raging.' },
      { id: 'sand', name: 'Path of the Sand', desc: "Talmok's, the pit's own. First Blood: hurt and not raging, the reaction starts a rage. Down in the Sand: raging, once a turn a melee hit puts one Large or smaller down on a failed STR save. At 6, Answer Back: one who misses in melee gets a blow back." }] },
    cleric: { at: 1, word: 'DIVINE DOMAIN', opts: [
      { id: 'life', name: 'Life Domain', srd: true, desc: 'Disciple of Life: a healing spell heals 2 + its level more. At 2, Preserve Life (Channel Divinity); at 6, healing others heals the cleric too; at 8, Divine Strike.' },
      { id: 'window', name: 'the Window', desc: "Kat's: the menders of Tronupholen. The Hand on the Neck: a bonus-action touch, and the first blow to land on that one is rolled again. At 2, The Doubling; at 6, The Showing (Channel Divinity). Illusions always prepared." },
      { id: 'vigil', name: 'the Vigil', desc: "Torvald's: the Ward of the Dormant. Keeper's Ward: a bonus action, the next damage to one within 30 ft cut by 1d8 + level. At 2, Hold the Door (Channel Divinity); at 6, Wakeful: no magic sleep nearby. Wards always prepared." }] },
    ranger: { at: 3, word: 'RANGER ARCHETYPE', opts: [
      { id: 'hunter', name: 'Hunter', srd: true, desc: "Colossus Slayer: once a turn, 1d8 more to a foe that is already hurt." },
      { id: 'greyroad', name: 'the Grey Road', desc: "GreyFang's, the pit-master's way. Turn It Aside: the reaction adds WIS to the AC of one within 5 ft. Pit-Wise: rising and climbing cost less. At 7, Give Ground: the reaction steps back from a foe, and the next bow shot at it has advantage." }] },
    rogue: { at: 3, word: 'ROGUISH ARCHETYPE', opts: [
      { id: 'thief', name: 'Thief', srd: true, desc: 'Fast Hands: using an item is a bonus action. At 9, Supreme Sneak.' },
      { id: 'cutthroat', name: 'Cutthroat', desc: "The game's own (Vivian's other road). Opening Cut: in the first round, advantage on a foe that hasn't acted yet, and a hit on it is a critical." }] },
    warlock: { at: 1, word: 'OTHERWORLDLY PATRON', opts: [
      { id: 'fiend', name: 'The Fiend', srd: true, desc: "Dark One's Blessing: a foe it drops gives temporary HP. At 6, Dark One's Own Luck." },
      { id: 'mirror', name: 'The Mirror', desc: "Amara's. The Mirror's eye: nothing hides or goes invisible before the warlock, in light. Its own list: Glass Whisper and Command; Mirror Image and Detect Thoughts at 3; Hypnotic Pattern and Clairvoyance at 5." }] },
    wizard: { at: 2, word: 'ARCANE TRADITION', opts: [
      { id: 'evocation', name: 'School of Evocation', srd: true, desc: 'Sculpt Spells: an evocation spares the friends caught in it. At 6, Potent Cantrip: a cantrip saved against still does half.' },
      { id: 'rimeglass', name: 'the Rimeglass', desc: "Willem's: illusion with the cold in it. Rime Doubles: a blow that breaks a Mirror Image slows the one who struck by 10 ft. At 6, Rime Step: an illusion cast, and the wizard is 10 ft off, away from the foes." }] }
  };
  // an option by its id or its name, for a class
  R.subOpt = function (cls, key) { var s = R.SUBCLASSES[cls]; return s ? s.opts.filter(function (o) { return o.id === key || o.name === key; })[0] || null : null; };
  // a spell the story game gives only as a page (Griz, 10-06: "storygame some come by collecting pages only (find familiar, etc)"): the lane's list until the road
  // lane's walk decides -- every spell sheet in the world (content/items.json, `use.effect` 'learn'), Counterspell (his quest sheet) and Find Familiar (Ned's page).
  // The ladder and the climb offer them all ("ladder for sure")
  R.pageOnly = function (id) {
    if (id === 'counterspell' || id === 'findfamiliar') return true;
    var its = DS.DATA.items || {};
    return Object.keys(its).some(function (k) { var u = its[k] && its[k].use; return u && u.effect === 'learn' && u.spell === id; });
  };
  // the class's ability score improvement levels (SRD 5.1: 4, 8, 12, 16, 19; the fighter's 6 and 14 too, the rogue's 10). A hero's own sheet names its
  // own at its levels (content/heroes.json `asi`); one whose sheet names none at a level takes the class's increase there (R.CLASSES[c].asi), the default
  R.ASI_AT = { fighter: [4, 6, 8, 12, 14, 16, 19], rogue: [4, 8, 10, 12, 16, 19], _: [4, 8, 12, 16, 19] };
  R.asiLevels = function (cls) { return R.ASI_AT[cls] || R.ASI_AT._; };
  // the picks in a word (the Pocket DM's cards carry a hero's picks into the fight's URL, 10-14): '+^' + level + a letter for the kind + ':' + the values --
  // '^6a:con2', '^4s:shatter-blur', '^4c:light', '^6e:Insight-Sleight_of_Hand', '^3r:Cutthroat' (a space as _)
  var PICK_L = { asi: 'a', spells: 's', cantrip: 'c', expertise: 'e', archetype: 'r' };
  R.picksWord = function (picks) {
    var out = [];
    Object.keys(picks || {}).map(Number).sort(function (a, b) { return a - b; }).forEach(function (L) {
      var ch = picks[L] || {};
      Object.keys(PICK_L).forEach(function (k) {
        var v = ch[k]; if (v == null) return;
        var s = k === 'asi' ? Object.keys(v).filter(function (x) { return v[x] > 0; }).map(function (x) { return x + v[x]; }).join('-') : k === 'archetype' ? String(v).replace(/ /g, '_') : v.map(function (x) { return String(x).replace(/ /g, '_'); }).join('-');
        out.push('^' + L + PICK_L[k] + ':' + s);
      });
    });
    return out;
  };
  R.picksParse = function (parts) {
    var picks = null, K = {}; Object.keys(PICK_L).forEach(function (k) { K[PICK_L[k]] = k; });
    (parts || []).forEach(function (p) {
      var m = /^\^(\d+)([ascer]):(.*)$/.exec(p); if (!m) return;
      var L = +m[1], k = K[m[2]], s = m[3], v;
      if (k === 'asi') { v = {}; s.split('-').forEach(function (x) { var mm = /^(str|dex|con|int|wis|cha)([12])$/.exec(x); if (mm) v[mm[1]] = +mm[2]; }); }
      else if (k === 'archetype') v = s.replace(/_/g, ' ');
      else v = s ? s.split('-').map(function (x) { return x.replace(/_/g, ' '); }) : [];
      picks = picks || {}; (picks[L] = picks[L] || {})[k] = v;
    });
    return picks;
  };
  // a hero made at a level (R.makeHero: the build's picks taken) given the player's instead, level by level -- each swap against what that level took
  // (h.chose); an archetype still waiting is chosen
  R.repick = function (h, picks) {
    Object.keys(picks || {}).map(Number).sort(function (a, b) { return a - b; }).forEach(function (L) {
      if (L > h.lvl) return;
      var ch = picks[L] || {}, made = (h.chose && h.chose[L]) || {}, asks = [], c = {};
      if (ch.archetype != null) {
        var recA = (h.picks || []).filter(function (r) { return r.asks.some(function (a) { return a.kind === 'archetype'; }); })[0];
        if (recA) R.applyPick(h, recA, { archetype: ch.archetype }); else h.subclass = ch.archetype;
      }
      ['asi', 'spells', 'cantrip', 'expertise'].forEach(function (k) { if (ch[k] != null && made[k] != null) { asks.push({ kind: k, need: 0, took: made[k] }); c[k] = ch[k]; } });
      if (asks.length) R.applyPick(h, { lvl: L, asks: asks }, c);
    });
    R.pendSync(h);
  };
  R.ask = function (h, lvl, asks) { (h.picks = h.picks || []).push({ lvl: lvl, asks: asks }); R.pendSync(h); };
  R.asking = function (h, kind) { return (h.picks || []).some(function (p) { return p.asks.some(function (a) { return a.kind === kind; }); }); };
  R.pendSync = function (h) {
    if (h.picks && !h.picks.length) delete h.picks;
    if (h.picks) h.pendingChoice = R.asking(h, 'archetype') ? 'archetype' : 'pick';
    else delete h.pendingChoice;
  };
  // "Aurdin chooses ability scores, two spells and a cantrip next." (a hero's name, no pronoun)
  R.choosesLine = function (h, asks) {
    var w = asks.map(function (a) { return a.kind === 'asi' ? 'ability scores' : a.kind === 'spells' ? (a.need === 1 ? 'a spell' : a.need === 2 ? 'two spells' : a.need + ' spells') : a.kind === 'cantrip' ? (a.need === 1 ? 'a cantrip' : a.need + ' cantrips') : a.kind === 'expertise' ? 'Expertise' : 'an archetype'; });
    return h.name + ' chooses ' + (w.length > 1 ? w.slice(0, -1).join(', ') + ' and ' + w[w.length - 1] : w[0]) + ' next.';
  };
  R.picksDue = function (h) { return !!(h && h.pendingChoice && h.picks && h.picks.length); };
  R.chosen = function (h, lvl, kind) { return !!(h.chose && h.chose[lvl] && h.chose[lvl][kind] != null); };
  // the rows a pick offers: { id, name, desc, lv (a spell's level: the page's tab), max (marks it can take), off (why not), tag } and the default marks
  // o: { pages: true -- the story game: page-only spells left out; built(id) -> '' or why not (the grid's: not on the grid yet) }
  R.pickRows = function (h, rec, ask, o) {
    o = o || {};
    var d = DS.DATA.heroes[h.id] || {}, SP = DS.DATA.spells, took = ask.took;
    if (ask.kind === 'spells' || ask.kind === 'cantrip') {
      var top = R.slotsFor({ cls: h.cls, lvl: rec.lvl, subclass: h.subclass }).length, mine = took || [];
      return (ask.kind === 'cantrip' ? R.WIZARD_CANTRIPS : R.WIZARD_SPELLS).filter(function (id) {
        var sp = SP[id]; if (!sp) return false;
        if (ask.kind === 'cantrip' ? sp.level : !sp.level || sp.level > top) return false;
        if ((h.known || []).indexOf(id) >= 0 && mine.indexOf(id) < 0) return false;
        return !(o.pages && R.pageOnly(id) && mine.indexOf(id) < 0);
      }).map(function (id) {
        var sp = SP[id], why = o.built ? o.built(id) : '';
        return { id: id, name: sp.name, desc: sp.desc || '', lv: sp.level || 0, max: 1, off: why || '', tag: !o.built && sp.grid && !sp.battle && !sp.field ? 'grid' : '' };
      });
    }
    if (ask.kind === 'asi') return R.ABIL.map(function (k) {
      var base = h.abil[k] - ((took && took[k]) || 0);
      return { id: k, name: k.toUpperCase(), score: base, max: Math.max(0, Math.min(2, 20 - base)), off: base >= 20 ? 'already 20' : '' };
    });
    if (ask.kind === 'expertise') {
      var have = (d.expertise || []).concat((h.expertise || []).filter(function (x) { return (took || []).indexOf(x) < 0; }));
      return Object.keys(h.skills || {}).filter(function (k) { return have.indexOf(k) < 0; }).map(function (k) {
        return { id: k, name: k, max: 1, desc: h.name + "'s proficiency counts twice for " + k + '.' + (k === 'Stealth' ? ' (HIDE reads Stealth.)' : '') };
      });
    }
    if (ask.kind === 'archetype') return (d.archetypes || ((R.SUBCLASSES[h.cls] || {}).opts) || []).map(function (a) { return { id: a.name, name: a.name, desc: a.desc || '', max: 1 }; }); // (a sheet's own, else the class's: R.SUBCLASSES)
    return [];
  };
  // the default marks: { id: n }
  R.pickMarks = function (ask) {
    var m = {};
    if (ask.kind === 'asi') Object.keys(ask.took || {}).forEach(function (k) { if (ask.took[k] > 0) m[k] = ask.took[k]; });
    else if (ask.kind === 'archetype') { if (ask.took) m[ask.took] = 1; }
    else (ask.took || []).forEach(function (id) { m[id] = 1; });
    return m;
  };
  // the swap: `ch` by kind -- { asi: { str: 2 }, spells: [ids], cantrip: [ids], expertise: [names], archetype: name }; a kind not in `ch` stays asked.
  // Returns the lines that say what was taken
  R.applyPick = function (h, rec, ch) {
    var lines = [], done = {};
    rec.asks = rec.asks.filter(function (a) {
      var v = ch[a.kind]; if (v == null) return true;
      if (a.kind === 'asi') {
        var con0 = DS.mod(h.abil.con), got = {}, parts = [];
        Object.keys(a.took || {}).forEach(function (k) { h.abil[k] -= a.took[k]; });
        Object.keys(v).forEach(function (k) { var to = Math.min(20, h.abil[k] + v[k]); got[k] = to - h.abil[k]; h.abil[k] = to; if (got[k]) parts.push(k.toUpperCase() + ' +' + got[k]); });
        var dHP = h.lvl * (DS.mod(h.abil.con) - con0); // (a max hit die a level, CON back to level 1: RULED 09-25)
        if (dHP) { h.maxhp += dHP; h.hp = Math.min(h.maxhp, Math.max(h.ko ? 0 : 1, h.hp + dHP)); }
        v = got; lines.push(h.name + ': ' + parts.join(', ') + '.');
      } else if (a.kind === 'spells' || a.kind === 'cantrip') {
        var out = (a.took || []).filter(function (id) { return v.indexOf(id) < 0; });
        h.known = (h.known || []).filter(function (id) { return out.indexOf(id) < 0; });
        if (h.prepared) h.prepared = h.prepared.filter(function (id) { return out.indexOf(id) < 0; });
        v.forEach(function (id) { if (h.known.indexOf(id) < 0) h.known.push(id); });
        if (v.length) lines.push(h.name + ' learns ' + v.map(function (id) { return DS.DATA.spells[id] ? DS.DATA.spells[id].name : id; }).join(', ') + '.');
      } else if (a.kind === 'expertise') {
        h.expertise = (h.expertise || []).filter(function (x) { return (a.took || []).indexOf(x) < 0; }).concat(v);
        lines.push(h.name + ': Expertise in ' + v.join(', ') + '.');
      } else if (a.kind === 'archetype') { h.subclass = v; lines.push(h.name + ' is a ' + v + '.'); }
      done[a.kind] = v;
      return false;
    });
    if (Object.keys(done).length) { h.chose = h.chose || {}; h.chose[rec.lvl] = Object.assign(h.chose[rec.lvl] || {}, done); }
    if (h.picks && !rec.asks.length) h.picks = h.picks.filter(function (p) { return p !== rec; });
    R.pendSync(h);
    return lines;
  };
  // every ask with a default kept as it stands (the ones taken at the level-up); `ch` names any the caller chooses (an archetype: a situation's &rogue=, the
  // benches' first). Nothing without a default and not in `ch` is touched
  R.settlePicks = function (h, ch) {
    (h.picks || []).slice().forEach(function (rec) {
      var c = {};
      rec.asks.forEach(function (a) { var v = ch && ch[a.kind] != null ? ch[a.kind] : a.took; if (v != null) c[a.kind] = v; });
      R.applyPick(h, rec, c);
    });
    R.pendSync(h);
  };
  // no one to ask (the benches, an AI-run party, a headless page): the defaults, and the first archetype -- what the benches have always given her
  R.autoPicks = function (h) {
    var a = ((DS.DATA.heroes[h.id] || {}).archetypes || [])[0];
    R.settlePicks(h, a ? { archetype: a.name } : null);
  };

  // ---------------------------------------------------------------- derived numbers
  R.item = function (id) { return id ? DS.DATA.items[id] : null; };
  // ---------------------------------------------------------------- worn things and attunement (SRD 5.1, srd/13-magic-items.md; RULED 10-06,
  // Griz, on the menu revision's attunement: "SRD compliance ftw, agree with your story calls" -- handoff-2026-10-06-the-menus.md §4). The
  // body's places beside the hands: two rings (`ring`, `ring2`), a cloak, the feet and the neck (an item of kind `worn` names its `place`).
  // An item marked `attune` works only for one bonded with it: three bonds at most, one to an item however many copies. A bond is made at a
  // rest while the item is worn (the SRD's short rest spent on it), and a bond to a thing no longer worn lets go at the next rest (the SRD's
  // 24 hours apart, or another taking it up). Unbonded it is only what it looks like: a sword still cuts, a cloak is a cloak. A sheet with no
  // `attuned` list (a class NPC's, the Pocket DM's made ones) wears its kit bonded, as the SRD's built characters come
  R.PLACES = ['ring', 'ring2', 'cloak', 'feet', 'neck'];
  R.PLACE_NAME = { ring: 'RING', ring2: 'RING', cloak: 'CLOAK', feet: 'FEET', neck: 'NECK' };
  R.ATTUNE_MAX = 3;
  // the slot an item goes in (a ring: the first free hand, else the first)
  R.slotFor = function (h, it) {
    if (!it) return null;
    if (it.kind === 'worn') return it.place || null;
    if (it.kind === 'ring') return h && h.equip && h.equip.ring && !h.equip.ring2 ? 'ring2' : 'ring';
    return /^(weapon|armor|shield|cloak)$/.test(it.kind) ? it.kind : null;
  };
  R.bonded = function (h, id) { var it = R.item(id); return !!it && (!it.attune || !h || !h.attuned || h.attuned.indexOf(id) >= 0); };
  // everything worn or held that works (a light in the hand aside), each item once
  R.gear = function (h) {
    var seen = {}, out = [];
    Object.keys((h && h.equip) || {}).forEach(function (s) { var id = h.equip[s]; if (s === 'torch' || typeof id !== 'string' || seen[id] || !R.bonded(h, id)) return; seen[id] = 1; var it = R.item(id); if (it) out.push(it); });
    return out;
  };
  R.wears = function (h, id) { return Object.keys((h && h.equip) || {}).some(function (s) { return s !== 'torch' && h.equip[s] === id; }); };
  // what the worn things give, read off the items (`resist`, `immune`, `condImmune`: damage types and conditions; `adv`: skills rolled with advantage)
  R.wornList = function (h, key) { var out = []; R.gear(h).forEach(function (g) { (g[key] || []).forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); }); }); return out; };
  R.wornAdv = function (h, skill) { return R.wornList(h, 'adv').indexOf(skill) >= 0; };
  // a condition the worn things make him immune to ends on him (SRD 5.1, the Periapt of Proof against Poison: "you are immune to the poisoned condition" -- one already poisoned who puts it on
  // is not poisoned any more, and the paralysis that rides on the poison goes with it: the 8-bit's `linked`, the grid's `poison`). Returns what it ended. The one place that does it, called where
  // the sheet is read again: R.refresh (any rest) and the grid's SV.unitOf (a sheet becoming a unit, whichever way the thing went on -- the field menu, the camp; no fight puts on a worn thing:
  // the 8-bit's EQUIP in a fight is the weapon and the shield, the grid's is those and the ladder's armour). The 8-bit's battle unit starts with no conditions: nothing carries over to clear there (10-07)
  R.ward = function (h) {
    var c = h && h.conds, out = [];
    if (!c) return out;
    R.wornList(h, 'condImmune').forEach(function (k) {
      if (!c[k]) return;
      delete c[k]; out.push(k);
      Object.keys(c).forEach(function (ck) { var v = c[ck]; if (v && typeof v === 'object' && (v.linked === k || (k === 'poisoned' && v.poison))) delete c[ck]; });
    });
    return out;
  };
  // a rest: keep the bonds to what is still worn, then bond what is worn and not yet bonded, three at most. Returns the lines to say
  R.attune = function (h) {
    var msgs = [], worn = [];
    Object.keys(h.equip || {}).forEach(function (s) { var it = R.item(h.equip[s]); if (s !== 'torch' && it && it.attune && worn.indexOf(h.equip[s]) < 0) worn.push(h.equip[s]); });
    var a = (h.attuned || []).filter(function (id) { return worn.indexOf(id) >= 0; });
    // (h.noBond: what the player let go on the morning's sheet, js/events.js EV.bonds -- it stays unbonded while worn; taken off, the choice is forgotten)
    if (h.noBond) { h.noBond = h.noBond.filter(function (id) { return worn.indexOf(id) >= 0; }); if (!h.noBond.length) delete h.noBond; }
    worn.forEach(function (id) {
      if (a.indexOf(id) >= 0 || (h.noBond && h.noBond.indexOf(id) >= 0)) return;
      var nm = R.item(id).name.replace(/\.$/, ''); // ("Ring of Prot." ends in its own stop)
      if (a.length >= R.ATTUNE_MAX) { msgs.push(h.name + ' cannot bond with the ' + nm + ': three bonds already.'); return; }
      a.push(id); msgs.push(h.name + ' bonds with the ' + nm + '.');
    });
    h.attuned = a;
    return msgs;
  };
  // the bond's state of one worn item, for the menus: '' (needs none), 'bonded', 'unbonded'
  R.bondState = function (h, id) { var it = R.item(id); return !it || !it.attune ? '' : (!h.attuned || h.attuned.indexOf(id) >= 0) ? 'bonded' : 'unbonded'; };
  R.weaponOf = function (h) {
    var w = R.item(h.equip.weapon);
    return w || DS.DATA.items.unarmed;
  };
  R.ac = function (h) {
    var dex = DS.mod(h.abil.dex), ac = 10 + dex;
    var a = R.item(h.equip.armor);
    if (a && a.armor) {
      var dm = a.armor.dexMax;
      ac = a.armor.base + (dm == null ? dex : Math.min(dex, dm)) + (a.armor.bonus || 0);
      if (h.conds.mageArmor && a.armor.type === 'robe') ac = Math.max(ac, 13 + dex + (a.armor.bonus || 0)); // robes aren't armor to the spell
    } else if (h.conds.mageArmor) ac = 13 + dex;
    else {
      // Unarmored Defense (the barbarian 10 + DEX + CON, the monk 10 + DEX + WIS, no shield for the monk); Draconic Resilience 13 + DEX
      var uc = R.CLASSES[h.cls] && R.CLASSES[h.cls].unarmored;
      if (uc && !(h.cls === 'monk' && h.equip.shield)) ac = Math.max(ac, 10 + dex + DS.mod(h.abil[uc]));
      if (h.subclass === 'Draconic Bloodline') ac = Math.max(ac, 13 + dex);
    }
    var s = R.item(h.equip.shield);
    if (s && s.shield) ac += s.shield.ac;
    R.gear(h).forEach(function (g) { if (g.ring && g.ring.ac) ac += g.ring.ac; }); // (either ring, bonded where it must be)
    // a cloak's own (SRD 5.1, the Cloak of Protection: +1 AC), and a plus laid over the armour worn (the Game Show's tier 3 and 4 armour -- his "Yes" to "add their plus
    // to whatever armour the winner wears", 10-07: an item of place `over`, deep16/js/supplies.js)
    R.gear(h).forEach(function (g) { if (g.cloak && g.cloak.ac) ac += g.cloak.ac; if (g.over && g.over.ac && a && a.armor) ac += g.over.ac; });
    if (R.style(h) === 'defense' && a && a.armor && a.armor.type !== 'robe') ac += 1; // Fighting Style: Defense (Lymen's sheet; a class NPC's `style`; from the paladin's 2nd, SRD 5.1 -- 10-06, it was every paladin's from the 1st)
    return ac;
  };
  // wearing real armor (robes aren't armor to Mage Armor): the spell has no one to take it (playtest 09-25 round four)
  R.armored = function (h) { var a = R.item(h.equip.armor); return !!(a && a.armor && a.armor.type !== 'robe'); };
  R.isProfWeapon = function (h, w) {
    var ok = R.CLASSES[h.cls].weapons;
    return w.id === 'unarmed' || ok.indexOf(w.weapon.group) >= 0 || ok.indexOf(w.weapon.kind) >= 0;
  };
  R.canEquip = function (h, it) {
    if (!it) return true;
    var c = R.CLASSES[h.cls];
    if (it.kind === 'weapon') return R.isProfWeapon(h, it);
    if (it.kind === 'armor') return c.armor.indexOf(it.armor.type) >= 0;
    if (it.kind === 'shield') {
      var w = R.item(h.equip.weapon);
      return c.armor.indexOf('shield') >= 0;
    }
    if (it.kind === 'ring' || it.kind === 'cloak' || it.kind === 'worn') return true; // (anyone can wear a ring, a cloak, boots, an amulet)
    return false;
  };
  // a monk weapon (SRD 5.1): the shortsword, or a simple melee weapon that is neither two-handed nor heavy; fists too
  R.monkWeapon = function (w) {
    var wd = w.weapon || {}, p = wd.props || [];
    return w.id === 'unarmed' || wd.kind === 'shortsword' || (wd.group === 'simple' && p.indexOf('ranged') < 0 && p.indexOf('two-handed') < 0 && p.indexOf('heavy') < 0);
  };
  R.martialDie = function (lvl) { return lvl >= 17 ? '1d10' : lvl >= 11 ? '1d8' : lvl >= 5 ? '1d6' : '1d4'; };
  R.weaponAbil = function (h, w) {
    var p = w.weapon.props || [];
    if (p.indexOf('ranged') >= 0) return 'dex';
    if (h.cls === 'monk' && R.monkWeapon(w)) return DS.mod(h.abil.dex) > DS.mod(h.abil.str) ? 'dex' : 'str'; // Martial Arts
    if (p.indexOf('finesse') >= 0) return DS.mod(h.abil.dex) > DS.mod(h.abil.str) ? 'dex' : 'str';
    return 'str';
  };
  R.twoHanded = function (h, w) {
    var p = w.weapon.props || [];
    if (p.indexOf('two-handed') >= 0) return true;
    return p.indexOf('versatile') >= 0 && !h.equip.shield && !h.equip.torch && !h.equip.offhand; // (a torch, or a weapon, in the other hand: one-handed)
  };
  // ---------------------------------------------------------------- the fighting styles (SRD 5.1: the fighter chooses at 1, the paladin
  // and the ranger at 2). One rule, both games (10-06, Griz: Great Weapon Fighting in the 8-bit "yeah", as the grid's; "yeses. Pocket DM is
  // meant exactly for that type of character building"): a story hero's style is on its sheet (content/heroes.json `style`: Barley's and
  // Brann's Great Weapon Fighting, Lymen's Defense), a class NPC's on its own (deep16/js/classes.js; the Pocket DM's maker picks it).
  // Two-Weapon Fighting waits with the off-hand attack itself (only Pyro's own script swings a second weapon)
  R.STYLES = {
    archery: { name: 'Archery', short: 'archery', words: '+2 to hit with ranged weapons' },
    defense: { name: 'Defense', short: 'defense', words: '+1 AC while wearing armour' },
    dueling: { name: 'Dueling', short: 'dueling', words: '+2 damage: a melee weapon in one hand, no other' },
    gwf: { name: 'Great Weapon Fighting', short: 'great weapon', words: 'a 1 or 2 on the die of a two-handed blow: again' },
    protection: { name: 'Protection', short: 'protection', words: 'shield up: the reaction, disadvantage on a blow beside' }
  };
  R.STYLE_AT = { fighter: 1, paladin: 2, ranger: 2 };
  R.STYLE_FOR = { fighter: ['archery', 'defense', 'dueling', 'gwf', 'protection'], paladin: ['defense', 'dueling', 'gwf', 'protection'], ranger: ['archery', 'defense', 'dueling'] };
  // the style a hero fights with now: none before its class's level; its own (a class NPC's, even none), else its sheet's (an 8-bit save never stored one)
  R.style = function (h) {
    var at = R.STYLE_AT[h.cls];
    if (!at || h.lvl < at) return null;
    if ('style' in h) return h.style || null;
    var d = h.id && DS.DATA.heroes[h.id];
    return (d && d.style) || null;
  };
  // Great Weapon Fighting: the style, a melee weapon, both hands on it
  R.gwf = function (h, w) { w = w || R.weaponOf(h); return R.style(h) === 'gwf' && (w.weapon.props || []).indexOf('ranged') < 0 && R.twoHanded(h, w); };
  // Savage Attacks (the half-orc, SRD 5.1): by blood -- a class NPC's race key, or a story sheet's race (10-06: the grid never gave Lymen his, Griz: "inconceivable!")
  R.savage = function (h) { var d = h.id && DS.DATA.heroes[h.id]; return /^half-?orc$/i.test(h.race || (d && d.race) || ''); };
  // ---------------------------------------------------------------- torchdark (09-28; Griz: "Aurdin would pretty much have to carry it lest lyman
  // drop shield"). Hands: a two-handed weapon takes both, a shield one, a torch one, fists none. One law for both games
  // (DEEP16 reads these too: deep16/js/light.js). Darkvision by blood (SRD 5.1) off the sheet's race, or the day's Darkvision
  // spell (conds.darkvision, till the long rest). A light carried in: the Sunshaft staff (always lit), a Continual Flame
  R.freeHands = function (h) {
    var w = R.weaponOf(h), p = w.weapon.props || [];
    var used = (w.id === 'unarmed' ? 0 : p.indexOf('two-handed') >= 0 ? 2 : 1) + (h.equip.shield ? 1 : 0) + (h.equip.torch ? 1 : 0) + (h.equip.offhand ? 1 : 0);
    return Math.max(0, 2 - used);
  };
  R.handsWhy = function (h) {
    var w = R.weaponOf(h), p = w.weapon.props || [], bits = [];
    if (w.id !== 'unarmed') bits.push((p.indexOf('two-handed') >= 0 ? 'both hands on the ' : 'the ') + w.name.toLowerCase());
    if (h.equip.shield) bits.push('the shield');
    if (h.equip.offhand) bits.push('the ' + ((R.item(h.equip.offhand) || {}).name || 'weapon').toLowerCase() + ' in the off hand');
    if (h.equip.torch) bits.push('a light in that hand already');
    return bits.join(' and ') || 'both hands full';
  };
  // ---------------------------------------------------------------- OFFHAND (RULED 10-15, Griz: "OFFHAND is shield hand, just change text and function for where that slot
  // is among slots"; "6 - yeah, in the offhand instead of its own slot"): the other hand holds one thing -- a shield (equip.shield), a weapon (equip.offhand) or the light
  // (equip.torch) -- never two. The keys are the ones a save always had, so an old save is the same save and the AC still reads equip.shield. A two-handed weapon empties it
  // (a light it carries in one hand till it swings, on the grid as ever: deep16/js/light.js). The light goes only there: a shield or a weapon in the off hand comes away first
  R.offhandOf = function (h) { var e = (h && h.equip) || {}; return e.shield ? { kind: 'shield', id: e.shield } : e.offhand ? { kind: 'weapon', id: e.offhand } : e.torch ? { kind: 'light', id: null } : null; };
  // a weapon the off hand may hold: melee, in one hand (a light one swings as the off-hand attack -- R.twoWeapon; another is held, as Pyro's Mace of Disruption for its light)
  R.offhandWeapon = function (it) { var p = (it && it.weapon && it.weapon.props) || []; return !!(it && it.kind === 'weapon' && it.id !== 'unarmed' && p.indexOf('ranged') < 0 && p.indexOf('two-handed') < 0); };
  // a hand for a light: the off hand empty, and the main weapon not on both hands (the 8-bit's; the grid lets a two-hander carry it -- light.js handForLight)
  R.lightHand = function (h) { var e = h.equip || {}; return !e.shield && !e.offhand && !e.torch && R.freeHands(h) > 0; };
  R.lightWhy = function (h) { var e = h.equip || {}; return e.shield ? 'the shield is on the off hand' : e.offhand ? 'the ' + ((R.item(e.offhand) || {}).name || 'weapon').toLowerCase() + ' is in the off hand' : e.torch ? 'a light in that hand already' : R.handsWhy(h); };
  // shooting blind (an attack at a creature the attacker cannot see for want of light): 'disadvantage' is the SRD 5.1's rule
  // (AMENDED 09-28 on Griz's question: the -4 was AD&D's number, "shouldn't be what the game does"); -4 keeps his first notion
  // as a flat penalty instead. One switch, both games (deep16/js/light.js L.BLIND reads it)
  R.BLIND = 'disadvantage';
  R.RACE_DV = { 'Half-orc': 60, 'Dwarf': 60, 'Elf': 60, 'Gnome': 60, 'Tiefling': 60, 'Drow': 120 };
  R.darkvision = function (h) { var d = DS.DATA.heroes[h.id]; return Math.max(R.RACE_DV[d && d.race] || 0, h.conds && h.conds.darkvision ? 60 : 0); };
  // a hooded light (RULED 09-29 the hooded lantern; 09-30 the Ledger-Lamp, "like a lantern but better"): 'lantern', or a pack item whose `light`
  // has a `hood` (the Ledger-Lamp). `k` is a pack id, or the field's g.flags.torchKind ('torch' | 'lantern' | 'ledgerlamp'). One law, both games
  R.hooded = function (k) { var it = k && k !== 'torch' ? R.item(k) : null; return k === 'lantern' || !!(it && it.light && it.light.hood); };
  R.carriesLight = function (h) {
    if (h.conds && h.conds.continualFlame) return true;
    return Object.keys(h.equip || {}).some(function (s) { var it = R.item(h.equip[s]); return !!(it && it.light && it.light.when === 'always' && R.bonded(h, h.equip[s])); }); // (a Mace of Disruption's light is its magic: bonded -- 10-06)
  };
  R.attackBonus = function (h, w) {
    w = w || R.weaponOf(h);
    var b = DS.mod(h.abil[R.weaponAbil(h, w)]) + (R.isProfWeapon(h, w) ? R.prof(h.lvl) : 0) + (w.weapon.bonus || 0);
    if (R.style(h) === 'archery' && (w.weapon.props || []).indexOf('ranged') >= 0) b += 2; // Fighting Style: Archery (a class NPC's; from the ranger's 2nd)
    return b;
  };
  R.damageExpr = function (h, w) {
    w = w || R.weaponOf(h);
    var dice = w.weapon.dmg;
    if (R.twoHanded(h, w) && w.weapon.versatile) dice = w.weapon.versatile;
    var mod = DS.mod(h.abil[R.weaponAbil(h, w)]) + (w.weapon.bonus || 0);
    // Martial Arts (the monk): a fist or a monk weapon hits for the martial-arts die when that is bigger
    if (h.cls === 'monk' && R.monkWeapon(w)) { var md = R.martialDie(h.lvl); if (w.id === 'unarmed' || +md.split('d')[1] > +String(dice).split('d')[1]) dice = md; return { dice: dice, mod: mod, type: w.weapon.type }; }
    // PIT FISTS (the Path of the Sand, 3rd; 09-28h, Griz on Talmok's fists: "Almost certainly"): 1d4 + STR, 1d6 from the 6th
    if (w.id === 'unarmed' && h.subclass === 'Path of the Sand' && h.lvl >= 3) return { dice: h.lvl >= 6 ? '1d6' : '1d4', mod: DS.mod(h.abil.str), type: 'bludgeoning' };
    if (w.id === 'unarmed') return { dice: '0', mod: 1 + DS.mod(h.abil.str), type: 'bludgeoning' };
    // Dueling (10-06): a melee weapon in one hand and no other weapon -- +2 damage
    if (R.style(h) === 'dueling' && (w.weapon.props || []).indexOf('ranged') < 0 && !R.twoHanded(h, w) && !h.equip.offhand) mod += 2;
    return { dice: dice, mod: mod, type: w.weapon.type };
  };
  // a cloak against spells (the King's Mantle, Pyro's: +5 to saving throws against spells, RULED 09-30b): both games add it when the
  // save is against a spell (the 8-bit battle's spellNow; the grid's B.spellNow, deep16/js/pyro.js)
  R.spellSave = function (h) { var c = h && h.equip && h.equip.cloak && R.bonded(h, h.equip.cloak) ? R.item(h.equip.cloak) : null; return (c && c.cloak && c.cloak.spellSave) || 0; };
  // a Cloak of Displacement worn and bonded (SRD 5.1; the 8-bit battle's advantage reads it, as the grid's rules.js edges do -- 10-08, Dace's thanks had done nothing in the 8-bit)
  R.displaced = function (h) { var c = h && h.equip && h.equip.cloak && R.bonded(h, h.equip.cloak) ? R.item(h.equip.cloak) : null; return !!(c && c.cloak && c.cloak.displacement); };
  R.saveBonus = function (h, ab) {
    var b = DS.mod(h.abil[ab]);
    if (h.saveProf && h.saveProf.indexOf(ab) >= 0) b += R.prof(h.lvl);
    R.gear(h).forEach(function (g) {
      if (g.ring && g.ring.saveBonus && g.ring.saveBonus[ab]) b += g.ring.saveBonus[ab];
      if (g.ring && g.ring.saveAll) b += g.ring.saveAll;
      if (g.cloak && g.cloak.saveAll) b += g.cloak.saveAll; // (the Cloak of Protection's +1 to saves, SRD 5.1: the Game Show's Mod Cape, 10-07)
    });
    return b;
  };
  // skills are written at proficiency +2; they grow with it, twice over where there's expertise, and a skill that gains
  // expertise later (the rogue at 6) adds proficiency once more
  R.skill = function (h, name, ab) {
    var s = h.skills && h.skills[name], d = h.id && DS.DATA.heroes[h.id], p = R.prof(h.lvl);
    if (s == null) return DS.mod(h.abil[ab]) + (h.cls === 'fighter' && h.lvl >= 7 && /^(str|dex|con)$/.test(ab) ? Math.ceil(R.prof(h.lvl) / 2) : 0); // (Remarkable Athlete, SRD 5.1, the Champion's 7: half its proficiency, rounded up, to a STR, DEX or CON check it is not proficient in -- R.initBonus has the initiative; the grid's rules §2d, 10-08)
    var base = (d && d.expertise) || [], later = (h.expertise || []).filter(function (x) { return base.indexOf(x) < 0; });
    var grown = d && d.abil && d.abil[ab] != null ? DS.mod(h.abil[ab]) - DS.mod(d.abil[ab]) : 0; // an ability raised since level 2 raises its skills
    return s + (p - 2) * (base.indexOf(name) >= 0 ? 2 : 1) + (later.indexOf(name) >= 0 ? p : 0) + grown;
  };
  R.spellDC = function (h) { var c = R.CLASSES[h.cls], w = R.item(h.equip.weapon); return 8 + R.prof(h.lvl) + DS.mod(h.abil[c.cast || 'int']) + ((w && w.weapon && w.weapon.dcBonus) || 0); };
  R.spellAtk = function (h) { var c = R.CLASSES[h.cls]; return R.prof(h.lvl) + DS.mod(h.abil[c.cast || 'int']); };
  R.initBonus = function (h) { return DS.mod(h.abil.dex) + (h.cls === 'fighter' && h.lvl >= 7 ? Math.ceil(R.prof(h.lvl) / 2) : 0); }; // Remarkable Athlete
  R.critRange = function (h) { return (h.cls === 'fighter' && h.lvl >= 3) ? 19 : 20; };
  R.attacksPerTurn = function (h) { if (h.attacks) return h.attacks; if (h.cls === 'fighter' && h.lvl >= 11) return 3; return (/^(fighter|paladin|barbarian|ranger|monk)$/.test(h.cls) && h.lvl >= 5) ? 2 : 1; }; // Extra Attack at 5; the fighter's second at 11 (SRD 5.1; the named past 9, 09-30)
  R.maxSlotLevel = function (h) { var m = 0; (h.slotsMax || []).forEach(function (n, i) { if (n > 0) m = i + 1; }); return m; };
  R.lowestSlot = function (h, min) { for (var i = (min || 1) - 1; i < (h.slots || []).length; i++) if (h.slots[i] > 0) return i + 1; return 0; };
  R.cantripDice = function (sp, h) {
    var d = sp.dmg; if (!sp.scale) return d;
    Object.keys(sp.scale).forEach(function (lv) { if (h.lvl >= +lv) d = sp.scale[lv]; });
    return d;
  };
  // a levelled spell's dice cast `up` slots above its own level: the SRD's At Higher Levels, `upDice` more of its die a slot. Ours (10-14, Griz, Deathhand's
  // Searing Scourge: "deathhand's goes from 1d4 to 1d6 then 1d6 per slot"): `upDie` -- the first slot above turns the dice to that die, and each slot past
  // it adds `upDice` -- and `up2`, the second die (`dmg2`) grows the same way. Both games read it: js/battle.js (the 8-bit), deep16/js/magic.js M.dice / M.dice2
  R.slotDice = function (expr, sp, up) {
    if (!expr || !(up > 0) || !sp.upDice) return expr;
    return expr.replace(/^(\d+)d(\d+)/, function (m, n, d) { return sp.upDie ? (+n + sp.upDice * (up - 1)) + 'd' + sp.upDie : (+n + sp.upDice * up) + 'd' + d; });
  };
  R.slotDice2 = function (sp, up) { return sp.dmg2 && sp.up2 ? R.slotDice(sp.dmg2, sp, up) : sp.dmg2; };
  // ---------------------------------------------------------------- the day's spells (SRD 5.1; AMENDED 09-27, Griz: the casters
  // choose, "spell section to pre-save-post-sleep"). A wizard prepares INT modifier + his level from his spellbook (h.known); a
  // paladin CHA modifier + half his level from the whole paladin list, and nothing at level 1; both only of levels they have
  // slots for. Cantrips are always ready, and so, uncounted, are the Oath of Devotion's spells and a wizard's rituals (cast
  // from the book as rituals, in the field). DEEP16 reads these same functions (deep16/js/save.js): one law for both games.
  // `spellOf` is the lookup (DEEP16 passes its own, which also knows the grid's spells)
  // Command, Branding Smite and Magic Weapon joined 09-28 (built on the grid for the class NPCs; RULED 09-28g, Griz: "they have to be
  // able to transfer back and forth from 16bit fights" -- so the 8-bit battle casts them too, js/battle.js)
  R.PALADIN_SPELLS = ['bless', 'command', 'curewounds', 'shieldoffaith', 'divinefavor', 'heroism', 'lesserrestoration', 'aid', 'brandingsmite', 'magicweapon', 'revivify', 'daylight'];
  function spellData(id) { return DS.DATA.spells[id]; }
  // the Oath of Devotion's spells (SRD 5.1): Protection from Evil and Good and Sanctuary from 3, Lesser Restoration from 5 (Zone of
  // Truth, its pair, isn't built; nor the 9th's -- Beacon of Hope and Dispel Magic are grid-only spells, HELD in the 8-bit since 10-03; the grid's class paladin has them, js/classes.js). Both games (the 3rd's pair was the grid's alone till 09-28g)
  R.oathSpells = function (h) {
    if (h.cls !== 'paladin' || h.lvl < 3) return [];
    return ['protectionfromevilandgood', 'sanctuary'].concat(h.lvl >= 5 ? ['lesserrestoration'] : []);
  };
  R.prepCount = function (h) {
    if (h.cls === 'wizard') return Math.max(1, DS.mod(h.abil.int) + h.lvl);
    if (h.cls === 'paladin') return h.lvl >= 2 ? Math.max(1, DS.mod(h.abil.cha) + Math.floor(h.lvl / 2)) : 0;
    return 0;
  };
  R.prepPool = function (h, spellOf) {
    spellOf = spellOf || spellData;
    var top = (h.slotsMax || R.slotsFor(h)).length, oath = R.oathSpells(h), src = h.cls === 'wizard' ? (h.known || []) : h.cls === 'paladin' ? R.PALADIN_SPELLS : [];
    return src.filter(function (id) { var sp = spellOf(id); return sp && sp.level > 0 && sp.level <= top && !sp.ritual && oath.indexOf(id) < 0; })
      .map(function (id, i) { return { id: id, i: i, lv: spellOf(id).level }; }).sort(function (a, b) { return a.lv - b.lv || a.i - b.i; })
      .map(function (x) { return x.id; }); // (by level, then the book's order)
  };
  R.ritualsOf = function (h, spellOf) {
    spellOf = spellOf || spellData;
    return h.cls === 'wizard' ? (h.known || []).filter(function (id) { var sp = spellOf(id); return sp && sp.ritual; }) : [];
  };
  // the day the build would pick, what you get if you never touch the choice: what the levelling gave him first, the highest
  // levels first, Mage Armor always (it's cast in the morning)
  function prepRanked(h, spellOf) {
    var build = h.known || [];
    var rank = function (id) { var sp = spellOf(id); return (id === 'mageArmor' ? 100 : id === 'shield' ? 90 : id === 'counterspell' ? 85 : id === 'magicmissile' ? 80 : 0) + (build.indexOf(id) >= 0 ? 50 : 0) + sp.level * 5 + (sp.battle || id === 'mageArmor' ? 0 : -60); }; // (Shield next after Mage Armor: a wizard's default day always holds it, since it is the reaction and never on the MAGIC list -- RULED 10-03, Griz: "yes"; Counterspell, the other reaction, and Magic Missile after it, and a spell with no use in a fight -- Rope Trick, field only -- below every one that has: 10-05, Griz: "What lvl 1 spells is aurdin coming in with, no MM" -- "2 yes")
    return R.prepPool(h, spellOf).sort(function (a, b) { return rank(b) - rank(a); });
  }
  R.prepDefault = function (h, spellOf) { return prepRanked(h, spellOf || spellData).slice(0, R.prepCount(h)); };
  // the morning: what he chose stays; places the day has grown by (a level since) take the build's next picks, so one who
  // never touches the choice still gets what the levelling gave him
  R.prepFill = function (h, spellOf) {
    spellOf = spellOf || spellData;
    var n = R.prepCount(h), pool = R.prepPool(h, spellOf);
    var cur = (h.prepared || []).filter(function (id) { return pool.indexOf(id) >= 0; }).slice(0, n);
    prepRanked(h, spellOf).forEach(function (id) { if (cur.length < n && cur.indexOf(id) < 0) cur.push(id); });
    return cur;
  };
  // what a hero can cast today: one who prepares nothing (a fighter, a guest) everything he knows; one who prepares, his
  // cantrips, the day's spells, the oath's, and away from a fight the book's rituals
  R.castable = function (h, where, spellOf) {
    spellOf = spellOf || spellData;
    var k = h.known || [];
    if (!h.prepared) return k.slice();
    var cantrips = k.filter(function (id) { var sp = spellOf(id); return sp && !sp.level; });
    return cantrips.concat(h.prepared, R.oathSpells(h), where === 'battle' ? [] : R.ritualsOf(h, spellOf)).filter(function (id, i, a) { return a.indexOf(id) === i; });
  };
  // spells a hero may cast now (battle or field)
  R.spellList = function (h, where) {
    return R.castable(h, where).map(function (id) { return DS.DATA.spells[id]; }).filter(function (sp) {
      if (!sp) return false;
      if (where === 'battle' && !sp.battle) return false;
      if (where === 'field' && !sp.field) return false;
      if (sp.level > R.maxSlotLevel(h) && sp.level > 0) return false;
      return true;
    });
  };
  R.alive = function (h) { return !h.ko && h.hp > 0; };
  R.canAct = function (u) { return !u.ko && u.hp > 0 && !u.conds.paralyzed && !u.conds.asleep && !u.conds.stunned; };
  R.CONDS = {
    poisoned: 'PSN', frightened: 'FRT', restrained: 'RST', prone: 'PRN', asleep: 'SLP', paralyzed: 'PAR', grappled: 'GRP',
    blinded: 'BLD', hidden: 'HID', stunned: 'STN', engulfed: 'ENG', invisible: 'INV', stoneskin: 'STN', seeInvisible: 'SEE',
    blessed: 'BLS', shieldOfFaith: 'SOF', heroism: 'HRO', divineFavor: 'DVF', sacred: 'SWD', shielded: 'SHD' // (the 8-bit's buffs as conditions, 10-03: the one-buff slot retired)
  };

  // ---------------------------------------------------------------- Find Familiar (SRD 5.1; REINSTATED 09-29, Griz: "familiars are pretty sweet -
  // let's reinstate"; cast from the field menu, the shape picked by where you stand: "select by biome"). The forms' numbers are the SRD's
  // (a spirit in the shape, fey by default); `sheet` is DEEP16's figure for it (a form with no sheet yet is left off the pick). The
  // snowy owl is the owl in the snowfield's feathers. Both games read this: js/familiar.js (the ritual, the 8-bit shoulder) and
  // deep16/js/familiar.js (the grid's familiar)
  // `perk` is what each lends its caster (RULED 09-30, Griz: "rat grants nightvision, spider buffs web spell and gives 'webwalk' ...
  // snake sense hidden within 15 feet (counts as vision)" · "Agreed with vision range." · "EXCELLENT call on the frog. will need
  // audible." · "Snake still charm related spells, diplomacy and persuasion checks by caster"): darkvision (ft), sonar (ft through any
  // dark: blindsight), senseHidden (ft: the hidden and the invisible are seen), webWalker, webDC (+ to his Web's save DC), charmDC (+ to
  // the save DC of his spells that charm), persuasion ('adv': a familiar may take the Help action on a check, SRD), alarm (he is never
  // caught off guard: it croaks). A perk is its CASTER's, whoever that is -- the NPC casters and the Pocket DM's have them too (his word).
  // `help`: 'auto' the owls (Flyby), else on the caster's order (the grid; the bat too -- RULED 09-30, Griz: "i think the bat not helping is out
  // of balance and should be orderable in the 16 and let it keep doing it in the 8"). `perch`: 'head' the bat ("have it flutter around his head")
  R.FAMILIARS = {
    owl: { name: 'owl', ac: 11, hp: 1, speed: 5, fly: 60, darkvision: 120, flyby: true, help: 'auto', perk: {}, sheet: 'owl_p2', scale: 0.75, gift: 'flies 60 ft; sees 120 ft in the dark; swoops in to help and out of reach unharmed' },
    snowyowl: { name: 'snowy owl', ac: 11, hp: 1, speed: 5, fly: 60, darkvision: 120, flyby: true, help: 'auto', perk: {}, sheet: 'snowyowl_p2', scale: 0.75, gift: 'an owl in the snowfield\'s feathers: flies 60 ft, swoops in to help and out of reach unharmed' },
    bat: { name: 'bat', ac: 12, hp: 1, speed: 5, fly: 30, blindsight: 60, perch: 'head', perk: { sonar: 15 }, sheet: 'giantbat_p1', scale: 0.225, /* (half what it was: 10-01b, Griz: "make the familiar bat 50% smaller") */ gift: 'flutters about his head; lends him its ears: he knows what is within 15 ft in any dark; carries a touch spell' },
    rat: { name: 'rat', ac: 10, hp: 1, speed: 20, darkvision: 30, perk: { darkvision: 30 }, sheet: 'giantrat_p1', scale: 0.5, gift: 'lends him its eyes: darkvision 30 ft; quick and small; carries a touch spell' },
    spider: { name: 'spider', ac: 12, hp: 1, speed: 20, darkvision: 30, webWalker: true, perk: { webWalker: true, webDC: 1 }, sheet: 'wolfspider_p1', scale: 0.4, gift: 'webs do not hold him or it; his Web holds the tighter (+1); carries a touch spell' },
    frog: { name: 'frog', ac: 11, hp: 1, speed: 20, swim: 20, darkvision: 30, perk: { alarm: true }, sheet: 'giantfrog_p1', scale: 0.45, gift: 'croaks when danger comes: he is never caught off guard; swims; carries a touch spell' },
    snake: { name: 'snake', ac: 13, /* (the SRD's form is the poisonous snake, but "a familiar can't attack" (SRD 5.1 Find Familiar): it never poisons, so its name drops it -- 10-01b, Griz: "remove poisonous from the snake familiars title unless it can be used (according to the SRD) to poison targets") */ hp: 2, speed: 30, swim: 30, blindsight: 10, sense: 'tongue', perk: { senseHidden: 15, charmDC: 1, persuasion: 'adv' }, sheet: 'snake_p1', scale: 0.55, gift: 'he senses the hidden and unseen within 15 ft; his charms bite deeper (+1), his Persuasion has advantage' }
  };
  // Lisbet's charm (content/items.json `charm`, a ring; Charms & Chalk, Silverton): whoever wears it cannot be frightened. HIDDEN BY RULING --
  // Griz, 09-30: "let's make that charm grant immune to fear in the mechanics, but not say so anywhere the player sees". Its words stay "No
  // promises made."; no card or line ever names it: a fright that would take simply does not (js/battle.js the moan; deep16/js/rules.js RU.save)
  R.fearWard = function (h) { return R.wears(h, 'charm'); };
  // the spells that charm (the snake's charmDC; the SRD's enchantments that lay the charmed condition or take the will): both games
  R.CHARM_SPELLS = ['charmperson', 'animalfriendship', 'hypnoticpattern', 'irresistibledance', 'suggestion', 'masssuggestion', 'dominatebeast', 'dominateperson', 'dominatemonster', 'geas'];
  // the world map's ground (content/maps/world.json legend) -> the shapes a spirit takes there; off the world map: the caves' or the town's
  R.FAM_GROUND = {
    snow: { tiles: 'o*', forms: ['snowyowl'] },
    fields: { tiles: '.,nfyp=bv134567g', forms: ['owl', 'rat'] },
    forest: { tiles: 'tz', forms: ['owl', 'spider'] },
    water: { tiles: '~w%r', forms: ['frog', 'snake'] },
    stone: { tiles: '^xcuse', forms: ['bat', 'spider', 'snake'] },
    cave: { tiles: '28', forms: ['bat', 'rat', 'spider'] }
  };
  R.famForms = function (tile, mapKind) {
    if (mapKind && mapKind !== 'world') return mapKind === 'town' ? ['rat', 'owl'] : ['bat', 'rat', 'spider'];
    for (var k in R.FAM_GROUND) if (R.FAM_GROUND[k].tiles.indexOf(tile) >= 0) return R.FAM_GROUND[k].forms;
    return ['owl'];
  };
})();
