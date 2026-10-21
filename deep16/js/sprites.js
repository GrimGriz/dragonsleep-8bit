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
  function srcsOf(names) { var out = []; [].concat(names || []).forEach(function (n) { [n].concat(undersOf(n)).forEach(function (m) { var s = srcOf(m); if (s && out.indexOf(s) < 0) out.push(s); }); }); return out; }
  function undersOf(name) { var sh = D.SHEETS && D.SHEETS[name], out = []; if (sh) Object.keys(sh.anims).forEach(function (k) { var u = sh.anims[k].under; if (u && out.indexOf(u) < 0) out.push(u); }); return out; } // (the sheets a sheet's rows fall back on, fetched with it: frameOf below; a fight counts them among its own, js/battle.js sheets)
  S.unders = undersOf;
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
  // a row the art desk has not drawn in every view (10-20, Barley's ART-75/76: the views it left OPEN are left out of barley_p2): its `drawn` lists the
  // facings it has; another facing plays the row from its `under` sheet where it names one and that sheet has it (his walk: barley_p0's, the old walk
  // till the desk draws a walk that does not repeat a leg), and otherwise from the nearest drawn facing, on its own side of the screen first
  function frameOf(sh, anim, facing, t, o, name) {
    var a = sh.anims[anim] || sh.anims.idle;
    if (a.drawn && a.drawn.indexOf(facing % 8) < 0) {
      var un = a.under && D.SHEETS[a.under];
      if (un && un.anims[anim] && S.has(a.under)) return frameOf(un, anim, facing, t, o, a.under);
      facing = S.nearFacing(a.drawn, facing % 8);
    }
    var fw = a.fw || sh.fw, fh = a.fh || sh.fh, ax = a.ax != null ? a.ax : sh.ax, ay = a.ay != null ? a.ay : sh.ay;
    var n = Math.floor(t * (a.fps || 8) / 60), fr = o && o.frame != null ? Math.max(0, Math.min(a.frames - 1, o.frame)) : o && o.once ? Math.min(a.frames - 1, n) : n % a.frames; // (o.frame: one frame by number -- the prone, ui.js)
    return { img: S.rock(name, sh.eyes ? S.eyed(name, sh, D.images[sh.image]) : D.images[sh.image]), sx: fr * fw, sy: (a.y != null ? a.y : a.row * sh.fh) + (facing % 8) * fh, fw: fw, fh: fh, ax: ax, ay: ay,
      sheet: name, anim: sh.anims[anim] ? anim : 'idle', facing: facing % 8, fr: fr, frames: a.frames, release: a.release }; // (which frame it chose, for the weapon drawn in the hands: S.wield below)
  }
  // the frame S.draw would draw for these arguments: { img, sx, sy, fw, fh, ax, ay }, or null while the sheet is on its way (the mirror ripple
  // reads it to lay its scales over the same pixels: js/looks.js LK.ripple, 10-08)
  // the drawn facing nearest f round the eight (S SW W NW N NE E SE); of two as near, the one on f's side of the screen (SW W NW the left, NE E SE the
  // right; S and N take the right, the side the desk draws)
  S.nearFacing = function (drawn, f) {
    var side = function (x) { return x >= 1 && x <= 3 ? -1 : 1; };
    for (var d = 1; d <= 4; d++) {
      var c = [(f + d) % 8, (f + 8 - d) % 8].filter(function (x) { return drawn.indexOf(x) >= 0; });
      if (c.length) return c.sort(function (p, q) { return (side(p) === side(f) ? 0 : 1) - (side(q) === side(f) ? 0 : 1); })[0];
    }
    return f;
  };
  S.frameAt = function (name, anim, facing, t, o) { var sh = D.SHEETS && D.SHEETS[name]; return sh && S.has(name) ? frameOf(sh, anim, facing, t, o, name) : null; };
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
  // a sheet's mirror eyes in another colour (10-08, Griz, of the Harbinger's double: "from the mirror realm and has purple in the eyes (by code?)"): a sheet entry with `eyes` (a ramp of
  // the palette: js/traits.js TR.voidSheet lays one over his sheet as mirrorgnoll_p1_void) is drawn from its image with the mirror's pale pixels in the upper part of each figure -- the
  // eyes, as js/trophy.js eyeSpots finds them -- laid in that ramp, light for light; made once a name, when the image has come
  var eyedCv = {};
  S.eyed = function (name, sh, img) {
    if (!img || !img.naturalWidth) return img;
    if (eyedCv[name]) return eyedCv[name];
    var cv = document.createElement('canvas'), W = cv.width = img.naturalWidth, H = cv.height = img.naturalHeight, cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
    var id = cx.getImageData(0, 0, W, H), px = id.data, rp = (D.PAL.ramps[sh.eyes] || D.PAL.ramps.violet).map(function (c) { var v = parseInt(c.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; });
    var to = [rp[rp.length - 2], rp[rp.length - 1], [214, 140, 255]], done = {}; // (the mid, the light, and a glint: the mirror's white as a bright purple; done: a cell two rows share, once)
    Object.keys(sh.anims).forEach(function (k) {
      var a = sh.anims[k], fw = a.fw || sh.fw, fh = a.fh || sh.fh, ay = a.ay != null ? a.ay : sh.ay, y0 = a.y != null ? a.y : a.row * sh.fh;
      for (var f = 0; f < a.frames; f++) for (var fc = 0; fc < 8; fc++) {
        var ox = f * fw, oy = y0 + fc * fh, top = -1, x, y;
        if (oy + fh > H || ox + fw > W || done[ox + ',' + oy]) continue;
        done[ox + ',' + oy] = 1;
        for (y = 0; y < fh && top < 0; y++) for (x = 0; x < fw; x++) if (px[((oy + y) * W + ox + x) * 4 + 3]) { top = y; break; }
        if (top < 0) continue;
        for (y = top; y < top + (ay - top) * 0.6; y++) for (x = 0; x < fw; x++) {
          var i = ((oy + y) * W + ox + x) * 4, hi = y < top + (ay - top) * 0.3; // (side-on his eye's glint is the palette's warm white: taken in the head's own band only, above the teeth)
          if (!px[i + 3] || !((px[i + 2] > 190 && px[i + 1] > 170 && px[i + 2] >= px[i]) || (hi && px[i] > 235 && px[i + 1] > 235 && px[i + 2] > 235))) continue;
          var l = (px[i] + px[i + 1] + px[i + 2]) / 3, c = to[l > 240 ? 2 : l > 215 ? 1 : 0];
          px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
        }
      }
    });
    cx.putImageData(id, 0, 0);
    return (eyedCv[name] = cv);
  };
  S.draw = function (ctx, name, anim, facing, t, x, y, o) {
    var sh = D.SHEETS && D.SHEETS[name];
    if (!sh || (!S.has(name) && (S.offline || S.failed(name)))) return S.placeholder(ctx, name, x, y, o);
    if (!S.has(name)) { S.load(sh.image); if (/^keeper_p/.test(name)) return S.capsule(ctx, x, y, o); return sh.top || sh.ay; } // (asked for by nobody, or still on its way: fetched now, drawn when it lands; the Keeper's sheets show a capsule meanwhile -- js/keeper.js)
    var f = frameOf(sh, anim, facing, t, o, name), img = f.img, fw = f.fw, fh = f.fh, ay = f.ay, sy = f.sy;
    var dx = Math.round(x - f.ax), dy = Math.round(y - ay), fr = f.sx / fw;
    var wg = o && o.wield && !o.lie ? S.gripAt(f, o.wield) : null; // (the weapon drawn in the hands of an empty-handed sheet: S.wield below)
    ctx.save();
    if (o && o.alpha != null) ctx.globalAlpha = o.alpha;
    if (o && o.stone) ctx.filter = 'grayscale(1) brightness(1.08) contrast(0.92)'; // (a statue: its own shading in grey -- petrified, js/ui.js, 10-08)
    if (o && o.lie) { ctx.translate(x, y); ctx.rotate(-Math.PI / 2 + (o.rock || 0)); ctx.translate(-x, -y + 6); } // (o.rock: one down laughing shakes with it -- js/ui.js, 10-02)
    if (wg && wg.under) S.wield(ctx, wg, Math.round(x), Math.round(y));
    ctx.drawImage(img, fr * fw, sy, fw, fh, dx, dy, fw, fh);
    if (wg && !wg.under) { // over him, his fists drawn again on top so the hands close on the shaft
      S.wield(ctx, wg, Math.round(x), Math.round(y));
      wg.fists.forEach(function (p) { // (a 5x5 of the frame round each fist, kept inside the frame's own cell)
        var cx0 = Math.max(0, Math.round(x + p[0]) - 2 - dx), cy0 = Math.max(0, Math.round(y + p[1]) - 2 - dy), cx1 = Math.min(fw, cx0 + 5), cy1 = Math.min(fh, cy0 + 5);
        if (cx1 > cx0 && cy1 > cy0) ctx.drawImage(img, fr * fw + cx0, sy + cy0, cx1 - cx0, cy1 - cy0, dx + cx0, dy + cy0, cx1 - cx0, cy1 - cy0);
      });
    }
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
  // what is in the hand (10-20, Griz: "there's quarterstaff zips in Fresh"; Aurdin's ART-72/73 supplements; S.inHand, not S.held -- that is the sheet gate's): a sheet with rows for a held thing plays
  // them while the hand holds it, its weapon by its sort (u.weapon.kind) and not put away -- the staff's guard for idle (its planted rest out of a
  // fight, `calm`), its carry for walk, the staff as focus for every cast, its strike for a blow (the cast's thrust where no strike is drawn); the
  // dagger's stab for a blow. Drawn only: what the engine sets (u.anim) and times stays the row it names, each pair the same length
  S.HELD = { quarterstaff: { idle: 'staffidle', walk: 'staffwalk', cast: 'staffcast', castup: 'staffcast', attack: 'staffstrike|staffcast' }, dagger: { attack: 'dagger' } };
  S.inHand = function (u, anim, calm) {
    var sh = u && D.SHEETS && D.SHEETS[u.sheet], w = u && !u.sheathed && u.weapon, m = sh && w && S.HELD[w.kind]; if (!m) return anim;
    if (anim === 'idle' && calm && m === S.HELD.quarterstaff && sh.anims.staffrest) return 'staffrest';
    var to = m[anim]; if (!to) return anim;
    var opts = to.split('|'); for (var i = 0; i < opts.length; i++) if (sh.anims[opts[i]]) return opts[i];
    return anim;
  };
  // the weapon drawn by code in the hands (10-20, the Barley chain seat; Griz: "Had it make empty-handed two handed weapon strikes, try code flail and
  // battle axe implementation"): a sheet drawn empty-handed carries `grips` (tools/barley-sheet.py, measured off the art desk's pixels: for each row,
  // facing and frame the lead fist, the rear fist and flags, from the foot -- 1 under the figure, where his body hides the hands (N, NE, NW); 2 and 4
  // the lead and the rear fist on the shaft; 8 the weapon on the floor, he being down). The shaft runs from the rear fist through the lead one and on;
  // drawn over him, his fists are drawn again on top so the hands close on it. A shape a sort of weapon (S.wieldOf: what the hand holds), in game px:
  // the THRESHING FLAIL his own -- a long wooden handstaff, a short link and one short wooden beater, no spikes, no ball; the beater hangs on its link and
  // trails the swing (the hinge's way from the frame before), and lies out straight along the staff at the blow (the row's release frame); the
  // BATTLEAXE a haft in both hands with one bearded blade at its head, the edge turned the way he faces. ?nowield (S.WIELD.off) draws none of it
  S.WIELD = {
    off: /[?&]nowield\b/.test(location.search),
    flail: { staff: 30, over: 13, link: 2, beater: 10 }, // (over: the staff on past the lead fist to the hinge -- the beater hangs clear of his hands, his eye 10-20: "it put the business end of the flail in his hands")
    battleaxe: { staff: 27, over: 9, blade: 6, beard: 4 }
  };
  S.wieldOf = function (u) {
    var w = u && !u.sheathed && u.weapon, sh = u && D.SHEETS && D.SHEETS[u.sheet]; if (!w || !sh || !sh.grips) return null;
    if (w.kind === 'flail' || /threshingflail/.test(w.id || '')) return 'flail';
    if (w.kind === 'battleaxe' || w.kind === 'greataxe') return 'battleaxe';
    return null;
  };
  // the grip of the frame S.frameAt chose: { kind, L, R, u (the shaft's way), under, floor, fists, prev (the lead fist a frame before), blow }
  S.gripAt = function (f, kind) {
    var sh = f && D.SHEETS[f.sheet], g = sh && sh.grips && sh.grips[f.anim], row = g && gripRow(f.sheet, f.anim, f.facing, g[f.facing]), k = row && row[f.fr];
    if (!k || S.WIELD.off || !S.WIELD[kind]) return null;
    var pk = row[(f.fr + row.length - 1) % row.length], ux = k[0] - k[2], uy = k[1] - k[3], n = Math.hypot(ux, uy) || 1;
    var fists = []; if (k[4] & 2) fists.push([k[0], k[1]]); if (k[4] & 4) fists.push([k[2], k[3]]);
    return { kind: kind, L: [k[0], k[1]], R: [k[2], k[3]], u: [ux / n, uy / n], under: !!(k[4] & 1), floor: !!(k[4] & 8), fists: fists, facing: f.facing,
      prev: [pk[0], pk[1]], blow: f.release != null && f.fr === f.release }; // (the blow lands on the release frame: js/battle.js)
  };
  var gripRows = {}; // (a facing's frames come as one string, "lx ly rx ry flags;..." -- parsed once)
  function gripRow(name, anim, facing, txt) {
    var key = name + ':' + anim + ':' + facing; if (gripRows[key] !== undefined) return gripRows[key];
    return (gripRows[key] = txt ? txt.split(';').map(function (k) { return k.split(' ').map(Number); }) : null);
  }
  var FACE = [[0, 1], [-0.89, 0.45], [-1, 0], [-0.89, -0.45], [0, -1], [0.89, -0.45], [1, 0], [0.89, 0.45]]; // (the way each facing looks, on the screen)
  // stamp a line of s x s squares (pixel art: no smoothing), from (x0, y0) to (x1, y1)
  function stamp(ctx, x0, y0, x1, y1, s, c) {
    ctx.fillStyle = c; var n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)), h = (s - 1) / 2;
    for (var i = 0; i <= n; i++) { var t = i / n; ctx.fillRect(Math.round(x0 + (x1 - x0) * t - h), Math.round(y0 + (y1 - y0) * t - h), s, s); }
  }
  S.wield = function (ctx, g, x, y) {
    var P = function (r, i) { return D.PAL.ramps[r][i]; }, OUT = P('outline', 0), W = S.WIELD[g.kind], u = g.u, L = g.L, R = g.R;
    if (g.floor) { u = [1, 0]; } // (on the floor: laid flat beside him, the lead end toward L)
    var top = [x + L[0] + u[0] * W.over, y + L[1] + u[1] * W.over], len = Math.max(W.staff, Math.hypot(top[0] - x - R[0], top[1] - y - R[1]) + 3);
    var butt = [top[0] - u[0] * len, top[1] - u[1] * len];
    if (g.kind === 'flail') {
      var b; // the beater's way: it hangs, trails the swing, and lies out straight at the blow
      if (g.blow) b = u.slice();
      else if (g.floor) b = [1, 0];
      else { var vx = L[0] - g.prev[0], vy = L[1] - g.prev[1], bx = -vx * 0.35, by = 1 - vy * 0.35, bn = Math.hypot(bx, by) || 1; b = [bx / bn, by / bn]; }
      var h0 = [top[0] + b[0] * W.link, top[1] + b[1] * W.link], h1 = [h0[0] + b[0] * W.beater, h0[1] + b[1] * W.beater];
      stamp(ctx, butt[0], butt[1], top[0], top[1], 3, OUT); stamp(ctx, top[0], top[1], h0[0], h0[1], 2, OUT); stamp(ctx, h0[0], h0[1], h1[0], h1[1], 4, OUT);
      stamp(ctx, butt[0], butt[1], top[0], top[1], 1, P('leather', 3)); stamp(ctx, top[0], top[1], h0[0], h0[1], 1, P('leather', 1));
      stamp(ctx, h0[0], h0[1], h1[0], h1[1], 2, P('stone', 6)); stamp(ctx, h0[0] - b[1] * 0.5, h0[1] + b[0] * 0.5, h1[0] - b[1] * 0.5, h1[1] + b[0] * 0.5, 1, P('stone', 7));
      return;
    }
    // the battleaxe: its haft, then one bearded blade on the side he faces (or up, on the floor)
    stamp(ctx, butt[0], butt[1], top[0], top[1], 3, OUT); stamp(ctx, butt[0], butt[1], top[0], top[1], 1, P('leather', 3));
    var fc = FACE[g.facing || 0], p = [-u[1], u[0]]; if (g.floor ? p[1] > 0 : p[0] * fc[0] + p[1] * fc[1] < 0 || (Math.abs(p[0] * fc[0] + p[1] * fc[1]) < 0.15 && p[0] < 0)) p = [u[1], -u[0]];
    var x0 = Math.floor(top[0] - 10), y0 = Math.floor(top[1] - 10);
    for (var pass = 0; pass < 2; pass++) for (var j = 0; j < 21; j++) for (var i = 0; i < 21; i++) {
      var qx = x0 + i + 0.5 - top[0], qy = y0 + j + 0.5 - top[1], s = -(qx * u[0] + qy * u[1]), t = qx * p[0] + qy * p[1], o = pass ? 0 : 1;
      var lo = 0.5 - 0.45 * (t - 1) - o, hi = 3.5 + (W.beard / W.blade) * (t - 1) + o; // (the blade flares toward its edge, its beard hanging down the haft)
      if (t >= 1 - o && t <= W.blade + o && s >= lo && s <= hi) { ctx.fillStyle = pass ? (t > W.blade - 1.2 ? P('silver', 6) : t < 2 ? P('silver', 3) : P('silver', 5)) : OUT; ctx.fillRect(x0 + i, y0 + j, 1, 1); }
    }
  };
  // one frame's drawn pixels, from its anchor (the foot), cached; null till the sheet has loaded. Where a figure lying flat is under the mouse (ui.js
  // UI.pickUnit -- 10-05, his play: Lymen's flask at the troll lying at 32,22 went to the floor five clicks of six, the troll's body drawn three squares
  // long and the mouse finding it only in a box over its feet). S.frameHit: is a drawn pixel within `pad` of (lx, ly), the mouse from the foot in the
  // sheet's pixels -- the body, not the box round it, so a hero standing in the box's empty corner is still the hero's to click
  var masks = {};
  S.frameMask = function (name, anim, facing, frame) {
    var sh = D.SHEETS && D.SHEETS[name]; if (!sh || !sh.anims[anim] || !S.has(name)) return null;
    var key = name + ':' + anim + ':' + (facing % 8) + ':' + frame; if (masks[key] !== undefined) return masks[key];
    var f = frameOf(sh, anim, facing, 0, { frame: frame }, name), w = f.fw, h = f.fh, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var m = new Uint8Array(w * h), any = false;
    try {
      var cx = cv.getContext('2d'); cx.drawImage(f.img, f.sx, f.sy, w, h, 0, 0, w, h);
      var px = cx.getImageData(0, 0, w, h).data;
      for (var i = 0; i < w * h; i++) if (px[i * 4 + 3] > 40) { m[i] = 1; any = true; }
    } catch (e) { return (masks[key] = null); }
    return (masks[key] = any ? { w: w, h: h, ax: f.ax, ay: f.ay, m: m } : null);
  };
  S.frameHit = function (mk, lx, ly, pad) {
    var cx = Math.round(lx + mk.ax), cy = Math.round(ly + mk.ay);
    for (var j = cy - pad; j <= cy + pad; j++) for (var i = cx - pad; i <= cx + pad; i++) if (i >= 0 && j >= 0 && i < mk.w && j < mk.h && mk.m[j * mk.w + i]) return true;
    return false;
  };
  S.proneFrame = function (name) { var pr = S.anim(name, 'prone'); if (pr) return pr.frames - 1; if (S.PRONE[name] != null) return S.PRONE[name]; var a = S.anim(name, 'hurt'); return a && /_p0$/.test(name) && a.frames === 6 ? 4 : -1; };
  // how long an anim takes to play once, in frames at 60 Hz
  S.duration = function (name, anim) { var a = S.anim(name, anim); return a ? Math.ceil(a.frames * 60 / (a.fps || 8)) : 0; };
  S.top = function (name) { var sh = D.SHEETS && D.SHEETS[name]; return sh ? sh.top || 48 : 42; };
  // how far above its foot a figure's drawn top is: its idle row, facing south, the first frame, from its pixels (S.top, the sheet's word, till it has loaded)
  S.drawnTop = function (name) {
    var mk = S.frameMask(name, 'idle', 0, 0); if (!mk) return S.top(name);
    if (mk.top == null) { mk.top = 0; for (var j = 0; j < mk.h; j++) { var on = false; for (var i = 0; i < mk.w; i++) if (mk.m[j * mk.w + i]) { on = true; break; } if (on) { mk.top = mk.ay - j; break; } } }
    return mk.top;
  };
  // where a portrait box puts a figure's foot (10-14, Griz: "a lot of the bottom right portraits are monster crotch" -- "It's on the grid when it's the enemies turn - also greyfang
  // in the party menu"): a figure that fits stands whole in the box, centred; a taller one shows its head and what is under it, 2 px below the box's top; a sheet's own `face` (px
  // above its foot) centred, as the Harbinger's. Before, each box set the foot by the sheet's `top` with a cap -- 30 px for a big one in the bottom bar: a troll's hips
  S.portraitY = function (name, boxY, boxH) {
    var fc = D.SHEETS && D.SHEETS[name] && D.SHEETS[name].face, h = S.drawnTop(name);
    if (fc != null) return Math.round(boxY + boxH / 2 + fc);
    return Math.round(h <= boxH - 2 ? boxY + boxH / 2 + h / 2 : boxY + 2 + h);
  };

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
