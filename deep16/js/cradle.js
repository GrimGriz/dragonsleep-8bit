/* DEEP16 -- THE CRADLE: a shift at the pens, or the deep rate at the Wet, as a scene of the grid's own (10-22, the Wet seat). Griz, to the lanes desk: "Crawler game needs
   rebuilt for this engine I suspect"; the desk's ruling, his away, on the seat's lean 1: "build look 1, the DEEP16 scene of its own in the grid's pixels ... keep the first
   game's rules exactly ... Mouse first, keys as before, and WORK A SHIFT on the counter opens it and pays back there" -- his eye on its show door the ruling on the look.

   The rules are the first game's cradle (js/cradle.js DS.CradleScene, the register's: WarrensModule/crawler-warrens-DM.md, the dose-rate CANON 09-09b), number for number:
   eight feelers pinned under the bar, each ripe 0.75 to 1.25; six draws a shift, the settle wearing off draw by draw (the deep rate: no settle, whole from the first); a draw
   is the gland worked while the ring fills -- let go inside the gold band, a thimble (inside a third of it, a full one), short of it dry, a little past it spilt, far past it
   or the ring full, the feeler off the bar: a CON save at 13 (the draught: the better of two d20s), held a jerk back, failed the touch and the shift is over; at the deep
   rate a whip rouses the animal, held or not. The gold narrows with the settle and the hands' skill (Animal Handling or Nature), drifts and jumps as it wears.
   The picture is the grid's: 480 x 270, the palette's ramps, the crawler in his colours (CANON 10-01: "pale yellow ringed body, pinned red tentacles, red feelers, plum
   maw with pale fangs, and eye stalks") behind the cradle's slats, the lamp, the hands and the thimble. The dice are D16's (D.rand, D.d): a show pins them by the seed. */
