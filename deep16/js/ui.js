/* DEEP16 — the fight's face and hands.
   Three menu styles over one set of commands, switched in the X/Esc menu (Griz, 09-27: "curious about trying different
   menu ideas"): BAR (buttons in the bottom bar, the grid cursor at rest), WINDOW (a Chrono Trigger-style command window
   with a pointing hand; the menu at rest, as there), RING (a Secret of Mana-style ring of icons round the hero).
   The bottom bar always has the portrait, HP and the four pips -- MOVE, ACTION, BONUS, REACTION.
   The overlay under the sprites: reach (blue), dash reach (paler), targets, templates, the aura ring, a flanking line;
   the cursor red where the current thing can't go; with HELP on, a rogue's hiding places tinted.
   Keys: arrows/WASD cursor (or the menu), E/Z confirm, X/Esc back (at rest: the menu), SPACE end turn, 1-9 commands,
   M/Tab the menu, C recentre, H help. Mouse: hover, click, right-click inspect, middle-drag or the screen edge to look. */
'use strict';
(function () {
  var D = window.D16, I = D.input, G = D.grid, RU = D.rules, FX = D.fx;
  var UI = D.ui = {};
  var R = function (r, i) { return D.PAL.ramps[r][i]; };
  var BAR_Y = 226, DEFER = null;

  // ------------------------------------------------------------------ options (a per-viewer convenience; the page works without storage)
  UI.opts = { help: false, style: 'bar' };
  try { var o0 = JSON.parse(window.localStorage.getItem('deep16.opts') || 'null'); if (o0) { UI.opts.help = !!o0.help; if (/^(bar|window|ring)$/.test(o0.style)) UI.opts.style = o0.style; } } catch (e) { }
  UI.saveOpts = function () { try { window.localStorage.setItem('deep16.opts', JSON.stringify(UI.opts)); } catch (e) { } };
  var qs = /[?&]menu=(bar|window|ring)/.exec(location.search); if (qs) UI.opts.style = qs[1];
  function rest() { return UI.opts.style === 'bar' ? 'move' : 'menu'; }

  // ------------------------------------------------------------------ requests
  UI.onRequest = function (B, req) {
    if (req.turn) {
      var T = req.turn.turn;
      B.tool = T.attacksLeft ? 'attack' : rest(); B.cache = null; B.list = null; B.picks = []; B.spell = null;
      if (B.cmdSel == null || B.cmdFor !== req.turn) { B.cmdSel = 0; B.cmdFor = req.turn; B.ringA = null; }
    }
    if (req.prompt) B.sel = 0;
    if (req.entry) B.entryT = B.t;
  };
  function reachCache(B, u) {
    var T = u.turn, key = u.x + ',' + u.y + ',' + T.move + ',' + T.action + ',' + T.attacksLeft + ',' + B.units.map(function (w) { return w.x + ':' + w.y + ':' + (w.dead ? 0 : 1) + (w.ethereal ? 'e' : ''); }).join(';') + (B.webs || []).length;
    if (B.cache && B.cache.key === key) return B.cache;
    var dash = T.action > 0 && !T.attacksLeft ? u.speed : 0;
    B.cache = { key: key, move: G.reach(u, T.move), dash: dash ? G.reach(u, T.move + dash) : null, hide: null };
    return B.cache;
  }
  // a rogue's places to try hiding: squares she can reach where no foe she knows of sees her plainly (no cover)
  function hideSpots(B, u) {
    var rc = reachCache(B, u);
    if (rc.hide) return rc.hide;
    var foes = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && RU.canAct(w); });
    rc.hide = {};
    [rc.move, rc.dash || {}].forEach(function (m) {
      Object.keys(m).forEach(function (k) {
        var e = m[k]; if (!e.stand || rc.hide[k] != null) return;
        rc.hide[k] = foes.every(function (f) { var l = G.los(u, f, e.x, e.y); return !l.clear || l.cover > 0; });
      });
    });
    return rc.hide;
  }

  // ------------------------------------------------------------------ the commands a style shows (window and ring add MOVE and END TURN)
  UI.cmds = function (B, u) {
    var c = B.commands(u);
    if (UI.opts.style === 'bar') return c;
    return [{ id: 'move', label: 'MOVE', cost: 'M', ok: u.turn.move > 0 && !u.conds.restrained, tool: 'move', icon: 'move' }].concat(c).concat([{ id: 'end', label: 'END TURN', cost: 'F', ok: true, icon: 'end' }]);
  };

  // ------------------------------------------------------------------ the camera: look where you like (the edge, a middle-drag), C comes back
  UI.camera = function (B) {
    var m = I.mouse, cam = D.iso.cam, map = D.iso.map, bk = map.bake;
    if (m.inside && !m.drag && !B.menu && !(B.req && (B.req.prompt || B.req.entry))) {
      if (m.x < 6) cam.x -= 4; if (m.x > D.W - 7) cam.x += 4;
      if (m.y < 5) cam.y -= 3; if (m.y > D.H - 4) cam.y += 3;
    }
    if (m.panX || m.panY) { cam.x -= m.panX || 0; cam.y -= m.panY || 0; m.panX = m.panY = 0; }
    if (I.pressed('center')) { var a = B.active || (B.req && B.req.turn); if (a) B.focus(a); }
    cam.x = D.clamp(cam.x, bk.x + D.W / 2 - 60, bk.x + bk.canvas.width - D.W / 2 + 60);
    cam.y = D.clamp(cam.y, bk.y + D.H / 2 - 20, bk.y + bk.canvas.height - D.H / 2 + 60);
  };

  // ------------------------------------------------------------------ input
  UI.input = function (B, req) {
    if (I.pressed('help')) { UI.opts.help = !UI.opts.help; UI.saveOpts(); B.card(['{y}HELP ' + (UI.opts.help ? 'ON' : 'OFF') + '{/}' + (UI.opts.help ? ': hints on the grid (a rogue sees where she could hide)' : '')], 150); }
    if (req.entry) {
      if (B.canSwap && (I.pressed('n2') || I.pressed('left') || I.pressed('right'))) { D.pop(); D.push(new D.Battle({ fixture: !B.o.fixture })); return; }
      if (I.pressed('a') || I.pressed('end') || I.mouse.click || (!B.canSwap && B.t - B.entryT > 240)) B.answer();
      return;
    }
    UI.camera(B);
    if (req.prompt) return promptInput(B, req.prompt);
    if (req.turn) return turnInput(B, req.turn);
  };
  function promptInput(B, p) {
    var n = p.opts.length;
    if (I.repeat('left') || I.repeat('up')) B.sel = (B.sel + n - 1) % n;
    if (I.repeat('right') || I.repeat('down')) B.sel = (B.sel + 1) % n;
    for (var k = 1; k <= n; k++) if (I.pressed('n' + k)) return B.answer(p.opts[k - 1].value);
    if (I.pressed('a')) return B.answer(p.opts[B.sel].value);
    if (I.pressed('b')) return B.answer(p.opts[n - 1].value);
    if (I.mouse.click && B.promptRects) for (var i = 0; i < B.promptRects.length; i++) if (hit(B.promptRects[i])) return B.answer(p.opts[i].value);
  }
  function hit(r) { var m = I.mouse; return r && m.x >= r.x && m.y >= r.y && m.x < r.x + r.w && m.y < r.y + r.h; }
  function moveCursor(B, dx, dy) {
    var m = G.map;
    B.cursor.x = D.clamp(B.cursor.x + dx, 0, m.w - 1); B.cursor.y = D.clamp(B.cursor.y + dy, 0, m.h - 1);
    var c = D.iso.center(B.cursor.x, B.cursor.y, m.gz(B.cursor.x, B.cursor.y)), s = D.iso.toScreen(c.x, c.y);
    if (s.x < 60 || s.x > D.W - 60 || s.y < 50 || s.y > BAR_Y - 30) D.iso.lookAt(B.cursor.x, B.cursor.y, m.gz(B.cursor.x, B.cursor.y));
  }
  function overUI(B) { // is the mouse over a menu, a list or the bar (so the grid doesn't take the click)?
    if (I.mouse.y >= BAR_Y) return true;
    return (B.uiRects || []).some(hit);
  }
  function turnInput(B, u) {
    var st = UI.opts.style, any = I.pressed('a') || I.pressed('b') || I.pressed('end') || I.mouse.click;
    if (B.inspect && (any || I.mouse.rclick)) { B.inspect = null; return; }
    if (I.pressed('end')) return UI.command(B, u, { do: 'end' });
    // the mouse: over the menus, or on the grid
    B.hoverBtn = -1;
    if (I.mouse.inside && !overUI(B) && I.mouse.moved) { var s = D.iso.pick(I.mouse.x, I.mouse.y); if (s) { B.cursor.x = s.x; B.cursor.y = s.y; } }
    if (I.mouse.inside) (B.buttons || []).forEach(function (b, i) { if (hit(b)) B.hoverBtn = i; });
    if (B.hoverBtn >= 0 && I.mouse.moved) { var hb = B.buttons[B.hoverBtn]; if (hb.list != null && B.list) B.list.sel = hb.list; else if (hb.idx != null && B.tool === 'menu') B.cmdSel = hb.idx; }
    if (I.mouse.click && B.hoverBtn >= 0) { var bt = B.buttons[B.hoverBtn]; return bt.end ? UI.command(B, u, { do: 'end' }) : bt.list != null ? pickListItem(B, u, B.list.items[bt.list], bt.list) : pickCommand(B, u, bt.cmd, bt.idx); }
    if (I.mouse.rclick && !overUI(B)) { var w0 = G.occupant(B.cursor.x, B.cursor.y) || etherealAt(B, B.cursor.x, B.cursor.y); if (w0) B.inspect = w0; return; }
    // an open list (spells, items) takes the keys first
    if (B.list) return listInput(B, u);
    var cmds = UI.cmds(B, u);
    for (var k = 1; k <= 9; k++) if (I.pressed('n' + k) && cmds[k - 1]) return pickCommand(B, u, cmds[k - 1], k - 1);
    // the command menu at rest (window, ring)
    if (B.tool === 'menu') {
      var n = cmds.length, prev = B.cmdSel;
      if (st === 'window') { if (I.repeat('up')) B.cmdSel = (B.cmdSel + n - 1) % n; if (I.repeat('down')) B.cmdSel = (B.cmdSel + 1) % n; }
      else { if (I.repeat('left') || I.repeat('up')) B.cmdSel = (B.cmdSel + n - 1) % n; if (I.repeat('right') || I.repeat('down')) B.cmdSel = (B.cmdSel + 1) % n; }
      if (B.cmdSel !== prev) B.clearCards();
      if (I.pressed('a')) return pickCommand(B, u, cmds[B.cmdSel], B.cmdSel);
      if (I.pressed('b')) return UI.openMenu(B);
      if (I.mouse.click && !overUI(B)) actAt(B, u, B.cursor.x, B.cursor.y);
      return;
    }
    // the grid
    if (I.repeat('up')) moveCursor(B, -1, -1);
    if (I.repeat('down')) moveCursor(B, 1, 1);
    if (I.repeat('left')) moveCursor(B, -1, 1);
    if (I.repeat('right')) moveCursor(B, 1, -1);
    if (I.pressed('b')) {
      if (B.picks && B.picks.length) { B.picks.pop(); return; }
      if (B.tool !== rest()) { B.tool = rest(); B.spell = null; B.clearCards(); return; }
      return UI.openMenu(B);
    }
    if (I.pressed('a') || (I.mouse.click && !overUI(B))) actAt(B, u, B.cursor.x, B.cursor.y);
  }
  function etherealAt(B, x, y) { return B.units.filter(function (w) { return w.ethereal && x >= w.x && y >= w.y && x < w.x + w.size && y < w.y + w.size; })[0]; }
  function pickCommand(B, u, c, idx) {
    if (idx != null) B.cmdSel = idx;
    if (!c) return;
    if (!c.ok) { B.card(['{g}' + c.label + ': not now.{/}'], 90); return; }
    if (c.id === 'end') return UI.command(B, u, { do: 'end' });
    if (c.sub) {
      var items = c.sub === 'spells' ? D.magic.list(B, u).map(function (e) { e.kind = 'spell'; return e; }) : B.itemList(u).map(function (e) { e.kind = 'item'; return e; });
      var first = 0; items.some(function (e, i) { if (e.ok) { first = i; return true; } return false; });
      B.list = { kind: c.sub, items: items, sel: first }; B.ringB = null;
      return;
    }
    if (c.tool) { B.tool = c.tool; B.clearCards(); if (c.tool === 'help') B.card(['{g}HELP: pick a foe beside you; the next ally to swing at it has advantage.{/}'], 200); return; }
    UI.command(B, u, { do: c.id });
  }
  function listInput(B, u) {
    var L = B.list, n = L.items.length, st = UI.opts.style, e = L.items[L.sel];
    var nextKey = st === 'ring' ? ['left', 'right'] : ['up', 'down'], slotKey = st === 'ring' ? ['up', 'down'] : ['left', 'right'];
    if (n && I.repeat(nextKey[0])) L.sel = (L.sel + n - 1) % n;
    if (n && I.repeat(nextKey[1])) L.sel = (L.sel + 1) % n;
    if (e && e.kind === 'spell' && e.levels.length > 1) {
      var i = e.levels.indexOf(e.slot);
      if (I.repeat(slotKey[0])) e.slot = e.levels[Math.max(0, i - 1)];
      if (I.repeat(slotKey[1])) e.slot = e.levels[Math.min(e.levels.length - 1, i + 1)];
    }
    for (var k = 1; k <= 9; k++) if (I.pressed('n' + k) && L.items[k - 1]) return pickListItem(B, u, L.items[k - 1], k - 1);
    if (I.pressed('a')) return pickListItem(B, u, e, L.sel);
    if (I.pressed('b')) { B.list = null; return; }
  }
  function pickListItem(B, u, e, i) {
    if (!e) return;
    B.list.sel = i;
    if (!e.ok) { B.card(['{g}' + e.name + ': ' + (e.why || 'not now') + '.{/}'], 150); return; }
    B.list = null;
    if (e.kind === 'item') { B.tool = 'item'; B.itemId = e.id; B.card(['{g}' + e.name + ': ' + (e.use.effect === 'damage' ? 'throw it at a foe within 20 ft.' : e.use.effect === 'revive' ? 'a fallen ally beside you.' : 'yourself, or an ally beside you.') + '{/}'], 240); return; }
    var g = e.g, n = (g.n || 1) + Math.max(0, e.slot - e.level);
    B.spell = { id: e.id, slot: e.slot, g: g, sp: e.sp, n: n, name: e.name };
    B.picks = [];
    if (g.shape === 'self') return UI.command(B, u, { do: 'cast', id: e.id, slot: e.slot, target: u });
    B.tool = 'spell';
    var how = { attack: 'a foe in sight within ' + g.range + ' ft', rays: n + ' rays: click a foe for each (the same foe again is fine)', darts: n + ' darts: click a foe for each (the same foe again is fine)', splash: 'a foe within ' + g.range + ' ft (one beside it is caught too)', single: (g.side === 'foe' ? 'a foe' : 'an ally') + ' within ' + g.range + ' ft', touch: 'yourself, or an ally beside you', allies: 'up to ' + n + ' allies within ' + g.range + ' ft (click them; E on empty ground to cast with fewer)', sphere: 'a point within ' + g.range + ' ft (the ' + g.r + '-ft sphere shows)', cube: 'a point within ' + g.range + ' ft', cone: 'aim the ' + g.len + '-ft cone', line: 'aim the ' + g.len + '-ft line', teleport: 'a square you can see within 30 ft' }[g.shape] || '';
    B.clearCards(); B.card(['{y}' + e.name.toUpperCase() + (e.level ? ' (L' + e.slot + ')' : '') + '{/}: ' + how + '.  {g}X back{/}'], 100000);
  }
  UI.command = function (B, u, cmd) {
    B.clearCards();
    B.tool = cmd.do === 'attack' && u.turn.attacksLeft > 1 ? 'attack' : cmd.do === 'attack' && !u.turn.attacksLeft && u.turn.action && u.attacks > 1 ? 'attack' : rest();
    B.spell = null; B.picks = []; B.list = null;
    B.answer(cmd);
  };

  // is (x, y) somewhere the current tool can act? 'ok' | 'no' | 'self' | 'far' (a dash away)
  UI.valid = function (B, u, x, y) {
    var tool = B.tool, w = G.occupant(x, y), foe = w && G.hostile(u, w) && !w.dead && w.hp > 0 ? w : null, T = u.turn, s = G.map.at(x, y);
    if (!s || !s.open) return 'no';
    if (tool === 'move' || tool === 'menu' || tool === 'attack') {
      if (x === u.x && y === u.y) return 'self';
      if (foe) return G.dist(u, foe) <= u.reach && (T.attacksLeft || T.action) ? 'ok' : 'no';
      if (tool === 'attack') return 'no';
      var rc = reachCache(B, u), k = x + ',' + y;
      if (rc.move[k] && rc.move[k].stand) return 'ok';
      if (rc.dash && rc.dash[k] && rc.dash[k].stand) return 'far';
      return 'no';
    }
    if (tool === 'help') return foe && G.dist(u, foe) <= 5 ? 'ok' : 'no';
    if (tool === 'lay') return w && w.side === u.side && !w.dead && (w === u || G.dist(u, w) <= 5) ? 'ok' : 'no';
    if (tool === 'item') return B.itemTargetOK(u, B.itemId, w) ? 'ok' : 'no';
    if (tool === 'spell') {
      var g = B.spell.g, M = D.magic;
      if (g.shape === 'sphere' || g.shape === 'cube') return M.inRange(u, g, x, y) ? 'ok' : 'no';
      if (g.shape === 'cone' || g.shape === 'line') return M.area(u, g, x, y).length ? 'ok' : 'no';
      if (g.shape === 'teleport') return B.mistyTargets(u).some(function (q) { return q[0] === x && q[1] === y; }) ? 'ok' : 'no';
      if (g.shape === 'allies' && B.picks.length && !(w && M.targetOK(B, u, g, w))) return 'self';
      return w && M.targetOK(B, u, g, w) ? 'ok' : 'no';
    }
    return 'no';
  };
  function actAt(B, u, x, y) {
    var T = u.turn, tool = B.tool, w = G.occupant(x, y), foe = w && G.hostile(u, w) && !w.dead && w.hp > 0 ? w : null, v = UI.valid(B, u, x, y);
    if (tool === 'move' || tool === 'menu' || tool === 'attack') {
      if (x === u.x && y === u.y) { if (UI.opts.style !== 'bar') B.tool = 'menu'; return; }
      if (foe && v === 'ok') return UI.command(B, u, { do: 'attack', target: foe });
      if (foe) return B.card(['{o}The ' + B.shortName(foe) + ' is out of reach (' + G.dist(u, foe) + ' ft).{/}'], 120);
      if (tool === 'attack') return;
      if (v === 'ok') return UI.command(B, u, { do: 'move', x: x, y: y });
      if (v === 'far') return B.card(['{g}That far needs a DASH first (' + reachCache(B, u).dash[x + ',' + y].cost + ' ft).{/}'], 120);
      return;
    }
    if (tool === 'help') { if (v === 'ok') return UI.command(B, u, { do: 'help', target: foe }); return B.card(['{o}Help: pick a foe beside you.{/}'], 120); }
    if (tool === 'lay') { if (v === 'ok') return UI.command(B, u, { do: 'lay', target: w }); return B.card(['{o}Lay on Hands is touch: yourself or an ally beside you.{/}'], 120); }
    if (tool === 'item') { if (v === 'ok') return UI.command(B, u, { do: 'item', id: B.itemId, target: w }); return B.card(['{o}Not a target for that.{/}'], 120); }
    if (tool === 'spell') {
      var S = B.spell, g = S.g, cast = function (t) { UI.command(B, u, { do: 'cast', id: S.id, slot: S.slot, target: t }); };
      if (g.shape === 'rays' || g.shape === 'darts') {
        if (v !== 'ok') return;
        B.picks.push(w);
        if (B.picks.length >= S.n) return cast({ units: B.picks.slice() });
        return B.card(['{y}' + S.name + '{/}: ' + B.picks.length + ' of ' + S.n + ' aimed.  {g}X takes the last back{/}'], 100000);
      }
      if (g.shape === 'allies') {
        if (v === 'ok') { var i = B.picks.indexOf(w); if (i >= 0) B.picks.splice(i, 1); else B.picks.push(w); }
        else if (v === 'self' && B.picks.length) return cast({ units: B.picks.slice() });
        if (B.picks.length >= S.n) return cast({ units: B.picks.slice() });
        return B.card(['{y}' + S.name + '{/}: ' + B.picks.map(function (p) { return p.name; }).join(', ') + ' (' + B.picks.length + ' of ' + S.n + ').  {g}E on empty ground to cast with these{/}'], 100000);
      }
      if (v !== 'ok') return;
      if (g.shape === 'sphere' || g.shape === 'cube' || g.shape === 'cone' || g.shape === 'line' || g.shape === 'teleport') return cast({ x: x, y: y });
      return cast(w);
    }
  }

  // ------------------------------------------------------------------ the X/Esc menu (and M, Tab): the party, help, the menu's style, and out
  UI.openMenu = function (B) { B.menu = { sel: 0, panel: null }; };
  function menuItems() {
    return ['RESUME', 'PARTY', 'HELP: ' + (UI.opts.help ? 'ON' : 'OFF'), 'MENU: ' + UI.opts.style.toUpperCase() + '  < >', 'RESTART THE FIGHT', 'THE GATE (the sprites)', 'RETURN TO SILVERTON'];
  }
  UI.menuInput = function (B) {
    var M = B.menu, items = menuItems(), n = items.length;
    if (M.panel) { if (I.pressed('a') || I.pressed('b') || I.pressed('menu') || I.mouse.click) M.panel = null; return; }
    if (I.repeat('up')) M.sel = (M.sel + n - 1) % n;
    if (I.repeat('down')) M.sel = (M.sel + 1) % n;
    var styles = ['bar', 'window', 'ring'], si = styles.indexOf(UI.opts.style);
    if (M.sel === 3 && (I.repeat('left') || I.repeat('right'))) { UI.opts.style = styles[(si + (I.repeat('left') ? 2 : 1)) % 3]; UI.saveOpts(); restyle(B); return; }
    var pick = I.pressed('a') ? M.sel : -1;
    if (I.mouse.click && B.menuRects) B.menuRects.forEach(function (r, i) { if (hit(r)) pick = i; });
    if (I.pressed('b') || I.pressed('menu')) { B.menu = null; return; }
    if (pick < 0) return;
    M.sel = pick;
    if (pick === 0) B.menu = null;
    if (pick === 1) M.panel = 'party';
    if (pick === 2) { UI.opts.help = !UI.opts.help; UI.saveOpts(); }
    if (pick === 3) { UI.opts.style = styles[(si + 1) % 3]; UI.saveOpts(); restyle(B); }
    if (pick === 4) { D.pop(); D.push(new D.Battle({ fixture: B.o.fixture })); }
    if (pick === 5) location.search = '?gate';
    if (pick === 6) location.href = '../';   // back to the 8-bit game: nothing is written
  };
  function restyle(B) { if (B.req && B.req.turn && (B.tool === 'move' || B.tool === 'menu')) B.tool = rest(); }
  UI.resultInput = function (B) {
    UI.camera(B);
    if (I.pressed('a') || (I.mouse.click && !overUI(B))) { D.pop(); D.push(new D.Battle({ fixture: B.o.fixture })); }
  };

  // ------------------------------------------------------------------ drawing
  UI.drawBattle = function (ctx, B) {
    var req = B.req, hero = req && req.turn, objs = [];
    B.uiRects = []; B.buttons = [];
    B.units.forEach(function (u) { var o = unitObj(B, u); if (o) objs.push(o); });
    FX.list.forEach(function (f) { objs.push({ depth: 1e6, gz: 0, draw: function (c) { f.draw(c); } }); });
    DEFER = objs;
    D.iso.draw(ctx, objs, function (c) { overlay(c, B, hero); });
    DEFER = null;
    strip(ctx, B);
    cards(ctx, B);
    tooltip(ctx, B, hero);
    bar(ctx, B, hero);
    if (hero && UI.opts.style === 'window') cmdWindow(ctx, B, hero);
    if (hero && UI.opts.style === 'ring') cmdRing(ctx, B, hero);
    if (hero && B.list && UI.opts.style === 'bar') listPopup(ctx, B, hero, 266, BAR_Y - 4, 212);
    if (B.inspect) inspect(ctx, B.inspect);
    if (req && req.prompt) prompt(ctx, B, req.prompt);
    if (req && req.entry) entry(ctx, B);
    if (B.menu) menu(ctx, B);
  };

  function unitPos(B, u) {
    var s = u.size || 1, gx = u.x, gy = u.y, gz = G.gzAt(u, u.x, u.y);
    if (u.tween) { var k = u.tween.t / u.tween.dur; gx = u.tween.fx + (u.x - u.tween.fx) * k; gy = u.tween.fy + (u.y - u.tween.fy) * k; gz = u.tween.fz + (gz - u.tween.fz) * k; }
    var c = D.iso.center(gx + (s - 1) / 2, gy + (s - 1) / 2, gz), p = D.iso.toScreen(c.x, c.y);
    return { x: p.x, y: p.y, depth: gx + gy + (s - 1) + 0.6, gz: gz };
  }
  UI.unitPos = unitPos;
  function unitObj(B, u) {
    var p = unitPos(B, u), has = function (a) { return !!D.spr.anim(u.sheet, a); };
    if (u.dead && !has('hurt') && B.t - u.deadT > 50) return null;
    return {
      depth: p.depth, gz: p.gz, layer: 1, draw: function (ctx) {
        var o = { color: u.side === 'foe' ? R('violet', 3) : R('silver', 4) }, anim = u.anim, t = B.t - (u.animT || 0);
        var down = u.dead || u.hp <= 0;
        if (down) {
          if (has('hurt')) { anim = 'hurt'; o.once = true; }
          else if (u.dead) { anim = 'idle'; o.alpha = Math.max(0, 1 - (B.t - u.deadT) / 50); o.tint = R('violet', 4); o.tintAlpha = 0.5; }
          else { anim = 'idle'; o.lie = true; }
        } else if (anim === 'attack') { o.once = true; if (t > D.spr.duration(u.sheet, 'attack') + 6) anim = 'idle'; }
        if (anim === 'idle' || anim === 'walk') t = u.conds.paralyzed || u.conds.asleep ? 0 : B.t + (u.id ? u.id.length * 7 : 0);
        if (u.ethereal) { o.alpha = 0.16 + 0.06 * Math.sin(B.t / 9); o.tint = R('violet', 5); o.tintAlpha = 0.9; }
        if ((u.conds.hidden || u.conds.invisible) && !down) o.alpha = 0.5;
        if (u.flash > 0) { o.tint = R('bone', 2); o.tintAlpha = 0.85; }
        else if (u.conds.faerie && !down && !u.ethereal) { o.tint = R('violet', 5); o.tintAlpha = 0.25 + 0.15 * Math.sin(B.t / 7); }
        else if (u.conds.paralyzed) { o.tint = R('violet', 4); o.tintAlpha = 0.35; }
        else if (u.conds.restrained) { o.tint = R('bone', 1); o.tintAlpha = 0.3; }
        if (!u.ethereal && !(u.dead && !has('hurt'))) {
          var s = u.size || 1;
          ctx.fillStyle = 'rgba(10,8,16,.38)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 10 * s + 1, 4 * s + 1, 0, 0, 7); ctx.fill();
        }
        D.spr.draw(ctx, u.sheet, anim === 'hurt' && !has('hurt') ? 'idle' : anim, u.facing || 0, t, p.x, p.y, o);
        if (!u.dead && !u.ethereal) {
          var top = D.spr.top(u.sheet), w = u.size > 1 ? 30 : 20, bx = p.x - w / 2, by = p.y - top - 5;
          ctx.fillStyle = R('outline', 0); ctx.fillRect(bx - 1, by - 1, w + 2, 4);
          ctx.fillStyle = R('stone', 1); ctx.fillRect(bx, by, w, 2);
          ctx.fillStyle = u.side === 'foe' ? R('red', 3) : u.hp <= u.maxhp / 4 ? R('fire', 1) : R('moss', 2);
          ctx.fillRect(bx, by, Math.max(0, Math.round(w * u.hp / u.maxhp)), 2);
          if (u.temp > 0) { ctx.fillStyle = R('glow', 2); ctx.fillRect(bx, by - 2, Math.min(w, u.temp * 2), 1); }
          if (u.conds.asleep && (B.t >> 5) & 1) D.text(ctx, 'z', p.x + 8, by - 10, R('bone', 2));
        }
      }
    };
  }

  // the overlay: squares on the ledge are drawn after the ledge's tiles (deferred into the sort), the rest at once
  function onSq(x, y, fn) {
    var z = G.map.gz(x, y);
    if (z > 0 && DEFER) DEFER.push({ depth: x + y + 0.05, gz: z, layer: 0, draw: fn });
    else fn(D.ctx);
  }
  function fillSq(ctx, x, y, color, alpha, inset) { onSq(x, y, function (c) { D.iso.rhombus(c, x, y, G.map.gz(x, y), inset || 1); c.globalAlpha = alpha; c.fillStyle = color; c.fill(); c.globalAlpha = 1; }); }
  function lineSq(ctx, x, y, color, alpha, inset) { onSq(x, y, function (c) { D.iso.rhombus(c, x, y, G.map.gz(x, y), inset == null ? 2 : inset); c.globalAlpha = alpha == null ? 1 : alpha; c.strokeStyle = color; c.lineWidth = 1; c.stroke(); c.globalAlpha = 1; }); }
  function dotSq(x, y, color) { onSq(x, y, function (c) { var p = D.iso.center(x, y, G.map.gz(x, y)), s = D.iso.toScreen(p.x, p.y); c.fillStyle = color; c.fillRect(s.x - 1, s.y - 1, 2, 2); }); }
  function overlay(ctx, B, u) {
    // the aura of protection: a gold ring 10 ft round a standing paladin
    B.units.forEach(function (p) {
      if (p.cls !== 'paladin' || p.lvl < 6 || !G.standing(p) || !RU.canAct(p)) return;
      var inA = function (x, y) { return Math.max(Math.abs(x - p.x), Math.abs(y - p.y)) <= 2; };
      for (var y = p.y - 2; y <= p.y + 2; y++) for (var x = p.x - 2; x <= p.x + 2; x++) {
        var s = G.map.at(x, y); if (!s || !s.open) continue;
        (function (x, y, s) {
          onSq(x, y, function (c) {
            var cc = D.iso.center(x, y, s.gz), q = D.iso.toScreen(cc.x, cc.y);
            c.strokeStyle = R('gold', 3); c.globalAlpha = 0.75; c.lineWidth = 1; c.beginPath();
            if (!inA(x, y - 1)) { c.moveTo(q.x - 32, q.y); c.lineTo(q.x, q.y - 16); }
            if (!inA(x + 1, y)) { c.moveTo(q.x, q.y - 16); c.lineTo(q.x + 32, q.y); }
            if (!inA(x, y + 1)) { c.moveTo(q.x + 32, q.y); c.lineTo(q.x, q.y + 16); }
            if (!inA(x - 1, y)) { c.moveTo(q.x, q.y + 16); c.lineTo(q.x - 32, q.y); }
            c.stroke(); c.globalAlpha = 1;
          });
        })(x, y, s);
      }
    });
    // a web on the floor
    (B.webs || []).forEach(function (wb) { wb.sq.forEach(function (q) { fillSq(ctx, q[0], q[1], R('bone', 1), 0.22, 3); }); });
    if (B.active && !B.active.ethereal) G.foot(B.active).forEach(function (q) { lineSq(ctx, q[0], q[1], R('gold', 4), 0.9, 3); });
    if (!u) return;
    var T = u.turn, tool = B.tool, cx = B.cursor.x, cy = B.cursor.y;
    if (tool === 'move' || tool === 'menu' || tool === 'attack') {
      var rc = reachCache(B, u);
      if (rc.dash) Object.keys(rc.dash).forEach(function (k) { var e = rc.dash[k]; if (e.stand && !rc.move[k]) fillSq(ctx, e.x, e.y, R('glow', 1), 0.07); });
      Object.keys(rc.move).forEach(function (k) { var e = rc.move[k]; if (e.stand && e.cost > 0) fillSq(ctx, e.x, e.y, R('glow', 1), 0.17); });
      // HELP: the places a rogue knows she could try to hide (no foe she knows of sees her there plainly)
      if (UI.opts.help && u.cls === 'rogue') { var hs = hideSpots(B, u); Object.keys(hs).forEach(function (k) { if (!hs[k]) return; var q = k.split(','); fillSq(ctx, +q[0], +q[1], R('violet', 3), 0.42, 5); }); }
      if (T.attacksLeft || T.action) B.units.forEach(function (w) {
        if (!G.hostile(u, w) || !G.standing(w) || G.dist(u, w) > u.reach) return;
        G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], R('red', 4), 0.9); });
      });
      var e2 = rc.move[cx + ',' + cy] || (rc.dash && rc.dash[cx + ',' + cy]);
      if (e2 && e2.stand && !G.occupant(cx, cy, u)) (G.path(rc.dash && rc.dash[cx + ',' + cy] && !rc.move[cx + ',' + cy] ? rc.dash : rc.move, cx, cy) || []).forEach(function (q) { dotSq(q[0], q[1], R('bone', 2)); });
      var f = G.occupant(cx, cy);
      if (f && G.hostile(u, f) && G.dist(u, f) <= 5) {
        var ally = G.flank(u, f);
        if (ally) {
          var a0 = UI.unitPos(B, u), a1 = UI.unitPos(B, ally);
          ctx.strokeStyle = R('gold', 4); ctx.globalAlpha = 0.7; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(a0.x, a0.y - 2); ctx.lineTo(a1.x, a1.y - 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        }
      }
    }
    if (tool === 'help') B.units.forEach(function (w) { if (G.hostile(u, w) && G.standing(w) && G.dist(u, w) <= 5) G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], R('bone', 2), 0.9); }); });
    if (tool === 'lay') B.units.forEach(function (w) { if (w.side === u.side && !w.dead && (w === u || G.dist(u, w) <= 5)) G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], R('gold', 4), 0.9); }); });
    if (tool === 'item') B.units.forEach(function (w) { if (B.itemTargetOK(u, B.itemId, w)) G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], G.hostile(u, w) ? R('red', 4) : R('moss', 2), 0.9); }); });
    if (tool === 'spell') {
      var S = B.spell, g = S.g, M = D.magic, harm = S.sp.kind === 'save' || S.sp.kind === 'attack' || S.sp.kind === 'auto';
      if (g.shape === 'sphere' || g.shape === 'cube' || g.shape === 'cone' || g.shape === 'line') {
        var col = S.id === 'web' ? R('bone', 1) : S.id === 'sleep' ? R('violet', 4) : S.sp.el === 'cold' || S.sp.el === 'lightning' ? R('glow', 1) : R('fire', 1);
        M.area(u, g, cx, cy).forEach(function (q) { fillSq(ctx, q[0], q[1], col, 0.38); });
      } else if (g.shape === 'teleport') B.mistyTargets(u).forEach(function (q) { lineSq(ctx, q[0], q[1], R('glow', 2), 0.6, 4); });
      else B.units.forEach(function (w) {
        if (!M.targetOK(B, u, g, w)) return;
        var picked = B.picks.filter(function (p) { return p === w; }).length;
        G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], G.hostile(u, w) ? R('red', 4) : R('gold', 4), picked ? 1 : 0.7, picked ? 1 : 2); });
        if (picked) { var pp = UI.unitPos(B, w); DEFER.push({ depth: 1e6, gz: 0, draw: function (c) { D.text(c, picked > 1 ? 'x' + picked : 'v', pp.x + 10, pp.y - 8, harm ? R('fire', 2) : R('gold', 4)); } }); }
      });
    }
    // the cursor: red where the current thing can't go
    var s0 = G.map.at(cx, cy);
    if (s0 && s0.open) { var v = UI.valid(B, u, cx, cy); lineSq(ctx, cx, cy, v === 'no' ? R('red', 4) : v === 'far' ? R('gold', 2) : v === 'self' ? R('gold', 4) : R('bone', 2), 1, 1); }
  }

  // ------------------------------------------------------------------ the initiative strip, the cards, the tooltip
  function strip(ctx, B) {
    if (!B.order.length) return;
    var x = 4;
    x += D.text(ctx, 'R' + B.round, x, 3, R('gold', 3)) + 6;
    B.order.forEach(function (u) {
      var name = B.shortName(u) + (u.ethereal ? '~' : ''), w = D.textWidth(name) + 6;
      var col = u.dead || u.hp <= 0 ? R('accent', 2) : u.side === 'foe' ? R('red', 4) : R('glow', 2);
      if (u === B.active) { ctx.fillStyle = R('gold', 1); ctx.fillRect(x - 1, 1, w, 11); ctx.strokeStyle = R('gold', 3); ctx.strokeRect(x - 0.5, 1.5, w - 1, 10); }
      D.text(ctx, name, x + 2, 3, u === B.active ? R('gold', 4) : col);
      if (u.dead) { ctx.fillStyle = R('accent', 2); ctx.fillRect(x + 1, 7, w - 4, 1); }
      x += w + 2;
    });
    if (UI.opts.help) D.text(ctx, 'HELP', D.W - 4, 3, R('violet', 5), 'right');
  }
  function cards(ctx, B) {
    var y = 15;
    B.cards.forEach(function (c, i) {
      var lines = c.lines.filter(function (l) { return l; }), w = 0;
      lines.forEach(function (l) { w = Math.max(w, D.textWidth(l)); });
      w = Math.min(D.W - 8, w + 10);
      var x = Math.round((D.W - w) / 2), h = lines.length * 9 + 5;
      var age = B.t - c.t0, fade = c.life - age < 30 ? (c.life - age) / 30 : 1;
      ctx.globalAlpha = (i === B.cards.length - 1 ? 1 : 0.6) * fade;
      ctx.fillStyle = 'rgba(10,8,16,.86)'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = R('silver', 3); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      lines.forEach(function (l, k) { D.text(ctx, l, x + 5, y + 3 + k * 9, R('bone', 1)); });
      ctx.globalAlpha = 1;
      y += h + 2;
    });
  }
  function tooltip(ctx, B, u) {
    if (B.inspect || B.list || (B.req && (B.req.prompt || B.req.entry))) return;
    var w = G.occupant(B.cursor.x, B.cursor.y), lines = [];
    if (w && w !== B.active) {
      lines.push((w.side === 'foe' ? '{r}' : '{c}') + w.name + '{/}  HP ' + w.hp + '/' + w.maxhp + '  AC ' + RU.ac(w) + conds(w));
      if (u && G.hostile(u, w) && !w.dead) {
        var d = G.dist(u, w), l = G.los(u, w), sp = B.tool === 'spell' && (B.spell.g.shape === 'attack' || B.spell.g.shape === 'rays');
        var e = RU.edges(u, w, sp ? { spell: true, ranged: true, range: [B.spell.g.range, B.spell.g.range] } : u.weapon);
        var bits = [d + ' ft' + (d <= u.reach ? ' {n}in reach{/}' : '')];
        if (!l.clear) bits.push('{o}no line{/}');
        else if (l.cover && d > 5) bits.push('{c}half cover (+2): ' + l.why + '{/}');
        if (e.adv.length) bits.push('{n}adv: ' + e.adv.join(', ') + '{/}');
        if (e.dis.length) bits.push('{o}dis: ' + e.dis.join(', ') + '{/}');
        lines.push(bits.join('  '));
      }
    } else if (u && UI.opts.help && u.cls === 'rogue' && (B.tool === 'move' || B.tool === 'menu')) {
      var hs = hideSpots(B, u), k = B.cursor.x + ',' + B.cursor.y;
      if (hs[k] === true) lines.push('{p}a place to try hiding{/}: no foe she knows of sees it plainly');
      else if (hs[k] === false) lines.push('{g}in plain sight of a foe here{/}');
    }
    if (!lines.length) return;
    var ww = 0; lines.forEach(function (l) { ww = Math.max(ww, D.textWidth(l)); });
    var x = D.W - ww - 12, y = BAR_Y - lines.length * 9 - 8;
    if (UI.opts.style === 'window' && B.req && B.req.turn) x = 6;
    ctx.fillStyle = 'rgba(10,8,16,.82)'; ctx.fillRect(x, y, ww + 8, lines.length * 9 + 4);
    lines.forEach(function (l, i) { D.text(ctx, l, x + 4, y + 2 + i * 9, R('bone', 1)); });
  }
  function conds(w) {
    var c = [];
    if (w.ethereal) c.push('{p}ethereal{/}');
    if (w.conds.poisoned) c.push('{n}poisoned{/}');
    if (w.conds.faerie) c.push('{p}faerie fire{/}');
    if (w.conds.hidden) c.push('{c}hidden{/}');
    if (w.conds.invisible) c.push('{c}invisible{/}');
    if (w.conds.dodge) c.push('{c}dodging{/}');
    if (w.conds.shield) c.push('{c}shield{/}');
    if (w.conds.shieldOfFaith) c.push('{c}faith +2{/}');
    if (w.conds.blessed) c.push('{y}blessed{/}');
    if (w.conds.stoneskin) c.push('{c}stoneskin{/}');
    if (w.conds.heroism) c.push('{y}heroism{/}');
    if (w.conds.divineFavor) c.push('{y}favor{/}');
    if (w.conds.helped) c.push('{w}helped{/}');
    if (w.conds.restrained) c.push('{w}webbed{/}');
    if (w.conds.paralyzed) c.push('{p}held{/}');
    if (w.conds.asleep) c.push('{p}asleep{/}');
    if (w.conc) c.push('{y}conc: ' + w.conc.name + '{/}');
    if (w.hp <= 0 && !w.dead) c.push('{r}down{/}');
    return c.length ? '  ' + c.join(' ') : '';
  }

  // ------------------------------------------------------------------ the bottom bar: portrait, HP, pips (and the BAR style's buttons)
  function bar(ctx, B, hero) {
    var u = hero || B.active, st = UI.opts.style;
    ctx.fillStyle = 'rgba(10,8,16,.9)'; ctx.fillRect(0, BAR_Y, D.W, D.H - BAR_Y);
    ctx.fillStyle = R('silver', 2); ctx.fillRect(0, BAR_Y, D.W, 1);
    if (!u) return;
    ctx.fillStyle = R('stone', 1); ctx.fillRect(4, BAR_Y + 4, 36, 38);
    ctx.save(); ctx.beginPath(); ctx.rect(4, BAR_Y + 4, 36, 38); ctx.clip();
    var top = D.spr.top(u.sheet);
    D.spr.draw(ctx, u.sheet, 'idle', 0, B.t, 22, BAR_Y + 6 + Math.min(top, u.size > 1 ? 30 : 44), { alpha: u.ethereal ? 0.3 : 1 });
    ctx.restore();
    ctx.strokeStyle = u.side === 'foe' ? R('red', 3) : R('gold', 3); ctx.strokeRect(4.5, BAR_Y + 4.5, 35, 37);
    D.text(ctx, u.name, 44, BAR_Y + 4, u.side === 'foe' ? R('red', 4) : R('gold', 4));
    D.text(ctx, u.side === 'foe' ? 'foe' : (u.cls + ' ' + u.lvl), 44 + D.textWidth(u.name) + 6, BAR_Y + 4, R('accent', 2));
    ctx.fillStyle = R('stone', 1); ctx.fillRect(44, BAR_Y + 15, 100, 4);
    ctx.fillStyle = u.side === 'foe' ? R('red', 3) : R('moss', 2); ctx.fillRect(44, BAR_Y + 15, Math.round(100 * Math.max(0, u.hp) / u.maxhp), 4);
    D.text(ctx, 'HP ' + u.hp + '/' + u.maxhp + (u.temp ? ' +' + u.temp : '') + '   AC ' + RU.ac(u), 44, BAR_Y + 21, R('bone', 1));
    D.text(ctx, conds(u).trim() || (u.slots && u.slots.length ? 'slots ' + u.slots.map(function (n, i) { return (i + 1) + ':' + n; }).join(' ') : ''), 44, BAR_Y + 31, R('accent', 2));
    if (!hero) { D.text(ctx, u.ethereal ? 'moving unseen...' : 'its turn', 160, BAR_Y + 16, R('accent', 2)); return; }
    var T = u.turn;
    pip(ctx, 150, BAR_Y + 4, 'MOVE ' + T.move, T.move > 0, R('glow', 1));
    pip(ctx, 206, BAR_Y + 4, 'ACTION', T.action > 0 || T.attacksLeft > 0, R('gold', 3));
    pip(ctx, 150, BAR_Y + 17, 'BONUS', T.bonus > 0, R('glow', 2));
    pip(ctx, 206, BAR_Y + 17, 'REACTION', u.reaction > 0, R('violet', 4));
    var eb = { x: 150, y: BAR_Y + 30, w: 110, h: 11, end: true };
    B.buttons.push(eb);
    ctx.fillStyle = B.hoverBtn === B.buttons.length - 1 ? R('stone', 3) : R('stone', 1); ctx.fillRect(eb.x, eb.y, eb.w, eb.h);
    D.text(ctx, 'SPACE  END TURN', eb.x + 4, eb.y + 2, R('bone', 1));
    if (st !== 'bar') {
      D.text(ctx, st === 'window' ? (B.tool === 'menu' ? 'up/down, E: choose   X: menu' : 'E: here   X: back to the commands') : (B.tool === 'menu' ? 'left/right turns the ring, E: choose' : 'E: here   X: back to the ring'), 266, BAR_Y + 6, R('accent', 2));
      D.text(ctx, 'C recentre  H help  M menu', 266, BAR_Y + 18, R('stone', 5));
      return;
    }
    UI.cmds(B, u).forEach(function (c, i) {
      var col = i % 3, row = Math.floor(i / 3), b = { x: 266 + col * 71, y: BAR_Y + 4 + row * 13, w: 69, h: 11, cmd: c, idx: i };
      B.buttons.push(b);
      var hov = B.hoverBtn === B.buttons.length - 1, on = (c.tool && B.tool === c.tool) || (c.sub && B.list && B.list.kind === c.sub);
      var edge = c.cost === 'A' ? R('gold', 3) : c.cost === 'B' ? R('glow', 1) : R('bone', 0);
      ctx.fillStyle = on ? R('gold', 1) : hov && c.ok ? R('stone', 3) : R('stone', 1); ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = c.ok ? edge : R('stone', 3); ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
      D.text(ctx, (i + 1) + ' ' + c.label, b.x + 3, b.y + 2, c.ok ? R('bone', 2) : R('stone', 4));
    });
  }
  function pip(ctx, x, y, label, lit, col) {
    ctx.fillStyle = lit ? col : R('stone', 1); ctx.fillRect(x, y, 54, 11);
    ctx.strokeStyle = lit ? R('bone', 1) : R('stone', 3); ctx.strokeRect(x + 0.5, y + 0.5, 53, 10);
    D.text(ctx, label, x + 3, y + 2, lit ? R('outline', 0) : R('accent', 2));
  }
  function costTag(c) { return c === 'A' ? '{y}A{/}' : c === 'B' ? '{c}B{/}' : c === 'M' ? '{c}M{/}' : ''; }
  function slotText(e) { return e.kind !== 'spell' ? 'x' + e.n : e.level ? 'L' + e.slot + (e.levels.length > 1 ? ' <>' : '') : 'cantrip'; }

  // a list (spells, items) as a popup: the BAR style's, and the WINDOW style's second window
  function listPopup(ctx, B, u, x, yBottom, w, win) {
    var L = B.list, rows = L.items, vis = Math.min(rows.length, 10), start = D.clamp(L.sel - 5, 0, Math.max(0, rows.length - vis));
    var h = vis * 11 + 22, y = yBottom - h;
    win ? winBox(ctx, x, y, w, h) : box(ctx, x, y, w, h, R('glow', 1));
    B.uiRects.push({ x: x, y: y, w: w, h: h });
    D.text(ctx, L.kind === 'spells' ? 'SPELLS' + (u.slots.length ? '   slots ' + u.slots.map(function (n, i) { return (i + 1) + ':' + n; }).join(' ') : '') : 'ITEMS (an action)', x + 6, y + 4, R('gold', 4));
    for (var k = 0; k < vis; k++) {
      var i = start + k, e = rows[i], r = { x: x + 3, y: y + 14 + k * 11, w: w - 6, h: 11, list: i };
      B.buttons.push(r);
      if (i === L.sel) { ctx.fillStyle = win ? R('blue', 2) : R('stone', 3); ctx.fillRect(r.x, r.y, r.w, r.h); if (win) hand(ctx, r.x - 10, r.y + 1); }
      D.text(ctx, (k + 1) + ' ' + e.name, r.x + 3, r.y + 2, e.ok ? R('bone', 2) : R('stone', 4));
      D.text(ctx, slotText(e) + (e.g ? '  ' + costTag(e.g.time) : ''), r.x + r.w - 3, r.y + 2, e.ok ? R('silver', 5) : R('stone', 4), 'right');
    }
    var cur = rows[L.sel];
    if (cur && !cur.ok && cur.why) D.text(ctx, '{g}' + cur.why + '{/}', x + 6, y + h - 9, R('accent', 2));
    else if (cur && cur.sp) D.text(ctx, '{g}' + D.magic.summary(cur, u) + '{/}', x + 6, y + h - 9, R('accent', 2));
    else if (cur && cur.use) D.text(ctx, '{g}' + ({ heal: cur.use.dice + ' healing, touch', revive: 'a fallen ally beside you, up on 1 HP', antitoxin: 'ends poison, touch', cure: 'ends poison, touch', damage: 'thrown, 20 ft: DEX DC ' + (cur.use.dc || 10) + ' or ' + cur.use.dice + ' fire' }[cur.use.effect] || '') + '{/}', x + 6, y + h - 9, R('accent', 2));
  }

  // ------------------------------------------------------------------ WINDOW: Chrono Trigger's command window, a pointing hand
  function winBox(ctx, x, y, w, h) {
    var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, R('blue', 2)); g.addColorStop(1, R('blue', 0));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = R('silver', 6); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.strokeStyle = R('silver', 3); ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  }
  function hand(ctx, x, y) { // a little pointing glove
    var m = ['..oooo....', '.owwwwoooo', 'owwwwwwwwo', 'owwwwoooo.', '.owwwo....', '..ooo.....'];
    for (var r = 0; r < m.length; r++) for (var q = 0; q < m[r].length; q++) { var ch = m[r][q]; if (ch === '.') continue; ctx.fillStyle = ch === 'o' ? R('outline', 0) : R('bone', 2); ctx.fillRect(x + q, y + r + 1, 1, 1); }
  }
  function cmdWindow(ctx, B, u) {
    var cmds = UI.cmds(B, u), w = 104, h = cmds.length * 11 + 8, x = D.W - w - 4, y = BAR_Y - h - 4, focus = B.tool === 'menu' && !B.list;
    winBox(ctx, x, y, w, h);
    B.uiRects.push({ x: x, y: y, w: w, h: h });
    ctx.globalAlpha = focus || B.list ? 1 : 0.75;
    cmds.forEach(function (c, i) {
      var r = { x: x + 12, y: y + 4 + i * 11, w: w - 16, h: 11, cmd: c, idx: i };
      B.buttons.push(r);
      var on = (c.tool && B.tool === c.tool && c.tool !== 'move') || (c.sub && B.list && B.list.kind === c.sub);
      D.text(ctx, c.label, r.x + 2, r.y + 2, on ? R('gold', 4) : c.ok ? R('bone', 2) : R('silver', 3));
      D.text(ctx, costTag(c.cost), r.x + r.w - 2, r.y + 2, R('bone', 1), 'right');
      if (i === B.cmdSel && (focus || on)) hand(ctx, x + 1, r.y + 1);
    });
    ctx.globalAlpha = 1;
    if (B.list) listPopup(ctx, B, u, x - 206, y + h, 202, true);
  }

  // ------------------------------------------------------------------ RING: Secret of Mana's ring of icons round the hero
  function cmdRing(ctx, B, u) {
    if (B.tool !== 'menu' && !B.list) return;
    var cmds = B.list ? B.list.items : UI.cmds(B, u), n = cmds.length, sel = B.list ? B.list.sel : B.cmdSel;
    if (!n) return;
    var p = UI.unitPos(B, u), cx = p.x, cy = p.y - 26, rx = Math.max(36, n * 6), ry = Math.max(20, n * 3);
    // turn the ring smoothly toward the chosen icon (the chosen one sits at the front, at the bottom)
    var target = -sel * (Math.PI * 2 / n), key = B.list ? 'ringB' : 'ringA';
    if (B[key] == null) B[key] = target;
    var dA = target - B[key]; while (dA > Math.PI) dA -= Math.PI * 2; while (dA < -Math.PI) dA += Math.PI * 2;
    B[key] += dA * 0.35;
    ctx.fillStyle = 'rgba(10,8,16,.35)'; ctx.beginPath(); ctx.ellipse(cx, cy, rx + 10, ry + 10, 0, 0, 7); ctx.fill();
    var order = cmds.map(function (c, i) { var a = Math.PI / 2 + B[key] + i * Math.PI * 2 / n; return { c: c, i: i, x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, z: Math.sin(a) }; });
    order.sort(function (a, b) { return a.z - b.z; });
    order.forEach(function (o) {
      var front = o.i === sel, s = front ? 2 : 1, ic = D.iconFor(o.c), bx = Math.round(o.x - 6 * s), by = Math.round(o.y - 6 * s);
      var r = { x: bx - 2, y: by - 2, w: 12 * s + 4, h: 12 * s + 4, cmd: B.list ? null : o.c, idx: o.i, list: B.list ? o.i : null };
      B.buttons.push(r); B.uiRects.push(r);
      ctx.fillStyle = front ? R('gold', 1) : R('stone', 1); ctx.fillRect(bx - 2, by - 2, 12 * s + 4, 12 * s + 4);
      ctx.strokeStyle = front ? R('gold', 4) : o.c.ok ? R('silver', 3) : R('stone', 3); ctx.strokeRect(bx - 1.5, by - 1.5, 12 * s + 3, 12 * s + 3);
      ctx.globalAlpha = o.c.ok ? 1 : 0.4; ctx.drawImage(ic, bx, by, 12 * s, 12 * s); ctx.globalAlpha = 1;
    });
    var cur = cmds[sel], label = (cur.label || cur.name) + (cur.kind === 'spell' || cur.kind === 'item' ? '  ' + slotText(cur) : '') + (cur.cost ? '  ' + costTag(cur.cost) : cur.g ? '  ' + costTag(cur.g.time) : '');
    var lw = D.textWidth(label) + 10, ly = cy + ry + 16;
    box(ctx, Math.round(cx - lw / 2), ly, lw, 12, R('gold', 3));
    D.text(ctx, label, cx, ly + 2, cur.ok ? R('bone', 2) : R('stone', 4), 'center');
    var sub = !cur.ok && cur.why ? cur.why : cur.kind === 'spell' ? D.magic.summary(cur, u) : '';
    if (sub) { var ww = D.textWidth(sub) + 8; box(ctx, Math.round(cx - ww / 2), ly + 13, ww, 11, R('stone', 3)); D.text(ctx, '{g}' + sub + '{/}', cx, ly + 15, R('accent', 2), 'center'); }
    if (false) { var ww = D.textWidth(cur.why) + 8; box(ctx, Math.round(cx - ww / 2), ly + 13, ww, 11, R('stone', 3)); D.text(ctx, '{g}' + cur.why + '{/}', cx, ly + 15, R('accent', 2), 'center'); }
  }

  // ------------------------------------------------------------------ prompts, the entry card, inspect, the menu
  function box(ctx, x, y, w, h, edge) {
    ctx.fillStyle = 'rgba(10,8,16,.94)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = edge || R('gold', 3); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  function prompt(ctx, B, p) {
    var w = 300, lines = p.lines || [], h = 26 + lines.length * 9 + 16, x = (D.W - w) / 2, y = BAR_Y - h - 4;
    box(ctx, x, y, w, h);
    D.text(ctx, p.title, x + 8, y + 6, R('gold', 4));
    lines.forEach(function (l, k) { D.text(ctx, l, x + 8, y + 18 + k * 9, R('bone', 1)); });
    B.promptRects = [];
    var bx = x + 8, by = y + h - 16;
    p.opts.forEach(function (o, i) {
      var bw = D.textWidth((i + 1) + ' ' + o.label) + 10, r = { x: bx, y: by, w: bw, h: 12 };
      B.promptRects.push(r);
      ctx.fillStyle = i === B.sel ? R('gold', 1) : R('stone', 1); ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = i === B.sel ? R('gold', 4) : R('stone', 3); ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      D.text(ctx, (i + 1) + ' ' + o.label, r.x + 5, r.y + 2, i === B.sel ? R('gold', 4) : R('bone', 1));
      bx += bw + 6;
    });
  }
  function entry(ctx, B) {
    ctx.fillStyle = 'rgba(10,8,16,.7)'; ctx.fillRect(0, 0, D.W, D.H);
    var from = B.from, names = B.units.filter(function (u) { return u.side === 'party'; }).map(function (u) { return u.name; });
    var ago = from.when ? Math.max(1, Math.round((Date.now() - from.when) / 60000)) : 0;
    ctx.save(); ctx.translate(D.W / 2, 92); ctx.scale(2, 2); D.text(ctx, D.MAPS.cavern.name.toUpperCase(), 0, 0, R('gold', 4), 'center'); ctx.restore();
    D.text(ctx, D.MAPS.cavern.sub, D.W / 2, 116, R('silver', 5), 'center');
    D.text(ctx, names.join(', ') + ' come in from ' + (from.from === 'the fixture' ? (B.o.fixture ? 'the fixture' : 'the fixture (no 8-bit save found)') : from.from + (ago ? ', saved ' + (ago < 120 ? ago + ' min' : Math.round(ago / 60) + ' h') + ' ago' : '')) + '.', D.W / 2, 136, R('bone', 1), 'center');
    var lv = B.units.filter(function (u) { return u.side === 'party'; }).map(function (u) { return u.lvl; });
    D.text(ctx, 'Level ' + (Math.min.apply(null, lv) === Math.max.apply(null, lv) ? lv[0] : Math.min.apply(null, lv) + '-' + Math.max.apply(null, lv)) + '.  Two drow on the ledge. Something in the stalagmites.', D.W / 2, 150, R('accent', 2), 'center');
    if (B.canSwap) D.text(ctx, B.o.fixture ? '2: walk in from the 8-bit save instead' : '2: walk in as the fixture instead (the four at level 9; the fight is built for them)', D.W / 2, 164, R('silver', 5), 'center');
    D.text(ctx, 'menu: ' + UI.opts.style.toUpperCase() + ' (M or X/Esc, then MENU)   help: ' + (UI.opts.help ? 'ON' : 'OFF') + ' (H)', D.W / 2, 194, R('stone', 5), 'center');
    if ((B.t >> 5) & 1) D.text(ctx, 'E to begin', D.W / 2, 180, R('glow', 2), 'center');
  }
  function inspect(ctx, u) {
    var lines = ['{' + (u.side === 'foe' ? 'r' : 'c') + '}' + u.name + '{/}' + (u.cls ? '  ' + u.cls + ' ' + u.lvl : ''), 'HP ' + u.hp + '/' + u.maxhp + '  AC ' + RU.ac(u) + '  speed ' + u.speed + ' ft' + (u.size > 1 ? '  Large' : '')];
    if (u.weapon) lines.push(u.weapon.name + ' ' + RU.sign(u.weapon.atk) + ', ' + u.weapon.dice + RU.sign(u.weapon.mod) + ' ' + u.weapon.type + (u.attacks > 1 ? ', x' + u.attacks : ''));
    if (u.attacks && !u.weapon) Object.keys(u.attacks).forEach(function (k) { var a = u.attacks[k]; lines.push(a.name + ' ' + RU.sign(a.atk) + ', ' + a.dice + RU.sign(a.mod) + ' ' + a.type + (a.range ? ', ' + a.range.join('/') + ' ft' : '') + (a.extra ? ' +' + a.extra + ' ' + a.extraType : '') + (a.save ? ', DC ' + a.save.dc + ' ' + a.save.ab.toUpperCase() + ' or ' + a.save.dice + ' ' + a.save.type : '') + (a.poison ? ', DC ' + a.poison.dc + ' CON or poisoned' : '')); });
    if (u.jaunt) lines.push('{p}Ethereal Jaunt{/} (bonus action): steps out of the world, and back.');
    if (u.faerie) lines.push('{p}Faerie Fire{/} once' + (u.faerie.used ? ' (spent)' : ''));
    var c = conds(u).trim(); if (c) lines.push(c);
    var w = 0; lines.forEach(function (l) { w = Math.max(w, D.textWidth(l)); });
    box(ctx, 6, 40, w + 12, lines.length * 9 + 8, u.side === 'foe' ? R('red', 3) : R('glow', 1));
    lines.forEach(function (l, k) { D.text(ctx, l, 12, 44 + k * 9, R('bone', 1)); });
  }
  function menu(ctx, B) {
    var M = B.menu;
    if (M.panel === 'party') return party(ctx, B);
    var items = menuItems(), w = 190, h = items.length * 13 + 12, x = (D.W - w) / 2, y = 60;
    UI.opts.style === 'window' ? winBox(ctx, x, y, w, h) : box(ctx, x, y, w, h);
    B.menuRects = [];
    items.forEach(function (it, i) {
      var r = { x: x + 6, y: y + 6 + i * 13, w: w - 12, h: 12 };
      B.menuRects.push(r);
      if (i === M.sel) { ctx.fillStyle = R('gold', 1); ctx.fillRect(r.x, r.y, r.w, r.h); }
      D.text(ctx, it, r.x + 6, r.y + 2, i === M.sel ? R('gold', 4) : R('bone', 1));
    });
  }
  // the party at a glance (the 8-bit game's status screen, in small)
  function party(ctx, B) {
    var ps = B.units.filter(function (u) { return u.side === 'party'; }), w = 440, rowH = 38, h = ps.length * rowH + 20, x = (D.W - w) / 2, y = Math.max(16, (BAR_Y - h) / 2);
    box(ctx, x, y, w, h, R('glow', 1));
    D.text(ctx, 'THE PARTY', x + 8, y + 5, R('gold', 4));
    D.text(ctx, 'X back', x + w - 8, y + 5, R('stone', 5), 'right');
    ps.forEach(function (u, i) {
      var ry = y + 17 + i * rowH, f = u.feats || {};
      ctx.save(); ctx.beginPath(); ctx.rect(x + 6, ry, 30, 34); ctx.clip();
      D.spr.draw(ctx, u.sheet, 'idle', 0, B.t, x + 21, ry + Math.min(D.spr.top(u.sheet), 44) + 2, {});
      ctx.restore();
      D.text(ctx, '{y}' + u.name + '{/}  ' + u.cls + ' ' + u.lvl + '   HP ' + u.hp + '/' + u.maxhp + (u.temp ? ' +' + u.temp : '') + '   AC ' + RU.ac(u) + '   ' + (u.weapon ? u.weapon.name + ' ' + RU.sign(u.weapon.atk) : ''), x + 42, ry + 1, R('bone', 1));
      var res = [];
      if (u.slots && u.slots.length) res.push('slots ' + u.slots.map(function (n, k) { return (k + 1) + ':' + n + '/' + u.slotsMax[k]; }).join(' '));
      if (u.cls === 'fighter') res.push('2nd wind ' + (f.secondWind ? 'yes' : 'spent') + ', surge ' + (f.actionSurge ? 'yes' : 'spent') + ', indomitable ' + (f.indomitable ? 'yes' : 'spent'));
      if (u.cls === 'paladin') res.push('lay on hands ' + (f.lay || 0));
      if (u.cls === 'rogue') res.push('sneak ' + RU.sneakDice(u) + ', cunning action, uncanny dodge, evasion');
      D.text(ctx, res.join('   '), x + 42, ry + 11, R('silver', 5));
      D.text(ctx, conds(u).trim() || '{g}no conditions{/}', x + 42, ry + 21, R('accent', 2));
    });
    if (B.inv && B.inv.length) D.text(ctx, 'packs: ' + B.inv.filter(function (s) { return s.n > 0; }).map(function (s) { var it = window.DS.DATA.items[s.id]; return (it ? it.name : s.id) + ' x' + s.n; }).join(', '), x + 8, y + h - 10, R('accent', 2));
  }
})();
