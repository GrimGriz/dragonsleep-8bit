/* DEEP16 — MPMon, the Monster Party Monster (10-06): Griz's stream table brought onto the grid. Monster Party is his own
   game, played live with the hivemind (they live\monster-party-prep\monster-party-mechanics.md, battle-info.md): four
   persistent PCs, each with a regular blow and two specials, 2 specials an encounter, every number a per-level formula.
   Griz, 10-06: "MPMon (MonsterPartyMonster) as a separate class to keep our hands clear of the other machinery"; "Make the
   projection a 3rd ability/feature that unlocks at level 5"; "Denny Race Lobstamonkee"; "Come up with a level 5 for him
   that is loosely 'balanced' with what player classes get at level 5"; "Build now". The design and its arithmetic:
   they live\beholda\deep16-translation.md (MP's numbers to the SRD's scale by 0.27, HP and specials alike).

   A class of its own, kept in this file: it registers itself (R.CLASSES.mpmon, its natural weapons and hides, two named
   builds), wraps the hooks it needs and touches no class's code. Two builds so far, each on the Pocket DM's roster and
   fielded by word like any named NPC (?npc=...&vs=denny:5,beholda:5):
     DENNY, a Lobstamonkee: climbs; MONKEY FISTS; TAUNT and DENIM DAMAGE; at 5, Extra Attack and CANNONBALL.
     BEHOLDA, an EyeGregore: hovers, sees 120 ft in the dark, has no hands; DICE SLAM (her dice swung on her will, WIS);
       the VNA BUBBLE and BALEFUL GAZE; at 5, the BIG SCREEN (the projection, a cone).
   THE SPECIALS: 2 a fight, shared, back on a short rest (MP's "2 specials per encounter" as it stands). Rascal and Goose
   are two more builds the day they are wanted. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, R = DS.R, G = D.grid, RU = D.rules, M = D.magic, FX = D.fx, AI = D.ai, TX = D.tactics, F = D.features, NPC = D.npc;
  var MP = D.mpmon = {};
  function mod(s) { return Math.floor(((s || 10) - 10) / 2); }
  function nm(B, w) { return w.side === 'foe' ? (w.named ? B.shortName(w) : 'the ' + B.shortName(w)) : w.name; }
  function Nm(B, w) { var s = nm(B, w); return s.charAt(0).toUpperCase() + s.slice(1); }
  function standing(w) { return w && G.standing(w) && !w.object; }

  // ------------------------------------------------------------------ the class, its kinds, its two builds
  // (cast 'wis': the spell DC the unit carries is 8 + prof + WIS, Beholda's gaze; Denny's DCs are his STR's, below. hd: the Pocket DM's short
  // rest rolls the class's die -- a d10 for both; Beholda's own hit points are a d8's)
  R.CLASSES.mpmon = { name: 'MP Monster', hd: 10, saves: ['con', 'wis'], armor: [], weapons: ['natural'], primary: 'str', cast: 'wis', asi: {} };
  MP.SPECIALS = 2;
  MP.KINDS = {
    lobstamonkee: { name: 'Lobstamonkee', speed: 30, climbs: true, type: 'humanoid' }, // (Griz's spelling, 10-06; MP's docs write lobstamonkey)
    eyegregore: { name: 'EyeGregore', speed: 25, flies: true, dv: 120, noHands: true, type: 'aberration' } // (his name for her kind, 10-06: the book's beholder is not in the SRD)
  };
  MP.BUILDS = {
    denny: { name: 'Denny', kind: 'lobstamonkee', hd: 10, abil: { str: 16, dex: 14, con: 16, int: 8, wis: 10, cha: 12 }, asi: { 4: 'str', 8: 'str' },
      saves: ['str', 'con'], weapon: 'monkeyfists', armor: 'denimjacket', look: 'denny_p2', extraAttack: 5 },
    beholda: { name: 'Beholda', kind: 'eyegregore', hd: 8, abil: { str: 10, dex: 14, con: 14, int: 12, wis: 16, cha: 13 }, asi: { 4: 'wis', 8: 'wis' },
      saves: ['wis', 'cha'], weapon: 'diceslam', armor: 'eyehide', look: 'beholda_p2' }
  };
  // the natural weapons and hides: items so every rule that reads a weapon or an armour reads them, kept off the maker's racks (noSell)
  var IT = DS.DATA.items, SRC = 'they live/beholda/deep16-translation.md; invented.json#mpmon';
  IT.monkeyfists = { name: 'Monkey Fists', kind: 'weapon', price: 0, noSell: true, weapon: { dmg: '1d6', versatile: '1d8', type: 'bludgeoning', group: 'natural', kind: 'monkeyfists', props: ['versatile'] }, desc: 'Bare fists: 1d6 + STR, 1d8 with both hands free.', src: SRC };
  IT.diceslam = { name: 'Dice Slam', kind: 'weapon', price: 0, noSell: true, weapon: { dmg: '1d8', type: 'bludgeoning', group: 'natural', kind: 'diceslam', props: [], abil: 'wis' }, desc: 'Her three dice swung on their chains, on her will: 1d8 + WIS.', src: SRC };
  IT.denimjacket = { name: 'Denim Jacket', kind: 'armor', price: 0, noSell: true, armor: { base: 12, type: 'light' }, desc: 'Studded denim: AC 12 + DEX.', src: SRC };
  IT.eyehide = { name: 'EyeGregore Hide', kind: 'armor', price: 0, noSell: true, armor: { base: 12, type: 'natural' }, desc: 'Her fuzz is tougher than it looks: AC 12 + DEX.', src: SRC };
  // a weapon swung by an ability of its own (Dice Slam's WIS): the one line the shared rules need
  var wa0 = R.weaponAbil; R.weaponAbil = function (h, w) { return (w && w.weapon && w.weapon.abil) || wa0(h, w); };
  // by name, at any level (as Higertha stands): ?npc=denny:5, the Pocket DM's seats
  NPC.NAMED.denny = { name: 'Denny', cls: 'mpmon', build: 'denny', named: true, look: 'denny_p2' };
  NPC.NAMED.beholda = { name: 'Beholda', cls: 'mpmon', build: 'beholda', named: true, look: 'beholda_p2' };

  // the sheet: the build's numbers at the level (the SRD's average hit points; an ASI at 4 and 8), the natural kit, the specials
  MP.sheet = function (spec) {
    var b = MP.BUILDS[spec.build] || MP.BUILDS.denny, lvl = Math.max(1, Math.min(9, spec.lvl || 1)), abil = JSON.parse(JSON.stringify(b.abil));
    Object.keys(b.asi).forEach(function (at) { if (lvl >= +at) abil[b.asi[at]] = Math.min(20, abil[b.asi[at]] + 2); });
    var con = mod(abil.con), hp = b.hd + con + (lvl - 1) * (b.hd / 2 + 1 + con);
    var h = {
      id: spec.id || spec.build, name: spec.name || b.name, cls: 'mpmon', build: spec.build, lvl: lvl, xp: R.XP_LEVEL[lvl], base: JSON.parse(JSON.stringify(abil)), abil: abil,
      maxhp: hp, hp: hp, equip: { weapon: b.weapon, armor: b.armor, shield: null, ring: null, cloak: null }, known: [], feats: { specials: MP.SPECIALS }, conds: {},
      subclass: b.name, saveProf: b.saves.slice(), style: null, skills: {}, expertise: [], race: b.kind, npc: true, named: true, alt: null, slots: [], slotsMax: [],
      attacks: b.extraAttack && lvl >= b.extraAttack ? 2 : 1
    };
    if (b.kind === 'eyegregore') h.skills.Perception = mod(abil.wis) + 2; // (an eye: proficient)
    if (b.kind === 'lobstamonkee') h.skills.Athletics = mod(abil.str) + 2;
    if (spec.loot) NPC.wear(h, spec.loot);
    NPC.carry(h, spec);
    return h;
  };
  var sheet0 = NPC.sheet; NPC.sheet = function (spec) { return spec && spec.cls === 'mpmon' ? MP.sheet(spec) : sheet0.apply(this, arguments); };
  var unit0 = NPC.unit; NPC.unit = function (h, side, o) {
    var u = unit0.apply(this, arguments);
    if (h.cls !== 'mpmon') return u;
    var b = MP.BUILDS[h.build], k = MP.KINDS[b.kind];
    u.kind = 'npcmpmon'; u.mpmon = h.build; u.race = b.kind; u.type = k.type; u.speed = k.speed;
    u.sheet = (o && o.sheet) || b.look;
    if (k.flies) u.flies = true;
    if (k.climbs) u.climbs = true;
    if (k.noHands) u.noHands = true;
    u.darkvision = Math.max(u.darkvision || 0, k.dv || 0);
    return u;
  };
  MP.left = function (u) { return (u.feats && u.feats.specials) || 0; };
  function spend(u) { u.feats.specials = Math.max(0, MP.left(u) - 1); }
  function leftText(u) { var n = MP.left(u); return n + ' special' + (n === 1 ? '' : 's') + ' left'; }

  // ------------------------------------------------------------------ the numbers by level (deep16-translation.md)
  MP.tauntDC = function (u) { return 8 + u.prof + mod(u.abil.str); };
  MP.tauntDice = function (L) { return L >= 9 ? '3d6' : L >= 5 ? '2d6' : '1d6'; };
  MP.denimDice = function (L) { return L >= 8 ? '4d8' : L >= 6 ? '3d8' : L >= 4 ? '2d8' : '1d8'; };
  MP.cannonDice = function (L) { return L >= 9 ? '3d8' : '2d8'; };
  MP.bubbleR = function (L) { return Math.min(30, 10 + 5 * L); };
  MP.bubbleAC = function (L) { return Math.min(5, 1 + Math.floor(L / 2)); };
  MP.gazeDice = function (L) { return L + 'd8'; };
  MP.screenDice = function (L) { return Math.max(1, L - 1) + 'd8'; };
  MP.SCREEN = { shape: 'cone', len: 30 };

  // who is where: foes in reach, foes it sees within a range
  MP.foes = function (B, u, ft, see) { return B.units.filter(function (w) { return G.hostile(u, w) && standing(w) && G.dist(u, w) <= ft && (!see || M.sees(B, u, w)); }); };
  MP.inReach = function (B, u) { return MP.foes(B, u, G.reachOf(u)); };

  // ------------------------------------------------------------------ the blows: the Attack's swings (two from Denny's 5th), a rider on the first that lands
  function* blows(B, u, t, name, extra) {
    var T = u.turn, n = u.attacksBase || 1, landed = false;
    T.action = 0; T.attackAction = true;
    for (var i = 0; i < n && !u.dead && u.hp > 0; i++) {
      var tgt = standing(t) && G.dist(u, t) <= G.reachOf(u) ? t : MP.inReach(B, u).sort(function (a, b) { return a.hp - b.hp; })[0];
      if (!tgt) break;
      var atk = landed ? u.weapon : Object.assign({}, u.weapon, { name: name, extra: extra, extraType: 'bludgeoning' });
      var hp0 = tgt.hp, dead0 = !!tgt.dead;
      yield* B.attack(u, tgt, atk);
      if (!landed && (tgt.hp < hp0 || (!!tgt.dead && !dead0))) landed = true;
      if (u.conds.hidden) delete u.conds.hidden;
    }
    return landed;
  }

  // TAUNT (Denny; an action, a special): his swings, the first to land +1d6 (2d6 at 5th, 3d6 at 9th); hit or miss, the one he swung at and up to
  // his proficiency bonus more foes within 15 ft save WIS (8 + prof + STR) or are TAUNTED till the end of their next turn: they may go only at him
  // if they can reach him (the AI's targeting: MP.tauntTarget), and have disadvantage on attacks at anyone else (RU.edges, below). MP: "Taunts
  // target; one additional target taunted per action-die success" -- about three at 4th, five at 9th
  MP.taunt = function* (B, u, t) {
    spend(u);
    B.card(['{y}' + u.name + '{/}: TAUNT!  {g}(he waggles his fingers by his ears: come on, then){/}'], 200); D.sfx('crit');
    yield* blows(B, u, t, 'Taunt', MP.tauntDice(u.lvl));
    if (u.dead || u.hp <= 0) return;
    var dc = MP.tauntDC(u), list = [t].filter(standing).concat(MP.foes(B, u, 15).filter(function (w) { return w !== t && !w.conds.deafened; }).sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })).slice(0, 1 + u.prof);
    var lines = ['{y}' + u.name + '{/}\'s taunt  WIS DC ' + dc + '  {g}(' + leftText(u) + '){/}'];
    list.forEach(function (w) {
      if (RU.immuneTo(w, 'taunted', u)) { lines.push('  ' + Nm(B, w) + ': {g}pays him no mind{/}'); return; }
      var sv = RU.save(w, 'wis', dc, false, 'taunted');
      lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}keeps its head{/}' : '{o}TAUNTED{/} {g}(only at Denny, till its turn ends){/}'));
      if (!sv.ok) { w.conds.taunted = { by: u.id, name: u.name, till: { who: w.id, at: 'end', n: 1 }, endText: '{who} is no longer taunted.' }; FX.ring(w, 'red', 26); }
    });
    if (!list.length) lines.push('  {g}no foe near enough to hear it.{/}');
    B.card(lines, 360); yield 24;
  };
  // DENIM DAMAGE (Denny; an action, a special): his swings, the first to land +1d8 (2d8 at 4th, 3d8 at 6th, 4d8 at 8th) -- doubled on a critical
  MP.denim = function* (B, u, t) {
    spend(u);
    B.card(['{y}' + u.name + '{/}: DENIM DAMAGE!  {g}(' + MP.denimDice(u.lvl) + ' on the first blow that lands; ' + leftText(u) + '){/}'], 200); D.sfx('crit');
    yield* blows(B, u, t, 'Denim Damage', MP.denimDice(u.lvl));
  };
  // CANNONBALL (Denny, 5th; an action, a special) -- his level 5 beside Extra Attack, set against what the classes get there (a fighter's Extra Attack; a
  // monk's Stunning Strike; a wizard's Fireball, 8d6 in a 20-ft sphere twice a day): a leap of up to 20 ft (no opportunity attacks: he is in the air) to a
  // square beside a foe; every foe within 5 ft where he lands saves DEX (8 + prof + STR) or takes 2d8 bludgeoning (3d8 at 9th) and is knocked prone
  // (half, and on its feet, on a success; a Huge one is not knocked down); then one swing at the one he came down by. His sheet's Jump pose, a lobstamonkey's spring
  MP.landings = function (B, u, t) {
    var out = [];
    for (var y = t.y - 1; y <= t.y + (t.size || 1); y++) for (var x = t.x - 1; x <= t.x + (t.size || 1); x++) {
      if ((x === u.x && y === u.y) || !G.canStand(u, x, y) || G.dist(u, t, x, y) > 5) continue;
      if (Math.max(Math.abs(x - u.x), Math.abs(y - u.y)) * 5 > 20 || !G.losPoint(u.x, u.y, x, y)) continue;
      out.push([x, y]);
    }
    return out;
  };
  MP.leapTargets = function (B, u) { return MP.foes(B, u, 25, true).filter(function (w) { return MP.landings(B, u, w).length > 0; }); };
  function beside(B, u, x, y) { return B.units.filter(function (w) { return G.hostile(u, w) && standing(w) && G.dist(u, w, x, y) <= 5; }); }
  MP.cannonball = function* (B, u, t) {
    var lands = MP.landings(B, u, t); if (!lands.length) return false;
    var q = lands.map(function (s) { return { s: s, n: beside(B, u, s[0], s[1]).length, d: Math.hypot(s[0] - u.x, s[1] - u.y) }; }).sort(function (a, b) { return b.n - a.n || a.d - b.d; })[0].s;
    var T = u.turn; spend(u); T.action = 0; T.attackAction = true;
    if (u.conds.hidden) delete u.conds.hidden;
    if (u.conds.prone) delete u.conds.prone; // (he springs up off the floor into it)
    u.tween = { fx: u.x, fy: u.y, fz: 60, t: 0, dur: B.pace(22, true) }; u.x = q[0]; u.y = q[1];
    u.facing = B.faceTo(u, t); u.anim = D.spr.anim(u.sheet, 'cannonball') ? 'cannonball' : 'attack'; u.animT = B.t; D.sfx('crit');
    B.keepInView && B.keepInView(u);
    yield 24;
    var dx = MP.cannonDice(u.lvl), r = D.roll(dx), dc = MP.tauntDC(u), hurt = [];
    var lines = ['{y}' + u.name + '{/}: CANNONBALL!  ' + dx + ' ' + RU.fmtRolls(r.rolls) + ' = {o}' + r.total + '{/} bludgeoning  DEX DC ' + dc + '  {g}(' + leftText(u) + '){/}'];
    beside(B, u, u.x, u.y).forEach(function (w) {
      var sv = RU.save(w, 'dex', dc, false, 'prone', r.total), ev = RU.evasion(w), n = sv.ok ? (ev ? 0 : Math.floor(r.total / 2)) : (ev ? Math.floor(r.total / 2) : r.total);
      var flat = !sv.ok && !w.noProne && !RU.immuneTo(w, 'prone') && (w.size || 1) <= 2;
      lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}keeps its feet{/}' : '{o}failed' + (flat ? ': PRONE' : '') + '{/}') + ' -> {r}' + n + '{/}');
      if (n) hurt.push([w, n]);
      if (flat) w.conds.prone = true;
    });
    B.card(lines, 400);
    hurt.forEach(function (h) { FX.slash(h[0], D.PAL.ramps.blue ? D.PAL.ramps.blue[3] : null); if (!h[0].dead && h[0].hp > 0) B.hurt(h[0], h[1], 'bludgeoning', {}); });
    yield 24;
    if (standing(t) && !u.dead && u.hp > 0 && G.dist(u, t) <= G.reachOf(u)) yield* B.attack(u, t, u.weapon);
    u.anim = 'idle';
    if (B.readyHook) yield* B.readyHook(u); // (he came down within their reach: the readied strikes, as the bulette's leap)
    return true;
  };

  // VNA BUBBLE (Beholda; a bonus action, a special): a bubble round her, 10 ft + 5 ft a level (at most 30); she and every friend inside +1 AC and 1
  // more for every two of her levels (at most +5), till the start of her next turn -- MP's one round. It pops at once when she is stunned,
  // incapacitated or down (MP: "drops immediately if Beholda is stunned"). Griz's bubble art draws it (art/vna-bubble.png, looks below)
  MP.bubble = function* (B, u) {
    spend(u); u.turn.bonus = 0;
    var r = MP.bubbleR(u.lvl), ac = MP.bubbleAC(u.lvl);
    u.conds.vnaBubble = { by: u.id, r: r, ac: ac, till: { who: u.id, at: 'start', n: 1 }, endText: '{who}\'s VNA Bubble lets go.' };
    u.anim = D.spr.anim(u.sheet, 'cast') ? 'cast' : 'attack'; u.animT = B.t; D.sfx('buff');
    var inside = B.units.filter(function (w) { return w.side === u.side && standing(w) && (w === u || G.dist(u, w) <= r); });
    B.card(['{y}' + u.name + '{/}: VNA BUBBLE!  {c}+' + ac + ' AC{/} to ' + inside.map(function (w) { return w === u ? 'herself' : w.name; }).join(', ') + '  {g}(' + r + ' ft, till her next turn; it pops if she is stunned; ' + leftText(u) + '){/}'], 320);
    FX.ring(u, 'violet', 40); FX.sparkle(u, 'violet', 18);
    yield 24;
  };
  MP.bubbleUp = function (b) { var c = b.conds && b.conds.vnaBubble; return !!(c && G.standing(b) && b.hp > 0 && !b.conds.stunned && !b.conds.incapacitated && !b.conds.paralyzed && !b.conds.asleep && !b.conds.unconscious); };
  // the AC a creature has from a bubble it stands in (the best of them); a bubble whose maker cannot keep it is gone
  MP.bubbleOn = function (u) {
    var best = 0;
    (G.units || []).forEach(function (b) {
      if (!b.conds || !b.conds.vnaBubble) return;
      if (!MP.bubbleUp(b)) { delete b.conds.vnaBubble; return; }
      if (b.side !== u.side || (b !== u && G.dist(b, u) > b.conds.vnaBubble.r)) return;
      best = Math.max(best, b.conds.vnaBubble.ac);
    });
    return best;
  };
  var ac0 = RU.ac; RU.ac = function (u) { return ac0.apply(this, arguments) + (u && u.conds && G.units ? MP.bubbleOn(u) : 0); };

  // BALEFUL GAZE (Beholda; an action, a special): one creature she sees within 60 ft saves WIS (her DC: 8 + prof + WIS) -- failed, 1d8 psychic a level
  // and DOMINATED till the end of its next turn (that turn it goes at the nearest of its own side it can reach: MP.dominatedTurn); saved, half and its
  // mind its own. A charm, by what it lays: one that cannot be charmed takes the damage only. MP's gaze inverted to damage against the Algorithm, 10
  // a point; the domination is the show's (Griz, 10-06: "mind domination high hp damage")
  // THE BIG SCREEN (Beholda, 5th; an action, a special): the projection -- her eye opens a 30-ft cone at one she sees, and every foe in it saves as
  // above, (level - 1)d8 psychic: 4d8 at 5th, set against a Fireball's 8d6 twice a day, with the domination on top
  MP.gazeTargets = function (B, u) { return MP.foes(B, u, 60, true); };
  MP.screenTargets = function (B, u) { return MP.foes(B, u, 30, true); };
  MP.screenCatch = function (B, u, t) {
    var sq = M.area(u, MP.SCREEN, t.x, t.y);
    return { sq: sq, foes: B.units.filter(function (w) { return G.hostile(u, w) && standing(w) && G.inArea(w, sq); }) };
  };
  function gazeRow(u) { return D.spr.anim(u.sheet, 'gaze') ? 'gaze' : D.spr.anim(u.sheet, 'cast') ? 'cast' : 'attack'; }
  function* stare(B, u, list, dexpr, head) {
    var r = D.roll(dexpr), dc = u.spellDC, hits = [], doms = [];
    var lines = [head + '  ' + dexpr + ' ' + RU.fmtRolls(r.rolls) + ' = {o}' + r.total + '{/} psychic  WIS DC ' + dc + '  {g}(' + leftText(u) + '){/}'];
    list.forEach(function (w) {
      var proof = RU.immuneTo(w, 'charmed', u), sv = RU.save(w, 'wis', dc, false, proof ? null : 'charmed', r.total), n = sv.ok ? Math.floor(r.total / 2) : r.total;
      lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{o}failed{/}' + (proof ? ' {g}(its mind its own){/}' : ' {p}DOMINATED{/}')) + ' -> {r}' + n + '{/}');
      hits.push([w, n]); if (!sv.ok && !proof) doms.push(w);
    });
    if (!list.length) lines.push('  {g}no one in it.{/}');
    B.card(lines.slice(0, 8), 420);
    yield 20;
    hits.forEach(function (h) { if (!h[0].dead && h[0].hp > 0) B.hurt(h[0], h[1], 'psychic', { magic: true }); });
    doms.forEach(function (w) { if (!w.dead && w.hp > 0) { w.conds.dominated = { by: u.id, name: u.name, till: { who: w.id, at: 'end', n: 1 }, endText: '{who} shakes off the gaze.' }; FX.ring(w, 'violet', 30); } });
    yield 24;
  }
  MP.gaze = function* (B, u, t) {
    spend(u); u.turn.action = 0;
    u.facing = B.faceTo(u, t); u.anim = gazeRow(u); u.animT = B.t; D.sfx('charm');
    FX.beam(u, t, 'psychic', { thin: true }); yield 18;
    yield* stare(B, u, [t].filter(standing), MP.gazeDice(u.lvl), '{y}' + u.name + '{/}: BALEFUL GAZE at ' + nm(B, t));
    u.anim = 'idle';
  };
  MP.screen = function* (B, u, t) {
    var c = MP.screenCatch(B, u, t);
    spend(u); u.turn.action = 0;
    u.facing = B.faceTo(u, t); u.anim = gazeRow(u); u.animT = B.t; D.sfx('charm');
    if (FX.stream) FX.stream(u, c.sq, 'psychic'); else FX.beam(u, t, 'psychic');
    yield 24;
    yield* stare(B, u, c.foes, MP.screenDice(u.lvl), '{y}' + u.name + '{/}: THE BIG SCREEN!  {p}(the projection: a 30-ft cone){/}');
    u.anim = 'idle';
  };

  // DOMINATED, its turn (js/ai.js and js/battle.js take it where Confusion's is taken): it goes at the nearest creature of its own side it can reach this
  // turn -- moving to it if it must -- with its melee blow; with none in reach of its move it stands, fighting what is in its head. The turn is the gaze's
  MP.meleeOf = function (w) {
    if (w.attacks && typeof w.attacks === 'object') {
      var k = Object.keys(w.attacks).filter(function (k) { var a = w.attacks[k]; return a && !a.ranged && !a.needsHeld && !a.spell; })[0];
      if (k) return { atk: w.attacks[k], reach: G.reachOf(w, w.attacks[k].reach) };
    }
    if (w.weapon && !w.weapon.ranged) return { atk: w.weapon, reach: G.reachOf(w, w.weapon.reach) };
    if (w.alt && !w.alt.ranged) return { atk: w.alt, reach: G.reachOf(w, w.alt.reach) };
    return { atk: { name: 'Fists', atk: (w.prof || 2) + mod((w.abil || {}).str), dice: '0', mod: 1 + mod((w.abil || {}).str), type: 'bludgeoning' }, reach: 5 };
  };
  MP.dominatedTurn = function* (B, w) {
    var c = w.conds.dominated, T = w.turn, me = MP.meleeOf(w), best = null;
    if (!c) return false;
    var rm = !w.conds.restrained && !w.conds.grappled && T.move > 0 ? G.reach(w, T.move) : null;
    B.units.forEach(function (x) {
      if (x === w || x.side !== w.side || !standing(x)) return;
      var d = G.dist(w, x);
      if (d <= me.reach) { if (!best || best.e || d < best.d) best = { x: x, d: d, e: null }; return; }
      if (!rm || (best && !best.e)) return;
      var e = AI.approach(w, x, rm, me.reach); if (e && (!best || e.cost < best.d)) best = { x: x, d: e.cost, e: e };
    });
    B.card(['{p}' + Nm(B, w) + '{/} is DOMINATED by ' + (c.name || 'the gaze') + ': ' + (best ? 'it turns on ' + nm(B, best.x) + '!' : 'no friend in its reach -- it stands, fighting what is in its head.')], 260);
    yield 18;
    if (best) {
      if (best.e) yield* AI.walkTo(B, w, best.e);
      if (standing(best.x) && !w.dead && w.hp > 0 && G.dist(w, best.x) <= me.reach) { T.action = 0; yield* B.attack(w, best.x, me.atk); }
    }
    w.anim = 'idle';
    return true;
  };
  // TAUNTED: the one who taunted it, when it is in the pool the AI picks from (else the pool stands: "if it can reach him")
  MP.tauntTarget = function (B, u, pool) {
    var c = u.conds && u.conds.taunted; if (!c) return null;
    var t = (pool || []).filter(function (w) { return w.id === c.by; })[0];
    return t && G.standing(t) ? t : null;
  };
  var edges0 = RU.edges; RU.edges = function (att, tgt) {
    var e = edges0.apply(this, arguments), c = att && att.conds && att.conds.taunted;
    if (c && tgt && tgt.id !== c.by && (G.units || []).some(function (w) { return w.id === c.by && G.standing(w); })) {
      e.dis.push('taunted by ' + c.name);
      e.net = e.adv.length && !e.dis.length ? 1 : e.dis.length && !e.adv.length ? -1 : 0;
    }
    return e;
  };

  // ------------------------------------------------------------------ the AI's hand (js/tactics.js: TX.FIRST before the action, TX.ACTIONS among its plans)
  function reachFor(B, u, t, ft) { // here, or a walk that brings t within ft: { e } (e null: from where it stands), or null
    if (G.dist(u, t) <= ft) return { e: null };
    if (!u.turn.move || u.conds.restrained || u.conds.grappled) return null;
    var e = AI.approach(u, t, G.reach(u, u.turn.move), ft); return e ? { e: e } : null;
  }
  function* go(B, u, r) { if (r && r.e) yield* AI.walkTo(B, u, r.e); }
  function wpAvg(u) { var w = u.weapon || {}; return TX.avg(w.dice || '0') + (w.mod || 0); }
  function swingWorth(u, t) { var p = TX.pHit(u.weapon.atk, RU.ac(t), 0); return { p: p, any: 1 - Math.pow(1 - p, u.attacksBase || 1), dmg: p * wpAvg(u) * (u.attacksBase || 1) }; }
  TX.ACTIONS.push(function (B, u, fs) {
    var T = u.turn;
    if (u.cls !== 'mpmon' || MP.left(u) <= 0 || !T.action || T.attacksLeft || u.conds.incapacitated) return null;
    var plans = [], reach = G.reachOf(u);
    if (u.mpmon === 'denny') {
      fs.forEach(function (t) {
        var r = reachFor(B, u, t, reach); if (!r) return;
        var s = swingWorth(u, t), denim = s.any * TX.avg(MP.denimDice(u.lvl));
        plans.push({ kind: 'special', why: 'DENIM DAMAGE at ' + t.name, score: TX.worth(s.dmg + denim, t) + 0.5, go: function* () { yield* go(B, u, r); if (standing(t) && G.dist(u, t) <= reach && u.turn.action) yield* MP.denim(B, u, t); } });
        // the taunt pays for the friends it spares: each foe near him that may fail, its blows turned from the others
        var dc = MP.tauntDC(u), near = fs.filter(function (w) { return G.dist(t, w) <= 15; }).slice(0, 1 + u.prof), spared = 0;
        near.forEach(function (w) { spared += TX.pFail(w, 'wis', dc) * TX.dpr(w) * 0.6; });
        var hurtFriends = B.units.some(function (a) { return a.side === u.side && a !== u && standing(a) && near.some(function (w) { return G.dist(a, w) <= 10; }); });
        if (near.length >= 2 && hurtFriends) plans.push({ kind: 'special', why: 'TAUNT ' + near.length + ' near ' + t.name, score: TX.worth(s.dmg + s.any * TX.avg(MP.tauntDice(u.lvl)), t) + spared, go: function* () { yield* go(B, u, r); if (standing(t) && G.dist(u, t) <= reach && u.turn.action) yield* MP.taunt(B, u, t); } });
      });
      if (u.lvl >= 5) MP.leapTargets(B, u).forEach(function (t) {
        var q = MP.landings(B, u, t)[0], cat = beside(B, u, q[0], q[1]), d = TX.avg(MP.cannonDice(u.lvl)), dc = MP.tauntDC(u), v = 0;
        cat.forEach(function (w) { var pf = TX.pFail(w, 'dex', dc); v += TX.worth(pf * d + (1 - pf) * d / 2, w) + pf * TX.dpr(w) * 0.3; });
        plans.push({ kind: 'special', why: 'CANNONBALL by ' + t.name + ' (' + cat.length + ')', score: v + TX.worth(TX.pHit(u.weapon.atk, RU.ac(t), 1) * wpAvg(u), t), go: function* () { yield* MP.cannonball(B, u, t); } });
      });
    }
    if (u.mpmon === 'beholda') {
      var dc = u.spellDC;
      MP.gazeTargets(B, u).forEach(function (t) {
        var pf = TX.pFail(t, 'wis', dc), d = TX.avg(MP.gazeDice(u.lvl)), dom = RU.immuneTo(t, 'charmed', u) ? 0 : pf * TX.dpr(t) * 1.5;
        plans.push({ kind: 'special', why: 'BALEFUL GAZE at ' + t.name, score: TX.worth(pf * d + (1 - pf) * d / 2, t) + dom, go: function* () { yield* MP.gaze(B, u, t); } });
      });
      if (u.lvl >= 5) MP.screenTargets(B, u).forEach(function (t) {
        var c = MP.screenCatch(B, u, t), d = TX.avg(MP.screenDice(u.lvl)), v = 0;
        if (c.foes.length < 2) return;
        c.foes.forEach(function (w) { var pf = TX.pFail(w, 'wis', dc); v += TX.worth(pf * d + (1 - pf) * d / 2, w) + (RU.immuneTo(w, 'charmed', u) ? 0 : pf * TX.dpr(w) * 1.5); });
        plans.push({ kind: 'special', why: 'THE BIG SCREEN at ' + t.name + ' (' + c.foes.length + ')', score: v, go: function* () { yield* MP.screen(B, u, t); } });
      });
    }
    return plans;
  });
  // the bubble first, for the bonus action: friends inside it and a foe on them -- kept back while it is her last and a gaze has a mark
  TX.FIRST.push(function* (B, u) {
    var T = u.turn;
    if (u.cls !== 'mpmon' || u.mpmon !== 'beholda' || !T.bonus || MP.left(u) <= 0 || u.conds.vnaBubble || u.conds.incapacitated) return;
    var r = MP.bubbleR(u.lvl), inside = B.units.filter(function (w) { return w.side === u.side && standing(w) && (w === u || G.dist(u, w) <= r); });
    var pressed = inside.some(function (w) { return B.units.some(function (f) { return G.hostile(u, f) && standing(f) && G.dist(w, f) <= 30; }); });
    if (inside.length < 2 || !pressed || (MP.left(u) === 1 && MP.gazeTargets(B, u).length)) return;
    yield* MP.bubble(B, u);
  });

  // ------------------------------------------------------------------ the player's buttons (the ring's SKILLS: js/features.js F.commands / F.exec, wrapped as familiar.js does)
  function* pick(B, u, title, list, line) {
    if (!list.length) return null;
    var opts = list.map(function (w, i) { return { label: Nm(B, w).toUpperCase() + ' (' + G.dist(u, w) + ' FT)', value: i + 1 }; });
    opts.push({ label: 'NOT NOW', value: 0 });
    var v = yield { prompt: { who: u, title: u.name + ': ' + title, lines: [line], opts: opts, pick: list } };
    return v ? list[v - 1] : null;
  }
  var cmd0 = F.commands, exec0 = F.exec;
  F.commands = function (B, u) {
    var out = cmd0(B, u);
    if (u.cls !== 'mpmon' || u.side !== 'party' || u.guest) return out;
    var T = u.turn, act = T.action > 0 && !T.attacksLeft, n = MP.left(u), none = 'no specials left (a short rest brings them back)';
    var whyA = function (list, nobody) { return n <= 0 ? none : !act ? 'the action is spent' : !list.length ? nobody : ''; };
    if (u.mpmon === 'denny') {
      var rch = MP.inReach(B, u);
      out.push({ id: 'mp-taunt', label: 'TAUNT', cost: 'A', icon: 'surge', skill: true, ok: !whyA(rch, 'x'), why: whyA(rch, 'no foe in reach'),
        note: 'your swings (+' + MP.tauntDice(u.lvl) + ' on the first that lands); then it and up to ' + u.prof + ' more within 15 ft: WIS DC ' + MP.tauntDC(u) + ' or they may go only at you; ' + leftText(u) });
      out.push({ id: 'mp-denim', label: 'DENIM DAMAGE', cost: 'A', icon: 'attack', skill: true, ok: !whyA(rch, 'x'), why: whyA(rch, 'no foe in reach'),
        note: 'your swings, +' + MP.denimDice(u.lvl) + ' on the first that lands (doubled on a critical); ' + leftText(u) });
      if (u.lvl >= 5) { var lt = MP.leapTargets(B, u); out.push({ id: 'mp-cannonball', label: 'CANNONBALL', cost: 'A', icon: 'dash', skill: true, ok: !whyA(lt, 'x'), why: whyA(lt, 'no foe within a 20-ft leap'),
        note: 'leap up to 20 ft beside a foe: each foe beside you DEX DC ' + MP.tauntDC(u) + ' or ' + MP.cannonDice(u.lvl) + ' and prone (half on a save), then a swing; ' + leftText(u) }); }
    }
    if (u.mpmon === 'beholda') {
      out.push({ id: 'mp-bubble', label: 'VNA BUBBLE', cost: 'B', icon: 'sacred', skill: true, ok: T.bonus > 0 && n > 0 && !u.conds.vnaBubble,
        why: n <= 0 ? none : u.conds.vnaBubble ? 'the bubble is up' : 'the bonus action is spent', note: '+' + MP.bubbleAC(u.lvl) + ' AC to you and friends within ' + MP.bubbleR(u.lvl) + ' ft till your next turn (pops if you are stunned); ' + leftText(u) });
      var gz = MP.gazeTargets(B, u);
      out.push({ id: 'mp-gaze', label: 'BALEFUL GAZE', cost: 'A', icon: 'sacred', skill: true, ok: !whyA(gz, 'x'), why: whyA(gz, 'no foe you see within 60 ft'),
        note: 'one within 60 ft: WIS DC ' + u.spellDC + ' or ' + MP.gazeDice(u.lvl) + ' psychic and DOMINATED (it turns on its own side next turn); half on a save; ' + leftText(u) });
      if (u.lvl >= 5) { var sc = MP.screenTargets(B, u); out.push({ id: 'mp-screen', label: 'THE BIG SCREEN', cost: 'A', icon: 'sacred', skill: true, ok: !whyA(sc, 'x'), why: whyA(sc, 'no foe you see within 30 ft'),
        note: 'a 30-ft cone at one you pick: each foe in it WIS DC ' + u.spellDC + ' or ' + MP.screenDice(u.lvl) + ' psychic and DOMINATED; half on a save; ' + leftText(u) }); }
    }
    return out;
  };
  F.exec = function* (B, u, c) {
    if (!/^mp-/.test(c.do || '')) { yield* exec0(B, u, c); return; }
    var t;
    switch (c.do) {
      case 'mp-taunt': t = yield* pick(B, u, 'TAUNT', MP.inReach(B, u), 'Who takes your first swing? Then the foes within 15 ft save, WIS DC ' + MP.tauntDC(u) + '.'); if (t) yield* MP.taunt(B, u, t); return;
      case 'mp-denim': t = yield* pick(B, u, 'DENIM DAMAGE', MP.inReach(B, u), 'Who takes it? +' + MP.denimDice(u.lvl) + ' on the first swing that lands.'); if (t) yield* MP.denim(B, u, t); return;
      case 'mp-cannonball': t = yield* pick(B, u, 'CANNONBALL', MP.leapTargets(B, u), 'Which foe do you come down beside? (a leap of up to 20 ft)'); if (t) yield* MP.cannonball(B, u, t); return;
      case 'mp-bubble': yield* MP.bubble(B, u); return;
      case 'mp-gaze': t = yield* pick(B, u, 'BALEFUL GAZE', MP.gazeTargets(B, u), 'Which one meets your eye? (WIS DC ' + u.spellDC + ')'); if (t) yield* MP.gaze(B, u, t); return;
      case 'mp-screen': t = yield* pick(B, u, 'THE BIG SCREEN', MP.screenTargets(B, u), 'Aim the projection at which one? Every foe in the 30-ft cone toward it saves.'); if (t) yield* MP.screen(B, u, t); return;
    }
  };
  var line0 = F.classLine; F.classLine = function (u) {
    var s = line0.apply(this, arguments);
    if (u.cls !== 'mpmon') return s;
    var k = MP.BUILDS[u.mpmon] ? MP.KINDS[MP.BUILDS[u.mpmon].kind].name : '';
    return [k + ' · ' + MP.left(u) + ' specials', s].filter(Boolean).join(', ');
  };

  // ------------------------------------------------------------------ no hands (Beholda): a potion held to her, nothing she must hold herself
  var items0 = D.Battle.prototype.itemList;
  D.Battle.prototype.itemList = function (u) {
    var l = items0.apply(this, arguments);
    if (!u || !u.noHands) return l;
    return l.map(function (it) { return !it || /potion|antitoxin/.test(it.id) ? it : Object.assign({}, it, { ok: false, why: 'no hands: she can only drink what is held to her' }); });
  };

  // ------------------------------------------------------------------ the looks (js/looks.js): the bubble's reach on the floor and its film round her;
  // a violet spiral over the dominated, a red flag over the taunted
  var LK = D.looks, bubImg = null;
  function bubbleArt() { if (!bubImg && typeof Image !== 'undefined') { bubImg = new Image(); bubImg.src = 'art/vna-bubble.png'; } return bubImg && bubImg.complete && bubImg.naturalWidth ? bubImg : null; }
  if (LK && LK.ground) {
    var ground0 = LK.ground; LK.ground = function (ctx, B) {
      ground0.apply(this, arguments);
      (B.units || []).forEach(function (b) {
        if (!MP.bubbleUp(b) || !D.ui || !D.ui.unitPos) return;
        var q = D.ui.unitPos(B, b), rr = (b.conds.vnaBubble.r / 5 + 0.5) * Math.SQRT2, t = B.t || 0;
        ctx.save(); ctx.beginPath(); ctx.ellipse(q.x, q.y, rr * D.iso.TW / 2, rr * D.iso.TH / 2, 0, 0, 7);
        ctx.globalAlpha = 0.07; ctx.fillStyle = '#c58bff'; ctx.fill();
        ctx.globalAlpha = 0.45 + 0.15 * Math.sin(t / 15); ctx.strokeStyle = '#ffb3f0'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.lineDashOffset = -t / 5; ctx.stroke();
        ctx.restore();
      });
    };
  }
  if (LK && LK.over) {
    var over0 = LK.over; LK.over = function (ctx, B, u, p) {
      over0.apply(this, arguments);
      if (!u || u.hp <= 0 || u.dead) return;
      var c = u.conds || {}, t = B.t || 0, top = D.spr.unitTop(u), hx = p.x, hy = p.y - top - 6;
      if (MP.bubbleUp(u)) {
        var img = bubbleArt(), r = Math.max(18, top * 0.62), cy = p.y - top * 0.5, w = 1 + 0.03 * Math.sin(t / 7);
        ctx.save(); ctx.imageSmoothingEnabled = true;
        if (img) { ctx.globalAlpha = 0.55; ctx.drawImage(img, hx - r * w, cy - r / w, 2 * r * w, 2 * r / w); }
        else { ctx.globalAlpha = 0.5; ctx.strokeStyle = '#ffd1f5'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(hx, cy, r * w, r / w, 0, 0, 7); ctx.stroke(); }
        ctx.restore();
      }
      if (c.dominated) { // a turning spiral over the head, violet and white, the gaze still in it
        ctx.save();
        for (var k = 0; k < 22; k++) {
          var a = -t / 6 + k * 0.62, rr2 = 0.6 + k * 0.32, sx = Math.round(hx + Math.cos(a) * rr2 * 1.3), sy = Math.round(hy - 4 + Math.sin(a) * rr2 * 0.8), big = k > 12 ? 2 : 1;
          ctx.fillStyle = '#1a0526'; ctx.fillRect(sx - 1, sy - 1, big + 2, big + 2);
          ctx.fillStyle = k % 3 ? '#c77dff' : '#ffffff'; ctx.fillRect(sx, sy, big, big);
        }
        ctx.restore();
      }
      if (c.taunted) { // a red "!" beside the head: it has eyes for him alone
        var tx = Math.round(hx + 8), ty = Math.round(hy - 9) + (Math.floor(t / 12) % 2);
        ctx.save(); ctx.fillStyle = '#1a0507'; ctx.fillRect(tx - 1, ty - 1, 4, 8); ctx.fillRect(tx - 1, ty + 7, 4, 4);
        ctx.fillStyle = '#ff4d4d'; ctx.fillRect(tx, ty, 2, 6); ctx.fillRect(tx, ty + 8, 2, 2); ctx.restore();
      }
    };
  }

  // ------------------------------------------------------------------ the Pocket DM (js/pocket.js): two seats on the roster, the specials back on its short rest
  var PK = D.pocket;
  if (PK && PK.STOCK) {
    var at = PK.STOCK.map(function (s) { return s.w; }).indexOf('pyro');
    PK.STOCK.splice(at < 0 ? PK.STOCK.length : at, 0, { w: 'denny', lo: 1 }, { w: 'beholda', lo: 1 });
  }
  if (PK && PK.shortRest) {
    var rest0 = PK.shortRest; PK.shortRest = function (c) {
      var r = rest0.apply(this, arguments);
      if (c && c.cls === 'mpmon') { var f = c.feats = c.feats || {}; if (!(f.specials >= MP.SPECIALS)) r.text += '; the specials back'; f.specials = MP.SPECIALS; }
      return r;
    };
  }
})();
