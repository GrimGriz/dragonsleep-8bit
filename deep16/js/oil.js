/* DEEP16 — the Oil Flask by the SRD, and oil on the ground (10-05, Griz: "SRD, alt would be it does that when you have a free hand and a torch (our way) - 'oiled' might
   have to be a condition for both monsters and tiles?"; "story fight either way - SRD have 'missed flask throw oils tile'?").
   SRD 5.1, Oil: "As an action, you can splash the oil in this flask onto a creature within 5 feet of you or throw it up to 20 feet, shattering it on impact. Make a ranged
   attack against a target creature or object, treating the oil as an improvised weapon. On a hit, the target is covered in oil. If the target takes any fire damage before the
   oil dries (after 1 minute), the target takes an additional 5 fire damage from the burning oil. You can also pour a flask of oil on the ground to cover a 5-foot-square area,
   provided that the surface is level. If lit, the oil burns for 2 rounds and deals 5 fire damage to any creature that enters the area or ends its turn in the area. A creature
   can take this damage only once per turn."
   So: the throw is an improvised ranged attack -- the thrower's Strength modifier alone, as the torch's (light.js L.torchAtk) -- 20 ft and no farther; a hit coats the creature
   (conds.oiled, a minute: ten of its turns), and the next fire it takes burns 5 more (Battle.hurt, below). His alt, "our way": a thrower with a torch burning in one hand and
   the other free lights the flask as it goes, and a hit is 5 fire at once (the oil burns off on it). The seat's calls on his "either way" (the SRD says nothing of a miss),
   RULED 10-05 on his "yes and yes" (no scatter roll for a miss -- "in some version a miss like this gets a roll for where it went that can hit your friends. Probably not 5E
   2014"): a flask thrown at a square oils the square (the ground: no roll), and a missed one oils the square it was thrown at; oil on the ground (B.oils) lights from a torch set or
   thrown on it, from any fire that reaches it (wherever fire burns a web: magic.js M.burnWebs), or from a lit flask -- then burns as the SRD says. Not the 8-bit battle's:
   its flask is content/items.json's (5 fire, a DEX save). */
