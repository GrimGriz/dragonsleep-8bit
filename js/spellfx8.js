/* DRAGONSLEEP — the 8-bit battle's spells, made pretty (the spell animation pass, 09-28h; Griz: "I think we'll have to make 8-bit
   sprites for some ... a polish of the 8 bit will surface at some point, might as well pretty spells it now"). Still FF-simple and
   drawn in code like the rest of the 8-bit art, but each spell its own shape, not one burst of dots for all:
     the cast    -- motes gathering at the caster's hands in the spell's colours, and its element's voice (js/audio.js);
     the travel  -- a fire bolt with a trail, a frost shard, force darts that curve in, a held ray, a jagged bolt;
     the arrival -- a fireball blooming over the whole group, a lightning bolt through the line, a cone fanning out from the hands,
                    hail falling, a shaft of sacred flame, a shock ring, sleep dust, violet shackles;
     what lasts  -- a web you can see on the webbed, shackles on the held, drifting z's, the cloud as puffs, a halo on the blessed,
                    a ring on the shielded, the double of the misled, and the spiritual weapon hanging by its cleric, flying to
                    strike and back.
   Wraps the battle (the deep.js way: file order is call order, so this loads after js/battle.js). */
'use strict';
(function () {
  var DS = window.DS, BP = DS.Battle.prototype;
  var ELEM = { // (js/battle.js's own element colours, and the rest of the spells' schools)
    fire: ['#F83800', '#FCA044', '#F8D878'], cold: ['#A4E4FC', '#F8F8F8', '#3CBCFC'], lightning: ['#F8F878', '#F8F8F8', '#FCE0A8'],
    force: ['#D8B8F8', '#F8F8F8', '#9878F8'], acid: ['#B8F818', '#58D854', '#D8F878'], radiant: ['#F8D878', '#F8F8F8', '#FCE0A8'],
    thunder: ['#B8B8F8', '#F8F8F8', '#6888FC'], poison: ['#9878F8', '#58D854', '#D800CC'], necrotic: ['#787878', '#503000', '#9878F8'],
    heal: ['#58F898', '#B8F8B8', '#F8F8F8'], buff: ['#F8F8F8', '#F8D878', '#B8F8D8'], sleep: ['#6888FC', '#B8B8F8', '#F8F8F8'],
    charm: ['#F8A4C0', '#F8F8F8', '#D8B8F8'], arcane: ['#A4E4FC', '#F8F8F8', '#D8B8F8']
  };
  var VOICE = { fire: 'fire', cold: 'frost', lightning: 'zap', thunder: 'thunder', acid: 'acid', poison: 'poison', necrotic: 'necrotic', radiant: 'radiant', force: 'force', psychic: 'psychic', bludgeoning: 'frost' };
  var BIG = { fireball: 'fire2', lightningbolt: 'zap2', coneofcold: 'frost2', icestorm: 'frost2', shatter: 'thunder2', holdmonster: 'psychic2', revivify: 'heal2', daylight: 'radiant2' };
  function elOf(sp) {
    if (sp.id === 'icestorm') return 'cold';
    if (ELEM[sp.el] && sp.el !== 'force' || (sp.el === 'force' && (sp.kind === 'auto' || sp.kind === 'spiritweapon'))) return sp.el;
    return sp.kind === 'heal' || sp.kind === 'cure' || sp.kind === 'revive' ? 'heal' : sp.kind === 'sleep' || sp.kind === 'command' || /hold/.test(sp.id || '') ? 'charm'
      : sp.kind === 'buff' || sp.kind === 'light' || sp.kind === 'smite' ? 'buff' : sp.id === 'web' ? 'buff' : 'arcane';
  }
  function voiceOf(sp) {
    if (BIG[sp.id]) return sp.target === 'enemies' || sp.target === 'cone' || sp.target === 'line' ? VOICE[sp.el] || 'magic' : BIG[sp.id];
    if (VOICE[sp.el] && sp.el !== 'force') return VOICE[sp.el];
    return { heal: 'heal', cure: 'heal', revive: 'heal2', buff: 'buff', light: 'radiant', sleep: 'charm', command: 'charm', cloud: 'shadow', smite: 'radiant', auto: 'force', spiritweapon: 'holy2' }[sp.kind] || (/hold/.test(sp.id || '') ? 'charm' : 'magic');
  }

  // ------------------------------------------------------------------ the spell's own effects: a list beside the battle's dots
  function add(B, f) { f.t = 0; (B.fx8 = B.fx8 || []).push(f); return f; }
  var tick0 = BP.tick;
  BP.tick = function () { tick0.apply(this, arguments); this.fx8 = (this.fx8 || []).filter(function (f) { return ++f.t < f.dur; }); };
  function px(ctx, x, y, c, s) { s = s || 1; ctx.fillStyle = c; ctx.fillRect(Math.round(x - (s >> 1)), Math.round(y - (s >> 1)), s, s); }
  // a ring in whole pixels (the 8-bit art has no soft edge)
  function ring(ctx, cx, cy, rx, ry, c) { var n = Math.max(12, Math.round((rx + ry) * 3)); ctx.fillStyle = c; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; ctx.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1); } }
  // a disc in whole pixel rows, as the 8-bit art is (no soft edge); a ragged rim when `rag`
  function disc(ctx, cx, cy, rx, ry, c, rag) {
    ctx.fillStyle = c;
    for (var y = -Math.floor(ry); y <= ry; y++) { var w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))) + (rag ? ((y * 7 + DS.frame) % 3) - 1 : 0); if (w > 0) ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1); }
  }
  function hands(B, u) { var p = B.posOf(u); return isHero(u) ? { x: p.x - 6, y: p.y + 4 } : { x: p.x + 6, y: p.y }; }
  function isHero(u) { return !!u.h; }

  // the cast: motes drawn in to the hands, a glint that swells
  function flare(B, u, el) {
    var cols = ELEM[el] || ELEM.arcane, ms = []; for (var i = 0; i < 12; i++) ms.push({ a: Math.random() * 6.28, r: 10 + Math.random() * 8, d: Math.random() * 6 });
    add(B, { dur: 26, draw: function (ctx, t) {
      var h = hands(B, u);
      ms.forEach(function (m, i) { var q = (t - m.d) / 16; if (q <= 0 || q >= 1) return; var r = m.r * (1 - q), a = m.a + q * 2; px(ctx, h.x + Math.cos(a) * r, h.y + Math.sin(a) * r * 0.7, cols[i % 3]); });
      var g = Math.min(1, t / 14) * (t > 20 ? (26 - t) / 6 : 1), L = Math.round(1 + g * 4);
      for (var j = 1; j <= L; j++) { var c = j < 2 ? cols[1] : cols[0]; px(ctx, h.x + j, h.y, c); px(ctx, h.x - j, h.y, c); px(ctx, h.x, h.y + j, c); px(ctx, h.x, h.y - j, c); }
      px(ctx, h.x, h.y, cols[1], 2);
    } });
  }
  var cast0 = BP.castSpell;
  BP.castSpell = function* (u, sp, st) {
    var prev = this.spellNow, sfx0 = sp.sfx;
    this.spellNow = sp; this.spellShown = false; this.spellRay = 0;
    if (!sp.sfx) sp.sfx = voiceOf(sp);
    flare(this, u, elOf(sp));
    try { return yield* cast0.apply(this, arguments); }
    finally { this.spellNow = prev; if (sfx0 === undefined) delete sp.sfx; else sp.sfx = sfx0; }
  };

  // the travel: a spell's bolt is its own shot, quick (the battle waits ten frames on it)
  var bolt0 = BP.bolt;
  BP.bolt = function (from, to, col) {
    var sp = this.spellNow, B = this;
    if (!sp) return bolt0.apply(this, arguments);
    var el = elOf(sp), cols = ELEM[el] || ELEM.arcane, id = sp.id || '', a0 = B.posOf(from), b0 = B.posOf(to);
    var kind = id === 'magicmissile' ? 'dart' : id === 'scorchingray' || id === 'rayoffrost' || id === 'eldritchblast' ? 'ray' : el === 'cold' ? 'shard' : el === 'lightning' ? 'jag' : 'ball';
    var n = kind === 'dart' ? (B.fx8 || []).filter(function (f) { return f.dart && f.born === DS.frame; }).length : 0, delay = n * 2, side = (n % 2 ? -1 : 1) * (6 + n * 4);
    if (kind === 'ray') { B.spellRay = (B.spellRay || 0) + 1; delay = 0; }
    add(B, { dur: 12 + delay, dart: kind === 'dart', born: DS.frame, draw: function (ctx, t) {
      var k = (t - delay) / 10; if (k < 0) return; if (k > 1) k = 1;
      var a = hands(B, from), dx = b0.x - a.x, dy = b0.y - a.y, sn = Math.sin(k * Math.PI);
      var at = function (q) { var s2 = Math.sin(q * Math.PI); return { x: a.x + dx * q - dy / (Math.hypot(dx, dy) || 1) * side * s2, y: a.y + dy * q + (kind === 'dart' ? dx / (Math.hypot(dx, dy) || 1) * side * s2 * 0.5 : 0) - (kind === 'ball' ? 6 * s2 : 0) }; };
      if (kind === 'ray') { // a held line, a beat
        var fade = t > 8 ? (12 - t) / 4 : 1; ctx.globalAlpha = Math.max(0, fade);
        for (var i = 0; i <= 20; i++) { var q = i / 20; px(ctx, a.x + dx * q, a.y + dy * q + Math.sin(q * 12 + t) * (el === 'force' ? 1 : 0.4), i % 3 ? cols[0] : cols[1], 2); }
        ctx.globalAlpha = 1; return;
      }
      if (kind === 'jag') { var x0 = a.x, y0 = a.y; for (var s = 1; s <= 8; s++) { var q2 = s / 8 * k, x1 = a.x + dx * q2 + (s < 8 ? (Math.random() - 0.5) * 8 : 0), y1 = a.y + dy * q2 + (s < 8 ? (Math.random() - 0.5) * 8 : 0); for (var j = 0; j <= 4; j++) px(ctx, x0 + (x1 - x0) * j / 4, y0 + (y1 - y0) * j / 4, cols[1]); x0 = x1; y0 = y1; } return; }
      var h = at(k);
      for (var i2 = 1; i2 <= 5; i2++) { var q3 = at(Math.max(0, k - i2 * 0.07)); px(ctx, q3.x, q3.y - (el === 'fire' ? i2 * 0.4 : 0), i2 < 2 ? cols[1] : cols[i2 < 4 ? 0 : 2], i2 < 3 ? 2 : 1); }
      if (kind === 'shard') { px(ctx, h.x, h.y, cols[1], 2); px(ctx, h.x - Math.sign(dx), h.y - Math.sign(dy) * 0.5, cols[0], 2); }
      else if (kind === 'dart') { px(ctx, h.x, h.y, cols[1], 2); px(ctx, h.x - Math.sign(dx), h.y - 1, cols[0]); px(ctx, h.x - Math.sign(dx), h.y + 1, cols[0]); }
      else { px(ctx, h.x, h.y, cols[0], 4); px(ctx, h.x, h.y, cols[1], 2); }
    } });
  };

  // the arrival: an area spell's shape over the whole group, once; a single target's own mark
  var burst0 = BP.elemBurst;
  BP.elemBurst = function (u, el, style) {
    var sp = this.spellNow, B = this, r = burst0.apply(this, arguments);
    if (!sp || !u) return r;
    var id = sp.id || '', cols = ELEM[elOf(sp)] || ELEM.arcane;
    if (!B.spellShown && (sp.target === 'enemies' || sp.target === 'cone' || sp.target === 'line' || sp.kind === 'sleep')) {
      B.spellShown = true;
      var foes = B.liveFoes().concat(B.foes.filter(function (f) { return f.dead; })), cx = 0, cy = 0, n = 0;
      foes.forEach(function (f) { var p = B.posOf(f); cx += p.x; cy += p.y; n++; }); if (n) { cx /= n; cy /= n; } else { var p0 = B.posOf(u); cx = p0.x; cy = p0.y; }
      var caster = B.active || B.heroes[0];
      if (BIG[id] && (sp.target === 'enemies' || sp.target === 'cone' || sp.target === 'line')) DS.audio.sfx(BIG[id]);
      if (id === 'fireball') add(B, { dur: 30, draw: function (ctx, t) { var R = Math.min(44, t * 3.2), k = t / 30; for (var ring = 0; ring < 3; ring++) { var rr = R - ring * 7; if (rr <= 0) continue; ctx.globalAlpha = (1 - k) * (ring === 0 ? 0.6 : 0.85); disc(ctx, cx, cy, rr, rr * 0.6, cols[ring], ring === 0); } ctx.globalAlpha = 1; for (var e = 0; e < 10; e++) { var ea = e * 0.63 + t * 0.05, er = R * 0.8 + (e % 3) * 3; px(ctx, cx + Math.cos(ea) * er, cy + Math.sin(ea) * er * 0.6 - t * 0.4, cols[e % 3], 2); } if (t < 6) { B.flashT = Math.max(B.flashT, 4); B.shake = Math.max(B.shake, 8); } } });
      else if (id === 'lightningbolt') { var path = null; add(B, { dur: 20, draw: function (ctx, t) { // a bold jagged stroke through the line, re-forked every few frames, a branch off it
        var a = hands(B, caster), ex = 2, ey = cy;
        if (!path || t % 3 === 0) { path = [[a.x, a.y]]; for (var s = 1; s <= 14; s++) { var q = s / 14; path.push([a.x + (ex - a.x) * q, a.y + (ey - a.y) * q + (s < 14 ? (Math.random() - 0.5) * 14 : 0)]); } var bi = 3 + Math.floor(Math.random() * 8); path.branch = [path[bi], [path[bi][0] - 10, path[bi][1] + (Math.random() < 0.5 ? -10 : 10)]]; }
        var seg = function (p0, p1, c, w) { var L = Math.max(1, Math.round(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]))); for (var j = 0; j <= L; j++) px(ctx, p0[0] + (p1[0] - p0[0]) * j / L, p0[1] + (p1[1] - p0[1]) * j / L, c, w); };
        ctx.globalAlpha = t > 14 ? (20 - t) / 6 : 1;
        for (var i = 0; i < path.length - 1; i++) seg(path[i], path[i + 1], cols[2], 3);
        for (var i2 = 0; i2 < path.length - 1; i2++) seg(path[i2], path[i2 + 1], t & 2 ? cols[0] : cols[1], 1);
        seg(path.branch[0], path.branch[1], cols[0], 1);
        ctx.globalAlpha = 1; if (t < 4) B.flashT = Math.max(B.flashT, 3);
      } }); }
      else if (sp.target === 'cone') add(B, { dur: 22, draw: function (ctx, t) { // a fan from the hands over them
        var a = hands(B, caster);
        for (var i = 0; i < 26; i++) { var q = ((t / 16) + i / 26) % 1, ang = Math.atan2(cy - a.y, cx - a.x) + (((i * 37) % 13) / 13 - 0.5) * 0.9, dist = q * Math.hypot(cx - a.x, cy - a.y) * 1.2; ctx.globalAlpha = 1 - t / 22; px(ctx, a.x + Math.cos(ang) * dist, a.y + Math.sin(ang) * dist, cols[i % 3], id === 'thunderwave' || id === 'shatter' ? 1 : 2); }
        if (id === 'thunderwave' || id === 'shatter') { ctx.strokeStyle = cols[2]; ctx.globalAlpha = 1 - t / 22; ring(ctx, id === 'shatter' ? cx : a.x, id === 'shatter' ? cy : a.y, 4 + t * 3, (4 + t * 3) * 0.6, ctx.strokeStyle); }
        ctx.globalAlpha = 1;
      } });
      else if (id === 'icestorm') add(B, { dur: 30, draw: function (ctx, t) { for (var i = 0; i < 30; i++) { var hx = cx - 40 + ((i * 29) % 80), hy = 20 + ((t * 5 + i * 17) % (cy + 10 - 20)); px(ctx, hx, hy, i % 2 ? cols[1] : cols[2], 2); } } });
      else if (sp.kind === 'sleep') add(B, { dur: 36, draw: function (ctx, t) { for (var i = 0; i < 18; i++) { var sx = cx - 40 + ((i * 23) % 80), sy = cy - 30 + ((t * 1.2 + i * 7) % 40); ctx.globalAlpha = 0.9; px(ctx, sx + Math.sin(t / 5 + i) * 2, sy, i % 2 ? '#F8A4C0' : '#B8B8F8'); } ctx.globalAlpha = 1; } });
    }
    if (sp.target === 'enemy' && style !== 'rise') { // one creature: its own mark
      var p = B.posOf(u);
      if (id === 'sacredflame') add(B, { dur: 20, draw: function (ctx, t) { var k = Math.sin(Math.PI * t / 20); ctx.globalAlpha = 0.8 * k; ctx.fillStyle = '#F8D878'; ctx.fillRect(Math.round(p.x - 4), 20, 8, Math.round(p.y - 20 + 6)); ctx.fillStyle = '#F8F8F8'; ctx.fillRect(Math.round(p.x - 1), 20, 2, Math.round(p.y - 20 + 6)); ctx.globalAlpha = 1; } });
      else if (/hold/.test(id)) add(B, { dur: 24, draw: function (ctx, t) { ctx.strokeStyle = '#D8B8F8'; ctx.globalAlpha = 1 - t / 24; for (var i = 0; i < 3; i++) { ring(ctx, p.x, p.y - 6 + i * 6, 14 - t * 0.3, 4, ctx.strokeStyle); } ctx.globalAlpha = 1; } });
      else if (sp.kind === 'command') add(B, { dur: 26, draw: function (ctx, t) { if ((t >> 2) & 1) DS.textCenter(ctx, '!', p.x, p.y - 18 - t * 0.3, '#F8A4C0'); } });
    }
    if (style === 'rise' && sp.kind === 'buff') { var pb = B.posOf(u); add(B, { dur: 22, draw: function (ctx, t) { ctx.strokeStyle = cols[1]; ctx.globalAlpha = 1 - t / 22; ring(ctx, pb.x, pb.y - 2 - t * 0.6, 9, 3, ctx.strokeStyle); ctx.globalAlpha = 1; } }); }
    return r;
  };

  // the spiritual weapon: it hangs by its cleric, and flies to strike
  var strike0 = BP.spiritStrike;
  BP.spiritStrike = function* (u) {
    var sw = u.conds.spiritWeapon, foes = this.liveFoes(), t = foes.slice().sort(function (a, b) { return a.hp - b.hp; })[0];
    if (sw && t) { sw.flyT = DS.frame; sw.flyTo = t; }
    var prev = this.spellNow; this.spellNow = null; // (its bolt is the weapon itself, drawn below)
    var boltWas = this.bolt; this.bolt = function () {};
    try { yield* strike0.apply(this, arguments); } finally { this.bolt = boltWas; this.spellNow = prev; }
  };
  var MACE8 = ['..o.o.o..', '.ohhhhho.', 'ohhmhmhho', 'ohmhhhmho', 'ohhmhmhho', '.ohhhhho.', '..o.o.o..', '...omo...', '...ohm...', '...ohm...', '...ohm...',
    '...ohm...', '...ohm...', '..oohmo..', '...ooo...'];
  function drawMace(ctx, x, y, ang, alpha) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(ang); ctx.globalAlpha = alpha;
    var col = { o: '#A07818', h: '#F8F8F8', m: '#F8D878' };
    MACE8.forEach(function (row, yy) { for (var xx = 0; xx < row.length; xx++) { var c = col[row[xx]]; if (c) { ctx.fillStyle = c; ctx.fillRect(xx - 4, yy - 13, 1, 1); } } });
    ctx.restore(); ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------ what lasts, and the spell's own effects, over the battle
  var draw0 = BP.draw;
  BP.draw = function (ctx) {
    draw0.apply(this, arguments);
    var B = this, f8 = DS.frame;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 20, 256, 132); ctx.clip();
    // the cloud as puffs, drifting
    if (B.cloud) {
      var ck = B.cloud.kind, cc = ck === 'fog' ? ['#c8ccd8', '#e8ecf0'] : ck === 'stink' ? ['#a8c040', '#d8d060'] : ['#a8d8f8', '#F8F8F8'], x0 = ck === 'fog' ? 128 : 0;
      for (var i = 0; i < 14; i++) { var px0 = x0 + ((i * 37 + f8 * 0.3) % 128), py0 = 40 + ((i * 53) % 90) + Math.sin(f8 / 20 + i) * 3; ctx.globalAlpha = 0.25; ctx.fillStyle = cc[i % 2]; disc(ctx, px0, py0, 12, 6, ctx.fillStyle); }
      if (ck === 'sleet') for (var s = 0; s < 20; s++) { ctx.globalAlpha = 0.8; px(ctx, (s * 13 + f8 * 0.8) % 128, 20 + ((s * 29 + f8 * 3) % 132), '#F8F8F8'); }
      ctx.globalAlpha = 1;
    }
    // the foes: the webbed, the held, the sleeping, the commanded
    B.foes.forEach(function (f) {
      if (f.dead) return;
      var x = f.x + (f.off || 0), y = f.y, w = f.art.w, h = f.art.h;
      if (f.conds.restrained) { ctx.strokeStyle = '#E8E8F0'; ctx.globalAlpha = 0.8; ctx.beginPath(); var mx = x + w / 2, my = y + h / 2; for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3; ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(a) * w * 0.55, my + Math.sin(a) * h * 0.55); } for (var rr = 1; rr <= 2; rr++) { ctx.moveTo(mx + w * 0.25 * rr, my); for (var k2 = 1; k2 <= 6; k2++) { var a2 = k2 * Math.PI / 3; ctx.lineTo(mx + Math.cos(a2) * w * 0.25 * rr, my + Math.sin(a2) * h * 0.25 * rr); } } ctx.stroke(); ctx.globalAlpha = 1; }
      if (f.conds.paralyzed) { ctx.strokeStyle = '#D8B8F8'; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(f8 / 6); for (var j = 0; j < 2; j++) { ring(ctx, x + w / 2, y + h * (0.4 + j * 0.35), w * 0.55, 3, ctx.strokeStyle); } ctx.globalAlpha = 1; }
      if (f.conds.asleep) for (var z = 0; z < 2; z++) { var zt = (f8 * 0.5 + z * 20) % 40; ctx.globalAlpha = 1 - zt / 40; DS.text(ctx, 'z', x + w - 4 + zt * 0.2, y - 2 - zt * 0.5, '#B8B8F8'); ctx.globalAlpha = 1; }
      if (f.conds.commanded && ((f8 >> 4) & 1)) DS.textCenter(ctx, '!', x + w / 2, y - 10, '#F8A4C0');
    });
    // the party: a halo on the blessed, a ring on the shielded, a double of the misled, the spiritual weapon by its cleric
    B.heroes.forEach(function (u) {
      if (!u.h || u.h.ko || u.h.hp <= 0) return;
      var x = u.x, y = u.y;
      if (u.buff && u.buff.id === 'bless') { ctx.strokeStyle = '#F8D878'; ctx.globalAlpha = 0.7 + 0.3 * Math.sin(f8 / 8); ring(ctx, x + 8, y - 3, 5, 1.5, ctx.strokeStyle); ctx.globalAlpha = 1; }
      if (u.buff && u.buff.id === 'shieldOfFaith' || u.conds.shielded) { ctx.strokeStyle = u.conds.shielded ? '#A4E4FC' : '#F8D878'; ctx.globalAlpha = 0.35 + 0.2 * Math.sin(f8 / 5); ring(ctx, x + 8, y + 12, 11, 14, ctx.strokeStyle); ctx.globalAlpha = 1; }
      if (u.conds.sanctuary) { ctx.strokeStyle = '#F8F8F8'; ctx.globalAlpha = 0.4; ring(ctx, x + 8, y + 24, 10, 3, ctx.strokeStyle); ctx.globalAlpha = 1; }
      if (u.conds.invisible && u.conds.invisible.ends === true && B.spellNow == null && u._mislead) { }
      var sw = u.conds.spiritWeapon;
      if (sw && sw.rounds > 0) {
        var hx = x - 10, hy = y + 2 + Math.sin(f8 / 10) * 2, ang = Math.sin(f8 / 18) * 0.2, ft = sw.flyT != null ? f8 - sw.flyT : 99;
        if (ft < 24 && sw.flyTo && !sw.flyTo.dead) { var tp = B.posOf(sw.flyTo), k3 = ft < 12 ? ft / 12 : 1 - (ft - 12) / 12; hx += (tp.x + 10 - hx) * k3; hy += (tp.y - hy) * k3; ang = ft > 8 && ft < 14 ? -1.6 + (ft - 8) * 0.5 : ang; }
        ctx.globalAlpha = 0.2; disc(ctx, hx, hy - 4, 10, 9, '#F8D878'); ctx.globalAlpha = 0.35; disc(ctx, hx, hy - 6, 6, 5, '#F8F8F8'); ctx.globalAlpha = 1;
        drawMace(ctx, hx, hy + 4, ang, 1);
        if (((f8 >> 2) + u.idx) % 9 === 0) px(ctx, hx + 3, hy - 9, '#F8F8F8', 2); // (a glint)
      }
    });
    // the spells' own effects on top
    (B.fx8 || []).forEach(function (f) { try { f.draw(ctx, f.t); } catch (e) { f.dur = 0; } });
    ctx.restore();
  };
})();
