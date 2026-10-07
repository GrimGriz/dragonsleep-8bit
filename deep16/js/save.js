/* DEEP16 — the save crosses (proof 1). The 8-bit game and DEEP16 share an origin, so one localStorage: read the seam's
   snapshot (`deep16.handoff`, written by PAST THE DOOR in the credits), else the newest 8-bit slot (`ds8-save-1..3`),
   else a fixture (the four at level 9, the expansion's end-state). Read-only: DEEP16 writes only deep16.* keys.
   The 8-bit rules module (../js/rules.js) is loaded as-is for the character maths (AC, attack, saves, spell DC):
   the rules layer here is new, the data and the sheets are not. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS;
  DS.DATA = window.DS_DATA;
  DS.mod = function (s) { return Math.floor((s - 10) / 2); };
  DS.G = { flags: { lakeDone: 1 } }; // R.cap() reads it: past the door the cap is 9
  var R = DS.R;
  var SV = D.save = {};

  SV.slots = function () {
    var out = [];
    for (var i = 1; i <= 3; i++) { var d = D.store.get('ds8-save-' + i); if (d && d.party) out.push({ slot: i, data: d }); }
    return out;
  };

  // which party walks in, and from where
  SV.load = function () {
    var h = D.store.get('deep16.handoff');
    var slots = SV.slots().sort(function (a, b) { return (b.data.saved || 0) - (a.data.saved || 0); });
    // the door's snapshot, unless a slot has been saved since (the newer of the two walks in)
    if (h && h.save && h.save.party && (!slots.length || (h.at || 0) >= (slots[0].data.saved || 0))) return { from: 'the door', when: h.at, data: h.save };
    if (slots.length) return { from: 'slot ' + slots[0].slot, when: slots[0].data.saved, data: slots[0].data };
    return { from: 'the fixture', when: null, data: SV.fixture() };
  };

  // the four at a level (9 unless said): the 8-bit game's own levelling, its picks and features; the reward weapons
  // as the ladder's guess at when they come (+1 from 5, +2 at 9)
  // level 1 (the ladder's first rung; Griz 09-27: "might as well add level 1"): the 8-bit game starts the four at 2, so a
  // level-1 sheet is drawn back from it -- one max hit die plus CON (the level-2 starts are exactly two), the level-1 slot
  // table (the wizard's two first-level slots; the paladin none, so no Smite), no Action Surge, Lay on Hands 5
  SV.levelOne = function (h) {
    var c = R.CLASSES[h.cls];
    h.lvl = 1; h.xp = 0;
    h.maxhp = h.hp = Math.max(1, c.hd + DS.mod(h.abil.con));
    h.slotsMax = R.slotsFor(h); h.slots = h.slotsMax.slice();
    if (h.cls === 'fighter') h.feats.actionSurge = 0;
    if (h.cls === 'paladin') { h.feats.lay = 5; h.feats.channel = 0; }
    return h;
  };
  // o.bare: nothing cast that morning (the camp casts, js/camp.js)
  SV.fixture = function (level, o) {
    var L = level || 9, bare = !!(o && o.bare);
    var party = ['barley', 'aurdin', 'vivian', 'lymen'].map(function (id) {
      var h = L < DS.DATA.heroes[id].level ? SV.levelOne(R.makeHero(id)) : R.makeHero(id, L), d = DS.DATA.heroes[id], tier = L >= 9 ? 1 : L >= 5 ? 0 : -1;
      if (tier >= 0 && d.rewardWeapons && d.rewardWeapons[tier] && DS.DATA.items[d.rewardWeapons[tier]]) h.equip.weapon = d.rewardWeapons[tier];
      // the 8-bit sheet gives Barley no armour (a thresher: AC 11); the ladder dresses him (Griz, 09-27: "let's go with splint-mail")
      if (id === 'barley' && !h.equip.armor) h.equip.armor = 'splint';
      // Mage Armor cast that morning, and paid for: a 1st-level slot (Griz, 09-27: "cost for mage armor"; it was free)
      if (!bare && id === 'aurdin' && h.known.indexOf('mageArmor') >= 0 && h.slots && h.slots[0] > 0) { h.conds.mageArmor = 1; h.slots[0]--; }
      // Counterspell in his book on the ladders, from 5th (10-02, Griz: "give it to all of them on the ladders, that's a quest reward spell sheet for the game"):
      // the fixture only -- in the 8-bit game it is a sheet found and copied (SRD 5.1 wizard: 2 hours and 50 gp a spell level), not a level's gift
      if (id === 'aurdin' && L >= 5 && h.known && h.known.indexOf('counterspell') < 0) { h.known.push('counterspell'); if (h.prepared) h.prepared = SV.prepDefault(h); } // (and in his day: it went into the book after the day was made, so he never had it -- 10-05, Griz: "1 yes")
      return h;
    });
    // (and torches, since the dark: the 8-bit game's party buys its own at the Provisioner's, a silver each)
    var inv = L >= 9 ? [{ id: 'potion', n: 3 }, { id: 'greaterpotion', n: 1 }, { id: 'antitoxin', n: 1 }, { id: 'kit', n: 1 }, { id: 'oil', n: 2 }, { id: 'torch', n: 3 }]
      : L >= 5 ? [{ id: 'potion', n: 3 }, { id: 'antitoxin', n: 1 }, { id: 'oil', n: 1 }, { id: 'torch', n: 3 }] : [{ id: 'potion', n: 2 }, { id: 'torch', n: 2 }];
    return { party: party, guests: [], inv: SV.armoury(inv), flags: { lakeDone: 1, expansionDone: L >= 9 ? 1 : 0 }, fixture: true, level: L };
  };
  // a guest as the 8-bit game makes one (js/deep.js EV.guestSheet): a story fight's own `guests` on the grid's door and bench -- the Edifice's Pyro, 10-05 (battle.js enter)
  SV.guest = function (id) {
    var d = DS.DATA.heroes[id], h = R.makeHero(id, d.level);
    h.attacks = d.attacks; h.resist = d.resist; h.guest = true; h.surgeAI = !!d.surgeAI; h.script = d.script || null; h.key = id;
    if (d.healer) { h.healer = d.healer; h.feats.heals = d.healer; }
    if (d.vital) h.vital = true;
    return h;
  };
  // every pack DEEP16 fights with carries a light crossbow and twenty bolts (Griz, 09-27: "at least one crossbow/bolts in
  // the player inventory for all of deep16 modes"); the 8-bit save walking in is read, never written, so it's added here
  SV.armoury = function (inv) {
    // (the rope: the Rope & Grapple, set on a face -- 10-04, Griz: "convert 'hemp rope' into 'rope & grapple' ... and include in party gear"; battle.js exec 'rope')
    [['lightcrossbow', 1], ['bolts', 20], ['arrows', 20], ['rope', 1]].forEach(function (p) { // (arrows: a bow's, since bows take ammunition -- the SRD, 10-01c; a class hero's shortbow or longbow has its twenty)
      var s = inv.filter(function (x) { return x.id === p[0]; })[0];
      if (!s) inv.push({ id: p[0], n: p[1] }); else if (s.n < p[1]) s.n = p[1];
    });
    return inv;
  };
  // a hero's weapon as the grid reads it (the unit's, and again after a swap in the fight). A ranged weapon shoots out to
  // its long range; a loading one (the crossbow) fires once an action, Extra Attack or no; Great Weapon Fighting is melee only
  SV.weaponOf = function (h) {
    var w = R.weaponOf(h), dm = R.damageExpr(h, w), wd = w.weapon || {}, props = wd.props || [], ranged = props.indexOf('ranged') >= 0, bond = R.bonded(h, w.id);
    return {
      id: h.equip && h.equip.weapon, name: w.name, atk: R.attackBonus(h, w), dice: dm.dice, mod: dm.mod, type: dm.type, props: props, magic: !!(wd.bonus || wd.magic),
      finesse: props.indexOf('finesse') >= 0, gwf: !ranged && R.gwf(h, w), // (Great Weapon Fighting by the style, js/rules.js: 10-06; it was every fighter's)
      ranged: ranged, range: ranged ? (wd.range || [80, 320]) : null, ammo: wd.ammo || null, loading: props.indexOf('loading') >= 0, fx: 'bolt',
      // (the weapon's own magic works only for one bonded with it -- js/rules.js R.bonded, 10-06: a Flame Tongue unbonded is a longsword, a Mace of Disruption a mace)
      flame: bond ? wd.flame || null : null, // Flame Tongue: a bonus action lights it (battle.js IGNITE)
      // the 8-bit game's named weapons (09-28g, Griz: "make sure items are being loaded into the 16bit fights"): the Winnower's
      // critical knocks flat, the Greyseam knife's Sneak Attack poisons (battle.js attack, as the 8-bit battle.js heroAttack)
      onCrit: wd.onCrit || null, sneakPoison: wd.sneakPoison || 0,
      disrupt: bond ? wd.disrupt || null : null // the Mace of Disruption (SRD 5.1; Pyro's, 09-30): battle.js attack
    };
  };
  // the weapon in the other hand (Pyro's two maces, 09-30: equip.offhand), read as the main one is
  SV.offhandOf = function (h) { return h.equip && h.equip.offhand ? SV.weaponOf(Object.assign({}, h, { equip: Object.assign({}, h.equip, { weapon: h.equip.offhand }) })) : null; };

  // the heroes and guests as DEEP16 units: everything the grid needs, read off the 8-bit sheet
  SV.units = function (data, fight) {
    DS.G = { flags: data.flags || { lakeDone: 1 } };
    var out = [];
    (data.party || []).forEach(function (h) { out.push(unitOf(h, false, fight)); });
    // the guests fight by the class tactics (09-28, js/tactics.js: Pyro's Action Surge, Halldor's wound, Ingrith's spells laid over her
    // 8-bit sheet by js/classes.js NPC.overlay) -- guest()'s healer counter and surgeAI are retired on the grid
    // (a story guest carries one Oil Flask of its own -- u.ownFlask, thrown once a fight, never from the party's pack: 10-05, Griz: "mechanically allow once and have it not reduce party inventory";
    // battle.js itemList and useItem read it. Only these units carry it: the bench's and the watch's four are made guests by battle.js, not here, and throw from the pack)
    (data.guests || []).forEach(function (g) { var u = unitOf(g, true, fight); u.classAI = true; u.ownFlask = 1; if (D.npc) D.npc.overlay(u, g); if (g.vital) u.vital = true; out.push(u); }); // (vital: one whose fall ends the fight -- Corwen Dace; battle.js over, 10-01c)
    return out;
  };
  function unitOf(h, guest, fight) {
    var look = SV.look(h.id, fight), wp = SV.weaponOf(h);
    if (R.ward) R.ward(h); // (a condition a worn thing bars ends on the sheet before it is carried in: the Periapt of Proof against Poison on one already poisoned -- 10-07, js/rules.js R.ward)
    return {
      // (a guest by its 8-bit key: two troopers are two)
      id: h.key || h.id, name: look.name || h.name, cls: h.cls, lvl: h.lvl, guest: guest, side: 'party', sheet: look.sheet || h.id + '_p0',
      hp: h.ko ? 0 : h.hp, maxhp: h.maxhp, ko: !!h.ko, conds: JSON.parse(JSON.stringify(h.conds || {})),
      abil: h.abil, baseAC: R.ac(h), prof: R.prof(h.lvl), init: R.initBonus(h), speed: 30, size: 1, reach: 5,
      slots: (h.slots || []).slice(), slotsMax: (h.slotsMax || []).slice(), known: knownOf(h), armored: R.armored(h),
      feats: JSON.parse(JSON.stringify(h.feats || {})), subclass: h.subclass,
      displacement: SV.displaced(h), // a Cloak of Displacement (rules.js edges)
      resist: SV.wornLists(h, 'resist', h.resist), // (the 8-bit game's guests: Dwarven Resilience, poison halved; and a Ring of Resistance worn and bonded)
      immune: SV.wornLists(h, 'immune'), condImmune: SV.wornLists(h, 'condImmune'), // (the Periapt of Proof against Poison: battle.js Battle.typed, rules.js RU.immuneTo)
      offhand: SV.offhandOf(h), script: h.script || null, // (a named NPC's own turn: js/pyro.js, 09-30)
      weapon: wp, attacksBase: R.attacksPerTurn(h), attacks: wp.loading ? 1 : R.attacksPerTurn(h), crit: R.critRange(h), spellDC: R.spellDC(h), spellAtk: R.spellAtk(h),
      saves: { str: R.saveBonus(h, 'str'), dex: R.saveBonus(h, 'dex'), con: R.saveBonus(h, 'con'), int: R.saveBonus(h, 'int'), wis: R.saveBonus(h, 'wis'), cha: R.saveBonus(h, 'cha') },
      stealth: R.skill(h, 'Stealth', 'dex'), perception: 10 + R.skill(h, 'Perception', 'wis'), src: h,
      // what he sees the dark by (torchdark 09-28): his blood (the 8-bit sheet's race: Lymen the half-orc, the dwarves), or the
      // Darkvision spell cast on him that day (the 8-bit's conds, till the long rest)
      darkvision: Math.max(D.light ? D.light.raceDV((DS.DATA.heroes[h.id] || {}).race) : 0, h.conds && h.conds.darkvision ? 60 : 0),
      // his blood's Savage Attacks (battle.js attack: a melee critical rolls one more weapon die) and the fighting style he fights by (battle.js
      // reads 'protection'; the rest are in his numbers, js/rules.js) -- 10-06: the grid never gave Lymen his (Griz: "inconceivable!")
      savage: R.savage(h), style: R.style(h)
    };
  }
  SV.unitOf = unitOf; // (the class NPCs are made units the same way: js/classes.js)
  // (a Cloak of Displacement works only for one bonded with it -- js/rules.js R.bonded, 10-06; unbonded it is a cloak)
  SV.displaced = function (h) { var c = R.item(h.equip && h.equip.cloak); return !!(c && c.cloak && c.cloak.displacement && R.bonded(h, h.equip.cloak)); };
  // what the worn things give the unit (SRD 5.1; js/rules.js R.wornList: the Ring of Resistance's one type, the Periapt of Proof against Poison's immunity to poison
  // and to the poisoned condition -- bonded where they must be), laid over the sheet's own (a guest's resistances). null when nothing, as the grid reads it
  SV.wornLists = function (h, key, own) {
    var out = (own || []).slice(); R.wornList(h, key).forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });
    return out.length ? out : null;
  };
  // what a hero can cast in the fight: all he knows, or, once his day is prepared (h.prepared: the camp's, or the 8-bit
  // game's morning), his cantrips, the spells he prepared, and the ones his oath keeps ready. His book is his own everywhere
  // (RULED 09-27, Griz: Misty Step is "a spell he can learn"; the POC's loan of it to every wizard of 3rd level is gone):
  // what the 8-bit game's levelling gave him, or what he picked on the climb
  function knownOf(h) { return R.castable(h, 'battle', SV.spell); }

  // ---------------------------------------------------------------- the day's spells (SRD 5.1; Griz, 09-27: "spell prep should probably run
  // before each fight"). The law is the 8-bit game's (js/rules.js R.prepCount, R.prepPool, R.prepDefault, R.oathSpells), one
  // for both games since 09-28; these read it with the grid's spell lookup. Detect Magic is a ritual: never prepared, never
  // in the pool (it does nothing in a fight)
  SV.spell = function (id) { return window.DS.DATA.spells[id] || (D.EXTRA_SPELLS || {})[id]; };
  SV.PALADIN = R.PALADIN_SPELLS;
  SV.oath = function (h) { return R.oathSpells(h); };
  SV.prepCount = function (h) { return R.prepCount(h); };
  SV.prepPool = function (h) { return R.prepPool(h, SV.spell); };
  SV.rituals = function (h) { return R.ritualsOf(h, SV.spell); };
  SV.prepDefault = function (h) { return R.prepDefault(h, SV.spell); };
  // the POC's looks (RULED 09-27, Griz: "Denny should play as Barley but look like Denny for this POC"); the base art
  // is LPC (pipeline 0), Blender for special monsters (RULED 09-27: "Pipeline 0 is the way to go, maybe pipeline 1 for
  // special monsters or fights")
  // Barley is Barley again everywhere but the level-9 fight (Griz, 09-27: "put Barley back except in the lvl 9 fight"):
  // a fight may carry `looks` over these (data/fights.js, the Cocoon Gallery keeps Denny)
  SV.LOOK = { barley: { sheet: 'barley_p0' }, aurdin: { sheet: 'aurdin_p0' }, vivian: { sheet: 'vivian_p0' }, lymen: { sheet: 'lymen_p0' }, dace: { sheet: 'npcwizard_p0' } }; // (Corwen Dace, a guest: the class floor's wizard till he has a sheet of his own -- art someday, 10-01c)
  SV.look = function (id, fight) { return (fight && fight.looks && fight.looks[id]) || SV.LOOK[id] || {}; };
})();
