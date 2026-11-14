/* THE HUNGER -- what feeds the made things between fights, where each making's pack is on a day, and who flees it (the clock seat, 2026-11-14; the clock lane's
   2026-11-14 evening section). His words, typed to the clock seat: "'travelers and farms will grant feeding opportunities - handled later in a lane' - this is that
   lane :)"; "are we running markers for their what hex they're in what day and adding encounter likelihood that way? odds (they feed) in squares without farms, road
   etc around 5% - resets days only save mirror hyenas, which don't spawn fleeing farmers and become charged. Other mirror entities just feed and spawn fleeing
   survivors."; "3 - 60% on the farms, 90% hamlet - the roads are about that sparse"; "4 - it doesn't stay put, otherwise yes" (a marker goes a hex a day toward the
   nearest farm or road in reach); "4 - derived from farms hit and their travel times, no floor - actually determined by the rolls that play at dawns"; "fleeing farmer
   encounter needs to be added".

   ONE MARKER A MAKING (not a beast: no one beast is tracked between fights). From noon of its making it stands where Mr. Ripples made it (js/world.js W.makings). At
   each dawn after, while it is not gone: (1) it rolls to FEED in the 5-mile hex it is in -- 90% on a hamlet, 60% on a farm, 5% anywhere else, a road's hex too (the
   seat's reading of "the roads are about that sparse"); (2) it goes one hex on, toward the nearest hex in its reach with a farm or hamlet not yet hit, else the nearest
   road's hex, else any way: it never stays put. A feeding starts the making's three days again (the same count a fight's feeding starts, W.madeFed). A farm fed on is
   HIT and feeds nothing again. The mirror hyenas' making (the gnoll hills' ground) fed at a dawn is CHARGED for a day and nobody flees it; any other making's feeding
   sends SURVIVORS for the nearest of the Halfway Inn, Tarlyn's Pit and Silverton at a cart's pace (the realm's 17 miles a day), and the party meets them on a hex of
   their way (HG.meet: a card, no fight). W.mirrorAt's falloff is measured from the marker, so the road's percent rises where the pack IS.

   The whole of it is worked out again from the save's seed and the hour each time it is asked (HG.sim: nothing kept but the party's own feedings, S.madeFed, and
   which survivors were met, S.metRef), so a day skipped by fiat or a bench's far hour reads the same as a day walked. NOTHING HERE IS PLAYER VISIBLE but a fight's
   state and the survivors' card. Every number is the clock seat's first cut unless his word is quoted beside it. HG.on = false gives the makings as they were. */
