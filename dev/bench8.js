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
    // the player's hand (hand=1; Griz, 10-03, to the walker's first question: "a player's hand on the bench now, potions under half and area spells at groups"):
    // on one of the four's turns, through the battle's own menus -- a potion (the plain first) to whichever of the four stands lowest, when he is under half
    // (down counts: a potion wakes the downed in a fight, RULED 09-28); else, with GROUP or more foes up, the highest-levelled damaging area spell he has a slot
    // for (a cone, a line or all foes; the roost's fire and thunder left out), a cone or a line at the front foe; else the guest turn as before. The guests keep
    // their own turns. After a fight: a healer's kit on each of the four who is down, then the tent once when the four stand under half (his answer on leg four:
    // "the tent first, pitched once below half"), then one potion each for any of them still standing under half. GROUP is two since round three (the lean
    // sent back with the walker's second four, 10-03: "two; a pair of trolls is 168 regenerating HP, and a player fireballs that without thinking"; the kit: "yes,
    // as a player would")
    var HAND = !!+(Q.get('hand') || 0), GROUP = +(Q.get('group') || 2), TENT = Q.get('tent') == null ? HAND : !!+Q.get('tent'), PLAN = {}, heroTurn0 = BP.heroTurn;
    function areaSpell(b, h) {
      return R.spellList(h, 'battle').filter(function (sp) { return sp.level > 0 && sp.dmg && /^(cone|line|enemies)$/.test(sp.target) && !sp.reaction && !sp.bonus && R.lowestSlot(h, sp.level) && !(b.o.roost && (sp.el === 'fire' || sp.el === 'thunder')); })
        .sort(function (a, c) { return c.level - a.level || (c.target === 'enemies') - (a.target === 'enemies'); })[0];
    }
    function handPlan(b, u) {
      var four = b.heroes.filter(function (x) { return !x.guest; }), pot = ['potion', 'greaterpotion'].filter(function (i) { return DS.G.count(i) > 0; })[0];
      var low = four.filter(function (x) { return x.h.hp < x.h.maxhp / 2; }).sort(function (a, c) { return a.h.hp / a.h.maxhp - c.h.hp / c.h.maxhp; })[0];
      if (low && pot && b.battleItems(u).some(function (x) { return x.value === pot && !x.disabled; })) return ['ITEM', DS.DATA.items[pot].name, low.h.name];
      var foes = b.liveFoes(), sp = foes.length >= GROUP && areaSpell(b, u.h);
      if (sp) { var front = foes.slice().sort(function (a, c) { return (c.x + c.art.w) - (a.x + a.art.w); })[0]; return sp.target === 'enemies' ? ['MAGIC', sp.name] : ['MAGIC', sp.name, front.name]; }
      return null;
    }
    BP.heroTurn = function* (u) { // every hero on the game's own AI, the hand's two calls first when it is on
      var plan = HAND && !u.guest && handPlan(this, u);
      if (plan) { PLAN[u.h.id] = plan; yield* heroTurn0.call(this, u); delete PLAN[u.h.id]; return; }
      yield* this.guestTurn(u);
    };
    function want(q, labels) { // the plan's next label on this menu (by its start, as dev/bench8.js drive() answers), or -1
      if (!q || !q.length) return -1;
      var a = String(q[0]).toUpperCase(), i = labels.findIndex(function (l) { return l != null && String(l).toUpperCase().indexOf(a) === 0; });
      if (i >= 0) q.shift();
      return i;
    }
    BP.askReact = function* (u, title) { // the reaction asks, answered as battle.js answers them for a guest
      var t = String(title), m;
      if (/^SHIELD\?/.test(t)) return true;
      if ((m = /^UNCANNY DODGE\? (\d+)/.exec(t))) return +m[1] >= 6;
      if (/^HELLISH REBUKE\?/.test(t)) return !this.o.roost;
      if ((m = /^COUNTERSPELL\? (.*)$/.exec(t))) { var lv = 0; for (var id in DS.DATA.spells) if (DS.DATA.spells[id].name === m[1]) lv = DS.DATA.spells[id].level; return lv >= 1; }
      return false;
    };
    function seed(s) { DS.seedDice(s); } // (the dice's own stream since 10-06, js/core.js DS.rng: the particles' Math.random no longer moves a walk)
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
        else if (k === 'menu' || k === 'popup') {
          var it = top.menu.items, q = bb && bb.active && bb.active.h && PLAN[bb.active.h.id], i = want(q, it.map(function (x) { return x.disabled ? null : x.label; }));
          if (i < 0 && q && !it.some(function (x) { return x.label === 'FIGHT'; })) { q.length = 0; T.tapf('b'); } // (the plan lost on a sub-menu: back to the commands, and FIGHT there)
          else { if (i < 0) i = it.findIndex(function (x) { return !x.disabled && x.label !== 'RUN'; }); top.menu.i = Math.max(0, i); T.tapf('a'); }
        }
        else if (k === 'target') { var qt = bb && bb.active && bb.active.h && PLAN[bb.active.h.id], j = want(qt, top.list.map(function (x) { return x.h ? x.h.name : x.name; })); top.i = Math.max(0, j); T.tapf('a'); }
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
    var CAST = /( casts [^.!:(]+| speaks a word to | Cure Wounds| calls up a spiritual weapon| raises a shield of force| COUNTERSPELL| in hellfire| PRESERVE LIFE| TURN UNDEAD| second wind| surges!| Lay on Hands| uses Potion of Healing| uses Greater Potion)/;
    function walkOnce(paths, s) {
      seed(s); W = WL[0]; var g = fresh(), F = DS.field, legs = [];
      for (var li = 0; li < paths.length; li++) {
        if (li) { W = WL[li]; var prevUnset = WL[li - 1].sit.unset || [], nowUnset = W.sit.unset || []; // (the next leg's story: its flags laid, the boss just passed counted done)
          Object.assign(g.flags, W.sit.flags || {}); prevUnset.forEach(function (k) { if (nowUnset.indexOf(k) < 0) g.flags[k] = 1; }); nowUnset.forEach(function (k) { delete g.flags[k]; }); }
        var run = walkLeg(paths[li], g, F, li === 0, !!Q.get('log') && s % 1000 === 0); legs.push(run);
        if (run.wiped || run.err) break;
        if (W.restEnd) { EV.longRest(); run.rests.push(W.restEnd); } // (a sally's way home ends in the lamp's bed: the road menu's REST HERE, EV.longRest -- the door was tallied first)
      }
      return paths.length === 1 ? legs[0] : { legs: legs };
    }
    function walkLeg(path, g, F, first, logIt) {
      var run = { fights: [], steps: 0, rests: [], torches: 0, unlitMaps: {}, zones: {}, fieldPotions: 0 };
      function afterFight() { // the hand's field half: a kit on each of the downed, the tent once under half, then a potion each for the standing under half
        if (!HAND) return;
        g.party.forEach(function (h) { // (the game's own: up at 1 HP; the tent after it heals him too)
          if (!(h.ko || h.hp <= 0) || !g.count('kit')) return;
          DS.run(function* () { yield* EV.useFieldItem('kit', h); }); settle(400); run.kits = (run.kits || 0) + 1;
        });
        var up = g.party.filter(function (h) { return !h.ko && h.hp > 0; }), max = g.party.reduce(function (a, h) { return a + h.maxhp; }, 0), hp = up.reduce(function (a, h) { return a + h.hp; }, 0);
        if (TENT && run.tent == null && up.length && hp < max / 2 && g.count('tent')) {
          var t0 = g.count('tent'); DS.run(function* () { yield* EV.useFieldItem('tent', up[0]); }); settle(800);
          if (g.count('tent') < t0) run.tent = run.steps; // (the game's own: the standing heal half their most and take a short rest; refused where no tent goes)
        }
        g.party.forEach(function (h) {
          var pot = ['potion', 'greaterpotion'].filter(function (i) { return g.count(i) > 0; })[0];
          if (!pot || h.ko || h.hp <= 0 || h.hp >= h.maxhp / 2) return;
          DS.run(function* () { yield* EV.useFieldItem(pot, h); }); settle(400); run.fieldPotions++;
        });
      }
      var p0 = path[0]; if (first) F.load(p0.map, p0.x, p0.y, 'down');
      if (first) { // the countdown is somewhere in its run at any leg's start, not fresh: since 10-03 it carries across map loads (js/world.js Field.load, RULED: "a map
        // load is not a rest"), so a door is like a boss's door or a lamp's bed (the old `mid` legs) -- the remainder a walker finds at a random step: a run of
        // length L in the zone's rate, drawn as often as it is long, then 1..L of it
        var zs = F.map.src.zones || [], zm = F.zoneAt(p0.x, p0.y) || (zs[0] && zs[0].zone), E = zm && DS.DATA.encounters[zm], rt = (E && E.rate) || [18, 40], tot = 0, Lr = rt[0];
        for (var L = rt[0]; L <= rt[1]; L++) tot += L;
        for (var u = DS.rng() * tot, L2 = rt[0]; L2 <= rt[1]; L2++) { u -= L2; if (u < 0) { Lr = L2; break; } }
        F.encounterIn = 1 + DS.rint(Lr);
      }
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
      light(); // (a chain's next leg too: a night at a lamp put the light away)
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
          run.fights.push({ at: F.map.id + ' ' + p.x + ',' + p.y, zone: z, step: run.steps, foes: b ? b.o.enemies : null, fled: !b, result: b ? (b.result || b.over) : 'no fight', rounds: b ? b.round : 0, lost: lost, spent: spent, said: said.slice(0, 12), ko: after.heroes.filter(function (h) { return h.ko; }).map(function (h) { return h.name; }), steps: res.steps,
            log: logIt ? (T.blog || []).slice() : undefined }); // (log=1: the first walk's fights, line by line)
          g.party.forEach(function (h) { if (h.pendingChoice === 'archetype') { var o = (DS.DATA.heroes[h.id].archetypes || [])[0]; h.subclass = o && o.name; } delete h.pendingChoice; });
          if (DS.lastError) { run.err = String(DS.lastError.stack || DS.lastError).slice(0, 400); break; }
          if (b && (b.result === 'lose' || b.over === 'lose') || (DS.top() && DS.top().kind === 'gameover')) { run.wiped = true; break; }
          if (DS.scriptActive() || DS.find('battle')) { run.err = 'a fight that would not end (' + res.steps + ' steps): ' + (b ? b.o.enemies.join(',') + ' round ' + b.round + ' over ' + b.over + ' "' + b.msg + '"' : '') + ' scenes ' + DS.scenes.map(function (s) { return s.kind; }).join('>') + ' scripts ' + DS.scripts.map(function (s) { return s.done + ' ' + (s.wait ? Object.keys(s.wait).join('/') + ' ' + String(s.wait.until || '').slice(0, 120) : ''); }).join(' ; '); break; }
          afterFight();
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
      // the dice counted. Each check failed before its fix (cloud-notes/spell-fixes-notes.md)
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
        // on from the ice (the reading, cloud-notes/spell-fixes-notes.md: the fall costs no action; the prone's own disadvantage, and it gets up at its next turn)
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
      // the fight itself (what it shows goes in cloud-notes/spell-fixes-notes.md): Aurdin casts it on the first ogre from the menus, and the battle runs on
      if (Q.get('fight9')) {
        var b9x = DS.find('battle'); if (b9x) { b9x.over = 'win'; drive({}, 2000); }
        var au9 = g.hero('aurdin'); au9.hp = au9.maxhp = 400; au9.slots = [4, 3, 3];
        T.startFight(['ogre', 'ogre']);
        drive({ aurdin: ['MAGIC', 'Blindness', 'Ogre A', 'FIGHT', 'FIGHT', 'FIGHT', 'FIGHT', 'FIGHT', 'FIGHT', 'FIGHT', 'FIGHT'] }, 6000);
      }
    } else if (test === 'wet3') {
      // 10-03, Griz: "set me up with a level 3 party led by lymen, in silverton, with the gates down to the wet already opened type URL":
      // the situation ?at=wet3 (js/situations.js, base 'lvl3') set up as the lead select does (js/scenes.js LeadSelect), then read back
      DS.newGame('lymen'); DS.bindState(DS.G);
      var sW = DS.SITUATIONS && DS.SITUATIONS.wet3;
      check('wet3 is a situation on the lvl3 base', !!sW && sW.base === 'lvl3');
      if (sW) {
        DS.situation(DS.G, sW);
        var gW = DS.G, fW = gW.flags, openW = ['heardPete', 'heardWarrens', 'tallyMet', 'fiveKnown', 'skarnOk', 'skarnGateOpen'], doneW = ['otyughFed', 'landlordSpoke', 'fiveDone', 'skarnPaid', 'majors', 'markRead'];
        check('led by Lymen, the four at level 3: ' + gW.party.map(function (h) { return h.id + ' ' + h.lvl; }).join(', '), gW.lead === 'lymen' && gW.party.length === 4 && gW.party[0].id === 'lymen' && gW.party.every(function (h) { return h.lvl === 3; }));
        check('Fountain Street: ' + gW.map + ' ' + gW.x + ',' + gW.y, gW.map === 'silverton' && gW.x === 29 && gW.y === 8);
        check('the way down open: ' + openW.map(function (k) { return k + '=' + (fW[k] || 0); }).join(' '), openW.every(function (k) { return fW[k] === 1; }));
        check('nothing below done: ' + doneW.map(function (k) { return k + '=' + (fW[k] || 0); }).join(' '), doneW.every(function (k) { return !fW[k]; }));
        check('Winters\' errands run, renown ' + gW.renown + ', silver ' + gW.silver + ', a potion ' + gW.count('potion'), fW.wErrBDone === 1 && gW.renown === 1 && gW.silver > 0 && gW.count('potion') >= 1);
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
      // the Ledger-Lamp through a story fight (a `deep16` key on it) -- since 10-20 the 8-bit battle, with no frame (the first game lane: "8 bit solely 8-bit after this").
      // Until 10-20 this was the seam's 8-bit half (js/embed.js apply), the grid's 'd16:done' report dispatched on the page; the grid is gone from the 8-bit, and what the
      // pack and the field's flags hold after the 8-bit battle's own ending is what is checked: the lamp is never lost, never doubled, and no frame ever opens
      function runScript2(fn) { var done = false; DS.lastError = null; DS.run(fn, function () { done = true; }); for (var i = 0; i < 800 && !done && !DS.lastError; i++) { var tp = DS.top(), k = tp && tp.kind; if (k === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); } else T.step(1); } }
      var dark1 = DS.EV.darkHere;
      function story(name, o) { // o: dark, fieldLit (lit in the field first), pack (lamp in the pack at the start), expect(g)
        SETUP(+(Q.get('lvl') || 5)); DS.EV.darkHere = function () { return !!o.dark; }; var gg = DS.G, aur = gg.hero('aurdin');
        if (o.pack) gg.give('ledgerlamp', 1);
        if (o.fieldLit) { DS.EV.darkHere = function () { return true; }; gg.give('ledgerlamp', 1); runScript2(function* () { yield* DS.EV.useFieldItem('ledgerlamp', aur); }); DS.EV.darkHere = function () { return !!o.dark; }; }
        T.startFight(['ogre'], { deep16: 'trolls', dark: !!o.dark, torch: gg.flags.torchBy || null });
        var frame = false; for (var i = 0; i < 400 && !DS.find('battle'); i++) { T.step(1); if (document.getElementById('d16')) frame = true; }
        var b = DS.find('battle'); if (!b || frame) { check(name + ': the 8-bit battle took it (' + !!b + '), no frame (' + !frame + ')', false); return; }
        b.foes.forEach(function (f) { f.hp = 0; f.dead = true; });
        drive({}, 1500);
        var ran = +((/\((\d+) steps\)/.exec(out.result) || [])[1]) > 0; // (the 8-bit battle's own ending must have run)
        var r = o.expect(gg) && ran && !document.getElementById('d16'); check(name + ': the 8-bit ending ran ' + ran + ', no frame ' + !document.getElementById('d16') + ', pack x' + gg.count('ledgerlamp') + ', torchBy ' + gg.flags.torchBy + ', torchKind ' + gg.flags.torchKind + ', his hand ' + gg.hero('aurdin').equip.torch + ', still had ' + gg.has('ledgerlamp') + (out.err ? ' ERR ' + String(out.err).slice(0, 200) : ''), r);
      }
      story('walked in holding it, still lit in the dark', { dark: true, fieldLit: true, expect: function (gg) { return gg.count('ledgerlamp') === 0 && gg.flags.torchBy === 'aurdin' && gg.flags.torchKind === 'ledgerlamp' && gg.has('ledgerlamp'); } });
      story('walked in holding it, the place light enough (09-30d: still in the hand)', { dark: false, fieldLit: true, expect: function (gg) { return gg.count('ledgerlamp') === 0 && gg.flags.torchBy === 'aurdin' && gg.flags.torchKind === 'ledgerlamp'; } });
      story('in the pack, unlit: still in the pack, one', { dark: true, pack: true, expect: function (gg) { return gg.count('ledgerlamp') === 1 && !gg.flags.torchBy; } });
      DS.EV.darkHere = dark1;
    } else if (test === 'menus1003') {
      // a menu's title wraps inside its box (10-03, the reactions seat's find; Griz: "it's the little things"): the box askReact really asks for (DS.choose caught),
      // titled COUNTERSPELL? and each spell the 8-bit knows; every line inside the box, the box on the screen; a title that fits is one line at the old height
      var choose0 = DS.choose, caught = null, items2 = [{ label: 'COUNTER (CHECK DC 13)', value: true, right: 'L3' }, { label: 'LET IT GO', value: false }];
      DS.choose = function (o) { caught = o; return { start: function () { this.finished = true; } }; };
      function boxFor(title) { caught = null; DS.Battle.prototype.askReact.call({}, null, title, items2).next(); return caught && new DS.Menu(caught); }
      try {
        var worst = null, worstT = '', over = [];
        Object.keys(DS.DATA.spells).forEach(function (id) {
          var t = 'COUNTERSPELL? ' + DS.DATA.spells[id].name, m = boxFor(t), inner = m.w - m.pad * 2, wide = Math.max.apply(null, (m.titleLines || [m.title]).map(function (l) { return DS.textWidth(l); }));
          if (wide > inner || m.x + m.w > 256 || m.y + m.h > 240) over.push(id + ' ' + wide + '/' + inner);
          if (!worst || DS.textWidth(t) > DS.textWidth(worstT)) { worst = m; worstT = t; }
        });
        check('COUNTERSPELL? and every spell the 8-bit knows (' + Object.keys(DS.DATA.spells).length + ') sit inside the reaction box; the longest, "' + worstT + '" (' + DS.textWidth(worstT) + ' px for ' + (worst.w - worst.pad * 2) + '), as ' + JSON.stringify(worst.titleLines) + ', the box ' + worst.w + 'x' + worst.h + ' at ' + worst.x + ',' + worst.y + (over.length ? '; past it: ' + over.join(', ') : ''), !over.length && JSON.stringify(worst.titleLines) === '["COUNTERSPELL?","Protection from Evil and Good"]');
        var sh = boxFor('SHIELD? 18 hits AC 15');
        check('a title that fits is one line at the old height: ' + JSON.stringify(sh.titleLines) + ', h ' + sh.h + ' (2 rows of 11, pad 7: ' + (2 * 11 + 7 * 2 - 2 + 12) + ')', sh.titleLines && sh.titleLines.length === 1 && sh.h === 2 * 11 + 7 * 2 - 2 + 12);
        var cv8 = document.createElement('canvas'); cv8.width = 256; cv8.height = 240; var drew8 = true, c8 = cv8.getContext('2d');
        try { c8.fillStyle = '#101018'; c8.fillRect(0, 0, 256, 240); sh.y = 30; sh.draw(c8); worst.draw(c8); } catch (eW) { drew8 = String(eW); }
        check('the two-line box draws: ' + drew8, drew8 === true);
        if (Q.get('shot')) out.shot = cv8.toDataURL('image/png'); // (shot=1: the two boxes as a picture, for an eye)
      } finally { DS.choose = choose0; }
    } else if (test === 'menu1006') {
      // the one menu (js/menu.js; RULED 10-06, Griz: "ideal = identical menus"): every entry opens and draws; the cursor kicked into the
      // panel picks a target with no second ask; STATUS's two old bugs (Sneak Attack twice, the note's lines on one y) gone; the ITEMS tabs and
      // GEAR between them hold the whole pack; a ritual is not greyed for want of a slot; the worn places and the bonds (attunement)
      var MN = DS.MENU, cv = document.createElement('canvas'); cv.width = 256; cv.height = 240; var cx = cv.getContext('2d'), drawErr = [];
      function key(b) { return { pressed: function (x) { return x === b; }, repeat: function (x) { return x === b; } }; }
      function press(m, b, n) { for (var q = 0; q < (n || 1); q++) { m.update(key(b)); try { m.draw(cx); } catch (eD) { drawErr.push(String(eD.stack || eD).slice(0, 300)); } T.step(1); } }
      function open() { DS.clearScenes(); var fm = new DS.FieldMenu(); DS.push(fm); return fm.m; }
      function toCmd(m, v) { m.root.cmds.i = m.root.cmds.items.map(function (x) { return x.value; }).indexOf(v); }
      var choose0 = DS.choose, asked = [];
      DS.choose = function (o) { asked.push(o.title || ''); return choose0(o); };
      try {
        g = DS.G; DS.EV.addGuest('ingrith');
        ['ringresistfire', 'periaptpoison', 'bootselvenkind', 'ringofprotection', 'potion', 'sheet_grease', 'callingherbs'].forEach(function (id) { if (DS.DATA.items[id]) g.give(id, 1); });
        // 1. every entry opens and draws, and goes back
        var m = open(), opened = [];
        m.root.cmds.items.forEach(function (it) {
          if (it.disabled || it.value === 'save' || it.value === 'exit') return;
          toCmd(m, it.value); press(m, 'a');
          var where = m.root.mode === 'pick' ? 'pick' : (m.pages.length ? 'page' : 'none');
          if (m.root.mode === 'pick') press(m, 'a');
          opened.push(it.value + ':' + where + (m.pages.length ? '>' + m.pages.length : ''));
          for (var bk = 0; bk < 4 && (m.pages.length || m.root.mode === 'pick' || m.toast); bk++) press(m, 'b');
        });
        check('every entry opens and draws and backs out (' + opened.join(' ') + ')' + (drawErr.length ? ': ' + drawErr[0] : ''), !drawErr.length && opened.length >= 9 && !m.pages.length);
        // 2. STATUS: each hero's every page draws; Sneak Attack once, Expertise one line, the designer asides gone to CREDITS
        var viv = g.hero('vivian'), fl = MN.featureLines(viv), sa = fl.filter(function (f) { return /^Sneak Attack/.test(f.t); }).length, ex = fl.filter(function (f) { return /^Expertise/.test(f.t); }).length;
        g.party.concat(g.guests.map(function (x) { return x.h; })).forEach(function (h) { m = open(); toCmd(m, 'status'); press(m, 'a'); var rows = m.root.rows(true); m.root.pi = rows.indexOf(h); press(m, 'a'); var pg = m.pages[0]; for (var p = 0; pg && p < pg.pages.length; p++) press(m, 'right'); });
        check('STATUS draws every page of the four and the guest; Vivian\'s Sneak Attack ' + sa + ' line, Expertise ' + ex + ' (' + (fl.filter(function (f) { return /^Expertise/.test(f.t); })[0] || {}).t + ')' + (drawErr.length ? ': ' + drawErr[0] : ''), !drawErr.length && sa === 1 && (viv.lvl < 6 || ex === 1));
        var asides = ['aurdin', 'vivian', 'lymen'].filter(function (id) { return DS.DATA.heroes[id].credit && !DS.DATA.heroes[id].note; });
        m = open(); toCmd(m, 'credits'); press(m, 'a'); var cp = m.pages[0], made = cp && cp.lines.some(function (l) { return l.t === 'FROM THE MAKING'; });
        check('the designer asides on CREDITS, off STATUS (' + asides.join(', ') + '); Barley\'s lore stays on his: ' + JSON.stringify(DS.DATA.heroes.barley.note), asides.length === 3 && made && !!DS.DATA.heroes.barley.note);
        // 3. ITEMS' four tabs and GEAR's seven between them hold the whole pack, each row a name
        var inT = 0, inG = 0, kinds = {};
        g.inv.forEach(function (s) { var it = DS.DATA.items[s.id], t = MN.itemTab(it); if (t >= 0) inT++; else { inG++; kinds[it.kind] = 1; } });
        m = open(); toCmd(m, 'items'); press(m, 'a'); var ip = m.pages[0], seenI = 0; for (var ti = 0; ti < 4; ti++) { ip.tab = ti; ip.refresh(); seenI += ip.list.items.length; m.draw(cx); }
        // (GEAR's OFFHAND tab shows the pack's lights too since 10-15: ITEMS' things, not counted twice)
        press(m, 'b'); toCmd(m, 'gear'); press(m, 'a'); var gp = m.pages[0], seenG = 0; for (var tg = 0; tg < 7; tg++) { gp.tab = tg; gp.refresh(); seenG += gp.list.items.filter(function (x) { return /^x/.test(x.right) && !x.light; }).length; m.draw(cx); }
        check('ITEMS shows ' + seenI + ' of the pack\'s ' + inT + ' things to use, GEAR ' + seenG + ' of its ' + inG + ' to wear (' + Object.keys(kinds).join(', ') + ')', seenI === inT && seenG === inG);
        // 4. the cursor kicked into the panel: Lymen's Cure Wounds on a hurt Barley, asked once (the panel), not twice
        var ly = g.hero('lymen'), ba = g.hero('barley'); ba.hp = Math.max(1, ba.maxhp - 12); var hp0 = ba.hp; ly.slots = ly.slotsMax.slice();
        if (ly.prepared && ly.prepared.indexOf('curewounds') < 0) ly.prepared.push('curewounds'); // (his day holds it)
        m = open(); asked = []; toCmd(m, 'magic'); press(m, 'a'); var rowsM = m.root.rows(false); m.root.pi = rowsM.indexOf(ly); press(m, 'a');
        var mp = m.pages[0]; for (var lt = 0; lt < mp.levels.length && mp.levels[mp.tab] !== 1; lt++) press(m, 'right');
        mp.list.i = mp.list.items.map(function (x) { return x.id; }).indexOf('curewounds'); press(m, 'a');
        var kicked = m.root.mode === 'pick'; m.root.pi = rowsM.indexOf(ba); press(m, 'a');
        for (var w5 = 0; w5 < 300 && m.busy; w5++) { var tq = DS.top(); if (tq && tq.kind === 'dialog') { if (tq.chars < tq.pageLen()) tq.chars = tq.pageLen(); T.tapf('a'); } else T.step(1); }
        check('MAGIC: Lymen\'s Cure Wounds kicks the cursor to the panel (' + kicked + '), Barley ' + hp0 + ' -> ' + ba.hp + ', no ON WHOM? asked after (' + JSON.stringify(asked) + ')', kicked && ba.hp > hp0 && asked.indexOf('ON WHOM?') < 0);
        // 5. a ritual is not greyed for want of a slot (scenes.js:455 the old bug); a spell of a level is
        var au = g.hero('aurdin'), sl0 = au.slots.slice(); au.slots = au.slots.map(function () { return 0; });
        m = open(); toCmd(m, 'magic'); press(m, 'a'); m.root.pi = m.root.rows(false).indexOf(au); press(m, 'a'); mp = m.pages[0];
        var rit = null, lev = null; for (var lt2 = 0; lt2 < mp.levels.length; lt2++) { mp.tab = lt2; mp.refresh(); mp.list.items.forEach(function (x) { if (x.value.ritual && x.value.field) rit = rit || x; else if (x.value.level && x.value.field) lev = lev || x; }); }
        au.slots = sl0;
        check('Aurdin with no slots: the ritual ' + (rit && rit.value.name) + ' open (' + (rit && !rit.disabled) + '), ' + (lev && lev.value.name) + ' greyed (' + (lev && lev.disabled) + ')', rit && !rit.disabled && lev && lev.disabled);
        // 6. the worn places and the bonds: the fire ring to Barley's second hand (he wears the Ring of Binding? either hand), unbonded till a rest
        var hasRing = DS.DATA.items.ringresistfire && DS.DATA.items.ringresistfire.attune;
        if (hasRing) {
          m = open(); ba.equip.ring2 = null; var ok6 = MN.swap(m, ba, 'ring2', 'ringresistfire');
          var before = R.bondState(ba, 'ringresistfire'), resB = R.wornList(ba, 'resist').indexOf('fire') >= 0;
          R.refresh(ba, false);
          var after = R.bondState(ba, 'ringresistfire'), resA = R.wornList(ba, 'resist').indexOf('fire') >= 0;
          check('the fire ring in Barley\'s second ring hand: ' + before + ' (fire ' + resB + '), after a rest ' + after + ' (fire ' + resA + '); his bonds ' + JSON.stringify(ba.attuned), ok6 && before === 'unbonded' && !resB && after === 'bonded' && resA);
          // a fourth bond is refused: three bond-wanting things worn already
          var lyB = g.hero('lymen'); lyB.attuned = []; ['cloakdisplacement', 'ringofprotection', 'flametongue'].forEach(function (id) { g.give(id, 1); });
          lyB.equip.cloak = 'cloakdisplacement'; lyB.equip.ring = 'ringofprotection'; lyB.equip.ring2 = 'ringresistfire'; var w0 = lyB.equip.weapon; lyB.equip.weapon = 'flametongue';
          var said = R.attune(lyB); lyB.equip.weapon = w0;
          check('four bond-wanting things on Lymen: three bond, the fourth refused (' + said.join(' / ') + ')', lyB.attuned.length === 3 && said.some(function (s) { return /three bonds already/.test(s); }));
        } else check('the fire ring (a runner\'s) is not in the items yet: skipped', true);
        // 7. an older save's hero (no bonds list) keeps what works: bonded on load
        var old = JSON.parse(JSON.stringify(g.hero('aurdin'))); delete old.attuned; old.equip.ring = 'ringofprotection'; var ac0 = R.ac(old);
        R.migrate(old);
        check('an older save\'s Aurdin with the Ring of Protection: bonded on load (' + JSON.stringify(old.attuned) + '), AC ' + ac0 + ' -> ' + R.ac(old), (old.attuned || []).indexOf('ringofprotection') >= 0 && R.ac(old) === ac0);
        // 8. GEAR, out of a fight: a worn thing opens its wearer's EQUIP at its place; a thing in the pack asks who (the panel), then its place's list with it under the cursor
        // (Griz, 10-06: "when I see the Quarterstaff is on Ly click doesn't kick me into the equip tab with lymen selected" -- "(when out of combat)")
        var au8 = g.hero('aurdin'); m = open(); toCmd(m, 'gear'); press(m, 'a'); gp = m.pages[0]; gp.tab = 0; gp.refresh();
        gp.list.i = gp.list.items.map(function (x) { return x.who === au8 ? 1 : 0; }).indexOf(1); press(m, 'a');
        var ep8 = m.pages[1], wOK = ep8 && ep8.h === au8 && ep8.list.cur().value === 'weapon';
        m = open(); g.give('ringofprotection', 1); toCmd(m, 'gear'); press(m, 'a'); gp = m.pages[0]; gp.tab = 3; gp.refresh();
        gp.list.i = gp.list.items.map(function (x) { return !x.who && x.value === 'ringofprotection' ? 1 : 0; }).indexOf(1); press(m, 'a');
        var kick8 = m.root.mode === 'pick'; m.root.pi = m.root.rows(false).indexOf(g.hero('vivian')); press(m, 'a');
        var cp8 = m.pages[m.pages.length - 1], pOK = cp8 && cp8.h === g.hero('vivian') && /^ring2?$/.test(cp8.slot) && cp8.list.cur() && cp8.list.cur().value === 'ringofprotection';
        check('GEAR: Aurdin\'s worn weapon opens his EQUIP at WEAPON (' + wOK + '); the pack\'s Ring of Protection asks who (' + kick8 + '), then Vivian\'s ring list with it under the cursor (' + pOK + ')', wOK && kick8 && pOK);
        // 9. OPTIONS: the grid's four rows, written where the grid reads them (localStorage deep16.opts)
        var o0 = null; try { o0 = window.localStorage.getItem('deep16.opts'); } catch (eO) { }
        m = open(); toCmd(m, 'options'); press(m, 'a'); var op = m.pages[0], labs = op.list.items.map(function (x) { return x.label; });
        op.list.i = labs.indexOf('END TURN ASKS'); var r0 = op.list.cur().right; press(m, 'right'); var r1 = op.list.items[labs.indexOf('END TURN ASKS')].right, st9 = null;
        try { st9 = JSON.parse(window.localStorage.getItem('deep16.opts') || 'null'); if (o0 == null) window.localStorage.removeItem('deep16.opts'); else window.localStorage.setItem('deep16.opts', o0); } catch (eO2) { }
        check('OPTIONS has the grid\'s rows (' + labs.join(', ') + '); END TURN ASKS ' + r0 + ' -> ' + r1 + ', kept as ' + (st9 && st9.confirmEnd), ['GRID SCALE', 'MENU TYPE', 'AUTO END TURN', 'END TURN ASKS', 'AI + MESSAGE TIME'].every(function (l) { return labs.indexOf(l) >= 0; }) && r0 !== r1 && st9 && st9.confirmEnd === 'always');
        // 10. the night's bonds, before the day's spells: a ring put on bonds in the night (NEW); one let go on the sheet stays let go through the next rest
        var vi = g.hero('vivian'); DS.clearScenes(); vi.attuned = []; vi.equip.ring = 'ringofprotection'; delete vi.noBond;
        DS.EV.longRest(); var newB = vi.attuned.indexOf('ringofprotection') >= 0, seenB = null;
        var ch1 = DS.choose; DS.choose = function (o) { if (o.title === 'THE NIGHT\'S BONDS' && !seenB) { seenB = o; var row = o.items.filter(function (x) { return x.value && x.value.h === vi; })[0]; return { start: function () { this.finished = true; this.result = row.value; } }; } return { start: function () { this.finished = true; this.result = 'done'; } }; };
        try { DS.run(function* () { yield* DS.EV.bonds(); }); T.step(5); } finally { DS.choose = ch1; }
        var rowB = seenB && seenB.items.filter(function (x) { return x.value && x.value.h === vi; })[0];
        R.refresh(vi, false); var stays = vi.attuned.indexOf('ringofprotection') < 0;
        check('the night\'s bonds: Vivian\'s ring bonded in the night (' + newB + '), the sheet says ' + (rowB && rowB.right) + ' (' + (seenB && seenB.items.length) + ' rows, ' + (seenB && seenB.visible) + ' at a time); let go there, it stays let go through a rest (' + stays + ', noBond ' + JSON.stringify(vi.noBond) + ')', newB && rowB && rowB.right === 'NEW' && stays && seenB.visible <= 12);
        // 11. CREDITS names the 16-bit figures' makers (Griz: "check the attrib we have to do for the .blend files we used and add to credits")
        var cr = (DS.DATA.credits || []).map(function (l) { return l.t; }).join(' | ');
        check('CREDITS names mz4250\'s models and their licences, the LPC figures, and where every licence is', /mz4250/.test(cr) && /CC BY-SA/.test(cr) && /LPC/.test(cr) && /CREDITS\.md/.test(cr));
        // 12. (10-07, his find on the grid's menu: "torches cannot be equipped" -- one menu, so both games) EQUIP's LIGHT with none lit and a torch in the pack: the row is
        // there, and E on it, then on the torch, lights it in that hero's hand, as ITEMS lights it
        var vi12 = g.hero('vivian'); DS.EV.torchOut(true); g.give('torch', 1); vi12.equip.shield = null; drawErr = [];
        m = open(); toCmd(m, 'equip'); press(m, 'a'); m.root.pi = m.root.rows(false).indexOf(vi12); press(m, 'a');
        // (since 10-15 the light is the OFFHAND's: E on OFFHAND, then on the pack's torch -- RULED, Griz: "6 - yeah, in the offhand instead of its own slot")
        var ep12 = m.pages[0], li12 = ep12 && ep12.list ? ep12.list.items.map(function (x) { return x.value; }).indexOf('offhand') : -1;
        if (li12 >= 0) { ep12.list.i = li12; press(m, 'a'); var cp12 = m.pages[1], ti12 = cp12 ? cp12.list.items.map(function (x) { return x.kind === 'light' && x.value; }).indexOf('torch') : -1; if (ti12 >= 0) { cp12.list.i = ti12; press(m, 'a'); } else li12 = -1; }
        for (var w12 = 0; w12 < 300 && m.busy; w12++) { var tq12 = DS.top(); if (tq12 && tq12.kind === 'dialog') { if (tq12.chars < tq12.pageLen()) tq12.chars = tq12.pageLen(); T.tapf('a'); } else T.step(1); }
        check('EQUIP\'s OFFHAND in the 8-bit: the pack\'s torch on its list with none lit (' + (li12 >= 0) + '), the torch lit in Vivian\'s hand (torchBy ' + g.flags.torchBy + ')' + (drawErr.length ? ': ' + drawErr[0] : ''), li12 >= 0 && g.flags.torchBy === 'vivian' && !drawErr.length);
        DS.EV.torchOut(true);
        // 13. (10-07, his: "\"nothing goes there in this fight\" vs \"no weapon barley can swap to\"") one wording for a place with nothing to put there: Vivian's SHIELD (a rogue
        // takes up none) says the grid's sentence
        m = open(); toCmd(m, 'equip'); press(m, 'a'); m.root.pi = m.root.rows(false).indexOf(vi12); press(m, 'a');
        // (a place with nothing in the pack for it: since 10-15 the OFFHAND -- the old SHIELD -- has Vivian's daggers and the lights, so the first one that is empty)
        var inv13 = g.inv.slice(), neck13 = vi12.equip.neck; g.inv.length = 0; inv13.forEach(function (x) { var it = DS.DATA.items[x.id]; if (!(it && it.kind === 'worn' && it.place === 'neck')) g.inv.push(x); }); vi12.equip.neck = null; // (NECK made empty for it: the pack's neck things set aside till the check is done)
        var ep13 = m.pages[0]; if (ep13) { ep13.refresh(); ep13.list.i = ep13.list.items.map(function (x) { return x.value; }).indexOf('neck'); press(m, 'a'); }
        var said13 = [], text13 = DS.text; DS.text = function (c, s) { said13.push(String(s)); return text13.apply(this, arguments); };
        try { m.draw(cx); } finally { DS.text = text13; }
        var empty13 = said13.join(' ');
        check('an empty place in the 8-bit\'s EQUIP says the one sentence: ' + (/Nothing in the pack[^.]*\./.exec(empty13) || [empty13.slice(0, 80)])[0], /Nothing in the pack Vivian can put there\./.test(empty13));
        g.inv.length = 0; inv13.forEach(function (x) { g.inv.push(x); }); vi12.equip.neck = neck13;
        if (Q.get('shot')) { m = open(); toCmd(m, 'status'); press(m, 'a'); press(m, 'a'); out.shot = cv.toDataURL('image/png'); }
      } finally { DS.choose = choose0; }
    } else if (test === 'countdown1003') {
      // the countdown carried across map loads (RULED 10-03, Griz: "yes; a map load is not a rest, but it is a game change"; js/world.js Field.load): a load keeps
      // what is left, a warp too, and the chalk's sixty with them; a fresh field rolls in its zone's rate; and a count carried in fires on the new map's steps
      var F = DS.field, ids = Object.keys(DS.DATA.maps).filter(function (id) { return !DS.SCRIPTS['enter:' + id]; });
      function zoneSq(id) { F.load(id, 0, 0, 'down'); for (var y = 0; y < F.map.h; y++) for (var x = 0; x < F.map.w; x++) { var z = F.zoneAt(x, y), t = F.map.at(x, y); if (z && DS.DATA.encounters[z] && t && DS.TILES[t] && DS.TILES[t].pass && !F.warpAt(x, y) && !F.triggerAt(x, y, 'step') && !F.triggerAt(x, y, 'use') && !F.npcAt(x, y) && !F.chestAt(x, y)) return { id: id, x: x, y: y, z: z }; } return null; }
      function settleS() { for (var i = 0; i < 400 && DS.scriptActive(); i++) { var tp = DS.top(); if (tp && tp.kind === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); } else T.step(1); } }
      var start0 = F.encounterIn, z0 = F.zoneAt(g.x, g.y), r0 = (z0 && DS.DATA.encounters[z0] && DS.DATA.encounters[z0].rate) || [18, 40];
      check('a fresh field\'s first load rolls the countdown in its zone\'s rate: ' + start0 + ' in ' + r0.join('-') + ' (' + (z0 || 'no zone') + ')', typeof start0 === 'number' && start0 >= r0[0] && start0 <= r0[1]);
      var sqs = []; for (var mi = 0; mi < ids.length && sqs.length < 2; mi++) { var sq = zoneSq(ids[mi]); if (sq) sqs.push(sq); }
      var A = sqs[0], B = sqs[1];
      check('two maps with an encounter zone and no enter hook: ' + (A && A.id + ' ' + A.z) + ', ' + (B && B.id + ' ' + B.z), !!A && !!B);
      F.load(A.id, A.x, A.y, 'down'); F.encounterIn = 3; F.load(B.id, B.x, B.y, 'down');
      check('a load keeps what is left: 3 on ' + A.id + ', ' + F.encounterIn + ' on ' + B.id, F.encounterIn === 3);
      F.encounterIn = 4; DS.run(function* () { yield* DS.EV.warp(A.id, A.x, A.y, 'down'); }); settleS();
      check('a warp keeps it: 4 on ' + B.id + ', ' + F.encounterIn + ' on ' + F.map.id + ' (control back ' + !DS.scriptActive() + ')', F.map.id === A.id && F.encounterIn === 4 && !DS.scriptActive());
      var chalk = Object.keys(DS.DATA.items).filter(function (k) { var it = DS.DATA.items[k]; return it.use && it.use.effect === 'ward'; })[0];
      F.encounterIn = 2; g.give(chalk, 1); DS.run(function* () { yield* DS.EV.useFieldItem(chalk, g.party[0]); }); settleS(); var warded = F.encounterIn;
      F.load(B.id, B.x, B.y, 'down');
      check('the ' + chalk + '\'s ward goes with them: 2, ' + warded + ' warded, ' + F.encounterIn + ' after the load', warded === 62 && F.encounterIn === 62);
      var f2 = new DS.Field(), rB = DS.DATA.encounters[B.z].rate || [18, 40]; f2.load(B.id, B.x, B.y, 'down');
      check('a new field (a new game, a load from a save) rolls its own: ' + f2.encounterIn + ' in ' + rB.join('-'), typeof f2.encounterIn === 'number' && f2.encounterIn >= rB[0] && f2.encounterIn <= rB[1]);
      delete g.flags.noEncounters; // (the bench's setup holds the road's fights off; this one wants them)
      F.load(A.id, A.x, A.y, 'down'); F.encounterIn = 0.5; F.load(B.id, B.x, B.y, 'down'); F.arrive();
      check('half a step left on ' + A.id + ' fires on the first step of ' + B.id + ': a fight begun (' + DS.scriptActive() + '), the next countdown rolled (' + F.encounterIn + ')', DS.scriptActive() && F.encounterIn >= rB[0] && F.encounterIn <= rB[1]);
    } else if (test === 'floor1003') {
      // the floor under the player (10-03, the cloud review's recommendation 3, "A floor under the player"): a story fight must never freeze the 8-bit game -- since 10-20
      // it is the 8-bit battle at once, no frame, no line (the first game lane: "8 bit solely 8-bit after this"; until then a grid that crashed or never came up fell
      // back to it, and cases 1 and 2 dispatched the grid's d16:crash and fired its ready timeout) -- a loaded save naming an item or a map the game does not have must
      // not break the menus or black the screen (js/scenes.js DS.migrateSave), and a warp that throws must not leave the screen black (js/events.js EV.warp)
      var cases = [], realSet = window.setTimeout, realClear = window.clearTimeout, realWarn = console.warn, realErr = console.error, timers = [], warns = [];
      function floorCase(name, fn) { // a case passes when every check it made did; one that throws is a failed case, not the end of the bench
        var before = out.checks.length;
        try { fn(); } catch (e) { check(name + ': threw ' + String(e && e.stack || e).slice(0, 240), false); }
        window.setTimeout = realSet; window.clearTimeout = realClear; console.warn = realWarn; console.error = realErr; DS.choose = chooseReal;
        cases.push({ name: name, ok: out.checks.slice(before).every(function (c) { return c.indexOf('ok') === 0; }) });
      }
      var chooseReal = DS.choose;
      function holdTimers() { timers = []; window.setTimeout = function (fn, ms) { var t = { fn: fn, ms: ms, cleared: false, ran: false }; timers.push(t); return t; }; window.clearTimeout = function (t) { if (t && typeof t === 'object') t.cleared = true; }; }
      function flushZero() { timers.forEach(function (t) { if (!t.cleared && !t.ran && !t.ms) { t.ran = true; t.fn(); } }); } // (the 8-bit battle hands its script back through setTimeout(.., 0))
      function holdWarns() { warns = []; console.warn = function () { warns.push(Array.prototype.join.call(arguments, ' ')); }; }
      // a story fight opened (a `deep16` key on it): the 8-bit battle comes up with no line before it and no frame at any step, and is fought to its end with the foes down
      function eightBitAtOnce(list, o) {
        var stale; while ((stale = document.getElementById('d16'))) stale.parentNode.removeChild(stale);
        DS.lastError = null; DS.paused = false; T.res = undefined; holdTimers(); holdWarns();
        T.startFight(list, Object.assign({ dark: false, torch: null }, o));
        var said = [], hp0 = null, b, frame = false, paused = false;
        for (var i = 0; i < 600 && !DS.find('battle'); i++) {
          var tp = DS.top(), k = tp && tp.kind; if (document.getElementById('d16')) frame = true; if (DS.paused) paused = true;
          if (k === 'dialog') { var pg = tp.pages[tp.p]; if (pg) { var tx = DS.stripCodes(pg.lines.join(' ')); if (said[said.length - 1] !== tx) said.push(tx); } if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); }
          else T.step(1);
        }
        b = DS.find('battle'); if (b) hp0 = b.heroes.map(function (u) { return u.h.hp; });
        if (b) { b.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); drive({}, 1500); }
        flushZero(); T.step(2);
        if (document.getElementById('d16')) frame = true;
        return { said: said, b: b, hp0: hp0, frame: frame, paused: paused };
      }
      function party(g2) { return g2.party.map(function (h) { return h.hp; }).concat((g2.guests || []).map(function (x) { return x.h.hp; })); }
      // 1. a story fight is the 8-bit battle at once (cases 1 and 2 till 10-20: the grid's crash and its ready timeout, each falling back to this)
      floorCase('a story fight is the 8-bit battle', function () {
        SETUP(+(Q.get('lvl') || 5)); var pre = party(DS.G);
        var r = eightBitAtOnce(['ogre'], { deep16: 'trolls' });
        check('a story fight (deep16: trolls): no frame over the screen (' + !r.frame + '), the game never held still for one (' + !r.paused + '), no grid left behind (DS.roam8 ' + typeof DS.roam8 + ', DS.d16ReadyMs ' + DS.d16ReadyMs + ')', !r.frame && !r.paused && DS.roam8 === undefined && DS.d16ReadyMs === undefined);
        check('nothing said before it (' + r.said.length + (r.said.length ? ': "' + r.said.join(' | ') + '"' : '') + '), nothing warned (' + warns.length + ')', r.said.length === 0 && warns.length === 0);
        check('the 8-bit battle took the fight (' + !!r.b + ', fromDeep ' + !!(r.b && r.b.fromDeep) + ', foes ' + (r.b && r.b.foes.length) + '), the party as it walked in (' + (r.hp0 || []).join('/') + ' of ' + pre.join('/') + '), result ' + T.res,
          !!r.b && !r.b.fromDeep && r.b.foes.length === 1 && JSON.stringify(r.hp0) === JSON.stringify(pre) && T.res === 'win');
      });
      // 3. a save with an item id the game has not got, in the pack and in two equipment slots (a hero's and a guest's)
      floorCase('a save naming an unknown item', function () {
        SETUP(+(Q.get('lvl') || 5)); DS.lastError = null; DS.EV.addGuest('ingrith');
        var potions = DS.G.count('potion'), s1 = JSON.parse(JSON.stringify(DS.G));
        s1.inv.push({ id: 'zzbogusitem', n: 3 }); s1.party[0].equip.weapon = 'zzbogusblade'; s1.party[1].equip.torch = 1; s1.guests[0].h.equip.armor = 'zzbogusmail';
        holdWarns(); var why = DS.migrateSave(s1), w1 = warns.slice(); holdWarns(); DS.migrateSave(s1); var w2 = warns.slice();
        check('migrateSave took it (' + JSON.stringify(why) + '): the pack ' + s1.inv.map(function (s) { return s.id + 'x' + s.n; }).join(','), why === '' && !s1.inv.some(function (s) { return s.id === 'zzbogusitem'; }) && potions > 0 && s1.inv.some(function (s) { return s.id === 'potion' && s.n === potions; }));
        check('the hero\'s unknown weapon and the guest\'s unknown armor emptied (' + s1.party[0].equip.weapon + ', ' + s1.guests[0].h.equip.armor + '), a torch flag left alone (' + s1.party[1].equip.torch + '), a known weapon kept (' + s1.party[2].equip.weapon + ')', s1.party[0].equip.weapon === null && s1.guests[0].h.equip.armor === null && s1.party[1].equip.torch === 1 && !!s1.party[2].equip.weapon && s1.party[2].equip.weapon === DS.G.party[2].equip.weapon);
        check('each said so on the console (' + w1.length + '), the second pass quiet (' + w2.length + ')', w1.length === 3 && ['zzbogusitem', 'zzbogusblade', 'zzbogusmail'].every(function (id) { return w1.some(function (w) { return w.indexOf(id) >= 0; }); }) && w2.length === 0);
        DS.startFrom(s1); // (the way a load goes in: the heroes brought up to date on the sheet as it now is)
        check('startFrom took it: the weapon in his hand is ' + R.weaponOf(DS.G.party[0]).id + ', his AC ' + R.ac(DS.G.party[0]), R.weaponOf(DS.G.party[0]).id === 'unarmed' && R.ac(DS.G.party[0]) > 0);
        // (the one menu since 10-06, js/menu.js: the pack across ITEMS' four tabs and GEAR's seven, each row a name)
        var listed = [], asked = [], c0 = console.error;
        console.error = function () { asked.push(Array.prototype.join.call(arguments, ' ')); };
        try {
          var fm0 = new DS.FieldMenu(), m0 = fm0.m, ip0 = new (function () { m0.root.go('items'); return function () { }; })();
          var pgI = m0.pages[m0.pages.length - 1]; for (var t0 = 0; t0 < 4; t0++) { pgI.tab = t0; pgI.refresh(); listed = listed.concat(pgI.list.items); }
          m0.pop(); m0.root.go('gear'); var pgG = m0.pages[m0.pages.length - 1]; for (var t1 = 0; t1 < 7; t1++) { pgG.tab = t1; pgG.refresh(); listed = listed.concat(pgG.list.items.filter(function (x) { return /^x/.test(x.right) && !x.light; })); } // (the OFFHAND tab's pack lights are ITEMS' too: 10-15)
        } catch (eL) { asked.push(String(eL)); }
        console.error = c0;
        check('the menu\'s ITEMS and GEAR lists build: ' + (listed.length ? listed.length + ' rows, ' + listed.map(function (i) { return i.label; }).slice(0, 4).join(', ') + '...' : 'they did not (' + asked.length + ' errors: ' + asked[0] + ')'), listed.length === DS.G.inv.length && listed.every(function (i) { return typeof i.label === 'string' && i.label; }));
      });
      // 4. a save in a map the game has not got: the way the game opens a new one (config.start), before the scenes are cleared
      floorCase('a save in an unknown map', function () {
        SETUP(+(Q.get('lvl') || 5)); DS.lastError = null;
        var st = DS.DATA.config.start, s2 = JSON.parse(JSON.stringify(DS.G)), s3 = JSON.parse(JSON.stringify(DS.G));
        s2.map = 'zz_nomap'; s2.x = 7; s2.y = 9; s2.dir = 'left'; s3.map = 'gulch'; s3.x = 33; s3.y = 8; s3.dir = 'right';
        holdWarns(); var why = DS.migrateSave(s2), w3 = warns.slice(); DS.migrateSave(s3);
        check('migrateSave took it (' + JSON.stringify(why) + '): now at ' + [s2.map, s2.x, s2.y, s2.dir].join(','), why === '' && s2.map === st.map && s2.x === st.x && s2.y === st.y && s2.dir === st.dir && !!DS.DATA.maps[st.map]);
        check('it said so on the console (' + w3.length + '), a real map left where it was (' + [s3.map, s3.x, s3.y, s3.dir].join(',') + ')', w3.length === 1 && w3[0].indexOf('zz_nomap') >= 0 && s3.map === 'gulch' && s3.x === 33 && s3.y === 8 && s3.dir === 'right');
        var raised = null; try { DS.startFrom(s2); } catch (e) { raised = e; }
        check('startFrom took it: the field is ' + (DS.field && DS.field.map && DS.field.map.id) + ' at ' + DS.G.x + ',' + DS.G.y + ' (' + (raised ? 'it threw' : 'no throw') + ', top scene ' + (DS.top() && DS.top().kind) + ')', !raised && DS.top() && DS.top().kind === 'field' && DS.field.map.id === st.map && DS.G.x === st.x && DS.G.y === st.y);
      });
      // 5. a warp whose body throws (the map it names is not there): the screen must come back up, and the throw must still be seen
      floorCase('a warp that throws', function () {
        SETUP(+(Q.get('lvl') || 5)); DS.lastError = null; DS.fadeLevel = 0;
        var map0 = DS.field.map.id, errs = [];
        console.error = function () { errs.push(Array.prototype.join.call(arguments, ' ')); };
        DS.run(function* () { yield* DS.EV.warp('zz_nomap', 1, 1, 'down'); });
        for (var i = 0; i < 200 && DS.scriptActive(); i++) T.step(1);
        console.error = realErr;
        check('the fade is back up (' + DS.fadeLevel + '), the throw still seen (' + errs.length + ' script error, ' + /no map zz_nomap/.test(errs.join(' ')) + '), the party where it was (' + DS.field.map.id + '), control back (' + !DS.scriptActive() + ')', DS.fadeLevel === 0 && errs.length === 1 && /no map zz_nomap/.test(errs.join(' ')) && DS.field.map.id === map0 && !DS.scriptActive());
      });
      // 6. any script that throws between its own fade-out and fade-in (10-03, Griz "3 yes": the floor in Script.step, js/core.js, for the dozen pairs besides the warp)
      floorCase('a script that throws while faded out', function () {
        SETUP(+(Q.get('lvl') || 5)); DS.fadeLevel = 0;
        var errs = [];
        console.error = function () { errs.push(Array.prototype.join.call(arguments, ' ')); };
        DS.run(function* () { yield DS.fade(1, 12); throw new Error('thrown in the dark'); });
        for (var i = 0; i < 200 && DS.scriptActive(); i++) T.step(1);
        console.error = realErr;
        check('the fade is back up (' + DS.fadeLevel + '), the throw still seen (' + errs.length + ' script error), control back (' + !DS.scriptActive() + ')', DS.fadeLevel === 0 && errs.length === 1 && /thrown in the dark/.test(errs.join(' ')) && !DS.scriptActive());
      });
      // 7. a wet fight in the 8-bit battle (10-03, Griz: "if for some reason the game starts crashing, they should be able to finish off those 3 monsters in 8bit" --
      // since 10-20 every wet fight is the 8-bit's, js/embed.js): the landlord, the jelly and the pool ooze, killed, stay dead as the grid would leave them, and their
      // spots stop calling them up; a crawler sets nothing, and a gray ooze killed in a fight that is not the wet's does not still the pool. No frame at any of them
      floorCase('a wet fight in the 8-bit battle', function () {
        function wet8(list, o) {
          SETUP(+(Q.get('lvl') || 5));
          DS.field.load('warrens_d', 20, 10, 'down');
          var r = eightBitAtOnce(list, o); return r.b ? { r: r, flags: DS.G.flags } : null;
        }
        var trig = { jellyDead: 'jelly', poolOozeDead: 'poolOoze', otyughDead: 'landlordNear' };
        [['otyugh', 'rim', 'otyughDead'], ['ochrejelly', 'jelly', 'jellyDead'], ['grayooze', 'poolooze', 'poolOozeDead']].forEach(function (w) {
          var x = wet8([w[0]], { deep16: 'wet', wake: w[1] }), fl = x && x.flags, spots = (DS.field.map.src.triggers || []).filter(function (t) { return t.script === trig[w[2]]; }), live = spots.filter(function (t) { return DS.cond(t.cond); }).length;
          check('the ' + w[0] + ' (wake ' + w[1] + ') killed in the 8-bit battle (' + (x && T.res) + ', no frame ' + !!(x && !x.r.frame) + '): ' + w[2] + ' ' + (fl && fl[w[2]]) + ', its spots on the map calling ' + live + ' of ' + spots.length, !!x && !x.r.frame && T.res === 'win' && fl[w[2]] === 1 && spots.length > 0 && live === 0);
        });
        var xc = wet8(['crawler'], { deep16: 'wet', wake: 'harness' });
        check('a crawler killed the same way sets none of the three (' + (xc && ['otyughDead', 'jellyDead', 'poolOozeDead'].map(function (k) { return k + ' ' + !!xc.flags[k]; }).join(', ')) + ')', !!xc && T.res === 'win' && !xc.flags.otyughDead && !xc.flags.jellyDead && !xc.flags.poolOozeDead);
        var xo = wet8(['grayooze'], { deep16: 'trolls' });
        check('a gray ooze killed in a fight that is not the wet\'s leaves the pool as it was (poolOozeDead ' + !!(xo && xo.flags.poolOozeDead) + ')', !!xo && T.res === 'win' && !xo.flags.poolOozeDead);
      });
      var okN = cases.filter(function (c) { return c.ok; }).length;
      T.blog = []; out.log.push('floor1003: ' + okN + '/' + cases.length + ' cases' + (okN === cases.length ? ' clean' : ': ' + cases.filter(function (c) { return !c.ok; }).map(function (c) { return c.name; }).join('; ') + ' went wrong'));
    } else if (test === 'ending1020' || test === 'door1020') {
      // THE FIRST GAME's ending (RULED 10-20, Griz: "Revert to the old ending in 8-bit before the edifice fight was added and call it the first game"; "8 bit solely 8-bit
      // after this"; "ship to live with a door to the ending"). In place of skylights8 (the call from the surface and the Skylights handed to the grid, 10-05 night to 10-20).
      // ending1020 walks it from the raid at Third Lamp (?at=raid's story): the raid, the lamp's menu after it, leg four, the road held at the door, then the journal's own
      // doors -- the king's word, Ingrith walked down, the door -- to the consult and the credits; and a save from the Skylights' weeks loads onto that road. door1020 is the
      // door the ship gives (?at=ending): set up as the title sets a situation up, E on the door, the credits. Every question its first choice, every fight the 8-bit battle
      // with its foes put down at its first frame (DS.autoPicks: a level-up's picks the defaults); checked at every step that no frame comes over the screen
      var st20 = window.setTimeout, say20 = DS.say, said20 = [], asked20 = [], frames20 = 0, fights20 = [], auto20 = DS.autoPicks;
      window.setTimeout = function (fn) { pending.push(fn); return 0; }; DS.autoPicks = true;
      DS.say = function (t) { said20.push(DS.stripCodes(Array.isArray(t) ? t.join(' ') : String(t))); return say20.apply(this, arguments); };
      function heard20(re) { return said20.some(function (x) { return re.test(x); }); }
      function play20(gen, answers, cap) { // a script to its end, or to the credits
        answers = (answers || []).slice(); var fin = false; DS.lastError = null; DS.run(gen, function () { fin = true; });
        for (var i = 0; i < (cap || 20000) && !DS.lastError; i++) {
          if (document.getElementById('d16')) frames20++;
          var tp = DS.top(), k = tp && tp.kind, b = DS.find('battle');
          if (k === 'credits' || k === 'after' || k === 'gameover') break;
          if (b && !b.down20) { b.down20 = true; fights20.push((b.o.enemies || []).join(',') + (b.o.deep16 ? ' [' + b.o.deep16 + ']' : '')); b.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); }
          var menu = (k === 'dialog' || k === 'menu' || k === 'popup') ? tp.menu : null;
          if (menu) {
            var labels = menu.items.map(function (it) { return String(it.label || it); }); if (!b) asked20.push(labels.join('/'));
            var idx = -1; if (answers.length && !b) { var a = String(answers[0]).toUpperCase(); idx = labels.findIndex(function (l, j) { return !menu.items[j].disabled && l.toUpperCase().indexOf(a) === 0; }); if (idx >= 0) answers.shift(); }
            if (idx < 0) idx = menu.items.findIndex(function (it) { return !it.disabled && !/DONATE|SUPPORT|KO-?FI|^RUN$/i.test(String(it.label || it)); });
            menu.i = Math.max(0, idx); T.tapf('a');
          }
          else if (k === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); }
          else if (k === 'target') { tp.i = 0; T.tapf('a'); }
          else if (k === 'check') { if (tp.t > 60) T.tapf('a'); else T.step(4); }
          else if (k && k !== 'field' && k !== 'flash' && k !== 'battle') { T.tapf('a'); T.step(2); }
          else T.step(1);
          if (fin && !DS.scriptActive() && (!k || k === 'field')) break;
        }
        return fin;
      }
      function credits20(tag) { // the credits as the ending pushes them, then B to their end: THE ROAD IS HELD, CONTINUE and TITLE, no PAST THE DOOR
        var cr = DS.top(), lines = cr && cr.lines ? cr.lines.map(function (l) { return l.t; }) : [];
        check(tag + ': the credits (' + (cr && cr.kind) + '): ' + lines.slice(0, 2).join(' / ') + ', DEEPHOLM ' + (lines.indexOf('DEEPHOLM') >= 0) + ', the title after them ' + (cr && cr.o && cr.o.title) + ', expansionDone ' + DS.G.flags.expansionDone,
          !!cr && cr.kind === 'credits' && lines[0] === 'DRAGONSLEEP' && lines[1] === 'Behind the Fountains' && lines.indexOf('DEEPHOLM') >= 0 && cr.o && cr.o.title === 'THE ROAD IS HELD' && DS.G.flags.expansionDone === 1);
        T.tapf('b'); var af = DS.top(), items = af && af.menu ? af.menu.items.map(function (it) { return it.label; }) : [];
        check(tag + ': at their end ' + (af && af.kind) + ' -- ' + items.join(' / ') + ' (no PAST THE DOOR: it carried the save into deep16/)', !!af && af.kind === 'after' && items.join('/') === 'CONTINUE/TITLE');
      }
      function door20(tag) { // the journal's door, played: an NPC talked to, or the square's trigger used (story1006's way, one step at a time)
        var q = DS.pinnedQuest(), s = q && DS.questStep(q), F = DS.field;
        if (!s) { check(tag + ': the journal points at nothing (' + (q ? q.id : 'no quest') + ')', false); return null; }
        F.load(s.map, s.at ? s.at[0] : 1, s.at ? s.at[1] : 1, 'right'); var n = s.npc && F.npcs.filter(function (x) { return x.id === s.npc; })[0];
        if (s.npc && !n) { check(tag + ': the journal\'s ' + s.npc + ' is not on ' + s.map, false); return null; }
        if (n) { DS.G.x = n.x - 1; DS.G.y = n.y; F.px = DS.G.x * 16; F.py = DS.G.y * 16; play20(function* () { yield* DS.EV.talk(n); }); }
        else { var t = F.triggerAt(s.at[0] + 1, s.at[1], 'use') || F.triggerAt(s.at[0], s.at[1], 'step'); if (!t) { check(tag + ': no door at ' + s.map + ' ' + s.at, false); return null; } play20(function* () { yield* DS.EV.trigger(t, F); }); }
        return { q: q.id, where: s.map + (s.npc ? ':' + s.npc : ' ' + s.at) };
      }
      try {
        if (test === 'ending1020') {
          T.newGame('barley'); DS.paused = true; DS.situation(DS.G, DS.SITUATIONS.raid); var g20 = DS.G; g20.flags.noEncounters = 1;
          DS.field.load('highway_3', 56, 11, 'right');
          play20(DS.SCRIPTS.raid, ['GO IN']);
          check('the raid at Third Lamp: the 8-bit battle (' + fights20.join(' | ') + '), raidWon ' + g20.flags.raidWon + ', lamp3 ' + g20.flags.lamp3 + ', pinned ' + g20.flags.pin + '; no runner from the surface (' + !heard20(/on the Edifice|Boots on the road above/) + ', surfaceCall ' + !!g20.flags.surfaceCall + ')',
            fights20.length === 1 && /\[raid\]$/.test(fights20[0]) && g20.flags.raidWon === 1 && g20.flags.lamp3 === 1 && g20.flags.pin === 'solskaft' && !heard20(/on the Edifice|Boots on the road above/) && !g20.flags.surfaceCall);
          DS.field.load('highway_3', 66, 11, 'right'); asked20 = [];
          play20(function* () { yield* DS.EV.roadMenu(3); }, ['NOT NOW']);
          check('Third Lamp\'s menu after it: ' + asked20.join(' | ') + ' -- the way back up, no TO THE SURFACE!', asked20.some(function (a) { return /BACK UP TO SOLSKAFT/.test(a); }) && !asked20.some(function (a) { return /SURFACE/.test(a); }));
          DS.field.load('highway_4', 2, 11, 'right'); var f0 = fights20.length;
          ['fallback', 'naga', 'trolls', 'elemental'].forEach(function (s) { play20(DS.SCRIPTS[s]); });
          check('leg four: four fights, the 8-bit battle each (' + fights20.slice(f0).join(' | ') + '), done ' + ['fallbackDone', 'nagaDone', 'trollsDone', 'elementalDone'].map(function (k) { return g20.flags[k] || 0; }).join(''),
            fights20.length - f0 === 4 && ['fallbackDone', 'nagaDone', 'trollsDone', 'elementalDone'].every(function (k) { return g20.flags[k] === 1; }));
          DS.field.load('threshold', 1, 8, 'right');
          play20(DS.SCRIPTS['enter:threshold']);
          check('Deepholm\'s door: the road held (' + g20.flags.highwaySecured + '), pinned ' + g20.flags.pin + ', Torvald met (' + g20.flags.torvaldMet + ', ' + g20.flags.torvaldFate + ')', g20.flags.highwaySecured === 1 && g20.flags.pin === 'thedoor' && g20.flags.torvaldMet === 1);
          var d1 = door20('the king'), d2 = door20('Ingrith');
          check('the journal\'s doors: ' + (d1 && d1.where) + ' -- the king\'s word (' + g20.flags.pyroConsent + '); ' + (d2 && d2.where) + ' -- Ingrith walks down with you (' + g20.flags.ingrithEscort + ', a guest ' + DS.EV.hasGuest('ingrith') + ')',
            !!d1 && d1.where === 'solskaft:pyro' && g20.flags.pyroConsent === 1 && !!d2 && d2.where === 'solskaft:ingrith' && g20.flags.ingrithEscort === 1 && DS.EV.hasGuest('ingrith'));
          var d3 = door20('the door');
          check('the door (' + (d3 && d3.where) + '): the consult -- Ingrith through it (' + !DS.EV.hasGuest('ingrith') + '), the Sunshaft staff (' + (g20.has('sunshaftstaff') || g20.party.some(function (h) { return h.equip.weapon === 'sunshaftstaff'; })) + ')',
            !!d3 && !DS.EV.hasGuest('ingrith') && (g20.has('sunshaftstaff') || g20.party.some(function (h) { return h.equip.weapon === 'sunshaftstaff'; })));
          credits20('the ending');
          // a save from the Skylights' weeks (10-05 to 10-20): the runner heard, or the Skylights won and THE SNOOT pinned -- it loads onto this road, never stuck at the gate
          [{ name: 'the runner heard, the road not yet held', f: { surfaceCall: 1 }, pin: 'solskaft' }, { name: 'the Skylights won, THE SNOOT pinned', f: { surfaceCall: 1, skylightsWon: 1, pin: 'thesnoot' }, pin: 'solskaft' },
            { name: 'THE SNOOT pinned, the road held', f: { surfaceCall: 1, skylightsWon: 1, pin: 'thesnoot', highwaySecured: 1 }, pin: 'thedoor' }].forEach(function (c) {
            T.newGame('barley'); DS.paused = true; DS.situation(DS.G, DS.SITUATIONS.raid); var s0 = JSON.parse(JSON.stringify(DS.G));
            Object.assign(s0.flags, { lamp3: 1, raidWon: 1, captainHome: 1, roadOpen: 1 }, c.f); s0.map = 'solskaft_deep'; s0.x = 36; s0.y = 11; s0.guests = [];
            var w0 = console.warn; console.warn = function () { }; DS.startFrom(s0); console.warn = w0; var gL = DS.G;
            check('a save from the Skylights\' weeks, ' + c.name + ': loads with surfaceCall ' + !!gL.flags.surfaceCall + ', skylightsWon ' + !!gL.flags.skylightsWon + ', pinned ' + gL.flags.pin, !gL.flags.surfaceCall && !gL.flags.skylightsWon && gL.flags.pin === c.pin);
          });
          asked20 = []; DS.field.load('solskaft_deep', 36, 11, 'left');
          play20(DS.SCRIPTS.highwayGate, ['NOT NOW']);
          check('and at the gate it is the road\'s menu, not a fight: ' + asked20.join(' | '), asked20.some(function (a) { return /^WALK THE ROAD\//.test(a); }) && !asked20.some(function (a) { return /SURFACE/.test(a); }));
          check('THE SNOOT is out of the first game: no quest ' + !(DS.DATA.quests || []).some(function (q) { return q.id === 'thesnoot'; }) + ', no runner from the Pit ' + !DS.DATA.npcs.pitRunner + ', no scene ' + (!DS.SCRIPTS.snootCall && !DS.SCRIPTS.skylights && !DS.EV.surfaceCall),
            !(DS.DATA.quests || []).some(function (q) { return q.id === 'thesnoot'; }) && !DS.DATA.npcs.pitRunner && !DS.SCRIPTS.snootCall && !DS.SCRIPTS.skylights && !DS.EV.surfaceCall);
        } else {
          var s20 = DS.SITUATIONS.ending;
          check('?at=ending is there: "' + (s20 && s20.title) + '"', !!s20);
          if (s20) {
            T.newGame('aurdin'); DS.paused = true; DS.situation(DS.G, s20); var gD = DS.G; gD.flags.noEncounters = 1;
            DS.clearScenes(); var FD = DS.field = new DS.Field(); DS.push(FD); FD.load(gD.map, gD.x, gD.y, gD.dir);
            play20(function* () { yield* DS.situationStart(s20); });
            check('set up as the title sets it up: ' + [FD.map.id, gD.x, gD.y, gD.dir].join(',') + ', Ingrith a guest ' + DS.EV.hasGuest('ingrith') + ', the road held ' + gD.flags.highwaySecured + ', the king\'s word ' + gD.flags.pyroConsent + ', the raid won ' + gD.flags.raidWon + ', pinned ' + gD.flags.pin,
              FD.map.id === 'threshold' && DS.EV.hasGuest('ingrith') && gD.flags.highwaySecured === 1 && gD.flags.pyroConsent === 1 && gD.flags.raidWon === 1 && gD.flags.pin === 'thedoor');
            var t20 = FD.triggerAt(gD.x + 1, gD.y, 'use');
            check('one step east is the door (' + (t20 && t20.id) + ')', !!t20 && t20.script === 'deepDoor');
            said20 = []; T.tapf('a'); var eStarted = DS.scriptActive(); // (E, as the field takes it: Field.interact on the square faced)
            play20(function* () { }, [], 20000); // (drives the scene the E started, to the credits)
            check('E on the door starts it (' + eStarted + '): the consult (' + heard20(/Dagny|Ingrith|door/i) + ', ' + said20.length + ' lines), Ingrith through it (' + !DS.EV.hasGuest('ingrith') + '), expansionDone ' + gD.flags.expansionDone, eStarted && !DS.EV.hasGuest('ingrith') && gD.flags.expansionDone === 1);
            credits20('the door');
          }
        }
        check('no frame over the screen at any step (' + frames20 + '), no error' + (DS.lastError ? ': ' + String(DS.lastError.stack || DS.lastError).slice(0, 300) : ''), frames20 === 0 && !DS.lastError && !document.getElementById('d16'));
        out.log.push(test + ': the fights ' + fights20.join(' | '));
      } catch (e20) { check('threw: ' + String(e20 && e20.stack || e20).slice(0, 400), false); }
      DS.say = say20; window.setTimeout = st20; DS.autoPicks = auto20;
    } else if (test === 'xp1005') {
      // 10-05 (RULED, Griz: "count guests as 'standing' for xp."): the guests stand in the XP split and bank nothing (js/battle.js finish: the divisor is the
      // four standing plus each guest fielded and not down at the end; js/events.js EV.fedXp: the landlord's pool the same). A won fight with the foes put down
      // at the first frame: the pool is the foes' XP (halved if Pyro drew the white mace), each of the four gains its share, a guest's own XP does not move;
      // the dialog's own line is read off DS.say
      var said1005 = [], say1005 = DS.say;
      DS.say = function (t) { said1005.push(DS.stripCodes(Array.isArray(t) ? t.join(' ') : String(t))); return say1005.apply(this, arguments); };
      try {
        var xpOf = function (h) { return h.xp; };
        var fight1005 = function (tag, guestIds, o, mutate, div, soloIdx) {
          SETUP(5); DS.lastError = null;
          guestIds.forEach(function (id) { DS.EV.addGuest(id); });
          var four = DS.G.party, guests = DS.G.guests || [];
          T.startFight(['ogre', 'ogre'], o);
          for (var w1005 = 0; w1005 < 400 && !DS.find('battle'); w1005++) T.step(1);
          var b = DS.find('battle');
          if (!b) { check(tag + ': no battle came up', false); return; }
          b.intro = 0; b.heroes.forEach(function (u) { u.h.maxhp = u.h.hp = Math.max(u.h.hp, 400); });
          var fielded = b.heroes.filter(function (u) { return u.guest; }).length;
          if (mutate) mutate(b);
          var before = four.map(xpOf), gBefore = guests.map(function (x) { return x.h.xp; });
          var pool = b.foes.reduce(function (s, f) { return s + (f.m.xp || 0); }, 0);
          b.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); said1005.length = 0;
          drive({}, 3000);
          if (b.xpHalf) pool = Math.floor(pool / 2);
          var each = Math.floor(pool / div), gain = four.map(function (h, i) { return h.xp - before[i]; });
          var gStill = guests.every(function (x, i) { return x.h.xp === gBefore[i]; }), line = said1005.filter(function (s) { return /Each fighter standing gains/.test(s); })[0] || '';
          var okGain = soloIdx != null ? gain.every(function (n, i) { return n === (i === soloIdx ? each : 0); }) : gain.every(function (n) { return n === each; });
          check(tag + ': ' + fielded + ' guest(s) fielded, a pool of ' + pool + ' by ' + div + ' is ' + each + '; the four gained ' + gain.join('/') + ', the guests\' own XP unmoved (' + gStill + '), "' + line + '", ' + out.result,
            okGain && gStill && new RegExp('gains ' + each + ' XP').test(line) && /^done/.test(out.result || ''));
        };
        fight1005('no guest walking (the four split it)', [], {}, null, 4);
        fight1005('Pyro walking (five standing: the four and the king)', ['pyro'], {}, null, 5);
        fight1005('Pyro and Ingrith walking (six standing)', ['pyro', 'ingrith'], {}, null, 6);
        fight1005('Ingrith down at the end (a guest not standing is not counted)', ['ingrith'], {}, function (bb) { var gu = bb.heroes.filter(function (u) { return u.guest; })[0]; gu.h.hp = 0; gu.h.ko = true; }, 4);
        fight1005('a noGuests fight (the guest was never fielded)', ['ingrith'], { noGuests: true }, null, 4);
        fight1005('a solo fight (one hero\'s, the guest not fielded)', ['pyro'], { solo: 0 }, null, 1, 0);
        // the landlord fed from the bucket (EV.fedXp): once, a quarter again the otyugh's XP, shared as a fight's is
        var fed1005 = function (tag, guestIds, mutate, div) {
          SETUP(5); DS.lastError = null;
          guestIds.forEach(function (id) { DS.EV.addGuest(id); });
          if (mutate) mutate(DS.G);
          DS.G.flags.otyughFed = 1; delete DS.G.flags.otyughFedXp;
          var four = DS.G.party, guests = DS.G.guests || [], before = four.map(xpOf), gBefore = guests.map(function (x) { return x.h.xp; });
          var pool = Math.round(1.25 * DS.DATA.monsters.otyugh.xp), each = Math.floor(pool / div);
          said1005.length = 0;
          DS.run(function* () { yield* DS.EV.fedXp(); }); T.step(2);
          for (var s1005 = 0; s1005 < 600; s1005++) {
            var tp = DS.top();
            if (tp && tp.kind === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); } else T.step(1);
            if (!DS.scriptActive() && !(DS.top() && DS.top().kind === 'dialog')) break;
          }
          var gain = four.map(function (h, i) { return h.xp - before[i]; }), gStill = guests.every(function (x, i) { return x.h.xp === gBefore[i]; });
          check(tag + ': a pool of ' + pool + ' by ' + div + ' is ' + each + '; the four gained ' + gain.join('/') + ', the guests\' own XP unmoved (' + gStill + '), once (otyughFedXp ' + DS.G.flags.otyughFedXp + '), "' + said1005.join(' | ').slice(0, 90) + '"',
            gain.every(function (n) { return n === each; }) && gStill && DS.G.flags.otyughFedXp === 1 && !DS.lastError);
        };
        fed1005('the landlord fed, no guest walking', [], null, 4);
        fed1005('the landlord fed, Ingrith walking', ['ingrith'], null, 5);
        fed1005('the landlord fed, Ingrith down', ['ingrith'], function (gg) { gg.guests[0].h.hp = 0; gg.guests[0].h.ko = true; }, 4);
      } finally { DS.say = say1005; }
    } else if (test === 'battle1006') {
      // the 8-bit battle lane (handoff-2026-10-04-the-8-bit-battle-and-its-hands.md), built 10-06: one case an item; a case that throws is a failed case
      var cases6 = [], rnd0 = Math.random;
      function laneCase(name, fn) {
        var before = out.checks.length;
        DS.seedDice(1006); // (each case on the same dice every run)
        try { fn(); } catch (e) { check(name + ': threw ' + String(e && e.stack || e).slice(0, 240), false); }
        Math.random = rnd0; DS.rng = rnd0;
        cases6.push({ name: name, ok: out.checks.slice(before).every(function (c) { return c.indexOf('ok') === 0; }) });
      }
      // §2.7 the dice off the particles (review A5's 8-bit half): one seeded fight fought twice, the second with Math.random another stream entirely -- the
      // particles, the shake, the swarm draw from it -- says the same lines, so an effect or a frame's timing never moves a seeded run
      laneCase('the dice off the particles', function () {
        function fightLog(noisy) {
          SETUP(5); DS.rng = DS.mulberry32(1006); // (the seed set by hand, not DS.seedDice: on the old core.js this reads RED for the right reason, the dice on Math.random)
          if (noisy) { var k = 0; Math.random = function () { k++; return (k * 0.6180339887) % 1; }; }
          T.startFight(['ogre', 'goblin', 'goblin']); drive({}, 4000);
          Math.random = rnd0;
          return (T.blog || []).join(' / ');
        }
        var a = fightLog(false), b = fightLog(true), n = a.split(' / ').length;
        check('the same seed, Math.random another stream: the fight said the same ' + n + ' lines (' + (a === b) + ')' + (a === b ? '' : ' -- first apart at "' + a.split(' / ').filter(function (l, i) { return l !== b.split(' / ')[i]; })[0] + '"'), a === b && n > 10);
        check('DS.seedDice seeds the dice alone: two seeded runs of ten d20 the same (' + (function () { DS.seedDice(5); var x = []; for (var i = 0; i < 10; i++) x.push(DS.d(20)); DS.seedDice(5); Math.random(); DS.fxInt(9); var y = []; for (var j = 0; j < 10; j++) y.push(DS.d(20)); return x.join(',') === y.join(',') ? x.join(',') : x.join(',') + ' vs ' + y.join(','); })() + ')', (function () { DS.seedDice(5); var x = []; for (var i = 0; i < 10; i++) x.push(DS.d(20)); DS.seedDice(5); var y = []; for (var j = 0; j < 10; j++) y.push(DS.d(20)); return x.join(',') === y.join(','); })());
      });
      function runGen(gen) { var r = gen.next(); while (!r.done) r = gen.next(); return r.value; } // (a battle generator run through, its frame waits ignored: the lines are instant here)
      function pinD20(seq) { var q = seq.slice(); DS.rng = function () { return q.length ? (q.shift() - 0.5) / 20 : 0.5; }; } // (the next d20s, in order)
      // §2.6 the 8-bit's small SRD misses: Fey Ancestry read (advantage on a save against being charmed: the drow's sheets, an elf's blood), Mislead's double on the
      // spell's own clock and concentration, Mirror Image's three a minute (two-books law 5). The oozes' charmed landed in f6e5109
      laneCase('the small SRD misses', function () {
        SETUP(9); T.startFight(['drow', 'goblin']); for (var w0 = 0; w0 < 200 && !DS.find('battle'); w0++) T.step(1);
        var b = DS.find('battle'), drow = b.foes.filter(function (f) { return f.id === 'drow'; })[0], gob = b.foes.filter(function (f) { return f.id === 'goblin'; })[0];
        function sv(u, opt) { pinD20([2, 19]); var s = b.save(u, 'wis', 15, opt); DS.rng = rnd0; return s.nat; }
        var a1 = sv(drow, { charm: true }), a2 = sv(drow, {}), a3 = sv(gob, { charm: true });
        check('Fey Ancestry: the drow against a charm keeps the better of 2 and 19 (' + a1 + '), against anything else the first (' + a2 + '); a goblin against a charm the first (' + a3 + ')', a1 === 19 && a2 === 2 && a3 === 2);
        var oozes = ['grayooze', 'ochrejelly', 'cube', 'pudding'].filter(function (id) { return ((DS.DATA.monsters[id] || {}).condImmune || []).indexOf('charmed') < 0; });
        check('the four oozes immune to charm by the SRD (f6e5109): ' + (oozes.length ? 'not ' + oozes.join(', ') : 'all four'), !oozes.length);
        var au = b.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0], h = au.h, st = { actions: 1, bonus: 1 };
        h.slots = [4, 3, 3, 3, 2]; h.slotsMax = h.slots.slice();
        runGen(b.castSpell(au, DS.DATA.spells.mislead, st));
        var c1 = { img: au.images, dbl: !!au.conds.double, inv: !!au.conds.invisible, conc: au.conc && au.conc.id };
        delete au.conds.invisible; // (his attack ends the invisibility: heroAttack's own line)
        runGen(b.endTurn(au)); var c2 = { img: au.images, conc: au.conc && au.conc.id };
        for (var i = 0; i < 9; i++) runGen(b.endTurn(au));
        var c3 = { img: au.images, dbl: !!au.conds.double, conc: !!au.conc };
        check('Mislead: invisible, a double and its concentration (' + JSON.stringify(c1) + '); he strikes and the double stays, the spell held (' + JSON.stringify(c2) + '); ten rounds on, the double gone with it (' + JSON.stringify(c3) + ')',
          c1.img === 1 && c1.dbl && c1.inv && c1.conc === 'mislead' && c2.img === 1 && c2.conc === 'mislead' && c3.img === 0 && !c3.dbl && !c3.conc);
        runGen(b.castSpell(au, DS.DATA.spells.mislead, st)); var d1 = au.images; b.dropConc(au);
        check('Mislead let go (a blow, a new spell): the double goes with it (' + d1 + ' then ' + au.images + ')', d1 === 1 && au.images === 0);
        runGen(b.castSpell(au, DS.DATA.spells.mirrorimage, st)); var m1 = au.images, said0 = T.blog.length;
        for (var j = 0; j < 9; j++) runGen(b.endTurn(au));
        var m9 = au.images; runGen(b.endTurn(au)); var m10 = au.images, line = T.blog.slice(said0).filter(function (l) { return /images fade/.test(l); })[0];
        check('Mirror Image: three (' + m1 + '), nine rounds on still ' + m9 + ', the tenth gone (' + m10 + '): "' + line + '"', m1 === 3 && m9 === 3 && m10 === 0 && !!line);
        b.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); drive({}, 1500);
      });
      // §2.4 the floor's last holes (todo 1.4): a map that throws as a save loads goes in at the start with a line, a start that throws too goes to the title, and a
      // square off its own map or in a wall is the nearest one a body stands on. The console is held: the errors here are the ones the floor means to write
      laneCase('a load that throws, a square off the map', function () {
        var err0 = console.error, warn0 = console.warn, onEnter0 = DS.EV.onEnter, errs = [], warns = [], st = DS.DATA.config.start;
        console.error = function () { errs.push(Array.prototype.map.call(arguments, String).join(' ')); }; console.warn = function () { warns.push(Array.prototype.join.call(arguments, ' ')); };
        try {
          SETUP(5); var save0 = JSON.parse(JSON.stringify(DS.G)); save0.map = 'gulch'; save0.x = 33; save0.y = 8; save0.dir = 'right';
          function load(s, bad) { DS.lastError = null; DS.EV.onEnter = function (id, F) { if (bad.indexOf(id) >= 0) throw new Error('boom in ' + id); return onEnter0 && onEnter0.apply(this, arguments); }; errs = []; warns = []; var raised = null; try { DS.startFrom(JSON.parse(JSON.stringify(s))); } catch (e) { raised = e; } DS.EV.onEnter = onEnter0; return raised; }
          var r1 = load(save0, ['gulch']), said = [];
          for (var i = 0; i < 200 && DS.scriptActive(); i++) { var tp = DS.top(); if (tp && tp.kind === 'dialog') { said.push(DS.stripCodes(tp.pages[tp.p].lines.join(' '))); tp.chars = tp.pageLen(); T.tapf('a'); } else T.step(1); }
          check('a map that throws as the save loads: no throw out (' + !r1 + '), the field up at the start (' + (DS.field && DS.field.map.id) + ' ' + DS.G.x + ',' + DS.G.y + ', top ' + (DS.top() && DS.top().kind) + '), the console told (' + errs.length + ': ' + (errs[0] || '').slice(0, 80) + '), the player told ("' + said.join(' | ') + '")',
            !r1 && DS.top() && DS.top().kind === 'field' && DS.field.map.id === st.map && DS.G.x === st.x && DS.G.y === st.y && errs.length === 1 && /gulch threw/.test(errs[0]) && said.length === 1 && /would not open/.test(said[0]));
          var r2 = load(save0, ['gulch', st.map]);
          check('the start throws too: no throw out (' + !r2 + '), the title up (' + (DS.top() && DS.top().kind) + '), the console told twice (' + errs.length + ')', !r2 && DS.top() && DS.top().kind === 'title' && errs.length === 2);
          var s3 = JSON.parse(JSON.stringify(save0)); s3.x = 400; s3.y = 400; load(s3, []);
          var m3 = DS.field.map, t3 = m3.at(DS.G.x, DS.G.y);
          check('a square off its own map (400,400): on ' + m3.id + ' at ' + DS.G.x + ',' + DS.G.y + ' (' + t3 + '), the console told ("' + (warns[0] || '').slice(0, 90) + '")', m3.id === 'gulch' && !!t3 && DS.TILES[t3].pass && warns.some(function (w) { return /off the map/.test(w); }));
          var mg = DS.getMap('gulch'), wall = null;
          for (var y = 1; y < mg.h - 1 && !wall; y++) for (var x = 1; x < mg.w - 1 && !wall; x++) { var t = mg.at(x, y); if (t && !DS.TILES[t].pass && [[0, 1], [0, -1], [1, 0], [-1, 0]].some(function (d) { var q = mg.at(x + d[0], y + d[1]); return q && DS.TILES[q].pass; })) wall = { x: x, y: y, t: t }; }
          var s4 = JSON.parse(JSON.stringify(save0)); s4.x = wall.x; s4.y = wall.y; load(s4, []);
          var d4 = Math.abs(DS.G.x - wall.x) + Math.abs(DS.G.y - wall.y), t4 = DS.field.map.at(DS.G.x, DS.G.y);
          check('a square in a wall (' + wall.t + ' at ' + wall.x + ',' + wall.y + '): moved ' + d4 + ' to ' + DS.G.x + ',' + DS.G.y + ' (' + t4 + ')', d4 === 1 && DS.TILES[t4].pass && warns.some(function (w) { return /no square to stand on/.test(w); }));
          load(save0, []); check('a good save stays where it was (' + [DS.field.map.id, DS.G.x, DS.G.y].join(',') + ', ' + warns.length + ' warnings)', DS.field.map.id === 'gulch' && DS.G.x === 33 && DS.G.y === 8 && !warns.length);
        } finally { console.error = err0; console.warn = warn0; DS.EV.onEnter = onEnter0; }
      });
      // §2.3 what a story fight carries in the 8-bit battle (todo 1.3; till 10-20 "what a grid crash's fallback carries" -- the fallback is the only path since, js/embed.js,
      // so the grid's message and its stale square and measure are gone from the check): no frame; in the wet's fight with the landlord in it the bucket feeds it as the
      // grid's USE BUCKET does (otyughFed, the stream's rumour, not dead, no kill XP); elsewhere it is refused and kept; and a story fight fields Pyro on his own 8-bit
      // measure (js/pyro.js): one swing, then the white mace and the halved XP when one of the four is down (the Skylights' fight till 10-20; a troll on the road now)
      laneCase('a story fight in the 8-bit battle: what it carries', function () {
        var set0 = window.setTimeout, clr0 = window.clearTimeout, warn0 = console.warn, timers = [];
        function crash(list, o, before) { // (the name kept from the fallback's days: it opens the story fight, which is the 8-bit battle)
          SETUP(5); DS.lastError = null; DS.paused = false; T.res = undefined; timers = [];
          window.setTimeout = function (fn, ms) { var t = { fn: fn, ms: ms }; timers.push(t); return t; }; window.clearTimeout = function (t) { if (t) t.cleared = true; };
          console.warn = function () { };
          if (before) before();
          T.startFight(list, Object.assign({ dark: false, torch: null }, o));
          for (var j = 0; j < 600 && !DS.find('battle'); j++) { var tp = DS.top(); if (tp && tp.kind === 'dialog') { tp.chars = tp.pageLen(); T.tapf('a'); } else T.step(1); }
          return document.getElementById('d16') ? null : DS.find('battle');
        }
        function flush() { timers.forEach(function (t) { if (!t.cleared && !t.ran && !t.ms) { t.ran = true; t.fn(); } }); T.step(2); }
        try {
          var b = crash(['otyugh'], { deep16: 'wet', wake: 'rim', bg: 'wet' }, function () { DS.G.give('bucket', 1); });
          check('the wet\'s fight: the 8-bit battle has it (' + !!b + ', fromDeep ' + !!(b && b.fromDeep) + '), no frame (' + !document.getElementById('d16') + ')', !!b && !b.fromDeep && !document.getElementById('d16'));
          var xp0 = DS.G.party.map(function (h) { return h.xp; }).join();
          drive({ barley: ['ITEM', 'Carrion Bucket'] }, 3000); flush();
          var xp1 = DS.G.party.map(function (h) { return h.xp; }).join();
          var fl = DS.G.flags, said1 = (T.blog || []).join(' / ');
          check('the bucket to the landlord in the fallback: ' + T.res + ', otyughFed ' + fl.otyughFed + ', the stream heard ' + fl['heard:r-stream'] + ', otyughDead ' + !!fl.otyughDead + ', the bucket x' + DS.G.count('bucket') + ', "' + ((said1.match(/[^/]*settles\.[^/]*/) || [''])[0]).trim() + '", the pictures ' + /chimney full of wings/.test(said1) + ', the XP banked ' + (xp0 === xp1 ? 'none here (the fed XP is the wet\'s way out)' : xp0 + ' to ' + xp1),
            T.res === 'win' && fl.otyughFed === 1 && fl['heard:r-stream'] === 1 && !fl.otyughDead && DS.G.count('bucket') === 0 && /The landlord takes it, and settles\./.test(said1) && /chimney full of wings/.test(said1) && xp0 === xp1);
          var b2 = crash(['ochrejelly'], { deep16: 'wet', wake: 'jelly', bg: 'wet' }, function () { DS.G.give('bucket', 1); });
          var bar = b2 && b2.heroes[0], got = b2 && runGen(b2.useItem(bar, 'bucket')), lastLine = (T.blog || []).slice(-1)[0];
          check('the bucket where no landlord stands (the jelly\'s fight): refused (' + got + '), "' + lastLine + '", kept x' + DS.G.count('bucket') + ', nothing fed (' + !!DS.G.flags.otyughFed + ')', got === false && /Nothing here takes it/.test(lastLine) && DS.G.count('bucket') === 1 && !DS.G.flags.otyughFed);
          b2.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); drive({}, 1500); flush();
          var b3 = crash(['troll'], { deep16: 'trolls', canRun: false }, function () { DS.EV.addGuest('pyro'); });
          var py = b3 && b3.heroes.filter(function (x) { return x.guest && x.h.script === 'measure'; })[0], n0 = (T.blog || []).length;
          if (py) runGen(b3.guestTurn(py));
          var swing = (T.blog || []).slice(n0).filter(function (l) { return /\bPyro (hits|attacks)\b/.test(l); }); // (a crit's line starts "Critical! ")
          b3.heroes[0].h.hp = 0; b3.heroes[0].h.ko = true; runGen(DS.scripts8.watch(b3));
          check('a story fight with the king: Pyro walks in the 8-bit battle on his own measure (' + !!py + '), one swing a turn (' + swing.length + ': "' + (swing[0] || '') + '"), Barley down and the white mace drawn (phase ' + (b3.pyro8 && b3.pyro8.phase) + ', the XP halved ' + !!b3.xpHalf + ')',
            !!py && swing.length === 1 && !!b3.pyro8 && b3.pyro8.phase === 2 && b3.xpHalf === true);
          b3.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); b3.over = 'win'; drive({}, 1500); flush();
        } finally { window.setTimeout = set0; window.clearTimeout = clr0; console.warn = warn0; }
      });
      // §2.1 the guest turn learns the hand (todo 3.2): at two or more foes the highest damaging area spell it has a slot for, a cone or a line at the front foe and no
      // picker opened; at one foe the weapon; under a roost no fire or thunder; and the rogue's Sneak Attack through the swing, as FIGHT has it
      laneCase('the guest turn casts and sneaks', function () {
        function guestFight(list, o, who) {
          SETUP(5); T.startFight(list, o || {}); for (var w0 = 0; w0 < 200 && !DS.find('battle'); w0++) T.step(1);
          var b = DS.find('battle'), u = b.heroes.filter(function (x) { return x.h.id === who; })[0]; u.guest = true; return { b: b, u: u };
        }
        function lines(n0) { return (T.blog || []).slice(n0); }
        function done(b) { b.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); b.heroes.forEach(function (x) { x.guest = false; }); drive({}, 1500); }
        var A = guestFight(['goblin', 'goblin', 'goblin'], {}, 'aurdin'), sl0 = A.u.h.slots.slice(), n0 = (T.blog || []).length, top0 = DS.top();
        runGen(A.b.guestTurn(A.u)); var L1 = lines(n0), cast1 = (L1.filter(function (l) { return / casts /.test(l); })[0] || ''), sp1 = A.b.areaSpell ? null : null;
        var spent = A.u.h.slots.map(function (n, i) { return sl0[i] - n; }), hitN = L1.filter(function (l) { return /Goblin.*(is caught|resists)|is defeated/.test(l); }).length;
        check('three goblins, Aurdin a guest: "' + cast1 + '" (slots spent ' + JSON.stringify(spent) + '), ' + hitN + ' lines on the goblins, no picker opened (top ' + (DS.top() && DS.top().kind) + ')',
          /^Aurdin casts (Fireball|Shatter|Burning Hands|Lightning Bolt)!$/.test(cast1) && spent.reduce(function (s, x) { return s + x; }, 0) === 1 && hitN >= 2 && DS.top() === top0);
        done(A.b);
        var B = guestFight(['goblin'], {}, 'aurdin'), sl1 = B.u.h.slots.slice(); n0 = (T.blog || []).length;
        runGen(B.b.guestTurn(B.u)); var L2 = lines(n0);
        check('one goblin: the weapon, no spell ("' + L2.join(' / ').slice(0, 120) + '", slots ' + JSON.stringify(B.u.h.slots) + ')', !L2.some(function (l) { return / casts /.test(l); }) && JSON.stringify(B.u.h.slots) === JSON.stringify(sl1) && L2.some(function (l) { return /^(Critical! )?Aurdin (hits|attacks)/.test(l); }));
        done(B.b);
        var C = guestFight(['goblin', 'goblin', 'goblin'], { roost: true }, 'aurdin'), ar = C.b.areaSpell(C.u.h); n0 = (T.blog || []).length;
        runGen(C.b.guestTurn(C.u)); var L3 = lines(n0).join(' / ');
        check('under a roost: no fire or thunder (' + (ar ? ar.name + ', ' + ar.el : 'nothing') + '), the roost undisturbed (usedFire ' + !!C.b.usedFire + ', over ' + C.b.over + ')', (!ar || (ar.el !== 'fire' && ar.el !== 'thunder')) && !C.b.usedFire && C.b.over !== 'roost');
        done(C.b);
        var V = guestFight(['goblin', 'goblin'], {}, 'vivian'); n0 = (T.blog || []).length;
        DS.rng = function () { return 0.97; }; // (every die near its top: the swing lands)
        try { runGen(V.b.guestTurn(V.u)); } finally { DS.seedDice(1006); }
        var L4 = lines(n0).join(' / ');
        check('Vivian a guest, the party beside her: Sneak Attack on the swing ("' + L4.slice(0, 140) + '")', /Vivian hits Goblin[^.]* for \d+\..*Sneak Attack!/.test(L4));
        done(V.b);
      });
      // §2.1, his "1 lean" (10-06): a guest pours a pack potion only to wake one of the four who is down (the plain one first; never on one merely under half; a
      // cleric's word before the pack), and Dace casts Sleep at a group it can take (two awake; not at the dead; not at one)
      laneCase('the guest\'s potion and Dace\'s Sleep', function () {
        function withGuest(id, list, prep) {
          SETUP(5); DS.EV.addGuest(id); if (prep) prep(DS.G);
          T.startFight(list); for (var w0 = 0; w0 < 200 && !DS.find('battle'); w0++) T.step(1);
          var b = DS.find('battle'); return { b: b, g: b.heroes.filter(function (x) { return x.guest && x.h.id === id; })[0], bar: b.heroes.filter(function (x) { return x.h.id === 'barley'; })[0] };
        }
        function said(n0) { return (T.blog || []).slice(n0).join(' / '); }
        function done(b) { b.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); drive({}, 1500); }
        var A = withGuest('brann', ['ogre']), p0 = DS.G.count('potion'), n0 = (T.blog || []).length;
        A.bar.h.hp = 0; A.bar.h.ko = true;
        runGen(A.b.guestTurn(A.g)); var s1 = said(n0);
        check('Barley down, Brann a guest: the pack\'s potion wakes him ("' + s1.slice(0, 90) + '"), potions ' + p0 + ' to ' + DS.G.count('potion') + ', Barley ' + A.bar.h.hp + ' HP', /Brann uses Potion of Healing\. Barley \+\d+ HP/.test(s1) && DS.G.count('potion') === p0 - 1 && A.bar.h.hp > 0 && !A.bar.h.ko);
        done(A.b);
        var B = withGuest('brann', ['ogre']); p0 = DS.G.count('potion'); n0 = (T.blog || []).length;
        B.bar.h.hp = 3;
        runGen(B.b.guestTurn(B.g)); var s2 = said(n0);
        check('Barley at 3 HP, standing: Brann swings, the pack untouched ("' + s2.slice(0, 60) + '", potions ' + DS.G.count('potion') + ' of ' + p0 + ')', DS.G.count('potion') === p0 && /Brann (hits|attacks)/.test(s2) && !/uses Potion/.test(s2));
        done(B.b);
        var C = withGuest('brann', ['ogre'], function (g) { g.inv = g.inv.filter(function (s) { return !/potion/.test(s.id); }); }), k0 = DS.G.count('kit'); n0 = (T.blog || []).length;
        C.bar.h.hp = 0; C.bar.h.ko = true;
        runGen(C.b.guestTurn(C.g)); var s3 = said(n0);
        check('Barley down, no potion in the pack (kits only): Brann swings, no kit ("' + s3.slice(0, 60) + '", kits ' + k0 + ' to ' + DS.G.count('kit') + ')', /Brann (hits|attacks)/.test(s3) && !/works the/.test(s3) && DS.G.count('kit') === k0);
        done(C.b);
        var I = withGuest('ingrith', ['ogre']); p0 = DS.G.count('potion'); n0 = (T.blog || []).length;
        I.bar.h.hp = 0; I.bar.h.ko = true;
        runGen(I.b.guestTurn(I.g)); var s4 = said(n0);
        check('Barley down, Ingrith a guest: her word first, the pack untouched ("' + s4.slice(0, 70) + '", potions ' + DS.G.count('potion') + ' of ' + p0 + ')', /speaks a word to Barley/.test(s4) && DS.G.count('potion') === p0);
        done(I.b);
        var D = withGuest('dace', ['goblin', 'goblin', 'goblin']), ds0 = D.g.h.slots.slice(); n0 = (T.blog || []).length;
        runGen(D.b.guestTurn(D.g)); var s5 = said(n0);
        check('Dace at three goblins: "' + (s5.match(/Dace casts [^!]*!/) || [''])[0] + '", ' + D.b.foes.filter(function (f) { return f.conds.asleep; }).length + ' asleep, slots ' + JSON.stringify(ds0) + ' to ' + JSON.stringify(D.g.h.slots), /Dace casts Sleep!/.test(s5) && D.g.h.slots[0] === ds0[0] - 1);
        done(D.b);
        var und = Object.keys(DS.DATA.monsters).filter(function (k) { return (DS.DATA.monsters[k].tags || [])[0] === 'undead'; })[0];
        var E = withGuest('dace', [und, und]); n0 = (T.blog || []).length; runGen(E.b.guestTurn(E.g)); var s6 = said(n0);
        var F1 = withGuest('dace', ['goblin']); var n1 = (T.blog || []).length; runGen(F1.b.guestTurn(F1.g)); var s7 = said(n1);
        check('Dace at two ' + und + 's: no Sleep ("' + s6.slice(0, 50) + '"); at one goblin: no Sleep ("' + s7.slice(0, 50) + '")', !/casts Sleep/.test(s6) && !/casts Sleep/.test(s7) && /Dace (hits|attacks)/.test(s7));
        done(F1.b);
      });
      // §2.2 the prone cue (his "2 for now as placeholder"): a prone body lies (u.lie to 1 in five frames, a thud as it lands); acting it pops up (a foe's lunge,
      // a hero's swing), then drops back with the thud; standing up it rises; and the battle draws every step of it
      laneCase('the prone cue', function () {
        SETUP(5); T.startFight(['ogre', 'goblin']); for (var w0 = 0; w0 < 200 && !DS.find('battle'); w0++) T.step(1);
        var b = DS.find('battle'), og = b.foes[0], bar = b.heroes[0], thuds = 0, sfx0 = DS.audio.sfx, drawErr = null;
        DS.audio.sfx = function (k) { if (k === 'bump') thuds++; };
        function ticks(n) { for (var i = 0; i < n; i++) { b.tick(); try { b.draw(DS.ctx); } catch (e) { drawErr = drawErr || String(e); } } }
        try {
          og.conds.prone = true; ticks(1); var mid = og.lie; ticks(5); var lay = og.lie, t1 = thuds;
          og.off = 8; ticks(3); var up = og.lie; og.off = 0; ticks(5); var back = og.lie, t2 = thuds;
          bar.conds.prone = true; ticks(6); var hl = bar.lie; bar.pose = 'act'; ticks(3); var hu = bar.lie; bar.pose = null; ticks(6); var hb = bar.lie;
          delete og.conds.prone; ticks(3); var risen = og.lie;
          check('a prone ogre: ' + mid.toFixed(1) + ' after a frame, lying (' + lay + ') with a thud (' + t1 + '); its lunge pops it up (' + up + '), it drops back (' + back + ') with another (' + t2 + '); up again it stands (' + risen + ')', mid > 0 && mid < 1 && lay === 1 && t1 === 1 && up === 0 && back === 1 && t2 === 2 && risen === 0);
          check('a prone Barley: lying (' + hl + '), his swing pops him up (' + hu + '), down again after (' + hb + '); the draws threw nothing (' + (drawErr || 'none') + ')', hl === 1 && hu === 0 && hb === 1 && !drawErr);
        } finally { DS.audio.sfx = sfx0; delete og.conds.prone; delete bar.conds.prone; }
        b.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); drive({}, 1500);
        // the show's own fight (?at=prone8, js/situations.js): the sleet already falling, the four on the AI -- it plays itself, no menu opened, the foes fall
        // on the ice and swing from it
        var sit = DS.SITUATIONS && DS.SITUATIONS.prone8, menus = 0, iced = 0, steps = 0, endedAs = null;
        SETUP(5); T.res = undefined; T.startFight(['ogre', 'ogre', 'worg'], { auto: true, cloud: { kind: 'sleet', dc: 30, save: 'dex' } }); for (var w1 = 0; w1 < 200 && !DS.find('battle'); w1++) T.step(1);
        for (; steps < 20000 && DS.find('battle') && !DS.lastError; steps++) {
          var tp = DS.top(), bb = DS.find('battle');
          if (tp && (tp.kind === 'menu' || tp.kind === 'target')) { menus++; T.tapf('b'); }
          else if (tp && tp.kind === 'dialog') { tp.chars = tp.pageLen(); T.tapf('a'); }
          else T.step(1);
          if (bb) endedAs = bb.over;
        }
        iced = (T.blog || []).filter(function (l) { return /goes down on the ice, and fights on from the ground/.test(l); }).length;
        check('the show ?at=prone8 (the lines instant here, so the lying is the tick case above): its record (' + !!(sit && sit.start) + '), the fight ran itself to ' + (endedAs || 'no end') + ' in ' + steps + ' steps with ' + menus + ' menus, ' + iced + ' falls on the ice' + (DS.lastError ? ' ERR ' + DS.lastError : ''),
          !!(sit && sit.start) && menus === 0 && iced >= 2 && !!endedAs && !DS.lastError);
      });
      var ok6 = cases6.filter(function (c) { return c.ok; }).length;
      T.blog = []; out.log.push('battle1006: ' + ok6 + '/' + cases6.length + ' cases' + (ok6 === cases6.length ? ' clean' : ': ' + cases6.filter(function (c) { return !c.ok; }).map(function (c) { return c.name; }).join('; ') + ' went wrong'));
    } else if (test === 'story1006') {
      // THE STORY WALK (10-06, the 8-bit battle lane §2.8; review C15, rec 9 -- Griz, 10-06: "3 dunno what that means - trusting your lean"): the expansion's spine
      // beat by beat (js/situations.js STEPS, the walker's DS.situation), and at each the door the game itself points at -- the journal's pinned quest, its step
      // whose `if` holds (content/quests.json) -- checked: there (the NPC or trigger on its map, its cond true), reachable from Silverton across the maps as the
      // flags lay them (the walker's rules: tiles, live warps and exits, doors, solid NPCs and chests in the way), and played -- its script run with every
      // question answered by its first choice and every fight won (a stub battle) -- to see that the story moves. A door missing, shut or out of reach is a
      // soft-lock: FAIL. A door played that moves nothing is a NOTE (some only point the way: "do some good in the halls while he mends"). And every flag the
      // scripts read on the way is in content/flags.json (a Proxy on the flags: the reads the build cannot see, f.captainHome through an alias)
      var REG = null; try { var xr = new XMLHttpRequest(); xr.open('GET', '../content/flags.json', false); xr.send(); REG = JSON.parse(xr.responseText); } catch (e) { out.err = 'flags.json: ' + e; }
      var QUESTS = {}; (DS.DATA.quests || []).forEach(function (q) { QUESTS[q.id] = q; });
      var EV = DS.EV, S = DS.SCRIPTS, base0 = DS.battle, fought = [], readSeen = {}, notes = [], walked = [];
      function stubWin() { DS.battle = function (o) { fought.push((o.enemies || []).join(',')); return { start: function (script) { var self = this; self.finished = true; self.result = 'win'; pending.push(function () { script.resume(self, 'win'); }); } }; }; }
      function watchFlags(G) { // (every key read through G.flags, from here on)
        var raw = G.flags; G.flags = new Proxy(raw, { get: function (t, k) { if (typeof k === 'string') readSeen[k] = (readSeen[k] || 0) + 1; return t[k]; } });
      }
      function fresh(n) { T.newGame('barley'); DS.paused = true; DS.lastError = null; DS.situation(DS.G, { base: 'lake', spine: n }); DS.G.party.forEach(function (h) { delete h.pendingChoice; }); watchFlags(DS.G); return DS.G; }
      function stepOf(q) { return DS.questStep ? DS.questStep(q) : null; } // (the game's own: the step the journal's marker follows, js/world.js)
      function live(list) { return (list || []).filter(function (t) { return DS.cond(t.cond) && !(t.once && DS.G.flags['trig:' + t.id]); }); }
      function inRect(r, x, y) { return x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3]; }
      function rectOf(t) { return t.rect || [t.x, t.y, t.w || 1, t.h || 1]; }
      // the door a step names, on its map as the flags lay it: { kind: 'npc'|'trigger'|'square', ... } or null with why
      function doorOf(step) {
        var F = DS.field; F.load(step.map, 0, 0, 'down'); var m = F.map, id = step.npc;
        if (step.trig || step.door) { // (a trigger by its id, or a door by its arg -- js/world.js stepPoint)
          var td = (m.src.triggers || []).filter(function (x) { return step.door ? x.arg === step.door : x.id === step.trig; })[0], nm = step.trig || step.door;
          if (!td) return { why: 'no trigger ' + (step.door ? 'with the arg ' : '') + nm + ' on ' + step.map };
          if (!live([td])[0]) return { why: 'its trigger ' + nm + ' is shut (cond ' + (td.cond || '-') + (td.once ? ', once' : '') + ')' };
          return { kind: 'trigger', map: step.map, rect: rectOf(td), on: td.on || 'step', t: td };
        }
        if (id) {
          var n = F.npcs.filter(function (x) { return x.id === id; })[0];
          if (n) return { kind: 'npc', map: step.map, x: n.x, y: n.y, npc: n };
          var anyN = (m.src.npcs || []).filter(function (x) { return x.id === id; })[0];
          var t = (m.src.triggers || []).filter(function (x) { return x.id === id; })[0];
          if (t) { var lt = live([t])[0]; if (!lt) return { why: 'its trigger ' + id + ' is shut (cond ' + (t.cond || '-') + (t.once ? ', once' : '') + ')' }; var r = rectOf(t); return { kind: 'trigger', map: step.map, rect: r, on: t.on || 'step', t: t }; }
          return { why: anyN ? 'the NPC ' + id + ' is not there (cond ' + (anyN.cond || '-') + ')' : 'no NPC or trigger named ' + id + ' on ' + step.map };
        }
        if (step.at) { var ax = step.at[0], ay = step.at[1], tt = live(m.src.triggers).filter(function (x) { return inRect(rectOf(x), ax, ay); })[0]
            || live(m.src.triggers).filter(function (x) { return x.on === 'use' && x.script !== 'warp' && [[0, 1], [0, -1], [1, 0], [-1, 0]].some(function (d) { return inRect(rectOf(x), ax + d[0], ay + d[1]); }); })[0]; return { kind: tt ? 'trigger' : 'square', map: step.map, rect: tt ? rectOf(tt) : [step.at[0], step.at[1], 1, 1], on: tt ? (tt.on || 'step') : 'step', t: tt || null }; }
        return { kind: 'map', map: step.map, rect: null };
      }
      // reachable from Silverton's start across the maps (the walker's rules, js-side: dev/bench8.js walk findPath), to a square beside an NPC or a use door, or in a step's rect
      function reach(door) {
        var F = DS.field, M = {}, st = DS.DATA.config.start;
        Object.keys(DS.DATA.maps).forEach(function (id) { F.load(id, 0, 0, 'down'); var m = F.map, blk = {};
          (m.src.npcs || []).forEach(function (d) { if (DS.cond(d.cond) && d.solid !== false && !d.wander) blk[d.x + ',' + d.y] = 1; });
          (m.src.chests || []).forEach(function (c) { if (DS.cond(c.cond)) blk[c.x + ',' + c.y] = 1; });
          M[id] = { m: m, tiles: m.tiles.slice(), w: m.w, h: m.h, blk: blk, trig: live(m.src.triggers), warps: live(m.src.warps) }; });
        function pass(Q, x, y) { if (x < 0 || y < 0 || x >= Q.w || y >= Q.h) return false; var t = Q.tiles[y * Q.w + x]; return !!(t && DS.TILES[t] && DS.TILES[t].pass) && !Q.blk[x + ',' + y]; }
        function goal(mp, x, y) {
          if (mp !== door.map) return false;
          if (!door.rect && door.kind !== 'npc') return true;
          if (door.kind === 'npc') return Math.abs(x - door.x) + Math.abs(y - door.y) === 1;
          if (door.on === 'use') return !inRect(door.rect, x, y) && [[0, 1], [0, -1], [1, 0], [-1, 0]].some(function (d) { return inRect(door.rect, x + d[0], y + d[1]); });
          return inRect(door.rect, x, y) || (door.kind === 'square' && [[0, 1], [0, -1], [1, 0], [-1, 0]].some(function (d) { return inRect(door.rect, x + d[0], y + d[1]); }));
        }
        var seen = {}, q = [[st.map, st.x, st.y]], key = function (p) { return p[0] + ',' + p[1] + ',' + p[2]; }; seen[key(q[0])] = 1;
        while (q.length) {
          var p = q.shift(), Q = M[p[0]]; if (!Q) continue;
          if (goal(p[0], p[1], p[2])) return true;
          [[0, -1, 'up'], [0, 1, 'down'], [-1, 0, 'left'], [1, 0, 'right']].forEach(function (d) {
            var nx = p[1] + d[0], ny = p[2] + d[1], nxt = null;
            if (nx < 0 || ny < 0 || nx >= Q.w || ny >= Q.h) { var edge = nx < 0 ? 'west' : nx >= Q.w ? 'east' : ny < 0 ? 'north' : 'south', ex = (Q.m.src.exits && Q.m.src.exits[edge]) || Q.m.src.exit; if (ex && M[ex.to]) nxt = [ex.to, ex.tx, ex.ty]; }
            else {
              var dr = Q.trig.filter(function (t) { return t.on === 'use' && t.script === 'warp' && t.to && inRect(rectOf(t), nx, ny); })[0];
              if (dr && M[dr.to]) nxt = [dr.to, dr.tx, dr.ty];
              else if (goal(p[0], nx, ny) && door.kind !== 'npc' && door.on !== 'use') nxt = [p[0], nx, ny];
              else if (pass(Q, nx, ny)) { var w = Q.warps.filter(function (x) { return x.x === nx && x.y === ny; })[0]; if (w && M[w.to]) { var at = (w.alt && w.alt[d[2]]) || w; nxt = [w.to, at.tx, at.ty]; } else nxt = [p[0], nx, ny]; }
            }
            if (nxt && !seen[key(nxt)]) { seen[key(nxt)] = 1; q.push(nxt); }
          });
        }
        return false;
      }
      // play a door: talk, or its trigger's script, or arrive on its map (its enter hook) -- every question its first choice, every fight won
      function playDoor(door) {
        var F = DS.field, said = [], fin = false, steps = 0, err = null;
        F.load(door.map, door.kind === 'npc' ? door.x : door.rect ? door.rect[0] : 1, door.kind === 'npc' ? door.y + 1 : door.rect ? door.rect[1] : 1, 'up');
        // arriving first, as a warp does (the map's enter hook: the threshold holds the road on arrival), then the door itself
        var enter = S['enter:' + door.map], act = door.kind === 'npc' ? function* () { var nn = F.npcs.filter(function (x) { return x.id === door.npc.id; })[0]; if (nn) yield* EV.talk(nn); }
          : door.t ? function* () { yield* EV.trigger(door.t, F); } : null;
        if (!enter && !act) return { said: [], err: null, none: true };
        var gen = function* () { if (enter) yield* enter(); if (act && DS.field && DS.field.map && DS.field.map.id === door.map) yield* act(); };
        var c0 = console.error; console.error = function () { err = err || Array.prototype.join.call(arguments, ' ').slice(0, 200); };
        try {
          DS.run(gen, function () { fin = true; });
          for (; steps < 6000; steps++) {
            var tp = DS.top(), k = tp && tp.kind, menu = (k === 'dialog' || k === 'menu' || k === 'popup') ? tp.menu : null;
            if (k === 'dialog') { var pg = tp.pages && tp.pages[tp.p]; if (pg) { var t = DS.stripCodes(pg.lines.join(' ')); if (said[said.length - 1] !== t) said.push(t); } }
            if (DS.lastError) { err = err || String(DS.lastError); break; }
            if (k === 'gameover') { err = 'GAME OVER'; break; }
            if (menu) { menu.i = Math.max(0, menu.items.findIndex(function (it) { return !it.disabled && !/DONATE|SUPPORT|KO-?FI/i.test(String(it.label || it)); })); T.tapf('a'); }
            else if (k === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); }
            else if (k === 'target') { tp.i = 0; T.tapf('a'); }
            else if (k === 'check') { if (tp.t > 60) T.tapf('a'); else T.step(4); }
            else if (k && k !== 'field' && k !== 'flash') { T.tapf('a'); T.step(2); }
            else T.step(1);
            if (fin && !DS.scriptActive() && (!k || k === 'field')) break;
          }
        } catch (e) { err = String(e && e.stack || e).slice(0, 300); }
        console.error = c0;
        return { said: said, err: err, steps: steps };
      }
      var STORY = ['pin', 'stairHook', 'drySeen', 'crewMet', 'crewDealt', 'clericMet', 'frontDoor', 'hookDone', 'pyroMet', 'pyroLeads', 'roadOpen', 'lamp1', 'lamp2', 'lamp3', 'heardPinned', 'captainFound', 'captainHome', 'pyroTrusts', 'petition', 'nestCrushed', 'wordBelow', 'mustered', 'raidWon', 'highwaySecured', 'pyroConsent', 'ingrithEscort', 'expansionDone', 'sealCleared', 'roperDead', 'buletteDead', 'halldorUp', 'deepholmSeen', 'torvaldMet', 'assassinsMet'];
      function storyNow() { var f = DS.G.flags, o = {}; STORY.forEach(function (k) { if (f[k]) o[k] = f[k]; }); var q = QUESTS[f.pin], s = q && stepOf(q); o._step = s ? (s.where || '').slice(0, 40) : null; return JSON.stringify(o); }
      try {
        stubWin();
        // a spine state no save can stand in: the situations split it, the game does it in one script
        // where the story goes when the journal points nowhere (read in the scripts, 10-06)
        var NEXT = { 13: 'the word from below comes at the next rest (js/deep.js EV.rest: nestCrushed and no wordBelow)', 21: 'the expansion is done (the consult)' };
        var SEAMS = { 3: 'the night crew dealt with and Ingrith come are one script (js/deep.js: both ways of dealing call EV.ingrithArrives at once): no save stands between beats 3 and 4' };
        for (var n = 0; n <= 21; n++) {
          if (SEAMS[n]) { notes.push('beat ' + n + ': a seam, not walked -- ' + SEAMS[n]); continue; }
          fresh(n);
          var pin = DS.G.flags.pin, q = QUESTS[pin], step = q ? stepOf(q) : null, door = null, row = { n: n, pin: pin || '(none)' };
          if (!pin && n === 0) { door = { kind: 'map', map: 'silverton', rect: null }; row.where = 'Silverton, the lake done: Papa comes out of his door (the map\'s enter hook)'; }
          else if (!q) { check('beat ' + n + ': the journal pins "' + pin + '", a quest content/quests.json has not got', false); continue; }
          else if (q.done && DS.cond(q.done)) { row.where = '(the journal points nowhere: ' + pin + ' is done, ' + q.done + ')'; notes.push('beat ' + n + ': the pinned quest ' + pin + ' is done (' + q.done + ') and nothing new is pinned -- the marker shows nothing' + (NEXT[n] ? '; ' + NEXT[n] : '')); walked.push(row); continue; }
          else if (!step) { check('beat ' + n + ': the pinned quest ' + pin + ' has no step whose if holds', false); continue; }
          else { row.where = step.where; door = doorOf(step); }
          if (!door || door.why) { check('beat ' + n + ' (' + pin + '): the door the journal points at -- "' + (step && step.where) + '" -- ' + (door ? door.why : 'none'), false); continue; }
          var ok = reach(door); row.reach = ok;
          if (!ok) { check('beat ' + n + ' (' + pin + '): "' + row.where + '" is out of reach from Silverton (' + door.kind + ' on ' + door.map + ')', false); continue; }
          var before = storyNow(), r = playDoor(door), after = storyNow();
          row.moved = before !== after; row.door = door.kind + ' ' + (door.npc ? door.npc.id : door.t ? door.t.id : '') + ' on ' + door.map;
          if (r.err) check('beat ' + n + ' (' + pin + '): playing "' + row.where + '" threw: ' + r.err, false);
          if (!row.moved && !r.err) notes.push('beat ' + n + ' (' + pin + ', ' + row.door + '): played, nothing moved -- "' + (r.said[0] || '').slice(0, 90) + '"');
          walked.push(row);
        }
        var unreg = Object.keys(readSeen).filter(function (k) { return REG && !(k in REG.flags) && !(k.indexOf(':') > 0 && (k.split(':')[0] + ':') in REG.families) && !/^(toJSON|constructor|hasOwnProperty|then)$/.test(k) && typeof k === 'string'; });
        check('the walk: ' + walked.length + ' of ' + (22 - Object.keys(SEAMS).length) + ' beats walked to a door that is there and in reach (' + walked.filter(function (w) { return w.moved; }).length + ' moved the story), ' + fought.length + ' fights won by the stub', walked.length === 22 - Object.keys(SEAMS).length);
        check('every flag the scripts read on the walk is in content/flags.json (' + Object.keys(readSeen).length + ' read' + (unreg.length ? '; not named: ' + unreg.join(', ') : '') + ')', REG && !unreg.length);
        out.log = out.log.concat(walked.map(function (w) { return 'beat ' + w.n + ' [' + w.pin + '] ' + (w.door || '') + (w.moved ? ' -- moved' : w.moved === false ? ' -- still' : '') + ': ' + (w.where || '').slice(0, 80); }), notes.map(function (x) { return 'NOTE ' + x; }));
      } finally { DS.battle = base0; }
    } else if (test === 'wear1007') {
      // the wearables runner's finds, folded 10-07 (the menus lane §2.5; each check failed on the code before it, a byte-exact swap of the old files): the Periapt of Proof against Poison ends a
      // poison already on the one who puts it on (js/rules.js R.ward -- a rest reads it, and the grid's sheet-to-unit, deep16/js/save.js, asks it), and the 8-bit's line for a blow of a type a worn thing
      // bars says the hero is immune to it, not "for 0"
      var rng7 = DS.rng;
      function runGen7(gen) { var r = gen.next(); while (!r.done) r = gen.next(); return r.value; }
      function pin7(seq) { var q = seq.slice(); DS.rng = function () { return q.length ? (q.shift() - 0.5) / 20 : 0.5; }; } // (the next d20s, in order)
      try {
        // 1. R.ward: the poison he carried, and the paralysis that rides on it, end on the Periapt; with nothing worn that bars it, nothing ends; a prone is no poison's
        var hw = g.hero('lymen'); hw.equip.neck = null;
        hw.conds.poisoned = { rounds: 5 }; hw.conds.paralyzed = { linked: 'poisoned' }; hw.conds.prone = true;
        var w0 = typeof R.ward === 'function' ? R.ward(hw) : null;
        check('R.ward with no Periapt: nothing ended (' + JSON.stringify(w0) + '), still poisoned ' + !!hw.conds.poisoned + ' and held ' + !!hw.conds.paralyzed, !!w0 && !w0.length && !!hw.conds.poisoned && !!hw.conds.paralyzed);
        hw.equip.neck = 'periaptpoison';
        var w1 = typeof R.ward === 'function' ? R.ward(hw) : null;
        check('the Poison Periapt put on: R.ward ended ' + JSON.stringify(w1) + ' -- poisoned ' + !!hw.conds.poisoned + ', the paralysis that rode on it ' + !!hw.conds.paralyzed + ', the prone kept ' + !!hw.conds.prone, !!w1 && w1.join() === 'poisoned' && !hw.conds.poisoned && !hw.conds.paralyzed && !!hw.conds.prone);
        // 2. a rest reads it too (R.refresh, short or long): a poison given to one wearing it is gone at the rest; taken off, it stays
        hw.conds.poisoned = { rounds: 5 }; R.refresh(hw, false);
        check('a short rest in the Periapt: poisoned ' + !!hw.conds.poisoned, !hw.conds.poisoned);
        hw.equip.neck = null; hw.conds.poisoned = { rounds: 5 }; R.refresh(hw, false);
        check('a short rest without it: poisoned stays ' + !!hw.conds.poisoned, !!hw.conds.poisoned);
        delete hw.conds.poisoned;
        // 3. the line: the crawler's feelers are poison, and on the Periapt the blow is "immune to poison" (not "for 0"); one without it is hit as ever; the blast of a poison gas the same
        SETUP(5); g = DS.G; var hp7 = g.hero('lymen'); hp7.equip.neck = 'periaptpoison';
        T.startFight(['crawler']); for (var w7 = 0; w7 < 200 && !DS.find('battle'); w7++) T.step(1);
        var b7 = DS.find('battle'), f7 = b7.foes[0], u7 = b7.heroes.filter(function (x) { return x.h.id === 'lymen'; })[0], v7 = b7.heroes.filter(function (x) { return x.h.id !== 'lymen'; })[0];
        T.blog = []; pin7([20]); runGen7(b7.foeAttack(f7, u7, f7.m.attacks.feelers)); DS.rng = rng7;
        var said7 = T.blog.filter(function (l) { return /Lymen/.test(l); }).join(' / ');
        check('the crawler\'s feelers (poison) on the Periapt: "' + said7.slice(0, 160) + '"', /immune to poison/.test(said7) && !/ for 0\b/.test(said7));
        T.blog = []; pin7([20]); runGen7(b7.foeAttack(f7, v7, f7.m.attacks.feelers)); DS.rng = rng7;
        var said8 = T.blog.filter(function (l) { return /for \d+\./.test(l); }).join(' / ');
        check('the same blow on one without it: hit for damage, no word of immunity: "' + said8.slice(0, 120) + '"', /for [1-9]\d*\./.test(said8) && !/immune/.test(said8));
        // (a sheet with no Periapt in the line's own reading: the hurt gave 0 -- immune -- only where the item is worn)
        T.blog = []; pin7([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]); runGen7(b7.special(f7, { kind: 'blast', text: 'breathes a green cloud.', targets: 'all', save: 'dex', dc: 30, dmg: '3d6', half: true, type: 'poison' })); DS.rng = rng7;
        var said9 = T.blog.filter(function (l) { return /Lymen/.test(l); }).join(' / '), said10 = T.blog.filter(function (l) { return /\d+ damage/.test(l); }).join(' / ');
        check('a poison cloud on the Periapt: "' + said9.slice(0, 120) + '"; on the others it hurts ("' + said10.slice(0, 60) + '")', /immune to poison/.test(said9) && !/\d+ damage/.test(said9) && /\d+ damage/.test(said10));
        b7.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); drive({}, 1500);
      } finally { DS.rng = rng7; }
    } else if (test === 'fixes1008') {
      // the fix session's three in the 8-bit's own battle (10-08; the story and the Pocket DM lane §2.2-2.3; each check failed on the code before it, a byte-exact swap of the old
      // files): the Cloak of Displacement by the SRD (Dace's thanks did nothing here); Uncanny Dodge's ask shows the whole blow, the extra dice too; the blade-captain's
      // Darkness and Faerie Fire each at its own chance (`pickSpecial: "each"`), the other pickers at their old rate
      var rngX = DS.rng, rollX = DS.roll;
      function runX(gen) { var r = gen.next(); while (!r.done) r = gen.next(); return r.value; }
      try {
        // 1. the cloak on Aurdin, bonded: the ogre at disadvantage; a blow lands and it falters; his turn brings it back; stunned it is suppressed; not bonded it is a cloak
        var hx = g.hero('aurdin'); hx.equip.cloak = 'cloakdisplacement'; hx.attuned = (hx.attuned || []).filter(function (id) { return id !== 'cloakdisplacement'; }).concat(['cloakdisplacement']);
        T.startFight(['ogre']); for (var wX = 0; wX < 400 && !DS.find('battle'); wX++) T.step(1);
        var bX = DS.find('battle'), oX = bX.foes[0], aX = bX.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0];
        bX.intro = 0; aX.h.maxhp = aX.h.hp = 400; aX.conds = {}; oX.conds = {};
        var c1 = bX.advantage(oX, aX, true); bX.hurt(aX, 3, 'bludgeoning', oX); var off = !!aX.conds.displaceOff, c2 = bX.advantage(oX, aX, true);
        bX.turn(aX).next(); var c3 = bX.advantage(oX, aX, true);
        aX.conds = { stunned: { rounds: 2 } }; var c4 = bX.advantage(oX, aX, true); aX.conds = {};
        hx.attuned = hx.attuned.filter(function (id) { return id !== 'cloakdisplacement'; }); var c5 = bX.advantage(oX, aX, true);
        check('the Cloak of Displacement on Aurdin: the ogre at ' + c1 + ' (want -1); a blow lands, it falters ' + off + ' and the ogre at ' + c2 + ' (want 0); his turn, ' + c3 + ' (want -1); stunned, ' + c4 + ' (want 1: suppressed, and the stunned are open to blows); not bonded, ' + c5 + ' (want 0)',
          c1 === -1 && off && c2 === 0 && c3 === -1 && c4 === 1 && c5 === 0);
        hx.equip.cloak = null;
        bX.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); drive({}, 1500);
        // 2. Uncanny Dodge: the blade-captain's shortsword (1d6+4 and 2d6 poison) at Vivian, rogue 5 -- the ask names both, and halving takes half of each
        T.startFight(['drowcaptain']); for (wX = 0; wX < 400 && !DS.find('battle'); wX++) T.step(1);
        var bY = DS.find('battle'), cY = bY.foes[0], vY = bY.heroes.filter(function (x) { return x.h.id === 'vivian'; })[0];
        bY.intro = 0; vY.h.maxhp = vY.h.hp = 400; vY.conds = {}; cY.conds = {}; vY.reaction = 1;
        var asked = null, rolled = [];
        bY.askReact = function* (t, title, opts) { asked = { title: title, right: opts[0].right }; return true; };
        DS.roll = function (e, o) { var v = rollX(e, o); rolled.push([e, v]); return v; };
        DS.rng = function () { return 0.9; }; // (every die near its top, the d20 a 19: a hit, no critical)
        var hpY = vY.h.hp; runX(bY.foeAttack(cY, vY, cY.m.attacks.shortsword)); DS.rng = rngX; DS.roll = rollX;
        var mainY = (rolled.filter(function (r) { return r[0] === cY.m.attacks.shortsword.dmg; })[0] || [])[1], xY = (rolled.filter(function (r) { return r[0] === cY.m.attacks.shortsword.extra; })[0] || [])[1];
        var wantAll = (mainY || 0) + (xY || 0), wantHalf = Math.floor((mainY || 0) / 2) + Math.floor((xY || 0) / 2);
        check('Uncanny Dodge asked "' + (asked && asked.title) + '" / "' + (asked && asked.right) + '" for ' + mainY + ' + ' + xY + ' poison (want ' + wantAll + ' damage, take ' + wantHalf + '); she lost ' + (hpY - vY.h.hp),
          !!asked && mainY != null && xY != null && asked.title === 'UNCANNY DODGE? ' + wantAll + ' damage' && asked.right === 'take ' + wantHalf && hpY - vY.h.hp === wantHalf);
        // 3. the blade-captain's specials: each by its own 30% (the other first half the time: about 0.255 a turn with both up; 0.3 alone) -- at random after the first's 30% they came 0.15;
        // a plain picker (pickSpecial: true) keeps the first's chance for any of them
        var mC = cY.m, spC = (mC.specials || []).slice(), N = 6000, nD = 0, nF = 0, nD1 = 0, nP = 0, iC;
        for (iC = 0; iC < N; iC++) { var pk = bY.pickSpecial(mC, spC); if (pk && pk.id === 'darkness') nD++; else if (pk && pk.id === 'faeriefire') nF++; }
        for (iC = 0; iC < N; iC++) if (bY.pickSpecial(mC, spC.filter(function (s) { return s.id === 'darkness'; }))) nD1++;
        for (iC = 0; iC < N; iC++) if (bY.pickSpecial({ pickSpecial: true }, [{ id: 'a', chance: 0.4 }, { id: 'b' }])) nP++;
        check('the blade-captain (' + mC.pickSpecial + '): Darkness ' + (nD / N).toFixed(3) + ' and Faerie Fire ' + (nF / N).toFixed(3) + ' of turns with both up (want about 0.255 each), Darkness alone ' + (nD1 / N).toFixed(3) + ' (want 0.3); a plain picker any ' + (nP / N).toFixed(3) + ' (want 0.4)',
          nD / N > 0.22 && nD / N < 0.29 && nF / N > 0.22 && nF / N < 0.29 && nD1 / N > 0.27 && nD1 / N < 0.33 && nP / N > 0.37 && nP / N < 0.43);
        bY.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); drive({}, 1500);
      } finally { DS.rng = rngX; DS.roll = rollX; }
    } else if (test === 'menu8fight1007') {
      // the 8-bit's in-fight menu acts as the grid's (10-07, Griz: "1 - you're the instance for it if its not too big of a job"): X on a hero's commands opens the one menu;
      // its ITEMS, MAGIC and SKILLS are this fight's own lists, lit by their cost (the action yellow, the bonus blue), and a pick is the turn's command -- the battle's own
      // target picker after it. Barley drinks a potion from ITEMS and takes his Second Wind from SKILLS; Aurdin casts from MAGIC. The gnolls are made to outlast it
      var YEL = '#F8D878', BLU = '#3CBCFC', ba = g.hero('barley'), au = g.hero('aurdin'), seen = {}, said = [];
      g.party.forEach(function (h) { h.maxhp = h.hp = 300; }); ba.hp = 250; au.slots = au.slotsMax.slice(); g.give('potion', 2); ba.feats.secondWind = 1;
      var pot0 = g.inv.filter(function (s) { return s.id === 'potion'; })[0].n, slots0 = au.slots.reduce(function (a, b) { return a + b; }, 0);
      T.startFight(['gnoll', 'gnoll']);
      for (var w0 = 0; w0 < 400 && !DS.find('battle'); w0++) T.step(1);
      var bt = DS.find('battle'); bt.foes.forEach(function (f) { f.hp = f.maxhp = 900; });
      function keyF(b) { return { pressed: function (x) { return x === b; }, repeat: function (x) { return x === b; } }; }
      function first(list, f) { var i = list.items.map(f).indexOf(true); if (i >= 0) { list.i = i; list.fix(); } return i >= 0 ? list.items[i] : null; }
      var plan = { barley: ['items', 'skills'], aurdin: ['magic'] }, steps = 0;
      while (steps++ < 8000 && DS.find('battle') && !DS.lastError && (plan.barley.length || plan.aurdin.length)) {
        var top = DS.top(), k = top && top.kind, who = bt.active && bt.active.h ? bt.active.h.id : null, pl = who && plan[who];
        if (k === 'menu' && top.menu.items.some(function (it) { return it.label === 'FIGHT'; })) {
          if (pl && pl.length) { T.tapf('b'); continue; } // (X on the commands: the one menu)
          top.menu.i = top.menu.items.findIndex(function (it) { return it.label === 'FIGHT'; }); T.tapf('a'); continue;
        }
        if (k === 'menu') { var no = top.menu.items.findIndex(function (it) { return !it.disabled && /^(LET IT|NOT NOW|NO\b)/.test(it.label); }); top.menu.i = no >= 0 ? no : Math.max(0, top.menu.items.findIndex(function (it) { return !it.disabled; })); T.tapf('a'); continue; } // (a reaction's ask: let it land)
        if (k === 'fieldmenu') {
          var mm = top.m, what = pl.shift(); mm.root.cmds.i = mm.root.cmds.items.map(function (x) { return x.value; }).indexOf(what); mm.update(keyF('a'));
          var pg = mm.pages[0];
          if (!said.length) { var tx0 = DS.text; DS.text = function (c, s, x, y, col) { said.push(String(s) + '=' + col); return tx0.apply(this, arguments); }; try { mm.draw(DS.ctx || document.getElementById('screen').getContext('2d')); } finally { DS.text = tx0; } }
          if (what === 'items' && pg) { pg.tab = DS.MENU.itemTab(DS.DATA.items.potion); pg.refresh(); seen.potion = first(pg.list, function (x) { return x.value === 'potion'; }); }
          if (what === 'magic' && pg) { for (var tb = 0; tb < pg.levels.length && !seen.spell; tb++) { pg.tab = tb; pg.refresh(); seen.spell = first(pg.list, function (x) { return !x.disabled && x.value.level > 0; }); } seen.spells = pg.ring.map(function (e) { return e.id + (e.ok ? '' : '(grey)'); }); }
          if (what === 'skills' && pg) seen.wind = first(pg.list, function (x) { return x.value && x.value.id === 'secondWind'; });
          if (!pg) seen['no page ' + what] = (mm.toast && mm.toast.lines || []).join(' ');
          mm.update(keyF('a')); T.step(1); continue;
        }
        if (k === 'target') { top.i = 0; T.tapf('a'); continue; }
        if (k === 'dialog') { if (top.chars < top.pageLen()) top.chars = top.pageLen(); T.tapf('a'); continue; }
        T.step(1);
      }
      var pot1 = (g.inv.filter(function (s) { return s.id === 'potion'; })[0] || { n: 0 }).n, slots1 = au.slots.reduce(function (a, b) { return a + b; }, 0), lg = (T.blog || []).join(' | ');
      check('ITEMS in the 8-bit fight: the potion lit ' + (seen.potion && seen.potion.color) + ' (the action), picked: drunk -- potions ' + pot0 + ' -> ' + pot1, seen.potion && seen.potion.color === YEL && pot1 === pot0 - 1);
      check('SKILLS: Barley\'s SECOND WIND lit ' + (seen.wind && seen.wind.color) + ' (the bonus), picked: spent (' + ba.feats.secondWind + ')', seen.wind && seen.wind.color === BLU && !ba.feats.secondWind);
      var spn = seen.spell && seen.spell.value.name;
      check('MAGIC: Aurdin\'s list the fight\'s own (' + (seen.spells || []).join(', ') + '); ' + spn + ' lit ' + (seen.spell && seen.spell.color) + ', picked: cast (slots ' + slots0 + ' -> ' + slots1 + ', "' + ((lg.match(new RegExp('[^|]*' + (spn || 'x@x') + '[^|]*')) || [''])[0].trim()) + '")',
        seen.spell && seen.spell.color === (seen.spell.value.spell.bonus ? BLU : YEL) && slots1 === slots0 - 1);
      check('the box under the entries in the 8-bit fight: ' + said.filter(function (s) { return /^(Can do now:|action|free|bonus action)=/.test(s); }).join(' '), said.indexOf('action=' + YEL) >= 0 && said.indexOf('bonus action=' + BLU) >= 0);
      check('the plan ran out, the fight still on (' + JSON.stringify(plan) + ', ' + steps + ' steps)' + (Object.keys(seen).filter(function (s) { return /^no page/.test(s); }).map(function (s) { return '; ' + s + ': ' + seen[s]; }).join('')), !plan.barley.length && !plan.aurdin.length);
    } else if (test === 'loaderr1007') {
      // the bench's own load error (10-07, the todo §6, the house: bench8.py read LOADERR only when the page wrote no result): a script that throws as it loads, then the
      // result written as ever -- dev/loaderr-probe.py wants the throw handed back
      var sL = document.createElement('script'); sL.textContent = 'throw new Error("the bench\'s own load error (loaderr1007)")'; document.body.appendChild(sL);
      check('the page writes its result after a script threw on load', true);
    } else if (test === 'escorts1013') {
      // the escorts and the save (10-13, the road §7g; Griz: "1 - yes, existing saves be derned (or mended post fix?)"): Brann and Hedda through a save and a load, standing
      // and down; the Raid won lets them go whether they stood or lay down; a save already past the Raid that still carries them comes back without them
      var EVe = DS.EV, Se = DS.SCRIPTS, base8 = DS.battle;
      DS.battle = function (o) { return { start: function (script) { var self = this; self.finished = true; self.result = 'win'; pending.push(function () { script.resume(self, 'win'); }); } }; };
      function freshE(n) { T.newGame('barley'); DS.paused = true; DS.lastError = null; DS.situation(DS.G, { base: 'lake', spine: n }); DS.G.party.forEach(function (h) { delete h.pendingChoice; }); return DS.G; }
      function keysE() { return (DS.G.guests || []).map(function (x) { return x.id + (x.h.ko ? '(down)' : ''); }).join(','); }
      function tripE() { DS.saveGame(3); DS.startFrom(DS.loadSlot(3)); DS.paused = true; }
      var saidE = [];
      function playE(gen) {
        var fin = false; DS.run(gen, function () { fin = true; });
        for (var s = 0; s < 6000; s++) {
          var tp = DS.top(), k = tp && tp.kind, menu = (k === 'dialog' || k === 'menu' || k === 'popup') ? tp.menu : null;
          if (k === 'dialog') { var pgE = tp.pages && tp.pages[tp.p]; if (pgE) { var tE = DS.stripCodes(pgE.lines.join(' ')); if (saidE[saidE.length - 1] !== tE) saidE.push(tE); } }
          if (DS.lastError) break;
          if (menu) { menu.i = Math.max(0, menu.items.findIndex(function (it) { return !it.disabled; })); T.tapf('a'); }
          else if (k === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); }
          else if (k === 'check') { if (tp.t > 60) T.tapf('a'); else T.step(4); }
          else if (k && k !== 'field' && k !== 'flash') { T.tapf('a'); T.step(2); }
          else T.step(1);
          if (fin && !DS.scriptActive() && (!k || k === 'field')) break;
        }
        return fin;
      }
      function raidE() { DS.G.map = 'highway_3'; /* (surfaceCall no longer set here: it kept the runner from the surface out of the raid's end, 10-05 to 10-20 -- there is none now) */ DS.G.x = 56; DS.G.y = 11; tripE(); return playE(function* () { yield* Se.raid(); }); }
      try {
        freshE(15); var e0 = keysE(); tripE(); var e1 = keysE();
        check('the muster\'s two through a save and a load: ' + e0 + ' -> ' + e1 + ' (want brann,hedda both times)', e0 === 'brann,hedda' && e1 === 'brann,hedda');
        DS.G.guests.forEach(function (x) { x.h.ko = true; x.h.hp = 0; }); tripE(); var e2 = keysE();
        check('down in the Giant\'s Camp, through a save and a load: ' + e2 + ' (want brann(down),hedda(down): still walking with you, sitting out till a lamp)', e2 === 'brann(down),hedda(down)');
        var r1 = raidE(), e3 = keysE();
        check('the Raid won with them down: ' + (r1 ? 'played' : 'NOT FINISHED') + ', after it ' + (e3 || '(none)') + ' (want none: they stay at the lamp)', r1 && !!DS.G.flags.raidWon && e3 === '');
        freshE(15); DS.G.guests = []; var r2 = raidE();
        EVe.addGuest('brann'); EVe.addGuest('hedda'); var e4 = keysE();
        check('the Raid won without them: ' + (r2 ? 'played' : 'NOT FINISHED') + '; a muster after it gives ' + (e4 || '(none)') + ' (want none: their orders end at the lamp)', r2 && e4 === '');
        freshE(16); DS.G.guests = [{ id: 'brann', h: EVe.guestSheet('brann') }, { id: 'hedda', h: EVe.guestSheet('hedda') }]; tripE(); var e5 = keysE();
        check('a save past the Raid still carrying them, loaded: ' + (e5 || '(none)') + ' (want none: mended)', e5 === '');
        freshE(15); DS.G.guests.forEach(function (x) { x.h.ko = true; x.h.hp = 0; }); DS.G.map = 'highway_3'; DS.G.x = 20; DS.G.y = 11; tripE();
        saidE = []; playE(function* () { yield* EVe.fight(['goblin'], {}); }); var s1 = saidE.filter(function (t) { return /still down/.test(t); });
        saidE = []; playE(function* () { yield* EVe.fight(['goblin'], {}); }); var s2 = saidE.filter(function (t) { return /still down/.test(t); });
        EVe.longRest(); DS.G.guests[0].h.ko = true; DS.G.guests[0].h.hp = 0;
        saidE = []; playE(function* () { yield* EVe.fight(['goblin'], {}); }); var s3 = saidE.filter(function (t) { return /still down/.test(t); });
        check('a fight with both down says so once: "' + (s1[0] || '(nothing)') + '"; the next fight ' + (s2.length ? 'again' : 'quiet') + '; after a night, Brann down again: "' + (s3[0] || '(nothing)') + '"',
          s1.length === 1 && /^Brann and Hedda: still down/.test(s1[0]) && !s2.length && s3.length === 1 && /^Brann: still down/.test(s3[0]));
      } finally { DS.battle = base8; }
    } else if (test === 'lamp1013') {
      // the one Ledger-Lamp (10-13, the road §7g, his "ended up with two ledger lamps also"; Griz: "those are rare items we must account for carefully"): a save that came out
      // of the Skylights with its pack doubled (deep16/js/embed.js E.inv0) loads with one -- two in the pack, or one lit and one in the pack
      function tripL() { DS.saveGame(3); DS.startFrom(DS.loadSlot(3)); DS.paused = true; }
      g.give('ledgerlamp', 2); tripL(); var n1L = DS.G.count('ledgerlamp');
      check('two Ledger-Lamps in the pack, saved and loaded: ' + n1L + ' (want 1)', n1L === 1);
      var gL2 = DS.G, hL = gL2.party[0]; gL2.flags.torchBy = hL.id; gL2.flags.torchKind = 'ledgerlamp'; hL.equip.torch = 1; gL2.give('ledgerlamp', 1);
      tripL(); var n2L = DS.G.count('ledgerlamp'), lit2 = DS.G.flags.torchKind === 'ledgerlamp' && !!DS.G.flags.torchBy;
      check('one lit in a hand and one in the pack, saved and loaded: ' + n2L + ' in the pack, the lit one ' + (lit2 ? 'kept' : 'GONE') + ' (want 0, kept)', n2L === 0 && lit2);
      gL2 = DS.G; delete gL2.flags.torchBy; delete gL2.flags.torchKind; gL2.give('ledgerlamp', 1); tripL(); var n3L = DS.G.count('ledgerlamp');
      check('one in the pack, saved and loaded: ' + n3L + ' (want 1: left alone)', n3L === 1);
      // a night's rest (RE-RULED 10-13, Griz: "1 - yes"): the Ledger-Lamp in a hand stays lit; a torch goes out
      var gR = DS.G, hR = gR.party[0]; gR.take('ledgerlamp', gR.count('ledgerlamp')); gR.flags.torchBy = hR.id; gR.flags.torchKind = 'ledgerlamp'; hR.equip.torch = 1;
      DS.EV.longRest(); var keptR = gR.flags.torchKind === 'ledgerlamp' && gR.flags.torchBy === hR.id && hR.equip.torch === 1 && gR.count('ledgerlamp') === 0;
      gR.flags.torchKind = 'torch'; DS.EV.longRest(); var outR = !gR.flags.torchBy && !hR.equip.torch;
      check('A NIGHT\'S REST: the Ledger-Lamp still in ' + hR.name + '\'s hand ' + keptR + ' (none put in the pack); a torch out ' + outR, keptR && outR);
    } else if (test === 'fixes1013') {
      // the bug-fix seat's 8-bit checks (10-13): a paladin's level-up names what opens, not "learns"; the Elixir of Health by the SRD in the field; walking into a person talks
      var R8 = DS.R, ly = R8.makeHero('lymen', 2), m3 = R8.levelUp(ly).join(' / '), m4 = R8.levelUp(ly).join(' / '), m5 = R8.levelUp(ly).join(' / ');
      check('LYMEN LEVELS UP, 3: "' + m3.slice(0, 160) + '" -- no "learns" (want none: he prepares from the whole list)', !/learns/.test(m3) && !/learns/.test(m4));
      check('LYMEN LEVELS UP, 5: "' + (m5.match(/can prepare level 2[^/]*/) || ['(no line)'])[0] + '" (want the 2nd-level spells named)', /can prepare level 2 spells now: .*Aid/.test(m5) && !/learns/.test(m5));
      var au = R8.makeHero('aurdin', 2), ma = R8.levelUp(au).join(' / ');
      check('AURDIN LEVELS UP, 3 (a wizard copies into his book): ' + (ma.match(/learns[^/]*/) || ['(no learns)'])[0], /learns/.test(ma) || !(DS.DATA.heroes.aurdin.levels && DS.DATA.heroes.aurdin.levels[3] && DS.DATA.heroes.aurdin.levels[3].learn));
      var hE = g.party[0]; hE.conds = { poisoned: { linked: null }, blinded: true, deafened: true }; g.give('elixir', 2); var nE0 = g.count('elixir');
      DS.run(function* () { yield* DS.EV.useFieldItem('elixir', hE); }); for (var kE = 0; kE < 300 && DS.scriptActive(); kE++) { var tE = DS.top(); if (tE && tE.kind === 'dialog') { if (tE.chars < tE.pageLen()) tE.chars = tE.pageLen(); T.tapf('a'); } else T.step(1); }
      var leftE = Object.keys(hE.conds), nE1 = g.count('elixir');
      DS.run(function* () { yield* DS.EV.useFieldItem('elixir', hE); }); for (kE = 0; kE < 300 && DS.scriptActive(); kE++) { var tE2 = DS.top(); if (tE2 && tE2.kind === 'dialog') { if (tE2.chars < tE2.pageLen()) tE2.chars = tE2.pageLen(); T.tapf('a'); } else T.step(1); }
      check('THE ELIXIR IN THE FIELD: poisoned, blinded, deafened -> ' + (leftE.join(',') || 'none') + ', one drunk (' + nE0 + ' -> ' + nE1 + '); again with nothing to cure: ' + g.count('elixir') + ' left (want ' + nE1 + ')', !leftE.length && nE1 === nE0 - 1 && g.count('elixir') === nE1);
      // walking into a person: a Silverton NPC with an open square below it, the lead there, a step up
      var F8 = DS.field; F8.load(DS.DATA.config.start.map, DS.DATA.config.start.x, DS.DATA.config.start.y, 'down');
      var nP = F8.npcs.filter(function (n) { return !n.hidden && !n.wander && DS.DATA.npcs[n.id] && F8.free(n.x, n.y + 1, 'player'); })[0], talked = false;
      if (nP) {
        g.x = nP.x; g.y = nP.y + 1; g.dir = 'up'; F8.lastBump = null; DS.paused = false;
        F8.tryMove('up'); for (var kP = 0; kP < 30; kP++) { if (DS.top() && DS.top().kind === 'dialog') { talked = true; break; } T.step(1); }
        for (kP = 0; kP < 300 && (DS.scriptActive() || (DS.top() && DS.top().kind !== 'field')); kP++) { var tP = DS.top(); if (tP && (tP.kind === 'dialog' || tP.kind === 'menu')) { if (tP.kind === 'dialog' && tP.chars < tP.pageLen()) tP.chars = tP.pageLen(); T.tapf(tP.kind === 'menu' ? 'b' : 'a'); } else T.step(1); }
        DS.paused = true;
      }
      check('WALKING INTO A PERSON: ' + (nP ? nP.id + ' at ' + nP.x + ',' + nP.y + ' -- a step into them ' + (talked ? 'opens the talk' : 'does NOT open the talk') : 'no person found to walk into'), !!nP && talked);
      // the shopkeepers' words fit the keeper's window (the road §7g: "Toll-Grille - A Diamond, for the ones who... (cuts off) - check Percy also")
      var linesS = (DS.Shop && DS.Shop.LINES) || 2, longS = [];
      Object.keys(DS.DATA.shops).forEach(function (sid) { var d = DS.DATA.shops[sid]; ['greeting', 'nothingText', 'thanks', 'boughtText'].forEach(function (k) { [].concat(d[k] || []).forEach(function (t) { var n = DS.wrap(String(t), 190).length; if (n > linesS) longS.push(sid + '.' + k + ' ' + n); }); }); });
      check('THE SHOPKEEPERS\' WORDS: every greeting and reply in ' + linesS + ' lines -- too long: ' + (longS.join(', ') || 'none'), !longS.length);
      // EXIT on the 8-bit's menu: QUIT TO THE TITLE?, a save first where one may be made, and backing out of the slots leaves no one at the title
      F8.load(DS.DATA.config.start.map, DS.DATA.config.start.x, DS.DATA.config.start.y, 'down'); DS.paused = false;
      var fmX = new DS.FieldMenu({}), hX = fmX.m.host, exX = hX.exits().map(function (e) { return e.label; }), titled = false;
      DS.push(fmX); hX.run('exit', { to: 'save' }, function () { }); for (var kX = 0; kX < 20 && !(DS.top() && DS.top().kind === 'slots'); kX++) T.step(1);
      var slotsX = DS.top() && DS.top().kind === 'slots'; if (slotsX) DS.top().menu.onCancel(); for (kX = 0; kX < 20; kX++) T.step(1);
      titled = DS.scenes.some(function (s) { return s.kind === 'title'; }); DS.paused = true;
      check('EXIT: "' + hX.exitTitle + '" -- ' + exX.join(' / ') + '; SAVE, THEN LEAVE opens the slots (' + slotsX + '), backed out of: at the title ' + titled + ' (want false)', hX.exitTitle === 'QUIT TO THE TITLE?' && exX[0] === 'SAVE, THEN LEAVE' && slotsX && !titled);
    } else if (test === 'fixes1014') {
      // the bug-fix seat's 8-bit checks (10-14): the quest arrow -- the halls' handoff to the Keeper's Water while Halldor mends; the arrow's way walked, a gate shut or open
      var QS = DS.DATA.quests.filter(function (x) { return x.id === 'halls'; })[0], fl = g.flags;
      fl.pyroTrusts = 1; fl.captainHome = 1; delete fl.halldorUp; delete fl.waterAsked; delete fl.keeperWater; delete fl.petition;
      var hs1 = DS.questStep(QS); fl.waterAsked = 1; var hs2 = DS.questStep(QS); fl.keeperWater = 1; var hs3 = DS.questStep(QS); fl.halldorUp = 1; var hs4 = DS.questStep(QS);
      var nm = function (s) { return s ? s.map + ':' + (s.npc || s.trig) : '-'; };
      check('THE HALLS WHILE HALLDOR MENDS: ' + [hs1, hs2, hs3, hs4].map(nm).join(' -> ') + ' (want solskaft:ragna -> warrens_d:holdStair -> solskaft:halldorBunk -> solskaft:halldor)',
        nm(hs1) === 'solskaft:ragna' && nm(hs2) === 'warrens_d:holdStair' && nm(hs3) === 'solskaft:halldorBunk' && nm(hs4) === 'solskaft:halldor');
      delete fl.waterAsked; delete fl.keeperWater; delete fl.halldorUp;
      // the arrow walks its way: a pinned step past Skarn's gate (the flooded stair in warrens_d), the party in warrens_b where it comes in from the mouth camp
      var inB = null; (DS.DATA.maps.warrens_a.warps || []).concat(Object.keys(DS.DATA.maps.warrens_a.exits || {}).map(function (e) { return DS.DATA.maps.warrens_a.exits[e]; })).forEach(function (l) { if (l.to === 'warrens_b' && !inB) inB = [l.tx, l.ty]; });
      DS.DATA.quests.push({ id: 'pin1014', name: 'the arrow test', show: '', done: 'flag:pin1014done', steps: [{ map: 'warrens_d', trig: 'stair', where: 'the test' }] }); fl.pin = 'pin1014';
      var F14 = DS.field, pins = [], pts = [];
      [['shut, Skarn not satisfied', {}], ['shut, Skarn satisfied', { skarnOk: 1 }], ['open', { skarnOk: 1, skarnGateOpen: 1 }]].forEach(function (c) {
        delete fl.skarnOk; delete fl.skarnGateOpen; Object.keys(c[1]).forEach(function (k) { fl[k] = c[1][k]; });
        F14.load('warrens_b', inB[0], inB[1], 'down'); g.x = inB[0]; g.y = inB[1]; F14.pinKey = null;
        var p = F14.pinPoint(); pts.push(p ? p.x + ',' + p.y : 'none'); pins.push(c[0] + ': ' + (p ? (p.npc ? 'npc ' : '') + p.x + ',' + p.y + ' via ' + (F14.pinChain || []).join(' > ') : 'no arrow'));
      });
      check('THE ARROW AND SKARN\'S GATE (the road §7g: "arrows point the way to things as if there weren\'t locked gates"): in warrens_b at ' + inB + ', the flooded stair pinned -- ' + pins.join(' | ') + ' (want: shut, the way round; satisfied or open, through it)',
        pts[0] !== 'none' && pts[0] !== pts[2] && pts[1] === pts[2] && pts[2] !== 'none');
      DS.DATA.quests.pop(); delete fl.pin; delete fl.skarnOk; delete fl.skarnGateOpen;
      // ... and the arrow still shows down the spine: every beat's quests, the party at Silverton's start (the story walk, story1006, reaches each pinned door from there)
      var noPin = [], swept = 0, shown = 0, cs = DS.DATA.config.start;
      for (var nB = 0; nB <= 21; nB++) {
        if (nB === 3) continue; // (the seam: no save stands between beats 3 and 4 -- story1006)
        T.newGame('barley'); DS.paused = true; DS.situation(DS.G, { base: 'lake', spine: nB }); var gB = DS.G, pin0 = gB.flags.pin;
        DS.DATA.quests.forEach(function (qB) {
          if (!DS.cond(qB.show) || DS.cond(qB.done)) return; var stB = DS.questStep(qB); if (!stB || !stB.map) return;
          gB.flags.pin = qB.id; DS.field.load(cs.map, cs.x, cs.y, 'down'); gB.x = cs.x; gB.y = cs.y; DS.field.pinKey = null; swept++;
          var pB = DS.field.pinPoint(); if (pB) shown++; else if (qB.id === pin0) noPin.push(nB + ':' + qB.id + ' (' + stB.map + ':' + (stB.npc || stB.trig || stB.door || stB.at) + ')');
        });
        gB.flags.pin = pin0;
      }
      check('THE ARROW DOWN THE SPINE: ' + shown + ' of ' + swept + ' shown quest steps have an arrow from Silverton\'s start; a beat\'s pinned quest with none: ' + (noPin.join(', ') || 'none'), !noPin.length);
      // the journal after the nest (the road §7e): the nest crushed, the word not yet come -- the journal still points (a rest), and the word ends it
      T.newGame('barley'); DS.paused = true; DS.situation(DS.G, { base: 'lake', spine: 13 }); var gN = DS.G, qN = DS.pinnedQuest(), sN = qN && DS.questStep(qN);
      gN.flags.wordBelow = 1; var qN2 = DS.pinnedQuest();
      check('THE JOURNAL AFTER THE NEST: crushed, no word yet -- pinned ' + (qN ? qN.id + ', "' + (sN && sN.where) + '" (' + (sN && sN.map + ':' + sN.trig) + ')' : 'nothing') + '; the word come -- ' + (qN2 ? qN2.id : 'nothing') + ' (want the nest pointing to a rest, then done)',
        !!qN && qN.id === 'nest' && !!sN && sN.map === 'solskaft' && /^bunk/.test(sN.trig || '') && !qN2);
      // the stair once the Keeper is awake (the road §7d, his note on ?at=stair): the stair says it, WADE IN meets it waiting, the mark asks nothing
      var say0 = DS.say, ask0 = DS.ask, fight0 = DS.EV.fight, said = [], asked = [];
      DS.say = function (t) { said.push([].concat(t).join(' ')); return { say: 1 }; }; DS.ask = function (t, ch) { asked.push(ch.join('/')); return { ask: ch }; }; DS.EV.fight = function* () { said.push('(the fight)'); return 'run'; };
      function drive(gen, pick) { var s0, v; for (var kD = 0; kD < 60; kD++) { s0 = gen.next(v); v = undefined; if (s0.done) return; if (s0.value && s0.value.ask) v = pick(s0.value.ask); } }
      try {
        T.newGame('barley'); DS.paused = true; var gK = DS.G; gK.flags.keeperAwake = 1; gK.give('rope', 1);
        drive(DS.SCRIPTS.stair(), function (ch) { return ch.indexOf('WADE IN'); }); var stSaid = said.slice(); said = []; asked = [];
        drive(DS.SCRIPTS.mark(), function () { return 1; }); var mkSaid = said.slice(), mkAsked = asked.slice();
        var has = function (list, key) { var t = DS.L(key); return list.some(function (x) { return x.indexOf(String(t).slice(0, 40)) >= 0; }); };
        check('THE STAIR WITH THE KEEPER AWAKE: the stair -- ' + (has(stSaid, 'w.stairAwake') ? 'stirring' : has(stSaid, 'w.stairSee') ? 'CALM' : '?') + ', WADE IN -- ' + (has(stSaid, 'w.wadeAwake') ? 'it waits' : 'as if asleep') + '; the mark -- ' + (mkAsked.length ? 'ASKS ' + mkAsked.join(' ') : 'no ask') + ', ' + (has(mkSaid, 'w.markAwake') ? 'unsettled' : 'its look ' + (mkSaid[0] || '').slice(0, 40)),
          has(stSaid, 'w.stairAwake') && has(stSaid, 'w.wadeAwake') && !mkAsked.length && has(mkSaid, 'w.markAwake') && !has(mkSaid, 'w.markWake'));
      } finally { DS.say = say0; DS.ask = ask0; DS.EV.fight = fight0; }
    } else if (test === 'fixes1020') {
      // THE FIRST GAME's 8-bit fixes (his 10-19 notes, probed 10-20 by the desk's runners; the first game lane). In place of snootcall1015 (THE SNOOT from the road, 10-15:
      // the runner, TO THE SNOOT, the Skylights' pin -- out of the first game with the Skylights; ending1020 checks they are gone). Five: (a) Dace -- the pit's Dace gone once
      // the cloaker is dead or he walks with you, daceDeep fires under the cloaker's rect once it is killed, and he goes no farther than the mine (his "8 - yes": the kid's
      // fall still ends it); (b) the drummer boy beside his drum; (c) the shops buy the starter gear, no ordinary shop the quest's +1s, Winters does; (d) END HOLD drops when its
      // mark is killed; (e) the dock shut till the wagon night, and the lake's gift on the chuul's corpse when the party never had it
      var st21 = window.setTimeout, say21 = DS.say, said21 = [], ch21 = DS.choose, auto21 = DS.autoPicks;
      window.setTimeout = function (fn) { pending.push(fn); return 0; }; DS.autoPicks = true;
      DS.say = function (t) { said21.push(DS.stripCodes(Array.isArray(t) ? t.join(' ') : String(t))); return say21.apply(this, arguments); };
      function heard21(key) { var tx = DS.stripCodes([].concat(DS.L(key)).join(' ')); return said21.some(function (x) { return x.indexOf(tx.slice(0, 30)) >= 0; }); }
      function play21(gen, answers) { // a script to its end, or to the credits: its questions by label (else the first), every fight the 8-bit battle with its foes put down
        answers = (answers || []).slice(); var fin = false; DS.lastError = null; DS.run(gen, function () { fin = true; });
        for (var i = 0; i < 20000 && !DS.lastError; i++) {
          var tp = DS.top(), k = tp && tp.kind, b = DS.find('battle');
          if (k === 'credits' || k === 'after' || k === 'gameover') break;
          if (b && !b.down21) { b.down21 = true; b.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); }
          var menu = (k === 'dialog' || k === 'menu' || k === 'popup') ? tp.menu : null;
          if (menu) { var idx = -1; if (answers.length && !b) { var a = String(answers[0]).toUpperCase(); idx = menu.items.findIndex(function (it) { return !it.disabled && String(it.label).toUpperCase().indexOf(a) === 0; }); if (idx >= 0) answers.shift(); }
            if (idx < 0) idx = menu.items.findIndex(function (it) { return !it.disabled && !/^RUN$/.test(String(it.label)); }); menu.i = Math.max(0, idx); T.tapf('a'); }
          else if (k === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); }
          else if (k === 'target') { tp.i = 0; T.tapf('a'); }
          else if (k && k !== 'field' && k !== 'flash' && k !== 'battle') { T.tapf('a'); T.step(2); }
          else T.step(1);
          if (fin && !DS.scriptActive() && (!k || k === 'field')) break;
        }
        return fin;
      }
      function runGen21(gen) { var r; for (var i = 0; i < 400; i++) { r = gen.next(); if (r.done) return r.value; } return 'ran on'; }
      try {
        // (a) Dace
        var g21 = SETUP(5, { cullHired: 1 }), F21 = DS.field, npcOn = function (map, id) { var d = (DS.DATA.maps[map].npcs || []).filter(function (n) { return n.id === id; })[0]; return !!(d && DS.cond(d.cond)); };
        var pitA = npcOn('galleries_g3', 'dacedown'); g21.flags.cloakerKilled = 1; var pitB = npcOn('galleries_g3', 'dacedown'); delete g21.flags.cloakerKilled; g21.flags.daceWith = 1; var pitC = npcOn('galleries_g3', 'dacedown'); delete g21.flags.daceWith;
        check('(a) the pit\'s Dace: there before the kill ' + pitA + ', gone once the cloaker is dead ' + !pitB + ', gone while he walks with you ' + !pitC, pitA && !pitB && !pitC);
        F21.load('galleries_g4', 10, 12, 'down'); var tA = F21.triggerAt(10, 12, 'step');
        g21.flags.cloakerKilled = 1; g21.give('cloakertail', 1); var tB = F21.triggerAt(10, 12, 'step');
        DS.EV.addGuest('dace'); g21.flags.daceWith = 1; g21.flags.daceAfter = 1; var tC = F21.triggerAt(10, 12, 'step');
        check('(a) the deep gallery\'s room: before the kill ' + (tA && tA.id) + ', after it alone ' + (tB && tB.id) + ', after it with Dace walking back down ' + (tC && tC.id), !!tA && tA.id === 'cloaker' && !tB && !!tC && tC.id === 'daceDeep');
        said21 = []; play21(function* () { yield* DS.EV.trigger(tC, F21); }, ['THE CLOAK']);
        check('(a) daceDeep plays: his thanks ' + heard21('dace.deep') + ', the cloak ' + g21.has('cloakdisplacement') + ', daceDone ' + g21.flags.daceDone + ', home ' + !DS.EV.hasGuest('dace'), heard21('dace.deep') && g21.has('cloakdisplacement') && g21.flags.daceDone === 1 && !DS.EV.hasGuest('dace'));
        delete g21.flags.daceDone; delete g21.flags.cloakerKilled; g21.take('cloakertail', 1); DS.EV.addGuest('dace'); g21.flags.daceWith = 1;
        F21.load('galleries_g1', 17, 4, 'down'); said21 = [];
        play21(function* () { yield* DS.EV.warp('galleries_g2', 17, 26, 'up'); });
        var inMine = DS.EV.hasGuest('dace') && DS.field.map.id === 'galleries_g2';
        DS.field.load('galleries_g1', 17, 22, 'down'); said21 = [];
        play21(function* () { yield* DS.EV.warp('world', 23, 11, 'down'); });
        check('(a) the mine\'s exits: down into the mine he comes (' + inMine + '); out to the road he stops (' + heard21('dace.mouth') + ', a guest ' + DS.EV.hasGuest('dace') + ', daceWith ' + !!g21.flags.daceWith + '), the party on ' + DS.field.map.id,
          inMine && heard21('dace.mouth') && !DS.EV.hasGuest('dace') && !g21.flags.daceWith && DS.field.map.id === 'world');
        var dD = DS.DATA.heroes.dace; check('(a) "game over if the kid falls" stands: his sheet vital (' + !!(dD && dD.vital) + ')', !!(dD && dD.vital));
        // (b) the drummer
        var gm = DS.DATA.maps.gulch, dr = (gm.npcs || []).filter(function (n) { return n.id === 'drummer'; })[0]; DS.field.load('gulch', 33, 8, 'right'); var crate = DS.field.map.at(9, 9);
        check('(b) the drummer boy at ' + (dr && dr.x + ',' + dr.y + ' facing ' + dr.dir) + ', the drum (' + crate + ') at 9,9 beside him', !!dr && Math.abs(dr.x - 9) + Math.abs(dr.y - 9) === 1 && dr.dir === 'left' && dr.x === 10 && /crate|barrel/.test(String(crate)));
        // (c) the shops
        var lists = {};
        DS.choose = function (o) { lists.cur = (o.items || []).map(function (it) { return it.value + '@' + it.right; }); return { start: function () { this.result = null; this.finished = true; } }; };
        function sellList(shopId) { lists.cur = null; var sh = new DS.Shop(DS.DATA.shops[shopId]); play21(function* () { yield* sh.go('sell'); }); return lists.cur || []; }
        SETUP(5); var gS = DS.G; ['threshingflail', 'candleknife', 'threshingflail1', 'greyfangbow'].forEach(function (id) { gS.give(id, 1); });
        var vil = sellList('vilar'), win = sellList('winters');
        DS.choose = ch21;
        var has21 = function (l, id) { return l.filter(function (x) { return x.split('@')[0] === id; })[0] || ''; };
        check('(c) Vilar buys the starter gear: ' + [has21(vil, 'threshingflail'), has21(vil, 'candleknife')].join(', ') + ' (the flail 10 gp, the dagger 2 gp, at half); not the quest\'s +1s (' + (has21(vil, 'threshingflail1') || 'none') + ', ' + (has21(vil, 'greyfangbow') || 'none') + ')',
          has21(vil, 'threshingflail') === 'threshingflail@50 sp' && has21(vil, 'candleknife') === 'candleknife@10 sp' && !has21(vil, 'threshingflail1') && !has21(vil, 'greyfangbow'));
        check('(c) Winters, the magic items man, buys them: ' + [has21(win, 'threshingflail1'), has21(win, 'greyfangbow'), has21(win, 'threshingflail')].join(', '), !!has21(win, 'threshingflail1') && !!has21(win, 'greyfangbow') && !!has21(win, 'threshingflail'));
        // (d) END HOLD on a mark killed
        SETUP(5); T.startFight(['bandit', 'bandit'], {}); for (var w = 0; w < 200 && !DS.find('battle'); w++) T.step(1);
        var bH = DS.find('battle'), cast = bH && bH.heroes.filter(function (u) { return u.h.id === 'aurdin'; })[0], mark = bH && bH.foes[0];
        if (bH && cast && mark) {
          cast.conc = { id: 'holdperson', name: 'Hold Person', rounds: 10, marks: [{ u: mark, k: 'paralyzed' }] }; mark.conds.paralyzed = { by: cast.h.id, rounds: 10, save: { ab: 'wis', dc: 30 } };
          var endRow = function () { return bH.skillList(cast, { action: true, bonus: true }).filter(function (r) { return r.value === 'endconc'; }).length; };
          var live0 = bH.concLive(cast), row0 = endRow();
          bH.kill(mark); var live1 = bH.concLive(cast); bH.say = function* (t) { said21.push(t); }; said21 = []; runGen21(bH.concSweep());
          check('(d) Hold Person on a bandit: held ' + live0 + ' (END row ' + row0 + '); the bandit killed: nothing held ' + !live1 + ', the next turn\'s sweep lets it go (' + !cast.conc + '), END gone (' + endRow() + '), nothing said of the dead (' + said21.join(' | ') + ')',
            live0 && row0 === 1 && !live1 && !cast.conc && endRow() === 0 && !said21.some(function (x) { return /paralyzed/.test(x); }));
          bH.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); drive({}, 1500);
        } else check('(d) the fight for END HOLD did not open', false);
        // (e) the dock and the chuul
        var gE = SETUP(5, { reachedInn: 1 }); delete gE.flags.lakeDone; DS.field.load('halfway', 27, 14, 'down');
        var boat0 = DS.field.triggerAt(27, 15, 'step'); gE.flags.wagonNight = 1; gE.flags.wagonOutcome = 'quiet'; var boat1 = DS.field.triggerAt(27, 15, 'step');
        check('(e) the rowboat: shut before the first night at the inn (' + (boat0 && boat0.id) + '), open after it (' + (boat1 && boat1.id) + ')', !boat0 && !!boat1 && boat1.id === 'rowboat');
        function chuul(flags) {
          var gC = SETUP(5, Object.assign({ reachedInn: 1, wagonNight: 1 }, flags)); delete gC.flags.lakeDone; DS.field.load('halfway', 27, 14, 'down'); said21 = [];
          var want = DS.EV.lakeGiftId(), n0 = gC.count(want); play21(DS.SCRIPTS.rowboat, ['PUSH']);
          return { g: gC, want: want, got: gC.count(want) - n0, said: heard21('lake.corpseGift'), done: gC.flags.lakeDone === 1 };
        }
        var c1 = chuul({ wagonOutcome: 'quiet' }), c2 = chuul({ wagonOutcome: 'inn', doranAway: 1 }), c3 = chuul({ wagonOutcome: 'road', doranAway: 1, wagonGift: 1 });
        check('(e) the wagon let go, the chuul killed off the rowboat: on its corpse ' + c1.want + ' x' + c1.got + ' ("' + DS.L('lake.corpseGift').slice(0, 30) + '..." ' + c1.said + '), lakeGiftGot ' + c1.g.flags.lakeGiftGot, c1.done && c1.got === 1 && c1.said && c1.g.flags.lakeGiftGot === 1);
        check('(e) the wagon stopped and Elsbeth\'s gift had: nothing on it (' + c2.got + ', said ' + c2.said + ')', c2.done && c2.got === 0 && !c2.said);
        check('(e) the wagon stopped, her thanks still owed: on the corpse (' + c3.got + '), owed no longer (wagonGift ' + !!c3.g.flags.wagonGift + ')', c3.done && c3.got === 1 && !c3.g.flags.wagonGift);
        // (f) the lane's §6 (the desk, probed 10-20): a Continual Flame lights only while the weapon it was set on is in hand (js/rules.js R.carriesLight) -- left with
        // Ottilie at the roost's mouth, a dark 8-bit fight no longer counts its hero lit
        function darkLit(gF) { T.startFight(['giantrat'], { dark: true, torch: null }); for (var wF = 0; wF < 200 && !DS.find('battle'); wF++) T.step(1); var bF = DS.find('battle'), lit = !!(bF && bF.lit); if (bF) { bF.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); drive({}, 1500); } return lit; }
        var gF = SETUP(5), auF = gF.hero('aurdin'), wpF = auF.equip.weapon; delete gF.flags.torchBy;
        auF.conds = auF.conds || {}; auF.conds.continualFlame = wpF;
        var inHand = R.carriesLight(auF), litIn = darkLit(gF);
        auF.equip.weapon = null; var leftWith = R.carriesLight(auF), litOut = darkLit(gF); auF.equip.weapon = wpF;
        check('(f) a Continual Flame on ' + auF.name + '\'s ' + wpF + ': in hand it lights (' + inHand + ', a dark fight lit ' + litIn + '); the weapon left with Ottilie, nothing (' + !leftWith + ', the dark fight lit ' + litOut + ')', inHand && litIn && !leftWith && !litOut);
      } catch (e21) { check('threw: ' + String(e21 && e21.stack || e21).slice(0, 400), false); }
      DS.say = say21; DS.choose = ch21; window.setTimeout = st21; DS.autoPicks = auto21;
    } else if (test === 'scourge1014') {
      // Searing Scourge in the 8-bit (ours; 10-14, Griz: "do 1 and 2" -- the grid's eight squares, here the foe in front and up to two beside it, no picker): the sheet
      // copied into Aurdin's book, the three it takes of four, one roll for all; Deathhand's two dice, d6 each from the 3rd; the twirl's frames set
      var roll0S = DS.roll, scene0S = DS.W8.scene, rollsS = [];
      DS.roll = function (e, o) { rollsS.push(e); return roll0S(e, o); };
      function runS(gen) { var s, v; DS.W8.scene = function (sc) { return { __sc: sc }; }; try { do { s = gen.next(v); v = s.value && s.value.__sc ? (sc0S(s.value.__sc)) : undefined; } while (!s.done); } finally { DS.W8.scene = scene0S; } return s.value; }
      function sc0S(sc) { return sc.kind === 'target' ? sc.list[0] : sc.kind === 'menu' ? (sc.menu.items.filter(function (x) { return !x.disabled; })[0] || {}).value : undefined; }
      try {
        // the sheet: Aurdin, a wizard with 2nd-level slots, copies it, and the sheet is spent
        var hA = g.party.filter(function (x) { return x.id === 'aurdin'; })[0];
        hA.slotsMax = [4, 3, 3]; hA.slots = [4, 3, 3]; hA.known = (hA.known || []).filter(function (id) { return id !== 'searingscourge' && id !== 'deathhandsscourge'; });
        g.give('sheet_searingscourge', 1); g.give('sheet_deathhandsscourge', 1);
        var whyA = DS.EV.learnWhy('sheet_searingscourge', hA);
        ['sheet_searingscourge', 'sheet_deathhandsscourge'].forEach(function (sid) {
          DS.run(function* () { yield* DS.EV.useFieldItem(sid, hA); });
          for (var kL = 0; kL < 300 && DS.scriptActive(); kL++) { var tL = DS.top(); if (tL && tL.kind === 'dialog') { if (tL.chars < tL.pageLen()) tL.chars = tL.pageLen(); T.tapf('a'); } else T.step(1); }
        });
        if (hA.prepared && hA.prepared.indexOf('searingscourge') < 0) hA.prepared.push('searingscourge', 'deathhandsscourge'); // (prepared at the next long rest: the fight below wants them today)
        check('THE SHEETS: Aurdin may copy ("' + whyA + '", want ""), both copied (' + (hA.known.indexOf('searingscourge') >= 0) + ', ' + (hA.known.indexOf('deathhandsscourge') >= 0) + '), both spent (' + g.count('sheet_searingscourge') + ', ' + g.count('sheet_deathhandsscourge') + ' left)',
          whyA === '' && hA.known.indexOf('searingscourge') >= 0 && hA.known.indexOf('deathhandsscourge') >= 0 && !g.count('sheet_searingscourge') && !g.count('sheet_deathhandsscourge'));
        T.startFight(['ogre', 'ogre', 'ogre', 'ogre']);
        for (var wS = 0; wS < 400 && !DS.find('battle'); wS++) T.step(1);
        var bS = DS.find('battle'), AS = bS.heroes.filter(function (x) { return x.h.id === 'aurdin'; })[0]; bS.intro = 0;
        var castable = DS.R.spellList(AS.h, 'battle').map(function (sp) { return sp.id; });
        check('ON HIS LIST IN A FIGHT: Searing Scourge ' + (castable.indexOf('searingscourge') >= 0) + ', Deathhand\'s ' + (castable.indexOf('deathhandsscourge') >= 0), castable.indexOf('searingscourge') >= 0 && castable.indexOf('deathhandsscourge') >= 0);
        bS.foes.forEach(function (f) { f.hp = f.maxhp = 400; f.m = Object.assign({}, f.m, { saves: Object.assign({}, f.m.saves, { dex: -30 }) }); });
        var front = bS.frontFoe(), took = bS.aroundFoes();
        rollsS = []; AS.h.slots = [4, 3, 3]; runS(bS.castSpell(AS, DS.DATA.spells.searingscourge, { actions: 1, bonus: 1, surged: false, sneakUsed: false }));
        var lostS = bS.foes.map(function (f) { return 400 - f.hp; }), hitS = lostS.filter(function (x) { return x > 0; }).length, spun = AS.spin;
        check('SEARING SCOURGE at 2nd: ' + hitS + ' of four burned (want 3: the front one first -- ' + (took[0] === front) + '), lost ' + lostS.join(',') + ', rolled ' + rollsS.filter(function (e) { return /d6$/.test(e); }).join(',') + ' (want one 1d6 for all), a 2nd-level slot spent (' + AS.h.slots[1] + ' left), the twirl set (' + spun + ' frames left)',
          hitS === 3 && took[0] === front && took.every(function (f) { return 400 - f.hp > 0; }) && rollsS.filter(function (e) { return e === '1d6'; }).length === 1 && AS.h.slots[1] === 2 && spun > 0);
        bS.foes.forEach(function (f) { f.hp = 400; }); rollsS = []; AS.h.slots = [4, 3, 3];
        runS(bS.castSpell(AS, DS.DATA.spells.deathhandsscourge, { actions: 1, bonus: 1, surged: false, sneakUsed: false }));
        var rollsD2 = rollsS.slice(); bS.foes.forEach(function (f) { f.hp = 400; }); rollsS = []; AS.h.slots = [4, 0, 3];
        runS(bS.castSpell(AS, DS.DATA.spells.deathhandsscourge, { actions: 1, bonus: 1, surged: false, sneakUsed: false }));
        check('DEATHHAND\'S: at 2nd rolled ' + rollsD2.filter(function (e) { return /^\d+d\d+$/.test(e) && e !== '1d20'; }).join(',') + ' (want 1d4,1d4), at 3rd ' + rollsS.filter(function (e) { return /^\d+d\d+$/.test(e) && e !== '1d20'; }).join(',') + ' (want 1d6,1d6); the front one ' + (400 - front.hp) + ' lost, fire and necrotic',
          rollsD2.filter(function (e) { return e === '1d4'; }).length === 2 && rollsS.filter(function (e) { return e === '1d6'; }).length === 2 && front.hp < 400);
      } finally { DS.roll = roll0S; DS.W8.scene = scene0S; }
    } else if (test === 'levelpick1014') {
      // THE LEVEL-UP PICK (10-14, the level-up pick lane; Griz: "this will be taking over that function and including all class level choices (at least the 4 for the
      // game for now)", "1-3 lean"): the level-up takes the build's picks and leaves each an ask; no one to ask keeps today's pair; the field opens the one pick page
      // (js/scenes.js PickScene, js/menu.js MN.openPicks) for every hero with a choice; the page offers only the pool (no page-only spell, nothing known, nothing past
      // his slots), the build's marked, CONFIRM refused short of the count; each swap lands on the sheet and a load keeps it; Vivian's archetype and Expertise on it
      var R8 = DS.R, auto0 = DS.autoPicks;
      function upTo(h, n) { h.xp = R8.XP_LEVEL[n]; return R8.gainXP(h, 0); }
      function K(b) { return { pressed: function (x) { return x === b; }, repeat: function (x) { return x === b; } }; }
      function rowAt(pg, id) { for (var t = 0; t < pg.tabs.length; t++) { pg.tab = t; pg.list.i = 0; pg.refresh(); for (var i = 0; i < pg.list.items.length; i++) { var it = pg.list.items[i]; if (it.value && it.value.id === id) { pg.list.i = i; pg.list.fix(); return true; } } } return false; }
      function hitRow(m, id) { var pg = m.top(); if (!rowAt(pg, id)) return false; m.update(K('a')); return true; }
      function confirmP(m) { var pg = m.top(); pg.list.i = pg.list.items.findIndex(function (it) { return it.confirm; }); pg.list.fix(); m.update(K('a')); }
      function allRows(pg) { var ids = []; pg.groups.forEach(function (gr) { gr.rows.forEach(function (r) { ids.push(r.id); }); }); return ids; }
      try {
        // 1. the level-up leaves the asks, the defaults taken; no one to ask keeps them
        var a1 = R8.makeHero('aurdin', 3), linesA = upTo(a1, 4), rec1 = (a1.picks || [])[0];
        var kinds1 = rec1 ? rec1.asks.map(function (x) { return x.kind + ':' + x.need; }).join(',') : 'none';
        check('AURDIN 3 -> 4 asks ' + kinds1 + ' (want asi:2,spells:2,cantrip:1), the pair and the cantrip taken already (' + ['web', 'shatter', 'dancinglights'].every(function (id) { return a1.known.indexOf(id) >= 0; }) + '), flagged ' + a1.pendingChoice,
          kinds1 === 'asi:2,spells:2,cantrip:1' && ['web', 'shatter', 'dancinglights'].every(function (id) { return a1.known.indexOf(id) >= 0; }) && a1.pendingChoice === 'pick' && rec1.lvl === 4);
        // (his find, 10-14: "all the old level up text played before picker opened" -- the lines say what is to choose, not the build's picks)
        var saidA = linesA.join(' | ');
        check('THE LEVEL-UP LINES before the page: "' + saidA + '" -- no "learns", no "Ability scores", one "chooses ... next"',
          !/learns|Ability scores/.test(saidA) && /Aurdin chooses ability scores, two spells and a cantrip next\./.test(saidA) && /is now level 4/.test(saidA));
        R8.autoPicks(a1);
        check('NO ONE TO ASK: the build\'s picks stand (web ' + (a1.known.indexOf('web') >= 0) + ', shatter ' + (a1.known.indexOf('shatter') >= 0) + '), nothing left asked (' + !a1.picks + ', ' + !a1.pendingChoice + ')',
          a1.known.indexOf('web') >= 0 && a1.known.indexOf('shatter') >= 0 && !a1.picks && !a1.pendingChoice);
        var a5 = R8.makeHero('aurdin', 5), v3 = R8.makeHero('vivian', 3);
        check('A HERO MADE AT A LEVEL: Aurdin at 5 knows the sheet\'s (' + ['scorchingray', 'ropetrick', 'web', 'shatter', 'dancinglights', 'fireball', 'lightningbolt'].every(function (id) { return a5.known.indexOf(id) >= 0; }) + '), nothing asked (' + !a5.picks + '); Vivian at 3 still waits on her archetype (' + v3.pendingChoice + ', ' + v3.subclass + ')',
          ['scorchingray', 'ropetrick', 'web', 'shatter', 'dancinglights', 'fireball', 'lightningbolt'].every(function (id) { return a5.known.indexOf(id) >= 0; }) && !a5.picks && v3.pendingChoice === 'archetype' && v3.subclass === null);
        // 2. the field: four heroes level, the page opens over it
        DS.autoPicks = false;
        g.party = [R8.makeHero('barley', 3), R8.makeHero('aurdin', 3), R8.makeHero('vivian', 2), R8.makeHero('lymen', 3)];
        var bar = g.party[0], aur = g.party[1], viv = g.party[2], lym = g.party[3];
        var str0 = bar.abil.str, con0 = bar.abil.con;
        upTo(bar, 4); upTo(aur, 4); upTo(viv, 3); upTo(lym, 4);
        var hp4 = bar.maxhp;
        for (var wP = 0; wP < 60 && !(DS.top() && DS.top().kind === 'picks'); wP++) T.step(1);
        var scP = DS.top(), mP = scP && scP.m;
        check('THE FIELD OPENS THE PICK PAGE: ' + (scP && scP.kind) + ', first ' + (mP && mP.top().h.name) + ' (want Barley)', scP && scP.kind === 'picks' && mP.top().h === bar);
        // (10-16, his "why not level barley right then, followed by Aurdin levels up, then leveling him up": each hero's level lines come over that hero's own page, said once)
        var lvSaid = {};
        function lvLine(m) { var pg = m.top(), t = m.toast ? m.toast.lines.join(' | ') : ''; lvSaid[pg.h.id] = t; if (m.toast) m.update(K('a')); return t; }
        lvLine(mP);
        // Barley: STR +2 marked; CON +2 instead
        var pgB = mP.top(), marksB = JSON.stringify(pgB.groups[0].marks), topB = !!pgB.list.items[0].confirm && pgB.list.i === 0;
        function KM(mo) { return { pressed: function () { return false; }, repeat: function () { return false; }, mouse: Object.assign({ x: -1, y: -1, moved: false, click: false, rclick: false, wheel: 0 }, mo) }; }
        hitRow(mP, 'str'); hitRow(mP, 'con'); hitRow(mP, 'con'); confirmP(mP);
        var toastB = mP.toast ? mP.toast.lines.join(' ') : ''; mP.update(K('a'));
        check('BARLEY\'S SCORES: the build\'s ' + marksB + ' marked (want {"str":2}); CON +2 taken: STR ' + bar.abil.str + ' (want ' + str0 + '), CON ' + bar.abil.con + ' (want ' + (con0 + 2) + '), max HP ' + hp4 + ' -> ' + bar.maxhp + ' (want +4); "' + toastB + '"',
          marksB === '{"str":2}' && bar.abil.str === str0 && bar.abil.con === con0 + 2 && bar.maxhp === hp4 + 4 * (DS.mod(con0 + 2) - DS.mod(con0)) && /CON \+2/.test(toastB));
        // Aurdin: the pool, the build's marked; Web out, Blur in
        lvLine(mP);
        // (10-16, his "when you confirm ability it moves you [to the] spell choice selection": CONFIRM walks to each tab holding a mark he has not seen -- SCORES,
        // then CANTRIP, then L2 (L1 holds none of the build's) -- and keeps nothing on the way)
        var pgW = mP.top(), walk = [pgW.tabs[pgW.tab].label];
        for (var wW = 0; wW < 2; wW++) { confirmP(mP); walk.push(mP.top().tabs[mP.top().tab].label); }
        var keptW = !!(aur.chose && aur.chose[4]), thenW = pgW.list.items[0].right;
        check('CONFIRM WALKS THE MARKED TABS FIRST: ' + walk.join(' -> ') + ' (want SCORES -> CANTRIP -> L2), nothing kept on the way (' + !keptW + '), the page still Aurdin\'s (' + (mP.top() === pgW) + '); at L2 the row says "' + thenW + '" (want nothing: every marked tab seen)',
          walk.join('/') === 'SCORES/CANTRIP/L2' && !keptW && mP.top() === pgW && !thenW);
        var pgA = mP.top(), idsA = allRows(pgA), spA = pgA.groups.filter(function (x) { return x.ask.kind === 'spells'; })[0];
        var pageOnly = idsA.filter(function (id) { return R8.pageOnly(id); }), knownIn = idsA.filter(function (id) { return aur.known.indexOf(id) >= 0 && ['web', 'shatter', 'dancinglights'].indexOf(id) < 0; });
        var tooHigh = spA.rows.filter(function (r) { return r.lv > 2; }).map(function (r) { return r.id; });
        check('AURDIN\'S PAGE (' + (pgA.h === aur) + '): tabs ' + pgA.tabs.map(function (t) { return t.label; }).join('/') + '; ' + spA.rows.length + ' spells offered, page-only among them ' + JSON.stringify(pageOnly) + ', known ' + JSON.stringify(knownIn) + ', past his 2nd ' + JSON.stringify(tooHigh) + '; marked ' + JSON.stringify(spA.marks),
          pgA.h === aur && !pageOnly.length && !knownIn.length && !tooHigh.length && spA.rows.length >= 10 && JSON.stringify(spA.marks) === '{"web":1,"shatter":1}' && pgA.tabs[0].label === 'SCORES');
        hitRow(mP, 'web'); confirmP(mP);
        var refused = mP.toast ? mP.toast.lines.join(' ') : '', stillA = mP.top() === pgA; mP.update(KM({ rclick: true })); var rclickGone = !mP.toast; // (his: a right click lets the message go)
        rowAt(pgA, 'shatter'); var sc0 = pgA.list.scroll, n0 = pgA.list.items.length; mP.update(KM({ wheel: 1 })); var sc1 = pgA.list.scroll, inView = pgA.list.i >= sc1 && pgA.list.i < sc1 + pgA.list.vis; mP.update(KM({ wheel: -1 }));
        check('HIS THREE (10-14): CONFIRM the top row, the cursor on it when the build\'s picks stand (' + topB + '); a right click lets the message go (' + rclickGone + '); the wheel scrolls the spells (' + n0 + ' rows: ' + sc0 + ' -> ' + sc1 + ', the cursor in sight ' + inView + ')', topB && rclickGone && n0 > pgA.list.vis && sc1 === sc0 + 1 && inView);
        hitRow(mP, 'blur'); confirmP(mP);
        var toastA = mP.toast ? mP.toast.lines.join(' ') : ''; mP.update(K('a'));
        check('ONE SHORT, CONFIRM SAYS SO ("' + refused + '", the page stays ' + stillA + '); Blur for Web: web ' + (aur.known.indexOf('web') >= 0) + ', blur ' + (aur.known.indexOf('blur') >= 0) + ', shatter ' + (aur.known.indexOf('shatter') >= 0) + ', the cantrip ' + (aur.known.indexOf('dancinglights') >= 0) + '; chose ' + JSON.stringify(aur.chose && aur.chose[4]),
          /Not yet: 1 more/.test(refused) && stillA && aur.known.indexOf('web') < 0 && aur.known.indexOf('blur') >= 0 && aur.known.indexOf('shatter') >= 0 && aur.known.indexOf('dancinglights') >= 0 && JSON.stringify(aur.chose[4].spells) === '["shatter","blur"]');
        // Vivian: her archetype, nothing marked; Cutthroat
        lvLine(mP);
        var pgV = mP.top(), arV = pgV.groups[0], noneV = !Object.keys(arV.marks).length && pgV.list.i === 1; // (nothing marked: the cursor on the first choice, not CONFIRM)
        confirmP(mP); var refusedV = mP.toast ? mP.toast.lines.join(' ') : ''; mP.update(K('a'));
        hitRow(mP, 'Cutthroat'); confirmP(mP); mP.update(K('a'));
        check('VIVIAN\'S ARCHETYPE on the page (' + (pgV.h === viv) + ', ' + arV.ask.kind + ', rows ' + arV.rows.map(function (r) { return r.id; }).join('/') + ', none marked ' + noneV + '); CONFIRM refused first ("' + refusedV + '"); she is a ' + viv.subclass + ', flag ' + viv.pendingChoice,
          pgV.h === viv && noneV && arV.ask.kind === 'archetype' && arV.rows.length === 2 && /Not yet/.test(refusedV) && viv.subclass === 'Cutthroat' && !viv.pendingChoice && !viv.picks);
        // Lymen: one press keeps the build's
        lvLine(mP);
        var lymA = JSON.stringify(lym.abil); confirmP(mP); mP.update(K('a'));
        var lvAll = ['barley', 'aurdin', 'vivian', 'lymen'].map(function (id) { return id + ': "' + (lvSaid[id] || '') + '"'; }).join('; ');
        check('EACH HERO\'S LEVEL LINES OVER THAT HERO\'S OWN PAGE, none of them a "chooses ... next" (his 10-16): ' + lvAll,
          ['barley', 'aurdin', 'vivian', 'lymen'].every(function (id) { var t = lvSaid[id] || ''; return /is now level/.test(t) && !/chooses .* next|learns|Ability scores/.test(t); }) && /Barley is now level 4/.test(lvSaid.barley) && /Vivian is now level 3/.test(lvSaid.vivian));
        for (var wQ = 0; wQ < 10 && DS.top() && DS.top().kind === 'picks'; wQ++) T.step(1);
        check('LYMEN KEEPS THE BUILD\'S WITH ONE PRESS (' + (JSON.stringify(lym.abil) === lymA) + '); the page closes on the field (' + (DS.top() && DS.top().kind) + '); nothing asked (' + g.party.every(function (h) { return !h.pendingChoice && !h.picks; }) + ')',
          JSON.stringify(lym.abil) === lymA && DS.top() === DS.field && g.party.every(function (h) { return !h.pendingChoice && !h.picks; }));
        // 3. a load keeps the choice: the sheet's pair is not filled back in
        R8.migrate(aur);
        check('A LOAD KEEPS HIS CHOICE: web ' + (aur.known.indexOf('web') >= 0) + ' (want false), blur ' + (aur.known.indexOf('blur') >= 0), aur.known.indexOf('web') < 0 && aur.known.indexOf('blur') >= 0);
        // 4. Vivian's Expertise at 6; Barley's third increase at 6; an old save's waiting archetype comes back as an ask
        var v5 = R8.makeHero('vivian', 5); R8.settlePicks(v5, { archetype: 'Thief' }); upTo(v5, 6);
        var recV = (v5.picks || [])[0], askE = recV && recV.asks.filter(function (x) { return x.kind === 'expertise'; })[0], ins0 = R8.skill(v5, 'Insight', 'wis');
        var rowsE = askE ? R8.pickRows(v5, recV, askE, { pages: true }).map(function (r) { return r.id; }) : [];
        R8.applyPick(v5, recV, { expertise: ['Insight', 'Acrobatics'] });
        check('VIVIAN AT 6: Expertise asked (' + (askE && askE.took.join('+')) + ' the build\'s), offered ' + rowsE.join('/') + '; Insight and Acrobatics taken: Insight ' + ins0 + ' -> ' + R8.skill(v5, 'Insight', 'wis') + ', Stealth no longer twice (' + (v5.expertise.indexOf('Stealth') < 0) + ')',
          askE && rowsE.indexOf('Sleight of Hand') < 0 && rowsE.indexOf('Insight') >= 0 && R8.skill(v5, 'Insight', 'wis') === ins0 + R8.prof(6) && v5.expertise.indexOf('Stealth') < 0 && !v5.picks);
        var b5 = R8.makeHero('barley', 5); upTo(b5, 6);
        check('BARLEY AT 6 asks his third increase (' + ((b5.picks || [])[0] || { asks: [] }).asks.map(function (x) { return x.kind; }).join(',') + ')', b5.picks && b5.picks[0].asks[0].kind === 'asi');
        var old = R8.makeHero('vivian', 3); delete old.picks; old.pendingChoice = 'archetype'; R8.migrate(old);
        check('AN OLDER SAVE\'S WAITING ARCHETYPE becomes an ask (' + R8.asking(old, 'archetype') + ', flag ' + old.pendingChoice + ')', R8.asking(old, 'archetype') && old.pendingChoice === 'archetype');
      } finally { DS.autoPicks = auto0; }
    } else if (test === 'wetfloor1020') {
      // the Wet on its own 8-bit floor again (the first game lane, 10-20; Griz: "the 8-bit handoff (at the cradle and with light) are so jarring"; "8 bit solely 8-bit after
      // this"). In place of roam8 (the Wet on the grid, the 8-bit's half, 10-14: the frame opened in warrens_d, 'd16:roam' and 'd16:hand' applied, the familiar back from
      // the floor -- all of it the roam's, gone with it; the grid's own half stays in bench16 mode=roam1014, for the second game). Checked: no roam left; set down in
      // warrens_d by its enter hook no frame comes and the game never holds still; a save in the Wet loads onto the 8-bit floor; and the Settling's own triggers on the floor
      // -- the jelly's shore, the pool ooze's puddle, the landlord's rim -- each play the 8-bit battle there, and the dead stay dead
      var set0W = window.setTimeout, frW = 0, heldW = false;
      window.setTimeout = function (fn) { pending.push(fn); return 0; };
      function stepW(n, until) { for (var k = 0; k < n && !(until && until()); k++) { if (document.getElementById('d16')) frW++; if (DS.paused) heldW = true; var tp = DS.top(); if (tp && tp.kind === 'dialog') { if (tp.chars < tp.pageLen()) tp.chars = tp.pageLen(); T.tapf('a'); } else T.step(1); } }
      try {
        check('no roam in the 8-bit: DS.roam8 ' + typeof DS.roam8, DS.roam8 === undefined);
        var gW = SETUP(4); DS.field.load('warrens_d', 2, 12, 'right'); gW.x = 2; gW.y = 12; DS.paused = false;
        var hookW = DS.SCRIPTS['enter:warrens_d'], doneW = !hookW;
        if (hookW) DS.run(function* () { yield* hookW(); }, function () { doneW = true; });
        stepW(400, function () { return doneW && !DS.scriptActive(); });
        check('set down in warrens_d (its enter hook ' + typeof hookW + '): no frame (' + frW + '), the game never held still (' + !heldW + '), the hook done (' + doneW + '), on ' + DS.field.map.id + ' ' + gW.x + ',' + gW.y,
          frW === 0 && !heldW && doneW && DS.field.map.id === 'warrens_d' && gW.x === 2 && gW.y === 12);
        var svW = JSON.parse(JSON.stringify({ v: gW.v, lead: gW.lead, party: gW.party, inv: gW.inv, silver: gW.silver, flags: gW.flags, renown: gW.renown, map: 'warrens_d', x: 2, y: 12, dir: 'right', steps: gW.steps, time: gW.time, kills: gW.kills, hired: gW.hired, guests: gW.guests || [] }));
        DS.startFrom(svW); gW = DS.G; frW = 0; heldW = false; DS.paused = false; stepW(200);
        check('a save in the Wet loads onto the 8-bit floor: on ' + (DS.field && DS.field.map && DS.field.map.id) + ', no frame (' + frW + '), nothing running (' + !DS.scriptActive() + ')', DS.field && DS.field.map && DS.field.map.id === 'warrens_d' && frW === 0 && !DS.scriptActive());
        [['jelly', 'jellyDead'], ['poolOoze', 'poolOozeDead'], ['landlordNear', 'otyughDead']].forEach(function (w) {
          var g2 = SETUP(4); delete g2.flags.otyughFed; DS.field.load('warrens_d', 2, 12, 'right'); DS.paused = false; frW = 0;
          var tr = (DS.field.map.src.triggers || []).filter(function (t) { return t.script === w[0] && DS.cond(t.cond); })[0], doneT = false, b = null;
          if (!tr) { check('the Settling\'s ' + w[0] + ': no live trigger on the floor', false); return; }
          var r0 = tr.rect || [tr.x, tr.y, 1, 1]; g2.x = r0[0]; g2.y = r0[1];
          DS.run(function* () { yield* DS.EV.trigger(tr, DS.field); }, function () { doneT = true; });
          stepW(600, function () { return !!DS.find('battle'); }); b = DS.find('battle');
          if (b) { b.foes.forEach(function (f) { f.hp = 0; f.dead = true; }); drive({}, 1500); }
          stepW(800, function () { return doneT && !DS.scriptActive(); });
          check('the Settling\'s ' + w[0] + ' (' + tr.id + ') on the 8-bit floor: the 8-bit battle (' + !!b + ', ' + (b && b.o.enemies.join(',')) + ', deep16 ' + (b && b.o.deep16) + '), no frame (' + frW + '), ' + w[1] + ' ' + g2.flags[w[1]] + ', the scene done (' + doneT + ')',
            !!b && b.o.deep16 === 'wet' && frW === 0 && g2.flags[w[1]] === 1 && doneT);
        });
      } catch (eW) { check('threw: ' + String(eW && eW.stack || eW).slice(0, 400), false); }
      finally { window.setTimeout = set0W; }
    } else if (test === 'payout1014') {
      // a won fight's payout, lifted into js/rules.js (10-14, the party-token map lane §6d: R.tally, R.spoils, R.shareXP -- one copy the grid's roam pays by too): the same
      // XP, coin, drops, parts, tally and lines for the same dice. One foe fled (nothing off it); the parts' skills on the party as they stand. Its PAID line is the receipt
      // the old js/battle.js gave the same, word for word (the byte-exact swap)
      var say0P = DS.say, saidP = [];
      DS.say = function (t) { saidP.push([].concat(t).join(' / ')); return say0P.apply(this, arguments); };
      try {
        g.party.forEach(function (h) { h.lvl = 3; h.xp = DS.R.XP_LEVEL[3] + 1700; }); g.party[1].skills = Object.assign({}, g.party[1].skills, { Survival: 1, Arcana: 1 }); // (Aurdin harvests; 100 short of 4th)
        var invP0 = {}; (g.inv || []).forEach(function (s) { invP0[s.id] = s.n; }); var silP0 = g.silver, kP0 = JSON.stringify(g.kills);
        DS.seedDice(1014);
        T.startFight(['crawler', 'darkmantle', 'ettercap', 'ettercap', 'giantspider'], { zone: 'warrens_d' });
        for (var wP = 0; wP < 200 && !DS.find('battle'); wP++) T.step(1);
        var bP = DS.find('battle'); bP.intro = 0;
        bP.foes.forEach(function (f, i) { if (i === 4) f.fled = true; f.hp = 0; f.dead = true; }); bP.over = 'win'; drive({}, 1500);
        var gotP = []; (g.inv || []).forEach(function (s) { var d = s.n - (invP0[s.id] || 0); if (d) gotP.push(s.id + ' +' + d); });
        var xpP = g.party.map(function (h) { return h.name + ' ' + h.lvl + '/' + h.xp; }).join(', '), kills = g.kills;
        out.checks.push('     PAID xp ' + xpP + ' | silver +' + (g.silver - silP0) + ' | got ' + gotP.join(', ') + ' | kills ' + JSON.stringify(kills) + ' | said ' + saidP.join(' // ')); // (the receipt: the same line off the code before)
        var poolP = ['crawler', 'darkmantle', 'ettercap', 'ettercap'].reduce(function (a, id) { return a + (DS.DATA.monsters[id].xp || 0); }, 0), eachP = Math.floor(poolP / 4);
        check('THE PAYOUT: each standing gains ' + eachP + ' (pool ' + poolP + ', the one that fled none) -- ' + xpP + '; Aurdin to 4th; the tally ' + JSON.stringify(kills) + ' (the spider none); the parts ' + gotP.join(', '),
          g.party.every(function (h) { return h.xp === DS.R.XP_LEVEL[3] + 1700 + eachP; }) && g.party[1].lvl === 4 && kills.crawler === 1 && kills.ettercap === 2 && kills['warrens_d:ettercap'] === 2 && !kills.giantspider &&
          gotP.some(function (x) { return /^crawlerichor/.test(x); }) && gotP.some(function (x) { return /^gulchsilk \+2/.test(x); }) && /Each fighter standing gains/.test(saidP.join(' ')));
      } finally { DS.say = say0P; }
    } else if (test === 'conc1017') {
      // END CONCENTRATION, free, in the 8-bit (10-17, Griz: "i just discovered in the pane the need for a free action 'end concentration spell' i think.."; SRD 5.1: "You can end
      // concentration at any time (no action required)"): Aurdin holding a spell has END <IT> on SKILL, free, and on the one menu's SKILLS lit as the free; picked, it lets go
      // with its line and the turn goes on ('free'); no spell held, no END
      try {
        T.startFight(['gnoll', 'gnoll']); for (var wC = 0; wC < 400 && !DS.find('battle'); wC++) T.step(1);
        var btC = DS.find('battle'), auC = btC.heroes.filter(function (u) { return u.h.id === 'aurdin'; })[0], stC = { actions: 1, bonus: 1, surged: false, sneakUsed: false };
        var driveC = function (g) { var k = 0, st; while (g && k++ < 2000) { st = g.next(); if (st.done) return st.value; } };
        var sayC = btC.say, saidC = []; btC.say = function* (t) { saidC.push(t); };
        var noneC = btC.skillList(auC, stC).filter(function (r) { return r.value === 'endconc'; }).length;
        var spC = DS.DATA.spells.web || DS.DATA.spells.bless; driveC(btC.beginConc(auC, spC));
        var rowC = btC.skillList(auC, stC).filter(function (r) { return r.value === 'endconc'; })[0];
        check('no spell held: no END (' + noneC + '); ' + spC.name + ' held: SKILL has "' + (rowC && rowC.label) + '" ' + (rowC && rowC.right), !noneC && rowC && rowC.label === 'END ' + spC.name.toUpperCase() && rowC.right === 'free');
        var resC = driveC(btC.useSkill(auC, 'endconc', stC));
        check('END picked: returns ' + resC + ' (the turn goes on), held ' + !!auC.conc + ', said "' + saidC.join(' | ') + '", the action ' + stC.actions + ', the bonus ' + stC.bonus,
          resC === 'free' && !auC.conc && saidC.some(function (t) { return new RegExp('lets go of ' + spC.name + '\\.$').test(t); }) && stC.actions === 1 && stC.bonus === 1);
        check('after: no END on SKILL', !btC.skillList(auC, stC).some(function (r) { return r.value === 'endconc'; }));
        btC.say = sayC;
      } catch (eC) { check('threw: ' + String(eC && eC.stack || eC).slice(0, 500), false); }
    } else if (test === 'twf1015') {
      // two-weapon fighting in the 8-bit (RULED 10-15, Griz: "5 - we're gonna have to do a dual-wield"; SRD 5.1): FIGHT with a shortsword and a dagger in the off hand swings the
      // shortsword, then the dagger with the bonus action -- its damage without DEX; no bonus action left, no second swing; a longsword and a dagger, none. Pyro's swings are his
      // script's and stay as they were (his "4 - does his script allow for the mace's magic to magic and his ability modifier? if so, yes"): STR +5 on both maces, the white one magic
      var d20o = null, rollO = DS.roll, hurtO = null, dealtO = [];
      try {
        DS.EV.addGuest('pyro');
        T.startFight(['gnoll', 'gnoll']); for (var wT = 0; wT < 400 && !DS.find('battle'); wT++) T.step(1);
        var btT = DS.find('battle'), viT = btT.heroes.filter(function (u) { return u.h.id === 'vivian'; })[0], pyT = btT.heroes.filter(function (u) { return u.h.id === 'pyro'; })[0], gnT = btT.foes[0];
        btT.foes.forEach(function (f) { f.hp = f.maxhp = 900; });
        d20o = btT.d20; btT.d20 = function () { return 15; }; DS.roll = function () { return 1; }; hurtO = btT.hurt; btT.hurt = function (t, n, type, o) { dealtO.push({ n: n, type: type, magic: !!(o && o.magicWeapon) }); return n; };
        viT.h.equip.weapon = 'shortsword'; viT.h.equip.offhand = 'dagger'; viT.h.equip.shield = null;
        var dexT = DS.mod(viT.h.abil.dex), stT = { actions: 1, bonus: 1, surged: false, sneakUsed: true }, saidT = [], sayT = btT.say; btT.say = function* (t) { saidT.push(t); };
        var drive = function (g) { var k = 0, st; while (g && k++ < 2000) { st = g.next(); if (st.done) return; } };
        drive(btT.heroAttack(viT, gnT, stT, null)); var mainD = dealtO.slice(); dealtO = [];
        drive(btT.offhandSwing(viT, gnT, stT)); var offD = dealtO.slice(); dealtO = [];
        check('FIGHT, the shortsword then the dagger: the shortsword for ' + mainD.map(function (x) { return x.n; }).join('+') + ' (1 + DEX ' + dexT + '), the dagger for ' + offD.map(function (x) { return x.n; }).join('+') + ' (1, DEX left off), the bonus action ' + stT.bonus + ', said "' + (saidT.filter(function (t) { return /follows/.test(t); })[0] || '') + '"',
          mainD.length === 1 && mainD[0].n === 1 + dexT && offD.length === 1 && offD[0].n === 1 && stT.bonus === 0 && saidT.some(function (t) { return /follows with the Dagger in the off hand/.test(t); }));
        drive(btT.offhandSwing(viT, gnT, stT)); var againT = dealtO.length; dealtO = [];
        viT.h.equip.weapon = 'longsword'; var stL = { actions: 1, bonus: 1, sneakUsed: true }; drive(btT.offhandSwing(viT, gnT, stL)); var lsT = dealtO.length; dealtO = [];
        check('no bonus action left: no second swing (' + againT + '); a longsword and a dagger: none (' + lsT + ', the bonus action kept ' + stL.bonus + ')', againT === 0 && lsT === 0 && stL.bonus === 1);
        btT.say = sayT;
        // Pyro: his script's swings (js/pyro.js S8.measure: heroAttack with st.w, never st.offhand) -- STR on both, the Mace of Disruption magic (bonded: no attuned list)
        var ph = pyT && pyT.h, strP = ph ? DS.mod(ph.abil.str) : 0, plainP = ph && DS.R.item(ph.equip.weapon), whiteP = ph && DS.R.item(ph.equip.offhand);
        drive(btT.heroAttack(pyT, gnT, { actions: 1, bonus: 0, sneakUsed: true, w: plainP, n: 1 }, null)); var pP = dealtO.slice(); dealtO = [];
        drive(btT.heroAttack(pyT, gnT, { actions: 1, bonus: 0, sneakUsed: true, w: whiteP, n: 1 }, null)); var pW = dealtO.slice(); dealtO = [];
        check('Pyro: the mace for ' + (pP[0] && pP[0].n) + ' (1 + STR ' + strP + '), the Mace of Disruption for ' + (pW[0] && pW[0].n) + ' magic ' + (pW[0] && pW[0].magic) + '; two-weapon fighting offered him ' + DS.R.twoWeapon(ph).ok,
          !!ph && pP.length === 1 && pP[0].n === 1 + strP && pW.length >= 1 && pW[0].n === 1 + strP && pW[0].magic && !DS.R.twoWeapon(ph).ok);
      } catch (eT) { check('threw: ' + String(eT && eT.stack || eT).slice(0, 500), false); }
      DS.roll = rollO; var btT2 = DS.find('battle'); if (btT2 && d20o) btT2.d20 = d20o; if (btT2 && hurtO) btT2.hurt = hurtO;
    } else if (test === 'stabdebut1029') {
      // STAB DEBUT in the 8-bit (the leveling lane, 10-29 -- Griz: "replace 'opening cut' with 'Stab Debut' where she gets a straight weapon damage attack (no bonuses) on targets
      // that haven't first-turned"; "yeah to stab debut bench check"): Vivian, a Cutthroat, at a gnoll that has not had a turn -- her blow (1 + DEX + the Sneak Attack's 1), then
      // the stab (1: the dice alone), no critical and no advantage from it; at a gnoll that has had its turn, one blow; a Thief, one blow; the archetype's line on her page
      var d20s = null, rollS = DS.roll, hurtS = null, dealtS = [], advS = [];
      try {
        T.startFight(['gnoll', 'gnoll']); for (var wS = 0; wS < 400 && !DS.find('battle'); wS++) T.step(1);
        var btS = DS.find('battle'), viS = btS.heroes.filter(function (u) { return u.h.id === 'vivian'; })[0], gnS = btS.foes[0];
        btS.foes.forEach(function (f) { f.hp = f.maxhp = 900; f.acted = false; });
        d20s = btS.d20; btS.d20 = function (a) { advS.push(a); return 15; }; DS.roll = function () { return 1; }; hurtS = btS.hurt; btS.hurt = function (t, n) { dealtS.push(n); return n; };
        var saidS = [], sayS = btS.say; btS.say = function* (t) { saidS.push(t); };
        var driveS = function (g) { var k = 0, st; while (g && k++ < 2000) { st = g.next(); if (st.done) return; } };
        var dexS = DS.mod(viS.h.abil.dex), sub0 = viS.h.subclass;
        viS.h.subclass = 'Cutthroat'; driveS(btS.heroAttack(viS, gnS, { actions: 1, bonus: 0, surged: false, sneakUsed: false }, null)); var cutD = dealtS.slice(), cutA = advS.slice(), cutSaid = saidS.join(' | '); dealtS = []; advS = []; saidS = [];
        check('A CUTTHROAT AT ONE THAT HAS NOT HAD A TURN: blows for ' + cutD.join(' + ') + ' (want ' + (1 + dexS + 1) + ' + 1), advantage ' + JSON.stringify(cutA) + '; said "' + cutSaid.slice(0, 220) + '"',
          cutD.length === 2 && cutD[0] === 1 + dexS + 1 && cutD[1] === 1 && cutA.every(function (a) { return !(a > 0); }) && /stab debut/i.test(cutSaid) && !/Critical!|Opening cut/.test(cutSaid));
        gnS.acted = true; driveS(btS.heroAttack(viS, gnS, { actions: 1, bonus: 0, surged: false, sneakUsed: false }, null)); var actD = dealtS.slice(); dealtS = []; gnS.acted = false;
        viS.h.subclass = 'Thief'; driveS(btS.heroAttack(viS, gnS, { actions: 1, bonus: 0, surged: false, sneakUsed: false }, null)); var thD = dealtS.slice(); dealtS = []; viS.h.subclass = sub0;
        check('at one that has had its turn: ' + actD.length + ' blow; a Thief: ' + thD.length + ' blow', actD.length === 1 && thD.length === 1);
        // a natural 20 on the stab (10-30, his "restore the 'on crit' properties to it"): a critical, and Savage Attacks (a half-orc's) ride it -- the dice 1 each: 1 + 1
        var sav0 = DS.R.savage, seqS = [15, 20]; DS.R.savage = function () { return true; }; btS.d20 = function (a) { advS.push(a); return seqS.length ? seqS.shift() : 15; };
        viS.h.subclass = 'Cutthroat'; gnS.acted = false; driveS(btS.heroAttack(viS, gnS, { actions: 1, bonus: 0, surged: false, sneakUsed: false }, null)); var crD = dealtS.slice(), crSaid = saidS.join(' | '); dealtS = []; saidS = []; viS.h.subclass = sub0; DS.R.savage = sav0;
        check('A 20 ON THE STAB, Savage Attacks in her blood: blows for ' + crD.join(' + ') + ' (want ' + (1 + dexS + 1) + ' + 2); said "' + crSaid.slice(-120) + '"', crD.length === 2 && crD[1] === 2 && /Critical! .*Stab debut!/.test(crSaid));
        var arcS = (DS.DATA.heroes.vivian.archetypes || []).filter(function (a) { return a.name === 'Cutthroat'; })[0];
        check('her page\'s line: "' + (arcS && arcS.desc) + '"', !!arcS && /Stab Debut/.test(arcS.desc) && !/Opening Cut/.test(arcS.desc));
        btS.say = sayS;
      } catch (eS) { check('threw: ' + String(eS && eS.stack || eS).slice(0, 500), false); }
      DS.roll = rollS; var btS2 = DS.find('battle'); if (btS2 && d20s) btS2.d20 = d20s; if (btS2 && hurtS) btS2.hurt = hurtS;
    } else if (test === 'offhand1015') {
      // the OFFHAND (RULED 10-15, Griz: "OFFHAND is shield hand, just change text and function for where that slot is among slots"; "6 - yeah, in the offhand instead of its own
      // slot"): EQUIP's third place is OFFHAND (no LIGHT row); it holds one thing -- a shield, a weapon, the light -- its list the pack's shields, one-handed melee weapons
      // and lights; a dagger there sends the shield to the pack, a light the dagger; STATUS and GEAR's OFFHAND tab show it; a two-handed weapon empties it; the light in
      // the field asks for the shield to come off (free out of a fight); in a fight a weapon there is put away for a light (asked) and a shield refuses it, and a shield
      // on or off from the fight's EQUIP is the action
      var MNo = DS.MENU, sayO = DS.say, askO = DS.ask, chooseO = DS.choose, saidO = [], askedO = [];
      function keyO(b) { return { pressed: function (x) { return x === b; }, repeat: function (x) { return x === b; } }; }
      function openO() { DS.clearScenes(); var fm = new DS.FieldMenu(); DS.push(fm); return fm.m; }
      function driveO(gen, answer) { var v, st, k = 0; while (gen && k++ < 600) { st = gen.next(v); v = undefined; if (st.done) return st.value; if (st.value && (st.value.ask || st.value.chooseO)) v = answer(st.value.ask || st.value.chooseO); } return 'ran on'; }
      try {
        var ly = g.hero('lymen'), w0 = ly.equip.weapon; DS.EV.torchOut(true);
        ly.equip.weapon = 'longsword'; ly.equip.shield = 'shield'; ly.equip.offhand = null; g.give('dagger', 1); g.give('torch', 2);
        // 1. EQUIP: OFFHAND in SHIELD's place, the shield in it, no LIGHT row
        var m = openO(); m.root.cmds.i = m.root.cmds.items.map(function (x) { return x.value; }).indexOf('equip'); m.update(keyO('a')); m.root.pi = m.root.rows(false).indexOf(ly); m.update(keyO('a'));
        var ep = m.pages[0], labs = ep ? ep.list.items.map(function (x) { return x.label + '=' + x.right; }) : [];
        check('EQUIP\'s places: ' + labs.join(' | '), labs[2] === 'OFFHAND=Shield' && !labs.some(function (l) { return /^LIGHT=/.test(l); }) && !labs.some(function (l) { return /^SHIELD=/.test(l); }));
        // 2. its list: (remove), the shield? no -- worn; the dagger, the torch
        ep.list.i = 2; m.update(keyO('a')); var cp = m.pages[1], rows = cp ? cp.list.items.map(function (x) { return (x.kind || '-') + ':' + x.value; }) : [];
        check('OFFHAND\'s list: ' + rows.join(' '), rows.indexOf('-:__none') === 0 && rows.indexOf('weapon:dagger') > 0 && rows.indexOf('light:torch') > 0 && !rows.some(function (r) { return /^weapon:(greatsword|longbow|shortbow|greataxe|maul)/.test(r); }));
        // 3. the dagger: the shield to the pack; the longsword one-handed now (versatile)
        var shN0 = (g.inv.filter(function (s) { return s.id === 'shield'; })[0] || { n: 0 }).n;
        cp.list.i = rows.indexOf('weapon:dagger'); m.update(keyO('a'));
        var shN1 = (g.inv.filter(function (s) { return s.id === 'shield'; })[0] || { n: 0 }).n, twoV = DS.R.twoHanded(ly, DS.R.weaponOf(ly));
        check('the dagger in the off hand: equip ' + JSON.stringify({ shield: ly.equip.shield, offhand: ly.equip.offhand }) + ', the shield to the pack ' + shN0 + ' -> ' + shN1 + ', the longsword in one hand ' + !twoV + ', hands free ' + DS.R.freeHands(ly),
          !ly.equip.shield && ly.equip.offhand === 'dagger' && shN1 === shN0 + 1 && !twoV && DS.R.freeHands(ly) === 0);
        // 4. the torch from the OFFHAND: the dagger to the pack, the light in that hand
        m = openO(); m.root.cmds.i = m.root.cmds.items.map(function (x) { return x.value; }).indexOf('equip'); m.update(keyO('a')); m.root.pi = m.root.rows(false).indexOf(ly); m.update(keyO('a'));
        ep = m.pages[0]; ep.list.i = 2; m.update(keyO('a')); cp = m.pages[1]; cp.list.i = cp.list.items.map(function (x) { return x.kind === 'light' && x.value; }).indexOf('torch'); m.update(keyO('a'));
        for (var wO = 0; wO < 300 && m.busy; wO++) { var tqO = DS.top(); if (tqO && tqO.kind === 'dialog') { if (tqO.chars < tqO.pageLen()) tqO.chars = tqO.pageLen(); T.tapf('a'); } else T.step(1); }
        ep.refresh(); var ohRow = ep.list.items[2];
        check('the torch from the OFFHAND: lit in Lymen\'s hand (torchBy ' + g.flags.torchBy + '), the dagger to the pack (offhand ' + ly.equip.offhand + '), the row says ' + ohRow.right,
          g.flags.torchBy === 'lymen' && !ly.equip.offhand && /\(lit\)/.test(ohRow.right));
        // 5. STATUS's GEAR and GEAR's OFFHAND tab show the light
        var sp = new (function () { })(); var stP = null; m.pages.length = 0; m.root.cmds.i = m.root.cmds.items.map(function (x) { return x.value; }).indexOf('status'); m.update(keyO('a')); m.root.pi = m.root.rows(false).indexOf(ly); m.update(keyO('a')); stP = m.pages[0];
        var gl = []; if (stP) { stP.p = stP.pages.map(function (x) { return x.k; }).indexOf('gear'); gl = stP.lines().map(function (l) { return l.t; }); }
        m.pages.length = 0; m.root.cmds.i = m.root.cmds.items.map(function (x) { return x.value; }).indexOf('gear'); m.update(keyO('a')); var gp = m.pages[0], gr = [];
        if (gp) { gp.tab = 2; gp.refresh(); gr = gp.list.items.map(function (x) { return x.label + '=' + x.right; }); }
        check('STATUS: ' + (gl.filter(function (t) { return /^OFFHAND/.test(t); })[0] || 'no OFFHAND line') + '; GEAR\'s OFFHAND tab: ' + gr.join(' | '),
          gl.some(function (t) { return /^OFFHAND\s+Torch \(lit\)/.test(t); }) && gr.some(function (r) { return /^Torch=lit: Lymen/.test(r); }) && gr.some(function (r) { return /^Torch=x\d/.test(r); }) && gr.some(function (r) { return /^Shield=x\d/.test(r); }));
        // 6. a two-handed weapon empties it
        DS.EV.torchOut(true); ly.equip.shield = null; ly.equip.offhand = 'dagger'; g.take('dagger', 1); g.give('greatsword', 1);
        m = openO(); var dg0 = (g.inv.filter(function (s) { return s.id === 'dagger'; })[0] || { n: 0 }).n; MNo.swap(m, ly, 'weapon', 'greatsword');
        check('the greatsword in hand: the off hand empty (offhand ' + ly.equip.offhand + ', the dagger back in the pack ' + dg0 + ' -> ' + (g.inv.filter(function (s) { return s.id === 'dagger'; })[0] || { n: 0 }).n + ')', ly.equip.weapon === 'greatsword' && !ly.equip.offhand);
        MNo.swap(m, ly, 'weapon', 'longsword');
        // 7. the field's light with the shield on: asked to take it off, free out of a fight; then lit
        ly.equip.shield = 'shield'; g.take('shield', 1); DS.EV.torchOut(true);
        DS.say = function (t) { saidO.push([].concat(t).join(' ')); return { say: 1 }; }; DS.ask = function (t, ch) { askedO.push(ch.join('/')); return { ask: ch }; };
        var rF = driveO(DS.EV.useFieldItem('torch', ly), function (ch) { return 0; });
        check('the field\'s torch with the shield on: asked ' + askedO.join(' | ') + ', the shield off (' + ly.equip.shield + '), lit (torchBy ' + g.flags.torchBy + ')', askedO[0] === 'TAKE OFF THE SHIELD/NOT NOW' && !ly.equip.shield && g.flags.torchBy === 'lymen');
        DS.EV.torchOut(true); DS.say = sayO; DS.ask = askO;
        // 8. in a fight: the off hand's dagger put away for a light (asked); a shield refuses it; the fight's EQUIP: a shield is the action
        ly.equip.shield = null; ly.equip.offhand = 'dagger'; g.take('dagger', 1);
        T.startFight(['gnoll']); for (var wF = 0; wF < 400 && !DS.find('battle'); wF++) T.step(1);
        var bt = DS.find('battle'), uL = bt.heroes.filter(function (u) { return u.h.id === 'lymen'; })[0], picked = [];
        DS.choose = function (o) { picked.push(o.title + ': ' + o.items.map(function (i) { return i.label; }).join('/')); return { chooseO: o }; };
        var rows8 = bt.battleItems(uL).filter(function (r) { return r.value === 'torch'; })[0];
        g.take('torch', 1); var r8 = driveO(bt.useItem(uL, 'torch'), function (o) { return o.items[0].value; });
        check('the fight\'s torch with a dagger in the off hand: on the list ' + !(rows8 && rows8.disabled) + ', asked ' + picked.join(' | ') + ', the dagger to the pack (offhand ' + ly.equip.offhand + '), lit (torchBy ' + bt.torchBy + ')',
          rows8 && !rows8.disabled && /^PUT AWAY WEAPON\?: PUT AWAY THE DAGGER\/NOT NOW$/.test(picked[0] || '') && !ly.equip.offhand && bt.torchBy === 'lymen');
        delete ly.equip.torch; bt.torchBy = null; ly.equip.shield = 'shield'; g.take('shield', 1);
        var rows8s = bt.battleItems(uL).filter(function (r) { return r.value === 'torch'; })[0]; picked = []; saidO = [];
        var say8 = bt.say; bt.say = function* (t) { saidO.push(t); }; g.take('torch', 1); var r8s = driveO(bt.useItem(uL, 'torch'), function () { return 'no'; }); bt.say = say8;
        check('the fight\'s torch with the shield on: greyed ' + !!(rows8s && rows8s.disabled) + ', refused "' + saidO.join(' ') + '", nothing asked ' + !picked.length, rows8s && rows8s.disabled && /shield is on the off hand/.test(saidO.join(' ')) && !picked.length && r8s === false);
        var st8 = { actions: 1, bonus: 1 }, fm8 = new DS.FieldMenu({ battle: {}, hero: ly, acted: false, unit: uL, st: st8 });
        MNo.swap(fm8.m, ly, 'shield', null);
        check('the fight\'s EQUIP: the shield off is the action (actions ' + st8.actions + ', acted ' + !!st8.acted + ', the menu\'s acted ' + fm8.m.host.fight.acted + ')', !ly.equip.shield && st8.actions === 0 && st8.acted && fm8.m.host.fight.acted);
        ly.equip.weapon = w0;
      } catch (eO) { check('threw: ' + String(eO && eO.stack || eO).slice(0, 500), false); }
      DS.say = sayO; DS.ask = askO; DS.choose = chooseO;
    } else if (test === 'noeggs1021') {
      // the eggs off the first game's load screen (10-21, Griz: "pull the eggs off the 8 bit loads" -- the first game awards none of them; the six slots were
      // 10-15's, eggs1015): a save's row carries no eggs, the egg drawing is gone, CONTINUE FROM and SAVE WHERE? draw one line a save, the message box on
      // the screen; EV.EGGS stays the register (six)
      var loadE = DS.loadSlot;
      try {
        check('the egg drawing gone: DS.eggsFound ' + typeof DS.eggsFound + ', DS.eggRow ' + typeof DS.eggRow + '; EV.EGGS ' + ((DS.EV.EGGS || []).length) + ' kept',
          typeof DS.eggsFound === 'undefined' && typeof DS.eggRow === 'undefined' && (DS.EV.EGGS || []).length === 6);
        var mkE = function (fl) { var s = JSON.parse(JSON.stringify(DS.G)); s.flags = Object.assign({}, fl); s.time = 3600 * 60; return s; };
        var savesE = { 1: mkE({ eggJoke: 1, eggDunk: 1 }), 2: mkE({ eggJoke: 1, eggDarkness: 1 }), 3: mkE({}) };
        DS.loadSlot = function (n) { return savesE[n] ? JSON.parse(JSON.stringify(savesE[n])) : null; };
        [false, true].forEach(function (saving) {
          var scE = new DS.SlotScene(saving), cvE = document.createElement('canvas'); cvE.width = 256; cvE.height = 240; var cE = cvE.getContext('2d'), drewE = true;
          try { scE.msg = 'That save was made by a newer version of the game: reload the page.'; scE.draw(cE); } catch (eE) { drewE = String(eE && eE.stack || eE).slice(0, 300); }
          var mE = scE.menu, eggRows = mE.items.filter(function (it) { return it.eggs; }).length, boxE = mE.y + mE.h + 6 + 8 + 2 * 11;
          check((saving ? 'SAVE WHERE?' : 'CONTINUE FROM') + ' draws (' + drewE + '): ' + mE.items.length + ' rows, ' + eggRows + ' with eggs, the window ' + mE.y + '+' + mE.h + ', the two-line message box down to ' + boxE,
            drewE === true && eggRows === 0 && mE.items.length >= 3 && boxE <= 240);
          if (Q.get('shot') && !saving) out.shot = cvE.toDataURL('image/png'); // (shot=1: the load screen as a picture, for an eye)
        });
      } catch (eE2) { check('threw: ' + String(eE2 && eE2.stack || eE2).slice(0, 400), false); }
      DS.loadSlot = loadE;
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
