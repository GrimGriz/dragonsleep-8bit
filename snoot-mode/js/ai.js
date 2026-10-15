/* THE SNOOT -- the AI's orders (10-14, the Snoot mode seat). The gnolls are the AI from the first build and the Dominion with
   them; the player writes every order of ours (RULED 10-13: "build for all, a.i. later"). The gnolls' orders are their tempers
   as the register gives them (the lane §3; TarlynsPit/wiki/gnoll-hills.md, the three tribes CANON 09-16e):
   - the Skull-Gate (the fist, headless, "trouble starts at the Gulch and climbs"): erupts first -- every band hunts from Day 14;
   - the Gray Keeping (the seat-tribe): the death-watch never leaves the Mane on the moot ground; its band ranges from Day 16, and
     comes home to the wall when the plains' stomp comes near it;
   - the Wall-Laugh (the face, "snoots last, or holds"): holds its seat till Day 19;
   - the Harbinger: holds in the hills till the hunt (Day 18, or GreyFang within two hexes -- RULED 10-14), then goes for GreyFang
     by the cheapest way, through whoever stands in it.
   The plains tribes are the AI's too (RULED 10-15, his "Give the modes AI control over the barbarians"): berserkers who came for the
   Snoot -- they charge any gnolls within two hexes, hunt the nearest still in the field, stomp toward the moot ground if none is
   seen, and ride back to the Verge once the Snoot has gone home.
   A band hunting picks GreyFang if it can reach him in two days (the walking jackpot), else the nearest of ours it can face -- and
   it goes round the four where it can (the Snoot shies from a Lupine's guard; the lane §5.4). The Dominion watches: it walks the
   west road to the inn and holds there, and strikes only at what is small and next to it. SN.AI.ours is the bench's hand for our
   side (the gate's whole battle, and &watch). */