'use strict';
(function () {
  var D = window.D16, W = D.world, HG = D.hunger = {}, SQ3 = Math.sqrt(3);
  HG.on = true;
  HG.ODDS = { hamlet: 0.9, farm: 0.6, road: 0.2, bare: 0.05 }; // (his: 90, 60, "around 5%"; a road's hex 20 -- the seat's number, his "You had stated 25% for the roads I think, and I was agreeing with it": the seat had said 20)
  HG.AVOID = ['silverton']; // (RULED 11-14, Griz: "1 - they avoid silverton": no marker enters the town's own hex, and its farmland there is nobody's meal)
  HG.DAWN = 6; HG.CART = 17; HG.STAY = 48; HG.CHARGE = 24; HG.TERRFARMS = 3; // (the dawn's hour; a cart's miles a day; hours the survivors keep at a refuge; hours a fed hyena making is charged; the farms a farmland hex with none of the scatter's holds)
  HG.REFUGES = ['inn', 'pit', 'silverton'];
  HG.HYENA = 'gnollhills'; // (the making whose ground's table is the gnoll hills': the mirror hyenas)
  var DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  function K(q, r) { return q + ',' + r; }
  function hcw(q, r, w) { return [w * (q + r / 2), w * SQ3 / 2 * r]; }
  function hexOf(x, y, w) {
    var rf = y / (w * SQ3 / 2), qf = x / w - rf / 2, yf = -qf - rf, rx = Math.round(qf), ry = Math.round(yf), rz = Math.round(rf), dx = Math.abs(rx - qf), dy = Math.abs(ry - yf), dz = Math.abs(rz - rf);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
    return [rx + 0, rz + 0];
  }
  function rnd(a, b, c, d) { // (a die by the save's seed, the making, the dawn and the roll's place: the same every time it is asked)
    var h = (a >>> 0) ^ 0x9e3779b9; [b, c, d].forEach(function (x) { h = Math.imul(h ^ ((x | 0) + 0x7f4a7c15), 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; });
    return (h >>> 0) / 4294967296;
  }
  // the farms by their 5-mile hex: the scatter's farms and hamlets (tools/hexmap.js THE SCATTER, frozen 11-14: deep16/data/world.js `scatter`), and a hex painted
  // farmland that holds none of them (Silverton's farms, the farm valley), which stands for HG.TERRFARMS farms
  var FARMS = { src: null, by: null };
  HG.farms = function () {
    var MW = W.Mworld(), B = D.WORLD || {}; if (!MW) return {}; if (FARMS.src === MW) return FARMS.by;
    var by = {}, sc = B.scatter, kinds = (sc && sc.kinds) || [];
    ((sc && sc.feats) || []).forEach(function (f, i) { var kd = kinds[f[0]]; if (kd !== 'farm' && kd !== 'hamlet') return; var k = K(f[3], f[4]); (by[k] = by[k] || []).push({ id: 's' + i, kind: kd }); });
    var shun = HG.shunned(MW); Object.keys(shun).forEach(function (k) { delete by[k]; });
    Object.keys(MW.hex).forEach(function (k) { var e = MW.hex[k]; if (e.t === 'farms' && !by[k] && !shun[k]) { by[k] = []; for (var i = 0; i < HG.TERRFARMS; i++) by[k].push({ id: 't' + k + '#' + i, kind: 'farm' }); } });
    Object.keys(by).forEach(function (k) { by[k].sort(function (a, b) { return (a.kind === 'hamlet' ? 0 : 1) - (b.kind === 'hamlet' ? 0 : 1); }); }); // (a hamlet first: the bigger light)
    FARMS.src = MW; FARMS.by = by; return by;
  };
  HG.food = function (k, hit) { var l = HG.farms()[k]; if (!l) return null; for (var i = 0; i < l.length; i++) if (!hit[l[i].id]) return l[i]; return null; }; // (the first farm of a hex not yet hit)
  HG.oddsAt = function (k, hit) { var f = HG.food(k, hit || {}), MW = W.Mworld(); return f ? HG.ODDS[f.kind] : MW && MW.road[k] ? HG.ODDS.road : HG.ODDS.bare; }; // (a dawn's chance of a feeding in a hex)
  HG.shunned = function (MW) { var o = {}; (MW.sites || []).forEach(function (s) { if (HG.AVOID.indexOf(s.id) >= 0 && s.hex) o[K(s.hex[0], s.hex[1])] = s.id; }); return o; };
  function walkable(MW, q, r) { var e = MW.hex[K(q, r)], T = e && MW.terr[e.t]; return !!(T && +T.cost > 0) && !HG.shunned(MW)[K(q, r)]; }
  HG.refuge = function (pt) { var MW = W.Mworld(), best = null; MW.sites.forEach(function (s) { if (HG.REFUGES.indexOf(s.id) < 0) return; var d = Math.hypot(s.x - pt[0], s.y - pt[1]); if (!best || d < best.d) best = { id: s.id, name: s.name, pt: [s.x, s.y], d: d }; }); return best; };

  var CACHE = { key: null, res: null };
  HG.sim = function (t) { // (every marker, every farm hit and every band of survivors by the hour t: worked out from the makings, the seed and the party's own feedings)
    var S = W.state(), MW = W.Mworld(), V = W.VESSEL, none = { by: {}, hit: {}, ref: [] }; if (!S || !MW || !HG.base) return none;
    if (t == null) t = S.t;
    var seed = (S.seed >>> 0) || 1, pf = S.madeFed || {}, key = seed + '|' + Math.floor((t - HG.DAWN) / 24) + '|' + JSON.stringify(pf) + '|' + V.wither + '|' + V.gone + '|' + V.makings.join();
    var res = CACHE.key === key && CACHE.src === MW ? CACHE.res : null;
    if (!res) {
      var ms = HG.base(t), hit = {}, ref = [], mk = {}, w = MW.w, last = Math.floor((t - HG.DAWN) / 24);
      ms.forEach(function (m) { mk[m.day] = { m: m, pt: m.pt.slice(), hex: m.hex.slice(), dawnFed: null, charged: -1, gone: null, hyena: W.makingZone(m) === HG.HYENA, trail: [] }; });
      for (var dn = 0; dn <= last; dn++) {
        var T = dn * 24 + HG.DAWN;
        ms.forEach(function (m) {
          var x = mk[m.day]; if (T <= m.t || x.gone != null) return;
          var p = pf[m.day], lastFed = Math.max(m.t, x.dawnFed == null ? -1 : x.dawnFed, p != null && p > m.t && p <= T ? p : -1);
          if ((T - lastFed) / 24 >= V.gone) { x.gone = lastFed + V.gone * 24; return; } // (four days unfed: gone, for good)
          var k = K(x.hex[0], x.hex[1]), f = HG.food(k, hit), odds = HG.oddsAt(k, hit);
          if (rnd(seed, m.day, dn, 1) < odds) { // (FED, at this dawn)
            x.dawnFed = T; if (f) hit[f.id] = T;
            if (x.hyena) x.charged = T + HG.CHARGE; // (his: the mirror hyenas "don't spawn fleeing farmers and become charged")
            else { var from = hcw(x.hex[0], x.hex[1], w), to = HG.refuge(from); if (to) ref.push({ id: 'r' + m.day + '-' + dn, day: m.day, zone: W.makingZone(m), kind: f ? f.kind : (MW.road[k] ? 'road' : 'wild'), t0: T, from: from, hex0: x.hex.slice(), to: to.id, toName: to.name, toPt: to.pt, arrive: T + to.d / HG.CART * 24 }); }
          }
          // on, a hex: toward the nearest farm not hit in its reach, else the nearest road, else any way -- never staying put
          var here = hcw(x.hex[0], x.hex[1], w), reach = Math.min(V.reach[2], V.reach[0] + V.reach[1] * Math.max(0, T - m.t) / 24), tgt = null, td = 1e9, FM = HG.farms();
          Object.keys(FM).forEach(function (fk) { if (fk === k || !HG.food(fk, hit)) return; var q = fk.split(','), c = hcw(+q[0], +q[1], w), d = Math.hypot(c[0] - here[0], c[1] - here[1]); if (d <= reach && (d < td - 1e-9 || (Math.abs(d - td) <= 1e-9 && fk < tgt.k))) { td = d; tgt = { k: fk, pt: c }; } });
          if (!tgt) Object.keys(MW.road).forEach(function (rk) { if (rk === k) return; var q = rk.split(','), c = hcw(+q[0], +q[1], w), d = Math.hypot(c[0] - here[0], c[1] - here[1]); if (d <= reach && (d < td - 1e-9 || (Math.abs(d - td) <= 1e-9 && rk < tgt.k))) { td = d; tgt = { k: rk, pt: c }; } });
          var nb = DIRS.map(function (dd) { return [x.hex[0] + dd[0], x.hex[1] + dd[1]]; }).filter(function (h) { return walkable(MW, h[0], h[1]); });
          if (!nb.length) return;
          var go = nb[Math.floor(rnd(seed, m.day, dn, 2) * nb.length)];
          if (tgt) { var bd = 1e9; nb.forEach(function (h) { var c = hcw(h[0], h[1], w), d = Math.hypot(c[0] - tgt.pt[0], c[1] - tgt.pt[1]); if (d < bd - 1e-9) { bd = d; go = h; } }); }
          x.hex = go; x.pt = hcw(go[0], go[1], w); x.trail.push({ dn: dn, hex: go.slice(), fed: x.dawnFed === T });
        });
      }
      res = { mk: mk, hit: hit, ref: ref }; CACHE.key = key; CACHE.res = res; CACHE.src = MW;
    }
    var by = {};
    Object.keys(res.mk).forEach(function (d) {
      var x = res.mk[d], m = x.m, p = pf[d], fed = Math.max(m.t, x.dawnFed == null ? -1 : x.dawnFed, p != null && p > m.t && p <= t ? p : -1), ago = (t - fed) / 24;
      by[d] = { pt: x.pt, hex: x.hex, fed: fed, state: x.gone != null || ago >= V.gone ? 'gone' : ago >= V.wither ? 'withered' : 'normal', charged: t < x.charged, trail: x.trail };
    });
    return { by: by, hit: res.hit, ref: res.ref };
  };

  // the makings, with the marker's place and the dawn feedings laid on (js/world.js W.makings is the making itself: its day, its noon, where he stood)
  HG.base = W.makings;
  W.makings = function (t) {
    var ms = HG.base(t); if (!HG.on || !ms.length) return ms;
    var S = W.state(), R = HG.sim(t == null ? (S ? S.t : 0) : t);
    ms.forEach(function (m) { var x = R.by[m.day]; if (!x) return; m.pt0 = m.pt; m.hex0 = m.hex; m.pt = x.pt; m.hex = x.hex; m.fed = x.fed; m.state = x.state; m.charged = x.charged; });
    return ms;
  };

  // THE SURVIVORS: where each band is at an hour -- on its way (a straight line to its refuge at a cart's pace), at the refuge for HG.STAY hours, then gone on
  HG.refugees = function (t) {
    var S = W.state(), MW = W.Mworld(); if (!HG.on || !S || !MW) return []; if (t == null) t = S.t;
    return HG.sim(t).ref.concat(HG.more ? HG.more(t) : []).filter(function (r) { return t >= r.t0 && t < r.arrive + HG.STAY; }).map(function (r) { // (HG.more: the people the snooting bands burn out, js/snootroad.js)
      var f = Math.min(1, (t - r.t0) / Math.max(1e-6, r.arrive - r.t0)), pt = [r.from[0] + (r.toPt[0] - r.from[0]) * f, r.from[1] + (r.toPt[1] - r.from[1]) * f];
      return Object.assign({}, r, { pt: pt, hex: hexOf(pt[0], pt[1], MW.w), there: t >= r.arrive });
    });
  };
  HG.at = function (site, t) { return HG.refugees(t).filter(function (r) { return r.there && r.to === site; }); }; // (who is at the inn, the Pit or Silverton this hour: for the inn's yard and the suppers, not built yet)

  // THE MEETING: the party steps into the hex a band of survivors is crossing -- a card, once a band, no fight (his "fleeing farmer encounter needs to be added")
  HG.LINES = { // (the clock seat's drafts, his to cut)
    farm: ['A cart on the {where}, everything a farm owns roped onto it. A man leads the ox. A woman sits up on the load with a boy asleep against her, her hands in her lap.'], // (11-14, the survivors-talk seat: the cast its talk speaks for -- js/survivors.js SV.KINDS)
    hamlet: ['Carts, four of them, nose to tail on the {where}, and people walking beside them who do not talk. A whole hamlet, by the count of the children. A big man walks at the back, his arms hanging.'],
    road: ['Two drovers on foot on the {where}, no beasts with them. One carries both packs. The other walks with his arms hanging.'],
    wild: ['A man alone on the {where}, a snare-line wound round his neck, walking as if he has been walking all night.'],
    said: {
      glowseep: '"It stood over the bed. Lights in it, like the bog at night, and eyes that gave me my own face. Come morning she could not lift the boy."',
      doors: '"Wolves, I would have said. Wolves do not stand at the foot of a bed and wait. He has not lifted his arms since."',
      snoot: '"Gnolls in the barley. Young ones, laughing, and no chief over them. We did not stay to count them."', // (burned out by a snooting band: js/snootroad.js)
      other: '"It stood over us till the sun was up. It never bit. Look at him. He cannot carry his own coat."'
    },
    going: 'They are making for {to}. They do not stop.'
  };
  HG.meeting = function (scene) {
    var S = W.state(), MW = W.Mworld(); if (!HG.on || !S || !MW || /[?&]noenc\b/.test((scene && scene.q) || '')) return null;
    var pt = W.partyPt(); if (!pt) return null; var ph = hexOf(pt[0], pt[1], MW.w), met = S.metRef || [];
    return HG.refugees().filter(function (r) { return !r.there && met.indexOf(r.id) < 0 && r.hex[0] === ph[0] && r.hex[1] === ph[1]; })[0] || null;
  };
  HG.card = function (r) {
    var MW = W.Mworld(), k = K(r.hex[0], r.hex[1]), e = MW.hex[k], where = MW.road[k] ? 'road' : (e && MW.terr[e.t] ? MW.terr[e.t].name.replace(/^the /i, '').replace(/ \(.*\)$/, '').replace(/ \/ .*$/, '') : 'track');
    var L = HG.LINES, out = [];
    [(L[r.kind] || L.farm)[0].replace('{where}', where), L.said[r.zone] || L.said.other, L.going.replace('{to}', r.toName)].forEach(function (l) { out = out.concat(D.wrap ? D.wrap(l, 284) : [l]); out.push(''); });
    return out;
  };
  HG.meet = function (scene, r) {
    var S = W.state(); (S.metRef = S.metRef || []).push(r.id); W.save(); if (D.sfx) D.sfx('confirm');
    if (D.survivors && D.survivors.open && D.survivors.open(scene, r)) return; // (THE SURVIVORS' TALK, 11-14, his "Portrait talk": js/survivors.js; the card below where no game is up)
    scene.card(['{y}On the way{/}, ' + W.timeOfDay() + ':', ''].concat(HG.card(r)).concat([D.keys ? D.keys('{g}E{/}: go on') : 'E: go on']));
  };
  // THE COUNCIL'S FLAGS (RULED 11-14, Griz: "i need a council flag set after the second and fourth farms survivors make silverton"): the bands off a farm or a hamlet
  // that have reached Silverton by the hour; at two and at four a flag in the save (madeSurvivors2 and madeSurvivors4, named in the content's register of them), set as the walk is kept. Nothing reads them yet
  HG.COUNCIL = [[2, 'madeSurvivors2'], [4, 'madeSurvivors4']];
  HG.farmBands = function (site, t) { var S = W.state(); if (!HG.on || !S) return 0; if (t == null) t = S.t; return HG.sim(t).ref.filter(function (r) { return r.to === site && r.arrive <= t && (r.kind === 'farm' || r.kind === 'hamlet'); }).length; };
  HG.flags = function () { if (!W.house() || !D.house.cur || !D.house.cur.flags) return; var f = D.house.cur.flags, n = HG.farmBands('silverton'); HG.COUNCIL.forEach(function (c) { if (n >= c[0] && !f[c[1]]) f[c[1]] = W.day(); }); };
  var save0 = W.save; W.save = function () { try { HG.flags(); } catch (e) { /* (the clock must never stop the walk) */ } return save0.apply(this, arguments); };
  // THE RUMOR'S DAY (RULED 11-14, Griz: "3 - yes, rumors based off actual marker movement"): the day word of what stood over the beds reaches a place -- the day the
  // first band of survivors walks in there, or walks in at another refuge and the word comes on down the road at a cart's pace; null if no band has fled yet
  HG.rumorDay = function (site, t) {
    var S = W.state(), MW = W.Mworld(); if (!HG.on || !S || !MW) return null; if (t == null) t = S.t;
    var at = MW.sites.filter(function (s) { return s.id === site; })[0], best = null; if (!at) return null;
    HG.sim(t).ref.forEach(function (r) { var h = r.arrive + (r.to === site ? 0 : Math.hypot(at.x - r.toPt[0], at.y - r.toPt[1]) / HG.CART * 24); if (best == null || h < best) best = h; });
    return best == null ? null : Math.floor(best / 24) + 1;
  };
  var step0 = W.onStep;
  W.onStep = function (scene, st) {
    var r = HG.meeting(scene);
    if (r) { HG.meet(scene, r); return true; }
    return step0 ? step0.apply(this, arguments) : false;
  };
})();
