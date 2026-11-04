/* DEEP16 -- THE WAGON ON THE ROAD (11-04, the Inn build seat 2, started by the lanes desk on Griz's "Start with a seat for the next 3 todo";
   ..\handoff-2026-10-30-the-halfway-inn-and-the-lake.md, its item 12's rest: the Inn seat's §3 "The wagon on the clock", RULED 11-04 -- his "in on your above leans as well").
   Amara's wagon pays the lake one child a month (CANON), so it runs the Pit road on a cycle: WAGON DAY 6 then every 28 (js/inn.js In.WAGON, the calendar landed 1ad3433c); it
   reaches the Halfway Inn at dusk on WAGON DAY, leaves north at first light the morning after, and between the inn's nights it is A MOVING MARK ON THE WORLD's road -- met where
   the party's hex meets its hex, on either map (THE WORLD's 5-mile hexes, the Silverton area's of a mile and a half: one plane of miles).
   THE PACE (the seat's call, his to overrule -- the lane's 11-04 build-2 section): the realm's 17 miles a cart-day (TarlynsPit/road-silverton-tarlynspit.md, RULED 10-16, his
   "4 days by wagon sounds just right": Silverton to the Pit is four wagon-days) on THE WORLD's own road -- 48.7 miles from the Pit to the fork and 19 on to Silverton, the inn
   28.5 from the Pit -- a cart-day the hours from seven to seven, camped on the road between. So the wagon leaves the Pit mid-morning WAGON DAY-1, is at the inn at dusk on
   WAGON DAY (the anchor the inn's calendar keeps), leaves at seven WAGON DAY+1 and reaches Silverton mid-morning WAGON DAY+3: the four days it is a mark are D-1, D, D+1 and D+2.
   (The Inn seat's "WAGON DAY-2 ... Silverton on WAGON DAY+2" was cut on the old 35-mile road; THE WORLD's is 68.)
   THE MEETINGS (the Inn seat's §3 (a) and (c); (b) and (d) are the inn's own, js/inn.js): (a) THE ROAD BY DAY, south of the inn, northbound -- a talk on the counter screen
   with the wagon's tail for its picture, Amara's smooth word from the bench; the house reads History or Insight DC 10 in silence ("goblins" carried toward Silverton is
   backwards, module-halfway-inn.md §3); ASK WHERE THEY ARE BOUND (her lie, Insight 13, a second look at +5), LOOK IN THE BED (Perception 12), DETECT MAGIC (a caster's: the
   whole bed hums with illusion), LET THEM BY; the glamour seen, STAND IN THE ROAD -- Lymen's word, or the confrontation and the bribe (the night's own, js/inn.js In.confront).
   A fight forced here is `roadday` on `southroad` (data/fights.js, data/maps.js): the pair break for the greys from the first turn and by day on the open road, with the
   horses, they are lost -- no gulch between (RULED 11-04: "with horses losing them there is losing them"); the wagon and its children stay in the road. (c) THE ROAD NORTH
   the morning after a night the wagon left the inn: the same talk and checks, the wagon one "goblin" fewer, the traveler on the bench if she rode.
   The words here are the seat's drafts (RULED 09-24: the drafts stand; invented.json halfway-wagon-road). The show: deep16/?wagonshow. The bench: dev/bench16.js mode=wagon1104. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, W = D.world, In = D.inn, Wg = D.wagon = {};
  if (!W || !In) return;
  var L = function (k, o) { return D.counter.L(k, o); };
  var K = function (q, r) { return q + ',' + r; };
  Wg.CART = { mi: 17, from: 7, to: 19 }; // (the realm's cart-day: 17 miles, seven to seven -- his to move)
  Wg.INN_HOUR = 18; Wg.LEAVE_HOUR = 7;     // (at the inn at dusk on WAGON DAY: js/inn.js In.wagonTonight reads the day; away at first light the morning after)
  Wg.pace = function () { return Wg.CART.mi / (Wg.CART.to - Wg.CART.from); };
  Wg.cal = function () { return (In && In.WAGON) || { first: 6, every: 28 }; };

  // ---------------------------------------------------------------- the road: the Pit to Silverton as one line of miles (the Pit road to the fork, the mile on to the town)
  var RT = null;
  Wg.route = function () {
    var m = W.map && W.map('world'); if (!m || !m.pathById) return null;
    if (RT && RT.m === m) return RT;
    var P1 = m.pathById.pitroad, P2 = m.pathById.mile; if (!P1 || !P2) return null;
    var pts = P1.pts.slice(), p2 = P2.pts.slice(), j0 = pts[pts.length - 1], j1 = p2[0];
    if (j0 && j1 && Math.hypot(j0[0] - j1[0], j0[1] - j1[1]) < 0.05) p2.shift(); // (the fork once)
    pts = pts.concat(p2);
    var cum = [0]; for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var inn = (m.sites || []).filter(function (s) { return s.id === 'inn'; })[0];
    RT = { m: m, pts: pts, cum: cum, fork: P1._cum ? P1._cum[P1._cum.length - 1] : cumAt(pts, cum, P1.pts.length - 1), end: cum[cum.length - 1], ids: { pitroad: 1, mile: 1 } };
    RT.inn = inn ? Wg.roadS([inn.x, inn.y]).s : RT.fork * 0.58;
    return RT;
  };
  function cumAt(pts, cum, i) { return cum[Math.max(0, Math.min(cum.length - 1, i))]; }
  Wg.pt = function (s) { // (the point s miles along the road from the Pit)
    var R = Wg.route(); if (!R) return null;
    var c = R.cum, j = 1; while (j < c.length - 1 && c[j] < s) j++;
    var a = R.pts[j - 1], b = R.pts[j], len = c[j] - c[j - 1], u = len ? Math.max(0, Math.min(1, (s - c[j - 1]) / len)) : 0;
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  };
  Wg.roadS = function (pt) { // (the nearest mile of the road to a point, and how far off it the point lies)
    var R = Wg.route(); if (!R) return { s: 0, d: 1e9 };
    var best = { s: 0, d: 1e9 };
    for (var i = 1; i < R.pts.length; i++) {
      var a = R.pts[i - 1], b = R.pts[i], vx = b[0] - a[0], vy = b[1] - a[1], l2 = vx * vx + vy * vy || 1, u = Math.max(0, Math.min(1, ((pt[0] - a[0]) * vx + (pt[1] - a[1]) * vy) / l2));
      var d = Math.hypot(pt[0] - a[0] - vx * u, pt[1] - a[1] - vy * u);
      if (d < best.d) best = { s: R.cum[i - 1] + Math.sqrt(l2) * u, d: d };
    }
    return best;
  };

  // ---------------------------------------------------------------- the clock: the cart's hours (seven to seven), camped between
  Wg.cartHours = function (t0, t1) { // (travel hours between two clock times)
    var h = 0, t = t0, C = Wg.CART;
    for (var k = 0; k < 400 && t < t1; k++) { var d = Math.floor(t / 24), a = Math.max(t, d * 24 + C.from), b = Math.min(t1, d * 24 + C.to); if (b > a) h += b - a; t = (d + 1) * 24; }
    return h;
  };
  Wg.advance = function (t0, h) { // (the clock when h cart hours have gone by since t0)
    var t = t0, C = Wg.CART;
    for (var k = 0; k < 400 && h > 1e-9; k++) {
      var d = Math.floor(t / 24), a = Math.max(t, d * 24 + C.from), b = d * 24 + C.to;
      if (a >= b) { t = (d + 1) * 24 + C.from; continue; }
      var take = Math.min(h, b - a); t = a + take; h -= take;
      if (h > 1e-9) t = (d + 1) * 24 + C.from;
    }
    return t;
  };
  Wg.back = function (t1, h) { // (the clock h cart hours before t1)
    var t = t1, C = Wg.CART;
    for (var k = 0; k < 400 && h > 1e-9; k++) {
      var d = Math.floor(t / 24), b = Math.min(t, d * 24 + C.to), a = d * 24 + C.from;
      if (b <= a) { t = (d - 1) * 24 + C.to; continue; }
      var take = Math.min(h, b - a); t = b - take; h -= take;
      if (h > 1e-9) t = (d - 1) * 24 + C.to;
    }
    return t;
  };
  Wg.day = function (k) { var c = Wg.cal(); return c.first + k * c.every; }; // (cycle k's WAGON DAY, the day's number)
  Wg.legs = function (k) { // (cycle k's two legs on the clock: the Pit to the inn, the inn to Silverton)
    var R = Wg.route(); if (!R) return null;
    var d0 = Wg.day(k), pace = Wg.pace(), arriveInn = (d0 - 1) * 24 + Wg.INN_HOUR, departInn = d0 * 24 + Wg.LEAVE_HOUR;
    return { k: k, day: d0, departPit: Wg.back(arriveInn, R.inn / pace), arriveInn: arriveInn, departInn: departInn, arriveSil: Wg.advance(departInn, (R.end - R.inn) / pace) };
  };
  Wg.stopped = function (f, k) { return !!f && f.wagonStopped === 'c' + k; };
  // where the wagon is at clock time t: { k, leg: 'south' | 'inn' | 'north', s, pt, moving }, or null between cycles (and after a cycle's wagon was stopped)
  Wg.at = function (t, f) {
    var R = Wg.route(); if (!R || t == null) return null;
    var c = Wg.cal(), pace = Wg.pace(), day = Math.floor(t / 24) + 1, k0 = Math.round((day - c.first) / c.every);
    for (var i = -1; i <= 1; i++) {
      var k = k0 + i; if (k < 0 || Wg.stopped(f, k)) continue;
      var Lg = Wg.legs(k); if (!Lg) return null;
      var hr = ((t % 24) + 24) % 24, moving = hr >= Wg.CART.from && hr < Wg.CART.to;
      if (t >= Lg.departPit && t < Lg.arriveInn) { var s1 = Math.min(R.inn, Wg.cartHours(Lg.departPit, t) * pace); return { k: k, leg: 'south', s: s1, pt: Wg.pt(s1), moving: moving, legs: Lg }; }
      if (t >= Lg.arriveInn && t < Lg.departInn) return { k: k, leg: 'inn', s: R.inn, pt: Wg.pt(R.inn), moving: false, legs: Lg };
      if (t >= Lg.departInn && t < Lg.arriveSil) { var s2 = Math.min(R.end, R.inn + Wg.cartHours(Lg.departInn, t) * pace); return { k: k, leg: 'north', s: s2, pt: Wg.pt(s2), moving: moving, legs: Lg }; }
    }
    return null;
  };
  Wg.flags = function () { return (W.house() && D.house.cur.flags) || Wg.testFlags || {}; };
  Wg.now = function () { var S = W.state && W.state(); return S ? Wg.at(S.t, Wg.flags()) : null; };

  // ---------------------------------------------------------------- the mark: a wagon on the road, on the hex view and the top-down (js/world.js draw, js/overworld.js OV.draw)
  function glyph(g, x, y, s, t) { // (a cart under its canvas, two wheels; s: its size, 1 at the default zoom)
    var w = Math.max(4, Math.round(7 * s)), h = Math.max(3, Math.round(4 * s)), r = Math.max(1, Math.round(1.5 * s));
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x, y + 1, w * 0.8, Math.max(1, h * 0.45), 0, 0, 7); g.fill();
    g.fillStyle = '#5a3a1c'; g.fillRect(x - w / 2, y - h, w, h);
    g.fillStyle = '#e8dcc0'; g.beginPath(); g.moveTo(x - w / 2, y - h); g.quadraticCurveTo(x, y - h - Math.max(3, 4 * s), x + w / 2, y - h); g.closePath(); g.fill();
    g.strokeStyle = '#2a180a'; g.lineWidth = 1; g.strokeRect(x - w / 2 + 0.5, y - h + 0.5, w - 1, h - 1);
    g.fillStyle = '#1a1206'; g.beginPath(); g.arc(x - w / 2 + r + 1, y, r, 0, 7); g.fill(); g.beginPath(); g.arc(x + w / 2 - r - 1, y, r, 0, 7); g.fill();
  }
  W.drawWagon = function (g, cam, t) { // (the hex view: after the places, before the party's banner -- js/world.js World.draw)
    var w = Wg.now(); if (!w || w.leg === 'inn' || !w.pt || !W.groundAt) return;
    var p = W.groundAt(cam, w.pt[0], w.pt[1]); if (p[0] < -20 || p[0] > cam.W + 20 || p[1] < -20 || p[1] > cam.H + 20) return;
    if (W.visAt && !W.visAt(p, w.pt[1])) return; // (THE FINE LAND: behind a ridge, not seen)
    var s = Math.max(0.6, Math.min(2.2, cam.z * (W.M().w) / 30));
    glyph(g, Math.round(p[0]), Math.round(p[1]), s, t);
    if (cam.z >= 12) D.text(g, 'a wagon', Math.round(p[0]) + 6, Math.round(p[1]) - 12, '#c8bca0');
    Wg.drawn = { x: Math.round(p[0]), y: Math.round(p[1]) }; // (for the bench's eye)
  };
  W.drawWagonTop = function (g, sc, scr, ts, T) { // (the top-down view: the tiles' own scale -- js/overworld.js OV.draw)
    var w = Wg.now(); if (!w || w.leg === 'inn' || !w.pt) return;
    var px = ts / T.mi, cam = sc.ov.cam, x = Math.round((w.pt[0] - cam[0]) * px + D.W / 2), y = Math.round((w.pt[1] - cam[1]) * px + D.H / 2);
    glyph(g, x, y, Math.max(0.6, Math.min(2.2, ts / 16)), sc.t);
    if (ts >= 12) D.text(g, 'a wagon', x + 6, y - 12, '#c8bca0');
  };

  // ---------------------------------------------------------------- the meeting: where the party's hex meets the wagon's (THE WORLD's step, js/world.js W.onStep; before the
  // gulch's own step and the road's fights)
  Wg.metKey = function (w) { return 'c' + w.k + w.leg; };
  Wg.met = function (f, w) { return ((f && f.wagonMet) || '').split(',').indexOf(Wg.metKey(w)) >= 0; };
  Wg.markMet = function (f, w) { var l = ((f && f.wagonMet) || '').split(',').filter(Boolean); if (l.indexOf(Wg.metKey(w)) < 0) l.push(Wg.metKey(w)); f.wagonMet = l.join(','); };
  Wg.meeting = function (scene, st) { // (the wagon met on this step, or null)
    var S = W.state(), m = W.M(), f = Wg.flags(); if (!S || !m || !W.house()) return null;
    if (/[?&]nowagon\b/.test(scene.q || '')) return null;
    var w = Wg.at(S.t, f); if (!w || w.leg === 'inn' || Wg.met(f, w)) return null;
    var P = m.road[K(S.at[0], S.at[1])]; if (!P || !(P.id === 'pitroad' || P.id === 'mile')) return null; // (the party on the wagon's road)
    var here = W.restPt(), p1 = Wg.roadS(here); if (p1.d > m.w) return null;
    var half = m.w / 2, close = Math.abs(p1.s - w.s) <= half;
    var crossed = false;
    if (!close && S.from && st && st.h) {
      var hc0 = W.hc(S.from[0], S.from[1]), p0 = Wg.roadS(hc0), w0 = Wg.at(S.t - st.h, f);
      if (w0 && w0.leg === w.leg && p0.d <= m.w) crossed = (p0.s - w0.s) * (p1.s - w.s) <= 0;
    }
    return close || crossed ? w : null;
  };
  var step0 = W.onStep;
  W.onStep = function (scene, st) {
    var w = Wg.meeting(scene, st);
    if (w) { Wg.meet(scene, w); return true; }
    return step0 ? step0.apply(this, arguments) : false;
  };
  // after a counter screen on THE WORLD has closed: the next thing, on the scene's next frame (the screen pops itself as its script ends; the world runs again after)
  var up0 = W.World.prototype.update;
  W.World.prototype.update = function () { if (this.pend) { var p = this.pend; this.pend = null; p.call(this); return; } return up0.apply(this, arguments); };
  Wg.then = function (scene, fn) { scene.pend = fn; };
  Wg.wrap = function (lines) { var out = []; [].concat(lines).forEach(function (l) { out = out.concat(D.wrap(l, 284)); }); return out; };

  // ---------------------------------------------------------------- the talk (the night's shape, js/inn.js In.wagonScene: the reads silent, the chosen rolls shown, every die on the trail)
  Wg.LINES = {
    openS: ['On the road ahead, northbound at a walk: one big wagon under a canvas cover, two greys in the traces, a woman on the bench with the reins and a fair-haired man beside her. Chained in the back, goblins.'],
    openN: ['Behind you on the road, coming up at a walk: the wagon from the inn\'s yard, the greys in the traces, the woman on the bench with the reins and the fair-haired man beside her. Chained in the back, goblins -- one fewer than there were, if anyone counted.'],
    kat: 'Between them on the bench, a young woman in a brown farm dress, a bag at her feet. She does not look at you.',
    amaraS: '"Mind the ruts. The Pit road\'s slow this time of year. You\'ll want the Halfway Inn before dark; it\'s the only roof between here and Silverton."',
    amaraN: '"The road\'s long to Silverton. Don\'t let us keep you."',
    backwards: '{c}(history) Goblins carried north, toward Silverton. The trade runs the other way: nothing goblin goes TO the Dominion\'s city, chained or otherwise.{/}',
    lie: '"Live goblins for the Illusion school\'s gate. The masters pay for them, and pay well. Don\'t ask me what for."',
    insight: 'Something in how she says the school. The schools buy nothing they could not make for themselves. You look again, harder.',
    bed: 'Goblins, chained, quiet. One of them looks at you and looks away.',
    seen: '{y}Seen through:{/} those are not goblins. Those are children.',
    detect: 'The whole wagon-bed hums with illusion: every one of them, chains and all.',
    let: 'Goblins in chains, a tired crew, a wagon on the road. None of yours. The wagon goes on north.',
    letSeen: 'You let them by. The wagon goes on north, and the children with it.',
    bribe: 'Amara counts it into your hand from the bench without getting down. The wagon goes on north, and the children with it.',
    fled: 'They are away north on the greys, the traces cut and the wagon left standing in the road. By daylight, on the open road, there is no catching them.',
    fledTower: 'They\'ll be in Silverton by nightfall, and the Tower\'s door opens for them.',
    won: 'It is over on the road.',
    wagonS: 'The wagon stands in the road, the traces cut, the team gone. In the back, chained, eight children. Real, and very quiet.',
    wagonN: 'The wagon stands in the road, the traces cut, the team gone. In the back, chained, seven children. Real, and very quiet.',
    bring: 'There is no roof nearer than the Halfway Inn. You turn the wagon for it, the children in the back.',
    brought: ['The wagon in the yard, eight children in the back of it, and the Waterbys in the door.', '{y}Doran Waterby{/} climbs up on the bench that same night and drives them back down the road to Newland.'],
    broughtN: ['The wagon in the yard, seven children in the back of it, and the Waterbys in the door.', '{y}Doran Waterby{/} climbs up on the bench that same night and drives them back down the road to Newland.'],
    paidNight: 'The wagon turns in after dark, as you knew it would. You keep to your room, as paid.'
  };
  Wg.OPTS = { ask: 'ASK WHERE THEY ARE BOUND', look: 'LOOK IN THE BED', detect: 'DETECT MAGIC', stand: 'STAND IN THE ROAD', let: 'LET THEM BY' };
  // the wagon's tail for the talk's picture (the night's, js/inn.js In.tailPic, with the house's flags; one fewer in the bed on the road north)
  Wg.tailPic = function (w) {
    return function (ctx, x, y, wd, h, t) {
      var f = Wg.flags(), seen = f.glamourSeen || f.glamourBroken, sh = seen ? 'kid1_p0' : 'goblin_p2', sh2 = seen ? 'kid2_p0' : 'goblin_p2';
      ctx.fillStyle = w && w.leg === 'north' ? '#1c2440' : '#3a4a70'; ctx.fillRect(x, y, wd, h); // (daylight: the sky, not the yard's dark)
      ctx.fillStyle = '#3a2a1c'; ctx.fillRect(x + 8, y + h * 0.62, wd - 16, h * 0.12);
      try { if (D.spr && D.spr.draw && D.SHEETS[sh]) { D.spr.draw(ctx, sh, 'idle', D.spr.facingFor(0, 1), t, x + wd * 0.36, y + h * 0.66, {}); if (!(w && w.leg === 'north')) D.spr.draw(ctx, sh2, 'idle', D.spr.facingFor(0, 1), t + 9, x + wd * 0.64, y + h * 0.66, {}); } } catch (e) { }
      ctx.fillStyle = '#f8d878'; ctx.font = '10px monospace'; ctx.fillText('the wagon\'s tail', x + 10, y + 16);
    };
  };
  // one who can cast Detect Magic here: a wizard's ritual from the book (no slot), else one with it prepared and a slot for it
  Wg.detector = function (st) {
    var R = DS.R, out = null;
    st.party.forEach(function (h) {
      if (out || h.dead || h.ko || h.hp <= 0) return;
      var list = R.castable ? R.castable(h, 'field') : (h.known || []); if (list.indexOf('detectmagic') < 0) return;
      var rit = R.ritualsOf && R.ritualsOf(h).indexOf('detectmagic') >= 0, slot = rit ? 0 : R.lowestSlot(h, 1);
      if (rit || slot) out = { h: h, ritual: !!rit, slot: slot };
    });
    return out;
  };
  Wg.katRides = function (f, w) { return w.leg === 'north' && (!!f.katRode || (w.k === 0 && !f.katGone)); };
  Wg.roadScene = function* (sc, w) {
    var st = sc.st, f = st.flags, north = w.leg === 'north', party = st.party.filter(function (h) { return !h.dead && !h.ko && h.hp > 0 && !h.guest; }), Ln = Wg.LINES;
    var seen = function () { return !!(f.glamourSeen || f.glamourBroken); };
    var open = (north ? Ln.openN : Ln.openS).slice(); if (Wg.katRides(f, w)) open.push(Ln.kat);
    yield sc.narr(open);
    yield sc.say(In.who('Amara', north ? Ln.amaraN : Ln.amaraS));
    if (!f.wagonBackwards && (In.read(st, 'History', 10) || In.read(st, 'Insight', 10))) { f.wagonBackwards = 1; yield sc.narr(Ln.backwards); } // (the house's silent read, once)
    var asked = {};
    for (var k = 0; k < 6; k++) {
      var opts = [], acts = [];
      if (seen()) { opts.push(Wg.OPTS.stand); acts.push('stand'); }
      else {
        if (!asked.ask) { opts.push(Wg.OPTS.ask); acts.push('ask'); }
        if (!asked.look) { opts.push(Wg.OPTS.look); acts.push('look'); }
        if (!asked.detect && Wg.detector(st)) { opts.push(Wg.OPTS.detect); acts.push('detect'); }
      }
      opts.push(Wg.OPTS.let); acts.push('let');
      var a = acts[yield sc.ask('On the road.', opts)];
      if (a == null || a === 'let') { yield sc.narr(seen() ? Ln.letSeen : Ln.let); return { how: 'let' }; }
      asked[a] = 1;
      if (a === 'ask') {
        yield sc.say(In.who('Amara', Ln.lie));
        if (party.some(function (h) { var r = In.d20(), v = DS.R.skill(h, 'Insight', 'wis'), ok = r + v >= 13; In.trail((h.name || h.id) + ' Insight ' + r + ' + ' + v + ' vs DC 13 at the lie on the road' + (ok ? ', heard' : ', not')); return ok; })) {
          yield sc.narr(Ln.insight);
          if (party.some(function (h) { return In.perceives(h, 12, 5); })) { In.saw(st, f); yield sc.narr(Ln.seen); }
          else yield sc.narr(Ln.bed);
        }
      } else if (a === 'look') {
        if (party.some(function (h) { return In.perceives(h, 12); })) { In.saw(st, f); yield sc.narr(Ln.seen); }
        else yield sc.narr(Ln.bed);
      } else if (a === 'detect') {
        var dt = Wg.detector(st); if (dt) { if (dt.slot) dt.h.slots[dt.slot - 1]--; In.trail((dt.h.name || dt.h.id) + ' casts Detect Magic at the wagon' + (dt.ritual ? ' (a ritual)' : '')); In.saw(st, f); yield sc.narr(['{y}' + dt.h.name + ' casts Detect Magic' + (dt.ritual ? ', the ritual, ten minutes with the book open.' : '.') + '{/}', Ln.detect]); }
      } else if (a === 'stand') {
        var res = yield* In.confront(sc, st, f, party, f.wagonBribed === 'c' + w.k); // (no second bribe in a cycle already paid)
        return { how: res.how === 'bribe' ? 'bribe' : 'fight' };
      }
    }
    return { how: 'let' };
  };
  // the meeting itself: the talk on the counter screen over THE WORLD, then by its end -- the wagon by, the gold, or the fight
  Wg.meet = function (scene, w) {
    var C = D.counter, f = Wg.flags(), res = null;
    Wg.markMet(f, w); f.wagonRoad = 'met';
    if (D.house && D.house.trail) D.house.trail('talk', 'the wagon on the road ' + (w.leg === 'north' ? 'north' : 'south') + ' of the inn, cycle ' + w.k);
    D.sfx('encounter'); scene.walk = null; scene.plan = null;
    var sc = new C.Counter(null, { id: 'wagonRoad', name: 'Amara', place: 'The Pit road', what: w.leg === 'north' ? 'north of the Halfway Inn' : 'south of the Halfway Inn', pic: Wg.tailPic(w),
      script: function (s) { return (function* () { res = yield* Wg.roadScene(s, w); })(); } });
    D.push(sc);
    Wg.then(scene, function () {
      var how = (res && res.how) || 'let', st = C.state(null);
      if (how === 'bribe') { st.silver(500); D.sfx('coin'); f.wagonBribed = 'c' + w.k; f.glamourBroken = 1; f.wagonRoad = 'bribe'; scene.card(Wg.wrap([L('g.foundSilver', { n: 500 }), Wg.LINES.bribe])); W.save(); return; }
      if (how === 'fight') { f.wagonRoad = 'fight'; Wg.fight(scene, w); return; }
      f.wagonRoad = 'let'; W.save(); scene.say('The wagon goes on ' + (w.leg === 'north' ? 'north' : 'north, toward the inn') + ', ' + W.timeOfDay() + '.');
    });
  };

  // ---------------------------------------------------------------- the fight on the road by day: `roadday` on `southroad`, the pair away on the greys unless they are dropped first
  Wg.fight = function (scene, w) {
    var H = D.house, F0 = D.fight && D.fight('roadday'); if (!F0 || !H || !H.playing) return;
    var F = Object.assign({}, F0, { level: (H.cur.party[0] || {}).lvl || F0.level, sub: (w.leg === 'north' ? 'north' : 'south') + ' of the Halfway Inn, by day' });
    var rec = { fight: 'roadday', name: 'The Pit road: ' + F.name, level: (H.cur.party[0] || {}).lvl, simple: false };
    var recEnd = function (b, res) { if (b && b.rec && D.rec && D.rec.finish) { try { D.rec.finish(b, res || 'left'); } catch (e) { /* (the record must never stop the way back) */ } } };
    var b = new D.Battle({ fightDef: F, data: H.living(H.cur), house: true, world: true, record: rec,
      payNow: function (bb, res) { var pf = H.payFight(bb, res === 'fled' ? 'won' : res); bb.housePay = pf; return pf.lines; }, // (the one dropped before the other got away pays as the fallen do)
      onDone: function (res) { recEnd(b, res); Wg.afterFight(scene, w, res, b); } });
    var e0 = b.enter;
    b.enter = function () {
      e0.apply(this, arguments);
      this.units.forEach(function (u) { // (the party comes up the road from the south, the pair at the wagon's tail; the pair mounted the moment they break -- SRD 5.1 Draft Horse, speed 40)
        u.facing = D.spr.facingFor(0, u.side === 'party' ? -1 : 1);
        if (u.side === 'foe' && D.FOES[u.kind] && D.FOES[u.kind].flees) { u.flees = true; u.mounted = true; u.speed = Math.max(u.speed || 30, 40); }
      });
    };
    Wg.lastFight = { willemDead: false };
    D.push(b);
  };
  Wg.afterFight = function (scene, w, res, b) {
    var H = D.house, C = D.counter, f = Wg.flags(), S = W.state();
    try { D.music('corridor'); } catch (e) { }
    if (res !== 'won' && res !== 'fled' && res !== 'escaped') { H.afterFight(b, res); return; } // (a loss: the title)
    H.trail('fight', res + ' in ' + (b.round || '?') + ' rounds: the wagon on the road');
    H.takeBack(b); S.t += W.FIGHT_HOURS; W.save();
    if (res === 'escaped') { f.wagonRoad = 'escaped'; scene.say('The party got clear of them. The wagon goes on, ' + W.timeOfDay() + '.'); return; }
    var willemDead = b.units.some(function (u) { return u.kind === 'willem' && u.side === 'foe' && u.hp <= 0 && !u.fled; });
    if (!b.housePay && res === 'fled') { var pf = H.payFight(b, 'won', true); pf.give.forEach(function (g) { H.add(H.cur.inv, g[0], g[1]); }); } // (paid on the card already when the card paid)
    f.wagonStopped = 'c' + w.k; f.wagonCycle = w.k; f.wagonOutcome = 'road'; f.wagonRoad = res; f.glamourBroken = 1; f.glamourSeen = 1; f.wagonBrought = 1; f.wagonBroughtN = w.leg === 'north' ? 7 : 8;
    var st = C.state(null), lines = [res === 'fled' ? Wg.LINES.fled : Wg.LINES.won];
    if (res === 'fled' && w.leg === 'north') lines.push(Wg.LINES.fledTower);
    lines.push(w.leg === 'north' ? Wg.LINES.wagonN : Wg.LINES.wagonS, L('wagon.strongbox'));
    st.silver(600); C.give(st, 'wagonorder', 1); D.sfx('chest'); lines.push(L('g.foundSilver', { n: 600 }), L('g.got', { item: DS.DATA.items.wagonorder.name }));
    if (willemDead && DS.DATA.items.willembook && C.count(st, 'willembook') === 0) { C.give(st, 'willembook', 1); lines.push(In.WN.book, L('g.got', { item: DS.DATA.items.willembook.name })); } // (his book when the party kills him -- the house lane's item 7, 09-30c)
    lines = lines.concat(C.renown(st, 1, 'renown.wagon'), [Wg.LINES.bring]);
    W.save();
    var sc = new C.Counter(null, { id: 'wagonRoad', name: 'The wagon', place: 'The Pit road', what: (w.leg === 'north' ? 'north' : 'south') + ' of the Halfway Inn', pic: Wg.tailPic(w), script: function (s) { return (function* () { yield s.narr(lines); })(); } });
    D.push(sc);
    Wg.then(scene, function () { scene.say('The wagon turned for the Halfway Inn, ' + W.timeOfDay() + '.'); });
  };

  // ---------------------------------------------------------------- THE WAGON ON THE ROAD, shown (deep16/?wagonshow -- the eyes rows' door): a NEW GAME's four staged on THE WORLD's road by the beat
  Wg.BEATS = [
    { id: 'mark', label: 'THE MARK ON THE WORLD: the wagon on the road south of the inn, WAGON DAY at noon', note: 'A NEW GAME at the Halfway Inn\'s hex at noon on day 6 (the first WAGON DAY). South down the Pit road, eight miles off, a wagon under a canvas cover is on the road, coming north at a walk: wheel out to see it, in to name it. It reaches the inn at dusk; the inn\'s own wagon night is the ?innshow\'s. Walk south down the road and you meet it.', day: 6, hour: 12, atInn: true },
    { id: 'roadday', label: 'THE ROAD BY DAY: the wagon met south of the inn (the talk, the reads, the gold or steel)', note: 'Day 6, five in the afternoon, the four on the Pit road a hex south of the wagon, an hour short of the inn. Walk one hex north (an arrow, or click the next hex): Amara\'s word from the bench, the house\'s silent read, ASK WHERE THEY ARE BOUND (her lie: Insight 13, a second look), LOOK IN THE BED (Perception 12), DETECT MAGIC (Aurdin\'s ritual: the bed hums), LET THEM BY; seen through, STAND IN THE ROAD -- Lymen\'s word, and the fight on the road by day: the pair break for the greys from the first turn, and with the horses they are lost unless you drop them first. The dice pinned: the lie heard, the second look made.', day: 6, hour: 17, off: -1, dice: [15, 18, 18, 18] },
    { id: 'roadnorth', label: 'THE ROAD NORTH: the morning after a quiet wagon night', note: 'Day 7, eight in the morning, the four at the inn\'s hex after a night the wagon left at first light (the glamour broken at the window, the traveler ridden out with it). Walk north up the road: the wagon one "goblin" fewer, the young woman on the bench, the same talk -- and STAND IN THE ROAD goes straight to the fight; a fight lost here is the pair in Silverton by nightfall, the Tower\'s door in words.', day: 7, hour: 8, off: 0, flags: { wagonCycle: 0, wagonOutcome: 'quiet', katRode: 1, katGone: 1, glamourBroken: 1, reachedInn: 1 }, atInn: true }
  ];
  Wg.play = function (bt) {
    var H = D.house, rec = H.fresh(); rec.at = { town: null }; rec.flags = Object.assign({}, bt.flags || {}); rec.silver = Math.max(rec.silver || 0, 60);
    var wm = W.map && W.index && W.index() && W.map('world'), inn = wm && (wm.sites || []).filter(function (s) { return s.id === 'inn'; })[0];
    H.begin(rec, 0, inn ? '?world&at=' + inn.hex[0] + ',' + inn.hex[1] : '?world');
    var S = W.state(), t = (bt.day - 1) * 24 + bt.hour; S.t = t; S.today = 0; S.todayHex = 0;
    In.pinned = bt.dice ? bt.dice.slice() : null;
    var R = Wg.route(), w = Wg.at(t, rec.flags), hw = w && w.pt ? W.worldHexOf(w.pt[0], w.pt[1]) : null, mw = hw && W.nearOn() && W.inArea(hw[0], hw[1]) && W.map('near') ? W.map('near').w : 5; // (a hex of the map that covers the wagon)
    var s = bt.atInn || !w ? (R ? R.inn : 0) : w.s + (bt.off || 0) * mw * 0.95, pt = Wg.pt(Math.max(0, s));
    if (pt) { S.pos = pt.slice(); if (W.place(pt)) W.scene.onMap(); S.from = null; S.rv = null; var sc = W.scene, lk = sc.lookAt(pt[0], pt[1]); sc.cam.cx = lk[0]; sc.cam.cy = lk[1]; }
    W.save();
    if (W.scene) W.scene.say(bt.id === 'mark' ? 'Noon on WAGON DAY at the inn: the wagon is on the road to the south.' : 'The Pit road, ' + W.timeOfDay() + ': walk north a hex.');
  };
  Wg.show = function (q) { return new D.roam.WetShow(q, { kind: 'wagonshow', beats: Wg.BEATS, play: Wg.play, title: '{y}THE WAGON ON THE ROAD, 11-04{/} -- the mark on THE WORLD, the road by day, the road north (a show)' }); };
})();
