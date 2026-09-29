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
    // Potent Cantrip (the evoker, 6): a cantrip saved against still deals half
    if (o.cantrip && u.subclass === 'School of Evocation' && u.lvl >= 6) half = true;
    var r = dexpr ? D.roll(dexpr) : null, lines = [head + (r ? '  ' + dexpr + ' ' + RU.fmtRolls(r.rolls) + ' = {o}' + r.total + '{/} ' + type : '') + '  ' + ab.toUpperCase() + ' DC ' + dc], hits = [], failed = [];
    list.forEach(function (w) {
      if (o.skip && o.skip(w)) { lines.push('  ' + Nm(B, w) + ': {g}' + o.skip(w) + '{/}'); return; }
      if (M.globed && M.globed(B, u, w, o.slot || 5)) { lines.push('  ' + Nm(B, w) + ': {c}inside the globe: untouched{/}'); return; }
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
    [['laughing', 'wis', 'stops laughing'], ['blindedBy', 'con', 'can see again'], ['slowed', 'wis', 'shakes off the slow'], ['enfeebled', 'con', 'feels the strength come back'], ['confused', 'wis', 'comes to its senses']].forEach(function (q) {
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
    cast: function* (B, u, t, slot, head, x) { FX.projectile(u, t, 'bolt'); yield* saveAll(B, u, [t], 'con', x.dc, dice(x.sp, u, 0), 'poison', false, head, { cantrip: true, skip: function (w) { return RU.immuneTo(w, 'poisoned') || (w.immune || []).indexOf('poison') >= 0 ? 'no poison takes it' : ''; } }); },
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
    cast: function* (B, u, t, slot, head, x) { FX.sparkle(t, 'gold', 16); yield* saveAll(B, u, [t], 'dex', x.dc, dice(x.sp, u, 0), 'radiant', false, head + ' on ' + nm(B, t), { cantrip: true }); },
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
    cast: function* (B, u, t, slot, head, x) { yield* saveAll(B, u, [t], 'wis', x.dc, dice(x.sp, u, 0), 'psychic', false, head + ' at ' + nm(B, t), { cantrip: true, failText: 'stung', cond: function (w) { w.conds.mocked = { till: { who: w.id, at: 'end', n: 1 } }; } }); },
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
        B.card([head + ': ' + (o.gaze ? 'the mirror ' + (u.named ? 'at ' + u.name + '\'s breast ' : '') + 'turns to ' + nm(B, t) + ' and holds it' : u.name + ' marks ' + nm(B, t) + ' as quarry') + ' (+1d6' + (o.type ? ' ' + o.type : '') + ').']);
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
    cast: function* (B, u, t, slot, head, x) { var sa = t.conds.sanctuary = { dc: x.dc, by: u.id }; M.expire(B, u, 'sanctuary', function () { if (t.conds.sanctuary === sa) delete t.conds.sanctuary; }); FX.ring(t, 'gold', 34); B.card([head + ' on ' + t.name + ': a ward -- whoever would strike must first save WIS ' + x.dc + '.']); yield 16; },
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
  // ------------------------------------------------------------------ metal, for the spells that ask (Heat Metal, Shocking Grasp)
  M.metalArmor = function (w) {
    if (w.metalArmor != null) return !!w.metalArmor;
    var R = window.DS.R, h = w.src, a = h && h.equip && R.item(h.equip.armor);
    return !!(a && a.armor && (a.armor.type === 'heavy' || (a.armor.type === 'medium' && !/hide/.test(h.equip.armor))));
  };
  M.metalWeapon = function (w) {
    if (w.weapon && w.weapon.name) return !/club|staff|unarmed|fist|sling|dart|bow/i.test(w.weapon.id || w.weapon.name) || /crossbow/i.test(w.weapon.id || '');
    return Object.keys(w.attacks || {}).some(function (k) { return /sword|axe|pick|mace|spear|scimitar|dagger|blade|hammer|halberd|pike|morningstar|flail|crossbow|glaive|trident/i.test(w.attacks[k].name || ''); });
  };
  E.shockinggrasp.metal = M.metalArmor;

  // ------------------------------------------------------------------ Cure Wounds through the one heal (Disciple of Life, Beacon of Hope's most)
  E.curewounds = { cast: function* (B, u, t, slot, head, x) { yield* healOne(B, u, t, x.sp, slot, head, '1d8'); yield 24; } };

  // ------------------------------------------------------------------ 2nd level
  E.acidarrow = {
    summary: function (e, u) { var n = Math.max(0, e.slot - 2); return 'spell attack, 90 ft · ' + more('4d4', n) + ' acid now and ' + more('2d4', n) + ' at the end of its next turn (a miss: half the first)'; },
    cast: function* (B, u, t, slot, head, x) {
      var n = up(x.sp, slot);
      yield* spellAttack(B, u, t, x.sp, x.g, more('4d4', n), { fx: 'bolt',
        onHit: function (w) { w.conds.acid = { dice: more('2d4', n), fresh: B.active === w }; FX.sparkle(w, 'moss', 12); },
        onMiss: function (w) { var r = D.roll(more('4d4', n)), h = Math.floor(r.total / 2); B.card(['  the arrow splashes: ' + RU.fmtRolls(r.rolls) + ' half = {r}' + h + '{/} acid'], 240); B.hurt(w, h, 'acid'); } });
    },
    rider: function (B, u, t, p) { return p * 5 + (1 - p) * 2.5; }
  };
  E.barkskin = {
    summary: function () { return 'touch · its AC can be no lower than 16 (concentration)'; },
    cast: function* (B, u, t, slot, head) { t.conds.barkskin = { by: u.id }; M.concentrate(B, u, 'barkskin', 'Barkskin', function () { delete t.conds.barkskin; }); FX.sparkle(t, 'moss', 16); B.card([head + ' on ' + t.name + ': skin like bark -- {c}AC ' + RU.ac(t) + '{/} (concentration).']); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { if (u.conc) return null; var best = null; allies.forEach(function (w) { if (!G.standing(w) || G.dist(u, w) > 5 + u.turn.move || w.conds.barkskin || RU.ac(w) >= 16) return; var sc = (16 - RU.ac(w)) * 0.05 * 3 * B.units.filter(function (x) { return G.hostile(w, x) && G.standing(x) && G.dist(w, x) <= 30; }).reduce(function (s, x) { return s + TX().dpr(x); }, 0) / 2; var from = G.dist(u, w) > 5 ? D.ai.approach(u, w, G.reach(u, u.turn.move), 5) : null; if (!best || sc > best.score) best = { score: sc, t: w, from: from, keep: sc * 0.6 }; }); return best; }
  };
  E.blindnessdeafness = {
    summary: function () { return 'a foe within 30 ft · CON or blinded for a minute (a save each turn)'; },
    cast: function* (B, u, t, slot, head, x) { var dc = x.dc; yield* saveAll(B, u, [t], 'con', dc, null, '', false, head + ' on ' + nm(B, t), { failText: 'blinded', cond: function (w) { w.conds.blinded = { by: u.id }; w.conds.blindedBy = { dc: dc, by: u.id }; } }); },
    ai: function (B, u, e, slot, fs) { var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, e.g, t) || t.conds.blinded || t.blindsight) return; var pf = TX().pFail(t, 'con', u.spellDC), sc = pf * (TX().dpr(t) * 0.6 * Math.min(3, 1 / Math.max(0.3, 1 - pf)) + 3); if (!best || sc > best.score) best = { score: sc, t: t }; }); return best; }
  };
  E.blur = {
    summary: function () { return 'yourself · attacks at you at disadvantage (not by blindsight or truesight) (concentration)'; },
    cast: function* (B, u, t, slot, head) { u.conds.blur = { by: u.id }; M.concentrate(B, u, 'blur', 'Blur', function () { delete u.conds.blur; }); FX.sparkle(u, 'silver', 16); B.card([head + ': his outline shivers and smears (attacks at him at disadvantage; concentration).']); yield 20; },
    ai: function (B, u, e, slot, fs) { if (u.conc || u.conds.blur) return null; var th = fs.filter(function (w) { return G.dist(u, w) <= 60; }).reduce(function (s, w) { return s + TX().dpr(w); }, 0); return { score: th * 0.2 * 2 + (u.hp < u.maxhp / 2 ? 3 : 0), t: u, keep: th * 0.2 }; }
  };
  E.brandingsmite = {
    summary: function (e) { return 'bonus action · your next weapon hit +' + more('2d6', Math.max(0, e.slot - 2)) + ' radiant; the struck one glows and cannot turn invisible (concentration)'; },
    cast: function* (B, u, t, slot, head, x) { u.conds.branding = { dice: more('2d6', up(x.sp, slot)) }; M.concentrate(B, u, 'brandingsmite', 'Branding Smite', function () { delete u.conds.branding; B.units.forEach(function (w) { if (w.conds.branded && w.conds.branded.by === u.id) delete w.conds.branded; }); }); FX.sparkle(u, 'gold', 14); B.card([head + ': the blade takes a waiting light.']); yield 16; },
    ai: function (B, u, e, slot, fs) { if (u.conc || !fs.some(function (t) { return G.dist(u, t) <= u.turn.move + 5; })) return null; return { score: 7 * 0.65 + (fs.some(function (t) { return t.conds.invisible; }) ? 5 : 0), t: u, keep: 3 }; }
  };
  E.enhanceability = {
    summary: function () { return 'touch · Bear\'s Endurance: 2d6 temporary HP, advantage on CON checks (concentration)'; },
    cast: function* (B, u, t, slot, head) { var r = D.roll('2d6'); t.temp = Math.max(t.temp || 0, r.total); t.conds.enhanced = { by: u.id }; M.concentrate(B, u, 'enhanceability', 'Enhance Ability', function () { delete t.conds.enhanced; }); FX.sparkle(t, 'gold', 14); B.card([head + ' on ' + t.name + ': the bear\'s endurance -- {c}' + r.total + ' temporary HP{/} (concentration).']); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { if (u.conc) return null; var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 && !(w.temp > 0); }).sort(function (a, b) { return foesAt(B, b) - foesAt(B, a); })[0]; return t ? { score: 7 * 0.8, t: t, keep: 1 } : null; }
  };
  function foesAt(B, w) { return B.units.filter(function (x) { return G.hostile(w, x) && G.standing(x) && G.dist(w, x) <= 10; }).length; }
  E.enlargereduce = {
    summary: function () { return 'a creature within 30 ft · an ally enlarged (+1d4 weapon damage, strong), a foe reduced on a failed CON (-1d4) (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      if (t.side === u.side) { t.conds.enlarged = { by: u.id }; M.concentrate(B, u, 'enlargereduce', 'Enlarge', function () { delete t.conds.enlarged; }); FX.ring(t, 'stone', 30); B.card([head + ': ' + t.name + ' swells to twice their size (+1d4 on weapon hits; concentration).']); yield 20; return; }
      var hit = false;
      yield* saveAll(B, u, [t], 'con', x.dc, null, '', false, head + ' on ' + nm(B, t), { failText: 'shrinks', cond: function (w) { w.conds.enlarged = { by: u.id, down: true }; hit = true; } });
      if (hit) M.concentrate(B, u, 'enlargereduce', 'Reduce', function () { delete t.conds.enlarged; });
    },
    ai: function (B, u, e, slot, fs, allies) {
      if (u.conc) return null;
      var a = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 30 && !w.conds.enlarged && typeof w.attacks === 'number' && !(w.weapon || {}).ranged; }).sort(function (p, q) { return (q.attacksBase || 1) - (p.attacksBase || 1); })[0];
      var sa = a ? (a.attacksBase || 1) * 2.5 * 0.65 * 3 : 0;
      var f = fs.filter(function (w) { return M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), w) && !w.conds.enlarged; }).sort(function (p, q) { return TX().dpr(q) - TX().dpr(p); })[0];
      var sf = f ? TX().pFail(f, 'con', u.spellDC) * 2.5 * 3 : 0;
      return sa >= sf ? (a ? { score: sa, t: a, keep: sa * 0.6 } : null) : { score: sf, t: f, keep: sf * 0.6 };
    }
  };
  // Flame Blade (SRD 5.1): the blade in hand (bonus action, concentration); each action after, a melee spell attack with it, 3d6 fire
  E.flameblade = {
    geo: function (B, u, g) { return u.conc && u.conc.id === 'flameblade' ? Object.assign({}, g, { shape: 'attack', range: 5, time: 'A', free: true, move: true, swing: true }) : null; },
    summary: function (e, u) { return (e.g.swing ? 'a slash of the blade: melee spell attack, ' : 'bonus action · a blade of fire in hand (concentration); each action, a melee spell attack, ') + more('3d6', Math.floor(Math.max(0, (u.conds.flameBlade ? u.conds.flameBlade.up : e.slot - 2)) / 2)) + ' fire'; },
    cast: function* (B, u, t, slot, head, x) {
      if (x.g.swing) { yield* spellAttack(B, u, t, x.sp, { range: 5 }, u.conds.flameBlade.dice, { fx: 'fire' }); return; }
      var dz = more('3d6', Math.floor(up(x.sp, slot) / 2));
      u.conds.flameBlade = { dice: dz, up: up(x.sp, slot) }; FX.sparkle(u, 'fire', 16);
      M.concentrate(B, u, 'flameblade', 'Flame Blade', function () { delete u.conds.flameBlade; });
      B.card([head + ': a blade of fire in his hand (' + dz + ' fire; concentration).']); yield 16;
    },
    ai: function (B, u, e, slot, fs) {
      if (e.g.swing) { var best = null, d = avg(u.conds.flameBlade.dice); fs.forEach(function (t) { if (G.dist(u, t) > 5 + u.turn.move) return; var from = G.dist(u, t) > 5 ? D.ai.approach(u, t, G.reach(u, u.turn.move), 5) : null; if (G.dist(u, t) > 5 && (!from || G.dist(u, t, from.x, from.y) > 5)) return; var sc = TX().worth(TX().pHit(u.spellAtk, RU.ac(t), 0) * d, t); if (!best || sc > best.score) best = { score: sc, t: t, from: from }; }); return best; }
      if (u.conc || !fs.some(function (t) { return G.dist(u, t) <= 30; })) return null;
      return { score: 10.5 * 0.6 * 2, t: u, keep: 6 };
    }
  };
  E.gustofwind = {
    summary: function () { return '60-ft line from you · STR or pushed 15 ft away; the fog and the cloud in it blown apart'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y); FX.bloom(u.x, u.y, sq, 'silver');
      var before = (B.darks || []).length;
      B.darks = (B.darks || []).filter(function (d) { return !((d.kind === 'fog' || d.kind === 'stink') && d.sq.some(function (q) { return sq.some(function (p) { return p[0] === q[0] && p[1] === q[1]; }); })); });
      if (B.darks.length < before) { B.card(['{c}The wind tears the cloud apart.{/}'], 240); if (B.lightMap) B.lightMap = null; }
      var pushed = caughtIn(B, sq).filter(function (w) { return w !== u; });
      yield* saveAll(B, u, pushed, 'str', x.dc, null, '', false, head + ': a howling wind', { failText: 'blown back', cond: function (w) { M.push(B, u, w, 3); } });
    },
    ai: function () { return null; }
  };
  // Heat Metal (SRD 5.1): worn or held metal glows; 2d8 fire, no save, and again with a bonus action each turn (concentration); CON or it
  // drops what it holds (armour it cannot: disadvantage on its attacks till the caster's next turn)
  E.heatmetal = {
    geo: function (B, u, g) { var h = u.conc && u.conc.id === 'heatmetal' && B.units.filter(function (w) { return w.conds.heated && w.conds.heated.by === u.id && G.standing(w); })[0]; return h ? Object.assign({}, g, { time: 'B', free: true, move: true, again: true }) : null; },
    summary: function (e) { return (e.g.again ? 'bonus action · the metal flares again: ' : 'a foe within 60 ft in metal · ') + more('2d8', Math.max(0, e.slot - 2)) + ' fire, no save; CON or it drops its weapon (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      if (x.g.again) t = B.units.filter(function (w) { return w.conds.heated && w.conds.heated.by === u.id; })[0] || t;
      var dz = x.g.again ? t.conds.heated.dice : more('2d8', up(x.sp, slot)), r = D.roll(dz);
      if (!x.g.again) { t.conds.heated = { by: u.id, dice: dz }; M.concentrate(B, u, 'heatmetal', 'Heat Metal', function () { delete t.conds.heated; }); }
      FX.sparkle(t, 'fire', 16);
      B.card([head + (x.g.again ? ': the metal on ' + nm(B, t) + ' flares again' : ': the metal on ' + nm(B, t) + ' glows red-hot') + '  ' + dz + ' ' + RU.fmtRolls(r.rolls) + ' = {r}' + r.total + '{/} fire'], 300);
      B.hurt(t, r.total, 'fire');
      if (t.hp > 0 && !t.dead) {
        var sv = RU.save(t, 'con', x.dc), held = M.metalWeapon(t) && !M.metalArmor(t);
        B.card(['  ' + Nm(B, t) + ': CON ' + RU.saveText(sv) + ' vs DC ' + x.dc + '  ' + (sv.ok ? '{n}holds on{/}' : held ? '{o}drops the burning weapon{/}' : '{o}cannot shed it: disadvantage on its attacks{/}')], 300);
        if (!sv.ok) { if (held) t.conds.disarmed = { till: { who: t.id, at: 'end', n: 1 } }; else t.conds.disAt = { id: '*', why: 'burning metal', till: { who: u.id, at: 'start', n: 1 } }; }
      }
      yield 24;
    },
    ai: function (B, u, e, slot, fs) {
      if (e.g.again) { var h = B.units.filter(function (w) { return w.conds.heated && w.conds.heated.by === u.id; })[0]; return h ? { score: TX().worth(9, h), t: h } : null; }
      if (u.conc) return null;
      var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t) || !(M.metalArmor(t) || M.metalWeapon(t))) return; var sc = TX().worth(avg(more('2d8', Math.max(0, slot - 2))), t) * 2.2; if (!best || sc > best.score) best = { score: sc, t: t, keep: sc * 0.5 }; }); return best;
    }
  };
  E.magicweapon = {
    summary: function (e) { return 'bonus action · touch · a weapon becomes +' + (e.slot >= 6 ? 3 : e.slot >= 4 ? 2 : 1) + ', magical (concentration)'; },
    cast: function* (B, u, t, slot, head) { var b = slot >= 6 ? 3 : slot >= 4 ? 2 : 1, w0 = t.weapon; if (w0) { t.conds.magicWeapon = { by: u.id, base: w0 }; t.weapon = Object.assign({}, w0, { atk: w0.atk + b, mod: (w0.mod || 0) + b, magic: true, name: w0.name + ' +' + b }); } M.concentrate(B, u, 'magicweapon', 'Magic Weapon', function () { if (t.conds.magicWeapon) { t.weapon = t.conds.magicWeapon.base; delete t.conds.magicWeapon; } }); FX.sparkle(t, 'glow', 14); B.card([head + ' on ' + (t === u ? 'his own blade' : t.name + '\'s weapon') + ': {c}+' + b + '{/}, and magical.']); yield 16; },
    ai: function (B, u, e, slot, fs) { if (u.conc || !u.weapon || u.weapon.magic || !fs.some(function (t) { return G.dist(u, t) <= u.turn.move + 5; })) return null; var mundane = fs.some(function (t) { return t.resist && t.resist.indexOf('mundane') >= 0; }); return { score: (u.attacksBase || 1) * 1.6 * 3 + (mundane ? 12 : 0), t: u, keep: 3 }; }
  };
  E.mirrorimage = {
    summary: function () { return 'yourself · three illusory doubles: a blow may strike one instead (a minute)'; },
    cast: function* (B, u, t, slot, head) { u.images = 3; M.expire(B, u, 'mirrorimage', function () { u.images = 0; }); FX.sparkle(u, 'violet', 24); B.card([head + ': three of him, and which is which?']); yield 20; }, // (a minute: M.expire)
    ai: function (B, u, e, slot, fs) { if ((u.images || 0) > 1) return null; var th = fs.filter(function (w) { return G.dist(u, w) <= 60; }).reduce(function (s, w) { return s + TX().dpr(w); }, 0); return { score: th * 0.35 * 2 + (u.hp < u.maxhp / 2 ? 3 : 0), t: u }; }
  };
  E.protectionfrompoison = {
    summary: function () { return 'touch · ends one poison; resistance to poison and advantage against it for the fight'; },
    cast: function* (B, u, t, slot, head) { var was = !!t.conds.poisoned; delete t.conds.poisoned; if (t.conds.paralyzed && t.conds.paralyzed.poison) delete t.conds.paralyzed; t.conds.poisonWard = { by: u.id }; FX.sparkle(t, 'moss', 14); B.card([head + ' on ' + t.name + ': ' + (was ? 'the poison goes out of them, and ' : '') + 'poison has no hold on them now.']); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 + u.turn.move && w.conds.poisoned; })[0]; if (!t) return null; var from = G.dist(u, t) > 5 ? D.ai.approach(u, t, G.reach(u, u.turn.move), 5) : null; return { score: TX().dpr(t) * (t.conds.paralyzed ? 2.5 : 0.8), t: t, from: from }; }
  };
  E.rayofenfeeblement = {
    summary: function () { return 'spell attack, 60 ft · its STR weapons deal half; a CON save at each of its turns\' end (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var dc = x.dc, got = null;
      yield* B.attack(u, t, { name: x.sp.name, atk: u.spellAtk, dice: '0', mod: 0, type: 'necrotic', spell: true, ranged: true, range: [60, 60], fx: 'bolt' }, { onHit: function (w) { w.conds.enfeebled = { dc: dc, by: u.id, spell: 'rayofenfeeblement', single: true }; got = w; } });
      if (got) { M.concentrate(B, u, 'rayofenfeeblement', 'Ray of Enfeeblement', function () { if (got.conds.enfeebled && got.conds.enfeebled.by === u.id) delete got.conds.enfeebled; }); B.card(['{p}' + Nm(B, got) + ' is enfeebled: its strength\'s blows deal half.{/}'], 300); }
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { shape: 'attack' }), t) || t.conds.enfeebled || (t.weapon && (t.weapon.ranged || t.weapon.finesse))) return; var p = TX().pHit(u.spellAtk, RU.ac(t), 0), sc = p * TX().dpr(t) * 0.5 * 2.5; if (!best || sc > best.score) best = { score: sc, t: t, keep: sc * 0.6 }; }); return best; }
  };
  E.spikegrowth = {
    summary: function () { return '20-ft radius within 150 ft · hidden spikes: difficult, and 2d4 piercing for each 5 ft moved in it (concentration)'; },
    cast: function* (B, u, t, slot, head, x) { var sq = M.area(u, x.g, t.x, t.y), rec = { kind: 'spikes', sq: sq, by: u.id, difficult: true }; B.grounds = (B.grounds || []).concat([rec]); FX.bloom(t.x, t.y, sq, 'moss'); M.concentrate(B, u, 'spikegrowth', 'Spike Growth', function () { removeGround(B, rec); B.card(['{g}The spikes wither back into the ground.{/}'], 240); }); B.card([head + ': the ground bristles with thorns (concentration).']); yield 30; },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; return TX().bestArea(B, u, e, fs, function (caught, sq) { var sc = 0; caught.forEach(function (w) { sc += (G.hostile(u, w) ? 1 : -1.5) * 5 * 1.5; }); return sc; }); }
  };
  // Spiritual Weapon (SRD 5.1): a floating weapon (a minute, no concentration); it strikes as it appears, and each turn after a bonus
  // action moves it 20 ft and strikes again: a melee spell attack, 1d8 + the caster's mod force (+1d8 for every two slot levels above 2nd)
  E.spiritualweapon = {
    geo: function (B, u, g) { var sw = spiritOf(B, u); return sw ? Object.assign({}, g, { free: true, move: true, again: true }) : null; },
    summary: function (e, u) { var sw = D.battle && spiritOf(D.battle, u); return (sw ? 'bonus action · the weapon moves 20 ft and strikes: ' : 'bonus action · a floating weapon within 60 ft strikes: ') + (sw ? sw.dice : more('1d8', Math.floor(Math.max(0, e.slot - 2) / 2))) + RU.sign(M.mod(u)) + ' force (a minute)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sw = spiritOf(B, u);
      if (!sw) { sw = { by: u.id, x: t.x, y: t.y, dice: more('1d8', Math.floor(up(x.sp, slot) / 2)), rounds: 10 }; B.spirits = (B.spirits || []).concat([sw]); B.card([head + ': a spectral ' + (u.cls === 'cleric' ? 'mace' : 'blade') + ' hangs in the air by ' + nm(B, t) + '.'], 240); }
      else if (Math.max(Math.abs(sw.x - t.x), Math.abs(sw.y - t.y)) * 5 > 25) { var dx = Math.sign(t.x - sw.x), dy = Math.sign(t.y - sw.y); sw.x += dx * 4; sw.y += dy * 4; B.card(['{y}' + u.name + '{/}\'s spectral weapon drifts closer.'], 200); yield 12; return; }
      sw.x = t.x; sw.y = t.y;
      FX.sparkle({ x: t.x, y: t.y, size: 1 }, 'glow', 18);
      var at = { name: 'Spiritual Weapon', atk: u.spellAtk, dice: sw.dice, mod: M.mod(u), type: 'force', spell: true, touch: true, ranged: false, fx: 'bolt', spirit: true };
      // (the swing comes from beside the target; the caster is drawn where he stands, the weapon swings: js/looks.js)
      var ux = u.x, uy = u.y; u.drawAt = { x: ux, y: uy }; u.x = t.x + (t.x > ux ? -1 : t.x < ux ? 1 : 0); u.y = t.y + (t.y > uy ? -1 : t.y < uy ? 1 : 0);
      try { yield* B.attack(u, t, at); } finally { u.x = ux; u.y = uy; delete u.drawAt; }
    },
    ai: function (B, u, e, slot, fs) {
      var sw = spiritOf(B, u), d = avg(sw ? sw.dice : more('1d8', Math.floor(Math.max(0, slot - 2) / 2))) + M.mod(u), best = null;
      fs.forEach(function (t) {
        if (sw ? Math.max(Math.abs(sw.x - t.x), Math.abs(sw.y - t.y)) * 5 > 25 : (G.dist(u, t) > 60 || !G.los(u, t).clear)) return;
        var sc = TX().worth(TX().pHit(u.spellAtk, RU.ac(t), 0) * d, t) * (sw ? 1 : 2.5); // (first cast: a minute of them)
        if (!best || sc > best.score) best = { score: sc, t: t };
      });
      return best;
    }
  };
  function spiritOf(B, u) { return (B.spirits || []).filter(function (s) { return s.by === u.id && s.rounds > 0; })[0] || null; }
  E.wardingbond = {
    summary: function () { return 'touch an ally · +1 AC and saves, half of all damage -- and you take as much as they do'; },
    cast: function* (B, u, t, slot, head) { t.conds.wardingBond = { by: u.id }; FX.ring(t, 'gold', 30); FX.ring(u, 'gold', 30); B.card([head + ' on ' + t.name + ': two platinum rings, one bond -- +1 AC and saves, half of every blow, and ' + u.name + ' shares it.']); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { var t = allies.filter(function (w) { return w !== u && G.standing(w) && G.dist(u, w) <= 5 + u.turn.move && !w.conds.wardingBond && w.maxhp < u.maxhp * 1.2; }).sort(function (a, b) { return foesAt(B, b) - foesAt(B, a); })[0]; if (!t || !foesAt(B, t)) return null; var from = G.dist(u, t) > 5 ? D.ai.approach(u, t, G.reach(u, u.turn.move), 5) : null; return { score: foesAt(B, t) * 3, t: t, from: from }; }
  };

  // ------------------------------------------------------------------ 3rd level
  E.beaconofhope = {
    summary: function () { return 'your allies within 30 ft · advantage on WIS saves, and healing on them always the most (concentration)'; },
    cast: function* (B, u, t, slot, head) { var who = B.units.filter(function (w) { return w.side === u.side && !w.dead && G.dist(u, w) <= 30; }); who.forEach(function (w) { w.conds.beacon = { by: u.id }; FX.sparkle(w, 'gold', 10); }); M.concentrate(B, u, 'beaconofhope', 'Beacon of Hope', function () { lift(B, who, 'beacon', u.id); }); B.card([head + ': hope on ' + who.map(function (w) { return w.name; }).join(', ') + ' (concentration).']); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { if (u.conc) return null; var hurt = allies.filter(function (w) { return !w.dead && w.hp < w.maxhp / 2 && G.dist(u, w) <= 30; }).length; return hurt >= 2 ? { score: hurt * 3, t: u, keep: hurt * 2 } : null; }
  };
  E.bestowcurse = {
    summary: function () { return 'touch · WIS or cursed: your attacks on it +1d8 necrotic, or its attacks at you at disadvantage (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var kind = (u.side !== 'party' || u.guest) ? ((u.attacksBase || 1) >= 2 || TX().caster(u) ? 'hurt' : 'dis') : yield { prompt: { who: u, title: u.name + ': BESTOW CURSE', lines: ['Which curse, if it fails WIS ' + x.dc + '?'], opts: [{ label: 'YOUR BLOWS +1D8 NECROTIC', value: 'hurt' }, { label: 'ITS ATTACKS AT YOU AT DISADVANTAGE', value: 'dis' }] } };
      var hit = false;
      yield* saveAll(B, u, [t], 'wis', x.dc, null, '', false, head + ' on ' + nm(B, t), { failText: 'cursed', cond: function (w) { hit = true; if (kind === 'hurt') w.conds.cursed = { by: u.id, dmg: true }; else w.conds.disAt = { id: u.id, why: 'cursed' }; } });
      if (hit) M.concentrate(B, u, 'bestowcurse', 'Bestow Curse', function () { if (t.conds.cursed && t.conds.cursed.by === u.id) delete t.conds.cursed; if (t.conds.disAt && t.conds.disAt.id === u.id) delete t.conds.disAt; });
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var best = null; fs.forEach(function (t) { if (G.dist(u, t) > 5) return; var sc = TX().pFail(t, 'wis', u.spellDC) * (TX().dpr(t) * 0.3 * 3 + 4.5 * 3 * 0.6); if (!best || sc > best.score) best = { score: sc, t: t, keep: sc * 0.6 }; }); return best; }
  };
  E.blink = {
    summary: function () { return 'yourself, a minute · at each turn\'s end, an even chance to slip into the Ethereal till your next turn'; },
    cast: function* (B, u, t, slot, head) { u.conds.blink = { rounds: 10 }; M.expire(B, u, 'blink', function () { delete u.conds.blink; if (u.ethereal) u.ethereal = false; }); FX.sparkle(u, 'violet', 18); B.card([head + ': he flickers at the edge of the world.']); yield 16; },
    ai: function (B, u, e, slot, fs) { if (u.conds.blink) return null; var th = fs.filter(function (w) { return G.dist(u, w) <= 60; }).reduce(function (s, w) { return s + TX().dpr(w); }, 0); return { score: th * 0.4 * 2, t: u }; }
  };
  E.calllightning = {
    geo: function (B, u, g) { return u.conc && u.conc.id === 'calllightning' ? Object.assign({}, g, { free: true, again: true }) : null; },
    list: function (B, u, e) { return !(B.map && B.map.def && B.map.def.sky) && !(B.fight && B.fight.sky) ? { why: 'no sky overhead for the storm' } : null; },
    summary: function (e) { return (e.g.again ? 'the storm again: ' : 'a storm cloud overhead (concentration); ') + 'a bolt at a point within 120 ft · DEX · ' + more('3d10', Math.max(0, e.slot - 3)) + ' lightning in 5 ft round it'; },
    cast: function* (B, u, t, slot, head, x) {
      if (!x.g.again) { u.conds.storm = { dice: more('3d10', up(x.sp, slot)) }; M.concentrate(B, u, 'calllightning', 'Call Lightning', function () { delete u.conds.storm; }); }
      var sq = G.sphere(t.x, t.y, 5); FX.bloom(t.x, t.y, sq, 'glow');
      yield* saveAll(B, u, caughtIn(B, sq), 'dex', x.dc, u.conds.storm.dice, 'lightning', true, head + ': lightning out of the cloud');
    },
    ai: function (B, u, e, slot, fs) { var d = avg(u.conds.storm ? u.conds.storm.dice : more('3d10', Math.max(0, slot - 3))); var g2 = Object.assign({}, e.g, { shape: 'sphere', r: 5 }); var b = TX().bestArea(B, u, Object.assign({}, e, { g: g2, sp: Object.assign({}, e.sp, { dmg: '3d10', save: 'dex', half: true }) }), fs, function (caught) { return TX().areaWorth(B, u, Object.assign({}, e, { sp: Object.assign({}, e.sp, { dmg: u.conds.storm ? u.conds.storm.dice : '3d10', save: 'dex', half: true, dmg2: null }) }), 0, caught); }); if (b && !e.g.again) { b.score *= 2; b.keep = b.score / 3; } return b; }
  };
  // Dispel Magic (SRD 5.1): every spell of 3rd level or lower on a creature ends (all the grid's are); a spell of the caster's or a foe's
  E.dispelmagic = {
    summary: function () { return 'a creature within 120 ft · its spells end: a hold, a web, a blessing, a haste, a ward (3rd level and lower)'; },
    cast: function* (B, u, t, slot, head) {
      var ended = [];
      B.units.forEach(function (c) { if (c.conc && c !== t && Object.keys(t.conds).some(function (k) { var v = t.conds[k]; return v && typeof v === 'object' && v.by === c.id; })) { ended.push(c.conc.name); M.endConc(B, c, 'dispelled'); } });
      if (t.conc) { ended.push(t.conc.name); M.endConc(B, t, 'dispelled'); }
      ['mageArmor', 'sanctuary', 'wardingBond', 'longstrider', 'guided', 'noHeal', 'frosted', 'acid', 'blindedBy', 'blinded', 'commanded', 'marked', 'branded', 'poisonWard', 'resistance', 'blink'].forEach(function (k) { if (t.conds[k]) { if (k === 'blindedBy' || k === 'blinded') { if (!(t.conds.blinded && t.conds.blinded.held)) { delete t.conds.blinded; delete t.conds.blindedBy; ended.push('blindness'); } return; } if (k === 'mageArmor') t.baseAC = t.src ? window.DS.R.ac(Object.assign({}, t.src, { conds: {} })) : t.baseAC; delete t.conds[k]; ended.push(k); } });
      if (t.images) { t.images = 0; ended.push('the images'); }
      if (t.temp && t.conds.falseLife) { t.temp = 0; }
      FX.ring(t, 'silver', 36);
      B.card([head + ' on ' + nm(B, t) + ': ' + (ended.length ? '{c}' + ended.join(', ') + '{/} unravel.' : 'nothing on it to undo.')], 300);
      yield 24;
    },
    ai: function (B, u, e, slot, fs, allies) {
      var best = null;
      allies.forEach(function (w) { if (!G.standing(w) || G.dist(u, w) > 120) return; var held = w.conds.paralyzed && w.conds.paralyzed.by && !w.conds.paralyzed.poison, sc = (held ? TX().dpr(w) * 2.5 : 0) + (w.conds.laughing || w.conds.hypnotized ? TX().dpr(w) * 2 : 0) + (w.conds.baned || w.conds.slowed ? 3 : 0); if (sc > 0 && (!best || sc > best.score)) best = { score: sc, t: w }; });
      fs.forEach(function (w) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), w)) return; var sc = (w.conds.hasted ? TX().dpr(w) * 1.5 : 0) + (w.images ? 4 : 0) + (w.conc ? 5 : 0) + (w.conds.blessed || w.conds.shieldOfFaith ? 2 : 0) + (w.conds.sanctuary ? 3 : 0); if (sc > 0 && (!best || sc > best.score)) best = { score: sc, t: w }; });
      return best;
    }
  };
  E.fear = {
    summary: function () { return '30-ft cone · WIS or frightened: it drops what it holds and runs from you each turn (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), dc = x.dc, hit = []; FX.bloom(u.x, u.y, sq, 'violet');
      yield* saveAll(B, u, caughtIn(B, sq).filter(function (w) { return w !== u; }), 'wis', dc, null, '', false, head + ': a phantom of their worst fear', { skip: function (w) { return w.conds.heroism || RU.immuneTo(w, 'frightened') ? 'fearless' : ''; }, failText: 'terrified', cond: function (w) { w.conds.frightened = { by: u.id }; w.conds.feared = { dc: dc, by: u.id }; if (w.weapon && !w.guest && w.side === 'party') w.conds.disarmed = { till: { who: w.id, at: 'end', n: 1 } }; hit.push(w); } });
      if (hit.length) M.concentrate(B, u, 'fear', 'Fear', function () { hit.forEach(function (w) { if (w.conds.feared && w.conds.feared.by === u.id) { delete w.conds.feared; if (w.conds.frightened && w.conds.frightened.by === u.id) delete w.conds.frightened; } }); });
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { if (w === u || w.conds.frightened || RU.immuneTo(w, 'frightened')) return; sc += (G.hostile(u, w) ? 1 : -1.5) * TX().pFail(w, 'wis', u.spellDC) * TX().dpr(w) * 1.6; }); return sc; }); }
  };
  E.haste = {
    summary: function () { return 'a willing creature within 30 ft · +2 AC, advantage on DEX saves, double speed, one more attack each turn; a lost turn when it ends (concentration)'; },
    cast: function* (B, u, t, slot, head) { t.conds.hasted = { by: u.id }; if (t.turn && t === u) { t.turn.move += t.speed; t.turn.hasteAction = 1; } FX.sparkle(t, 'glow', 20); M.concentrate(B, u, 'haste', 'Haste', function () { if (t.conds.hasted) { delete t.conds.hasted; if (!t.dead && t.hp > 0) t.conds.lethargic = true; } }); B.card([head + ' on ' + t.name + ': the world slows round them (+2 AC, double speed, an attack more; concentration).']); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { if (u.conc) return null; var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 30 && !w.conds.hasted && typeof w.attacks === 'number'; }).sort(function (a, b) { return TX().dpr(b) - TX().dpr(a); })[0]; if (!t) return null; var sc = TX().dpr(t) / Math.max(1, t.attacksBase || 1) * 0.9 * 3 + 2; return { score: sc, t: t, keep: sc * 0.6 }; }
  };
  E.hypnoticpattern = {
    summary: function () { return '30-ft cube within 120 ft · WIS or charmed: helpless, speed 0, till hurt (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), hit = []; FX.bloom(t.x, t.y, sq, 'violet');
      yield* saveAll(B, u, caughtIn(B, sq).filter(function (w) { return w !== u; }), 'wis', x.dc, null, '', false, head + ': a twisting pattern of colours', { skip: function (w) { return w.conds.blinded || w.blind || RU.immuneTo(w, 'charmed') || w.fey && false ? 'does not see it' : ''; }, failText: 'entranced', cond: function (w) { w.conds.hypnotized = { by: u.id }; w.conds.incapacitated = { by: u.id }; w.conds.charmed = { by: u.id }; hit.push(w); } });
      if (hit.length) M.concentrate(B, u, 'hypnoticpattern', 'Hypnotic Pattern', function () { hit.forEach(function (w) { if (w.conds.hypnotized && w.conds.hypnotized.by === u.id) { delete w.conds.hypnotized; delete w.conds.incapacitated; delete w.conds.charmed; } }); });
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { if (w === u || w.conds.blinded) return; sc += (G.hostile(u, w) ? 1 : -1.6) * TX().pFail(w, 'wis', u.spellDC) * (TX().dpr(w) * 1.8 + 3); }); return sc; }); }
  };
  E.masshealingword = {
    summary: function (e, u) { return 'bonus action · up to six allies within 60 ft · ' + more('1d4', Math.max(0, e.slot - 3)) + RU.sign(M.mod(u) + lifeBonus(u, e.slot)) + ' each'; },
    cast: function* (B, u, t, slot, head, x) { var list = (t.units || [t]).slice(0, 6); for (var i = 0; i < list.length; i++) yield* healOne(B, u, list[i], x.sp, slot, head, '1d4'); yield 16; },
    ai: function (B, u, e, slot, fs, allies) { var amt = avg(more('1d4', Math.max(0, slot - 3))) + M.mod(u) + lifeBonus(u, slot); var who = allies.filter(function (w) { return !w.dead && G.dist(u, w) <= 60 && TX().healNeed(B, u, w) > 0; }).sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; }).slice(0, 6); if (who.length < 2 && !who.some(function (w) { return w.hp <= 0; })) return null; var sc = who.reduce(function (s, w) { return s + Math.min(amt, w.maxhp - Math.max(0, w.hp)) * TX().healNeed(B, u, w) + (w.hp <= 0 ? TX().dpr(w) * 2.5 : 0); }, 0); return { score: sc, t: { units: who } }; }
  };
  E.protectionfromenergy = {
    summary: function () { return 'touch · resistance to one element -- the one most thrown at them (concentration)'; },
    cast: function* (B, u, t, slot, head) { var ty = E.protectionfromenergy.pick(B, u); t.conds.energyWard = { by: u.id, type: ty }; M.concentrate(B, u, 'protectionfromenergy', 'Protection from Energy', function () { delete t.conds.energyWard; }); FX.sparkle(t, 'glow', 14); B.card([head + ' on ' + t.name + ': {c}' + ty + '{/} halved (concentration).']); yield 16; },
    pick: function (B, u) { var n = { fire: 0, cold: 0, lightning: 0, acid: 0, thunder: 0 }; B.units.forEach(function (w) { if (!G.hostile(u, w) || !G.standing(w)) return; (w.known || []).forEach(function (id) { var sp = M.data(id); if (sp && n[sp.el] != null) n[sp.el] += sp.level || 0.5; }); Object.keys(w.attacks && typeof w.attacks === 'object' ? w.attacks : {}).forEach(function (k) { var ty = w.attacks[k].type; if (n[ty] != null) n[ty] += 2; }); }); return Object.keys(n).sort(function (a, b) { return n[b] - n[a]; })[0]; },
    ai: function (B, u, e, slot, fs, allies) { if (u.conc) return null; var ty = E.protectionfromenergy.pick(B, u), heat = fs.reduce(function (s, w) { return s + ((w.known || []).some(function (id) { var sp = M.data(id); return sp && sp.el === ty && sp.dmg; }) ? 4 : 0); }, 0); if (!heat) return null; var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5; }).sort(function (a, b) { return a.hp - b.hp; })[0]; return t ? { score: heat, t: t, keep: heat * 0.5 } : null; }
  };
  E.slow = {
    summary: function () { return 'up to six in a 40-ft cube within 120 ft · WIS or slowed: -2 AC and DEX saves, half speed, no reactions, one attack (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), dc = x.dc, hit = [], list = caughtIn(B, sq).filter(function (w) { return G.hostile(u, w); }).slice(0, 6); FX.bloom(t.x, t.y, sq, 'silver');
      yield* saveAll(B, u, list, 'wis', dc, null, '', false, head + ': time thickens', { failText: 'slowed', cond: function (w) { w.conds.slowed = { dc: dc, by: u.id }; hit.push(w); } });
      if (hit.length) M.concentrate(B, u, 'slow', 'Slow', function () { hit.forEach(function (w) { if (w.conds.slowed && w.conds.slowed.by === u.id) delete w.conds.slowed; }); });
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.filter(function (w) { return G.hostile(u, w); }).slice(0, 6).forEach(function (w) { sc += TX().pFail(w, 'wis', u.spellDC) * (TX().dpr(w) * 0.45 * 2.5 + 2); }); return sc; }); }
  };
  // Spirit Guardians (SRD 5.1): spirits about the caster, 15 ft, concentration; the caster's foes move at half speed in it and, entering it
  // or starting a turn there, save WIS or take 3d8 radiant (half on a save) -- the dwarf's Dormant makes them cold as a vault
  E.spiritguardians = {
    summary: function (e) { return 'yourself · spirits wheel about you, 15 ft: your foes there move at half speed, and entering or starting a turn there WIS or ' + more('3d8', Math.max(0, e.slot - 3)) + ' radiant (half) (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var rec = { by: u.id, r: 15, dice: more('3d8', up(x.sp, slot)), dc: x.dc, type: u.guardianType || 'radiant', ramp: u.guardianType === 'necrotic' ? 'violet' : 'gold' };
      B.auras = (B.auras || []).concat([rec]); FX.ring(u, rec.ramp, 60); FX.sparkle(u, rec.ramp, 30);
      M.concentrate(B, u, 'spiritguardians', 'Spirit Guardians', function () { B.auras = (B.auras || []).filter(function (a) { return a !== rec; }); B.card(['{g}The spirits about ' + u.name + ' fade.{/}'], 240); });
      B.card([head + ': ' + (u.guardianText || 'spirits wheel out from him, a ring of them 15 ft round') + ' (concentration).'], 360);
      yield 30;
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var near = fs.filter(function (w) { return G.dist(u, w) <= 20 + u.turn.move; }), d = avg(more('3d8', Math.max(0, slot - 3))); if (!near.length) return null; var sc = near.reduce(function (s, w) { var pf = TX().pFail(w, 'wis', u.spellDC); return s + (pf * d + (1 - pf) * d / 2) * 2.2; }, 0); return { score: sc, t: u, keep: sc * 0.6 }; }
  };
  E.vampirictouch = {
    geo: function (B, u, g) { return u.conc && u.conc.id === 'vampirictouch' ? Object.assign({}, g, { free: true, again: true }) : null; },
    summary: function (e, u) { return (e.g.again ? 'the touch again: ' : 'touch (concentration): ') + 'melee spell attack · ' + (u.conds.vampiric ? u.conds.vampiric.dice : more('3d6', Math.max(0, e.slot - 3))) + ' necrotic, and half of it back as HP'; },
    cast: function* (B, u, t, slot, head, x) {
      if (!x.g.again) { u.conds.vampiric = { dice: more('3d6', up(x.sp, slot)) }; M.concentrate(B, u, 'vampirictouch', 'Vampiric Touch', function () { delete u.conds.vampiric; }); }
      var before = t.hp;
      yield* spellAttack(B, u, t, x.sp, x.g, u.conds.vampiric.dice, { onHit: function (w) { var got = Math.max(0, before - Math.max(0, w.hp)); if (got) B.heal(u, Math.floor(got / 2)); } });
    },
    ai: function (B, u, e, slot, fs) { var d = avg(u.conds.vampiric ? u.conds.vampiric.dice : more('3d6', Math.max(0, slot - 3))), best = null; fs.forEach(function (t) { if (G.dist(u, t) > 5 + u.turn.move) return; var from = G.dist(u, t) > 5 ? D.ai.approach(u, t, G.reach(u, u.turn.move), 5) : null; if (G.dist(u, t) > 5 && (!from || G.dist(u, t, from.x, from.y) > 5)) return; var p = TX().pHit(u.spellAtk, RU.ac(t), 0), sc = TX().worth(p * d, t) + p * d / 2 * (u.hp < u.maxhp ? 0.8 : 0.2); if (!e.g.again) sc *= 1.8; if (!best || sc > best.score) best = { score: sc, t: t, from: from, keep: 6 }; }); return best; }
  };
  // the minute's clocks (Spiritual Weapon's ten rounds, Blink's): the caster's turns
  var onStart0 = M.onStart;
  M.onStart = function (B, u) {
    onStart0(B, u);
    (B.spirits || []).forEach(function (s) { if (s.by === u.id && s.rounds > 0 && --s.rounds <= 0) B.card(['{g}' + u.name + '\'s spectral weapon fades.{/}'], 200); }); // (once: 09-28h, it said so every turn after)
    if (u.ethereal && u.conds.blink) { u.ethereal = false; FX.sparkle(u, 'violet', 14); B.card(['{p}' + u.name + ' blinks back into the world.{/}'], 200); }
    // Warding Bond: it breaks when the two are more than 60 ft apart, or the binder is down
    var wb = u.conds.wardingBond; if (wb) { var by = B.units.filter(function (w) { return w.id === wb.by; })[0]; if (!by || by.hp <= 0 || G.dist(by, u) > 60) delete u.conds.wardingBond; }
  };
  var onEnd0 = M.onEnd;
  M.onEnd = function (B, u) {
    onEnd0(B, u);
    if (u.conds.blink && u.hp > 0 && !u.dead) { if (--u.conds.blink.rounds <= 0) delete u.conds.blink; else { var r = D.d(20); if (r >= 11) { u.ethereal = true; FX.sparkle(u, 'violet', 14); B.card(['{p}' + u.name + ' blinks out of the world{/} {g}(d20 ' + r + '){/}'], 200); } } }
  };
  // Fear's run and a frightened one's: on its turn, away from the one it fears (the class tactics and the brutes ask this)
  M.mustFlee = function (u) { return !!(u.conds.feared && u.conds.frightened); };

  // ------------------------------------------------------------------ 4th level (09-28, batch D: the foes' casters and the NPCs past 6)
  // Banishment (SRD 5.1): CHA or gone from the field while the caster holds it; one from another plane (fiend, celestial, elemental, fey)
  // does not come back if it is held the full minute -- here, the fight
  E.banishment = {
    summary: function () { return 'a creature within 60 ft · CHA or gone while you hold it; one not of this world gone for good (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var gone = null;
      yield* saveAll(B, u, [t], 'cha', x.dc, null, '', false, head + ' on ' + nm(B, t), { failText: 'gone', cond: function (w) { w.conds.banished = { by: u.id, x: w.x, y: w.y }; w.ethereal = true; gone = w; FX.sparkle(w, 'violet', 26); } });
      if (gone) M.concentrate(B, u, 'banishment', 'Banishment', function () {
        if (!gone.conds.banished) return;
        delete gone.conds.banished; gone.ethereal = false;
        if (!G.canStand(gone, gone.x, gone.y)) { var best = null, bd = 1e9; for (var yy = 0; yy < G.map.h; yy++) for (var xx = 0; xx < G.map.w; xx++) { if (!G.canStand(gone, xx, yy)) continue; var dd = Math.hypot(xx - gone.x, yy - gone.y); if (dd < bd) { bd = dd; best = [xx, yy]; } } if (best) { gone.x = best[0]; gone.y = best[1]; } }
        FX.sparkle(gone, 'violet', 20); B.card(['{p}' + Nm(B, gone) + ' is back.{/}'], 240);
      });
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t)) return; var sc = TX().pFail(t, 'cha', u.spellDC) * (TX().dpr(t) * 3 + t.hp * 0.3); if (!best || sc > best.score) best = { score: sc, t: t, keep: sc * 0.7 }; }); return best; }
  };
  E.blacktentacles = {
    summary: function () { return '20-ft square within 90 ft · writhing tentacles: difficult; DEX or 3d6 bludgeoning and restrained, entering or starting there (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), rec = { kind: 'tentacles', sq: sq, by: u.id, dc: x.dc, difficult: true };
      B.grounds = (B.grounds || []).concat([rec]); FX.bloom(t.x, t.y, sq, 'violet');
      yield* saveAll(B, u, caughtIn(B, sq), 'dex', x.dc, '3d6', 'bludgeoning', false, head + ': black tentacles fill the ground', { failText: 'seized', cond: function (w) { if (!RU.immuneTo(w, 'restrained')) w.conds.restrained = { dc: x.dc, by: u.id, kind: 'tentacles' }; } });
      M.concentrate(B, u, 'blacktentacles', 'Black Tentacles', function () { removeGround(B, rec); B.units.forEach(function (w) { var r = w.conds.restrained; if (r && r.kind === 'tentacles' && r.by === u.id) delete w.conds.restrained; }); B.card(['{g}The tentacles sink away.{/}'], 240); });
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { var pf = TX().pFail(w, 'dex', u.spellDC); sc += (G.hostile(u, w) ? 1 : -1.5) * (pf * 10.5 + pf * (TX().dpr(w) * 0.6 + 6) * 1.5); }); return sc; }); }
  };
  E.blight = {
    summary: function (e, u) { return 'a creature within 30 ft · CON · ' + dice(e.sp, u, e.slot) + ' necrotic (half); nothing to the dead or the made'; },
    cast: function* (B, u, t, slot, head, x) { FX.sparkle(t, 'violet', 18); yield* saveAll(B, u, [t], 'con', x.dc, dice(x.sp, u, slot), 'necrotic', true, head + ' on ' + nm(B, t), { skip: function (w) { return w.type === 'undead' || w.type === 'construct' ? 'nothing in it to wither' : ''; } }); },
    ai: function (B, u, e, slot, fs) { var best = null, d = avg(dice(e.sp, u, slot)); fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t) || t.type === 'undead' || t.type === 'construct') return; var pf = TX().pFail(t, 'con', u.spellDC), sc = TX().worth(pf * d + (1 - pf) * d / 2, t); if (!best || sc > best.score) best = { score: sc, t: t }; }); return best; }
  };
  // Confusion (SRD 5.1): WIS or confused; each of its turns a d10 -- 1 wanders, 2-6 does nothing, 7-8 strikes at whoever is nearest, 9-10
  // acts as it likes; a WIS save at each turn's end (concentration)
  E.confusion = {
    summary: function () { return '10-ft sphere within 90 ft · WIS or confused: each turn a d10 -- wander, stand, strike at random, or act (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), dc = x.dc, hit = []; FX.bloom(t.x, t.y, sq, 'violet');
      yield* saveAll(B, u, caughtIn(B, sq), 'wis', dc, null, '', false, head + ': their minds come loose', { failText: 'confused', cond: function (w) { w.conds.confused = { dc: dc, by: u.id }; hit.push(w); } });
      if (hit.length) M.concentrate(B, u, 'confusion', 'Confusion', function () { hit.forEach(function (w) { if (w.conds.confused && w.conds.confused.by === u.id) delete w.conds.confused; }); });
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { sc += (G.hostile(u, w) ? 1 : -1.5) * TX().pFail(w, 'wis', u.spellDC) * TX().dpr(w) * 1.6; }); return sc; }); }
  };
  // what a confused one does on its turn (ai.js turn, battle.js heroTurn ask): true if the d10 took the turn
  M.confusedTurn = function* (B, u) {
    var c = u.conds.confused; if (!c) return false;
    var r = D.d(10), T = u.turn;
    if (r >= 9) { B.card(['{g}' + Nm(B, u) + ' shakes clear for a moment (d10 ' + r + ').{/}'], 200); return false; }
    if (r === 1) {
      B.card(['{p}' + Nm(B, u) + ' wanders off, lost (d10 1).{/}'], 240);
      var rm = G.reach(u, T.move), ks = Object.keys(rm).filter(function (k) { return rm[k].stand; }), pick = ks.length ? rm[ks[D.rint(ks.length)]] : null;
      if (pick) yield* D.ai.walkTo(B, u, pick);
    } else if (r <= 6) { B.card(['{p}' + Nm(B, u) + ' stands and stares (d10 ' + r + ').{/}'], 240); yield 16; }
    else {
      var near = B.units.filter(function (w) { return w !== u && G.standing(w) && G.dist(u, w) <= (u.reach || 5); }), w = near[D.rint(Math.max(1, near.length))];
      B.card(['{p}' + Nm(B, u) + ' lashes out at random (d10 ' + r + ').{/}'], 240);
      if (w) { var atk = u.weapon || (u.attacks && u.attacks[Object.keys(u.attacks)[0]]); if (atk && typeof atk === 'object' && atk.name) yield* B.attack(u, w, atk); } else yield 16;
    }
    T.action = 0; T.bonus = 0; T.move = 0;
    return true;
  };
  E.deathward = {
    summary: function () { return 'touch · the first blow that would drop them leaves them at 1 instead'; },
    cast: function* (B, u, t, slot, head) { t.conds.deathWard = { by: u.id }; FX.ring(t, 'gold', 30); B.card([head + ' on ' + t.name + ': a ward against the fall.']); yield 16; },
    ai: function (B, u, e, slot, fs, allies) { var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 && !w.conds.deathWard; }).sort(function (a, b) { return foesAt2(B, b) - foesAt2(B, a) || a.hp - b.hp; })[0]; return t && foesAt2(B, t) ? { score: 6 + foesAt2(B, t) * 2, t: t } : null; }
  };
  function foesAt2(B, w) { return B.units.filter(function (x) { return G.hostile(w, x) && G.standing(x) && G.dist(w, x) <= 10; }).length; }
  E.dimensiondoor = {
    summary: function () { return 'yourself (and one ally beside you) to any square you can see within 500 ft'; },
    cast: function* (B, u, t, slot, head) {
      var mate = B.units.filter(function (w) { return w !== u && w.side === u.side && G.standing(w) && G.dist(u, w) <= 5; })[0];
      FX.sparkle(u, 'violet', 20); D.sfx('magic');
      B.card([head + ': a door in the air, and ' + u.name + (mate ? ' and ' + mate.name : '') + ' step through.']);
      yield 16;
      u.x = t.x; u.y = t.y; delete u.tween; FX.sparkle(u, 'violet', 20);
      if (mate) { for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) { if (mate.x === u.x + i && mate.y === u.y + j) continue; if (G.canStand(mate, u.x + i, u.y + j)) { mate.x = u.x + i; mate.y = u.y + j; delete mate.tween; i = j = 2; } } }
      yield 16;
    },
    ai: function (B, u, e, slot, fs) {
      var pressed = G.foesNear(u, u.x, u.y, 5).length;
      if (!pressed && !u.conds.restrained) return null;
      var sq = B.mistyTargets(u, 120), best = null;
      sq.forEach(function (q) { var far = Math.min.apply(null, fs.map(function (t) { return G.dist(u, t, q[0], q[1]); }).concat([99])); if (far < 30) return; var s = 8 + pressed * 4 - Math.abs(far - 50) / 10; if (!best || s > best.score) best = { score: s, t: { x: q[0], y: q[1] } }; });
      return best;
    }
  };
  E.fireshield = {
    summary: function () { return 'yourself · warm (cold halved) or chill (fire halved), and a blow at you from beside you burns back 2d8'; },
    cast: function* (B, u, t, slot, head) {
      var hot = !B.units.some(function (w) { return G.hostile(u, w) && (w.known || []).some(function (id) { var sp = M.data(id); return sp && sp.el === 'fire'; }); });
      u.conds.fireShield = { type: hot ? 'fire' : 'cold' }; u.conds.energyWard = { by: u.id, type: hot ? 'cold' : 'fire' };
      FX.ring(u, hot ? 'fire' : 'glow', 36); B.card([head + ': ' + (hot ? 'warm flames' : 'chill flames') + ' wreathe him (' + (hot ? 'cold' : 'fire') + ' halved; a blow from beside him burns back 2d8 ' + (hot ? 'fire' : 'cold') + ').']); yield 20;
    },
    ai: function (B, u, e, slot, fs) { if (u.conds.fireShield) return null; var near = fs.filter(function (w) { return G.dist(u, w) <= 10; }).length; return near ? { score: near * 6, t: u } : null; }
  };
  E.freedomofmovement = {
    summary: function () { return 'touch · no difficult ground, no magic that holds or paralyses, a grip slipped (an hour)'; },
    cast: function* (B, u, t, slot, head) { t.conds.freeMove = { by: u.id }; if (t.conds.restrained) delete t.conds.restrained; if (t.conds.paralyzed && !t.conds.paralyzed.poison) delete t.conds.paralyzed; FX.sparkle(t, 'glow', 14); B.card([head + ' on ' + t.name + ': nothing holds them.']); yield 16; },
    ai: function (B, u, e, slot, fs, allies) { var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 + u.turn.move && !w.conds.freeMove && (w.conds.restrained || (w.conds.paralyzed && !w.conds.paralyzed.poison)); })[0]; if (!t) return null; var from = G.dist(u, t) > 5 ? D.ai.approach(u, t, G.reach(u, u.turn.move), 5) : null; return { score: TX().dpr(t) * 2.5, t: t, from: from }; }
  };
  // Guardian of Faith (SRD 5.1): a spectral guardian at a point; a foe of the caster's coming within 10 ft of it (the first time in a turn)
  // or starting its turn there saves DEX or 20 radiant (half); it vanishes after it has dealt 60
  E.guardianoffaith = {
    summary: function () { return 'a guardian at a point within 30 ft · a foe coming within 10 ft of it, DEX or 20 radiant (half); gone after 60'; },
    cast: function* (B, u, t, slot, head, x) { B.wards = (B.wards || []).concat([{ by: u.id, x: t.x, y: t.y, dc: x.dc, left: 60 }]); FX.ring({ x: t.x, y: t.y, size: 1 }, 'gold', 50); B.card([head + ': a spectral guardian stands, halberd raised.']); yield 24; },
    ai: function (B, u, e, slot, fs) { var t = fs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0]; if (!t || (B.wards || []).some(function (w) { return w.by === u.id; })) return null; var at = null, bd = 1e9; for (var yy = t.y - 2; yy <= t.y + 2; yy++) for (var xx = t.x - 2; xx <= t.x + 2; xx++) { var s = G.map.at(xx, yy); if (!s || !s.open || !M.inRange(u, e.g, xx, yy)) continue; var dd = Math.hypot(xx - t.x, yy - t.y); if (dd < bd) { bd = dd; at = { x: xx, y: yy }; } } return at ? { score: fs.filter(function (w) { return Math.max(Math.abs(w.x - at.x), Math.abs(w.y - at.y)) * 5 <= 10; }).length * 12 + 4, t: at } : null; }
  };
  M.wardTurn = function (B, u) {
    (B.wards || []).forEach(function (wd) {
      var c = B.units.filter(function (w) { return w.id === wd.by; })[0];
      if (!c || wd.left <= 0 || !G.hostile(c, u) || u.hp <= 0 || u.dead || Math.max(Math.abs(u.x - wd.x), Math.abs(u.y - wd.y)) * 5 > 10) return;
      if (u.turn && u.turn['ward' + wd.x + ',' + wd.y]) return;
      if (u.turn) u.turn['ward' + wd.x + ',' + wd.y] = true;
      var sv = RU.save(u, 'dex', wd.dc), n = Math.min(wd.left, sv.ok ? 10 : 20); wd.left -= n;
      B.card([Nm(B, u) + ' comes within the guardian\'s reach: DEX ' + RU.saveText(sv) + ' vs DC ' + wd.dc + '  {r}' + n + '{/} radiant' + (wd.left <= 0 ? '  {g}(the guardian is spent){/}' : '')], 300);
      B.hurt(u, n, 'radiant');
    });
    B.wards = (B.wards || []).filter(function (wd) { return wd.left > 0; });
  };
  E.phantasmalkiller = {
    summary: function () { return 'a creature within 120 ft · WIS or frightened by its worst fear, and at each of its turns\' end WIS or 4d10 psychic (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var dc = x.dc, hit = false;
      yield* saveAll(B, u, [t], 'wis', dc, null, '', false, head + ' on ' + nm(B, t), { failText: 'sees it', cond: function (w) { w.conds.frightened = { by: u.id }; w.conds.killer = { dc: dc, by: u.id, dice: more('4d10', up(x.sp, slot)) }; hit = true; } });
      if (hit) M.concentrate(B, u, 'phantasmalkiller', 'Phantasmal Killer', function () { if (t.conds.killer) { delete t.conds.killer; if (t.conds.frightened && t.conds.frightened.by === u.id) delete t.conds.frightened; } });
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t)) return; var pf = TX().pFail(t, 'wis', u.spellDC), sc = pf * (22 * Math.min(2.5, 1 / Math.max(0.3, 1 - pf)) * 0.6 + TX().dpr(t) * 0.3); if (!best || sc > best.score) best = { score: TX().worth(sc, t), t: t, keep: sc * 0.6 }; }); return best; }
  };
  E.resilientsphere = {
    summary: function () { return 'a creature within 30 ft · DEX (a foe) or sealed in a sphere of force: nothing in or out (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var go = t.side === u.side; if (!go) { var sv = RU.save(t, 'dex', x.dc); B.card([head + ' on ' + nm(B, t) + ': DEX ' + RU.saveText(sv) + ' vs DC ' + x.dc + '  ' + (sv.ok ? '{n}rolls clear{/}' : '{p}SEALED IN{/}')], 300); go = !sv.ok; } else B.card([head + ': ' + t.name + ' sealed in shimmering force.']);
      if (!go) { yield 20; return; }
      t.conds.banished = { by: u.id, x: t.x, y: t.y, sphere: true }; t.ethereal = true; FX.ring(t, 'glow', 40);
      M.concentrate(B, u, 'resilientsphere', 'Resilient Sphere', function () { delete t.conds.banished; t.ethereal = false; B.card(['{g}The sphere about ' + Nm(B, t) + ' pops.{/}'], 200); });
      yield 20;
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t)) return; var sc = TX().pFail(t, 'dex', u.spellDC) * TX().dpr(t) * 2.5; if (!best || sc > best.score) best = { score: sc, t: t, keep: sc * 0.6 }; }); return best; }
  };

  // ------------------------------------------------------------------ 5th level
  E.contagion = {
    summary: function () { return 'touch: melee spell attack · poisoned by a disease; three failed CON saves and it takes hold (blinded); three saved, it is gone'; },
    cast: function* (B, u, t, slot, head, x) { var dc = x.dc; yield* spellAttack(B, u, t, x.sp, x.g, '0', { onHit: function (w) { if (RU.immuneTo(w, 'poisoned')) return; w.conds.poisoned = { contagion: true }; w.conds.contagion = { dc: dc, bad: 0, good: 0 }; B.card(['{o}' + Nm(B, w) + ' is sick with it: poisoned.{/}'], 240); } }); },
    ai: function (B, u, e, slot, fs) { var best = null; fs.forEach(function (t) { if (G.dist(u, t) > 5 + u.turn.move || RU.immuneTo(t, 'poisoned')) return; var from = G.dist(u, t) > 5 ? D.ai.approach(u, t, G.reach(u, u.turn.move), 5) : null; if (G.dist(u, t) > 5 && (!from || G.dist(u, t, from.x, from.y) > 5)) return; var sc = TX().pHit(u.spellAtk, RU.ac(t), 0) * TX().dpr(t) * 1.5; if (!best || sc > best.score) best = { score: sc, t: t, from: from }; }); return best; }
  };
  E.dispelevilandgood = {
    summary: function () { return 'yourself · aberrations, celestials, elementals, fey, fiends and the dead attack you at disadvantage (concentration)'; },
    cast: function* (B, u, t, slot, head) { u.conds.pfeg = { by: u.id }; M.concentrate(B, u, 'dispelevilandgood', 'Dispel Evil and Good', function () { delete u.conds.pfeg; }); FX.ring(u, 'gold', 40); B.card([head + ': a shimmer of the other world\'s bane about him (concentration).']); yield 16; },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var bad = fs.filter(function (w) { return /aberration|celestial|elemental|fey|fiend|undead/.test(w.type || '') && G.dist(u, w) <= 30; }); return bad.length ? { score: bad.reduce(function (s, w) { return s + TX().dpr(w) * 0.3 * 3; }, 0), t: u } : null; }
  };
  E.flamestrike = {
    summary: function (e) { var n = Math.max(0, e.slot - 5); return '10-ft radius within 60 ft · DEX · ' + more('4d6', n) + ' fire and 4d6 radiant (half)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), list = caughtIn(B, sq); FX.bloom(t.x, t.y, sq, 'fire');
      var f = D.roll(more('4d6', up(x.sp, slot))), r = D.roll('4d6'), lines = [head + '  a column of divine fire: ' + f.total + ' fire + ' + r.total + ' radiant  DEX DC ' + x.dc], hits = [];
      list.forEach(function (w) { var sv = RU.save(w, 'dex', x.dc), k = sv.ok ? 0.5 : 1; lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{o}failed{/}')); hits.push([w, Math.floor(f.total * k), Math.floor(r.total * k)]); });
      B.card(lines.slice(0, 8), 420); yield { fx: 1 };
      hits.forEach(function (h) { B.hurt(h[0], h[1], 'fire'); if (!h[0].dead) B.hurt(h[0], h[2], 'radiant'); });
      yield 24;
    },
    ai: function (B, u, e, slot, fs) { return TX().bestArea(B, u, e, fs, function (caught) { return TX().areaWorth(B, u, Object.assign({}, e, { sp: Object.assign({}, e.sp, { dmg: '8d6', half: true, save: 'dex' }) }), 0, caught); }); }
  };
  E.greaterrestoration = {
    summary: function () { return 'touch · ends a charm, a curse, a petrifying, what drains strength or the most HP'; },
    cast: function* (B, u, t, slot, head) { var gone = []; ['charmed', 'hypnotized', 'cursed', 'disAt', 'enfeebled', 'contagion'].forEach(function (k) { if (t.conds[k]) { delete t.conds[k]; gone.push(k); } }); if (t.conds.poisoned && t.conds.poisoned.contagion) delete t.conds.poisoned; FX.sparkle(t, 'gold', 16); B.card([head + ' on ' + t.name + ': ' + (gone.length ? gone.join(', ') + ' ended.' : 'nothing to end.')]); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 + u.turn.move && (w.conds.charmed || w.conds.hypnotized || w.conds.cursed || w.conds.contagion || w.conds.enfeebled); })[0]; if (!t) return null; var from = G.dist(u, t) > 5 ? D.ai.approach(u, t, G.reach(u, u.turn.move), 5) : null; return { score: TX().dpr(t) * 2, t: t, from: from }; }
  };
  E.insectplague = {
    summary: function (e) { return '20-ft sphere within 300 ft · swarming locusts: difficult; CON or ' + more('4d10', Math.max(0, e.slot - 5)) + ' piercing (half) as it forms, entering, or ending a turn there (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), rec = { kind: 'insects', sq: sq, by: u.id, dc: x.dc, difficult: true, dice: more('4d10', up(x.sp, slot)) };
      B.grounds = (B.grounds || []).concat([rec]); FX.bloom(t.x, t.y, sq, 'moss');
      yield* saveAll(B, u, caughtIn(B, sq), 'con', x.dc, rec.dice, 'piercing', true, head + ': a cloud of biting locusts');
      M.concentrate(B, u, 'insectplague', 'Insect Plague', function () { removeGround(B, rec); B.card(['{g}The locusts scatter.{/}'], 240); });
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; return TX().bestArea(B, u, e, fs, function (caught) { return TX().areaWorth(B, u, Object.assign({}, e, { sp: Object.assign({}, e.sp, { dmg: '4d10', half: true, save: 'con' }) }), 0, caught) * 2; }); }
  };
  E.masscurewounds = {
    summary: function (e, u) { return 'up to six allies within 60 ft · ' + more('3d8', Math.max(0, e.slot - 5)) + RU.sign(M.mod(u) + lifeBonus(u, e.slot)) + ' each'; },
    cast: function* (B, u, t, slot, head, x) { var list = (t.units || [t]).slice(0, 6); for (var i = 0; i < list.length; i++) yield* healOne(B, u, list[i], x.sp, slot, head, '3d8'); yield 16; },
    ai: function (B, u, e, slot, fs, allies) { var amt = avg(more('3d8', Math.max(0, slot - 5))) + M.mod(u), who = allies.filter(function (w) { return !w.dead && G.dist(u, w) <= 60 && TX().healNeed(B, u, w) > 0; }).slice(0, 6); if (who.length < 2) return null; return { score: who.reduce(function (s, w) { return s + Math.min(amt, w.maxhp - Math.max(0, w.hp)) * TX().healNeed(B, u, w) + (w.hp <= 0 ? TX().dpr(w) * 2.5 : 0); }, 0), t: { units: who } }; }
  };
  // the grounds' and the wards' turns (batch D): the tentacles at a turn's start, the locusts at its end, the guardian's reach
  var onStartD = M.onStart;
  M.onStart = function (B, u) {
    onStartD(B, u);
    M.wardTurn(B, u);
    (M.groundAt(B, u.x, u.y) || []).forEach(function (g) {
      if (g.kind !== 'tentacles' || u.hp <= 0 || u.dead) return;
      var r = u.conds.restrained;
      if (r && r.kind === 'tentacles') { var d0 = D.roll('3d6'); B.card([Nm(B, u) + ' is crushed by the tentacles  3d6 = {r}' + d0.total + '{/}'], 240); B.hurt(u, d0.total, 'bludgeoning'); }
      else if (!RU.immuneTo(u, 'restrained')) { var sv = RU.save(u, 'dex', g.dc); B.card([Nm(B, u) + ' in the tentacles: DEX ' + RU.saveText(sv) + ' vs DC ' + g.dc + '  ' + (sv.ok ? '{n}slips them{/}' : '{o}seized{/}')], 240); if (!sv.ok) { var d1 = D.roll('3d6'); B.hurt(u, d1.total, 'bludgeoning'); if (u.hp > 0) u.conds.restrained = { dc: g.dc, by: g.by, kind: 'tentacles' }; } }
    });
  };
  var onEndD = M.onEnd;
  M.onEnd = function (B, u) {
    onEndD(B, u);
    // Phantasmal Killer: the fear's bite at a turn's end
    var k = u.conds.killer;
    if (k && u.hp > 0) { var sv = RU.save(u, 'wis', k.dc); if (sv.ok) { delete u.conds.killer; if (u.conds.frightened && u.conds.frightened.by === k.by) delete u.conds.frightened; B.card([Nm(B, u) + ' faces the phantom down: WIS ' + RU.saveText(sv) + '  {n}IT BREAKS{/}'], 240); var by = B.units.filter(function (w) { return w.id === k.by; })[0]; if (by && by.conc && by.conc.id === 'phantasmalkiller') delete by.conc; } else { var r = D.roll(k.dice); B.card([Nm(B, u) + ' and the phantom: WIS ' + RU.saveText(sv) + '  {r}' + r.total + '{/} psychic'], 240); B.hurt(u, r.total, 'psychic'); } }
    // Contagion: three failed CON saves and it takes hold (the blinding sickness, for the fight); three saved and it is gone
    var ct = u.conds.contagion;
    if (ct && u.hp > 0 && !ct.held) { var s2 = RU.save(u, 'con', ct.dc); if (s2.ok) ct.good++; else ct.bad++; B.card([Nm(B, u) + ' fights the disease: CON ' + RU.saveText(s2) + '  ' + ct.bad + ' failed, ' + ct.good + ' saved'], 200); if (ct.good >= 3) { delete u.conds.contagion; if (u.conds.poisoned && u.conds.poisoned.contagion) delete u.conds.poisoned; } else if (ct.bad >= 3) { ct.held = true; u.conds.blinded = { by: 'contagion' }; B.card(['{o}The sickness takes ' + Nm(B, u) + '\'s sight.{/}'], 240); } }
    // Insect Plague: ending a turn in the locusts
    (M.groundAt(B, u.x, u.y) || []).forEach(function (g) { if (g.kind !== 'insects' || u.hp <= 0) return; var sv3 = RU.save(u, 'con', g.dc), r3 = D.roll(g.dice), n3 = sv3.ok ? Math.floor(r3.total / 2) : r3.total; B.card([Nm(B, u) + ' in the locusts: CON ' + RU.saveText(sv3) + '  {r}' + n3 + '{/} piercing'], 200); B.hurt(u, n3, 'piercing'); });
  };
  var stepD = M.stepInto;
  M.stepInto = function (B, u) {
    var stop = stepD(B, u);
    M.wardTurn(B, u);
    (M.groundAt(B, u.x, u.y) || []).forEach(function (g) {
      if (u.hp <= 0 || u.dead || !u.turn) return;
      if (g.kind === 'insects' && !u.turn['bugs' + g.by]) { u.turn['bugs' + g.by] = true; var sv = RU.save(u, 'con', g.dc), r = D.roll(g.dice), n = sv.ok ? Math.floor(r.total / 2) : r.total; B.card([Nm(B, u) + ' walks into the locusts: CON ' + RU.saveText(sv) + '  {r}' + n + '{/} piercing'], 200); B.hurt(u, n, 'piercing'); }
      if (g.kind === 'tentacles' && !u.turn['tent' + g.by] && !(u.conds.restrained && u.conds.restrained.kind === 'tentacles') && !RU.immuneTo(u, 'restrained')) { u.turn['tent' + g.by] = true; var s2 = RU.save(u, 'dex', g.dc); B.card([Nm(B, u) + ' steps into the tentacles: DEX ' + RU.saveText(s2) + '  ' + (s2.ok ? '{n}slips them{/}' : '{o}seized{/}')], 240); if (!s2.ok) { var d2 = D.roll('3d6'); B.hurt(u, d2.total, 'bludgeoning'); if (u.hp > 0) u.conds.restrained = { dc: g.dc, by: g.by, kind: 'tentacles' }; stop = true; } }
    });
    return stop || u.hp <= 0;
  };

  // ------------------------------------------------------------------ 6th to 9th level (09-28, batch E): no hero or class NPC reaches them (the cap is 9);
  // they are the foes' -- a lich, an archmage, a high priest to come -- built now so the story finds them ready
  function oneSave(id, name, ab, dexpr, type, half, o) {
    o = o || {};
    return {
      summary: function (e, u) { return (o.what || 'a creature') + ' within ' + e.g.range + ' ft · ' + ab.toUpperCase() + ' · ' + dexpr + ' ' + type + (half ? ' (half)' : ''); },
      cast: function* (B, u, t, slot, head, x) { FX.sparkle(t, o.ramp || 'violet', 18); yield* saveAll(B, u, [t], ab, x.dc, o.up ? more(dexpr, up(x.sp, slot) * o.up) : dexpr, type, half, head + ' on ' + nm(B, t), { cond: o.cond ? function (w) { o.cond(B, u, w, x); } : null }); if (o.after) o.after(B, u, t, x); },
      ai: function (B, u, e, slot, fs) { var best = null, d = avg(dexpr); fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t)) return; var pf = TX().pFail(t, ab, u.spellDC), sc = TX().worth(pf * d + (half ? (1 - pf) * d / 2 : 0), t); if (!best || sc > best.score) best = { score: sc, t: t }; }); return best; }
    };
  }
  function areaSave(ab, dexpr, type, half, ramp, o) {
    o = o || {};
    return {
      summary: function (e) { return (e.g.r ? e.g.r + '-ft sphere within ' + e.g.range + ' ft' : e.g.len + '-ft ' + e.g.shape) + ' · ' + ab.toUpperCase() + ' · ' + dexpr + ' ' + type + (half ? ' (half)' : '') + (o.more || ''); },
      cast: function* (B, u, t, slot, head, x) {
        var sq = M.area(u, x.g, t.x, t.y), list = caughtIn(B, sq).filter(function (w) { return !(M.globed && M.globed(B, u, w, slot)); });
        FX.bloom(/cone|line/.test(x.g.shape) ? u.x : t.x, /cone|line/.test(x.g.shape) ? u.y : t.y, sq, ramp);
        yield* saveAll(B, u, list, ab, x.dc, o.up ? more(dexpr, up(x.sp, slot) * o.up) : dexpr, type, half, head, { cond: o.cond ? function (w) { o.cond(B, u, w, x); } : null, skip: o.skip });
        if (o.after) o.after(B, u, sq, x);
      },
      ai: function (B, u, e, slot, fs) { return TX().bestArea(B, u, e, fs, function (caught) { return TX().areaWorth(B, u, Object.assign({}, e, { sp: Object.assign({}, e.sp, { dmg: dexpr, half: half, save: ab, dmg2: null }) }), 0, caught) + (o.bonus ? o.bonus(caught) : 0); }); }
    };
  }
  E.chainlightning = {
    summary: function () { return 'a creature within 150 ft and three more within 30 ft of it · DEX · 10d8 lightning (half)'; },
    cast: function* (B, u, t, slot, head, x) { var more3 = B.units.filter(function (w) { return w !== t && G.hostile(u, w) && G.standing(w) && G.dist(t, w) <= 30; }).slice(0, 3); FX.projectile(u, t, 'bolt'); yield* saveAll(B, u, [t].concat(more3), 'dex', x.dc, '10d8', 'lightning', true, head + ': lightning leaps from ' + nm(B, t)); },
    ai: function (B, u, e, slot, fs) { var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t)) return; var n = 1 + Math.min(3, fs.filter(function (w) { return w !== t && G.dist(t, w) <= 30; }).length), sc = n * 35 * 0.75; if (!best || sc > best.score) best = { score: sc, t: t }; }); return best; }
  };
  E.circleofdeath = areaSave('con', '8d6', 'necrotic', true, 'violet', { up: 2 });
  E.disintegrate = oneSave('disintegrate', 'Disintegrate', 'dex', '10d6+40', 'force', false, { ramp: 'glow' });
  E.freezingsphere = areaSave('con', '10d6', 'cold', true, 'glow', { up: 1 });
  E.harm = {
    summary: function () { return 'a creature within 60 ft · CON · 14d6 necrotic (half), never below 1 HP; failed, its most HP cut as much for the fight'; },
    cast: function* (B, u, t, slot, head, x) {
      var r = D.roll('14d6'), sv = RU.save(t, 'con', x.dc), n = sv.ok ? Math.floor(r.total / 2) : r.total; n = Math.min(n, Math.max(0, t.hp - 1));
      FX.sparkle(t, 'violet', 20); B.card([head + ' on ' + nm(B, t) + '  14d6 = ' + r.total + '  CON ' + RU.saveText(sv) + ' vs DC ' + x.dc + '  -> {r}' + n + '{/} necrotic' + (sv.ok ? '' : '  {o}its strength hollowed{/}')], 360);
      B.hurt(t, n, 'necrotic'); if (!sv.ok && t.hp > 0) t.maxhp = Math.max(1, t.maxhp - n);
      yield 24;
    },
    ai: function (B, u, e, slot, fs) { var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t)) return; var sc = Math.min(t.hp - 1, 40) * 1.2; if (!best || sc > best.score) best = { score: sc, t: t }; }); return best; }
  };
  E.heal = {
    summary: function (e) { return 'an ally within 60 ft · ' + (70 + 10 * Math.max(0, e.slot - 6)) + ' HP back, and blindness and sickness ended'; },
    cast: function* (B, u, t, slot, head, x) { var n = 70 + 10 * up(x.sp, slot), got = B.heal(t, n); ['blinded', 'blindedBy', 'contagion'].forEach(function (k) { delete t.conds[k]; }); FX.sparkle(t, 'gold', 24); B.card([head + ' on ' + t.name + ': {n}+' + got + '{/}']); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { var best = null; allies.forEach(function (w) { if (w.dead || !M.targetOK(B, u, e.g, w)) return; var need = TX().healNeed(B, u, w); if (!need) return; var sc = Math.min(70, w.maxhp - Math.max(0, w.hp)) * need + (w.hp <= 0 ? TX().dpr(w) * 2.5 : 0); if (!best || sc > best.score) best = { score: sc, t: w }; }); return best; }
  };
  // Eyebite (SRD 5.1): each action, one creature within 60 ft: WIS or asleep, panicked (it runs), or sickened (disadvantage) (concentration)
  E.eyebite = {
    geo: function (B, u, g) { return u.conc && u.conc.id === 'eyebite' ? Object.assign({}, g, { free: true, again: true }) : null; },
    summary: function (e) { return (e.g.again ? 'your eyes again: ' : 'your eyes go black (concentration); each action, ') + 'a creature within 60 ft, WIS or asleep, panicked, or sickened'; },
    cast: function* (B, u, t, slot, head, x) {
      if (!x.g.again) M.concentrate(B, u, 'eyebite', 'Eyebite', function () {});
      var how = t.hp > 30 && TX().dpr(t) > 10 ? 'asleep' : G.dist(u, t) <= 10 ? 'panicked' : 'sickened';
      yield* saveAll(B, u, [t], 'wis', x.dc, null, '', false, head + ' on ' + nm(B, t), { failText: how, cond: function (w) {
        if (how === 'asleep' && !RU.immuneTo(w, 'asleep') && !w.fey) w.conds.asleep = true;
        else if (how === 'panicked') { w.conds.frightened = { by: u.id }; w.conds.feared = { by: u.id }; }
        else w.conds.sickened = { by: u.id };
      } });
    },
    ai: function (B, u, e, slot, fs) { var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t) || t.conds.asleep) return; var sc = TX().pFail(t, 'wis', u.spellDC) * TX().dpr(t) * 1.6 * (e.g.again ? 1 : 1.8); if (!best || sc > best.score) best = { score: sc, t: t, keep: 8 }; }); return best; }
  };
  // Flesh to Stone (SRD 5.1): CON or restrained; each of its turns' ends a CON save -- three failed, stone (out of the fight); three saved, free
  E.fleshtostone = {
    summary: function () { return 'a creature within 60 ft · CON or restrained, turning to stone: three failed saves and it is stone (concentration)'; },
    cast: function* (B, u, t, slot, head, x) { var hit = false; yield* saveAll(B, u, [t], 'con', x.dc, null, '', false, head + ' on ' + nm(B, t), { skip: function (w) { return RU.immuneTo(w, 'petrified') ? 'stone will not take it' : ''; }, failText: 'stiffening', cond: function (w) { w.conds.restrained = { dc: 99, by: u.id, kind: 'stone' }; w.conds.stoning = { dc: x.dc, by: u.id, bad: 0, good: 0 }; hit = true; } }); if (hit) M.concentrate(B, u, 'fleshtostone', 'Flesh to Stone', function () { if (t.conds.stoning && !t.conds.stoning.done) { delete t.conds.stoning; if (t.conds.restrained && t.conds.restrained.kind === 'stone') delete t.conds.restrained; } }); },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t)) return; var sc = TX().pFail(t, 'con', u.spellDC) * (TX().dpr(t) * 2 + t.hp * 0.3); if (!best || sc > best.score) best = { score: sc, t: t, keep: sc * 0.7 }; }); return best; }
  };
  // Globe of Invulnerability (SRD 5.1): a 10-ft globe about the caster; a spell of 5th level or lower cast from outside does nothing to those in it
  E.globeofinvulnerability = {
    summary: function () { return 'a 10-ft globe about you · spells of 5th level and lower from outside do nothing to those inside (concentration)'; },
    cast: function* (B, u, t, slot, head) { var rec = { by: u.id, x: u.x, y: u.y, max: 5 + up({ level: 6 }, slot) }; B.globes = (B.globes || []).concat([rec]); M.concentrate(B, u, 'globeofinvulnerability', 'Globe of Invulnerability', function () { B.globes = (B.globes || []).filter(function (g) { return g !== rec; }); }); FX.ring(u, 'glow', 50); B.card([head + ': a shimmering globe about ' + u.name + ' (concentration).']); yield 20; },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var casters = fs.filter(function (w) { return (w.known || []).length && (w.slots || []).some(function (n) { return n > 0; }); }); return casters.length ? { score: casters.length * 10, t: u } : null; }
  };
  M.globed = function (B, caster, w, slot) { return (B.globes || []).some(function (g) { var inG = function (z) { return Math.max(Math.abs(z.x - g.x), Math.abs(z.y - g.y)) * 5 <= 10; }; return inG(w) && !inG(caster) && (slot || 0) <= g.max; }); };
  E.irresistibledance = {
    summary: function () { return 'a creature within 30 ft · no first save: it dances -- attacks at it with advantage, its own and its DEX saves at disadvantage; WIS each action to stop (concentration)'; },
    cast: function* (B, u, t, slot, head, x) { if (t.type === 'undead' || RU.immuneTo(t, 'charmed')) { B.card([head + ': ' + nm(B, t) + ' is proof against it.']); yield 16; return; } t.conds.dancing = { dc: x.dc, by: u.id }; t.conds.faerie = { by: u.id }; t.conds.mocked = { by: u.id }; M.concentrate(B, u, 'irresistibledance', 'Irresistible Dance', function () { if (t.conds.dancing) { delete t.conds.dancing; delete t.conds.faerie; delete t.conds.mocked; } }); FX.sparkle(t, 'gold', 20); B.card([head + ': ' + nm(B, t) + ' begins to dance.']); yield 20; },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var t = fs.filter(function (w) { return M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), w) && w.type !== 'undead'; }).sort(function (a, b) { return TX().dpr(b) - TX().dpr(a); })[0]; return t ? { score: TX().dpr(t) * 2.5, t: t, keep: TX().dpr(t) * 1.5 } : null; }
  };
  E.sunbeam = {
    geo: function (B, u, g) { return u.conc && u.conc.id === 'sunbeam' ? Object.assign({}, g, { free: true, again: true }) : null; },
    summary: function (e) { return (e.g.again ? 'the beam again: ' : '') + '60-ft line · CON · 6d8 radiant (half) and blinded (concentration: again each action)'; },
    cast: function* (B, u, t, slot, head, x) {
      if (!x.g.again) M.concentrate(B, u, 'sunbeam', 'Sunbeam', function () {});
      var sq = M.area(u, x.g, t.x, t.y); FX.bloom(u.x, u.y, sq, 'bone');
      yield* saveAll(B, u, caughtIn(B, sq).filter(function (w) { return w !== u; }), 'con', x.dc, '6d8', 'radiant', true, head + ': a beam of sunlight', { failText: 'blinded', cond: function (w) { w.conds.blinded = { by: u.id, till: { who: w.id, at: 'end', n: 1 } }; } });
    },
    ai: function (B, u, e, slot, fs) { var b = TX().bestArea(B, u, e, fs, function (caught) { return TX().areaWorth(B, u, Object.assign({}, e, { sp: Object.assign({}, e.sp, { dmg: '6d8', half: true, save: 'con' }) }), 0, caught.filter(function (w) { return w !== u; })) * 1.3; }); if (b && !e.g.again) { b.score *= 1.6; b.keep = b.score / 3; } return b; }
  };
  // ------------------------------------------------------------------ 7th
  E.arcanesword = {
    geo: function (B, u, g) { return (B.spirits || []).some(function (s) { return s.by === u.id && s.sword && s.rounds > 0; }) ? Object.assign({}, g, { free: true, move: true, again: true, time: 'B' }) : null; },
    summary: function (e) { return (e.g.again ? 'bonus action · the sword moves 20 ft and strikes: ' : 'a sword of force within 60 ft (concentration); it strikes: ') + '3d10 force'; },
    cast: function* (B, u, t, slot, head, x) {
      var sw = (B.spirits || []).filter(function (s) { return s.by === u.id && s.sword; })[0];
      if (!sw) { sw = { by: u.id, x: t.x, y: t.y, dice: '3d10', rounds: 10, sword: true }; B.spirits = (B.spirits || []).concat([sw]); M.concentrate(B, u, 'arcanesword', 'Arcane Sword', function () { sw.rounds = 0; }); B.card([head + ': a shimmering sword of force hangs beside ' + nm(B, t) + '.'], 240); }
      sw.x = t.x; sw.y = t.y; FX.sparkle({ x: t.x, y: t.y, size: 1 }, 'glow', 18);
      var ux = u.x, uy = u.y; u.drawAt = { x: ux, y: uy }; u.x = t.x + (t.x > ux ? -1 : t.x < ux ? 1 : 0); u.y = t.y + (t.y > uy ? -1 : t.y < uy ? 1 : 0);
      try { yield* B.attack(u, t, { name: 'Arcane Sword', atk: u.spellAtk, dice: '3d10', mod: 0, type: 'force', spell: true, touch: true, fx: 'bolt', spirit: true }); } finally { u.x = ux; u.y = uy; delete u.drawAt; }
    },
    ai: function (B, u, e, slot, fs) { var best = null; fs.forEach(function (t) { if (G.dist(u, t) > 60) return; var sc = TX().worth(TX().pHit(u.spellAtk, RU.ac(t), 0) * 16.5, t) * (e.g.again ? 1 : 3); if (!best || sc > best.score) best = { score: sc, t: t, keep: 12 }; }); return best; }
  };
  // Delayed Blast Fireball (SRD 5.1): a bead at a point (concentration); it bursts when the caster lets go or wills it -- 12d6 fire and 1d6 more
  // for each turn it waited, DEX half
  E.delayedblastfireball = {
    geo: function (B, u, g) { return u.conc && u.conc.id === 'delayedblastfireball' ? Object.assign({}, g, { free: true, again: true }) : null; },
    summary: function (e, u) { var b = D.battle && (D.battle.beads || []).filter(function (x) { return x.by === u.id; })[0]; return e.g.again ? 'burst the bead now: ' + (12 + (b ? b.grown : 0)) + 'd6 fire, 20 ft' : 'a bead of fire at a point within 150 ft (concentration): it bursts for 12d6, a d6 more each turn it waits'; },
    cast: function* (B, u, t, slot, head, x) {
      var bd = (B.beads || []).filter(function (b) { return b.by === u.id; })[0];
      if (!x.g.again) { bd = { by: u.id, x: t.x, y: t.y, grown: 0, dc: x.dc }; B.beads = (B.beads || []).concat([bd]); M.concentrate(B, u, 'delayedblastfireball', 'Delayed Blast Fireball', function () { if (!bd.gone) { bd.gone = true; D.magic.beadBurst(B, u, bd); } }); B.card([head + ': a bead of fire hangs in the air, glowing.'], 300); yield 20; return; }
      M.endConc(B, u, 'burst');
      yield 20;
    },
    ai: function (B, u, e, slot, fs) {
      var bd = (B.beads || []).filter(function (b) { return b.by === u.id; })[0];
      var at = bd ? { x: bd.x, y: bd.y } : null;
      if (!at) { var b0 = TX().bestArea(B, u, Object.assign({}, e, { g: Object.assign({}, e.g, { shape: 'sphere', r: 20 }) }), fs, function (caught) { return TX().areaWorth(B, u, Object.assign({}, e, { sp: Object.assign({}, e.sp, { dmg: '12d6', half: true, save: 'dex' }) }), 0, caught); }); return b0 ? { score: b0.score * 1.1, t: b0.t, keep: b0.score } : null; }
      var caught = B.units.filter(function (w) { return G.standing(w) && Math.hypot(w.x - at.x, w.y - at.y) * 5 <= 20; });
      return { score: TX().areaWorth(B, u, Object.assign({}, e, { sp: Object.assign({}, e.sp, { dmg: (12 + bd.grown) + 'd6', half: true, save: 'dex' }) }), 0, caught) - 8, t: at };
    }
  };
  M.beadBurst = function (B, u, bd) {
    var sq = G.sphere(bd.x, bd.y, 20), list = caughtIn(B, sq), r = D.roll((12 + bd.grown) + 'd6'), lines = ['{o}The bead bursts!{/}  ' + (12 + bd.grown) + 'd6 = ' + r.total + ' fire  DEX DC ' + bd.dc];
    FX.bloom(bd.x, bd.y, sq, 'fire');
    list.forEach(function (w) { var sv = RU.save(w, 'dex', bd.dc), n = sv.ok ? Math.floor(r.total / 2) : r.total; lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' -> {r}' + n + '{/}'); B.hurt(w, n, 'fire'); });
    B.card(lines.slice(0, 8), 420);
    B.beads = (B.beads || []).filter(function (b) { return b !== bd; });
  };
  E.divineword = {
    summary: function () { return 'every foe within 30 ft that hears · CHA: by its HP, deafened, blinded, stunned, or dropped; the otherworldly sent home'; },
    cast: function* (B, u, t, slot, head, x) {
      var list = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && G.dist(u, w) <= 30; }), lines = [head + ': a word of the first speech  CHA DC ' + x.dc];
      FX.ring(u, 'gold', 60); D.sfx('encounter');
      list.forEach(function (w) {
        var sv = RU.save(w, 'cha', x.dc); if (sv.ok) { lines.push('  ' + Nm(B, w) + ': {n}withstands it{/}'); return; }
        if (/celestial|elemental|fey|fiend/.test(w.type || '')) { w.conds.banished = { by: u.id }; w.ethereal = true; lines.push('  ' + Nm(B, w) + ': {y}sent home{/}'); return; }
        if (w.hp <= 20) { lines.push('  ' + Nm(B, w) + ': {y}DROPS{/}'); B.hurt(w, w.hp + (w.temp || 0), 'radiant'); }
        else if (w.hp <= 30) { w.conds.stunned = { by: u.id }; w.conds.blinded = { by: u.id }; lines.push('  ' + Nm(B, w) + ': {p}stunned, blinded{/}'); }
        else if (w.hp <= 40) { w.conds.blinded = { by: u.id }; lines.push('  ' + Nm(B, w) + ': {o}blinded{/}'); }
        else lines.push('  ' + Nm(B, w) + ': deafened');
      });
      B.card(lines.slice(0, 8), 420); yield 30;
    },
    ai: function (B, u, e, slot, fs) { var near = fs.filter(function (w) { return G.dist(u, w) <= 30; }); if (!near.length) return null; return { score: near.reduce(function (s, w) { return s + TX().pFail(w, 'cha', u.spellDC) * (w.hp <= 20 ? w.hp + TX().dpr(w) * 2 : w.hp <= 40 ? TX().dpr(w) * 2 : 1); }, 0), t: u }; }
  };
  E.etherealness = {
    summary: function () { return 'yourself · into the Ethereal: out of the fight, back where you choose next turn'; },
    cast: function* (B, u, t, slot, head) { u.ethereal = true; u.conds.etherealSelf = { till: { who: u.id, at: 'start', n: 1 }, onEnd: function (w) { w.ethereal = false; } }; FX.sparkle(u, 'violet', 24); B.card([head + ': ' + u.name + ' steps out of the world.']); yield 20; },
    ai: function (B, u, e, slot, fs) { return u.hp < u.maxhp * 0.25 && G.foesNear(u, u.x, u.y, 5).length ? { score: 20, t: u } : null; }
  };
  E.fingerofdeath = oneSave('fingerofdeath', 'Finger of Death', 'con', '7d8+30', 'necrotic', true, { ramp: 'violet' });
  E.firestorm = areaSave('dex', '7d10', 'fire', true, 'fire');
  E.prismaticspray = {
    summary: function () { return '60-ft cone · DEX, and each caught one takes a ray of a d8: fire, acid, lightning, poison or cold (10d6, half), restrained, blinded, or two'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), lines = [head + '  DEX DC ' + x.dc], hits = [];
      var RAYS = [['fire', 'red'], ['acid', 'orange'], ['lightning', 'yellow'], ['poison', 'green'], ['cold', 'blue']];
      FX.bloom(u.x, u.y, sq, 'violet');
      caughtIn(B, sq).filter(function (w) { return w !== u; }).forEach(function (w) {
        var rolls = [D.d(8)]; if (rolls[0] === 8) rolls = [D.d(7), D.d(7)];
        var sv = RU.save(w, 'dex', x.dc);
        rolls.forEach(function (r) {
          if (r <= 5) { var dmg = D.roll('10d6').total, n = sv.ok ? Math.floor(dmg / 2) : dmg; lines.push('  ' + Nm(B, w) + ': the ' + RAYS[r - 1][1] + ' ray ' + (sv.ok ? '{n}saved{/}' : '{o}failed{/}') + ' -> {r}' + n + '{/} ' + RAYS[r - 1][0]); hits.push([w, n, RAYS[r - 1][0]]); }
          else if (r === 6) { lines.push('  ' + Nm(B, w) + ': the indigo ray ' + (sv.ok ? '{n}saved{/}' : '{p}restrained{/}')); if (!sv.ok) w.conds.restrained = { dc: x.dc, by: u.id }; }
          else { lines.push('  ' + Nm(B, w) + ': the violet ray ' + (sv.ok ? '{n}saved{/}' : '{p}blinded{/}')); if (!sv.ok) w.conds.blinded = { by: u.id, till: { who: w.id, at: 'end', n: 2 } }; }
        });
      });
      B.card(lines.slice(0, 8), 480); yield { fx: 1 };
      hits.forEach(function (h) { if (!h[0].dead) B.hurt(h[0], h[1], h[2]); });
      yield 24;
    },
    ai: function (B, u, e, slot, fs) { return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { if (w === u) return; sc += (G.hostile(u, w) ? 1 : -1.5) * TX().worth(26, w); }); return sc; }); }
  };
  E.regenerate = {
    summary: function () { return 'touch · 4d8+15 HP now, and 1 HP at the start of each of their turns after'; },
    cast: function* (B, u, t, slot, head) { var r = D.roll('4d8+15'), got = B.heal(t, r.total); t.conds.regenerating = { by: u.id }; FX.sparkle(t, 'moss', 20); B.card([head + ' on ' + t.name + ': {n}+' + got + '{/}, and knitting on.']); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { var t = allies.filter(function (w) { return !w.dead && G.dist(u, w) <= 5 + u.turn.move && TX().healNeed(B, u, w) >= 1; }).sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; })[0]; if (!t) return null; var from = G.dist(u, t) > 5 ? D.ai.approach(u, t, G.reach(u, u.turn.move), 5) : null; return { score: 33 * TX().healNeed(B, u, t) + 10, t: t, from: from }; }
  };
  // Symbol (SRD 5.1): a glyph laid at a square; the first foe to step onto it sets it off: every foe within 60 ft, WIS or stunned (the
  // symbol of stunning, the one a fight wants), a save at each of its turns' ends
  E.symbol = {
    summary: function () { return 'a glyph at a square within reach: the first foe onto it -- every foe within 60 ft, WIS or stunned'; },
    cast: function* (B, u, t, slot, head, x) { B.grounds = (B.grounds || []).concat([{ kind: 'glyph', sq: [[t.x, t.y]], by: u.id, dc: x.dc }]); FX.ring({ x: t.x, y: t.y, size: 1 }, 'gold', 20); B.card([head + ': a glyph, faint and gold, set in the floor.']); yield 20; },
    ai: function () { return null; }
  };
  // ------------------------------------------------------------------ 8th
  E.earthquake = {
    summary: function () { return 'a 100-ft radius within 500 ft · the ground heaves: difficult; each turn there DEX or prone, and CON to hold a spell (concentration)'; },
    cast: function* (B, u, t, slot, head, x) { var sq = M.area(u, x.g, t.x, t.y), rec = { kind: 'quake', sq: sq, by: u.id, dc: x.dc, difficult: true }; B.grounds = (B.grounds || []).concat([rec]); D.sfx('encounter'); B.shakeT = 60; M.concentrate(B, u, 'earthquake', 'Earthquake', function () { removeGround(B, rec); B.card(['{g}The ground stills.{/}'], 240); }); B.card([head + ': the ground heaves.']); yield 30; },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { sc += (G.hostile(u, w) ? 1 : -1.2) * (TX().pFail(w, 'dex', u.spellDC) * 4 + (w.conc ? 6 : 0)); }); return sc; }); }
  };
  E.feeblemind = {
    summary: function () { return 'a creature within 150 ft · 4d6 psychic, and INT or its mind is gone: no spells, no plans'; },
    cast: function* (B, u, t, slot, head, x) { var r = D.roll('4d6'); B.card([head + ' on ' + nm(B, t) + '  4d6 = {r}' + r.total + '{/} psychic'], 300); B.hurt(t, r.total, 'psychic'); if (t.hp > 0) yield* saveAll(B, u, [t], 'int', x.dc, null, '', false, '  its mind', { failText: 'shattered', cond: function (w) { w.conds.feeble = { by: u.id }; if (w.conc) M.endConc(B, w, 'the mind gone'); } }); },
    ai: function (B, u, e, slot, fs) { var t = fs.filter(function (w) { return M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), w) && (w.known || []).length; }).sort(function (a, b) { return TX().dpr(b) - TX().dpr(a); })[0]; return t ? { score: 14 + TX().pFail(t, 'int', u.spellDC) * TX().dpr(t) * 3, t: t } : null; }
  };
  E.holyaura = {
    summary: function () { return 'your allies within 30 ft · advantage on saves, attacks at them at disadvantage (concentration)'; },
    cast: function* (B, u, t, slot, head) { var who = B.units.filter(function (w) { return w.side === u.side && !w.dead && G.dist(u, w) <= 30; }); who.forEach(function (w) { w.conds.holyAura = { by: u.id }; FX.sparkle(w, 'gold', 12); }); M.concentrate(B, u, 'holyaura', 'Holy Aura', function () { who.forEach(function (w) { if (w.conds.holyAura && w.conds.holyAura.by === u.id) delete w.conds.holyAura; }); }); B.card([head + ': divine light about ' + who.map(function (w) { return w.name; }).join(', ') + ' (concentration).']); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { if (u.conc) return null; return { score: allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 30; }).length * 8, t: u }; }
  };
  E.maze = {
    summary: function () { return 'a creature within 60 ft · no save: gone into a labyrinth till it finds its way (INT 20, its action) or you let go (concentration)'; },
    cast: function* (B, u, t, slot, head) { t.conds.banished = { by: u.id, maze: true, x: t.x, y: t.y }; t.ethereal = true; M.concentrate(B, u, 'maze', 'Maze', function () { if (t.conds.banished) { delete t.conds.banished; t.ethereal = false; B.card(['{p}' + Nm(B, t) + ' is back out of the maze.{/}'], 240); } }); FX.sparkle(t, 'violet', 26); B.card([head + ': ' + nm(B, t) + ' is gone into a labyrinth.']); yield 24; },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var t = fs.filter(function (w) { return M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), w); }).sort(function (a, b) { return TX().dpr(b) - TX().dpr(a); })[0]; return t ? { score: TX().dpr(t) * 3, t: t, keep: TX().dpr(t) * 2 } : null; }
  };
  E.mindblank = {
    summary: function () { return 'touch · immune to psychic harm and to charm for the fight'; },
    cast: function* (B, u, t, slot, head) { t.conds.mindBlank = { by: u.id }; t.condImmune = (t.condImmune || []).concat(['charmed']); t.immune = (t.immune || []).concat(['psychic']); FX.ring(t, 'glow', 24); B.card([head + ' on ' + t.name + ': a mind closed to all.']); yield 16; },
    ai: function () { return null; }
  };
  E.powerwordstun = {
    summary: function () { return 'a creature within 60 ft · no save: stunned if it has 150 HP or fewer; CON at each of its turns\' end'; },
    cast: function* (B, u, t, slot, head, x) { if (t.hp > 150) { B.card([head + ': ' + nm(B, t) + ' has too much life in it.']); yield 16; return; } t.conds.stunned = { by: u.id, dc: x.dc, pws: true }; FX.ring(t, 'gold', 30); B.card([head + ': ' + nm(B, t) + ' is {p}STUNNED{/}.']); yield 20; },
    ai: function (B, u, e, slot, fs) { var t = fs.filter(function (w) { return M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), w) && w.hp <= 150 && !w.conds.stunned; }).sort(function (a, b) { return TX().dpr(b) - TX().dpr(a); })[0]; return t ? { score: TX().dpr(t) * 2.5, t: t } : null; }
  };
  E.sunburst = areaSave('con', '12d6', 'radiant', true, 'bone', { cond: function (B, u, w, x) { w.conds.blindedBy = { dc: x.dc, by: u.id }; w.conds.blinded = { by: u.id }; }, after: function (B, u, sq) { B.darks = (B.darks || []).filter(function (d) { return d.kind !== 'darkness' || !d.sq.some(function (q) { return sq.some(function (p) { return p[0] === q[0] && p[1] === q[1]; }); }); }); if (B.lightMap) B.lightMap = null; } });
  // ------------------------------------------------------------------ 9th
  E.foresight = {
    summary: function () { return 'touch · advantage on its attacks and saves, and attacks at it at disadvantage, for the fight'; },
    cast: function* (B, u, t, slot, head) { t.conds.foresight = { by: u.id }; FX.ring(t, 'gold', 30); B.card([head + ' on ' + t.name + ': they see a moment ahead.']); yield 16; },
    ai: function (B, u, e, slot, fs, allies) { if (B.round > 2) return null; var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 && !w.conds.foresight; }).sort(function (a, b) { return TX().dpr(b) - TX().dpr(a); })[0]; return t ? { score: TX().dpr(t) * 3, t: t } : null; }
  };
  E.massheal = {
    summary: function () { return 'your allies in sight · 700 HP to share, blindness and sickness ended'; },
    cast: function* (B, u, t, slot, head) { var left = 700, got = []; TX().alliesOf(B, u).filter(function (w) { return !w.dead && M.sees(B, u, w); }).sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; }).forEach(function (w) { var n = Math.min(left, w.maxhp - Math.max(0, w.hp)); if (n > 0) { left -= n; B.heal(w, n); got.push(w.name + ' +' + n); } delete w.conds.blinded; }); FX.ring(u, 'gold', 70); B.card([head + ': {n}' + (got.join(', ') || 'all whole') + '{/}']); yield 24; },
    ai: function (B, u, e, slot, fs, allies) { var need = allies.reduce(function (s, w) { return s + (w.dead ? 0 : (w.maxhp - Math.max(0, w.hp)) * TX().healNeed(B, u, w)); }, 0); return need > 30 ? { score: need, t: u } : null; }
  };
  E.meteorswarm = {
    summary: function () { return 'four 40-ft spheres · DEX · 20d6 fire and 20d6 bludgeoning (half), each caught once'; },
    cast: function* (B, u, t, slot, head, x) {
      var pts = [[t.x, t.y]].concat(B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w); }).slice(0, 3).map(function (w) { return [w.x, w.y]; }));
      var sq = []; pts.forEach(function (p) { G.sphere(p[0], p[1], 40).forEach(function (q) { if (!sq.some(function (z) { return z[0] === q[0] && z[1] === q[1]; })) sq.push(q); }); });
      FX.bloom(t.x, t.y, sq, 'fire'); D.sfx('encounter');
      var list = caughtIn(B, sq), f = D.roll('20d6'), b = D.roll('20d6'), lines = [head + ': the sky falls  ' + f.total + ' fire + ' + b.total + ' bludgeoning  DEX DC ' + x.dc], hits = [];
      list.forEach(function (w) { var sv = RU.save(w, 'dex', x.dc), k = sv.ok ? 0.5 : 1; lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv)); hits.push([w, Math.floor(f.total * k), Math.floor(b.total * k)]); });
      B.card(lines.slice(0, 8), 480); yield { fx: 1 };
      hits.forEach(function (h) { B.hurt(h[0], h[1], 'fire'); if (!h[0].dead) B.hurt(h[0], h[2], 'bludgeoning'); });
      yield 30;
    },
    ai: function (B, u, e, slot, fs) { var sc = 0; B.units.forEach(function (w) { if (!G.standing(w)) return; sc += (G.hostile(u, w) ? 1 : -1.5) * TX().worth(70 * 0.7, w); }); var t = fs[0]; return t && sc > 0 ? { score: sc, t: { x: t.x, y: t.y } } : null; }
  };
  E.powerwordkill = {
    summary: function () { return 'a creature within 60 ft · no save: dropped if it has 100 HP or fewer'; },
    cast: function* (B, u, t, slot, head) { if (t.hp > 100) { B.card([head + ': ' + nm(B, t) + ' has too much life in it.']); yield 16; return; } FX.ring(t, 'violet', 34); B.card([head + ': one word, and ' + nm(B, t) + ' {y}falls{/}.']); B.hurt(t, t.hp + (t.temp || 0), 'necrotic'); yield 24; },
    ai: function (B, u, e, slot, fs) { var t = fs.filter(function (w) { return M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), w) && w.hp <= 100; }).sort(function (a, b) { return b.hp - a.hp; })[0]; return t ? { score: t.hp + TX().dpr(t) * 3, t: t } : null; }
  };
  // the clocks and grounds of batch E: the stone's saves, the dance's, the stun's; the bead growing; the quake's shaking; the glyph; regrowth
  var onStartE = M.onStart;
  M.onStart = function (B, u) {
    onStartE(B, u);
    if (u.conds.regenerating && u.hp > 0 && u.hp < u.maxhp) u.hp++;
    (B.beads || []).forEach(function (b) { if (b.by === u.id && b.grown < 10) b.grown++; });
    (M.groundAt(B, u.x, u.y) || []).forEach(function (g) {
      if (g.kind !== 'quake' || u.hp <= 0) return;
      if (!u.conds.prone && !u.noProne) { var sv = RU.save(u, 'dex', g.dc); if (!sv.ok) { u.conds.prone = true; B.card([Nm(B, u) + ' is thrown down by the quake.'], 200); } }
      if (u.conc && u.conc.id !== 'earthquake') { var s2 = RU.save(u, 'con', g.dc); if (!s2.ok) M.endConc(B, u, 'the quake'); }
    });
    if (u.conds.feeble) { u.turn.bonusSpell = true; u.turn.spellAction = 'leveled'; } // (no spells: magic.js list asks conds.feeble too)
  };
  var onEndE = M.onEnd;
  M.onEnd = function (B, u) {
    onEndE(B, u);
    var st = u.conds.stoning;
    if (st && !st.done && u.hp > 0) { var sv = RU.save(u, 'con', st.dc); if (sv.ok) st.good++; else st.bad++; B.card([Nm(B, u) + ' against the stone: CON ' + RU.saveText(sv) + '  ' + st.bad + ' failed, ' + st.good + ' saved'], 200); if (st.good >= 3) { delete u.conds.stoning; if (u.conds.restrained && u.conds.restrained.kind === 'stone') delete u.conds.restrained; } else if (st.bad >= 3) { st.done = true; u.conds.banished = { by: st.by, stone: true }; u.ethereal = true; B.card(['{o}' + Nm(B, u) + ' is stone.{/}'], 300); } }
    var dn = u.conds.dancing; if (dn && u.hp > 0) { var s3 = RU.save(u, 'wis', dn.dc); if (s3.ok) { delete u.conds.dancing; delete u.conds.faerie; delete u.conds.mocked; B.card([Nm(B, u) + ' stops dancing.'], 200); } }
    var ps = u.conds.stunned; if (ps && ps.pws && u.hp > 0) { var s4 = RU.save(u, 'con', ps.dc); if (s4.ok) { delete u.conds.stunned; B.card([Nm(B, u) + ' shakes off the word.'], 200); } }
    var mz = u.conds.banished; if (mz && mz.maze) { var r = D.d(20) + D.mod(u.abil.int); if (r >= 20) { delete u.conds.banished; u.ethereal = false; B.card(['{p}' + Nm(B, u) + ' finds the way out of the maze.{/}'], 240); } }
  };
  var stepE = M.stepInto;
  M.stepInto = function (B, u) {
    var stop = stepE(B, u);
    (M.groundAt(B, u.x, u.y) || []).forEach(function (g) {
      if (g.kind !== 'glyph' || g.fired) return;
      var c = B.units.filter(function (w) { return w.id === g.by; })[0]; if (!c || !G.hostile(c, u)) return;
      g.fired = true; B.grounds = B.grounds.filter(function (x) { return x !== g; });
      var lines = ['{y}The glyph flares!{/}  WIS DC ' + g.dc];
      B.units.filter(function (w) { return G.hostile(c, w) && G.standing(w) && G.dist(u, w) <= 60; }).forEach(function (w) { var sv = RU.save(w, 'wis', g.dc); lines.push('  ' + Nm(B, w) + ': ' + (sv.ok ? '{n}steady{/}' : '{p}stunned{/}')); if (!sv.ok) w.conds.stunned = { by: g.by, dc: g.dc, pws: true }; });
      B.card(lines.slice(0, 8), 360); stop = true;
    });
    return stop;
  };

  // Weird (9th): Phantasmal Killer for a crowd -- a 30-ft sphere, WIS or frightened, and 4d10 psychic at each turn's end till it saves (concentration)
  E.weird = {
    summary: function () { return '30-ft sphere within 120 ft · WIS or frightened by its worst fear, 4d10 psychic at the end of each of its turns till it saves (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), hit = []; FX.bloom(t.x, t.y, sq, 'violet');
      yield* saveAll(B, u, caughtIn(B, sq).filter(function (w) { return G.hostile(u, w); }), 'wis', x.dc, null, '', false, head + ': each sees what it fears most', { failText: 'sees it', cond: function (w) { w.conds.frightened = { by: u.id }; w.conds.killer = { dc: x.dc, by: u.id, dice: '4d10' }; hit.push(w); } });
      if (hit.length) M.concentrate(B, u, 'weird', 'Weird', function () { hit.forEach(function (w) { if (w.conds.killer && w.conds.killer.by === u.id) { delete w.conds.killer; if (w.conds.frightened && w.conds.frightened.by === u.id) delete w.conds.frightened; } }); });
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { if (!G.hostile(u, w)) return; sc += TX().pFail(w, 'wis', u.spellDC) * 40; }); return sc; }); }
  };
})();
