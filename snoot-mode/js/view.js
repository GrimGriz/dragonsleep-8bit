/* THE SNOOT -- the map drawn (10-14, the Snoot mode seat; isometric 10-15). The look he pasted 10-13 (a Civilization V battlefield, the
   lane §2): hex tiles of ground, a road across, one stack a hex drawn as a small formation of figures with a shield badge naming its
   strength. His word 10-15: "Rather than launching an isometric combat view, isometric hex the main map and zoom in to animate the
   combat" -- so the map is seen at a slant: each hex a tile squashed to SQ of its height with its south walls showing, raised by its
   ground (the hills stand up, the lake lies low). A camera (the world point at the canvas centre, and pixels to a hex's radius) carries
   the world to the screen, and the show (js/show.js) flies it from the whole map down into the one hex where a fight is, and back.
   The figures are DEEP16's own sheets (the lane §8: "the hex does the work"), read from ../deep16/data/sprites.js and drawn by their
   idle row; each stack shows its formation (a bar across its facing for a line, along it for a column, a ring for a square) and a
   chevron on the side it faces (CHAINMAIL p.10, RULED 10-15). The badge and the ground are code-drawn. */
'use strict';
(function () {
  var SN = window.SN, V = SN.V = {};
  var cv, cx, imgs = {}, R3 = Math.sqrt(3), SQ = 0.58;
  V.SQ = SQ; V.R3 = R3;
  V.cam = { x: 0, y: 0, z: 30 }; // (the map's camera: the world point at the canvas centre, and pixels to a hex's radius)
  V.anim = null; // { steps, t0, dur } while the day's moves play
  V.sel = null; V.hover = null; V.flash = [];
  var SIDE = { ours: '#3aa38e', gnoll: '#d0623c', dominion: '#9a6ad6' };
  var GROUND = { '.': '#78864a', v: '#8c9a50', h: '#86683f', w: '#2c5a7a', g: '#6a5636', P: '#6a5a46', i: '#78864a', m: '#86683f', s: '#86683f', l: '#86683f' };
  var ELEV = { '.': 0.1, v: 0.1, h: 0.3, m: 0.36, s: 0.34, l: 0.34, g: 0.05, w: -0.03, P: 0.08, i: 0.1 }; // (a hex's ground above the plain, in hex radii)
  // a sheet facing (S, SW, W, NW, N, NE, E, SE: 0..7) for each hex side (E, NE, NW, W, SW, SE) on the map: the side views, as the screenshot he
  // pasted draws its stacks -- NE and NW turn to E and W, since a sheet's back rows read as a grey lump at this size
  var FACE = [6, 6, 2, 2, 1, 7];
  V.DIRV = [[1, 0], [0.5, -R3 / 2], [-0.5, -R3 / 2], [-1, 0], [-0.5, R3 / 2], [0.5, R3 / 2]]; // (E NE NW W SW SE: unit vectors in the world, y down)

  // ---------------------------------------------------------------- the world and the camera
  // a hex's centre in the world: (√3·(c + ½ on an odd row), 1.5·r), its radius 1; the screen squashes y by SQ and lifts by the ground
  V.world = function (h) { return [R3 * (h[0] + 0.5 * (h[1] & 1)), 1.5 * h[1]]; };
  V.elev = function (h) { var e = ELEV[SN.ter(h[0], h[1])]; return e == null ? 0 : e; };
  V.proj = function (cam, W, H) { return function (wx, wy, e) { return [(wx - cam.x) * cam.z + W / 2, ((wy - cam.y) * SQ - (e || 0)) * cam.z + H / 2]; }; };
  V.fitCam = function (W, H) {
    var x0 = -R3 / 2, x1 = R3 * SN.W, y0 = -SQ - 0.4, y1 = (1.5 * (SN.H - 1) + 1) * SQ + 0.3;
    var z = Math.max(8, Math.min((W - 24) / (x1 - x0), (H - 20) / (y1 - y0)));
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 / SQ, z: z };
  };
  // the camera on one hex, near enough that the hex fills the frame (the show's fight)
  V.camTo = function (h, W, H) {
    var w = V.world(h), z = Math.min(W * 0.8 / R3, H * 0.95 / (2 * SQ));
    return { x: w[0], y: w[1] - V.elev(h) / SQ + (H * 0.07) / (z * SQ), z: z };
  };
  V.lerpCam = function (a, b, f) { var z = a.z * Math.pow(b.z / a.z, f), g = (z - a.z) / ((b.z - a.z) || 1); return { x: a.x + (b.x - a.x) * g, y: a.y + (b.y - a.y) * g, z: z }; };
  V.init = function (canvas) { cv = canvas; cx = cv.getContext('2d'); };
  V.fit = function (w, h) { cv.width = Math.max(200, Math.floor(w)); cv.height = Math.max(200, Math.floor(h)); V.cam = V.fitCam(cv.width, cv.height); };
  function mapProj() { return V.proj(V.cam, cv.width, cv.height); }
  V.center = function (h) { var w = V.world(h); return mapProj()(w[0], w[1], V.elev(h)); };
  V.hexAt = function (px, py) {
    var best = null, bd = Infinity, z = V.cam.z;
    for (var r = 0; r < SN.H; r++) for (var c = 0; c < SN.W; c++) { var p = V.center([c, r]), dy = (p[1] - py) / SQ, d = (p[0] - px) * (p[0] - px) + dy * dy; if (d < bd) { bd = d; best = [c, r]; } }
    return bd <= z * z ? best : null;
  };
  V.size = function () { return V.cam.z; };
  function noise(c, r, k) { var x = Math.sin(c * 127.1 + r * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); }
  function shade(hex, f) { var n = parseInt(hex.slice(1), 16), R = (n >> 16) & 255, G = (n >> 8) & 255, B = n & 255; return 'rgb(' + Math.min(255, Math.round(R * f)) + ',' + Math.min(255, Math.round(G * f)) + ',' + Math.min(255, Math.round(B * f)) + ')'; }
  function corners(p, w, e, k) { var out = []; for (var i = 0; i < 6; i++) { var a = Math.PI / 180 * (60 * i - 30); out.push(p(w[0] + Math.cos(a) * k, w[1] + Math.sin(a) * k, e)); } return out; }
  function poly(c, pts) { c.beginPath(); pts.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); }
  V.hexPath = function (c, p, h, k) { poly(c, corners(p, V.world(h), V.elev(h), k)); };

  // ---------------------------------------------------------------- the sheets (DEEP16's, by their own frame maps)
  function sheet(name) {
    var sh = window.D16 && window.D16.SHEETS && window.D16.SHEETS[name]; if (!sh) return null;
    var im = imgs[name];
    if (!im) { im = imgs[name] = new Image(); im.onload = function () { V.dirty = true; }; im.src = (SN.DEEP16 || '../deep16/') + sh.image; }
    return im.complete && im.naturalWidth ? { sh: sh, im: im } : null;
  }
  V.preload = function (st) { st.units.forEach(function (u) { (u.sheets || []).forEach(sheet); }); };
  function figure(c, name, facing, x, y, hgt, t) {
    var S = sheet(name);
    if (!S) { c.fillStyle = '#222'; c.fillRect(x - 3, y - hgt * 0.8, 6, hgt * 0.8); return; }
    var sh = S.sh, a = sh.anims.idle || sh.anims[Object.keys(sh.anims)[0]], fw = a.fw || sh.fw, fh = a.fh || sh.fh, ax = a.ax != null ? a.ax : sh.ax, ay = a.ay != null ? a.ay : sh.ay;
    var k = hgt / 56, fr = Math.floor((t || 0) * (a.fps || 6) / 60) % (a.frames || 1); // (one scale for every sheet, as the grid draws them: a sheet's `top` is its figure's height above the foot -- a man ~56, a hyena 36, the Harbinger 72)
    var sy = (a.y != null ? a.y : (a.row || 0) * sh.fh) + (facing % 8) * fh;
    c.drawImage(S.im, fr * fw, sy, fw, fh, Math.round(x - ax * k), Math.round(y - ay * k), Math.round(fw * k), Math.round(fh * k));
  }

  // ---------------------------------------------------------------- the frame: V.render draws the map through any camera (the show flies it)
  V.draw = function (st, t) { if (cx) V.render(cx, cv.width, cv.height, V.cam, st, t, { ui: true }); };
  V.render = function (c, W, H, cam, st, t, opt) {
    opt = opt || {};
    var p = V.proj(cam, W, H), z = cam.z, r, col;
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#16121c'; c.fillRect(0, 0, W, H);
    for (r = 0; r < SN.H; r++) for (col = 0; col < SN.W; col++) { var q = V.center0(p, [col, r]); if (q[0] < -2 * z || q[0] > W + 2 * z || q[1] < -2 * z || q[1] > H + 2 * z) continue; tile(c, p, z, col, r); }
    // the roads
    SN.ROADS.forEach(function (rd) {
      var pts = rd.hexes.map(function (h) { return V.center0(p, h); });
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = '#3c2e1e'; c.lineWidth = Math.max(3, z * 0.16); c.beginPath(); pts.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.stroke();
      c.strokeStyle = '#c9a96a'; c.lineWidth = Math.max(1.5, z * 0.08); c.stroke();
    });
    // the places' names (only from far off)
    if (z < 90 && opt.labels !== false) {
      c.font = 'italic ' + Math.max(10, Math.round(z * 0.28)) + 'px Georgia, serif'; c.textAlign = 'center';
      SN.PLACES.forEach(function (pl) { var q = V.center0(p, pl.at); label(c, pl.name, q[0] + (pl.dx || 0) * z, q[1] + (pl.dy != null ? pl.dy : 0.86) * z * SQ + z * 0.1, '#f3e7c0'); });
    }
    if (!st) return;
    var sel = opt.ui && V.sel && SN.unit(st, V.sel);
    if (sel && SN.canOrder(st, sel) && !V.anim) reach(c, p, st, sel);
    // our written orders: an arrow along each day's path
    if (opt.ui) st.units.forEach(function (u) { if (u.side === 'ours' && SN.alive(u) && u.order && u.order.type === 'move' && u.order.path && !V.anim) arrow(c, p, u.at, u.order.path, u.id === V.sel ? '#ffe08a' : u.berserk ? 'rgba(255,190,150,0.55)' : 'rgba(255,240,190,0.75)', u.order.full); });
    // the units, back rows first (one to four stacks a hex: alone in the middle, two side by side, three in a triangle, four in a square; the Pit
    // holds more, in rows)
    var at = {}, pos = positions(st, t, p);
    st.units.forEach(function (u) { if (!SN.alive(u) && u.state !== 'home') return; if (u.state === 'home' && !u.harbinger && !u.watch) return; if (opt.hide && opt.hide[u.id]) return; var k = pos[u.id].key; (at[k] = at[k] || []).push(u); });
    var LAY = { 1: [[0, 0]], 2: [[-0.42, 0.05], [0.42, 0.05]], 3: [[-0.42, -0.18], [0.42, -0.18], [0, 0.32]], 4: [[-0.42, -0.24], [0.42, -0.24], [-0.42, 0.3], [0.42, 0.3]] };
    var s = Math.min(z, 120);
    Object.keys(at).map(function (k) { return at[k]; }).sort(function (a, b) { return pos[a[0].id].y - pos[b[0].id].y; }).forEach(function (list) {
      var lay = LAY[list.length] || list.map(function (u, i) { return [((i % 3) - 1) * 0.5, (Math.floor(i / 3) - 0.5) * 0.5]; });
      list.map(function (u, i) { return [u, lay[i]]; }).sort(function (a, b) { return a[1][1] - b[1][1]; }).forEach(function (e) {
        var q = pos[e[0].id], al = opt.fade && opt.fade.ids[e[0].id] ? opt.fade.a : 1; if (al <= 0) return;
        c.globalAlpha = al; stack(c, st, e[0], q.x + e[1][0] * s, q.y + e[1][1] * s * SQ * 1.3, s, t, list.length, q.dir, opt.ui); c.globalAlpha = 1;
      });
    });
    if (opt.ui && V.hover) { V.hexPath(c, p, V.hover, 0.94); c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2; c.stroke(); }
    if (sel && SN.alive(sel)) { V.hexPath(c, p, sel.at, 0.97); c.strokeStyle = '#ffd25a'; c.lineWidth = 3; c.stroke(); }
    // fights flashing where they are
    if (opt.ui) {
      V.flash = V.flash.filter(function (f) { return t - f.t0 < 90; });
      V.flash.forEach(function (f) { var q = V.center0(p, f.at), a = 1 - (t - f.t0) / 90; V.hexPath(c, p, f.at, 0.9); c.strokeStyle = 'rgba(255,90,60,' + a + ')'; c.lineWidth = 4; c.stroke(); swords(c, q[0], q[1] - z * 0.9, a); });
    }
    if (st.head && z < 90) { var hq = V.center0(p, st.head.at); c.globalAlpha = 0.85; c.font = 'italic ' + Math.max(10, Math.round(z * 0.28)) + 'px Georgia, serif'; c.textAlign = 'center'; label(c, 'the head taken, Day ' + st.head.day, hq[0], hq[1] - z * 1.05, '#ff9a8a'); c.globalAlpha = 1; }
  };
  V.center0 = function (p, h) { var w = V.world(h); return p(w[0], w[1], V.elev(h)); };
  function label(c, txt, x, y, col) { c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.8)'; c.strokeText(txt, x, y); c.fillStyle = col; c.fillText(txt, x, y); }

  // a tile: its south walls, its top, its ground
  function tile(c, p, z, col, r) {
    var h = [col, r], ch = SN.ter(col, r), w = V.world(h), e = V.elev(h), base = GROUND[ch] || '#555', top = corners(p, w, e, 1), low = corners(p, w, -0.18, 1);
    [[1, 2, 0.58], [2, 3, 0.72]].forEach(function (ed) { poly(c, [top[ed[0]], top[ed[1]], low[ed[1]], low[ed[0]]]); c.fillStyle = shade(ch === 'w' ? '#1e3a50' : base, ed[2]); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1; c.stroke(); });
    poly(c, top); c.fillStyle = shade(base, 0.92 + 0.14 * noise(col, r, 1)); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1; c.stroke();
    ground(c, ch, p, w, e, z, col, r);
  }
  // the ground's marks, in the world so they lie on the slant (the more the zoom, the more of them: the show's hex is a field, not a tile)
  function ground(c, ch, p, w, e, z, col, r) {
    var k = Math.min(z / 40, 3), at = function (dx, dy) { return p(w[0] + dx, w[1] + dy, e); }, i, q, n;
    if (ch === 'h' || ch === 'm' || ch === 's' || ch === 'l') {
      n = 3 + Math.min(6, Math.floor(z / 80));
      for (i = 0; i < n; i++) { q = at((noise(col, r, i + 2) - 0.5) * 1.2, (noise(col, r, i + 7) - 0.5) * 1.0); var rw = (0.16 + 0.1 * noise(col, r, i + 31)) * z;
        c.fillStyle = 'rgba(60,40,20,0.35)'; c.beginPath(); c.ellipse(q[0], q[1], rw, rw * SQ * 0.9, 0, Math.PI, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(40,26,12,0.55)'; c.lineWidth = 1.5 * Math.min(k, 2); c.beginPath(); c.ellipse(q[0], q[1], rw, rw * SQ * 0.9, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); }
    }
    if (ch === 'v' || ch === '.' || ch === 'i') {
      n = 4 + Math.min(14, Math.floor(z / 30)); var tl = Math.min(14, 5 * k);
      c.strokeStyle = 'rgba(30,50,10,0.38)'; c.lineWidth = Math.max(1, Math.min(2, k * 0.6));
      for (i = 0; i < n; i++) { q = at((noise(col, r, i + 11) - 0.5) * 1.4, (noise(col, r, i + 17) - 0.5) * 1.3); c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] - tl * 0.35, q[1] - tl); c.moveTo(q[0], q[1]); c.lineTo(q[0] + tl * 0.35, q[1] - tl); c.stroke(); }
    }
    if (ch === 'w') { c.strokeStyle = 'rgba(200,230,255,0.4)'; c.lineWidth = 1.2; for (i = 0; i < 3 + Math.min(6, Math.floor(z / 60)); i++) { q = at((noise(col, r, i + 41) - 0.5) * 1.1, (noise(col, r, i + 43) - 0.5) * 0.9); c.beginPath(); c.ellipse(q[0], q[1], 0.12 * z, 0.12 * z * SQ, 0, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); } }
    if (ch === 'g') {
      var g0 = at(-0.65, -0.3), g1 = at(-0.1, 0), g2 = at(0.2, -0.15), g3 = at(0.65, 0.25);
      c.strokeStyle = '#2a1e10'; c.lineWidth = Math.max(2.5, 0.07 * z); c.beginPath(); c.moveTo(g0[0], g0[1]); c.lineTo(g1[0], g1[1]); c.lineTo(g2[0], g2[1]); c.lineTo(g3[0], g3[1]); c.stroke();
      c.strokeStyle = 'rgba(230,230,230,0.35)'; c.lineWidth = 1; for (i = 0; i < 5; i++) { var a = at(-0.45 + i * 0.22, -0.5), b = at(-0.35 + i * 0.2, 0.35); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    }
    if (ch === 'P') { // the Pit: the giants' bunker, torn open; the town in the hole
      q = at(0, 0.05); c.fillStyle = '#2a2018'; c.beginPath(); c.ellipse(q[0], q[1], 0.62 * z, 0.62 * z * SQ, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#a08a68'; c.lineWidth = Math.max(2, 0.06 * z); c.stroke();
      for (i = 0; i < 5; i++) { q = at(-0.5 + i * 0.25, -0.55 + (i % 2) * 0.05); var bw = 0.12 * z, bh = (0.12 + (i % 3) * 0.04) * z; c.fillStyle = '#8d7a5c'; c.fillRect(q[0] - bw / 2, q[1] - bh, bw, bh); c.fillStyle = '#5e4f3d'; c.fillRect(q[0] - bw / 2, q[1] - bh, bw, bh * 0.15); }
      q = at(0.4, -0.5); c.fillStyle = '#c8b48a'; c.fillRect(q[0] - 0.04 * z, q[1] - 0.45 * z, 0.08 * z, 0.45 * z); // (the tower off center)
    }
    if (ch === 'i') { q = at(0, 0); var hw = Math.min(0.24 * z, 120); c.fillStyle = '#6a4a2a'; c.fillRect(q[0] - hw, q[1] - hw * 0.6, hw * 2, hw * 1.2); c.fillStyle = '#9a3a2a'; c.beginPath(); c.moveTo(q[0] - hw * 1.2, q[1] - hw * 0.6); c.lineTo(q[0], q[1] - hw * 1.4); c.lineTo(q[0] + hw * 1.2, q[1] - hw * 0.6); c.fill(); c.fillStyle = '#ffd27a'; c.fillRect(q[0] - hw * 0.2, q[1] - hw * 0.1, hw * 0.4, hw * 0.4); }
    if (ch === 'm') { for (i = 0; i < 10; i++) { var am = i / 10 * Math.PI * 2; q = at(Math.cos(am) * 0.5, Math.sin(am) * 0.5); var sw = Math.min(0.06 * z, 30), sh2 = Math.min(0.16 * z, 80); c.fillStyle = '#c9c0a8'; c.fillRect(q[0] - sw / 2, q[1] - sh2, sw, sh2); c.fillStyle = '#8a8270'; c.fillRect(q[0] - sw / 2, q[1] - sh2 * 0.15, sw, sh2 * 0.15); } }
    if (ch === 's' || ch === 'l') { for (i = 0; i < 4; i++) { q = at(-0.45 + i * 0.3, -0.35); var ph = Math.min(0.32 * z, 140); c.fillStyle = '#4a3420'; c.fillRect(q[0] - ph * 0.04, q[1] - ph, ph * 0.08, ph); c.fillStyle = '#e8e0cc'; c.beginPath(); c.arc(q[0], q[1] - ph, ph * 0.12, 0, Math.PI * 2); c.fill(); } }
  }

  // ---------------------------------------------------------------- the selected unit's day, and the orders' arrows
  var reachKey = null, reachSet = [];
  function reach(c, p, st, u) {
    var key = [u.id, st.day, SN.key(u.at), u.form, u.reformed, u.fatigued].join('|');
    if (key !== reachKey) { reachKey = key; reachSet = []; for (var r = 0; r < SN.H; r++) for (var col = 0; col < SN.W; col++) { var h = [col, r]; if (SN.same(h, u.at) || SN.dist(h, u.at) > 10 || SN.cost(h) >= 99) continue; var pa = SN.path(u.at, h); if (pa && SN.reach(u, pa).length === pa.length) reachSet.push(h); } }
    reachSet.forEach(function (h) { V.hexPath(c, p, h, 0.92); c.fillStyle = 'rgba(255,230,140,0.14)'; c.fill(); });
    if (V.hover && !SN.same(V.hover, u.at)) { var pp = SN.path(u.at, V.hover); if (pp) arrow(c, p, u.at, SN.reach(u, pp), 'rgba(255,224,138,0.55)', pp); }
  }
  function arrow(c, p, from, path, col, full) {
    if (!path || !path.length) return;
    if (full && full.length > path.length) { c.setLineDash([4, 6]); c.strokeStyle = 'rgba(255,240,190,0.35)'; c.lineWidth = 2; c.beginPath(); var a0 = V.center0(p, path[path.length - 1]); c.moveTo(a0[0], a0[1]); full.slice(path.length).forEach(function (h) { var q = V.center0(p, h); c.lineTo(q[0], q[1]); }); c.stroke(); c.setLineDash([]); }
    var pts = [from].concat(path).map(function (h) { return V.center0(p, h); });
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 6; line(c, pts); c.strokeStyle = col; c.lineWidth = 3; line(c, pts);
    var e = pts[pts.length - 1], d = pts[pts.length - 2], ang = Math.atan2(e[1] - d[1], e[0] - d[0]);
    c.fillStyle = col; c.beginPath(); c.moveTo(e[0], e[1]); c.lineTo(e[0] - 11 * Math.cos(ang - 0.45), e[1] - 11 * Math.sin(ang - 0.45)); c.lineTo(e[0] - 11 * Math.cos(ang + 0.45), e[1] - 11 * Math.sin(ang + 0.45)); c.fill();
  }
  function line(c, pts) { c.beginPath(); pts.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.stroke(); }
  function swords(c, x, y, a) { c.strokeStyle = 'rgba(255,230,200,' + a + ')'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 7, y - 7); c.lineTo(x + 7, y + 7); c.moveTo(x + 7, y - 7); c.lineTo(x - 7, y + 7); c.stroke(); }

  // where each unit is drawn this frame: its hex, or along its day's steps while they play (and which way it faces)
  function positions(st, t, p) {
    var out = {}, z = p(1, 0, 0)[0] - p(0, 0, 0)[0];
    st.units.forEach(function (u) { var q = V.center0(p, u.at); out[u.id] = { x: q[0], y: q[1] + z * 0.12, key: SN.key(u.at), dir: u.face || 0 }; });
    if (V.anim) {
      var f = Math.min(1, (t - V.anim.t0) / V.anim.dur), byU = {};
      V.anim.steps.forEach(function (sp) { (byU[sp.id] = byU[sp.id] || []).push(sp); });
      Object.keys(byU).forEach(function (id) {
        var sps = byU[id], cur = V.center0(p, sps[0].from), k = SN.key(sps[0].from), t0 = 0, dir = SN.dirTo(sps[0].from, sps[0].to);
        for (var i = 0; i < sps.length; i++) {
          var sp = sps[i], a = V.center0(p, sp.from), b = V.center0(p, sp.to); dir = SN.dirTo(sp.from, sp.to);
          if (f >= sp.t) { cur = b; k = SN.key(sp.to); t0 = sp.t; continue; }
          var g = Math.max(0, Math.min(1, (f - t0) / Math.max(0.0001, sp.t - t0))); cur = [a[0] + (b[0] - a[0]) * g, a[1] + (b[1] - a[1]) * g]; k = SN.key(sp.from); break;
        }
        out[id] = { x: cur[0], y: cur[1] + z * 0.12, key: k, dir: dir >= 0 ? dir : out[id].dir };
      });
    }
    return out;
  }
  V.positions = function (st, t) { return positions(st, t, mapProj()); };
  // a stack: its formation on the ground and the side it faces, three to five figures of its sheets, its hero in front, and its badge
  function stack(c, st, u, x, y, s, t, crowd, dir, ui) {
    var k = crowd > 1 ? 0.62 : 1, sheets = u.sheets || [], heroes = SN.heroesOf(u), hgt = Math.min(96, s * 0.82) * k, face = FACE[dir || 0];
    var n = u.party ? 4 : Math.max(heroes.length ? 1 : 2, Math.min(crowd > 1 ? 3 : 5, Math.ceil((u.figs || 0) / 2) + heroes.length));
    var slots = [[0, 0.05], [-0.26 * k, -0.1], [0.26 * k, -0.1], [-0.13 * k, -0.24], [0.13 * k, -0.24]];
    if (u.party) slots = [[-0.27 * k, 0.04], [-0.09 * k, -0.06], [0.09 * k, 0.04], [0.27 * k, -0.06]];
    if (!u.party) formMark(c, u, x, y, s * k, dir || 0);
    var a0 = c.globalAlpha; if (u.state === 'rout' || u.state === 'withdraw' || u.state === 'home') c.globalAlpha = a0 * 0.6;
    for (var i = n - 1; i >= 0; i--) {
      var sl = slots[i], nm = u.party ? sheets[i] : (i === 0 && heroes.length ? sheets[0] : sheets[(heroes.length ? 1 : 0) + (i % Math.max(1, sheets.length - (heroes.length ? 1 : 0)))] || sheets[0]);
      figure(c, nm, face, x + sl[0] * s, y + sl[1] * s * SQ * 1.4, hgt, t + i * 7);
    }
    c.globalAlpha = a0;
    badge(c, st, u, x + s * 0.3 * k, y - s * 0.62 * k - hgt * 0.35, s, k, ui);
  }
  // the formation on the ground (CHAINMAIL p.10): a line a bar across the way it faces, a column a bar along it, a square a ring; a chevron on the side
  function formMark(c, u, x, y, s, dir) {
    var d = V.DIRV[dir], ux = d[0], uy = d[1] * SQ, l = Math.sqrt(ux * ux + uy * uy); ux /= l; uy /= l;
    var px = -uy, py = ux, col = SIDE[u.side] || '#888', len = s * 0.4;
    y += s * 0.16; // (in front of the figures' feet, where it can be seen)
    c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = Math.max(4, s * 0.1);
    var draw = function () { c.beginPath();
      if (u.form === 'square') c.ellipse(x, y, len * 0.75, len * 0.75 * SQ, 0, 0, Math.PI * 2);
      else if (u.form === 'column') { c.moveTo(x - ux * len * 0.9, y - uy * len * 0.9); c.lineTo(x + ux * len * 0.5, y + uy * len * 0.5); }
      else { c.moveTo(x - px * len, y - py * len); c.lineTo(x + px * len, y + py * len); }
      c.stroke(); };
    draw(); c.strokeStyle = col; c.lineWidth = Math.max(2, s * 0.05); draw();
    var cxp = x + ux * len * 1.05, cyp = y + uy * len * 1.05, w = Math.max(4, s * 0.1);
    c.fillStyle = col; c.strokeStyle = 'rgba(0,0,0,0.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cxp + ux * w, cyp + uy * w); c.lineTo(cxp + px * w * 0.7, cyp + py * w * 0.7); c.lineTo(cxp - px * w * 0.7, cyp - py * w * 0.7); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
  function badge(c, st, u, x, y, s, k, ui) {
    var w = s * 0.46 * (k || 1), h = s * 0.46 * (k || 1), col = SIDE[u.side] || '#888';
    c.beginPath(); c.moveTo(x - w / 2, y - h / 2); c.lineTo(x + w / 2, y - h / 2); c.lineTo(x + w / 2, y + h * 0.1); c.quadraticCurveTo(x + w / 2, y + h * 0.45, x, y + h * 0.6); c.quadraticCurveTo(x - w / 2, y + h * 0.45, x - w / 2, y + h * 0.1); c.closePath();
    c.fillStyle = col; c.fill(); c.lineWidth = u.id === V.sel ? 3 : 1.5; c.strokeStyle = u.id === V.sel ? '#ffd25a' : '#1a1410'; c.stroke();
    var heroes = SN.heroesOf(u).length, txt = u.party ? '4' : String(u.figs || 0);
    c.font = 'bold ' + Math.max(10, Math.round(s * 0.3 * (k || 1))) + 'px Georgia, serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(txt, x, y + s * 0.08);
    if (heroes || u.party) { c.fillStyle = '#ffe08a'; c.font = Math.max(8, Math.round(s * 0.2 * (k || 1))) + 'px Georgia'; c.fillText(u.party ? '★★' : heroes > 1 ? '★' + heroes : '★', x, y - h * 0.62); }
    if (!ui) return;
    if (u.side === 'ours' && SN.canOrder(st, u) && u.order && u.order.type === 'hold' && !V.anim) { c.fillStyle = 'rgba(255,210,90,0.9)'; c.beginPath(); c.arc(x + w * 0.55, y - h * 0.5, 3, 0, Math.PI * 2); c.fill(); } // (no order written yet: a gold dot)
    if (u.order && u.order.type === 'support' && u.side === 'ours') { c.fillStyle = '#ffe08a'; c.font = Math.max(8, Math.round(s * 0.2 * (k || 1))) + 'px Georgia'; c.fillText('⚔?', x - w * 0.75, y + h * 0.1); }
    if (u.state === 'rout' || u.state === 'retreat' || u.stand >= st.day) { c.fillStyle = '#ff9a7a'; c.font = Math.max(8, Math.round(s * 0.2 * (k || 1))) + 'px Georgia'; c.fillText(u.state === 'rout' ? 'ROUT' : 'RALLY', x, y + h * 0.95); }
    if (u.out) { c.fillStyle = '#ff9a7a'; c.font = Math.max(8, Math.round(s * 0.2 * (k || 1))) + 'px Georgia'; c.fillText('DOWN', x, y + h * 0.95); }
  }
})();
