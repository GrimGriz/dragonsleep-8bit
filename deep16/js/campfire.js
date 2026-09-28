/* DEEP16 — the campfire (Griz, 09-28: "make the campfire menu backdrop a 16 bit scene of the characters sitting around a
   campfire (and fancy up the DM handwaving on the climb)"). A night clearing on the fights' own iso grid -- grass, packed
   earth, a ring of trees, a woodpile -- the four sitting round a fire (the LPC `sit` pose, tools/lpc-compose.py `extra`),
   lit by it: the scene is multiplied by a night ambient plus the fire's flickering light, then the glow laid over.
   The camp draws it behind its panels (camp.js); the climb draws it whole when the DM's hands bring the party back
   (climb.js). It borrows the iso renderer for a frame and hands it back as it found it. */
'use strict';
(function () {
  var D = window.D16, CF = D.campfire = {};
  var P = function (r, i) { return D.PAL.ramps[r][i]; };
  var DEF = {
    name: 'the campfire', ground: 'earth', step: 0,
    rows: [
      'gTgTgTTgTgT',
      'TggggggggTg',
      'gTgg...gggT',
      'Tgg.....ggg',
      'gg.......gT',
      'Tg.......gg',
      'gg.......kT',
      'Tgg.....ggg',
      'gTgg...ggTg',
      'TggggggggTg',
      'gTgTgTTgTgT'
    ]
  };
  var FIRE = [5, 5];
  // round the fire, none in front of it: the back pair face us, the side pair face it in profile (grid x, y, facing)
  CF.SEATS = { barley: [3, 4, 0, 0], aurdin: [4, 3, 0, 1], lymen: [4, 6, 6, 0], vivian: [6, 4, 2, 1] };
  var map = null, buf = null, lit = null;
  function ensure() {
    if (map) return;
    var iso = D.iso, prev = iso.map;
    map = iso.load(DEF);
    iso.map = prev;
    buf = document.createElement('canvas'); buf.width = D.W; buf.height = D.H;
    lit = document.createElement('canvas'); lit.width = D.W; lit.height = D.H;
  }
  function flick(t) { return Math.sin(t * 0.21) * 0.5 + Math.sin(t * 0.53 + 1.3) * 0.3 + Math.sin(t * 1.7) * 0.2; }

  // the fire itself on the grid: a ring of stones, two logs crossed, the flames (drawn in the sort, so a sitter in
  // front of it would hide it; none sits there)
  function fireObj(t) {
    return { depth: FIRE[0] + FIRE[1] + 0.5, gz: 0, draw: function (ctx) {
      var c = D.iso.center(FIRE[0], FIRE[1], 0), s = D.iso.toScreen(c.x, c.y), x = s.x, y = s.y + 2;
      for (var k = 0; k < 10; k++) { var a = k / 10 * Math.PI * 2, sx = Math.round(x + Math.cos(a) * 11), sy = Math.round(y + Math.sin(a) * 5.5); ctx.fillStyle = k % 3 ? P('stone', 3) : P('stone', 4); ctx.fillRect(sx - 2, sy - 1, 4, 3); ctx.fillStyle = P('stone', 5); ctx.fillRect(sx - 1, sy - 1, 2, 1); }
      ctx.fillStyle = P('leather', 1); ctx.fillRect(x - 8, y - 2, 16, 3); ctx.fillStyle = P('leather', 2); ctx.fillRect(x - 3, y - 4, 6, 7);
      ctx.fillStyle = P('red', 2); ctx.fillRect(x - 6, y - 1, 12, 2);
      CF.flames(ctx, x, y - 2, t, 1.3);
    } };
  }
  // flames: tongues that rise and lick, hottest at the heart
  CF.flames = function (ctx, x, y, t, k) {
    var cols = [P('red', 3), P('fire', 1), P('fire', 2), P('gold', 3), P('gold', 4)], n = Math.round(9 * k);
    for (var i = 0; i < n; i++) {
      var off = i - (n - 1) / 2, edge = 1 - Math.abs(off) / (n / 2 + 0.5);
      var h = Math.max(2, Math.round((6 + 12 * edge) * k * (0.75 + 0.25 * Math.sin(t * 0.37 + i * 1.9) + 0.15 * Math.sin(t * 0.9 + i))));
      for (var j = 0; j < h; j++) {
        var f = j / h, sway = Math.round(Math.sin(t * 0.25 + i * 0.8 + j * 0.3) * f * 2 * k);
        ctx.fillStyle = cols[Math.min(4, Math.floor((1 - f) * edge * 5.2))];
        ctx.fillRect(Math.round(x + off * 1.6 * k) + sway, y - j, Math.max(1, Math.round(2 * k)), 1);
      }
    }
    for (var e = 0; e < 7; e++) { // sparks going up
      var ph = (t * 0.7 + e * 29) % 70, ex = Math.round(x + Math.sin(e * 2.3 + ph * 0.09) * 7 * k), ey = Math.round(y - 10 * k - ph * 0.8);
      ctx.globalAlpha = Math.max(0, 1 - ph / 70); ctx.fillStyle = e % 2 ? P('gold', 4) : P('fire', 2); ctx.fillRect(ex, ey, 1, 1); ctx.globalAlpha = 1;
    }
  };

  // o: { cx, cy (where the fire sits on screen), t, heroes: [{ id, sheet, alpha }], dim (0..1: how dark the night) }
  CF.draw = function (ctx, o) {
    ensure();
    var iso = D.iso, t = o.t || 0, W = D.W, H = D.H;
    var keep = { map: iso.map, x: iso.cam.x, y: iso.cam.y, zoom: iso.zoom, inWorld: iso.inWorld };
    iso.map = map; iso.zoom = 1; iso.inWorld = false;
    var fc = iso.center(FIRE[0], FIRE[1], 0);
    iso.cam.x = fc.x - (o.cx - W / 2); iso.cam.y = fc.y - (o.cy - H / 2);
    var b = buf.getContext('2d');
    b.globalCompositeOperation = 'source-over'; b.fillStyle = '#05050a'; b.fillRect(0, 0, W, H);
    var objs = [fireObj(t)];
    (o.heroes || []).forEach(function (h) {
      var st = CF.SEATS[h.id]; if (!st) return;
      objs.push({ depth: st[0] + st[1] + 0.5, gz: 0, draw: function (c2) {
        var c = iso.center(st[0], st[1], 0), s = iso.toScreen(c.x, c.y), sh = D.SHEETS && D.SHEETS[h.sheet];
        var anim = sh && sh.anims.sit ? 'sit' : 'idle';
        if (h.alpha != null && h.alpha < 1) { // (one coming back: a glow first, then the body)
          c2.fillStyle = P('gold', 4); c2.globalAlpha = 0.35 * (1 - h.alpha); c2.beginPath(); c2.ellipse(s.x, s.y - 14, 12, 20, 0, 0, 7); c2.fill(); c2.globalAlpha = 1;
        }
        c2.fillStyle = 'rgba(0,0,0,.35)'; c2.beginPath(); c2.ellipse(s.x, s.y + 1, 11, 4, 0, 0, 7); c2.fill();
        D.spr.draw(c2, h.sheet, anim, st[2], anim === 'sit' ? st[3] * 30 + 1 : t, s.x, s.y + 3, { alpha: h.alpha == null ? 1 : h.alpha });
      } });
    });
    iso.draw(b, objs);
    iso.map = keep.map; iso.cam.x = keep.x; iso.cam.y = keep.y; iso.zoom = keep.zoom; iso.inWorld = keep.inWorld;
    // the light: a night ambient, and the fire's warm pool, breathing
    var l = lit.getContext('2d'), fl = flick(t), dim = o.dim == null ? 1 : o.dim;
    l.globalCompositeOperation = 'source-over';
    l.fillStyle = 'rgb(' + Math.round(70 - 34 * dim) + ',' + Math.round(76 - 34 * dim) + ',' + Math.round(120 - 40 * dim) + ')'; l.fillRect(0, 0, W, H);
    l.globalCompositeOperation = 'lighter';
    var R = 132 + fl * 7, g = l.createRadialGradient(o.cx, o.cy - 8, 2, o.cx, o.cy - 8, R);
    g.addColorStop(0, 'rgba(255,214,150,1)'); g.addColorStop(0.3, 'rgba(235,150,80,0.75)'); g.addColorStop(0.65, 'rgba(120,60,40,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = g; l.fillRect(0, 0, W, H);
    b.globalCompositeOperation = 'multiply'; b.drawImage(lit, 0, 0);
    // the glow over it (the flames stay bright), and the dark closing in at the edges
    b.globalCompositeOperation = 'screen';
    var gl = b.createRadialGradient(o.cx, o.cy - 10, 1, o.cx, o.cy - 10, 44 + fl * 3);
    gl.addColorStop(0, 'rgba(255,190,110,.55)'); gl.addColorStop(1, 'rgba(255,120,40,0)');
    b.fillStyle = gl; b.fillRect(0, 0, W, H);
    b.globalCompositeOperation = 'source-over';
    var v = b.createRadialGradient(o.cx, o.cy - 30, 90, o.cx, o.cy - 30, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(3,3,8,0)'); v.addColorStop(1, 'rgba(3,3,8,.85)');
    b.fillStyle = v; b.fillRect(0, 0, W, H);
    ctx.drawImage(buf, 0, 0);
  };

  // ------------------------------------------------------------------ the DM's hands (the climb: "a giant pair of DM hands appear above the
  // campfire and wave vigorously" -- Griz, 09-27): pixel hands, palms to us, a robe's cuff at the wrist, lit from below
  var handCv = null, HW = 20, HH = 30;
  function handImage() {
    if (handCv) return handCv;
    var skin = [P('skin', 1), P('skin', 2), P('skin', 3)], px = [];
    for (var y = 0; y < HH; y++) { px.push([]); for (var x = 0; x < HW; x++) px[y].push(0); }
    function put(x, y, v) { if (x >= 0 && y >= 0 && x < HW && y < HH) px[y][x] = v; }
    // fingers: pinky, ring, middle, index (left to right), each 3 wide with a gap, their tips at these rows
    [[2, 7], [6, 3], [10, 1], [14, 3]].forEach(function (f, i) {
      for (var y = f[1]; y < 14; y++) for (var dx = 0; dx < 3; dx++) put(f[0] + dx, y, dx === 0 ? 3 : dx === 2 ? 1 : 2);
      put(f[0] + 1, f[1], 4); put(f[0] + 1, f[1] + 1, 4);                      // the nail
      put(f[0] + 1, f[1] + 5 + (i === 0 ? -1 : 0), 1);                          // a crease
    });
    for (var y2 = 12; y2 < 22; y2++) for (var x2 = 2; x2 < 17; x2++) put(x2, y2, x2 < 5 ? 3 : x2 > 14 ? 1 : 2); // the palm
    for (var x3 = 5; x3 < 14; x3++) put(x3, 13, 1);                             // the knuckle line
    for (var k = 0; k < 7; k++) { put(17, 17 - k, 2); put(18, 16 - k, k > 4 ? 4 : 1); if (k < 5) put(16, 18 - k, 2); } // the thumb
    for (var y4 = 22; y4 < 25; y4++) for (var x4 = 4; x4 < 15; x4++) put(x4, y4, x4 < 7 ? 3 : 2); // the wrist
    for (var y5 = 25; y5 < HH; y5++) for (var x5 = 2; x5 < 17; x5++) put(x5, y5, y5 === 25 ? 6 : 5); // the cuff, gold-trimmed
    // outline: anything empty beside something drawn
    var out = px.map(function (r) { return r.slice(); });
    for (var yy = 0; yy < HH; yy++) for (var xx = 0; xx < HW; xx++) {
      if (px[yy][xx]) continue;
      var near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (d) { var r = px[yy + d[1]]; return r && r[xx + d[0]]; });
      if (near) out[yy][xx] = 9;
    }
    var col = { 1: skin[0], 2: skin[1], 3: skin[2], 4: P('bone', 1), 5: P('violet', 1), 6: P('gold', 3), 9: P('outline', 0) };
    handCv = document.createElement('canvas'); handCv.width = HW; handCv.height = HH;
    var c = handCv.getContext('2d');
    for (var y6 = 0; y6 < HH; y6++) for (var x6 = 0; x6 < HW; x6++) if (out[y6][x6]) { c.fillStyle = col[out[y6][x6]]; c.fillRect(x6, y6, 1, 1); }
    return handCv;
  }
  // two hands over (x, y), waving: each swings about its wrist; `k` their size (pixels per art pixel), `a` 0..1 in
  CF.hands = function (ctx, x, y, t, k, a) {
    var img = handImage();
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = a == null ? 1 : a;
    [-1, 1].forEach(function (side) {
      var hx = x + side * 58, hy = y + Math.round(Math.sin(t * 0.11 + (side > 0 ? 0.9 : 0)) * 3);
      var ang = Math.sin(t * 0.28 + (side > 0 ? Math.PI : 0)) * 0.42;
      ctx.save(); ctx.translate(hx, hy + HH * k * 0.5); ctx.rotate(ang); if (side > 0) ctx.scale(-1, 1);
      ctx.drawImage(img, -HW * k / 2, -HH * k, HW * k, HH * k);
      ctx.restore();
    });
    ctx.restore();
  };
  // a fall of sparkles from the hands to a seat (the fallen coming back)
  CF.sparkle = function (ctx, x, y, t, n) {
    for (var i = 0; i < (n || 12); i++) {
      var ph = (t * 1.3 + i * 17) % 60, sx = Math.round(x + Math.sin(i * 3.1 + ph * 0.1) * 10), sy = Math.round(y - 60 + ph);
      ctx.globalAlpha = Math.max(0, 1 - ph / 60); ctx.fillStyle = i % 3 ? P('gold', 4) : P('bone', 1);
      ctx.fillRect(sx, sy, 1, 1); if (i % 4 === 0) { ctx.fillRect(sx - 1, sy, 3, 1); ctx.fillRect(sx, sy - 1, 1, 3); }
    }
    ctx.globalAlpha = 1;
  };
  // where a hero sits, on screen, for a scene whose fire is at (cx, cy)
  CF.seatAt = function (id, cx, cy) { var s = CF.SEATS[id]; if (!s) return null; var dx = s[0] - FIRE[0], dy = s[1] - FIRE[1]; return { x: cx + (dx - dy) * 32, y: cy + (dx + dy) * 16 }; };
})();
