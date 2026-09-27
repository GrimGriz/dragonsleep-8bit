/* DEEP16 — art: the cavern's props drawn per pixel through the palette (stalagmites, cocoons, rubble), lit from the upper
   left, ordered-dithered between ramp steps, with a 1-px outline. Each returns { canvas, ax, ay }: ax/ay is the foot. */
'use strict';
(function () {
  var D = window.D16;
  var A = D.art = {};
  function N() { return D.iso.noise; }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function canvasOf(W, H, fn) {
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var cx = cv.getContext('2d'), img = cx.createImageData(W, H), px = img.data;
    var a = new Uint8Array(W * H);
    fn(function (x, y, c, al) {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      var o = (y * W + x) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = al == null ? 255 : al; a[y * W + x] = al == null ? 255 : al;
    });
    // outline: any empty pixel touching an opaque one (4-neighbour) goes dark; the 16-bit read
    var ol = hex(D.PAL.ramps.outline[0]);
    var edge = [];
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      if (a[y * W + x] > 128) continue;
      if ((x > 0 && a[y * W + x - 1] > 200) || (x < W - 1 && a[y * W + x + 1] > 200) || (y > 0 && a[(y - 1) * W + x] > 200) || (y < H - 1 && a[(y + 1) * W + x] > 200)) edge.push(y * W + x);
    }
    edge.forEach(function (i) { var o = i * 4; px[o] = ol[0]; px[o + 1] = ol[1]; px[o + 2] = ol[2]; px[o + 3] = 255; });
    cx.putImageData(img, 0, 0);
    return cv;
  }

  A.stalagmite = function (seed) {
    var n = N(), stone = D.iso.ramp('stone');
    var h = 46 + (seed % 17), R = 9 + (seed >> 5) % 4, W = R * 2 + 12, H = h + 10;
    var ax = Math.floor(W / 2), ay = H - 5;
    var cv = canvasOf(W, H, function (put) {
      // the foot: a low mound on the floor, squashed 2:1
      for (var y = -4; y <= 4; y++) for (var x = -R - 4; x <= R + 4; x++) {
        var e = (x * x) / ((R + 4) * (R + 4)) + (y * y) / 16;
        if (e > 1) continue;
        var v = 0.34 + (-x / (R + 4)) * 0.12 - y / 30 + (n.vnoise(x * 0.4, y * 0.6, seed) - 0.5) * 0.2;
        put(ax + x, ay + y, n.rampPick(stone, v, ax + x, ay + y));
      }
      // the column: tapering, knuckled, lit from the upper left
      for (var j = 0; j < h; j++) {
        var t = j / h, r = R * Math.pow(1 - t, 0.75) * (0.9 + 0.2 * n.vnoise(j * 0.18, 0, seed + 3));
        var yy = ay - j;
        for (var x2 = -Math.ceil(r); x2 <= Math.ceil(r); x2++) {
          if (Math.abs(x2) > r) continue;
          var nx = x2 / Math.max(1, r);
          var ring = n.vnoise(j * 0.35, x2 * 0.2, seed + 7);
          var v2 = 0.52 - nx * 0.34 + (ring - 0.5) * 0.22 + t * 0.12 - (j < 3 ? 0.08 : 0);
          if (nx < -0.55 && ring > 0.62) v2 += 0.15; // wet highlights on the lit side
          put(ax + x2, yy, n.rampPick(stone, v2, ax + x2, yy));
        }
      }
    });
    return { canvas: cv, ax: ax, ay: ay };
  };

  A.cocoon = function (seed) {
    var n = N(), bone = D.iso.ramp('bone'), violet = D.iso.ramp('violet'), stone = D.iso.ramp('stone');
    var W = 26, H = 40, ax = 13, ay = 34;
    var cv = canvasOf(W, H, function (put) {
      // a faint violet glow about it (drawn first, low alpha, stepped)
      for (var y = -30; y <= 4; y++) for (var x = -12; x <= 12; x++) {
        var d = Math.sqrt(x * x + (y + 13) * (y + 13) * 0.5);
        if (d > 12 || d < 7) continue;
        if (n.dith(ax + x, ay + y) > (12 - d) / 10) continue;
        put(ax + x, ay + y, violet[3], 90);
      }
      // the wrapped body: an egg on end, silk bands, a shadowed underside
      for (var y2 = -27; y2 <= 1; y2++) {
        var t = (y2 + 27) / 28, r = 7.2 * Math.sin(Math.PI * Math.pow(t, 0.8)) + 0.5;
        for (var x2 = -Math.ceil(r); x2 <= Math.ceil(r); x2++) {
          if (Math.abs(x2) > r) continue;
          var nx = x2 / Math.max(1, r);
          var band = Math.abs(((y2 * 0.9 + x2 * 0.55 + seed % 5) % 5 + 5) % 5 - 2.5) < 0.6;
          var v = 0.62 - nx * 0.35 - t * 0.25 + (band ? -0.3 : 0) + (n.vnoise(x2 * 0.5, y2 * 0.4, seed) - 0.5) * 0.2;
          var ramp = v < 0.3 ? violet : bone;
          put(ax + x2, ay + y2, v < 0.3 ? n.rampPick(violet, 0.3 + v * 1.4, ax + x2, ay + y2) : n.rampPick(bone, (v - 0.3) * 1.6, ax + x2, ay + y2));
        }
      }
      // strands to the wall above
      for (var s = 0; s < 3; s++) {
        var sx = -4 + s * 4 + (seed >> s) % 2;
        for (var j = -38; j < -26; j++) if (((seed >> (s + j & 7)) & 1) || j > -32) put(ax + sx + Math.round((j + 30) * 0.1 * (s - 1)), ay + j, bone[0], 200);
      }
      // the stain where it touches the floor
      for (var x3 = -6; x3 <= 6; x3++) put(ax + x3, ay + 2, stone[1], 180);
    });
    return { canvas: cv, ax: ax, ay: ay };
  };

  A.rubble = function (seed) {
    var n = N(), stone = D.iso.ramp('stone');
    var r = 3 + seed % 4, W = r * 2 + 6, H = r + 8, ax = Math.floor(W / 2), ay = H - 3;
    var cv = canvasOf(W, H, function (put) {
      for (var y = -r - 1; y <= 2; y++) for (var x = -r; x <= r; x++) {
        var e = (x * x) / (r * r) + ((y + r * 0.4) * (y + r * 0.4)) / (r * r * 0.55);
        if (e > 1 + (n.vnoise(x * 0.9, y * 0.9, seed) - 0.5) * 0.5) continue;
        var v = 0.5 - x / r * 0.25 - (y + r * 0.4) / r * 0.3 + (n.vnoise(x * 0.7, y * 0.7, seed + 2) - 0.5) * 0.25;
        put(ax + x, ay + y, n.rampPick(stone, v, ax + x, ay + y));
      }
    });
    return { canvas: cv, ax: ax, ay: ay };
  };
})();