'use strict';
(function () {
  var D = window.D16, I = D.input, CR = D.cradle = {};
  var DRAWS = 6, DC = 13, TENTS = 8, N = 13, PIN = 7;
  var BAR_Y = 158, TIP_Y = 204, TAU = Math.PI * 2;
  CR.DRAWS = DRAWS; CR.DC = DC;
  CR.STRAIGHT = false; // (a bench that rolls the first game's table rule instead of the picture: js/mines.js M.shift, js/roam.js R.shiftPlay)
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function sgn(n) { return (n >= 0 ? '+' : '') + n; }
  function P(r, k) { var R = D.PAL.ramps[r]; return R[Math.max(0, Math.min(R.length - 1, k))]; }
  var BODY = ['#5c4a24', '#9c8640', '#cdb664', '#e8d890', '#f6ecb8']; // (the pale yellow of his canon, in five: the palette has no yellow ramp of its own)
  var VENOM = '#b4d060';

  // ---------------------------------------------------------------- a feeler: a chain of points from the maw, through the slats, pinned under the bar, hanging to the gland
  function Feeler(i) {
    var px = 136 + i * 30, sway = (i - 3.5) * 2;
    this.i = i; this.root = { x: 212 + i * 8, y: 126 }; this.pin = { x: px, y: BAR_Y + 2 };
    var tip = { x: px + sway, y: TIP_Y };
    this.pinned = true; this.pts = [];
    for (var k = 0; k < N; k++) {
      var p;
      if (k <= PIN) { var u = k / PIN; p = { x: lerp(this.root.x, this.pin.x, u) + Math.sin(u * Math.PI) * (i % 2 ? 6 : -6), y: lerp(this.root.y, this.pin.y, u) }; }
      else { var v = (k - PIN) / (N - 1 - PIN); p = { x: lerp(this.pin.x, tip.x, v), y: lerp(this.pin.y, tip.y, v) }; }
      this.pts.push({ x: p.x, y: p.y, px: p.x, py: p.y });
    }
    this.rest = []; for (k = 1; k < N; k++) this.rest.push(Math.hypot(this.pts[k].x - this.pts[k - 1].x, this.pts[k].y - this.pts[k - 1].y) * (k <= PIN ? 1.12 : 1.04)); // (slack: they sag)
    this.milked = false; this.ripe = 0.75 + D.rand() * 0.5; this.flinch = 0; this.swell = 0; this.state = '';
  }
  Feeler.prototype.fixed = function (k) { return k === 0 || (this.pinned && k === PIN); };
  Feeler.prototype.step = function (ts, t, unrest, pull) {
    var g = 0.13 * ts * ts, k;
    for (k = 1; k < N; k++) {
      if (this.fixed(k)) continue;
      var p = this.pts[k], vx = (p.x - p.px) * 0.95, vy = (p.y - p.py) * 0.95;
      p.px = p.x; p.py = p.y;
      var wig = Math.sin(t * 0.06 + k * 0.7 + this.i) * (0.03 + unrest * 0.13) * ts;
      if (this.flinch > 0) wig += (D.rand() - 0.5) * 2 * ts;
      p.x += vx * ts + wig; p.y += vy * ts + g;
    }
    if (pull) { var tp = this.pts[N - 1]; tp.x += (pull.x - tp.x) * 0.3; tp.y += (pull.y - tp.y) * 0.3; }
    for (var it = 0; it < 6; it++) {
      this.pts[0].x = this.root.x; this.pts[0].y = this.root.y;
      if (this.pinned) { this.pts[PIN].x = this.pin.x; this.pts[PIN].y = this.pin.y; }
      for (k = 1; k < N; k++) {
        var a = this.pts[k - 1], b = this.pts[k], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 0.001, diff = (d - this.rest[k - 1]) / d;
        var wa = this.fixed(k - 1) ? 0 : 1, wb = this.fixed(k) ? 0 : 1, s = wa + wb; if (!s) continue;
        a.x += dx * diff * wa / s; a.y += dy * diff * wa / s; b.x -= dx * diff * wb / s; b.y -= dy * diff * wb / s;
      }
    }
    if (this.flinch > 0) this.flinch -= ts;
  };
  Feeler.prototype.tip = function () { return this.pts[N - 1]; };
  Feeler.prototype.at = function (f) { var k = PIN + clamp(f, 0, 1) * (N - 1 - PIN), i0 = Math.floor(k), i1 = Math.min(N - 1, i0 + 1), u = k - i0; return { x: lerp(this.pts[i0].x, this.pts[i1].x, u), y: lerp(this.pts[i0].y, this.pts[i1].y, u) }; };
  Feeler.prototype.whip = function () { // off the bar: the hanging part rears up at the milker
    this.pinned = false;
    for (var k = PIN; k < N; k++) { var p = this.pts[k], f = (k - PIN) / (N - 1 - PIN); p.py = p.y + 12 + 14 * f; p.px = p.x - (this.i < 4 ? -1 : 1) * 5 * f; }
  };

  // ---------------------------------------------------------------- the scene. o: { hero (a sheet), skill, skillName, draught, deep, mouth, shifts, auto }
  // (auto: the hands play themselves -- 'perfect' lets go in the middle of the gold, 'dry' short of it, 'wild' never: a bench's, or a show's watched beat)
  function Cradle(o) {
    this.kind = 'cradle'; this.opaque = true; this.o = o;
    this.h = o.hero; this.skill = o.skill || 0; this.skillName = o.skillName || 'Animal Handling'; this.draught = !!o.draught;
    this.mouth = o.mouth || 2; this.first = !o.shifts; this.deep = !!o.deep; this.roused = false; this.auto = o.auto || null;
    this.t = 0; this.ts = 1; this.phase = 'intro'; this.pt = 0;
    this.tents = []; for (var i = 0; i < TENTS; i++) this.tents.push(new Feeler(i));
    this.sel = 3; this.draws = 0; this.got = 0; this.perfect = 0; this.touched = false; this.slots = [];
    this.p = 0; this.band = null; this.twitch = null; this.twitched = false; this.shake = 0; this.parts = []; this.cap = null; this.anim = null; this.save = null;
    this.hand = { x: 0, y: 0 }; this.pinch = { x: 0, y: 0 }; this.jerk = false; this.thimble = { level: 0, sealed: false };
    this.fade = 1; this.over = false; this.result = null; this.squeezing = false;
    var MOUTHS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
    this.sub = (this.deep ? 'The Wet -- the deep rate' : 'Mouth ' + (MOUTHS[this.mouth] || this.mouth)) + ' -- ' + (this.h ? this.h.name : '') + ' -- ' + this.skillName + ' ' + sgn(this.skill) + (this.draught ? ' -- draught taken' : '');
    var tp = this.cur().tip(); this.hand.x = tp.x; this.hand.y = tp.y; this.pinch.x = tp.x; this.pinch.y = tp.y - 20;
  }
  CR.Scene = Cradle;
  Cradle.prototype.cur = function () { return this.tents[this.sel]; };
  Cradle.prototype.unrest = function () { return this.deep ? 1 : clamp((this.draws - 1) / (DRAWS - 1), 0, 1); };
  Cradle.prototype.setPhase = function (p) { this.phase = p; this.pt = 0; };
  Cradle.prototype.caption = function (key, vars, life) { var s = D.counter ? D.counter.L(key, vars) : key; this.cap = { s: Array.isArray(s) ? s[0] : s, t: 0, life: life || 150 }; };
  Cradle.prototype.makeBand = function () {
    var T = this.cur(), w = clamp(0.055 + 0.018 * (this.skill - (this.deep ? 3 : 0)), 0.035, 0.17) * T.ripe * (1 - 0.3 * this.unrest()); // (the gold narrows as the settle wears)
    this.band = { c: 0.42 + D.rand() * 0.34, w: w, phase: D.rand() * TAU, jump: 0 };
  };
  Cradle.prototype.bandC = function () { var b = this.band; if (!b) return 0.6; var u = this.unrest(); return b.c + (0.015 + 0.09 * u) * Math.sin(this.t * (0.035 + 0.03 * u) + b.phase) + b.jump; };
  Cradle.prototype.pickNext = function () { var best = -1, bi = this.sel; this.tents.forEach(function (T, i) { if (!T.milked && T.ripe > best) { best = T.ripe; bi = i; } }); this.sel = bi; this.makeBand(); };
  Cradle.prototype.choose = function (i) { if (i === this.sel || !this.tents[i] || this.tents[i].milked) return; this.sel = i; this.makeBand(); D.sfx('cursor'); };
  Cradle.prototype.cycle = function (d) { var free = []; this.tents.forEach(function (T, i) { if (!T.milked) free.push(i); }); if (free.length < 2) return; var k = free.indexOf(this.sel); this.choose(free[(k + d + free.length) % free.length]); };
  Cradle.prototype.spray = function (n, col) { var p = this.cur().tip(); for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + (D.rand() - 0.5) * 2.6, v = 0.8 + D.rand() * 2.2; this.parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 30 + D.rand() * 30, col: col }); } };
  // the feeler under the mouse, by its gland (the hanging tip): one not yet milked, within 10 px
  Cradle.prototype.feelerAt = function (x, y) { var best = -1, bd = 11; this.tents.forEach(function (T, i) { if (T.milked || !T.pinned) return; var p = T.tip(), d = Math.hypot(p.x - x, p.y - y + 2); if (d < bd) { bd = d; best = i; } }); return best; };
  // the hands on the gland: E held, or the mouse's button held since it went down on the work (a press on another feeler only chooses it)
  Cradle.prototype.held = function () {
    if (this.auto) { var c = this.bandC(), w = this.band ? this.band.w : 0.05; return this.auto === 'wild' ? true : this.auto === 'dry' ? this.p < Math.max(0.02, c - w - 0.12) : this.p < c - w * 0.15; }
    return !!(I.held.a || (I.mouse.down && this.squeezing));
  };

  Cradle.prototype.update = function () {
    this.t++; this.pt++;
    var ts = this.ts, T = this.cur(), unrest = this.unrest(), self = this, pull = null;
    if (this.phase === 'squeeze') pull = { x: T.tip().x, y: TIP_Y + 3 + this.p * 9 };
    else if (this.phase === 'save' && this.pt < 46) pull = { x: T.pin.x + (T.i < 4 ? 16 : -16), y: 120 }; // (off the bar, it rears up at you)
    else if (this.phase === 'paralysis') pull = { x: this.hand.x - 12, y: this.hand.y + 24 }; // (and finds the wrist)
    this.tents.forEach(function (Q) { Q.step(ts, self.t, unrest, Q === T ? pull : null); });
    this.parts.forEach(function (q) { q.life += ts; q.x += q.vx * ts; q.y += q.vy * ts; q.vy += 0.06 * ts; });
    this.parts = this.parts.filter(function (q) { return q.life < q.max; });
    var tip = T.pinned ? T.tip() : { x: T.pin.x, y: TIP_Y }, pp = this.phase === 'squeeze' ? T.at(0.15 + 0.72 * this.p) : T.at(0.2);
    if (this.jerk) pp = { x: 520, y: 300 };
    this.hand.x += (tip.x - this.hand.x) * 0.16; this.hand.y += (tip.y - this.hand.y) * 0.16;
    this.pinch.x += (pp.x - this.pinch.x) * (this.jerk ? 0.3 : 0.2); this.pinch.y += (pp.y - this.pinch.y) * (this.jerk ? 0.3 : 0.2);
    if (this.shake > 0) this.shake -= ts;
    if (this.cap) { this.cap.t++; if (this.cap.t > this.cap.life) this.cap = null; }
    if (this.phase !== 'out' && this.fade > 0) this.fade = Math.max(0, this.fade - 1 / 30);
    this['ph_' + this.phase]();
  };
  Cradle.prototype.ph_intro = function () {
    var len = this.first ? 170 : 70, m = I.mouse;
    if (this.pt === 30) this.caption(this.deep ? 'w.cradle.enterDeep' : 'w.cradle.enter', null, 200);
    if (this.pt >= len || (this.pt > 30 && (I.pressed('a') || m.click || this.auto))) { this.pickNext(); this.setPhase('ready'); }
  };
  Cradle.prototype.ph_ready = function () {
    var m = I.mouse;
    if (I.pressed('left')) this.cycle(-1);
    if (I.pressed('right')) this.cycle(1);
    if (m.click && m.inside) { var f = this.feelerAt(m.x, m.y); if (f >= 0 && f !== this.sel) { this.choose(f); return; } } // (a click on another feeler: that one)
    if (I.pressed('a') || (m.click && m.inside) || this.auto) { this.squeezing = !I.pressed('a'); this.p = 0; this.twitch = null; this.setPhase('squeeze'); D.sfx('cursor'); }
  };
  Cradle.prototype.ph_squeeze = function () {
    var T = this.cur(), unrest = this.unrest(), b = this.band;
    this.p += 0.0095 * (1 + 0.14 * this.draws) * this.ts;
    T.swell = this.p; b.jump *= 0.97;
    if (unrest > 0.3 && !this.twitch && D.rand() < 0.004 + 0.018 * unrest) this.twitch = { t: 0 };
    if (this.twitch) {
      this.twitch.t++;
      if (this.twitch.t === 10) { b.jump = (D.rand() < 0.5 ? -1 : 1) * (0.06 + 0.08 * unrest); T.flinch = 12; this.shake = 6; D.sfx('miss'); if (!this.twitched) { this.twitched = true; this.caption(this.deep ? 'w.cradle.twitchDeep' : 'w.cradle.twitch', null, 120); } }
      if (this.twitch.t > 70) this.twitch = null;
    }
    if (this.p > this.bandC() + b.w) this.shake = Math.max(this.shake, 2);
    if (!this.held()) { this.release(); return; }
    if (this.p >= 1) this.wild();
  };
  Cradle.prototype.release = function () {
    var b = this.band, c = this.bandC(), off = this.p - c, T = this.cur(), kind;
    this.squeezing = false; this.draws++;
    if (Math.abs(off) <= b.w) kind = Math.abs(off) <= b.w * 0.35 ? 'perfect' : 'clean';
    else if (off < 0) kind = 'dry';
    else if (off <= b.w + 0.12) kind = 'spilt';
    else { this.draws--; this.wild(); return; }
    this.anim = { kind: kind, t: 0 };
    if (kind === 'perfect' || kind === 'clean') { this.got++; if (kind === 'perfect') this.perfect++; D.sfx('coin'); this.caption(kind === 'perfect' ? 'w.drawPerfect' : 'w.drawClean', null, 110); }
    else if (kind === 'dry') { D.sfx('miss'); this.caption('w.drawDry', null, 110); }
    else { D.sfx('splash'); this.spray(16, VENOM); this.caption('w.drawSpilt', null, 110); }
    T.state = kind; this.slots[this.draws - 1] = kind;
    this.setPhase('result');
  };
  Cradle.prototype.wild = function () {
    var T = this.cur(); this.squeezing = false;
    this.draws++;
    T.whip(); T.swell = 0; this.jerk = true; this.ts = 0.22; this.shake = 26; D.sfx('encounter');
    var R = window.DS.R, bonus = this.h ? R.saveBonus(this.h, 'con') : 0, r1 = D.d(20), r2 = this.draught ? D.d(20) : 0, roll = Math.max(r1, r2);
    this.save = { r1: r1, r2: r2, bonus: bonus, roll: roll, total: roll + bonus, holds: roll + bonus >= DC, show1: r1, show2: r2 };
    this.caption('w.cradle.whip', null, 100);
    this.setPhase('save');
  };
  Cradle.prototype.ph_result = function () {
    var a = this.anim, T = this.cur(); a.t++;
    if (a.kind === 'perfect' || a.kind === 'clean') {
      if (a.t < 22) T.swell = lerp(this.p, 1.3, a.t / 22);
      else if (a.t < 34) { T.swell = lerp(1.3, 0.1, (a.t - 22) / 12); this.thimble.level = Math.max(this.thimble.level, (a.t - 22) / 12); }
      else if (a.t < 58) T.swell = 0.1;
      else if (a.t === 58) { this.thimble.sealed = true; D.sfx('chest'); }
    } else if (a.kind === 'dry') T.swell = lerp(this.p, -0.3, smooth(a.t / 30));
    else { if (a.t < 14) T.swell = lerp(this.p, 1.5, a.t / 14); else if (a.t === 14) { this.spray(18, VENOM); T.swell = -0.2; } }
    if (a.t >= 84 || (this.auto && a.t >= 60)) this.nextDraw();
  };
  Cradle.prototype.nextDraw = function () {
    var T = this.cur(); T.milked = true; T.swell = 0; T.pinned = true;
    this.thimble = { level: 0, sealed: false }; this.anim = null; this.jerk = false; this.ts = 1;
    if (this.draws >= DRAWS) this.setPhase('tally'); else { this.pickNext(); this.setPhase('ready'); }
  };
  Cradle.prototype.ph_save = function () {
    var s = this.save, pt = this.pt;
    if (pt === 30) this.ts = 1;
    if (pt > 30 && pt < 82 && pt % 3 === 0) { s.show1 = 1 + Math.floor(Math.random() * 20); s.show2 = this.draught ? 1 + Math.floor(Math.random() * 20) : 0; } // (the dice tumbling: the picture's, not D16's -- the roll is made)
    if (pt === 82) { s.show1 = s.r1; s.show2 = s.r2; D.sfx('cursor'); }
    if (pt === 120) { if (s.holds) { D.sfx('confirm'); this.caption(this.draught && s.r2 >= s.r1 && s.r2 + s.bonus >= DC && s.r1 + s.bonus < DC ? 'w.touchShrug' : 'w.drawJerk', null, 120); } else D.sfx('poison'); }
    if (pt === 170) {
      if (this.deep) this.roused = true; // (the Wet: a whip rouses it, the touch held or not -- the shift is over)
      if (s.holds && this.deep) { this.cur().state = 'jerk'; this.slots[this.draws - 1] = 'jerk'; this.save = null; this.setPhase('tally'); }
      else if (s.holds) { this.cur().state = 'jerk'; this.slots[this.draws - 1] = 'jerk'; this.save = null; this.nextDraw(); }
      else { this.touched = true; this.cur().state = 'touch'; this.slots[this.draws - 1] = 'touch'; this.save = null; this.setPhase('paralysis'); }
    }
  };
  Cradle.prototype.ph_paralysis = function () { if (this.pt >= 210 || (this.auto && this.pt >= 60)) this.setPhase('tally'); };
  Cradle.prototype.ph_tally = function () { var m = I.mouse; if (this.pt > 20 && (I.pressed('a') || I.pressed('b') || (m.click && m.inside) || this.auto)) { D.sfx('confirm'); this.setPhase('out'); } };
  Cradle.prototype.ph_out = function () {
    this.fade = Math.min(1, this.fade + 1 / 24);
    if (this.pt >= 26) { this.result = { got: this.got, touched: this.touched, perfect: this.perfect, roused: this.roused, slots: this.slots.slice() }; this.over = true; if (D.top() === this) D.pop(); }
  };

  // ---------------------------------------------------------------- the picture
  var ROCK = null;
  function rock() { // the cave wall behind the cradle, made once (its own little generator: the scene's dice are left alone)
    if (ROCK) return ROCK;
    var c = document.createElement('canvas'); c.width = D.W; c.height = D.H; var x = c.getContext('2d'), s = 917;
    var r = function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
    x.fillStyle = P('stone', 0); x.fillRect(0, 0, D.W, D.H);
    for (var i = 0; i < 260; i++) { var w = 6 + Math.floor(r() * 26), h = 3 + Math.floor(r() * 9), px = Math.floor(r() * D.W), py = Math.floor(r() * D.H); x.fillStyle = P('stone', 1 + Math.floor(r() * 2)); x.fillRect(px, py, w, h); x.fillStyle = P('stone', 0); x.fillRect(px, py + h, w, 1); }
    for (i = 0; i < 420; i++) { x.fillStyle = r() < 0.5 ? P('stone', 2) : P('outline', 0); x.fillRect(Math.floor(r() * D.W), Math.floor(r() * D.H), 1, 1); }
    x.fillStyle = P('stone', 1); x.fillRect(0, 232, D.W, 38); x.fillStyle = P('stone', 2); for (i = 0; i < 60; i++) x.fillRect(Math.floor(r() * D.W), 232 + Math.floor(r() * 36), 2 + Math.floor(r() * 5), 1); // (the floor, wet stone)
    return (ROCK = c);
  }
  function timber(ctx, x, y, w, h) { // a beam: lit edge, grain, dark under
    ctx.fillStyle = P('leather', 1); ctx.fillRect(x, y, w, h); ctx.fillStyle = P('leather', 2); ctx.fillRect(x, y, w, Math.max(1, Math.floor(h / 3)));
    ctx.fillStyle = P('leather', 0); ctx.fillRect(x, y + h - 1, w, 1); if (h > w) ctx.fillRect(x + w - 1, y, 1, h);
    ctx.fillStyle = P('leather', 3); for (var k = 0; k < (w > h ? w : h); k += 9) { if (w > h) ctx.fillRect(x + k + 2, y + 1, 3, 1); else ctx.fillRect(x + 1, y + k + 2, 1, 3); }
  }
  function dotLine(ctx, pts, a, b, wf, colf) { // a feeler as pixels: squares along the chain, their size by wf(f), their colour by colf(f)
    for (var k = a; k < b; k++) {
      var p0 = pts[k], p1 = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(p1.x - p0.x, p1.y - p0.y)));
      for (var j = 0; j < n; j++) { var u = j / n, x = lerp(p0.x, p1.x, u), y = lerp(p0.y, p1.y, u), f = (k + u) / (pts.length - 1), w = wf(f); ctx.fillStyle = colf(f); ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w); }
    }
  }
  Cradle.prototype.drawBody = function (ctx) {
    var u = this.unrest(), sx = Math.round(Math.sin(this.t * 0.05) * (0.5 + 2.5 * u)), cx = 240 + sx, cy = 92, t = this.t;
    for (var r = 0; r < 9; r++) { // the ringed body, back to front: each ring a band, its rim pale, its fold dark
      var w = 150 - Math.abs(r - 3) * 12, h = 54 - Math.abs(r - 4) * 3, x = cx - w / 2 + (r - 4) * 3, y = cy - 26 + r * 3;
      ctx.fillStyle = BODY[1]; ctx.fillRect(x, y, w, h); ctx.fillStyle = BODY[r % 2 ? 2 : 3]; ctx.fillRect(x + 2, y + 1, w - 4, h - 4); ctx.fillStyle = BODY[4]; ctx.fillRect(x + 6, y + 2, w - 12, 2);
      ctx.fillStyle = BODY[0]; for (var k = 0; k < w; k += 14) ctx.fillRect(x + k + (r % 2 ? 7 : 0), y + 4, 1, h - 8);
    }
    // the eye stalks off the crown, swaying; the eyes dark, a wet glint
    [-1, 1].forEach(function (s) { var bx = cx + s * 22, by = cy - 26, ex = bx + s * 8 + Math.round(Math.sin(t * 0.04 + s) * 3), ey = by - 22 - Math.round(2 * u * Math.sin(t * 0.09 + s));
      for (var k = 0; k <= 10; k++) { var x = Math.round(lerp(bx, ex, k / 10)), y = Math.round(lerp(by, ey, k / 10)); ctx.fillStyle = BODY[1]; ctx.fillRect(x - 1, y, 3, 2); }
      ctx.fillStyle = BODY[0]; ctx.fillRect(ex - 3, ey - 3, 7, 6); ctx.fillStyle = P('violet', 0); ctx.fillRect(ex - 2, ey - 2, 5, 4); ctx.fillStyle = P('bone', 2); ctx.fillRect(ex, ey - 2, 1, 1); });
    // the maw: plum dark, ringed with pale fangs, the red feelers about it
    var mx = cx, my = cy + 28, open = 3 + Math.round(2 * u * (0.5 + 0.5 * Math.sin(t * 0.07)));
    ctx.fillStyle = P('violet', 1); ctx.fillRect(mx - 18, my - 6 - open, 36, 12 + open * 2); ctx.fillStyle = P('violet', 0); ctx.fillRect(mx - 13, my - 3 - open, 26, 6 + open * 2);
    ctx.fillStyle = P('bone', 1); for (var f = -15; f <= 13; f += 5) { ctx.fillRect(mx + f, my - 6 - open, 2, 3); ctx.fillRect(mx + f + 2, my + 4 + open, 2, 3); }
    ctx.fillStyle = P('red', 3); for (var q = 0; q < 6; q++) { var a = -2.6 + q * 0.42, l = 10 + (q % 2) * 4, fx = Math.round(mx + Math.cos(a) * 20), fy = Math.round(my - 2 + Math.sin(a) * 9); ctx.fillRect(fx, fy, 2, 2); ctx.fillRect(Math.round(fx + Math.cos(a) * l * 0.5), Math.round(fy + Math.sin(a) * l * 0.3) - 2, 2, 2); }
  };
  Cradle.prototype.drawFeeler = function (ctx, T, part) {
    var dark = P('red', 1), mid = P('red', 2), lit = P('red', 3), self = this;
    var col = function (f) { return f > 0.92 ? dark : f > 0.8 ? mid : (Math.round(f * 40) % 3 ? mid : lit); };
    if (part === 'root') dotLine(ctx, T.pts, 0, PIN, function () { return 3; }, function (f) { return f < 0.15 ? mid : col(f); });
    else dotLine(ctx, T.pts, PIN, N - 1, function (f) { var w = f > 0.85 ? 2 : 3; return T.pinned ? w : w + 1; }, col);
    if (part !== 'root') { // the gland at the tip: swollen with the draw, greener the riper
      var p = T.tip(), r = Math.round(3 * (1 + Math.max(-0.4, T.swell) * 0.6) * (T.pinned ? 1 : 1.5)), rp = T.milked ? 0.15 : T.ripe;
      ctx.fillStyle = dark; ctx.fillRect(Math.round(p.x - r - 1), Math.round(p.y - r), 2 * r + 2, 2 * r + 1);
      ctx.fillStyle = rp > 0.95 ? VENOM : P('accent', 0); ctx.fillRect(Math.round(p.x - r), Math.round(p.y - r + 1), 2 * r, 2 * r - 1);
      ctx.fillStyle = P('bone', 2); ctx.fillRect(Math.round(p.x - r + 1), Math.round(p.y - r + 1), 1, 1);
      if (T.state === 'perfect' || T.state === 'clean') { ctx.fillStyle = P('gold', 3); ctx.fillRect(Math.round(p.x - 1), Math.round(p.y + r + 2), 3, 1); } // (a bead of gold under a milked one: sealed)
      if (T === self.cur() && (self.phase === 'ready' || self.phase === 'squeeze') && self.t % 40 < 20 && self.phase === 'ready') { ctx.fillStyle = P('gold', 4); ctx.fillRect(Math.round(p.x - 1), Math.round(p.y - r - 4), 3, 2); } // (the one chosen: a gold tick over it)
    }
  };
  // the ring round the gland: the draw filling it, the gold band where to let go
  Cradle.prototype.drawRing = function (ctx) {
    var T = this.cur(), p = T.tip(), b = this.band, c = this.bandC(), R = 13, a0 = -Math.PI / 2, sq = this.phase === 'squeeze';
    if (!b || !(this.phase === 'ready' || sq)) return;
    var hot = sq && Math.abs(this.p - c) <= b.w, shiver = !!(this.twitch && this.twitch.t < 10);
    var ox = shiver ? Math.round((Math.random() - 0.5) * 2) : 0;
    ctx.save(); ctx.lineWidth = 3;
    ctx.strokeStyle = P('stone', 3); ctx.beginPath(); ctx.arc(p.x + ox, p.y, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = hot ? P('gold', 4) : P('gold', 3); ctx.beginPath(); ctx.arc(p.x + ox, p.y, R, a0 + TAU * clamp(c - b.w, 0, 1), a0 + TAU * clamp(c + b.w, 0, 1)); ctx.stroke();
    if (sq) { ctx.lineWidth = 1; ctx.strokeStyle = this.p > c + b.w ? P('red', 4) : P('bone', 2); ctx.beginPath(); ctx.arc(p.x + ox, p.y, R, a0, a0 + TAU * clamp(this.p, 0, 1)); ctx.stroke(); }
    ctx.restore();
  };
  Cradle.prototype.drawHands = function (ctx) {
    var skin = function (k) { return P('skin', k); }, h = this.hand, q = this.pinch, self = this;
    var fist = function (x, y, s) { x = Math.round(x); y = Math.round(y); ctx.fillStyle = skin(1); ctx.fillRect(x - 4, y - 2, 9, 6); ctx.fillStyle = skin(3); ctx.fillRect(x - 3, y - 2, 7, 4); ctx.fillStyle = skin(4); ctx.fillRect(x - 3, y - 2, 6, 1); ctx.fillStyle = skin(1); for (var k = -2; k <= 2; k += 2) ctx.fillRect(x + k, y + 1, 1, 1); if (s) { ctx.fillStyle = P('leather', 1); ctx.fillRect(x - 4, y + 4, 9, 6); } };
    fist(q.x, q.y + 2, true); // (the hand that works the gland, down the feeler)
    // the thimble under the gland, in the other hand: filling with a clean draw, sealed with wax
    var tx = Math.round(h.x), ty = Math.round(h.y + 8);
    fist(tx, ty + 7, true);
    ctx.fillStyle = P('silver', 2); ctx.fillRect(tx - 3, ty, 7, 7); ctx.fillStyle = P('silver', 4); ctx.fillRect(tx - 2, ty, 5, 6); ctx.fillStyle = P('silver', 5); ctx.fillRect(tx - 2, ty, 1, 6);
    var lv = Math.round(5 * this.thimble.level); if (lv) { ctx.fillStyle = VENOM; ctx.fillRect(tx - 2, ty + 6 - lv, 5, lv); }
    if (this.thimble.sealed) { ctx.fillStyle = P('red', 2); ctx.fillRect(tx - 3, ty - 1, 7, 2); }
  };
  Cradle.prototype.draw = function (ctx) {
    var self = this, T = this.cur(), sh = this.shake > 0 ? Math.round((Math.random() - 0.5) * this.shake * 0.5) : 0, fl = 0.85 + 0.15 * Math.sin(this.t * 0.31) * Math.sin(this.t * 0.13);
    ctx.save(); ctx.translate(sh, 0);
    ctx.drawImage(rock(), 0, 0);
    // the lamp, top left: its pool of light on the rock
    ctx.save(); var g = ctx.createRadialGradient(46, 64, 4, 46, 64, 150); g.addColorStop(0, 'rgba(248,192,72,' + (0.32 * fl) + ')'); g.addColorStop(1, 'rgba(248,192,72,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 260, 240); ctx.restore();
    ctx.fillStyle = P('outline', 0); ctx.fillRect(45, 30, 1, 22); ctx.fillRect(40, 52, 11, 2); ctx.fillRect(40, 54, 1, 12); ctx.fillRect(50, 54, 1, 12); ctx.fillRect(40, 66, 11, 2);
    ctx.fillStyle = P('gold', 3); ctx.fillRect(41, 54, 9, 12); ctx.fillStyle = P('fire', fl > 0.9 ? 2 : 1); ctx.fillRect(44, 57, 3, 6);
    // the cradle: posts and the top beam, the animal behind its slats
    timber(ctx, 104, 30, 10, 202); timber(ctx, 366, 30, 10, 202); timber(ctx, 104, 30, 272, 9);
    this.drawBody(ctx);
    this.tents.forEach(function (Q) { self.drawFeeler(ctx, Q, 'root'); });
    for (var sx = 124; sx < 366; sx += 30) timber(ctx, sx, 39, 5, BAR_Y - 39); // (the slats, in front of it)
    timber(ctx, 104, BAR_Y - 6, 272, 8); // (the bar the feelers are pinned under)
    this.tents.forEach(function (Q) { if (Q.pinned) { ctx.fillStyle = P('silver', 3); ctx.fillRect(Math.round(Q.pin.x) - 2, BAR_Y + 1, 4, 2); self.drawFeeler(ctx, Q, 'hang'); } });
    this.drawRing(ctx);
    if (this.phase !== 'intro') this.drawHands(ctx);
    this.tents.forEach(function (Q) { if (!Q.pinned) { self.drawFeeler(ctx, Q, 'root'); self.drawFeeler(ctx, Q, 'hang'); } }); // (one off the bar comes over everything)
    this.parts.forEach(function (q) { ctx.globalAlpha = 1 - q.life / q.max; ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), 2, 2); }); ctx.globalAlpha = 1;
    ctx.restore();
    // the touch: the world going grey and far
    if (this.phase === 'paralysis' || ((this.phase === 'tally' || this.phase === 'out') && this.touched)) { var k = this.phase === 'paralysis' ? smooth(this.pt / 130) : 1; ctx.fillStyle = 'rgba(40,52,96,' + (0.5 * k) + ')'; ctx.fillRect(0, 0, D.W, D.H); }
    this.hud(ctx);
    if (this.save) this.drawSave(ctx);
    if (this.phase === 'tally' || this.phase === 'out') this.drawTally(ctx);
    if (this.fade > 0) { ctx.fillStyle = 'rgba(0,0,0,' + this.fade + ')'; ctx.fillRect(0, 0, D.W, D.H); }
  };
  function thimbleIcon(ctx, x, y, st, now) {
    ctx.fillStyle = P('silver', 1); ctx.fillRect(x - 3, y, 7, 8); ctx.fillStyle = st ? P('silver', 4) : P('silver', now ? 3 : 2); ctx.fillRect(x - 2, y, 5, 7);
    if (st === 'perfect' || st === 'clean') { ctx.fillStyle = VENOM; ctx.fillRect(x - 2, y + 2, 5, 5); ctx.fillStyle = P('red', 2); ctx.fillRect(x - 3, y - 1, 7, 2); if (st === 'perfect') { ctx.fillStyle = P('gold', 4); ctx.fillRect(x - 1, y - 3, 3, 1); } }
    else if (st === 'spilt') { ctx.fillStyle = VENOM; ctx.fillRect(x + 4, y + 7, 3, 1); }
    else if (st === 'touch') { ctx.fillStyle = P('red', 4); for (var k = 0; k < 8; k++) ctx.fillRect(x - 3 + k, y + k, 1, 1); }
    else if (st === 'jerk') { ctx.fillStyle = P('stone', 5); ctx.fillRect(x - 2, y + 3, 5, 1); }
  }
  Cradle.prototype.hud = function (ctx) {
    var a = this.phase === 'intro' ? smooth((this.pt - 20) / 40) : this.phase === 'paralysis' ? 1 - smooth(this.pt / 90) : 1;
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    D.text(ctx, '{y}THE CRADLE{/}', 10, 8, '#fff'); D.text(ctx, this.sub, 10, 18, '#9a96a8');
    for (var k = 0; k < DRAWS; k++) thimbleIcon(ctx, D.W - 16 - (DRAWS - 1 - k) * 13, 8, this.slots[k], k === this.draws && (this.phase === 'ready' || this.phase === 'squeeze'));
    var settle = this.deep ? 0 : 1 - this.draws / DRAWS, bx = D.W - 88, by = 21;
    D.text(ctx, 'THE SETTLE', bx - 52, 19, '#9a96a8');
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(bx, by, 80, 3); ctx.fillStyle = settle > 0.5 ? P('gold', 3) : settle > 0 ? P('fire', 0) : P('red', 3); ctx.fillRect(bx + Math.round(80 * (1 - settle)), by, Math.round(80 * settle), 3);
    var prompt = this.phase === 'ready' ? 'hold E, or the mouse on the gland -- let go in the gold.   arrows or a click: another feeler' : this.phase === 'squeeze' ? 'let go in the gold' : '';
    if (prompt) D.hint(ctx, prompt, D.W / 2, 236, '#e8e4d8', 'center');
    if (this.cap) { var c = this.cap, ca = clamp(Math.min(1, c.t / 14, (c.life - c.t) / 24), 0, 1); ctx.globalAlpha = a * ca; D.wrap(c.s, D.W - 60).forEach(function (l, i, all) { D.hint(ctx, l, D.W / 2, 248 + (i - all.length + 1) * 10, '#fcfcf4', 'center'); }); ctx.globalAlpha = a; }
    if (this.phase === 'intro' && this.first) { ctx.globalAlpha = smooth((this.pt - 10) / 40) * (1 - smooth((this.pt - 110) / 40)); D.text(ctx, '{y}THE CRADLE{/}', D.W / 2 - 30, 196, '#fff'); }
    ctx.restore();
  };
  Cradle.prototype.drawSave = function (ctx) {
    var s = this.save, pt = this.pt, W8 = D.WIN8, x = 150, y = 92, w = 180, h = 74;
    if (pt < 24) return;
    D.win8(ctx, x, y, w, h, null);
    D.text(ctx, 'CONSTITUTION SAVE -- DC ' + DC, x + 10, y + 6, '#9a96a8');
    var die = function (dx, n, dim) { ctx.fillStyle = dim ? P('stone', 3) : P('gold', 3); ctx.fillRect(dx, y + 20, 22, 18); ctx.fillStyle = P('outline', 0); ctx.fillRect(dx + 1, y + 21, 20, 16); D.text(ctx, String(n), dx + (n > 9 ? 5 : 8), y + 25, dim ? '#6e6a66' : '#f8d67a'); };
    var settled = pt >= 82;
    if (this.draught) { var keep1 = s.r1 >= s.r2; die(x + 56, s.show1, settled && !keep1); die(x + 102, s.show2, settled && keep1); D.text(ctx, 'the draught: two, the higher kept', x + 10, y + 42, '#9a96a8'); }
    else die(x + 79, s.show1, false);
    if (settled) {
      D.text(ctx, s.roll + ' ' + sgn(s.bonus) + ' = ' + s.total, x + 10, y + 52, W8.text);
      if (pt >= 120) D.text(ctx, s.holds ? '{y}IT HOLDS{/}' : '{r}THE TOUCH{/}', x + 110, y + 52, '#fff');
    }
  };
  Cradle.prototype.drawTally = function (ctx) {
    var a = this.phase === 'out' ? 1 : smooth((this.pt - 6) / 24), x = 110, y = 70, w = 260, h = 118, L = D.counter ? D.counter.L : function (k) { return k; };
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    D.win8(ctx, x, y, w, h, null);
    var head = L(this.roused ? 'w.cradle.roused' : this.touched ? 'w.cradle.dragged' : 'w.cradle.done');
    D.text(ctx, (this.touched || this.roused ? '{r}' : '{y}') + head + '{/}', x + w / 2 - D.textWidth(head) / 2, y + 10, '#fff');
    timber(ctx, x + 20, y + 66, w - 40, 6);
    for (var k = 0; k < DRAWS; k++) thimbleIcon(ctx, x + 40 + k * 36, y + 46, this.slots[k] || 'none', false);
    var paid = this.deep ? L('w.cradle.paidDeep', { n: this.got, s: 3 * this.got }) : L('w.cradle.paid', { n: this.got });
    D.text(ctx, paid, x + w / 2 - D.textWidth(paid) / 2, y + 84, '#e8e4d8');
    D.hint(ctx, 'E or a click', x + w / 2, y + h - 14, '#9a96a8', 'center');
    ctx.restore();
  };

  // ---------------------------------------------------------------- a shift played: the scene over whatever is under it, and its result when it is done (a floor's generator waits)
  // job: { hero, skill, skillName, draught, deep, mouth, shifts, auto }. Returns { got, touched, perfect, roused, slots }
  CR.run = function* (B, job) {
    var sc = new Cradle(job); D.push(sc);
    while (!sc.over) yield 1;
    return sc.result;
  };
  CR.make = function (job) { return new Cradle(job); };

  // ---------------------------------------------------------------- THE CRADLE, shown (deep16/?cradle -- the eyes row's door, 10-22: the desk's "land it with an eyes row whose SHOW
  // door opens the shift with the dice pinned"): a beat opens the shift at once, the second game's four (js/house.js H.fresh) and the milker the first game would pick, the
  // seed pinned (&seed=, 1022 by default) so the feelers, the gold and the save fall the same each time; the third stands a NEW GAME at pen two for the whole of it -- WORK A
  // SHIFT on the counter, the cradle, the pay back there. &beat=<id> opens one; X back to the title
  CR.BEATS = [
    { id: 'pens', label: 'A SHIFT AT THE PENS (settled)', note: 'Mouth Two, the animal settled: six draws, the gold narrowing as the settle wears off. Lymen milks (Nature).', job: { who: 'lymen', mouth: 2, shifts: 1 } },
    { id: 'deep', label: 'THE DEEP RATE at the Wet (no settle)', note: 'A harnessed animal nobody settled, the draught taken: DC 15 as if three worse, three silver a thimble -- and a whip rouses it.', job: { who: 'lymen', deep: true, draught: true, shifts: 1 } },
    { id: 'counter', label: 'WORK A SHIFT, at pen two on the mouth camp', note: 'A NEW GAME beside pen two, Edric\'s book signed: E (or a click) on the pen -- WORK A SHIFT, WHO MILKS?, the cradle, the pay at the board.', counter: true }
  ];
  CR.seedOf = function (q) { var m = /[?&]seed=(\d+)/.exec(String(q || '')); return m ? +m[1] : 1022; };
  CR.play = function (bt, q, show) {
    var H = D.house, R = window.DS.R; D.seed = CR.seedOf(q) | 0;
    var rec = H.fresh(); rec.at = { town: null }; rec.flags = { tallyMet: 1, skarnOk: 1, shifts: 1 }; H.begin(rec, 0);
    if (bt.counter) { D.push(D.roam.make('?roam=warrens&at=9,5', { save: H.living(H.cur), opts: { at8: [9, 5] }, house: true })); return; }
    var h = H.cur.party.filter(function (x) { return x.id === bt.job.who; })[0] || H.cur.party[0], ah = R.skill(h, 'Animal Handling', 'wis'), na = R.skill(h, 'Nature', 'int');
    var sc = new Cradle({ hero: h, skill: Math.max(ah, na), skillName: na > ah ? 'Nature' : 'Animal Handling', draught: !!bt.job.draught, deep: !!bt.job.deep, mouth: bt.job.mouth || 2, shifts: bt.job.shifts || 0 });
    sc.after = function (r) { show.last = bt.label + ': ' + r.got + ' sealed' + (r.perfect ? ' (' + r.perfect + ' full)' : '') + (r.touched ? ', the touch' : '') + (r.roused ? ', roused' : ''); D.scenes.length = 0; D.push(show); };
    D.scenes.length = 0; D.push(sc);
  };
  var out0 = Cradle.prototype.ph_out;
  Cradle.prototype.ph_out = function () { out0.apply(this, arguments); if (this.over && this.after) { var f = this.after; this.after = null; f(this.result); } };
  function Show(q) {
    this.kind = 'cradleshow'; this.opaque = true; this.t = 0; this.hov = 0; this.q = q; this.last = '';
    var b = /[?&]beat=([a-z0-9]+)/.exec(String(q || '')); if (b) this.pending = CR.BEATS.filter(function (x) { return x.id === b[1]; })[0] || null;
  }
  Show.prototype.buttons = function () { return CR.BEATS.map(function (bt, k) { return { x: 12, y: 26 + k * 34, w: D.W - 24, h: 31, bt: bt }; }); };
  Show.prototype.update = function () {
    this.t++; var m = I.mouse;
    if (this.pending) { var p0 = this.pending; this.pending = null; CR.play(p0, this.q, this); return; }
    var bs = this.buttons(), hit = m.inside ? bs.filter(function (q) { return m.x >= q.x && m.x < q.x + q.w && m.y >= q.y && m.y < q.y + q.h; })[0] : null;
    if (m.moved || m.click) this.hov = hit ? bs.indexOf(hit) : this.hov;
    if (I.repeat('down')) this.hov = (this.hov + 1) % bs.length; if (I.repeat('up')) this.hov = (this.hov - 1 + bs.length) % bs.length;
    if ((m.click && hit) || I.pressed('a')) { D.sfx('confirm'); CR.play((hit || bs[this.hov]).bt, this.q, this); return; }
    if (I.pressed('b') || m.rclick) { D.scenes.length = 0; if (D.house && D.house.Title) D.push(new D.house.Title()); }
  };
  Show.prototype.draw = function (ctx) {
    var self = this, W8 = D.WIN8; ctx.fillStyle = '#0a0c22'; ctx.fillRect(0, 0, D.W, D.H);
    D.text(ctx, '{y}THE CRADLE, 10-22{/} -- the crawler game on the grid, the dice pinned (seed ' + CR.seedOf(this.q) + ')', 10, 10, W8.text);
    this.buttons().forEach(function (q, k) {
      var on = k === self.hov; D.win8(ctx, q.x, q.y, q.w, q.h, on ? W8.sel : null);
      D.text(ctx, q.bt.label, q.x + 8, q.y + 3, on ? W8.gold : W8.text);
      D.wrap(q.bt.note, q.w - 16).slice(0, 2).forEach(function (l, i) { D.text(ctx, l, q.x + 8, q.y + 12 + i * 9, '#9c9cb4'); });
    });
    if (this.last) D.text(ctx, '{y}LAST{/}: ' + this.last, 12, 136, W8.text);
    D.hint(ctx, 'click a beat · in the cradle: hold the mouse (or E) on the gland, let go in the gold · X: the title', D.W / 2, D.H - 12, '#9a96a8', 'center');
  };
  CR.Show = Show;
  CR.show = function (q) { return new Show(q); };
})();
