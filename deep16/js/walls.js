/* DEEP16 — walls (the druid to twelve, step 2, 09-30: the handoff's "a `B.walls` list the grid consults ... the same machinery Wall of
   Force and the wizard's walls later use"). A wall is a straight run of squares laid across the caster's line to the point he picks,
   centred on it (the spell's `len`; diagonals as the line runs): one click aims it. What each is (SRD 5.1, the line form of each):
   - Wall of Fire (4th, a minute): opaque; DEX or 5d8 fire (half) to those in it as it rises; after, 5d8 fire to whoever enters it
     (the first time on a turn), ends a turn in it, or ends a turn within 10 ft of its burning side -- the side away from him (the
     SRD's "selected by you": the seat's call). It lights the ground about it.
   - Wall of Thorns (6th, ten minutes): blocks sight; a square of it costs 20 ft to cross (SRD: 4 ft for every foot); DEX or 7d8
     piercing (half) to those in it as it grows, and DEX or 7d8 slashing (half) on entering it (the first time on a turn) or ending a
     turn in it.
   - Wall of Stone (5th, ten minutes): nothing passes or sees through it; whoever stands where it rises is pushed out -- his own to his
     side, the others to the far one (SRD: "your choice which side"). The panels' AC and hit points are not built: it stands till his
     concentration goes.
   - Wind Wall (3rd, a minute): STR or 3d8 bludgeoning (half) to those in it as it rises; arrows, bolts and other ordinary missiles
     across it miss (battle.js attack); a small flier cannot cross it (a familiar owl or bat); sight passes.
   The grid reads B.walls through G.wallAt (grid.js: canPass, canStand, stepCost, los; losPoint for stone only); the turn hooks chain
   M.stepInto and M.onEnd as the grounds do (js/grimoire.js); the look is drawn in the world's sort (ui.js, W.props). */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx, M = D.magic, E = M.EFFECT;
  var W = D.walls = {};
  function TX() { return D.tactics; }
  function nm(B, w) { return w.side === 'foe' ? (w.named ? B.shortName(w) : 'the ' + B.shortName(w)) : w.name; }
  function Nm(B, w) { var s = nm(B, w); return s.charAt(0).toUpperCase() + s.slice(1); }
  function more(expr, n) { return !n ? expr : String(expr).replace(/^(\d+)d/, function (m, k) { return (+k + n) + 'd'; }); }
  var KIND = {
    walloffire: { kind: 'fire', sight: true, name: 'Wall of Fire', base: 4, rise: ['dex', '5d8', 'fire'], burn: '5d8', band: 2, light: true },
    wallofthorns: { kind: 'thorns', sight: true, name: 'Wall of Thorns', base: 6, rise: ['dex', '7d8', 'piercing'], rake: '7d8', cost: 15 },
    wallofstone: { kind: 'stone', sight: true, solid: true, name: 'Wall of Stone', base: 5 },
    windwall: { kind: 'wind', name: 'Wind Wall', base: 3, rise: ['str', '3d8', 'bludgeoning'] }
  };
  W.KIND = KIND;

  // ------------------------------------------------------------------ where it stands
  // the direction from him to the point, as one of the eight (the wall runs across it)
  function dirTo(u, cx, cy) { var dx = cx - u.x, dy = cy - u.y; if (!dx && !dy) return [0, 1]; var a = Math.atan2(dy, dx), k = Math.round(a / (Math.PI / 4)); return [Math.round(Math.cos(k * Math.PI / 4)), Math.round(Math.sin(k * Math.PI / 4))]; }
  // the squares: `len` ft of them centred on the point, across his line to it; each arm stops at rock
  M.wallSq = function (u, g, cx, cy) {
    var d = dirTo(u, cx, cy), px = -d[1], py = d[0], n = Math.max(1, Math.round((g.len || 60) / 5)), half = Math.floor((n - 1) / 2), out = [];
    var s0 = G.map.at(cx, cy); if (!s0 || !s0.open) return out;
    out.push([cx, cy]);
    [[1, n - 1 - half], [-1, half]].forEach(function (arm) {
      for (var i = 1; i <= arm[1]; i++) { var x = cx + px * i * arm[0], y = cy + py * i * arm[0], s = G.map.at(x, y); if (!s || !s.open) break; out.push([x, y]); }
    });
    return out;
  };
  var area0 = M.area;
  M.area = function (u, g, cx, cy) { return g.shape === 'wall' ? (M.inRange(u, g, cx, cy) ? M.wallSq(u, g, cx, cy) : []) : area0(u, g, cx, cy); };
  // which side of the wall a square is on: +1 the far side (away from him), -1 his, 0 in the line
  function sideOf(w, x, y) { var v = (x - w.cx) * w.dir[0] + (y - w.cy) * w.dir[1]; return v > 0.01 ? 1 : v < -0.01 ? -1 : 0; }
  // the grid's one question (grid.js): the wall on a square, if any (a lookup rebuilt when the walls change)
  G.wallAt = function (x, y) {
    var B = D.battle; if (!B || !B.walls || !B.walls.length) return null;
    if (!B.wallMap) { B.wallMap = {}; B.walls.forEach(function (w) { w.sq.forEach(function (q) { B.wallMap[q[0] + ',' + q[1]] = w; }); }); }
    var w = B.wallMap[x + ',' + y] || null;
    // the Globe of Invulnerability (SRD 5.1: "the area within the barrier is excluded from the areas affected by such spells"): a wall cast from outside a
    // globe has no body inside it -- nothing to pass, see through, pay for or be burnt by on a square within the globe (js/grimoire.js M.zoneGlobed)
    if (w && M.zoneGlobed && M.zoneGlobed(B, w, { x: x, y: y })) return null;
    return w;
  };
  function inWall(w, u) { return G.foot(u).some(function (p) { return w.sq.some(function (q) { return q[0] === p[0] && q[1] === p[1]; }); }); }
  function inBand(w, u) { return w.band && G.foot(u).some(function (p) { return w.band[p[0] + ',' + p[1]]; }); }
  function caughtIn(B, sq) { return B.units.filter(function (v) { return G.present(v) && v.hp > 0 && G.inArea(v, sq); }); }
  function remove(B, w) {
    B.walls = (B.walls || []).filter(function (x) { return x !== w; }); B.wallMap = null;
    if (w.lights) { B.lights = (B.lights || []).filter(function (l) { return w.lights.indexOf(l) < 0; }); B.lightMap = null; B.partyMap = null; }
  }

  // ------------------------------------------------------------------ the spells
  function wallSpell(id) {
    var K = KIND[id];
    return {
      summary: function (e) {
        var n = Math.max(0, (e.slot || K.base) - K.base), g = e.g;
        return g.len + '-ft wall within ' + g.range + ' ft, across your line to it (concentration) · ' + ({
          fire: 'DEX or ' + more('5d8', n) + ' fire (half) as it rises; after, ' + more('5d8', n) + ' fire to whoever enters it, ends a turn in it, or within 10 ft of its far side · opaque, and it gives light',
          thorns: 'DEX or ' + more('7d8', n) + ' piercing (half) as it grows; entering it or ending a turn in it, DEX or ' + more('7d8', n) + ' slashing (half) · a square of it costs 20 ft to cross · blocks sight',
          stone: 'nothing passes or sees through it; those where it rises are pushed out (yours to your side)',
          wind: 'STR or 3d8 bludgeoning (half) as it rises; arrows and bolts across it miss; small fliers cannot cross it'
        })[K.kind];
      },
      cast: function* (B, u, t, slot, head, x) {
        var sq = M.wallSq(u, x.g, t.x, t.y);
        if (!sq.length) { B.card([head + ': {o}no ground there for it.{/}'], 200); yield 16; return; }
        var n = Math.max(0, slot - K.base), w = { id: id + '-' + u.id + '-' + B.t, spell: id, by: u.id, kind: K.kind, sight: !!K.sight, solid: !!K.solid, cost: K.cost || 0, sq: sq, cx: t.x, cy: t.y, dir: dirTo(u, t.x, t.y), dc: x.dc, burn: K.burn && more(K.burn, n), rake: K.rake && more(K.rake, n) };
        // the burning side (fire): the two squares out beyond the line, the side away from him
        if (K.band) { w.band = {}; sq.forEach(function (q) { for (var k = 1; k <= K.band; k++) { var bx = q[0] + w.dir[0] * k, by = q[1] + w.dir[1] * k, s = G.map.at(bx, by); if (s && s.open) w.band[bx + ',' + by] = 1; } }); }
        D.sfx(K.kind === 'fire' ? 'fire2' : K.kind === 'stone' ? 'earth' : K.kind === 'wind' ? 'thunder' : 'nature');
        // stone: whoever stands where it rises is pushed out first (his own to his side, the others to the far one)
        if (K.solid) {
          caughtIn(B, sq).filter(function (v) { return !(M.globed && M.globed(B, u, v, slot)); }).forEach(function (v) { // (inside a globe the stone was cast from outside of there is no wall to be pushed out of)
            var want = v.side === u.side ? -1 : 1, best = null, bd = Infinity;
            for (var yy = 0; yy < G.map.h; yy++) for (var xx = 0; xx < G.map.w; xx++) {
              if (sideOf(w, xx, yy) !== want || sq.some(function (q) { return q[0] === xx && q[1] === yy; }) || !G.canStand(v, xx, yy)) continue;
              var dd = Math.max(Math.abs(xx - v.x), Math.abs(yy - v.y)); if (dd < bd) { bd = dd; best = [xx, yy]; }
            }
            if (best) { v.tween = { fx: v.x, fy: v.y, fz: G.gzAt(v, v.x, v.y), t: 0, dur: B.pace(8, true) }; v.x = best[0]; v.y = best[1]; } // (paced only when an AI-run unit is casting: Battle.prototype.pace)
          });
        }
        B.walls = (B.walls || []).concat([w]); B.wallMap = null;
        // (the wind keeps fog, smoke and gases at bay, SRD: a cloud it cuts through is scattered)
        if (K.kind === 'wind') { var gone = (B.darks || []).filter(function (dk) { return (dk.kind === 'fog' || dk.kind === 'stink' || dk.kind === 'kill') && dk.sq.some(function (q) { return sq.some(function (p) { return p[0] === q[0] && p[1] === q[1]; }); }); }); if (gone.length) { B.darks = B.darks.filter(function (dk) { return gone.indexOf(dk) < 0; }); B.lightMap = null; B.card(['{g}The wind tears the cloud apart.{/}'], 220); } }
        if (K.light) { w.lights = []; sq.forEach(function (q, i) { if (i % 2 === 0) w.lights.push({ id: w.id + 'L' + i, kind: 'wall', x: q[0], y: q[1], bright: 15, dim: 15, color: 'fire', flame: true, by: u.id }); }); B.lights = (B.lights || []).concat(w.lights); B.lightMap = null; B.partyMap = null; }
        FX.bloom(t.x, t.y, sq, K.kind === 'fire' ? 'fire' : K.kind === 'thorns' ? 'moss' : K.kind === 'stone' ? 'stone' : 'glow');
        if (K.rise) {
          var hit = caughtIn(B, sq); // (those inside a Globe of Invulnerability the wall was cast from outside of: saveAll says so on the card, "inside the globe: untouched")
          yield* M.saveAll(B, u, hit, K.rise[0], x.dc, more(K.rise[1], K.kind === 'wind' ? 0 : n), K.rise[2], true, head + ': ' + ({ fire: 'a wall of fire roars up', thorns: 'a wall of thorns tears up out of the ground', wind: 'a wall of wind howls up' })[K.kind]);
        } else B.card([head + ': a wall of stone grinds up out of the floor.'], 280);
        if (K.light && M.brighten) yield* M.brighten(B, u, K.name, null, { x: t.x, y: t.y, bright: 15 });
        M.concentrate(B, u, id, K.name, function () { remove(B, w); B.card(['{g}The ' + K.name.replace(/^Wall of /, 'wall of ').replace('Wind Wall', 'wind wall') + ' is gone.{/}'], 240); });
        yield 24;
      },
      // the AI raises the burning ones where they catch the most of the other side (the stone and the wind are the player's)
      ai: K.rise && K.kind !== 'wind' ? function (B, u, e, slot, fs) {
        if (u.conc) return null;
        var n = Math.max(0, slot - K.base), d = TX().avg(more(K.rise[1], n)), best = null;
        fs.forEach(function (f) {
          if (G.dist(u, f) > e.g.range || !M.sees(B, u, f)) return;
          var sq = M.wallSq(u, e.g, f.x, f.y), sc = 0, fake = { sq: sq, band: null, cx: f.x, cy: f.y, dir: dirTo(u, f.x, f.y) };
          if (K.band) { fake.band = {}; sq.forEach(function (q) { for (var k = 1; k <= K.band; k++) fake.band[(q[0] + fake.dir[0] * k) + ',' + (q[1] + fake.dir[1] * k)] = 1; }); }
          B.units.forEach(function (v) {
            if (!G.standing(v) || (M.globeShuts && M.globeShuts(B, u, e.g, v))) return; // (inside a Globe of Invulnerability the wall is cast from outside of: nothing to catch)
            var cau = G.inArea(v, sq), near = !cau && inBand(fake, v);
            if (!cau && !near) return;
            var pf = TX().pFail(v, K.rise[0], u.spellDC), worth = cau ? pf * d + (1 - pf) * d / 2 + d * 0.5 : d * 0.5;
            sc += G.hostile(u, v) ? worth : (v === u ? -worth * 2 : -worth * 1.3);
          });
          if (sc > 0 && (!best || sc > best.score)) best = { score: sc, t: { x: f.x, y: f.y }, keep: sc * 0.6 };
        });
        return best;
      } : undefined
    };
  }
  Object.keys(KIND).forEach(function (id) { E[id] = wallSpell(id); });

  // ------------------------------------------------------------------ the turns: into it, and a turn's end in it (or by the fire's far side)
  function hurt(B, v, w, dexpr, type, save, what) {
    var r = D.roll(dexpr), n = r.total, line = Nm(B, v) + ' ' + what;
    if (save) { var sv = RU.save(v, save, w.dc); n = sv.ok ? Math.floor(r.total / 2) : r.total; line += ': ' + save.toUpperCase() + ' ' + RU.saveText(sv) + ' vs DC ' + w.dc; }
    B.card([line + '  ' + dexpr + ' = {r}' + n + '{/} ' + type], 240);
    B.hurt(v, n, type);
  }
  var step0 = M.stepInto;
  M.stepInto = function (B, u) {
    var stop = step0 ? step0(B, u) : false;
    (B.walls || []).forEach(function (w) {
      if (u.hp <= 0 || u.dead || !u.turn || u.turn['wall' + w.id] || !inWall(w, u)) return;
      if (w.kind === 'fire') { u.turn['wall' + w.id] = true; if (!M.zoneShut(B, w, u, 'walks into the fire')) hurt(B, u, w, w.burn, 'fire', null, 'walks into the fire'); }
      if (w.kind === 'thorns') { u.turn['wall' + w.id] = true; if (!M.zoneShut(B, w, u, 'pushes into the thorns')) hurt(B, u, w, w.rake, 'slashing', 'dex', 'pushes into the thorns'); }
    });
    return stop || u.hp <= 0;
  };
  var end0 = M.onEnd;
  M.onEnd = function (B, u) {
    if (end0) end0(B, u);
    (B.walls || []).forEach(function (w) {
      if (u.hp <= 0 || u.dead || !G.present(u)) return;
      if (w.kind === 'fire' && (inWall(w, u) || inBand(w, u))) { if (!M.zoneShut(B, w, u, inWall(w, u) ? 'ends its turn in the wall of fire' : 'ends its turn by the wall of fire')) hurt(B, u, w, w.burn, 'fire', null, inWall(w, u) ? 'burns in the wall of fire' : 'is scorched by the wall of fire'); } // (the Globe of Invulnerability: cast from outside it, the fire does nothing to one inside)
      else if (w.kind === 'thorns' && inWall(w, u)) { if (!M.zoneShut(B, w, u, 'ends its turn in the thorns')) hurt(B, u, w, w.rake, 'slashing', 'dex', 'is torn by the thorns'); }
    });
  };
  // a missile across a wind wall (battle.js attack asks): arrows, bolts, a thrown axe -- not a spell, not a giant's boulder
  W.windStops = function (B, att, tgt, atk) {
    if (!B || !B.walls || !B.walls.length || !atk || !atk.ranged || atk.spell || atk.boulder) return false;
    var winds = B.walls.filter(function (w) { return w.kind === 'wind'; }); if (!winds.length) return false;
    var L = G.line(att.x, att.y, tgt.x, tgt.y);
    return winds.some(function (w) { return L.some(function (p) { return w.sq.some(function (q) { return q[0] === p[0] && q[1] === p[1]; }) && !G.inArea(att, [p]) && !G.inArea(tgt, [p]) && !(M.zoneGlobed && M.zoneGlobed(B, w, { x: p[0], y: p[1] })); }); }); // (a square inside a globe the wind was cast from outside of has no wind)
  };


  // ------------------------------------------------------------------ Antilife Shell and Plant Growth (the druid to twelve, 09-30)
  // Antilife Shell (SRD 5.1, 5th, concentration, an hour): a 10-ft barrier about him that moves with him; no creature but the undead and
  // constructs passes it or reaches through it (grid.js reads G.shellBars; a blow across it is turned: battle.js attack asks W.shellTurns);
  // if he moves so that one is forced through it, the spell ends
  function shelled(w) { return w.type !== 'undead' && w.type !== 'construct'; }
  function shellsOf(B) { return (B && B.shells) || []; }
  // the Globe of Invulnerability (SRD 5.1: "Any spell of 5th level or lower cast from outside the barrier can't affect creatures or objects within it ... the area within the barrier
  // is excluded from the areas affected by such spells"; 10-01, "risk of forgetting too high, let's fix it now"). The Shell is a 5th-level spell -- stamped with where it was cast
  // from and its level by the M.cast wrapper, like every zone -- and a globe it was cast from outside of is a HOLE in it, not a second wall: no barrier is met on a step that starts
  // or ends on a square of the globe, a blow from or at a creature standing in it is not turned, and a creature the shell's sweep carries into or out of the globe is not "forced to
  // pass through" (it is not an affected creature in there). Outside the globe the barrier is whole. A shell cast from inside the globe (the globe's own caster's) is the globe's friend
  // and keeps all of it. The barrier is round the caster, who may himself stand in the hole: the barrier goes where he goes, and has no say over what is inside the globe
  function holed(B, s, p) { return !!(M.zoneGlobed && M.zoneGlobed(B, s, p)); }
  G.shellBars = function (u, x0, y0, x1, y1) {
    var B = D.battle, S = shellsOf(B); if (!S.length || !shelled(u)) return false;
    for (var i = 0; i < S.length; i++) {
      var c = B.units.filter(function (w) { return w.id === S[i].by; })[0]; if (!c || c === u || !G.standing(c)) continue;
      if (holed(B, S[i], { x: x0, y: y0 }) || holed(B, S[i], { x: x1, y: y1 })) continue; // (a step that starts or ends in a globe the shell was cast from outside of: the hole)
      if ((G.dist(u, c, x0, y0) <= 10) !== (G.dist(u, c, x1, y1) <= 10)) return true; // (u stood at each end of the step)
    }
    return false;
  };
  W.shellTurns = function (B, att, tgt, atk) {
    if (!atk || atk.ranged || !shellsOf(B).length) return false;
    return shellsOf(B).some(function (s) { var c = B.units.filter(function (w) { return w.id === s.by; })[0]; if (!c || !G.standing(c)) return false; if (holed(B, s, att) || holed(B, s, tgt)) return false; var a = att !== c && shelled(att) ? G.dist(c, att) <= 10 : null, b = tgt !== c && shelled(tgt) ? G.dist(c, tgt) <= 10 : null; if (att === c) a = true; if (tgt === c) b = true; return a !== null && b !== null && a !== b; });
  };
  function insideOf(B, s) { var c = B.units.filter(function (w) { return w.id === s.by; })[0]; return c ? B.units.filter(function (w) { return w !== c && G.present(w) && w.hp > 0 && shelled(w) && G.dist(c, w) <= 10; }).map(function (w) { return w.id; }).sort().join(',') : ''; }
  E.antilifeshell = {
    summary: function () { return 'a 10-ft barrier about you (concentration): no creature but the dead and the made passes or reaches through it; move so one is forced through, and it ends; a Globe of Invulnerability it was cast from outside of is a hole in it -- no barrier to or from anything standing in the globe'; },
    cast: function* (B, u, t, slot, head) {
      var s = { by: u.id }; s.inside = insideOf(B, s);
      B.shells = shellsOf(B).concat([s]);
      FX.sparkle(u, 'glow', 20); D.sfx('holy2');
      B.card([head + ': a shimmering barrier ten feet about ' + u.name + '. Nothing living comes through it.'], 280);
      M.concentrate(B, u, 'antilifeshell', 'Antilife Shell', function () { B.shells = shellsOf(B).filter(function (x) { return x !== s; }); B.card(['{g}The barrier about ' + u.name + ' is gone.{/}'], 220); });
      yield 24;
    },
    // the AI raises it when blades are coming and none is at it yet
    ai: function (B, u, e, slot, fs) {
      if (u.conc) return null;
      // (one inside a Globe of Invulnerability the Shell would be cast from outside of is not hedged by it: it counts for nothing here)
      var shut = function (f) { return !!(M.globeShuts && M.globeShuts(B, u, e.g, f)); };
      var near = fs.filter(function (f) { return shelled(f) && G.standing(f) && G.dist(u, f) <= 10 && !shut(f); }).length;
      var coming = fs.filter(function (f) { return shelled(f) && G.standing(f) && !(f.weapon && f.weapon.ranged) && G.dist(u, f) > 10 && G.dist(u, f) <= 10 + (f.speed || 30) && !shut(f); });
      if (near || coming.length < 2) return null;
      var sc = coming.reduce(function (a, f) { return a + TX().dpr(f); }, 0) * 1.5;
      return { score: sc, t: u, keep: sc * 0.6 };
    }
  };
  // his step (M.stepInto): one forced through by his moving -- a creature in the barrier now that was not, or out that was in -- ends it
  var step1 = M.stepInto;
  M.stepInto = function (B, u) {
    var stop = step1 ? step1(B, u) : false;
    shellsOf(B).slice().forEach(function (s) {
      var now = insideOf(B, s);
      if (s.by !== u.id) { s.inside = now; return; } // (another's step: nothing living crosses the barrier but through a globe's hole, so who stands inside is simply who stands inside)
      if (now === s.inside) return;
      // (who changed sides: one that is no longer here is not "forced"; one standing in a globe the shell was cast from outside of is not an affected creature -- the hole)
      var was = s.inside ? String(s.inside).split(',') : [], is = now ? now.split(',') : [], forced = false;
      was.concat(is).forEach(function (id) { if ((was.indexOf(id) < 0) === (is.indexOf(id) < 0)) return; var w = B.units.filter(function (v) { return v.id === id; })[0]; if (w && G.present(w) && w.hp > 0 && !holed(B, s, w)) forced = true; });
      s.inside = now;
      if (forced && u.conc && u.conc.id === 'antilifeshell') M.endConc(B, u, 'one forced through the barrier');
    });
    return stop;
  };
  // Plant Growth (SRD 5.1, 3rd, an action; eight hours: the fight): the grass within 100 ft of a point grows thick -- 4 ft of movement for
  // every foot (20 more a square). Only where there are plants (the road maps' grass): in the caves it waits, greyed
  function plantSq(B, cx, cy) { var out = []; for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) { var s = G.map.at(x, y); if (s && s.ch === 'g' && Math.hypot(x - cx, y - cy) * 5 <= 100) out.push([x, y]); } return out; }
  E.plantgrowth = {
    list: function () { return G.map.sq.some(function (s) { return s.ch === 'g'; }) ? null : { why: 'no plants here to grow' }; },
    summary: function () { return 'a point within 150 ft: the grass within 100 ft grows thick -- 20 ft to cross a square (the fight)'; },
    cast: function* (B, u, t, slot, head) {
      var sq = plantSq(B, t.x, t.y);
      if (!sq.length) { B.card([head + ': nothing grows there.'], 200); yield 16; return; }
      // (each square holds the casting's record -- truthy as before -- with where he cast from and the spell's level, for the Globe of Invulnerability: M.zoneGlobed)
      var rec = { by: u.id, from: { x: u.x, y: u.y }, lv: B.castLevel != null ? B.castLevel : 3 };
      B.overgrown = (B.overgrown || {}); sq.forEach(function (q) { B.overgrown[q[0] + ',' + q[1]] = rec; });
      FX.bloom(t.x, t.y, sq, 'moss'); D.sfx('nature');
      B.card([head + ': the grass heaves up thick and tangled -- ' + sq.length + ' squares of it, 20 ft to cross each.'], 280);
      yield 24;
    }
  };
  // Conjure Elemental (SRD 5.1, 5th, a minute to cast, concentration, an hour): cast at the camp (RULED 09-30, Griz: "Let's add the earth
  // elemental to camp and hold off on the rest"; js/camp.js CAST AHEAD), so it walks into the fight beside its caster, on his side, run by
  // the fight, with an initiative of its own. It goes at 0 HP. If his concentration breaks it does not go: it breaks loose, hostile to him and
  // his (SRD: "you lose control of the elemental, it becomes hostile toward you and your companions"), and it is a foe like any other then.
  // The kinds: the world's elementals of CR 5 or less (data/summons.js D.pool: the earth elemental, the xorn, and what is drawn later)
  W.elementals = function () { return D.pool('elemental', 5).map(function (p) { return p.kind; }).sort(function (a, b) { return (a === 'earthelemental' ? -1 : 0) - (b === 'earthelemental' ? -1 : 0); }); };
  W.seatConjured = function (B) {
    B.units.filter(function (u) { return u.conjured && G.standing(u); }).forEach(function (u) {
      var kind = D.FOES[u.conjured] ? u.conjured : W.elementals()[0]; if (!kind) return;
      var w = B.makeFoe({ id: 'conj-' + u.id, kind: kind }), spot = null, bd = Infinity;
      for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) {
        if (!G.canStand(w, x, y)) continue;
        var d = G.dist(u, { x: x, y: y, size: w.size || 1 }) + (y < u.y ? 0.5 : 0); if (d < bd) { bd = d; spot = [x, y]; }
      }
      if (!spot) return;
      w.x = spot[0]; w.y = spot[1]; w.side = u.side; w.guest = true; w.summon = { by: u.id, id: 'conjureelemental' }; w.name = u.name + '\'s ' + D.FOES[kind].name.toLowerCase();
      w.anim = 'idle'; w.animT = 0; w.flash = 0; w.reaction = 1; w.conds = w.conds || {}; w.facing = u.facing || 5;
      B.units.push(w);
      M.concentrate(B, u, 'conjureelemental', 'Conjure Elemental', function () { breakLoose(B, w, u); });
      u.conc.value = 500; // (the class AI never trades it for another concentration: that would loose it on its own side)
      delete u.conjured;
    });
  };
  function breakLoose(B, w, u) {
    if (!w.summon || w.dead || w.hp <= 0) return;
    delete w.summon; w.loose = true; w.side = u.side === 'party' ? 'foe' : 'party'; w.guest = true;
    FX.sparkle(w, 'stone', 16); D.sfx('earth');
    B.card(['{r}' + w.name + ' breaks loose!{/} It turns on ' + u.name + ' and ' + (u.side === 'party' ? 'the party' : 'its own') + '.'], 360);
    w.name = 'Loose ' + D.FOES[w.kind].name;
  }
  // the grid's extra cost of a square (grid.js stepCost): a Wall of Thorns' and Plant Growth's "every foot costs 4" -- a square is 20 ft to
  // cross, 15 over its own 5 (10-01: they had been 20 more, a square costing 25); where both lie, the one 4-for-1, not two
  G.extraAt = function (u, x, y) {
    if (u.ethereal) return 0;
    var w = G.wallAt(x, y), B = D.battle, n = w && w.cost ? w.cost : 0;
    var og = B && B.overgrown && B.overgrown[x + ',' + y]; // (the casting's record: a square inside a globe it was cast from outside of is no part of it -- M.zoneGlobed)
    if (og && !(M.zoneGlobed && M.zoneGlobed(B, og, { x: x, y: y })) && !(u.flies && !(u.conds && (u.conds.restrained || u.conds.prone)))) n = Math.max(n, 15);
    return n;
  };

  // ------------------------------------------------------------------ the look: each square of a wall, in the world's sort
  var P = function () { return D.PAL.ramps; };
  function hash(x, y, k) { var h = (x * 73856093) ^ (y * 19349663) ^ (k * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  W.props = function (B) {
    var out = [], iso = D.iso;
    (B.walls || []).forEach(function (w) {
      w.sq.forEach(function (q) {
        if (M.zoneGlobed && M.zoneGlobed(B, w, { x: q[0], y: q[1] })) return; // (no wall is drawn where the globe keeps it out)
        var gz = B.map.gz(q[0], q[1]);
        out.push({ depth: q[0] + q[1] + 0.5, gz: gz, layer: 1, draw: function (ctx) {
          var c = iso.center(q[0], q[1], gz), s = iso.toScreen(c.x, c.y), R = P(), t = B.t;
          if (w.kind === 'fire') {
            ctx.globalAlpha = 0.35 + 0.1 * Math.sin(t / 5 + q[0]); ctx.fillStyle = R.fire[1]; ctx.beginPath(); ctx.ellipse(s.x, s.y, 16, 7, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
            if (D.campfire) { D.campfire.flames(ctx, s.x - 8, s.y + 1, t + q[0] * 9 + q[1] * 5, 1.1); D.campfire.flames(ctx, s.x + 7, s.y - 1, t + q[0] * 5 + q[1] * 11 + 17, 1.3); D.campfire.flames(ctx, s.x, s.y + 4, t + q[0] * 13 + q[1] * 3 + 31, 0.9); }
          } else if (w.kind === 'thorns') {
            // a tangle: dark stems looping up out of the square, thorns on them, a leaf or two
            ctx.fillStyle = R.moss[0]; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(s.x, s.y - 4, 17, 9, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; // (the thicket's dark mass)
            ctx.strokeStyle = R.moss[0]; ctx.lineWidth = 2;
            for (var k = 0; k < 9; k++) {
              var x0 = s.x - 14 + hash(q[0], q[1], k) * 28, h = 18 + hash(q[0], q[1], k + 9) * 16, lean = (hash(q[0], q[1], k + 3) - 0.5) * 16;
              ctx.beginPath(); ctx.moveTo(x0, s.y + 3); ctx.quadraticCurveTo(x0 + lean, s.y - h * 0.6, x0 + lean * 0.4, s.y - h); ctx.stroke();
              ctx.fillStyle = R.bone[1]; ctx.fillRect(Math.round(x0 + lean * 0.5), Math.round(s.y - h * 0.5), 1, 1); ctx.fillRect(Math.round(x0 + lean * 0.7 + 2), Math.round(s.y - h * 0.3), 1, 1);
            }
            ctx.strokeStyle = R.moss[2]; ctx.lineWidth = 1;
            for (var j = 0; j < 3; j++) { var x1 = s.x - 10 + hash(q[0], q[1], j + 20) * 20; ctx.beginPath(); ctx.moveTo(x1, s.y + 2); ctx.quadraticCurveTo(x1 - 6, s.y - 10, x1 + 3, s.y - 18 - j * 3); ctx.stroke(); }
            ctx.lineWidth = 1;
          } else if (w.kind === 'stone') {
            // a block of the floor's own stone, standing a man's height
            var hw = iso.TW / 2, hh = iso.TH / 2, H = 30;
            ctx.fillStyle = R.stone[1]; ctx.beginPath(); ctx.moveTo(s.x - hw, s.y); ctx.lineTo(s.x, s.y + hh); ctx.lineTo(s.x, s.y + hh - H); ctx.lineTo(s.x - hw, s.y - H); ctx.closePath(); ctx.fill();
            ctx.fillStyle = R.stone[0]; ctx.beginPath(); ctx.moveTo(s.x + hw, s.y); ctx.lineTo(s.x, s.y + hh); ctx.lineTo(s.x, s.y + hh - H); ctx.lineTo(s.x + hw, s.y - H); ctx.closePath(); ctx.fill();
            ctx.fillStyle = R.stone[2]; ctx.beginPath(); ctx.moveTo(s.x, s.y - hh - H); ctx.lineTo(s.x + hw, s.y - H); ctx.lineTo(s.x, s.y + hh - H); ctx.lineTo(s.x - hw, s.y - H); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = R.outline[0]; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(s.x, s.y + hh); ctx.lineTo(s.x, s.y + hh - H); ctx.stroke(); ctx.globalAlpha = 1;
          } else if (w.kind === 'wind') {
            // streaks of air torn upward
            ctx.strokeStyle = R.bone[2]; ctx.lineWidth = 1;
            for (var m = 0; m < 4; m++) {
              var ph = ((t * 1.6 + m * 23 + q[0] * 7 + q[1] * 11) % 60) / 60, yy = s.y + 4 - ph * 34, xx = s.x - 10 + m * 7 + Math.sin(t / 7 + m) * 3;
              ctx.globalAlpha = 0.6 * (1 - ph); ctx.beginPath(); ctx.moveTo(xx, yy + 6); ctx.quadraticCurveTo(xx + 4, yy + 2, xx + 1, yy - 4); ctx.stroke();
            }
            ctx.globalAlpha = 1;
          }
        } });
      });
    });
    return out;
  };
})();
