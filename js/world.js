/* DRAGONSLEEP — the field: maps, walking, NPCs, doors, chests, signs, triggers, encounters,
   and the game state (DS.G). */
'use strict';
(function () {
  var DS = window.DS, R = DS.R, I = DS.input, W8 = DS.W8;
  var T = 16;
  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  DS.DIRS = DIRS;

  // ------------------------------------------------------------------ game state
  DS.newGame = function (leadId) {
    var G = DS.G = {
      v: 1, lead: leadId, party: [R.makeHero(leadId)], inv: [], silver: DS.DATA.config.startSilver || 10,
      flags: {}, renown: 0, map: null, x: 0, y: 0, dir: 'down', steps: 0, time: 0, kills: {}, hired: [leadId]
    };
    (DS.DATA.config.startItems || []).forEach(function (s) { G.inv.push({ id: s[0], n: s[1] }); });
    return G;
  };
  function bindState(G) {
    G.give = function (id, n) { n = n || 1; var s = G.inv.filter(function (q) { return q.id === id; })[0]; if (s) s.n += n; else G.inv.push({ id: id, n: n }); };
    G.take = function (id, n) { n = n || 1; var s = G.inv.filter(function (q) { return q.id === id; })[0]; if (!s) return false; s.n -= n; if (s.n <= 0) G.inv.splice(G.inv.indexOf(s), 1); return true; };
    G.count = function (id) { var s = G.inv.filter(function (q) { return q.id === id; })[0]; return s ? s.n : 0; };
    G.has = function (id) { if (G.count(id) > 0) return true; return G.party.some(function (h) { return h.equip.weapon === id || h.equip.armor === id || h.equip.shield === id || h.equip.ring === id; }); };
    G.main = function () { return G.party.filter(function (h) { return h.id === G.lead; })[0] || G.party[0]; };
    G.hero = function (id) { return G.party.filter(function (h) { return h.id === id; })[0]; };
  }
  DS.bindState = bindState;
  // flag expressions: "flag:x & !flag:y & lead:barley & has:rope & lvl>=4 & renown>=2 & hired:aurdin & party>=2"
  DS.cond = function (expr) {
    if (!expr) return true;
    var G = DS.G;
    if (expr.indexOf('|') >= 0) return expr.split('|').some(function (e) { return DS.cond(e); });
    return expr.split('&').every(function (raw) {
      var t = raw.trim(), neg = false;
      if (t[0] === '!') { neg = true; t = t.slice(1); }
      var v;
      var m = /^(\w+)(>=|<=|=|>|<|:)(.*)$/.exec(t);
      if (!m) v = !!G.flags[t];
      else {
        var k = m[1], op = m[2], arg = m[3];
        var num = function (x) { if (op === '>=') return x >= +arg; if (op === '<=') return x <= +arg; if (op === '>') return x > +arg; if (op === '<') return x < +arg; return x === +arg; };
        if (k === 'flag') v = !!G.flags[arg];
        else if (k === 'lead') v = G.lead === arg;
        else if (k === 'hired') v = G.hired.indexOf(arg) >= 0;
        else if (k === 'has') v = G.has(arg);
        else if (k === 'lvl') v = num(G.main().lvl);
        else if (k === 'renown') v = num(G.renown);
        else if (k === 'party') v = num(G.party.length);
        else if (k === 'silver') v = num(G.silver);
        else if (k === 'kills') { var p = arg.split(/>=|>/); v = (G.kills[p[0]] || 0) >= +(p[1] || 1); }
        else v = num(G.flags[k] || 0);
      }
      return neg ? !v : v;
    });
  };

  // ------------------------------------------------------------------ maps
  var mapCache = {};
  DS.getMap = function (id) {
    if (mapCache[id]) return mapCache[id];
    var src = DS.DATA.maps[id];
    if (!src) throw new Error('no map ' + id);
    var m = { id: id, src: src, name: src.name, w: 0, h: src.rows.length, tiles: [], marks: {}, music: src.music, bg: src.bg, outside: !!src.outside };
    src.rows.forEach(function (r) { m.w = Math.max(m.w, r.length); });
    var legend = src.legend;
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
      var ch = src.rows[y][x] || ' ';
      var L = legend[ch];
      var tile = typeof L === 'string' ? L : L ? L.tile : 'void';
      if (!DS.TILES[tile]) { console.warn('bad tile', id, ch, tile); tile = 'void'; }
      m.tiles.push(tile);
      if (L && typeof L === 'object' && L.mark) { (m.marks[L.mark] = m.marks[L.mark] || []).push([x, y]); }
      if (/[A-Za-z0-9]/.test(ch) && !(L && typeof L === 'string')) (m.marks[ch] = m.marks[ch] || []).push([x, y]);
    }
    m.at = function (x, y) { if (x < 0 || y < 0 || x >= m.w || y >= m.h) return null; return m.tiles[y * m.w + x]; };
    m.mark = function (ch) { var a = m.marks[ch]; return a ? a[0] : null; };
    m.orig = m.tiles.slice();
    // change one tile at runtime (a gate swinging open, a cocoon cut down) and repaint just that cell
    m.setTile = function (x, y, tid) {
      var i = y * m.w + x;
      if (m.tiles[i] === tid || !DS.TILES[tid]) return;
      m.tiles[i] = tid;
      m.anim = m.anim.filter(function (a) { return a.x !== x || a.y !== y; });
      var ctx = m.layer.getContext('2d'), v = DS.hash(x + ',' + y) % 7, nb = neighbours(m, x, y, tid);
      ctx.clearRect(x * T, y * T, T, T);
      if (DS.TILES[tid].anim) m.anim.push({ x: x, y: y, id: tid, v: v, nb: nb });
      else ctx.drawImage(DS.tileCanvas(tid, v, 0, nb), x * T, y * T);
    };
    buildLayer(m);
    return (mapCache[id] = m);
  };
  // flag-driven tiles: the map as the save remembers it (open or shut, whichever the flags say)
  function applyFlagTiles(m) { // per cell, the last entry whose condition holds wins; none holding = the tile as drawn
    var want = {};
    (m.src.flagTiles || []).forEach(function (ft) {
      var k = ft.x + ',' + ft.y;
      if (!(k in want)) want[k] = { x: ft.x, y: ft.y, tile: m.orig[ft.y * m.w + ft.x] };
      if (DS.cond(ft.cond)) want[k].tile = ft.tile;
    });
    Object.keys(want).forEach(function (k) { var c = want[k]; m.setTile(c.x, c.y, c.tile); });
  }
  DS.applyFlagTiles = applyFlagTiles;
  function neighbours(m, x, y, id) {
    var t = DS.TILES[id];
    if (!t || !t.auto) return null;
    if (t.auto === 'roof') {
      var isR = function (xx, yy) { var q = m.at(xx, yy); return q && DS.TILES[q] && DS.TILES[q].auto === 'roof'; };
      return { up: isR(x, y - 1), down: isR(x, y + 1), left: isR(x - 1, y), right: isR(x + 1, y) };
    }
    if (t.auto === 'wall') {
      var below = m.at(x, y + 1), above = m.at(x, y - 1);
      var fl = function (q) { return q && DS.TILES[q] && (DS.TILES[q].pass || /pool|deep|drown/.test(q)) && !DS.TILES[q].auto; };
      return { downFloor: fl(below), upFloor: fl(above) };
    }
    return null;
  }
  function buildLayer(m) {
    var c = document.createElement('canvas');
    c.width = m.w * T; c.height = m.h * T;
    var ctx = c.getContext('2d');
    m.anim = [];
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
      var id = m.tiles[y * m.w + x], t = DS.TILES[id], v = DS.hash(x + ',' + y) % 7, nb = neighbours(m, x, y, id);
      if (t.anim) m.anim.push({ x: x, y: y, id: id, v: v, nb: nb });
      else ctx.drawImage(DS.tileCanvas(id, v, 0, nb), x * T, y * T);
    }
    m.layer = c;
  }

  // ------------------------------------------------------------------ NPCs
  function Npc(def, map) {
    this.def = def; this.id = def.id; this.x = def.x; this.y = def.y; this.hx = def.x; this.hy = def.y;
    this.dir = def.dir || 'down'; this.look = DS.LOOKS[def.look] || DS.LOOKS.worker; this.name = def.name;
    this.px = def.x * T; this.py = def.y * T; this.moving = false; this.path = []; this.wander = def.wander;
    this.wt = 60 + DS.rint(120); this.hidden = false; this.solid = def.solid !== false;
    this.art = def.art; // optional static canvas key (e.g. 'chest')
  }
  Npc.prototype.update = function (F) {
    if (this.moving) {
      var tx = this.x * T, ty = this.y * T, sp = this.speed || 1;
      this.px += Math.sign(tx - this.px) * Math.min(sp, Math.abs(tx - this.px));
      this.py += Math.sign(ty - this.py) * Math.min(sp, Math.abs(ty - this.py));
      if (this.px === tx && this.py === ty) this.moving = false;
      return;
    }
    if (this.pause > 0) { this.pause--; return; } // a 'waitN' step holds the rest of the path
    if (this.path.length) {
      var d = this.path.shift();
      if (d === 'hide') { this.hidden = true; return; }
      if (d === 'show') { this.hidden = false; return; }
      if (d.indexOf('face:') === 0) { this.dir = d.slice(5); return; }
      if (d.indexOf('wait') === 0) { this.pause = parseInt(d.slice(4), 10) || 20; return; }
      this.dir = d; this.x += DIRS[d][0]; this.y += DIRS[d][1]; this.moving = true; this.speed = this.pathSpeed || 1;
      return;
    }
    if (this.wander && !F.busy() && --this.wt <= 0) {
      this.wt = 60 + DS.rint(150);
      var dirs = ['up', 'down', 'left', 'right'], d2 = DS.pick(dirs), nx = this.x + DIRS[d2][0], ny = this.y + DIRS[d2][1];
      this.dir = d2;
      if (Math.abs(nx - this.hx) <= this.wander && Math.abs(ny - this.hy) <= this.wander && F.free(nx, ny, this)) {
        this.x = nx; this.y = ny; this.moving = true; this.speed = 1;
      }
    }
  };
  Npc.prototype.frames = function () { return DS.walker(this.look); };
  DS.Npc = Npc;

  // ------------------------------------------------------------------ the Field scene
  function Field() {
    this.kind = 'field'; this.opaque = true;
    this.map = null; this.npcs = []; this.px = 0; this.py = 0; this.moving = false; this.frame = 0;
    this.encounterIn = 20; this.lock = 0;
  }
  DS.Field = Field;
  Field.prototype.busy = function () { return DS.scriptActive() || this.lock > 0; };
  Field.prototype.load = function (mapId, x, y, dir) {
    var G = DS.G, m = DS.getMap(mapId);
    this.map = m; G.map = mapId; G.x = x; G.y = y; if (dir) G.dir = dir;
    if (this.chase) { G.flags.wagonOutcome = G.flags.wagonOutcome || 'fled'; G.flags.towerFled = 1; } // left the road mid-chase: they got away
    this.px = x * T; this.py = y * T; this.moving = false; this.tint = null; this.chase = null;
    var self = this;
    this.npcs = (m.src.npcs || []).filter(function (n) { return DS.cond(n.cond) && !(n.hire && G.hired.indexOf(n.hire) >= 0); }).map(function (d) { return new Npc(d, m); });
    this.chests = (m.src.chests || []);
    applyFlagTiles(m);
    this.resetEncounter();
    if (m.music) DS.audio.play(m.music);
    DS.EV && DS.EV.onEnter && DS.EV.onEnter(mapId, this);
  };
  Field.prototype.refreshNpcs = function () {
    var G = DS.G, m = this.map, keep = {};
    this.npcs.forEach(function (n) { keep[n.id] = n; });
    this.npcs = (m.src.npcs || []).filter(function (n) { return DS.cond(n.cond) && !(n.hire && G.hired.indexOf(n.hire) >= 0); }).map(function (d) { return keep[d.id] || new Npc(d, m); });
  };
  Field.prototype.resetEncounter = function () {
    var z = this.zoneAt(DS.G.x, DS.G.y), E = z && DS.DATA.encounters[z];
    var r = (E && E.rate) || [18, 40];
    this.encounterIn = r[0] + DS.rint(r[1] - r[0] + 1);
  };
  Field.prototype.zoneAt = function (x, y) {
    var src = this.map.src, tile = this.map.at(x, y);
    if (src.zones) for (var i = 0; i < src.zones.length; i++) {
      var z = src.zones[i], r = z.rect;
      if (x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3] && (!z.tiles || z.tiles.indexOf(tile) >= 0) && DS.cond(z.cond)) return z.zone;
    }
    if (src.tileZones && src.tileZones[tile] !== undefined) return src.tileZones[tile];
    return src.zone || null;
  };
  Field.prototype.npcAt = function (x, y) {
    for (var i = 0; i < this.npcs.length; i++) { var n = this.npcs[i]; if (!n.hidden && n.x === x && n.y === y) return n; }
    return null;
  };
  Field.prototype.chestAt = function (x, y) {
    for (var i = 0; i < this.chests.length; i++) { var c = this.chests[i]; if (c.x === x && c.y === y && DS.cond(c.cond)) return c; }
    return null;
  };
  Field.prototype.free = function (x, y, who) {
    var m = this.map, t = m.at(x, y);
    if (!t) return false;
    if (!DS.TILES[t].pass) return false;
    if (this.chestAt(x, y)) return false;
    var n = this.npcAt(x, y);
    if (n && n !== who && n.solid) return false;
    if (who && who !== 'player' && DS.G.x === x && DS.G.y === y) return false;
    if (who && who !== 'player') { // npcs don't walk onto doors/warps
      var w = this.warpAt(x, y); if (w) return false;
    }
    return true;
  };
  Field.prototype.warpAt = function (x, y) {
    var ws = this.map.src.warps || [];
    for (var i = 0; i < ws.length; i++) { var w = ws[i]; if (w.x === x && w.y === y && DS.cond(w.cond)) return w; }
    return null;
  };
  Field.prototype.triggerAt = function (x, y, kind) {
    var ts = this.map.src.triggers || [];
    for (var i = 0; i < ts.length; i++) {
      var t = ts[i], r = t.rect || [t.x, t.y, 1, 1];
      if (x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3] && (t.on || 'step') === kind && DS.cond(t.cond) && !(t.once && DS.G.flags['trig:' + t.id])) return t;
    }
    return null;
  };
  Field.prototype.signAt = function (x, y) {
    var ss = this.map.src.signs || [];
    for (var i = 0; i < ss.length; i++) if (ss[i].x === x && ss[i].y === y && DS.cond(ss[i].cond)) return ss[i];
    return null;
  };

  Field.prototype.update = function () {
    var G = DS.G, self = this;
    this.npcs.forEach(function (n) { n.update(self); });
    G.time++;
    if (this.lock > 0) this.lock--;
    if (this.pathWalk) return;
    if (this.moving) { this.step(); return; }
    if (DS.scriptActive()) return;
    if (this.pendingPath && this.pendingPath.length) return;
    // a level-up that asks the player something (Vivian's archetype) waits for the field
    if (G.party.some(function (h) { return h.pendingChoice; })) { DS.run(function* () { yield* DS.EV.pendingChoices(); }); return; }
    if (this.chase && this.chaseTick()) return;
    if (I.pressed('b') || I.pressed('menu')) { DS.audio.sfx('confirm'); DS.push(new DS.FieldMenu()); return; }
    if (I.pressed('a')) { this.interact(); return; }
    var d = I.dir();
    if (d) this.tryMove(d);
  };
  Field.prototype.tick = function () { var self = this; this.npcs.forEach(function (n) { if (n.path.length || n.moving || n.pause > 0) n.update(self); }); };
  Field.prototype.tryMove = function (d) {
    var G = DS.G, nx = G.x + DIRS[d][0], ny = G.y + DIRS[d][1];
    G.dir = d;
    var m = this.map;
    if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) { // walking off the map edge
      var edge = nx < 0 ? 'west' : nx >= m.w ? 'east' : ny < 0 ? 'north' : 'south';
      var ex = (m.src.exits && m.src.exits[edge]) || m.src.exit;
      if (ex && !this.chase) { this.runExit(ex); return; }
      return;
    }
    if (!this.free(nx, ny, 'player')) {
      // walking into something you can use (a gate, the mark, the stair, a sign, a chest) uses it, same as Z;
      // holding the direction afterwards doesn't fire it again until you step away or press toward it anew
      var key = m.id + ':' + nx + ',' + ny;
      var usable = this.triggerAt(nx, ny, 'use') || this.signAt(nx, ny) || this.chestAt(nx, ny);
      if (usable && !this.npcAt(nx, ny) && (I.pressed(d) || this.lastBump !== key)) {
        this.lastBump = key;
        this.interact();
        return;
      }
      if (!this.bumpT || DS.frame - this.bumpT > 18) { DS.audio.sfx('bump'); this.bumpT = DS.frame; }
      return;
    }
    this.lastBump = null;
    G.x = nx; G.y = ny; this.moving = true;
  };
  Field.prototype.step = function () {
    var G = DS.G, tx = G.x * T, ty = G.y * T, sp = 2;
    this.px += Math.sign(tx - this.px) * Math.min(sp, Math.abs(tx - this.px));
    this.py += Math.sign(ty - this.py) * Math.min(sp, Math.abs(ty - this.py));
    this.frame++;
    if (this.px === tx && this.py === ty) { this.moving = false; this.arrive(); }
  };
  Field.prototype.arrive = function () {
    var G = DS.G, self = this;
    G.steps++;
    if (this.pathWalk) return;
    var w = this.warpAt(G.x, G.y);
    if (w && !this.chase) { // no doors mid-chase: the riders are the only way off this map
      var to = (w.alt && w.alt[G.dir]) || w; // some warps land you by the side you came in from
      DS.audio.sfx(w.sfx || 'door');
      DS.run(function* () { yield* DS.EV.warp(w.to, to.tx, to.ty, to.dir || w.dir || G.dir, w); });
      return;
    }
    var t = this.triggerAt(G.x, G.y, 'step');
    if (t) { if (t.once) G.flags['trig:' + t.id] = 1; DS.run(function* () { yield* DS.EV.trigger(t, self); }); return; }
    // random encounters
    var z = this.zoneAt(G.x, G.y);
    if (z && DS.DATA.encounters[z] && !G.flags.noEncounters && !this.chase) {
      var tile = this.map.at(G.x, G.y), mult = (tile === 'road' || tile === 'bridge' || tile === 'dirtpath') ? 2 : 1;
      if (this.map.src.roadSafe === false) mult = 1;
      this.encounterIn -= 1 / mult;
      if (this.encounterIn <= 0) { this.resetEncounter(); DS.run(function* () { yield* DS.EV.encounter(z); }); }
    }
  };
  Field.prototype.facing = function () { var G = DS.G; return [G.x + DIRS[G.dir][0], G.y + DIRS[G.dir][1]]; };
  Field.prototype.interact = function () {
    var G = DS.G, f = this.facing(), self = this;
    var n = this.npcAt(f[0], f[1]);
    var tl = this.map.at(f[0], f[1]);
    if (!n && tl && DS.TILES[tl] && DS.TILES[tl].talk) { // talk across a counter
      n = this.npcAt(f[0] + DIRS[G.dir][0], f[1] + DIRS[G.dir][1]);
    }
    if (n) {
      if (n.def.face !== false) n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[G.dir];
      DS.run(function* () { yield* DS.EV.talk(n, self); });
      return;
    }
    var c = this.chestAt(f[0], f[1]);
    if (c) { DS.run(function* () { yield* DS.EV.chest(c, self); }); return; }
    var s = this.signAt(f[0], f[1]);
    if (s) { DS.run(function* () { yield* DS.EV.sign(s, self); }); return; }
    var t = this.triggerAt(f[0], f[1], 'use') || this.triggerAt(G.x, G.y, 'here');
    if (t) { if (t.once) G.flags['trig:' + t.id] = 1; DS.run(function* () { yield* DS.EV.trigger(t, self); }); }
  };
  Field.prototype.runExit = function (ex) {
    DS.audio.sfx('door');
    DS.run(function* () { yield* DS.EV.warp(ex.to, ex.tx, ex.ty, ex.dir || DS.G.dir, ex); });
  };
  // scripted player walking (cutscenes)
  Field.prototype.walk = function (path) {
    var self = this;
    return {
      start: function () { self.pathWalk = true; self.pendingPath = path.slice(); },
      update: function () {
        if (self.moving) { self.step(); return false; }
        if (!self.pendingPath.length) { self.pathWalk = false; return true; }
        var d = self.pendingPath.shift(); var G = DS.G;
        if (d.indexOf('face:') === 0) { G.dir = d.slice(5); return false; }
        G.dir = d; G.x += DIRS[d][0]; G.y += DIRS[d][1]; self.moving = true;
        return false;
      }
    };
  };

  // ------------------------------------------------------------------ drawing
  Field.prototype.camera = function () {
    var m = this.map, cx = this.px + 8 - 128, cy = this.py + 8 - 120;
    if (m.w * T <= 256) cx = (m.w * T - 256) / 2; else cx = DS.clamp(cx, 0, m.w * T - 256);
    if (m.h * T <= 240) cy = (m.h * T - 240) / 2; else cy = DS.clamp(cy, 0, m.h * T - 240);
    return [Math.round(cx), Math.round(cy)];
  };
  Field.prototype.draw = function (ctx) {
    var m = this.map, G = DS.G;
    if (!m) return;
    var cam = this.camera(), cx = cam[0], cy = cam[1];
    ctx.fillStyle = m.src.void || '#000'; ctx.fillRect(0, 0, 256, 240);
    ctx.drawImage(m.layer, -cx, -cy);
    var af = (DS.frame >> 4);
    var x0 = Math.floor(cx / T) - 1, y0 = Math.floor(cy / T) - 1, x1 = x0 + 18, y1 = y0 + 17;
    for (var i = 0; i < m.anim.length; i++) {
      var a = m.anim[i];
      if (a.x < x0 || a.x > x1 || a.y < y0 || a.y > y1) continue;
      ctx.drawImage(DS.tileCanvas(a.id, a.v, af, a.nb), a.x * T - cx, a.y * T - cy);
    }
    // chests
    for (var c = 0; c < this.chests.length; c++) {
      var ch = this.chests[c];
      if (!DS.cond(ch.cond)) continue;
      ctx.drawImage(DS.chestArt(!!G.flags['chest:' + m.id + ':' + ch.x + ',' + ch.y]), ch.x * T - cx, ch.y * T - cy);
    }
    // hanging signs over shop doors
    (m.src.triggers || []).forEach(function (t) {
      if (!t.icon) return;
      var sx = t.x * T - cx, sy = (t.y - 1) * T - cy;
      if (sx < -T || sy < -T || sx > 256 || sy > 240) return;
      ctx.drawImage(DS.doorSign(t.icon), sx + 2, sy + 3);
    });
    // sprites sorted by y
    var sprites = this.npcs.filter(function (n) { return !n.hidden; }).map(function (n) { return { y: n.py, n: n }; });
    sprites.push({ y: this.py, player: true });
    sprites.sort(function (a, b) { return a.y - b.y; });
    var self = this;
    sprites.forEach(function (s) {
      if (s.player) {
        var lead = G.party[0];
        var fr = DS.walker(DS.LOOKS[lead.look]);
        var step = (self.moving || self.pathWalk) ? ((self.px + self.py) >> 3) & 1 : 0;
        if (!self.hidePlayer) ctx.drawImage(fr[G.dir][step], self.px - cx, self.py - cy - 2);
      } else if (s.n.def.prop) { // a drawn prop (the wagon): anchored on its lead tile, facing its travel
        var pn = s.n, left = pn.dir === 'left', img = DS.propArt(pn.def.prop, pn.moving ? (DS.frame >> 3) : 0, left);
        ctx.drawImage(img, left ? pn.px - cx : pn.px + 16 - img.width - cx, pn.py + 16 - img.height - cy);
      } else {
        var n = s.n, frames = n.frames();
        var st = n.moving ? ((n.px + n.py) >> 3) & 1 : (n.def.idle ? (DS.frame >> 5) & 1 : 0);
        ctx.drawImage(frames[n.dir][st], n.px - cx, n.py - cy - 2);
        if (n.def.lantern) { ctx.fillStyle = (DS.frame >> 3) & 1 ? '#F8D878' : '#FCA044'; ctx.fillRect(n.px - cx + 13, n.py - cy + 6, 3, 4); }
      }
    });
    if (m.src.beam) this.drawBeam(ctx, cx, cy);
    if (m.src.dark) this.drawDark(ctx, cx, cy);
    var tint = this.tint || m.src.tint; // scripts can drop night over a map (the wagon night)
    if (tint) { ctx.globalAlpha = tint[1]; ctx.fillStyle = tint[0]; ctx.fillRect(0, 0, 256, 240); ctx.globalAlpha = 1; }
    if (!this.chase) this.drawPin(ctx, cx, cy);
    if (this.banner > 0) {
      this.banner--;
      var w = DS.textWidth(m.name) + 20;
      DS.win(ctx, 128 - w / 2, 8, w, 18);
      DS.textCenter(ctx, m.name, 128, 13, '#F8D878');
    }
  };
  // the dark: a sheet of shadow with holes cut in it, one round the party (a lamp's reach) and one for every light the map keeps
  var darkBuf = null;
  Field.prototype.drawDark = function (ctx, cx, cy) {
    if (!darkBuf) { darkBuf = document.createElement('canvas'); darkBuf.width = 256; darkBuf.height = 240; }
    var d = darkBuf.getContext('2d'), m = this.map, lights = [];
    lights.push({ x: this.px - cx + 8, y: this.py - cy + 8, r: this.lightR || m.src.lightR || 72 });
    (m.src.lights || []).concat(this.lights || []).forEach(function (l) {
      if (l.cond && !DS.cond(l.cond)) return;
      var lx = (l.x != null ? l.x : l[0]) * 16 + 8 - cx, ly = (l.y != null ? l.y : l[1]) * 16 + 8 - cy, lr = l.r || l[2] || 40;
      if (lx < -lr * 1.4 || ly < -lr * 1.4 || lx > 256 + lr * 1.4 || ly > 240 + lr * 1.4) return;
      lights.push({ x: lx, y: ly, r: lr * (0.96 + 0.04 * Math.sin(DS.frame / 7 + lx * 0.13)), warm: l.warm !== false, col: l.col });
    });
    d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, 256, 240);
    d.fillStyle = 'rgba(0,0,0,' + (m.src.darkness || 0.78) + ')'; d.fillRect(0, 0, 256, 240);
    d.globalCompositeOperation = 'destination-out';
    lights.forEach(function (l) {
      var g = d.createRadialGradient(l.x, l.y, l.r * 0.55, l.x, l.y, l.r * 1.35);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = g; d.fillRect(l.x - l.r * 1.4, l.y - l.r * 1.4, l.r * 2.8, l.r * 2.8);
    });
    ctx.drawImage(darkBuf, 0, 0);
    // a kept flame warms what it lights
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    lights.slice(1).forEach(function (l) {
      if (!l.warm) return;
      var g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, l.col || 'rgba(255,170,80,0.16)'); g.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = g; ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    });
    ctx.restore();
  };
  // noon down a shaft: a soft column of light over the floor, dust turning in it (Solskaft's Sunshaft)
  Field.prototype.drawBeam = function (ctx, cx, cy) {
    var b = this.map.src.beam, x0 = b.x0 * 16 - cx, x1 = (b.x1 + 1) * 16 - cx, y0 = b.y0 * 16 - cy, y1 = (b.y1 + 1) * 16 - cy;
    if (x1 < 0 || x0 > 256 || y1 < 0 || y0 > 240) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var w = x1 - x0, g = ctx.createLinearGradient(x0 - 10, 0, x1 + 10, 0);
    g.addColorStop(0, 'rgba(255,236,180,0)'); g.addColorStop(0.3, 'rgba(255,236,180,0.10)'); g.addColorStop(0.5, 'rgba(255,240,200,0.16)');
    g.addColorStop(0.7, 'rgba(255,236,180,0.10)'); g.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = g; ctx.fillRect(x0 - 10, Math.max(0, y0), w + 20, Math.min(240, y1) - Math.max(0, y0));
    var v = ctx.createLinearGradient(0, y0, 0, y1); // brighter toward the top, where the sky is
    v.addColorStop(0, 'rgba(255,250,230,0.14)'); v.addColorStop(1, 'rgba(255,250,230,0)');
    ctx.fillStyle = v; ctx.fillRect(x0, Math.max(0, y0), w, Math.min(240, y1) - Math.max(0, y0));
    for (var i = 0; i < 26; i++) { // the motes: each drifts down and sideways on its own slow sine
      var hh = y1 - y0, my = y0 + ((i * 97 + DS.frame * (0.25 + (i % 5) * 0.06)) % hh), mx = x0 + ((i * 53) % w) + Math.sin(DS.frame / 40 + i) * 5;
      if (my < -2 || my > 242) continue;
      ctx.fillStyle = i % 3 ? 'rgba(255,245,210,0.55)' : 'rgba(255,255,255,0.8)';
      ctx.fillRect(Math.round(mx), Math.round(my), 1, 1);
    }
    ctx.restore();
  };
  // ------------------------------------------------------------------ the pinned quest
  // Pick a quest in the JOURNAL and a marker bobs over whoever (or whatever) it wants next.
  // On another map, the marker sits on the way there: the door, stair or road edge that leads toward it.
  DS.pinnedQuest = function () {
    var id = DS.G && DS.G.flags.pin;
    var q = id && (DS.DATA.quests || []).filter(function (x) { return x.id === id; })[0];
    if (!q || !DS.cond(q.show) || DS.cond(q.done)) return null;
    return q;
  };
  DS.questStep = function (q) {
    var st = (q.steps || []).filter(function (s) { return DS.cond(s['if']); });
    return st[0] || null;
  };
  // every way off a map: warps, door-warps and walked-off edges
  function links(mid) {
    var src = DS.DATA.maps[mid], out = [];
    (src.warps || []).forEach(function (w) { out.push({ to: w.to, x: w.x, y: w.y, tx: w.tx, ty: w.ty }); });
    (src.triggers || []).forEach(function (t) { if (t.script === 'warp' && t.to) out.push({ to: t.to, x: t.x, y: t.y, tx: t.tx, ty: t.ty }); });
    var ex = src.exits || {};
    Object.keys(ex).forEach(function (e) { out.push({ to: ex[e].to, edge: e, tx: ex[e].tx, ty: ex[e].ty }); });
    return out;
  }
  function nextHop(from, to) {
    if (from === to) return to;
    var prev = {}, q = [from]; prev[from] = null;
    while (q.length) {
      var m = q.shift();
      if (m === to) break;
      links(m).forEach(function (l) { if (!(l.to in prev) && DS.DATA.maps[l.to]) { prev[l.to] = m; q.push(l.to); } });
    }
    if (!(to in prev)) return null;
    var cur = to;
    while (prev[cur] !== from && prev[cur] != null) cur = prev[cur];
    return cur;
  }
  // where the step's target stands on its own map (live NPC position when it's this map)
  function stepPoint(mid, step, F) {
    var src = DS.DATA.maps[mid];
    if (step.npc) {
      if (F && F.map.id === mid) {
        var n = F.npcs.filter(function (x) { return x.id === step.npc && !x.hidden; })[0];
        return n ? { px: n.px, py: n.py, npc: true } : null;
      }
      var d = (src.npcs || []).filter(function (x) { return x.id === step.npc; })[0];
      return d ? { x: d.x, y: d.y } : null;
    }
    if (step.door || step.trig) {
      var t = (src.triggers || []).filter(function (x) { return step.door ? x.arg === step.door : x.id === step.trig; })[0];
      if (!t) return null;
      var r = t.rect || [t.x, t.y, 1, 1];
      return { x: r[0] + Math.floor((r[2] - 1) / 2), y: r[1] + Math.floor((r[3] - 1) / 2) };
    }
    if (step.at) return { x: step.at[0], y: step.at[1] };
    return null;
  }
  function edgeTile(m, edge, px, py) { // the walkable edge tile nearest the player
    var best = null, bd = 1e9;
    for (var i = 0; i < (edge === 'north' || edge === 'south' ? m.w : m.h); i++) {
      var x = edge === 'west' ? 0 : edge === 'east' ? m.w - 1 : i, y = edge === 'north' ? 0 : edge === 'south' ? m.h - 1 : i;
      var t = m.at(x, y);
      if (!t || !DS.TILES[t].pass) continue;
      var d = Math.abs(x - px) + Math.abs(y - py);
      if (d < bd) { bd = d; best = { x: x, y: y }; }
    }
    return best;
  }
  Field.prototype.pinPoint = function () {
    var q = DS.pinnedQuest(), step = q && DS.questStep(q), G = DS.G, m = this.map;
    if (!step || !step.map || !DS.DATA.maps[step.map]) return null;
    if (step.map === m.id) return stepPoint(m.id, step, this);
    var hop = nextHop(m.id, step.map);
    if (!hop) return null;
    // aim for where the hop map's own onward link (or the target) sits, so the right gate gets the marker
    var goal;
    if (hop === step.map) goal = stepPoint(hop, step);
    else { var h2 = nextHop(hop, step.map), l2 = links(hop).filter(function (l) { return l.to === h2 && !l.edge; })[0]; goal = l2 ? { x: l2.x, y: l2.y } : null; }
    var best = null, bs = 1e9, self = this;
    links(m.id).filter(function (l) { return l.to === hop; }).forEach(function (l) {
      var pos = l.edge ? edgeTile(self.map, l.edge, G.x, G.y) : { x: l.x, y: l.y };
      if (!pos) return;
      var s = (goal ? Math.abs(l.tx - goal.x) + Math.abs(l.ty - goal.y) : 0) + 0.3 * (Math.abs(pos.x - G.x) + Math.abs(pos.y - G.y));
      if (s < bs) { bs = s; best = pos; }
    });
    return best;
  };
  Field.prototype.drawPin = function (ctx, cx, cy) {
    if (this.hidePlayer || DS.find('battle')) return;
    var p = this.pinPoint();
    if (!p) return;
    var x = (p.npc ? p.px : p.x * T) + 8 - cx, y = (p.npc ? p.py : p.y * T) - 8 - cy;
    var bob = Math.round(Math.sin(DS.frame / 8) * 2);
    if (x >= 6 && x <= 250 && y >= 4 && y <= 232) { ctx.drawImage(pinArrow('down'), x - 4, y - 10 + bob); return; }
    // off screen: an arrow on the screen edge pointing the way
    var d = x < 6 ? 'left' : x > 250 ? 'right' : y < 4 ? 'up' : 'down';
    var ax = DS.clamp(x - 4, 2, 245), ay = DS.clamp(y - 4, 2, 229);
    var pulse = ((DS.frame >> 3) & 1) ? 1 : 0;
    if (d === 'left') ax = 2 + pulse; if (d === 'right') ax = 245 - pulse; if (d === 'up') ay = 2 + pulse; if (d === 'down') ay = 229 - pulse;
    ctx.drawImage(pinArrow(d), ax, ay);
  };
  var arrowCache = {};
  function pinArrow(dir) { // a 9x9 outlined gold arrow
    if (arrowCache[dir]) return arrowCache[dir];
    var rows = ['...###...', '...#o#...', '...#o#...', '####o####', '#ooooooo#', '.#ooooo#.', '..#ooo#..', '...#o#...', '....#....'];
    var p = new DS.Pix(9, 9);
    for (var y = 0; y < 9; y++) for (var x = 0; x < 9; x++) {
      var ch = rows[y][x], px = x, py = y;
      if (dir === 'up') py = 8 - y;
      if (dir === 'right') { px = y; py = x; }
      if (dir === 'left') { px = 8 - y; py = x; }
      if (ch === '#') p.set(px, py, '#101018'); else if (ch === 'o') p.set(px, py, '#F8D878');
    }
    return (arrowCache[dir] = p.canvas());
  }

  // ------------------------------------------------------------------ the chase (the wagon night's last run)
  // chase = { real:[npc], fake:[npc], goal:{x,y}, caught: gen fn, escaped: gen fn }. The player walks freely;
  // touching a real rider ends it, touching one of Willem's false riders pops it, a rider at the goal escapes.
  Field.prototype.chaseTick = function () {
    var c = this.chase, G = DS.G, self = this;
    if (c.hold > 0) { // the riders hold at the start until the player touches a key, or the hold runs out (playtest 09-25)
      c.hold--;
      var pressed = ['up', 'down', 'left', 'right', 'a'].some(function (b) { return I.down(b); });
      if (pressed || c.hold <= 0) {
        var cut = c.hold; c.hold = 0;
        c.real.concat(c.fake).forEach(function (n) {
          if (n.pause > 0) n.pause = Math.max(0, n.pause - cut);
          else if (n.path[0] && n.path[0].indexOf('wait') === 0) { var left = (parseInt(n.path[0].slice(4), 10) || 0) - cut; if (left > 0) n.path[0] = 'wait' + left; else n.path.shift(); }
        });
      }
    }
    function near(n) { return !n.hidden && Math.abs(n.x - G.x) + Math.abs(n.y - G.y) <= 1; }
    var fake = c.fake.filter(near)[0];
    if (fake) { fake.hidden = true; DS.audio.sfx('miss'); DS.run(function* () { yield DS.say(DS.L('wagon.fakeRider'), { top: true }); }); return true; }
    if (c.real.some(near)) { this.chase = null; DS.run(c.caught); return true; }
    if (c.real.some(function (n) { return n.x === c.goal.x && n.y === c.goal.y && !n.moving; })) { this.chase = null; DS.run(c.escaped); return true; }
    return false;
  };
  // shortest walkable path on a map, as a list of steps (for scripted riders)
  DS.pathTo = function (m, sx, sy, tx, ty) {
    var prev = {}, q = [[sx, sy]], k0 = sx + ',' + sy; prev[k0] = null;
    while (q.length) {
      var p = q.shift();
      if (p[0] === tx && p[1] === ty) break;
      ['up', 'down', 'left', 'right'].forEach(function (d) {
        var nx = p[0] + DIRS[d][0], ny = p[1] + DIRS[d][1], k = nx + ',' + ny, t = m.at(nx, ny);
        if (k in prev || !t || !DS.TILES[t].pass) return;
        prev[k] = [p[0], p[1], d]; q.push([nx, ny]);
      });
    }
    var out = [], cur = tx + ',' + ty;
    if (!(cur in prev)) return out;
    while (prev[cur]) { out.unshift(prev[cur][2]); cur = prev[cur][0] + ',' + prev[cur][1]; }
    return out;
  };

  // ------------------------------------------------------------------ props: the wagon, glamoured or not
  var propCache = {};
  DS.propArt = function (kind, f, flip) {
    var key = kind + ':' + (f & 1) + ':' + (flip ? 1 : 0);
    if (propCache[key]) return propCache[key];
    var p = new DS.Pix(56, 28), ink = '#101018', wood = '#6a4a2a', woodL = '#8a6a3a', kids = kind === 'wagonKids';
    // the wagon bed and its cage
    p.rect(2, 12, 30, 9, wood); p.rect(2, 12, 30, 1, woodL); p.rect(2, 16, 30, 1, '#4a3018');
    // who's in the back: goblins, or what they really are
    [[6, 8], [11, 7], [16, 8], [21, 7], [26, 8]].forEach(function (h, i) {
      if (kids) { p.ellipse(h[0], h[1], 2.2, 2.4, ['#f0c8a0', '#d8a880', '#e8b890', '#c89070', '#f0d0b0'][i]); p.rect(h[0] - 2, h[1] - 3, 5, 2, ['#6a4a2a', '#c09050', '#2a1a0a', '#8a5a30', '#d8b060'][i]); }
      else { p.ellipse(h[0], h[1], 2.2, 2.2, '#7aa04a'); p.set(h[0] - 3, h[1] - 1, '#7aa04a'); p.set(h[0] + 3, h[1] - 1, '#7aa04a'); p.set(h[0] + 1, h[1], '#f83800'); }
    });
    p.rect(2, 3, 30, 1, '#4a4a52');
    for (var x = 2; x <= 32; x += 5) p.rect(x, 3, 1, 9, '#7a7a82');
    // wheels
    [[8, 22], [26, 22]].forEach(function (w) { p.ellipse(w[0], w[1], 4, 4, ink); p.ellipse(w[0], w[1], 2.5, 2.5, '#5a4020'); p.set(w[0], w[1], ink); });
    // the bench, the traces, two horses
    p.rect(31, 9, 5, 3, woodL); p.line(34, 14, 42, 14, ink);
    var leg = f & 1;
    [[46, 15, '#7a4a2a'], [44, 12, '#5a3418']].forEach(function (hs) {
      p.ellipse(hs[0], hs[1], 7, 3.5, hs[2]);
      p.rect(hs[0] + 5, hs[1] - 6, 3, 6, hs[2]); p.rect(hs[0] + 6, hs[1] - 7, 5, 3, hs[2]);
      p.rect(hs[0] - 5, hs[1] + 2, 2, 5 - leg, hs[2]); p.rect(hs[0] + 3, hs[1] + 2, 2, 4 + leg, hs[2]);
      p.rect(hs[0] + 4, hs[1] - 7, 1, 1, ink);
    });
    p.outline(ink);
    if (flip) p = p.flipH();
    return (propCache[key] = p.canvas());
  };

  // ------------------------------------------------------------------ shop signs (hung over a door)
  var signCache = {};
  var SIGNS = { // 8x8 glyphs: '#' dark ink, 'o' metal/gold, 'w' white, 'r' red, 'g' green, 'b' blue
    ring: ['........', '..oooo..', '.o....o.', 'o......o', 'o......o', '.o....o.', '..oooo..', '........'],
    scales: ['...##...', 'oooooooo', 'o..##..o', 'o..##..o', 'ooo##ooo', '...##...', '...##...', '.######.'],
    coin: ['..oooo..', '.o#oo#o.', 'o#oooo#o', 'o#oooo#o', 'o#oooo#o', 'o#oooo#o', '.o#oo#o.', '..oooo..'],
    potion: ['...##...', '...ww...', '...ww...', '..rrrr..', '.rrrrrr.', '.rrwrrr.', '.rrrrrr.', '..rrrr..'],
    bed: ['........', '#.......', '#ww.....', '#wwbbbbb', '#bbbbbbb', '########', '#......#', '........'],
    star: ['...o....', '...o....', 'ooooooo.', '.ooooo..', '..ooo...', '.oo.oo..', '.o...o..', '........'],
    pack: ['..####..', '.#oooo#.', '#oooooo#', '#o####o#', '#oooooo#', '#oooooo#', '#oooooo#', '.######.'],
    candle: ['...o....', '..ooo...', '...o....', '..www...', '..www...', '..www...', '..www...', '.#####..'],
    sword: ['......w.', '.....w..', '....w...', '...w....', '#.w.....', '.#......', 'o.#.....', '........'],
    stitch: ['...rr...', '...rr...', '.rrrrrr.', '.rrrrrr.', '...rr...', '...rr...', '...rr...', '........'],
    sun: ['o..o..o.', '.o.o.o..', '..ooo...', 'oooooooo', '..ooo...', '.o.o.o..', 'o..o..o.', '........'],
    mortar: ['.....#..', '....#...', '...#....', 'ogggggo.', '.ooooo..', '.ooooo..', '..ooo...', '.#####..'],
    jar: ['..####..', '..#ww#..', '.#gggg#.', '#gg#ggg#', '#ggg#gg#', '#gggggg#', '.######.', '........']
  };
  var SIGNCOL = { '#': '#101018', o: '#F8D878', w: '#F8F8F8', r: '#E43838', g: '#58D854', b: '#6888FC' };
  DS.doorSign = function (kind) {
    if (signCache[kind]) return signCache[kind];
    var p = new DS.Pix(12, 11), rows = SIGNS[kind] || SIGNS.coin;
    p.rect(3, 0, 1, 1, '#503000'); p.rect(8, 0, 1, 1, '#503000');
    p.rect(0, 1, 12, 10, '#503000'); p.rect(1, 2, 10, 8, '#AC7C00'); p.rect(1, 2, 10, 1, '#E0A850');
    // scale the 8x8 glyph into the 8x8 face (1:1), centred
    for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) { var ch = rows[y][x]; if (SIGNCOL[ch]) p.set(2 + x, 2 + y, SIGNCOL[ch]); }
    return (signCache[kind] = p.canvas());
  };

  var chestCache = {};
  DS.chestArt = function (open) {
    if (chestCache[open]) return chestCache[open];
    var p = new DS.Pix(16, 16);
    p.rect(2, 5, 12, 10, '#7a4a1a'); p.rect(2, 5, 12, 3, open ? '#2a1a0a' : '#aa6a2a'); p.frame(2, 5, 12, 10, '#2a1a0a');
    p.rect(7, 8, 2, 3, open ? '#5a3a1a' : '#f8d040'); p.rect(2, 10, 12, 1, '#5a3a1a');
    if (open) { p.rect(2, 2, 12, 3, '#aa6a2a'); p.frame(2, 2, 12, 3, '#2a1a0a'); }
    return (chestCache[open] = p.canvas());
  };
})();
