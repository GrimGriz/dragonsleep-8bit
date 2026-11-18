/* THE SNOOT'S ROAD -- the snooting bands as markers on THE WORLD before the Snoot's board opens (the clock seat, 2026-11-14; the clock lane's 2026-11-14 evening
   sections). His words, typed to the clock seat: "I'd like each playthrough to get it's own snoot, in that the snoot markers have a % chance of finding a farm and
   which direction they go is now less static. Party and snoot marker in the same hex should be more than random encounter, perception checks to see if they notice
   the snooting gnolls in time to interrupt movement and retreat (should we give them dustclouds from nearby hexes or something?)"; "Snoot markers - roll to find a farm
   in each hex, percentage based on # of farms in that hex, snoots it for a day if found - survivors make for nearest silverton, inn or pit"; "shifting gossip time
   based on how it rolls out for that playthrough (not necessarily 7)"; "we'll try it with the dust cloud."; "and finding a snootable location has them in that hex
   for that 24 hours".

   WHO IS OUT (the clans as he sorted them the same evening; gnoll-hills.md; the clock lane's 11-04 night): the Gray Keeping's young blood, from the moot ground from
   the first morning (the edgeland farmers are its victims); two bands of the Skull-Gate, from where its chief's right hand was made the Harbinger at noon of day 3
   (the third of its groups follows the Harbinger and is not out for farms); the Wall-Laugh's young blood, from its seat once the tribe is home from the moot and has
   done its rites. Not out: the death-watch and the Gray Keeping's band (withdrawn to their home-place), the Harbinger's pack, the Wall-Laugh itself.

   A BAND'S DAY: SR.HEXES hexes, one at each of SR.HOURS. Each step is the hex beside it nearest the Pit six times in ten, else one of the two next nearest: its way is
   the save's own. In a hex it enters it rolls for each farm standing there, SR.FIND in a hundred each (the Snoot's board's own number, snoot-mode/js/rules.js SN.FIND)
   -- so the more farms a hex holds the likelier it finds one -- and what it finds it burns; having found one it is in that hex for 24 hours. The people of what it
   burned walk for the nearest of the Halfway Inn, Tarlyn's Pit and Silverton, one band of survivors a finding (js/hunger.js HG.refugees carries them, and the
   meeting on the road). The supper's farmers' word is told from the day their word reaches the inn (SR.rumorDay).

   THE RUN-IN: the party in a band's hex is no roll of the road's percent. The keenest eye of the party rolls Perception (SR.DC: by day 10, after dark 15, 5 easier on
   a band busy at a farm): made, they have seen the gnolls first and may BACK AWAY a hex or FIGHT; missed, the laugh goes up and it is a fight. The fight is with the
   hands of the band nearest them (SR.SHARE at most, never the whole war-band); what the party kills comes off the band in the save (S.snootLoss) whether they win or
   get clear, and a band with nobody left is gone. By day a band on the move raises DUST seen from the hexes beside it, and one at a farm SMOKE; after dark a burning
   farm is a glow. From SR.BOARD (day 14: his "might be shifting around so undetermined at present") the markers stand where they are: the Snoot's board is to open
   from SR.board() -- kept in the save as `snootRoad` -- and that wiring is the Snoot seat's (snoot-mode/).

   Worked out again from the save's seed each time it is asked, as js/hunger.js is. Every number is the clock seat's first cut unless his word is quoted beside it. */
