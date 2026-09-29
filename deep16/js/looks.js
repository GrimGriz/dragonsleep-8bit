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
    nature: 'entangle spikegrowth barkskin shillelagh huntersmark insectplague',
    earth: 'grease stoneskin fleshtostone earthquake web',
    cold: 'icestorm fogcloud',
    thunder: 'gustofwind'
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
  // the things that stand up off the floor, in the depth sort with the figures (ui.js drawBattle)
  LK.props = function (B) {
    var out = [];
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
      var CL = kind === 'fog' ? [P('silver', 6), P('silver', 5), P('bone', 1), 0.28] : kind === 'stink' ? [P('orc', 3), P('gold', 3), P('orc', 2), 0.3] : kind === 'sleet' ? [P('bone', 2), P('glow', 2), P('silver', 5), 0.22] : [P('outline', 0), P('violet', 1), P('violet', 3), 0.55];
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
    // a creature under Sanctuary, Protection from Evil and Good, a warding bond, the holy aura: a soft ring of light at its feet
    B.units.forEach(function (u) {
      if (u.dead || u.hp <= 0) return;
      var cd = u.conds, kind = cd.holyAura ? 3 : cd.sanctuary ? 2 : cd.pfeg || cd.wardingBond || cd.deathWard || cd.beacon ? 1 : 0;
      if (!kind) return;
      var p = D.ui.unitPos(B, u), E = FX.EL.holy, pul = 0.5 + 0.3 * Math.sin(t / 12 + u.x);
      ctx.save(); ctx.globalAlpha = (kind === 3 ? 0.55 : 0.35) * pul; ctx.strokeStyle = kind === 2 ? E.c[0] : E.c[1]; ctx.lineWidth = kind === 3 ? 2 : 1;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 13 + kind * 2, 6 + kind, 0, 0, 7); ctx.stroke();
      if (kind >= 2) { ctx.setLineDash([2, 3]); ctx.lineDashOffset = -t / 3; ctx.beginPath(); ctx.ellipse(p.x, p.y, 17 + kind * 2, 8 + kind, 0, 0, 7); ctx.stroke(); }
      ctx.restore();
    });
  };
  function groundSq(c, g, x, y, t) {
    var s = sq(x, y), h = hsh(x, y), i, E;
    if (g.kind === 'vines') { // Entangle: green tendrils, swaying, a leaf here and there
      E = FX.EL.nature; D.iso.rhombus(c, x, y, D.iso.map.gz(x, y), 1); c.globalAlpha = 0.4; c.fillStyle = E.c[3]; c.fill(); c.globalAlpha = 1;
      for (i = 0; i < 6; i++) {
        var bx = s.x + (hsh(x + i, y) - 0.5) * 38, by = s.y + (hsh(x, y + i) - 0.5) * 16, hgt = 10 + hsh(x + i, y + i) * 12, sway = Math.sin(t / 18 + i + h * 6) * 3.5;
        for (var k = 0; k < hgt; k += 1) { var q = k / hgt; px(c, bx + Math.sin(q * 5 + i) * 2.5 + sway * q, by - k, q > 0.75 ? E.c[1] : q > 0.35 ? E.c[2] : E.c[3], q < 0.5 ? 2 : 1); }
        px(c, bx + sway + 3, by - hgt * 0.55, E.c[0], 3); px(c, bx + sway * 0.6 - 3, by - hgt * 0.3, E.c[1], 2); // (leaves)
      }
    } else if (g.kind === 'spikes') { // Spike Growth: thorns in the earth, hard to see
      E = FX.EL.nature;
      for (i = 0; i < 7; i++) { var sx = s.x + (hsh(x + i * 3, y) - 0.5) * 36, sy = s.y + (hsh(x, y + i * 3) - 0.5) * 16; px(c, sx, sy, P('leather', 1), 2); px(c, sx, sy - 2, E.c[2]); px(c, sx, sy - 3, (t + i * 7) % 60 < 4 ? E.c[0] : E.c[1]); }
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
    if (c.raging) return [P('red', 3), 0.12 + 0.08 * Math.sin(B.t / 6)];
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
  };
  function orbit(ctx, x, y, E, n, t, r) { for (var i = 0; i < n; i++) { var a = t / 12 + i * Math.PI * 2 / n, ox = x + Math.cos(a) * r, oy = y + Math.sin(a) * r * 0.35; glow(ctx, ox, oy, E.c[2], 3, 0.3); px(ctx, ox, oy, E.c[i % 2 ? 1 : 0], 2); } }
  function bubbles(ctx, x, y, E, t) { for (var i = 0; i < 3; i++) { var ph = (t * 0.5 + i * 9) % 26; ctx.globalAlpha = 1 - ph / 26; var bx = x - 6 + i * 6 + Math.sin(ph / 4 + i) * 2, by = y - ph; px(ctx, bx - 1, by, E.c[0]); px(ctx, bx + 1, by, E.c[0]); px(ctx, bx, by - 1, E.c[0]); px(ctx, bx, by + 1, E.c[0]); } ctx.globalAlpha = 1; }
})();
