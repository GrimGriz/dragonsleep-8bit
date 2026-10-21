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
    stairsUp: '.', stairsDown: '.', bridgeV: '=', bridgeH: '=', dryStair: '.', sealCut: '.', stain: '.', steps: '.', puddle: '.', ironBars: '#',
    dirt: ',', grass: 'g', tree: 'T', road: ',', dirtpath: ',', cobble: ',', water: 'D', fence: 'f', well: 'w', crate: 'k', cliff: '#',
    mountain: '#', range: '#', void: '#', web: '.', cocoon: 'c', tent: '#', wall: '#', wallWin: '#', door: '.', flatstone: '.', reeds: 'g'
  };
  // and the map's flag tiles over them as the 8-bit lays them by its flags (js/world.js DS.applyFlagTiles; 10-14, Griz: "Roam the Wet going to need post-stair drain version",
  // and "this is how we'll be doing all the dwarf road and stuff after, so we do it all and do it right": the drained stair's dry steps, the cut seal, the stain, the bars)
  R.rows8 = function (M8, flags) {
    var rows = M8.rows.map(function (row) { var o = ''; for (var i = 0; i < row.length; i++) { var t = R.TILE[M8.legend[row.charAt(i)]]; o += t != null ? t : '#'; } return o; });
    (M8.flagTiles || []).forEach(function (ft) { if (!R.cond(ft.cond, flags || {}) || !rows[ft.y] || ft.x >= rows[ft.y].length) return; var t = R.TILE[ft.tile]; rows[ft.y] = rows[ft.y].slice(0, ft.x) + (t != null ? t : '#') + rows[ft.y].slice(ft.x + 1); });
    return rows;
  };
  // which of the map's flag tiles stand (the floor is built for them: a scene that changes them -- the stair held, the water back -- opens the floor again, R.scene8)
  R.tileSig = function (M8, flags) { return (M8.flagTiles || []).map(function (ft) { return R.cond(ft.cond, flags || {}) ? 1 : 0; }).join(''); };
  // the ways off the floor: the map's warps whose conditions stand (the Wet's stairs up and down; drained, the cut seal down to the Burial), each as the grid's square
  R.warpsOn = function (M8, flags) { return (M8.warps || []).filter(function (w) { return R.cond(w.cond, flags || {}); }); };
  // a quarter counter-clockwise, as the Settling's grid (data/maps.js wet: the 8-bit square (x, y) is the grid's (y, W8 - 1 - x))
  R.turn = function (R8) { var W8 = R8[0].length, rows = []; for (var gy = 0; gy < W8; gy++) { var r = ''; for (var gx = 0; gx < R8.length; gx++) r += R8[gx][W8 - 1 - gy]; rows.push(r); } return rows; };
  R.wholeWet = function (flags) {
    var M8 = window.DS.DATA.maps.warrens_d, sig = R.tileSig(M8, flags);
    if (D.MAPS.wetwhole && D.MAPS.wetwhole.sig === sig) return D.MAPS.wetwhole;
    var R8 = R.rows8(M8, flags), W8 = R8[0].length, wet = D.MAPS.wet;
    // the drowned stair's first row, the landing's edge, wadable (RULED 10-13, Griz: "2 yes" -- wading onto it starts the Keeper, waded in: R.arrive); the rest of it deep.
    // Drained, it is dry steps (the flag tiles), nothing to wade
    R.WADE8.forEach(function (q) { var row = R8[q[1]]; if (row.charAt(q[0]) === 'D') R8[q[1]] = row.slice(0, q[0]) + '~' + row.slice(q[0] + 1); });
    var from8 = function (x, y, s) { return [y, W8 - (x + (s || 1))]; }, to8 = function (gx, gy) { return [W8 - 1 - gy, gx]; };
    var at8 = function (l) { return l.map(function (p) { return from8(p[0], p[1]); }); };
    D.MAPS.wetwhole = {
      name: 'The Wet', sub: 'the whole floor, walked as one token', dark: true, step: 10, deepWater: 'D', // (the settling pools and the inflow wadable since 10-13, his "1 yes"; the landlord's water and the drowned stair deep)
      lampAt: wet.lampAt, noBurrowAt: wet.noBurrowAt, // (the Settling's own: the same squares on the same turn)
      // the Settling's lights, and the mark's cold glow on the landing beside it, as the Keeper's own map lights it (data/maps.js floodstair: "the rune lights the landing")
      lights: (wet.lights || []).concat([from8(R.RUNE8[0], R.RUNE8[1] + 1).concat([20, 'glow'])]),
      sky: 20, // the cave's ceiling, 20 ft over the floor, as the roost's (js/grid.js G.flyTop): a darkmantle rolled at random hangs from it (10-13, Griz: "the whole area map needs a ceiling" -- "for if it rolls darkmantles as randoms")
      // the dwarven works -- the corridor, the landing, the drowned stair, the 8-bit's rows 19-24 -- under worked stone 15 ft up (the map's `skies`: js/grid.js G.ceilAt;
      // 10-13, Griz: "keepers room has to be at least 15 high")
      skies: [[19, W8 - 35, 6, 26, 15]],
      rows8: M8.rows, rows: R.turn(R8), from8: from8, to8: to8, src8: M8, sig: sig,
      entry: wet.entry, stairUp: wet.doors, doors: at8(R.warpsOn(M8, flags).map(function (w) { return [w.x, w.y]; })), foes: []
    };
    return D.MAPS.wetwhole;
  };

  // ------------------------------------------------------------------ the dwarven works' walls, drawn whole while the party is in them (10-14, Griz: "draw the walls of the Keeper room when you
  // actually go in there (versus normally transparent) such that one can see the Rune"). The grid cuts a wall to a stub where open floor lies behind it (js/iso.js classifyRock:
  // the room is seen through it), and the works' north wall -- the mark's -- has the cave behind it, so from the landing it was a stub and the mark was never seen. In the works,
  // their walls are classed again by the works' own floor alone: the ones the party stands in front of rise whole (the mark on its face), the ones between them and the eye
  // stay cut. Out of the works, as before
  R.RUNE8 = [22, 19]; // (the 8-bit's runeWall: warrens_d (22,19), the mark's USE square, its landing the square below)
  R.WORKS8 = { dwarfFloor: 1, drownStair: 1 }; R.WORKWALL8 = { dwarfWall: 1, runeWall: 1, sealDoor: 1 };
  R.tile8 = function (x, y) { var M8 = R.def.src8, p = R.def.to8(x, y), row = M8.rows[p[1]]; return row != null && p[0] >= 0 && p[0] < row.length ? M8.legend[row.charAt(p[0])] : null; };
  R.inWorks = function (B) {
    var R0 = B.roam; if (!R0) return false;
    var on = function (u) { return !!R.WORKS8[R.tile8(u.x, u.y)]; };
    return R0.mode === 'fight' ? R0.members.some(function (u) { return u.hp > 0 && B.units.indexOf(u) >= 0 && on(u); }) : on(R0.token);
  };
  R.works = function (B, inside) {
    var m = B.map; if (!m || !m.sq) return;
    if (!m.works) { m.works = { walls: [], on: false }; m.sq.forEach(function (s) { if (!s.open && R.WORKWALL8[R.tile8(s.x, s.y)]) m.works.walls.push({ s: s, rock0: s.rock }); }); }
    if (m.works.on === inside) return;
    m.works.on = inside;
    var fl = function (x, y) { var s = m.at(x, y); return !!(s && s.open && R.WORKS8[R.tile8(x, y)]); }, dirty = {};
    m.works.walls.forEach(function (w) {
      var s = w.s, x = s.x, y = s.y, r = w.rock0;
      if (inside) r = fl(x - 1, y) || fl(x, y - 1) || fl(x - 1, y - 1) ? 'near' : fl(x + 1, y) || fl(x, y + 1) || fl(x + 1, y + 1) ? 'far' : w.rock0;
      if (s.occCut) { s.occWas = r; return; } // (cut for the party behind it, R.occlude: what it is under the cut changes, the cut holds)
      if (s.rock === r) return;
      if (s.rock === 'fill' && !m.props.some(function (p) { return p.kind === 'rock' && p.sq === s; })) m.props.push({ kind: 'rock', sq: s, depth: s.x + s.y, gz: 0 });
      s.rock = r; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) dirty[(x + dx) + ',' + (y + dy)] = 1;
    });
    Object.keys(dirty).forEach(function (k) { if (m.rockImgs) delete m.rockImgs[k]; }); // (a wall's picture reads its neighbours' cut: js/iso.js rockCanvas, made again when next seen)
    m.sorted = null;
  };
  // a wall face between the eye and the party, cut while they are behind it (10-14, Griz: "insufficient transparency by policy at present pane location"): the grid cuts a wall
  // to a stub only where open floor lies behind it (js/iso.js classifyRock), so a thick wall between two open places stands whole toward the nearer -- and at height 2 a whole
  // face rises 168 px, enough to hide the party three squares behind it (his pane: the works corridor's north wall, the party in the cave beyond). Each frame the faces whose
  // column covers one of the party on the screen -- in front of them by up to the face's height in squares, within a square of their line -- are cut, and stand again when
  // nobody is behind them. Walking, the token; in a fight, each of the four on the floor
  R.occlude = function (B) {
    var m = B.map, R0 = B.roam; if (!m || !m.sq || !R0 || !R0.token) return;
    var who = R0.mode === 'fight' ? R0.members.filter(function (u) { return u.hp > 0 && B.units.indexOf(u) >= 0; }) : [R0.token];
    var key = who.map(function (u) { return u.x + ',' + u.y; }).join(';') + '|' + !!(m.works && m.works.on) + '|' + (D.iso.WALL || 84);
    if (m.occKey === key) return; m.occKey = key;
    var RF = m.def.roofs, depth = Math.ceil((Math.max(D.iso.WALL || 84, m.roofTop || 0) + 40) / (D.iso.TH / 2)), cut = {}, dirty = {}; // (a town's roofs, as tall as they stand: js/iso.js roofCanvas)
    who.forEach(function (u) {
      for (var dx = -1; dx <= depth + 1; dx++) for (var dy = -1; dy <= depth + 1; dy++) {
        var s = dx + dy; if (s < 1 || s > depth || Math.abs(dx - dy) > 1) continue;
        var q = m.at(u.x + dx, u.y + dy); if (q && !q.open && (q.rock === 'far' || q.occCut || (RF && RF[q.ch] && s * (D.iso.TH / 2) < D.iso.roofPx(m, q.ch) + 40))) cut[q.x + ',' + q.y] = q;
      }
    });
    var mark = function (q) { for (var yy = -1; yy <= 1; yy++) for (var xx = -1; xx <= 1; xx++) dirty[(q.x + xx) + ',' + (q.y + yy)] = 1; };
    (m.occCut || []).forEach(function (q) { if (!cut[q.x + ',' + q.y]) { q.rock = q.occWas; delete q.occCut; delete q.occWas; mark(q); } });
    Object.keys(cut).forEach(function (k) { var q = cut[k]; if (!q.occCut) { q.occWas = q.rock; q.rock = 'near'; q.occCut = true; mark(q); } });
    m.occCut = Object.keys(cut).map(function (k) { return cut[k]; });
    Object.keys(dirty).forEach(function (k) { if (m.rockImgs) delete m.rockImgs[k]; });
  };
  // the mark on the face of its wall toward the landing, while the works' walls stand whole: the Keeper's own glyph (js/keeper.js, the floodstair's), cold and breathing, sheared
  // onto the wall's plane -- the face between the rune square and the landing runs along the grid's y, down to the left on the screen
  var props1 = D.walls && D.walls.props;
  if (props1) D.walls.props = function (B) {
    var out = props1.apply(this, arguments);
    if (B && B.roam && B.map && R.def.wet) { var fp = R.floatProp(B); if (fp) out.push(fp); } // (one of the five, floating at the stair's deep end: R.floatProp)
    if (!B || !B.roam || !B.map || !B.map.works || !B.map.works.on) return out;
    var rq = R.def.from8(R.RUNE8[0], R.RUNE8[1]), gz = B.map.gz(rq[0] + 1, rq[1]), fx = rq[0] + 0.5, fy = rq[1];
    out.push({ roamRune: true, depth: rq[0] + rq[1] + 0.9, gz: gz, layer: 1, draw: function (ctx) {
      var iso = D.iso, c = iso.center(fx, fy, gz + 22 * (D.hscale || 1)), sc = iso.toScreen(c.x, c.y), glow = 0.55 + 0.25 * Math.sin(B.t / 22), C = FX.el('cold').c, x = Math.round(sc.x), y = Math.round(sc.y); // (its height in feet under height 2, as js/keeper.js's: the desk, 10-14)
      ctx.save(); ctx.translate(x, y); ctx.transform(1, -iso.TH / iso.TW, 0, 1, 0, 0);
      ctx.globalAlpha = 0.25 * glow + 0.1; ctx.fillStyle = C[1]; ctx.beginPath(); ctx.ellipse(0, 0, 13, 11, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = glow + 0.2; ctx.strokeStyle = C[0]; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, 8, 8, 0, 0, 7); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.moveTo(-5, -3); ctx.lineTo(5, -3); ctx.moveTo(-4, 3); ctx.lineTo(4, 3); ctx.stroke();
      ctx.restore(); ctx.globalAlpha = 1;
    } });
    return out;
  };

  // ------------------------------------------------------------------ the 8-bit's conditions, small (flag:x, !flag:x, & and |)
  R.cond = function (c, flags) {
    if (!c) return true;
    return String(c).split('|').some(function (any) { return any.split('&').every(function (t) { t = t.trim(); var neg = t.charAt(0) === '!'; if (neg) t = t.slice(1); var v = /^flag:/.test(t) ? !!flags[t.slice(5)] : true; return neg ? !v : v; }); });
  };

  // ------------------------------------------------------------------ the door: deep16/?roam=wet
  // emb (the seam, 10-14 -- Griz: "You should handle the seam given context?"): the 8-bit game's own party, walked in by its warp (deep16/js/embed.js E.roam, from js/embed.js
  // there): { save: the party, guests, pack, flags, kills, silver as the 8-bit holds them; opts: { at8 (the square it arrived on), dir, torch, torchKind } }. Without it, the test
  R.make = function (q, emb) {
    q = q || ''; R.emb = emb || null;
    var num = function (k, d) { var m = new RegExp('[?&]' + k + '=(\\d+)').exec(q); return m ? +m[1] : d; };
    // the floor as its flags lay it: inside the 8-bit, the game's own; the test's from its address -- &flags=a,b (set), &drained (the stair pumped dry: stairHook)
    var fq = /[?&]flags=([A-Za-z0-9_,:]+)/.exec(q); R.flags0 = {}; if (fq) fq[1].split(',').forEach(function (k) { if (k) R.flags0[k] = 1; }); if (/[?&]drained\b/.test(q)) R.flags0.stairHook = 1;
    // the floor by the door's name: the Wet (deep16/?roam=wet, the first) or Silverton (deep16/?roam=silverton: the town from the city map v6, js/town.js -- 10-20)
    var fl0 = emb && emb.save ? emb.save.flags || {} : R.flags0;
    R.def = /[?&]roam=silverton\b/.test(q) && D.town ? D.town.floor(q, fl0) : R.wholeWet(fl0);
    if (R.def.wet == null) R.def.wet = true; // (the Wet's own pieces -- its bucket, its stair, the rune, the floating one, its encounter table -- only on the Wet)
    R.q = q; R.PAD = num('pad', 4); R.FAR = num('far', 0); R.ENC = num('enc', 0); // (&far=0: no cap -- RULED 10-13 with the approach, his "1 yes")
    var lvl = num('lvl', 5), useSave = /[?&]save\b/.test(q);
    var F = { map: R.def.key || 'wetwhole', foes: [], level: lvl, dark: R.def.dark !== false && !/[?&]lit\b/.test(q), entry: null, fliers: true, bucket: R.def.wet ? R.def.from8(3, 7) : null }; // (the town by day: no dark) // (fliers: one with wings keeps to the air, js/flight-ai.js) (bucket: its square, so js/wet.js lifts the bucket onto the crate there -- his play, 10-14: "bucket rendered over crate not on top of crate")
    var o = emb ? { fightDef: F, data: emb.save, embed: Object.assign({ canRun: true }, emb.opts || {}) } : useSave ? { fightDef: F } : { fightDef: F, ladder: true, level: lvl }; // (inside the 8-bit: its party and pack, no loan, a way out of any fight)
    var sd = /[?&]seed=(\d+)/.exec(q); if (sd) D.seed = +sd[1] | 0;
    R.party0 = o; // (a pulled-in fight walks in with the same four: the same level, or the same save)
    var B = new D.Battle(o), enter0 = B.enter, update0 = B.update, paint0 = B.paint;
    B.cine = true;
    B.enter = function () {
      var t0 = (window.performance || Date).now();
      enter0.apply(this, arguments);
      R.stats = { enterMs: Math.round((window.performance || Date).now() - t0), squares: G.map.w * G.map.h, w: G.map.w, h: G.map.h, frames: 0, frameMs: 0 };
      this.order = []; this.active = null; this.req = null; this.exits = [];
      if (D.wet && R.def.wet) { D.wet.layLamp(this, R.def.lampAt); D.wet.layCrate(this, R.def.from8(3, 7)); D.wet.layStair(this, R.def.stairUp); }
      R.setup(this);
      if (R.def.town && D.town) D.town.people(this); // (the town's people, stood where v6 and the wiki put them: js/town.js)
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
        R0.hover = m.inside ? D.iso.pick(m.x, m.y, 0) : null; R0.hoverXY = m.inside ? [m.x, m.y] : null; // (the square under the mouse: ORDER's box, and the walk's path to it)
        if (R0.mode === 'order' && m.rclick && m.inside) R0.keys.push('turn'); // (a right click in ORDER: the formation as it stands facing the next way -- Griz, 10-13: "rightclick shows the ordering in different facings")
      }
      if (R0 && I.pressed('list')) R.showMap = !R.showMap; // (L: the floor map -- the whole Wet, what they saw, the ground and its ways out)
      if (R0) { if (R.def.wet) R.works(this, R.inWorks(this)); R.occlude(this); } // (the works' walls whole while the party is in them; a wall face in front of the party cut while it hides them)
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
    // (inside the 8-bit its party's order leads -- the first is the 8-bit's lead -- and ORDER on the floor goes back as that order: the seam, 10-14)
    if (Array.isArray(stored._order) && !R.emb) members.sort(function (a, b) { var ia = stored._order.indexOf(a.id), ib = stored._order.indexOf(b.id); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    var lead = members[0];
    // wings are for fights (10-14, Griz: "test with a fly ring equipped on vivian"): on the floor the party walks as one -- the token never flies over the deep water the rest
    // would drown in -- so a worn Ring of Flying's wings (js/flight-ai.js gives them at the enter) are kept on the figure and spread when a fight begins (R.engage)
    members.forEach(function (u) { u.wings = R.ringWings(u) || !!u.flies; u.flies = false; u.fz = 0; });
    var R0 = B.roam = { token: lead, members: members, rest: members.slice(1), form: {}, fw: [-1, 0], mode: 'walk', steps: 0, encIn: 0, clicks: [], keys: [], flags: {}, fights: 0, log: [], last: null, cut: null, msg: null, groups: [], spent: {} }; // (spent: the floor's triggers done with -- the roam's own marks, apart from the 8-bit's flags)
    members.slice(1).forEach(function (u, i) { R0.form[u.id] = stored[u.id] || R.FORM0[i] || [-(i + 1), 0]; });
    R0.fam = B.units.filter(function (u) { return u.familiar && u.side === 'party'; })[0] || null; // (the wizard's familiar, if the save brought one: R.famPlace)
    // the purse, the kill tally and the XP banked till the next gather (R.pay): the save's own, or the fixture's none
    var data0 = (B.from && B.from.data) || {}; R0.silver = data0.silver || 0; R0.kills = JSON.parse(JSON.stringify(data0.kills || {})); R0.xpBank = 0;
    if (R.emb) R0.flags = JSON.parse(JSON.stringify(data0.flags || {})); // (inside the 8-bit: its flags, all of them, and back out at the door)
    else R0.flags = JSON.parse(JSON.stringify(R.flags0 || {})); // (the test's from its address: &flags=, &drained -- R.make)
    if (/[?&]watch\b/.test(R.q)) members.forEach(function (u) { u.guest = true; u.classAI = true; }); // (&watch: the class tactics run the four, as the bench does)
    // the light: the party's carried torch (&light=none | torch | lantern), in the first free hand in the marching order (js/light.js handsFree, then handForLight)
    var lw = (/[?&]light=([a-z]+)/.exec(R.q) || [])[1] || (R.def.dark === false ? 'none' : 'torch'); // (the town by day: no torch lit)
    if (lw !== 'none' && !R.emb && !members.some(function (u) { return u.torch && u.torch.lit; })) { // (inside the 8-bit, the light is the party's own: the battle's enter took up its torch)
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
    B.menuSave = function () { return R.canSave(B); }; // (SAVE on the M menu out of a fight, inside the 8-bit: R.save)
    B.floorMarks = function (c) { R.floorMarks(c, B); }; B.marksOver = function (c) { R.marksOver(c, B); }; // (ORDER's box on the floor, under the figures: ui.js drawBattle's hook)
    if (!R.emb && !/[?&]save\b/.test(R.q) && !(B.inv || []).some(function (s) { return s.id === 'lantern' && s.n > 0; })) (B.inv = B.inv || []).push({ id: 'lantern', n: 1 });
    // walked in from a save, the pack is the party's own: no loan (every grid fight not opened from inside the 8-bit lends a crossbow, bolts, arrows and a rope -- js/save.js
    // SV.armoury; the 8-bit's party carries only what it brought, Griz 09-27). The test's four keep the ladder's kit
    if (/[?&]save\b/.test(R.q)) B.inv = JSON.parse(JSON.stringify(data0.inv || [])).map(function (s) { return Array.isArray(s) ? { id: s[0], n: s[1] } : s; });
    // in by the stair up, where the 8-bit's warp from the Warrens' second floor lands (warrens_b to warrens_d (2, 12))
    var e = R.def.entry[0], fw0 = R.def.face || [0, -1]; lead.x = e[0]; lead.y = e[1]; lead.facing = D.spr.facingFor(fw0[0], fw0[1]); R0.fw = fw0.slice(); // (the town: in at its gate, facing in)
    // inside the 8-bit: on the square its warp set the party down on, the way it faced (the 8-bit's compass on the turned grid: R.FACE8)
    var eo = R.emb && R.emb.opts; if (eo && eo.at8) { var e8 = R.def.from8(eo.at8[0], eo.at8[1]); if (G.canStand(lead, e8[0], e8[1])) { lead.x = e8[0]; lead.y = e8[1]; } var fw8 = { up: [-1, 0], down: [1, 0], right: [0, -1], left: [0, 1] }[eo.dir]; if (fw8) { R0.fw = fw8; lead.facing = D.spr.facingFor(fw8[0], fw8[1]); } } // (in off the stair walking the 8-bit's east: the grid's -y)
    R.into(B, R0.rest);
    B.focus(lead);
    R.bucketProp(B); // (the bucket on its crate, if it is there)
    R.layChests(B); // (the 8-bit map's chests, opened or not by its flags)
    R.ropeUse(); // (the Rope & Grapple, usable from the menu on the floor: the floating one)
    // the pack's check at the stairs starts here: all the party owns as it walks on, the pack as it walks on, an empty ledger (R.handback)
    R0.ledger = []; R0.pack0 = R.owned(B); R0.inv0 = R.counts(B.inv);
    // the zone's creatures fetched behind, so a fight's figures are there when it falls (the town has no table: no random fights in Silverton, as in the 8-bit)
    var Z = window.DS.DATA.encounters[R.def.zone8 === undefined ? 'warrens_d' : R.def.zone8], kinds = [];
    (Z ? Z.groups : []).forEach(function (g) { g.e.forEach(function (e2) { var f = D.FOES[e2[0]]; if (f && f.sheet && kinds.indexOf(f.sheet) < 0) kinds.push(f.sheet); }); });
    if (D.spr.prefetch) D.spr.prefetch(kinds);
  };
  // random fights at half the 8-bit's rate (RULED 10-13, Griz: "default random encounter rate down 50% from 8bit"): the 8-bit's count between them, doubled
  R.RATE = 2;
  R.resetEnc = function (R0) { var Z = window.DS.DATA.encounters[R.def && R.def.zone8 !== undefined ? R.def.zone8 : 'warrens_d'], r = (Z && Z.rate) || [18, 40]; return (r[0] + D.rint(r[1] - r[0] + 1)) * R.RATE; };
  // off the floor and into the token (no walk: the setup's and the formation's quiet return)
  R.into = function (B, list) { list.forEach(function (u) { var j = B.units.indexOf(u); if (j >= 0) B.units.splice(j, 1); }); R.famPlace(B, true); G.setup(G.map, B.units); B.cache = null; };
  // the wizard's familiar on the floor (10-14, Griz: "familiars aren't properly handled"): it rides its wizard (deep16/js/familiar.js FM.unit: its square is his), so it is on
  // the floor while he is -- on his shoulder or at his feet when he leads, folded into the token with him when he walks inside it (it was left riding the square he last
  // stood on), out with him at a spill -- and home on him at every fold (home). Fallen, it stays off the floor; its hit points go back with the party (R.leaveFloor)
  R.famPlace = function (B, home) {
    var R0 = B.roam, f = R0 && R0.fam; if (!f) return;
    var m = f.master, on = !!m && B.units.indexOf(m) >= 0 && f.hp > 0 && !f.dead, j = B.units.indexOf(f);
    if (home && f.hp > 0 && !f.dead) f.riding = true;
    if (!on && j >= 0) B.units.splice(j, 1);
    if (on && j < 0) { f.riding = true; B.units.push(f); }
  };
  R.famOut = function (R0) { var f = R0.fam; return f ? { gone: f.hp <= 0 || !!f.dead, hp: Math.max(0, f.hp) } : null; }; // (as a fight's result.familiar: deep16/js/embed.js)
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
    if (R.def.town) B.card(R.wrap(['{y}SILVERTON{/}, in at the ' + R.def.gate + ' gate: the town at true scale (' + G.map.w + ' x ' + G.map.h + ' squares), one token, the party inside it.', '{g}Click to walk, or the arrows. E: a word with someone beside you. O: the formation. L: the town map.{/}']), 420);
    else B.card(['{y}THE WET{/}, the whole floor (' + G.map.w + ' x ' + G.map.h + ' squares): one token, the party inside it.', '{g}Click to walk, or the arrows. O: the formation.' + (R.emb ? '' : ' F: a fight now.') + '{/}'], 420);
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
      if (k === 'haul') { if (!trk.length && R.floatInReach(B)) yield* R.ropeHaul(B); continue; }
      if (k === 'save') { if (R.canSave(B)) yield* R.save(B); continue; }
      if (k === 'act') { if (!trk.length) yield* R.act(B); else { R0.acts = []; D.sfx('miss'); B.card(['{g}Not with them coming.{/}'], 120); } continue; }
      if (k === 'use') { var un = R.useNear(B); if (un && !trk.length) yield* R.fire(B, un.trig, un.sq); else D.sfx('miss'); continue; }
      // (F: a group coming, the fight now at this range -- its card says so; nothing coming, a fight called up, the test door's alone -- 10-14, his play inside the game: "why
      // could i hit 'f' just then?", a Gray Ooze called up out of nothing on the real floor)
      if (k === 'fight') { if (trk.length) yield* R.engage(B, trk[0], false, 'yours'); else if (!R.emb && R.def.wet) yield* R.encounter(B, 'asked'); continue; } // (no fights called up in town)
      var ck = R0.clicks.shift();
      if (ck) {
        // a click walks a short way only (10-14, Griz: "trying to get the hand pop-up by clicking on the rune is hilarious. Click to move only on squares within x ft (30-50?)":
        // the seat's pick, 50 ft by the path); and a click on the mark itself, while it is drawn on its wall, is a hand on it -- from beside it, walking there first if near
        var mk = R.runeAt(B, ck.x, ck.y), sq = mk ? null : D.iso.pick(ck.x, ck.y, 0);
        if (mk) {
          var pm = R.besidePath(B, mk.sq);
          if (pm && pm.length * 5 <= R.CLICK_FT) { yield* R.walkBeside(B, mk.sq); if (Math.max(Math.abs(R0.token.x - mk.sq[0]), Math.abs(R0.token.y - mk.sq[1])) <= 1) yield* R.fire(B, mk.trig, mk.sq); }
          else R.tooFar(B);
          continue;
        }
        if (sq) {
          var use = R.useAt(B, sq.x, sq.y);
          if (use) { var pu = R.besidePath(B, [sq.x, sq.y]); if (pu && pu.length * 5 <= R.CLICK_FT) { yield* R.walkBeside(B, [sq.x, sq.y]); yield* R.fire(B, use, [sq.x, sq.y]); } else R.tooFar(B); continue; }
          var pth = D.Battle.route(t, [sq.x, sq.y]);
          if (!pth) { D.sfx('miss'); B.card(['{g}No way there from here.{/}'], 120); }
          else if (pth.length * 5 > R.CLICK_FT) R.tooFar(B);
          else R0.path = pth;
        }
      }
      // the arrows: the screen's own directions, a square's diagonal on the grid (10-13, Griz: "Can arrow keys default move diagonal?"); two at once are the grid's
      // straight ways (up and right: the screen's upper right). A diagonal into a corner slides along the open side
      var dx0 = (I.held.down ? 1 : 0) - (I.held.up ? 1 : 0) + (I.held.right ? 1 : 0) - (I.held.left ? 1 : 0), dy0 = (I.held.down ? 1 : 0) - (I.held.up ? 1 : 0) - (I.held.right ? 1 : 0) + (I.held.left ? 1 : 0);
      var dir = dx0 || dy0 ? [Math.sign(dx0), Math.sign(dy0)] : null, dk = dir ? dir.join(',') : '';
      // a press against a wall that holds the 8-bit's USE -- the mark -- is a hand on it, as E is (10-14, Griz: "let activation as well as directional press against it trigger it
      // (diagonal is tricky)"): once a press, held or new, till the arrows let go or turn (R.pressInto)
      if (dk !== R0.pressed) R0.pressed = null;
      if (dir && !R0.pressed && !trk.length) { var pr = R.pressInto(B, dir); if (pr) { R0.pressed = dk; R0.path = null; t.facing = D.spr.facingFor(pr.sq[0] - t.x, pr.sq[1] - t.y); t.anim = 'idle'; t.animT = B.t; yield* R.fire(B, pr.trig, pr.sq); continue; } }
      if (dir) {
        var okS = function (x, y) { return G.canStand(t, x, y); }, tries = dir[0] && dir[1] ? [dir, [dir[0], 0], [0, dir[1]]] : [dir], went = null;
        for (var ti = 0; ti < tries.length && !went; ti++) { var d0 = tries[ti], tx = t.x + d0[0], ty = t.y + d0[1]; if (!okS(tx, ty)) continue; if (d0[0] && d0[1] && (!okS(t.x + d0[0], t.y) || !okS(t.x, t.y + d0[1]))) continue; went = [tx, ty]; }
        R0.path = went ? [went] : null; if (!went) t.facing = D.spr.facingFor(dir[0], dir[1]);
      }
      if (R0.path && R0.path.length) {
        var to = R0.path[0];
        // the drowned stair's first row asks before anyone wades in (10-14, Griz: "I note no pop-up where you can now wade in ... and so didn't get to test rope without fight"): the
        // 8-bit's ROPE THEM OUT / WADE IN / LEAVE, from the landing -- WADE IN goes in and the Keeper is there; the rope hauls from where they stand; LEAVE stays. Once an arrow press
        if (R.wadeAsk(B, to)) {
          R0.path = null; t.anim = 'idle'; t.animT = B.t; t.facing = D.spr.facingFor(to[0] - t.x, to[1] - t.y);
          if (!dk || R0.pressed !== dk) { R0.pressed = dk || null; yield* R.stairScene(B, { id: 'stair' }, to); } else yield 1;
          continue;
        }
        R0.path.shift();
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
    B.roam.steps++;
    var ev = yield* R.landed(B); if (ev) return ev;
    var R0 = B.roam, t = R0.token;
    if (R.tracking(R0).length) return null; // (no count while a group is coming: one that lost the party holds nothing up)
    if (R.zoneAt(B, t.x, t.y)) {
      R0.encIn -= 1;
      if (R0.encIn <= 0) { R0.encIn = R.resetEnc(R0); yield* R.encounter(B, 'steps'); return 'fight'; }
    }
    return null;
  };
  // what the token's square does when the party stands on it: a way off the floor, the stair's ask, a trigger square. Each step's (R.arrive), and once as a gather ends there
  // (RULED 10-14, Griz: "2 yes" -- the others' squares on the way to the token, and every square in a fight, do nothing: the 8-bit's party is its square)
  R.landed = function* (B) {
    var R0 = B.roam, t = R0.token, p8 = R.def.to8(t.x, t.y);
    if ((R.def.doors || []).some(function (d) { return d[0] === t.x && d[1] === t.y; })) {
      var up = R.def.stairUp.some(function (d) { return d[0] === t.x && d[1] === t.y; });
      if (R.def.town) { yield* D.town.wayOut(B, [t.x, t.y]); return 'door'; } // (the town's roads off the floor: the world map takes the party on there, later -- js/town.js)
      if (R.emb) { yield* R.leaveFloor(B, 'out', [t.x, t.y]); return 'door'; } // (inside the 8-bit: off the floor, and the 8-bit takes its own warp from this square)
      var w8 = R.warpsOn(R.def.src8, R0.flags).filter(function (w) { return w.x === p8[0] && w.y === p8[1]; })[0], to8 = w8 ? w8.to : up ? 'warrens_b' : 'warrens_c', nm8 = ((window.DS.DATA.maps || {})[to8] || {}).name || to8; // (the map's own warp: the Burial's too, drained)
      B.card(R.wrap(['{y}The way to ' + nm8 + '{/}: here the 8-bit takes the party on (' + to8 + ').', '{g}(the test keeps you on the Wet){/}']), 300);
      R.packCard(B);
      return 'door';
    }
    var trig = R.triggerAt(B, p8[0], p8[1], 'step');
    if (R.wadeAsk(B, [t.x, t.y])) { yield* R.stairScene(B, { id: 'stair' }, [t.x, t.y]); return 'trigger'; } // (come onto the row some other way: it asks there)
    if (trig && trig.town === 'door' && R0.path && R0.path.length) return null; // (a town's door on the way is walked over: it opens where a walk ends, or an arrow's step onto it -- 10-20)
    if (trig) { yield* R.fire(B, trig, [t.x, t.y]); return 'trigger'; }
    return null;
  };

  // ------------------------------------------------------------------ the 8-bit's trigger squares on the floor
  R.triggerAt = function (B, x8, y8, on) {
    var R0 = B.roam;
    return (R.def.src8.triggers || []).filter(function (t) { var r = t.rect; return t.on === on && x8 >= r[0] && y8 >= r[1] && x8 < r[0] + r[2] && y8 < r[1] + r[3] && R.cond(t.cond, R0.flags) && !(t.once && R0.flags['trig:' + t.id]) && !R0.spent[t.id]; })[0] || null;
  };
  R.useAt = function (B, x, y) { var p = R.def.to8(x, y), c = R.chestAt(p[0], p[1]); return c ? { id: 'chest', on: 'use', chest: c } : R.triggerAt(B, p[0], p[1], 'use'); };
  // the 8-bit map's chests on the floor (the Wet's one: a greater potion at (38, 21)): a box on its square, opened by E or a click as the 8-bit's EV.chest -- its flag
  // ('chest:<map>:x,y') set, so the 8-bit has it opened too when the party is back (the seam, 10-14)
  R.chestAt = function (x8, y8) { return (R.def.src8.chests || []).filter(function (c) { return c.x === x8 && c.y === y8; })[0] || null; };
  R.chestKey = function (c) { return 'chest:' + R.def.src8.id + ':' + c.x + ',' + c.y; };
  R.chestScene = function* (B, c) {
    var R0 = B.roam, k = R.chestKey(c);
    if (R0.flags[k]) { B.card([R.say8('g.empty')], 160); yield 20; return; }
    R0.flags[k] = 1; D.sfx('chest');
    if (c.item) { R.give(B, c.item, c.n || 1, 'the chest'); var it = window.DS.DATA.items[c.item]; B.card([R.say8('g.found').replace('{item}', (it ? it.name : c.item) + ((c.n || 1) > 1 ? ' x' + c.n : ''))], 260); }
    if (c.silver) { R0.silver += c.silver; B.card(['Found ' + c.silver + ' sp.'], 220); }
    yield 30;
  };
  // laid on the floor: its square closed to walking (the 8-bit's chests stand in the way), a box drawn on it, its lid up once opened
  R.layChests = function (B) {
    (R.def.src8.chests || []).forEach(function (c) {
      var q = R.def.from8(c.x, c.y), s = B.map.at(q[0], q[1]); if (!s) return;
      s.walk = false;
      B.map.props.push({ kind: 'chest', sq: s, depth: q[0] + q[1] + 0.4, gz: 0, draw: function (ctx) {
        var iso = D.iso, z = iso.zoom || 1, cc = iso.center(q[0], q[1], B.map.gz(q[0], q[1])), sc = iso.toScreen(cc.x, cc.y), x = Math.round(sc.x), y = Math.round(sc.y), open = !!(B.roam && B.roam.flags[R.chestKey(c)]);
        ctx.fillStyle = '#1e1208'; ctx.fillRect(x - 9 * z, y - 9 * z, 18 * z, 10 * z);
        ctx.fillStyle = '#7a4e22'; ctx.fillRect(x - 8 * z, y - 8 * z, 16 * z, 8 * z);
        ctx.fillStyle = '#c8a040'; ctx.fillRect(x - 8 * z, y - 5 * z, 16 * z, 1 * z); ctx.fillRect(x - 1 * z, y - 6 * z, 2 * z, 3 * z); // (the band and the hasp)
        if (open) { ctx.fillStyle = '#0c0806'; ctx.fillRect(x - 7 * z, y - 9 * z, 14 * z, 2 * z); ctx.fillStyle = '#6a4220'; ctx.fillRect(x - 8 * z, y - 15 * z, 16 * z, 6 * z); } // (the lid up, the dark inside)
        else { ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x - 8 * z, y - 11 * z, 16 * z, 3 * z); }
      } });
    });
    B.map.sorted = null; G.setup(B.map, B.units);
  };
  // the shortest walk to a square beside `at` ([] when beside it already, null when there is none)
  R.besidePath = function (B, at) {
    var t = B.roam.token;
    if (Math.max(Math.abs(t.x - at[0]), Math.abs(t.y - at[1])) <= 1) return [];
    var best = null, bl = Infinity;
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var q = [at[0] + dx, at[1] + dy]; if ((!dx && !dy) || !G.canStand(t, q[0], q[1])) continue; var p = D.Battle.route(t, q); if (p && p.length < bl) { bl = p.length; best = p; } }
    return best;
  };
  R.walkBeside = function* (B, at) {
    var t = B.roam.token, best = R.besidePath(B, at);
    while (best && best.length) { yield* R.step(B, t, best.shift()); var ev = yield* R.arrive(B); if (ev) return; }
    t.anim = 'idle'; t.animT = B.t;
  };
  R.CLICK_FT = 50; // (a click's walk, by the path: Griz's 30-50, the seat's pick the top of it)
  R.tooFar = function (B) { D.sfx('miss'); B.card(['{g}Too far for a click (' + R.CLICK_FT + ' ft): click nearer, or walk with the arrows.{/}'], 160); };
  // the mark's glyph on the screen while the works' walls stand whole (the props hook draws it there): a click within its ring
  R.runeAt = function (B, x, y) {
    if (!B.map || !B.map.works || !B.map.works.on) return null;
    var rq = R.def.from8(R.RUNE8[0], R.RUNE8[1]), gz = B.map.gz(rq[0] + 1, rq[1]), c = D.iso.center(rq[0] + 0.5, rq[1], gz + 22 * (D.hscale || 1)), s = D.iso.toScreen(c.x, c.y), r = 13 * (D.iso.zoom || 1);
    if (Math.abs(x - s.x) > r || Math.abs(y - s.y) > r) return null;
    var tr = R.useAt(B, rq[0], rq[1]); return tr ? { trig: tr, sq: rq } : null;
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
    if (trig.town && D.town) { yield* D.town.fire(B, trig, at); return; } // (the town's doors and people: js/town.js)
    var oz = R.OOZES[trig.id];
    if (oz) { yield* R.encounter(B, 'set', { list: oz.list, at: oz.at8 ? R.def.from8(oz.at8[0], oz.at8[1]) : at, swims: oz.swims, flag: oz.flag, trig: oz.trig, line: oz.line, how: 'where it lay' }); return; }
    if (R.WAKE[trig.id]) {
      // the landlord fed or dead: its water is only water (the 8-bit's S.landlord -- 10-14, his play: "settling retriggered post feeding": USE on the deep water had no
      // condition and pulled the Settling in again); fed, the quarter-again XP if it has not been paid (EV.fedXp's once)
      var f0 = B.roam.flags;
      if (f0.otyughDead || f0.otyughFed) {
        var fl0 = [R.say8(f0.otyughDead ? 'w.poolQuiet' : 'w.landlordFed')];
        if (f0.otyughFed && !f0.otyughFedXp) { f0.otyughFedXp = 1; fl0 = fl0.concat(R.pay(B, window.DS.R.fedPool(), R.say8('w.fedXp'))); }
        B.card(R.wrap(fl0), 260); yield 20; yield* R.picks(B); return;
      }
      yield* R.pullIn(B, 'wet', trig, at); R.bucketProp(B); return;
    }
    if (trig.id === 'mark') { yield* R.markScene(B, trig, at); return; }
    if (trig.id === 'stair') { yield* R.stairScene(B, trig, at); return; }
    if (trig.id === 'bucket') { yield* R.bucketScene(B, trig, at); return; }
    if (trig.id === 'chest') { yield* R.chestScene(B, trig.chest); return; }
    if (/^deepCradle\d$/.test(trig.id)) { yield* R.cradle(B, trig, at); return; }
    yield* R.scene8(B, trig, at);
  };
  // any other 8-bit scene on the floor (10-14, Griz: "this is how we'll be doing all the dwarf road and stuff after, so we do it all and do it right" -- the drained stair's
  // dryStair and holdStair here, the road's next): the 8-bit's own script by a hand-back from the square it fired on (js/embed.js DS.roam8.hand 'script': its lines, its
  // fight in its own frame, its flags). What it did to the floor's flag tiles (the stair held, the water back) opens the floor again for them where the party stands
  R.scene8 = function* (B, trig, at) {
    var R0 = B.roam;
    if (!R.emb) { B.card(R.wrap(['{y}' + trig.id + '{/}: the 8-bit\'s own scene (' + trig.script + ') -- inside the game the floor hands the party back for it (?at=roam).']), 300); D.sfx('popup'); yield 30; return; }
    var m = yield* R.handOut(B, 'script', { script: trig.script, arg: trig.arg != null ? trig.arg : null, trig: trig.id });
    if (m && !R0.out && R.tileSig(R.def.src8, R0.flags) !== R.def.sig) yield* R.leaveFloor(B, 'reopen', [R0.token.x, R0.token.y]);
  };

  // ------------------------------------------------------------------ the 8-bit's scenes on the floor, in its own words (DS.DATA.text, js/events.js S.mark, S.stair, S.bucket)
  R.say8 = function (k) { var t = window.DS.DATA.text && window.DS.DATA.text[k]; return t ? (t.t || t) : k; };
  // a line to the width a prompt or a card can show (the grid's prompt box stops at the canvas's width and does not wrap: seen in the pane, 10-13)
  R.wrap = function (lines, maxPx) {
    var out = [], w = maxPx || D.W - 40;
    [].concat(lines).forEach(function (l) { var words = String(l).split(' '), cur = ''; words.forEach(function (wd) { var t = cur ? cur + ' ' + wd : wd; if (cur && D.textWidth(t) > w) { out.push(cur); cur = wd; } else cur = t; }); if (cur) out.push(cur); });
    return out;
  };
  R.WADE8 = [[19, 20], [19, 21], [19, 22], [19, 23]]; // (the 8-bit's squares: the drowned stair's first row, where its `stair` trigger stands)
  R.isWade = function (x, y) { var p = R.def.to8(x, y); return R.WADE8.some(function (q) { return q[0] === p[0] && q[1] === p[1]; }); };
  R.USE_NAME = { chest: 'the chest', mark: 'the mark', stair: 'the flooded stair', bucket: 'the bucket', landlord: 'the deep water', deepCradle0: 'the cradle', deepCradle1: 'the cradle', deepCradle2: 'the cradle' };
  // an arrow press into a wall with a USE on it (the mark in the north wall of the landing): the square the press points at, or -- the diagonal, the tricky one (the arrows are
  // the screen's own ways, so up and left alone are the grid's diagonals) -- either of its two straight halves, so each of the three landing squares beside the mark reaches it
  // with one arrow. Only when the press is blocked: a diagonal that walks never fires a half
  R.pressInto = function (B, dir) {
    var t = B.roam.token; if (G.canStand(t, t.x + dir[0], t.y + dir[1])) return null;
    var tries = [dir].concat(dir[0] && dir[1] ? [[dir[0], 0], [0, dir[1]]] : []);
    for (var i = 0; i < tries.length; i++) { var x = t.x + tries[i][0], y = t.y + tries[i][1], s = G.map.at(x, y); if (!s || s.walk) continue; var tr = R.useAt(B, x, y); if (tr) return { trig: tr, sq: [x, y] }; }
    return null;
  };
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
    // (the 8-bit's S.mark as the bug-fix seat left it, 10-14, the road §7d: once it is awake no hand wakes it twice, and the mark's look says it is awake)
    var R0 = B.roam, f = R0.flags, Rr = window.DS.R, settled = f.keeperDone || f.stairHook || f.fiveRecovered || f.keeperAwake;
    var lines = [R.say8(f.stairHook && !f.keeperWater ? 'w.markDry' : f.keeperAwake && !f.keeperDone && !f.fiveRecovered ? 'w.markAwake' : settled ? 'w.markPlain' : 'w.markSee')];
    var read = R0.members.some(function (u) { return u.src && u.hp > 0 && D.d(20) + Math.max(Rr.skill(u.src, 'Arcana', 'int'), Rr.skill(u.src, 'Religion', 'int')) >= 12; });
    if (read || f.hobMet) { f.markRead = 1; lines.push(R.say8('w.markRead')); }
    if (settled) { B.card(R.wrap(lines), 320); yield 30; return; }
    var a = yield { prompt: { who: R0.token, title: 'THE MARK', lines: R.wrap(lines.concat([R.say8('w.markAsk')])), opts: [{ label: 'PUT A HAND ON IT', value: 1 }, { label: 'LEAVE IT', value: 0 }] } };
    if (a !== 1) return;
    f.keeperAwake = 1; D.sfx('splash'); B.card(R.wrap([R.say8('w.markWake')]), 320); yield 50;
    yield* R.pullIn(B, 'keeper', trig, at, 'rune');
  };
  // the stair (js/events.js S.stair): ROPE THEM OUT (the rope; the Keeper awake fights by the rune, asleep the five come up), WADE IN (the fight from the ledge), LEAVE
  R.stairScene = function* (B, trig, at) {
    var R0 = B.roam, f = R0.flags;
    if (f.fiveRecovered) { B.card([R.say8('w.stairDone')], 260); yield 20; return; }
    var awake = R.awake(f); // (the 8-bit's S.stair, 10-14: woken and not yet beaten, the stair says so and WADE IN meets it waiting)
    var a = yield { prompt: { who: R0.token, title: 'THE FLOODED STAIR', lines: R.wrap([R.say8(awake ? 'w.stairAwake' : 'w.stairSee'), R.say8('w.stairAsk')]), opts: [{ label: 'ROPE THEM OUT', value: 0 }, { label: 'WADE IN', value: 1 }, { label: 'LEAVE', value: 2 }] } };
    if (a === 0) { yield* R.ropeHaul(B, trig, at); return; }
    if (a === 1) { B.card(R.wrap([R.say8(awake ? 'w.wadeAwake' : 'w.wade')]), 260); yield 30; yield* R.pullIn(B, 'keeper', trig, at, 'ledge'); }
  };
  R.awake = function (f) { return !!(f.keeperAwake && !f.keeperDone); };
  // ROPE THEM OUT, from the stair's ask or the Rope & Grapple used from the menu (10-14, Griz: "should we put one floating thing at the back and have them actually rope it out"
  // -- "such that if party token use item grapple target floaty - animates reel-in as if they had clicked the menu option version to solve"): no rope, the 8-bit's word; the
  // Keeper awake, the 8-bit's fight by the rune; asleep, the rope goes out, the hook takes the one floating at the deep end and they haul it up to the landing, and the five
  // are up (js/rules.js R.fiveUp)
  R.FLOAT8 = [13, 21]; // (the 8-bit's square of the one at the back: the drowned stair's deep end, the sealed door beyond)
  // the hook reaches it from the landing, where the 8-bit asks ROPE THEM OUT: the token within two squares of the stair's first row, the five down, the stair water
  R.floatInReach = function (B) {
    var R0 = B.roam, f = R0.flags, t = R0.token; if (!R.def.wet || f.fiveRecovered || (f.stairHook && !f.keeperWater)) return false;
    return R.WADE8.some(function (q) { var g = R.def.from8(q[0], q[1]); return Math.max(Math.abs(g[0] - t.x), Math.abs(g[1] - t.y)) <= 2; });
  };
  // the Rope & Grapple used from the menu out of a fight (js/menu.js asks an item's `use.field`, and the rope has none -- it is set on a face in a fight): on the roam's own page
  // it is given one, a grapple, so the menu hands the pick to the roam (R.menuAct). This page only: the 8-bit's data is its own
  R.ropeUse = function () { var it = window.DS.DATA.items.rope; if (it && !it.use) it.use = { field: true, target: 'party', effect: 'grapple', roam: true }; };
  R.ropeHaul = function* (B, trig, at) {
    var R0 = B.roam, f = R0.flags, t = R0.token;
    if (!(B.inv || []).some(function (x) { return x.id === 'rope' && x.n > 0; })) { B.card([R.say8('w.noRope')], 260); yield 20; return; }
    if (f.keeperAwake) { B.card([R.say8('w.ropeAwake')], 260); yield 30; yield* R.pullIn(B, 'keeper', trig || { id: 'stair' }, at || R.def.from8(19, 21), 'rune', 'rope'); return; }
    var from = R.def.from8(R.FLOAT8[0], R.FLOAT8[1]), best = null, bd = Infinity;
    R.WADE8.forEach(function (q) { var g = R.def.from8(q[0], q[1]), d = Math.max(Math.abs(g[0] - t.x), Math.abs(g[1] - t.y)); if (d < bd) { bd = d; best = g; } });
    t.facing = D.spr.facingFor(from[0] - t.x, from[1] - t.y); t.anim = 'idle'; t.animT = B.t;
    B.card(R.wrap([R.say8('w.ropeOut')]), 320); D.sfx('confirm');
    B.focus({ x: Math.round((t.x + from[0]) / 2), y: Math.round((t.y + from[1]) / 2), size: 1 }); // (the camera between them: the deep end is down the stair, off the landing's view)
    R0.haul = { from: from, to: best || from, t0: B.t, cast: 18, dur: 84 };
    for (var k = 0; k < R0.haul.dur + R0.haul.cast + 6; k++) yield 1;
    R0.haul = null; B.focus(t);
    yield* R.five(B);
  };
  // the floating one, while the five are down and the stair is water: a body face-down on the black water at the deep end, rocking, a ring of ripple round it; while the rope
  // hauls it (R0.haul), the line from the token's hand and the body drawn up the steps to the landing's edge (a stand-in drawn here, no sheet)
  R.floatProp = function (B) {
    var R0 = B.roam, f = R0.flags; if (f.fiveRecovered || (f.stairHook && !f.keeperWater)) return null;
    var h = R0.haul, from = R.def.from8(R.FLOAT8[0], R.FLOAT8[1]), pos = from, k = 0;
    if (h) { var e = B.t - h.t0 - h.cast; k = Math.max(0, Math.min(1, e / h.dur)); k = k * k * (3 - 2 * k); pos = [from[0] + (h.to[0] - from[0]) * k, from[1] + (h.to[1] - from[1]) * k]; }
    var gz = B.map.gz(Math.round(pos[0]), Math.round(pos[1]));
    return { depth: pos[0] + pos[1] + 0.3, gz: gz, layer: 1, draw: function (ctx) {
      var iso = D.iso, z = iso.zoom || 1, c = iso.center(pos[0], pos[1], gz), s = iso.toScreen(c.x, c.y), x = Math.round(s.x), y = Math.round(s.y + 2 * z), bob = Math.sin(B.t / 28) * z, sx = 1.6 * z; // (half again a square's figure: it has to read on black water)
      ctx.save();
      ctx.globalAlpha = 0.45; ctx.strokeStyle = '#9fc4e8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y + 1 * sx, (11 + Math.sin(B.t / 19) * 2) * sx, (5 + Math.sin(B.t / 19)) * sx, 0, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1; ctx.translate(x, y + bob); ctx.rotate(-0.42);
      ctx.fillStyle = '#1a1614'; ctx.fillRect(-9 * sx, -3 * sx, 16 * sx, 6 * sx);           // its edge on the water
      ctx.fillStyle = '#5a4a3c'; ctx.fillRect(-8 * sx, -2 * sx, 14 * sx, 4 * sx);           // the coat, sodden
      ctx.fillStyle = '#7a6650'; ctx.fillRect(-6 * sx, -2 * sx, 8 * sx, 2 * sx);
      ctx.fillStyle = '#ddd0bc'; ctx.fillRect(6 * sx, -2 * sx, 3 * sx, 3 * sx);            // the back of the head
      ctx.fillStyle = '#4a3a2a'; ctx.fillRect(6 * sx, -2 * sx, 3 * sx, 1 * sx);
      ctx.fillStyle = '#ddd0bc'; ctx.fillRect(-11 * sx, 1 * sx, 3 * sx, 1.5 * sx);         // a hand out on the water
      ctx.restore();
      if (h && B.t - h.t0 >= 0) { // the rope: out from the hand as a line, then taut while they haul
        var t = R0.token, tc = iso.center(t.x, t.y, B.map.gz(t.x, t.y)), ts = iso.toScreen(tc.x, tc.y), hx = ts.x, hy = ts.y - 14 * z, a = Math.min(1, (B.t - h.t0) / h.cast);
        var ex = hx + (x - hx) * a, ey = hy + (y + bob - hy) * a, sag = (1 - k) * 10 * z * (1 - a * 0.5);
        ctx.strokeStyle = '#c8a86a'; ctx.lineWidth = Math.max(1, z); ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo((hx + ex) / 2, (hy + ey) / 2 + sag, ex, ey); ctx.stroke(); ctx.lineWidth = 1;
      }
    } };
  };
  // a square of the drowned stair's first row, its water as yet unsettled: the stair's USE stands there (its cond: the stair flooded), the five not up, the Keeper not beaten
  R.wadeAsk = function (B, sq) {
    var R0 = B.roam, f = R0.flags, s = G.map.at(sq[0], sq[1]);
    if (!R.def.wet || !s || s.ch !== '~' || !R.isWade(sq[0], sq[1]) || f.keeperDone || f.fiveRecovered || R0.spent.stair) return false;
    var p = R.def.to8(sq[0], sq[1]); return !!R.triggerAt(B, p[0], p[1], 'use');
  };
  // the bucket drawn on the deep station's crate while it is there -- not carried, not fed to the landlord (js/wet.js W.layBucket, the Settling's own picture; 10-14, his play:
  // "bucket was gone until settling triggered": the floor laid the crate and never the bucket)
  R.bucketProp = function (B) {
    if (!D.wet || !D.wet.layBucket || !B.map || !R.def.wet) return;
    var f = B.roam.flags, has = (B.inv || []).some(function (x) { return x.id === 'bucket' && x.n > 0; }), want = !has && !f.otyughFed && !f.otyughDead;
    B.wet = B.wet || {}; var bk = B.wet.bucket, laid = !!(bk && B.map.props.indexOf(bk.prop) >= 0); // (on this map: a map loaded again has none)
    if (want && !laid) { var g0 = G.map; G.map = B.map; D.wet.layBucket(B, R.def.from8(3, 7)); G.map = g0; B.map.sorted = null; }
    else if (!want && bk) { var i = laid ? B.map.props.indexOf(bk.prop) : -1; if (i >= 0) B.map.props.splice(i, 1); B.wet.bucket = null; B.map.sorted = null; }
  };
  // the bucket at the deep station's crate (js/events.js S.bucket): taken up into the pack, in the hand of the one who took it -- the Settling reads both (js/wet.js)
  R.bucketScene = function* (B, trig, at) {
    var R0 = B.roam, f = R0.flags;
    if (f.otyughFed || (B.inv || []).some(function (x) { return x.id === 'bucket' && x.n > 0; })) { B.card(['{g}The crate. The bucket is ' + (f.otyughFed ? 'down in the deep water.' : 'with you.') + '{/}'], 220); yield 20; return; }
    R.give(B, 'bucket', 1, 'the deep station\'s crate');
    f.bucketBy = R0.token.id; D.sfx('chest'); R.bucketProp(B);
    B.card(['{y}' + R0.token.name + '{/} takes up the deep station\'s bucket, rope and all.'], 260); yield 30;
  };

  // ------------------------------------------------------------------ a fight elsewhere, pulled in, and back
  R.pullIn = function* (B, which, trig, at, start, how) {
    var R0 = B.roam; R0.pulling = which; // (till its last line is said: the bench waits on it)
    try { yield* R.pullIn0(B, which, trig, at, start, how); } finally { delete R0.pulling; }
  };
  R.pullIn0 = function* (B, which, trig, at, start, how) {
    var R0 = B.roam, done = null, hp = {}, own0 = R.owned(B);
    // (and the light in each hand, and what lasts past a fight -- Mage Armor, the day's Darkvision, a Continual Flame: 10-14, his "check landlord handoff as well")
    R0.members.forEach(function (u) { hp[u.id] = { hp: u.hp, ko: !!u.ko, slots: (u.slots || []).slice(), feats: JSON.parse(JSON.stringify(u.feats || {})), torch: u.torch ? JSON.parse(JSON.stringify(u.torch)) : null, conds: R.lasting(u.conds) }; });
    var o = Object.assign({}, R.party0, { fightDef: null, fight: which === 'keeper' ? 'keeper' : 'wet', onDone: function (res) { done = res || 'out'; } });
    delete o.embed; // (the floor's 8-bit options are the floor's: a pulled-in fight is the grid's own, its party and pack handed in and back below)
    // the floor's own state goes in with them, as the 8-bit's seam sends it (js/embed.js): the flags it has set (the landlord fed, who holds the bucket, the dead) and the
    // pack as it stands (the bucket in it) -- and comes back out below (10-13, his play: "they did the bucket then left the zone, and the bucket refreshed and was triggered again")
    var base0 = o.ladder ? D.save.fixture(Math.min(9, R.party0.level)) : R.emb ? R.emb.save : D.save.load().data; delete o.ladder;
    o.data = JSON.parse(JSON.stringify(base0));
    o.data.flags = Object.assign({}, o.data.flags || {}, R0.flags);
    var fam0 = R.famOut(R0); // (the familiar goes in as the floor has it: its hit points now, or not at all once it fell -- the fight's own FM.unit reads flags.familiar)
    if (fam0 && o.data.flags.familiar) { if (fam0.gone) delete o.data.flags.familiar; else o.data.flags.familiar = Object.assign({}, o.data.flags.familiar, { hp: fam0.hp }); }
    // each sheet as it walks: the level and the XP the floor's fights paid (R.pay), not the fixture's fresh copy
    o.data.party = (o.data.party || []).map(function (h) { var w = R0.members.filter(function (u) { return u.id === h.id && u.src; })[0]; return w ? JSON.parse(JSON.stringify(w.src)) : h; });
    o.data.inv = JSON.parse(JSON.stringify(B.inv || []));
    o.data.kills = JSON.parse(JSON.stringify(R0.kills || {})); o.data.silver = R0.silver; // (the tally and the purse go in as the 8-bit's seam sends them)
    if (which === 'keeper') o.start = start || (trig.id === 'mark' ? 'rune' : 'ledge');
    else o.wake = R.WAKE[trig.id];
    var b = new D.Battle(o), e0 = b.enter, leadId = R0.token.id;
    b.enter = function () {
      e0.apply(this, arguments);
      // the four as they walked: their hit points from the floor
      this.units.forEach(function (u) {
        var h = hp[u.id]; if (!h || u.side !== 'party') return;
        u.hp = Math.min(u.maxhp, h.hp); if (u.hp <= 0) u.ko = true; u.slots = h.slots.slice(); u.feats = JSON.parse(JSON.stringify(h.feats)); // (and the slots and the uses they spent on the floor)
        Object.assign(u.conds, h.conds); if (h.torch) u.torch = JSON.parse(JSON.stringify(h.torch)); else delete u.torch; L.regrip(u); // (the light as each carried it on the floor)
      });
      this.roamInv0 = R.counts(this.inv); // (the pack as this fight holds it at the start, its loan in it: what comes back is the change from here -- R.packBack)
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
      this.focus(lead); // (the camera on the party where it stepped in, not on the map's own way in -- 10-14, his play: "the camera goes to somewhere around 5, 13")
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
    // (the Settling goes in and out without a seam -- RULED 10-14, Griz: "3 - as leaned": its squares are the floor's own, so no card, no wait and no word back; its own fight
    // still runs it, the sleepers and the pictures and the drain. The Keeper keeps its card: another room, its own map)
    if (which === 'keeper') { B.card(['{r}THE KEEPER OF THE FLOODED STAIR{/}: its own fight, pulled in.'], 200); D.sfx('encounter'); yield 40; }
    R.stats.pull = (R.stats.pull || 0) + 1;
    D.push(b);
    while (!done) yield 1; // (the floor waits under it: only the top scene runs -- js/core.js)
    // back on the floor: the four's hit points as the fight left them; the trigger spent if the fight was won
    D.battle = B; G.setup(B.map, B.units); D.iso.map = B.map;
    // what was said in there, in the floor's log after it (the pulled-in fight's own log goes with it: his pane history had nothing of a Settling, 10-14)
    var tag = which === 'keeper' ? '[the Keeper] ' : '[the Settling] ';
    B.logEntries = (B.logEntries || []).concat((b.logEntries || []).map(function (e) { return { id: null, text: e.text.replace(/^(R\d+ )/, '$1' + tag) }; }));
    B.log = B.logEntries.map(function (e) { return e.text; });
    // each of the four as that fight left them (the 8-bit seam's own crossings, js/embed.js): hit points, slots and uses; what lasts (Mage Armor, Darkvision, a Continual Flame);
    // the max HP the herd drained, for good; EQUIP done in there (a weapon drawn, a shield slung -- 10-14, his "used crossbow in fight, dagger equipped after": a swap in a pulled-in
    // fight wrote only that fight's copy of the sheet, while its pack came back whole with the stowed weapon in it); the light still lit in a hand
    (b.units || []).forEach(function (u) {
      var w = R0.members.filter(function (m) { return m.id === u.id; })[0]; if (!w) return;
      if (u.drained) { w.maxhp = Math.max(1, w.maxhp - u.drained); if (w.src) w.src.maxhp = Math.max(1, w.src.maxhp - u.drained); w.drained = (w.drained || 0) + u.drained; }
      w.hp = Math.max(0, Math.min(w.maxhp, u.hp)); w.ko = w.hp <= 0; w.conds = R.lasting(u.conds); w.slots = (u.slots || []).slice(); w.feats = JSON.parse(JSON.stringify(u.feats || {}));
      if (w.src && u.src && u.src.equip) ['weapon', 'shield', 'armor'].forEach(function (k) { if (k in u.src.equip) w.src.equip[k] = u.src.equip[k]; });
      if (u.torch && u.torch.lit !== false && u.hp > 0) w.torch = JSON.parse(JSON.stringify(u.torch)); else delete w.torch;
    });
    var famB = (b.units || []).filter(function (u) { return u.familiar && u.side === 'party'; })[0];
    if (R0.fam && famB) R0.fam.hp = Math.max(0, famB.dead ? 0 : famB.hp); // (the familiar as that fight left it: hurt, or fallen and off the floor -- R.famPlace)
    Object.assign(R0.flags, b.flags8 || {}); // (what it set: otyughFed, bucketBy, heard:r-stream, landlordSpoke, the dead -- the rim's trigger reads otyughFed and otyughDead)
    R.packBack(B, b); // (the pack: what that fight used or found -- the bucket taken up or gone into the water, a potion drunk, a weapon stowed -- not its loan)
    R.regear(B); // (each figure's weapon and AC read again off the sheet EQUIP changed)
    // (what that fight changed of all the party owns, in the ledger as that fight's own: the pack's check at the stairs reads it -- R.handback)
    var own1 = R.owned(B); Object.keys(own1).concat(Object.keys(own0)).forEach(function (id, i, a) { if (a.indexOf(id) !== i) return; var d = (own1[id] || 0) - (own0[id] || 0); if (d) R0.ledger.push({ id: id, n: d, why: which === 'keeper' ? 'the Keeper\'s fight' : 'the Settling' }); });
    // what fell in there (the Settling's own count, js/wet.js W.killed -- the three by name, each crawler; the Keeper's fight by kind): XP banked and the tally kept; won, the spoils
    // (the Settling counts a walk-out with something dead behind it a win, as the 8-bit's does)
    var ids8 = which === 'wet' ? (b.enemies8 || (done === 'fed' && D.wet && D.wet.killed && b.wet ? D.wet.killed(b) : []))
      : (b.units || []).filter(function (u) { return u.side === 'foe' && !u.summon && !u.fled && !u.left && (u.dead || u.hp <= 0); }).map(function (u) { return (D.id8 ? D.id8(u.kind) : u.kind) || u.kind; });
    var fell8 = done === 'lost' ? [] : R.fallen8(B, ids8), loot8 = done === 'won' || (done === 'fed' && ids8.length) ? R.spoils(B, fell8) : [];
    if (done === 'won') R0.spent[trig.id] = 1;
    if (which === 'wet' && done === 'won') ['jelly', 'jellyNorth', 'poolOoze', 'landlordStep'].forEach(function (id) { R0.spent[id] = 1; });
    if (which === 'keeper' && done === 'won') { ['stair', 'mark'].forEach(function (id) { R0.spent[id] = 1; }); R0.flags.keeperDone = 1; }
    if (which === 'keeper' && done !== 'won' && done !== 'lost') R0.flags.keeperAwake = 1; // (a run leaves it awake and unbeaten: the rope then fights it by the rune -- the 8-bit's, 10-04)
    // the Settling's squares are the floor's own: the token back where the party left it -- a square past the one who got out (off the Settling's ground, the way
    // they went), or where the first still standing ended (10-13, his play: "Barleys wet exit of landlord scene put them back at waters edge")
    if (which === 'wet') {
      var ws = (b.units || []).filter(function (u) { return u.side === 'party' && !u.familiar && !u.summon; });
      var outU = ws.filter(function (u) { return u.left; })[0], upU = ws.filter(function (u) { return !u.left && u.hp > 0 && !u.dead; })[0], src = outU || upU;
      if (src) {
        var wW = (D.MAPS.wet.rows[0] || '').length, tok = R0.token, q0 = [src.x, src.y], best = null;
        if (outU) for (var pass = 0; pass < 2 && !best; pass++) for (var dy = -1; dy <= 1 && !best; dy++) for (var dx = -1; dx <= 1 && !best; dx++) { var nx = src.x + dx, ny = src.y + dy, s1 = G.map.at(nx, ny); if (s1 && s1.walk && nx >= wW && G.canStand(tok, nx, ny) && (pass || !R.trapAt(B, nx, ny))) best = [nx, ny]; } // (off a trigger square first: away is away)
        if (!best && G.canStand(tok, q0[0], q0[1])) best = q0;
        if (!best) for (var r = 1; r <= 3 && !best; r++) for (var dy2 = -r; dy2 <= r && !best; dy2++) for (var dx2 = -r; dx2 <= r && !best; dx2++) if (G.canStand(tok, q0[0] + dx2, q0[1] + dy2)) best = [q0[0] + dx2, q0[1] + dy2];
        if (best) { tok.x = best[0]; tok.y = best[1]; tok.tween = null; G.setup(G.map, B.units); }
      }
    }
    B.focus(R0.token);
    if (done === 'fed') B.card(['{y}The landlord settles under the water.{/}', '{g}The party gathers into ' + R0.token.name + '.{/}'], 260); else if (which !== 'wet') B.card(['{y}Back on the Wet{/} (' + done + ').'], 260);
    if (done === 'fed') { FX.ring(R0.token, 'glow', 22); D.sfx('popup'); }
    if (!R.standing(R0).length) { R0.mode = 'over'; if (R.emb) { yield* R.leaveFloor(B, 'lose', null); return; } B.card(['{r}The party has fallen.{/}  R to walk the Wet again.'], 100000); return; }
    // the gather pays (R.pay): what fell in there, and the landlord fed from the bucket -- a quarter again its XP, once (js/rules.js R.fedPool, the 8-bit's EV.fedXp)
    var xpL = R.pay(B), fedL = [];
    if (R0.flags.otyughFed && !R0.flags.otyughFedXp) { R0.flags.otyughFedXp = 1; fedL = R.pay(B, window.DS.R.fedPool(), R.say8('w.fedXp')); }
    if (xpL.length || loot8.length) { B.card(R.wrap([done === 'won' ? '{y}Victory!{/}' : '{y}What fell{/}'].concat(xpL, loot8)), 420); yield 40; }
    if (fedL.length) { B.card(R.wrap(fedL), 360); yield 40; }
    yield* R.picks(B);
    // the Keeper beaten: it sinks back, and the five come up (the 8-bit's S.stair and S.mark: the rope's haul or its going, then fiveUp)
    if (which === 'keeper' && done === 'won') yield* R.five(B, how === 'rope' ? 'w.ropeOut' : 'w.keeperGone');
  };
  R.standing = function (R0) { return R0.members.filter(function (u) { return u.hp > 0 && !u.dead; }); };
  // a square that does something when the party stands on it: a step trigger live on it, the stair's first row asking, a way off the floor
  R.trapAt = function (B, x, y) {
    var p = R.def.to8(x, y);
    return !!(R.triggerAt(B, p[0], p[1], 'step') || R.wadeAsk(B, [x, y]) || (R.def.doors || []).some(function (d) { return d[0] === x && d[1] === y; }));
  };
  // what a condition-set keeps past a fight (the 8-bit's finish clears the rest; js/embed.js carries these): Mage Armor till the long rest, the day's Darkvision, a Continual Flame
  R.LASTING = ['mageArmor', 'darkvision', 'continualFlame', 'aid'];
  R.lasting = function (c) { var o = {}; R.LASTING.forEach(function (k) { if (c && c[k]) o[k] = JSON.parse(JSON.stringify(c[k])); }); return o; };
  R.counts = function (inv) { var c = {}; (inv || []).forEach(function (s) { var id = Array.isArray(s) ? s[0] : s.id, n = Array.isArray(s) ? s[1] : s.n; c[id] = (c[id] || 0) + (n || 0); }); return c; };
  // a pulled-in fight's pack handed back as the change it made (js/embed.js's inv0 and inv1): what it used gone, what it found or stowed added, never below none -- so the
  // loan every grid fight not opened from inside the 8-bit lends (js/save.js SV.armoury: a crossbow, bolts, arrows, a rope) never comes back as the floor's. A lantern set down
  // and left burning there is taken up as it ends, as the seam's
  R.packBack = function (B, b) {
    var c0 = b.roamInv0 || {}, c1 = R.counts(b.inv);
    (b.lights || []).forEach(function (l) { if (l.kind === 'lantern' && l.item) c1[l.item] = (c1[l.item] || 0) + 1; });
    var ids = Object.keys(c0).concat(Object.keys(c1)).filter(function (id, i, a) { return a.indexOf(id) === i; });
    ids.forEach(function (id) {
      var d = (c1[id] || 0) - (c0[id] || 0); if (!d) return;
      if (d > 0) R.addPack(B, id, d); else { var s = (B.inv || []).filter(function (x) { return x.id === id; })[0]; if (s) s.n = Math.max(0, s.n + d); }
    });
  };

  // ------------------------------------------------------------------ what the fights pay (RULED 10-14, Griz: "perfect for the roam seat", on the desk's lean -- his "1. Roam should do
  // the xp rewards when it goes back to party token?" and "2. We got really fancy-ish (compare with SRD) to allow parties to flee random encounters on the grid"): each foe's XP
  // counts when it falls and is paid at the next gather, won or got away; those still up carry theirs into the pursuit or the lost and pay when they fall; the split is
  // among those standing at the gather and the guests fielded (the 8-bit's rule); coin, drops and parts on a win only (a getaway forfeits them, as the 8-bit's run
  // does); the kill tally at the fall either way (the stock's fork reads it). The rules are js/rules.js's, the 8-bit finish's own (R.tally, R.spoils, R.shareXP)
  R.addPack = function (B, id, n) { var s = (B.inv || []).filter(function (x) { return x.id === id; })[0]; if (s) s.n = (s.n || 0) + n; else (B.inv = B.inv || []).push({ id: id, n: n }); };
  // a thing the floor gives (the spoils, the five's gear, the bucket), written in the floor's ledger for the pack's check at the stairs (R.handback)
  R.give = function (B, id, n, why) { R.addPack(B, id, n); if (B.roam && B.roam.ledger) B.roam.ledger.push({ id: id, n: n, why: why || 'found' }); };

  // ------------------------------------------------------------------ the pack at the stairs (10-14, Griz: "check and see if a 'leaving map' inventory handoff check would help on map
  // exit stairs" -- then "needs built - go"). What the party OWNS -- the pack, what each of the four holds and wears, a light of theirs left burning on the floor -- is counted as it
  // walks onto the floor (R0.pack0); the floor's ledger writes every gain it makes (R.give) and a pulled-in fight's whole change (R.pullIn); at a way off the floor the hand-back
  // is the pack's change since it walked on (what the 8-bit's pack takes: js/embed.js's inv0 and inv1), and the check flags a thing that grew with nothing in the ledger for it,
  // or a key thing (the five's gear, the bucket, the Ledger-Lamp, a named weapon) gone with nothing to say where. A swap, a light set down and taken up, a lantern put away:
  // moves between hand, floor and pack, never counted
  R.owned = function (B) {
    var R0 = B.roam, c = R.counts(B.inv), add = function (id) { if (typeof id === 'string' && window.DS.DATA.items[id]) c[id] = (c[id] || 0) + 1; };
    R0.members.forEach(function (u) {
      var e = u.src && u.src.equip; if (e) Object.keys(e).forEach(function (k) { [].concat(e[k]).forEach(add); });
      if (u.torch) add(L.kindOf(u.torch) === 'lantern' ? (u.torch.item || 'lantern') : 'torch');
    });
    (B.lights || []).forEach(function (l) { if ((l.kind === 'torch' || l.kind === 'lantern') && R0.members.some(function (m) { return m.id === l.by; })) add(l.kind === 'lantern' ? (l.item || 'lantern') : 'torch'); });
    return c;
  };
  // ------------------------------------------------------------------ off the floor, inside the 8-bit (the seam): everything the floor changed goes back by one message (deep16/js/embed.js
  // E.roamOut, 'd16:roam'; js/embed.js there applies it and takes its own warp from the square). Each sheet whole -- the XP and levels the floor paid (R.pay), its hurt, slots and
  // uses, what lasts, its EQUIP, the light in its hand; the pack as the change since the party walked on (inv0 and inv1, as a fight's -- R.handback's check said with it); the
  // flags, the kill tally and the purse as the floor left them; the 8-bit square they left by. A fall is the 8-bit's game over
  // the message itself: R.leaveFloor's at a way off the floor ('d16:roam'), R.handOut's from the middle of it ('d16:hand')
  R.handMsg = function (B, type, result, at) {
    var R0 = B.roam, hb = R.handback(B), inv1 = R.counts(B.inv);
    (B.lights || []).forEach(function (l) { if (l.kind === 'lantern' && l.item && R0.members.some(function (m) { return m.id === l.by; })) inv1[l.item] = (inv1[l.item] || 0) + 1; });
    var party = R0.members.filter(function (u) { return u.src; }).map(function (u) {
      var h = JSON.parse(JSON.stringify(u.src));
      h.hp = Math.max(0, Math.min(h.maxhp, u.hp)); h.ko = h.hp <= 0; h.slots = (u.slots || []).slice(); h.feats = JSON.parse(JSON.stringify(u.feats || {}));
      h.conds = Object.assign({}, h.conds || {}, R.lasting(u.conds)); if (!(u.conds && u.conds.mageArmor)) delete h.conds.mageArmor;
      return { id: h.key || h.id, guest: !!h.guest, sheet: h, torch: u.torch && u.torch.lit !== false && u.hp > 0 ? (L.kindOf(u.torch) === 'lantern' ? (u.torch.item || 'lantern') : 'torch') : false };
    });
    return { type: type, result: result, exit8: at ? R.def.to8(at[0], at[1]) : null, party: party, inv0: R0.inv0 || {}, inv1: inv1, flags: JSON.parse(JSON.stringify(R0.flags)),
      kills: JSON.parse(JSON.stringify(R0.kills || {})), silver: R0.silver, warn: hb.warn, order: R0.members.map(function (u) { return u.src ? (u.src.key || u.src.id) : u.id; }),
      familiar: R.famOut(R0) }; // (as a fight hands it back: js/embed.js famBack)
  };
  R.leaveFloor = function* (B, result, at) {
    var R0 = B.roam; if (R0.out) return; R0.out = true; R0.mode = 'over';
    var msg = R.handMsg(B, 'd16:roam', result, at);
    R.lastOut = msg;
    if (D.embed && D.embed.roamOut) D.embed.roamOut(msg);
    yield 1;
  };
  // a hand-back from the middle of the floor (10-14, Griz: "SAVE on the floor and the cradles by a hand-back to the 8-bit, then reopen the floor where they stood"), inside the
  // 8-bit only: everything the floor changed goes over as at a stair (R.handMsg, 'd16:hand') with the square the token stands on and the way it faces; the 8-bit sets the frame
  // aside, plays its own scene (js/embed.js DS.roam8.hand) and sends back what that scene changed ('ds8:resume': deep16/js/embed.js, R.resumed). The floor never closes -- its
  // groups, its spent triggers, the formation stay as they were -- and its count starts again from what it handed over (the pack's baseline, the ledger), so the stair hands
  // nothing over twice. Returns the 8-bit's word, or null outside the 8-bit
  R.DIR8 = { '-1,0': 'up', '1,0': 'down', '0,-1': 'right', '0,1': 'left' }; // (the 8-bit's facing for the token's: R.setup's fw8 the other way)
  R.handOut = function* (B, kind, extra) {
    var R0 = B.roam, t = R0.token;
    if (!R.emb || !D.embed || !D.embed.roamOut) return null;
    var msg = Object.assign(R.handMsg(B, 'd16:hand', null, [t.x, t.y]), { kind: kind, dir: R.DIR8[R0.fw[0] + ',' + R0.fw[1]] || null }, extra || {});
    var mode0 = R0.mode; R0.mode = 'hand'; R0.resume = null; R.lastHand = msg;
    D.embed.roamOut(msg);
    while (!R0.resume) yield 1;
    var m = R0.resume; R0.resume = null; R0.mode = mode0;
    // what the 8-bit's scene changed, on the floor too: the pack by id (and in the baseline, since the 8-bit holds it already), the flags, the purse
    var inv0 = JSON.parse(JSON.stringify(msg.inv1));
    Object.keys(m.inv || {}).forEach(function (id) {
      var d = m.inv[id], s = (B.inv || []).filter(function (x) { return x.id === id; })[0];
      if (s) s.n = Math.max(0, s.n + d); else if (d > 0) (B.inv = B.inv || []).push({ id: id, n: d });
      inv0[id] = Math.max(0, (inv0[id] || 0) + d);
    });
    Object.assign(R0.flags, m.flags || {}); if (m.silver != null) R0.silver = m.silver;
    // and each hero as the 8-bit left it (a field action's, a scene's: R.act, R.scene8), onto its figure; the kill tally a fight in there added to; the square the scene left
    // the party on (a fight run from walks them off the stair)
    (m.party || []).forEach(function (r) { var u = R0.members.filter(function (w) { return w.src && (w.src.key || w.src.id) === r.id; })[0]; if (u) R.resheet(B, u, r.sheet); });
    if (m.kills) R0.kills = JSON.parse(JSON.stringify(m.kills));
    if (m.at8 && msg.exit8 && (m.at8[0] !== msg.exit8[0] || m.at8[1] !== msg.exit8[1])) { var q8 = R.def.from8(m.at8[0], m.at8[1]); if (G.canStand(t, q8[0], q8[1])) { t.x = q8[0]; t.y = q8[1]; t.tween = null; G.setup(G.map, B.units); B.focus(t); } }
    R0.inv0 = inv0; R0.pack0 = R.owned(B); R0.ledger = [];
    // a level in there (a fight's XP): its picks on the floor, as at a gather (R.picks)
    if (m.party) { R.regear(B); R0.picksDue = R0.members.filter(function (u) { return u.src && window.DS.R.picksDue(u.src); }); yield* R.picks(B); }
    return m;
  };
  R.resumed = function (m) { var B = (D.embed && D.embed.B) || D.battle; if (B && B.roam) B.roam.resume = m; };
  // the M menu's field actions out of a fight (10-14, Griz: "yes to both - this is how we'll be doing all the dwarf road and stuff after, so we do it all and do it right as best
  // we can"): a cast, a skill, an item the floor does not use itself (the tent, a sheet to learn -- a potion, a light and the grapple are the floor's) are the 8-bit's own, run as
  // its field menu runs them (js/embed.js DS.roam8.act: EV.fieldCast, EV.fieldSkill, EV.useFieldItem -- where a rest may be had, a slot, a component, all its rules), by a
  // hand-back from where the party stands; each hero comes back as it left them (R.resheet). Named by id: the hero, the spell, the one it is cast on
  R.actOut = function (B, a, unitOf) {
    var R0 = B.roam, idOf = function (h) { var u = h && unitOf ? unitOf(h) : null; return u && u.src ? (u.src.key || u.src.id) : h && h.id || null; };
    if (!R.emb) { B.card(R.wrap(['{g}Spells, skills and that out of a fight are the 8-bit\'s own: inside the game the floor hands the party back for them (?at=roam).{/}']), 240); return true; }
    var spells = window.DS.DATA.spells || {}, spId = a.sp ? (a.sp.id || Object.keys(spells).filter(function (k) { return spells[k] === a.sp; })[0] || null) : null;
    (R0.acts = R0.acts || []).push({ kind: a.kind, h: idOf(a.h), id: a.id || null, sp: spId, s: a.s != null ? a.s : null, t: idOf(a.t) });
    R0.keys.push('act'); B.menu = null; if (B.menuClosed) B.menuClosed();
    return true;
  };
  R.act = function* (B) { var R0 = B.roam, a = (R0.acts || []).shift(); if (a) yield* R.handOut(B, 'act', { act: a }); };
  // SAVE on the floor (10-14, his "SAVE on the floor ... by a hand-back"): out of a fight, nothing coming, inside the 8-bit, where the 8-bit's own map lets a save be made (every
  // dungeon floor's is save=False -- tools/mapgen.py: his "yes to both", 10-14, SAVE greyed as the 8-bit greys it) -- the 8-bit's own slots, on the square the party stands on
  // (a load opens the floor there again: js/deep.js); the M menu's SAVE (deep16/js/ui.js gridHost canSave, through B.menuSave, and R.menuAct)
  R.canSave = function (B) { var R0 = B.roam; return !!(R.emb && D.embed && D.embed.roamOut && R0.mode === 'walk' && !R.tracking(R0).length && R.def.src8 && R.def.src8.save !== false); };
  R.save = function* (B) { var m = yield* R.handOut(B, 'save'); if (m && m.saved) { B.card(['{g}' + m.saved + '{/}'], 200); yield 10; } };
  // a cradle (the 8-bit's deep rate, RULED 09-30g; js/events.js EV.deepRate): the 8-bit's own scene by a hand-back, the floor again after it; the animal roused, the fight is on
  // the floor at its cradle -- the milker on the square the party worked it from, stiff with the poison if the touch took (the Settling's harness: deep16/js/wet.js)
  R.cradle = function* (B, trig, at) {
    var R0 = B.roam;
    if (!R.emb) { B.card(R.wrap(['{y}the cradle{/}: the deep rate is the 8-bit\'s own scene -- inside the game the floor hands the party back for it (?at=roam).']), 300); D.sfx('popup'); yield 30; return; }
    var m = yield* R.handOut(B, 'cradle', { n: +String(trig.id).replace(/\D/g, '') || 0 }), c = m && m.cradle;
    if (!c || !c.roused) return;
    yield* R.encounter(B, 'set', { list: ['crawler'], at: at, line: R.say8('w.deepRoused'), how: 'loose at its cradle', onSpill: function (B2) {
      var mk = R0.members.filter(function (u) { return u.id === c.milker && u.hp > 0; })[0], ld = R0.token;
      if (mk && mk !== ld) { var x = mk.x, y = mk.y; mk.x = ld.x; mk.y = ld.y; ld.x = x; ld.y = y; G.setup(G.map, B2.units); }
      if (mk && c.touched) { mk.conds.poisoned = { paralysis: true }; mk.conds.paralyzed = { save: 'con', dc: 13, by: 'harness', poison: true }; }
    } });
  };
  // the hand-back said at a way off the floor: what the 8-bit's pack would take, and the check's word
  R.packCard = function (B) {
    var hb = R.handback(B);
    B.card(R.wrap(['{y}THE PACK HANDED BACK{/}: ' + (hb.lines.join(', ') || 'as it came')].concat(hb.warn.length ? ['{r}CHECK{/}: ' + hb.warn.join('; ')] : ['{g}every change accounted for{/}'])), 420);
    return hb;
  };
  R.keyItem = function (id) { var it = window.DS.DATA.items[id]; return !!(it && (it.kind === 'key' || it.noSell)); };
  R.handback = function (B) {
    var R0 = B.roam, now = R.owned(B), exp = {}, out = { pack: {}, owned: {}, warn: [] }, nm = function (id) { var it = window.DS.DATA.items[id]; return it ? it.name : id; };
    (R0.ledger || []).forEach(function (e) { exp[e.id] = (exp[e.id] || 0) + e.n; });
    var uni = function () { var a = []; [].slice.call(arguments).forEach(function (o) { Object.keys(o).forEach(function (k) { if (a.indexOf(k) < 0) a.push(k); }); }); return a; };
    uni(now, R0.pack0 || {}, exp).forEach(function (id) {
      var d = (now[id] || 0) - ((R0.pack0 || {})[id] || 0), x = exp[id] || 0; if (d) out.owned[id] = d;
      if (d > x) out.warn.push('+' + (d - x) + ' ' + nm(id) + ', with nothing in the ledger for it');
      else if (d < x && R.keyItem(id)) out.warn.push((d - x) + ' ' + nm(id) + ', gone with nothing to say where');
    });
    var p0 = R0.inv0 || {}, p1 = R.counts(B.inv);
    uni(p0, p1).forEach(function (id) { var d = (p1[id] || 0) - (p0[id] || 0); if (d) out.pack[id] = d; });
    out.lines = Object.keys(out.pack).map(function (id) { return (out.pack[id] > 0 ? '+' : '') + out.pack[id] + ' ' + nm(id); });
    R0.lastHandback = out;
    if (out.warn.length && window.console) console.warn('THE ROAM, the pack at the stairs: ' + out.warn.join('; '));
    return out;
  };
  R.dice = function () { return { roll: function (e) { return D.roll(e).total; }, rng: D.rand }; };
  R.mon8 = function (id8) { return window.DS.DATA.monsters[id8]; };
  // the ones of this fight that fell (not those that fled or slunk off, not a foe's summoning): XP banked, the tally kept, once each. Returns them as the 8-bit's
  // spoils read them ({ m, id, surrendered })
  R.fallen = function (B, foes, zone) {
    var R0 = B.roam, out = [];
    (foes || []).forEach(function (u) {
      if (u.roamFell || u.summon || u.roamBorn || u.left || u.fled || !(u.dead || u.hp <= 0)) return; // (a split half pays nothing of its own: the 8-bit pays the jelly once)
      var id8 = (D.id8 ? D.id8(u.kind) : u.kind) || u.kind, m = R.mon8(id8); u.roamFell = true;
      if (!m) return;
      R0.xpBank += m.xp || 0; window.DS.R.tally(R0.kills, [id8], zone);
      out.push({ m: m, id: id8, surrendered: !!(u.surrendered || u.yielded) });
    });
    return out;
  };
  // the fallen of a pulled-in fight, by the 8-bit's ids (the Settling's own count, js/wet.js W.killed; the Keeper by its kind)
  R.fallen8 = function (B, ids) {
    var R0 = B.roam, out = [];
    ids.forEach(function (id8) { var m = R.mon8(id8); if (!m) return; R0.xpBank += m.xp || 0; window.DS.R.tally(R0.kills, [id8]); out.push({ m: m, id: id8 }); });
    return out;
  };
  // a won fight's spoils, into the pack and the purse; the lines to say
  R.spoils = function (B, fell) {
    var R0 = B.roam; if (!fell.length) return [];
    var sp = window.DS.R.spoils(fell, R.standing(R0).map(function (u) { return u.src; }).filter(Boolean), R.dice(), function (id, n) { R.give(B, id, n, 'the spoils'); });
    R0.silver += sp.silver;
    return sp.lines;
  };
  // the gather: the bank paid to those standing and the guests fielded, each sheet's level-ups carried onto its figure. Returns the lines
  R.pay = function (B, pool, line) {
    var R0 = B.roam, xp = pool != null ? pool : R0.xpBank; if (pool == null) R0.xpBank = 0;
    if (!(xp > 0)) return [];
    var up = R.standing(R0), heroes = up.filter(function (u) { return u.src; });
    var guests = B.units.filter(function (u) { return u.side === 'party' && u.guest && !u.familiar && !u.summon && !u.object && u.hp > 0 && R0.members.indexOf(u) < 0; }).length;
    var before = heroes.map(function (u) { return { u: u, lvl: u.src.lvl, feats: JSON.parse(JSON.stringify(u.src.feats || {})) }; });
    var sx = window.DS.R.shareXP(xp, heroes.map(function (u) { return u.src; }), guests);
    before.forEach(function (b) { if (b.u.src.lvl !== b.lvl) { R.relevel(B, b.u, b.feats); R0.picksDue = (R0.picksDue || []).concat([b.u]); } });
    var out = [];
    if (sx.each) out.push(line ? line.replace('{n}', sx.each) : sx.line);
    if (sx.ups.length) { D.sfx('levelup'); out = out.concat(sx.ups); }
    R0.xpPaid = (R0.xpPaid || 0) + sx.each; // (the bench reads it)
    return out;
  };
  // the level-up's choices, on the floor as in the 8-bit (10-14, Griz: "leveling up in the roam should work like leveling up in 8bit."): after the pay's card, the heroes
  // R.pay levelled with a pick due, on the one pick page over the floor (deep16/js/climb.js D.levelPicks, the level-up pick lane's), the script waiting under it as under
  // the M menu; then each figure brought up to its sheet again (a CON swap's hit points, the spell, the archetype). No one to ask (a bench): the build's picks at once
  R.picks = function* (B) {
    var R0 = B.roam, us = (R0.picksDue || []).filter(function (u, i, a) { return a.indexOf(u) === i && window.DS.R.picksDue(u.src); });
    R0.picksDue = [];
    if (!us.length || !D.levelPicks) return;
    var feats = us.map(function (u) { return JSON.parse(JSON.stringify(u.src.feats || {})); });
    yield 60; // (the level-up's lines read first: the 8-bit's page opens after them)
    yield* D.levelPicks(B, us.map(function (u) { return u.src; }));
    us.forEach(function (u, i) { R.relevel(B, u, feats[i]); });
  };
  // a figure brought up to its sheet after a level (js/rules.js R.levelUp changed the sheet; the figure walks on with its own hurt and spent slots): the new hit points
  // on top of what it has, the new slots added, a feat's new uses added, the rest read again off the sheet as js/save.js makes a figure (gear and AC: R.regear)
  R.relevel = function (B, u, feats0) {
    var h = u.src, n = D.save.unitOf(h, !!u.guest, B.fight);
    if (u.hp > 0) u.hp = Math.max(1, u.hp + n.maxhp - u.maxhp); u.maxhp = n.maxhp;
    var sm0 = u.slotsMax || []; u.slots = u.slots || [];
    (n.slotsMax || []).forEach(function (k, i) { u.slots[i] = (u.slots[i] || 0) + (k - (sm0[i] || 0)); }); u.slotsMax = (n.slotsMax || []).slice();
    u.feats = u.feats || {}; Object.keys(h.feats || {}).forEach(function (k) { var v = h.feats[k], v0 = feats0[k]; if (typeof v === 'number') { var dv = v - (typeof v0 === 'number' ? v0 : 0); if (dv) u.feats[k] = (u.feats[k] || 0) + dv; } else if (v0 === undefined) u.feats[k] = JSON.parse(JSON.stringify(v)); });
    R.SHEETF.forEach(function (k) { if (n[k] !== undefined) u[k] = n[k]; });
  };
  R.SHEETF = ['lvl', 'abil', 'prof', 'init', 'known', 'subclass', 'attacksBase', 'crit', 'spellDC', 'spellAtk', 'saves', 'stealth', 'perception', 'athletics', 'acrobatics', 'savage', 'style']; // (what a figure reads off its sheet: R.relevel, R.resheet)
  // a figure brought to its sheet as the 8-bit hands it back after its own scene (R.handOut: a cast's slot spent, a heal, a rest's hit points, slots and uses, a spell
  // learned or prepared, Mage Armor put on): the sheet taken whole but its EQUIP and the light (the floor's own, in hand), then the figure's hit points, slots, uses and what
  // lasts off it, and the rest read again as js/save.js makes a figure (gear and AC: R.regear, after)
  R.resheet = function (B, u, sh) {
    var h = u.src; if (!h || !sh) return;
    Object.keys(sh).forEach(function (k) { if (k !== 'equip' && k !== 'conds' && k !== 'key' && k !== 'guest') h[k] = sh[k]; });
    var n = D.save.unitOf(h, !!u.guest, B.fight);
    u.maxhp = n.maxhp; u.hp = Math.max(0, Math.min(u.maxhp, sh.hp != null ? sh.hp : u.hp)); u.ko = u.hp <= 0; if (u.hp > 0) u.dead = false;
    u.slotsMax = (n.slotsMax || []).slice(); u.slots = (sh.slots || n.slots || []).slice();
    u.feats = JSON.parse(JSON.stringify(sh.feats || n.feats || {}));
    var last = R.lasting(sh.conds || {}); u.conds = u.conds || {};
    Object.keys(R.lasting(u.conds)).forEach(function (k) { if (!(k in last)) delete u.conds[k]; }); Object.assign(u.conds, last);
    h.conds = Object.assign({}, h.conds || {}, last);
    R.SHEETF.forEach(function (k) { if (n[k] !== undefined) u[k] = n[k]; });
  };
  // the five brought up on the floor (js/rules.js R.fiveUp, the 8-bit's fiveUp's own: the flag, the tokens for Edric's book, the stock's fork) and the 8-bit's lines after the scene's own
  R.five = function* (B, first) {
    var R0 = B.roam;
    window.DS.R.fiveUp(R0.flags, function (id, n) { R.give(B, id, n, 'the five'); }, R0.kills); D.sfx('chest');
    B.card(R.wrap([].concat(first ? R.say8(first) : [], [R.say8('w.fiveRecovered'), R.say8('w.threshold')])), 420); yield 60;
  };

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
    var grp = { foes: placed, why: why, mode: 'approach', motivated: R.hunts(p.grp, placed), rolled: false, stall: 0, t: B.t, seenAt: distFt, flag: set && set.flag, trig: set && set.trig, onSpill: set && set.onSpill, zone: set ? null : R.zoneAt(B, t.x, t.y) || 'warrens_d' }; // (zone: the tally's, as the 8-bit's EV.encounter sends it)
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
    if (grp && grp.onSpill) grp.onSpill(B); // (a set fight's own seating after the spill: the cradle's milker -- R.cradle)
    B.exits = [];
    B.card(['{r}THE FIGHT{/}: ' + L0.contactFt + ' ft between them' + (why === 'yours' ? ' -- yours to open' : '') + '.', '{g}A way out: the stairs, or a square a full move clear of every one of them (the pale squares on your turn). One of you out takes the party with them.{/}'], 420);
    yield 50;
    R0.members.forEach(function (u) { if (u.wings) u.flies = true; }); // (the ring's wings, spread for the fight)
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
      // (a look spends a step's frames at most: while a card, a prompt or the menu holds the script, the floor holds too -- 10-14, his "fight now teleports staling opponents to
      // you": the encounter's card held the script 30 frames, the first look after spent them all at once, and the group jumped three squares as F opened the fight)
      var dt = Math.min(B.t - g.t, STEP); g.t = B.t;
      var live = R.live(B, g);
      if (!live.length) { R0.groups = R0.groups.filter(function (x) { return x !== g; }); return; }
      var seen = live.some(function (u) { return G.losPoint(u.x, u.y, t.x, t.y) && L.seesBy(B, u, t).ok; });
      if (g.mode === 'lost') { if (seen) { g.mode = 'approach'; g.rolled = false; B.card(['{r}' + R.whoOf(B, live) + '{/}: they have seen you again.'], 260); D.sfx('encounter'); } return; }
      // (the hold is a round's time -- 6 of the token's steps, a step's 8 frames each, walked or stood: a party standing still is still come for)
      if (g.stall > 0 && dt > 0) { g.stall = Math.max(0, g.stall - dt / STEP); dt = 0; }
      if (dt > 0 && !(g.stall > 0)) live.forEach(function (u) {
        var sp = Math.max(u.speed || 30, (u.fly || 0)), x0 = u.x, y0 = u.y;
        u.racc = (u.racc || 0) + dt * (sp / 30) / STEP;
        while (u.racc >= 1) {
          u.racc -= 1;
          var path = R.pathToward(u, t), nx = path && path[0];
          if (!nx || (nx[0] === t.x && nx[1] === t.y) || !G.canStand(u, nx[0], nx[1])) { u.racc = 0; break; }
          u.tween = { fx: x0, fy: y0, fz: 0, t: 0, dur: STEP, mode: null }; u.facing = D.spr.facingFor(nx[0] - u.x, nx[1] - u.y); // (from where this look found it: a fast one's two squares slide, not jump)
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
    R.famPlace(B); // (the familiar out with its wizard)
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
        // one the fight itself made -- a split half (the jelly's, the pudding's), a foe's summoning -- is of this fight (10-14, his play: "new enemies are created (split ooze thing
        // in pane)": the split half was in the order but not in the fight's foes, so the fight was won with it standing, and it stood on the floor after in no group)
        B.units.forEach(function (w) { if (w.side === 'foe' && !w.roamAside && !w.dead && foes.indexOf(w) < 0) { w.roamBorn = true; foes.push(w); } });
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
      if (R.emb) { yield* R.leaveFloor(B, 'lose', null); return; } // (inside the 8-bit: its game over)
      B.card(['{r}The party has fallen in the Wet.{/}  R to walk it again.'], 100000);
      return;
    }
    var outBy = R0.members.filter(function (u) { return u.left; })[0];
    var fell = R.fallen(B, foes, grp && grp.zone); // (XP banked and the tally kept at the fall, won or got away: paid at the gather below)
    var took = R.takeUpLights(B);
    var still = (foes || []).filter(function (u) { return !u.dead && u.hp > 0 && !u.left && !u.summon; }); // (a foe's summoning goes with the fight)
    B.units = B.units.filter(function (u) { return u.side === 'party' ? !u.summon && !u.object : !u.dead && u.hp > 0 && !(u.summon && foes && foes.indexOf(u) >= 0); });
    B.units.forEach(function (u) { delete u.roamAside; });
    // the fight's own state off the four as it ends (the 8-bit's finish: "clear battle-only state" -- 10-14, his "handoff issues between fight and out of fight"): a spell held
    // ends, and of the conditions only what lasts stays (R.lasting: Mage Armor, the day's Darkvision, a Continual Flame, Aid) -- prone, poisoned, blessed and the rest do not walk on
    R0.members.forEach(function (u) { if (u.conc && D.magic && D.magic.endConc) D.magic.endConc(B, u, 'the fight is over'); });
    R0.members.forEach(function (u) { if (u.left) { u.left = false; u.dead = false; } u.conds = R.lasting(u.conds); u.turn = null; if (B.units.indexOf(u) < 0) B.units.push(u); });
    R0.members.forEach(function (u) { u.wings = R.ringWings(u) || !!u.flies; u.flies = false; u.fz = 0; if (u.tween) u.tween.fz = 0; }); // (down out of the air as the fight ends: the floor is walked)
    G.setup(G.map, B.units); B.cache = null;
    var up = R.standing(R0), lead = up[0];
    if (!lead) { R0.mode = 'over'; return; }
    if (o === 'escaped' && outBy) {
      // one square past where the one who got out left: of the squares beside it, the one farthest by walking from the foes still up
      var fdist = function (x, y) { var best = Infinity; still.forEach(function (f) { var p = D.Battle.route(f, [x, y], false); best = Math.min(best, p ? p.length : 99); }); return best; };
      // (and not a trigger square, where one beside it is not: away is away -- 10-14, his play: "did a party escape with viv, then snapped back into fight coz ly was on trigger square")
      var meet = [outBy.x, outBy.y], md = (still.length ? fdist(outBy.x, outBy.y) : 0) - (R.trapAt(B, outBy.x, outBy.y) ? 1000 : 0);
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var nx = outBy.x + dx, ny = outBy.y + dy, s = G.map.at(nx, ny); if ((!dx && !dy) || !s || !s.walk || G.occupant(nx, ny)) continue;
        var d = (still.length ? fdist(nx, ny) : 0) - (R.trapAt(B, nx, ny) ? 1000 : 0); if (d > md) { md = d; meet = [nx, ny]; }
      }
      R0.members.forEach(function (u) { if (u !== lead) FX.sparkle(u, 'glow', 10); });
      lead.x = meet[0]; lead.y = meet[1]; lead.tween = null;
      // out by the floor's own stairs: off this floor -- the 8-bit takes the party on, and down again its groups are gone ("they'll have to exit and come back to make
      // the random encounter vanish"); the test keeps the party here, on the stair, with the floor's groups cleared
      var byStair = (G.map.def.doors || []).some(function (d) { return d[0] === outBy.x && d[1] === outBy.y; });
      if (byStair) {
        lead.x = outBy.x; lead.y = outBy.y;
        B.units = B.units.filter(function (u) { return still.indexOf(u) < 0; }); R.dropGroups(B);
        if (R.emb) { yield* R.leaveFloor(B, 'out', [outBy.x, outBy.y]); return; }
        B.card(['{y}Away{/}: ' + outBy.name + ' takes the stair, and the party with them.', '{g}Off the floor: the 8-bit would take you on, and back down its groups are gone. (The test keeps you here, the floor cleared.){/}'], 360);
        R.packCard(B);
        still = [];
      } else if (still.length) {
        g2 = { foes: still, why: 'pursuit', mode: 'pursue', motivated: !!(grp && grp.motivated), rolled: false, stall: grp && grp.motivated ? 0 : 6, t: B.t, flag: grp && grp.flag, trig: grp && grp.trig, zone: grp && grp.zone };
        R0.groups.push(g2);
        still.forEach(function (u) { u.racc = 0; u.anim = 'idle'; u.animT = B.t; });
      }
      if (!byStair) B.card(['{y}Away{/}: ' + outBy.name + ' gets clear, and the party with them -- into ' + lead.name + '.', still.length ? (grp && grp.motivated ? '{o}They come after you at once.{/}' : '{g}They hold a moment (6 steps) -- then follow your trail.{/}') : ''], 340);
    } else {
      var meet2 = [lead.x, lead.y];
      B.card(['{y}The way is clear.{/}', '{g}The party gathers into ' + lead.name + '.' + (took.length ? ' The light on the floor is taken up (' + took.join(', ') + ').' : '') + '{/}'], 300);
      // all of them at once, the whole way by the path (RULED 10-14, Griz: "1 yes" -- the gather walked each 12 steps and folded the rest in from wherever it stopped, a jump across
      // the floor when the lead had walked off from the fight); the fallen carried in
      var walkers = R0.members.filter(function (u) { return u !== lead && u.hp > 0; }).map(function (w) { return { w: w, path: D.Battle.route(w, meet2, false) || [] }; });
      R0.members.forEach(function (u) { if (u !== lead && u.hp <= 0) FX.sparkle(u, 'glow', 12); });
      // (one of ours in the way is walked through -- allies may; in a corridor the first to reach the lead stood on the only square beside it and the rest waited out the cap,
      // a long stall in his pane, 10-14 -- a foe in the way is walked round once; a step in which nobody moves ends the walk)
      for (var gs = 0; gs < 90 && walkers.some(function (k) { return k.path.length; }); gs++) {
        var moved = 0;
        walkers.forEach(function (k) {
          var nx = k.path[0]; if (!nx) return;
          if ((nx[0] === meet2[0] && nx[1] === meet2[1]) || Math.max(Math.abs(k.w.x - meet2[0]), Math.abs(k.w.y - meet2[1])) <= 1) { k.path = []; return; } // (beside the lead: in)
          var oc = G.occupant(nx[0], nx[1], k.w);
          if (oc && oc !== k.w && oc.side !== 'party') { if (k.rerouted) { k.path = []; return; } k.rerouted = true; k.path = D.Battle.route(k.w, meet2, true) || []; return; }
          k.path.shift(); moved++;
          k.w.tween = { fx: k.w.x, fy: k.w.y, fz: G.gzAt(k.w, k.w.x, k.w.y), t: 0, dur: STEP, mode: null }; k.w.facing = D.spr.facingFor(nx[0] - k.w.x, nx[1] - k.w.y);
          if (k.w.anim !== 'walk') { k.w.anim = 'walk'; k.w.animT = B.t; }
          k.w.x = nx[0]; k.w.y = nx[1];
        });
        G.setup(G.map, B.units);
        if (!moved && !walkers.some(function (k) { return k.rerouted && k.path.length; })) break;
        yield STEP;
      }
      walkers.forEach(function (k) { k.w.anim = 'idle'; k.w.animT = B.t; });
      if (grp && grp.flag) R0.flags[grp.flag] = 1; // (what is dead stays dead: an ooze's flag, as the 8-bit's)
      if (grp && grp.trig) [].concat(grp.trig).forEach(function (id) { R0.spent[id] = 1; });
    }
    var others = R0.members.filter(function (u) { return u !== lead; });
    R0.token = lead; R0.rest = others; R0.mode = 'walk';
    R.into(B, others);
    FX.ring(lead, 'glow', 22); D.sfx('popup');
    lead.anim = 'idle'; lead.animT = B.t;
    B.focus(lead);
    // the gather pays: the XP of everything that fell since the last one; on a win the coin, the drops and the parts off this fight's fallen (a getaway forfeits them)
    var paid = o === 'won' ? R.spoils(B, fell) : [], xpL = R.pay(B);
    if (paid.length || xpL.length) { B.card(R.wrap([o === 'won' ? '{y}Victory!{/}' : '{y}What fell{/}'].concat(xpL, paid)), 420); yield 30; }
    yield* R.picks(B);
    yield 20;
    if (g2) g2.t = B.t; // (their hold starts when the party can move again, not during the gather's beat)
    if (o === 'won') yield* R.landed(B); // (the square a won fight's gather ends on, once; a getaway sets the party down off any trigger and fires none -- his play, 10-14)
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
    if (kind === 'save') { if (R.canSave(B)) { R0.keys.push('save'); B.menu = null; if (B.menuClosed) B.menuClosed(); } return true; } // (SAVE on the floor: R.save, the menu shut first)
    if (kind === 'item' && it && it.use) {
      var who = u || R0.token, eff = it.use.effect;
      // the Rope & Grapple from the menu (R.ropeUse): the one floating at the deep end, if the hook can reach it from where the party stands -- the haul, as ROPE THEM OUT
      // (the menu closes on it, and the haul plays at once -- his play, 10-14: "didn't close menu and seemed like it didn't work, but once menu closed it did")
      if (eff === 'grapple') { if (R.floatInReach(B)) { R0.keys.push('haul'); B.menu = null; if (B.menuClosed) B.menuClosed(); B.card(['{y}' + R0.token.name + '{/} shakes out the Rope & Grapple.'], 160); } else B.card(['{g}Nothing in reach to hook with it here.{/}'], 180); return true; }
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
      return R.actOut(B, { kind: 'item', id: a.id, h: a.h || null }, unitOf); // (the tent, a sheet to learn, the rest: the 8-bit's own -- R.actOut)
    }
    if (kind === 'light-off' && u && u.torch) {
      var lt = u.torch, id = L.kindOf(lt) === 'lantern' ? (lt.item || 'lantern') : null; delete u.torch; L.regrip(u);
      if (id) { var s2 = (B.inv || []).filter(function (x) { return x.id === id; })[0]; if (s2) s2.n++; else (B.inv = B.inv || []).push({ id: id, n: 1 }); }
      B.card(['{y}' + u.name + '{/} ' + (id ? 'puts the lantern away.' : 'puts the torch out (spent).')], 200); return true;
    }
    if (kind === 'cast' || kind === 'skill') return R.actOut(B, { kind: kind, h: a.h, sp: a.sp, s: a.s, t: a.t }, unitOf); // (the 8-bit's own, by a hand-back: R.actOut)
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
      u.wings = R.ringWings(u); u.flies = B.roam.mode === 'fight' && u.wings; // (a ring put on or taken off by EQUIP: its wings with it, spread only in a fight)
    });
  };
  // a Ring of Flying on a finger (content/items.json ring.fly; js/flight-ai.js reads the same two fingers)
  R.ringWings = function (u) { var e = u.src && u.src.equip, I = window.DS.DATA.items; return !!(e && [e.ring, e.ring2].some(function (id) { var it = id && I[id]; return !!(it && it.ring && it.ring.fly); })); };
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
  // walking: the square under the mouse, and the way a click would walk there (10-14, Griz: "move indicator under mouse with pathing"): the path's squares and a ring on the
  // square -- green, a click walks there; gold, a click uses what is there (the bucket, the deep water, the mark on its wall); grey, too far for a click (R.CLICK_FT); red, no way
  R.hoverMarks = function (c, B) {
    var R0 = B.roam, hv = R0.hover, xy = R0.hoverXY, t = R0.token, iso = D.iso;
    if (B.req || B.menu || (R0.path && R0.path.length) || !xy) return;
    var mk = R.runeAt(B, xy[0], xy[1]);
    if (mk) {
      var pm = R.besidePath(B, mk.sq), okm = pm && pm.length * 5 <= R.CLICK_FT, rq = mk.sq, gz = B.map.gz(rq[0] + 1, rq[1]), cc = iso.center(rq[0] + 0.5, rq[1], gz + 22 * (D.hscale || 1)), s = iso.toScreen(cc.x, cc.y);
      (okm ? pm : []).forEach(function (q) { iso.rhombus(c, q[0], q[1], G.map.gz(q[0], q[1]), 11); c.fillStyle = 'rgba(232,208,112,0.5)'; c.fill(); });
      c.strokeStyle = okm ? 'rgba(232,208,112,0.95)' : 'rgba(160,160,170,0.85)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(s.x, s.y, 12 * (iso.zoom || 1), 12 * (iso.zoom || 1), 0, 0, 7); c.stroke(); c.lineWidth = 1;
      return;
    }
    if (!hv || (hv.x === t.x && hv.y === t.y)) return;
    var key = hv.x + ',' + hv.y + ':' + t.x + ',' + t.y + ':' + G.map.sq.length;
    if (R0.hk !== key) { R0.hk = key; var use = R.useAt(B, hv.x, hv.y); R0.huse = !!use; R0.hpath = use ? R.besidePath(B, [hv.x, hv.y]) : D.Battle.route(t, [hv.x, hv.y]); }
    var p = R0.hpath, ok = !!p && p.length * 5 <= R.CLICK_FT, col = !p ? 'rgba(240,90,80,0.9)' : !ok ? 'rgba(160,160,170,0.85)' : R0.huse ? 'rgba(232,208,112,0.95)' : 'rgba(150,235,150,0.95)';
    if (ok) p.forEach(function (q) { iso.rhombus(c, q[0], q[1], G.map.gz(q[0], q[1]), 11); c.fillStyle = R0.huse ? 'rgba(232,208,112,0.45)' : 'rgba(150,235,150,0.45)'; c.fill(); });
    iso.rhombus(c, hv.x, hv.y, G.map.gz(hv.x, hv.y), 2); c.strokeStyle = col; c.lineWidth = 1.5; c.stroke(); c.lineWidth = 1;
  };
  R.marksOver = function (c, B) {
    var R0 = B.roam; if (!R0) return;
    // a hero's ways out over the light (in the pane, 10-13: the grid's pale squares are drawn under the dark, and on the Wet's dark floor they were gone)
    if (R0.mode === 'fight' && B.req && B.req.turn) { (B.exits || []).forEach(function (q) { D.iso.rhombus(c, q[0], q[1], G.map.gz(q[0], q[1]), 2); c.strokeStyle = 'rgba(150,235,150,0.9)'; c.lineWidth = 1.5; c.stroke(); c.lineWidth = 1; }); return; }
    if (R0.mode === 'walk') { R.hoverMarks(c, B); return; }
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
  R.TOWNCOL = { '#': '#3a3228', '.': '#9a7c50', ',': '#c4a878', '=': '#b8b8bc', b: '#8a4430', D: '#2a5a78', '~': '#5a9ab0', f: '#3a2814', k: '#d8c070', w: '#141414', r: '#7a7468', d: '#f0e0b0' }; // (the town map, L: v6's own colours, near enough)
  R.paintMap = function (ctx, B, x0, y0, s) {
    var R0 = B.roam, m = G.map, C = R0.cut, sv = C || R0.mode === 'fight' ? R0.sightV : null;
    ctx.save(); ctx.globalAlpha = 0.92; ctx.fillStyle = '#05040a'; ctx.fillRect(x0 - 2, y0 - 2, m.w * s + 4, m.h * s + 4);
    if (R.def.town) { // (the town: its squares painted once to a picture of their own and kept -- a hundred and forty thousand a frame was too many)
      if (!m.townMap || m.townMap.s !== s) { var cv = document.createElement('canvas'); cv.width = m.w * s; cv.height = m.h * s; var cc = cv.getContext('2d'); for (var ty = 0; ty < m.h; ty++) for (var tx = 0; tx < m.w; tx++) { var tq = m.at(tx, ty); cc.fillStyle = R.TOWNCOL[tq.ch] || (tq.open ? '#8a7656' : '#2a2420'); cc.fillRect(tx * s, ty * s, s, s); } m.townMap = { canvas: cv, s: s }; }
      ctx.drawImage(m.townMap.canvas, x0, y0);
      B.units.forEach(function (u) { if (u.npc) { ctx.fillStyle = '#e8d070'; ctx.fillRect(x0 + u.x * s, y0 + u.y * s, s, s); } });
      var tk = R0.token; ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 + tk.x * s - s, y0 + tk.y * s - s, s * 3, s * 3);
      ctx.restore(); return;
    }
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
      var p8 = R.def.to8(R0.token.x, R0.token.y); // (no step count shown: a random fight comes unannounced -- 10-14, Griz: "removing the step warning regarding random encounters")
      D.text(ctx, R.def.town ? 'THE ROAM -- Silverton, ' + G.map.w + ' x ' + G.map.h + '   square ' + p8[0] + ',' + p8[1] + (R.def.where ? '   ' + R.def.where(p8[0], p8[1]) : '') : 'THE ROAM -- the Wet, ' + G.map.w + ' x ' + G.map.h + '   8-bit square ' + p8[0] + ',' + p8[1], 6, D.H - 30, '#e8d8a0');
      D.text(ctx, R0.mode === 'order' ? 'ORDER (facing ' + R.faceName(R0.fw) + '): click one, then a lit square, or the leader to lead -- right click turns -- O when done' : 'click: walk   arrows: step   O: formation' + (R.tracking(R0).length ? '   F: the fight now' : R.emb || !R.def.wet ? '' : '   F: a fight now') + '   L: the floor map' + (function () { var un = R.useNear(B); if (!un) return ''; var tw = un.trig.town === 'talk' && B.units.filter(function (u) { return u.npc === un.trig.npc; })[0]; return '   E: ' + (tw ? 'a word with ' + tw.name : R.USE_NAME[un.trig.id] || un.trig.id); })(), 6, D.H - 20, '#9a94a8');
    }
    if (R.showMap) { var ms = Math.max(1, Math.min(4, Math.floor((D.W - 12) / G.map.w), Math.floor((D.H - 60) / G.map.h))); R.paintMap(ctx, B, D.W - G.map.w * ms - 6, 22, ms); } // (the town's 474 squares at a pixel each)
    if (R0.mode === 'order' && R0.sel) { var s = D.iso.center(R0.sel.x, R0.sel.y, 0), p = D.iso.toScreen(s.x, s.y); ctx.strokeStyle = '#ffe080'; ctx.strokeRect(p.x - 8, p.y - 30, 16, 32); }
    if (R0.mode === 'over' && I.pressed('rec')) location.reload();
  };
})();
