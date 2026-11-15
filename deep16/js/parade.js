/* DEEP16 -- THE PARADE (2026-11-15, the parade-show seat, started by the lanes desk on Griz's word: "let's script a 'show'. cam in the middle on a creature, then 4 of
   the new townspeople take up positions around it (out of reach)(corners, NE etc, it does it's attacks on each one , they run to N, E, S, W - it does it's attacks at each
   position again - this time with the people rotating position, N moves to W, W to S, etc - each time the creature attacks a direction. Then next creature, next 4
   townspeople (cycle back through the townspeople as we don't have 4 new for each creature"; then "we can have the crew boss come on and show his attacks and get the
   flinch and dead etc for each creature before we switch creatures"): the day's new art on screen at once -- the creatures the cutters cut, the townsfolk in their new
   costumes, the crew boss.

     deep16/?parade              every creature cut today whose sheet is on main, in P.CREATURES' order · &only=wyvern,frostgiant keeps to those · &from=N starts at the Nth ·
                                 &fast no pauses (the bench: dev/bench16.js mode=parade1115)

   A creature at a time, on a plain floor in good light (D.MAPS.paradefloor), the camera on it:
     1. four of the townsfolk walk in and stand OUT OF ITS REACH at the corners, NE, SE, SW, NW (the compass the figures are drawn by: N up the screen); it turns to
        each in turn and plays every blow it has at them -- each attack's own row (its `attack` row where a blow has none), a shot or a thrown rock flying, a breath's
        cone blooming on the floor short of them (they stand out of its breath too). Nothing is rolled and nobody is hurt: a show of the rows, the engine's dice never asked;
     2. they go to N, E, S, W (each a quarter step on round: NE to N, SE to E, SW to S, NW to W) and it plays them again at each;
     3. they walk round one place at a time, N to W, W to S, S to E, E to N, and after each step it turns to the next point of the compass, N, then E, S and W, and
        plays them again: four steps, and they are home (the seat's reading of "each time the creature attacks a direction" -- the people going round one way, the
        creature round the other);
     4. THE CREW BOSS (data/foes.js crewboss: whatever sheet he names -- Hask's till his own lands) walks in to its E side, plays his blows at it, and it flinches; he knocks it flat
        (its fall, lying there), it gets up where it has a getting-up row, and his last blow brings it down: its death row;
     5. ENTER (or E, or a click, or RIGHT): the next creature, with the next four townsfolk, the list going round again where there are fewer than four a creature.
        LEFT: the same creature again.
   ITS OTHER ROWS (11-15, after his "hag was still code drawn or something is very very wrong" -- her beat had shown her Claws and nothing else of her sheet): one
   with a borrowed face (a `still` and a `reveal` row: the green hag's old countrywoman, the lamia's way) stands in it while the four come in and drops it before
   its first blow; a caster with a `cast` row plays it as a blow, named for its spell (her Vicious Mockery); one with Invisible Passage and a `vanish` row fades
   out of sight and back after the second round of blows. And at the final pass, all ten on main: one with a `still` row and no reveal (False Appearance: the
   animated armor, the ice mephit, the violet fungus) stands on it while the four come in and stirs before its first blow; a blow with a numbered row of its
   own (the animated armor's `slam2`, the second Slam of a turn -- js/battle.js) plays that one after it.
   ALOFT (11-15, the cutter-fresh-1115 seat, on Griz's "see if the wyvern cutter needs attacks while in flight and if it can cut off the legs on the attacks and use
   those"): a flier whose sheet has a blow's flying row (`air` + the row: the wyvern's airattack and airsting, its ground rows with the legs cut off) takes to the
   air for step 3 and goes round the compass aloft, each blow on its flying row where it has one (as js/battle.js plays them while it flies), and lands for the
   crew boss.
   THE FIGURES FIRST (the same day): the show holds its first frame for every sheet it will wear -- each creature's, the crew boss's and every costume figure --
   on the engine's own gate (js/sprites.js S.gate: THE FIGURES ARE COMING). They were fetched behind, a beat's four at a time, and a sheet still on its way draws
   nothing: a bar and a shadow walking. A figure that never loads is named in red on its creature's card, and its turn reads NOT AS IT SHOULD BE.
   What is not on main yet is passed over without a word: a creature whose foe or sheet is not in (P.CREATURES names the ones being cut today), a costume whose figure is
   not cut (P.folk reads D.SHEETS for every folkman_<costume>_p1 and folkwoman_<costume>_p1; the townsfolk's own man and woman only if none is cut). So it fills in as the
   cutters land, with no change here. B.paradeReport holds what each creature showed (dev/bench16.js mode=parade1115 runs it headless).
   A show, not a rule: no fight reads this file. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, I = D.input;
  var P = D.parade = {};

  // ---- the floor: plain flagstones, no posts, no dark (the class floor's posts and walled corners crowd a Huge one's ring). Laid when the door is made and not
  // before: the Pocket DM deals every floor in D.MAPS with a way in as a location (js/pocket.js mapIds), and this one is the show's alone -- the full gate's
  // mode=pocketdm1009 went RED on it, laid at load, a floor with no ground
  P.floor = function () {
    if (D.MAPS.paradefloor) return;
    var N = 30, rows = [];
    for (var y = 0; y < N; y++) { var r = ''; for (var x = 0; x < N; x++) r += x === 0 || y === 0 || x === N - 1 || y === N - 1 ? '#' : '='; rows.push(r); }
    D.MAPS.paradefloor = { name: 'The Parade Ground', sub: 'a plain floor in good light', noBurrow: true, step: 10, rows: rows, entry: [[15, 26], [16, 26], [14, 26]], foes: [], wave: null };
  };
  P.C = 15; // (the middle of it)

  // the creatures cut on 11-15, in the cutters' queue order (the lanes desk's list: the three landed, then the hell hound, the violet fungus, the ice mephit, the cockatrice,
  // the animated armor, the pegasus and the green hag as their foes land in data/foes.js -- an id here that is not a foe yet, or whose sheet is not cut, is passed over)
  P.CREATURES = ['wyvern', 'frostgiant', 'winterwolf', 'hellhound', 'violetfungus', 'icemephit', 'cockatrice', 'animatedarmor', 'pegasus', 'greenhag'];
  // the costumes of art-wanted 65 (js/counter.js C.GENERIC's), in the order they are cut today; any other folk<man|woman>_<costume>_p1 cut comes after, by name
  P.COSTUMES = ['lightcrew', 'shaft', 'scraper', 'drinker', 'gambler', 'barkeep', 'hired', 'guard', 'crewboss', 'clerk'];
  P.BOSS = 'crewboss';
  P.landed = function (k) { var f = D.FOES && D.FOES[k]; return !!(f && f.sheet && D.SHEETS && D.SHEETS[f.sheet]); };
  P.creatures = function (only) {
    var asked = only ? String(only).split(',').filter(Boolean) : P.CREATURES;
    return { show: asked.filter(P.landed), skipped: asked.filter(function (k) { return !P.landed(k); }) };
  };
  P.folk = function () {
    var sh = D.SHEETS || {}, cut = {}, out = [];
    Object.keys(sh).forEach(function (k) { var m = /^folk(man|woman)_([a-z]+)_p1$/.exec(k); if (m) cut[m[2]] = true; });
    var order = P.COSTUMES.filter(function (c) { return cut[c]; }).concat(Object.keys(cut).filter(function (c) { return P.COSTUMES.indexOf(c) < 0; }).sort());
    order.forEach(function (c) { ['man', 'woman'].forEach(function (w) { var s = 'folk' + w + '_' + c + '_p1'; if (sh[s]) out.push({ sheet: s, costume: c, who: w }); }); });
    if (!out.length) ['man', 'woman'].forEach(function (w) { if (sh['folk' + w + '_p1']) out.push({ sheet: 'folk' + w + '_p1', costume: null, who: w }); }); // (none cut: the townsfolk's own)
    return out;
  };
  var WORD = { lightcrew: 'light crew', shaft: 'shaft hand', scraper: 'guano scraper', drinker: 'drinker', gambler: 'gambler', barkeep: 'barkeep', hired: 'hired hand', guard: 'guard', crewboss: 'crew boss', clerk: 'clerk' };
  P.folkName = function (f) { return f.costume ? 'the ' + (WORD[f.costume] || f.costume) + ' (' + f.who + ')' : 'the towns' + f.who; };

  // the compass as the figures are drawn (js/sprites.js S.FACINGS): N up the screen is the grid's (-1,-1), NE (0,-1), E (1,-1), SE (1,0), S (1,1), SW (0,1), W (-1,1), NW (-1,0)
  var DIR = { N: [-1, -1], NE: [0, -1], E: [1, -1], SE: [1, 0], S: [1, 1], SW: [0, 1], W: [-1, 1], NW: [-1, 0] };
  P.CORNERS = ['NE', 'SE', 'SW', 'NW'];
  P.POINTS = ['N', 'E', 'S', 'W'];
  P.ROUND = { N: 'W', W: 'S', S: 'E', E: 'N' }; // (his "N moves to W, W to S, etc")

  // its blows: each attack's own row (battle.js attack: the row of its name or its `row`, else `attack`), a spell's cast row, and its breath's
  P.blows = function (u) {
    var out = [], rowOf = function (a, k) { return a.row || String(a.name || k).toLowerCase().replace(/[^a-z]/g, ''); };
    Object.keys(u.attacks || {}).forEach(function (k) {
      var a = u.attacks[k]; if (a.needsHeld) return;
      var r = rowOf(a, k);
      if (!D.spr.anim(u.sheet, r)) r = a.spell && D.spr.anim(u.sheet, 'cast') ? 'cast' : D.spr.anim(u.sheet, 'attack') ? 'attack' : null;
      if (r) out.push({ name: a.name || k, row: r, a: a });
      // (its second and third use in a turn, where the sheet draws them: js/battle.js attack plays `slam2` for the second Slam)
      for (var n = 2; r && n <= 3; n++) if (D.spr.anim(u.sheet, r + n)) out.push({ name: (a.name || k) + ', the ' + (n === 2 ? 'second' : 'third'), row: r + n, a: a });
    });
    if (u.breath && D.spr.anim(u.sheet, 'breath')) out.push({ name: u.breath.name || 'Breath', row: 'breath', breath: u.breath });
    // (a caster's spell on its cast row, where no blow of its own plays it already: the green hag's Vicious Mockery -- the class AI's cantrip, nothing in `attacks`)
    var cs = (D.FOES[u.kind] || {}).caster || u.caster, kn = (cs && cs.known) || []; // (the block's own list: a unit made from it carries its spells its own way)
    if (kn.length && D.spr.anim(u.sheet, 'cast') && !out.some(function (b) { return b.row === 'cast'; })) {
      var nm = kn.map(function (id) { var sp = D.magic && D.magic.data ? D.magic.data(id) : null; return (sp && sp.name) || id; });
      out.push({ name: nm.slice(0, 2).join(' / ') + (nm.length > 2 ? ' ...' : ''), row: 'cast', cast: true });
    }
    return out;
  };

  P.make = function (q) {
    q = q || '';
    P.floor();
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var FAST = /[?&]fast\b/.test(q), cr = P.creatures(get('only')), folk = P.folk();
    var foes = cr.show.concat(['commoner', 'commoner', 'commoner', 'commoner']).concat(D.FOES[P.BOSS] && P.landed(P.BOSS) ? [P.BOSS] : []);
    var B = new D.Battle({ npc: { foes: foes, party: ['fighter:3:human'] },
      fightDef: D.classFight(3, { map: 'paradefloor', name: 'The Parade', sub: 'the day\'s new art: the creatures, the townsfolk, the crew boss', what: 'the parade', intro: 'A creature at a time. ENTER for the next.' }) });
    B.parade = { kinds: cr.show, skipped: cr.skipped, folk: folk };
    var enter0 = B.enter;
    B.enter = function () {
      enter0.apply(this, arguments); this.req = null; this.co = show(this, get, FAST);
      // THE FIGURES FIRST: the fight's own gate holds its units' sheets (the creatures', the crew boss's, the townsfolk's own); the costume figures are worn a
      // beat at a time after it, so they go on the same gate -- nothing moves till every one is in (or 20 s: S.held)
      var mine = ((this.sheetGate && this.sheetGate.names) || []).concat(folk.map(function (f) { return f.sheet; }));
      D.spr.gate(this, mine);
    };
    return B;
  };

  function* show(B, get, FAST) {
    var W = function (n) { return FAST ? 1 : n; };
    var PR = B.parade, all = B.units.slice(), C = P.C, report = B.paradeReport = [];
    var cre = PR.kinds.map(function (k) { return all.filter(function (w) { return w.kind === k; })[0]; });
    var people = all.filter(function (w) { return w.kind === 'commoner'; }).slice(0, 4), boss = all.filter(function (w) { return w.kind === P.BOSS; })[0] || null;
    people.concat(boss ? [boss] : []).forEach(function (w) { w.side = 'party'; w.ally = true; });
    people.forEach(function (w) { w.attacks = {}; w.multi = 1; w.look = true; });
    B.dark = false;
    B.cine = true; // (no turn strip and no bar: the whole screen is the ring -- js/ui.js)
    var say = function (lines, n) { B.clearCards(); B.card(lines, W(n || 120)); }; // (one card at a time: the N stand is under where they are drawn)
    if (!cre.length) { B.clearCards(); B.card(['{y}THE PARADE{/}', '{g}No creature of today\'s cut is on main yet.{/}'], 1e9); return; }

    function fresh(w) {
      w.hp = w.maxhp; w.temp = 0; w.conds = {}; w.dead = false; w.ko = false; w.slain = false; w.deadT = null; w.proneLook = false; w.proneT = null;
      w.anim = 'idle'; w.animT = B.t; w.flash = 0; w.fz = null; w.tween = null; w.woken = true; w.acted = true;
    }
    function settle() { G.setup(G.map, B.units); B.cache = null; }
    // where a point of the compass is, k squares clear of its body on every side
    function spot(u, k, d) {
      var sz = u.size || 1, v = DIR[d], mid = Math.floor((sz - 1) / 2);
      return [v[0] > 0 ? u.x + sz - 1 + k : v[0] < 0 ? u.x - k : u.x + mid, v[1] > 0 ? u.y + sz - 1 + k : v[1] < 0 ? u.y - k : u.y + mid];
    }
    var reachOf = function (u) { var r = u.reach || 5; Object.keys(u.attacks || {}).forEach(function (k) { var a = u.attacks[k]; if (!a.ranged && !a.spell) r = Math.max(r, a.reach || 5); }); return r; };
    // the ring: the nearest squares out of its reach at every point of the compass -- its blows' reach, and its breath's where it has one (to 15 ft: a longer
    // breath is drawn as far as the ring and no further, strike below)
    var outOf = function (u) { return Math.max(reachOf(u), u.breath && D.spr.anim(u.sheet, 'breath') ? Math.min(15, u.breath.ft || 15) : 0); };
    function ringFor(u) {
      var reach = outOf(u), probe = { x: 0, y: 0, size: 1 };
      for (var k = 2; k < 9; k++) {
        if (P.CORNERS.concat(P.POINTS).every(function (d) { var s = spot(u, k, d); probe.x = s[0]; probe.y = s[1]; return G.dist(u, probe) > reach; })) return k;
      }
      return 9;
    }
    // THE CAMERA, on the creature, two ways: WIDE for the walks, the whole ring in the picture, and CLOSE for the blows. Where one of the engine's own zoom steps
    // (js/ui.js UI.zooms: whole device pixels to an art pixel, so the figures stay crisp) shows the whole ring at two device pixels or more to an art pixel, both are
    // that step and the camera never moves. Where the screen is too small for that (a 2x pane and a reach of 10 ft), wide is the zoom that just fits the ring
    // (drawn smoothed) and close is the game's own, zoom 1, the camera leaning from the creature toward whoever it is turned to as far as brings them whole into
    // the picture. He may wheel in or out
    var TOP = 34, TALL = 64, CAM = { wide: 1, close: 1, c: null };
    function homeAt(z) { var yc = (TOP + D.H - 4) / 2 + TALL * z / 2; return { x: Math.round(CAM.c.x), y: Math.round(CAM.c.y - (yc - D.H / 2) / z) }; } // (the ring's middle, the N one's height counted)
    function frame(u, k) {
      var sz = u.size || 1, n = (sz - 1) + 2 * k, mid = (sz - 1) / 2;
      var fit = Math.min(1, (D.W / 2 - 16) / (n * 32), (D.H - 4 - TOP) / (2 * n * 16 + TALL));
      var L = (D.ui.zooms ? D.ui.zooms() : [1]).filter(function (z) { return z <= fit + 1e-9 && z * (D.R || 1) >= 2 - 1e-9; });
      CAM.c = D.iso.center(u.x + mid, u.y + mid, G.map.gz(P.C, P.C));
      if (L.length) CAM.wide = CAM.close = Math.max.apply(null, L); else { CAM.wide = fit; CAM.close = 1; }
      var h = homeAt(CAM.wide); D.iso.zoom = CAM.wide; D.iso.cam.x = h.x; D.iso.cam.y = h.y;
      return CAM.wide === CAM.close ? '' + CAM.wide.toFixed(2) : CAM.wide.toFixed(2) + ' wide, ' + CAM.close.toFixed(2) + ' close';
    }
    function* pan(tx, ty, tz, n) {
      var c = D.iso.cam, x0 = c.x, y0 = c.y, z0 = D.iso.zoom;
      if (FAST || (x0 === tx && y0 === ty && z0 === tz)) { c.x = tx; c.y = ty; D.iso.zoom = tz; return; }
      for (var i = 1; i <= n; i++) { var e = i / n; e = e * e * (3 - 2 * e); c.x = Math.round(x0 + (tx - x0) * e); c.y = Math.round(y0 + (ty - y0) * e); D.iso.zoom = i === n ? tz : z0 + (tz - z0) * e; yield 1; }
    }
    // close, the camera leant from its place over the creature just far enough that t stands whole in the picture
    function* lean(t) {
      var z = CAM.close, h = homeAt(z), c = D.iso.center(t.x, t.y, G.map.gz(t.x, t.y)), sx = (c.x - h.x) * z + D.W / 2, sy = (c.y - h.y) * z + D.H / 2, dx = 0, dy = 0;
      if (sx < 20) dx = sx - 20; else if (sx > D.W - 20) dx = sx - (D.W - 20);
      if (sy - TALL * z < TOP) dy = sy - TALL * z - TOP; else if (sy > D.H - 6) dy = sy - (D.H - 6);
      yield* pan(Math.round(h.x + dx / z), Math.round(h.y + dy / z), z, 16);
    }
    function* home() { var h = homeAt(CAM.wide); yield* pan(h.x, h.y, CAM.wide, 16); }
    // walk them all at once, a square a step, straight along the grid (each step dx and dy by their signs), on their walk rows; then each faces `look`
    function* walk(moves, dur, look) {
      yield* home();
      moves.forEach(function (m) { if (m[0].x !== m[1][0] || m[0].y !== m[1][1]) { m[0].anim = 'walk'; m[0].animT = B.t; (m[0].paraded = m[0].paraded || {}).walk = true; } });
      for (var n = 0; n < 80; n++) {
        var left = false;
        moves.forEach(function (m) {
          var u = m[0], tx = m[1][0], ty = m[1][1];
          if (u.x === tx && u.y === ty) { if (u.anim === 'walk') { u.anim = 'idle'; u.animT = B.t; } return; }
          left = true;
          var nx = u.x + Math.sign(tx - u.x), ny = u.y + Math.sign(ty - u.y);
          u.facing = D.spr.facingFor(nx - u.x, ny - u.y);
          u.tween = { fx: u.x, fy: u.y, fz: G.gzAt(u, u.x, u.y), t: 0, dur: dur, mode: 'walk' };
          u.x = nx; u.y = ny;
        });
        if (!left) break;
        yield W(dur);
      }
      settle();
      if (look) moves.forEach(function (m) { m[0].facing = B.faceTo(m[0], look); });
    }
    // one blow at t, nothing rolled: its row facing t, and on the row's release frame what flies or blooms
    function* strike(u, t, b, tally, onHit, k) {
      var row = G.aloft(u) && D.spr.anim(u.sheet, 'air' + b.row) ? 'air' + b.row : b.row; // (aloft, its flying row where the sheet has one: ALOFT above)
      u.facing = B.faceTo(u, t); u.anim = row; u.animT = B.t;
      var an = D.spr.anim(u.sheet, row), dur = D.spr.duration(u.sheet, row) || 30, rel = an && an.release != null ? Math.ceil(an.release * 60 / (an.fps || 8)) : Math.round(dur / 2);
      if (tally) { tally.rows[b.row] = (tally.rows[b.row] || 0) + 1; if (row !== b.row) tally.air = (tally.air || 0) + 1; if (G.dist(u, t) <= outOf(u)) tally.inReach.push(b.name + ' at ' + t.name); }
      yield W(Math.max(1, rel));
      if (b.breath) {
        var g = { shape: b.breath.shape || 'cone', len: b.breath.ft || 15 }, sq = D.magic.area(u, g, t.x, t.y, D.magic.aimAt ? D.magic.aimAt(t, g) : undefined);
        var ty = b.breath.type, ramp = b.breath.stone ? 'stone' : ty === 'cold' || ty === 'lightning' ? 'glow' : ty === 'poison' || ty === 'acid' ? 'moss' : ty === 'thunder' ? 'silver' : 'fire';
        var pr = { x: 0, y: 0, size: 1 }, short = sq.filter(function (q) { pr.x = q[0]; pr.y = q[1]; return !k || G.dist(u, pr) < k * 5; }); // (short of the ring: it washes over nobody)
        if (tally) tally.cone = Math.max(tally.cone || 0, short.filter(function (q) { return people.some(function (w) { return w.x === q[0] && w.y === q[1]; }); }).length);
        D.fx.bloom(u.x, u.y, short, ramp); D.sfx('crit'); if (!FAST) yield { fx: 1 };
      } else if (b.a && (b.a.ranged || (b.a.spell && !b.a.touch))) { D.fx.projectile(u, t, b.a.fx || 'bolt'); if (!FAST) yield { fx: 1 }; }
      if (onHit) onHit();
      yield W(Math.max(8, dur - rel) + 14);
      u.anim = 'idle'; u.animT = B.t;
    }
    function* volley(u, t, where, tally, k) { // every blow it has, at t
      var bl = P.blows(u);
      u.facing = B.faceTo(u, t); yield* lean(t);
      for (var i = 0; i < bl.length; i++) {
        say(['{y}' + u.name.toUpperCase() + '{/}: ' + bl[i].name + ' at ' + t.name + ', ' + where + '.'], 70);
        yield* strike(u, t, bl[i], tally, null, k);
      }
      tally.volleys++;
    }

    function* one(i) {
      var u = cre[i], four = [0, 1, 2, 3].map(function (j) { return PR.folk[(4 * i + j) % PR.folk.length]; }), tally = { rows: {}, inReach: [], volleys: 0, steps: 0 };
      // staging: the creature in the middle, the four off the floor's edge beyond their corners, the crew boss off the SE side
      fresh(u); var sz = u.size || 1; u.x = C - Math.floor((sz - 1) / 2); u.y = u.x; u.facing = 0;
      var k = ringFor(u), at = {};
      people.forEach(function (w, j) { fresh(w); w.sheet = four[j].sheet; w.name = P.folkName(four[j]); if (D.spr.prefetch) D.spr.prefetch([w.sheet]); var c = P.CORNERS[j], s = spot(u, k + 7, c); w.x = s[0]; w.y = s[1]; w.facing = B.faceTo(w, u); at[w.id] = c; });
      B.units = [u].concat(people); settle(); B.round = 1; B.order = B.units.slice(); B.active = null;
      var zm = frame(u, k);
      var bl = P.blows(u), extra = { reveal: 0, vanish: 0 };
      var still = !!D.spr.anim(u.sheet, 'still'), guise = still && !!D.spr.anim(u.sheet, 'reveal'); // (js/ui.js draws `still` till it has woken or acted: a borrowed face where it has a reveal, else False Appearance)
      if (still) { u.woken = false; u.acted = false; }
      // (a sheet not in draws nothing, a sheet that failed a grey block: said here, in red -- never in the benches, which fetch none)
      var late = D.spr.offline ? [] : [u.sheet].concat(four.map(function (f) { return f.sheet; })).concat(boss ? [boss.sheet] : []).filter(function (s, n, a) { return a.indexOf(s) === n && !D.spr.has(s); });
      B.clearCards();
      B.card(['{y}THE PARADE  ' + (i + 1) + ' / ' + cre.length + ':  ' + u.name.toUpperCase() + '{/}', '{g}' + bl.map(function (b) { return b.name; }).join(', ') + '. Its reach ' + outOf(u) + ' ft; they stand ' + k * 5 + ' ft off. Nothing rolled, nobody hurt.{/}'].concat(late.length ? ['{r}NOT LOADED, so not drawn: ' + late.join(', ') + '{/}'] : []), W(late.length ? 400 : 200));
      yield W(110);
      // 1. in to the corners
      var seenN = {}, names = people.map(function (w) { return w.name; }).filter(function (n) { return seenN[n] ? false : (seenN[n] = true); });
      say(['Four come in, to the corners: ' + names.join(', ').replace(/the /g, '') + '.'], 160);
      yield* walk(people.map(function (w) { return [w, spot(u, k, at[w.id])]; }), 10, u);
      yield W(30);
      if (guise) { // (the engine's own unmasking, js/ai.js: woken, its reveal row once, then itself)
        say(['{y}' + u.name.toUpperCase() + '{/}: in its borrowed face as they came in. It drops it: its Reveal.'], 170); yield W(80);
        u.woken = true; u.acted = true; u.anim = 'reveal'; u.animT = B.t; extra.reveal++; yield W(D.spr.duration(u.sheet, 'reveal') + 24); u.anim = 'idle'; u.animT = B.t; yield W(20);
      } else if (still) { // (False Appearance: it stood on its still row; it stirs, and is itself)
        say(['{y}' + u.name.toUpperCase() + '{/}: standing still as they came in (its Still). It stirs.'], 150); yield W(90);
        u.woken = true; u.acted = true; u.anim = 'idle'; u.animT = B.t; extra.still = 1; yield W(40);
      }
      for (var j = 0; j < 4; j++) yield* volley(u, people[j], 'the ' + at[people[j].id], tally, k);
      // 2. to N, E, S, W
      say(['They go to N, E, S and W.'], 120);
      people.forEach(function (w) { at[w.id] = { NE: 'N', SE: 'E', SW: 'S', NW: 'W' }[at[w.id]]; });
      yield* walk(people.map(function (w) { return [w, spot(u, k, at[w.id])]; }), 8, u);
      var home = people.map(function (w) { return at[w.id]; }).join();
      yield W(30);
      for (j = 0; j < 4; j++) yield* volley(u, people[j], 'the ' + at[people[j].id], tally, k);
      if (u.invis && D.spr.anim(u.sheet, 'vanish')) { // (Invisible Passage, as js/ai.js fades it: invisible, its vanish row, then faint while unseen -- and back)
        u.facing = 0; say(['{y}' + u.name.toUpperCase() + '{/}: its Invisible Passage. It fades out of sight (its Vanish), and comes back.'], 200); yield W(40);
        u.conds.invisible = { ends: true }; u.anim = 'vanish'; u.animT = B.t; extra.vanish++; yield W(D.spr.duration(u.sheet, 'vanish') + 4); u.anim = 'idle'; u.animT = B.t; yield W(60);
        delete u.conds.invisible; yield W(40);
      }
      // 3. round the compass a place at a time, N to W, W to S, S to E, E to N; after each step it turns to the next point, N, E, S, W -- a flier with flying rows aloft
      var airN = (D.FOES[u.kind] || {}).fly && D.spr.anim(u.sheet, 'fly') ? bl.filter(function (b) { return D.spr.anim(u.sheet, 'air' + b.row); }).length : 0;
      if (airN) { say(['{y}' + u.name.toUpperCase() + '{/} takes to the air: round the compass it strikes flying.'], 140); yield* B.flyTo(u, G.groundAt(u, u.x, u.y) + 2 * G.LAYER()); yield W(20); }
      say(['Round they go, N to W, W to S, S to E, E to N. After each step it turns to the next point.'], 160);
      for (var s = 0; s < 4; s++) {
        people.forEach(function (w) { at[w.id] = P.ROUND[at[w.id]]; });
        yield* walk(people.map(function (w) { return [w, spot(u, k, at[w.id])]; }), 9, u);
        tally.steps++;
        var pt = P.POINTS[s], who = people.filter(function (w) { return at[w.id] === pt; })[0];
        yield W(20);
        if (who) yield* volley(u, who, 'at the ' + pt, tally, k);
      }
      var back = people.map(function (w) { return at[w.id]; }).join() === home;
      var aloftOK = !airN || (tally.air === 4 * airN && G.aloft(u));
      if (airN) { yield W(20); yield* B.flyTo(u, G.groundAt(u, u.x, u.y), true); yield W(20); } // (down for the crew boss)
      // 4. the crew boss
      var down = { flinch: 0, prone: 0, getup: 0, hurt: 0 };
      if (boss) {
        // (in from the SE and up to its E side, the square off its eastern corner: screen-right of it, the two in profile, neither over the other)
        fresh(boss); var from = spot(u, k + 7, 'SE'), to = [u.x + sz, u.y - 1];
        boss.x = from[0]; boss.y = from[1]; B.units.push(boss); settle();
        say(['{y}THE CREW BOSS{/} comes on.'], 120);
        yield* walk([[boss, to]], 9, u);
        u.facing = B.faceTo(u, boss); yield* lean(boss); yield W(20);
        var bb = P.blows(boss), hit = function (row) { return function () { if (D.spr.anim(u.sheet, row)) { u.anim = row; u.animT = B.t; down[row]++; } u.flash = 8; }; };
        if (!bb.length) bb = [{ name: 'a blow', row: 'idle', a: {} }];
        for (j = 0; j < bb.length; j++) { say(['{y}THE CREW BOSS{/}: his ' + bb[j].name + '. It flinches.'], 90); yield* strike(boss, u, bb[j], null, hit('flinch')); yield W(16); u.anim = 'idle'; u.animT = B.t; u.facing = B.faceTo(u, boss); }
        // flat: its fall and lying there (js/ui.js plays the prone row off the prone clock), then up where it has a getting-up row
        say(['He knocks it flat.'], 110);
        yield* strike(boss, u, bb[0], null, function () { u.conds.prone = true; u.flash = 8; if (D.spr.proneFrame(u.sheet) >= 0) down.prone++; });
        yield W(Math.max(30, D.spr.duration(u.sheet, 'prone')) + 50);
        if (D.spr.anim(u.sheet, 'getup')) { say(['It gets up.'], 80); delete u.conds.prone; down.getup++; yield W(D.spr.duration(u.sheet, 'getup') + 30); u.facing = B.faceTo(u, boss); }
        else { delete u.conds.prone; yield W(30); }
        say(['{y}THE CREW BOSS{/} brings it down.'], 160);
        yield* strike(boss, u, bb[bb.length - 1], null, function () { u.hp = 0; u.dead = true; u.deadT = B.t; u.anim = 'idle'; u.animT = B.t; if (D.spr.anim(u.sheet, 'hurt')) down.hurt++; });
        yield W(Math.max(40, D.spr.duration(u.sheet, 'hurt')) + 70);
        boss.facing = B.faceTo(boss, u);
      }
      // the tally
      var want = bl.map(function (b) { return b.row; }), plays = 12 * bl.length, got = Object.keys(tally.rows).reduce(function (a, r) { return a + tally.rows[r]; }, 0);
      var unhurt = people.every(function (w) { return w.hp === w.maxhp && !w.dead && !w.conds.prone; }) && people.every(function (w) { return (w.paraded || {}).walk; });
      var fell = !boss || (u.dead && u.hp === 0);
      var drawn = ['flinch', 'hurt'].filter(function (r) { return D.spr.anim(u.sheet, r); }).every(function (r) { return down[r] > 0; }) && (D.spr.proneFrame(u.sheet) < 0 || down.prone > 0) && (!D.spr.anim(u.sheet, 'getup') || down.getup > 0);
      var rest = (!guise || extra.reveal === 1) && (!still || guise || extra.still === 1) && u.woken && (!(u.invis && D.spr.anim(u.sheet, 'vanish')) || extra.vanish === 1) && !u.conds.invisible;
      var ok = rest && !late.length && bl.length > 0 && tally.volleys === 12 && got === plays && want.every(function (r) { return tally.rows[r] >= 12; }) && !tally.inReach.length && !tally.cone && tally.steps === 4 && back && unhurt && fell && (!boss || drawn) && aloftOK;
      var why = bl.length + ' blow' + (bl.length === 1 ? '' : 's') + ' (' + bl.map(function (b) { return b.name + ' on ' + b.row; }).join(', ') + '), ' + tally.volleys + ' volleys of 12, ' + got + ' plays of ' + plays +
        (tally.inReach.length ? '; IN ITS REACH: ' + tally.inReach.slice(0, 3).join('; ') : '; every one ' + k * 5 + ' ft off, out of its reach (' + reachOf(u) + ' ft' + (outOf(u) > reachOf(u) ? ', its breath ' + outOf(u) + ' ft' : '') + ')') + (tally.cone ? '; A BREATH OVER ' + tally.cone + ' OF THEM' : '') +
        '; round the compass ' + tally.steps + ' steps, home again (' + back + '); the four ' + people.map(function (w) { return w.sheet; }).join(', ') + ' walked and unhurt (' + unhurt + ')' +
        (guise ? '; its borrowed face as they came in, its Reveal ' + extra.reveal : still ? '; its Still as they came in' : '') + (airN ? '; aloft round the compass, its flying rows ' + (tally.air || 0) + ' of ' + 4 * airN + ' (' + aloftOK + ')' : '') + (extra.vanish ? '; its Vanish ' + extra.vanish : '') + (late.length ? '; NOT LOADED: ' + late.join(', ') : '') +
        (boss ? '; the crew boss on ' + boss.sheet + ': flinch ' + down.flinch + ', prone ' + down.prone + ', getup ' + down.getup + ', its death ' + down.hurt + ', down (' + fell + ')' : '; no crew boss');
      return { id: u.kind, name: u.name, ok: ok, why: why, folk: four.map(function (f) { return f.sheet; }), ring: k, zoom: zm };
    }

    var i = Math.max(0, Math.min(cre.length - 1, (+(get('from') || 1)) - 1));
    for (var lap = 0; lap < 1000; lap++) { // (ENTER at the end: from the top -- here, not a new generator: Battle.step drops B.co when the old one returns)
    while (i < cre.length) {
      var res;
      try { res = yield* one(i); } catch (e) { res = { id: PR.kinds[i], name: PR.kinds[i], ok: false, why: 'threw: ' + String(e && e.message || e) }; if (window.console) console.error('parade ' + PR.kinds[i], e); }
      var o = report.map(function (r) { return r.id; }).indexOf(res.id); if (o >= 0) report[o] = res; else report.push(res);
      B.clearCards();
      B.card(['{y}' + (i + 1) + ' / ' + cre.length + ':  ' + res.name.toUpperCase() + '{/}  ' + (res.ok ? '{n}SHOWN{/}' : '{r}NOT AS IT SHOULD BE{/}')].concat(res.ok ? [] : ['{g}' + res.why + '{/}']).concat(FAST ? [] : ['', '{c}ENTER{/} ' + (i + 1 < cre.length ? 'the next creature' : 'the end') + '   {c}LEFT{/} this one again']), 1e9);
      if (FAST) { i++; continue; }
      var v = yield { parade: true };
      if (v === 'back') continue;
      i++;
    }
    B.clearCards();
    var okN = report.filter(function (r) { return r.ok; }).length;
    B.card(['{y}THE PARADE: ' + okN + ' OF ' + report.length + '{/}'].concat(report.map(function (r) { return (r.ok ? '{n}ok{/}  ' : '{r}NO{/}  ') + r.name; })).concat(FAST ? [] : ['', '{c}ENTER{/} from the top']), 1e9);
    if (FAST) return;
    yield { parade: true, done: true };
    i = 0;
    }
  }
  var input0 = D.ui.input;
  D.ui.input = function (B, req) {
    if (!req.parade) return input0(B, req);
    D.ui.camera(B);
    var v = I.pressed('a') || I.mouse.click || I.repeat('right') ? 'next' : I.repeat('left') ? 'back' : null;
    if (v) { D.sfx('confirm'); B.answer(req.done ? 'next' : v); }
  };
})();
