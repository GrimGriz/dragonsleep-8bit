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
    webFloor: '.', dwarfFloor: '.', dwarfWall: '#', runeWall: '#', sealDoor: '#', drownStair: '~', ladder: '.', holeDown: '.', lantern: '#',
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
    var from8 = function (x, y, s) { return [y, W8 - (x + (s || 1))]; }, to8 = function (gx, gy) { return [W8 - 1 - gy, gx]; };
    var at8 = function (l) { return l.map(function (p) { return from8(p[0], p[1]); }); };
    D.MAPS.wetwhole = {
      name: 'The Wet', sub: 'the whole floor, walked as one token', dark: true, step: 10, deepWater: 'D~',
      lampAt: wet.lampAt, lights: wet.lights, noBurrowAt: wet.noBurrowAt, // (the Settling's own: the same squares on the same turn)
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
    var F = { map: 'wetwhole', foes: [], level: lvl, dark: !/[?&]lit\b/.test(q), entry: null };
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
    var lead = members[0], stored = D.store.get(R.KEY) || {};
    var R0 = B.roam = { token: lead, members: members, rest: members.slice(1), form: {}, fw: [-1, 0], mode: 'walk', steps: 0, encIn: 0, clicks: [], keys: [], flags: {}, fights: 0, log: [], last: null, cut: null, msg: null };
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
    B.menuCalm = function () { return (R0.mode === 'walk' || R0.mode === 'order') && !R0.approach; };
    B.menuUnits = function () { return B.menuCalm() ? R0.members : B.units; };
    B.menuOrder = function () { R0.keys.push('order'); };
    B.menuAct = function (kind, a, unitOf) { return R.menuAct(B, kind, a, unitOf); };
    B.menuClosed = function () { R.regear(B); };
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
  R.resetEnc = function (R0) { var Z = window.DS.DATA.encounters.warrens_d, r = (Z && Z.rate) || [18, 40]; return r[0] + D.rint(r[1] - r[0] + 1); };
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
      // the fight starts where they meet (R.tickApproach)
      if (R0.approach) {
        var ap = R.tickApproach(B);
        if (ap === 'engage') { var A0 = R0.approach; yield* R.engage(B, A0.foes, false, A0.why); continue; }
      }
      var k = R0.keys.shift();
      if (k === 'order') { if (R0.approach) { D.sfx('miss'); B.card(['{g}Not with them coming.{/}'], 120); } else yield* R.order(B); continue; }
      if (k === 'fight') { if (R0.approach) { var A1 = R0.approach; yield* R.engage(B, A1.foes, false, 'yours'); } else yield* R.encounter(B, 'asked'); continue; }
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
      var dir = I.held.up ? [-1, 0] : I.held.down ? [1, 0] : I.held.left ? [0, 1] : I.held.right ? [0, -1] : null; // (up is the 8-bit's north: the grid turned it to the upper left)
      if (dir) { var nx = t.x + dir[0], ny = t.y + dir[1]; R0.path = G.canStand(t, nx, ny) ? [[nx, ny]] : null; if (!R0.path) t.facing = D.spr.facingFor(dir[0], dir[1]); }
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
    if (trig) { R.dropApproach(B); yield* R.fire(B, trig, [t.x, t.y]); return 'trigger'; }
    if (R0.approach) return null; // (one group at a time: no count while one is coming)
    if (R.zoneAt(B, t.x, t.y)) {
      R0.encIn -= 1;
      if (R0.encIn <= 0) { R0.encIn = R.resetEnc(R0); yield* R.encounter(B, 'steps'); return 'fight'; }
    }
    return null;
  };

  // ------------------------------------------------------------------ the 8-bit's trigger squares on the floor
  R.triggerAt = function (B, x8, y8, on) {
    var R0 = B.roam;
    return (R.def.src8.triggers || []).filter(function (t) { var r = t.rect; return t.on === on && x8 >= r[0] && y8 >= r[1] && x8 < r[0] + r[2] && y8 < r[1] + r[3] && R.cond(t.cond, R0.flags) && !(t.once && R0.flags['trig:' + t.id]) && !R0.flags['done:' + t.id]; })[0] || null;
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
  R.WAKE = { jelly: 'jelly', jellyNorth: 'jelly', poolOoze: 'poolooze', landlordStep: 'rim' };
  R.fire = function* (B, trig, at) {
    var R0 = B.roam;
    if (trig.once) R0.flags['trig:' + trig.id] = 1;
    if (R.WAKE[trig.id]) { yield* R.pullIn(B, 'wet', trig, at); return; }
    if (trig.id === 'stair' || trig.id === 'mark') { yield* R.pullIn(B, 'keeper', trig, at); return; }
    if (trig.id === 'ooze') { yield* R.encounter(B, 'set', { list: ['grayooze'], at: at, why: 'The puddle by the path moves.' }); return; }
    B.card(['{y}' + trig.id + '{/}: the 8-bit\'s scene (' + trig.script + ') runs here.', '{g}(in the test only the Settling\'s squares, the drowned stair, the rune and the puddle ooze do anything){/}'], 300);
    D.sfx('popup'); yield 30;
  };

  // ------------------------------------------------------------------ a fight elsewhere, pulled in, and back
  R.pullIn = function* (B, which, trig, at) {
    var R0 = B.roam, done = null, hp = {};
    R0.members.forEach(function (u) { hp[u.id] = { hp: u.hp, ko: !!u.ko }; });
    var o = Object.assign({}, R.party0, { fightDef: null, fight: which === 'keeper' ? 'keeper' : 'wet', onDone: function (res) { done = res || 'out'; } });
    if (o.ladder) { delete o.ladder; o.data = D.save.fixture(Math.min(9, R.party0.level)); }
    if (which === 'keeper') o.start = trig.id === 'mark' ? 'rune' : 'ledge';
    else o.wake = R.WAKE[trig.id];
    var b = new D.Battle(o), e0 = b.enter;
    b.enter = function () {
      e0.apply(this, arguments);
      // the four as they walked: their hit points from the floor
      this.units.forEach(function (u) { var h = hp[u.id]; if (h && u.side === 'party') { u.hp = Math.min(u.maxhp, h.hp); if (u.hp <= 0) u.ko = true; } });
      // the Settling: the lead on the square of the trigger that fired, as the 8-bit's seam puts him (embed.at), the rest beside (js/wet.js)
      if (which === 'wet' && this.map.def.from8) {
        var p8 = R.def.to8(at[0], at[1]), g = this.map.def.from8(p8[0], p8[1]), ours = this.units.filter(function (u) { return u.side === 'party' && !u.riding; }), self = this;
        var taken = {}; this.units.forEach(function (u) { if (u.side !== 'party') taken[u.x + ',' + u.y] = 1; });
        ours.forEach(function (u, i) {
          var best = null, bd = Infinity;
          for (var y = g[1] - 3; y <= g[1] + 3; y++) for (var x = g[0] - 3; x <= g[0] + 3; x++) { var s = self.map.at(x, y); if (!s || !s.walk || taken[x + ',' + y]) continue; var d = Math.max(Math.abs(x - g[0]), Math.abs(y - g[1])) + (i ? 0.5 : 0) * (x === g[0] && y === g[1] ? 1 : 0); if (d < bd) { bd = d; best = [x, y]; } }
          if (best) { u.x = best[0]; u.y = best[1]; taken[best[0] + ',' + best[1]] = 1; }
        });
        G.setup(this.map, this.units);
      }
    };
    B.card(['{r}' + (which === 'keeper' ? 'THE KEEPER OF THE FLOODED STAIR' : 'THE SETTLING') + '{/}: its own fight, pulled in.'], 200);
    D.sfx('encounter'); yield 40;
    R.stats.pull = (R.stats.pull || 0) + 1;
    D.push(b);
    while (!done) yield 1; // (the floor waits under it: only the top scene runs -- js/core.js)
    // back on the floor: the four's hit points as the fight left them; the trigger spent if the fight was won
    D.battle = B; G.setup(B.map, B.units); D.iso.map = B.map;
    (b.units || []).forEach(function (u) { var w = R0.members.filter(function (m) { return m.id === u.id; })[0]; if (w) { w.hp = Math.max(0, u.hp); w.ko = w.hp <= 0; w.conds = {}; } });
    if (done === 'won') R0.flags['done:' + trig.id] = 1;
    if (which === 'wet' && done === 'won') ['jelly', 'jellyNorth', 'poolOoze', 'landlordStep'].forEach(function (id) { R0.flags['done:' + id] = 1; });
    if (which === 'keeper' && done === 'won') ['stair', 'mark'].forEach(function (id) { R0.flags['done:' + id] = 1; });
    B.focus(R0.token);
    B.card(['{y}Back on the Wet{/} (' + done + ').'], 200);
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
    var foes = p.list.map(function (kind, i) { var u = B.makeFoe({ id: 'roam' + R0.fights + '-' + i + '-' + kind, kind: kind }); u.anim = 'idle'; u.animT = B.t; u.reaction = 1; u.conds = u.conds || {}; return u; });
    // where: the party's sight decides it (above); a set fight (the puddle ooze) is where its square is
    var reach = R.flood(t, [t.x, t.y], 40), sight = R.sight(B), lurk = foes.some(function (u) { return R.LURK[u.kind]; }), spot = null, how = '';
    var cand = Object.keys(reach).map(function (k) { var a = k.split(','); return [+a[0], +a[1], reach[k]]; }).filter(function (q) { return !(q[0] === t.x && q[1] === t.y) && G.canStand(foes[0], q[0], q[1], { ghost: true }); });
    var ftOf = function (q) { return G.dist(t, { x: q[0], y: q[1], size: 1 }); };
    if (set && set.at) { spot = set.at; how = 'its own square'; }
    else if (lurk) {
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
    // the group round the spot, on squares the token could walk to, clear of each other (a big one's whole footing)
    var taken = {}; taken[t.x + ',' + t.y] = 1;
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
      placed.push(u);
    });
    var distFt = placed.length ? Math.min.apply(null, placed.map(function (u) { return G.dist(t, u); })) : 0;
    placed.forEach(function (u) { B.units.push(u); });
    G.setup(G.map, B.units);
    var ms = Math.round((window.performance || Date).now() - t0);
    var names = {}; placed.forEach(function (u) { var nm = B.shortName(u); names[nm] = (names[nm] || 0) + 1; });
    var who = Object.keys(names).map(function (k) { return (names[k] > 1 ? names[k] + ' ' : 'a ') + k + (names[k] > 1 ? 's' : ''); }).join(' and ');
    var sees = sight.lightBy ? sight.lightBy + ' ' + sight.lightFt + ' ft' : 'no light';
    if (sight.dv) sees += ', ' + sight.dvBy + '\'s darkvision ' + sight.dv + ' ft';
    R0.last = { why: why, who: who, kinds: placed.map(function (u) { return u.kind; }), spot: spot, distFt: distFt, how: how, sightFar: sight.far, lightFt: sight.lightFt, dv: sight.dv, lurk: lurk, ms: ms, at: [t.x, t.y] };
    R0.log.push(R0.last); R0.sightV = sight.v; // (the map's picture of what they saw: R.paintMap)
    D.sfx('encounter');
    B.focus(placed[0] || t);
    // lying in wait, or a square of its own: the fight is now. Walking in: the approach, the fight where they meet
    if (lurk || (set && set.at)) {
      B.card(['{r}ENCOUNTER{/}: ' + who + ', ' + how + ' -- ' + distFt + ' ft off.'], 300);
      yield 40;
      yield* R.engage(B, placed, lurk, why);
      return;
    }
    R0.approach = { foes: placed, why: why, t: B.t, rolled: false, seenAt: distFt };
    B.card(['{r}ENCOUNTER{/}: ' + who + ', ' + how + ' -- ' + distFt + ' ft off, and coming.', '{g}The party sees ' + sight.far + ' ft from here (' + sees + ').{/}', '{g}F: the fight now, at this range. Or walk: out of their sight, they may lose you.{/}'], 480);
    yield 30;
  };
  // the fight where they meet: the token's party out onto its formation, the ground cut round both sides, initiative
  R.engage = function* (B, foes, lurk, why) {
    var R0 = B.roam, t = R0.token, L0 = R0.last || {};
    R0.approach = null;
    foes = foes.filter(function (u) { return !u.dead && B.units.indexOf(u) >= 0; });
    if (!foes.length) return;
    foes.forEach(function (u) { u.facing = D.spr.facingFor(t.x - u.x, t.y - u.y); u.anim = 'idle'; u.animT = B.t; });
    L0.contactFt = Math.min.apply(null, foes.map(function (u) { return G.dist(t, u); })); L0.started = why;
    // the spill: the token's party out onto their formation, as near as the floor allows
    L0.spill = R.spill(B, {});
    // the ground: both sides, a margin, the floor's open edges past it the ways out
    var win = L0.win = R.cutGround(B, R.PAD); L0.exits = B.exits.length; L0.ways = win.ways;
    B.card(['{r}THE FIGHT{/}: ' + L0.contactFt + ' ft between them' + (why === 'yours' ? ' -- yours to open' : '') + '.', '{g}The ground: ' + win.w + ' x ' + win.h + ' squares, ' + win.ways + ' way' + (win.ways === 1 ? '' : 's') + ' out (' + B.exits.length + ' pale squares on its edge).{/}'], 420);
    yield 50;
    var o = yield* R.fight(B, foes, lurk);
    yield* R.after(B, o);
  };
  // the approach, each time the script looks (a frame, or a step's eight): each of them walks at its speed, the token's walking pace for 30 ft; the
  // fight when one comes within its own reach and a move of the token; out of all their sight, the party's Stealth (a group check: half of them) against
  // their best passive Perception, once a break -- lost, they go
  R.tickApproach = function (B) {
    var R0 = B.roam, A = R0.approach, t = R0.token, dt = B.t - A.t; A.t = B.t;
    var live = A.foes.filter(function (u) { return !u.dead && B.units.indexOf(u) >= 0; });
    if (!live.length) { R0.approach = null; return null; }
    if (dt > 0) live.forEach(function (u) {
      var sp = Math.max(u.speed || 30, (u.fly || 0));
      u.racc = (u.racc || 0) + dt * (sp / 30) / STEP;
      while (u.racc >= 1) {
        u.racc -= 1;
        var path = D.Battle.route(u, [t.x, t.y], false), nx = path && path[0];
        if (!nx || (nx[0] === t.x && nx[1] === t.y) || !G.canStand(u, nx[0], nx[1])) { u.racc = 0; break; }
        u.tween = { fx: u.x, fy: u.y, fz: 0, t: 0, dur: STEP, mode: null }; u.facing = D.spr.facingFor(nx[0] - u.x, nx[1] - u.y);
        if (u.anim !== 'walk') { u.anim = 'walk'; u.animT = B.t; }
        u.x = nx[0]; u.y = nx[1];
      }
    });
    if (live.some(function (u) { return G.dist(u, t) <= (u.reach || 5) + Math.max(u.speed || 30, u.fly || 0); })) return 'engage';
    var seen = live.some(function (u) { return G.losPoint(u.x, u.y, t.x, t.y) && L.seesBy(B, u, t).ok; });
    if (seen) { A.rolled = false; return null; }
    if (A.rolled) return null;
    A.rolled = true;
    var pp = Math.max.apply(null, live.map(function (u) { return u.perception || 10; })), ok = 0, lines = [];
    R0.members.filter(function (u) { return u.hp > 0; }).forEach(function (u) { var r = D.d(20) + (u.stealth || 0); if (r >= pp) ok++; lines.push(u.name + ' ' + r); });
    var n = R0.members.filter(function (u) { return u.hp > 0; }).length, got = ok * 2 >= n;
    B.card(['{y}OUT OF THEIR SIGHT{/}: the party\'s Stealth against their passive Perception ' + pp + ' (' + lines.join(', ') + ')', got ? '{n}They lose you.{/}' : '{o}They heard you: still coming.{/}'], 360);
    if (got) R.dropApproach(B);
    return got ? 'lost' : null;
  };
  R.dropApproach = function (B) {
    var R0 = B.roam, A = R0.approach; if (!A) return;
    B.units = B.units.filter(function (u) { return A.foes.indexOf(u) < 0; }); G.setup(G.map, B.units); B.cache = null;
    R0.approach = null;
  };

  // the spill: each of the rest from the token onto its formation slot, or the nearest square the token can walk to (not through a wall,
  // not where anyone stands); the fallen are laid on theirs. Returns where each went, and how far off its slot
  R.spill = function (B, taken) {
    var R0 = B.roam, t = R0.token, reach = R.flood(t, [t.x, t.y], 8), out = [];
    taken = Object.assign({}, taken);
    B.units.forEach(function (w) { taken[w.x + ',' + w.y] = 1; });
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
  // the ground: the box round everyone standing on the floor and `pad` squares past it, clipped to the floor; outside it nothing walks for the
  // fight. A way out is an open square on its edge with open floor beyond it, outside the box (the way goes on), or a door of the floor's inside it
  R.cutGround = function (B, pad) {
    var m = G.map, xs = [], ys = [];
    B.units.forEach(function (u) { if (u.dead) return; G.foot(u).forEach(function (q) { xs.push(q[0]); ys.push(q[1]); }); });
    var w0 = { x0: Math.max(0, Math.min.apply(null, xs) - pad), y0: Math.max(0, Math.min.apply(null, ys) - pad), x1: Math.min(m.w - 1, Math.max.apply(null, xs) + pad), y1: Math.min(m.h - 1, Math.max.apply(null, ys) + pad) };
    w0.w = w0.x1 - w0.x0 + 1; w0.h = w0.y1 - w0.y0 + 1;
    var inside = function (x, y) { return x >= w0.x0 && x <= w0.x1 && y >= w0.y0 && y <= w0.y1; }, cut = [];
    m.sq.forEach(function (s) { if (!inside(s.x, s.y) && s.walk) { s.walk = false; s.roamCut = true; cut.push(s); } });
    var ex = [];
    for (var y = w0.y0; y <= w0.y1; y++) for (var x = w0.x0; x <= w0.x1; x++) {
      if (!(x === w0.x0 || x === w0.x1 || y === w0.y0 || y === w0.y1)) continue;
      var s = m.at(x, y); if (!s || !s.walk) continue;
      var on = false;
      for (var dy = -1; dy <= 1 && !on; dy++) for (var dx = -1; dx <= 1 && !on; dx++) { var s2 = m.at(x + dx, y + dy); if (s2 && !inside(s2.x, s2.y) && s2.roamCut) on = true; }
      if (on) ex.push([x, y]);
    }
    (m.def.doors || []).forEach(function (d) { if (inside(d[0], d[1]) && !ex.some(function (q) { return q[0] === d[0] && q[1] === d[1]; })) ex.push(d.slice()); });
    // the ways out counted as openings: exit squares that touch make one way (a passage's mouth, a stretch of open cave)
    var seen = {}, ways = 0;
    ex.forEach(function (q) {
      var k0 = q[0] + ',' + q[1]; if (seen[k0]) return; ways++; seen[k0] = 1; var st = [q];
      while (st.length) { var c = st.pop(); ex.forEach(function (e) { var k = e[0] + ',' + e[1]; if (!seen[k] && Math.max(Math.abs(e[0] - c[0]), Math.abs(e[1] - c[1])) <= 1) { seen[k] = 1; st.push(e); } }); }
    });
    w0.ways = ways;
    B.exits = ex; B.cache = null;
    B.roam.cut = { win: w0, cut: cut };
    return w0;
  };
  R.uncut = function (B) {
    var C = B.roam.cut; if (!C) return;
    C.cut.forEach(function (s) { s.walk = true; delete s.roamCut; });
    B.roam.cut = null; B.exits = []; B.cache = null;
  };

  // one fight on the cut ground: initiative, the rounds (js/waves.js fight, the Game Show's, is this loop), its end by Battle.over
  R.fight = function* (B, foes, lurk) {
    var R0 = B.roam; R0.mode = 'fight'; B.cine = false;
    B.round = 0; B.active = null; B.mpHiveDone = {};
    var rolls = B.units.filter(function (u) { return !u.familiar && !u.object && !u.look && !u.dead; });
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
    while (true) {
      B.round++;
      if (B.round > 40) { B.units.forEach(function (u) { if (u.side === 'foe' && !u.dead) { u.left = true; u.dead = true; } }); B.card(['{g}The rest of them slink back into the dark.{/}'], 300); yield 40; return 'won'; }
      for (var i = 0; i < B.order.length; i++) {
        var u = B.order[i];
        if (u.dead || u.away) continue;
        B.active = u;
        if (u.side === 'party' && !u.guest && !u.ally) yield* B.heroTurn(u);
        else yield* D.ai.turn(B, u);
        B.active = null;
        if (B.readyArmed && B.readyArmed()) yield* B.readyAfter({ turnOf: u });
        if (D.familiar && !u.familiar) yield* D.familiar.after(B, u);
        B.sweep();
        var o = B.over();
        if (o) return o;
        i = B.order.indexOf(u);
      }
    }
  };
  // and after: the foes off the floor, the ground given back, the party into the first of them still standing (the fallen carried in)
  R.after = function* (B, o) {
    var R0 = B.roam;
    B.order = []; B.active = null; B.cine = true; B.req = null;
    if (o === 'lost') {
      R0.mode = 'over'; D.sfx('error');
      B.card(['{r}The party has fallen in the Wet.{/}  R to walk it again.'], 100000);
      return;
    }
    var outBy = R0.members.filter(function (u) { return u.left; })[0];
    var took = R.takeUpLights(B);
    B.units = B.units.filter(function (u) { return u.side === 'party' && !u.summon && !u.object; });
    R0.members.forEach(function (u) { if (u.left) { u.left = false; u.dead = false; } delete u.conds.surprised; delete u.conds.hidden; u.turn = null; if (B.units.indexOf(u) < 0) B.units.push(u); });
    R.uncut(B);
    G.setup(G.map, B.units);
    var up = R.standing(R0), lead = up[0];
    if (!lead) { R0.mode = 'over'; return; }
    var meet = o === 'escaped' && outBy ? [outBy.x, outBy.y] : [lead.x, lead.y];
    B.card([o === 'escaped' ? '{y}Away{/}: the party gets clear of them.' : '{y}The way is clear.{/}', '{g}The party gathers into ' + lead.name + '.' + (took.length ? ' The light on the floor is taken up (' + took.join(', ') + ').' : '') + '{/}'], 300);
    // into one square: each walks to it and is gone into it; one down is carried in (a glow where it lay)
    lead.x = meet[0]; lead.y = meet[1];
    var others = R0.members.filter(function (u) { return u !== lead; });
    for (var i = 0; i < others.length; i++) {
      var u = others[i];
      if (u.hp > 0) { var path = D.Battle.route(u, meet, false) || []; for (var s = 0; s < path.length && s < 12; s++) { if (path[s][0] === meet[0] && path[s][1] === meet[1]) break; yield* R.step(B, u, path[s]); } }
      else FX.sparkle(u, 'glow', 12);
    }
    R0.token = lead; R0.rest = others; R0.mode = 'walk';
    R.into(B, others);
    FX.ring(lead, 'glow', 22); D.sfx('popup');
    lead.anim = 'idle'; lead.animT = B.t;
    B.focus(lead);
    yield 20;
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

  // ------------------------------------------------------------------ ORDER in token mode: out round the lead, moved, back in (out of a fight only)
  R.order = function* (B) {
    var R0 = B.roam, t = R0.token, sel = null;
    R0.mode = 'order'; R0.clicks = []; R0.keys = [];
    var spill = R.spill(B, {});
    B.card(['{y}ORDER{/}: the formation round ' + t.name + ' (facing the way the token walked).', '{g}Click one of them, then a square within two of the leader -- or the leader, to put that one in front. O or M ORDER when done.{/}'], 100000, 'roamorder');
    while (true) {
      var k = R0.keys.shift();
      if (k === 'order') break;
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
          else if (sel && Math.max(Math.abs(sq.x - t.x), Math.abs(sq.y - t.y)) <= 2 && G.canStand(sel, sq.x, sq.y)) {
            sel.tween = { fx: sel.x, fy: sel.y, fz: 0, t: 0, dur: 6, mode: null }; sel.x = sq.x; sel.y = sq.y; G.setup(G.map, B.units); D.sfx('confirm');
          } else D.sfx('miss');
        }
      }
      yield 1;
    }
    var form = D.store.get(R.KEY) || {};
    R0.rest.forEach(function (u) { R0.form[u.id] = R.toForm(R0, u); form[u.id] = R0.form[u.id]; });
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
    var R0 = B.roam, m = G.map, C = R0.cut, sv = C ? R0.sightV : null;
    ctx.save(); ctx.globalAlpha = 0.92; ctx.fillStyle = '#05040a'; ctx.fillRect(x0 - 2, y0 - 2, m.w * s + 4, m.h * s + 4);
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
      var q = m.at(x, y), col = R.MAPCOL[q.ch] || (q.open ? '#4a4650' : '#15131c');
      ctx.fillStyle = col; ctx.fillRect(x0 + x * s, y0 + y * s, s, s);
      if (sv && q.open && sv[y * m.w + x]) { ctx.fillStyle = sv[y * m.w + x] === 2 ? 'rgba(255,220,140,0.45)' : 'rgba(200,200,220,0.25)'; ctx.fillRect(x0 + x * s, y0 + y * s, s, s); }
    }
    if (C) {
      ctx.strokeStyle = '#e8d070'; ctx.lineWidth = 1; ctx.strokeRect(x0 + C.win.x0 * s + 0.5, y0 + C.win.y0 * s + 0.5, C.win.w * s - 1, C.win.h * s - 1);
      ctx.fillStyle = '#60e070'; B.exits.forEach(function (q) { ctx.fillRect(x0 + q[0] * s + 1, y0 + q[1] * s + 1, s - 2, s - 2); });
    }
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
      D.text(ctx, R0.mode === 'order' ? 'ORDER: click one, then a square near the leader -- O when done' : 'click: walk   arrows: step   O: formation   F: a fight now   L: the floor map', 6, D.H - 20, '#9a94a8');
    }
    if (R.showMap) R.paintMap(ctx, B, D.W - G.map.w * 4 - 6, 22, 4);
    if (R0.mode === 'order' && R0.sel) { var s = D.iso.center(R0.sel.x, R0.sel.y, 0), p = D.iso.toScreen(s.x, s.y); ctx.strokeStyle = '#ffe080'; ctx.strokeRect(p.x - 8, p.y - 30, 16, 32); }
    if (R0.mode === 'over' && I.pressed('rec')) location.reload();
  };
})();
