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

  // ---------------------------------------------------------------- the images, fetched when a scene asks for them (10-03, the lazy sheets;
  // Griz, to "The lazy load as a later cloud job?": "4 yes"): every sheet's image used to be fetched before the first screen (135 sheets,
  // 36.8 MB). Now a scene asks for its own (a fight for its units, the camp for its four: S.gate, below), and a sheet nobody asked for that
  // is drawn anyway is fetched then and drawn when it lands (S.draw). The sizes, the anchors and the rows are all in data/sprites.js, so the
  // rules never wait on an image; only the drawing does
  S.offline = false; // (the benches: nothing fetched, nothing waits -- dev/bench16.js sets it)
  var pend = {}; // image path -> its promise, so each is fetched once and a fetch under way is shared
  function srcOf(name) { var sh = D.SHEETS && D.SHEETS[name]; return sh ? sh.image : null; }
  function srcsOf(names) { var out = []; [].concat(names || []).forEach(function (n) { var s = srcOf(n); if (s && out.indexOf(s) < 0) out.push(s); }); return out; }
  // fetched and settled (loaded, or failed: a broken image never holds a frame)
  function settled(src) { var im = D.images[src]; return !!(im && im.getAttribute('src') && im.complete); }
  S.load = function (src, low) {
    if (pend[src]) return pend[src];
    var im = D.images[src];
    if (S.offline && !im) return Promise.resolve(null);
    if (settled(src)) return (pend[src] = Promise.resolve(im));
    if (!im) { im = new Image(); D.images[src] = im; }
    pend[src] = new Promise(function (res) { var fin = function () { res(im); }; im.addEventListener('load', fin); im.addEventListener('error', fin); });
    if (!im.getAttribute('src')) { if (low) im.fetchPriority = 'low'; im.src = src; } // (one D.loadImages already started keeps its own: dev/camp-shot.py)
    return pend[src];
  };
  // a promise that settles when every named sheet's image has loaded (or failed); names a sheet set doesn't have are passed over
  S.ensure = function (names, low) { return Promise.all(srcsOf(names).map(function (s) { return S.load(s, low); })); };
  S.ensureAll = function () { return S.prefetch(Object.keys(D.SHEETS || {})); }; // (every sheet, behind what a scene waits on: the spell gallery's, any creature a spell may call)
  // true when every named sheet is settled (or there is nothing to fetch)
  S.ready = function (names) { return S.offline || srcsOf(names).every(settled); };
  S.failed = function (name) { var s = srcOf(name), im = s && D.images[s]; return !!(im && settled(s) && !im.naturalWidth); };
  // what may be wanted later (a fight's summons, the camp's coming fight): fetched behind, at low priority, once what a scene is
  // waiting on has come
  S.prefetch = function (names) {
    if (S.offline) return Promise.resolve();
    var now = Object.keys(pend).map(function (k) { return pend[k]; });
    return Promise.all(now).then(function () { return S.ensure(names, true); });
  };
  // a scene's own sheets before it draws: S.gate(scene, names) starts the fetch; while it is out, S.held(scene) is true -- the scene's
  // update holds (S.held counts the frames) and its draw is the beat's (S.beat; S.held(scene, true) only looks). A wait past 20 s lets
  // the scene go on, its figures drawn as they land
  S.gate = function (o, names) {
    var g = o.sheetGate = { names: [].concat(names || []).filter(function (n, i, a) { return srcOf(n) && a.indexOf(n) === i; }), t: 0, done: false };
    g.done = S.ready(g.names);
    if (!g.done) S.ensure(g.names).then(function () { g.done = true; });
    return g;
  };
  S.held = function (o, peek) {
    var g = o && o.sheetGate;
    if (!g || g.done) return false;
    if (S.ready(g.names) || g.t > 1200) { g.done = true; return false; }
    if (!peek) g.t++;
    return true;
  };
  // the beat while a scene's sheets come: the ladder's dark, and after a moment (a wait too short to see is not shown) the 8-bit game's
  // window with a pip for each figure, lit as it lands
  S.beat = function (ctx, o) {
    var g = (o && o.sheetGate) || { names: [], t: 99 }, P = function (r, i) { return D.PAL.ramps[r][i]; };
    ctx.fillStyle = '#07060c'; ctx.fillRect(0, 0, D.W, D.H);
    if (g.t < 12) return;
    var n = g.names.length, w = Math.max(160, Math.min(D.W - 40, n * 8 + 40)), x = Math.round((D.W - w) / 2), y = Math.round(D.H / 2 - 20);
    D.win8(ctx, x, y, w, 40);
    D.text(ctx, '{y}THE FIGURES ARE COMING{/}' + ['', '.', '..', '...'][(g.t >> 4) & 3], x + w / 2 - D.textWidth('{y}THE FIGURES ARE COMING{/}') / 2, y + 8, P('gold', 4));
    var px = Math.round(D.W / 2 - (n * 8 - 2) / 2);
    g.names.forEach(function (k, i) { ctx.fillStyle = S.ready([k]) ? P('gold', 4) : P('stone', 3); ctx.fillRect(px + i * 8, y + 24, 6, 6); });
  };

  // draw one frame; t in frames at 60 Hz; returns the sprite's height above the foot (for labels and HP bars)
  // o.once: play through once and hold the last frame (an attack, a fall); o.alpha; o.flip: mirror; o.tint: a flash colour
  // the frame a sheet shows for anim and facing at t (S.draw and S.outline share it)
  function frameOf(sh, anim, facing, t, o, name) {
    var a = sh.anims[anim] || sh.anims.idle;
    var fw = a.fw || sh.fw, fh = a.fh || sh.fh, ax = a.ax != null ? a.ax : sh.ax, ay = a.ay != null ? a.ay : sh.ay;
    var n = Math.floor(t * (a.fps || 8) / 60), fr = o && o.frame != null ? Math.max(0, Math.min(a.frames - 1, o.frame)) : o && o.once ? Math.min(a.frames - 1, n) : n % a.frames; // (o.frame: one frame by number -- the prone, ui.js)
    return { img: S.rock(name, D.images[sh.image]), sx: fr * fw, sy: (a.y != null ? a.y : a.row * sh.fh) + (facing % 8) * fh, fw: fw, fh: fh, ax: ax, ay: ay };
  }
  // a creature made of the cavern's own stone (10-01e, Griz approving "browser recolor with new field"): drawn in the map's stone where
  // the map names one (data/maps.js `stone`; js/iso.js iso.ramp) -- the sheet's brown stone ramp swapped, colour for colour, for the
  // map's (the eye, the throat, the teeth are other ramps and stay), once per sheet and stone, so the roper's disguise matches the
  // stalagmites round it
  S.STONE = { roper_p1: true, grick_p1: true }; // (the grick, 10-02: its hide the den's stone -- the SRD's Stone Camouflage, Griz: "we probably go with brown given the existing maps")
  var rockCv = {};
  S.rock = function (name, img) {
    var st = D.iso && D.iso.stoneOf && D.iso.stoneOf();
    if (!st || !name || !S.STONE[name] || !img || !img.naturalWidth) return img;
    var key = name + ':' + st; if (rockCv[key]) return rockCv[key];
    var cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    var cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
    var id = cx.getImageData(0, 0, cv.width, cv.height), px = id.data, to = D.iso.ramp('stone'), swap = {};
    D.PAL.ramps.stone.forEach(function (c, i) { swap[parseInt(c.slice(1), 16)] = to[i]; });
    for (var p = 0; p < px.length; p += 4) { if (!px[p + 3]) continue; var s = swap[(px[p] << 16) | (px[p + 1] << 8) | px[p + 2]]; if (s) { px[p] = s[0]; px[p + 1] = s[1]; px[p + 2] = s[2]; } }
    cx.putImageData(id, 0, 0);
    return (rockCv[key] = cv);
  };
  S.draw = function (ctx, name, anim, facing, t, x, y, o) {
    var sh = D.SHEETS && D.SHEETS[name];
    if (!sh || (!S.has(name) && (S.offline || S.failed(name)))) return S.placeholder(ctx, name, x, y, o);
    if (!S.has(name)) { S.load(sh.image); if (/^keeper_p/.test(name)) return S.capsule(ctx, x, y, o); return sh.top || sh.ay; } // (asked for by nobody, or still on its way: fetched now, drawn when it lands; the Keeper's sheets show a capsule meanwhile -- js/keeper.js)
    var f = frameOf(sh, anim, facing, t, o, name), img = f.img, fw = f.fw, fh = f.fh, ay = f.ay, sy = f.sy;
    var dx = Math.round(x - f.ax), dy = Math.round(y - ay), fr = f.sx / fw;
    ctx.save();
    if (o && o.alpha != null) ctx.globalAlpha = o.alpha;
    if (o && o.lie) { ctx.translate(x, y); ctx.rotate(-Math.PI / 2 + (o.rock || 0)); ctx.translate(-x, -y + 6); } // (o.rock: one down laughing shakes with it -- js/ui.js, 10-02)
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
  // the frame's outline alone, in one colour: its silhouette grown a pixel each way, the silhouette cut out of it
  // (the x-ray: a figure hidden behind another shows through as this -- ui.js xray)
  S.outline = function (ctx, name, anim, facing, t, x, y, color, o) {
    var sh = D.SHEETS && D.SHEETS[name];
    if (!sh || !S.has(name)) { if (sh && !S.offline) S.load(sh.image); return; }
    var f = frameOf(sh, anim, facing, t, o, name), w = f.fw + 2, h = f.fh + 2, oc = S.tintCanvas(w, h), ox = oc.getContext('2d');
    ox.globalCompositeOperation = 'source-over'; ox.clearRect(0, 0, w, h);
    [[0, 1], [2, 1], [1, 0], [1, 2]].forEach(function (d) { ox.drawImage(f.img, f.sx, f.sy, f.fw, f.fh, d[0], d[1], f.fw, f.fh); });
    ox.globalCompositeOperation = 'source-in'; ox.fillStyle = color; ox.fillRect(0, 0, w, h);
    ox.globalCompositeOperation = 'destination-out'; ox.drawImage(f.img, f.sx, f.sy, f.fw, f.fh, 1, 1, f.fw, f.fh);
    ox.globalCompositeOperation = 'source-over';
    ctx.save();
    if (o && o.alpha != null) ctx.globalAlpha = o.alpha;
    if (o && o.scale && o.scale !== 1) { ctx.translate(x, y); ctx.scale(o.scale, o.scale); ctx.translate(-x, -y); } // (o.scale: a grown or shrunk figure, about its foot)
    ctx.drawImage(oc, Math.round(x - f.ax) - 1, Math.round(y - f.ay) - 1);
    ctx.restore();
  };
  S.anim = function (name, anim) { var sh = D.SHEETS && D.SHEETS[name]; return sh && sh.anims[anim]; };
  // the frame a figure lies at while prone (10-01b, Griz: "Seems like we don't have prone for all the pretty characters we've made (and I
  // guess we'd need at least 1 other frame for getting up from prone)" -- "I'd lean 'frame before last' if that's what they look like when
  // they're almost dead but not dead yet ... we extracted 'wizard' and such from other sources and hopefully they have the frames already -
  // those are the ones that are going to be onscreen and prone most often"): the LPC sheets' fall row (six frames, the last flat on the
  // back) has him crumpled forward on hands and knees at its frame before last; getting up is the row played back from there. The other
  // sheets' death rows end dead (and the owl's in feathers): none yet, -1 (deep16-art-wanted.md, PRONE someday). S.PRONE: a sheet's own
  // frame, picked by eye off its row, where one reads
  S.PRONE = { grick_p1: 3 }; // (the xorn's and the roper's have a `prone` row of their own since 10-02: S.proneRow below) // (the grick, 10-02: its death row drops its neck to the ground, frame 3 half fallen) // (the xorn, pipeline 1b: its death row settles it half into the floor, arms drooping; a third of the way in at frame 3 -- tools/xorn-blend.py, 10-01d. The roper: its tendrils slack on the floor, barely sunk -- tools/roper-blend.py, 10-01e)
  // a sheet with a `prone` row of its own (10-02, the xorn's and the roper's: their deaths sink into the floor, which read as going under, not
  // as knocked flat -- Griz: "The old one might be a good prone if 3 is no good"): it falls through that row, lies at its last frame, and gets
  // up through it backwards; one that dies lying there stays as it lies. Any other: a frame of its death row, as above
  S.proneRow = function (name) { return S.anim(name, 'prone') ? 'prone' : 'hurt'; };
  S.proneFrame = function (name) { var pr = S.anim(name, 'prone'); if (pr) return pr.frames - 1; if (S.PRONE[name] != null) return S.PRONE[name]; var a = S.anim(name, 'hurt'); return a && /_p0$/.test(name) && a.frames === 6 ? 4 : -1; };
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
  // how big a figure is drawn (Enlarge, 09-29): conds.enlarged 1.5x, Reduce (.down) 0.7x, the duergar's own Enlarge (u.grown: a flag for
  // the look alone, ai.js) 1.5x -- about its foot; the footprint (u.size) stays. A change eases in over SCALE.frames from the size it
  // had, with a little overshoot (S.regrow(u, from) marks the change; the pulse at the cast)
  S.SCALE = { up: 1.5, down: 0.7, frames: 26 };
  S.scaleTarget = function (u) { var e = u.conds && u.conds.enlarged; return (e ? (e.down ? S.SCALE.down : S.SCALE.up) : u.grown ? S.SCALE.up : 1) * (u.drawScale || 1); }; // (drawScale: a stand-in sheet shrunk to a familiar's size)
  S.scaleOf = function (u) {
    var to = S.scaleTarget(u), g = u.scaleEase, a = g && D.battle ? (D.battle.t - g.t) / S.SCALE.frames : 1;
    if (!g || a >= 1 || a < 0 || g.from === to) return to;
    var b = a - 1, ease = 1 + 2.70158 * b * b * b + 1.70158 * b * b; // (ease-out-back: it swells past and settles)
    return g.from + (to - g.from) * ease;
  };
  S.regrow = function (u, from) { if (from !== S.scaleTarget(u)) u.scaleEase = { from: from, t: D.battle ? D.battle.t : 0 }; };
  // how tall a unit stands above its foot (HP bars, labels, picking): the figure as drawn, so a grown one's bar sits on its head
  S.unitTop = function (u) { return (u.rider ? S.RIDE.lift - S.RIDE.cut + S.top(u.rider) : S.top(u.sheet)) * S.scaleOf(u) * (u.proneLook && u.hp > 0 && S.proneFrame(u.sheet) >= 0 ? 0.6 : 1); }; // (lying prone, on hands and knees: about 0.6 of its height -- its bar, its marks, where the mouse finds it)

  // until a sheet exists: a capsule in the unit's colour, so the grid can be built before the art lands
  // a cool capsule for the Keeper's figure and its water while a sheet of its is late (10-03: the lazy sheets; the scene's own gate holds the first frames, this is for a sheet that lands after)
  S.capsule = function (ctx, x, y, o) {
    var a = (o && o.alpha != null) ? o.alpha : 1; ctx.save(); ctx.globalAlpha = a * 0.7; ctx.fillStyle = 'rgba(10,20,40,.45)'; ctx.beginPath(); ctx.ellipse(x, y, 18, 8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4aa8d8'; ctx.beginPath(); ctx.moveTo(x - 10, y - 4); ctx.lineTo(x - 10, y - 46); ctx.arc(x, y - 46, 10, Math.PI, 0); ctx.lineTo(x + 10, y - 4); ctx.arc(x, y - 4, 10, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(210,245,255,.45)'; ctx.fillRect(x - 6, y - 46, 4, 38); ctx.restore(); return 56;
  };
  S.placeholder = function (ctx, name, x, y, o) {
    var col = (o && o.color) || '#8a96aa';
    ctx.fillStyle = 'rgba(10,8,16,.5)'; ctx.beginPath(); ctx.ellipse(x, y, 11, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#0a0810'; ctx.fillRect(x - 7, y - 41, 14, 40);
    ctx.fillStyle = col; ctx.fillRect(x - 6, y - 40, 12, 38);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x - 6, y - 40, 4, 38);
    return 42;
  };
})();
