/* DEEP16 -- GreyFang's end (10-08, the GreyFang window): the ending of a fight that says `trophy` (data/fights.js greyfang, GreyFang's pit).
   Griz, 10-08: "presently leaning toward direct old one intervention after apparent party victory - cutscene type Harbinger revive, obtain trophy, escape";
   "I was thinking a headless sprite falling across the screen onto the grid prone"; "you're kinda the GreyFang sprite guy, no window better suited to finish
   him off". The fight is won when the Harbinger is down -- and then, on the map's camera (Battle.camTo, the dunking booth's way), before the win is read:
   the Old One looks out through the mirrors he put in the Harbinger's eyes and stands him up whole, the ripple over the whole body (js/looks.js D.ripple);
   he goes to GreyFang on the Pounce's leap -- standing, GreyFang is made to kneel; down, he lies -- the blow, a flash; the body, headless (his `headless` row,
   tools/greyfang-sheet.py), flung across the screen onto the grid and lying there, his bow beside it; the Harbinger leaps out over the rim and is gone, his
   hyenas with him. Then the win, in the fight's `won` words. The words on the cards are the seat's drafts (invented.json #greyfangs-end). */
(function () {
  var D = window.D16, G = D.grid, FX = D.fx, BP = D.Battle.prototype;
  function face(a, b) { return D.spr.facingFor(Math.sign(b.x - a.x), Math.sign(b.y - a.y)); }
  function free(B, x, y) { var t = G.map.at(x, y); return !!(t && t.walk) && !G.occupant(x, y) && x >= 0 && y >= 0 && x < G.map.w && y < G.map.h; }
  // a body or a leaper sent through the air from where it stands to (x, y): the tween's arc (ui.js unitPos 'hurl'), and the ticks it takes
  function hurl(B, u, x, y, peak, ticks) {
    u.tween = { fx: u.x, fy: u.y, fz: G.gzAt(u, u.x, u.y), t: 0, dur: B.pace ? B.pace(ticks, true) : ticks, mode: 'hurl', peak: peak };
    u.x = x; u.y = y; delete u.hang;
    return u.tween.dur;
  }
  // the camera on one, a little above the middle of the view (the cards sit at its foot): the point it looks at is down-screen of the creature, half a
  // square and more on each grid axis (+gx is SE on screen, +gy SW: both together are straight down)
  function camOn(B, u, zoom, ticks) { var s = (u.size || 1) - 1, gz = u.sheet ? G.gzAt(u, u.x, u.y) : G.map.gz(Math.round(u.x), Math.round(u.y)); return B.camTo({ gx: u.x + s / 2 + 0.9, gy: u.y + s / 2 + 0.9, gz: gz }, zoom, ticks); } // (a midpoint between two: the ground's height at the nearest square)
  function kneelWord() { var say = function () { if (D.say) D.say('Kneel.', { pitch: 0.4, rate: 0.8 }); }; if (D.clip) D.clip('audio/kneel.mp3', function (ok) { if (!ok) say(); }); else say(); } // (his recorded word, js/traits.js's clip)

  function* ending(B) {
    var F = B.fight, h = B.units.filter(function (u) { return u.kind === 'harbinger'; })[0], g = B.units.filter(function (u) { return u.id === (F.quarry || 'greyfang'); })[0];
    if (!h || !g) return;
    B.trophyDone = true; B.clearCards && B.clearCards();
    // the stillness
    yield* camOn(B, h, 1.7, 30);
    B.card(['{y}The Harbinger lies still. The crowd on the tiers lets out its breath.{/}'], 1e9, 'trophy'); yield 70;
    // the mirrors turn: the Old One, through what he made
    D.sfx('encounter'); FX.ring(h, 'violet', 46); if (D.ripple) D.ripple(h, { region: 'body', dur: 70 });
    B.card(['{v}The mirrors in its eyes turn over, and something else looks out of them.{/}'], 1e9, 'trophy'); yield 80;
    B.card(['{v}"Not yet. You were sent for something."{/}'], 1e9, 'trophy'); yield 70;
    // up, whole
    h.dead = false; h.ko = false; h.slain = false; h.hp = h.maxhp; h.conds = {}; h.deadT = null; h.flash = 0;
    if (D.ripple) D.ripple(h, { region: 'body', dur: 60 });
    D.sfx('buff');
    if (D.spr.anim(h.sheet, 'ascend')) { h.anim = 'ascend'; h.animT = B.t; yield (D.spr.duration(h.sheet, 'ascend') || 40) + 6; }
    h.upright = true; h.anim = 'idle'; h.animT = B.t; yield 20;
    // to GreyFang, on the leap
    yield* camOn(B, g, 1.8, 26);
    var sq = null;
    for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      var x = g.x + dx, y = g.y + dy;
      if (!free(B, x, y)) continue;
      var d = Math.abs(x - h.x) + Math.abs(y - h.y);
      if (!sq || d < sq.d) sq = { x: x, y: y, d: d };
    }
    if (sq) {
      h.facing = D.spr.facingFor(Math.sign(sq.x - h.x), Math.sign(sq.y - h.y));
      if (D.spr.anim(h.sheet, 'pounce')) { h.anim = 'pounce'; h.animT = B.t; }
      if (D.ripple) D.ripple(h, { region: 'body' });
      D.sfx('run'); yield hurl(B, h, sq.x, sq.y, 46, 30);
    }
    h.facing = face(h, g); g.facing = face(g, h); h.anim = 'idle'; yield 14;
    // standing, he is made to kneel (the Kneel look: ui.js, a hold by the Harbinger); down, he lies as he fell
    if (g.hp > 0 && !g.dead) {
      kneelWord(); B.card(['{v}"Kneel."{/}'], 1e9, 'trophy');
      g.conds = { paralyzed: { by: h.id } }; if (D.ripple) D.ripple(g, { region: 'body', dur: 50 });
      yield 60;
    } else { B.card(['{v}GreyFang lies where he fell. It stands over him.{/}'], 1e9, 'trophy'); yield 50; }
    // the blow, and the cut away: a flash, the ground shaking
    if (D.spr.anim(h.sheet, 'backhand')) { h.anim = 'backhand'; h.animT = B.t; }
    yield 16;
    D.sfx('crit'); FX.ring(g, 'silver', 60); B.shakeT = 26;
    g.hp = 0; g.dead = true; g.ko = true; g.deadT = B.t; g.headless = true; g.conds = {}; g.flash = 0;
    // the body, flung across the screen onto the grid, lying (his headless Fall, the last frame held -- ui.js)
    var sx = Math.sign((g.x - g.y) - (h.x - h.y)) || 1, land = null; // (across the screen: right is +gx -gy; away from him)
    for (var k = 3; k >= 1 && !land; k--) { var lx = g.x + sx * k, ly = g.y - sx * k; if (free(B, lx, ly)) land = { x: lx, y: ly }; }
    if (!land) for (k = 3; k >= 1 && !land; k--) { lx = g.x + sx * k; ly = g.y; if (free(B, lx, ly)) land = { x: lx, y: ly }; }
    g.facing = sx > 0 ? 6 : 2; g.anim = 'headless'; g.animT = B.t;
    var mid = land ? { x: (g.x + land.x) / 2, y: (g.y + land.y) / 2, size: 1 } : g;
    yield* camOn(B, mid, 1.4, 8);
    var fl = land ? hurl(B, g, land.x, land.y, 80, 46) : 30;
    yield fl + 24;
    yield* camOn(B, g, 1.8, 24);
    h.anim = 'idle';
    B.card(['{v}The Harbinger has what it came for.{/}'], 1e9, 'trophy'); yield 80;
    // out over the rim, and gone -- his hyenas with him
    var rim = null, top = 0;
    for (var ry = 0; ry < G.map.h; ry++) for (var rx = 0; rx < G.map.w; rx++) top = Math.max(top, G.map.gz(rx, ry));
    for (ry = 0; ry < G.map.h; ry++) for (rx = 0; rx < G.map.w; rx++) {
      if (G.map.gz(rx, ry) < top || !free(B, rx, ry)) continue;
      var rd = Math.abs(rx - h.x) + Math.abs(ry - h.y);
      if (!rim || rd < rim.d) rim = { x: rx, y: ry, d: rd };
    }
    if (rim) yield* camOn(B, { x: (h.x + rim.x) / 2, y: (h.y + rim.y) / 2, size: h.size || 1 }, 1.3, 24); else yield* camOn(B, h, 1.5, 20);
    if (rim) {
      h.facing = D.spr.facingFor(Math.sign(rim.x - h.x), Math.sign(rim.y - h.y));
      if (D.spr.anim(h.sheet, 'pounce')) { h.anim = 'pounce'; h.animT = B.t; }
      if (D.ripple) D.ripple(h, { region: 'body' });
      D.sfx('run'); yield hurl(B, h, rim.x, rim.y, 64, 34);
    }
    h.left = true; h.fled = true;
    B.units.forEach(function (w) { if (w !== h && w.side === 'foe' && !w.dead && (w.summon || w.kind === 'mirrorhyena')) { w.left = true; w.fled = true; } });
    B.card(['{v}It is over the rim and gone, and the pack with it.{/}'], 1e9, 'trophy'); yield 70;
    yield* camOn(B, g, 1.8, 30);
    B.card(['{g}His bow lies on the sand beside him.{/}'], 1e9, 'trophy'); yield 80;
    B.clearCards && B.clearCards();
  }

  var finish0 = BP.finish;
  BP.finish = function* (o) {
    if (o === 'won' && this.fight && this.fight.trophy && !this.trophyDone) yield* ending(this);
    yield* finish0.call(this, o);
  };
  D.trophy = { ending: ending };
})();
