/* DEEP16 — torchdark (09-28; Griz: "The players will need to be able to still see in the dark, even if the characters
   can't. I think shooting blind is just handled with a -4."). Light with a place: every light is a thing on the grid, a
   radius of bright light and a ring of dim past it, from a square (a torch dropped or thrown, a lamp or a fire the map
   keeps, a Daylight set at a point, Dancing Lights) or from a creature (a torch in hand, the Light cantrip on him, a
   burning blade, the Sunshaft staff, Sacred Weapon's glow, a Continual Flame). On dark ground (the map's `dark`, the
   fight's, or the 8-bit map's when the fight is fought from there) the characters see by those lights and by their own
   darkvision; the player sees the whole grid, greyed and dimmed where no one of the party can. A creature in the dark to
   its attacker is unseen: an attack at it has disadvantage (the SRD 5.1; his first "-4" was AD&D's and stays as a switch,
   js/rules.js R.BLIND), an attack from it has advantage, and a spell that wants "a creature you can see" cannot take it.
   The AI reads the same rule
   (ai.js heroes, visibleFrom). The look is the campfire's light pass laid over the fight's world canvas (ui.js). */
'use strict';
(function () {
  var D = window.D16, G = D.grid;
  var L = D.light = {};
  // shooting blind (an attack at a creature the attacker cannot see for want of light): the SRD's disadvantage, or a flat penalty --
  // one switch in js/rules.js R.BLIND (AMENDED 09-28: the -4 was AD&D's number; the game's law is the SRD 5.1)
  L.BLIND = (window.DS && window.DS.R && window.DS.R.BLIND != null) ? window.DS.R.BLIND : 'disadvantage';
  L.TORCH = { bright: 20, dim: 20 };   // SRD 5.1 torch: bright 20 ft, dim 20 more, an hour (no fight runs that long)
  L.LIGHT_COST = 'A';                  // lighting a torch: an action (SRD 5.1 tinderbox: "takes an action"); the Thief's Fast Hands make it a bonus. RULED 09-28h (Griz: "yes to action cost"); 'B' would make it a bonus action for all
  // who sees in the dark by blood (SRD 5.1), keyed on the 8-bit sheets' `race`
  L.RACE_DV = { 'Half-orc': 60, 'Dwarf': 60, 'Elf': 60, 'Gnome': 60, 'Tiefling': 60, 'Drow': 120, 'Human': 0, 'Halfling': 0 };
  L.raceDV = function (race) { return L.RACE_DV[race] || 0; };
  var COL = { gold: '255,214,150', fire: '255,168,88', glow: '176,216,255', bone: '244,238,222', violet: '196,156,255', moss: '160,224,160', red: '255,120,90' };

  // ---------------------------------------------------------------- the lights on the field now
  // placed (B.lights): { x, y, bright, dim, color, flame, kind, by, id }; carried: read off each unit every time it's asked
  function itemLight(id) { var it = id && window.DS && window.DS.DATA && window.DS.DATA.items[id]; return it && it.light ? it.light : null; }
  L.carried = function (u) {
    var out = [];
    if (!u || u.dead || u.ethereal || u.left) return out;
    var cx = u.x + ((u.size || 1) - 1) / 2, cy = u.y + ((u.size || 1) - 1) / 2;
    var add = function (b, d, color, flame, kind) { out.push({ x: cx, y: cy, bright: b, dim: d, color: color, flame: !!flame, kind: kind, unit: u }); };
    if (u.torch && u.torch.lit) add(L.TORCH.bright, L.TORCH.dim, 'gold', true, 'torch');
    if (u.conds.light) add(20, 20, 'glow', false, 'light');                       // the Light cantrip, on him or his gear
    if (u.conds.daylight) add(60, 60, 'bone', false, 'daylight');                 // Daylight cast on a point he stood on: it goes with him
    if (u.conds.sacred && u.hp > 0) add(20, 20, 'gold', false, 'sacred');         // Sacred Weapon's glow (SRD: bright 20 ft)
    // a Continual Flame rides the weapon it was set on (the 8-bit keeps the weapon's id): it shines while that weapon is in hand
    var cf = u.conds.continualFlame || (u.src && u.src.conds && u.src.conds.continualFlame);
    if (cf && (typeof cf !== 'string' || (u.weapon && u.weapon.id === cf))) add(20, 20, 'fire', false, 'flame'); // torch-bright, no heat
    var wl = u.weapon && itemLight(u.weapon.id);
    if (wl && (wl.when === 'always' || (wl.when === 'lit' && u.conds.ablaze))) add(wl.bright, wl.dim, wl.when === 'lit' ? 'fire' : 'bone', wl.when === 'lit', 'weapon');
    return out;
  };
  L.all = function (B) {
    var out = (B.lights || []).slice();
    (B.units || []).forEach(function (u) { L.carried(u).forEach(function (l) { out.push(l); }); });
    return out;
  };

  // ---------------------------------------------------------------- how light lies on every square: 0 dark, 1 dim, 2 bright
  // (a lit place has no map: everything is bright). Recomputed only when a light moves or changes; a wall stops light
  function sig(B) {
    var ls = L.all(B), k = (B.map ? B.map.def.name : '') + '|';
    ls.forEach(function (l) { k += Math.round(l.x * 2) + ',' + Math.round(l.y * 2) + ',' + l.bright + ',' + l.dim + ';'; });
    (B.darks || []).forEach(function (d) { if (d.kind !== 'fog' && d.kind !== 'sleet' && d.kind !== 'stink') k += 'D' + d.sq.length + (d.follow || '') + ';'; });
    return { k: k, ls: ls };
  }
  L.map = function (B) {
    if (!B || !B.map || !B.dark) return null;
    var kk = sig(B);
    if (B.lightMap && B.lightMap.k === kk.k) return B.lightMap;
    var m = B.map, lv = new Array(m.w * m.h), M = D.magic;
    for (var i = 0; i < lv.length; i++) lv[i] = 0;
    kk.ls.forEach(function (l) {
      var lx = Math.round(l.x), ly = Math.round(l.y), R = Math.ceil((l.bright + l.dim) / 5);
      for (var y = ly - R; y <= ly + R; y++) for (var x = lx - R; x <= lx + R; x++) {
        var s = m.at(x, y); if (!s || !s.open) continue;
        var d = Math.hypot(x - l.x, y - l.y) * 5, v = d <= l.bright + 0.01 ? 2 : d <= l.bright + l.dim + 0.01 ? 1 : 0;
        if (!v) continue;
        var i2 = y * m.w + x;
        if (lv[i2] >= v) continue;
        if (!(x === lx && y === ly) && !G.losPoint(lx, ly, x, y)) continue;
        lv[i2] = v;
      }
    });
    // magical darkness: no light lies in it, a torch's or a lamp's (SRD: "nonmagical light can't illuminate it")
    if (M && (B.darks || []).length) for (var y2 = 0; y2 < m.h; y2++) for (var x2 = 0; x2 < m.w; x2++) if (lv[y2 * m.w + x2] && M.darkKindAt(B, x2, y2) === 'darkness') lv[y2 * m.w + x2] = 0;
    B.lightMap = { k: kk.k, lv: lv, w: m.w, lights: kk.ls };
    return B.lightMap;
  };
  L.levelAt = function (B, x, y) {
    if (!B || !B.dark) return 2;
    var lm = L.map(B); if (!lm) return 2;
    var s = B.map.at(x, y); if (!s || !s.open) return 0;
    return lm.lv[y * lm.w + x] || 0;
  };
  L.levelOf = function (B, u) { var best = 0; G.foot(u).forEach(function (p) { best = Math.max(best, L.levelAt(B, p[0], p[1])); }); return best; };
  L.brightAt = function (B, u) { return L.levelOf(B, u) === 2; };
  // bright light the party made reaching a creature (a torch, the Light cantrip, Daylight, a burning blade): what hates light is
  // dazzled by that, never by its own campfire or the place's lamp (a map light is the creature's own ground)
  L.litByParty = function (B, u) {
    var cx = u.x + ((u.size || 1) - 1) / 2, cy = u.y + ((u.size || 1) - 1) / 2;
    return L.all(B).some(function (l) { return l.kind !== 'map' && l.bright > 0 && Math.hypot(l.x - cx, l.y - cy) * 5 <= l.bright + 2.5 && G.losPoint(Math.round(l.x), Math.round(l.y), Math.round(cx), Math.round(cy)); });
  };
  // a bright light within `ft` of a creature (the drow's cue to throw their Darkness: at once, to swallow a Light)
  L.brightNear = function (B, u, ft) {
    if (!B || !B.dark) return false;
    return L.all(B).some(function (l) { return l.bright > 0 && Math.max(Math.abs(l.x - u.x), Math.abs(l.y - u.y)) * 5 <= ft; });
  };
  L.name = function (lv) { return lv === 2 ? 'bright light' : lv === 1 ? 'dim light' : 'dark'; };

  // ---------------------------------------------------------------- sight by light (natural light only: magic.js seeWhy asks about magical darkness,
  // fog, invisibility and blindness first). `a` may be a probe { x, y, size, darkvision, blindsight, truesight } (the AI asking
  // "from that square"). Dim light is light enough to see by (SRD: lightly obscured); in the dark only darkvision serves,
  // and only to its reach (what it shows is dim and grey: it is still seen)
  L.seesBy = function (B, a, b) {
    if (!B || !B.dark) return { ok: true };
    if (a.truesight && G.dist(a, b) <= a.truesight) return { ok: true };
    if (a.blindsight && G.dist(a, b) <= a.blindsight) return { ok: true };
    if (a.blind) return { ok: false, why: 'blind' }; // (a grimlock past its blindsight: eyeless)
    if (L.levelOf(B, b) >= 1) return { ok: true };
    var dv = a.darkvision || 0;
    if (dv && G.dist(a, b) <= dv) return { ok: true, dv: true };
    return { ok: false, why: 'dark' };
  };

  // what the party can see, square by square: 2 by light, 1 by darkvision only (grey), 0 not at all (the player still sees)
  L.partyMap = function (B) {
    if (!B || !B.dark) return null;
    var lm = L.map(B), m = B.map;
    var eyes = B.units.filter(function (u) { return u.side === 'party' && G.standing(u) && !u.left && (u.darkvision || u.blindsight || u.truesight); });
    var k = lm.k + '|' + eyes.map(function (u) { return u.id + u.x + ',' + u.y + (u.darkvision || 0) + (u.blindsight || 0) + (u.truesight || 0); }).join(';');
    if (B.partyMap && B.partyMap.k === k) return B.partyMap;
    var out = new Array(m.w * m.h);
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
      var i = y * m.w + x, s = m.sq[i];
      if (!s.open) { out[i] = 0; continue; }
      var v = lm.lv[i] ? 2 : 0;
      if (!v) for (var e = 0; e < eyes.length; e++) {
        var u = eyes[e], r = Math.max(u.darkvision || 0, u.blindsight || 0, u.truesight || 0);
        if (G.dist(u, { x: x, y: y, size: 1 }) <= r && G.losPoint(u.x, u.y, x, y)) { v = 1; break; }
      }
      out[i] = v;
    }
    B.partyMap = { k: k, v: out, w: m.w };
    return B.partyMap;
  };
  L.partySeesSq = function (B, x, y) { var pm = L.partyMap(B); return pm ? (pm.v[y * pm.w + x] || 0) : 2; };
  L.partySees = function (B, u) { var best = 0; G.foot(u).forEach(function (p) { best = Math.max(best, L.partySeesSq(B, p[0], p[1])); }); return best; };

  // ---------------------------------------------------------------- hands (Griz, 09-28: "Aurdin would pretty much have to carry it lest lyman drop
  // shield"): a two-handed weapon takes both hands, a shield one, a torch one; fists none. A versatile weapon is one hand
  // while a torch is held (and hits for its one-handed die: js/rules.js R.twoHanded reads equip.torch)
  L.handsUsed = function (u) {
    var w = u.weapon, props = (w && w.props) || [], two = props.indexOf('two-handed') >= 0, sh = !!(u.src && u.src.equip && u.src.equip.shield);
    return { weapon: w && w.id && w.id !== 'unarmed' ? (two ? 2 : 1) : 0, shield: sh ? 1 : 0, torch: u.torch ? 1 : 0, two: two, sh: sh };
  };
  L.handsFree = function (u) { var h = L.handsUsed(u); return Math.max(0, 2 - h.weapon - h.shield - h.torch); };
  L.handsWhy = function (u) {
    var h = L.handsUsed(u), bits = [];
    if (h.two) bits.push('both hands on the ' + u.weapon.name.toLowerCase()); else if (h.weapon) bits.push('the ' + u.weapon.name.toLowerCase());
    if (h.sh) bits.push('the shield');
    if (h.torch) bits.push('a torch already');
    return 'no free hand: ' + (bits.join(' and ') || 'both hands full');
  };
  // the weapon in hand again (a torch taken up or set down changes a versatile weapon's grip)
  L.regrip = function (u) {
    if (!u.src || !u.src.equip || u.guest) return;
    if (u.torch) u.src.equip.torch = 1; else delete u.src.equip.torch;
    u.weapon = D.save.weaponOf(u.src); u.attacks = u.weapon.loading ? 1 : u.attacksBase;
  };

  // ---------------------------------------------------------------- torches: in the pack (B.inv), in a hand (u.torch), on the floor (B.lights, kind 'torch')
  function packOf(B, id) { return (B.inv || []).filter(function (x) { return x.id === id; })[0]; }
  L.torchesInPack = function (B) { var s = packOf(B, 'torch'); return s ? s.n : 0; };
  L.torchAt = function (B, x, y) { return (B.lights || []).filter(function (l) { return l.kind === 'torch' && l.x === x && l.y === y; })[0] || null; };
  L.canLight = function (B, u) {
    if (u.torch) return { ok: false, why: 'a torch in hand already' };
    if (!L.torchesInPack(B)) return { ok: false, why: 'no torch in the pack' };
    if (B.fight && B.fight.roost) return { ok: false, why: 'the roost overhead: no fire' };
    if (!L.handsFree(u)) return { ok: false, why: L.handsWhy(u) };
    return { ok: true, why: '' };
  };
  // light one: a torch out of the pack, in the free hand; the light-shy recoil from it (magic.js brighten)
  L.lightTorch = function* (B, u) {
    var s = packOf(B, 'torch'), M = D.magic;
    if (!s || s.n <= 0) return;
    s.n--; u.torch = { lit: true }; L.regrip(u);
    D.sfx('fire'); D.fx.sparkle(u, 'fire', 14);
    yield* M.brighten(B, u, 'torch', '{y}' + u.name + '{/} strikes a light: a torch, {o}bright 20 ft{/} and dim 20 more.' + (L.handsUsed(u).weapon === 1 && u.weapon.props.indexOf('versatile') >= 0 ? '  {g}(the ' + u.weapon.name.toLowerCase() + ' in one hand){/}' : ''), { x: u.x, y: u.y, bright: L.TORCH.bright });
  };
  function place(B, x, y, by) { var n = (B.torchSeq = (B.torchSeq || 0) + 1); B.lights = (B.lights || []).concat([{ id: 'torch' + n, kind: 'torch', x: x, y: y, bright: L.TORCH.bright, dim: L.TORCH.dim, color: 'gold', flame: true, by: by }]); }
  // set down where he stands (the turn's free hand on an object): it keeps burning there
  L.dropTorch = function (B, u, silent) {
    if (!u.torch) return;
    delete u.torch; L.regrip(u);
    place(B, u.x, u.y, u.id);
    if (!silent) B.card(['{y}' + u.name + '{/} drops the torch. It burns where it fell.']);
  };
  // thrown (an action): it lands on a square within 20 ft it can see and burns there -- the way to light up the far end
  L.throwTorch = function* (B, u, x, y) {
    if (!u.torch) return;
    u.turn.action = 0; u.facing = B.faceTo(u, { x: x, y: y, size: 1 }); u.anim = 'attack'; u.animT = B.t;
    D.fx.projectile(u, { x: x, y: y, size: 1 }, 'fire'); yield { fx: 1 };
    delete u.torch; L.regrip(u);
    place(B, x, y, u.id);
    D.sfx('fire');
    yield* D.magic.brighten(B, u, 'torch', '{y}' + u.name + '{/} throws the torch. It lands ' + (Math.max(Math.abs(x - u.x), Math.abs(y - u.y)) * 5) + ' ft off and burns there.', { x: x, y: y, bright: L.TORCH.bright });
    u.anim = 'idle';
  };
  // put it out (free): back in the pack, unspent
  L.douseTorch = function (B, u) {
    if (!u.torch) return;
    delete u.torch; L.regrip(u);
    var s = packOf(B, 'torch'); if (s) s.n++; else B.inv.push({ id: 'torch', n: 1 });
    B.card(['{y}' + u.name + '{/} puts the torch out and stows it.']);
  };
  // pick up the one burning at his feet (free, a free hand)
  L.pickUp = function (B, u) {
    var t = L.torchAt(B, u.x, u.y); if (!t || u.torch) return;
    B.lights = B.lights.filter(function (l) { return l !== t; });
    u.torch = { lit: true }; L.regrip(u);
    B.card(['{y}' + u.name + '{/} takes up the torch again.']);
  };
  // a fall (battle.js hurt): the torch goes down with him and burns on the floor
  L.fell = function (B, u) { if (u.torch) L.dropTorch(B, u, true); };
  // exposed flames doused in an area (Sleet Storm): torches in hand and on the floor
  L.douseIn = function (B, sq) {
    var out = [];
    (B.units || []).forEach(function (u) { if (u.torch && G.inArea(u, sq)) { delete u.torch; L.regrip(u); out.push(u.name + '\'s torch'); } });
    B.lights = (B.lights || []).filter(function (l) { var hit = l.kind === 'torch' && sq.some(function (q) { return q[0] === l.x && q[1] === l.y; }); if (hit) out.push('a torch on the floor'); return !hit; });
    return out;
  };

  // ---------------------------------------------------------------- the look: the campfire's pass (js/campfire.js) over the fight's world canvas,
  // called from ui.js drawBattle while iso.inWorld: a night ambient multiplied over everything, each light's pool added in
  // (a flame breathes), then the floor greyed where no one of the party sees (darkvision's reach: grey, no darker; past it:
  // grey and dim). The player sees the whole grid, the characters do not (RULED 09-28)
  var lit = null;
  function flick(t) { return Math.sin(t * 0.21) * 0.5 + Math.sin(t * 0.53 + 1.3) * 0.3 + Math.sin(t * 1.7) * 0.2; }
  L.pass = function (ctx, B, W, H) {
    if (!B || !B.dark || !B.map) return;
    var iso = D.iso, t = B.t, m = B.map;
    if (!lit) lit = document.createElement('canvas');
    if (lit.width !== W || lit.height !== H) { lit.width = W; lit.height = H; }
    var l = lit.getContext('2d');
    l.globalCompositeOperation = 'source-over';
    l.fillStyle = 'rgb(52,56,86)'; l.fillRect(0, 0, W, H);   // the night: blue-black, not black -- the player sees
    l.globalCompositeOperation = 'lighter';
    L.all(B).forEach(function (lg) {
      var gx = Math.round(lg.x), gy = Math.round(lg.y), c = iso.center(lg.x, lg.y, m.gz(gx, gy)), s = iso.toScreen(c.x, c.y);
      var f = lg.flame ? flick(t + gx * 7 + gy * 3) : 0, hw = iso.TW / 2;
      var rb = (lg.bright / 5) * hw * (1 + f * 0.05), rd = ((lg.bright + lg.dim) / 5) * hw * (1 + f * 0.03);
      if (rd <= 0) return;
      var col = COL[lg.color] || COL.gold;
      l.save(); l.translate(s.x, s.y - 4); l.scale(1, 0.5);
      var g = l.createRadialGradient(0, 0, 1, 0, 0, rd);
      g.addColorStop(0, 'rgba(' + col + ',' + (lg.bright ? 1 : 0.5) + ')');
      if (lg.bright) g.addColorStop(Math.min(0.97, rb / rd), 'rgba(' + col + ',0.7)');
      g.addColorStop(1, 'rgba(' + col + ',0)');
      l.fillStyle = g; l.fillRect(-rd, -rd, rd * 2, rd * 2);
      l.restore();
    });
    ctx.save();
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(lit, 0, 0);
    var pm = L.partyMap(B);
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#7c7c84';
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) { var s2 = m.sq[y * m.w + x]; if (!s2.open || pm.v[y * m.w + x] === 2) continue; iso.rhombus(ctx, x, y, s2.gz, 0); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(6,6,16,0.4)';
    for (var y2 = 0; y2 < m.h; y2++) for (var x2 = 0; x2 < m.w; x2++) { var s3 = m.sq[y2 * m.w + x2]; if (!s3.open || pm.v[y2 * m.w + x2]) continue; iso.rhombus(ctx, x2, y2, s3.gz, 0); ctx.fill(); }
    ctx.restore();
  };
  // the lights that stand on the floor, drawn in the sort: a dropped torch, Dancing Lights, a Daylight set at a point
  L.props = function (B) {
    return (B.lights || []).filter(function (l) { return l.kind === 'torch' || l.kind === 'dance' || l.kind === 'daylight'; }).map(function (l) {
      return { depth: l.x + l.y + 0.4, gz: B.map.gz(l.x, l.y), layer: 1, draw: function (ctx) {
        var c = D.iso.center(l.x, l.y, B.map.gz(l.x, l.y)), s = D.iso.toScreen(c.x, c.y), P = D.PAL.ramps;
        if (l.kind === 'torch') {
          ctx.fillStyle = P.leather[2]; ctx.fillRect(s.x - 5, s.y - 3, 10, 2); ctx.fillStyle = P.leather[3]; ctx.fillRect(s.x - 5, s.y - 4, 10, 1);
          if (D.campfire) D.campfire.flames(ctx, s.x + 5, s.y - 4, B.t + l.x * 9, 0.5);
        } else if (l.kind === 'dance') {
          var k = 2 + Math.sin(B.t / 8 + l.x * 2) * 0.6, yy = s.y - 20 + Math.sin(B.t / 11 + l.y * 3) * 2;
          ctx.globalAlpha = 0.35; ctx.fillStyle = P.glow[1]; ctx.beginPath(); ctx.ellipse(s.x, yy, k * 3, k * 3, 0, 0, 7); ctx.fill();
          ctx.globalAlpha = 0.95; ctx.fillStyle = P.glow[2]; ctx.beginPath(); ctx.ellipse(s.x, yy, k, k, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        } else if (l.kind === 'daylight') {
          ctx.globalAlpha = 0.8 + 0.2 * Math.sin(B.t / 9); ctx.fillStyle = P.bone[2]; ctx.beginPath(); ctx.ellipse(s.x, s.y - 16, 4, 4, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        }
      } };
    });
  };
})();
