/* DEEP16 — THE WORLD (10-20, the world map seat; the maps lane §2f). The second game's world map: his realm hex map's 5-mile hexes, baked from his EXPORT by
   tools/world-build.py into data/world.js (D16.WORLD), walked as one party token. deep16/?world (&fresh starts over, &at=q,r puts the party on a hex, &dev
   shows the day's number). His rulings (10-20, verbatim in the lane): "1 - yes, but leave room/alternate path for doing days by fiat/mission completion -
   unhooked from travel" -- the walk spends the SRD's hours, and W.passDays moves the calendar without a step; "when they reach the location it goes to the
   roam map"; "3 - yes, effectively icons on the world map that include angle of approach when putting you on the grid roam" -- a town is an icon, and the
   side the party comes from picks the gate it walks in at; "6 - like a decorated iso-preview? yes" -- the hex map's world look, at DEEP16's own 480 x 270.

   THE GOING (RULED 10-20, "SRD for world map"): the SRD's normal pace, 3 mi an hour, 24 a day of 8 hours; a hex of difficult ground (the terrain's `diff`)
   twice the hours; along a road or track the road's own going (a difficult road twice, the Coldridge Route); water and the Rift no one walks. Past 8 hours
   the party makes camp, and the camp's eight hours (the long rest) go by before the next step -- from when it lies down, 11-03; till then to the next morning (a forced march is not built). The clock is hours from the first morning; its day is
   never shown as a number (the clock lane's rule) but in the sky -- &dev shows it. */
