/* DRAGONSLEEP — the game pad (09-28, Griz: "people with xbox/playstation like controllers"), for both games. An Xbox or
   PlayStation pad, or one like them, plugged into the computer. The 8-bit game (js/core.js) and DEEP16 (deep16/js/core.js)
   each ask it once an update what is held, by names of their own (DS.pad.poll), and press and let go their own buttons on
   the difference, as the keys and the phone pad do.
   The browser's "standard" layout numbers the buttons by place, not by letter, so one table serves both makers:
     0 the bottom face button (A, cross)   1 the right (B, circle)   2 the left (X, square)   3 the top (Y, triangle)
     4 5 the bumpers (LB RB, L1 R1)   6 7 the triggers (LT RT, L2 R2)   8 back (View, Share)   9 start (Menu, Options)
     10 11 the sticks pressed in (L3 R3)   12 13 14 15 the d-pad: up down left right   16 the guide (the system keeps it)
   A pad the browser can't lay out that way (mapping '') is left alone: its axes are anybody's guess, and a throttle resting at
   the end of its travel would hold a direction down for ever. A browser shows no pad at all until one of its buttons is
   pressed with the page in front, and a pad's press does not count as the gesture that lets a page make sound: that still
   takes a key or a click. */
'use strict';
(function () {
  var DS = window.DS = window.DS || {};
  var P = DS.pad = { seen: false, kind: null, stick: { x: 0, y: 0 }, ways: {} };
  var ON = 0.5, OFF = 0.3; // a stick counts past ON and lets go under OFF (the gap: a resting thumb doesn't chatter)
  var last = {}, lastT = 0;

  function pads() {
    var list = null, out = [];
    try { list = navigator.getGamepads ? navigator.getGamepads() : null; } catch (e) { list = null; }
    if (list) for (var i = 0; i < list.length; i++) { var g = list[i]; if (g && g.connected !== false && g.mapping === 'standard') out.push(g); }
    return out;
  }
  function kindOf(id) { return /054c|playstation|dualshock|dualsense|sony/i.test(id || '') ? 'ps' : 'xbox'; }

  // a stick's four ways: the one furthest over, held till the stick comes back under OFF; a way held keeps on through a
  // diagonal until the other axis is clearly ahead, so a thumb on the slant doesn't flicker between two
  function way(key, x, y) {
    var held = P.ways[key], m = Math.max(Math.abs(x), Math.abs(y));
    if (m < (held ? OFF : ON)) { P.ways[key] = null; return null; }
    var d = Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'up' : 'down');
    if (held && held !== d) {
      var hx = held === 'left' || held === 'right', a = hx ? x : y, b = hx ? y : x;
      var same = (held === 'left' || held === 'up') ? a < 0 : a > 0;
      if (same && Math.abs(a) * 1.25 >= Math.abs(b) && Math.abs(a) >= OFF) d = held;
    }
    P.ways[key] = d;
    return d;
  }

  // map = { buttons: { index: name }, ls: { up: name, down: .., left: .., right: .. }, rs: { .. } } (a stick left out is
  // read but presses nothing). press(name) and release(name) are the game's own. Returns true when the pad did something
  // this update (a press, or a stick out past ON): the game can take that as the hand having moved to the pad.
  P.poll = function (map, press, release) {
    var gs = pads(), now = {}, t = performance.now(), lx = 0, ly = 0, rx = 0, ry = 0;
    gs.forEach(function (g) {
      for (var i in map.buttons) {
        var b = g.buttons[i];
        if (!b) continue;
        // the triggers are analogue: half way down counts (the browser's own 'pressed' fires at a brush)
        if (i === '6' || i === '7' ? b.value > 0.5 : b.pressed) now[map.buttons[i]] = true;
      }
      var ax = g.axes || [];
      if (Math.hypot(ax[0] || 0, ax[1] || 0) > Math.hypot(lx, ly)) { lx = ax[0] || 0; ly = ax[1] || 0; }
      if (Math.hypot(ax[2] || 0, ax[3] || 0) > Math.hypot(rx, ry)) { rx = ax[2] || 0; ry = ax[3] || 0; }
    });
    if (gs.length) { P.seen = true; P.kind = kindOf(gs[0].id); }
    P.stick.x = lx; P.stick.y = ly; P.rstick = { x: rx, y: ry };
    var wl = way('ls', lx, ly), wr = way('rs', rx, ry);
    if (wl && map.ls && map.ls[wl]) now[map.ls[wl]] = true;
    if (wr && map.rs && map.rs[wr]) now[map.rs[wr]] = true;
    // the game hasn't asked for a while (paused under DEEP16, a hidden tab): whatever is held now was pressed elsewhere, and
    // doesn't count here till it's let go and pressed again (the A that closed the fight mustn't also skip the next line)
    var fresh = t - lastT > 300;
    lastT = t;
    var any = false;
    for (var j in last) if (!now[j]) release(j);
    if (fresh) { last = now; return false; }
    for (var k in now) if (!last[k]) { press(k); any = true; }
    last = now;
    if (any || wl || wr) { P.hand = true; legend(map); }
    return any || !!(wl || wr);
  };

  // the hand on the pad (P.hand): the line under the screen (#hint) gives the pad's names (map.hint = { xbox, ps }), and the
  // hints drawn in the game say them too (P.say); a key or the mouse puts the keys' names back
  var keysHint = null;
  function legend(map) {
    var el = document.getElementById('hint');
    if (!el || !map.hint || P.shown === P.kind) return;
    if (keysHint == null) keysHint = el.innerHTML;
    el.innerHTML = map.hint[P.kind] || map.hint.xbox;
    P.shown = P.kind;
  }
  function keysBack() {
    if (!P.hand) return;
    P.hand = false;
    var el = document.getElementById('hint');
    if (el && keysHint != null) el.innerHTML = keysHint;
    P.shown = null;
  }
  window.addEventListener('keydown', keysBack, true);
  window.addEventListener('mousedown', keysBack, true);
  window.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') keysBack(); }, true);
  // a hint's key names as the pad's: table = [[pattern, xbox, ps], ...] in order (the game's own; the PlayStation names are
  // the font's own glyphs, js/font.js)
  P.say = function (s, table) {
    if (!P.hand || !table) return s;
    var ps = P.kind === 'ps';
    table.forEach(function (r) { s = s.replace(r[0], ps ? r[2] : r[1]); });
    return s;
  };
})();
