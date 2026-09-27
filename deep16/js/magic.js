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
      if (!sp || (!sp.battle && g.shape !== 'none')) return null;
      var e = { id: id, name: sp.name, level: sp.level, g: g, sp: sp, levels: sp.level ? M.slotLevels(u, sp.level) : [0] };
      e.slot = e.levels[0] || sp.level;
      var why = '';
      if (g.shape === 'none' || g.shape === 'reaction') why = g.why;
      else if (sp.level && !e.levels.length) why = 'no slot of level ' + sp.level + ' or higher';
      else if (g.time === 'B' && !T.bonus) why = 'the bonus action is spent';
      else if (g.time === 'A' && (!T.action || T.attacksLeft)) why = 'the action is spent';
      else if (g.time === 'B' && T.spellAction === 'leveled') why = 'a levelled spell was cast this turn: no bonus-action spell too';
      else if (g.time === 'B' && T.bonusSpell) why = 'one bonus-action spell a turn';
      else if (g.time === 'A' && T.bonusSpell && sp.level) why = 'after a bonus-action spell, only a cantrip';
      else if (g.unarmored && !M.touchTargets(B, u, g).length) why = 'no one within reach without armour';
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
      case 'sphere': return e.id === 'sleep' ? (g.pool + g.poolUp * Math.max(0, e.slot - 1)) + 'd8 HP of sleep, ' + g.r + '-ft sphere within ' + g.range + ' ft' : g.r + '-ft sphere within ' + g.range + ' ft · ' + save + ' · ' + d + (sp.dmg2 ? ' + ' + sp.dmg2 : '') + ' ' + sp.el;
      case 'cube': return g.size + '-ft cube within ' + g.range + ' ft · DEX or restrained' + conc;
      case 'single': return e.id === 'holdmonster' ? 'a foe within 90 ft · WIS or paralyzed' + conc : 'an ally within ' + g.range + ' ft · +2 AC' + conc;
      case 'allies': return 'up to ' + n + ' within ' + g.range + ' ft · ' + (e.id === 'bless' ? '+1d4 to attacks and saves' + conc : '+' + 5 * Math.max(1, e.slot - 1) + ' max HP');
      case 'self': return '+1d4 radiant on weapon hits' + conc;
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
    if (g.shape === 'cone') return aimed(u, cx, cy, g.len, true);
    if (g.shape === 'line') return aimed(u, cx, cy, g.len, false);
    return [];
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
    } else if (g.shape === 'sphere' || g.shape === 'cube' || g.shape === 'cone' || g.shape === 'line') {
      yield* area(B, u, id, sp, g, slot, t.x, t.y, head);
    } else if (g.shape === 'single') {
      if (id === 'holdmonster') {
        var sv2 = RU.save(t, 'wis', dc);
        B.card([head + ' on the ' + B.shortName(t) + '  WIS ' + RU.saveText(sv2) + ' vs DC ' + dc + '  ' + (sv2.ok ? '{n}SAVED{/}' : '{p}HELD FAST: paralyzed{/}')]);
        FX.ring(t, 'violet', 40);
        if (!sv2.ok) { t.conds.paralyzed = { dc: dc, save: 'wis', by: u.id }; M.concentrate(B, u, id, sp.name, function () { delete t.conds.paralyzed; }); }
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
    FX.bloom(g.shape === 'cone' || g.shape === 'line' ? u.x : cx, g.shape === 'cone' || g.shape === 'line' ? u.y : cy, sq, ramp);
    var caught = B.units.filter(function (w) { return G.present(w) && w.hp > 0 && G.inArea(w, sq); });
    var lines = [];
    if (id === 'sleep') {
      var pool = D.roll((g.pool + g.poolUp * Math.max(0, slot - 1)) + 'd8'), left = pool.total;
      lines.push(head + '  ' + (g.pool + g.poolUp * Math.max(0, slot - 1)) + 'd8 = ' + pool.total + ' HP of sleep, the weakest first');
      caught.slice().sort(function (a, b) { return a.hp - b.hp; }).forEach(function (w) {
        if (w.kind === 'drow' || w.fey) { lines.push('  ' + w.name + ': {g}fey blood: sleep cannot take it{/}'); return; }
        if (w.hp <= left) { left -= w.hp; w.conds.asleep = true; lines.push('  ' + w.name + ' ({r}' + w.hp + '{/}): {p}asleep{/}'); }
        else lines.push('  ' + w.name + ' (' + w.hp + '): too much left in it');
      });
    } else if (id === 'web') {
      lines.push(head + '  a 20-ft cube of sticky web: DEX DC ' + dc + ' or restrained (concentration)');
      var stuck = [];
      caught.forEach(function (w) {
        if (w.webWalker) { lines.push('  ' + w.name + ': {g}walks webs: they do not hold it{/}'); return; }
        var sv = RU.save(w, 'dex', dc);
        lines.push('  ' + w.name + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{p}restrained{/}'));
        if (!sv.ok) { w.conds.restrained = { dc: dc, by: u.id }; stuck.push(w); }
      });
      B.webs = (B.webs || []).concat([{ by: u.id, sq: sq }]);
      M.concentrate(B, u, id, sp.name, function () { lift(B, stuck, 'restrained'); B.webs = (B.webs || []).filter(function (wb) { return wb.by !== u.id; }); });
    } else {
      var dd = M.dice(sp, u, slot), r = D.roll(dd), r2 = sp.dmg2 ? D.roll(sp.dmg2) : null, tot = r.total + (r2 ? r2.total : 0), ab = sp.save || 'dex';
      lines.push(head + '  ' + dd + ' ' + RU.fmtRolls(r.rolls) + (r2 ? ' + ' + sp.dmg2 + ' ' + RU.fmtRolls(r2.rolls) : '') + ' = {o}' + tot + '{/} ' + sp.el + '  ' + ab.toUpperCase() + ' DC ' + dc);
      var hits = [];
      caught.forEach(function (w) {
        var sv = RU.save(w, ab, dc), evade = ab === 'dex' && w.cls === 'rogue' && w.lvl >= 7;
        var d = sv.ok ? (evade ? 0 : (sp.half ? Math.floor(tot / 2) : 0)) : (evade ? Math.floor(tot / 2) : tot);
        lines.push('  ' + w.name + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{o}failed{/}') + (evade ? ' {c}evasion{/}' : '') + ' -> {r}' + d + '{/}');
        hits.push([w, d]);
      });
      if (!caught.length) lines.push('  {g}no one in it.{/}');
      B.card(lines.slice(0, 7), 420);
      yield { fx: 1 };
      hits.forEach(function (h) { B.hurt(h[0], h[1], sp.el); });
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
    if (u.conds.restrained || u.conds.paralyzed || u.conds.asleep) u.turn.move = 0;
  };
  // the end: a paralyzed creature tries its save again (Hold Monster)
  M.endTurn = function (B, u) {
    var p = u.conds.paralyzed;
    if (p && p.save) {
      var sv = RU.save(u, p.save, p.dc);
      B.card([(u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}') + ' strains against the hold: ' + p.save.toUpperCase() + ' ' + RU.saveText(sv) + ' vs DC ' + p.dc + '  ' + (sv.ok ? '{n}FREE{/}' : '{g}still held{/}')]);
      if (sv.ok) { delete u.conds.paralyzed; var c = B.units.filter(function (w) { return w.conc && w.conc.id === 'holdmonster' && w.id === p.by; })[0]; if (c) delete c.conc; }
    }
  };
  // breaking out of a web: an action, a STR check against the caster's DC
  M.breakFree = function* (B, u) {
    // a grip is escaped with Athletics or Acrobatics, whichever is better (the SRD's escape); a web is torn with STR
    var r = u.conds.restrained, d = D.d(20), useDex = r.grapple && D.mod(u.abil.dex) > D.mod(u.abil.str);
    var tot = d + D.mod(useDex ? u.abil.dex : u.abil.str) + (u.cls === 'fighter' || (useDex && u.cls === 'rogue') ? u.prof : 0);
    u.turn.action = 0;
    B.card([(u.side === 'foe' ? '{r}The ' + B.shortName(u) + '{/}' : '{y}' + u.name + '{/}') + (r.grapple ? ' wrenches at the grip: ' : ' tears at the web: ') + (useDex ? 'DEX' : 'STR') + ' d20 ' + d + ' = ' + tot + ' vs DC ' + r.dc + '  ' + (tot >= r.dc ? '{n}FREE{/}' : '{g}still ' + (r.grapple ? 'held' : 'stuck') + '{/}')]);
    if (tot >= r.dc) {
      delete u.conds.restrained; u.turn.move = u.speed;
      var by = B.units.filter(function (w) { return w.id === r.by; })[0]; if (by && by.holding) by.holding = by.holding.filter(function (w) { return w !== u; });
    }
    yield 30;
  };
  M.webbed = function (B, x, y) { return (B.webs || []).some(function (w) { return w.sq.some(function (q) { return q[0] === x && q[1] === y; }); }); };
})();
