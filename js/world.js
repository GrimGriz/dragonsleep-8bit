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
  function applyFlagTiles(m) {
    (m.src.flagTiles || []).forEach(function (ft) {
      m.setTile(ft.x, ft.y, DS.cond(ft.cond) ? ft.tile : m.orig[ft.y * m.w + ft.x]);
    });
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
    if (this.path.length) {
      var d = this.path.shift();
      if (d === 'hide') { this.hidden = true; return; }
      if (d === 'show') { this.hidden = false; return; }
      if (d.indexOf('face:') === 0) { this.dir = d.slice(5); return; }
      if (d.indexOf('wait') === 0) { this.pause = parseInt(d.slice(4), 10) || 20; return; }
      this.dir = d; this.x += DIRS[d][0]; this.y += DIRS[d][1]; this.moving = true; this.speed = this.pathSpeed || 1;
      return;
    }
    if (this.pause > 0) { this.pause--; return; }
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
    this.px = x * T; this.py = y * T; this.moving = false;
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
    if (I.pressed('b') || I.pressed('menu')) { DS.audio.sfx('confirm'); DS.push(new DS.FieldMenu()); return; }
    if (I.pressed('a')) { this.interact(); return; }
    var d = I.dir();
    if (d) this.tryMove(d);
  };
  Field.prototype.tick = function () { var self = this; this.npcs.forEach(function (n) { if (n.path.length || n.moving) n.update(self); }); };
  Field.prototype.tryMove = function (d) {
    var G = DS.G, nx = G.x + DIRS[d][0], ny = G.y + DIRS[d][1];
    G.dir = d;
    var m = this.map;
    if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) { // walking off the map edge
      var edge = nx < 0 ? 'west' : nx >= m.w ? 'east' : ny < 0 ? 'north' : 'south';
      var ex = (m.src.exits && m.src.exits[edge]) || m.src.exit;
      if (ex) { this.runExit(ex); return; }
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
    if (w) {
      var to = (w.alt && w.alt[G.dir]) || w; // some warps land you by the side you came in from
      DS.audio.sfx(w.sfx || 'door');
      DS.run(function* () { yield* DS.EV.warp(w.to, to.tx, to.ty, to.dir || w.dir || G.dir, w); });
      return;
    }
    var t = this.triggerAt(G.x, G.y, 'step');
    if (t) { if (t.once) G.flags['trig:' + t.id] = 1; DS.run(function* () { yield* DS.EV.trigger(t, self); }); return; }
    // random encounters
    var z = this.zoneAt(G.x, G.y);
    if (z && DS.DATA.encounters[z] && !G.flags.noEncounters) {
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
      } else {
        var n = s.n, frames = n.frames();
        var st = n.moving ? ((n.px + n.py) >> 3) & 1 : (n.def.idle ? (DS.frame >> 5) & 1 : 0);
        ctx.drawImage(frames[n.dir][st], n.px - cx, n.py - cy - 2);
        if (n.def.lantern) { ctx.fillStyle = (DS.frame >> 3) & 1 ? '#F8D878' : '#FCA044'; ctx.fillRect(n.px - cx + 13, n.py - cy + 6, 3, 4); }
      }
    });
    if (m.src.dark) this.drawDark(ctx, cx, cy);
    if (m.src.tint) { ctx.globalAlpha = m.src.tint[1]; ctx.fillStyle = m.src.tint[0]; ctx.fillRect(0, 0, 256, 240); ctx.globalAlpha = 1; }
    this.drawPin(ctx, cx, cy);
    if (this.banner > 0) {
      this.banner--;
      var w = DS.textWidth(m.name) + 20;
      DS.win(ctx, 128 - w / 2, 8, w, 18);
      DS.textCenter(ctx, m.name, 128, 13, '#F8D878');
    }
  };
  Field.prototype.drawDark = function (ctx, cx, cy) {
    var px = this.px - cx + 8, py = this.py - cy + 8, r = 72;
    var g = ctx.createRadialGradient(px, py, r * 0.55, px, py, r * 1.35);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.78)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 240);
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
    mortar: ['.....#..', '....#...', '...#....', 'ogggggo.', '.ooooo..', '.ooooo..', '..ooo...', '.#####..']
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
