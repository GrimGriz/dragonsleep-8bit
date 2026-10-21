/* DEEP16 — THE WORLD (10-20, the world map seat; the maps lane §2f). The second game's world map: his realm hex map's 5-mile hexes, baked from his EXPORT by
   tools/world-build.py into data/world.js (D16.WORLD), walked as one party token. deep16/?world (&fresh starts over, &at=q,r puts the party on a hex, &dev
   shows the day's number). His rulings (10-20, verbatim in the lane): "1 - yes, but leave room/alternate path for doing days by fiat/mission completion -
   unhooked from travel" -- the walk spends the SRD's hours, and W.passDays moves the calendar without a step; "when they reach the location it goes to the
   roam map"; "3 - yes, effectively icons on the world map that include angle of approach when putting you on the grid roam" -- a town is an icon, and the
   side the party comes from picks the gate it walks in at; "6 - like a decorated iso-preview? yes" -- the hex map's world look, at DEEP16's own 480 x 270.

   THE GOING (RULED 10-20, "SRD for world map"): the SRD's normal pace, 3 mi an hour, 24 a day of 8 hours; a hex of difficult ground (the terrain's `diff`)
   twice the hours; along a road or track the road's own going (a difficult road twice, the Coldridge Route); water and the Rift no one walks. Past 8 hours
   the party makes camp, and the next step starts at the next morning (a forced march is not built). The clock is hours from the first morning; its day is
   never shown as a number (the clock lane's rule) but in the sky -- &dev shows it. */
