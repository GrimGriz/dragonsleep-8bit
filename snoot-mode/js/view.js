/* THE SNOOT -- the map drawn (10-14, the Snoot mode seat). The look he pasted 10-13 (a Civilization V battlefield, the lane §2):
   hex tiles of ground, a road across, one stack a hex drawn as a small formation of figures with a shield badge naming its
   strength. The figures are DEEP16's own sheets (the lane §8: "the hex does the work"), read from ../deep16/data/sprites.js and
   drawn by their idle row in the facing the stack faces -- a pointy-top hex has six neighbours, NE E SE SW W NW, and those are six
   of the sheets' eight facings. The badge and the ground are code-drawn. */
'use strict';
(function () {
  var SN = window.SN, V = SN.V = {};
  var cv, cx, s = 40, ox = 30, oy = 24, imgs = {}, R3 = Math.sqrt(3);
  V.anim = null; // { steps, t0, dur } while the day's moves play
  V.sel = null; V.hover = null; V.flash = [];
  var SIDE = { ours: '#3aa38e', gnoll: '#d0623c', dominion: '#9a6ad6' };
  var GROUND = { '.': '#78864a', v: '#8c9a50', h: '#86683f', w: '#2c5a7a', g: '#6a5636', P: '#5a4a3a', i: '#78864a', m: '#86683f', s: '#86683f', l: '#86683f' };
  // a sheet facing (S, SW, W, NW, N, NE, E, SE: 0..7) for each hex direction (E, NE, NW, W, SW, SE): the side views, as the screenshot he pasted
  // draws its stacks -- NE and NW turn to E and W, since a sheet's back rows read as a grey lump at this size (the guard's, the veteran's)
  var FACE = [6, 6, 2, 2, 1, 7];

  V.init = function (canvas) { cv = canvas; cx = cv.getContext('2d'); };
  V.fit = function (w, h) {
    cv.width = Math.max(200, Math.floor(w)); cv.height = Math.max(200, Math.floor(h));
    s = Math.max(14, Math.min((cv.width - 40) / (R3 * (SN.W + 0.5)), (cv.height - 40) / (1.5 * (SN.H - 1) + 2)));
    ox = (cv.width - R3 * s * (SN.W + 0.5)) / 2 + R3 * s / 2; oy = (cv.height - (1.5 * s * (SN.H - 1) + 2 * s)) / 2 + s;
  };
  V.center = function (h) { return [ox + R3 * s * (h[0] + 0.5 * (h[1] & 1)), oy + 1.5 * s * h[1]]; };
  V.hexAt = function (px, py) {
    var best = null, bd = Infinity;
    for (var r = 0; r < SN.H; r++) for (var c = 0; c < SN.W; c++) { var p = V.center([c, r]), d = (p[0] - px) * (p[0] - px) + (p[1] - py) * (p[1] - py); if (d < bd) { bd = d; best = [c, r]; } }
    return bd <= s * s ? best : null;
  };
  function hexPath(p, k) { cx.beginPath(); for (var i = 0; i < 6; i++) { var a = Math.PI / 180 * (60 * i - 30); var x = p[0] + s * k * Math.cos(a), y = p[1] + s * k * Math.sin(a); if (i) cx.lineTo(x, y); else cx.moveTo(x, y); } cx.closePath(); }
  function noise(c, r, k) { var x = Math.sin(c * 127.1 + r * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); }
  function shade(hex, f) { var n = parseInt(hex.slice(1), 16), R = (n >> 16) & 255, G = (n >> 8) & 255, B = n & 255; return 'rgb(' + Math.round(R * f) + ',' + Math.round(G * f) + ',' + Math.round(B * f) + ')'; }

  // ---------------------------------------------------------------- the sheets (DEEP16's, by their own frame maps)
  function sheet(name) {
    var sh = window.D16 && window.D16.SHEETS && window.D16.SHEETS[name]; if (!sh) return null;
    var im = imgs[name];
    if (!im) { im = imgs[name] = new Image(); im.onload = function () { V.dirty = true; }; im.src = (SN.DEEP16 || '../deep16/') + sh.image; }
    return im.complete && im.naturalWidth ? { sh: sh, im: im } : null;
  }
  V.preload = function (st) { st.units.forEach(function (u) { (u.sheets || []).forEach(sheet); }); };
  function figure(name, facing, x, y, hgt, t) {
    var S = sheet(name);
    if (!S) { cx.fillStyle = '#222'; cx.fillRect(x - 3, y - hgt * 0.8, 6, hgt * 0.8); return; }
    var sh = S.sh, a = sh.anims.idle || sh.anims[Object.keys(sh.anims)[0]], fw = a.fw || sh.fw, fh = a.fh || sh.fh, ax = a.ax != null ? a.ax : sh.ax, ay = a.ay != null ? a.ay : sh.ay;
    var k = hgt / 56, fr = Math.floor((t || 0) * (a.fps || 6) / 60) % (a.frames || 1); // (one scale for every sheet, as the grid draws them: a sheet's `top` is its figure's height above the foot -- a man ~56, a hyena 36, the Harbinger 72)
    var sy = (a.y != null ? a.y : (a.row || 0) * sh.fh) + (facing % 8) * fh;
    cx.drawImage(S.im, fr * fw, sy, fw, fh, Math.round(x - ax * k), Math.round(y - ay * k), Math.round(fw * k), Math.round(fh * k));
  }

  // ---------------------------------------------------------------- the frame
  V.draw = function (st, t) {
    if (!cx) return;
    cx.imageSmoothingEnabled = false;
    cx.fillStyle = '#16121c'; cx.fillRect(0, 0, cv.width, cv.height);
    var r, c, p, ch;
    for (r = 0; r < SN.H; r++) for (c = 0; c < SN.W; c++) {
      p = V.center([c, r]); ch = SN.ter(c, r);
      hexPath(p, 1); cx.fillStyle = shade(GROUND[ch] || '#555', 0.92 + 0.14 * noise(c, r, 1)); cx.fill();
      cx.strokeStyle = 'rgba(0,0,0,0.28)'; cx.lineWidth = 1; cx.stroke();
      ground(ch, p, c, r);
    }
    // the roads
    SN.ROADS.forEach(function (rd) {
      cx.strokeStyle = '#3c2e1e'; cx.lineWidth = Math.max(3, s * 0.16); cx.lineCap = 'round'; cx.lineJoin = 'round';
      cx.beginPath(); rd.hexes.forEach(function (h, i) { var q = V.center(h); if (i) cx.lineTo(q[0], q[1]); else cx.moveTo(q[0], q[1]); }); cx.stroke();
      cx.strokeStyle = '#c9a96a'; cx.lineWidth = Math.max(1.5, s * 0.08); cx.stroke();
    });
    // the places' names
    cx.font = 'italic ' + Math.max(10, Math.round(s * 0.28)) + 'px Georgia, serif'; cx.textAlign = 'center';
    SN.PLACES.forEach(function (pl) { var q = V.center(pl.at); label(pl.name, q[0] + (pl.dx || 0) * s, q[1] + (pl.dy != null ? pl.dy : 0.86) * s, '#f3e7c0'); });
    // the selected unit's day: where it can go, and the hover's way
    var sel = V.sel && SN.unit(st, V.sel);
    if (sel && SN.canOrder(st, sel) && !V.anim) reach(st, sel);
    // our written orders: an arrow along each day's path
    st.units.forEach(function (u) { if (u.side === 'ours' && SN.alive(u) && u.order && u.order.type === 'move' && u.order.path && !V.anim) arrow(u.at, u.order.path, u.id === V.sel ? '#ffe08a' : 'rgba(255,240,190,0.75)', u.order.full); });
    // the units, back rows first
    var at = {}, pos = V.positions(st, t);
    st.units.forEach(function (u) { if (!SN.alive(u) && u.state !== 'home') return; if (u.state === 'home' && !u.harbinger && !u.watch) return; var k = pos[u.id] ? pos[u.id].key : SN.key(u.at); (at[k] = at[k] || []).push(u); });
    // (one to four stacks a hex: alone in the middle, two side by side, three in a triangle, four in a square; the Pit holds more, in rows)
    var LAY = { 1: [[0, 0]], 2: [[-0.42, 0.05], [0.42, 0.05]], 3: [[-0.42, -0.18], [0.42, -0.18], [0, 0.32]], 4: [[-0.42, -0.24], [0.42, -0.24], [-0.42, 0.3], [0.42, 0.3]] };
    Object.keys(at).map(function (k) { return at[k]; }).sort(function (a, b) { return (pos[a[0].id] || {}).y - (pos[b[0].id] || {}).y; }).forEach(function (list) {
      var lay = LAY[list.length] || list.map(function (u, i) { return [((i % 3) - 1) * 0.5, (Math.floor(i / 3) - 0.5) * 0.5]; });
      list.map(function (u, i) { return [u, lay[i]]; }).sort(function (a, b) { return a[1][1] - b[1][1]; }).forEach(function (e) { var q = pos[e[0].id]; stack(st, e[0], q.x + e[1][0] * s, q.y + e[1][1] * s, t, list.length); });
    });
    // the hex the mouse is on, and the selected unit's hex
    if (V.hover) { hexPath(V.center(V.hover), 0.94); cx.strokeStyle = 'rgba(255,255,255,0.45)'; cx.lineWidth = 2; cx.stroke(); }
    if (sel && SN.alive(sel)) { hexPath(V.center(sel.at), 0.97); cx.strokeStyle = '#ffd25a'; cx.lineWidth = 3; cx.stroke(); }
    // fights flashing where they are
    V.flash = V.flash.filter(function (f) { return t - f.t0 < 90; });
    V.flash.forEach(function (f) { var q = V.center(f.at), a = 1 - (t - f.t0) / 90; hexPath(q, 0.9); cx.strokeStyle = 'rgba(255,90,60,' + a + ')'; cx.lineWidth = 4; cx.stroke(); swords(q[0], q[1] - s * 0.9, a); });
    if (st.head) { var hq = V.center(st.head.at); cx.globalAlpha = 0.85; label('the head taken, Day ' + st.head.day, hq[0], hq[1] - s * 1.05, '#ff9a8a'); cx.globalAlpha = 1; }
  };
  function label(txt, x, y, col) { cx.lineWidth = 3; cx.strokeStyle = 'rgba(0,0,0,0.8)'; cx.strokeText(txt, x, y); cx.fillStyle = col; cx.fillText(txt, x, y); }
  function ground(ch, p, c, r) {
    var k = s / 40;
    if (ch === 'h' || ch === 'm' || ch === 's' || ch === 'l') {
      cx.strokeStyle = 'rgba(40,26,12,0.55)'; cx.lineWidth = 1.5 * k;
      for (var i = 0; i < 3; i++) { var x = p[0] + (noise(c, r, i + 2) - 0.5) * s * 1.1, y = p[1] + (noise(c, r, i + 7) - 0.5) * s * 0.9; cx.beginPath(); cx.arc(x, y + 4 * k, 7 * k, Math.PI * 1.1, Math.PI * 1.9); cx.stroke(); }
    }
    if (ch === 'v' || ch === '.') { cx.strokeStyle = 'rgba(30,50,10,0.35)'; cx.lineWidth = 1; for (var j = 0; j < 4; j++) { var gx = p[0] + (noise(c, r, j + 11) - 0.5) * s * 1.3, gy = p[1] + (noise(c, r, j + 17) - 0.5) * s; cx.beginPath(); cx.moveTo(gx, gy); cx.lineTo(gx - 2 * k, gy - 5 * k); cx.moveTo(gx, gy); cx.lineTo(gx + 2 * k, gy - 5 * k); cx.stroke(); } }
    if (ch === 'w') { cx.strokeStyle = 'rgba(200,230,255,0.4)'; cx.lineWidth = 1.2; for (var w = 0; w < 3; w++) { cx.beginPath(); cx.arc(p[0] - s * 0.3 + w * s * 0.3, p[1] - s * 0.2 + w * s * 0.18, 6 * k, Math.PI * 1.15, Math.PI * 1.85); cx.stroke(); } }
    if (ch === 'g') { cx.strokeStyle = '#2a1e10'; cx.lineWidth = 2.5 * k; cx.beginPath(); cx.moveTo(p[0] - s * 0.6, p[1] - s * 0.3); cx.lineTo(p[0] - s * 0.1, p[1]); cx.lineTo(p[0] + s * 0.2, p[1] - s * 0.15); cx.lineTo(p[0] + s * 0.6, p[1] + s * 0.25); cx.stroke(); cx.strokeStyle = 'rgba(230,230,230,0.35)'; cx.lineWidth = 1; for (var q = 0; q < 4; q++) { cx.beginPath(); cx.moveTo(p[0] - s * 0.4 + q * s * 0.25, p[1] - s * 0.45); cx.lineTo(p[0] - s * 0.3 + q * s * 0.2, p[1] + s * 0.3); cx.stroke(); } }
    if (ch === 'P') { // the Pit: the giants' bunker, torn open; the town in the hole
      cx.fillStyle = '#2a2018'; cx.beginPath(); cx.ellipse(p[0], p[1] + s * 0.05, s * 0.62, s * 0.36, 0, 0, Math.PI * 2); cx.fill();
      cx.strokeStyle = '#a08a68'; cx.lineWidth = 2.5 * k; cx.stroke();
      cx.fillStyle = '#8d7a5c'; for (var b = 0; b < 5; b++) { var bx = p[0] - s * 0.5 + b * s * 0.24, by = p[1] - s * 0.42 - (b % 2) * 4 * k; cx.fillRect(bx, by, 9 * k, 9 * k + (b % 3) * 3 * k); }
      cx.fillStyle = '#c8b48a'; cx.fillRect(p[0] + s * 0.32, p[1] - s * 0.72, 6 * k, 18 * k); // (the tower off center)
    }
    if (ch === 'i') { cx.fillStyle = '#6a4a2a'; cx.fillRect(p[0] - 9 * k, p[1] - 4 * k, 18 * k, 11 * k); cx.fillStyle = '#9a3a2a'; cx.beginPath(); cx.moveTo(p[0] - 11 * k, p[1] - 4 * k); cx.lineTo(p[0], p[1] - 13 * k); cx.lineTo(p[0] + 11 * k, p[1] - 4 * k); cx.fill(); cx.fillStyle = '#ffd27a'; cx.fillRect(p[0] - 2 * k, p[1] + 1 * k, 4 * k, 4 * k); }
    if (ch === 'm') { cx.fillStyle = '#c9c0a8'; for (var m = 0; m < 8; m++) { var a = m / 8 * Math.PI * 2; cx.fillRect(p[0] + Math.cos(a) * s * 0.42 - 2 * k, p[1] + Math.sin(a) * s * 0.26 - 4 * k, 4 * k, 7 * k); } }
    if (ch === 's' || ch === 'l') { for (var z = 0; z < 4; z++) { var zx = p[0] - s * 0.45 + z * s * 0.3, zy = p[1] - s * 0.35; cx.fillStyle = '#4a3420'; cx.fillRect(zx, zy, 2 * k, 14 * k); cx.fillStyle = '#e8e0cc'; cx.beginPath(); cx.arc(zx + 1 * k, zy - 1 * k, 3 * k, 0, Math.PI * 2); cx.fill(); } }
  }
  function reach(st, u) {
    var mv = SN.moveOf(u), best = {}, open = [[0, u.at]]; best[SN.key(u.at)] = 0;
    while (open.length) { open.sort(function (a, b) { return a[0] - b[0]; }); var cur = open.shift(); SN.nbrs(cur[1]).forEach(function (n) { var c = SN.cost(n); if (c >= 99) return; var d = cur[0] + c; if (d > mv && cur[0] > 0) return; if (cur[0] === 0 && d > mv) d = mv; var k = SN.key(n); if (best[k] == null || d < best[k]) { best[k] = d; if (d < mv) open.push([d, n]); } }); }
    Object.keys(best).forEach(function (k) { if (k === SN.key(u.at)) return; var h = k.split(',').map(Number); hexPath(V.center(h), 0.92); cx.fillStyle = 'rgba(255,230,140,0.13)'; cx.fill(); });
    if (V.hover && !SN.same(V.hover, u.at)) { var p = SN.path(u.at, V.hover); if (p) arrow(u.at, SN.reach(u, p), 'rgba(255,224,138,0.55)', p); }
  }
  function arrow(from, path, col, full) {
    if (!path || !path.length) return;
    if (full && full.length > path.length) { cx.setLineDash([4, 6]); cx.strokeStyle = 'rgba(255,240,190,0.35)'; cx.lineWidth = 2; cx.beginPath(); var a0 = V.center(path[path.length - 1]); cx.moveTo(a0[0], a0[1]); full.slice(path.length).forEach(function (h) { var q = V.center(h); cx.lineTo(q[0], q[1]); }); cx.stroke(); cx.setLineDash([]); }
    var pts = [from].concat(path).map(V.center);
    cx.strokeStyle = 'rgba(0,0,0,0.5)'; cx.lineWidth = 6; line(pts); cx.strokeStyle = col; cx.lineWidth = 3; line(pts);
    var e = pts[pts.length - 1], d = pts[pts.length - 2], ang = Math.atan2(e[1] - d[1], e[0] - d[0]);
    cx.fillStyle = col; cx.beginPath(); cx.moveTo(e[0], e[1]); cx.lineTo(e[0] - 11 * Math.cos(ang - 0.45), e[1] - 11 * Math.sin(ang - 0.45)); cx.lineTo(e[0] - 11 * Math.cos(ang + 0.45), e[1] - 11 * Math.sin(ang + 0.45)); cx.fill();
  }
  function line(pts) { cx.beginPath(); pts.forEach(function (q, i) { if (i) cx.lineTo(q[0], q[1]); else cx.moveTo(q[0], q[1]); }); cx.stroke(); }
  function swords(x, y, a) { cx.strokeStyle = 'rgba(255,230,200,' + a + ')'; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(x - 7, y - 7); cx.lineTo(x + 7, y + 7); cx.moveTo(x + 7, y - 7); cx.lineTo(x - 7, y + 7); cx.stroke(); }

  // where each unit is drawn this frame: its hex, or along its day's steps while they play
  V.positions = function (st, t) {
    var out = {};
    st.units.forEach(function (u) { var q = V.center(u.at); out[u.id] = { x: q[0], y: q[1] + s * 0.18, key: SN.key(u.at) }; });
    if (V.anim) {
      var f = Math.min(1, (t - V.anim.t0) / V.anim.dur), byU = {};
      V.anim.steps.forEach(function (sp) { (byU[sp.id] = byU[sp.id] || []).push(sp); });
      Object.keys(byU).forEach(function (id) {
        var sps = byU[id], cur = V.center(sps[0].from), k = SN.key(sps[0].from), t0 = 0;
        for (var i = 0; i < sps.length; i++) {
          var sp = sps[i], a = V.center(sp.from), b = V.center(sp.to);
          if (f >= sp.t) { cur = b; k = SN.key(sp.to); t0 = sp.t; continue; }
          var g = Math.max(0, Math.min(1, (f - t0) / Math.max(0.0001, sp.t - t0))); cur = [a[0] + (b[0] - a[0]) * g, a[1] + (b[1] - a[1]) * g]; k = SN.key(sp.from); break;
        }
        out[id] = { x: cur[0], y: cur[1] + s * 0.18, key: k };
      });
    }
    return out;
  };
  // a stack: three to five figures of its sheets in a little formation, its hero in front, and its badge
  function stack(st, u, x, y, t, crowd) {
    var face = u.side === 'ours' ? 2 : 6, nx = u.order && u.order.path && u.order.path[0];
    if (nx && u.side === 'ours') { var d = SN.dirTo(u.at, nx); if (d >= 0) face = FACE[d]; }
    var k = crowd > 1 ? 0.62 : 1, sheets = u.sheets || [], heroes = SN.heroesOf(u), hgt = s * 0.82 * k;
    var n = u.party ? 4 : Math.max(heroes.length ? 1 : 2, Math.min(crowd > 1 ? 3 : 5, Math.ceil((u.figs || 0) / 2) + heroes.length));
    var slots = [[0, 0.05], [-0.26 * k, -0.1], [0.26 * k, -0.1], [-0.13 * k, -0.24], [0.13 * k, -0.24]];
    if (u.party) slots = [[-0.27 * k, 0.04], [-0.09 * k, -0.06], [0.09 * k, 0.04], [0.27 * k, -0.06]];
    if (u.state === 'rout' || u.state === 'withdraw' || u.state === 'home') cx.globalAlpha = 0.6;
    for (var i = n - 1; i >= 0; i--) {
      var sl = slots[i], nm = u.party ? sheets[i] : (i === 0 && heroes.length ? sheets[0] : sheets[(heroes.length ? 1 : 0) + (i % Math.max(1, sheets.length - (heroes.length ? 1 : 0)))] || sheets[0]);
      figure(nm, face, x + sl[0] * s, y + sl[1] * s, hgt, t + i * 7);
    }
    cx.globalAlpha = 1;
    badge(st, u, x + s * 0.3 * k, y - s * 0.62 * k, k);
  }
  function badge(st, u, x, y, k) {
    var w = s * 0.46 * (k || 1), h = s * 0.46 * (k || 1), col = SIDE[u.side] || '#888';
    cx.beginPath(); cx.moveTo(x - w / 2, y - h / 2); cx.lineTo(x + w / 2, y - h / 2); cx.lineTo(x + w / 2, y + h * 0.1); cx.quadraticCurveTo(x + w / 2, y + h * 0.45, x, y + h * 0.6); cx.quadraticCurveTo(x - w / 2, y + h * 0.45, x - w / 2, y + h * 0.1); cx.closePath();
    cx.fillStyle = col; cx.fill(); cx.lineWidth = u.id === V.sel ? 3 : 1.5; cx.strokeStyle = u.id === V.sel ? '#ffd25a' : '#1a1410'; cx.stroke();
    var heroes = SN.heroesOf(u).length, txt = u.party ? '4' : String(u.figs || 0);
    cx.font = 'bold ' + Math.max(10, Math.round(s * 0.3 * (k || 1))) + 'px Georgia, serif'; cx.textAlign = 'center'; cx.fillStyle = '#fff'; cx.fillText(txt, x, y + s * 0.08);
    if (heroes || u.party) { cx.fillStyle = '#ffe08a'; cx.font = Math.max(8, Math.round(s * 0.2 * (k || 1))) + 'px Georgia'; cx.fillText(u.party ? '★★' : heroes > 1 ? '★' + heroes : '★', x, y - h * 0.62); }
    if (u.side === 'ours' && SN.canOrder(st, u) && u.order && u.order.type === 'hold' && !V.anim) { cx.fillStyle = 'rgba(255,210,90,0.9)'; cx.beginPath(); cx.arc(x + w * 0.55, y - h * 0.5, 3, 0, Math.PI * 2); cx.fill(); } // (no order written yet: a gold dot)
    if (u.order && u.order.type === 'support' && u.side === 'ours') { cx.fillStyle = '#ffe08a'; cx.font = Math.max(8, Math.round(s * 0.2 * (k || 1))) + 'px Georgia'; cx.fillText('⚔?', x - w * 0.75, y + h * 0.1); }
    if (u.state === 'rout' || u.state === 'retreat' || u.stand >= st.day) { cx.fillStyle = '#ff9a7a'; cx.font = Math.max(8, Math.round(s * 0.2 * (k || 1))) + 'px Georgia'; cx.fillText(u.state === 'rout' ? 'ROUT' : 'RALLY', x, y + h * 0.95); }
    if (u.out) { cx.fillStyle = '#ff9a7a'; cx.font = Math.max(8, Math.round(s * 0.2 * (k || 1))) + 'px Georgia'; cx.fillText('DOWN', x, y + h * 0.95); }
  }
  V.size = function () { return s; };
})();
