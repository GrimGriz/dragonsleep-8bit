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
  M.geo = function (id) { return D.SPELLS[id] || { shape: 'none', why: 'not on the grid yet' }; };
  M.slotLevels = function (u, lvl) { var out = []; for (var i = Math.max(1, lvl) - 1; i < (u.slots || []).length; i++) if (u.slots[i] > 0) out.push(i + 1); return out; };
  M.mod = function (u) { return D.mod(u.abil[u.cls === 'paladin' ? 'cha' : 'int']); };
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
      var why = '';
      // under a roost (the rescue in the dens), its one law: no fire, no thunder (the 8-bit game greys them too, RULED 09-24)
      if (B.fight && B.fight.roost && /fire|thunder/.test(sp.el || '')) why = 'the roost overhead: no fire, no thunder';
      else if (g.shape === 'none' || g.shape === 'reaction') why = g.why;
      else if (sp.level && !e.levels.length) why = 'no slot of level ' + sp.level + ' or higher';
      else if (g.time === 'B' && !T.bonus) why = 'the bonus action is spent';
      else if (g.time === 'A' && (!T.action || T.attacksLeft)) why = 'the action is spent';
      else if (g.time === 'B' && T.spellAction === 'leveled') why = 'a levelled spell was cast this turn: no bonus-action spell too';
      else if (g.time === 'B' && T.bonusSpell) why = 'one bonus-action spell a turn';
      else if (g.time === 'A' && T.bonusSpell && sp.level) why = 'after a bonus-action spell, only a cantrip';
      else if (g.unarmored && !M.touchTargets(B, u, g).length) why = 'no one within reach without armour';
      else if (id === 'daylight' && !(B.darks || []).length && B.bright) why = 'the place is already lit';
      else if (id === 'light' && B.bright) why = 'the place is already lit';
      e.ok = !why; e.why = why;
      return e;
    }).filter(Boolean).sort(function (a, b) { return a.level - b.level || (a.name < b.name ? -1 : 1); });
  };

  // a spell's grid summary, at the chosen slot: what the list and the ring say about it
  M.summary = function (e, u) {
    var g = e.g, sp = e.sp, d = sp.dmg ? M.dice(sp, u, e.slot) : '', n = (g.n || 1) + Math.max(0, e.slot - e.level);
    var save = sp.save ? sp.save.toUpperCase() + (sp.half ? ' half' : '') : '', conc = g.conc ? ' · conc' : '';
    switch (g.shape) {
      case 'attack': return 'spell attack, ' + g.range + ' ft · ' + d + ' ' + sp.el;
      case 'rays': return n + ' rays, ' + g.range + ' ft · ' + sp.dmg + ' ' + sp.el + ' each';
      case 'darts': return n + ' darts, ' + g.range + ' ft · 1d4+1 force each, never miss';
      case 'splash': return 'a foe within ' + g.range + ' ft (and one beside it) · DEX · ' + d + ' acid';
      case 'cone': return g.len + '-ft cone · ' + save + ' · ' + d + ' ' + sp.el;
      case 'line': return g.len + '-ft line · ' + save + ' · ' + d + ' ' + sp.el;
      case 'sphere': if (e.id === 'daylight') return '60-ft sphere of daylight within 60 ft · dispels a Darkness it touches';
        return e.id === 'sleep' ? (g.pool + g.poolUp * Math.max(0, e.slot - 1)) + 'd8 HP of sleep, ' + g.r + '-ft sphere within ' + g.range + ' ft' : g.r + '-ft sphere within ' + g.range + ' ft · ' + save + ' · ' + d + (sp.dmg2 ? ' + ' + sp.dmg2 : '') + ' ' + sp.el;
      case 'cube': return g.size + '-ft cube within ' + g.range + ' ft · DEX or restrained' + conc;
      case 'wave': return '15-ft cube out from you · CON half · ' + d + ' thunder, a failed save pushed 10 ft';
      case 'single': return e.id === 'holdmonster' ? 'a foe within 90 ft · WIS or paralyzed' + conc : e.id === 'holdperson' ? 'a humanoid within 60 ft · WIS or paralyzed' + conc : 'an ally within ' + g.range + ' ft · +2 AC' + conc;
      case 'allies': return 'up to ' + n + ' within ' + g.range + ' ft · ' + (e.id === 'bless' ? '+1d4 to attacks and saves' + conc : '+' + 5 * Math.max(1, e.slot - 1) + ' max HP');
      case 'self': return e.id === 'light' ? 'bright light for the fight: what hates light loses a turn, then fights at disadvantage' + (D.battle && D.battle.fight && D.battle.fight.roost ? ' -- {r}UNDER THE ROOST{/}' : '') : '+1d4 radiant on weapon hits' + conc;
      case 'teleport': return '30 ft, to a square you can see';
      case 'touch': return 'touch · ' + ({ curewounds: (1 + Math.max(0, e.slot - 1)) + 'd8' + RU.sign(M.mod(u)) + ' healing', mageArmor: 'no armour: AC 13 + DEX', greaterinvisibility: 'invisible' + conc, stoneskin: 'half from blades, bolts, bites' + conc, heroism: 'fearless, temp HP each turn' + conc, lesserrestoration: 'ends poison, paralysis, blindness' }[e.id] || '');
    }
    return g.why || '';
  };

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
    if ((g.shape === 'allies' || g.side === 'ally') && w.side !== u.side) return false;
    if (g.only === 'humanoid' && !M.humanoid(w)) return false;
    if ((g.shape === 'single' || g.shape === 'darts' || g.shape === 'allies' || g.shape === 'splash') && w !== u && !M.sees(B, u, w)) return false; // (a creature you can see)
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
    if (g.time === 'B') { T.bonus = 0; T.bonusSpell = true; } else { T.action = 0; T.spellAction = sp.level ? 'leveled' : 'cantrip'; }
    if (sp.level) u.slots[slot - 1]--;
    var head = '{y}' + u.name + '{/}: ' + sp.name.toUpperCase() + (sp.level ? ' (L' + slot + ')' : '');
    var dc = u.spellDC, n = up(sp, slot);
    if (g.shape !== 'self' && g.shape !== 'touch') { var at = t && t.x != null ? { x: t.x, y: t.y, size: 1 } : t && t.units ? t.units[0] : t; if (at) u.facing = B.faceTo(u, at); }
    u.anim = 'attack'; u.animT = B.t;
    D.sfx(M.sound(sp));
    yield 10;

    if (g.shape === 'attack' || g.shape === 'rays') {
      var shots = g.shape === 'rays' ? t.units : [t], dice = g.shape === 'rays' ? sp.dmg : M.dice(sp, u, slot);
      if (g.shape === 'rays') B.card([head + ' -- ' + shots.length + ' rays']);
      for (var i = 0; i < shots.length; i++) {
        if (shots[i].dead || shots[i].hp <= 0) continue;
        yield* B.attack(u, shots[i], { name: sp.name, atk: u.spellAtk, dice: dice, mod: 0, type: sp.el, spell: true, ranged: true, range: [g.range, g.range], fx: 'fire' });
      }
    } else if (g.shape === 'darts') {
      var darts = t.units, lines = [head + ' -- ' + darts.length + ' darts, each 1d4+1 force, never missing'], tot = {};
      for (var k = 0; k < darts.length; k++) { FX.projectile(u, darts[k], 'fire'); }
      yield { fx: 1 };
      darts.forEach(function (w) { var r = D.roll('1d4+1'); tot[w.id] = (tot[w.id] || 0) + r.total; });
      Object.keys(tot).forEach(function (wid) { var w = B.units.filter(function (x) { return x.id === wid; })[0]; lines.push('  ' + w.name + ': {r}' + tot[wid] + '{/}'); B.hurt(w, tot[wid], 'force'); });
      B.card(lines, 360); yield 30;
    } else if (g.shape === 'splash') {
      var first = t, second = B.units.filter(function (w) { return w !== first && G.hostile(u, w) && G.standing(w) && G.dist(first, w) <= 5; })[0];
      var dd = M.dice(sp, u, 0), r1 = D.roll(dd), lines2 = [head + '  ' + dd + ' ' + RU.fmtRolls(r1.rolls) + ' = ' + r1.total + ' acid  DEX DC ' + dc + ', no half'];
      FX.projectile(u, first, 'fire'); yield { fx: 1 };
      [first, second].filter(Boolean).forEach(function (w) {
        var sv = RU.save(w, 'dex', dc);
        lines2.push('  ' + w.name + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{o}failed -> ' + r1.total + '{/}'));
        if (!sv.ok) B.hurt(w, r1.total, 'acid');
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
        yield* M.brighten(B, u, 'light', head);
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
    var ramp = sp.el === 'cold' || sp.el === 'lightning' ? 'glow' : sp.el === 'thunder' ? 'silver' : sp.el === 'force' ? 'bone' : 'fire';
    if (g.shape === 'sphere' || g.shape === 'cube') { FX.projectile(u, { x: cx, y: cy, size: 1 }, 'fire'); yield { fx: 1 }; }
    var fromMe = g.shape === 'cone' || g.shape === 'line' || g.shape === 'wave';
    FX.bloom(fromMe ? u.x : cx, fromMe ? u.y : cy, sq, ramp);
    var caught = B.units.filter(function (w) { return G.present(w) && w.hp > 0 && G.inArea(w, sq); });
    var lines = [];
    if (id === 'daylight') {
      var burnt = (B.darks || []).filter(function (dk) { return dk.sq.some(function (q) { return sq.some(function (p) { return p[0] === q[0] && p[1] === q[1]; }); }); });
      lines.push(head + '  a sphere of daylight' + (burnt.length ? ': {y}the darkness burns away{/}' : B.bright ? '' : ': bright light fills the place'));
      burnt.forEach(function (dk) {
        var by = B.units.filter(function (w) { return w.id === dk.by; })[0];
        if (by && by.conc && by.conc.id === 'darkness') M.endConc(B, by, 'Daylight');
        else B.darks = (B.darks || []).filter(function (x) { return x !== dk; });
      });
      yield* M.brighten(B, u, 'daylight', null); // (and it is bright light: what hates light hates it, and under the roost it is the roof)
    } else if (id === 'sleep') {
      var pool = D.roll((g.pool + g.poolUp * Math.max(0, slot - 1)) + 'd8'), left = pool.total;
      lines.push(head + '  ' + (g.pool + g.poolUp * Math.max(0, slot - 1)) + 'd8 = ' + pool.total + ' HP of sleep, the weakest first');
      caught.slice().sort(function (a, b) { return a.hp - b.hp; }).forEach(function (w) {
        if (w.kind === 'drow' || w.fey) { lines.push('  ' + w.name + ': {g}fey blood: sleep cannot take it{/}'); return; }
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
      lines.push(head + '  ' + dd + ' ' + RU.fmtRolls(r.rolls) + (r2 ? ' + ' + sp.dmg2 + ' ' + RU.fmtRolls(r2.rolls) : '') + ' = {o}' + tot + '{/} ' + sp.el + '  ' + ab.toUpperCase() + ' DC ' + dc);
      var hits = [];
      caught.forEach(function (w) {
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
    if (u.conds.restrained || u.conds.paralyzed || u.conds.asleep) u.turn.move = 0;
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
    if (u.conds.poisoned && u.conds.poisoned.save && !u.conds.paralyzed) M.poisonSave(B, u);
    var p = u.conds.paralyzed;
    if (p && p.save) {
      var sv = RU.save(u, p.save, p.dc);
      B.card([(u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}') + ' strains against the hold: ' + p.save.toUpperCase() + ' ' + RU.saveText(sv) + ' vs DC ' + p.dc + '  ' + (sv.ok ? '{n}FREE{/}' : '{g}still held{/}')]);
      if (sv.ok && p.poison) delete u.conds.poisoned; // (the chuul's, the crawler's: paralyzed while poisoned; one save ends both)
      if (sv.ok) { delete u.conds.paralyzed; var c = B.units.filter(function (w) { return w.conc && (w.conc.id === 'holdmonster' || w.conc.id === 'holdperson') && w.id === p.by; })[0]; if (c) delete c.conc; }
    }
  };
  // ------------------------------------------------------------------ bright light: the Light cantrip and Daylight (the 8-bit battle's dazzle, crossed 09-28).
  // The place is lit for the fight (B.bright): whatever hid is seen, and what hates light (lightSensitive: the drow, the duergar,
  // the cloaker) loses its next turn the first time and attacks at disadvantage while the light holds (rules.js edges). Under a
  // roost it is the one law broken (RULED 09-28, canon): the fight ends 'roost' and the 8-bit game's RoostFail runs
  M.brighten = function* (B, u, source, head) {
    var first = !B.bright;
    B.bright = true; B.brightBy = source === 'daylight' ? 'daylight' : (B.brightBy || 'light');
    var shy = B.units.filter(function (w) { return w.side === 'foe' && G.standing(w) && w.lightSensitive; });
    B.units.forEach(function (w) { if (w.side === 'foe' && w.conds.hidden) { delete w.conds.hidden; w.hidden0 = false; } });
    var lines = head ? [head + ': bright light fills the place.'] : [];
    if (shy.length) { shy.forEach(function (w) { w.flash = 16; if (first) w.conds.recoiling = true; }); lines.push('  ' + shy.map(function (w) { return w.name; }).join(', ') + (first ? ': {o}recoils, shrinking up away from it{/} -- no next turn, and disadvantage while the light holds' : ': {o}still dazzled{/}')); }
    if (B.fight && B.fight.roost && !B.roostBroken) { B.roostBroken = source; lines.push('{r}Bright light under a roosted ceiling.{/}'); D.sfx('encounter'); }
    if (lines.length) B.card(lines, 420);
    FX.ring(u, 'glow', 40);
    yield 30;
  };

  // ------------------------------------------------------------------ Darkness (SRD 5.1; Griz 09-27: "We'll have to deal with darkness, at least the
  // magical kind"): a 15-ft-radius sphere of magical darkness. Nothing sees into it, out of it or across it (darkvision neither):
  // an unseen target is attacked at disadvantage and an unseen attacker attacks with advantage (rules.js edges), no opportunity
  // attack on one you cannot see (battle.js moveAlong), a spell that needs its target seen cannot take one (targetOK), and the
  // foes pick only targets they can see (ai.js visibleFrom). Concentration: it lifts when the caster's does
  M.darkAt = function (B, x, y) { return (B.darks || []).some(function (d) { return d.sq.some(function (q) { return q[0] === x && q[1] === y; }); }); };
  M.inDark = function (B, u) { return G.foot(u).some(function (p) { return M.darkAt(B, p[0], p[1]); }); };
  M.sees = function (B, a, b) {
    if (!B || !(B.darks || []).length || a === b || a.devilSight) return true;
    if (M.inDark(B, a) || M.inDark(B, b)) return false;
    var x0 = a.x + ((a.size || 1) - 1) / 2, y0 = a.y + ((a.size || 1) - 1) / 2, dx = b.x + ((b.size || 1) - 1) / 2 - x0, dy = b.y + ((b.size || 1) - 1) / 2 - y0;
    var n = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 2);
    for (var i = 1; i < n; i++) if (M.darkAt(B, Math.round(x0 + dx * i / n), Math.round(y0 + dy * i / n))) return false; // (across it)
    return true;
  };
  // a foe's Darkness (Amara's, the turn she breaks for the way out): over as many of them as it can cover, within its range
  M.castDarkness = function* (B, u) {
    var K = u.darkness, hs = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w); }), best = null, bn = 0;
    hs.forEach(function (c) {
      if (Math.max(Math.abs(c.x - u.x), Math.abs(c.y - u.y)) * 5 > K.range) return;
      var sq = G.sphere(c.x, c.y, K.r), n = hs.filter(function (w) { return G.inArea(w, sq) && !M.inDark(B, w); }).length; // (one already in the dark counts for nothing: no second sphere on the same heads)
      if (n > bn) { bn = n; best = { c: c, sq: sq }; }
    });
    if (!best) return false;
    u.turn.action = 0; K.used = true;
    if (B.bright && B.brightBy === 'daylight') { D.sfx('magic'); B.card(['{r}' + u.name + '{/} calls up darkness -- and the daylight burns it away as it forms.'], 300); yield 30; return true; }
    if (B.bright) { B.bright = false; B.brightBy = null; B.card(['{r}' + u.name + '{/} swallows the light.'], 300); } // (the Light cantrip: dispelled)
    B.darks = (B.darks || []).concat([{ by: u.id, sq: best.sq }]);
    M.concentrate(B, u, 'darkness', 'Darkness', function () { B.darks = (B.darks || []).filter(function (d) { return d.by !== u.id; }); B.card(['{p}The darkness lifts.{/}'], 300); });
    D.sfx('magic'); FX.ring(best.c, 'violet', 44);
    var under = hs.filter(function (w) { return G.inArea(w, best.sq); }).map(function (w) { return w.name; });
    B.card(['{r}' + u.name + ' throws darkness over ' + under.join(', ') + '!{/}  {g}(15 ft of it: nobody sees in, out or across; concentration){/}'], 420);
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
    var r = u.conds.restrained, d = u.conds.poisoned || u.conds.frightened ? Math.min(D.d(20), D.d(20)) : D.d(20), useDex = r.grapple && D.mod(u.abil.dex) > D.mod(u.abil.str);
    var tot = d + D.mod(useDex ? u.abil.dex : u.abil.str) + (u.cls === 'fighter' || (useDex && u.cls === 'rogue') ? u.prof : 0);
    u.turn.action = 0;
    B.card([(u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}') + (r.grapple ? ' wrenches at the grip: ' : ' tears at the web: ') + (useDex ? 'DEX' : 'STR') + ' d20 ' + d + ' = ' + tot + ' vs DC ' + r.dc + '  ' + (tot >= r.dc ? '{n}FREE{/}' : '{g}still ' + (r.grapple ? 'held' : 'stuck') + '{/}')]);
    if (tot >= r.dc) {
      delete u.conds.restrained; u.turn.move = u.speed; u.turn.webSaved = true; // (torn free: it goes on through the web this turn)
      var by = B.units.filter(function (w) { return w.id === r.by; })[0]; if (by && by.holding) by.holding = by.holding.filter(function (w) { return w !== u; });
    }
    yield 30;
  };
  M.webbed = function (B, x, y) { return (B.webs || []).some(function (w) { return w.sq.some(function (q) { return q[0] === x && q[1] === y; }); }); };
})();
