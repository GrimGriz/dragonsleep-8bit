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
   THE SPECIALS: a pool a fight, shared, back on a short rest -- 1 at 1st, one more every two levels: 2 at 3rd, 3 at 5th, 4 at 7th, 5 at 9th
   (MP's "2 specials per encounter" grown with the level, RULED 10-06, Griz: "3 at level 5, 4 at 7, 5 at 9 down to 1 move at lvl 1").
     RASCAL, a Lobstamonkee (10-06 late): his blow a FIRE BOLT on CHA (a PINCH when something is on him); SOCIAL SHARING (a Social die to his friends),
       SOCIAL FLAME (a ball of fire); at 5, SOCIAL DISTANCING (a cone: psychic and frightened).
     GOOSE, a Lobstamonkee (10-07, the fourth): the Heals, on WIS; his blow a SLING; HEART TO HEART (a heal, a bonus action) and GROUP HUG (a heal round
       him); at 5, FOUNTAIN. His specials are green energy (Griz, 10-07: "his specials should mainly be green energy").

   THE MASCOT (10-06 night, the race-and-class seat; the MPMon lane §6, every ruling verbatim there): the class is named Mascot ("Good class name!"), its four
   subclasses the roles -- TANK (Denny), BUFFS (Beholda), DPS (Rascal), HEALS (Goose, drafted) ("Tank, DPS, Buffs & Heals"); the kinds are races: the
   Lobstamonkee a humanoid, the EyeGregore fey ("Fey"), and she floats, she does not fly ("is hover-float not fly": a 5-ft ceiling when flight at a height
   lands, the grid's rules lane §2.17). The levels (his "1 - that's good, yes"): 1 the two core specials, the setup one a bonus action ("solid"); 2 a free
   bonus move; 3 a passive; 4 an ability score; 5 the third special; 6 a reaction; 7 the fourth special ("a fourth special at some point (7)"); 8 an ability
   score; 9 THE HIVEMIND. Every special grows a step a level after it comes, its power on the even levels and its reach on the odd (his, for Social
   Distancing: "DamageDie or static + at 6, radius at 7, repeat"). On the Pocket DM's roster they are locked -- easter eggs to come -- and `&mascots` opens
   them for testing ("All locked for now with a flag we can switch"). The specials aim as spells do, no popups ("the abilities weren't using the normal
   targeting - it had the menu popups again"): `aim` on the ring's buttons, js/ui.js aimCommand. */
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
  R.CLASSES.mpmon = { name: 'Mascot', hd: 10, saves: ['con', 'wis'], armor: [], weapons: ['natural'], primary: 'str', cast: 'wis', asi: {} };
  // THE SPECIALS by level (RULED 10-06, Griz: "3 at level 5, 4 at 7, 5 at 9 down to 1 move at lvl 1"): one more every two levels
  MP.specialsAt = function (L) { return Math.max(1, Math.floor(((L || 1) + 1) / 2)); };
  // THE RACES: the body only, what every one of the kind has whatever its role (the shape of js/classes.js NPC.RACES, kept out of the Pocket DM's maker -- his
  // "we'll let them unlock the 3 as they are. Open to return after the game 'ships'"). `abil` is the race's increase, for the day one is made in the maker; the
  // named three keep their own scores. The EyeGregore floats (`floats`: the grid's flier today, u.flies; one layer, 5 ft, at most when height lands)
  MP.RACES = {
    lobstamonkee: { name: 'Lobstamonkee', speed: 30, climbs: true, type: 'humanoid', skill: 'Athletics', abil: { dex: 2, con: 1 } }, // (Griz's spelling, 10-06; MP's docs write lobstamonkey. "the monkee part probably makes them qualify as humanoid")
    eyegregore: { name: 'EyeGregore', speed: 25, floats: true, dv: 120, noHands: true, type: 'fey', skill: 'Perception', abil: { wis: 2, int: 1 } } // (his name for her kind, 10-06: the book's beholder is not in the SRD; fey, 10-06 night: "EyeGregores are completely distinct from beholders")
  };
  MP.KINDS = MP.RACES; // (the first pass's name for them)
  // THE SUBCLASSES: the role, its key ability and its saves (MP's four save stats: Survival, Wisdom, Social, Heart). Heals is LOVE, "which we'll say is wise"
  MP.SUBS = {
    tank: { name: 'Tank', key: 'str', saves: ['str', 'con'] },
    buffs: { name: 'Buffs', key: 'wis', saves: ['wis', 'cha'] },
    dps: { name: 'DPS', key: 'cha', saves: ['cha', 'wis'] },
    heals: { name: 'Heals', key: 'wis', saves: ['wis', 'int'] } // (Goose's, 10-07)
  };
  MP.BUILDS = {
    denny: { name: 'Denny', kind: 'lobstamonkee', sub: 'tank', hd: 10, abil: { str: 16, dex: 14, con: 16, int: 8, wis: 10, cha: 12 }, asi: { 4: 'str', 8: 'str' },
      weapon: 'monkeyfists', armor: 'denimjacket', look: 'denny_p3', extraAttack: 5 }, // (his third sheet, 10-07: tools/denny-p3.py)
    beholda: { name: 'Beholda', kind: 'eyegregore', sub: 'buffs', hd: 8, abil: { str: 10, dex: 14, con: 14, int: 12, wis: 16, cha: 13 }, asi: { 4: 'wis', 8: 'wis' },
      weapon: 'diceslam', armor: 'eyehide', look: 'beholda_p3' }, // (her second sheet, 10-07: tools/beholda-p3.py)
    // RASCAL (10-06, the Rascal seat; Griz: "please invent a third special for rascal", "He'll range attack with a cantrip like Aurdin"): MP's Social PC,
    // so CHA is his stat (cast: his DC and Fire Bolt's attack by it; MP.unit lays it on the unit); MP gives him 70 HP against Denny's 120: a d8 and CON 10
    rascal: { name: 'Rascal', kind: 'lobstamonkee', sub: 'dps', hd: 8, abil: { str: 10, dex: 14, con: 10, int: 10, wis: 12, cha: 16 }, asi: { 4: 'cha', 8: 'cha' },
      weapon: 'pinch', armor: 'lobstershell', look: 'rascal_p2', cast: 'cha', cantrip: 'firebolt' },   // (his look p2 since 10-07: his second round of sheets, tools/rascal-sheet-p2.py; Fire Bolt plays its own cast row)
    // GOOSE (10-07; his sheet goose_p1, tools/goose-sheet.py): MP's Heals, LOVE his stat ("the key ability is LOVE... which we'll say is wise. Wisdom it is"), so
    // his DC and his blow are by WIS; MP gives him 65 HP to Rascal's 70: a d8 and CON 10, as Rascal's. His blow the sling ("yes, historically a sling")
    goose: { name: 'Goose', kind: 'lobstamonkee', sub: 'heals', hd: 8, abil: { str: 8, dex: 14, con: 10, int: 10, wis: 16, cha: 12 }, asi: { 4: 'wis', 8: 'wis' },
      weapon: 'goosesling', armor: 'goosefur', look: 'goose_p1', cast: 'wis' }
  };
  Object.keys(MP.BUILDS).forEach(function (k) { var b = MP.BUILDS[k]; b.saves = MP.SUBS[b.sub].saves.slice(); }); // (the role's saves: Denny STR/CON, Beholda WIS/CHA, Rascal CHA/WIS, as they were)
  // the natural weapons and hides: items so every rule that reads a weapon or an armour reads them, kept off the maker's racks (noSell)
  var IT = DS.DATA.items, SRC = 'they live/beholda/deep16-translation.md; invented.json#mpmon';
  IT.monkeyfists = { name: 'Monkey Fists', kind: 'weapon', price: 0, noSell: true, weapon: { dmg: '1d6', versatile: '1d8', type: 'bludgeoning', group: 'natural', kind: 'monkeyfists', props: ['versatile'] }, desc: 'Bare fists: 1d6 + STR, 1d8 with both hands free.', src: SRC };
  IT.diceslam = { name: 'Dice Slam', kind: 'weapon', price: 0, noSell: true, weapon: { dmg: '1d8', type: 'bludgeoning', group: 'natural', kind: 'diceslam', props: [], abil: 'wis' }, desc: 'Her three dice swung on their chains, on her will: 1d8 + WIS.', src: SRC };
  IT.denimjacket = { name: 'Denim Jacket', kind: 'armor', price: 0, noSell: true, armor: { base: 12, type: 'light' }, desc: 'Studded denim: AC 12 + DEX.', src: SRC };
  IT.eyehide = { name: 'EyeGregore Hide', kind: 'armor', price: 0, noSell: true, armor: { base: 12, type: 'natural' }, desc: 'Her fuzz is tougher than it looks: AC 12 + DEX.', src: SRC };
  IT.pinch = { name: 'Pinch', kind: 'weapon', price: 0, noSell: true, weapon: { dmg: '1d6', type: 'slashing', group: 'natural', kind: 'pinch', props: [] }, desc: 'The giant claw, when something is on him: 1d6 + STR.', src: SRC };
  IT.lobstershell = { name: 'Lobster Shell', kind: 'armor', price: 0, noSell: true, armor: { base: 12, type: 'natural' }, desc: 'The claw arm\'s shell and quick feet: AC 12 + DEX.', src: SRC };
  IT.goosesling = { name: 'Sling', kind: 'weapon', price: 0, noSell: true, weapon: { dmg: '1d4', type: 'bludgeoning', group: 'natural', kind: 'goosesling', props: ['ranged'], range: [30, 120], abil: 'wis' }, desc: 'His old sling, a stone off the floor, slung on his heart: 1d4 + WIS, 30/120 ft (the SRD\'s sling).', src: SRC };
  IT.goosefur = { name: 'Shaggy Fur', kind: 'armor', price: 0, noSell: true, armor: { base: 12, type: 'natural' }, desc: 'Charcoal fur and a hop that never stops: AC 12 + DEX.', src: SRC };
  // a weapon swung by an ability of its own (Dice Slam's WIS): the one line the shared rules need
  var wa0 = R.weaponAbil; R.weaponAbil = function (h, w) { return (w && w.weapon && w.weapon.abil) || wa0(h, w); };
  // by name, at any level (as Higertha stands): ?npc=denny:5, the Pocket DM's seats
  NPC.NAMED.denny = { name: 'Denny', cls: 'mpmon', build: 'denny', named: true, look: 'denny_p3' };
  NPC.NAMED.beholda = { name: 'Beholda', cls: 'mpmon', build: 'beholda', named: true, look: 'beholda_p3' };
  NPC.NAMED.rascal = { name: 'Rascal', cls: 'mpmon', build: 'rascal', named: true, look: 'rascal_p2' };
  NPC.NAMED.goose = { name: 'Goose', cls: 'mpmon', build: 'goose', named: true, look: 'goose_p1' };

  // the sheet: the build's numbers at the level (the SRD's average hit points; an ASI at 4 and 8), the natural kit, the specials
  MP.sheet = function (spec) {
    var b = MP.BUILDS[spec.build] || MP.BUILDS.denny, lvl = Math.max(1, Math.min(9, spec.lvl || 1)), abil = JSON.parse(JSON.stringify(b.abil));
    Object.keys(b.asi).forEach(function (at) { if (lvl >= +at) abil[b.asi[at]] = Math.min(20, abil[b.asi[at]] + 2); });
    var con = mod(abil.con), hp = b.hd + con + (lvl - 1) * (b.hd / 2 + 1 + con);
    var h = {
      id: spec.id || spec.build, name: spec.name || b.name, cls: 'mpmon', build: spec.build, lvl: lvl, xp: R.XP_LEVEL[lvl], base: JSON.parse(JSON.stringify(abil)), abil: abil,
      maxhp: hp, hp: hp, equip: { weapon: b.weapon, armor: b.armor, shield: null, ring: null, cloak: null }, known: b.cantrip ? [b.cantrip] : [], feats: {}, conds: {},
      subclass: MP.SUBS[b.sub].name, mpSub: b.sub, saveProf: b.saves.slice(), style: null, skills: {}, expertise: [], race: b.kind, npc: true, named: true, alt: null, slots: [], slotsMax: [],
      attacks: b.extraAttack && lvl >= b.extraAttack ? 2 : 1
    };
    MP.refill(h); // (the specials, and the fight's uses of the passives and the reactions)
    var rs = MP.RACES[b.kind].skill; if (rs) h.skills[rs] = mod(abil[rs === 'Perception' ? 'wis' : 'str']) + 2; // (the race's: an eye proficient in Perception, a lobstamonkee in Athletics)
    if (spec.loot) NPC.wear(h, spec.loot);
    NPC.carry(h, spec);
    return h;
  };
  var sheet0 = NPC.sheet; NPC.sheet = function (spec) { return spec && spec.cls === 'mpmon' ? MP.sheet(spec) : sheet0.apply(this, arguments); };
  var unit0 = NPC.unit; NPC.unit = function (h, side, o) {
    var u = unit0.apply(this, arguments);
    if (h.cls !== 'mpmon') return u;
    var b = MP.BUILDS[h.build], k = MP.RACES[b.kind];
    u.kind = 'npcmpmon'; u.mpmon = h.build; u.mpSub = b.sub; u.race = b.kind; u.type = k.type; u.speed = k.speed;
    u.sheet = (o && o.sheet) || b.look;
    if (k.floats) { u.flies = true; u.floats = true; } // (the grid's flier, js/grid.js stepCost; `floats`: no higher than 5 ft, for flight at a height)
    if (k.climbs) u.climbs = true;
    if (k.noHands) u.noHands = true;
    u.darkvision = Math.max(u.darkvision || 0, k.dv || 0);
    if (MP.has(u, 'tank', 6)) u.bodyguard = true; // (Bodyguard: battle.js's Protection, without the shield)
    if (MP.has(u, 'dps', 2)) u.cunning = true; // (Scuttle: battle.js's cdash and hide take the bonus action)
    if (b.cast) { u.castAb = b.cast; u.spellDC = 8 + u.prof + mod(u.abil[b.cast]); u.spellAtk = u.prof + mod(u.abil[b.cast]); } // (Rascal's CHA: js/magic.js M.mod reads castAb before the class's cast)
    return u;
  };
  MP.left = function (u) { return (u.feats && u.feats.specials) || 0; };
  function spend(u) { u.feats.specials = Math.max(0, MP.left(u) - 1); if (MP.hiveSpend) MP.hiveSpend(u); }
  function leftText(u) { var n = MP.left(u); return n + ' special' + (n === 1 ? '' : 's') + ' left'; }

  // ------------------------------------------------------------------ THE GROWTH: the numbers by level
  // Every special grows a step a level after it comes -- its power on the even levels, its reach on the odd (RULED 10-06 night, Griz, for Social Distancing:
  // "DamageDie or static + at 6, radius at 7, repeat"; the rest by the seat's plan, "I trust your plan, you can start building"). Sized so 5 and 9 land at or
  // under the first pass's numbers (his: "Specials seem pretty powerful to me, but that may have been lack of other stuff balance by the instance that wrote
  // them") -- the first pass's Gaze was 9d8 and a domination at 9. pw/rc: the power and reach steps a special that came at `from` has taken by level L
  function pw(L, from) { var n = 0; for (var l = (from || 1) + 1; l <= (L || 1); l++) if (l % 2 === 0) n++; return n; }
  function rc(L, from) { var n = 0; for (var l = (from || 1) + 1; l <= (L || 1); l++) if (l % 2 === 1) n++; return n; }
  MP.pw = pw; MP.rc = rc;
  MP.tauntDC = function (u) { return 8 + u.prof + mod(u.abil.str); };
  // Denny, the Tank. TAUNT (1): foes 2, +1 a power step; 10 ft, +5 a reach step (5th: 4 within 20 ft; 9th: 6 within 30). DENIM DAMAGE (1): +1d6 on the first blow
  // that lands, +1d6 a power step (5th 3d6, 9th 5d6: the first pass's 2d8 and 4d8), and its reach is the knock -- the one it lands on is shoved 5 ft back a reach
  // step (3rd 5 ft ... 9th 20). CANNONBALL (5): 2d8, +2 a power step (9th 2d8+4: the first pass's 3d8); the leap 20 ft, +5 a reach step. LOBSTAH HUG (7): the
  // squeeze 1d8 + STR, 2d8 at 8th; Large and smaller, Huge at 9th
  MP.tauntN = function (L) { return 2 + pw(L, 1); };
  MP.tauntR = function (L) { return 10 + 5 * rc(L, 1); };
  MP.denimDice = function (L) { return (1 + pw(L, 1)) + 'd6'; };
  MP.denimPush = function (L) { return 5 * rc(L, 1); };
  MP.cannonDice = function (L) { var p = pw(L, 5); return '2d8' + (p ? '+' + 2 * p : ''); };
  MP.leap = function (L) { return 20 + 5 * rc(L, 5); };
  MP.hugDice = function (L) { return (1 + pw(L, 7)) + 'd8'; };
  MP.hugSize = function (L) { return rc(L, 7) ? 3 : 2; };
  // Beholda, Buffs. THE VNA BUBBLE (1): +1 AC, +1 a power step (to +5 at 8th: the first pass's); 10 ft, +5 a reach step (5th 20 ft, 9th 30). BALEFUL GAZE (1): 1d8,
  // +1d8 a power step (5th 3d8, 9th 5d8); 30 ft, +15 a reach step (5th 60, 9th 90). THE BIG SCREEN (5): 4d8, +1d8 a power step; the cone 30 ft, +5 a reach step
  // (9th 6d8 in 40 ft: the first pass's 8d8 in 30). SPOTLIGHT (7): one friend Hasted, two at 8th; 30 ft, 60 at 9th
  MP.bubbleAC = function (L) { return Math.min(5, 1 + pw(L, 1)); };
  MP.bubbleR = function (L) { return 10 + 5 * rc(L, 1); };
  MP.gazeDice = function (L) { return (1 + pw(L, 1)) + 'd8'; };
  MP.gazeRange = function (L) { return 30 + 15 * rc(L, 1); };
  MP.screenDice = function (L) { return (4 + pw(L, 5)) + 'd8'; };
  MP.screenLen = function (L) { return 30 + 5 * rc(L, 5); };
  MP.screenGeo = function (L) { return { shape: 'cone', len: MP.screenLen(L) }; };
  MP.spotN = function (L) { return 1 + pw(L, 7); };
  MP.spotR = function (L) { return 30 + 30 * rc(L, 7); };
  // Rascal, the DPS. SOCIAL SHARING (1): a d4, a size up a power step (5th d8, 9th d12); 1 friend, +1 a reach step (5th 3, 9th 5). SOCIAL FLAME (1): 2d6, +1d6 a power
  // step (5th 4d6, 9th 6d6); 5 ft round, +5 a reach step (5th 15, 9th 25). SOCIAL DISTANCING (5): the 8 squares round him ("clears the 8 square donut around him when
  // he first gets it instead of a front-wave"), 2d8, +1d8 a power step; a ring more a reach step (7th 10 ft, 9th 15). GOING VIRAL (7): 3d8, 4d8 at 8th; three foes, four at 9th
  MP.shareDie = function (L) { return ['d4', 'd6', 'd8', 'd10', 'd12'][Math.min(4, pw(L, 1))]; };
  MP.shareN = function (L) { return 1 + rc(L, 1); };
  MP.flameDice = function (L) { return (2 + pw(L, 1)) + 'd6'; };
  MP.flameR = function (L) { return 5 + 5 * rc(L, 1); };
  MP.flameGeo = function (L) { return { shape: 'sphere', range: 60, r: MP.flameR(L) }; };
  MP.distDice = function (L) { return (2 + pw(L, 5)) + 'd8'; };
  MP.distR = function (L) { return 5 + 5 * rc(L, 5); };
  MP.viralDice = function (L) { return (3 + pw(L, 7)) + 'd8'; };
  MP.viralN = function (L) { return 3 + rc(L, 7); };
  // Goose, the Heals (10-07; MP: "Single-target heal: Base +5, +5/level, +10 per action-die success", "Group heal: Base +0, +5/level, +5 per action-die success"). HEART
  // TO HEART (1): 1d6 + WIS, +1d6 a power step (5th 3d6, 9th 5d6: Healing Word's 1d4 + WIS at 1st, by the d6); 30 ft, +15 a reach step (5th 60, 9th 90). GROUP HUG (1):
  // 1d4 + WIS each, +1d4 a power step (5th 3d4, 9th 5d4); 15 ft round him, +5 a reach step (5th 25, 9th 35). BIG HEART (3) adds his level to each heal. FOUNTAIN (5):
  // an ailment ended and 1d8 each, +1d8 a power step (8th 3d8); 30 ft, +10 a reach step (9th 50). LIFELINE (7): tied from 30 ft, 60 at 9th (holding to twice that);
  // at 8th the one tied +1 AC and +1 on its saves too (Warding Bond's other half). Sized by MP's numbers at 0.27 and set beside the SRD's heals (a Life cleric's)
  MP.heartDice = function (L) { return (1 + pw(L, 1)) + 'd6'; };
  MP.heartR = function (L) { return 30 + 15 * rc(L, 1); };
  MP.groupDice = function (L) { return (1 + pw(L, 1)) + 'd4'; };
  MP.groupR = function (L) { return 15 + 5 * rc(L, 1); };
  MP.fountDice = function (L) { return (1 + pw(L, 5)) + 'd8'; };
  MP.fountR = function (L) { return 30 + 10 * rc(L, 5); };
  MP.lifeR = function (L) { return 30 + 30 * rc(L, 7); };
  MP.lifeWard = function (L) { return pw(L, 7); };
  MP.bigHeart = function (u) { return MP.has(u, 'heals', 3) ? (u.lvl || 1) : 0; };

  // who is where: foes in reach, foes it sees within a range
  MP.foes = function (B, u, ft, see) { return B.units.filter(function (w) { return G.hostile(u, w) && standing(w) && G.dist(u, w) <= ft && (!see || M.sees(B, u, w)); }); };
  MP.inReach = function (B, u) { return MP.foes(B, u, G.reachOf(u)); };

  // ------------------------------------------------------------------ the blows: the Attack's swings (two from Denny's 5th), a rider on the first that lands
  // (the one the first landing blow found: Denim Damage's knock goes to it)
  function* blows(B, u, t, name, extra) {
    var T = u.turn, n = u.attacksBase || 1, landed = null;
    T.action = 0; T.attackAction = true;
    for (var i = 0; i < n && !u.dead && u.hp > 0; i++) {
      var tgt = standing(t) && G.dist(u, t) <= G.reachOf(u) ? t : MP.inReach(B, u).sort(function (a, b) { return a.hp - b.hp; })[0];
      if (!tgt) break;
      var atk = landed ? u.weapon : Object.assign({}, u.weapon, { name: name, extra: extra, extraType: 'bludgeoning' });
      var hp0 = tgt.hp, dead0 = !!tgt.dead;
      yield* B.attack(u, tgt, atk);
      if (!landed && (tgt.hp < hp0 || (!!tgt.dead && !dead0))) landed = tgt;
      if (u.conds.hidden) delete u.conds.hidden;
    }
    return landed;
  }
  function rowOr(u, row, alt) { return D.spr.anim(u.sheet, row) ? row : D.spr.anim(u.sheet, alt) ? alt : 'attack'; }
  function rowWait(u, n) { return Math.max(n, D.spr.duration(u.sheet, u.anim) || 0); } // (a row of its own plays out before the idle: the hug's eight frames and the spotlight's six, 10-07)
  // a shove, ft straight away from him (js/magic.js M.push: in squares, the eight ways, stopped by the first square it cannot stand in); the readied strikes after
  MP.shove = function* (B, u, w, ft, text) {
    var x0 = w.x, y0 = w.y;
    if (M.push) M.push(B, u, w, Math.max(1, Math.round(ft / 5)));
    var moved = Math.max(Math.abs(w.x - x0), Math.abs(w.y - y0)) * 5;
    if (text && moved) B.card(['{o}' + text + ' ' + moved + ' ft.{/}'], 160);
    yield 10;
    if (B.readyForced) yield* B.readyForced();
  };

  // TAUNT (Denny; a BONUS action, a special -- 10-06 night, Griz: "solid", the setup special to the bonus action): no swing of its own, so his action is
  // still his. The nearest foes that can hear him, MP.tauntN of them within MP.tauntR ft (2 within 10 at 1st; 4 within 20 at 5th; 6 within 30 at 9th), save WIS
  // (8 + prof + STR) or are TAUNTED till the end of their next turn: they may go only at him if they can reach him (the AI's targeting: MP.tauntTarget), and have
  // disadvantage on attacks at anyone else (RU.edges, below). MP: "Taunts target; one additional target taunted per action-die success"
  MP.tauntList = function (B, u) { return MP.foes(B, u, MP.tauntR(u.lvl)).filter(function (w) { return !w.conds.deafened; }).sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); }).slice(0, MP.tauntN(u.lvl)); };
  MP.taunt = function* (B, u) {
    spend(u); u.turn.bonus = 0;
    u.anim = rowOr(u, 'taunt', 'attack'); u.animT = B.t;
    B.card(['{y}' + u.name + '{/}: TAUNT!  {g}(he waggles his fingers by his ears: come on, then){/}'], 200); D.sfx('crit');
    yield 18;
    var dc = MP.tauntDC(u), list = MP.tauntList(B, u);
    var lines = ['{y}' + u.name + '{/}\'s taunt  WIS DC ' + dc + '  {g}(' + MP.tauntR(u.lvl) + ' ft; ' + leftText(u) + '){/}'];
    list.forEach(function (w) {
      if (RU.immuneTo(w, 'taunted', u)) { lines.push('  ' + Nm(B, w) + ': {g}pays him no mind{/}'); return; }
      var sv = RU.save(w, 'wis', dc, false, 'taunted');
      lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}keeps its head{/}' : '{o}TAUNTED{/} {g}(only at Denny, till its turn ends){/}'));
      if (!sv.ok) { w.conds.taunted = { by: u.id, name: u.name, till: { who: w.id, at: 'end', n: 1 }, endText: '{who} is no longer taunted.' }; FX.ring(w, 'red', 26); }
    });
    if (!list.length) lines.push('  {g}no foe near enough to hear it.{/}');
    B.card(lines, 360); yield 24;
    u.anim = 'idle';
  };
  // DENIM DAMAGE (Denny; an action, a special): his swings, the first to land +MP.denimDice (1d6; 3d6 at 5th, 5d6 at 9th) -- doubled on a critical -- and from 3rd
  // THE KNOCK, its reach: the one that blow lands on is shoved MP.denimPush ft straight back from him (Large or smaller; no save, as Repelling Blast's), off
  // whoever it was on: a taunted foe walks back to him for it
  MP.denim = function* (B, u, t) {
    spend(u);
    B.card(['{y}' + u.name + '{/}: DENIM DAMAGE!  {g}(' + MP.denimDice(u.lvl) + ' on the first blow that lands' + (MP.denimPush(u.lvl) ? ', and it knocks ' + MP.denimPush(u.lvl) + ' ft back' : '') + '; ' + leftText(u) + '){/}'], 200); D.sfx('crit');
    var hit = yield* blows(B, u, t, 'Denim Damage', MP.denimDice(u.lvl)), ft = MP.denimPush(u.lvl);
    if (hit && ft && standing(hit) && (hit.size || 1) <= 2 && !u.dead && u.hp > 0) yield* MP.shove(B, u, hit, ft, 'the denim knocks ' + nm(B, hit) + ' back');
  };
  // CANNONBALL (Denny, 5th; an action, a special) -- his level 5 beside Extra Attack, set against what the classes get there (a fighter's Extra Attack; a
  // monk's Stunning Strike; a wizard's Fireball, 8d6 in a 20-ft sphere twice a day): a leap of up to MP.leap ft (20; 25 at 7th, 30 at 9th; no opportunity attacks:
  // he is in the air) to a square beside a foe; every foe within 5 ft where he lands saves DEX (8 + prof + STR) or takes MP.cannonDice bludgeoning (2d8; 2d8+4 at
  // 9th) and is knocked prone (half, and on its feet, on a success; a Huge one is not knocked down); then one swing at the one he came down by. His sheet's Jump pose
  MP.landings = function (B, u, t) {
    var out = [], lp = MP.leap(u.lvl);
    for (var y = t.y - 1; y <= t.y + (t.size || 1); y++) for (var x = t.x - 1; x <= t.x + (t.size || 1); x++) {
      if ((x === u.x && y === u.y) || !G.canStand(u, x, y) || G.dist(u, t, x, y) > 5) continue;
      if (Math.max(Math.abs(x - u.x), Math.abs(y - u.y)) * 5 > lp || !G.losPoint(u.x, u.y, x, y)) continue;
      out.push([x, y]);
    }
    return out;
  };
  MP.leapTargets = function (B, u) { return MP.foes(B, u, MP.leap(u.lvl) + 5, true).filter(function (w) { return MP.landings(B, u, w).length > 0; }); };
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

  // VNA BUBBLE (Beholda; a bonus action, a special): a bubble round her, MP.bubbleR ft (10; 20 at 5th, 30 at 9th); she and every friend inside +MP.bubbleAC AC (+1;
  // a point more every even level, to +5 at 8th), till the start of her next turn -- MP's one round. It pops at once when she is stunned,
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

  // BALEFUL GAZE (Beholda; an action, a special): one creature she sees within MP.gazeRange ft (30; 60 at 5th, 90 at 9th) saves WIS (her DC: 8 + prof + WIS) --
  // failed, MP.gazeDice psychic (1d8; 3d8 at 5th, 5d8 at 9th) and DOMINATED till the end of its next turn (that turn it goes at the nearest of its own side it can
  // reach: MP.dominatedTurn); saved, half and its mind its own. A charm, by what it lays: one that cannot be charmed takes the damage only. MP's gaze inverted to
  // damage against the Algorithm, 10 a point; the domination is the show's (Griz, 10-06: "mind domination high hp damage")
  // THE BIG SCREEN (Beholda, 5th; an action, a special): the projection -- her eye opens a cone (30 ft; 40 at 9th) at one she sees, and every foe in it saves as
  // above, MP.screenDice psychic (4d8 at 5th, 6d8 at 9th), set against a Fireball's 8d6 twice a day, with the domination on top
  MP.gazeTargets = function (B, u) { return MP.foes(B, u, MP.gazeRange(u.lvl), true); };
  MP.screenTargets = function (B, u) { return MP.foes(B, u, MP.screenLen(u.lvl), true); };
  MP.screenCatch = function (B, u, t) {
    var sq = M.area(u, MP.screenGeo(u.lvl), t.x, t.y);
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
    yield* stare(B, u, c.foes, MP.screenDice(u.lvl), '{y}' + u.name + '{/}: THE BIG SCREEN!  {p}(the projection: a ' + MP.screenLen(u.lvl) + '-ft cone){/}');
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

  // ------------------------------------------------------------------ RASCAL (10-06): MP's Social PC. His regular blow is a cantrip, Fire Bolt (in his `known`: the class
  // AI flings it as any caster's; Griz: "He'll range attack with a cantrip like Aurdin"), the claw a 1d6 Pinch when something is on him. The specials by his
  // word (10-06): "Social sharing as a hat removing bow", "Social flame as dancing with claw clapping", the third "love it", and all three actions ("they get
  // two specials per fight and that's a usage - action seems right")
  // SOCIAL SHARING (a BONUS action, a special -- 10-06 night, the setup special to the bonus action, Griz: "solid"; MP's Dice-Share was a round-start move,
  // "distributes Rascal's action dice to other lobstamonkees at round start", never an attack): the hat comes off and he bows -- MP.shareN friends within 30 ft
  // (1; 3 at 5th, 5 at 9th), the player's picks or the hardest hitters, each get a Social die (a d4; a d8 at 5th, a d12 at 9th), spent where it turns a miss
  // into a hit or a failed save into a saved one (the bard's inspiration: js/features.js F.inspire, one die a creature)
  MP.shareable = function (B, u) { return B.units.filter(function (w) { return w !== u && w.side === u.side && standing(w) && !w.familiar && !w.conds.inspired && G.dist(u, w) <= 30; }); };
  MP.shareTargets = function (B, u) { return MP.shareable(B, u).sort(function (a, b) { return TX.dpr(b) - TX.dpr(a); }).slice(0, MP.shareN(u.lvl)); };
  MP.sharing = function* (B, u, picks) {
    var ok = MP.shareable(B, u), list = picks && picks.length ? picks.filter(function (w) { return ok.indexOf(w) >= 0; }).slice(0, MP.shareN(u.lvl)) : MP.shareTargets(B, u), die = MP.shareDie(u.lvl);
    spend(u); u.turn.bonus = 0;
    u.anim = rowOr(u, 'socialsharing', 'cast'); u.animT = B.t; D.sfx('buff');
    list.forEach(function (w) { w.conds.inspired = { die: die, by: u.id }; FX.sparkle(w, 'gold', 14); });
    B.card(['{y}' + u.name + '{/}: SOCIAL SHARING!  {g}(the hat comes off; a bow){/}  a ' + die + ' to ' + (list.length ? list.map(function (w) { return w.name; }).join(', ') : 'no one near') + '  {g}(for a roll that needs it; ' + leftText(u) + '){/}'], 340);
    yield 30;
    u.anim = 'idle';
  };
  // SOCIAL FLAME (an action, a special; MP's Range Fireball: 60 ft, 10 ft + 5 ft a level, 10 + 5/level + 10 a success): a ball of fire at a point he sees within
  // 60 ft, MP.flameR ft round (5; 15 at 5th, 25 at 9th); every creature in it saves DEX (his DC) or takes MP.flameDice fire (2d6; 4d6 at 5th, 6d6 at 9th), half on
  // a save; friends in it burn too, as a Fireball's do. The dance with the claw clapping is its row; the fire is drawn here. Aimed as a spell is (a point: js/ui.js)
  MP.flameTargets = function (B, u) { return MP.foes(B, u, 60, true); };
  MP.flameCatch = function (B, u, t) {
    var sq = M.area(u, MP.flameGeo(u.lvl), t.x, t.y);
    return { sq: sq, all: B.units.filter(function (w) { return w !== u && standing(w) && G.inArea(w, sq); }) };
  };
  MP.flame = function* (B, u, t) {
    var c = MP.flameCatch(B, u, t);
    spend(u); u.turn.action = 0;
    u.facing = B.faceTo(u, t); u.anim = rowOr(u, 'socialflame', 'cast'); u.animT = B.t; D.sfx('crit');
    yield 20;
    FX.beam(u, t, 'fire', { thin: true }); yield 14;
    FX.bloom(t.x, t.y, c.sq, 'fire');
    var dx = MP.flameDice(u.lvl), r = D.roll(dx), dc = u.spellDC, hurt = [];
    var at = t.side ? nm(B, t) : (G.occupant(t.x, t.y) ? nm(B, G.occupant(t.x, t.y)) : 'the spot');
    var lines = ['{y}' + u.name + '{/}: SOCIAL FLAME!  ' + dx + ' ' + RU.fmtRolls(r.rolls) + ' = {o}' + r.total + '{/} fire  DEX DC ' + dc + '  {g}(' + MP.flameR(u.lvl) + ' ft round ' + at + '; ' + leftText(u) + '){/}'];
    c.all.forEach(function (w) {
      var sv = RU.save(w, 'dex', dc, false, null, r.total), ev = RU.evasion(w), n = sv.ok ? (ev ? 0 : Math.floor(r.total / 2)) : (ev ? Math.floor(r.total / 2) : r.total);
      lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' -> {r}' + n + '{/}');
      if (n) hurt.push([w, n]);
    });
    if (!c.all.length) lines.push('  {g}no one in it.{/}');
    B.card(lines.slice(0, 9), 420); yield 20;
    hurt.forEach(function (h) { if (!h[0].dead && h[0].hp > 0) B.hurt(h[0], h[1], 'fire', { magic: true }); });
    yield 24;
    u.anim = 'idle';
  };
  // SOCIAL DISTANCING (5th; an action, a special -- REDONE 10-06 night, Griz: "clears the 8 square donut around him when he first gets it instead of a
  // front-wave"; "DamageDie or static + at 6, radius at 7, repeat"): the ring round him, MP.distR ft (the 8 squares at 5th; 10 ft at 7th, 15 at 9th) -- each foe
  // in it saves WIS (his DC) or takes MP.distDice psychic (2d8; 3d8 at 6th, 4d8 at 8th), is SHOVED out of the ring, straight away from him, and is FRIGHTENED of
  // him till the end of its next turn: it spends that turn getting away and can't willingly come closer, disadvantage on attacks while it sees him (Fear's own
  // machinery, js/grimoire.js E.fear: `frightened` and `feared`, no concentration, one turn on the sweep's clock); half, and it stands its ground, on a save.
  // One that cannot be frightened is shoved and hurt but not frightened; one Huge or bigger is not shoved
  MP.distCatch = function (B, u) {
    var R0 = MP.distR(u.lvl), sq = G.sphere(u.x, u.y, R0).filter(function (q) { return q[0] !== u.x || q[1] !== u.y; });
    return { sq: sq, foes: MP.foes(B, u, R0) };
  };
  MP.distancing = function* (B, u) {
    var c = MP.distCatch(B, u), R0 = MP.distR(u.lvl);
    spend(u); u.turn.action = 0;
    u.anim = rowOr(u, 'socialdistancing', 'cast'); u.animT = B.t; D.sfx('charm');
    FX.bloom(u.x, u.y, c.sq, 'violet'); FX.ring(u, 'violet', 30 + R0);
    yield 24;
    var dx = MP.distDice(u.lvl), r = D.roll(dx), dc = u.spellDC, hurt = [], fled = [], out = [];
    var lines = ['{y}' + u.name + '{/}: SOCIAL DISTANCING!  ' + dx + ' ' + RU.fmtRolls(r.rolls) + ' = {o}' + r.total + '{/} psychic  WIS DC ' + dc + '  {g}(everyone within ' + R0 + ' ft, OUT; ' + leftText(u) + '){/}'];
    c.foes.forEach(function (w) {
      var proof = !!(w.conds.heroism || RU.immuneTo(w, 'frightened', u)), sv = RU.save(w, 'wis', dc, false, proof ? null : 'frightened', r.total), n = sv.ok ? Math.floor(r.total / 2) : r.total;
      lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}stands its ground{/}' : '{o}failed: OUT{/}' + (proof ? ' {g}(fearless){/}' : ' {p}FRIGHTENED{/}')) + ' -> {r}' + n + '{/}');
      hurt.push([w, n]); if (!sv.ok) { out.push(w); if (!proof) fled.push(w); }
    });
    if (!c.foes.length) lines.push('  {g}no one near him.{/}');
    B.card(lines.slice(0, 9), 420); yield 20;
    hurt.forEach(function (h) { if (h[1] && !h[0].dead && h[0].hp > 0) B.hurt(h[0], h[1], 'psychic', { magic: true }); });
    for (var i = 0; i < out.length; i++) { var w = out[i]; if (standing(w) && (w.size || 1) <= 2) yield* MP.shove(B, u, w, R0 + 5 - G.dist(u, w), null); }
    fled.forEach(function (w) {
      if (w.dead || w.hp <= 0) return;
      w.conds.frightened = { by: u.id, till: { who: w.id, at: 'end', n: 1 }, endText: '{who} gets a grip on itself.' };
      w.conds.feared = { dc: dc, by: u.id, till: { who: w.id, at: 'end', n: 1 } };
      FX.ring(w, 'violet', 30);
    });
    yield 24;
    u.anim = 'idle';
  };

  // GOING VIRAL (Rascal, 7th; an action, a special -- the fourth, 10-06 night: "they should get a fourth special at some point (7)"): fire that spreads from foe
  // to foe, Chain Lightning's shape -- a foe he sees within 120 ft, then the nearest foe within 30 ft of the last not yet caught, MP.viralN in all (3; 4 at 9th);
  // each saves DEX (his DC) or takes MP.viralDice fire (3d8; 4d8 at 8th), half on a save. It never jumps to a friend
  MP.viralTargets = function (B, u) { return MP.foes(B, u, 120, true); };
  MP.viralChain = function (B, u, t) {
    var out = [t], n = MP.viralN(u.lvl);
    while (out.length < n) {
      var last = out[out.length - 1], next = B.units.filter(function (w) { return G.hostile(u, w) && standing(w) && out.indexOf(w) < 0 && G.dist(last, w) <= 30 && G.los(last, w).clear; }).sort(function (a, b) { return G.dist(last, a) - G.dist(last, b); })[0];
      if (!next) break; out.push(next);
    }
    return out;
  };
  MP.viral = function* (B, u, t) {
    var chain = MP.viralChain(B, u, t), dx = MP.viralDice(u.lvl), r = D.roll(dx), dc = u.spellDC, hurt = [];
    spend(u); u.turn.action = 0;
    u.facing = B.faceTo(u, t); u.anim = rowOr(u, 'goingviral', 'socialflame'); u.animT = B.t; D.sfx('crit');
    yield 16;
    var lines = ['{y}' + u.name + '{/}: GOING VIRAL!  ' + dx + ' ' + RU.fmtRolls(r.rolls) + ' = {o}' + r.total + '{/} fire  DEX DC ' + dc + '  {g}(it spreads: ' + chain.length + ' caught; ' + leftText(u) + '){/}'];
    for (var i = 0; i < chain.length; i++) { FX.beam(i ? chain[i - 1] : u, chain[i], 'fire', { thin: true }); yield 8; }
    chain.forEach(function (w) {
      var sv = RU.save(w, 'dex', dc, false, null, r.total), ev = RU.evasion(w), n = sv.ok ? (ev ? 0 : Math.floor(r.total / 2)) : (ev ? Math.floor(r.total / 2) : r.total);
      lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' -> {r}' + n + '{/}'); if (n) hurt.push([w, n]);
    });
    B.card(lines.slice(0, 9), 420); yield 20;
    hurt.forEach(function (h) { if (!h[0].dead && h[0].hp > 0) B.hurt(h[0], h[1], 'fire', { magic: true }); });
    yield 24; u.anim = 'idle';
  };

  // ------------------------------------------------------------------ GOOSE (10-07): MP's Heals. His regular blow is the sling on WIS (in the class AI's hands as any ranged
  // weapon); his specials are the heals, each the jump with the glow between his hands (his sheet's cast row), and green: the heal's own look, js/fx.js EL.heal (Griz,
  // 10-07: "his specials should mainly be green energy"). A heal reaches a friend standing or down -- not the dead, nor the slain, nor a familiar (its own side's heals
  // pass one by, as the spells do) -- and him
  function mendable(u, w) { return !!w && w.side === u.side && !w.dead && !w.slain && !w.object && !w.familiar && !w.fled; }
  MP.healable = function (B, u, ft) { return B.units.filter(function (w) { return mendable(u, w) && w.hp < w.maxhp && (w === u || G.dist(u, w) <= ft); }); };
  // one heal: the dice, his WIS (the core two), his level from 3rd (BIG HEART), into B.heal (the down get up); the card's line. The Hivemind's heat is a blow's: a heal
  // keeps it for the next special that hurts (MP.cur.heated)
  function mend(B, u, w, dexpr, wis) {
    if (MP.cur) MP.cur.heated = true;
    var r = D.roll(dexpr), m = wis ? mod(u.abil.wis) : 0, big = MP.bigHeart(u), amt = Math.max(1, r.total + m + big), got = B.heal(w, amt);
    FX.heal(w);
    return '  ' + w.name + ': ' + dexpr + (m ? RU.sign(m) : '') + (big ? ' +' + big + ' {g}(big heart){/}' : '') + ' ' + RU.fmtRolls(r.rolls) + ' = {n}+' + amt + '{/}' + (got < amt ? ' {g}(' + (got <= 0 ? 'whole already' : got + ' to full') + '){/}' : '');
  }
  function healRow(u) { return rowOr(u, 'cast', 'attack'); }
  // HEART TO HEART (a BONUS action, a special -- 10-06 night, the setup special to the bonus action, "solid": "the single heal, the way the SRD's Healing Word is a bonus
  // action"; MP's single-target heal): a friend he sees within MP.heartR ft (30; 60 at 5th, 90 at 9th), or himself -- up again, if it was down -- heals MP.heartDice +
  // WIS (1d6; 3d6 at 5th, 5d6 at 9th), and his level from 3rd. The name is the seat's (Goose's suit is MP's Heart)
  MP.heartTargets = function (B, u) { return MP.healable(B, u, MP.heartR(u.lvl)).filter(function (w) { return w === u || M.sees(B, u, w); }); };
  MP.heart = function* (B, u, t) {
    spend(u); u.turn.bonus = 0;
    if (t !== u) u.facing = B.faceTo(u, t);
    u.anim = healRow(u); u.animT = B.t; D.sfx('buff');
    yield 14;
    if (t !== u) FX.beam(u, t, 'heal', { thin: true });
    yield 8;
    var line = mend(B, u, t, MP.heartDice(u.lvl), true);
    FX.sparkle(t, 'orc', 16);
    B.card(['{y}' + u.name + '{/}: HEART TO HEART!  {g}(a bonus action; ' + leftText(u) + '){/}', line], 300);
    yield 24; u.anim = 'idle';
  };
  // GROUP HUG (an action, a special; MP's group heal, "to all party members"): he springs up and the glow comes down round him -- every friend within MP.groupR ft (15;
  // 25 at 5th, 35 at 9th), himself and the down among them, heals MP.groupDice + WIS (1d4; 3d4 at 5th, 5d4 at 9th), and his level from 3rd. The name is the seat's
  MP.groupCatch = function (B, u) { return MP.healable(B, u, MP.groupR(u.lvl)); };
  MP.group = function* (B, u) {
    var list = MP.groupCatch(B, u), R0 = MP.groupR(u.lvl);
    spend(u); u.turn.action = 0;
    u.anim = healRow(u); u.animT = B.t; D.sfx('buff');
    yield 14;
    FX.bloom(u.x, u.y, G.sphere(u.x, u.y, R0), 'heal'); FX.ring(u, 'orc', 30 + R0);
    yield 12;
    var lines = ['{y}' + u.name + '{/}: GROUP HUG!  {g}(everyone within ' + R0 + ' ft of him; ' + leftText(u) + '){/}'];
    list.forEach(function (w) { lines.push(mend(B, u, w, MP.groupDice(u.lvl), true)); });
    if (!list.length) lines.push('  {g}no one near him is hurt.{/}');
    B.card(lines.slice(0, 9), 360);
    yield 28; u.anim = 'idle';
  };
  // FOUNTAIN (5th; an action, a special -- the draft's CLEANSE, on his word: "Cleanse as 'Fountain'"): the glow wells up round him -- every friend within MP.fountR ft (30;
  // 40 at 7th, 50 at 9th), himself too, has its worst ailment ended (Lesser Restoration's, SRD 5.1: paralysis, a disease, blindness, poison, deafness -- js/magic.js
  // M.ailments, worst first) and heals MP.fountDice (1d8; 2d8 at 6th, 3d8 at 8th) and his level
  MP.fountCatch = function (B, u) { var R0 = MP.fountR(u.lvl); return B.units.filter(function (w) { return mendable(u, w) && (w === u || G.dist(u, w) <= R0) && (w.hp < w.maxhp || M.ailments(w).length > 0); }); };
  MP.fountain = function* (B, u) {
    var list = MP.fountCatch(B, u), R0 = MP.fountR(u.lvl);
    spend(u); u.turn.action = 0;
    u.anim = healRow(u); u.animT = B.t; D.sfx('buff');
    yield 14;
    FX.bloom(u.x, u.y, G.sphere(u.x, u.y, R0), 'heal');
    yield 12;
    var lines = ['{y}' + u.name + '{/}: FOUNTAIN!  {g}(everyone within ' + R0 + ' ft: an ailment ended, and healing; ' + leftText(u) + '){/}'];
    list.forEach(function (w) {
      var ail = M.ailments(w)[0], ended = ail ? ail.label : '';
      if (ail) ail.end();
      lines.push(mend(B, u, w, MP.fountDice(u.lvl), false) + (ended ? '  {c}' + ended + ' ended{/}' : ''));
    });
    if (!list.length) lines.push('  {g}no one near him needs it.{/}');
    B.card(lines.slice(0, 9), 380);
    yield 28; u.anim = 'idle';
  };

  // ------------------------------------------------------------------ THE IN-BETWEEN LEVELS (10-06 night, Griz: "I'm thinking of these as stuff that adds on during the inbetween
  // levels, with a passive between these unlocking"; the seat's draft, "Those are good"): a free bonus move at 2nd, a passive at 3rd, a reaction at 6th -- each on a
  // mechanic the grid already has. The passives' and the reactions' uses are a fight's, back on a short rest with the specials (MP.refill): the proficiency bonus of each
  MP.has = function (u, sub, lvl) { return !!(u && u.cls === 'mpmon' && u.mpSub === sub && (u.lvl || 1) >= lvl); };
  MP.refill = function (u) { var f = u.feats = u.feats || {}, p = 2 + Math.floor(((u.lvl || 1) - 1) / 4); f.specials = MP.specialsAt(u.lvl); f.lucky = p; f.eyeContact = p; f.hotTake = p; f.notToday = 1; }; // (Not Today: once a fight, by the draft)

  // MONKEY FLURRY (the Tank, 2nd; a bonus action, free): after he takes the Attack action, one more punch of the Monkey Fists (the monk's Martial Arts, SRD 5.1)
  MP.flurryOK = function (u) { var T = u.turn; return MP.has(u, 'tank', 2) && !!T && T.bonus > 0 && !!T.attackAction && !u.conds.incapacitated; };
  MP.flurry = function* (B, u, t) {
    u.turn.bonus = 0;
    B.card(['{y}' + u.name + '{/}: MONKEY FLURRY!  {g}(one more punch, a bonus action){/}'], 160);
    if (standing(t) && G.dist(u, t) <= G.reachOf(u)) yield* B.attack(u, t, u.weapon);
  };
  // STAND FIRM (the Tank, 3rd; a passive): advantage on a save against being knocked prone, on every STR save (a wave's shove, a wind's), and on the check to
  // break a grip (js/magic.js breakFree, by RU.checkEdges)
  // LUCKY DICE (Buffs, 3rd; a passive): a friend she sees within 30 ft -- or herself -- who rolls a 1 on the d20 of an attack or a save rolls it again (the halfling's
  // Lucky, SRD 5.1, given to her friends by her three dice), her proficiency bonus of times a fight
  function luckyFor(B, w) {
    if (!B || !w || !w.side || !B.units) return null;
    return B.units.filter(function (b) { return MP.has(b, 'buffs', 3) && b.side === w.side && standing(b) && RU.canAct(b) && (b.feats.lucky || 0) > 0 && (b === w || (G.dist(b, w) <= 30 && M.sees(B, b, w))); })[0] || null;
  }
  function lucky(B, w, what) {
    var b = luckyFor(B, w); if (!b) return false;
    b.feats.lucky--; FX.sparkle(w, 'gold', 12);
    B.card(['{y}' + b.name + '{/}\'s LUCKY DICE: ' + nm(B, w) + ' rolled a 1 on ' + what + ' -- roll it again!  {g}(' + b.feats.lucky + ' left this fight){/}'], 220);
    return true;
  }
  var swingers = []; // (who is swinging: the attack wrap below keeps it, so the attack roll's one roller, RU.d20, knows whose 1 it is)
  // the one swinging now: a fight that ends inside a swing never closes it (its generator is dropped mid-blow), so one not in this battle is left over -- dropped
  // (10-07: the bench's fights left one, and the next battle's Hivemind heat looked for its own user under it)
  function swinger() { var B = D.battle; while (swingers.length && !(B && B.units && B.units.indexOf(swingers[swingers.length - 1]) >= 0)) swingers.pop(); return swingers[swingers.length - 1] || null; }
  var d20_0 = RU.d20; RU.d20 = function () {
    var r = d20_0.apply(this, arguments), w = swinger();
    if (r && r.pick === 1 && w && lucky(D.battle, w, 'a swing')) r = d20_0.apply(this, arguments);
    return r;
  };
  var save0 = RU.save; RU.save = function (u, ab, dc, adv0, against) {
    var a = Array.prototype.slice.call(arguments), B = D.battle, d0 = D.d, used = false;
    if (MP.has(u, 'tank', 3) && !adv0 && (against === 'prone' || ab === 'str')) a[3] = true; // (Stand Firm)
    if (B && luckyFor(B, u)) D.d = function (n) { var v = d0.apply(this, arguments); if (n === 20 && v === 1 && !used && lucky(B, u, 'a save')) { used = true; v = d0.apply(this, arguments); } return v; };
    try { return save0.apply(this, a); } finally { D.d = d0; }
  };
  var bf0 = M.breakFree; if (bf0) M.breakFree = function* (B, u) { var was = u.mpFirm; if (MP.has(u, 'tank', 3)) u.mpFirm = true; try { return yield* bf0.apply(this, arguments); } finally { u.mpFirm = was; } };
  var ce0 = RU.checkEdges; RU.checkEdges = function (u, abil) { var e = ce0.apply(this, arguments); if (u && u.mpFirm && (abil === 'str' || abil === 'dex') && e && e.adv) e.adv.push('stand firm'); return e; };
  // SPICY (DPS, 3rd; a passive): his Fire Bolt adds his CHA to its damage (the warlock's Agonizing Blast, SRD 5.1, on his own cantrip). The attack wrap
  var attack0 = D.Battle.prototype.attack;
  D.Battle.prototype.attack = function* (att, tgt, atk) {
    var a = Array.prototype.slice.call(arguments);
    if (atk && atk.spell && /^fire bolt$/i.test(atk.name || '') && MP.has(att, 'dps', 3)) a[2] = Object.assign({}, atk, { mod: (atk.mod || 0) + Math.max(0, mod(att.abil.cha)) });
    swingers.push(att);
    try { return yield* attack0.apply(this, a); } finally { swingers.pop(); }
  };
  // EYE ON IT (Buffs, 2nd; a bonus action, free): the Help, from 30 ft -- a foe she sees: the next swing her side makes at it has advantage (battle.js's Help,
  // conds.helped: spent on that swing, lapsed at her next turn)
  MP.eyeTargets = function (B, u) { return MP.foes(B, u, 30, true); };
  MP.eyeOnIt = function* (B, u, t) {
    u.turn.bonus = 0; t.conds.helped = { by: u.id, side: u.side };
    u.facing = B.faceTo(u, t); u.anim = rowOr(u, 'spot', 'gaze'); u.animT = B.t; FX.ring(t, 'violet', 18); D.sfx('buff');
    B.card(['{y}' + u.name + '{/}: EYE ON IT!  {g}(' + nm(B, t) + ': the next swing at it has advantage){/}'], 200); yield 12;
  };
  // HONK (the Heals, 2nd; a bonus action, free -- the draft: "a foe within 30 ft has disadvantage on its next attack, like Vicious Mockery's rider"): a foe within 30 ft
  // that can hear him -- its next attack roll before the end of its next turn has disadvantage (Vicious Mockery's own mark, conds.mocked: js/rules.js reads it, the roll
  // spends it, js/battle.js). His sheet's honk row
  MP.honkTargets = function (B, u) { return MP.foes(B, u, 30).filter(function (w) { return !w.conds.deafened && !w.conds.mocked; }); };
  MP.honk = function* (B, u, t) {
    u.turn.bonus = 0; t.conds.mocked = { by: u.id, honk: true, till: { who: t.id, at: 'end', n: 1 } };
    u.facing = B.faceTo(u, t); u.anim = rowOr(u, 'honk', 'attack'); u.animT = B.t; D.sfx('crit'); FX.ring(t, 'orc', 20);
    B.card(['{y}' + u.name + '{/}: HONK!  {g}(' + nm(B, t) + ': its next swing at disadvantage; a free bonus action){/}'], 200);
    yield 16; u.anim = 'idle';
  };
  // BIG HEART (the Heals, 3rd; a passive): his heals add his level to each one they mend (the Life cleric's Disciple of Life, SRD 5.1) -- MP.bigHeart, in mend() above
  // NOT TODAY (the Heals, 6th; a reaction -- the draft: "a friend within 30 ft who drops to 0 drops to 1 instead, once a fight", Death Ward's shape): a blow that would
  // drop a friend of his within 30 ft (not himself) leaves it at 1 instead -- js/battle.js hurt's own Death Ward stop, lent for the one blow -- once a fight, back on a
  // short rest. It goes on its own, as Eye Contact does (a blow is no prompt). The hurt wrap below lends and settles it
  function notToday(B, w, n) {
    if (!B || !B.units || !w || !w.conds || w.dead || w.hp <= 0 || w.object || w.familiar || w.conds.deathWard || n < w.hp + (w.temp || 0)) return null;
    var g = B.units.filter(function (b) { return MP.has(b, 'heals', 6) && b !== w && b.side === w.side && b.reaction > 0 && standing(b) && RU.canAct(b) && (b.feats.notToday || 0) > 0 && G.dist(b, w) <= 30; })[0];
    if (!g) return null;
    w.conds.deathWard = { notToday: g.id };
    return g;
  }
  function notTodayAfter(B, g, w) {
    if (w.conds.deathWard && w.conds.deathWard.notToday === g.id) { delete w.conds.deathWard; return; } // (the blow did not drop it after all: a resistance, the temporary hit points)
    if (w.dead || w.hp !== 1) return;
    g.reaction = 0; g.feats.notToday--;
    g.facing = B.faceTo(g, w); g.anim = healRow(g); g.animT = B.t; FX.heal(w); FX.ring(w, 'orc', 30); D.sfx('buff');
    B.card(['{y}' + g.name + '{/}: NOT TODAY!  {n}' + w.name + ' stays up, at 1.{/}  {g}(his reaction; once a fight){/}'], 260);
  }
  // SCUTTLE (DPS, 2nd; a bonus action, free): Dash, Disengage or Hide -- the rogue's Cunning Action, SRD 5.1 (battle.js's cdash, cdisengage, hide; `cunning` on him)
  var bd0 = TX.bonusDash; TX.bonusDash = function (u) { return bd0.apply(this, arguments) || (MP.has(u, 'dps', 2) && u.turn && u.turn.bonus > 0 && !u.conds.restrained ? 'Scuttle' : ''); };
  // BODYGUARD (the Tank, 6th; a reaction): a foe he sees swings at a friend within 5 ft of him -- the roll at disadvantage (the Protection fighting style, SRD 5.1,
  // without the shield: battle.js reads `bodyguard` beside it, and asks the player)
  // EYE CONTACT (Buffs, 6th; a reaction): a foe she sees within 60 ft lands a blow on a friend of hers, or on her, by a little -- she meets its eye and takes 1d6
  // off the roll (the bard's Cutting Words, SRD 5.1: js/features.js F.cutting), her proficiency bonus of times a fight. It goes on its own, as the AI's Cutting
  // Words do (the hook is no generator: no prompt), and only where a d6 could turn the blow
  var cut0 = F.cutting; F.cutting = function (B, att, tgt, over) {
    var n = cut0 ? cut0.apply(this, arguments) : 0; if (n || over >= 6) return n;
    var b = (B.units || []).filter(function (w) { return MP.has(w, 'buffs', 6) && w.side === tgt.side && w.reaction > 0 && standing(w) && RU.canAct(w) && (w.feats.eyeContact || 0) > 0 && G.dist(w, att) <= 60 && M.sees(B, w, att); })[0];
    if (!b) return 0;
    b.reaction = 0; b.feats.eyeContact--;
    var r = D.d(6); FX.ring(att, 'violet', 16);
    if (B.faceTo) b.facing = B.faceTo(b, att); b.anim = gazeRow(b); b.animT = B.t; // (the stare on her own row: the art list's table, 10-07)
    B.card(['{y}' + b.name + '{/}: EYE CONTACT!  {g}(' + nm(B, att) + ' meets her eye: -' + r + ' on the roll; ' + b.feats.eyeContact + ' left this fight){/}'], 220);
    return r;
  };
  // HOT TAKE (DPS, 6th; a reaction): a foe he sees within 60 ft hits him -- it saves DEX (his DC) or takes 2d10 fire, half on a save (Hellish Rebuke at its 1st
  // level, SRD 5.1, asked where js/grimoire.js M.rebuke is: after a hit's damage), his proficiency bonus of times a fight. The player is asked; the AI answers yes
  var rebuke0 = M.rebuke; M.rebuke = function* (B, u, att) {
    if (!(MP.has(u, 'dps', 6) && u.reaction > 0 && RU.canAct(u) && (u.feats.hotTake || 0) > 0 && G.hostile(u, att) && standing(att) && G.dist(u, att) <= 60 && M.sees(B, u, att))) { if (rebuke0) yield* rebuke0.apply(this, arguments); return; }
    var yes = (u.side !== 'party' || u.guest) ? true : yield { prompt: { who: u, title: u.name + ': HOT TAKE?', lines: [Nm(B, att) + ' hit you. Fire back: DEX DC ' + u.spellDC + ', 2d10 fire, half on a save. (the reaction; ' + u.feats.hotTake + ' left this fight)'], opts: [{ label: 'HOT TAKE', value: true }, { label: 'LET IT GO', value: false }] } };
    if (!yes) return;
    u.reaction = 0; u.feats.hotTake--;
    var r = D.roll('2d10'), sv = RU.save(att, 'dex', u.spellDC, false, null, r.total), ev = RU.evasion(att), n = sv.ok ? (ev ? 0 : Math.floor(r.total / 2)) : (ev ? Math.floor(r.total / 2) : r.total);
    u.facing = B.faceTo(u, att); u.anim = rowOr(u, 'hottake', 'socialflame'); u.animT = B.t; FX.beam(u, att, 'fire', { thin: true }); D.sfx('crit');
    B.card(['{y}' + u.name + '{/}: HOT TAKE!  2d10 ' + RU.fmtRolls(r.rolls) + ' = {o}' + r.total + '{/} fire  ' + Nm(B, att) + ': ' + RU.saveText(sv) + ' -> {r}' + n + '{/}  {g}(' + u.feats.hotTake + ' left){/}'], 300);
    yield 12; if (n && !att.dead && att.hp > 0) B.hurt(att, n, 'fire', { magic: true }); yield 12;
  };

  // ------------------------------------------------------------------ THE FOURTH SPECIALS (7th; Griz: "they should get a fourth special at some point (7)")
  // LOBSTAH HUG (the Tank): he grabs a foe beside him, Large or smaller (Huge at 9th): it saves STR (8 + prof + STR) or is HELD -- grappled and restrained by him
  // (battle.js's grip: conds.restrained { grapple, by }, broken by BREAK FREE against his DC, let go when he is down or incapacitated or out of reach) -- and while he
  // holds it, it is taunted (it may go only at him), and at the start of each of his turns it takes MP.hugDice + STR, the squeeze (2d8 + STR at 8th)
  MP.hugTargets = function (B, u) { return MP.inReach(B, u).filter(function (w) { return (w.size || 1) <= MP.hugSize(u.lvl) && !w.conds.restrained && !RU.immuneTo(w, 'grappled') && !RU.immuneTo(w, 'restrained'); }); };
  function holdTaunt(u, w) { w.conds.taunted = { by: u.id, name: u.name, hug: true, till: { who: w.id, at: 'end', n: 1 }, endText: '{who} is no longer held to him.' }; }
  MP.hug = function* (B, u, t) {
    spend(u); u.turn.action = 0;
    u.facing = B.faceTo(u, t); u.anim = rowOr(u, 'lobstahhug', 'attack'); u.animT = B.t; D.sfx('crit');
    var dc = MP.tauntDC(u), sv = RU.save(t, 'str', dc, false, 'grappled');
    B.card(['{y}' + u.name + '{/}: LOBSTAH HUG!  ' + Nm(B, t) + ': STR ' + RU.saveText(sv) + ' vs DC ' + dc + '  ' + (sv.ok ? '{n}slips out of it{/}' : '{o}HELD{/} {g}(squeezed each of his turns; it may go only at him){/}') + '  {g}(' + leftText(u) + '){/}'], 320);
    yield rowWait(u, 20);
    if (!sv.ok && standing(t)) { t.conds.restrained = { dc: dc, by: u.id, grapple: true, hug: true }; (u.holding = u.holding || []).push(t); holdTaunt(u, t); FX.ring(t, 'red', 24); }
    u.anim = 'idle';
  };
  function squeeze(B, u) {
    (u.holding || []).slice().forEach(function (w) {
      var c = w.conds && w.conds.restrained; if (!c || !c.hug || c.by !== u.id || !standing(w)) return;
      if (G.dist(u, w) > 5 || !RU.canAct(u)) { B.release(u, w); return; }
      var dx = MP.hugDice(u.lvl), r = D.roll(dx), s = Math.max(0, mod(u.abil.str)), n = r.total + s;
      B.card(['{y}' + u.name + '{/} squeezes ' + nm(B, w) + ': ' + dx + '+' + s + ' ' + RU.fmtRolls(r.rolls) + ' = {r}' + n + '{/} bludgeoning'], 220);
      B.hurt(w, n, 'bludgeoning', {});
      if (standing(w)) holdTaunt(u, w);
    });
  }
  // SPOTLIGHT (Buffs): MP.spotN friends she sees within MP.spotR ft (one within 30; two at 8th; within 60 at 9th) are HASTED till the end of their next turn -- +2 AC,
  // advantage on DEX saves, double speed and one more attack in the Attack action (js/grimoire.js Haste's own `hasted`) -- and no lethargy after: the light goes off
  MP.spotTargets = function (B, u) { return B.units.filter(function (w) { return w !== u && w.side === u.side && standing(w) && !w.familiar && !w.conds.hasted && G.dist(u, w) <= MP.spotR(u.lvl) && M.sees(B, u, w); }); };
  MP.spotlight = function* (B, u, picks) {
    var ok = MP.spotTargets(B, u), list = (picks && picks.length ? picks.filter(function (w) { return ok.indexOf(w) >= 0; }) : ok.sort(function (a, b) { return TX.dpr(b) - TX.dpr(a); })).slice(0, MP.spotN(u.lvl));
    spend(u); u.turn.action = 0;
    u.anim = rowOr(u, 'spotlight', 'cast'); u.animT = B.t; D.sfx('buff');
    list.forEach(function (w) { w.conds.hasted = { by: u.id, spotlight: true, till: { who: w.id, at: 'end', n: 1 }, endText: '{who} steps out of the spotlight.' }; FX.ring(w, 'gold', 30); FX.sparkle(w, 'gold', 18); });
    B.card(['{y}' + u.name + '{/}: SPOTLIGHT!  {c}' + (list.length ? list.map(function (w) { return w.name; }).join(', ') + ': HASTED' : 'no friend in it') + '{/}  {g}(till the end of their next turn, no lethargy after; ' + leftText(u) + '){/}'], 320);
    yield rowWait(u, 24); u.anim = 'idle';
  };
  // LIFELINE (the Heals; the draft: "Goose binds a friend for the fight, and half the damage they take comes to him instead (Warding Bond)", and his: "LifeLine chooses
  // recipient ally (can tie denny instead of self)"): a friend he sees within MP.lifeR ft (30; 60 at 9th) is TIED, the fight long, to a second -- himself, or another
  // friend -- and half of every blow on the one tied is taken by the other instead (the hurt wrap below). It lets go when either drops to 0, when the two are more than
  // twice MP.lifeR apart, or when he ties another; at 8th the one tied also has +1 AC and +1 on its saves (Warding Bond's other half). A green thread on the floor
  MP.lifeTargets = function (B, u) { var R0 = MP.lifeR(u.lvl); return B.units.filter(function (w) { return w.side === u.side && standing(w) && !w.familiar && !w.object && (w === u || (G.dist(u, w) <= R0 && M.sees(B, u, w))); }); };
  function lifeCut(B, w, why) { if (!w.conds.lifeline) return; delete w.conds.lifeline; if (why && B) B.card(['{g}' + w.name + '\'s lifeline lets go: ' + why + '.{/}'], 200); }
  MP.lifeline = function* (B, u, bound, to) {
    to = to && to !== bound ? to : bound === u ? null : u;
    if (!bound || !to) { D.sfx('error'); B.card(['{o}' + u.name + ': LIFELINE ties two -- the one tied, and who takes the half.{/}'], 200); return; }
    spend(u); u.turn.action = 0;
    B.units.forEach(function (w) { if (w.conds.lifeline && w.conds.lifeline.by === u.id) lifeCut(B, w, null); }); // (one tie of his at a time)
    u.anim = healRow(u); u.animT = B.t; D.sfx('buff');
    yield 14;
    bound.conds.lifeline = { by: u.id, to: to.id, toName: to.name, ward: MP.lifeWard(u.lvl), apart: 2 * MP.lifeR(u.lvl) };
    FX.beam(to, bound, 'heal', { thin: true }); FX.ring(bound, 'orc', 30); FX.ring(to, 'orc', 30);
    B.card(['{y}' + u.name + '{/}: LIFELINE!  {n}' + bound.name + '{/} tied to {n}' + (to === u ? 'him' : to.name) + '{/}: half of every blow on ' + bound.name + ' goes to ' + to.name + (MP.lifeWard(u.lvl) ? '; ' + bound.name + ' +1 AC and saves' : '') + '  {g}(the fight long; ' + leftText(u) + '){/}'], 340);
    yield 24; u.anim = 'idle';
  };
  // the one tied: its +1 AC and saves at 8th
  var acL = RU.ac; RU.ac = function (u) { var c = u && u.conds && u.conds.lifeline; return acL.apply(this, arguments) + (c && c.ward ? c.ward : 0); };
  var saveL = RU.save; RU.save = function (u, ab, dc) { var c = u && u.conds && u.conds.lifeline; if (c && c.ward) { var a = Array.prototype.slice.call(arguments); a[2] = dc - c.ward; return saveL.apply(this, a); } return saveL.apply(this, arguments); };
  // the blow: half of it to the one the tie runs to (Warding Bond: "Each time it takes damage, you take the same amount" -- here the half, moved); then NOT TODAY's 1 HP, lent
  // for the blow (above). A blow passed down the line is not passed again (o.lifeline)
  var hurtG = D.Battle.prototype.hurt;
  D.Battle.prototype.hurt = function (u, n, type, o) {
    var B = this, a = Array.prototype.slice.call(arguments), c = u && u.conds && u.conds.lifeline;
    if (c && n > 0 && !(o && o.lifeline)) {
      var to = (B.units || []).filter(function (w) { return w.id === c.to; })[0];
      if (!to || to.dead || to.hp <= 0) lifeCut(B, u, (to ? to.name : 'the other') + ' is down');
      else if (G.dist(u, to) > c.apart) lifeCut(B, u, 'too far apart');
      else {
        var half = Math.floor(n / 2);
        if (half > 0) { a[1] = n - half; if (FX.float) FX.float('lifeline ' + half, to, D.PAL.ramps.orc[3]); hurtG.call(B, to, half, type, Object.assign({}, o || {}, { lifeline: true })); if (to.dead || to.hp <= 0) lifeCut(B, u, to.name + ' is down'); }
      }
    }
    var g = notToday(B, u, a[1]);
    var r = hurtG.apply(B, a);
    if (g) notTodayAfter(B, g, u);
    if (u && u.conds && u.conds.lifeline && (u.dead || u.hp <= 0)) lifeCut(B, u, u.name + ' is down');
    return r;
  };

  // ------------------------------------------------------------------ THE HIVEMIND (9th, every Mascot: the capstone)
  // RULED 10-06 night, Griz: "rather than 1d6 to one roll at level 9 for the whole party... Denny's activation damage resist for the whole party 1d6, behold 1d6
  // to hit, rascal 1d6 damage, goose 1d6 temp hp - except goose, all apply to next 'special' each char uses (not other moves)". Each 9th-level Mascot's Hivemind
  // gives every Mascot on its side its role's boon, a token held for that one's next special -- the Monster Party is the party the chat cheers:
  //   the Tank's  WARD: the special used, 1d6 off every blow that lands on its user till the start of its next turn
  //   Buffs'      AIM:  1d6 on the special's attack roll, or 1d6 off each save against it (to land it, either way)
  //   the DPS's   HEAT: 1d6 more on the special's damage (its first damage roll)
  //   Heals'      LOVE: 1d6 temporary hit points, at once
  // The aim and the heat wait for a special that can take them (a Taunt rolls no damage: the heat keeps). WHEN it fires is the seat's lean, MP's own round-start
  // bonus die: at the start of each round, every Mascot of 9th level standing (MP.HIVE_AT; asked of him 10-06 night)
  MP.HIVE = { tank: 'ward', buffs: 'aim', dps: 'heat', heals: 'love' };
  MP.HIVE_WORDS = { ward: 'WARD (1d6 off each blow, the special used, till their next turn)', aim: 'AIM (1d6 to land the next special)', heat: 'HEAT (1d6 on the next special\'s damage)', love: 'LOVE (1d6 temporary hit points)' };
  function mates(B, u) { return B.units.filter(function (w) { return w.cls === 'mpmon' && w.side === u.side && standing(w); }); }
  MP.hiveGive = function (B, giver) {
    var kind = MP.HIVE[giver.mpSub]; if (!kind) return;
    var ms = mates(B, giver), got = [];
    ms.forEach(function (w) {
      if (kind === 'love') { var r = D.d(6); if (r > (w.temp || 0)) { w.temp = r; got.push(w.name + ' ' + r); } return; }
      var h = w.conds.hive = w.conds.hive || {}; if (!h[kind]) { h[kind] = true; got.push(w.name); }
    });
    if (!got.length) return;
    ms.forEach(function (w) { FX.sparkle(w, 'gold', 14); });
    B.card(['{y}THE HIVEMIND{/} cheers ' + giver.name + ': ' + MP.HIVE_WORDS[kind] + '  {g}-> ' + got.join(', ') + '{/}'], 280);
  };
  function hivemind(B) {
    if (!B || !B.units || B.mpHive === B.round) return;
    B.mpHive = B.round;
    B.units.filter(function (w) { return w.cls === 'mpmon' && (w.lvl || 1) >= 9 && standing(w) && RU.canAct(w); }).forEach(function (w) { MP.hiveGive(B, w); });
  }
  // the special that is running: its user, and the aim and the heat it took (opened by spend(), the special's own first step; closed by the wrap below)
  MP.cur = null;
  MP.hiveSpend = function (u) {
    var h = u.conds && u.conds.hive; MP.cur = { u: u, aim: 0, heat: 0 };
    if (h && h.ward) { delete h.ward; u.conds.hiveWard = { till: { who: u.id, at: 'start', n: 1 }, endText: '{who}\'s ward lets go.' }; FX.ring(u, 'silver', 22); }
  };
  ['taunt', 'denim', 'cannonball', 'hug', 'bubble', 'gaze', 'screen', 'spotlight', 'sharing', 'flame', 'distancing', 'viral', 'heart', 'group', 'fountain', 'lifeline'].forEach(function (k) {
    var f0 = MP[k]; if (!f0) return;
    MP[k] = function* () { var was = MP.cur; try { return yield* f0.apply(this, arguments); } finally { MP.cur = was; } };
  });
  function aimOf(cur) { var h = cur.u.conds.hive; if (!cur.aim && h && h.aim) { delete h.aim; cur.aim = D.d(6); } return cur.aim; }
  function heatOf(cur) { var h = cur.u.conds.hive; if (!cur.heat && h && h.heat) { delete h.heat; cur.heat = D.d(6); return cur.heat; } return 0; }
  // the aim: a save against the special takes it off (its DC up by it); an attack roll in the special takes it on
  var saveH = RU.save; RU.save = function (w, ab, dc) {
    var c = MP.cur;
    if (c && w && w !== c.u && G.hostile(c.u, w) && c.u.conds && (c.aim || (c.u.conds.hive && c.u.conds.hive.aim))) { var a = Array.prototype.slice.call(arguments); a[2] = dc + aimOf(c); return saveH.apply(this, a); }
    return saveH.apply(this, arguments);
  };
  var attackH = D.Battle.prototype.attack;
  D.Battle.prototype.attack = function* (att, tgt, atk) {
    var c = MP.cur;
    if (c && att === c.u && atk && (c.aim || (att.conds.hive && att.conds.hive.aim))) { var a = Array.prototype.slice.call(arguments); a[2] = Object.assign({}, atk, { atk: (atk.atk || 0) + aimOf(c) }); return yield* attackH.apply(this, a); }
    return yield* attackH.apply(this, arguments);
  };
  // the heat: the special's first damage roll -- its own, or its user's blow in it (not a readied foe's, nor a reaction's)
  var roll0 = D.roll; D.roll = function (expr, o) {
    var r = roll0.apply(this, arguments), c = MP.cur;
    var sw = c && !c.heated ? swinger() : null;
    if (c && !c.heated && (!sw || sw === c.u)) { var n = heatOf(c); if (n) { c.heated = true; r = { total: r.total + n, rolls: r.rolls.concat([n]), mod: r.mod }; } }
    return r;
  };
  // the ward: 1d6 off every blow on it till its next turn
  var hurtH = D.Battle.prototype.hurt;
  D.Battle.prototype.hurt = function (u, n) {
    if (u && u.conds && u.conds.hiveWard && n > 0) { var r = D.d(6), a = Array.prototype.slice.call(arguments); a[1] = Math.max(0, n - r); if (FX.float) FX.float('ward -' + r, u, D.PAL.ramps.silver[5]); return hurtH.apply(this, a); }
    return hurtH.apply(this, arguments);
  };
  // both at a turn's start (js/grimoire.js M.onStart, every creature's): the round's Hivemind once, and the hug's squeeze on its own turn
  var onStart0 = M.onStart; M.onStart = function (B, u) {
    if (onStart0) onStart0.apply(this, arguments);
    if (B) hivemind(B);
    if (B && u && u.cls === 'mpmon' && (u.holding || []).length) squeeze(B, u);
  };

  // ------------------------------------------------------------------ the AI's hand (js/tactics.js: TX.FIRST before the action, TX.ACTIONS among its plans, TX.AFTER after it)
  function reachFor(B, u, t, ft) { // here, or a walk that brings t within ft: { e } (e null: from where it stands), or null
    if (G.dist(u, t) <= ft) return { e: null };
    if (!u.turn.move || u.conds.restrained || u.conds.grappled) return null;
    var e = AI.approach(u, t, G.reach(u, u.turn.move), ft); return e ? { e: e } : null;
  }
  function* go(B, u, r) { if (r && r.e) yield* AI.walkTo(B, u, r.e); }
  function wpAvg(u) { var w = u.weapon || {}; return TX.avg(w.dice || '0') + (w.mod || 0); }
  function swingWorth(u, t) { var p = TX.pHit(u.weapon.atk, RU.ac(t), 0); return { p: p, any: 1 - Math.pow(1 - p, u.attacksBase || 1), dmg: p * wpAvg(u) * (u.attacksBase || 1) }; }
  function nearFriends(B, u, w, ft) { return B.units.some(function (a) { return a.side === u.side && a !== u && standing(a) && G.dist(a, w) <= ft; }); }
  // the specials that are actions
  TX.ACTIONS.push(function (B, u, fs) {
    var T = u.turn;
    if (u.cls !== 'mpmon' || MP.left(u) <= 0 || !T.action || T.attacksLeft || u.conds.incapacitated) return null;
    var plans = [], reach = G.reachOf(u);
    if (u.mpSub === 'tank') {
      fs.forEach(function (t) {
        var r = reachFor(B, u, t, reach); if (!r) return;
        var s = swingWorth(u, t), denim = s.any * TX.avg(MP.denimDice(u.lvl));
        plans.push({ kind: 'special', why: 'DENIM DAMAGE at ' + t.name, score: TX.worth(s.dmg + denim, t) + 0.5, go: function* () { yield* go(B, u, r); if (standing(t) && G.dist(u, t) <= reach && u.turn.action) yield* MP.denim(B, u, t); } });
        // the hug: a foe that hits hard held to him and squeezed -- worth its blows turned from his friends, and the squeeze, a round or two
        if (u.lvl >= 7 && (t.size || 1) <= MP.hugSize(u.lvl) && !t.conds.restrained && !RU.immuneTo(t, 'grappled') && !(u.holding || []).length) {
          var pf = TX.pFail(t, 'str', MP.tauntDC(u)), sq = TX.avg(MP.hugDice(u.lvl)) + Math.max(0, mod(u.abil.str));
          plans.push({ kind: 'special', why: 'LOBSTAH HUG on ' + t.name, score: pf * (TX.dpr(t) * 1.5 + TX.worth(sq * 2, t)), go: function* () { yield* go(B, u, r); if (standing(t) && G.dist(u, t) <= reach && u.turn.action) yield* MP.hug(B, u, t); } });
        }
      });
      if (u.lvl >= 5) MP.leapTargets(B, u).forEach(function (t) {
        var q = MP.landings(B, u, t)[0], cat = beside(B, u, q[0], q[1]), d = TX.avg(MP.cannonDice(u.lvl)), dc = MP.tauntDC(u), v = 0;
        cat.forEach(function (w) { var pf = TX.pFail(w, 'dex', dc); v += TX.worth(pf * d + (1 - pf) * d / 2, w) + pf * TX.dpr(w) * 0.3; });
        plans.push({ kind: 'special', why: 'CANNONBALL by ' + t.name + ' (' + cat.length + ')', score: v + TX.worth(TX.pHit(u.weapon.atk, RU.ac(t), 1) * wpAvg(u), t), go: function* () { yield* MP.cannonball(B, u, t); } });
      });
    }
    if (u.mpSub === 'buffs') {
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
      // the spotlight: the friends who hit hardest, Hasted a turn
      if (u.lvl >= 7 && fs.length) {
        var sp = MP.spotTargets(B, u).sort(function (a, b) { return TX.dpr(b) - TX.dpr(a); }).slice(0, MP.spotN(u.lvl));
        if (sp.length) plans.push({ kind: 'special', why: 'SPOTLIGHT on ' + sp.map(function (w) { return w.name; }).join(', '), score: sp.reduce(function (s, w) { return s + TX.dpr(w) * 0.8 + 1; }, 0), go: function* () { yield* MP.spotlight(B, u, sp); } });
      }
    }
    if (u.mpSub === 'dps') {
      var dcR = u.spellDC, bolt = (TX.avg('1d10') * (u.lvl >= 5 ? 2 : 1) + (u.lvl >= 3 ? Math.max(0, mod(u.abil.cha)) : 0)) * 0.6; // (about what his Fire Bolt does in a turn: a special has to beat it)
      // Social Flame: the ball that catches the most foes and the fewest friends
      MP.flameTargets(B, u).forEach(function (t) {
        var c = MP.flameCatch(B, u, t), d = TX.avg(MP.flameDice(u.lvl)), v = 0, nf = 0;
        c.all.forEach(function (w) { var pf = TX.pFail(w, 'dex', dcR), dmg = pf * d + (1 - pf) * d / 2; if (G.hostile(u, w)) { v += TX.worth(dmg, w); nf++; } else v -= TX.worth(dmg, w) * 1.5; });
        if (nf >= 2 || (nf === 1 && v > bolt * 1.5)) plans.push({ kind: 'special', why: 'SOCIAL FLAME at ' + t.name + ' (' + nf + ')', score: v, go: function* () { yield* MP.flame(B, u, t); } });
      });
      // Social Distancing: the ring round him cleared, dearer the more are on him
      if (u.lvl >= 5) {
        var dcz = MP.distCatch(B, u), dd = TX.avg(MP.distDice(u.lvl)), vz = 0;
        dcz.foes.forEach(function (w) { var pf = TX.pFail(w, 'wis', dcR); vz += TX.worth(pf * dd + (1 - pf) * dd / 2, w) + (RU.immuneTo(w, 'frightened', u) ? pf * TX.dpr(w) * 0.6 : pf * TX.dpr(w) * 1.2); });
        if (dcz.foes.length) plans.push({ kind: 'special', why: 'SOCIAL DISTANCING (' + dcz.foes.length + ' beside him)', score: vz, go: function* () { yield* MP.distancing(B, u); } });
      }
      // Going Viral: the chain that catches the most
      if (u.lvl >= 7) MP.viralTargets(B, u).forEach(function (t) {
        var ch = MP.viralChain(B, u, t), d = TX.avg(MP.viralDice(u.lvl)), v = 0;
        ch.forEach(function (w) { var pf = TX.pFail(w, 'dex', dcR); v += TX.worth(pf * d + (1 - pf) * d / 2, w); });
        if (ch.length >= 2 || v > bolt * 1.5) plans.push({ kind: 'special', why: 'GOING VIRAL at ' + t.name + ' (' + ch.length + ')', score: v, go: function* () { yield* MP.viral(B, u, t); } });
      });
    }
    if (u.mpSub === 'heals') {
      // a heal's worth by the class AI's own measure (js/tactics.js TX.healNeed: the down first, then the worst under half), as Cure Wounds is weighed
      var big = MP.bigHeart(u), wm = mod(u.abil.wis);
      var healWorth = function (w, amt) { var need = TX.healNeed(B, u, w); return need ? Math.min(amt, w.maxhp - Math.max(0, w.hp)) * need + (w.hp <= 0 ? TX.dpr(w) * 2 : 0) : 0; };
      // the group hug: two or more round him wanting it
      var ga = TX.avg(MP.groupDice(u.lvl)) + wm + big, gv = 0, gn = 0;
      MP.groupCatch(B, u).forEach(function (w) { var v = healWorth(w, ga); if (v > 0) { gn++; gv += v; } });
      if (gn >= 2) plans.push({ kind: 'special', why: 'GROUP HUG (' + gn + ')', score: gv, go: function* () { yield* MP.group(B, u); } });
      // the fountain: an ailment ended is worth what it keeps off the one it held (paralysis most), and the healing on top
      if (u.lvl >= 5) {
        var fa = TX.avg(MP.fountDice(u.lvl)) + big, fv = 0, fn = 0;
        MP.fountCatch(B, u).forEach(function (w) {
          var ail = M.ailments(w)[0], v = healWorth(w, fa);
          if (ail) v += (/paralys/.test(ail.label) ? 3 : /blind/.test(ail.label) ? 1.2 : /poison|disease/.test(ail.label) ? 0.8 : 0.3) * Math.max(4, TX.dpr(w));
          if (v > 0) { fn++; fv += v; }
        });
        if (fn && (fn >= 2 || fv > ga * 2)) plans.push({ kind: 'special', why: 'FOUNTAIN (' + fn + ')', score: fv, go: function* () { yield* MP.fountain(B, u); } });
      }
      // the lifeline: the friend the foes are on, low, tied to one who can take it -- the Tank above half, else the friend with the most to spare, else him
      if (u.lvl >= 7 && !B.units.some(function (w) { return w.conds.lifeline && w.conds.lifeline.by === u.id; })) {
        var lts = MP.lifeTargets(B, u), press = function (w) { return B.units.filter(function (f) { return G.hostile(u, f) && standing(f) && G.dist(w, f) <= 10; }).reduce(function (s, f) { return s + TX.dpr(f); }, 0); };
        var lb = lts.filter(function (w) { return w.hp < w.maxhp * 0.6 && press(w) > 0; }).sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; })[0];
        if (lb) {
          var lr = lts.filter(function (w) { return w !== lb && w.mpSub === 'tank' && w.hp > w.maxhp / 2; })[0] || lts.filter(function (w) { return w !== lb && w.hp > lb.hp * 2 && w.hp > 10; }).sort(function (a, b) { return b.hp - a.hp; })[0] || (lb !== u && u.hp > lb.hp ? u : null);
          if (lr) plans.push({ kind: 'special', why: 'LIFELINE: ' + lb.name + ' to ' + lr.name, score: press(lb) * 1.2, go: function* () { yield* MP.lifeline(B, u, lb, lr); } });
        }
      }
    }
    return plans;
  });
  // the bonus actions before the action: the bubble, else the eye on a foe her friends are on (Beholda); the taunt (Denny); the sharing (Rascal). The taunt is
  // kept back while it is his last special and there is no foe on a friend
  function tauntWorth(B, u) { var tl = MP.tauntList(B, u), onF = tl.filter(function (w) { return nearFriends(B, u, w, 10); }); return MP.left(u) > 0 && onF.length > 0 && (tl.length >= 2 || MP.left(u) >= 2); }
  function eyeMark(B, u) { return MP.eyeTargets(B, u).filter(function (w) { return !w.conds.helped && nearFriends(B, u, w, 5); }).sort(function (a, b) { return b.hp - a.hp; })[0]; }
  // Goose's honk: the foe near a friend of his that hits hardest
  function honkMark(B, u) { return MP.honkTargets(B, u).filter(function (w) { return nearFriends(B, u, w, 10) || G.dist(u, w) <= 10; }).sort(function (a, b) { return TX.dpr(b) - TX.dpr(a); })[0]; }
  // Goose's heart to heart: the one who needs it most (the down first), unless his last special is better kept for a group hug two or more want
  function heartFor(B, u) {
    if (MP.left(u) <= 0) return null;
    var t = MP.heartTargets(B, u).map(function (w) { return { w: w, need: TX.healNeed(B, u, w) }; }).filter(function (e) { return e.need >= 1; }).sort(function (a, b) { return b.need - a.need || a.w.hp / a.w.maxhp - b.w.hp / b.w.maxhp; })[0];
    if (!t) return null;
    var want = MP.groupCatch(B, u).filter(function (w) { return TX.healNeed(B, u, w) >= 1; }).length;
    return MP.left(u) === 1 && want >= 2 && t.w.hp > 0 ? null : t.w;
  }
  TX.FIRST.push(function* (B, u) {
    var T = u.turn;
    if (u.cls !== 'mpmon' || !T.bonus || u.conds.incapacitated) return;
    if (u.mpSub === 'heals') {
      var ht = heartFor(B, u); if (ht) { yield* MP.heart(B, u, ht); return; }
      var hk = u.lvl >= 2 && honkMark(B, u); if (hk) yield* MP.honk(B, u, hk);
      return;
    }
    if (u.mpSub === 'buffs') {
      if (MP.left(u) > 0 && !u.conds.vnaBubble) {
        var r = MP.bubbleR(u.lvl), inside = B.units.filter(function (w) { return w.side === u.side && standing(w) && (w === u || G.dist(u, w) <= r); });
        var pressed = inside.some(function (w) { return B.units.some(function (f) { return G.hostile(u, f) && standing(f) && G.dist(w, f) <= 30; }); });
        if (inside.length >= 2 && pressed && !(MP.left(u) === 1 && MP.gazeTargets(B, u).length)) { yield* MP.bubble(B, u); return; }
      }
      var em = u.lvl >= 2 && eyeMark(B, u); if (em) yield* MP.eyeOnIt(B, u, em);
      return;
    }
    if (u.mpSub === 'tank') { if (tauntWorth(B, u)) yield* MP.taunt(B, u); return; }
    if (u.mpSub === 'dps' && MP.left(u) > 0) {
      var sh = MP.shareTargets(B, u);
      if (sh.length >= Math.min(2, MP.shareN(u.lvl)) && (MP.left(u) >= 2 || !MP.flameTargets(B, u).length)) yield* MP.sharing(B, u);
    }
  });
  // the bonus actions after it: the taunt he walked into reach of, else the flurry (Denny); the scuttle off a foe beside him (Rascal); the eye (Beholda)
  TX.AFTER.push(function* (B, u) {
    var T = u.turn;
    if (u.cls !== 'mpmon' || !T.bonus || u.conds.incapacitated || u.dead || u.hp <= 0) return;
    if (u.mpSub === 'tank') {
      if (tauntWorth(B, u)) { yield* MP.taunt(B, u); return; }
      if (MP.flurryOK(u)) { var ft = MP.inReach(B, u).sort(function (a, b) { return a.hp - b.hp; })[0]; if (ft) yield* MP.flurry(B, u, ft); }
      return;
    }
    if (u.mpSub === 'dps' && u.lvl >= 2 && MP.foes(B, u, 5).length && T.move >= 10 && !u.conds.restrained) { T.bonus = 0; T.disengaged = true; B.card(['{y}' + u.name + '{/} SCUTTLES: disengages, sideways like a lobster.'], 160); yield 8; return; }
    if (u.mpSub === 'buffs' && u.lvl >= 2) { var em = eyeMark(B, u); if (em) yield* MP.eyeOnIt(B, u, em); }
    if (u.mpSub === 'heals') { var ht = heartFor(B, u); if (ht) { yield* MP.heart(B, u, ht); return; } var hk = u.lvl >= 2 && honkMark(B, u); if (hk) yield* MP.honk(B, u, hk); }
  });

  // ------------------------------------------------------------------ the player's buttons (the ring's SKILLS: js/features.js F.commands / F.exec, wrapped as familiar.js does).
  // Aimed as spells are (10-06 night, Griz: "the abilities weren't using the normal targeting - it had the menu popups again"): `aim` is the geometry js/ui.js
  // aimCommand hands the spell aim -- the cursor, the reach or the area on the floor, the click -- and the click comes back here as { do, target }
  var cmd0 = F.commands, exec0 = F.exec;
  function foeAim(ft, see, kind) { return { shape: 'single', side: 'foe', range: ft, see: !!see, kind: kind || 'save' }; }
  F.commands = function (B, u) {
    var out = cmd0(B, u);
    if (u.cls !== 'mpmon' || u.side !== 'party' || u.guest) return out;
    var T = u.turn, L = u.lvl, act = T.action > 0 && !T.attacksLeft, bon = T.bonus > 0, n = MP.left(u), none = 'no specials left (a short rest brings them back)';
    var whyA = function (list, nobody) { return n <= 0 ? none : !act ? 'the action is spent' : list && !list.length ? nobody : ''; };
    var whyB = function (list, nobody, free) { return !free && n <= 0 ? none : !bon ? 'the bonus action is spent' : list && !list.length ? nobody : ''; };
    function add(id, label, cost, icon, why, note, aim, aimText) { out.push({ id: id, label: label, cost: cost, icon: icon, skill: true, ok: !why, why: why, note: note, aim: aim || null, aimText: aimText || null }); }
    if (u.mpSub === 'tank') {
      var rch = MP.inReach(B, u), tl = MP.tauntList(B, u), rr = G.reachOf(u);
      add('mp-taunt', 'TAUNT', 'B', 'surge', whyB(tl, 'no foe within ' + MP.tauntR(L) + ' ft to hear it'), 'the ' + MP.tauntN(L) + ' nearest foes within ' + MP.tauntR(L) + ' ft: WIS DC ' + MP.tauntDC(u) + ' or they may go only at you, till their turn ends; ' + leftText(u));
      add('mp-denim', 'DENIM DAMAGE', 'A', 'attack', whyA(rch, 'no foe in reach'), 'your swings, +' + MP.denimDice(L) + ' on the first that lands (doubled on a critical)' + (MP.denimPush(L) ? '; it knocks that one ' + MP.denimPush(L) + ' ft back' : '') + '; ' + leftText(u), foeAim(rr, false, 'attack'), 'a foe in your reach');
      if (L >= 2) add('mp-flurry', 'MONKEY FLURRY', 'B', 'attack', !T.attackAction ? 'after you take the Attack action' : whyB(rch, 'no foe in reach', true), 'one more punch, free: a bonus action after the Attack action', foeAim(rr, false, 'attack'), 'a foe in your reach');
      if (L >= 5) { var lt = MP.leapTargets(B, u); add('mp-cannonball', 'CANNONBALL', 'A', 'dash', whyA(lt, 'no foe within a ' + MP.leap(L) + '-ft leap'), 'leap up to ' + MP.leap(L) + ' ft beside a foe: each foe beside you DEX DC ' + MP.tauntDC(u) + ' or ' + MP.cannonDice(L) + ' and prone (half on a save), then a swing; ' + leftText(u), foeAim(MP.leap(L) + 5, true), 'the foe to come down beside'); }
      if (L >= 7) { var ht = MP.hugTargets(B, u); add('mp-hug', 'LOBSTAH HUG', 'A', 'surge', whyA(ht, 'no foe beside you to hold'), 'a foe beside you, ' + (MP.hugSize(L) > 2 ? 'Huge' : 'Large') + ' or smaller: STR DC ' + MP.tauntDC(u) + ' or HELD -- squeezed for ' + MP.hugDice(L) + '+STR each of your turns, and it may go only at you; ' + leftText(u), foeAim(rr), 'a foe beside you to hold'); }
    }
    if (u.mpSub === 'buffs') {
      add('mp-bubble', 'VNA BUBBLE', 'B', 'sacred', n <= 0 ? none : u.conds.vnaBubble ? 'the bubble is up' : !bon ? 'the bonus action is spent' : '', '+' + MP.bubbleAC(L) + ' AC to you and friends within ' + MP.bubbleR(L) + ' ft till your next turn (pops if you are stunned); ' + leftText(u));
      if (L >= 2) { var et = MP.eyeTargets(B, u); add('mp-eye', 'EYE ON IT', 'B', 'sacred', whyB(et, 'no foe you see within 30 ft', true), 'a foe you see within 30 ft: the next swing your side makes at it has advantage (free: a bonus action)', foeAim(30, true, 'buff'), 'a foe you see within 30 ft'); }
      var gz = MP.gazeTargets(B, u);
      add('mp-gaze', 'BALEFUL GAZE', 'A', 'sacred', whyA(gz, 'no foe you see within ' + MP.gazeRange(L) + ' ft'), 'one within ' + MP.gazeRange(L) + ' ft: WIS DC ' + u.spellDC + ' or ' + MP.gazeDice(L) + ' psychic and DOMINATED (it turns on its own side next turn); half on a save; ' + leftText(u), foeAim(MP.gazeRange(L), true), 'a foe you see within ' + MP.gazeRange(L) + ' ft');
      if (L >= 5) { var sc = MP.screenTargets(B, u); add('mp-screen', 'THE BIG SCREEN', 'A', 'sacred', whyA(sc, 'no foe you see within ' + MP.screenLen(L) + ' ft'), 'a ' + MP.screenLen(L) + '-ft cone: each foe in it WIS DC ' + u.spellDC + ' or ' + MP.screenDice(L) + ' psychic and DOMINATED; half on a save; ' + leftText(u), { shape: 'cone', len: MP.screenLen(L), kind: 'save', el: 'psychic' }, 'a ' + MP.screenLen(L) + '-ft cone'); }
      if (L >= 7) { var st = MP.spotTargets(B, u); add('mp-spotlight', 'SPOTLIGHT', 'A', 'sacred', whyA(st, 'no friend you see within ' + MP.spotR(L) + ' ft'), (MP.spotN(L) > 1 ? MP.spotN(L) + ' friends' : 'a friend') + ' you see within ' + MP.spotR(L) + ' ft: HASTED till the end of their next turn (+2 AC, double speed, an attack more), no lethargy after; ' + leftText(u), { shape: 'allies', side: 'ally', range: MP.spotR(L), n: MP.spotN(L), see: true, kind: 'buff' }, (MP.spotN(L) > 1 ? MP.spotN(L) + ' friends' : 'a friend') + ' within ' + MP.spotR(L) + ' ft'); }
    }
    if (u.mpSub === 'dps') {
      var sh = MP.shareable(B, u);
      add('mp-sharing', 'SOCIAL SHARING', 'B', 'sacred', whyB(sh, 'no friend within 30 ft without a die'), 'the hat comes off, a bow: ' + (MP.shareN(L) > 1 ? 'up to ' + MP.shareN(L) + ' friends' : 'a friend') + ' within 30 ft each get a ' + MP.shareDie(L) + ' for a roll that needs it; ' + leftText(u), { shape: 'allies', side: 'ally', range: 30, n: MP.shareN(L), kind: 'buff' }, (MP.shareN(L) > 1 ? 'up to ' + MP.shareN(L) + ' friends' : 'a friend') + ' within 30 ft');
      var fl = MP.flameTargets(B, u);
      add('mp-flame', 'SOCIAL FLAME', 'A', 'attack', whyA(fl, 'no foe you see within 60 ft'), 'a ball of fire at a point within 60 ft, ' + MP.flameR(L) + ' ft round: everyone in it (friends too) DEX DC ' + u.spellDC + ' or ' + MP.flameDice(L) + ' fire, half on a save; ' + leftText(u), { shape: 'sphere', range: 60, r: MP.flameR(L), see: true, kind: 'save', el: 'fire' }, 'a point within 60 ft (' + MP.flameR(L) + ' ft round it burns)');
      if (L >= 5) { var dz = MP.distCatch(B, u).foes; add('mp-distancing', 'SOCIAL DISTANCING', 'A', 'surge', whyA(dz, 'no foe within ' + MP.distR(L) + ' ft of you'), 'everyone within ' + MP.distR(L) + ' ft of you: WIS DC ' + u.spellDC + ' or ' + MP.distDice(L) + ' psychic, SHOVED out of the ring and FRIGHTENED of you till its turn ends; half on a save; ' + leftText(u)); }
      if (L >= 7) { var vt = MP.viralTargets(B, u); add('mp-viral', 'GOING VIRAL', 'A', 'attack', whyA(vt, 'no foe you see within 120 ft'), 'fire that spreads foe to foe (' + MP.viralN(L) + ' of them, each within 30 ft of the last): DEX DC ' + u.spellDC + ' or ' + MP.viralDice(L) + ' fire, half on a save; ' + leftText(u), foeAim(120, true), 'the first foe it catches, within 120 ft'); }
      if (L >= 2) {
        var sw = !bon ? 'the bonus action is spent' : '';
        add('cdash', 'SCUTTLE: DASH', 'B', 'dash', sw || (u.conds.restrained ? 'held fast' : ''), 'a bonus action: your speed again (the rogue\'s Cunning Action)');
        add('cdisengage', 'SCUTTLE: DISENGAGE', 'B', 'dash', sw, 'a bonus action: leaving reach provokes nothing this turn');
        add('hide', 'SCUTTLE: HIDE', 'B', 'dash', sw, 'a bonus action: try to hide');
      }
    }
    if (u.mpSub === 'heals') {
      var bigT = L >= 3 ? ' + ' + L + ' (big heart)' : '', hh = MP.heartTargets(B, u);
      add('mp-heart', 'HEART TO HEART', 'B', 'sacred', whyB(hh, 'no one hurt within ' + MP.heartR(L) + ' ft'), 'a friend you see within ' + MP.heartR(L) + ' ft, or you: ' + MP.heartDice(L) + ' + WIS' + bigT + ' back, up again if down; ' + leftText(u), { shape: 'single', side: 'ally', range: MP.heartR(L), kind: 'buff' }, 'a friend within ' + MP.heartR(L) + ' ft, or you');
      if (L >= 2) { var hk = MP.honkTargets(B, u); add('mp-honk', 'HONK', 'B', 'surge', whyB(hk, 'no foe within 30 ft that can hear you', true), 'a foe within 30 ft: its next swing at disadvantage (free: a bonus action)', foeAim(30, false, 'buff'), 'a foe within 30 ft'); }
      var gc = MP.groupCatch(B, u);
      add('mp-group', 'GROUP HUG', 'A', 'sacred', whyA(gc, 'no one hurt within ' + MP.groupR(L) + ' ft of you'), 'everyone within ' + MP.groupR(L) + ' ft of you, you too: ' + MP.groupDice(L) + ' + WIS' + bigT + ' each, the down back up; ' + leftText(u));
      if (L >= 5) { var fc = MP.fountCatch(B, u); add('mp-fountain', 'FOUNTAIN', 'A', 'sacred', whyA(fc, 'no one within ' + MP.fountR(L) + ' ft needs it'), 'everyone within ' + MP.fountR(L) + ' ft, you too: the worst of paralysis, blindness, poison or deafness ended, and ' + MP.fountDice(L) + bigT + ' back; ' + leftText(u)); }
      if (L >= 7) { var lf = MP.lifeTargets(B, u); add('mp-lifeline', 'LIFELINE', 'A', 'sacred', whyA(lf.length >= 2 ? lf : [], 'no friend within ' + MP.lifeR(L) + ' ft to tie'), 'tie a friend within ' + MP.lifeR(L) + ' ft to another, or to you: half of every blow on the first goes to the second, the fight long' + (MP.lifeWard(L) ? '; the first +1 AC and saves' : '') + '; ' + leftText(u), { shape: 'allies', side: 'ally', range: MP.lifeR(L), n: 2, see: true, kind: 'buff' }, 'the friend to tie, then who takes the half (one pick: you take it)'); }
    }
    return out;
  };
  F.exec = function* (B, u, c) {
    if (!/^mp-/.test(c.do || '')) { yield* exec0(B, u, c); return; }
    var t = c.target, L = u.lvl;
    function one(list) { return t ? (list.indexOf(t) >= 0 ? t : null) : list[0] || null; } // (the one the click took, if the special will take it; none clicked -- a bench, a pad -- the first)
    function pt(list) { return t && t.x != null && !t.side ? t : one(list); } // (a point on the floor, for an area)
    function nope(msg) { D.sfx('error'); B.card(['{o}' + msg + '{/}'], 160); }
    switch (c.do) {
      case 'mp-taunt': yield* MP.taunt(B, u); return;
      case 'mp-denim': t = one(MP.inReach(B, u)); if (t) yield* MP.denim(B, u, t); else nope('Denim Damage: a foe in your reach.'); return;
      case 'mp-flurry': t = one(MP.inReach(B, u)); if (t && MP.flurryOK(u)) yield* MP.flurry(B, u, t); else nope('Monkey Flurry: a foe in your reach, after the Attack action.'); return;
      case 'mp-cannonball': t = one(MP.leapTargets(B, u)); if (t) yield* MP.cannonball(B, u, t); else nope('Cannonball: a foe with room to come down beside it, within ' + MP.leap(L) + ' ft.'); return;
      case 'mp-hug': t = one(MP.hugTargets(B, u)); if (t) yield* MP.hug(B, u, t); else nope('Lobstah Hug: a foe beside you, ' + (MP.hugSize(L) > 2 ? 'Huge' : 'Large') + ' or smaller, not held already.'); return;
      case 'mp-bubble': yield* MP.bubble(B, u); return;
      case 'mp-eye': t = one(MP.eyeTargets(B, u)); if (t) yield* MP.eyeOnIt(B, u, t); else nope('Eye On It: a foe you see within 30 ft.'); return;
      case 'mp-gaze': t = one(MP.gazeTargets(B, u)); if (t) yield* MP.gaze(B, u, t); else nope('Baleful Gaze: a foe you see within ' + MP.gazeRange(L) + ' ft.'); return;
      case 'mp-screen': t = pt(MP.screenTargets(B, u)); if (t) yield* MP.screen(B, u, t); return;
      case 'mp-spotlight': yield* MP.spotlight(B, u, t && t.units); return;
      case 'mp-sharing': yield* MP.sharing(B, u, t && t.units); return;
      case 'mp-flame': t = pt(MP.flameTargets(B, u)); if (t) yield* MP.flame(B, u, t); return;
      case 'mp-distancing': yield* MP.distancing(B, u); return;
      case 'mp-viral': t = one(MP.viralTargets(B, u)); if (t) yield* MP.viral(B, u, t); else nope('Going Viral: a foe you see within 120 ft.'); return;
      case 'mp-heart': t = one(MP.heartTargets(B, u)); if (t) yield* MP.heart(B, u, t); else nope('Heart to Heart: a friend you see within ' + MP.heartR(L) + ' ft who is hurt, or you.'); return;
      case 'mp-honk': t = one(MP.honkTargets(B, u)); if (t) yield* MP.honk(B, u, t); else nope('Honk: a foe within 30 ft that can hear you.'); return;
      case 'mp-group': yield* MP.group(B, u); return;
      case 'mp-fountain': yield* MP.fountain(B, u); return;
      case 'mp-lifeline': { // (the picks in order: the one tied, then who takes the half; one pick, he takes it)
        var ok = MP.lifeTargets(B, u), lu = (t && t.units ? t.units : t && t.side ? [t] : []).filter(function (w) { return ok.indexOf(w) >= 0; });
        if (!lu.length) lu = ok.filter(function (w) { return w !== u; }).slice(0, 1);
        if (lu.length && (lu[1] || lu[0] !== u)) yield* MP.lifeline(B, u, lu[0], lu[1] || u); else nope('Lifeline: a friend to tie, then who takes the half (you, if only one).');
        return;
      }
    }
  };
  var line0 = F.classLine; F.classLine = function (u) {
    var s = line0.apply(this, arguments);
    if (u.cls !== 'mpmon') return s;
    var b = MP.BUILDS[u.mpmon], k = b ? MP.RACES[b.kind].name + ' ' + MP.SUBS[b.sub].name : '';
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
      // Goose's lifeline: a green thread between the one tied and the one it runs to, the heal's green
      (B.units || []).forEach(function (w) {
        var c = w.conds && w.conds.lifeline; if (!c || w.dead || !D.ui || !D.ui.unitPos) return;
        var to = (B.units || []).filter(function (x) { return x.id === c.to; })[0]; if (!to || to.dead) return;
        var p = D.ui.unitPos(B, w), q = D.ui.unitPos(B, to), t = B.t || 0;
        ctx.save(); ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t / 10); ctx.strokeStyle = D.PAL.ramps.orc[3]; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.lineDashOffset = -t / 4;
        ctx.beginPath(); ctx.moveTo(p.x, p.y - 6); ctx.lineTo(q.x, q.y - 6); ctx.stroke(); ctx.restore();
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
    PK.STOCK.splice(at < 0 ? PK.STOCK.length : at, 0, { w: 'denny', lo: 1, mascot: true }, { w: 'beholda', lo: 1, mascot: true }, { w: 'rascal', lo: 1, mascot: true }, { w: 'goose', lo: 1, mascot: true });
  }
  // LOCKED (RULED 10-06 night, Griz: "Easter Egg unlocks. i.e. 'make your own character the first time' = unlock denny ... All locked for now with a flag we can
  // switch so I can stream monster party monster fights with them"; the door "good for testing"): a mascot is off the roster till its egg gives it (the save's
  // `mascots`, { denny: true }: the eggs are to come) -- hidden, not greyed, so the egg is a surprise -- or the page's door `&mascots` opens all four
  MP.door = function () { try { return /[?&]mascots\b/.test(window.location.search || ''); } catch (e) { return false; } };
  MP.unlocked = function (st, w) { return MP.door() || !!(st && st.mascots && st.mascots[w]); };
  MP.unlock = function (st, w) { st.mascots = st.mascots || {}; var was = !!st.mascots[w]; st.mascots[w] = true; return !was; };
  if (PK && PK.entries) {
    var entries0 = PK.entries; PK.entries = function (st) {
      return entries0.apply(this, arguments).filter(function (e) { var s = e.kind === 'stock' && PK.STOCK.filter(function (x) { return x.w === e.w; })[0]; return !(s && s.mascot) || MP.unlocked(st, e.w); });
    };
  }
  if (PK && PK.shortRest) {
    var rest0 = PK.shortRest; PK.shortRest = function (c) {
      var r = rest0.apply(this, arguments);
      if (c && c.cls === 'mpmon') { var f = c.feats = c.feats || {}; if (!(f.specials >= MP.specialsAt(c.lvl))) r.text += '; the specials back'; MP.refill(c); }
      return r;
    };
  }
})();
