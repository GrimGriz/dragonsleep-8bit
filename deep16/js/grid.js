/* DEEP16 — grid: 5-ft squares. Movement (8 neighbours; every diagonal 5 ft -- the DMG's 5-10-5 is off; difficult
   terrain x2; a step of elevation up or down is fine, the ledge's full height is not), footprints (a Large creature
   holds 2x2 from its x,y), reach, line of sight and cover (a wall breaks it; a stalagmite or a creature between gives
   half cover), area templates (the DMG's count-the-squares), and flanking (the DMG optional rule, RULED 09-26d on). */
'use strict';
(function () {
  var D = window.D16;
  var G = D.grid = {};
  G.setup = function (map, units) { G.map = map; G.units = units; };

  G.foot = function (u, x, y) {
    x = x == null ? u.x : x; y = y == null ? u.y : y;
    var s = u.size || 1, out = [];
    for (var j = 0; j < s; j++) for (var i = 0; i < s; i++) out.push([x + i, y + j]);
    return out;
  };
  // on the field: holds its space and can be seen (a hero who is down still lies there; an ethereal spider is elsewhere)
  G.present = function (u) { return !u.dead && !u.ethereal; };
  G.standing = function (u) { return G.present(u) && (u.hp > 0 || !!u.regenDown) && !(u.conds && u.conds.petrified); }; // (a statue -- petrified, js/grimoire.js M.petrify, 10-08 -- holds its square but is out of the fight) // (a troll down at 0 and knitting is still on the field to be struck -- fire or acid keeps it down: battle.js hurt, 10-05. It cannot act: RU.canAct reads its hit points)
  // the creature on a square: the one standing on its ground first, else one hanging over it. `o` (optional, G.bodyAt): the asker's own body -- then a hanger whose height does not
  // meet the asker's is no occupant (10-05, Griz: "see about being under climbing heroes (and a giant falling on someone)" -- the SRD 5.1 gives a creature a space at its height, so a
  // square under one clinging or hanging high enough is free to stand on and pass under, and a hanger hangs on over one standing there; what a fall onto it does: battle.js landOn)
  G.occupant = function (x, y, except, o) {
    var over = null;
    for (var i = 0; i < G.units.length; i++) {
      var u = G.units[i];
      if (u === except || !G.present(u) || u.riding || (u.flooding && u.kind === 'keeper')) continue; // (a familiar riding its wizard holds no square of its own; nor does the Keeper while it is the swirl about someone: js/keeper.js)
      var s = u.size || 1;
      if (x >= u.x && y >= u.y && x < u.x + s && y < u.y + s) {
        var hangs = !!(u.hang && G.hanging(u)) || G.aloft(u); // (a flier aloft over the square, as a hanger: G.aloft, 10-08)
        if (o && o.h != null && (hangs || o.hangs) && !G.sharesZ(u, o)) continue;
        if (hangs) { if (!over) over = u; continue; }
        return u;
      }
    }
    return over;
  };
  // a body's height in steps: 5 ft a size (SRD 5.1: a creature's space is a cube -- Medium 5 ft, Large 10, Huge 15); and where it would be at (x, y), for G.occupant -- its ground
  // there, or its hang (G.gzAt), and whether it hangs
  G.bodyH = function (u) { return 2 * ((u && u.size) || 1); };
  G.bodyAt = function (u, x, y) { return { z: G.gzAt(u, x, y), h: G.bodyH(u), hangs: !!(u.hang && G.hanging(u) && x === u.x && y === u.y) }; };
  // do u's body and the asker's (o) meet in height, at a square they share?
  G.sharesZ = function (u, o) { var st = G.map.def.step, lo = G.gzAt(u, u.x, u.y), hi = lo + G.bodyH(u) * st; return lo < o.z + o.h * st && o.z < hi; };
  G.hostile = function (a, b) { return a.side !== b.side; };
  G.gzAt = function (u, x, y) { if (u && u.hang && x === u.x && y === u.y && G.hanging(u)) return u.hang.z; var z = G.groundAt(u, x, y); return u && u.fz != null ? Math.max(z, u.fz) : z; };
  G.groundAt = function (u, x, y) { var z = 0; G.foot(u, x, y).forEach(function (p) { z = Math.max(z, G.map.gz(p[0], p[1])); }); return z; };
  // FLIGHT AT A HEIGHT (the grid's rules §2.17; RULED 10-08 on the lane's lean, Griz: "Where the mousewheel becomes the vertical selection - yes"): a flier's own height, `u.fz`,
  // absolute, in the map's drawing px (gz) -- null on the surface, where it goes over the tops as it always has; else the layer it holds, 5 ft a layer (two steps of 2.5 ft).
  // G.gzAt reads it, so distance (G.dist, height as a diagonal), sight (G.los), who shares a square (G.occupant, G.sharesZ) and reach all see a flier where it is. At a layer
  // it goes level over anything lower and not into anything higher (G.stepCost); rising or sinking 5 ft costs 5 ft of movement (SRD 5.1 Flying). It falls -- 1d6 a 10 ft,
  // prone -- when knocked prone, held, its speed 0, or it cannot act or fly (battle.js flyCheck); a floater (`floats`: the EyeGregore, RULED 10-06 "is hover-float not fly")
  // rises one layer at most over the ground it starts from, and hovers: it does not fall
  G.LAYER = function () { return 2 * G.map.def.step; };
  G.winged = function (u) { return !!(u && (u.flies || u.floats) && !u.dead && !(u.conds && (u.conds.restrained || u.conds.prone))); };
  G.aloft = function (u) { return !!(u && u.fz != null && !u.dead && u.fz > G.groundAt(u, u.x, u.y)); };
  // the feet of movement a rise or a sink of dz px costs (5 ft a layer, to the 5)
  G.feetUp = function (dz) { return Math.ceil(Math.abs(dz) / G.map.def.step * 2.5 / 5) * 5; };
  // the highest layer it may take from where it is: a floater one layer over its ground; a flier the map's `sky` (ft over its lowest ground) or 30 ft over its highest
  G.flyTop = function (u) {
    if (u.floats) return G.groundAt(u, u.x, u.y) + G.LAYER();
    var m = G.map; if (m.loZ == null) { var lo = 1e9, hi = -1e9; for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) { var s = m.at(x, y); if (s && s.walk) { var z = m.gz(x, y); lo = Math.min(lo, z); hi = Math.max(hi, z); } } m.loZ = lo; m.hiZ = hi; }
    return m.def.sky != null ? m.loZ + m.def.sky / 2.5 * m.def.step : m.hiZ + 6 * G.LAYER();
  };
  // the move at a layer z: the squares it may end on, as G.reach's map -- flown level at the higher of where it is and z (it rises first, or sinks last), the rise or the sink
  // in each cost; an end square only where its ground is not above z. Its own square too, for a rise or a sink in place
  G.flyReach = function (u, z, budget) {
    var cur = G.gzAt(u, u.x, u.y), tr = Math.max(cur, z), v = G.feetUp(z - cur), f0 = u.fz, out = {};
    if (v > budget) return out;
    u.fz = tr;
    try { var rm = G.reach(u, budget - v); } finally { u.fz = f0; }
    Object.keys(rm).forEach(function (k) {
      var e = rm[k], st = e.stand && G.groundAt(u, e.x, e.y) <= z;
      // (sinking last, its body must be free where it ends -- at z, not only at the height it flew over at: 10-08, the flight bench, a giant bat flying in high sank onto
      // Lymen's square at Lymen's height -- dev/bench16.js mode=flyrings1008)
      if (st && z < tr) { var f1 = u.fz; u.fz = z > G.groundAt(u, e.x, e.y) ? z : null; try { st = G.canStand(u, e.x, e.y); } finally { u.fz = f1; } }
      out[k] = Object.assign({}, e, { cost: e.cost + v, stand: st, layer: z });
    });
    return out;
  };
  // ROPES (10-04, Griz: "can we add rope and tiny grapple next?" -- "1 yes, and a roped face is gonna be a movement stopping point"): a rope hangs from the top of a face
  // (`at`, the square it is fixed on) down to the square at its foot (`foot`): the battle's B.ropes, [{ at, foot, hp, by }] -- a map's own `ropes: [[ax, ay, fx, fy]]`, and
  // what a Rope & Grapple sets (battle.js exec 'rope'). On a roped face a climb takes no check and cannot fall (SRD 5.1: the GM's check is for a surface "with few handholds"),
  // up or down it, at the SRD's double cost still; one square's body only. A climber may stop on it part way, hanging: u.hang = { rope, z } (its height in drawing px), in the
  // foot's square -- G.gzAt reads it, so its height counts in G.dist and the drawing, and the rest of the climb is what a step to the top costs
  G.ropes = function () { var B = D.battle; return (B && B.ropes) || []; };
  G.hanging = function (u) { var h = u && u.hang, r = h && h.rope, foot = r ? r.foot : h && h.foot; return !!(h && (r ? !r.cut : !!h.face) && foot && u.x === foot[0] && u.y === foot[1]); }; // (on a rope, or clinging to a face part way up: u.hang.face -- a climb speed's cling, 10-04 night)
  // the rope a step from (x0, y0) to (x1, y1) goes along, if any: one end to the other, or from part way up it (a hanger) to either end
  G.ropeOn = function (u, x0, y0, x1, y1) {
    if ((u.size || 1) > 1 || u.climbs || G.winged(u)) return null; // (a climber or a flier goes up the face as it would without it)
    if (u.hang && x0 === u.x && y0 === u.y && G.hanging(u)) { var hr = u.hang.rope; return (x1 === hr.at[0] && y1 === hr.at[1]) ? hr : null; }
    var rs = G.ropes();
    for (var i = 0; i < rs.length; i++) { var r = rs[i]; if (r.cut) continue; if ((r.at[0] === x0 && r.at[1] === y0 && r.foot[0] === x1 && r.foot[1] === y1) || (r.foot[0] === x0 && r.foot[1] === y0 && r.at[0] === x1 && r.at[1] === y1)) return r; }
    return null;
  };
  // (deep water -- a map's `deepWater`, the Settling's pools, 09-30: only what lives there, bound to it or a swimmer, and a flier over it)
  function walkable(x, y, u) { var s = G.map.at(x, y); return !!(s && (s.walk || (s.deep && u && (u.flies || u.swims || (u.bound && u.bound.indexOf(s.ch) >= 0))))); }
  // Earth Glide (the xorn, the earth elemental; js/traits.js): through the rock ('#', the stalagmites), never a built wall, and it stands only
  // on open ground (pass: a square it may go through)
  function glides(u, x, y) { var s = G.map.at(x, y); return !!(u && u.earthGlide && s && (s.ch === '#' || s.ch === 'P') && x > 0 && y > 0 && x < G.map.w - 1 && y < G.map.h - 1); }
  // worked stone underfoot (a map's `noBurrow`: true, the whole floor; `noBurrowAt`, rects [x, y, w, h] of its squares (the Wet's rim, 10-04); or a string of the squares' characters, '=' the made road where it is
  // whole -- data/maps.js's header, 10-01d): nothing burrows under it or comes up through it
  G.solidFloor = function (x, y) {
    var def = G.map && G.map.def, nbA = def && def.noBurrowAt; // (10-04, Griz, the Wet: "The tiles around the Landlords pool should be switched to solid stone": rects in the grid's squares)
    if (nbA && nbA.some(function (r) { return x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3]; })) return true;
    var nb = def && def.noBurrow; if (!nb) return false; if (nb === true) return true;
    var s = G.map.at(x, y); return !!(s && String(nb).indexOf(s.ch) >= 0);
  };
  function footWalkable(u, x, y, pass) {
    var f = G.foot(u, x, y), lo = 1e9, hi = -1e9;
    for (var i = 0; i < f.length; i++) {
      if (!walkable(f[i][0], f[i][1], u) && !(pass && glides(u, f[i][0], f[i][1]))) return false;
      if (u && u.under && G.solidFloor(f[i][0], f[i][1])) return false; // (under the ground, worked stone stops it: a map's noBurrow, 10-01d)
      var z = G.map.gz(f[i][0], f[i][1]); lo = Math.min(lo, z); hi = Math.max(hi, z);
    }
    var dd = G.map.def; // a Large body can straddle one step, not the ledge -- on a map that lets cliffs be climbed, as many steps as `climbLarge` (two by default: 10-04, Griz: the Large creatures)
    // passing over a cliff's edge there, it may straddle any height on its way down (half on the top, half off it, then the drop); it never stops so, and the climb up is held to
    // `climbLarge` by G.stepCost, the body's height being its highest square (G.gzAt) -- 10-04, the ogre on the Climbing Floor's 10 ft tower could not get down
    if (pass && dd.climb && f.length > 1) return true;
    return hi - lo <= dd.step * (dd.climb && f.length > 1 ? (u && u.climbs ? 1e9 : G.bigLimit(u)) : 1); // (a big body straddles what it can climb by hand -- its height and 5 ft, G.bigLimit; a climber any height, hanging on the lip: 10-04 night)
  }
  // may u end its move here (o.ghost: an ethereal mover ignores creatures)
  // (a wall's squares, js/walls.js: nothing stands or passes in stone; a small flier does not cross the wind)
  function wallBars(u, x, y) { if (!G.wallAt) return false; var f = G.foot(u, x, y); for (var i = 0; i < f.length; i++) { var w = G.wallAt(f[i][0], f[i][1]); if (w && (w.solid || (w.kind === 'wind' && u.flies && (u.size || 1) <= 1))) return true; } return false; }
  G.canStand = function (u, x, y, o) {
    if (!footWalkable(u, x, y)) return false;
    if (wallBars(u, x, y)) return false;
    if (o && o.ghost) return true;
    var f = G.foot(u, x, y), bz = G.bodyAt(u, x, y); // (by height: under one hanging high enough is open -- 10-05)
    for (var i = 0; i < f.length; i++) if (G.occupant(f[i][0], f[i][1], u, bz)) return false;
    return true;
  };
  // may u pass through here (allies yes, foes no; a creature who is down still blocks its foes)
  G.canPass = function (u, x, y, o) {
    if (!footWalkable(u, x, y, true)) return false;
    if (wallBars(u, x, y)) return false;
    if (o && o.ghost) return true;
    var f = G.foot(u, x, y), bz = G.bodyAt(u, x, y);
    for (var i = 0; i < f.length; i++) { var w = G.occupant(f[i][0], f[i][1], u, bz); if (w && G.hostile(u, w)) return false; }
    return true;
  };
  G.stepCost = function (u, x0, y0, x1, y1, o) {
    if (!G.canPass(u, x1, y1, o)) return Infinity;
    if (G.shellBars && !(o && o.ghost) && G.shellBars(u, x0, y0, x1, y1)) return Infinity; // (an Antilife Shell: js/walls.js)
    if (u.fz != null && G.winged(u)) return G.groundAt(u, x1, y1) > u.fz ? Infinity : 5; // (holding a layer: level over anything lower, not into anything higher -- flight at a height, 10-08)
    if (u.floats && G.winged(u)) return G.groundAt(u, x1, y1) - G.groundAt(u, x0, y0) > G.LAYER() ? Infinity : 5; // (a floater: up one layer at most, down any -- it hovers, RULED 10-06)
    if (G.winged(u)) return 5; // (a flier -- a familiar owl or bat: no ledge too high, no ground slows it; a held one is restrained -- a grapple is one here, battle.js -- no `grappled` key to read)
    var dzS = G.gzAt(u, x1, y1) - G.gzAt(u, x0, y0), stS = G.map.def.step;
    // (a cliff: a map's `climb` -- the steps a body of one square may scale or drop, SRD 5.1 Climbing and Falling; up costs 1 extra foot a foot (G.stepCost below), and a Strength (Athletics) check, battle.js moveAlong; a drop of under 10 ft is free)
    var clS = G.map.def.climb, limS = u.climbs ? Infinity : (u.size || 1) > 1 ? G.bigLimit(u) : clS; // (a big body climbs its height and 5 ft by hand, or the map's `climbLarge` where set -- G.bigLimit; a one-square body, `climb`; one with a climb speed, any face)
    // (down, any height there: it is a fall, battle.js moveAlong -- 10-04; up, the limit)
    if (u.keepLevel && dzS <= -4 * stS) return Infinity; // (one that holds its level -- the Skylights' garrison on the roof: no step down 10 ft or more, no rope down; his play of 10-05 had the sergeant drop 42 ft after a troll and a trooper land on a trooper)
    if (Math.abs(dzS) > stS && !(clS && (dzS < 0 || dzS <= limS * stS)) && !(o && o.roped)) return Infinity; // (o.roped: along a rope, any height -- G.ropeOn)
    var dx = x1 - x0, dy = y1 - y0;
    if (dx && dy && !footWalkable(u, x0 + dx, y0, true) && !footWalkable(u, x0, y0 + dy, true)) return Infinity; // no squeezing between two rocks at a corner
    if (o && o.ghost) return 5;
    // frightened (SRD): not one step nearer the one it fears, while that one stands
    var fr = u.conds && u.conds.frightened;
    if (fr && fr.by) { var src = G.units.filter(function (w) { return w.id === fr.by; })[0]; if (src && G.standing(src) && G.dist(u, src, x1, y1) < G.dist(u, src, x0, y0)) return Infinity; }
    var f = G.foot(u, x1, y1);
    // a creature bound to its ground (the otyugh will not leave its pool: bound '~') moves only there, and not slowed by it
    if (u.bound) { for (var j = 0; j < f.length; j++) if (u.bound.indexOf(G.map.at(f[j][0], f[j][1]).ch) < 0) return Infinity; }
    var extra = G.extraAt ? G.extraAt(u, x1, y1) : 0; // (Wall of Thorns, Plant Growth: 4 ft of movement a foot -- 20 more a square; js/walls.js)
    if (u.conds && u.conds.freeMove) return 5 + extra; // (Freedom of Movement: no ground slows it; the thorns are the wall's, not the ground's)
    for (var i = 0; i < f.length; i++) { var s = G.map.at(f[i][0], f[i][1]); if ((s.difficult && !(u.bound && u.bound.indexOf(s.ch) >= 0) && !(u.swims && (s.ch === '~' || s.deep)) && !u.landsStride) || (!u.webWalker && D.magic && D.battle && D.magic.webbed(D.battle, f[i][0], f[i][1])) || (D.magic && D.battle && D.magic.icy && D.magic.icy(D.battle, f[i][0], f[i][1])) || (D.magic && D.battle && D.magic.rough && D.magic.rough(D.battle, f[i][0], f[i][1], u))) return 10 + extra; } // (a web, the ice of a Sleet Storm, a spell's ground: grease, vines, spikes, the guardians' ring)
    return 5 + extra;
  };
  var N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  // Dijkstra from where u stands out to `budget` feet: { 'x,y': { x, y, cost, prev, stand } }
  G.reach = function (u, budget, o) {
    var out = {}, k0 = u.x + ',' + u.y, open = [{ x: u.x, y: u.y, cost: 0 }], fear = !!(G.map.def.climb && !(o && o.ghost) && (u.side !== 'party' || u.guest)); // (AI-run as battle.js byAI reads it: a hand's hero -- a ?npc= party's class NPCs too -- reckons its own falls)
    out[k0] = { x: u.x, y: u.y, cost: 0, prev: null, stand: true };
    while (open.length) {
      open.sort(function (a, b) { return a.cost - b.cost; });
      var c = open.shift();
      if (c.cost > out[c.x + ',' + c.y].cost) continue;
      for (var i = 0; i < 8; i++) {
        var nx = c.x + N8[i][0], ny = c.y + N8[i][1];
        var sc = G.stepCost(u, c.x, c.y, nx, ny, o);
        if (sc === Infinity) continue;
        if (fear) sc += G.fallFear(u, c.x, c.y, nx, ny); // (an AI-run walker weighs a fall: G.fallFear)
        if (o && o.maxStep && sc > o.maxStep) continue; // (a step dearer than a whole move can never be taken: the AI's far route, ai.js approach)
        var nc = c.cost + sc;
        if (nc > budget) continue;
        var k = nx + ',' + ny;
        if (out[k] && out[k].cost <= nc) continue;
        out[k] = { x: nx, y: ny, cost: nc, prev: c.x + ',' + c.y, stand: G.canStand(u, nx, ny, o) };
        open.push({ x: nx, y: ny, cost: nc });
      }
    }
    return out;
  };
  // PRONE (SRD 5.1: "its only movement option is to crawl, unless it stands up"; standing "costs an amount of movement equal to half your speed",
  // a foot crawled costs 1 extra): a prone one that can pay the half stands first -- its reach is what is left (battle.js moveAlong stands it,
  // rules.js RU.rise) -- and one that cannot crawls, 5 ft more a square. (10-03, Griz after the stream: "prone too long?" -- knocked flat by an
  // opportunity Slam, Vivian ran on 20 ft lying down and lay there through the Keeper's turn.) o.upright: reckoned as stood; o.ghost: not walking
  var stepCost0 = G.stepCost, reach0 = G.reach;
  G.prone = function (u, o) { return !!(u && u.conds && u.conds.prone && u.hp > 0 && !(o && (o.ghost || o.upright))); };
  G.stepCost = function (u, x0, y0, x1, y1, o) {
    var rp = !(o && o.noRope) && G.ropeOn(u, x0, y0, x1, y1), c = stepCost0.call(this, u, x0, y0, x1, y1, rp ? Object.assign({}, o, { roped: true }) : o);
    if (c !== Infinity && G.prone(u, o)) c += 5;
    if (c === Infinity) return c;
    if (rp) return c + Math.max(0, Math.round(Math.abs(G.gzAt(u, x1, y1) - G.gzAt(u, x0, y0)) / G.map.def.step) * 5 - 5); // (along a rope, up or down: 5 ft of movement a step, the square's own 5 in it)
    if (u.hang && x0 === u.x && y0 === u.y && G.hanging(u) && !G.climbOn(u, x1, y1)) return c + Math.round((u.hang.z - G.map.gz(u.x, u.y)) / G.map.def.step) * 5; // (off a rope part way up, anywhere but its top: down it first, 5 ft a step; a clinger's own face, or the lip beside it, is the climb on, below)
    // (monsters' climb spots three apart along a face -- 10-05, Griz: "can we make the monsters valid wall climb spots 3 rows apart from each other?": a foe's step up a face, onto a face
    // square or the climb on from a cling, is no step where another foe clings within two squares of that square; its own face stays its own)
    if (u.side === 'foe' && G.map.def.climb && G.gzAt(u, x1, y1) - G.gzAt(u, x0, y0) > G.map.def.step && !(u.hang && u.hang.face && x1 === u.hang.face[0] && y1 === u.hang.face[1]) && G.units.some(function (w) { return w !== u && w.side === 'foe' && w.hang && w.hang.face && G.hanging(w) && Math.max(Math.abs(w.hang.face[0] - x1), Math.abs(w.hang.face[1] - y1)) < 3; })) return Infinity;
    var ssw = (u.subclass === 'Thief' || u.subclass === 'the Grey Road') && u.lvl >= 3; // (the Grey Road's PIT-WISE, 3, ours 10-08, the same: climbing costs no extra movement) (Second-Story Work, SRD 5.1, the Thief's 3: "climbing no longer costs you extra movement" -- the face's distance, 2.5 ft a step, as a climb speed's; the Athletics check stands. The grid's rules §2d, 10-08)
    var cs = G.climbsUp(u, x0, y0, x1, y1); if (cs) c += (ssw ? Math.ceil(cs * 2.5 / 5) * 5 : cs * 5) - 5;
    // a creature with a climb speed (SRD 5.1: "doesn't need to spend extra movement to climb" -- the climb itself is still distance): 2.5 ft of movement a step, rounded up to the
    // 5, the square's own 5 folded in -- a 45 ft face is 45, not 5 (it was the square's 5 alone; 10-04 night, the Edifice: "the monster has to climb up the ediface")
    // ... and no more of it a turn than its climb speed (u.turn.climbLeft, rules.js startTurn): a face taller than that costs what this turn's climb can pay, and the climber hangs on it
    // part way (battle.js moveAlong: the cling) -- a troll at 10 ft a turn digs up the Edifice's 45 ft in five (10-04 night, Griz: "a slow climb speed, like they're forcefully digging their way into the walls")
    // ... and the way down the same (10-05 night, the spiders' handoff: a climber stepped off the Edifice's 45 ft lip for one square's cost -- the way down clings part way too, battle.js moveAlong)
    if (!cs && u.climbs && G.map.def.climb) { var csC = Math.abs(Math.round((G.gzAt(u, x1, y1) - G.gzAt(u, x0, y0)) / G.map.def.step)); if (csC > 1) { var hC = Math.ceil(csC * 2.5 / 5) * 5, budC = u.turn ? Math.floor(Math.min(u.turn.move, u.turn.climbLeft != null ? u.turn.climbLeft : u.climbs) / 5) * 5 : hC; if (budC < 5) return Infinity; c += Math.min(hC, budC) - 5; } }
    var cd = u.cdown && G.climbsDown(u, x0, y0, x1, y1); if (cd) c += (ssw ? Math.ceil(cd * 2.5 / 5) * 5 : cd * 5) - 5; // (a hand that chose CLIMB DOWN: the same 5 ft a step down as up)
    return c;
  };
  // a clinger's climb on: its own face square, or a square beside that at the face's height (10-05, Griz: "a troll is climbing and I move Aurdin to the edge (apparently the row it's
  // climbing) and when it finishes its climb it walks into the fountain street without apparent fall damage" -- with its top square taken, the only path its reach map had was down the
  // face and round by the street; now it clambers over the lip beside the one who blocks it, as anyone would). The ground rule is unchanged: down the face costs the whole height
  G.climbOn = function (u, x1, y1) { var f = u.hang && u.hang.face; if (!f) return false; if (x1 === f[0] && y1 === f[1]) return true; var st = G.map.def.step; return Math.max(Math.abs(x1 - f[0]), Math.abs(y1 - f[1])) <= 1 && Math.abs(G.map.gz(x1, y1) - G.map.gz(f[0], f[1])) <= st && Math.max(Math.abs(x1 - u.x), Math.abs(y1 - u.y)) <= 1; };
  // a step DOWN a cliff taken by climbing (10-04, the Edifice handoff: "a drop of 10 ft or more offers CLIMB DOWN beside DROP"; SRD 5.1 Climbing: a climb down costs what a climb up does): the number of
  // steps, else 0. Read only for a unit with `cdown` set (battle.js exec 'move', for the hand that chose it); anyone else steps off a face as a drop, as before
  G.climbsDown = function (u, x0, y0, x1, y1) { var d = G.map && G.map.def; if (!(d && d.climb) || u.climbs || G.ropeOn(u, x0, y0, x1, y1) || G.winged(u)) return 0; var n = Math.round((G.gzAt(u, x0, y0) - G.gzAt(u, x1, y1)) / d.step); return n > 1 ? n : 0; };
  // a step up a cliff (more than one step of height, on a map that lets it be climbed): the number of steps it climbs, else 0. Each foot climbed costs an extra foot (SRD 5.1): a step is 2.5 ft,
  // so 5 ft of movement a step climbed, the square's own 5 folded in -- a 5 ft ledge 10, 10 ft 20, 15 ft 30, 30 ft 60, and a tall face takes the Dash (10-04, Griz: "it coming out a dash is correct,
  // adjust our cost to SRD"; it was the extra foot alone, 35 for 30 ft). Over 5 ft the climb is a Strength (Athletics) check (G.climbDC; battle.js moveAlong): a miss drops it back
  // prone, and over 10 ft is a fall. A creature with a climb speed (SRD 5.1: "doesn't need to spend extra movement"; `climbs` off its stat block, data/foes.js) pays nothing more and makes no check
  G.climbsUp = function (u, x0, y0, x1, y1) { var d = G.map && G.map.def; if (!(d && d.climb) || u.climbs || G.ropeOn(u, x0, y0, x1, y1) || G.winged(u)) return 0; var n = Math.round((G.gzAt(u, x1, y1) - G.gzAt(u, x0, y0)) / d.step); return n > 1 ? n : 0; };
  // the check (10-04, Griz: "like an SRD DM would do" -- SRD 5.1: "at the GM's option, climbing a slippery vertical surface or one with few handholds requires a successful
  // Strength (Athletics) check"): a 5 ft ledge is pulled up onto, no check; over 5 ft, DC 10 for two steps and 2 more for each step above (7.5 ft 12, 10 ft 14, 15 ft 18, 30 ft 30). 0: none
  // a body bigger than Medium (10-04 night, Griz: "for creatures > medium their climbing 5 feet is their top 5 feet?" -- RULED on the build): its own height is a pull-up, so a Large
  // body (10 ft) takes a 15 ft face as a Medium takes a 5 ft ledge, no check, and a Huge (20 ft) 25 ft; the map's `climbLarge` overrides where it is set. In steps of 2.5 ft
  G.bigLimit = function (u) { var dd = G.map && G.map.def; return dd && dd.climbLarge != null ? dd.climbLarge : 2 + 4 * (((u && u.size) || 1) - 1); };
  // varied footholds (10-04 night, from the climbing handoff's lean -- Griz: "might be worth working in now"): a map's `faces: [[x, y, w, h, kind]]` names the squares whose face is
  // 'rough' (many handholds: no check to three steps, and the DC 4 easier) or 'slick' (wet stone, ice: the DC 5 harder); unnamed is sheer, as built. The face climbed is the
  // square climbed onto. Shelved faces are map drawing (a sill is two climbs)
  G.faceKind = function (x, y) { var fs = G.map && G.map.def && G.map.def.faces; if (!fs) return null; for (var i = 0; i < fs.length; i++) { var f = fs[i]; if (x >= f[0] && y >= f[1] && x < f[0] + (f[2] || 1) && y < f[1] + (f[3] || 1)) return f[4] || null; } return null; };
  G.climbDC = function (steps, u, kind) {
    var eff = steps - 4 * (((u && u.size) || 1) - 1); // (the pull-up a big body's height is)
    if (kind === 'rough') return eff > 3 ? 10 + 2 * (eff - 2) - 4 : 0;
    if (kind === 'slick') return eff > 2 ? 10 + 2 * (eff - 2) + 5 : 0;
    return eff > 2 ? 10 + 2 * (eff - 2) : 0;
  };
  // the climber's Strength (Athletics): its STR, and its proficiency for the classes that have the skill to pick (as breakFree reads it); a monster's own Athletics where its block gives one
  G.athletics = function (u) { return u.athletics != null ? u.athletics : D.mod(u.abil ? u.abil.str : 10) + ({ fighter: 1, barbarian: 1, paladin: 1, monk: 1, ranger: 1 }[u.cls] ? u.prof || 0 : 0); };
  // what a fall would cost an AI weighing the way (G.reach): a drop of 10 ft or more -- its d6s and the getting up; a climb that takes a check -- its odds of a miss, the move lost and,
  // over 10 ft, the fall. Movement in feet, for the reckoning only: the step itself still costs what G.stepCost says (10-04, the ogre: it should drop, but not for nothing)
  G.fallFear = function (u, x0, y0, x1, y1) {
    var d = G.map.def; if (!d.climb || G.winged(u) || u.climbs || G.ropeOn(u, x0, y0, x1, y1) || (u.hang && x0 === u.x && y0 === u.y && G.hanging(u))) return 0; // (a rope: no fall to fear)
    var dz = (G.gzAt(u, x1, y1) - G.gzAt(u, x0, y0)) / d.step, ft = Math.abs(dz) * 2.5, fall = ft >= 10 ? 10 * Math.floor(ft / 10) + 10 : 0;
    if (dz < 0) return fall;
    var cs = G.climbsUp(u, x0, y0, x1, y1), dc = G.climbDC(cs, u, G.faceKind(x1, y1)); if (!dc) return 0;
    var miss = Math.min(0.95, Math.max(0.05, (dc - G.athletics(u) - 1) / 20));
    return Math.round(miss * (30 + (ft > 10 ? fall : 0)));
  };
  G.reach = function (u, budget, o) {
    if (G.prone(u, o) && D.rules && D.rules.canRise(u)) { var half = D.rules.riseCost ? D.rules.riseCost(u) : Math.floor(u.speed / 2); if (budget >= half) return reach0.call(this, u, budget - half, Object.assign({}, o, { upright: true })); }
    return reach0.apply(this, arguments);
  };
  G.path = function (rm, x, y) {
    var k = x + ',' + y, out = [];
    if (!rm[k]) return null;
    while (rm[k] && rm[k].prev) { out.unshift([rm[k].x, rm[k].y]); k = rm[k].prev; }
    return out;
  };

  // distance in feet between two creatures' footprints (a is optionally stood at ax, ay)
  G.dist = function (a, b, ax, ay, bx, by) {
    ax = ax == null ? a.x : ax; ay = ay == null ? a.y : ay; bx = bx == null ? b.x : bx; by = by == null ? b.y : by;
    var as = a.size || 1, bs = b.size || 1;
    var dx = Math.max(0, bx - (ax + as - 1), ax - (bx + bs - 1)), dy = Math.max(0, by - (ay + as - 1), ay - (by + bs - 1));
    // height counts as a diagonal does (10-04, Griz: "height as distance for vis and opportunity attack?"): the larger of the across and the up, the up in whole 5 ft (a step is
    // 2.5 ft, rounded down -- a 5 ft ledge is still beside the floor under it, a 10 ft tower's top is 10 ft from its foot). Read only where a map rises 10 ft or more (G.tall)
    var dz = G.tall() ? Math.floor(Math.abs(G.gzAt(a, ax, ay) - G.gzAt(b, bx, by)) / G.map.def.step / 2) : 0;
    return Math.max(dx, dy, dz) * 5;
  };
  // does the map rise 10 ft (four steps) or more anywhere? (G.dist and the light read height only then: the flat maps pay nothing for it)
  G.tall = function () { var m = G.map; if (!m || !m.def || !m.def.step) return false; if (G.units && G.units.some(G.aloft)) return true; if (m.tallK == null) { var lo = 1e9, hi = -1e9; for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) { var s = m.at(x, y); if (s && s.walk) { var z = m.gz(x, y); lo = Math.min(lo, z); hi = Math.max(hi, z); } } m.tallK = hi - lo >= 4 * m.def.step; } return m.tallK; };
  // a creature's melee reach in feet, the one place it is read (Enlarge, 09-29: an enlarged creature reaches 5 ft further; reduced does
  // not go below its own). `base` is a weapon's own reach where it has one (a glaive, a giant's fist); ranged is nothing to do with it
  // (Enlarge and reach: the SRD 5.1 gives none -- +1d4, STR advantage, a size larger -- so the +5 ft is a house rule, off unless
  // D.RULES.enlargeReach is set; Griz 09-29: "check rules if you can, that was my remember guess")
  G.reachOf = function (u, base) { var e = u.conds && u.conds.enlarged; return (base || u.reach || 5) + (e && !e.down && D.RULES && D.RULES.enlargeReach ? 5 : 0); };
  G.inReach = function (a, b, ax, ay, reach) { return G.dist(a, b, ax, ay) <= G.reachOf(a, reach); };
  G.foesNear = function (u, x, y, ft) {
    return G.units.filter(function (w) { return G.standing(w) && G.hostile(u, w) && G.dist(u, w, x, y) <= (ft || 5); });
  };

  // squares a line from centre to centre passes through (sampled finely, so a corner counts)
  G.line = function (x0, y0, x1, y1) {
    var out = [], seen = {}, n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 6));
    for (var i = 0; i <= n; i++) {
      var t = i / n, px = x0 + 0.5 + (x1 - x0) * t, py = y0 + 0.5 + (y1 - y0) * t;
      var cands = [[Math.floor(px), Math.floor(py)]];
      if (Math.abs(px - Math.round(px)) < 0.02 && Math.abs(py - Math.round(py)) < 0.02) cands = []; // exactly on a corner: slips between
      cands.forEach(function (c) { var k = c[0] + ',' + c[1]; if (!seen[k]) { seen[k] = 1; out.push(c); } });
    }
    return out;
  };
  // a point's line of sight to another point: only rock blocks (for spells and templates)
  // a face stands in the way of the eye (10-04, Griz: "nigh-translucent walls ... that also impact vision"): where a map rises 10 ft or more (G.tall), a line from one eye to another is a
  // slope, and a square whose floor stands above it on the way is a wall to it -- the 15 ft tower blocked nothing before, the 45 ft facade hid no one on its top. An eye is 5 ft over
  // its floor (a Large one's 10 ft); `ez` is the floor's height at a square, the hanger's rope height where one hangs. Read nowhere on a flat map (G.tall false)
  G.eyeZ = function (u) { return ((u && (u.size || 1) >= 2) ? 4 : 2) * G.map.def.step; };
  G.overFloor = function (x0, y0, z0, x1, y1, z1) {
    var ddx = x1 - x0, ddy = y1 - y0, d2 = ddx * ddx + ddy * ddy; if (!d2) return false;
    var L = G.line(x0, y0, x1, y1);
    for (var i = 0; i < L.length; i++) {
      var x = L[i][0], y = L[i][1]; if ((x === x0 && y === y0) || (x === x1 && y === y1)) continue;
      var t = Math.max(0, Math.min(1, ((x - x0) * ddx + (y - y0) * ddy) / d2));
      if (G.map.gz(x, y) > z0 + (z1 - z0) * t + 0.01) return true;
    }
    return false;
  };
  G.losPoint = function (x0, y0, x1, y1) {
    if (G.tall() && G.overFloor(x0, y0, G.map.gz(x0, y0) + 2 * G.map.def.step, x1, y1, G.map.gz(x1, y1) + 2 * G.map.def.step)) return false;
    var L = G.line(x0, y0, x1, y1);
    for (var i = 0; i < L.length; i++) { var s = G.map.at(L[i][0], L[i][1]); if (!s || !s.open) return false; if (G.wallAt) { var w = G.wallAt(L[i][0], L[i][1]); if (w && w.solid && !(L[i][0] === x0 && L[i][1] === y0)) return false; } } // (a Wall of Stone as the rock)
    return true;
  };
  // the parapet (10-05, Griz, the Skylights: "I tried to shoot a troll climbing up the wall from standing on the ledge and couldn't"; on the fix, "yes, if that breaks SRD note we're
  // doing it just for this fight"): one standing up top within 20 ft of a climber's face square, and the climber clinging to the face below it, see each other past the lip's own
  // height -- the lip is a low wall between them, half cover (SRD 5.1 Cover: "a low wall"), where the floor-over-the-line test had made a wall of it (a climber 20 ft down was out of
  // sight from one row back; only the top 10 ft of the face could be seen). Read only for a climber on a face (u.hang.face); nothing else in the line's reading changes
  function parapet(a, pa, b, pb) {
    var st = G.map.def.step, one = function (top, pt, cl, pc) {
      var h = cl.hang; if (!h || !h.face || !G.hanging(cl) || pc[0] !== cl.x || pc[1] !== cl.y) return false;
      if (Math.max(Math.abs(pt[0] - h.face[0]), Math.abs(pt[1] - h.face[1])) > 4) return false;
      return G.map.gz(pt[0], pt[1]) >= G.map.gz(h.face[0], h.face[1]) - st;
    };
    return one(a, pa, b, pb) || one(b, pb, a, pa);
  }
  // creature to creature: { clear, cover (0 or 2), why } -- the best line over both footprints
  G.los = function (a, b, ax, ay, hide) { // (hide: b is hiding -- a creature in the line is cover only if it is a size larger than b, SRD 5.1; 10-04)
    var fa = G.foot(a, ax, ay), fb = G.foot(b), best = { clear: false, cover: 9, why: 'a wall' }, tl = G.tall(), zOf = function (u, p) { return u.hang && G.hanging && G.hanging(u) && p[0] === u.x && p[1] === u.y ? u.hang.z : u.fz != null ? Math.max(u.fz, G.map.gz(p[0], p[1])) : G.map.gz(p[0], p[1]); };
    fa.forEach(function (pa) {
      fb.forEach(function (pb) {
        var par = parapet(a, pa, b, pb); // (one at the lip, one clinging to the face under it: the lip is a low wall between them, half cover -- not the wall the floor test makes of it)
        if (tl && !par && G.overFloor(pa[0], pa[1], zOf(a, pa) + G.eyeZ(a), pb[0], pb[1], zOf(b, pb) + G.eyeZ(b))) return; // (a floor above the line: height is a wall)
        var L = G.line(pa[0], pa[1], pb[0], pb[1]), cover = par ? 2 : 0, why = par ? 'the parapet' : '', clear = true;
        for (var i = 0; i < L.length; i++) {
          var x = L[i][0], y = L[i][1];
          if (x === pa[0] && y === pa[1]) continue;
          var s = G.map.at(x, y);
          if (!s || !s.open) { clear = false; break; }
          var inA = x >= (ax == null ? a.x : ax) && y >= (ay == null ? a.y : ay) && x < (ax == null ? a.x : ax) + (a.size || 1) && y < (ay == null ? a.y : ay) + (a.size || 1);
          var inB = x >= b.x && y >= b.y && x < b.x + (b.size || 1) && y < b.y + (b.size || 1);
          if (inA || inB) continue;
          var wl = G.wallAt && G.wallAt(x, y); if (wl && wl.sight) { clear = false; break; } // (a wall of fire, thorns or stone: js/walls.js)
          if (s.pillar) { cover = 2; why = s.stands || 'a stalagmite'; }
          var w = G.occupant(x, y);
          if (w && w !== a && w !== b && cover < 2 && (!hide || (w.size || 1) > (b.size || 1))) { cover = 2; why = w.name; }
        }
        if (clear && (!best.clear || cover < best.cover)) best = { clear: true, cover: cover, why: why };
      });
    });
    if (!best.clear) best.cover = 0;
    return best;
  };

  // templates: a sphere is the squares whose centre lies within r feet of the origin square's centre and which the
  // origin can see; a cube is n x n squares from its corner
  G.sphere = function (cx, cy, rft) {
    var out = [], r = Math.ceil(rft / 5);
    for (var y = cy - r; y <= cy + r; y++) for (var x = cx - r; x <= cx + r; x++) {
      var s = G.map.at(x, y);
      if (!s || !s.open) continue;
      if (Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) * 5 > rft + 0.01) continue;
      if (!G.losPoint(cx, cy, x, y)) continue;
      out.push([x, y]);
    }
    return out;
  };
  G.cube = function (x0, y0, n) {
    var out = [];
    for (var y = y0; y < y0 + n; y++) for (var x = x0; x < x0 + n; x++) { var s = G.map.at(x, y); if (s && s.open) out.push([x, y]); }
    return out;
  };
  G.inArea = function (u, sq) {
    var f = G.foot(u);
    for (var i = 0; i < f.length; i++) for (var j = 0; j < sq.length; j++) if (f[i][0] === sq[j][0] && f[i][1] === sq[j][1]) return true;
    return false;
  };

  // flanking: an ally of the attacker, standing and able, adjacent to the target on the opposite side of it
  function side(x, y, t) {
    var s = t.size || 1;
    return [x < t.x ? -1 : x > t.x + s - 1 ? 1 : 0, y < t.y ? -1 : y > t.y + s - 1 ? 1 : 0];
  }
  G.flank = function (att, tgt, ax, ay) {
    ax = ax == null ? att.x : ax; ay = ay == null ? att.y : ay;
    if (G.dist(att, tgt, ax, ay) > 5) return null;
    var me = side(ax, ay, tgt);
    for (var i = 0; i < G.units.length; i++) {
      var w = G.units[i];
      if (w === att || w.side !== att.side || !G.standing(w) || !D.rules.canAct(w)) continue;
      if (G.dist(w, tgt) > 5) continue;
      var it = side(w.x, w.y, tgt);
      if (it[0] === -me[0] && it[1] === -me[1]) return w;
    }
    return null;
  };
})();
