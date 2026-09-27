/* DEEP16 — core: namespace, canvas at 480x270 integer-scaled, loop, input (keys + mouse), dice, palette. */
'use strict';
(function () {
  var D = window.D16 = window.D16 || {};
  D.W = 480; D.H = 270;
  D.frame = 0;

  // ---------------------------------------------------------------- dice and rng
  D.seed = (Date.now() >>> 0);
  D.rand = function () { // mulberry32, reseedable for the harness
    var a = D.seed = (D.seed + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  D.rint = function (n) { return Math.floor(D.rand() * n); };
  D.d = function (s) { return 1 + D.rint(s); };
  D.parseDice = function (expr) {
    var m = /^(\d*)d(\d+)\s*([+-]\s*\d+)?$/.exec(String(expr).replace(/\s+/g, ''));
    if (!m) return { n: 0, s: 0, m: +expr || 0 };
    return { n: +(m[1] || 1), s: +m[2], m: m[3] ? +m[3].replace(/\s+/g, '') : 0 };
  };
  D.roll = function (expr, o) { // o.gwf: reroll 1s and 2s once (Great Weapon Fighting); o.crit: double the dice
    var p = D.parseDice(expr), n = p.n * ((o && o.crit) ? 2 : 1), t = 0, rolls = [];
    for (var i = 0; i < n; i++) {
      var r = D.d(p.s);
      if (o && o.gwf && r <= 2) r = D.d(p.s);
      rolls.push(r); t += r;
    }
    return { total: t + p.m, rolls: rolls, mod: p.m };
  };
  D.mod = function (score) { return Math.floor((score - 10) / 2); };
  D.hash = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  D.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  // ---------------------------------------------------------------- storage (guarded, same origin as the 8-bit game)
  D.store = {
    get: function (k) { try { var v = window.localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };

  // ---------------------------------------------------------------- canvas
  D.initCanvas = function () {
    var c = D.canvas = document.getElementById('screen');
    c.width = D.W; c.height = D.H;
    D.ctx = c.getContext('2d');
    D.ctx.imageSmoothingEnabled = false;
    window.addEventListener('resize', D.fit);
    D.fit();
  };
  D.fit = function () {
    var c = D.canvas, s = Math.min(window.innerWidth / D.W, (window.innerHeight - 24) / D.H);
    s = s >= 1 ? Math.floor(s) : s; // integer scale: 2x = 960x540, 4x = 1920x1080
    if (D.forceScale) s = D.forceScale;
    D.scale = Math.max(0.5, s);
    c.style.width = Math.round(D.W * D.scale) + 'px';
    c.style.height = Math.round(D.H * D.scale) + 'px';
  };

  // ---------------------------------------------------------------- input: the 8-bit game's keys stay meaningful; Space is END TURN here
  var KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyE: 'a', KeyZ: 'a', Enter: 'a', NumpadEnter: 'a',
    KeyX: 'b', Escape: 'b', Backspace: 'b',
    Space: 'end',
    KeyM: 'menu', Tab: 'menu', KeyC: 'center', Home: 'center', KeyH: 'help',
    Backquote: 'stats',
    Digit1: 'n1', Digit2: 'n2', Digit3: 'n3', Digit4: 'n4', Digit5: 'n5', Digit6: 'n6', Digit7: 'n7', Digit8: 'n8', Digit9: 'n9',
    Numpad1: 'n1', Numpad2: 'n2', Numpad3: 'n3', Numpad4: 'n4', Numpad5: 'n5', Numpad6: 'n6', Numpad7: 'n7', Numpad8: 'n8', Numpad9: 'n9'
  };
  var I = D.input = { held: {}, edge: {}, since: {}, mouse: { x: -1, y: -1, moved: false, click: false, rclick: false, inside: false } };
  I.press = function (b) { if (!I.held[b]) { I.edge[b] = true; I.since[b] = D.frame; } I.held[b] = true; };
  I.release = function (b) { I.held[b] = false; };
  I.pressed = function (b) { return !!I.edge[b]; };
  I.repeat = function (b) {
    if (I.edge[b]) return true;
    if (!I.held[b]) return false;
    var t = D.frame - I.since[b];
    return t > 14 && t % 5 === 0;
  };
  I.clear = function () { I.edge = {}; I.mouse.click = false; I.mouse.rclick = false; I.mouse.moved = false; };
  window.addEventListener('keydown', function (e) {
    var b = KEYMAP[e.code];
    if (!b) return;
    e.preventDefault();
    if (!e.repeat) I.press(b);
  });
  window.addEventListener('keyup', function (e) { var b = KEYMAP[e.code]; if (b) { e.preventDefault(); I.release(b); } });
  window.addEventListener('blur', function () { I.held = {}; });
  D.initMouse = function () {
    var c = D.canvas;
    function at(e) {
      var r = c.getBoundingClientRect();
      I.mouse.x = Math.floor((e.clientX - r.left) / r.width * D.W);
      I.mouse.y = Math.floor((e.clientY - r.top) / r.height * D.H);
      I.mouse.inside = I.mouse.x >= 0 && I.mouse.y >= 0 && I.mouse.x < D.W && I.mouse.y < D.H;
    }
    c.addEventListener('mousemove', function (e) { at(e); I.mouse.moved = true; });
    c.addEventListener('mouseleave', function () { I.mouse.inside = false; });
    c.addEventListener('mousedown', function (e) {
      at(e); e.preventDefault(); c.focus();
      if (e.button === 0) I.mouse.click = true;
      if (e.button === 1) I.mouse.drag = { x: I.mouse.x, y: I.mouse.y }; // the middle button drags the view
      if (e.button === 2) I.mouse.rclick = true;
    });
    window.addEventListener('mouseup', function (e) { if (e.button === 1) I.mouse.drag = null; });
    c.addEventListener('mousemove', function () { var d = I.mouse.drag; if (d) { I.mouse.panX = (I.mouse.panX || 0) + (I.mouse.x - d.x); I.mouse.panY = (I.mouse.panY || 0) + (I.mouse.y - d.y); d.x = I.mouse.x; d.y = I.mouse.y; } });
    c.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  };

  // ---------------------------------------------------------------- scenes (a small stack, like the 8-bit game's)
  D.scenes = [];
  D.push = function (s) { D.scenes.push(s); if (s.enter) s.enter(); };
  D.pop = function () { var s = D.scenes.pop(); if (s && s.exit) s.exit(); return s; };
  D.top = function () { return D.scenes[D.scenes.length - 1]; };

  // ---------------------------------------------------------------- loop: fixed 60 Hz update, draw on rAF; a stats overlay on the backquote key
  var acc = 0, last = 0, fpsT = 0, fpsN = 0;
  D.fps = 0; D.showStats = /[?&]stats\b/.test(location.search);
  D.paused = false;
  D.update = function () {
    if (I.pressed('stats')) D.showStats = !D.showStats;
    var s = D.top();
    if (s && s.update) s.update();
    I.clear();
    D.frame++;
  };
  D.draw = function () {
    var ctx = D.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, D.W, D.H);
    for (var i = 0; i < D.scenes.length; i++) {
      var s = D.scenes[i];
      if (i < D.scenes.length - 1 && D.scenes[i + 1].opaque) continue;
      if (s.draw) s.draw(ctx);
    }
    if (D.showStats) {
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(D.W - 70, 2, 68, 20);
      D.text(ctx, D.fps + ' FPS  ' + D.scale + 'x', D.W - 66, 6, '#a8e8ff');
      D.text(ctx, (D.drawMs || 0).toFixed(1) + ' ms draw', D.W - 66, 14, '#a8e8ff');
    }
  };
  function tick(t) {
    requestAnimationFrame(tick);
    if (D.paused) return;
    if (!last) last = t;
    acc += Math.min(100, t - last); last = t;
    var n = 0;
    while (acc >= 1000 / 60 && n < 4) { D.update(); acc -= 1000 / 60; n++; }
    if (n) {
      var t0 = performance.now();
      D.draw();
      D.drawMs = (D.drawMs || 0) * 0.9 + (performance.now() - t0) * 0.1;
      fpsN++;
    }
    if (t - fpsT >= 1000) { D.fps = fpsN; fpsN = 0; fpsT = t; }
  }
  D.start = function () { requestAnimationFrame(tick); };

  // ---------------------------------------------------------------- text: the 8-bit game's own bitmap font (../js/font.js), with a drop shadow
  // so the lettering carries across the seam. {y}...{/} colour codes work as there.
  D.text = function (ctx, s, x, y, color, align) {
    var DS = window.DS, w = DS.textWidth(s);
    if (align === 'center') x -= Math.round(w / 2);
    if (align === 'right') x -= w;
    DS.text(ctx, DS.stripCodes(s), x + 1, y + 1, '#05040a');
    DS.text(ctx, s, x, y, color || '#e8e4d8');
    return w;
  };
  D.textWidth = function (s) { return window.DS.textWidth(s); };
  D.wrap = function (s, w) { return window.DS.wrap(s, w); };

  // ---------------------------------------------------------------- assets
  D.images = {};
  D.loadImages = function (list, done) {
    var left = list.length;
    if (!left) { done(); return; }
    list.forEach(function (src) {
      var im = new Image();
      im.onload = im.onerror = function () { if (--left === 0) done(); };
      im.src = src;
      D.images[src] = im;
    });
  };
})();
