/* DEEP16 -- THE BLACK EGG, "SOMETHING WENT BY" (eggStars). 2026-11-15 night, the black-egg seat, started by the lanes desk on Griz's "start a seat for that"; the clock lane
   (..\handoff-2026-10-13-the-clock.md: §12 the eggs, the 2026-11-05 beeline section, the 2026-11-15 desk section). His words, verbatim:
     11-05: "Jot that one as the party being within 5 miles of the Vessel on its actual path without triggering an encounter (to be built later)"
     11-15: "that egg reward is going to have to come to the player after the event that triggers it (to not reveal old one's actual location), suggest reasonable reward delay"
     then, on the desk's suggestion, "Yes, that delay" -- RULED: it pays at the party's first sleep that begins at least 24 hours after the closest pass (the inn, a room or a
     camp); with no sleep, at the third dawn after the pass. Once a save. (The desk's why: by then he has walked on 2-3 hexes and the party has moved too, so the payout
     points at a day of road, not a hex.)
   THE PASS (BE.tick, BE.see): the party's hex on THE WORLD (the world hex its point lies in -- js/world.js W.partyPt, W.worldHexOf; its spot's on the Silverton area) a
   NEIGHBOUR of the hex his hidden road has him in that hour (W.vesselAt), never his own hex, from the dawn he sets out (day 2, as js/ripplesfight.js RF.here has it); held
   at the Warded Fort counts too (the end of his road). RULED 11-15 night, Griz (by the lanes desk), on the seat's first reading -- straight miles, which took his own hex in:
   "game ends if same hex, i thought 5 miles to mean adjacent hex without running into him". A moment in his own hex is not a pass (nor does it shut the egg). The clock is followed between looks: from where the party was looked at last to where it is now, its point carried straight,
   his point by the hour, every BE.STEP of an hour -- so a step, a camp, a floor's hours and a day lost are all read, wherever the look comes from. Kept QUIETLY in the save
   (S.stars, beside THE WORLD's clock and hex, which the house saves): the hour of the closest approach (a tie goes to the later hour, so a party that stays beside him is
   still passing), its day and hour, the miles. Nothing is drawn, said or sounded.
   MET (a road's card or a camp's watch that is him: js/ripplesfight.js): the egg is shut for that save. The meeting is a game over, so this is for the record and the bench.
   THE PAYOUT (BE.pay): decided when a sleep BEGINS -- THE WORLD's camp and its watches (W.camp, H.runNight), a bed on a floor (H.sleepOnFloor: the inn's rooms, Cassia's,
   Aldwin's floor, the bunks, the Glowseep's fire), the wagon night's lie-down (js/inn.js In.lieDown): paid if it begins BE.DELAY hours or more after the closest pass; else at
   the third dawn (06:00) after the pass, if nothing has paid it. The flag, eggStars, into the save's flags (and an open floor's, which hands its own back).
   THE BEAT (BE.drawBeat, BE.beatTick): the night sky; every star goes out at once, and the music with them, for a breath; the first line in the dark; the stars back one by
   one; the second line; then the black egg with its name, drawn as the other eggs are (js/grimoire.js M.eggDraw, its 'black': stars in it that go out now and then).
   Where: in the morning page's dark (js/house.js H.Morning's night) when the sleep was a long rest; at once, before the morning card, for a night's sleep with no long rest;
   on THE WORLD when it next stands idle, for the third dawn. A bench page (no screen, D.ctx null) gets the flag and no scene: nothing waits on it there.
   Doors: deep16/?starsshow (the pass, the night it pays, the third dawn; the four at 3rd, the hours pinned). Bench: dev/bench16.js mode=blackegg1115. */
