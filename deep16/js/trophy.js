/* DEEP16 -- GreyFang's end (10-08, the GreyFang window): the ending of a fight that says `trophy` (data/fights.js greyfang, GreyFang's pit).
   Griz, 10-08: "presently leaning toward direct old one intervention after apparent party victory - cutscene type Harbinger revive, obtain trophy, escape";
   "I was thinking a headless sprite falling across the screen onto the grid prone"; "you're kinda the GreyFang sprite guy, no window better suited to finish
   him off". Seen, and re-cut on his notes: "The Old One's intervention is not a thin purple oval. Rapid mirror effect over his whole body, dead to standing to
   floating up in the air (increasing speed mirror effect) - climax - mirror effect in (or applied to pounce cloud on drop back to the ground - face zoom 'the
   Mane is Mine' eyeflash ... try same voice as 'kneel'"; "Pounce onto GreyFang. Leap into the sky with him holding onto a living or down GreyFang as
   appropriate. 'Into the sky' is blue background with map tile horizon to only blue background. Zoom in on faces. Camera to blue sky panning toward the
   ground, body sprite falls faster than pan. Pan down on end scene as present"; "More 'frames between beats'"; "You're either zoomed in too much or too low".
   The fight is won when the Harbinger is down; then, before the win is read, on the map's camera (Battle.camTo) with the turn strip and the bar put away
   (B.cine, the show's way): the mirror passes over him faster and faster as he stands and rises off the ground (u.fz, the grid's own height), the climax,
   the drop into a cloud of dust and mirror glints, his face close -- "The Mane is mine." (the Mane: the gnolls' paramount relic, TarlynsPit/wiki/gnoll-hills.md;
   deep16/audio/the_mane_is_mine.mp3, the Kneel's voice) -- the Pounce onto GreyFang, the two of them up off the map into the sky (the STAGE below: a screen
   of blue over the world, the map's last picture sliding away under them), their faces, the flash, the body falling faster than the camera pans down after
   it, and the end as it was: the body headless on the sand, his bow beside it. The words on the cards are the seat's drafts (invented.json #greyfangs-end). */
