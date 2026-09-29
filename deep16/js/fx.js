/* DEEP16 — effects, drawn in world space so the camera can cut under them: floating numbers, projectiles (a crossbow
   bolt, a fire bolt), the fireball's bloom over its squares, sparkles (Misty Step, Lay on Hands, the jaunt), the
   shield's ring, a weapon's arc. Every colour is from the palette. */
'use strict';
(function () {
  var D = window.D16;
  var FX = D.fx = { list: [] };
  var P = function (r, i) { return D.PAL.ramps[r][i]; };
  FX.clear = function () { FX.list = []; };
  FX.add = function (f) { f.t = 0; FX.list.push(f); return f; };
  // an effect may land with something of its own when it ends (a spell's shot pops where it strikes): run after the sweep, so what
  // it adds is kept
  FX.update = function () {
    var ends = [];
    FX.list = FX.list.filter(function (f) { f.t++; if (f.t >= f.dur && f.onEnd) ends.push(f); return f.t < f.dur; });
    ends.forEach(function (f) { var e = f.onEnd; f.onEnd = null; e(); });
  };
  FX.busy = function () { return FX.list.some(function (f) { return f.blocking; }); };
  function scr(gx, gy, gz) { var c = D.iso.center(gx, gy, gz || 0); return D.iso.toScreen(c.x, c.y); }
  FX.at = function (u) { var s = u.size || 1, x = u.drawAt ? u.drawAt.x : u.x, y = u.drawAt ? u.drawAt.y : u.y; return { gx: x + (s - 1) / 2, gy: y + (s - 1) / 2, gz: D.grid.gzAt(u, x, y) }; };

  FX.float = function (text, u, color, big) {
    var p = FX.at(u), n = FX.list.filter(function (f) { return f.kind === 'float' && f.u === u && f.t < 20; }).length;
    return FX.add({ kind: 'float', screen: true, u: u, dur: 70, draw: function (ctx) { // drawn over the world at full size, so it reads zoomed out too
      var s = scr(p.gx, p.gy, p.gz), top = D.spr.unitTop(u) * (D.iso.inWorld ? 1 : D.iso.zoom), k = Math.min(1, this.t / 10);
      D.text(ctx, text, s.x, s.y - top - 6 - k * 12 - n * 9, color, 'center');
    } });
  };
  // a shot. 'bolt' is a crossbow's; 'fire' the old fire bead. Inside a spell's cast (FX.ctx, js/looks.js) a 'fire' or 'bolt' is the
  // spell's own travel: 'fire', 'frost', 'mote', 'wisp', 'glob', 'dart', 'orb', or 'beam' / 'ray' / 'jag' (FX.beam, FX.jag)
  FX.projectile = function (from, to, kind, o) {
    var cx0 = FX.ctx; o = o || {};
    if (cx0 && cx0.travel && (kind === 'fire' || kind === 'bolt')) kind = cx0.travel;
    if (kind !== 'bolt' && (kind !== 'fire' || (cx0 && cx0.el))) return spellShot(from, to, kind, o.el || (cx0 && cx0.el) || (kind === 'fire' ? 'fire' : 'arcane'), o);
    var a = FX.at(from), b = FX.at(to), dist = Math.hypot(a.gx - b.gx, a.gy - b.gy), dur = Math.max(10, Math.round(dist * 3));
    return FX.add({ kind: 'proj', blocking: true, dur: dur, draw: function (ctx) {
      var t = this.t / this.dur, gx = a.gx + (b.gx - a.gx) * t, gy = a.gy + (b.gy - a.gy) * t;
      var s = scr(gx, gy, (a.gz + (b.gz - a.gz) * t) + 26 + Math.sin(t * Math.PI) * (kind === 'bolt' ? 6 : 10));
      var s0 = scr(a.gx + (b.gx - a.gx) * Math.max(0, t - 0.08), a.gy + (b.gy - a.gy) * Math.max(0, t - 0.08), 26 + a.gz);
      if (kind === 'bolt') {
        ctx.strokeStyle = P('stone', 2); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s.x, s.y); ctx.stroke();
        ctx.fillStyle = P('silver', 6); ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
      } else {
        for (var k = 5; k >= 0; k--) {
          var tt = Math.max(0, t - k * 0.025), q = scr(a.gx + (b.gx - a.gx) * tt, a.gy + (b.gy - a.gy) * tt, (a.gz + (b.gz - a.gz) * tt) + 26 + Math.sin(tt * Math.PI) * 10);
          ctx.fillStyle = k === 0 ? P('fire', 2) : k < 3 ? P('fire', 1) : P('fire', 0);
          var r = k === 0 ? 3 : 2; ctx.fillRect(q.x - r, q.y - r, r * 2, r * 2);
        }
      }
    } });
  };
  // the fireball: the bead, then a bloom over every square of the template, square by square outward
  FX.bloom = function (cx, cy, squares, ramp, o) {
    o = o || {};
    var pk = function (r, i) { var rp = D.PAL.ramps[r] || D.PAL.ramps.fire; return rp[Math.max(0, Math.min(i, rp.length - 1))]; };
    var C = EL[ramp] ? EL[ramp].c : ramp === 'violet' ? [P('violet', 5), P('violet', 4), P('violet', 3), P('violet', 2)] : ramp && ramp !== 'fire' && D.PAL.ramps[ramp] ? [pk(ramp, 5), pk(ramp, 4), pk(ramp, 3), pk(ramp, 2)] : [P('fire', 2), P('fire', 1), P('fire', 0), P('red', 2)];
    return FX.add({ kind: 'bloom', blocking: true, dur: 46, draw: function (ctx) {
      var t = this.t;
      squares.forEach(function (q) {
        var d = Math.hypot(q[0] - cx, q[1] - cy), start = d * 3, k = t - start;
        if (k < 0 || k > 30) return;
        var col = k < 6 ? C[0] : k < 14 ? C[1] : k < 22 ? C[2] : C[3];
        ctx.globalAlpha = k < 22 ? 0.85 : 0.85 * (30 - k) / 8;
        D.iso.rhombus(ctx, q[0], q[1], D.iso.map.gz(q[0], q[1]), 1); ctx.fillStyle = col; ctx.fill();
        ctx.globalAlpha = 1;
      });
      // the burst at the heart of a sphere (not a cone's, a line's or a wave's: their heart is the caster)
      var s = scr(cx, cy, 0);
      if (t < 20 && o.core !== false) {
        var k0 = t / 20, r = 6 + t * 2.2;
        glow(ctx, s.x, s.y - 10, C[2], r * 1.3, 0.3 * (1 - k0)); glow(ctx, s.x, s.y - 10, C[1], r, 0.5 * (1 - k0)); glow(ctx, s.x, s.y - 10, C[0], r * 0.45, 0.8 * (1 - k0));
      }
    } });
  };
  // the roost coming down over the iso map (the 8-bit game's js/battle.js swarm(), 160 frames of bats from the top, a shake every
  // ten): drawn over the whole screen, the world darkening under it; battle.js finish('roost') waits on it before the hand-off
  FX.swarm = function () {
    var bats = [], W = D.W, H = D.H;
    function bat() { return { x: Math.random() * W, y: -8 - Math.random() * 40, vx: (Math.random() - 0.5) * 3, vy: 1.6 + Math.random() * 3.6, ph: Math.floor(Math.random() * 8) }; }
    return FX.add({ kind: 'swarm', screen: true, dur: 210, draw: function (ctx) {
      var t = this.t;
      if (t < 160) for (var k = 0; k < 3 + (t >> 3) && bats.length < 900; k++) bats.push(bat());
      ctx.globalAlpha = Math.min(0.75, t / 200); ctx.fillStyle = '#0a0608'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      for (var i = 0; i < bats.length; i++) {
        var b = bats[i];
        b.x += b.vx + Math.sin((t + b.ph * 7) / 5) * 0.8; b.y += b.vy;
        if (b.y > H + 10) { b.y = -8; b.x = Math.random() * W; }
        var up = ((t + b.ph) >> 2) & 1, x = Math.round(b.x), y = Math.round(b.y);
        ctx.fillStyle = ['#1a1418', '#3a2e30', '#5a4a48'][i % 3];
        ctx.fillRect(x - 1, y, 3, 3);
        if (up) { ctx.fillRect(x - 5, y - 2, 4, 2); ctx.fillRect(x + 2, y - 2, 4, 2); } else { ctx.fillRect(x - 5, y + 2, 4, 2); ctx.fillRect(x + 2, y + 2, 4, 2); }
      }
    } });
  };
  FX.sparkle = function (u, ramp, n) {
    var p = FX.at(u), pts = [];
    for (var i = 0; i < (n || 14); i++) pts.push([(D.rand() - 0.5) * 28, -D.rand() * 50, D.rand() * 20]);
    return FX.add({ kind: 'sparkle', dur: 40, draw: function (ctx) {
      var s = scr(p.gx, p.gy, p.gz), t = this.t;
      pts.forEach(function (q, i) {
        var k = t - q[2]; if (k < 0 || k > 20) return;
        ctx.fillStyle = D.PAL.ramps[ramp][Math.min(D.PAL.ramps[ramp].length - 1, 1 + (i % 3))];
        ctx.fillRect(Math.round(s.x + q[0]), Math.round(s.y + q[1] - k), k < 10 ? 2 : 1, k < 10 ? 2 : 1);
      });
    } });
  };
  FX.ring = function (u, ramp, dur) {
    return FX.add({ kind: 'ring', dur: dur || 40, draw: function (ctx) {
      var p = FX.at(u), s = scr(p.gx, p.gy, p.gz), top = D.spr.unitTop(u), k = this.t / this.dur;
      ctx.strokeStyle = D.PAL.ramps[ramp][2]; ctx.globalAlpha = 1 - k; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(s.x, s.y - top / 2, 16 + k * 6, top / 2 + 4 + k * 4, 0, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    } });
  };
  FX.slash = function (u, color) {
    return FX.add({ kind: 'slash', dur: 14, draw: function (ctx) {
      var p = FX.at(u), s = scr(p.gx, p.gy, p.gz), k = this.t / this.dur;
      ctx.strokeStyle = color || P('bone', 2); ctx.lineWidth = 2; ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.arc(s.x, s.y - 26, 14, -2.4 + k, -0.4 + k * 1.5); ctx.stroke();
      ctx.globalAlpha = 1;
    } });
  };

  // ================================================================== the spell animation pass (09-28h; Griz: "code for most", "you
  // creative from 15 sounds fine", "if we make animations for them, they should take as long as they need to play")
  // An element language from the palette's own ramps, one look per damage type, readable at a glance on a busy floor. Each is
  // four colours, brightest first: c[0] the core, c[1] the body, c[2] the edge, c[3] the dark it fades to. The schools that deal
  // no damage borrow a look: healing, the holy (bless, shields, wards), the arcane, the charm, the shadow, nature, earth.
  var EL = FX.EL = {
    fire: { c: [P('fire', 2), P('fire', 1), P('fire', 0), P('red', 2)] },
    cold: { c: [P('bone', 2), P('glow', 2), P('glow', 1), P('glow', 0)] },
    lightning: { c: [P('bone', 2), P('gold', 4), P('glow', 2), P('glow', 1)] },
    thunder: { c: [P('bone', 1), P('silver', 6), P('blue', 3), P('blue', 2)] },
    acid: { c: [P('gold', 4), P('orc', 3), P('orc', 2), P('orc', 1)] },
    poison: { c: [P('orc', 3), P('violet', 4), P('orc', 2), P('violet', 1)] },
    necrotic: { c: [P('orc', 3), P('violet', 3), P('violet', 1), P('outline', 0)] },
    radiant: { c: [P('bone', 2), P('gold', 4), P('gold', 3), P('gold', 2)] },
    force: { c: [P('bone', 2), P('violet', 5), P('violet', 4), P('violet', 2)] },
    psychic: { c: [P('bone', 2), P('accent', 0), P('violet', 5), P('violet', 3)] },
    heal: { c: [P('bone', 2), P('orc', 3), P('accent', 1), P('moss', 1)] },
    holy: { c: [P('bone', 2), P('gold', 4), P('gold', 3), P('leather', 2)] },
    arcane: { c: [P('bone', 2), P('glow', 2), P('violet', 5), P('violet', 3)] },
    charm: { c: [P('bone', 2), P('accent', 0), P('violet', 5), P('violet', 2)] },
    shadow: { c: [P('violet', 4), P('violet', 2), P('violet', 1), P('outline', 0)] },
    nature: { c: [P('orc', 3), P('orc', 2), P('moss', 2), P('moss', 1)] },
    earth: { c: [P('stone', 7), P('stone', 5), P('stone', 3), P('stone', 1)] }
  };
  EL.bludgeoning = EL.piercing = EL.slashing = null;
  FX.el = function (el) { return EL[el] || EL.arcane; };
  var RND = Math.random; // (the looks never draw on the fight's own dice: D.rand is the seeded one)
  function px(ctx, x, y, c, s) { s = s || 1; ctx.fillStyle = c; ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s); }
  FX.px = px;
  function body(u) { var p = FX.at(u), s = scr(p.gx, p.gy, p.gz), top = u.sheet && D.spr ? D.spr.unitTop(u) : 10; return { x: s.x, y: s.y, top: top }; }
  FX.body = body;
  FX.chest = function (u) { var b = body(u); return { x: b.x, y: b.y - b.top * 0.55 }; };
  var FACE_OFF = [[0, 3], [-5, 2], [-7, 0], [-5, -2], [0, -3], [5, -2], [7, 0], [5, 2]]; // S SW W NW N NE E SE, on the screen
  FX.hands = function (u) { var c = FX.chest(u), f = FACE_OFF[(u.facing || 0) % 8]; return { x: c.x + f[0], y: c.y + f[1] - 2 }; };
  function aim(u) { return u.sheet ? FX.chest(u) : (function () { var b = body(u); return { x: b.x, y: b.y - 4 }; })(); }
  // a star where something lands (a shot's end, a beam's tip): a core, four rays, a glint on the diagonals
  function star(ctx, x, y, E, r) {
    px(ctx, x, y, E.c[0], 4);
    for (var j = 2; j <= r; j++) { var c = j < 4 ? E.c[1] : E.c[2], w = j < 4 ? 2 : 1; px(ctx, x + j, y, c, w); px(ctx, x - j, y, c, w); px(ctx, x, y + j, c, w); px(ctx, x, y - j, c, w); }
    var d = Math.round(r * 0.45); for (var k = 2; k <= d; k++) { px(ctx, x + k, y + k, E.c[2]); px(ctx, x - k, y - k, E.c[2]); px(ctx, x + k, y - k, E.c[2]); px(ctx, x - k, y + k, E.c[2]); }
  }
  function glow(ctx, x, y, c, r, a) { ctx.globalAlpha = a; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y), r, r * 0.8, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  FX.star = star; FX.glow = glow;

  // the cast: light gathering at the hands in the spell's colours, motes drawn in from round about; it swells as they arrive and
  // is still bright at the release (never blocks)
  FX.flare = function (u, el, dur) {
    var E = FX.el(el), motes = [];
    for (var i = 0; i < 16; i++) motes.push({ a: RND() * 6.283, r: 18 + RND() * 14, d: RND() * 8 });
    return FX.add({ kind: 'flare', dur: dur || 34, draw: function (ctx) {
      var h = FX.hands(u), t = this.t, T = this.dur, k = t / T;
      motes.forEach(function (m, i) { var q = (t - m.d) / (T * 0.6); if (q <= 0 || q >= 1) return; var r = m.r * (1 - q), a = m.a + q * 2.6; px(ctx, h.x + Math.cos(a) * r, h.y + Math.sin(a) * r * 0.7, E.c[1 + (i % 2)], q > 0.6 ? 1 : 2); });
      var g = Math.min(1, k * 1.6) * (k > 0.85 ? (1 - k) / 0.15 : 1), L = Math.round(2 + g * 8), pulse = (t >> 1) & 1;
      glow(ctx, h.x, h.y, E.c[2], 4 + g * 7, 0.25 * g);
      glow(ctx, h.x, h.y, E.c[1], 2 + g * 4, 0.45 * g);
      for (var j = 2; j <= L; j++) { var c = j < 4 ? E.c[0] : j < 7 ? E.c[1] : E.c[2], w = j < 5 ? 2 : 1; px(ctx, h.x + j, h.y, c, w); px(ctx, h.x - j, h.y, c, w); px(ctx, h.x, h.y + j * 0.8, c, w); px(ctx, h.x, h.y - j * 0.8, c, w); }
      px(ctx, h.x, h.y, E.c[0], 3 + Math.round(g * 2) + pulse);
    } });
  };

  // a spell's shot, by its travel. Starts at the caster's hands, arcs to the target's chest (or the square), and pops there
  function spellShot(from, to, kind, el, o) {
    var E = FX.el(el), a = FX.at(from), b = FX.at(to), dist = Math.hypot(a.gx - b.gx, a.gy - b.gy);
    if (kind === 'beam' || kind === 'ray') return FX.beam(from, to, el, { thin: kind === 'ray' });
    if (kind === 'jag') return FX.jag(from, to, el);
    if (kind === 'none') return null;
    // Magic Missile's darts fan out and come home: each one made this frame leaves a beat after the last, on its own side
    var nth = kind === 'dart' ? FX.list.filter(function (f) { return f.dart && f.born === D.frame; }).length : 0;
    var delay = o.delay != null ? o.delay : nth * 4, side = o.side != null ? o.side : kind === 'dart' ? (nth % 2 ? -1 : 1) * (14 + nth * 8) : 0;
    var dur = Math.max(12, Math.round(dist * (kind === 'dart' ? 2.6 : kind === 'glob' ? 3.6 : 3.2)));
    var arc = kind === 'glob' ? 22 : kind === 'dart' ? 4 : kind === 'wisp' ? 8 : 10, wob = RND() * 6.283;
    function at(tt) {
      var s = from.sheet ? FX.hands(from) : aim(from), e = aim(to), dx = e.x - s.x, dy = e.y - s.y, L = Math.hypot(dx, dy) || 1, sn = Math.sin(tt * Math.PI);
      var x = s.x + dx * tt - dy / L * side * sn, y = s.y + dy * tt + dx / L * side * sn * 0.6 - arc * sn;
      if (kind === 'wisp') { x += Math.sin(tt * 14 + wob) * 4 * sn; y += Math.cos(tt * 11 + wob) * 2.5 * sn; }
      return { x: x, y: y };
    }
    var f = FX.add({ kind: 'proj', dart: kind === 'dart', born: D.frame, blocking: true, dur: dur + delay, draw: function (ctx) {
      var t = (this.t - delay) / dur; if (t < 0) return;
      var h = at(t), i, q, k, ft = this.t;
      if (kind === 'fire') {
        for (i = 16; i >= 1; i--) { q = at(Math.max(0, t - i * 0.018)); k = i / 16; ctx.globalAlpha = 1 - k * 0.85; px(ctx, q.x + Math.sin(i * 2.1 + ft * 0.9) * k * 3, q.y - i * 0.6 * k, i < 4 ? E.c[1] : i < 9 ? E.c[2] : E.c[3], i < 3 ? 5 : i < 7 ? 3 : 2); }
        for (i = 0; i < 5; i++) { q = at(Math.max(0, t - (i + 1) * 0.05)); ctx.globalAlpha = 0.9; px(ctx, q.x + Math.sin(ft * 0.7 + i * 1.9) * 5, q.y - ((ft + i * 5) % 12), (i + ft) % 2 ? E.c[0] : E.c[1]); }
        ctx.globalAlpha = 1; glow(ctx, h.x, h.y, E.c[2], 7, 0.35);
        px(ctx, h.x, h.y, E.c[2], 8); px(ctx, h.x, h.y - 1, E.c[1], 6); px(ctx, h.x, h.y - 1, E.c[0], 3 + (ft & 1));
      } else if (kind === 'frost') {
        q = at(Math.max(0, t - 0.05)); var dx = h.x - q.x, dy = h.y - q.y, L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
        glow(ctx, h.x, h.y, E.c[2], 6, 0.3);
        for (i = 0; i < 11; i++) { var w = i < 2 ? 2 : i < 6 ? 3 : 2; px(ctx, h.x - dx * i, h.y - dy * i, i < 3 ? E.c[0] : i < 7 ? E.c[1] : E.c[2], w); }
        px(ctx, h.x - dx * 4 - dy * 3, h.y - dy * 4 + dx * 3, E.c[1], 2); px(ctx, h.x - dx * 4 + dy * 3, h.y - dy * 4 - dx * 3, E.c[1], 2);
        for (i = 1; i <= 12; i++) { q = at(Math.max(0, t - i * 0.03)); if ((i + ft) % 3) { ctx.globalAlpha = 1 - i / 13; px(ctx, q.x + Math.sin(i * 3.3) * 5, q.y + Math.cos(i * 2.7) * 4, i % 2 ? E.c[0] : E.c[2], i < 5 ? 2 : 1); } }
        ctx.globalAlpha = 1;
      } else if (kind === 'mote') {
        for (i = 1; i <= 12; i++) { q = at(Math.max(0, t - i * 0.025)); ctx.globalAlpha = 1 - i / 13; px(ctx, q.x, q.y, i < 4 ? E.c[1] : E.c[2], i < 4 ? 4 : 2); }
        ctx.globalAlpha = 1; glow(ctx, h.x, h.y, E.c[1], 9, 0.3); var rot = (ft >> 2) & 1;
        for (i = 3; i <= 8; i++) { var cc = i < 5 ? E.c[0] : E.c[1], ww = i < 5 ? 2 : 1; if (rot) { px(ctx, h.x + i * 0.7, h.y + i * 0.7, cc, ww); px(ctx, h.x - i * 0.7, h.y - i * 0.7, cc, ww); px(ctx, h.x + i * 0.7, h.y - i * 0.7, cc, ww); px(ctx, h.x - i * 0.7, h.y + i * 0.7, cc, ww); } else { px(ctx, h.x + i, h.y, cc, ww); px(ctx, h.x - i, h.y, cc, ww); px(ctx, h.x, h.y + i, cc, ww); px(ctx, h.x, h.y - i, cc, ww); } }
        px(ctx, h.x, h.y, E.c[0], 6);
      } else if (kind === 'wisp') {
        for (i = 1; i <= 14; i++) { q = at(Math.max(0, t - i * 0.025)); ctx.globalAlpha = (1 - i / 15) * 0.8; px(ctx, q.x, q.y - i * 0.5, i < 5 ? E.c[1] : E.c[2], 2 + Math.min(4, i >> 1)); }
        ctx.globalAlpha = 1; px(ctx, h.x, h.y, E.c[3], 9); px(ctx, h.x, h.y, E.c[2], 7); px(ctx, h.x, h.y, E.c[1], 4); px(ctx, h.x + ((ft >> 1) & 1 ? 2 : -2), h.y - 2, E.c[0], 2);
      } else if (kind === 'glob') {
        for (i = 1; i <= 8; i++) { q = at(Math.max(0, t - i * 0.045)); var fall = i * i * 0.45; ctx.globalAlpha = 1 - i / 9; px(ctx, q.x + (i % 2 ? 2 : -2), q.y + fall, E.c[2], 2); }
        ctx.globalAlpha = 1; px(ctx, h.x, h.y, E.c[3], 9); px(ctx, h.x, h.y, E.c[1], 7); px(ctx, h.x - 2, h.y - 2, E.c[0], 3);
      } else if (kind === 'dart') {
        q = at(Math.max(0, t - 0.12)); var ddx = h.x - q.x, ddy = h.y - q.y, LL = Math.hypot(ddx, ddy) || 1; ddx /= LL; ddy /= LL;
        for (i = 0; i < 20; i++) { ctx.globalAlpha = 1 - i / 21; px(ctx, h.x - ddx * i, h.y - ddy * i, i < 6 ? E.c[1] : E.c[2], i < 6 ? 2 : 1); }
        ctx.globalAlpha = 1; glow(ctx, h.x, h.y, E.c[2], 5, 0.35);
        px(ctx, h.x, h.y, E.c[0], 4);
        for (i = 1; i <= 3; i++) { px(ctx, h.x - ddx * (i + 1) - ddy * i, h.y - ddy * (i + 1) + ddx * i, E.c[0], 2); px(ctx, h.x - ddx * (i + 1) + ddy * i, h.y - ddy * (i + 1) - ddx * i, E.c[0], 2); }
      } else { // 'orb': the plain ball of the element
        for (i = 1; i <= 10; i++) { q = at(Math.max(0, t - i * 0.025)); ctx.globalAlpha = 1 - i / 11; px(ctx, q.x, q.y, E.c[2], i < 4 ? 4 : 2); }
        ctx.globalAlpha = 1; glow(ctx, h.x, h.y, E.c[2], 7, 0.3); px(ctx, h.x, h.y, E.c[1], 7); px(ctx, h.x, h.y, E.c[0], 4);
      }
    } });
    f.onEnd = function () { FX.pop(to, el); };
    return f;
  }
  FX.shot = spellShot;

  // a pop where a shot lands: a star, a ring (never blocks)
  FX.pop = function (to, el, big) {
    var E = FX.el(el);
    return FX.add({ kind: 'pop', dur: big ? 18 : 12, draw: function (ctx) {
      var e = aim(to), t = this.t, k = t / this.dur;
      ctx.globalAlpha = 1 - k; glow(ctx, e.x, e.y, E.c[1], 6 + t, 0.3 * (1 - k)); ctx.globalAlpha = 1 - k;
      star(ctx, e.x, e.y, E, Math.round(4 + t * (big ? 1.2 : 0.8)));
      ctx.strokeStyle = E.c[1]; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y, 4 + t * 1.8, 3 + t * 1.1, 0, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    } });
  };

  // a beam that holds a moment: Ray of Frost, Eldritch Blast, Scorching Ray (thin), the necrotic rays. It reaches out from the hands,
  // crackles (force, lightning, necrotic) or shimmers (cold) while it holds, and fades
  FX.beam = function (from, to, el, o) {
    o = o || {}; var E = FX.el(el), seed = RND() * 100;
    return FX.add({ kind: 'beam', blocking: true, dur: o.dur || (o.thin ? 22 : 30), draw: function (ctx) {
      var s = from.sheet ? FX.hands(from) : aim(from), e = aim(to), t = this.t, T = this.dur;
      var grow = Math.min(1, t / 5), fade = t > T - 7 ? Math.max(0, (T - t) / 7) : 1;
      var ex = s.x + (e.x - s.x) * grow, ey = s.y + (e.y - s.y) * grow, len = Math.hypot(ex - s.x, ey - s.y), n = Math.max(1, Math.round(len / 1.5));
      var nx = -(ey - s.y) / (len || 1), ny = (ex - s.x) / (len || 1), crackle = el === 'force' || el === 'lightning' || el === 'necrotic';
      var wide = o.thin ? 1 : 1.6 + 0.4 * Math.sin(t * 0.8);
      for (var i = 0; i <= n; i++) {
        var k = i / n, jit = crackle ? Math.sin(k * 23 + t * 1.9 + seed) * 2 + Math.sin(k * 7 - t * 0.7) * 1.2 : el === 'cold' ? Math.sin(k * 9 + t * 0.6) * 0.8 : 0;
        var x = s.x + (ex - s.x) * k + nx * jit, y = s.y + (ey - s.y) * k + ny * jit;
        ctx.globalAlpha = 0.28 * fade; px(ctx, x, y, E.c[2], Math.round(4 * wide + 1));
        ctx.globalAlpha = 0.85 * fade; px(ctx, x, y, E.c[1], Math.round(2 * wide));
        ctx.globalAlpha = fade; px(ctx, x, y, E.c[0], o.thin ? 1 : 2);
      }
      // motes along it: ice glitter, force sparks, a necrotic drift
      for (var j = 0; j < 10; j++) { var kk = ((j * 0.113 + t * 0.03 + seed) % 1), mx = s.x + (ex - s.x) * kk, my = s.y + (ey - s.y) * kk; if (kk > grow) continue; ctx.globalAlpha = 0.9 * fade; px(ctx, mx + Math.sin(j * 5 + t * 0.5) * 5, my - 2 - (t % 9) * 0.6, j % 2 ? E.c[0] : E.c[2], 2); }
      ctx.globalAlpha = fade;
      if (grow >= 1) { glow(ctx, ex, ey, E.c[1], 7, 0.35 * fade); star(ctx, ex, ey, E, 6 + ((t >> 1) & 1) * 2); }
      glow(ctx, s.x, s.y, E.c[1], 4, 0.4 * fade); px(ctx, s.x, s.y, E.c[0], 4);
      ctx.globalAlpha = 1;
    } });
  };

  // lightning: a jagged stroke that re-forks every few frames, with a branch or two (Lightning Bolt, Witch Bolt, Call Lightning's fall)
  FX.jag = function (from, to, el, o) {
    o = o || {}; var E = FX.el(el || 'lightning'), path = null, stamp = -1;
    function make(s, e) {
      var dx = e.x - s.x, dy = e.y - s.y, L = Math.hypot(dx, dy) || 1, n = Math.max(3, Math.round(L / 10)), nx = -dy / L, ny = dx / L, pts = [s], br = [];
      for (var i = 1; i < n; i++) { var k = i / n, off = (RND() - 0.5) * 14; pts.push({ x: s.x + dx * k + nx * off, y: s.y + dy * k + ny * off }); }
      pts.push(e);
      for (var b = 0; b < 3; b++) { var p0 = pts[1 + Math.floor(RND() * (pts.length - 2))], ang = Math.atan2(dy, dx) + (RND() < 0.5 ? -0.9 : 0.9), bl = 8 + RND() * 10; br.push([p0, { x: p0.x + Math.cos(ang) * bl, y: p0.y + Math.sin(ang) * bl }]); }
      return { pts: pts, br: br };
    }
    function seg(ctx, a, b, c, w, al) { var L = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y))); ctx.globalAlpha = al; for (var i = 0; i <= L; i++) px(ctx, a.x + (b.x - a.x) * i / L, a.y + (b.y - a.y) * i / L, c, w); }
    return FX.add({ kind: 'jag', blocking: o.blocking !== false, dur: o.dur || 24, draw: function (ctx) {
      var s = o.sky ? (function () { var e0 = aim(to); return { x: e0.x + 8, y: e0.y - 170 }; })() : from.sheet ? FX.hands(from) : aim(from), e = o.sky ? (function () { var b0 = body(to); return { x: b0.x, y: b0.y - 2 }; })() : aim(to), t = this.t;
      if (!path || t - stamp >= 3) { path = make(s, e); stamp = t; }
      var fade = t > this.dur - 7 ? Math.max(0, (this.dur - t) / 7) : 1, flick = (t % 3) === 0 ? 0.55 : 1;
      for (var i = 0; i < path.pts.length - 1; i++) { seg(ctx, path.pts[i], path.pts[i + 1], E.c[3], 6, 0.22 * fade * flick); seg(ctx, path.pts[i], path.pts[i + 1], E.c[1], 3, 0.8 * fade * flick); seg(ctx, path.pts[i], path.pts[i + 1], E.c[0], 2, fade); }
      path.br.forEach(function (b2) { seg(ctx, b2[0], b2[1], E.c[2], 2, 0.7 * fade * flick); seg(ctx, b2[0], b2[1], E.c[0], 1, 0.8 * fade * flick); });
      ctx.globalAlpha = fade; glow(ctx, e.x, e.y, E.c[1], 9, 0.35 * fade); star(ctx, e.x, e.y, E, 7 + (t & 1) * 2); ctx.globalAlpha = 1;
    } });
  };

  // what a blow of an element does to the body it lands on (every hurt of an element: js/looks.js), and the flash takes its colour
  FX.hit = function (u, el, amt) {
    var E = EL[el]; if (!E || !u || !u.sheet) return null;
    var n = Math.min(34, 14 + Math.round((amt || 6) / 2)), ps = [];
    for (var i = 0; i < n; i++) { var a = RND() * 6.283, sp = 0.7 + RND() * 1.9; ps.push({ a: a, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, d: RND() * 5, c: E.c[i % 3], s: RND() < 0.4 ? 3 : 2 }); }
    u.flashEl = el;
    return FX.add({ kind: 'hit', dur: el === 'radiant' || el === 'necrotic' ? 40 : 34, draw: function (ctx) {
      var b = body(u), c = { x: b.x, y: b.y - b.top * 0.55 }, t = this.t, T = this.dur, k = t / T;
      if (t < 7) { ctx.globalAlpha = 1 - t / 7; glow(ctx, c.x, c.y, E.c[1], 10 + t * 2, 0.45 * (1 - t / 7)); ctx.globalAlpha = 1 - t / 7; star(ctx, c.x, c.y, E, 8 + t); ctx.globalAlpha = 1; }
      ps.forEach(function (p, i) {
        var tt = t - p.d; if (tt < 0) return;
        var x = c.x + p.vx * tt, y = c.y + p.vy * tt, al = Math.max(0, 1 - tt / (T - p.d));
        if (el === 'fire') { y = c.y + p.vy * tt * 0.6 - 0.04 * tt * tt; x += Math.sin(tt * 0.4 + i) * 2; }
        else if (el === 'acid') { y = c.y + p.vy * tt * 0.5 + 0.07 * tt * tt; }
        else if (el === 'poison') { x = c.x + p.vx * 8 + Math.sin(tt * 0.3 + i) * 3; y = c.y - tt * 0.7 - p.d * 2; }
        else if (el === 'necrotic') { var r = tt * 0.9, ang = p.a + Math.sin(tt * 0.18) * 0.9; x = c.x + Math.cos(ang) * r; y = c.y + Math.sin(ang) * r * 0.7; }
        else if (el === 'radiant' || el === 'heal') { x = c.x + p.vx * 6; y = c.y - tt * (0.7 + (i % 3) * 0.35); }
        else if (el === 'cold') { var dmp = 1 - Math.exp(-tt * 0.22); x = c.x + p.vx * 11 * dmp; y = c.y + p.vy * 11 * dmp; }
        ctx.globalAlpha = al;
        if (el === 'cold' && tt < 20) { px(ctx, x, y, E.c[0], 2); px(ctx, x - p.vx * 1.5, y - p.vy * 1.5, E.c[1], 2); }
        else if (el === 'poison') { px(ctx, x - 2, y, p.c, 2); px(ctx, x + 2, y, p.c, 2); px(ctx, x, y - 2, p.c, 2); px(ctx, x, y + 2, p.c, 2); }
        else px(ctx, x, y, tt < 6 ? E.c[0] : p.c, p.s);
      });
      ctx.globalAlpha = 1;
      if (el === 'fire' && t < 24) { // flame licks up the body
        for (var j = -2; j <= 2; j++) { var hgt = Math.sin(Math.PI * t / 24) * (18 - Math.abs(j) * 4) + (RND() * 3); for (var y2 = 0; y2 < hgt; y2 += 2) px(ctx, c.x + j * 4 + Math.sin(y2 * 0.4 + t) * 1.5, c.y + 10 - y2, y2 > hgt - 4 ? E.c[0] : y2 > hgt / 2 ? E.c[1] : E.c[2], 3); }
      } else if (el === 'cold') { // frost on the body, a while
        ctx.globalAlpha = 0.85 * (1 - k); for (var f2 = 0; f2 < 10; f2++) if ((f2 + (t >> 2)) % 3) { px(ctx, c.x + Math.sin(f2 * 2.4) * 9, c.y + Math.cos(f2 * 1.7) * 12, E.c[0], 2); } ctx.globalAlpha = 1;
      } else if (el === 'lightning' && t < 16) { // sparks leaping off
        for (var l = 0; l < 5; l++) { var a2 = l * 1.26 + t * 0.9, x0 = c.x, y0 = c.y; for (var s2 = 0; s2 < 6; s2++) { var x1 = x0 + Math.cos(a2) * 4 + (RND() - 0.5) * 4, y1 = y0 + Math.sin(a2) * 3 + (RND() - 0.5) * 4; px(ctx, x1, y1, s2 < 3 ? E.c[0] : E.c[1], 2); x0 = x1; y0 = y1; } }
      } else if (el === 'thunder') { // the shock ring on the ground, and a second after it
        for (var r2 = 0; r2 < 2; r2++) { var tt2 = t - r2 * 6; if (tt2 < 0 || tt2 > 24) continue; ctx.globalAlpha = 1 - tt2 / 24; ctx.strokeStyle = r2 ? E.c[2] : E.c[1]; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(b.x, b.y - 1, 6 + tt2 * 1.8, 3 + tt2 * 0.9, 0, 0, 7); ctx.stroke(); }
        ctx.globalAlpha = 1;
      } else if (el === 'radiant' && t < 30) { // a shaft of light down on it
        var al2 = Math.sin(Math.PI * t / 30); ctx.globalAlpha = 0.45 * al2; ctx.fillStyle = E.c[2]; ctx.fillRect(Math.round(b.x - 9), Math.round(b.y - b.top - 60), 18, b.top + 60);
        ctx.globalAlpha = 0.6 * al2; ctx.fillStyle = E.c[1]; ctx.fillRect(Math.round(b.x - 5), Math.round(b.y - b.top - 60), 10, b.top + 60);
        ctx.globalAlpha = 0.9 * al2; ctx.fillStyle = E.c[0]; ctx.fillRect(Math.round(b.x - 2), Math.round(b.y - b.top - 60), 4, b.top + 60); ctx.globalAlpha = 1;
      } else if (el === 'force' && t < 16) { // a star that pops
        var L2 = Math.round(Math.sin(Math.PI * t / 16) * 14); for (var q2 = 2; q2 <= L2; q2 += 1) { var cc = q2 < 5 ? E.c[0] : E.c[1], w2 = q2 < 6 ? 2 : 1; px(ctx, c.x + q2, c.y, cc, w2); px(ctx, c.x - q2, c.y, cc, w2); px(ctx, c.x, c.y + q2 * 0.7, cc, w2); px(ctx, c.x, c.y - q2 * 0.7, cc, w2); px(ctx, c.x + q2 * 0.6, c.y + q2 * 0.4, E.c[2]); px(ctx, c.x - q2 * 0.6, c.y - q2 * 0.4, E.c[2]); px(ctx, c.x + q2 * 0.6, c.y - q2 * 0.4, E.c[2]); px(ctx, c.x - q2 * 0.6, c.y + q2 * 0.4, E.c[2]); }
      } else if (el === 'psychic') { // rings about the head
        for (var r3 = 0; r3 < 3; r3++) { var tt3 = t - r3 * 6; if (tt3 < 0 || tt3 > 22) continue; ctx.globalAlpha = 1 - tt3 / 22; ctx.strokeStyle = r3 === 1 ? E.c[2] : E.c[1]; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(b.x, b.y - b.top - 2, 6 + tt3 * 0.9, 3 + tt3 * 0.45, 0, 0, 7); ctx.stroke(); }
        ctx.globalAlpha = 1;
      } else if (el === 'necrotic' && t > 6) { // what it takes, drawn up out of the body
        ctx.globalAlpha = 1 - k; for (var m2 = 0; m2 < 6; m2++) px(ctx, c.x + Math.sin(m2 * 2.1 + t * 0.2) * 5, c.y - (t - 6) * 1.1 - m2 * 5, m2 % 2 ? E.c[0] : E.c[1], 2); ctx.globalAlpha = 1;
      }
    } });
  };
  // healing: motes rising through the body, little crosses among them, a soft column (every heal: js/looks.js)
  FX.heal = function (u) {
    if (!u || !u.sheet) return null;
    var E = EL.heal, ps = []; for (var i = 0; i < 18; i++) ps.push({ x: (RND() - 0.5) * 22, d: RND() * 16, v: 0.5 + RND() * 0.6, cross: RND() < 0.4 });
    return FX.add({ kind: 'heal', dur: 44, draw: function (ctx) {
      var b = body(u), t = this.t, k = t / this.dur;
      ctx.globalAlpha = 0.2 * Math.sin(Math.PI * k); ctx.fillStyle = E.c[1]; ctx.fillRect(Math.round(b.x - 10), Math.round(b.y - b.top - 6), 20, b.top + 6); ctx.globalAlpha = 1;
      glow(ctx, b.x, b.y - 2, E.c[2], 12, 0.25 * Math.sin(Math.PI * k));
      ps.forEach(function (p, i) {
        var tt = t - p.d; if (tt < 0 || tt > 28) return;
        var x = b.x + p.x, y = b.y - 2 - tt * p.v * 1.8; ctx.globalAlpha = 1 - tt / 28;
        if (p.cross) { px(ctx, x, y, E.c[0], 2); for (var j = 2; j <= 3; j++) { px(ctx, x - j, y, E.c[1]); px(ctx, x + j, y, E.c[1]); px(ctx, x, y - j, E.c[1]); px(ctx, x, y + j, E.c[1]); } }
        else px(ctx, x, y, i % 2 ? E.c[1] : E.c[0], tt < 10 ? 3 : 2);
      });
      ctx.globalAlpha = 1;
    } });
  };
  // a spell that reaches a creature without a shot (a save to make, a touch, a blessing): its colours drift from the hands to it
  FX.reach = function (from, to, el, dur) {
    var E = FX.el(el), ms = []; for (var i = 0; i < 14; i++) ms.push({ d: 6 + i * 1.3, w: (RND() - 0.5) * 14 });
    return FX.add({ kind: 'reach', dur: dur || 34, draw: function (ctx) {
      var s = from.sheet ? FX.hands(from) : aim(from), e = aim(to), t = this.t;
      ms.forEach(function (m, i) {
        var q = (t - m.d) / 12; if (q < 0 || q > 1) return;
        var sn = Math.sin(q * Math.PI), x = s.x + (e.x - s.x) * q + m.w * sn, y = s.y + (e.y - s.y) * q - 6 * sn;
        ctx.globalAlpha = 0.5 + 0.5 * sn; px(ctx, x, y, i % 3 ? E.c[1] : E.c[0], i % 2 ? 3 : 2);
      });
      if (t > 16 && t < 32) { var kq = (t - 16) / 16; ctx.globalAlpha = 1 - kq; glow(ctx, e.x, e.y, E.c[1], 6 + kq * 8, 0.35 * (1 - kq)); ctx.globalAlpha = 1 - kq; star(ctx, e.x, e.y, E, 4 + Math.round(kq * 6)); }
      ctx.globalAlpha = 1;
    } });
  };
  // a cone, a line or a wave: the element streaming out from the hands over its squares, the near ones first
  FX.stream = function (from, squares, el, o) {
    o = o || {}; var E = FX.el(el), ps = [], n = Math.min(90, 24 + squares.length * 3);
    var srt = squares.slice().sort(function (a, b) { return Math.hypot(a[0] - from.x, a[1] - from.y) - Math.hypot(b[0] - from.x, b[1] - from.y); });
    for (var i = 0; i < n; i++) { var q = srt[Math.floor(RND() * srt.length)], d = Math.hypot(q[0] - from.x, q[1] - from.y); ps.push({ q: q, d: d * 2 + RND() * 10, j: [(RND() - 0.5) * 18, (RND() - 0.5) * 9], c: i % 3 }); }
    return FX.add({ kind: 'stream', dur: o.dur || 44, draw: function (ctx) {
      var s = FX.hands(from), t = this.t;
      ps.forEach(function (p) {
        var k = (t - p.d) / 12; if (k < 0 || k > 1.4) return;
        var c0 = D.iso.center(p.q[0], p.q[1], D.iso.map.gz(p.q[0], p.q[1])), e = D.iso.toScreen(c0.x, c0.y), kk = Math.min(1, k);
        var x = s.x + (e.x + p.j[0] - s.x) * kk, y = s.y + (e.y - 8 + p.j[1] - s.y) * kk - (el === 'fire' ? (k > 1 ? (k - 1) * 24 : 0) : 0);
        ctx.globalAlpha = k > 1 ? Math.max(0, 1 - (k - 1) / 0.4) : 1;
        if (el === 'cold') { px(ctx, x, y, E.c[p.c === 0 ? 0 : 1], 2); px(ctx, x - 2, y - 1, E.c[2], 2); }
        else px(ctx, x, y, E.c[p.c], p.c === 0 ? 4 : 3);
      });
      ctx.globalAlpha = 1;
    } });
  };
})();
