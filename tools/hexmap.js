/* The realm's hex map (10-16, the maps lane; tools/hexmap.html says how to serve it). Griz, 10-15: "at each zoom level I can select the hex and
   change the terrain type in order to reconstruct the corridor-silver-pit"; "1 B"; "I'll need to be able to move the cities and roads around as well".

   THREE LEVELS of pointy-top hexes, nested by their centres: 5 mi (OD&D Book III's wilderness hex, the Snoot's), 1 mi (25 to a 5-mile hex; Silverton
   environs v3's mile squares), 1/16 mi = 330 ft (256 to a mile hex: a city block, RULED 07-24 "a block ~ 300 ft", about 66 grid squares -- one DEEP16
   map). A hex at level k+1 belongs to the hex at level k its centre lies in, so every parent owns exactly n*n children and its outline at the finer
   level zig-zags. A hex shows its own terrain if painted, else its parent's: paint the country at 5 mi, then go in only where it matters.

   THE PLANE is in miles, x east and y south, (0, 0) the corridor map v3's top-left corner at the road register's scale (Silverton to the Pit 35 mi,
   2 cart-days: TarlynsPit/wiki/the-road.md; Griz, 10-15: "~35 seems right"). Places and roads are free of the grid; a road's point may be bound to a
   place (it moves with it). Level 1 hex (0, 0) is centred on that corner; a hex's name is its offset column and row (odd rows half a hex right, as
   the Snoot's map). What he paints lives in this browser (localStorage) and comes back by EXPORT. */
