/* DRAGONSLEEP — monster painters. Every creature is drawn from shapes in code, facing right
   (toward the party). Sizes: small 32, medium 48, large 64. */
'use strict';
(function () {
  var DS = window.DS, Pix = DS.Pix, N = DS.N;
  var INK = '#101018';
  var A = {};

  function eye(p, x, y, c) { p.set(x, y, c || '#f83800'); }
  function shadeBelow(p, cy, c) { p.shadeWhere(function (x, y) { return y > cy; }, c); }

  A.rat = function () {
    var p = new Pix(32, 24);
    p.line(2, 18, 9, 16, '#c08080'); p.line(0, 20, 3, 18, '#c08080');
    p.ellipse(14, 15, 9, 6, '#6a5a50'); p.ellipse(13, 13, 8, 4, '#8a7a70');
    p.ellipse(23, 13, 5, 4, '#6a5a50'); p.tri(26, 11, 31, 14, 26, 16, '#6a5a50'); p.set(31, 14, '#f0a0a0');
    p.ellipse(21, 9, 2, 2.5, '#8a7a70'); p.set(21, 9, '#e0a0a0');
    eye(p, 26, 12);
    [[9, 20], [13, 21], [17, 21], [21, 19]].forEach(function (l) { p.rect(l[0], l[1], 2, 2, '#4a3a30'); });
    p.set(29, 16, '#e8e8e8');
    return p.outline(INK);
  };
  A.ratswarm = function () {
    var p = new Pix(48, 36), r = A.rat();
    p.blit(r, 0, 12); p.blit(r, 16, 2); p.blit(r, 14, 14); p.blit(r.flipH(), 22, 20);
    return p;
  };
  A.darkmantle = function () {
    var p = new Pix(32, 32);
    p.ellipse(16, 10, 10, 8, '#3a3048'); p.ellipse(15, 8, 8, 5, '#5a4868');
    for (var i = 0; i < 6; i++) { var x = 7 + i * 3.6; p.line(x, 14, x + (i % 2 ? 2 : -2), 28, '#3a3048', 2); p.set(x + (i % 2 ? 2 : -2), 29, '#5a4868'); }
    p.set(19, 11, '#f8d878'); p.set(22, 10, '#f8d878');
    p.line(10, 6, 14, 4, '#7a6888');
    return p.outline(INK);
  };
  A.crawler = function () { // the Warrens' milked beasts — a segmented, many-legged carrion eater
    var p = new Pix(56, 48);
    var segs = [[8, 34, 6], [14, 30, 7], [21, 27, 7.5], [28, 25, 8], [35, 24, 8], [41, 22, 7.5]];
    segs.forEach(function (s, i) {
      p.ellipse(s[0], s[1], s[2], s[2] - 1, '#5a7a4a');
      p.ellipse(s[0] - 1, s[1] - 2, s[2] - 2, s[2] - 3.5, '#7a9a5a');
      p.line(s[0] - 2, s[1] + s[2] - 2, s[0] - 4, s[1] + s[2] + 3, '#3a4a2a', 1);
      p.line(s[0] + 2, s[1] + s[2] - 2, s[0] + 3, s[1] + s[2] + 3, '#3a4a2a', 1);
    });
    p.ellipse(47, 20, 6, 6, '#6a8a5a'); p.ellipse(46, 18, 4, 4, '#8aaa6a');
    for (var t = 0; t < 8; t++) { var a = -0.9 + t * 0.26; p.line(50, 22, 50 + Math.cos(a) * 7, 22 + Math.sin(a) * 12 + 2, '#c8b8d0'); }
    eye(p, 48, 17, '#f8f8a0'); eye(p, 45, 16, '#f8f8a0');
    return p.outline(INK);
  };
  A.grayooze = function () {
    var p = new Pix(44, 28);
    p.ellipse(22, 18, 20, 9, '#5a5a62'); p.ellipse(18, 14, 12, 7, '#6a6a74'); p.ellipse(30, 16, 8, 5, '#6a6a74');
    p.ellipse(15, 12, 4, 2, '#8a8a94'); p.set(28, 13, '#9a9aa4'); p.set(12, 20, '#4a4a52'); p.set(33, 21, '#4a4a52');
    p.ellipse(26, 18, 2, 1.5, '#3a3a42');
    return p.outline(INK);
  };
  A.ochrejelly = function () {
    var p = new Pix(52, 32);
    p.ellipse(26, 21, 24, 10, '#b88818'); p.ellipse(22, 16, 15, 9, '#d8a828'); p.ellipse(36, 18, 9, 6, '#d8a828');
    p.ellipse(18, 12, 5, 3, '#f8d878'); p.set(34, 15, '#f8e8a0');
    p.speckle(4, 14, 44, 14, '#a07010', 0.06, DS.mulberry32(3));
    return p.outline(INK);
  };
  A.otyugh = function () {
    var p = new Pix(64, 60);
    p.ellipse(30, 38, 20, 17, '#6a6a3a'); p.ellipse(28, 34, 16, 12, '#8a8a4a');
    p.speckle(12, 24, 36, 28, '#5a5a2a', 0.1, DS.mulberry32(9));
    // three stubby legs
    p.rect(14, 50, 7, 8, '#5a5a2a'); p.rect(28, 52, 7, 7, '#5a5a2a'); p.rect(40, 50, 7, 8, '#5a5a2a');
    // mouth
    p.ellipse(40, 40, 8, 6, '#3a1010'); for (var i = 0; i < 5; i++) { p.tri(34 + i * 3, 35, 36 + i * 3, 35, 35 + i * 3, 38, '#e8e8d0'); p.tri(34 + i * 3, 45, 36 + i * 3, 45, 35 + i * 3, 42, '#e8e8d0'); }
    // eye stalk
    p.line(26, 22, 30, 8, '#6a6a3a', 3); p.ellipse(31, 7, 4, 3, '#e8e0c0'); p.set(33, 7, INK); p.set(32, 7, '#a02020');
    // tentacles with spiked ends
    p.line(18, 30, 6, 10, '#5a5a2a', 3); p.ellipse(5, 8, 3, 3, '#7a7a3a'); p.set(2, 6, '#e8e8d0'); p.set(7, 5, '#e8e8d0');
    p.line(44, 28, 58, 14, '#5a5a2a', 3); p.ellipse(59, 12, 3, 3, '#7a7a3a'); p.set(62, 11, '#e8e8d0'); p.set(58, 9, '#e8e8d0');
    return p.outline(INK);
  };
  A.keeper = function () { // the flooded stair's warden — a coil of living water
    var p = new Pix(40, 60);
    p.ellipse(20, 54, 18, 5, '#123040'); p.ellipse(20, 53, 15, 3.5, '#1a4a60');
    for (var y = 52; y > 8; y--) {
      var t = (52 - y) / 44, cx = 20 + Math.sin(t * 5.2) * 8, r = 5.5 - t * 2.5;
      p.ellipse(cx, y, r, 1.2, t > 0.85 ? '#5ab0d8' : '#2a7aa8');
      p.set(Math.round(cx - r + 1), y, '#8ad0f0');
    }
    p.ellipse(22, 9, 6, 5, '#3a90c0'); p.ellipse(21, 8, 4, 3, '#8ad0f0');
    p.set(24, 8, '#f8f8f8'); p.set(20, 8, '#f8f8f8');
    p.set(6, 50, '#a4e4fc'); p.set(34, 49, '#a4e4fc'); p.set(10, 46, '#a4e4fc');
    return p.outline('#081820');
  };
  A.bat = function () {
    var p = new Pix(44, 30);
    p.poly([[22, 14], [4, 4], [8, 12], [2, 14], [8, 17], [4, 22], [22, 18]], '#4a3a3a');
    p.poly([[22, 14], [40, 4], [36, 12], [42, 14], [36, 17], [40, 22], [22, 18]], '#4a3a3a');
    p.line(22, 14, 6, 6, '#6a5a5a'); p.line(22, 14, 38, 6, '#6a5a5a');
    p.ellipse(22, 16, 4, 6, '#5a4848'); p.ellipse(24, 11, 3.5, 3, '#5a4848');
    p.tri(22, 9, 23, 5, 24, 9, '#5a4848'); p.tri(25, 9, 26, 5, 27, 9, '#5a4848');
    eye(p, 25, 11); p.set(26, 13, '#f8f8f8');
    return p.outline(INK);
  };
  A.batswarm = function () {
    var p = new Pix(48, 40), b = A.bat();
    var small = new Pix(22, 15);
    for (var y = 0; y < 15; y++) for (var x = 0; x < 22; x++) small.d[y * 22 + x] = b.d[(y * 2) * 44 + x * 2];
    [[0, 4], [20, 0], [12, 14], [26, 20], [2, 24], [24, 8]].forEach(function (q) { p.blit(small, q[0], q[1]); });
    return p;
  };
  A.stirge = function () {
    var p = new Pix(30, 24);
    p.poly([[14, 10], [3, 3], [6, 12]], '#6a3a3a'); p.poly([[14, 10], [22, 2], [18, 12]], '#8a4a4a');
    p.ellipse(13, 13, 5, 4, '#9a4a3a'); p.ellipse(18, 11, 3, 3, '#9a4a3a');
    p.line(20, 11, 29, 13, '#e8d8c8');
    [[10, 16], [13, 17], [16, 16]].forEach(function (l) { p.line(l[0], l[1], l[0] - 1, l[1] + 5, '#5a2a2a'); });
    eye(p, 19, 10, '#f8d878');
    return p.outline(INK);
  };
  A.cloaker = function () {
    var p = new Pix(64, 48);
    p.poly([[4, 20], [18, 6], [34, 4], [52, 10], [62, 22], [52, 30], [34, 34], [16, 32]], '#1a1a24');
    p.poly([[18, 10], [34, 8], [50, 13], [56, 22], [36, 20], [20, 20]], '#2a2a38');
    p.line(4, 20, 0, 34, '#1a1a24', 2); p.line(16, 32, 12, 44, '#1a1a24', 2);
    p.line(34, 34, 36, 46, '#2a2a38', 2); p.line(52, 30, 58, 42, '#1a1a24', 2);
    // bone claws along the leading edge
    [[18, 6], [34, 4], [52, 10]].forEach(function (c) { p.tri(c[0], c[1], c[0] + 3, c[1] - 4, c[0] + 4, c[1] + 1, '#e8e0d0'); });
    // face
    p.ellipse(44, 22, 7, 5, '#3a2a3a');
    eye(p, 42, 20, '#f83800'); eye(p, 47, 20, '#f83800'); p.set(42, 19, '#f87858'); p.set(47, 19, '#f87858');
    p.rect(42, 24, 6, 1, '#e8e0d0');
    // tail
    p.line(4, 20, -2, 22, '#1a1a24');
    return p.outline('#000000');
  };
  function spider(p, cx, cy, s, body, bodyL, leg) {
    for (var i = 0; i < 4; i++) {
      var ax = cx + (i - 1.5) * 4 * s;
      p.line(ax, cy, ax - 6 * s + i * 3 * s, cy - 7 * s, leg, s > 1 ? 2 : 1);
      p.line(ax - 6 * s + i * 3 * s, cy - 7 * s, ax - 9 * s + i * 5 * s, cy + 9 * s, leg, s > 1 ? 2 : 1);
    }
    p.ellipse(cx - 8 * s, cy + 1 * s, 9 * s, 7 * s, body); p.ellipse(cx - 9 * s, cy - 1 * s, 6 * s, 4 * s, bodyL);
    p.ellipse(cx + 5 * s, cy + 2 * s, 5 * s, 4 * s, body);
    eye(p, cx + 8 * s, cy + 1 * s); eye(p, cx + 7 * s, cy); p.set(cx + 9 * s, cy + 4 * s, '#e8e0d0');
  }
  A.spider = function () { var p = new Pix(48, 36); spider(p, 26, 20, 1.5, '#2a2a30', '#4a4a58', '#1a1a20'); p.set(12, 18, '#a02020'); p.set(14, 20, '#a02020'); return p.outline(INK); };
  A.wolfspider = function () { var p = new Pix(40, 28); spider(p, 22, 15, 1.1, '#6a4a2a', '#8a6a4a', '#4a3a2a'); return p.outline(INK); };
  A.ettercap = function () {
    var p = new Pix(40, 52);
    p.ellipse(18, 30, 9, 11, '#5a3a5a'); p.ellipse(17, 27, 7, 8, '#7a5a7a');
    p.ellipse(24, 14, 7, 6, '#6a4a6a'); p.ellipse(23, 12, 5, 4, '#8a6a8a');
    eye(p, 27, 12, '#f8f878'); eye(p, 25, 11, '#f8f878'); eye(p, 28, 14, '#f8f878');
    p.line(28, 18, 31, 22, '#e8e0d0'); p.line(26, 18, 27, 22, '#e8e0d0');
    p.line(20, 22, 34, 26, '#5a3a5a', 2); p.line(34, 26, 38, 34, '#5a3a5a', 2); p.tri(36, 34, 40, 34, 39, 38, '#e8e0d0');
    p.line(14, 24, 6, 32, '#5a3a5a', 2); p.line(6, 32, 4, 40, '#5a3a5a', 2);
    p.line(14, 38, 10, 50, '#4a2a4a', 2); p.line(22, 38, 26, 50, '#4a2a4a', 2);
    p.line(32, 30, 38, 44, '#d8d8e0'); p.line(38, 44, 30, 50, '#d8d8e0'); // a strand of silk
    return p.outline(INK);
  };
  A.gnoll = function () {
    var p = new Pix(36, 52);
    p.line(30, 4, 26, 50, '#8a5a2a', 2); p.tri(28, 0, 33, 0, 30, 7, '#c8c8d0');
    p.ellipse(15, 28, 7, 10, '#b08a50'); p.rect(9, 26, 12, 10, '#6a3a2a'); p.rect(9, 31, 12, 2, '#3a2a1a');
    p.rect(10, 38, 4, 12, '#9a7a40'); p.rect(17, 38, 4, 12, '#9a7a40'); p.rect(9, 48, 5, 3, INK); p.rect(17, 48, 5, 3, INK);
    p.ellipse(18, 12, 6, 6, '#b08a50'); p.poly([[20, 10], [30, 13], [30, 17], [20, 17]], '#9a7a40');
    p.tri(13, 7, 14, 1, 17, 7, '#8a6a3a'); p.tri(17, 6, 19, 0, 21, 6, '#8a6a3a');
    p.speckle(9, 6, 14, 30, '#6a4a2a', 0.12, DS.mulberry32(5));
    eye(p, 22, 11, '#f8d800'); p.rect(26, 17, 4, 1, '#e8e8d0');
    p.line(20, 22, 28, 26, '#b08a50', 3);
    return p.outline(INK);
  };
  A.hyena = function () {
    var p = new Pix(40, 28);
    p.ellipse(18, 14, 11, 6, '#a08050'); p.ellipse(14, 12, 8, 4, '#b89868');
    p.speckle(8, 9, 20, 10, '#6a5030', 0.18, DS.mulberry32(11));
    p.ellipse(30, 10, 5, 4, '#a08050'); p.poly([[32, 9], [39, 11], [38, 14], [32, 13]], '#8a6a40');
    p.tri(27, 7, 28, 2, 30, 7, '#8a6a40'); eye(p, 32, 9, '#f8d800');
    [[10, 19], [14, 19], [22, 19], [26, 18]].forEach(function (l) { p.rect(l[0], l[1], 2, 7, '#8a6a40'); });
    p.line(7, 12, 2, 16, '#8a6a40');
    return p.outline(INK);
  };
  A.wisp = function () {
    var p = new Pix(28, 28);
    p.ellipse(14, 14, 11, 11, '#1c3c7c'); p.ellipse(14, 14, 8, 8, '#3c7cd8'); p.ellipse(14, 14, 5, 5, '#a4e4fc'); p.ellipse(13, 13, 2.5, 2.5, '#fcfcfc');
    return p;
  };
  A.beetle = function () {
    var p = new Pix(36, 24);
    p.ellipse(16, 13, 12, 8, '#4a2a1a'); p.ellipse(15, 11, 10, 5, '#7a4a2a'); p.line(16, 5, 16, 20, '#2a1a0a');
    p.ellipse(28, 13, 4, 4, '#3a2010'); p.line(31, 11, 35, 8, '#3a2010'); p.line(31, 15, 35, 17, '#3a2010');
    p.ellipse(10, 10, 2, 1.5, '#f8b800'); p.ellipse(20, 10, 2, 1.5, '#f8b800'); p.set(10, 10, '#fcfcfc'); p.set(20, 10, '#fcfcfc');
    [[8, 20], [14, 21], [20, 20]].forEach(function (l) { p.line(l[0], l[1] - 2, l[0] - 2, l[1] + 2, '#2a1a0a'); });
    return p.outline(INK);
  };
  A.frog = function () {
    var p = new Pix(40, 28);
    p.ellipse(18, 18, 13, 8, '#3a6a2a'); p.ellipse(18, 15, 11, 6, '#5a8a3a'); p.ellipse(20, 21, 9, 4, '#b8c880');
    p.ellipse(28, 9, 4, 4, '#5a8a3a'); p.ellipse(20, 9, 4, 4, '#5a8a3a'); eye(p, 29, 8, INK); eye(p, 21, 8, INK); p.set(28, 7, '#f8f878');
    p.line(8, 22, 2, 26, '#3a6a2a', 2); p.line(28, 24, 34, 27, '#3a6a2a', 2); p.line(30, 14, 36, 15, '#a03030');
    return p.outline(INK);
  };
  A.centipede = function () {
    var p = new Pix(44, 22);
    for (var i = 0; i < 8; i++) { var x = 4 + i * 4.5, y = 12 + Math.sin(i * 0.9) * 3; p.ellipse(x, y, 3.2, 3, i % 2 ? '#8a3a1a' : '#a04a2a'); p.line(x, y + 2, x - 1, y + 7, '#5a2a0a'); p.line(x, y - 2, x - 1, y - 6, '#5a2a0a'); }
    p.ellipse(40, 10, 3.5, 3, '#6a2a0a'); p.line(42, 8, 44, 4, '#5a2a0a'); eye(p, 41, 9, '#f8d878');
    return p.outline(INK);
  };
  // humanoid painter for bandits, crews, arena fighters
  function humanoid(o) {
    var p = new Pix(36, 52);
    var skin = o.skin || '#e0b088', cloth = o.cloth || '#6a4a3a', clothL = DS.mix(cloth, '#ffffff', 0.2), pants = o.pants || '#3a2a20';
    // legs
    p.rect(12, 36, 5, 13, pants); p.rect(20, 36, 5, 13, pants); p.rect(11, 48, 6, 3, INK); p.rect(20, 48, 6, 3, INK);
    // body
    p.rect(10, 20, 17, 17, cloth); p.rect(10, 20, 17, 4, clothL); p.rect(10, 32, 17, 2, o.belt || '#2a1a10');
    if (o.big) { p.rect(8, 20, 21, 15, cloth); p.rect(8, 20, 21, 3, clothL); }
    // head
    p.ellipse(19, 12, 6, 7, skin); p.ellipse(18, 10, 4, 4, DS.mix(skin, '#ffffff', 0.15));
    if (o.hair) p.poly([[12, 10], [14, 4], [22, 3], [26, 8], [24, 7], [16, 8]], o.hair);
    if (o.hood) { p.poly([[11, 14], [12, 5], [19, 2], [26, 6], [26, 11], [22, 8], [16, 8], [14, 18]], o.hood); }
    if (o.helm) { p.poly([[12, 11], [13, 4], [19, 3], [25, 5], [26, 11]], o.helm); p.rect(19, 10, 7, 1, INK); }
    if (o.tusks) { p.set(24, 17, '#f8f8e8'); p.set(21, 17, '#f8f8e8'); }
    eye(p, 23, 11, INK);
    if (o.beard) p.ellipse(20, 17, 5, 3, o.beard);
    // arms + weapon
    p.line(26, 22, 31, 30, skin, 3);
    var w = o.weapon || 'club';
    if (w === 'sword') { p.line(31, 30, 33, 6, '#d8d8e8', 2); p.rect(29, 29, 5, 2, '#c0a040'); }
    if (w === 'club') { p.line(31, 30, 33, 14, '#8a5a2a', 3); p.ellipse(33, 13, 3, 3, '#6a4a2a'); }
    if (w === 'knife') { p.line(31, 30, 34, 24, '#d8d8e8', 1); }
    if (w === 'spear') { p.line(30, 50, 34, 2, '#8a5a2a', 1); p.tri(32, 4, 36, 4, 34, -2, '#d8d8e8'); }
    if (w === 'axe') { p.line(31, 32, 33, 10, '#8a5a2a', 2); p.poly([[33, 10], [36, 6], [36, 18], [33, 15]], '#c8c8d0'); }
    if (w === 'net') { p.line(31, 30, 34, 20, '#8a5a2a', 1); p.ring(8, 30, 6, 6, '#c8b890'); p.line(3, 30, 13, 30, '#c8b890'); p.line(8, 25, 8, 35, '#c8b890'); }
    if (w === 'fists') { p.ellipse(31, 30, 2.5, 2.5, skin); }
    if (w === 'mirror') { p.ellipse(32, 26, 3, 4, '#c8c8d8'); p.ellipse(32, 26, 2, 3, '#6a5a9a'); p.set(31, 25, '#f8f8f8'); p.set(34, 21, '#b8a0f8'); p.set(35, 24, '#b8a0f8'); }
    if (w === 'wand') { p.line(31, 30, 35, 20, '#e8d8b0', 1); p.set(35, 19, '#a4e4fc'); p.set(34, 17, '#f8f8f8'); p.set(36, 21, '#a4e4fc'); }
    p.line(11, 22, 7, 32, skin, 3);
    if (o.shield) { p.ellipse(8, 30, 6, 8, o.shield); p.ellipse(8, 30, 3, 5, DS.mix(o.shield, '#ffffff', 0.25)); p.set(8, 30, '#c0a040'); }
    if (o.lamp) { p.rect(4, 32, 4, 5, INK); p.rect(5, 33, 2, 3, '#f8d878'); }
    return p.outline(INK);
  }
  A.bandit = function () { return humanoid({ cloth: '#5a4a3a', hood: '#3a3a3a', weapon: 'sword', skin: '#d8a880' }); };
  A.robber = function () { return humanoid({ cloth: '#4a4a3a', hood: '#2a2a2a', weapon: 'knife', lamp: true, skin: '#c89870' }); };
  A.thug = function () { return humanoid({ cloth: '#6a3a2a', hair: '#2a1a0a', weapon: 'club', big: true, skin: '#d8a070' }); };
  A.captain = function () { return humanoid({ cloth: '#2a3a5a', hair: '#1a1a1a', weapon: 'sword', beard: '#1a1a1a', shield: '#6a6a78', skin: '#e0b088' }); };
  A.brawler = function () { return humanoid({ cloth: '#8a6a4a', hair: '#6a3a1a', weapon: 'fists', skin: '#e8b890', big: true }); };
  A.hexfighter = function () { return humanoid({ cloth: '#7a2a2a', helm: '#8a8a98', weapon: 'sword', shield: '#7a5a2a', skin: '#c89070' }); };
  A.netfighter = function () { return humanoid({ cloth: '#3a5a3a', hair: '#1a1a1a', weapon: 'spear', skin: '#b07850' }); };
  A.orcfighter = function () { return humanoid({ cloth: '#5a3a2a', weapon: 'axe', skin: '#6a8a5a', tusks: true, big: true }); };
  A.amara = function () { return humanoid({ cloth: '#3a2048', hood: '#1a1028', weapon: 'mirror', skin: '#e8c0a0', belt: '#b8a0d8' }); };
  A.willem = function () { return humanoid({ cloth: '#2a4a7a', hair: '#e8d8a0', weapon: 'wand', skin: '#f0c8a8', belt: '#d8d8f0' }); };
  A.stablehand = function () { return humanoid({ cloth: '#3a2a4a', helm: '#6a6a78', weapon: 'spear', shield: '#4a2a2a', skin: '#e0b088' }); };
  A.chuul = function () {
    var p = new Pix(72, 64);
    var shell = '#8a3a2a', shellL = '#b85a3a', shellD = '#5a2018';
    // segmented tail sweeping back and down
    for (var i = 0; i < 5; i++) { p.ellipse(18 - i * 3.2, 38 + i * 4, 8 - i, 5 - i * 0.4, i % 2 ? shell : shellD); }
    p.poly([[4, 54], [0, 62], [10, 60]], shellD);
    // legs
    [[24, 44], [30, 46], [36, 46], [42, 44]].forEach(function (l, i) { p.line(l[0], l[1], l[0] - 4 + i, l[1] + 12, shellD, 2); p.line(l[0] - 4 + i, l[1] + 12, l[0] - 6 + i * 2, l[1] + 16, shellD, 2); });
    // body
    p.ellipse(34, 36, 17, 11, shell); p.ellipse(33, 33, 14, 7, shellL);
    for (var s = 0; s < 4; s++) p.line(22 + s * 7, 28, 24 + s * 7, 44, shellD);
    // head + tentacles around the mouth
    p.ellipse(50, 34, 8, 7, shell); p.ellipse(49, 32, 6, 4, shellL);
    eye(p, 53, 30, '#f8f878'); eye(p, 50, 29, '#f8f878');
    for (var t = 0; t < 6; t++) { var a = 0.2 + t * 0.22; p.line(55, 37, 55 + Math.cos(a) * 9, 37 + Math.sin(a) * 12, '#c8a0b0'); }
    // two great pincers
    function claw(bx, by, tx, ty) {
      p.line(bx, by, tx - 6, ty + 3, shellD, 4);
      p.ellipse(tx - 2, ty, 7, 5, shell); p.ellipse(tx - 3, ty - 1, 5, 3, shellL);
      p.poly([[tx + 2, ty - 4], [tx + 12, ty - 9], [tx + 6, ty - 1]], shell);
      p.poly([[tx + 2, ty + 3], [tx + 12, ty + 7], [tx + 5, ty + 1]], shellD);
    }
    claw(44, 28, 58, 14); claw(46, 40, 60, 48);
    return p.outline('#200808');
  };
  A.wolf = function () {
    var p = new Pix(44, 30);
    p.ellipse(18, 15, 11, 6, '#6a6a72'); p.ellipse(16, 13, 9, 4, '#8a8a92');
    p.ellipse(31, 11, 5, 4.5, '#6a6a72'); p.poly([[33, 9], [42, 12], [41, 15], [33, 14]], '#5a5a62');
    p.tri(28, 8, 29, 2, 32, 8, '#5a5a62'); p.tri(31, 8, 33, 3, 34, 8, '#5a5a62');
    p.set(34, 10, '#f8d800'); p.rect(38, 14, 4, 1, '#e8e8d0');
    [[9, 19], [13, 20], [22, 20], [26, 19]].forEach(function (l) { p.rect(l[0], l[1], 3, 8, '#5a5a62'); });
    p.line(7, 13, 0, 9, '#6a6a72', 2);
    return p.outline(INK);
  };
  A.axebeak = function () {
    var p = new Pix(40, 48);
    p.ellipse(16, 24, 10, 8, '#8a6a3a'); p.ellipse(14, 22, 8, 5, '#a8884a');
    p.line(22, 18, 26, 6, '#8a6a3a', 3); p.ellipse(27, 6, 4, 3.5, '#8a6a3a');
    p.poly([[29, 3], [38, 6], [37, 10], [29, 9]], '#e8c060'); p.set(28, 5, INK);
    p.line(12, 30, 10, 45, '#c8a060', 2); p.line(20, 30, 22, 45, '#c8a060', 2);
    p.line(6, 21, 1, 16, '#6a4a2a', 2); p.line(6, 24, 1, 26, '#6a4a2a', 2);
    return p.outline(INK);
  };
  A.boar = function () {
    var p = new Pix(52, 36);
    p.ellipse(22, 18, 17, 10, '#5a3a2a'); p.ellipse(20, 15, 14, 7, '#7a5a3a');
    p.speckle(8, 8, 30, 14, '#3a2a1a', 0.15, DS.mulberry32(21));
    p.ellipse(40, 19, 8, 7, '#5a3a2a'); p.ellipse(47, 21, 3, 3, '#8a5a4a'); p.set(47, 21, INK);
    p.poly([[42, 23], [50, 16], [44, 24]], '#f0e8d0'); p.set(41, 15, '#f83800');
    [[10, 25], [16, 26], [28, 26], [34, 25]].forEach(function (l) { p.rect(l[0], l[1], 4, 9, '#4a2a1a'); });
    return p.outline(INK);
  };
  A.snake = function () {
    var p = new Pix(36, 20);
    for (var i = 0; i < 14; i++) { var x = 3 + i * 2, y = 12 + Math.sin(i * 0.8) * 4; p.ellipse(x, y, 2.4, 2.2, i % 2 ? '#4a7a2a' : '#6a9a3a'); }
    p.ellipse(32, 8, 3.5, 2.6, '#4a7a2a'); p.set(33, 7, '#f8d800'); p.line(35, 9, 36, 10, '#c83030');
    return p.outline(INK);
  };
  A.insects = function () {
    var p = new Pix(40, 32), r = DS.mulberry32(77);
    for (var i = 0; i < 70; i++) { var x = 20 + (r() - 0.5) * 34 * r(), y = 16 + (r() - 0.5) * 26 * r(); p.set(x, y, i % 3 ? '#2a2a1a' : '#6a6a2a'); if (i % 4 === 0) p.set(x + 1, y, '#b8b8a0'); }
    return p;
  };
  A.shadowkid = function () { return humanoid({ cloth: '#3a3a3a', weapon: 'fists', skin: '#8a8a8a' }); };

  var cache = {};
  DS.monsterArt = function (id, tint) {
    var key = id + (tint || '');
    if (cache[key]) return cache[key];
    var f = A[id] || A.bandit;
    var p = f();
    if (tint) p = p.tint(tint, 0.4);
    var c = { img: p.canvas(), flash: p.silhouette('#fcfcfc').canvas(), pix: p, w: p.w, h: p.h };
    return (cache[key] = c);
  };
  DS.MONSTER_PAINTERS = A;
})();
