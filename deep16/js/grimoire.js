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
  var MAGIC = { magic: true }; // (B.hurt's fourth: a spell's damage is magical -- Stoneskin halves none of it, SRD 5.1 "nonmagical bludgeoning, piercing, and slashing"; 10-03)
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
      if (M.globed && M.globed(B, u, w, o.level)) { lines.push('  ' + Nm(B, w) + ': {c}inside the globe: untouched{/}'); return; } // (o.level: the spell's own level, where a caller knows it outside a cast; else the cast's, B.castLevel)
      // o.against: the condition it lays (frightened, charmed): a creature proof against it (Mindless Rage, Nature's Ward) is not asked
      if (o.against && RU.immuneTo(w, o.against, u)) { lines.push('  ' + Nm(B, w) + ': {g}proof against it{/}'); return; }
      // (the save says what rides on it: the condition, or the blow -- the Fiend's Dark One's Own Luck asks; Countercharm asks `against`)
      var sv = RU.save(w, ab, dc, o.adv && o.adv(w), o.against || (o.cond && !o.cantrip ? 'condition' : null), r ? r.total : 0), ev = ab === 'dex' && RU.evasion(w), d = 0;
      if (r) d = sv.ok ? (ev ? 0 : half ? Math.floor(r.total / 2) : 0) : (ev ? Math.floor(r.total / 2) : r.total);
      lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{o}failed{/}' + (o.failText ? ' {p}' + o.failText + '{/}' : '')) + (r ? ' -> {r}' + d + '{/}' : ''));
      if (d) hits.push([w, d]);
      if (!sv.ok) failed.push(w);
    });
    if (!list.length) lines.push('  {g}no one in it.{/}');
    B.card(lines.slice(0, 8), 420);
    yield { fx: 1 };
    hits.forEach(function (h) { B.hurt(h[0], h[1], type, MAGIC); });
    if (o.cond) failed.forEach(function (w) { if (!w.dead && (w.hp > 0 || o.onDown)) o.cond(w); });
    yield 24;
    return failed;
  }
  E._saveAll = saveAll;
  function lift(B, list, cond, by) { B.units.forEach(function (w) { var c = w.conds[cond]; if (c && (!by || c.by === by)) delete w.conds[cond]; }); }
  // a word is heard (Vicious Mockery, Glass Whisper, Divine Word -- SRD 5.1: "that can hear you"): not by the deafened (Divine Word lays it)
  function cantHear(w) { return !!(w && w.conds && w.conds.deafened); }
  function hearSkip(w) { return cantHear(w) ? 'cannot hear it' : ''; }
  // the sicknesses Heal and Mass Heal end (SRD 5.1: blindness, deafness, every disease): Contagion is the grid's one disease -- its poison, and
  // the blinding it came to. Says what went, for the card
  function cureSick(w) {
    var c = w.conds, gone = [];
    if (c.blinded || c.blindedBy) { delete c.blinded; delete c.blindedBy; gone.push('blindness'); }
    if (c.deafened) { delete c.deafened; gone.push('deafness'); }
    if (c.contagion) { delete c.contagion; if (c.poisoned && c.poisoned.contagion) delete c.poisoned; gone.push('the disease'); }
    return gone;
  }
  function caughtIn(B, sq) { return B.units.filter(function (w) { return G.present(w) && w.hp > 0 && G.inArea(w, sq); }); }
  // ground a spell leaves (grease, vines, spikes): difficult, and what it does to those who enter it (M.stepInto) or end a turn on it
  M.groundAt = function (B, x, y) { return (B.grounds || []).filter(function (g) { return g.sq.some(function (q) { return q[0] === x && q[1] === y; }); }); };
  M.rough = function (B, x, y, u) {
    // (the Globe of Invulnerability, SRD 5.1: "the area within the barrier is excluded from the areas affected by such spells" -- a square of a globe a
    // spell was cast from outside of is no part of its ground; M.zoneGlobed. The brief leaned the other way: the cost stays. The SRD's sentence is plain)
    var sqz = { x: x, y: y };
    if ((B.grounds || []).some(function (g) { return g.difficult && g.sq.some(function (q) { return q[0] === x && q[1] === y; }) && !M.zoneGlobed(B, g, sqz); })) return true; // (a spell's ground is magical: Land's Stride does not waive it -- the SRD gives it advantage on Entangle's save instead)
    // the guardians' ring: half speed for the caster's foes inside it (SRD 5.1 Spirit Guardians)
    return (B.auras || []).some(function (a) { var c = B.units.filter(function (w) { return w.id === a.by; })[0]; return c && u && G.hostile(c, u) && Math.max(Math.abs(x - c.x), Math.abs(y - c.y)) * 5 <= a.r && !M.zoneGlobed(B, a, sqz); });
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
    if (c.noReact || c.turned || (c.confused && !M.zoneGlobed(B, c.confused, u))) u.reaction = 0; // (Glass Whisper, Shocking Grasp: no reactions till its turn is over; the turned take none at all; nor the confused, SRD 5.1 -- unless it stands in a Globe of Invulnerability the Confusion was cast from outside of)
    if (c.frosted) T.move = Math.max(0, T.move - 10); // Ray of Frost: -10 ft
    if (c.slowed) { T.move = Math.floor(T.move / 2); u.reaction = 0; T.slowed = true; } // Slow: half speed, no reactions, one attack, the action or the bonus
    if (c.hasted) { T.move *= 2; T.hasteAction = 1; } // Haste: double speed, one more action (one attack, Dash, Disengage, Hide, an object)
    if (c.lethargic) { T.move = 0; T.action = 0; T.bonus = 0; delete c.lethargic; B.card(['{g}' + Nm(B, u) + ' is dragged down by the haste\'s end: no move, no action.{/}'], 240); }
    if (c.retreat) T.bonusDash = true;
    // Aurdin's joke (the easter egg, 10-02): the gnolls' two full rounds run out as the turn they end at comes round (M.jokeClock); a hyena
    // still laughing has another fit of it as its turn comes round, a gnoll howls
    M.jokeClock(B, u);
    if (c.laughing && u.hp > 0 && M.hyena(u)) { D.sfx('cackle2'); B.card(['{p}' + Nm(B, u) + ' rolls in the dirt, cackling.{/}'], 200); }
    else if (c.laughing && u.hp > 0 && M.gnoll(u)) { if (!laughsOnItsRow(u)) D.sfx('gnollaugh'); B.card(['{p}' + Nm(B, u) + ' howls with laughter on the ground, helpless.{/}'], 200); }
    // Spirit Guardians: a foe that starts its turn in the ring saves (once a turn, the first time: starting or entering)
    guardians(B, u, 'starts');
    // Command: the word it heard, obeyed now
    // (the Globe of Invulnerability: a word spoken from outside one is not obeyed by a creature that has since stepped inside it -- SRD 5.1, "can't affect creatures within")
    if (c.commanded) { var cm = c.commanded, w = cm.word; delete c.commanded; if (!M.zoneShut(B, cm, u, 'hears the command')) commandTurn(B, u, w); }
    // Fear's run (M.mustFlee, below) is a repeating effect too: the line is said once, at its turn's start
    if (c.feared && c.frightened) M.zoneShut(B, c.feared, u, 'would be running in fear');
  };
  M.onEnd = function (B, u) {
    var c = u.conds;
    // Aurdin's joke: the turn he cast it at himself over, he picks himself up (RULED 10-02, Griz: "Aurdin gets to get up after he ends the turn he cast the spell")
    if (u.jokeUp) { delete u.jokeUp; if (c.prone && !c.laughing && u.hp > 0 && !u.dead) { delete c.prone; B.card(['{g}' + u.name + ' picks himself up off the floor, still wheezing.{/}'], 220); } }
    // the saves at a turn's end
    [['laughing', 'wis', 'stops laughing'], ['blindedBy', 'con', 'can see again'], ['slowed', 'wis', 'shakes off the slow'], ['enfeebled', 'con', 'feels the strength come back'], ['confused', 'wis', 'comes to its senses'], ['sickened', 'wis', 'shakes off the sickness']].forEach(function (q) { // (Eyebite's sickened: a WIS save at the end of each of its turns, SRD 5.1)
      var s = c[q[0]]; if (!s || !s.dc || u.hp <= 0) return;
      var sv = RU.save(u, q[1], s.dc);
      B.card([Nm(B, u) + ' fights it off: ' + q[1].toUpperCase() + ' ' + RU.saveText(sv) + ' vs DC ' + s.dc + '  ' + (sv.ok ? '{n}' + q[2].toUpperCase() + '{/}' : '{g}not yet{/}')], 240);
      if (sv.ok) endCond(B, u, q[0]);
    });
    // Fear: a save only out of the caster's sight
    if (c.feared && c.feared.dc) {
      var src = B.units.filter(function (w) { return w.id === c.feared.by; })[0];
      if (!src || !G.los(u, src).clear || !M.sees(B, u, src)) { var sv2 = RU.save(u, 'wis', c.feared.dc, false, 'frightened'); B.card([Nm(B, u) + ', out of sight of the fear: WIS ' + RU.saveText(sv2) + ' vs DC ' + c.feared.dc + '  ' + (sv2.ok ? '{n}IT PASSES{/}' : '{g}still afraid{/}')], 240); if (sv2.ok) endCond(B, u, 'feared'); }
    }
    // Eyebite's panic (SRD 5.1): it ends when the target has got to a place at least 60 ft from the caster where it can no longer see them
    if (c.feared && c.feared.eyebite) {
      var eb = B.units.filter(function (w) { return w.id === c.feared.by; })[0];
      if (!eb || (G.dist(u, eb) >= 60 && (!G.los(u, eb).clear || !M.sees(B, u, eb)))) { B.card(['{g}' + Nm(B, u) + ' is far enough off, and out of sight: the panic ends.{/}'], 240); endCond(B, u, 'feared'); }
    }
    // grease: ending a turn on it, DEX or down
    (M.groundAt(B, u.x, u.y) || []).forEach(function (g) { if (g.kind === 'grease') slip(B, u, g, 'ends its turn on the grease'); });
    // Acid Arrow's second bite, at the end of its next turn
    // (the Globe of Invulnerability: the second bite is the arrow's, cast from outside the globe -- the creature inside it takes nothing; the bite was due this turn and is spent)
    if (c.acid && c.acid.fresh) c.acid.fresh = false; else if (c.acid) { var a = c.acid; delete c.acid; if (!M.zoneShut(B, a, u, 'feels the acid at its turn\'s end')) { var r = D.roll(a.dice); B.card([Nm(B, u) + ': the acid eats on  ' + a.dice + ' ' + RU.fmtRolls(r.rolls) + ' = {r}' + r.total + '{/} acid'], 240); B.hurt(u, r.total, 'acid', MAGIC); } }
    M.tick(B, u, 'end');
  };
  // a condition a spell laid, ended (its own undo: Hideous Laughter's prone and incapacitated go with it)
  function endCond(B, u, k) {
    var c = u.conds[k]; delete u.conds[k];
    if (k === 'laughing') { delete u.conds.incapacitated; }
    if (k === 'blindedBy') delete u.conds.blinded;
    if (k === 'feared') delete u.conds.frightened;
    if (k === 'confused' && c && c.react && u.hp > 0) u.reaction = 1; // (the reaction the confusion took is its own again)
    if (c && c.by) { var src = B.units.filter(function (w) { return w.id === c.by; })[0]; if (src && src.conc && c.single && src.conc.id === c.spell) delete src.conc; }
  }
  M.endCond = endCond;
  M.saveAll = saveAll; // (js/walls.js raises its walls with it)
  // hurt while laughing: the save again, with advantage (SRD 5.1); a hypnotized one wakes
  M.onHurt = function (B, u, n, type) {
    var c = u.conds;
    if (c.laughing && c.laughing.dc) { var r1 = D.d(20), r2 = D.d(20), b = u.saves ? u.saves.wis : D.mod(u.abil.wis), t = Math.max(r1, r2) + b; B.card([Nm(B, u) + ', hurt, tries to stop laughing: WIS d20 [' + r1 + ',' + r2 + ']>' + Math.max(r1, r2) + ' ' + RU.sign(b) + ' = ' + t + ' vs DC ' + c.laughing.dc + '  ' + (t >= c.laughing.dc ? '{n}STOPS{/}' : '{g}still laughing{/}')], 240); if (t >= c.laughing.dc) endCond(B, u, 'laughing'); }
    if (c.hypnotized) { delete c.hypnotized; delete c.incapacitated; delete c.charmed; B.card(['{g}' + Nm(B, u) + ' is jolted out of the pattern.{/}'], 200); }
  };
  // Sanctuary (SRD 5.1): the one who would strike the warded saves WIS first; failed, the blow (or the spell) is lost
  M.sanctuary = function (B, att, tgt) {
    var s = tgt.conds.sanctuary;
    if (M.zoneShut(B, s, tgt, 'is warded (Sanctuary)')) return true; // (the Globe of Invulnerability: the ward was cast from outside the globe the warded one stands in -- no save asked, the blow is the attacker's own)
    var sv = RU.save(att, 'wis', s.dc);
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
    var cl0 = B.castLevel; B.castLevel = 1; // (a 1st-level spell, whatever cast it came in the middle of: the globe counts that)
    try { yield* saveAll(B, u, [att], 'dex', u.spellDC, (1 + lv) + 'd10', 'fire', true, '{y}' + u.name + '{/}: HELLISH REBUKE (L' + lv + ') -- hellfire about ' + nm(B, att)); } finally { B.castLevel = cl0; }
  };
  // Spirit Guardians: the ring about the caster; a foe of his entering it (the first time in a turn) or starting there saves WIS
  function guardians(B, u, how) {
    (B.auras || []).forEach(function (a) {
      var c = B.units.filter(function (w) { return w.id === a.by; })[0];
      if (!c || !G.hostile(c, u) || u.hp <= 0 || u.dead || G.dist(c, u) > a.r) return;
      if (u.turn && u.turn['aura' + a.by]) return;
      if (u.turn) u.turn['aura' + a.by] = true;
      if (M.zoneShut(B, a, u, how + ' in the spirits\' ring')) return; // (the Globe of Invulnerability: cast from outside it, the ring does nothing to one inside)
      var r = D.roll(a.dice), sv = RU.save(u, 'wis', a.dc), d = sv.ok ? Math.floor(r.total / 2) : r.total;
      FX.sparkle(u, a.ramp || 'bone', 12);
      B.card([Nm(B, u) + ' ' + how + ' in the spirits\' ring: WIS ' + RU.saveText(sv) + ' vs DC ' + a.dc + '  ' + a.dice + ' ' + RU.fmtRolls(r.rolls) + ' -> {r}' + d + '{/} ' + a.type], 300);
      B.hurt(u, d, a.type, MAGIC);
    });
  }
  // stepping onto a spell's ground: grease (DEX or down, the move ends), spikes (2d4 each 5 ft), the guardians' ring
  M.stepInto = function (B, u) {
    var stop = false;
    M.groundAt(B, u.x, u.y).forEach(function (g) {
      if (g.kind === 'grease' && !u.conds.prone && slip(B, u, g, 'steps onto the grease')) stop = true;
      if (g.kind === 'spikes' && !M.zoneShut(B, g, u, 'in the spikes')) { var r = D.roll('2d4'); FX.float('spikes', u, D.PAL.ramps.moss[2]); B.card([Nm(B, u) + ' in the spikes: 2d4 ' + RU.fmtRolls(r.rolls) + ' = {r}' + r.total + '{/} piercing'], 160); B.hurt(u, r.total, 'piercing', MAGIC); }
    });
    guardians(B, u, 'comes');
    return stop || u.hp <= 0;
  };
  function slip(B, u, g, how) {
    if (u.noProne || RU.immuneTo(u, 'prone') || u.conds.prone) return false;
    if (M.zoneShut(B, g, u, how)) return false; // (inside a globe the grease was cast from outside of: nothing to slip on)
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
    else if (word === 'drop') { // (SRD 5.1: "drops whatever it is holding and then ends its turn" -- 10-06: the turn went on; one it gripped goes free, as the 8-bit's DROP)
      u.conds.disarmed = { till: { who: u.id, at: 'end', n: 1 } }; T.move = 0; T.action = 0; T.bonus = 0; T.attacksLeft = 0; T.lost = 'drops';
      B.units.forEach(function (w) { var r = w.conds.restrained; if (r && r.by === u.id && r.grapple) B.release(u, w); });
      B.card(['{p}' + Nm(B, u) + ' DROPS what it holds: the turn gone.{/}'], 300);
    }
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
    cast: function* (B, u, t, slot, head, x) { FX.projectile(u, t, 'bolt'); yield* saveAll(B, u, [t], 'con', x.dc, dice(x.sp, u, 0), 'poison', false, head, { cantrip: true, adv: function (w) { return RU.vsPoison(w); }, skip: function (w) { return RU.immuneTo(w, 'poisoned') || (w.immune || []).indexOf('poison') >= 0 ? 'no poison takes it' : ''; } }); },
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
    // the wood as the spell makes it (SRD 5.1: "you use your spellcasting ability instead of Strength for the attack and damage rolls of melee attacks using that
    // weapon, and the weapon's damage die becomes a d8"; the druid is proficient with club and quarterstaff, so the proficiency is in): the cast makes it, and the
    // AI's weighing (below) tries it on before it pays for it
    wood: function (u) { var wm = D.mod(u.abil.wis); return Object.assign({}, u.weapon, { name: u.weapon.name + ' (shillelagh)', atk: wm + u.prof, dice: '1d8', mod: wm, magic: true }); },
    cast: function* (B, u, t, slot, head) {
      var R = window.DS.R, wm = D.mod(u.abil.wis), w = E.shillelagh.wood(u);
      u.conds.shillelagh = { base: u.weapon }; u.weapon = w; FX.sparkle(u, 'moss', 14);
      M.expire(B, u, 'shillelagh', function () { if (u.conds.shillelagh) { if (u.beast && u.beast.keep) u.beast.keep.weapon = u.conds.shillelagh.base; else u.weapon = u.conds.shillelagh.base; delete u.conds.shillelagh; /* (a druid in a beast's shape has the bite in hand: the plain wood goes back to the shape it comes out of) */ B.card(['{g}' + Nm(B, u) + '\'s wood goes back to wood: Shillelagh ends.{/}'], 200); } }); // (SRD 5.1: 1 minute -- it had no end at all; 10-01b, the same sweep)
      B.card([head + ': the wood swells with green life -- {c}+' + w.atk + ' to hit, 1d8' + RU.sign(wm) + '{/}, magical.']); yield 20;
    },
    // the AI (10-01c, Griz: "no shillelagh then smacking? can we suggest that to the ai and run the numbers?"): a bonus action that goes with the swing, weighed as the
    // swing is -- by what the action would be worth with it and without. The best plan as the turn stands, against the best with the wood tried on (a swing from where it
    // can walk to; and no levelled spell after it: SRD 5.1, "a spell as a bonus action ... you can't cast another spell during the same turn, except a cantrip with a
    // casting time of 1 action" -- M.list greys them while T.bonusSpell). A Moonbeam to hold or a Conjure to call is the best plan with the wood as without it, and the
    // wood stays plain; a foe within its walk that the club does more to than its cantrip does, it is lit and swung. (TX._shill: the weighing inside the weighing)
    ai: function (B, u, e) {
      var tx = TX(), T = u.turn;
      if (tx._shill || !T || !T.action || T.attacksLeft || !u.weapon || u.conds.disarmed) return null;
      var keep = u.weapon, keepB = T.bonusSpell, base = null, wood = null;
      tx._shill = true;
      try { base = tx.plans(B, u)[0]; u.weapon = E.shillelagh.wood(u); T.bonusSpell = true; wood = tx.plans(B, u)[0]; }
      catch (err) { if (D.lastError == null) D.lastError = err; wood = null; }
      finally { u.weapon = keep; T.bonusSpell = keepB; tx._shill = false; }
      if (!wood || wood.kind !== 'weapon') return null;
      var gain = wood.score - Math.max(0, base ? base.score : 0);
      return gain > 0.5 ? { score: 2 + gain, t: u } : null;
    }
  };
  E.shockinggrasp = {
    summary: function (e, u) { return 'touch: melee spell attack · ' + dice(e.sp, u, 0) + ' lightning, advantage on metal armour · no reactions for it after'; },
    cast: function* (B, u, t, slot, head, x) {
      var metal = (E.shockinggrasp.metal || M.metalArmor)(t); // (SRD 5.1: a target wearing metal armour -- not leather, hide or a robe; a foe's sheet names no armour, so only a hero or class NPC in mail or plate, or a unit marked metalArmor)
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
    cast: function* (B, u, t, slot, head, x) { yield* saveAll(B, u, [t], 'wis', x.dc, dice(x.sp, u, 0), 'psychic', false, head + ' at ' + nm(B, t), { cantrip: true, skip: hearSkip, failText: 'stung', cond: function (w) { w.conds.mocked = { till: { who: w.id, at: 'end', n: 1 } }; } }); },
    ai: function (B, u, e, slot, fs) { var best = null, d = avg(dice(e.sp, u, 0)); fs.forEach(function (t) { if (!M.targetOK(B, u, e.g, t) || cantHear(t)) return; var pf = TX().pFail(t, 'wis', u.spellDC), sc = TX().worth(pf * d, t) + pf * TX().dpr(t) * 0.25; if (!best || sc > best.score) best = { score: sc, t: t }; }); return best; }
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
    summary: function () { return 'touch · +1d4 to one ability check: breaking free of a grip, web or vines, or Hide (concentration); the die once, then the spell ends'; },
    cast: function* (B, u, t, slot, head) { t.conds.guidance = { by: u.id }; M.concentrate(B, u, 'guidance', 'Guidance', function () { delete t.conds.guidance; }); B.card([head + ' on ' + t.name + ': {c}+1d4{/} to its next ability check.']); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { if (u.conc) return null; var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 && w.conds.restrained && !w.conds.guidance; })[0]; return t ? { score: 2, t: t, keep: 1 } : null; }
  };
  // the die is one check's (SRD 5.1: "add the number rolled to one ability check of its choice. It can roll the die before or after making the
  // ability check. The spell then ends"): magic.js breakFree rolls it into the break-free check; here it is spent -- the condition goes, and the
  // caster's concentration with it. The grid's checks that read it: the break-free (before the roll) and Hide (battle.js: after the roll, when
  // the d4 could turn a miss -- M.spendGuidance rolls and spends it)
  function endGuidance(B, u) {
    var g = u.conds.guidance;
    if (!g) return;
    var by = B.units.filter(function (w) { return w.id === g.by; })[0];
    if (by && by.conc && by.conc.id === 'guidance') M.endConc(B, by, 'the die is spent'); else delete u.conds.guidance;
    delete u.conds.guidance;
  }
  M.spendGuidance = function (B, u) { if (!u.conds.guidance) return 0; var d = D.d(4); endGuidance(B, u); return d; };
  var breakFree0 = M.breakFree;
  M.breakFree = function* (B, u) {
    var g = u.conds.guidance;
    yield* breakFree0.apply(this, arguments);
    if (g) endGuidance(B, u);
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
        if (M.globed(B, u, w, 1)) { lines.push('  ' + Nm(B, w) + ': {c}inside the globe: untouched{/}'); return; } // (the Globe of Invulnerability: it takes none of the pool)
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
      yield* saveAll(B, u, caughtIn(B, sq), 'str', x.dc, null, '', false, head + ': grasping weeds and vines burst from the ground', { skip: function (w) { return RU.immuneTo(w, 'restrained') ? 'nothing holds it' : ''; }, adv: function (w) { return !!w.landsStride; }, failText: 'restrained', cond: function (w) { w.conds.restrained = { dc: x.dc, by: u.id, kind: 'vines' }; held.push(w); } }); // (Land's Stride: advantage on the save against magically made plants, SRD)
      M.concentrate(B, u, 'entangle', 'Entangle', function () { removeGround(B, rec); B.units.forEach(function (w) { var r = w.conds.restrained; if (r && r.by === u.id && !r.grapple) delete w.conds.restrained; }); B.card(['{g}The vines wither.{/}'], 240); });
    },
    ai: function (B, u, e, slot, fs) { return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { if (RU.immuneTo(w, 'restrained')) return; sc += (G.hostile(u, w) ? 1 : -1.3) * TX().pFail(w, 'str', u.spellDC) * (TX().dpr(w) * 0.6 + 4) * 2; }); return sc; }); }
  };
  E.expeditiousretreat = {
    summary: function () { return 'bonus action · Dash as a bonus action each turn (concentration)'; },
    // SRD 5.1: "When you cast this spell, and then as a bonus action on each of your turns until the spell ends, you can take the Dash action." The cast
    // is the bonus action, so the Dash that comes with it is free: this turn's feet doubled now (10-01); T.bonusDash is the turns after (battle.js RETREAT DASH)
    cast: function* (B, u, t, slot, head) { u.conds.retreat = { by: u.id }; u.turn.bonusDash = true; M.concentrate(B, u, 'expeditiousretreat', 'Expeditious Retreat', function () { delete u.conds.retreat; }); var run = u.conds.restrained || u.conds.dancing ? 0 : u.speed; u.turn.move += run; B.card([head + ': quick feet (a Dash each turn as a bonus action).', run ? '  {c}+' + run + ' ft{/} now: the Dash that comes with the cast.' : '  {g}' + (u.conds.dancing ? 'Dancing in place: no move to add a Dash to.' : 'Held fast: the Dash adds a speed of 0.') + '{/}']); yield 16; },
    // the AI casts it to close on a foe it could not reach by the walk (js/tactics.js TX.dashBuys: nothing worth doing from here, a plan once the Dash is in), or to
    // kite (below); never over a concentration it holds
    ai: function (B, u, e, slot, fs) { if (u.conc || u.conds.retreat || TX()._dashing) return null; var s = Math.max(TX().dashBuys(B, u), retreatKite(B, u, fs)); return s > 0 ? { score: s, t: u, keep: 2.5 } : null; }
  };
  // the kite (10-01: "the warlock AI seldom casts Expeditious Retreat" -- the only thing it was asked was the Dash that closes, and a warlock shoots from where it
  // stands, so the ask never came). A ranged caster with melee foes that could be on it by their next turn (each one's speed and reach) wants the feet: the cast is
  // the bonus action, and the Dash that comes with it adds a speed to the turn's walk, a bonus Dash on every turn after -- enough, on a map with the room, to stand
  // past what any of them can cover (tactics.js keepOff runs there once the spell is up). Worth the blows it keeps off the caster, a round of the foes' damage
  // (TX.dpr) less the slot (spellPlans); nothing where no square within the walk is clear of them all. Not for an archer, a thrower or a caster foe (the Dash
  // outruns none of them: TX.chasers), a held or dancing caster, or one with no bonus action left
  function retreatKite(B, u, fs) {
    var T = u.turn, tx = TX();
    if (!T || !T.bonus || u.conds.restrained || u.conds.dancing || !((u.weapon && u.weapon.ranged) || tx.caster(u))) return 0;
    var chase = tx.chasers(u, fs);
    if (!chase.length) return 0;
    var rm = G.reach(u, T.move + u.speed), clear = Object.keys(rm).some(function (k) { var q = rm[k]; return q.stand && tx.outOfReach(u, chase, q.x, q.y); });
    if (!clear) return 0;
    // (the way out of a foe's reach is an opportunity attack -- half a round of its blows -- which a hurt caster pays leaving anyway, as keepOff does it with or without
    // the spell, but a whole one standing its ground would not)
    var worth = chase.reduce(function (s, f) { return s + tx.dpr(f); }, 0) * 0.8;
    if (u.hp > u.maxhp * 0.6) worth -= chase.reduce(function (s, f) { return s + (G.dist(u, f) <= G.reachOf(f) ? tx.dpr(f) * 0.5 : 0); }, 0);
    return Math.max(0, worth);
  }
  E.falselife = {
    summary: function (e) { return 'yourself · 1d4+' + (4 + 5 * Math.max(0, e.slot - 1)) + ' temporary HP'; },
    cast: function* (B, u, t, slot, head, x) { var r = D.roll('1d4+' + (4 + 5 * up(x.sp, slot))); u.temp = Math.max(u.temp || 0, r.total); u.conds.falseLife = { by: u.id, temp: r.total }; FX.sparkle(u, 'violet', 14); B.card([head + ': a false life fills ' + nm(B, u) + ' -- {c}' + r.total + ' temporary HP{/}.']); yield 20; }, // (conds.falseLife: what Dispel Magic ends -- its branch read a record nothing set, 10-01b's found list)
    ai: function (B, u) { return !u.temp && B.round <= 1 ? { score: 3, t: u } : null; }
  };
  E.grease = {
    summary: function () { return '10-ft square within 60 ft · DEX or prone, and again for any who enter or end a turn on it; difficult; it lasts a minute (ten rounds)'; },
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
  // the hyena (RULED 09-30, Griz: "despite the SRD, for this easer egg have the spell function on them - and them playing the animation") is
  // too simple to find the spell funny again (SRD 5.1, INT 4 or less): RULED 10-02, Griz: "I want you to change the easter egg" -- the egg is
  // Aurdin's own joke now (below). Laughing, a hyena still rolls on the floor (its sheet's rofl row, js/ui.js unitObj) and cackles (js/audio.js)
  M.hyena = function (w) { return /^hyena_/.test(w.sheet || ''); };
  M.gnoll = function (w) { return /^(gnoll|gloryseeker)/.test(w.kind || ''); }; // (a glory-seeker is the Snoot's young blood: a gnoll -- deep16/data/foes.js, wiki/the-snoot.md)
  // a gnoll's fit, on its sheet's `laugh` row (RULED 10-02, Griz: "I'd play 'yawn' (idle variation 6) when the laugh sound fires, then like sit/rest 2, 1,
  // 3, 8 .. 3 to fall/getup 1, 2, 4, 2, - 5, sit/rest 8, fall/getup 5, sit/rest 8"; and the laugh "at the 4 in 1, 2, 4, 2 is great, and on the first 8 in
  // the 5sit/8rest/5sit/8rest chain"). The row's poses (tools/gnoll-sheet.py): 0 the yawn, 1 sit 2, 2 sit 1, 3 sit 3, 4 sit 8, 5 fall 1, 6 fall 2, 7 fall
  // 4, 8 fall 5. [pose, ticks at 60 a second, the laugh fires as it begins]: the run once (one already on the ground skips it), then the chain over and
  // over while it laughs. The sound is one gnoll's at a time (B.laughQuiet: its length and a breath), so a pack laughing is a laugh track, not a din
  // (quiet 54: the sound's own length, 0.83 s, and a hair -- so the fall's 4 and the chain's first 8, 56 ticks apart, both sound; a pack's staggered starts
  // fall inside it, so the pack laughs as one: at 0, 2.0 s and 3.0 s, then every 1.6 s while it lies there)
  // (every: the chain's laugh on every other chain -- RULED 10-02, Griz: "every other chain"; so after 3.0 s, every 3.2 s)
  M.LAUGH = { run: [[0, 40, 1], [1, 10], [2, 10], [3, 10], [4, 18], [3, 12], [5, 10], [6, 12], [7, 26, 1], [6, 12]], chain: [[8, 18], [4, 30, 1], [8, 18], [4, 30]], every: 2, quiet: 54 };
  function laughLen(seq) { return seq.reduce(function (s, b) { return s + b[1]; }, 0); }
  // where u's fit is at B.t: { i: the beat's own number (the run's, then the chain's counted on), pose, laugh }; before its start (a pack's staggered
  // a few ticks apart) the yawn, no beat yet
  M.laughBeat = function (B, u) {
    var L = M.LAUGH, k = u.laughT == null ? 0 : B.t - u.laughT, run = L.run, ch = L.chain, rl = laughLen(run), cl = laughLen(ch);
    if (k < 0) return { i: -1, pose: 0, laugh: false };
    if (u.laughFloor) k += rl;
    if (k < rl) { for (var i = 0; i < run.length; i++) { if (k < run[i][1]) return { i: i, pose: run[i][0], laugh: !!run[i][2] }; k -= run[i][1]; } }
    k -= rl; var cyc = Math.floor(k / cl); k -= cyc * cl;
    for (var j = 0; j < ch.length; j++) { if (k < ch[j][1]) return { i: run.length + cyc * ch.length + j, pose: ch[j][0], laugh: !!ch[j][2] && cyc % (L.every || 1) === 0, cyc: cyc }; k -= ch[j][1]; }
    return { i: -1, pose: ch[0][0], laugh: false };
  };
  M.laughFrame = function (B, u) { return M.laughBeat(B, u).pose; };
  // each tick (battle.js update): a laugher on a sheet with the row starts its fit when the laugh takes it, and the sound fires on the beats that have it
  M.laughTick = function (B) {
    B.units.forEach(function (u) {
      if (!u.conds || !u.conds.laughing || u.dead || u.hp <= 0 || !(D.spr && D.spr.anim(u.sheet, 'laugh'))) { u.laughT = null; return; }
      if (u.laughT == null) { u.laughT = B.t + (B.units.indexOf(u) * 7) % 19; u.laughFloor = !!(u.proneLook && u.proneT != null && B.t - u.proneT > 1); u.laughBeat = -1; }
      var b = M.laughBeat(B, u);
      if (b.i === u.laughBeat) return;
      u.laughBeat = b.i;
      if (b.laugh && !(B.laughQuiet > B.t)) { D.sfx('gnollaugh'); B.laughQuiet = B.t + M.LAUGH.quiet; }
    });
  };
  // under a cutscene beat (the egg: "battle pauses ... then resume") the fits hold where they are, and go on from there after
  M.laughHold = function (B) { B.units.forEach(function (u) { if (u.laughT != null) u.laughT++; }); };
  function laughsOnItsRow(w) { return !!(D.spr && D.spr.anim(w.sheet, 'laugh')); } // (its row's beats carry its sound: M.laughTick)
  E.hideouslaughter = {
    summary: function () { return 'a foe within 30 ft · WIS · prone and helpless with laughter; a save each turn, and when hurt (concentration)'; },
    geo: function (B, u, g) { return M.jokeReady(B, u) ? Object.assign({}, g, { selfToo: true }) : null; }, // (the egg: his own square is a target too -- magic.js M.targetKind)
    cast: function* (B, u, t, slot, head, x) {
      if (t === u) { yield* joke(B, u, head); return; }
      var dc = x.dc, hit = [];
      yield* saveAll(B, u, [t], 'wis', dc, null, '', false, head + ' at ' + nm(B, t), { skip: function (w) { return w.abil && w.abil.int <= 4 ? 'too simple to find it funny' : ''; }, failText: 'helpless with laughter', cond: function (w) { w.conds.laughing = { dc: dc, by: u.id, spell: 'hideouslaughter', single: true }; w.conds.incapacitated = { by: u.id }; w.conds.prone = true; hit.push(w); if (M.gnoll(w) && !laughsOnItsRow(w)) D.sfx('gnollaugh'); } });
      if (hit.length) M.concentrate(B, u, 'hideouslaughter', 'Hideous Laughter', function () { hit.forEach(function (w) { if (w.conds.laughing && w.conds.laughing.by === u.id) { delete w.conds.laughing; delete w.conds.incapacitated; } }); });
    },
    ai: function (B, u, e, slot, fs) { var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, e.g, t) || t.conds.laughing || (t.abil && t.abil.int <= 4)) return; var pf = TX().pFail(t, 'wis', u.spellDC), sc = pf * (TX().dpr(t) * 1.8 + 4); if (!best || sc > best.score) best = { score: sc, t: t, keep: sc * 0.7 }; }); return best; }
  };

  // ---------------------------------------------------------------- Aurdin's joke (RULED 10-02, the easter egg, Griz: "If and only if Gnolls are present in 16bit
  // fight (main game only), and aurdin has done the silent quest and received and learned and selected it for the fight - he can cast hideous laughter on
  // himself, in which case he goes into hideous laughter. As a reaction, any hyenas go into hideous laughter until the end of their next turn (not end of
  // reaction) and any gnolls go into hideous laughter for 2 full rounds without save. after their reactions have played, hideous laughter on aurdin expires
  // - battle pauses and big red shiny easter egg on screen: "Guess I'm the Joke, Now" for a few seconds then resume"). The silent quest is the unjournaled
  // one, Ink for Katarina (js/events.js EV.UNJOURNALED: her vision was of Aurdin laughing, flag katVision, and the sheet); learned: in his book; selected:
  // among the day's spells he brought (the fight's list, js/save.js knownOf). The main game: a fight the 8-bit game opened (B.o.embed)
  M.jokeReady = function (B, u) {
    if (!B || !B.o || !B.o.embed || !u || u.id !== 'aurdin' || u.side !== 'party' || u.guest || u.classAI) return false;
    var fl = (B.from && B.from.data && B.from.data.flags) || {}, h = u.src || {};
    if (!fl.katVision || (h.known || []).indexOf('hideouslaughter') < 0 || (u.known || []).indexOf('hideouslaughter') < 0) return false;
    if (M.eggFound(B, 'joke')) return false; // (once the egg has come up, never again: RULED 10-02, Griz: "disabled when the egg appears (1 per customer)")
    return B.units.some(function (w) { return M.gnoll(w) && !w.dead && w.hp > 0; });
  };
  // the gnolls' two full rounds, from his turn to his turn two rounds on: measured by the round and the place in the order, so they end on time
  // whatever becomes of him (down, gone) -- asked at every turn's start (M.onStart)
  M.jokeClock = function (B, cur) {
    if (!B || !B.order) return;
    var ci = B.order.indexOf(cur);
    B.units.forEach(function (w) {
      var c = w.conds.laughing, e = c && c.joke && c.ends; if (!e) return;
      var by = B.units.filter(function (x) { return x.id === e.by; })[0], bi = by ? B.order.indexOf(by) : -1; if (bi < 0) bi = e.i;
      if (B.round < e.round || (B.round === e.round && (ci < 0 || ci < bi))) return;
      delete w.conds.laughing; delete w.conds.incapacitated;
      if (!w.dead && w.hp > 0) B.card(['{g}' + Nm(B, w) + ' wheezes, and stops laughing.{/}'], 200);
    });
  };
  function* joke(B, u, head) {
    if (u.conc) M.endConc(B, u, 'a new spell'); // (it is a concentration spell, and he cast it: what he held lets go -- and his own fit, below, is over at once)
    u.conds.laughing = { by: u.id, spell: 'hideouslaughter', joke: true }; u.conds.incapacitated = { by: u.id }; u.conds.prone = true;
    u.jokeUp = true; // (up again as this turn ends: M.onEnd -- RULED 10-02, Griz: "Aurdin gets to get up after he ends the turn he cast the spell")
    FX.sparkle(u, 'violet', 22);
    B.card([head + ' at himself', '{p}Aurdin cracks up at his own joke, and goes down laughing.{/}'], 320);
    // who hears it and laughs that laugh (any side; one asleep, held or stunned hears nothing)
    var hears = function (w) { return !w.dead && w.hp > 0 && !w.ethereal && !w.conds.asleep && !w.conds.paralyzed && !w.conds.stunned; };
    var hy = B.units.filter(function (w) { return M.hyena(w) && hears(w); }), gn = B.units.filter(function (w) { return M.gnoll(w) && hears(w); });
    // the cutscene, as the darkness's is (RULED 10-02, Griz: "Like those cut scenes, with Aurdin waist up and laugh, the cam down to him down with the laugh
    // and a give him a little hehehe that plays once showing him - then zoom on idol face living gnoll, then idle 6 with the sound (with the text overlaying
    // as appropriate) then zoomed back out and the effects we currently have start" -- "oh, hehehe from aurdin again on the still face of the hyena")
    var pfA = D.spr ? D.spr.proneFrame(u.sheet) : -1, gnF = gn.filter(function (w) { return w.kind === 'gnoll'; })[0] || gn[0];
    // (the framings by the figures' heights -- S.top: Aurdin's 53 px, the hyena's 36, the gnoll's 60 -- at 480 x 270: waist up, then faces)
    yield { scene: { who: u, face: true, faceAt: 0.65, scale: 5.5, bob: true, frames: 120, caption: 'AURDIN CRACKS UP AT HIS OWN JOKE.', tick: function (t) { if (t === 1) D.sfx('guffaw'); }, joke: 'waist' } };
    yield { scene: { who: u, anim: pfA >= 0 ? D.spr.proneRow(u.sheet) : 'idle', frame: pfA >= 0 ? pfA : null, scale: 4, bob: true, pan: 90, panDur: 46, frames: 130, caption: 'AND GOES DOWN LAUGHING.', tick: function (t) { if (t === 62) D.sfx('hehehe'); }, joke: 'down' } };
    if (hy[0]) yield { scene: { who: hy[0], face: true, faceAt: 0.68, scale: 9, frame: 0, frames: 100, tick: function (t) { if (t === 36) D.sfx('hehehe'); }, joke: 'hyena' } };
    if (gnF) {
      yield { scene: { who: gnF, face: true, faceAt: 0.73, scale: 7, zoomFrom: 2.4, frames: 70, joke: 'gnoll' } };
      yield { scene: { who: gnF, anim: 'laugh', frame: 0, face: true, faceAt: 0.73, scale: 7, frames: 150, outro: 40, caption: gn.length > 1 ? 'THE GNOLLS KNOW THAT LAUGH.' : 'THE GNOLL KNOWS THAT LAUGH.', tick: function (t) { if (t === 1) D.sfx('gnollaugh'); }, joke: 'yawn' } };
    }
    hy.forEach(function (w) { // till the end of its next turn (M.tick), no save
      w.conds.laughing = { by: u.id, joke: true, till: { who: w.id, at: 'end', n: 1 }, endText: '{who} gets its breath back.', onEnd: function (x) { delete x.conds.incapacitated; } };
      w.conds.incapacitated = { by: u.id }; w.conds.prone = true; w.reaction = 0; FX.sparkle(w, 'violet', 12);
    });
    if (hy.length) { D.sfx('cackle'); B.card(['{p}' + (hy.length > 1 ? 'The hyenas catch it, and go over cackling' : 'The hyena catches it, and goes over cackling') + '{/} -- till the end of ' + (hy.length > 1 ? 'their' : 'its') + ' next turn.'], 320); yield 70; }
    gn.forEach(function (w) { // two full rounds (M.jokeClock), no save, not even when hurt (no dc: M.onHurt and the turn's-end save pass it by)
      w.conds.laughing = { by: u.id, joke: true, ends: { round: B.round + 2, by: u.id, i: B.order.indexOf(u) } };
      w.conds.incapacitated = { by: u.id }; w.conds.prone = true; w.reaction = 0; FX.sparkle(w, 'violet', 12);
    });
    if (gn.length) { if (!gn.every(laughsOnItsRow)) D.sfx('gnollaugh'); B.card(['{p}' + (gn.length > 1 ? 'The gnolls know that laugh. They go down howling with it' : 'The gnoll knows that laugh. It goes down howling with it') + '{/} -- two full rounds, no save.'], 320); yield 70; }
    // and his own fit is over: on the floor still, and up again as his turn ends (M.onEnd)
    delete u.conds.laughing; delete u.conds.incapacitated;
    B.card(['{g}Aurdin\'s fit passes. He is still on the floor -- up again as his turn ends.{/}'], 260);
    yield 30;
    yield* M.egg(B, 'joke'); // (and from here on, his own square is no target of it: M.jokeReady)
  }
  M.joke = joke;

  // the egg (Griz: "big red shiny easter egg on screen"): a red egg in the palette's own reds, lit from the upper left and dithered between the
  // steps, a white shine, a glint that sweeps it, sparks about it; it pops in and bobs, and the line comes up under it, big. The fight shows dim through
  var EGG = null;
  function eggSheet() {
    if (EGG) return EGG;
    var w = 40, h = 52, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], ln = Math.hypot(-0.55, -0.62, 0.56), L = [-0.55 / ln, -0.62 / ln, 0.56 / ln];
    var Hx = L[0], Hy = L[1], Hz = L[2] + 1, hn = Math.hypot(Hx, Hy, Hz); Hx /= hn; Hy /= hn; Hz /= hn;
    var lvl = new Int8Array(w * h), spec = new Float32Array(w * h), diag = new Float32Array(w * h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var i = y * w + x, ny = (y + 0.5 - h / 2) / (h / 2 - 1), half = (w / 2 - 1) * Math.sqrt(Math.max(0, 1 - ny * ny)) * (1 + 0.13 * ny), nx = (x + 0.5 - w / 2) / Math.max(0.001, half);
      lvl[i] = -1;
      if (Math.abs(ny) > 1 || Math.abs(nx) > 1 || half <= 0.5) continue;
      var px = nx * Math.sqrt(Math.max(0, 1 - ny * ny)), pz = Math.sqrt(Math.max(0, 1 - px * px - ny * ny));
      var dif = Math.max(0, px * L[0] + ny * L[1] + pz * L[2]), rim = Math.max(0, px * 0.55 + ny * 0.7 + pz * 0.2) * 0.22;
      var v = 0.1 + 0.9 * dif + rim, d = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 0.85;
      lvl[i] = Math.max(0, Math.min(4, Math.floor(v * 4.6 + d)));
      spec[i] = Math.pow(Math.max(0, px * Hx + ny * Hy + pz * Hz), 36) + d * 0.08;
      diag[i] = x + y * 0.55;
    }
    var out = new Int8Array(w * h);
    for (var y2 = 0; y2 < h; y2++) for (var x2 = 0; x2 < w; x2++) {
      var j = y2 * w + x2; if (lvl[j] >= 0) continue;
      out[j] = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (q) { var xx = x2 + q[0], yy = y2 + q[1]; return xx >= 0 && yy >= 0 && xx < w && yy < h && lvl[yy * w + xx] >= 0; }) ? 1 : 0;
    }
    EGG = { w: w, h: h, cv: cv, cx: cv.getContext('2d'), lvl: lvl, spec: spec, diag: diag, out: out };
    return EGG;
  }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  M.eggDraw = function (line, hue) { return function (ctx, t, W, H) { // (each egg its own line under it, and its own colour: the joke's red, the darkness's purple -- 10-02; the dunking booth's blue, the four blues and bone for the glint -- 10-05)
    var P = D.PAL.ramps, eg = eggSheet(), w = eg.w, h = eg.h, img = eg.cx.createImageData(w, h), px = img.data, V = hue === 'violet';
    var RED = (V ? P.violet.slice(1) : hue === 'blue' ? P.blue.concat([P.bone[0]]) : P.red).map(hex), WHITE = hex(P.bone[2]), CREAM = hex(P.bone[0]), PINK = hex(P.accent[0]), OUT = hex(P.outline[0]);
    var g0 = ((t + 40) % 110) * 1.1 - 26; // (the glint's place along the diagonal: a sweep every ~2 s)
    for (var i = 0; i < w * h; i++) {
      var c = null, l = eg.lvl[i];
      if (l >= 0) {
        var gd = Math.abs(eg.diag[i] - g0), up = gd < 1.2 ? 2 : gd < 2.6 ? 1 : 0;
        c = RED[Math.min(4, l + up)];
        if (eg.spec[i] > 0.62 || (up === 2 && l >= 2)) c = WHITE; else if (eg.spec[i] > 0.36) c = CREAM; else if (eg.spec[i] > 0.2) c = PINK;
      } else if (eg.out[i]) c = OUT;
      if (!c) continue;
      px[i * 4] = c[0]; px[i * 4 + 1] = c[1]; px[i * 4 + 2] = c[2]; px[i * 4 + 3] = 255;
    }
    eg.cx.putImageData(img, 0, 0);
    // the fight, dim beneath; a red glow behind
    var fade = Math.min(1, t / 10);
    ctx.save();
    ctx.fillStyle = (V ? 'rgba(10,6,18,' : 'rgba(14,4,8,') + (0.74 * fade).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
    var cxs = W / 2, cys = H / 2 - 27, gr = ctx.createRadialGradient(cxs, cys, 8, cxs, cys, 160);
    gr.addColorStop(0, (V ? 'rgba(138,92,180,' : 'rgba(184,52,40,') + (0.5 * fade).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    // the egg: pops in (over and back), then bobs and rocks a little
    var K = 2.5, k = K;
    if (t < 16) { var p = t / 16; k = K * (1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2)); } // (an ease out with an overshoot)
    var bob = t >= 16 ? Math.round(Math.sin((t - 16) / 13) * 2) : 0, rock = t >= 16 ? Math.sin((t - 16) / 21) * 0.05 : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(cxs), Math.round(cys + bob)); ctx.rotate(rock);
    if (k > 0.05) {
      ctx.globalAlpha = 0.35; ctx.fillStyle = '#05040a'; ctx.beginPath(); ctx.ellipse(0, h * k / 2 + 4, w * k * 0.42, 5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; // (its shadow)
      ctx.drawImage(eg.cv, Math.round(-w * k / 2), Math.round(-h * k / 2), Math.round(w * k), Math.round(h * k));
    }
    ctx.restore();
    // sparks about it: four-point stars, each on its own beat
    var SP = [[-70, -46, 0], [66, -60, 23], [80, 20, 47], [-78, 34, 11], [-36, -80, 61], [44, 70, 37], [8, -88, 79]];
    SP.forEach(function (s) {
      var ph = ((t + s[2]) % 48) / 48; if (t < 14 || ph > 0.6) return;
      var r = Math.round(Math.sin(ph / 0.6 * Math.PI) * 3), sx = Math.round(cxs + s[0]), sy = Math.round(cys + bob + s[1]);
      ctx.fillStyle = P.bone[2]; ctx.fillRect(sx, sy, 1, 1);
      ctx.fillStyle = r > 1 ? P.gold[4] : P.accent[0];
      for (var a = 1; a <= r; a++) { ctx.fillRect(sx + a, sy, 1, 1); ctx.fillRect(sx - a, sy, 1, 1); ctx.fillRect(sx, sy + a, 1, 1); ctx.fillRect(sx, sy - a, 1, 1); }
    });
    // the line, big, under it
    if (t >= 12) {
      var DS = window.DS, tw = DS.textWidth(line), al = Math.min(1, (t - 12) / 12);
      ctx.save(); ctx.globalAlpha = al; ctx.imageSmoothingEnabled = false;
      ctx.translate(Math.round(W / 2 - tw), Math.round(cys + h * K / 2 + 16)); ctx.scale(2, 2);
      DS.text(ctx, line, 1, 1, V ? P.violet[2] : P.red[1]); DS.text(ctx, line, 0, 0, P.bone[2]);
      ctx.restore();
    }
  }; };
  M.jokeEgg = M.eggDraw('Guess I\'m the Joke, Now');
  // the eggs found, kept in the save (10-02, Griz: "which I'm hoping we're tracking somewhere in their save files"): each egg's flag goes back to the
  // 8-bit game with the fight's others (B.flags8, js/embed.js), and each shows once a save -- "1 per customer". js/events.js EV.EGGS lists them
  // (the darkness's: RULED 10-02, Griz: "Make the egg purple and call it \"stare into the void long enough\"" -- set in the joke's case)
  M.EGGS = { joke: { flag: 'eggJoke', line: 'Guess I\'m the Joke, Now' }, darkness: { flag: 'eggDarkness', line: 'Stare Into the Void Long Enough', hue: 'violet' },
    dunk: { flag: 'eggDunk', line: 'Dunking Booth', hue: 'blue' } }; // (a player character rocked off the Edifice's edge into a fountain -- battle.js knockOff; 10-05, Griz: "'dunking booth' blue egg")
  M.eggFound = function (B, key) { var f = M.EGGS[key].flag, fl = (B.from && B.from.data && B.from.data.flags) || {}; return !!(fl[f] || (B.flags8 && B.flags8[f])); };
  M.egg = function* (B, key) {
    if (M.eggFound(B, key)) return;
    B.flags8 = B.flags8 || {}; B.flags8[M.EGGS[key].flag] = 1;
    // the battle holds while the egg is up (a cutscene beat, js/ui.js scene: E, or a click, after a second goes on)
    yield { scene: { draw: key === 'joke' ? M.jokeEgg : M.eggDraw(M.EGGS[key].line, M.EGGS[key].hue), frames: 230, tick: function (t) { if (t === 1) D.sfx('rimshot'); if (t === 30 || t === 130) D.sfx('shine'); }, egg: key } };
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
    // (10-01, Griz: "Yes to Longstriding Hastened Globe runners": the +10 ft is the speed's, and stands -- but a dancer "must use all its movement to dance
    // without leaving its space" and a restrained creature's "speed becomes 0, and it can't benefit from any bonus to its speed" (SRD 5.1), so cast on the
    // caster's own turn it hands such a one no feet to walk this turn, as Expeditious Retreat's Dash above hands none)
    cast: function* (B, u, t, slot, head) { var held = t.conds.restrained || t.conds.dancing; if (!t.conds.longstrider) { t.conds.longstrider = { by: u.id }; t.speed += 10; /* (a record, not `true`: the M.cast wrapper stamps where it was cast, for a Globe of Invulnerability -- 10-01c) */ if (t.turn && t === u && !held) t.turn.move += 10; if (t.turn && t === u && t.turn.moveFull != null) t.turn.moveFull += 10; } B.card([head + ' on ' + t.name + ': {c}+10 ft{/} of stride.' + (held && t === u ? '  {g}' + (t.conds.dancing ? 'Dancing in place: no move to add it to.' : 'Held fast: a bonus to speed is no use at a speed of 0.') + '{/}' : '')]); yield 16; },
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
    cast: function* (B, u, t, slot, head, x) { FX.sparkle(t, 'violet', 16); yield* saveAll(B, u, [t], 'wis', x.dc, dice(x.sp, u, slot), 'psychic', true, head + ' to ' + nm(B, t), { skip: hearSkip, failText: 'sees itself in the glass', cond: function (w) { w.reaction = 0; w.conds.noReact = { till: { who: w.id, at: 'end', n: 1 } }; } }); },
    ai: function (B, u, e, slot, fs) { var best = null, d = avg(dice(e.sp, u, slot)); fs.forEach(function (t) { if (!M.targetOK(B, u, e.g, t) || cantHear(t)) return; var pf = TX().pFail(t, 'wis', u.spellDC), sc = TX().worth(pf * d + (1 - pf) * d / 2, t); if (!best || sc > best.score) best = { score: sc, t: t }; }); return best; }
  };
  E.protectionfromevilandgood = {
    summary: function () { return 'touch · aberrations, celestials, elementals, fey, fiends and the dead attack them at disadvantage (concentration)'; },
    cast: function* (B, u, t, slot, head) { t.conds.pfeg = { by: u.id }; M.concentrate(B, u, 'protectionfromevilandgood', 'Protection from Evil and Good', function () { delete t.conds.pfeg; }); FX.ring(t, 'gold', 30); B.card([head + ' on ' + t.name + ':', '  a ward against ' + D.typeText('the otherworldly and the dead', true) + ' (concentration).']); yield 16; },
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
      // (one inside a Globe of Invulnerability she is outside of is not under it -- SRD 5.1, "the area within the barrier is excluded from the areas affected by such
      // spells" -- a foe there is no one to blind, a mate there no one to blind by mistake: counted for nothing, M.zoneGlobed; Darkness is a spell of the 2nd)
      var z0 = { by: u.id, from: { x: u.x, y: u.y }, lv: 2 }, reach = function (w) { return !M.zoneGlobed(B, z0, w); };
      var sq = G.sphere(u.x, u.y, 15), foesIn = fs.filter(function (w) { return G.inArea(w, sq) && reach(w); }).length, matesIn = allies.filter(function (w) { return w !== u && G.inArea(w, sq) && !w.devilSight && reach(w); }).length;
      var near = fs.filter(function (w) { return G.dist(u, w) <= 60; }).length;
      if (!near) return null;
      var sc = near * 2.5 + foesIn * 1.5 - matesIn * 3;
      return sc > 0 ? { score: sc, t: { x: u.x, y: u.y }, keep: sc * 0.7 } : null;
    }
  };
  // the darkness itself, laid at squares (the spell's point, the drow's innate): lights of 2nd level or lower in it go out
  M.darknessAt = function* (B, u, sq, head) {
    var Lt = D.light, all = Lt ? Lt.all(B) : [];
    var inSq = function (x, y) { return sq.some(function (q) { return q[0] === Math.round(x) && q[1] === Math.round(y); }) && !(M.globed && M.globed(B, u, { x: Math.round(x), y: Math.round(y) }, 2)); }; // (a Light inside a globe the darkness is cast from outside of is not swallowed: the squares there are no part of it)
    // (the overlap that burns it: squares of the sphere the Daylight really lights -- D.light.reaches carves a globe's out of it -- and the Darkness holds: M.globed, as inSq asks it, leaves the globe's out of the Darkness too)
    if (all.some(function (l) { return l.kind === 'daylight' && sq.some(function (q) { return Math.hypot(q[0] - l.x, q[1] - l.y) * 5 <= l.bright && !(M.globed && M.globed(B, u, { x: q[0], y: q[1] }, 2)) && (!Lt || Lt.reaches(B, l, q[0], q[1])); }); })) { D.sfx('magic'); B.card([(head || u.name) + ': darkness -- and the daylight burns it away as it forms.'], 300); yield 30; return; }
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
        onMiss: function (w) { var r = D.roll(more('4d4', n)), h = Math.floor(r.total / 2); B.card(['  the arrow splashes: ' + RU.fmtRolls(r.rolls) + ' half = {r}' + h + '{/} acid'], 240); B.hurt(w, h, 'acid', MAGIC); } });
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
    cast: function* (B, u, t, slot, head, x) { var dc = x.dc; yield* saveAll(B, u, [t], 'con', dc, null, '', false, head + ' on ' + nm(B, t), { against: 'blinded', failText: 'blinded', cond: function (w) { w.conds.blinded = { by: u.id }; w.conds.blindedBy = { dc: dc, by: u.id }; } }); },
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
  var ASPECTS = [
    { abil: 'con', label: 'BEAR\'S ENDURANCE  (2d6 temp HP, CON checks)', say: 'the bear\'s endurance' },
    { abil: 'str', label: 'BULL\'S STRENGTH  (STR checks)', say: 'the bull\'s strength' },
    { abil: 'dex', label: 'CAT\'S GRACE  (DEX checks)', say: 'the cat\'s grace' },
    { abil: 'cha', label: 'EAGLE\'S SPLENDOR  (CHA checks)', say: 'the eagle\'s splendor' },
    { abil: 'int', label: 'FOX\'S CUNNING  (INT checks)', say: 'the fox\'s cunning' },
    { abil: 'wis', label: 'OWL\'S WISDOM  (WIS checks)', say: 'the owl\'s wisdom' }
  ];
  E.enhanceability = {
    summary: function () { return 'touch · you choose: Bear\'s Endurance (2d6 temporary HP, CON checks), Bull\'s Strength (STR), Cat\'s Grace (DEX), Eagle\'s Splendor (CHA), Fox\'s Cunning (INT) or Owl\'s Wisdom (WIS) -- advantage on checks of that ability (concentration)'; },
    // the six aspects (SRD 5.1: "Choose one of the following effects"), Bear's first -- the benches take a prompt's first option. `abil` is the ability
    // the creature has advantage on checks of (rules.js RU.checkEdges reads conds.enhanced.abil). The grid rolls only STR/DEX checks (the break-free of a
    // grip or web, Hide): the CHA, INT and WIS aspects have nothing to act on yet, and nothing falls here for Cat's Grace
    cast: function* (B, u, t, slot, head, x) {
      var abil = x && x.abil;
      if (!abil) abil = (u.side !== 'party' || u.guest) ? E.enhanceability.pick(B, u, t) : yield { prompt: { who: u, title: u.name + ': ENHANCE ABILITY', lines: ['Which aspect does ' + nm(B, t) + ' take? Advantage on checks of its ability, until the spell ends.'], opts: ASPECTS.map(function (a) { return { label: a.label, value: a.abil }; }) } };
      var a = ASPECTS.filter(function (s) { return s.abil === abil; })[0] || ASPECTS[0], rec = { by: u.id, abil: a.abil }, r = a.abil === 'con' ? D.roll('2d6') : null;
      if (r && r.total > (t.temp || 0)) { t.temp = r.total; rec.temp = r.total; } // (the temporary HP do not stack: the higher stands)
      t.conds.enhanced = rec;
      M.concentrate(B, u, 'enhanceability', 'Enhance Ability', function () { if (t.conds.enhanced === rec) delete t.conds.enhanced; if (rec.temp) t.temp = 0; }); // (SRD: the temporary HP "are lost when the spell ends")
      FX.sparkle(t, 'gold', 14);
      B.card([head + ' on ' + t.name + ': ' + a.say + ' -- {c}' + (r ? r.total + ' temporary HP{/} and advantage on CON checks' : 'advantage on ' + a.abil.toUpperCase() + ' checks{/}') + ' (concentration).']); yield 20;
    },
    // an NPC's choice: Bull's Strength for one who grapples or is held or webbed (the break-free is a STR check), Cat's Grace for one in a grip it would slip with DEX; else Bear's
    pick: function (B, u, t) {
      var r = t.conds.restrained;
      if (r) return (r.grapple || r.kind === 'tentacles') && t.abil && D.mod(t.abil.dex) > D.mod(t.abil.str) ? 'dex' : 'str';
      return (t.holding || []).length ? 'str' : 'con';
    },
    ai: function (B, u, e, slot, fs, allies) { if (u.conc) return null; var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 && !(w.temp > 0); }).sort(function (a, b) { return foesAt(B, b) - foesAt(B, a); })[0]; return t ? { score: 7 * 0.8, t: t, keep: 1 } : null; }
  };
  function foesAt(B, w) { return B.units.filter(function (x) { return G.hostile(w, x) && G.standing(x) && G.dist(w, x) <= 10; }).length; }
  // Enlarge and Reduce (09-29): ONE record a creature (conds.enlarged, `down` for Reduce: the +1d4 and the drawn size key off its being
  // there, so it never stacks), and the casting that laid it owns it. A second casting takes over -- the first caster lets go through
  // endConc, whichever way it was -- and a concentration that ends takes down only the record it laid (u.conc.rec), never a newer one
  function sizeTakeOver(B, u, t) {
    var old = t.conds.enlarged, c = old && B.units.filter(function (w) { return w.conc && w.conc.id === 'enlargereduce' && w.conc.rec === old; })[0];
    if (c && c !== u) M.endConc(B, c, 'a new casting on ' + t.name); // (c === u: his own new concentration lets the old one go, below)
  }
  function sizeUndo(t, rec) { return function () { if (t.conds.enlarged === rec) { var k0 = D.spr.scaleOf(t); delete t.conds.enlarged; D.spr.regrow(t, k0); } }; }
  E.enlargereduce = {
    summary: function () { return 'a creature within 30 ft · an ally enlarged (+1d4 weapon damage, strong' + (D.RULES && D.RULES.enlargeReach ? ', +5 ft reach' : '') + ', drawn 1.5x), a foe reduced on a failed CON (-1d4, 0.7x); not one already so (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var k0 = D.spr.scaleOf(t);
      if (t.side === u.side) {
        var had = t.conds.enlarged && !t.conds.enlarged.down, rec = { by: u.id };
        sizeTakeOver(B, u, t); t.conds.enlarged = rec;
        M.concentrate(B, u, 'enlargereduce', 'Enlarge', sizeUndo(t, rec)); u.conc.rec = rec;
        D.spr.regrow(t, k0); FX.ring(t, 'stone', 30);
        B.card(had ? [head + ': ' + t.name + ' is already enlarged.', '{g}(no further growth; the new casting takes hold, concentration){/}'] : [head + ': ' + t.name + ' swells to twice their size.', '{g}(+1d4 on weapon hits' + (D.RULES && D.RULES.enlargeReach ? ', +5 ft reach' : '') + '; concentration){/}']); yield 20; return;
      }
      var hit = false, down = { by: u.id, down: true };
      yield* saveAll(B, u, [t], 'con', x.dc, null, '', false, head + ' on ' + nm(B, t), { failText: 'shrinks', cond: function (w) { sizeTakeOver(B, u, w); w.conds.enlarged = down; hit = true; D.spr.regrow(w, k0); } });
      if (hit) { M.concentrate(B, u, 'enlargereduce', 'Reduce', sizeUndo(t, down)); u.conc.rec = down; }
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
      B.darks = (B.darks || []).filter(function (d) { return !((d.kind === 'fog' || d.kind === 'stink' || d.kind === 'kill') && d.sq.some(function (q) { return sq.some(function (p) { return p[0] === q[0] && p[1] === q[1]; }); })); });
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
    summary: function (e) { return (e.g.again ? 'bonus action · the metal flares again: ' : 'a foe within 60 ft in metal · ') + more('2d8', Math.max(0, e.slot - 2)) + ' fire, no save; CON or it drops the burning weapon -- or, in armour it cannot shed, attacks and ability checks at disadvantage till your next turn (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      if (x.g.again) t = B.units.filter(function (w) { return w.conds.heated && w.conds.heated.by === u.id; })[0] || t;
      // (the Globe of Invulnerability: the metal was heated by a spell cast from outside it -- the record on the creature carries where from; M.cast has said it for the target it was handed, this is the one it flares on)
      if (x.g.again && t.conds.heated && M.zoneShut(B, t.conds.heated, t, 'would feel the metal flare')) { yield 24; return; }
      var dz = x.g.again ? t.conds.heated.dice : more('2d8', up(x.sp, slot)), r = D.roll(dz);
      if (!x.g.again) { t.conds.heated = { by: u.id, dice: dz }; M.concentrate(B, u, 'heatmetal', 'Heat Metal', function () { delete t.conds.heated; }); }
      FX.sparkle(t, 'fire', 16);
      B.card([head + (x.g.again ? ': the metal on ' + nm(B, t) + ' flares again' : ': the metal on ' + nm(B, t) + ' glows red-hot') + '  ' + dz + ' ' + RU.fmtRolls(r.rolls) + ' = {r}' + r.total + '{/} fire'], 300);
      B.hurt(t, r.total, 'fire', MAGIC);
      if (t.hp > 0 && !t.dead) {
        var sv = RU.save(t, 'con', x.dc), held = M.metalWeapon(t) && !M.metalArmor(t);
        B.card(['  ' + Nm(B, t) + ': CON ' + RU.saveText(sv) + ' vs DC ' + x.dc + '  ' + (sv.ok ? '{n}holds on{/}' : held ? '{o}drops the burning weapon{/}' : '{o}cannot shed it: disadvantage on its attacks{/}')], 300);
        if (!sv.ok) { if (held) t.conds.disarmed = { till: { who: t.id, at: 'end', n: 1 } }; else t.conds.disAt = { id: '*', why: 'burning metal', till: { who: u.id, at: 'start', n: 1 } }; }
      }
      yield 24;
    },
    ai: function (B, u, e, slot, fs) {
      if (e.g.again) { var h = B.units.filter(function (w) { return w.conds.heated && w.conds.heated.by === u.id; })[0]; return h && !(M.globeShuts && M.globeShuts(B, u, e.g, h)) ? { score: TX().worth(9, h), t: h } : null; } // (a flare on one inside a Globe of Invulnerability the spell was cast from outside of is a bonus action spent on nothing)
      if (u.conc) return null;
      var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t) || !(M.metalArmor(t) || M.metalWeapon(t))) return; var sc = TX().worth(avg(more('2d8', Math.max(0, slot - 2))), t) * 2.2; if (!best || sc > best.score) best = { score: sc, t: t, keep: sc * 0.5 }; }); return best;
    }
  };
  E.magicweapon = {
    summary: function (e) { return 'bonus action · touch · a weapon becomes +' + (e.slot >= 6 ? 3 : e.slot >= 4 ? 2 : 1) + ', magical (concentration)'; },
    cast: function* (B, u, t, slot, head) { var b = slot >= 6 ? 3 : slot >= 4 ? 2 : 1, w0 = t.weapon; if (w0 && w0.magic) { B.card([head + ' on ' + nm(B, t) + ': the ' + w0.name + ' is magic already -- {g}the spell takes only a nonmagical weapon{/}.']); yield 16; return; } if (w0) { t.conds.magicWeapon = { by: u.id, base: w0 }; t.weapon = Object.assign({}, w0, { atk: w0.atk + b, mod: (w0.mod || 0) + b, magic: true, name: w0.name + ' +' + b }); } M.concentrate(B, u, 'magicweapon', 'Magic Weapon', function () { if (t.conds.magicWeapon) { t.weapon = t.conds.magicWeapon.base; delete t.conds.magicWeapon; } }); FX.sparkle(t, 'glow', 14); B.card([head + ' on ' + (t === u ? 'his own blade' : t.name + '\'s weapon') + ': {c}+' + b + '{/}, and magical.']); yield 16; },
    ai: function (B, u, e, slot, fs) { if (u.conc || !u.weapon || u.weapon.magic || !fs.some(function (t) { return G.dist(u, t) <= u.turn.move + 5; })) return null; var mundane = fs.some(function (t) { return t.resist && t.resist.indexOf('mundane') >= 0; }); return { score: (u.attacksBase || 1) * 1.6 * 3 + (mundane ? 12 : 0), t: u, keep: 3 }; }
  };
  E.mirrorimage = {
    summary: function () { return 'yourself · three illusory doubles: a blow may strike one instead (a minute)'; },
    cast: function* (B, u, t, slot, head) { u.images = 3; u.conds.mirrorImage = { by: u.id }; M.expire(B, u, 'mirrorimage', function () { u.images = 0; delete u.conds.mirrorImage; }); FX.sparkle(u, 'violet', 24); B.card([head + ': three of ' + nm(B, u) + ', and which is which?']); yield 20; }, // (a minute: M.expire; conds.mirrorImage: where it was cast, for a Globe of Invulnerability -- the images are idle inside one it was cast from outside of)
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
    againName: 'Spiritual Weapon: swing',
    ai: function (B, u, e, slot, fs) {
      var sw = spiritOf(B, u), d = avg(sw ? sw.dice : more('1d8', Math.floor(Math.max(0, slot - 2) / 2))) + M.mod(u), best = null;
      fs.forEach(function (t) {
        if (sw ? Math.max(Math.abs(sw.x - t.x), Math.abs(sw.y - t.y)) * 5 > 25 : (G.dist(u, t) > 60 || !G.los(u, t).clear)) return;
        var sc = TX().worth(TX().pHit(u.spellAtk, RU.ac(t), 0) * d, t) * (sw ? 1 : 2.5); // (first cast: a minute of them)
        if (!best || sc > best.score) best = { score: sc, t: t };
      });
      // nobody within its 20 ft and a reach (Griz, 09-29: "it hangs in the air and does nothing the rest of the fight"): the bonus action
      // still moves it -- 20 ft toward the nearest foe, so next turn it strikes (the cast's drift)
      if (!best && sw) { var near = fs.filter(function (t) { return G.standing(t); }).sort(function (a, b) { return G.dist(a, sw) - G.dist(b, sw); })[0]; if (near) best = { score: 2.5, t: near }; }
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
    // (the Globe of Invulnerability: an ally in range that stands inside one the caster is outside of is not given it -- the card says so)
    cast: function* (B, u, t, slot, head) { var all = B.units.filter(function (w) { return w.side === u.side && !w.dead && G.dist(u, w) <= 30; }), shut = all.filter(function (w) { return M.globed(B, u, w, 3); }), who = all.filter(function (w) { return shut.indexOf(w) < 0; }); who.forEach(function (w) { w.conds.beacon = { by: u.id }; FX.sparkle(w, 'gold', 10); }); M.concentrate(B, u, 'beaconofhope', 'Beacon of Hope', function () { lift(B, who, 'beacon', u.id); }); B.card([head + ': hope on ' + who.map(function (w) { return w.name; }).join(', ') + ' (concentration).'].concat(shut.map(function (w) { return '  ' + Nm(B, w) + ': {c}inside the globe: untouched{/}'; }))); yield 20; },
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
  // Dispel Magic (SRD 5.1): every spell of 3rd level or lower on a creature ends; a spell of 4th or higher takes the caster's spellcasting-ability
  // check against 10 + its level, unless the slot spent is as high as the spell (then it ends outright). The grid's wards and cantrip riders
  // below are all 3rd or lower; the held ones (concentration: a spell of the caster's or a foe's) carry their own level (data/spells.js) and are the ones asked.
  // (A spell's level is its own, not the slot it was cast with: the grid does not keep that.)
  function spellLvl(id) { var sp = M.data(id); return sp && sp.level != null ? sp.level : 3; }
  function dispelOdds(u, slot, lvl) { return lvl <= Math.max(3, slot || 3) ? 1 : Math.max(0, Math.min(1, (21 - (10 + lvl - M.mod(u))) / 20)); }
  function ordinal(n) { return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); }
  // the spells' own areas on a square (SRD 5.1 Dispel Magic: "Choose one creature, object, or magical effect within range"; 10-02, Griz: "I like 'spell effect squares
  // without people' as valid dispel targets for that spell"): every record a cast laid on the grid -- the Globe's stamp gives each its spell (castId) and level (lv), js/grimoire.js
  // M.cast below -- whose squares take in (x, y). What no spell made has no castId and is not here: the darkmantle's aura, a map's own dark (RULED 10-02, Griz: "no to creature
  // abilities"). Each: { k: the list it lives in, z: the record, id, name, by, lv, end }
  function effectSq(B, k, z) {
    if (k === 'darks') return M.darkSq(B, z) || z.sq || [];
    if (z.sq) return z.sq;
    if (k === 'zones') return z.id === 'moonbeam' ? zoneSq(z) : G.sphere(z.x, z.y, 5);
    var c = B.units.filter(function (w) { return w.id === z.by; })[0];
    if (k === 'auras' || k === 'shells') { if (!c) return []; var r = k === 'shells' ? 10 : (z.r || 15), out = []; for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) if (G.dist(c, { x: x, y: y, size: 1 }) <= r) out.push([x, y]); return out; }
    if (k === 'lights') { var rr = Math.max(0, Math.floor((z.bright || 0) / 5)), o2 = []; for (var dy = -rr; dy <= rr; dy++) for (var dx = -rr; dx <= rr; dx++) o2.push([z.x + dx, z.y + dy]); return o2; }
    return z.x != null ? [[z.x, z.y]] : [];
  }
  M.effectSq = effectSq;
  M.effectsAt = function (B, x, y) {
    var out = [];
    ['grounds', 'zones', 'darks', 'webs', 'walls', 'auras', 'wards', 'beads', 'lights', 'spirits', 'shells'].forEach(function (k) {
      (B[k] || []).forEach(function (z) {
        if (!z || !z.castId || !effectSq(B, k, z).some(function (q) { return q[0] === x && q[1] === y; })) return;
        if (out.some(function (o) { return o.id === z.castId && o.by === z.by; })) return; // (one spell, one entry: a web's squares and its fog are the one Web)
        var sp = M.data(z.castId);
        out.push({ k: k, z: z, id: z.castId, name: sp ? sp.name : z.castId, by: z.by, lv: z.lv != null ? z.lv : spellLvl(z.castId) });
      });
    });
    return out;
  };
  // ending one: the caster's concentration when it is that spell's (the whole of it goes, as the spell's own undo says); else its clock's undo, or the record taken up
  function endEffect(B, ef) {
    var c = B.units.filter(function (w) { return w.id === ef.by; })[0];
    if (c && c.conc && c.conc.id === ef.id) { M.endConc(B, c, 'dispelled'); return; }
    var ex = (B.expiries || []).filter(function (e) { return e.by === ef.by && e.id === ef.id; })[0];
    if (ex) { B.expiries = B.expiries.filter(function (e) { return e !== ex; }); try { if (M.unveil) M.unveil(B, ex.undo); else ex.undo(); } catch (e) { /* (its undo gone already) */ } }
    B[ef.k] = (B[ef.k] || []).filter(function (q) { return q !== ef.z; });
    if (ef.k === 'walls') B.wallMap = null;
    if (D.light && B.lightMap) B.lightMap = null;
  }
  // Counterspell (SRD 5.1: "1 reaction, which you take when you see a creature within 60 feet of you casting a spell ... If the creature is casting a spell of 3rd
  // level or lower, its spell fails and has no effect. If it is casting a spell of 4th level or higher, make an ability check using your spellcasting ability. The DC
  // equals 10 + the spell's level"; higher slots: "the interrupted spell has no effect if its level is less than or equal to the level of the spell slot you used").
  // 10-02, Griz: "Yeah, that's an important one to have in there". Asked in js/magic.js M.cast as the spell is released, before it takes hold, of every foe of the
  // caster who knows it, has a slot of 3rd or higher and its reaction, and sees the caster within 60 ft: a player's hero picks the slot (or lets it go), the AI
  // counters a levelled spell that is not a friend's blessing on a friend. Countered, the spell fails; the caster's slot and action are spent. Not asked: a readied
  // spell's release (cast when it was readied), a spell used again (the floating weapon's swing), a cantrip by the AI. Not built: a Counterspell countered
  M.counterAsk = function* (B, u, id, slot, g) {
    var sp = M.data(id); if (!B || !sp || !B.units || (g && (g.free || g.again || g.move)) || (u.turn && u.turn.readied)) return false;
    var lv = sp.level || 0;
    var can = B.units.filter(function (w) { return w !== u && G.hostile(u, w) && G.standing(w) && w.reaction > 0 && RU.canAct(w) && (w.known || []).indexOf('counterspell') >= 0 && (w.slots || []).slice(2).some(function (n) { return n > 0; }) && G.dist(w, u) <= 60 && M.sees(B, w, u) && !w.conds.turned && !RU.charmedBy(w, u); });
    for (var i = 0; i < can.length; i++) {
      var w = can[i]; if (w.reaction <= 0) continue;
      var lvls = []; for (var s = 3; s <= (w.slots || []).length; s++) if (w.slots[s - 1] > 0) lvls.push(s);
      if (!lvls.length) continue;
      var pick = 0, cn = u.side === 'foe' ? 'The ' + B.shortName(u) : u.name;
      if (w.side === 'party' && !w.guest) {
        pick = yield { prompt: { who: w, title: w.name + ': COUNTERSPELL?', lines: [cn + ' is casting ' + sp.name + (lv ? ' (' + ordinal(lv) + ')' : ' (a cantrip)') + '.'], opts: lvls.map(function (s) { return { label: 'COUNTERSPELL (L' + s + ')' + (lv <= s ? ': it fails' : ': a check, DC ' + (10 + lv)), value: s }; }).concat([{ label: 'LET IT GO', value: 0 }]) } };
      } else {
        var friendly = /^(buff|cure|heal)$/.test(sp.kind) && g && g.side === 'ally';
        if (lv >= 1 && !friendly) pick = lvls.filter(function (s) { return s >= lv; })[0] || lvls[lvls.length - 1];
      }
      if (!pick) continue;
      w.reaction = 0; w.slots[pick - 1]--; D.sfx('magic'); FX.ring(w, 'silver', 30); FX.ring(u, 'silver', 24);
      var ok = lv <= pick, r = 0, tot = 0;
      if (!ok) { r = D.d(20); tot = r + M.mod(w); ok = tot >= 10 + lv; }
      B.card(['{o}' + w.name + '{/}: COUNTERSPELL (L' + pick + ') at ' + (u.side === 'foe' ? 'the ' + B.shortName(u) : u.name) + '\'s ' + sp.name + (r ? '  (d20 ' + r + RU.sign(M.mod(w)) + ' = ' + tot + ' vs DC ' + (10 + lv) + ')' : '') + ' -- ' + (ok ? '{c}it fails{/}.' : '{g}it goes through{/}.')], 320);
      yield 30;
      if (ok) return true;
    }
    return false;
  };
  E.dispelmagic = {
    summary: function (e) { return 'a creature within 120 ft, or a spell\'s area (an empty square in it) · its spells end: a hold, a web, a blessing, a haste, a ward, a darkness; ' + ordinal(Math.max(3, e.slot || 3)) + ' level and lower at once, a held spell above that needs your spellcasting check, DC 10 + its level'; },
    cast: function* (B, u, t, slot, head) {
      var ended = [], held = [], top = Math.max(3, slot || 3);
      // a square of a spell's area: that spell (one of them, where two lie on the square: a player's caster is asked which)
      if (t && t.x != null && t.hp == null) {
        var efs = M.effectsAt(B, t.x, t.y), ef = efs[0];
        if (efs.length > 1 && u.side === 'party' && !u.guest) ef = yield { prompt: { who: u, title: u.name + ': DISPEL WHICH?', lines: ['Two spells lie on that square.'], opts: efs.map(function (e) { return { label: e.name.toUpperCase() + ' (' + ordinal(e.lv) + ')', value: e }; }) } };
        if (!ef) { B.card([head + ': no spell lies on that square.']); yield 16; return; }
        var ok = ef.lv <= top, r0 = 0, tot0 = 0;
        if (!ok) { r0 = D.d(20); tot0 = r0 + M.mod(u); ok = tot0 >= 10 + ef.lv; }
        FX.ring({ x: t.x, y: t.y, size: 1 }, 'silver', 36);
        B.card([head + ' on the ' + ef.name + ': ' + (ok ? '{c}it unravels{/}.' : '{g}it holds{/}') + (r0 ? '  (' + ordinal(ef.lv) + ': d20 ' + r0 + RU.sign(M.mod(u)) + ' = ' + tot0 + ' vs DC ' + (10 + ef.lv) + ')' : '')], 300);
        if (ok) endEffect(B, ef);
        yield 24; return;
      }
      // (10-01c: what a Globe of Invulnerability holds off the creature is still on it -- Dispel Magic cast from inside the globe ends it too: the shelf lifted
      // while it works, M.liftVeil; cast from outside, the cast never got this far)
      var put = M.liftVeil(B);
      try {
      // a held spell: at or under the slot it ends outright; above it, d20 + the spellcasting modifier against 10 + its level
      var asks = function (cc) {
        var L = spellLvl(cc.id);
        if (L <= top) { ended.push(cc.name); return true; }
        var r = D.d(20), md = M.mod(u), tot = r + md, dc = 10 + L, ok = tot >= dc;
        (ok ? ended : held).push(cc.name + ' (' + ordinal(L) + ': d20 ' + r + RU.sign(md) + ' = ' + tot + ' vs DC ' + dc + ')');
        return ok;
      };
      // SRD AS WE CAN (10-02, Griz: "3 - SRD as we can, yes - with noted exceptions"; SRD 5.1: "Any spell of 3rd level or lower on the target ends"): what is ON the
      // creature ends for it alone -- a spell another holds on several (a Bless, a Hold upcast, Fear) keeps holding the rest (before: the caster's whole spell ended, for
      // everyone it held). The creature's own concentration ends where that spell is on it -- a self spell, an aura about it, a mark it wears -- not a Hold it keeps on
      // someone else, nor a darkness at a point (dispel those where they are: the held one, the square). EXCEPTIONS (WHOLE): the spells whose ending does more than
      // lift what is on the one -- a form, a size, a plane, a lethargy -- end whole, for all they hold
      var WHOLE = { banishment: 1, haste: 1, polymorph: 1, enlargereduce: 1, animalshapes: 1, mislead: 1, etherealness: 1, gaseousform: 1, dominatebeast: 1, dominateperson: 1, dominatemonster: 1 };
      var marks = function (w, c, id) { return Object.keys(w.conds || {}).filter(function (k) { var v = w.conds[k]; return v && typeof v === 'object' && v.by === c.id && (v.castId || (c.conc && c.conc.id)) === id; }); };
      B.units.forEach(function (c) {
        if (!c.conc || c === t) return;
        var id = c.conc.id, mine = marks(t, c, id); if (!mine.length || !asks(c.conc)) return;
        var others = B.units.some(function (w) { return w !== t && marks(w, c, id).length > 0; });
        if (!others || WHOLE[id]) { M.endConc(B, c, 'dispelled'); return; }
        mine.forEach(function (k) { delete t.conds[k]; }); if (mine.indexOf('feared') >= 0) delete t.conds.frightened; if (mine.indexOf('confused') >= 0 && t.hp > 0) t.reaction = 1;
        ended[ended.length - 1] += ' (on ' + nm(B, t) + ' alone: ' + c.name + ' holds it on the rest)';
      });
      if (t.conc) {
        var tc = t.conc.id, gt = M.geo(tc) || {};
        var onIt = gt.shape === 'self' || (B.auras || []).some(function (a) { return a.by === t.id; }) || (B.shells || []).some(function (s) { return s.by === t.id; }) || marks(t, t, tc).length > 0;
        if (onIt && asks(t.conc)) M.endConc(B, t, 'dispelled');
      }
      // (what a spell wrote on the creature itself is taken back with it -- 10-01b, the gallery's carry-over found the same miss here:
      // Longstrider's +10 ft stayed after its dispelling, and a creature dispelled while blinked out stayed in the Ethereal for good)
      var UNDO = { longstrider: function () { t.speed -= 10; }, blink: function () { if (t.ethereal) t.ethereal = false; }, shillelagh: function () { if (t.beast && t.beast.keep) t.beast.keep.weapon = t.conds.shillelagh.base; else t.weapon = t.conds.shillelagh.base; } }; // (a druid in a beast's shape keeps the bite: the plain wood goes back to the shape it comes out of -- as the expiry, 10-01c)
      ['mageArmor', 'sanctuary', 'wardingBond', 'longstrider', 'guided', 'noHeal', 'frosted', 'acid', 'blindedBy', 'blinded', 'commanded', 'marked', 'branded', 'poisonWard', 'resistance', 'blink', 'shillelagh'].forEach(function (k) { if (t.conds[k]) { if (k === 'blindedBy' || k === 'blinded') { if (!(t.conds.blinded && t.conds.blinded.held)) { delete t.conds.blinded; delete t.conds.blindedBy; ended.push('blindness'); } return; } if (k === 'mageArmor') t.baseAC = t.conds.mageArmor && t.conds.mageArmor.base != null ? t.conds.mageArmor.base : t.src ? window.DS.R.ac(Object.assign({}, t.src, { conds: {} })) : t.baseAC; if (UNDO[k]) UNDO[k](); delete t.conds[k]; ended.push(k); } }); // (Mage Armor's own record keeps the AC it was cast over -- magic.js; a monster's has no 8-bit sheet to ask)
      if (t.images) { t.images = 0; delete t.conds.mirrorImage; ended.push('the images'); }
      if (t.conds.falseLife) { if (t.temp && t.temp <= t.conds.falseLife.temp) t.temp = 0; delete t.conds.falseLife; ended.push('false life'); } // (its temporary HP go with it -- unless more came since from something else)
      // and any other mark a spell with no concentration left on it (Sleep, Command's word, a Bestow Curse past concentration): by the spell the Globe's stamp names
      // (castId), its level asked as the rest; one with a clock of its own (M.expire) is undone by that clock's undo
      Object.keys(t.conds).forEach(function (k) {
        var v = t.conds[k]; if (!v || typeof v !== 'object' || !v.castId || !M.data(v.castId)) return;
        var c = B.units.filter(function (w) { return w.id === v.by; })[0]; if (c && c.conc && c.conc.id === v.castId) return; // (held by concentration: above)
        if (!asks({ id: v.castId, name: M.data(v.castId).name })) return;
        var ex = (B.expiries || []).filter(function (e) { return e.by === v.by && e.id === v.castId; })[0];
        if (ex) { B.expiries = B.expiries.filter(function (e) { return e !== ex; }); try { ex.undo(); } catch (e) { /* (its undo gone already) */ } }
        delete t.conds[k];
      });
      } finally { put(); }
      FX.ring(t, 'silver', 36);
      B.card([head + ' on ' + nm(B, t) + ': ' + (ended.length ? '{c}' + ended.join(', ') + '{/} unravel.' : held.length ? '' : 'nothing on it to undo.') + (held.length ? ' {g}Holds: ' + held.join(', ') + '.{/}' : '')], 300);
      yield 24;
    },
    ai: function (B, u, e, slot, fs, allies) {
      var best = null;
      allies.forEach(function (w) { if (!G.standing(w) || G.dist(u, w) > 120) return; var held = w.conds.paralyzed && w.conds.paralyzed.by && !w.conds.paralyzed.poison, sc = (held ? TX().dpr(w) * 2.5 : 0) + (w.conds.laughing || w.conds.hypnotized ? TX().dpr(w) * 2 : 0) + (w.conds.baned || w.conds.slowed ? 3 : 0); if (sc > 0 && (!best || sc > best.score)) best = { score: sc, t: w }; });
      fs.forEach(function (w) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), w)) return; var sc = (w.conds.hasted ? TX().dpr(w) * 1.5 : 0) + (w.images ? 4 : 0) + (w.conc ? 5 * dispelOdds(u, slot, spellLvl(w.conc.id)) : 0) + (w.conds.blessed || w.conds.shieldOfFaith ? 2 : 0) + (w.conds.sanctuary ? 3 : 0); if (sc > 0 && (!best || sc > best.score)) best = { score: sc, t: w }; });
      return best;
    }
  };
  E.fear = {
    summary: function () { return '30-ft cone · WIS or frightened: it drops what it holds and runs from you each turn (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), dc = x.dc, hit = []; FX.bloom(u.x, u.y, sq, 'violet');
      yield* saveAll(B, u, caughtIn(B, sq).filter(function (w) { return w !== u; }), 'wis', dc, null, '', false, head + ': a phantom of their worst fear', { against: 'frightened', skip: function (w) { return w.conds.heroism || RU.immuneTo(w, 'frightened') ? 'fearless' : ''; }, failText: 'terrified', cond: function (w) { w.conds.frightened = { by: u.id }; w.conds.feared = { dc: dc, by: u.id }; if (w.weapon && !w.guest && w.side === 'party') w.conds.disarmed = { till: { who: w.id, at: 'end', n: 1 } }; hit.push(w); } });
      if (hit.length) M.concentrate(B, u, 'fear', 'Fear', function () { hit.forEach(function (w) { if (w.conds.feared && w.conds.feared.by === u.id) { delete w.conds.feared; if (w.conds.frightened && w.conds.frightened.by === u.id) delete w.conds.frightened; } }); });
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { if (w === u || w.conds.frightened || RU.immuneTo(w, 'frightened')) return; sc += (G.hostile(u, w) ? 1 : -1.5) * TX().pFail(w, 'wis', u.spellDC) * TX().dpr(w) * 1.6; }); return sc; }); }
  };
  // Fly (SRD 5.1, 3rd, concentration; the grid's rules, 10-08 -- it had waited on flight, Griz: "yes to fly spell"): "You touch a willing creature. The target gains a flying
  // speed of 60 feet for the duration. When the spell ends, the target falls if it is still aloft" -- its wings (u.flies: js/grid.js, the wheel's layer, battle.js flyMove), its
  // speed 60 where it was less (on its own turn the feet it gains at once, the SRD's change of speeds), and both back when the concentration ends; a fall then is battle.js
  // flyCheck's ("no wings"). The AI keeps to the surface: it does not cast it. Not built: a second creature from a 4th-level slot
  E.fly = {
    summary: function () { return 'touch · a willing creature flies, 60 ft (Shift+wheel its height); it falls if still up when the spell ends (concentration)'; },
    cast: function* (B, u, t, slot, head) {
      if (t.conds.flying) { B.card([head + ': ' + t.name + ' flies already.']); yield 16; return; }
      var rec = t.conds.flying = { by: u.id, flies0: !!t.flies, speed0: t.speed };
      t.flies = true; if (t.speed < 60) { if (t.turn && B.active === t) t.turn.move += 60 - t.speed; t.speed = 60; }
      FX.ring(t, 'glow', 32); D.sfx('buff');
      B.card([head + ' on ' + t.name + ': {c}it flies, 60 ft{/}  {g}(Shift+wheel or PgUp/PgDn its height while it moves; concentration){/}'], 260);
      M.concentrate(B, u, 'fly', 'Fly', function () { if (t.conds.flying !== rec) return; delete t.conds.flying; t.flies = rec.flies0; t.speed = rec.speed0; if (t.turn && t.turn.move > t.speed) t.turn.move = t.speed; B.cache = null; if (B.flyCheck) B.flyCheck(); });
      yield 24;
    },
    ai: function () { return null; }
  };
  E.haste = {
    summary: function () { return 'a willing creature within 30 ft · +2 AC, advantage on DEX saves, double speed, one more attack each turn; a lost turn when it ends (concentration)'; },
    // (the doubled speed on the casting turn is movement a dancer ("must use all its movement to dance without leaving its space") or a restrained creature
    // ("speed becomes 0, and it can't benefit from any bonus to its speed") does not get; the extra action is theirs either way -- 10-01)
    cast: function* (B, u, t, slot, head) { t.conds.hasted = { by: u.id }; if (t.turn && t === u) { if (!(t.conds.restrained || t.conds.dancing)) t.turn.move += t.speed; if (t.turn.moveFull != null) t.turn.moveFull += t.speed; t.turn.hasteAction = 1; } FX.sparkle(t, 'glow', 20); M.concentrate(B, u, 'haste', 'Haste', function () { if (t.conds.hasted) { delete t.conds.hasted; if (!t.dead && t.hp > 0) t.conds.lethargic = true; } }); B.card([head + ' on ' + t.name + ': the world slows round them (+2 AC, double speed, an attack more; concentration).']); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { if (u.conc) return null; var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 30 && !w.conds.hasted && typeof w.attacks === 'number'; }).sort(function (a, b) { return TX().dpr(b) - TX().dpr(a); })[0]; if (!t) return null; var sc = TX().dpr(t) / Math.max(1, t.attacksBase || 1) * 0.9 * 3 + 2; return { score: sc, t: t, keep: sc * 0.6 }; }
  };
  E.hypnoticpattern = {
    summary: function () { return '30-ft cube within 120 ft · WIS or charmed: helpless, speed 0, till hurt (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), hit = []; FX.bloom(t.x, t.y, sq, 'violet');
      yield* saveAll(B, u, caughtIn(B, sq).filter(function (w) { return w !== u; }), 'wis', x.dc, null, '', false, head + ': a twisting pattern of colours', { against: 'charmed', skip: function (w) { return w.conds.blinded || w.blind ? 'does not see it' : RU.immuneTo(w, 'charmed') ? 'cannot be charmed' : ''; }, failText: 'entranced', cond: function (w) { w.conds.hypnotized = { by: u.id }; w.conds.incapacitated = { by: u.id }; w.conds.charmed = { by: u.id }; hit.push(w); } });
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
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var near = fs.filter(function (w) { return G.dist(u, w) <= 20 + u.turn.move && !(M.globeShuts && M.globeShuts(B, u, e.g, w)); }), d = avg(more('3d8', Math.max(0, slot - 3))); if (!near.length) return null; var sc = near.reduce(function (s, w) { var pf = TX().pFail(w, 'wis', u.spellDC); return s + (pf * d + (1 - pf) * d / 2) * 2.2; }, 0); return { score: sc, t: u, keep: sc * 0.6 }; }
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
  M.mustFlee = function (u) { return !!(u.conds.feared && u.conds.frightened) && !(D.battle && M.zoneGlobed(D.battle, u.conds.feared, u)); }; // (a creature in a Globe of Invulnerability that the Fear was cast from outside of does not run: the card says so at its turn's start, M.onStart) // (the turned -- Turn Undead, Turn the Unholy -- carry both: js/features.js F.turnUndead)

  // ------------------------------------------------------------------ the zones that move (the druid to nine, 09-29): Moonbeam and Flaming Sphere.
  // A thing at a point the caster moves by casting the spell again (the floating weapon's pattern): the beam by an action, 60 ft; the
  // sphere by a bonus action, 30 ft, ramming what it meets. B.zones: { id, by, x, y, dice, dc, save, type, hit }. The beam (5 ft round)
  // takes whoever enters it (the first time in a turn) or starts a turn in it: CON, 2d10 radiant, half. The sphere (one square) takes
  // whoever ends a turn within 5 ft of it, or is rammed: DEX, 2d6 fire, half; it sheds light as a torch does (B.lights, kind 'sphere').
  // Both concentration; both take anyone in the way, friend or foe -- the AI keeps its own out of them
  function zoneOf(B, u, id) { return (B.zones || []).filter(function (z) { return z.by === u.id && z.id === id; })[0] || null; }
  function zoneSq(z) { return G.sphere(z.x, z.y, 5); }
  M.zoneSq = zoneSq;
  function zoneCaught(B, z) { var sq = zoneSq(z); return B.units.filter(function (w) { return G.standing(w) && G.inArea(w, sq); }); }
  // one save against the zone: once a turn for the beam (the round and whose turn it is name the turn); every time for a ram or a turn's end
  function zoneHit(B, z, w, how, every) {
    if (!G.standing(w)) return;
    var key = B.round + ':' + (B.active ? B.active.id : '-');
    if (!every) { if (z.hit[w.id] === key) return; z.hit[w.id] = key; }
    if (M.zoneShut(B, z, w, how)) return; // (the Globe of Invulnerability: the beam and the sphere were cast from outside it)
    var r = D.roll(z.dice), sv = RU.save(w, z.save, z.dc), d = sv.ok ? Math.floor(r.total / 2) : r.total;
    FX.sparkle(w, z.id === 'moonbeam' ? 'bone' : 'fire', 12);
    B.card([Nm(B, w) + ' ' + how + ': ' + z.save.toUpperCase() + ' ' + RU.saveText(sv) + ' vs DC ' + z.dc + '  ' + z.dice + ' ' + RU.fmtRolls(r.rolls) + ' -> {r}' + d + '{/} ' + z.type], 300);
    B.hurt(w, d, z.type, MAGIC);
  }
  // (a creature inside a Globe of Invulnerability the spell is cast from outside of takes nothing from it: the AI counts it for nothing -- the other runner's M.globeShuts, js/magic.js)
  function unshut(B, u, e, list) { return list.filter(function (w) { return !(M.globeShuts && M.globeShuts(B, u, e.g, w)); }); }
  function zoneWorth(B, u, z, caught, d) { var sc = 0; caught.forEach(function (w) { var pf = TX().pFail(w, z.save, u.spellDC), v = pf * d + (1 - pf) * d / 2; sc += G.hostile(u, w) ? TX().worth(v, w) : -1.5 * v; }); return sc; }
  function sphereLight(B, u) { return (B.lights || []).filter(function (l) { return l.id === 'sphere' + u.id; })[0]; }
  // the nearest free open square to a point (the sphere wants an unoccupied space)
  function freeNear(x, y) {
    var best = null, bd = 99;
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var s = G.map.at(x + dx, y + dy); if (!s || !s.open || G.occupant(x + dx, y + dy)) continue; var dd = Math.abs(dx) + Math.abs(dy); if (dd < bd) { bd = dd; best = { x: x + dx, y: y + dy }; } }
    return best;
  }
  // Moonbeam (SRD 5.1): a 5-ft-radius shaft of pale light at a point within 120 ft (concentration, a minute); entering it or starting a
  // turn in it, CON or 2d10 radiant (half; a d10 more a slot); an action moves it up to 60 ft. (The shapechanger's disadvantage and
  // its reverting are not read.)
  E.moonbeam = {
    geo: function (B, u, g) { return zoneOf(B, u, 'moonbeam') ? Object.assign({}, g, { free: true, move: true, again: true }) : null; },
    againName: 'Moonbeam: move the beam',
    summary: function (e, u) { var z = D.battle && zoneOf(D.battle, u); return (z ? 'an action · the beam moves up to 60 ft: ' : 'a shaft of pale light, 5 ft round, at a point within 120 ft (concentration; an action moves it 60 ft): ') + 'entering it or starting a turn in it, CON or ' + (z ? z.dice : dice(e.sp, u, e.slot)) + ' radiant (half)'; },
    cast: function* (B, u, t, slot, head, x) {
      var z = zoneOf(B, u, 'moonbeam');
      if (!z) {
        z = { id: 'moonbeam', by: u.id, x: t.x, y: t.y, dice: dice(x.sp, u, slot), dc: x.dc, save: 'con', type: 'radiant', hit: {} };
        B.zones = (B.zones || []).concat([z]);
        M.concentrate(B, u, 'moonbeam', 'Moonbeam', function () { B.zones = (B.zones || []).filter(function (q) { return q !== z; }); B.card(['{g}The moonbeam fades.{/}'], 240); });
        D.sfx('magic'); FX.bloom(t.x, t.y, zoneSq(z), 'bone');
        B.card([head + ': a shaft of pale light falls from nowhere (concentration; an action moves it 60 ft).'], 360);
      } else {
        var far = Math.max(Math.abs(t.x - z.x), Math.abs(t.y - z.y));
        if (far > 12) { var k = 12 / far; t = { x: Math.round(z.x + (t.x - z.x) * k), y: Math.round(z.y + (t.y - z.y) * k) }; } // (60 ft of the way toward it)
        z.x = t.x; z.y = t.y; D.sfx('magic'); FX.bloom(z.x, z.y, zoneSq(z), 'bone');
        B.card(['{y}' + u.name + '{/} moves the moonbeam.'], 200);
      }
      yield 20;
      zoneCaught(B, z).forEach(function (w) { zoneHit(B, z, w, 'is caught in the moonbeam'); });
      yield 20;
    },
    ai: function (B, u, e, slot, fs) {
      var z = zoneOf(B, u, 'moonbeam');
      if (!z && u.conc) return null;
      var d = avg(z ? z.dice : dice(e.sp, u, slot)), zz = z || { save: 'con' };
      var b = TX().bestArea(B, u, Object.assign({}, e, { g: Object.assign({}, e.g, { shape: 'sphere', r: 5 }) }), fs, function (caught) { return zoneWorth(B, u, zz, caught, d); });
      if (!b || b.score <= 0) return null;
      if (z) { if (Math.max(Math.abs(b.t.x - z.x), Math.abs(b.t.y - z.y)) > 12) return null; if (b.score <= zoneWorth(B, u, z, unshut(B, u, e, zoneCaught(B, z)), d) + 1) return null; }
      else { b.score *= 2.2; b.keep = b.score * 0.5; }
      return b;
    }
  };
  // Flaming Sphere (SRD 5.1): a 5-ft ball of fire at a free square within 60 ft (concentration, a minute); whoever ends a turn within
  // 5 ft of it, DEX or 2d6 fire (half; a d6 more a slot); a bonus action rolls it up to 30 ft, and rammed into a creature it stops
  // and that creature saves. Bright light 20 ft and dim 20 more. (Fire: refused under a roost, as every fire is.)
  E.flamingsphere = {
    geo: function (B, u, g) { return zoneOf(B, u, 'flamingsphere') ? Object.assign({}, g, { free: true, move: true, again: true, time: 'B' }) : null; },
    againName: 'Flaming Sphere: roll it',
    summary: function (e, u) { var z = D.battle && zoneOf(D.battle, u); return (z ? 'bonus action · the sphere rolls up to 30 ft and rams what it meets: ' : 'a ball of fire, 5 ft across, at a free square within 60 ft (concentration; a bonus action rolls it 30 ft): ') + 'ending a turn within 5 ft of it, or rammed, DEX or ' + (z ? z.dice : dice(e.sp, u, e.slot)) + ' fire (half) · bright 20 ft'; },
    cast: function* (B, u, t, slot, head, x) {
      var z = zoneOf(B, u, 'flamingsphere');
      if (!z) {
        var at = freeNear(t.x, t.y);
        if (!at) { B.card(['{o}No room for the sphere there.{/}'], 200); return; }
        z = { id: 'flamingsphere', by: u.id, x: at.x, y: at.y, dice: dice(x.sp, u, slot), dc: x.dc, save: 'dex', type: 'fire', hit: {} };
        B.zones = (B.zones || []).concat([z]);
        B.lights = (B.lights || []).concat([{ id: 'sphere' + u.id, kind: 'sphere', x: z.x, y: z.y, bright: 20, dim: 20, color: 'fire', flame: true, by: u.id }]);
        if (B.lightMap) B.lightMap = null;
        M.concentrate(B, u, 'flamingsphere', 'Flaming Sphere', function () { B.zones = (B.zones || []).filter(function (q) { return q !== z; }); B.lights = (B.lights || []).filter(function (l) { return l.id !== 'sphere' + u.id; }); if (B.lightMap) B.lightMap = null; B.card(['{g}The flaming sphere gutters out.{/}'], 240); });
        D.sfx('fire'); FX.sparkle({ x: z.x, y: z.y, size: 1 }, 'fire', 24);
        yield* M.brighten(B, u, 'flame', head + ': a ball of fire, 5 ft across, rolls out (concentration; a bonus action rolls it 30 ft).', { x: z.x, y: z.y, bright: 20 });
        return;
      }
      // the roll: up to 30 ft toward the point, square by square; a creature in the way is rammed, and the sphere stops before it
      var steps = 0, rammed = null, line = G.line(z.x, z.y, t.x, t.y).slice(1);
      for (var i = 0; i < line.length && steps < 6; i++) {
        var q = line[i], s = G.map.at(q[0], q[1]); if (!s || !s.open) break;
        var occ = G.occupant(q[0], q[1]); if (occ) { rammed = occ; break; }
        z.x = q[0]; z.y = q[1]; steps++;
      }
      var lt = sphereLight(B, u); if (lt) { lt.x = z.x; lt.y = z.y; } if (B.lightMap) B.lightMap = null;
      D.sfx('fire'); FX.sparkle({ x: z.x, y: z.y, size: 1 }, 'fire', 16);
      B.card(['{y}' + u.name + '{/} rolls the flaming sphere ' + (steps * 5) + ' ft' + (rammed ? ' -- into ' + nm(B, rammed) + '!' : '.')], 240);
      yield 16;
      if (rammed) { zoneHit(B, z, rammed, 'is rammed by the flaming sphere', true); yield 16; }
    },
    ai: function (B, u, e, slot, fs) {
      var z = zoneOf(B, u, 'flamingsphere'), d = avg(z ? z.dice : dice(e.sp, u, slot)), best = null, zz = z || { save: 'dex' };
      fs = unshut(B, u, e, fs);
      if (!z) {
        if (u.conc) return null;
        fs.forEach(function (w) {
          if (G.dist(u, w) > 60 || !G.los(u, w).clear) return;
          for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
            var x = w.x + dx, y = w.y + dy, s = G.map.at(x, y); if ((!dx && !dy) || !s || !s.open || G.occupant(x, y) || G.dist(u, { x: x, y: y, size: 1 }) > 60) continue;
            var near = unshut(B, u, e, B.units.filter(function (v) { return G.standing(v) && G.dist(v, { x: x, y: y, size: 1 }) <= 5; }));
            var sc = zoneWorth(B, u, zz, near, d) * 1.6;
            if (sc > 0 && (!best || sc > best.score)) best = { score: sc, t: { x: x, y: y }, keep: sc * 0.5 };
          }
        });
        return best;
      }
      // the roll (a free bonus action): ram the best one within 30 ft along a clear line; beside a foe already, stay; else roll toward the nearest
      var here = { x: z.x, y: z.y, size: 1 };
      fs.forEach(function (w) {
        var dd = G.dist(w, here); if (dd > 30 || dd <= 5 || !G.losPoint(z.x, z.y, w.x, w.y)) return;
        var pf = TX().pFail(w, 'dex', u.spellDC), sc = TX().worth(pf * d + (1 - pf) * d / 2, w);
        if (!best || sc > best.score) best = { score: sc, t: { x: w.x, y: w.y } };
      });
      if (best) return best;
      if (fs.some(function (w) { return G.dist(w, here) <= 5; })) return null;
      var nearest = null, nd = 1e9; fs.forEach(function (w) { var dd = G.dist(w, here); if (dd < nd) { nd = dd; nearest = w; } });
      return nearest ? { score: 1, t: { x: nearest.x, y: nearest.y } } : null;
    }
  };
  // the beam's start of a turn and stepping in; the sphere's end of a turn beside it
  var onStartZ = M.onStart;
  M.onStart = function (B, u) { onStartZ(B, u); (B.zones || []).forEach(function (z) { if (z.id === 'moonbeam' && G.inArea(u, zoneSq(z))) zoneHit(B, z, u, 'starts its turn in the moonbeam'); }); };
  var onEndZ = M.onEnd;
  M.onEnd = function (B, u) { onEndZ(B, u); (B.zones || []).forEach(function (z) { if (z.id === 'flamingsphere' && G.standing(u) && G.dist(u, { x: z.x, y: z.y, size: 1 }) <= 5) zoneHit(B, z, u, 'ends its turn beside the flaming sphere', true); }); };
  var stepIntoZ = M.stepInto;
  M.stepInto = function (B, u) { var stop = stepIntoZ(B, u); (B.zones || []).forEach(function (z) { if (z.id === 'moonbeam' && G.inArea(u, zoneSq(z))) zoneHit(B, z, u, 'steps into the moonbeam'); }); return stop || u.hp <= 0; };

  // ------------------------------------------------------------------ 4th level (09-28, batch D: the foes' casters and the NPCs past 6)
  // Banishment (SRD 5.1): CHA or gone from the field while the caster holds it; one from another plane (fiend, celestial, elemental, fey)
  // does not come back if it is held the full minute (the ten rounds of concentration: its time is up), and is out of the fight for good; let
  // go sooner, or one native to this world (any other type), it returns where it stood
  var HOME = /^(celestial|elemental|fey|fiend)$/;
  E.banishment = {
    summary: function () { return 'a creature within 60 ft · CHA or gone while you hold it; a celestial, elemental, fey or fiend held the full minute (ten rounds) does not come back; any other, or one let go sooner, returns where it stood (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var gone = null, till = null;
      yield* saveAll(B, u, [t], 'cha', x.dc, null, '', false, head + ' on ' + nm(B, t), { failText: 'gone', cond: function (w) { w.conds.banished = { by: u.id, x: w.x, y: w.y }; w.ethereal = true; gone = w; FX.sparkle(w, 'violet', 26); } });
      if (gone) { M.concentrate(B, u, 'banishment', 'Banishment', function () {
        if (!gone.conds.banished) return;
        // one of another plane, the whole minute held: it does not return
        if (HOME.test(gone.type || '') && till != null && B.round >= till) { delete gone.conds.banished; gone.dead = true; gone.left = true; gone.deadT = B.t; FX.sparkle(gone, 'violet', 20); B.card(['{p}' + Nm(B, gone) + ' does not come back: the minute is up.{/}'], 240); return; }
        delete gone.conds.banished; gone.ethereal = false;
        if (!G.canStand(gone, gone.x, gone.y)) { var best = null, bd = 1e9; for (var yy = 0; yy < G.map.h; yy++) for (var xx = 0; xx < G.map.w; xx++) { if (!G.canStand(gone, xx, yy)) continue; var dd = Math.hypot(xx - gone.x, yy - gone.y); if (dd < bd) { bd = dd; best = [xx, yy]; } } if (best) { gone.x = best[0]; gone.y = best[1]; } }
        FX.sparkle(gone, 'violet', 20); B.card(['{p}' + Nm(B, gone) + ' is back.{/}'], 240);
      }); till = u.conc ? u.conc.till : null; if (u.conc) u.conc.home = HOME.test(gone.type || ''); } // (till: the round its time is up; home: one of another plane -- M.endConc below holds the AI to the minute)
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t)) return; var sc = TX().pFail(t, 'cha', u.spellDC) * (TX().dpr(t) * 3 + t.hp * 0.3); if (!best || sc > best.score) best = { score: sc, t: t, keep: sc * 0.7 }; }); return best; }
  };
  // the AI that would let go "to finish it" (js/tactics.js: nothing else left to fight, so the banished one is called back) holds one of another
  // plane to the end of the minute instead: let go sooner it would return, and the whole point of the spell is that it does not
  var endConc0 = M.endConc;
  M.endConc = function (B, u, why) {
    var c = u && u.conc;
    if (c && c.id === 'banishment' && c.home && why === 'to finish it' && c.till != null && B.round < c.till) return;
    return endConc0.apply(this, arguments);
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
    summary: function () { return '10-ft sphere within 90 ft · WIS or confused, and no reactions: each turn a d10 -- wander, stand, strike at random, or act (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), dc = x.dc, hit = []; FX.bloom(t.x, t.y, sq, 'violet');
      // (SRD 5.1: "an affected target can't take reactions": its reaction goes now, and M.onStart keeps it gone at each of its turns; react: it had one to lose)
      yield* saveAll(B, u, caughtIn(B, sq), 'wis', dc, null, '', false, head + ': their minds come loose', { failText: 'confused', cond: function (w) { w.conds.confused = { dc: dc, by: u.id, react: w.reaction > 0 }; w.reaction = 0; hit.push(w); } });
      if (hit.length) M.concentrate(B, u, 'confusion', 'Confusion', function () { hit.forEach(function (w) { var cf = w.conds.confused; if (cf && cf.by === u.id) { delete w.conds.confused; if (cf.react && w.hp > 0 && !w.dead) w.reaction = 1; } }); });
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { sc += (G.hostile(u, w) ? 1 : -1.5) * TX().pFail(w, 'wis', u.spellDC) * TX().dpr(w) * 1.6; }); return sc; }); }
  };
  // what a confused one does on its turn (ai.js turn, battle.js heroTurn ask): true if the d10 took the turn
  M.confusedTurn = function* (B, u) {
    var c = u.conds.confused; if (!c) return false;
    if (c.gibber) return yield* gibberTurn(B, u); // (the gibbering mouther's babble, one turn of it: js/traits.js -- 10-06)
    if (M.zoneShut(B, c, u, 'is muddled')) return false; // (the Globe of Invulnerability: the Confusion was cast from outside it -- its turn is its own, nothing rolled)
    var r = D.d(10), T = u.turn;
    if (r >= 9) { B.card(['{g}' + Nm(B, u) + ' shakes clear for a moment (d10 ' + r + ').{/}'], 200); return false; }
    if (r === 1) {
      B.card(['{p}' + Nm(B, u) + ' wanders off, lost (d10 1).{/}'], 240);
      var rm = G.reach(u, T.move), ks = Object.keys(rm).filter(function (k) { return rm[k].stand; }), pick = ks.length ? rm[ks[D.rint(ks.length)]] : null;
      if (pick) yield* D.ai.walkTo(B, u, pick);
    } else if (r <= 6) { B.card(['{p}' + Nm(B, u) + ' stands and stares (d10 ' + r + ').{/}'], 240); yield 16; }
    else {
      var near = B.units.filter(function (w) { return w !== u && G.standing(w) && G.dist(u, w) <= G.reachOf(u); }), w = near[D.rint(Math.max(1, near.length))];
      B.card(['{p}' + Nm(B, u) + ' lashes out at random (d10 ' + r + ').{/}'], 240);
      if (w) { var atk = u.weapon || (u.attacks && u.attacks[Object.keys(u.attacks)[0]]); if (atk && typeof atk === 'object' && atk.name) yield* B.attack(u, w, atk); } else yield 16;
    }
    T.action = 0; T.bonus = 0; T.move = 0;
    return true;
  };
  // Gibbering (SRD 5.1 Gibbering Mouther): failed, "rolls a d8 to determine what it does during its turn. On a 1 to 4, the creature does nothing. On a 5 or 6, the creature
  // takes no action or bonus action and uses all its movement to move in a randomly determined direction. On a 7 or 8, the creature makes a melee attack against a randomly
  // determined creature within its reach or does nothing if it can't make such an attack" -- its reactions are gone till its next turn (js/traits.js laid both; 10-06)
  function* gibberTurn(B, u) {
    var r = D.d(8), T = u.turn; delete u.conds.confused;
    if (r <= 4) { B.card(['{p}' + Nm(B, u) + ' stands lost in the babble (d8 ' + r + '): nothing this turn.{/}'], 240); yield 16; }
    else if (r <= 6) {
      B.card(['{p}' + Nm(B, u) + ' lurches off at random (d8 ' + r + ').{/}'], 240);
      var rm = G.reach(u, T.move), ks = Object.keys(rm).filter(function (k) { return rm[k].stand && k !== u.x + ',' + u.y; }), pick = ks.length ? rm[ks[D.rint(ks.length)]] : null;
      if (pick) yield* D.ai.walkTo(B, u, pick); else yield 16;
    } else {
      var near = B.units.filter(function (w) { return w !== u && G.standing(w) && !w.object && G.dist(u, w) <= G.reachOf(u); }), w = near.length ? near[D.rint(near.length)] : null;
      var atk = u.weapon && !u.weapon.ranged ? u.weapon : (u.attacks && u.attacks[Object.keys(u.attacks).filter(function (k) { return !u.attacks[k].ranged; })[0]]);
      B.card(['{p}' + Nm(B, u) + ' lashes out at random (d8 ' + r + ')' + (w && atk ? ': at ' + Nm(B, w) + '.' : ', and there is no one in reach.') + '{/}'], 240);
      if (w && atk && typeof atk === 'object' && atk.name) yield* B.attack(u, w, atk); else yield 16;
    }
    T.action = 0; T.bonus = 0; T.move = 0;
    return true;
  }
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
    ai: function (B, u, e, slot, fs) { fs = unshut(B, u, e, fs); var t = fs.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0]; if (!t || (B.wards || []).some(function (w) { return w.by === u.id; })) return null; var at = null, bd = 1e9; for (var yy = t.y - 2; yy <= t.y + 2; yy++) for (var xx = t.x - 2; xx <= t.x + 2; xx++) { var s = G.map.at(xx, yy); if (!s || !s.open || !M.inRange(u, e.g, xx, yy)) continue; var dd = Math.hypot(xx - t.x, yy - t.y); if (dd < bd) { bd = dd; at = { x: xx, y: yy }; } } return at ? { score: fs.filter(function (w) { return Math.max(Math.abs(w.x - at.x), Math.abs(w.y - at.y)) * 5 <= 10; }).length * 12 + 4, t: at } : null; }
  };
  M.wardTurn = function (B, u) {
    (B.wards || []).forEach(function (wd) {
      var c = B.units.filter(function (w) { return w.id === wd.by; })[0];
      if (!c || wd.left <= 0 || !G.hostile(c, u) || u.hp <= 0 || u.dead || Math.max(Math.abs(u.x - wd.x), Math.abs(u.y - wd.y)) * 5 > 10) return;
      if (u.turn && u.turn['ward' + wd.x + ',' + wd.y]) return;
      if (u.turn) u.turn['ward' + wd.x + ',' + wd.y] = true;
      if (M.zoneShut(B, wd, u, 'comes within the guardian\'s reach')) return; // (the Globe of Invulnerability)
      var sv = RU.save(u, 'dex', wd.dc), n = Math.min(wd.left, sv.ok ? 10 : 20); wd.left -= n;
      B.card([Nm(B, u) + ' comes within the guardian\'s reach: DEX ' + RU.saveText(sv) + ' vs DC ' + wd.dc + '  {r}' + n + '{/} radiant' + (wd.left <= 0 ? '  {g}(the guardian is spent){/}' : '')], 300);
      B.hurt(u, n, 'radiant', MAGIC);
    });
    B.wards = (B.wards || []).filter(function (wd) { return wd.left > 0; });
  };
  E.phantasmalkiller = {
    summary: function () { return 'a creature within 120 ft · WIS or frightened by its worst fear, and at each of its turns\' end WIS or 4d10 psychic (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var dc = x.dc, hit = false;
      yield* saveAll(B, u, [t], 'wis', dc, null, '', false, head + ' on ' + nm(B, t), { against: 'frightened', failText: 'sees it', cond: function (w) { w.conds.frightened = { by: u.id }; w.conds.killer = { dc: dc, by: u.id, dice: more('4d10', up(x.sp, slot)) }; hit = true; } });
      if (hit) M.concentrate(B, u, 'phantasmalkiller', 'Phantasmal Killer', function () { if (t.conds.killer) { delete t.conds.killer; if (t.conds.frightened && t.conds.frightened.by === u.id) delete t.conds.frightened; } });
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t)) return; var pf = TX().pFail(t, 'wis', u.spellDC), sc = pf * (22 * Math.min(2.5, 1 / Math.max(0.3, 1 - pf)) * 0.6 + TX().dpr(t) * 0.3); if (!best || sc > best.score) best = { score: TX().worth(sc, t), t: t, keep: sc * 0.6 }; }); return best; }
  };
  E.resilientsphere = {
    summary: function () { return 'a creature within 30 ft · DEX (a foe) or sealed in a sphere of force: nothing in or out (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var go = t.side === u.side; if (!go) { var sv = RU.save(t, 'dex', x.dc, false, 'sealed'); B.card([head + ' on ' + nm(B, t) + ': DEX ' + RU.saveText(sv) + ' vs DC ' + x.dc + '  ' + (sv.ok ? '{n}rolls clear{/}' : '{p}SEALED IN{/}')], 300); go = !sv.ok; } else B.card([head + ': ' + t.name + ' sealed in shimmering force.']);
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
    cast: function* (B, u, t, slot, head, x) { var dc = x.dc; yield* spellAttack(B, u, t, x.sp, x.g, '0', { onHit: function (w) { if (RU.immuneTo(w, 'poisoned') || RU.immuneTo(w, 'diseased')) return; w.conds.poisoned = { contagion: true }; w.conds.contagion = { dc: dc, bad: 0, good: 0 }; B.card(['{o}' + Nm(B, w) + ' is sick with it: poisoned.{/}'], 240); } }); },
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
      list.forEach(function (w) { if (M.globed(B, u, w, 5)) { lines.push('  ' + Nm(B, w) + ': {c}inside the globe: untouched{/}'); return; } var sv = RU.save(w, 'dex', x.dc), k = sv.ok ? 0.5 : 1; lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{o}failed{/}')); hits.push([w, Math.floor(f.total * k), Math.floor(r.total * k)]); }); // (the Globe of Invulnerability: this one had no filter at all)
      B.card(lines.slice(0, 8), 420); yield { fx: 1 };
      hits.forEach(function (h) { B.hurtAll(h[0], [[h[1], 'fire'], [h[2], 'radiant']], MAGIC); }); // (one concentration save on the sum: B.hurtAll)
      yield 24;
    },
    ai: function (B, u, e, slot, fs) { return TX().bestArea(B, u, e, fs, function (caught) { return TX().areaWorth(B, u, Object.assign({}, e, { sp: Object.assign({}, e.sp, { dmg: '8d6', half: true, save: 'dex' }) }), 0, caught); }); }
  };
  // Greater Restoration (SRD 5.1): ends ONE of -- an effect that charmed or petrified (Flesh to Stone's stoning, begun or done), a curse, a
  // reduction of an ability score (Feeblemind, Ray of Enfeeblement), a reduction of the hit point maximum (Harm's cut; what the crawlers
  // took, which they took "for good") -- the worst on the creature, in that order. A disease is not its work (Lesser Restoration, Heal)
  function grAilment(t) {
    var c = t.conds;
    if (c.stoning) return 'stone';
    if (c.charmed || c.hypnotized) return 'charm';
    if (c.cursed || (c.disAt && c.disAt.why === 'cursed')) return 'curse';
    if (c.feeble || c.enfeebled) return 'drain';
    if (t.hpCut > 0 || t.drained > 0) return 'hpmax';
    return '';
  }
  function grEnd(B, t, k) {
    var c = t.conds, byId = function (id) { return B.units.filter(function (w) { return w.id === id; })[0]; }, sc;
    if (k === 'stone') {
      sc = byId(c.stoning.by); delete c.stoning;
      if (c.restrained && c.restrained.kind === 'stone') delete c.restrained;
      if (c.petrified) { delete c.petrified; t.anim = 'idle'; t.animT = B.t; } // (turned all the way to stone, and back: M.petrify)
      if (c.banished && c.banished.stone) { delete c.banished; t.ethereal = false; } // (the old record, from before 10-08)
      if (sc && sc.conc && sc.conc.id === 'fleshtostone') M.endConc(B, sc, 'it was undone');
      return 'the stone';
    }
    if (k === 'charm') {
      var dm = t.dominated, dby = dm && byId(dm.by), hy = c.hypnotized;
      if (dm) { if (dby && dby.conc && dby.conc.id === (dm.spell || 'dominatebeast')) M.endConc(B, dby, 'it was undone'); else freeDominated(B, t, dby || { id: dm.by }); }
      if (hy) { delete c.hypnotized; if (c.incapacitated && c.incapacitated.by === hy.by) delete c.incapacitated; } // (the pattern's trance: the charm, the stupor and the mark of it)
      delete c.charmed;
      return 'the charm';
    }
    if (k === 'curse') {
      sc = byId((c.cursed && c.cursed.by) || (c.disAt && c.disAt.id)); delete c.cursed; if (c.disAt && c.disAt.why === 'cursed') delete c.disAt;
      if (sc && sc.conc && sc.conc.id === 'bestowcurse') M.endConc(B, sc, 'it was lifted');
      return 'the curse';
    }
    if (k === 'drain') {
      if (c.feeble) { delete c.feeble; return 'the shattered mind'; }
      sc = byId(c.enfeebled.by); delete c.enfeebled;
      if (sc && sc.conc && sc.conc.id === 'rayofenfeeblement') M.endConc(B, sc, 'it was undone');
      return 'the enfeeblement';
    }
    var back = (t.hpCut || 0) + (t.drained || 0); t.maxhp += back; t.hpCut = 0; t.drained = 0;
    return 'the lost hit point maximum (+' + back + ')';
  }
  E.greaterrestoration = {
    summary: function () { return 'touch · ends one effect, the worst on them: the stoning Flesh to Stone began, a charm, a curse, a drain on strength or mind (Enfeeblement, Feeblemind), or a cut to the HP maximum (Harm)'; },
    cast: function* (B, u, t, slot, head) { var k = grAilment(t), what = k ? grEnd(B, t, k) : ''; FX.sparkle(t, 'gold', 16); B.card([head + ' on ' + t.name + ': ' + (what ? '{n}' + what + ' ended.{/}' : 'nothing to end.')]); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { var best = null; allies.forEach(function (w) { var k = (G.standing(w) || w.conds.petrified) && !w.dominated && G.dist(u, w) <= 5 + u.turn.move ? grAilment(w) : ''; if (!k) return; var sc = TX().dpr(w) * ({ stone: 4, charm: 2.5, curse: 2, drain: 2, hpmax: 0.4 })[k] + 1; if (!best || sc > best.score) best = { score: sc, t: w }; }); if (!best) return null; var t = best.t, from = G.dist(u, t) > 5 ? D.ai.approach(u, t, G.reach(u, u.turn.move), 5) : null; return { score: best.score, t: t, from: from }; }
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
  // ------------------------------------------------------------------ the summons (the druid to twelve, 09-30; Griz: "I like it. Build a frame
  // so that it's pulling those selections from a place where more to choose from might go as the world expands"): the caster picks the
  // creature from the pool (data/summons.js D.summonPool: the bestiary by type and CR), the count the most the spell allows of it; they
  // appear on free squares he can see nearest the point, within range; one initiative for the lot (SRD: "Roll initiative for the
  // summoned creatures as a group"); they fight under the AI as if commanded (RULED 09-30, the SRD's defend-only waived: ai.js brute);
  // each goes at 0 HP (battle.js sweep), all of them when his concentration ends
  function aiRunU(u) { return !!(u.guest || u.side !== 'party'); }
  function plural(name, n) {
    if (n === 1) return name;
    var up = name === name.toUpperCase(), s = function (x) { return up ? x.toUpperCase() : x; };
    if (/^swarm of /i.test(name)) return name.replace(/^(swarm)/i, function (m) { return m + s('s'); }); // (swarms of rats)
    if (/wolf$/i.test(name)) return name.replace(/f$/i, s('ves'));
    if (/(s|x|ch|sh)$/i.test(name)) return name + s('es');
    if (/[^aeiou]y$/i.test(name)) return name.replace(/y$/i, s('ies'));
    return name + s('s');
  }
  // a creature's worth to its side for a few rounds: its best blow (a hit six times in ten) times its blows, and its hit points as a wall
  function summonWorth(p) {
    var d = p.d, best = 0;
    Object.keys(d.attacks || {}).forEach(function (k) { var a = d.attacks[k]; best = Math.max(best, avg(a.dice) + (a.mod || 0)); });
    return p.n * (best * 0.6 * Math.max(1, d.multi || 1) + d.hp * 0.04);
  }
  function bestSummon(P) { var best = null; P.forEach(function (p) { if (!best || summonWorth(p) > summonWorth(best)) best = p; }); return best; }
  function* summon(B, u, id, pick, t, head) {
    var S = D.SUMMON[id], at = t && t.x != null ? t : u, d = pick.d, made = [], tag = id + '-' + u.id + '-' + B.t;
    var spots = [];
    for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) {
      var q = { x: x, y: y, size: d.size || 1, conds: {} };
      if (G.dist(u, q) > S.range || !G.losPoint(u.x, u.y, x, y) || !M.sees(B, u, q)) continue;
      spots.push({ x: x, y: y, k: Math.max(Math.abs(x - at.x), Math.abs(y - at.y)) + 0.01 * Math.hypot(x - at.x, y - at.y) });
    }
    spots.sort(function (a, b) { return a.k - b.k; });
    var roll = D.d(20);
    for (var i = 0; i < pick.n; i++) {
      var w = B.makeFoe({ id: tag + '-' + i, kind: pick.kind });
      var spot = null;
      for (var j = 0; j < spots.length && !spot; j++) if (G.canStand(w, spots[j].x, spots[j].y)) spot = spots.splice(j, 1)[0];
      if (!spot) break;
      w.x = spot.x; w.y = spot.y; w.side = u.side; w.guest = true; w.summon = { by: u.id, id: id, tag: tag };
      if (pick.n > 1) w.name = d.name + ' ' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(i % 26);
      w.anim = 'idle'; w.animT = B.t; w.flash = 0; w.reaction = 1; w.conds = w.conds || {}; w.facing = u.facing;
      w.initRoll = roll + (w.init || 0);
      B.units.push(w); made.push(w);
      FX.sparkle(w, 'moss', 12);
    }
    if (!made.length) { B.card([head + ': {o}no room he can see for them.{/}'], 240); return; }
    // one initiative for the lot, dealt in together
    // (Giant Insect's act on his turn -- SRD: dealt in right after him, on his roll)
    if (S.onTurn) made.forEach(function (w) { w.initRoll = u.initRoll || 0; });
    var k = 0; if (S.onTurn) k = B.order.indexOf(u) + 1; else while (k < B.order.length && (B.order[k].initRoll > made[0].initRoll || (B.order[k].initRoll === made[0].initRoll && B.order[k] === u))) k++;
    Array.prototype.splice.apply(B.order, [k, 0].concat(made));
    D.sfx('nature');
    var what = made.length + ' ' + plural(d.name.toLowerCase(), made.length);
    B.card([head + ': ' + what + (S.fixed ? (made.length === 1 ? ' swells' : ' swell') + ' to a giant\'s size, his to command.  {g}they act on his turn{/}' : (made.length === 1 ? ' steps' : ' step') + ' out of the air, his to command.  {g}initiative ' + made[0].initRoll + '{/}')], 320);
    M.concentrate(B, u, id, S.name, function () {
      var left = made.filter(function (w) { return !w.dead; });
      left.forEach(function (w) { FX.sparkle(w, 'moss', 10); w.dead = true; w.left = true; w.deadT = B.t; });
      if (left.length) B.card(['{g}The ' + plural(d.name.toLowerCase(), 2) + ' ' + (S.type === 'beast' ? 'go back to being spirits, and are gone' : 'are gone') + '.{/}'], 240);
    });
    yield 30;
  }
  function summonSpell(id) {
    return {
      list: function (B, u, e) { return D.summonPool(id, e.slot || e.level).length ? null : { why: 'nothing of its kind in the world to answer yet' }; },
      summary: function (e, u) {
        var S = D.SUMMON[id], P = D.summonPool(id, (e && e.slot) || (e && e.sp && e.sp.level) || 3);
        return (S.fixed ? 'insects near you made giant' : S.type === 'beast' ? 'fey spirits in beasts\' shapes' : 'fey creatures') + ' round a point within ' + S.range + ' ft (concentration): '
          + (P.length ? P.slice(0, 3).map(function (p) { return p.n + ' ' + plural(p.d.name.toLowerCase(), p.n); }).join(', ') + (P.length > 3 ? ', or another' : '') : 'none in the world yet')
          + '; they fight at your word, each gone at 0 HP';
      },
      cast: function* (B, u, t, slot, head) {
        var P = D.summonPool(id, slot);
        if (!P.length) { B.card([head + ': nothing answers.'], 200); yield 16; return; }
        var pick = aiRunU(u) ? bestSummon(P) : null;
        if (!pick) {
          var ch = yield { prompt: { who: u, title: u.name + ': ' + D.SUMMON[id].name.toUpperCase(), lines: ['What answers? The most the spell allows of each.'], opts: P.map(function (p, i) { return { label: p.n + ' ' + plural(p.d.name.toUpperCase(), p.n) + '  (CR ' + p.cr + ', ' + p.d.hp + ' HP, AC ' + p.d.ac + ')', value: i + 1 }; }) } };
          pick = P[Math.max(1, ch || 1) - 1];
        }
        yield* summon(B, u, id, pick, t, head);
      },
      // the AI calls them when a fight is on and he holds nothing better: to the foe nearest him (the free squares round it he can see)
      ai: function (B, u, e, slot, fs) {
        if (u.conc || !fs.length) return null;
        var P = D.summonPool(id, slot); if (!P.length) return null;
        var p = bestSummon(P), f = fs.filter(function (w) { return M.sees(B, u, w); }).sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
        if (!f) return null;
        var sc = summonWorth(p) * 2.5;
        return { score: sc, t: { x: f.x, y: f.y }, keep: sc * 0.5 };
      }
    };
  }
  E.conjureanimals = summonSpell('conjureanimals');
  E.conjurewoodlandbeings = summonSpell('conjurewoodlandbeings');
  // Cloudkill (SRD 5.1, 5th, concentration, ten minutes): a 20-ft-radius sphere of poisonous yellow-green fog at a point within 120 ft --
  // heavily obscured (B.darks, kind 'kill': nothing sees in, out or across it); CON or 5d8 poison (half) to one who enters it the first
  // time on a turn or starts a turn in it (+1d8 a slot above 5th); at the start of each of his turns it rolls 10 ft away from him; a
  // strong wind scatters it (Gust of Wind; a Wind Wall). The Underdark druid's circle spell at 9 (classes.js lands), the wizard's 5th
  E.cloudkill = {
    summary: function (e) { return '20-ft sphere of poison fog within 120 ft (concentration): nothing sees in, out or across it; entering it or starting a turn in it, CON or ' + more('5d8', Math.max(0, ((e && e.slot) || 5) - 5)) + ' poison (half); it rolls 10 ft away from you each of your turns'; },
    cast: function* (B, u, t, slot, head, x) {
      var rec = { by: u.id, sq: G.sphere(t.x, t.y, 20), kind: 'kill', dc: x.dc, dice: more('5d8', Math.max(0, slot - 5)), cx: t.x, cy: t.y };
      B.darks = (B.darks || []).concat([rec]); B.lightMap = null;
      FX.bloom(t.x, t.y, rec.sq, 'nature'); D.sfx('poison2'); // (the greens of FX.EL.nature: Stinking Cloud's burst is the acid's yellow-green, magic.js area -- 10-01, the two were the same moss)
      B.card([head + ': a yellow-green fog rolls out, 20 ft round -- {c}nothing sees in, out or across it{/}; CON DC ' + x.dc + ' or ' + rec.dice + ' poison to whoever enters it or starts a turn in it'], 300);
      M.concentrate(B, u, 'cloudkill', 'Cloudkill', function () { B.darks = (B.darks || []).filter(function (d) { return d !== rec; }); B.lightMap = null; B.card(['{g}The poison fog thins and is gone.{/}'], 240); });
      yield 24;
    },
    ai: function (B, u, e, slot, fs) {
      if (u.conc) return null;
      var d = avg(more('5d8', Math.max(0, slot - 5)));
      return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { if ((w.immune || []).indexOf('poison') >= 0) return; var pf = TX().pFail(w, 'con', u.spellDC), v = (pf * d + (1 - pf) * d / 2) * 2; sc += G.hostile(u, w) ? v : (w === u ? -v * 2 : -v * 1.3); }); return sc; });
    }
  };
  function killAt(B, u) { return (B.darks || []).filter(function (d) { return d.kind === 'kill' && G.foot(u).some(function (p) { return d.sq.some(function (q) { return q[0] === p[0] && q[1] === p[1]; }); }); }); }
  function killHurt(B, u, d, what) { if (M.zoneShut(B, d, u, what)) return; var sv = RU.save(u, 'con', d.dc, RU.vsPoison(u)), r = D.roll(d.dice), n = sv.ok ? Math.floor(r.total / 2) : r.total; B.card([Nm(B, u) + ' ' + what + ': CON ' + RU.saveText(sv) + ' vs DC ' + d.dc + '  ' + d.dice + ' = {r}' + n + '{/} poison'], 240); B.hurt(u, n, 'poison', MAGIC); }
  var onStartK = M.onStart;
  M.onStart = function (B, u) {
    onStartK(B, u);
    // his turn: each cloud of his rolls 10 ft away from him
    (B.darks || []).forEach(function (d) {
      if (d.kind !== 'kill' || d.by !== u.id) return;
      var dx = Math.sign(d.cx - u.x), dy = Math.sign(d.cy - u.y); if (!dx && !dy) dy = -1;
      var nx = d.cx + dx * 2, ny = d.cy + dy * 2; if (!G.map.at(nx, ny)) return;
      d.cx = nx; d.cy = ny; d.sq = G.sphere(nx, ny, 20); B.lightMap = null;
      B.card(['{g}The poison fog rolls on, away from ' + u.name + '.{/}'], 200);
    });
    if (u.hp <= 0 || u.dead) return;
    killAt(B, u).forEach(function (d) { if (u.hp > 0) killHurt(B, u, d, 'starts its turn in the poison fog'); });
  };
  var stepK = M.stepInto;
  M.stepInto = function (B, u) {
    var stop = stepK(B, u);
    if (u.hp > 0 && !u.dead && u.turn) killAt(B, u).forEach(function (d) { if (u.turn['kill' + d.by] || u.hp <= 0) return; u.turn['kill' + d.by] = true; killHurt(B, u, d, 'walks into the poison fog'); });
    return stop || u.hp <= 0;
  };
  E.giantinsect = summonSpell('giantinsect');
  // ------------------------------------------------------------------ shapes and charms (the druid to twelve, step 3 and 4, 09-30)
  // Polymorph (SRD 5.1, 4th, concentration): a creature he can see within 60 ft becomes a beast of its CR or less (a hero's or a class
  // NPC's: its level) -- a foe on a failed WIS save, an ally willingly. The beasts are the world's (data/summons.js D.pool: the same
  // place the summons draw from). Its hit points are the beast's, its own kept behind them (features.js F.morph, Battle.hurt's pool);
  // no spells; at the beast's 0 it comes back with the rest of the blow, and the spell is over
  function capOf(t) { return t.cls || t.side === 'party' || t.cr == null ? (t.lvl || 1) : D.crNum(t.cr); }
  function beastWorth(p) { var d = p.d, best = 0; Object.keys(d.attacks || {}).forEach(function (k) { var a = d.attacks[k]; best = Math.max(best, avg(a.dice) + (a.mod || 0)); }); return best * Math.max(1, d.multi || 1) + d.hp * 0.1; }
  E.polymorph = {
    summary: function (e, u) { var P = D.pool('beast'); return 'a creature you can see within 60 ft (concentration): a foe on a failed WIS, an ally willing -- a beast of its CR or less (the world has ' + P.length + ': ' + P.slice(0, 3).map(function (p) { return p.d.name.toLowerCase() + ' CR ' + p.cr; }).join(', ') + (P.length > 3 ? '...' : '') + '); the beast\'s hit points first, no spells'; },
    cast: function* (B, u, t, slot, head, x) {
      if (!t || t.hp <= 0 || t.dead) return;
      if (t.beast || t.shapechanger) { B.card([head + ': ' + nm(B, t) + (t.beast ? ' is in another shape already.' : ' is a shapechanger: it slides off.')], 220); yield 16; return; }
      var P = D.pool('beast', capOf(t)), foe = G.hostile(u, t);
      if (!P.length) { B.card([head + ': no beast in the world small enough for ' + nm(B, t) + '.'], 220); yield 16; return; }
      if (foe) { var sv = RU.save(t, 'wis', x.dc); B.card([head + ' on ' + nm(B, t) + ': WIS ' + RU.saveText(sv) + ' vs DC ' + x.dc + '  ' + (sv.ok ? '{n}it keeps its shape{/}' : '{o}it changes{/}')], 260); if (sv.ok) { yield 20; return; } }
      var ranked = P.slice().sort(function (a, b) { return beastWorth(a) - beastWorth(b); }), pick = null;
      if (u.guest || u.side !== 'party') pick = foe ? ranked[0] : ranked[ranked.length - 1];
      else {
        var list = foe ? ranked : ranked.slice().reverse();
        var ch = yield { prompt: { who: u, title: u.name + ': POLYMORPH', lines: [foe ? 'What does it become? (the weakest first)' : 'What does ' + t.name + ' become? (the strongest first)'], opts: list.map(function (p, i) { return { label: p.d.name.toUpperCase() + '  (CR ' + p.cr + ', ' + p.d.hp + ' HP, AC ' + p.d.ac + ')', value: i + 1 }; }) } };
        pick = list[Math.max(1, ch || 1) - 1];
      }
      D.features.morph(B, t, pick.kind, u);
      FX.sparkle(t, 'moss', 20); D.sfx('magic2');
      B.card(['{y}' + Nm(B, t) + '{/} is ' + (/^[aeiou]/i.test(pick.d.name) ? 'an ' : 'a ') + pick.d.name.toLowerCase() + ' now  {g}(' + pick.d.hp + ' HP of its own, AC ' + pick.d.ac + '){/}'], 300);
      M.concentrate(B, u, 'polymorph', 'Polymorph', function () { if (t.beast && t.beast.morph && t.beast.morph.by === u.id) D.features.unshape(B, t, 0, true); });
      u.conc.t = t;
      yield 24;
    },
    // the AI makes the most dangerous foe it can see a harmless beast
    ai: function (B, u, e, slot, fs) {
      if (u.conc) return null;
      var best = null;
      fs.forEach(function (f) {
        if (f.beast || f.hp <= 0 || G.dist(u, f) > 60 || !M.sees(B, u, f)) return;
        var P = D.pool('beast', capOf(f)); if (!P.length) return;
        var low = P.slice().sort(function (a, b) { return beastWorth(a) - beastWorth(b); })[0];
        var sc = TX().pFail(f, 'wis', u.spellDC) * Math.max(0, TX().dpr(f) - beastWorth(low) * 0.5) * 3;
        if (sc > 0 && (!best || sc > best.score)) best = { score: sc, t: f, keep: sc * 0.6 };
      });
      return best;
    }
  };
  // Dominate Beast (SRD 5.1, 4th, concentration): a beast he can see within 60 ft, WIS with advantage (it is being fought: always, here)
  // or it fights for his side till the spell ends; each time it is hurt, WIS again, and a success frees it (M.onHurt below)
  // Dominate Person (SRD 5.1, 5th, concentration; 10-06, the grid's rules §2.7 -- it had waited on "control": the dominated fight on their own wits, as the beast does, the
  // commanding not built for either): the same for a humanoid -- one of the party too, who goes over to the caster's side and is run by the class AI till it is free (the
  // spirit naga's two 5th-level slots, its SRD list). `dominated.spell` carries which, so a dispel or a save ends the right concentration
  function dominate(id, name, test, what) {
    return {
      summary: function () { return what + ' you can see within 60 ft (concentration) · WIS, with advantage (it is being fought) -- failed, it fights for you; each time it is hurt it saves again'; },
      cast: function* (B, u, t, slot, head, x) {
        if (!t || t.hp <= 0 || !test(t)) { B.card([head + ': ' + (t ? nm(B, t) : 'that') + ' is not ' + what + '.'], 200); yield 16; return; }
        if (RU.immuneTo(t, 'charmed', u)) { B.card([head + ': ' + nm(B, t) + ' is proof against it.'], 200); yield 16; return; }
        var sv = RU.save(t, 'wis', x.dc, G.hostile(u, t), 'charmed');
        B.card([head + ' on ' + nm(B, t) + ': WIS ' + RU.saveText(sv) + ' vs DC ' + x.dc + '  ' + (sv.ok ? '{n}' + (id === 'dominatebeast' ? 'it shakes him off' : 'shakes it off') + '{/}' : '{o}' + (id === 'dominatebeast' ? 'it is his' : 'goes over to ' + (u.side === 'foe' ? 'the ' + B.shortName(u) : u.name)) + '{/}')], 260);
        if (sv.ok) { yield 20; return; }
        t.dominated = { by: u.id, side0: t.side, guest0: t.guest, classAI0: t.classAI, dc: x.dc, spell: id };
        t.side = u.side; t.guest = true; t.conds.charmed = { by: u.id, dominated: true };
        if (t.cls) t.classAI = true; // (one of a class -- a hero, a class NPC -- fights by its class's own tactics, its blade and its spells, for its new side: ai.js turn)
        FX.sparkle(t, 'violet', 18); D.sfx('charm');
        M.concentrate(B, u, id, name, function () { freeDominated(B, t, u); });
        u.conc.t = t;
        yield 24;
      },
      ai: function (B, u, e, slot, fs) {
        if (u.conc) return null;
        var best = null;
        fs.forEach(function (f) {
          if (!test(f) || f.hp <= 0 || f.dominated || G.dist(u, f) > 60 || !M.sees(B, u, f) || RU.immuneTo(f, 'charmed', u)) return;
          var pf = TX().pFail(f, 'wis', u.spellDC); pf = pf * pf; // (advantage)
          var sc = pf * TX().dpr(f) * 3 * 2 + pf * f.hp * 0.1;
          if (sc > 0 && (!best || sc > best.score)) best = { score: sc, t: f, keep: sc * 0.6 };
        });
        return best;
      }
    };
  }
  E.dominatebeast = dominate('dominatebeast', 'Dominate Beast', function (t) { return t.type === 'beast'; }, 'a beast');
  E.dominateperson = dominate('dominateperson', 'Dominate Person', function (t) { return !t.beast && M.humanoid(t); }, 'a humanoid');
  function freeDominated(B, t, u) {
    if (!t.dominated || t.dominated.by !== u.id) return;
    t.side = t.dominated.side0; t.guest = t.dominated.guest0; if (t.cls) t.classAI = t.dominated.classAI0; delete t.dominated;
    if (t.conds.charmed && t.conds.charmed.dominated) delete t.conds.charmed;
    if (t.hp > 0 && !t.dead) B.card(['{g}' + Nm(B, t) + ' is its own again.{/}'], 240);
  }
  // Charm Person and Animal Friendship (SRD 5.1, 1st): WIS or charmed by him -- it will not strike or target him (ai.js heroes), and the
  // charm breaks when he or his companions harm it (M.onHurt below). Charm Person: a humanoid, the save with advantage (it is being fought).
  // Animal Friendship: a beast of INT 3 or less
  function charmSpell(id, what, test, adv) {
    return {
      summary: function () { return what + ' you can see within ' + (id === 'charmperson' ? 30 : 30) + ' ft · WIS' + (adv ? ', with advantage (it is being fought)' : '') + ' or charmed: it will not strike or target you; harm from you or yours breaks it'; },
      cast: function* (B, u, t, slot, head, x) {
        if (!t || t.hp <= 0 || !test(t)) { B.card([head + ': ' + (t ? nm(B, t) : 'that') + ' is not ' + what + '.'], 200); yield 16; return; }
        if (RU.immuneTo(t, 'charmed', u)) { B.card([head + ': ' + nm(B, t) + ' is proof against it.'], 200); yield 16; return; }
        var sv = RU.save(t, 'wis', x.dc, adv && G.hostile(u, t), 'charmed');
        B.card([head + ' on ' + nm(B, t) + ': WIS ' + RU.saveText(sv) + ' vs DC ' + x.dc + '  ' + (sv.ok ? '{n}saved{/}' : '{o}charmed{/}: it will not raise a hand to ' + u.name)], 260);
        if (!sv.ok) { t.conds.charmed = { by: u.id, breaks: true }; FX.sparkle(t, 'violet', 14); D.sfx('charm'); }
        yield 20;
      },
      // the AI charms the foe standing over it (the one it would most like not to be hit by)
      ai: function (B, u, e, slot, fs) {
        var best = null;
        fs.forEach(function (f) {
          if (!test(f) || f.conds.charmed || G.dist(u, f) > 30 || G.dist(u, f) > 5 + (f.speed || 30) || !M.sees(B, u, f) || RU.immuneTo(f, 'charmed', u)) return;
          var pf = TX().pFail(f, 'wis', u.spellDC); if (adv) pf = pf * pf;
          var sc = pf * TX().dpr(f) * 1.5;
          if (sc > 0 && (!best || sc > best.score)) best = { score: sc, t: f };
        });
        return best;
      }
    };
  }
  E.charmperson = charmSpell('charmperson', 'a humanoid', function (t) { return M.humanoid(t); }, true);
  E.animalfriendship = charmSpell('animalfriendship', 'a beast of little wit', function (t) { return t.type === 'beast' && (t.abil ? t.abil.int : 10) <= 3; }, false);
  // hurt: a dominated beast saves again (a success frees it); a charm breaks on harm from the charmer's side (the one whose turn it is)
  var onHurtC = M.onHurt;
  M.onHurt = function (B, u, n, type) {
    if (onHurtC) onHurtC(B, u, n, type);
    if (!n || u.hp <= 0) return;
    var dm = u.dominated;
    if (dm) {
      var by = B.units.filter(function (w) { return w.id === dm.by; })[0], sv = RU.save(u, 'wis', dm.dc);
      B.card([Nm(B, u) + ', hurt, fights the domination: WIS ' + RU.saveText(sv) + ' vs DC ' + dm.dc + '  ' + (sv.ok ? '{n}FREE{/}' : '{o}still his{/}')], 220);
      if (sv.ok && by && by.conc && by.conc.id === (dm.spell || 'dominatebeast')) M.endConc(B, by, 'it broke free'); else if (sv.ok) freeDominated(B, u, by || { id: dm.by });
    }
    var ch = u.conds.charmed;
    if (ch && ch.breaks && B.active) { var cb = B.units.filter(function (w) { return w.id === ch.by; })[0]; if (cb && B.active.side === cb.side) { delete u.conds.charmed; B.card(['{g}The charm on ' + nm(B, u) + ' breaks.{/}'], 200); } }
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
      if (M.zoneShut(B, g, u, 'starts its turn in the tentacles')) return; // (the Globe of Invulnerability)
      var r = u.conds.restrained;
      if (r && r.kind === 'tentacles') { var d0 = D.roll('3d6'); B.card([Nm(B, u) + ' is crushed by the tentacles  3d6 = {r}' + d0.total + '{/}'], 240); B.hurt(u, d0.total, 'bludgeoning', MAGIC); }
      else if (!RU.immuneTo(u, 'restrained')) { var sv = RU.save(u, 'dex', g.dc); B.card([Nm(B, u) + ' in the tentacles: DEX ' + RU.saveText(sv) + ' vs DC ' + g.dc + '  ' + (sv.ok ? '{n}slips them{/}' : '{o}seized{/}')], 240); if (!sv.ok) { var d1 = D.roll('3d6'); B.hurt(u, d1.total, 'bludgeoning', MAGIC); if (u.hp > 0) u.conds.restrained = { dc: g.dc, by: g.by, kind: 'tentacles' }; } }
    });
  };
  var onEndD = M.onEnd;
  M.onEnd = function (B, u) {
    onEndD(B, u);
    // Phantasmal Killer: the fear's bite at a turn's end
    var k = u.conds.killer;
    // (the Globe of Invulnerability: the phantom was cast from outside it -- neither the bite nor the save that ends it happens in there)
    if (k && u.hp > 0 && !M.zoneShut(B, k, u, 'faces the phantom')) { var sv = RU.save(u, 'wis', k.dc, false, 'frightened'); if (sv.ok) { delete u.conds.killer; if (u.conds.frightened && u.conds.frightened.by === k.by) delete u.conds.frightened; B.card([Nm(B, u) + ' faces the phantom down: WIS ' + RU.saveText(sv) + '  {n}IT BREAKS{/}'], 240); var by = B.units.filter(function (w) { return w.id === k.by; })[0]; if (by && by.conc && by.conc.id === 'phantasmalkiller') delete by.conc; } else { var r = D.roll(k.dice); B.card([Nm(B, u) + ' and the phantom: WIS ' + RU.saveText(sv) + '  {r}' + r.total + '{/} psychic'], 240); B.hurt(u, r.total, 'psychic', MAGIC); } }
    // Contagion: three failed CON saves and it takes hold (the blinding sickness, for the fight); three saved and it is gone
    var ct = u.conds.contagion;
    // (the Globe of Invulnerability: no save is rolled in there, and the disease neither gains nor loses ground)
    if (ct && u.hp > 0 && !ct.held && !M.zoneShut(B, ct, u, 'fights the disease')) { var s2 = RU.save(u, 'con', ct.dc); if (s2.ok) ct.good++; else ct.bad++; B.card([Nm(B, u) + ' fights the disease: CON ' + RU.saveText(s2) + '  ' + ct.bad + ' failed, ' + ct.good + ' saved'], 200); if (ct.good >= 3) { delete u.conds.contagion; if (u.conds.poisoned && u.conds.poisoned.contagion) delete u.conds.poisoned; } else if (ct.bad >= 3) { ct.held = true; u.conds.blinded = { by: 'contagion' }; B.card(['{o}The sickness takes ' + Nm(B, u) + '\'s sight.{/}'], 240); } }
    // Insect Plague: ending a turn in the locusts
    (M.groundAt(B, u.x, u.y) || []).forEach(function (g) { if (g.kind !== 'insects' || u.hp <= 0 || M.zoneShut(B, g, u, 'ends its turn in the locusts')) return; var sv3 = RU.save(u, 'con', g.dc), r3 = D.roll(g.dice), n3 = sv3.ok ? Math.floor(r3.total / 2) : r3.total; B.card([Nm(B, u) + ' in the locusts: CON ' + RU.saveText(sv3) + '  {r}' + n3 + '{/} piercing'], 200); B.hurt(u, n3, 'piercing', MAGIC); });
  };
  var stepD = M.stepInto;
  M.stepInto = function (B, u) {
    var stop = stepD(B, u);
    M.wardTurn(B, u);
    (M.groundAt(B, u.x, u.y) || []).forEach(function (g) {
      if (u.hp <= 0 || u.dead || !u.turn) return;
      if (g.kind === 'insects' && !u.turn['bugs' + g.by]) { u.turn['bugs' + g.by] = true; if (M.zoneShut(B, g, u, 'walks into the locusts')) return; var sv = RU.save(u, 'con', g.dc), r = D.roll(g.dice), n = sv.ok ? Math.floor(r.total / 2) : r.total; B.card([Nm(B, u) + ' walks into the locusts: CON ' + RU.saveText(sv) + '  {r}' + n + '{/} piercing'], 200); B.hurt(u, n, 'piercing', MAGIC); }
      if (g.kind === 'tentacles' && !u.turn['tent' + g.by] && !(u.conds.restrained && u.conds.restrained.kind === 'tentacles') && !RU.immuneTo(u, 'restrained')) { u.turn['tent' + g.by] = true; if (M.zoneShut(B, g, u, 'steps into the tentacles')) return; var s2 = RU.save(u, 'dex', g.dc); B.card([Nm(B, u) + ' steps into the tentacles: DEX ' + RU.saveText(s2) + '  ' + (s2.ok ? '{n}slips them{/}' : '{o}seized{/}')], 240); if (!s2.ok) { var d2 = D.roll('3d6'); B.hurt(u, d2.total, 'bludgeoning', MAGIC); if (u.hp > 0) u.conds.restrained = { dc: g.dc, by: g.by, kind: 'tentacles' }; stop = true; } }
    });
    return stop || u.hp <= 0;
  };

  // ------------------------------------------------------------------ 6th to 9th level (09-28, batch E): no hero or class NPC reaches them (the cap is 9; the druid 12 casts 6ths: Heal, Sunbeam);
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
        var sq = M.area(u, x.g, t.x, t.y), list = caughtIn(B, sq); // (those inside a Globe of Invulnerability stay in the list: saveAll says "inside the globe: untouched" for each, where a filter here left "no one in it" -- and uses the spell's level, not the slot)
        FX.bloom(/cone|line/.test(x.g.shape) ? u.x : t.x, /cone|line/.test(x.g.shape) ? u.y : t.y, sq, ramp);
        yield* saveAll(B, u, list, ab, x.dc, o.up ? more(dexpr, up(x.sp, slot) * o.up) : dexpr, type, half, head, { cond: o.cond ? function (w) { o.cond(B, u, w, x); } : null, skip: o.skip, against: o.against });
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
      var r = D.roll('14d6'), sv = RU.save(t, 'con', x.dc, false, null, r.total), n = sv.ok ? Math.floor(r.total / 2) : r.total; n = Math.min(n, Math.max(0, t.hp - 1));
      FX.sparkle(t, 'violet', 20); B.card([head + ' on ' + nm(B, t) + '  14d6 = ' + r.total + '  CON ' + RU.saveText(sv) + ' vs DC ' + x.dc + '  -> {r}' + n + '{/} necrotic' + (sv.ok ? '' : '  {o}its strength hollowed{/}')], 360);
      B.hurt(t, n, 'necrotic', MAGIC); if (!sv.ok && t.hp > 0) { var mx0 = t.maxhp; t.maxhp = Math.max(1, mx0 - n); t.hpCut = (t.hpCut || 0) + (mx0 - t.maxhp); } // (hpCut: what Greater Restoration gives back)
      yield 24;
    },
    ai: function (B, u, e, slot, fs) { var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t)) return; var sc = Math.min(t.hp - 1, 40) * 1.2; if (!best || sc > best.score) best = { score: sc, t: t }; }); return best; }
  };
  E.heal = {
    summary: function (e) { return 'an ally within 60 ft · ' + (70 + 10 * Math.max(0, e.slot - 6)) + ' HP back, and blindness, deafness and disease ended'; },
    cast: function* (B, u, t, slot, head, x) { var n = 70 + 10 * up(x.sp, slot), got = B.heal(t, n), sick = cureSick(t); FX.sparkle(t, 'gold', 24); B.card([head + ' on ' + t.name + ': {n}+' + got + '{/}' + (sick.length ? '  {c}' + sick.join(', ') + ' ended{/}' : '')]); yield 20; },
    ai: function (B, u, e, slot, fs, allies) { var best = null; allies.forEach(function (w) { if (w.dead || !M.targetOK(B, u, e.g, w)) return; var need = TX().healNeed(B, u, w); if (!need) return; var sc = Math.min(70, w.maxhp - Math.max(0, w.hp)) * need + (w.hp <= 0 ? TX().dpr(w) * 2.5 : 0); if (!best || sc > best.score) best = { score: sc, t: w }; }); return best; }
  };
  // Eyebite (SRD 5.1): each action, one creature within 60 ft: WIS or asleep, panicked (it runs), or sickened (disadvantage) (concentration)
  // (what the gaze laid is tagged `eyebite` and its caster's; the minute's end -- or the caster's concentration lost -- lifts every one)
  function eyebiteLift(B, u) {
    B.units.forEach(function (w) { ['asleep', 'frightened', 'feared', 'sickened'].forEach(function (k) { var c = w.conds[k]; if (c && c.eyebite && c.by === u.id) delete w.conds[k]; }); });
  }
  E.eyebite = {
    geo: function (B, u, g) { return u.conc && u.conc.id === 'eyebite' ? Object.assign({}, g, { free: true, again: true }) : null; },
    summary: function (e) { return (e.g.again ? 'your eyes again: ' : 'your eyes go black (concentration); each action, ') + 'a creature within 60 ft that has not already saved against it, WIS or asleep (wakes if hurt), panicked (runs from you till 60 ft off and out of sight), or sickened (disadvantage on attacks and checks; WIS at each turn end); all lift when you let go'; },
    cast: function* (B, u, t, slot, head, x) {
      if (!x.g.again) M.concentrate(B, u, 'eyebite', 'Eyebite', function () { eyebiteLift(B, u); });
      // (SRD: "can't target a creature again if it has succeeded on a saving throw against this casting")
      var saved = u.conc && u.conc.id === 'eyebite' ? (u.conc.saved = u.conc.saved || {}) : {};
      if (saved[t.id]) { B.card([head + ': ' + nm(B, t) + ' has already turned the gaze, and cannot be chosen again.'], 200); yield 16; return; }
      var dc = x.dc, sleeps = !RU.immuneTo(t, 'asleep') && !t.fey;
      var how = sleeps && t.hp > 30 && TX().dpr(t) > 10 ? 'asleep' : G.dist(u, t) <= 10 ? 'panicked' : 'sickened';
      var failed = yield* saveAll(B, u, [t], 'wis', dc, null, '', false, head + ' on ' + nm(B, t), { against: how === 'panicked' ? 'frightened' : null, failText: how, cond: function (w) {
        if (how === 'asleep') M.fallAsleep(B, w, { by: u.id, eyebite: true }); // (prone, the light set down: magic.js, 10-01c)
        else if (how === 'panicked') { w.conds.frightened = { by: u.id, eyebite: true }; w.conds.feared = { by: u.id, eyebite: true }; }
        else w.conds.sickened = { by: u.id, dc: dc, eyebite: true };
      } });
      if (failed.indexOf(t) < 0) saved[t.id] = 1;
    },
    ai: function (B, u, e, slot, fs) { var best = null, saved = (u.conc && u.conc.id === 'eyebite' && u.conc.saved) || {}; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t) || t.conds.asleep || saved[t.id]) return; var sc = TX().pFail(t, 'wis', u.spellDC) * TX().dpr(t) * 1.6 * (e.g.again ? 1 : 1.8); if (!best || sc > best.score) best = { score: sc, t: t, keep: 8 }; }); return best; }
  };
  // Flesh to Stone (SRD 5.1): CON or restrained; each of its turns' ends a CON save -- three failed, stone (petrified, M.petrify: out of the fight); three saved, free
  // PETRIFIED (SRD 5.1, the condition -- the grid's rules §2.7, 10-08, the lanes window's order: the rules before the monsters that lay them, the basilisk among the bestiary's
  // eleven): turned to stone where it stands, a statue on its square (no longer the ethereal ghost Flesh to Stone left): incapacitated, no move, unaware; attacks at it with
  // advantage; STR and DEX saves failed; resistance to all damage; immune to poison and disease (js/rules.js, battle.js hurt). Out of the fight (grid.js G.standing): no
  // one's target, and a side all stone has lost. Until Greater Restoration. `o.by` the one who laid it
  M.petrify = function (B, u, o) {
    o = o || {};
    if (RU.immuneTo(u, 'petrified')) return false;
    var st = u.conds.stoning; if (st) st.done = true; else u.conds.stoning = { by: o.by || null, done: true, dc: 0, bad: 0, good: 0 };
    if (u.conds.restrained && u.conds.restrained.kind === 'stone') delete u.conds.restrained;
    u.conds.petrified = { by: o.by || null };
    delete u.conds.dodge; delete u.conds.hidden;
    if (u.conc) M.endConc(B, u, 'turned to stone'); // (incapacitated: concentration ends, SRD 5.1)
    if (u.ready) delete u.ready;
    u.anim = 'idle'; u.animT = B.t;
    B.card(['{o}' + Nm(B, u) + ' is stone.{/}'], 300);
    return true;
  };
  // the monsters' stoning (SRD 5.1: the basilisk's Petrifying Gaze, the cockatrice's bite, the gorgon's breath, the medusa's gaze): a failed CON save, and it "begins to turn to stone
  // and is restrained"; the save again at the end of its NEXT turn -- a success ends it, a failure petrifies (`once`: one save, M.onEnd). `o`: { dc, by }. A failure by 5 or more
  // that petrifies at once (the medusa) is the caller's: M.petrify
  M.stoneBegin = function (B, u, o) {
    if (RU.immuneTo(u, 'petrified') || u.conds.petrified || u.conds.stoning) return false;
    u.conds.restrained = { dc: 99, by: o.by || null, kind: 'stone' };
    u.conds.stoning = { dc: o.dc, by: o.by || null, bad: 0, good: 0, once: true, skip: B.active === u };
    FX.sparkle(u, 'stone', 12);
    return true;
  };
  E.fleshtostone = {
    summary: function () { return 'a creature within 60 ft · CON or restrained, turning to stone: three failed saves and it is stone (concentration)'; },
    cast: function* (B, u, t, slot, head, x) { var hit = false; yield* saveAll(B, u, [t], 'con', x.dc, null, '', false, head + ' on ' + nm(B, t), { skip: function (w) { return RU.immuneTo(w, 'petrified') ? 'stone will not take it' : ''; }, failText: 'stiffening', cond: function (w) { w.conds.restrained = { dc: 99, by: u.id, kind: 'stone' }; w.conds.stoning = { dc: x.dc, by: u.id, bad: 0, good: 0 }; hit = true; } }); if (hit) M.concentrate(B, u, 'fleshtostone', 'Flesh to Stone', function () { if (t.conds.stoning && !t.conds.stoning.done) { delete t.conds.stoning; if (t.conds.restrained && t.conds.restrained.kind === 'stone') delete t.conds.restrained; } }); },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var best = null; fs.forEach(function (t) { if (!M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), t)) return; var sc = TX().pFail(t, 'con', u.spellDC) * (TX().dpr(t) * 2 + t.hp * 0.3); if (!best || sc > best.score) best = { score: sc, t: t, keep: sc * 0.7 }; }); return best; }
  };
  // Globe of Invulnerability (SRD 5.1): a 10-ft globe about the caster; a spell of 5th level or lower cast from outside does nothing to those in it
  E.globeofinvulnerability = {
    summary: function (e) { return 'a 10-ft globe swelling out from where you stand, fixed there · a spell of ' + (5 + Math.max(0, (e.slot || 6) - 6)) + 'th level or lower, even cast from a higher slot, does nothing to those inside, cast from outside it or before the globe rose -- a spell already on one inside (a hold, a fear, a blessing, Mage Armor) lies idle there, and takes hold again outside if it still lasts; a save, an attack roll, a dart, a touch, a cantrip -- and what it leaves behind: the ground, the clouds, the webs and the walls, and what it left on a creature that has since stepped in (a phantom\'s bite, the acid\'s second, a disease, a curse\'s or a mark\'s extra die, the stone, a word of command, Fear\'s run, Confusion\'s turn) do nothing to those inside, and the places they make are no part of the globe\'s squares (no difficult ground, no wall, no fog or darkness over them, no Daylight on them); a spell used again (the next bolt, the next swing) is cast from where it was first cast, however far its caster has walked (concentration)'; },
    // (10-01c, Griz: "If the visual of the globe of invulnerability starts from it's center and expands outward to its full size - everything cast from outside of it
    // gets cleared" ... "correction - the location targeted not the wizard as above. Build it."): the globe swells out from the square it was cast on -- the caster's,
    // the SRD's "Self (10-foot radius)", and fixed there however the caster walks after -- and as its edge passes a creature, what was cast on it from outside (or
    // before the globe rose) lies idle: M.globeSync, each frame of the swell. Each globe is numbered (`n`): a spell cast while it stands, by one inside it, carries the
    // number (B.castFrom.gin, the M.cast wrapper below) and is "cast from inside" that globe wherever its target goes after
    cast: function* (B, u, t, slot, head) {
      B.globeN = (B.globeN || 0) + 1;
      var rec = { by: u.id, x: u.x, y: u.y, max: 5 + up({ level: 6 }, slot), n: B.globeN, grow: 0 };
      B.globes = (B.globes || []).concat([rec]);
      M.concentrate(B, u, 'globeofinvulnerability', 'Globe of Invulnerability', function () { B.globes = (B.globes || []).filter(function (g) { return g !== rec; }); (B.globesGone = B.globesGone || []).push({ x: rec.x, y: rec.y, t0: B.t }); }); // (globesGone: the pop it goes out with -- looks.js)
      B.card([head + ': a shimmering globe swells out from where ' + u.name + ' stands (concentration).']);
      D.sfx && D.sfx('magic');
      for (var f = 1; f <= GROW; f++) { rec.grow = f / GROW; M.globeSync(B); yield 1; }
      delete rec.grow; M.globeSync(B);
      yield 12;
    },
    // worth it against casters on the other side (as before), and for what it would lift off its own side standing about it -- a hold, a charm, a fear cast from
    // outside -- less what it would lift off theirs, and less its own side's buffs it would still the same way (10-01c)
    ai: function (B, u, e, slot, fs) {
      if (u.conc) return null;
      var casters = fs.filter(function (w) { return (w.known || []).length && (w.slots || []).some(function (n) { return n > 0; }); });
      var probe = { by: u.id, x: u.x, y: u.y, max: 5 + Math.max(0, (slot || 6) - 6), n: -1 }, gs = B.globes, lift = 0;
      B.globes = (gs || []).concat([probe]);
      try {
        B.units.forEach(function (w) {
          if (!G.present(w) || w.hp <= 0 || !w.conds) return;
          var v = 0; Object.keys(w.conds).forEach(function (k) { var r = w.conds[k]; if (r == null || r === false || !idleRec(B, w, k, r)) return; v += DISABLES[k] ? TX().dpr(w) * 2 + 6 : HARMS[k] ? 4 : -2; });
          if (v) lift += G.hostile(u, w) ? -v : v;
        });
      } finally { B.globes = gs; }
      var sc = casters.length * 10 + lift;
      return sc > 0 ? { score: sc, t: u } : null;
    }
  };
  // what the barrier counts is the spell's own level, not the slot it was cast with (SRD 5.1: "even if the spell is cast using a higher level spell
  // slot"): the cast's level, B.castLevel, set by the M.cast wrapper just below; `level` is for a caller outside a cast (a reaction) or one that
  // knows no better (a spell that still passes its slot -- js/walls.js -- is read as the cast's); with neither it is taken as 5th
  // the globe's ground: the 5 x 5 squares about the square it was cast on; a creature is inside when a square it fills is (a Large one straddling the edge is in
  // it -- the runner's corner test, 10-01b, read the origin square alone); while it swells (`grow`), only the squares its edge has passed. "Cast from outside":
  // a spell carries the numbers of the globes its caster stood inside when it was cast (`gin`, stamped by the M.cast wrapper) -- one cast before a globe rose is
  // cast from outside it, wherever its caster stood (10-01c, Griz: "everything cast before the globe has a 'where' of 'outside'"); a `from` with no numbers (a
  // creature acting now, a bare square) is inside a globe it stands in now
  var GROW = 36, GR = 2.9; // (the frames the swell takes; the drawn radius in squares -- looks.js drawGlobe)
  M.globeR = function (g) { var k = g.grow == null ? 1 : g.grow; return GR * (1 - (1 - k) * (1 - k)); }; // (eased out: quick, then settling)
  function sqIn(g, x, y) { return Math.max(Math.abs(x - g.x), Math.abs(y - g.y)) <= 2 && (g.grow == null || Math.hypot(x - g.x, y - g.y) <= M.globeR(g)); }
  function inGlobe(g, z) { var s = z.size || 1; for (var j = 0; j < s; j++) for (var i = 0; i < s; i++) if (sqIn(g, z.x + i, z.y + j)) return true; return false; }
  function castIn(g, from) { return from.gin ? from.gin.indexOf(g.n) >= 0 : inGlobe(g, from); }
  function globeShuts(B, from, w, lv) {
    return (B.globes || []).some(function (g) { return lv <= g.max && inGlobe(g, w) && !castIn(g, from); });
  }
  // the globes a spell cast now, by z standing where it stands, is cast inside of (a globe still swelling holds no one's casting yet)
  M.ginOf = function (B, z) { return (B.globes || []).filter(function (g) { return g.grow == null && inGlobe(g, z); }).map(function (g) { return g.n; }); };
  // "cast from outside the barrier": from where the caster stood when it was cast, not from where it is now. While a cast of the caster's is under way, B.castFrom says
  // (the wrapper below: the square it stood on -- or, for a spell used again, where the spell was FIRST cast); outside a cast, the caster's own square (a reaction, a
  // monster's own attack, the AI weighing a plan). `caster` may be a bare { x, y, id } -- M.castOrigin makes one
  M.globed = function (B, caster, w, level) {
    var lv = B && B.castLevel != null ? B.castLevel : level != null ? level : 5;
    return globeShuts(B, B && B.castFrom && B.castBy === caster.id ? B.castFrom : caster, w, lv);
  };
  // where the spell u holds was first cast from, for the cast that uses it again (g.free -- no slot: Call Lightning's next bolt, Sunbeam, Moonbeam moved, Flaming Sphere
  // rolled, Heat Metal's flare, Vampiric Touch, Eyebite, Flame Blade's swing, the Spiritual Weapon's and the Arcane Sword's swings, a Hunter's Mark moved -- M.geo stamps the
  // spell's id on its geometry as `sid`). SRD 5.1: "Any spell of 5th level or lower cast from outside the barrier" -- it was cast once, and from there; a caster who has walked
  // inside the globe since still casts it from outside (10-01, "risk of forgetting too high, let's fix it now"). The record: the concentration's, or the floating weapon's,
  // stamped by the wrapper below. u itself when none is
  M.castOrigin = function (B, u, g) {
    if (!B || !g || !g.free || !g.sid) return u;
    var rec = u.conc && u.conc.id === g.sid && u.conc.from ? u.conc : (B.spirits || []).filter(function (s) { return s.by === u.id && s.from && s.rounds > 0 && !!s.sword === (g.sid === 'arcanesword'); })[0];
    return rec ? { x: rec.from.x, y: rec.from.y, id: u.id, gin: rec.from.gin || [] } : u; // (gin: the globes it was first cast inside of -- none, if before they rose)
  };
  // the lasting zones a spell leaves (10-01, Griz: "Yes to ... Globe runners"): the grounds, the clouds, the webs, the walls, the ring of guardians, the
  // beams and the guardian of faith -- whose effects land later, each turn or on entering. SRD 5.1: "Any spell of 5th level or lower cast from outside the
  // barrier can't affect creatures or objects within it ... Similarly, the area within the barrier is excluded from the areas affected by such spells."
  // So a zone carries where its caster stood when it was cast (`from`) and the spell's own level (`lv`) -- stamped by the M.cast wrapper below, not where
  // the caster is now and not the slot -- and a creature (or a bare square { x, y }) inside a globe that point is outside of, of a cap the level fits, is
  // not touched by it: no save, no damage, no condition; and the square is no part of the zone (no difficult ground, no wall body there). A globe raised
  // after the zone was laid still shelters those inside it. The fog and the dark are read too (10-01, Griz: "risk of forgetting too high, let's fix it now"): M.darkSq
  // (js/magic.js) leaves a globe's squares out of a darkness, a fog, a stinking cloud, Cloudkill or Sleet Storm cast from outside it, so sight, the light's map and the
  // drawing all see no cloud there -- a line that crosses only globe squares of the cloud is clear of it, one inside the globe is not "in the dark" of it; and a spell's
  // light (Daylight, Dancing Lights, Light, a Continual Flame -- stamped, `lights` below) lies on no globe square (js/light.js L.map)
  M.zoneGlobed = function (B, z, w) {
    if (!B || !z || !w || !(B.globes || []).length) return false;
    var from = z.from || (B.castFrom && B.castBy === z.by ? B.castFrom : null); // (a zone's own effect inside the cast that lays it -- Moonbeam's first beam -- before the stamp)
    if (!from) return false;
    return globeShuts(B, from, w, z.lv != null ? z.lv : B.castLevel != null ? B.castLevel : 5);
  };
  // the card's say, as the other Globe lines: `how` is what the creature did ('starts its turn in the poison fog'); true when it is shut out
  M.zoneShut = function (B, z, w, how) {
    if (!M.zoneGlobed(B, z, w)) return false;
    B.card([Nm(B, w) + ' ' + how + ': {c}inside the globe: untouched{/}'], 200);
    return true;
  };
  var ZONE_KEEPS = ['grounds', 'zones', 'darks', 'webs', 'walls', 'auras', 'wards', 'beads', 'lights', 'spirits', 'shells']; // ('lights': Daylight's and the Dancing Lights' places -- js/light.js L.map carves a globe's squares out of them; 'spirits': the floating weapon and the sword, whose swing asks the globe from where it was first cast -- M.castOrigin; 'shells': Antilife Shell's barrier, js/walls.js)
  var castG = M.cast;
  M.cast = function* (B, u, id, slot, t) {
    var sp = M.data(id), prev = B.castLevel, prevFrom = B.castFrom, prevBy = B.castBy, prevBefore = B.castBefore, before = {}, condsBefore = [];
    // a spell used again (its geometry says `free`: the next bolt, the next swing) is cast, as far as the globe is concerned, from where it was FIRST cast -- not from where
    // the caster has walked to since; any other cast from the square he stands on
    var ex0 = M.EFFECT && M.EFFECT[id], g1 = ex0 && ex0.geo ? ex0.geo(B, u, M.geo(id)) : null, org = g1 && g1.free ? M.castOrigin(B, u, g1) : u;
    B.castLevel = sp && sp.level != null ? sp.level : null; B.castFrom = { x: org.x, y: org.y, gin: org.gin || M.ginOf(B, org) }; B.castBy = u.id; // (gin: the globes it is cast inside of -- 10-01c)
    ZONE_KEEPS.forEach(function (k) { before[k] = (B[k] || []).slice(); });
    (B.units || []).forEach(function (w) { Object.keys(w.conds || {}).forEach(function (k) { var c = w.conds[k]; if (c && typeof c === 'object') condsBefore.push(c); }); var sh = w.gshelf; if (sh) Object.keys(sh.recs).forEach(function (k) { var c = sh.recs[k].r; if (c && typeof c === 'object') condsBefore.push(c); }); }); // (and what a globe holds off it: not this cast's)
    B.castBefore = condsBefore; // (what a globe's frames mid-cast read: js the stampOf below)
    try { yield* castG.apply(this, arguments); } finally {
      // what this cast laid, stamped where it was cast from and at what level (a record already stamped -- Moonbeam moved, the sphere rolled -- keeps its first)
      ZONE_KEEPS.forEach(function (k) { (B[k] || []).forEach(function (z) { if (before[k].indexOf(z) < 0 && !z.from) { z.from = B.castFrom; z.lv = B.castLevel != null ? B.castLevel : 5; if (!z.castId && sp) z.castId = id; } }); }); // (castId: the spell that laid it -- what Dispel Magic aimed at a square ends, M.effectsAt; 10-02)
      // the same for what it laid ON a creature -- a condition record, an effect that sits on it and is felt each turn (Phantasmal Killer's bite, Acid Arrow's second, Contagion,
      // Bestow Curse, Hex, the stone, the command ...): where it was cast from and the spell's level, so the turn it is felt in a globe raised against the caster, M.zoneShut can say no
      (B.units || []).forEach(function (w) { Object.keys(w.conds || {}).forEach(function (k) { var c = w.conds[k]; if (c && typeof c === 'object' && !c.from && condsBefore.indexOf(c) < 0) { c.from = B.castFrom; c.lv = B.castLevel != null ? B.castLevel : 5; c.castId = id; } }); }); // (castId: the spell, for the globe's card -- M.globeSync)
      // and on the concentration it began, for the casts that use it again (M.castOrigin)
      if (u.conc && u.conc.id === id && !u.conc.from) { u.conc.from = B.castFrom; u.conc.lv = B.castLevel != null ? B.castLevel : 5; }
      B.castLevel = prev; B.castFrom = prevFrom; B.castBy = prevBy; B.castBefore = prevBefore;
      M.globeSync(B); // (what this cast laid on one inside a globe it was cast from outside of -- none, the cast's own gates saw to it -- or a globe it raised)
    }
  };

  // ------------------------------------------------------------------ the globe and what is already on a creature (10-01c, RULED)
  // Griz, asked whether a Globe of Invulnerability suspends a spell's lasting condition on one inside it: "1 it does if we can get the animation right"; "2 everything
  // cast before the globe has a 'where' of 'outside'. it's like the globe will have to have a list of every spell cast while it exists with where it was cast, effect
  // and target to know if bob recasts mage armor after putting up the globe (from inside) then leaves to give his friend a potion and goes back into the globe".
  // SRD 5.1: a spell cast from outside "can't affect creatures or objects within it" -- not "ends". So the record a spell left on a creature inside a globe it was
  // cast from outside of (or before which it was cast) is set aside whole while the creature stands there -- the shelf, w.gshelf -- and put back when it steps out
  // or the globe falls, if the spell still lasts: its clock runs on off the shelf (the caster's concentration, B.expiries). Every reader of w.conds sees the creature
  // as the globe leaves it -- the hold gone, the fear, the blessing. The code that ends a spell runs with the shelf lifted (M.unveil: M.endConc, the expiries, Dispel
  // Magic), so a spell that ends while shelved ends for good. What a spell wrote on the creature itself (Mage Armor's AC, Longstrider's +10 ft, a weapon made magic,
  // the images, a sense, the size) is taken off with the record and given back with it (BAKE). NOT shelved (the seat's calls): the hit points a spell gave (Aid,
  // False Life, Heroism's, Enhance Ability's -- spent like any hit points); a mark of the moment (prone; Acid Arrow's second bite, spent if due inside -- 10-01b);
  // the caster's own bookkeeping (Call Lightning's storm, a smite readied, Vampiric Touch, the Flame Blade in hand); and the lights (light.js carves those by square)
  var SHELF = {};
  ('asleep baned barkskin beacon blessed blinded blindedBy blink blur branded charmed commanded confused contagion cursed dancing darkvision deafened deathWard disAt divineFavor ' +
   'energyWard enfeebled enhanced enlarged faerie feared feeble fireShield foresight freeMove frightened frosted guidance guided hasted heated heroism holyAura hypnotized ' +
   'incapacitated invisible killer laughing longstrider mageArmor magicWeapon marked mindBlank mirrorImage mocked noHeal noReact paralyzed pfeg poisoned poisonWard pwt ' +
   'regenerating resistance restrained retreat sanctuary seeInvisible shieldOfFaith shillelagh sickened slowed stoneskin stoning stunned truesight trueStrike wardingBond').split(' ').forEach(function (k) { SHELF[k] = 1; });
  // a creature may come into a fight under these with no record of where they were cast (the camp's CAST AHEAD, the 8-bit sheet): cast before any globe, so from
  // outside every one -- their levels. A generic condition with no record of a cast (a ghoul's paralysis, a dragon's fear) is no spell's: never shelved
  var BEFORE = { mageArmor: 1, longstrider: 1, pfeg: 1, sanctuary: 1, darkvision: 2, seeInvisible: 2, magicWeapon: 2, barkskin: 2, stoneskin: 4 };
  var BEFORE_NAME = { mageArmor: 'Mage Armor', longstrider: 'Longstrider', pfeg: 'Protection from Evil and Good', sanctuary: 'Sanctuary', darkvision: 'Darkvision', seeInvisible: 'See Invisibility', magicWeapon: 'Magic Weapon', barkskin: 'Barkskin', stoneskin: 'Stoneskin' };
  var DISABLES = { paralyzed: 1, stunned: 1, asleep: 1, hypnotized: 1, incapacitated: 1, dancing: 1, laughing: 1, charmed: 1, confused: 1, stoning: 1, restrained: 1 }; // (the AI's weights)
  var HARMS = { frightened: 1, feared: 1, slowed: 1, baned: 1, blinded: 1, cursed: 1, disAt: 1, marked: 1, heated: 1, killer: 1, contagion: 1, poisoned: 1, faerie: 1, enfeebled: 1, feeble: 1, sickened: 1, mocked: 1, noHeal: 1, noReact: 1, guided: 1, branded: 1, deafened: 1, commanded: 1, frosted: 1, regenerating: 0 };
  var OUTSIDE = M.OUTSIDE = { x: -999, y: -999, gin: [] }; // (where a spell with no record of its casting was cast from: outside every globe)
  // (a record laid by a cast still under way -- not among what was there when it began, B.castBefore -- is that cast's, though the wrapper stamps it only at
  // the cast's end: the frames between see it so -- 10-01c, filming it, Bob's Mage Armor recast inside his globe went idle the frame it was laid)
  function stampOf(B, k, r) {
    if (r && typeof r === 'object' && r.from) return { from: r.from, lv: r.lv != null ? r.lv : 5 };
    if (r && typeof r === 'object' && B.castFrom && B.castBefore && B.castBefore.indexOf(r) < 0) return { from: B.castFrom, lv: B.castLevel != null ? B.castLevel : 5 };
    if (BEFORE[k] != null) return { from: OUTSIDE, lv: BEFORE[k] };
    return null;
  }
  // a record a globe holds off this creature now
  function idleRec(B, w, k, r) { if (!SHELF[k]) return false; var s = stampOf(B, k, r); return !!s && globeShuts(B, s.from, w, s.lv); }
  function unarmored(w) { try { if (w.src && window.DS && window.DS.R) return window.DS.R.ac(Object.assign({}, w.src, { conds: {} })); } catch (x) { /* (a sheet the 8-bit's rules can't read: the plain figure) */ } return 10 + D.mod(w.abil ? w.abil.dex : 10); }
  function weaponOff(w, r, e) { if (r && r.base && !w.beast) { e.v = w.weapon; w.weapon = r.base; } } // (a druid in a beast's shape has the bite in hand, not the wood: nothing to take off -- the druid runner's find, 10-01c)
  function weaponOn(w, r, e) { if (e.v) w.weapon = e.v; }
  function sense(f) { return [function (w, r, e) { if (r && typeof r === 'object' && r.had != null) { e.v = w[f]; w[f] = r.had; } }, function (w, r, e) { if ('v' in e) w[f] = e.v; }]; }
  function regrow(w, r, e, k0) { if (k0 != null && D.spr && D.spr.regrow) D.spr.regrow(w, k0); }
  // [off, on]: off runs with the record already set aside, on with it put back (k0: the figure's drawn size before)
  var BAKE = {
    mageArmor: [function (w, r, e) { e.v = w.baseAC; w.baseAC = r && typeof r === 'object' && r.base != null ? r.base : unarmored(w); }, function (w, r, e) { if (e.v != null) w.baseAC = e.v; }],
    longstrider: [function (w) { w.speed -= 10; }, function (w) { w.speed += 10; }],
    shillelagh: [weaponOff, weaponOn], magicWeapon: [weaponOff, weaponOn],
    mirrorImage: [function (w, r, e) { e.v = w.images || 0; w.images = 0; }, function (w, r, e) { w.images = e.v; }],
    darkvision: sense('darkvision'), truesight: sense('truesight'), seeInvisible: sense('seeInvisible'),
    enlarged: [regrow, regrow]
  };
  function scaleOf(w) { return D.spr && D.spr.scaleOf ? D.spr.scaleOf(w) : null; }
  function shelfOf(w) { var s = w.gshelf; if (s && s.of !== w.conds) s = w.gshelf = null; return s; } // (a figure whose conditions were wiped since -- the gallery's reset, a climb's rest: the shelf is stale)
  function shelve(w, k, r, sh) { var e = { r: r }, k0 = scaleOf(w); delete w.conds[k]; if (BAKE[k]) BAKE[k][0](w, r, e, k0); sh.recs[k] = e; }
  function wake(w, k, e) { var k0 = scaleOf(w); w.conds[k] = e.r; if (BAKE[k]) BAKE[k][1](w, e.r, e, k0); }
  function label(k, r) { var sp = r && typeof r === 'object' && r.castId ? M.data(r.castId) : null; return sp && sp.name ? sp.name : BEFORE_NAME[k] || k; }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function say(B, w, off, on, gone) {
    off = uniq(off); on = uniq(on);
    if (off.length) { FX.sparkle(w, 'glow', 16); FX.ring(w, 'glow', 18); B.card([Nm(B, w) + ' {c}inside the globe{/}: ' + off.join(', ') + (off.length > 1 ? ' lie' : ' lies') + ' idle.'], 240); }
    if (on.length) { FX.sparkle(w, 'violet', 12); B.card([Nm(B, w) + (gone ? ', {p}the globe gone{/}: ' : ' {p}outside the globe{/}: ') + on.join(', ') + (on.length > 1 ? ' take' : ' takes') + ' hold again.'], 240); }
  }
  // set aside what a globe now holds off each creature, and put back what none does; `quiet`: no flare, no card. Called on every step of the fight's coroutine
  // (battle.js step), each frame of a globe's swell, after every cast; nothing to do and quick when no globe stands and nothing is shelved
  M.globeSync = function (B, quiet) {
    if (!B || !B.units || B.veil) return;
    var any = (B.globes || []).length > 0;
    B.units.forEach(function (w) {
      if (!w.conds) return;
      var sh = shelfOf(w); if (!any && !sh) return;
      var off = [], on = [], here = any && !w.dead && !w.ethereal; // (an ethereal creature -- blinked out -- stands in no globe)
      if (sh) Object.keys(sh.recs).forEach(function (k) {
        var e = sh.recs[k]; if (here && idleRec(B, w, k, e.r)) return;
        delete sh.recs[k];
        if (w.conds[k] != null) return; // (the same thing laid again since, from inside the globe: the newer stands, the older is gone)
        wake(w, k, e); on.push(label(k, e.r));
      });
      if (here) Object.keys(w.conds).forEach(function (k) { var r = w.conds[k]; if (r == null || r === false || !idleRec(B, w, k, r)) return; sh = sh || (w.gshelf = { of: w.conds, recs: {} }); shelve(w, k, r, sh); off.push(label(k, r)); });
      if (sh && !Object.keys(sh.recs).length) w.gshelf = null;
      if (!quiet) say(B, w, off, on, !any);
    });
  };
  // the shelf lifted, for code that must see what is really on a creature (a spell ending, Dispel Magic): every shelved record put back as it was; the function
  // it returns sets aside again, quietly, what a globe still holds off, and says what it no longer does (the globe that fell)
  M.liftVeil = function (B) {
    var back = [];
    if (B && B.units) B.units.forEach(function (w) { var sh = w.conds && shelfOf(w); if (!sh) return; Object.keys(sh.recs).forEach(function (k) { var e = sh.recs[k]; if (w.conds[k] != null) return; wake(w, k, e); back.push([w, k, e]); }); w.gshelf = null; });
    if (B) B.veil = (B.veil || 0) + 1;
    return function () {
      if (!B) return;
      B.veil = Math.max(0, (B.veil || 1) - 1);
      var any = (B.globes || []).length > 0, woke = [];
      back.forEach(function (b) {
        var w = b[0], k = b[1], e = b[2];
        if (w.conds[k] !== e.r) return; // (it ended)
        if (any && !w.dead && !w.ethereal && idleRec(B, w, k, e.r)) { shelve(w, k, e.r, shelfOf(w) || (w.gshelf = { of: w.conds, recs: {} })); return; } // (as it was, its bake taken off again)
        woke.push(b);
      });
      // what was held off and is not now: given back for good. (Its bake was already put back with it -- wake.)
      var by = {}; woke.forEach(function (b) { var id = b[0].id; (by[id] = by[id] || { w: b[0], on: [] }).on.push(label(b[1], b[2].r)); });
      Object.keys(by).forEach(function (id) { say(B, by[id].w, [], by[id].on, true); }); // (put back by the shelf's lifting: a globe that fell, never a step)
    };
  };
  M.unveil = function (B, fn) { var put = M.liftVeil(B); try { return fn(); } finally { put(); } };
  // the fight is over: everything back on, every globe gone (what is saved after -- the 8-bit's sheet, a camp -- sees the creature whole)
  M.globeLift = function (B) {
    if (!B || !B.units) return;
    B.units.forEach(function (w) { var sh = w.conds && shelfOf(w); if (!sh) return; Object.keys(sh.recs).forEach(function (k) { if (w.conds[k] == null) wake(w, k, sh.recs[k]); }); w.gshelf = null; });
    B.globes = [];
  };
  // what a globe holds off this creature now, { key: record } -- the condition line's "idle in the globe" (ui.js conds)
  M.shelved = function (w) { var sh = w && w.conds && shelfOf(w); if (!sh) return null; var o = {}, n = 0; Object.keys(sh.recs).forEach(function (k) { o[k] = sh.recs[k].r; n++; }); return n ? o : null; };
  // Irresistible Dance (SRD 5.1): no first save. "A dancing creature must use all its movement to dance without leaving its space and has disadvantage
  // on Dexterity saving throws and attack rolls... other creatures have advantage on attack rolls against it. As an action, a dancing creature makes a
  // Wisdom saving throw to regain control of itself." Here: the turn's move is gone and the save is its action's (M.onStart below). The AI always spends
  // the action on it: it has no better use of it. A PLAYER's dancer is asked, at its turn's start (M.danceAsk, heroTurn asks it; 10-01, Griz, asked
  // "give a player's dancer that choice (a prompt: SHAKE IT OFF (WIS save) / FIGHT ON), or keep the save automatic?": "agree, player choice, ai takes
  // irresistible seriously ;)"): SHAKE IT OFF is the save and the action spent; FIGHT ON is no save and the action kept -- it still can't move and
  // keeps its disadvantage. The edges ride on conds.dancing (RU.edges and RU.saveDis, just after)
  E.irresistibledance = {
    summary: function () { return 'a creature within 30 ft · no first save: it dances in place -- no movement, its attacks and DEX saves at disadvantage, attacks at it with advantage; its action each turn may be a WIS save to stop (a player asked: shake it off, or fight on; the AI always saves) (concentration)'; },
    cast: function* (B, u, t, slot, head, x) { if (t.type === 'undead' || RU.immuneTo(t, 'charmed', u)) { B.card([head + ': ' + nm(B, t) + ' is proof against it.']); yield 16; return; } t.conds.dancing = { dc: x.dc, by: u.id }; M.concentrate(B, u, 'irresistibledance', 'Irresistible Dance', function () { delete t.conds.dancing; }); FX.sparkle(t, 'gold', 20); B.card([head + ': ' + nm(B, t) + ' begins to dance.']); yield 20; },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; var t = fs.filter(function (w) { return M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), w) && w.type !== 'undead'; }).sort(function (a, b) { return TX().dpr(b) - TX().dpr(a); })[0]; return t ? { score: TX().dpr(t) * 2.5, t: t, keep: TX().dpr(t) * 1.5 } : null; }
  };
  // the dance's save (SRD 5.1: "As an action, a dancing creature makes a Wisdom saving throw to regain control of itself"): the action is spent on it, a
  // WIS save against the caster's DC; a pass ends the spell (its caster's concentration, or the condition alone if the caster is gone)
  M.danceSave = function (B, u) {
    var dn = u.conds.dancing; if (!dn || !u.turn) return;
    u.turn.action = 0; u.turn.attacksLeft = 0;
    var s3 = RU.save(u, 'wis', dn.dc), by3 = B.units.filter(function (w) { return w.id === dn.by; })[0];
    B.card([Nm(B, u) + ' dances in place, and spends ' + (u.side === 'party' && !u.guest ? 'the' : 'its') + ' action on the save: WIS ' + RU.saveText(s3) + ' vs DC ' + dn.dc + '  ' + (s3.ok ? '{n}IT REGAINS CONTROL{/}' : '{g}still dancing{/}')], 240);
    if (s3.ok) { if (by3 && by3.conc && by3.conc.id === 'irresistibledance') M.endConc(B, by3, 'it broke free'); else delete u.conds.dancing; }
  };
  // a player's dancer, at its turn's start (battle.js heroTurn): the save is an action it MAY take. 1 SHAKE IT OFF first (the benches answer every prompt
  // with the first option), 2 FIGHT ON: no save, the action kept -- it still can't move, and keeps its disadvantage
  M.danceAsk = function* (B, u) {
    var dn = u.conds.dancing; if (u.turn) u.turn.danceAsk = false;
    if (!dn || !u.turn || u.hp <= 0 || u.dead) return;
    var shake = yield { prompt: { who: u, title: u.name + ': IRRESISTIBLE DANCE', lines: ['No move; attacks and DEX saves at disadvantage; attacks at you have advantage.', 'WIS DC ' + dn.dc + ' as your action to regain control, or keep the action and dance on.'], opts: [{ label: 'SHAKE IT OFF (WIS save, your action)', value: true }, { label: 'FIGHT ON (keep the action, dance on)', value: false }] } };
    if (shake) M.danceSave(B, u);
    else B.card([u.name + ' dances in place and fights on: {g}no save, the action kept.{/}'], 200);
  };
  // the dance's edges, and Eyebite's sickness on a check: rules.js asks here. Attack rolls (RU.edges): the dancer at disadvantage, everyone else at
  // it with advantage. DEX saves (RU.saveDis): traits.js sets that hook after this file loads, so the setter keeps whatever it is given and the
  // dance's rides with it. Ability checks (RU.checkEdges): the sickened -- disadvantage on attack rolls (RU.edges, rules.js) and ability checks
  var edges0 = RU.edges;
  RU.edges = function (att, tgt, atk, ax, ay) {
    var r = edges0.apply(this, arguments);
    if (att.conds.dancing) r.dis.push('dancing');
    if (tgt.conds.dancing) r.adv.push('dancing target');
    if (att.conds.dancing || tgt.conds.dancing) r.net = r.adv.length && !r.dis.length ? 1 : r.dis.length && !r.adv.length ? -1 : 0;
    return r;
  };
  var saveDis0 = RU.saveDis;
  Object.defineProperty(RU, 'saveDis', { configurable: true, enumerable: true,
    get: function () { return function (w, ab) { return !!(saveDis0 && saveDis0(w, ab)) || (ab === 'dex' && !!w.conds.dancing); }; },
    set: function (f) { saveDis0 = f; } });
  var checkEdges0 = RU.checkEdges;
  if (checkEdges0) RU.checkEdges = function (w, abil) { var r = checkEdges0.apply(this, arguments); if (w && w.conds && w.conds.sickened) r.dis.push('sickened'); return r; };
  E.sunbeam = {
    geo: function (B, u, g) { return u.conc && u.conc.id === 'sunbeam' ? Object.assign({}, g, { free: true, again: true }) : null; },
    summary: function (e) { return (e.g.again ? 'the beam again: ' : '') + '60-ft line · CON · 6d8 radiant (half) and blinded (concentration: again each action)'; },
    cast: function* (B, u, t, slot, head, x) {
      if (!x.g.again) M.concentrate(B, u, 'sunbeam', 'Sunbeam', function () {});
      var sq = M.area(u, x.g, t.x, t.y); FX.bloom(u.x, u.y, sq, 'bone');
      yield* saveAll(B, u, caughtIn(B, sq).filter(function (w) { return w !== u; }), 'con', x.dc, '6d8', 'radiant', true, head + ': a beam of sunlight', { against: 'blinded', failText: 'blinded', cond: function (w) { w.conds.blinded = { by: u.id, till: { who: w.id, at: 'end', n: 1 } }; } });
    },
    ai: function (B, u, e, slot, fs) { var b = TX().bestArea(B, u, e, fs, function (caught) { return TX().areaWorth(B, u, Object.assign({}, e, { sp: Object.assign({}, e.sp, { dmg: '6d8', half: true, save: 'con' }) }), 0, caught.filter(function (w) { return w !== u; })) * 1.3; }); if (b && !e.g.again) { b.score *= 1.6; b.keep = b.score / 3; } return b; }
  };
  // ------------------------------------------------------------------ 7th
  E.arcanesword = {
    geo: function (B, u, g) { return (B.spirits || []).some(function (s) { return s.by === u.id && s.sword && s.rounds > 0; }) ? Object.assign({}, g, { free: true, move: true, again: true, time: 'B' }) : null; },
    againName: 'Arcane Sword: swing',
    summary: function (e) { return (e.g.again ? 'bonus action · the sword moves up to 20 ft (to a foe within 25 ft of it) and strikes: ' : 'a sword of force within 60 ft (concentration); it strikes: ') + '3d10 force'; },
    cast: function* (B, u, t, slot, head, x) {
      var sw = (B.spirits || []).filter(function (s) { return s.by === u.id && s.sword && s.rounds > 0; })[0];
      // (SRD 5.1: "move the sword up to 20 feet to a spot you can see and repeat this attack": a foe more than 25 ft from it -- 20 to move, 5 to stand beside it -- is out of reach)
      if (sw && G.dist({ x: sw.x, y: sw.y, size: 1 }, t) > 25) {
        for (var st = 0; st < 4; st++) { sw.x += t.x > sw.x ? 1 : t.x < sw.x ? -1 : 0; sw.y += t.y > sw.y ? 1 : t.y < sw.y ? -1 : 0; } // (it goes its 20 ft toward it and cannot strike)
        FX.sparkle({ x: sw.x, y: sw.y, size: 1 }, 'glow', 14); B.card([head + ': ' + nm(B, t) + ' is too far for the sword -- it moves its 20 ft and cannot strike.'], 240); yield 20; return;
      }
      if (!sw) { sw = { by: u.id, x: t.x, y: t.y, dice: '3d10', rounds: 10, sword: true }; B.spirits = (B.spirits || []).filter(function (s) { return !(s.by === u.id && s.sword); }).concat([sw]); M.concentrate(B, u, 'arcanesword', 'Arcane Sword', function () { sw.rounds = 0; }); B.card([head + ': a shimmering sword of force hangs beside ' + nm(B, t) + '.'], 240); } // (the filter drops a spent one of an earlier casting)
      sw.x = t.x; sw.y = t.y; FX.sparkle({ x: t.x, y: t.y, size: 1 }, 'glow', 18);
      var ux = u.x, uy = u.y; u.drawAt = { x: ux, y: uy }; u.x = t.x + (t.x > ux ? -1 : t.x < ux ? 1 : 0); u.y = t.y + (t.y > uy ? -1 : t.y < uy ? 1 : 0);
      try { yield* B.attack(u, t, { name: 'Arcane Sword', atk: u.spellAtk, dice: '3d10', mod: 0, type: 'force', spell: true, touch: true, fx: 'bolt', spirit: true }); } finally { u.x = ux; u.y = uy; delete u.drawAt; }
    },
    ai: function (B, u, e, slot, fs) { var best = null, sw = e.g.again ? (B.spirits || []).filter(function (s) { return s.by === u.id && s.sword && s.rounds > 0; })[0] : null; fs.forEach(function (t) { if (G.dist(u, t) > 60 || (sw && G.dist({ x: sw.x, y: sw.y, size: 1 }, t) > 25)) return; var sc = TX().worth(TX().pHit(u.spellAtk, RU.ac(t), 0) * 16.5, t) * (e.g.again ? 1 : 3); if (!best || sc > best.score) best = { score: sc, t: t, keep: 12 }; }); return best; }
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
      var caught = unshut(B, u, e, B.units.filter(function (w) { return G.standing(w) && Math.hypot(w.x - at.x, w.y - at.y) * 5 <= 20; }));
      return { score: TX().areaWorth(B, u, Object.assign({}, e, { sp: Object.assign({}, e.sp, { dmg: (12 + bd.grown) + 'd6', half: true, save: 'dex' }) }), 0, caught) - 8, t: at };
    }
  };
  M.beadBurst = function (B, u, bd) {
    var sq = G.sphere(bd.x, bd.y, 20), list = caughtIn(B, sq), r = D.roll((12 + bd.grown) + 'd6'), lines = ['{o}The bead bursts!{/}  ' + (12 + bd.grown) + 'd6 = ' + r.total + ' fire  DEX DC ' + bd.dc];
    FX.bloom(bd.x, bd.y, sq, 'fire');
    list.forEach(function (w) { if (M.zoneGlobed(B, bd, w)) { lines.push('  ' + Nm(B, w) + ': {c}inside the globe: untouched{/}'); return; } var sv = RU.save(w, 'dex', bd.dc, false, null, r.total), n = sv.ok ? Math.floor(r.total / 2) : r.total; lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv) + ' -> {r}' + n + '{/}'); B.hurt(w, n, 'fire', MAGIC); }); // (the Globe of Invulnerability: the bead was cast from outside it)
    B.card(lines.slice(0, 8), 420);
    B.beads = (B.beads || []).filter(function (b) { return b !== bd; });
  };
  E.divineword = {
    summary: function () { return 'every foe within 30 ft that you see and that hears you (not the deafened) · CHA, by its HP: 50 or fewer deafened a minute; 40, and blinded; 30, and stunned; 20 drops; more is untouched; the otherworldly sent home for good'; },
    cast: function* (B, u, t, slot, head, x) {
      var list = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && G.dist(u, w) <= 30 && M.sees(B, u, w); }), lines = [head + ': a word of the first speech  CHA DC ' + x.dc];
      FX.ring(u, 'gold', 60); D.sfx('encounter');
      list.forEach(function (w) {
        if (cantHear(w)) { lines.push('  ' + Nm(B, w) + ': {g}cannot hear it{/}'); return; } // (SRD 5.1: "each creature that can hear you")
        if (M.globed(B, u, w, 7)) { lines.push('  ' + Nm(B, w) + ': {c}inside the globe: untouched{/}'); return; } // (a Globe of Invulnerability raised from an 8th- or 9th-level slot: the word is a 7th-level spell cast from outside it)
        var sv = RU.save(w, 'cha', x.dc, false, 'stunned'); if (sv.ok) { lines.push('  ' + Nm(B, w) + ': {n}withstands it{/}'); return; } // (against: deafened, blinded, stunned by its HP -- the ettin's Two Heads, 10-02)
        // the otherworldly are forced back to their plane and cannot return for a day: out of the fight, as a summoned one is when it goes
        if (HOME.test(w.type || '')) { delete w.conds.banished; w.dead = true; w.left = true; w.deadT = B.t; FX.sparkle(w, 'violet', 20); lines.push('  ' + Nm(B, w) + ': {y}sent home{/}'); return; }
        // (deafened for a minute -- ten of its own turns -- at 50 or fewer; the longer blindness and stun are the fight's, as they were)
        // (each condition only where the creature can take it -- a construct proof against blindness, the deaf-born: 10-06, the grid's rules §2.7, "Divine Word sets it with no
        // immunity check"; the line names what it shrugged off)
        var lay = function (want) {
          var got = [], off = [];
          want.forEach(function (k) { if (RU.immuneTo(w, k)) { off.push(k); return; } w.conds[k] = k === 'deafened' && want.length === 1 ? { by: u.id, till: { who: w.id, at: 'end', n: 10 } } : { by: u.id }; got.push(k); });
          lines.push('  ' + Nm(B, w) + ': ' + (got.length ? '{' + (got.length > 2 ? 'p' : 'o') + '}' + got.join(', ') + '{/}' : '{g}untouched{/}') + (off.length ? '  {g}(proof against ' + off.join(', ') + '){/}' : ''));
        };
        if (w.hp <= 20) { lines.push('  ' + Nm(B, w) + ': {y}DROPS{/}'); B.hurt(w, w.hp + (w.temp || 0), 'radiant', MAGIC); }
        else if (w.hp <= 30) lay(['deafened', 'stunned', 'blinded']);
        else if (w.hp <= 40) lay(['deafened', 'blinded']);
        else if (w.hp <= 50) lay(['deafened']);
        else lines.push('  ' + Nm(B, w) + ': {g}too much life in it{/}');
      });
      B.card(lines.slice(0, 8), 420); yield 30;
    },
    ai: function (B, u, e, slot, fs) { var near = unshut(B, u, e, fs.filter(function (w) { return G.dist(u, w) <= 30 && !cantHear(w); })); if (!near.length) return null; return { score: near.reduce(function (s, w) { return s + TX().pFail(w, 'cha', u.spellDC) * (HOME.test(w.type || '') ? w.hp * 0.5 + TX().dpr(w) * 3 : w.hp <= 20 ? w.hp + TX().dpr(w) * 2 : w.hp <= 40 ? TX().dpr(w) * 2 : w.hp <= 50 ? 1 : 0); }, 0), t: u }; }
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
        if (M.globed(B, u, w, 7)) { lines.push('  ' + Nm(B, w) + ': {c}inside the globe: untouched{/}'); return; } // (a Globe of Invulnerability raised from an 8th- or 9th-level slot)
        var rolls = [D.d(8)]; if (rolls[0] === 8) rolls = [D.d(7), D.d(7)];
        var sv = RU.save(w, 'dex', x.dc);
        rolls.forEach(function (r) {
          if (r <= 5) { var dmg = D.roll('10d6').total, n = sv.ok ? Math.floor(dmg / 2) : dmg; lines.push('  ' + Nm(B, w) + ': the ' + RAYS[r - 1][1] + ' ray ' + (sv.ok ? '{n}saved{/}' : '{o}failed{/}') + ' -> {r}' + n + '{/} ' + RAYS[r - 1][0]); hits.push([w, n, RAYS[r - 1][0]]); }
          else if (r === 6) { lines.push('  ' + Nm(B, w) + ': the indigo ray ' + (sv.ok ? '{n}saved{/}' : '{p}restrained{/}')); if (!sv.ok) w.conds.restrained = { dc: x.dc, by: u.id }; }
          else { lines.push('  ' + Nm(B, w) + ': the violet ray ' + (sv.ok ? '{n}saved{/}' : '{p}blinded{/}')); if (!sv.ok) w.conds.blinded = { by: u.id, till: { who: w.id, at: 'end', n: 2 } }; }
        });
      });
      B.card(lines.slice(0, 8), 480); yield { fx: 1 };
      hits.forEach(function (h) { if (!h[0].dead) B.hurt(h[0], h[1], h[2], MAGIC); });
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
    cast: function* (B, u, t, slot, head, x) { var r = D.roll('4d6'); B.card([head + ' on ' + nm(B, t) + '  4d6 = {r}' + r.total + '{/} psychic'], 300); B.hurt(t, r.total, 'psychic', MAGIC); if (t.hp > 0) yield* saveAll(B, u, [t], 'int', x.dc, null, '', false, '  its mind', { failText: 'shattered', cond: function (w) { w.conds.feeble = { by: u.id }; if (w.conc) M.endConc(B, w, 'the mind gone'); } }); },
    ai: function (B, u, e, slot, fs) { var t = fs.filter(function (w) { return M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), w) && (w.known || []).length; }).sort(function (a, b) { return TX().dpr(b) - TX().dpr(a); })[0]; return t ? { score: 14 + TX().pFail(t, 'int', u.spellDC) * TX().dpr(t) * 3, t: t } : null; }
  };
  E.holyaura = {
    summary: function () { return 'your allies within 30 ft · advantage on saves, attacks at them at disadvantage (concentration)'; },
    // (the Globe of Invulnerability, from a 9th-level slot: the 8th-level aura is not laid on one inside it, the caster outside)
    cast: function* (B, u, t, slot, head) { var all = B.units.filter(function (w) { return w.side === u.side && !w.dead && G.dist(u, w) <= 30; }), shut = all.filter(function (w) { return M.globed(B, u, w, 8); }), who = all.filter(function (w) { return shut.indexOf(w) < 0; }); who.forEach(function (w) { w.conds.holyAura = { by: u.id }; FX.sparkle(w, 'gold', 12); }); M.concentrate(B, u, 'holyaura', 'Holy Aura', function () { who.forEach(function (w) { if (w.conds.holyAura && w.conds.holyAura.by === u.id) delete w.conds.holyAura; }); }); B.card([head + ': divine light about ' + who.map(function (w) { return w.name; }).join(', ') + ' (concentration).'].concat(shut.map(function (w) { return '  ' + Nm(B, w) + ': {c}inside the globe: untouched{/}'; }))); yield 20; },
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
  E.sunburst = areaSave('con', '12d6', 'radiant', true, 'bone', { against: 'blinded', cond: function (B, u, w, x) { w.conds.blindedBy = { dc: x.dc, by: u.id }; w.conds.blinded = { by: u.id }; }, after: function (B, u, sq) { B.darks = (B.darks || []).filter(function (d) { return d.kind !== 'darkness' || !d.sq.some(function (q) { return sq.some(function (p) { return p[0] === q[0] && p[1] === q[1]; }); }); }); if (B.lightMap) B.lightMap = null; } });
  // ------------------------------------------------------------------ 9th
  E.foresight = {
    summary: function () { return 'touch · advantage on its attacks and saves, and attacks at it at disadvantage, for the fight'; },
    cast: function* (B, u, t, slot, head) { t.conds.foresight = { by: u.id }; FX.ring(t, 'gold', 30); B.card([head + ' on ' + t.name + ': they see a moment ahead.']); yield 16; },
    ai: function (B, u, e, slot, fs, allies) { if (B.round > 2) return null; var t = allies.filter(function (w) { return G.standing(w) && G.dist(u, w) <= 5 && !w.conds.foresight; }).sort(function (a, b) { return TX().dpr(b) - TX().dpr(a); })[0]; return t ? { score: TX().dpr(t) * 3, t: t } : null; }
  };
  E.massheal = {
    summary: function () { return 'your allies in sight · 700 HP to share, blindness, deafness and disease ended'; },
    cast: function* (B, u, t, slot, head) { var left = 700, got = [], cured = []; TX().alliesOf(B, u).filter(function (w) { return !w.dead && M.sees(B, u, w); }).sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; }).forEach(function (w) { var n = Math.min(left, w.maxhp - Math.max(0, w.hp)); if (n > 0) { left -= n; B.heal(w, n); got.push(w.name + ' +' + n); } var sick = cureSick(w); if (sick.length) cured.push(w.name + ' (' + sick.join(', ') + ')'); }); FX.ring(u, 'gold', 70); B.card([head + ': {n}' + (got.join(', ') || 'all whole') + '{/}'].concat(cured.length ? ['  {c}cured: ' + cured.join(', ') + '{/}'] : [])); yield 24; },
    ai: function (B, u, e, slot, fs, allies) { var need = allies.reduce(function (s, w) { return s + (w.dead ? 0 : (w.maxhp - Math.max(0, w.hp)) * TX().healNeed(B, u, w)); }, 0); return need > 30 ? { score: need, t: u } : null; }
  };
  E.meteorswarm = {
    summary: function () { return 'four 40-ft spheres · DEX · 20d6 fire and 20d6 bludgeoning (half), each caught once'; },
    cast: function* (B, u, t, slot, head, x) {
      var pts = [[t.x, t.y]].concat(B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w); }).slice(0, 3).map(function (w) { return [w.x, w.y]; }));
      var sq = []; pts.forEach(function (p) { G.sphere(p[0], p[1], 40).forEach(function (q) { if (!sq.some(function (z) { return z[0] === q[0] && z[1] === q[1]; })) sq.push(q); }); });
      FX.bloom(t.x, t.y, sq, 'fire'); D.sfx('encounter');
      var list = caughtIn(B, sq), f = D.roll('20d6'), b = D.roll('20d6'), lines = [head + ': the sky falls  ' + f.total + ' fire + ' + b.total + ' bludgeoning  DEX DC ' + x.dc], hits = [];
      // (the Globe of Invulnerability: a 9th-level spell is past the highest globe there is -- one raised from a 9th-level slot holds out the 8th and under -- so nothing is ever shut out here; asked all the same, so a rule that moved would not leave this one behind)
      list.forEach(function (w) { if (M.globed(B, u, w, 9)) { lines.push('  ' + Nm(B, w) + ': {c}inside the globe: untouched{/}'); return; } var sv = RU.save(w, 'dex', x.dc), k = sv.ok ? 0.5 : 1; lines.push('  ' + Nm(B, w) + ': ' + RU.saveText(sv)); hits.push([w, Math.floor(f.total * k), Math.floor(b.total * k)]); });
      B.card(lines.slice(0, 8), 480); yield { fx: 1 };
      hits.forEach(function (h) { B.hurtAll(h[0], [[h[1], 'fire'], [h[2], 'bludgeoning']], MAGIC); }); // (one concentration save on the sum: B.hurtAll)
      yield 30;
    },
    ai: function (B, u, e, slot, fs) { var sc = 0; B.units.forEach(function (w) { if (!G.standing(w) || M.globeShuts(B, u, e.g, w)) return; sc += (G.hostile(u, w) ? 1 : -1.5) * TX().worth(70 * 0.7, w); }); var t = fs[0]; return t && sc > 0 ? { score: sc, t: { x: t.x, y: t.y } } : null; }
  };
  E.powerwordkill = {
    summary: function () { return 'a creature within 60 ft · no save: dropped if it has 100 HP or fewer'; },
    cast: function* (B, u, t, slot, head) { if (t.hp > 100) { B.card([head + ': ' + nm(B, t) + ' has too much life in it.']); yield 16; return; } FX.ring(t, 'violet', 34); B.card([head + ': one word, and ' + nm(B, t) + ' {y}falls{/}.']); B.hurt(t, t.hp + (t.temp || 0), 'necrotic', MAGIC); yield 24; },
    ai: function (B, u, e, slot, fs) { var t = fs.filter(function (w) { return M.targetOK(B, u, Object.assign({}, e.g, { side: 'foe' }), w) && w.hp <= 100; }).sort(function (a, b) { return b.hp - a.hp; })[0]; return t ? { score: t.hp + TX().dpr(t) * 3, t: t } : null; }
  };
  // the clocks and grounds of batch E: the stone's saves, the dance's, the stun's; the bead growing; the quake's shaking; the glyph; regrowth
  var onStartE = M.onStart;
  M.onStart = function (B, u) {
    onStartE(B, u);
    // Irresistible Dance: all its movement goes to the dance (SRD 5.1), and the action to the save that might end it. The AI's dancer always spends it
    // (M.danceSave); a player's keeps the action whole until it is asked, at the top of its turn (M.danceAsk: battle.js heroTurn reads turn.danceAsk)
    var dn = u.conds.dancing;
    if (dn && u.hp > 0 && !u.dead && u.turn) {
      u.turn.move = 0;
      if (u.side === 'party' && !u.guest) u.turn.danceAsk = true;
      else M.danceSave(B, u);
    }
    if (u.conds.regenerating && u.hp > 0 && u.hp < u.maxhp && !M.zoneShut(B, u.conds.regenerating, u, 'knits on')) u.hp++; // (the Globe of Invulnerability: the spell was cast from outside it)
    (B.beads || []).forEach(function (b) { if (b.by === u.id && b.grown < 10) b.grown++; });
    (M.groundAt(B, u.x, u.y) || []).forEach(function (g) {
      if (g.kind !== 'quake' || u.hp <= 0) return;
      if (M.zoneShut(B, g, u, 'starts its turn in the quake')) return; // (the Globe of Invulnerability)
      if (!u.conds.prone && !u.noProne) { var sv = RU.save(u, 'dex', g.dc); if (!sv.ok) { u.conds.prone = true; B.card([Nm(B, u) + ' is thrown down by the quake.'], 200); } }
      if (u.conc && u.conc.id !== 'earthquake') { var s2 = RU.save(u, 'con', g.dc); if (!s2.ok) M.endConc(B, u, 'the quake'); }
    });
    if (u.conds.feeble) { u.turn.bonusSpell = true; u.turn.spellAction = 'leveled'; } // (no spells: magic.js list asks conds.feeble too)
  };
  var onEndE = M.onEnd;
  M.onEnd = function (B, u) {
    onEndE(B, u);
    var st = u.conds.stoning;
    // (the Globe of Invulnerability: nothing creeps up the creature in there)
    // (a monster's stoning -- `once`, M.stoneBegin: the basilisk's gaze, the cockatrice's bite -- is one save at the end of its next turn; Flesh to Stone's is three and three)
    if (st && !st.done && u.hp > 0 && !M.zoneShut(B, st, u, 'against the stone')) {
      if (st.once && st.skip) st.skip = false; // (begun in its own turn: the save is at the end of the next one -- M.stoneBegin)
      else {
        var sv = RU.save(u, 'con', st.dc); if (sv.ok) st.good++; else st.bad++;
        B.card([Nm(B, u) + ' against the stone: CON ' + RU.saveText(sv) + '  ' + (st.once ? (sv.ok ? '{n}the stone lets go{/}' : '{o}it takes hold{/}') : st.bad + ' failed, ' + st.good + ' saved')], 200);
        if (st.good >= (st.once ? 1 : 3)) { delete u.conds.stoning; if (u.conds.restrained && u.conds.restrained.kind === 'stone') delete u.conds.restrained; }
        else if (st.bad >= (st.once ? 1 : 3)) M.petrify(B, u, { by: st.by });
      }
    }
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
      B.units.filter(function (w) { return G.hostile(c, w) && G.standing(w) && G.dist(u, w) <= 60; }).forEach(function (w) { if (M.zoneGlobed(B, g, w)) { lines.push('  ' + Nm(B, w) + ': {c}inside the globe: untouched{/}'); return; } var sv = RU.save(w, 'wis', g.dc); lines.push('  ' + Nm(B, w) + ': ' + (sv.ok ? '{n}steady{/}' : '{p}stunned{/}')); if (!sv.ok) w.conds.stunned = { by: g.by, dc: g.dc, pws: true }; });
      B.card(lines.slice(0, 8), 360); stop = true;
    });
    return stop;
  };

  // Weird (9th): Phantasmal Killer for a crowd -- a 30-ft sphere, WIS or frightened, and 4d10 psychic at each turn's end till it saves (concentration)
  E.weird = {
    summary: function () { return '30-ft sphere within 120 ft · WIS or frightened by its worst fear, 4d10 psychic at the end of each of its turns till it saves (concentration)'; },
    cast: function* (B, u, t, slot, head, x) {
      var sq = M.area(u, x.g, t.x, t.y), hit = []; FX.bloom(t.x, t.y, sq, 'violet');
      yield* saveAll(B, u, caughtIn(B, sq).filter(function (w) { return G.hostile(u, w); }), 'wis', x.dc, null, '', false, head + ': each sees what it fears most', { against: 'frightened', failText: 'sees it', cond: function (w) { w.conds.frightened = { by: u.id }; w.conds.killer = { dc: x.dc, by: u.id, dice: '4d10' }; hit.push(w); } });
      if (hit.length) M.concentrate(B, u, 'weird', 'Weird', function () { hit.forEach(function (w) { if (w.conds.killer && w.conds.killer.by === u.id) { delete w.conds.killer; if (w.conds.frightened && w.conds.frightened.by === u.id) delete w.conds.frightened; } }); });
    },
    ai: function (B, u, e, slot, fs) { if (u.conc) return null; return TX().bestArea(B, u, e, fs, function (caught) { var sc = 0; caught.forEach(function (w) { if (!G.hostile(u, w)) return; sc += TX().pFail(w, 'wis', u.spellDC) * 40; }); return sc; }); }
  };
})();
