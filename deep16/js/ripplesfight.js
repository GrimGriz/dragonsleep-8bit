/* DEEP16 -- THE WALKING OLD ONE, MET (2026-11-13, the ripples-fight seat; the clock lane). Griz to the lanes desk that day, whole:
     "Start a fable seat for the random encounter (grid only) 'fight' with Mr. Ripples, where he does nothing if wins initiative, on first player initiative a cutscreen
      back and forth between zooming in on mr. ripples (south-facing with idle) juxtaposed with a slow zoom on player character face, at climax of zoom mirror-eye PC face
      zoom with an audio indicator, and then rapid 3-frame zoom and mirror-eye on the other PC faces - "The Party Found the Walking Old One! (two lines and a beat)
      Game Over."

   THE ENCOUNTER (RF.pick, over js/world.js W.pick): a road's fight that the count has already brought, rolled while the party stands where his hidden road has him that hour
   (W.vesselAt: within RF.NEAR miles of his point, a hex of THE WORLD from its middle to its corner; from the dawn he sets out), is Mr. Ripples alone RF.ODDS of the time -- one D.rand(), rolled only
   there, so every other hex's dice fall as they did. It opens ON THE GRID whatever OPTIONS' RANDOM FIGHTS says (his "grid only": no simple fight, no figure on the map,
   nothing on a floor). The seat's numbers, his to tune.
   THE FIGHT: initiative as in any fight. His turn, if it comes first: nothing (RF.idleTurn; he stands in his idle, facing south). The first hero's turn, before any menu:
   THE CUT (RF.scene) -- the map's own camera in on him (Battle.camTo's way), cut against that hero's face coming slowly closer, the cuts shorter each time; at the top of
   it the hero's eyes go to mirrors (the sound `mirroreye`, js/audio.js); then each other hero's face in three frames and its eyes (`mirroreye2`); then the card
   (RF.Found): the found line, two lines and a beat, "Game Over.", and the game over's rows as js/seep.js S.gameOver has them -- CONTINUE FROM A SAVE or the title.
   THE FACES: a hero's talking portrait at the keepers' bust where the art desk drew one (RF.FACE: the eyes' boxes read off the art), else the figure's own head off its
   sheet, the eyes placed by the head's shape (RF.findEyes). The mirror is laid in code, as the made
   creatures' eyes are (js/sprites.js S.eyed): pale cold pixels over the eye, a glint that moves.
   HIS ROW (data/foes.js ripples): the name, the review sheet, the ripple; his kit is NOT RULED and nothing of it is here -- no blow, no power; the numbers are the SRD
   Gnoll's so the engine has a row to stand him on, and none of them is read before the fight is over.
   The doors: deep16/?ripplesshow (the beat whole, the dice pinned: a hero first; &first he is first; &plain the faces off the figures' heads; &fast the bench's). A bench: dev/bench16.js mode=ripples1113. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, FX = D.fx, Battle = D.Battle, BP = Battle.prototype, AI = D.ai, W = D.world;
  var RF = D.ripples = {};
  RF.KIND = 'ripples';
  RF.ODDS = 0.5;   // (of the road's fights rolled where he stands: the seat's number, his to tune)
  RF.NEAR = 2.9;   // (miles from his point on his road: a 5-mile hex's middle to its corner -- the hex he stands in)
  RF.LINES = {
    meet: ['A gnoll, alone, walking. It does not hurry, and it does not turn aside.', 'There are stars in its hide.'],
    intro: 'It has stopped. It is looking at the party.',
    still: 'does nothing.',
    found: 'The Party Found the Walking Old One!', over: 'Game Over.'
  };
  // the cut's clock, in the fight's steps (a `yield 1`: two frames, a thirtieth of a second): each pair of shots (him, then the face), shorter as it goes; the hold at the
  // top; a frame of the others' three, and their hold; the dark. The card's own (frames at 60 a second): the beat before "Game Over.", and the rows
  RF.T = { shots: [44, 44, 36, 36, 28, 28, 21, 21, 15, 15, 11, 11, 8, 18], top: 56, frame: 4, other: 16, out: 22, beat: 110, rows: 230 };

  RF.of = function (B) { return B && B.units ? B.units.filter(function (u) { return u.kind === RF.KIND && !u.dead; })[0] || null : null; };
  function heroes(B) { return B.units.filter(function (u) { return u.side === 'party' && !u.familiar && !u.object && !u.ally && !u.summon && !u.dead; }); }
  function note(B, s) { (B.ripplesLog = B.ripplesLog || []).push(s); }
  function ease(q) { q = Math.max(0, Math.min(1, q)); return q * q * (3 - 2 * q); }

  // ------------------------------------------------------------------ the faces
  // a hero's portrait at the keepers' bust, by the hero (the eyes' boxes [x0, y0, x1, y1] in the frame's own pixels, the nearer eye first -- read off the art, 11-13)
  RF.FACE = {
    lymen: { sheet: 'pt_lymen_full', eyes: [[74, 34, 80, 36], [89, 34, 91, 36]] },
    vivian: { sheet: 'pt_vivian_full', eyes: [[64, 34, 69, 36], [79, 37, 82, 39]] },
    aurdin: { sheet: 'pt_aurdin_red_full', eyes: [[62, 36, 67, 38], [75, 37, 78, 38]], by: { aurdin_p2: { sheet: 'pt_aurdin_ochre_full', eyes: [[62, 36, 68, 38], [76, 37, 80, 39]] } } },
    barley: { sheet: 'pt_barley_coat_full', eyes: [[66, 35, 71, 37], [80, 35, 83, 36]] },
    ingrith: { sheet: 'pt_ingrith', eyes: [[66, 31, 70, 32], [57, 30, 60, 31]] }
  };
  RF.faceOf = function (u) {
    var f = RF.FACE[u.id] || RF.FACE[(u.src && (u.src.key || u.src.id)) || ''];
    if (f && f.by && f.by[u.sheet]) f = f.by[u.sheet];
    if (f && !RF.plain && D.SHEETS && D.SHEETS[f.sheet]) return { sheet: f.sheet, eyes: f.eyes, s0: 1.15, s1: 4.6, facing: 0 };
    return { sheet: u.sheet, eyes: null, s0: 3, s1: 10, facing: 0, figure: true }; // (no portrait: the figure's own head, south-facing)
  };
  // the eyes on a figure's south idle frame, placed by the head's shape: a little under its middle, a pixel each side. Boxes in the frame's pixels
  var EYES = {};
  RF.findEyes = function (sheet) {
    if (EYES[sheet]) return EYES[sheet];
    var f = D.spr.frameAt(sheet, 'idle', 0, 0, { frame: 0 }); if (!f || !f.img) return null;
    var c = document.createElement('canvas'); c.width = f.fw; c.height = f.fh; var g = c.getContext('2d'); g.drawImage(f.img, f.sx, f.sy, f.fw, f.fh, 0, 0, f.fw, f.fh);
    var d = g.getImageData(0, 0, f.fw, f.fh).data, fw = f.fw, fh = f.fh;
    var A = function (x, y) { return x >= 0 && y >= 0 && x < fw && y < fh && d[(y * fw + x) * 4 + 3] > 0; };
    var top = -1, x, y; for (y = 0; y < fh && top < 0; y++) for (x = 0; x < fw; x++) if (A(x, y)) { top = y; break; }
    if (top < 0) return null;
    // the head: from the figure's top down to its neck -- the first row a good deal narrower than the widest above it -- or, on a figure with none to find (long hair, a
    // hood), its top three tenths; never more than half of it
    var H = f.ay - top, span = function (yy) { var l = -1, h = -1; for (var k = 0; k < fw; k++) if (A(k, yy)) { if (l < 0) l = k; h = k; } return l < 0 ? null : [l, h]; };
    var mxW = 0, neck = -1; for (y = top; y < top + H * 0.5; y++) { var sp = span(y); if (!sp) continue; var wd = sp[1] - sp[0] + 1; if (y - top >= 4 && wd <= mxW * 0.72) { neck = y; break; } mxW = Math.max(mxW, wd); }
    var y1 = neck > 0 ? neck : Math.round(top + H * 0.3), hH = y1 - top, sx = 0, n = 0, lo = fw, hi = 0;
    for (y = top; y < y1; y++) for (x = 0; x < fw; x++) if (A(x, y)) { sx += x; n++; lo = Math.min(lo, x); hi = Math.max(hi, x); }
    // (two dark marks side by side were looked for first, 11-13: on the small figures the hair and the collar gave as many pairs as the eyes did -- so by the shape alone)
    var cx = n ? sx / n : f.ax, hw = hi - lo + 1, ey = Math.round(top + hH * 0.6), dx = Math.max(1, Math.min(2, Math.round(hw * 0.1))), mx = Math.round(cx), tall = hw >= 14 ? 1 : 0;
    var out = [[mx - dx, ey, mx - dx, ey + tall], [mx + dx, ey, mx + dx, ey + tall]];
    return (EYES[sheet] = { eyes: out, ax: f.ax, ay: f.ay });
  };

  // ------------------------------------------------------------------ the stage: the faces, over the world (a screen FX, as js/trophy.js's)
  var MIRROR = ['#ffffff', '#d8f4ff', '#9fe6ff', '#6fb6e8'];
  function stage(B) {
    var S = { face: null, dim: 0, flash: 0, black: 0, t: 0 };
    S.fx = FX.add({ kind: 'ripplesstage', screen: true, dur: 1e9, draw: function (ctx) {
      var Wd = D.W, Hd = D.H; S.t++;
      if (S.dim > 0) { ctx.globalAlpha = Math.min(1, S.dim); ctx.fillStyle = '#04030a'; ctx.fillRect(0, 0, Wd, Hd); ctx.globalAlpha = 1; }
      var fc = S.face;
      if (fc) {
        var sh = D.SHEETS[fc.sheet], a = (sh.anims && sh.anims.idle) || sh, ax = a.ax != null ? a.ax : sh.ax, ay = a.ay != null ? a.ay : sh.ay, eyes = fc.eyes, sc = fc.s;
        var ex = (eyes[0][0] + eyes[0][2] + eyes[1][0] + eyes[1][2] + 2) / 4, ey = (eyes[0][1] + eyes[0][3] + eyes[1][1] + eyes[1][3] + 2) / 4;
        ctx.save(); ctx.translate(Math.round(Wd / 2), Math.round(Hd / 2 - 6)); ctx.scale(sc, sc);
        D.spr.draw(ctx, fc.sheet, 'idle', fc.facing || 0, 0, ax - ex, ay - ey, { frame: 0 });
        if (fc.mirror > 0) eyes.forEach(function (e, n) { // the mirrors, a pixel of the art at a time: pale and cold, lighter at the top, a glint that moves
          var w = e[2] - e[0] + 1, h = e[3] - e[1] + 1, gl = Math.floor(S.t / 7 + n * 2) % (w + 3);
          for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
            if (w >= 4 && h >= 3 && (xx === 0 || xx === w - 1) && (yy === 0 || yy === h - 1)) continue; // (the corners off a big eye: its shape)
            ctx.fillStyle = xx === gl ? MIRROR[0] : yy === 0 ? MIRROR[1] : yy === h - 1 && h > 1 ? MIRROR[3] : MIRROR[2];
            ctx.globalAlpha = Math.min(1, fc.mirror); ctx.fillRect(e[0] - ex + xx, e[1] - ey + yy, 1, 1);
          }
          ctx.globalAlpha = 1;
        });
        ctx.restore();
        if (fc.flare > 0) eyes.forEach(function (e) { // the catch of the light as they turn: a star on each
          var x = Wd / 2 + ((e[0] + e[2] + 1) / 2 - ex) * sc, y = Hd / 2 - 6 + ((e[1] + e[3] + 1) / 2 - ey) * sc, k = fc.flare, r = 5 + k * 26;
          ctx.globalAlpha = Math.min(1, k) * 0.35; ctx.fillStyle = '#d8f4ff'; ctx.beginPath(); ctx.ellipse(x, y, 4 + sc * 2.2 * k, 3 + sc * 1.5 * k, 0, 0, 7); ctx.fill();
          ctx.globalAlpha = Math.min(1, k); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r * 0.5); ctx.lineTo(x, y + r * 0.5); ctx.stroke();
          ctx.globalAlpha = 1;
        });
      }
      if (S.flash > 0) { ctx.globalAlpha = Math.min(1, S.flash); ctx.fillStyle = '#eef9ff'; ctx.fillRect(0, 0, Wd, Hd); ctx.globalAlpha = 1; }
      if (S.black > 0) { ctx.globalAlpha = Math.min(1, S.black); ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, Wd, Hd); ctx.globalAlpha = 1; }
    } });
    S.end = function () { S.fx.dur = S.fx.t; };
    return S;
  }
  function faceFor(u) {
    var f = RF.faceOf(u), eyes = f.eyes;
    if (!eyes) { var fe = RF.findEyes(f.sheet); eyes = fe ? fe.eyes : [[0, 0, 1, 1], [4, 0, 5, 1]]; }
    return { sheet: f.sheet, eyes: eyes, s0: f.s0, s1: f.s1, s: f.s0, facing: f.facing, mirror: 0, flare: 0, figure: !!f.figure };
  }
  // the map's camera on him: from his whole figure in to his head (Battle.camTo's frame, a figure at its middle; then higher, toward the face)
  function camHim(B, r, q) {
    var iso = D.iso, c = FX.at(r), p = iso.center(c.gx, c.gy, c.gz || 0), top = D.spr.unitTop(r), e = ease(q);
    iso.zoom = RF.Z0 + (3.6 - RF.Z0) * e; iso.cam.x = Math.round(p.x); iso.cam.y = Math.round(p.y - 20 * (1 - e) - top * (0.5 + 0.3 * e));
  }
  function camOn(B, u, zoom) { var iso = D.iso, c = FX.at(u), p = iso.center(c.gx, c.gy, c.gz || 0); iso.zoom = zoom; iso.cam.x = Math.round(p.x); iso.cam.y = Math.round(p.y - 20 - D.spr.unitTop(u) / 2); }

  // ------------------------------------------------------------------ the cut
  RF.scene = function* (B, pc) {
    var r = RF.of(B), T = RF.T, FAST = !!B.ripplesFast, Wt = function (n) { return FAST ? 1 : n; };
    B.ripplesDone = true; note(B, 'cut:' + pc.name);
    if (B.clearCards) B.clearCards();
    var others = heroes(B).filter(function (u) { return u !== pc; }), all = [pc].concat(others);
    var faces = all.map(faceFor), names = []; faces.forEach(function (f) { if (names.indexOf(f.sheet) < 0) names.push(f.sheet); });
    if (D.spr.ensure) D.spr.ensure(names);
    for (var w8 = 0; w8 < 75 && !FAST && D.spr.ready && !D.spr.ready(names); w8++) yield 1; // (the faces not come yet: a moment's wait)
    faces = all.map(faceFor); // (the eyes on a figure's head are found once its sheet has come)
    var cine0 = B.cine; B.cine = true; // (no turn strip and no bar over the picture: the show's way)
    var S = stage(B), iso = D.iso; RF.Z0 = Math.max(1.4, iso.zoom || 1);
    r.facing = 0; r.anim = 'idle'; r.cine = true; // (south, in his idle)
    B.units.forEach(function (u) { u.laid = true; }); // (no bars over the figures in the picture: js/ui.js reads it so, and nothing else does)
    try { D.music(null); } catch (e0) { } // (the fight's tune stops: the cut is its own sounds)
    var fc = faces[0], shots = T.shots, tot = [0, 0], done = [0, 0], k, i;
    for (k = 0; k < shots.length; k++) tot[k % 2] += shots[k];
    try {
      for (k = 0; k < shots.length; k++) {
        var him = k % 2 === 0, n = Wt(shots[k]);
        note(B, him ? 'shot:him' : 'shot:face');
        if (him) { S.face = null; S.dim = 0; if (D.ripple && k) D.ripple(r, { region: 'body', dur: Math.max(16, shots[k]) }); D.sfx('bump'); }
        else { camOn(B, pc, 2.2); S.dim = 0.86; S.face = fc; }
        for (i = 0; i < n; i++) {
          var q = (done[k % 2] + shots[k] * (i + 1) / n) / tot[k % 2];
          if (him) camHim(B, r, q); else fc.s = fc.s0 + (fc.s1 - fc.s0) * ease(q);
          yield 1;
        }
        done[k % 2] += shots[k];
      }
      // ---- the top of it: the hero's eyes go to mirrors
      fc.s = fc.s1; S.face = fc; S.dim = 0.92;
      D.sfx('mirroreye'); B.shakeT = 14; pc.mirrorEye = true; note(B, 'mirror:' + pc.name); if (D.ripple) D.ripple(pc, { region: 'body', dur: 50 });
      for (i = 0; i < Wt(T.top); i++) { var qq = i / T.top; S.flash = i < 3 ? 0.75 * (1 - i / 3) : 0; fc.mirror = Math.min(1, (i + 1) / 3); fc.flare = i < 5 ? (i + 1) / 5 : Math.max(0, 1 - (i - 5) / 26); fc.s = fc.s1 * (1 + 0.05 * ease(qq)); yield 1; }
      fc.mirror = 1; fc.flare = 0; S.flash = 0;
      // ---- the others: three frames in, and the mirrors
      for (var o = 0; o < others.length; o++) {
        var u = others[o], f = faces[o + 1];
        camOn(B, u, 2.2); S.face = f; f.mirror = 0; note(B, 'zoom3:' + u.name);
        for (var s3 = 0; s3 < 3; s3++) { f.s = f.s0 + (f.s1 - f.s0) * [0.3, 0.68, 1][s3]; yield Wt(T.frame); }
        D.sfx('mirroreye2'); u.mirrorEye = true; f.mirror = 1; note(B, 'mirror:' + u.name); if (D.ripple) D.ripple(u, { region: 'body', dur: 30 });
        for (i = 0; i < Wt(T.other); i++) { f.flare = Math.max(0, 1 - i / 8); S.flash = i < 2 ? 0.4 * (1 - i / 2) : 0; yield 1; }
      }
      // ---- out: the dark, and the card
      for (i = 0; i < Wt(T.out); i++) { S.black = (i + 1) / T.out; yield 1; }
      S.black = 1;
    } finally { B.cine = cine0; delete r.cine; }
    note(B, 'gameover');
    RF.gameOver(); // (the stage goes with the battle: the scenes are cleared)
    yield 1e9;     // (and the fight never takes another step: it is off the scenes, and a bench that drives it by hand stops here)
  };
  // his turn: nothing (the first hero's turn has not come: he won the initiative)
  RF.idleTurn = function* (B, u) {
    D.rules.startTurn(u); B.focus(u); u.facing = 0; u.anim = 'idle'; note(B, 'idle:' + u.name);
    B.card(['{p}' + u.name + '{/} ' + RF.LINES.still], 200);
    yield B.ripplesFast ? 1 : 70;
    if (D.magic && D.magic.endTurn) D.magic.endTurn(B, u);
  };

  // ------------------------------------------------------------------ into the fight (wrapped here: no fight without him runs a line of this)
  var run0 = BP.run;
  BP.run = function* () { var r = RF.of(this); if (r) { r.facing = 0; r.anim = 'idle'; this.ripplesFight = true; } return yield* run0.apply(this, arguments); }; // (south from the first frame the fight steps: after its host has faced the two lines)
  var turn0 = AI.turn;
  AI.turn = function* (B, u) { if (u.kind === RF.KIND) return yield* RF.idleTurn(B, u); return yield* turn0.apply(this, arguments); };
  var hero0 = BP.heroTurn;
  BP.heroTurn = function* (u) { if (!this.ripplesDone && RF.of(this)) { yield* RF.scene(this, u); return; } return yield* hero0.apply(this, arguments); };

  // ------------------------------------------------------------------ the card, and the game over (js/seep.js S.gameOver's rows: js/mines.js RoostFail's)
  function Found() { var RFl = D.mines && D.mines.RoostFail; if (RFl) RFl.call(this); this.kind = 'ripplesfound'; this.bats = []; this.lines = [RF.LINES.found, '', '', RF.LINES.over]; }
  function proto() {
    var RFl = D.mines && D.mines.RoostFail; if (!RFl) return false;
    if (!Found.wired) {
      Found.prototype = Object.create(RFl.prototype); Found.prototype.constructor = Found; Found.wired = true;
      Found.prototype.update = function () { // (the roost's rows, on this card's own clock: the found line, the beat, "Game Over.", then the choice)
        this.t++; var T = RF.T; if (this.t === T.beat) D.sfx('bump');
        if (this.t < T.rows) return;
        var m = D.input.mouse, R = RFl.ROWS, self = this;
        if (D.input.repeat('up') || D.input.repeat('down')) { this.i = 1 - this.i; D.sfx('cursor'); }
        if (m.inside) R.forEach(function (rw, k) { var ry = 186 + k * 16; if (m.x >= D.W / 2 - 80 && m.x < D.W / 2 + 80 && m.y >= ry - 3 && m.y < ry + 12) { if (m.moved) self.i = k; if (m.click) { self.i = k; self.go(rw[1]); } } });
        if (D.input.pressed('a')) this.go(R[this.i][1]);
      };
      Found.prototype.draw = function (ctx) {
        var T = RF.T, y0 = 62, self = this;
        ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, D.W, D.H);
        this.shown = [];
        this.lines.forEach(function (l, k) { // (a line a row: the two between are the two lines; the last waits out the beat)
          var a = k < 3 ? Math.min(1, Math.max(0, (self.t - 20) / 40)) : Math.min(1, Math.max(0, (self.t - T.beat) / 20));
          if (a <= 0 || !l) { if (a > 0) self.shown.push(l); return; }
          self.shown.push(l); ctx.save(); ctx.globalAlpha = a; ctx.translate(D.W / 2, y0 + k * 24); ctx.scale(2, 2); D.text(ctx, l, 0, 0, k < 3 ? '#d8f4ff' : '#f8f8f8', 'center'); ctx.restore(); // (at twice the size, as the roost's head is)
        });
        if (this.t < T.rows) return;
        RFl.ROWS.forEach(function (rw, k) {
          var y = 186 + k * 16, on = k === self.i, dimR = rw[1] === 'load' && !self.any;
          if (on) { ctx.fillStyle = 'rgba(38,32,106,.85)'; ctx.fillRect(D.W / 2 - 80, y - 3, 160, 14); }
          D.text(ctx, (on ? '> ' : '') + rw[0], D.W / 2, y, dimR ? '#6c6c84' : on ? '#f8d878' : '#f8f8f8', 'center');
        });
      };
    }
    return true;
  }
  RF.Found = Found;
  RF.gameOver = function () {
    var H = D.house; try { D.music('gameover'); } catch (e) { }
    if (H) { H.playing = false; H.cur = null; }
    if (D.seep) D.seep.lastLine = RF.LINES.found;
    if (!proto()) { if (D.seep && D.seep.gameOver) D.seep.gameOver(RF.LINES.found); return; }
    D.scenes.length = 0; D.push(new Found());
  };

  // ------------------------------------------------------------------ the encounter, on the road (js/world.js)
  if (W && W.pick && W.World) {
    RF.here = function (pt, t) { // (is the party where he stands this hour: his point on his hidden road, from the dawn he sets out)
      var S = W.state && W.state(); if (t == null) t = S ? S.t : 0; pt = pt || (W.partyPt && W.partyPt()); if (!pt || !W.vesselAt) return false;
      var V = W.VESSEL, v = W.vesselAt(t); if (!v || t < (V.day0 - 1) * 24 + V.dawn) return false;
      return Math.hypot(pt[0] - v.pt[0], pt[1] - v.pt[1]) <= RF.NEAR;
    };
    var pick0 = W.pick;
    W.pick = function (zone, night, pt) {
      var p = pick0.apply(this, arguments);
      if (!p || !p.list || !p.list.length || !D.FOES || !D.FOES[RF.KIND] || !(RF.ODDS > 0) || !RF.here(pt)) return p;
      if (D.rand() >= RF.ODDS) return p;
      return { zone: p.zone, Z: p.Z, grp: { ripples: true }, list: [RF.KIND], mirror: false, made: null, ripples: true };
    };
    var enc0 = W.World.prototype.encounter;
    W.World.prototype.encounter = function (p, e) {
      if (!p || !p.ripples) return enc0.apply(this, arguments);
      var self = this, M = W.M(), road = M && M.road && M.road[W.K(e.q, e.r)];
      D.sfx('encounter');
      this.card(['{p}On the ' + (road ? 'road' : W.groundName(e.t)) + '{/}, ' + W.timeOfDay() + ':'].concat(RF.LINES.meet).concat(['', D.keys('{g}E{/}: go on')]), null, [['a', function () { self.fight(p, e); }, 'GO ON']]);
    };
    var fight0 = W.World.prototype.fight;
    W.World.prototype.fight = function (p, e, o) { // (on the grid, whatever OPTIONS says; his own words on its card)
      if (!p || !p.ripples) return fight0.apply(this, arguments);
      return fight0.call(this, p, e, Object.assign({}, o || {}, { simple: false, intro: RF.LINES.intro }));
    };
  }

  // ------------------------------------------------------------------ the show: deep16/?ripplesshow -- the beat whole, the four at level 3, the dice pinned
  //   a hero first; &first he is first (his turn: nothing; then the cut); &plain the faces off the figures' own heads (a hero with no portrait); &fast no waits (the bench)
  RF.make = function (q) {
    q = q || '';
    var first = /[?&]first\b/.test(q), FAST = /[?&]fast\b/.test(q), rows = [], x, y, wd = 22, hg = 7;
    var hh = function (a, b) { var v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); }; // (a picture's scatter, never the dice)
    for (y = 0; y < hg; y++) { var row = ''; for (x = 0; x < wd; x++) { var edge = y === 0 || y === hg - 1, v = hh(x, y); row += edge ? (v < 0.3 ? 'r' : v < 0.55 ? 'g' : '.') : (x < 3 || x > 18) && v < 0.2 ? 'g' : '.'; } rows.push(row); }
    D.MAPS['ripples-field'] = { name: 'The hills', sub: 'his road, noon', step: 10, ground: 'earth', rows: rows, entry: [[14, 3], [14, 2], [14, 4], [15, 3], [15, 1], [15, 5]], foes: [], wave: null };
    var F = { id: 'ripplesfield', map: 'ripples-field', level: 3, name: 'On his road', sub: first ? 'the dice pinned: he is first' : 'the dice pinned: a hero is first', dark: false,
      intro: RF.LINES.intro, won: 'THE ROAD IS CLEAR.', lost: 'THE ROAD TAKES THEM.', foes: [{ id: 'w0-ripples', kind: RF.KIND, at: [6, 3] }], wave: null, noCards: FAST };
    var B = new Battle({ fightDef: F, ladder: true, level: 3, bench: FAST });
    B.ripplesShow = true; B.ripplesFast = FAST; RF.plain = /[?&]plain\b/.test(q); // (&plain: the faces off the figures' own heads, as a hero with no portrait has it)
    var enter0 = B.enter;
    B.enter = function () {
      enter0.apply(this, arguments);
      this.units.forEach(function (u) { u.facing = D.spr.facingFor(u.side === 'party' ? -1 : 1, 0); u.initAdv = false; });
      // the dice: the fight's own initiative rolls, a d20 a figure in the order they stand in B.units -- pinned, his 20 or his 1 against the heroes' 10s
      var d0 = D.d, us = this.units.slice(), k = 0, self = this;
      D.d = function (n) { if (D.battle === self && self.round === 0 && n === 20 && k < us.length) { var u = us[k++]; if (k >= us.length) D.d = d0; return u.kind === RF.KIND ? (first ? 20 : 1) : 10; } return d0.apply(this, arguments); };
      this.ripplesUnpin = function () { if (D.d !== d0) D.d = d0; };
    };
    return B;
  };
})();
