/* DRAGONSLEEP — the smoke: Tam Vere's couch on vice row (handoff-2026-09-26 spec §12).
   The den fills with smoke in 8-bit; then, for twenty seconds, a second canvas over the screen carries a
   dream drawn from curves and light, with no words: a castle on a headland under a storm, a tower struck,
   the sun-disc going dark; the clouds closing; a copper spire rising out of the dark and through them; the
   clouds torn open onto plain daylight, the castle standing with its broken tower, the disc lit again.
   The game never explains it. From the second viewing, hold E to wake early. */
'use strict';
(function () {
  var DS = window.DS, I = DS.input;
  var VW = 1024, VH = 960, TAU = Math.PI * 2;
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function ease(t) { t = clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function mixc(a, b, t) { return DS.mix(a, b, clamp(t, 0, 1)); }
  function rgba(hex, a) { var v = DS.hexToInt(hex); return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a + ')'; }

  // ------------------------------------------------------------------ the overlay canvas (the cradle's way)
  var FX = { c: null, ctx: null, key: '', w: 0, h: 0, s: 1, buf: null, bx: null };
  function fxInit() {
    if (FX.ctx) return true;
    if (!DS.canvas || !document.body) return false;
    var c = document.getElementById('fx');
    if (!c) { c = document.createElement('canvas'); c.id = 'fx'; c.setAttribute('aria-hidden', 'true'); document.body.appendChild(c); }
    c.style.position = 'fixed'; c.style.pointerEvents = 'none'; c.style.zIndex = '3';
    FX.c = c; FX.ctx = c.getContext('2d');
    return !!FX.ctx;
  }
  function fxPlace() {
    var r = DS.canvas.getBoundingClientRect(), key = [r.left, r.top, r.width, r.height].map(function (v) { return Math.round(v * 4); }).join(',');
    if (key === FX.key) return;
    FX.key = key;
    FX.c.style.left = r.left + 'px'; FX.c.style.top = r.top + 'px'; FX.c.style.width = r.width + 'px'; FX.c.style.height = r.height + 'px';
    var d = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(r.width * d), h = Math.round(r.height * d);
    if (w > 1600) { h = Math.round(h * 1600 / w); w = 1600; }
    if (w < 16 || h < 16) { w = 512; h = 480; }
    if (w !== FX.w || h !== FX.h) { FX.c.width = FX.w = w; FX.c.height = FX.h = h; FX.buf = null; }
    FX.s = w / VW;
  }
  function fxShow(on) { if (!fxInit()) return; FX.c.style.display = on ? 'block' : 'none'; if (on) { FX.key = ''; fxPlace(); } else if (FX.ctx) { FX.ctx.setTransform(1, 0, 0, 1, 0, 0); FX.ctx.clearRect(0, 0, FX.w, FX.h); } }

  // ------------------------------------------------------------------ sound: wind, thunder, a bright ring when the cloud tears
  var SND = { c: null, bus: null, noise: null, wind: null };
  function sndOn() {
    var AU = DS.audio; if (!AU || !AU.buses) return false;
    var b = AU.buses(); if (!b || !b.ctx || b.ctx.state !== 'running') return false;
    SND.c = b.ctx; SND.bus = b.sfx;
    if (!SND.noise) { var buf = SND.c.createBuffer(1, SND.c.sampleRate * 2, SND.c.sampleRate), d = buf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; SND.noise = buf; }
    return true;
  }
  function windStart() {
    if (!sndOn() || SND.wind) return;
    try {
      var c = SND.c, t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      s.buffer = SND.noise; s.loop = true; f.type = 'lowpass'; f.frequency.value = 380; f.Q.value = 0.7;
      lfo.frequency.value = 0.13; lg.gain.value = 160; lfo.connect(lg); lg.connect(f.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 3);
      s.connect(f); f.connect(g); g.connect(SND.bus); s.start(t, Math.random()); lfo.start(t);
      SND.wind = { g: g, stop: function () { var tt = c.currentTime; g.gain.cancelScheduledValues(tt); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), tt); g.gain.exponentialRampToValueAtTime(0.0001, tt + 1.6); setTimeout(function () { try { s.stop(); lfo.stop(); } catch (e) { } }, 1800); } };
    } catch (e) { }
  }
  function windTo(v, sec) { if (SND.wind) { try { var t = SND.c.currentTime; SND.wind.g.gain.setTargetAtTime(Math.max(0.0001, v), t, sec || 0.8); } catch (e) { } } }
  function windStop() { if (SND.wind) { try { SND.wind.stop(); } catch (e) { } SND.wind = null; } }
  function thunder(near) {
    if (!sndOn()) return;
    try {
      var c = SND.c, t = c.currentTime + (near ? 0.05 : 0.5), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = SND.noise; f.type = 'lowpass'; f.frequency.setValueAtTime(near ? 900 : 420, t); f.frequency.exponentialRampToValueAtTime(90, t + 2.4);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(near ? 0.55 : 0.28, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + (near ? 3 : 2.2));
      s.connect(f); f.connect(g); g.connect(SND.bus); s.start(t, Math.random()); s.stop(t + 3.2);
      var o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(52, t); o.frequency.exponentialRampToValueAtTime(30, t + 1.4);
      og.gain.setValueAtTime(0.0001, t); og.gain.linearRampToValueAtTime(near ? 0.35 : 0.15, t + 0.05); og.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(og); og.connect(SND.bus); o.start(t); o.stop(t + 1.8);
    } catch (e) { }
  }
  function ring() {
    if (!sndOn()) return;
    try {
      var c = SND.c, t = c.currentTime + 0.01;
      [[523.25, 0.12], [783.99, 0.09], [1046.5, 0.07], [1567.98, 0.04]].forEach(function (p, i) {
        var o = c.createOscillator(), g = c.createGain(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = p[0];
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(p[1], t + 0.03 + i * 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5 - i * 0.4);
        o.connect(g); g.connect(SND.bus); o.start(t); o.stop(t + 3.6);
      });
    } catch (e) { }
  }

  // ------------------------------------------------------------------ the dream's pieces
  var TOWERS = [ // Solara on its headland: a silhouette, not the register's plan
    { x: 600, w: 34, h: 206 }, { x: 648, w: 26, h: 156 }, { x: 706, w: 48, h: 300, struck: true }, { x: 772, w: 30, h: 186 }, { x: 824, w: 40, h: 240 }, { x: 880, w: 24, h: 140 }
  ];
  var BASE = 604, GATE = { x: 730, y: 520 }, DISC = { x: 730, y: 468, r: 20 };
  function Dream() {
    var r = DS.mulberry32(9012);
    this.clouds = [];
    for (var i = 0; i < 84; i++) { // the storm front, waiting out to sea (left), and the high sky that closes over everything
      var front = i < 44;
      this.clouds.push({ x: front ? -620 + r() * 560 : r() * VW, y: front ? 60 + r() * 520 : -60 + r() * 380, r: 70 + r() * 120, v: 0.9 + r() * 0.8, k: r(), front: front, ox: 0, oy: 0, vx: 0, vy: 0, a: front ? 1 : 0, torn: false });
    }
    this.drops = []; for (i = 0; i < 160; i++) this.drops.push({ x: r() * (VW + 300), y: r() * VH, l: 14 + r() * 22, v: 16 + r() * 10 });
    this.debris = [];
    this.bolt = null; this.flash = 0; this.shear = 0;
    this.fall = null; // the struck tower's top, falling
    this.spireX = 340;
  }
  // a jagged bolt from the cloud to a point, with forks
  function makeBolt(x0, y0, x1, y1, seed) {
    var r = DS.mulberry32(seed), pts = [[x0, y0]], n = 14;
    for (var i = 1; i < n; i++) { var t = i / n; pts.push([lerp(x0, x1, t) + (r() - 0.5) * 70 * (1 - t * 0.5), lerp(y0, y1, t) + (r() - 0.5) * 16]); }
    pts.push([x1, y1]);
    var forks = [];
    for (var k = 0; k < 3; k++) { var j = 3 + Math.floor(r() * 8), p = pts[j], fp = [[p[0], p[1]]], dx = (r() - 0.5) * 160; for (var m = 1; m < 5; m++) fp.push([p[0] + dx * m / 4 + (r() - 0.5) * 30, p[1] + m * 26]); forks.push(fp); }
    return { pts: pts, forks: forks, life: 16 };
  }
  function strokePath(ctx, pts, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); }

  // ------------------------------------------------------------------ the scene
  // phases: den (8-bit smoke fills the room) -> dream (full resolution, 1380 frames) -> wake (8-bit, the party gets up)
  var DREAM_END = 1380;
  function SmokeScene(o) {
    this.kind = 'smoke'; this.opaque = true; this.o = o || {};
    this.phase = 'den'; this.t = 0; this.pt = 0; this.skipHold = 0;
    this.puffs = []; this.grey = 0;
    this.d = new Dream();
    this.party = (DS.G && DS.G.party || []).slice(0, 4);
  }
  DS.SmokeScene = SmokeScene;
  SmokeScene.prototype.enter = function () { DS.audio.stop(); };
  SmokeScene.prototype.exit = function () { windStop(); fxShow(false); DS.wave = null; };
  SmokeScene.prototype.setPhase = function (p) { this.phase = p; this.pt = 0; };
  SmokeScene.prototype.update = function () {
    this.t++; this.pt++;
    var canSkip = this.o.again && (this.phase === 'dream' || this.phase === 'den');
    if (canSkip) { if (I.down('a')) { if (++this.skipHold > 40) { this.skipHold = 0; fxShow(false); windStop(); this.setPhase('wake'); DS.audio.play('title'); return; } } else this.skipHold = 0; }
    if (this.phase === 'den') { // the pipe, the smoke rising and thickening, the screen filling grey from the top down
      if (this.pt % 5 === 0) this.puffs.push({ x: 150 + Math.random() * 6, y: 142, r: 2, vx: (Math.random() - 0.5) * 0.35, vy: -0.25 - Math.random() * 0.3, a: 0.9 });
      var self = this;
      this.puffs.forEach(function (p) { p.x += p.vx + Math.sin((self.t + p.y) / 30) * 0.2; p.y += p.vy; p.r += 0.05; p.a -= 0.0015; });
      this.puffs = this.puffs.filter(function (p) { return p.a > 0.05 && p.y > -20; });
      this.grey = smooth((this.pt - 90) / 220);
      if (this.pt === 120) DS.wave = { t: 0, dur: 200, amp: 3, tint: '#8a8a90' };
      if (this.pt === 20) windStart();
      if (this.pt >= 330) { this.setPhase('dream'); fxShow(true); }
      return;
    }
    if (this.phase === 'dream') { this.stepDream(); if (this.pt >= DREAM_END) { fxShow(false); this.setPhase('wake'); windStop(); DS.audio.play('title'); } return; }
    if (this.phase === 'wake') { if (this.pt >= 200 || (this.pt > 60 && I.pressed('a'))) DS.pop(this); }
  };
  SmokeScene.prototype.stepDream = function () {
    var d = this.d, f = this.pt, self = this;
    // wind and weather by the beat
    if (f === 60) windTo(0.26, 2);
    if (f === 380) windTo(0.34, 2);
    if (f === 860) windTo(0.08, 3);
    // beat one: the storm comes in off the sea
    d.clouds.forEach(function (c) {
      if (c.torn) { c.x += c.vx; c.y += c.vy; c.vx *= 0.985; c.vy *= 0.985; c.a -= 0.006; return; }
      if (c.front) {
        var target = f < 360 ? lerp(-500, 980, ease(f / 380)) : 980;
        c.x += (Math.min(c.x, target + c.k * 380) === c.x && f < 480 ? c.v * 2.2 : 0.15);
        if (c.x > VW + 200) c.x -= VW + 700;
      } else if (f > 300) c.a = Math.min(1, c.a + 0.004);
      if (f > 360 && f < 520 && !c.front) c.y += 0.25; // closing over everything
      // beat two: the spire bends the cloud around it as it climbs
      var tip = self.spireTip();
      if (tip < VH && c.y > tip + c.r * 0.2) { // only where the spire has already risen: it goes up THROUGH the cloud
        var dx = c.x - d.spireX, R = c.r + 90, push = clamp(1 - Math.abs(dx) / R, 0, 1);
        c.ox = lerp(c.ox, (dx >= 0 ? 1 : -1) * push * 110, 0.04);
      }
    });
    // lightning: far, nearer, then the tower
    var strikes = [[150, 180, 120, 260, 700, false], [226, 460, 90, 520, 640, false], [292, 560, 40, 730, 604 - 300, true]];
    strikes.forEach(function (s, k) {
      if (f === s[0]) {
        d.bolt = makeBolt(s[1], s[2], s[3], s[4], 71 + k); d.flash = s[5] ? 1 : 0.6; d.shear = s[5] ? 22 : 12; thunder(s[5] || k === 1);
        if (s[5]) { d.fall = { x: 730, y: BASE - 300 + 40, vx: 1.3, vy: -1.5, rot: 0, vr: 0.035 }; for (var q = 0; q < 26; q++) d.debris.push({ x: 730 + (Math.random() - 0.5) * 40, y: BASE - 290, vx: (Math.random() - 0.3) * 4, vy: -Math.random() * 4, r: 2 + Math.random() * 4 }); }
      }
    });
    if (d.bolt && --d.bolt.life <= 0) d.bolt = null;
    d.flash *= 0.86; d.shear *= 0.88;
    if (d.fall) { d.fall.vy += 0.18; d.fall.x += d.fall.vx; d.fall.y += d.fall.vy; d.fall.rot += d.fall.vr; if (d.fall.y > VH + 200) d.fall = null; }
    d.debris.forEach(function (q) { q.vy += 0.2; q.x += q.vx; q.y += q.vy; });
    d.debris = d.debris.filter(function (q) { return q.y < VH + 40; });
    d.drops.forEach(function (q) { q.x -= q.v * 0.35; q.y += q.v; if (q.y > VH) { q.y -= VH + 40; q.x = Math.random() * (VW + 300); } });
    // beat three: it pierces, the cloud tears from that point outward
    if (f === 840) {
      ring(); d.flash = 0.8; d.pierce = { x: d.spireX, y: this.spireTip() };
      d.clouds.forEach(function (c) { var dx = c.x + c.ox - d.pierce.x, dy = c.y - d.pierce.y, dd = Math.max(60, Math.sqrt(dx * dx + dy * dy)); c.torn = true; c.vx = dx / dd * (7 + 900 / dd); c.vy = dy / dd * (5 + 700 / dd); c.x += c.ox; c.ox = 0; });
    }
  };
  SmokeScene.prototype.spireTip = function () { var f = this.pt; if (f < 480) return VH + 60; return lerp(VH + 60, 150, ease((f - 480) / 360)); };
  // light: day, then down by thirds through the storm, the dark under the closed cloud, then day again after the tear
  SmokeScene.prototype.dark = function () {
    var f = this.pt, steps = f < 360 ? (Math.floor(f / 120) + smooth((f % 120) / 40)) / 3 : 1;
    if (f >= 360 && f < 840) return lerp(0.62, 0.8, smooth((f - 360) / 160));
    if (f >= 840) return lerp(0.8, 0, smooth((f - 860) / 240));
    return steps * 0.62;
  };

  // ------------------------------------------------------------------ drawing
  SmokeScene.prototype.draw = function (ctx8) {
    if (this.phase === 'den' || this.phase === 'wake') { this.drawDen(ctx8); return; }
    ctx8.fillStyle = '#000'; ctx8.fillRect(0, 0, DS.W, DS.H);
    if (!fxInit()) return;
    fxPlace();
    if (!FX.buf || FX.buf.width !== FX.w) { FX.buf = document.createElement('canvas'); FX.buf.width = FX.w; FX.buf.height = FX.h; FX.bx = FX.buf.getContext('2d'); }
    var x = FX.bx; x.setTransform(FX.s, 0, 0, FX.s, 0, 0);
    this.drawDream(x);
    // the frame bends with each strike, as the 8-bit glamour did: rows shear on a sine
    var c = FX.ctx, d = this.d; c.setTransform(1, 0, 0, 1, 0, 0);
    if (d.shear > 0.5) {
      c.fillStyle = '#000'; c.fillRect(0, 0, FX.w, FX.h);
      var band = Math.max(2, Math.round(FX.h / 120));
      for (var y = 0; y < FX.h; y += band) { var dx = Math.round(Math.sin(y * 0.02 + this.pt * 0.4) * d.shear * FX.s); c.drawImage(FX.buf, 0, y, FX.w, band, dx, y, FX.w, band); }
    } else c.drawImage(FX.buf, 0, 0);
  };
  SmokeScene.prototype.drawDream = function (x) {
    var f = this.pt, d = this.d, dk = this.dark(), day = f >= 840 ? smooth((f - 900) / 220) : 0;
    // the sky
    var top = mixc(mixc('#8fb4dc', '#1a1e28', dk), '#9cc4ec', day), hor = mixc(mixc('#f0e2c4', '#343a48', dk), '#f4e8cc', day);
    var g = x.createLinearGradient(0, 0, 0, 660); g.addColorStop(0, top); g.addColorStop(1, hor);
    x.fillStyle = g; x.fillRect(0, 0, VW, VH);
    if (f >= 900) { // the sun, after: plain daylight coming back over the headland
      var sa = smooth((f - 900) / 240), sg = x.createRadialGradient(900, 150, 10, 900, 150, 420);
      sg.addColorStop(0, 'rgba(255,248,220,' + 0.9 * sa + ')'); sg.addColorStop(0.2, 'rgba(255,236,190,' + 0.35 * sa + ')'); sg.addColorStop(1, 'rgba(255,236,190,0)');
      x.fillStyle = sg; x.fillRect(0, 0, VW, VH);
    }
    // the sea
    var sea = x.createLinearGradient(0, 640, 0, VH); sea.addColorStop(0, mixc(mixc('#5a88a8', '#1a2430', dk), '#6a98b8', day)); sea.addColorStop(1, mixc(mixc('#23445a', '#0a1016', dk), '#2a5068', day));
    x.fillStyle = sea; x.fillRect(0, 640, VW, VH - 640);
    x.strokeStyle = rgba(mixc('#e8f0f8', '#5a6470', dk), 0.35); x.lineWidth = 2;
    for (var w = 0; w < 18; w++) { var wy = 660 + w * 16 + (w % 3) * 3, wx = ((w * 137 + f * (1.2 + dk * 2)) % 700) - 60; x.beginPath(); x.moveTo(wx, wy); x.lineTo(wx + 40 + (w % 4) * 12, wy); x.stroke(); }
    // high cloud behind the castle
    this.drawClouds(x, false, dk, day);
    // the headland and the castle
    var land = mixc(mixc('#46503e', '#141812', dk), '#4e5a44', day);
    x.fillStyle = land; x.beginPath(); x.moveTo(470, VH); x.lineTo(520, 700); x.lineTo(548, 650); x.lineTo(572, BASE + 6); x.lineTo(930, BASE); x.lineTo(990, 650); x.lineTo(VW, 700); x.lineTo(VW, VH); x.closePath(); x.fill();
    x.strokeStyle = rgba(mixc('#8a9a78', '#2a3226', dk), 0.9); x.lineWidth = 3; x.beginPath(); x.moveTo(548, 650); x.lineTo(572, BASE + 6); x.lineTo(930, BASE); x.stroke();
    this.drawCastle(x, dk, day);
    // rain through the storm
    var rain = f > 120 && f < 900 ? smooth((f - 120) / 120) * (1 - smooth((f - 820) / 80)) : 0;
    if (rain > 0) { x.strokeStyle = 'rgba(190,200,220,' + 0.32 * rain + ')'; x.lineWidth = 1.5; x.beginPath(); d.drops.forEach(function (q) { x.moveTo(q.x, q.y); x.lineTo(q.x - q.l * 0.35, q.y + q.l); }); x.stroke(); }
    // the front cloud, over everything
    this.drawClouds(x, true, dk, day);
    this.drawSpire(x);
    // the bolt, and its light
    if (d.bolt) {
      x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round';
      var a = d.bolt.life / 16;
      strokePath(x, d.bolt.pts, 16, 'rgba(160,180,255,' + 0.18 * a + ')'); strokePath(x, d.bolt.pts, 6, 'rgba(210,220,255,' + 0.6 * a + ')'); strokePath(x, d.bolt.pts, 2.2, 'rgba(255,255,255,' + a + ')');
      d.bolt.forks.forEach(function (fp) { strokePath(x, fp, 1.4, 'rgba(230,236,255,' + 0.7 * a + ')'); });
      x.restore();
    }
    if (d.fall) { // the tower's top, going
      x.save(); x.translate(d.fall.x, d.fall.y); x.rotate(d.fall.rot);
      x.fillStyle = mixc('#2e323e', '#0c0e14', dk); x.fillRect(-24, -40, 48, 60); x.beginPath(); x.moveTo(-28, -40); x.lineTo(0, -92); x.lineTo(28, -40); x.closePath(); x.fill();
      x.restore();
    }
    x.fillStyle = mixc('#3a3e48', '#101218', dk); d.debris.forEach(function (q) { x.fillRect(q.x, q.y, q.r, q.r); });
    if (d.flash > 0.02) { x.fillStyle = 'rgba(240,244,255,' + d.flash * 0.75 + ')'; x.fillRect(0, 0, VW, VH); }
    if (d.pierce && f < 960) { // the moment it goes through: a warm bloom from the point
      var pa = 1 - smooth((f - 840) / 120), pg = x.createRadialGradient(d.pierce.x, d.pierce.y, 0, d.pierce.x, d.pierce.y, 700);
      pg.addColorStop(0, 'rgba(255,220,160,' + 0.7 * pa + ')'); pg.addColorStop(0.3, 'rgba(255,190,120,' + 0.25 * pa + ')'); pg.addColorStop(1, 'rgba(255,190,120,0)');
      x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = pg; x.fillRect(0, 0, VW, VH); x.restore();
    }
    // vignette, fade in and out
    var v = x.createRadialGradient(512, 470, 300, 512, 470, 780); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,' + (0.55 - day * 0.3) + ')');
    x.fillStyle = v; x.fillRect(0, 0, VW, VH);
    var fade = f < 50 ? 1 - f / 50 : f > DREAM_END - 70 ? smooth((f - (DREAM_END - 70)) / 60) : 0;
    if (fade > 0) { x.fillStyle = 'rgba(0,0,0,' + fade + ')'; x.fillRect(0, 0, VW, VH); }
  };
  SmokeScene.prototype.drawClouds = function (x, front, dk, day) {
    var d = this.d;
    d.clouds.forEach(function (c) {
      if (c.front !== front || c.a <= 0) return;
      var cx = c.x + c.ox, cy = c.y + c.oy, base = mixc(mixc('#9aa4b4', '#262a34', dk), '#d8dde6', day), hi = mixc(mixc('#dce2ea', '#4a5060', dk), '#ffffff', day);
      var g = x.createRadialGradient(cx - c.r * 0.25, cy - c.r * 0.35, c.r * 0.1, cx, cy, c.r);
      g.addColorStop(0, rgba(hi, 0.95 * c.a)); g.addColorStop(0.55, rgba(base, 0.9 * c.a)); g.addColorStop(1, rgba(base, 0));
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, c.r, 0, TAU); x.fill();
    });
  };
  SmokeScene.prototype.drawCastle = function (x, dk, day) {
    var f = this.pt, body = mixc(mixc('#3a3f4c', '#0e1016', dk), '#444a58', day), rim = mixc('#c8b890', '#3a3a40', dk);
    x.fillStyle = body;
    x.fillRect(588, BASE - 86, 316, 86); // the curtain wall
    for (var cr = 588; cr < 904; cr += 14) x.fillRect(cr, BASE - 96, 8, 10); // crenels
    var struck = f >= 292;
    TOWERS.forEach(function (t) {
      var h = t.struck && struck ? t.h - 78 : t.h, tx = t.x - t.w / 2, ty = BASE - h;
      x.fillStyle = body; x.fillRect(tx, ty, t.w, h);
      if (t.struck && struck) { // broken: a jagged top
        x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx + t.w * 0.2, ty - 14); x.lineTo(tx + t.w * 0.45, ty - 4); x.lineTo(tx + t.w * 0.7, ty - 20); x.lineTo(tx + t.w, ty - 6); x.lineTo(tx + t.w, ty); x.closePath(); x.fill();
      } else { x.beginPath(); x.moveTo(tx - 4, ty); x.lineTo(t.x, ty - t.w * 1.25); x.lineTo(tx + t.w + 4, ty); x.closePath(); x.fill(); }
      x.fillStyle = rgba(rim, 0.25 + 0.5 * (1 - dk)); x.fillRect(tx + t.w - 3, ty, 3, h); // the light's edge
      x.fillStyle = mixc('#e8c870', '#2a2418', dk * 1.2); x.fillRect(t.x - 2, ty + 30, 4, 7); // a window, lit
    });
    // the gate and the sun-disc over it: dark from the strike until the tear, then lit
    x.fillStyle = mixc('#14161c', '#050608', dk); x.beginPath(); x.moveTo(GATE.x - 16, BASE); x.lineTo(GATE.x - 16, GATE.y + 24); x.arc(GATE.x, GATE.y + 24, 16, Math.PI, 0); x.lineTo(GATE.x + 16, BASE); x.closePath(); x.fill();
    var lit = f < 292 ? 1 : f >= 980 ? smooth((f - 980) / 80) : 0;
    x.save();
    if (lit > 0) { x.globalCompositeOperation = 'lighter'; var gl = x.createRadialGradient(DISC.x, DISC.y, 0, DISC.x, DISC.y, 90); gl.addColorStop(0, 'rgba(255,210,110,' + 0.55 * lit + ')'); gl.addColorStop(1, 'rgba(255,210,110,0)'); x.fillStyle = gl; x.fillRect(DISC.x - 90, DISC.y - 90, 180, 180); x.globalCompositeOperation = 'source-over'; }
    x.fillStyle = mixc('#3a3020', '#f0c050', lit); x.beginPath(); x.arc(DISC.x, DISC.y, DISC.r, 0, TAU); x.fill();
    x.strokeStyle = mixc('#2a2418', '#f8d878', lit); x.lineWidth = 3;
    for (var k = 0; k < 12; k++) { var a = k / 12 * TAU; x.beginPath(); x.moveTo(DISC.x + Math.cos(a) * (DISC.r + 4), DISC.y + Math.sin(a) * (DISC.r + 4)); x.lineTo(DISC.x + Math.cos(a) * (DISC.r + 12), DISC.y + Math.sin(a) * (DISC.r + 12)); x.stroke(); }
    x.restore();
  };
  SmokeScene.prototype.drawSpire = function (x) { // warm against the grey, climbing out of the dark
    var tip = this.spireTip(), f = this.pt, sx = this.d.spireX;
    if (tip >= VH) return;
    var after = f >= 840 ? smooth((f - 840) / 200) : 0, wBase = 30;
    x.save();
    x.globalCompositeOperation = 'lighter';
    var col = x.createLinearGradient(sx - 90, 0, sx + 90, 0); col.addColorStop(0, 'rgba(255,150,70,0)'); col.addColorStop(0.5, 'rgba(255,160,80,' + (0.18 * (1 - after * 0.6)) + ')'); col.addColorStop(1, 'rgba(255,150,70,0)');
    x.fillStyle = col; x.fillRect(sx - 90, tip - 40, 180, VH - tip + 40);
    x.globalCompositeOperation = 'source-over';
    var g = x.createLinearGradient(sx - wBase, 0, sx + wBase, 0);
    g.addColorStop(0, '#6a3a18'); g.addColorStop(0.35, '#c8783a'); g.addColorStop(0.55, '#f4b070'); g.addColorStop(0.8, '#a85a28'); g.addColorStop(1, '#4a2410');
    x.fillStyle = g; x.beginPath(); x.moveTo(sx - wBase, VH + 10); x.lineTo(sx - 3, tip + 8); x.lineTo(sx, tip); x.lineTo(sx + 3, tip + 8); x.lineTo(sx + wBase, VH + 10); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(255,220,170,0.55)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(sx + 6, VH); x.lineTo(sx + 1, tip + 10); x.stroke();
    for (var b = 0; b < 6; b++) { var by = lerp(VH, tip, (b + 1) / 7), bw = lerp(wBase, 3, (b + 1) / 7); x.fillStyle = 'rgba(90,40,14,0.5)'; x.fillRect(sx - bw, by, bw * 2, 2); } // bands, like scale
    x.globalCompositeOperation = 'lighter';
    var tg = x.createRadialGradient(sx, tip, 0, sx, tip, 120); tg.addColorStop(0, 'rgba(255,230,180,' + (0.85 - after * 0.4) + ')'); tg.addColorStop(0.25, 'rgba(255,170,90,0.35)'); tg.addColorStop(1, 'rgba(255,150,70,0)');
    x.fillStyle = tg; x.fillRect(sx - 120, tip - 120, 240, 240);
    x.restore();
  };
  // the den: the couch, the lamp, the smoke-racks, the party lying down; the smoke, the grey coming down from the top
  SmokeScene.prototype.drawDen = function (ctx) {
    var t = this.t;
    ctx.fillStyle = '#140e12'; ctx.fillRect(0, 0, 256, 240);
    ctx.fillStyle = '#2a1a22'; ctx.fillRect(0, 0, 256, 96); // the back wall, curtained
    for (var cx = 4; cx < 256; cx += 10) { ctx.fillStyle = cx % 20 ? '#3a2230' : '#2e1a26'; ctx.fillRect(cx, 0, 6, 96); }
    ctx.fillStyle = '#1e1418'; ctx.fillRect(0, 96, 256, 144);
    for (var fy = 100; fy < 240; fy += 8) { ctx.fillStyle = fy % 16 ? '#22181c' : '#1a1216'; ctx.fillRect(0, fy, 256, 1); }
    ctx.fillStyle = '#3a2418'; [[190, 30], [214, 30], [238, 30]].forEach(function (r) { ctx.fillRect(r[0], r[1], 2, 60); }); // the smoke-racks, the leaf hanging
    for (var lx = 186; lx < 244; lx += 6) { ctx.fillStyle = '#5a6a3a'; ctx.fillRect(lx, 36 + (lx % 12), 3, 10); }
    var fl = ((t >> 3) & 1) ? '#F8D878' : '#FCA044'; // the lamp
    ctx.fillStyle = '#2a2a30'; ctx.fillRect(40, 108, 4, 26); ctx.fillStyle = '#1a1a20'; ctx.fillRect(34, 98, 16, 12); ctx.fillStyle = fl; ctx.fillRect(38, 100, 8, 8);
    var lg = ctx.createRadialGradient(42, 104, 2, 42, 104, 90); lg.addColorStop(0, 'rgba(255,190,90,0.28)'); lg.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 20, 150, 170);
    ctx.fillStyle = '#5a2030'; ctx.fillRect(66, 150, 150, 20); ctx.fillStyle = '#7a3040'; ctx.fillRect(66, 150, 150, 5); ctx.fillStyle = '#3a1420'; ctx.fillRect(66, 170, 150, 6); // the couch
    var waking = this.phase === 'wake', self = this;
    this.party.forEach(function (h, i) { // lying down, or getting up
      var spr = DS.fighter(DS.LOOKS[h.look], h.weapon);
      if (!waking || self.pt < 40 + i * 25) ctx.drawImage(spr.ko, 70 + i * 36, 140);
      else { var fr = DS.walker(DS.LOOKS[h.look]); ctx.drawImage(fr.down[0], 76 + i * 36, 132); }
    });
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(146, 142, 8, 3); ctx.fillStyle = '#c8783a'; ctx.fillRect(152, 141, 2, 2); // the pipe
    ctx.save();
    this.puffs.forEach(function (p) { // round-ish pixel puffs: a cross of two rects
      ctx.globalAlpha = p.a * 0.5; ctx.fillStyle = '#c8c8d0'; var r = Math.max(1, Math.round(p.r)), px = Math.round(p.x), py = Math.round(p.y), k = Math.max(1, Math.round(r * 0.6));
      ctx.fillRect(px - r, py - k, r * 2, k * 2); ctx.fillRect(px - k, py - r, k * 2, r * 2);
    });
    ctx.restore();
    if (this.phase === 'den' && this.grey > 0) { // grey coming down from the top, row by row, dithered at its edge
      var edge = Math.round(this.grey * 250);
      ctx.fillStyle = 'rgba(150,150,160,' + (0.35 + 0.6 * this.grey) + ')'; ctx.fillRect(0, 0, 256, Math.max(0, edge - 8));
      for (var ex = 0; ex < 256; ex += 2) if ((ex >> 1) % 2 === ((t >> 2) & 1)) ctx.fillRect(ex, edge - 8, 2, 8);
    }
    if (waking && this.pt < 30) { ctx.fillStyle = 'rgba(0,0,0,' + (1 - this.pt / 30) + ')'; ctx.fillRect(0, 0, 256, 240); }
    if (this.o.again && this.phase === 'den' && ((t >> 5) & 1)) DS.textRight(ctx, 'hold E to wake', 250, 230, '#6C6C84');
  };
})();
