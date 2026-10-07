/* DEEP16 — the Game Show's tutorial (10-07; the lane: they live\handoff-2026-10-07-the-monster-party-game-show.md, seat 1's screens). Griz, 10-07, on the
   first one (the Mascot gallery's walk: its column and its dummies): "tutorial 1 isn't done - i should see text like the lines Pyro and Ingrith give from
   Denny about his ability and when to use it, then the wheel popup - highlight - like you click it - show the cursor moving to the target. Him having to
   move into position kinda just makes it better".

   So a Mascot teaches his own kit on the lighthouse floor, in his own words (the seat's drafts: invented.json#gameshow-tutorial), and plays real turns with
   the game's own ring: a GHOST of the mouse -- a pointer drawn over the picture -- moves and clicks, and its clicks go to js/ui.js as a player's would
   (I.mouse, set each frame before the fight reads it). What the players will click is what they see clicked: a square to walk to, himself for the ring,
   SKILLS, the special, the one it is aimed at, ATTACK, END TURN on the bar. The foes walk in at the door as the gallery's normies (js/mpgallery.js
   MG.normie: every score 8, AC 10, 100 HP), so a demonstration lands; the dice are real.

     yield* D.gameshow.teach(B, { who: ['denny'], home: [x, y], fast })    the lessons, one Mascot after another (js/gameshow.js calls it from the title's
                                                                         TUTORIAL toggle); a Mascot with no lesson of his own walks the gallery's (MG.walk)
     GS.LESSONS[key] = function* (T) { ... }                             a Mascot's lesson; T is the toolkit (kit, below)

   While a lesson runs: a click or E moves a line on, X (or Esc) skips the rest. While the ghost has the mouse the real one is set aside (a click still
   finishes a line's read). The players' own UI options -- WINDOW or RING, AUTO END, END TURN ASKS -- are the ring's, no auto end and never asked for the
   lesson, and put back after. Everyone stands where they stood, whole, when it ends. GS.lastTeach is what it did (dev/bench16.js mode=gstutorial1007). */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, I = D.input, FX = D.fx, MP = D.mpmon, GS = D.gameshow;
  if (!GS || !MP || !GS._) return;
  var X = GS._, W = X.W;
  var NAME = { denny: 'Denny', beholda: 'Beholda', rascal: 'Rascal', goose: 'Goose' };
  function P(r, i) { return D.PAL.ramps[r][i]; }
  GS.LESSONS = {};

  // ------------------------------------------------------------------ the ghost: the lesson's hand on the mouse
  // its plan, one step at a time: { go: fn -> {x, y} | null, dur } eases there (the target asked every frame: a ring turns), { wait: n, read } holds
  // (a read is cut short by a real click or E), { click: 1 }, { until: fn, max }, { say: text } changes the line
  function ghost() { return { x: D.W / 2, y: D.H - 70, mx: -1, my: -1, plan: [], i: 0, t: 0, on: false, idle: 0, rip: null }; }
  GS.ghostTick = function (B) {
    var st = B.gs, g = st.ghost;
    if (!g) return false;
    if (!g.on) { if (I.pressed('b')) st.skip = true; if (I.pressed('a')) st.hurry = true; return false; }   // (between plans the real mouse and keys are the players': a click or E moves a line on -- caught here, every frame, since the lesson steps every other)
    var m = I.mouse, real = m.click || I.pressed('a');
    if (I.pressed('b')) st.skip = true;
    I.edge = {};                                                              // (the keys are the ghost's while it drives; X was read above)
    m.click = false; m.rclick = false; m.rbtn = false; m.wheel = 0; m.drag = null; m.panX = 0; m.panY = 0;
    if (st.skip) { g.on = false; g.plan = []; if (B.req && B.req.turn) B.answer(null); return true; }
    var s = g.plan[g.i], done = false, glide = false;
    if (s) {
      g.t++;
      if (s.say != null) { st.say = { text: s.say, t0: B.t }; done = true; }
      else if (s.go) {
        if (g.t === 1) g.from = { x: g.x, y: g.y };
        var p = s.go();
        if (!p) { g.t--; if (++g.idle > 240) done = true; }                  // (a button not drawn yet: wait for it, not for ever)
        else { var k = Math.min(1, g.t / s.dur), e = k * k * (3 - 2 * k); g.x = g.from.x + (p.x - g.from.x) * e; g.y = g.from.y + (p.y - g.from.y) * e; glide = true; if (k >= 1) { g.x = p.x; g.y = p.y; done = true; } }
      } else if (s.wait != null) { if (g.t >= s.wait || (s.read && real && g.t > 20)) done = true; }
      else if (s.click) { m.click = true; g.rip = { x: g.x, y: g.y, t0: B.t }; done = true; }
      else if (s.until) { if (s.until() || g.t >= (s.max || 300)) done = true; }
      if (done) { g.i++; g.t = 0; g.idle = 0; }
    } else if (B.req && B.req.turn && ++g.idle > 240) { g.idle = 0; B.answer({ stuck: true }); return true; }   // (the plan spent and the turn still open: on we go, and it is reported)
    var nx = Math.round(g.x), ny = Math.round(g.y);
    m.moved = glide && (nx !== g.mx || ny !== g.my) || (done && !!(s && s.go));
    g.mx = nx; g.my = ny; m.x = nx; m.y = ny; m.inside = true; m.inWin = false;   // (inWin off: the edge of the screen never scrolls under it)
    return true;
  };

  // ------------------------------------------------------------------ the picture: the line at the top, the fight's cards under it, the pointer over all
  function speech(ctx, B) {
    var sy = B.gs.say; if (!sy) return 15;
    var w = 320, lines = D.wrap(sy.text, w - 12), h = lines.length * 9 + 15, x = Math.round((D.W - w) / 2), y = 15;
    ctx.fillStyle = 'rgba(10,8,16,.92)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = P('gold', 3); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    lines.forEach(function (l, k) { D.text(ctx, l, x + 6, y + 4 + k * 9, P('bone', 1)); });
    D.text(ctx, '{g}click: on  ·  X: skip the tutorial{/}', x + w - 5, y + h - 10, P('accent', 2), 'right');
    return y + h + 3;
  }
  function cardsUnder(ctx, B, y0) {
    var y = y0, cs = (B.cards || []).slice(-3);
    cs.forEach(function (c, i) {
      var lines = [], w = 0;
      c.lines.filter(function (l) { return l; }).forEach(function (l) { (D.textWidth(l) > D.W - 18 ? D.wrap(l, D.W - 18) : [l]).forEach(function (x) { lines.push(x); }); });
      lines.forEach(function (l) { w = Math.max(w, D.textWidth(l)); });
      w = Math.min(D.W - 8, w + 10);
      var x = Math.round((D.W - w) / 2), h = lines.length * 9 + 5, age = B.t - c.t0, fade = c.life - age < 30 ? (c.life - age) / 30 : 1;
      ctx.globalAlpha = (i === cs.length - 1 ? 1 : 0.6) * Math.max(0, fade);
      ctx.fillStyle = 'rgba(10,8,16,.86)'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = P('silver', 3); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      lines.forEach(function (l, k) { D.text(ctx, l, x + 5, y + 3 + k * 9, P('bone', 1)); });
      ctx.globalAlpha = 1;
      y += h + 2;
    });
  }
  // the pointer: an arrow, white with a dark edge, its tip the click; a ring where it clicked
  var ARROW = ['X..........', 'XX.........', 'XWX........', 'XWWX.......', 'XWWWX......', 'XWWWWX.....', 'XWWWWWX....', 'XWWWWWWX...', 'XWWWWWWWX..', 'XWWWWWWWWX.',
    'XWWWWWXXXXX', 'XWWXWWX....', 'XWX.XWWX...', 'XX..XWWX...', 'X....XWWX..', '.....XWWX..', '......XX...'];
  function pointer(ctx, B) {
    var g = B.gs.ghost; if (!g) return;
    var r = g.rip;
    if (r && B.t - r.t0 < 16) { var k = (B.t - r.t0) / 16; ctx.globalAlpha = 1 - k; ctx.strokeStyle = P('gold', 4); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(r.x, r.y, 3 + k * 10, 2 + k * 6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    var x = Math.round(g.x), y = Math.round(g.y), down = r && B.t - r.t0 < 6 ? 1 : 0;
    for (var row = 0; row < ARROW.length; row++) for (var q = 0; q < ARROW[row].length; q++) {
      var ch = ARROW[row][q]; if (ch === '.') continue;
      ctx.fillStyle = ch === 'X' ? P('outline', 0) : down ? P('gold', 4) : P('bone', 2); ctx.fillRect(x + q, y + row + down, 1, 1);
    }
  }
  function paintLesson(ctx, B) { var y = speech(ctx, B); cardsUnder(ctx, B, y); pointer(ctx, B); }

  // ------------------------------------------------------------------ the toolkit a lesson is written with
  function* fire(gen) { // a command or a foe's turn run to its end: a prompt takes its first answer (a lesson is not asked), a turn asked inside one ends
    var v;
    for (var k = 0; k < 20000; k++) {
      var r = gen.next(v); v = undefined;
      if (r.done) return r.value;
      var y = r.value;
      if (y && y.prompt) { v = y.prompt.opts[0].value; continue; }
      if (y && y.turn) { v = { do: 'end' }; continue; }
      if (y && y.aim) { v = null; continue; }
      v = yield y;
    }
  }
  function* together(gens) { // walks side by side: each its own beat
    var q = gens.map(function (g) { return { g: g, w: 0 }; });
    while (q.length) { q = q.filter(function (e) { if (e.w > 0) { e.w--; return true; } var r = e.g.next(); if (r.done) return false; e.w = (typeof r.value === 'number' ? r.value : 1) - 1; return true; }); yield 1; }
  }
  function readT(s) { return Math.min(560, 70 + String(s).replace(/\{.\}|\{\/\}/g, '').length * 3); }
  function kit(B, me, o, rep) {
    var st = B.gs, ctr = o.home, who = NAME[me.mpmon] || me.name, g = st.ghost;
    var T = { B: B, me: me, L: me.lvl || 1, ctr: ctr, foes: [], rep: rep };
    // ---- the words: his, in his voice (the card's way, as Pyro's); a narrator's aside in green
    T.line = function (s) { return '{y}' + who + '{/}: "' + s + '"'; };
    T.say = function* (s, n) { yield* hold(T.line(s), n || readT(s)); rep.said++; };
    T.note = function* (s, n) { yield* hold('{g}' + s + '{/}', n || readT(s)); };
    function* hold(text, n) {
      if (st.skip) return;
      st.say = { text: text, t0: B.t }; st.clicks = []; st.hurry = false;
      var t0 = B.t;                                               // (by the fight's clock: a yield of 1 is a step every other frame)
      while (B.t - t0 < W(n)) {
        yield 1;
        if (st.skip) return;
        var ck = st.clicks.shift();
        if ((ck || st.hurry) && B.t - t0 > 20) { st.hurry = false; return; }
      }
    }
    // ---- the floor: a square from the circle's middle (the nearest one free); a figure walked there; a foe in at the door
    T.at = function (dx, dy) { return free(me, ctr[0] + dx, ctr[1] + dy); };
    function open(u, x, y) { return G.canStand(u, x, y) && !B.units.some(function (w) { return w !== u && !w.dead && w.x === x && w.y === y; }); }
    function free(u, x, y) { for (var r = 0; r < 6; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) === r && open(u, x + dx, y + dy)) return [x + dx, y + dy]; } return [x, y]; }
    T.walk = function (pairs) { return together(pairs.map(function (p) { return X.walkTo(B, p[0], p[1], 8); })); };
    T.door = function () { var rows = G.map.def.rows; for (var y = rows.length - 1; y >= 0; y--) { var x = rows[y].indexOf('d'); if (x >= 0) return [x, y]; } return [ctr[0], G.map.h - 2]; };
    T.foe = function (kind) {
      var w = B.makeFoe({ id: 'tut' + T.foes.length + '-' + kind, kind: kind }), d = T.door();
      D.mpgallery.normie(w); w.x = d[0]; w.y = d[1]; w.facing = 0; B.units.push(w); G.setup(G.map, B.units); T.foes.push(w);
      return w;
    };
    T.mascot = function (k) { return X.mascot(B, k); };
    // ---- a turn: his, played by the ghost on the game's own ring
    T.begin = function () {
      B.cine = false; B.round = T.round = (T.round || 0) + 1; B.order = [me].concat(T.foes.filter(function (w) { return !w.dead; }));
      RU.startTurn(me); B.active = me; B.tool = 'move'; B.cursor = { x: me.x, y: me.y };
    };
    T.act = function* (plan) {                                    // the ghost's plan while his turn is open; the command it made comes back
      if (st.skip) return null;
      g.plan = plan; g.i = 0; g.t = 0; g.idle = 0; g.on = true;
      var cmd = yield { turn: me };
      g.on = false; g.plan = [];
      if (cmd && cmd.stuck) rep.stuck++;
      if (cmd && cmd.do) rep.steps.push(cmd.do);
      return st.skip ? null : cmd;
    };
    T.exec = function* (cmd) { if (cmd && cmd.do && cmd.do !== 'end') yield* fire(B.exec(me, cmd)); };
    T.end = function () { D.magic.endTurn(B, me); B.active = null; };
    // a foe's turn, its own AI choosing what to do and at whom; its dice SOFT (o.soft): every d20 a 12, every other die a 1 -- a blow lands, and lands
    // light, so the teacher is on his feet for the rest of the lesson (the first run's goblins dropped Denny before his second turn, 10-07)
    T.foeTurn = function* (u, o2) {
      if (st.skip || !G.standing(u)) return;
      var d0 = D.d;
      if (o2 && o2.soft) D.d = function (n) { return D.battle === B ? (n === 20 ? 12 : 1) : d0.apply(this, arguments); };
      try { B.active = u; RU.startTurn(u); yield* fire(D.ai.turn(B, u)); D.magic.endTurn(B, u); }
      finally { D.d = d0; B.active = null; }
      yield W(30);
    };
    // ---- the ghost's steps
    function scr(x, y) { var c = D.iso.center(x, y, G.map.gz(x, y)); return D.iso.toScreen(c.x, c.y); }
    T.read = function (s) { return { wait: W(readT(s)), read: true }; };
    T.pause = function (n) { return { wait: W(n) }; };
    T.click = function () { return { click: 1 }; };
    T.tell = function (s) { return { say: T.line(s) }; };
    T.until = function (fn, max) { return { until: fn, max: max }; };
    T.toSq = function (x, y) { return { go: function () { var s = scr(x, y); return { x: s.x, y: s.y + 2 }; }, dur: W(40) }; };
    T.toUnit = function (u) { return { go: function () { var p = D.ui.unitPos(B, u); return { x: p.x, y: Math.round(p.y - D.spr.unitTop(u) * D.iso.zoom * 0.45) }; }, dur: W(40) }; };
    T.toBtn = function (id) { return { go: function () { var b = (B.buttons || []).filter(function (r) { var c = r.cmd || (r.list != null && B.list && B.list.items[r.list]); return c && (c.id === id || (c.cmd && c.cmd.id === id)); })[0]; return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : null; }, dur: W(34) }; };
    T.toEnd = function () { return { go: function () { var b = (B.buttons || []).filter(function (r) { return r.end; })[0]; return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : null; }, dur: W(44) }; };
    T.ring = function () { return T.until(function () { return B.tool === 'menu' || !!B.list; }, 60); };
    T.aiming = function () { return T.until(function () { return B.tool === 'spell' || B.tool === 'attack'; }, 60); };
    // the ring opened on himself, a button on it, and one on the ring under it (SKILLS: the specials)
    T.openRing = function () { return [T.toUnit(me), T.pause(14), T.click(), T.ring(), T.pause(24)]; };
    T.pick = function (id, look) { return [T.toBtn(id), T.pause(look || 30), T.click(), T.pause(18)]; };
    T.lock = function (dx, dy, zoom) { var c = D.iso.center(ctr[0] + dx, ctr[1] + dy, 0); st.lock = { x: c.x, y: c.y, zoom: zoom || 1.25 }; };
    return T;
  }

  // ------------------------------------------------------------------ the run: each Mascot's lesson on this floor, then everyone put back
  GS.teach = function* (B, o) {
    o = o || {};
    var st = B.gs, keep = B.units.map(function (u) { return { u: u, x: u.x, y: u.y, f: u.facing }; }), ui = D.ui.opts;
    var opts0 = { style: ui.style, autoEnd: ui.autoEnd, confirmEnd: ui.confirmEnd }, cine0 = B.cine, paint0 = B.paint, lock0 = st.lock;
    var report = GS.lastTeach = { who: {}, skipped: false };
    ui.style = 'ring'; ui.autoEnd = false; ui.confirmEnd = 'never';
    st.ghost = ghost(); st.skip = false; st.say = null; st.clicks = [];
    // (the fight's cards held back and drawn under his line; the aimed-at one's sheet, B.peek, left off: it sat over his words)
    B.paint = function (ctx) { var cs = this.cards, pk = this.peek; this.cards = []; this.peek = null; try { paint0.apply(this, arguments); } finally { this.cards = cs; this.peek = pk; } paintLesson(ctx, this); };
    var foes = [];
    try {
      var list = (o.who || ['denny']).filter(function (k) { return X.mascot(B, k); });
      for (var i = 0; i < list.length && !st.skip; i++) {
        var k = list[i], me = X.mascot(B, k), rep = report.who[k] = { steps: [], said: 0, stuck: 0 };
        if (GS.LESSONS[k]) { var T = kit(B, me, { home: o.home }, rep); yield* GS.LESSONS[k](T); foes = foes.concat(T.foes); }
        else if (D.mpgallery && D.mpgallery.walk) { st.say = null; st.ghost.on = false; yield* D.mpgallery.walk(B, { who: [k], home: o.home, fast: o.fast }); rep.gallery = true; }
      }
    } finally {
      report.skipped = !!st.skip;
      st.ghost = null; st.say = null; st.skip = false; st.clicks = []; st.lock = lock0;
      ui.style = opts0.style; ui.autoEnd = opts0.autoEnd; ui.confirmEnd = opts0.confirmEnd;
      B.paint = paint0; B.cine = cine0; B.req = null; B.list = null; B.tool = 'move'; B.spell = null; B.picks = [];
      foes.forEach(function (w) { if (B.units.indexOf(w) >= 0 && !w.dead) FX.sparkle(w, 'gold', 10); });
      B.units = keep.map(function (h) { var u = h.u; u.x = h.x; u.y = h.y; u.facing = h.f; u.conds = {}; u.hp = u.maxhp = u.gMax || u.maxhp; u.temp = 0; u.dead = false; u.ko = false; u.anim = 'idle'; u.animT = B.t; delete u.tween; delete u.holding; if (u.mpmon) MP.refill(u); return u; });
      G.setup(G.map, B.units); B.clearCards(); B.active = null; B.order = [];
    }
    return report;
  };

  // ------------------------------------------------------------------ DENNY, the Tank (the first lesson: his "build for denny as test")
  // the floor: the four on the circle's corners, Goose by the south rim; two goblins and a hobgoblin in at the door, after Goose. Turn one: the walk in
  // between, TAUNT (the bonus action, his special), MONKEY FISTS (the action), END TURN; the goblins' turns (the taunted ones must come at him); turn two, the
  // special handed back as a rest would: DENIM DAMAGE on the hobgoblin. His words are the seat's drafts (invented.json#gameshow-tutorial)
  GS.LESSONS.denny = function* (T) {
    var B = T.B, me = T.me, L = T.L, n = MP.specialsAt(L), ctr = T.ctr, cs = [[ctr[0] - 2, ctr[1] - 2], [ctr[0] + 2, ctr[1] - 2], [ctr[0] - 2, ctr[1] + 2], [ctr[0] + 2, ctr[1] + 2]];
    var bh = T.mascot('beholda'), rs = T.mascot('rascal'), gs = T.mascot('goose');
    // to places: the four on the corners, the camera on the south half of the room
    T.lock(-2, 2, 1.25);                                                      // (the scene a little low on the screen: his line and the cards over it, the ring clear of them, his corner clear of the bar)
    yield* T.walk([[me, cs[3]], [rs, cs[1]], [gs, cs[2]], [bh, cs[0]]].filter(function (p) { return p[0]; }));
    me.facing = 0; G.setup(G.map, B.units);
    yield* T.say('Name\'s Denny. I\'m the tank: I stand in front and make them hit me instead of my friends.');
    var g1 = T.foe('goblin'), g2 = T.foe('goblin'), hob = T.foe('hobgoblin');
    D.sfx('encounter');
    yield* T.walk([[g1, T.at(-3, 4)], [g2, T.at(-2, 4)], [hob, T.at(-1, 3)]]);   // (none of them straight in front of the square he walks to: a figure there takes the click meant for the floor behind it)
    [g1, g2, hob].forEach(function (w) { w.facing = 4; });
    yield* T.say('Goblins, up from the door, and they want Goose. Watch my turn.');
    yield* T.say('Every turn I get a MOVE, an ACTION -- the yellow A -- and a BONUS action, the blue B. The bar at the bottom keeps count.');
    // turn one: the walk, between Goose and them
    T.begin();
    var spot = T.at(-2, 3);
    var feet = 'First, the feet. The pale-blue squares are as far as I can walk. Point at one and the dots show my way; click, and I go. Right in front of the trouble.';
    var c = yield* T.act([T.tell(feet), T.pause(70), T.toSq(spot[0], spot[1]), T.read(feet), T.click()]);
    if (!c) return; yield* T.exec(c);
    // TAUNT: himself for the ring, SKILLS, TAUNT
    var tauntWhy = 'TAUNT is a bonus action, the blue B. The ' + MP.tauntN(L) + ' nearest that fail their save have to come at me, not at Goose. Use it when they\'re going for my friends.';
    c = yield* T.act([T.tell('Click me and my ring comes up.'), T.pause(60)].concat(T.openRing(), [T.tell('My specials live under SKILLS.')], T.pick('skills', 50), [T.tell(tauntWhy), T.toBtn('mp-taunt'), T.read(tauntWhy), T.click()]));
    if (!c) return; yield* T.exec(c);
    var taunted = [g1, g2, hob].filter(function (w) { return w.conds.taunted; });
    yield* T.say(n === 1 ? 'At this level that\'s my one special for the whole fight. A short rest brings it back.' : 'That\'s one of my ' + n + ' specials this fight. A short rest brings them back.');
    // MONKEY FISTS: ATTACK on the ring, then the goblin in front of him
    var punch = 'My action\'s still here, the yellow A. ATTACK on the ring, then click who to punch. Monkey Fists: no special needed. Most turns, that\'s the job.';
    var mark = function () { return MP.inReach(B, me).filter(function (w) { return w !== hob; })[0] || MP.inReach(B, me)[0] || g2; };
    var mk = mark();
    c = yield* T.act([T.tell(punch), T.read(punch)].concat(T.openRing(), T.pick('attack', 30), [T.aiming(), T.toUnit(mk), T.pause(24), T.click()]));
    if (!c) return; yield* T.exec(c);
    // END TURN on the bar
    c = yield* T.act([T.tell('Nothing left I want? END TURN, bottom right. Then it\'s their go.'), T.read('Nothing left I want? END TURN, bottom right.'), T.toEnd(), T.pause(24), T.click()]);
    if (!c && B.gs.skip) return;
    T.end();
    // their turns: the goblins (a taunted one may go only at him)
    yield* T.foeTurn(g1, { soft: true }); yield* T.foeTurn(g2, { soft: true });
    yield* T.say(taunted.length ? 'See? Taunted, they had to come at me. That\'s the job: they hit the denim, not my friends.' : 'They shook it off. It happens -- the dice are real out here. Next time, they won\'t.');
    // turn two: the special back (and his hit points, as the bed's rest would), DENIM DAMAGE on the big one
    MP.refill(me); me.hp = me.maxhp; me.conds = {}; delete me.proneLook; FX.sparkle(me, 'gold', 16); D.sfx('shine');
    yield* T.note('(The tutorial hands Denny his special back. In the run, a short rest at the bed between waves does that.)');
    T.begin();
    var denim = 'DENIM DAMAGE is my other special, and it takes my action: a punch, and the first one that lands hits extra hard. Save it for the big one.';
    var big = function () { return MP.inReach(B, me).indexOf(hob) >= 0 ? hob : MP.inReach(B, me)[0] || hob; };
    var bg = big();
    c = yield* T.act([T.tell(denim), T.read(denim)].concat(T.openRing(), T.pick('skills', 30), T.pick('mp-denim', 50), [T.aiming(), T.pause(20), T.toUnit(bg), T.pause(24), T.click()]));
    if (!c) return; yield* T.exec(c);
    T.end();
    yield* T.say('That\'s me. Stand in front. Taunt the ones going for my friends. Denim the big one. Punch the rest.');
  };
})();
