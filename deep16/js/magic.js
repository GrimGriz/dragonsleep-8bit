/* DEEP16 — spells on the grid. What each spell is comes from the 8-bit game's content/spells.json (level, dice, save,
   element) plus data/spells.js (range, shape, casting time, concentration). This file says what can be cast now (slots,
   the action and bonus action, the bonus-action-spell rule), which squares or creatures a shape takes, and what the
   spell does -- damage and saves, conditions (restrained, paralyzed, asleep, invisible), buffs, heals -- and holds
   concentration (a new concentration spell ends the old; damage asks a CON save, DC 10 or half the damage). */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx;
  var M = D.magic = {};

  M.data = function (id) { return (window.DS.DATA.spells[id]) || (D.EXTRA_SPELLS || {})[id]; };
  // house rules the seat proposes, each a switch (torchdark, 09-28): Magic Missile may be aimed at a square the caster cannot see
  // into -- "at the darkness" -- and its darts strike whatever stands there. OPEN for Griz's word (handoff 09-28 §3G)
  D.RULES = D.RULES || {}; if (D.RULES.missilesAtTheDark == null) D.RULES.missilesAtTheDark = true;
  // a square Magic Missile may be thrown at blind: open, in range and line, and one the caster cannot see into (dark, darkness, fog)
  M.missileDark = function (B, u, g, x, y) {
    if (!D.RULES.missilesAtTheDark || g.shape !== 'darts') return false;
    var s = G.map.at(x, y); if (!s || !s.open || !M.inRange(u, g, x, y)) return false;
    var v = M.seeWhy(B, u, { x: x, y: y, size: 1, conds: {} });
    return !v.ok && (v.why === 'dark' || v.why === 'darkness' || v.why === 'fog' || v.why === 'the cloud' || v.why === 'sleet');
  };
  M.geo = function (id) { return D.SPELLS[id] || { shape: 'none', why: 'not on the grid yet' }; };
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
  M.list = function (B, u) {
    var T = u.turn;
    return (u.known || []).map(function (id) {
      var sp = M.data(id), g = M.geo(id);
      if (!sp || (!sp.battle && !sp.grid && g.shape !== 'none')) return null; // (grid: a spell only DEEP16's fights can use, Misty Step)
      var e = { id: id, name: sp.name, level: sp.level, g: g, sp: sp, levels: sp.level ? M.slotLevels(u, sp.level) : [0] };
      e.slot = e.levels[0] || sp.level;
      // Dancing Lights already up: casting it again is the SRD's bonus action that moves the lights (no new concentration)
      if (id === 'dancinglights' && u.conc && u.conc.id === 'dancinglights') e.g = g = Object.assign({}, g, { time: 'B', move: true });
      // a spell already up that is used again (js/grimoire.js geo: the floating weapon's swing, a mark moved): `free` spends no slot,
      // `move` is no new bonus-action spell
      var ex = M.EFFECT && M.EFFECT[id];
      if (ex && ex.geo) { var g2 = ex.geo(B, u, g); if (g2) e.g = g = g2; }
      if (g.free) e.levels = [e.level];
      var why = '';
      // under a roost (the rescue in the dens), its one law: no fire, no thunder (the 8-bit game greys them too, RULED 09-24)
      if (B.fight && B.fight.roost && /fire|thunder/.test(sp.el || '')) why = 'the roost overhead: no fire, no thunder';
      else if (g.shape === 'none' || g.shape === 'reaction') why = g.why;
      else if (sp.level && !e.levels.length) why = 'no slot of level ' + sp.level + ' or higher';
      else if (g.time === 'B' && !T.bonus) why = 'the bonus action is spent';
      else if (g.time === 'A' && (!T.action || T.attacksLeft)) why = 'the action is spent';
      else if (g.time === 'B' && !g.move && T.spellAction === 'leveled') why = 'a levelled spell was cast this turn: no bonus-action spell too';
      else if (g.time === 'B' && !g.move && T.bonusSpell) why = 'one bonus-action spell a turn';
      else if (g.time === 'A' && T.bonusSpell && sp.level) why = 'after a bonus-action spell, only a cantrip';
      else if (g.unarmored && !M.touchTargets(B, u, g).length) why = 'no one within reach without armour';
      else if (id === 'seeinvisibility' && u.seeInvisible) why = 'already seeing the unseen';
      // a spell's own say (js/grimoire.js): nothing to cure, a ward already on, no metal to heat
      if (!why && ex && ex.list) { var r = ex.list(B, u, e); if (r && r.why) why = r.why; if (r && r.g) e.g = g = r.g; }
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
      case 'sphere': if (e.id === 'daylight') return '60-ft sphere of daylight within 60 ft: bright 60, dim 60 more · burns away a Darkness it touches' + roostNote(B);
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
      case 'touch': return 'touch · ' + ({ curewounds: (1 + Math.max(0, e.slot - 1)) + 'd8' + RU.sign(M.mod(u)) + ' healing', mageArmor: 'no armour: AC 13 + DEX', greaterinvisibility: 'invisible' + conc, stoneskin: 'half from blades, bolts, bites' + conc, heroism: 'fearless, temp HP each turn' + conc, lesserrestoration: 'ends poison, paralysis, blindness',
        light: 'a light on you or an ally beside you: bright 20 ft, dim 20 more, for the fight' + roostNote(B), darkvision: 'sees in the dark to 60 ft', invisibility: 'unseen till they attack or cast' + conc,
        continualflame: 'a heatless flame on them: bright 20 ft, dim 20 more, and it never goes out' + roostNote(B), trueseeing: 'truesight 120 ft: the dark, the invisible, the fog' }[e.id] || '');
    }
    return g.why || '';
  };

  function roostNote(B) { return B && B.fight && B.fight.roost ? ' -- {r}BRIGHT LIGHT, UNDER THE ROOST{/}' : ''; }

  // ------------------------------------------------------------------ shapes
  M.inRange = function (u, g, x, y) { return Math.max(Math.abs(x - u.x), Math.abs(y - u.y)) * 5 <= (g.range || 0) && G.losPoint(u.x, u.y, x, y); };
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
  M.humanoid = function (w) {
    if (w.side === 'party') return true;
    if (w.type) return w.type === 'humanoid'; // (the creature type on every sheet, 09-28)
    var m = window.DS.DATA.monsters[w.kind], f = D.FOES[w.kind] || {};
    return !!(f.humanoid || (m && (m.tags || []).indexOf('humanoid') >= 0));
  };
  M.touchTargets = function (B, u, g) {
    return B.units.filter(function (w) {
      if (w.dead || w.side !== u.side) return false;
      if (w !== u && G.dist(u, w) > 5) return false;
      if (g.unarmored && (w.armored || w.conds.mageArmor)) return false;
      return true;
    });
  };
  // is w a target for this spell from u (single, attack, rays, darts, splash, allies, touch)?
  M.targetOK = function (B, u, g, w) {
    if (!w || w.dead || w.ethereal) return false;
    if (g.shape === 'touch') return M.touchTargets(B, u, g).indexOf(w) >= 0;
    var foeWanted = g.shape === 'attack' || g.shape === 'rays' || g.shape === 'darts' || g.shape === 'splash' || g.side === 'foe';
    if (foeWanted && (!G.hostile(u, w) || w.hp <= 0)) return false;
    if (((g.shape === 'allies' && g.side !== 'foe') || g.side === 'ally') && w.side !== u.side) return false; // (Bane: an `allies` shape aimed at foes)
    if (g.only === 'humanoid' && !M.humanoid(w)) return false;
    // "a creature you can see": Hold, Shield of Faith, Magic Missile, Acid Splash -- not Bless or Aid (SRD: "creatures of your choice
    // within range"; you know where your own are in the dark). Magic Missile at the dark: ui.js aims it at a square (the gimmick)
    if ((g.shape === 'single' || g.shape === 'darts' || g.shape === 'splash') && w !== u && !M.sees(B, u, w)) return false;
    if (G.dist(u, w) > (g.range || 5)) return false;
    return G.los(u, w).clear || w === u;
  };

  // ------------------------------------------------------------------ concentration
  M.concentrate = function (B, u, id, name, undo) {
    if (u.conc) M.endConc(B, u, 'a new spell');
    u.conc = { id: id, name: name, undo: undo };
  };
  M.endConc = function (B, u, why) {
    if (!u.conc) return;
    var c = u.conc; delete u.conc;
    c.undo();
    B.card(['{y}' + u.name + '{/} lets go of ' + c.name + (why ? ' (' + why + ')' : '') + '.']);
  };
  M.concCheck = function (B, u, dmg) {
    if (!u.conc || u.hp <= 0) return;
    var dc = Math.max(10, Math.floor(dmg / 2)), sv = RU.save(u, 'con', dc);
    B.card(['{y}' + u.name + '{/} holds ' + u.conc.name + '? CON ' + RU.saveText(sv) + ' vs DC ' + dc + '  ' + (sv.ok ? '{n}HELD{/}' : '{o}LOST{/}')]);
    if (!sv.ok) M.endConc(B, u, 'the blow');
  };
  function lift(B, list, cond) { list.forEach(function (w) { delete w.conds[cond]; }); }

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
    if (T.quicken && g.time === 'A' && sp.level) g = Object.assign({}, g, { time: 'B' }); // (Quickened Spell: js/features.js)
    if (g.time === 'B') { T.bonus = 0; if (!g.move) T.bonusSpell = true; } else { T.action = 0; T.spellAction = g.free ? T.spellAction : sp.level ? 'leveled' : 'cantrip'; }
    if (sp.level && !g.free) u.slots[slot - 1]--;
    var head = '{y}' + u.name + '{/}: ' + sp.name.toUpperCase() + (sp.level ? ' (L' + slot + ')' : '');
    var dc = u.spellDC, n = up(sp, slot);
    if (g.shape !== 'self' && g.shape !== 'touch') { var at = t && t.x != null ? { x: t.x, y: t.y, size: 1 } : t && t.units ? t.units[0] : t; if (at) u.facing = B.faceTo(u, at); }
    u.anim = 'attack'; u.animT = B.t;
    D.sfx(M.sound(sp));
    yield 10;

    // the spells built for the class NPCs (09-28, js/grimoire.js): each its own; the rest below as they were
    var FXD = M.EFFECT && M.EFFECT[id];
    if (FXD && FXD.cast) { yield* FXD.cast(B, u, t, slot, head, { sp: sp, g: g, dc: dc, up: n }); u.anim = 'idle'; return; }

    if (g.shape === 'attack' || g.shape === 'rays') {
      var shots = g.shape === 'rays' ? t.units : [t], dice = g.shape === 'rays' ? sp.dmg : M.dice(sp, u, slot);
      if (g.shape === 'rays') B.card([head + ' -- ' + shots.length + ' rays']);
      for (var i = 0; i < shots.length; i++) {
        if (shots[i].dead || shots[i].hp <= 0) continue;
        yield* B.attack(u, shots[i], { name: sp.name, atk: u.spellAtk, dice: dice, mod: 0, type: sp.el, spell: true, ranged: true, range: [g.range, g.range], fx: 'fire' });
      }
    } else if (g.shape === 'darts') {
      // "Magic Missile at the darkness" (Griz, 09-28: "we have to do [the] magic missile at the darkness gimmick somewhere in the
      // game"): a dart aimed at a square the caster cannot see into (t.units holds { x, y, dark: true }) flies anyway. Whatever
      // stands there takes it -- the darts never miss -- and an empty square takes nothing but the slot. RULES.missilesAtTheDark
      var darts = t.units.map(function (w) { if (!w.dark) return w; var at = G.occupant(w.x, w.y); return (at && at.hp > 0 && !at.dead && G.hostile(u, at)) ? at : { x: w.x, y: w.y, size: 1, dark: true, id: 'dark' + w.x + ',' + w.y, name: 'the darkness' }; });
      var atDark = t.units.some(function (w) { return w.dark; });
      // the gimmick (Griz, 09-28, the livestreams' branding): in the fight that carries it (data/fights.js `gimmick: 'darkness'`, the cloaker's
      // deep gallery), the first Magic Missile thrown at the darkness is a cutscene -- a close-up of the caster and his clip, then the
      // cloaker hit, then its face and the line -- and the thing struck comes for the caster (ai.js brute: grudge)
      var gim = B.fight && B.fight.gimmick === 'darkness' && atDark && u.side === 'party' && !B.gimmickDone;
      if (gim) yield { scene: { who: u, anim: 'attack', facing: 0, scale: 3, frames: 250, clip: 'audio/attacking_the_darkness.mp3', caption: 'MAGIC MISSILE. AT THE DARKNESS.' } };
      var lines = [head + ' -- ' + darts.length + ' darts, each 1d4+1 force, never missing' + (atDark ? '  {p}AT THE DARKNESS{/}' : '')], tot = {}, who = {}, struck = [];
      for (var k = 0; k < darts.length; k++) { FX.projectile(u, darts[k], 'fire'); }
      yield { fx: 1 };
      darts.forEach(function (w) { var r = D.roll('1d4+1'); tot[w.id] = (tot[w.id] || 0) + r.total; who[w.id] = w; });
      Object.keys(tot).forEach(function (wid) { var w = who[wid]; if (w.dark) { lines.push('  {g}' + tot[wid] + ' force into the dark: nothing there.{/}'); return; } lines.push('  ' + w.name + ': {r}' + tot[wid] + '{/}' + (M.sees(B, u, w) ? '' : ' {p}(something was there){/}')); B.hurt(w, tot[wid], 'force'); if (w.side === 'foe') struck.push(w); });
      B.card(lines, 360); yield 30;
      if (gim && struck.length) {
        B.gimmickDone = true;
        var c = struck[0]; if (!c.dead && c.hp > 0) c.grudge = u.id;
        yield { scene: { who: c, scale: 1.3, frames: 110, hit: true, caption: 'THE DARTS FIND IT.' } };
        yield { scene: { who: c, face: true, scale: 3, frames: 210, tone: 'red', clip: 'audio/the_darkness_attacks_back.mp3', caption: 'AND THE DARKNESS ATTACKS BACK.' } };
      }
    } else if (g.shape === 'splash') {
      var first = t, second = B.units.filter(function (w) { return w !== first && G.hostile(u, w) && G.standing(w) && G.dist(first, w) <= 5; })[0];
      var potent = u.subclass === 'School of Evocation' && u.lvl >= 6; // (Potent Cantrip, the evoker's 6: half on a save)
      var dd = M.dice(sp, u, 0), r1 = D.roll(dd), lines2 = [head + '  ' + dd + ' ' + RU.fmtRolls(r1.rolls) + ' = ' + r1.total + ' acid  DEX DC ' + dc + (potent ? ', half on a save (potent)' : ', no half')];
      FX.projectile(u, first, 'fire'); yield { fx: 1 };
      [first, second].filter(Boolean).forEach(function (w) {
        var sv = RU.save(w, 'dex', dc);
        lines2.push('  ' + w.name + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' + (potent ? ' -> ' + Math.floor(r1.total / 2) : '') : '{o}failed -> ' + r1.total + '{/}'));
        if (!sv.ok) B.hurt(w, r1.total, 'acid'); else if (potent) B.hurt(w, Math.floor(r1.total / 2), 'acid');
      });
      B.card(lines2, 360); yield 30;
    } else if (g.shape === 'sphere' || g.shape === 'cube' || g.shape === 'cone' || g.shape === 'line' || g.shape === 'wave') {
      yield* area(B, u, id, sp, g, slot, t.x, t.y, head);
    } else if (g.shape === 'single') {
      if (id === 'holdmonster' || id === 'holdperson') {
        var sv2 = RU.save(t, 'wis', dc);
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
        who.forEach(function (w) { w.maxhp += add; w.hp = w.hp > 0 ? w.hp + add : add; if (w.ko) { w.ko = false; w.anim = 'idle'; } FX.sparkle(w, 'gold', 10); FX.float('+' + add, w, D.PAL.ramps.moss[2]); });
        B.card([head + ': ' + who.map(function (w) { return w.name; }).join(', ') + ' -- {n}+' + add + ' max HP{/} and as much again.']);
      }
      yield 30;
    } else if (g.shape === 'touch' || g.shape === 'self') {
      var w2 = g.shape === 'self' ? u : t;
      if (id === 'curewounds') {
        var cr = D.roll((1 + n) + 'd8'), amt = cr.total + M.mod(u), got = B.heal(w2, amt);
        B.card([head + ' on ' + w2.name + ': ' + (1 + n) + 'd8' + RU.sign(M.mod(u)) + ' ' + RU.fmtRolls(cr.rolls) + ' = {n}' + amt + '{/}' + (got <= 0 ? ' (already whole)' : got < amt ? ' (' + got + ' to full)' : '')]);
      } else if (id === 'lesserrestoration') {
        var gone = ['poisoned', 'paralyzed', 'blinded'].filter(function (c) { return w2.conds[c]; });
        gone.forEach(function (c) { delete w2.conds[c]; });
        B.card([head + ' on ' + w2.name + ': ' + (gone.length ? gone.join(', ') + ' ended.' : 'nothing to end.')]);
      } else if (id === 'mageArmor') {
        w2.conds.mageArmor = true; w2.baseAC = Math.max(w2.baseAC, 13 + D.mod(w2.abil.dex));
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
        w2.conds.light = { by: u.id };
        yield* M.brighten(B, u, 'light', head + ' on ' + (w2 === u ? 'his own gear' : w2.name) + ': a steady light, {y}bright 20 ft{/} and dim 20 more.', { x: w2.x, y: w2.y, bright: 20 });
      } else if (id === 'continualflame') {
        w2.conds.continualFlame = { by: u.id }; if (w2.src) { w2.src.conds = w2.src.conds || {}; w2.src.conds.continualFlame = (w2.src.equip && w2.src.equip.weapon) || true; } // (on the weapon in hand; it never goes out: the 8-bit sheet keeps it, js/embed.js)
        yield* M.brighten(B, u, 'flame', head + ' on ' + (w2 === u ? 'his own gear' : w2.name) + ': a flame with no heat in it, {o}bright 20 ft{/} and dim 20 more, that will not go out.', { x: w2.x, y: w2.y, bright: 20 });
      } else if (id === 'darkvision') {
        w2.darkvision = Math.max(w2.darkvision || 0, 60); w2.conds.darkvision = { by: u.id };
        B.card([head + ' on ' + w2.name + ': the dark opens out to {c}60 ft{/}, grey and plain.']);
      } else if (id === 'invisibility') {
        w2.conds.invisible = { by: u.id, ends: true }; delete w2.conds.hidden;
        M.concentrate(B, u, id, sp.name, function () { delete w2.conds.invisible; });
        B.card([head + ' on ' + w2.name + ': gone from sight till they attack or cast (concentration).']);
      } else if (id === 'trueseeing') {
        w2.truesight = 120; w2.conds.truesight = { by: u.id };
        B.card([head + ' on ' + w2.name + ': {c}truesight{/} to 120 ft -- the dark, the fog and the invisible are nothing to them.']);
      } else if (id === 'seeinvisibility') {
        u.seeInvisible = true; u.conds.seeInvisible = { by: u.id };
        B.card([head + ': the invisible stand plain to him, ghostly and grey.']);
      } else if (id === 'mislead') {
        u.conds.invisible = { by: u.id, ends: true }; u.images = Math.max(u.images || 0, 1); delete u.conds.hidden;
        M.concentrate(B, u, id, sp.name, function () { delete u.conds.invisible; u.images = 0; });
        B.card([head + ': he is gone, and a double of him stands where he stood (a blow may go at it; the invisibility ends if he attacks or casts; concentration).']);
      } else if (id === 'passwithouttrace') {
        var veiled = B.units.filter(function (w) { return w.side === u.side && G.standing(w) && G.dist(u, w) <= 30; });
        veiled.forEach(function (w) { w.conds.pwt = { by: u.id }; });
        M.concentrate(B, u, id, sp.name, function () { lift(B, veiled, 'pwt'); });
        B.card([head + ': a veil of shadow over ' + veiled.map(function (w) { return w.name; }).join(', ') + ' -- {c}+10 Stealth{/} (concentration).']);
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
    var ramp = id === 'daylight' || id === 'dancinglights' ? 'bone' : id === 'fogcloud' || id === 'sleetstorm' ? 'silver' : id === 'stinkingcloud' ? 'moss' : sp.el === 'cold' || sp.el === 'lightning' ? 'glow' : sp.el === 'thunder' ? 'silver' : sp.el === 'force' ? 'bone' : 'fire';
    if (g.shape === 'sphere' || g.shape === 'cube') { FX.projectile(u, { x: cx, y: cy, size: 1 }, 'fire'); yield { fx: 1 }; }
    var fromMe = g.shape === 'cone' || g.shape === 'line' || g.shape === 'wave';
    FX.bloom(fromMe ? u.x : cx, fromMe ? u.y : cy, sq, ramp);
    var caught = B.units.filter(function (w) { return G.present(w) && w.hp > 0 && G.inArea(w, sq); });
    var lines = [];
    if (id === 'daylight') {
      // SRD 5.1: bright 60 ft and dim 60 more from a point; on a creature's square it goes with them; a Darkness of 3rd level or
      // lower it overlaps is dispelled (the darkmantle's aura too)
      var burnt = (B.darks || []).filter(function (dk) { return dk.kind !== 'fog' && dk.kind !== 'sleet' && dk.kind !== 'stink' && M.darkSq(B, dk).some(function (q) { return sq.some(function (p) { return p[0] === q[0] && p[1] === q[1]; }); }); });
      var bearer = B.units.filter(function (w) { return G.standing(w) && w.side === u.side && G.inArea(w, [[cx, cy]]); })[0];
      if (bearer) bearer.conds.daylight = { by: u.id }; else B.lights = (B.lights || []).concat([{ id: 'daylight' + u.id, kind: 'daylight', x: cx, y: cy, bright: 60, dim: 60, color: 'bone', by: u.id }]);
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
        if (w.type === 'undead') { lines.push('  ' + w.name + ': {g}the dead do not sleep{/}'); return; }
        if (RU.immuneTo(w, 'asleep')) { lines.push('  ' + w.name + ': {g}nothing in it sleeps{/}'); return; }
        if (w.hp <= left) { left -= w.hp; w.conds.asleep = true; lines.push('  ' + w.name + ' ({r}' + w.hp + '{/}): {p}asleep{/}'); }
        else lines.push('  ' + w.name + ' (' + w.hp + '): too much left in it');
      });
    } else if (id === 'web') {
      lines.push(head + '  a 20-ft cube of sticky web: DEX DC ' + dc + ' or restrained (concentration)');
      var stuck = [];
      caught.forEach(function (w) {
        if (w.webWalker) { lines.push('  ' + w.name + ': {g}walks webs: they do not hold it{/}'); return; }
        if (RU.immuneTo(w, 'restrained')) { lines.push('  ' + w.name + ': {g}cannot be held by it{/}'); return; }
        var sv = RU.save(w, 'dex', dc);
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
      lines.push(head + '  ' + dd + ' ' + RU.fmtRolls(r.rolls) + (r2 ? ' + ' + sp.dmg2 + ' ' + RU.fmtRolls(r2.rolls) : '') + (aff ? ' {y}+' + aff + ' affinity{/}' : '') + ' = {o}' + tot + '{/} ' + sp.el + '  ' + ab.toUpperCase() + ' DC ' + dc);
      var hits = [];
      // Sculpt Spells (the evoker, SRD 5.1 wizard 2): up to 1 + the spell's level of his own in an evocation are spared -- they save, and
      // take nothing where a save would halve it (js/features.js M.sculpted)
      var spared = M.sculpted ? M.sculpted(u, id, sp, caught) : [];
      caught.forEach(function (w) {
        if (spared.indexOf(w) >= 0) { lines.push('  ' + w.name + ': {c}sculpted out of it{/}'); return; }
        var sv = RU.save(w, ab, dc), evade = ab === 'dex' && w.cls === 'rogue' && w.lvl >= 7;
        var d = sv.ok ? (evade ? 0 : (sp.half ? Math.floor(tot / 2) : 0)) : (evade ? Math.floor(tot / 2) : tot);
        lines.push('  ' + w.name + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{o}failed{/}') + (evade ? ' {c}evasion{/}' : '') + ' -> {r}' + d + '{/}');
        hits.push([w, d, sv.ok]);
      });
      if (!caught.length) lines.push('  {g}no one in it.{/}');
      B.card(lines.slice(0, 7), 420);
      yield { fx: 1 };
      hits.forEach(function (h) { B.hurt(h[0], h[1], sp.el); });
      // Thunderwave: a failed save is pushed 10 ft straight away from the caster (stopped by a wall, a creature, the edge)
      if (g.shape === 'wave') hits.forEach(function (h) { if (!h[2]) M.push(B, u, h[0], 2); });
      yield 30;
      return;
    }
    B.card(lines.slice(0, 7), 420);
    yield { fx: 1 };
    yield 30;
  }

  // ------------------------------------------------------------------ the conditions' turns
  // the start of a creature's turn: Heroism's temporary HP; a restrained or paralyzed creature has no move
  M.startTurn = function (B, u) {
    if (u.conds.heroism) u.temp = Math.max(u.temp || 0, u.conds.heroism.each);
    if (B && u.hp > 0 && !u.dead) M.webCatch(B, u, 'starts');
    if (B && u.hp > 0 && !u.dead) M.cloudTurn(B, u);
    if (B && M.onStart) M.onStart(B, u); // (the class NPCs' spells: the guardians, the timers, a word of command -- js/grimoire.js)
    if (u.conds.restrained || u.conds.paralyzed || u.conds.asleep || u.conds.incapacitated) u.turn.move = 0;
  };
  // the clouds, at the start of a turn inside one: Stinking Cloud (SRD: completely within it, CON save against poison or the
  // action is spent retching; nothing that needs no breath or shrugs off poison); Sleet Storm (DEX or prone; a concentrating
  // caster CON DC or loses the spell)
  M.cloudTurn = function (B, u) {
    var who = u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}';
    var stink = (B.darks || []).filter(function (d) { return d.kind === 'stink' && G.foot(u).every(function (p) { return d.sq.some(function (q) { return q[0] === p[0] && q[1] === p[1]; }); }); })[0];
    if (stink && !(RU.immuneTo(u, 'poisoned') || (u.immune && u.immune.indexOf('poison') >= 0))) {
      var sv = RU.save(u, 'con', stink.dc);
      B.card([who + ' in the yellow cloud: CON ' + RU.saveText(sv) + ' vs DC ' + stink.dc + '  ' + (sv.ok ? '{n}holds it down{/}' : '{o}retching and reeling: the action is gone{/}')]);
      if (!sv.ok) { u.turn.action = 0; u.turn.attacksLeft = 0; }
    }
    var sleet = (B.darks || []).filter(function (d) { return d.kind === 'sleet' && G.inArea(u, d.sq); })[0];
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
  M.icy = function (B, x, y) { return (B.darks || []).some(function (d) { return d.kind === 'sleet' && d.sq.some(function (q) { return q[0] === x && q[1] === y; }); }); };
  // a sleet storm entered during a move: the SRD's save for the first square of it that turn (battle.js moveAlong)
  M.sleetCatch = function (B, u) {
    var d = (B.darks || []).filter(function (x) { return x.kind === 'sleet' && G.inArea(u, x.sq); })[0];
    if (!d || u.conds.prone || u.noProne || RU.immuneTo(u, 'prone') || (u.turn && u.turn.sleetSaved)) return false;
    if (u.turn) u.turn.sleetSaved = true;
    var sv = RU.save(u, 'dex', d.dc), who = u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}';
    B.card([who + ' steps onto the ice: DEX ' + RU.saveText(sv) + ' vs DC ' + d.dc + '  ' + (sv.ok ? '{n}keeps their feet{/}' : '{o}down on the ice{/}')]);
    if (sv.ok) return false;
    u.conds.prone = true; return true;
  };
  // SRD Web (09-27: Griz, "I wasn't sure it was applied appropriately (guy looked like he had it but was running around)"):
  // "Each creature that starts its turn in the webs or that enters them during its turn must make a Dexterity saving throw.
  // On a failed save, the creature is restrained." Only a cast web (it has a DC); the strung webs a map starts with are only
  // difficult ground. One save a turn: a creature that saved goes on through that turn
  M.webAt = function (B, u) {
    var f = G.foot(u);
    return (B.webs || []).filter(function (w) { return w.dc && f.some(function (p) { return w.sq.some(function (q) { return q[0] === p[0] && q[1] === p[1]; }); }); })[0] || null;
  };
  M.webCatch = function (B, u, how) {
    var wb = M.webAt(B, u);
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
    if (u.conds.poisoned && u.conds.poisoned.save && !u.conds.paralyzed) M.poisonSave(B, u);
    var p = u.conds.paralyzed;
    if (p && p.save) {
      var sv = RU.save(u, p.save, p.dc);
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
    var lit = B.units.filter(function (w) { return w.side !== u.side && G.standing(w) && (!B.dark || !src || reach(w) || (Lt && Lt.brightAt(B, w))); });
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
  M.darkSq = function (B, d) { // the squares a darkness covers now (the darkmantle's aura goes where it goes)
    if (!d.follow) return d.sq;
    var w = B.units.filter(function (x) { return x.id === d.follow; })[0];
    if (!w || w.dead) return [];
    var cx = w.x + ((w.size || 1) - 1) / 2, cy = w.y + ((w.size || 1) - 1) / 2, k = Math.round(cx) + ',' + Math.round(cy);
    if (d.at !== k) { d.at = k; d.sq = G.sphere(Math.round(cx), Math.round(cy), d.r || 15); }
    return d.sq;
  };
  M.darkKindAt = function (B, x, y) {
    var ds = B.darks || [];
    for (var i = 0; i < ds.length; i++) { var sq = M.darkSq(B, ds[i]); for (var j = 0; j < sq.length; j++) if (sq[j][0] === x && sq[j][1] === y) return ds[i].kind || 'darkness'; }
    return null;
  };
  M.darkAt = function (B, x, y) { return !!M.darkKindAt(B, x, y); };
  M.inDark = function (B, u) { return G.foot(u).some(function (p) { return M.darkAt(B, p[0], p[1]); }); };
  function obscuredBetween(B, a, b) {
    var k = M.darkKindAt(B, a.x, a.y) || M.darkKindAt(B, b.x, b.y);
    if (!k) { var ka = null; G.foot(a).forEach(function (p) { ka = ka || M.darkKindAt(B, p[0], p[1]); }); G.foot(b).forEach(function (p) { ka = ka || M.darkKindAt(B, p[0], p[1]); }); k = ka; }
    if (k) return k;
    var x0 = a.x + ((a.size || 1) - 1) / 2, y0 = a.y + ((a.size || 1) - 1) / 2, dx = b.x + ((b.size || 1) - 1) / 2 - x0, dy = b.y + ((b.size || 1) - 1) / 2 - y0;
    var n = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 2);
    for (var i = 1; i < n; i++) { var kk = M.darkKindAt(B, Math.round(x0 + dx * i / n), Math.round(y0 + dy * i / n)); if (kk) return kk; } // (across it)
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
      if (k && !(a.devilSight && k === 'darkness')) return { ok: false, why: k === 'darkness' ? 'darkness' : k === 'stink' ? 'the cloud' : k };
    }
    if (b.conds && b.conds.invisible && !b.conds.faerie && !a.seeInvisible && !M.inMirror(B, a, b)) return { ok: false, why: 'invisible' };
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
    hs.forEach(function (c) {
      if (Math.max(Math.abs(c.x - u.x), Math.abs(c.y - u.y)) * 5 > K.range) return;
      var sq = G.sphere(c.x, c.y, K.r), n = hs.filter(function (w) { return G.inArea(w, sq) && !M.inDark(B, w); }).length; // (one already in the dark counts for nothing: no second sphere on the same heads)
      if (n > bn) { bn = n; best = { c: c, sq: sq }; }
    });
    if (!best) return false;
    u.turn.action = 0; K.used = true;
    var Lt = D.light, all = Lt ? Lt.all(B) : [];
    var inSq = function (x, y) { return best.sq.some(function (q) { return q[0] === Math.round(x) && q[1] === Math.round(y); }); };
    var near = function (l, r) { return best.sq.some(function (q) { return Math.hypot(q[0] - l.x, q[1] - l.y) * 5 <= r; }); };
    if (all.some(function (l) { return l.kind === 'daylight' && near(l, l.bright); })) { D.sfx('magic'); B.card(['{r}' + u.name + '{/} calls up darkness -- and the daylight burns it away as it forms.'], 300); yield 30; return true; }
    var gone = [];
    B.units.forEach(function (w) { if (w.conds.light && inSq(w.x, w.y)) { delete w.conds.light; gone.push(w.name + '\'s light'); } });
    B.units.forEach(function (w) { if (w.conc && w.conc.id === 'dancinglights' && (B.lights || []).some(function (l) { return l.kind === 'dance' && l.by === w.id && inSq(l.x, l.y); })) { M.endConc(B, w, 'the darkness'); gone.push('the dancing lights'); } });
    if (gone.length) B.card(['{r}' + u.name + '{/} swallows ' + gone.join(', ') + '.'], 300);
    B.darks = (B.darks || []).concat([{ by: u.id, sq: best.sq, kind: 'darkness' }]);
    if (B.lightMap) B.lightMap = null;
    M.concentrate(B, u, 'darkness', 'Darkness', function () { B.darks = (B.darks || []).filter(function (d) { return d.by !== u.id; }); if (B.lightMap) B.lightMap = null; B.card(['{p}The darkness lifts.{/}'], 300); });
    D.sfx('magic'); FX.ring(best.c, 'violet', 44);
    var under = hs.filter(function (w) { return G.inArea(w, best.sq); }).map(function (w) { return w.name; });
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
    var dx = Math.sign(w.x - from.x), dy = Math.sign(w.y - from.y), x0 = w.x, y0 = w.y, moved = 0;
    if (!dx && !dy) return;
    for (var i = 0; i < n; i++) { if (!G.canStand(w, w.x + dx, w.y + dy)) break; w.x += dx; w.y += dy; moved++; }
    if (!moved) return;
    w.tween = { fx: x0, fy: y0, fz: G.gzAt(w, x0, y0), t: 0, dur: 10 };
    FX.float('pushed ' + moved * 5 + ' ft', w, D.PAL.ramps.silver[5]);
  };
  // a poison that wears off (09-27): the save at the end of the poisoned one's turn (M.endTurn calls it)
  M.poisonSave = function (B, u) {
    var q = u.conds.poisoned;
    if (!q || !q.save || u.hp <= 0) return;
    var sv = RU.save(u, q.save, q.dc);
    B.card([(u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}') + ' fights the poison: CON ' + RU.saveText(sv) + ' vs DC ' + q.dc + '  ' + (sv.ok ? '{n}IT PASSES{/}' : '{g}still poisoned{/}')]);
    if (sv.ok) delete u.conds.poisoned;
  };
  // breaking out of a web: an action, a STR check against the caster's DC
  M.breakFree = function* (B, u) {
    // a grip is escaped with Athletics or Acrobatics, whichever is better (the SRD's escape); a web is torn with STR
    var r = u.conds.restrained, gd = u.conds.guidance ? D.d(4) : 0, d = (u.conds.poisoned || u.conds.frightened || r.weak ? Math.min(D.d(20), D.d(20)) : D.d(20)) + gd, useDex = (r.grapple || r.kind === 'tentacles') && D.mod(u.abil.dex) > D.mod(u.abil.str); // (r.weak: the roper's tendril, js/traits.js)
    var tot = d + D.mod(useDex ? u.abil.dex : u.abil.str) + (u.cls === 'fighter' || (useDex && u.cls === 'rogue') ? u.prof : 0);
    u.turn.action = 0;
    B.card([(u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}') + (r.grapple ? ' wrenches at the grip: ' : r.kind === 'vines' ? ' tears at the vines: ' : ' tears at the web: ') + (useDex ? 'DEX' : 'STR') + ' d20 ' + d + ' = ' + tot + ' vs DC ' + r.dc + '  ' + (tot >= r.dc ? '{n}FREE{/}' : '{g}still ' + (r.grapple ? 'held' : 'stuck') + '{/}')]);
    if (tot >= r.dc) {
      delete u.conds.restrained; u.turn.move = u.speed; u.turn.webSaved = true; // (torn free: it goes on through the web this turn)
      var by = B.units.filter(function (w) { return w.id === r.by; })[0]; if (by && by.holding) by.holding = by.holding.filter(function (w) { return w !== u; });
    }
    yield 30;
  };
  M.webbed = function (B, x, y) { return (B.webs || []).some(function (w) { return w.sq.some(function (q) { return q[0] === x && q[1] === y; }); }); };
})();