'use strict';
(function () {
  var SN = window.SN, AI = SN.AI = {};

  function go(st, u, to, avoidParty) {
    var P = SN.party(st), av = avoidParty && P ? function (h) { return SN.dist(h, P.at) <= 0; } : null;
    var p = SN.path(u.at, to, av); if (!p || !p.length) { u.order = { type: 'hold' }; return false; }
    u.order = { type: 'move', to: to.slice(), path: SN.reach(u, p), full: p }; return true;
  }
  function daysTo(u, to) { var p = SN.path(u.at, to); if (!p) return 99; var c = p.reduce(function (s, h) { return s + SN.cost(h); }, 0); return c / SN.moveOf(u); }
  function ours(st) { return st.units.filter(function (u) { return u.side === 'ours' && SN.alive(u) && u.on; }); }

  AI.orders = function (st) {
    st.units.forEach(function (u) {
      if (!SN.alive(u)) return;
      // routing and withdrawing units go home, whoever's they are
      if (u.state === 'rout' || u.state === 'withdraw') { go(st, u, u.home); return; }
      if (u.state === 'retreat' || (u.stand >= st.day)) { u.order = { type: 'hold' }; return; }
      if (u.side === 'gnoll') AI.gnoll(st, u);
      else if (u.side === 'dominion') AI.dominion(st, u);
      else if (u.berserk) AI.plains(st, u);
      if (u.side !== 'ours' || u.berserk) AI.face(st, u);
    });
  };
  // a unit of the AI's that is not marching turns to face the nearest enemy (turning in place is free; a march faces the way it goes)
  AI.face = function (st, u) {
    if (u.order.type === 'move') return;
    var x = st.units.filter(function (y) { return SN.alive(y) && SN.hostile(u, y) && !SN.same(y.at, u.at); }).sort(function (a, b) { return SN.dist(a.at, u.at) - SN.dist(b.at, u.at); })[0];
    var p = x && SN.dist(x.at, u.at) <= 6 ? SN.path(u.at, x.at) : null, d = p && p[0] ? SN.dirTo(u.at, p[0]) : -1;
    if (d >= 0) u.face = d;
  };
  // the plains tribes (RULED 10-15): berserkers will not wait (p.20: they charge on sight and fight till all are dead) -- a gnoll unit within two
  // hexes and they go for it; else the nearest gnoll unit in the field (not the Harbinger: he walks through anyone without a hero); none seen, the
  // stomp toward the moot ground; the Snoot gone home (the head taken) and no gnoll near, back to the Verge
  AI.plains = function (st, u) {
    var g = st.units.filter(function (x) { return x.side === 'gnoll' && SN.alive(x) && x.state !== 'home' && !x.harbinger; })
      .sort(function (a, b) { return SN.dist(a.at, u.at) - SN.dist(b.at, u.at); });
    u.berserkOrder = false;
    if (g[0] && SN.dist(g[0].at, u.at) <= 2) { go(st, u, g[0].at); u.berserkOrder = true; SN.say(st, u.name + ' have seen gnolls and will not be held back.', 'move', u.at); return; }
    if (st.head && !(g[0] && SN.dist(g[0].at, u.at) <= 4)) { if (!SN.same(u.at, u.home)) go(st, u, u.home); return; }
    if (g[0]) { go(st, u, g[0].at); return; }
    if (!SN.same(u.at, SN.MOOT)) go(st, u, SN.MOOT);
  };
  AI.gnoll = function (st, u) {
    u.order = { type: 'hold' };
    if (u.watch) { if (!SN.same(u.at, SN.MOOT)) go(st, u, SN.MOOT); return; } // (the death-watch: unto death, on the moot ground -- and back to it if a night drove it off)
    if (u.harbinger) return AI.harbinger(st, u);
    if (u.tribe === 'wall' && st.day < 19) return; // (the Wall-Laugh holds -- and is despised for it at the tally)
    if (u.tribe === 'gray') {
      var plains = st.units.filter(function (x) { return x.kind === 'the plains' && SN.alive(x) && SN.dist(x.at, SN.MOOT) <= 3; });
      if (plains.length) { if (SN.dist(u.at, SN.MOOT) > 1) go(st, u, SN.MOOT); else u.order = { type: 'support' }; return; } // (the stomp breaks on the Gray Keeping's wall)
      if (st.day < 16) { u.order = { type: 'support' }; return; }
    }
    // the hunt for glory: GreyFang if he is within two days and the four are not about him (the Snoot shies from a Lupine's guard; he is the
    // Harbinger's), else the mark where the most of the Snoot can come together on the least of ours -- glory wants witnesses
    var G = SN.greyfang(st), P = SN.party(st);
    if (G && daysTo(u, G.at) <= 2 && !(P && SN.dist(P.at, G.at) <= 1)) { go(st, u, G.at, true); return; }
    var best = AI.mark(st, u);
    if (best) { go(st, u, best.at, true); return; }
    // nothing to hunt: down toward the road and the Pit, where the young blood is seen
    if ((u.tribe === 'skull' || st.day >= 17) && SN.dist(u.at, SN.PIT) > 2) { go(st, u, SN.dist(u.at, [8, 5]) > 1 ? [8, 5] : [7, 6], true); return; } // (down toward the road above the Pit, where the young blood is seen -- not into the four)
    u.order = { type: 'support' };
  };
  // the mark: of ours within three days, not the four and not where they stand, the one with the most gnoll figures that could reach it
  // within two days (this band's own among them) against its own strength; a band takes on what the Snoot together can beat
  AI.mark = function (st, u) {
    var P = SN.party(st), best = null, bs = 0;
    ours(st).forEach(function (x) {
      if (x.party || (P && SN.dist(P.at, x.at) <= 0)) return;
      var d = daysTo(u, x.at); if (d > 3) return;
      var pack = st.units.filter(function (g) { return g.side === 'gnoll' && SN.alive(g) && g.state === 'ok' && !g.watch && !g.harbinger && daysTo(g, x.at) <= 2; })
        .reduce(function (s, g) { return s + g.figs; }, 0);
      var score = pack / Math.max(1, SN.fightFigs(x)) - d * 0.15;
      if (pack >= SN.fightFigs(x) * 1.1 && score > bs) { bs = score; best = x; }
    });
    return best;
  };
  AI.harbinger = function (st, u) {
    u.order = { type: 'hold' };
    if (st.huntDay == null || u.beaten || st.head) return;
    var G = SN.greyfang(st); if (!G) return;
    go(st, u, G.at);
  };
  AI.dominion = function (st, u) {
    u.order = { type: 'hold' };
    var near = ours(st).filter(function (x) { return !x.party && SN.dist(x.at, u.at) === 1 && SN.fightFigs(x) <= 3; })[0];
    if (near) { go(st, u, near.at); return; }
    var inn = [8, 3];
    if (!SN.same(u.at, inn) && SN.dist(u.at, inn) > 1) go(st, u, inn);
    else u.order = { type: 'support' };
  };

  // ---------------------------------------------------------------- the bench's hand for our side (the probe's whole battle; ?watch)
  AI.ours = function (st) {
    var G = SN.greyfang(st);
    ours(st).forEach(function (u) {
      if (!SN.canOrder(st, u) || u.berserkOrder) return;
      if (u.party) { if (G && !SN.same(u.at, G.at)) SN.setOrder(st, u, { type: 'move', to: G.at }); else if (!G) AI.hunt(st, u); else u.order = { type: 'support' }; return; }
      if (u.id === 'greyfang') { u.order = { type: 'hold' }; return; }
      if ((u.id === 'patrol' || u.id === 'bows') && st.day < 16) { u.order = { type: 'support' }; return; }
      AI.hunt(st, u);
    });
  };
  AI.hunt = function (st, u) {
    var foes = st.units.filter(function (x) { return x.side !== 'ours' && SN.alive(x) && x.state !== 'home' && !x.harbinger; });
    var t = foes.sort(function (a, b) { return SN.dist(a.at, u.at) - SN.dist(b.at, u.at); })[0];
    if (t && SN.dist(t.at, u.at) <= 6) SN.setOrder(st, u, { type: 'move', to: t.at }); else u.order = { type: 'support' };
  };
})();
