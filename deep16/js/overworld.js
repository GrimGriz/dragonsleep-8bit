/* DEEP16 — THE WORLD, TOP-DOWN (10-20, the world map seat; his "let's yes the 1-4 above and see what comes out", to the seat's four leans: a tile half a mile,
   16 px a tile and the map scrolling, the heights as Zelda's ledges, the tiles drawn by code till the art comes and an art ask for them). The same world, clock,
   doors and road fights as the hex view (js/world.js) -- V switches between them; deep16/?world&tiles opens here. The ground is data/world-tiles.js
   (tools/world-build.py: every half mile the finest ground he painted, else corridor v3's guess; its height's band, 500 ft a ledge; its road), loaded the
   first time this view opens, not on every DEEP16 page.

   THE WALK: the arrows walk the party a tile (two held, the diagonal), a click goes there by the quickest way (the roads leaned on, as the hex view's);
   a tile is half a mile at the SRD's 3 mi an hour, difficult ground twice; past 8 hours a camp. Water, the Rift and the mountains are not walked (his
   "up into and on mountain hexes not a thing on the world map"); A LEDGE (a height band's step of two or more, a thousand feet) is a cliff, walked only
   where a road climbs it; a band's step of one is a slope. A town's tile offers its gate by the side the party stepped in from. */
