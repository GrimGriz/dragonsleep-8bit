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
    // no dice: a flat number, or a sum of them -- the fists' '0' with the STR on it, '0+5' (09-28h: it read as nothing, and Talmok's
    // pit fists hit for 0 and his rage)
    if (!m) { var k = 0; if (!/d/i.test(String(expr))) String(expr).replace(/\s+/g, '').replace(/([+-]?)(\d+)/g, function (x, sg, n) { k += (sg === '-' ? -1 : 1) * +n; return x; }); return { n: 0, s: 0, m: k }; } // (a string with dice this can't read sums to nothing, as before)
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

  // ---------------------------------------------------------------- sound: the 8-bit game's own chip synth (../js/audio.js, loaded after this):
  // its sound effects and its tunes, its volumes (the 'ds8-audio' key, shared with the 8-bit game). It needs DS.store.
  window.DS = window.DS || {};
  if (!window.DS.store) window.DS.store = D.store;
  function AU() { return window.DS.audio; }
  D.sfx = function (id) { var A = AU(); if (A) A.sfx(id); };
  D.music = function (id) { var A = AU(); if (A) A.play(id); };
  // a recorded line (the gimmick's clips, deep16/audio/*.mp3; Griz's livestream branding): an <audio> beside the chip synth, at the
  // effects' volume; a clip that is not there fails quietly (the caption carries the line)
  D.clip = function (url, done) {
    try {
      var a = new Audio(url), A = AU();
      a.volume = A && A.sfxVol != null ? Math.max(0, Math.min(1, A.sfxVol)) : 0.7;
      a.onended = function () { if (done) done(true); }; a.onerror = function () { if (done) done(false); };
      var p = a.play(); if (p && p.catch) p.catch(function () { if (done) done(false); });
      return a;
    } catch (e) { if (done) done(false); return null; }
  };
  // browsers start sound only on a key or a click. The synth's unlock replays a tune asked for before it, but through
  // play(), which skips a tune it thinks is already on -- so a tune that's named and not sounding is started again here
  D.unlockAudio = function () {
    var A = AU(); if (!A || !A.unlock) return;
    var first = !A.ctx;
    A.unlock();
    if (first && A.ctx && A.songId && !A.song) A.play(A.songId, true);
  };

  // ---------------------------------------------------------------- canvas
  // The screen is 480x270 logical pixels, drawn into a backing store D.R times that (D.R = the integer scale), so a
  // zoomed-out world can land on whole device pixels: at 3x, zoom 2/3 draws each art pixel as 2x2 (crisp), 1/3 as 1x1.
  D.R = 1;
  D.initCanvas = function () {
    var c = D.canvas = document.getElementById('screen');
    D.ctx = c.getContext('2d');
    window.addEventListener('resize', D.fit);
    D.fit();
  };
  D.fit = function () {
    // a phone keeps room for the pad (below the screen upright, both sides when turned), and takes a fractional scale
    // under 2x: at 1.1x the board is still bigger than at 1x
    var c = D.canvas, touch = !!D.touch, aw = window.innerWidth, ah = window.innerHeight - (touch ? 0 : 24);
    if (touch) { if (ah > aw) ah -= Math.min(250, ah * 0.42); else aw -= 320; }
    var s = Math.min(aw / D.W, ah / D.H);
    s = s >= (touch ? 2 : 1) ? Math.floor(s) : s; // integer scale: 2x = 960x540, 4x = 1920x1080
    if (D.forceScale) s = D.forceScale;
    D.scale = Math.max(0.5, s);
    c.style.width = Math.round(D.W * D.scale) + 'px';
    c.style.height = Math.round(D.H * D.scale) + 'px';
    var R = Math.max(1, Math.floor(D.scale));
    if (c.width !== D.W * R || c.height !== D.H * R) { c.width = D.W * R; c.height = D.H * R; }
    D.R = R;
    D.ctx.imageSmoothingEnabled = false; // (a resize resets the context)
  };

  // ---------------------------------------------------------------- input: the 8-bit game's keys stay meaningful; Space is END TURN here
  var KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyE: 'a', KeyZ: 'a', Enter: 'a', NumpadEnter: 'a',
    KeyX: 'b', Escape: 'b', Backspace: 'b',
    Space: 'end',
    KeyM: 'menu', Tab: 'menu', KeyC: 'center', Home: 'center',
    KeyQ: 'ring',
    Minus: 'zoomout', NumpadSubtract: 'zoomout', Equal: 'zoomin', NumpadAdd: 'zoomin',
    Backquote: 'stats',
    KeyP: 'play', KeyR: 'rec',
    Digit1: 'n1', Digit2: 'n2', Digit3: 'n3', Digit4: 'n4', Digit5: 'n5', Digit6: 'n6', Digit7: 'n7', Digit8: 'n8', Digit9: 'n9',
    Numpad1: 'n1', Numpad2: 'n2', Numpad3: 'n3', Numpad4: 'n4', Numpad5: 'n5', Numpad6: 'n6', Numpad7: 'n7', Numpad8: 'n8', Numpad9: 'n9'
  };
  var I = D.input = { held: {}, edge: {}, since: {}, mouse: { x: -1, y: -1, moved: false, click: false, rclick: false, inside: false, inWin: false, wheel: 0 } };
  I.press = function (b) { if (!I.held[b]) { I.edge[b] = true; I.since[b] = D.frame; } I.held[b] = true; };
  I.release = function (b) { I.held[b] = false; };
  I.pressed = function (b) { return !!I.edge[b]; };
  I.repeat = function (b) {
    if (I.edge[b]) return true;
    if (!I.held[b]) return false;
    var t = D.frame - I.since[b];
    return t > 14 && t % 5 === 0;
  };
  I.clear = function () { I.edge = {}; I.mouse.click = false; I.mouse.rclick = false; I.mouse.moved = false; I.mouse.wheel = 0; };
  window.addEventListener('keydown', function (e) {
    var b = KEYMAP[e.code];
    if (!b) return;
    e.preventDefault();
    if (!e.repeat) I.press(b);
    D.unlockAudio();
  });
  window.addEventListener('keyup', function (e) { var b = KEYMAP[e.code]; if (b) { e.preventDefault(); I.release(b); } });
  window.addEventListener('blur', function () { I.held = {}; I.mouse.inWin = false; I.mouse.inside = false; });

  // the game pad (../js/pad.js, the 8-bit game's, loaded after this). RULED 09-28 (Griz): the right stick up/down zooms (up in,
  // down out), left/right calls the wheel up and turns it; the left stick pressed in, before anything on the wheel is
  // chosen, drops the wheel and frees the cursor. The left stick walks the cursor where it points on the screen (js/ui.js
  // stickCursor), the d-pad along the grid's axes as the arrows do. The rest as the keys are laid out: A is E, B is X,
  // Y is END TURN (Space), X/square INFO (the right-click), start MENU, back and R3 recentre (C), the bumpers turn the
  // wheel and the triggers zoom, for a hand that would rather press than push
  var PADMAP = {
    buttons: { 0: 'a', 1: 'b', 2: 'info', 3: 'end', 4: 'wheell', 5: 'wheelr', 6: 'zoomout', 7: 'zoomin', 8: 'center', 9: 'menu',
      10: 'drop', 11: 'center', 12: 'up', 13: 'down', 14: 'left', 15: 'right' },
    ls: { up: 'up', down: 'down', left: 'left', right: 'right' },
    rs: { up: 'zoomin', down: 'zoomout', left: 'wheell', right: 'wheelr' },
    hint: {
      xbox: 'LEFT STICK cursor &middot; D-PAD along the grid &middot; A confirm &middot; B back &middot; RIGHT STICK &#9664;&#9654; the wheel, &#9650;&#9660; zoom &middot; L3 drop the wheel &middot; X inspect &middot; Y end turn &middot; START menu &middot; R3 recentre &middot; LB/RB the wheel &middot; LT/RT zoom',
      ps: 'LEFT STICK cursor &middot; D-PAD along the grid &middot; &#10005; confirm &middot; &#9675; back &middot; RIGHT STICK &#9664;&#9654; the wheel, &#9650;&#9660; zoom &middot; L3 drop the wheel &middot; &#9633; inspect &middot; &#9651; end turn &middot; OPTIONS menu &middot; R3 recentre &middot; L1/R1 the wheel &middot; L2/R2 zoom'
    }
  };
  // the hints drawn in the game, in the pad's names while the hand is on it (D.keys wraps each hint where it's drawn)
  var SAY = [
    [/\bM or Tab\b/g, 'START', 'OPTIONS'], [/\bX\/Esc\b/g, 'B', '○'], [/wheel or -\/= zoom/g, 'RIGHT STICK ▲▼ zoom', 'RIGHT STICK ▲▼ zoom'],
    [/\bSPACE\b/g, 'Y', '△'], [/\bE\b/g, 'A', '✕'], [/\bX\b/g, 'B', '○'], [/\bM\b/g, 'START', 'OPTIONS'], [/\bC\b/g, 'R3', 'R3'],
    [/\bQ\b/g, 'RIGHT STICK', 'RIGHT STICK']
  ];
  // on a phone the hand is on the touch pad (A, B, MENU, END on the screen): a hint says those, not E and X (tester, 09-29)
  var SAYT = [
    [/\bM or Tab\b/g, 'MENU'], [/\bX\/Esc\b/g, 'B'], [/wheel or -\/= zoom/g, '-/+ zoom'], [/\bC recentre  /g, ''], [/\bSPACE\b/g, 'END'],
    [/\bE\b/g, 'A'], [/\bX\b/g, 'B'], [/\bM\b/g, 'MENU']
  ];
  D.keys = function (s) {
    var P = window.DS.pad, t = P ? P.say(s, SAY) : s;
    if (t === s && D.touch) SAYT.forEach(function (r) { t = t.replace(r[0], r[1]); });
    return t;
  };
  I.stickWay = null; // the way the left stick is pressing the four, if it is (the grid takes the stick's own path instead)
  I.pollPad = function () {
    var P = window.DS.pad;
    if (!P) return;
    var busy = P.poll(PADMAP, I.press, I.release);
    I.stickWay = P.ways.ls || null;
    // the stick's own beat: pressed afresh whenever it swings to another eighth of the compass, repeating while it stays
    var s = P.stick, oct = Math.hypot(s.x, s.y) >= (I.held.stick ? 0.3 : 0.5) ? (Math.round(Math.atan2(-s.y, s.x) / (Math.PI / 4)) + 8) % 8 : -1;
    if (oct !== I.stickOct) { I.release('stick'); if (oct >= 0) I.press('stick'); I.stickOct = oct; }
    if (I.edge.info) I.mouse.rclick = true; // INFO: look at what the cursor is on
    // the hand went to the pad: the mouse is parked (a pointer left resting at the screen's edge would scroll the view for
    // ever, and one left over a menu would take its hover back) until it moves again
    if (busy) { var m = I.mouse; m.inWin = false; m.inside = false; m.x = -1; m.y = -1; m.drag = null; }
  };
  D.initMouse = function () {
    var c = D.canvas;
    // the mouse is followed over the whole window, so the view keeps scrolling when it runs off the canvas into the
    // margin; 'moved' only when it crosses a logical pixel (a resting hand's twitch shouldn't steal a menu's choice)
    function at(e) {
      if (ghost()) return;
      var r = c.getBoundingClientRect();
      var x = Math.floor((e.clientX - r.left) / r.width * D.W), y = Math.floor((e.clientY - r.top) / r.height * D.H);
      if (x !== I.mouse.x || y !== I.mouse.y) I.mouse.moved = true;
      I.mouse.x = x; I.mouse.y = y; I.mouse.inWin = true;
      I.mouse.inside = x >= 0 && y >= 0 && x < D.W && y < D.H;
    }
    window.addEventListener('mousemove', function (e) {
      at(e);
      var d = I.mouse.drag; if (d) { I.mouse.panX = (I.mouse.panX || 0) + (I.mouse.x - d.x); I.mouse.panY = (I.mouse.panY || 0) + (I.mouse.y - d.y); d.x = I.mouse.x; d.y = I.mouse.y; }
    });
    c.addEventListener('mouseleave', function () { I.mouse.inside = false; });
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { I.mouse.inWin = false; I.mouse.inside = false; } }); // off the window
    c.addEventListener('wheel', function (e) { e.preventDefault(); at(e); I.mouse.wheel += e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0; }, { passive: false });
    c.addEventListener('mousedown', function (e) {
      if (ghost()) return;
      at(e); e.preventDefault(); c.focus(); D.unlockAudio();
      if (e.button === 0) I.mouse.click = true;
      if (e.button === 1) I.mouse.drag = { x: I.mouse.x, y: I.mouse.y }; // the middle button drags the view
      if (e.button === 2) I.mouse.rclick = true;
    });
    window.addEventListener('mouseup', function (e) { if (e.button === 1) I.mouse.drag = null; });
    c.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  };
  // a finger's taps also arrive as made-up mouse events a moment later in some browsers: those are ignored
  function ghost() { return D.touchT && performance.now() - D.touchT < 800; }

  // ---------------------------------------------------------------- touch (phones): the 8-bit game's pad (its js/core.js DS.initTouch) in
  // DEEP16's colours, and the canvas read for a finger. A tap points (the cursor goes there, nothing happens yet); a
  // second tap on the same spot acts; a drag pans the view; a long press inspects (the right-click). The edge-scroll
  // is off for a finger (a finger never leaves the window, so the view would drift). ?touch forces it, ?notouch hides it.
  D.initTouch = function () {
    var pad = document.getElementById('pad'), c = D.canvas, q = location.search, m = I.mouse;
    if (!pad) return;
    var mq = function (s) { return !!(window.matchMedia && window.matchMedia(s).matches); };
    var on = /[?&]touch\b/.test(q) || (!/[?&]notouch\b/.test(q) && (mq('(pointer: coarse)') || (navigator.maxTouchPoints > 0 && mq('(hover: none)'))));
    if (!on) return;
    D.touch = true; document.body.classList.add('touch');
    // a lifted finger counts as the gesture that may start sound, a finger put down may not: wake it on both
    function wake() { D.touchT = performance.now(); D.unlockAudio(); }
    function hold(el, e) { try { el.setPointerCapture(e.pointerId); } catch (x) { /* a pointer that can't be captured still counts */ } }
    // the d-pad: one finger can slide between directions
    var dpad = document.getElementById('dpad'), active = {};
    function dirAt(ev) {
      var r = dpad.getBoundingClientRect(), x = ev.clientX - (r.left + r.width / 2), y = ev.clientY - (r.top + r.height / 2);
      if (Math.abs(x) < r.width * 0.12 && Math.abs(y) < r.height * 0.12) return null;
      return Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'up' : 'down');
    }
    function setDir(id, d) {
      var prev = active[id];
      if (prev === d) return;
      if (prev) I.release(prev);
      active[id] = d;
      if (d) I.press(d);
      ['up', 'down', 'left', 'right'].forEach(function (k) { var el = dpad.querySelector('[data-d="' + k + '"]'); if (el) el.classList.toggle('on', !!I.held[k]); });
    }
    dpad.addEventListener('pointerdown', function (e) { e.preventDefault(); hold(dpad, e); wake(); setDir(e.pointerId, dirAt(e)); });
    dpad.addEventListener('pointermove', function (e) { if (e.pointerId in active) setDir(e.pointerId, dirAt(e)); });
    function dUp(e) { if (e.pointerId in active) { setDir(e.pointerId, null); delete active[e.pointerId]; } wake(); }
    dpad.addEventListener('pointerup', dUp); dpad.addEventListener('pointercancel', dUp);
    Array.prototype.forEach.call(pad.querySelectorAll('[data-btn]'), function (el) {
      var b = el.getAttribute('data-btn');
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); hold(el, e); el.classList.add('on'); I.press(b); wake(); });
      function rel() { el.classList.remove('on'); I.release(b); wake(); }
      el.addEventListener('pointerup', rel); el.addEventListener('pointercancel', rel);
    });
    // INFO: inspect whatever the cursor is on (the right-click)
    Array.prototype.forEach.call(pad.querySelectorAll('[data-tap=inspect]'), function (el) {
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); el.classList.add('on'); m.rclick = true; wake(); });
      el.addEventListener('pointerup', function () { el.classList.remove('on'); wake(); });
    });
    // the canvas under a finger
    var f = null, last = null, HOLD = 450, SLOP = 10;
    function spot(e) { var r = c.getBoundingClientRect(); return { x: Math.floor((e.clientX - r.left) / r.width * D.W), y: Math.floor((e.clientY - r.top) / r.height * D.H) }; }
    c.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      e.preventDefault(); hold(c, e); wake();
      if (f) return; // a second finger is ignored
      var p = spot(e);
      f = { id: e.pointerId, cx: e.clientX, cy: e.clientY, x: p.x, y: p.y, lx: p.x, ly: p.y, drag: false, held: false };
      m.x = p.x; m.y = p.y; m.moved = true; m.inside = true; m.inWin = false;
      f.timer = setTimeout(function () { if (f && !f.drag) { f.held = true; m.rclick = true; } }, HOLD);
    });
    c.addEventListener('pointermove', function (e) {
      if (!f || e.pointerId !== f.id) return;
      D.touchT = performance.now();
      var p = spot(e);
      if (!f.drag && Math.hypot(e.clientX - f.cx, e.clientY - f.cy) > SLOP) { f.drag = true; clearTimeout(f.timer); }
      if (f.drag) { m.panX = (m.panX || 0) + (p.x - f.lx); m.panY = (m.panY || 0) + (p.y - f.ly); f.lx = p.x; f.ly = p.y; }
    });
    function lift(e) {
      if (!f || e.pointerId !== f.id) return;
      clearTimeout(f.timer); wake();
      if (!f.drag && !f.held && e.type === 'pointerup') {
        var now = performance.now();
        if (last && now - last.t < 1500 && Math.abs(f.x - last.x) <= 6 && Math.abs(f.y - last.y) <= 6) { m.click = true; last = null; }
        else last = { x: f.x, y: f.y, t: now };
      } else last = null;
      f = null; m.inWin = false;
    }
    c.addEventListener('pointerup', lift); c.addEventListener('pointercancel', lift);
    document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('#pad')) e.preventDefault(); });
    D.fit();
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
    var A = AU(); if (A && A.update) A.update(); // the tune's notes, scheduled a little ahead
    I.pollPad();
    if (I.pressed('stats')) D.showStats = !D.showStats;
    var s = D.top();
    if (s && s.update) s.update();
    I.clear();
    D.frame++;
  };
  D.draw = function () {
    var ctx = D.ctx;
    ctx.setTransform(D.R, 0, 0, D.R, 0, 0);
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
  // {:undead} in a line draws that creature type's 9x9 glyph where it stands, 10 px wide (js/ui.js UI.drawGlyph; Griz, 09-29: "use the
  // symbols in the spell description, maybe add (inspect)"). D.typeText puts one after each type a spell's words name.
  var GT = /\{:([a-z]+)\}/g, GW = 10;
  function glyphSplit(s) { var out = [], last = 0, m; GT.lastIndex = 0; while ((m = GT.exec(s))) { out.push(s.slice(last, m.index)); out.push({ g: m[1] }); last = GT.lastIndex; } out.push(s.slice(last)); return out; }
  D.text = function (ctx, s, x, y, color, align) {
    var DS = window.DS, w = D.textWidth(s);
    s = String(s);
    if (align === 'center') x -= Math.round(w / 2);
    if (align === 'right') x -= w;
    if (s.indexOf('{:') < 0) {
      DS.text(ctx, DS.stripCodes(s), x + 1, y + 1, '#05040a');
      DS.text(ctx, s, x, y, color || '#e8e4d8');
      return w;
    }
    var cx = x, open = '';
    glyphSplit(s).forEach(function (seg) {
      if (typeof seg !== 'string') { if (D.ui && D.ui.drawGlyph) D.ui.drawGlyph(ctx, seg.g, cx + 4, y + 3, { bare: true }); cx += GW; return; }
      if (!seg) return;
      var t = open + seg;
      DS.text(ctx, DS.stripCodes(t), cx + 1, y + 1, '#05040a');
      cx += DS.text(ctx, t, cx, y, color || '#e8e4d8');
      var m = seg.match(/\{([a-z\/])\}/g); if (m) { var l = m[m.length - 1]; open = l === '{/}' ? '' : l; } // (a colour carries across a glyph)
    });
    return w;
  };
  D.hint = function (ctx, s, x, y, color, align) { return D.text(ctx, D.keys(s), x, y, color, align); }; // a line naming keys
  D.textWidth = function (s) { var n = 0; s = String(s).replace(GT, function () { n++; return ''; }); return window.DS.textWidth(s) + n * GW; };
  D.wrap = function (s, w) {
    if (String(s).indexOf('{:') < 0) return window.DS.wrap(s, w);
    var out = []; // (the 8-bit's wrap, measuring with the glyphs' width)
    String(s).split('\n').forEach(function (para) {
      var line = '', open = '';
      para.split(' ').forEach(function (wd) {
        var test = line ? line + ' ' + wd : wd;
        if (D.textWidth(test) > w && line) { out.push(line); line = open + wd; } else line = test;
        var m = wd.match(/\{([a-z\/])\}/g); if (m) { var last = m[m.length - 1]; open = last === '{/}' ? '' : last; }
      });
      out.push(line);
    });
    return out;
  };
  // a spell's words with each creature type they name shown as its glyph in place of the word (Griz, 09-29: "meant in lieu of the words - we
  // have a lot of words on screen that go by fast"), a list of them run together, and "(inspect)" after when any is named (right-click shows
  // a creature's type); noHint leaves the "(inspect)" off (the fast cards, or a caller that puts it once after two texts). Lower case only,
  // so a name (Turn Undead, Fey Ancestry) keeps its words
  // (one pass, so a glyph put in is never matched again)
  var TYPEWORD = /\b(the otherworldly|the dead|undead|aberrations?|celestials?|elementals?|fey|fiends?|humanoids?|beasts?|constructs?|oozes?|monstrosit(?:y|ies))\b/g;
  function typeToken(w) {
    if (w === 'the otherworldly') return '{:aberration}{:celestial}{:elemental}{:fey}{:fiend}';
    if (w === 'the dead' || w === 'undead') return '{:undead}';
    return '{:' + (/^monstrosit/.test(w) ? 'monstrosity' : w === 'fey' ? 'fey' : w.replace(/s$/, '')) + '}';
  }
  D.typeText = function (s, noHint) {
    var s0 = String(s || ''); s = s0.replace(TYPEWORD, typeToken);
    if (s === s0) return s;
    s = s.replace(/\}(?:,? and |, )(?=\{:)/g, '}'); // (a list of types: the glyphs side by side)
    return noHint ? s : s + ' {g}(inspect){/}';
  };

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
