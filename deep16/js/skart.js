/* DEEP16 -- SÓLSKAFT DRAWN FROM ITS ART (11-12, the Sólskaft cutter, started by the lanes desk on Griz's word: "Think there's stuff for an opus cutter in Fresh"). The art desk's
   ART-134 to ART-138 (art-wanted sections 47-51; the ask: deep16/_src/art-desk/sent/ASK-2026-11-11-solskaft-tiles-and-props/, his "we're going to need a boatload of sprite
   tiling"), cut by tools/solskaft-sheet.py into deep16/art/skstone_p1 (the stone), skstreet_p1 (the rest of the street), skcart_p1 (the cart level), skfun_p1 (the funerary),
   sklodge_p1 (Ásdís Scalebeam's room). THE LOOK ONLY: no square, door or way of js/solskaft.js changes -- the floors' rows, heights, doors and words are as built.
     THE FLOORS: each square's tile painted into the floor as it is baked (js/iso.js `groundArt`, on the raised squares too: `groundArtZ`) -- the dressed flags in four
       variants, worn down main street's walk, the grit strip where a floor meets a wall's foot, the cart road's ruts.
     THE WALLS: a rock square's faces the camera sees laid with the wall modules over the code's own (js/iso.js `rockArt`): a far wall's module from its foot, 120 px of a
       storey, fading into the dark above as the code's face does; a near wall cut to the stub carries the module's foot courses. The wall-mounted things are modules on the
       face they hang on: the tariff board, the mangers, the spear rack and the watch's slate, the Dormant's cut, the lamps by the lit squares.
     THE STORES: the two shut stores stand their two storeys (30 ft, 240 px -- the art's; the code's were 9 ft) with the art's fronts (js/iso.js `roofArt`): shut store bays,
       the lodging's windows, the one lit window over the west one (Ásdís's).
     THE PROPS: the code's stand-ins (SK.pic) give way to the cells -- the oathstone, the throne on the dais's tiles, the braziers burning, Rekknar's ledger-stone, the covered
       scales, the counters, the trough and the fodder, the needles' table and the weights' case, the bench, the outside stair.
   Until a sheet has come (the sheets load as the floor is first laid) the code draws as before, and the floor is painted again when they land. `&props=code` keeps the code's. */
