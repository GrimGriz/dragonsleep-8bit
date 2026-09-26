/* DRAGONSLEEP — pixel art toolkit + the tile painters. All art is generated here from
   code (shapes, seeded noise, hand-typed pixel rows). Nothing is copied from any game. */
'use strict';
(function () {
  var DS = window.DS;
  // NES-style hardware palette (2C02 approximation) — colours only, used for the 8-bit look.
  var NES = ['#7C7C7C', '#0000FC', '#0000BC', '#4428BC', '#940084', '#A80020', '#A81000', '#881400', '#503000', '#007800', '#006800', '#005800', '#004058', '#000000', '#000000', '#000000',
    '#BCBCBC', '#0078F8', '#0058F8', '#6844FC', '#D800CC', '#E40058', '#F83800', '#E45C10', '#AC7C00', '#00B800', '#00A800', '#00A844', '#008888', '#000000', '#000000', '#000000',
    '#F8F8F8', '#3CBCFC', '#6888FC', '#9878F8', '#F878F8', '#F85898', '#F87858', '#FCA044', '#F8B800', '#B8F818', '#58D854', '#58F898', '#00E8D8', '#787878', '#000000', '#000000',
    '#FCFCFC', '#A4E4FC', '#B8B8F8', '#D8B8F8', '#F8B8F8', '#F8A4C0', '#F0D0B0', '#FCE0A8', '#F8D878', '#D8F878', '#B8F8B8', '#B8F8D8', '#00FCFC', '#F8D8F8', '#000000', '#000000'];
  var N = DS.N = function (i) { return NES[i]; };
  DS.NES = NES;

  function hexToInt(c) {
    if (c == null) return -1;
    if (typeof c === 'number') return c;
    if (c[0] === '#') c = c.slice(1);
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    return parseInt(c, 16);
  }
  DS.hexToInt = hexToInt;
  function intToHex(i) { return '#' + ('000000' + i.toString(16)).slice(-6); }
  DS.mix = function (a, b, t) {
    var x = hexToInt(a), y = hexToInt(b);
    var r = Math.round(((x >> 16) & 255) * (1 - t) + ((y >> 16) & 255) * t);
    var g = Math.round(((x >> 8) & 255) * (1 - t) + ((y >> 8) & 255) * t);
    var bl = Math.round((x & 255) * (1 - t) + (y & 255) * t);
    return intToHex((r << 16) | (g << 8) | bl);
  };

  // ------------------------------------------------------------------ Pix: an indexed-free RGB buffer
  function Pix(w, h) { this.w = w; this.h = h; this.d = new Int32Array(w * h).fill(-1); }
  DS.Pix = Pix;
  Pix.prototype.set = function (x, y, c) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = hexToInt(c);
  };
  Pix.prototype.get = function (x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1; return this.d[y * this.w + x]; };
  Pix.prototype.on = function (x, y) { return this.get(x, y) !== -1; };
  Pix.prototype.rect = function (x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.set(x + i, y + j, c); return this; };
  Pix.prototype.fill = function (c) { return this.rect(0, 0, this.w, this.h, c); };
  Pix.prototype.frame = function (x, y, w, h, c) {
    for (var i = 0; i < w; i++) { this.set(x + i, y, c); this.set(x + i, y + h - 1, c); }
    for (var j = 0; j < h; j++) { this.set(x, y + j, c); this.set(x + w - 1, y + j, c); }
    return this;
  };
  Pix.prototype.ellipse = function (cx, cy, rx, ry, c) {
    for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    return this;
  };
  Pix.prototype.ring = function (cx, cy, rx, ry, c) {
    for (var a = 0; a < 360; a += 2) this.set(Math.floor(cx + Math.cos(a * Math.PI / 180) * rx), Math.floor(cy + Math.sin(a * Math.PI / 180) * ry), c);
    return this;
  };
  Pix.prototype.line = function (x0, y0, x1, y1, c, th) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (; ;) {
      if (th > 1) this.rect(x0 - (th >> 1), y0 - (th >> 1), th, th, c); else this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  };
  Pix.prototype.poly = function (pts, c) { // [[x,y],...] scanline fill
    var minY = Infinity, maxY = -Infinity, i;
    for (i = 0; i < pts.length; i++) { minY = Math.min(minY, pts[i][1]); maxY = Math.max(maxY, pts[i][1]); }
    for (var y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      var xs = [], yy = y + 0.5;
      for (i = 0; i < pts.length; i++) {
        var a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) xs.push(a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort(function (p, q) { return p - q; });
      for (var k = 0; k + 1 < xs.length; k += 2)
        for (var x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, c);
    }
    return this;
  };
  Pix.prototype.tri = function (x0, y0, x1, y1, x2, y2, c) { return this.poly([[x0, y0], [x1, y1], [x2, y2]], c); };
  Pix.prototype.speckle = function (x, y, w, h, c, dens, rng) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) if (rng() < dens) this.set(x + i, y + j, c);
    return this;
  };
  Pix.prototype.dither = function (x, y, w, h, c, phase) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) if (((x + i + y + j + (phase || 0)) & 1) === 0) this.set(x + i, y + j, c);
    return this;
  };
  // only paints over already-opaque pixels (for shading inside a shape)
  Pix.prototype.shadeWhere = function (test, c) {
    for (var y = 0; y < this.h; y++) for (var x = 0; x < this.w; x++) if (this.on(x, y) && test(x, y)) this.set(x, y, c);
    return this;
  };
  Pix.prototype.outline = function (c, diag) {
    var out = [], w = this.w, h = this.h;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (this.on(x, y)) continue;
      if (this.on(x - 1, y) || this.on(x + 1, y) || this.on(x, y - 1) || this.on(x, y + 1) ||
        (diag && (this.on(x - 1, y - 1) || this.on(x + 1, y - 1) || this.on(x - 1, y + 1) || this.on(x + 1, y + 1)))) out.push(x, y);
    }
    for (var i = 0; i < out.length; i += 2) this.set(out[i], out[i + 1], c);
    return this;
  };
  Pix.prototype.blit = function (src, ox, oy) {
    for (var y = 0; y < src.h; y++) for (var x = 0; x < src.w; x++) { var v = src.d[y * src.w + x]; if (v !== -1) this.set(ox + x, oy + y, v); }
    return this;
  };
  Pix.prototype.flipH = function () {
    var p = new Pix(this.w, this.h);
    for (var y = 0; y < this.h; y++) for (var x = 0; x < this.w; x++) p.d[y * this.w + (this.w - 1 - x)] = this.d[y * this.w + x];
    return p;
  };
  Pix.prototype.clone = function () { var p = new Pix(this.w, this.h); p.d.set(this.d); return p; };
  Pix.prototype.recolor = function (map) { // map: {fromHex: toHex}
    var m = {}; Object.keys(map).forEach(function (k) { m[hexToInt(k)] = hexToInt(map[k]); });
    var p = this.clone();
    for (var i = 0; i < p.d.length; i++) if (p.d[i] in m) p.d[i] = m[p.d[i]];
    return p;
  };
  Pix.prototype.tint = function (c, t) {
    var p = this.clone();
    for (var i = 0; i < p.d.length; i++) if (p.d[i] !== -1) p.d[i] = hexToInt(DS.mix(intToHex(p.d[i]), c, t));
    return p;
  };
  Pix.prototype.silhouette = function (c) { var p = this.clone(), v = hexToInt(c); for (var i = 0; i < p.d.length; i++) if (p.d[i] !== -1) p.d[i] = v; return p; };
  Pix.prototype.rows = function (rows, map, ox, oy) { // paint hand-typed rows; '.' = skip
    for (var y = 0; y < rows.length; y++) for (var x = 0; x < rows[y].length; x++) {
      var ch = rows[y][x];
      if (ch === '.' || ch === ' ') continue;
      if (map[ch] != null) this.set((ox || 0) + x, (oy || 0) + y, map[ch]);
    }
    return this;
  };
  Pix.prototype.canvas = function () {
    var c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
    var x = c.getContext('2d'), img = x.createImageData(this.w, this.h), a = img.data;
    for (var i = 0; i < this.d.length; i++) {
      var v = this.d[i];
      if (v === -1) { a[i * 4 + 3] = 0; continue; }
      a[i * 4] = (v >> 16) & 255; a[i * 4 + 1] = (v >> 8) & 255; a[i * 4 + 2] = v & 255; a[i * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return c;
  };
  DS.fromRows = function (rows, map) {
    var w = 0; rows.forEach(function (r) { w = Math.max(w, r.length); });
    return new Pix(w, rows.length).rows(rows, map);
  };

  // ------------------------------------------------------------------ tiles (16x16)
  // Each painter: function(p, rng, frame, v) — v = variant index.
  var C = {
    grass: N(0x1A), grassD: N(0x0A), grassL: N(0x2A), grassH: N(0x39),
    dirt: N(0x27), dirtD: N(0x17), dirtL: N(0x37), mud: N(0x08),
    rock: N(0x00), rockD: N(0x2D), rockL: N(0x10), rockDD: '#3a3a44',
    snow: N(0x30), water: N(0x12), waterD: N(0x02), waterL: N(0x21), foam: N(0x31),
    tree: N(0x0A), treeD: N(0x0B), treeL: N(0x1A), trunk: N(0x08),
    wood: N(0x17), woodD: N(0x07), woodL: N(0x27), red: N(0x16), redD: N(0x06), redL: N(0x26),
    brown: N(0x18), brownD: N(0x08), slate: N(0x2D), slateD: N(0x0C), slateL: N(0x1C),
    cob: N(0x10), cobD: N(0x00), cobL: N(0x20), sand: N(0x37), sandD: N(0x27),
    black: '#000000', ink: '#101018', bog: N(0x0B), bogD: '#0a2a14', glow: N(0x2B), glowY: N(0x39),
    cave: '#4a3c34', caveD: '#2c221e', caveL: '#6c5a4c', caveF: '#5c4c40', caveFD: '#43372f',
    white: N(0x30), gold: N(0x28), goldD: N(0x18), silver: N(0x20), silverD: N(0x10), purple: N(0x13), purpleD: N(0x03)
  };
  DS.C = C;

  var P = {}; // tile painters keyed by tile id
  function base(p, c) { p.fill(c); }
  // --- overworld / outdoors
  P.grass = function (p, r) {
    base(p, C.grass);
    for (var i = 0; i < 7; i++) { var x = r() * 15 | 0, y = r() * 14 | 0; p.set(x, y, C.grassD); p.set(x + 1, y + 1, C.grassD); }
    for (var k = 0; k < 4; k++) p.set(r() * 16 | 0, r() * 16 | 0, C.grassL);
  };
  P.plains = function (p, r) {
    base(p, C.grassL);
    for (var i = 0; i < 10; i++) { var x = r() * 16 | 0, y = r() * 15 | 0; p.set(x, y, C.grass); p.set(x, y + 1, C.grass); }
    for (var k = 0; k < 3; k++) p.set(r() * 16 | 0, r() * 16 | 0, C.grassH);
  };
  P.flowers = function (p, r) {
    P.grass(p, r);
    for (var k = 0; k < 5; k++) { var x = 1 + r() * 13 | 0, y = 1 + r() * 13 | 0, c = [N(0x30), N(0x26), N(0x28), N(0x24)][k % 4]; p.set(x, y, c); p.set(x + 1, y, c); p.set(x, y + 1, N(0x0A)); }
  };
  P.forest = function (p, r, f, v) {
    base(p, C.grass);
    function tree(cx, cy) {
      p.ellipse(cx, cy, 4.2, 4, C.treeD);
      p.ellipse(cx - 0.5, cy - 0.7, 3.4, 3.2, C.tree);
      p.set(cx - 2, cy - 2, C.treeL); p.set(cx - 1, cy - 3, C.treeL); p.set(cx - 2, cy - 1, C.treeL);
      p.rect(cx - 1, cy + 3, 2, 2, C.trunk);
    }
    tree(4, 5); tree(12, 4); tree(8, 11); if (v & 1) tree(2, 13); else tree(14, 12);
  };
  P.hills = function (p, r) {
    base(p, C.grass);
    function hump(cx, cy, w) {
      p.ellipse(cx, cy, w, 4, C.grassD);
      p.ellipse(cx - 1, cy - 1, w - 1.5, 3, C.grassL);
      p.rect(cx - w + 1, cy + 2, 2 * w - 2, 1, C.grassD);
    }
    hump(5, 7, 5); hump(11, 12, 5);
  };
  P.gnollhills = function (p, r) {
    base(p, C.dirtL);
    p.speckle(0, 0, 16, 16, C.dirt, 0.18, r);
    function hump(cx, cy, w) { p.ellipse(cx, cy, w, 4, C.dirtD); p.ellipse(cx - 1, cy - 1, w - 1.5, 3, C.dirt); }
    hump(5, 6, 5); hump(11, 12, 5);
    p.set(3, 14, N(0x08)); p.set(13, 3, N(0x08));
  };
  P.mountain = function (p, r, f, v) {
    base(p, C.grass);
    var peaks = [[8 + ((v & 1) ? -1 : 0), 1 + (v >> 1), 7]];
    peaks.forEach(function (k) {
      var cx = k[0], top = k[1], hw = k[2];
      p.tri(cx, top, cx - hw - 1, 15, cx + hw + 1, 15, C.rockD);
      p.tri(cx, top, cx - hw, 15, cx, 15, C.rockL);
      p.tri(cx, top, cx - 2, top + 4, cx + 2, top + 4, C.snow);
      p.line(cx, top, cx + hw + 1, 15, C.rockDD);
      p.line(cx, top, cx - hw - 1, 15, C.rockDD);
    });
    p.rect(0, 15, 16, 1, C.rockDD);
  };
  P.peak = function (p, r) {
    base(p, C.rockD);
    p.tri(8, 0, -1, 16, 17, 16, C.rockL);
    p.tri(8, 0, 8, 16, 17, 16, C.rock);
    p.tri(8, 0, 3, 7, 13, 7, C.snow);
    p.line(8, 0, 17, 16, C.rockDD); p.line(8, 0, -1, 16, C.rockDD);
  };
  P.range = function (p, r, f, v) { // dense range: two peaks
    base(p, C.rockDD);
    [[4, 2, 5], [12, 4, 5]].forEach(function (k) {
      var cx = k[0], top = k[1], hw = k[2];
      p.tri(cx, top, cx - hw - 1, 16, cx + hw + 1, 16, C.rockD);
      p.tri(cx, top, cx - hw, 16, cx, 16, C.rockL);
      p.tri(cx, top, cx - 1, top + 3, cx + 1, top + 3, C.snow);
    });
  };
  function waterBase(p, r, f, deep) {
    base(p, deep ? C.waterD : C.water);
    for (var i = 0; i < 4; i++) {
      var y = (i * 4 + 1 + (f >> 0)) % 16, x = ((i * 7 + f * 2) % 16);
      p.rect(x, y, 4, 1, deep ? C.water : C.waterL);
      p.rect((x + 9) % 16, (y + 2) % 16, 3, 1, deep ? C.water : C.waterL);
    }
  }
  P.sea = function (p, r, f) { waterBase(p, r, f, true); };
  P.water = function (p, r, f) { waterBase(p, r, f, false); };
  P.bog = function (p, r, f) {
    base(p, C.bog);
    p.speckle(0, 0, 16, 16, C.bogD, 0.25, r);
    for (var i = 0; i < 3; i++) { var x = r() * 14 | 0, y = r() * 14 | 0; p.rect(x, y, 3, 1, N(0x1C)); }
    var gx = (r() * 14 | 0), gy = (r() * 14 | 0);
    if ((f & 1) === 0) { p.set(gx, gy, C.glowY); p.set(gx + 1, gy, C.glow); } else { p.set(gx, gy, C.glow); }
    var hx = (r() * 14 | 0), hy = (r() * 14 | 0);
    if (f === 1 || f === 2) p.set(hx, hy, C.glowY);
    p.set(3, 4, C.grass); p.set(3, 3, C.grass); p.set(11, 9, C.grass); p.set(11, 8, C.grass);
  };
  P.road = function (p, r) {
    base(p, C.dirtL);
    p.speckle(0, 0, 16, 16, C.dirt, 0.2, r);
    p.speckle(0, 0, 16, 16, C.sand, 0.08, r);
  };
  P.bridge = function (p, r) {
    base(p, C.water);
    p.rect(0, 1, 16, 14, C.wood);
    for (var x = 0; x < 16; x += 4) p.rect(x, 1, 1, 14, C.woodD);
    p.rect(0, 1, 16, 1, C.woodL); p.rect(0, 14, 16, 1, C.woodD);
  };
  P.bridgeV = function (p, r) {
    base(p, C.water);
    p.rect(1, 0, 14, 16, C.wood);
    for (var y = 0; y < 16; y += 4) p.rect(1, y, 14, 1, C.woodD);
    p.rect(1, 0, 1, 16, C.woodL); p.rect(14, 0, 1, 16, C.woodD);
  };
  P.farm = function (p, r) {
    base(p, C.brown);
    for (var y = 1; y < 16; y += 3) { p.rect(0, y, 16, 1, C.brownD); p.speckle(0, y + 1, 16, 1, C.grassH, 0.4, r); }
  };
  P.wheat = function (p, r) {
    base(p, N(0x28));
    for (var y = 0; y < 16; y += 2) for (var x = (y >> 1) & 1; x < 16; x += 3) { p.set(x, y, N(0x38)); p.set(x, y + 1, N(0x18)); }
  };
  P.gulch = function (p, r) {
    base(p, '#8a7a66');
    p.speckle(0, 0, 16, 16, '#6e604e', 0.25, r);
    p.speckle(0, 0, 16, 16, '#a89880', 0.1, r);
  };
  P.web = function (p, r) {
    P.gulch(p, r);
    var c = '#e8e8f0';
    p.line(0, 0, 15, 15, c); p.line(15, 0, 0, 15, c); p.line(8, 0, 8, 15, c); p.line(0, 8, 15, 8, c);
    p.ring(8, 8, 3, 3, c); p.ring(8, 8, 6, 6, c);
  };
  P.webtree = function (p, r) {
    P.gulch(p, r);
    p.ellipse(8, 7, 5, 5, '#5a5a4a'); p.ellipse(7, 6, 4, 4, '#76766a');
    p.rect(7, 11, 2, 4, C.trunk);
    var c = '#e8e8f0'; p.line(2, 2, 14, 12, c); p.line(3, 13, 13, 2, c); p.ring(8, 7, 5, 5, c);
  };
  P.sand = function (p, r) { base(p, C.sand); p.speckle(0, 0, 16, 16, C.sandD, 0.12, r); };
  P.shore = P.sand;
  P.cliff = function (p, r) {
    base(p, C.rockD);
    for (var y = 0; y < 16; y += 4) { p.rect(0, y, 16, 1, C.rockDD); p.rect(((y * 3) % 12), y + 1, 5, 2, C.rock); }
  };
  P.snowfield = function (p, r) { base(p, C.snow); p.speckle(0, 0, 16, 16, N(0x31), 0.15, r); p.speckle(0, 0, 16, 16, N(0x10), 0.05, r); };
  P.dirtpath = function (p, r) { base(p, C.dirt); p.speckle(0, 0, 16, 16, C.dirtD, 0.2, r); p.speckle(0, 0, 16, 16, C.dirtL, 0.1, r); };

  // --- overworld location icons
  P.town = function (p, r) {
    base(p, C.grass);
    p.rect(1, 9, 14, 6, C.cob); p.frame(1, 9, 14, 6, C.cobD);
    // three roofs
    [[2, 4, C.red, C.redD], [7, 2, C.brown, C.brownD], [11, 5, C.red, C.redD]].forEach(function (b) {
      p.rect(b[0], b[1] + 3, 4, 5, N(0x36)); p.frame(b[0], b[1] + 3, 4, 5, C.ink);
      p.tri(b[0] - 1, b[1] + 3, b[0] + 2, b[1], b[0] + 5, b[1] + 3, b[2]);
      p.line(b[0] - 1, b[1] + 3, b[0] + 4, b[1] + 3, b[3]);
      p.set(b[0] + 1, b[1] + 6, C.ink);
    });
    p.rect(7, 12, 2, 3, C.woodD);
  };
  P.silverton = function (p, r) { // the town against the mountain: facade + roofs
    base(p, C.dirt);
    p.rect(0, 0, 16, 6, C.rockD);
    p.rect(1, 1, 14, 5, '#58586a'); p.rect(1, 1, 14, 1, C.rockL);
    for (var x = 2; x < 15; x += 3) p.rect(x, 3, 2, 3, C.ink);
    p.rect(7, 0, 2, 6, N(0x21));
    [[1, 8, C.red, C.redD], [6, 9, C.brown, C.brownD], [11, 8, C.red, C.redD]].forEach(function (b) {
      p.rect(b[0], b[1] + 2, 4, 4, N(0x36)); p.frame(b[0], b[1] + 2, 4, 4, C.ink);
      p.tri(b[0] - 1, b[1] + 2, b[0] + 2, b[1] - 1, b[0] + 5, b[1] + 2, b[2]);
      p.set(b[0] + 1, b[1] + 4, C.ink);
    });
  };
  P.cave = function (p, r) {
    P.mountain(p, r, 0, 2);
    p.ellipse(8, 13, 4, 5, C.ink); p.rect(4, 13, 8, 3, C.ink);
    p.set(4, 11, C.rockL); p.set(11, 11, C.rockL);
  };
  P.camp = function (p, r) {
    base(p, C.dirtL); p.speckle(0, 0, 16, 16, C.dirt, 0.2, r);
    p.rect(0, 0, 16, 5, C.rockD); p.rect(0, 0, 16, 1, C.rockL);
    [2, 7, 12].forEach(function (x) { p.ellipse(x + 1.5, 4, 2, 3, C.ink); p.set(x, 2, C.gold); });
    p.rect(2, 9, 5, 4, C.wood); p.rect(2, 8, 5, 1, C.woodD); p.rect(9, 10, 5, 3, C.wood); p.rect(9, 9, 5, 1, C.woodD);
    p.rect(4, 11, 1, 2, C.ink); p.rect(11, 11, 1, 2, C.ink);
  };
  P.inn = function (p, r) {
    base(p, C.grass);
    p.rect(2, 7, 12, 8, N(0x36)); p.frame(2, 7, 12, 8, C.ink);
    p.tri(0, 7, 8, 1, 16, 7, C.brown); p.line(0, 7, 15, 7, C.brownD);
    p.rect(7, 11, 2, 4, C.woodD); p.rect(3, 9, 2, 2, N(0x38)); p.rect(11, 9, 2, 2, N(0x38));
    p.rect(13, 3, 1, 4, C.ink); p.rect(12, 5, 3, 2, C.gold);
  };
  P.tower = function (p, r) {
    base(p, C.grass);
    p.rect(5, 3, 6, 12, '#6c6c8c'); p.frame(5, 3, 6, 12, C.ink);
    p.tri(4, 3, 8, -2, 12, 3, C.purple);
    p.rect(7, 6, 2, 2, N(0x38)); p.rect(7, 11, 2, 4, C.ink);
    p.rect(5, 3, 1, 12, '#8c8cac');
  };
  P.signpost = function (p, r) {
    P.road(p, r);
    p.rect(7, 6, 2, 9, C.woodD); p.rect(2, 3, 12, 5, C.wood); p.frame(2, 3, 12, 5, C.woodD); p.rect(4, 5, 8, 1, C.woodD);
  };
  P.hamlet = P.town;

  // --- town tiles
  P.cobble = function (p, r) {
    base(p, C.cob);
    for (var y = 0; y < 16; y += 4) { var off = (y >> 2) & 1 ? 2 : 0; for (var x = -off; x < 16; x += 5) { p.frame(x, y, 5, 4, C.cobD); p.set(x + 1, y + 1, C.cobL); } }
  };
  P.dirt = function (p, r) { base(p, C.dirt); p.speckle(0, 0, 16, 16, C.dirtD, 0.14, r); p.speckle(0, 0, 16, 16, C.dirtL, 0.1, r); };
  P.tree = function (p, r) {
    P.grass(p, r);
    p.ellipse(8, 7, 6.5, 6, C.treeD); p.ellipse(7, 6, 5.5, 5, C.tree);
    p.set(5, 3, C.treeL); p.set(4, 4, C.treeL); p.set(6, 3, C.treeL); p.set(5, 5, C.treeL);
    p.rect(7, 12, 2, 4, C.trunk);
  };
  function roof(color, dark, light) {
    return function (p, r, f, v, nb) {
      base(p, color);
      for (var y = 1; y < 16; y += 3) { p.rect(0, y, 16, 1, dark); for (var x = (y % 2) * 3; x < 16; x += 6) p.set(x, y + 1, dark); }
      if (nb && !nb.up) { p.rect(0, 0, 16, 2, light); p.rect(0, 2, 16, 1, dark); }
      if (nb && !nb.left) p.rect(0, 0, 1, 16, dark);
      if (nb && !nb.right) p.rect(15, 0, 1, 16, dark);
      if (nb && !nb.down) p.rect(0, 14, 16, 2, dark);
    };
  }
  P.roofR = roof(C.red, C.redD, C.redL);
  P.roofB = roof(C.brown, C.brownD, N(0x28));
  P.roofS = roof(C.slate, C.slateD, C.slateL);
  function wallBase(p) {
    base(p, N(0x36));
    for (var y = 3; y < 16; y += 4) p.rect(0, y, 16, 1, N(0x27));
    p.rect(0, 0, 16, 1, N(0x17));
  }
  P.wall = function (p, r) { wallBase(p); p.rect(0, 15, 16, 1, N(0x17)); };
  P.wallWin = function (p, r) {
    wallBase(p);
    p.rect(4, 4, 8, 7, C.ink); p.rect(5, 5, 6, 5, N(0x38)); p.rect(7, 5, 1, 5, C.woodD); p.rect(5, 7, 6, 1, C.woodD);
    p.rect(3, 11, 10, 1, C.woodD);
  };
  P.door = function (p, r) {
    wallBase(p);
    p.rect(3, 3, 10, 13, C.woodD); p.rect(4, 4, 8, 12, C.wood);
    p.rect(7, 4, 1, 12, C.woodD); p.set(10, 10, C.gold);
    p.rect(3, 2, 10, 1, C.ink);
  };
  P.shopdoor = function (p, r) {
    P.door(p, r);
  };
  P.doorShut = function (p, r) {
    P.door(p, r); p.rect(4, 9, 8, 1, C.woodD);
  };
  P.stonewall = function (p, r) {
    base(p, '#6a6a78');
    for (var y = 0; y < 16; y += 4) { var off = (y >> 2) & 1 ? 4 : 0; for (var x = -off; x < 16; x += 8) { p.frame(x, y, 8, 4, '#4a4a58'); p.rect(x + 1, y + 1, 3, 1, '#8a8a98'); } }
  };
  P.edifice = function (p, r, f, v, nb) {
    base(p, '#50505e');
    p.rect(0, 0, 16, 16, '#50505e');
    for (var y = 0; y < 16; y += 8) { p.rect(0, y, 16, 1, '#3a3a46'); p.rect(0, y + 1, 16, 1, '#6c6c7c'); }
    p.rect(0, 0, 1, 16, '#3a3a46'); p.rect(8, 0, 1, 16, '#3a3a46');
    p.set(3, 4, '#6c6c7c'); p.set(12, 11, '#6c6c7c');
  };
  P.edificeArch = function (p, r) {
    P.edifice(p, r);
    p.ellipse(8, 9, 5, 6, '#24242c'); p.rect(3, 9, 10, 7, '#24242c');
    p.ring(8, 9, 5, 6, '#6c6c7c');
  };
  P.pillar = function (p, r) {
    base(p, '#50505e'); p.rect(4, 0, 8, 16, '#6c6c7c'); p.rect(4, 0, 2, 16, '#8a8a98'); p.rect(10, 0, 2, 16, '#3a3a46');
  };
  P.vault = function (p, r) {
    base(p, '#3a3a46');
    p.rect(1, 1, 14, 15, '#6a5a3a'); p.frame(1, 1, 14, 15, '#2a2a30');
    p.line(2, 2, 13, 15, C.goldD); p.line(13, 2, 2, 15, C.goldD);
    p.ellipse(8, 8, 3, 3, C.gold); p.ellipse(8, 8, 1.5, 1.5, '#6a5a3a');
  };
  P.fountain = function (p, r, f) {
    P.cobble(p, r);
    p.ellipse(8, 9, 7, 6, '#6c6c7c'); p.ellipse(8, 9, 5.5, 4.5, C.water);
    p.rect(7, 2, 2, 7, '#8a8a98');
    var s = f & 1;
    p.set(6 - s, 3 + s, C.foam); p.set(9 + s, 3 + s, C.foam); p.set(5, 5 + s, C.waterL); p.set(10, 5 + s, C.waterL);
    p.set(7, 1, C.foam); p.set(8, 1, C.foam);
    p.rect(5 + s * 2, 9, 3, 1, C.waterL);
  };
  P.channel = function (p, r, f) {
    base(p, '#6c6c7c');
    p.rect(0, 3, 16, 10, C.water);
    p.rect((f * 4) % 16, 6, 5, 1, C.waterL); p.rect((f * 4 + 8) % 16, 9, 4, 1, C.waterL);
    p.rect(0, 3, 16, 1, '#3a3a46');
  };
  P.falls = function (p, r, f) {
    base(p, N(0x21));
    for (var i = 0; i < 16; i++) { var x = (i * 5) % 16; var y = (i * 3 + f * 4) % 16; p.rect(x, y, 1, 4, C.foam); }
    p.rect(0, 0, 1, 16, C.waterL); p.rect(15, 0, 1, 16, C.water);
  };
  P.fence = function (p, r) {
    P.dirt(p, r);
    p.rect(0, 5, 16, 2, C.wood); p.rect(0, 10, 16, 2, C.wood);
    [1, 7, 13].forEach(function (x) { p.rect(x, 2, 2, 13, C.woodD); p.set(x, 2, C.woodL); });
  };
  P.stockade = function (p, r) {
    P.dirt(p, r);
    for (var x = 0; x < 16; x += 3) { p.rect(x, 1, 3, 15, C.wood); p.rect(x, 1, 1, 15, C.woodL); p.rect(x + 2, 1, 1, 15, C.woodD); p.tri(x, 1, x + 1.5, -1, x + 3, 1, C.wood); }
    p.rect(0, 6, 16, 1, C.woodD);
  };
  P.lamp = function (p, r, f) {
    P.cobble(p, r);
    p.rect(7, 5, 2, 11, C.ink); p.rect(5, 1, 6, 5, C.ink);
    p.rect(6, 2, 4, 3, f & 1 ? N(0x38) : N(0x28));
  };
  P.well = function (p, r) {
    P.dirt(p, r);
    p.ellipse(8, 10, 6, 4, '#6c6c7c'); p.ellipse(8, 10, 4, 2.5, C.ink);
    p.rect(2, 2, 1, 8, C.woodD); p.rect(13, 2, 1, 8, C.woodD); p.rect(1, 1, 14, 2, C.brown);
  };
  P.stall = function (p, r, f, v) {
    P.cobble(p, r);
    var c1 = [C.red, N(0x21), N(0x28), N(0x2A)][v % 4];
    for (var x = 0; x < 16; x += 4) { p.rect(x, 1, 2, 5, c1); p.rect(x + 2, 1, 2, 5, N(0x30)); }
    p.rect(0, 6, 16, 1, C.ink);
    p.rect(1, 8, 14, 5, C.wood); p.rect(1, 8, 14, 1, C.woodL);
    p.set(3, 9, N(0x26)); p.set(5, 9, N(0x28)); p.set(9, 9, N(0x2A)); p.set(12, 9, N(0x26));
    p.rect(1, 13, 1, 3, C.woodD); p.rect(14, 13, 1, 3, C.woodD);
  };
  P.crate = function (p, r, f, v) {
    P.dirt(p, r);
    if (v & 1) { // barrel
      p.ellipse(8, 9, 5, 6, C.wood); p.rect(3, 6, 10, 1, C.woodD); p.rect(3, 11, 10, 1, C.woodD); p.ellipse(8, 4, 4, 1.5, C.woodL);
    } else {
      p.rect(2, 3, 12, 12, C.wood); p.frame(2, 3, 12, 12, C.woodD); p.line(2, 3, 13, 14, C.woodD); p.rect(2, 3, 12, 1, C.woodL);
    }
  };
  P.headframe = function (p, r) {
    P.dirt(p, r);
    p.ellipse(8, 13, 5, 2.5, C.ink);
    p.line(2, 15, 8, 1, C.woodD, 2); p.line(14, 15, 8, 1, C.woodD, 2); p.rect(4, 6, 8, 1, C.wood);
    p.rect(7, 0, 3, 3, C.wood); p.line(8, 2, 8, 12, '#c0c0c0');
  };
  P.tent = function (p, r) {
    P.dirt(p, r);
    p.tri(1, 15, 8, 2, 15, 15, N(0x37)); p.tri(8, 2, 15, 15, 8, 15, N(0x27));
    p.tri(6, 15, 8, 9, 10, 15, C.ink);
  };
  P.grassT = P.grass;
  P.sandArena = function (p, r) { base(p, N(0x38)); p.speckle(0, 0, 16, 16, N(0x28), 0.15, r); p.speckle(0, 0, 16, 16, N(0x37), 0.1, r); };
  P.hexwall = function (p, r, f, v, nb) {
    base(p, '#7a5a3a');
    for (var y = 0; y < 16; y += 4) p.rect(0, y, 16, 1, '#5a3a22');
    for (var x = 0; x < 16; x += 8) p.rect(x + ((x >> 3) & 1) * 4, 0, 1, 16, '#5a3a22');
    p.rect(0, 0, 16, 2, '#9a7a52');
  };
  P.hexwallRed = function (p, r) { P.hexwall(p, r); p.rect(0, 6, 16, 3, C.redD); p.rect(0, 7, 16, 1, C.red); };
  // --- interiors
  P.floorWood = function (p, r) {
    base(p, C.wood);
    for (var y = 0; y < 16; y += 4) { p.rect(0, y, 16, 1, C.woodD); p.set((y * 5) % 16, y + 2, C.woodD); }
    for (var x = 3; x < 16; x += 8) p.rect(x, 0, 1, 4, C.woodD);
  };
  P.floorStone = function (p, r) {
    base(p, '#8a8a92');
    for (var y = 0; y < 16; y += 8) for (var x = 0; x < 16; x += 8) { p.frame(x, y, 8, 8, '#6a6a72'); p.set(x + 2, y + 2, '#a4a4ac'); }
  };
  P.rug = function (p, r) { base(p, C.redD); p.frame(1, 1, 14, 14, N(0x28)); p.dither(3, 3, 10, 10, C.red, 0); };
  P.counter = function (p, r) {
    P.floorWood(p, r);
    p.rect(0, 2, 16, 10, C.woodD); p.rect(0, 2, 16, 3, C.woodL); p.rect(0, 5, 16, 1, C.ink);
  };
  P.bar = function (p, r) {
    P.floorWood(p, r);
    p.rect(0, 2, 16, 11, '#5a3018'); p.rect(0, 2, 16, 3, '#8a5028'); p.rect(0, 5, 16, 1, C.ink);
    p.rect(3, 0, 2, 3, N(0x30)); p.rect(10, 0, 2, 3, N(0x28));
  };
  P.table = function (p, r) {
    P.floorWood(p, r);
    p.ellipse(8, 7, 6, 4, C.woodL); p.ellipse(8, 8, 6, 4, C.woodD); p.ellipse(8, 7, 5.5, 3.5, C.woodL);
    p.rect(7, 11, 2, 4, C.woodD); p.set(6, 6, N(0x30)); p.set(10, 7, N(0x28));
  };
  P.stairsUp = function (p, r) {
    base(p, '#5a5a62');
    for (var y = 0; y < 16; y += 3) { p.rect(0, y, 16, 2, '#9a9aa2'); p.rect(0, y + 2, 16, 1, '#3a3a42'); }
    p.rect(0, 0, 1, 16, C.ink); p.rect(15, 0, 1, 16, C.ink);
  };
  P.stairsDown = function (p, r) {
    base(p, C.ink);
    for (var y = 1, w = 14; y < 16; y += 3, w -= 2) { p.rect(8 - w / 2, y, w, 2, '#7a7a82'); }
  };
  P.bed = function (p, r) {
    P.floorWood(p, r);
    p.rect(2, 1, 12, 14, C.woodD); p.rect(3, 2, 10, 4, N(0x30)); p.rect(3, 6, 10, 8, N(0x12)); p.rect(3, 6, 10, 1, N(0x21));
  };
  P.shelf = function (p, r) {
    base(p, C.woodD);
    for (var y = 1; y < 16; y += 5) { p.rect(0, y + 3, 16, 1, C.woodL); for (var x = 1; x < 15; x += 3) p.rect(x, y, 2, 3, [N(0x16), N(0x2A), N(0x21), N(0x28)][(x + y) % 4]); }
  };
  P.hearth = function (p, r, f) {
    base(p, '#6a6a72'); p.frame(0, 0, 16, 16, '#4a4a52');
    p.rect(3, 5, 10, 11, C.ink); p.rect(4 + (f & 1), 10, 8, 5, N(0x16)); p.rect(6, 8 - (f & 1), 4, 4, N(0x27)); p.rect(7, 11, 2, 3, N(0x38));
  };
  P.boxes = function (p, r) { // the wall of iron boxes
    base(p, '#3a3a42');
    for (var y = 0; y < 16; y += 5) for (var x = 0; x < 16; x += 5) { p.rect(x + 1, y + 1, 4, 4, '#6a6a78'); p.set(x + 3, y + 3, C.ink); p.set(x + 1, y + 1, '#9a9aa8'); }
  };
  P.void = function (p) { base(p, '#000000'); };
  P.darkfloor = function (p, r) { base(p, '#18141a'); p.speckle(0, 0, 16, 16, '#241e26', 0.2, r); };
  P.curtain = function (p, r) { base(p, N(0x05)); for (var x = 1; x < 16; x += 3) p.rect(x, 0, 1, 16, N(0x15)); };

  // --- dungeon
  P.caveFloor = function (p, r) {
    base(p, C.caveF);
    p.speckle(0, 0, 16, 16, C.caveFD, 0.18, r);
    p.speckle(0, 0, 16, 16, C.caveL, 0.05, r);
  };
  P.caveWall = function (p, r, f, v, nb) {
    // face when the tile below is walkable; top (rock mass) otherwise
    if (nb && nb.downFloor) {
      base(p, C.cave);
      for (var y = 2; y < 16; y += 4) { var o = (y >> 2) & 1 ? 3 : 0; for (var x = -o; x < 16; x += 6) { p.rect(x, y, 5, 3, C.caveL); p.rect(x, y + 2, 5, 1, C.caveD); } }
      p.rect(0, 0, 16, 2, C.caveD); p.rect(0, 15, 16, 1, C.ink);
    } else {
      base(p, C.caveD);
      p.speckle(0, 0, 16, 16, '#3a2e28', 0.3, r);
      if (nb && nb.upFloor) p.rect(0, 0, 16, 1, C.cave);
    }
  };
  P.timber = function (p, r, f, v, nb) {
    P.caveWall(p, r, f, v, { downFloor: true });
    p.rect(2, 0, 3, 16, C.woodD); p.rect(11, 0, 3, 16, C.woodD); p.rect(0, 0, 16, 3, C.wood); p.rect(2, 0, 1, 16, C.wood); p.rect(11, 0, 1, 16, C.wood);
  };
  P.rails = function (p, r) {
    P.caveFloor(p, r);
    for (var y = 1; y < 16; y += 4) p.rect(2, y, 12, 2, C.woodD);
    p.rect(4, 0, 1, 16, '#9a9aa2'); p.rect(11, 0, 1, 16, '#9a9aa2');
  };
  P.railsH = function (p, r) {
    P.caveFloor(p, r);
    for (var x = 1; x < 16; x += 4) p.rect(x, 2, 2, 12, C.woodD);
    p.rect(0, 4, 16, 1, '#9a9aa2'); p.rect(0, 11, 16, 1, '#9a9aa2');
  };
  P.pool = function (p, r, f) {
    base(p, '#123040'); p.rect(((f * 3) % 12), 5, 4, 1, '#2a6a80'); p.rect(((f * 3 + 7) % 14), 11, 3, 1, '#2a6a80');
    p.speckle(0, 0, 16, 16, '#1a4050', 0.1, r);
  };
  P.deep = function (p, r, f) { base(p, '#081820'); p.rect(((f * 2) % 12), 7, 4, 1, '#123040'); };
  P.ooze = function (p, r) {
    P.caveFloor(p, r);
    p.ellipse(7, 8, 5, 3, '#5a6a4a'); p.ellipse(10, 11, 3, 2, '#6a7a52'); p.set(6, 7, '#8a9a6a');
  };
  P.guano = function (p, r) {
    P.caveFloor(p, r);
    p.speckle(0, 0, 16, 16, '#d8d0b8', 0.22, r); p.speckle(0, 0, 16, 16, '#ece4cc', 0.08, r);
  };
  P.guanoDeep = function (p, r) {
    base(p, '#b8b098'); p.speckle(0, 0, 16, 16, '#9a927a', 0.25, r); p.speckle(0, 0, 16, 16, '#e8e0c8', 0.12, r);
  };
  P.webFloor = function (p, r) { P.caveFloor(p, r); var c = '#d8d8e0'; p.line(0, 3, 15, 12, c); p.line(3, 15, 12, 0, c); p.ring(8, 8, 4, 4, c); };
  P.dwarfFloor = function (p, r) {
    base(p, '#5a5a66');
    for (var y = 0; y < 16; y += 8) for (var x = 0; x < 16; x += 8) { p.frame(x, y, 8, 8, '#44444e'); p.set(x + 1, y + 1, '#6e6e7a'); }
  };
  P.dwarfWall = function (p, r, f, v, nb) {
    if (nb && nb.downFloor) {
      base(p, '#44444e');
      for (var y = 0; y < 16; y += 4) { var o = (y >> 2) & 1 ? 4 : 0; for (var x = -o; x < 16; x += 8) { p.frame(x, y, 8, 4, '#30303a'); p.rect(x + 1, y + 1, 5, 1, '#5a5a66'); } }
      p.rect(0, 15, 16, 1, C.ink);
    } else { base(p, '#26262e'); p.speckle(0, 0, 16, 16, '#30303a', 0.2, r); }
  };
  P.runeWall = function (p, r, f) {
    P.dwarfWall(p, r, f, 0, { downFloor: true });
    var g = f & 1 ? N(0x31) : N(0x21);
    p.rect(3, 3, 10, 10, '#30303a'); p.line(5, 5, 10, 5, g); p.line(8, 5, 8, 11, g); p.line(5, 11, 10, 8, g); p.set(5, 8, g);
  };
  P.sealDoor = function (p, r, f) {
    base(p, '#30303a');
    p.rect(2, 1, 12, 15, '#5a5a66'); p.frame(2, 1, 12, 15, '#1e1e26'); p.rect(7, 1, 2, 15, '#1e1e26');
    var g = f & 1 ? N(0x31) : N(0x21);
    p.ring(8, 8, 4, 4, g); p.set(8, 4, g); p.set(8, 12, g); p.set(4, 8, g); p.set(12, 8, g);
  };
  P.drownStair = function (p, r, f) {
    base(p, '#081820');
    for (var y = 1; y < 16; y += 3) p.rect(1, y, 14, 1, '#1a3a48');
    p.rect((f * 3) % 12, 6, 4, 1, '#2a6a80');
  };
  P.ladder = function (p, r) {
    P.caveFloor(p, r); p.ellipse(8, 8, 7, 7, C.ink);
    p.rect(4, 0, 2, 16, C.wood); p.rect(10, 0, 2, 16, C.wood); for (var y = 1; y < 16; y += 3) p.rect(4, y, 8, 1, C.woodL);
  };
  P.holeDown = function (p, r) {
    P.caveFloor(p, r);
    p.ellipse(8, 8, 6.5, 5.5, C.ink); p.ellipse(8, 7, 5, 4, '#000');
    p.rect(3, 5, 1, 6, C.woodD); p.rect(12, 5, 1, 6, C.woodD); for (var y = 5; y < 12; y += 2) p.rect(4, y, 8, 1, C.wood);
  };
  P.lantern = function (p, r, f) {
    P.caveFloor(p, r);
    p.rect(7, 4, 2, 12, C.woodD); p.rect(5, 1, 6, 5, C.ink); p.rect(6, 2, 4, 3, f & 1 ? N(0x38) : N(0x28));
  };
  P.cradle = function (p, r) {
    P.caveFloor(p, r);
    p.rect(1, 3, 14, 11, C.woodD); p.rect(2, 4, 12, 9, C.caveD);
    for (var x = 2; x < 14; x += 3) p.rect(x, 4, 1, 9, C.wood);
    p.rect(1, 7, 14, 1, C.wood);
  };
  P.gate = function (p, r) {
    P.caveFloor(p, r);
    p.rect(0, 1, 16, 2, '#6a6a72'); p.rect(0, 13, 16, 1, '#4a4a52');
    for (var x = 1; x < 16; x += 3) p.rect(x, 1, 1, 13, '#8a8a92');
  };
  P.gateOpen = function (p, r) { // Skarn's gate swung back against the rock
    P.caveFloor(p, r);
    p.rect(0, 1, 16, 1, '#4a4a52');
    p.rect(0, 1, 2, 14, '#6a6a72'); p.rect(14, 1, 2, 14, '#6a6a72');
    p.rect(0, 1, 1, 14, '#8a8a92'); p.rect(15, 1, 1, 14, '#8a8a92');
  };
  P.noticeboard = function (p, r) { // the Weigh-House board, nailed to its front wall
    wallBase(p);
    p.rect(1, 2, 14, 11, C.woodD); p.rect(2, 3, 12, 9, C.wood);
    p.rect(3, 4, 4, 5, '#e8e0c8'); p.rect(8, 4, 5, 3, '#f0e8d8'); p.rect(8, 8, 4, 3, '#d8c8a0');
    p.rect(4, 5, 2, 1, C.ink); p.rect(4, 7, 2, 1, C.ink); p.rect(9, 5, 3, 1, C.ink); p.set(5, 4, C.red);
    p.rect(1, 13, 1, 3, C.woodD); p.rect(14, 13, 1, 3, C.woodD);
  };
  P.cocoon = function (p, r, f) { // a traveler wrapped tight in silk, hanging off the ground
    P.gulch(p, r);
    p.line(8, 0, 8, 3, '#e8e8f0');
    p.ellipse(8, 9, 4, 6.5, '#d8d8e0'); p.ellipse(8, 9, 3, 5.5, '#f0f0f8');
    for (var y = 5; y < 15; y += 2) p.line(4, y + (f & 1), 12, y + 1 - (f & 1), '#b8b8c8');
    p.set(7 + (f & 1), 6, '#9c8070');
  };
  P.bones = function (p, r) {
    P.caveFloor(p, r);
    p.line(3, 10, 9, 7, '#e8e0d0'); p.set(3, 9, '#e8e0d0'); p.set(9, 6, '#e8e0d0');
    p.ellipse(11, 11, 2.5, 2, '#e8e0d0'); p.set(10, 11, C.ink); p.set(12, 11, C.ink);
  };
  P.stalag = function (p, r) {
    P.caveFloor(p, r);
    p.tri(8, 1, 3, 15, 13, 15, C.cave); p.tri(8, 1, 3, 15, 8, 15, C.caveL); p.line(8, 1, 13, 15, C.caveD);
  };
  P.fungus = function (p, r, f) {
    P.caveFloor(p, r);
    [[4, 9, N(0x2B)], [10, 6, N(0x39)], [11, 12, N(0x2B)]].forEach(function (m) {
      p.rect(m[0], m[1], 1, 3, '#d8d0c0'); p.ellipse(m[0] + 0.5, m[1], 2.5, 1.5, (f & 1) ? m[2] : N(0x1B));
    });
  };
  P.gravel = function (p, r) { P.caveFloor(p, r); p.speckle(0, 0, 16, 16, '#7a6a5a', 0.2, r); p.speckle(0, 0, 16, 16, '#3a2e28', 0.1, r); };
  P.minecart = function (p, r) {
    P.rails(p, r);
    p.rect(2, 3, 12, 9, '#5a5a62'); p.frame(2, 3, 12, 9, '#2a2a30'); p.rect(3, 4, 10, 3, '#a4a4ac'); p.speckle(3, 4, 10, 3, '#6a6a72', 0.4, r);
    p.rect(3, 12, 3, 2, C.ink); p.rect(10, 12, 3, 2, C.ink);
  };
  P.crateCave = function (p, r, f, v) { P.caveFloor(p, r); var q = new Pix(16, 16); P.crate(q, r, f, v); for (var i = 0; i < q.d.length; i++) { var x = i % 16, y = i / 16 | 0; if (y >= 2 && x >= 2 && x <= 13) p.d[i] = q.d[i]; } };
  P.glowmoss = function (p, r, f) {
    P.caveFloor(p, r);
    for (var i = 0; i < 6; i++) { var x = r() * 15 | 0, y = r() * 15 | 0; p.set(x, y, (f + i) & 1 ? N(0x2B) : N(0x1B)); p.set(x + 1, y, N(0x1B)); }
  };
  P.chimney = function (p, r) { P.caveFloor(p, r); p.ellipse(8, 8, 6, 6, '#6a5a4c'); p.ellipse(8, 8, 4, 4, '#8a7a6c'); p.ellipse(8, 8, 2, 2, '#b0a090'); };
  P.flatstone = function (p, r) {
    P.sand(p, r); p.ellipse(8, 9, 6, 4, '#6a6a72'); p.ellipse(8, 8, 5.5, 3.5, '#9a9aa2'); p.set(6, 7, '#b0b0b8');
  };
  P.reeds = function (p, r) {
    P.grass(p, r);
    for (var x = 1; x < 16; x += 3) { p.rect(x, 4 + (x % 4), 1, 10 - (x % 4), N(0x1A)); p.set(x, 3 + (x % 4), N(0x08)); }
  };
  P.dock = function (p, r, f) { waterBase(p, r, f, false); p.rect(4, 0, 8, 16, C.wood); for (var y = 0; y < 16; y += 3) p.rect(4, y, 8, 1, C.woodD); };

  // --- the dwarven expansion: the Burial, Solskaft, the works (2026-09-26 spec)
  var DW = { floor: '#5a5a66', grid: '#44444e', hi: '#6e6e7a', face: '#44444e', brick: '#30303a', top: '#26262e', dark: '#16161c', shroud: '#b8b4a8', shroudD: '#8a867c', rune: '#9a9aa8' };
  function dwFace(p) { P.dwarfWall(p, null, 0, 0, { downFloor: true }); }
  function dwFloor(p) { P.dwarfFloor(p); }
  function nicheBase(p, v) { // a slot cut in the dressed face, a shrouded body laid in it, a line of carving under
    dwFace(p);
    p.rect(1, 3, 14, 7, DW.dark); p.rect(1, 3, 14, 1, DW.brick);
    p.ellipse(8, 7.5, 5.5, 1.8, DW.shroudD); p.ellipse(7.5, 7, 5, 1.4, DW.shroud);
    p.ellipse(3.5, 7, 1.6, 1.4, DW.shroud); p.line(5, 6, 12, 6, '#d0ccc0');
    for (var x = 2; x < 14; x += 2) p.set(x, 12, (x + v) % 3 ? DW.rune : DW.brick);
    p.rect(1, 10, 14, 1, DW.hi);
  }
  P.niche = function (p, r, f, v) { nicheBase(p, v); if (v === 1) p.set(9, 8, '#6a5a3a'); };
  P.nicheGear = function (p, r, f, v) { // a wiped-out family's gear, still on the bones: a boss, a rim, mail
    nicheBase(p, v);
    p.ellipse(9, 6.5, 2.2, 2, '#8a8a98'); p.ring(9, 6.5, 2.2, 2, '#d8d8e8'); p.set(9, 6, f & 1 ? '#F8F8F8' : '#F8D878');
    p.rect(4, 8, 3, 1, '#9a9aa8');
  };
  P.nicheOpen = function (p, r) { // pried: the slab off, chisel scars, the bones moved
    dwFace(p);
    p.rect(1, 3, 14, 7, DW.dark); p.line(1, 3, 6, 9, DW.brick); p.line(9, 3, 14, 8, DW.brick);
    p.line(3, 8, 7, 7, '#e8e0d0'); p.set(10, 8, '#e8e0d0'); p.ellipse(12, 7, 1.5, 1.2, '#e8e0d0');
    p.rect(1, 10, 14, 1, DW.hi); p.set(4, 12, '#c8c8d8'); p.set(11, 13, '#c8c8d8'); p.set(7, 11, '#c8c8d8');
  };
  P.nicheStone = function (p, r, f, v) { // a patron's niche: deeper, a carved lintel
    dwFace(p);
    p.rect(0, 1, 16, 2, DW.hi); p.rect(0, 2, 16, 1, DW.brick); for (var x = 1; x < 16; x += 3) p.set(x, 1, DW.rune);
    p.rect(1, 4, 14, 8, DW.dark);
    p.ellipse(8, 9, 6, 2, DW.shroudD); p.ellipse(7.5, 8.5, 5.5, 1.6, DW.shroud); p.ellipse(3, 8.5, 1.8, 1.5, DW.shroud);
    p.rect(1, 12, 14, 1, DW.hi); p.rect(2, 14, 12, 1, DW.rune);
  };
  P.nicheGearStone = function (p, r, f, v) { P.nicheStone(p, r, f, v); p.ellipse(9, 8, 2.4, 2.2, '#8a8a98'); p.ring(9, 8, 2.4, 2.2, '#e8e8f4'); p.set(9, 7, f & 1 ? '#F8F8F8' : '#F8D878'); };
  P.bier = function (p) { // the king's chamber: a cut slab on a plinth, and nobody on it
    dwFloor(p);
    p.rect(1, 5, 14, 9, '#3a3a44'); p.rect(2, 3, 12, 8, '#8a8a96'); p.rect(2, 3, 12, 1, '#b0b0bc'); p.rect(3, 4, 10, 6, '#7a7a86');
    p.frame(3, 4, 10, 6, '#6a6a76'); p.rect(1, 13, 14, 1, DW.brick);
  };
  P.tombLamp = function (p, r, f) {
    dwFloor(p);
    p.rect(7, 6, 2, 9, '#2a2a30'); p.rect(5, 14, 6, 1, '#2a2a30');
    p.rect(5, 2, 6, 5, '#1a1a20'); p.rect(6, 3, 4, 3, f & 1 ? '#F8D878' : '#FCA044'); p.set(8, 1, '#2a2a30');
  };
  P.dryStair = function (p, r) { // the water stair, pumped dry: steps still dark with it, silt in the corners
    base(p, '#3a3a46');
    for (var y = 0; y < 16; y += 4) { p.rect(0, y, 16, 3, '#56566a'); p.rect(0, y + 3, 16, 1, '#23232c'); p.rect(0, y, 16, 1, '#6a6a80'); }
    p.speckle(0, 0, 16, 16, '#2a3a48', 0.12, r); p.rect(0, 14, 3, 2, '#6a6a5a'); p.rect(13, 6, 3, 1, '#6a6a5a');
  };
  P.sealCut = function (p, r) { // the warranted door, cut through with a chisel by a man who thought it was carpentry
    base(p, '#30303a');
    p.rect(3, 1, 10, 15, DW.dark); p.rect(1, 1, 2, 15, '#5a5a66'); p.rect(13, 1, 2, 15, '#5a5a66');
    p.line(1, 5, 3, 7, N(0x21)); p.set(13, 9, N(0x21)); p.set(14, 3, N(0x21));
    p.line(3, 2, 5, 4, '#9a9aa2'); p.line(11, 12, 13, 14, '#9a9aa2');
  };
  P.ironBars = function (p) { // the garrison's iron across a cut door: a lock instead of a promise
    P.sealCut(p, DS.mulberry32(3));
    for (var x = 3; x < 14; x += 3) p.rect(x, 1, 1, 15, '#8a8a92');
    p.rect(2, 4, 12, 2, '#6a6a72'); p.rect(2, 11, 12, 2, '#6a6a72'); p.rect(7, 7, 3, 3, '#3a3a42'); p.set(8, 8, '#c0a040');
  };
  P.puddle = function (p, r, f) { // the keeper: a hand's depth of water that can't leave itself
    dwFloor(p);
    p.ellipse(8, 9, 7, 4.5, '#123040'); p.ellipse(8, 9, 5.5, 3.2, '#1a4050');
    p.rect(3 + (f * 2) % 8, 8, 3, 1, '#2a6a80'); p.set(10 - (f % 3), 11, '#3a8aa0');
    if (f === 2) { p.set(7, 7, '#a4e4fc'); p.set(8, 6, '#a4e4fc'); }
  };
  P.steps = function (p) { base(p, '#4a4a56'); for (var y = 0; y < 16; y += 4) { p.rect(0, y, 16, 3, '#6e6e7a'); p.rect(0, y, 16, 1, '#8a8a96'); p.rect(0, y + 3, 16, 1, '#2a2a32'); } };
  P.sunshaft = function (p, r, f) { // noon down the old main shaft: the floor there warm and pale; the beam itself is drawn over it
    base(p, '#86847a');
    for (var y = 0; y < 16; y += 8) for (var x = 0; x < 16; x += 8) { p.frame(x, y, 8, 8, '#727066'); p.set(x + 1, y + 1, '#a4a194'); }
    p.set((f * 5 + 3) % 16, (f * 7 + 2) % 16, '#c8c2a8');
  };
  P.race = function (p, r, f) { // the race off the falls, down the shaft wall: silvered with spray, and with the silver in the stone
    base(p, '#2a2a34'); p.rect(2, 0, 12, 16, '#4a6a88'); p.rect(3, 0, 10, 16, '#6a8aa8');
    for (var i = 0; i < 9; i++) { var x = 3 + (i * 5) % 10, y = (i * 7 + f * 4) % 16; p.rect(x, y, 1, 3, '#dce8f4'); }
    p.rect(0, 0, 2, 16, '#44444e'); p.rect(14, 0, 2, 16, '#44444e'); p.set(0, (f * 5) % 16, '#c8c8d8'); p.set(15, (f * 5 + 8) % 16, '#c8c8d8');
  };
  P.footbridge = function (p, r, f) { // a dressed slab across the race, an iron rail either side
    P.race(p, r, f);
    p.rect(0, 2, 16, 12, '#6e6e7a'); p.rect(0, 2, 16, 1, '#8a8a96'); p.rect(0, 13, 16, 1, '#30303a');
    for (var x = 0; x < 16; x += 8) p.frame(x, 3, 8, 10, '#5a5a66');
    p.rect(0, 1, 16, 1, '#2a2a30'); p.rect(0, 14, 16, 1, '#2a2a30');
  };
  P.wheel = function (p, r, f) { // the stamp-mill wheel: it still turns, because the covenant says the fountains run
    base(p, N(0x12)); p.rect(0, 12, 16, 4, N(0x21));
    p.ring(8, 8, 6.5, 6.5, C.woodD); p.ring(8, 8, 5.5, 5.5, C.wood);
    for (var k = 0; k < 4; k++) { var a = (k / 4 + f / 16) * Math.PI * 2; p.line(8, 8, 8 + Math.cos(a) * 6, 8 + Math.sin(a) * 6, C.woodD); p.rect(Math.round(8 + Math.cos(a) * 6.5) - 1, Math.round(8 + Math.sin(a) * 6.5) - 1, 2, 2, C.woodL); }
    p.rect(7, 7, 2, 2, '#2a2a30');
  };
  P.vaultIn = function (p) { // the vault door, from inside: swung back on its pin
    dwFloor(p); p.rect(0, 0, 16, 3, '#26262e');
    p.ellipse(3, 8, 3, 7, '#6a6a76'); p.ellipse(3, 8, 2, 6, '#8a8a96'); p.set(3, 8, '#c0a040');
    p.rect(6, 0, 10, 3, '#9a9a88'); p.dither(6, 3, 10, 4, '#9a9a88', 0);
  };
  P.throne = function (p) { // the high seat of the Silversands: empty most days; he stands at the door
    dwFloor(p);
    p.rect(3, 1, 10, 9, '#3a3a44'); p.rect(4, 2, 8, 7, '#6e6e7a'); p.rect(2, 8, 12, 5, '#5a5a66'); p.rect(4, 9, 8, 3, '#7a7a86');
    p.rect(3, 12, 10, 2, '#30303a'); p.set(8, 3, '#c0a040'); p.set(7, 4, '#c0a040'); p.set(9, 4, '#c0a040');
  };
  P.oathStone = function (p) {
    dwFloor(p); p.ellipse(8, 14, 6, 1.5, DW.brick);
    p.rect(5, 1, 6, 13, '#6a6a76'); p.rect(5, 1, 2, 13, '#8a8a96'); p.rect(5, 6, 6, 2, '#44444e');
    for (var y = 2; y < 13; y += 3) p.set(9, y, '#c0a040');
  };
  P.nameWall = function (p, r, f, v) { // the hero-wall: the highway's dead, names in rows
    dwFace(p);
    for (var y = 2; y < 14; y += 3) for (var x = 1; x < 15; x += 1) if ((x * 7 + y * 3 + v) % 5 < 3) p.set(x, y, DW.rune);
    if (v === 2) p.rect(9, 11, 6, 1, '#26262e');
  };
  P.anvil = function (p) {
    dwFloor(p);
    p.rect(2, 5, 12, 3, '#3a3a44'); p.rect(1, 5, 3, 2, '#3a3a44'); p.rect(2, 5, 12, 1, '#8a8a96');
    p.rect(6, 8, 4, 4, '#2a2a30'); p.rect(4, 12, 8, 2, '#2a2a30');
  };
  P.forge = function (p, r, f) {
    base(p, '#44444e'); p.frame(0, 0, 16, 16, '#26262e');
    p.rect(2, 5, 12, 10, '#16161c'); p.rect(3 + (f & 1), 10, 10, 4, N(0x16)); p.rect(5, 8 - (f & 1), 6, 4, N(0x27)); p.rect(7, 11, 2, 2, N(0x38));
    p.rect(1, 2, 14, 2, '#6e6e7a');
  };
  P.furnace = function (p) { // the smelters: cold
    base(p, '#3a3a44'); p.rect(2, 0, 12, 16, '#4a4a56'); p.rect(2, 0, 2, 16, '#5a5a66');
    p.ellipse(8, 11, 4, 4, '#16161c'); p.rect(4, 11, 8, 4, '#16161c'); p.set(6, 13, '#4a3a2a'); p.set(9, 14, '#4a3a2a');
    p.rect(1, 15, 14, 1, '#26262e');
  };
  P.cupel = function (p) { // the cupel hearth: bone-ash, where silver is parted from lead
    dwFloor(p);
    p.ellipse(8, 9, 7, 4.5, '#3a3a44'); p.ellipse(8, 8.5, 5.5, 3.2, '#d8d0c0'); p.ellipse(8, 8.5, 3, 1.6, '#b8b0a0'); p.set(8, 8, '#e8e8f0');
  };
  P.dcounter = function (p) { // a dressed-stone counter on a stone floor
    dwFloor(p);
    p.rect(0, 2, 16, 10, '#4a4a56'); p.rect(0, 2, 16, 3, '#7a7a86'); p.rect(0, 5, 16, 1, '#26262e'); p.rect(0, 11, 16, 1, '#30303a');
  };
  P.dtable = function (p) { // a sorting table: a stone top on two legs
    dwFloor(p);
    p.rect(1, 4, 14, 6, '#6e6e7a'); p.rect(1, 4, 14, 1, '#8a8a96'); p.rect(2, 10, 2, 4, '#30303a'); p.rect(12, 10, 2, 4, '#30303a');
    p.set(5, 6, '#9a9aa8'); p.set(9, 7, '#c0a040'); p.set(11, 6, '#9a9aa8');
  };
  P.scales = function (p, r) { // the assay-scales, under a cloth, on the trade-counter
    P.dcounter(p);
    p.poly([[3, 2], [13, 2], [14, 10], [2, 10]], '#9a9080'); p.line(3, 2, 13, 2, '#b8ae9c'); p.line(8, 0, 8, 2, '#c0a040');
    p.set(5, 9, '#7a7060'); p.set(11, 9, '#7a7060');
  };
  P.lockCase = function (p) { // the standard weights, locked
    dwFloor(p);
    p.rect(2, 3, 12, 10, '#3a3a44'); p.rect(3, 4, 10, 8, '#5a5a66'); p.rect(3, 4, 10, 1, '#7a7a86');
    [[5, 7], [8, 7], [11, 7]].forEach(function (w, i) { p.rect(w[0] - 1, w[1] + 2 - i, 2, 2 + i, '#c0a040'); });
    p.rect(7, 11, 2, 2, '#16161c'); p.set(7, 11, '#c0a040');
  };
  P.rack = function (p) {
    dwFace(p);
    p.rect(1, 4, 14, 1, C.woodD); p.rect(1, 11, 14, 1, C.woodD);
    [3, 7, 11].forEach(function (x, i) { p.rect(x, 2, 1, 12, C.wood); if (i === 1) p.rect(x - 2, 2, 5, 3, '#8a8a96'); else p.poly([[x + 1, 3], [x + 3, 2], [x + 3, 7], [x + 1, 6]], '#a8a8b4'); });
  };
  P.vat = function (p) {
    dwFloor(p); p.ellipse(8, 13, 7, 2, DW.brick);
    p.rect(2, 3, 12, 11, C.woodD); p.ellipse(8, 3, 6, 2, C.wood); p.ellipse(8, 3, 4.5, 1.2, '#6a4a1a');
    p.rect(2, 6, 12, 1, '#6a6a72'); p.rect(2, 11, 12, 1, '#6a6a72');
  };
  P.smokeRack = function (p) {
    dwFloor(p);
    p.rect(1, 2, 14, 1, C.woodD); p.rect(1, 2, 1, 13, C.woodD); p.rect(14, 2, 1, 13, C.woodD);
    [[4, 3], [8, 3], [12, 3]].forEach(function (m) { p.ellipse(m[0], m[1] + 5, 1.6, 4, '#7a3a1a'); p.ellipse(m[0] - 0.5, m[1] + 4, 1, 2.5, '#a05a2a'); p.set(m[0], m[1], C.woodL); });
  };
  P.boarded = function (p) { // the trade hall: boarded, from the dwarves' side
    base(p, '#30303a'); p.rect(2, 1, 12, 15, '#1a1a20');
    [[1, 4], [1, 9], [1, 13]].forEach(function (b, i) { p.line(b[0], b[1] + (i & 1), 14, b[1] - 1 + (i & 1) * 2, C.wood, 2); });
    p.set(3, 4, '#9a9aa2'); p.set(12, 9, '#9a9aa2'); p.set(7, 13, '#9a9aa2');
  };
  P.ledgerDesk = function (p) {
    dwFloor(p);
    p.rect(1, 4, 14, 9, C.woodD); p.rect(1, 4, 14, 2, C.wood);
    p.rect(3, 5, 10, 5, '#e8dcc0'); p.rect(8, 5, 1, 5, '#b8a888'); for (var y = 6; y < 10; y += 1) { p.rect(4, y, 3, 1, (y & 1) ? '#8a7a60' : '#e8dcc0'); p.rect(9, y, 3, 1, (y & 1) ? '#8a7a60' : '#e8dcc0'); }
    p.set(13, 5, '#101018'); p.set(13, 4, '#6a4a2a');
  };
  P.tariff = function (p) { // the tariff board: prices in a dead currency
    dwFace(p);
    p.rect(1, 2, 14, 11, C.woodD); p.rect(2, 3, 12, 9, '#2a2a22');
    for (var y = 4; y < 11; y += 2) { p.rect(3, y, 5, 1, '#d8d0b8'); p.rect(10, y, 3, 1, '#c0a040'); }
  };
  P.shaftTop = function (p, r, f) { // the top of the old main shaft: the mountain's face, and the sky
    base(p, '#8ab8e8'); p.rect(0, 10, 16, 6, '#b8d8f0'); p.dither(0, 8, 16, 4, '#b8d8f0', 0);
    p.rect(0, 0, 2, 16, '#6a6a76'); p.rect(14, 0, 2, 16, '#6a6a76'); p.set(6 + (f & 1), 4, '#F8F8F8'); p.set(10, 6, '#F8F8F8');
  };
  P.cot = function (p) { dwFloor(p); p.rect(2, 2, 12, 12, C.woodD); p.rect(3, 3, 10, 3, '#b8b4a8'); p.rect(3, 6, 10, 7, '#6a6a4a'); p.rect(3, 6, 10, 1, '#8a8a5a'); };
  P.brick = function (p) { // the old dwarven cut the shaft crew broke into: bricked, marked
    dwFace(p);
    for (var y = 3; y < 13; y += 3) for (var x = (y % 2) * 2; x < 16; x += 4) p.rect(x, y, 3, 2, '#7a5a4a');
    p.line(4, 4, 12, 12, '#c83030'); p.line(12, 4, 4, 12, '#c83030');
  };
  // --- the highway to Deepholm (spec §6)
  function rawFace(p) { P.caveWall(p, DS.mulberry32(11), 0, 0, { downFloor: true }); }
  P.lampTower = function (p, r, f) { // a station's lamp, lit: the road has a day's end here
    P.caveFloor(p, r); p.ellipse(8, 14, 6, 1.6, '#2a221e');
    p.rect(6, 5, 4, 10, '#44444e'); p.rect(6, 5, 1, 10, '#6e6e7a'); p.rect(4, 13, 8, 2, '#30303a');
    p.rect(3, 0, 10, 6, '#26262e'); p.rect(4, 1, 8, 4, f & 1 ? '#F8E0A0' : '#F8C860'); p.rect(5, 2, 6, 2, '#FFF8E0'); p.rect(3, 0, 10, 1, '#6e6e7a');
  };
  P.lampTowerDark = function (p, r) { // a station's lamp, gone dark
    P.caveFloor(p, r); p.ellipse(8, 14, 6, 1.6, '#2a221e');
    p.rect(6, 5, 4, 10, '#3a3a44'); p.rect(4, 13, 8, 2, '#26262e');
    p.rect(3, 0, 10, 6, '#1a1a20'); p.rect(4, 1, 8, 4, '#2a2a30'); p.set(6, 2, '#4a4a52'); p.set(10, 3, '#3a3a42');
  };
  P.sealWhole = function (p, r, f) { // a warranted wall across a small connection: dressed stone set in the raw, its rune whole
    rawFace(p);
    p.rect(2, 2, 12, 12, '#44444e'); p.frame(2, 2, 12, 12, '#26262e'); p.rect(3, 3, 10, 1, '#5a5a66');
    var g = f & 1 ? '#B8C8E8' : '#8898B8'; p.ring(8, 8, 3, 3, g); p.set(8, 4, g); p.set(8, 12, g); p.set(4, 8, g); p.set(12, 8, g);
  };
  P.sealBroken = function (p, r) { // a warranted wall breached from the far side: the runes in pieces on the floor
    P.caveFloor(p, r);
    p.rect(0, 0, 2, 16, '#44444e'); p.rect(14, 0, 2, 16, '#44444e'); p.rect(2, 0, 3, 3, '#44444e'); p.rect(11, 0, 3, 4, '#44444e');
    [[4, 10], [9, 12], [11, 7], [6, 14]].forEach(function (q) { p.rect(q[0], q[1], 2, 2, '#5a5a66'); p.set(q[0], q[1], '#8898B8'); });
  };
  P.vein = function (p, r, f) { // the seam the seals were driven through: truesilver in the rock
    rawFace(p);
    p.line(0, 11, 16, 5, '#8a8a9a', 2); p.line(3, 13, 12, 9, '#9a9aa8');
    p.set(5, 9, f & 1 ? '#FFFFFF' : '#D8E0F0'); p.set(11, 6, f & 1 ? '#D8E0F0' : '#FFFFFF'); p.set(8, 8, '#C8D0E8');
  };
  P.chasm = function (p, r) { base(p, '#050508'); p.speckle(0, 0, 16, 16, '#0c0c14', 0.12, r); p.set(r() * 16 | 0, r() * 16 | 0, '#1a1a26'); };
  P.rubble = function (p, r) { P.caveFloor(p, r); for (var i = 0; i < 6; i++) { var x = r() * 13 | 0, y = r() * 13 | 0; p.rect(x, y, 3, 2, '#6c5a4c'); p.set(x, y, '#8a7a6a'); } };
  P.bodyCaptain = function (p, r) { // a garrison captain where the raid left him
    P.dwarfFloor(p);
    p.ellipse(8, 10, 6, 3, '#4a5058'); p.ellipse(7, 9, 5, 2, '#5a6068'); p.ellipse(3, 9, 2, 2, '#d8a078'); p.rect(1, 8, 2, 3, '#6a3a1a');
    p.rect(9, 11, 5, 1, '#d8d8e8'); p.set(13, 11, '#6a4a8a'); p.rect(4, 13, 6, 1, '#5a1a1a');
  };
  // --- Deepholm's door (spec §6.4): the first dressed stone in three days, and a light that isn't a lamp
  P.madeRoad = function (p) { base(p, '#6a6a74'); for (var y = 0; y < 16; y += 4) { var o = (y >> 2) & 1 ? 4 : 0; for (var x = -o; x < 16; x += 8) { p.frame(x, y, 8, 4, '#56565e'); p.rect(x + 1, y + 1, 6, 1, '#7e7e88'); } } };
  P.deepDoor = function (p, r, f, v) { // a door the height of three men, and under it, light
    base(p, '#3a3a44'); p.rect(1, 0, 14, 16, '#54545e'); p.rect(1, 0, 14, 1, '#6e6e7a');
    p.rect(7, 0, 2, 16, '#26262e'); p.set(4, 5 + v, '#c0a040'); p.set(11, 5 + v, '#c0a040');
    for (var y = 2; y < 16; y += 5) { p.rect(2, y, 5, 1, '#44444e'); p.rect(9, y, 5, 1, '#44444e'); }
  };
  P.deepDoorSill = function (p, r, f) { P.deepDoor(p, r, f, 0); p.rect(1, 14, 14, 2, f & 1 ? '#F8E0A0' : '#F8D080'); p.rect(3, 13, 10, 1, '#c8a060'); };
  P.grille = function (p, r) { // the toll-grille, and a counter under it
    P.dcounter(p, r);
    for (var x = 1; x < 16; x += 3) p.rect(x, 0, 1, 5, '#8a8a92');
    p.rect(0, 0, 16, 1, '#6a6a72');
  };
  P.bench = function (p) { P.madeRoad(p); p.rect(1, 6, 14, 4, '#5a4a3a'); p.rect(1, 6, 14, 1, '#7a6a4a'); p.rect(2, 10, 2, 4, '#3a2a1a'); p.rect(12, 10, 2, 4, '#3a2a1a'); };
  P.tariffLive = function (p) { P.tariff(p); p.rect(10, 4, 3, 1, '#F8D878'); p.rect(10, 8, 3, 1, '#F8D878'); };
  P.lift = function (p, r, f) { // the wheelwright's lift: a platform on chains, up and down the shaft
    P.dwarfFloor(p); p.rect(1, 2, 14, 12, '#6a4a2a'); p.rect(1, 2, 14, 2, '#8a6a3a'); p.frame(1, 2, 14, 12, '#3a2a1a');
    p.rect(3, 0, 1, 3, '#9a9aa2'); p.rect(12, 0, 1, 3, '#9a9aa2'); p.rect(6, 7, 4, 2, '#c0a040');
  };
  P.portcullisUp = function (p) { // raised into the old ore-chute: a dark slot overhead and the iron teeth just showing
    dwFloor(p);
    p.rect(0, 6, 16, 4, '#1a1a20'); p.rect(0, 6, 16, 1, '#30303a');
    for (var x = 1; x < 16; x += 3) { p.rect(x, 8, 1, 3, '#7a7a82'); p.set(x, 11, '#9a9aa2'); }
  };
  P.emptyCut = function (p) { dwFace(p); p.rect(3, 3, 10, 9, DW.dark); p.rect(3, 3, 10, 1, DW.brick); p.rect(3, 12, 10, 1, DW.hi); }; // the Dormant's: nothing in it

  // ------------------------------------------------------------------ tile table
  // pass: walkable. anim: frames. talk: can talk across (counters). auto: neighbour-aware.
  var TILES = DS.TILES = {
    grass: { pass: 1 }, plains: { pass: 1 }, flowers: { pass: 1 }, forest: { pass: 1, vars: 2 }, hills: { pass: 1 }, gnollhills: { pass: 1 },
    mountain: { pass: 0, vars: 4 }, peak: { pass: 0 }, range: { pass: 0 }, sea: { pass: 0, anim: 4 }, water: { pass: 0, anim: 4 },
    bog: { pass: 1, anim: 4 }, road: { pass: 1 }, bridge: { pass: 1 }, bridgeV: { pass: 1 }, farm: { pass: 1 }, wheat: { pass: 1 },
    gulch: { pass: 1 }, web: { pass: 1 }, webtree: { pass: 0 }, sand: { pass: 1 }, cliff: { pass: 0 }, snowfield: { pass: 1 }, dirtpath: { pass: 1 },
    town: { pass: 1 }, silverton: { pass: 1 }, cave: { pass: 1 }, camp: { pass: 1 }, inn: { pass: 1 }, tower: { pass: 0 }, signpost: { pass: 0 }, hamlet: { pass: 1 },
    cobble: { pass: 1 }, dirt: { pass: 1 }, tree: { pass: 0 }, roofR: { pass: 0, auto: 'roof' }, roofB: { pass: 0, auto: 'roof' }, roofS: { pass: 0, auto: 'roof' },
    wall: { pass: 0 }, wallWin: { pass: 0 }, door: { pass: 1 }, shopdoor: { pass: 1 }, doorShut: { pass: 0 }, stonewall: { pass: 0 }, edifice: { pass: 0 }, edificeArch: { pass: 0 },
    pillar: { pass: 0 }, vault: { pass: 0 }, fountain: { pass: 0, anim: 2 }, channel: { pass: 0, anim: 4 }, falls: { pass: 0, anim: 4 }, fence: { pass: 0 },
    stockade: { pass: 0 }, lamp: { pass: 0, anim: 2 }, well: { pass: 0 }, stall: { pass: 0, vars: 4, talk: 1 }, crate: { pass: 0, vars: 2 }, headframe: { pass: 0 },
    tent: { pass: 0 }, sandArena: { pass: 1 }, hexwall: { pass: 0 }, hexwallRed: { pass: 0 }, floorWood: { pass: 1 }, floorStone: { pass: 1 }, rug: { pass: 1 },
    counter: { pass: 0, talk: 1 }, bar: { pass: 0, talk: 1 }, table: { pass: 0 }, stairsUp: { pass: 1 }, stairsDown: { pass: 1 }, bed: { pass: 0 },
    shelf: { pass: 0 }, hearth: { pass: 0, anim: 2 }, boxes: { pass: 0 }, void: { pass: 0 }, darkfloor: { pass: 1 }, curtain: { pass: 0 },
    caveFloor: { pass: 1 }, caveWall: { pass: 0, auto: 'wall' }, timber: { pass: 0 }, rails: { pass: 1 }, railsH: { pass: 1 }, pool: { pass: 0, anim: 4 },
    deep: { pass: 0, anim: 4 }, ooze: { pass: 1 }, guano: { pass: 1 }, guanoDeep: { pass: 1 }, webFloor: { pass: 1 }, dwarfFloor: { pass: 1 },
    dwarfWall: { pass: 0, auto: 'wall' }, runeWall: { pass: 0, anim: 2 }, sealDoor: { pass: 0, anim: 2 }, drownStair: { pass: 0, anim: 4 }, ladder: { pass: 1 },
    holeDown: { pass: 1 }, lantern: { pass: 0, anim: 2 }, cradle: { pass: 0 }, gate: { pass: 0 }, bones: { pass: 1 }, stalag: { pass: 0 }, fungus: { pass: 1, anim: 2 },
    gravel: { pass: 1 }, minecart: { pass: 0 }, crateCave: { pass: 0, vars: 2 }, glowmoss: { pass: 1, anim: 2 }, chimney: { pass: 0 }, flatstone: { pass: 1 },
    reeds: { pass: 1 }, dock: { pass: 1, anim: 4 }, grassT: { pass: 1 },
    gateOpen: { pass: 1 }, noticeboard: { pass: 0 }, cocoon: { pass: 0, anim: 2 },
    // the dwarven expansion
    niche: { pass: 0, vars: 3 }, nicheGear: { pass: 0, anim: 2, vars: 1 }, nicheOpen: { pass: 0, vars: 1 }, nicheStone: { pass: 0, vars: 1 }, nicheGearStone: { pass: 0, anim: 2, vars: 1 },
    bier: { pass: 0, vars: 1 }, tombLamp: { pass: 0, anim: 2, vars: 1 }, dryStair: { pass: 1, vars: 2 }, sealCut: { pass: 1, vars: 1 }, ironBars: { pass: 0, vars: 1 },
    puddle: { pass: 0, anim: 4, vars: 1 }, steps: { pass: 1, vars: 1 }, sunshaft: { pass: 1, anim: 2, vars: 1 }, race: { pass: 0, anim: 4, vars: 1 }, footbridge: { pass: 1, anim: 4, vars: 1 }, wheel: { pass: 0, anim: 4, vars: 1 },
    vaultIn: { pass: 1, vars: 1 }, throne: { pass: 0, vars: 1 }, oathStone: { pass: 0, vars: 1 }, nameWall: { pass: 0, vars: 3 }, anvil: { pass: 0, vars: 1 },
    forge: { pass: 0, anim: 2, vars: 1 }, furnace: { pass: 0, vars: 1 }, cupel: { pass: 0, vars: 1 }, scales: { pass: 0, talk: 1, vars: 1 }, dcounter: { pass: 0, talk: 1, vars: 1 }, dtable: { pass: 0, vars: 1 }, lockCase: { pass: 0, vars: 1 },
    rack: { pass: 0, vars: 1 }, vat: { pass: 0, vars: 1 }, smokeRack: { pass: 0, vars: 1 }, boarded: { pass: 0, vars: 1 }, ledgerDesk: { pass: 0, talk: 1, vars: 1 },
    tariff: { pass: 0, vars: 1 }, emptyCut: { pass: 0, vars: 1 }, portcullisUp: { pass: 1, vars: 1 },
    lampTower: { pass: 0, anim: 2, vars: 1 }, lampTowerDark: { pass: 0, vars: 1 }, sealWhole: { pass: 0, anim: 2, vars: 1 }, sealBroken: { pass: 1, vars: 1 }, vein: { pass: 0, anim: 2, vars: 1 },
    chasm: { pass: 0 }, rubble: { pass: 1 }, bodyCaptain: { pass: 0, vars: 1 },
    madeRoad: { pass: 1, vars: 1 }, lift: { pass: 1, vars: 1 }, deepDoor: { pass: 0, vars: 1 }, deepDoorSill: { pass: 0, anim: 2, vars: 1 }, grille: { pass: 0, talk: 1, vars: 1 }, bench: { pass: 0, vars: 1 }, tariffLive: { pass: 0, vars: 1 }, shaftTop: { pass: 0, anim: 2, vars: 1 }, cot: { pass: 0, vars: 1 }, brick: { pass: 0, vars: 1 }
  };
  var tileCache = {};
  // variant v, anim frame f, neighbour-key nk ('' when not auto)
  DS.tileCanvas = function (id, v, f, nb) {
    var t = TILES[id] || TILES.void;
    var nv = t.vars || 4; v = v % nv;
    var nf = t.anim || 1; f = f % nf;
    var nk = '';
    if (t.auto === 'roof' && nb) nk = (nb.up ? 1 : 0) + '' + (nb.down ? 1 : 0) + (nb.left ? 1 : 0) + (nb.right ? 1 : 0);
    if (t.auto === 'wall' && nb) nk = (nb.downFloor ? 1 : 0) + '' + (nb.upFloor ? 1 : 0);
    var key = id + ':' + v + ':' + f + ':' + nk;
    if (tileCache[key]) return tileCache[key];
    var p = new Pix(16, 16);
    var rng = DS.mulberry32(DS.hash(id) + v * 7919);
    (P[id] || P.void)(p, rng, f, v, nb);
    return (tileCache[key] = p.canvas());
  };
  DS.TILE_PAINTERS = P;
})();
