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
  S.draw = function (ctx, name, anim, facing, t, x, y, o) {
    var sh = D.SHEETS && D.SHEETS[name];
    if (!sh || !S.has(name)) return S.placeholder(ctx, name, x, y, o);
    var a = sh.anims[anim] || sh.anims.idle, img = D.images[sh.image];
    var fr = Math.floor(t * (a.fps || 8) / 60) % a.frames;
    var row = a.row + (facing % 8);
    if (o && o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.drawImage(img, fr * sh.fw, row * sh.fh, sh.fw, sh.fh, Math.round(x - sh.ax), Math.round(y - sh.ay), sh.fw, sh.fh);
    ctx.globalAlpha = 1;
    return sh.top || sh.ay;
  };

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
