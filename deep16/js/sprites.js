/* DEEP16 — sprites: sheets from the render pipelines (data/sprites.js, images in art/), drawn at the foot anchor.
   A sheet's rows are anim x facing (facing 0..7 = S, SW, W, NW, N, NE, E, SE on screen), its columns the frames.
   Grid step -> facing: +gx is SE on screen, +gy is SW. */
'use strict';
(function () {
  var D = window.D16;
  var S = D.spr = {};
  S.FACINGS = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
  var STEP = { '1,1': 0, '0,1': 1, '-1,1': 2, '-1,0': 3, '-1,-1': 4, '0,-1': 5, '1,-1': 6, '1,0': 7 };
  S.facingFor = function (dx, dy) { return STEP[Math.sign(dx) + ',' + Math.sign(dy)] == null ? 0 : STEP[Math.sign(dx) + ',' + Math.sign(dy)]; };
  S.images = function () { return Object.keys(D.SHEETS || {}).map(function (k) { return D.SHEETS[k].image; }); };
  S.has = function (name) { return !!(D.SHEETS && D.SHEETS[name] && D.images[D.SHEETS[name].image] && D.images[D.SHEETS[name].image].naturalWidth); };

  // draw one frame; t in frames at 60 Hz; returns the sprite's height above the foot (for labels and HP bars)
  // o.once: play through once and hold the last frame (an attack, a fall); o.alpha; o.flip: mirror; o.tint: a flash colour
  S.draw = function (ctx, name, anim, facing, t, x, y, o) {
    var sh = D.SHEETS && D.SHEETS[name];
    if (!sh || !S.has(name)) return S.placeholder(ctx, name, x, y, o);
    var a = sh.anims[anim] || sh.anims.idle, img = D.images[sh.image];
    var fw = a.fw || sh.fw, fh = a.fh || sh.fh, ax = a.ax != null ? a.ax : sh.ax, ay = a.ay != null ? a.ay : sh.ay;
    var n = Math.floor(t * (a.fps || 8) / 60), fr = o && o.once ? Math.min(a.frames - 1, n) : n % a.frames;
    var sy = (a.y != null ? a.y : a.row * sh.fh) + (facing % 8) * fh;
    var dx = Math.round(x - ax), dy = Math.round(y - ay);
    ctx.save();
    if (o && o.alpha != null) ctx.globalAlpha = o.alpha;
    if (o && o.lie) { ctx.translate(x, y); ctx.rotate(-Math.PI / 2); ctx.translate(-x, -y + 6); }
    ctx.drawImage(img, fr * fw, sy, fw, fh, dx, dy, fw, fh);
    if (o && o.tint) { // a hit flash: the frame's own silhouette filled with one colour
      var tc = S.tintCanvas(fw, fh);
      var tx = tc.getContext('2d');
      tx.globalCompositeOperation = 'source-over'; tx.clearRect(0, 0, fw, fh);
      tx.drawImage(img, fr * fw, sy, fw, fh, 0, 0, fw, fh);
      tx.globalCompositeOperation = 'source-in'; tx.fillStyle = o.tint; tx.fillRect(0, 0, fw, fh);
      ctx.globalAlpha = (o.tintAlpha == null ? 0.75 : o.tintAlpha) * (o.alpha == null ? 1 : o.alpha);
      ctx.drawImage(tc, dx, dy);
    }
    ctx.restore();
    return sh.top || ay;
  };
  var tintCv = {};
  S.tintCanvas = function (w, h) { var k = w + 'x' + h; if (!tintCv[k]) { tintCv[k] = document.createElement('canvas'); tintCv[k].width = w; tintCv[k].height = h; } return tintCv[k]; };
  S.anim = function (name, anim) { var sh = D.SHEETS && D.SHEETS[name]; return sh && sh.anims[anim]; };
  // how long an anim takes to play once, in frames at 60 Hz
  S.duration = function (name, anim) { var a = S.anim(name, anim); return a ? Math.ceil(a.frames * 60 / (a.fps || 8)) : 0; };
  S.top = function (name) { var sh = D.SHEETS && D.SHEETS[name]; return sh ? sh.top || 48 : 42; };

  // a rider on a body (the drider: the drow captain from the waist up on the phase spider's back, till it has a sheet
  // of its own): the rider's frame is cut at its waist (cut px above its foot) and that line set lift px above the
  // body's foot, a little toward the way it faces
  var DIR = [[0, 1], [-0.7, 0.7], [-1, 0], [-0.7, -0.7], [0, -1], [0.7, -0.7], [1, 0], [0.7, 0.7]];
  S.RIDE = { cut: 22, lift: 21, lean: 7 };
  S.drawRider = function (ctx, u, anim, t, x, y, o) {
    var f = (u.facing || 0) % 8, d = DIR[f], rx = Math.round(x + d[0] * S.RIDE.lean), ry = Math.round(y + d[1] * S.RIDE.lean / 2);
    var top = S.top(u.rider), foot = ry - S.RIDE.lift + S.RIDE.cut;
    ctx.save(); ctx.beginPath(); ctx.rect(rx - 40, foot - top - 10, 80, top + 10 - S.RIDE.cut); ctx.clip();
    S.draw(ctx, u.rider, S.anim(u.rider, anim) ? anim : 'idle', f, t, rx, foot, o);
    ctx.restore();
  };
  // how tall a unit stands above its foot (HP bars, labels, picking)
  S.unitTop = function (u) { return u.rider ? S.RIDE.lift - S.RIDE.cut + S.top(u.rider) : S.top(u.sheet); };

  // until a sheet exists: a capsule in the unit's colour, so the grid can be built before the art lands
  S.placeholder = function (ctx, name, x, y, o) {
    var col = (o && o.color) || '#8a96aa';
    ctx.fillStyle = 'rgba(10,8,16,.5)'; ctx.beginPath(); ctx.ellipse(x, y, 11, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#0a0810'; ctx.fillRect(x - 7, y - 41, 14, 40);
    ctx.fillStyle = col; ctx.fillRect(x - 6, y - 40, 12, 38);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x - 6, y - 40, 4, 38);
    return 42;
  };
})();