'use strict';
(function () {
  var D = window.D16 = window.D16 || {}, I = D.input;
  var W = D.world = {};
  var SQ3 = Math.sqrt(3), TILT = 0.62, STEPF = 28; // (frames a hex takes to walk: 14 till 10-21 night, when Silverton to the Guano Mine "feels short" -- RULED his "The screen": the miles and the SRD's pace kept, the token slower, the sky turning as the hours pass)
  W.PACE = 3; W.DAYHOURS = 8; W.MORNING = 7; // (the SRD: 3 mi an hour, 8 hours a day; the day starts at seven)
  W.FIGHT_HOURS = 0.25; // (a road fight and its breath on the clock: fifteen minutes since 10-28 later, his "fights should burn 15 minutes instead of an hour of worldtime" -- an hour before)
  W.ZOOMS = [3.2, 4.4, 6, 8.5, 12]; // (px a mile: a 5-mile hex 16 to 60 px across)
  // the places with a door (his "when they reach the location it goes to the roam map"): only what is built; the rest say so
  W.DOORS = { silverton: { roam: 'silverton', gates: { west: [-1, 0], south: [0, 1], east: [0.5, 0.866] } }, // (the east gate's way south-south-east since 10-28, his "aim more sse as the road out": out by it onto the hex south-east; js/town.js THE EAST SIDE)
    mouth: { roam: 'galleries', gates: { east: [1, 0], south: [0, 1], west: [-1, 0] } }, // (the Guano Galleries' mouth, its top floor on the town's tiles: js/mines.js, 10-21 night)
    warrens: { roam: 'warrens', gates: { feed: [1, 0] } }, // (the Crawler Warrens' mouth camp: no site of its own -- Silverton's feed track opens it, js/mines.js; here so the house's save loads there)
    glowseep: { roam: 'glowseep', gates: { east: [1, 0], north: [0, -1], south: [0, 1], west: [-1, 0] } } }; // (the Glowseep: the light-crews' ground by the mile, its camp and its fights -- js/mines.js, 10-21 night; west since 10-28, his "Any edge walk")
  W.KEY = 'deep16.world'; W.ROUTES_ON = false; // (the roads up into the mountains, held: W.index)

  // ---------------------------------------------------------------- the baked world, indexed (the hex map's axial pointy-top hexes; a step is a neighbour)
  // THE SILVERTON AREA (10-22, RULED, Griz: "2 - 1.5 mile hexes", on his "3 - most of the world map is between silverton and the other locations - so a zoom
  // where its somewhere between 4-10 hexes to the fork in the road and a few more down to the glowseep. Whats a good zoom that shows about what the old corridor
  // map did?"): two maps, one plane of miles -- THE WORLD's 5-mile hexes (D.WORLD, 'world') and the Silverton area's of a mile and a half (D.WORLD_NEAR, 'near',
  // tools/near-build.py), the corridor's span. M is the map the party is on (S.map); a step off the area's edge is a step onto THE WORLD, a step into it from
  // THE WORLD puts the party on the area at that hex's middle, and a walk to a point beyond goes on across the edge (W.planTo). &far keeps THE WORLD alone
  var M = null, MS = {}, SRC = {};
  function K(q, r) { return q + ',' + r; }
  function hcw(q, r, w) { return [w * (q + r / 2), w * SQ3 / 2 * r]; }
  function hc(q, r) { return hcw(q, r, M.w); }
  function round(qf, rf) {
    var x = qf, z = rf, y = -x - z, rx = Math.round(x), ry = Math.round(y), rz = Math.round(z), dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
    return [rx + 0, rz + 0];
  }
  function atw(x, y, w) { var r = y / (w * SQ3 / 2); return round(x / w - r / 2, r); }
  function at(x, y) { return atw(x, y, M.w); }
  var DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  function rgb(c) { var m = /^#?([0-9a-f]{6})$/i.exec(c || ''); if (!m) return [200, 0, 200]; var n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  W.index = function () {
    if (!D.WORLD) return null;
    if (SRC.world !== D.WORLD) { MS.world = build(D.WORLD, 'world'); SRC.world = D.WORLD; }
    if (D.WORLD_NEAR && SRC.near !== D.WORLD_NEAR) { MS.near = build(D.WORLD_NEAR, 'near'); SRC.near = D.WORLD_NEAR; }
    M = MS[W.mapKey] || MS.world; W.mapKey = M.key; return M;
  };
  W.use = function (key) { if (MS[key]) { M = MS[key]; W.mapKey = key; } return M; }; // (the map the party walks)
  W.map = function (key) { return MS[key || W.mapKey] || null; };
  W.nearOn = function () { return !!MS.near && !W.far; };
  function build(B, key) {
    var m = { key: key, near: key === 'near', w: B.hexMi, hex: {}, terr: B.terr, sites: B.sites, paths: B.paths, link: {}, road: {}, siteAt: {}, col: {}, look: B.look || null, area: {}, exitAt: {}, pass: {}, pathById: {} };
    Object.keys(B.terr).forEach(function (k) { m.col[k] = rgb(B.terr[k].color); });
    if (B.look && !(LOOK && LOOK.v === B.look.v) && typeof Image === 'function') { var im = new Image(), lk = LOOK = { v: B.look.v, img: im, ok: false }; im.onload = function () { lk.ok = true; }; im.src = 'data/world-look.png?v=' + B.look.v; } // (THE LOOK, below: the solid tops till it comes)
    B.hexes.forEach(function (h) { m.hex[K(h[0], h[1])] = { q: h[0], r: h[1], t: h[2], h: h[3], wet: !!h[4], t2: h[5], sh2: h[6], guess: !!h[7], rd: !!h[8] }; }); // (guess: not painted, corridor v3's guess; rd: a road's hex, the area's)
    B.paths.forEach(function (P) {
      m.pathById[P.id] = P; if (P.kind === 'river') return;
      var held = !W.ROUTES_ON && /coldridge/i.test(P.name || '');
      if (held && !(m.near && P.upto != null)) return; // (the held road up to The DOORS: not a way on THE WORLD; on the area its climb to the shelf, tools/near-build.py COLD_SHELF_MI -- 11-03)
      var n = held ? P.upto + 1 : P.hexes.length;
      for (var i = 0; i < n; i++) {
        var a = K(P.hexes[i][0], P.hexes[i][1]); m.road[a] = m.road[a] || P;
        if (m.near && P.at) (m.pass[a] = m.pass[a] || []).push([P, i]); // (each pass of a way through a hex, in the way's order: THE ROAD FOLLOWED, W.route)
        if (i + 1 < n) { var b = K(P.hexes[i + 1][0], P.hexes[i + 1][1]); m.link[a + '|' + b] = m.link[b + '|' + a] = P; }
      }
      if (held) P.n = n;
    });
    B.sites.forEach(function (s) { var k = K(s.hex[0], s.hex[1]); (m.siteAt[k] = m.siteAt[k] || []).push(s); });
    // the roads up into the mountains (his, 10-20: "the coldridge route as a roam probably"): a door at each end, crossed in the road's ruled days till its
    // roam is built (the Coldridge Route, the Galleries junction to The DOORS: 3 days, RULED 10-17). HELD 10-22 (his "going up to the doors strands you there,
    // remove the option for now"): no road up is offered, so nothing reaches The DOORS -- m.held keeps them, W.ROUTES_ON brings them back
    m.routes = []; m.held = [];
    B.paths.forEach(function (P) {
      if (!/coldridge/i.test(P.name || '') || !P.ends) return;
      var a = B.sites.filter(function (s) { return s.id === P.ends[0]; })[0], b = B.sites.filter(function (s) { return s.id === P.ends[1]; })[0];
      if (a && b) (W.ROUTES_ON ? m.routes : m.held).push({ P: P, ends: [a, b], days: 3, name: 'the Coldridge Route' });
    });
    // each hex lit once (light from the north-west, high: 1 on the flat), as the hex map's world look lights it
    Object.keys(m.hex).forEach(function (k) {
      var e = m.hex[k], H = function (dq, dr) { var n = m.hex[K(e.q + dq, e.r + dr)]; return n ? n.h : e.h; };
      var gx = (H(1, 0) - H(-1, 0)) / (2 * m.w), gy = (H(0, 1) + H(-1, 1) - H(1, -1) - H(0, -1)) / (2 * m.w * SQ3), kk = 6 / 5280;
      var nl = Math.sqrt(gx * gx * kk * kk + gy * gy * kk * kk + 1), d = (0.503 * gx * kk + 0.503 * gy * kk + 0.704) / nl / 0.704;
      e.lit = Math.round(Math.max(0.45, Math.min(1.4, d)) * 16) / 16;
    });
    // the area's edge (the near map): THE WORLD's 5-mile hexes it covers, and each step off it -- the outside neighbour's key to THE WORLD's hex it steps onto
    if (m.near && B.area && MS.world) {
      B.area.hexes.forEach(function (k) { m.area[K(k[0], k[1])] = 1; });
      Object.keys(m.hex).forEach(function (k) {
        var e = m.hex[k];
        for (var d = 0; d < 6; d++) {
          var n = [e.q + DIRS[d][0], e.r + DIRS[d][1]], nk = K(n[0], n[1]); if (m.hex[nk] || m.exitAt[nk]) continue;
          var c = hcw(n[0], n[1], m.w), pw = atw(c[0], c[1], MS.world.w), pk = K(pw[0], pw[1]);
          if (!m.area[pk] && walkIn(MS.world, MS.world.hex[pk])) m.exitAt[nk] = pw;
        }
      });
      m.exits = Object.keys(m.exitAt).map(function (nk) { var p = nk.split(','); return { n: [+p[0], +p[1]], pw: m.exitAt[nk] }; });
    }
    return m;
  }
  W.hexAt = function (q, r) { return M && M.hex[K(q, r)] || null; };
  W.inArea = function (wq, wr) { return !!(MS.near && MS.near.area[K(wq, wr)]); }; // (a 5-mile hex of THE WORLD the Silverton area covers)
  W.worldHexOf = function (x, y) { return atw(x, y, MS.world.w); };
  // THE MOUNTAINS are not walked on the world map (his, 10-20: "the coldridge route as a roam probably, with up into and on mountain hexes not a thing on the
  // world map"): a mountain hex is drawn, never stepped on -- save a place on the range's skirt, stepped into from the low ground (the Galleries' mouth); a road
  // up into them is a door (W.ROUTES), its own roam to come
  W.MOUNTAIN = { black: 1, gray: 1, coastal: 1 };
  function walkIn(m, e) { var T = e && m.terr[e.t]; return !!(T && +T.cost && !W.MOUNTAIN[e.t]) || !!(e && (m.siteAt[K(e.q, e.r)] || (m.near && e.rd))); } // (the area's road hexes walk where the road goes)
  W.walkable = function (e) { return walkIn(M, e); }; // (water and the Rift: no one walks them -- Book III's cost 0 -- but a hex with a place in it has its shore: the inn on its lake)
  W.MARCHMI = 5; // (THE MARCH's hex: js/house.js H.DAYHEX of these a day; a smaller hex counts its share, st.share)
  // the hours a step from hex a to its neighbour b takes: the road's own going between two hexes of one road, else the ground's; on the area a step off its
  // edge (st.exit: THE WORLD's hex it steps onto, the hours to that hex's middle)
  W.stepHours = function (a, b, mm) {
    var m = mm || M, ea = m.hex[K(a[0], a[1])], eb = m.hex[K(b[0], b[1])];
    if (!eb && m.near && ea && !W.far) {
      var pw = m.exitAt[K(b[0], b[1])]; if (!pw) return null;
      var ew0 = MS.world.hex[K(pw[0], pw[1])]; if (W.MOUNTAIN[ew0.t] && W.MOUNTAIN[ea.t]) return null; // (never mountain to mountain: a school's hex up there from the low ground only)
      var ca = hcw(a[0], a[1], m.w), cw = hcw(pw[0], pw[1], MS.world.w), ew = ew0, go = +MS.world.terr[ew.t].cost && MS.world.terr[ew.t].diff ? 2 : 1, mi = Math.hypot(cw[0] - ca[0], cw[1] - ca[1]);
      return { h: mi * go / W.PACE, road: null, going: go, exit: pw, mi: mi, share: mi * go / W.MARCHMI };
    }
    if (!walkIn(m, eb)) return null;
    var road = m.link[K(a[0], a[1]) + '|' + K(b[0], b[1])];
    if (W.MOUNTAIN[eb.t] && ea && W.MOUNTAIN[ea.t] && !(m.near && road)) return null; // (a place in the mountains from the low ground only, never mountain to mountain -- but the area's roads)
    if (m.near && !road && ea && Math.abs(eb.h - ea.h) > W.STEEP * m.w) return null; // (too steep off a road: the Coldridge's face is the road's to climb, 11-03 THE ROAD FOLLOWED)
    var going = road ? (road.going || (road.difficult ? 2 : 1)) : (+m.terr[eb.t].cost && m.terr[eb.t].diff ? 2 : 1);
    return { h: m.w * going / W.PACE, road: road || null, going: going, share: m.w !== W.MARCHMI ? m.w * going / W.MARCHMI : undefined };
  };
  W.STEEP = 720; // (feet a mile: off a road on the area no step climbs or drops more -- 1,080 ft a hex, a 14% grade. Probed 11-03: of the area's 4,734 walkable neighbours only the Coldridge's face, under his road's hairpins, passes it; the next, a foothills pair by the Galleries road, 1,043)
  W.OFFROAD = 1.35; // (the way-finding's leaning to the roads -- his "mouse routing doesn't seem to prefer the roads": a hex off the road weighs a third more in the choosing, and costs only its own hours)
  // the quickest way there (Dijkstra over the painted hexes, a heap since the area's thousands came; mm: the map, else the party's; never off the map's edge)
  function push(h, it) { h.push(it); var i = h.length - 1; while (i > 0) { var p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; var t = h[p]; h[p] = h[i]; h[i] = t; i = p; } }
  function pop(h) { var top = h[0], last = h.pop(); if (h.length) { h[0] = last; var i = 0; for (;;) { var l = 2 * i + 1, r = l + 1, s = i; if (l < h.length && h[l][0] < h[s][0]) s = l; if (r < h.length && h[r][0] < h[s][0]) s = r; if (s === i) break; var t = h[s]; h[s] = h[i]; h[i] = t; i = s; } } return top; }
  // THE ROAD FOLLOWED (11-03, the hex map and world session; Griz: "the party on the world map 'skips up' from 111, 34 to 110, 33 without following the route through
  // 110, 34", then "the route the players walk should follow the road from the tool"): his hairpins are narrower than the area's hexes, so a road comes back through
  // a hex it has passed and the way-finding, a hex a node, stepped across the bend. On the area each pass of a road through a hex is a place of its own: along the
  // road a walk goes pass to pass in the road's order; off it, hex to hex as ever; from a road a step goes off it or onto another road, never to another pass of
  // the same road (its other leg). The steps carry their pass (a hex's `rv`, [the road's id, its pass]), and the party's spot is the road's own point there
  function passLen(P) { return P.n || P.hexes.length; }
  W.roadPt = function (id, s, mm) { var P = (mm || M).pathById[id]; return P ? roadPtP(P, s) : null; };
  function passPtP(P, i) { return P.at && P.at[i] != null ? roadPtP(P, P.at[i]) : null; }
  function roadPtP(P, s) { // (the point s miles along a way, on its own line)
    var c = P._cum;
    if (!c) { c = P._cum = [0]; for (var i = 1; i < P.pts.length; i++) c.push(c[i - 1] + Math.hypot(P.pts[i][0] - P.pts[i - 1][0], P.pts[i][1] - P.pts[i - 1][1])); }
    var j = 1; while (j < c.length - 1 && c[j] < s) j++; var a = P.pts[j - 1], b = P.pts[j], L = c[j] - c[j - 1], u = L ? Math.max(0, Math.min(1, (s - c[j - 1]) / L)) : 0;
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  }
  W.passPt = function (rv, mm) { var P = (mm || M).pathById[rv[0]]; return P && P.at && P.at[rv[1]] != null ? W.roadPt(rv[0], P.at[rv[1]], mm) : null; };
  W.passHere = function (at, mm) { // (the passes the party stands on, a road's each: its last step's, else the one nearest its spot)
    var m = mm || M, ps = m.pass[K(at[0], at[1])]; if (!ps) return [];
    var mine = !!(S && S.at && at[0] === S.at[0] && at[1] === S.at[1]), spot = mine ? W.restPt() : hc(at[0], at[1]), by = {}; // (no party yet -- a bench's way asked before a game -- the hex's middle)
    ps.forEach(function (p) {
      if (mine && S.rv && S.rv[0] === p[0].id && S.rv[1] === p[1]) { by[p[0].id] = { p: p, d: -1 }; return; }
      var q = W.passPt([p[0].id, p[1]], m), d = q ? Math.hypot(q[0] - spot[0], q[1] - spot[1]) : 9; if (!by[p[0].id] || d < by[p[0].id].d) by[p[0].id] = { p: p, d: d };
    });
    return Object.keys(by).map(function (k) { return by[k].p; });
  };
  W.passStep = function (from, to, mm) { // (a step from where the party stands to a hex beside it: false if it would cross to another pass of its own road, else the pass it lands on or null)
    var m = mm || M, here = W.passHere(from, m), ps = m.pass[K(to[0], to[1])] || [];
    for (var i = 0; i < here.length; i++) { var a = here[i]; for (var j = 0; j < ps.length; j++) if (ps[j][0] === a[0] && Math.abs(ps[j][1] - a[1]) === 1) return [a[0].id, ps[j][1]]; }
    if (ps.some(function (p) { return here.some(function (a) { return a[0] === p[0]; }); })) return false;
    return ps.length ? [ps[0][0].id, ps[0][1]] : null;
  };
  W.walkPt = function (w, u) { // (the token u of the way through a step: along the road's own line from pass to pass, else straight from its spot to the next hex's)
    var next = w.path[0], a = M.near ? W.restPt() : hc(S.at[0], S.at[1]), b = M.near && next.rv ? (W.passPt(next.rv) || hc(next[0], next[1])) : hc(next[0], next[1]);
    var P = M.near && next.rv && S.rv && S.rv[0] === next.rv[0] && Math.abs(S.rv[1] - next.rv[1]) === 1 ? M.pathById[next.rv[0]] : null, ph = P && P.hexes[S.rv[1]];
    if (P && P.at && ph && ph[0] === S.at[0] && ph[1] === S.at[1]) return W.roadPt(P.id, P.at[S.rv[1]] + (P.at[next.rv[1]] - P.at[S.rv[1]]) * u);
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  };
  function joins(ps, not, spot) { // (onto a road from off it or from another: the pass of each road nearest where the party comes from -- the leg it meets, not the one up the hill)
    var by = {}; (ps || []).forEach(function (p) { if (p[0] === not) return; var q = passPtP(p[0], p[1]), d = q ? Math.hypot(q[0] - spot[0], q[1] - spot[1]) : 9; if (!by[p[0].id] || d < by[p[0].id].d) by[p[0].id] = { p: p, d: d }; });
    return Object.keys(by).map(function (k) { return by[k].p; });
  }
  function routeV(from, to, m, many) { // (many: `to` a list of hexes, and the way to each found in the one search -- W.routeMany, the plan across the area's edge, 11-13)
    var goal = many ? null : K(to[0], to[1]), dist = {}, hrs = {}, mc = {}, prev = {}, meta = {}, done = {}, open = [], best = null, goals = {}, left = 0, found = {};
    if (many) to.forEach(function (g) { var gk = K(g[0], g[1]); if (!goals[gk]) { goals[gk] = 1; left++; } });
    var key = function (h, p) { return K(h[0], h[1]) + (p ? '|' + p[0].id + '|' + p[1] : ''); };
    var relax = function (ck, h, p, st, free) {
      var nk = key(h, p), nd = dist[ck] + (free ? 0 : st.h * (st.road ? 1 : W.OFFROAD)); if (done[nk] || (dist[nk] != null && nd >= dist[nk])) return;
      dist[nk] = nd; hrs[nk] = hrs[ck] + (free ? 0 : st.h); mc[nk] = mc[ck] + (free ? 0 : st.share != null ? st.share : Math.max(1, Math.round(st.going))); prev[nk] = ck; meta[nk] = { h: h, p: p, free: free }; push(open, [nd, nk]);
    };
    var starts = W.passHere(from, m), s0 = starts.length ? starts : [null];
    s0.forEach(function (p) { var k = key(from, p); dist[k] = 0; hrs[k] = 0; mc[k] = 0; meta[k] = { h: from, p: p }; push(open, [0, k]); });
    while (open.length) {
      var cur = pop(open), ck = cur[1]; if (done[ck]) continue; done[ck] = 1; var cm = meta[ck], ch = cm.h, cp = cm.p;
      if (many) { var hk = K(ch[0], ch[1]); if (goals[hk] && !found[hk]) { found[hk] = ck; if (!--left) break; } } // (the first state of a hex taken is its quickest)
      else if (K(ch[0], ch[1]) === goal) { best = ck; break; }
      var spot = cp ? (W.passPt([cp[0].id, cp[1]], m) || hc(ch[0], ch[1])) : hc(ch[0], ch[1]);
      if (cp) { // along the road, pass to pass; and onto another road in this hex
        [-1, 1].forEach(function (dd) { var j = cp[1] + dd; if (j < 0 || j >= passLen(cp[0])) return; var nh = cp[0].hexes[j]; if (nh[0] === ch[0] && nh[1] === ch[1]) return; var st = W.stepHours(ch, nh, m); if (st) relax(ck, nh, [cp[0], j], st); });
        joins(m.pass[K(ch[0], ch[1])], cp[0], spot).forEach(function (p) { relax(ck, ch, p, null, true); });
      }
      for (var d = 0; d < 6; d++) {
        var n = [ch[0] + DIRS[d][0], ch[1] + DIRS[d][1]], nk = K(n[0], n[1]); if (!m.hex[nk]) continue;
        var st = W.stepHours(ch, n, m); if (!st) continue; var ps = m.pass[nk];
        if (ps) joins(ps, cp && cp[0], spot).forEach(function (p) { relax(ck, n, p, st); }); // (never to another pass of the road it is on: along it only)
        else relax(ck, n, null, st);
      }
    }
    var walkBack = function (b) {
      var path = [], k = b; while (prev[k] != null) { var mt = meta[k]; if (!mt.free) { var h = mt.h.slice(); h.rv = mt.p ? [mt.p[0].id, mt.p[1]] : null; path.unshift(h); } k = prev[k]; }
      return { hexes: path, hours: hrs[b], march: mc[b], cost: dist[b] };
    };
    if (many) { var out = {}; Object.keys(found).forEach(function (gk) { out[gk] = walkBack(found[gk]); }); return out; }
    if (!best) return null;
    var r = walkBack(best); return r.hexes.length ? r : null;
  }
  // the ways from one hex to many in one search (keyed by K): the area's (with its roads' passes), else each its own search
  W.routeMany = function (from, tos, mm) {
    var m = mm || M, out = {};
    if (m.near && Object.keys(m.pass).length) out = routeV(from, tos, m, true);
    else tos.forEach(function (g) { var r = W.route(from, g, m); if (r) out[K(g[0], g[1])] = r; });
    var fk = K(from[0], from[1]); if (tos.some(function (g) { return K(g[0], g[1]) === fk; })) out[fk] = { hexes: [], hours: 0, march: 0, cost: 0 }; // (where it stands: no way to walk)
    return out;
  };
  W.route = function (from, to, mm) {
    var m = mm || M, start = K(from[0], from[1]), goal = K(to[0], to[1]); if (start === goal || !m.hex[goal] || !walkIn(m, m.hex[goal])) return null;
    if (m.near && Object.keys(m.pass).length) return routeV(from, to, m);
    var dist = {}, hrs = {}, mc = {}, prev = {}, open = [[0, from[0], from[1]]], done = {}; dist[start] = 0; hrs[start] = 0; mc[start] = 0; // (mc: THE MARCH's hexes -- js/house.js H.hexCost, or a smaller hex's share)
    while (open.length) {
      var cur = pop(open), ck = K(cur[1], cur[2]); if (done[ck]) continue; done[ck] = 1; if (ck === goal) break;
      for (var d = 0; d < 6; d++) {
        var n = [cur[1] + DIRS[d][0], cur[2] + DIRS[d][1]], nk = K(n[0], n[1]); if (done[nk] || !m.hex[nk]) continue;
        var st = W.stepHours([cur[1], cur[2]], n, m); if (!st) continue;
        var nd = cur[0] + st.h * (st.road ? 1 : W.OFFROAD); if (dist[nk] == null || nd < dist[nk]) { dist[nk] = nd; hrs[nk] = hrs[ck] + st.h; mc[nk] = mc[ck] + (st.share != null ? st.share : Math.max(1, Math.round(st.going))); prev[nk] = [cur[1], cur[2]]; push(open, [nd, n[0], n[1]]); }
      }
    }
    if (dist[goal] == null) return null;
    var path = [], k = goal, p = to; while (k !== start) { path.unshift(p); p = prev[k]; k = K(p[0], p[1]); }
    return { hexes: path, hours: hrs[goal], march: mc[goal], cost: dist[goal] }; // (cost: the choosing's weight, a hex off the road W.OFFROAD the more)
  };
  // the way to a point in miles (a click's), from the party's hex: on its own map, or on the area to its edge nearest the point and a step onto THE WORLD,
  // the rest of the way THE WORLD's -- the hours and the march counted through; from THE WORLD into the area the walk is planned again at its edge
  W.planTo = function (pt) {
    var g = at(pt[0], pt[1]), r;
    if (M.hex[K(g[0], g[1])]) { r = W.route(S.at, g); if (r) r.goal = pt.slice(); return r; }
    if (!M.near || W.far) return null;
    var tw = atw(pt[0], pt[1], MS.world.w); if (!MS.world.hex[K(tw[0], tw[1])] || !walkIn(MS.world, MS.world.hex[K(tw[0], tw[1])])) return null;
    // THE WHOLE WAY WEIGHED (11-13, the world map seat; his ear file of 11-13 0327Z: "clicking travel to tarlyn's pit still goes the the long way around the lake, is the
    // road not less travel?"): the edge's steps nearest the point, each weighed by the whole way -- the area's to it (one search to them all, W.routeMany), the step off,
    // THE WORLD's on -- and the lightest taken, a hex off the road weighing W.OFFROAD the more as everywhere. It had taken the first step off nearest the point that had
    // any way at all: from the inn, the edge north-east round the lake, 16.9 h, past the Pit road's own step off south
    var cands = M.exits.slice().sort(function (a, b) { var A = hcw(a.pw[0], a.pw[1], MS.world.w), B = hcw(b.pw[0], b.pw[1], MS.world.w); return Math.hypot(A[0] - pt[0], A[1] - pt[1]) - Math.hypot(B[0] - pt[0], B[1] - pt[1]); }).slice(0, 24);
    var sides = [], goals = [];
    cands.forEach(function (ex) {
      for (var d = 0; d < 6; d++) { // (the area's hex beside the step off)
        var b = [ex.n[0] + DIRS[d][0], ex.n[1] + DIRS[d][1]]; if (!M.hex[K(b[0], b[1])]) continue;
        var st = W.stepHours(b, ex.n); if (!st || !st.exit) continue;
        sides.push({ ex: ex, b: b, st: st }); goals.push(b);
      }
    });
    var ways = goals.length ? W.routeMany(S.at, goals) : {}, wcache = {}, best = null;
    sides.forEach(function (sd) {
      var rb = ways[K(sd.b[0], sd.b[1])]; if (!rb) return;
      var pk = K(sd.ex.pw[0], sd.ex.pw[1]), rw = wcache[pk];
      if (rw === undefined) rw = wcache[pk] = sd.ex.pw[0] === tw[0] && sd.ex.pw[1] === tw[1] ? { hexes: [], hours: 0, march: 0, cost: 0 } : W.route(sd.ex.pw, tw, MS.world);
      if (!rw) return;
      var cost = rb.cost + sd.st.h * W.OFFROAD + rw.cost;
      if (!best || cost < best.cost - 1e-9) best = { cost: cost, hexes: rb.hexes.concat([sd.ex.n]), hours: rb.hours + sd.st.h + rw.hours, march: rb.march + sd.st.share + rw.march, beyond: rw.hexes.length + 1 };
    });
    return best ? { hexes: best.hexes, hours: best.hours, march: best.march, goal: hcw(tw[0], tw[1], MS.world.w), beyond: best.beyond } : null;
  };
  // the party onto the map a point lies on (the area where it covers THE WORLD's hex, else THE WORLD) at that point's hex, or the nearest it can stand on
  W.place = function (pt) { // (true if the map changed: the scene's onMap then)
    var tw = atw(pt[0], pt[1], MS.world.w), key = W.nearOn() && MS.near.area[K(tw[0], tw[1])] ? 'near' : 'world', was = W.mapKey, from = S.at;
    W.use(key); S.map = key === 'near' ? 'near' : null;
    var h = at(pt[0], pt[1]), seen = {}, q = [h]; seen[K(h[0], h[1])] = 1;
    while (q.length) { var p = q.shift(), e = M.hex[K(p[0], p[1])]; if (e && walkIn(M, e)) { h = p; break; } for (var d = 0; d < 6 && q.length < 400; d++) { var n = [p[0] + DIRS[d][0], p[1] + DIRS[d][1]], nk = K(n[0], n[1]); if (!seen[nk] && M.hex[nk]) { seen[nk] = 1; q.push(n); } } }
    if (was !== key) S.from = null; else if (from && (from[0] !== h[0] || from[1] !== h[1])) S.from = from;
    S.at = h; W.save();
    return was !== key;
  };

  // ---------------------------------------------------------------- the clock: hours from midnight before the first morning; the walk spends them, and the
  // other path moves the days alone (his "days by fiat/mission completion - unhooked from travel")
  var S = null;
  function fresh() { var s = W.startHex(); return { at: s, from: null, t: W.MORNING, today: 0, seed: (Date.now() >>> 0) }; }
  W.startHex = function () { var sv = M.sites.filter(function (s) { return s.id === 'silverton'; })[0]; return sv ? sv.hex.slice() : [M.hex[Object.keys(M.hex)[0]].q, M.hex[Object.keys(M.hex)[0]].r]; };
  W.house = function () { return !!(D.house && D.house.playing && D.house.cur); }; // (THE SECOND GAME's house, js/house.js: the clock and the hex are its save's)
  W.load = function (q) {
    S = null; W.far = /[?&]far\b/.test(q || '');
    if (W.house()) S = D.house.cur.world;
    else if (!/[?&]fresh\b/.test(q || '')) try { S = JSON.parse(localStorage.getItem(W.KEY) || 'null'); } catch (e) { S = null; }
    W.use(S && S.map === 'near' && W.nearOn() ? 'near' : 'world'); if (S && S.map && M.key !== 'near') S.map = null; // (the map the save says, if it is here)
    if (!S || !S.at || !M.hex[K(S.at[0], S.at[1])]) { W.use('world'); S = fresh(); }
    var aq = /[?&]at=(-?\d+),(-?\d+)/.exec(q || ''); if (aq && MS.world.hex[K(+aq[1], +aq[2])]) { W.use('world'); S.map = null; S.at = [+aq[1], +aq[2]]; S.from = null; } // (&at=: THE WORLD's hex)
    if (M.key === 'world' && W.inArea(S.at[0], S.at[1]) && W.nearOn()) { var sa = M.siteAt[K(S.at[0], S.at[1])], pp = S.pos && W.worldHexOf(S.pos[0], S.pos[1]).join() === S.at.join() ? S.pos : sa && sa.length ? (sa[0].town || [sa[0].x, sa[0].y]) : hc(S.at[0], S.at[1]); W.place(pp); S.pos = pp.slice(); } // (on the area where it covers -- a new game at Silverton, a save from before it -- at the place in that hex (a city's own ground, `town`), else its middle)
    if (W.house()) D.house.cur.world = S;
    W.unstuck = W.unstick();
    return S;
  };
  // a party with no step out (his "seems i've left the party in an impossible position in the pane": walked up into the mountains before they were closed,
  // 10-20) is put on the nearest open hex it could walk on from -- unless it stands at a road's door (The DOORS: the Coldridge Route down)
  W.unstick = function () {
    var free = function (p) { var e = M.hex[K(p[0], p[1])]; if (!e || !W.walkable(e) || (W.MOUNTAIN[e.t] && !(M.near && (e.rd || M.siteAt[K(p[0], p[1])])))) return false; /* (on the area a road's or a place's hex in the mountains stands: Silverton against its mountain) */ for (var d = 0; d < 6; d++) if (W.stepHours(p, [p[0] + DIRS[d][0], p[1] + DIRS[d][1]])) return true; return false; };
    var atDoor = M.routes.some(function (r) { return r.ends.some(function (s) { return s.hex[0] === S.at[0] && s.hex[1] === S.at[1]; }); });
    if (atDoor || free(S.at)) return null;
    var seen = {}, q = [S.at], k0 = K(S.at[0], S.at[1]); seen[k0] = 1;
    while (q.length) { var p = q.shift(); if (free(p)) { var was = M.hex[k0]; S.at = p; S.from = null; W.save(); return was ? M.terr[was.t].name : 'off the map'; } for (var d = 0; d < 6; d++) { var n = [p[0] + DIRS[d][0], p[1] + DIRS[d][1]], nk = K(n[0], n[1]); if (!seen[nk] && M.hex[nk] && q.length < 4000) { seen[nk] = 1; q.push(n); } } }
    return null;
  };
  W.save = function () { if (W.house()) { D.house.cur.world = S; return; } try { localStorage.setItem(W.KEY, JSON.stringify(S)); } catch (e) { /* (the walk goes on unkept) */ } }; // (in the house the walk is kept by SAVE, js/house.js)
  W.state = function () { return S; };
  W.day = function () { return Math.floor(S.t / 24) + 1; };
  W.hour = function () { return S.t % 24; };
  W.todAt = function (h) { return h < 5 ? 'night' : h < 7 ? 'dawn' : h < 11 ? 'morning' : h < 14 ? 'midday' : h < 17 ? 'afternoon' : h < 20 ? 'dusk' : 'night'; };
  W.timeOfDay = function () { return W.todAt(W.hour()); };
  W.passDays = function (n, why) { S.t = (Math.floor(S.t / 24) + (n | 0)) * 24 + W.MORNING; S.today = 0; S.todayHex = 0; S.pushing = false; W.save(); if (W.scene) W.scene.say(why || (n === 1 ? 'A day passes.' : n + ' days pass.')); }; // (the other path: a mission's end, a ruling's fiat)
  // THE CAMP'S CLOCK (RULED 11-03, his "check that road camping is only moving 8 hours as appropriate (not necessarily 'sleep til morning')", on the eyes row of his 11-01 ear file):
  // the SRD's long rest is eight hours, so a road camp moves the clock W.REST hours on from when the party lies down -- a camp at noon wakes at 20:00 -- and no further. It was to
  // the next 07:00 every time (a camp at 03:00 slept four hours, one at 08:00 twenty-three). The SRD's "no more than one long rest in 24 hours" is not kept: the day's march and its
  // camps are the player's. o.from: the clock the party lay down at (the night's own: js/house.js H.runNight; else now); o.hours: some other count; o.morning: the old way, on to the
  // next W.MORNING -- the inn's night (js/house.js H.sleepOnFloor: Cassia's rooms, Aldwin's floor), a bed and not a camp. W.passDays (a mission's fiat) still lands on the morning
  W.REST = 8;
  W.camp = function (o) {
    o = o || {}; var from = o.from != null ? o.from : S.t;
    if (o.morning) S.t = (Math.floor(from / 24) + (from % 24 >= W.MORNING ? 1 : 0)) * 24 + W.MORNING; else S.t = from + (o.hours != null ? o.hours : W.REST);
    S.today = 0; S.todayHex = 0; S.pushing = false; W.save(); if (W.house()) return D.house.longRest(W.scene); return [];
  }; // (in the house the camp is the long rest: js/house.js H.longRest, its levels and their picks)
  W.campSaid = function (ups) { return 'The party makes camp, and rests its ' + W.REST + ' hours: ' + W.timeOfDay() + '.' + (ups && ups.length ? ' ' + ups.join(' ') : ''); }; // (the line a camp says: the bare door's, js/world.js and js/overworld.js)

  // ---------------------------------------------------------------- the scene
  function World(q) { this.kind = 'world'; this.opaque = true; this.q = q || ''; this.cam = null; this.zi = 2; this.hov = null; this.plan = null; this.walk = null; this.cards = []; this.msg = null; this.t = 0; }
  World.prototype.enter = function () {
    if (!W.index()) throw new Error('no world: data/world.js is not loaded (python tools/world-build.py)');
    W.load(this.q); W.scene = this; W.active = true; this.dev = /[?&]dev\b/.test(this.q);
    this.view = 'hex'; if (/[?&]tiles\b/.test(this.q) && W.OV) W.OV.open(this); // (the top-down view, js/overworld.js: V switches)
    this.fineDoor = !!W.FINE; if (this.fineDoor) W.FINE.start(this.q); // (THE LAND, RAISED by default since 10-22: js/worldfine.js F.start, F switches to the hex tops)
    var c = hc(S.at[0], S.at[1]); this.cam = { cx: c[0], cy: c[1] }; this.zi = M.near ? W.NEARZ : 2; this.zBasePx = this.zooms()[this.zi]; // (the area's hexes as big on the screen as THE WORLD's at its opening zoom; zBasePx: the zoom ZOOM ON APPROACH comes back to)
    try { D.music('corridor'); } catch (e) { }
    if (/[?&]hairpin\b/.test(this.q) && M.near) { var cP = M.paths.filter(function (P) { return /coldridge/i.test(P.name || '') && P.at && P.hexes.length > 1; })[0]; if (cP) { S.at = cP.hexes[1].slice(); S.rv = [cP.id, 1]; S.pos = W.passPt(S.rv); W.closeIn(); } } // (&hairpin: the party on the Coldridge's first hairpin -- not &climb, the Pocket DM's own door, js/main.js at the closest zoom -- THE ROAD FOLLOWED's door, js/eyes.js eyes-roadfollow-1103)
    else if (/[?&]glowseep\b/.test(this.q) && M.near && M.pathById.mile) { S.at = M.pathById.mile.hexes[0].slice(); S.rv = ['mile', 0]; S.pos = W.passPt(S.rv); W.closeIn(); } // (&glowseep: the party at the fork on the mile, the Glowseep's door a hex up the road -- its door on the road since 11-05, tools/hexmap.js seedGlowseepRoad; js/eyes.js eyes-glowseep-road-1105)
    else if (/[?&]close\b/.test(this.q)) W.closeIn(); // (&close: open at the area's closest zoom, the built squares' show door -- js/eyes.js eyes-edifice-1103)
    var vq = /[?&]vessel(?:=(\d+))?\b/.exec(this.q); W.VESSEL.show = vq ? { play: !vq[1] } : null; // (&vessel: THE VESSEL'S ROAD's show, above -- the clock his, the camera on the junction)
    if (vq) { if (vq[1]) S.t = (+vq[1] - 1) * 24 + 12; var vj = MS.world.sites.filter(function (s) { return s.id === W.VESSEL.to; })[0]; if (vj && !M.near) { this.cam = { cx: vj.x - 15, cy: vj.y + 12 }; this.zi = 1; this.zBasePx = this.zooms()[this.zi]; } }
    this.say(W.unstuck ? 'The party found its way down out of the ' + W.unstuck + ', ' + W.timeOfDay() + '.' : 'The road, ' + W.timeOfDay() + '. Click a hex to travel there.');
  };
  World.prototype.exit = function () { W.active = false; };
  World.prototype.say = function (s) { this.msg = { s: s, t: 0 }; };
  World.prototype.card = function (lines, then, keys) { this.cards.push({ lines: lines, then: then || null, keys: keys || null }); };
  W.NEARZOOMS = [6, 8.5, 12, 17, 20, 28, 40, 56]; W.NEARZ = 4; // (the area's px a mile: its 1.5-mile hexes 9 to 84 px across, 30 at the opening -- as THE WORLD's 5-mile hexes at its own; 40 and 56 since 10-28, his "5 - do 40 and 56 variant": Silverton, the Warrens and the Galleries junction on one screen, the land up to the party, js/worldfine.js F.ringsAt)
  // THE CLOSEST ZOOM (11-03, the hex map and world session; Griz: "Is the first zoom of the hex tool at level 3 the maximum zoom on the world model/can it be? That'd be
  // the level of zoom when leaving a location and the level to try to code-draw the buildings. The two rings thing would ideally bring them to this level of zoom as
  // they approached locations", then "Yes to all leans"): his hex map shows its 330 ft hexes from 208 px a mile on his screen (tools/hexmap.js wlev), so the area's
  // last zoom puts a mile at 208 of his screen's pixels at whatever scale the game is drawn (69 at 3x, the 1080p screen's), never farther out than 56. There the
  // party's own hex is the land too (js/worldfine.js F.ringsAt), the buildings are drawn on his squares (F.built), a town left opens at it (W.leaveTown) and every
  // door's approach comes down to it (W.APPROACH)
  W.TOOL_L3 = 208; var NZC = { s: null, z: null };
  W.closeZ = function () { var s = D.scale || 3; return Math.max(56, Math.round(W.TOOL_L3 / s)); };
  W.nearZooms = function () { var cz = W.closeZ(); if (NZC.z !== cz) { NZC.z = cz; NZC.s = cz > W.NEARZOOMS[W.NEARZOOMS.length - 1] ? W.NEARZOOMS.concat([cz]) : W.NEARZOOMS; } return NZC.s; };
  World.prototype.zooms = function () { return M.near ? W.nearZooms() : this.fineDoor && W.FINE.on ? W.FINE.ZOOMS : W.ZOOMS; }; // (THE FINE LAND's one zoom closer, js/worldfine.js; else THE WORLD's five; the area's its own, its last from the screen's scale)
  W.restPt = function () { return S.pos && W.hexOf(S.pos[0], S.pos[1]).join() === S.at.join() ? S.pos : hc(S.at[0], S.at[1]); }; // (the party's own spot in its hex: a town's gate, a place; else the hex's middle)
  W.closeIn = function () { // (a place left: the area's closest zoom, the camera on the party's spot; the hand's zoom kept for the walk away to step back out to)
    var sc = W.scene; if (!sc || !M.near) return; var ZS = sc.zooms(), p = W.restPt();
    sc.zi = ZS.length - 1; sc.zpx = ZS[sc.zi]; sc.zT = sc.t; sc.zHand = false; var lk = sc.lookAt(p[0], p[1]); sc.cam.cx = lk[0]; sc.cam.cy = lk[1];
  };
  // the party onto another map (the area's edge crossed, a town left, the top-down view shut): the land kept at the scale it was, the way planned again
  World.prototype.onMap = function () {
    var ZS = this.zooms(), z0 = this.zpx || ZS[this.zi], bi = 0;
    for (var i = 1; i < ZS.length; i++) if (Math.abs(Math.log(ZS[i] / z0)) < Math.abs(Math.log(ZS[bi] / z0))) bi = i;
    this.zi = bi; this.plan = null; this.hov = null;
    this.say(M.near ? 'The Silverton area, ' + W.timeOfDay() + ': its hexes a mile and a half.' : 'Out on THE WORLD, ' + W.timeOfDay() + ': its hexes five miles.');
  };
  // the camera on a point of the land (11-03): its height lifts it up the screen -- at the area's closest zoom the Coldridge's climb at 3,000 ft stood a party at the
  // screen's top edge or past it -- so the camera rises with the ground it looks at, and the party walks the middle of the screen
  World.prototype.lookAt = function (x, y) {
    var z = this.zooms()[Math.min(this.zi, this.zooms().length - 1)], E = 6 * Math.min(1, Math.pow(8 / z, 0.35)), a = at(x, y), h = this.fineDoor && W.FINE && W.FINE.live() ? W.FINE.groundH(x, y) : hexTopH(a[0], a[1]);
    return [x, y - Math.max(0, h) / 5280 * E / TILT];
  };
  World.prototype.camObj = function () { var ZS = this.zooms(); if (this.zi > ZS.length - 1) this.zi = ZS.length - 1; var z = ZS[this.zi]; return { cx: this.cam.cx, cy: this.cam.cy, z: z, W: D.W, H: D.H, E: 6 * Math.min(1, Math.pow(8 / z, 0.35)) }; };
  function proj(cam, x, y, h) { return [(x - cam.cx) * cam.z + cam.W / 2, (y - cam.cy) * cam.z * TILT + cam.H / 2 - h / 5280 * cam.z * cam.E]; }
  function hexTopH(q, r) { var e = M.hex[K(q, r)]; if (e) return e.h; if (M.near) { var c = hc(q, r), pw = atw(c[0], c[1], MS.world.w), ew = MS.world.hex[K(pw[0], pw[1])]; if (ew) return ew.h; } return 0; } // (past the area's edge: THE WORLD's hex there)
  // A CLICK ON A PLACE (11-13 later, the world map seat; his note on eyes-world-innroad-1113d: "i clicked on the halfway inn hex at a zoom too far out and it took me to two
  // hexes west of the inn on a closer zoom (when i got there)"): the hex under the pixel is read on the raised land, and a place's mark is drawn on the ground at its own point,
  // so at the far zooms the two parted -- 15 of the area's 117 drawn place-and-zoom clicks went to another hex. A click within a few pixels of a place's drawn mark, or on its name,
  // is that place: its own hex, the walk to its mark (World.prototype.update)
  World.prototype.pickPlace = function (mx, my) {
    var cam = this.camObj(), best = null, bd = 1e9, r = Math.max(6, Math.min(12, cam.z * 0.6));
    for (var i = 0; i < M.sites.length; i++) {
      var s = M.sites[i], p = groundAt(cam, s.x, s.y); if (VIS && !VIS(p, s.y)) continue;
      var d = Math.hypot(p[0] - mx, p[1] - my), nm = (BIG[s.kind] || cam.z >= 8) ? s.name.replace(/ \(.*\)$/, '') : '', nx = Math.round(p[0]) + 6, ny = Math.round(p[1]) - 4;
      if (nm && mx >= nx - 1 && mx <= nx + D.textWidth(nm) + 1 && my >= ny - 1 && my <= ny + 9) d = Math.min(d, r * 0.9); // (its name, as W.drawPlaces writes it)
      if (d <= r && d < bd) { bd = d; best = s; }
    }
    return best && M.hex[K(best.hex[0], best.hex[1])] ? best : null;
  };
  World.prototype.pick = function (mx, my) {
    if (this.fineDoor && W.FINE.live()) { var fp = W.FINE.pick(mx, my); if (fp) return fp; } // (THE FINE LAND: the hex under the pixel)
    var cam = this.camObj(), x = (mx - cam.W / 2) / cam.z + cam.cx, y = cam.cy, h = 0;
    for (var i = 0; i < 6; i++) { y = (my - cam.H / 2 + h / 5280 * cam.z * cam.E) / (cam.z * TILT) + cam.cy; var a = at(x, y); h = hexTopH(a[0], a[1]); }
    return at(x, y);
  };
  // THE TRAVEL RECORD (11-13, the small-ready seat; his word on the inn's road row: "i don't suppose we record world map travel, i clicked on the halfway inn hex at a zoom
  // too far out and it took me to two hexes west of the inn"): each walk on THE WORLD is one line of the house's trail (js/house.js H.trail, kind `walk`: kept in the save and
  // written into his NOTES file with the game's clock and the wall's) -- as it begins, the click that set it (the pixel, the zoom, the hex and the place picked, the hexes
  // planned) or the arrows; as it ends, where the party stands, the hours it took and what stopped it. Steps by the arrows one after another are one line, counted, so a
  // walk by hand never pushes the fights and the talks off the trail. Seen once a frame from update, and where a fight breaks a walk (arrive), so the fight's line comes after
  W.travel = function (sc, why) {
    var H = D.house; if (!W.house() || !H.trail || !S) return;
    var hx = function (a) { return a[0] + ',' + a[1]; }, tr = H.cur.trail || [], tw = sc.tw;
    var td = sc.view === 'tiles', wk = td ? sc.ov && sc.ov.walk : sc.walk, un = td ? 'tile' : 'hex'; // (the top-down tiles' walk too, js/overworld.js: counted in tiles, the hex under the party named -- 11-13 later)
    if (wk && !tw) {
      var c = sc.clicked; sc.clicked = null; var arrows = td ? !!wk.arrows : !c && wk.path.length === 1 && !wk.goal, ta = sc.twArrows;
      if (arrows && ta && ta.td === td && tr[tr.length - 1] === ta.e) { sc.tw = ta; return; } // (the next step by the arrows: the same line)
      var base = (td ? 'top-down: ' : '') + (c ? 'click ' + c.x + ',' + c.y + ' at zoom ' + (c.zi + 1) + '/' + c.zn + ' on the ' + (M.near ? 'area' : 'world') + ' map: picked ' + (c.tile ? 'the tile ' + hx(c.tile) : hx(c.hex)) + (c.place ? ' (' + c.place + ')' : '') + ', from ' + hx(S.at) + ', ' + wk.path.length + ' ' + un + (wk.path.length === 1 ? '' : td ? 's' : 'es') + ' planned'
        : arrows ? 'by the arrows from ' + hx(S.at) : 'the walk taken up again from ' + hx(S.at));
      H.trail('walk', base); tr = H.cur.trail; sc.tw = { e: tr[tr.length - 1], base: base, t0: S.t, n: 0, arrows: arrows, td: td }; sc.twArrows = arrows ? sc.tw : null;
    } else if (!wk && tw) {
      var ss = (M.siteAt[K(S.at[0], S.at[1])] || []).map(function (s) { return s.name; }), hrs = Math.round((S.t - tw.t0) * 10) / 10; tw.n++;
      tw.e.s = tw.base + ' -- ' + (tw.arrows ? tw.n + ' ' + un + (tw.n > 1 ? (td ? 's' : 'es') : '') + ' to ' : 'stopped at ') + hx(S.at) + ' on the ' + (M.near ? 'area' : 'world') + ' map' + (ss.length ? ' (' + ss.join(', ') + ')' : '') + ' after ' + hrs + ' h, ' + W.timeOfDay() +
        ': ' + (why || (sc.cards.length ? 'a card up' : tw.arrows ? 'stepped' : 'the walk done'));
      sc.tw = null;
    }
  };
  World.prototype.update = function () {
    this.t++; if (this.msg) this.msg.t++; W.travel(this);
    if (this.pm) { this.pm.update(D.ui.menuKeys()); if (this.pm && this.pm.closed) this.pm = null; return; } // (the one menu over the world: the party's, or a level's picks -- js/house.js)
    var m = I.mouse;
    if (this.cards.length) { // (a card waits for its key)
      var cd = this.cards[0];
      if (cd.keys && m.click && cd.btns) for (var bi = 0; bi < cd.btns.length; bi++) { var bb = cd.btns[bi]; if (m.x >= bb.x && m.x < bb.x + bb.w && m.y >= bb.y && m.y < bb.y + bb.h) { if (cd.keys[bi][3]) { D.sfx('error'); return; } this.cards.shift(); D.sfx('confirm'); cd.keys[bi][1](); return; } } // (a click on a choice: his 10-21 "playable by mouse only")
      if (cd.keys) { for (var ki = 0; ki < cd.keys.length; ki++) if (I.pressed(cd.keys[ki][0])) { if (cd.keys[ki][3]) { D.sfx('error'); return; } this.cards.shift(); D.sfx('confirm'); cd.keys[ki][1](); return; } return; } // (a key's fourth, off: greyed, refused -- a long rest inside the 24 hours, 11-05)
      if (I.pressed('a') || I.pressed('b') || m.click) { this.cards.shift(); D.sfx('confirm'); if (cd.then) cd.then(); }
      return;
    }
    var ap = this.arrivePend; // (an arrival a fight broke off: finished where the party still stands -- World.prototype.arrive)
    if (ap) { this.arrivePend = null; if (D.top() === this && ap.map === M.key && ap.at.join() === S.at.join()) { this.arrive({ after: true, h: 0, mi: ap.st.mi }); if (D.top() !== this || this.cards.length) return; } }
    // M: the party's menu -- EQUIP, ITEMS, STATUS, SAVE -- walking or not (his 10-22 "M - menu isn't available": a walk waits under it); the bare door has no party
    if (I.pressed('menu')) { if (W.house()) { D.house.openMenu(this); D.sfx('menu'); } else this.say('No party here: the menu is the game\'s (deep16/?world, or NEW GAME).'); return; }
    if (I.pressed('verdict') && W.OV) { if (this.view === 'tiles') W.OV.close(this); else W.OV.open(this); return; } // (V: the hex view or the top-down tiles)
    if (this.view === 'tiles') { W.OV.update(this); return; }
    if (this.fineDoor && I.pressed('dice')) { W.FINE.flip(); this.fineT = this.t; this.zi = Math.min(this.zi, this.zooms().length - 1); D.sfx('confirm'); return; } // (F: THE LAND, RAISED or the hex tops, the choice kept)
    // the camera: the wheel and -/= zoom, the middle button pans, C comes back to the party
    var ZS = this.zooms(), zi0 = this.zi;
    if (m.wheel) this.zi = Math.max(0, Math.min(ZS.length - 1, this.zi - m.wheel));
    if (I.pressed('zoomin')) this.zi = Math.min(ZS.length - 1, this.zi + 1);
    if (I.pressed('zoomout')) this.zi = Math.max(0, this.zi - 1);
    if (this.zi !== zi0) { this.zBasePx = ZS[this.zi]; if (this.walk) this.zHand = true; } // (a hand on the zoom: the zoom ZOOM ON APPROACH comes back to, and mid-walk the approach waits till the next walk)
    var z = this.zpx = ZS[this.zi]; // (zpx: the scale kept across a map's change, onMap)
    if (m.panX || m.panY) { this.cam.cx -= (m.panX || 0) / z; this.cam.cy -= (m.panY || 0) / (z * TILT); m.panX = m.panY = 0; }
    // the mouse at the screen's edge scrolls the map (his "i'm getting no 'mouse on the edge scroll map'"), as the grid's fights do; not for a finger
    if (m.inside && m.inWin !== false && !D.touch) { var EG = 8, sp = 5 / z; if (m.x < EG) this.cam.cx -= sp; else if (m.x > D.W - EG) this.cam.cx += sp; if (m.y < EG) this.cam.cy -= sp / TILT; else if (m.y > D.H - EG) this.cam.cy += sp / TILT; }
    if (I.pressed('center')) { var c0 = M.near ? W.restPt() : hc(S.at[0], S.at[1]), l0 = this.lookAt(c0[0], c0[1]); this.cam.cx = l0[0]; this.cam.cy = l0[1]; }
    if (this.walk && !this.wasWalk) this.zHand = false; this.wasWalk = !!this.walk; // (a new walk: ZOOM ON APPROACH takes the camera again)
    if (this.walk) { this.stepWalk(); return; }
    // the arrows walk the party a hex (his "arrow keys should move the party not the mouse selector"): left and right west and east; up and down north-west
    // and north-east by turns (a hex row is half a hex over), or as the side arrow held with it says
    var ud = I.repeat('up') ? -1 : I.repeat('down') ? 1 : 0, lr = I.repeat('left') ? -1 : I.repeat('right') ? 1 : 0;
    if (ud || lr) {
      var lh = I.held.left ? -1 : I.held.right ? 1 : 0, dir;
      if (!ud) dir = lr < 0 ? [-1, 0] : [1, 0];
      else { var side = lh || (this.zig = -(this.zig || 1)); dir = ud < 0 ? (side < 0 ? [0, -1] : [1, -1]) : (side < 0 ? [-1, 1] : [0, 1]); }
      var nx = [S.at[0] + dir[0], S.at[1] + dir[1]], st0 = W.stepHours(S.at, nx), rv0 = st0 && M.near ? W.passStep(S.at, nx) : null;
      if (rv0 === false) { this.say('The road winds back on itself here: follow it round.'); return; } // (another pass of the road the party is on: along it only, 11-03)
      if (st0) { nx.rv = rv0; this.walk = { path: [nx], f: 0 }; this.plan = null; }
      else { var en = M.hex[K(nx[0], nx[1])]; this.say(!en ? 'Off the map that way.' : W.MOUNTAIN[en.t] ? 'The mountains: no way up on the world map.' : M.near && Math.abs(en.h - M.hex[K(S.at[0], S.at[1])].h) > W.STEEP * M.w ? 'Too steep to climb off the road.' : 'No one walks that way (' + M.terr[en.t].name + ').'); }
      return;
    }
    if (m.click && this.hudBtns) for (var hb = 0; hb < this.hudBtns.length; hb++) { var hbt = this.hudBtns[hb]; if (m.x >= hbt.x && m.x < hbt.x + hbt.w && m.y >= hbt.y && m.y < hbt.y + hbt.h) { D.sfx('confirm'); hbt.go(); return; } } // (the keys as buttons: his 10-21 "playable by mouse only")
    // where the mouse points: the hex, and the way there
    var pp = m.inside ? this.pickPlace(m.x, m.y) : null, hv = pp ? pp.hex.slice() : m.inside ? this.pick(m.x, m.y) : null, hk = hv ? K(hv[0], hv[1]) + (pp ? '|' + pp.id : '') : null; // (a place's mark or name: that place -- pickPlace)
    if (hk !== this.hovK) { this.hovK = hk; this.hov = hv; this.plan = hv ? W.planTo(pp ? [pp.x, pp.y] : hc(hv[0], hv[1])) : null; } // (past the area's edge: to it, and on across THE WORLD)
    if (m.click && m.inside && this.plan) { this.walk = { path: this.plan.hexes.slice(), f: 0, goal: this.plan.goal }; this.clicked = { x: Math.round(m.x), y: Math.round(m.y), zi: this.zi, zn: ZS.length, hex: hv.slice(), place: pp ? pp.id : null }; this.plan = null; D.sfx('confirm'); return; } // (clicked: the travel record's -- W.travel)
    if (I.pressed('a')) this.here();
    if (I.pressed('end') && W.house()) { this.campCard(); return; }
    if (I.pressed('end')) { var ups = W.camp(); D.sfx('confirm'); this.say(W.campSaid(ups)); }
  };
  // a step a time: the hours spent at its end (past the day's 8, a camp first), the place there, and (pass B) the road's chance of a fight
  World.prototype.stepWalk = function () {
    var w = this.walk, next = w.path[0], st = W.stepHours(S.at, next);
    if (!st) { this.walk = null; return; }
    var me = this, resume = function (p) { me.walk = { path: p, f: 0, goal: w.goal }; }; // (taken up again with its goal: across the area's edge)
    if (w.f === 0 && W.house() && D.house.marchAsk(this, st, w, resume)) return; // (the house: the day's march by the hex, the forced march past it -- js/house.js THE MARCH)
    if (w.f === 0 && !W.house() && this.dayAsk(st, w.path.slice(), resume)) { this.walk = null; return; } // (the bare door: the day's walk asks, as the house's march does)
    w.f++;
    var u = w.f / STEPF, tp = W.walkPt(w, u), tx = tp[0], ty = tp[1]; // (along the road's own line where the step follows it: THE ROAD FOLLOWED)
    this.approach(tx, ty); var ln = this.lean || [0, 0], lt = this.lookAt(tx, ty); this.cam.cx += (lt[0] + ln[0] - this.cam.cx) * 0.2; this.cam.cy += (lt[1] + ln[1] - this.cam.cy) * 0.2;
    if (w.f < STEPF) return;
    var hrs = W.house() ? D.house.marchHours(st) : st.h; // (the house: an exhausted party's half speed takes twice the hours)
    w.f = 0; S.from = S.at; S.at = next; S.pos = (M.near && next.rv && W.passPt(next.rv)) || hc(next[0], next[1]); S.rv = M.near && next.rv ? next.rv.slice() : null; S.t += hrs; S.today += hrs; w.path.shift(); // (on a road, the road's own point for its pass)
    var lo = W.house() && D.house.lightsOut ? D.house.lightsOut(null) : []; // (a Light's hour up on the walk: js/house.js H.lightsOut, 10-28)
    if (st.exit) { var fw = atw(hc(S.from[0], S.from[1])[0], hc(S.from[0], S.from[1])[1], MS.world.w); W.use('world'); S.map = null; S.at = st.exit.slice(); S.from = fw; S.pos = hc(S.at[0], S.at[1]); S.rv = null; } // (off the area's edge: THE WORLD's hex, from the 5-mile hex the area's covered)
    if (W.house()) { // (the forced march's saves, each hex past the day's: a failure stops the walk on a card till OK -- his 10-21 "probably need a quick popup every time someone moves a hex and loses the save"; the bottom line was written over by the next hex)
      var ml = D.house.marchStep(st), self = this; if (ml === null) { this.walk = null; return; }
      if (ml.length) { W.save(); D.sfx('popup'); this.card(D.house.marchCard(ml.concat(lo)), null, [['a', function () { self.arrive(st); }, 'OK']]); return; }
    }
    var m0 = this.msg; this.arrive(st);
    if (lo.length) this.say((this.msg && this.msg !== m0 ? this.msg.s + ' ' : '') + lo.join(' ')); // (after the arrival's own word, not over it)
  };
  // ZOOM ON APPROACH (10-28, the maps window; his "(and the notion of players approaching locations increasing worldmap zoom", then "6 yes" to the seat's
  // sketch -- every door, a hand on the zoom wins till the next walk, an OPTIONS row on by default): each place with a door has a reach and a zoom of its own;
  // walking toward one inside its reach the camera steps in a zoom at a time toward the place's, leaning a third of the way to it as it nears, and walking away
  // it steps back out to the zoom the hand last chose. A step, not a glide: the land is drawn again at each new zoom (18 to 66 ms in the pane)
  // (11-03, his "The two rings thing would ideally bring them to this level of zoom as they approached locations": every door's place down to the closest zoom, W.closeZ)
  W.APPROACH = { silverton: { mi: 9, z: Infinity }, mouth: { mi: 4, z: Infinity }, glowseep: { mi: 4, z: Infinity }, warrens: { mi: 4, z: Infinity } }; // (Web Gulch's own in js/gulch.js)
  W.APKEY = 'deep16.world.approach';
  W.approachOn = function () { var v = null; try { v = window.localStorage.getItem(W.APKEY); } catch (e) { } return v !== 'off'; }; // (a per-device convenience, as RANDOM FIGHTS)
  W.setApproach = function (on) { try { window.localStorage.setItem(W.APKEY, on ? 'on' : 'off'); } catch (e) { } };
  function nearestZ(ZS, px) { var bi = 0; for (var i = 1; i < ZS.length; i++) if (Math.abs(Math.log(ZS[i] / px)) < Math.abs(Math.log(ZS[bi] / px))) bi = i; return bi; }
  World.prototype.approach = function (tx, ty) { // (tx, ty: the token, between its hexes)
    if (!W.approachOn() || this.zHand) { this.lean = null; return; }
    var ZS = this.zooms(), best = null;
    for (var i = 0; i < M.sites.length; i++) {
      var s = M.sites[i], ap = W.APPROACH[s.id]; if (!ap || !W.DOORS[s.id]) continue;
      var d = Math.hypot(s.x - tx, s.y - ty); if (d < ap.mi && (!best || d / ap.mi < best.d / best.ap.mi)) best = { s: s, ap: ap, d: d };
    }
    var dPrev = this.apD, same = best && this.apS === best.s.id; this.apD = best ? best.d : null; this.apS = best ? best.s.id : null;
    var bi = nearestZ(ZS, this.zBasePx || ZS[this.zi]), want = this.zi;
    if (best && same && dPrev != null && best.d < dPrev - 1e-4) { // (nearing it: in, never out)
      var zt = Math.min(best.ap.z, ZS[ZS.length - 1]), zb = ZS[bi], k = 1 - best.d / best.ap.mi, zw = zt > zb ? zb * Math.pow(zt / zb, Math.min(1, k * 1.25)) : zb;
      for (var j = 0; j < ZS.length; j++) if (ZS[j] <= zw * 1.001) want = Math.max(want, j);
      this.lean = [(best.s.x - tx) * k / 3, (best.s.y - ty) * k / 3];
    } else if (!best || (same && dPrev != null && best.d > dPrev + 1e-4)) { want = Math.min(this.zi, bi); this.lean = null; } // (walking away, or out of every reach: out, never in)
    if (want !== this.zi && this.t - (this.zT == null ? -99 : this.zT) >= 20) { this.zi += want > this.zi ? 1 : -1; this.zT = this.t; this.zpx = ZS[this.zi]; }
  };
  // the step's end: kept, the road's chance of a fight, a door, the places here, and the walk's end
  World.prototype.arrive = function (st) {
    var w = this.walk;
    st.mi = st.mi || M.w; // (the step's own miles, before a change of map)
    // the area's edge: a step off it came onto THE WORLD in stepWalk; a step from THE WORLD into a 5-mile hex the area covers puts the party on the area at its middle
    if (st.after) { w = null; this.walk = null; var dr = this.doorHere(); if (dr) this.offerDoor(dr); else { var rt0 = this.routeHere(); if (rt0) this.offerRoute(rt0); } return; } // (the arrival a fight broke off, finished: below)
    var sw = !!st.exit || (M.key === 'world' && W.nearOn() && W.inArea(S.at[0], S.at[1]) && (W.place(hc(S.at[0], S.at[1])), true));
    W.save();
    if (sw) { this.onMap(); if (w) { var pl = w.goal ? W.planTo(w.goal) : null; w = this.walk = pl && pl.hexes.length ? { path: pl.hexes.slice(), f: 0, goal: w.goal } : null; } } // (the rest of the way on this map)
    // (pass B: a fight on the way stops the walk.) THE ARRIVAL FINISHED AFTER IT (11-13, the world map seat; his ear file of 11-13 0327Z: "do you have to enter the pit hex
    // from a certain side (took me 3 tries)"): no side -- every step onto the Pit's hex played the child's scene -- but a fight on the step in ate the arrival, the door's card
    // and the hooks on it (js/inn.js's WP.arrive, In.childPit, wants THE WORLD on top) with it, till E. Now the arrival waits under the fight and is finished once THE WORLD
    // is on top again with no card up (World.prototype.update): a door's card, a road's, and the hooks -- its own words not said again over the fight's
    if (W.onStep && W.onStep(this, st)) { this.walk = null; W.travel(this, "an encounter on the way"); this.arrivePend = { at: S.at.slice(), map: M.key, st: st }; return; }
    var door = this.doorHere(), sites = M.siteAt[K(S.at[0], S.at[1])];
    if (door && (!w || !w.path.length)) { this.walk = null; this.offerDoor(door); return; } // (a door where the walk ends; walked past, it is named -- the area's places sit on its roads: the Glowseep on the mile)
    if (sites && sites.length) this.say(sites.map(function (s) { return s.name; }).join(', ') + '.');
    if (!w || !w.path.length) { this.walk = null; var rt = this.routeHere(); if (rt) this.offerRoute(rt); else if (!sw) this.lookHere(true); }
  };
  // a road up into the mountains, at either end: its days pass and the party is at the other end (its roam to come)
  World.prototype.routeHere = function () {
    var k = K(S.at[0], S.at[1]);
    for (var i = 0; i < M.routes.length; i++) for (var j = 0; j < 2; j++) if (K(M.routes[i].ends[j].hex[0], M.routes[i].ends[j].hex[1]) === k) return { r: M.routes[i], end: j };
    return null;
  };
  World.prototype.offerRoute = function (o) {
    var self = this, r = o.r, to = r.ends[1 - o.end], up = o.end === 0;
    this.card(['{y}' + r.name.charAt(0).toUpperCase() + r.name.slice(1) + '{/}', (up ? 'Up into the mountains' : 'Down out of the mountains') + ': ' + r.days + ' days to ' + to.name + '.', '{g}(its own roam is to come: for now the days pass){/}', '',
      D.keys('{g}E{/}: go ' + (up ? 'up' : 'down') + ' it    {g}X{/}: stay')], null,
      [['a', function () { var fr = S.at.slice(); if (W.house() && D.house.trail) D.house.trail('walk', (up ? 'up ' : 'down ') + r.name + ' from ' + fr[0] + ',' + fr[1] + ' (' + r.ends[o.end].name + ') to ' + to.hex[0] + ',' + to.hex[1] + ' (' + to.name + '): ' + r.days + ' days'); W.passDays(r.days, r.days + ' days ' + (up ? 'up' : 'down') + ' ' + r.name + ': ' + to.name + ', ' + W.timeOfDay() + '.'); S.from = fr; S.at = to.hex.slice(); W.save(); var c = hc(S.at[0], S.at[1]); self.cam.cx = c[0]; self.cam.cy = c[1]; self.plan = null; }, up ? 'GO UP IT' : 'GO DOWN IT'],
       ['b', function () { self.say('The party stays at ' + r.ends[o.end].name + '.'); }, 'STAY']]);
  };
  World.prototype.here = function () { var here = this.doorHere(), rt = this.routeHere(); if (here) this.offerDoor(here); else if (rt) this.offerRoute(rt); else this.lookHere(); };
  // the house's camp (RULED 10-21): the night -- three watches, then the long rest (js/house.js H.night) -- or an hour's short rest, and at its end SECOND DRAFT for one with
  // the feat (js/house.js H.secondDraft, 10-31). The night is the long rest's eight hours from when the party lies down (11-03: W.camp), whatever the hour
  // (one long rest in 24 hours -- RULED 11-05, Griz: "For the bunk and campfire long-rests we can grey it out and tell them to 'wait'": js/house.js H.longOpen -- inside them THE
  // NIGHT is greyed with the hour it opens at, and M: WAIT beside it, THE WORLD's own (js/hours.js H16.worldWait, TILL A LONG REST among its choices))
  World.prototype.campCard = function () {
    var me = this, Hs = D.house, why = Hs && Hs.longWhy ? Hs.longWhy(W.REST, 'M: WAIT till then') : '';
    this.card(['{y}CAMP{/}, ' + W.timeOfDay() + '.'].concat(why ? D.wrap(why, 280).map(function (l) { return '{r}' + l + '{/}'; }) : [], ['', D.keys(why ? '{g}R{/}: an hour (a short rest)    {g}M{/}: wait    {g}X{/}: walk on' : '{g}E{/}: the night (three watches, eight hours, a long rest)    {g}R{/}: an hour (a short rest)    {g}X{/}: walk on')]), null,
      [['a', function () { D.house.night(me); }, 'THE NIGHT', !!why], ['rec', function () { S.t += 1; W.save(); me.say(D.house.shortRest(D.house.cur.party).concat(D.house.lightsOut(null)).join(' ')); D.house.secondDraft(D.house.cur.party); }, 'AN HOUR']]
        .concat(why && D.hours && D.hours.worldWait ? [['menu', function () { D.hours.worldWait(me); }, 'WAIT']] : [], [['b', function () { }, 'WALK ON']]));
  };
  // the bare door's day (10-22, his "Right now moving seems to be auto-camping"): past the day's 8 hours a walk never camps on its own -- it asks, as the house's
  // march does (js/house.js H.marchAsk): WALK ON (no more asking till a camp), MAKE CAMP, STAY. resume(path): the walk taken up again -- the top-down view's own
  World.prototype.dayAsk = function (st, path, resume) {
    if (S.pushing || !(S.today > 0 && S.today + st.h > W.DAYHOURS + 0.01)) return false;
    var me = this; resume = resume || function (p) { me.walk = { path: p, f: 0 }; };
    this.card(['{y}THE DAY\'S WALK IS WALKED{/} (' + (Math.round(S.today * 10) / 10) + ' hours), ' + W.timeOfDay() + '.', '', D.keys('{g}E{/}: walk on    {g}R{/}: make camp    {g}X{/}: stay')], null,
      [['a', function () { S.pushing = true; resume(path); }, 'WALK ON'], ['rec', function () { var ups = W.camp(); me.say(W.campSaid(ups)); }, 'MAKE CAMP'],
       ['b', function () { me.say('The party stands where it is, ' + W.timeOfDay() + '.'); }, 'STAY']]);
    return true;
  };
  World.prototype.doorHere = function () { var ss = M.siteAt[K(S.at[0], S.at[1])] || []; for (var i = 0; i < ss.length; i++) if (W.DOORS[ss[i].id]) return ss[i]; return null; };
  World.prototype.lookHere = function (arrived) {
    var e = M.hex[K(S.at[0], S.at[1])], T = M.terr[e.t], ss = M.siteAt[K(S.at[0], S.at[1])] || [];
    var sn = ss.filter(function (s) { return !W.DOORS[s.id]; }).map(function (s) { return s.name; });
    this.say((arrived ? 'Arrived: ' : '') + (sn.length ? sn.join(', ') + ' -- ' : '') + T.name + ', ' + Math.round(e.h).toLocaleString() + ' ft. ' + W.timeOfDay() + '.' + (sn.length ? ' (its map is not built yet)' : ''));
  };
  // the gate by the side the party comes from (his "angle of approach"): the gate whose way out faces back along the last step
  W.gateFor = function (site, from, pt) { // (from: the hex the party came from; pt: or the point in miles it stepped from -- the top-down view's)
    var dr = W.DOORS[site.id], gates = Object.keys(dr.gates); if (!from && !pt) return gates[0];
    var a = pt || hc(from[0], from[1]), b = site.town || [site.x, site.y], v = [a[0] - b[0], a[1] - b[1]], best = gates[0], bd = -1e9; // (a city's gates round its own ground, 11-03)
    gates.forEach(function (g) { var n = dr.gates[g], d = n[0] * v[0] + n[1] * v[1]; if (d > bd) { bd = d; best = g; } });
    return best;
  };
  World.prototype.offerDoor = function (site, pt) {
    var self = this, gate = W.gateFor(site, S.from, pt);
    this.card(['{y}' + site.name + '{/}', 'The ' + gate + ' gate is before you, ' + W.timeOfDay() + '.', '', D.keys('{g}E{/}: go in by the ' + gate + ' gate    {g}X{/}: stay on the road')], null,
      [['a', function () { self.enterDoor(site, gate); }, 'GO IN'], ['b', function () { self.say('The party keeps to the road.'); }, 'STAY ON THE ROAD']]);
  };
  World.prototype.enterDoor = function (site, gate) {
    var dr = W.DOORS[site.id]; if (!dr || !D.roam) return;
    if (W.house()) { D.house.toTown(site.id, gate); return; } // (the house's party, pack and flags walk in: js/house.js)
    W.inDoor = { site: site, gate: gate };
    D.push(D.roam.make('?roam=' + dr.roam + '&gate=' + gate));
  };
  // THE ROAD'S OWN SIDES (11-13, the world map seat; his ear file of 11-13 0327Z: "road to the world puts me on a hex west of half-way inni"): a floor whose rim on a side
  // IS a road -- the Halfway Inn's yard, the Pit road down its west three columns (js/inn.js In.ROWS, its gates in at 1,1 / 1,20 / 1,38) -- hands the party out onto that
  // road at the place, not a gate's step beyond it: the road's point nearest the place's mark, run along it `sides[side]` miles (north: the way the road climbs the map,
  // south: down it; 0 where it passes). The west gate's step had put the party 0.75 mi west of the inn's mark, on the area's hex west of the inn, off the road
  W.ROADSIDE = { inn: { road: 'pitroad', sides: { west: 0, north: -0.75, south: 0.75 } } };
  W.roadOut = function (site, rs, side) { // (the point in miles and its road miles, on whichever map covers the place: the area's road where it does)
    var tw = site.town || [site.x, site.y], mm = W.nearOn() && MS.near.area[K.apply(null, atw(tw[0], tw[1], MS.world.w))] ? MS.near : MS.world, P = mm.pathById[rs.road]; if (!P || !P.pts) return null;
    var pts = P.pts.filter(function (p) { return Array.isArray(p); }), c = [0], bs = 0, bd = 1e9;
    for (var i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    for (var j = 1; j < pts.length; j++) { var a = pts[j - 1], b = pts[j], vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy, u = L2 ? Math.max(0, Math.min(1, ((tw[0] - a[0]) * vx + (tw[1] - a[1]) * vy) / L2)) : 0, d = Math.hypot(tw[0] - a[0] - u * vx, tw[1] - a[1] - u * vy); if (d < bd) { bd = d; bs = c[j - 1] + u * Math.sqrt(L2); } }
    var off = rs.sides[side] || 0, s = bs;
    if (off) { var up = roadPtP(P, Math.max(0, bs - 0.1)), dn = roadPtP(P, Math.min(c[c.length - 1], bs + 0.1)), north = dn[1] < up[1] ? 1 : -1; s = Math.max(0, Math.min(c[c.length - 1], bs + (off < 0 ? north : -north) * Math.abs(off))); } // (which way along the road is north)
    return { pt: roadPtP(P, s), s: s };
  };
  // back from a town: its roads off the floor's edge (js/town.js T.wayOut, the hook the Silverton roam seat left for this) put the party on the town's hex
  W.leaveTown = function (side) {
    while (D.scenes.length && D.top() !== W.scene) D.pop();
    if (!W.scene) return;
    var site = W.inDoor && W.inDoor.site, gv = site && W.DOORS[site.id] && W.DOORS[site.id].gates[side];
    var tw = site && (site.town || [site.x, site.y]); // (a city's own ground, where its mark has moved off it: Silverton's mark on the Edifice since 11-03, its gates round the town as before)
    var rs = site && W.ROADSIDE[site.id], ro = rs && rs.sides[side] != null ? W.roadOut(site, rs, side) : null;
    if (ro) { S.pos = ro.pt.slice(); if (W.place(S.pos)) W.scene.onMap(); var ps = (M.pass[K(S.at[0], S.at[1])] || []).filter(function (p) { return p[0].id === rs.road; }).sort(function (a, b) { return Math.abs(a[0].at[a[1]] - ro.s) - Math.abs(b[0].at[b[1]] - ro.s); })[0]; S.rv = M.near && ps ? [rs.road, ps[1]] : null; if (S.rv) S.pos = W.passPt(S.rv) || S.pos; S.from = null; var cr = hc(S.at[0], S.at[1]); W.scene.cam.cx = cr[0]; W.scene.cam.cy = cr[1]; W.closeIn(); } // (onto the road itself, at its pass there: W.ROADSIDE)
    else if (site) { S.pos = [tw[0] + (gv ? gv[0] : 0) * 0.75, tw[1] + (gv ? gv[1] : 0) * 0.75]; if (W.place(S.pos)) W.scene.onMap(); var cl = hc(S.at[0], S.at[1]); W.scene.cam.cx = cl[0]; W.scene.cam.cy = cl[1]; W.closeIn(); } // (out by the side's gate: a step beyond it, on the map that covers it; at the closest zoom, his note 25)
    W.inDoor = null; if (W.house()) D.house.cur.at = { town: null }; W.save(); try { D.music('corridor'); } catch (e) { }
    W.scene.say('Out on the road by the ' + side + ', ' + W.timeOfDay() + '.');
  };
  if (D.town && D.town.wayOut) {
    var wayOut0 = D.town.wayOut;
    D.town.wayOut = function* (B, sq) {
      if (!W.active || !W.inDoor) { yield* wayOut0(B, sq); return; }
      var def = D.roam.def || {}, nm = (def.wayName || {})[sq[0] + ',' + sq[1]] || 'the road', side = sq[0] <= 1 ? 'west' : sq[1] >= (def.h || 0) - 2 ? 'south' : sq[0] >= (def.w || 0) - 2 ? 'east' : 'north';
      B.card(['{y}' + nm.charAt(0).toUpperCase() + nm.slice(1) + '{/}.', '{g}The world map takes the party on.{/}'], 90); D.sfx('popup'); yield 50;
      if (W.house()) D.house.fromFloor(B); // (the floor's party, pack and purse back into the save first)
      W.leaveTown(side);
    };
  }

  // ---------------------------------------------------------------- the look: the hex map's world look at 480 x 270 -- columns at their heights, lit, the
  // wet floors filmed, snow on the highest; roads and rivers on the ground; the places as icons; the sky by the hour
  var HCO = []; for (var i0 = 0; i0 < 6; i0++) { var a0 = (30 + 60 * i0) * Math.PI / 180; HCO.push([Math.cos(a0) / SQ3, Math.sin(a0) / SQ3]); }
  function tone(e, s, wall) {
    var c = M.col[e.t] || [200, 0, 200], r = c[0], g = c[1], b = c[2];
    if (wall) { r = r * 0.6 + 92 * 0.4; g = g * 0.6 + 74 * 0.4; b = b * 0.6 + 56 * 0.4; }
    if (e.wet && !wall) { r = r * 0.5 + 35; g = g * 0.5 + 66; b = b * 0.5 + 64; s = 0.9 + (s - 1) * 0.3; }
    if (e.guess) { var gr = (r + g + b) / 3; r = r * 0.7 + gr * 0.3; g = g * 0.7 + gr * 0.3; b = b * 0.7 + gr * 0.3; s *= 0.88; } // (not painted yet: v3's guess, drawn a little greyer)
    r *= s; g *= s; b *= s;
    var sn = wall ? 0 : Math.round(Math.max(0, Math.min(0.75, (e.h - 7000) / 2600)) * 8) / 8;
    if (sn) { r += (236 - r) * sn; g += (238 - g) * sn; b += (246 - b) * sn; }
    var cl = function (v) { return v < 0 ? 0 : v > 255 ? 255 : v | 0; };
    return 'rgb(' + cl(r) + ',' + cl(g) + ',' + cl(b) + ')';
  }
  // THE LOOK (10-21, the world bake seat; RULED his "agree with lean" to the mosaic, then his "it seems to me the second image could look more like the
  // first with a clever paintjob"): each column's top is the finest view of the ground under it, not one colour -- data/world-look.png, a half mile a pixel,
  // baked by tools/world-build.py (its ground the finest paint, its relief the hex map's own heights lit from the north-west), laid on the top as a pattern
  // in the world's plane raised to the column's height. A pattern fill costs some times a plain one, so a row's tops go in one fill for each raised
  // plane, the heights taken in steps of a sample and a half (the picture shifts under a half mile, unseen): a column's walls and top keep to its own
  // strip of the screen, so within a row the walls go first, then the tops, then the outlines and the decorations -- the painter's order kept row by row
  var LOOK = null;
  function lookPat(g, cam, off) { // (off: the plane raised that many px)
    var L = M.look; if (!L || !LOOK || !LOOK.ok || LOOK.v !== L.v) return null;
    if (!LOOK.pat || LOOK.g !== g) { LOOK.pat = g.createPattern(LOOK.img, 'no-repeat'); LOOK.g = g; }
    LOOK.pat.setTransform(new DOMMatrix([L.mi * cam.z, 0, 0, L.mi * cam.z * TILT, (L.x0 - cam.cx) * cam.z + cam.W / 2, (L.y0 - cam.cy) * cam.z * TILT + cam.H / 2 - off]));
    return LOOK.pat;
  }
  W.drawWorld = function (g, cam, hi) {
    var w = M.w, hh = w * SQ3 / 2, lmax = 14000 / 5280 * cam.z * cam.E, outline = w * cam.z >= 22;
    var y0 = cam.cy - (cam.H / 2) / (cam.z * TILT) - w, y1 = cam.cy + (cam.H / 2 + lmax) / (cam.z * TILT) + w, x0 = cam.cx - cam.W / 2 / cam.z - w, x1 = cam.cx + cam.W / 2 / cam.z + w;
    var poly = function (P) { g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1]); g.closePath(); };
    var wetT = Math.sin(D.frame / 40), look = !!lookPat(g, cam, 0), step = M.look ? Math.max(1, M.look.mi * cam.z * TILT * 1.5) : 1, rise = cam.z * cam.E / 5280;
    for (var r = Math.floor(y0 / hh); r <= Math.ceil(y1 / hh); r++) {
      var row = [], planes = {};
      for (var q = Math.floor(x0 / w - r / 2); q <= Math.ceil(x1 / w - r / 2); q++) {
        var e = M.hex[K(q, r)]; if (!e) continue;
        var c = hc(q, r), h = e.h, water = e.t === 'sea' || e.t === 'lake';
        var P = HCO.map(function (o) { return proj(cam, c[0] + o[0] * w, c[1] + o[1] * w, h); });
        if (!water) [[0, 1, q, r + 1, 0.62], [1, 2, q - 1, r + 1, 0.82]].forEach(function (f) {
          var n = M.hex[K(f[2], f[3])], hn = n ? n.h : Math.min(0, h) - 400; if (hn >= h - 1) return;
          var A = HCO[f[0]], B2 = HCO[f[1]];
          g.fillStyle = tone(e, f[4], true); poly([P[f[0]], P[f[1]], proj(cam, c[0] + B2[0] * w, c[1] + B2[1] * w, hn), proj(cam, c[0] + A[0] * w, c[1] + A[1] * w, hn)]); g.fill();
        });
        row.push([e, c, P, q]);
        if (look && !water) { var pk = Math.round(h * rise / step); (planes[pk] = planes[pk] || []).push(P); }
        else { g.fillStyle = water ? tone(e, 1 + 0.04 * wetT * ((q + r) & 1 ? 1 : -1)) : tone(e, e.lit); poly(P); g.fill(); }
      }
      Object.keys(planes).forEach(function (pk) {
        g.fillStyle = lookPat(g, cam, pk * step); g.beginPath();
        planes[pk].forEach(function (P) { g.moveTo(P[0][0], P[0][1]); for (var i = 1; i < 6; i++) g.lineTo(P[i][0], P[i][1]); g.closePath(); });
        g.fill();
      });
      for (var j = 0; j < row.length; j++) {
        var o = row[j], k = K(o[3], r);
        if (outline || (hi && hi[k])) { poly(o[2]); if (outline) { g.strokeStyle = 'rgba(20,12,6,.3)'; g.lineWidth = 0.6; g.stroke(); } if (hi && hi[k]) { g.strokeStyle = hi[k]; g.lineWidth = 1.5; g.stroke(); } }
        if (W.decorate) W.decorate(g, cam, o[0], o[1], o[2]); // (pass C: the trees, the peaks, the reeds)
      }
    }
  };
  var GH = null, VIS = null; // (THE FINE LAND, while it draws: the ground's own height, and whether a point on it is seen -- js/worldfine.js)
  function groundAt(cam, x, y) { if (GH) return proj(cam, x, y, GH(x, y)); var a = at(x, y); return proj(cam, x, y, hexTopH(a[0], a[1])); }
  W.drawWays = function (g, cam) {
    M.paths.forEach(function (P) {
      var river = P.kind === 'river', step = GH ? 0.25 : M.w * 0.25, pen = false; g.beginPath(); // (on the fine land a way follows the ground a quarter mile at a time)
      for (var i = 0; i + 1 < P.pts.length; i++) {
        var A = P.pts[i], B2 = P.pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(B2[0] - A[0], B2[1] - A[1]) / step));
        for (var j = 0; j <= n; j++) { var wy = A[1] + (B2[1] - A[1]) * j / n, s = groundAt(cam, A[0] + (B2[0] - A[0]) * j / n, wy); if (VIS && !VIS(s, wy)) { pen = false; continue; } if (!pen) g.moveTo(s[0], s[1]); else g.lineTo(s[0], s[1]); pen = true; }
      }
      g.lineJoin = 'round'; g.setLineDash(river ? [] : P.kind === 'track' ? [2, 2] : [4, 2]);
      g.strokeStyle = river ? 'rgba(80,160,200,.9)' : 'rgba(96,32,16,.95)'; g.lineWidth = river ? 1.6 : P.kind === 'track' ? 1 : 1.4; g.stroke(); g.setLineDash([]);
    });
  };
  var BIG = { city: 1, town: 1, castle: 1, inn: 1, school: 1, seat: 1 };
  function icon(g, kind, x, y) {
    g.lineWidth = 1; g.strokeStyle = '#2a180a'; g.fillStyle = '#efe0b8'; g.beginPath();
    if (kind === 'city') { g.fillRect(x - 4, y - 5, 8, 6); g.strokeRect(x - 4.5, y - 5.5, 9, 7); g.fillStyle = '#a8442e'; g.beginPath(); g.moveTo(x - 5, y - 5); g.lineTo(x, y - 9); g.lineTo(x + 5, y - 5); g.closePath(); g.fill(); g.stroke(); return; }
    if (kind === 'castle') { g.fillRect(x - 4, y - 7, 8, 8); g.strokeRect(x - 4.5, y - 7.5, 9, 9); g.fillRect(x - 5, y - 9, 2, 2); g.fillRect(x + 3, y - 9, 2, 2); return; }
    if (kind === 'school') { g.fillStyle = '#9b84d0'; g.moveTo(x, y - 10); g.lineTo(x + 3, y - 6); g.lineTo(x + 3, y + 1); g.lineTo(x - 3, y + 1); g.lineTo(x - 3, y - 6); g.closePath(); g.fill(); g.stroke(); return; }
    if (kind === 'inn' || kind === 'town' || kind === 'hamlet') { var s = kind === 'hamlet' ? 2.5 : 3.5; g.fillRect(x - s, y - s - 1, s * 2, s * 2); g.strokeRect(x - s - 0.5, y - s - 1.5, s * 2 + 1, s * 2 + 1); return; }
    if (kind === 'cave') { g.fillStyle = '#1a1008'; g.arc(x, y, 3.5, Math.PI, 0); g.closePath(); g.fill(); g.strokeStyle = '#efe0b8'; g.stroke(); return; }
    if (kind === 'gulch') { g.fillStyle = '#4a321e'; g.moveTo(x - 5, y - 4); g.lineTo(x - 1, y + 3); g.lineTo(x + 1, y + 3); g.lineTo(x + 5, y - 4); g.lineTo(x + 2, y - 4); g.lineTo(x, y); g.lineTo(x - 2, y - 4); g.closePath(); g.fill(); g.strokeStyle = '#efe0b8'; g.stroke(); return; } // (a ravine)
    if (kind === 'seat') { g.fillStyle = '#b5452a'; g.moveTo(x, y - 6); g.lineTo(x + 4, y + 1); g.lineTo(x - 4, y + 1); g.closePath(); g.fill(); g.stroke(); return; }
    if (kind === 'junction') { g.moveTo(x, y - 3); g.lineTo(x + 3, y); g.lineTo(x, y + 3); g.lineTo(x - 3, y); g.closePath(); g.fill(); g.stroke(); return; }
    g.strokeStyle = '#efe0b8'; g.moveTo(x - 2.5, y - 2.5); g.lineTo(x + 2.5, y + 2.5); g.moveTo(x + 2.5, y - 2.5); g.lineTo(x - 2.5, y + 2.5); g.stroke(); // (a mark)
  }
  var RANK = { city: 0, castle: 1, town: 2, inn: 2, seat: 3, school: 3, cave: 4, hamlet: 4, junction: 5, mark: 5 };
  // the pinned quest's place, a gold marker over it (10-29, Griz: "pinning quest doesn't give the yellow marker on the world map (Ned's Page)"): the floors' marker
  // (js/counter.js C.paintPin) on the place the step wants (js/hours.js H16.pinSite), bobbing; off the screen, held at its edge and pointing there
  W.pinAt = function () {
    var H6 = D.hours, st = W.house() && D.counter ? D.counter.state(null) : null, id = H6 && H6.pinSite && st ? H6.pinSite(st) : null;
    return id ? M.sites.filter(function (s) { return s.id === id; })[0] || null : null;
  };
  W.drawPin = function (g, cam, t) {
    var s = W.pinAt(); if (!s) return;
    var p = groundAt(cam, s.x, s.y), sx = p[0], sy = p[1] - 14, m = 14;
    var x = Math.max(m, Math.min(D.W - m, sx)), y = Math.max(m + 14, Math.min(D.H - 54, sy)), off = x !== sx || y !== sy, bob = Math.sin((t || 0) / 10) * 2;
    W.pinShown = { id: s.id, x: Math.round(x), y: Math.round(y), off: off };
    g.save(); g.translate(Math.round(x), Math.round(y + (off ? 0 : bob)));
    if (off) g.rotate(Math.atan2(sy - y, sx - x) - Math.PI / 2);
    g.fillStyle = '#1a1206'; g.beginPath(); g.moveTo(-7, -9); g.lineTo(7, -9); g.lineTo(0, 3); g.closePath(); g.fill();
    g.fillStyle = D.WIN8.gold; g.beginPath(); g.moveTo(-5, -8); g.lineTo(5, -8); g.lineTo(0, 1); g.closePath(); g.fill();
    g.restore();
  };
  W.drawPlaces = function (g, cam, names) {
    var boxes = [], order = M.sites.slice().sort(function (a, b) { return (RANK[a.kind] || 5) - (RANK[b.kind] || 5); });
    var drawn = GH && W.FINE && W.FINE.drawnIds ? W.FINE.drawnIds(cam) : null; // (the closest zoom: a place's own buildings stand for its icon, 11-03)
    order.forEach(function (s) { var p = groundAt(cam, s.x, s.y); if (p[0] < -40 || p[0] > cam.W + 40 || p[1] < -20 || p[1] > cam.H + 20) return; if (VIS && !VIS(p, s.y)) return; if (drawn && drawn[s.id]) return; icon(g, s.kind, Math.round(p[0]), Math.round(p[1])); });
    if (!names) return;
    order.forEach(function (s) { // (the names, the greater first; one that would overlap a name already written waits for a closer zoom)
      if (!BIG[s.kind] && cam.z < 8) return;
      var p = groundAt(cam, s.x, s.y), nm = s.name.replace(/ \(.*\)$/, ''), x = Math.round(p[0]) + 6, y = Math.round(p[1]) - 4, w = D.textWidth(nm), bx = [x - 1, y - 1, x + w + 1, y + 9];
      if (VIS && !VIS(p, s.y)) return; // (THE FINE LAND: a place behind a ridge is not named)
      if (boxes.some(function (b) { return bx[0] < b[2] && bx[2] > b[0] && bx[1] < b[3] && bx[3] > b[1]; })) return;
      boxes.push(bx); D.text(g, nm, x, y, BIG[s.kind] ? '#f6e9c5' : '#c8bca0');
    });
  };
  // ---------------------------------------------------------------- PASS C: the decorations, drawn by code (RULED 10-20, "like a decorated iso-preview? yes"; the week's art
  // budget is spent, so no sheet): trees on woods, a peak on the mountains, mounds on hills, reeds on the wet, furrows on farmland, roofs on a town, glints on
  // water -- each hex's own by its position, and its second ground's in its share (a plain with some wood has a few trees)
  function hh(q, r, i) { var h = (Math.imul(q, 73856093) ^ Math.imul(r, 19349663) ^ Math.imul(i + 1, 83492791)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h % 10000) / 10000; }
  function topPt(P, u, v) { // a point on the hex's top: u across (0 west .. 1 east), v down (0 north .. 1 south)
    var x = P[3][0] + (P[0][0] - P[3][0]) * u, yTop = P[4][1], yBot = P[1][1]; return [x, yTop + (yBot - yTop) * (0.18 + 0.64 * v)];
  }
  W.decorate = function (g, cam, e, c, P) {
    var s = cam.z * M.w / 30; if (s < 0.45) return; // (the hex's size, 1 at the default zoom)
    var draw1 = function (t, n0) {
      var n = Math.round(n0);
      for (var i = 0; i < n; i++) {
        var p = topPt(P, 0.2 + 0.6 * hh(e.q, e.r, i * 2), 0.15 + 0.7 * hh(e.q, e.r, i * 2 + 1)), x = Math.round(p[0]), y = Math.round(p[1]);
        if (t === 'woods') { var th = Math.max(3, Math.round(6 * s)); g.fillStyle = '#3a2410'; g.fillRect(x, y - 1, 1, 2); g.fillStyle = i & 1 ? '#2f5a2a' : '#3d6e30'; g.beginPath(); g.moveTo(x + 0.5, y - th); g.lineTo(x + 0.5 + th * 0.45, y); g.lineTo(x + 0.5 - th * 0.45, y); g.closePath(); g.fill(); }
        else if (t === 'black' || t === 'gray' || t === 'coastal') { var ph = Math.max(4, Math.round(8 * s)), snow = e.h > 6500; g.fillStyle = t === 'black' ? '#2a2430' : '#6a5a48'; g.beginPath(); g.moveTo(x, y - ph); g.lineTo(x + ph * 0.7, y); g.lineTo(x - ph * 0.7, y); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(x, y - ph); g.lineTo(x - ph * 0.7, y); g.lineTo(x - ph * 0.2, y); g.closePath(); g.fill(); if (snow) { g.fillStyle = '#eef0f6'; g.beginPath(); g.moveTo(x, y - ph); g.lineTo(x + ph * 0.25, y - ph * 0.62); g.lineTo(x - ph * 0.25, y - ph * 0.62); g.closePath(); g.fill(); } }
        else if (t === 'hills' || t === 'foothills') { var mr = Math.max(2, Math.round(4 * s)); g.strokeStyle = 'rgba(60,36,14,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y + 1, mr, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
        else if (t === 'bog' || t === 'wet') { g.strokeStyle = '#3c5a2a'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1, y - 3 * s); g.moveTo(x + 1, y); g.lineTo(x + 1, y - 4 * s); g.moveTo(x + 2, y); g.lineTo(x + 3, y - 3 * s); g.stroke(); }
        else if (t === 'farms') { g.strokeStyle = 'rgba(120,90,40,.55)'; g.lineWidth = 1; g.beginPath(); for (var f = -1; f <= 1; f++) { g.moveTo(x - 4 * s, y + f * 2); g.lineTo(x + 4 * s, y + f * 2 - 1); } g.stroke(); }
        else if (t === 'town') { var hw = Math.max(2, Math.round(3 * s)); g.fillStyle = '#d8ccb0'; g.fillRect(x - hw, y - hw, hw * 2, hw); g.fillStyle = '#a8442e'; g.beginPath(); g.moveTo(x - hw - 1, y - hw); g.lineTo(x, y - hw * 2); g.lineTo(x + hw + 1, y - hw); g.closePath(); g.fill(); }
        else if (t === 'verge' || t === 'plains') { g.strokeStyle = t === 'verge' ? 'rgba(70,110,40,.55)' : 'rgba(120,96,50,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1, y - 2); g.moveTo(x + 1, y); g.lineTo(x + 2, y - 2); g.stroke(); }
        else if (t === 'sea' || t === 'lake') { if (((D.frame >> 4) + i + e.q) % 3) continue; g.fillStyle = 'rgba(220,240,250,.55)'; g.fillRect(x - 2, y, 3, 1); }
      }
    };
    // a gulch (his "gulch isn't gulching"): a ravine cut across the hex's top, dark between pale banks, along the road where one runs down through it
    if (e.t === 'gulch' || (e.t2 === 'gulch' && e.sh2 >= 0.08)) {
      var rd = M.road[K(e.q, e.r)], dx = 0.9, dy = 0.45, bd = 1e9;
      if (rd) for (var j = 0; j + 1 < rd.pts.length; j++) {
        var a = rd.pts[j], b = rd.pts[j + 1], vx = b[0] - a[0], vy = b[1] - a[1], l2 = vx * vx + vy * vy || 1, t0 = Math.max(0, Math.min(1, ((c[0] - a[0]) * vx + (c[1] - a[1]) * vy) / l2)), dd = Math.hypot(c[0] - a[0] - vx * t0, c[1] - a[1] - vy * t0);
        if (dd < bd) { bd = dd; dx = vx; dy = vy; }
      }
      var nl = Math.hypot(dx, dy) || 1; dx /= nl; dy /= nl;
      var L0 = M.w * 0.42, rv = [];
      for (var k2 = -3; k2 <= 3; k2++) { var jt = (hh(e.q, e.r, 40 + k2) - 0.5) * M.w * 0.1; rv.push(proj(cam, c[0] + dx * (k2 / 3) * L0 - dy * jt, c[1] + dy * (k2 / 3) * L0 + dx * jt, e.h)); }
      var line = function () { g.beginPath(); g.moveTo(rv[0][0], rv[0][1]); for (var i2 = 1; i2 < rv.length; i2++) g.lineTo(rv[i2][0], rv[i2][1]); };
      g.lineCap = 'round'; g.lineJoin = 'round';
      line(); g.strokeStyle = '#c8a878'; g.lineWidth = Math.max(2.4, 6 * s); g.stroke();
      line(); g.strokeStyle = '#26160a'; g.lineWidth = Math.max(1.4, 3.6 * s); g.stroke();
      g.lineCap = 'butt';
    }
    var main = e.wet ? 'wet' : e.t, nMain = { woods: 4, black: 1, gray: 1, coastal: 1, hills: 2, foothills: 1, bog: 3, wet: 3, farms: 1, town: 2, verge: 2, plains: 1, sea: 2, lake: 2 }[main] || 0;
    draw1(main, nMain * (e.t2 ? 1 - (e.sh2 || 0) : 1));
    if (e.t2 && e.sh2 >= 0.2) draw1(e.t2, ({ woods: 4, hills: 2, farms: 1, bog: 3, black: 1, gray: 1 }[e.t2] || 0) * e.sh2 * 1.5);
  };
  var SKY = { night: 'rgba(16,24,72,.45)', dawn: 'rgba(255,160,110,.14)', morning: null, midday: null, afternoon: 'rgba(255,220,150,.06)', dusk: 'rgba(255,110,50,.2)' };
  // the sky turning as the hours pass (RULED 10-21 night, his "The screen"): an hour's sky is its time of day's, and through the last half hour before the next
  // it fades to that one's -- while the party walks, the hour drawn runs on with the token, so the light goes over a day's march as it goes
  var SKYC = {}; Object.keys(SKY).forEach(function (k) { var m = SKY[k] && /rgba\((\d+),(\d+),(\d+),([\d.]+)\)/.exec(SKY[k]); SKYC[k] = m ? [+m[1], +m[2], +m[3], +m[4]] : null; });
  W.skyAt = function (h) {
    h = ((h % 24) + 24) % 24; var a = W.todAt(h), B = [5, 7, 11, 14, 17, 20, 29].filter(function (b) { return b > h; })[0], left = B - h;
    if (left >= 0.5) return SKY[a];
    var b = W.todAt(B % 24), A = SKYC[a], C = SKYC[b]; if (a === b || (!A && !C)) return SKY[a];
    var u = 1 - left / 0.5, A2 = A || [C[0], C[1], C[2], 0], C2 = C || [A[0], A[1], A[2], 0], mix = function (i) { return A2[i] + (C2[i] - A2[i]) * u; };
    return 'rgba(' + Math.round(mix(0)) + ',' + Math.round(mix(1)) + ',' + Math.round(mix(2)) + ',' + mix(3).toFixed(3) + ')';
  };
  World.prototype.hourShown = function () { // (the clock's hour, run on through the step the token is taking)
    var w = this.walk; if (!w || !w.path.length || !w.f) return W.hour();
    var st = W.stepHours(S.at, w.path[0]); if (!st) return W.hour(); var hrs = W.house() ? D.house.marchHours(st) : st.h;
    return (S.t + hrs * w.f / STEPF) % 24;
  };
  World.prototype.draw = function (ctx) {
    if (this.view === 'tiles') { W.OV.draw(this, ctx); return; }
    var cam = this.camObj(), hi = {};
    ctx.fillStyle = '#1b2433'; ctx.fillRect(0, 0, D.W, D.H);
    if (this.plan) this.plan.hexes.forEach(function (p) { hi[K(p[0], p[1])] = 'rgba(255,214,60,.55)'; });
    if (this.hov) hi[K(this.hov[0], this.hov[1])] = this.plan ? '#ffd23c' : 'rgba(255,90,80,.8)';
    var fine = this.fineDoor && W.FINE.live(); // (THE FINE LAND, a trial: js/worldfine.js; the hex view as it was without its door)
    if (fine) { W.FINE.draw(ctx, cam, hi, S.at); GH = W.FINE.groundH; VIS = W.FINE.vis; } else W.drawWorld(ctx, cam, hi);
    W.drawWays(ctx, cam); if (fine && W.FINE.ringsAt(cam.z) < 0) W.FINE.builtN = W.FINE.built(ctx, cam); // (the closest zoom: his squares built on, over the roads and rivers, 11-03)
    W.drawPlaces(ctx, cam, true); W.drawPin(ctx, cam, this.t); if (W.drawWagon) W.drawWagon(ctx, cam, this.t); W.drawVessel(ctx, cam, this.t); GH = VIS = null; // (the wagon on the road while it runs: js/wagon.js, 11-04)
    // the party: a banner on the hex's top, bobbing as it walks
    var onLand = fine && W.FINE.ringsAt(cam.z) < 0, pa = onLand || M.near ? W.restPt() : hc(S.at[0], S.at[1]), ph = onLand ? W.FINE.groundH(pa[0], pa[1]) : hexTopH(S.at[0], S.at[1]); // (at the closest zoom its hex is the land: the banner on the ground at its own spot; on the area at its spot, a road's own point)
    if (this.walk && this.walk.path.length) { var nx = this.walk.path[0], u = this.walk.f / STEPF; pa = M.near ? W.walkPt(this.walk, u) : (function (pb) { return [pa[0] + (pb[0] - pa[0]) * u, pa[1] + (pb[1] - pa[1]) * u]; })(hc(nx[0], nx[1])); ph = onLand ? W.FINE.groundH(pa[0], pa[1]) : ph + (hexTopH(nx[0], nx[1]) - ph) * u; }
    var tp = proj(cam, pa[0], pa[1], ph), bob = this.walk ? Math.round(Math.abs(Math.sin(this.t / 4)) * 2) : 0, tx = Math.round(tp[0]), ty = Math.round(tp[1]) - bob;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(tx, Math.round(tp[1]), 5, 2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a2410'; ctx.fillRect(tx - 1, ty - 15, 2, 15);
    ctx.fillStyle = '#d8402c'; ctx.beginPath(); ctx.moveTo(tx + 1, ty - 15); ctx.lineTo(tx + 10, ty - 12); ctx.lineTo(tx + 1, ty - 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f8d878'; ctx.fillRect(tx + 2, ty - 13, 2, 2);
    var sky = W.skyAt(this.hourShown()); if (sky) { ctx.fillStyle = sky; ctx.fillRect(0, 0, D.W, D.H); }
    if (onLand && W.FINE.lights) W.FINE.lights(ctx, cam, W.todAt(this.hourShown())); // (the built squares' windows and fires after the sky, 11-03)
    this.hud(ctx);
    if (this.pm) { ctx.fillStyle = 'rgba(4,3,10,.6)'; ctx.fillRect(0, 0, D.W, D.H); D.ui.drawMenu(ctx, this.pm); }
  };
  World.prototype.hud = function (ctx) {
    var e = M.hex[K(S.at[0], S.at[1])], T = M.terr[e.t], tod = W.todAt(this.hourShown());
    D.win8(ctx, 4, 4, 196, 30);
    D.text(ctx, '{y}' + tod.charAt(0).toUpperCase() + tod.slice(1) + '{/}' + (M.near ? '  {g}the Silverton area{/}' : '') + (this.dev ? '  {g}(day ' + W.day() + ', ' + W.hour().toFixed(1) + 'h, ' + S.today.toFixed(1) + 'h walked){/}' : ''), 10, 9, D.WIN8.text);
    D.text(ctx, T.name + (M.road[K(S.at[0], S.at[1])] ? ', on ' + M.road[K(S.at[0], S.at[1])].name.replace(/ \(.*\)$/, '') : '') + ' · ' + Math.round(e.h).toLocaleString() + ' ft', 10, 20, '#c8c4b8');
    if (this.hov && !this.walk) {
      var he = M.hex[K(this.hov[0], this.hov[1])], lines = [], hcv = hc(this.hov[0], this.hov[1]), pwv = M.near && !he ? atw(hcv[0], hcv[1], MS.world.w) : null, past = pwv && MS.world.hex[K(pwv[0], pwv[1])];
      if (past) he = past; // (past the area's edge: THE WORLD's hex there)
      if (he) {
        var ss = ((past ? MS.world : M).siteAt[K(he.q, he.r)] || []).map(function (s) { return s.name; });
        lines.push((ss.length ? ss.join(', ') + ' · ' : '') + M.terr[he.t].name + (he.guess ? ' {g}(v3’s guess){/}' : '') + ' · ' + Math.round(he.h).toLocaleString() + ' ft' + (past ? ' {g}(THE WORLD){/}' : ''));
        if (this.plan) { var hrs = this.plan.hours, d = W.house() ? Math.floor(((S.todayHex || 0) + this.plan.march) / D.house.DAYHEX - 1e-6) : Math.floor((S.today + hrs) / W.DAYHOURS - 1e-6); /* (the camps the walk will ask for: the house's by the day's hexes) */ lines.push(this.plan.hexes.length + ' hex' + (this.plan.hexes.length > 1 ? 'es' : '') + (this.plan.beyond ? ' and ' + this.plan.beyond + ' of THE WORLD' : '') + ' · ' + (hrs < 10 ? hrs.toFixed(1) + ' hours' : (hrs / W.DAYHOURS).toFixed(1) + ' days of walking') + (d > 0 ? ' · ' + d + ' camp' + (d > 1 ? 's' : '') : '')); }
        else if (W.MOUNTAIN[he.t]) lines.push('{g}the mountains: their roads are roams (to come){/}');
        else if (!W.walkable(he)) lines.push('{r}no one walks it{/}');
        else if (K(this.hov[0], this.hov[1]) !== K(S.at[0], S.at[1])) lines.push('{r}no way there{/}');
      } else lines.push('{g}off the map{/}');
      var bw = 8 + Math.max.apply(null, lines.map(function (l) { return D.textWidth(l); })), bx = Math.min(D.W - bw - 4, I.mouse.x + 10), by = Math.min(D.H - 14 - lines.length * 10, I.mouse.y + 10);
      ctx.fillStyle = 'rgba(8,8,20,.85)'; ctx.fillRect(bx, by, bw, 6 + lines.length * 10);
      lines.forEach(function (l, i) { D.text(ctx, l, bx + 4, by + 4 + i * 10, '#e8e4d8'); });
    }
    var me = this; this.hudBtns = W.house() ? [['THE PARTY', function () { D.house.openMenu(me); }], ['CAMP', function () { me.campCard(); }], ['HERE', function () { me.here(); }]].map(function (q, i) { return { x: D.W - 4 - (3 - i) * 64, y: D.H - 50, w: 60, h: 13, label: q[0], go: q[1] }; }) : null; // (the keys as buttons: his 10-21 "playable by mouse only")
    this.hudBottom(ctx, 'click: travel  arrows: a hex  E: here  SPACE: camp  ' + (W.house() ? 'M: the party  ' : '') + (this.fineDoor ? 'F: ' + (W.FINE.on ? 'hex tops' : 'the land') + '  ' : '') + 'V: tiles  wheel: zoom');
    if (this.fineDoor && W.FINE.showLabel(this.t - (this.fineT == null ? -999 : this.fineT))) { var fl = W.FINE.label(), fw = D.textWidth(fl) + 10; D.win8(ctx, D.W - fw - 4, 4, fw, 16); D.text(ctx, fl, D.W - fw + 1, 8, W.FINE.on ? D.WIN8.gold : D.WIN8.text); } // (the look named on screen: as it unpacks, and a moment after F)
  };
  W.button = function (ctx, b) { var mo = I.mouse, hov = mo.inside && mo.x >= b.x && mo.x < b.x + b.w && mo.y >= b.y && mo.y < b.y + b.h; ctx.fillStyle = hov ? D.WIN8.sel : 'rgba(16,18,58,.85)'; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeStyle = hov ? D.WIN8.gold : D.WIN8.mid; ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1); D.text(ctx, b.label, b.x + b.w / 2, b.y + 3, b.off ? '#6c6c84' : hov ? D.WIN8.gold : D.WIN8.text, 'center'); }; // (b.off: greyed, 11-05)
  World.prototype.hudBottom = function (ctx, hint) { // (the message, the keys and the card: both views')
    if (this.msg && this.msg.t < 360) { var mw = Math.min(D.W - 16, D.textWidth(this.msg.s) + 12); ctx.fillStyle = 'rgba(8,8,20,.8)'; ctx.fillRect((D.W - mw) / 2, D.H - 30, mw, 13); D.text(ctx, this.msg.s, D.W / 2, D.H - 27, '#f6e9c5', 'center'); }
    D.hint(ctx, hint, D.W / 2, D.H - 12, '#9a96a8', 'center');
    if (this.cards.length) {
      var cd = this.cards[0], nb = cd.keys ? cd.keys.length : 0, cw = 300, KN = { a: 'E', b: 'X', rec: 'R' }, lbOf = function (k) { return k[2] || KN[k[0]] || k[0]; }, bw = Math.min(96, Math.floor((cw - 12 - (nb - 1) * 6) / nb));
      var wide = nb && cd.keys.some(function (k) { return D.textWidth(lbOf(k)) + 8 > bw; }), rowsB = [[]], rwB = 0; // (wide: each its own width, as many rows as they need -- WAIT's five on THE WORLD, 11-05)
      if (wide) cd.keys.forEach(function (k, i) { var w = D.textWidth(lbOf(k)) + 12; if (rwB && rwB + 6 + w > cw - 12) { rowsB.push([]); rwB = 0; } rowsB[rowsB.length - 1].push({ i: i, w: w }); rwB += (rwB ? 6 : 0) + w; });
      var ch = 14 + cd.lines.length * 10 + (nb ? 18 + (wide ? (rowsB.length - 1) * 16 : 0) : 0), cx = (D.W - cw) / 2, cy = (D.H - ch) / 2;
      D.win8(ctx, cx, cy, cw, ch); cd.lines.forEach(function (l, i) { D.text(ctx, l, D.W / 2, cy + 8 + i * 10, D.WIN8.text, 'center'); });
      if (nb) { // (each choice a button: a click is its key)
        var bx0 = Math.round(D.W / 2 - (nb * bw + (nb - 1) * 6) / 2), by0 = cy + ch - 18;
        if (!wide) cd.btns = cd.keys.map(function (k, i) { return { x: bx0 + i * (bw + 6), y: by0, w: bw, h: 13, label: lbOf(k), off: !!k[3] }; });
        else { cd.btns = []; rowsB.forEach(function (row, r) { var tw = row.reduce(function (a, q) { return a + q.w; }, 0) + (row.length - 1) * 6, x = Math.round(D.W / 2 - tw / 2), y = by0 - (rowsB.length - 1 - r) * 16; row.forEach(function (q) { cd.btns[q.i] = { x: x, y: y, w: q.w, h: 13, label: lbOf(cd.keys[q.i]), off: !!cd.keys[q.i][3] }; x += q.w + 6; }); }); }
        cd.btns.forEach(function (b) { W.button(ctx, b); });
      }
    }
    if (this.hudBtns && this.view !== 'tiles' && !this.cards.length && !this.pm) this.hudBtns.forEach(function (b) { W.button(ctx, b); });
  };
  // ---------------------------------------------------------------- PASS B: THE ROAD'S FIGHTS (RULED 10-20: "let's try simplified random encounters suspecting we'll
  // let players turn on a 'full grid rando' option"; the SRD has none, so these are ours). Each hex walked counts down its zone's chance, the 8-bit's own
  // (content/encounters.json): the zone read off the ground he painted -- the Doors in the mountains, the Glowseep on the wet and the bog, the gulch, the gnoll
  // hills, the Verge, the south past the inn, the north -- its steps between fights a quarter as many hexes, a road hex counting half (the 8-bit's roadSafe).
  // A fight is the 8-bit's lineup on a small 16-bit field cut from the hex's ground: the four on one side, the foes on the other, one square between, so a blow
  // is a step forward (his "4 guys on one side, them on the other - moves forward a square during attacks"); DEEP16's own fight and rules on it.
  // THE MIRROR-MADE (his "note an entry on the encounter table for 'mirror-made version' weighed by game day"): one more entry on every zone's table, a group
  // of the zone as Mr. Ripples makes things -- the mirror hyena where there is one, else the creature with the Mirror's eyes -- weighing nothing the first day,
  // half a group more each day after, to six (the seat's numbers, his to tune).
  W.LEVEL = 5; W.HEXSTEPS = 4; W.MIRROR = { hyena: 'mirrorhyena' };
  W.zoneOf = function (e, m) { // (m: the map the hex is of, else the one up -- a making's ground is THE WORLD's whatever map the party walks: THE MAKINGS BY THEIR GROUND, below)
    m = m || M; var inn = m.sites.filter(function (s) { return s.id === 'inn'; })[0];
    var ss = m.siteAt[K(e.q, e.r)] || [];
    if (e.t === 'gulch' || (e.t2 === 'gulch' && e.sh2 >= 0.08) || ss.some(function (s) { return s.kind === 'gulch'; })) return 'gulch'; // (Web Gulch: his "gulch isn't gulching or a location")
    if (/^(black|gray|coastal)$/.test(e.t)) return 'doors';
    if (e.wet || e.t === 'bog') return 'glowseep';
    if (e.t === 'hills' || e.t === 'foothills') return 'gnollhills';
    if (e.t === 'verge') return 'verge';
    return inn && hcw(e.q, e.r, m.w)[1] > inn.y + 2 ? 'south' : 'north';
  };
  // THE VESSEL'S ROAD (RULED 11-12, Griz: "Only thing we really need in there is the vessel's road to determine made creature spawn and encounter rates - rest can hold";
  // ..\handoff-2026-10-13-the-clock.md, the vessel-road seat): Mr. Ripples walks the 11-05 beeline -- RULED, "I don't see the old-one as bothering to calculate terrain with a
  // b-line from one or two hexes north of the moot (where he was created)" -- from (7,15) straight to the Galleries junction, then up the Coldridge Route as THE WORLD draws it,
  // at half a man's pace (the SRD's 24 mi a day halved: 12, dawn to dusk, from dawn of day 2), the ground slowing his feet as THE WORLD's walk does (a difficult hex at half,
  // a road at its own going). THE MAKINGS (RULED 11-04, his "lean": days 5 and 7 and every second day after, he turns the area's random-encounter monsters into his mirrored
  // abominations; reports reach places from day 8, by where he was at each making) are made WHERE HE IS at noon of a making day, and a made thing stays where it was made: the
  // weight of the mirror-made entry on a zone's table is THE FALLOFF -- 6 (the old cap) at a making's place, falling straight to 0 at its reach; the reach 10 mi on its day
  // and 6 mi more each day after (made things wandering from it, half his pace), to 40 at most; the strongest making counts. The ground he has not reached is clean; his
  // trail stays dangerous: a point whose nearest stretch of his road he has not walked yet weighs nothing. The day-5 making's reach meets the inn's 26 mi on day 8, when the reports do. Near them the road's fights also come more often: the count runs
  // (1 + W.VESSEL.rate * weight / 6) times as fast, 1.5 at a making. THE WARDED FORT (RULED 11-12, Griz: "1 - he's supposed to hold at the warded fort"): he walks the Route at the table's pace
  // to the Warded Fort's mark (W.VESSEL.hold, read off the map) and is held THERE from that hour; no making after it, no reach grows after it; he never goes on to the Doors. What comes after (RULED 11-07,
  // his "gets his butt kicked at the warded place, he'll head down to the underground route after licking his wounds for a while"): how long, where -- OPEN, his. Made things
  // never fade (RULED 11-12, "2 - for now"). NOTHING OF IT IS PLAYER VISIBLE (RULED 11-12, Griz: "vessel's road - should be nothing to watch, this is all background to
  // determine random encounters and achieve for party, nothing player visible"): only the weights; the drawing below is a seats' debug view behind the &vessel flag alone
  W.VESSEL = {
    from: [7, 15], to: 'jct', route: 'pmvbkme9a', mpd: 12, dawn: 6, dusk: 18, day0: 2, hold: 'smvbkn0zk',
    makings: [3, 5, 7, 9, 11, 13], makeHour: 12, /* (3: THE HARBINGER'S DAY, a making like the rest -- THE MAKINGS BY THEIR GROUND, below) */ reach: [10, 6, 40], peak: 6, rate: 0.5,
    // the 11-05 table's dawn and dusk hexes, re-walked on THE WORLD as baked 11-05 (the Coldridge's going 1.8 since the 11-05 night, 1.43 when the table was cut): days 2 to 8
    // as the table; 9 to 11 a hex behind it (the climb slower); then held at the Warded Fort from 12:30 on day 11 (the table walked him on to the Doors late on day 12)
    table: { 2: [[7, 15], [10, 13]], 3: [[10, 13], [13, 11]], 4: [[13, 11], [14, 10]], 5: [[14, 10], [16, 9]], 6: [[16, 9], [17, 8]], 7: [[17, 8], [19, 7]], 8: [[19, 7], [19, 7]],
      9: [[19, 7], [19, 6]], 10: [[19, 6], [18, 6]], 11: [[18, 6], [17, 6]], 12: [[17, 6], [17, 6]] }
  };
  var VR = { src: null, pts: null };
  W.vesselRoad = function () { // (his road as one line of miles on THE WORLD: [x, y, the walk's miles to here] -- the ground's going counted in)
    var MW = MS.world; if (!MW) return null; if (VR.src === MW) return VR.pts;
    var V = W.VESSEL, a = hcw(V.from[0], V.from[1], MW.w), js = MW.sites.filter(function (s) { return s.id === V.to; })[0], RP = MW.pathById[V.route];
    if (!js || !RP) return null;
    var b = [js.x, js.y], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / 0.05), pts = [[a[0], a[1], 0]], eff = 0, px = a[0], py = a[1];
    for (var i = 1; i <= n; i++) {
      var x = a[0] + (b[0] - a[0]) * i / n, y = a[1] + (b[1] - a[1]) * i / n, hq = atw((x + px) / 2, (y + py) / 2, MW.w), he = MW.hex[K(hq[0], hq[1])], T = he && MW.terr[he.t];
      eff += Math.hypot(x - px, y - py) * (T && +T.cost && T.diff ? 2 : 1); px = x; py = y; pts.push([x, y, eff]);
    }
    var rp = (RP.pts || []).filter(function (p) { return Array.isArray(p); }), go = RP.going || (RP.difficult ? 2 : 1);
    for (var j = 1; j < rp.length; j++) { eff += Math.hypot(rp[j][0] - px, rp[j][1] - py) * go; px = rp[j][0]; py = rp[j][1]; pts.push([px, py, eff]); }
    var fs = MW.sites.filter(function (s) { return s.id === V.hold; })[0], hE = eff, hd = 1e9; // (THE WARDED FORT: the walk-miles where his road passes nearest its mark)
    if (fs) for (var k = 1; k < pts.length; k++) { var p0 = pts[k - 1], p1 = pts[k], vx = p1[0] - p0[0], vy = p1[1] - p0[1], L2 = vx * vx + vy * vy, u = L2 ? Math.max(0, Math.min(1, ((fs.x - p0[0]) * vx + (fs.y - p0[1]) * vy) / L2)) : 0, dk = Math.hypot(fs.x - p0[0] - u * vx, fs.y - p0[1] - u * vy); if (dk < hd) { hd = dk; hE = p0[2] + (p1[2] - p0[2]) * u; } }
    VR.src = MW; VR.pts = pts; VR.holdE = hE; VR.holdOff = hd; return pts;
  };
  W.vesselMiles = function (t) { // (the walk's miles by S.t: none before dawn of day 2, 12 a day dawn to dusk; vesselAt holds him at the Warded Fort)
    var V = W.VESSEL, d = Math.floor(t / 24) + 1, h = t - (d - 1) * 24;
    if (d < V.day0) return 0; // (no cap here: vesselAt holds him at the Warded Fort -- RULED 11-12, "1 - he's supposed to hold at the warded fort")
    return (d - V.day0) * V.mpd + V.mpd * Math.max(0, Math.min(1, (h - V.dawn) / (V.dusk - V.dawn)));
  };
  W.vesselAt = function (t) { // (where he is at S.t (default now): his point in miles, his hex on THE WORLD, the walk's miles, held or not)
    if (t == null) t = S ? S.t : 0; var pts = W.vesselRoad(); if (!pts) return null;
    var e = Math.min(W.vesselMiles(t), VR.holdE), p = pts[pts.length - 1];
    for (var i = 1; i < pts.length; i++) if (pts[i][2] >= e) { var a = pts[i - 1], b = pts[i], f = b[2] > a[2] ? (e - a[2]) / (b[2] - a[2]) : 0; p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; break; }
    return { pt: [p[0], p[1]], hex: atw(p[0], p[1], MS.world.w), mi: e, held: e >= VR.holdE, end: VR.holdE, fortOff: VR.holdOff };
  };
  W.vesselArrives = function () { var pts = W.vesselRoad(), V = W.VESSEL; if (!pts) return Infinity; var E = VR.holdE, n = Math.floor(E / V.mpd); return (V.day0 + n - 1) * 24 + V.dawn + (E - n * V.mpd) / V.mpd * (V.dusk - V.dawn); }; // (S.t at the Warded Fort: he is held from it)
  W.makings = function (t) { // (the makings made by S.t: each its day, its place, its reach now)
    if (t == null) t = S ? S.t : 0; var V = W.VESSEL, tA = W.vesselArrives(), tg = Math.min(t, tA);
    return V.makings.map(function (d) { var tm = (d - 1) * 24 + V.makeHour, at = W.vesselAt(tm); return at && t >= tm && tm <= tA ? { day: d, t: tm, pt: at.pt, hex: at.hex, reach: Math.min(V.reach[2], V.reach[0] + V.reach[1] * Math.max(0, tg - tm) / 24) } : null; }).filter(Boolean);
  };
  W.partyPt = function () { return S && M ? hc(S.at[0], S.at[1]) : null; }; // (the party's hex's middle in miles: one plane for both maps)
  W.mirrorAt = function (pt, t) { // (THE FALLOFF, above: the mirror-made entry's weight at a point in miles (default the party's) at S.t (default now), the making it comes from -- the strongest there -- and `all`, every making whose reach holds the point with its own weight there: WHERE THEY OVERLAP, below)
    var no = { w: 0, m: null, all: [] }, all = []; pt = pt || W.partyPt(); if (!pt) return no; var V = W.VESSEL, w = 0, mm = null, pts = W.vesselRoad(); if (!pts) return no;
    var bi = 0, bd = 1e9; for (var i = 0; i < pts.length; i += 4) { var dd = Math.hypot(pt[0] - pts[i][0], pt[1] - pts[i][1]); if (dd < bd) { bd = dd; bi = i; } }
    if (pts[bi][2] > W.vesselAt(t).mi + 1) return no; // (AHEAD OF HIM: the nearest stretch of his road not walked yet -- clean, whatever wanders from behind)
    W.makings(t).forEach(function (m) { var d = Math.hypot(pt[0] - m.pt[0], pt[1] - m.pt[1]); if (d < m.reach) { var wm = V.peak * (1 - d / m.reach); all.push({ m: m, w: wm }); if (wm > w) { w = wm; mm = m; } } });
    return { w: w, m: mm, all: all };
  };
  W.mirrorWeight = function (pt, t) { return W.mirrorAt(pt, t).w; };
  // THE MAKINGS BY THEIR GROUND (RULED 11-13, Griz: "there should be a path of Mr Ripples that the player doesn't see that determines when/where he makes creatures - these
  // would be ones made when he makes on seep tiles I think"; then "follow Mr Ripples path, determine the random encounter tables used for those types and choose two creatures
  // from each random encounter list to have him mirror-make. Marsh should be similar enough to the seep that the wisp and stirge are on that list"): what a making leaves is
  // two creatures of the table of the ground HE STOOD ON (W.zoneOf of his hex on THE WORLD), made over -- on the marsh (the Glowseep's table: days 5 and 7, the bog) the
  // will-o'-wisp and the stirge, his word; in the mountains (the Doors' table: days 9 and 11, the Coldridge's black mountains) the wolf and the worg, the seat's call, the
  // only two on that table. The mirror-made entry near a making draws from those: the groups of that ground's table made of the two alone, at the table's own weights and
  // counts (and the night's), each turned to its mirror (data/foes.js) -- IN PLACE OF a group of the party's own zone with the Mirror in its eyes, which is still what a
  // making on a ground with no list here leaves (none of the four is). So a party in the foothills by the Coldridge meets mirror wolves, and one on the plains by the marsh
  // mirror stirges: the ground he made on, not the ground they walk. Nothing of it is player visible but the fight itself
  // THE HARBINGER'S DAY (RULED 11-13, Griz, on the mirror hyena no longer met by the road: "count the making of the harbinger day as a making like a tile making day also,
  // should bring mirror hyena back (if not harbinger fight still has them)"): day 3 (RULED 11-04, "day 3 harbinger essentially tries to get through to the old chief and
  // gets made by the old one instead") is a making like the four -- at noon, where he stands that day, in the hills (the gnoll hills' table), the same reach and falloff.
  // What it leaves by the road is the mirror hyena: the gnoll he made over that day is the Harbinger himself, one of a kind and no road's fight, so the hills' list is
  // the hyena alone (the seat's reading of "should bring mirror hyena back")
  W.MADE = { glowseep: { wisp: 'mirrorwisp', stirge: 'mirrorstirge' }, doors: { wolf: 'mirrorwolf', worg: 'mirrorworg' }, gnollhills: { hyena: 'mirrorhyena' } };
  W.makingZone = function (m) { var MW = MS.world, e = MW && m && MW.hex[K(m.hex[0], m.hex[1])]; return e ? W.zoneOf(e, MW) : null; }; // (the table of the ground he stood on)
  // WHERE THEY OVERLAP (RULED 11-13, Griz: "where the zones overlap party random encounters could include either"): at a point inside more than one making's reach a
  // mirror-made draw is of ONE of them, each making drawn in proportion to its own weight there (W.mirrorAt's `all`; roll: D.rand, once, only where they overlap). How
  // OFTEN a mirror-made thing is met is not changed by it: the entry's weight on the table and the road's faster count are still the strongest making's alone, not the sum
  W.madeAt = function (pt, t, roll) { // (the making drawn at a point -- the strongest, or with roll one of those overlapping by weight -- its ground's table, what is made on it and that table's groups of them: null where a ground has no list)
    var a = W.mirrorAt(pt, t); if (!a.m) return null; var mkg = a.m;
    if (roll && a.all.length > 1) { var tw = 0; a.all.forEach(function (x) { tw += x.w; }); var rr = D.rand() * tw; for (var ia = 0; ia < a.all.length; ia++) { rr -= a.all[ia].w; if (rr < 0) { mkg = a.all[ia].m; break; } } }
    a = { m: mkg }; var zone = W.makingZone(a.m), mk = W.MADE[zone], Z = tables()[zone]; if (!mk || !Z) return null;
    var gs = Z.groups.filter(function (g) { return !g.cond && g.e.every(function (x) { return mk[x[0]] && D.FOES && D.FOES[mk[x[0]]]; }); });
    return gs.length ? { making: a.m, zone: zone, made: mk, groups: gs } : null;
  };
  W.mirrorRate = function (pt, t) { return 1 + W.VESSEL.rate * W.mirrorWeight(pt, t) / W.VESSEL.peak; }; // (the road's count runs this much faster near the made things)
  // THE DEBUG VIEW (deep16/?world&far&fresh&noenc&vessel, a seat's, never a player's: W.VESSEL.show is set only by that flag, World.enter): his road drawn on THE WORLD, the day's dusk marks, his mark now, each making's reach as a ring;
  // &vessel plays day 2 to day 14 over and over (two seconds a day), &vessel=<day> holds that day's noon
  W.drawVessel = function (g, cam, t) {
    var sv = W.VESSEL.show; if (!sv || !W.groundAt) return; var pts = W.vesselRoad(); if (!pts) return;
    if (sv.play) { S.t = 24 + (Math.floor(t * 12 / 120) % (13 * 12)) * 2; } // (from 00:00 of day 2, two hours a frame-tick of 10)
    var gp = function (x, y) { return W.groundAt(cam, x, y); };
    g.strokeStyle = 'rgba(200,120,255,.55)'; g.lineWidth = 2; g.beginPath(); pts.forEach(function (p, i) { var q = gp(p[0], p[1]); if (!i) g.moveTo(q[0], q[1]); else g.lineTo(q[0], q[1]); }); g.stroke(); g.lineWidth = 1;
    for (var d = W.VESSEL.day0; d <= 13; d++) { var a = W.vesselAt((d - 1) * 24 + W.VESSEL.dusk), q = gp(a.pt[0], a.pt[1]); g.fillStyle = '#c890ff'; g.fillRect(Math.round(q[0]) - 1, Math.round(q[1]) - 1, 3, 3); D.text(g, '' + d, Math.round(q[0]) + 3, Math.round(q[1]) - 9, '#e0c8ff'); }
    W.makings().forEach(function (m) {
      g.strokeStyle = 'rgba(232,80,200,.8)'; g.fillStyle = 'rgba(232,80,200,.12)'; g.beginPath();
      for (var k = 0; k <= 36; k++) { var an = k / 36 * Math.PI * 2, q = gp(m.pt[0] + Math.cos(an) * m.reach, m.pt[1] + Math.sin(an) * m.reach); if (!k) g.moveTo(q[0], q[1]); else g.lineTo(q[0], q[1]); }
      g.fill(); g.stroke(); var c = gp(m.pt[0], m.pt[1]); D.text(g, 'day ' + m.day + ' made', Math.round(c[0]) - 18, Math.round(c[1]) + 4, '#ffb0f0');
    });
    var v = W.vesselAt(), p = gp(v.pt[0], v.pt[1]), x = Math.round(p[0]), y = Math.round(p[1]);
    g.strokeStyle = '#ff60e0'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y + 4); g.moveTo(x + 4, y - 4); g.lineTo(x - 4, y + 4); g.stroke(); g.lineWidth = 1;
    var hr = Math.floor(W.hour()), cap = 'THE VESSEL\'S ROAD -- day ' + W.day() + ', ' + (hr < 10 ? '0' : '') + hr + ':00 -- at ' + v.hex.join(',') + (v.held ? ' (held at the Warded Fort)' : '') + ' -- the made things here: ' + W.mirrorWeight().toFixed(1);
    D.win8(g, 4, D.H - 66, D.textWidth(cap) + 10, 14); D.text(g, cap, 9, D.H - 63, '#ffb0f0');
    W.VESSEL.drawn = { x: x, y: y, day: W.day(), makings: W.makings().length }; // (for the bench's eye)
  };
  function tables() { return ((window.DS || {}).DATA || {}).encounters || {}; }
  W.resetCount = function (zone) { var Z = tables()[zone], rt = (Z && Z.rate) || [22, 40]; S.count = (rt[0] + D.rint(rt[1] - rt[0] + 1)) / W.HEXSTEPS * 5; S.zone = zone; }; // (in miles: a hex 5, a tile half of one)
  // THE NIGHT (RULED 10-21, Griz: "Random encounter tables increase encounter activity at night (selected appropriate monsters)"): after dark the road's count runs
  // W.NIGHTX as fast, and a group with a creature of the night in it weighs twice, one of the day's alone half (the seat's picks from the zones' tables, his to tune)
  W.NIGHTX = 2; W.NIGHT_KINDS = ['wolf', 'worg', 'hyena', 'gnoll', 'giantrat', 'stirge', 'giantspider', 'wolfspider', 'wisp', 'giantbat']; W.DAY_KINDS = ['bandit', 'axebeak', 'giantboar'];
  W.isNight = function () { return W.timeOfDay() === 'night'; };
  W.pick = function (zone, night, pt) {
    var Z = tables()[zone]; if (!Z) return null;
    var nightW = function (g) { if (!night) return g; var ks = g.e.map(function (x) { return x[0]; }), f = ks.some(function (k) { return W.NIGHT_KINDS.indexOf(k) >= 0; }) ? 2 : ks.every(function (k) { return W.DAY_KINDS.indexOf(k) >= 0; }) ? 0.5 : 1; return Object.assign({}, g, { w: (g.w || 1) * f }); }, gs = Z.groups.filter(function (g) { return !g.cond; }).map(nightW), mw = W.mirrorWeight(pt); if (!gs.length) return null; // (pt: a point in miles, else the party's -- THE VESSEL'S ROAD)
    if (mw > 0) gs.push({ w: mw, mirror: true });
    var draw = function (l) { var tt = 0; l.forEach(function (g) { tt += g.w || 1; }); var r = D.rand() * tt; for (var i = 0; i < l.length; i++) { r -= l[i].w || 1; if (r < 0) return l[i]; } return l[0]; }, grp = draw(gs);
    var md = grp.mirror ? W.madeAt(pt, null, true) : null, src = md ? draw(md.groups.map(nightW)) : grp.mirror ? gs[D.rint(gs.length - 1)] : grp, list = []; // (md: THE MAKINGS BY THEIR GROUND, above)
    src.e.forEach(function (e) { var n = e[1] + D.rint(e[2] - e[1] + 1); for (var k = 0; k < n; k++) list.push(grp.mirror ? ((md && md.made[e[0]]) || W.MIRROR[e[0]] || e[0]) : e[0]); });
    return { zone: zone, Z: Z, grp: grp, list: list.slice(0, 8).filter(function (k) { return D.FOES && D.FOES[k]; }), mirror: !!grp.mirror, made: md ? { day: md.making.day, zone: md.zone } : null };
  };
  W.onStep = function (scene, st) {
    if (/[?&]noenc\b/.test(scene.q)) return false;
    var e = M.hex[K(S.at[0], S.at[1])], zone = W.zoneOf(e);
    if (S.zone !== zone || S.count == null) W.resetCount(zone);
    S.count -= (st.mi || M.w) * (st.road ? 0.5 : 1) * (W.isNight() ? W.NIGHTX : 1) * W.mirrorRate(); W.save(); // (after dark the count runs faster: THE NIGHT, above; and near the made things: THE VESSEL'S ROAD)
    if (S.count > 0) return false;
    W.resetCount(zone); W.save();
    var p = W.pick(zone, W.isNight()); if (!p || !p.list.length) return false;
    scene.encounter(p, e); return true;
  };
  function foeName(k, n) { var f = D.FOES && D.FOES[k], nm = (f && f.name) || k; return n > 1 ? nm.replace(/y$/, 'ie').replace(/(s|x|ch|sh)$/, '$1e').replace(/([lr])f$/, '$1ve') + 's' : nm; } // (wolves, not wolfs)
  World.prototype.encounter = function (p, e) {
    var self = this, cnt = {}; p.list.forEach(function (k) { cnt[k] = (cnt[k] || 0) + 1; });
    var who = Object.keys(cnt).map(function (k) { return (cnt[k] > 1 ? cnt[k] + ' ' : 'a ') + foeName(k, cnt[k]).toLowerCase(); }).join(', ');
    D.sfx('encounter');
    // FIGHT the way OPTIONS' RANDOM FIGHTS says (simple, the first game's screen, by default: js/simple.js), or the other way for this fight alone (RULED 10-21, Griz: "yes")
    var simple = !D.simple || D.simple.on(), other = simple ? 'ON THE GRID' : 'SIMPLE';
    this.card([(p.mirror ? '{p}MIRROR-MADE{/} ' : '{r}') + 'On the ' + (M.road[K(e.q, e.r)] ? 'road' : W.groundName(e.t)) + '{/}, ' + W.timeOfDay() + ':', who + (p.mirror ? ', with the Mirror in their eyes' : '') + '.', '', D.keys('{g}E{/}: fight' + (D.simple ? '    {g}R{/}: ' + other.toLowerCase() : ''))], null,
      [['a', function () { self.fight(p, e); }, 'FIGHT']].concat(D.simple ? [['rec', function () { self.fight(p, e, { simple: !simple }); }, other]] : []));
  };
  // the field: 16 x 7 squares of the hex's ground, the lineup's squares kept open (x 3 to 10), the road along the middle where the hex has one
  // (o: the simple fight's own ground -- its size, the open squares its lineup stands on, the road's squares, and the party's squares with room for guests: js/simple.js S.fieldOpts)
  // BY TYPE, READ FINER (RULED 10-21 night, his "By type, read finer", the world map seat's lean on his "Can a random sampling from somewhere in that grid a
  // big zoom be sent to random encounters, or just random generated from that hex type where we consider if different ones need props made": a field is a
  // quarter of one 330 ft hex, and at 99% of the road's spots that hex is the 5-mile hex's own ground, flat, so a sample would hand back the type): the field
  // is made from the hex's ground as before, each ground with its own props from what the grid already draws -- grass, rubble, trees, still water, a field's
  // fence and woodpile, a gulch's rock walls -- and read finer where the map knows more: the hex's second ground in patches by its share (a plains hex with
  // some wood has its trees), a river through the hex as a stream across the field (the road fords it), and the road as the grid's rutted dirt road (it
  // was drawn as dressed stone). New props (reeds, crops, bushes, boulders) wait for his word on the art. One D.rand() a square as before (the seeds hold).
  var FIELD = { // a ground's squares: [the edge's chances, the inside's] as [char, under this roll] in turn, else '.'
    mtn: [[['#', 0.6], ['r', 1]], [['#', 0.12], ['r', 0.3]]], woods: [[['T', 0.55], ['g', 0.7]], [['T', 0.25], ['g', 0.4]]],
    hills: [[['r', 0.3], ['g', 0.45]], [['r', 0.15], ['g', 0.25]]], gulch: [[['#', 0.85], ['r', 1]], [['r', 0.2]]],
    wet: [[['~', 0.4], ['g', 0.55]], [['~', 0.3], ['g', 0.4]]], farms: [[['f', 0.7], ['g', 0.85]], [['k', 0.04], ['g', 0.3]]],
    verge: [[['g', 0.5], ['T', 0.58], ['~', 0.64]], [['g', 0.35], ['T', 0.38]]], plains: [[['r', 0.15], ['g', 0.45]], [['r', 0.06], ['g', 0.2]]],
    town: [[['k', 0.3], ['f', 0.5]], [['k', 0.05]]], water: [[['D', 0.8], ['~', 1]], [['~', 0.6]]], rift: [[['#', 1]], [['r', 0.3], ['#', 0.4]]]
  };
  function fieldKind(t, wet) { return /^(black|gray|coastal)$/.test(t) ? 'mtn' : t === 'woods' ? 'woods' : t === 'hills' || t === 'foothills' ? 'hills' : t === 'gulch' ? 'gulch' : wet || t === 'bog' ? 'wet' : t === 'farms' ? 'farms' : t === 'verge' ? 'verge' : t === 'town' ? 'town' : t === 'lake' || t === 'sea' ? 'water' : t === 'rift' ? 'rift' : 'plains'; }
  W.groundName = function (t) { return M.terr[t].name.replace(/^the /i, '').replace(/ \(.*\)$/, ''); }; // ("on the Verge", not "on the the Verge (grass)")
  W.field = function (e, o) {
    var w = (o && o.w) || 16, h = (o && o.h) || 7, rows = [], road = !!M.road[K(e.q, e.r)], t = e.t, wet = e.wet || t === 'bog';
    var inLane = (o && o.lane) || function (x, y) { return x >= 3 && x <= 10 && y >= 1 && y <= 5; }, onRoad = (o && o.road) || function (x, y) { return y === 3; };
    var k1 = fieldKind(t, wet), k2 = e.t2 && e.sh2 >= 0.1 && e.t2 !== t ? fieldKind(e.t2, false) : null, sh2 = k2 ? Math.min(0.5, e.sh2) : 0, salt = Math.floor(S ? S.t * 7 : 0);
    var river = M.paths.some(function (P) { return P.kind === 'river' && P.hexes && P.hexes.some(function (x) { return x[0] === e.q && x[1] === e.r; }); }), rx = -1;
    if (river) { var cols = []; for (var cx = w - 3; cx > w / 2; cx--) cols.push(cx); cols.push(w - 2, w - 1); for (var ci = 0; ci < cols.length && rx < 0; ci++) { var free = true; for (var cy = 0; cy < h; cy++) if (inLane(cols[ci], cy)) free = false; if (free) rx = cols[ci]; } } // (the stream: a column the lineup leaves free, toward the far side, else the field's edge)
    for (var y = 0; y < h; y++) {
      var row = '';
      for (var x = 0; x < w; x++) {
        var lane = inLane(x, y), r0 = D.rand(), ch = '.', edge = y === 0 || y === h - 1 || (o && !o.grid && (x === 0 || x === w - 1)); // (o.grid: the grid's lineup, W.lineup -- its ends open as ever)
        var kind = k2 && hh(e.q * 64 + (x >> 2), e.r * 64 + (y >> 1), salt) < sh2 ? k2 : k1; // (the second ground in patches, four squares by two)
        if (road && onRoad(x, y)) ch = ',';
        else if (x === rx) ch = r0 < 0.75 ? '~' : 'D';
        else if (edge || !lane) { var P = FIELD[kind][edge ? 0 : 1]; for (var pi = 0; pi < P.length; pi++) if (r0 < P[pi][1]) { ch = P[pi][0]; break; } }
        else ch = wet && r0 < 0.12 ? '~' : '.';
        row += ch;
      }
      rows.push(row);
    }
    var def = D.MAPS['world-field'] = { name: M.terr[t].name.replace(/^the /, 'The ').replace(/^./, function (c) { return c.toUpperCase(); }), sub: 'the road, ' + W.timeOfDay(), step: 10, ground: 'earth', rows: rows,
      entry: (o && o.entry) || [[8, 3], [8, 2], [8, 4], [9, 3], [9, 1], [9, 5], [8, 1], [8, 5]], foes: [], wave: null };
    return def;
  };
  // THE GAP ON THE FIELD (RULED 11-05, Griz, his Glowseep note: "Grid fights on random encounters still start the two sides right next to each other - check encounter distances
  // in SRD and tell me, set these for between 6 and 12 squares away from each other"; on the desk's lean, "3 - default 6-12, list reasoned exceptions"): the grid's lineup with
  // W.GAP squares between the two fronts, rolled each fight (it stood 2: the foes' front at x 6, the four at x 8), the field as wide as it needs -- the foes' front at x 5, the
  // Large two squares behind it (a third at x 1), the four the gap on, the camp's fire two behind them, and the field 8 past their front as it always ran. The roam's walk-ins
  // keep the same 30 to 60 ft (js/roam.js R.GAP); the SRD 5.1 has no table for it (js/roam.js, its head). The simple fight keeps its own lineup (js/simple.js: no distances in it)
  W.GAP = [6, 12];
  W.lineup = function (list, gap) {
    var d = gap != null ? gap : W.GAP[0] + D.rint(W.GAP[1] - W.GAP[0] + 1), fx = Math.max(5, 8 - d), P = fx + d; // (at the old 2: the old squares, the four at x 8)
    // (four Large squares behind the front, none on another: the rescue's four giant bats had three, and the fourth was left out of every grid fight -- 11-05)
    var front = [[fx, 3], [fx, 2], [fx, 4], [fx, 1], [fx, 5]], back = [[fx - 2, 1], [fx - 2, 4], [fx - 4, 2], [fx - 4, 4]], small2 = [[fx - 1, 3], [fx - 1, 1], [fx - 1, 5]], foes = [];
    list.forEach(function (k, i) { var big = D.FOES[k] && D.FOES[k].size >= 2, at = big ? back.shift() : front.shift() || small2.shift(); if (at) foes.push({ id: 'w' + i + '-' + k, kind: k, at: at.slice() }); });
    // (the gap is to the nearest of them: a group of Large ones alone is moved up to the front's column)
    var near = -1; foes.forEach(function (f) { var s = Math.min(3, (D.FOES[f.kind] && D.FOES[f.kind].size) || 1); near = Math.max(near, f.at[0] + s - 1); });
    if (near >= 0 && near < fx) foes.forEach(function (f) { f.at[0] += fx - near; });
    return { gap: d, w: P + 8, h: 7, foes: foes, entry: [[P, 3], [P, 2], [P, 4], [P + 1, 3], [P + 1, 1], [P + 1, 5], [P, 1], [P, 5]], camp: [P + 2, 3],
      lane: function (x, y) { return x >= 1 && x <= P + 2 && y >= 1 && y <= 5; }, grid: true };
  };
  W.seat = function (list, gap) { return W.lineup(list, gap).foes; }; // the foes' line facing the four (W.lineup)
  // THE CAMP'S FIRE (RULED 10-21, Griz: "add a campfire when the party encounters during a camp"): a fight in the night's watches (o.camp, js/house.js H.runNight) has the
  // camp's fire on the field behind the party -- a light as a torch's (bright 20 ft, dim 20 more: the SRD names no campfire), drawn by js/campfire.js CF.fieldFire
  W.CAMP = [10, 3]; // (the grid's road field: behind the party's squares)
  World.prototype.fight = function (p, e, o) { // (o: { data: the party as it walks in, dark, intro, camp, after(res, b) } -- the night's watches, js/house.js; o.simple: this fight's way, else OPTIONS')
    var self = this, camp = !!((o && o.camp) || p.camp), night = W.timeOfDay() === 'night' || !!(o && o.dark), simple = !!D.simple && (o && o.simple != null ? !!o.simple : D.simple.on()); // (THE SIMPLE FIGHT: js/simple.js)
    var LU = simple ? null : W.lineup(p.list); // (the grid's: W.GAP squares between the fronts, 11-05)
    W.field(e, simple ? D.simple.fieldOpts() : LU); D.MAPS['world-field'].gap = LU ? LU.gap : null;
    var fire = camp ? (simple ? D.simple.CAMP : LU.camp).slice() : null;
    var F = { id: 'worldfield', map: 'world-field', level: W.LEVEL, name: camp ? 'The camp' : 'On the road', sub: (p.mirror ? 'mirror-made: ' : '') + p.zone, dark: night, camp: fire, lights: fire ? [[fire[0], fire[1], 20, 'fire']] : null,
      intro: (o && o.intro) || ((p.mirror ? 'Mirror-made: ' : '') + 'They come at the party on the ' + (M.road[K(e.q, e.r)] ? 'road' : W.groundName(e.t)) + '.'), won: camp ? 'THE CAMP HOLDS.' : 'THE ROAD IS CLEAR.', lost: 'THE ROAD TAKES THEM.',
      foes: simple ? D.simple.seat(p.list) : LU.foes, wave: null, fliers: !simple }; // (fliers: the SRD's fly on the grid, not in the simple fight's lineup -- js/flight-ai.js FA.on, 10-21 night)
    // (the fight's play record closes with its result where the fight ends -- 11-03, the desk's read of his records: the road and camp fights read 'restarted' though won, since this onDone
    // has a door of its own and js/record.js P.finish leaves such a fight's record to it; the menu's BACK TO THE ROAD calls onDone(null): 'left'. As js/roam.js and js/hex.js close theirs)
    var recEnd = function (res) { if (b && b.rec && D.rec && D.rec.finish) { try { D.rec.finish(b, res || 'left'); } catch (eR) { /* (the record must never stop the way back) */ } } };
    var b = new D.Battle(W.house() ? { fightDef: F, simple: simple, data: (o && o.data) || D.house.living(D.house.cur), house: true, world: true, record: { fight: 'worldfield', name: F.name, level: (D.house.cur.party[0] || {}).lvl, simple: simple }, payNow: function (bb, res) { var pf = D.house.payFight(bb, res); bb.housePay = pf; return pf.lines; }, onDone: function (res) { recEnd(res); if (o && o.after) o.after(res, b); else self.afterFight(res, p, b); } } // (the house's party, wounds and all, and its play record: js/house.js)
      : { fightDef: F, simple: simple, ladder: true, level: W.LEVEL, world: true, onDone: function (res) { recEnd(res); self.afterFight(res, p); } }), e0 = b.enter;
    b.enter = function () {
      e0.apply(this, arguments);
      // the two lines face each other (his "they seem to be facing NE with NW foes"): the four toward the foes (-x), the foes toward the four (+x) -- in the simple fight
      // across the screen, the four to its left and the foes to its right (js/simple.js S.FACE)
      this.units.forEach(function (u) { var f = simple ? D.simple.FACE[u.side === 'party' ? 0 : 1] : [u.side === 'party' ? -1 : 1, 0]; u.facing = D.spr.facingFor(f[0], f[1]); });
      if (p.mirror) this.units.forEach(function (u) { if (u.side === 'foe' && !/^mirror/.test(u.kind)) { u.mirrorEye = true; u.name = 'Mirror-made ' + u.name.toLowerCase(); } }); if (p.mirror && D.house && D.house.cur && D.house.cur.flags) D.house.cur.flags.mirrorFought = 1; // (the supper asks: js/inn.js In.SUP.fought, 11-11)
    };
    D.push(b);
  };
  World.prototype.afterFight = function (res, p, b) {
    try { D.music('corridor'); } catch (e) { }
    if (W.house() && b) { var ln = D.house.afterFight(b, res); if (ln === null) return; S.t += W.FIGHT_HOURS; W.save(); ln = ln.concat(D.house.lightsOut(null)); this.say((res === 'won' ? 'The road is clear. ' : 'The party got clear of them. ') + ln.join(' ')); return; } // (a loss: the title, js/house.js H.lost)
    S.t += W.FIGHT_HOURS; W.save(); // (a fight and its breath: W.FIGHT_HOURS)
    if (res === 'won') this.say('The road is clear. On, ' + W.timeOfDay() + '.');
    else if (res === 'escaped' || res == null) this.say('The party got clear of them.');
    else { W.passDays(1, 'Beaten, the party drags itself back to the road. A day is lost.'); }
  };

  W.make = function (q) { return new World(q); };
  W.World = World;
  W.M = function () { return M; }; W.Mworld = function () { return MS.world || M; }; W.hexOf = function (x, y) { return at(x, y); }; W.hc = function (q, r) { return hc(q, r); }; W.K = K; W.SKY = SKY; W.icon = icon; W.RANK = RANK; W.BIG = BIG; // (for the top-down view, js/overworld.js)
  W.proj = proj; W.tone = tone; W.HCO = HCO; W.TILT = TILT; W.lookImg = function () { return LOOK; }; // (for THE FINE LAND, js/worldfine.js)
  W.groundAt = function (cam, x, y) { return groundAt(cam, x, y); }; W.visAt = function (p, y) { return !VIS || VIS(p, y); }; // (a point on the land as this draw sees it: the wagon's mark, js/wagon.js)
  // OPTIONS' ZOOM ON APPROACH (above), on by default: a row on the one OPTIONS page beside RANDOM FIGHTS (js/simple.js), the second game's only
  var MN = window.DS && window.DS.MENU;
  if (MN && MN.gridRows) { var rows0 = MN.gridRows; MN.gridRows = function () { var r = rows0.apply(this, arguments); r.push({ label: 'ZOOM ON APPROACH', key: 'approachzoom', get: function () { return W.approachOn() ? 'ON' : 'OFF'; }, step: function () { W.setApproach(!W.approachOn()); } }); return r; }; }
})();
