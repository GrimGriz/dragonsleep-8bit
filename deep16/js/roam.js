/* DEEP16 — THE ROAM: the party-token map's feasibility test (10-13). Griz's week, verbatim: "We explore the feasibility of the grid
   functioning like the 8-bit map, in that the entire party is represented by the lead character and the entirety of the map is available
   ... - where when a random fight is triggered the rest of the party spills out of the lead character (as near as possible given whats
   occupying squares already) based on a grid formation they set using the 'order' menu when in party-token mode (pops them out, you move
   them around, they pop back in when you're done - out of fight only) - when the random fight is triggered, reasonable exits to the combat
   map are made the edges of the map dynamically reading the state of the map when the fight gets triggered". The seat's door, his answers:
   "write-up with the test" · "A good test would be the entire wet - it already has the keeper fight to pull in separate and the other half
   of the Wet already kind of works as intended" · "The fancy part is determining encounter distance and then determining fight boundaries
   based on both party and random encounter spawn (where encounter distance might be a matter of sight condition. Check SRD re encounter
   distance)" · "Current plan is wet and if proven it'll work, a revision of the road".

   A TEST, not the build: deep16/?roam=wet. The 8-bit's warrens_d, all 44 x 30, converted square for square from the compiled 8-bit data
   (DS.DATA.maps) and turned as the Settling's grid is turned (RULED 09-30b), so its upper half is the `wet` map's squares exactly. One
   token walks it (the lead; the rest ride inside); the 8-bit's own step count and encounter table (js/world.js arrive, js/events.js
   pickGroup) roll the fights; a fight is made where it falls:

   THE DISTANCE. The SRD 5.1 has no encounter-distance table (that table is the DMG's, outside it). What it gives: Combat, step 2, "the GM
   figures out where the adversaries are -- how far away and in what direction", given "the adventurers' marching order"; surprise is the
   hiders' Stealth against each passive Perception, and "if neither side tries to be stealthy, they automatically notice each other"; and
   Vision and Light -- dim light lightly obscures, darkness heavily obscures ("blocks vision entirely"), darkvision sees dark as dim to its
   reach. So the distance is the party's sight at that moment: the farthest squares the party can see from the token -- lit (their own
   lights and the floor's) and in a line, or inside someone's darkvision -- that the foes can walk to them from. A lurker (the bestiary's
   natural ones, battle.js LURK, and the gray ooze's False Appearance) is instead close and hidden, and rolls its Stealth. &far= caps it
   (default 60 ft: outdoors by day the sight runs to the horizon, and the road will want his number).

   THE GROUND. Where both sides stand, and a margin round them (&pad=, 4 squares), cut out of the floor: nothing walks past its edge for the
   fight, and every open square on that edge where the floor runs on outside it is a way out (battle.js exits, LEAVE THE FIGHT) -- read off
   the floor as it is when the fight begins. The floor's own doors inside it are ways out too.

   THE SPILL. The token's party steps out onto their formation (ORDER in token mode, the O key: they pop out round the lead, you move them,
   O and they pop back in; kept per hero, relative to the way the token faces), each on its slot or the nearest square the token can walk to.
   After a fight the four walk back into the first of them still standing (js/gameshow.js GS.gather is the Game Show's form of it). */
