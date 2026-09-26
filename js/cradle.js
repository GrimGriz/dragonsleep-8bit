/* DRAGONSLEEP — the cradle: a shift at the pens, drawn at full resolution.
   For as long as the scene runs, a second canvas sits over the 8-bit screen and the lamp, the
   timber, the animal and the hands are drawn there with gradients, curves and light. When the shift
   is over the canvas goes away and the game is 8-bit again. Nothing here touches the rest of the game.
   The rules under it are the register's: six draws a shift because the settle wears off, Animal
   Handling or Nature for the hands, and a feeler that comes off the bar is the touch at CON 13. */
'use strict';
(function () {
  var DS = window.DS, I = DS.input;
  var VW = 1024, VH = 960, TAU = Math.PI * 2, HPI = Math.PI / 2;
  var DRAWS = 6, DC = 13, TENTS = 8, N = 13;
  var LAMP = { x: 150, y: 208 }, BAR_Y = 702, TIP_Y = 806;
  var COL = { bone: '#e8dcc0', gold: '#f0c060', dim: '#9a9ab0', red: '#e04030', venom: '#c8f070', wax: '#a02c20' };
  var SERIF = 'Georgia, "Noto Serif", "Times New Roman", serif';
  var SANS = 'ui-sans-serif, system-ui, "Segoe UI", Roboto, Helvetica, sans-serif';
  var MOUTHS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function easeOut(t) { t = clamp(t, 0, 1); return 1 - (1 - t) * (1 - t); }
  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  function rgba(hex, a) { var v = DS.hexToInt(hex); return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a + ')'; }
  function shade(hex, k) { return k < 1 ? DS.mix(hex, '#000000', 1 - k) : DS.mix(hex, '#ffffff', Math.min(1, k - 1)); }
  function font(o) { return (o.italic ? 'italic ' : '') + (o.weight || 400) + ' ' + (o.size || 20) + 'px ' + (o.sans ? SANS : SERIF); }
  function txt(ctx, s, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.font = font(o); ctx.fillStyle = o.color || COL.bone; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    try { ctx.letterSpacing = (o.spacing || 0) + 'px'; } catch (e) { }
    if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 2; }
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  function wrapText(ctx, s, o, maxW) {
    ctx.save(); ctx.font = font(o);
    var words = String(s).split(' '), lines = [], line = '';
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line);
    ctx.restore();
    return lines;
  }

  // ------------------------------------------------------------------ the overlay canvas
  var FX = { c: null, ctx: null, key: '', w: 0, h: 0, s: 1, rock: null, crib: null, grain: null };
  function fxInit() {
    if (FX.ctx) return true;
    if (!DS.canvas || !document.body) return false;
    var c = document.getElementById('fx');
    if (!c) { c = document.createElement('canvas'); c.id = 'fx'; c.setAttribute('aria-hidden', 'true'); document.body.appendChild(c); }
    c.style.position = 'fixed'; c.style.pointerEvents = 'none'; c.style.zIndex = '3';
    FX.c = c; FX.ctx = c.getContext('2d');
    return !!FX.ctx;
  }
  function fxPlace() { // sit exactly over the 8-bit screen; back it with the device's pixels
    var r = DS.canvas.getBoundingClientRect();
    var key = [r.left, r.top, r.width, r.height].map(function (v) { return Math.round(v * 4); }).join(',');
    if (key === FX.key) return;
    FX.key = key;
    FX.c.style.left = r.left + 'px'; FX.c.style.top = r.top + 'px'; FX.c.style.width = r.width + 'px'; FX.c.style.height = r.height + 'px';
    var d = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(r.width * d), h = Math.round(r.height * d);
    if (w > 1600) { h = Math.round(h * 1600 / w); w = 1600; }
    if (w < 16 || h < 16) { w = 512; h = 480; }
    if (w !== FX.w || h !== FX.h) { FX.c.width = FX.w = w; FX.c.height = FX.h = h; FX.rock = FX.crib = null; }
    FX.s = w / VW;
  }
  function fxShow(on) { if (!fxInit()) return; FX.c.style.display = on ? 'block' : 'none'; if (on) { FX.key = ''; fxPlace(); } }
  function layer() { var c = document.createElement('canvas'); c.width = FX.w; c.height = FX.h; var x = c.getContext('2d'); x.setTransform(FX.s, 0, 0, FX.s, 0, 0); return { c: c, x: x }; }

  // ------------------------------------------------------------------ painters: timber, rock, the crib
  function timber(x, px, py, w, h, seed) {
    var vert = h > w;
    var g = vert ? x.createLinearGradient(px, 0, px + w, 0) : x.createLinearGradient(0, py, 0, py + h);
    g.addColorStop(0, '#6e4c2c'); g.addColorStop(0.4, '#4a3220'); g.addColorStop(1, '#261709');
    x.fillStyle = g; x.fillRect(px, py, w, h);
    var rng = DS.mulberry32(seed || 5); x.strokeStyle = 'rgba(0,0,0,0.28)'; x.lineWidth = 1.5;
    var n = Math.floor((vert ? w : h) / 5);
    for (var i = 0; i < n; i++) {
      x.beginPath();
      if (vert) { var gx = px + 3 + rng() * (w - 6); x.moveTo(gx, py); x.bezierCurveTo(gx + (rng() - 0.5) * 8, py + h * 0.3, gx + (rng() - 0.5) * 8, py + h * 0.7, gx + (rng() - 0.5) * 4, py + h); }
      else { var gy = py + 3 + rng() * (h - 6); x.moveTo(px, gy); x.bezierCurveTo(px + w * 0.3, gy + (rng() - 0.5) * 8, px + w * 0.7, gy + (rng() - 0.5) * 8, px + w, gy + (rng() - 0.5) * 4); }
      x.stroke();
    }
    x.fillStyle = 'rgba(255,214,160,0.14)'; if (vert) x.fillRect(px, py, 3, h); else x.fillRect(px, py, w, 3);
    x.fillStyle = 'rgba(0,0,0,0.4)'; if (vert) x.fillRect(px + w - 4, py, 4, h); else x.fillRect(px, py + h - 4, w, 4);
  }
  function buildRock() {
    var L = layer(), x = L.x, rng = DS.mulberry32(23), i;
    var g = x.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#0b0d1c'); g.addColorStop(0.5, '#181a2c'); g.addColorStop(1, '#07070c');
    x.fillStyle = g; x.fillRect(0, 0, VW, VH);
    for (i = 0; i < 110; i++) {
      var bx = rng() * VW, by = rng() * 720, br = 30 + rng() * 150, dark = rng() < 0.55;
      var rg = x.createRadialGradient(bx, by, 0, bx, by, br);
      rg.addColorStop(0, dark ? 'rgba(6,6,14,0.55)' : 'rgba(44,48,70,0.45)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = rg; x.fillRect(bx - br, by - br, br * 2, br * 2);
    }
    x.fillStyle = 'rgba(210,214,236,0.06)';
    for (i = 0; i < 900; i++) x.fillRect(rng() * VW, rng() * 740, 1 + rng() * 3, 1 + rng() * 2);
    x.strokeStyle = 'rgba(200,208,230,0.09)'; x.lineWidth = 2; // the old silver: pale streaks in the rock
    for (i = 0; i < 14; i++) { var sx = rng() * VW, sy = rng() * 600; x.beginPath(); x.moveTo(sx, sy); x.bezierCurveTo(sx + 40, sy + 40, sx + 70, sy + 100, sx + (rng() - 0.3) * 160, sy + 180); x.stroke(); }
    var fg = x.createLinearGradient(0, 735, 0, VH); fg.addColorStop(0, '#171310'); fg.addColorStop(0.3, '#0e0b08'); fg.addColorStop(1, '#020202');
    x.fillStyle = fg; x.fillRect(0, 735, VW, VH - 735);
    for (i = 0; i < 120; i++) { // straw
      var fx0 = rng() * VW, fy0 = 745 + rng() * 215;
      x.strokeStyle = 'rgba(' + (rng() < 0.5 ? '150,120,70' : '90,70,40') + ',0.3)'; x.lineWidth = 1.5 + rng();
      x.beginPath(); x.moveTo(fx0, fy0); x.lineTo(fx0 + (rng() - 0.5) * 70, fy0 + (rng() - 0.5) * 10); x.stroke();
    }
    // the lantern's chain and cage (the flame is drawn live)
    x.strokeStyle = '#2a2a30'; x.lineWidth = 5; x.setLineDash([9, 7]); x.beginPath(); x.moveTo(LAMP.x, 0); x.lineTo(LAMP.x, 150); x.stroke(); x.setLineDash([]);
    x.fillStyle = '#1c1c22'; x.fillRect(LAMP.x - 30, 150, 60, 12); x.fillRect(LAMP.x - 26, 240, 52, 10);
    x.strokeStyle = '#26262e'; x.lineWidth = 4; [-22, -8, 8, 22].forEach(function (dx) { x.beginPath(); x.moveTo(LAMP.x + dx, 162); x.lineTo(LAMP.x + dx, 240); x.stroke(); });
    return L.c;
  }
  function buildCrib() {
    var L = layer(), x = L.x;
    x.fillStyle = '#07080c'; x.fillRect(150, 500, 740, 190);
    timber(x, 150, 540, 740, 30, 31); timber(x, 150, 598, 740, 30, 32); timber(x, 150, 656, 740, 30, 33);
    timber(x, 132, 486, 776, 26, 34);
    timber(x, 116, 392, 40, 400, 35); timber(x, 884, 392, 40, 400, 36);
    x.fillStyle = '#5a5a62';
    [[136, 500], [904, 500], [136, 670], [904, 670]].forEach(function (p) { x.beginPath(); x.arc(p[0], p[1], 5, 0, TAU); x.fill(); });
    return L.c;
  }
  function buildGrain() {
    var c = document.createElement('canvas'); c.width = c.height = 160;
    var x = c.getContext('2d'), img = x.createImageData(160, 160), d = img.data, rng = DS.mulberry32(99);
    for (var i = 0; i < d.length; i += 4) { var v = 110 + rng() * 60; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    x.putImageData(img, 0, 0);
    return c;
  }

  // ------------------------------------------------------------------ a feeler: a chain of points, pinned under the bar
  function Tentacle(i, gapY) {
    var px = 292 + i * 78, sway = (i - 3.5) * 5;
    this.i = i; this.root = { x: px + sway * 2 + (i % 2 ? 14 : -14), y: gapY }; this.pin = { x: px, y: BAR_Y + 4 };
    var tip = { x: px + sway, y: TIP_Y };
    this.pinI = 7; this.pinned = true; this.n = N; this.pts = [];
    for (var k = 0; k < N; k++) {
      var p;
      if (k <= this.pinI) { var u = k / this.pinI; p = { x: lerp(this.root.x, this.pin.x, u) + Math.sin(u * Math.PI) * (i % 2 ? 18 : -18), y: lerp(this.root.y, this.pin.y, u) }; }
      else { var v = (k - this.pinI) / (N - 1 - this.pinI); p = { x: lerp(this.pin.x, tip.x, v), y: lerp(this.pin.y, tip.y, v) }; }
      this.pts.push({ x: p.x, y: p.y, px: p.x, py: p.y });
    }
    this.rest = []; for (k = 1; k < N; k++) this.rest.push(dist(this.pts[k - 1], this.pts[k]) * (k <= this.pinI ? 1.14 : 1.05)); // slack, so they sag
    this.milked = false; this.ripe = 0.75 + Math.random() * 0.5; this.flinch = 0; this.swell = 0; this.state = '';
  }
  Tentacle.prototype.fixed = function (k) { return k === 0 || (this.pinned && k === this.pinI); };
  Tentacle.prototype.step = function (ts, t, unrest, pull) {
    var g = 0.28 * ts * ts, k;
    for (k = 1; k < this.n; k++) {
      if (this.fixed(k)) continue;
      var p = this.pts[k], vx = (p.x - p.px) * 0.95, vy = (p.y - p.py) * 0.95;
      p.px = p.x; p.py = p.y;
      var wig = Math.sin(t * 0.06 + k * 0.7 + this.i) * (0.06 + unrest * 0.28) * ts;
      if (this.flinch > 0) wig += (Math.random() - 0.5) * 4 * ts;
      p.x += vx * ts + wig; p.y += vy * ts + g;
    }
    if (pull) { var tip = this.pts[this.n - 1]; tip.x += (pull.x - tip.x) * 0.3; tip.y += (pull.y - tip.y) * 0.3; }
    for (var it = 0; it < 6; it++) {
      this.pts[0].x = this.root.x; this.pts[0].y = this.root.y;
      if (this.pinned) { this.pts[this.pinI].x = this.pin.x; this.pts[this.pinI].y = this.pin.y; }
      for (k = 1; k < this.n; k++) {
        var a = this.pts[k - 1], b = this.pts[k], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 0.001, diff = (d - this.rest[k - 1]) / d;
        var wa = this.fixed(k - 1) ? 0 : 1, wb = this.fixed(k) ? 0 : 1, s = wa + wb;
        if (!s) continue;
        a.x += dx * diff * wa / s; a.y += dy * diff * wa / s; b.x -= dx * diff * wb / s; b.y -= dy * diff * wb / s;
      }
    }
    if (this.flinch > 0) this.flinch -= ts;
  };
  Tentacle.prototype.tip = function () { return this.pts[this.n - 1]; };
  Tentacle.prototype.at = function (f) { // a point f (0..1) down the hanging part
    var k = this.pinI + clamp(f, 0, 1) * (this.n - 1 - this.pinI), i0 = Math.floor(k), i1 = Math.min(this.n - 1, i0 + 1), u = k - i0;
    return { x: lerp(this.pts[i0].x, this.pts[i1].x, u), y: lerp(this.pts[i0].y, this.pts[i1].y, u) };
  };
  Tentacle.prototype.whip = function () { // off the bar: the hanging part rears up at the milker
    this.pinned = false;
    for (var k = this.pinI; k < this.n; k++) { var p = this.pts[k], f = (k - this.pinI) / (this.n - 1 - this.pinI); p.py = p.y + 26 + 30 * f; p.px = p.x - (this.i < 4 ? -1 : 1) * 10 * f; }
  };

  function ribbon(ctx, pts, a, b, wf) { // a filled band around a polyline, half-width wf(k)
    var L = [], R = [], k;
    for (k = a; k <= b; k++) {
      var p = pts[k], q = pts[Math.min(b, k + 1)], o = pts[Math.max(a, k - 1)];
      var dx = q.x - o.x, dy = q.y - o.y, d = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / d, ny = dx / d, w = wf(k);
      L.push([p.x + nx * w, p.y + ny * w]); R.push([p.x - nx * w, p.y - ny * w]);
    }
    ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
    for (k = 1; k < L.length; k++) ctx.lineTo(L[k][0], L[k][1]);
    for (k = R.length - 1; k >= 0; k--) ctx.lineTo(R[k][0], R[k][1]);
    ctx.closePath();
  }
  function normalAt(pts, a, b, k) {
    var q = pts[Math.min(b, k + 1)], o = pts[Math.max(a, k - 1)], dx = q.x - o.x, dy = q.y - o.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
    return { nx: -dy / d, ny: dx / d, tx: dx / d, ty: dy / d };
  }
  function drawTent(ctx, T, part, glowV) {
    var a = part === 'above' ? 0 : T.pinI, b = part === 'above' ? T.pinI : T.n - 1, pts = T.pts, k, n, p, w;
    var wf = function (k) { var f = k / (T.n - 1), w = 17 - 5 * f; if (!T.pinned && f > 0.55) w *= 1 + (f - 0.55) * 1.2; return w; };
    var g = ctx.createLinearGradient(pts[a].x - 40, 0, pts[a].x + 40, 0);
    g.addColorStop(0, '#d8c4dc'); g.addColorStop(0.45, '#a48bb2'); g.addColorStop(1, '#4e3a62');
    ribbon(ctx, pts, a, b, wf); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(36,20,48,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(40,20,50,0.28)'; ctx.lineWidth = 2; // the rings
    for (k = a + 1; k < b; k++) { p = pts[k]; n = normalAt(pts, a, b, k); w = wf(k); ctx.beginPath(); ctx.moveTo(p.x + n.nx * w, p.y + n.ny * w); ctx.quadraticCurveTo(p.x + n.tx * 4, p.y + n.ty * 4, p.x - n.nx * w, p.y - n.ny * w); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); for (k = a + 1; k <= b; k++) ctx.lineTo(pts[k].x, pts[k].y); // the vein of venom down the middle
    ctx.strokeStyle = rgba(COL.venom, 0.1 + 0.4 * (glowV || 0)); ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); // the wet edge, on the lamp's side
    for (k = a; k <= b; k++) { p = pts[k]; n = normalAt(pts, a, b, k); w = wf(k) * 0.55; var sx = n.nx < 0 ? 1 : -1; if (k === a) ctx.moveTo(p.x + n.nx * w * sx, p.y + n.ny * w * sx); else ctx.lineTo(p.x + n.nx * w * sx, p.y + n.ny * w * sx); }
    ctx.strokeStyle = 'rgba(255,240,255,0.35)'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }
  function drawGland(ctx, T, glow) {
    var p = T.tip(), r = 20 * (1 + T.swell * 0.6) * (T.pinned ? 1 : 1.7), ripe = T.milked ? 0.15 : T.ripe;
    if (glow > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.4); gg.addColorStop(0, rgba(COL.venom, 0.6 * glow)); gg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gg; ctx.fillRect(p.x - r * 3.4, p.y - r * 3.4, r * 6.8, r * 6.8);
      ctx.restore();
    }
    var g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
    g.addColorStop(0, DS.mix('#d8c8e0', COL.venom, 0.6 * ripe)); g.addColorStop(0.6, DS.mix('#9d84ac', '#a0c060', 0.5 * ripe)); g.addColorStop(1, '#4a3858');
    ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 1.15, 0, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(40,24,52,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(p.x - r * 0.3, p.y - r * 0.45, r * 0.28, r * 0.16, -0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(p.x, p.y + r * 0.92, r * 0.22, r * 0.1, 0, 0, TAU); ctx.fillStyle = '#2a1a30'; ctx.fill();
  }

  // ------------------------------------------------------------------ the animal
  var SEGS = [[262, 480, 52], [308, 470, 58], [360, 460, 64], [418, 451, 70], [482, 445, 75], [548, 440, 79], [614, 436, 82]];
  function segment(ctx, cx, cy, r, rng, head) {
    var g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.06, cx, cy, r);
    g.addColorStop(0, head ? '#95a66c' : '#86985e'); g.addColorStop(0.45, head ? '#55663f' : '#4a5b36'); g.addColorStop(0.85, '#1c2314'); g.addColorStop(1, '#0c0f09');
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.9, 0, 0, TAU); ctx.fillStyle = g; ctx.fill();
    var o = ctx.createRadialGradient(cx + r * 0.25, cy - r * 0.15, 0, cx + r * 0.25, cy - r * 0.15, r * 0.9); o.addColorStop(0, 'rgba(150,110,170,0.22)'); o.addColorStop(1, 'rgba(150,110,170,0)');
    ctx.fillStyle = o; ctx.fill(); // an oily sheen on the wet chitin
    ctx.strokeStyle = 'rgba(8,10,6,0.8)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, r - 4, r * 0.9 - 4, 0, -1.2, 1.2); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 8; ctx.stroke(); // the plate's far edge
    var k;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (k = 0; k < 18; k++) { var a = rng() * TAU, d = rng() * r * 0.8; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.9, 1.5 + rng() * 3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(200,220,150,0.13)';
    for (k = 0; k < 8; k++) { var a2 = rng() * TAU, d2 = rng() * r * 0.7; ctx.beginPath(); ctx.arc(cx + Math.cos(a2) * d2, cy + Math.sin(a2) * d2 * 0.9, 1 + rng() * 2, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(cx + r * 0.08, cy + r * 0.3, 4, 0, TAU); ctx.fillStyle = '#0d110a'; ctx.fill(); ctx.strokeStyle = 'rgba(200,210,160,0.3)'; ctx.lineWidth = 1.5; ctx.stroke(); // a spiracle
    ctx.beginPath(); ctx.ellipse(cx - r * 0.3, cy - r * 0.52, r * 0.34, r * 0.12, -0.3, 0, TAU); ctx.fillStyle = 'rgba(255,255,240,0.2)'; ctx.fill();
  }
  function mandible(ctx, x, y, dir) {
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 24 * dir, y + 4, x + 22 * dir, y + 26, x + 3 * dir, y + 36);
    ctx.bezierCurveTo(x + 12 * dir, y + 26, x + 14 * dir, y + 10, x, y + 6); ctx.closePath();
    var g = ctx.createLinearGradient(x + 24 * dir, y, x, y + 36); g.addColorStop(0, '#2c2c22'); g.addColorStop(1, '#070706');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(200,200,170,0.28)'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  function drawBody(ctx, t, unrest, look) {
    var breath = 1 + 0.018 * Math.sin(t * 0.04 * (1 + unrest)), rng = DS.mulberry32(7), f, s;
    ctx.save(); ctx.translate(0, 500); ctx.scale(1, breath); ctx.translate(0, -500);
    ctx.lineCap = 'round';
    for (f = 0; f < 3; f++) { // loose feelers behind the head, never still
      var bx = 758 + f * 14, by = 436 - f * 6, ph = t * 0.05 + f * 2;
      ctx.beginPath(); ctx.moveTo(bx, by);
      ctx.bezierCurveTo(bx + 40, by - 40 + Math.sin(ph) * 15, bx + 60 + Math.cos(ph) * 20, by - 90, bx + 40 + Math.sin(ph * 1.3) * 30, by - 130 - unrest * 24);
      ctx.strokeStyle = '#7e6690'; ctx.lineWidth = 11 - f; ctx.stroke(); ctx.strokeStyle = 'rgba(255,240,255,0.22)'; ctx.lineWidth = 2; ctx.stroke();
    }
    SEGS.forEach(function (q) { segment(ctx, q[0], q[1], q[2], rng, false); });
    var hx = 700, hy = 430;
    segment(ctx, hx, hy, 82, rng, true);
    var fp = ctx.createRadialGradient(hx, hy + 16, 4, hx, hy + 16, 56); fp.addColorStop(0, 'rgba(196,204,150,0.32)'); fp.addColorStop(1, 'rgba(196,204,150,0)');
    ctx.fillStyle = fp; ctx.beginPath(); ctx.ellipse(hx, hy + 16, 56, 48, 0, 0, TAU); ctx.fill();
    for (s = 0; s < 5; s++) { // the mouth's ring of feelers, going down behind the rail
      var sx = 664 + s * 18, sp = t * 0.07 + s;
      ctx.beginPath(); ctx.moveTo(sx, 462); ctx.quadraticCurveTo(sx + Math.sin(sp) * 8, 480, sx + Math.sin(sp * 0.7) * 6, 500);
      ctx.strokeStyle = '#9a82ad'; ctx.lineWidth = 7; ctx.stroke();
    }
    mandible(ctx, 674, 452, -1); mandible(ctx, 726, 452, 1);
    [[666, 398], [734, 394]].forEach(function (e) { // eyes: two dark domes, and a glint that follows the hand
      var ex = e[0], ey = e[1], dx = look.x - ex, dy = look.y - ey, d = Math.sqrt(dx * dx + dy * dy) || 1, gx = ex - 6 + dx / d * 7, gy = ey - 5 + dy / d * 5;
      if (unrest > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; var gg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 46); gg.addColorStop(0, 'rgba(230,220,110,' + (0.4 * unrest) + ')'); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.fillRect(ex - 46, ey - 46, 92, 92); ctx.restore(); }
      var g = ctx.createRadialGradient(ex - 5, ey - 5, 2, ex, ey, 21); g.addColorStop(0, DS.mix('#3c3c1c', '#c8c060', unrest * 0.7)); g.addColorStop(0.7, '#14140a'); g.addColorStop(1, '#0a0a04');
      ctx.beginPath(); ctx.ellipse(ex, ey, 21, 16, 0, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#0a0c06'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,220,0.07)'; ctx.lineWidth = 1;
      for (var i = -14; i <= 14; i += 7) { ctx.beginPath(); ctx.moveTo(ex + i, ey - 13); ctx.lineTo(ex + i, ey + 13); ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(gx, gy, 5.5, 3.5, -0.4, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.fill();
      ctx.beginPath(); ctx.arc(gx + 8, gy + 7, 1.8, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
    });
    [[688, 380], [700, 377], [712, 379]].forEach(function (o) { ctx.beginPath(); ctx.arc(o[0], o[1], 2.6, 0, TAU); ctx.fillStyle = '#dcdc9c'; ctx.fill(); });
    ctx.restore();
  }

  // ------------------------------------------------------------------ light
  function drawLamp(ctx, flick) {
    var x = LAMP.x, y = LAMP.y;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createRadialGradient(x, y, 0, x, y, 42 * flick); g.addColorStop(0, 'rgba(255,250,220,0.95)'); g.addColorStop(0.35, 'rgba(255,190,90,0.8)'); g.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 60, y - 60, 120, 120);
    var g2 = ctx.createRadialGradient(x, y, 0, x, y, 300); g2.addColorStop(0, 'rgba(255,170,70,' + (0.28 * flick) + ')'); g2.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = g2; ctx.fillRect(x - 300, y - 300, 600, 600);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,220,160,0.08)'; ctx.fillRect(x - 26, 162, 52, 78);
  }
  function drawLight(ctx, flick) {
    var g = ctx.createRadialGradient(LAMP.x, LAMP.y, 180, LAMP.x, LAMP.y, 1150);
    g.addColorStop(0, 'rgba(3,4,10,0)'); g.addColorStop(0.5, 'rgba(3,4,10,0.35)'); g.addColorStop(1, 'rgba(3,4,10,0.86)');
    ctx.fillStyle = g; ctx.fillRect(-700, -700, VW + 1400, VH + 1400);
    ctx.save(); ctx.globalCompositeOperation = 'overlay';
    var w = ctx.createRadialGradient(LAMP.x, LAMP.y, 0, LAMP.x, LAMP.y, 700); w.addColorStop(0, 'rgba(255,180,90,' + (0.5 * flick) + ')'); w.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = w; ctx.fillRect(-700, -700, VW + 1400, VH + 1400);
    ctx.restore();
  }

  // ------------------------------------------------------------------ the milker's hands and the thimble
  function arm(ctx, from, to, skin, w) {
    var dx = to.x - from.x, dy = to.y - from.y, d = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / d, ny = dx / d;
    if (nx + ny > 0) { nx = -nx; ny = -ny; } // +n faces the lamp
    var mx = lerp(from.x, to.x, 0.5), my = lerp(from.y, to.y, 0.5), wx = lerp(from.x, to.x, 0.56), wy = lerp(from.y, to.y, 0.56);
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(mx, my); ctx.strokeStyle = '#33261d'; ctx.lineWidth = w * 1.22; ctx.stroke(); // the sleeve
    var g = ctx.createLinearGradient(mx - nx * w, my - ny * w, mx + nx * w, my + ny * w);
    g.addColorStop(0, shade(skin, 0.28)); g.addColorStop(0.55, shade(skin, 0.58)); g.addColorStop(1, shade(skin, 0.92));
    ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(to.x, to.y); ctx.strokeStyle = g; ctx.lineWidth = w; ctx.stroke();
    ctx.lineCap = 'butt'; // a leather wrap at the wrist
    ctx.beginPath(); ctx.moveTo(wx - dx / d * 12, wy - dy / d * 12); ctx.lineTo(wx + dx / d * 12, wy + dy / d * 12); ctx.strokeStyle = '#4a3324'; ctx.lineWidth = w * 1.06; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(wx - dx / d * 12, wy - dy / d * 12); ctx.lineTo(wx + dx / d * 12, wy + dy / d * 12); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
  function hand(ctx, x, y, skin, rx, ry, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    var g = ctx.createRadialGradient(-rx * 0.45, -ry * 0.55, 2, 0, 0, rx * 1.1); g.addColorStop(0, shade(skin, 0.88)); g.addColorStop(0.6, shade(skin, 0.55)); g.addColorStop(1, shade(skin, 0.3));
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  function finger(ctx, x0, y0, x1, y1, skin, w) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = w + 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.strokeStyle = shade(skin, 0.6); ctx.lineWidth = w; ctx.stroke();
    var dx = x1 - x0, dy = y1 - y0, d = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / d, ny = dx / d; if (nx + ny > 0) { nx = -nx; ny = -ny; }
    ctx.beginPath(); ctx.moveTo(x0 + nx * w * 0.3, y0 + ny * w * 0.3); ctx.lineTo(x1 + nx * w * 0.3, y1 + ny * w * 0.3); ctx.strokeStyle = rgba(shade(skin, 0.95), 0.55); ctx.lineWidth = w * 0.3; ctx.stroke();
    ctx.beginPath(); ctx.arc(x1, y1, w * 0.42, 0, TAU); ctx.fillStyle = shade(skin, 0.75); ctx.fill();
    ctx.restore();
  }
  function drawThimble(ctx, x, y, level, sealed, scale, rot, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(scale || 1, scale || 1);
    if (alpha != null) ctx.globalAlpha *= alpha;
    var g = ctx.createLinearGradient(-22, 0, 22, 0); g.addColorStop(0, '#e6d8b8'); g.addColorStop(0.5, '#b8a888'); g.addColorStop(1, '#6a5a44');
    ctx.beginPath(); ctx.moveTo(-21, 0); ctx.lineTo(21, 0); ctx.lineTo(15, 46); ctx.lineTo(-15, 46); ctx.closePath();
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#3a3020'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, 21, 7, 0, 0, TAU); ctx.fillStyle = '#2a2418'; ctx.fill(); ctx.strokeStyle = '#8a7a60'; ctx.stroke();
    if (level > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.ellipse(0, 0, 19 * level, 5.5 * level, 0, 0, TAU); ctx.fillStyle = rgba(COL.venom, 0.8); ctx.fill(); ctx.restore(); }
    if (sealed) {
      ctx.beginPath(); ctx.ellipse(0, -1, 20, 8, 0, 0, TAU); ctx.fillStyle = COL.wax; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -1, 9, 3.5, 0, 0, TAU); ctx.fillStyle = '#6a1a12'; ctx.fill();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ the ring, the die, a panel
  function drawRing(ctx, cx, cy, r, p, c, w, whipAt, hot, shiver, active, alpha) {
    var a0 = -HPI;
    function ang(v) { return a0 + clamp(v, 0, 1) * TAU; }
    ctx.save(); ctx.lineCap = 'butt'; ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.strokeStyle = 'rgba(10,10,16,0.55)'; ctx.lineWidth = 14; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.strokeStyle = 'rgba(232,220,192,0.18)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r, ang(whipAt), ang(1)); ctx.strokeStyle = 'rgba(224,64,48,0.8)'; ctx.lineWidth = 10; ctx.stroke();
    var sh = shiver ? (Math.random() - 0.5) * 0.03 : 0;
    ctx.beginPath(); ctx.arc(cx, cy, r, ang(c - w + sh), ang(c + w + sh)); ctx.strokeStyle = hot ? '#fff2c0' : COL.gold; ctx.lineWidth = hot ? 14 : 10; ctx.stroke();
    if (hot) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.arc(cx, cy, r, ang(c - w), ang(c + w)); ctx.strokeStyle = 'rgba(240,192,96,0.45)'; ctx.lineWidth = 28; ctx.stroke(); ctx.restore(); }
    if (active) {
      ctx.beginPath(); ctx.arc(cx, cy, r, ang(0), ang(p)); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 10; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r, ang(0), ang(p)); ctx.strokeStyle = '#fbfbf4'; ctx.lineWidth = 6; ctx.stroke();
      var hx = cx + Math.cos(ang(p)) * r, hy = cy + Math.sin(ang(p)) * r;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.arc(hx, hy, 16, 0, TAU); ctx.fillStyle = 'rgba(255,255,230,0.35)'; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(hx, hy, 8, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
    }
    ctx.restore();
  }
  function drawDie(ctx, cx, cy, s, n, col, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(cx, cy);
    ctx.beginPath(); for (var k = 0; k < 6; k++) { var a = -HPI + k * TAU / 6; ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s); } ctx.closePath();
    var g = ctx.createLinearGradient(-s, -s, s, s); g.addColorStop(0, '#3a3450'); g.addColorStop(1, '#141220');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath();
    [-HPI, -HPI + TAU / 3, -HPI + 2 * TAU / 3].forEach(function (a, i) { var x = Math.cos(a) * s * 0.62, y = Math.sin(a) * s * 0.62; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.closePath(); ctx.strokeStyle = rgba(col, 0.45); ctx.lineWidth = 2; ctx.stroke();
    txt(ctx, String(n), 0, s * 0.3, { size: s * 0.85, weight: 700, color: col, align: 'center' });
    ctx.restore();
  }
  function panel(ctx, x, y, w, h, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.fillStyle = 'rgba(6,6,14,0.82)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(232,220,192,0.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
    ctx.restore();
  }

  // ------------------------------------------------------------------ sound: the cave's air and the work, on the game's sfx bus
  var SND = { c: null, bus: null, noise: null, drone: null, sq: null };
  function sndOn() {
    var AU = DS.audio; if (!AU || !AU.buses) return false;
    var b = AU.buses(); if (!b || !b.ctx || b.ctx.state !== 'running') return false;
    SND.c = b.ctx; SND.bus = b.sfx;
    if (!SND.noise) { var buf = SND.c.createBuffer(1, SND.c.sampleRate, SND.c.sampleRate), d = buf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; SND.noise = buf; }
    return true;
  }
  function tone(type, f0, f1, dur, vol, delay) {
    if (!sndOn()) return;
    try {
      var c = SND.c, t = c.currentTime + (delay || 0) + 0.01, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(SND.bus); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { }
  }
  function hiss(dur, vol, freq, q, delay, f1) {
    if (!sndOn()) return;
    try {
      var c = SND.c, t = c.currentTime + (delay || 0) + 0.01, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = SND.noise; s.loop = true; f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q || 1;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(SND.bus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
    } catch (e) { }
  }
  function droneStart() {
    if (!sndOn() || SND.drone) return;
    try {
      var c = SND.c, t = c.currentTime, g = c.createGain(), lp = c.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 220; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11, t + 2.5);
      var o1 = c.createOscillator(), o2 = c.createOscillator(); o1.type = 'triangle'; o2.type = 'sine'; o1.frequency.value = 49; o2.frequency.value = 49.6;
      var air = c.createBufferSource(), af = c.createBiquadFilter(), ag = c.createGain();
      air.buffer = SND.noise; air.loop = true; af.type = 'lowpass'; af.frequency.value = 420; ag.gain.value = 0.18;
      o1.connect(lp); o2.connect(lp); air.connect(af); af.connect(ag); ag.connect(lp); lp.connect(g); g.connect(SND.bus);
      o1.start(t); o2.start(t); air.start(t, Math.random());
      SND.drone = { g: g, stop: function () { var tt = c.currentTime; g.gain.cancelScheduledValues(tt); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), tt); g.gain.exponentialRampToValueAtTime(0.0001, tt + 1.2); setTimeout(function () { try { o1.stop(); o2.stop(); air.stop(); } catch (e) { } }, 1400); } };
    } catch (e) { }
  }
  function droneStop() { if (SND.drone) { try { SND.drone.stop(); } catch (e) { } SND.drone = null; } }
  function squeezeOn() {
    if (!sndOn() || SND.sq) return;
    try {
      var c = SND.c, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = SND.noise; s.loop = true; f.type = 'bandpass'; f.Q.value = 5; f.frequency.value = 220;
      g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.linearRampToValueAtTime(0.07, c.currentTime + 0.08);
      s.connect(f); f.connect(g); g.connect(SND.bus); s.start(c.currentTime, Math.random());
      SND.sq = { s: s, f: f, g: g };
    } catch (e) { }
  }
  function squeezeSet(p) { if (SND.sq) { try { SND.sq.f.frequency.setTargetAtTime(220 + p * 2400, SND.c.currentTime, 0.03); SND.sq.g.gain.setTargetAtTime(0.05 + p * 0.06, SND.c.currentTime, 0.05); } catch (e) { } } }
  function squeezeOff() { if (SND.sq) { try { var q = SND.sq, t = SND.c.currentTime; q.g.gain.cancelScheduledValues(t); q.g.gain.setTargetAtTime(0.0001, t, 0.03); setTimeout(function () { try { q.s.stop(); } catch (e) { } }, 200); } catch (e) { } SND.sq = null; } }
  var SFX = {
    drip: function () { tone('sine', 1500, 700, 0.11, 0.05); tone('sine', 1500, 700, 0.11, 0.025, 0.19); },
    clean: function () { tone('sine', 250, 100, 0.14, 0.2); hiss(0.4, 0.07, 5000, 0.8, 0.14); tone('triangle', 1760, 0, 0.5, 0.05, 0.42); tone('triangle', 2637, 0, 0.4, 0.03, 0.44); },
    dry: function () { hiss(0.09, 0.05, 900, 1); tone('triangle', 95, 70, 0.1, 0.08); },
    spilt: function () { hiss(0.22, 0.07, 2500, 1); tone('sine', 900, 420, 0.1, 0.04, 0.05); },
    whip: function () { hiss(0.07, 0.5, 3000, 0.5); tone('sine', 70, 35, 0.35, 0.4, 0.02); },
    heart: function (v) { tone('sine', 55, 40, 0.16, 0.35 * v); tone('sine', 50, 38, 0.14, 0.25 * v, 0.22); },
    tick: function () { tone('square', 900, 0, 0.02, 0.035); },
    holds: function () { tone('triangle', 440, 660, 0.2, 0.1); },
    touch: function () { tone('sawtooth', 220, 55, 0.9, 0.14); hiss(0.6, 0.12, 400, 0.5, 0, 90); },
    flinch: function () { hiss(0.05, 0.08, 1200, 1); },
    seal: function () { hiss(0.08, 0.12, 6000, 1); tone('sine', 140, 90, 0.08, 0.15, 0.02); }
  };

  // ------------------------------------------------------------------ the scene
  function CradleScene(o) {
    this.kind = 'cradle'; this.opaque = true;
    this.h = o.hero; this.skill = o.skill || 0; this.skillName = o.skillName || 'Animal Handling'; this.draught = !!o.draught;
    this.mouth = o.mouth || 2; this.first = !o.shifts;
    var look = DS.LOOKS[this.h.look] || DS.LOOKS.worker; this.skin = look.skin || '#e8b890';
    this.t = 0; this.ts = 1; this.phase = 'intro'; this.pt = 0;
    this.tents = []; for (var i = 0; i < TENTS; i++) this.tents.push(new Tentacle(i, i % 2 ? 584 : 642));
    this.sel = 3; this.draws = 0; this.got = 0; this.perfect = 0; this.touched = false; this.slots = [];
    this.p = 0; this.band = null; this.twitch = null; this.twitched = false;
    this.result = { got: 0, touched: false, perfect: 0 };
    this.cam = { x: 700, y: 430, z: 1.35, sx: 0, sy: 0, rot: 0 }; this.camT = { x: 512, y: 560, z: 1 };
    this.shake = 0; this.flick = 1; this.flickT = 1;
    this.motes = []; for (i = 0; i < 70; i++) this.motes.push({ x: Math.random() * VW, y: Math.random() * 760, vx: (Math.random() - 0.5) * 0.25, vy: -0.05 - Math.random() * 0.15, r: 1 + Math.random() * 2.2, a: 0.3 + Math.random() * 0.7 });
    this.parts = []; this.cap = null; this.anim = null; this.save = null;
    this.hand = { x: 0, y: 0 }; this.pinch = { x: 0, y: 0 }; this.jerk = false; this.thimble = { level: 0, sealed: false };
    this.fade = 1; this.dripT = 120;
    this.sub = 'Mouth ' + (MOUTHS[this.mouth] || this.mouth) + '  ·  ' + this.h.name + '  ·  ' + this.skillName + ' ' + DS.sgn(this.skill) + (this.draught ? '  ·  draught taken' : '');
    var tip = this.cur().tip(); this.hand.x = tip.x; this.hand.y = tip.y; this.pinch.x = tip.x; this.pinch.y = tip.y - 60;
  }
  DS.CradleScene = CradleScene;
  CradleScene.prototype.enter = function () { fxShow(true); droneStart(); };
  CradleScene.prototype.exit = function () { squeezeOff(); droneStop(); fxShow(false); };
  CradleScene.prototype.cur = function () { return this.tents[this.sel]; };
  CradleScene.prototype.unrest = function () { return clamp((this.draws - 1) / (DRAWS - 1), 0, 1); };
  CradleScene.prototype.setPhase = function (p) { this.phase = p; this.pt = 0; };
  CradleScene.prototype.caption = function (key, vars, life) { var s = DS.L(key, vars); this.cap = { s: Array.isArray(s) ? s[0] : s, t: 0, life: life || 150 }; };
  CradleScene.prototype.makeBand = function () {
    var T = this.cur(), w = clamp(0.055 + 0.018 * this.skill, 0.035, 0.17) * T.ripe * (1 - 0.3 * this.unrest()); // the gold narrows as the settle wears (tuned 09-25)
    this.band = { c: 0.42 + Math.random() * 0.34, w: w, phase: Math.random() * TAU, jump: 0 };
  };
  CradleScene.prototype.bandC = function () {
    var b = this.band; if (!b) return 0.6;
    var u = this.unrest(); // the drift widens and quickens as the settle wears (tuned 09-25: the late draws were too easy)
    return b.c + (0.015 + 0.09 * u) * Math.sin(this.t * (0.035 + 0.03 * u) + b.phase) + b.jump;
  };
  CradleScene.prototype.pickNext = function () { // the ripest feeler left
    var best = -1, bi = this.sel;
    this.tents.forEach(function (T, i) { if (!T.milked && T.ripe > best) { best = T.ripe; bi = i; } });
    this.sel = bi; this.makeBand();
  };
  CradleScene.prototype.cycle = function (d) {
    var free = []; this.tents.forEach(function (T, i) { if (!T.milked) free.push(i); });
    if (free.length < 2) return;
    var k = free.indexOf(this.sel); k = (k + d + free.length) % free.length; this.sel = free[k]; this.makeBand();
    DS.audio.sfx('cursor');
  };
  CradleScene.prototype.spray = function (n, col, spread) {
    var p = this.cur().tip();
    for (var i = 0; i < n; i++) { var a = -HPI + (Math.random() - 0.5) * (spread || 2.4), v = 2 + Math.random() * 5; this.parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 30 + Math.random() * 30, r: 2 + Math.random() * 4, col: col }); }
  };

  CradleScene.prototype.update = function () {
    this.t++; this.pt++;
    var ts = this.ts, T = this.cur(), unrest = this.unrest(), self = this;
    if (this.t % 5 === 0) this.flickT = 0.85 + Math.random() * 0.3;
    this.flick += (this.flickT - this.flick) * 0.25;
    // physics
    var pull = null;
    if (this.phase === 'squeeze') pull = { x: T.tip().x, y: TIP_Y + 6 + this.p * 22 };
    else if (this.phase === 'save' && this.pt < 46) pull = { x: T.pin.x + (T.i < 4 ? 40 : -40), y: 470 }; // off the bar, it rears up at you
    else if (this.phase === 'paralysis') pull = { x: this.hand.x - 30, y: this.hand.y + 62 }; // and finds the wrist
    this.tents.forEach(function (Q) { Q.step(ts, self.t, unrest, Q === T ? pull : null); });
    this.motes.forEach(function (m) { m.x += m.vx * ts; m.y += m.vy * ts; if (m.y < -10) { m.y = 760; m.x = Math.random() * VW; } if (m.x < -10) m.x = VW + 10; if (m.x > VW + 10) m.x = -10; });
    this.parts.forEach(function (q) { q.life += ts; q.x += q.vx * ts; q.y += q.vy * ts; q.vy += 0.12 * ts; });
    this.parts = this.parts.filter(function (q) { return q.life < q.max; });
    if (--this.dripT <= 0) { this.dripT = 90 + Math.random() * 220; SFX.drip(); }
    // the hands follow the work
    var tip = T.pinned ? T.tip() : { x: T.pin.x, y: TIP_Y }, pp = this.phase === 'squeeze' ? T.at(0.15 + 0.72 * this.p) : T.at(0.2);
    if (this.jerk) pp = { x: VW + 140, y: VH + 60 };
    this.hand.x += (tip.x - this.hand.x) * 0.16; this.hand.y += (tip.y - this.hand.y) * 0.16;
    this.pinch.x += (pp.x - this.pinch.x) * (this.jerk ? 0.3 : 0.2); this.pinch.y += (pp.y - this.pinch.y) * (this.jerk ? 0.3 : 0.2);
    // camera
    var c = this.cam, ct = this.camT, k = 0.07;
    c.z += (ct.z - c.z) * k;
    var lim = { x0: VW / (2 * c.z), x1: VW - VW / (2 * c.z), y0: VH / (2 * c.z), y1: VH - VH / (2 * c.z) };
    c.x += (clamp(ct.x, lim.x0, lim.x1) - c.x) * k; c.y += (clamp(ct.y, lim.y0, lim.y1) - c.y) * k;
    if (this.shake > 0) { this.shake -= ts; var s = this.shake * 0.5; c.sx = (Math.random() - 0.5) * s; c.sy = (Math.random() - 0.5) * s; } else { c.sx = c.sy = 0; }
    if (this.cap) { this.cap.t++; if (this.cap.t > this.cap.life) this.cap = null; }
    if (this.phase !== 'out' && this.fade > 0) this.fade = Math.max(0, this.fade - 1 / 40);
    this['ph_' + this.phase]();
  };
  CradleScene.prototype.ph_intro = function () {
    var len = this.first ? 200 : 80;
    if (this.pt === 40) this.caption('w.cradle.enter', null, 200);
    if (this.pt >= len || (this.pt > 30 && I.pressed('a'))) { this.pickNext(); this.setPhase('ready'); this.camT = { x: 512, y: 560, z: 1 }; }
  };
  CradleScene.prototype.ph_ready = function () {
    if (I.pressed('left')) this.cycle(-1);
    if (I.pressed('right')) this.cycle(1);
    var tip = this.cur().tip();
    this.camT = { x: lerp(512, tip.x, 0.35), y: 580, z: 1.06 };
    if (I.pressed('a')) {
      this.p = 0; this.twitch = null; this.setPhase('squeeze'); squeezeOn();
      this.camT = { x: tip.x, y: tip.y - 80, z: 1.22 };
    }
  };
  CradleScene.prototype.ph_squeeze = function () {
    var T = this.cur(), unrest = this.unrest(), b = this.band;
    this.p += 0.0095 * (1 + 0.14 * this.draws) * this.ts;
    T.swell = this.p; squeezeSet(this.p);
    b.jump *= 0.97;
    if (unrest > 0.3 && !this.twitch && Math.random() < 0.004 + 0.018 * unrest) this.twitch = { t: 0 };
    if (this.twitch) {
      this.twitch.t++;
      if (this.twitch.t === 10) { b.jump = (Math.random() < 0.5 ? -1 : 1) * (0.06 + 0.08 * unrest); T.flinch = 12; SFX.flinch(); this.shake = 6; if (!this.twitched) { this.twitched = true; this.caption('w.cradle.twitch', null, 120); } }
      if (this.twitch.t > 70) this.twitch = null;
    }
    var c = this.bandC();
    if (this.p > c + b.w) this.shake = Math.max(this.shake, 2);
    if (!I.down('a')) { this.release(); return; }
    if (this.p >= 1) this.wild();
  };
  CradleScene.prototype.release = function () {
    var b = this.band, c = this.bandC(), p = this.p, off = p - c, T = this.cur();
    squeezeOff(); this.draws++;
    var kind;
    if (Math.abs(off) <= b.w) kind = Math.abs(off) <= b.w * 0.35 ? 'perfect' : 'clean';
    else if (off < 0) kind = 'dry';
    else if (off <= b.w + 0.12) kind = 'spilt';
    else { this.wild(); return; }
    this.anim = { kind: kind, t: 0 };
    if (kind === 'perfect' || kind === 'clean') { this.got++; if (kind === 'perfect') this.perfect++; SFX.clean(); this.caption(kind === 'perfect' ? 'w.drawPerfect' : 'w.drawClean', null, 110); }
    else if (kind === 'dry') { SFX.dry(); this.caption('w.drawDry', null, 110); }
    else { SFX.spilt(); this.spray(16, COL.venom, 2.8); this.caption('w.drawSpilt', null, 110); }
    T.state = kind; this.slots[this.draws - 1] = kind;
    this.setPhase('result');
  };
  CradleScene.prototype.wild = function () {
    var T = this.cur(); squeezeOff();
    if (this.phase === 'squeeze' && this.p >= 1) this.draws++;
    T.whip(); T.swell = 0; this.jerk = true; this.ts = 0.22; this.shake = 26; SFX.whip();
    var bonus = DS.R.saveBonus(this.h, 'con'), r1 = DS.d(20), r2 = this.draught ? DS.d(20) : 0, roll = Math.max(r1, r2);
    this.save = { r1: r1, r2: r2, bonus: bonus, roll: roll, total: roll + bonus, holds: roll + bonus >= DC, show1: r1, show2: r2 };
    this.caption('w.cradle.whip', null, 100);
    this.camT = { x: T.tip().x, y: T.tip().y - 160, z: 1.26 };
    this.setPhase('save');
  };
  CradleScene.prototype.ph_result = function () {
    var a = this.anim, T = this.cur(); a.t++;
    if (a.kind === 'perfect' || a.kind === 'clean') {
      if (a.t < 22) { T.swell = lerp(this.p, 1.3, a.t / 22); a.bead = { r: a.t * 0.6, y: 0 }; }
      else if (a.t < 34) { T.swell = lerp(1.3, 0.1, (a.t - 22) / 12); a.bead = { r: 13, y: (a.t - 22) / 12 }; this.thimble.level = Math.max(this.thimble.level, (a.t - 22) / 12); }
      else if (a.t < 58) { a.bead = null; T.swell = 0.1; a.wax = (a.t - 34) / 24; }
      else if (a.t === 58) { this.thimble.sealed = true; SFX.seal(); a.wax = null; }
    } else if (a.kind === 'dry') {
      T.swell = lerp(this.p, -0.3, easeOut(a.t / 30));
    } else {
      if (a.t < 14) T.swell = lerp(this.p, 1.5, a.t / 14); else if (a.t === 14) { this.spray(18, COL.venom, 3); T.swell = -0.2; }
    }
    if (a.t >= 84) this.nextDraw();
  };
  CradleScene.prototype.nextDraw = function () {
    var T = this.cur(); T.milked = true; T.swell = 0; T.pinned = true;
    this.thimble = { level: 0, sealed: false }; this.anim = null; this.jerk = false; this.ts = 1;
    if (this.draws >= DRAWS) { this.setPhase('tally'); this.camT = { x: 512, y: 520, z: 1 }; }
    else { this.pickNext(); this.setPhase('ready'); }
  };
  CradleScene.prototype.ph_save = function () {
    var s = this.save, pt = this.pt;
    if (pt === 30) this.ts = 1;
    if (pt > 30 && pt < 82 && pt % 3 === 0) { s.show1 = DS.d(20); s.show2 = this.draught ? DS.d(20) : 0; SFX.tick(); }
    if (pt === 82) { s.show1 = s.r1; s.show2 = s.r2; SFX.tick(); }
    if (pt === 120) { if (s.holds) { SFX.holds(); this.caption(this.draught && s.r2 >= s.r1 && s.r2 + s.bonus >= DC && s.r1 + s.bonus < DC ? 'w.touchShrug' : 'w.drawJerk', null, 120); } else { SFX.touch(); } }
    if (pt === 170) {
      if (s.holds) { this.cur().state = 'jerk'; this.slots[this.draws - 1] = 'jerk'; this.save = null; this.nextDraw(); }
      else { this.touched = true; this.cur().state = 'touch'; this.slots[this.draws - 1] = 'touch'; this.save = null; this.setPhase('paralysis'); }
    }
  };
  CradleScene.prototype.ph_paralysis = function () {
    var pt = this.pt, k = smooth(pt / 130);
    if (pt === 8 || pt === 62 || pt === 124 || pt === 196) SFX.heart(1 - pt / 260);
    this.cam.rot = 0.14 * k; this.camT = { x: this.cur().tip().x, y: 600, z: 1.3 + 0.35 * k };
    if (pt >= 210) { this.cam.rot = 0; this.setPhase('tally'); this.camT = { x: 512, y: 520, z: 1 }; }
  };
  CradleScene.prototype.ph_tally = function () {
    if (this.pt > 20 && (I.pressed('a') || I.pressed('b'))) { DS.audio.sfx('confirm'); this.setPhase('out'); }
  };
  CradleScene.prototype.ph_out = function () {
    this.fade = Math.min(1, this.fade + 1 / 30);
    if (this.pt >= 34) { this.result = { got: this.got, touched: this.touched, perfect: this.perfect }; DS.pop(this); }
  };

  // ------------------------------------------------------------------ drawing
  CradleScene.prototype.draw = function (ctx8) {
    ctx8.fillStyle = '#000'; ctx8.fillRect(0, 0, DS.W, DS.H);
    if (!fxInit()) { DS.text(ctx8, 'the cradle needs a canvas', 40, 110, '#9C9C9C'); return; }
    fxPlace();
    if (!FX.rock) FX.rock = buildRock();
    if (!FX.crib) FX.crib = buildCrib();
    if (!FX.grain) FX.grain = buildGrain();
    var ctx = FX.ctx, self = this, T = this.cur(), unrest = this.unrest(), cam = this.cam;
    ctx.setTransform(FX.s, 0, 0, FX.s, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    ctx.save();
    ctx.translate(VW / 2 + cam.sx, VH / 2 + cam.sy); ctx.scale(cam.z, cam.z); if (cam.rot) ctx.rotate(cam.rot); ctx.translate(-cam.x, -cam.y);
    ctx.drawImage(FX.rock, 0, 0, VW, VH);
    drawBody(ctx, this.t, unrest, this.phase === 'paralysis' ? { x: 512, y: 900 } : this.hand);
    ctx.drawImage(FX.crib, 0, 0, VW, VH);
    this.tents.forEach(function (Q) { drawTent(ctx, Q, 'above'); });
    timber(ctx, 108, BAR_Y - 20, 808, 42, 37);
    var tip = T.tip(), hx = this.hand.x, hy = this.hand.y, showRing = this.phase === 'ready' || this.phase === 'squeeze', skin = this.skin;
    var gv = showRing ? (this.phase === 'squeeze' ? this.p : 0.35 + 0.25 * Math.sin(this.t * 0.15)) : 0;
    this.tents.forEach(function (Q) { if (Q.pinned) drawTent(ctx, Q, 'below', Q === T ? gv : 0); });
    // the hands: the thimble hand under the gland, the working hand on the feeler
    var thx = hx - 2, thy = hy + 38, lvl = this.thimble.level, sealed = this.thimble.sealed;
    arm(ctx, { x: thx - 330, y: VH + 90 }, { x: thx - 36, y: thy + 44 }, skin, 88);
    hand(ctx, thx - 14, thy + 34, skin, 44, 34, -0.35);
    finger(ctx, thx - 44, thy - 2, thx - 10, thy - 12, skin, 15); // the thumb along the rim
    drawThimble(ctx, thx, thy, lvl, sealed, 1, 0);
    if (this.anim && this.anim.bead) { var bd = this.anim.bead; ctx.save(); ctx.globalCompositeOperation = 'lighter'; var by = lerp(tip.y + 18, thy - 2, bd.y); var bg = ctx.createRadialGradient(tip.x, by, 0, tip.x, by, bd.r * 2); bg.addColorStop(0, rgba(COL.venom, 0.95)); bg.addColorStop(0.5, rgba(COL.venom, 0.5)); bg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(tip.x, by, bd.r * 2, 0, TAU); ctx.fill(); ctx.restore(); }
    if (this.anim && this.anim.wax != null) { var wy = lerp(thy - 70, thy - 4, easeOut(this.anim.wax)); ctx.beginPath(); ctx.ellipse(thx, wy, 9, 12, 0, 0, TAU); ctx.fillStyle = COL.wax; ctx.fill(); }
    [[-36, 14, 24, 8], [-38, 28, 22, 22], [-34, 42, 18, 36]].forEach(function (f) { finger(ctx, thx + f[0], thy + f[1], thx + f[2], thy + f[3], skin, 15); }); // fingers over the cup
    this.tents.forEach(function (Q) { if (Q.pinned) drawGland(ctx, Q, Q === T && showRing ? 0.5 + 0.5 * Math.sin(self.t * 0.15) * Q.ripe : (Q.milked ? 0 : 0.18 * Q.ripe)); });
    var pp = this.pinch;
    arm(ctx, { x: pp.x + 380, y: VH + 90 }, { x: pp.x + 58, y: pp.y + 34 }, skin, 88);
    hand(ctx, pp.x + 40, pp.y + 22, skin, 42, 34, 0.55);
    finger(ctx, pp.x + 34, pp.y + 4, pp.x + 13, pp.y - 6, skin, 16); // the index, on the far side
    finger(ctx, pp.x + 30, pp.y + 24, pp.x - 14, pp.y + 4, skin, 17); // the thumb, across the front
    this.tents.forEach(function (Q) { if (!Q.pinned) { drawTent(ctx, Q, 'below', 1); drawGland(ctx, Q, 0.8); } }); // a feeler off the bar comes over everything
    if (showRing) {
      var b = this.band, c = this.bandC(), hot = this.phase === 'squeeze' && Math.abs(this.p - c) <= b.w, shiver = !!(this.twitch && this.twitch.t < 10);
      drawRing(ctx, tip.x, tip.y, 84, this.p, c, b.w, Math.min(1, c + b.w + 0.12), hot, shiver, this.phase === 'squeeze', this.phase === 'ready' ? 0.7 : 1);
    }
    drawLamp(ctx, this.flick);
    drawLight(ctx, this.flick);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    this.motes.forEach(function (m) { var d = Math.sqrt((m.x - LAMP.x) * (m.x - LAMP.x) + (m.y - LAMP.y) * (m.y - LAMP.y)); var a = m.a * clamp(1.1 - d / 760, 0.04, 1) * 0.7; ctx.fillStyle = 'rgba(255,230,180,' + a + ')'; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill(); });
    this.parts.forEach(function (q) { ctx.fillStyle = rgba(q.col, 0.8 * (1 - q.life / q.max)); ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill(); });
    ctx.restore();
    ctx.restore();
    // screen space
    this.post(ctx);
    this.hud(ctx);
    if (this.save) this.drawSave(ctx);
    if (this.phase === 'tally' || this.phase === 'out') this.drawTally(ctx);
    if (this.fade > 0) { ctx.fillStyle = 'rgba(0,0,0,' + this.fade + ')'; ctx.fillRect(0, 0, VW, VH); }
    ctx.save(); ctx.globalAlpha = 0.07; ctx.globalCompositeOperation = 'overlay';
    ctx.translate(Math.random() * 160 - 160, Math.random() * 160 - 160); ctx.fillStyle = ctx.createPattern(FX.grain, 'repeat'); ctx.fillRect(0, 0, VW + 160, VH + 160);
    ctx.restore();
  };
  CradleScene.prototype.post = function (ctx) {
    var v = ctx.createRadialGradient(512, 480, 320, 512, 480, 820); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, VW, VH);
    if (this.phase === 'paralysis' || (this.phase === 'tally' && this.touched) || (this.phase === 'out' && this.touched)) {
      var k = this.phase === 'paralysis' ? smooth(this.pt / 130) : 1;
      ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,' + k + ')'; ctx.fillRect(0, 0, VW, VH); ctx.restore();
      ctx.fillStyle = 'rgba(60,80,140,' + (0.22 * k) + ')'; ctx.fillRect(0, 0, VW, VH);
      var r0 = lerp(720, 90, k), c = ctx.createRadialGradient(512, 520, r0 * 0.4, 512, 520, r0 + 260); c.addColorStop(0, 'rgba(0,0,0,0)'); c.addColorStop(1, 'rgba(0,0,0,' + (0.92 * k) + ')');
      ctx.fillStyle = c; ctx.fillRect(0, 0, VW, VH);
    }
  };
  CradleScene.prototype.hud = function (ctx) {
    var a = this.phase === 'intro' ? smooth((this.pt - 24) / 50) : 1, self = this, k;
    if (this.phase === 'paralysis') a *= 1 - smooth(this.pt / 90);
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    txt(ctx, 'THE CRADLE', 44, 80, { size: 40, spacing: 8, color: COL.bone, shadow: true });
    txt(ctx, this.sub, 46, 108, { size: 16, color: COL.dim, sans: true, spacing: 1, shadow: true });
    for (k = 0; k < DRAWS; k++) {
      var x = VW - 44 - (DRAWS - k) * 44 + 22, y = 52, st = this.slots[k];
      if (!st) drawThimble(ctx, x, y, 0, false, 0.55, 0, k === this.draws && (this.phase === 'ready' || this.phase === 'squeeze') ? 0.75 : 0.28);
      else if (st === 'perfect' || st === 'clean') drawThimble(ctx, x, y, 1, true, 0.55, 0, 1);
      else if (st === 'spilt') drawThimble(ctx, x, y + 14, 0, false, 0.55, 1.3, 0.5);
      else if (st === 'touch') { drawThimble(ctx, x, y, 0, false, 0.55, 0, 0.3); ctx.strokeStyle = COL.red; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 12, y + 2); ctx.lineTo(x + 12, y + 24); ctx.stroke(); }
      else drawThimble(ctx, x, y, 0, false, 0.55, 0, 0.5);
      if (st === 'perfect') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(240,192,96,0.35)'; ctx.beginPath(); ctx.arc(x, y + 14, 18, 0, TAU); ctx.fill(); ctx.restore(); }
    }
    txt(ctx, 'THE SETTLE', VW - 44, 118, { size: 11, sans: true, spacing: 3, color: COL.dim, align: 'right' });
    var settle = 1 - this.draws / DRAWS, bx = VW - 44 - 220, by = 126;
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx, by, 220, 6);
    ctx.fillStyle = DS.mix(COL.red, COL.gold, settle); ctx.fillRect(bx + 220 * (1 - settle), by, 220 * settle, 6);
    var prompt = '';
    if (this.phase === 'ready') prompt = 'hold E to work the gland   ·   ◀ ▶ another feeler';
    else if (this.phase === 'squeeze') prompt = 'let go in the gold';
    if (prompt) txt(ctx, prompt, 512, 160, { size: 20, italic: true, color: COL.bone, align: 'center', shadow: true, alpha: 0.85 });
    if (this.cap) {
      var c = this.cap, ca = clamp(Math.min(1, c.t / 14, (c.life - c.t) / 24), 0, 1), intro = this.phase === 'intro';
      var lines = wrapText(ctx, c.s, { size: intro ? 24 : 22, italic: !intro }, 820), y0 = intro ? 300 : 866 - (lines.length - 1) * 28;
      lines.forEach(function (l, i) { txt(ctx, l, 512, y0 + i * 28, { size: intro ? 24 : 22, color: COL.bone, align: 'center', shadow: true, alpha: ca, italic: !intro }); });
    }
    if (this.phase === 'intro' && this.first) {
      var ia = smooth((this.pt - 10) / 40) * (1 - smooth((this.pt - 120) / 50));
      txt(ctx, 'THE CRADLE', 512, 240, { size: 64, spacing: 14, color: COL.bone, align: 'center', shadow: true, alpha: ia });
    }
    ctx.restore();
  };
  CradleScene.prototype.drawSave = function (ctx) {
    var s = this.save, pt = this.pt, a = smooth((pt - 24) / 20);
    if (a <= 0) return;
    var y = 230, two = !!this.draught, h = two ? 320 : 290;
    panel(ctx, 232, y, 560, h, a);
    ctx.save(); ctx.globalAlpha = a;
    txt(ctx, 'CONSTITUTION SAVE  ·  DC ' + DC, 512, y + 44, { size: 14, sans: true, spacing: 4, color: COL.dim, align: 'center' });
    var settled = pt >= 82;
    if (two) {
      var keep1 = s.r1 >= s.r2;
      drawDie(ctx, 432, y + 130, 52, s.show1, settled && !keep1 ? COL.dim : COL.gold, settled && !keep1 ? 0.45 : 1);
      drawDie(ctx, 592, y + 130, 52, s.show2, settled && keep1 ? COL.dim : COL.gold, settled && keep1 ? 0.45 : 1);
      txt(ctx, 'the draught: roll twice, keep the higher', 512, y + 202, { size: 13, sans: true, color: COL.dim, align: 'center' });
    } else drawDie(ctx, 512, y + 130, 52, s.show1, COL.gold, 1);
    if (settled) {
      txt(ctx, s.roll + '  ' + DS.sgn(s.bonus) + '  =  ' + s.total, 512, y + (two ? 236 : 210), { size: 22, color: COL.bone, align: 'center' });
      if (pt >= 120) {
        var va = smooth((pt - 120) / 14);
        txt(ctx, s.holds ? 'IT HOLDS' : 'THE TOUCH', 512, y + (two ? 284 : 256), { size: 30, spacing: 8, color: s.holds ? COL.gold : COL.red, align: 'center', alpha: va, shadow: true });
      }
    }
    ctx.restore();
  };
  CradleScene.prototype.drawTally = function (ctx) {
    var a = smooth((this.pt - 6) / 30), self = this, k;
    if (this.phase === 'out') a = 1;
    if (a <= 0) return;
    panel(ctx, 172, 300, 680, 360, a);
    ctx.save(); ctx.globalAlpha = a;
    var head = DS.L(this.touched ? 'w.cradle.dragged' : 'w.cradle.done');
    txt(ctx, head, 512, 366, { size: 34, spacing: 6, color: this.touched ? COL.red : COL.bone, align: 'center', shadow: true });
    timber(ctx, 232, 520, 560, 30, 41);
    for (k = 0; k < DRAWS; k++) {
      var x = 272 + k * 96, st = this.slots[k];
      if (st === 'perfect' || st === 'clean') drawThimble(ctx, x, 474, 1, true, 1, 0, 1);
      else if (st === 'spilt') drawThimble(ctx, x - 10, 506, 0, false, 1, 1.35, 0.5);
      else if (st === 'touch') { ctx.fillStyle = rgba(COL.red, 0.55); ctx.beginPath(); ctx.ellipse(x, 522, 30, 8, 0, 0, TAU); ctx.fill(); }
      else if (st) drawThimble(ctx, x, 474, 0, false, 1, 0, 0.45);
      if (st === 'perfect') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(240,192,96,0.3)'; ctx.beginPath(); ctx.arc(x, 498, 34, 0, TAU); ctx.fill(); ctx.restore(); }
    }
    txt(ctx, DS.L('w.cradle.paid', { n: this.got }), 512, 596, { size: 22, color: COL.bone, align: 'center' });
    txt(ctx, 'E', 512, 636, { size: 18, italic: true, color: COL.dim, align: 'center', alpha: 0.5 + 0.5 * Math.sin(this.t * 0.1) });
    ctx.restore();
  };
})();