'use strict';
(function () {
  var D = window.D16 = window.D16 || {}, I = D.input;
  var W = D.world = {};
  var SQ3 = Math.sqrt(3), TILT = 0.62, STEPF = 14; // (frames a hex takes to walk)
  W.PACE = 3; W.DAYHOURS = 8; W.MORNING = 7; // (the SRD: 3 mi an hour, 8 hours a day; the day starts at seven)
  W.ZOOMS = [3.2, 4.4, 6, 8.5, 12]; // (px a mile: a 5-mile hex 16 to 60 px across)
  // the places with a door (his "when they reach the location it goes to the roam map"): only what is built; the rest say so
  W.DOORS = { silverton: { roam: 'silverton', gates: { west: [-1, 0], south: [0, 1], east: [1, 0] } } };
  W.KEY = 'deep16.world';

  // ---------------------------------------------------------------- the baked world, indexed (the hex map's axial pointy-top hexes; a step is a neighbour)
  var M = null;
  function K(q, r) { return q + ',' + r; }
  function hc(q, r) { var w = M.w; return [w * (q + r / 2), w * SQ3 / 2 * r]; }
  function round(qf, rf) {
    var x = qf, z = rf, y = -x - z, rx = Math.round(x), ry = Math.round(y), rz = Math.round(z), dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
    return [rx + 0, rz + 0];
  }
  function at(x, y) { var w = M.w, r = y / (w * SQ3 / 2); return round(x / w - r / 2, r); }
  var DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  function rgb(c) { var m = /^#?([0-9a-f]{6})$/i.exec(c || ''); if (!m) return [200, 0, 200]; var n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  W.index = function () {
    var B = D.WORLD; if (!B) return null;
    var m = M = { w: B.hexMi, hex: {}, terr: B.terr, sites: B.sites, paths: B.paths, link: {}, road: {}, siteAt: {}, col: {} };
    Object.keys(B.terr).forEach(function (k) { m.col[k] = rgb(B.terr[k].color); });
    B.hexes.forEach(function (h) { m.hex[K(h[0], h[1])] = { q: h[0], r: h[1], t: h[2], h: h[3], wet: !!h[4], t2: h[5], sh2: h[6], guess: !!h[7] }; }); // (guess: not painted, corridor v3's guess)
    B.paths.forEach(function (P) {
      if (P.kind === 'river') return;
      for (var i = 0; i < P.hexes.length; i++) {
        var a = K(P.hexes[i][0], P.hexes[i][1]); m.road[a] = m.road[a] || P;
        if (i + 1 < P.hexes.length) { var b = K(P.hexes[i + 1][0], P.hexes[i + 1][1]); m.link[a + '|' + b] = m.link[b + '|' + a] = P; }
      }
    });
    B.sites.forEach(function (s) { var k = K(s.hex[0], s.hex[1]); (m.siteAt[k] = m.siteAt[k] || []).push(s); });
    // each hex lit once (light from the north-west, high: 1 on the flat), as the hex map's world look lights it
    Object.keys(m.hex).forEach(function (k) {
      var e = m.hex[k], H = function (dq, dr) { var n = m.hex[K(e.q + dq, e.r + dr)]; return n ? n.h : e.h; };
      var gx = (H(1, 0) - H(-1, 0)) / (2 * m.w), gy = (H(0, 1) + H(-1, 1) - H(1, -1) - H(0, -1)) / (2 * m.w * SQ3), kk = 6 / 5280;
      var nl = Math.sqrt(gx * gx * kk * kk + gy * gy * kk * kk + 1), d = (0.503 * gx * kk + 0.503 * gy * kk + 0.704) / nl / 0.704;
      e.lit = Math.round(Math.max(0.45, Math.min(1.4, d)) * 16) / 16;
    });
    return m;
  };
  W.hexAt = function (q, r) { return M && M.hex[K(q, r)] || null; };
  W.walkable = function (e) { var T = e && M.terr[e.t]; return !!(T && +T.cost) || !!(e && M.siteAt[K(e.q, e.r)]); }; // (water and the Rift: no one walks them -- Book III's cost 0 -- but a hex with a place in it has its shore: the inn on its lake)
  // the hours a step from hex a to its neighbour b takes: the road's going between two hexes of one road, else the ground's
  W.stepHours = function (a, b) {
    var eb = M.hex[K(b[0], b[1])]; if (!W.walkable(eb)) return null;
    var road = M.link[K(a[0], a[1]) + '|' + K(b[0], b[1])], going = road ? (road.difficult ? 2 : 1) : (+M.terr[eb.t].cost && M.terr[eb.t].diff ? 2 : 1);
    return { h: M.w * going / W.PACE, road: road || null, going: going };
  };
  // the quickest way there (Dijkstra over the painted hexes; the world is a few thousand)
  W.route = function (from, to) {
    var start = K(from[0], from[1]), goal = K(to[0], to[1]); if (start === goal || !M.hex[goal] || !W.walkable(M.hex[goal])) return null;
    var dist = {}, prev = {}, open = [[0, from[0], from[1]]], done = {}; dist[start] = 0;
    while (open.length) {
      var bi = 0; for (var i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
      var cur = open.splice(bi, 1)[0], ck = K(cur[1], cur[2]); if (done[ck]) continue; done[ck] = 1; if (ck === goal) break;
      for (var d = 0; d < 6; d++) {
        var n = [cur[1] + DIRS[d][0], cur[2] + DIRS[d][1]], nk = K(n[0], n[1]), st = W.stepHours([cur[1], cur[2]], n); if (!st || done[nk]) continue;
        var nd = cur[0] + st.h; if (dist[nk] == null || nd < dist[nk]) { dist[nk] = nd; prev[nk] = [cur[1], cur[2]]; open.push([nd, n[0], n[1]]); }
      }
    }
    if (dist[goal] == null) return null;
    var path = [], k = goal, p = to; while (k !== start) { path.unshift(p); p = prev[k]; k = K(p[0], p[1]); }
    return { hexes: path, hours: dist[goal] };
  };

  // ---------------------------------------------------------------- the clock: hours from midnight before the first morning; the walk spends them, and the
  // other path moves the days alone (his "days by fiat/mission completion - unhooked from travel")
  var S = null;
  function fresh() { var s = W.startHex(); return { at: s, from: null, t: W.MORNING, today: 0, seed: (Date.now() >>> 0) }; }
  W.startHex = function () { var sv = M.sites.filter(function (s) { return s.id === 'silverton'; })[0]; return sv ? sv.hex.slice() : [M.hex[Object.keys(M.hex)[0]].q, M.hex[Object.keys(M.hex)[0]].r]; };
  W.load = function (q) {
    S = null;
    if (!/[?&]fresh\b/.test(q || '')) try { S = JSON.parse(localStorage.getItem(W.KEY) || 'null'); } catch (e) { S = null; }
    if (!S || !S.at || !M.hex[K(S.at[0], S.at[1])]) S = fresh();
    var aq = /[?&]at=(-?\d+),(-?\d+)/.exec(q || ''); if (aq && M.hex[K(+aq[1], +aq[2])]) { S.at = [+aq[1], +aq[2]]; S.from = null; }
    return S;
  };
  W.save = function () { try { localStorage.setItem(W.KEY, JSON.stringify(S)); } catch (e) { /* (the walk goes on unkept) */ } };
  W.state = function () { return S; };
  W.day = function () { return Math.floor(S.t / 24) + 1; };
  W.hour = function () { return S.t % 24; };
  W.timeOfDay = function () { var h = W.hour(); return h < 5 ? 'night' : h < 7 ? 'dawn' : h < 11 ? 'morning' : h < 14 ? 'midday' : h < 17 ? 'afternoon' : h < 20 ? 'dusk' : 'night'; };
  W.passDays = function (n, why) { S.t = (Math.floor(S.t / 24) + (n | 0)) * 24 + W.MORNING; S.today = 0; W.save(); if (W.scene) W.scene.say(why || (n === 1 ? 'A day passes.' : n + ' days pass.')); }; // (the other path: a mission's end, a ruling's fiat)
  W.camp = function () { var d = Math.floor(S.t / 24) + (W.hour() >= W.MORNING ? 1 : 0); S.t = d * 24 + W.MORNING; S.today = 0; W.save(); };

  // ---------------------------------------------------------------- the scene
  function World(q) { this.kind = 'world'; this.opaque = true; this.q = q || ''; this.cam = null; this.zi = 2; this.hov = null; this.plan = null; this.walk = null; this.cards = []; this.msg = null; this.t = 0; }
  World.prototype.enter = function () {
    if (!W.index()) throw new Error('no world: data/world.js is not loaded (python tools/world-build.py)');
    W.load(this.q); W.scene = this; W.active = true; this.dev = /[?&]dev\b/.test(this.q);
    var c = hc(S.at[0], S.at[1]); this.cam = { cx: c[0], cy: c[1] };
    try { D.music('corridor'); } catch (e) { }
    this.say('The road, ' + W.timeOfDay() + '. Click a hex to travel there.');
  };
  World.prototype.exit = function () { W.active = false; };
  World.prototype.say = function (s) { this.msg = { s: s, t: 0 }; };
  World.prototype.card = function (lines, then, keys) { this.cards.push({ lines: lines, then: then || null, keys: keys || null }); };
  World.prototype.camObj = function () { var z = W.ZOOMS[this.zi]; return { cx: this.cam.cx, cy: this.cam.cy, z: z, W: D.W, H: D.H, E: 6 * Math.min(1, Math.pow(8 / z, 0.35)) }; };
  function proj(cam, x, y, h) { return [(x - cam.cx) * cam.z + cam.W / 2, (y - cam.cy) * cam.z * TILT + cam.H / 2 - h / 5280 * cam.z * cam.E]; }
  function hexTopH(q, r) { var e = M.hex[K(q, r)]; return e ? e.h : 0; }
  World.prototype.pick = function (mx, my) {
    var cam = this.camObj(), x = (mx - cam.W / 2) / cam.z + cam.cx, y = cam.cy, h = 0;
    for (var i = 0; i < 6; i++) { y = (my - cam.H / 2 + h / 5280 * cam.z * cam.E) / (cam.z * TILT) + cam.cy; var a = at(x, y); h = hexTopH(a[0], a[1]); }
    return at(x, y);
  };
  World.prototype.update = function () {
    this.t++; if (this.msg) this.msg.t++;
    var m = I.mouse;
    if (this.cards.length) { // (a card waits for its key)
      var cd = this.cards[0];
      if (cd.keys) { for (var ki = 0; ki < cd.keys.length; ki++) if (I.pressed(cd.keys[ki][0])) { this.cards.shift(); D.sfx('confirm'); cd.keys[ki][1](); return; } return; }
      if (I.pressed('a') || I.pressed('b') || m.click) { this.cards.shift(); D.sfx('confirm'); if (cd.then) cd.then(); }
      return;
    }
    // the camera: the wheel and -/= zoom, the middle button or the arrows pan, C comes back to the party
    if (m.wheel) this.zi = Math.max(0, Math.min(W.ZOOMS.length - 1, this.zi - m.wheel));
    if (I.pressed('zoomin')) this.zi = Math.min(W.ZOOMS.length - 1, this.zi + 1);
    if (I.pressed('zoomout')) this.zi = Math.max(0, this.zi - 1);
    var z = W.ZOOMS[this.zi], pan = 6 / z;
    if (I.held.left) this.cam.cx -= pan; if (I.held.right) this.cam.cx += pan; if (I.held.up) this.cam.cy -= pan / TILT; if (I.held.down) this.cam.cy += pan / TILT;
    if (m.panX || m.panY) { this.cam.cx -= (m.panX || 0) / z; this.cam.cy -= (m.panY || 0) / (z * TILT); m.panX = m.panY = 0; }
    if (I.pressed('center')) { var c0 = hc(S.at[0], S.at[1]); this.cam.cx = c0[0]; this.cam.cy = c0[1]; }
    if (this.walk) { this.stepWalk(); return; }
    // where the mouse points: the hex, and the way there
    var hv = m.inside ? this.pick(m.x, m.y) : null, hk = hv ? K(hv[0], hv[1]) : null;
    if (hk !== (this.hov ? K(this.hov[0], this.hov[1]) : null)) { this.hov = hv; this.plan = hv ? W.route(S.at, hv) : null; }
    if (m.click && m.inside && this.plan) { this.walk = { path: this.plan.hexes.slice(), f: 0 }; this.plan = null; D.sfx('confirm'); return; }
    if (I.pressed('a')) { var here = this.doorHere(); if (here) this.offerDoor(here); else this.lookHere(); }
    if (I.pressed('end')) { W.camp(); D.sfx('confirm'); this.say('The party makes camp, and walks on at first light: ' + W.timeOfDay() + '.'); }
  };
  // a step a time: the hours spent at its end (past the day's 8, a camp first), the place there, and (pass B) the road's chance of a fight
  World.prototype.stepWalk = function () {
    var w = this.walk, next = w.path[0], st = W.stepHours(S.at, next);
    if (!st) { this.walk = null; return; }
    if (w.f === 0 && S.today > 0 && S.today + st.h > W.DAYHOURS + 0.01) { W.camp(); this.say('The party makes camp; on at first light.'); }
    w.f++;
    var a = hc(S.at[0], S.at[1]), b = hc(next[0], next[1]), u = w.f / STEPF; this.cam.cx += ((a[0] + (b[0] - a[0]) * u) - this.cam.cx) * 0.2; this.cam.cy += ((a[1] + (b[1] - a[1]) * u) - this.cam.cy) * 0.2;
    if (w.f < STEPF) return;
    w.f = 0; S.from = S.at; S.at = next; S.t += st.h; S.today += st.h; w.path.shift(); W.save();
    if (W.onStep && W.onStep(this, st)) { this.walk = null; return; } // (pass B: a fight on the way stops the walk)
    var door = this.doorHere(), sites = M.siteAt[K(S.at[0], S.at[1])];
    if (door) { this.walk = null; this.offerDoor(door); return; }
    if (sites && sites.length) this.say(sites.map(function (s) { return s.name; }).join(', ') + '.');
    if (!w.path.length) { this.walk = null; this.lookHere(true); }
  };
  World.prototype.doorHere = function () { var ss = M.siteAt[K(S.at[0], S.at[1])] || []; for (var i = 0; i < ss.length; i++) if (W.DOORS[ss[i].id]) return ss[i]; return null; };
  World.prototype.lookHere = function (arrived) {
    var e = M.hex[K(S.at[0], S.at[1])], T = M.terr[e.t], ss = M.siteAt[K(S.at[0], S.at[1])] || [];
    var sn = ss.filter(function (s) { return !W.DOORS[s.id]; }).map(function (s) { return s.name; });
    this.say((arrived ? 'Arrived: ' : '') + (sn.length ? sn.join(', ') + ' -- ' : '') + T.name + ', ' + Math.round(e.h).toLocaleString() + ' ft. ' + W.timeOfDay() + '.' + (sn.length ? ' (its map is not built yet)' : ''));
  };
  // the gate by the side the party comes from (his "angle of approach"): the gate whose way out faces back along the last step
  W.gateFor = function (site, from) {
    var dr = W.DOORS[site.id], gates = Object.keys(dr.gates); if (!from) return gates[0];
    var a = hc(from[0], from[1]), b = [site.x, site.y], v = [a[0] - b[0], a[1] - b[1]], best = gates[0], bd = -1e9;
    gates.forEach(function (g) { var n = dr.gates[g], d = n[0] * v[0] + n[1] * v[1]; if (d > bd) { bd = d; best = g; } });
    return best;
  };
  World.prototype.offerDoor = function (site) {
    var self = this, gate = W.gateFor(site, S.from);
    this.card(['{y}' + site.name + '{/}', 'The ' + gate + ' gate is before you, ' + W.timeOfDay() + '.', '', D.keys('{g}E{/}: go in by the ' + gate + ' gate    {g}X{/}: stay on the road')], null,
      [['a', function () { self.enterDoor(site, gate); }], ['b', function () { self.say('The party keeps to the road.'); }]]);
  };
  World.prototype.enterDoor = function (site, gate) {
    var dr = W.DOORS[site.id]; if (!dr || !D.roam) return;
    W.inDoor = { site: site, gate: gate };
    D.push(D.roam.make('?roam=' + dr.roam + '&gate=' + gate));
  };
  // back from a town: its roads off the floor's edge (js/town.js T.wayOut, the hook the Silverton roam seat left for this) put the party on the town's hex
  W.leaveTown = function (side) {
    while (D.scenes.length && D.top() !== W.scene) D.pop();
    if (!W.scene) return;
    W.inDoor = null; W.save(); try { D.music('corridor'); } catch (e) { }
    W.scene.say('Out on the road by the ' + side + ', ' + W.timeOfDay() + '.');
  };
  if (D.town && D.town.wayOut) {
    var wayOut0 = D.town.wayOut;
    D.town.wayOut = function* (B, sq) {
      if (!W.active || !W.inDoor) { yield* wayOut0(B, sq); return; }
      var def = D.roam.def || {}, nm = (def.wayName || {})[sq[0] + ',' + sq[1]] || 'the road', side = sq[0] <= 1 ? 'west' : sq[1] >= (def.h || 0) - 2 ? 'south' : sq[0] >= (def.w || 0) - 2 ? 'east' : 'north';
      B.card(['{y}' + nm.charAt(0).toUpperCase() + nm.slice(1) + '{/}.', '{g}The world map takes the party on.{/}'], 90); D.sfx('popup'); yield 50;
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
  W.drawWorld = function (g, cam, hi) {
    var w = M.w, hh = w * SQ3 / 2, lmax = 14000 / 5280 * cam.z * cam.E, outline = w * cam.z >= 22;
    var y0 = cam.cy - (cam.H / 2) / (cam.z * TILT) - w, y1 = cam.cy + (cam.H / 2 + lmax) / (cam.z * TILT) + w, x0 = cam.cx - cam.W / 2 / cam.z - w, x1 = cam.cx + cam.W / 2 / cam.z + w;
    var poly = function (P) { g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1]); g.closePath(); };
    var wetT = Math.sin(D.frame / 40);
    for (var r = Math.floor(y0 / hh); r <= Math.ceil(y1 / hh); r++) for (var q = Math.floor(x0 / w - r / 2); q <= Math.ceil(x1 / w - r / 2); q++) {
      var e = M.hex[K(q, r)]; if (!e) continue;
      var c = hc(q, r), h = e.h, water = e.t === 'sea' || e.t === 'lake';
      var P = HCO.map(function (o) { return proj(cam, c[0] + o[0] * w, c[1] + o[1] * w, h); });
      if (!water) [[0, 1, q, r + 1, 0.62], [1, 2, q - 1, r + 1, 0.82]].forEach(function (f) {
        var n = M.hex[K(f[2], f[3])], hn = n ? n.h : Math.min(0, h) - 400; if (hn >= h - 1) return;
        var A = HCO[f[0]], B2 = HCO[f[1]];
        g.fillStyle = tone(e, f[4], true); poly([P[f[0]], P[f[1]], proj(cam, c[0] + B2[0] * w, c[1] + B2[1] * w, hn), proj(cam, c[0] + A[0] * w, c[1] + A[1] * w, hn)]); g.fill();
      });
      g.fillStyle = water ? tone(e, 1 + 0.04 * wetT * ((q + r) & 1 ? 1 : -1)) : tone(e, e.lit); poly(P); g.fill();
      if (outline) { g.strokeStyle = 'rgba(20,12,6,.3)'; g.lineWidth = 0.6; g.stroke(); }
      if (hi && hi[K(q, r)]) { g.strokeStyle = hi[K(q, r)]; g.lineWidth = 1.5; g.stroke(); }
      if (W.decorate) W.decorate(g, cam, e, c, P); // (pass C: the trees, the peaks, the reeds)
    }
  };
  function groundAt(cam, x, y) { var a = at(x, y); return proj(cam, x, y, hexTopH(a[0], a[1])); }
  W.drawWays = function (g, cam) {
    M.paths.forEach(function (P) {
      var river = P.kind === 'river', step = M.w * 0.25; g.beginPath();
      for (var i = 0; i + 1 < P.pts.length; i++) {
        var A = P.pts[i], B2 = P.pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(B2[0] - A[0], B2[1] - A[1]) / step));
        for (var j = 0; j <= n; j++) { var s = groundAt(cam, A[0] + (B2[0] - A[0]) * j / n, A[1] + (B2[1] - A[1]) * j / n); if (!i && !j) g.moveTo(s[0], s[1]); else g.lineTo(s[0], s[1]); }
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
    if (kind === 'seat') { g.fillStyle = '#b5452a'; g.moveTo(x, y - 6); g.lineTo(x + 4, y + 1); g.lineTo(x - 4, y + 1); g.closePath(); g.fill(); g.stroke(); return; }
    if (kind === 'junction') { g.moveTo(x, y - 3); g.lineTo(x + 3, y); g.lineTo(x, y + 3); g.lineTo(x - 3, y); g.closePath(); g.fill(); g.stroke(); return; }
    g.strokeStyle = '#efe0b8'; g.moveTo(x - 2.5, y - 2.5); g.lineTo(x + 2.5, y + 2.5); g.moveTo(x + 2.5, y - 2.5); g.lineTo(x - 2.5, y + 2.5); g.stroke(); // (a mark)
  }
  var RANK = { city: 0, castle: 1, town: 2, inn: 2, seat: 3, school: 3, cave: 4, hamlet: 4, junction: 5, mark: 5 };
  W.drawPlaces = function (g, cam, names) {
    var boxes = [], order = M.sites.slice().sort(function (a, b) { return (RANK[a.kind] || 5) - (RANK[b.kind] || 5); });
    order.forEach(function (s) { var p = groundAt(cam, s.x, s.y); if (p[0] < -40 || p[0] > cam.W + 40 || p[1] < -20 || p[1] > cam.H + 20) return; icon(g, s.kind, Math.round(p[0]), Math.round(p[1])); });
    if (!names) return;
    order.forEach(function (s) { // (the names, the greater first; one that would overlap a name already written waits for a closer zoom)
      if (!BIG[s.kind] && cam.z < 8) return;
      var p = groundAt(cam, s.x, s.y), nm = s.name.replace(/ \(.*\)$/, ''), x = Math.round(p[0]) + 6, y = Math.round(p[1]) - 4, w = D.textWidth(nm), bx = [x - 1, y - 1, x + w + 1, y + 9];
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
    var main = e.wet ? 'wet' : e.t, nMain = { woods: 4, black: 1, gray: 1, coastal: 1, hills: 2, foothills: 1, bog: 3, wet: 3, farms: 1, town: 2, verge: 2, plains: 1, sea: 2, lake: 2 }[main] || 0;
    draw1(main, nMain * (e.t2 ? 1 - (e.sh2 || 0) : 1));
    if (e.t2 && e.sh2 >= 0.2) draw1(e.t2, ({ woods: 4, hills: 2, farms: 1, bog: 3, black: 1, gray: 1 }[e.t2] || 0) * e.sh2 * 1.5);
  };
  var SKY = { night: 'rgba(16,24,72,.45)', dawn: 'rgba(255,160,110,.14)', morning: null, midday: null, afternoon: 'rgba(255,220,150,.06)', dusk: 'rgba(255,110,50,.2)' };
  World.prototype.draw = function (ctx) {
    var cam = this.camObj(), hi = {};
    ctx.fillStyle = '#1b2433'; ctx.fillRect(0, 0, D.W, D.H);
    if (this.plan) this.plan.hexes.forEach(function (p) { hi[K(p[0], p[1])] = 'rgba(255,214,60,.55)'; });
    if (this.hov) hi[K(this.hov[0], this.hov[1])] = this.plan ? '#ffd23c' : 'rgba(255,90,80,.8)';
    W.drawWorld(ctx, cam, hi); W.drawWays(ctx, cam); W.drawPlaces(ctx, cam, true);
    // the party: a banner on the hex's top, bobbing as it walks
    var pa = hc(S.at[0], S.at[1]), ph = hexTopH(S.at[0], S.at[1]);
    if (this.walk && this.walk.path.length) { var nx = this.walk.path[0], pb = hc(nx[0], nx[1]), u = this.walk.f / STEPF; pa = [pa[0] + (pb[0] - pa[0]) * u, pa[1] + (pb[1] - pa[1]) * u]; ph = ph + (hexTopH(nx[0], nx[1]) - ph) * u; }
    var tp = proj(cam, pa[0], pa[1], ph), bob = this.walk ? Math.round(Math.abs(Math.sin(this.t / 4)) * 2) : 0, tx = Math.round(tp[0]), ty = Math.round(tp[1]) - bob;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(tx, Math.round(tp[1]), 5, 2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a2410'; ctx.fillRect(tx - 1, ty - 15, 2, 15);
    ctx.fillStyle = '#d8402c'; ctx.beginPath(); ctx.moveTo(tx + 1, ty - 15); ctx.lineTo(tx + 10, ty - 12); ctx.lineTo(tx + 1, ty - 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f8d878'; ctx.fillRect(tx + 2, ty - 13, 2, 2);
    var sky = SKY[W.timeOfDay()]; if (sky) { ctx.fillStyle = sky; ctx.fillRect(0, 0, D.W, D.H); }
    this.hud(ctx);
  };
  World.prototype.hud = function (ctx) {
    var e = M.hex[K(S.at[0], S.at[1])], T = M.terr[e.t], tod = W.timeOfDay();
    D.win8(ctx, 4, 4, 196, 30);
    D.text(ctx, '{y}' + tod.charAt(0).toUpperCase() + tod.slice(1) + '{/}' + (this.dev ? '  {g}(day ' + W.day() + ', ' + W.hour().toFixed(1) + 'h, ' + S.today.toFixed(1) + 'h walked){/}' : ''), 10, 9, D.WIN8.text);
    D.text(ctx, T.name + (M.road[K(S.at[0], S.at[1])] ? ', on ' + M.road[K(S.at[0], S.at[1])].name.replace(/ \(.*\)$/, '') : '') + ' · ' + Math.round(e.h).toLocaleString() + ' ft', 10, 20, '#c8c4b8');
    if (this.hov && !this.walk) {
      var he = M.hex[K(this.hov[0], this.hov[1])], lines = [];
      if (he) {
        var ss = (M.siteAt[K(this.hov[0], this.hov[1])] || []).map(function (s) { return s.name; });
        lines.push((ss.length ? ss.join(', ') + ' · ' : '') + M.terr[he.t].name + (he.guess ? ' {g}(v3’s guess){/}' : '') + ' · ' + Math.round(he.h).toLocaleString() + ' ft');
        if (this.plan) { var hrs = this.plan.hours, d = Math.floor((S.today + hrs) / W.DAYHOURS - 1e-6); lines.push(this.plan.hexes.length + ' hex' + (this.plan.hexes.length > 1 ? 'es' : '') + ' · ' + (hrs < 10 ? hrs.toFixed(1) + ' hours' : (hrs / W.DAYHOURS).toFixed(1) + ' days of walking') + (d > 0 ? ' · ' + d + ' camp' + (d > 1 ? 's' : '') : '')); }
        else if (!W.walkable(he)) lines.push('{r}no one walks it{/}');
        else if (K(this.hov[0], this.hov[1]) !== K(S.at[0], S.at[1])) lines.push('{r}no way there{/}');
      } else lines.push('{g}off the map{/}');
      var bw = 8 + Math.max.apply(null, lines.map(function (l) { return D.textWidth(l); })), bx = Math.min(D.W - bw - 4, I.mouse.x + 10), by = Math.min(D.H - 14 - lines.length * 10, I.mouse.y + 10);
      ctx.fillStyle = 'rgba(8,8,20,.85)'; ctx.fillRect(bx, by, bw, 6 + lines.length * 10);
      lines.forEach(function (l, i) { D.text(ctx, l, bx + 4, by + 4 + i * 10, '#e8e4d8'); });
    }
    if (this.msg && this.msg.t < 360) { var mw = Math.min(D.W - 16, D.textWidth(this.msg.s) + 12); ctx.fillStyle = 'rgba(8,8,20,.8)'; ctx.fillRect((D.W - mw) / 2, D.H - 30, mw, 13); D.text(ctx, this.msg.s, D.W / 2, D.H - 27, '#f6e9c5', 'center'); }
    D.hint(ctx, 'click: travel  E: here  SPACE: camp  C: the party  wheel: zoom', D.W / 2, D.H - 12, '#9a96a8', 'center');
    if (this.cards.length) {
      var cd = this.cards[0], cw = 300, ch = 14 + cd.lines.length * 10, cx = (D.W - cw) / 2, cy = (D.H - ch) / 2;
      D.win8(ctx, cx, cy, cw, ch); cd.lines.forEach(function (l, i) { D.text(ctx, l, D.W / 2, cy + 8 + i * 10, D.WIN8.text, 'center'); });
    }
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
  W.zoneOf = function (e) {
    var inn = M.sites.filter(function (s) { return s.id === 'inn'; })[0];
    if (/^(black|gray|coastal)$/.test(e.t)) return 'doors';
    if (e.wet || e.t === 'bog') return 'glowseep';
    if (e.t === 'gulch') return 'gulch';
    if (e.t === 'hills' || e.t === 'foothills') return 'gnollhills';
    if (e.t === 'verge') return 'verge';
    return inn && hc(e.q, e.r)[1] > inn.y + 2 ? 'south' : 'north';
  };
  W.mirrorWeight = function () { return Math.max(0, Math.min(6, (W.day() - 1) * 0.5)); };
  function tables() { return ((window.DS || {}).DATA || {}).encounters || {}; }
  W.resetCount = function (zone) { var Z = tables()[zone], rt = (Z && Z.rate) || [22, 40]; S.count = (rt[0] + D.rint(rt[1] - rt[0] + 1)) / W.HEXSTEPS; S.zone = zone; };
  W.pick = function (zone) {
    var Z = tables()[zone]; if (!Z) return null;
    var gs = Z.groups.filter(function (g) { return !g.cond; }).slice(), mw = W.mirrorWeight(); if (!gs.length) return null;
    if (mw > 0) gs.push({ w: mw, mirror: true });
    var tot = 0; gs.forEach(function (g) { tot += g.w || 1; });
    var r = D.rand() * tot, grp = gs[0]; for (var i = 0; i < gs.length; i++) { r -= gs[i].w || 1; if (r < 0) { grp = gs[i]; break; } }
    var src = grp.mirror ? gs[D.rint(gs.length - 1)] : grp, list = [];
    src.e.forEach(function (e) { var n = e[1] + D.rint(e[2] - e[1] + 1); for (var k = 0; k < n; k++) list.push(grp.mirror ? (W.MIRROR[e[0]] || e[0]) : e[0]); });
    return { zone: zone, Z: Z, grp: grp, list: list.slice(0, 8).filter(function (k) { return D.FOES && D.FOES[k]; }), mirror: !!grp.mirror };
  };
  W.onStep = function (scene, st) {
    if (/[?&]noenc\b/.test(scene.q)) return false;
    var e = M.hex[K(S.at[0], S.at[1])], zone = W.zoneOf(e);
    if (S.zone !== zone || S.count == null) W.resetCount(zone);
    S.count -= st.road ? 0.5 : 1; W.save();
    if (S.count > 0) return false;
    W.resetCount(zone); W.save();
    var p = W.pick(zone); if (!p || !p.list.length) return false;
    scene.encounter(p, e); return true;
  };
  function foeName(k, n) { var f = D.FOES && D.FOES[k], nm = (f && f.name) || k; return n > 1 ? nm.replace(/y$/, 'ie').replace(/(s|x|ch|sh)$/, '$1e') + 's' : nm; }
  World.prototype.encounter = function (p, e) {
    var self = this, cnt = {}; p.list.forEach(function (k) { cnt[k] = (cnt[k] || 0) + 1; });
    var who = Object.keys(cnt).map(function (k) { return (cnt[k] > 1 ? cnt[k] + ' ' : 'a ') + foeName(k, cnt[k]).toLowerCase(); }).join(', ');
    D.sfx('encounter');
    this.card([(p.mirror ? '{p}MIRROR-MADE{/} ' : '{r}') + 'On the ' + (M.road[K(e.q, e.r)] ? 'road' : M.terr[e.t].name) + '{/}, ' + W.timeOfDay() + ':', who + (p.mirror ? ', with the Mirror in their eyes' : '') + '.', '', D.keys('{g}E{/}: fight')], null,
      [['a', function () { self.fight(p, e); }]]);
  };
  // the field: 16 x 7 squares of the hex's ground, the lineup's squares kept open (x 3 to 10), the road along the middle where the hex has one
  W.field = function (e) {
    var w = 16, h = 7, rows = [], road = !!M.road[K(e.q, e.r)], t = e.t, wet = e.wet || t === 'bog';
    var mtn = /^(black|gray|coastal)$/.test(t), wood = t === 'woods', hill = t === 'hills' || t === 'foothills' || t === 'gulch';
    for (var y = 0; y < h; y++) {
      var row = '';
      for (var x = 0; x < w; x++) {
        var lane = x >= 3 && x <= 10 && y >= 1 && y <= 5, r0 = D.rand(), ch = '.';
        if (road && y === 3) ch = '=';
        else if (y === 0 || y === h - 1) ch = mtn ? (r0 < 0.6 ? '#' : 'r') : wood ? (r0 < 0.55 ? 'T' : '.') : hill ? (r0 < 0.3 ? 'r' : '.') : wet ? (r0 < 0.4 ? '~' : '.') : (r0 < 0.15 ? 'r' : '.');
        else if (!lane) ch = mtn ? (r0 < 0.12 ? '#' : r0 < 0.3 ? 'r' : '.') : wood ? (r0 < 0.25 ? 'T' : '.') : hill ? (r0 < 0.15 ? 'r' : '.') : wet ? (r0 < 0.3 ? '~' : '.') : (r0 < 0.06 ? 'r' : '.');
        else ch = wet && r0 < 0.12 ? '~' : '.';
        row += ch;
      }
      rows.push(row);
    }
    var def = D.MAPS['world-field'] = { name: M.terr[t].name.replace(/^the /, 'The ').replace(/^./, function (c) { return c.toUpperCase(); }), sub: 'the road, ' + W.timeOfDay(), step: 10, ground: 'earth', rows: rows,
      entry: [[8, 3], [8, 2], [8, 4], [9, 3], [9, 1], [9, 5], [8, 1], [8, 5]], foes: [], wave: null };
    return def;
  };
  W.seat = function (list) { // the foes' line facing the four: the front at x 6, the Large behind it (two squares each)
    var front = [[6, 3], [6, 2], [6, 4], [6, 1], [6, 5]], back = [[4, 1], [4, 4], [3, 2]], small2 = [[5, 3], [5, 1], [5, 5]], out = [];
    list.forEach(function (k, i) { var big = D.FOES[k] && D.FOES[k].size >= 2, at = big ? back.shift() : front.shift() || small2.shift(); if (at) out.push({ id: 'w' + i + '-' + k, kind: k, at: at }); });
    return out;
  };
  World.prototype.fight = function (p, e) {
    var self = this, night = W.timeOfDay() === 'night';
    W.field(e);
    var F = { id: 'worldfield', map: 'world-field', level: W.LEVEL, name: 'On the road', sub: (p.mirror ? 'mirror-made: ' : '') + p.zone, dark: night,
      intro: (p.mirror ? 'Mirror-made: ' : '') + 'They come at the party on the ' + (M.road[K(e.q, e.r)] ? 'road' : M.terr[e.t].name) + '.', won: 'THE ROAD IS CLEAR.', lost: 'THE ROAD TAKES THEM.',
      foes: W.seat(p.list), wave: null };
    var b = new D.Battle({ fightDef: F, ladder: true, level: W.LEVEL, world: true, onDone: function (res) { self.afterFight(res, p); } });
    if (p.mirror) { var e0 = b.enter; b.enter = function () { e0.apply(this, arguments); this.units.forEach(function (u) { if (u.side === 'foe' && !/^mirror/.test(u.kind)) { u.mirrorEye = true; u.name = 'Mirror-made ' + u.name.toLowerCase(); } }); }; }
    D.push(b);
  };
  World.prototype.afterFight = function (res, p) {
    try { D.music('corridor'); } catch (e) { }
    S.t += 1; W.save(); // (a fight and its breath: an hour)
    if (res === 'won') this.say('The road is clear. On, ' + W.timeOfDay() + '.');
    else if (res === 'escaped' || res == null) this.say('The party got clear of them.');
    else { W.passDays(1, 'Beaten, the party drags itself back to the road. A day is lost.'); }
  };

  W.make = function (q) { return new World(q); };
  W.World = World;
})();
