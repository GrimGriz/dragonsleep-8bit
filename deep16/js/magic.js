/* DEEP16 — spells on the grid. What each spell is comes from the 8-bit game's content/spells.json (level, dice, save,
   element) plus data/spells.js (range, shape, casting time, concentration). This file says what can be cast now (slots,
   the action and bonus action, the bonus-action-spell rule), which squares or creatures a shape takes, and what the
   spell does -- damage and saves, conditions (restrained, paralyzed, asleep, invisible), buffs, heals -- and holds
   concentration (a new concentration spell ends the old; damage asks a CON save, DC 10 or half the damage). */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx;
  var M = D.magic = {};
  var MAGIC = { magic: true }; // (B.hurt's fourth: a spell's damage is magical -- Stoneskin halves none of it; 10-03)

  M.data = function (id) { return (window.DS.DATA.spells[id]) || (D.EXTRA_SPELLS || {})[id]; };
  // house rules the seat proposes, each a switch (torchdark, 09-28): Magic Missile may be aimed at a square the caster cannot see
  // into -- "at the darkness" -- and its darts strike whatever stands there. OPEN for Griz's word (handoff 09-28 §3G)
  D.RULES = D.RULES || {}; if (D.RULES.missilesAtTheDark == null) D.RULES.missilesAtTheDark = true;
  if (D.RULES.enlargeReach == null) D.RULES.enlargeReach = false; // (Enlarge +5 ft reach: a house rule, not the SRD's -- off; js/grid.js G.reachOf, 09-29)
  // a square Magic Missile may be thrown at blind: open, in range and line, and one the caster cannot see into (dark, darkness, fog)
  M.missileDark = function (B, u, g, x, y) {
    if (!D.RULES.missilesAtTheDark || g.shape !== 'darts') return false;
    var s = G.map.at(x, y); if (!s || !s.open || !M.inRange(u, g, x, y)) return false;
    var v = M.seeWhy(B, u, { x: x, y: y, size: 1, conds: {} });
    return !v.ok && (v.why === 'dark' || v.why === 'darkness' || v.why === 'fog' || v.why === 'the cloud' || v.why === 'sleet');
  };
  // (`lvl`, the spell's own level -- a cantrip is 0 -- is stamped on its geometry the first time it is asked for, so that M.targetWhy, which is given only
  // the geometry, can put the Globe of Invulnerability the question: every copy made of it with Object.assign carries it. 10-01)
  // (`sid`, its own id, rides with it the same way: a spell used again -- Call Lightning's bolt, a swing of the Spiritual Weapon -- asks the globe from where it was FIRST cast,
  // and M.castOrigin, js/grimoire.js, finds that record by the id)
  M.geo = function (id) { var g = D.SPELLS[id]; if (!g) return { shape: 'none', why: 'not on the grid yet' }; if (g.lvl == null) { var sp = M.data(id); if (sp && sp.level != null) g.lvl = sp.level | 0; } if (g.sid == null) g.sid = id; return g; };
  M.slotLevels = function (u, lvl) { var out = []; for (var i = Math.max(1, lvl) - 1; i < (u.slots || []).length; i++) if (u.slots[i] > 0) out.push(i + 1); return out; };
  // the caster's spellcasting modifier: its class's ability (js/rules.js R.CLASSES cast: the cleric's WIS, the warlock's CHA), or a sheet's own
  M.mod = function (u) { var c = window.DS.R.CLASSES[u.cls]; return D.mod(u.abil[u.castAb || (c && c.cast) || 'int']); };
  function up(sp, slot) { return Math.max(0, (slot || sp.level) - sp.level); }
  M.dice = function (sp, u, slot) { // a cantrip grows with the caster's level; a slot above the spell's adds its dice
    var d = sp.dmg;
    if (sp.scale) Object.keys(sp.scale).forEach(function (lv) { if (u.lvl >= +lv) d = sp.scale[lv]; });
    if (sp.level === 0 && u.lvl >= 11 && d) d = d.replace(/^(\d+)d/, function (m, n) { return (+n + 1) + 'd'; });
    if (sp.upDice && up(sp, slot)) d = d.replace(/^(\d+)d/, function (m, n) { return (+n + sp.upDice * up(sp, slot)) + 'd'; });
    return d;
  };

  // ------------------------------------------------------------------ the list: every spell the hero knows, and whether it can be cast now
  var AIMED = { single: 1, attack: 1, rays: 1, splash: 1, allies: 1, touch: 1 }; // (the shapes that take a creature: the picker's, ui.js)
  M.list = function (B, u, o) { // (o.anyTarget: castable though nothing is there to aim at now -- a spell readied for one that comes into sight, battle.js exec 'ready', 10-02)
    var T = u.turn;
    return (u.known || []).map(function (id) {
      var sp = M.data(id), g = M.geo(id);
      if (!sp || (!sp.battle && !sp.grid && g.shape !== 'none')) return null; // (grid: a spell only DEEP16's fights can use, Misty Step)
      // not for a fight at all (Rope Trick, Tiny Hut, Detect Magic, Revivify where nobody dies, one not built): off the ring, not greyed
      // on it (Griz 09-28g: "no reason to have spells that aren't for a fight there"). A reaction (Shield) stays, greyed till it's asked
      if (g.shape === 'none') return null;
      var e = { id: id, name: sp.name, level: sp.level, g: g, sp: sp, levels: sp.level ? M.slotLevels(u, sp.level) : [0] };
      e.slot = e.levels[0] || sp.level;
      // Dancing Lights already up: casting it again is the SRD's bonus action that moves the lights (no new concentration)
      if (id === 'dancinglights' && u.conc && u.conc.id === 'dancinglights') e.g = g = Object.assign({}, g, { time: 'B', move: true });
      // a spell already up that is used again (js/grimoire.js geo: the floating weapon's swing, a mark moved): `free` spends no slot,
      // `move` is no new bonus-action spell
      var ex = M.EFFECT && M.EFFECT[id];
      if (ex && ex.geo) { var g2 = ex.geo(B, u, g); if (g2) { e.g = g = g2; if (g.again && ex.againName) e.name = ex.againName; } } // (the ring says what casting it again does: the swing, the beam moved -- 09-29)
      if (g.free) e.levels = [e.level];
      var why = '';
      // under a roost (the rescue in the dens), its one law: no fire, no thunder (the 8-bit game greys them too, RULED 09-24)
      if (B.fight && B.fight.roost && /fire|thunder/.test(sp.el || '')) why = 'the roost overhead: no fire, no thunder';
      else if (u.conds.feeble) why = 'the mind is gone (Feeblemind)';
      else if (g.shape === 'none' || g.shape === 'reaction') why = g.why;
      else if (sp.level && !e.levels.length) why = 'no slot of level ' + sp.level + ' or higher';
      else if (g.time === 'B' && !T.bonus) why = 'the bonus action is spent';
      else if (g.time === 'A' && (!T.action || T.attacksLeft)) why = 'the action is spent';
      else if (g.time === 'B' && !g.move && !g.again && T.spellAction === 'leveled') why = 'a levelled spell was cast this turn: no bonus-action spell too';
      else if (g.time === 'B' && !g.move && !g.again && T.bonusSpell) why = 'one bonus-action spell a turn';
      else if (g.time === 'A' && T.bonusSpell && sp.level && !g.again) why = 'after a bonus-action spell, only a cantrip'; // (a spell up and used again -- the beam moved, the next bolt, the weapon's swing -- is no casting: SRD 5.1 Moonbeam, 'you can use an action to move the beam'; the druid runner's find, 10-01c)
      else if (g.unarmored && !M.touchTargets(B, u, g).length) why = 'no one within reach without armour or Mage Armor'; // (greyed when all have it: Griz, 10-01)
      else if (id === 'seeinvisibility' && u.seeInvisible) why = 'already seeing the unseen';
      // a dancer (Irresistible Dance: "must use all its movement to dance without leaving its space") steps nowhere: not Misty Step, not
      // Dimension Door -- 10-01b, Griz, a lean: "lean no since the names of those spells both imply leg action (step - and stepping through
      // a door), but a straight teleport teleport I'd probably allow at the table" (Blink and Etherealness, the Ethereal, stay open)
      else if (u.conds.dancing && (id === 'mistystep' || id === 'dimensiondoor')) why = 'dancing in place: no stepping out of it';
      // a spell's own say (js/grimoire.js): nothing to cure, a ward already on, no metal to heat
      if (!why && ex && ex.list) { var r = ex.list(B, u, e); if (r && r.why) why = r.why; if (r && r.g) e.g = g = r.g; }
      // a spell that takes a creature, with no creature it may take (10-01b, Griz: "check for other targeting non-fails. I have a hold
      // person trying to find a target with only the clacker on the enemy team still standing"): greyed, and why, not a picker with
      // nothing in it -- the picker offers exactly what M.targetOK passes (ui.js). Magic Missile's darts may still go at the dark: not here
      if (!why && !(o && o.anyTarget) && AIMED[g.shape] && !B.units.some(function (w) { return M.targetOK(B, u, g, w); })) why = M.noTarget(B, u, g);
      e.ok = !why; e.why = why;
      return e;
    }).filter(Boolean).sort(function (a, b) { return a.level - b.level || (a.name < b.name ? -1 : 1); });
  };

  // a spell's grid summary, at the chosen slot: what the list and the ring say about it
  M.summary = function (e, u) {
    if (M.EFFECT && M.EFFECT[e.id] && M.EFFECT[e.id].summary) return M.EFFECT[e.id].summary(e, u, D.battle);
    var g = e.g, sp = e.sp, d = sp.dmg ? M.dice(sp, u, e.slot) : '', n = (g.n || 1) + Math.max(0, e.slot - e.level);
    var save = sp.save ? sp.save.toUpperCase() + (sp.half ? ' half' : '') : '', conc = g.conc ? ' · conc' : '';
    switch (g.shape) {
      case 'attack': return 'spell attack, ' + g.range + ' ft · ' + d + ' ' + sp.el;
      case 'rays': return n + ' rays, ' + g.range + ' ft · ' + sp.dmg + ' ' + sp.el + ' each';
      case 'darts': return n + ' darts, ' + g.range + ' ft · 1d4+1 force each, never miss';
      case 'splash': return 'a foe within ' + g.range + ' ft (and one beside it) · DEX · ' + d + ' acid';
      case 'cone': return g.len + '-ft cone · ' + save + ' · ' + d + ' ' + sp.el;
      case 'line': return g.len + '-ft line · ' + save + ' · ' + d + ' ' + sp.el;
      case 'sphere': if (e.id === 'daylight') return '60-ft sphere of daylight within 60 ft: bright 60, dim 60 more · burns away a Darkness it touches' + roostNote(D.battle);
        if (e.id === 'dancinglights') return (g.move ? 'move the four lights (a bonus action)' : 'four hovering lights, dim 10 ft each, at a point within 120 ft') + conc + ' · dim: lawful under a roost';
        if (e.id === 'fogcloud') return '20-ft sphere of fog within 120 ft: nothing sees in, out or across it' + conc;
        if (e.id === 'stinkingcloud') return '20-ft sphere within 90 ft: fog, and CON or lose the action each turn inside' + conc;
        if (e.id === 'sleetstorm') return '40-ft sphere within 150 ft: fog, ice underfoot (DEX or prone, difficult), flames out' + conc;
        return e.id === 'sleep' ? (g.pool + g.poolUp * Math.max(0, e.slot - 1)) + 'd8 HP of sleep, ' + g.r + '-ft sphere within ' + g.range + ' ft' : g.r + '-ft sphere within ' + g.range + ' ft · ' + save + ' · ' + d + (sp.dmg2 ? ' + ' + sp.dmg2 : '') + ' ' + sp.el;
      case 'cube': return g.size + '-ft cube within ' + g.range + ' ft · DEX or restrained' + conc;
      case 'wave': return '15-ft cube out from you · CON half · ' + d + ' thunder, a failed save pushed 10 ft';
      case 'single': return e.id === 'holdmonster' ? 'a foe within 90 ft · WIS or paralyzed' + conc : e.id === 'holdperson' ? 'a humanoid within 60 ft · WIS or paralyzed' + conc : 'an ally within ' + g.range + ' ft · +2 AC' + conc;
      case 'allies': return 'up to ' + n + ' within ' + g.range + ' ft · ' + (e.id === 'bless' ? '+1d4 to attacks and saves' + conc : '+' + 5 * Math.max(1, e.slot - 1) + ' max HP');
      case 'self': return ({ seeinvisibility: 'you see the invisible for the fight', mislead: 'invisible (till you attack or cast), and a false double' + conc, passwithouttrace: '+10 Stealth to all of yours within 30 ft' + conc }[e.id]) || '+1d4 radiant on weapon hits' + conc;
      case 'teleport': return '30 ft, to a square you can see';
      case 'touch': return 'touch · ' + ({ curewounds: (1 + Math.max(0, e.slot - 1)) + 'd8' + RU.sign(M.mod(u)) + ' healing', mageArmor: 'no armour: AC 13 + DEX', greaterinvisibility: 'invisible' + conc, stoneskin: 'half from blades, bolts, bites' + conc, heroism: 'fearless, temp HP each turn' + conc, lesserrestoration: 'ends one: paralysis, the disease, blindness, poison or deafness',
        light: 'a light on you or an ally beside you: bright 20 ft, dim 20 more, for the fight' + roostNote(D.battle), darkvision: 'sees in the dark to 60 ft', invisibility: 'unseen till they attack or cast' + conc,
        continualflame: 'a heatless flame on them: bright 20 ft, dim 20 more, and it never goes out' + roostNote(D.battle), trueseeing: 'truesight 120 ft: the dark, the invisible, the fog' }[e.id] || '');
    }
    return g.why || '';
  };

  function roostNote(B) { return B && B.fight && B.fight.roost ? ' -- {r}BRIGHT LIGHT, UNDER THE ROOST{/}' : ''; }

  // ------------------------------------------------------------------ shapes
  // (a teleport's 30 ft is a distance, up and down as well as across -- height as a diagonal, as G.dist has it: from the roof's edge the street 45 ft below is out of Misty Step's
  // reach, where the flat count had let it jump down; 10-05, Griz: "1 agreed")
  M.inRange = function (u, g, x, y) { var dzT = g.shape === 'teleport' && G.tall() ? Math.floor(Math.abs(G.map.gz(x, y) - G.gzAt(u, u.x, u.y)) / G.map.def.step / 2) : 0; return Math.max(Math.abs(x - u.x), Math.abs(y - u.y), dzT) * 5 <= (g.range || 0) && G.losPoint(u.x, u.y, x, y) && !(g.see && g.shape !== 'darts' && D.battle && !M.seesSq(D.battle, u, x, y)); }; // (a point you can see -- Call Lightning, Black Tentacles, Guardian of Faith, the Conjures: data/spells.js `see`, 10-02)
  M.seesSq = function (B, u, x, y) { return M.seeWhy(B, u, { x: x, y: y, size: 1, conds: {} }).ok; };
  // a foe's square aimed at in the dark by a spell that names one creature and asks no sight of it (10-02, Griz: "allow unseen foes only by guessing the square"): whoever
  // stands there takes it -- an empty square takes nothing but the slot (js/magic.js M.cast). Not a friend's spell: a friend is found where you know them (M.targetOK)
  M.guessDark = function (B, u, g, x, y) {
    if (g.see || g.side === 'ally' || !(g.shape === 'single' || g.shape === 'splash')) return false;
    var s = G.map.at(x, y); if (!s || !s.open || Math.max(Math.abs(x - u.x), Math.abs(y - u.y)) * 5 > (g.range || 0) || !G.losPoint(u.x, u.y, x, y)) return false;
    return !M.seesSq(B, u, x, y);
  };
  // cone and line: from the caster toward the cursor. A cone is as wide as it is far (half-angle ~26.6); a line 5 ft wide.
  function aimed(u, cx, cy, len, cone) {
    var ox = u.x + ((u.size || 1) - 1) / 2, oy = u.y + ((u.size || 1) - 1) / 2, dx = cx - ox, dy = cy - oy, L = Math.hypot(dx, dy);
    if (L < 0.01) return [];
    dx /= L; dy /= L;
    var out = [], R = Math.ceil(len / 5) + 1;
    for (var y = Math.floor(oy) - R; y <= Math.ceil(oy) + R; y++) for (var x = Math.floor(ox) - R; x <= Math.ceil(ox) + R; x++) {
      var s = G.map.at(x, y); if (!s || !s.open) continue;
      if (x >= u.x && y >= u.y && x < u.x + (u.size || 1) && y < u.y + (u.size || 1)) continue;
      var vx = x - ox, vy = y - oy, along = vx * dx + vy * dy, perp = Math.abs(vx * dy - vy * dx);
      if (along <= 0.3 || along > len / 5 + 0.5) continue;
      if (cone ? perp > along / 2 + 0.35 : perp > 0.55) continue;
      if (!G.losPoint(u.x, u.y, x, y)) continue;
      out.push([x, y]);
    }
    return out;
  }
  M.area = function (u, g, cx, cy) {
    if (g.shape === 'sphere') return M.inRange(u, g, cx, cy) ? G.sphere(cx, cy, g.r) : [];
    if (g.shape === 'cube') { var n = g.size / 5, x0 = cx - Math.floor((n - 1) / 2), y0 = cy - Math.floor((n - 1) / 2); return M.inRange(u, g, cx, cy) ? G.cube(x0, y0, n) : []; }
    if (g.shape === 'wave') return M.wave(u, g, cx, cy);
    if (g.shape === 'cone') return aimed(u, cx, cy, g.len, true);
    if (g.shape === 'line') return aimed(u, cx, cy, g.len, false);
    return [];
  };
  // a cube out from the caster (Thunderwave): 3 x 3 squares against the side (or the corner) of him the cursor is toward
  M.waveDir = function (u, cx, cy) {
    var dx = cx - u.x, dy = cy - u.y;
    if (!dx && !dy) return null;
    var sx = Math.abs(dx) > 2 * Math.abs(dy) ? Math.sign(dx) : Math.abs(dy) > 2 * Math.abs(dx) ? 0 : Math.sign(dx);
    var sy = Math.abs(dy) > 2 * Math.abs(dx) ? Math.sign(dy) : Math.abs(dx) > 2 * Math.abs(dy) ? 0 : Math.sign(dy);
    return [sx, sy];
  };
  M.wave = function (u, g, cx, cy) {
    var d = M.waveDir(u, cx, cy), n = g.size / 5, out = [];
    if (!d) return out;
    var x0 = d[0] > 0 ? u.x + 1 : d[0] < 0 ? u.x - n : u.x - (n - 1) / 2, y0 = d[1] > 0 ? u.y + 1 : d[1] < 0 ? u.y - n : u.y - (n - 1) / 2;
    for (var y = y0; y < y0 + n; y++) for (var x = x0; x < x0 + n; x++) { var s = G.map.at(x, y); if (s && s.open && G.losPoint(u.x, u.y, x, y)) out.push([x, y]); }
    return out;
  };
  // a humanoid (Hold Person): the party, the 8-bit game's monsters tagged so, and the grid's own kinds that say so
  // (a druid in a beast's shape is a beast -- SRD 5.1 Wild Shape, "you assume the beast's ... statistics" -- and one of ours dominated onto the other side is still one of ours:
  // 10-06, the grid's rules §2.7, with Dominate Person)
  M.humanoid = function (w) {
    if (w.beast) return false;
    if (w.side === 'party' || (w.dominated && w.dominated.side0 === 'party')) return true;
    if (w.type) return w.type === 'humanoid'; // (the creature type on every sheet, 09-28)
    var m = window.DS.DATA.monsters[w.kind], f = D.FOES[w.kind] || {};
    return !!(f.humanoid || (m && (m.tags || []).indexOf('humanoid') >= 0));
  };
  M.touchTargets = function (B, u, g) {
    return B.units.filter(function (w) {
      if (w.dead || w.side !== u.side) return false;
      if (w.object && (!g.obj || w.spellProof)) return false; // (the Skylights' glass: a touch that names "a creature" does not take it -- M.targetKind; Light and Continual Flame name an object: `obj`, data/spells.js)
      if (w.familiar) return false; // (a familiar is no target for its side's spells -- RULED 10-01, Griz: "familiars not targetable")
      if (w !== u && G.dist(u, w) > 5 && !(D.familiar && D.familiar.delivers(B, u, w))) return false; // (or carried by the familiar: js/familiar.js)
      if (g.unarmored && (w.armored || w.conds.mageArmor)) return false;
      return true;
    });
  };
  // would a Globe of Invulnerability stop u's spell (the geometry g carries its level: M.geo) at w? false where no globe stands, the spell's level is not
  // known, w is u itself, or u stands inside the globe too (M.globed, js/grimoire.js, says the rest: the level against the globe's, outside against in).
  // A spell used again (g.free: it costs no slot, it is the standing spell's next bolt, swing, flare or move) is asked from where it was first cast, not from where u
  // stands now (M.castOrigin, js/grimoire.js)
  M.globeShuts = function (B, u, g, w) {
    return !!(M.globed && B && B.globes && B.globes.length && g && g.lvl != null && w && w !== u && w.hp != null && M.globed(B, g.free && M.castOrigin ? M.castOrigin(B, u, g) : u, w, g.lvl));
  };
  // why w is no target for a spell that would only lay again what is already on it (g.noStack, the condition's name), or '': Enlarge on
  // one already enlarged, Reduce on one already reduced -- one record a creature, never two. The other way is a replacement and is let
  // through (js/grimoire.js takes the old casting down). The picker greys it, and the click says why (js/ui.js)
  // (B is optional: the picker's click, ui.js, asks without it, and the battle on now stands in)
  M.targetWhy = function (u, g, w, B) {
    // charmed: no harmful spell at its charmer (SRD 5.1; RULED 09-30)
    if (w && RU.charmedBy(u, w) && g && (g.shape === 'attack' || g.shape === 'rays' || g.shape === 'darts' || g.shape === 'splash' || g.side === 'foe')) return 'charmed by it';
    // the Globe of Invulnerability (SRD 5.1: a spell of its level or lower, cast from outside, "can't affect creatures or objects within"): no target for it,
    // and the AI does not spend a slot on one -- the player's picker greys it and the click says why (10-01, Griz: "Yes to Longstriding Hastened Globe
    // runners". The SRD has the spell simply fail; naming it up front is the same kindness the other no-effect targets get). Casting from inside the globe is fine
    if (M.globeShuts(B || D.battle, u, g, w)) return 'inside the globe';
    // Mage Armor: not on one in armour, nor one already under it -- said, not silent (10-01, Griz in the wizard room: "think we broke the
    // mage-armor cast select": the class floor's wizards come in with it up, so a click on any of them did nothing at all)
    if (g && g.unarmored && w && w.conds && (w.armored || w.conds.mageArmor)) return w.conds.mageArmor ? 'already under Mage Armor' : 'in armour';
    // Magic Weapon (SRD 5.1: "You touch a nonmagical weapon" -- 10-03, it took a +1 to +2): not a blade that is magic already, nor an empty hand
    if (g && g.nonmagical && w) { if (!w.weapon || w.weapon.name === 'Unarmed Strike') return 'holding no weapon'; if (w.weapon.magic) return 'holding a weapon that is magic already (the spell takes a nonmagical one)'; }
    var c = g && g.noStack && w && w.conds && w.conds[g.noStack];
    if (!c) return '';
    return !!c.down === (w.side !== u.side) ? 'already ' + (c.down ? 'reduced' : 'enlarged') : '';
  };
  // is w the kind of creature this spell takes, wherever it stands (the side, the type, the spell's own refusals)? M.targetOK adds reach and sight
  M.targetKind = function (B, u, g, w) {
    if (!w || w.dead || w.ethereal) return false;
    // an object (the Skylights' glass) is no creature: a spell whose SRD 5.1 words say "a creature" never takes it; `obj` on the spell's geometry (data/spells.js) marks
    // the ones whose words take an object (10-05 evening, Griz, Sanctuary cast on the glass: "maybe only that one specific one can target the glass at all?")
    if (w.object && (!g.obj || w.spellProof)) return false;
    if (M.targetWhy(u, g, w, B)) return false;
    var foeWanted = g.shape === 'attack' || g.shape === 'rays' || g.shape === 'darts' || g.shape === 'splash' || g.side === 'foe';
    if (foeWanted && (!G.hostile(u, w) || (w.hp <= 0 && !w.regenDown)) && !(g.selfToo && w === u)) return false; // (selfToo: Hideous Laughter on its own caster, the easter egg -- js/grimoire.js M.jokeReady) (regenDown: a troll down and knitting, to be burned -- 10-05)
    if (((g.shape === 'allies' && g.side !== 'foe') || g.side === 'ally') && w.side !== u.side) return false; // (Bane: an `allies` shape aimed at foes)
    if (w.familiar && w.side === u.side && !foeWanted) return false; // (its own side's spells pass a familiar by -- RULED 10-01, "familiars not targetable")
    if (g.only === 'humanoid' && !M.humanoid(w)) return false;
    if (g.only === 'beast' && w.type !== 'beast') return false; // (Dominate Beast, Animal Friendship)
    return true;
  };
  // why a spell that takes a creature has none it may take (M.list greys it with this)
  M.noTarget = function (B, u, g) {
    // (every one it could take stands in a Globe of Invulnerability its level cannot cross: said first, not "none in range". g0, the same spell
    // asked as if no globe stood, finds the ones the globe alone turned away)
    var g0 = Object.assign({}, g, { lvl: null });
    if (B.units.some(function (w) { return M.globeShuts(B, u, g, w) && M.targetOK(B, u, g0, w); })) return 'every one it could take is inside the globe';
    var reach = M.touchRange(g) ? (D.familiar && D.familiar.deliverer(B, u) ? 'within reach, nor within the familiar\'s move' : 'within reach (5 ft)') : '';
    if (g.shape === 'touch') return 'no one ' + reach;
    if (B.units.some(function (w) { return M.targetKind(B, u, g, w); })) return reach ? 'none ' + reach : 'none in range (' + (g.range || 5) + ' ft) and in sight';
    var foe = g.shape === 'attack' || g.shape === 'rays' || g.shape === 'splash' || g.side === 'foe';
    return 'no ' + (g.only || 'one') + (foe ? (g.only ? ' foe' : ' of the foes') : '') + ' standing to take it';
  };
  // a spell with a range of touch, which a familiar may deliver (SRD 5.1 Find Familiar: "when you cast a spell with a range of touch, your
  // familiar can deliver the spell as if it had cast the spell"; RULED 09-30): the touch spells, the touch attacks, and a touch that asks a
  // save (Bestow Curse) -- 10-01b, Griz: "don't forget touch casters with familiars default to touching via familiar within range"
  M.touchRange = function (g) { return g.shape === 'touch' || ((g.shape === 'attack' || g.shape === 'single') && (g.range || 5) <= 5); };
  // is w a target for this spell from u (single, attack, rays, darts, splash, allies, touch)?
  M.targetOK = function (B, u, g, w) {
    if (g.shape === 'touch') return !!w && !w.dead && !w.ethereal && !M.targetWhy(u, g, w, B) && M.touchTargets(B, u, g).indexOf(w) >= 0;
    if (!M.targetKind(B, u, g, w)) return false;
    if (M.touchRange(g) && w !== u && G.dist(u, w) > 5 && D.familiar && D.familiar.delivers(B, u, w)) return true; // (a touch carried by the familiar: it goes to them)
    // sight by the spell's own words (10-02, Griz: "yes to the mismatch fix, yes to allow unseen friends, since you know where your own people are (Bless already works
    // that way), and allow unseen foes only by guessing the square"; the runner's register, data/spells.js `see`): "a creature you can see" -- Hold, Magic Missile, Bane,
    // Mass Healing Word -- asks it of every one aimed at; the rest ask a clear path only. A friend unseen is taken where you know them to be (as Bless and Aid always
    // were); a foe unseen, by a spell that names one creature, only by aiming at its square in the dark (M.guessDark, js/ui.js) -- or Magic Missile at the dark, the gimmick.
    // (before: every single, darts and splash spell asked sight -- right for 33 of 44; Shield of Faith, Sanctuary, Acid Splash, Dispel Magic among the 9 it was wrong for)
    var unseen = w !== u && !M.sees(B, u, w);
    if (unseen && (g.see || (G.hostile(u, w) && (g.shape === 'single' || g.shape === 'splash')))) return false;
    if (G.dist(u, w) > (g.range || 5)) return false;
    return G.los(u, w).clear || w === u;
  };

  // ------------------------------------------------------------------ concentration
  // a spell's duration in rounds (SRD 5.1: deep16/data/durations.js; 09-28h, Griz: "spell durations are theoretically important"),
  // or null for one the SRD doesn't time (our own) or for as long as a fight lasts
  M.duration = function (id) { var d = D.DURATION && D.DURATION[String(id).toLowerCase().replace(/[^a-z0-9]/g, '')]; return d ? d.r : null; };
  M.concentrate = function (B, u, id, name, undo) {
    if (u.conc) M.endConc(B, u, 'a new spell');
    var r = M.duration(id);
    u.conc = { id: id, name: name, undo: undo, till: r && B && B.round != null ? B.round + r : null }; // (its time runs out at the start of his turn, r rounds on)
  };
  // a timed effect that isn't concentration (Mirror Image, Sanctuary, Blink: a minute): undone at the start of the caster's turn when
  // its time is up
  M.expire = function (B, u, id, undo) {
    var r = M.duration(id); if (!r || !B || B.round == null) return;
    (B.expiries = B.expiries || []).push({ by: u.id, till: B.round + r, undo: undo, id: id });
  };
  M.endConc = function (B, u, why) {
    if (!u.conc) return;
    var c = u.conc; delete u.conc;
    B.card(['{y}' + u.name + '{/} lets go of ' + c.name + (why ? ' (' + why + ')' : '') + '.']); // (before what its ending says: a globe falling, then what it gave back)
    if (M.unveil) M.unveil(B, c.undo); else c.undo(); // (with what a Globe of Invulnerability holds off a creature put back first, so the spell's undo finds its record and it ends for good -- js/grimoire.js, 10-01c)
  };
  M.concCheck = function (B, u, dmg) {
    if (!u.conc || u.hp <= 0) return;
    var dc = Math.max(10, Math.floor(dmg / 2)), sv = RU.save(u, 'con', dc, false, 'concentration');
    B.card(['{y}' + u.name + '{/} holds ' + u.conc.name + '? CON ' + RU.saveText(sv) + ' vs DC ' + dc + '  ' + (sv.ok ? '{n}HELD{/}' : '{o}LOST{/}')]);
    if (!sv.ok) M.endConc(B, u, 'the blow');
  };
  function lift(B, list, cond) { list.forEach(function (w) { delete w.conds[cond]; }); }
  // what Lesser Restoration could end on w (SRD 5.1: "either one disease or one condition afflicting it. The condition can be blinded, deafened,
  // paralyzed, or poisoned"), the worst first: paralysis, the disease, blindness, poison, deafness. Each { label, end() }. Contagion is the grid's one
  // disease -- its conds.contagion, the poison it laid (poisoned.contagion) and, once it has taken hold, the blinding (blinded.by 'contagion'): ending it
  // ends all three (as Heal does, grimoire.js cureSick), and none of the three is offered alone. A poison that paralyses (poisoned.paralysis +
  // paralyzed.poison: the spider's, the chuul's) is one ailment: ending it frees the creature
  function ailments(w) {
    var c = w.conds, out = [];
    if (c.paralyzed) out.push(c.paralyzed.poison ? { label: 'the paralysing poison', end: function () { delete c.paralyzed; delete c.poisoned; } } : { label: 'paralysis', end: function () { delete c.paralyzed; } });
    if (c.contagion) out.push({ label: 'the disease', end: function () { delete c.contagion; if (c.poisoned && c.poisoned.contagion) delete c.poisoned; if (c.blinded && c.blinded.by === 'contagion') delete c.blinded; } });
    if (c.blinded && c.blinded.by !== 'contagion') out.push({ label: 'blindness', end: function () { delete c.blinded; delete c.blindedBy; } });
    if (c.poisoned && !c.poisoned.contagion && !(c.paralyzed && c.paralyzed.poison)) out.push({ label: 'poison', end: function () { delete c.poisoned; } });
    if (c.deafened) out.push({ label: 'deafness', end: function () { delete c.deafened; } });
    return out;
  }
  M.ailments = ailments;

  // ------------------------------------------------------------------ cast: spends the slot and the action or bonus action, then does the thing
  // the sound a spell makes as it's cast (the 8-bit game's effects)
  M.sound = function (sp) {
    var k = sp.kind, el = sp.el;
    if (k === 'heal' || k === 'cure' || k === 'revive') return 'heal';
    if (k === 'buff' || k === 'light' || k === 'detect') return 'buff';
    return el === 'fire' ? 'fire' : el === 'cold' ? 'frost' : el === 'lightning' || el === 'thunder' ? 'zap' : 'magic';
  };
  M.cast = function* (B, u, id, slot, t) {
    var sp = M.data(id), g = M.geo(id), T = u.turn, self = this;
    if (id === 'dancinglights' && u.conc && u.conc.id === 'dancinglights') g = Object.assign({}, g, { time: 'B', move: true }); // (the lights are up: this is the bonus action that moves them)
    var ex0 = M.EFFECT && M.EFFECT[id]; if (ex0 && ex0.geo) g = ex0.geo(B, u, g) || g; // (the floating weapon already up: its swing)
    var carry = M.touchRange(g) && D.familiar && D.familiar.carries(B, u, t); // (a touch spell the familiar carries: its turn's movement, RULED 09-30)
    if (T.quicken && g.time === 'A' && sp.level) g = Object.assign({}, g, { time: 'B' }); // (Quickened Spell: js/features.js)
    if (g.time === 'B') { T.bonus = 0; if (!g.move && !g.again) T.bonusSpell = true; } else { T.action = 0; T.spellAction = g.free ? T.spellAction : sp.level ? 'leveled' : 'cantrip'; }
    if (sp.level && !g.free) u.slots[slot - 1]--;
    var head = '{y}' + u.name + '{/}: ' + sp.name.toUpperCase() + (sp.level ? ' (L' + slot + ')' : '');
    var dc = u.spellDC, n = up(sp, slot);
    if (u.famPerk) dc += (id === 'web' ? u.famPerk('webDC') : 0) + (window.DS.R.CHARM_SPELLS.indexOf(id) >= 0 ? u.famPerk('charmDC') : 0); // (the spider's and the snake's, js/familiar.js)
    if (g.shape !== 'self' && g.shape !== 'touch') { var at = t && t.x != null ? { x: t.x, y: t.y, size: 1 } : t && t.units ? t.units[0] : t; if (at) u.facing = B.faceTo(u, at); }
    u.anim = D.spr.anim(u.sheet, 'cast') ? 'cast' : 'attack'; u.animT = B.t; // (a caster's own pose where the sheet has one: the spell animation pass, 09-28h)
    D.sfx(M.sound(sp));
    yield Math.max(10, Math.round((D.spr.duration(u.sheet, u.anim) || 18) * 0.55)); // (the release at the height of the cast pose)
    if (carry && !(yield* D.familiar.carry(B, u, t))) { u.anim = 'idle'; return; } // (it goes with the spell; one lost on the way loses it)
    if (M.counterAsk && (yield* M.counterAsk(B, u, id, slot, g))) { u.anim = 'idle'; return; } // (Counterspell, as it is released: countered, it fails -- the slot and the action spent; js/grimoire.js, 10-02)
    // a concentration spell let go: the one held before ends now, whether this one takes anyone or not (SRD 5.1: "casting another spell that requires
    // concentration" ends it -- 10-06; a Hold or a Laughter saved against used to leave the old Bless up). Not the same spell's own use again (the lights moved, Eyebite's next gaze)
    if (u.conc && u.conc.id !== id && !g.again && !g.move && D.DURATION && (D.DURATION[id] || {}).c) M.endConc(B, u, 'a new spell');

    // Sanctuary (SRD 5.1): a harmful spell at the warded one (a single target or a touch, not the attack rolls -- Battle.attack asks those -- nor an area: "This spell doesn't protect the warded
    // creature from area effects") asks the WIS save first; failed, a new target or the spell is lost (the slot and the action spent)
    if (/^(single|touch)$/.test(g.shape) && t && t.hp != null && t !== u && t.conds && t.conds.sanctuary && G.hostile(u, t) && M.sanctuary && B.sanctuaryNew && !M.sanctuary(B, u, t)) {
      var alt = yield* B.sanctuaryNew(u, t, { spell: true, ranged: g.shape === 'single', range: [0, g.range || 60], touch: g.shape === 'touch' }, { g: g });
      if (!alt) { yield 30; u.anim = 'idle'; return; }
      t = alt; u.facing = B.faceTo(u, t);
    }
    // the Globe of Invulnerability (SRD 5.1: "Such a spell can target creatures and objects within the barrier, but the spell has no effect on them"):
    // a spell of its level or lower, cast from outside it, at a creature inside -- spent, and nothing happens. Here the spells aimed at one or more
    // creatures (a touch, a single target, a list of allies, the grimoire's own): the attack rolls and rays are turned in Battle.attack, the darts and
    // the splash below, the areas in area() and the save spells in grimoire.js saveAll. Not kept out of the globe: the ground, fog and walls a spell leaves
    if (M.globed && !/^(attack|rays|darts|splash)$/.test(g.shape)) {
      var aimed = t && t.units ? t.units : t && t.hp != null ? [t] : [], shut = aimed.filter(function (w) { return w && w.hp != null && w !== u && M.globed(B, u, w, sp.level); });
      if (shut.length) {
        B.card([head + ': ' + shut.map(function (w) { return w.side === 'foe' ? B.shortName(w) : w.name; }).join(', ') + (shut.length > 1 ? ' are' : ' is') + ' inside the globe -- {c}the spell has no effect{/}.']); D.sfx('bump');
        if (shut.length === aimed.length) { yield 30; u.anim = 'idle'; return; }
        t = Object.assign({}, t, { units: aimed.filter(function (w) { return shut.indexOf(w) < 0; }) });
      }
    }

    // a guess into the dark at an empty square (M.guessDark): the slot is spent and nothing takes it -- Dispel Magic still asks the square for a spell's area
    if (t && t.dark && t.hp == null && !g.effects && (g.shape === 'single' || g.shape === 'splash')) { B.card([head + ': into the dark -- {g}nothing there takes it{/}.']); yield 20; u.anim = 'idle'; return; }

    // the spells built for the class NPCs (09-28, js/grimoire.js): each its own; the rest below as they were
    var FXD = M.EFFECT && M.EFFECT[id];
    if (FXD && FXD.cast) {
      yield* FXD.cast(B, u, t, slot, head, { sp: sp, g: g, dc: dc, up: n });
      (B.grounds || []).forEach(function (gr) { if (typeof gr.till === 'number' && gr.born == null) gr.born = B.round; }); // (a ground with a clock of its own, Grease: M.groundsTime)
      u.anim = 'idle'; return;
    }

    if (g.shape === 'attack' || g.shape === 'rays') {
      var shots = g.shape === 'rays' ? t.units : [t], dice = g.shape === 'rays' ? sp.dmg : M.dice(sp, u, slot);
      if (g.shape === 'rays') B.card([head + ' -- ' + shots.length + ' rays']);
      for (var i = 0; i < shots.length; i++) {
        if (shots[i].dead || (shots[i].hp <= 0 && !shots[i].regenDown)) continue; // (a troll down and knitting takes the ray: fire on it where it lies -- 10-05, Griz: "is scorching ray supposed to stop regen? Aurdin was shooting him when they were down and there was no real card")
        var spAtk = { name: sp.name, atk: u.spellAtk, dice: dice, mod: 0, type: sp.el, spell: true, ranged: true, range: [g.range, g.range], fx: 'fire' };
        if (shots[i].tendril) { yield* B.strikeTendril(u, shots[i], spAtk); continue; } // (a roper's tendril, the spell's object -- js/ui.js spellTarget, 10-06: the grid's rules §2.4)
        yield* B.attack(u, shots[i], spAtk);
      }
    } else if (g.shape === 'darts') {
      // "Magic Missile at the darkness" (Griz, 09-28: "we have to do [the] magic missile at the darkness gimmick somewhere in the
      // game"): a dart aimed at a square the caster cannot see into (t.units holds { x, y, dark: true }) flies anyway. Whatever
      // stands there takes it -- the darts never miss -- and an empty square takes nothing but the slot. RULES.missilesAtTheDark
      // (a darkmantle riding one of ours there is what stands there to take it -- 10-01, Griz: "I was able to target and cast MM at the darkmantle on Vivian's head
      // and it missed (nobody there)": the square's occupant was Vivian; battle.js riderOn)
      var darts = t.units.map(function (w) { if (!w.dark) return w; var at = G.occupant(w.x, w.y); if (at && !G.hostile(u, at) && D.Battle.riderOn) at = D.Battle.riderOn(u, at, B.units) || at; return (at && at.hp > 0 && !at.dead && G.hostile(u, at)) ? at : { x: w.x, y: w.y, size: 1, dark: true, id: 'dark' + w.x + ',' + w.y, name: 'the darkness' }; });
      var atDark = t.units.some(function (w) { return w.dark; });
      // (the Globe of Invulnerability: a dart at one inside it, from outside, breaks on it -- a dart in the dark that finds one there as well)
      var shutD = M.globed ? darts.filter(function (w) { return w.hp != null && M.globed(B, u, w, sp.level); }) : [];
      darts = darts.filter(function (w) { return shutD.indexOf(w) < 0; });
      // the gimmick (Griz, 09-28, the livestreams' branding): in the fight that carries it (data/fights.js `gimmick: 'darkness'`, the cloaker's
      // deep gallery), the first Magic Missile thrown at the darkness is a cutscene -- a close-up of the caster and his clip, then the
      // cloaker hit, then its face and the line -- and the thing struck comes for the caster (ai.js brute: grudge)
      var gim = B.fight && B.fight.gimmick === 'darkness' && atDark && u.side === 'party' && !B.gimmickDone;
      if (gim) yield { scene: { who: u, anim: 'attack', facing: 0, scale: 3, frames: 250, clip: 'audio/attacking_the_darkness.mp3', caption: 'MAGIC MISSILE. AT THE DARKNESS.' } };
      // Shield (SRD 5.1: "1 reaction, which you take when you are hit by an attack or targeted by the magic missile spell ... you take no damage from magic missile"
      // -- 10-03): one with the barrier already up takes none of the darts; one who knows it, with a slot and the reaction, may raise it as they fly (a player is
      // asked; the AI raises it when two darts or more come at it, or the darts could drop it). The 8-bit's Shield is the claude/8bit-reactions branch's
      var barred = [], shLines = [];
      for (var si = 0; si < darts.length; si++) {
        var sw = darts[si]; if (sw.hp == null || sw.dark || sw === u || darts.indexOf(sw) !== si) continue;
        var nAt = darts.filter(function (x) { return x === sw; }).length, ssl = M.slotLevels(sw, 1)[0];
        if (!sw.conds.shield && sw.reaction > 0 && RU.canAct(sw) && (sw.known || []).indexOf('shield') >= 0 && ssl && (!sw.guest || sw.classAI)) {
          var shYes = sw.side !== 'party' || sw.guest ? (nAt >= 2 || sw.hp <= 5 * nAt) : yield { prompt: { who: sw, title: sw.name + ': SHIELD?', lines: [nAt + (nAt > 1 ? ' darts' : ' dart') + ' of Magic Missile at you.', 'Shield: no damage from them, and +5 AC till your turn. (a level-' + ssl + ' slot, the reaction)'], opts: [{ label: 'CAST SHIELD', value: true }, { label: 'TAKE THEM', value: false }] } };
          if (shYes) { sw.slots[ssl - 1]--; sw.reaction = 0; sw.conds.shield = true; FX.ring(sw, 'glow', 50); D.sfx('buff'); shLines.push('  ' + sw.name + ': {c}SHIELD{/} -- the barrier goes up as they fly'); }
        }
        if (sw.conds.shield) barred.push(sw);
      }
      var lines = [head + ' -- ' + (darts.length + shutD.length) + ' darts, each 1d4+1 force, never missing' + (atDark ? '  {p}AT THE DARKNESS{/}' : '')].concat(shLines), tot = {}, who = {}, struck = [];
      shutD.forEach(function (w, i) { if (shutD.indexOf(w) === i) lines.push('  ' + (w.side === 'foe' ? B.shortName(w) : w.name) + ': {c}inside the globe: ' + shutD.filter(function (x) { return x === w; }).length + ' broke on it, untouched{/}'); });
      for (var k = 0; k < darts.length; k++) { FX.projectile(u, darts[k], 'fire'); }
      yield { fx: 1 };
      darts.forEach(function (w) { var r = D.roll('1d4+1'); tot[w.id] = (tot[w.id] || 0) + r.total; who[w.id] = w; });
      Object.keys(tot).forEach(function (wid) { var w = who[wid]; if (w.dark) { lines.push('  {g}' + tot[wid] + ' force into the dark: nothing there.{/}'); return; } if (barred.indexOf(w) >= 0) { lines.push('  ' + w.name + ': {c}the darts break on the shield -- no damage{/}'); return; } lines.push('  ' + w.name + ': {r}' + tot[wid] + '{/}' + (M.sees(B, u, w) ? '' : ' {p}(something was there){/}')); B.hurt(w, tot[wid], 'force', MAGIC); if (w.side === 'foe') struck.push(w); });
      B.card(lines, 360); yield 30;
      if (gim && struck.length) {
        B.gimmickDone = true;
        var c = struck[0]; if (!c.dead && c.hp > 0) c.grudge = u.id;
        // hung as a cloak on the roof when the darts land, then unfurling into itself (Griz, 09-29: the change "could be smoother")
        // the reveal (Griz, 09-29): the cloak opens, the scream, the wings wrap, the flight -- panels 3(mirrored, with 4's head),4,7,5,6 of the cloak sheet
        var cl = c.sheet === 'cloaker_p2';
        yield { scene: { who: c, anim: cl ? 'reveal' : null, animAt: 70, morph: cl ? { from: 'roost', at: 58, dur: 12 } : null, scale: 1.3, frames: cl ? 200 : 130, hit: true, caption: 'THE DARTS FIND IT.' } };
        yield { scene: { who: c, face: true, faceAt: 0.37, zoomFrom: 1.3, morph: cl ? { from: 'reveal', hold: true, at: 6, dur: 36 } : null, scale: 3, frames: 210, tone: 'red', clip: 'audio/the_darkness_attacks_back.mp3', caption: 'AND THE DARKNESS ATTACKS BACK.' } };
        // and not a dive: it moans (the phantasm heads, #8 of the cloak sheet) -- the real Moan, WIS or frightened, spent here so it doesn't repeat
        var MO = c.moan;
        yield { scene: { who: c, over: { anim: 'moan', alpha: 0.7 }, facing: 0, scale: 2.2, frames: 120, tone: 'red', caption: 'IT MOANS.' } };
        if (MO && !c.dead && c.hp > 0) {
          MO.ready = false; D.sfx('encounter');
          var ml = ['{r}' + c.name + '{/} ' + (MO.text || 'moans. The sound gets inside you.') + '  WIS DC ' + MO.dc];
          B.units.filter(function (w) { return G.hostile(c, w) && G.standing(w) && G.dist(c, w) <= (MO.range || 60); }).forEach(function (w) {
            if (w.conds.heroism) { ml.push('  ' + w.name + ': {n}fearless{/} (Heroism)'); return; }
            if (RU.immuneTo(w, 'frightened', c)) { ml.push('  ' + w.name + ': {n}fearless{/} (proof against it)'); return; } // (Mindless Rage)
            var sv = RU.save(w, 'wis', MO.dc, false, 'frightened');
            ml.push('  ' + w.name + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}steady{/}' : '{o}FRIGHTENED{/} (disadvantage to attack)'));
            if (!sv.ok) w.conds.frightened = { by: c.id, fresh: true };
          });
          B.card(ml, 420); yield 40;
        }
        // and its egg (10-02, Griz: the darkness "still needs it's easter egg"; "Make the egg purple and call it 'stare into the void long enough'"): once a save (js/grimoire.js M.egg, M.EGGS)
        if (M.egg) yield* M.egg(B, 'darkness');
      }
    } else if (g.shape === 'splash') {
      var first = t, second = B.units.filter(function (w) { return w !== first && G.hostile(u, w) && G.standing(w) && G.dist(first, w) <= 5; })[0];
      var potent = u.subclass === 'School of Evocation' && u.lvl >= 6; // (Potent Cantrip, the evoker's 6: half on a save)
      var dd = M.dice(sp, u, 0), r1 = D.roll(dd), lines2 = [head + '  ' + dd + ' ' + RU.fmtRolls(r1.rolls) + ' = ' + r1.total + ' acid  DEX DC ' + dc + (potent ? ', half on a save (potent)' : ', no half')];
      FX.projectile(u, first, 'fire'); yield { fx: 1 };
      [first, second].filter(Boolean).forEach(function (w) {
        if (M.globed && M.globed(B, u, w, sp.level)) { lines2.push('  ' + w.name + ': {c}inside the globe: untouched{/}'); return; } // (the Globe of Invulnerability, SRD 5.1)
        var sv = RU.save(w, 'dex', dc);
        lines2.push('  ' + w.name + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' + (potent ? ' -> ' + Math.floor(r1.total / 2) : '') : '{o}failed -> ' + r1.total + '{/}'));
        if (!sv.ok) B.hurt(w, r1.total, 'acid', MAGIC); else if (potent) B.hurt(w, Math.floor(r1.total / 2), 'acid', MAGIC);
      });
      B.card(lines2, 360); yield 30;
    } else if (g.shape === 'sphere' || g.shape === 'cube' || g.shape === 'cone' || g.shape === 'line' || g.shape === 'wave') {
      yield* area(B, u, id, sp, g, slot, t.x, t.y, head);
    } else if (g.shape === 'single') {
      if (id === 'holdmonster' && t.type === 'undead') { B.card([head + ' on the ' + B.shortName(t) + ': {g}the dead are not held{/}  (SRD 5.1: "no effect on undead")']); FX.ring(t, 'violet', 20); } // (10-06)
      else if (id === 'holdmonster' || id === 'holdperson') {
        var sv2 = RU.save(t, 'wis', dc, false, 'paralyzed');
        B.card([head + ' on the ' + B.shortName(t) + '  WIS ' + RU.saveText(sv2) + ' vs DC ' + dc + '  ' + (sv2.ok ? '{n}SAVED{/}' : '{p}HELD FAST: paralyzed{/}')]);
        FX.ring(t, 'violet', 40);
        if (!sv2.ok && RU.immuneTo(t, 'paralyzed')) B.card(['  ' + t.name + ': {g}cannot be held{/}']);
        else if (!sv2.ok) { t.conds.paralyzed = { dc: dc, save: 'wis', by: u.id }; M.concentrate(B, u, id, sp.name, function () { delete t.conds.paralyzed; }); }
      } else if (id === 'shieldoffaith') {
        t.conds.shieldOfFaith = { by: u.id }; FX.ring(t, 'gold', 40);
        M.concentrate(B, u, id, sp.name, function () { delete t.conds.shieldOfFaith; });
        B.card([head + ': a shimmering field about ' + t.name + ', {c}+2 AC{/} (concentration).']);
      }
      yield 30;
    } else if (g.shape === 'allies') {
      var who = t.units;
      if (id === 'bless') {
        who.forEach(function (w) { w.conds.blessed = { by: u.id }; FX.sparkle(w, 'gold', 10); });
        M.concentrate(B, u, id, sp.name, function () { lift(B, who, 'blessed'); });
        B.card([head + ': ' + who.map(function (w) { return w.name; }).join(', ') + ' -- {y}+1d4{/} to attack rolls and saves (concentration).']);
      } else if (id === 'aid') {
        var add = 5 * Math.max(1, slot - 1);
        // (the same spell's effects don't combine, SRD 5.1: Aid on one already aided raises it only to the higher -- 09-28h, it stacked)
        who.forEach(function (w) { var had = +(w.conds.aid || (w.src && w.src.conds && w.src.conds.aid) || 0), more = Math.max(0, add - had); w.conds.aid = Math.max(had, add); if (!more) return; w.maxhp += more; w.hp = w.hp > 0 ? w.hp + more : more; if (w.ko) { w.ko = false; w.anim = 'idle'; } FX.sparkle(w, 'gold', 10); FX.float('+' + more, w, D.PAL.ramps.moss[2]); });
        B.card([head + ': ' + who.map(function (w) { return w.name; }).join(', ') + ' -- {n}+' + add + ' max HP{/} and as much again.']);
      }
      yield 30;
    } else if (g.shape === 'touch' || g.shape === 'self') {
      var w2 = g.shape === 'self' ? u : t;
      if (id === 'curewounds') {
        var cr = D.roll((1 + n) + 'd8'), amt = cr.total + M.mod(u), got = B.heal(w2, amt);
        B.card([head + ' on ' + w2.name + ': ' + (1 + n) + 'd8' + RU.sign(M.mod(u)) + ' ' + RU.fmtRolls(cr.rolls) + ' = {n}' + amt + '{/}' + (got <= 0 ? ' (already whole)' : got < amt ? ' (' + got + ' to full)' : '')]);
      } else if (id === 'lesserrestoration') {
        // ONE thing ends (the docket, "Lesser Restoration ends one condition, chosen"): a player chooses where more than one afflicts the creature
        // (the worst is the first of the list, which the benches take); an NPC takes the worst
        var ail = ailments(w2), ap = ail[0];
        if (ail.length > 1 && u.side === 'party' && !u.guest) { var ci = yield { prompt: { who: u, title: u.name + ': LESSER RESTORATION', lines: [w2.name + ' is afflicted with more than the spell can end. Which one?'], opts: ail.map(function (a, i) { return { label: a.label.toUpperCase(), value: i }; }) } }; ap = ail[ci] || ail[0]; }
        if (ap) ap.end();
        B.card([head + ' on ' + w2.name + ': ' + (ap ? ap.label + ' ended.' + (ail.length > 1 ? ' {g}(one only: ' + ail.filter(function (a) { return a !== ap; }).map(function (a) { return a.label; }).join(', ') + ' stay' + (ail.length > 2 ? '' : 's') + '){/}' : '') : 'nothing to end.')]);
      } else if (id === 'mageArmor') {
        var ma0 = w2.conds.mageArmor; w2.conds.mageArmor = { by: u.id, base: ma0 && ma0.base != null ? ma0.base : w2.baseAC }; w2.baseAC = Math.max(w2.baseAC, 13 + D.mod(w2.abil.dex)); // (a record, not `true`: where it was cast, for a Globe of Invulnerability, and the AC it was cast over -- what the globe and Dispel Magic give back; 10-01c)
        B.card([head + ' on ' + w2.name + ': {c}AC ' + RU.ac(w2) + '{/} (13 + DEX, no armour).']);
      } else if (id === 'greaterinvisibility') {
        w2.conds.invisible = { by: u.id }; delete w2.conds.hidden;
        M.concentrate(B, u, id, sp.name, function () { delete w2.conds.invisible; });
        B.card([head + ' on ' + w2.name + ': gone from sight -- attacks by them have advantage, at them disadvantage (concentration).']);
      } else if (id === 'stoneskin') {
        w2.conds.stoneskin = { by: u.id };
        M.concentrate(B, u, id, sp.name, function () { delete w2.conds.stoneskin; });
        B.card([head + ' on ' + w2.name + ': skin like stone -- {c}half damage{/} from mundane blades, bolts and bites (concentration).']);
      } else if (id === 'heroism') {
        w2.conds.heroism = { by: u.id, each: Math.max(1, M.mod(u)) }; w2.temp = Math.max(w2.temp || 0, Math.max(1, M.mod(u)));
        M.concentrate(B, u, id, sp.name, function () { delete w2.conds.heroism; w2.temp = 0; });
        B.card([head + ' on ' + w2.name + ': no fear, and {c}' + Math.max(1, M.mod(u)) + ' temporary HP{/} at the start of each turn (concentration).']);
      } else if (id === 'divinefavor') {
        u.conds.divineFavor = { by: u.id };
        M.concentrate(B, u, id, sp.name, function () { delete u.conds.divineFavor; });
        B.card([head + ': his weapon hits take {y}+1d4 radiant{/} (concentration).']);
      } else if (id === 'light') {
        // SRD 5.1: on an object (his staff, her blade): bright 20 ft, dim 20 more, an hour -- it goes where they go
        w2.conds.light = { by: u.id, from: B.castFrom || null, lv: 0 }; // (from and lv: where it was cast from, for a Globe of Invulnerability -- light.js L.map)
        yield* M.brighten(B, u, 'light', head + ' on ' + (w2 === u ? 'his own gear' : w2.name) + ': a steady light, {y}bright 20 ft{/} and dim 20 more.', { x: w2.x, y: w2.y, bright: 20 });
      } else if (id === 'continualflame') {
        w2.conds.continualFlame = { by: u.id, from: B.castFrom || null, lv: 2 }; if (w2.src) { w2.src.conds = w2.src.conds || {}; w2.src.conds.continualFlame = (w2.src.equip && w2.src.equip.weapon) || true; } // (on the weapon in hand; it never goes out: the 8-bit sheet keeps it, js/embed.js)
        yield* M.brighten(B, u, 'flame', head + ' on ' + (w2 === u ? 'his own gear' : w2.name) + ': a flame with no heat in it, {o}bright 20 ft{/} and dim 20 more, that will not go out.', { x: w2.x, y: w2.y, bright: 20 });
      } else if (id === 'darkvision') {
        w2.conds.darkvision = { by: u.id, had: w2.darkvision || 0 }; w2.darkvision = Math.max(w2.darkvision || 0, 60); // (had: the sight it had before, given back inside a globe the spell was cast from outside of -- 10-01c)
        B.card([head + ' on ' + w2.name + ': the dark opens out to {c}60 ft{/}, grey and plain.']);
      } else if (id === 'invisibility') {
        w2.conds.invisible = { by: u.id, ends: true }; delete w2.conds.hidden;
        M.concentrate(B, u, id, sp.name, function () { delete w2.conds.invisible; });
        B.card([head + ' on ' + w2.name + ': gone from sight till they attack or cast (concentration).']);
      } else if (id === 'trueseeing') {
        w2.conds.truesight = { by: u.id, had: w2.truesight || 0 }; w2.truesight = 120;
        B.card([head + ' on ' + w2.name + ': {c}truesight{/} to 120 ft -- the dark, the fog and the invisible are nothing to them.']);
      } else if (id === 'seeinvisibility') {
        u.conds.seeInvisible = { by: u.id, had: !!u.seeInvisible }; u.seeInvisible = true;
        B.card([head + ': the invisible stand plain to him, ghostly and grey.']);
      } else if (id === 'mislead') {
        u.conds.invisible = { by: u.id, ends: true }; u.images = Math.max(u.images || 0, 1); delete u.conds.hidden;
        M.concentrate(B, u, id, sp.name, function () { delete u.conds.invisible; u.images = 0; });
        B.card([head + ': he is gone, and a double of him stands where he stood (a blow may go at it; the invisibility ends if he attacks or casts; concentration).']);
      } else if (id === 'passwithouttrace') {
        // (the Globe of Invulnerability: one in range that stands inside a globe the caster is outside of is not veiled -- the card says so)
        var inRng = B.units.filter(function (w) { return w.side === u.side && G.standing(w) && G.dist(u, w) <= 30; }), shutV = M.globed ? inRng.filter(function (w) { return M.globed(B, u, w, sp.level); }) : [], veiled = inRng.filter(function (w) { return shutV.indexOf(w) < 0; });
        veiled.forEach(function (w) { w.conds.pwt = { by: u.id }; });
        M.concentrate(B, u, id, sp.name, function () { lift(B, veiled, 'pwt'); });
        B.card([head + ': a veil of shadow over ' + veiled.map(function (w) { return w.name; }).join(', ') + ' -- {c}+10 Stealth{/} (concentration).'].concat(shutV.map(function (w) { return '  ' + w.name + ': {c}inside the globe: untouched{/}'; })));
      }
      FX.sparkle(w2, g.shape === 'self' || id === 'divinefavor' ? 'gold' : 'glow', 14);
      yield 30;
    } else if (g.shape === 'teleport') {
      T.bonus = 1; T.bonusSpell = false; if (sp.level) u.slots[slot - 1]++; // misty() spends them itself
      yield* B.misty(u, t.x, t.y);
    }
    u.anim = 'idle';
  };

  // every area spell: the squares, one damage roll, each creature's save (Evasion for a DEX save), conditions
  function* area(B, u, id, sp, g, slot, cx, cy, head) {
    var sq = M.area(u, g, cx, cy), dc = u.spellDC;
    var ramp = id === 'daylight' || id === 'dancinglights' ? 'bone' : id === 'fogcloud' || id === 'sleetstorm' ? 'silver' : id === 'stinkingcloud' ? 'acid' : sp.el === 'cold' || sp.el === 'lightning' ? 'glow' : sp.el === 'thunder' ? 'silver' : sp.el === 'force' ? 'bone' : 'fire';
    if (g.shape === 'sphere' || g.shape === 'cube') { FX.projectile(u, { x: cx, y: cy, size: 1 }, 'fire'); yield { fx: 1 }; }
    var fromMe = g.shape === 'cone' || g.shape === 'line' || g.shape === 'wave';
    FX.bloom(fromMe ? u.x : cx, fromMe ? u.y : cy, sq, ramp);
    var caught = B.units.filter(function (w) { return G.present(w) && (w.hp > 0 || w.regenDown) && G.inArea(w, sq) && (!w.object || id === 'shatter'); }); // (an object -- the Skylights' glass -- is caught by Shatter alone: SRD 5.1, "A nonmagical object that isn't being worn or carried also takes the damage"; a Fireball ignites flammables and hurts creatures. 10-05, Griz: "SRD only shatter is even nicer") // (a troll down and knitting is caught too: a fireball burns it where it lies -- 10-05)
    // the Globe of Invulnerability (SRD 5.1: "the area within the barrier is excluded from the areas affected by such spells"): those inside it, the
    // caster outside, are not caught; the card says so
    var inGlobe = M.globed ? caught.filter(function (w) { return M.globed(B, u, w, sp.level); }) : [];
    if (inGlobe.length) caught = caught.filter(function (w) { return inGlobe.indexOf(w) < 0; });
    var globeLines = inGlobe.map(function (w) { return '  ' + w.name + ': {c}inside the globe: untouched{/}'; });
    if (sp.el === 'fire') M.burnWebs(B, M.globed ? sq.filter(function (q) { return !M.globed(B, u, { x: q[0], y: q[1] }, sp.level); }) : sq, u.id); // (a fire area burns the webs in it: M.burnWebs -- but not the squares inside a globe, excluded from its area)
    var lines = [];
    if (id === 'daylight') {
      // SRD 5.1: bright 60 ft and dim 60 more from a point; on a creature's square it goes with them; a Darkness of 3rd level or
      // lower it overlaps is dispelled (the darkmantle's aura too)
      // (the Globe of Invulnerability, SRD 5.1: "the area within the barrier is excluded from the areas affected by such spells" -- 10-01, Griz: "let's fix it
      // now". The squares of the sphere inside a globe the caster is outside of are no part of the daylight: no light is laid on them, the darkness
      // under them is not burnt, and one standing there is not the bearer it goes with (light.js L.map reads the stamp, `from` and `lv`, of the light
      // or of the bearer's record). Where the globe's caster stands in its own globe, all of it shines)
      var dsq = M.globed ? sq.filter(function (q) { return !M.globed(B, u, { x: q[0], y: q[1] }, sp.level); }) : sq;
      var burnt = (B.darks || []).filter(function (dk) { return dk.kind !== 'fog' && dk.kind !== 'sleet' && dk.kind !== 'stink' && dk.kind !== 'kill' && M.darkSq(B, dk).some(function (q) { return dsq.some(function (p) { return p[0] === q[0] && p[1] === q[1]; }); }); });
      var bearer = B.units.filter(function (w) { return G.standing(w) && w.side === u.side && G.inArea(w, [[cx, cy]]) && !(M.globed && M.globed(B, u, w, sp.level)); })[0];
      if (bearer) bearer.conds.daylight = { by: u.id, from: B.castFrom || null, lv: sp.level }; else B.lights = (B.lights || []).concat([{ id: 'daylight' + u.id, kind: 'daylight', x: cx, y: cy, bright: 60, dim: 60, color: 'bone', by: u.id }]);
      lines.push(head + '  a sphere of daylight' + (bearer ? ' about ' + bearer.name : '') + ': {y}bright 60 ft{/} and dim 60 more' + (burnt.length ? ' -- {y}the darkness burns away{/}' : ''));
      burnt.forEach(function (dk) {
        var by = B.units.filter(function (w) { return w.id === dk.by; })[0];
        if (by && by.conc && (by.conc.id === 'darkness' || by.conc.id === 'aura')) M.endConc(B, by, 'Daylight');
        else B.darks = (B.darks || []).filter(function (x) { return x !== dk; });
      });
      B.card(lines.slice(0, 7), 420);
      yield* M.brighten(B, u, 'daylight', null, { x: cx, y: cy, bright: 60 }); // (bright light: what hates light hates it, and under the roost it is the roof)
      yield { fx: 1 };
      yield 30;
      return;
    } else if (id === 'dancinglights') {
      // SRD 5.1: up to four torch-sized lights, dim 10 ft each, within 120 ft; a bonus action moves them 60 ft. Here the four
      // hover over the point and its three neighbours (a patch of dim light 20 ft across); casting again while they burn moves them
      var spots = [[cx, cy], [cx + 1, cy], [cx, cy + 1], [cx + 1, cy + 1]].filter(function (q) { var s = G.map.at(q[0], q[1]); return s && s.open; });
      if (!spots.length) spots = [[cx, cy]];
      B.lights = (B.lights || []).filter(function (l) { return !(l.kind === 'dance' && l.by === u.id); });
      spots.forEach(function (q, i) { B.lights.push({ id: 'dance' + u.id + i, kind: 'dance', x: q[0], y: q[1], bright: 0, dim: 10, color: 'glow', by: u.id }); });
      if (!(u.conc && u.conc.id === 'dancinglights')) M.concentrate(B, u, id, sp.name, function () { B.lights = (B.lights || []).filter(function (l) { return !(l.kind === 'dance' && l.by === u.id); }); B.card(['{g}The dancing lights wink out.{/}'], 300); });
      lines.push(head + (g.move ? ': the lights drift to a new place.' : '  four lights, no bigger than torches, hover and shed {c}dim light{/} 10 ft round each (concentration; a bonus action moves them).'));
      D.sfx('buff');
    } else if (id === 'fogcloud' || id === 'stinkingcloud' || id === 'sleetstorm') {
      // heavily obscured (SRD): nothing sees into, out of or across it -- the same geometry as Darkness (sees), darkvision no help.
      // Stinking Cloud: CON or the action is lost, each turn inside (startTurn). Sleet Storm: ice underfoot (difficult, DEX or
      // prone on entering or starting there), flames doused, a caster inside checks CON to hold concentration
      var kind = id === 'fogcloud' ? 'fog' : id === 'stinkingcloud' ? 'stink' : 'sleet';
      var rec = { by: u.id, sq: sq, kind: kind, dc: dc };
      B.darks = (B.darks || []).concat([rec]);
      M.concentrate(B, u, id, sp.name, function () { B.darks = (B.darks || []).filter(function (x) { return x !== rec; }); B.card(['{g}The ' + (kind === 'fog' ? 'fog thins and is gone' : kind === 'stink' ? 'yellow cloud drifts apart' : 'sleet stops') + '.{/}'], 300); });
      lines.push(head + '  a ' + g.r + '-ft sphere of ' + (kind === 'fog' ? 'fog' : kind === 'stink' ? 'yellow, nauseating gas' : 'freezing sleet') + ': {c}nothing sees in, out or across it{/} (concentration)');
      if (kind === 'stink') lines.push('  each turn inside: CON DC ' + dc + ' or the action goes on retching');
      if (kind === 'sleet') {
        lines.push('  ice underfoot: difficult ground, DEX DC ' + dc + ' or prone; flames go out');
        var out = D.light ? D.light.douseIn(B, sq) : []; if (out.length) lines.push('  {o}' + out.join(', ') + ' put out by the sleet{/}');
        caught.forEach(function (w) { if (w.conds.prone || w.noProne || RU.immuneTo(w, 'prone')) return; var sv = RU.save(w, 'dex', dc); lines.push('  ' + w.name + ': DEX ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}keeps their feet{/}' : '{o}down on the ice{/}')); if (!sv.ok) w.conds.prone = true; });
      }
      if (D.light && B.lightMap) B.lightMap = null;
      D.sfx('magic');
    } else if (id === 'sleep') {
      var pool = D.roll((g.pool + g.poolUp * Math.max(0, slot - 1)) + 'd8'), left = pool.total;
      lines.push(head + '  ' + (g.pool + g.poolUp * Math.max(0, slot - 1)) + 'd8 = ' + pool.total + ' HP of sleep, the weakest first');
      caught.slice().sort(function (a, b) { return a.hp - b.hp; }).forEach(function (w) {
        if (w.kind === 'drow' || w.fey) { lines.push('  ' + w.name + ': {g}fey blood: sleep cannot take it{/}'); return; }
        if (w.type === 'undead') { lines.push('  ' + w.name + ': {g}' + D.typeText('the dead', true) + ' do not sleep{/}'); return; }
        if (M.wakeful && M.wakeful(B, w)) { lines.push('  ' + w.name + ': {g}the vigil keeps it awake{/}'); return; } // (the Vigil, 6: js/features.js)
        if (RU.immuneTo(w, 'asleep') || RU.immuneTo(w, 'charmed')) { lines.push('  ' + w.name + ': {g}nothing in it sleeps{/}'); return; } // (SRD 5.1 Sleep: "creatures immune to being charmed aren't affected" -- the swarms, the naga: the monster runner's find, 10-02)
        if (w.hp <= left) { left -= w.hp; M.fallAsleep(B, w, { by: u.id, till: { who: u.id, at: 'start', n: 10 }, endText: '{who} wakes: the Sleep has run its minute.' }); lines.push('  ' + w.name + ' ({r}' + w.hp + '{/}): {p}asleep{/}'); }
        else lines.push('  ' + w.name + ' (' + w.hp + '): too much left in it');
      });
    } else if (id === 'web') {
      lines.push(head + '  a 20-ft cube of sticky web: DEX DC ' + dc + ' or restrained (concentration)');
      var stuck = [];
      caught.forEach(function (w) {
        if (w.webWalker) { lines.push('  ' + w.name + ': {g}walks webs: they do not hold it{/}'); return; }
        if (RU.immuneTo(w, 'restrained')) { lines.push('  ' + w.name + ': {g}cannot be held by it{/}'); return; }
        var sv = RU.save(w, 'dex', dc, false, 'restrained');
        lines.push('  ' + w.name + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{p}restrained{/}'));
        if (!sv.ok) { w.conds.restrained = { dc: dc, by: u.id }; stuck.push(w); }
      });
      B.webs = (B.webs || []).concat([{ by: u.id, sq: sq, dc: dc }]);
      // when it goes, everyone it holds goes free (the first catch and any caught since: M.webCatch)
      M.concentrate(B, u, id, sp.name, function () {
        var freed = [];
        B.units.forEach(function (w) { var r = w.conds.restrained; if (r && r.by === u.id && !r.grapple) { delete w.conds.restrained; if (!w.dead && w.hp > 0) freed.push(w.side === 'foe' ? B.shortName(w) : w.name); } });
        B.webs = (B.webs || []).filter(function (wb) { return wb.by !== u.id; });
        B.card(['{p}The webs melt away.{/}' + (freed.length ? '  {o}' + freed.join(', ') + ' ' + (freed.length > 1 ? 'are' : 'is') + ' free.{/}' : '')], 360);
      });
    } else {
      var dd = M.dice(sp, u, slot), r = D.roll(dd), r2 = sp.dmg2 ? D.roll(sp.dmg2) : null, tot = r.total + (r2 ? r2.total : 0), ab = sp.save || 'dex';
      // Elemental Affinity (the Draconic sorcerer at 6): + CHA to a spell of the ancestry's element
      var aff = M.affinity ? M.affinity(u, sp.el) : 0; tot += aff;
      // a second die of its own kind (Ice Storm's 4d6 cold beside its 2d8 bludgeoning, SRD 5.1 -- 10-03, Griz: "yes; it is a bug": it all landed as the first kind)
      var d1 = r.total + aff, d2 = r2 ? r2.total : 0;
      lines.push(head + '  ' + dd + ' ' + RU.fmtRolls(r.rolls) + (r2 ? ' + ' + sp.dmg2 + ' ' + RU.fmtRolls(r2.rolls) : '') + (aff ? ' {y}+' + aff + ' affinity{/}' : '') + (r2 ? ' = {o}' + d1 + '{/} ' + sp.el + ' + {o}' + d2 + '{/} ' + sp.el2 : ' = {o}' + tot + '{/} ' + sp.el) + '  ' + ab.toUpperCase() + ' DC ' + dc);
      var hits = [];
      // Sculpt Spells (the evoker, SRD 5.1 wizard 2): up to 1 + the spell's level of his own in an evocation are spared -- they save, and
      // take nothing where a save would halve it (js/features.js M.sculpted)
      var spared = M.sculpted ? M.sculpted(u, id, sp, caught) : [];
      caught.forEach(function (w) {
        if (spared.indexOf(w) >= 0) { lines.push('  ' + w.name + ': {c}sculpted out of it{/}'); return; }
        // (an object makes no save -- SRD 5.1 Shatter: "A nonmagical object that isn't being worn or carried also takes the damage"; its card read "d20 3 NaN = NaN": 10-05 night, the show's find)
        if (w.object) { lines.push('  ' + w.name + ': {g}an object, no save{/} -> {r}' + (d1 + d2) + '{/}'); hits.push([w, d1, false, d2]); return; }
        var sv = RU.save(w, ab, dc, sp.el === 'poison' && RU.vsPoison(w), null, tot, id === 'shatter' && !!w.inorganic), evade = ab === 'dex' && RU.evasion(w); // (Evasion: the rogue's and the monk's 7, js/rules.js) (Shatter: "A creature made of inorganic material such as stone, crystal, or metal has disadvantage on this saving throw", SRD 5.1 -- 10-06)
        var share = function (x) { return sv.ok ? (evade ? 0 : (sp.half ? Math.floor(x / 2) : 0)) : (evade ? Math.floor(x / 2) : x); }, d = share(d1), dB = share(d2);
        lines.push('  ' + w.name + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{o}failed{/}') + (evade ? ' {c}evasion{/}' : '') + ' -> {r}' + (d + dB) + '{/}');
        hits.push([w, d, sv.ok, dB]);
      });
      globeLines.forEach(function (l) { lines.push(l); });
      if (!caught.length && !globeLines.length) lines.push('  {g}no one in it.{/}');
      B.card(lines.slice(0, 7), 420);
      yield { fx: 1 };
      hits.forEach(function (h) { B.hurtAll(h[0], [[h[1], sp.el], [h[3] || 0, sp.el2]], MAGIC); }); // (each kind its own hurt, as Flame Strike's: grimoire.js -- one concentration save on the sum, B.hurtAll)
      // Thunderwave: a failed save is pushed 10 ft straight away from the caster (stopped by a wall, a creature, the edge)
      if (g.shape === 'wave') hits.forEach(function (h) { if (!h[2]) M.push(B, u, h[0], 2); });
      // Ice Storm: "Hailstones turn the storm's area of effect into difficult terrain until the end of your next turn" (SRD 5.1 -- 10-03, the register said
      // difficult and it was not): a spell's ground (M.rough), gone when its caster's next turn ends (M.endTurn counts them: this one's end, then the next;
      // cast off his own turn, a readied storm, the next end is the one)
      if (id === 'icestorm') { B.grounds = (B.grounds || []).concat([{ kind: 'hail', sq: sq, by: u.id, difficult: true, ends: B.active === u ? 2 : 1 }]); B.card(['  {c}hailstones cover the ground: difficult till the end of ' + u.name + '\'s next turn{/}'], 240); }
      yield 30;
      return;
    }
    if (id === 'sleep' || id === 'web' || id === 'sleetstorm') globeLines.forEach(function (l) { lines.push(l); }); // (the others lay a place -- fog, gas, lights -- and the globe does not keep that out)
    B.card(lines.slice(0, 7), 420);
    yield { fx: 1 };
    yield 30;
  }

  // ------------------------------------------------------------------ the conditions' turns
  // the start of a creature's turn: Heroism's temporary HP; a restrained or paralyzed creature has no move
  M.startTurn = function (B, u) {
    // True Strike (SRD 5.1: "on your next turn, you gain advantage on your first attack roll against the target, provided that this spell hasn't
    // ended"): its one round is that next turn -- held through it, and let go at its end (M.endTurn), or when the swing spends it (battle.js attack).
    // The advantage is for that turn and not the one it was cast in (rules.js edges reads `ready`)
    if (u.conds.trueStrike && B && u.conc && u.conc.id === 'truestrike') u.conds.trueStrike.ready = true;
    // durations (09-28h): a spell held past its time lets go (True Strike's time is the turn it is held through, above); a timed effect of his that has run its course ends
    if (B && u.conc && u.conc.till != null && B.round >= u.conc.till) {
      if (u.conc.id === 'truestrike' && !u.conc.held) u.conc.held = true; else M.endConc(B, u, 'its time is up');
    }
    if (B) M.groundsTime(B, u);
    if (B && B.expiries && B.expiries.length) B.expiries = B.expiries.filter(function (e) { if (e.by !== u.id || B.round < e.till) return true; try { if (M.unveil) M.unveil(B, e.undo); else e.undo(); } catch (x) { } return false; }); // (unveiled: a Globe of Invulnerability's shelf put back first -- M.endConc)
    if (u.conds.heroism && !(B && M.zoneShut && M.zoneShut(B, u.conds.heroism, u, 'is steeled by Heroism'))) u.temp = Math.max(u.temp || 0, u.conds.heroism.each); // (the Globe of Invulnerability: Heroism's temporary HP each turn are a repeating effect of a spell cast from outside it -- nothing inside one)
    if (B && u.hp > 0 && !u.dead) M.webCatch(B, u, 'starts');
    if (B && u.hp > 0 && !u.dead) M.webFireTurn(B, u); // (a web burning about it: 2d4 fire)
    if (B && u.hp > 0 && !u.dead) M.cloudTurn(B, u);
    if (B && M.onStart) M.onStart(B, u); // (the class NPCs' spells: the guardians, the timers, a word of command -- js/grimoire.js)
    u.turn.moveFull = u.turn.move; // (the turn's own walking as it was set, slowed, hasted, cold, got up from prone, a dancer's none: what tearing free of a web gives back -- breakFree, below)
    if (u.conds.restrained || u.conds.paralyzed || u.conds.asleep || u.conds.incapacitated) u.turn.move = 0;
  };
  // a spell's ground with a clock of its own (Grease, SRD 5.1: "1 minute", no concentration to end it): `till` is its rounds, `born` the round it
  // was laid (stamped as the cast ends, M.cast; a ground first seen here is stamped now). It goes at the start of its caster's turn once the
  // minute is up, or at any turn's start if the caster is out of the fight
  M.groundsTime = function (B, u) {
    if (!B || !B.grounds || !B.grounds.length || B.round == null) return;
    B.grounds = B.grounds.filter(function (g) {
      if (g.ends != null) { var by0 = B.units.filter(function (w) { return w.id === g.by; })[0]; if (by0 && !by0.dead && !by0.fled && !by0.left && by0.hp > 0) return true; B.card(['{g}The hail melts into the ground.{/}'], 240); return false; } // (its caster gone or down: no turn of his to end it -- Ice Storm's hail, M.endTurn)
      if (typeof g.till !== 'number') return true;
      if (g.born == null) g.born = B.round;
      if (B.round < g.born + g.till) return true;
      var by = B.units.filter(function (w) { return w.id === g.by; })[0];
      if (g.by !== u.id && by && !by.dead && !by.fled && !by.left) return true;
      B.card(['{g}The ' + (g.kind === 'grease' ? 'grease dries and is gone' : 'ground settles') + '.{/}'], 240);
      return false;
    });
  };
  // the clouds, at the start of a turn inside one: Stinking Cloud (SRD: completely within it, CON save against poison or the
  // action is spent retching; nothing that needs no breath or shrugs off poison); Sleet Storm (DEX or prone; a concentrating
  // caster CON DC or loses the spell)
  M.cloudTurn = function (B, u) {
    var who = u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}';
    var stinks = (B.darks || []).filter(function (d) { return d.kind === 'stink' && G.foot(u).every(function (p) { return d.sq.some(function (q) { return q[0] === p[0] && q[1] === p[1]; }); }); });
    var stink = stinks.filter(function (d) { return !(M.zoneGlobed && M.zoneGlobed(B, d, u)); })[0]; // (the Globe of Invulnerability: a cloud cast from outside it does nothing to one inside; the fog itself stays -- js/light.js)
    if (stinks.length && !stink && M.zoneShut && !(RU.immuneTo(u, 'poisoned') || (u.immune && u.immune.indexOf('poison') >= 0))) M.zoneShut(B, stinks[0], u, 'starts its turn in the yellow cloud');
    if (stink && !(RU.immuneTo(u, 'poisoned') || (u.immune && u.immune.indexOf('poison') >= 0))) {
      var sv = RU.save(u, 'con', stink.dc, RU.vsPoison(u)); // (the save is against poison: Protection from Poison)
      B.card([who + ' in the yellow cloud: CON ' + RU.saveText(sv) + ' vs DC ' + stink.dc + '  ' + (sv.ok ? '{n}holds it down{/}' : '{o}retching and reeling: the action is gone{/}')]);
      if (!sv.ok) { u.turn.action = 0; u.turn.attacksLeft = 0; }
    }
    var sleets = (B.darks || []).filter(function (d) { return d.kind === 'sleet' && G.inArea(u, d.sq); });
    var sleet = sleets.filter(function (d) { return !(M.zoneGlobed && M.zoneGlobed(B, d, u)); })[0]; // (the Globe of Invulnerability: the ice, the save and the CON check do nothing to one inside it)
    if (sleets.length && !sleet) { if (u.turn) u.turn.sleetSaved = true; if (M.zoneShut) M.zoneShut(B, sleets[0], u, 'starts its turn on the ice'); }
    if (sleet) {
      if (u.turn) u.turn.sleetSaved = true; // (one save a turn: starting in it counts)
      if (!u.conds.prone && !u.noProne && !RU.immuneTo(u, 'prone')) {
        var s2 = RU.save(u, 'dex', sleet.dc);
        B.card([who + ' on the ice: DEX ' + RU.saveText(s2) + ' vs DC ' + sleet.dc + '  ' + (s2.ok ? '{n}keeps their feet{/}' : '{o}down{/}')]);
        if (!s2.ok) { u.conds.prone = true; u.turn.move = Math.floor(u.speed / 2); }
      }
      if (u.conc && u.conc.id !== 'sleetstorm') { var s3 = RU.save(u, 'con', sleet.dc); B.card([who + ' holds ' + u.conc.name + ' in the sleet? CON ' + RU.saveText(s3) + ' vs DC ' + sleet.dc + '  ' + (s3.ok ? '{n}HELD{/}' : '{o}LOST{/}')]); if (!s3.ok) M.endConc(B, u, 'the sleet'); }
    }
  };
  // ice underfoot (Sleet Storm): difficult ground (grid.js stepCost)
  M.icy = function (B, x, y) { return (B.darks || []).some(function (d) { return d.kind === 'sleet' && d.sq.some(function (q) { return q[0] === x && q[1] === y; }) && !(M.zoneGlobed && M.zoneGlobed(B, d, { x: x, y: y })); }); }; // (a square inside a globe the storm was cast from outside of is no part of the ice: SRD 5.1, "the area within the barrier is excluded")
  // a sleet storm entered during a move: the SRD's save for the first square of it that turn (battle.js moveAlong)
  M.sleetCatch = function (B, u) {
    var d = (B.darks || []).filter(function (x) { return x.kind === 'sleet' && G.inArea(u, x.sq) && !(M.zoneGlobed && M.zoneGlobed(B, x, u)); })[0];
    if (!d && !u.conds.prone && !u.noProne && !RU.immuneTo(u, 'prone') && !(u.turn && u.turn.sleetSaved) && M.zoneShut) { var sh = (B.darks || []).filter(function (x) { return x.kind === 'sleet' && G.inArea(u, x.sq); })[0]; if (sh) { if (u.turn) u.turn.sleetSaved = true; M.zoneShut(B, sh, u, 'steps onto the ice'); } return false; } // (inside the globe: untouched, said once a turn)
    if (!d || u.conds.prone || u.noProne || RU.immuneTo(u, 'prone') || (u.turn && u.turn.sleetSaved)) return false;
    if (u.turn) u.turn.sleetSaved = true;
    var sv = RU.save(u, 'dex', d.dc), who = u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}';
    B.card([who + ' steps onto the ice: DEX ' + RU.saveText(sv) + ' vs DC ' + d.dc + '  ' + (sv.ok ? '{n}keeps their feet{/}' : '{o}down on the ice{/}')]);
    if (sv.ok) return false;
    u.conds.prone = true; return true;
  };
  // SRD Web (09-27: Griz, "I wasn't sure it was applied appropriately (guy looked like he had it but was running around)"):
  // "Each creature that starts its turn in the webs or that enters them during its turn must make a Dexterity saving throw.
  // On a failed save, the creature is restrained." A cast web, and since 09-30 the strung webs a map starts with (their DC the
  // spinner's: battle.js, the map's webDC). One save a turn: a creature that saved goes on through that turn
  // (raw: the globed ones too -- the Globe of Invulnerability keeps a web cast from outside it off those inside, and the card says so)
  M.webAt = function (B, u, raw) {
    var f = G.foot(u);
    return (B.webs || []).filter(function (w) { return w.dc && f.some(function (p) { return w.sq.some(function (q) { return q[0] === p[0] && q[1] === p[1]; }); }) && (raw || !(M.zoneGlobed && M.zoneGlobed(B, w, u))); })[0] || null;
  };
  M.webCatch = function (B, u, how) {
    var wb = M.webAt(B, u);
    if (!wb && M.zoneShut && !u.webWalker && !u.conds.restrained && !RU.immuneTo(u, 'restrained') && !(u.turn && u.turn.webSaved)) { var shut = M.webAt(B, u, true); if (shut) { if (u.turn) u.turn.webSaved = true; M.zoneShut(B, shut, u, how === 'enters' ? 'blunders into the web' : 'starts its turn in the web'); } }
    if (!wb || u.webWalker || u.conds.restrained || RU.immuneTo(u, 'restrained') || (u.turn && u.turn.webSaved)) return false;
    var sv = RU.save(u, 'dex', wb.dc), who = u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}';
    if (u.turn) u.turn.webSaved = true;
    B.card([who + (how === 'enters' ? ' blunders into the web' : ' starts its turn in the web') + ': DEX ' + RU.saveText(sv) + ' vs DC ' + wb.dc + '  ' + (sv.ok ? '{n}pulls through{/}' : '{p}stuck fast{/}')]);
    if (sv.ok) return false;
    u.conds.restrained = { dc: wb.dc, by: wb.by }; FX.sparkle(u, 'bone', 12);
    return true;
  };
  // the end: a paralyzed creature tries its save again (Hold Monster)
  M.endTurn = function (B, u) {
    if (B && M.onEnd) M.onEnd(B, u); // (the class NPCs' spells: the saves at a turn's end, the timers -- js/grimoire.js)
    // a ground that lasts till the end of its caster's next turn (Ice Storm's hail: `ends`, his turn ends still to come -- 10-03)
    if (B && B.grounds && B.grounds.length) B.grounds = B.grounds.filter(function (g) { if (g.ends == null || g.by !== u.id || --g.ends > 0) return true; B.card(['{g}The hail melts into the ground.{/}'], 240); return false; });
    if (B && u.conc && u.conc.id === 'truestrike' && u.conc.held) M.endConc(B, u, 'its round is up'); // (True Strike: the next turn was its round -- startTurn)
    if (u.conds.poisoned && u.conds.poisoned.save && !u.conds.paralyzed) M.poisonSave(B, u);
    var p = u.conds.paralyzed;
    if (p && p.save) {
      var sv = RU.save(u, p.save, p.dc, !!p.poison && RU.vsPoison(u), 'paralyzed'); // (the chuul's and the crawler's hold is a poison: Protection from Poison)
      B.card([(u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}') + ' strains against the hold: ' + p.save.toUpperCase() + ' ' + RU.saveText(sv) + ' vs DC ' + p.dc + '  ' + (sv.ok ? '{n}FREE{/}' : '{g}still held{/}')]);
      if (sv.ok && p.poison) delete u.conds.poisoned; // (the chuul's, the crawler's: paralyzed while poisoned; one save ends both)
      if (sv.ok) { delete u.conds.paralyzed; var c = B.units.filter(function (w) { return w.conc && (w.conc.id === 'holdmonster' || w.conc.id === 'holdperson') && w.id === p.by; })[0]; if (c) delete c.conc; }
    }
  };
  // ------------------------------------------------------------------ bright light with a place (torchdark, 09-28): a light lit -- the Light cantrip,
  // Daylight, a torch struck or thrown, a Continual Flame, Sacred Weapon's glow -- lights the squares within its bright reach
  // (js/light.js). Whatever hid in that reach is seen; what hates light (lightSensitive: the drow, the duergar, the cloaker)
  // caught in bright light loses its next turn the first time and attacks at disadvantage while it stands in it (rules.js
  // edges: dazzled). Under a roost any bright light is the one law broken (RULED 09-28, canon): the fight ends 'roost' and
  // the 8-bit game's RoostFail runs. `src` { x, y, bright }: where the light is and how far it is bright
  M.brighten = function* (B, u, source, head, src) {
    var Lt = D.light, lines = head ? [head] : [];
    if (B.lightMap) B.lightMap = null;
    if (!B.dark && src && src.bright > 0) B.brightLit = true; // (a lit place: the old fight-wide dazzle for what hates light, rules.js edges)
    var reach = function (w) { return src && Math.hypot(w.x + ((w.size || 1) - 1) / 2 - src.x, w.y + ((w.size || 1) - 1) / 2 - src.y) * 5 <= (src.bright || 0) + 2.5; };
    // (a light a SPELL lays -- Daylight, Light, a Continual Flame, the sphere's glow -- is no area for one inside a Globe of Invulnerability it was cast from outside
    // of: SRD 5.1 "the area within the barrier is excluded from the areas affected by such spells". B.castLevel is set only inside a cast: a struck torch is no spell)
    var lit = B.units.filter(function (w) { return w.side !== u.side && G.standing(w) && (!B.dark || !src || reach(w) || (Lt && Lt.brightAt(B, w))) && !(B.castLevel != null && M.globed && M.globed(B, u, w)); });
    var shy = lit.filter(function (w) { return w.lightSensitive; }), shown = [];
    lit.forEach(function (w) { if (w.conds.hidden && (!B.dark || (Lt && Lt.brightAt(B, w)))) { delete w.conds.hidden; w.hidden0 = false; shown.push(w.name); } });
    if (shown.length) lines.push('  {c}' + shown.join(', ') + ' shown up by the light{/}');
    if (shy.length) {
      var fresh = shy.filter(function (w) { return !w.recoiled; });
      shy.forEach(function (w) { w.flash = 16; if (!w.recoiled) { w.recoiled = true; w.conds.recoiling = true; } });
      lines.push('  ' + shy.map(function (w) { return w.name; }).join(', ') + (fresh.length ? ': {o}recoils, shrinking up away from it{/} -- no next turn, and disadvantage while it stands in bright light' : ': {o}dazzled{/}'));
    }
    if (B.fight && B.fight.roost && !B.roostBroken && (!src || src.bright > 0)) { B.roostBroken = source; lines.push('{r}Bright light under a roosted ceiling.{/}'); D.sfx('encounter'); }
    if (lines.length) B.card(lines, 420);
    FX.ring(u, source === 'torch' || source === 'flame' ? 'fire' : 'glow', 40);
    yield 30;
  };

  // ------------------------------------------------------------------ what a creature can see (torchdark, 09-28): the one question the rules ask.
  // In order: a blinded creature sees nothing; truesight sees all; magical darkness (SRD 5.1 Darkness; Griz 09-27: "We'll have
  // to deal with darkness, at least the magical kind"), fog, sleet and the stinking cloud are heavily obscured -- nothing sees
  // into, out of or across one (darkvision neither; Devil's Sight through darkness only); the invisible are unseen unless
  // outlined by Faerie Fire or the looker sees the invisible; then the light (js/light.js seesBy: dim is enough, in the dark
  // only darkvision to its reach). An unseen target is attacked at -4 for want of light (his table) or at disadvantage for
  // the rest (SRD); an unseen attacker attacks with advantage (rules.js edges); no opportunity attack on one you cannot see
  // (battle.js moveAlong); a spell that needs its target seen cannot take one (targetOK); the foes pick only targets they
  // can see (ai.js heroes, visibleFrom)
  function darkSqRaw(B, d) { // the squares a darkness covers now (the darkmantle's aura goes where it goes)
    if (!d.follow) return d.sq;
    var w = B.units.filter(function (x) { return x.id === d.follow; })[0];
    if (!w || w.dead) return [];
    var cx = w.x + ((w.size || 1) - 1) / 2, cy = w.y + ((w.size || 1) - 1) / 2, k = Math.round(cx) + ',' + Math.round(cy);
    if (d.at !== k) { d.at = k; d.sq = G.sphere(Math.round(cx), Math.round(cy), d.r || 15); }
    return d.sq;
  }
  // ...less the squares inside a Globe of Invulnerability the darkness (or the fog, the stinking cloud, Cloudkill, the sleet) was cast from outside of
  // (SRD 5.1: "Similarly, the area within the barrier is excluded from the areas affected by such spells"; 10-01, Griz, of the Globe's last gaps: "risk of
  // forgetting too high, let's fix it now"). One place, so every reader agrees: sight (darkKindAt, inDark, seeWhy), the light's map (light.js: no dark there
  // for a torch to be kept out of) and the drawing (ui.js overlay, looks.js ground) all ask darkSq. A zone carries where it was cast from and its level (the
  // M.cast wrapper, js/grimoire.js; M.zoneGlobed says the rest). Kept per zone while the globes stand as they are: the same array comes back
  var GCUT = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  M.darkSq = function (B, d) {
    var sq = darkSqRaw(B, d);
    if (!(B.globes && B.globes.length) || !M.zoneGlobed || !sq || !sq.length) return sq;
    if (!d.from && !(B.castFrom && B.castBy === d.by)) return sq; // (not cast from anywhere we know: the darkmantle's aura, a map's own dark)
    var c = GCUT && GCUT.get(d);
    if (c && d.from && c.g === B.globes && c.n === B.globes.length && c.sq === sq && c.f === d.from) return c.out;
    var out = sq.filter(function (q) { return !M.zoneGlobed(B, d, { x: q[0], y: q[1] }); });
    if (out.length === sq.length) out = sq;
    if (GCUT && d.from) GCUT.set(d, { g: B.globes, n: B.globes.length, sq: sq, f: d.from, out: out });
    return out;
  };
  // the kind of dark that lies on a square, or null. Where two lie on it (a fog laid over a Darkness) the Darkness is the one named, wherever it sits in B.darks
  // (10-01, the fog-and-dark runner's find: the first on the list was taken, so a fog over a Darkness hid the Darkness from the light's map, light.js L.map, which
  // asks `=== 'darkness'`: "nonmagical light can't illuminate it" -- the torch lit it). `skip`, a kind to leave out, is for the one looker to whom that kind is no
  // dark at all: Devil's Sight sees through a Darkness, so for it the fog over the Darkness is what lies there (obscuredBetween asks with 'darkness')
  M.darkKindAt = function (B, x, y, skip) {
    var ds = B.darks || [], first = null;
    for (var i = 0; i < ds.length; i++) {
      var k = ds[i].kind || 'darkness'; if (k === skip || (first && k !== 'darkness')) continue;
      var sq = M.darkSq(B, ds[i]);
      for (var j = 0; j < sq.length; j++) if (sq[j][0] === x && sq[j][1] === y) { if (k === 'darkness') return k; first = k; break; }
    }
    return first;
  };
  M.darkAt = function (B, x, y) { return !!M.darkKindAt(B, x, y); };
  M.inDark = function (B, u) { return G.foot(u).some(function (p) { return M.darkAt(B, p[0], p[1]); }); };
  function obscuredBetween(B, a, b) {
    var skip = a.devilSight ? 'darkness' : null, at = function (x, y) { return M.darkKindAt(B, x, y, skip); }; // (a Devil's-Sight looker: a Darkness is no dark to it -- a fog over one still is)
    var k = at(a.x, a.y) || at(b.x, b.y);
    if (!k) { var ka = null; G.foot(a).forEach(function (p) { ka = ka || at(p[0], p[1]); }); G.foot(b).forEach(function (p) { ka = ka || at(p[0], p[1]); }); k = ka; }
    if (k) return k;
    var x0 = a.x + ((a.size || 1) - 1) / 2, y0 = a.y + ((a.size || 1) - 1) / 2, dx = b.x + ((b.size || 1) - 1) / 2 - x0, dy = b.y + ((b.size || 1) - 1) / 2 - y0;
    var n = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 2);
    for (var i = 1; i < n; i++) { var kk = at(Math.round(x0 + dx * i / n), Math.round(y0 + dy * i / n)); if (kk) return kk; } // (across it)
    return null;
  }
  M.seeWhy = function (B, a, b) {
    if (!B || !a || !b || a === b) return { ok: true };
    // blindsight is not sight (SRD): the darkmantle in its own darkness, the oozes, the grimlock -- nothing on this list stops it, to its reach
    if (a.blindsight && G.dist(a, b) <= a.blindsight) return { ok: true };
    // Mirror's Gaze (RULED 09-28, invented.json #mirrors-gaze): the marked one cannot hide from her; unseen, it gains nothing against her
    if (b.conds && b.conds.marked && b.conds.marked.gaze && b.conds.marked.by === a.id) return { ok: true };
    if (a.conds && a.conds.blinded) return { ok: false, why: 'blinded' };
    if (a.truesight && G.dist(a, b) <= a.truesight) return { ok: true };
    if ((B.darks || []).length) {
      var k = obscuredBetween(B, a, b);
      if (k && !(a.devilSight && k === 'darkness')) return { ok: false, why: k === 'darkness' ? 'darkness' : k === 'stink' || k === 'kill' ? 'the cloud' : k };
    }
    if (b.conds && b.conds.invisible && !b.conds.faerie && !a.seeInvisible && !M.inMirror(B, a, b) && !(a.senseHidden && G.dist(a, b) <= a.senseHidden)) return { ok: false, why: 'invisible' }; // (senseHidden: the snake familiar's caster, RULED 09-30)
    if (D.light) { var s = D.light.seesBy(B, a, b); if (!s.ok) return { ok: false, why: s.why }; if (s.dv) return { ok: true, dv: true }; }
    return { ok: true };
  };
  M.sees = function (B, a, b) { return M.seeWhy(B, a, b).ok; };
  // the Mirror's eye (RULED 09-28, Griz: "All Mirror Warlocks should get it as a class feature", "it needing light"): a mirror worn
  // facing forward. Within the cone before the wearer -- her facing and a little past the two beside it -- a creature standing in
  // any light cannot hide from her and gains nothing by being invisible (seeWhy, rules.js edges, ai.js heroes, battle.js hide). A
  // mirror shows nothing in the dark. The units' `facing` is the sprite's (0 S, 1 SW, 2 W, 3 NW, 4 N, 5 NE, 6 E, 7 SE on screen)
  var FACE = [[1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0]];
  M.inMirror = function (B, a, b) {
    if (!a || !b || !a.mirrorEye || a.facing == null || a.hp <= 0 || a.dead) return false;
    if (D.light && D.light.levelOf(B, b) < 1) return false;
    var f = FACE[a.facing % 8], fl = Math.hypot(f[0], f[1]);
    var ax = a.x + ((a.size || 1) - 1) / 2, ay = a.y + ((a.size || 1) - 1) / 2, dx = b.x + ((b.size || 1) - 1) / 2 - ax, dy = b.y + ((b.size || 1) - 1) / 2 - ay, dl = Math.hypot(dx, dy);
    if (!dl) return true;
    return (f[0] * dx + f[1] * dy) / (fl * dl) >= 0.6;
  };
  // a foe's Darkness (Amara's, the turn she breaks for the way out; the drow's innate): over as many of them as it can cover,
  // within its range. A Light (a spell of 2nd level or lower) under it is dispelled; a Daylight it would overlap burns it as it forms
  M.castDarkness = function* (B, u) {
    var K = u.darkness, hs = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w); }), best = null, bn = 0;
    // (a spell of 2nd level cast from where she stands: a creature inside a Globe of Invulnerability she is outside of is not under it, SRD 5.1 -- the AI counts it for nothing, and the record carries where she cast it from)
    var z0 = { by: u.id, from: { x: u.x, y: u.y }, lv: 2 }, shut = function (w) { return !!(M.zoneGlobed && M.zoneGlobed(B, z0, w)); };
    hs.forEach(function (c) {
      if (Math.max(Math.abs(c.x - u.x), Math.abs(c.y - u.y)) * 5 > K.range) return;
      var sq = G.sphere(c.x, c.y, K.r), n = hs.filter(function (w) { return G.inArea(w, sq) && !shut(w) && !M.inDark(B, w); }).length; // (one already in the dark counts for nothing: no second sphere on the same heads)
      if (n > bn) { bn = n; best = { c: c, sq: sq }; }
    });
    if (!best) return false;
    u.turn.action = 0; K.used = true;
    var Lt = D.light, all = Lt ? Lt.all(B) : [];
    var inSq = function (x, y) { return best.sq.some(function (q) { return q[0] === Math.round(x) && q[1] === Math.round(y); }) && !shut({ x: Math.round(x), y: Math.round(y) }); };
    // (the overlap a Daylight is burnt away by is of the squares the Darkness holds and the Daylight lights: neither has a square inside a globe it was cast from outside of -- SRD 5.1,
    // "the area within the barrier is excluded from the areas affected by such spells"; D.light.reaches carves the light, `shut` the Darkness)
    var near = function (l, r) { return best.sq.some(function (q) { return Math.hypot(q[0] - l.x, q[1] - l.y) * 5 <= r && !shut({ x: q[0], y: q[1] }) && (!Lt || Lt.reaches(B, l, q[0], q[1])); }); };
    if (all.some(function (l) { return l.kind === 'daylight' && near(l, l.bright); })) { D.sfx('magic'); B.card(['{r}' + u.name + '{/} calls up darkness -- and the daylight burns it away as it forms.'], 300); yield 30; return true; }
    var gone = [];
    B.units.forEach(function (w) { if (w.conds.light && inSq(w.x, w.y)) { delete w.conds.light; gone.push(w.name + '\'s light'); } });
    B.units.forEach(function (w) { if (w.conc && w.conc.id === 'dancinglights' && (B.lights || []).some(function (l) { return l.kind === 'dance' && l.by === w.id && inSq(l.x, l.y); })) { M.endConc(B, w, 'the darkness'); gone.push('the dancing lights'); } });
    if (gone.length) B.card(['{r}' + u.name + '{/} swallows ' + gone.join(', ') + '.'], 300);
    B.darks = (B.darks || []).concat([{ by: u.id, sq: best.sq, kind: 'darkness', from: z0.from, lv: 2 }]);
    if (B.lightMap) B.lightMap = null;
    M.concentrate(B, u, 'darkness', 'Darkness', function () { B.darks = (B.darks || []).filter(function (d) { return d.by !== u.id; }); if (B.lightMap) B.lightMap = null; B.card(['{p}The darkness lifts.{/}'], 300); });
    D.sfx('magic'); FX.ring(best.c, 'violet', 44);
    var under = hs.filter(function (w) { return G.inArea(w, best.sq) && !shut(w); }).map(function (w) { return w.name; });
    B.card(['{r}' + u.name + ' throws darkness over ' + under.join(', ') + '!{/}  {g}(15 ft of it: nobody sees in, out or across; concentration){/}'], 420);
    yield 40;
    return true;
  };
  // the darkmantle's Darkness Aura (SRD 5.1, 1/day): 15 ft of magical darkness that moves with it while it concentrates; a light
  // spell of 2nd level or lower it overlaps is dispelled (ai.js brute casts it; darkSq follows the creature)
  M.castAura = function* (B, u) {
    u.turn.action = 0; u.aura.used = true;
    var rec = { by: u.id, sq: [], kind: 'darkness', follow: u.id, r: 15 };
    B.darks = (B.darks || []).concat([rec]); M.darkSq(B, rec);
    if (B.lightMap) B.lightMap = null;
    M.concentrate(B, u, 'aura', 'Darkness Aura', function () { B.darks = (B.darks || []).filter(function (d) { return d !== rec; }); if (B.lightMap) B.lightMap = null; B.card(['{p}The dark round the darkmantle thins away.{/}'], 300); });
    var gone = [];
    B.units.forEach(function (w) { if (w.conds.light && G.inArea(w, rec.sq)) { delete w.conds.light; gone.push(w.name + '\'s light'); } });
    D.sfx('magic'); FX.ring(u, 'violet', 44);
    B.card(['{r}The ' + B.shortName(u) + '{/} pulls the dark in round itself: {p}15 ft of magical darkness{/} that goes where it goes' + (gone.length ? ', and ' + gone.join(', ') + ' goes out' : '') + '.  {g}(concentration){/}'], 420);
    yield 40;
    return true;
  };
  // a shove away from `from`, n squares (Thunderwave's 10 ft): each square only if the body can stand there
  M.push = function (B, from, w, n) {
    if (!w || w.dead || w.hp <= 0 || w.bound) return;
    if (w.hang && G.hanging(w)) { B.clingSave(w, 0, w.hang.rope ? ' is knocked off the rope' : ' is knocked off the face'); return; } // (a climber pushed -- Thunderwave, Gust of Wind -- comes off and falls its height, no second save; it had walked its foot square along the street and stood there unhurt. 10-05, Griz: "2 agreed")
    if (w.riding) return; // (a rider -- a darkmantle on a head, a familiar on its wizard -- goes where the one it rides goes: battle.js mount)
    var dx = Math.sign(w.x - from.x), dy = Math.sign(w.y - from.y), x0 = w.x, y0 = w.y, moved = 0;
    if (!dx && !dy) return;
    for (var i = 0; i < n; i++) { if (!G.canStand(w, w.x + dx, w.y + dy)) break; w.x += dx; w.y += dy; moved++; }
    if (!moved) return;
    if (B.forced) B.forced(w); // (a forced move: the readied strikes asked when the action is done -- battle.js readyForced, the grid's rules §2.5)
    w.tween = { fx: x0, fy: y0, fz: G.gzAt(w, x0, y0), t: 0, dur: B.pace(10, true) }; // (a shove on an AI-run unit's turn keeps to the pace: Battle.prototype.pace)
    FX.float('pushed ' + moved * 5 + ' ft', w, D.PAL.ramps.silver[5]);
  };
  // a poison that wears off (09-27): the save at the end of the poisoned one's turn (M.endTurn calls it)
  M.poisonSave = function (B, u) {
    var q = u.conds.poisoned;
    if (!q || !q.save || u.hp <= 0) return;
    var sv = RU.save(u, q.save, q.dc, RU.vsPoison(u)); // (Protection from Poison: advantage on a save against a poison)
    B.card([(u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}') + ' fights the poison: CON ' + RU.saveText(sv) + ' vs DC ' + q.dc + '  ' + (sv.ok ? '{n}IT PASSES{/}' : '{g}still poisoned{/}')]);
    if (sv.ok) delete u.conds.poisoned;
  };
  // breaking out of a web: an action, a STR check against the caster's DC
  // asleep -- the SRD's Unconscious (Sleep, Eyebite's sleep; 10-01c, "compare with sleep", Griz: "agree with lean, approved"): it falls prone (so a shot from
  // beyond 5 ft loses the sleeper's advantage to the prone's disadvantage, and one woken gets up for half its move) and drops what it holds -- a torch falls
  // and burns, a lantern is set down as it was, hooded or not (js/light.js dropTorch); the weapon stays in hand (the seat's lean: a dropped weapon would want
  // picking up). A record, not `true`: the M.cast wrapper stamps where it was cast, so a Globe of Invulnerability can hold it off (js/grimoire.js)
  M.fallAsleep = function (B, w, rec) {
    w.conds.asleep = rec || {};
    if (!w.conds.prone && !w.noProne && !RU.immuneTo(w, 'prone')) w.conds.prone = true; // (a flier comes down: SRD 5.1, it falls)
    if (w.torch && D.light && D.light.dropTorch) D.light.dropTorch(B, w);
  };
  M.breakFree = function* (B, u) {
    // a grip is escaped with Athletics or Acrobatics, whichever is better (the SRD's escape); a web is torn with STR
    var r = u.conds.restrained, gd = u.conds.guidance ? D.d(4) : 0, grip = r.grapple || r.kind === 'tentacles', en0 = u.conds.enlarged; // (r.weak: the roper's tendril, js/traits.js)
    // a STR check: Enlarge is advantage on it, Reduce disadvantage (SRD), against poisoned, frightened and the weak grip's disadvantage
    // ... and Enhance Ability on the ability it raised, Heat Metal's burning armour on every check (rules.js checkEdges). One ability's check, looked at:
    // its bonus (the modifier, the proficiency of the skill its class has) and the edges on it -- 10-01: a grip's pick between STR (Athletics) and DEX
    // (Acrobatics) weighs the edges as well as the modifier (Bull's Strength on a strong one, Cat's Grace on a nimble one: an advantage is worth about +5), not the raw modifier
    var look = function (ab) {
      var ce = RU.checkEdges(u, ab), s = ab === 'str';
      var adv = !!(s && en0 && !en0.down) || ce.adv.length > 0, dis = !!(u.conds.poisoned || u.conds.frightened || (s && r.weak) || (s && en0 && en0.down)) || ce.dis.length > 0; // (weak: the tendril's disadvantage is on STR checks -- SRD 5.1 -- not on the Acrobatics way out; it had both, 10-02)
      var bonus = D.mod(u.abil[ab]) + (u.cls === 'fighter' || (!s && u.cls === 'rogue') ? u.prof : 0);
      return { ce: ce, adv: adv, dis: dis, bonus: bonus, worth: bonus + (adv && !dis ? 5 : dis && !adv ? -5 : 0) };
    };
    var ls = look('str'), ld = look('dex'), useDex = !!grip && ld.worth > ls.worth, lk = useDex ? ld : ls, ce = lk.ce, adv = lk.adv, dis = lk.dis;
    var d = (dis && !adv ? Math.min(D.d(20), D.d(20)) : adv && !dis ? Math.max(D.d(20), D.d(20)) : D.d(20)) + gd;
    var edge = adv && !dis && ce.adv.length ? ' {n}(advantage: ' + ce.adv.join(', ') + '){/}' : dis && !adv && ce.dis.length ? ' {o}(disadvantage: ' + ce.dis.join(', ') + '){/}' : '';
    var tot = d + lk.bonus;
    u.turn.action = 0; RU.spendHelp(u); // (a friend's Help on it, spent on this check -- 10-01c)
    var luck = RU.darkLuck(u, r.dc - tot); if (luck) tot += luck; // (Dark One's Own Luck, the Fiend's 6: a d10 on a check that falls short)
    B.card([(u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}') + (r.grapple ? ' wrenches at the grip: ' : r.kind === 'vines' ? ' tears at the vines: ' : ' tears at the web: ') + (useDex ? 'DEX' : 'STR') + ' d20 ' + d + edge + (luck ?' {y}+' + luck + ' dark one\'s own luck{/}' : '') + ' = ' + tot + ' vs DC ' + r.dc + '  ' + (tot >= r.dc ? '{n}FREE{/}' : '{g}still ' + (r.grapple ? 'held' : 'stuck') + '{/}')]);
    if (tot >= r.dc) {
      // (torn free: it goes on through the web this turn, with what the turn would have left it -- the walking startTurn set (Haste's double, Slow's half, Ray of Frost's
      // 10 ft off; moveFull, above), less what it has already walked (turn.moved) -- not its bare speed; a dancer none, as before. 10-01)
      delete u.conds.restrained; var T0 = u.turn; T0.move = u.conds.dancing ? 0 : Math.max(0, (T0.moveFull != null ? T0.moveFull : u.speed) - (T0.moved || 0)); T0.webSaved = true;
      // ... and the whole of the hold goes with the grip, now: what it held over the eyes too (the darkmantle off the head), not at the turn's end (battle.js sweep).
      // (10-01, Griz in the Fork: Barley broke free and walked off still blind, and the darkmantle's opportunity attack had advantage on him for it)
      var by = B.units.filter(function (w) { return w.id === r.by; })[0], bl = u.conds.blinded, sawNot = !!(by && bl && bl.held && bl.by === by.id);
      if (by) B.release(by, u);
      if (sawNot && !u.conds.blinded) B.card(['{g}' + (u.side === 'foe' ? 'The ' + B.shortName(u) : u.name) + ' can see again.{/}'], 200);
      // ... and a prone one gets up for it (SRD 5.1: standing "costs an amount of movement equal to half your speed"): rules.js startTurn would not stand it at the turn's
      // start -- restrained is no speed to pay with -- so it comes free still flat, and went on at the full move. Half its speed comes off, as startTurn takes it (the
      // slowed, the cold and the hasted halve and double the cost as they do the move: onStart, grimoire.js); not while it laughs or dances (startTurn's own noMove). 10-01
      var cd = u.conds;
      if (cd.prone && u.hp > 0 && !u.dead && !(cd.laughing || cd.dancing || cd.paralyzed || cd.stunned || cd.asleep || cd.incapacitated || u.speed === 0)) {
        var fm = function (x) { if (cd.frosted) x = Math.max(0, x - 10); if (cd.slowed) x = Math.floor(x / 2); if (cd.hasted) x *= 2; return x; };
        delete cd.prone; T0.move = Math.max(0, T0.move - (fm(u.speed) - fm(Math.floor(u.speed / 2))));
        B.card(['{g}' + (u.side === 'foe' ? 'The ' + B.shortName(u) : u.name) + ' gets up (half the move).{/}'], 200);
      }
    }
    yield 30;
  };
  M.webbed = function (B, x, y) { return (B.webs || []).some(function (w) { return w.sq.some(function (q) { return q[0] === x && q[1] === y; }) && !(M.zoneGlobed && M.zoneGlobed(B, w, { x: x, y: y })); }); }; // (a square inside a globe the web was cast from outside of is no part of it)
  // fire on a web (SRD 5.1 Web: "The webs are flammable. Any 5-foot cube of webs exposed to fire burns away in 1 round, dealing 2d4
  // fire damage to any creature that starts its turn in the fire"; an ettercap's and a spider's webbing are vulnerable to fire): the
  // squares go at once -- no longer slowing or holding, whoever they held is free -- and burn on for the rest of the round (RULED
  // 09-30, Griz: "Yes, fire burns them"; the strung webs as a cast one). From a fire area (area()), fire on one standing in a web
  // (battle.js hurt), a thrown torch (light.js). A cast web burned away entire ends its caster's hold on it
  M.burnWebs = function (B, sqs, by) {
    if (!B || !(B.webs || []).length || !sqs || !sqs.length) return 0;
    var key = {}, burnt = [], gone = [];
    sqs.forEach(function (q) { key[q[0] + ',' + q[1]] = 1; });
    B.webs.forEach(function (w) {
      var had = w.sq.length;
      w.sq = w.sq.filter(function (q) { if (key[q[0] + ',' + q[1]]) { burnt.push(q); return false; } return true; });
      if (had && !w.sq.length && w.by !== 'the ground') gone.push(w.by);
    });
    if (!burnt.length) return 0;
    B.webFire = (B.webFire || []).concat([{ sq: burnt, round: B.round, by: by || null }]);
    var freed = B.units.filter(function (w) {
      var r = w.conds.restrained;
      if (!r || r.grapple || r.kind === 'tentacles' || r.kind === 'vines' || !G.inArea(w, burnt)) return false;
      delete w.conds.restrained; return true;
    });
    burnt.forEach(function (q) { FX.sparkle({ x: q[0], y: q[1], size: 1 }, 'fire', 8); });
    D.sfx('fire');
    B.card(['{o}The web catches{/}: ' + burnt.length + ' square' + (burnt.length > 1 ? 's' : '') + ' of it burn away.' + (freed.length ? '  {y}' + freed.map(function (w) { return w.side === 'foe' ? B.shortName(w) : w.name; }).join(', ') + ' ' + (freed.length > 1 ? 'are' : 'is') + ' free{/} (2d4 fire to any who start a turn in it).' : '  {g}(2d4 fire to any who start a turn in it){/}')], 300);
    gone.forEach(function (id) { var c = B.units.filter(function (w) { return w.id === id; })[0]; if (c && c.conc && c.conc.id === 'web') M.endConc(B, c, 'the web burned'); });
    return burnt.length;
  };
  // the start of a turn in a burning web: 2d4 fire (the fire lasts out the round it caught in)
  M.webFireTurn = function (B, u) {
    if (!B || !(B.webFire || []).length) return;
    B.webFire = B.webFire.filter(function (e) { return e.round >= B.round; });
    var e = B.webFire.filter(function (f) { return G.inArea(u, f.sq); })[0];
    if (!e || u.hp <= 0 || u.dead) return;
    var r = D.roll('2d4');
    B.card([(u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}') + ' starts its turn in the burning web: 2d4 ' + RU.fmtRolls(r.rolls) + ' = ' + r.total + ' fire'], 260);
    B.hurt(u, r.total, 'fire', MAGIC);
  };
})();