'use strict';
(function () {
  var D = window.D16, W = D.world, H = D.house;
  if (!W || !H || !W.vesselAt || !W.World) return;
  var BE = D.blackEgg = {};
  var ME = (D.magic && D.magic.EGGS && D.magic.EGGS.stars) || {};
  BE.FLAG = ME.flag || 'eggStars'; BE.LINE = ME.line || 'Something Went By'; BE.HUE = ME.hue || 'black'; // (js/grimoire.js M.EGGS.stars)
  BE.RING = 1;       // (RULED 11-15 night: "5 miles" is the adjacent hex -- a neighbour of his hex on THE WORLD, never his own: "game ends if same hex")
  BE.hexD = function (a, b) { var dq = a[0] - b[0], dr = a[1] - b[1]; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }; // (THE WORLD's hexes, axial: js/world.js DIRS)
  BE.NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  BE.STEP = 0.25;    // (hours between looks when the clock is followed)
  BE.DELAY = 24;     // (RULED 11-15: the first sleep that begins at least 24 hours after the closest pass)
  BE.DAWN = 6; BE.DAWNS = 3; // (RULED 11-15: else the third dawn after the pass -- 06:00, the hour the makings feed)
  BE.TIE = 0.05;     // (miles: a look this near the closest so far is the same pass, and the later hour stands)
  // THE LINES (drafts, the seat's, standing on his RULED 09-24 rule that drafts stand -- invented.json black-egg-1115): never a word of where
  BE.LINES = ['In the night, every star went out at once.', 'For the space of a breath there was nothing. Then they were back.'];
  // the beat's clock, in frames (sixty a second): the sky fades in; the stars out; the first line; the stars back, each its own frame; the second line; the egg (its 230, as every egg's)
  BE.T = { fade: 20, out: 100, outFor: 8, line1: 118, back: 196, backFor: 30, line2: 206, egg: 296, end: 526, skip: 60 };

  function S0() { return W.house() && W.state ? W.state() : null; }
  function flags() { return H.cur ? (H.cur.flags = H.cur.flags || {}) : null; }
  BE.from = function () { var V = W.VESSEL; return W.tAt(V.day0) + V.dawn; }; // (dawn of day 2: he sets out)
  BE.dawn3 = function (tp) { var d = Math.floor(tp / 24) * 24 + BE.DAWN; if (d <= tp) d += 24; return d + (BE.DAWNS - 1) * 24; }; // (the third 06:00 after the pass)
  BE.rec = function () { var S = S0(); return S ? (S.stars = S.stars || {}) : null; };
  BE.shut = function (st) { var f = flags(); return !st || st.paid != null || st.met != null || !!(f && f.eggStars); }; // (paid, or met, or found in this save already: nothing more is looked for)
  BE.unseen = function () { var S = S0(); return !!(S && S.stars && S.stars.paid != null && S.stars.shown === false); };

  // ------------------------------------------------------------------ the pass, quietly
  BE.see = function (st, t, p) {
    var v = W.vesselAt(t); if (!v) return;
    if (BE.hexD(W.worldHexOf(p[0], p[1]), v.hex) !== BE.RING) return; // (a neighbour of his hex; his own is not a pass)
    var d = Math.hypot(p[0] - v.pt[0], p[1] - v.pt[1]); // (the miles: which moment of the pass was the closest)
    var ps = st.pass, at = { t: t, d: Math.round(d * 100) / 100, day: W.dayAt(t), hour: Math.round((t % 24) * 100) / 100 };
    if (!ps || d < ps.d - BE.TIE) st.pass = at; // (the closest so far)
    else if (d <= ps.d + BE.TIE) { at.d = Math.min(ps.d, at.d); st.pass = at; } // (as close: the later hour)
  };
  BE.tick = function () {
    var S = S0(); if (!S || S.t == null || !S.at) return;
    var st = S.stars = S.stars || {}, pt = W.partyPt(); if (!pt) return;
    var t1 = S.t, L = st.last;
    if (!BE.shut(st)) {
      if (!L) { if (t1 >= BE.from()) BE.see(st, t1, pt); } // (the first look: now)
      else if (t1 > L[0]) {
        var t0 = L[0], n = Math.min(4000, Math.max(1, Math.ceil((t1 - t0) / BE.STEP))), t00 = BE.from();
        for (var k = 1; k <= n; k++) { var f = k / n, t = t0 + (t1 - t0) * f; if (t >= t00) BE.see(st, t, [L[1] + (pt[0] - L[1]) * f, L[2] + (pt[1] - L[2]) * f]); }
      }
      if (st.pass && t1 >= BE.dawn3(st.pass.t)) BE.pay('the third dawn');
    }
    st.last = [t1, pt[0], pt[1]];
  };
  BE.met = function () { var S = S0(); if (!S) return; var st = S.stars = S.stars || {}; if (st.paid == null && st.met == null) { st.met = S.t; H.trail('egg', 'the black egg shut: Mr. Ripples met'); } };

  // ------------------------------------------------------------------ the payout
  BE.floorFlag = function () { for (var i = D.scenes.length - 1; i >= 0; i--) { var sc = D.scenes[i]; if (sc && sc.roam && sc.roam.flags) { sc.roam.flags.eggStars = 1; return; } } }; // (an open floor hands its flags back over the save's: js/house.js H.fromFloor)
  BE.pay = function (how) {
    var S = S0(), st = S && S.stars, f = flags(); if (!st || !f || !st.pass || BE.shut(st)) return false;
    st.paid = S.t; st.how = how; st.shown = false;
    f.eggStars = 1; BE.floorFlag();
    H.trail('egg', 'SOMETHING WENT BY, the black egg: paid at ' + how + ' (the pass on day ' + st.pass.day + ' at ' + H.clockAt(st.pass.t) + ', ' + st.pass.d.toFixed(1) + ' mi)');
    W.save(); return true;
  };
  // a sleep begins: the clock followed to here, and the sleep's one decision -- paid if it begins BE.DELAY hours or more after the closest pass. One night is one sleep:
  // the camp's watches and then its W.camp, the inn's lie-down and then its morning (an open sleep is kept 16 hours, and closed at the morning page)
  BE.open = null;
  BE.sleepBegins = function (t0) {
    var S = S0(); if (!S) return null; BE.tick();
    if (t0 == null) t0 = S.t;
    if (BE.open && t0 >= BE.open.t0 && t0 - BE.open.t0 < 16) return BE.open;
    var st = S.stars || {}, due = !BE.shut(st) && !!st.pass && t0 >= st.pass.t + BE.DELAY;
    BE.open = { t0: t0, due: due };
    if (due) BE.pay('a sleep begun ' + Math.floor(t0 - st.pass.t) + ' hours after the pass');
    return BE.open;
  };
  BE.mark = function () { var S = S0(); if (S && S.stars) S.stars.shown = true; };
  BE.screen = function () { return !!D.ctx; }; // (a bench page has no screen: the flag, and no scene for nothing to wait on)

  // ------------------------------------------------------------------ the beat
  var SKY = null;
  function sky() { // (the stars by a hash, never the dice)
    if (SKY && SKY.w === D.W && SKY.h === D.H) return SKY;
    var hs = function (a) { var v = Math.sin(a * 91.3458 + 7.13) * 47453.5453; return v - Math.floor(v); }, st = [], gr = [];
    for (var i = 0; i < 170; i++) st.push({ x: Math.floor(hs(i * 3 + 1) * D.W), y: Math.floor(Math.pow(hs(i * 3 + 2), 1.25) * (D.H - 44)), b: hs(i * 3 + 3), ph: Math.floor(hs(i + 0.5) * 97), back: Math.floor(hs(i + 0.25) * BE.T.backFor) });
    for (var x = 0; x <= D.W + 2; x += 2) gr.push(Math.round(D.H - 30 + Math.sin(x / 41) * 5 + Math.sin(x / 13 + 1.7) * 2));
    return (SKY = { w: D.W, h: D.H, stars: st, ground: gr });
  }
  var EGP = null;
  BE.eggPic = function () { return EGP || (EGP = D.magic && D.magic.eggDraw ? D.magic.eggDraw(BE.LINE, BE.HUE) : function () { }); };
  BE.drawBeat = function (ctx, t, hint) {
    var T = BE.T, K = sky(), a = Math.min(1, t / T.fade);
    ctx.save();
    ctx.globalAlpha = a;
    var g = ctx.createLinearGradient(0, 0, 0, D.H); g.addColorStop(0, '#020208'); g.addColorStop(0.72, '#080a1e'); g.addColorStop(1, '#0e1028');
    ctx.fillStyle = g; ctx.fillRect(0, 0, D.W, D.H);
    K.stars.forEach(function (s) {
      var on = t < T.out ? 1 : t < T.out + T.outFor ? 1 - (t - T.out) / T.outFor : t < T.back + s.back ? 0 : 1; // (out all at once; back one by one)
      if (on <= 0) return;
      var tw = ((t + s.ph) % 97) < 88 ? 1 : 0.45;
      ctx.globalAlpha = a * on * tw; ctx.fillStyle = s.b > 0.9 ? '#f4f6ff' : s.b > 0.6 ? '#c0c8ec' : '#7880b0'; ctx.fillRect(s.x, s.y, 1, 1);
      if (s.b > 0.965) { ctx.globalAlpha = a * on * tw * 0.45; ctx.fillRect(s.x - 1, s.y, 3, 1); ctx.fillRect(s.x, s.y - 1, 1, 3); }
    });
    ctx.globalAlpha = a; ctx.fillStyle = '#010104'; ctx.beginPath(); ctx.moveTo(0, D.H); K.ground.forEach(function (y, i) { ctx.lineTo(i * 2, y); }); ctx.lineTo(D.W, D.H); ctx.closePath(); ctx.fill(); // (the land's line)
    var y0 = Math.round(D.H * 0.36), gone = t >= T.egg ? Math.max(0, 1 - (t - T.egg) / 12) : 1;
    var say = function (s, y, t0, col) { if (t < t0) return 0; var al = Math.min(1, (t - t0) / 14) * gone, ls = D.wrap(s, D.W - 80); if (al > 0) { ctx.globalAlpha = al; ls.forEach(function (l, i) { D.text(ctx, l, D.W / 2, y + i * 10, col, 'center'); }); } return ls.length; };
    var n1 = say(BE.LINES[0], y0, T.line1, '#c8d0e8'); say(BE.LINES[1], y0 + (n1 || 1) * 10 + 6, T.line2, '#9ca4cc');
    ctx.restore();
    if (t >= T.egg) BE.eggPic()(ctx, t - T.egg, D.W, D.H);
    if (t >= T.egg + T.skip && hint) D.hint(ctx, hint, D.W / 2, D.H - 12, '#4a4a5c', 'center');
  };
  function sfx(id) { try { D.sfx(id); } catch (e) { } }
  function duck(on) { var A = window.DS && window.DS.audio, b = A && A.buses && A.buses(); if (!b || !b.music) return; try { b.music.gain.cancelScheduledValues(b.ctx.currentTime); b.music.gain.setTargetAtTime(on ? 0 : A.musicVol, b.ctx.currentTime, on ? 0.04 : 0.3); } catch (e) { } } // (the music goes out with the stars: never the player's volume itself)
  // a frame of the beat; true when it is over. E or a click before the egg brings the egg; after it has stood a second, on
  BE.beatTick = function (st) {
    var T = BE.T, I = D.input, m = I.mouse; st.t = (st.t || 0) + 1; var t = st.t;
    if (t === T.out) { sfx('starsout'); duck(true); st.ducked = true; }
    if (t === T.back) { sfx('starsback'); duck(false); st.ducked = false; }
    if (t === T.egg + 1) sfx('eggstars');
    if (t === T.egg + 30 || t === T.egg + 130) sfx('shine');
    var hit = I.pressed('a') || I.pressed('b') || !!(m && m.click && m.inside);
    if (hit && t < T.egg) { st.t = T.egg; if (st.ducked) { duck(false); st.ducked = false; } return false; }
    if ((hit && t >= T.egg + T.skip) || t >= T.end) { if (st.ducked) duck(false); st.done = true; return true; }
    return false;
  };
  function Beat(o) { this.kind = 'blackegg'; this.opaque = false; this.st = { t: 0 }; this.o = o || {}; }
  Beat.prototype.update = function () { if (BE.beatTick(this.st)) { if (D.top() === this) D.pop(); if (this.o.done) this.o.done(); } };
  Beat.prototype.draw = function (ctx) { BE.drawBeat(ctx, this.st.t, 'click or E: on'); };
  BE.Beat = Beat;
  BE.show = function (done) { BE.mark(); if (!BE.screen()) { if (done) done(); return null; } var b = new Beat({ done: done }); D.push(b); return b; };

  // ------------------------------------------------------------------ the hooks (each a wrap made here)
  // THE WORLD: every frame the clock is followed; the third dawn's beat when it stands idle
  var wu0 = W.World.prototype.update;
  W.World.prototype.update = function () {
    BE.tick();
    if (BE.unseen() && D.top() === this && !this.pm && !this.cards.length && !this.walk && !this.arrivePend) { BE.show(); return; }
    return wu0.apply(this, arguments);
  };
  // met: his own card on the road, his watch at a camp (js/ripplesfight.js)
  var enc0 = W.World.prototype.encounter;
  W.World.prototype.encounter = function (p) { if (p && p.ripples) BE.met(); return enc0.apply(this, arguments); };
  if (D.ripples && D.ripples.campCard) { var cc0 = D.ripples.campCard; D.ripples.campCard = function () { BE.met(); return cc0.apply(this, arguments); }; }
  // the sleeps begin
  var camp0 = W.camp;
  W.camp = function (o) { if (W.house()) BE.sleepBegins(o && o.from != null ? o.from : null); return camp0.apply(this, arguments); };
  var night0 = H.runNight;
  H.runNight = function () { if (W.house()) BE.sleepBegins(); return night0.apply(this, arguments); };
  var sof0 = H.sleepOnFloor;
  H.sleepOnFloor = function* (B, o) {
    var house = !!(D.roam && D.roam.house && D.roam.house() && H.playing);
    if (house) BE.sleepBegins();
    if (house && o && o.noLong && BE.unseen()) { var done = false; if (!BE.show(function () { done = true; })) done = true; while (!done) yield 1; } // (a night's sleep with no long rest: no morning page, so the beat comes first)
    yield* sof0.call(this, B, o);
    if (house && o && o.noLong) BE.open = null;
  };
  if (D.inn && D.inn.lieDown) { var lie0 = D.inn.lieDown; D.inn.lieDown = function* () { if (H.playing && W.house()) BE.sleepBegins(); yield* lie0.apply(this, arguments); }; }
  // the morning page: the night's dark is the beat's
  var morn0 = H.morning;
  H.morning = function (o) {
    var m = morn0.apply(this, arguments);
    if (m && !(o && o.draft) && W.house()) { BE.tick(); BE.open = null; if (BE.unseen()) { BE.mark(); if (BE.screen()) m.stars = { t: 0 }; } }
    return m;
  };
  var MP = H.Morning.prototype, mu0 = MP.update, md0 = MP.draw;
  MP.update = function () { if (this.stars && !this.stars.done && this.phase === 'night') { this.t++; if (BE.beatTick(this.stars)) this.next(); return; } return mu0.apply(this, arguments); };
  MP.draw = function (ctx) { if (this.stars && !this.stars.done && this.phase === 'night') { BE.drawBeat(ctx, this.stars.t, 'click or E: on to the morning'); return; } return md0.apply(this, arguments); };
  // the save's flags as a floor hands them back: the egg kept (H.fromFloor writes the floor's over the save's)
  var ff0 = H.fromFloor;
  H.fromFloor = function () { var r = ff0.apply(this, arguments); var S = S0(); if (H.cur && S && S.stars && S.stars.paid != null && S.stars.met == null) (H.cur.flags = H.cur.flags || {}).eggStars = 1; return r; };
  var begin0 = H.begin;
  H.begin = function () { BE.open = null; return begin0.apply(this, arguments); }; // (a game begun or loaded: no sleep is open)

  // ------------------------------------------------------------------ the show: deep16/?starsshow -- the four at 3rd, the hours pinned, no road fights
  BE.SHOW = { t: 6 * 24 + 15 }; // (day 7 at 15:00: he is crossing the mile, the fork to Silverton, by the 11-05 table)
  BE.BEATS = [
    { id: 'pass', label: 'THE PASS: in the hex beside his on his road -- and nothing shows (his hands)', note: 'Day 7 at 15:00, the four at 3rd on THE WORLD in a hex beside the one his hidden road has him in, walking. No road fights (so he is never met). Walk where you like: nothing is drawn, said or sounded. The pass is in the save, quietly.', pass: true },
    { id: 'night', label: 'THE NIGHT IT PAYS: the first sleep 24 hours after the pass (the engine camps)', note: 'The pass recorded at 15:00 on day 7; day 8 at 21:00, the party camped far off on the inn\'s road. The night\'s three watches, no fight; then the dark: the stars go out for a breath, the two lines, the black egg. Then the morning.', night: true },
    { id: 'dawn', label: 'THE THIRD DAWN: no sleep since the pass -- the beat on THE WORLD at first light', note: 'The pass recorded at 15:00 on day 7 and the party never slept: day 10, just past 06:00, the third dawn after it, the party on the inn\'s road. The beat at once, on THE WORLD.', dawn: true }
  ];
  BE.side = function (vpt) { // (the middle of a walkable hex of THE WORLD beside his -- the one nearest his point; never his own hex)
    var k0 = W.mapKey; W.use('world'); var Mw = W.M(), vh = W.worldHexOf(vpt[0], vpt[1]), best = null, bd = 1e9;
    BE.NB.forEach(function (o) { var q = vh[0] + o[0], r = vh[1] + o[1], e = Mw.hex[W.K(q, r)]; if (!e || !W.walkable(e) || (W.MOUNTAIN && W.MOUNTAIN[e.t])) return; var c = W.hc(q, r), d = Math.hypot(c[0] - vpt[0], c[1] - vpt[1]); if (d < bd) { bd = d; best = c; } });
    W.use(k0); return best;
  };
  BE.away = function () { var Mw = W.Mworld(), inn = Mw.sites.filter(function (s) { return s.id === 'inn'; })[0]; return inn ? [inn.x, inn.y - 4] : W.hc(16, 13); }; // (the inn's road, north of it: far from his road all the game)
  BE.stage = function (pt, t) { var S = W.state(); S.t = t; S.today = 0; S.todayHex = 0; S.pos = pt.slice(); S.from = null; if (W.place(pt) && W.scene) W.scene.onMap(); var sc = W.scene; if (sc && sc.lookAt) { var lk = sc.lookAt(pt[0], pt[1]); sc.cam.cx = lk[0]; sc.cam.cy = lk[1]; } W.save(); return S; };
  BE.play = function (bt) {
    var rec = H.fresh(); rec.at = { town: null };
    if (D.save && D.save.fixture) rec.party = D.save.fixture(3).party; // (the four at 3rd: the story's doors are staged there)
    H.begin(rec, 0, '?world&noenc&nowagon');
    var tp = BE.SHOW.t, v = W.vesselAt(tp), S;
    if (bt.pass) {
      var pt = BE.side(v.pt) || v.pt; S = BE.stage(pt, tp); S.stars = {};
      var pp = W.partyPt(); W.scene.say('THE PASS (a show): day 7, 15:00 -- he is in the next hex, ' + Math.hypot(pp[0] - v.pt[0], pp[1] - v.pt[1]).toFixed(1) + ' mi off on his road; nothing will show. Walk as you like.');
      return;
    }
    var pass = { t: tp, d: 4, day: 7, hour: 15 };
    if (bt.night) {
      S = BE.stage(BE.away(), tp + 30); var pn = W.partyPt(); S.stars = { pass: pass, last: [S.t, pn[0], pn[1]] };
      var e = W.M().hex[W.K(S.at[0], S.at[1])]; S.zone = W.zoneOf(e); S.count = 1e9; // (the watches bring no fight)
      H.runNight(W.scene, H.watchDefault(H.cur.party.filter(function (h) { return !h.dead && !h.ko && h.hp > 0; })));
      return;
    }
    if (bt.dawn) { S = BE.stage(BE.away(), BE.dawn3(tp) + 0.05); var pd = W.partyPt(); S.stars = { pass: pass, last: [S.t, pd[0], pd[1]] }; } // (THE WORLD's next frame pays it and, idle, plays it)
  };
  BE.showDoor = function (q) { return new D.roam.WetShow(q, { kind: 'starsshow', beats: BE.BEATS, play: BE.play, title: '{y}SOMETHING WENT BY, 11-15{/} -- the black egg: the pass, the night it pays, the third dawn (a show)' }); };
})();
