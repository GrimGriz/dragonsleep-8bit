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
  G.standing = function (u) { return G.present(u) && u.hp > 0; };
  G.occupant = function (x, y, except) {
    for (var i = 0; i < G.units.length; i++) {
      var u = G.units[i];
      if (u === except || !G.present(u)) continue;
      var s = u.size || 1;
      if (x >= u.x && y >= u.y && x < u.x + s && y < u.y + s) return u;
    }
    return null;
  };
  G.hostile = function (a, b) { return a.side !== b.side; };
  G.gzAt = function (u, x, y) { var z = 0; G.foot(u, x, y).forEach(function (p) { z = Math.max(z, G.map.gz(p[0], p[1])); }); return z; };
  function walkable(x, y) { var s = G.map.at(x, y); return !!(s && s.walk); }
  // Earth Glide (the xorn, the earth elemental; js/traits.js): through the rock ('#', the stalagmites), never a built wall, and it stands only
  // on open ground (pass: a square it may go through)
  function glides(u, x, y) { var s = G.map.at(x, y); return !!(u && u.earthGlide && s && (s.ch === '#' || s.ch === 'P') && x > 0 && y > 0 && x < G.map.w - 1 && y < G.map.h - 1); }
  function footWalkable(u, x, y, pass) {
    var f = G.foot(u, x, y), lo = 1e9, hi = -1e9;
    for (var i = 0; i < f.length; i++) {
      if (!walkable(f[i][0], f[i][1]) && !(pass && glides(u, f[i][0], f[i][1]))) return false;
      var z = G.map.gz(f[i][0], f[i][1]); lo = Math.min(lo, z); hi = Math.max(hi, z);
    }
    return hi - lo <= G.map.def.step; // a Large body can straddle one step, not the ledge
  }
  // may u end its move here (o.ghost: an ethereal mover ignores creatures)
  G.canStand = function (u, x, y, o) {
    if (!footWalkable(u, x, y)) return false;
    if (o && o.ghost) return true;
    var f = G.foot(u, x, y);
    for (var i = 0; i < f.length; i++) if (G.occupant(f[i][0], f[i][1], u)) return false;
    return true;
  };
  // may u pass through here (allies yes, foes no; a creature who is down still blocks its foes)
  G.canPass = function (u, x, y, o) {
    if (!footWalkable(u, x, y, true)) return false;
    if (o && o.ghost) return true;
    var f = G.foot(u, x, y);
    for (var i = 0; i < f.length; i++) { var w = G.occupant(f[i][0], f[i][1], u); if (w && G.hostile(u, w)) return false; }
    return true;
  };
  G.stepCost = function (u, x0, y0, x1, y1, o) {
    if (!G.canPass(u, x1, y1, o)) return Infinity;
    if (Math.abs(G.gzAt(u, x1, y1) - G.gzAt(u, x0, y0)) > G.map.def.step) return Infinity;
    var dx = x1 - x0, dy = y1 - y0;
    if (dx && dy && !footWalkable(u, x0 + dx, y0, true) && !footWalkable(u, x0, y0 + dy, true)) return Infinity; // no squeezing between two rocks at a corner
    if (o && o.ghost) return 5;
    // frightened (SRD): not one step nearer the one it fears, while that one stands
    var fr = u.conds && u.conds.frightened;
    if (fr && fr.by) { var src = G.units.filter(function (w) { return w.id === fr.by; })[0]; if (src && G.standing(src) && G.dist(u, src, x1, y1) < G.dist(u, src, x0, y0)) return Infinity; }
    var f = G.foot(u, x1, y1);
    // a creature bound to its ground (the otyugh will not leave its pool: bound '~') moves only there, and not slowed by it
    if (u.bound) { for (var j = 0; j < f.length; j++) if (u.bound.indexOf(G.map.at(f[j][0], f[j][1]).ch) < 0) return Infinity; }
    for (var i = 0; i < f.length; i++) { var s = G.map.at(f[i][0], f[i][1]); if ((s.difficult && !(u.bound && u.bound.indexOf(s.ch) >= 0) && !(u.swims && s.ch === '~')) || (!u.webWalker && D.magic && D.battle && D.magic.webbed(D.battle, f[i][0], f[i][1])) || (D.magic && D.battle && D.magic.icy && D.magic.icy(D.battle, f[i][0], f[i][1])) || (D.magic && D.battle && D.magic.rough && D.magic.rough(D.battle, f[i][0], f[i][1], u))) return 10; } // (a web, the ice of a Sleet Storm, a spell's ground: grease, vines, spikes, the guardians' ring)
    return 5;
  };
  var N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  // Dijkstra from where u stands out to `budget` feet: { 'x,y': { x, y, cost, prev, stand } }
  G.reach = function (u, budget, o) {
    var out = {}, k0 = u.x + ',' + u.y, open = [{ x: u.x, y: u.y, cost: 0 }];
    out[k0] = { x: u.x, y: u.y, cost: 0, prev: null, stand: true };
    while (open.length) {
      open.sort(function (a, b) { return a.cost - b.cost; });
      var c = open.shift();
      if (c.cost > out[c.x + ',' + c.y].cost) continue;
      for (var i = 0; i < 8; i++) {
        var nx = c.x + N8[i][0], ny = c.y + N8[i][1];
        var sc = G.stepCost(u, c.x, c.y, nx, ny, o);
        if (sc === Infinity) continue;
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
    return Math.max(dx, dy) * 5;
  };
  G.inReach = function (a, b, ax, ay, reach) { return G.dist(a, b, ax, ay) <= (reach || a.reach || 5); };
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
  G.losPoint = function (x0, y0, x1, y1) {
    var L = G.line(x0, y0, x1, y1);
    for (var i = 0; i < L.length; i++) { var s = G.map.at(L[i][0], L[i][1]); if (!s || !s.open) return false; }
    return true;
  };
  // creature to creature: { clear, cover (0 or 2), why } -- the best line over both footprints
  G.los = function (a, b, ax, ay) {
    var fa = G.foot(a, ax, ay), fb = G.foot(b), best = { clear: false, cover: 9, why: 'a wall' };
    fa.forEach(function (pa) {
      fb.forEach(function (pb) {
        var L = G.line(pa[0], pa[1], pb[0], pb[1]), cover = 0, why = '', clear = true;
        for (var i = 0; i < L.length; i++) {
          var x = L[i][0], y = L[i][1];
          if (x === pa[0] && y === pa[1]) continue;
          var s = G.map.at(x, y);
          if (!s || !s.open) { clear = false; break; }
          var inA = x >= (ax == null ? a.x : ax) && y >= (ay == null ? a.y : ay) && x < (ax == null ? a.x : ax) + (a.size || 1) && y < (ay == null ? a.y : ay) + (a.size || 1);
          var inB = x >= b.x && y >= b.y && x < b.x + (b.size || 1) && y < b.y + (b.size || 1);
          if (inA || inB) continue;
          if (s.pillar) { cover = 2; why = s.stands || 'a stalagmite'; }
          var w = G.occupant(x, y);
          if (w && w !== a && w !== b && cover < 2) { cover = 2; why = w.name; }
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