'use strict';
(function () {
  var D = window.D16 = window.D16 || {}, I = D.input, W = D.world;
  if (!W) return;
  var OV = W.OV = {};
  OV.ZOOMS = [4, 8, 12, 16, 24]; OV.ZI = 3; OV.STEPF = 9; // (px a tile; frames a tile takes to walk)
  var T = null, SITES = {}, B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
  var BLOCK = { lake: 1, sea: 1, rift: 1, black: 1, gray: 1, coastal: 1 }, MTN = { black: 1, gray: 1, coastal: 1 };
  var D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  function decode() {
    var R = D.WORLD_TILES; if (!R) return null;
    var w = R.w, h = R.h, n = w * h, t = new Uint8Array(n), b = new Uint8Array(n), r = new Uint8Array(n), wet = new Uint8Array(n), idx = {}, keys = [];
    Object.keys(R.key).forEach(function (c, i) { idx[c] = i; keys.push(R.key[c]); });
    var run = function (row, y, arr, map) { var x = 0; row.split(' ').forEach(function (tok) { if (!tok) return; var v = map(tok.charAt(0)), c = +tok.slice(1); for (var k = 0; k < c; k++) arr[y * w + x++] = v; }); };
    for (var y = 0; y < h; y++) {
      run(R.t[y], y, t, function (c) { return idx[c] || 0; });
      run(R.r[y], y, r, function (c) { return c === '.' ? 0 : +c; });
      var bs = R.b[y]; for (var x = 0; x < w; x++) b[y * w + x] = B36.indexOf(bs.charAt(x));
    }
    (R.wet || []).forEach(function (i) { wet[i] = 1; });
    return { w: w, h: h, x0: R.x0, y0: R.y0, mi: R.mi, t: t, b: b, r: r, wet: wet, keys: keys };
  }
  OV.ensure = function (cb) {
    if (T) return cb(true);
    if (D.WORLD_TILES) { T = decode(); return cb(!!T); }
    var s = document.createElement('script'); s.src = 'data/world-tiles.js?v=' + ((D.WORLD && D.WORLD.tilesV) || '0');
    s.onload = function () { T = decode(); cb(!!T); }; s.onerror = function () { cb(false); }; document.head.appendChild(s);
  };
  function ix(x, y) { return x < 0 || y < 0 || x >= T.w || y >= T.h ? -1 : y * T.w + x; }
  OV.tileOf = function (p) { return [Math.floor((p[0] - T.x0) / T.mi), Math.floor((p[1] - T.y0) / T.mi)]; };
  OV.centre = function (q) { return [T.x0 + (q[0] + 0.5) * T.mi, T.y0 + (q[1] + 0.5) * T.mi]; };
  OV.keyAt = function (x, y) { var i = ix(x, y); return i < 0 ? null : T.keys[T.t[i]]; };
  OV.passable = function (x, y) {
    var i = ix(x, y); if (i < 0) return false;
    if (SITES[x + ',' + y]) return true;
    var k = T.keys[T.t[i]], rd = T.r[i], Tr = W.M().terr[k];
    if (rd === 1 || rd === 2) return !(k === 'sea'); // (a road or a track goes where it goes: over a stream, up the skirt)
    return !BLOCK[k] && !!(Tr ? +Tr.cost : 1);
  };
  // a step between neighbour tiles: null if it cannot be taken (a ledge -- two bands -- unless a road climbs it or a place is there); else its hours
  OV.step = function (a, b) {
    if (!OV.passable(b[0], b[1])) return null;
    var ia = ix(a[0], a[1]), ib = ix(b[0], b[1]), dx = b[0] - a[0], dy = b[1] - a[1];
    if (dx && dy && (!OV.passable(a[0] + dx, a[1]) || !OV.passable(a[0], a[1] + dy))) return null; // (no corner cut past a wall)
    var road = (T.r[ia] === 1 || T.r[ia] === 2) && (T.r[ib] === 1 || T.r[ib] === 2), site = SITES[a[0] + ',' + a[1]] || SITES[b[0] + ',' + b[1]];
    if (!road && !site && ia >= 0 && Math.abs(T.b[ia] - T.b[ib]) >= 2) return null; // (a ledge: a cliff)
    var k = T.keys[T.t[ib]], Tr = W.M().terr[k], going = road ? 1 : Tr && Tr.diff && !BLOCK[k] ? 2 : 1, mi = T.mi * (dx && dy ? Math.SQRT2 : 1);
    return { h: mi * going / W.PACE, road: road, mi: mi, going: going };
  };
  // the quickest way there (A*, the roads leaned on as the hex view's: off a road a third heavier in the choosing)
  OV.route = function (from, to) {
    if (from[0] === to[0] && from[1] === to[1]) return null;
    var key = function (p) { return p[1] * T.w + p[0]; }, goal = key(to), heap = [], g = {}, hrs = {}, prev = {}, done = {}, n = 0;
    var hcost = function (p) { return Math.hypot(p[0] - to[0], p[1] - to[1]) * T.mi / W.PACE; };
    var push = function (it) { heap.push(it); var i = heap.length - 1; while (i) { var pa = (i - 1) >> 1; if (heap[pa][0] <= heap[i][0]) break; var tmp = heap[pa]; heap[pa] = heap[i]; heap[i] = tmp; i = pa; } };
    var pop = function () { var top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; var i = 0; for (;;) { var l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; var tmp = heap[m]; heap[m] = heap[i]; heap[i] = tmp; i = m; } } return top; };
    var s0 = key(from); g[s0] = 0; hrs[s0] = 0; push([hcost(from), from[0], from[1]]);
    while (heap.length && n++ < 90000) {
      var cur = pop(), ck = cur[2] * T.w + cur[1]; if (done[ck]) continue; done[ck] = 1; if (ck === goal) break;
      for (var d = 0; d < 8; d++) {
        var nb = [cur[1] + D8[d][0], cur[2] + D8[d][1]], nk = key(nb); if (done[nk]) continue;
        var st = OV.step([cur[1], cur[2]], nb); if (!st) continue;
        var ng = g[ck] + st.h * (st.road ? 1 : W.OFFROAD);
        if (g[nk] == null || ng < g[nk]) { g[nk] = ng; hrs[nk] = hrs[ck] + st.h; prev[nk] = ck; push([ng + hcost(nb), nb[0], nb[1]]); }
      }
    }
    if (g[goal] == null) return null;
    var path = [], k = goal; while (k !== s0) { path.unshift([k % T.w, Math.floor(k / T.w)]); k = prev[k]; }
    return { tiles: path, hours: hrs[goal] };
  };
  OV.nearestOpen = function (p) {
    for (var r = 1; r < 40; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && OV.passable(p[0] + dx, p[1] + dy)) return [p[0] + dx, p[1] + dy];
    return null;
  };

  // ---------------------------------------------------------------- open and close
  OV.open = function (sc) {
    OV.ensure(function (ok) {
      if (!ok) { sc.say('No tiles yet: data/world-tiles.js (python tools/world-build.py).'); return; }
      SITES = {}; W.M().sites.forEach(function (s) { var q = OV.tileOf([s.x, s.y]); (SITES[q[0] + ',' + q[1]] = SITES[q[0] + ',' + q[1]] || []).push(s); });
      var S = W.state(); if (!S.pos) S.pos = W.hc(S.at[0], S.at[1]);
      var p = OV.tileOf(S.pos); if (!OV.passable(p[0], p[1])) { var q2 = OV.nearestOpen(p); if (q2) S.pos = OV.centre(q2); } else S.pos = OV.centre(p);
      sc.view = 'tiles'; sc.ov = { cam: S.pos.slice(), zi: OV.ZI, walk: null, plan: null, hov: null, fx: 0, hold: 0, facing: [0, 1] }; W.save();
      sc.say('Top-down, ' + W.timeOfDay() + '. The arrows walk, a click goes there; V back to the hexes.');
    });
  };
  OV.close = function (sc) {
    var S = W.state(); if (W.place(S.pos)) sc.onMap();
    sc.view = 'hex'; var c = W.hc(S.at[0], S.at[1]); sc.cam.cx = c[0]; sc.cam.cy = c[1]; W.save(); sc.say('The hexes, ' + W.timeOfDay() + '.');
  };

  // ---------------------------------------------------------------- the walk
  OV.update = function (sc) {
    var ov = sc.ov, S = W.state(), m = I.mouse, ts = OV.ZOOMS[ov.zi], pxmi = ts / T.mi;
    if (m.wheel) ov.zi = Math.max(0, Math.min(OV.ZOOMS.length - 1, ov.zi - m.wheel));
    if (I.pressed('zoomin')) ov.zi = Math.min(OV.ZOOMS.length - 1, ov.zi + 1);
    if (I.pressed('zoomout')) ov.zi = Math.max(0, ov.zi - 1);
    if (m.panX || m.panY) { ov.cam[0] -= (m.panX || 0) / pxmi; ov.cam[1] -= (m.panY || 0) / pxmi; m.panX = m.panY = 0; ov.free = true; }
    if (m.inside && !D.touch) { var EG = 8, sp = 6 / pxmi, mv = false; if (m.x < EG) { ov.cam[0] -= sp; mv = true; } else if (m.x > D.W - EG) { ov.cam[0] += sp; mv = true; } if (m.y < EG) { ov.cam[1] -= sp; mv = true; } else if (m.y > D.H - EG) { ov.cam[1] += sp; mv = true; } if (mv) ov.free = true; } // (the mouse at the edge scrolls)
    if (I.pressed('center')) ov.free = false;
    if (!ov.free || ov.walk) { ov.cam[0] += (S.pos[0] - ov.cam[0]) * 0.18; ov.cam[1] += (S.pos[1] - ov.cam[1]) * 0.18; }
    if (ov.walk) { OV.stepWalk(sc); return; }
    // the arrows: a tile (two held: the diagonal)
    var dx = I.held.left ? -1 : I.held.right ? 1 : 0, dy = I.held.up ? -1 : I.held.down ? 1 : 0;
    if (dx || dy) {
      if (ov.hold <= 0 || I.pressed('left') || I.pressed('right') || I.pressed('up') || I.pressed('down')) {
        var p0 = OV.tileOf(S.pos), nb = [p0[0] + dx, p0[1] + dy], st = OV.step(p0, nb);
        if (!st && dx && dy) { nb = [p0[0] + dx, p0[1]]; st = OV.step(p0, nb); if (!st) { nb = [p0[0], p0[1] + dy]; st = OV.step(p0, nb); } } // (slide along a wall)
        if (st) { ov.walk = { path: [nb], f: 0, arrows: true }; ov.free = false; ov.plan = null; }
        else if (I.pressed('left') || I.pressed('right') || I.pressed('up') || I.pressed('down')) { var k2 = OV.keyAt(p0[0] + dx, p0[1] + dy); sc.say(!k2 ? 'Off the map that way.' : MTN[k2] ? 'The mountains: no way up on the world map.' : BLOCK[k2] ? 'No one walks that way (' + W.M().terr[k2].name + ').' : 'A ledge: too steep to climb here.'); }
        ov.hold = 0;
      }
      return;
    }
    // the mouse: the tile it points at and the way there
    var hv = m.inside ? OV.tileOf([(m.x - D.W / 2) / pxmi + ov.cam[0], (m.y - D.H / 2) / pxmi + ov.cam[1]]) : null;
    if (hv && (!ov.hov || hv[0] !== ov.hov[0] || hv[1] !== ov.hov[1])) { ov.hov = hv; ov.plan = Math.abs(hv[0] - OV.tileOf(S.pos)[0]) + Math.abs(hv[1] - OV.tileOf(S.pos)[1]) < 400 ? OV.route(OV.tileOf(S.pos), hv) : null; }
    if (!hv) ov.hov = null;
    if (m.click && m.inside && ov.plan) { ov.walk = { path: ov.plan.tiles.slice(), f: 0 }; ov.plan = null; ov.free = false; D.sfx('confirm'); return; }
    if (I.pressed('a')) { var here = OV.doorHere(), rt = OV.routeHere(); if (here) sc.offerDoor(here, ov.last || null); else if (rt) sc.offerRoute(rt); else OV.look(sc); }
    if (I.pressed('end') && W.house()) { sc.campCard(); return; } // (the house's camp: the night's three watches, or an hour -- js/world.js campCard)
    if (I.pressed('end')) { W.camp(); D.sfx('confirm'); sc.say('The party makes camp, and walks on at first light: ' + W.timeOfDay() + '.'); }
  };
  // a step a time, as the hex view's: past the day's march it asks, never camps on its own (10-22, his "Right now moving seems to be auto-camping" -- till then a camp
  // past 8 hours here, the house's night and its watches skipped): the house's march by the day's hexes, a tile its share of one; the bare door's by the hours
  OV.stepWalk = function (sc) {
    var ov = sc.ov, w = ov.walk, S = W.state(), p0 = OV.tileOf(S.pos), next = w.path[0], st = OV.step(p0, next);
    if (!st) { ov.walk = null; return; }
    if (W.house()) st.share = st.mi * st.going / W.MARCHMI; // (a tile's share of THE MARCH's 5-mile hex, on either map)
    if (w.f === 0) {
      var resume = function (p) { ov.walk = { path: p, f: 0 }; ov.free = false; };
      if (W.house() ? D.house.marchAsk(sc, st, w, resume) : sc.dayAsk(st, w.path.slice(), resume)) { ov.walk = null; return; }
      ov.facing = [next[0] - p0[0], next[1] - p0[1]];
    }
    w.f++; if (w.f < OV.STEPF) return;
    var hrs = W.house() ? D.house.marchHours(st) : st.h; // (the house: an exhausted party's half speed takes twice the hours)
    w.f = 0; ov.last = S.pos.slice(); S.pos = OV.centre(next); if (W.place(S.pos)) sc.onMap(); // (the hex under it, on the map that covers it: the Silverton area's edge crossed)
    S.t += hrs; S.today += hrs; w.path.shift(); W.save();
    if (W.house()) { // (the forced march's saves as a tile completes a hex past the day's: a failure holds the walk on a card till OK, as the hex view's)
      var ml = D.house.marchStep(st); if (ml === null) { ov.walk = null; return; }
      if (ml.length) { W.save(); D.sfx('popup'); var path = w.path.slice(); ov.walk = null; sc.card(D.house.marchCard(ml), null, [['a', function () { OV.arrive(sc, st, next, { path: path, arrows: w.arrows }); }, 'OK']]); return; }
    }
    OV.arrive(sc, st, next, w);
  };
  // the step's end: the road's chance of a fight, a door, the places here, and the walk's end (w: the walk, its path what is left)
  OV.arrive = function (sc, st, next, w) {
    var ov = sc.ov; if (w !== ov.walk && w.path.length) ov.walk = { path: w.path, f: 0, arrows: w.arrows };
    if (W.onStep && W.onStep(sc, st)) { ov.walk = null; return; } // (a fight on the way)
    var door = OV.doorHere(), ss = SITES[next[0] + ',' + next[1]];
    if (door) { ov.walk = null; sc.offerDoor(door, ov.last); return; }
    if (ss && !w.arrows) sc.say(ss.map(function (s) { return s.name; }).join(', ') + '.');
    if (!w.path.length) { ov.walk = null; var rt = OV.routeHere(); if (rt) sc.offerRoute(rt); else if (ss) OV.look(sc); }
  };
  OV.doorHere = function () { var p = OV.tileOf(W.state().pos), ss = SITES[p[0] + ',' + p[1]] || []; for (var i = 0; i < ss.length; i++) if (W.DOORS[ss[i].id]) return ss[i]; return null; };
  OV.routeHere = function () {
    var p = OV.tileOf(W.state().pos), R = W.M().routes;
    for (var i = 0; i < R.length; i++) for (var j = 0; j < 2; j++) { var q = OV.tileOf([R[i].ends[j].x, R[i].ends[j].y]); if (Math.abs(q[0] - p[0]) <= 1 && Math.abs(q[1] - p[1]) <= 1) return { r: R[i], end: j }; }
    return null;
  };
  OV.look = function (sc) {
    var S = W.state(), p = OV.tileOf(S.pos), k = OV.keyAt(p[0], p[1]), ss = (SITES[p[0] + ',' + p[1]] || []).filter(function (s) { return !W.DOORS[s.id]; }).map(function (s) { return s.name; });
    sc.say((ss.length ? ss.join(', ') + ' (its map is not built yet) -- ' : '') + (W.M().terr[k] ? W.M().terr[k].name : k) + ', about ' + (T.b[ix(p[0], p[1])] * 500 + 250).toLocaleString() + ' ft. ' + W.timeOfDay() + '.');
  };

  // ---------------------------------------------------------------- the look: placeholder tiles drawn by code (the art ask: deep16-art-wanted.md)
  function hh(x, y, i) { var h = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(i + 1, 83492791)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h % 10000) / 10000; }
  var CC = {};
  function rgbOf(c) { if (CC[c]) return CC[c]; var m = /^#?([0-9a-f]{6})$/i.exec(c || ''), n = m ? parseInt(m[1], 16) : 0xc800c8; return (CC[c] = [n >> 16, (n >> 8) & 255, n & 255]); }
  function rgb(c, s, mix, mixc) { var r = c[0], g = c[1], b = c[2]; if (mix) { r += (mixc[0] - r) * mix; g += (mixc[1] - g) * mix; b += (mixc[2] - b) * mix; } r *= s; g *= s; b *= s; return 'rgb(' + Math.max(0, Math.min(255, r | 0)) + ',' + Math.max(0, Math.min(255, g | 0)) + ',' + Math.max(0, Math.min(255, b | 0)) + ')'; }
  var ROCK = [138, 128, 144];
  function drawTile(g, x, y, sx, sy, s) {
    var i = ix(x, y); if (i < 0) return;
    var k = T.keys[T.t[i]], Tr = W.M().terr[k], base = rgbOf(Tr ? Tr.color : '#c800c8'), band = T.b[i], mtn = MTN[k], water = k === 'lake' || k === 'sea';
    var lift = water ? 1 : 0.92 + Math.min(0.2, band * 0.012); // (higher ground a shade lighter: the terraces read)
    g.fillStyle = rgb(base, lift, mtn ? 0.42 : 0, ROCK); g.fillRect(sx, sy, s, s);
    if (s >= 8) {
      var u = s / 16, dark = rgb(base, lift * 0.72, mtn ? 0.42 : 0, ROCK), lite = rgb(base, lift * 1.18, mtn ? 0.42 : 0, ROCK), r1 = hh(x, y, 1), r2 = hh(x, y, 2);
      if (k === 'woods') { var cx = sx + s * (0.35 + 0.3 * r1), cy = sy + s * (0.4 + 0.2 * r2), rr = s * 0.42; g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(cx + u, cy + rr * 0.7, rr * 0.9, rr * 0.45, 0, 0, 7); g.fill(); g.fillStyle = dark; g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.fill(); g.fillStyle = lite; g.beginPath(); g.arc(cx - rr * 0.3, cy - rr * 0.3, rr * 0.45, 0, 7); g.fill(); }
      else if (k === 'farms') { g.fillStyle = dark; for (var f = 2 * u; f < s; f += 4 * u) g.fillRect(sx, sy + f, s, Math.max(1, u)); }
      else if (k === 'verge' || k === 'plains') { g.fillStyle = dark; g.fillRect(sx + s * r1 | 0, sy + s * r2 | 0, Math.max(1, u), Math.max(2, 3 * u)); g.fillRect(sx + s * hh(x, y, 3) | 0, sy + s * hh(x, y, 4) | 0, Math.max(1, u), Math.max(1, 2 * u)); }
      else if (k === 'hills' || k === 'foothills') { g.strokeStyle = dark; g.lineWidth = Math.max(1, u); g.beginPath(); g.arc(sx + s * (0.3 + 0.4 * r1), sy + s * 0.75, s * 0.28, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.strokeStyle = lite; g.beginPath(); g.arc(sx + s * (0.3 + 0.4 * r1) - u, sy + s * 0.75 - u, s * 0.28, Math.PI * 1.15, Math.PI * 1.45); g.stroke(); }
      else if (mtn) { g.strokeStyle = dark; g.lineWidth = Math.max(1, u); g.beginPath(); g.moveTo(sx + s * r1, sy + s * 0.15); g.lineTo(sx + s * (r1 * 0.5 + 0.25), sy + s * 0.55); g.lineTo(sx + s * r2, sy + s * 0.9); g.stroke(); if (band >= 14) { g.fillStyle = 'rgba(240,242,250,.85)'; g.fillRect(sx + s * 0.1, sy + s * 0.1, s * 0.45, s * 0.3); } }
      else if (k === 'bog') { g.fillStyle = 'rgba(70,130,140,.8)'; g.fillRect(sx + s * r1 | 0, sy + s * r2 | 0, 3 * u, 2 * u); g.fillStyle = dark; g.fillRect(sx + s * hh(x, y, 5) | 0, sy + s * hh(x, y, 6) | 0, u, 3 * u); }
      else if (k === 'gulch') { g.strokeStyle = '#26160a'; g.lineWidth = Math.max(1.5, 3 * u); g.beginPath(); g.moveTo(sx, sy + s * (0.3 + 0.3 * r1)); g.lineTo(sx + s * 0.5, sy + s * (0.4 + 0.3 * r2)); g.lineTo(sx + s, sy + s * (0.3 + 0.3 * hh(x + 1, y, 1))); g.stroke(); }
      else if (k === 'town') { g.fillStyle = dark; g.fillRect(sx + 2 * u, sy + 2 * u, s - 4 * u, s - 4 * u); if (r1 < 0.6) { g.fillStyle = '#a8442e'; g.fillRect(sx + 3 * u, sy + 3 * u, s - 6 * u, (s - 6 * u) / 2); } }
      else if (water) { if (((D.frame >> 4) + x + y) % 4 === 0) { g.fillStyle = 'rgba(220,240,250,.6)'; g.fillRect(sx + s * r1 | 0, sy + s * r2 | 0, 3 * u, u); } }
      else if (k === 'rift') { g.fillStyle = '#05030a'; g.fillRect(sx + u, sy + u, s - 2 * u, s - 2 * u); }
    }
    if (T.wet[i] && !water) { g.fillStyle = 'rgba(70,132,128,.45)'; g.fillRect(sx, sy, s, s); if (s >= 8) { g.fillStyle = '#3c5a2a'; g.fillRect(sx + s * hh(x, y, 7) | 0, sy + s * 0.3 | 0, Math.max(1, s / 16), s * 0.3); } }
    // the ledges: a face where this tile stands above the one south of it, an edge to east and west, a shadow cast from the north
    if (!water) {
      var bs = ix(x, y + 1) >= 0 ? T.b[ix(x, y + 1)] : band, be = ix(x + 1, y) >= 0 ? T.b[ix(x + 1, y)] : band, bw = ix(x - 1, y) >= 0 ? T.b[ix(x - 1, y)] : band, bn = ix(x, y - 1) >= 0 ? T.b[ix(x, y - 1)] : band;
      var face = Math.max(2, Math.round(s * 0.28));
      if (band > bs) { g.fillStyle = rgb(base, 0.5, 0.55, ROCK); g.fillRect(sx, sy + s - face, s, face); g.fillStyle = 'rgba(0,0,0,.25)'; for (var st = 1; st < s; st += Math.max(2, s / 4)) g.fillRect(sx + st, sy + s - face, Math.max(1, s / 16), face); }
      if (band > be) { g.fillStyle = 'rgba(30,20,10,.45)'; g.fillRect(sx + s - Math.max(1, s / 10), sy, Math.max(1, s / 10), s); }
      if (band > bw) { g.fillStyle = 'rgba(255,240,210,.25)'; g.fillRect(sx, sy, Math.max(1, s / 12), s); }
      if (bn > band) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(sx, sy, s, Math.max(1, s / 6)); }
    }
  }
  function drawWays(g, x0, y0, x1, y1, scr, s) {
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
      var i = ix(x, y); if (i < 0 || !T.r[i]) continue;
      var c = T.r[i], p = scr(x, y), cx = p[0] + s / 2, cy = p[1] + s / 2, n = 0;
      g.lineCap = 'round'; g.strokeStyle = c === 3 ? 'rgba(80,150,200,.95)' : c === 4 ? 'rgba(70,40,20,.7)' : '#c8a878'; g.lineWidth = Math.max(1, s * (c === 3 ? 0.42 : c === 2 ? 0.22 : c === 4 ? 0.16 : 0.34));
      for (var d = 0; d < 8; d++) { var j = ix(x + D8[d][0], y + D8[d][1]); if (j < 0 || T.r[j] !== c) continue; if (d >= 4 && (T.r[ix(x + D8[d][0], y)] === c || T.r[ix(x, y + D8[d][1])] === c)) continue; n++; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + D8[d][0] * s / 2, cy + D8[d][1] * s / 2); g.stroke(); }
      if (!n) { g.beginPath(); g.moveTo(cx - 0.1, cy); g.lineTo(cx + 0.1, cy); g.stroke(); }
      g.lineCap = 'butt';
    }
  }
  function figure(g, x, y, s, walking, t, f) { // the party: a figure of the 16-bit look (the lead's own sheet when the art comes)
    var u = Math.max(1, s / 16), leg = walking ? (Math.floor(t / 4) % 2 ? 1 : -1) : 0, back = f[1] < 0;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x, y + 7 * u, 5 * u, 2 * u, 0, 0, 7); g.fill();
    g.fillStyle = '#3a2614'; g.fillRect(x - 3 * u, y + 2 * u + leg * u, 2 * u, 5 * u); g.fillRect(x + u, y + 2 * u - leg * u, 2 * u, 5 * u);
    g.fillStyle = '#c84030'; g.fillRect(x - 4 * u, y - 4 * u, 8 * u, 7 * u); g.fillStyle = '#8a2a20'; g.fillRect(x - 4 * u, y + 2 * u, 8 * u, u);
    g.fillStyle = '#e8b890'; g.fillRect(x - 3 * u, y - 10 * u, 6 * u, 6 * u);
    g.fillStyle = '#5a3018'; g.fillRect(x - 3 * u, y - 11 * u, 6 * u, back ? 6 * u : 2 * u);
    if (!back) { g.fillStyle = '#20140a'; g.fillRect(x - 2 * u + (f[0] > 0 ? u : 0), y - 8 * u, u, u); g.fillRect(x + (f[0] < 0 ? 0 : u), y - 8 * u, u, u); }
  }
  OV.draw = function (sc, ctx) {
    var ov = sc.ov, S = W.state(), ts = OV.ZOOMS[ov.zi], pxmi = ts / T.mi, cam = ov.cam;
    ctx.fillStyle = '#10141c'; ctx.fillRect(0, 0, D.W, D.H);
    var scr = function (x, y) { return [Math.round((T.x0 + x * T.mi - cam[0]) * pxmi + D.W / 2), Math.round((T.y0 + y * T.mi - cam[1]) * pxmi + D.H / 2)]; };
    var x0 = Math.floor((cam[0] - D.W / 2 / pxmi - T.x0) / T.mi) - 1, x1 = Math.ceil((cam[0] + D.W / 2 / pxmi - T.x0) / T.mi) + 1;
    var y0 = Math.floor((cam[1] - D.H / 2 / pxmi - T.y0) / T.mi) - 1, y1 = Math.ceil((cam[1] + D.H / 2 / pxmi - T.y0) / T.mi) + 1;
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) { var p = scr(x, y); drawTile(ctx, x, y, p[0], p[1], ts); }
    drawWays(ctx, x0, y0, x1, y1, scr, ts);
    if (ov.plan) { ctx.fillStyle = 'rgba(255,214,60,.75)'; ov.plan.tiles.forEach(function (q, i) { if (i % 2 && i !== ov.plan.tiles.length - 1) return; var p2 = scr(q[0], q[1]); ctx.fillRect(p2[0] + ts / 2 - 1, p2[1] + ts / 2 - 1, 2, 2); }); }
    if (ov.hov) { var ph = scr(ov.hov[0], ov.hov[1]); ctx.strokeStyle = ov.plan ? '#ffd23c' : 'rgba(255,90,80,.85)'; ctx.lineWidth = 1; ctx.strokeRect(ph[0] + 0.5, ph[1] + 0.5, ts - 1, ts - 1); }
    // the places: their icons, the greater names first, none over another
    var M0 = W.M(), boxes = [], order = M0.sites.slice().sort(function (a, b) { return (W.RANK[a.kind] || 5) - (W.RANK[b.kind] || 5); });
    order.forEach(function (s0) { var q = OV.tileOf([s0.x, s0.y]), p3 = scr(q[0], q[1]); W.icon(ctx, s0.kind, p3[0] + ts / 2, p3[1] + ts / 2); });
    order.forEach(function (s0) {
      if (!W.BIG[s0.kind] && ts < 12) return;
      var q = OV.tileOf([s0.x, s0.y]), p3 = scr(q[0], q[1]), nm = s0.name.replace(/ \(.*\)$/, ''), tx = p3[0] + ts / 2 + 6, ty = p3[1] + ts / 2 - 4, tw = D.textWidth(nm), bx = [tx - 1, ty - 1, tx + tw + 1, ty + 9];
      if (boxes.some(function (b) { return bx[0] < b[2] && bx[2] > b[0] && bx[1] < b[3] && bx[3] > b[1]; })) return; boxes.push(bx); D.text(ctx, nm, tx, ty, W.BIG[s0.kind] ? '#f6e9c5' : '#c8bca0');
    });
    // the party, between tiles as it walks
    var pp = S.pos, t0 = OV.tileOf(pp);
    if (ov.walk && ov.walk.path.length) { var nx = OV.centre(ov.walk.path[0]), u2 = ov.walk.f / OV.STEPF; pp = [pp[0] + (nx[0] - pp[0]) * u2, pp[1] + (nx[1] - pp[1]) * u2]; }
    figure(ctx, Math.round((pp[0] - cam[0]) * pxmi + D.W / 2), Math.round((pp[1] - cam[1]) * pxmi + D.H / 2), Math.max(10, ts), !!ov.walk, sc.t, ov.facing || [0, 1]);
    var sky = W.SKY[W.timeOfDay()]; if (sky) { ctx.fillStyle = sky; ctx.fillRect(0, 0, D.W, D.H); }
    // the box: the hour, the ground under the party
    var ti = ix(t0[0], t0[1]), k = T.keys[T.t[ti]], tod = W.timeOfDay();
    D.win8(ctx, 4, 4, 196, 30);
    D.text(ctx, '{y}' + tod.charAt(0).toUpperCase() + tod.slice(1) + '{/}' + (sc.dev ? '  {g}(day ' + W.day() + ', ' + W.hour().toFixed(1) + 'h, ' + S.today.toFixed(1) + 'h walked){/}' : ''), 10, 9, D.WIN8.text);
    D.text(ctx, (M0.terr[k] ? M0.terr[k].name : k) + (T.r[ti] === 1 || T.r[ti] === 2 ? ', on the road' : '') + ' · about ' + (T.b[ti] * 500 + 250).toLocaleString() + ' ft', 10, 20, '#c8c4b8');
    if (ov.hov && !ov.walk) {
      var hi = ix(ov.hov[0], ov.hov[1]), lines = [];
      if (hi < 0) lines.push('{g}off the map{/}');
      else {
        var hk = T.keys[T.t[hi]], ss = (SITES[ov.hov[0] + ',' + ov.hov[1]] || []).map(function (s1) { return s1.name; });
        lines.push((ss.length ? ss.join(', ') + ' · ' : '') + (M0.terr[hk] ? M0.terr[hk].name : hk) + ' · about ' + (T.b[hi] * 500 + 250).toLocaleString() + ' ft');
        if (ov.plan) { var hrs = ov.plan.hours, cps = Math.floor((S.today + hrs) / W.DAYHOURS - 1e-6); lines.push((ov.plan.tiles.length * T.mi).toFixed(1) + ' mi · ' + (hrs < 10 ? hrs.toFixed(1) + ' hours' : (hrs / W.DAYHOURS).toFixed(1) + ' days of walking') + (cps > 0 ? ' · ' + cps + ' camp' + (cps > 1 ? 's' : '') : '')); }
        else if (MTN[hk]) lines.push('{g}the mountains: their roads are roams (to come){/}');
        else if (!OV.passable(ov.hov[0], ov.hov[1])) lines.push('{r}no one walks it{/}');
        else if (ov.hov[0] !== t0[0] || ov.hov[1] !== t0[1]) lines.push('{r}no way there (a ledge, or too far to find){/}');
      }
      var bw = 8 + Math.max.apply(null, lines.map(function (l) { return D.textWidth(l); })), bxx = Math.min(D.W - bw - 4, I.mouse.x + 10), byy = Math.min(D.H - 14 - lines.length * 10, I.mouse.y + 10);
      ctx.fillStyle = 'rgba(8,8,20,.85)'; ctx.fillRect(bxx, byy, bw, 6 + lines.length * 10); lines.forEach(function (l, i) { D.text(ctx, l, bxx + 4, byy + 4 + i * 10, '#e8e4d8'); });
    }
    sc.hudBottom(ctx, 'arrows: walk  click: go  E: here  SPACE: camp  V: hexes  wheel: zoom');
  };
})();