(function () {
  var D = window.D16, G = D.grid, FX = D.fx, BP = D.Battle.prototype;
  function free(B, x, y) { var t = G.map.at(x, y); return !!(t && t.walk) && !G.occupant(x, y) && x >= 0 && y >= 0 && x < G.map.w && y < G.map.h; }
  function ease(q) { q = Math.max(0, Math.min(1, q)); return q * q * (3 - 2 * q); }
  // the camera on one, a little above the middle of the view (+gx is SE on screen, +gy SW: a touch of both looks a little below it); a point's height is the ground's
  function camOn(B, u, zoom, ticks, up) { var s = (u.size || 1) - 1, gz = (u.sheet ? G.gzAt(u, u.x, u.y) : G.map.gz(Math.round(u.x), Math.round(u.y))) + (up || 0); return B.camTo({ gx: u.x + s / 2 + 0.35, gy: u.y + s / 2 + 0.35, gz: gz }, zoom, ticks); }
  function word(path, text) { var say = function () { if (D.say) D.say(text, { pitch: 0.4, rate: 0.8 }); }; if (D.clip) D.clip(path, function (ok) { if (!ok) say(); }); else say(); } // (his recorded voice, as js/traits.js says Kneel)
  function frameH(name, anim) { var a = D.spr.anim(name, anim); return a ? a.frames : 1; }

  // ------------------------------------------------------------------ the STAGE: a screen-space picture over the world (FX `screen`, as the roost's swarm is),
  // driven by the ending through S: the sky (blue, deeper at the top, a few clouds going by), the map's last picture (S.snap, taken the first frame it is asked)
  // at S.mapY below its place, the figures drawn by the sprites at S.scale, a face close (S.face), a flash (S.flash) and a darkening (S.dim)
  // the black beyond the map's edge in its picture, see-through: a flood from the picture's edges through the void's own colour (a dark pixel inside the
  // map, an outline, is not reached), so the sky shows above the map's top corner and the map's edge is the horizon
  function clearVoid(c) {
    var g = c.getContext('2d'), W = c.width, H = c.height, im = g.getImageData(0, 0, W, H), a = im.data, seen = new Uint8Array(W * H), st = [];
    var dark = function (i) { return a[i] < 28 && a[i + 1] < 26 && a[i + 2] < 40; };
    for (var x = 0; x < W; x++) { st.push(x); st.push((H - 1) * W + x); }
    for (var y = 0; y < H; y++) { st.push(y * W); st.push(y * W + W - 1); }
    while (st.length) {
      var p = st.pop(); if (seen[p]) continue; seen[p] = 1;
      if (!dark(p * 4)) continue;
      a[p * 4 + 3] = 0;
      var px = p % W, py = (p / W) | 0;
      if (px > 0) st.push(p - 1); if (px < W - 1) st.push(p + 1); if (py > 0) st.push(p - W); if (py < H - 1) st.push(p + W);
    }
    g.putImageData(im, 0, 0);
  }
  // where the eyes are on a sprite's frame (px from its foot): its brightest cold pixels -- the mirrors -- in the top of the figure, one spot each side
  var EYES = {};
  function eyeSpots(sheet, anim, facing) {
    var key = sheet + ':' + anim + ':' + facing; if (EYES[key]) return EYES[key];
    var f = D.spr.frameAt(sheet, anim, facing, 0, { frame: 0 }); if (!f || !f.img) return (EYES[key] = []);
    var c = document.createElement('canvas'); c.width = f.fw; c.height = f.fh; var g = c.getContext('2d'); g.drawImage(f.img, f.sx, f.sy, f.fw, f.fh, 0, 0, f.fw, f.fh);
    var d = g.getImageData(0, 0, f.fw, f.fh).data, top = f.fh, pts = [];
    for (var y = 0; y < f.fh; y++) for (var x = 0; x < f.fw; x++) if (d[(y * f.fw + x) * 4 + 3] > 0) { top = Math.min(top, y); }
    for (y = top; y < top + (f.ay - top) * 0.6; y++) for (x = 0; x < f.fw; x++) { var i = (y * f.fw + x) * 4; if (d[i + 3] > 0 && d[i + 2] > 190 && d[i + 1] > 170 && d[i + 2] >= d[i]) pts.push([x, y]); }
    if (!pts.length) return (EYES[key] = []);
    var mx = pts.reduce(function (s, p) { return s + p[0]; }, 0) / pts.length, L = pts.filter(function (p) { return p[0] <= mx; }), R = pts.filter(function (p) { return p[0] > mx; });
    var mean = function (ps) { return ps.length ? [ps.reduce(function (s, p) { return s + p[0]; }, 0) / ps.length - f.ax, ps.reduce(function (s, p) { return s + p[1]; }, 0) / ps.length - f.ay] : null; };
    return (EYES[key] = [mean(L), mean(R)].filter(Boolean));
  }
  function stage(B) {
    var S = { mapY: 0, figs: [], face: null, flash: 0, dim: 0, sky: 0, clouds: [], want: false, snap: null };
    for (var i = 0; i < 7; i++) S.clouds.push({ x: Math.random() * D.W, y: 20 + Math.random() * (D.H - 80), w: 30 + Math.random() * 50, v: 0.15 + Math.random() * 0.35 });
    S.fx = FX.add({ kind: 'trophystage', screen: true, dur: 1e9, draw: function (ctx) {
      var W = D.W, H = D.H;
      if (S.want && !S.snap) { var c = document.createElement('canvas'); c.width = ctx.canvas.width; c.height = ctx.canvas.height; c.getContext('2d').drawImage(ctx.canvas, 0, 0); clearVoid(c); S.snap = c; }
      if (S.sky > 0) {
        ctx.globalAlpha = Math.min(1, S.sky);
        var gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1d3b86'); gr.addColorStop(0.6, '#3f78c8'); gr.addColorStop(1, '#8cc0ee');
        ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#e8f2ff';
        S.clouds.forEach(function (cl) { cl.y -= cl.v * (S.rising || 0) - cl.v * (S.sinking || 0); if (cl.y < -20) cl.y = H + 10; if (cl.y > H + 20) cl.y = -10; cl.x += 0.1; if (cl.x > W + 40) cl.x = -40;
          ctx.globalAlpha = Math.min(1, S.sky) * 0.85; ctx.fillRect(Math.round(cl.x), Math.round(cl.y), Math.round(cl.w), 4); ctx.fillRect(Math.round(cl.x + cl.w * 0.2), Math.round(cl.y - 3), Math.round(cl.w * 0.55), 3); });
        ctx.globalAlpha = Math.min(1, S.sky);
        if (S.snap && S.mapY < H) ctx.drawImage(S.snap, 0, 0, S.snap.width, S.snap.height, 0, Math.round(S.mapY), W, H); // (the map's horizon, sliding away under them)
        ctx.globalAlpha = 1;
      }
      S.figs.forEach(function (f) {
        if (f.hide || S.face) return;
        ctx.save(); ctx.translate(Math.round(f.x), Math.round(f.y)); ctx.scale(f.s || 2, f.s || 2);
        D.spr.draw(ctx, f.sheet, f.anim, f.facing || 0, f.t || 0, 0, 0, { frame: f.frame, once: true });
        ctx.restore();
      });
      if (S.dim > 0) { ctx.globalAlpha = Math.min(0.85, S.dim); ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      if (S.face) { // a face close: the sprite's head at the middle of the screen, big (its `face`: px above the foot), and the eyes' flare
        var fc = S.face, sh = D.SHEETS && D.SHEETS[fc.sheet], fy = (sh && sh.face) || 50, sc = fc.s || 6;
        ctx.save(); ctx.translate(Math.round(W / 2), Math.round(H / 2 + fy * sc)); ctx.scale(fc.flip ? -sc : sc, sc);
        D.spr.draw(ctx, fc.sheet, fc.anim || 'idle', fc.facing || 0, 0, 0, 0, { frame: fc.frame || 0 });
        ctx.restore();
        if (fc.flare > 0) { // the eyes: on each mirror the sprite has, a white star and a glow (the mirrors catching)
          var k = fc.flare, eyes = eyeSpots(fc.sheet, fc.anim || 'idle', fc.facing || 0), ox = W / 2, oy = H / 2 + fy * sc;
          eyes.forEach(function (e) {
            var x = ox + (fc.flip ? -e[0] : e[0]) * sc, y = oy + e[1] * sc, r = 6 + k * 22;
            ctx.globalAlpha = Math.min(1, k) * 0.4; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, y, sc * 2.4, sc * 1.8, 0, 0, 7); ctx.fill();
            ctx.globalAlpha = Math.min(1, k); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r * 0.55); ctx.lineTo(x, y + r * 0.55); ctx.stroke();
          });
          ctx.globalAlpha = 1;
        }
      }
      if (S.flash > 0) { ctx.globalAlpha = Math.min(1, S.flash); ctx.fillStyle = '#f4fbff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    } });
    S.end = function () { S.fx.dur = S.fx.t; };
    return S;
  }
  // the dust of a landing, and in it the mirror glints -- a burst on the ground about one (world FX, drawn with the map)
  function mirrorCloud(u) {
    var bits = [];
    for (var i = 0; i < 26; i++) { var a = (i / 26) * Math.PI * 2 + Math.random() * 0.2; bits.push({ a: a, v: 0.6 + Math.random() * 1.4, glint: i % 2 === 0 }); }
    return FX.add({ kind: 'mirrorcloud', dur: 46, draw: function (ctx) {
      var p = FX.at(u), c = D.iso.center(p.gx, p.gy, p.gz), s = D.iso.toScreen(c.x, c.y), k = this.t / this.dur;
      ctx.globalAlpha = (1 - k) * 0.55; ctx.fillStyle = '#9a8268'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 14 + k * 30, 5 + k * 10, 0, 0, 7); ctx.fill();
      bits.forEach(function (b) {
        var r = (10 + b.v * 34) * Math.sqrt(k), x = s.x + Math.cos(b.a) * r, y = s.y + Math.sin(b.a) * r * 0.4 - (1 - k) * 6 * b.v;
        ctx.globalAlpha = 1 - k; ctx.fillStyle = b.glint ? (Math.floor(this.t / 3 + b.a * 5) % 2 ? '#ffffff' : '#9fe6ff') : '#b7a28a';
        ctx.fillRect(Math.round(x), Math.round(y), b.glint ? 2 : 3, b.glint ? 2 : 2);
      }, this);
      ctx.globalAlpha = 1;
    } });
  }

  function* ending(B) {
    var F = B.fight, h = B.units.filter(function (u) { return u.kind === 'harbinger'; })[0], g = B.units.filter(function (u) { return u.id === (F.hunted || F.quarry || 'greyfang'); })[0]; // (hunted: the ending's own, when the fight's AI hunts no one)
    if (!h || !g) return;
    B.trophyDone = true; B.clearCards && B.clearCards();
    if (D.spr.ensure) D.spr.ensure(['face_harbinger', 'face_greyfang']); // (the big faces fetched now: the sheets come when asked, and the first close-up is ten seconds off)
    var cine0 = B.cine; B.cine = true; // (no turn strip and no bar over the picture: the show's way, js/gameshow.js)
    var S = stage(B), gAlive = g.hp > 0 && !g.dead, ground = G.groundAt(h, h.x, h.y);
    B.trophyGF = gAlive; // (whether he stood at the win: the bench's fight line says it -- dev/bench16.js)
    h.cine = true; g.cine = true; // (the flight rules let them be: battle.js Battle.flyWhy)
    try {
      // ---- the stillness
      yield* camOn(B, h, 1.5, 34);
      B.card(['{y}The Harbinger lies still. The crowd on the tiers lets out its breath.{/}'], 1e9, 'trophy'); yield 60;
      // ---- the mirrors: on the body first, while it lies (Griz, 10-08: "start the mirror effect while he's still down please"), slow passes, then the word
      D.sfx('encounter');
      for (var cp = 0; cp < 3; cp++) { if (D.ripple) D.ripple(h, { region: 'body', dur: 56 }); D.sfx('bump'); yield 62 - cp * 8; }
      B.card(['{v}Mirrors run over the body, and over again. Something else is looking out of it now.{/}'], 1e9, 'trophy');
      // ... over his whole body, faster and faster -- up off the ground, standing, rising into the air
      var gaps = [30, 24, 19, 16, 13, 11, 9, 8, 7, 6, 5, 5, 4, 4, 3, 3, 3, 2, 2], stood = false, lift = 0, knelt = [];
      for (var p = 0; p < gaps.length; p++) {
        if (D.ripple) D.ripple(h, { region: 'body', dur: Math.max(10, gaps[p] * 2) });
        if (p % 3 === 0) D.sfx('bump');
        if (p === 2 && !stood) { // up from the dead: his Ascend row, whole again
          stood = true; h.dead = false; h.ko = false; h.slain = false; h.hp = h.maxhp; h.conds = {}; h.deadT = null; h.flash = 0;
          if (D.spr.anim(h.sheet, 'ascend')) { h.anim = 'ascend'; h.animT = B.t; }
        }
        if (p === 4 && !knelt.length) { // and the ring of mirrors out over the pit: every one of them held, on their knees (Griz, 10-08: "We need to put the players under
          // dominate (or something to explain their stunned inactivity lack of initiative), maybe AOE mirror effect when he rises?") -- the look of his Kneel (ui.js: held by
          // him, drawn kneeling), let go before the win is read
          B.units.forEach(function (w) { if (w.side === 'party' && !w.dead && w.hp > 0 && !w.object && !w.familiar) { w.conds.paralyzed = { by: h.id, cine: true }; knelt.push(w); if (D.ripple) D.ripple(w, { region: 'body', dur: 50 }); } });
          D.sfx('crit'); B.card(['{v}A ring of mirrors runs out of it across the pit, and every one of them goes down on their knees.{/}'], 1e9, 'trophy');
        }
        for (var q = 0; q < gaps[p]; q++) {
          if (stood && p >= 7) { lift = Math.min(64, lift + 0.9 + (p - 7) * 0.12); h.fz = ground + Math.round(lift); } // (off the ground, slow and then quicker)
          if (stood && p >= 6 && h.anim !== 'uprightidle' && h.anim !== 'ascend') h.anim = 'idle';
          if (p >= 6 && q % 2 === 0) yield* camOn(B, h, 1.5, 1, Math.round(lift * 0.6)); else yield 1;
        }
        if (stood && p === 6) { h.upright = true; h.anim = 'idle'; h.animT = B.t; }
      }
      // ---- the climax: the light of the mirrors over everything, the ground shaking
      D.sfx('crit'); B.shakeT = 30;
      for (var fl = 0; fl < 14; fl++) { S.flash = Math.min(0.9, fl / 6); yield 1; }
      for (fl = 0; fl < 22; fl++) { S.flash = 0.9 * (1 - fl / 22); yield 1; }
      S.flash = 0;
      // ---- the drop: back to the ground, into a cloud of dust and mirror glints
      // (on his Pounce row's landing -- its frame 6 is the impact, the dust the sheet draws round his feet -- the mirrors over him and it: Griz, 10-08, "can you try the
      // pounce land with mirror 'dust clouds' it comes with")
      var pf = D.spr.anim(h.sheet, 'pounce'), pT = pf ? 60 / (pf.fps || 10) : 6;
      if (pf) { h.anim = 'pounce'; h.animT = B.t - Math.round(3 * pT); }
      for (var dz = 0; dz < 9; dz++) { lift = Math.max(0, lift - (6 + dz * 2)); h.fz = ground + Math.round(lift); yield 1; }
      h.fz = null; D.sfx('hit'); B.shakeT = 16;
      if (pf) { h.anim = 'pounce'; h.animT = B.t - Math.round(((pf.release != null ? pf.release : 5)) * pT); }
      if (D.ripple) D.ripple(h, { region: 'body', dur: 34 }); mirrorCloud(h);
      yield Math.round(3 * pT) + 4; h.anim = 'idle';
      yield* camOn(B, h, 1.5, 18);
      yield 16;
      // ---- his face: "The Mane is mine."
      for (var df = 0; df < 16; df++) { S.dim = df / 16 * 0.8; yield 1; }
      for (var fw8 = 0; fw8 < 120 && D.spr.ready && !D.spr.ready(['face_harbinger', 'face_greyfang']); fw8++) yield 1; // (the faces not come yet: a moment's wait, two seconds at most)
      S.face = { sheet: 'face_harbinger', s: 1.0, flare: 0 }; // (the big face off his sheet -- Griz, 10-08: "I remember a lot of the art sheets starting with a big ole face in the top left..")
      for (var zf = 0; zf < 22; zf++) { S.face.s = 1.0 + ease(zf / 22) * 1.1; yield 1; } // (in on it)
      word('audio/the_mane_is_mine.mp3', 'The Mane is mine.');
      B.card(['{v}"The Mane is mine."{/}'], 1e9, 'trophy');
      for (var ef = 0; ef < 40; ef++) { S.face.flare = ef < 8 ? ef / 8 : Math.max(0, 1 - (ef - 8) / 32); yield 1; }
      yield 30;
      for (zf = 0; zf < 14; zf++) { S.face.s = 2.1 - ease(zf / 14) * 1.0; S.dim = 0.8 * (1 - zf / 14); yield 1; }
      S.face = null; S.dim = 0;
      // ---- the Pounce onto GreyFang
      B.clearCards && B.clearCards();
      var mid = { x: (h.x + g.x) / 2, y: (h.y + g.y) / 2, size: 1 };
      yield* camOn(B, mid, 1.3, 28);
      var sq = null;
      for (var ax = -1; ax <= 1; ax++) for (var ay = -1; ay <= 1; ay++) {
        if (!ax && !ay) continue;
        var x = g.x + ax, y = g.y + ay;
        if (!free(B, x, y)) continue;
        var d = Math.abs(x - h.x) + Math.abs(y - h.y);
        if (!sq || d < sq.d) sq = { x: x, y: y, d: d };
      }
      if (sq) {
        h.facing = D.spr.facingFor(Math.sign(sq.x - h.x), Math.sign(sq.y - h.y));
        if (D.spr.anim(h.sheet, 'pounce')) { h.anim = 'pounce'; h.animT = B.t; }
        if (D.ripple) D.ripple(h, { region: 'body' });
        D.sfx('run');
        h.tween = { fx: h.x, fy: h.y, fz: G.gzAt(h, h.x, h.y), t: 0, dur: 30, mode: 'hurl', peak: 46 }; h.x = sq.x; h.y = sq.y;
        yield 30;
      }
      h.facing = D.spr.facingFor(Math.sign(g.x - h.x), Math.sign(g.y - h.y)); g.facing = D.spr.facingFor(Math.sign(h.x - g.x), Math.sign(h.y - g.y));
      D.sfx('hit'); g.flash = 8; yield 16;
      B.card([gAlive ? '{v}It has GreyFang by the throat.{/}' : '{v}It takes GreyFang up off the sand.{/}'], 1e9, 'trophy');
      yield 30;
      // ---- up: the two of them off the map into the sky -- the stage takes over while the map still fills the picture (the camera climbing the live map
      // had shown the black beyond its edge), and the map's picture goes down and away under them
      if (D.ripple) D.ripple(h, { region: 'body', dur: 40 });
      D.sfx('run');
      // the stage: the sky over the world, the map's last picture (them out of it) under the two of them, going away
      h.unseen = true; g.unseen = true; // (out of the world's picture before it is taken, the same frame: the stage draws them)
      S.want = true; S.sky = 1; S.mapY = 0; S.rising = 1;
      var cx = D.W / 2, cy = D.H * 0.58;
      var fH = { sheet: h.sheet, anim: D.spr.anim(h.sheet, 'pounce') ? 'pounce' : 'idle', facing: 6, frame: 3, x: cx - 10, y: cy, s: 2 };
      var fG = { sheet: g.sheet, anim: gAlive ? 'flinch' : 'hurt', facing: 2, frame: gAlive ? 2 : 1, x: cx + 34, y: cy + 30, s: 2 }; // (hanging from his reach, below and before him)
      S.figs = [fH, fG];
      for (var sk = 0; sk < 70; sk++) { S.mapY = ease(sk / 70) * (D.H + 10); fH.y = cy - ease(sk / 70) * 26; fG.y = fH.y + 30; yield 1; } // (the map's horizon down and away: only blue)
      S.rising = 0.3; yield 24;
      // ---- their faces
      B.card(['{v}High over the pit, it looks GreyFang in the eye.{/}'], 1e9, 'trophy');
      for (df = 0; df < 12; df++) { S.dim = df / 12 * 0.55; yield 1; }
      S.face = { sheet: 'face_harbinger', s: 1.0 };
      for (zf = 0; zf < 18; zf++) { S.face.s = 1.0 + ease(zf / 18) * 1.1; yield 1; }
      yield 50;
      S.face = { sheet: 'face_greyfang', s: 2.1 }; // (his, looking back at it: the front face he drew, 10-08)
      yield 60;
      // ---- the flash: the trophy taken
      D.sfx('crit');
      for (fl = 0; fl < 6; fl++) { S.flash = fl / 6; yield 1; }
      S.face = null; S.dim = 0; fG.anim = 'headless'; fG.frame = 1; fG.facing = 6;
      for (fl = 0; fl < 24; fl++) { S.flash = 1 - fl / 24; yield 1; }
      S.flash = 0;
      B.card(['{v}The Harbinger has what it came for.{/}'], 1e9, 'trophy'); yield 50;
      // ---- the fall: the camera down through the sky after the body, the body faster; the map coming back up under it; the Harbinger left above, gone
      var vy = 0.6, bodyY = fG.y; S.rising = 0; S.sinking = 1;
      for (var pn = 0; pn < 110; pn++) {
        var k = pn / 110;
        S.mapY = (D.H + 10) * (1 - ease(k));                                 // (the pan: the ground coming back up into the picture)
        fH.y -= 1.6 + k * 2.4; if (fH.y < -80) fH.hide = true;              // (he stays up there: the picture leaves him)
        vy += 0.11; bodyY += vy; fG.y = bodyY; fG.frame = Math.min(frameH(g.sheet, 'headless') - 2, 1 + Math.floor(pn / 16)); // (the body falls faster than the pan)
        if (fG.y > D.H + 90) fG.hide = true;
        yield 1;
      }
      // ---- the end as it was: on the sand, the body comes down, lying, his bow beside it
      h.left = true; h.fled = true; h.unseen = false; h.fz = null;
      B.units.forEach(function (w) { if (w !== h && w.side === 'foe' && !w.dead && (w.summon || w.kind === 'mirrorhyena')) { w.left = true; w.fled = true; } });
      var land = null, order = [];
      for (var lx = -2; lx <= 2; lx++) for (var ly = -2; ly <= 2; ly++) if (lx || ly) order.push([lx, ly]);
      order.sort(function () { return D.rand ? D.rand() - 0.5 : Math.random() - 0.5; }); // (where it comes down, the dice's -- Griz: "I like how his body lands in different places")
      for (var oi = 0; oi < order.length && !land; oi++) { var tx = g.x + order[oi][0], ty = g.y + order[oi][1]; if (free(B, tx, ty)) land = { x: tx, y: ty }; }
      if (land) { g.x = land.x; g.y = land.y; }
      g.hp = 0; g.dead = true; g.ko = true; g.deadT = B.t; g.headless = true; g.conds = {}; g.flash = 0; g.tween = null; g.facing = 6;
      g.anim = 'headless'; g.animT = B.t - Math.round(60 / 8 * 3);
      S.sky = 0; S.figs = []; S.end();
      yield* camOn(B, g, 1.5, 1);
      g.unseen = false; var fallZ = G.groundAt(g, g.x, g.y);
      for (var fz = 0; fz < 14; fz++) { g.fz = fallZ + Math.round(130 * Math.pow(1 - fz / 14, 2)); yield 1; } // (down out of the sky onto the sand)
      g.fz = null; D.sfx('hit'); B.shakeT = 10; g.animT = B.t - Math.round(60 / 8 * 3);
      yield 30;
      B.card(['{v}It is gone into the sky, and the pack scatters after it.{/}'], 1e9, 'trophy'); yield 80;
      yield* camOn(B, g, 1.7, 30);
      B.card(['{g}His bow lies on the sand beside him.{/}'], 1e9, 'trophy'); yield 90;
      B.clearCards && B.clearCards();
    } finally {
      S.end(); B.cine = cine0; h.unseen = false; g.unseen = false; delete h.cine; delete g.cine;
      B.units.forEach(function (w) { if (w.conds && w.conds.paralyzed && w.conds.paralyzed.cine) delete w.conds.paralyzed; }); // (the held, let go)
    }
  }

  var finish0 = BP.finish;
  BP.finish = function* (o) {
    if (o === 'won' && this.fight && this.fight.trophy && !this.trophyDone) yield* ending(this);
    yield* finish0.call(this, o);
  };
  D.trophy = { ending: ending };
})();
