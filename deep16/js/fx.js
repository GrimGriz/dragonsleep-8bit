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
  FX.update = function () { FX.list = FX.list.filter(function (f) { f.t++; return f.t < f.dur; }); };
  FX.busy = function () { return FX.list.some(function (f) { return f.blocking; }); };
  function scr(gx, gy, gz) { var c = D.iso.center(gx, gy, gz || 0); return D.iso.toScreen(c.x, c.y); }
  FX.at = function (u) { var s = u.size || 1; return { gx: u.x + (s - 1) / 2, gy: u.y + (s - 1) / 2, gz: D.grid.gzAt(u, u.x, u.y) }; };

  FX.float = function (text, u, color, big) {
    var p = FX.at(u), n = FX.list.filter(function (f) { return f.kind === 'float' && f.u === u && f.t < 20; }).length;
    return FX.add({ kind: 'float', screen: true, u: u, dur: 70, draw: function (ctx) { // drawn over the world at full size, so it reads zoomed out too
      var s = scr(p.gx, p.gy, p.gz), top = D.spr.top(u.sheet) * (D.iso.inWorld ? 1 : D.iso.zoom), k = Math.min(1, this.t / 10);
      D.text(ctx, text, s.x, s.y - top - 6 - k * 12 - n * 9, color, 'center');
    } });
  };
  FX.projectile = function (from, to, kind) {
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
  FX.bloom = function (cx, cy, squares, ramp) {
    var C = ramp === 'violet' ? [P('violet', 5), P('violet', 4), P('violet', 3), P('violet', 2)] : [P('fire', 2), P('fire', 1), P('fire', 0), P('red', 2)];
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
      var s = scr(cx, cy, 0);
      if (t < 18 && ramp !== 'violet') { ctx.fillStyle = P('fire', 2); var r = 4 + t * 2; ctx.fillRect(s.x - r, s.y - r / 2 - 10, r * 2, r); }
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
      var p = FX.at(u), s = scr(p.gx, p.gy, p.gz), top = D.spr.top(u.sheet), k = this.t / this.dur;
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
})();