'use strict';
(function () {
  var D = window.D16, G = D.grid, FX = D.fx, L = D.light, I = D.input;
  var R = D.roam = {};
  var STEP = 8; // (a step's frames: battle.js STEP_FRAMES)

  // ------------------------------------------------------------------ the floor: an 8-bit map's rows, square for square
  // by the tile's NAME (the 8-bit legend's letters differ map to map, and its `w` is deep water where the grid's is a well); a name not here
  // reads as rock. The road's tiles are here for the next test
  R.TILE = {
    caveFloor: '.', caveWall: '#', timber: '#', rails: '.', railsH: '.', pool: '~', deep: 'D', ooze: '.', guano: '.', guanoDeep: '.',
    webFloor: '.', dwarfFloor: '.', dwarfWall: '#', runeWall: '#', sealDoor: '#', drownStair: 'D', ladder: '.', holeDown: '.', lantern: '#',
    cradle: 'y', gate: '#', bones: '.', stalag: 'P', fungus: '.', gravel: '.', minecart: 'k', crateCave: '.', glowmoss: '.', chimney: '#',
    stairsUp: '.', stairsDown: '.', bridgeV: '=', bridgeH: '=', dryStair: '.', sealCut: '.', stain: '.', steps: '.',
    dirt: ',', grass: 'g', tree: 'T', road: ',', dirtpath: ',', cobble: ',', water: 'D', fence: 'f', well: 'w', crate: 'k', cliff: '#',
    mountain: '#', range: '#', void: '#', web: '.', cocoon: 'c', tent: '#', wall: '#', wallWin: '#', door: '.', flatstone: '.', reeds: 'g'
  };
  R.rows8 = function (M8) {
    return M8.rows.map(function (row) { var o = ''; for (var i = 0; i < row.length; i++) { var t = R.TILE[M8.legend[row.charAt(i)]]; o += t != null ? t : '#'; } return o; });
  };
  // a quarter counter-clockwise, as the Settling's grid (data/maps.js wet: the 8-bit square (x, y) is the grid's (y, W8 - 1 - x))
  R.turn = function (R8) { var W8 = R8[0].length, rows = []; for (var gy = 0; gy < W8; gy++) { var r = ''; for (var gx = 0; gx < R8.length; gx++) r += R8[gx][W8 - 1 - gy]; rows.push(r); } return rows; };
  R.wholeWet = function () {
    if (D.MAPS.wetwhole) return D.MAPS.wetwhole;
    var M8 = window.DS.DATA.maps.warrens_d, R8 = R.rows8(M8), W8 = R8[0].length, wet = D.MAPS.wet;
    // the drowned stair's first row, the landing's edge, wadable (RULED 10-13, Griz: "2 yes" -- wading onto it starts the Keeper, waded in: R.arrive); the rest of it deep
    R.WADE8.forEach(function (q) { var row = R8[q[1]]; R8[q[1]] = row.slice(0, q[0]) + '~' + row.slice(q[0] + 1); });
    var from8 = function (x, y, s) { return [y, W8 - (x + (s || 1))]; }, to8 = function (gx, gy) { return [W8 - 1 - gy, gx]; };
    var at8 = function (l) { return l.map(function (p) { return from8(p[0], p[1]); }); };
    D.MAPS.wetwhole = {
      name: 'The Wet', sub: 'the whole floor, walked as one token', dark: true, step: 10, deepWater: 'D', // (the settling pools and the inflow wadable since 10-13, his "1 yes"; the landlord's water and the drowned stair deep)
      lampAt: wet.lampAt, lights: wet.lights, noBurrowAt: wet.noBurrowAt, // (the Settling's own: the same squares on the same turn)
      sky: 20, // the cave's ceiling, 20 ft over the floor, as the roost's (js/grid.js G.flyTop): a darkmantle rolled at random hangs from it (10-13, Griz: "the whole area map needs a ceiling" -- "for if it rolls darkmantles as randoms")
      // the dwarven works -- the corridor, the landing, the drowned stair, the 8-bit's rows 19-24 -- under worked stone 15 ft up (the map's `skies`: js/grid.js G.ceilAt;
      // 10-13, Griz: "keepers room has to be at least 15 high")
      skies: [[19, W8 - 35, 6, 26, 15]],
      rows8: M8.rows, rows: R.turn(R8), from8: from8, to8: to8, src8: M8,
      entry: wet.entry, stairUp: wet.doors, doors: wet.doors.concat(at8([[41, 27], [42, 27]])), foes: []
    };
    return D.MAPS.wetwhole;
  };

  // ------------------------------------------------------------------ the 8-bit's conditions, small (flag:x, !flag:x, & and |)
  R.cond = function (c, flags) {
    if (!c) return true;
    return String(c).split('|').some(function (any) { return any.split('&').every(function (t) { t = t.trim(); var neg = t.charAt(0) === '!'; if (neg) t = t.slice(1); var v = /^flag:/.test(t) ? !!flags[t.slice(5)] : true; return neg ? !v : v; }); });
  };

  // ------------------------------------------------------------------ the door: deep16/?roam=wet
  R.make = function (q) {
    q = q || '';
    var num = function (k, d) { var m = new RegExp('[?&]' + k + '=(\\d+)').exec(q); return m ? +m[1] : d; };
    R.def = R.wholeWet();
    R.q = q; R.PAD = num('pad', 4); R.FAR = num('far', 0); R.ENC = num('enc', 0); // (&far=0: no cap -- RULED 10-13 with the approach, his "1 yes")
    var lvl = num('lvl', 5), useSave = /[?&]save\b/.test(q);
    var F = { map: 'wetwhole', foes: [], level: lvl, dark: !/[?&]lit\b/.test(q), entry: null, fliers: true }; // (fliers: one with wings keeps to the air, js/flight-ai.js)
    var o = useSave ? { fightDef: F } : { fightDef: F, ladder: true, level: lvl };
    var sd = /[?&]seed=(\d+)/.exec(q); if (sd) D.seed = +sd[1] | 0;
    R.party0 = o; // (a pulled-in fight walks in with the same four: the same level, or the same save)
    var B = new D.Battle(o), enter0 = B.enter, update0 = B.update, paint0 = B.paint;
    B.cine = true;
    B.enter = function () {
      var t0 = (window.performance || Date).now();
      enter0.apply(this, arguments);
      R.stats = { enterMs: Math.round((window.performance || Date).now() - t0), squares: G.map.w * G.map.h, w: G.map.w, h: G.map.h, frames: 0, frameMs: 0 };
      this.order = []; this.active = null; this.req = null; this.exits = [];
      if (D.wet) { D.wet.layLamp(this, R.def.lampAt); D.wet.layCrate(this, R.def.from8(3, 7)); D.wet.layStair(this, R.def.stairUp); }
      R.setup(this);
      this.co = R.script(this);
    };
    B.update = function () {
      var R0 = this.roam;
      if (R0 && (R0.mode === 'walk' || R0.mode === 'order') && !this.req && !this.menu) {
        var m = I.mouse;
        if (m.click && m.inside) R0.clicks.push({ x: m.x, y: m.y });
        if (I.pressed('order')) R0.keys.push('order');
        if (I.pressed('dice')) R0.keys.push('fight'); // (F: an encounter now -- the test's own key)
        if (R0.mode === 'walk' && I.pressed('a')) R0.keys.push('use'); // (E: the thing beside the token -- the mark, the stair, the bucket: the 8-bit's USE)
        R0.hover = R0.mode === 'order' && m.inside ? D.iso.pick(m.x, m.y, 0) : null; // (the square under the mouse, for ORDER's box)
        if (R0.mode === 'order' && m.rclick && m.inside) R0.keys.push('turn'); // (a right click in ORDER: the formation as it stands facing the next way -- Griz, 10-13: "rightclick shows the ordering in different facings")
      }
      if (R0 && I.pressed('list')) R.showMap = !R.showMap; // (L: the floor map -- the whole Wet, what they saw, the ground and its ways out)
      return update0.apply(this, arguments);
    };
    B.paint = function (ctx) {
      var t0 = (window.performance || Date).now();
      paint0.apply(this, arguments);
      R.paintOver(ctx, this);
      if (R.stats) { R.stats.frames++; R.stats.frameMs += (window.performance || Date).now() - t0; }
    };
    return B;
  };

  // ------------------------------------------------------------------ token mode
  R.FORM0 = [[0, 1], [-1, 0], [-1, 1], [-2, 0], [-2, 1], [-3, 0], [-3, 1], [-4, 0]]; // (two abreast behind the lead: [ahead, right] in squares)
  R.KEY = 'deep16.roam.form';
  R.setup = function (B) {
    var members = B.units.filter(function (u) { return u.side === 'party' && !u.familiar && !u.object && !u.summon; });
    var stored = D.store.get(R.KEY) || {};
    // the front man kept with the formation (10-13, in the pane: his formation came back, his leader did not): the stored order first, the rest as they come
    if (Array.isArray(stored._order)) members.sort(function (a, b) { var ia = stored._order.indexOf(a.id), ib = stored._order.indexOf(b.id); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    var lead = members[0];
    var R0 = B.roam = { token: lead, members: members, rest: members.slice(1), form: {}, fw: [-1, 0], mode: 'walk', steps: 0, encIn: 0, clicks: [], keys: [], flags: {}, fights: 0, log: [], last: null, cut: null, msg: null, groups: [], spent: {} }; // (spent: the floor's triggers done with -- the roam's own marks, apart from the 8-bit's flags)
    members.slice(1).forEach(function (u, i) { R0.form[u.id] = stored[u.id] || R.FORM0[i] || [-(i + 1), 0]; });
    if (/[?&]watch\b/.test(R.q)) members.forEach(function (u) { u.guest = true; u.classAI = true; }); // (&watch: the class tactics run the four, as the bench does)
    // the light: the party's carried torch (&light=none | torch | lantern), in the first free hand in the marching order (js/light.js handsFree, then handForLight)
    var lw = (/[?&]light=([a-z]+)/.exec(R.q) || [])[1] || 'torch';
    if (lw !== 'none' && !members.some(function (u) { return u.torch && u.torch.lit; })) {
      var bearer = members.filter(function (u) { return L.handsFree(u) > 0; })[0] || members.filter(function (u) { return L.handForLight(u); })[0] || lead; // (a free hand first: a two-hander drops it to swing)
      bearer.torch = lw === 'lantern' ? L.make('lantern', false) : { lit: true, kind: 'torch' }; L.regrip(bearer);
    }
    R0.encIn = R.ENC || R.resetEnc(R0);
    // the whole party on the M menu out of a fight (ui.js gridHost's hooks): any of the four EQUIPs, takes up a light, drinks a potion; ORDER is the formation on the floor
    // (Griz, 10-13: "Gonna have to see the whole party menu on menu even when it's in party token mode, and even if barley is front man should be able to have Aurdin
    // equip a lantern"). The test's own four carry no lantern, so the pack gets one Hooded Lantern for it (a save walks in with its own pack)
    B.menuCalm = function () { return (R0.mode === 'walk' || R0.mode === 'order') && !R.tracking(R0).length; };
    B.menuUnits = function () { return B.menuCalm() ? R0.members : B.units; };
    B.menuOrder = function () { R0.keys.push('order'); };
    B.menuAct = function (kind, a, unitOf) { return R.menuAct(B, kind, a, unitOf); };
    B.menuClosed = function () { R.regear(B); };
    B.floorMarks = function (c) { R.floorMarks(c, B); }; B.marksOver = function (c) { R.marksOver(c, B); }; // (ORDER's box on the floor, under the figures: ui.js drawBattle's hook)
    if (!/[?&]save\b/.test(R.q) && !(B.inv || []).some(function (s) { return s.id === 'lantern' && s.n > 0; })) (B.inv = B.inv || []).push({ id: 'lantern', n: 1 });
    // in by the stair up, where the 8-bit's warp from the Warrens' second floor lands (warrens_b to warrens_d (2, 12))
    var e = R.def.entry[0]; lead.x = e[0]; lead.y = e[1]; lead.facing = D.spr.facingFor(0, -1); R0.fw = [0, -1]; // (in off the stair walking the 8-bit's east: the grid's -y)
    R.into(B, R0.rest);
    B.focus(lead);
    // the zone's creatures fetched behind, so a fight's figures are there when it falls
    var Z = window.DS.DATA.encounters.warrens_d, kinds = [];
    (Z ? Z.groups : []).forEach(function (g) { g.e.forEach(function (e2) { var f = D.FOES[e2[0]]; if (f && f.sheet && kinds.indexOf(f.sheet) < 0) kinds.push(f.sheet); }); });
    if (D.spr.prefetch) D.spr.prefetch(kinds);
  };
  // random fights at half the 8-bit's rate (RULED 10-13, Griz: "default random encounter rate down 50% from 8bit"): the 8-bit's count between them, doubled
  R.RATE = 2;
  R.resetEnc = function (R0) { var Z = window.DS.DATA.encounters.warrens_d, r = (Z && Z.rate) || [18, 40]; return (r[0] + D.rint(r[1] - r[0] + 1)) * R.RATE; };
  // off the floor and into the token (no walk: the setup's and the formation's quiet return)
  R.into = function (B, list) { list.forEach(function (u) { var j = B.units.indexOf(u); if (j >= 0) B.units.splice(j, 1); }); G.setup(G.map, B.units); B.cache = null; };
  R.zoneAt = function (B, x, y) {
    var M8 = R.def.src8, p = R.def.to8(x, y);
    for (var i = 0; i < (M8.zones || []).length; i++) { var z = M8.zones[i], r = z.rect; if (p[0] >= r[0] && p[1] >= r[1] && p[0] < r[0] + r[2] && p[1] < r[1] + r[3] && R.cond(z.cond, B.roam.flags)) return z.zone; }
    return null;
  };
  // the formation's square for one of them: [ahead, right] off the token, turned to the way it faces (a quarter turn at a time)
  R.axes = function (fw) { return { f: fw, r: [-fw[1], fw[0]] }; };
  R.slot = function (R0, u) { var o = R0.form[u.id] || [0, 0], A = R.axes(R0.fw), t = R0.token; return [t.x + o[0] * A.f[0] + o[1] * A.r[0], t.y + o[0] * A.f[1] + o[1] * A.r[1]]; };
  R.toForm = function (R0, u) { var A = R.axes(R0.fw), dx = u.x - R0.token.x, dy = u.y - R0.token.y; return [dx * A.f[0] + dy * A.f[1], dx * A.r[0] + dy * A.r[1]]; };
  R.snap = function (dx, dy, prev) { if (dx && dy) return prev[0] === Math.sign(dx) && !prev[1] ? prev : prev[1] === Math.sign(dy) && !prev[0] ? prev : [Math.sign(dx), 0]; return [Math.sign(dx), Math.sign(dy)]; };

  // every square the token could walk to from where it stands, and how many steps (no corner cut past a wall: battle.js route)
  R.flood = function (u, from, maxD) {
    var key = function (x, y) { return x + ',' + y; }, d = {}, q = [from];
    var ok = function (x, y) { return G.canStand(u, x, y, { ghost: true }); };
    d[key(from[0], from[1])] = 0;
    while (q.length) {
      var c = q.shift(), dc = d[key(c[0], c[1])]; if (dc >= maxD) continue;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var nx = c[0] + dx, ny = c[1] + dy, k = key(nx, ny); if ((!dx && !dy) || d[k] != null || !ok(nx, ny)) continue;
        if (dx && dy && (!ok(c[0] + dx, c[1]) || !ok(c[0], c[1] + dy))) continue;
        d[k] = dc + 1; q.push([nx, ny]);
      }
    }
    return d;
  };

  // ------------------------------------------------------------------ the script: walk, the formation, the fights
  R.script = function* (B) {
    var R0 = B.roam;
    B.card(['{y}THE WET{/}, the whole floor (' + G.map.w + ' x ' + G.map.h + ' squares): one token, the party inside it.', '{g}Click to walk, or the arrows. O: the formation. F: a fight now.{/}'], 420);
    while (true) {
      var t = R0.token;
      if (R0.mode === 'over') { yield 1; continue; }
      // a group on its way in (RULED 10-13, Griz: "1 yes" -- the approach before the fight): it walks at its own speed while the token walks or stands, and
      // the fight starts where they meet; one that got away from a fight comes after the party, or loses it (R.tickGroups)
      if (R0.groups.length) {
        var hitG = R.tickGroups(B);
        if (hitG) { yield* R.engage(B, hitG, false, hitG.mode === 'pursue' ? 'caught' : hitG.why); continue; }
      }
      var k = R0.keys.shift();
      var trk = R.tracking(R0);
      if (k === 'order') { if (trk.length) { D.sfx('miss'); B.card(['{g}Not with them coming.{/}'], 120); } else yield* R.order(B); continue; }
      if (k === 'use') { var un = R.useNear(B); if (un && !trk.length) yield* R.fire(B, un.trig, un.sq); else D.sfx('miss'); continue; }
      if (k === 'fight') { if (trk.length) yield* R.engage(B, trk[0], false, 'yours'); else yield* R.encounter(B, 'asked'); continue; }
      var ck = R0.clicks.shift();
      if (ck) {
        var sq = D.iso.pick(ck.x, ck.y, 0);
        if (sq) {
          var use = R.useAt(B, sq.x, sq.y);
          if (use) { yield* R.walkBeside(B, [sq.x, sq.y]); yield* R.fire(B, use, [sq.x, sq.y]); continue; }
          R0.path = D.Battle.route(t, [sq.x, sq.y]);
          if (!R0.path) { D.sfx('miss'); B.card(['{g}No way there from here.{/}'], 120); }
        }
      }
      // the arrows: the screen's own directions, a square's diagonal on the grid (10-13, Griz: "Can arrow keys default move diagonal?"); two at once are the grid's
      // straight ways (up and right: the screen's upper right). A diagonal into a corner slides along the open side
      var dx0 = (I.held.down ? 1 : 0) - (I.held.up ? 1 : 0) + (I.held.right ? 1 : 0) - (I.held.left ? 1 : 0), dy0 = (I.held.down ? 1 : 0) - (I.held.up ? 1 : 0) - (I.held.right ? 1 : 0) + (I.held.left ? 1 : 0);
      var dir = dx0 || dy0 ? [Math.sign(dx0), Math.sign(dy0)] : null;
      if (dir) {
        var okS = function (x, y) { return G.canStand(t, x, y); }, tries = dir[0] && dir[1] ? [dir, [dir[0], 0], [0, dir[1]]] : [dir], went = null;
        for (var ti = 0; ti < tries.length && !went; ti++) { var d0 = tries[ti], tx = t.x + d0[0], ty = t.y + d0[1]; if (!okS(tx, ty)) continue; if (d0[0] && d0[1] && (!okS(t.x + d0[0], t.y) || !okS(t.x, t.y + d0[1]))) continue; went = [tx, ty]; }
        R0.path = went ? [went] : null; if (!went) t.facing = D.spr.facingFor(dir[0], dir[1]);
      }
      if (R0.path && R0.path.length) {
        var to = R0.path.shift();
        if (!G.canStand(t, to[0], to[1])) { R0.path = null; yield 1; continue; }
        yield* R.step(B, t, to);
        var ev = yield* R.arrive(B);
        if (ev) R0.path = null;
        if (!R0.path || !R0.path.length) { t.anim = 'idle'; t.animT = B.t; }
        continue;
      }
      yield 1;
    }
  };
  R.step = function* (B, u, to) {
    var dx = to[0] - u.x, dy = to[1] - u.y;
    u.tween = { fx: u.x, fy: u.y, fz: G.gzAt(u, u.x, u.y), t: 0, dur: STEP, mode: null };
    u.facing = D.spr.facingFor(dx, dy); if (u.anim !== 'walk') { u.anim = 'walk'; u.animT = B.t; }
    u.x = to[0]; u.y = to[1];
    if (B.roam && u === B.roam.token) { B.roam.fw = R.snap(dx, dy, B.roam.fw); B.keepInView(u); }
    yield STEP;
  };
  // each square the token reaches: the floor's doors, its trigger squares, then the 8-bit's step count (js/world.js arrive: a road counts half)
  R.arrive = function* (B) {
    var R0 = B.roam, t = R0.token, p8 = R.def.to8(t.x, t.y);
    R0.steps++;
    if ((R.def.doors || []).some(function (d) { return d[0] === t.x && d[1] === t.y; })) {
      var up = R.def.stairUp.some(function (d) { return d[0] === t.x && d[1] === t.y; });
      B.card(['{y}' + (up ? 'The stair up to the Warrens\' second floor' : 'The stair down to the Warrens\' third floor') + '{/}: here the 8-bit takes the party on (' + (up ? 'warrens_b' : 'warrens_c') + ').', '{g}(the test keeps you on the Wet){/}'], 300);
      return 'door';
    }
    var trig = R.triggerAt(B, p8[0], p8[1], 'step');
    if (R.isWade(t.x, t.y) && !R0.flags.keeperDone && !R0.flags.fiveRecovered && !R0.spent.stair) {
      B.card([R.say8('w.wade')], 260); yield 30;
      yield* R.pullIn(B, 'keeper', { id: 'stair' }, [t.x, t.y], 'ledge'); return 'trigger';
    }
    if (trig) { yield* R.fire(B, trig, [t.x, t.y]); return 'trigger'; }
    if (R.tracking(R0).length) return null; // (no count while a group is coming: one that lost the party holds nothing up)
    if (R.zoneAt(B, t.x, t.y)) {
      R0.encIn -= 1;
      if (R0.encIn <= 0) { R0.encIn = R.resetEnc(R0); yield* R.encounter(B, 'steps'); return 'fight'; }
    }
    return null;
  };

  // ------------------------------------------------------------------ the 8-bit's trigger squares on the floor
  R.triggerAt = function (B, x8, y8, on) {
    var R0 = B.roam;
    return (R.def.src8.triggers || []).filter(function (t) { var r = t.rect; return t.on === on && x8 >= r[0] && y8 >= r[1] && x8 < r[0] + r[2] && y8 < r[1] + r[3] && R.cond(t.cond, R0.flags) && !(t.once && R0.flags['trig:' + t.id]) && !R0.spent[t.id]; })[0] || null;
  };
  R.useAt = function (B, x, y) { var p = R.def.to8(x, y); return R.triggerAt(B, p[0], p[1], 'use'); };
  R.walkBeside = function* (B, at) {
    var t = B.roam.token;
    if (Math.max(Math.abs(t.x - at[0]), Math.abs(t.y - at[1])) <= 1) return;
    var best = null, bl = Infinity;
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var q = [at[0] + dx, at[1] + dy]; if ((!dx && !dy) || !G.canStand(t, q[0], q[1])) continue; var p = D.Battle.route(t, q); if (p && p.length < bl) { bl = p.length; best = p; } }
    while (best && best.length) { yield* R.step(B, t, best.shift()); var ev = yield* R.arrive(B); if (ev) return; }
    t.anim = 'idle'; t.animT = B.t;
  };
  // what fires: the Settling's sleepers pull the Settling in (data/fights.js wet, js/wet.js); the drowned stair and the rune pull the Keeper in
  // (js/keeper.js); the pool ooze's puddle is a fight made in place on the floor, as a random one is; the rest are the 8-bit's scenes
  // (RULED 10-13, Griz: "the ooze fights should just trigger, the landlord and keeper should still load special as they prevent random encounters"): the
  // jelly, the pool ooze and the puddle ooze are fights made where they lie -- the jelly up out of its pool (the Settling's own squares, data/fights.js wet),
  // a swimmer; the landlord's rim pulls the Settling in, the drowned stair and the rune the Keeper
  R.WAKE = { landlordStep: 'rim', landlord: 'rim' }; // (stepping to the rim, or USE on the landlord's water: the Settling, the landlord speaking first)
  R.OOZES = {
    jelly: { list: ['ochrejelly'], at8: [22, 12], swims: true, flag: 'jellyDead', trig: ['jelly', 'jellyNorth'], line: 'Something ochre heaves up out of the settling pool.' },
    jellyNorth: { list: ['ochrejelly'], at8: [22, 12], swims: true, flag: 'jellyDead', trig: ['jelly', 'jellyNorth'], line: 'Something ochre heaves up out of the settling pool.' },
    poolOoze: { list: ['grayooze'], at8: [29, 13], flag: 'poolOozeDead', trig: ['poolOoze'], line: 'The puddle at the pool\'s edge moves.' },
    ooze: { list: ['grayooze'], at8: null, flag: 'oozeDead', trig: ['ooze'], line: 'The puddle by the path moves.' }
  };
  R.fire = function* (B, trig, at) {
    var R0 = B.roam;
    if (trig.once) R0.flags['trig:' + trig.id] = 1;
    var oz = R.OOZES[trig.id];
    if (oz) { yield* R.encounter(B, 'set', { list: oz.list, at: oz.at8 ? R.def.from8(oz.at8[0], oz.at8[1]) : at, swims: oz.swims, flag: oz.flag, trig: oz.trig, line: oz.line, how: 'where it lay' }); return; }
    if (R.WAKE[trig.id]) { yield* R.pullIn(B, 'wet', trig, at); return; }
    if (trig.id === 'mark') { yield* R.markScene(B, trig, at); return; }
    if (trig.id === 'stair') { yield* R.stairScene(B, trig, at); return; }
    if (trig.id === 'bucket') { yield* R.bucketScene(B, trig, at); return; }
    B.card(['{y}' + trig.id + '{/}: the 8-bit\'s scene (' + trig.script + ') runs here.', '{g}(in the test only the Settling\'s squares, the drowned stair, the rune and the puddle ooze do anything){/}'], 300);
    D.sfx('popup'); yield 30;
  };

  // ------------------------------------------------------------------ the 8-bit's scenes on the floor, in its own words (DS.DATA.text, js/events.js S.mark, S.stair, S.bucket)
  R.say8 = function (k) { var t = window.DS.DATA.text && window.DS.DATA.text[k]; return t ? (t.t || t) : k; };
  R.WADE8 = [[19, 20], [19, 21], [19, 22], [19, 23]]; // (the 8-bit's squares: the drowned stair's first row, where its `stair` trigger stands)
  R.isWade = function (x, y) { var p = R.def.to8(x, y); return R.WADE8.some(function (q) { return q[0] === p[0] && q[1] === p[1]; }); };
  R.USE_NAME = { mark: 'the mark', stair: 'the flooded stair', bucket: 'the bucket', landlord: 'the deep water', deepCradle0: 'the cradle', deepCradle1: 'the cradle', deepCradle2: 'the cradle' };
  // the 8-bit's USE: a trigger on a square beside the token (the way it faces first) -- the mark is in the wall, so a click cannot pick it (iso.pick picks only open squares)
  R.useNear = function (B) {
    var R0 = B.roam, t = R0 && R0.token; if (!t) return null;
    var dirs = [R0.fw.slice()]; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) if ((dx || dy) && !(dx === R0.fw[0] && dy === R0.fw[1])) dirs.push([dx, dy]);
    for (var i = 0; i < dirs.length; i++) { var x = t.x + dirs[i][0], y = t.y + dirs[i][1], tr = R.useAt(B, x, y); if (tr) return { trig: tr, sq: [x, y] }; }
    return null;
  };
  // the mark (js/events.js S.mark, 10-13 his: "make sure the rune - hand trigger option is added from the 8-bit for the keeper fight"): seen, perhaps read (Arcana or
  // Religion, 12), and a hand on it wakes the Keeper -- the fight by the rune
  R.markScene = function* (B, trig, at) {
    var R0 = B.roam, f = R0.flags, Rr = window.DS.R, settled = f.keeperDone || f.stairHook || f.fiveRecovered;
    var lines = [R.say8(f.stairHook && !f.keeperWater ? 'w.markDry' : settled ? 'w.markPlain' : 'w.markSee')];
    var read = R0.members.some(function (u) { return u.src && u.hp > 0 && D.d(20) + Math.max(Rr.skill(u.src, 'Arcana', 'int'), Rr.skill(u.src, 'Religion', 'int')) >= 12; });
    if (read || f.hobMet) { f.markRead = 1; lines.push(R.say8('w.markRead')); }
    if (settled) { B.card(lines, 320); yield 30; return; }
    var a = yield { prompt: { who: R0.token, title: 'THE MARK', lines: lines.concat([R.say8('w.markAsk')]), opts: [{ label: 'PUT A HAND ON IT', value: 1 }, { label: 'LEAVE IT', value: 0 }] } };
    if (a !== 1) return;
    f.keeperAwake = 1; D.sfx('splash'); B.card([R.say8('w.markWake')], 320); yield 50;
    yield* R.pullIn(B, 'keeper', trig, at, 'rune');
  };
  // the stair (js/events.js S.stair): ROPE THEM OUT (the rope; the Keeper awake fights by the rune, asleep the five come up), WADE IN (the fight from the ledge), LEAVE
  R.stairScene = function* (B, trig, at) {
    var R0 = B.roam, f = R0.flags;
    if (f.fiveRecovered) { B.card([R.say8('w.stairDone')], 260); yield 20; return; }
    var a = yield { prompt: { who: R0.token, title: 'THE FLOODED STAIR', lines: [R.say8('w.stairSee'), R.say8('w.stairAsk')], opts: [{ label: 'ROPE THEM OUT', value: 0 }, { label: 'WADE IN', value: 1 }, { label: 'LEAVE', value: 2 }] } };
    if (a === 0) {
      if (!(B.inv || []).some(function (x) { return x.id === 'rope' && x.n > 0; })) { B.card([R.say8('w.noRope')], 260); yield 20; return; }
      if (f.keeperAwake) { B.card([R.say8('w.ropeAwake')], 260); yield 30; yield* R.pullIn(B, 'keeper', trig, at, 'rune'); return; }
      f.fiveRecovered = 1; B.card([R.say8('w.ropeOut'), '{g}' + R.say8('w.fiveRecovered') + '{/}'], 360); yield 40; return;
    }
    if (a === 1) { B.card([R.say8('w.wade')], 260); yield 30; yield* R.pullIn(B, 'keeper', trig, at, 'ledge'); }
  };
  // the bucket at the deep station's crate (js/events.js S.bucket): taken up into the pack, in the hand of the one who took it -- the Settling reads both (js/wet.js)
  R.bucketScene = function* (B, trig, at) {
    var R0 = B.roam, f = R0.flags;
    if (f.otyughFed || (B.inv || []).some(function (x) { return x.id === 'bucket' && x.n > 0; })) { B.card(['{g}The crate. The bucket is ' + (f.otyughFed ? 'down in the deep water.' : 'with you.') + '{/}'], 220); yield 20; return; }
    var s0 = (B.inv || []).filter(function (x) { return x.id === 'bucket'; })[0]; if (s0) s0.n = 1; else (B.inv = B.inv || []).push({ id: 'bucket', n: 1 });
    f.bucketBy = R0.token.id; D.sfx('chest');
    B.card(['{y}' + R0.token.name + '{/} takes up the deep station\'s bucket, rope and all.'], 260); yield 30;
  };

  // ------------------------------------------------------------------ a fight elsewhere, pulled in, and back
  R.pullIn = function* (B, which, trig, at, start) {
    var R0 = B.roam, done = null, hp = {};
    R0.members.forEach(function (u) { hp[u.id] = { hp: u.hp, ko: !!u.ko }; });
    var o = Object.assign({}, R.party0, { fightDef: null, fight: which === 'keeper' ? 'keeper' : 'wet', onDone: function (res) { done = res || 'out'; } });
    // the floor's own state goes in with them, as the 8-bit's seam sends it (js/embed.js): the flags it has set (the landlord fed, who holds the bucket, the dead) and the
    // pack as it stands (the bucket in it) -- and comes back out below (10-13, his play: "they did the bucket then left the zone, and the bucket refreshed and was triggered again")
    var base0 = o.ladder ? D.save.fixture(Math.min(9, R.party0.level)) : D.save.load().data; delete o.ladder;
    o.data = JSON.parse(JSON.stringify(base0));
    o.data.flags = Object.assign({}, o.data.flags || {}, R0.flags);
    o.data.inv = JSON.parse(JSON.stringify(B.inv || []));
    if (which === 'keeper') o.start = start || (trig.id === 'mark' ? 'rune' : 'ledge');
    else o.wake = R.WAKE[trig.id];
    var b = new D.Battle(o), e0 = b.enter, leadId = R0.token.id;
    b.enter = function () {
      e0.apply(this, arguments);
      // the four as they walked: their hit points from the floor
      this.units.forEach(function (u) { var h = hp[u.id]; if (h && u.side === 'party') { u.hp = Math.min(u.maxhp, h.hp); if (u.hp <= 0) u.ko = true; } });
      // seated by the formation (Griz, 10-13: "'order' gonna have to be passed to every grid fight"): the lead on the trigger's square in the Settling (as the 8-bit's
      // seam puts him, embed.at -- the Settling's squares are the floor's own), on the map's way in at the Keeper's; each of the rest on its slot round the lead the way
      // the token faced, or the nearest open square to it
      var self = this, m = this.map, ours = this.units.filter(function (u) { return u.side === 'party' && !u.riding; });
      var lead = ours.filter(function (u) { return u.id === leadId; })[0] || ours[0]; if (!lead) return;
      var L0 = which === 'wet' && m.def.from8 ? (function () { var p8 = R.def.to8(at[0], at[1]); return m.def.from8(p8[0], p8[1]); })() : [lead.x, lead.y];
      var taken = {}; this.units.forEach(function (u) { if (u.side !== 'party') G.foot(u).forEach(function (q) { taken[q[0] + ',' + q[1]] = 1; }); });
      var free = function (x, y) { var s = m.at(x, y); return s && s.walk && !taken[x + ',' + y]; };
      var near = function (want) { var best = null, bd = Infinity; for (var y = want[1] - 4; y <= want[1] + 4; y++) for (var x = want[0] - 4; x <= want[0] + 4; x++) { if (!free(x, y)) continue; var d = Math.max(Math.abs(x - want[0]), Math.abs(y - want[1])) + 0.01 * Math.hypot(x - want[0], y - want[1]); if (d < bd) { bd = d; best = [x, y]; } } return best; };
      var A = R.axes(R0.fw), lq = near(L0); if (lq) { lead.x = lq[0]; lead.y = lq[1]; taken[lq[0] + ',' + lq[1]] = 1; }
      ours.forEach(function (u) {
        if (u === lead) return;
        var f = R0.form[u.id] || [-1, 0], want = [lead.x + f[0] * A.f[0] + f[1] * A.r[0], lead.y + f[0] * A.f[1] + f[1] * A.r[1]], q = near(want);
        if (q) { u.x = q[0]; u.y = q[1]; taken[q[0] + ',' + q[1]] = 1; }
      });
      G.setup(m, this.units);
    };
    // a peaceful bucket (Griz, 10-13: "Peaceful bucket should re-assemble the party token"): the landlord fed and nothing else up -- no ooze or jelly woken, no
    // crawler roused -- and the Settling is over at the next turn that waits on a player (after the landlord's pictures), the party back into the token where it stands
    if (which === 'wet') {
      var up0 = b.update;
      b.update = function () {
        var r = up0.apply(this, arguments);
        if (!done && this.flags8 && this.flags8.otyughFed && this.req && this.req.turn && this.units && !this.units.some(function (u) { return u.side === 'foe' && !u.dead && u.hp > 0 && !u.dormant && !u.fed && !u.left; })) {
          if (D.top() === this) D.pop();
          done = 'fed';
        }
        return r;
      };
    }
    B.card(['{r}' + (which === 'keeper' ? 'THE KEEPER OF THE FLOODED STAIR' : 'THE SETTLING') + '{/}: its own fight, pulled in.'], 200);
    D.sfx('encounter'); yield 40;
    R.stats.pull = (R.stats.pull || 0) + 1;
    D.push(b);
    while (!done) yield 1; // (the floor waits under it: only the top scene runs -- js/core.js)
    // back on the floor: the four's hit points as the fight left them; the trigger spent if the fight was won
    D.battle = B; G.setup(B.map, B.units); D.iso.map = B.map;
    (b.units || []).forEach(function (u) { var w = R0.members.filter(function (m) { return m.id === u.id; })[0]; if (w) { w.hp = Math.max(0, u.hp); w.ko = w.hp <= 0; w.conds = {}; } });
    Object.assign(R0.flags, b.flags8 || {}); // (what it set: otyughFed, bucketBy, heard:r-stream, landlordSpoke, the dead -- the rim's trigger reads otyughFed and otyughDead)
    if (b.inv) B.inv = JSON.parse(JSON.stringify(b.inv)); // (the pack as the fight left it: the bucket taken up or gone into the water, a potion drunk)
    if (done === 'won') R0.spent[trig.id] = 1;
    if (which === 'wet' && done === 'won') ['jelly', 'jellyNorth', 'poolOoze', 'landlordStep'].forEach(function (id) { R0.spent[id] = 1; });
    if (which === 'keeper' && done === 'won') { ['stair', 'mark'].forEach(function (id) { R0.spent[id] = 1; }); R0.flags.keeperDone = 1; R0.flags.fiveRecovered = 1; }
    if (which === 'keeper' && done !== 'won' && done !== 'lost') R0.flags.keeperAwake = 1; // (a run leaves it awake and unbeaten: the rope then fights it by the rune -- the 8-bit's, 10-04)
    if (which === 'keeper' && done === 'won') { B.card([R.say8('w.keeperGone'), '{g}' + R.say8('w.fiveRecovered') + '{/}'], 360); yield 40; }
    // the Settling's squares are the floor's own: the token back where the party left it -- a square past the one who got out (off the Settling's ground, the way
    // they went), or where the first still standing ended (10-13, his play: "Barleys wet exit of landlord scene put them back at waters edge")
    if (which === 'wet') {
      var ws = (b.units || []).filter(function (u) { return u.side === 'party' && !u.familiar && !u.summon; });
      var outU = ws.filter(function (u) { return u.left; })[0], upU = ws.filter(function (u) { return !u.left && u.hp > 0 && !u.dead; })[0], src = outU || upU;
      if (src) {
        var wW = (D.MAPS.wet.rows[0] || '').length, tok = R0.token, q0 = [src.x, src.y], best = null;
        if (outU) for (var dy = -1; dy <= 1 && !best; dy++) for (var dx = -1; dx <= 1 && !best; dx++) { var nx = src.x + dx, ny = src.y + dy, s1 = G.map.at(nx, ny); if (s1 && s1.walk && nx >= wW && G.canStand(tok, nx, ny)) best = [nx, ny]; }
        if (!best && G.canStand(tok, q0[0], q0[1])) best = q0;
        if (!best) for (var r = 1; r <= 3 && !best; r++) for (var dy2 = -r; dy2 <= r && !best; dy2++) for (var dx2 = -r; dx2 <= r && !best; dx2++) if (G.canStand(tok, q0[0] + dx2, q0[1] + dy2)) best = [q0[0] + dx2, q0[1] + dy2];
        if (best) { tok.x = best[0]; tok.y = best[1]; tok.tween = null; G.setup(G.map, B.units); }
      }
    }
    B.focus(R0.token);
    B.card(done === 'fed' ? ['{y}The landlord settles under the water.{/}', '{g}The party gathers into ' + R0.token.name + '.{/}'] : ['{y}Back on the Wet{/} (' + done + ').'], 260);
    if (done === 'fed') { FX.ring(R0.token, 'glow', 22); D.sfx('popup'); }
    if (!R.standing(R0).length) { R0.mode = 'over'; B.card(['{r}The party has fallen.{/}  R to walk the Wet again.'], 100000); }
  };
  R.standing = function (R0) { return R0.members.filter(function (u) { return u.hp > 0 && !u.dead; }); };

  // ------------------------------------------------------------------ the party's sight from the token's square
  // each hero's own lights and darkvision, all of them where the token stands (they walk as one), and the floor's lights; a lit square in a line
  // from the token is seen (2), a dark one inside someone's darkvision is seen grey (1). Out of the dark (B.dark false) everything in a line is seen
  R.sight = function (B) {
    var R0 = B.roam, t = R0.token, m = G.map, all = R0.members.filter(function (u) { return u.hp > 0 && !u.dead && !(u.conds && u.conds.blinded); });
    var lights = (B.lights || []).slice(), dv = 0, dvBy = null, lightBy = null, lightFt = 0;
    all.forEach(function (u) {
      var x0 = u.x, y0 = u.y; u.x = t.x; u.y = t.y;
      L.carried(u).forEach(function (l) { lights.push(l); if (l.bright + l.dim > lightFt) { lightFt = l.bright + l.dim; lightBy = u.name + '\'s ' + (l.kind || 'light'); } });
      u.x = x0; u.y = y0;
      if ((u.darkvision || 0) > dv) { dv = u.darkvision; dvBy = u.name; }
    });
    var v = new Array(m.w * m.h), cap = R.FAR || 9999, far = 0;
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
      var i = y * m.w + x, s = m.sq[i]; v[i] = 0;
      if (!s.open) continue;
      var ft = G.dist(t, { x: x, y: y, size: 1 }); if (ft > cap) continue;
      if (!(x === t.x && y === t.y) && !G.losPoint(t.x, t.y, x, y)) continue;
      if (!B.dark) { v[i] = 2; continue; }
      var lit = lights.some(function (l) { var d = Math.hypot(x - l.x, y - l.y) * 5; return d <= l.bright + l.dim + 0.01 && (Math.round(l.x) === x && Math.round(l.y) === y || G.losPoint(Math.round(l.x), Math.round(l.y), x, y)); });
      v[i] = lit ? 2 : ft <= dv ? 1 : 0;
      if (v[i]) far = Math.max(far, ft);
    }
    return { v: v, w: m.w, dv: dv, dvBy: dvBy, lightFt: lightFt, lightBy: lightBy, far: far };
  };

  // ------------------------------------------------------------------ an encounter: who, how far, the spill, the ground, the fight
  R.CEILING = { darkmantle: 1 }; // (the lurkers that hang from a ceiling when there is one)
  R.LURK = { grick: 1, roper: 1, darkmantle: 1, xorn: 1, grimlock: 1, cube: 1, gelatinouscube: 1, grayooze: 1 }; // (battle.js's natural lurkers, and the gray ooze by its False Appearance)
  R.pick = function (zone, flags) {
    var Z = window.DS.DATA.encounters[zone]; if (!Z) return null;
    var gs = Z.groups.filter(function (g) { return R.cond(g.cond, flags); }), tot = 0; gs.forEach(function (g) { tot += g.w || 1; });
    var r = D.rand() * tot, grp = gs[0]; for (var i = 0; i < gs.length; i++) { r -= gs[i].w || 1; if (r < 0) { grp = gs[i]; break; } }
    var list = []; grp.e.forEach(function (e) { var n = e[1] + D.rint(e[2] - e[1] + 1); for (var k = 0; k < n; k++) list.push(e[0]); });
    return { Z: Z, grp: grp, list: list };
  };
  R.encounter = function* (B, why, set) {
    var R0 = B.roam, t = R0.token, t0 = (window.performance || Date).now();
    var p = set ? { list: set.list, grp: {} } : R.pick(R.zoneAt(B, t.x, t.y) || 'warrens_d', R0.flags);
    if (!p || !p.list.length) return;
    if (p.grp.flee && D.rand() < p.grp.flee) { B.card(['{g}Something scuttles off into the dark.{/}'], 200); yield 30; return; }
    R0.fights++;
    var foes = p.list.map(function (kind, i) { var u = B.makeFoe({ id: 'roam' + R0.fights + '-' + i + '-' + kind, kind: kind }); u.anim = 'idle'; u.animT = B.t; u.reaction = 1; u.conds = u.conds || {}; if (set && set.swims) u.swims = true; return u; });
    // where: the party's sight decides it (above); a set fight (an ooze's own square) is where its square is
    var reach = R.flood(t, [t.x, t.y], 40), sight = R.sight(B), lurk = !(set && set.at) && foes.some(function (u) { return R.LURK[u.kind]; }), spot = null, how = '';
    var cand = Object.keys(reach).map(function (k) { var a = k.split(','); return [+a[0], +a[1], reach[k]]; }).filter(function (q) { return !(q[0] === t.x && q[1] === t.y) && G.canStand(foes[0], q[0], q[1], { ghost: true }); });
    var ftOf = function (q) { return G.dist(t, { x: q[0], y: q[1], size: 1 }); };
    if (set && set.at) {
      spot = set.at; how = set.how || 'its own square';
      // (a swimmer in its pool: the pool's squares count as its own -- the Settling's jelly, js/wet.js)
      cand = cand.concat([[spot[0], spot[1], 0]]);
      if (set.swims) for (var yy = spot[1] - 3; yy <= spot[1] + 3; yy++) for (var xx = spot[0] - 3; xx <= spot[0] + 3; xx++) { var sq0 = G.map.at(xx, yy); if (sq0 && sq0.deep) cand.push([xx, yy, 0]); }
    } else if (lurk) {
      // close, ahead of the token where it can be, in hiding (10 to 20 ft)
      var near = cand.filter(function (q) { var f = ftOf(q); return f >= 10 && f <= 20; });
      var ahead = near.filter(function (q) { return (q[0] - t.x) * R0.fw[0] + (q[1] - t.y) * R0.fw[1] > 0; });
      var pool = ahead.length ? ahead : near; spot = pool.length ? pool[D.rint(pool.length)] : null; how = 'lying in wait';
    } else {
      // the edge of what the party sees, and a walk to them from there no more than half again the straight line
      var seen = cand.filter(function (q) { return sight.v[q[1] * sight.w + q[0]] > 0 && q[2] * 5 <= ftOf(q) * 1.5 + 10; });
      var far = 0; seen.forEach(function (q) { far = Math.max(far, ftOf(q)); });
      var ring = seen.filter(function (q) { return ftOf(q) >= far - 5; });
      spot = ring.length ? ring[D.rint(ring.length)] : null; how = 'at the edge of sight';
      if (!spot) { var close = cand.filter(function (q) { return ftOf(q) <= 10; }); spot = close.length ? close[D.rint(close.length)] : null; how = 'out of the dark, right on them'; }
    }
    if (!spot) { B.card(['{g}(no square for them: the encounter passes){/}'], 160); return; }
    // the group round the spot, on squares the token could walk to (or a swimmer's pool), clear of each other and of anyone on the floor (a big one's whole footing)
    var taken = {}; B.units.forEach(function (w) { G.foot(w).forEach(function (q) { taken[q[0] + ',' + q[1]] = 1; }); });
    var placed = [];
    foes.forEach(function (u) {
      var n = u.size || 1, best = null, bd = Infinity;
      cand.concat([[spot[0], spot[1], 0]]).forEach(function (q) {
        var d = Math.hypot(q[0] - spot[0], q[1] - spot[1]); if (d >= bd || d > 4) return;
        for (var j = 0; j < n; j++) for (var i = 0; i < n; i++) if (taken[(q[0] + i) + ',' + (q[1] + j)]) return;
        if (!G.canStand(u, q[0], q[1], { ghost: true })) return;
        bd = d + D.rand() * 0.01; best = q;
      });
      if (!best) return;
      for (var j = 0; j < n; j++) for (var i = 0; i < n; i++) taken[(best[0] + i) + ',' + (best[1] + j)] = 1;
      u.x = best[0]; u.y = best[1]; u.facing = D.spr.facingFor(t.x - u.x, t.y - u.y);
      if (lurk && R.LURK[u.kind]) { u.conds.hidden = true; u.hidden0 = true; }
      // wings (the fight's `fliers`: js/flight-ai.js marks only those it began with); a darkmantle lies in wait up on the ceiling -- SRD 5.1: "indistinguishable from a cave formation
      // such as a stalactite" while it keeps still -- and drops from there
      var fd0 = D.FOES[u.kind]; if (fd0 && fd0.fly) { u.flies = true; u.speed = Math.max(u.speed || 0, fd0.fly); }
      if (lurk && R.CEILING[u.kind] && u.flies) u.fz = G.flyTop(u);
      placed.push(u);
    });
    if (!placed.length) { B.card(['{g}(no square for them: the encounter passes){/}'], 160); return; }
    var distFt = Math.min.apply(null, placed.map(function (u) { return G.dist(t, u); }));
    placed.forEach(function (u) { B.units.push(u); });
    G.setup(G.map, B.units);
    var ms = Math.round((window.performance || Date).now() - t0);
    var who = R.whoOf(B, placed);
    var sees = sight.lightBy ? sight.lightBy + ' ' + sight.lightFt + ' ft' : 'no light';
    if (sight.dv) sees += ', ' + sight.dvBy + '\'s darkvision ' + sight.dv + ' ft';
    var grp = { foes: placed, why: why, mode: 'approach', motivated: R.hunts(p.grp, placed), rolled: false, stall: 0, t: B.t, seenAt: distFt, flag: set && set.flag, trig: set && set.trig };
    R0.last = { why: why, who: who, kinds: placed.map(function (u) { return u.kind; }), spot: spot, distFt: distFt, how: how, sightFar: sight.far, lightFt: sight.lightFt, dv: sight.dv, lurk: lurk, motivated: grp.motivated, ms: ms, at: [t.x, t.y] };
    R0.log.push(R0.last); R0.sightV = sight.v; // (the map's picture of what they saw: R.paintMap)
    D.sfx('encounter');
    B.focus({ x: Math.round((t.x + spot[0]) / 2), y: Math.round((t.y + spot[1]) / 2), size: 1 }); // (between them: the party and what is coming, not the dark it comes out of)
    // lying in wait, or a square of its own (an ooze where it lies -- RULED 10-13, Griz: "the ooze fights should just trigger"): the fight is now.
    // Walking in: the approach (RULED 10-13: "1 yes"), the fight where they meet
    if (lurk || (set && set.at)) {
      B.card(['{r}' + (set && set.at && set.line ? set.line : 'ENCOUNTER: ' + who + ', ' + how + ' -- ' + distFt + ' ft off.') + '{/}'], 300);
      yield 40;
      yield* R.engage(B, grp, lurk, why);
      return;
    }
    R0.groups.push(grp);
    B.card(['{r}ENCOUNTER{/}: ' + who + ', ' + how + ' -- ' + distFt + ' ft off, and coming' + (grp.motivated ? ' (hunting)' : '') + '.', '{g}The party sees ' + sight.far + ' ft from here (' + sees + ').{/}', '{g}F: the fight now, at this range. Or walk: out of their sight, they may lose you.{/}'], 480);
    yield 30;
  };
  R.whoOf = function (B, list) {
    var names = {}; list.forEach(function (u) { var nm = B.shortName(u); names[nm] = (names[nm] || 0) + 1; });
    return Object.keys(names).map(function (k) { return (names[k] > 1 ? names[k] + ' ' : 'a ') + k + (names[k] > 1 ? 's' : ''); }).join(' and ');
  };
  // motivated (RULED 10-13, Griz: "motivation is a flag"): an encounter group's `hunts` (content/encounters.json, the build's), or &hunt=all for the test.
  // A motivated group comes after the party at once when it gets away; one that is not stalls a round first
  R.hunts = function (g, foes) { return !!(g && g.hunts) || /[?&]hunt=all\b/.test(R.q || ''); };
  R.tracking = function (R0) { return R0.groups.filter(function (g) { return g.mode === 'approach' || g.mode === 'pursue'; }); };
  R.live = function (B, g) { return g.foes.filter(function (u) { return !u.dead && u.hp > 0 && B.units.indexOf(u) >= 0; }); };

  // the fight where they meet: the token's party out onto its formation, the whole floor the fight's (RULED 10-13: "no box"), initiative
  R.engage = function* (B, grp, lurk, why) {
    var R0 = B.roam, t = R0.token, L0 = R0.last || {};
    R0.groups = R0.groups.filter(function (g) { return g !== grp; });
    var foes = R.live(B, grp);
    if (!foes.length) return;
    foes.forEach(function (u) { u.facing = D.spr.facingFor(t.x - u.x, t.y - u.y); u.anim = 'idle'; u.animT = B.t; });
    L0.contactFt = Math.min.apply(null, foes.map(function (u) { return G.dist(t, u); })); L0.started = why;
    // any other group on the floor that sees the party joins in; the rest wait where they are, out of this fight (not dealt in)
    R0.groups.slice().forEach(function (g) {
      var lv = R.live(B, g);
      if (lv.some(function (u) { return G.losPoint(u.x, u.y, t.x, t.y) && L.seesBy(B, u, t).ok; })) { foes = foes.concat(lv); R0.groups = R0.groups.filter(function (x) { return x !== g; }); }
    });
    B.units.forEach(function (u) { if (u.side === 'foe' && foes.indexOf(u) < 0) u.roamAside = true; });
    // the spill: the token's party out onto their formation, as near as the floor allows
    L0.spill = R.spill(B, {});
    B.exits = [];
    B.card(['{r}THE FIGHT{/}: ' + L0.contactFt + ' ft between them' + (why === 'yours' ? ' -- yours to open' : '') + '.', '{g}A way out: the stairs, or a square a full move clear of every one of them (the pale squares on your turn). One of you out takes the party with them.{/}'], 420);
    yield 50;
    var o = yield* R.fight(B, foes, lurk);
    yield* R.after(B, o, grp, foes);
  };
  // the ways out for one of ours as its turn comes (RULED 10-13, the box cut: "no box"): the floor's own doors, and the squares a full move clear of every foe in
  // the fight -- farther by walking than its reach and its move -- that this one could reach this turn (its move and a dash). A way out is LEAVE THE FIGHT's
  // (battle.js exits): its opportunity attacks, and "your allies refuse" while one of the four lies down or bound (battle.js heldBack)
  R.setExits = function (B, u) {
    var foes = B.units.filter(function (f) { return f.side === 'foe' && !f.dead && f.hp > 0 && !f.roamAside && !f.left; });
    var walk = function (from, probe, maxD, solidFoes) {
      var key = function (x, y) { return x + ',' + y; }, d = {}, q = [from]; d[key(from[0], from[1])] = 0;
      var ok = function (x, y) { var s = G.map.at(x, y); if (!s || !s.walk) return false; if (solidFoes) { var o = G.occupant(x, y, probe); if (o && o.side === 'foe' && !o.dead) return false; } return true; };
      while (q.length) {
        var c = q.shift(), dc = d[key(c[0], c[1])]; if (dc >= maxD) continue;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          var nx = c[0] + dx, ny = c[1] + dy, k = key(nx, ny); if ((!dx && !dy) || d[k] != null || !ok(nx, ny)) continue;
          if (dx && dy && (!ok(c[0] + dx, c[1]) || !ok(c[0], c[1] + dy))) continue;
          d[k] = dc + 1; q.push([nx, ny]);
        }
      }
      return d;
    };
    var fd = foes.map(function (f) { return { f: f, need: Math.ceil(((f.reach || 5) + Math.max(f.speed || 30, f.fly || 0)) / 5), d: walk([f.x, f.y], f, 60, false) }; });
    var mine = walk([u.x, u.y], u, Math.floor(2 * (u.speed || 30) / 5), true), clear = [];
    Object.keys(mine).forEach(function (k) {
      if (fd.every(function (e) { var dd = e.d[k]; return dd == null || dd > e.need; })) { var a = k.split(','); clear.push([+a[0], +a[1]]); }
    });
    // (RULED 10-13, Griz: "edge toward the actual exits for out-of-range exits"): the floor's own exits when this one can reach them this turn; else the clear squares
    // nearest them by walking -- the edge of the clear ground on the way to the stairs. A floor with no way to its exits keeps every clear square
    var doors = G.map.def.doors || [], dd0 = {}, dq = [];
    doors.forEach(function (q) { dd0[q[0] + ',' + q[1]] = 0; dq.push(q); });
    while (dq.length) { var c0 = dq.shift(), v0 = dd0[c0[0] + ',' + c0[1]]; for (var yy = -1; yy <= 1; yy++) for (var xx = -1; xx <= 1; xx++) { var kx = (c0[0] + xx) + ',' + (c0[1] + yy), s0 = G.map.at(c0[0] + xx, c0[1] + yy); if ((!xx && !yy) || dd0[kx] != null || !s0 || !s0.walk) continue; dd0[kx] = v0 + 1; dq.push([c0[0] + xx, c0[1] + yy]); } }
    var inReach = doors.filter(function (q) { return mine[q[0] + ',' + q[1]] != null; }), ex;
    if (inReach.length) ex = inReach.map(function (q) { return q.slice(); });
    else {
      var withD = clear.filter(function (q) { return dd0[q[0] + ',' + q[1]] != null; });
      var lo = Math.min.apply(null, withD.map(function (q) { return dd0[q[0] + ',' + q[1]]; }));
      ex = withD.length ? withD.filter(function (q) { return dd0[q[0] + ',' + q[1]] <= lo + 2; }) : clear; // (a short stretch of that edge, not one square: seen in the pane, 10-13)
    }
    B.exits = ex;
  };

  // the approach, the pursuit, the lost -- each time the script looks (a frame, or a step's eight). A group coming walks at its speed (the token's walking pace
  // for 30 ft); coming in (the approach) the fight starts when one is within its own reach and a move of the token, after a fight it got away from (the
  // pursuit) when one is within 2 squares (RULED 10-13, Griz: "within 2 squares - the 8 square donut around the token"); one that was not motivated holds while
  // the token takes 6 steps first ("let the player move 6 from the unmotivated ones"). Out of all their sight, the party's Stealth as a group against their best
  // passive Perception, once a break: lost, they stay where they are -- on the floor till the party leaves it and comes back ("loses them is fine but they'll
  // have to exit and come back to make the random encounter vanish") -- and come on again if they see the party
  R.tickGroups = function (B) {
    var R0 = B.roam, t = R0.token, hit = null;
    R0.groups.slice().forEach(function (g) {
      var dt = B.t - g.t; g.t = B.t;
      var live = R.live(B, g);
      if (!live.length) { R0.groups = R0.groups.filter(function (x) { return x !== g; }); return; }
      var seen = live.some(function (u) { return G.losPoint(u.x, u.y, t.x, t.y) && L.seesBy(B, u, t).ok; });
      if (g.mode === 'lost') { if (seen) { g.mode = 'approach'; g.rolled = false; B.card(['{r}' + R.whoOf(B, live) + '{/}: they have seen you again.'], 260); D.sfx('encounter'); } return; }
      // (the hold is a round's time -- 6 of the token's steps, a step's 8 frames each, walked or stood: a party standing still is still come for)
      if (g.stall > 0 && dt > 0) { g.stall = Math.max(0, g.stall - dt / STEP); dt = 0; }
      if (dt > 0 && !(g.stall > 0)) live.forEach(function (u) {
        var sp = Math.max(u.speed || 30, (u.fly || 0));
        u.racc = (u.racc || 0) + dt * (sp / 30) / STEP;
        while (u.racc >= 1) {
          u.racc -= 1;
          var path = R.pathToward(u, t), nx = path && path[0];
          if (!nx || (nx[0] === t.x && nx[1] === t.y) || !G.canStand(u, nx[0], nx[1])) { u.racc = 0; break; }
          u.tween = { fx: u.x, fy: u.y, fz: 0, t: 0, dur: STEP, mode: null }; u.facing = D.spr.facingFor(nx[0] - u.x, nx[1] - u.y);
          if (u.anim !== 'walk') { u.anim = 'walk'; u.animT = B.t; }
          u.x = nx[0]; u.y = nx[1];
        }
      });
      if (!hit && !(g.stall > 0) && live.some(function (u) { return g.mode === 'pursue' ? G.dist(u, t) <= 10 : G.dist(u, t) <= (u.reach || 5) + Math.max(u.speed || 30, u.fly || 0); })) { hit = g; return; }
      if (seen) { g.rolled = false; return; }
      if (g.rolled) return;
      g.rolled = true;
      var pp = Math.max.apply(null, live.map(function (u) { return u.perception || 10; })), ok = 0, lines = [], up = R0.members.filter(function (u) { return u.hp > 0; });
      up.forEach(function (u) { var r = D.d(20) + (u.stealth || 0); if (r >= pp) ok++; lines.push(u.name + ' ' + r); });
      var got = ok * 2 >= up.length;
      B.card(['{y}OUT OF THEIR SIGHT{/}: the party\'s Stealth against their passive Perception ' + pp + ' (' + lines.join(', ') + ')', got ? '{n}They lose you -- but they are still down here.{/}' : '{o}They heard you: still coming.{/}'], 360);
      if (got) { g.mode = 'lost'; live.forEach(function (u) { u.anim = 'idle'; u.animT = B.t; }); }
    });
    return hit;
  };
  // the way toward the token for one of them: to its square, or -- a big one whose body will not fit there (the crawler's 2 x 2 by a wall) -- to the nearest
  // square round it that it does fit (the test's bench found the crawler standing still after the party got away)
  R.pathToward = function (u, t) {
    var p = D.Battle.route(u, [t.x, t.y], false); if (p) return p;
    for (var r = 1; r <= 3; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !G.canStand(u, t.x + dx, t.y + dy, { ghost: true })) continue;
      p = D.Battle.route(u, [t.x + dx, t.y + dy], false); if (p) return p;
    }
    return null;
  };
  R.dropGroups = function (B) { // (a pulled-in fight takes the party off this floor: the groups on it go with the floor -- the test has no way back but this)
    var R0 = B.roam, all = []; R0.groups.forEach(function (g) { all = all.concat(g.foes); });
    B.units = B.units.filter(function (u) { return all.indexOf(u) < 0; }); G.setup(G.map, B.units); B.cache = null; R0.groups = [];
  };

  // the spill: each of the rest from the token onto its formation slot, or the nearest square the token can walk to (not through a wall,
  // not where anyone stands); the fallen are laid on theirs. Returns where each went, and how far off its slot
  R.spill = function (B, taken) {
    var R0 = B.roam, t = R0.token, reach = R.flood(t, [t.x, t.y], 8), out = [];
    taken = Object.assign({}, taken);
    B.units.forEach(function (w) { G.foot(w).forEach(function (q) { taken[q[0] + ',' + q[1]] = 1; }); });
    R0.rest.forEach(function (u) {
      var sl = R.slot(R0, u), best = null, bd = Infinity;
      Object.keys(reach).forEach(function (k) {
        if (taken[k]) return; var a = k.split(','), x = +a[0], y = +a[1];
        if (!G.canStand(u, x, y, { ghost: true })) return;
        var d = Math.max(Math.abs(x - sl[0]), Math.abs(y - sl[1])) + reach[k] * 0.01;
        if (d < bd) { bd = d; best = [x, y]; }
      });
      if (!best) best = [t.x, t.y];
      taken[best[0] + ',' + best[1]] = 1;
      u.tween = { fx: t.x, fy: t.y, fz: 0, t: 0, dur: 10, mode: null };
      u.x = best[0]; u.y = best[1]; u.facing = t.facing; u.anim = u.hp > 0 ? 'idle' : u.anim; u.animT = B.t;
      if (B.units.indexOf(u) < 0) B.units.push(u);
      FX.sparkle(u, 'glow', 8);
      out.push({ id: u.id, slot: sl, at: best, off: Math.max(Math.abs(best[0] - sl[0]), Math.abs(best[1] - sl[1])) });
    });
    G.setup(G.map, B.units); B.cache = null;
    return out;
  };

  // one fight on the floor: initiative (those set aside sit it out), the rounds (js/waves.js fight, the Game Show's, is this loop); the ways out set for each of
  // ours as its turn comes; one of ours out and the fight is over for all of them (RULED 10-13, Griz: "yeah, we have a 'party refuses' line in the build somewhere");
  // won when this fight's foes are down (another group waiting on the floor holds nothing open)
  R.fight = function* (B, foes, lurk) {
    var R0 = B.roam; R0.mode = 'fight'; B.cine = false;
    B.round = 0; B.active = null; B.mpHiveDone = {};
    var rolls = B.units.filter(function (u) { return !u.familiar && !u.object && !u.look && !u.dead && !u.roamAside; });
    rolls.forEach(function (u) { var d = D.d(20); if (u.initAdv) d = Math.max(d, D.d(20)); u.initRoll = d + (u.init || 0); });
    B.order = rolls.sort(function (a, b) { return b.initRoll - a.initRoll || ((b.abil && b.abil.dex) || 10) - ((a.abil && a.abil.dex) || 10); });
    B.card(['{y}INITIATIVE{/}  ' + B.order.map(function (u) { return B.shortName(u) + ' ' + u.initRoll; }).join(' · ')], 360);
    yield 50;
    // a lurker's ambush (SRD 5.1 surprise; battle.js run's own lines): their Stealth, rolled once, against each passive Perception
    if (lurk) {
      var sk = Math.max.apply(null, foes.map(function (w) { return w.stealth || 0; })), sr = D.d(20), st = sr + sk, lines = ['{r}AMBUSH{/}: their Stealth d20 ' + sr + ' ' + (sk >= 0 ? '+' : '') + sk + ' = ' + st + ' against each passive Perception'];
      B.units.forEach(function (w) { if (w.side !== 'party' || w.hp <= 0) return; var ok = (w.perception || 10) >= st; lines.push('  ' + w.name + ' ' + (w.perception || 10) + ': ' + (ok ? '{n}sees them coming{/}' : '{o}caught unaware{/}')); if (!ok) w.conds.surprised = true; });
      B.card(lines, 480); yield 70;
    }
    var ours = function () { return foes.filter(function (u) { return !u.dead && u.hp > 0 && !u.left && !u.fled && !u.summon && !u.dominated && !(u.conds.stoning && u.conds.stoning.done); }); };
    while (true) {
      B.round++;
      if (B.round > 40) { foes.forEach(function (u) { if (!u.dead) { u.left = true; u.dead = true; } }); B.card(['{g}The rest of them slink back into the dark.{/}'], 300); yield 40; return 'won'; }
      for (var i = 0; i < B.order.length; i++) {
        var u = B.order[i];
        if (u.dead || u.away) continue;
        B.active = u;
        if (u.side === 'party') R.setExits(B, u);
        if (u.side === 'party' && !u.guest && !u.ally) yield* B.heroTurn(u);
        else yield* D.ai.turn(B, u);
        B.active = null;
        if (B.readyArmed && B.readyArmed()) yield* B.readyAfter({ turnOf: u });
        if (D.familiar && !u.familiar) yield* D.familiar.after(B, u);
        B.sweep();
        if (R0.members.some(function (m) { return m.left; })) return 'escaped';
        if (!ours().length && !B.units.some(function (w) { return w.side === 'foe' && w.regenDown && !w.dead && !w.roamAside; })) return 'won';
        var o = B.over();
        if (o && o !== 'won') return o;
        i = B.order.indexOf(u);
      }
    }
  };
  // and after: the dead off the floor; got away, the ones still standing stay on it and come after the party (the pursuit); won, the four walk into the first of
  // them still standing (the fallen carried in) -- got away, all four are taken into the token at once, one square past where the one who got out left
  R.after = function* (B, o, grp, foes) {
    var R0 = B.roam, g2 = null;
    B.order = []; B.active = null; B.cine = true; B.req = null; B.exits = [];
    R0.lastOutcome = o;
    if (o === 'lost') {
      R0.mode = 'over'; D.sfx('error');
      B.card(['{r}The party has fallen in the Wet.{/}  R to walk it again.'], 100000);
      return;
    }
    var outBy = R0.members.filter(function (u) { return u.left; })[0];
    var took = R.takeUpLights(B);
    var still = (foes || []).filter(function (u) { return !u.dead && u.hp > 0 && !u.left; });
    B.units = B.units.filter(function (u) { return u.side === 'party' ? !u.summon && !u.object : !u.dead && u.hp > 0; });
    B.units.forEach(function (u) { delete u.roamAside; });
    R0.members.forEach(function (u) { if (u.left) { u.left = false; u.dead = false; } delete u.conds.surprised; delete u.conds.hidden; u.turn = null; if (B.units.indexOf(u) < 0) B.units.push(u); });
    G.setup(G.map, B.units); B.cache = null;
    var up = R.standing(R0), lead = up[0];
    if (!lead) { R0.mode = 'over'; return; }
    if (o === 'escaped' && outBy) {
      // one square past where the one who got out left: of the squares beside it, the one farthest by walking from the foes still up
      var fdist = function (x, y) { var best = Infinity; still.forEach(function (f) { var p = D.Battle.route(f, [x, y], false); best = Math.min(best, p ? p.length : 99); }); return best; };
      var meet = [outBy.x, outBy.y], md = still.length ? fdist(outBy.x, outBy.y) : 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var nx = outBy.x + dx, ny = outBy.y + dy, s = G.map.at(nx, ny); if ((!dx && !dy) || !s || !s.walk || G.occupant(nx, ny)) continue;
        var d = still.length ? fdist(nx, ny) : 0; if (d > md) { md = d; meet = [nx, ny]; }
      }
      R0.members.forEach(function (u) { if (u !== lead) FX.sparkle(u, 'glow', 10); });
      lead.x = meet[0]; lead.y = meet[1]; lead.tween = null;
      // out by the floor's own stairs: off this floor -- the 8-bit takes the party on, and down again its groups are gone ("they'll have to exit and come back to make
      // the random encounter vanish"); the test keeps the party here, on the stair, with the floor's groups cleared
      var byStair = (G.map.def.doors || []).some(function (d) { return d[0] === outBy.x && d[1] === outBy.y; });
      if (byStair) {
        lead.x = outBy.x; lead.y = outBy.y;
        B.units = B.units.filter(function (u) { return still.indexOf(u) < 0; }); R.dropGroups(B);
        B.card(['{y}Away{/}: ' + outBy.name + ' takes the stair, and the party with them.', '{g}Off the floor: the 8-bit would take you on, and back down its groups are gone. (The test keeps you here, the floor cleared.){/}'], 360);
        still = [];
      } else if (still.length) {
        g2 = { foes: still, why: 'pursuit', mode: 'pursue', motivated: !!(grp && grp.motivated), rolled: false, stall: grp && grp.motivated ? 0 : 6, t: B.t, flag: grp && grp.flag, trig: grp && grp.trig };
        R0.groups.push(g2);
        still.forEach(function (u) { u.racc = 0; u.anim = 'idle'; u.animT = B.t; });
      }
      if (!byStair) B.card(['{y}Away{/}: ' + outBy.name + ' gets clear, and the party with them -- into ' + lead.name + '.', still.length ? (grp && grp.motivated ? '{o}They come after you at once.{/}' : '{g}They hold a moment (6 steps) -- then follow your trail.{/}') : ''], 340);
    } else {
      var meet2 = [lead.x, lead.y];
      B.card(['{y}The way is clear.{/}', '{g}The party gathers into ' + lead.name + '.' + (took.length ? ' The light on the floor is taken up (' + took.join(', ') + ').' : '') + '{/}'], 300);
      var others0 = R0.members.filter(function (u) { return u !== lead; });
      for (var k = 0; k < others0.length; k++) {
        var w = others0[k];
        if (w.hp > 0) { var path = D.Battle.route(w, meet2, false) || []; for (var s2 = 0; s2 < path.length && s2 < 12; s2++) { if (path[s2][0] === meet2[0] && path[s2][1] === meet2[1]) break; yield* R.step(B, w, path[s2]); } }
        else FX.sparkle(w, 'glow', 12);
      }
      if (grp && grp.flag) R0.flags[grp.flag] = 1; // (what is dead stays dead: an ooze's flag, as the 8-bit's)
      if (grp && grp.trig) [].concat(grp.trig).forEach(function (id) { R0.spent[id] = 1; });
    }
    var others = R0.members.filter(function (u) { return u !== lead; });
    R0.token = lead; R0.rest = others; R0.mode = 'walk';
    R.into(B, others);
    FX.ring(lead, 'glow', 22); D.sfx('popup');
    lead.anim = 'idle'; lead.animT = B.t;
    B.focus(lead);
    yield 20;
    if (g2) g2.t = B.t; // (their hold starts when the party can move again, not during the gather's beat)
  };

  // what the fight left burning on the floor -- a torch dropped for a two-handed swing or thrown, a lantern set down -- is taken up as they gather: back
  // in the hand that held it if it is free, else the first free hand, else the pack (the test's 24-fight batch found it: Barley's torch burned on at the
  // fight's square, and the party walked on in the dark)
  R.takeUpLights = function (B) {
    var R0 = B.roam, C = R0.cut, back = [];
    var inside = function (l) { return C && l.x >= C.win.x0 && l.x <= C.win.x1 && l.y >= C.win.y0 && l.y <= C.win.y1; };
    B.lights = (B.lights || []).filter(function (l) {
      if (l.kind !== 'torch' && l.kind !== 'lantern') return true;
      var owner = R0.members.filter(function (u) { return u.id === l.by; })[0];
      if (!owner && !inside(l)) return true;
      var t = l.kind === 'lantern' ? L.make(l.item || 'lantern', l.hood) : { lit: true, kind: 'torch' };
      var hand = [owner].concat(R0.members).filter(function (u) { return u && u.hp > 0 && !u.torch && L.handForLight(u); })[0];
      if (hand) { hand.torch = t; L.regrip(hand); back.push(hand.name); }
      else { var id = l.kind === 'lantern' ? (l.item || 'lantern') : 'torch', s = (B.inv || []).filter(function (x) { return x.id === id; })[0]; if (s) s.n++; else (B.inv = B.inv || []).push({ id: id, n: 1 }); back.push('the pack'); }
      return false;
    });
    return back;
  };

  // ------------------------------------------------------------------ the menu out of a fight (ui.js gridHost's hooks): what the 8-bit's field menu does, on the grid's units
  // a light taken up in that hero's hand (one each, as on the grid), a potion drunk, a kit on one who is down; spells and skills out of a fight are the 8-bit's
  R.menuAct = function (B, kind, a, unitOf) {
    var R0 = B.roam, it = a && a.id ? window.DS.DATA.items[a.id] : null, u = a && a.h ? unitOf(a.h) : null;
    var take = function () { var s = (B.inv || []).filter(function (x) { return x.id === a.id; })[0]; if (s) s.n--; };
    if (kind === 'item' && it && it.use) {
      var who = u || R0.token, eff = it.use.effect;
      if (eff === 'light') {
        if (who.torch) { B.card(['{g}' + who.name + ' has a light in hand already.{/}'], 160); return true; }
        who.torch = a.id === 'torch' ? { lit: true, kind: 'torch' } : L.make(a.id, false); L.regrip(who); take(); D.sfx('confirm');
        B.card(['{y}' + who.name + '{/} takes up the ' + it.name + ', lit.'], 200); return true;
      }
      if (eff === 'heal') {
        if (!u || u.hp <= 0) { B.card(['{g}' + (u ? u.name + ' is down: a kit first.' : 'Whom?') + '{/}'], 160); return true; }
        var hn = D.roll(it.use.dice).total, was = u.hp; u.hp = Math.min(u.maxhp, u.hp + hn); take(); D.sfx('heal');
        B.card(['{y}' + u.name + '{/} drinks the ' + it.name + ': +' + (u.hp - was) + ' HP (' + u.hp + '/' + u.maxhp + ').'], 220); return true;
      }
      if (eff === 'revive') {
        if (!u || u.hp > 0) { B.card(['{g}' + (u ? u.name + ' is not down.' : 'Whom?') + '{/}'], 160); return true; }
        u.hp = it.use.hp || 1; u.ko = false; take(); D.sfx('heal'); B.card(['{y}' + u.name + '{/} is up (' + u.hp + ' HP).'], 200); return true;
      }
      B.card(['{g}' + it.name + ': not out of a fight in the test.{/}'], 200); return true;
    }
    if (kind === 'light-off' && u && u.torch) {
      var lt = u.torch, id = L.kindOf(lt) === 'lantern' ? (lt.item || 'lantern') : null; delete u.torch; L.regrip(u);
      if (id) { var s2 = (B.inv || []).filter(function (x) { return x.id === id; })[0]; if (s2) s2.n++; else (B.inv = B.inv || []).push({ id: id, n: 1 }); }
      B.card(['{y}' + u.name + '{/} ' + (id ? 'puts the lantern away.' : 'puts the torch out (spent).')], 200); return true;
    }
    if (kind === 'cast' || kind === 'skill') { B.card(['{g}Spells and skills out of a fight are the 8-bit\'s: not in the test.{/}'], 220); return true; }
    return false;
  };
  // after the menu: each hero's gear read again off the sheet EQUIP changed (battle.js swapGear's own lines: the weapon in hand, the attacks, the AC and Mage Armor)
  R.regear = function (B) {
    var Rr = window.DS.R;
    B.roam.members.forEach(function (u) {
      var h = u.src; if (!h || !h.equip) return;
      var n = D.save.unitOf(h, !!u.guest, B.fight);
      ['offhand', 'displacement', 'resist', 'immune', 'condImmune', 'saves', 'attacksBase', 'crit', 'spellDC', 'spellAtk', 'stealth', 'perception'].forEach(function (k) { if (n[k] !== undefined) u[k] = n[k]; });
      delete u.sheathed; u.weapon = D.save.weaponOf(h); u.attacks = u.weapon.loading ? 1 : u.attacksBase;
      if (Rr.armored(h) && u.conds.mageArmor) delete u.conds.mageArmor;
      var ac = Rr.ac(h); if (u.conds.mageArmor && !Rr.armored(h)) ac = Math.max(ac, 13 + D.mod(u.abil.dex));
      u.baseAC = ac; u.armored = Rr.armored(h);
      L.regrip(u);
    });
  };
  // the token carries the whole party's lights and eyes (10-13, his play: the torch went to Aurdin, inside the token, and the floor went dark round Barley): what
  // lights the floor (js/light.js L.all) and what the player sees greyed (L.partyMap) count the four riding in it as standing on its square
  R.riding = function (B) { var R0 = B && B.roam; return R0 && R0.mode !== 'fight' && R0.mode !== 'order' && R0.rest.length ? R0 : null; };
  var all0 = L.all;
  L.all = function (B) {
    var out = all0.apply(this, arguments), R0 = R.riding(B); if (!R0) return out;
    var t = R0.token;
    R0.rest.forEach(function (u) { var x0 = u.x, y0 = u.y; u.x = t.x; u.y = t.y; L.carried(u).forEach(function (l) { out.push(l); }); u.x = x0; u.y = y0; });
    return out;
  };
  var pm0 = L.partyMap;
  L.partyMap = function (B) {
    var R0 = R.riding(B); if (!R0) return pm0.apply(this, arguments);
    var t = R0.token, keep = R0.rest.map(function (u) { return [u, u.x, u.y]; }), U = B.units;
    R0.rest.forEach(function (u) { u.x = t.x; u.y = t.y; });
    B.units = U.concat(R0.rest.filter(function (u) { return U.indexOf(u) < 0; }));
    try { return pm0.apply(this, arguments); } finally { B.units = U; keep.forEach(function (k) { k[0].x = k[1]; k[0].y = k[2]; }); }
  };

  // ------------------------------------------------------------------ ORDER's floor (Griz, 10-13: "Show viable locations and map the combat select in the 16grid 'order'
  // function, where rightclick shows the ordering in different facings" · "like a box around legit places to stand for party marching order"): the box two
  // squares round the leader, its legit squares lit as a move's are -- open, free, and a short walk from the leader (no slot behind a wall) -- the one picked
  // outlined in gold, the square under the mouse green where it may go and red where not, and a gold mark on the side the token faces
  R.FACE8 = { '-1,0': 'north', '1,0': 'south', '0,-1': 'east', '0,1': 'west' }; // (the 8-bit's compass: the grid is turned a quarter counter-clockwise)
  R.faceName = function (fw) { return R.FACE8[fw[0] + ',' + fw[1]] || 'ahead'; };
  R.nearLeader = function (B) {
    var t = B.roam.token, k = t.x + ',' + t.y + ':' + B.t;
    if (!R._near || R._near.k !== k) R._near = { k: k, d: R.flood(t, [t.x, t.y], 3) };
    return R._near.d;
  };
  R.legit = function (B, u, x, y) {
    var t = B.roam.token;
    if (Math.max(Math.abs(x - t.x), Math.abs(y - t.y)) > 2 || (x === t.x && y === t.y)) return false;
    return R.nearLeader(B)[x + ',' + y] != null && G.canStand(u, x, y);
  };
  // under the figures: the legit squares filled (an occupied one fainter); over the light (R.marksOver): the box's edge, the facing mark, the one picked, the mouse
  R.floorMarks = function (c, B) {
    var R0 = B.roam; if (!R0 || R0.mode !== 'order') return;
    var t = R0.token, who = R0.sel || R0.rest[0] || t, iso = D.iso;
    for (var y = t.y - 2; y <= t.y + 2; y++) for (var x = t.x - 2; x <= t.x + 2; x++) {
      var occ = R0.rest.some(function (u) { return u.x === x && u.y === y; });
      if (!R.legit(B, who, x, y) && !occ) continue;
      iso.rhombus(c, x, y, 0, 1); c.globalAlpha = occ ? 0.18 : 0.32; c.fillStyle = 'rgb(150,210,255)'; c.fill(); c.globalAlpha = 1;
    }
  };
  R.marksOver = function (c, B) {
    var R0 = B.roam; if (!R0) return;
    // a hero's ways out over the light (in the pane, 10-13: the grid's pale squares are drawn under the dark, and on the Wet's dark floor they were gone)
    if (R0.mode === 'fight' && B.req && B.req.turn) { (B.exits || []).forEach(function (q) { D.iso.rhombus(c, q[0], q[1], G.map.gz(q[0], q[1]), 2); c.strokeStyle = 'rgba(150,235,150,0.9)'; c.lineWidth = 1.5; c.stroke(); c.lineWidth = 1; }); return; }
    if (R0.mode !== 'order') return;
    var t = R0.token, who = R0.sel || R0.rest[0] || t, iso = D.iso;
    var wp = function (gx, gy) { return iso.toScreen((gx - gy) * iso.TW / 2, (gx + gy) * iso.TH / 2); };
    for (var y = t.y - 2; y <= t.y + 2; y++) for (var x = t.x - 2; x <= t.x + 2; x++) {
      if (!R.legit(B, who, x, y) && !R0.rest.some(function (u) { return u.x === x && u.y === y; })) continue;
      iso.rhombus(c, x, y, 0, 2); c.globalAlpha = 0.75; c.strokeStyle = 'rgb(150,210,255)'; c.lineWidth = 1; c.stroke(); c.globalAlpha = 1;
    }
    var a = wp(t.x - 2, t.y - 2), b = wp(t.x + 3, t.y - 2), d = wp(t.x + 3, t.y + 3), e = wp(t.x - 2, t.y + 3);
    c.strokeStyle = 'rgba(232,208,112,1)'; c.lineWidth = 2; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(d.x, d.y); c.lineTo(e.x, e.y); c.closePath(); c.stroke(); c.lineWidth = 1;
    // the way it faces: a gold mark just past the box's front edge
    var fx = t.x + R0.fw[0] * 3, fy = t.y + R0.fw[1] * 3; iso.rhombus(c, fx, fy, 0, 6); c.fillStyle = 'rgba(232,208,112,0.95)'; c.fill();
    if (R0.sel) { iso.rhombus(c, R0.sel.x, R0.sel.y, 0, 2); c.strokeStyle = '#ffe080'; c.lineWidth = 2; c.stroke(); c.lineWidth = 1; }
    var hv = R0.hover;
    if (hv) {
      var onOne = R0.rest.some(function (u) { return u.x === hv.x && u.y === hv.y; }), okH = onOne || (R0.sel && (R.legit(B, R0.sel, hv.x, hv.y) || (hv.x === t.x && hv.y === t.y)));
      iso.rhombus(c, hv.x, hv.y, 0, 2); c.strokeStyle = okH ? 'rgb(120,230,120)' : 'rgb(240,90,80)'; c.lineWidth = 2; c.stroke(); c.lineWidth = 1;
    }
  };

  // ------------------------------------------------------------------ ORDER in token mode: out round the lead, moved, back in (out of a fight only)
  R.order = function* (B) {
    var R0 = B.roam, t = R0.token, sel = null;
    R0.mode = 'order'; R0.clicks = []; R0.keys = [];
    var spill = R.spill(B, {});
    B.card(['{y}ORDER{/}: the formation round ' + t.name + ', facing ' + R.faceName(R0.fw) + '.', '{g}Click one of them, then a lit square in the box -- or the leader, to put that one in front. Right click: the next facing. O or M ORDER when done.{/}'], 100000, 'roamorder');
    while (true) {
      var k = R0.keys.shift();
      if (k === 'order') break;
      if (k === 'turn') {
        // the next facing, a quarter turn clockwise: the order kept as it stands, each of them to its slot that way (the nearest open square where one is taken)
        // (the formation as he set it is kept, not where each stands: a slot taken on this floor puts that one on the nearest open square for now)
        R0.fw = [-R0.fw[1], R0.fw[0]]; R0.token.facing = D.spr.facingFor(R0.fw[0], R0.fw[1]);
        var tk0 = R0.token, placed0 = {}; placed0[tk0.x + ',' + tk0.y] = 1;
        R0.rest.forEach(function (u) {
          var sl = R.slot(R0, u), best = null, bd = Infinity;
          for (var yy = tk0.y - 2; yy <= tk0.y + 2; yy++) for (var xx = tk0.x - 2; xx <= tk0.x + 2; xx++) {
            if (placed0[xx + ',' + yy] || !R.legit(B, u, xx, yy)) continue;
            var dd = Math.max(Math.abs(xx - sl[0]), Math.abs(yy - sl[1])) + 0.01 * Math.hypot(xx - sl[0], yy - sl[1]); if (dd < bd) { bd = dd; best = [xx, yy]; }
          }
          if (!best) return;
          placed0[best[0] + ',' + best[1]] = 1; u.tween = { fx: u.x, fy: u.y, fz: 0, t: 0, dur: 8, mode: null }; u.x = best[0]; u.y = best[1]; u.facing = tk0.facing;
        });
        G.setup(G.map, B.units); D.sfx('confirm'); sel = null; R0.sel = null;
        B.cards = B.cards.filter(function (c) { return c.id !== 'roamorder'; });
        B.card(['{y}ORDER{/}: facing ' + R.faceName(R0.fw) + '.', '{g}Click one of them, then a lit square in the box -- or the leader, to put that one in front. Right click: the next facing. O or M ORDER when done.{/}'], 100000, 'roamorder');
        continue;
      }
      var ck = R0.clicks.shift();
      t = R0.token;
      if (ck) {
        var sq = D.iso.pick(ck.x, ck.y, 0);
        if (sq) {
          var who = R0.rest.filter(function (u) { return u.x === sq.x && u.y === sq.y; })[0];
          if (who) { sel = who; R0.sel = who; D.sfx('confirm'); }
          else if (sel && sq.x === t.x && sq.y === t.y) {
            // the front man changed: the one picked takes the leader's square and becomes the token, the old leader steps to its place (the 8-bit's ORDER: the first leads)
            var ox = sel.x, oy = sel.y;
            sel.tween = { fx: sel.x, fy: sel.y, fz: 0, t: 0, dur: 6, mode: null }; t.tween = { fx: t.x, fy: t.y, fz: 0, t: 0, dur: 6, mode: null };
            sel.x = t.x; sel.y = t.y; sel.facing = t.facing; t.x = ox; t.y = oy;
            R0.token = sel; R0.members = [sel].concat(R0.members.filter(function (u) { return u !== sel; })); R0.rest = R0.members.slice(1);
            R0.form[t.id] = R.toForm(R0, t); delete R0.form[sel.id];
            sel = null; R0.sel = null; G.setup(G.map, B.units); D.sfx('confirm');
            B.cards = B.cards.filter(function (c) { return c.id !== 'roamorder'; });
            B.card(['{y}ORDER{/}: ' + R0.token.name + ' leads now.', '{g}Click one of them, then a square within two of the leader -- or the leader, to put that one in front. O or M ORDER when done.{/}'], 100000, 'roamorder');
          }
          else if (sel && R.legit(B, sel, sq.x, sq.y)) {
            sel.tween = { fx: sel.x, fy: sel.y, fz: 0, t: 0, dur: 6, mode: null }; sel.x = sq.x; sel.y = sq.y; R0.form[sel.id] = R.toForm(R0, sel); G.setup(G.map, B.units); D.sfx('confirm');
          } else D.sfx('miss');
        }
      }
      yield 1;
    }
    var form = D.store.get(R.KEY) || {};
    R0.rest.forEach(function (u) { if (R0.form[u.id]) form[u.id] = R0.form[u.id]; }); // (what was set -- each move, the front man's swap -- not a stand-in square)
    form._order = R0.members.map(function (u) { return u.id; }); delete form[R0.token.id]; // (and who leads: the first)
    D.store.set(R.KEY, form);
    B.cards = B.cards.filter(function (c) { return c.id !== 'roamorder'; });
    for (var i = 0; i < R0.rest.length; i++) FX.sparkle(R0.rest[i], 'glow', 8);
    R.into(B, R0.rest); R0.sel = null; R0.mode = 'walk';
    B.card(['{g}The formation is kept.{/}'], 160);
    yield 10;
  };

  // ------------------------------------------------------------------ the floor map (L): every square at `s` px, north (the grid's) up -- rock, floor, water, a bridge;
  // while a fight is on, what the party saw from the token when it fell (light: seen lit, grey: seen by darkvision only), the ground's box, its ways out
  // (green), the four (blue, the token white) and the foes (red)
  R.MAPCOL = { '#': '#15131c', '.': '#4a4650', '~': '#24456a', D: '#1a3456', '=': '#7a5a34', y: '#5a3a1a', P: '#2a2630', k: '#5a4630' };
  R.paintMap = function (ctx, B, x0, y0, s) {
    var R0 = B.roam, m = G.map, C = R0.cut, sv = C || R0.mode === 'fight' ? R0.sightV : null;
    ctx.save(); ctx.globalAlpha = 0.92; ctx.fillStyle = '#05040a'; ctx.fillRect(x0 - 2, y0 - 2, m.w * s + 4, m.h * s + 4);
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
      var q = m.at(x, y), col = R.MAPCOL[q.ch] || (q.open ? '#4a4650' : '#15131c');
      ctx.fillStyle = col; ctx.fillRect(x0 + x * s, y0 + y * s, s, s);
      if (sv && q.open && sv[y * m.w + x]) { ctx.fillStyle = sv[y * m.w + x] === 2 ? 'rgba(255,220,140,0.45)' : 'rgba(200,200,220,0.25)'; ctx.fillRect(x0 + x * s, y0 + y * s, s, s); }
    }
    if (C) { ctx.strokeStyle = '#e8d070'; ctx.lineWidth = 1; ctx.strokeRect(x0 + C.win.x0 * s + 0.5, y0 + C.win.y0 * s + 0.5, C.win.w * s - 1, C.win.h * s - 1); }
    ctx.fillStyle = '#60e070'; (B.exits || []).forEach(function (q) { ctx.fillRect(x0 + q[0] * s + 1, y0 + q[1] * s + 1, s - 2, s - 2); }); // (the ways out of the one whose turn it is)
    B.units.forEach(function (u) {
      if (u.dead && !u.left) return;
      ctx.fillStyle = u.side === 'foe' ? '#ff5040' : u === R0.token ? '#ffffff' : '#60a0ff';
      var n = u.size || 1; ctx.fillRect(x0 + u.x * s, y0 + u.y * s, n * s, n * s);
    });
    ctx.restore();
  };

  // ------------------------------------------------------------------ the picture: the ground's edge while a fight is on, a line of help
  function corner(gx, gy) { var w = { x: (gx - gy) * D.iso.TW / 2, y: (gx + gy) * D.iso.TH / 2 }; return D.iso.toScreen(w.x, w.y); }
  R.paintOver = function (ctx, B) {
    var R0 = B.roam; if (!R0) return;
    var C = R0.cut;
    if (C) {
      var w = C.win, a = corner(w.x0, w.y0), b = corner(w.x1 + 1, w.y0), c = corner(w.x1 + 1, w.y1 + 1), d = corner(w.x0, w.y1 + 1);
      ctx.save(); ctx.strokeStyle = 'rgba(240,210,140,0.55)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.stroke(); ctx.restore();
    }
    if ((R0.mode === 'walk' || R0.mode === 'order') && !B.menu) {
      var z = R.zoneAt(B, R0.token.x, R0.token.y), p8 = R.def.to8(R0.token.x, R0.token.y);
      D.text(ctx, 'THE ROAM -- the Wet, ' + G.map.w + ' x ' + G.map.h + '   8-bit square ' + p8[0] + ',' + p8[1] + (z ? '   next fight in ' + R0.encIn + ' steps' : '   (no random fights here)'), 6, D.H - 30, '#e8d8a0');
      D.text(ctx, R0.mode === 'order' ? 'ORDER (facing ' + R.faceName(R0.fw) + '): click one, then a lit square, or the leader to lead -- right click turns -- O when done' : 'click: walk   arrows: step   O: formation   F: a fight now   L: the floor map' + (function () { var un = R.useNear(B); return un ? '   E: ' + (R.USE_NAME[un.trig.id] || un.trig.id) : ''; })(), 6, D.H - 20, '#9a94a8');
    }
    if (R.showMap) R.paintMap(ctx, B, D.W - G.map.w * 4 - 6, 22, 4);
    if (R0.mode === 'order' && R0.sel) { var s = D.iso.center(R0.sel.x, R0.sel.y, 0), p = D.iso.toScreen(s.x, s.y); ctx.strokeStyle = '#ffe080'; ctx.strokeRect(p.x - 8, p.y - 30, 16, 32); }
    if (R0.mode === 'over' && I.pressed('rec')) location.reload();
  };
})();
