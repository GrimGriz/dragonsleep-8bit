/* DEEP16 — the looks (the spell animation pass, 09-28h; handoff-2026-09-28-spell-animation-pass.md). Griz: "code for most", "if we
   make animations for them, they should take as long as they need to play", "The lack of spirit weapon as such is what made me
   see the need for this pass". Every spell gets its four beats without being touched one by one:
     the cast    -- light gathers at the caster's hands in the spell's colours (FX.flare), and the cast pose;
     the travel  -- a shot inside a cast is the spell's own (FX.ctx: a frost shard, a radiant mote, a necrotic wisp, force darts that
                    fan and come home, a held beam, a jagged bolt), and a spell with no shot drifts its colours to whom it reaches;
     the arrival -- every hurt of an element shows on the body it lands on (FX.hit: flame licks, frost, sparks, a shock ring, drips,
                    bubbles, a drain, a shaft of light, a star, rings about the head), every heal rises through it (FX.heal), and the
                    area spells stream out over their squares (cones, lines, waves) or fall from the sky (Call Lightning, Flame Strike);
     what lasts  -- drawn each frame from the battle's lists and the creatures' conditions (below, asked for by js/ui.js).
   The element language is FX.EL (js/fx.js): the palette's own fifteen ramps ("you creative from 15 sounds fine"). */
