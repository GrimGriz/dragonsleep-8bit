/* DEEP16 — the grimoire (handoff-2026-09-28-npc-classes-to-six.md §3B; spells-srd-by-class.md, every IN verdict): the spells built
   for the class NPCs, each with what it does on the grid (cast), what the list says (summary), and how the class tactics weigh
   it (ai: js/tactics.js). The facts of each (level, dice, save, element) are content/spells.json's (`grid: true` where only the
   grid casts it); its shape, range and casting time data/spells.js's. magic.js M.cast hands a spell here when it has an entry.
   The conditions they lay keep their own time (`till`: whose turn, its start or end, how many): M.tick. Ground they leave
   (grease, vines, spikes) is B.grounds; auras (the guardians) B.auras. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx, M = D.magic;
  var E = M.EFFECT = M.EFFECT || {};
  function TX() { return D.tactics; }
  function nm(B, w) { return w.side === 'foe' ? (w.named ? B.shortName(w) : 'the ' + B.shortName(w)) : w.name; }
  function Nm(B, w) { var s = nm(B, w); return s.charAt(0).toUpperCase() + s.slice(1); }
  function up(sp, slot) { return Math.max(0, (slot || sp.level) - sp.level); }
  function more(expr, n) { return !n ? expr : String(expr).replace(/^(\d+)d/, function (m, k) { return (+k + n) + 'd'; }); } // (1d4 and 2 more: 3d4)
  function dice(sp, u, slot) { return M.dice(sp, u, slot); }
  function avg(x) { return TX().avg(x); }
  function lifeBonus(u, slot) { return u.subclass === 'Life Domain' ? 2 + (slot || 1) : 0; } // Disciple of Life (SRD 5.1)

  // ------------------------------------------------------------------ the shared mechanics
  // a spell attack through the one attack routine (battle.js attack: the edges, images, Shield, crits, the reactions), with its rider
  function* spellAttack(B, u, t, sp, g, dmgExpr, o) {
    o = o || {};
    var at = { name: sp.name, atk: u.spellAtk, dice: dmgExpr, mod: o.mod || 0, type: sp.el, spell: true, touch: g.range <= 5, ranged: g.range > 5, range: [g.range, g.range], fx: o.fx || (sp.el === 'fire' ? 'fire' : 'bolt') };
    yield* B.attack(u, t, at, { onHit: o.onHit, onMiss: o.onMiss });
  }
  E._attack = spellAttack;
  // one damage roll, each creature's save (half, or none), a line each; the hurt after the card; o.cond: laid on a failed save
  function* saveAll(B, u, list, ab, dc, dexpr, type, half, head, o) {
    o = o || {};
    var r = dexpr ? D.roll(dexpr) : null, lines = [head + (r ? '  ' + dexpr + ' ' + RU.fmtRolls(r.rolls) + ' = {o}' + r.total + '{/} ' + type : '') + '  ' + ab.toUpperCase() + ' DC ' + dc], hits = [], failed = [];
    list.forEach(function (w) {
      if (o.skip && o.skip(w)) { lines.push('  ' + Nm(B, w) + ': {g}' + o.skip(w) + '{/}'); return; }
      var sv = RU.save(w, ab, dc), ev = ab === 'dex' && w.cls === 'rogue' && w.lvl >= 7, d = 0;
      if (r) d = sv.ok ? (ev ? 0 : half ? Math.floor(r.total / 2) : 0) : (ev ? Math.floor(r.total / 2) : r.total);
      lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{o}failed{/}' + (o.failText ? ' {p}' + o.failText + '{/}' : '')) + (r ? ' -> {r}' + d + '{/}' : ''));
      if (d) hits.push([w, d]);
      if (!sv.ok) failed.push(w);
    });
    if (!list.length) lines.push('  {g}no one in it.{/}');
    B.card(lines.slice(0, 8), 420);
    yield { fx: 1 };
    hits.forEach(function (h) { B.hurt(h[0], h[1], type); });
    if (o.cond) failed.forEach(function (w) { if (!w.dead && (w.hp > 0 || o.onDown)) o.cond(w); });
    yield 24;
    return failed;
  }
  E._saveAll = saveAll;
  function lift(B, list, cond, by) { B.units.forEach(function (w) { var c = w.conds[cond]; if (c && (!by || c.by === by)) delete w.conds[cond]; }); }
  function caughtIn(B, sq) { return B.units.filter(function (w) { return G.present(w) && w.hp > 0 && G.inArea(w, sq); }); }
  // ground a spell leaves (grease, vines, spikes): difficult, and what it does to those who enter it (M.stepInto) or end a turn on it
  M.groundAt = function (B, x, y) { return (B.grounds || []).filter(function (g) { return g.sq.some(function (q) { return q[0] === x && q[1] === y; }); }); };
  M.rough = function (B, x, y, u) {
    if ((B.grounds || []).some(function (g) { return g.difficult && g.sq.some(function (q) { return q[0] === x && q[1] === y; }) && !(g.kind === 'vines' && u && u.landsStride); })) return true;
    // the guardians' ring: half speed for the caster's foes inside it (SRD 5.1 Spirit Guardians)
    return (B.auras || []).some(function (a) { var c = B.units.filter(function (w) { return w.id === a.by; })[0]; return c && u && G.hostile(c, u) && Math.max(Math.abs(x - c.x), Math.abs(y - c.y)) * 5 <= a.r; });
  };
  function removeGround(B, rec) { B.grounds = (B.grounds || []).filter(function (g) { return g !== rec; }); }

  // ------------------------------------------------------------------ the clocks: every condition with `till` { who, at: 'start'|'end', n }
  // ends after its n-th such moment of `who`'s turns
  M.tick = function (B, u, at) {
    B.units.forEach(function (w) {
      Object.keys(w.conds).forEach(function (k) {
        var c = w.conds[k];
        if (!c || typeof c !== 'object' || !c.till || c.till.who !== u.id || c.till.at !== at) return;
        if (--c.till.n <= 0) { delete w.conds[k]; if (c.endText && !w.dead) B.card(['{g}' + c.endText.replace('{who}', Nm(B, w)) + '{/}'], 200); if (c.onEnd) c.onEnd(w); }
      });
    });
  };
  M.onStart = function (B, u) {
    M.tick(B, u, 'start');
    var c = u.conds, T = u.turn;
    if (c.noReact) u.reaction = 0; // (Glass Whisper, Shocking Grasp: no reactions till its turn is over)
    if (c.frosted) T.move = Math.max(0, T.move - 10); // Ray of Frost: -10 ft
    if (c.slowed) { T.move = Math.floor(T.move / 2); u.reaction = 0; T.slowed = true; } // Slow: half speed, no reactions, one attack, the action or the bonus
    if (c.hasted) { T.move *= 2; T.hasteAction = 1; } // Haste: double speed, one more action (one attack, Dash, Disengage, Hide, an object)
    if (c.lethargic) { T.move = 0; T.action = 0; T.bonus = 0; delete c.lethargic; B.card(['{g}' + Nm(B, u) + ' is dragged down by the haste\'s end: no move, no action.{/}'], 240); }
    if (c.retreat) T.bonusDash = true;
    // Spirit Guardians: a foe that starts its turn in the ring saves (once a turn, the first time: starting or entering)
    guardians(B, u, 'starts');
    // Command: the word it heard, obeyed now
    if (c.commanded) { var w = c.commanded.word; delete c.commanded; commandTurn(B, u, w); }
  };
  M.onEnd = function (B, u) {
    var c = u.conds;
    // the saves at a turn's end
    [['laughing', 'wis', 'stops laughing'], ['blindedBy', 'con', 'can see again'], ['slowed', 'wis', 'shakes off the slow'], ['enfeebled', 'con', 'feels the strength come back']].forEach(function (q) {
      var s = c[q[0]]; if (!s || !s.dc || u.hp <= 0) return;
      var sv = RU.save(u, q[1], s.dc);
      B.card([Nm(B, u) + ' fights it off: ' + q[1].toUpperCase() + ' ' + RU.saveText(sv) + ' vs DC ' + s.dc + '  ' + (sv.ok ? '{n}' + q[2].toUpperCase() + '{/}' : '{g}not yet{/}')], 240);
      if (sv.ok) endCond(B, u, q[0]);
    });
    // Fear: a save only out of the caster's sight
    if (c.feared && c.feared.dc) {
      var src = B.units.filter(function (w) { return w.id === c.feared.by; })[0];
      if (!src || !G.los(u, src).clear || !M.sees(B, u, src)) { var sv2 = RU.save(u, 'wis', c.feared.dc); B.card([Nm(B, u) + ', out of sight of the fear: WIS ' + RU.saveText(sv2) + ' vs DC ' + c.feared.dc + '  ' + (sv2.ok ? '{n}IT PASSES{/}' : '{g}still afraid{/}')], 240); if (sv2.ok) endCond(B, u, 'feared'); }
    }
    // grease: ending a turn on it, DEX or down
    (M.groundAt(B, u.x, u.y) || []).forEach(function (g) { if (g.kind === 'grease') slip(B, u, g, 'ends its turn on the grease'); });
    // Acid Arrow's second bite, at the end of its next turn
    if (c.acid && c.acid.fresh) c.acid.fresh = false; else if (c.acid) { var a = c.acid; delete c.acid; var r = D.roll(a.dice); B.card([Nm(B, u) + ': the acid eats on  ' + a.dice + ' ' + RU.fmtRolls(r.rolls) + ' = {r}' + r.total + '{/} acid'], 240); B.hurt(u, r.total, 'acid'); }
    M.tick(B, u, 'end');
  };
  // a condition a spell laid, ended (its own undo: Hideous Laughter's prone and incapacitated go with it)
  function endCond(B, u, k) {
    var c = u.conds[k]; delete u.conds[k];
    if (k === 'laughing') { delete u.conds.incapacitated; }
    if (k === 'blindedBy') delete u.conds.blinded;
    if (k === 'feared') delete u.conds.frightened;
    if (c && c.by) { var src = B.units.filter(function (w) { return w.id === c.by; })[0]; if (src && src.conc && c.single && src.conc.id === c.spell) delete src.conc; }
  }
  M.endCond = endCond;
  // hurt while laughing: the save again, with advantage (SRD 5.1); a hypnotized one wakes
  M.onHurt = function (B, u, n, type) {
    var c = u.conds;
    if (c.laughing && c.laughing.dc) { var r1 = D.d(20), r2 = D.d(20), b = u.saves ? u.saves.wis : D.mod(u.abil.wis), t = Math.max(r1, r2) + b; B.card([Nm(B, u) + ', hurt, tries to stop laughing: WIS d20 [' + r1 + ',' + r2 + ']>' + Math.max(r1, r2) + ' ' + RU.sign(b) + ' = ' + t + ' vs DC ' + c.laughing.dc + '  ' + (t >= c.laughing.dc ? '{n}STOPS{/}' : '{g}still laughing{/}')], 240); if (t >= c.laughing.dc) endCond(B, u, 'laughing'); }
    if (c.hypnotized) { delete c.hypnotized; delete c.incapacitated; delete c.charmed; B.card(['{g}' + Nm(B, u) + ' is jolted out of the pattern.{/}'], 200); }
  };
  // Sanctuary (SRD 5.1): the one who would strike the warded saves WIS first; failed, the blow (or the spell) is lost
  M.sanctuary = function (B, att, tgt) {
    var s = tgt.conds.sanctuary, sv = RU.save(att, 'wis', s.dc);
    B.card(['{p}' + Nm(B, tgt) + ' is warded (Sanctuary).{/} ' + Nm(B, att) + ': WIS ' + RU.saveText(sv) + ' vs DC ' + s.dc + '  ' + (sv.ok ? '{n}STRIKES ANYWAY{/}' : '{g}cannot bring itself to: the blow is lost{/}')], 300);
    return sv.ok;
  };
  // the warded who strike or cast at a foe lose the ward
  M.unward = function (B, u, why) { if (u.conds.sanctuary) { delete u.conds.sanctuary; B.card(['{g}' + Nm(B, u) + '\'s sanctuary ends (' + why + ').{/}'], 200); } };
  // Hellish Rebuke (SRD 5.1): the reaction of one who took a blow, at the one who gave it, within 60 ft, seen
  M.rebuke = function* (B, u, att) {
    if (!u.known || u.known.indexOf('hellishrebuke') < 0 || !u.reaction || !RU.canAct(u) || !G.hostile(u, att) || G.dist(u, att) > 60 || !M.sees(B, u, att)) return;
    var lv = M.slotLevels(u, 1)[0]; if (!lv) return;
    if (B.fight && B.fight.roost) return;
    var yes = (u.side !== 'party' || u.guest) ? true : yield { prompt: { who: u, title: u.name + ': HELLISH REBUKE?', lines: [Nm(B, att) + ' hurt you. Wreathe it in fire: DEX DC ' + u.spellDC + ', ' + (1 + lv) + 'd10 fire (half). (a level-' + lv + ' slot, the reaction)'], opts: [{ label: 'REBUKE', value: true }, { label: 'LET IT GO', value: false }] } };
    if (!yes) return;
    u.reaction = 0; u.slots[lv - 1]--; D.sfx('fire'); FX.sparkle(att, 'fire', 18);
    yield* saveAll(B, u, [att], 'dex', u.spellDC, (1 + lv) + 'd10', 'fire', true, '{y}' + u.name + '{/}: HELLISH REBUKE (L' + lv + ') -- hellfire about ' + nm(B, att));
  };
  // Spirit Guardians: the ring about the caster; a foe of his entering it (the first time in a turn) or starting there saves WIS
  function guardians(B, u, how) {
    (B.auras || []).forEach(function (a) {
      var c = B.units.filter(function (w) { return w.id === a.by; })[0];
      if (!c || !G.hostile(c, u) || u.hp <= 0 || u.dead || G.dist(c, u) > a.r) return;
      if (u.turn && u.turn['aura' + a.by]) return;
      if (u.turn) u.turn['aura' + a.by] = true;
      var r = D.roll(a.dice), sv = RU.save(u, 'wis', a.dc), d = sv.ok ? Math.floor(r.total / 2) : r.total;
      FX.sparkle(u, a.ramp || 'bone', 12);
      B.card([Nm(B, u) + ' ' + how + ' in the spirits\' ring: WIS ' + RU.saveText(sv) + ' vs DC ' + a.dc + '  ' + a.dice + ' ' + RU.fmtRolls(r.rolls) + ' -> {r}' + d + '{/} ' + a.type], 300);
      B.hurt(u, d, a.type);
    });
  }
  // stepping onto a spell's ground: grease (DEX or down, the move ends), spikes (2d4 each 5 ft), the guardians' ring
  M.stepInto = function (B, u) {
    var stop = false;
    M.groundAt(B, u.x, u.y).forEach(function (g) {
      if (g.kind === 'grease' && !u.conds.prone && slip(B, u, g, 'steps onto the grease')) stop = true;
      if (g.kind === 'spikes') { var r = D.roll('2d4'); FX.float('spikes', u, D.PAL.ramps.moss[3]); B.card([Nm(B, u) + ' in the spikes: 2d4 ' + RU.fmtRolls(r.rolls) + ' = {r}' + r.total + '{/} piercing'], 160); B.hurt(u, r.total, 'piercing'); }
    });
    guardians(B, u, 'comes');
    return stop || u.hp <= 0;
  };
  function slip(B, u, g, how) {
    if (u.noProne || RU.immuneTo(u, 'prone') || u.conds.prone) return false;
    var sv = RU.save(u, 'dex', g.dc);
    B.card([Nm(B, u) + ' ' + how + ': DEX ' + RU.saveText(sv) + ' vs DC ' + g.dc + '  ' + (sv.ok ? '{n}keeps their feet{/}' : '{o}down{/}')], 240);
    if (!sv.ok) u.conds.prone = true;
    return !sv.ok;
  }
  // Command's word, at the start of the commanded one's turn (SRD 5.1)
  function commandTurn(B, u, word) {
    var T = u.turn, src = null;
    if (word === 'halt') { T.move = 0; T.action = 0; T.bonus = 0; T.attacksLeft = 0; T.lost = 'halts'; B.card(['{p}' + Nm(B, u) + ' HALTS: no move, no action.{/}'], 300); }
    else if (word === 'grovel') { u.conds.prone = true; T.move = 0; T.action = 0; T.bonus = 0; T.lost = 'grovels'; B.card(['{p}' + Nm(B, u) + ' GROVELS: face down, the turn gone.{/}'], 300); }
    else if (word === 'drop') { u.conds.disarmed = { till: { who: u.id, at: 'end', n: 1 } }; B.card(['{p}' + Nm(B, u) + ' DROPS what it holds.{/}'], 300); }
    else if (word === 'flee') { T.fleeFrom = u.commandedBy; T.action = 0; T.bonus = 0; T.lost = 'flees'; B.card(['{p}' + Nm(B, u) + ' FLEES.{/}'], 300); }
  }
  M.commandTurn = commandTurn;
  // FLEE: its whole move away from the one who spoke (provoking as it goes), and the turn is over
  M.flee = function* (B, u) {
    var src = B.units.filter(function (w) { return w.id === u.turn.fleeFrom; })[0], T = u.turn;
    if (!src || !T.move || u.conds.restrained) return;
    var rm = G.reach(u, T.move), best = null, bd = -1;
    Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand) return; var d = G.dist(src, u, null, null, e.x, e.y) * 10 - e.cost / 10; if (d > bd) { bd = d; best = e; } });
    if (best && (best.x !== u.x || best.y !== u.y)) yield* D.ai.walkTo(B, u, best);
  };

  // ------------------------------------------------------------------ the cantrips
  E.chilltouch = {
    summary: function (e, u) { return 'spell attack, 120 ft · ' + dice(e.sp, u, 0) + ' necrotic · no healing till your next turn (the dead attack you at disadvantage)'; },
    cast: function* (B, u, t, slot, head, x) {
      yield* spellAttack(B, u, t, x.sp, x.g, dice(x.sp, u, 0), { onHit: function (w) {
        w.conds.noHeal = { by: u.id, till: { who: u.id, at: 'start', n: 1 } };
        if (w.type === 'undead') w.conds.disAt = { id: u.id, why: 'the grave\'s hand', till: { who: u.id, at: 'end', n: 2 } };
      } });
    },
    rider: function (B, u, t, p) { return p * (t.type === 'undead' ? 3 : 0.5); }
  };
  E.poisonspray = {
    summary: function (e, u) { return 'a foe within 10 ft · CON · ' + dice(e.sp, u, 0) + ' poison'; },
    cast: function* (B, u, t, slot, head, x) { FX.projectile(u, t, 'bolt'); yield* saveAll(B, u, [t], 'con', x.dc, dice(x.sp, u, 0), 'poison', false, head, { skip: function (w) { return RU.immuneTo(w, 'poisoned') || (w.immune || []).indexOf('poison') >= 0 ? 'no poison takes it' : ''; } }); },
    ai: function (B, u, e, slot, fs) { var best = null, d = avg(dice(e.sp, u, 0)); fs.forEach(function (t) { if (!M.targetOK(B, u, e.g, t) || (t.immune || []).indexOf('poison') >= 0) return; var sc = TX().worth(TX().pFail(t, 'con', u.spellDC) * d, t); if (!best || sc > best.score) best = { score: sc, t: t }; }); return best; }
  };
  E.produceflame = {
    summary: function (e, u) { return 'spell attack, 30 ft · ' + dice(e.sp, u, 0) + ' fire'; },
    cast: function* (B, u, t, slot, head, x) { yield* spellAttack(B, u, t, x.sp, x.g, dice(x.sp, u, 0), { fx: 'fire' }); }
  };
  E.rayoffrost = {
    summary: function (e, u) { return 'spell attack, 60 ft · ' + dice(e.sp, u, 0) + ' cold · its speed -10 ft till your next turn'; },
    cast: function* (B, u, t, slot, head, x) { yield* spellAttack(B, u, t, x.sp, x.g, dice(x.sp, u, 0), { onHit: function (w) { w.conds.frosted = { by: u.id, till: { who: u.id, at: 'start', n: 1 } }; FX.sparkle(w, 'glow', 10); } }); },
    rider: function (B, u, t, p) { return p * (G.dist(u, t) <= 30 ? 1 : 0.3); }
  };
  E.resistance = {
    summary: function () { return 'touch · +1d4 to one saving throw (concentration)'; },
    cast: function* (B, u, t, slot, head) { t.conds.resistance = { by: u.id }; M.concentrate(B, u, 'resistance', 'Resistance', function () { delete t.conds.resistance; }); B.card([head + ' on ' + t.name + ': {c}+1d4{/} to the next saving throw (concentration).']); yield 24; },
    ai: function (B, u, e, slot, fs, allies) { if (u.conc || B.round > 1) return null; var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 && !w.conds.resistance; })[0]; return t ? { score: 1, t: t, keep: 0.5 } : null; }
  };
  E.sacredflame = {
    summary: function (e, u) { return 'a foe in sight within 60 ft · DEX (cover no help) · ' + dice(e.sp, u, 0) + ' radiant'; },
    cast: function* (B, u, t, slot, head, x) { FX.sparkle(t, 'gold', 16); yield* saveAll(B, u, [t], 'dex', x.dc, dice(x.sp, u, 0), 'radiant', false, head + ' on ' + nm(B, t)); },
    ai: function (B, u, e, slot, fs) { var best = null, d = avg(dice(e.sp, u, 0)); fs.forEach(function (t) { if (!M.targetOK(B, u, e.g, t)) return; var sc = TX().worth(TX().pFail(t, 'dex', u.spellDC) * d, t); if (!best || sc > best.score) best = { score: sc, t: t }; }); return best; }
  };
  E.shillelagh = {
    summary: function () { return 'bonus action · your club or staff hits with WIS, a d8, magical, for a minute'; },
    list: function (B, u) { return !u.weapon || !/club|quarterstaff|staff/i.test(u.weapon.id || u.weapon.name) ? { why: 'no club or staff in hand' } : u.conds.shillelagh ? { why: 'the wood already glows' } : null; },
    cast: function* (B, u, t, slot, head) {
      var R = window.DS.R, wm = D.mod(u.abil.wis), w = Object.assign({}, u.weapon, { name: u.weapon.name + ' (shillelagh)', atk: wm + u.prof, dice: '1d8', mod: wm, magic: true });
      u.conds.shillelagh = { base: u.weapon }; u.weapon = w; FX.sparkle(u, 'moss', 14);
      B.card([head + ': the wood swells with green life -- {c}+' + w.atk + ' to hit, 1d8' + RU.sign(wm) + '{/}, magical.']); yield 20;
    },
    ai: function (B, u, e) { return B.round <= 2 ? { score: 4, t: u } : null; }
  };
  E.shockinggrasp = {
    summary: function (e, u) { return 'touch: melee spell attack · ' + dice(e.sp, u, 0) + ' lightning, advantage on metal armour · no reactions for it after'; },
    cast: function* (B, u, t, slot, head, x) {
      var metal = t.armored || t.metalArmor;
      if (metal) t.conds.metalEdge = { till: { who: u.id, at: 'end', n: 1 } };
      yield* spellAttack(B, u, t, x.sp, x.g, dice(x.sp, u, 0), { onHit: function (w) { w.reaction = 0; w.conds.noReact = { till: { who: w.id, at: 'start', n: 1 } }; FX.sparkle(w, 'glow', 12); } });
      delete t.conds.metalEdge;
    },
    // (the grasp is how a caster steps away from the one beside it: no opportunity attack from the struck)
    rider: function (B, u, t, p) { return p * (G.foesNear(u, u.x, u.y, 5).length ? 3 : 0.5); }
  };
  E.truestrike = {
    summary: function () { return 'a foe within 30 ft · your first attack at it next turn has advantage (concentration)'; },
    cast: function* (B, u, t, slot, head) { u.conds.trueStrike = { at: t.id, till: { who: u.id, at: 'end', n: 2 } }; M.concentrate(B, u, 'truestrike', 'True Strike', function () { delete u.conds.trueStrike; }); B.card([head + ': ' + u.name + ' reads ' + nm(B, t) + '\'s guard.']); yield 20; },
    ai: function () { return null; }
  };
  E.viciousmockery = {
    summary: function (e, u) { return 'a foe within 60 ft that hears you · WIS · ' + dice(e.sp, u, 0) + ' psychic, and its next attack at disadvantage'; },
    cast: function* (B, u, t, slot, head, x) { yield* saveAll(B, u, [t], 'wis', x.dc, dice(x.sp, u, 0), 'psychic', false, head + ' at ' + nm(B, t), { failText: 'stung', cond: function (w) { w.conds.mocked = { till: { who: w.id, at: 'end', n: 1 } }; } }); },
    ai: function (B, u, e, slot, fs) { var best = null, d = avg(dice(e.sp, u, 0)); fs.forEach(function (t) { if (!M.targetOK(B, u, e.g, t)) return; var pf = TX().pFail(t, 'wis', u.spellDC), sc = TX().worth(pf * d, t) + pf * TX().dpr(t) * 0.25; if (!best || sc > best.score) best = { score: sc, t: t }; }); return best; }
  };
  // Eldritch Blast (SRD 5.1): a beam at 1, two at 5, three at 11; Agonizing Blast adds CHA to each; Repelling Blast pushes 10 ft
  function beams(u) { return u.lvl >= 17 ? 4 : u.lvl >= 11 ? 3 : u.lvl >= 5 ? 2 : 1; }
  function agon(u) { return (u.invocations || []).indexOf('agonizing') >= 0 ? Math.max(0, D.mod(u.abil.cha)) : 0; }
  E.eldritchblast = {
    geo: function (B, u, g) { return Object.assign({}, g, { n: beams(u) }); },
    summary: function (e, u) { var n = beams(u), a = agon(u); return n + (n > 1 ? ' beams' : ' beam') + ', 120 ft · 1d10' + (a ? '+' + a : '') + ' force each' + ((u.invocations || []).indexOf('repelling') >= 0 ? ', pushed 10 ft' : ''); },
    cast: function* (B, u, t, slot, head, x) {
      var shots = t.units || [t], a = agon(u), rep = (u.invocations || []).indexOf('repelling') >= 0;
      if (shots.length > 1) B.card([head + ' -- ' + shots.length + ' beams']);
      for (var i = 0; i < shots.length; i++) {
        if (shots[i].dead || shots[i].hp <= 0) continue;
        yield* spellAttack(B, u, shots[i], x.sp, x.g, '1d10', { mod: a, fx: 'bolt', onHit: function (w) { if (rep && !w.dead && w.hp > 0 && (w.size || 1) <= 2) M.push(B, u, w, 2); } });
      }
    },
    ai: function (B, u, e, slot, fs) {
      var n = beams(u), d = 5.5 + agon(u), list = fs.filter(function (t) { return M.targetOK(B, u, Object.assign({}, e.g, { shape: 'rays' }), t); }).sort(function (a, b) { return a.hp - b.hp; });
      if (!list.length) return null;
      var units = [], sc = 0;
      for (var k = 0; k < n; k++) { var t = list[Math.min(k, list.length - 1)]; if (t.hp > d * n) t = list[0]; units.push(t); sc += TX().worth(TX().pHit(u.spellAtk, RU.ac(t), 0) * d, t); }
      return { score: sc, t: { units: units } };
    }
  };
  E.guidance = {
    summary: function () { return 'touch · +1d4 to one ability check (a grip broken, a hiding): concentration'; },
    cast: function* (B, u, t, slot, head) { t.conds.guidance = { by: u.id }; M.concentrate(B, u, 'guidance', 'Guidance', function () { delete t.conds.guidance; }); B.card([head + ' on ' + t.name + ': {c}+1d4{/} to the next ability check.']); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { if (u.conc) return null; var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 && w.conds.restrained && !w.conds.guidance; })[0]; return t ? { score: 2, t: t, keep: 1 } : null; }
  };

  // ------------------------------------------------------------------ 1st level
  E.bane = {
    summary: function (e, u) { return 'up to ' + (3 + Math.max(0, e.slot - 1)) + ' foes within 30 ft · CHA · -1d4 to their attacks and saves (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var list = t.units || [t], hit = [];
      yield* saveAll(B, u, list, 'cha', x.dc, null, '', false, head, { failText: 'baned', cond: function (w) { w.conds.baned = { by: u.id }; hit.push(w); } });
      if (hit.length) M.concentrate(B, u, 'bane', 'Bane', function () { hit.forEach(function (w) { if (w.conds.baned && w.conds.baned.by === u.id) delete w.conds.baned; }); });
    },
    ai: function (B, u, e, slot, fs) {
      if (u.conc && u.conc.id === 'bane') return null;
      var n = 3 + Math.max(0, slot - 1), who = fs.filter(function (t) { return M.targetOK(B, u, e.g, t) && !t.conds.baned; }).sort(function (a, b) { return TX().dpr(b) - TX().dpr(a); }).slice(0, n);
      if (!who.length) return null;
      var sc = who.reduce(function (s, w) { return s + TX().pFail(w, 'cha', u.spellDC) * (TX().dpr(w) * 0.12 * 3 + 1); }, 0);
      return { score: sc, t: { units: who }, keep: sc * 0.6 };
    }
  };
  E.colorspray = {
    summary: function (e, u) { return '15-ft cone · ' + (6 + 2 * Math.max(0, e.slot - 1)) + 'd10 HP of creatures blinded, the weakest first, till the end of your next turn'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), n = 6 + 2 * up(x.sp, slot), pool = D.roll(n + 'd10'), left = pool.total, lines = [head + '  ' + n + 'd10 = ' + pool.total + ' HP of dazzled eyes, the weakest first'];
      FX.bloom(u.x, u.y, sq, 'violet');
      caughtIn(B, sq).filter(function (w) { return w !== u && !w.conds.blinded && !w.blind; }).sort(function (a, b) { return a.hp - b.hp; }).forEach(function (w) {
        if (w.hp <= left) { left -= w.hp; w.conds.blinded = { by: u.id, till: { who: u.id, at: 'end', n: 2 } }; lines.push('  ' + Nm(B, w) + ' (' + w.hp + '): {p}blinded{/}'); }
        else lines.push('  ' + Nm(B, w) + ' (' + w.hp + '): too much left in it');
      });
      B.card(lines.slice(0, 8), 420); yield { fx: 1 }; yield 24;
    },
    ai: function (B, u, e, slot, fs) {
      var pool = avg((6 + 2 * Math.max(0, slot - 1)) + 'd10');
      return TX().bestArea(B, u, e, fs, function (caught) { var left = pool, sc = 0; caught.filter(function (w) { return w !== u && !w.conds.blinded; }).sort(function (a, b) { return a.hp - b.hp; }).forEach(function (w) { if (w.hp > left) return; left -= w.hp; sc += (G.hostile(u, w) ? 1 : -1.3) * (TX().dpr(w) * 0.8 + 2); }); return sc; });
    }
  };
  // Command (SRD 5.1): one word, WIS; the dead and those with no speech are deaf to it. The Mirror's asking (RULED 09-28)
  var WORDS = [{ label: 'GROVEL (prone, its turn gone)', value: 'grovel' }, { label: 'HALT (no move, no action)', value: 'halt' }, { label: 'FLEE (away from you, its turn)', value: 'flee' }, { label: 'DROP (what it holds)', value: 'drop' }];
  function deaf(w) { return w.type === 'undead' || (w.abil && w.abil.int <= 3) ? 'it does not understand' : ''; }
  E.command = {
    summary: function () { return 'a foe within 60 ft · WIS · one word it obeys on its turn: GROVEL, HALT, FLEE, DROP'; },
    cast: function* (B, u, t, slot, head, x) {
      var word = x.word;
      if (!word) word = (u.side !== 'party' || u.guest) ? E.command.pick(B, u, t) : yield { prompt: { who: u, title: u.name + ': COMMAND ' + nm(B, t).toUpperCase(), lines: ['One word, and it must obey (WIS DC ' + x.dc + ').'], opts: WORDS } };
      if (!word) word = 'halt';
      var extra = (t.units ? t.units : [t]);
      yield* saveAll(B, u, extra, 'wis', x.dc, null, '', false, head + ': "' + word.toUpperCase() + '!"', { skip: deaf, failText: 'obeys', cond: function (w) { w.conds.commanded = { word: word, by: u.id }; w.commandedBy = u.id; } });
    },
    pick: function (B, u, t) {
      // GROVEL when one of its own can hit it prone next; FLEE when it stands at the caster's side (it leaves, and pays for it); else HALT
      var mates = B.units.filter(function (w) { return w !== u && w.side === u.side && G.standing(w) && G.dist(w, t) <= 5; }).length;
      if (mates) return 'grovel';
      if (G.dist(u, t) <= 5) return 'flee';
      return 'halt';
    },
    ai: function (B, u, e, slot, fs) { var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, e.g, t) || deaf(t) || t.conds.commanded) return; var sc = TX().pFail(t, 'wis', u.spellDC) * (TX().dpr(t) * 0.9 + 2); if (!best || sc > best.score) best = { score: sc, t: t }; }); return best; }
  };
  E.entangle = {
    summary: function () { return '20-ft square within 90 ft · STR or restrained by vines; the ground difficult (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), rec = { kind: 'vines', sq: sq, by: u.id, difficult: true };
      B.grounds = (B.grounds || []).concat([rec]); FX.bloom(t.x, t.y, sq, 'moss');
      var held = [];
      yield* saveAll(B, u, caughtIn(B, sq), 'str', x.dc, null, '', false, head + ': grasping weeds and vines burst from the ground', { skip: function (w) { return RU.immuneTo(w, 'restrained') ? 'nothing holds it' : ''; }, failText: 'restrained', cond: function (w) { w.conds.restrained = { dc: x.dc, by: u.id, kind: 'vines' }; held.push(w); } });
      M.concentrate(B, u, 'entangle', 'Entangle', function () { removeGround(B, rec); B.units.forEach(function (w) { var r = w.conds.restrained; if (r && r.by === u.id && !r.grapple) delete w.conds.restrained; }); B.card(['{g}The vines wither.{/}'], 240); });
    },
    ai: function (B, u, e, slot, fs) { return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { if (RU.immuneTo(w, 'restrained')) return; sc += (G.hostile(u, w) ? 1 : -1.3) * TX().pFail(w, 'str', u.spellDC) * (TX().dpr(w) * 0.6 + 4) * 2; }); return sc; }); }
  };
  E.expeditiousretreat = {
    summary: function () { return 'bonus action · Dash as a bonus action each turn (concentration)'; },
    cast: function* (B, u, t, slot, head) { u.conds.retreat = { by: u.id }; u.turn.bonusDash = true; M.concentrate(B, u, 'expeditiousretreat', 'Expeditious Retreat', function () { delete u.conds.retreat; }); B.card([head + ': quick feet (a Dash each turn as a bonus action).']); yield 16; },
    ai: function () { return null; }
  };
  E.falselife = {
    summary: function (e) { return 'yourself · 1d4+' + (4 + 5 * Math.max(0, e.slot - 1)) + ' temporary HP'; },
    cast: function* (B, u, t, slot, head, x) { var r = D.roll('1d4+' + (4 + 5 * up(x.sp, slot))); u.temp = Math.max(u.temp || 0, r.total); FX.sparkle(u, 'violet', 14); B.card([head + ': a false life fills him -- {c}' + r.total + ' temporary HP{/}.']); yield 20; },
    ai: function (B, u) { return !u.temp && B.round <= 1 ? { score: 3, t: u } : null; }
  };
  E.grease = {
    summary: function () { return '10-ft square within 60 ft · DEX or prone, and again for any who enter or end a turn on it; difficult'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), rec = { kind: 'grease', sq: sq, by: u.id, dc: x.dc, difficult: true, till: 10 };
      B.grounds = (B.grounds || []).concat([rec]); FX.bloom(t.x, t.y, sq, 'stone');
      yield* saveAll(B, u, caughtIn(B, sq).filter(function (w) { return !w.noProne && !RU.immuneTo(w, 'prone'); }), 'dex', x.dc, null, '', false, head + ': slick grease over the ground', { failText: 'down', cond: function (w) { w.conds.prone = true; } });
    },
    ai: function (B, u, e, slot, fs) { return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { if (w.noProne) return; sc += (G.hostile(u, w) ? 1 : -1.3) * (TX().pFail(w, 'dex', u.spellDC) * 3 + 1.5); }); return sc; }); }
  };
  E.guidingbolt = {
    summary: function (e, u) { return 'spell attack, 120 ft · ' + dice(e.sp, u, e.slot) + ' radiant · the next attack at it has advantage'; },
    cast: function* (B, u, t, slot, head, x) { yield* spellAttack(B, u, t, x.sp, x.g, dice(x.sp, u, slot), { fx: 'bolt', onHit: function (w) { w.conds.guided = { by: u.id, till: { who: u.id, at: 'end', n: 2 } }; FX.sparkle(w, 'gold', 14); } }); },
    rider: function (B, u, t, p) { return p * 3; }
  };
  function healAmt(u, sp, slot, base) { return { expr: more(base, up(sp, slot)), plus: M.mod(u) + lifeBonus(u, slot) }; }
  function* healOne(B, u, w, sp, slot, head, base) {
    var h = healAmt(u, sp, slot, base), r = D.roll(h.expr), amt = r.total + h.plus, max = D.parseDice(h.expr).n * D.parseDice(h.expr).s + h.plus;
    var got = B.heal(w, amt, { max: max });
    // Blessed Healer (Life 6): healing another heals the caster 2 + the slot
    var self = u.subclass === 'Life Domain' && u.lvl >= 6 && w !== u && slot ? B.heal(u, 2 + slot) : 0;
    B.card([head + ' on ' + w.name + ': ' + h.expr + RU.sign(h.plus) + ' ' + RU.fmtRolls(r.rolls) + ' = {n}' + amt + '{/}' + (got < amt ? ' (' + got + ' to full)' : '') + (self ? '  {g}(blessed healer +' + self + '){/}' : '')]);
    FX.sparkle(w, 'glow', 14);
  }
  E._healOne = healOne;
  E.healingword = {
    summary: function (e, u) { return 'bonus action · an ally within 60 ft · ' + more('1d4', Math.max(0, e.slot - 1)) + RU.sign(M.mod(u) + lifeBonus(u, e.slot)) + ' healing (the fallen get up)'; },
    cast: function* (B, u, t, slot, head, x) { yield* healOne(B, u, t, x.sp, slot, head, '1d4'); yield 20; },
    ai: function (B, u, e, slot, fs, allies) {
      var amt = avg(more('1d4', Math.max(0, slot - 1))) + M.mod(u) + lifeBonus(u, slot), best = null;
      allies.forEach(function (w) { if (w.dead || !M.targetOK(B, u, e.g, w)) return; var need = TX().healNeed(B, u, w); if (!need) return; var got = Math.min(amt, w.maxhp - Math.max(0, w.hp)), sc = got * need + (w.hp <= 0 ? TX().dpr(w) * 2.5 : 0); if (!best || sc > best.score) best = { score: sc, t: w }; });
      return best;
    }
  };
  E.hideouslaughter = {
    summary: function () { return 'a foe within 30 ft · WIS · prone and helpless with laughter; a save each turn, and when hurt (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var dc = x.dc, hit = [];
      yield* saveAll(B, u, [t], 'wis', dc, null, '', false, head + ' at ' + nm(B, t), { skip: function (w) { return w.abil && w.abil.int <= 4 ? 'too simple to find it funny' : ''; }, failText: 'helpless with laughter', cond: function (w) { w.conds.laughing = { dc: dc, by: u.id, spell: 'hideouslaughter', single: true }; w.conds.incapacitated = { by: u.id }; w.conds.prone = true; hit.push(w); } });
      if (hit.length) M.concentrate(B, u, 'hideouslaughter', 'Hideous Laughter', function () { hit.forEach(function (w) { if (w.conds.laughing && w.conds.laughing.by === u.id) { delete w.conds.laughing; delete w.conds.incapacitated; } }); });
    },
    ai: function (B, u, e, slot, fs) { var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, e.g, t) || t.conds.laughing || (t.abil && t.abil.int <= 4)) return; var pf = TX().pFail(t, 'wis', u.spellDC), sc = pf * (TX().dpr(t) * 1.8 + 4); if (!best || sc > best.score) best = { score: sc, t: t, keep: sc * 0.7 }; }); return best; }
  };
  // Hunter's Mark and Mirror's Gaze: a mark held by concentration; when the marked one drops, a bonus action moves it (no slot)
  function markSpell(id, name, o) {
    return {
      geo: function (B, u, g) { return u.conc && u.conc.id === id && !(B.units.some(function (w) { return w.conds.marked && w.conds.marked.by === u.id && G.standing(w); })) ? Object.assign({}, g, { free: true, move: true }) : null; },
      list: function (B, u, e) { return u.conc && u.conc.id === id && B.units.some(function (w) { return w.conds.marked && w.conds.marked.by === u.id && G.standing(w); }) ? { why: 'the mark holds on ' + B.units.filter(function (w) { return w.conds.marked && w.conds.marked.by === u.id; })[0].name } : null; },
      summary: function (e, u) { return 'bonus action · a foe within 90 ft · +1d6' + (o.type ? ' ' + o.type : '') + ' on your ' + (o.any ? '' : 'weapon ') + 'hits' + (o.gaze ? '; it cannot hide from you, and unseen gains it nothing' : '') + ' (concentration; moved when it drops)'; },
      cast: function* (B, u, t, slot, head, x) {
        B.units.forEach(function (w) { if (w.conds.marked && w.conds.marked.by === u.id) delete w.conds.marked; });
        t.conds.marked = { by: u.id, name: name, type: o.type || null, any: !!o.any, gaze: !!o.gaze };
        if (o.gaze) { delete t.conds.hidden; }
        FX.ring(t, o.gaze ? 'violet' : 'moss', 30);
        if (!(u.conc && u.conc.id === id)) M.concentrate(B, u, id, name, function () { B.units.forEach(function (w) { if (w.conds.marked && w.conds.marked.by === u.id) delete w.conds.marked; }); });
        B.card([head + ': ' + (o.gaze ? 'the mirror at her breast turns to ' + nm(B, t) + ' and holds it' : u.name + ' marks ' + nm(B, t) + ' as quarry') + ' (+1d6' + (o.type ? ' ' + o.type : '') + ').']);
        yield 16;
      },
      ai: function (B, u, e, slot, fs) {
        var target = fs.filter(function (t) { return M.targetOK(B, u, e.g, t); }).sort(function (a, b) { return b.hp - a.hp; })[0];
        if (!target) return null;
        var n = u.attacksBase || (o.any ? (u.lvl >= 5 ? 2 : 1) : 1), sc = n * 3.5 * 0.65 * Math.min(4, target.hp / 10) + (o.gaze && (target.conds.invisible || target.conds.hidden) ? 5 : 0);
        return { score: sc, t: target, keep: sc * 0.7 };
      }
    };
  }
  E.huntersmark = markSpell('huntersmark', 'Hunter\'s Mark', {});
  E.mirrorsgaze = markSpell('mirrorsgaze', 'Mirror\'s Gaze', { type: 'psychic', any: true, gaze: true });
  E.inflictwounds = {
    summary: function (e, u) { return 'touch: melee spell attack · ' + dice(e.sp, u, e.slot) + ' necrotic'; },
    cast: function* (B, u, t, slot, head, x) { yield* spellAttack(B, u, t, x.sp, x.g, dice(x.sp, u, slot)); },
    ai: function (B, u, e, slot, fs) { var best = null, d = avg(dice(e.sp, u, slot)); fs.forEach(function (t) { if (G.dist(u, t) > 5 + u.turn.move || !M.sees(B, u, t)) return; var from = G.dist(u, t) > 5 ? D.ai.approach(u, t, G.reach(u, u.turn.move), 5) : null; if (G.dist(u, t) > 5 && (!from || G.dist(u, t, from.x, from.y) > 5)) return; var sc = TX().worth(TX().pHit(u.spellAtk, RU.ac(t), 0) * d, t) - (from ? 1 : 0); if (!best || sc > best.score) best = { score: sc, t: t, from: from }; }); return best; }
  };
  E.longstrider = {
    summary: function () { return 'touch · +10 ft speed for the fight'; },
    cast: function* (B, u, t, slot, head) { if (!t.conds.longstrider) { t.conds.longstrider = true; t.speed += 10; if (t.turn && t === u) t.turn.move += 10; } B.card([head + ' on ' + t.name + ': {c}+10 ft{/} of stride.']); yield 16; },
    ai: function () { return null; }
  };
  E.sanctuary = {
    summary: function () { return 'bonus action · an ally within 30 ft (or you) · a foe must save WIS to strike or spell them; it ends if they attack'; },
    cast: function* (B, u, t, slot, head, x) { t.conds.sanctuary = { dc: x.dc, by: u.id }; FX.ring(t, 'gold', 34); B.card([head + ' on ' + t.name + ': a ward -- whoever would strike must first save WIS ' + x.dc + '.']); yield 16; },
    ai: function (B, u, e, slot, fs, allies) {
      var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 30 && !w.conds.sanctuary && w.hp < w.maxhp * 0.4; }).sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; })[0];
      if (!t) return null;
      var near = B.units.filter(function (w) { return G.hostile(t, w) && G.standing(w) && G.dist(t, w) <= 10; }).length;
      return near ? { score: near * 3 + 2, t: t } : null;
    }
  };
  E.faeriefire = {
    summary: function () { return '20-ft cube within 60 ft · DEX or outlined: attacks at them with advantage, no hiding (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), lit = []; FX.bloom(t.x, t.y, sq, 'violet');
      yield* saveAll(B, u, caughtIn(B, sq), 'dex', x.dc, null, '', false, head + ': violet light', { failText: 'outlined', cond: function (w) { w.conds.faerie = { by: u.id }; delete w.conds.hidden; lit.push(w); } });
      if (lit.length) M.concentrate(B, u, 'faeriefire', 'Faerie Fire', function () { lit.forEach(function (w) { if (w.conds.faerie && w.conds.faerie.by === u.id) delete w.conds.faerie; }); });
    },
    ai: function (B, u, e, slot, fs, allies) {
      var mates = allies.filter(function (w) { return G.standing(w) && w !== u; }).reduce(function (s, w) { return s + TX().dpr(w); }, TX().dpr(u));
      return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { if (w.conds.faerie) return; sc += (G.hostile(u, w) ? 1 : -1) * TX().pFail(w, 'dex', u.spellDC) * (mates * 0.12 + (w.conds.invisible ? 6 : 1)); }); return sc; });
    }
  };
  E.glasswhisper = {
    summary: function (e, u) { return 'a foe within 60 ft that hears you · WIS · ' + dice(e.sp, u, e.slot) + ' psychic (half on a save); failed, it sees itself in the glass: no reactions till its turn ends'; },
    cast: function* (B, u, t, slot, head, x) { FX.sparkle(t, 'violet', 16); yield* saveAll(B, u, [t], 'wis', x.dc, dice(x.sp, u, slot), 'psychic', true, head + ' to ' + nm(B, t), { failText: 'sees itself in the glass', cond: function (w) { w.reaction = 0; w.conds.noReact = { till: { who: w.id, at: 'end', n: 1 } }; } }); },
    ai: function (B, u, e, slot, fs) { var best = null, d = avg(dice(e.sp, u, slot)); fs.forEach(function (t) { if (!M.targetOK(B, u, e.g, t)) return; var pf = TX().pFail(t, 'wis', u.spellDC), sc = TX().worth(pf * d + (1 - pf) * d / 2, t); if (!best || sc > best.score) best = { score: sc, t: t }; }); return best; }
  };
  E.protectionfromevilandgood = {
    summary: function () { return 'touch · aberrations, celestials, elementals, fey, fiends and the dead attack them at disadvantage (concentration)'; },
    cast: function* (B, u, t, slot, head) { t.conds.pfeg = { by: u.id }; M.concentrate(B, u, 'protectionfromevilandgood', 'Protection from Evil and Good', function () { delete t.conds.pfeg; }); FX.ring(t, 'gold', 30); B.card([head + ' on ' + t.name + ': a ward against the otherworldly and the dead (concentration).']); yield 16; },
    ai: function (B, u, e, slot, fs, allies) {
      if (u.conc) return null;
      var bad = fs.filter(function (w) { return /aberration|celestial|elemental|fey|fiend|undead/.test(w.type || ''); });
      if (!bad.length) return null;
      var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 && !w.conds.pfeg; }).sort(function (a, b) { return b.maxhp - a.maxhp; })[0];
      return t ? { score: bad.reduce(function (s, w) { return s + TX().dpr(w) * 0.25; }, 0) * 3, t: t } : null;
    }
  };
  // Darkness as a spell (SRD 5.1: a 15-ft sphere at a point within 60 ft, concentration): the drow's innate is magic.js castDarkness
  E.darkness = {
    summary: function () { return '15-ft sphere of magical darkness within 60 ft: nobody sees in, out or across (Devil\'s Sight does) (concentration)'; },
    cast: function* (B, u, t, slot, head, x) { yield* M.darknessAt(B, u, M.area(u, x.g, t.x, t.y), head); },
    ai: function (B, u, e, slot, fs, allies) {
      if (!u.devilSight || u.conc) return null;
      // a Devil's-Sight warlock drops it on herself: she sees out, they do not see in
      var sq = G.sphere(u.x, u.y, 15), foesIn = fs.filter(function (w) { return G.inArea(w, sq); }).length, matesIn = allies.filter(function (w) { return w !== u && G.inArea(w, sq) && !w.devilSight; }).length;
      var near = fs.filter(function (w) { return G.dist(u, w) <= 60; }).length;
      if (!near) return null;
      var sc = near * 2.5 + foesIn * 1.5 - matesIn * 3;
      return sc > 0 ? { score: sc, t: { x: u.x, y: u.y }, keep: sc * 0.7 } : null;
    }
  };
  // the darkness itself, laid at squares (the spell's point, the drow's innate): lights of 2nd level or lower in it go out
  M.darknessAt = function* (B, u, sq, head) {
    var Lt = D.light, all = Lt ? Lt.all(B) : [];
    var inSq = function (x, y) { return sq.some(function (q) { return q[0] === Math.round(x) && q[1] === Math.round(y); }); };
    if (all.some(function (l) { return l.kind === 'daylight' && sq.some(function (q) { return Math.hypot(q[0] - l.x, q[1] - l.y) * 5 <= l.bright; }); })) { D.sfx('magic'); B.card([(head || u.name) + ': darkness -- and the daylight burns it away as it forms.'], 300); yield 30; return; }
    var gone = [];
    B.units.forEach(function (w) { if (w.conds.light && inSq(w.x, w.y)) { delete w.conds.light; gone.push(w.name + '\'s light'); } });
    var rec = { by: u.id, sq: sq, kind: 'darkness' };
    B.darks = (B.darks || []).concat([rec]);
    if (B.lightMap) B.lightMap = null;
    M.concentrate(B, u, 'darkness', 'Darkness', function () { B.darks = (B.darks || []).filter(function (d) { return d !== rec; }); if (B.lightMap) B.lightMap = null; B.card(['{p}The darkness lifts.{/}'], 300); });
    D.sfx('magic'); FX.bloom(sq[0][0], sq[0][1], sq, 'violet');
    B.card([(head || u.name) + ': {p}a sphere of darkness{/}' + (gone.length ? ', swallowing ' + gone.join(', ') : '') + '  {g}(nobody sees in, out or across; concentration){/}'], 420);
    yield 40;
  };
})();
