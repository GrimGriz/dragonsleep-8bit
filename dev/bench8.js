/* The 8-bit battle's bench (dev/, gitignored; 09-28g; dev/bench8.py builds the page). Synchronous: T.step replicates core.js's
   update; the battle's messages are instant (fastbattle.js). A plan answers each hero's menus by label, one queue a hero; guests
   run themselves. Writes BENCH8 {...} into the page for --dump-dom. */
(function () {
  var DS = window.DS, T = window.T, R = DS.R;
  var Q = new URLSearchParams(location.search), test = Q.get('test') || 'lymen';
  var out = { log: [], checks: [] };
  function finish() { var p = document.createElement('pre'); p.textContent = 'BENCH8 ' + JSON.stringify(out); document.body.appendChild(p); }
  DS.DATA = window.DS_DATA;
  try { DS.initCanvas(); } catch (e) { }
  ['sfx', 'play', 'stop'].forEach(function (k) { if (DS.audio) DS.audio[k] = function () { }; });
  // a scene's close resumes its script on a macrotask (core.js W8.scene); this page runs in one go, so the resumes queue here
  // and the driver runs them between steps, as the event loop would
  var pending = [];
  DS.W8.scene = function (sc) {
    return { start: function (script) { var self = this; sc.onClose = function (res) { self.finished = true; self.result = res; pending.push(function () { script.resume(self, res); }); }; DS.push(sc); } };
  };
  var step0 = T.step;
  T.step = function (n) { for (var i = 0; i < (n || 1); i++) { step0(1); while (pending.length) pending.shift()(); } };
  var cerr = console.error;
  console.error = function () { out.errors = (out.errors || []).concat([Array.prototype.map.call(arguments, function (a) { return a && a.stack ? a.stack : String(a); }).join(' ').slice(0, 600)]); cerr.apply(console, arguments); };

  // drive one battle: plans = { heroId: [labels...] } answered in order on that hero's turns; the rest FIGHT the first foe
  function drive(plans, cap) {
    var steps = 0;
    for (var w = 0; w < 200 && !DS.find('battle'); w++) T.step(1);
    while (steps < (cap || 6000) && DS.find('battle') && !DS.lastError) {
      var top = DS.top(), k = top && top.kind, b = DS.find('battle'), who = b && b.active && b.active.h ? b.active.h.id : null;
      var q = who && plans[who] || [];
      function want(labels) {
        if (!q.length) return -1;
        var a = String(q[0]).toUpperCase(), i = labels.findIndex(function (l, j) { return String(l).toUpperCase().indexOf(a) === 0; });
        if (i >= 0) { q.shift(); (T.blog = T.blog || []).push('  [' + who + ' picks ' + labels[i] + ']'); }
        return i;
      }
      if (k === 'menu') {
        var items = top.menu.items, i = want(items.map(function (it) { return it.disabled ? '\u0000' : it.label; }));
        if (i < 0) i = items.findIndex(function (it) { return it.label === 'FIGHT' && !it.disabled; });
        if (i < 0) i = items.findIndex(function (it) { return !it.disabled && it.label !== 'RUN'; });
        top.menu.i = Math.max(0, i); T.tapf('a');
      } else if (k === 'target') {
        var j = want(top.list.map(function (u) { return u.h ? u.h.name : u.name; }));
        if (j < 0 && q.length && !/^(MAGIC|FIGHT|SKILL|ITEM|RUN)$/i.test(q[0])) q.shift(); // (a name not here: the first will do)
        top.i = Math.max(0, j); T.tapf('a');
      } else if (k === 'dialog') { if (top.chars < top.pageLen()) top.chars = top.pageLen(); T.tapf('a'); }
      else T.step(1);
      steps++;
    }
    var b2 = DS.find('battle');
    out.result = b2 ? (b2.over || 'running') + ' after ' + steps + ' steps' : 'done (' + steps + ' steps)';
    if (b2 && !b2.over) { var sc = DS.scripts.map(function (s) { return s.done + ' wait=' + (s.wait ? JSON.stringify(Object.keys(s.wait)) + (s.wait.until ? String(s.wait.until).slice(0, 160) : '') + (s.wait.scene ? ' scene=' + s.wait.scene.kind : '') + (s.wait.n != null ? ' n=' + s.wait.n : '') : 'none'); });
      out.stuck = { top: DS.top() && DS.top().kind, active: b2.active && (b2.active.name || b2.active.h.name), msg: b2.msg, round: b2.round, scripts: sc, scenes: DS.scenes.map(function (s) { return s.kind; }) }; }
    out.err = DS.lastError && String(DS.lastError.stack || DS.lastError);
  }
  function snap() {
    out.party = DS.G.party.map(function (h) { return h.name + ' ' + h.hp + '/' + h.maxhp + (h.ko ? ' KO' : '') + ' slots ' + JSON.stringify(h.slots); }).join(' | ');
    out.guests = (DS.G.guests || []).map(function (x) { return x.h.name + ' (' + x.h.cls + ' ' + x.h.subclass + ') ' + x.h.hp + '/' + x.h.maxhp + ' slots ' + JSON.stringify(x.h.slots) + ' ch ' + x.h.feats.channel; }).join(' | ');
  }
  function check(what, ok) { out.checks.push((ok ? 'ok   ' : 'FAIL ') + what); }

  // ------------------------------------------------------------------ here-to-there (10-03; dev/walk8.py builds the leg and reads the result)
  // Griz, 10-03: "we need to run some here-to-there 8bit benches to see what sort of resources the parties are getting to the boss battles with".
  // One leg (?leg=<json>) walked n times: the story's state set by the game's own DS.situation (js/situations.js), the shortest walk to the door
  // found on the maps as the flags lay them, then stepped tile by tile through the game's own Field.arrive (the zone, the road's half rate, the
  // countdown, EV.encounter's roll), each fight fought to its end with every hero on the guest turn (Battle.guestTurn: the game's own AI) and the
  // reaction asks answered as a guest answers them. The state is carried; the party rests only at a rest spot the walk passes (a lamp, once, when
  // anything is spent: EV.longRest); a dark map gets the party's best light (EV.useFieldItem). Nothing in the game is changed: findings, not fixes
  function walkMode() {
    var WL = JSON.parse(Q.get('leg') || '{}'); if (!Array.isArray(WL)) WL = [WL]; // (a list is a chain: the legs walked one after another, the state carried door to door)
    var W = WL[0], n = +(Q.get('n') || 1), seed0 = +(Q.get('seed') || 1), BP = DS.Battle.prototype, EV = DS.EV;
    var ITEMS = ['potion', 'greaterpotion', 'kit', 'simples', 'draught', 'batpie', 'antitoxin', 'oil', 'torch', 'lantern', 'ledgerlamp', 'tent', 'diamond'];
    var REST_AT = [{ map: 'highway_1', rect: [61, 9, 1, 4], name: 'First Lamp' }, { map: 'highway_2', rect: [64, 10, 1, 3], name: 'Second Lamp' },
      { map: 'highway_3', rect: [60, 10, 1, 4], name: 'Third Lamp', cond: '!flag:wordBelow | flag:raidWon' }]; // (Third Lamp is no bed while the drow hold it: deep.js lampWarpable)
    var PASS = { lampArrive: 1, pyroRoad: 1, relief: 1, treasury: 1, dryStair: 1, pyroMeet: 1, ketilStop: 1 }; // step triggers that only talk: walked through (the bench runs none of them)
    var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    window.setTimeout = function (fn) { pending.push(fn); return 0; }; // (DS.battle resumes its script on a macrotask: the page runs in one go, so it waits in the queue T.step drains, as W8.scene's does above)
    BP.heroTurn = function* (u) { yield* this.guestTurn(u); }; // every hero on the game's own AI
    BP.askReact = function* (u, title) { // the reaction asks, answered as battle.js answers them for a guest
      var t = String(title), m;
      if (/^SHIELD\?/.test(t)) return true;
      if ((m = /^UNCANNY DODGE\? (\d+)/.exec(t))) return +m[1] >= 6;
      if (/^HELLISH REBUKE\?/.test(t)) return !this.o.roost;
      if ((m = /^COUNTERSPELL\? (.*)$/.exec(t))) { var lv = 0; for (var id in DS.DATA.spells) if (DS.DATA.spells[id].name === m[1]) lv = DS.DATA.spells[id].level; return lv >= 1; }
      return false;
    };
    function seed(s) { var a = s >>> 0; Math.random = function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    function inRect(r, x, y) { return x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3]; }
    function rectOf(t) { return t.rect || [t.x, t.y, 1, 1]; }
    function live(list) { return (list || []).filter(function (t) { return DS.cond(t.cond) && !(t.once && DS.G.flags['trig:' + t.id]); }); }
    function fresh() { // a new game at the leg's point of the story
      T.newGame(W.lead || 'barley'); DS.paused = true; DS.lastError = null;
      DS.situation(DS.G, Object.assign({}, W.sit || {}));
      DS.G.party.forEach(function (h) { if (h.pendingChoice === 'archetype') { var o = (DS.DATA.heroes[h.id].archetypes || [])[0]; h.subclass = o && o.name; } delete h.pendingChoice; });
      (W.give || []).forEach(function (it) { DS.G.give(it[0], it[1]); });
      return DS.G;
    }
    // step until the scripts and the scenes they opened are done: dialogs read, a battle fought by the AI (the turns need no thumb), the ending's lines
    function settle(cap) {
      var steps = 0, b = null;
      while (steps < (cap || 20000) && !DS.lastError) {
        var top = DS.top(), k = top && top.kind, bb = DS.find('battle'); if (bb) b = bb;
        if (k === 'gameover') break;
        if (!DS.scriptActive() && !bb && k !== 'dialog' && k !== 'menu' && k !== 'popup') break;
        if (k === 'dialog') { if (top.chars < top.pageLen()) { top.chars = top.pageLen(); T.step(1); } else if (top.auto) T.step(1); else { if (top.menu) top.menu.i = 0; T.tapf('a'); } }
        else if (k === 'menu' || k === 'popup') { var it = top.menu.items, i = it.findIndex(function (x) { return !x.disabled && x.label !== 'RUN'; }); top.menu.i = Math.max(0, i); T.tapf('a'); }
        else if (k === 'target') { top.i = 0; T.tapf('a'); }
        else if (k === 'check') { if (top.t > 60) T.tapf('a'); else T.step(4); }
        else T.step(1);
        steps++;
      }
      return { b: b, steps: steps };
    }
    // the shortest walk (0-1 BFS: a step costs 1; an edge exit or a door bumped costs nothing) over the maps as the flags lay them -- the game's own
    // tiles (DS.TILES pass), its warps and exits by their conditions, its chests and standing NPCs in the way; a live step trigger is a wall unless it
    // only talks (PASS) or is the door itself
    function findPath() {
      var F = DS.field, ids = Object.keys(DS.DATA.maps), M = {};
      ids.forEach(function (id) { F.load(id, 0, 0, 'down'); var m = F.map, blk = {};
        (m.src.npcs || []).forEach(function (d) { if (DS.cond(d.cond) && !(d.hire && DS.G.hired.indexOf(d.hire) >= 0) && d.solid !== false && !d.wander) blk[d.x + ',' + d.y] = 1; });
        (m.src.chests || []).forEach(function (c) { if (DS.cond(c.cond)) blk[c.x + ',' + c.y] = 1; });
        M[id] = { m: m, blk: blk, trig: live(m.src.triggers), warps: live(m.src.warps) };
      });
      var to = W.to, T0 = M[to.map], goal;
      if (to.trig) { var gt = T0.m.src.triggers.filter(function (t) { return t.id === to.trig; })[0], gr = rectOf(gt);
        goal = (gt.on || 'step') === 'step' ? function (mp, x, y) { return mp === to.map && inRect(gr, x, y); }
          : function (mp, x, y) { return mp === to.map && !inRect(gr, x, y) && [[0, 1], [0, -1], [1, 0], [-1, 0]].some(function (d) { return inRect(gr, x + d[0], y + d[1]); }); }; }
      else if (to.rect) goal = function (mp, x, y) { return mp === to.map && inRect(to.rect, x, y); };
      else goal = function (mp) { return mp === to.map; }; // (arriving on the map is the door: Torvald's, the inn's)
      var start = W.at || { map: W.from[0], x: W.from[1], y: W.from[2] }, key = function (p) { return p.map + ',' + p.x + ',' + p.y; };
      var dist = {}, prev = {}, dq = [start]; dist[key(start)] = 0;
      while (dq.length) {
        var p = dq.shift(), pk = key(p), Q0 = M[p.map], m = Q0.m;
        if (goal(p.map, p.x, p.y)) { var path = [], c = p; while (c) { path.unshift(c); c = prev[key(c)]; } return path; }
        Object.keys(DIRS).forEach(function (d) {
          var nx = p.x + DIRS[d][0], ny = p.y + DIRS[d][1], nxt = null, cost = 1;
          function push(q, c2) { var k2 = key(q); if (dist[k2] != null && dist[k2] <= dist[pk] + c2) return; dist[k2] = dist[pk] + c2; prev[k2] = p; if (c2) dq.push(q); else dq.unshift(q); }
          if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) { var edge = nx < 0 ? 'west' : nx >= m.w ? 'east' : ny < 0 ? 'north' : 'south', ex = (m.src.exits && m.src.exits[edge]) || m.src.exit;
            if (ex && M[ex.to]) push({ map: ex.to, x: ex.tx, y: ex.ty, dir: ex.dir || d, via: 'exit' }, 0); return; }
          var tl = m.at(nx, ny), door = Q0.trig.filter(function (t) { return t.on === 'use' && t.script === 'warp' && t.to && inRect(rectOf(t), nx, ny); })[0];
          if (door && M[door.to]) { push({ map: door.to, x: door.tx, y: door.ty, dir: d, via: 'door' }, 0); return; }
          if (!tl || !DS.TILES[tl] || !DS.TILES[tl].pass || Q0.blk[nx + ',' + ny]) return;
          var w = Q0.warps.filter(function (q) { return q.x === nx && q.y === ny; })[0];
          if (w && M[w.to]) { var at = (w.alt && w.alt[d]) || w; push({ map: w.to, x: at.tx, y: at.ty, dir: at.dir || w.dir || d, via: 'warp', sx: nx, sy: ny, from: p.map }, 1); return; }
          var st = Q0.trig.filter(function (t) { return (t.on || 'step') === 'step' && inRect(rectOf(t), nx, ny); })[0];
          if (st && !PASS[st.script] && !goal(p.map, nx, ny)) return;
          push({ map: p.map, x: nx, y: ny, dir: d, via: 'step' }, cost);
        });
      }
      return null;
    }
    function snapParty() {
      var g = DS.G, items = {};
      ITEMS.forEach(function (i) { var c = g.count(i); if (c) items[i] = c; });
      function one(h, guest, nm) { return { id: h.id, name: nm || h.name, cls: h.cls, guest: !!guest, lvl: h.lvl, hp: Math.max(0, h.hp), max: h.maxhp, ko: !!h.ko || h.hp <= 0, slots: (h.slots || []).slice(), slotsMax: (h.slotsMax || []).slice(), feats: JSON.parse(JSON.stringify(h.feats || {})) }; }
      var gs = g.guests || [], twice = function (x) { return gs.filter(function (y) { return y.h.name === x.h.name; }).length > 1; }; // (the four troopers: by their keys)
      return { heroes: g.party.map(function (h) { return one(h); }).concat(gs.map(function (x) { return one(x.h, true, twice(x) ? x.h.name + ' ' + x.id : null); })), items: items, silver: g.silver, light: g.flags.torchBy ? g.flags.torchKind : null };
    }
    function full() { return DS.G.party.concat((DS.G.guests || []).map(function (x) { return x.h; })).every(function (h) { return !h.ko && h.hp >= h.maxhp && (h.slots || []).every(function (s, i) { return s >= (h.slotsMax || [])[i]; }); }); }
    var CAST = /( casts [^.!:(]+| speaks a word to | Cure Wounds| calls up a spiritual weapon| raises a shield of force| COUNTERSPELL| in hellfire| PRESERVE LIFE| TURN UNDEAD| second wind| surges!| Lay on Hands)/;
    function walkOnce(paths, s) {
      seed(s); W = WL[0]; var g = fresh(), F = DS.field, legs = [];
      for (var li = 0; li < paths.length; li++) {
        if (li) { W = WL[li]; var prevUnset = WL[li - 1].sit.unset || [], nowUnset = W.sit.unset || []; // (the next leg's story: its flags laid, the boss just passed counted done)
          Object.assign(g.flags, W.sit.flags || {}); prevUnset.forEach(function (k) { if (nowUnset.indexOf(k) < 0) g.flags[k] = 1; }); nowUnset.forEach(function (k) { delete g.flags[k]; }); }
        var run = walkLeg(paths[li], g, F, li === 0); legs.push(run);
        if (run.wiped || run.err) break;
      }
      return paths.length === 1 ? legs[0] : { legs: legs };
    }
    function walkLeg(path, g, F, first) {
      var run = { fights: [], steps: 0, rests: [], torches: 0, unlitMaps: {}, zones: {} };
      var p0 = path[0]; if (first) F.load(p0.map, p0.x, p0.y, 'down');
      run.start = snapParty();
      function light() {
        if (!EV.darkHere() || g.flags.torchBy || g.party.some(function (h) { return !h.ko && R.carriesLight(h); })) return;
        if (g.party.every(function (h) { return R.darkvision(h) > 0; })) return;
        var id = ['ledgerlamp', 'lantern', 'torch'].filter(function (i) { return g.count(i) > 0 && (R.hooded(i) || !F.map.src.roost); })[0], h = g.party.filter(function (x) { return !x.ko && R.freeHands(x); })[0]; // (under a roost only a hooded light: a bare flame there is the one law broken)
        if (!id || !h) { run.unlitMaps[F.map.id] = 1; return; }
        DS.run(function* () { yield* EV.useFieldItem(id, h); }); settle(400);
        if (id === 'torch' && g.flags.torchBy) run.torches++;
      }
      function rest(x, y) {
        REST_AT.forEach(function (r) {
          if (r.map !== F.map.id || !inRect(r.rect, x, y) || run.rests.indexOf(r.name) >= 0 || (r.cond && !DS.cond(r.cond)) || full()) return;
          EV.longRest(); run.rests.push(r.name); light(); // (the lamp's night: EV.rest's own long rest; the morning's prep and the fade are the player's)
        });
      }
      if (first) light();
      for (var i = 1; i < path.length; i++) {
        var p = path[i];
        if (p.via === 'exit' || p.via === 'door') { EV.torchOut(); F.load(p.map, p.x, p.y, p.dir); light(); continue; }
        if (p.via === 'warp') { g.dir = p.dir; g.steps++; run.steps++; EV.torchOut(); F.load(p.map, p.x, p.y, p.dir); light(); continue; } // (the step onto a warp is a step and rolls nothing: Field.arrive)
        g.dir = p.dir; g.x = p.x; g.y = p.y; F.px = p.x * 16; F.py = p.y * 16; run.steps++;
        var z = F.zoneAt(p.x, p.y), tl = F.map.at(p.x, p.y);
        if (z && DS.DATA.encounters[z]) { var zk = z + ((tl === 'road' || tl === 'bridge' || tl === 'dirtpath') && F.map.src.roadSafe !== false ? ' (road)' : ''); run.zones[zk] = (run.zones[zk] || 0) + 1; }
        if (F.triggerAt(p.x, p.y, 'step')) { g.steps++; rest(p.x, p.y); continue; } // (a talking trigger runs instead of the roll; the bench runs nothing)
        var before = snapParty(); T.blog = [];
        F.arrive(); // the game's own: the zone, the road's half rate, the countdown, the roll
        if (DS.scriptActive()) {
          var res = settle(40000), b = res.b, after = snapParty(), said = (T.blog || []).filter(function (l) { return CAST.test(l); });
          var lost = 0, spent = [];
          before.heroes.forEach(function (h0, j) { var h1 = after.heroes.filter(function (x) { return x.id === h0.id && x.guest === h0.guest; })[0]; if (!h1) return;
            lost += Math.max(0, h0.hp - h1.hp); h0.slots.forEach(function (sv, k) { for (var q = 0; q < sv - (h1.slots[k] || 0); q++) spent.push(h0.name + ' L' + (k + 1)); }); });
          run.fights.push({ at: F.map.id + ' ' + p.x + ',' + p.y, zone: z, step: run.steps, foes: b ? b.o.enemies : null, fled: !b, result: b ? (b.result || b.over) : 'no fight', rounds: b ? b.round : 0, lost: lost, spent: spent, said: said.slice(0, 12), ko: after.heroes.filter(function (h) { return h.ko; }).map(function (h) { return h.name; }), steps: res.steps });
          g.party.forEach(function (h) { if (h.pendingChoice === 'archetype') { var o = (DS.DATA.heroes[h.id].archetypes || [])[0]; h.subclass = o && o.name; } delete h.pendingChoice; });
          if (DS.lastError) { run.err = String(DS.lastError.stack || DS.lastError).slice(0, 400); break; }
          if (b && (b.result === 'lose' || b.over === 'lose') || (DS.top() && DS.top().kind === 'gameover')) { run.wiped = true; break; }
          if (DS.scriptActive() || DS.find('battle')) { run.err = 'a fight that would not end (' + res.steps + ' steps): ' + (b ? b.o.enemies.join(',') + ' round ' + b.round + ' over ' + b.over + ' "' + b.msg + '"' : '') + ' scenes ' + DS.scenes.map(function (s) { return s.kind; }).join('>') + ' scripts ' + DS.scripts.map(function (s) { return s.done + ' ' + (s.wait ? Object.keys(s.wait).join('/') + ' ' + String(s.wait.until || '').slice(0, 120) : ''); }).join(' ; '); break; }
          if (!g.flags.torchBy) light();
        }
        rest(p.x, p.y);
      }
      run.door = snapParty(); run.unlit = Object.keys(run.unlitMaps).length;
      return run;
    }
    var paths = [], prevEnd = null;
    for (var li = 0; li < WL.length; li++) { // each leg's walk on the maps as its own flags lay them; a chain's next leg from where the last one stood
      W = WL[li]; W.at = prevEnd; seed(seed0); fresh();
      var path = findPath();
      if (!path) { out.err = 'no walk from ' + (prevEnd ? JSON.stringify(prevEnd) : W.from.join(',')) + ' to ' + JSON.stringify(W.to); return; }
      var maps = []; path.forEach(function (p) { if (maps[maps.length - 1] !== p.map) maps.push(p.map); });
      (out.paths = out.paths || []).push({ leg: W.name, steps: path.filter(function (p) { return p.via === 'step' || p.via === 'warp'; }).length, maps: maps, end: path[path.length - 1] });
      paths.push(path); prevEnd = { map: path[path.length - 1].map, x: path[path.length - 1].x, y: path[path.length - 1].y };
    }
    out.path = out.paths[0];
    out.runs = [];
    for (var r = 0; r < n; r++) {
      DS.lastError = null;
      try { out.runs.push(walkOnce(paths, seed0 * 1000 + r)); } catch (e) { out.runs.push({ err: String(e.stack || e).slice(0, 600) }); }
    }
    T.blog = [];
  }

  if (test === 'walk') { try { walkMode(); } catch (e) { out.err = String(e.stack || e); } finish(); return; }
  try {
    SETUP(+(Q.get('lvl') || 5));
    DS.EV = DS.EV || {};
    var g = DS.G, ly = g.hero('lymen');
    if (test === 'lymen') {
      ly.prepared = ['command', 'brandingsmite', 'magicweapon', 'bless'];
      check('the oath at 5: ' + R.oathSpells(ly).join(','), R.oathSpells(ly).join() === 'protectionfromevilandgood,sanctuary,lesserrestoration');
      check('the pool at 5 has Command, Branding Smite, Magic Weapon', ['command', 'brandingsmite', 'magicweapon'].every(function (id) { return R.prepPool(ly).indexOf(id) >= 0; }));
      check('the battle list: ' + R.spellList(ly, 'battle').map(function (s) { return s.id; }).join(','), R.spellList(ly, 'battle').length === 7);
      T.startFight(Q.get('foes') ? Q.get('foes').split(',') : ['gnoll', 'gloryseeker', 'wisp']);
      drive({ lymen: ['MAGIC', 'Magic Weapon', 'Barley', 'FIGHT', 'MAGIC', 'Command', 'Gnoll', 'GROVEL', 'MAGIC', 'Protection', 'Lymen', 'MAGIC', 'Branding', 'FIGHT', 'MAGIC', 'Sanctuary', 'Aurdin', 'FIGHT'] });
    } else if (test === 'command') {
      // the word landing: the ogres' WIS saves made hopeless, one GROVEL and one DROP
      ly.prepared = ['command', 'bless'];
      T.startFight(['ogre', 'ogre']);
      for (var w0 = 0; w0 < 400 && !DS.find('battle'); w0++) T.step(1);
      DS.find('battle').foes.forEach(function (f) { f.m = Object.assign({}, f.m, { saves: Object.assign({}, f.m.saves, { wis: -30 }) }); });
      drive({ lymen: ['MAGIC', 'Command', 'Ogre', 'GROVEL', 'MAGIC', 'Command', 'Ogre', 'HALT'] });
    } else if (test === 'unholy') {
      // Turn the Unholy (RULED 09-30): Lymen's SKILL; the wisps' WIS made hopeless, so they cower
      T.startFight(['wisp', 'wisp', 'gnoll']);
      for (var w9 = 0; w9 < 400 && !DS.find('battle'); w9++) T.step(1);
      var b9 = DS.find('battle'), L9 = b9.heroes.filter(function (x) { return x.h.id === 'lymen'; })[0];
      check('his SKILL list: ' + b9.skillList(L9, {}).map(function (s) { return s.label + (s.disabled ? ' (grey)' : ''); }).join(', ') + '; CHANNEL DIVINITY opens ' + b9.channelList(L9).map(function (s) { return s.label + (s.disabled ? ' (grey)' : ''); }).join(', '), b9.skillList(L9, {}).some(function (s) { return s.value === 'channel' && !s.disabled; }) && b9.channelList(L9).some(function (s) { return s.value === 'unholy' && !s.disabled; }));
      b9.foes.forEach(function (f) { if (f.m.tags && f.m.tags[0] === 'undead') f.m = Object.assign({}, f.m, { saves: Object.assign({}, f.m.saves, { wis: -30 }) }); });
      drive({ lymen: ['SKILL', 'CHANNEL', 'TURN'] }, 3000);
      var said9 = (T.blog || []).concat(out.log).join(' | ');
      check('he turns the wisps: ' + /TURN THE UNHOLY/.test(said9) + ', they cower: ' + /cower/.test(said9), /TURN THE UNHOLY/.test(said9) && /cower/.test(said9));
    } else if (test === 'charmward') {
      // Lisbet's charm (RULED 09-30, hidden): the moan never frightens its wearer, and nothing is said of it
      g.hero('aurdin').equip.ring = 'charm';
      T.startFight(['ogre']);
      for (var w8 = 0; w8 < 400 && !DS.find('battle'); w8++) T.step(1);
      var b8 = DS.find('battle'), f8 = b8.foes[0];
      b8.save = (function (s0) { return function (u, ab, dc) { return u && u.h ? { success: false, roll: 1, total: 1 } : s0.apply(this, arguments); }; })(b8.save); // (every hero fails)
      var gen = b8.special(f8, { id: 'moan', dc: 30 }), st8; do { st8 = gen.next(); } while (!st8.done);
      var au8 = b8.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], ba8 = b8.heroes.filter(function (x) { return x.h.id === 'barley'; })[0];
      var said8 = (T.blog || []).concat(out.log).join(' | ');
      check('the moan: Aurdin in the charm frightened ' + !!au8.conds.frightened + ', Barley ' + !!ba8.conds.frightened + '; the charm named nowhere: ' + !/charm/i.test(said8.replace(/charmed/gi, '')), !au8.conds.frightened && !!ba8.conds.frightened && !/charm/i.test(said8.replace(/charmed/gi, '')));
    } else if (test === 'sheets1001c') {
      // the story sheets' spells in the 8-bit battle (RULED 10-01c, Griz: "work a simplified version into 8-bit battles please - laughter is single target (no 8-bit
      // easter egg)"): Mirror Image's three images, Hideous Laughter on one foe (a hyena, INT 2, unmoved), Grease's prone
      var auS = g.hero('aurdin');
      ['hideouslaughter', 'grease', 'mirrorimage'].forEach(function (sid) { if (auS.known.indexOf(sid) < 0) auS.known.push(sid); if (auS.prepared && auS.prepared.indexOf(sid) < 0) auS.prepared.push(sid); });
      var blS = R.spellList(auS, 'battle').map(function (s) { return s.id; });
      check('his battle list has the three: ' + ['hideouslaughter', 'grease', 'mirrorimage'].filter(function (sid) { return blS.indexOf(sid) >= 0; }).join(','), ['hideouslaughter', 'grease', 'mirrorimage'].every(function (sid) { return blS.indexOf(sid) >= 0; }));
      auS.maxhp = Math.max(auS.maxhp, 400); auS.hp = auS.maxhp; auS.ko = false; // (two clubs before his second turn dropped a 30-HP Aurdin and the last three checks went RED: the check was dice, 10-02 -- as the familiar test's, 09-30)
      T.startFight(['ogre', 'hyena']);
      for (var wS = 0; wS < 400 && !DS.find('battle'); wS++) T.step(1);
      var bS = DS.find('battle'), aS = bS.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], seenImages = 0;
      bS.foes.forEach(function (f) { f.m = Object.assign({}, f.m, { saves: Object.assign({}, f.m.saves, { wis: -30, dex: -30 }) }); f.hp = f.maxhp = 400; }); // (long enough for his four casts)
      var say0S = bS.say; bS.say = function (m) { if (aS.images > seenImages) seenImages = aS.images; return say0S.apply(this, arguments); };
      drive({ aurdin: ['MAGIC', 'Mirror', 'MAGIC', 'Hideous', 'Ogre', 'MAGIC', 'Hideous', 'Hyena', 'MAGIC', 'Grease', 'Ogre'] }, 5000);
      var saidS = (T.blog || []).concat(out.log).join(' | '), castS = (saidS.match(/Aurdin casts /g) || []).length;
      check('Aurdin stood for his four casts: ' + castS + ' cast, ' + (/Aurdin falls!/.test(saidS) ? 'he fell' : 'never fell'), castS === 4 && !/Aurdin falls!/.test(saidS)); // (when this goes RED, the three below are not the spells' fault)
      check('Mirror Image: three images on Aurdin (' + seenImages + ')', seenImages === 3);
      check('Hideous Laughter on the ogre: laughing ' + /is laughing!/.test(saidS) + ', its turn lost ' + /helpless with laughter/.test(saidS), /is laughing!/.test(saidS) && /helpless with laughter/.test(saidS));
      check('on the hyena (INT 2): unmoved ' + /not affected/.test(saidS), /not affected/.test(saidS));
      check('Grease: prone ' + /is prone!/.test(saidS), /is prone!/.test(saidS));
    } else if (test === 'srd1002') {
      // 10-02 (Griz: "yes please fix mirror image in 8 bit"; the conditions by the SRD, "yes"): the dice queued -- DS.d answers from a list, then as it
      // would -- so each blow is the one meant. Mirror Image on a hero: a foe's blow goes at a double on the d20 (6+ with three, 8+ with two, 11+ with one),
      // meets 10 + his DEX there, and a hit bursts it; a miss leaves it. The conditions: a laughing foe saves DEX on its own roll and the paralyzed fail it;
      // the laughing have the prone's advantage and disadvantage and no more; a close hit on the laughing is no critical, on the paralyzed it is
      var d0 = DS.d, roll0 = DS.roll, Qd = [], crits = [];
      DS.d = function (n) { return Qd.length ? Qd.shift() : d0(n); };
      DS.roll = function (e, o) { crits.push(!!(o && o.crit)); return roll0(e, o); };
      function runM(gen) { var s; do { s = gen.next(); } while (!s.done); return s.value; }
      try {
        T.startFight(['ogre', 'ogre']);
        for (var wM = 0; wM < 400 && !DS.find('battle'); wM++) T.step(1);
        var bM = DS.find('battle'), AM = bM.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], BM = bM.heroes.filter(function (x) { return x.h.id === 'barley'; })[0], OM = bM.foes[0], club = OM.m.attacks.club;
        bM.intro = 0; AM.h.maxhp = AM.h.hp = 400; AM.conds = {}; OM.conds = {};
        var iac = 10 + DS.mod(AM.h.abil.dex);
        function blow(q, what, want) { // the ogre's club at Aurdin with the dice q: want { images, hurt, said }
          var im0 = AM.images, hp0 = AM.h.hp; T.blog = []; Qd = q.slice(); runM(bM.foeAttack(OM, AM, club)); Qd = [];
          var said = (T.blog || []).join(' | '), hurt = AM.h.hp < hp0;
          check(what + ': images ' + im0 + ' -> ' + AM.images + ', hurt ' + hurt + ' -- "' + said + '"', AM.images === want.images && hurt === want.hurt && want.said.test(said));
        }
        AM.images = 3;
        blow([15, 15, 6], 'three up, the double\'s d20 a 6, the club 15+6 against its AC ' + iac, { images: 2, hurt: false, said: /an image of Aurdin\. It bursts! \(2 left\)/ });
        blow([15, 15, 7], 'two up, a 7 (it wants 8): the club is his', { images: 2, hurt: true, said: /clubs Aurdin for/ });
        blow([1, 1, 8], 'two up, an 8: at a double, and a 1 misses it', { images: 2, hurt: false, said: /an image of Aurdin\.\.\. miss/ });
        blow([15, 15, 8], 'two up, an 8 and a hit', { images: 1, hurt: false, said: /It bursts! \(1 left\)/ });
        blow([15, 15, 10], 'one up, a 10 (it wants 11): his', { images: 1, hurt: true, said: /clubs Aurdin for/ });
        blow([15, 15, 11], 'one up, an 11', { images: 0, hurt: false, said: /It bursts! \(the last of them\)/ });
        blow([15, 15], 'none left: no d20 for a double, the club is his', { images: 0, hurt: true, said: /clubs Aurdin for/ });
        // the conditions
        OM.m = Object.assign({}, OM.m, { saves: Object.assign({}, OM.m.saves, { dex: 30 }) });
        OM.conds = { laughing: { rounds: 5 }, prone: true }; var svL = bM.save(OM, 'dex', 20);
        OM.conds = { paralyzed: { rounds: 3 } }; var svP = bM.save(OM, 'dex', 20);
        OM.conds = { stunned: { rounds: 3 } }; var svS = bM.save(OM, 'dex', 20);
        check('DEX saves: laughing on its own roll (' + svL.success + '), paralyzed (' + svP.success + ') and stunned (' + svS.success + ') fail outright', svL.success && !svP.success && !svS.success);
        OM.conds = { laughing: { rounds: 5 }, prone: true }; var aLm = bM.advantage(BM, OM, true), aLr = bM.advantage(BM, OM, false);
        OM.conds = { stunned: { rounds: 3 } }; var aSm = bM.advantage(BM, OM, true), aSr = bM.advantage(BM, OM, false);
        check('advantage on the laughing: close ' + aLm + ', from afar ' + aLr + ' (the prone\'s); on the stunned ' + aSm + ', ' + aSr, aLm === 1 && aLr === -1 && aSm === 1 && aSr === 1);
        function swing(conds, what, wantCrit) { OM.conds = conds; OM.hp = OM.maxhp = 400; BM.h.ko = false; T.blog = []; crits = []; Qd = [12, 12]; runM(bM.heroAttack(BM, OM, { n: 1 })); Qd = []; var said = (T.blog || []).join(' | '); check(what + ': "' + said + '" (crit dice ' + crits[0] + ')', crits[0] === wantCrit && /hits/.test(said) && /Critical!/.test(said) === wantCrit); }
        swing({ laughing: { rounds: 5 }, prone: true }, 'Barley rolls 12 on the laughing ogre: a hit, no critical', false);
        swing({ stunned: { rounds: 3 } }, 'on the stunned: a hit, no critical', false);
        swing({ paralyzed: { rounds: 3 } }, 'on the paralyzed: a critical (SRD 5.1)', true);
      } finally { DS.d = d0; DS.roll = roll0; }
    } else if (test === 'fixes1003') {
      // the cheap SRD fixes (10-03, Griz: "4 yes" to "The cheap SRD fixes as one Sonnet or cloud batch?"; spells-two-books.md §2): castSpell run
      // straight, its pickers answered from a queue (a foe's or hero's name, a menu's label, null to cancel; nothing queued takes the first),
      // the dice counted. Each check failed before its fix (spell-fixes-notes.md)
      var roll0F = DS.roll, d0F = DS.d, scene0F = DS.W8.scene, rollsF = [], ansF = [], offeredF = [], QdF = [];
      DS.roll = function (e, o) { rollsF.push(e); return roll0F(e, o); };
      DS.d = function (n) { return QdF.length ? QdF.shift() : d0F(n); };
      function nmF(u) { return u.h ? u.h.name : u.name; }
      function answerF(sc) {
        var a = ansF.length ? ansF.shift() : undefined, up = function (x) { return String(x).toUpperCase(); };
        if (sc.kind === 'target') {
          offeredF.push(sc.list.map(nmF));
          if (a === null) return null; if (a && typeof a === 'object') return a;
          return a === undefined ? sc.list[0] : sc.list.filter(function (u) { return up(nmF(u)).indexOf(up(a)) === 0; })[0] || null;
        }
        if (sc.kind === 'menu') {
          var items = sc.menu.items; offeredF.push(items.map(function (it) { return it.label + (it.disabled ? ' (grey)' : ''); }));
          if (a === null) return null;
          var it = a === undefined ? items.filter(function (x) { return !x.disabled; })[0] : items.filter(function (x) { return !x.disabled && up(x.label).indexOf(up(a)) === 0; })[0];
          return it ? (it.value !== undefined ? it.value : it) : null;
        }
      }
      function runF(gen) { var s, v; DS.W8.scene = function (sc) { return { __sc: sc }; }; try { do { s = gen.next(v); v = s.value && s.value.__sc ? answerF(s.value.__sc) : undefined; } while (!s.done); } finally { DS.W8.scene = scene0F; } return s.value; }
      try {
        T.startFight(['ogre', 'ogre', 'ogre']);
        for (var wF = 0; wF < 400 && !DS.find('battle'); wF++) T.step(1);
        var bF = DS.find('battle'), heroF = function (id) { return bF.heroes.filter(function (x) { return x.h.id === id; })[0]; };
        var AF = heroF('aurdin'), stF = function () { return { actions: 1, bonus: 1, surged: false, sneakUsed: false }; };
        bF.intro = 0;
        function foesF(ids, hp) { // a fresh line of foes on the same field, each with hp to spare
          var n = {}; bF.foes = ids.map(function (id) { var m = DS.DATA.monsters[id]; n[id] = (n[id] || 0) + 1; var f = bF.makeFoe(m, m.name + ' ' + String.fromCharCode(64 + n[id])); if (hp) f.hp = f.maxhp = hp; return f; });
          bF.layoutFoes(); return bF.foes;
        }
        function savesF(f, o) { f.m = Object.assign({}, f.m, { saves: Object.assign({}, f.m.saves, o) }); }
        function castF(u, id, answers, slots) { ansF = (answers || []).slice(); offeredF = []; rollsF = []; T.blog = []; if (slots) { u.h.slots = slots.slice(); u.h.slotsMax = slots.slice(); } return runF(bF.castSpell(u, DS.DATA.spells[id], stF())); }
        function saidF() { return (T.blog || []).join(' | '); }

        // 1. one damage roll for an area (SRD 5.1, Damage Rolls: "If a spell or other effect deals damage to more than one target at the same time,
        // roll the damage once for all of them"): Fireball on three ogres, two failing and one saving; Ice Storm's two dice the same
        var o1 = foesF(['ogre', 'ogre', 'ogre'], 400); savesF(o1[0], { dex: -30 }); savesF(o1[1], { dex: -30 }); savesF(o1[2], { dex: 30 });
        castF(AF, 'fireball', [], [4, 3, 3]);
        var lost1 = o1.map(function (f) { return 400 - f.hp; }), n1 = rollsF.filter(function (e) { return e === '8d6'; }).length;
        check('1. Fireball on three ogres: 8d6 rolled ' + n1 + ' time(s); the two caught lose ' + lost1[0] + ' and ' + lost1[1] + ', the one who saved ' + lost1[2], n1 === 1 && lost1[0] === lost1[1] && lost1[2] === Math.floor(lost1[0] / 2));
        var o1b = foesF(['ogre', 'ogre', 'ogre'], 400); o1b.forEach(function (f) { savesF(f, { dex: -30 }); });
        castF(AF, 'icestorm', [], [4, 3, 3, 1]);
        var lost1b = o1b.map(function (f) { return 400 - f.hp; }), n1b = rollsF.filter(function (e) { return e === '2d8' || e === '4d6'; }).length;
        check('1. Ice Storm on three ogres: its 2d8 and 4d6 rolled ' + n1b + ' times in all; each loses ' + lost1b.join(', '), n1b === 2 && lost1b[0] === lost1b[1] && lost1b[1] === lost1b[2]);

        // 2. Mislead's double (SRD 5.1: "You become invisible at the same time that an illusory double of you appears where you are standing"): one image
        // stands, and an ogre's club goes at it on the d20 (11+ with one, Mirror Image's rule); the club 15 (at disadvantage: he is unseen) bursts it
        var o2 = foesF(['ogre'], 400); AF.conds = {}; AF.images = 0; AF.h.maxhp = AF.h.hp = 400;
        castF(AF, 'mislead', [], [4, 3, 3, 3, 1]);
        var inv2 = !!AF.conds.invisible, im2 = AF.images, hp2 = AF.h.hp;
        T.blog = []; QdF = [15, 15, 11]; runF(bF.foeAttack(o2[0], AF, o2[0].m.attacks.club)); QdF = [];
        check('2. Mislead: invisible ' + inv2 + ', a double up (' + im2 + '); the club goes at it -- "' + saidF() + '" -- and he is unhurt (' + (AF.h.hp === hp2) + ')', inv2 && im2 === 1 && AF.images === 0 && AF.h.hp === hp2 && /an image of Aurdin\. It bursts!/.test(saidF()));

        // 3. Lesser Restoration ends one thing (SRD 5.1: "end either one disease or one condition afflicting it"): Barley paralyzed, blinded and
        // poisoned, Lymen asked which and answering BLINDNESS -- the blindness ends, the other two stay; a paralysing poison alone is one ailment,
        // ended whole with no question asked
        var LF = heroF('lymen'), BF = heroF('barley');
        BF.conds = { paralyzed: { rounds: 3 }, blinded: { rounds: 3 }, poisoned: { rounds: 3 } };
        castF(LF, 'lesserrestoration', ['Barley', 'BLIND'], [4, 2]);
        var asked3 = (offeredF[1] || []).join(', ');
        check('3. Lesser Restoration on Barley, three ailments: asked "' + asked3 + '"; after BLINDNESS: ' + Object.keys(BF.conds).join(',') + ' -- "' + saidF() + '"', asked3 === 'PARALYSIS, BLINDNESS, POISON' && !BF.conds.blinded && !!BF.conds.paralyzed && !!BF.conds.poisoned);
        BF.conds = { poisoned: { rounds: 3 }, paralyzed: { linked: 'poisoned' } };
        castF(LF, 'lesserrestoration', ['Barley'], [4, 2]);
        check('3. the crawler\'s poison (paralyzed riding on poisoned): ' + offeredF.length + ' picker(s) (the friend only: no END WHICH), both gone (' + !Object.keys(BF.conds).length + ') -- "' + saidF() + '"', offeredF.length === 1 && !Object.keys(BF.conds).length);

        // 4. Sleep (SRD 5.1: "Undead and creatures immune to being charmed aren't affected"; the drow's Fey Ancestry: "magic can't put the drow to
        // sleep"): a drow, a drow spell-weaver, a spirit naga (charmed: immune, the SRD's block) and a goblin, each at 1 HP -- the goblin alone sleeps
        var o4 = foesF(['drow', 'spellweaver', 'naga', 'goblin']); o4.forEach(function (f) { f.hp = 1; f.conds = {}; });
        castF(AF, 'sleep', [], [4, 3, 3]);
        var slept4 = o4.filter(function (f) { return f.conds.asleep; }).map(nmF).join(', ');
        check('4. Sleep on a drow, a spell-weaver, a naga and a goblin at 1 HP: asleep "' + slept4 + '" -- "' + saidF() + '"', slept4 === 'Goblin A');

        // 5. Hideous Laughter, hurt (SRD 5.1: "each time it takes damage, the target can make another Wisdom saving throw. The target has advantage on
        // the saving throw if it's triggered by damage. On a success, the spell ends"): an ogre laughing (WIS DC 15), cut for 5 -- the save's d20s 2 and
        // 19, so only advantage carries it; then dice of 2 and 3, and the laughter holds
        var o5 = foesF(['ogre'], 400)[0], dc5 = 15;
        o5.conds = { laughing: { rounds: 10, save: { ab: 'wis', dc: dc5 } }, prone: true }; bF.pendingMsg = null;
        QdF = [2, 19]; bF.hurt(o5, 5, 'slashing', {}); QdF = [];
        var msg5 = bF.pendingMsg || '', ended5 = !o5.conds.laughing;
        o5.conds = { laughing: { rounds: 10, save: { ab: 'wis', dc: dc5 } }, prone: true };
        QdF = [2, 3]; bF.hurt(o5, 5, 'slashing', {}); QdF = []; bF.pendingMsg = null;
        check('5. Hideous Laughter on an ogre, hurt: the save with advantage (2 and 19) ends it (' + ended5 + ', "' + msg5 + '"), still prone (' + !!o5.conds.prone + '); a 2 and a 3 leave it laughing (' + !!o5.conds.laughing + ')', ended5 && /jolted out/.test(msg5) && !!o5.conds.laughing && !!o5.conds.prone);

        // 6. Sleet Storm (SRD 5.1: "When a creature enters the spell's area for the first time on a turn or starts its turn there, it must make a
        // Dexterity saving throw. On a failed save, it falls prone"): an ogre's turn in the sleet, its DEX hopeless -- it goes down, and its turn goes
        // on from the ice (the reading, spell-fixes-notes.md: the fall costs no action; the prone's own disadvantage, and it gets up at its next turn)
        var o6 = foesF(['ogre'], 400)[0]; savesF(o6, { dex: -30 });
        bF.heroes.forEach(function (x) { x.h.maxhp = x.h.hp = Math.max(x.h.hp, 400); x.h.ko = false; x.conds = {}; x.images = 0; });
        bF.cloud = { kind: 'sleet', rounds: 10, dc: 15, save: 'dex' }; T.blog = [];
        runF(bF.foeTurn(o6)); bF.cloud = null;
        check('6. an ogre\'s turn in the sleet: down (' + !!o6.conds.prone + ') and it still swings -- "' + saidF() + '"', !!o6.conds.prone && /goes down on the ice/.test(saidF()) && /Ogre A clubs/.test(saidF()));

        // 7. the darts and the rays, each its own target (SRD 5.1 Magic Missile: "Each dart hits a creature of your choice ... you can direct them to hit
        // one creature or several"; Scorching Ray: "You can hurl them at one target or several"): Aurdin's darts at A, B and C; then A, B and X (the
        // rest at B); his rays at A, C, C (every attack d20 a 15); a caster the battle runs weighs its own (the weakest till it should be down)
        var o7 = foesF(['goblin', 'goblin', 'goblin'], 400), lost7 = function () { return o7.map(function (f) { return 400 - f.hp; }); };
        castF(AF, 'magicmissile', ['Goblin A', 'Goblin B', 'Goblin C'], [4, 3, 3]);
        var l7a = lost7(), ask7 = offeredF.length;
        check('7. Magic Missile, a dart each at A, B, C: they lose ' + l7a.join(', ') + ' (' + ask7 + ' pickers) -- "' + saidF() + '"', l7a.every(function (x) { return x >= 2 && x <= 5; }) && ask7 === 3);
        o7 = foesF(['goblin', 'goblin', 'goblin'], 400);
        castF(AF, 'magicmissile', ['Goblin A', 'Goblin B', null], [4, 3, 3]);
        var l7b = lost7();
        check('7. darts at A, B, then X (the rest at B): they lose ' + l7b.join(', '), l7b[0] >= 2 && l7b[0] <= 5 && l7b[1] >= 4 && l7b[1] <= 10 && l7b[2] === 0);
        o7 = foesF(['goblin', 'goblin', 'goblin'], 400); var d20F = bF.d20; bF.d20 = function () { return 15; };
        try { castF(AF, 'scorchingray', ['Goblin A', 'Goblin C', 'Goblin C'], [4, 3, 3]); } finally { bF.d20 = d20F; }
        var hitA7 = (saidF().match(/Goblin A takes/g) || []).length, hitC7 = (saidF().match(/Goblin C takes/g) || []).length;
        check('7. Scorching Ray at A, C, C: A hit ' + hitA7 + ', C ' + hitC7 + ', B untouched (' + (o7[1].hp === 400) + ')', hitA7 === 1 && hitC7 === 2 && o7[1].hp === 400);
        o7 = foesF(['goblin', 'goblin', 'goblin'], 400); o7[1].hp = 3;
        var aim7 = bF.aimShots(AF, DS.DATA.spells.magicmissile, 3).map(nmF);
        check('7. the darts a caster the battle runs would send (B at 3 HP, A and C at 400): ' + aim7.join(', '), aim7[0] === 'Goblin B' && aim7[1] !== 'Goblin B');

        // 8. Bless from a higher slot (SRD 5.1: "When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature
        // (10-03, merged after claude/8bit-reactions: the buff slot is retired, so the blessed are read off conds.blessed and the caster's concentration is cleared between casts)
        // for each slot level above 1st"): Lymen with no 1st-level slot left blesses all four of the party in one cast; from a 1st, three (Barley goes
        // without); Ingrith's turn (the cleric's, run here on Lymen) the same by her slot
        foesF(['goblin', 'goblin'], 400);
        var blessed8 = function () { return bF.heroes.filter(function (x) { return x.conds.blessed; }).map(nmF); };
        bF.heroes.forEach(function (x) { delete x.conds.blessed; }); LF.conc = null;
        castF(LF, 'bless', [], [0, 2]);
        var b8a = blessed8();
        bF.heroes.forEach(function (x) { delete x.conds.blessed; }); LF.conc = null;
        castF(LF, 'bless', [], [4, 2]);
        var b8b = blessed8();
        check('8. Bless from a 2nd-level slot: ' + b8a.length + ' blessed (' + b8a.join(', ') + '); from a 1st: ' + b8b.length + ' (' + b8b.join(', ') + ')', b8a.length === 4 && b8b.length === 3 && b8b.indexOf('Barley') < 0);
        bF.heroes.forEach(function (x) { delete x.conds.blessed; }); LF.conc = null; if (LF.h.known.indexOf('bless') < 0) LF.h.known.push('bless');
        LF.h.slots = [0, 2]; var round8 = bF.round; bF.round = 1; T.blog = [];
        try { runF(bF.clericTurn(LF)); } finally { bF.round = round8; }
        check('8. the cleric\'s turn, a 2nd-level slot: ' + blessed8().length + ' blessed -- "' + saidF() + '"', blessed8().length === 4);

        // 9. Blindness/Deafness in the 8-bit (Griz, 10-03: "4 yes", the flag among the cheap fixes; SRD 5.1: "the target is either blinded or deafened
        // ... At the end of each of its turns, the target can make a Constitution saving throw. On a success, the spell ends"): in Aurdin's battle list
        // once he knows it; on an ogre with no CON to speak of, blinded with the save each turn; its club at disadvantage, his friends' blows at advantage
        if (AF.h.known.indexOf('blindnessdeafness') < 0) AF.h.known.push('blindnessdeafness'); if (AF.h.prepared && AF.h.prepared.indexOf('blindnessdeafness') < 0) AF.h.prepared.push('blindnessdeafness');
        var in9 = R.spellList(AF.h, 'battle').some(function (x) { return x.id === 'blindnessdeafness'; });
        var o9 = foesF(['ogre'], 400)[0]; savesF(o9, { con: -30 }); AF.conds = {};
        if (in9) castF(AF, 'blindnessdeafness', ['Ogre'], [4, 3, 3]);
        var c9 = o9.conds.blinded, adv9 = bF.advantage(o9, BF, true), adv9b = bF.advantage(BF, o9, true);
        check('9. Blindness/Deafness in his battle list (' + in9 + '); on the ogre: blinded ' + !!c9 + ', the CON save at its turn\'s end ' + !!(c9 && c9.save && c9.save.ab === 'con') + '; its club ' + adv9 + ', Barley\'s blow ' + adv9b + ' -- "' + saidF() + '"', in9 && !!c9 && !!c9.save && c9.save.ab === 'con' && adv9 === -1 && adv9b === 1);

        // 10-03 ruling (Griz, to "Sanctuary ends when the spiritual weapon strikes, in the 8-bit too?": "yes; dealing damage ends it"; SRD 5.1: "If the warded
        // creature makes an attack ... this spell ends"): Lymen warded, his floating weapon's swing at an ogre ends the ward -- a hit, and a miss as any swing does
        var o11 = foesF(['ogre'], 400)[0], d20F11 = bF.d20, ends11 = [];
        try {
          [15, 1].forEach(function (nat) { LF.conds = { sanctuary: { dc: 13, rounds: 10 }, spiritWeapon: { dice: '1d8', rounds: 10 } }; bF.pendingMsg = null; T.blog = []; bF.d20 = function () { return nat; }; runF(bF.spiritStrike(LF)); ends11.push(!LF.conds.sanctuary && /sanctuary ends/.test(saidF())); ends11.push(saidF()); });
        } finally { bF.d20 = d20F11; LF.conds = {}; }
        check('the spiritual weapon\'s swing ends its caster\'s Sanctuary: on a hit ' + ends11[0] + ' -- "' + ends11[1] + '"; on a miss ' + ends11[2] + ' -- "' + ends11[3] + '"', ends11[0] && ends11[2]);
      } finally { DS.roll = roll0F; DS.d = d0F; DS.W8.scene = scene0F; }
      // the fight itself (what it shows goes in spell-fixes-notes.md): Aurdin casts it on the first ogre from the menus, and the battle runs on
      if (Q.get('fight9')) {
        var b9x = DS.find('battle'); if (b9x) { b9x.over = 'win'; drive({}, 2000); }
        var au9 = g.hero('aurdin'); au9.hp = au9.maxhp = 400; au9.slots = [4, 3, 3];
        T.startFight(['ogre', 'ogre']);
        drive({ aurdin: ['MAGIC', 'Blindness', 'Ogre A', 'FIGHT', 'FIGHT', 'FIGHT', 'FIGHT', 'FIGHT', 'FIGHT', 'FIGHT', 'FIGHT'] }, 6000);
      }
    } else if (test === 'reactions1003') {
      // 10-03 (RULED, Griz: "they should still get their reactions"; "1 yes, 2 yes" -- the reaction window and concentration, the one-buff slot
      // retired): manual stepping with the dice queued (DS.d answers from a list, then as it would; a foe's d20 is two draws, the pair for
      // advantage). The reaction menus are stubbed to YES (askReact); a target scene to a queue (pickAlly). Shield turns a hit that would
      // land and stops Magic Missile; a reaction is spent once a round and back at the hero's turn; Bless and Shield of Faith stand on one hero
      // at once, from two casters; a caster's second concentration spell ends the first; a hit on a concentrating caster rolls the CON save, DC 10
      // or half the damage, and a failed one ends the spell everywhere it lay; Hellish Rebuke lands on the one who hit; Counterspell stops a
      // foe's spell of the slot's level and checks against a higher one; Hask parries one melee hit that would land; Uncanny Dodge is spent
      var d0 = DS.d, Qd = [], asked = [], askedAll = [];
      DS.d = function (n) { return Qd.length ? Qd.shift() : d0(n); };
      function runM(gen) { var s; do { s = gen.next(); } while (!s.done); return s.value; }
      function said() { return (T.blog || []).join(' | '); }
      // a wizard prepares: his day at 5th (R.prepDefault) has no Shield in it, so the bench prepares it, and adds the two he does not know as the sections come
      function learn(h, id) { if (h.known.indexOf(id) < 0) h.known.push(id); if (h.prepared && h.prepared.indexOf(id) < 0) h.prepared.push(id); }
      try {
        DS.EV.addGuest('ingrith');
        var AR = g.hero('aurdin');
        check("Aurdin's default day holds Shield (R.prepDefault; RULED 10-03, Griz: \"yes\"): " + AR.prepared.join(','), AR.prepared.indexOf('shield') >= 0);
        T.startFight(['ogre', 'ogre']);
        for (var wM = 0; wM < 400 && !DS.find('battle'); wM++) T.step(1);
        var bR = DS.find('battle'), U = {};
        bR.heroes.forEach(function (x) { U[x.h.id] = x; });
        var A = U.aurdin, B = U.barley, V = U.vivian, L = U.lymen, ING = U.ingrith, OG = bR.foes[0], club = OG.m.attacks.club;
        bR.intro = 0; bR.heroes.forEach(function (x) { x.h.maxhp = x.h.hp = 400; x.conds = {}; }); OG.conds = {}; OG.hp = OG.maxhp = 400;
        bR.askReact = function* (u, title, items) { var a = title + ' [' + items.map(function (it) { return it.label + (it.right ? ' <' + it.right + '>' : ''); }).join(' / ') + ']'; asked.push(a); askedAll.push(a); return true; };
        var pickQ = []; bR.pickAlly = function* () { return pickQ.shift() || null; };
        check('Aurdin has Shield prepared (from L' + bR.reactSpell(A, 'shield') + '), not Counterspell or Hellish Rebuke yet, and no reaction spell is on his MAGIC list: ' + R.spellList(A.h, 'battle').filter(function (s) { return !s.reaction; }).map(function (s) { return s.id; }).join(','),
          bR.reactSpell(A, 'shield') === 1 && bR.reactSpell(A, 'counterspell') === 0 && bR.reactSpell(A, 'hellishrebuke') === 0 && R.spellList(A.h, 'battle').some(function (s) { return s.id === 'shield'; }) && !R.spellList(A.h, 'battle').filter(function (s) { return !s.reaction; }).some(function (s) { return s.reaction; }));
        function blow(t, q, what, want) { // the ogre's club at t with the dice q: want { hurt, said, and any of: slots1, reaction, shielded }
          var hp0 = t.h.hp, s10 = t.h.slots[0]; T.blog = []; asked = []; Qd = q.slice(); runM(bR.foeAttack(OG, t, club)); Qd = [];
          var hurt = hp0 - t.h.hp, ok = (want.hurt == null ? true : want.hurt === (hurt > 0)) && want.said.test(said()) && (want.slots1 == null || t.h.slots[0] === s10 - want.slots1) && (want.reaction == null || t.reaction === want.reaction) && (want.shielded == null || !!t.conds.shielded === want.shielded) && (want.dmg == null || hurt === want.dmg);
          check(what + ': hurt ' + hurt + ', slots ' + JSON.stringify(t.h.slots) + ', reaction ' + t.reaction + ' -- "' + said() + '"' + (asked.length ? ' [asked: ' + asked.join('; ') + ']' : ''), ok);
          return hurt;
        }
        // --- Shield
        var acA = bR.acOf(A), natIn = acA + 2 - club.hit, natHi = Math.min(19, acA + 6 - club.hit);
        check('the ogre\'s club is +' + club.hit + ', Aurdin AC ' + acA + ': a ' + natIn + ' lands by 2 (Shield turns it), a ' + natHi + ' by 5 or more (nothing asks)', natIn >= 2 && natIn < natHi && natHi <= 19);
        blow(A, [natIn, natIn], 'Shield: a hit by 2, asked and cast from L1', { hurt: false, said: /raises a shield of force! \+5 AC till Aurdin's next turn.*the shield of force takes it\. \((\d+) vs AC (\d+)\)/, slots1: 1, reaction: 0, shielded: true });
        var darts = DS.DATA.monsters.spellweaver.specials.filter(function (sx) { return sx.spell === 'magicmissile'; })[0];
        check('the spell-weaver casts Magic Missile (RULED 10-03, Griz: "yes; the SRD\'s mage casts it"): ' + JSON.stringify(darts), !!darts && darts.kind === 'blast' && darts.targets === 1 && darts.dmg === '3d4+3' && !darts.save);
        var fake = Object.assign({}, darts, { targets: 'all' }); // (its darts at everyone, so the shielded one is among them)
        var hpA = A.h.hp, hpB = B.h.hp; T.blog = []; runM(bR.special(OG, fake));
        check('Magic Missile at everyone while the shield is up: Aurdin takes none (' + (hpA - A.h.hp) + '), Barley does (' + (hpB - B.h.hp) + ') -- "' + said() + '"', A.h.hp === hpA && B.h.hp < hpB && /Aurdin's shield of force turns the darts aside/.test(said()));
        delete A.conds.shielded;
        blow(A, [natIn, natIn], 'the reaction spent: the same hit, no shield offered, it lands', { hurt: true, said: /clubs Aurdin for/, slots1: 0, reaction: 0, shielded: false });
        var ht0 = bR.heroTurn; bR.heroTurn = function* () { }; T.blog = []; runM(bR.turn(A)); bR.heroTurn = ht0;
        check('his turn: the reaction is back (' + A.reaction + ')', A.reaction === 1);
        blow(A, [natIn, natIn], 'the next round: Shield again, a second slot', { hurt: false, said: /raises a shield of force/, slots1: 1, reaction: 0, shielded: true });
        delete A.conds.shielded; A.reaction = 1;
        blow(A, [natHi, natHi], 'a hit by 5 or more: no Shield asked, it lands', { hurt: true, said: /clubs Aurdin for/, slots1: 0, reaction: 1 });
        check('nothing asked for that blow', asked.length === 0);
        // --- Bless and Shield of Faith on one hero at once, from two casters; the d4 on a save; a second concentration spell ends the first
        var acB = bR.acOf(B); T.blog = [];
        pickQ = [B, A, V]; var okBl = runM(bR.castSpell(ING, DS.DATA.spells.bless, {}));
        pickQ = [B]; var okSf = runM(bR.castSpell(L, DS.DATA.spells.shieldoffaith, {}));
        check('Ingrith\'s Bless on Barley, Aurdin, Vivian and Lymen\'s Shield of Faith on Barley: both stand on him (blessed ' + !!B.conds.blessed + ', shield of faith ' + !!B.conds.shieldOfFaith + '), AC ' + acB + ' -> ' + bR.acOf(B) + '; Ingrith holds ' + (ING.conc && ING.conc.name) + ', Lymen ' + (L.conc && L.conc.name) + ' -- "' + said() + '"',
          okBl && okSf && !!B.conds.blessed && !!B.conds.shieldOfFaith && bR.acOf(B) === acB + 2 && ING.conc && ING.conc.id === 'bless' && L.conc && L.conc.id === 'shieldoffaith' && !L.conds.blessed);
        Qd = [10, 10, 3]; var svB = bR.save(B, 'wis', 99); Qd = [];
        try { bR.draw(DS.ctx); check('the battle draws with the conditions and the concentration tags on the panel', true); } catch (eD) { check('draw: ' + eD, false); }
        check('Barley\'s WIS save with the blessing: 10 + ' + bR.saveMod(B, 'wis') + ' + the d4 (3) = ' + svB.total, svB.total === 13 + bR.saveMod(B, 'wis'));
        T.blog = []; var okDf = runM(bR.castSpell(L, DS.DATA.spells.divinefavor, {}));
        check('Lymen casts Divine Favor: his Shield of Faith ends with a card, Barley keeps the blessing (blessed ' + !!B.conds.blessed + ', shield of faith ' + !!B.conds.shieldOfFaith + ', divine favor on Lymen ' + !!L.conds.divineFavor + '), AC back to ' + bR.acOf(B) + ' -- "' + said() + '"',
          okDf && /Lymen lets go of Shield of Faith \(a new spell\)/.test(said()) && /Barley's shield of faith fades/.test(said()) && !!B.conds.blessed && !B.conds.shieldOfFaith && !!L.conds.divineFavor && bR.acOf(B) === acB && L.conc.id === 'divinefavor');
        // --- a hit on a concentrating caster: the CON save, DC 10 or half the damage
        var acL = bR.acOf(L), natL = Math.min(19, acL + 6 - club.hit), conL = bR.saveMod(L, 'con');
        blow(L, [natL, natL, 8, 8, 20, 20], 'the club on Lymen for 20 (DC 10), the CON save a natural 20: he holds Divine Favor', { hurt: true, dmg: 20, said: /Lymen holds Divine Favor\. \(CON (\d+) vs DC 10\)/ });
        check('still concentrating (' + (L.conc && L.conc.name) + ')', L.conc && L.conc.id === 'divinefavor' && !!L.conds.divineFavor);
        blow(L, [natL, natL, 8, 8, 1, 1], 'the club again for 20, the CON save a natural 1 (' + (1 + conL) + ' vs DC 10): he loses it', { hurt: true, dmg: 20, said: /Lymen loses Divine Favor! \(CON (\d+) vs DC 10\) Lymen's divine favor fades/ });
        check('the spell gone (conc ' + !!L.conc + ', divine favor ' + !!L.conds.divineFavor + ')', !L.conc && !L.conds.divineFavor);
        blow(L, [natL, natL, 8, 8, 20, 20], 'a hit on one concentrating on nothing: no save rolled', { hurt: true, said: /^(?!.*CON).*clubs Lymen/ });
        // half the damage when that is higher: 2d8+4 with 8s is 20; make it 30 by a crit? no -- the ogre's club with the 'big' is not here; set the club's dice for one blow
        var club30 = Object.assign({}, club, { dmg: '30' }); A.conc = null;
        pickQ = [L]; runM(bR.castSpell(ING, DS.DATA.spells.shieldoffaith, {})); // Ingrith lets Bless go for Shield of Faith on Lymen (a new spell)
        check('Ingrith\'s Shield of Faith on Lymen ends her Bless: Barley no longer blessed (' + !!B.conds.blessed + '), Lymen +2 (' + bR.acOf(L) + ' vs ' + acL + ')', !B.conds.blessed && !A.conds.blessed && bR.acOf(L) === acL + 2 && ING.conc.id === 'shieldoffaith');
        var hpI = ING.h.hp; T.blog = []; Qd = [19, 19, 12, 12]; runM(bR.foeAttack(OG, ING, club30)); Qd = [];
        check('the club on Ingrith for 30: the save is DC 15 (half), a 12 + ' + bR.saveMod(ING, 'con') + ' -- "' + said() + '"', (hpI - ING.h.hp) === 30 && /\(CON (\d+) vs DC 15\)/.test(said()));
        // --- Hellish Rebuke: the one hit answers the one who hit, 2d10 fire, DEX save for half
        learn(A.h, 'hellishrebuke'); A.reaction = 1; delete A.conds.shielded; var hpO = OG.hp, dcA = R.spellDC(A.h);
        blow(A, [natHi, natHi, 4, 4, 1, 1, 10, 10], 'the club lands on Aurdin; Hellish Rebuke (L1, 2d10 = 20 fire; the ogre\'s DEX save a 1 vs DC ' + dcA + ')', { hurt: true, said: /Aurdin wreathes Ogre A in hellfire: 20 damage\./, slots1: 1, reaction: 0 });
        check('the ogre took the 20 (' + hpO + ' -> ' + OG.hp + '), the reaction asked: ' + asked.join('; '), OG.hp === hpO - 20 && /HELLISH REBUKE\? 2d10 fire \[REBUKE OGRE A/.test(asked.join(';')));
        A.reaction = 1; A.h.slots[0] = 0; hpO = OG.hp;
        blow(A, [natHi, natHi, 4, 4, 20, 20, 10, 10, 10], 'the L1 slots gone: the rebuke goes from L2 (3d10 = 30, the save a 20 vs DC ' + dcA + ': half)', { hurt: true, said: /in hellfire: 15 damage\. \(half: it saved\)/, reaction: 0 });
        check('30 halved to 15 (' + hpO + ' -> ' + OG.hp + '), the L2 slot spent (' + JSON.stringify(A.h.slots) + ')', OG.hp === hpO - 15 && A.h.slots[1] === A.h.slotsMax[1] - 1);
        // --- Counterspell: a special that is a spell on the sheet
        var lb = { id: 'lb', kind: 'blast', spell: 'lightningbolt', recharge: 5, text: 'draws the dark into a line of lightning!', save: 'dex', dc: 14, dmg: '8d6', type: 'lightning', half: true, targets: 3 };
        var ice = Object.assign({}, lb, { id: 'ice', spell: 'icestorm' });
        learn(A.h, 'counterspell'); A.reaction = 1; var s3 = A.h.slots[2], hpAll = bR.heroes.map(function (x) { return x.h.hp; }).join();
        T.blog = []; asked = []; runM(bR.special(OG, lb));
        check('a Lightning Bolt (3rd) against Aurdin\'s Counterspell from a 3rd slot: it fails outright, no one hurt (' + (bR.heroes.map(function (x) { return x.h.hp; }).join() === hpAll) + '), slot ' + s3 + ' -> ' + A.h.slots[2] + ' -- "' + said() + '" [asked: ' + asked.join('; ') + ']',
          /Ogre A begins to cast Lightning Bolt/.test(said()) && /Aurdin: COUNTERSPELL! The Lightning Bolt fails\./.test(said()) && bR.heroes.map(function (x) { return x.h.hp; }).join() === hpAll && A.h.slots[2] === s3 - 1 && A.reaction === 0 && /COUNTER \(NO CHECK\)/.test(asked.join(';')));
        A.reaction = 1; var intA = DS.mod(A.h.abil.int); hpAll = bR.heroes.map(function (x) { return x.h.hp; }).join();
        T.blog = []; asked = []; Qd = [1]; runM(bR.special(OG, ice)); Qd = [];
        check('an Ice Storm (4th) against a 3rd slot: the check, a 1 + ' + intA + ' vs DC 14, and it goes through -- "' + said() + '" [asked: ' + asked.join('; ') + ']',
          /COUNTERSPELL! It goes through\. \(/.test(said()) && bR.heroes.map(function (x) { return x.h.hp; }).join() !== hpAll && /COUNTER \(CHECK DC 14\)/.test(asked.join(';')));
        A.reaction = 1; A.h.slots[2] = 2; hpAll = bR.heroes.map(function (x) { return x.h.hp; }).join(); // (his two 3rd slots are spent: the day's again)
        T.blog = []; Qd = [20]; runM(bR.special(OG, ice)); Qd = [];
        check('again with a 20: the Ice Storm fails -- "' + said() + '"', /COUNTERSPELL! The Ice Storm fails\./.test(said()) && bR.heroes.map(function (x) { return x.h.hp; }).join() === hpAll);
        A.reaction = 0; hpAll = bR.heroes.map(function (x) { return x.h.hp; }).join(); T.blog = []; asked = []; runM(bR.special(OG, lb));
        check('his reaction spent: the bolt is cast unasked (' + asked.length + ' asked) -- "' + said().slice(0, 80) + '"', asked.length === 0 && !/COUNTERSPELL/.test(said()) && bR.heroes.map(function (x) { return x.h.hp; }).join() !== hpAll);
        // --- Parry: Hask against one melee hit that would land, +2 AC, his reaction
        var HK = bR.makeFoe(DS.DATA.monsters.hask, 'Hask'); bR.foes.push(HK); bR.layoutFoes(); HK.hp = HK.maxhp = 400;
        var abB = R.attackBonus(B.h, R.weaponOf(B.h)), acH = bR.acOf(HK), natH = acH + 1 - abB;
        check('Hask has Parry ' + JSON.stringify(HK.m.reactions) + ', AC ' + acH + '; Barley swings at +' + abB + ' (' + natH + ' lands by 1)', HK.m.reactions && HK.m.reactions.parry === 2 && natH >= 2 && natH <= 19);
        function swingAt(q, what, want) { var hp0 = HK.hp; T.blog = []; Qd = q.slice(); runM(bR.heroAttack(B, HK, { n: 1 })); Qd = []; check(what + ': Hask ' + hp0 + ' -> ' + HK.hp + ', his reaction ' + HK.reaction + ' -- "' + said() + '"', want.said.test(said()) && (want.hurt === (HK.hp < hp0)) && HK.reaction === want.reaction); }
        swingAt([natH, natH], 'a hit by 1: Hask parries', { said: /Hask parries Barley's blow\. \((\d+) vs AC (\d+)\)/, hurt: false, reaction: 0 });
        swingAt([natH, natH], 'the same hit with his reaction spent: it lands', { said: /Barley .*Hask/, hurt: true, reaction: 0 });
        HK.reaction = 1; swingAt([natH + 2, natH + 2], 'a hit by 3: past the parry, it lands and his reaction is kept', { said: /Barley .*Hask/, hurt: true, reaction: 1 });
        HK.reaction = 1; var bowB = R.weaponOf(B.h); 
        // --- Uncanny Dodge: Vivian's reaction, asked, halves; spent, the next blow is whole
        var acV = bR.acOf(V), natV = Math.min(19, acV + 6 - club.hit); V.reaction = 1;
        blow(V, [natV, natV, 8, 8], 'the club on Vivian for 20: Uncanny Dodge asked, half', { dmg: 10, said: /clubs Vivian for 10\. \(uncanny dodge: half\)/, reaction: 0 });
        blow(V, [natV, natV, 8, 8], 'the reaction spent: the next 20 is whole', { dmg: 20, said: /clubs Vivian for 20\./, reaction: 0 });
        check('every ask was a menu with a way to decline: ' + askedAll.join('; '), askedAll.length >= 6 && askedAll.every(function (a) { return /LET IT LAND|LET IT GO|TAKE IT/.test(a); }) && /UNCANNY DODGE\? 20 damage \[DODGE IT <take 10> \/ TAKE IT\]/.test(askedAll.join(';')));
        // --- no reaction for the helpless, nor down
        A.reaction = 1; A.conds.paralyzed = { rounds: 2 }; delete A.conds.shielded;
        T.blog = []; asked = []; Qd = [natIn, natIn]; runM(bR.foeAttack(OG, A, club)); Qd = [];
        check('a paralyzed Aurdin is asked nothing (' + asked.length + ') -- "' + said().slice(0, 90) + '"', asked.length === 0); delete A.conds.paralyzed;
        // --- Hellish Rebuke under the roost (RULED 10-03, Griz: "offered; it is fire, and the roost's law is the player's choice with the consequence")
        A.conds = {}; A.reaction = 1; A.h.slots[0] = 2; bR.o.roost = true; var hpO2 = OG.hp, s1 = A.h.slots[0];
        T.blog = []; asked = []; Qd = [natHi, natHi, 4, 4]; runM(bR.foeAttack(OG, A, club)); Qd = [];
        check('under the roost the rebuke is offered with ROOST on it; taken, the slot goes (' + s1 + ' -> ' + A.h.slots[0] + '), no fire lands (ogre ' + hpO2 + ' -> ' + OG.hp + ') and the roof wakes: usedFire ' + bR.usedFire + ', cause ' + bR.roostCause + ', over ' + bR.over + ' -- "' + said() + '" [asked: ' + asked.join('; ') + ']',
          A.h.slots[0] === s1 - 1 && A.reaction === 0 && OG.hp === hpO2 && bR.usedFire === true && bR.roostCause === 'fire' && bR.over === 'roost' && /Aurdin's hellfire catches, under the roost\./.test(said()) && /\[REBUKE OGRE A <ROOST> \/ LET IT GO\]/.test(asked.join(';')));
        bR.o.roost = false; bR.over = null; bR.usedFire = false;
      } finally { DS.d = d0; }
    } else if (test === 'ingrith') {
      DS.EV.addGuest('ingrith');
      var ing = g.guests[0].h;
      check('Ingrith is a ' + ing.cls + ' of the ' + ing.subclass + ', ' + ing.hp + ' HP, slots ' + JSON.stringify(ing.slots) + ', channel ' + ing.feats.channel, ing.cls === 'cleric' && ing.maxhp === 31 && ing.slots.join() === '4,3' && ing.feats.channel === 1);
      check('her battle list: ' + R.spellList(ing, 'battle').map(function (s) { return s.id; }).join(','), R.spellList(ing, 'battle').some(function (s) { return s.id === 'healingword'; }));
      // the party hurt, one down, so the heals have work
      g.party[0].hp = 4; g.party[2].hp = 0; g.party[2].ko = true; g.party[1].hp = 5;
      T.startFight(Q.get('foes') ? Q.get('foes').split(',') : ['wisp', 'wisp', 'gnoll']);
      drive({});
    } else if (test === 'familiar') {
      // Find Familiar (09-29): in the book and castable in the field; the shoulder's help (his own first attack, else the first ally's
      // after his turn); a blast on him takes it
      var au = g.hero('aurdin');
      check('in Aurdin\'s book: ' + (au.known.indexOf('findfamiliar') >= 0) + ', castable in the field: ' + R.spellList(au, 'field').some(function (s) { return s.id === 'findfamiliar'; }), au.known.indexOf('findfamiliar') >= 0 && R.spellList(au, 'field').some(function (s) { return s.id === 'findfamiliar'; }));
      check('the forms on grass: ' + R.famForms('.', 'world').join(',') + '; on snow: ' + R.famForms('o', 'world').join(',') + '; in a cave map: ' + R.famForms(null, 'cave').join(','), R.famForms('o', 'world')[0] === 'snowyowl');
      check('Mama sells Calling Herbs at ' + (DS.DATA.shops.lucia.prices || {}).callingherbs + ' sp', DS.DATA.shops.lucia.items.indexOf('callingherbs') >= 0 && DS.DATA.shops.lucia.prices.callingherbs === 50); // (50 sp: RULED 10-01c)
      g.flags.familiar = { kind: 'owl', by: 'aurdin', hp: 1 };
      T.startFight(['ogre', 'ogre']);
      for (var w1 = 0; w1 < 400 && !DS.find('battle'); w1++) T.step(1);
      var bt = DS.find('battle'), A = bt.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], Bb = bt.heroes.filter(function (x) { return x.h.id === 'barley'; })[0], fo = bt.foes[0];
      var live = { famTurn: bt.famTurn, famAttacked: bt.famAttacked, famPending: bt.famPending }; // (the intro is instant, so the first turn is already open here: when Aurdin won initiative, js/familiar.js had set famTurn on him and the probes below wiped it, so his real turn could never dart -- 1 run in 8 went RED on his initiative, 10-02; they put it back as they found it)
      bt.famTurn = A; bt.famAttacked = false;
      check('his own first attack helped, the second not: ' + bt.famHelps(A, fo) + ', ' + bt.famHelps(A, fo), bt.famAttacked && !bt.famHelps(A, fo));
      bt.famTurn = null; bt.famPending = true;
      var foeFirst = bt.famHelps(fo, A), adv1 = bt.advantage(Bb, fo, true), adv2 = bt.advantage(Bb, fo, true);
      check('a foe does not take it (' + foeFirst + '); the first ally after him has advantage (' + adv1 + '), the next swing not (' + adv2 + ')', !foeFirst && adv1 === 1 && adv2 === 0);
      var gsp = bt.famSplash(A, 7), gs; do { gs = gsp.next(); } while (!gs.done);
      check('a blast on him takes it: familiar ' + JSON.stringify(g.flags.familiar) + ', gone ' + g.flags.familiarGone, !g.flags.familiar && g.flags.familiarGone === 'owl');
      // a real round: Aurdin casts Burning Hands (a save, no attack roll), so the owl darts out for the next ally
      g.flags.familiar = { kind: 'owl', by: 'aurdin', hp: 1 }; delete g.flags.familiarGone; Object.assign(bt, live);
      bt.foes.forEach(function (f) { f.hp = f.maxhp = 200; }); // (no round can drop both before his turn, so the fight is never over before he casts)
      au.prepared = (au.prepared || []).concat(['sleep']).filter(function (id, i, a) { return a.indexOf(id) === i; });
      au.maxhp = Math.max(au.maxhp, 400); au.hp = au.maxhp; au.ko = false; // (the ogres going first must not drop him before his turn: the check was dice, 09-30)
      drive({ aurdin: ['MAGIC', 'Burning'] }, 2500);
      var said = (T.blog || []).concat(out.log).join(' | ');
      check('Aurdin cast Burning Hands and stood: cast ' + /Aurdin casts Burning Hands!/.test(said) + ', ' + (/Aurdin falls!/.test(said) ? 'he fell' : 'never fell'), /Aurdin casts Burning Hands!/.test(said) && !/Aurdin falls!/.test(said)); // (when this goes RED, the dart below is not the owl's fault)
      check('the owl darted out after his turn (the log says so): ' + /darts out/.test(said), /darts out/.test(said));
    } else if (test === 'perks') {
      // The familiar's look and perks in the 8-bit (RULED 09-30, Griz): the help flight, the bat about his head, and the caster's
      // perks (rat/bat dark, snake senseHidden + charm DC + Persuasion, spider web, frog alarm). Add `shots=1` to get stills into out.shots.
      var au2 = g.hero('aurdin'), B8 = DS.Battle.prototype;
      function fam(kind, by) { g.flags.familiar = { kind: kind, by: by || 'aurdin', hp: R.FAMILIARS[kind].hp }; delete g.flags.familiarGone; }
      function runGen(gen) { var s; do { s = gen.next(); } while (!s.done); return s.value; }
      function persuade(skill, heroId) { // EV.check on screen: the scene's own record (adv, note, name), read as it lands
        var res = null, seen = null;
        DS.run(function* () { res = yield* DS.EV.check(skill, skill === 'Persuasion' ? 'cha' : 'wis', 10, heroId ? { hero: g.hero(heroId) } : {}); });
        for (var i = 0; i < 600 && res === null; i++) { var tp = DS.top(); if (tp && tp.kind === 'check') seen = tp.o; T.step(1); }
        return seen;
      }
      // 1. whose perk it is
      fam('rat');
      check('famPerk: the rat lends Aurdin darkvision (' + DS.famPerk('aurdin', 'darkvision') + '), not Barley (' + DS.famPerk('barley', 'darkvision') + '), no sonar (' + DS.famPerk('aurdin', 'sonar') + ')', DS.famPerk('aurdin', 'darkvision') === 30 && DS.famPerk('barley', 'darkvision') === null && DS.famPerk('aurdin', 'sonar') === null);
      fam('rat', 'nobody');
      check('famPerk: a familiar of one not in the party gives nothing (' + DS.famPerk('nobody', 'darkvision') + ')', DS.famPerk('nobody', 'darkvision') === null);
      delete g.flags.familiar;
      check('famPerk: none with no familiar (' + DS.famPerk('aurdin', 'darkvision') + ')', DS.famPerk('aurdin', 'darkvision') === null);
      // 2. Persuasion (EV.check): the snake's caster has advantage; another hand, another skill, another familiar do not
      fam('snake');
      var pa = persuade('Persuasion', 'aurdin'), pbar = persuade('Persuasion', 'barley'), pper = persuade('Perception', 'aurdin'), pnamed = persuade('Persuasion');
      fam('owl'); var pow = persuade('Persuasion', 'aurdin');
      check('Persuasion: the snake gives its caster advantage (' + (pa && pa.adv) + ', note ' + (pa && pa.note) + '); Barley (' + (pbar && pbar.adv) + '), Perception (' + (pper && pper.adv) + ') and an owl (' + (pow && pow.adv) + ') do not',
        !!pa && pa.adv === true && !!pa.note && !!pbar && !pbar.adv && !pbar.note && !!pper && !pper.adv && !!pow && !pow.adv);
      out.log.push('the unnamed Persuasion check with the snake was rolled by ' + (pnamed && pnamed.name) + ' (adv ' + (pnamed && pnamed.adv) + ')');
      out.log.push('the check window is 160 wide; the note "The snake lends its charm." is ' + DS.textWidth('The snake lends its charm.') + ' px, the name line "Aurdin  (two dice, the higher)" ' + DS.textWidth('Aurdin  (two dice, the higher)'));

      // 3. a dark fight: the rat's and the bat's caster sees
      fam('rat');
      T.startFight(['ogre', 'ogre'], { dark: true });
      for (var w2 = 0; w2 < 400 && !DS.find('battle'); w2++) T.step(1);
      var pb = DS.find('battle'), PA = pb.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], PB = pb.heroes.filter(function (x) { return x.h.id === 'barley'; })[0], PF = pb.foes[0];
      var dk = ['rat', 'bat', 'owl', 'snake'].map(function (k) { fam(k); return k + ':' + pb.seesDark(PA); }).join(' ');
      fam('rat'); var ratBlind = pb.blindTo(PA); fam('owl'); var owlBlind = pb.blindTo(PA);
      check('the dark (dark ' + pb.dark + ', lit ' + pb.lit + '): Aurdin sees with ' + dk + '; Barley (' + pb.seesDark(PB) + ') does not; blind with the rat ' + ratBlind + ', with the owl ' + owlBlind,
        pb.dark && !pb.lit && dk === 'rat:true bat:true owl:false snake:false' && !pb.seesDark(PB) && !ratBlind && owlBlind);
      pb.lit = true; pb.intro = 0;

      // 4. the help flight, every form: out, a beat, home; under 40 frames; the help is still there for the roll, then taken
      var ctx2 = DS.ctx, shots = Q.get('shots') ? (out.shots = {}) : null;
      Object.keys(R.FAMILIARS).forEach(function (k) {
        fam(k); pb.famTurn = PA; pb.famAttacked = false; pb.famPending = false;
        var will0 = pb.famWill(PA), gen = pb.famFly(PA, PF), s = gen.next(), n = 0, start = null, mid = null, end = null, err = null;
        try {
          while (!s.done) {
            DS.frame++; pb.draw(ctx2);
            var fl = pb.famFlight; if (!fl || !fl.at) throw new Error('no flight drawn at frame ' + n);
            if (fl.n === 0) start = fl.at.slice();
            if (fl.n === 19) { mid = fl.at.slice(); if (shots && /^(owl|bat|rat|frog)$/.test(k)) shots[k] = DS.canvas.toDataURL('image/png'); }
            end = fl.at.slice(); n++; s = gen.next();
          }
        } catch (e) { err = String(e.stack || e).slice(0, 300); }
        var still = pb.famWill(PA), took = pb.advantage(PA, PF, true), gone = !pb.famWill(PA);
        var atTarget = !!mid && mid[0] >= PF.x - 4 && mid[0] <= PF.x + PF.art.w + 8 && mid[1] >= PF.y - 8 && mid[1] <= PF.y + PF.art.h + 4;
        var nearPerch = !!start && start[0] >= PA.x - 8 && start[0] <= PA.x + 24 && start[1] >= PA.y - 8 && start[1] <= PA.y + 26, slack = k === 'bat' ? 22 : 12, home = !!start && !!end && Math.abs(end[0] - start[0]) < slack && Math.abs(end[1] - start[1]) < slack; // (the bat's own loop moves on meanwhile)
        out.log.push('flight ' + k + ': ' + n + ' frames, from ' + JSON.stringify(start) + ' via ' + JSON.stringify(mid) + ' to ' + JSON.stringify(end) + ' (foe at ' + PF.x + ',' + PF.y + ' ' + PF.art.w + 'x' + PF.art.h + ')' + (err ? ' ERR ' + err : ''));
        check('the ' + k + ' flies: ' + n + ' frames, starts at the wizard ' + nearPerch + ', reaches the target ' + atTarget + ', comes home ' + home + '; the help waits (' + will0 + '/' + still + ') and is then taken (adv ' + took + ', gone ' + gone + ')',
          !err && n > 20 && n <= 40 && nearPerch && atTarget && home && will0 && still && took === 1 && gone && !pb.famFlight);
      });
      // the ally's flight: the first ally after his turn, not the wizard, not a foe
      fam('owl'); pb.famTurn = null; pb.famAttacked = false; pb.famPending = true;
      check('the ally case: Barley ' + pb.famWill(PB) + ', Aurdin ' + pb.famWill(PA) + ', a foe ' + pb.famWill(PF), pb.famWill(PB) && !pb.famWill(PA) && !pb.famWill(PF));
      pb.famPending = false;
      // the bat, whose help the 16-bit game withholds, still helps here
      fam('bat'); pb.famTurn = PA; pb.famAttacked = false;
      var batAdv = pb.advantage(PA, PF, true), batAgain = pb.advantage(PA, PF, true);
      check('the bat still helps his own first attack in the 8-bit (' + batAdv + ', then ' + batAgain + ')', batAdv === 1 && batAgain === 0);
      pb.famTurn = null;
      // 5. the bat about his head; the others where they were
      fam('bat'); var bx = [], by2 = [];
      for (var fr = 0; fr < 160; fr += 4) { DS.frame = fr; pb.draw(ctx2); bx.push(pb.famAt[0] - PA.x); by2.push(pb.famAt[1] - PA.y); }
      var bxr = [Math.min.apply(null, bx), Math.max.apply(null, bx)], byr = [Math.min.apply(null, by2), Math.max.apply(null, by2)];
      check('the bat flutters about his head: x ' + bxr + ', y ' + byr + ' from his corner', bxr[1] - bxr[0] >= 10 && byr[1] - byr[0] >= 4 && bxr[0] >= -8 && bxr[1] <= 20 && byr[0] >= -10 && byr[1] <= 8);
      if (shots) { DS.frame = 30; pb.draw(ctx2); shots.batperch = DS.canvas.toDataURL('image/png'); }
      fam('rat'); DS.frame = 3; pb.draw(ctx2); var r1 = pb.famAt.slice(); DS.frame = 40; pb.draw(ctx2);
      check('the rat stays at his heel (' + r1 + ' -> ' + pb.famAt + ')', r1[0] === pb.famAt[0] && r1[1] === pb.famAt[1]);
      // 6. the snake: the unseen and the invisible are plain to its caster (no ranges in the 8-bit: always); the charm and Web DCs
      pb.famTurn = null; pb.famPending = false; PF.conds.invisible = { rounds: 3 };
      fam('owl'); var invOwl = pb.advantage(PA, PF, false); fam('snake'); var invSnake = pb.advantage(PA, PF, false); var invBarley = pb.advantage(PB, PF, false);
      delete PF.conds.invisible; var m0 = PF.m; PF.m = Object.assign({}, m0, { traits: Object.assign({}, m0.traits, { unseen: true }) });
      fam('owl'); var unOwl = pb.advantage(PA, PF, false); fam('snake'); var unSnake = pb.advantage(PA, PF, false);
      PF.m = m0;
      check('senseHidden: an invisible foe is at disadvantage with an owl (' + invOwl + '), plain to the snake\'s caster (' + invSnake + '), not to Barley (' + invBarley + '); an unseen one too (' + unOwl + '/' + unSnake + ')', invOwl === -1 && invSnake === 0 && invBarley === -1 && unOwl === -1 && unSnake === 0);
      var web = DS.DATA.spells.web, hyp = DS.DATA.spells.hypnoticpattern;
      fam('snake'); var dSnake = [pb.famDC(PA, hyp), pb.famDC(PA, web), pb.famDC(PB, hyp)];
      fam('spider'); var dSpider = [pb.famDC(PA, hyp), pb.famDC(PA, web), pb.famDC(PB, web)];
      fam('owl'); var dOwl = [pb.famDC(PA, hyp), pb.famDC(PA, web)];
      check('DCs: the snake +1 to a charm only (' + dSnake + '), the spider +1 to Web only (' + dSpider + '), an owl none (' + dOwl + ')', dSnake.join() === '1,0,0' && dSpider.join() === '0,1,0' && dOwl.join() === '0,0');
      // 7. the spider: a foe's web does not hold its caster (a hopeless DC 40 for the rest)
      pb.pickHeroFor = function () { return PA; };
      fam('spider'); PA.conds = {}; runGen(pb.special(PF, { id: 'web', dc: 40 })); var spHeld = !!PA.conds.restrained;
      fam('owl'); PA.conds = {}; runGen(pb.special(PF, { id: 'web', dc: 40 })); var owHeld = !!PA.conds.restrained;
      check('webwalk: restrained by a DC 40 web with the spider ' + spHeld + ', with the owl ' + owHeld, !spHeld && owHeld);
      fam('frog'); check('alarm: the frog\'s caster ' + pb.famAlarm(PA) + ', Barley ' + pb.famAlarm(PB) + ', a foe ' + pb.famAlarm(PF), pb.famAlarm(PA) && !pb.famAlarm(PB) && !pb.famAlarm(PF));
      delete g.flags.familiar;
    } else if (test === 'perks2') {
      // (a second page for the fights that run on to their end) the spider's Web at DC+1 as cast, and the frog in a surprised first round
      var au3 = g.hero('aurdin'); au3.prepared = (au3.prepared || []).concat(['web']).filter(function (id, i, a) { return a.indexOf(id) === i; });
      g.flags.familiar = { kind: 'spider', by: 'aurdin', hp: 1 };
      T.startFight(['ogre', 'ogre']);
      for (var w3 = 0; w3 < 400 && !DS.find('battle'); w3++) T.step(1);
      var wb = DS.find('battle'), dcs = [], wsave = wb.save;
      wb.save = function (u, ab, dc, opt) { if (!u.h) dcs.push(ab + ' ' + dc); return wsave.apply(this, arguments); };
      drive({ aurdin: ['MAGIC', 'Web'] }, 300);
      var want = R.spellDC(au3) + 1;
      check('Aurdin\'s Web with the spider saves at DC ' + want + ' (the foes\' saves this fight: ' + dcs.join(', ') + ')', dcs.indexOf('dex ' + want) >= 0 && dcs.indexOf('dex ' + (want - 1)) < 0);
      // the frog: surprised party, only its caster acts in round one, and the croak plays
      var seen = {};
      ['frog', 'owl'].forEach(function (kind) {
        SETUP(+(Q.get('lvl') || 5));   // (a fresh game and party for each run)
        DS.G.flags.familiar = { kind: kind, by: 'aurdin', hp: 1 };
        // (the recorders go in before the fight starts: its first beats run inside T.startFight)
        var turns = [], croaks = 0, oturn = DS.Battle.prototype.turn, osfx = DS.audio.sfx;
        DS.Battle.prototype.turn = function* (u) { if (this.round === 1) turns.push(u.h ? u.h.id : 'foe'); yield* oturn.call(this, u); };
        DS.audio.sfx = function (n) { if (n === 'croak') croaks++; };
        T.startFight(['ogre'], { surprised: 'party' });
        drive({}, 200);
        DS.Battle.prototype.turn = oturn; DS.audio.sfx = osfx;
        seen[kind] = { turns: turns.join(','), croaks: croaks };
      });
      check('the surprised party, frog: round one ' + seen.frog.turns + ', croaks ' + seen.frog.croaks + '; with an owl: ' + seen.owl.turns + ', croaks ' + seen.owl.croaks,
        /aurdin/.test(seen.frog.turns) && !/barley|vivian|lymen/.test(seen.frog.turns) && seen.frog.croaks === 1 && !/aurdin|barley|vivian|lymen/.test(seen.owl.turns) && seen.owl.croaks === 0);
    } else if (test === 'ledgerlamp8') {
      // the Ledger-Lamp as a lantern, but better (RULED 09-30, Griz: "now should function like a lantern but better" -- "3 perfect"), the 8-bit half:
      // lit in the field (out of the pack, torchKind 'ledgerlamp', still the party's: g.has), put out at a rest, no need in the light; lit in a
      // dark battle from the ITEM list (a key item with a use), carried on or, with its bearer down, back in the pack; lit hood down under the roost
      function runScript(fn) {
        var done = false, said = []; DS.lastError = null; DS.run(fn, function () { done = true; });
        for (var i = 0; i < 800 && !done && !DS.lastError; i++) {
          var tp = DS.top(), k = tp && tp.kind;
          if (k === 'dialog') { var pg = tp.pages[tp.p]; if (pg) { var tx = DS.stripCodes(pg.lines.join(' ')); if (said[said.length - 1] !== tx) said.push(tx); } if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); }
          else T.step(1);
        }
        return said;
      }
      function runG(gen) { var s; do { s = gen.next(); } while (!s.done); return s.value; }
      var dark0 = DS.EV.darkHere, LAMP = DS.DATA.items.ledgerlamp;
      check('the record: a key item with a field and a battle use; hooded light ' + R.hooded('ledgerlamp') + ' (lantern ' + R.hooded('lantern') + ', torch ' + R.hooded('torch') + ', potion ' + R.hooded('potion') + ')', LAMP.kind === 'key' && LAMP.use.field && LAMP.use.battle && R.hooded('ledgerlamp') && R.hooded('lantern') && !R.hooded('torch') && !R.hooded('potion'));
      // 1. the field
      var au4 = g.hero('aurdin'); g.give('ledgerlamp', 1);
      check('the pack shows it under ITEMS (a key item that can be used in the field): x' + g.count('ledgerlamp'), g.count('ledgerlamp') === 1 && !!(LAMP.use && LAMP.use.field));
      DS.EV.darkHere = function () { return false; };
      var s0 = runScript(function* () { yield* DS.EV.useFieldItem('ledgerlamp', au4); });
      check('in the light (RULED 09-30c: lit anywhere, carried into the next fight): "' + s0.join(' ') + '"; carried by ' + g.flags.torchBy + ', the pack x' + g.count('ledgerlamp'), /ready for the dark/.test(s0.join(' ')) && g.flags.torchBy === 'aurdin' && g.count('ledgerlamp') === 0);
      DS.EV.torchOut(true); // (put away again, EQUIP's LIGHT: the dark case starts with it in the pack)
      DS.EV.darkHere = function () { return true; };
      var s1 = runScript(function* () { yield* DS.EV.useFieldItem('ledgerlamp', au4); });
      check('in the dark: "' + s1.join(' ') + '"; torchBy ' + g.flags.torchBy + ', torchKind ' + g.flags.torchKind + ', the pack x' + g.count('ledgerlamp') + ', his hand ' + au4.equip.torch, /Ledger-Lamp/.test(s1.join(' ')) && /Forty feet/.test(s1.join(' ')) && g.flags.torchBy === 'aurdin' && g.flags.torchKind === 'ledgerlamp' && g.count('ledgerlamp') === 0 && au4.equip.torch === 1);
      check('lit, it is still the party\'s (the highway light, the seals and the roper read g.has): ' + g.has('ledgerlamp'), g.has('ledgerlamp') === true);
      var s2 = runScript(function* () { yield* DS.EV.useFieldItem('ledgerlamp', g.hero('barley')); });
      check('a second light: "' + s2.join(' ') + '"', /light already|carries a light/.test(s2.join(' ')));
      DS.EV.torchOut(); // (another map: 09-30d, a hooded light stays lit; a rest puts it away, 09-30e -- EV.longRest's torchOut(true))
      check('another map leaves it lit (RULED 09-30d): torchBy ' + g.flags.torchBy + ', his hand ' + au4.equip.torch, g.flags.torchBy === 'aurdin' && au4.equip.torch === 1);
      DS.EV.torchOut(true); // (EQUIP's LIGHT: put away)
      check('put away (EQUIP LIGHT): the pack x' + g.count('ledgerlamp') + ', flags ' + JSON.stringify([g.flags.torchBy, g.flags.torchKind]) + ', his hand ' + au4.equip.torch + ', still had ' + g.has('ledgerlamp'), g.count('ledgerlamp') === 1 && !g.flags.torchBy && !g.flags.torchKind && !au4.equip.torch && g.has('ledgerlamp'));
      // 2. the lantern still behaves (its own id back in the pack, not the lamp's)
      g.give('lantern', 1); runScript(function* () { yield* DS.EV.useFieldItem('lantern', au4); });
      check('the lantern: torchKind ' + g.flags.torchKind + ', the lantern out of the pack x' + g.count('lantern') + ', the lamp still x' + g.count('ledgerlamp') + ', g.has lamp ' + g.has('ledgerlamp'), g.flags.torchKind === 'lantern' && g.count('lantern') === 0 && g.count('ledgerlamp') === 1);
      DS.EV.torchOut(true); check('the lantern back x' + g.count('lantern') + ', the lamp x' + g.count('ledgerlamp'), g.count('lantern') === 1 && g.count('ledgerlamp') === 1);
      // 3. a dark battle: the ITEM list, lit from it, carried on
      T.startFight(['ogre'], { dark: true });
      for (var w5 = 0; w5 < 400 && !DS.find('battle'); w5++) T.step(1);
      var b5 = DS.find('battle'), A5 = b5.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], it5 = b5.battleItems(A5).filter(function (x) { return x.value === 'ledgerlamp'; })[0];
      check('the battle ITEM list: ' + (it5 ? it5.label + ' ' + it5.right + (it5.disabled ? ' (grey)' : '') : 'missing') + '; dark ' + b5.dark + ', lit ' + b5.lit, !!it5 && !it5.disabled && it5.label === 'Ledger-Lamp' && b5.dark && !b5.lit);
      T.blog = []; b5.intro = 0; runG(b5.useItem(A5, 'ledgerlamp'));
      check('lit in the fight: torchBy ' + b5.torchBy + ', kind ' + b5.torchKind + ', lit ' + b5.lit + ', bright ' + b5.bright + ', the pack x' + g.count('ledgerlamp') + '; "' + (T.blog || []).join(' ') + '"', b5.torchBy === 'aurdin' && b5.torchKind === 'ledgerlamp' && b5.lit && b5.bright && g.count('ledgerlamp') === 0 && /lights the Ledger-Lamp\. Forty feet of the dark gives way/.test((T.blog || []).join(' ')));
      b5.foes.forEach(function (f) { f.hp = 0; f.dead = true; });
      drive({}, 1500);
      check('the fight over (' + out.result + '): carried on into the dark map, torchBy ' + g.flags.torchBy + ', torchKind ' + g.flags.torchKind + ', out of the pack x' + g.count('ledgerlamp') + ', still had ' + g.has('ledgerlamp'), g.flags.torchBy === 'aurdin' && g.flags.torchKind === 'ledgerlamp' && g.count('ledgerlamp') === 0 && g.has('ledgerlamp'));
      DS.EV.torchOut(true); check('put away (EQUIP LIGHT): the pack x' + g.count('ledgerlamp'), g.count('ledgerlamp') === 1);
      // 4. the bearer down when it ends: not lost (a lantern is, unless carried out; the lamp never is)
      SETUP(+(Q.get('lvl') || 5)); DS.EV.darkHere = function () { return true; }; g = DS.G; g.give('ledgerlamp', 1);
      T.startFight(['ogre'], { dark: true });
      for (var w6 = 0; w6 < 400 && !DS.find('battle'); w6++) T.step(1);
      var b6 = DS.find('battle'), A6 = b6.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0]; b6.intro = 0;
      runG(b6.useItem(A6, 'ledgerlamp'));
      A6.h.hp = 0; A6.h.ko = true; b6.foes.forEach(function (f) { f.hp = 0; f.dead = true; });
      drive({}, 1500);
      check('the bearer down when the fight ends: the pack x' + g.count('ledgerlamp') + ', torchBy ' + g.flags.torchBy, g.count('ledgerlamp') === 1 && !g.flags.torchBy);
      // 5. under the roost: lit hood down, no bright light, no fire (a torch stays grey)
      SETUP(+(Q.get('lvl') || 5)); DS.EV.darkHere = function () { return true; }; g = DS.G; g.give('ledgerlamp', 1);
      T.startFight(['ogre'], { dark: true, roost: true });
      for (var w7 = 0; w7 < 400 && !DS.find('battle'); w7++) T.step(1);
      var b7 = DS.find('battle'), A7 = b7.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], li7 = b7.battleItems(A7), lamp7 = li7.filter(function (x) { return x.value === 'ledgerlamp'; })[0], torch7 = li7.filter(function (x) { return x.value === 'torch'; })[0];
      check('the roost: the lamp ' + (lamp7 && (lamp7.disabled ? 'grey' : 'open')) + ', the torch ' + (torch7 && (torch7.disabled ? 'grey (' + torch7.right + ')' : 'open')), !!lamp7 && !lamp7.disabled && !!torch7 && torch7.disabled);
      T.blog = []; b7.intro = 0; runG(b7.useItem(A7, 'ledgerlamp'));
      check('lit hood down under the roost: "' + (T.blog || []).join(' ') + '"; bright ' + b7.bright + ', fire used ' + !!b7.usedFire + ', lit ' + b7.lit, /Ledger-Lamp, hood down/.test((T.blog || []).join(' ')) && !b7.bright && !b7.usedFire && b7.lit);
      DS.EV.darkHere = dark0;
    } else if (test === 'ledgerlamp8seam') {
      // the seam's 8-bit half (js/embed.js apply) for the Ledger-Lamp: DEEP16 is not run; its 'd16:done' report is dispatched on the page as the
      // iframe would send it (a MessageEvent whose source is the iframe's window), and the 8-bit battle's own ending runs on it. What the pack and
      // the field's flags hold afterward is what is checked: the lamp is never lost, never doubled
      function runScript2(fn) { var done = false; DS.lastError = null; DS.run(fn, function () { done = true; }); for (var i = 0; i < 800 && !done && !DS.lastError; i++) { var tp = DS.top(), k = tp && tp.kind; if (k === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); } else T.step(1); } }
      var dark1 = DS.EV.darkHere;
      function seam(name, o) { // o: dark, fieldLit (lit in the field first), pack (lamp in the pack at the start), report (the party entry for Aurdin), inv0, inv1, expect(g) -> [ok, what]
        SETUP(+(Q.get('lvl') || 5)); DS.EV.darkHere = function () { return !!o.dark; }; var gg = DS.G, aur = gg.hero('aurdin');
        if (o.pack) gg.give('ledgerlamp', 1);
        if (o.fieldLit) { DS.EV.darkHere = function () { return true; }; gg.give('ledgerlamp', 1); runScript2(function* () { yield* DS.EV.useFieldItem('ledgerlamp', aur); }); DS.EV.darkHere = function () { return !!o.dark; }; }
        T.startFight(['ogre'], { deep16: 'trolls', dark: !!o.dark, torch: gg.flags.torchBy || null });
        for (var i = 0; i < 400 && !document.getElementById('d16'); i++) T.step(1);
        var fr = document.getElementById('d16'); if (!fr) { check(name + ': the iframe never opened', false); return; }
        window.dispatchEvent(new MessageEvent('message', { source: fr.contentWindow, data: { type: 'd16:done', result: 'won', party: gg.party.map(function (h) { return { id: h.id, hp: h.hp, maxhp: h.maxhp, slots: h.slots, feats: h.feats, torch: h.id === 'aurdin' ? o.report : false }; }), foes: [{ id: 'ogre', kind: 'ogre', i8: 0, dead: true }], inv0: o.inv0 || {}, inv1: o.inv1 || {} } }));
        drive({}, 1500);
        var ran = +((/\((\d+) steps\)/.exec(out.result) || [])[1]) > 0; // (the 8-bit battle's own ending must have run on the report: a listener that threw would pass vacuously)
        var r = o.expect(gg) && ran; check(name + ': the 8-bit ending ran ' + ran + ', pack x' + gg.count('ledgerlamp') + ', torchBy ' + gg.flags.torchBy + ', torchKind ' + gg.flags.torchKind + ', his hand ' + gg.hero('aurdin').equip.torch + ', still had ' + gg.has('ledgerlamp') + (out.err ? ' ERR ' + String(out.err).slice(0, 200) : ''), r);
      }
      seam('walked in holding it, still lit in the dark', { dark: true, fieldLit: true, report: 'ledgerlamp', expect: function (gg) { return gg.count('ledgerlamp') === 0 && gg.flags.torchBy === 'aurdin' && gg.flags.torchKind === 'ledgerlamp' && gg.has('ledgerlamp'); } });
      seam('walked in holding it, put out on the grid (inv1 has it)', { dark: true, fieldLit: true, report: false, inv0: {}, inv1: { ledgerlamp: 1 }, expect: function (gg) { return gg.count('ledgerlamp') === 1 && !gg.flags.torchBy && !gg.hero('aurdin').equip.torch; } });
      seam('walked in holding it, set down and left (the seam counts the floor)', { dark: true, fieldLit: true, report: false, inv0: {}, inv1: { ledgerlamp: 1 }, expect: function (gg) { return gg.count('ledgerlamp') === 1 && !gg.flags.torchBy; } });
      seam('lit on the grid from the pack, still lit in the dark', { dark: true, pack: true, report: 'ledgerlamp', inv0: { ledgerlamp: 1 }, inv1: {}, expect: function (gg) { return gg.count('ledgerlamp') === 0 && gg.flags.torchBy === 'aurdin' && gg.flags.torchKind === 'ledgerlamp' && gg.has('ledgerlamp'); } });
      seam('lit on the grid from the pack, the place light enough (09-30d: still in the hand)', { dark: false, pack: true, report: 'ledgerlamp', inv0: { ledgerlamp: 1 }, inv1: {}, expect: function (gg) { return gg.count('ledgerlamp') === 0 && gg.flags.torchBy === 'aurdin' && gg.flags.torchKind === 'ledgerlamp'; } });
      seam('lit on the grid from the pack, put out again', { dark: true, pack: true, report: false, inv0: { ledgerlamp: 1 }, inv1: { ledgerlamp: 1 }, expect: function (gg) { return gg.count('ledgerlamp') === 1 && !gg.flags.torchBy; } });
      DS.EV.darkHere = dark1;
    } else if (test === 'migrate') {
      // an older save: Ingrith a fighter with a heals counter, hurt; DS.startFrom walks her on as the cleric she is
      DS.EV.addGuest('ingrith');
      var old = g.guests[0].h; old.cls = 'fighter'; old.maxhp = 36; old.hp = 18; old.healer = 3; old.feats = { heals: 1 };
      var data = JSON.parse(JSON.stringify(g)); DS.startFrom(data);
      var nh = DS.G.guests[0].h;
      check('migrated: ' + nh.cls + ' ' + nh.hp + '/' + nh.maxhp + ' slots ' + JSON.stringify(nh.slots), nh.cls === 'cleric' && nh.maxhp === 31 && nh.hp === 16 && !nh.healer);
    }
    snap();
    if (DS.find('battle')) { var bb = DS.find('battle'); out.foes = bb.foes.map(function (f) { return f.name + ' ' + f.hp + (f.dead ? ' dead' : '') + ' ' + JSON.stringify(f.conds); }).join(' | '); }
  } catch (e) { out.err = String(e.stack || e); }
  out.log = out.log.concat(T.blog || []);
  finish();
})();