(function () {
  'use strict';
  var D = window.D16, G = D.grid, RU = D.rules, M = D.magic, FX = D.fx, BP = D.Battle.prototype;
  var OIL = D.oil = { BURN: 5, ROUNDS: 2, DRY: 10, RANGE: 20 }; // (5 fire; a lit square burns 2 rounds; a coat dries in a minute -- ten turns; 20 ft)
  function nm(w) { return D.Battle.nm ? D.Battle.nm(w) : w.name; }
  function key(B) { return B.round + ':' + (B.active ? B.active.id : '-'); } // (a turn: the round and whose)
  OIL.at = function (B, x, y) { return (B.oils || []).filter(function (o) { return o.x === x && o.y === y; })[0] || null; };
  // the lit throw: a torch burning in one hand (not a lantern: its flame is shut in) and the other free for the flask
  OIL.lit = function (u) { var L = D.light; return !!(u.torch && L.kindOf(u.torch) !== 'lantern' && L.handsFree(u) >= 1); };
  // the throw as an attack: improvised, Strength alone, 20 ft; the lit one 5 fire on a hit (flat, as the torch's 1: a critical doubles no dice), the plain one no damage (battle.js attack's noDamage)
  OIL.atk = function (u, lit) { return { name: lit ? 'Oil Flask, lit' : 'Oil Flask', atk: D.mod(((u.abil || {}).str) || 10), dice: lit ? String(OIL.BURN) : '0', mod: 0, type: 'fire', range: [OIL.RANGE, OIL.RANGE], ranged: true, improvised: true, fx: 'fire', noDamage: !lit }; };
  // a square the flask may be thrown at: open ground within 20 ft, in a clear line, not the thrower's own (to pour it there, a square beside)
  OIL.squareOK = function (B, u, x, y) {
    var s = G.map.at(x, y); if (!s || !s.open || !s.walk || s.deep) return false;
    if (G.occupant(x, y)) return false;
    return G.dist(u, { x: x, y: y, size: 1 }) <= OIL.RANGE && G.losPoint(u.x, u.y, x, y);
  };
  // a creature covered in oil: a minute (its own turns' ends -- grimoire.js's till), the next fire on it 5 more
  OIL.coat = function (B, w) {
    if (!w || w.dead || w.object) return;
    w.conds.oiled = { till: { who: w.id, at: 'end', n: OIL.DRY }, endText: 'The oil on {who} has dried.' };
    FX.sparkle(w, 'leather', 10);
    B.card(['  {o}' + nm(w) + ' is covered in oil{/}: the next fire on it burns 5 more  {g}(a minute){/}'], 260);
  };
  // oil on a square (a miss, a throw at the ground): a pool there, lit at once by a lit flask or a flame already on it
  OIL.spill = function (B, x, y, lit, by, missed) {
    var s = G.map.at(x, y); if (!s || !s.open) return null;
    var o = OIL.at(B, x, y);
    if (!o) { o = { x: x, y: y, lit: null, by: by && by.id }; B.oils = (B.oils || []).concat([o]); }
    B.card(['  ' + (missed ? 'The flask shatters on the ground there' : 'The oil spreads over the square') + (o.lit != null ? ' -- into the fire already burning.' : '.')], 220);
    if (o.lit == null && (lit || flameOn(B, x, y))) OIL.light(B, o);
    return o;
  };
  function flameOn(B, x, y) { return (B.lights || []).some(function (l) { return l.flame && l.kind !== 'lantern' && Math.round(l.x) === x && Math.round(l.y) === y; }); }
  OIL.light = function (B, o) {
    if (o.lit != null) return;
    o.lit = B.round; o.litBy = B.active ? B.active.id : null;
    D.sfx('fire'); FX.sparkle({ x: o.x, y: o.y, size: 1 }, 'fire', 18);
    B.card(['{o}The oil on the ground catches{/}: it burns for 2 rounds -- 5 fire to whoever enters it or ends a turn in it.'], 300);
  };
  OIL.lightIn = function (B, sq) { (B.oils || []).forEach(function (o) { if (o.lit == null && (sq || []).some(function (q) { return q[0] === o.x && q[1] === o.y; })) OIL.light(B, o); }); };
  // the burning square's 5 fire: once a turn for any one creature, whatever square of it
  function burn(B, o, w, how) {
    if (!w || w.dead || w.object || !G.standing(w) || w.under || (w.hang && G.hanging(w))) return; // (one hanging over it on a rope, or under the ground, is not in it)
    if (w.oilBurnt === key(B)) return; w.oilBurnt = key(B);
    FX.sparkle(w, 'fire', 12);
    B.card([nm(w) + ' ' + how + ': {r}' + OIL.BURN + '{/} fire'], 240);
    B.hurt(w, OIL.BURN, 'fire');
  }
  function litOn(B, w) { return (B.oils || []).filter(function (o) { return o.lit != null && G.inArea(w, [[o.x, o.y]]); }); }
  // the squares that burn out: at the start of the turn of the one who lit it, two rounds on (or, that one gone, the round after that)
  function gutter(B, u) {
    var out = (B.oils || []).filter(function (o) { return o.lit != null && ((u.id === o.litBy && B.round >= o.lit + OIL.ROUNDS) || B.round >= o.lit + OIL.ROUNDS + 1); });
    if (!out.length) return;
    B.oils = B.oils.filter(function (o) { return out.indexOf(o) < 0; });
    B.card(['{g}The burning oil gutters out' + (out.length > 1 ? ' (' + out.length + ' squares)' : '') + '.{/}'], 200);
  }
  var onStart0 = M.onStart;
  M.onStart = function (B, u) { gutter(B, u); return onStart0.apply(this, arguments); };
  var onEnd0 = M.onEnd;
  M.onEnd = function (B, u) { var r = onEnd0.apply(this, arguments); var o = litOn(B, u)[0]; if (o) burn(B, o, u, 'ends its turn in the burning oil'); return r; };
  var stepInto0 = M.stepInto;
  M.stepInto = function (B, u) { var stop = stepInto0.apply(this, arguments); var o = litOn(B, u)[0]; if (o) burn(B, o, u, 'steps into the burning oil'); return stop || u.hp <= 0; };
  // fire reaching the ground lights the oil there: wherever fire burns a web (a torch landing, a fire spell's area, fire on one standing in it -- magic.js, light.js, battle.js hurt)
  var burnWebs0 = M.burnWebs;
  M.burnWebs = function (B, sq) { var r = burnWebs0 ? burnWebs0.apply(this, arguments) : undefined; OIL.lightIn(B, sq); return r; };
  // a torch set down on it (light.js L.dropTorch -- and a hero who falls with one in the hand)
  var drop0 = D.light.dropTorch;
  D.light.dropTorch = function (B, u) { var r = drop0.apply(this, arguments); OIL.lightIn(B, [[u.x, u.y]]); return r; };
  // a creature coated: the next fire it takes, 5 more, and the coat is gone
  var hurt0 = BP.hurt;
  BP.hurt = function (u, n, type, o) {
    var r = hurt0.apply(this, arguments);
    if (u && u.conds && u.conds.oiled && n > 0 && /fire/.test(type || '') && !(o && o.oilBurn) && !u.dead && !u.object && !(u.immune && u.immune.indexOf('fire') >= 0)) {
      delete u.conds.oiled; FX.sparkle(u, 'fire', 16);
      this.card(['{o}The oil on ' + nm(u) + ' catches:{/} {r}' + OIL.BURN + '{/} fire more'], 260);
      hurt0.call(this, u, OIL.BURN, 'fire', Object.assign({}, o || {}, { oilBurn: true }));
    }
    return r;
  };
  // the throw itself (exec 'item': a creature, or c.x/c.y a square)
  var use0 = BP.useItem;
  BP.useItem = function* (u, id, w, c) {
    if (id !== 'oil') { yield* use0.apply(this, arguments); return; }
    var self = this, s = (this.inv || []).filter(function (x) { return x.id === 'oil'; })[0], lit = OIL.lit(u);
    if (u.subclass === 'Thief' && u.turn.bonus > 0) u.turn.bonus = 0; else u.turn.action = 0; // (Fast Hands, as useItem)
    if (u.ownFlask != null) u.ownFlask = Math.max(0, u.ownFlask - 1); else if (s) s.n--; // (a story guest throws its own: battle.js itemList)
    if (!w && c && c.x != null) { // at the ground
      var ft = Math.max(Math.abs(c.x - u.x), Math.abs(c.y - u.y)) * 5;
      u.facing = D.spr.facingFor(c.x - u.x, c.y - u.y); u.anim = 'attack'; u.animT = this.t;
      this.card(['{y}' + u.name + '{/} ' + (lit ? 'lights the flask at the torch and throws it' : ft <= 5 ? 'pours the flask out' : 'throws the flask') + (ft <= 5 ? '' : ', ' + ft + ' ft') + '.'], 200);
      D.fx.projectile(u, { x: c.x, y: c.y, size: 1 }, 'fire'); yield { fx: 1 };
      OIL.spill(this, c.x, c.y, lit, u); u.anim = 'idle'; yield 30; return;
    }
    if (!w) return;
    if (lit) this.card(['{y}' + u.name + '{/} lights the flask at the torch.'], 140);
    yield* this.attack(u, w, OIL.atk(u, lit), { onHit: function (t) { if (!lit) OIL.coat(self, t); }, onMiss: function (t) { OIL.spill(self, t.x, t.y, lit, u, true); } });
    yield 20;
  };
  // what the square under the cursor holds (ui.js, the line at the bottom right)
  OIL.lineAt = function (B, x, y) {
    var o = OIL.at(B, x, y); if (!o) return null;
    if (o.lit == null) return '{y}oil on the ground{/}  {g}(a torch or any fire on it lights it: 2 rounds, 5 fire to enter it or end a turn in it){/}';
    return '{o}burning oil{/}: 5 fire to whoever enters it or ends a turn in it, once a turn  {g}(round ' + (B.round - o.lit + 1) + ' of 2){/}';
  };
  // the look: a dark sheen on the tile; burning, low flames over it (in the depth sort with the figures: looks.js LK.props)
  var P = function (r, i) { return D.PAL.ramps[r][i]; };
  function sqPt(x, y) { var c = D.iso.center(x, y, D.iso.map.gz(x, y)); return D.iso.toScreen(c.x, c.y); }
  function drawOil(ctx, B, o) {
    var s = sqPt(o.x, o.y), hw = D.iso.TW / 2 - 6, hh = D.iso.TH / 2 - 3, t = B.t;
    ctx.save();
    ctx.globalAlpha = o.lit != null ? 0.55 : 0.42; ctx.fillStyle = P('outline', 0);
    ctx.beginPath(); ctx.moveTo(s.x, s.y - hh); ctx.lineTo(s.x + hw, s.y); ctx.lineTo(s.x, s.y + hh); ctx.lineTo(s.x - hw, s.y); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.5; ctx.fillStyle = P('leather', 2); ctx.beginPath(); ctx.ellipse(s.x - 6, s.y - 2, 7, 2.5, 0, 0, 7); ctx.fill(); // (the sheen)
    if (o.lit != null) {
      for (var i = 0; i < 7; i++) {
        var fx = s.x + Math.sin(i * 2.3 + 0.7) * hw * 0.62, fy = s.y + Math.cos(i * 1.7) * hh * 0.55, h = 5 + ((t * 0.9 + i * 13) % 9);
        ctx.globalAlpha = 0.85; ctx.fillStyle = i % 2 ? P('fire', 1) : P('fire', 2);
        ctx.beginPath(); ctx.moveTo(fx - 2.5, fy); ctx.lineTo(fx, fy - h); ctx.lineTo(fx + 2.5, fy); ctx.closePath(); ctx.fill();
        ctx.fillStyle = P('fire', 0); ctx.fillRect(Math.round(fx) - 1, Math.round(fy - h * 0.45), 2, 2);
      }
    }
    ctx.restore();
  }
  var props0 = D.looks.props;
  D.looks.props = function (B) {
    var out = props0.apply(this, arguments) || [];
    (B.oils || []).forEach(function (o) { out.push({ depth: o.x + o.y - 0.4, gz: D.iso.map.gz(o.x, o.y), layer: 1, draw: function (ctx) { drawOil(ctx, B, o); } }); });
    return out;
  };
})();