'use strict';
(function () {
  var SQ3 = Math.sqrt(3);
  var LV = [null,
    { w: 5, n: 1, name: '5 mi', long: '5-mile hexes: the wilderness (the Snoot’s scale)', px: 46 },
    { w: 1, n: 5, name: '1 mi', long: 'mile hexes: 25 to a 5-mile hex', px: 40 },
    { w: 1 / 16, n: 16, name: '330 ft', long: '330 ft hexes: a city block, about 66 grid squares; 256 to a mile hex', px: 34 }];
  var V3 = Math.hypot(1560 - 1530, 1180 - 360) / 35; // px a mile on corridor v3: Silverton's badge (1530, 360) to the Pit's (1560, 1180) is 35 miles
  var KEY = 'realm-hexmap-v1', ZMIN = 1.2, ZMAX = 6000;
  var KINDS = ['city', 'town', 'castle', 'inn', 'cave', 'junction', 'seat', 'hamlet', 'mark'];
  var PKINDS = ['road', 'track', 'river'];
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // ---------------------------------------------------------------- the seed: corridor v3's places and roads (its own numbers, px on its canvas)
  function v3(x, y) { return [x / V3, y / V3]; }
  function seedTerr() {
    return [ // cost: Book III's going (a day's march counts a hill or a wood twice, a swamp or a mountain three times); 0 = no one walks it
      { k: 'plains', name: 'plains', color: '#c9a468', cost: 1 }, { k: 'verge', name: 'the Verge (grass)', color: '#9db06a', cost: 1 },
      { k: 'farms', name: 'farmland', color: '#dcc47e', cost: 1 }, { k: 'foothills', name: 'foothills', color: '#b88f58', cost: 2 },
      { k: 'hills', name: 'hills', color: '#a0733a', cost: 2 }, { k: 'woods', name: 'woods', color: '#4f7a3a', cost: 2 },
      { k: 'gulch', name: 'gulch / ravine', color: '#8c6b4a', cost: 2 }, { k: 'bog', name: 'bog / marsh', color: '#5d7040', cost: 3 },
      { k: 'black', name: 'black mountains', color: '#3a3240', cost: 3 }, { k: 'gray', name: 'gray mountains', color: '#7a6650', cost: 3 },
      { k: 'coastal', name: 'coastal range', color: '#5e5040', cost: 3 }, { k: 'town', name: 'town / built', color: '#9a9cb0', cost: 1 },
      { k: 'lake', name: 'lake', color: '#4a98a8', cost: 0 }, { k: 'sea', name: 'the sea', color: '#2b6d75', cost: 0 },
      { k: 'rift', name: 'the Rift / chasm', color: '#1c1612', cost: 0 }
    ];
  }
  function seedSites() {
    return [
      ['silverton', 'Silverton', 'city', 1530, 360], ['pit', "Tarlyn's Pit", 'city', 1560, 1180], ['castegut', 'Castegut', 'castle', 230, 590],
      ['inn', 'the Halfway Inn', 'inn', 1494.5, 811.5], ['mouth', "the Guano Galleries' mouth", 'cave', 1319.5, 396.5],
      ['fork', 'the fork', 'junction', 1430, 470], ['jct', 'the Galleries junction', 'junction', 1458, 402],
      ['moot', 'the moot ground', 'seat', 920, 950, "not on v3: the seat put it at the pocket's south-centre (wiki/gnoll-hills.md: the Gray Keeping's ground, 'three days' walk above the Halfway Inn')"],
      ['monks', 'the lone mountain (the stone monks)', 'mark', 430, 1130]
    ].map(function (s) { var p = v3(s[3], s[4]); return { id: s[0], name: s[1], kind: s[2], x: p[0], y: p[1], note: s[5] || '' }; });
  }
  function seedPaths() {
    var P = function (a) { return a.map(function (p) { return typeof p === 'string' ? p : v3(p[0], p[1]); }); };
    return [
      { id: 'pitroad', name: 'the Pit road', kind: 'road', pts: P(['pit', [1540, 1000], [1490, 860], [1470, 700], [1450, 560], 'fork']) },
      { id: 'mile', name: 'the mile (the fork to Silverton)', kind: 'road', pts: P(['fork', [1446, 436], 'jct', [1496, 378], 'silverton']) },
      { id: 'doors', name: 'up-mountain to the Doors', kind: 'track', pts: P(['silverton', [1478, 300], [1425, 232], [1365, 165]]) },
      { id: 'galleries', name: 'the Galleries road', kind: 'track', pts: P(['jct', [1400, 406], 'mouth']) },
      { id: 'castegut', name: 'the Castegut road (the west road)', kind: 'track', pts: P(['fork', [1300, 510], [1100, 540], [900, 560], [700, 560], [520, 570], [380, 560], [300, 560], 'castegut']) },
      { id: 'pirate', name: 'the pirate road', kind: 'road', pts: P(['pit', [1800, 1120], [2100, 1080], [2400, 1040]]) },
      { id: 'newland', name: 'to Newland', kind: 'road', pts: P(['pit', [1600, 1300], [1650, 1416]]) },
      { id: 'river', name: 'the river (Silverton to the sea)', kind: 'river', pts: P([[1545, 362], [1660, 392], [1780, 408], [1900, 400], [2150, 370], [2330, 330]]) }
    ];
  }
  function seedUnder(sites) {
    var s = sites.filter(function (x) { return x.id === 'silverton'; })[0] || { x: 65, y: 15 };
    return [ // the two Silverton maps pinned by a guess (environs: its 'the Edifice' label; city: the dwarven gate) -- U drags one into place
      { id: 'corridor', name: 'corridor v3 (the road)', file: 'corridor-silverton-pit-v3.png', pxmi: V3, x0: 0, y0: 0, on: true, op: 0.75 },
      { id: 'environs', name: 'Silverton environs v3 (mile squares)', file: 'silverton-environs-v3.png', pxmi: 200, x0: s.x - 336 / 200, y0: s.y - 452 / 200, on: false, op: 0.8 },
      { id: 'city', name: 'Silverton city v6 (1 px = 1 ft)', file: 'silverton-city-map-v6.png', pxmi: 5280, x0: s.x - 1260 / 5280, y0: s.y - 470 / 5280, on: false, op: 0.8 }
    ];
  }
  function fresh() {
    var sites = seedSites();
    return { v: 1, terr: seedTerr(), paint: { 1: {}, 2: {}, 3: {} }, sites: sites, paths: seedPaths(), under: seedUnder(sites),
      pace: { foot: 24, cart: 17 }, opts: { paintOp: 0.7, grid: true, labels: true, terr: 'hills', brush: 0, tool: 'select', uSel: 'corridor' }, view: null };
  }

  // ---------------------------------------------------------------- hex math (axial q, r; pointy-top)
  function hc(L, q, r) { var w = LV[L].w; return [w * (q + r / 2), w * SQ3 / 2 * r]; }
  function round(qf, rf) {
    var x = qf, z = rf, y = -x - z, rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
    var dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
    return [rx + 0, rz + 0];
  }
  function at(L, x, y) { var w = LV[L].w, r = y / (w * SQ3 / 2); return round(x / w - r / 2, r); }
  // the parent at L-1 (the nudge breaks a tie on an edge the same way everywhere, so every parent owns n*n)
  function up(L, q, r) { var n = LV[L].n; return round(q / n + 1e-7, r / n + 2.3e-7); }
  var CH = {};
  function kids(n) {
    if (CH[n]) return CH[n];
    var out = [], m = n + 2;
    for (var dr = -m; dr <= m; dr++) for (var dq = -m; dq <= m; dq++) { var p = round(dq / n + 1e-7, dr / n + 2.3e-7); if (p[0] === 0 && p[1] === 0) out.push([dq, dr]); }
    return (CH[n] = out);
  }
  function K(q, r) { return q + ',' + r; }
  function unK(k) { var i = k.indexOf(','); return [+k.slice(0, i), +k.slice(i + 1)]; }
  function col(q, r) { return q + (r - (r & 1)) / 2; } // (odd-r offset: the Snoot's)
  var DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]], DANG = [0, -60, -120, 180, 120, 60];
  function hdist(a, b) { var dq = a[0] - b[0], dr = a[1] - b[1]; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }

  // ---------------------------------------------------------------- state
  var S, DC, TB = {}, SB = {}, UNDO = [], REDO = [], OP = null, VER = 0, LAYERKEY = '';
  var view = { cx: 54, cy: 30, z: 11, L: 1 };
  var SEL = { hex: null, site: null, path: null, vtx: -1 };
  var M = { pts: [], live: null, done: false }, DRAW = null, IMG = {};
  function reindex() { VER++; TB = {}; S.terr.forEach(function (t) { TB[t.k] = t; }); SB = {}; S.sites.forEach(function (s) { SB[s.id] = s; }); }
  function rebuildDC() { DC = { 1: new Map(), 2: new Map() }; [2, 3].forEach(function (L) { Object.keys(S.paint[L]).forEach(function (k) { bump(L, k, 1); }); }); }
  function bump(L, k, d) {
    var p = unK(k);
    for (var l = L; l > 1; l--) { p = up(l, p[0], p[1]); var pk = K(p[0], p[1]), v = (DC[l - 1].get(pk) || 0) + d; if (v > 0) DC[l - 1].set(pk, v); else DC[l - 1].delete(pk); }
  }
  function load() {
    var raw = null; try { raw = localStorage.getItem(KEY); } catch (e) { /* (no storage: the page still works, EXPORT keeps it) */ }
    S = null; if (raw) try { S = JSON.parse(raw); } catch (e) { S = null; }
    if (!S || S.v !== 1) S = fresh();
    var f = fresh();
    ['paint', 'pace', 'opts', 'under', 'terr', 'sites', 'paths'].forEach(function (k) { if (!S[k]) S[k] = f[k]; });
    [1, 2, 3].forEach(function (L) { S.paint[L] = S.paint[L] || {}; });
    Object.keys(f.opts).forEach(function (k) { if (S.opts[k] == null) S.opts[k] = f.opts[k]; });
    if (S.view) { view.cx = S.view.cx; view.cy = S.view.cy; view.z = S.view.z; view.L = S.view.L || 1; }
    reindex(); rebuildDC();
  }
  var saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 250); }
  function saveNow(viewOnly) {
    S.view = { cx: view.cx, cy: view.cy, z: view.z, L: view.L };
    if (!viewOnly) S.saved = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { msg('Could not keep it in this browser (' + e.message + ') -- EXPORT now.', true); }
    if (!viewOnly) fileSoon();
  }
  var viewT = 0;
  function saveView() { clearTimeout(viewT); viewT = setTimeout(function () { saveNow(true); }, 400); }
  // undo: a paint stroke is its list of changes; anything else is the places, roads, terrains and underlays before and after
  function body() { return JSON.stringify({ terr: S.terr, sites: S.sites, paths: S.paths, under: S.under }); }
  function begin() { if (!OP) OP = { paint: [], b: body() }; }
  function rawSet(L, k, t) {
    var b = S.paint[L][k] || null; t = t || null; if (b === t) return b;
    VER++; if (t) S.paint[L][k] = t; else delete S.paint[L][k];
    if (L > 1 && !b && t) bump(L, k, 1); if (L > 1 && b && !t) bump(L, k, -1);
    return b;
  }
  function setPaint(L, k, t) { var b = S.paint[L][k] || null; if (b === (t || null)) return; rawSet(L, k, t); if (OP) OP.paint.push([L, k, b, t || null]); }
  function commit() {
    if (!OP) return;
    var a = body(), rec = { paint: OP.paint, b: OP.b !== a ? OP.b : null, a: OP.b !== a ? a : null }; OP = null;
    if (rec.paint.length || rec.b) { UNDO.push(rec); if (UNDO.length > 300) UNDO.shift(); REDO = []; save(); }
    panels(); draw();
  }
  function snap(j) { var o = JSON.parse(j); S.terr = o.terr; S.sites = o.sites; S.paths = o.paths; S.under = o.under; reindex(); }
  function undo() {
    var rec = UNDO.pop(); if (!rec) return msg('nothing to undo');
    for (var i = rec.paint.length - 1; i >= 0; i--) rawSet(rec.paint[i][0], rec.paint[i][1], rec.paint[i][2]);
    if (rec.b) snap(rec.b); REDO.push(rec); fixSel(); save(); panels(); draw();
  }
  function redo() {
    var rec = REDO.pop(); if (!rec) return msg('nothing to redo');
    rec.paint.forEach(function (c) { rawSet(c[0], c[1], c[3]); });
    if (rec.a) snap(rec.a); UNDO.push(rec); fixSel(); save(); panels(); draw();
  }
  function fixSel() { if (SEL.site && !SB[SEL.site]) SEL.site = null; if (SEL.path && !pathBy(SEL.path)) { SEL.path = null; SEL.vtx = -1; } }

  // the terrain a hex shows, and where it comes from
  function effAt(L, q, r) {
    for (var l = L; l >= 1; l--) { var t = S.paint[l][K(q, r)]; if (t) return { t: t, L: l, q: q, r: r }; if (l > 1) { var p = up(l, q, r); q = p[0]; r = p[1]; } }
    return null;
  }
  function terrAtMi(x, y) { var p = at(3, x, y), e = effAt(3, p[0], p[1]); return e ? e.t : null; }
  function pathBy(id) { for (var i = 0; i < S.paths.length; i++) if (S.paths[i].id === id) return S.paths[i]; return null; }
  function ptOf(p) { if (typeof p === 'string') { var s = SB[p]; return s ? [s.x, s.y] : null; } return p; }
  function ptsOf(P) { return P.pts.map(ptOf).filter(Boolean); }

  // ---------------------------------------------------------------- the view
  var cv = $('c'), ctx = cv.getContext('2d'), layer = document.createElement('canvas'), lctx = layer.getContext('2d');
  var Wd = 0, Ht = 0, DPR = 1, drawQ = 0;
  function resize() {
    var r = cv.parentNode.getBoundingClientRect(); DPR = window.devicePixelRatio || 1; Wd = r.width; Ht = r.height;
    cv.width = layer.width = Math.max(1, Math.round(Wd * DPR)); cv.height = layer.height = Math.max(1, Math.round(Ht * DPR)); LAYERKEY = ''; draw();
  }
  function toS(x, y) { return [(x - view.cx) * view.z + Wd / 2, (y - view.cy) * view.z + Ht / 2]; }
  function toM(sx, sy) { return [(sx - Wd / 2) / view.z + view.cx, (sy - Ht / 2) / view.z + view.cy]; }
  function hexPx(L) { return LV[L].w * view.z; }
  function autoLevel() {
    var L0 = view.L;
    while (view.L > 1 && hexPx(view.L) < 9) view.L--;
    while (view.L < 3 && hexPx(view.L) > 420) view.L++;
    if (view.L !== L0) { if (SEL.hex && SEL.hex.L !== view.L) SEL.hex = null; panels(); }
  }
  function zoomTo(z, cx, cy) { view.z = Math.max(ZMIN, Math.min(ZMAX, z)); if (cx != null) { view.cx = cx; view.cy = cy; } autoLevel(); draw(); saveView(); }
  function setLevel(L, focus) {
    var c = focus || (SEL.hex ? hc(SEL.hex.L, SEL.hex.q, SEL.hex.r) : [view.cx, view.cy]);
    view.L = L; view.z = Math.max(ZMIN, Math.min(ZMAX, LV[L].px / LV[L].w)); view.cx = c[0]; view.cy = c[1];
    if (SEL.hex && SEL.hex.L !== L) SEL.hex = null; panels(); draw(); saveView();
  }
  function into(h) { // a hex's own level, one finer, centred on it
    if (h.L >= 3) return;
    var c = hc(h.L, h.q, h.r); view.L = h.L + 1; view.z = 300 / LV[h.L].w; view.cx = c[0]; view.cy = c[1]; autoLevel();
    var p = at(view.L, c[0], c[1]); SEL.hex = { L: view.L, q: p[0], r: p[1] }; SEL.site = null; SEL.path = null; SEL.vtx = -1; panels(); draw(); saveView();
  }
  function outOf() {
    if (view.L <= 1) return;
    var c = [view.cx, view.cy];
    if (SEL.hex && SEL.hex.L > 1) { var p = up(SEL.hex.L, SEL.hex.q, SEL.hex.r); SEL.hex = { L: SEL.hex.L - 1, q: p[0], r: p[1] }; c = hc(SEL.hex.L, p[0], p[1]); }
    setLevel(view.L - 1, c);
  }

  function draw() { if (!drawQ) drawQ = requestAnimationFrame(drawNow); }
  function hexPath(c2, L, q, r, grow) {
    var c = hc(L, q, r), s = toS(c[0], c[1]), R = LV[L].w / SQ3 * view.z + (grow || 0);
    for (var i = 0; i < 6; i++) { var a = (30 + 60 * i) * Math.PI / 180, x = s[0] + R * Math.cos(a), y = s[1] + R * Math.sin(a); if (i) c2.lineTo(x, y); else c2.moveTo(x, y); }
    c2.closePath();
  }
  function onScreen(L, q, r) { var c = hc(L, q, r), s = toS(c[0], c[1]), rad = LV[L].w * view.z; return s[0] > -rad && s[0] < Wd + rad && s[1] > -rad && s[1] < Ht + rad; }
  function visit(L, fn) {
    var w = LV[L].w, h = w * SQ3 / 2, m0 = toM(0, 0), m1 = toM(Wd, Ht), pad = w;
    var r0 = Math.floor((m0[1] - pad) / h), r1 = Math.ceil((m1[1] + pad) / h);
    for (var r = r0; r <= r1; r++) { var q0 = Math.floor((m0[0] - pad) / w - r / 2), q1 = Math.ceil((m1[0] + pad) / w - r / 2); for (var q = q0; q <= q1; q++) fn(q, r); }
  }
  function drawUnder(u) {
    var rec = IMG[u.id]; if (!u.on || !rec || !rec.ok) return;
    var iw = rec.el.naturalWidth, ih = rec.el.naturalHeight, m0 = toM(0, 0), m1 = toM(Wd, Ht);
    var sx0 = Math.max(0, (m0[0] - u.x0) * u.pxmi), sy0 = Math.max(0, (m0[1] - u.y0) * u.pxmi);
    var sx1 = Math.min(iw, (m1[0] - u.x0) * u.pxmi), sy1 = Math.min(ih, (m1[1] - u.y0) * u.pxmi);
    if (sx1 <= sx0 || sy1 <= sy0) return;
    var a = toS(u.x0 + sx0 / u.pxmi, u.y0 + sy0 / u.pxmi), b = toS(u.x0 + sx1 / u.pxmi, u.y0 + sy1 / u.pxmi);
    ctx.globalAlpha = u.op; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; // (a painting traced, not pixels: v3 under a 330 ft hex is 47 px a pixel)
    ctx.drawImage(rec.el, sx0, sy0, sx1 - sx0, sy1 - sy0, a[0], a[1], b[0] - a[0], b[1] - a[1]); ctx.globalAlpha = 1;
  }
  function fills() {
    var key = [view.cx, view.cy, view.z, Wd, Ht, DPR, VER].join();
    if (key !== LAYERKEY) { LAYERKEY = key; fillLayer(); }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = S.opts.paintOp; ctx.drawImage(layer, 0, 0); ctx.restore();
  }
  function fillLayer() {
    lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, layer.width, layer.height); lctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var groups = {};
    var walk = function (L, q, r, inh) {
      var k = K(q, r), t = S.paint[L][k] || inh;
      if (L < 3 && DC[L].get(k) && hexPx(L + 1) >= 2.5) {
        var n = LV[L + 1].n, ch = kids(n);
        for (var i = 0; i < ch.length; i++) { var cq = n * q + ch[i][0], cr = n * r + ch[i][1]; if (onScreen(L + 1, cq, cr)) walk(L + 1, cq, cr, t); }
      } else if (t) (groups[t] = groups[t] || []).push([L, q, r]);
    };
    visit(1, function (q, r) { walk(1, q, r, null); });
    Object.keys(groups).forEach(function (t) {
      var c = TB[t] ? TB[t].color : '#ff00ff'; lctx.fillStyle = c; lctx.strokeStyle = c; lctx.lineWidth = 1; lctx.beginPath();
      groups[t].forEach(function (h) { hexPath(lctx, h[0], h[1], h[2]); }); lctx.fill(); lctx.stroke();
    });
  }
  function corner(s, R, deg) { var a = deg * Math.PI / 180; return [s[0] + R * Math.cos(a), s[1] + R * Math.sin(a)]; }
  function gridLines() {
    var A = view.L; if (!S.opts.grid || hexPx(A) < 6) return;
    var thin = new Path2D(), mid = new Path2D(), thick = new Path2D(), R = LV[A].w / SQ3 * view.z;
    visit(A, function (q, r) {
      var c = hc(A, q, r), s = toS(c[0], c[1]);
      var p1 = A > 1 ? up(A, q, r) : null, p0 = A > 2 ? up(2, p1[0], p1[1]) : null;
      for (var d = 0; d < 3; d++) {
        var nq = q + DIRS[d][0], nr = r + DIRS[d][1], a = corner(s, R, DANG[d] - 30), b = corner(s, R, DANG[d] + 30), into = thin;
        if (A > 1) {
          var n1 = up(A, nq, nr);
          if (n1[0] !== p1[0] || n1[1] !== p1[1]) {
            into = mid;
            if (A > 2) { var n0 = up(2, n1[0], n1[1]); if (n0[0] !== p0[0] || n0[1] !== p0[1]) into = thick; }
          }
        }
        into.moveTo(a[0], a[1]); into.lineTo(b[0], b[1]);
      }
    });
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,246,226,.30)'; ctx.lineWidth = A === 1 ? 1.1 : 0.8; ctx.stroke(thin);
    ctx.strokeStyle = 'rgba(28,14,4,.80)'; ctx.lineWidth = A === 2 ? 2.2 : 1.6; ctx.stroke(mid);
    ctx.strokeStyle = 'rgba(28,14,4,.95)'; ctx.lineWidth = 3.2; ctx.stroke(thick);
    ctx.lineCap = 'butt';
  }
  var PSTYLE = { road: { c: 'rgba(110,32,16,.95)', w: 4, d: [14, 8] }, track: { c: 'rgba(110,32,16,.9)', w: 2.5, d: [7, 6] }, river: { c: '#4fa3c4', w: 3.5, d: [] } };
  function paths() {
    S.paths.forEach(function (P) {
      var pts = ptsOf(P); if (pts.length < 2) return;
      var st = PSTYLE[P.kind] || PSTYLE.road, sel = SEL.path === P.id;
      ctx.beginPath(); pts.forEach(function (p, i) { var s = toS(p[0], p[1]); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); });
      if (sel) { ctx.setLineDash([]); ctx.strokeStyle = 'rgba(255,214,60,.45)'; ctx.lineWidth = st.w + 8; ctx.lineJoin = 'round'; ctx.stroke(); }
      ctx.setLineDash(st.d); ctx.strokeStyle = st.c; ctx.lineWidth = st.w; ctx.lineJoin = 'round'; ctx.stroke(); ctx.setLineDash([]);
      if (sel) P.pts.forEach(function (p, i) {
        var q = ptOf(p); if (!q) return; var s = toS(q[0], q[1]);
        ctx.fillStyle = i === SEL.vtx ? '#ffd23c' : (typeof p === 'string' ? '#7ad37a' : '#f6e9c5'); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2;
        ctx.beginPath(); if (typeof p === 'string') ctx.arc(s[0], s[1], 6, 0, 7); else ctx.rect(s[0] - 4, s[1] - 4, 8, 8); ctx.fill(); ctx.stroke();
      });
    });
  }
  function glyph(s, kind, on) {
    var x = s[0], y = s[1];
    ctx.lineWidth = 2; ctx.strokeStyle = on ? '#ffd23c' : '#2a180a'; ctx.fillStyle = '#efe0b8'; ctx.beginPath();
    if (kind === 'city') ctx.rect(x - 7, y - 7, 14, 14);
    else if (kind === 'castle') { ctx.moveTo(x, y - 9); ctx.lineTo(x + 8, y + 6); ctx.lineTo(x - 8, y + 6); ctx.closePath(); }
    else if (kind === 'inn') ctx.rect(x - 5, y - 5, 10, 10);
    else if (kind === 'cave') { ctx.arc(x, y + 3, 7, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#2a180a'; }
    else if (kind === 'junction') { ctx.moveTo(x, y - 6); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 6, y); ctx.closePath(); }
    else if (kind === 'seat') { ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y + 5); ctx.lineTo(x - 7, y + 5); ctx.closePath(); ctx.fillStyle = '#b5452a'; }
    else if (kind === 'mark') { ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6); ctx.moveTo(x + 6, y - 6); ctx.lineTo(x - 6, y + 6); ctx.stroke(); return; }
    else ctx.arc(x, y, kind === 'hamlet' ? 4 : 6, 0, 7);
    ctx.fill(); ctx.stroke();
  }
  function sites() {
    S.sites.forEach(function (st) {
      var s = toS(st.x, st.y); if (s[0] < -200 || s[0] > Wd + 200 || s[1] < -40 || s[1] > Ht + 40) return;
      glyph(s, st.kind, SEL.site === st.id);
      if (!S.opts.labels) return;
      var big = st.kind === 'city' || st.kind === 'castle';
      if ((st.kind === 'junction' || st.kind === 'mark' || st.kind === 'cave' || st.kind === 'hamlet') && view.z < 24 && SEL.site !== st.id) return; // (the small ones' names when zoomed in)
      ctx.font = (big ? 'italic bold 16px' : 'italic 13px') + ' Georgia, serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(30,16,6,.85)'; ctx.fillStyle = '#f6e9c5';
      ctx.strokeText(st.name, s[0] + 11, s[1] + 5); ctx.fillText(st.name, s[0] + 11, s[1] + 5);
    });
  }
  function brushHexes(L, h) { var out = [], R = S.opts.brush; for (var dq = -R; dq <= R; dq++) for (var dr = -R; dr <= R; dr++) if (Math.abs(dq + dr) <= R) out.push([h[0] + dq, h[1] + dr]); return out; }
  function marks() {
    if (SEL.hex) { ctx.beginPath(); hexPath(ctx, SEL.hex.L, SEL.hex.q, SEL.hex.r); ctx.strokeStyle = '#ffd23c'; ctx.lineWidth = 3; ctx.stroke(); }
    if (HOV && (S.opts.tool === 'paint' || S.opts.tool === 'erase' || S.opts.tool === 'select') && hexPx(view.L) >= 4) {
      var hh = at(view.L, HOV[0], HOV[1]), list = S.opts.tool === 'select' ? [hh] : brushHexes(view.L, hh);
      ctx.beginPath(); list.forEach(function (h) { hexPath(ctx, view.L, h[0], h[1]); });
      ctx.strokeStyle = S.opts.tool === 'erase' ? 'rgba(255,90,80,.9)' : 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    var mp = M.pts.concat(M.live && !M.done ? [M.live] : []);
    if (mp.length) {
      ctx.strokeStyle = '#ff5ad2'; ctx.fillStyle = '#ff5ad2'; ctx.lineWidth = 2.5; ctx.beginPath();
      mp.forEach(function (p, i) { var s = toS(p[0], p[1]); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke();
      mp.forEach(function (p) { var s = toS(p[0], p[1]); ctx.beginPath(); ctx.arc(s[0], s[1], 3.5, 0, 7); ctx.fill(); });
      if (mp.length > 1) {
        var last = toS(mp[mp.length - 1][0], mp[mp.length - 1][1]), m = measure(mp);
        ctx.font = 'bold 13px ui-monospace, Consolas, monospace'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.fillStyle = '#ffd6f4';
        var t = m.mi.toFixed(1) + ' mi · foot ' + (m.go / S.pace.foot).toFixed(1) + ' d'; ctx.strokeText(t, last[0] + 10, last[1] - 10); ctx.fillText(t, last[0] + 10, last[1] - 10);
      }
    }
    if (DRAW && DRAW.pts.length) {
      var dp = DRAW.pts.map(ptOf).filter(Boolean).concat(HOV ? [HOV] : []);
      ctx.setLineDash([6, 5]); ctx.strokeStyle = '#ffd23c'; ctx.lineWidth = 2; ctx.beginPath();
      dp.forEach(function (p, i) { var s = toS(p[0], p[1]); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  function scaleBar() {
    var want = 140 / view.z, steps = [1 / 64, 1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 5, 10, 20, 50], len = steps[0];
    steps.forEach(function (s) { if (s <= want) len = s; });
    var px = len * view.z, x = Wd - px - 18, y = Ht - 18;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x - 6, y - 18, px + 12, 24);
    ctx.strokeStyle = '#f6e9c5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y); ctx.lineTo(x + px, y); ctx.lineTo(x + px, y - 4); ctx.stroke();
    ctx.font = '12px ui-monospace, Consolas, monospace'; ctx.fillStyle = '#f6e9c5'; ctx.textAlign = 'center';
    ctx.fillText(len >= 1 ? len + ' mi' : Math.round(len * 5280) + ' ft', x + px / 2, y - 6); ctx.textAlign = 'start';
  }
  function drawNow() {
    drawQ = 0;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = '#24211d'; ctx.fillRect(0, 0, Wd, Ht);
    S.under.forEach(drawUnder);
    fills(); gridLines(); paths(); sites(); marks(); scaleBar();
    $('lvl').innerHTML = '<b>LEVEL ' + view.L + '</b> · ' + esc(LV[view.L].long);
  }

  // ---------------------------------------------------------------- hit tests
  function hitSite(sx, sy) { for (var i = S.sites.length - 1; i >= 0; i--) { var s = toS(S.sites[i].x, S.sites[i].y); if (Math.hypot(s[0] - sx, s[1] - sy) <= 10) return S.sites[i]; } return null; }
  function hitVtx(P, sx, sy) { for (var i = P.pts.length - 1; i >= 0; i--) { var q = ptOf(P.pts[i]); if (!q) continue; var s = toS(q[0], q[1]); if (Math.hypot(s[0] - sx, s[1] - sy) <= 8) return i; } return -1; }
  function segD(p, a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0; return [Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy), t]; }
  function hitSeg(P, sx, sy) { // the segment under the cursor: [index of its first point, distance px]
    var best = null;
    for (var i = 0; i + 1 < P.pts.length; i++) {
      var a = ptOf(P.pts[i]), b = ptOf(P.pts[i + 1]); if (!a || !b) continue;
      var d = segD([sx, sy], toS(a[0], a[1]), toS(b[0], b[1]))[0]; if (d <= 7 && (!best || d < best[1])) best = [i, d];
    }
    return best;
  }
  function hitPath(sx, sy) { for (var i = S.paths.length - 1; i >= 0; i--) { var h = hitSeg(S.paths[i], sx, sy); if (h) return S.paths[i]; } return null; }

  // ---------------------------------------------------------------- the measure (Book III's going: each terrain's cost; a road or track counts 1)
  function onRoad(x, y) {
    for (var i = 0; i < S.paths.length; i++) {
      var P = S.paths[i]; if (P.kind === 'river') continue; var pts = ptsOf(P);
      for (var j = 0; j + 1 < pts.length; j++) if (segD([x, y], pts[j], pts[j + 1])[0] < 0.25) return true;
    }
    return false;
  }
  function measure(pts) {
    var mi = 0, go = 0, wet = false, road = 0;
    for (var i = 0; i + 1 < pts.length; i++) {
      var a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(len / 0.05)), seg = len / n;
      for (var j = 0; j < n; j++) {
        var t = (j + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, cost;
        if (onRoad(x, y)) { cost = 1; road += seg; } else { var k = terrAtMi(x, y), T = k && TB[k]; cost = T ? +T.cost : 1; if (!cost) { wet = true; cost = 1; } }
        go += seg * cost; mi += seg;
      }
    }
    return { mi: mi, go: go, wet: wet, road: road };
  }
  function measureText() {
    var mp = M.pts.concat(M.live && !M.done ? [M.live] : []);
    if (mp.length < 2) return 'M, then click along a way (double-click ends; Esc clears)';
    var m = measure(mp), f = +S.pace.foot || 24, c = +S.pace.cart || 17;
    return m.mi.toFixed(1) + ' mi (' + m.road.toFixed(1) + ' on a road) · ' + m.go.toFixed(1) + ' mi of going\n' +
      'on foot ' + (m.go / f).toFixed(2) + ' days at ' + f + '/day\nby cart ' + (m.mi / c).toFixed(2) + ' days at ' + c + '/day (if it is all road)' +
      (m.wet ? '\nit crosses water or the impassable (counted as plain)' : '') +
      '\n(going: each mile times its terrain’s cost; on a road or track 1)';
  }

  // ---------------------------------------------------------------- the mouse
  var HOV = null, drag = null, space = false;
  function evPt(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function paintAt(m) {
    if (hexPx(view.L) < 4) return msg('zoom in to paint level ' + view.L);
    var t = S.opts.tool === 'erase' ? null : S.opts.terr, h = at(view.L, m[0], m[1]);
    brushHexes(view.L, h).forEach(function (b) { setPaint(view.L, K(b[0], b[1]), t); });
  }
  function strokeTo(m) { // between two mouse points, every hex the brush crosses
    var a = drag.last, d = Math.hypot(m[0] - a[0], m[1] - a[1]), st = LV[view.L].w / 3, n = Math.max(1, Math.ceil(d / st));
    for (var i = 1; i <= n; i++) paintAt([a[0] + (m[0] - a[0]) * i / n, a[1] + (m[1] - a[1]) * i / n]);
    drag.last = m;
  }
  function snapSite(sx, sy, not) { for (var i = 0; i < S.sites.length; i++) { var st = S.sites[i]; if (st.id === not) continue; var s = toS(st.x, st.y); if (Math.hypot(s[0] - sx, s[1] - sy) <= 12) return st; } return null; }
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  cv.addEventListener('mousedown', function (e) {
    var p = evPt(e), m = toM(p[0], p[1]), tool = S.opts.tool;
    if (e.button === 1 || e.button === 2 || space) { drag = { kind: 'pan', p: p, c: [view.cx, view.cy] }; e.preventDefault(); return; }
    if (e.button !== 0) return;
    if (DRAW) { // a new road or river: each click a point, on a place it binds
      var hs = snapSite(p[0], p[1]); DRAW.pts.push(hs ? hs.id : m); draw(); return;
    }
    if (tool === 'paint' || tool === 'erase') { begin(); drag = { kind: 'paint', last: m }; paintAt(m); draw(); return; }
    if (tool === 'measure') { if (M.done) { M.pts = []; M.done = false; } M.pts.push(m); panelsMeasure(); draw(); return; }
    if (tool === 'under') { var u = underSel(); if (u) { begin(); drag = { kind: 'under', u: u, p: p, o: [u.x0, u.y0] }; } return; }
    if (tool === 'places' || tool === 'roads') {
      var P = SEL.path && tool === 'roads' ? pathBy(SEL.path) : null;
      if (P) {
        var vi = hitVtx(P, p[0], p[1]);
        if (vi >= 0) {
          SEL.vtx = vi; begin();
          if (typeof P.pts[vi] === 'string') { var bs = SB[P.pts[vi]]; drag = { kind: 'site', s: bs, p: p, o: [bs.x, bs.y] }; }
          else drag = { kind: 'vtx', P: P, i: vi, p: p, o: P.pts[vi].slice() };
          panels(); draw(); return;
        }
      }
      var st = hitSite(p[0], p[1]);
      if (st) { SEL.site = st.id; if (tool === 'places') { SEL.path = null; SEL.vtx = -1; } begin(); drag = { kind: 'site', s: st, p: p, o: [st.x, st.y] }; panels(); draw(); return; }
      if (P) { var sg = hitSeg(P, p[0], p[1]); if (sg) { begin(); P.pts.splice(sg[0] + 1, 0, m); SEL.vtx = sg[0] + 1; drag = { kind: 'vtx', P: P, i: sg[0] + 1, p: p, o: m.slice() }; panels(); draw(); return; } }
      if (tool === 'roads') { var hp = hitPath(p[0], p[1]); if (hp) { SEL.path = hp.id; SEL.vtx = -1; SEL.site = null; panels(); draw(); return; } }
    }
    if (tool === 'select') { var ss = hitSite(p[0], p[1]); if (ss) { SEL.site = ss.id; SEL.path = null; SEL.hex = null; panels(); draw(); return; } }
    drag = { kind: 'click', p: p, c: [view.cx, view.cy], m: m }; // a click, or a pan once it moves
  });
  window.addEventListener('mousemove', function (e) {
    var p = evPt(e), m = toM(p[0], p[1]); HOV = (p[0] >= 0 && p[1] >= 0 && p[0] <= Wd && p[1] <= Ht) ? m : null;
    if (M.pts.length && !M.done) { M.live = m; panelsMeasure(); }
    status(m);
    if (!drag) { if (HOV) draw(); return; }
    if (drag.kind === 'click' && Math.hypot(p[0] - drag.p[0], p[1] - drag.p[1]) > 4) drag.kind = 'pan';
    if (drag.kind === 'pan') { view.cx = drag.c[0] - (p[0] - drag.p[0]) / view.z; view.cy = drag.c[1] - (p[1] - drag.p[1]) / view.z; }
    else if (drag.kind === 'paint') strokeTo(m);
    else if (drag.kind === 'site') { drag.s.x = drag.o[0] + (p[0] - drag.p[0]) / view.z; drag.s.y = drag.o[1] + (p[1] - drag.p[1]) / view.z; }
    else if (drag.kind === 'vtx') drag.P.pts[drag.i] = [drag.o[0] + (p[0] - drag.p[0]) / view.z, drag.o[1] + (p[1] - drag.p[1]) / view.z];
    else if (drag.kind === 'under') { drag.u.x0 = drag.o[0] + (p[0] - drag.p[0]) / view.z; drag.u.y0 = drag.o[1] + (p[1] - drag.p[1]) / view.z; }
    draw();
  });
  window.addEventListener('mouseup', function (e) {
    if (!drag) return;
    var d = drag; drag = null; var p = evPt(e);
    if (d.kind === 'click') {
      var tool = S.opts.tool;
      if (tool === 'select') { var h = at(view.L, d.m[0], d.m[1]); SEL.hex = { L: view.L, q: h[0], r: h[1] }; SEL.site = null; SEL.path = null; }
      else if (tool === 'places') { SEL.site = null; }
      else if (tool === 'roads') { SEL.path = null; SEL.vtx = -1; SEL.site = null; }
      panels(); draw(); return;
    }
    if (d.kind === 'pan') { saveView(); return; }
    if (d.kind === 'vtx') { var s = snapSite(p[0], p[1]); if (s) d.P.pts[d.i] = s.id; } // (dropped on a place, the point binds to it)
    commit();
  });
  cv.addEventListener('dblclick', function (e) {
    var p = evPt(e), m = toM(p[0], p[1]), tool = S.opts.tool;
    if (DRAW) return endDraw();
    if (tool === 'measure') { M.pts.pop(); M.done = true; M.live = null; panelsMeasure(); draw(); return; }
    if (tool === 'places' && !hitSite(p[0], p[1])) {
      begin(); var st = { id: 's' + Date.now().toString(36), name: 'a new place', kind: 'town', x: m[0], y: m[1], note: '' };
      S.sites.push(st); reindex(); SEL.site = st.id; commit(); var nm = $('ed-name'); if (nm) { nm.focus(); nm.select(); } return;
    }
    if (tool === 'select') { var h = at(view.L, m[0], m[1]); into({ L: view.L, q: h[0], r: h[1] }); }
  });
  cv.addEventListener('wheel', function (e) {
    e.preventDefault();
    var p = evPt(e), m = toM(p[0], p[1]); view.z = Math.max(ZMIN, Math.min(ZMAX, view.z * Math.exp(-e.deltaY * 0.0015)));
    var m2 = toM(p[0], p[1]); view.cx += m[0] - m2[0]; view.cy += m[1] - m2[1]; autoLevel(); draw(); saveView();
  }, { passive: false });
  window.addEventListener('keydown', function (e) {
    var tag = e.target && e.target.tagName; if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    var k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); return e.shiftKey ? redo() : undo(); }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); return redo(); }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (k === ' ') { space = true; e.preventDefault(); return; }
    if (k === '1' || k === '2' || k === '3') return setLevel(+k);
    var T = { s: 'select', b: 'paint', e: 'erase', c: 'places', r: 'roads', m: 'measure', u: 'under' };
    if (T[k]) return setTool(T[k]);
    if (k === '[') { S.opts.brush = Math.max(0, S.opts.brush - 1); panels(); draw(); return; }
    if (k === ']') { S.opts.brush = Math.min(3, S.opts.brush + 1); panels(); draw(); return; }
    if (k === 'backspace') { e.preventDefault(); return outOf(); }
    if (k === 'enter') { if (DRAW) return endDraw(); if (M.pts.length) { M.done = true; M.live = null; panelsMeasure(); draw(); } return; }
    if (k === 'escape') { if (DRAW) { DRAW = null; msg('the new way dropped'); draw(); return; } if (M.pts.length) { M.pts = []; M.live = null; M.done = false; panelsMeasure(); draw(); return; } SEL.hex = null; SEL.site = null; SEL.path = null; SEL.vtx = -1; panels(); draw(); return; }
    if (k === 'delete') return delSel();
  });
  window.addEventListener('keyup', function (e) { if (e.key === ' ') space = false; });

  function delSel() {
    if (SEL.path && SEL.vtx >= 0) { var P = pathBy(SEL.path); if (P && P.pts.length > 2) { begin(); P.pts.splice(SEL.vtx, 1); SEL.vtx = -1; commit(); } else msg('a way keeps two points at least (delete the way in the panel)'); return; }
    if (SEL.site) return delSite(SEL.site);
  }
  function delSite(id) {
    var st = SB[id]; if (!st) return; begin();
    S.paths.forEach(function (P) { P.pts = P.pts.map(function (q) { return q === id ? [st.x, st.y] : q; }); }); // (its roads keep the point where it stood)
    S.sites = S.sites.filter(function (s) { return s.id !== id; }); reindex(); SEL.site = null; commit();
  }
  function endDraw() {
    var d = DRAW; DRAW = null; if (!d) return;
    var same = function (a, b) { return typeof a === 'string' || typeof b === 'string' ? a === b : Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6; };
    var pts = d.pts.filter(function (p, i) { return !i || !same(p, d.pts[i - 1]); }); // (a double-click's two clicks land one point twice)
    if (pts.length < 2) { msg('a way needs two points'); draw(); return; }
    begin();
    if (d.keep && pathBy(d.keep)) { pathBy(d.keep).pts = pts; SEL.path = d.keep; }
    else { var P = { id: 'p' + Date.now().toString(36), name: d.kind === 'river' ? 'a new river' : 'a new road', kind: d.kind, pts: pts }; S.paths.push(P); SEL.path = P.id; }
    SEL.vtx = -1; commit(); setTool('roads');
  }
  function setTool(t) { // (a tool keeps only its own kind of selection)
    S.opts.tool = t; if (t !== 'measure') M.live = null;
    if (t !== 'select') SEL.hex = null; if (t !== 'roads') { SEL.path = null; SEL.vtx = -1; } if (t !== 'places' && t !== 'roads' && t !== 'select') SEL.site = null;
    panels(); draw(); save();
  }
  function underSel() { var u = S.under.filter(function (x) { return x.id === S.opts.uSel; })[0]; return u || null; }

  // ---------------------------------------------------------------- guess a level from corridor v3 (rough: he fixes it by hand)
  var REF = {
    sea: [0x2b6d75, 0x27616a, 0x35777f, 0x3d8289, 0x245a63, 0x2f6f78],
    land: [0xc9a468, 0xd2b075, 0xc39a5e, 0xb98f52, 0xd9b97f, 0xa8803f, 0xe0c48c, 0xa67a3e, 0xb8925a, 0x9a8a50],
    bog: [0x556b3a, 0x6f7a45, 0x8a864f],
    black: [0x241f26, 0x5b4e5d, 0x2c2630, 0x66576a, 0x3a3340],
    brown: [0x5a4a38, 0x4f4438, 0x3e352c, 0x35302c, 0x6a5844],
    ink: [0xf6e9c5, 0xe9d9ae, 0xffe9b8, 0xf2e0b2, 0x2a180a, 0x321c0c, 0x5a1e0f, 0x3b2412, 0x5aa9c0, 0x1e1a2e, 0xa83232, 0x8a8fa8, 0xbfe0d8]
  };
  var REFL = []; Object.keys(REF).forEach(function (c) { REF[c].forEach(function (v) { REFL.push([c, v >> 16, (v >> 8) & 255, v & 255]); }); });
  function inPoly(x, y, P) { var o = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) o = !o; } return o; }
  var LAKE = [[1502, 790], [1546, 776], [1586, 800], [1578, 838], [1536, 852], [1498, 828]], RIFT = [[300, 1290], [420, 1270], [560, 1300], [520, 1340], [360, 1350]];
  function classify(D, cx, cy, rad, L) {
    var cnt = { sea: 0, land: 0, bog: 0, black: 0, brown: 0 }, tot = 0, g = L === 1 ? 7 : 5;
    for (var i = 0; i < g; i++) for (var j = 0; j < g; j++) {
      var x = Math.round(cx + rad * (2 * (i + 0.5) / g - 1)), y = Math.round(cy + rad * (2 * (j + 0.5) / g - 1));
      if (x < 0 || y < 0 || x >= D.width || y >= D.height) continue;
      if (x >= 40 && x <= 940 && y >= 40 && y <= 256) continue; // (v3's title box)
      var o = (y * D.width + x) * 4, R = D.data[o], G = D.data[o + 1], B = D.data[o + 2], best = null, bd = 1e9;
      for (var k = 0; k < REFL.length; k++) { var f = REFL[k], dd = (R - f[1]) * (R - f[1]) + (G - f[2]) * (G - f[2]) + (B - f[3]) * (B - f[3]); if (dd < bd) { bd = dd; best = f[0]; } }
      if (best === 'ink') continue; cnt[best]++; tot++;
    }
    if (!tot) return null;
    if (cnt.sea / tot > 0.5) return inPoly(cx, cy, LAKE) ? 'lake' : 'sea';
    if (cnt.black / tot > 0.2) return 'black';
    if (cnt.brown / tot > 0.2) return cx < 1000 ? 'coastal' : 'gray';
    if (cnt.bog / tot > 0.25) return 'bog';
    if (inPoly(cx, cy, RIFT)) return 'rift';
    if (Math.pow((cx - 920) / 420, 2) + Math.pow((cy - 800) / 250, 2) <= 1) return 'hills'; // (v3's gnoll pocket, its hatching drawn in this ellipse)
    if (cx > 1700 && cy > 600) return 'verge'; // (v3's plains grass east)
    if (cx > 1620 && cx < 2150 && cy > 330 && cy < 470) return 'farms'; // (v3's farms east of Silverton)
    return 'plains';
  }
  function guess() {
    var L = view.L, u = S.under.filter(function (x) { return x.id === 'corridor'; })[0], rec = IMG.corridor;
    if (L === 3) return msg('v3 is too coarse for level 3 (a 330 ft hex is a pixel and a half of it): paint level 3 by hand.', true);
    if (!u || !rec || !rec.ok) return msg('the corridor v3 underlay is not loaded', true);
    if (!rec.data) {
      var c = document.createElement('canvas'); c.width = rec.el.naturalWidth; c.height = rec.el.naturalHeight; var g = c.getContext('2d'); g.drawImage(rec.el, 0, 0);
      try { rec.data = g.getImageData(0, 0, c.width, c.height); } catch (e) { return msg('this browser will not let the page read the picture (' + e.message + ')', true); }
    }
    var D = rec.data, w = LV[L].w, h = w * SQ3 / 2, x1 = u.x0 + D.width / u.pxmi, y1 = u.y0 + D.height / u.pxmi, n = 0, skip = 0;
    begin();
    for (var r = Math.floor(u.y0 / h); r <= Math.ceil(y1 / h); r++) for (var q = Math.floor(u.x0 / w - r / 2) - 1; q <= Math.ceil(x1 / w - r / 2) + 1; q++) {
      var cc = hc(L, q, r), px = (cc[0] - u.x0) * u.pxmi, py = (cc[1] - u.y0) * u.pxmi;
      if (px < 0 || py < 0 || px >= D.width || py >= D.height) continue;
      var k = K(q, r); if (S.paint[L][k]) { skip++; continue; } // (his own paint at this level stays)
      var t = classify(D, px, py, w * u.pxmi * 0.42, L); if (!t) continue;
      if (L > 1) { var pp = up(L, q, r), e = effAt(L - 1, pp[0], pp[1]); if (e && e.t === t) continue; }
      setPaint(L, k, t); n++;
    }
    commit(); msg(n + ' hexes guessed at level ' + L + (skip ? ' (' + skip + ' of yours kept)' : '') + '. It is a guess from the picture: fix it by hand, or undo.');
  }

  // ---------------------------------------------------------------- underlay pictures (served from TarlynsPit/map by the they-live preview; from the
  // dragonsleep preview, :8923, the they-live one is asked for them -- shown, but the guess cannot read a picture from another address)
  function loadUnder(u) {
    if (IMG[u.id]) return;
    var rec = IMG[u.id] = { ok: false, trying: true, el: new Image() }, i = 0;
    var bases = ['/TarlynsPit/map/', '../../TarlynsPit/map/', '../../../../../TarlynsPit/map/', 'http://localhost:8931/TarlynsPit/map/', 'http://localhost:8932/TarlynsPit/map/'];
    var next = function () { if (i >= bases.length) { rec.trying = false; rec.fail = true; panels(); return; } rec.el.src = bases[i++] + u.file; };
    rec.el.onload = function () { rec.ok = true; rec.trying = false; rec.fail = false; panels(); draw(); };
    rec.el.onerror = next; next();
  }
  var pickFor = null;
  $('imgfile').onchange = function () {
    var f = this.files[0]; if (!f || !pickFor) return; var rec = IMG[pickFor] = { ok: false, el: new Image() };
    rec.el.onload = function () { rec.ok = true; panels(); draw(); }; rec.el.src = URL.createObjectURL(f); this.value = '';
  };

  // ---------------------------------------------------------------- the side panel
  function msg(t, warn) { $('msg').innerHTML = warn ? '<b class="warn">' + esc(t) + '</b>' : esc(t); }
  function status(m) {
    var L = view.L, h = at(L, m[0], m[1]), e = effAt(L, h[0], h[1]);
    $('status').textContent = 'level ' + L + ' hex (' + col(h[0], h[1]) + ', ' + h[1] + ') · ' + (e ? (TB[e.t] ? TB[e.t].name : e.t) + (e.L !== L ? ' (from level ' + e.L + ')' : '') : 'unpainted') +
      '\n' + m[0].toFixed(2) + ' mi east, ' + m[1].toFixed(2) + ' mi south of v3’s corner';
  }
  function btn(label, on, fn, title) { var b = document.createElement('button'); b.textContent = label; if (on) b.className = 'on'; if (title) b.title = title; b.onclick = fn; return b; }
  function panels() {
    var lv = $('levels'); lv.innerHTML = '';
    [1, 2, 3].forEach(function (L) { lv.appendChild(btn(L + ' · ' + LV[L].name, view.L === L, function () { setLevel(L); })); });
    $('lvlnote').textContent = LV[view.L].long + (hexPx(view.L) < 4 ? ' -- zoom in to paint' : '');
    var tl = $('tools'); tl.innerHTML = '';
    [['select', 'S select'], ['paint', 'B paint'], ['erase', 'E erase'], ['places', 'C places'], ['roads', 'R roads'], ['measure', 'M measure'], ['under', 'U underlay']].forEach(function (t) {
      tl.appendChild(btn(t[1], S.opts.tool === t[0], function () { setTool(t[0]); }));
    });
    var br = $('brushes'); br.innerHTML = '';
    [0, 1, 2, 3].forEach(function (R) { br.appendChild(btn(String(1 + 3 * R * (R + 1)), S.opts.brush === R, function () { S.opts.brush = R; panels(); draw(); save(); }, 'hexes in the brush')); });
    $('brushrow').style.display = S.opts.tool === 'paint' || S.opts.tool === 'erase' ? '' : 'none';
    terrPanel(); infoPanel(); listPanels(); panelsMeasure(); underPanel();
    $('pfoot').value = S.pace.foot; $('pcart').value = S.pace.cart; $('paintop').value = S.opts.paintOp; $('gridon').checked = !!S.opts.grid; $('labon').checked = !!S.opts.labels;
  }
  function used(k) { var n = 0; [1, 2, 3].forEach(function (L) { for (var x in S.paint[L]) if (S.paint[L][x] === k) n++; }); return n; }
  function terrPanel() {
    var box = $('terrs'); box.innerHTML = '';
    S.terr.forEach(function (t) {
      var d = document.createElement('div'); d.className = 'sw' + (S.opts.terr === t.k ? ' on' : '');
      d.innerHTML = '<i style="background:' + esc(t.color) + '"></i>' + esc(t.name) + '<small>' + (+t.cost ? '×' + t.cost : '—') + '</small>';
      d.title = t.name + ' -- going ' + (+t.cost ? 'x' + t.cost : 'none: no one walks it') + '. Click to paint with it; with a hex selected, it sets that hex.';
      d.onclick = function () {
        S.opts.terr = t.k;
        if (SEL.hex && S.opts.tool === 'select') { begin(); setPaint(SEL.hex.L, K(SEL.hex.q, SEL.hex.r), t.k); commit(); }
        else if (S.opts.tool !== 'paint') setTool('paint');
        panels(); save();
      };
      d.ondblclick = function () { S.opts.terr = t.k; EDT = t.k; panels(); };
      box.appendChild(d);
    });
    if (EDT && TB[EDT]) {
      var t = TB[EDT], ed = document.createElement('div'); ed.className = 'box'; ed.style.gridColumn = '1 / 3';
      ed.innerHTML = '<div class="row"><input type="text" id="te-name"></div><div class="row"><input type="color" id="te-color"><span class="dim">going ×</span><input type="number" id="te-cost" min="0" step="1"><span class="dim">(0: no one walks it)</span></div>' +
        '<div class="row"><button id="te-del">delete</button><button id="te-done">done</button><span class="dim" id="te-used"></span></div>';
      box.appendChild(ed);
      $('te-name').value = t.name; $('te-color').value = t.color; $('te-cost').value = t.cost; $('te-used').textContent = used(t.k) + ' hexes painted with it';
      var edit = function (f) { return function () { begin(); f(this.value); commit(); }; };
      $('te-name').onchange = edit(function (v) { t.name = v; }); $('te-cost').onchange = edit(function (v) { t.cost = Math.max(0, +v || 0); });
      $('te-color').oninput = function () { begin(); t.color = this.value; VER++; draw(); }; $('te-color').onchange = function () { t.color = this.value; VER++; commit(); };
      $('te-done').onclick = function () { EDT = null; panels(); };
      $('te-del').onclick = function () {
        var n = used(t.k); if (n) return msg(n + ' hexes are painted ' + t.name + ': repaint them first (or keep it)', true);
        begin(); S.terr = S.terr.filter(function (x) { return x.k !== t.k; }); reindex(); EDT = null; commit();
      };
    }
  }
  var EDT = null;
  function infoPanel() {
    var info = $('info'), ed = $('edit'); ed.innerHTML = '';
    if (SEL.site && SB[SEL.site]) {
      var st = SB[SEL.site];
      info.textContent = st.kind + ' · ' + st.x.toFixed(2) + ', ' + st.y.toFixed(2) + ' mi' + (st.note ? '\n' + st.note : '');
      ed.innerHTML = '<div class="row"><input type="text" id="ed-name"></div><div class="row"><select id="ed-kind"></select><button id="ed-del">delete</button><button id="ed-go">centre</button></div>' +
        '<div class="row"><input type="text" id="ed-note" placeholder="a note"></div>';
      $('ed-name').value = st.name; $('ed-note').value = st.note || '';
      KINDS.forEach(function (k) { var o = document.createElement('option'); o.value = o.textContent = k; if (k === st.kind) o.selected = true; $('ed-kind').appendChild(o); });
      $('ed-name').oninput = function () { st.name = this.value; draw(); }; $('ed-name').onfocus = begin; $('ed-name').onchange = commit;
      $('ed-note').onfocus = begin; $('ed-note').onchange = function () { st.note = this.value; commit(); };
      $('ed-kind').onchange = function () { begin(); st.kind = this.value; commit(); };
      $('ed-del').onclick = function () { delSite(st.id); };
      $('ed-go').onclick = function () { zoomTo(view.z, st.x, st.y); };
      return;
    }
    if (SEL.path && pathBy(SEL.path)) {
      var P = pathBy(SEL.path), pts = ptsOf(P), len = 0; for (var i = 0; i + 1 < pts.length; i++) len += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      info.textContent = P.kind + ' · ' + len.toFixed(1) + ' mi · ' + P.pts.length + ' points\ndrag a point; drag a line to add one; Del drops the yellow one;\na point dropped on a place binds to it (green) and moves with it';
      ed.innerHTML = '<div class="row"><input type="text" id="ed-name"></div><div class="row"><select id="ed-kind"></select><button id="ed-del">delete the way</button><button id="ed-rev">extend</button></div>';
      $('ed-name').value = P.name;
      PKINDS.forEach(function (k) { var o = document.createElement('option'); o.value = o.textContent = k; if (k === P.kind) o.selected = true; $('ed-kind').appendChild(o); });
      $('ed-name').oninput = function () { P.name = this.value; }; $('ed-name').onfocus = begin; $('ed-name').onchange = function () { commit(); };
      $('ed-kind').onchange = function () { begin(); P.kind = this.value; commit(); };
      $('ed-del').onclick = function () { begin(); S.paths = S.paths.filter(function (x) { return x.id !== P.id; }); SEL.path = null; SEL.vtx = -1; commit(); };
      $('ed-rev').title = 'add points past its last end (click on the map; Enter or double-click ends)';
      $('ed-rev').onclick = function () { DRAW = { kind: P.kind, pts: P.pts.slice(), keep: P.id }; msg('click to go on from its last point; Enter or double-click ends, Esc leaves it as it was'); draw(); };
      return;
    }
    if (SEL.hex) {
      var hx = SEL.hex, k = K(hx.q, hx.r), own = S.paint[hx.L][k], e = effAt(hx.L, hx.q, hx.r), inside = hx.L < 3 ? (DC[hx.L].get(k) || 0) : 0;
      var nm = function (t) { return TB[t] ? TB[t].name : t; };
      info.textContent = 'level ' + hx.L + ' hex (' + col(hx.q, hx.r) + ', ' + hx.r + '), ' + LV[hx.L].name + ' across\n' +
        (own ? 'painted ' + nm(own) : e ? 'shows ' + nm(e.t) + ', from its level ' + e.L + ' hex (' + col(e.q, e.r) + ', ' + e.r + ')' : 'unpainted') +
        (inside ? '\n' + inside + ' finer hexes painted inside it' : '') + '\nclick a terrain to set it';
      ed.appendChild(btn('inherit (clear it)', false, function () { begin(); setPaint(hx.L, k, null); commit(); }));
      if (inside) ed.appendChild(btn('clear the finer paint inside', false, function () { begin(); clearInside(hx.L, hx.q, hx.r); commit(); }));
      if (hx.L < 3) ed.appendChild(btn('into it ↓', false, function () { into(hx); }));
      if (hx.L > 1) ed.appendChild(btn('up ↑', false, outOf));
      return;
    }
    info.textContent = 'nothing selected';
  }
  function clearInside(L, q, r) {
    var n = LV[L + 1].n; kids(n).forEach(function (c) { var cq = n * q + c[0], cr = n * r + c[1], ck = K(cq, cr); if (L + 1 < 3 && DC[L + 1].get(ck)) clearInside(L + 1, cq, cr); setPaint(L + 1, ck, null); });
  }
  function listPanels() {
    var sl = $('sites'); sl.innerHTML = '';
    S.sites.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).forEach(function (st) {
      var d = document.createElement('div'); d.textContent = st.name + '  · ' + st.kind; if (SEL.site === st.id) d.className = 'on';
      d.onclick = function () { SEL.site = st.id; SEL.path = null; SEL.hex = null; zoomTo(view.z, st.x, st.y); panels(); }; sl.appendChild(d);
    });
    var pl = $('paths'); pl.innerHTML = '';
    S.paths.forEach(function (P) {
      var d = document.createElement('div'); d.textContent = P.name + '  · ' + P.kind; if (SEL.path === P.id) d.className = 'on';
      d.onclick = function () { SEL.path = P.id; SEL.vtx = -1; SEL.site = null; SEL.hex = null; var q = ptsOf(P); if (q.length) zoomTo(view.z, q[0][0], q[0][1]); setTool('roads'); }; pl.appendChild(d);
    });
  }
  function panelsMeasure() { $('measure').textContent = measureText(); }
  function underPanel() {
    var box = $('unders'); box.innerHTML = '';
    S.under.forEach(function (u) {
      var rec = IMG[u.id], d = document.createElement('div'); d.className = 'box';
      var state = !rec ? '' : rec.ok ? '' : rec.trying ? ' (loading)' : ' (not found)';
      d.innerHTML = '<div class="row"><label><input type="checkbox"' + (u.on ? ' checked' : '') + '> ' + esc(u.name) + '</label><span class="dim">' + state + '</span></div>' +
        '<div class="row"><input type="range" min="0" max="1" step="0.05" value="' + u.op + '"><span class="dim">px/mi</span><input type="number" step="any" value="' + (+u.pxmi).toFixed(3) + '" style="width:84px"></div>';
      var row = d.querySelectorAll('.row')[1];
      row.appendChild(btn('move', S.opts.tool === 'under' && S.opts.uSel === u.id, function () { S.opts.uSel = u.id; u.on = true; loadUnder(u); setTool('under'); }, 'drag it on the map to align it'));
      if (rec && rec.fail) row.appendChild(btn('pick the file…', false, function () { pickFor = u.id; $('imgfile').click(); }, u.file + ' (from TarlynsPit/map)'));
      var ins = d.querySelectorAll('input');
      ins[0].onchange = function () { begin(); u.on = this.checked; if (u.on) loadUnder(u); commit(); };
      ins[1].oninput = function () { u.op = +this.value; draw(); }; ins[1].onchange = function () { save(); };
      ins[2].onchange = function () { var v = +this.value; if (v > 0) { begin(); u.pxmi = v; commit(); } };
      box.appendChild(d);
    });
  }

  // ---------------------------------------------------------------- the buttons
  $('addterr').onclick = function () {
    begin(); var k = 't' + Date.now().toString(36), hue = Math.floor(Math.random() * 360);
    var c = 'hsl(' + hue + ',45%,50%)', cvs = document.createElement('canvas').getContext('2d'); cvs.fillStyle = c; // (to #rrggbb for the colour input)
    S.terr.push({ k: k, name: 'a new terrain', color: cvs.fillStyle, cost: 1 }); reindex(); S.opts.terr = k; EDT = k; commit();
    var nm = $('te-name'); if (nm) { nm.focus(); nm.select(); }
  };
  $('guess').onclick = guess;
  $('newroad').onclick = function () { DRAW = { kind: 'road', pts: [] }; SEL.path = null; msg('click along the new road (on a place it binds); Enter or double-click ends, Esc drops it'); draw(); };
  $('newriver').onclick = function () { DRAW = { kind: 'river', pts: [] }; SEL.path = null; msg('click along the new river; Enter or double-click ends, Esc drops it'); draw(); };
  $('pfoot').onchange = function () { S.pace.foot = Math.max(1, +this.value || 24); panelsMeasure(); draw(); save(); };
  $('pcart').onchange = function () { S.pace.cart = Math.max(1, +this.value || 17); panelsMeasure(); draw(); save(); };
  $('paintop').oninput = function () { S.opts.paintOp = +this.value; draw(); }; $('paintop').onchange = save;
  $('gridon').onchange = function () { S.opts.grid = this.checked; draw(); save(); };
  $('labon').onchange = function () { S.opts.labels = this.checked; draw(); save(); };
  $('undo').onclick = undo; $('redo').onclick = redo;
  function stamp() { var d = new Date(); return d.toISOString().slice(0, 16).replace(/[:]/g, '').replace('T', '-') + 'Z'; }
  function download(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }
  function outObj() {
    var o = JSON.parse(JSON.stringify(S));
    o.exported = new Date().toISOString();
    o.about = 'the realm hex map (dragonsleep-8bit tools/hexmap.html, the maps lane): levels 1-3 are pointy-top hexes 5 mi, 1 mi and 1/16 mi across the flats, axial "q,r" keys, a level-k+1 hex the child of the level-k hex its centre lies in; x/y in miles east/south of corridor v3\'s top-left corner (v3 at ' + V3.toFixed(3) + ' px a mile)';
    return o;
  }
  $('export').onclick = function () { saveNow(); download(new Blob([JSON.stringify(outObj(), null, 1)], { type: 'application/json' }), 'realm-hexmap-' + stamp() + '.json'); msg('exported'); };
  $('import').onclick = function () { $('file').click(); };
  function takeIn(text, name) { // a hex map file in place of this browser's copy
    var o; try { o = JSON.parse(text); } catch (e) { msg('not a hex map file: ' + e.message, true); return false; }
    if (!o || o.v !== 1 || !o.paint) { msg('not a hex map file (no v: 1)', true); return false; }
    delete o.exported; delete o.about; S = o; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* (shown on the next save) */ }
    UNDO = []; REDO = []; SEL = { hex: null, site: null, path: null, vtx: -1 }; load(); S.under.forEach(function (u) { if (u.on) loadUnder(u); }); panels(); draw(); msg('took in ' + name);
    return true;
  }
  $('file').onchange = function () {
    var f = this.files[0]; this.value = ''; if (!f) return; var rd = new FileReader();
    rd.onload = function () { takeIn(rd.result, f.name); }; rd.readAsText(f);
  };

  // ---------------------------------------------------------------- a file on disk, written as he goes (the browser's copy belongs to one
  // address -- localhost:8931 and :8932 are two -- and the file is the one the seat reads). Chromium's file pickers; the handle kept in IndexedDB
  var FH = null, FOK = false, fileT = 0;
  function idb() { return new Promise(function (res, rej) { var r = indexedDB.open('realm-hexmap', 1); r.onupgradeneeded = function () { r.result.createObjectStore('h'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  function idbGet(k) { return idb().then(function (db) { return new Promise(function (res) { var t = db.transaction('h').objectStore('h').get(k); t.onsuccess = function () { res(t.result); }; t.onerror = function () { res(null); }; }); }).catch(function () { return null; }); }
  function idbSet(k, v) { return idb().then(function (db) { return new Promise(function (res) { var tx = db.transaction('h', 'readwrite'); tx.objectStore('h').put(v, k); tx.oncomplete = function () { res(); }; tx.onerror = function () { res(); }; }); }).catch(function () {}); }
  function fileNote(t, warn) { $('filenote').innerHTML = warn ? '<b class="warn">' + esc(t) + '</b>' : esc(t); }
  function fileSoon() { if (FH && FOK) { clearTimeout(fileT); fileT = setTimeout(writeFile, 1200); } }
  async function writeFile() {
    if (!FH || !FOK) return;
    try {
      var w = await FH.createWritable(); await w.write(JSON.stringify(outObj(), null, 1)); await w.close();
      fileNote('writing ' + FH.name + ' as you go (last ' + new Date().toLocaleTimeString() + ')');
    } catch (e) { FOK = false; fileNote('could not write ' + FH.name + ' (' + e.message + ')', true); filePanel(); }
  }
  async function linkTo(h, how) { // the file's copy wins if it is newer than this browser's, else this browser's is written to it
    var perm = await h.requestPermission({ mode: 'readwrite' }); if (perm !== 'granted') { fileNote('not allowed to write ' + h.name, true); return; }
    FH = h; FOK = true; await idbSet('file', h);
    var text = ''; try { text = await (await h.getFile()).text(); } catch (e) { text = ''; }
    var o = null; try { o = text ? JSON.parse(text) : null; } catch (e) { o = null; }
    if (o && o.v === 1 && o.paint && (how === 'open' || !S.saved || (o.saved && o.saved > S.saved))) { takeIn(text, h.name); fileNote('opened ' + h.name + ' and writing it as you go'); }
    else await writeFile();
    filePanel();
  }
  function filePanel() {
    var box = $('filerow'); box.innerHTML = '';
    if (!window.showSaveFilePicker) { fileNote('this browser cannot write a file as you go: EXPORT now and then'); return; }
    box.appendChild(btn('save to a file…', false, async function () {
      try { var h = await window.showSaveFilePicker({ suggestedName: 'realm-hexmap.json', types: [{ description: 'hex map', accept: { 'application/json': ['.json'] } }] }); await linkTo(h, 'save'); }
      catch (e) { if (e.name !== 'AbortError') fileNote('no file (' + e.message + ')', true); }
    }, 'pick a file (TarlynsPit/map/realm-hexmap.json, say): the map is written to it after every change'));
    box.appendChild(btn('open a file…', false, async function () {
      try { var hs = await window.showOpenFilePicker({ types: [{ description: 'hex map', accept: { 'application/json': ['.json'] } }] }); await linkTo(hs[0], 'open'); }
      catch (e) { if (e.name !== 'AbortError') fileNote('no file (' + e.message + ')', true); }
    }, 'open a hex map file and go on writing it'));
    if (FH && !FOK) box.appendChild(btn('go on writing ' + FH.name, true, function () { linkTo(FH, 'resume'); }));
  }
  async function fileStart() {
    filePanel(); if (!window.showSaveFilePicker) return;
    var h = await idbGet('file'); if (!h) { fileNote('not written to a file yet: SAVE TO A FILE keeps it on disk as you go'); return; }
    FH = h; var perm = 'prompt'; try { perm = await h.queryPermission({ mode: 'readwrite' }); } catch (e) { perm = 'prompt'; }
    if (perm === 'granted') { FOK = true; fileNote('writing ' + h.name + ' as you go'); } else fileNote(h.name + ' was this map’s file: click GO ON WRITING (the newer of the two wins)');
    filePanel();
  }
  $('png').onclick = function () { drawNow(); cv.toBlob(function (b) { if (b) download(b, 'realm-hexmap-view-' + stamp() + '.png'); else msg('the browser would not make a picture', true); }); };
  var armed = 0;
  $('reset').onclick = function () {
    if (Date.now() - armed > 4000) { armed = Date.now(); this.textContent = 'sure? click again'; var b = this; setTimeout(function () { b.textContent = 'start over'; }, 4000); return; }
    S = fresh(); UNDO = []; REDO = []; SEL = { hex: null, site: null, path: null, vtx: -1 }; reindex(); rebuildDC(); saveNow(); this.textContent = 'start over'; armed = 0;
    S.under.forEach(loadUnder); setLevel(1, [54, 30]); msg('started over from corridor v3’s places and roads');
  };

  // ---------------------------------------------------------------- go
  load();
  window.HEXMAP = { S: function () { return S; }, view: view, at: at, up: up, kids: kids, hc: hc, effAt: effAt, measure: measure, LV: LV, // (for the seat's probes)
    redraw: function () { LAYERKEY = ''; drawNow(); } };
  window.addEventListener('resize', resize);
  S.under.forEach(function (u) { if (u.on) loadUnder(u); });
  if (!S.view) { view.L = 1; view.cx = 54; view.cy = 30; view.z = 11; }
  resize(); panels(); fileStart();
  $('origin').textContent = 'this browser keeps its copy for ' + location.host + ' (another port is another copy)';
  msg('Kept in this browser as you go; SAVE TO A FILE keeps it on disk too.');
})();