'use strict';
(function () {
  var D = window.D16, FX = D.fx, M = D.magic, G = D.grid;
  var LK = D.looks = {};
  var P = function (r, i) { return D.PAL.ramps[r][i]; };

  // ------------------------------------------------------------------ what each spell looks like
  // the look of a spell that deals no damage of its own: its school's colours
  var SCHOOL = {
    holy: 'bless shieldoffaith divinefavor heroism aid sanctuary protectionfromevilandgood wardingbond beaconofhope deathward dispelevilandgood holyaura guardianoffaith brandingsmite magicweapon resistance guidance divineword spiritualweapon',
    radiant: 'light daylight dancinglights continualflame',
    heal: 'curewounds healingword masshealingword masscurewounds heal regenerate massheal lesserrestoration greaterrestoration protectionfrompoison revivify',
    arcane: 'mageArmor shield invisibility greaterinvisibility seeinvisibility darkvision trueseeing mistystep dimensiondoor blink etherealness mislead mirrorimage blur detectmagic dispelmagic enlargereduce haste slow longstrider expeditiousretreat globeofinvulnerability resilientsphere banishment maze mindblank foresight protectionfromenergy freedomofmovement enhanceability truestrike arcanesword',
    charm: 'sleep command hideouslaughter hypnoticpattern confusion holdperson holdmonster mirrorsgaze irresistibledance powerwordstun colorspray prismaticspray symbol faeriefire',
    shadow: 'darkness bane bestowcurse blindnessdeafness fear eyebite powerwordkill passwithouttrace blacktentacles falselife',
    nature: 'entangle spikegrowth barkskin shillelagh huntersmark insectplague conjureanimals conjurewoodlandbeings wallofthorns',
    earth: 'grease stoneskin fleshtostone earthquake web wallofstone',
    cold: 'icestorm fogcloud',
    thunder: 'gustofwind windwall'
  };
  var LOOKOF = {};
  Object.keys(SCHOOL).forEach(function (el) { SCHOOL[el].split(' ').forEach(function (id) { LOOKOF[id] = el; }); });
  // the shot a spell throws, where its element's usual shot isn't it
  var TRAVEL = {
    rayoffrost: 'beam', eldritchblast: 'beam', scorchingray: 'ray', guidingbolt: 'mote', chilltouch: 'wisp', rayofenfeeblement: 'beam',
    inflictwounds: 'wisp', vampirictouch: 'wisp', contagion: 'wisp', shockinggrasp: 'jag', witchbolt: 'jag', disintegrate: 'beam',
    firebolt: 'fire', produceflame: 'fire', acidarrow: 'glob', magicmissile: 'dart', shatter: 'orb', icestorm: 'frost', sleetstorm: 'frost'
  };
  var BY_EL = { fire: 'fire', cold: 'frost', lightning: 'jag', thunder: 'orb', acid: 'glob', poison: 'glob', necrotic: 'wisp', radiant: 'mote', force: 'dart', psychic: 'orb' };
  // spells whose own code throws a shot at a single creature: no drift of motes as well
  var SHOOTS = { poisonspray: 1, chainlightning: 1, disintegrate: 1, arcanesword: 1, spiritualweapon: 1 };
  // what falls from the sky onto an area
  var SKY = { calllightning: 'jag', flamestrike: 'pillar', sunbeam: 'pillar', sunburst: 'pillar', meteorswarm: 'rain', firestorm: 'rain', holyaura: 'pillar' };
  LK.of = function (id) {
    var sp = M.data(id) || {}, g = M.geo(id), el = LOOKOF[id] || (FX.EL[sp.el] ? sp.el : null) || (sp.kind === 'heal' || sp.kind === 'cure' || sp.kind === 'revive' ? 'heal' : 'arcane');
    var travel = TRAVEL[id] || (g.shape === 'rays' ? 'ray' : g.shape === 'darts' ? 'dart' : g.shape === 'splash' ? 'glob' : BY_EL[sp.el] || BY_EL[el] || 'orb');
    return { id: id, el: el, dmgEl: FX.EL[sp.el] ? sp.el : null, travel: travel, shape: g.shape, reach: !SHOOTS[id] && /^(single|touch|allies)$/.test(g.shape), sky: SKY[id] };
  };

  // the sound of a cast (js/audio.js, shared with the 8-bit game): the element's voice, and its heavier second for the big ones and
  // the signatures (Griz 09-28h: "one per element and an additional alternate for special cases")
  var VOICE = { fire: 'fire', cold: 'frost', lightning: 'zap', thunder: 'thunder', acid: 'acid', poison: 'poison', necrotic: 'necrotic', radiant: 'radiant',
    force: 'force', psychic: 'psychic', heal: 'heal', holy: 'buff', arcane: 'magic', charm: 'charm', shadow: 'shadow', nature: 'nature', earth: 'earth' };
  var SECOND = { fire: 'fire2', cold: 'frost2', lightning: 'zap2', thunder: 'thunder2', acid: 'acid2', poison: 'poison2', necrotic: 'necrotic2', radiant: 'radiant2',
    force: 'force2', psychic: 'psychic2', heal: 'heal2', holy: 'holy2', arcane: 'magic2', charm: 'psychic2', shadow: 'necrotic2', nature: 'nature', earth: 'earth' };
  var BIG = 'fireball meteorswarm firestorm delayedblastfireball flamestrike coneofcold icestorm freezingsphere lightningbolt chainlightning calllightning shatter ' +
    'sunburst sunbeam guidingbolt disintegrate eldritchblast circleofdeath fingerofdeath harm weird feeblemind phantasmalkiller massheal heal masscurewounds ' +
    'holyaura divineword spiritguardians prismaticspray earthquake blacktentacles insectplague cloudkill mirrorimage hypnoticpattern powerwordkill powerwordstun';
  var BIGSET = {}; BIG.split(' ').forEach(function (id) { BIGSET[id] = 1; });
  // (a big area spell: its voice at the hands, the heavy one where it lands -- the bloom below; a big one at a creature: the heavy one
  // at once)
  LK.sound = function (id) { var L = LK.of(id); return (BIGSET[id] && !/^(sphere|cube|cone|line|wave)$/.test(L.shape) ? SECOND : VOICE)[L.el] || 'magic'; };
  LK.landSound = function (id) { var L = LK.of(id); return BIGSET[id] ? SECOND[L.dmgEl || L.el] : null; };
  var sound0 = M.sound;
  M.sound = function (sp) { var c = FX.ctx; return c && c.id ? LK.sound(c.id) : sound0(sp); };

  // ------------------------------------------------------------------ the hooks
  // the cast: the context every shot and bloom inside it reads, the flare at the hands, the drift to whom it reaches
  var cast0 = M.cast;
  M.cast = function* (B, u, id, slot, t) {
    var L = LK.of(id), prev = FX.ctx;
    FX.ctx = { id: id, el: L.el, dmgEl: L.dmgEl, travel: L.travel, caster: u, shape: L.shape, sky: L.sky };
    FX.flare(u, L.el);
    if (L.reach && t) (t.units ? t.units : [t]).forEach(function (w) { if (w && w !== u && w.sheet) FX.reach(u, w, L.el); });
    // Beacon of Hope, 09-29 (Griz: "for beacon of hope can we get a sunbeam coming down on the caster"). The spell is a self cast, so
    // nothing reaches anyone by itself: a sunbeam comes down on the caster, and the gold drifts out to each ally in 30 ft who will
    // carry the hope (the same reckoning as js/grimoire.js E.beaconofhope makes, done here only to know where to send the motes).
    if (id === 'beaconofhope') {
      sunbeam(u);
      B.units.forEach(function (w) { if (w && w !== u && w.side === u.side && !w.dead && w.hp > 0 && w.sheet && G.dist(u, w) <= 30) FX.reach(u, w, 'holy'); });
    }
    try { yield* cast0.apply(this, arguments); } finally { FX.ctx = prev; }
  };
  // the arrival: a hurt of an element on the body; the flash in its colour (a blade's flash stays white)
  var BP = D.Battle.prototype, hurt0 = BP.hurt, heal0 = BP.heal;
  BP.hurt = function (u, amt, type) {
    var el = FX.EL[type] ? type : null;
    if (u) u.flashEl = el;
    var r = hurt0.apply(this, arguments);
    if (el && amt > 0) FX.hit(u, el, amt);
    return r;
  };
  if (heal0) BP.heal = function (u, amt) { var r = heal0.apply(this, arguments); if (amt > 0 && u && !u.dead) FX.heal(u); return r; };
  // an area: the element's own colours for the damage spells' blooms, the stream out over a cone, a line or a wave, the bolt down a
  // Lightning Bolt's line, and what falls from the sky
  var bloom0 = FX.bloom, DEFAULT_RAMPS = { fire: 1, glow: 1, silver: 1, bone: 1 };
  FX.bloom = function (cx, cy, squares, ramp) {
    var c = FX.ctx;
    if (c && c.dmgEl && DEFAULT_RAMPS[ramp || 'fire']) ramp = c.dmgEl;
    var f = bloom0.call(this, cx, cy, squares, ramp, { core: !(c && /^(cone|line|wave)$/.test(c.shape)) });
    if (!c || !c.caster || !squares || !squares.length) return f;
    var ls = LK.landSound(c.id); if (ls) D.sfx(ls);
    var u = c.caster, el = c.dmgEl || c.el;
    if (/^(cone|line|wave)$/.test(c.shape)) {
      FX.stream(u, squares, el);
      if (el === 'lightning' && c.shape === 'line') {
        var far = squares.slice().sort(function (a, b) { return Math.hypot(b[0] - u.x, b[1] - u.y) - Math.hypot(a[0] - u.x, a[1] - u.y); })[0];
        FX.jag(u, { x: far[0], y: far[1], size: 1 }, 'lightning', { blocking: false, dur: 26 });
      }
    }
    if (c.sky === 'jag') FX.jag(null, { x: cx, y: cy, size: 1 }, 'lightning', { sky: true, blocking: false, dur: 24 });
    if (c.sky === 'pillar') pillar(cx, cy, el, squares);
    if (c.sky === 'rain') rain(squares, el);
    return f;
  };
  // light down from the sky over an area (Flame Strike, Sunbeam, Sunburst)
  function pillar(cx, cy, el, squares) {
    var E = FX.el(el);
    FX.add({ kind: 'pillar', dur: 34, draw: function (ctx) {
      var t = this.t, k = Math.sin(Math.PI * t / this.dur), c0 = D.iso.center(cx, cy, D.iso.map.gz(cx, cy)), s = D.iso.toScreen(c0.x, c0.y);
      var w = 10 + Math.min(4, squares.length) * 6;
      ctx.globalAlpha = 0.35 * k; ctx.fillStyle = E.c[2]; ctx.fillRect(Math.round(s.x - w), Math.round(s.y - 200), w * 2, 200);
      ctx.globalAlpha = 0.6 * k; ctx.fillStyle = E.c[1]; ctx.fillRect(Math.round(s.x - w / 2), Math.round(s.y - 200), w, 200);
      ctx.globalAlpha = 0.9 * k; ctx.fillStyle = E.c[0]; ctx.fillRect(Math.round(s.x - 2), Math.round(s.y - 200), 4, 200);
      ctx.globalAlpha = 1;
    } });
  }
  // Beacon of Hope's sunbeam, 09-29 (Griz: "a sunbeam coming down on the caster"). Sunlight, not a strike: a broad column that widens
  // as it goes up, gold at the edge and bone-white at the heart, coming down from the top of the screen to the caster's feet in the
  // first dozen ticks, with a few pale streaks sliding in it and dust drifting down through it. It leaves a pool of light on the floor
  // and a flash at the crown where it lands, then thins away. It stays 50 ticks, longer than Flame Strike's column, and never blocks.
  function sunbeam(u) {
    var E = FX.el('holy'), H = 200, dust = [];
    for (var i = 0; i < 20; i++) dust.push({ x: Math.random() * 2 - 1, d: Math.random() * 60, sp: 0.7 + Math.random() * 0.7, c: i % 3 });
    FX.add({ kind: 'sunbeam', dur: 50, draw: function (ctx) {
      var t = this.t, T = this.dur, b = FX.body(u), k = Math.min(1, t / 8) * Math.min(1, (T - t) / 16), fall = Math.min(1, t / 12), y, w;
      // the column, row by row from its foot: the edge, the body and the heart, each a little wider at the top and a little fainter
      for (y = 0; y < H; y += 2) {
        var q = y / H;
        if (q < 1 - fall) continue;
        w = 9 + q * 13;
        ctx.globalAlpha = 0.17 * k * (1 - q * 0.45); ctx.fillStyle = E.c[1]; ctx.fillRect(Math.round(b.x - w), Math.round(b.y - y), Math.round(w * 2), 2);
        ctx.globalAlpha = 0.4 * k * (1 - q * 0.45); ctx.fillStyle = E.c[1]; ctx.fillRect(Math.round(b.x - w * 0.55), Math.round(b.y - y), Math.round(w * 1.1), 2);
        ctx.globalAlpha = 0.75 * k * (1 - q * 0.45); ctx.fillStyle = E.c[0]; ctx.fillRect(Math.round(b.x - 2 - q * 2), Math.round(b.y - y), 4 + Math.round(q * 4), 2);
      }
      // pale streaks sliding sideways through it, and dust falling down it
      for (var s = 0; s < 3 && fall >= 1; s++) {
        var sx = b.x + Math.sin(t / 11 + s * 2.3) * 7;
        ctx.globalAlpha = 0.4 * k; ctx.fillStyle = E.c[0]; ctx.fillRect(Math.round(sx), Math.round(b.y - H * 0.8), 1, Math.round(H * 0.8));
      }
      dust.forEach(function (m) {
        var ph = ((t * m.sp + m.d) % 60) / 60, my = b.y - H * 0.6 * (1 - ph);
        if (t < 10) return;
        ctx.globalAlpha = k * Math.sin(Math.PI * ph); px(ctx, b.x + m.x * (8 + (1 - ph) * 8) + Math.sin(t / 9 + m.d) * 1.5, my, E.c[m.c], m.c ? 1 : 2);
      });
      // the pool of light where it lands, and the flash at the crown
      ctx.globalAlpha = 1;
      glow(ctx, b.x, b.y, E.c[2], 22, 0.3 * k); glow(ctx, b.x, b.y, E.c[1], 13, 0.35 * k); glow(ctx, b.x, b.y, E.c[0], 6, 0.3 * k);
      ctx.save(); ctx.globalAlpha = 0.5 * k; ctx.strokeStyle = E.c[1]; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(b.x, b.y, 15 + (t % 25) * 0.3, 7 + (t % 25) * 0.15, 0, 0, 7); ctx.stroke(); ctx.restore();
      if (t >= 8 && t < 24) { var fk = (t - 8) / 16; ctx.globalAlpha = 1 - fk; glow(ctx, b.x, b.y - b.top, E.c[0], 5 + fk * 9, 0.4 * (1 - fk)); ctx.globalAlpha = 1 - fk; FX.star(ctx, b.x, b.y - b.top, E, 3 + Math.round(fk * 7)); }
      ctx.globalAlpha = 1;
    } });
  }
  // the floating weapon's swing: the attack it makes (grimoire.js E.spiritualweapon, E.arcanesword: atk.spirit) marks its record, and
  // the drawing below swings it at the one struck
  var attack0 = BP.attack;
  BP.attack = function (att, tgt, atk) {
    if (atk && atk.spirit) { var sw = (this.spirits || []).filter(function (s) { return s.by === att.id; })[0]; if (sw) { sw.swingT = this.t; sw.swingAt = tgt; } }
    return attack0.apply(this, arguments);
  };

  // fire falling out of the sky onto the squares (Meteor Swarm, Fire Storm)
  function rain(squares, el) {
    var E = FX.el(el), drops = [];
    for (var i = 0; i < Math.min(14, 4 + squares.length); i++) { var q = squares[Math.floor(Math.random() * squares.length)]; drops.push({ q: q, d: Math.random() * 18 }); }
    FX.add({ kind: 'rain', dur: 40, draw: function (ctx) {
      var t = this.t;
      drops.forEach(function (dp) {
        var k = (t - dp.d) / 12; if (k < 0 || k > 1.3) return;
        var c0 = D.iso.center(dp.q[0], dp.q[1], D.iso.map.gz(dp.q[0], dp.q[1])), s = D.iso.toScreen(c0.x, c0.y), kk = Math.min(1, k);
        var x = s.x + 40 * (1 - kk), y = s.y - 160 * (1 - kk);
        if (k <= 1) { for (var j = 0; j < 6; j++) FX.px(ctx, x + j * 2.2, y - j * 8, j < 2 ? E.c[0] : E.c[j < 4 ? 1 : 2], j < 2 ? 3 : 2); }
        else { ctx.globalAlpha = 1 - (k - 1) / 0.3; FX.px(ctx, s.x, s.y - 3, E.c[0], 5); ctx.globalAlpha = 1; }
      });
    } });
  }

  // ================================================================== what lasts, drawn every frame (js/ui.js asks for each part)
  var px = FX.px, glow = FX.glow;
  function sq(x, y) { var c = D.iso.center(x, y, D.iso.map.gz(x, y)); return D.iso.toScreen(c.x, c.y); }
  function hsh(a, b) { var h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); } // (a steady random per square)

  // the floating weapons, as pixel art made from shapes: a flanged spectral mace (the cleric's Spiritual Weapon) and a sword (the
  // Arcane Sword, a wizard's Spiritual Weapon), lit from the upper left, outlined. o outline, d edge, m body, h light
  function carve(W, H, inside) {
    var g = [], rows = [];
    for (var y = 0; y < H; y++) { g.push([]); for (var x = 0; x < W; x++) g[y].push(!!inside(x, y)); }
    var at = function (x, y) { return y >= 0 && y < H && x >= 0 && x < W && g[y][x]; };
    for (var y2 = 0; y2 < H; y2++) {
      var r = '';
      for (var x2 = 0; x2 < W; x2++) {
        if (g[y2][x2]) r += !at(x2 - 1, y2) || !at(x2, y2 - 1) ? 'h' : !at(x2 + 1, y2) || !at(x2, y2 + 1) ? 'd' : 'm';
        else r += at(x2 - 1, y2) || at(x2 + 1, y2) || at(x2, y2 - 1) || at(x2, y2 + 1) ? 'o' : '.';
      }
      rows.push(r);
    }
    return rows;
  }
  var MACE = carve(17, 34, function (x, y) {
    var cx = 8, head = Math.hypot(x - cx, (y - 7) * 1.05) <= 5.2;
    var flange = (x === cx && y >= 0 && y <= 14) || (y === 7 && x >= 1 && x <= 15) || (Math.abs(x - cx) === Math.abs(y - 7) && Math.abs(x - cx) >= 3 && Math.abs(x - cx) <= 6);
    var shaft = Math.abs(x - cx) <= 1 && y > 12 && y <= 30, grip = Math.abs(x - cx) === 2 && y >= 24 && y <= 29 && y % 2 === 0;
    return head || flange || shaft || grip || Math.hypot(x - cx, y - 31.5) <= 2.1;
  });
  var SWORD = carve(15, 38, function (x, y) {
    var cx = 7, blade = (y >= 3 && y <= 25 && Math.abs(x - cx) <= 1.5) || (y < 3 && Math.abs(x - cx) <= y * 0.5);
    var guard = (y === 26 || y === 27) && x >= 1 && x <= 13, grip = y >= 28 && y <= 33 && Math.abs(x - cx) <= 1;
    return blade || guard || grip || Math.hypot(x - cx, y - 35) <= 1.8;
  });
  var bmCache = {};
  function bitmap(rows, E, key) {
    if (bmCache[key]) return bmCache[key];
    var c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
    var x = c.getContext('2d'), col = { o: E.c[3], d: E.c[2], m: E.c[1], h: E.c[0] };
    rows.forEach(function (r, yy) { for (var xx = 0; xx < r.length; xx++) { var ch = r[xx]; if (col[ch]) { x.fillStyle = col[ch]; x.fillRect(xx, yy, 1, 1); } } });
    return (bmCache[key] = c);
  }
  function drawWeapon(ctx, B, sw) {
    var owner = B.units.filter(function (w) { return w.id === sw.by; })[0], sword = sw.sword || (owner && owner.cls !== 'cleric' && owner.cls !== 'paladin' && owner.cls !== 'druid');
    var E = sw.sword ? FX.EL.force : FX.EL.holy, img = bitmap(sword ? SWORD : MACE, E, (sword ? 'sword' : 'mace') + (sw.sword ? 'F' : 'H'));
    // it hangs beside the one it is set on, on the caster's side of it, a head higher than a man
    var s = sq(sw.x, sw.y), t = B.t, op = owner ? D.ui.unitPos(B, owner) : null, side = op ? (op.x <= s.x ? -1 : 1) : -1;
    var bob = Math.sin(t / 14 + sw.x) * 2.5, ang = Math.sin(t / 23) * 0.16, st = sw.swingT != null ? t - sw.swingT : 99;
    var px0 = s.x + side * 17, py0 = s.y - 30 + bob; // the pivot: the grip
    // the swing: drawn back, away from the one struck, then brought through it and back up (a positive turn tips the head right)
    var back = side * 0.7, thru = -side * 1.7;
    if (st < 30) {
      var k = st / 30;
      ang = k < 0.35 ? back * (k / 0.35) : k < 0.55 ? back + (thru - back) * ((k - 0.35) / 0.2) : thru * (1 - (k - 0.55) / 0.45);
      py0 -= k < 0.35 ? 6 * (k / 0.35) : 6 * Math.max(0, 1 - (k - 0.35) / 0.3);
    }
    var pulse = 0.78 + 0.18 * Math.sin(t / 7), hx = px0 + Math.sin(ang) * img.height * 0.7, hy = py0 - Math.cos(ang) * img.height * 0.7;
    // its light on the floor under it, and a soft halo about the head
    ctx.globalAlpha = 0.3; ctx.fillStyle = E.c[1]; ctx.beginPath(); ctx.ellipse(px0, s.y + 1, 12, 5, 0, 0, 7); ctx.fill();
    glow(ctx, hx, hy, E.c[2], 14, 0.2 * pulse); glow(ctx, hx, hy, E.c[1], 7, 0.25 * pulse);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(px0), Math.round(py0)); ctx.rotate(ang);
    ctx.globalAlpha = 0.92 * pulse; ctx.drawImage(img, -Math.floor(img.width / 2), -Math.round(img.height * 0.88));
    ctx.restore(); ctx.globalAlpha = 1;
    // motes that fall off it, and the arc of a swing
    for (var i = 0; i < 5; i++) { var ph = (t * 0.6 + i * 9) % 30; ctx.globalAlpha = 1 - ph / 30; px(ctx, hx + Math.sin(i * 2.3 + t / 9) * 7, hy + 6 + ph * 0.9, i % 2 ? E.c[0] : E.c[1], 2); }
    if (st < 24 && st > 10) { var a0 = back - Math.PI / 2, a1 = thru - Math.PI / 2; ctx.globalAlpha = 1 - (st - 10) / 14; ctx.strokeStyle = E.c[0]; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px0, py0, img.height * 0.78, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  // Guardian of Faith: a spectral guardian at its post, halberd raised -- the line guard's own figure in the holy light
  function drawWard(ctx, B, wd) {
    var s = sq(wd.x, wd.y), t = B.t, E = FX.EL.holy, sheet = (D.FOES && D.FOES.guard && D.FOES.guard.sheet) || 'guard_p1';
    ctx.globalAlpha = 0.3; ctx.fillStyle = E.c[1]; ctx.beginPath(); ctx.ellipse(s.x, s.y, 16, 7, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    D.spr.draw(ctx, sheet, 'idle', 0, t, s.x, s.y - 2 + Math.sin(t / 16) * 1.5, { alpha: 0.62 + 0.1 * Math.sin(t / 9), tint: E.c[1], tintAlpha: 0.75 });
    for (var i = 0; i < 5; i++) { var ph = (t * 0.5 + i * 12) % 40; ctx.globalAlpha = (1 - ph / 40) * 0.9; px(ctx, s.x + Math.sin(i * 1.7) * 9, s.y - 4 - ph * 1.2, E.c[0], 2); }
    ctx.globalAlpha = 1;
  }
  // Spirit Guardians: spirits wheeling round the caster on the aura's edge (gold, or the violet of the Dormant's cold ones);
  // the half of the wheel behind him drawn before him, the near half after
  function drawAura(ctx, B, a, front) {
    var u = B.units.filter(function (w) { return w.id === a.by; })[0]; if (!u || u.dead || u.hp <= 0) return;
    var p = D.ui.unitPos(B, u), E = a.ramp === 'violet' || a.type === 'necrotic' ? FX.EL.necrotic : FX.EL.holy, R2 = (a.r || 15) / 5 * 0.95, t = B.t;
    var rx = R2 * D.iso.TW / 2 * Math.SQRT2 * 0.72, ry = rx / 2;
    for (var i = 0; i < 8; i++) {
      var an = t / 40 + i * Math.PI / 4, x = p.x + Math.cos(an) * rx, y = p.y + Math.sin(an) * ry, isFront = Math.sin(an) > 0;
      if (isFront !== front) continue;
      var hy = y - 14 - Math.sin(t / 10 + i) * 3;
      glow(ctx, x, hy, E.c[2], 5, 0.25);
      // a small spirit: a head, a body that trails away the way it wheels
      px(ctx, x, hy - 2, E.c[0], 3); px(ctx, x, hy + 1, E.c[1], 3); px(ctx, x - Math.sin(an) * 2, hy + 4, E.c[1], 2); px(ctx, x - Math.sin(an) * 4, hy + 6, E.c[2], 1);
      for (var k = 1; k <= 3; k++) { var an2 = an - k * 0.08; ctx.globalAlpha = 0.5 - k * 0.14; px(ctx, p.x + Math.cos(an2) * rx, p.y + Math.sin(an2) * ry - 12, E.c[2], 2); ctx.globalAlpha = 1; }
    }
  }
  // Moonbeam (09-29): a shaft of pale light standing on its squares, motes drifting up it
  function drawBeam(ctx, B, z) {
    var s = sq(z.x, z.y), t = B.t, w = D.iso.TW * 1.2, h = 96, pul = 0.8 + 0.2 * Math.sin(t / 9);
    ctx.save();
    ctx.globalAlpha = 0.16 * pul; ctx.fillStyle = P('bone', 2);
    ctx.beginPath(); ctx.ellipse(s.x, s.y, w * 0.55, w * 0.27, 0, 0, 7); ctx.fill();
    var g = ctx.createLinearGradient(0, s.y - h, 0, s.y);
    g.addColorStop(0, 'rgba(252,252,244,0)'); g.addColorStop(0.35, 'rgba(232,240,255,0.10)'); g.addColorStop(1, 'rgba(252,252,244,0.30)');
    ctx.globalAlpha = pul; ctx.fillStyle = g; ctx.fillRect(s.x - w * 0.4, s.y - h, w * 0.8, h);
    ctx.globalAlpha = 0.5 * pul; ctx.fillStyle = P('glow', 2); ctx.fillRect(Math.round(s.x - w * 0.4), s.y - h, 1, h); ctx.fillRect(Math.round(s.x + w * 0.4) - 1, s.y - h, 1, h);
    for (var i = 0; i < 7; i++) { var ph = (t * 0.7 + i * 13) % 90; ctx.globalAlpha = (1 - ph / 90) * 0.9; px(ctx, s.x + Math.sin(i * 2.3 + t / 20) * w * 0.32, s.y - 4 - ph, i % 2 ? P('bone', 2) : P('glow', 2), i % 3 ? 1 : 2); }
    ctx.restore();
  }
  // Flaming Sphere (09-29): a ball of fire on its square, rolling (its dark spots turn), sparks off it, a shadow under
  function drawSphere(ctx, B, z) {
    var s = sq(z.x, z.y), t = B.t, r = 7 + Math.sin(t / 4) * 0.6, cy = s.y - 7;
    ctx.save();
    ctx.globalAlpha = 0.35; ctx.fillStyle = P('outline', 0); ctx.beginPath(); ctx.ellipse(s.x, s.y - 1, 8, 3.5, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.25; ctx.fillStyle = P('fire', 1); ctx.beginPath(); ctx.ellipse(s.x, cy, r + 6, r + 4, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = P('fire', 0); ctx.beginPath(); ctx.ellipse(s.x, cy, r, r, 0, 0, 7); ctx.fill();
    ctx.fillStyle = P('fire', 1); ctx.beginPath(); ctx.ellipse(s.x - 1, cy - 1, r * 0.72, r * 0.72, 0, 0, 7); ctx.fill();
    ctx.fillStyle = P('fire', 2); ctx.beginPath(); ctx.ellipse(s.x - 2, cy - 2, r * 0.4, r * 0.4, 0, 0, 7); ctx.fill();
    for (var i = 0; i < 4; i++) { var an = t / 7 + i * 1.57; px(ctx, s.x + Math.cos(an) * r * 0.7, cy + Math.sin(an) * r * 0.7, i % 2 ? P('fire', 0) : P('red', 3), 2); }
    for (var k = 0; k < 4; k++) { var ph = (t * 1.3 + k * 11) % 24; ctx.globalAlpha = 1 - ph / 24; px(ctx, s.x + Math.sin(k * 1.9 + t / 5) * 6, cy - r - ph * 0.8, k % 2 ? P('fire', 2) : P('bone', 2), 1); }
    ctx.restore();
  }
  // the things that stand up off the floor, in the depth sort with the figures (ui.js drawBattle)
  LK.props = function (B) {
    var out = [];
    // the zones that move (09-29): the moonbeam's shaft, the flaming sphere rolling
    (B.zones || []).forEach(function (z) {
      out.push({ depth: z.x + z.y + (z.id === 'moonbeam' ? 0.3 : 0.5), gz: D.iso.map.gz(z.x, z.y), layer: 1, draw: function (ctx) { if (z.id === 'moonbeam') drawBeam(ctx, B, z); else drawSphere(ctx, B, z); } });
    });
    (B.spirits || []).forEach(function (sw) { if (sw.rounds > 0 || sw.rounds == null) out.push({ depth: sw.x + sw.y + 0.7, gz: D.iso.map.gz(sw.x, sw.y), layer: 1, draw: function (ctx) { drawWeapon(ctx, B, sw); } }); });
    (B.wards || []).forEach(function (wd) { if (wd.left > 0) out.push({ depth: wd.x + wd.y + 0.6, gz: D.iso.map.gz(wd.x, wd.y), layer: 1, draw: function (ctx) { drawWard(ctx, B, wd); } }); });
    (B.auras || []).forEach(function (a) {
      var u = B.units.filter(function (w) { return w.id === a.by; })[0]; if (!u) return;
      out.push({ depth: u.x + u.y + 0.2, gz: 0, layer: 1, draw: function (ctx) { drawAura(ctx, B, a, false); } });
      out.push({ depth: u.x + u.y + 1.1, gz: 0, layer: 1, draw: function (ctx) { drawAura(ctx, B, a, true); } });
    });
    // the locusts (Insect Plague): a cloud over each square, in front of what stands there
    (B.grounds || []).forEach(function (g) {
      if (g.kind !== 'insects') return;
      g.sq.forEach(function (q) { out.push({ depth: q[0] + q[1] + 0.9, gz: D.iso.map.gz(q[0], q[1]), layer: 1, draw: function (ctx) {
        var s = sq(q[0], q[1]), t = B.t, E = FX.EL.nature;
        for (var i = 0; i < 9; i++) { var a = t / (6 + i) + i * 2.1 + hsh(q[0], q[1]) * 6, r = 6 + (i % 3) * 4; px(ctx, s.x + Math.cos(a) * r, s.y - 10 - (i % 4) * 5 + Math.sin(a * 1.3) * r * 0.5, i % 3 ? P('outline', 0) : E.c[2], (t + i) % 4 ? 1 : 2); }
      } }); });
    });
    return out;
  };

  // under the figures: the spell ground, the rings of a holy ward, the edge of a magical darkness (ui.js overlay)
  LK.ground = function (ctx, B, onSq) {
    var t = B.t;
    (B.grounds || []).forEach(function (g) {
      g.sq.forEach(function (q) { onSq(q[0], q[1], function (c) { groundSq(c, g, q[0], q[1], t); }); });
    });
    // magical darkness and the clouds (fog, the stinking cloud, sleet): a volume, not a stain -- the gaps between the squares filled, a
    // wall of it standing up along its edge, and what it is made of roiling up out of it (black smoke with violet in it, white fog,
    // yellow-green gas, sleet falling)
    (B.darks || []).forEach(function (dk) {
      var kind = dk.kind || 'darkness', sqs = D.magic.darkSq(B, dk), has = {}; sqs.forEach(function (q) { has[q[0] + ',' + q[1]] = 1; });
      var CL = kind === 'fog' ? [P('silver', 6), P('silver', 5), P('bone', 1), 0.28] : kind === 'stink' ? [P('orc', 3), P('gold', 3), P('orc', 2), 0.3] : kind === 'kill' ? [P('moss', 2), P('gold', 2), P('moss', 3), 0.34] : kind === 'sleet' ? [P('bone', 2), P('glow', 2), P('silver', 5), 0.22] : [P('outline', 0), P('violet', 1), P('violet', 3), 0.55];
      sqs.forEach(function (q) {
        var edgeN = !has[q[0] + ',' + (q[1] - 1)], edgeW = !has[(q[0] - 1) + ',' + q[1]], edgeS = !has[q[0] + ',' + (q[1] + 1)], edgeE = !has[(q[0] + 1) + ',' + q[1]];
        onSq(q[0], q[1], function (c) {
          var s = sq(q[0], q[1]), h = hsh(q[0], q[1]), i;
          D.iso.rhombus(c, q[0], q[1], D.iso.map.gz(q[0], q[1]), 0); c.globalAlpha = kind === 'darkness' ? 0.9 : CL[3] * 0.6; c.fillStyle = CL[0]; c.fill();
          // the wall along the near edges (south and east face the viewer): a column that thins as it rises
          if (edgeS || edgeE) for (var k = 0; k < 20; k++) { c.globalAlpha = (kind === 'darkness' ? 0.75 : CL[3]) * (1 - k / 20); c.fillStyle = CL[0]; c.fillRect(Math.round(s.x - (edgeS && edgeE ? 30 : 16) + (edgeE && !edgeS ? 14 : 0)), Math.round(s.y + 6 - k * 2.4), edgeS && edgeE ? 60 : 32, 3); }
          // what roils up out of it
          var n = kind === 'sleet' ? 5 : (edgeN || edgeW || edgeS || edgeE) ? 4 : 3;
          for (i = 0; i < n; i++) {
            var ph = (t * (kind === 'fog' ? 0.18 : 0.3) + i * 13 + h * 50) % 36, bx = s.x + (hsh(q[0] + i, q[1] - i) - 0.5) * 30, by = s.y + (hsh(q[0] - i, q[1] + i) - 0.5) * 12;
            if (kind === 'sleet') { var fy = (t * 1.6 + i * 17 + h * 90) % 44; c.globalAlpha = 0.8; px(c, bx + fy * 0.3, by - 44 + fy, CL[i % 2], 1); px(c, bx + fy * 0.3 - 1, by - 45 + fy, CL[1], 1); continue; }
            // a puff of it: soft, swelling as it rises, a paler rim on the darkness's (violet in the black)
            var fa = Math.sin(Math.PI * ph / 36), sz = 3 + ph / 6, pxx = bx + Math.sin(ph / 6 + i) * 3, pyy = by - ph;
            glow(c, pxx, pyy, i % 3 === 2 ? CL[2] : CL[i % 2], sz, fa * (kind === 'darkness' ? 0.55 : 0.4));
            if (kind === 'darkness' && i % 2) glow(c, pxx - 1, pyy - 1, CL[2], sz * 0.4, fa * 0.35);
          }
          if (kind === 'sleet' && ((t >> 3) + Math.floor(h * 9)) % 5 === 0) { c.globalAlpha = 0.5; px(c, s.x + (h - 0.5) * 20, s.y, P('bone', 1), 2); } // ice on the floor
          c.globalAlpha = 1;
        });
      });
    });
    // a creature under Sanctuary, Protection from Evil and Good, a warding bond, Death Ward, Protection from Poison, the holy aura: a soft
    // ring of light at its feet, one for each ward (09-29: each past the first stands a step further out, so two wards read as two
    // rings): the bond pale platinum-blue, Death Ward studded at its four points, the poison ward green and broken
    B.units.forEach(function (u) {
      if (u.dead || u.hp <= 0) return;
      var cd = u.conds, list = [];
      if (cd.holyAura) list.push([3, 'holy']);
      if (cd.sanctuary) list.push([2, 'holy']);
      if (cd.pfeg || cd.beacon) list.push([1, 'holy']);
      if (cd.wardingBond) list.push([1, 'bond']);
      if (cd.deathWard) list.push([1, 'death']);
      if (cd.poisonWard) list.push([1, 'poison']);
      if (!list.length) return;
      var p = D.ui.unitPos(B, u), pul = 0.75 + 0.25 * Math.sin(t / 12 + u.x);
      list.forEach(function (w, n) {
        var kind = w[0], E = w[1] === 'bond' ? FX.EL.cold : w[1] === 'poison' ? FX.EL.nature : FX.EL.holy, rx = 13 + kind * 2 + n * 4, ry = 6 + kind + n * 2;
        ctx.save(); ctx.strokeStyle = kind === 2 ? E.c[0] : E.c[1]; ctx.lineWidth = kind === 3 ? 2 : 1;
        if (w[1] === 'poison') { ctx.setLineDash([3, 2]); ctx.lineDashOffset = t / 4; }
        ctx.beginPath(); ctx.ellipse(p.x, p.y, rx, ry, 0, 0, 7);
        ctx.globalAlpha = 0.09 * pul; ctx.fillStyle = E.c[2]; ctx.fill(); // (a faint light on the floor within it, so the ring reads on a dithered floor)
        ctx.globalAlpha = (kind === 3 ? 0.85 : 0.7) * pul; ctx.stroke();
        if (kind >= 2) { ctx.setLineDash([2, 3]); ctx.lineDashOffset = -t / 3; ctx.beginPath(); ctx.ellipse(p.x, p.y, rx + 4, ry + 2, 0, 0, 7); ctx.stroke(); }
        ctx.restore();
        if (w[1] === 'death') for (var sk = 0; sk < 4; sk++) { var sa = t / 90 + sk * Math.PI / 2; ctx.globalAlpha = 0.5 + 0.4 * pul; px(ctx, p.x + Math.cos(sa) * rx, p.y + Math.sin(sa) * ry, E.c[0], 2); ctx.globalAlpha = 1; }
      });
    });
    // a thread along the floor from the one who holds a bond to the one it holds (09-29): a warding bond (platinum, from the caster), Hunter's
    // Mark and Mirror's Gaze (red, violet: from the hunter to the quarry), a grapple (bone: from the grappler to the held), a spark running its length
    B.units.forEach(function (u) {
      if (u.dead || u.hp <= 0 || u.left || u.ethereal) return;
      var cd = u.conds, ties = [];
      if (cd.wardingBond && cd.wardingBond.by) ties.push([cd.wardingBond.by, FX.EL.cold.c[1], 0.8, 'bond']);
      if (cd.marked && cd.marked.by) ties.push([cd.marked.by, cd.marked.gaze ? P('violet', 5) : P('red', 3), 0.7, 'hunt']);
      if (cd.restrained && cd.restrained.grapple && cd.restrained.by) ties.push([cd.restrained.by, P('bone', 1), 0.9, 'grip']);
      ties.forEach(function (tie) {
        var src = B.units.filter(function (w) { return w.id === tie[0]; })[0]; if (!src || src === u || src.dead || src.hp <= 0 || src.left || src.ethereal) return;
        var a = D.ui.unitPos(B, src), b = D.ui.unitPos(B, u), k = (t % 50) / 50;
        ctx.save(); ctx.globalAlpha = tie[2]; ctx.strokeStyle = tie[1]; ctx.lineWidth = 1; ctx.setLineDash(tie[3] === 'grip' ? [5, 1] : [3, 3]); ctx.lineDashOffset = -t / 3;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
        ctx.globalAlpha = Math.sin(Math.PI * k); px(ctx, a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, tie[1], 2); ctx.globalAlpha = 1;
        // at the hunter's foot, a small ring of its own colour, so the one who hunts can be picked out from the one who is hunted
        if (tie[3] === 'hunt' || tie[3] === 'bond') { ctx.save(); ctx.globalAlpha = 0.6; ctx.strokeStyle = tie[1]; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(a.x, a.y, 7, 3, 0, 0, 7); ctx.stroke(); ctx.restore(); }
      });
    });
    // the paladin's aura (RU.auraOf: Protection from 6, Devotion from 7), 09-29. js/ui.js overlay already lays the gold protection ring (dashed,
    // 2.9 squares, its own copy of the paladin test); this adds Devotion's line, a second, paler one inside it. AURA_RING: set it true, and
    // take that block out of js/ui.js overlay, to have the protection ring drawn from here as well (one test for rules and looks)
    var RU = D.rules, AURA_RING = false;
    if (RU && RU.auraOf) B.units.forEach(function (pa) {
      var au = RU.auraOf(pa); if (!au) return;
      var q = D.ui.unitPos(B, pa), pl = 0.6 + 0.4 * Math.sin(t / 20), rr = au.r / 5 * 1.45 * Math.SQRT2; // (10 ft: 2.9 squares, the corners of the 5x5 block within it)
      ctx.save();
      if (AURA_RING) { ctx.beginPath(); ctx.ellipse(q.x, q.y, rr * D.iso.TW / 2, rr * D.iso.TH / 2, 0, 0, 7); ctx.globalAlpha = 0.06; ctx.fillStyle = P('gold', 3); ctx.fill(); ctx.globalAlpha = 0.75; ctx.strokeStyle = P('gold', 3); ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]); }
      if (au.devotion) { var ri = rr - 0.5 * Math.SQRT2; ctx.beginPath(); ctx.ellipse(q.x, q.y, ri * D.iso.TW / 2, ri * D.iso.TH / 2, 0, 0, 7); ctx.globalAlpha = 0.28 + 0.14 * pl; ctx.strokeStyle = P('bone', 2); ctx.lineWidth = 1; ctx.stroke(); }
      ctx.restore();
    });
    // the zones that move (09-29): Moonbeam's squares washed pale and the Flaming Sphere's reach warm, so one can see what is in them, and a
    // ring at the feet of each creature caught in one (the beam takes whoever enters it or starts a turn there; the sphere whoever ends a turn beside it)
    (B.zones || []).forEach(function (z) {
      var moon = z.id === 'moonbeam', sqs = zoneSquares(z), ZC = moon ? [P('bone', 2), P('glow', 2)] : [P('fire', 1), P('fire', 0)], zp = 0.6 + 0.4 * Math.sin(t / 10);
      sqs.forEach(function (q) {
        onSq(q[0], q[1], function (c) {
          D.iso.rhombus(c, q[0], q[1], D.iso.map.gz(q[0], q[1]), 2); c.globalAlpha = 0.08 + 0.06 * zp; c.fillStyle = ZC[0]; c.fill();
          c.globalAlpha = 0.3 * zp; c.strokeStyle = ZC[1]; c.lineWidth = 1; c.stroke(); c.globalAlpha = 1;
        });
      });
      B.units.forEach(function (u) {
        if (!G.standing(u) || u.left || u.fled || !(moon ? G.inArea(u, sqs) : G.dist(u, { x: z.x, y: z.y, size: 1 }) <= 5)) return;
        var p = D.ui.unitPos(B, u);
        ctx.save(); ctx.globalAlpha = 0.75; ctx.strokeStyle = ZC[1]; ctx.lineWidth = 1; ctx.setLineDash([3, 2]); ctx.lineDashOffset = t / 4;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, 12, 5.5, 0, 0, 7); ctx.stroke(); ctx.restore();
        ctx.globalAlpha = 0.6; px(ctx, p.x + Math.cos(t / 9) * 12, p.y + Math.sin(t / 9) * 5.5, ZC[0], 2); ctx.globalAlpha = 1;
      });
    });
  };
  // the squares a zone bites: the beam's (js/grimoire.js zoneSq), and every open square within 5 ft of the sphere
  function zoneSquares(z) {
    if (z.id === 'moonbeam') return M.zoneSq ? M.zoneSq(z) : [[z.x, z.y]];
    var out = [];
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var s = G.map.at(z.x + dx, z.y + dy); if (s && s.open) out.push([z.x + dx, z.y + dy]); }
    return out;
  }
  function groundSq(c, g, x, y, t) {
    var s = sq(x, y), h = hsh(x, y), i, E;
    if (g.kind === 'vines') { // Entangle: green tendrils, swaying, a leaf here and there
      E = FX.EL.nature; D.iso.rhombus(c, x, y, D.iso.map.gz(x, y), 1); c.globalAlpha = 0.4; c.fillStyle = E.c[3]; c.fill(); c.globalAlpha = 1;
      for (i = 0; i < 6; i++) {
        var bx = s.x + (hsh(x + i, y) - 0.5) * 38, by = s.y + (hsh(x, y + i) - 0.5) * 16, hgt = 10 + hsh(x + i, y + i) * 12, sway = Math.sin(t / 18 + i + h * 6) * 3.5;
        for (var k = 0; k < hgt; k += 1) { var q = k / hgt; px(c, bx + Math.sin(q * 5 + i) * 2.5 + sway * q, by - k, q > 0.75 ? E.c[1] : q > 0.35 ? E.c[2] : E.c[3], q < 0.5 ? 2 : 1); }
        px(c, bx + sway + 3, by - hgt * 0.55, E.c[0], 3); px(c, bx + sway * 0.6 - 3, by - hgt * 0.3, E.c[1], 2); // (leaves)
      }
    } else if (g.kind === 'spikes') { // Spike Growth: tiny stalagmites, stone cones rising from the floor, a glint on a tip now and then
      for (i = 0; i < 7; i++) {
        var dy = ((i + hsh(x, y + i * 3)) / 7 - 0.5) * 18, half = (32 - Math.abs(dy) * 2) * 0.8; // (bands run back to front, so the near cones overlap the far ones)
        var sx = Math.round(s.x + (hsh(x + i * 3, y) * 2 - 1) * half), sy = Math.round(s.y + dy);
        var sh = 4 + Math.floor(hsh(x + i, y + i * 2) * 5), sw = sh > 7 ? 4 : sh > 5 ? 3 : 2; // (4 to 8 tall, 2 to 4 wide at the foot)
        c.globalAlpha = 0.55; for (var j = 0; j <= sw; j++) px(c, sx - Math.floor(sw / 2) + j, sy + 1, P('outline', 0), 1); c.globalAlpha = 1; // (a shadow at the foot)
        for (var k3 = 0; k3 < sh; k3++) {
          var w3 = k3 === sh - 1 ? 1 : Math.max(1, Math.round(sw * (1 - k3 / sh))), l3 = sx - Math.floor(w3 / 2), lv = k3 === sh - 1 ? 6 : k3 < sh * 0.34 ? 3 : k3 < sh * 0.7 ? 4 : 5;
          for (var m = 0; m < w3; m++) px(c, l3 + m, sy - k3, P('stone', w3 > 1 && m === 0 ? lv + 1 : w3 > 2 && m === w3 - 1 ? lv - 1 : lv), 1); // (lit on the left, the base a shade darker than the tip)
        }
        if ((t + i * 7 + h * 60) % 60 < 4) px(c, sx, sy - sh + 1, P('stone', 7), 1);
      }
    } else if (g.kind === 'grease') { // Grease: a dark sheen, a glint sliding over it
      D.iso.rhombus(c, x, y, D.iso.map.gz(x, y), 2); c.globalAlpha = 0.45; c.fillStyle = P('stone', 1); c.fill(); c.globalAlpha = 1;
      var gl = ((t * 0.5 + h * 60) % 60) / 60; c.globalAlpha = 0.6 * Math.sin(Math.PI * gl); px(c, s.x - 14 + gl * 28, s.y - 3 + gl * 4, P('bone', 1), 2); px(c, s.x - 12 + gl * 28, s.y - 2 + gl * 4, P('silver', 5)); c.globalAlpha = 1;
    } else if (g.kind === 'tentacles') { // Evard's -- black tentacles: black ground, and tentacles writhing up out of it
      E = FX.EL.shadow; D.iso.rhombus(c, x, y, D.iso.map.gz(x, y), 2); c.globalAlpha = 0.5; c.fillStyle = P('outline', 0); c.fill(); c.globalAlpha = 1;
      for (i = 0; i < 3; i++) {
        var tx = s.x + (hsh(x + i, y * 2) - 0.5) * 30, ty = s.y + (hsh(x * 2, y + i) - 0.5) * 12, th = 10 + hsh(x + i, y + i) * 10;
        for (var k2 = 0; k2 < th; k2++) { var q2 = k2 / th; px(c, tx + Math.sin(q2 * 4 + t / 9 + i * 2) * 4 * q2, ty - k2, q2 > 0.8 ? E.c[1] : P('outline', 0), q2 < 0.5 ? 3 : 2); }
      }
    } else if (g.kind === 'glyph') { // Glyph of Warding: a faint gold rune, turning
      E = FX.EL.holy; var pl = 0.45 + 0.25 * Math.sin(t / 10);
      c.save(); c.globalAlpha = pl; c.strokeStyle = E.c[1]; c.lineWidth = 1; c.beginPath(); c.ellipse(s.x, s.y, 14, 7, 0, 0, 7); c.stroke();
      for (i = 0; i < 6; i++) { var an = t / 50 + i * Math.PI / 3; px(c, s.x + Math.cos(an) * 10, s.y + Math.sin(an) * 5, E.c[0], 2); }
      c.restore();
    } else if (g.kind === 'quake') { // Earthquake: the floor split and heaving
      E = FX.EL.earth; c.globalAlpha = 0.8;
      var cx0 = s.x - 16 + h * 8, cy0 = s.y - 2; for (i = 0; i < 8; i++) { px(c, cx0 + i * 4, cy0 + Math.sin(i * 1.7 + h * 9) * 3, P('outline', 0), 2); }
      if ((t + Math.floor(h * 20)) % 24 < 6) { c.globalAlpha = 0.5; px(c, s.x + (h - 0.5) * 20, s.y - 4, E.c[1], 3); }
      c.globalAlpha = 1;
    } else if (g.kind !== 'insects') { // anything else a spell leaves on the floor: a faint wash of its colour
      D.iso.rhombus(c, x, y, D.iso.map.gz(x, y), 2); c.globalAlpha = 0.2; c.fillStyle = P('violet', 3); c.fill(); c.globalAlpha = 1;
    }
  }

  // before the figure: its false images (Mirror Image, Mislead's double, the Doubling, the phantasms), blur's shiver, haste's
  // afterimages. A false image struck breaks like glass where it stood
  var IMG_OFF = [[-15, 2], [15, -2], [0, -7]];
  LK.behind = function (ctx, B, u, p, anim, t, o) {
    var n = Math.max(0, u.images || 0), was = u._imgs || 0;
    if (n < was) for (var k = n; k < was; k++) { var off = IMG_OFF[k % 3]; shatter(u, off); }
    u._imgs = n;
    var E = FX.EL.arcane;
    for (var i = 0; i < n; i++) {
      var of = IMG_OFF[i % 3], bob = Math.sin(B.t / 9 + i * 2) * 1.5, shim = 0.5 + 0.12 * Math.sin(B.t / 5 + i * 2.1);
      D.spr.draw(ctx, u.sheet, anim, u.facing || 0, t + i * 5, p.x + of[0] + bob, p.y + of[1], { alpha: shim + 0.12, tint: E.c[1], tintAlpha: 0.3 });
      if (((B.t >> 2) + i * 3) % 11 === 0) FX.star(ctx, p.x + of[0] + bob, p.y + of[1] - D.spr.unitTop(u) * 0.7, E, 3); // (a glint: glass)
    }
    if (u.conds.blur) { var jx = Math.sin(B.t / 3) * 2; D.spr.draw(ctx, u.sheet, anim, u.facing || 0, t, p.x + jx, p.y, { alpha: 0.3, tint: E.c[1], tintAlpha: 0.4 }); D.spr.draw(ctx, u.sheet, anim, u.facing || 0, t, p.x - jx, p.y, { alpha: 0.3, tint: E.c[2], tintAlpha: 0.4 }); }
    if (u.conds.hasted && anim !== 'idle') { var hf = FACE_BACK[(u.facing || 0) % 8]; for (var h2 = 1; h2 <= 2; h2++) D.spr.draw(ctx, u.sheet, anim, u.facing || 0, t - h2 * 3, p.x + hf[0] * h2 * 4, p.y + hf[1] * h2 * 2, { alpha: 0.35 - h2 * 0.1, tint: FX.EL.cold.c[2], tintAlpha: 0.6 }); }
    // Blink: a moment in every fifty or so the figure slips a step to either side, violet, and is back (while it is solid; when it is out of the world js/ui.js fades it)
    if (u.conds.blink) { var bk = (B.t + uph(u)) % 52; if (bk < 7) { var bo = 6 * Math.sin(Math.PI * bk / 7); [-1, 1].forEach(function (sd) { D.spr.draw(ctx, u.sheet, anim, u.facing || 0, t, p.x + sd * bo, p.y, { alpha: 0.4, tint: E.c[2], tintAlpha: 0.55 }); }); } }
  };
  var FACE_BACK = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
  function shatter(u, off) {
    var E = FX.EL.arcane, sh = []; for (var i = 0; i < 16; i++) { var a = Math.random() * 6.283, v = 0.8 + Math.random() * 1.6; sh.push({ vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, c: i % 3 }); }
    D.sfx('crit');
    FX.add({ kind: 'shatter', dur: 30, draw: function (ctx) {
      var b = FX.body(u), cx = b.x + off[0], cy = b.y + off[1] - b.top * 0.5, t = this.t;
      sh.forEach(function (s) { var x = cx + s.vx * t, y = cy + s.vy * t + 0.06 * t * t; ctx.globalAlpha = 1 - t / 30; px(ctx, x, y, E.c[s.c], 2); px(ctx, x + s.vx * 0.8, y + s.vy * 0.8, E.c[0]); });
      if (t < 8) { ctx.globalAlpha = 1 - t / 8; FX.star(ctx, cx, cy, E, 6 + t); }
      ctx.globalAlpha = 1;
    } });
  }

  // a tint for the whole figure from what is on it (the conditions ui.js tints for itself come after and win)
  LK.tint = function (u, B) {
    var c = u.conds;
    if (c.stoneskin || c.stoning) return [P('stone', 5), 0.35];
    if (c.barkskin) return [P('leather', 3), 0.3];
    // (a barbarian's Rage is a condition; a foe that rages when hurt -- rageOnHit, js/battle.js -- is a flag on the creature itself)
    if (c.raging || u.raging) return [P('red', 3), 0.12 + 0.08 * Math.sin(B.t / 6)];
    if (c.enlarged) return null;
    if (c.ablaze || c.heated) return [P('fire', 1), 0.18 + 0.1 * Math.sin(B.t / 4)];
    if (c.frosted) return [FX.EL.cold.c[1], 0.3];
    return null;
  };

  // after the figure: the marks of what is on it, small, over the head or about the body
  LK.over = function (ctx, B, u, p) {
    var c = u.conds, t = B.t, top = D.spr.unitTop(u), hx = p.x, hy = p.y - top - 11, E;
    // blessed: gold motes wheeling over the head; baned, cursed: dark ones
    if (c.blessed || c.guided || c.inspired || c.helped) orbit(ctx, hx, hy, FX.EL.holy, 2, t, 7);
    if (c.baned || c.cursed || c.contagion) orbit(ctx, hx, hy, FX.EL.shadow, 2, t + 40, 7);
    // Beacon of Hope, 09-29 (Griz: "a status effect animation for 'maximized healing with wis bonus' or what-have-you until the spell
    // gets dropped"). A small sun over the head of each one who has hope on them: a gold disc with a bright spot, eight short rays that
    // turn slowly, and about once a second the whole sun flares, the disc swelling and the rays lengthening. It is drawn from the
    // condition itself, so it goes when the caster's concentration lifts it. It rides a few pixels above blessed's wheeling motes
    // when the same creature has both, and sits about where the other head marks do when it does not.
    if (c.beacon) {
      E = FX.EL.holy;
      var bsy = c.blessed || c.guided || c.inspired || c.helped ? hy - 10 : hy - 5, bph = t % 64, bfl = bph < 12 ? Math.sin(Math.PI * bph / 12) : 0, bsa = t / 60;
      glow(ctx, hx, bsy, E.c[2], 5 + bfl * 4, 0.25 + bfl * 0.3);
      for (var bri = 0; bri < 8; bri++) {
        var bsn = bsa + bri * Math.PI / 4, bsl = (bri % 2 ? 4 : 5) + (bfl > 0.5 ? 1 : 0);
        for (var brr = 3; brr <= bsl; brr++) px(ctx, hx + Math.cos(bsn) * brr, bsy + Math.sin(bsn) * brr, brr < 5 ? E.c[1] : E.c[2], 1);
      }
      px(ctx, hx, bsy, E.c[1], bfl > 0.5 ? 4 : 3);
      px(ctx, hx - 1, bsy - 1, E.c[0], bfl > 0.5 ? 2 : 1);
      if (bfl > 0.15) FX.star(ctx, hx, bsy, E, 3 + Math.round(bfl * 4));
    }
    // marked (Hunter's Mark, the Hex): a red sigil over the head
    if (c.marked || c.branded) { E = FX.EL.fire; var mk = (t >> 3) & 1; px(ctx, hx, hy - 4, P('red', 4), 2); px(ctx, hx - 3, hy - 4, P('red', 3)); px(ctx, hx + 3, hy - 4, P('red', 3)); px(ctx, hx, hy - 7, P('red', 3)); px(ctx, hx, hy - 1, P('red', 3)); if (mk) glow(ctx, hx, hy - 4, P('red', 2), 5, 0.3); }
    // hasted: blue ticks at the heels; slowed: a heavy drip
    if (c.hasted) { E = FX.EL.cold; for (var i = 0; i < 3; i++) { var ph = (t * 1.5 + i * 7) % 20; ctx.globalAlpha = 1 - ph / 20; px(ctx, p.x - 8 + i * 8, p.y - 4 - ph * 0.5, E.c[1], 2); } ctx.globalAlpha = 1; }
    if (c.slowed || c.lethargic) { E = FX.EL.thunder; var dp = (t * 0.3) % 24; ctx.globalAlpha = 1 - dp / 24; px(ctx, p.x + 6, p.y - top * 0.6 + dp, E.c[2], 2); ctx.globalAlpha = 1; }
    // frightened: sweat and a shiver
    if (c.frightened || c.feared || c.turned) { E = FX.EL.shadow; for (var f = 0; f < 2; f++) { var fp = (t * 0.8 + f * 10) % 20; ctx.globalAlpha = 1 - fp / 20; px(ctx, hx - 7 + f * 14, hy + 6 + fp * 0.6, FX.EL.cold.c[1], 2); } ctx.globalAlpha = 1; }
    // charmed, hypnotized, confused, laughing, commanded: pink turning over the head
    if (c.charmed || c.hypnotized || c.confused || c.laughing || c.commanded) { E = FX.EL.charm; for (var s2 = 0; s2 < 6; s2++) { var an = t / 8 + s2 * 0.9, r = 2 + s2 * 1.1; px(ctx, hx + Math.cos(an) * r, hy + Math.sin(an) * r * 0.5, s2 % 2 ? E.c[1] : E.c[2], 2); } }
    // stunned: stars round the head
    if (c.stunned) { E = FX.EL.lightning; for (var st = 0; st < 3; st++) { var sa = t / 10 + st * 2.1; px(ctx, hx + Math.cos(sa) * 9, hy + 3 + Math.sin(sa) * 3, E.c[1], 2); px(ctx, hx + Math.cos(sa) * 9, hy + 3 + Math.sin(sa) * 3 - 2, E.c[0]); } }
    // poisoned, sickened: green bubbles; acid on it: drips
    if (c.poisoned || c.sickened) bubbles(ctx, p.x, p.y - top * 0.5, FX.EL.poison, t);
    if (c.acid) { E = FX.EL.acid; for (var a2 = 0; a2 < 2; a2++) { var ap = (t * 0.7 + a2 * 13) % 26; ctx.globalAlpha = 1 - ap / 26; px(ctx, p.x - 4 + a2 * 8, p.y - top * 0.6 + ap, E.c[1], 2); } ctx.globalAlpha = 1; }
    // Shield of Faith: a thin gold shimmer about the body
    if (c.shieldOfFaith || c.shield) { E = FX.EL.holy; ctx.save(); ctx.globalAlpha = 0.45 + 0.2 * Math.sin(t / 6); ctx.strokeStyle = c.shield ? FX.EL.arcane.c[1] : E.c[1]; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.lineDashOffset = t / 2; ctx.beginPath(); ctx.ellipse(p.x, p.y - top / 2, 14, top / 2 + 5, 0, 0, 7); ctx.stroke(); ctx.restore(); }
    // a blade made bright (Divine Favor, Magic Weapon, the Flame Blade, Shillelagh, the smite waiting): a glint at the hands
    if (c.divineFavor || c.magicWeapon || c.flameBlade || c.shillelagh || c.branding || c.sacred) { E = c.flameBlade ? FX.EL.fire : FX.EL.holy; var hg = FX.hands(u); if ((t >> 2) % 4 === 0) FX.star(ctx, hg.x, hg.y, E, 4); else px(ctx, hg.x, hg.y, E.c[1], 2); }
    // held by the vines (Entangle) or the tentacles: they wind up its legs
    var rs = c.restrained;
    if (rs && (B.grounds || []).some(function (g) { return (g.kind === 'vines' || g.kind === 'tentacles') && g.sq.some(function (q) { return q[0] === u.x && q[1] === u.y; }); })) {
      var tent = (B.grounds || []).some(function (g) { return g.kind === 'tentacles' && g.sq.some(function (q) { return q[0] === u.x && q[1] === u.y; }); }), VE = tent ? FX.EL.shadow : FX.EL.nature;
      for (var vi = 0; vi < 3; vi++) for (var vk = 0; vk < 22; vk++) { var vq = vk / 22, vx = p.x + Math.sin(vq * 9 + vi * 2.1 + t / 20) * (7 - vq * 2), vy = p.y - vk * 1.1; px(ctx, vx, vy, tent ? (vq > 0.8 ? VE.c[1] : P('outline', 0)) : vq > 0.7 ? VE.c[1] : VE.c[2], 2); }
    }
    // Faerie Fire: violet motes crawling the outline (the tint is ui.js's)
    if (c.faerie) { E = FX.EL.charm; for (var fm = 0; fm < 8; fm++) { var fa = t / 14 + fm * 0.785; px(ctx, p.x + Math.cos(fa) * 10, p.y - top / 2 + Math.sin(fa) * (top / 2), (fm + (t >> 2)) % 2 ? P('violet', 5) : P('violet', 4), 2); } }
    // Heroism: a gold glint now and then; Fire Shield: flames about it
    if (c.heroism && (t % 40) < 6) FX.star(ctx, hx, hy + 2, FX.EL.holy, 4);
    if (c.fireShield) { E = FX.EL.fire; for (var fs = 0; fs < 6; fs++) { var fa2 = t / 12 + fs * 1.05, fy = (t * 0.8 + fs * 5) % 10; px(ctx, p.x + Math.cos(fa2) * 12, p.y - top / 2 + Math.sin(fa2) * 6 - fy, fy < 4 ? E.c[0] : E.c[1], 2); } }
    overMore(ctx, B, u, p, top, hx, hy);
  };

  // ------------------------------------------------------------------ the rest of what lasts (09-29; Griz: "Approve your recommend on the status
  // effect visuals for players" -- every lasting condition a player would act on gets a mark: a buff worth keeping up, a debuff worth curing
  // or exploiting; the instantaneous and the self-evident -- prone, dead, the fade of invisible or hidden, a size grown -- do not).
  // The head has one crowded spot already (the wheel, the sun, the sigil), so what is left goes elsewhere and each in a place of its own:
  // small badges in a row above the head (a dark plaque, its edge violet for a curse or a loss and gold for a gift, an icon on it), the
  // body (brackets, clamps, a sheen, guards), the hands, the heels. The long buffs (Mage Armor, Aid, Longstrider) move only now and
  // then, so a creature carrying four things is not a smear. Floor rings, threads and zones are LK.ground's.
  function uph(u) { var s = String(u.id || u.name || 'x'), h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997; return h; } // (a phase of its own, from its name)
  // a pixel with a dark drop shadow under it, so a mark of a pixel or two shows against a pale sprite as against a dark floor
  function dpx(ctx, x, y, c, s) { var a = ctx.globalAlpha; ctx.globalAlpha = a * 0.6; px(ctx, x + 1, y + 1, P('outline', 0), s); ctx.globalAlpha = a; px(ctx, x, y, c, s); }
  function plus(ctx, x, y, E) { for (var d = 1; d <= 2; d++) { dpx(ctx, x - d, y, E.c[1]); dpx(ctx, x + d, y, E.c[1]); dpx(ctx, x, y - d, E.c[1]); dpx(ctx, x, y + d, E.c[1]); } dpx(ctx, x, y, E.c[0], 2); }
  function chev(ctx, x, y, E) { dpx(ctx, x, y, E.c[0], 2); for (var d = 1; d <= 3; d++) { dpx(ctx, x - d, y + d, d < 3 ? E.c[1] : E.c[2]); dpx(ctx, x + d, y + d, d < 3 ? E.c[1] : E.c[2]); } }
  // an icon: rows of letters, one pixel each, the colour of each letter from `col` (a letter with none is left clear); x, y its middle
  function icon(ctx, x, y, rows, col) {
    var w = rows[0].length, ox = Math.round(x) - Math.floor(w / 2), oy = Math.round(y) - 2;
    for (var r = 0; r < rows.length; r++) for (var q = 0; q < w; q++) { var ch = rows[r].charAt(q); if (ch !== '.' && col[ch]) { ctx.fillStyle = col[ch]; ctx.fillRect(ox + q, oy + r, 1, 1); } }
  }
  // the plaque behind an icon: 9 by 7, dark, an edge of the given colour (the icon is 5 tall, at most 7 wide)
  function badge(ctx, x, y, edge) {
    x = Math.round(x); y = Math.round(y);
    ctx.globalAlpha = 0.7; ctx.fillStyle = P('outline', 0); ctx.fillRect(x - 4, y - 3, 9, 7);
    ctx.globalAlpha = 0.65; ctx.fillStyle = edge; ctx.fillRect(x - 4, y - 3, 9, 1); ctx.fillRect(x - 4, y + 3, 9, 1); ctx.fillRect(x - 4, y - 3, 1, 7); ctx.fillRect(x + 4, y - 3, 1, 7);
    ctx.globalAlpha = 1;
  }
  var ICON_SHUT = ['.......', '#.....#', '.#####.', '.#.#.#.', '.......'], ICON_EYE = ['..###..', '.#ooo#.', '#ooXoo#', '.#ooo#.', '..###..'];
  var ICON_NOHEAL = ['x.#..', '.x#..', '##x##', '..#x.', '..#.x'], ICON_CROWN = ['H..H..H', 'MM.M.MM', 'MMMMMMM', 'DDDDDDD', '.......'];
  var ICON_SHIELD = ['hhhhh', '#ooo#', '#ooo#', '.#o#.', '..#..'], ICON_THOUGHT = ['.###...', '#...#..', '.###...', '....o..', '.....o.'];
  var ICON_BANG = ['..#..', '..#..', '..#..', '.....', '..#..'], ICON_CLOUD = ['..AAA..', '.ABBBB.', 'BBBBBBC', '...Z...', '..Z....'];
  var ICON_HELD = ['..#..', '.#o#.', '#oXo#', '.#o#.', '..#..'];
  var RING8 = [[0, -2], [1, -1], [2, 0], [1, 1], [0, 2], [-1, 1], [-2, 0], [-1, -1]];
  // the colours of the spell a creature holds (its school's, or the element of its damage: LK.of), asked once per spell
  var CONC_EL = {};
  function concEl(id) { if (!CONC_EL[id]) { var el = 'arcane'; try { el = LK.of(id).el; } catch (e) { el = 'arcane'; } CONC_EL[id] = FX.EL[el] || FX.EL.arcane; } return CONC_EL[id]; }
  function overMore(ctx, B, u, p, top, hx, hy) {
    // bw: half the width of the sprite, a foot-soldier's 13 and more for a big creature, so the body marks stand clear of it
    var c = u.conds, t = B.t, ph = uph(u), E, i, k, bodyY = p.y - top * 0.5, hb = FACE_BACK[(u.facing || 0) % 8], bw = (13 + 9 * ((u.size || 1) - 1)) * (D.spr.scaleOf ? D.spr.scaleOf(u) : 1);

    // badges over the head, in a row centred on it and clear of the wheel, the sun and the sigil: blinded (a closed eye), unable to heal
    // (Chill Touch: a plus struck through), the mind gone (Feeblemind: an empty thought), unable to act with no other sign of it (a slow
    // ellipsis), caught off guard (the first round: a bang); then the gifts: heroism (a crown), foresight (an open eye, blinking now
    // and then), a ward against one kind of harm (Protection from Energy: a shield in its colour), Freedom of Movement (a ring with a
    // gap that turns), Mind Blank (a sealed ring), a storm called (Call Lightning: a cloud that flashes)
    var by = c.beacon ? (c.blessed || c.guided || c.inspired || c.helped ? hy - 10 : hy - 5) - 9 : c.marked || c.branded ? hy - 12 : c.blessed || c.guided || c.inspired || c.helped || c.baned || c.cursed || c.contagion ? hy - 8 : hy - 4;
    var L = [], VI = P('violet', 3), GO = P('gold', 3);
    if (c.blinded) L.push(function (x) { badge(ctx, x, by, VI); icon(ctx, x, by, ICON_SHUT, { '#': P('silver', 5) }); });
    if (c.noHeal) L.push(function (x) { badge(ctx, x, by, P('glow', 0)); icon(ctx, x, by, ICON_NOHEAL, { '#': P('glow', 2), x: P('red', 3) }); });
    if (c.feeble) L.push(function (x) { badge(ctx, x, by, VI); icon(ctx, x, by, ICON_THOUGHT, { '#': P('stone', 5), o: (t >> 4) & 1 ? P('stone', 4) : P('stone', 3) }); });
    if (c.incapacitated && !(c.paralyzed || c.stunned || c.asleep || c.laughing || c.hypnotized)) L.push(function (x) { badge(ctx, x, by, VI); for (var d = 0; d < 3; d++) px(ctx, x - 2 + d * 2, by + 1, Math.floor(t / 9) % 3 === d ? P('bone', 1) : P('stone', 4)); });
    if (c.surprised) L.push(function (x) { badge(ctx, x, by, P('fire', 1)); icon(ctx, x, by, ICON_BANG, { '#': (t >> 3) & 1 ? P('bone', 2) : P('gold', 4) }); });
    if (c.heroism) L.push(function (x) { var HE = FX.EL.holy; badge(ctx, x, by, GO); icon(ctx, x, by, ICON_CROWN, { H: HE.c[0], M: HE.c[1], D: HE.c[2] }); });
    if (c.foresight) L.push(function (x) { badge(ctx, x, by, GO); var shut = (t + ph) % 100 < 5; icon(ctx, x, by, shut ? ICON_SHUT : ICON_EYE, { '#': shut ? P('bone', 1) : P('gold', 3), o: P('bone', 2), X: P('glow', 1) }); });
    if (c.energyWard) L.push(function (x) { var EW = FX.EL[c.energyWard.type] || FX.EL.arcane; badge(ctx, x, by, EW.c[2]); icon(ctx, x, by, ICON_SHIELD, { h: EW.c[0], '#': EW.c[1], o: EW.c[2] }); });
    if (c.freeMove) L.push(function (x) { badge(ctx, x, by, GO); var gap = Math.floor(t / 7) % 8; RING8.forEach(function (q, j) { if (j !== gap && j !== (gap + 1) % 8) px(ctx, x + q[0], by + q[1], P('glow', 2)); }); px(ctx, x + RING8[gap][0], by + RING8[gap][1], P('bone', 2)); });
    if (c.mindBlank) L.push(function (x) { badge(ctx, x, by, P('violet', 4)); RING8.forEach(function (q) { px(ctx, x + q[0], by + q[1], P('violet', 5)); }); px(ctx, x, by, (t >> 4) & 1 ? P('bone', 2) : P('violet', 4)); });
    if (c.storm) L.push(function (x) { var TE = FX.EL.thunder, fl = (t + ph) % 34 < 5; badge(ctx, x, by, P('blue', 3)); icon(ctx, x, by, ICON_CLOUD, { A: TE.c[1], B: TE.c[2], C: TE.c[3], Z: fl ? FX.EL.lightning.c[1] : null }); });
    // a spell held (either side; Griz's rule: a held spell on a foe is one to act on -- strike the caster and it may break): the last badge in
    // the row, a diamond in the spell's own colours with a bright heart that beats, so a caster who is holding something can be picked out
    if (u.conc) L.push(function (x) { var CE = concEl(u.conc.id); badge(ctx, x, by, CE.c[1]); icon(ctx, x, by, ICON_HELD, { '#': CE.c[0], o: CE.c[1], X: (t + ph) % 44 < 22 ? P('bone', 2) : CE.c[0] }); });
    L.forEach(function (f, n) { f(Math.round(hx + (n - (L.length - 1) / 2) * 10)); });

    // held (Hold Person, Hold Monster, the spider's venom): four violet corner brackets round the body, a bright spark going round them
    // (the figure itself is frozen and tinted by js/ui.js)
    if (c.paralyzed) {
      var bx0 = p.x - bw - 3, bx1 = p.x + bw + 3, by0 = p.y - top - 1, by1 = p.y + 2, lk = 0.65 + 0.3 * Math.sin(t / 7), sp = Math.floor(t / 7) % 4;
      [[bx0, by0, 1, 1], [bx1, by0, -1, 1], [bx1, by1, -1, -1], [bx0, by1, 1, -1]].forEach(function (q, j) {
        ctx.globalAlpha = lk;
        for (var a = 0; a < 5; a++) { dpx(ctx, q[0] + q[2] * a * 2, q[1], P('violet', 5), 2); if (a) dpx(ctx, q[0], q[1] + q[3] * a * 2, P('violet', 5), 2); }
        ctx.globalAlpha = 1;
        if (j === sp) dpx(ctx, q[0] + q[2] * 3, q[1] + q[3] * 3, P('bone', 2), 3);
      });
    }
    // grappled (the roper's tendril, a giant's grip): a pair of bone clamps at the waist, squeezing (and, under the feet, the thread to the one who holds: LK.ground)
    if (c.restrained && c.restrained.grapple) {
      var gy = p.y - top * 0.42, gq = Math.round(Math.sin(t / 9));
      for (k = -1; k <= 1; k += 2) { for (i = -2; i <= 2; i++) dpx(ctx, p.x + k * (bw + 1 - gq), gy + i * 2, P('bone', 1), 2); dpx(ctx, p.x + k * (bw - 2 - gq), gy - 4, P('bone', 1), 2); dpx(ctx, p.x + k * (bw - 2 - gq), gy + 4, P('bone', 1), 2); }
    }
    // Ray of Enfeeblement: the strength running out of the arm, dull drops falling past it (at the edge of the sprite, where they can be seen)
    if (c.enfeebled) { for (i = 0; i < 3; i++) { var eph = (t * 0.55 + i * 10) % 30; ctx.globalAlpha = 1 - eph / 30; dpx(ctx, p.x + bw - 3 + (i % 2) * 4, bodyY + 2 + eph * 0.9, i % 2 ? P('violet', 5) : P('stone', 6), 2); } ctx.globalAlpha = 1; }
    // Reckless Attack (till its next turn: every blow at it has the advantage): red slashes flung out to either side, the pair flipping like arms in a swing
    if (c.reckless) { var rf = (t >> 3) & 1, rly = p.y - top * 0.46; for (k = -1; k <= 1; k += 2) for (i = 0; i < 4; i++) dpx(ctx, p.x + k * (bw + 1 + i * 2), rly + (rf ? -i * 2 : i * 2), i > 1 ? P('red', 4) : P('red', 3), 2); }
    // Dodge (till its next turn: blows at it are at a disadvantage): a pale guard, a thin arc to either side of the chest
    if (c.dodge) { E = FX.EL.cold; ctx.globalAlpha = 0.75 + 0.2 * Math.sin(t / 10); for (k = 0; k < 6; k++) { var da = Math.sin(Math.PI * k / 5) * 3, dy = p.y - top * 0.66 + k * top * 0.09; dpx(ctx, p.x - bw - 3 - da, dy, E.c[1], 2); dpx(ctx, p.x + bw + 3 + da, dy, E.c[1], 2); } ctx.globalAlpha = 1; }
    // Irresistible Dance: the feet will not keep still, they hop in turn, and a note or two drifts up (the violet motes are Faerie Fire's, which it carries as well)
    if (c.dancing) {
      E = FX.EL.charm; var dh = (t >> 3) & 1, dn = (t * 0.6 + ph) % 36;
      dpx(ctx, p.x - 5, p.y - (dh ? 3 : 0), E.c[1], 3); dpx(ctx, p.x + 5, p.y - (dh ? 0 : 3), E.c[2], 3);
      ctx.globalAlpha = 1 - dn / 36; var nx = p.x + bw + 2 + Math.sin(dn / 5) * 2, ny = p.y - top * 0.35 - dn * 0.8; dpx(ctx, nx, ny, E.c[0], 2); dpx(ctx, nx + 1, ny - 2, E.c[0]); dpx(ctx, nx + 1, ny - 3, E.c[0]); dpx(ctx, nx + 1, ny - 4, E.c[0]); ctx.globalAlpha = 1;
    }
    // Mage Armor: a sheen of force slides across the chest now and then, blue-white
    if (c.mageArmor) { var ms = (t + ph) % 84; if (ms < 26) { E = FX.EL.arcane; var mx = p.x - (bw - 3) + ms * (bw - 3) / 13, my = p.y - top * 0.4; ctx.globalAlpha = Math.min(1, 1.3 * Math.sin(Math.PI * ms / 26)); for (i = -5; i <= 5; i++) { dpx(ctx, mx + i * 1.3, my - i * 1.9, E.c[0], 2); px(ctx, mx + i * 1.3 + 3, my - i * 1.9, E.c[1], 2); } ctx.globalAlpha = 1; } }
    // Aid (the day through): a small gold plus rises off the left shoulder every so often; Regenerate: a green one, steadier; Enhance Ability: two gold chevrons rise off the right
    if (c.aid) { var aq = (t + ph * 3) % 120; if (aq < 44) { ctx.globalAlpha = Math.sin(Math.PI * aq / 44); plus(ctx, p.x - bw, bodyY - aq * 0.32, FX.EL.holy); ctx.globalAlpha = 1; } }
    if (c.regenerating) { var rq = (t + ph * 5) % 70; ctx.globalAlpha = Math.sin(Math.PI * rq / 70); plus(ctx, p.x - bw, bodyY + 6 - rq * 0.25, FX.EL.heal); ctx.globalAlpha = 1; }
    if (c.enhanced) { var eq = (t + ph * 2) % 90; if (eq < 40) { ctx.globalAlpha = Math.sin(Math.PI * eq / 40); chev(ctx, p.x + bw, bodyY - eq * 0.3, FX.EL.holy); chev(ctx, p.x + bw, bodyY + 6 - eq * 0.3, FX.EL.holy); ctx.globalAlpha = 1; } }
    // Longstrider and Expeditious Retreat: two short green dashes stream off the heels, back the way it did not go
    if (c.longstrider || c.retreat) {
      E = FX.EL.nature;
      for (i = 0; i < 2; i++) {
        var lp = (t * 0.9 + i * 12) % 24, ld = 7 + lp * 0.6, lx = p.x + hb[0] * ld, ly = p.y - 3 - i * 5 + hb[1] * ld * 0.5;
        ctx.globalAlpha = 1 - lp / 24; ctx.fillStyle = P('outline', 0); if (hb[0]) ctx.fillRect(Math.round(lx - 3) + 1, Math.round(ly) + 1, 6, 2); else ctx.fillRect(Math.round(lx) + 1, Math.round(ly - 3) + 1, 2, 6);
        ctx.fillStyle = i ? E.c[1] : E.c[0]; if (hb[0]) ctx.fillRect(Math.round(lx - 3), Math.round(ly), 6, 2); else ctx.fillRect(Math.round(lx), Math.round(ly - 3), 2, 6);
      }
      ctx.globalAlpha = 1;
    }
    // Pass without Trace: smoke-grey wisps at the feet, drifting up and thinning
    if (c.pwt) for (i = 0; i < 3; i++) { var wp = (t * 0.35 + i * 14) % 42; glow(ctx, p.x - 8 + i * 8 + Math.sin(wp / 7 + i) * 2, p.y - 1 - wp * 0.2, i % 2 ? P('stone', 4) : P('violet', 3), 4 + wp / 10, 0.5 * (1 - wp / 42)); }
    // Vampiric Touch waiting: the hand dark with it, a violet glow and a green glint (the touch is the caster's action each turn)
    if (c.vampiric) { E = FX.EL.necrotic; var vh = FX.hands(u); glow(ctx, vh.x, vh.y, E.c[1], 6, 0.22 + 0.12 * Math.sin(t / 8)); px(ctx, vh.x, vh.y, E.c[0], 2); if ((t >> 2) % 6 === 0) FX.star(ctx, vh.x, vh.y, E, 3); }
  }
  function orbit(ctx, x, y, E, n, t, r) { for (var i = 0; i < n; i++) { var a = t / 12 + i * Math.PI * 2 / n, ox = x + Math.cos(a) * r, oy = y + Math.sin(a) * r * 0.35; glow(ctx, ox, oy, E.c[2], 3, 0.3); px(ctx, ox, oy, E.c[i % 2 ? 1 : 0], 2); } }
  function bubbles(ctx, x, y, E, t) { for (var i = 0; i < 3; i++) { var ph = (t * 0.5 + i * 9) % 26; ctx.globalAlpha = 1 - ph / 26; var bx = x - 6 + i * 6 + Math.sin(ph / 4 + i) * 2, by = y - ph; px(ctx, bx - 1, by, E.c[0]); px(ctx, bx + 1, by, E.c[0]); px(ctx, bx, by - 1, E.c[0]); px(ctx, bx, by + 1, E.c[0]); } ctx.globalAlpha = 1; }
})();