'use strict';
(function () {
  var D = window.D16, iso = D.iso, SK = D.solskaft, M = D.mines; if (!iso || !SK || !M) return;
  var A = SK.art = {}, HW = 32, HH = 16;
  A.on = !/[?&]props=code\b/.test(typeof location !== 'undefined' ? location.search || '' : '');
  A.SHEETS = ['skstone_p1', 'skstreet_p1', 'skcart_p1', 'skfun_p1', 'sklodge_p1', 'skassay_p1']; // (skassay_p1: ART-140, the assay house's props, 11-12)
  A.USED = {}; // (every tile a floor names, by floor -- the bench's check that each has a cell on a sheet: dev/bench16.js mode=solskaft1111)
  var use = function (key, names) { A.USED[key] = (A.USED[key] || []).concat(names); return names; };
  function where(name) { for (var i = 0; i < A.SHEETS.length; i++) { var sh = D.SHEETS && D.SHEETS[A.SHEETS[i]]; if (sh && sh.tiles[name]) return A.SHEETS[i]; } return null; }
  A.has = function (name) { return !!where(name); };
  function img(k) { var sh = D.SHEETS && D.SHEETS[k], i = sh && D.images && D.images[sh.image]; return i && i.naturalWidth ? i : null; }
  A.ready = function () { return A.on && A.SHEETS.every(function (k) { return !(D.SHEETS && D.SHEETS[k]) || img(k); }); };
  var BOX = {};
  A.box = function (name) {
    if (BOX[name]) return BOX[name]; var k = where(name); if (!k) return null;
    var b = D.SHEETS[k].tiles[name].split(' ')[0].split(',').map(Number), c = (D.SHEETS[k].cells || {})[name] || {};
    return (BOX[name] = { k: k, x: b[0], y: b[1], w: b[2], h: b[3], ax: b[4], ay: b[5], foot: c.foot || [1, 1] });
  };
  // a cell on its own canvas, anchored for a piece set at a square's middle: the middle of its footprint (opt.first: of its first square only), lifted opt.lift px
  var CV = {};
  A.cell = function (name, opt) {
    opt = opt || {}; var key = name + '|' + (opt.first ? 'f' : '') + (opt.lift || 0); if (CV[key]) return CV[key];
    var b = A.box(name), I = b && img(b.k); if (!I) return null;
    var cv = document.createElement('canvas'); cv.width = b.w; cv.height = b.h; var cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
    cx.drawImage(I, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
    var fa = opt.first ? 1 : b.foot[0], fb = opt.first ? 1 : b.foot[1];
    return (CV[key] = { canvas: cv, ax: b.ax + (fa - fb) * HW / 2, ay: b.ay + (fa + fb) * HH / 2 + (opt.lift || 0) });
  };
  var BLANK = null; A.blank = function () { if (!BLANK) { var cv = document.createElement('canvas'); cv.width = cv.height = 1; BLANK = { canvas: cv, ax: 0, ay: 0 }; } return BLANK; };
  // a floor tile's pixels, the 64 x 32 diamond (rot: turned half round -- a grit strip on the square's front edge)
  var PX = {};
  A.px = function (name, rot) {
    var key = name + (rot ? '|r' : ''); if (PX[key] !== undefined) return PX[key];
    var b = A.box(name), I = b && img(b.k); if (!I) return null;
    var cv = document.createElement('canvas'); cv.width = 64; cv.height = 32; var cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
    if (rot) { cx.translate(64, 32); cx.rotate(Math.PI); }
    cx.drawImage(I, b.x, b.y, b.w, b.h, 32 - b.ax, -b.ay, b.w, b.h);
    try { return (PX[key] = { data: cx.getImageData(0, 0, 64, 32).data, w: 64, h: 32 }); } catch (e) { return (PX[key] = null); }
  };
  // a wall module laid on a rock square's face: 'L' its +gy face (a wall along x, the module's _x), 'R' its +gx face (along y, _y); its foot `base` px up (the floor in front);
  // `fade` (a far wall): darkened up the face as the code's face goes into the dark (js/iso.js rockCanvas: pow(up, 1.6) * 0.62 of the ramp); `clip` px: only this much of the
  // face's top -- a near wall's stub, the module's foot courses set at the top of the cut
  var FADED = {};
  function faded(name, span) {
    var key = name + '|' + span; if (FADED[key]) return FADED[key];
    var b = A.box(name), I = b && img(b.k); if (!I) return null;
    var cv = document.createElement('canvas'); cv.width = b.w; cv.height = b.h; var cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
    cx.drawImage(I, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
    cx.globalCompositeOperation = 'source-atop';
    for (var y = 0; y < b.h; y++) { var j = Math.max(0, b.ay - y), a = Math.min(0.92, Math.pow(j / span, 1.6) * 0.62 / 0.46); if (a <= 0.01) continue; cx.fillStyle = 'rgba(0,0,0,' + a.toFixed(3) + ')'; cx.fillRect(0, y, b.w, 1); }
    return (FADED[key] = { cv: cv, b: b });
  }
  A.face = function (cx, name, side, ox, oy, base, o) {
    o = o || {}; var b = A.box(name), I = b && img(b.k); if (!I) return false;
    var fx = side === 'L' ? ox - HW : ox + HW, fy = oy - base, src = I, sx = b.x, sy = b.y;
    if (o.fade) { var F = faded(name, o.fade); if (F) { src = F.cv; sx = 0; sy = 0; } }
    cx.save();
    if (o.clip != null) { // (the stub's face: from its foot up to its cut top, the module's foot set at the top)
      var oyb = oy - base; // (the face's foot: `base` px up)
      cx.beginPath(); if (side === 'L') { cx.moveTo(ox - HW, oyb); cx.lineTo(ox, oyb + HH); cx.lineTo(ox, oyb + HH - o.clip); cx.lineTo(ox - HW, oyb - o.clip); }
      else { cx.moveTo(ox, oyb + HH); cx.lineTo(ox + HW, oyb); cx.lineTo(ox + HW, oyb - o.clip); cx.lineTo(ox, oyb + HH - o.clip); } cx.closePath(); cx.clip();
      fy = o.clip >= 20 ? oyb : oyb - o.clip + 12; // (a tall stub -- a niche's tier over the walk below it -- shows the module from its own foot; a knee stub, its foot courses at the cut)
    }
    cx.imageSmoothingEnabled = false;
    cx.drawImage(src, sx, sy, b.w, b.h, Math.round(fx - b.ax), Math.round(fy - b.ay), b.w, b.h);
    cx.restore(); return true;
  };
  var R = function (y) { return SK.H - 1 - y; }; // (a grid row -> r, counted north from the front wall)
  var lampsOf = function (lights) { var o = {}; (lights || []).forEach(function (l) { if (l.flame) o[l.x + ',' + l.y] = 1; }); return o; };

  // ================================================================ THE STREET LEVEL
  var ST = {};
  ST.LAMPS = null;
  ST.ground = function (x, y, m) {
    var row = SK.ROWS[y] || '', c = row.charAt(x), r = R(y); if (c === '#' || c === 'S' || c === 'p') return null;
    if (c === 'v') return x === 36 ? ['floor_y_' + (1 + (y % 4))] : ['floor_x_' + (1 + (x % 4))];            // (the ramps: the cart road's ruts down them)
    var rk = function (dx, dy) { var s = m.at(x + dx, y + dy); return !s || !s.open; };
    var v = 1 + ((x * 7 + y * 13) % 4);
    if (rk(0, -1)) return ['edge_x_' + v]; if (rk(-1, 0)) return ['edge_y_' + v]; if (rk(0, 1) && c !== 'D') return ['edge_x_' + v, 1]; if (rk(1, 0)) return ['edge_y_' + v, 1];
    if ((x === 18 || x === 19) && r >= 1 && r <= 26) return ['worn_y_' + v];                                  // (the walk, doors to throne, worn down the middle)
    return ['flags_' + v];
  };
  use('solskaft', ['floor_x_1', 'floor_x_2', 'floor_x_3', 'floor_x_4', 'floor_y_1', 'floor_y_2', 'floor_y_3', 'floor_y_4', 'edge_x_1', 'edge_x_2', 'edge_x_3', 'edge_x_4',
    'edge_y_1', 'edge_y_2', 'edge_y_3', 'edge_y_4', 'worn_y_1', 'worn_y_2', 'worn_y_3', 'worn_y_4', 'flags_1', 'flags_2', 'flags_3', 'flags_4']);
  // the module on a rock square's face: what hangs there, a lamp by a lamp-lit square, plain stone
  ST.HANG = { L: { '7,7': 'tariff_board_x', '29,7': 'manger_x', '30,7': 'manger_x', '31,7': 'manger_x', '32,7': 'manger_x', '23,21': 'spear_rack_x', '24,21': 'spear_rack_x',
    '25,21': 'spear_rack_x', '27,21': 'watch_slate_x', '28,14': 'dormant_cut_x' }, R: {} };
  // (the assay house's walls, from its block's square -- js/solskaft.js SK.ASSAYWALL, ART-140: the assayers' mark and the crucible shelves)
  SK.ASSAYWALL.L.forEach(function (w) { var a = SK.assayAt(w[1], 3); ST.HANG.L[a[0] + ',' + a[1]] = w[0]; });
  SK.ASSAYWALL.R.forEach(function (w) { var a = SK.assayAt(-1, w[1]); ST.HANG.R[a[0] + ',' + a[1]] = w[0]; });
  use('solskaft', ['guilds_mark_x', 'crucibles_and_cupels_x', 'crucibles_and_cupels_y']);
  use('solskaft', ['tariff_board_x', 'manger_x', 'spear_rack_x', 'watch_slate_x', 'dormant_cut_x', 'plain_x', 'plain_y', 'wall_lamp_lit_x', 'wall_lamp_lit_y']);
  ST.wall = function (s, side) {
    var r = R(s.y), h = ST.HANG[side][s.x + ',' + r]; if (h) return h;
    var L0 = ST.LAMPS || (ST.LAMPS = lampsOf(SK.lights(22))), nx = side === 'L' ? s.x : s.x + 1, ny = side === 'L' ? s.y + 1 : s.y;
    if (L0[nx + ',' + ny]) return side === 'L' ? 'wall_lamp_lit_x' : 'wall_lamp_lit_y';
    return side === 'L' ? 'plain_x' : 'plain_y';
  };
  // the stores' faces: the west store's front on main street (its east face, x 14), its south face over the ramp; the east store's south face on the apron and its east face
  ST.STORE = function (s, side) {
    var r = R(s.y), x = s.x;
    if (side === 'R' && x === 14) return { 3: 'lodging_door_with_window_lit_y', 4: 'store_shut_y', 5: 'store_shut_y', 6: 'store_shut_with_window_dark_y', 7: 'window_dark_y' }[r] || 'plain_tall_y'; // (her lit window over the lodging door, the way up: 11-12)
    if (side === 'L' && x >= 23) return x % 2 ? 'window_dark_x' : 'plain_tall_x'; // (the east store's back onto the apron: no shop bays -- 11-12, his "southern doors (decorative) dont' make sense")
    if (side === 'L') return x % 2 ? 'window_dark_x' : 'plain_tall_x';
    return r % 2 ? 'window_dark_y' : 'plain_tall_y';
  };
  use('solskaft', ['lodging_door_with_window_lit_y', 'store_shut_y', 'store_shut_with_window_dark_y', 'window_dark_y', 'plain_tall_y', 'window_dark_x', 'plain_tall_x', 'temple_lamp_lit', 'temple_lamp_unlit', 'stair_down_x']);
  // the pieces the code drew that the cells take over (the code's own when no sheet has come)
  ST.PIC = { oathstone: ['oathstone'], throne: ['throne', { lift: 8 }], stele: ['rekknar_ledger_stone'], scales: ['covered_assay_scales'], pillar: ['temple_pillar'] }; // (the pillar: ART-134 page 06, 11-12 -- the temples' four a side)
  use('solskaft', ['oathstone', 'throne', 'rekknar_ledger_stone', 'covered_assay_scales', 'temple_pillar']);
  // the things laid fresh where the code stood blocks: [name, x, r, opt] -- the counters, the desk, the stable's trough and fodder, the assay house's and the guardroom's
  ST.THINGS = [['trade_counter_x', 5, 3], ['quartermaster_counter_x', 6, 5], ['ledger_desk', 2, 4], ['water_trough_x', 33, 6], ['old_fodder', 34, 5],
    ['guardroom_bench_x', 26, 16]].concat(SK.ASSAYLAY.map(function (p) { var a = SK.assayAt(p[1], p[2]); return [p[0], a[0], a[1]]; })); // (the assay house's: SK.ASSAYLAY, 11-12)
  A.FOOT = { trade_counter_x: [3, 1], quartermaster_counter_x: [2, 1], guardroom_bench_x: [2, 1], stone_bench_x: [2, 1] }; // (known before the sheets come: the blocks given way at the floor's laying)
  ST.OFF = [[29, 6], [30, 6], [31, 6], [32, 6], [23, 20], [24, 20], [25, 20], [15, 28], [22, 28]]; // (the mangers' and the rack's code blocks: their modules are on the wall behind; the braziers'; the counter's third square)
  ST.BRAZIERS = [[15, 28], [22, 28]];
  use('solskaft', SK.ASSAYLAY.map(function (p) { return p[0]; }));
  use('solskaft', ['trade_counter_x', 'quartermaster_counter_x', 'ledger_desk', 'water_trough_x', 'old_fodder', 'touch_needle_table', 'locked_weights_case', 'guardroom_bench_x',
    'brazier_lit_1', 'brazier_lit_2', 'brazier_lit_3', 'brazier_lit_4', 'dais_centre', 'dais_n', 'dais_e', 'dais_s', 'dais_w', 'dais_ne', 'dais_se', 'dais_sw', 'dais_nw']);
  ST.dais = function (x, r) { var D0 = SK.DAIS, n = r === D0[3], s = r === D0[1], w = x === D0[0], e = x === D0[2]; return 'dais_' + ((n ? 'n' : s ? 's' : '') + (w ? 'w' : e ? 'e' : '') || 'centre'); };

  // a floor's dressed flags with their edges where it meets a wall (the funerary's, her room's): rows as the floor's own
  var flagsAt = function (x, y, m, worn) {
    var rk = function (dx, dy) { var s = m.at(x + dx, y + dy); return !s || !s.open; }, v = 1 + ((x * 7 + y * 13) % 4);
    if (rk(0, -1)) return ['edge_x_' + v]; if (rk(-1, 0)) return ['edge_y_' + v]; if (rk(0, 1)) return ['edge_x_' + v, 1]; if (rk(1, 0)) return ['edge_y_' + v, 1];
    return [(worn || 'flags_') + v];
  };
  // an animated piece on a square (a fire, a flame): its frames by name, `fps`, anchored at its first square (o.d: its depth over the square's; o.lift)
  var animAt = function (m, s, frames, fps, o) {
    if (!s) return; o = o || {};
    m.props.push({ skArt: true, kind: 'sk', sq: s, depth: s.x + s.y + (o.d == null ? 0.5 : o.d), gz: s.gz, draw: function (ctx) {
      if (!A.ready()) return; var t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000, c = A.cell(frames[Math.floor(t * fps + s.x * 0.7) % frames.length], { first: true, lift: o.lift });
      if (!c) return; var p = iso.center(s.x, s.y, s.gz), q = iso.toScreen(p.x, p.y); ctx.drawImage(c.canvas, Math.round(q.x - c.ax), Math.round(q.y - c.ay)); } });
  };
  var noFire = function (m, list) { if (m.isoFire) m.isoFire = m.isoFire.filter(function (q) { return !list.some(function (b) { return q[0] === b[0] && q[1] === b[1]; }); }); };

  // ================================================================ THE CART LEVEL (ART-136)
  var CA = {};
  // the cart road's ruts on the loop the carts take: down the ramp, north up the west lane, east behind the drum, south down the east lane to the road out to the narrow ramp; the
  // highway's lane north from the road. Elsewhere the floor is the raw cut rock
  CA.PATH = (function () {
    var o = {}, set = function (x0, r0, x1, r1, n) { for (var x = x0; x <= x1; x++) for (var r = r0; r <= r1; r++) o[x + ',' + r] = n; };
    set(5, 1, 14, 2, 'x'); set(11, 3, 11, 15, 'y'); o['11,16'] = 'turn_xp_yp'; set(12, 16, 31, 16, 'x'); o['32,16'] = 'turn_xn_yn'; set(32, 17, 32, 30, 'y');
    set(26, 9, 26, 15, 'y'); o['26,8'] = 'turn_xp_yn'; set(27, 8, 35, 8, 'x'); o['36,8'] = 'turn_xn_yp'; set(36, 3, 36, 7, 'y');
    return o;
  })();
  CA.ground = function (x, y, m) {
    var c = (SK.CROWS[y] || '').charAt(x); if (c === '#' || c === 'Q') return null;
    var p = CA.PATH[x + ',' + R(y)], v = 1 + ((x * 5 + y * 11) % 4);
    return p ? ['floor_' + p + '_' + v] : ['floor_raw_' + v];
  };
  ['x', 'y', 'turn_xp_yp', 'turn_xn_yn', 'turn_xp_yn', 'turn_xn_yp', 'raw'].forEach(function (k) { use('solskaft_cart', [1, 2, 3, 4].map(function (v) { return 'floor_' + k + '_' + v; })); });
  CA.HANG = { R: { '12,20': 'armory_rack_y', '12,21': 'armory_rack_y', '12,22': 'armory_rack_y', '12,23': 'armory_rack_y', '12,24': 'armory_rack_y', '30,22': 'trade_hall_boarded_y', '30,25': 'ledger_lamp_rack_y' },
    L: { '11,18': 'mint_sealed_x', '12,18': 'treasury_open_x' } };
  use('solskaft_cart', ['armory_rack_y', 'trade_hall_boarded_y', 'ledger_lamp_rack_y', 'mint_sealed_x', 'treasury_open_x', 'drum_straight_x', 'drum_straight_y', 'cut_rock_plain_x', 'cut_rock_plain_y']);
  CA.wall = function (s, side) {
    var r = R(s.y), h = CA.HANG[side][s.x + ',' + r]; if (h) return h;
    if ((SK.CROWS[s.y] || '').charAt(s.x) === 'Q') return side === 'L' ? 'drum_straight_x' : 'drum_straight_y';   // (the drum, carved its whole length: the lamp-bearers and the litter in relief)
    return side === 'L' ? 'cut_rock_plain_x' : 'cut_rock_plain_y';
  };
  CA.PIC = { anvil: ['anvil'], furnace: ['cold_furnace'], cupel: ['cupel_hearth'], trap: ['hoist_trap_overhead', { first: true }] };
  use('solskaft_cart', ['anvil', 'cold_furnace', 'cupel_hearth', 'hoist_trap_overhead', 'dead_lift_well', 'dead_lift_rear', 'dead_lift_near', 'forge_fire_01', 'forge_fire_02', 'forge_fire_03',
    'forge_fire_04', 'forge_fire_05', 'forge_fire_06', 'hand_cart_x_loaded', 'crate_tall', 'crate_low', 'barrel', 'highway_gate_x_down', 'shroom_bed_1', 'shroom_bed_2', 'shroom_bed_3']);
  var LIFT = null;
  CA.pic = function (nm, args) {
    if (nm === 'rack' || nm === 'carve' || nm === 'chevron' || nm === 'face') return A.blank();      // (the lamp rack, the drum's carving and the mint's and treasury's doors are modules on the walls; the floor's ruts)
    if (nm === 'lift') { // (the dead lift: the well, the rear frame, the near frame, one anchor -- the 2 x 2's top vertex; composed, set at its middle as the code's was)
      if (LIFT) return LIFT; var L0 = ['dead_lift_well', 'dead_lift_rear', 'dead_lift_near'].map(function (n) { return A.box(n); }); if (L0.some(function (b) { return !b || !img(b.k); })) return null;
      var x0 = Math.min.apply(null, L0.map(function (b) { return -b.ax; })), y0 = Math.min.apply(null, L0.map(function (b) { return -b.ay; })), x1 = Math.max.apply(null, L0.map(function (b) { return b.w - b.ax; })), y1 = Math.max.apply(null, L0.map(function (b) { return b.h - b.ay; }));
      var cv = document.createElement('canvas'); cv.width = x1 - x0; cv.height = y1 - y0; var cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
      L0.forEach(function (b) { cx.drawImage(img(b.k), b.x, b.y, b.w, b.h, -b.ax - x0, -b.ay - y0, b.w, b.h); });
      return (LIFT = { canvas: cv, ax: -x0, ay: -y0 + 2 * HH });
    }
    return null;
  };
  CA.dress = function (m, sq, lay) {
    [[17, 25], [18, 25], [2, 5], [3, 5], [4, 5], [7, 7], [8, 7], [31, 26], [32, 26], [33, 26], [34, 26], [13, 20], [13, 21], [13, 22], [13, 23], [13, 24]].forEach(function (q) { off(m, sq(q[0], q[1])); });
    noFire(m, [[17, SK.Y(25)], [18, SK.Y(25)]]);
    animAt(m, sq(17, 25), ['forge_fire_01', 'forge_fire_02', 'forge_fire_03', 'forge_fire_04', 'forge_fire_05', 'forge_fire_06'], 8, { d: 1.5 });  // (the forge, its fire in its mouth)
    lay(sq(2, 5), 'hand_cart_x_loaded', { first: true }, 1.5); lay(sq(4, 5), 'crate_tall', { first: true }); lay(sq(7, 7), 'crate_low', { first: true }); lay(sq(8, 7), 'barrel', { first: true });
    lay(sq(31, 26), 'highway_gate_x_down', { first: true }, -0.4);                                                                              // (the gate, down and barred, across the lane)
    for (var y = 0; y < SK.H; y++) for (var x = 0; x < SK.W; x++) if ((SK.CROWS[y] || '').charAt(x) === 'n') (function (s, k) { if (s) m.props.push({ skArt: true, kind: 'decal', sq: s, depth: s.x + s.y, gz: s.gz, layer: -1, make: function () { return A.cell('shroom_bed_' + k, { first: true }) || A.blank(); } }); })(m.at(x, y), 1 + ((x + y) % 3));
  };

  // ================================================================ THE FUNERARY (ART-137)
  var BE = {};
  BE.ground = function (x, y, m) { var c = (SK.BROWS[y] || '').charAt(x); if (c === '#' || c === 'N' || c === 'K' || c === '$') return null; return flagsAt(x, y, m); };
  BE.KIND = { row: 'niche_sealed', patron: 'niche_patron', pried: 'niche_pried', waits: 'niche_awaits' };
  BE.wall = function (s, side) {
    var r = R(s.y), k = s.x + ',' + r, n = SK.NICHE[k];
    if (side === 'R' && s.x === 4 && r === 12) return 'stair_up_y'; // (the stair up to Rekknar's temple marked on the west hallway's wall: 11-12, his "'stairs down' 'stairs up' tile")
    if (n) { // (a niche's face toward the bier: the west tiers' east faces; the east tiers' faces turn away, their backs blank stone)
      if (side === 'R' && s.x < 18) { var nm = n.kind === 'gear' ? (n.wi === 1 ? 'niche_gear_shield' : 'niche_gear_hammer') : BE.KIND[n.kind] || 'niche_sealed'; return nm + '_y'; }
      return side === 'L' ? 'niche_blank_x' : 'niche_blank_y';
    }
    if (side === 'L' && r === 21 && s.x >= 5 && s.x <= 32) return s.x === 24 ? 'name_wall_x_short_row' : 'name_wall_x_repeat';     // (the wall of the dead's names, one row stopping short)
    if (side === 'L' && s.x === SK.BCUT[0] && r === SK.BCUT[1] + 1) return 'dormants_cut_x';
    if (side === 'R' && s.x === 4 && SK.ACCESS.indexOf(r) >= 0) return 'warranted_seal_whole_y';                                   // (the four warranted doors into the closed homes)
    if (side === 'R' && s.x === 30 && r === 1) return 'flooded_stair_cut_seal_y';                                                    // (the Warrens' stair through its cut seal)
    return side === 'L' ? 'plain_x' : 'plain_y';
  };
  use('solskaft_below', ['stair_up_y', 'niche_sealed_y', 'niche_patron_y', 'niche_pried_y', 'niche_awaits_y', 'niche_gear_shield_y', 'niche_gear_hammer_y', 'niche_blank_x', 'niche_blank_y',
    'name_wall_x_repeat', 'name_wall_x_short_row', 'dormants_cut_x', 'warranted_seal_whole_y', 'flooded_stair_cut_seal_y', 'plain_x', 'plain_y', 'bier_x', 'grave_anvil', 'chapel_ledger_stone',
    'kneeling_stone', 'barred_door_y', 'grille_y', 'kept_lamp_01', 'kept_lamp_02', 'kept_lamp_03', 'kept_lamp_04', 'flags_1', 'flags_2', 'flags_3', 'flags_4', 'edge_x_1', 'edge_y_1']);
  BE.PIC = { bier: ['bier_x'], anvil: ['grave_anvil'], stele: ['chapel_ledger_stone'], kneel: ['kneeling_stone', { first: true }], closedDoor: ['barred_door_y', { first: true }] };
  BE.pic = function (nm, args) { if (nm === 'niches' || nm === 'face' || nm === 'cut' || nm === 'tombLamp') return A.blank(); return null; };
  BE.dress = function (m, sq, lay) {
    [[20, 11], [34, 8]].forEach(function (q) { animAt(m, sq(q[0], q[1]), ['kept_lamp_01', 'kept_lamp_02', 'kept_lamp_03', 'kept_lamp_04'], 5); });   // (the two kept lamps, burning)
    [9, 10].forEach(function (r) { off(m, sq(4, r)); lay(sq(5, r), 'grille_y', { first: true }, -0.4); });                                 // (the grille, the closed street through its bars)
  };

  // ================================================================ ÁSDÍS SCALEBEAM'S ROOM (ART-138): her hearth in the north wall, the crockery shelf, the lit window, the narrow door by the stair
  var LO = {};
  LO.ground = function (x, y, m) { var c = (SK.LODGE.solskaft_asdis.rows[y] || '').charAt(x); if (c === '#') return null; return flagsAt(x, y, m); };
  LO.HANG = { L: { '2,0': 'hearth_x_cold', '4,0': 'crockery_shelf_x', '5,0': 'window_x_lit' }, R: { '0,3': 'narrow_door_y' } };
  LO.wall = function (s, side) { return LO.HANG[side][s.x + ',' + s.y] || (side === 'L' ? 'plain_x' : 'plain_y'); };
  use('solskaft_asdis', ['hearth_x_cold', 'crockery_shelf_x', 'window_x_lit', 'narrow_door_y', 'plain_x', 'plain_y', 'table', 'cot_x', 'stair_head_y',
    'hearth_x_lit_01', 'hearth_x_lit_02', 'hearth_x_lit_03', 'hearth_x_lit_04', 'flags_1', 'edge_x_1']);
  LO.dress = function (m, sq, lay) {
    [[2, 1], [4, 1], [6, 1]].forEach(function (q) { off(m, m.at(q[0], q[1])); });
    noFire(m, [[2, 1]]);
    animAt(m, m.at(2, 1), ['hearth_x_lit_01', 'hearth_x_lit_02', 'hearth_x_lit_03', 'hearth_x_lit_04'], 6, { d: -0.4 });   // (her hearth, the fire kept low, in the north wall over its square)
    lay(m.at(4, 1), 'table', { first: true }); lay(m.at(6, 1), 'cot_x', { first: true }, 0.5);
    var st = m.at(1, 3); if (st) m.props.push({ skArt: true, kind: 'decal', sq: st, depth: st.x + st.y, gz: st.gz, layer: -1, make: function () { return A.cell('stair_head_y', { first: true }) || A.blank(); } });
  };

  // ---------------------------------------------------------------- THE STREET'S WALLS AND THE SEE-THROUGH (11-12, his walk: "The way we're doing transparency (i.e. around 24, 22)
  // is weird - wall stub method instead? when standing at 8, 20 transparency should but off for everything but what makes the temple interior visible"; "looks like external wall got
  // moved and put on the floor ... near stables"; "looks like i'm walking through walls 16, 14 to 18, 14"): the grid cut every wall with open floor behind it to a knee stub, and on
  // the raised street a stub reads as a slab on the floor -- between rooms (the crown's both walls, the stable's front) the walls were not there. Now every wall of the street stands
  // whole, a storey with its dressed top (WALLFT), and is cut to its stub only by the party's presence: standing in a room, that room's walls toward the eye (its south and east
  // walls, the camera's side) and nothing else; out on the street, as before, the faces between the eye and the party. The front wall (the facade) stays a stub, the doors in it
  A.WALLFT = 15;
  A.whole = function (m) { if (!SK.WHOLE) return; m.sq.forEach(function (q) { if (!q.open && q.rock === 'near' && R(q.y) > 0) q.rock = 'far'; }); m.rockImgs = {}; };
  A.ROOMS = [ // (x0 r0 x1 r1: each walled room's floor, its name)
    [7, 9, 11, 13, 'Rekknar\'s temple'], [26, 9, 30, 13, 'the Dormant\'s temple'], [1, 4, 8, 6, 'the tollhouse'], [29, 4, 34, 6, 'the stable'], [9, 16, 14, 20, 'the assay house'],
    [23, 16, 29, 20, 'the guardroom'], [16, 15, 21, 20, 'the crown'], [1, 22, 36, 30, 'the throne room']];
  A.roomAt = function (x, y) { var r = R(y); for (var i = 0; i < A.ROOMS.length; i++) { var b = A.ROOMS[i]; if (x >= b[0] && x <= b[2] && r >= b[1] && r <= b[3]) return b; } return null; };
  // a room's walls toward the eye: the row under its south edge and the column past its east edge, corners and all
  A.roomFront = function (m, b) { var out = [], add = function (x, r) { var q = m.at(x, SK.Y(r)); if (q && !q.open) out.push(q); };
    for (var x = b[0] - 1; x <= b[2] + 1; x++) add(x, b[1] - 1); for (var r = b[1]; r <= b[3] + 1; r++) add(b[2] + 1, r); return out; };
  // (installed when the street is first laid, wrapping whatever see-through the house has then -- the inn's, js/innprops.js IP.tick -- so a page that never
  // comes to Sólskaft keeps its own chain as it was)
  A.hookSee = function () {
  if (A.hooked || !D.roam || !D.roam.occlude) return; A.hooked = true;
  var occ1 = D.roam.occlude;
  D.roam.occlude = function (B) {
    var res = occ1.apply(this, arguments), m = B && B.map, R0 = B && B.roam, def = D.roam.def; if (!m || !m.sq || !R0 || !R0.token || !def || def.key !== SK.KEY) return res;
    var t = R0.token, b = A.roomAt(t.x, t.y); A.inRoom = b ? b[4] : null; if (!b) return res;
    var want = {}, dirty = {}; A.roomFront(m, b).forEach(function (q) { want[q.x + ',' + q.y] = q; });
    var mark = function (q) { for (var yy = -1; yy <= 1; yy++) for (var xx = -1; xx <= 1; xx++) dirty[(q.x + xx) + ',' + (q.y + yy)] = 1; };
    (m.occCut || []).forEach(function (q) { if (!want[q.x + ',' + q.y]) { q.rock = q.occWas; delete q.occCut; delete q.occWas; mark(q); } }); // (in a room: nothing else cut)
    Object.keys(want).forEach(function (k) { var q = want[k]; if (!q.occCut) { q.occWas = q.rock; q.rock = 'near'; q.occCut = true; mark(q); } });
    m.occCut = Object.keys(want).map(function (k) { return want[k]; });
    Object.keys(dirty).forEach(function (k) { if (m.rockImgs) delete m.rockImgs[k]; });
    return res;
  };
  };

  A.FLOOR = { solskaft: ST, solskaft_cart: CA, solskaft_below: BE, solskaft_asdis: LO };

  // ---------------------------------------------------------------- the code's pieces give way: SK.pic's makers return the cell when it has come (made again when it does)
  var cur = function () { return iso.map && iso.map.def && iso.map.def.key; };
  var F = function () { var k = cur(); return A.ready() && A.FLOOR[k] ? A.FLOOR[k] : null; };
  Object.keys(SK.pic).forEach(function (nm) {
    var f0 = SK.pic[nm];
    SK.pic[nm] = function () {
      var fl = F(); if (!fl) return f0.apply(this, arguments);
      var p = fl.PIC && fl.PIC[nm]; if (p) { var c = A.cell(p[0], p[1]); if (c) return c; }
      if (fl.pic) { var r = fl.pic(nm, arguments); if (r) return r; }
      return f0.apply(this, arguments);
    };
  });
  ST.pic = function (nm, args) {
    if (nm === 'dais' || nm === 'chevron' || nm === 'cut') return A.blank();                       // (the dais's tiles, the floor's ruts and the Dormant's module stand for these)
    if (nm === 'face' && /^(shutter|dark|lit|door)$/.test(args[0])) return A.blank();               // (the store's front is its two storeys' modules now)
    if (nm === 'lamp') return A.cell(args[0] ? 'temple_lamp_lit' : 'temple_lamp_unlit', { first: true }); // (the lamp standards on the lamps' squares: 11-12, his "not seeing the light sources")
    return null;
  };

  // ---------------------------------------------------------------- laid as a floor loads
  var load0 = iso.load;
  iso.load = function (def) {
    var fl = def && A.on && A.FLOOR[def.key];
    if (def && def.key === SK.KEY) def.wallFt = SK.art.WALLFT; // (the street's walls a storey with a dressed top, not up into the dark: 11-12, his "wall stub method instead?")
    if (def && SK.isFloor(def.key)) def.nearFoot = true; // (a stub's face from the floor in front of it, not the ground -- js/iso.js rockCanvas; 11-12, his "walls running up and down most of 6 that i just walk through", the code's look and the art's alike)
    if (fl) {
      if (fl.roofs) Object.keys(fl.roofs).forEach(function (k) { if (def.roofs && def.roofs[k]) def.roofs[k] = Object.assign({}, def.roofs[k], fl.roofs[k]); });
      def.groundArtZ = true;
      def.groundArt = function (x, y, m) { if (!A.ready()) return null; var g = fl.ground(x, y, m); return g ? A.px(g[0], g[1]) : null; };
      def.rockArt = function (cx, m, s, o) {
        if (!A.ready() || !fl.wall) return;
        ['L', 'R'].forEach(function (side) {
          var foot = side === 'L' ? o.fL : o.fR; if (o.far && foot == null) return;
          var nm = fl.wall(s, side, m); if (!nm) return;
          if (o.far) A.face(cx, nm, side, o.ox, o.oy, foot, m.def.wallFt ? {} : { fade: o.top - foot }); // (a built room's wall stands lit to its top: iso.js wallFt)
          else { var b0 = (o.base && o.base[side]) || 0; if (o.top - b0 > 0) A.face(cx, nm, side, o.ox, o.oy, b0, { clip: o.top - b0 }); } // (a stub: from its foot -- the floor in front, iso.js nearFoot -- up to its cut)
        });
      };
      if (fl.store) def.roofArt = function (cx, m, s, o) {
        if (!A.ready() || o.cut) return;
        if (o.fL) A.face(cx, fl.store(s, 'L', m), 'L', o.ox, o.oy, 0);
        if (o.fR) A.face(cx, fl.store(s, 'R', m), 'R', o.ox, o.oy, 0);
      };
    }
    var m = load0.apply(this, arguments);
    if (def && def.key === SK.KEY) { A.whole(m); A.hookSee(); }
    if (fl) { A.dress(m, fl); A.fetch(m); }
    return m;
  };
  ST.roofs = { U: { h: 30 } }; ST.store = ST.STORE; // (the stores' two storeys: 30 ft, the art's 240 px)
  var off = function (m, s) { if (!s) return; m.props = m.props.filter(function (p) { return p.sq !== s || p.kind !== 'block'; }); };
  A.dress = function (m, fl) {
    m.props = m.props.filter(function (p) { return !p.skArt; });
    var Y = SK.Y, sq = function (x, r) { return m.at(x, Y(r)); };
    var lay = function (s, name, opt, d) { if (!s) return; m.props.push({ skArt: true, kind: 'sk', skName: name, sq: s, depth: s.x + s.y + (d == null ? 0.5 : d), gz: s.gz, make: function () { return A.cell(name, opt) || A.blank(); } }); };
    if (fl === ST) {
      ST.OFF.forEach(function (q) { off(m, sq(q[0], q[1])); });
      [[5, 11], [5, 12], [32, 11], [32, 12]].forEach(function (q) { var s = sq(q[0], q[1]); if (s) m.props.push({ skArt: true, kind: 'decal', sq: s, depth: s.x + s.y, gz: s.gz, layer: -1, make: function () { return A.cell('stair_down_x', { first: true }) || A.blank(); } }); }); // (the stairs down marked: 11-12, his "might need a 'stairs down' 'stairs up' tile, hard to tell they're there")
      ST.THINGS.forEach(function (t) { // (each laid on its first square, anchored there; its depth the far end's, so what stands beside it sorts right; every square's code block let go)
        var s = sq(t[1], t[2]), n = (SK.art.FOOT[t[0]] || [1, 1])[0]; for (var i = 0; i < n; i++) off(m, sq(t[1] + i, t[2]));
        lay(s, t[0], Object.assign({ first: true }, t[3]), n > 1 ? n - 0.5 : 0.5); });
      for (var x = SK.DAIS[0]; x <= SK.DAIS[2]; x++) for (var r = SK.DAIS[1]; r <= SK.DAIS[3]; r++) (function (s, nm) { if (s && s.open) m.props.push({ skArt: true, kind: 'decal', sq: s, depth: s.x + s.y, gz: s.gz, layer: -1, make: function () { return A.cell(nm) || A.blank(); } }); })(sq(x, r), ST.dais(x, r));
      if (m.isoFire) m.isoFire = m.isoFire.filter(function (q) { return !ST.BRAZIERS.some(function (b) { return q[0] === b[0] && q[1] === SK.Y(b[1]); }); }); // (the code's campfire in the brazier's square gives way: the brazier burns its own)
      ST.BRAZIERS.forEach(function (q) { var s = sq(q[0], q[1]); if (!s) return; s.stands = 'a brazier';
        m.props.push({ skArt: true, kind: 'sk', sq: s, depth: s.x + s.y + 0.5, gz: s.gz, draw: function (ctx) {
          var c = A.ready() && A.cell('brazier_lit_' + (1 + Math.floor(((typeof performance !== 'undefined' ? performance.now() : Date.now()) / 150 + s.x) % 4)), { lift: 8 }); if (!c) return;
          var p = iso.center(s.x, s.y, s.gz), o = iso.toScreen(p.x, p.y); ctx.drawImage(c.canvas, Math.round(o.x - c.ax), Math.round(o.y - c.ay)); } }); });
    }
    if (fl.dress) fl.dress(m, sq, lay);
    m.sorted = null;
  };
  // the sheets asked for as the floor is first laid; when they come, the floor painted again and every picture made again
  A.fetch = function (m) {
    if (!A.on || A.ready() || !D.spr || !D.spr.load || D.spr.offline) return;
    Promise.all(A.SHEETS.map(function (k) { var sh = D.SHEETS && D.SHEETS[k]; return sh ? D.spr.load(sh.image) : null; })).then(function () {
      if (iso.map !== m || !A.ready()) return;
      m.rockImgs = {}; m.roofImgs = {}; m.props.forEach(function (p) { if (p.make) p.img = null; });
      iso.rebake(m); m.sorted = null;
    });
  };
})();
