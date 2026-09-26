/* DRAGONSLEEP — core: namespace, dice, canvas, input, loop, scenes, scripts.
   Classic script (no ES modules) so index.html also runs from file://. */
'use strict';
(function () {
  var DS = window.DS = window.DS || {};
  DS.W = 256; DS.H = 240;
  DS.frame = 0;

  // ---------------------------------------------------------------- dice & math
  DS.rint = function (n) { return Math.floor(Math.random() * n); };
  DS.d = function (n) { return 1 + Math.floor(Math.random() * n); };
  DS.pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  DS.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  DS.mod = function (score) { return Math.floor((score - 10) / 2); };
  DS.sgn = function (n) { return n >= 0 ? '+' + n : '' + n; };
  DS.shuffle = function (a) {
    for (var i = a.length - 1; i > 0; i--) { var j = DS.rint(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  DS.weighted = function (list, wkey) {
    var tot = 0, i; for (i = 0; i < list.length; i++) tot += list[i][wkey || 'w'] || 1;
    var r = Math.random() * tot;
    for (i = 0; i < list.length; i++) { r -= list[i][wkey || 'w'] || 1; if (r < 0) return list[i]; }
    return list[list.length - 1];
  };
  // parse "2d6+3", "1d8", "7", "3d6-1"
  DS.parseDice = function (expr) {
    if (typeof expr === 'number') return { n: 0, s: 0, m: expr };
    var m = /^\s*(\d*)d(\d+)\s*([+-]\s*\d+)?\s*$/.exec(expr);
    if (!m) return { n: 0, s: 0, m: parseInt(expr, 10) || 0 };
    return { n: m[1] === '' ? 1 : parseInt(m[1], 10), s: parseInt(m[2], 10), m: m[3] ? parseInt(m[3].replace(/\s/g, ''), 10) : 0 };
  };
  // roll dice; opts.crit doubles dice; opts.reroll12 = Great Weapon Fighting
  DS.roll = function (expr, opts) {
    var p = DS.parseDice(expr), n = p.n * ((opts && opts.crit) ? 2 : 1), t = 0;
    for (var i = 0; i < n; i++) {
      var r = DS.d(p.s);
      if (opts && opts.reroll12 && r <= 2) r = DS.d(p.s);
      t += r;
    }
    return t + p.m;
  };
  DS.avgDice = function (expr) { var p = DS.parseDice(expr); return Math.floor(p.n * (p.s + 1) / 2) + p.m; };
  DS.mulberry32 = function (a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  DS.hash = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  // ---------------------------------------------------------------- storage (always guarded)
  DS.store = {
    get: function (k) { try { var v = window.localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { window.localStorage.removeItem(k); } catch (e) { } }
  };

  // ---------------------------------------------------------------- canvas
  DS.initCanvas = function () {
    var c = DS.canvas = document.getElementById('screen');
    c.width = DS.W; c.height = DS.H;
    DS.ctx = c.getContext('2d');
    DS.ctx.imageSmoothingEnabled = false;
    window.addEventListener('resize', DS.fit);
    DS.fit();
  };
  DS.fit = function () {
    var c = DS.canvas, pad = document.getElementById('pad');
    var touch = document.body.classList.contains('touch');
    var availW = window.innerWidth, availH = window.innerHeight;
    if (touch && pad) {
      var portrait = availH > availW;
      if (portrait) availH -= Math.min(260, availH * 0.42);
      else availW -= 300;
    }
    var s = Math.min(availW / DS.W, availH / DS.H);
    if (s >= 2) s = Math.floor(s); // integer scale when there is room
    s = Math.max(1, s);
    c.style.width = Math.floor(DS.W * s) + 'px';
    c.style.height = Math.floor(DS.H * s) + 'px';
  };

  // ---------------------------------------------------------------- input
  var KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    // E for WASD hands (playtest 09-26), Z for arrow hands
    KeyE: 'a', KeyZ: 'a', Enter: 'a', Space: 'a', NumpadEnter: 'a', KeyX: 'b', Escape: 'b', Backspace: 'b',
    KeyM: 'menu', Tab: 'menu', ShiftLeft: 'menu', ShiftRight: 'menu', KeyC: 'menu'
  };
  var I = DS.input = { held: {}, edge: {}, since: {}, sources: {} };
  I.press = function (btn, src) {
    I.sources[btn] = I.sources[btn] || {};
    var was = I.held[btn];
    I.sources[btn][src] = true;
    I.held[btn] = true;
    if (!was) { I.edge[btn] = true; I.since[btn] = DS.frame; }
    DS.audio && DS.audio.unlock && DS.audio.unlock();
  };
  I.release = function (btn, src) {
    if (!I.sources[btn]) return;
    delete I.sources[btn][src];
    if (Object.keys(I.sources[btn]).length === 0) I.held[btn] = false;
  };
  I.pressed = function (btn) { return !!I.edge[btn]; };
  I.down = function (btn) { return !!I.held[btn]; };
  I.repeat = function (btn) {
    if (I.edge[btn]) return true;
    if (!I.held[btn]) return false;
    var t = DS.frame - I.since[btn];
    return t > 16 && (t % 5) === 0;
  };
  I.any = function () { return I.edge.a || I.edge.b || I.edge.menu; };
  I.clearEdges = function () { I.edge = {}; };
  I.flush = function () { I.edge = {}; };
  I.dir = function () { // held direction, most recent wins
    var best = null, bt = -1;
    ['up', 'down', 'left', 'right'].forEach(function (d) { if (I.held[d] && I.since[d] > bt) { bt = I.since[d]; best = d; } });
    return best;
  };
  window.addEventListener('keydown', function (e) {
    var b = KEYMAP[e.code];
    if (!b) return;
    e.preventDefault();
    if (!e.repeat) I.press(b, 'k:' + e.code);
  });
  window.addEventListener('keyup', function (e) {
    var b = KEYMAP[e.code];
    if (!b) return;
    e.preventDefault();
    I.release(b, 'k:' + e.code);
  });
  window.addEventListener('blur', function () { I.held = {}; I.sources = {}; });

  DS.initTouch = function () {
    var pad = document.getElementById('pad');
    if (!pad) return;
    var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (isTouch) document.body.classList.add('touch');
    // d-pad: one pointer can slide between directions
    var dpad = document.getElementById('dpad');
    var active = {};
    function dirAt(ev) {
      var r = dpad.getBoundingClientRect();
      var x = ev.clientX - (r.left + r.width / 2), y = ev.clientY - (r.top + r.height / 2);
      if (Math.abs(x) < r.width * 0.12 && Math.abs(y) < r.height * 0.12) return null;
      return Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'up' : 'down');
    }
    function setDir(id, d) {
      var prev = active[id];
      if (prev === d) return;
      if (prev) I.release(prev, 'p:' + id);
      active[id] = d;
      if (d) I.press(d, 'p:' + id);
      ['up', 'down', 'left', 'right'].forEach(function (k) {
        var el = dpad.querySelector('[data-d="' + k + '"]');
        if (el) el.classList.toggle('on', !!I.held[k]);
      });
    }
    dpad.addEventListener('pointerdown', function (e) { e.preventDefault(); dpad.setPointerCapture(e.pointerId); setDir(e.pointerId, dirAt(e)); });
    dpad.addEventListener('pointermove', function (e) { if (e.pointerId in active) setDir(e.pointerId, dirAt(e)); });
    function up(e) { if (e.pointerId in active) { setDir(e.pointerId, null); delete active[e.pointerId]; } }
    dpad.addEventListener('pointerup', up); dpad.addEventListener('pointercancel', up);
    Array.prototype.forEach.call(document.querySelectorAll('[data-btn]'), function (el) {
      var b = el.getAttribute('data-btn');
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('on'); I.press(b, 'b:' + e.pointerId); });
      function rel(e) { el.classList.remove('on'); I.release(b, 'b:' + e.pointerId); }
      el.addEventListener('pointerup', rel); el.addEventListener('pointercancel', rel);
    });
    document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('#pad')) e.preventDefault(); });
    DS.fit();
  };

  // ---------------------------------------------------------------- scenes
  DS.scenes = [];
  DS.push = function (s) { DS.scenes.push(s); if (s.enter) s.enter(); return s; };
  DS.pop = function (s) {
    var i = s ? DS.scenes.lastIndexOf(s) : DS.scenes.length - 1;
    if (i < 0) return;
    var sc = DS.scenes.splice(i, 1)[0];
    if (sc.exit) sc.exit();
    if (sc.onClose) { var cb = sc.onClose; sc.onClose = null; cb(sc.result); }
    DS.input.flush();
  };
  DS.top = function () { return DS.scenes[DS.scenes.length - 1]; };
  DS.clearScenes = function () { while (DS.scenes.length) { var s = DS.scenes.pop(); if (s.exit) s.exit(); } };
  DS.find = function (kind) { for (var i = DS.scenes.length - 1; i >= 0; i--) if (DS.scenes[i].kind === kind) return DS.scenes[i]; return null; };

  // ---------------------------------------------------------------- scripts (generator coroutines)
  // A script yields "waiters": {start(script), update()->bool, result}. Scene waiters resolve via onClose.
  DS.scripts = [];
  function Script(gen, onDone) { this.gen = gen; this.wait = null; this.done = false; this.onDone = onDone; }
  Script.prototype.step = function (val) {
    for (var guard = 0; guard < 10000; guard++) {
      var r;
      try { r = this.gen.next(val); } catch (e) { console.error('script error', e); this.done = true; return; }
      if (r.done) { this.done = true; if (this.onDone) this.onDone(r.value); return; }
      var w = r.value;
      if (!w) { val = undefined; continue; }
      if (typeof w === 'function') w = { start: w };
      this.wait = w; w.finished = false;
      if (w.start) w.start(this);
      if (w.finished) { this.wait = null; val = w.result; continue; }
      return;
    }
  };
  Script.prototype.resume = function (w, result) {
    if (this.wait !== w) return;
    this.wait = null; w.result = result;
    this.step(result);
  };
  Script.prototype.update = function () {
    if (this.wait && this.wait.update && this.wait.update()) { var w = this.wait; this.resume(w, w.result); }
  };
  DS.run = function (genFn, onDone) {
    var s = new Script(genFn(), onDone);
    DS.scripts.push(s);
    s.step(undefined);
    return s;
  };
  DS.scriptActive = function () { for (var i = 0; i < DS.scripts.length; i++) if (!DS.scripts[i].done) return true; return false; };
  // waiter helpers
  DS.W8 = {
    scene: function (sc) { // push a scene; resume with its result when it closes
      return {
        start: function (script) {
          var self = this;
          sc.onClose = function (res) { self.finished = true; self.result = res; setTimeout(function () { script.resume(self, res); }, 0); };
          DS.push(sc);
        }
      };
    },
    frames: function (n) { return { t: n, update: function () { return --this.t <= 0; } }; },
    until: function (fn) { return { update: function () { return !!fn(); } }; },
    call: function (fn) { return { start: function () { this.result = fn(); this.finished = true; } }; }
  };

  // ---------------------------------------------------------------- transitions
  DS.fadeLevel = 0; // 0 = clear, 1 = black
  DS.fade = function (to, frames) {
    var from = DS.fadeLevel, t = 0;
    return {
      update: function () { t++; DS.fadeLevel = from + (to - from) * Math.min(1, t / frames); return t >= frames; }
    };
  };

  // ---------------------------------------------------------------- main loop
  var last = 0, acc = 0, STEP = 1000 / 60;
  DS.paused = false;
  function tick(now) {
    requestAnimationFrame(tick);
    if (!last) last = now;
    var dt = Math.min(250, now - last); last = now;
    if (DS.paused) return;
    acc += dt;
    var steps = 0;
    while (acc >= STEP && steps < 4) {
      update(); acc -= STEP; steps++;
    }
    if (steps >= 4) acc = 0;
    draw();
  }
  function update() {
    DS.frame++;
    var top = DS.top();
    if (top && top.update) {
      try { top.update(); } catch (e) { console.error(e); DS.lastError = e; }
    }
    // background scene ticks (animations) for scenes that ask for it
    for (var i = 0; i < DS.scenes.length - 1; i++) if (DS.scenes[i].tick) DS.scenes[i].tick();
    for (var j = 0; j < DS.scripts.length; j++) DS.scripts[j].update();
    DS.scripts = DS.scripts.filter(function (s) { return !s.done; });
    if (DS.wave && ++DS.wave.t >= DS.wave.dur) DS.wave = null;
    if (DS.audio && DS.audio.update) DS.audio.update();
    DS.input.clearEdges();
  }
  // a ripple over the whole frame (the glamour breaking): DS.wave = { t, dur, amp, tint }; rows shear on a sine that rises and settles
  var waveBuf = null;
  function drawWave(ctx) {
    var w = DS.wave, env = Math.sin(Math.PI * Math.min(1, w.t / w.dur)), amp = (w.amp || 5) * env;
    if (!waveBuf) { waveBuf = document.createElement('canvas'); waveBuf.width = DS.W; waveBuf.height = DS.H; }
    var b = waveBuf.getContext('2d');
    b.clearRect(0, 0, DS.W, DS.H); b.drawImage(ctx.canvas, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, DS.W, DS.H);
    for (var y = 0; y < DS.H; y += 2) {
      var dx = Math.round(Math.sin(y * 0.09 + w.t * 0.22) * amp);
      ctx.drawImage(waveBuf, 0, y, DS.W, 2, dx, y, DS.W, 2);
    }
    if (w.tint) { ctx.globalAlpha = 0.28 * env; ctx.fillStyle = w.tint; ctx.fillRect(0, 0, DS.W, DS.H); ctx.globalAlpha = 1; }
  }
  function draw() {
    var ctx = DS.ctx;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, DS.W, DS.H);
    var start = 0;
    for (var i = DS.scenes.length - 1; i >= 0; i--) if (DS.scenes[i].opaque) { start = i; break; }
    for (var k = start; k < DS.scenes.length; k++) {
      try { DS.scenes[k].draw(ctx); } catch (e) { console.error(e); DS.lastError = e; }
    }
    if (DS.wave) drawWave(ctx);
    if (DS.fadeLevel > 0) {
      ctx.globalAlpha = DS.clamp(DS.fadeLevel, 0, 1);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, DS.W, DS.H);
      ctx.globalAlpha = 1;
    }
    if (DS.flashColor) { ctx.globalAlpha = DS.flashAlpha || 0.5; ctx.fillStyle = DS.flashColor; ctx.fillRect(0, 0, DS.W, DS.H); ctx.globalAlpha = 1; }
  }
  DS.start = function () { requestAnimationFrame(tick); };
})();