'use strict';
(function () {
  var D = window.D16, W = D.world, HG = D.hunger, SR = D.snootroad = {}, SQ3 = Math.sqrt(3);
  if (!HG) return;
  SR.on = true;
  SR.BOARD = 14; SR.HEXES = 3; SR.HOURS = [6, 10, 14]; SR.FIND = 0.35; SR.HOLD = 24; SR.STRAIGHT = 0.6; SR.SHARE = 6;
  SR.DC = { day: 10, night: 15, busy: -5 };
  SR.SEATS = { skull: [15, 11], wall: [0, 12] }; // (THE WORLD's own hexes: tools/snoot-map.py SKULL (20,11) and WALL (6,12) in its offset columns, the Snoot seat's placing)
  var BAND = { gloryseeker: 3, gnoll: 9, hyena: 6 }, GRAY = { gloryseekergray: 3, gnollgray: 9, hyena: 6 };
  SR.BANDS = [
    { id: 'gk1', tribe: 'gray', name: 'the Gray Keeping\'s young blood', comp: GRAY, from: 'moot', out: [1, 6] },
    { id: 'sg1', tribe: 'skull', name: 'a Skull-Gate band', comp: BAND, from: 'made', out: [3, 14] },
    { id: 'sg2', tribe: 'skull', name: 'a Skull-Gate band', comp: BAND, from: 'made', out: [4, 6] },
    { id: 'wl2', tribe: 'wall', name: 'the Wall-Laugh\'s young blood', comp: { gnoll: 8, hyena: 4 }, from: 'wall', out: [6, 6] }
  ];
  var DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]], DIRNAME = ['east', 'north-east', 'north-west', 'west', 'south-west', 'south-east'];
  function K(q, r) { return q + ',' + r; }
  function hcw(q, r, w) { return [w * (q + r / 2), w * SQ3 / 2 * r]; }
  function hexOf(x, y, w) {
    var rf = y / (w * SQ3 / 2), qf = x / w - rf / 2, yf = -qf - rf, rx = Math.round(qf), ry = Math.round(yf), rz = Math.round(rf), dx = Math.abs(rx - qf), dy = Math.abs(ry - yf), dz = Math.abs(rz - rf);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
    return [rx + 0, rz + 0];
  }
  function rnd(a, b, c, d) {
    var h = (a >>> 0) ^ 0x51ed270b; [b, c, d].forEach(function (x) { h = Math.imul(h ^ ((x | 0) + 0x7f4a7c15), 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; });
    return (h >>> 0) / 4294967296;
  }
  function site(MW, id) { return MW.sites.filter(function (s) { return s.id === id; })[0] || null; }
  function total(c) { var n = 0; Object.keys(c).forEach(function (k) { n += c[k]; }); return n; }
  SR.start = function (b) { // (where a band sets out from, on THE WORLD)
    var MW = W.Mworld(), m = site(MW, 'moot');
    if (b.from === 'moot') return m ? m.hex.slice() : null;
    if (b.from === 'wall') return SR.SEATS.wall.slice();
    var v = W.vesselAt(W.tAt(3) + W.VESSEL.makeHour); return v ? v.hex.slice() : null; // ('made': where the Harbinger was made, noon of day 3)
  };
  SR.left = function (b, t) { // (a band's own, after what the party has killed of it by the hour)
    var S = W.state(), c = Object.assign({}, b.comp); ((S && S.snootLoss && S.snootLoss[b.id]) || []).forEach(function (l) { if (l.t > t) return; Object.keys(l.k).forEach(function (k) { c[k] = Math.max(0, (c[k] || 0) - l.k[k]); }); });
    return c;
  };
  SR.goneAt = function (b) { var S = W.state(), ls = ((S && S.snootLoss && S.snootLoss[b.id]) || []).slice().sort(function (x, y) { return x.t - y.t; }); for (var i = 0; i < ls.length; i++) if (!total(SR.left(b, ls[i].t))) return ls[i].t; return null; };

  var CACHE = { key: null, res: null, src: null };
  SR.sim = function (t) { // (every band's road, every farm burned and every band of survivors by the hour t)
    var S = W.state(), MW = W.Mworld(), none = { by: {}, burned: {}, ref: [], rolls: 0, found: 0 }; if (!SR.on || !S || !MW) return none;
    if (t == null) t = S.t;
    var seed = (S.seed >>> 0) || 1, tEnd = Math.min(t, W.tAt(SR.BOARD)), key = seed + '|' + Math.floor(tEnd) + '|' + JSON.stringify(S.snootLoss || {});
    if (CACHE.key === key && CACHE.src === MW) return CACHE.res;
    var w = MW.w, FM = HG.farms(), pit = site(MW, 'pit'), goal = pit ? [pit.x, pit.y] : [0, 0], keep = {}, burned = {}, ref = [], by = {}, rolls = 0, found = 0;
    HG.REFUGES.forEach(function (id) { var s = site(MW, id); if (s) keep[K(s.hex[0], s.hex[1])] = id; });
    var ok = function (h) { var e = MW.hex[K(h[0], h[1])], T = e && MW.terr[e.t]; return !!(T && +T.cost > 0) && !keep[K(h[0], h[1])]; };
    SR.BANDS.forEach(function (b, bi) { var s0 = SR.start(b); by[b.id] = { b: b, hex: s0, out: W.tAt(b.out[0]) + b.out[1], hold: -1, gone: SR.goneAt(b), trail: [], burned: 0 }; });
    for (var d = 1; W.tAt(d) <= tEnd; d++) SR.HOURS.forEach(function (h, hi) {
      var T = W.tAt(d) + h; if (T > tEnd) return;
      SR.BANDS.forEach(function (b, bi) {
        var x = by[b.id]; if (!x.hex || T < x.out || T < x.hold || (x.gone != null && T >= x.gone)) return;
        var here = hcw(x.hex[0], x.hex[1], w), nb = DIRS.map(function (dd) { return [x.hex[0] + dd[0], x.hex[1] + dd[1]]; }).filter(ok); if (!nb.length) return;
        var near = Math.hypot(here[0] - goal[0], here[1] - goal[1]) <= 2 * w; // (by the Pit: it prowls, any way)
        nb.sort(function (p, q) { var a = hcw(p[0], p[1], w), c = hcw(q[0], q[1], w); return Math.hypot(a[0] - goal[0], a[1] - goal[1]) - Math.hypot(c[0] - goal[0], c[1] - goal[1]); });
        var r = rnd(seed, bi * 7 + 1, d * 8 + hi, 1), go = near ? nb[Math.floor(r * nb.length)] : r < SR.STRAIGHT || nb.length < 2 ? nb[0] : nb[1 + Math.floor((r - SR.STRAIGHT) / (1 - SR.STRAIGHT) * Math.min(2, nb.length - 1))];
        x.hex = go; var k = K(go[0], go[1]), got = [], ham = false;
        (FM[k] || []).forEach(function (f, fi) { if (burned[f.id] != null || f.id.charAt(0) !== 's') return; /* (the scatter's farms only, the ones frozen round the Pit: a farmland hex's stand-ins by Silverton or under Castegut are not theirs to find) */ rolls++; if (rnd(seed, bi * 7 + 2, d * 8 + hi, fi) < SR.FIND) { burned[f.id] = T; got.push(f); found++; if (f.kind === 'hamlet') ham = true; } });
        x.trail.push({ T: T, hex: go.slice(), found: got.length });
        if (!got.length) return;
        x.hold = T + SR.HOLD; x.burned += got.length; // (his: "snoots it for a day if found")
        var from = hcw(go[0], go[1], w), to = HG.refuge(from);
        if (to) ref.push({ id: 'g' + b.id + '-' + T, zone: 'snoot', band: b.id, tribe: b.tribe, kind: ham ? 'hamlet' : 'farm', n: got.length, t0: T, from: from, hex0: go.slice(), to: to.id, toName: to.name, toPt: to.pt, arrive: T + to.d / HG.CART * 24 });
      });
    });
    var res = { by: by, burned: burned, ref: ref, rolls: rolls, found: found }; CACHE.key = key; CACHE.res = res; CACHE.src = MW; return res;
  };
  SR.bands = function (t) { // (each band out by the hour: where it is, what is left of it, whether it is at a farm)
    var S = W.state(), MW = W.Mworld(); if (!SR.on || !S || !MW) return []; if (t == null) t = S.t;
    var R = SR.sim(t), out = [];
    SR.BANDS.forEach(function (b) {
      var x = R.by[b.id]; if (!x || !x.hex || t < x.out) return;
      var tr = x.trail.filter(function (s) { return s.T <= t; }), last = tr[tr.length - 1], hex = last ? last.hex : SR.start(b), left = SR.left(b, t), gone = x.gone != null && t >= x.gone;
      var busy = !!last && last.found > 0 && t < last.T + SR.HOLD, moved = !!last && !busy && t - last.T < 4 && t < W.tAt(SR.BOARD);
      out.push({ id: b.id, tribe: b.tribe, name: b.name, of: total(b.comp), hex: hex, pt: hcw(hex[0], hex[1], MW.w), left: left, n: total(left), gone: gone, busy: busy, moving: moved, burned: tr.reduce(function (n, s) { return n + s.found; }, 0), trail: tr });
    });
    return out;
  };
  SR.refugees = function (t) { var S = W.state(); if (!SR.on || !S) return []; if (t == null) t = S.t; return SR.sim(t).ref.filter(function (r) { return r.t0 <= t; }); };
  HG.more = function (t) { return SR.refugees(t); }; // (their survivors on the road and at the refuges with the made things': js/hunger.js HG.refugees)
  SR.rumorDay = function (siteId, t) { // (the day word of the burned farms reaches a place: the first band of their people in, or in elsewhere and the word on down the road)
    var S = W.state(), MW = W.Mworld(); if (!SR.on || !S || !MW) return null; if (t == null) t = S.t;
    var at = site(MW, siteId), best = null; if (!at) return null;
    SR.refugees(t).forEach(function (r) { var h = r.arrive + (r.to === siteId ? 0 : Math.hypot(at.x - r.toPt[0], at.y - r.toPt[1]) / HG.CART * 24); if (best == null || h < best) best = h; });
    return best == null ? null : W.dayAt(best);
  };
  SR.board = function (t) { // (for the Snoot's board as it opens: each band's hex in the board's own offset columns too, what is left of it, the farms burned)
    var S = W.state(); if (!S) return null; if (t == null) t = S.t; var R = SR.sim(t);
    return { day: W.dayAt(t), boardDay: SR.BOARD, bands: SR.bands(t).map(function (x) { return { id: x.id, tribe: x.tribe, hex: x.hex, offset: [x.hex[0] + (x.hex[1] - (x.hex[1] & 1)) / 2, x.hex[1]], of: x.of, left: x.left, gone: x.gone, busy: x.busy, burned: x.burned }; }), burned: Object.keys(R.burned).filter(function (id) { return R.burned[id] <= t; }) };
  };
  var save0 = W.save; W.save = function () { try { if (W.house() && D.house.cur) { var sr = SR.board(); sr.atBoard = SR.board(W.tAt(SR.BOARD)); D.house.cur.snootRoad = sr; } /* (atBoard: the bands as they will stand at the dawn of SR.BOARD with what the party has killed by now, so a save kept days before it still opens the board right -- the Snoot seat's ask, 11-15; `of`: a band's whole size) */ } catch (e) { /* (the clock must never stop the walk) */ } return save0.apply(this, arguments); };

  // ---------------------------------------------------------------- the run-in
  SR.LINES = { // (the clock seat's drafts, his to cut)
    dust: 'Dust to the {dir}: many feet, and not a wagon\'s.', smoke: 'Smoke to the {dir}, black, from more than one roof.', glow: 'A glow to the {dir}, low on the sky. Something big is burning.',
    moving: 'Gnolls. {n} of them and their hyenas, strung out across the {where}, going at a lope.', busy: 'Gnolls, {n} of them and their hyenas, at a farmstead. The thatch is alight. They are laughing.',
    first: 'They have not seen the party.', late: 'The laugh goes up before anyone can speak. They have seen the party first.',
    back: 'The party backs away the way it came, low and quiet.', won: 'What is left of them breaks and runs for the hills.', clear: 'The party gets clear. The laughing follows a long way.'
  };
  SR.party = function () { return (W.house() && D.house.cur && D.house.living ? D.house.living(D.house.cur) : null) || SR.testParty || null; };
  SR.here = function (scene) { // (the band in the party's hex, not yet run into today)
    var S = W.state(), MW = W.Mworld(); if (!SR.on || !S || !MW || /[?&]noenc\b/.test((scene && scene.q) || '') || S.t >= W.tAt(SR.BOARD)) return null;
    var pt = W.partyPt(); if (!pt) return null; var ph = hexOf(pt[0], pt[1], MW.w), met = S.snootMet || {};
    return SR.bands().filter(function (x) { return !x.gone && x.n > 0 && x.hex[0] === ph[0] && x.hex[1] === ph[1] && met[x.id] !== W.day(); })[0] || null;
  };
  SR.signs = function (scene) { // (dust, smoke or a glow from the hexes beside the party: once a band a day)
    var S = W.state(), MW = W.Mworld(); if (!SR.on || !S || !MW || S.t >= W.tAt(SR.BOARD)) return null;
    var pt = W.partyPt(); if (!pt) return null; var ph = hexOf(pt[0], pt[1], MW.w), seen = S.snootSign = S.snootSign || {}, night = W.isNight(), line = null;
    SR.bands().forEach(function (x) {
      if (line || x.gone || !x.n || seen[x.id] === W.day()) return; var di = -1; DIRS.forEach(function (d, i) { if (ph[0] + d[0] === x.hex[0] && ph[1] + d[1] === x.hex[1]) di = i; }); if (di < 0) return;
      var kind = x.busy ? (night ? 'glow' : 'smoke') : (!night && x.moving ? 'dust' : null); if (!kind) return;
      seen[x.id] = W.day(); line = SR.LINES[kind].replace('{dir}', DIRNAME[di]);
    });
    return line;
  };
  SR.share = function (x) { // (the hands of the band nearest the party: a leader if one is left, then its men and its hyenas, SR.SHARE at most)
    var c = Object.assign({}, x.left), list = [], take = function (k, n) { for (var i = 0; i < n && c[k] > 0 && list.length < SR.SHARE; i++) { list.push(k); c[k]--; } };
    var ks = Object.keys(c), lead = ks.filter(function (k) { return /^gloryseeker/.test(k); })[0], men = ks.filter(function (k) { return /^gnoll/.test(k); })[0];
    if (lead) take(lead, 1); if (men) take(men, 3); take('hyena', 2); ks.forEach(function (k) { take(k, SR.SHARE); });
    return list.filter(function (k) { return D.FOES && D.FOES[k]; });
  };
  SR.backAway = function (scene) { var S = W.state(); if (!S || !S.from) return; var fr = S.from.slice(); S.from = S.at.slice(); S.at = fr; S.pos = W.hc(fr[0], fr[1]); S.rv = null; W.save(); };
  SR.lose = function (x, b) { // (what the party killed comes off the band, win or run)
    var S = W.state(), k = {}, n = 0; b.units.forEach(function (u) { if (u.side === 'foe' && (u.dead || u.hp <= 0) && x.left[u.kind] != null) { k[u.kind] = (k[u.kind] || 0) + 1; n++; } });
    if (n) { S.snootLoss = S.snootLoss || {}; (S.snootLoss[x.id] = S.snootLoss[x.id] || []).push({ t: S.t, k: k }); W.save(); }
    return n;
  };
  SR.meet = function (scene, x) {
    var S = W.state(), M = W.M(), e = M.hex[W.K(S.at[0], S.at[1])], In = D.inn, P = SR.party(), night = W.isNight();
    (S.snootMet = S.snootMet || {})[x.id] = W.day(); W.save(); D.sfx('encounter'); scene.walk = null; scene.plan = null;
    var dc = (night ? SR.DC.night : SR.DC.day) + (x.busy ? SR.DC.busy : 0), chk = P && In && In.check ? In.check({ party: P }, 'Perception', dc) : { ok: true, line: '' };
    if (D.house && D.house.trail) D.house.trail('talk', 'a snooting band (' + x.id + ', ' + x.n + ' left) in the party\'s hex, day ' + W.day() + ': Perception DC ' + dc + (chk.ok ? ', seen first' : ', seen by them'));
    var where = M.road[W.K(S.at[0], S.at[1])] ? 'road' : (e ? W.groundName(e.t) : 'ground'), wrap = function (l) { return D.wrap ? D.wrap(l, 284) : [l]; };
    var lines = ['{r}On the ' + where + '{/}, ' + W.timeOfDay() + ':', ''].concat(wrap(SR.LINES[x.busy ? 'busy' : 'moving'].replace('{n}', x.n).replace('{where}', where))).concat(['']).concat(chk.line ? [chk.line] : []).concat(wrap(chk.ok ? SR.LINES.first : SR.LINES.late)).concat(['']);
    var fight = function () { SR.fight(scene, x, e); };
    if (chk.ok) scene.card(lines.concat([D.keys('{g}E{/}: fight    {g}X{/}: back away')]), null, [['a', fight, 'FIGHT'], ['b', function () { SR.backAway(scene); scene.say(SR.LINES.back); }, 'BACK AWAY']]);
    else scene.card(lines.concat([D.keys('{g}E{/}: fight')]), null, [['a', fight, 'FIGHT']]);
    return chk;
  };
  SR.fight = function (scene, x, e) {
    var list = SR.share(x), Z = ((window.DS || {}).DATA || {}).encounters || {};
    scene.fight({ zone: 'snoot', Z: Z.snoot || null, grp: { e: [] }, list: list, mirror: false, made: null, snoot: x.id }, e,
      { intro: 'The nearest of the band come at the party, ' + list.length + ' of ' + x.n + '. The rest are a field away.', after: function (res, b) { var n = SR.lose(x, b); scene.afterFight(res, { zone: 'snoot' }, b); if (n && scene.say) scene.say(res === 'won' ? SR.LINES.won : SR.LINES.clear); } });
  };
  var step0 = W.onStep;
  W.onStep = function (scene, st) {
    var x = SR.here(scene);
    if (x) { SR.meet(scene, x); return true; }
    var got = step0 ? step0.apply(this, arguments) : false;
    if (!got && scene && scene.say) { var s = SR.signs(scene); if (s) { W.save(); scene.say(s); } }
    return got;
  };
})();
