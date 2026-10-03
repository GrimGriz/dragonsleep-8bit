/* DEEP16 — two plain scenes before the fight exists: MapView (walk a cursor round the cavern) and the Gate
   (RULED 09-26d: the stop-and-look gate — the seven figures, both pipelines, on one floor, side by side). */
'use strict';
(function () {
  var D = window.D16, I = D.input;

  D.MAPS.gate = {
    name: 'The Gate Floor', sub: 'seven figures, two pipelines', step: 10,
    rows: (function () {
      var r = [];
      for (var y = 0; y < 16; y++) {
        var s = '';
        for (var x = 0; x < 16; x++) s += (x === 0 || y === 0 || x === 15 || y === 15) ? '#' : (x === 2 && y === 3) || (x === 3 && y === 2) ? 'P' : (x === 13 && y === 2) ? 'c' : '.';
        r.push(s);
      }
      return r;
    })()
  };

  var FIG = [
    { id: 'barley', label: 'BARLEY', color: '#aa6c4a' },
    { id: 'aurdin', label: 'AURDIN', color: '#30509a' },
    { id: 'vivian', label: 'VIVIAN', color: '#62401e' },
    { id: 'lymen', label: 'LYMEN', color: '#56703e' },
    { id: 'drow', label: 'DROW', color: '#62398a' },
    { id: 'drow', label: 'DROW', color: '#62398a', alt: 1 },
    { id: 'phasespider', label: 'PHASE SPIDER', color: '#8a5cb4' }
  ];

  // ------------------------------------------------------------------ the Gate
  function Gate() { this.t = 0; this.facing = 7; this.anim = 'idle'; this.labels = true; }
  D.Gate = Gate;
  Gate.prototype.enter = function () {
    D.iso.load(D.MAPS.gate);
    D.spr.gate(this, this.rows().map(function (r) { return r.f.id + '_p' + r.pipe; })); // (its figures before it draws: js/sprites.js, 10-03)
    // pipeline 1's feet on depth 14, pipeline 0's on depth 20 (96 px lower); the line shifted left so the spider's legs fit
    D.iso.cam.x = 16; D.iso.cam.y = 14 * 16 + 16 - 104 + D.H / 2;
  };
  Gate.prototype.update = function () {
    if (D.spr.held(this)) return;
    this.t++;
    if (I.repeat('left')) this.facing = (this.facing + 7) % 8;
    if (I.repeat('right')) this.facing = (this.facing + 1) % 8;
    if (I.pressed('up') || I.pressed('down')) this.anim = this.anim === 'idle' ? 'walk' : 'idle';
    if (I.pressed('a')) this.labels = !this.labels;
  };
  // three rows placed on the screen (the gate is a display, not a fight): pipeline 1, pipeline 0, and Denny (pipeline 2,
  // Griz's generated sheet, cleaned by tools/denny-sheet.py) in front
  var ROW_Y = [86, 164, 246], COL_X = function (k) { return 32 + 64 * k; };
  Gate.prototype.rows = function () {
    var out = [];
    FIG.forEach(function (f, k) {
      out.push({ f: f, pipe: 1, x: COL_X(k), y: ROW_Y[0] });
      out.push({ f: f, pipe: 0, x: COL_X(k), y: ROW_Y[1] });
    });
    out.push({ f: { id: 'denny', label: 'DENNY', color: '#e8624a' }, pipe: 2, x: COL_X(0), y: ROW_Y[2] });
    return out;
  };
  var PIPE_COL = ['#a8e8ff', '#dca238', '#f8a4c0'];
  Gate.prototype.draw = function (ctx) {
    if (D.spr.held(this, true)) return D.spr.beat(ctx, this);
    var self = this, objs = [];
    this.rows().forEach(function (r, i) {
      objs.push({
        depth: 1000 + r.y + i * 0.01, gz: 0, layer: 1,
        draw: function (c) {
          var name = r.f.id + '_p' + r.pipe;
          D.spr.draw(c, name, self.anim, self.facing, self.t + (r.f.alt ? 17 : 0), r.x, r.y, { color: r.f.color });
          if (self.labels) D.text(c, r.f.label, r.x, r.y + 9, PIPE_COL[r.pipe], 'center');
        }
      });
    });
    D.iso.draw(ctx, objs);
    if (this.labels) {
      D.text(ctx, 'PIPELINE 1  {y}Blender pre-render{/}, palette pass', 6, 4, '#b8c3d4');
      D.text(ctx, 'PIPELINE 0  {c}LPC{/}, four facings on the diagonals', 6, 14, '#b8c3d4');
      D.text(ctx, 'PIPELINE 2  {p}generated{/} (Griz), cleaned to the palette', COL_X(0) + 34, ROW_Y[2] - 24, '#b8c3d4');
      D.text(ctx, 'four views, a walk east; west mirrored', COL_X(0) + 34, ROW_Y[2] - 14, '#6e6a66');
      D.text(ctx, D.spr.FACINGS[this.facing] + '  ' + this.anim.toUpperCase() + '   < > turn  ^ v idle/walk  E labels', D.W - 6, D.H - 11, '#6e6a66', 'right');
    }
  };

  // ------------------------------------------------------------------ MapView: the cavern with a cursor
  function MapView(mapId) { this.id = mapId || 'cavern'; this.t = 0; }
  D.MapView = MapView;
  MapView.prototype.enter = function () {
    var m = D.iso.load(D.MAPS[this.id]);
    this.cur = { x: 8, y: 7 };
    D.iso.lookAt(this.cur.x, this.cur.y);
    this.units = [];
    var self = this;
    (m.def.entry || []).slice(0, 4).forEach(function (e, i) { self.units.push({ x: e[0], y: e[1], color: ['#aa6c4a', '#30509a', '#62401e', '#56703e'][i] }); });
    (m.def.foes || []).forEach(function (f) { self.units.push({ x: f.at[0], y: f.at[1], color: f.kind === 'drow' ? '#62398a' : '#bb96e0' }); });
  };
  MapView.prototype.update = function () {
    this.t++;
    var c = this.cur, m = D.iso.map, moved = false;
    ['up', 'down', 'left', 'right'].forEach(function (k) { if (I.repeat(k) && D.iso.nudge(c, k, m.w, m.h)) moved = true; });
    if (moved) D.iso.lookAt(c.x, c.y, m.gz(c.x, c.y));
    if (I.mouse.inside && I.mouse.moved) { var s = D.iso.pick(I.mouse.x, I.mouse.y); if (s) { c.x = s.x; c.y = s.y; } }
    if (I.mouse.click) D.iso.lookAt(c.x, c.y, m.gz(c.x, c.y));
  };
  MapView.prototype.draw = function (ctx) {
    var self = this, m = D.iso.map, c = this.cur, sq = m.at(c.x, c.y), objs = [];
    this.units.forEach(function (u) {
      var gz = m.gz(u.x, u.y);
      objs.push({ depth: u.x + u.y + 0.5, gz: gz, layer: 1, draw: function (cx) { var p = D.iso.center(u.x, u.y, gz), s = D.iso.toScreen(p.x, p.y); D.spr.placeholder(cx, '', s.x, s.y, { color: u.color }); } });
    });
    D.iso.draw(ctx, objs, function (cx) {
      if (!sq || !sq.open) return;
      D.iso.rhombus(cx, c.x, c.y, sq.gz, 1);
      cx.strokeStyle = sq.walk ? '#a8e8ff' : '#e8624a'; cx.lineWidth = 1; cx.stroke();
    });
    D.text(ctx, m.def.name.toUpperCase(), 6, 4, '#dca238');
    D.text(ctx, m.def.sub, 6, 14, '#8a96aa');
    if (sq) D.text(ctx, c.x + ',' + c.y + '  ' + (sq.open ? (sq.pillar ? 'stalagmite' : sq.cocoon ? 'cocoon' : sq.difficult ? 'difficult' : sq.gz ? 'raised ' + (sq.gz / m.def.step * 2.5) + ' ft' : 'floor') : 'rock'), D.W - 6, 4, '#b8c3d4', 'right');
  };
})();
