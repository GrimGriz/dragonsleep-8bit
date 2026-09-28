/* DEEP16 — the fight's face and hands.
   Two menu styles over one set of commands, switched in the X/Esc menu: RING (a Secret of Mana-style ring of icons round
   the hero, the main one; the grid cursor at rest, the ring up on Q or E over the hero) and WINDOW (a Chrono
   Trigger-style command window with a pointing hand, up at rest, as there). RULED 09-27, Griz: the ring main, the window
   for those who'd rather; the first try's BAR of buttons dropped.
   The bottom bar has the portrait, HP and BARM -- bonus, action, reaction, move and its feet -- lit while there's one
   left, after the class; the keys; END TURN in its bottom-right corner.
   The overlay under the sprites: reach (blue), dash reach (paler), targets, templates, the aura ring, a flanking line;
   the cursor red where the current thing can't go; with HELP on, a rogue's hiding places tinted.
   Keys: arrows/WASD cursor along the grid (or the menu), E/Z confirm, X/Esc back (at rest: the menu), Q the ring,
   SPACE end turn, 1-9 commands, M/Tab the menu, C recentre, H help, -/= zoom. Mouse: hover, click, right-click
   inspect, the wheel zooms, middle-drag or the screen's edge (or past it) to look. */
'use strict';
(function () {
  var D = window.D16, I = D.input, G = D.grid, RU = D.rules, FX = D.fx;
  var UI = D.ui = {};
  var R = function (r, i) { return D.PAL.ramps[r][i]; };
  var BAR_Y = 226, DEFER = null, WCTX = null, WC = null;
  function worldCanvas(w, h) {
    if (!WC) WC = document.createElement('canvas');
    if (WC.width !== w || WC.height !== h) { WC.width = w; WC.height = h; }
    WC.getContext('2d').imageSmoothingEnabled = false;
    return WC;
  }
  var BX = 182, BP = 74;   // the bar's right-hand block (the keys, END TURN): its left edge, a cell's pitch

  // ------------------------------------------------------------------ options (a per-viewer convenience; the page works without storage)
  // RULED 09-27, Griz: the ring is the main menu, the window stays for those who'd rather; the bar's buttons are gone
  // (a saved 'bar' becomes the ring)
  UI.opts = { help: false, style: 'ring', autoEnd: true };
  try { var o0 = JSON.parse(window.localStorage.getItem('deep16.opts') || 'null'); if (o0) { if (o0.style === 'window') UI.opts.style = 'window'; if (o0.autoEnd === false) UI.opts.autoEnd = false; } } catch (e) { }
  UI.saveOpts = function () { try { window.localStorage.setItem('deep16.opts', JSON.stringify(UI.opts)); } catch (e) { } };
  var qs = /[?&]menu=(window|ring)/.exec(location.search); if (qs) UI.opts.style = qs[1];
  // at rest: WINDOW holds its command window up (as Chrono Trigger does); RING stands on the grid ready to walk, and
  // the ring comes up on E over the hero (where the cursor starts a turn), a click on him, or Q (Griz, 09-27)
  function rest() { return UI.opts.style === 'window' ? 'menu' : 'move'; }

  // ------------------------------------------------------------------ requests
  UI.onRequest = function (B, req) {
    if (req.turn) {
      var T = req.turn.turn;
      // a second swing waits on the grid only while there's a foe to take it at; else back to rest (walk, or the ring)
      B.tool = T.attacksLeft && B.foeInReach(req.turn) ? 'attack' : B.nextTool || rest(); B.nextTool = null; B.cache = null; B.list = null; B.picks = []; B.spell = null;
      if (B.cmdSel == null || B.cmdFor !== req.turn) { B.cmdSel = 0; B.cmdFor = req.turn; B.ringA = null; }
      // on the ring, the grid gives way to it once there's nothing left there: no step to take, no swing at a foe in reach
      // (Griz, 09-27: all the movement spent, or the last blow struck, and the ring comes up by itself)
      if (UI.opts.style === 'ring' && B.tool === 'move' && gridDone(B, req.turn)) { B.tool = 'menu'; B.ringStill = false; }
    }
    if (req.prompt) { B.sel = 0; D.sfx('popup'); }
    if (req.entry) B.entryT = B.t;
  };
  function reachCache(B, u) {
    var T = u.turn, key = u.x + ',' + u.y + ',' + T.move + ',' + T.action + ',' + T.attacksLeft + ',' + B.units.map(function (w) { return w.x + ':' + w.y + ':' + (w.dead || w.hp <= 0 ? 0 : RU.canAct(w) ? 1 : 2) + (w.ethereal ? 'e' : ''); }).join(';') + (B.webs || []).length;
    if (B.cache && B.cache.key === key) return B.cache;
    var held = !!u.conds.restrained, dash = !held && T.action > 0 && !T.attacksLeft ? u.speed : 0;
    B.cache = { key: key + (held ? ',held' : ''), move: G.reach(u, held ? 0 : T.move), dash: dash ? G.reach(u, T.move + dash) : null, hide: null };
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

  // the squares she can reach (and her own) from which she'd flank a foe with an ally on its far side: { 'x,y': [{ foe, ally }] }
  function flankSpots(B, u) {
    var rc = reachCache(B, u);
    if (rc.flank) return rc.flank;
    var foes = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && !w.dead && w.hp > 0; }), out = {};
    var sq = [[u.x, u.y]];
    Object.keys(rc.move).forEach(function (k) { var e = rc.move[k]; if (e.stand) sq.push([e.x, e.y]); });
    sq.forEach(function (q) {
      var got = [];
      foes.forEach(function (f) { if (G.dist(u, f, q[0], q[1]) > 5) return; var a = G.flank(u, f, q[0], q[1]); if (a) got.push({ foe: f, ally: a }); });
      if (got.length) out[q[0] + ',' + q[1]] = got;
    });
    return (rc.flank = out);
  }
  UI.flankSpots = flankSpots;

  // ------------------------------------------------------------------ the commands a style shows (window and ring add MOVE and END TURN)
  // the top of the menu: MOVE, ATTACK, (HIDE), (BREAK FREE), SPELLS, SKILLS, ITEM, ACTIONS, END TURN. SKILLS gathers the
  // class features that spend something (the 8-bit game's SKILL: Lay on Hands, Sacred Weapon, Second Wind, Action
  // Surge); ACTIONS the plain ones anyone has (Dash, Disengage, Dodge, Help), the same four for everyone, the rogue's
  // Dash and Disengage being her Cunning Action's -- Griz, 09-27. The rogue's HIDE is on the first ring (09-27 again)
  var SKILLS = { lay: 1, sacred: 1, secondwind: 1, surge: 1, ignite: 1, douse: 1 }, ACTIONS = { dash: 1, disengage: 1, cdash: 1, cdisengage: 1, dodge: 1, help: 1, leave: 1, droptorch: 1, throwtorch: 1, dousetorch: 1, pickuptorch: 1 };
  function group(id, label, list) {
    return { id: id, label: label, cost: '', ok: list.some(function (x) { return x.ok; }), why: 'nothing there to do now', sub: id, icon: id, items: list };
  }
  // the wizard's cantrip in the swing's place on the first ring, his staff among the ACTIONS (Griz, 09-28: "put Aurdin's attack
  // in with his 'dodge/dash' and the default wizard cantrip ... on the first ring where it was ... still keep it in [the] list")
  var QUICK = { wizard: 'firebolt' };
  function quickSpell(B, u) {
    var id = !u.guest && QUICK[u.cls], e = id && D.magic.list(B, u).filter(function (x) { return x.id === id; })[0];
    return e ? Object.assign(e, { kind: 'spell', label: e.name.toUpperCase(), quick: true }) : null;
  }
  UI.cmds = function (B, u) {
    var c = B.commands(u), top = {}, sk = [], ac = [], q = quickSpell(B, u);
    c.forEach(function (x) { if (SKILLS[x.id] || (q && x.id === 'attack')) (SKILLS[x.id] ? sk : ac).push(x); else if (ACTIONS[x.id]) ac.push(x); else top[x.id] = x; });
    if (q) top.attack = q;
    var out = [{ id: 'move', label: 'MOVE', cost: 'M', ok: u.turn.move > 0 && !u.conds.restrained, tool: 'move', icon: 'move' }];
    ['attack', 'hide', 'breakfree', 'spells'].forEach(function (k) { if (top[k]) out.push(top[k]); });
    if (sk.length) out.push(group('skills', 'SKILLS', sk));
    if (top.items) out.push(top.items);
    if (ac.length) out.push(group('actions', 'ACTIONS', ac));
    return out.concat([{ id: 'end', label: 'END TURN', cost: 'F', ok: true, icon: 'end' }]);
  };

  // ------------------------------------------------------------------ the camera: look where you like (the edge, a middle-drag), C comes back
  // the zoom steps: whole device pixels per art pixel at the backing scale (at 3x: 1, 2/3, 1/3), never under a third
  function zooms() { var R = D.R, L = []; for (var k = R; k >= 1; k--) if (k / R >= 0.33) L.push(k / R); if (L.length < 2) L.push(0.5); return L; }
  UI.setZoom = function (dir, ax, ay) {
    var L = zooms(), iso = D.iso, cam = iso.cam, z0 = iso.zoom, i = 0, best = 1e9;
    L.forEach(function (z, k) { if (Math.abs(z - z0) < best) { best = Math.abs(z - z0); i = k; } });
    var z1 = L[D.clamp(i + dir, 0, L.length - 1)];
    if (z1 === z0) return;
    // keep the world point under the mouse (or the middle) where it is
    if (ax == null) { ax = D.W / 2; ay = D.H / 2; }
    var wx = cam.x + (ax - D.W / 2) / z0, wy = cam.y + (ay - D.H / 2) / z0;
    iso.zoom = z1; cam.x = wx - (ax - D.W / 2) / z1; cam.y = wy - (ay - D.H / 2) / z1;
  };
  var EDGE = 16; // the edge band that scrolls the view, in screen pixels (it was 4-6); past the canvas's edge, full speed
  UI.camera = function (B) {
    var m = I.mouse, iso = D.iso, cam = iso.cam, map = iso.map, bk = map.bake, z = iso.zoom;
    var free = !m.drag && !B.menu && !(B.req && (B.req.prompt || B.req.entry));
    if (free && m.inWin && !(m.inside && overUI(B) && m.y < D.H - 3)) {
      // past the edge counts for a band as wide again (and twice over); further out the mouse is parked, not pushing
      var push = function (d) { return d >= EDGE || d < -2 * EDGE ? 0 : d <= 0 ? 6 : 1.5 + 4.5 * (1 - d / EDGE); };
      cam.x += (push(D.W - 1 - m.x) - push(m.x)) / z;
      cam.y += (push(D.H - 1 - m.y) - push(m.y)) * 0.75 / z;
    }
    if (m.panX || m.panY) { cam.x -= (m.panX || 0) / z; cam.y -= (m.panY || 0) / z; m.panX = m.panY = 0; }
    if (free && (m.wheel || I.pressed('zoomout') || I.pressed('zoomin'))) UI.setZoom(m.wheel ? m.wheel : I.pressed('zoomout') ? 1 : -1, m.wheel && m.inside ? m.x : null, m.wheel && m.inside ? m.y : null);
    if (I.pressed('center')) { var a = B.active || (B.req && B.req.turn); if (a) B.focus(a); }
    // keep the cave in view; zoomed out past its size, centre it
    z = iso.zoom;
    var vw = D.W / z, vh = D.H / z, bw = bk.canvas.width, bh = bk.canvas.height;
    var x0 = bk.x + vw / 2 - 60, x1 = bk.x + bw - vw / 2 + 60, y0 = bk.y + vh / 2 - 20, y1 = bk.y + bh - vh / 2 + 60;
    cam.x = x0 > x1 ? bk.x + bw / 2 : D.clamp(cam.x, x0, x1);
    cam.y = y0 > y1 ? bk.y + bh / 2 + 20 : D.clamp(cam.y, y0, y1);
  };

  // ------------------------------------------------------------------ input
  UI.input = function (B, req) {
    if (req.entry) {
      if (B.canSwap && (I.pressed('n2') || I.pressed('left') || I.pressed('right'))) { D.pop(); D.push(new D.Battle(Object.assign({}, B.o, { fixture: !B.o.fixture }))); return; }
      if (I.pressed('a') || I.pressed('end') || I.mouse.click || (!B.canSwap && B.t - B.entryT > 240)) { D.sfx('confirm'); B.answer(); }
      return;
    }
    UI.camera(B);
    if (req.prompt) return promptInput(B, req.prompt);
    if (req.turn) return turnInput(B, req.turn);
  };
  function promptInput(B, p) {
    var n = p.opts.length, s0 = B.sel, go = function (v) { D.sfx('confirm'); B.answer(v); };
    if (I.repeat('left') || I.repeat('up')) B.sel = (B.sel + n - 1) % n;
    if (I.repeat('right') || I.repeat('down')) B.sel = (B.sel + 1) % n;
    if (B.sel !== s0) D.sfx('cursor');
    for (var k = 1; k <= n; k++) if (I.pressed('n' + k)) return go(p.opts[k - 1].value);
    if (I.pressed('a')) return go(p.opts[B.sel].value);
    if (I.pressed('b')) { D.sfx('cancel'); return B.answer(p.opts[n - 1].value); }
    if (I.mouse.click && B.promptRects) for (var i = 0; i < B.promptRects.length; i++) if (hit(B.promptRects[i])) return go(p.opts[i].value);
  }
  function hit(r) { var m = I.mouse; return r && m.x >= r.x && m.y >= r.y && m.x < r.x + r.w && m.y < r.y + r.h; }
  function moveCursor(B, dir) {
    var m = G.map;
    if (!D.iso.nudge(B.cursor, dir, m.w, m.h)) return;
    var c = D.iso.center(B.cursor.x, B.cursor.y, m.gz(B.cursor.x, B.cursor.y)), s = D.iso.toScreen(c.x, c.y);
    if (s.x < 60 || s.x > D.W - 60 || s.y < 50 || s.y > BAR_Y - 30) D.iso.lookAt(B.cursor.x, B.cursor.y, m.gz(B.cursor.x, B.cursor.y));
  }
  // the figure under the mouse (its whole sprite, front-most first): clicking a body selects its owner, not the floor behind
  UI.pickUnit = function (B, mx, my) {
    var best = null, bd = -1e9, z = D.iso.zoom;
    B.units.forEach(function (u) {
      if (u.dead || u.ethereal) return;
      var p = unitPos(B, u), s = u.size || 1, top = (u.hp > 0 ? D.spr.unitTop(u) : 16) * z, hw = (s > 1 ? 30 : 11) * z;
      if (mx >= p.x - hw && mx <= p.x + hw && my >= p.y - top && my <= p.y + 5 * z && p.depth > bd) { bd = p.depth; best = u; }
    });
    return best;
  };
  function overUI(B) { // is the mouse over a menu, a list or the bar (so the grid doesn't take the click)?
    if (I.mouse.y >= BAR_Y) return true;
    return (B.uiRects || []).some(hit);
  }
  function turnInput(B, u) {
    var st = UI.opts.style, any = I.pressed('a') || I.pressed('b') || I.pressed('end') || I.mouse.click;
    if (B.inspect && (any || I.mouse.rclick)) { B.inspect = null; return; }
    if (I.pressed('end')) return UI.command(B, u, { do: 'end' });
    // AUTO END: every command grey and no step left to take -- a beat to see it, then the turn passes (X holds it)
    if (UI.opts.autoEnd && !B.list && B.tool !== 'spell' && B.autoHold !== B.req && spent(B, u)) {
      if (B.autoFor !== B.req) { B.autoFor = B.req; B.autoT = B.t; B.card(['{g}Nothing left to spend: the turn passes.  X holds it{/}'], 50); }
      if (I.pressed('b')) { B.autoHold = B.req; B.clearCards(); return; }
      if (B.t - B.autoT >= 45 || I.pressed('a')) return UI.command(B, u, { do: 'end' });
    }
    // the mouse: over the menus, or on the grid
    B.hoverBtn = -1;
    if (I.mouse.inside && !overUI(B) && I.mouse.moved) { var pu = UI.pickUnit(B, I.mouse.x, I.mouse.y), s = pu ? { x: pu.x, y: pu.y } : D.iso.pick(I.mouse.x, I.mouse.y); if (s) { B.cursor.x = s.x; B.cursor.y = s.y; } }
    if (I.mouse.inside) (B.buttons || []).forEach(function (b, i) { if (hit(b)) B.hoverBtn = i; });
    // hovering picks an icon only when the mouse moves onto it: a ring turning under a resting mouse, or a twitch
    // on the same icon, leaves the arrows' choice alone (Griz, 09-27: the arrows stopped working over the wheel)
    var hb = B.buttons && B.buttons[B.hoverBtn], hk = !hb ? null : hb.list != null && B.list ? 'l' + hb.list : hb.idx != null ? 'c' + hb.idx : 'x';
    if (hb && I.mouse.moved && hk !== B.hoverKey) { B.ringStill = true; if (hb.list != null && B.list) { if (B.list.sel !== hb.list) D.sfx('cursor'); B.list.sel = hb.list; } else if (hb.idx != null && B.tool === 'menu') { if (B.cmdSel !== hb.idx) D.sfx('cursor'); B.cmdSel = hb.idx; } }
    B.hoverKey = hk;
    if (I.mouse.click && B.hoverBtn >= 0) { var bt = B.buttons[B.hoverBtn]; return bt.end ? UI.command(B, u, { do: 'end' }) : bt.cast ? castPicks(B, u) : bt.list != null ? pickListItem(B, u, B.list.items[bt.list], bt.list) : pickCommand(B, u, bt.cmd, bt.idx); }
    if (I.mouse.rclick && !overUI(B)) { var w0 = G.occupant(B.cursor.x, B.cursor.y) || etherealAt(B, B.cursor.x, B.cursor.y); if (w0) B.inspect = w0; return; }
    // an open list (spells, items) takes the keys first
    if (B.list) return listInput(B, u);
    var cmds = UI.cmds(B, u);
    for (var k = 1; k <= 9; k++) if (I.pressed('n' + k) && cmds[k - 1]) return pickCommand(B, u, cmds[k - 1], k - 1);
    if (I.pressed('ring')) { D.sfx(B.tool === 'menu' ? 'cancel' : 'popup'); B.tool = B.tool === 'menu' ? rest() === 'menu' ? 'move' : rest() : 'menu'; B.spell = null; B.picks = []; B.clearCards(); return; }
    // the command menu at rest (window, ring)
    if (B.tool === 'menu') {
      var n = cmds.length, prev = B.cmdSel;
      if (st === 'window') { if (I.repeat('up')) B.cmdSel = (B.cmdSel + n - 1) % n; if (I.repeat('down')) B.cmdSel = (B.cmdSel + 1) % n; }
      else { if (I.repeat('left') || I.repeat('up')) B.cmdSel = (B.cmdSel + n - 1) % n; if (I.repeat('right') || I.repeat('down')) B.cmdSel = (B.cmdSel + 1) % n; }
      if (B.cmdSel !== prev) { B.clearCards(); D.sfx('cursor'); B.ringStill = false; }
      if (I.pressed('a')) return pickCommand(B, u, cmds[B.cmdSel], B.cmdSel);
      if (I.pressed('b')) { if (rest() !== 'menu') { D.sfx('cancel'); B.tool = rest(); return; } return UI.openMenu(B); } // the ring goes back down
      if (I.mouse.click && !overUI(B)) actAt(B, u, B.cursor.x, B.cursor.y);
      return;
    }
    // the grid
    ['up', 'down', 'left', 'right'].forEach(function (k) { if (I.repeat(k)) moveCursor(B, k); });
    if (I.pressed('b')) {
      if (B.picks && B.picks.length) { D.sfx('cancel'); B.picks.pop(); return; }
      if (B.tool !== rest()) { D.sfx('cancel'); B.tool = rest(); B.spell = null; B.clearCards(); return; }
      // on the ring, X at rest calls the ring up (Griz, 09-27: backing out of a move should bring it); M/Tab the menu
      if (UI.opts.style === 'ring') { D.sfx('popup'); B.tool = 'menu'; B.clearCards(); return; }
      return UI.openMenu(B);
    }
    if (I.pressed('a')) actAt(B, u, B.cursor.x, B.cursor.y, true);
    else if (I.mouse.click && !overUI(B)) actAt(B, u, B.cursor.x, B.cursor.y, false);
  }
  function gridDone(B, u) {
    var T = u.turn;
    if ((T.attacksLeft > 0 || T.action > 0) && B.foeInReach(u)) return false;
    if (T.move > 0 && !u.conds.restrained) { var rc = reachCache(B, u); if (Object.keys(rc.move).some(function (k) { return rc.move[k].stand && rc.move[k].cost > 0; })) return false; }
    return true;
  }
  // nothing left this turn: no square to step to, and every command grey (the bonus, a surge, a spell all count)
  function spent(B, u) {
    var T = u.turn;
    if (T.move > 0 && !u.conds.restrained) { var rc = reachCache(B, u); if (Object.keys(rc.move).some(function (k) { return rc.move[k].stand && rc.move[k].cost > 0; })) return false; }
    return !B.commands(u).some(function (c) { return c.ok; });
  }
  function castPicks(B, u) { var S = B.spell; if (S && B.picks.length) UI.command(B, u, { do: 'cast', id: S.id, slot: S.slot, target: { units: B.picks.slice() } }); }
  function etherealAt(B, x, y) { return B.units.filter(function (w) { return w.ethereal && x >= w.x && y >= w.y && x < w.x + w.size && y < w.y + w.size; })[0]; }
  function pickCommand(B, u, c, idx) {
    if (idx != null) B.cmdSel = idx;
    if (!c) return;
    if (!c.ok) { D.sfx('error'); B.card(['{g}' + c.label + ': ' + (c.why || 'not now') + '.{/}'], 120); return; }
    if (c.quick) { B.list = { kind: 'spells', items: [c], sel: 0 }; return pickListItem(B, u, c, 0); } // (the cantrip on the first ring)
    D.sfx('confirm');
    if (c.id === 'end') return UI.command(B, u, { do: 'end' });
    if (c.sub === 'spells' && UI.opts.style === 'ring') { B.list = levelRing(B, u); B.ringB = null; return; }
    if (c.items) { // SKILLS, ACTIONS: their commands as a list (a ring on the ring)
      var cl = c.items.map(function (x) { return { kind: 'cmd', cmd: x, id: x.id, icon: x.icon, name: x.label, label: x.label, cost: x.cost, ok: x.ok, why: x.why, note: x.note }; });
      var f0 = 0; cl.some(function (e, i) { if (e.ok) { f0 = i; return true; } return false; });
      B.list = { kind: c.sub, items: cl, sel: f0, title: c.label }; B.ringB = null; B.ringStill = false;
      return;
    }
    if (c.sub) {
      var items = c.sub === 'spells' ? D.magic.list(B, u).map(function (e) { e.kind = 'spell'; return e; }) : B.itemList(u).map(function (e) { e.kind = 'item'; return e; });
      var first = 0; items.some(function (e, i) { if (e.ok) { first = i; return true; } return false; });
      B.list = { kind: c.sub, items: items, sel: first }; B.ringB = null;
      return;
    }
    if (c.tool) { B.tool = c.tool; B.clearCards(); if (c.tool === 'help') B.card(['{g}HELP: pick a foe beside you; the next ally to swing at it has advantage.{/}'], 200); if (c.tool === 'torch') B.card(['{g}THROW TORCH: a square within 20 ft you can see. It lands and burns there.  X back{/}'], 100000); return; }
    UI.command(B, u, { do: c.id });
  }
  function levelRing(B, u) {
    var all = D.magic.list(B, u), lv = {}, items = [];
    all.forEach(function (e) { (lv[e.level] = lv[e.level] || []).push(e); });
    Object.keys(lv).map(Number).sort(function (a, b) { return a - b; }).forEach(function (L) {
      var slots = L ? (u.slots[L - 1] || 0) : null, any = lv[L].some(function (e) { return e.ok; });
      items.push({ kind: 'level', level: L, name: L ? 'LEVEL ' + L : 'CANTRIPS', label: L ? 'LEVEL ' + L + ' · ' + slots + ' slot' + (slots === 1 ? '' : 's') : 'CANTRIPS', ok: any, why: any ? '' : L && !slots ? 'no level-' + L + ' slots left' : 'nothing castable now', spells: lv[L] });
    });
    var first = 0; items.some(function (e, i) { if (e.ok) { first = i; return true; } return false; });
    return { kind: 'levels', items: items, sel: first };
  }
  function listInput(B, u) {
    var L = B.list, n = L.items.length, st = UI.opts.style, e = L.items[L.sel];
    var ringy = st === 'ring', nextKey = ringy ? ['left', 'right'] : ['up', 'down'], slotKey = ringy ? ['down', 'up'] : ['left', 'right']; // [lower, higher]
    var sel0 = L.sel, slot0 = e && e.slot;
    if (n && I.repeat(nextKey[0])) L.sel = (L.sel + n - 1) % n;
    if (n && I.repeat(nextKey[1])) L.sel = (L.sel + 1) % n;
    if (e && e.kind === 'spell' && e.levels.length > 1) {
      var i = e.levels.indexOf(e.slot);
      if (I.repeat(slotKey[0])) e.slot = e.levels[Math.max(0, i - 1)];
      if (I.repeat(slotKey[1])) e.slot = e.levels[Math.min(e.levels.length - 1, i + 1)];
    }
    if (L.sel !== sel0) B.ringStill = false;
    if (L.sel !== sel0 || (e && e.slot !== slot0)) D.sfx('cursor');
    for (var k = 1; k <= 9; k++) if (I.pressed('n' + k) && L.items[k - 1]) return pickListItem(B, u, L.items[k - 1], k - 1);
    if (I.pressed('a')) return pickListItem(B, u, e, L.sel);
    if (I.pressed('b')) { D.sfx('cancel'); B.list = L.back || null; return; }
  }
  function pickListItem(B, u, e, i) {
    if (!e) return;
    B.list.sel = i;
    if (!e.ok) { D.sfx('error'); B.card(['{g}' + e.name + ': ' + (e.why || 'not now') + '.{/}'], 150); return; }
    if (e.kind === 'cmd') { B.list = null; return pickCommand(B, u, e.cmd); } // (it says its own confirm)
    D.sfx('confirm');
    if (e.kind === 'level') { var sp = e.spells.map(function (x) { x.kind = 'spell'; return x; }), f = 0; sp.some(function (x, k) { if (x.ok) { f = k; return true; } return false; }); B.list = { kind: 'spells', items: sp, sel: f, back: B.list, title: e.label }; B.ringC = null; return; }
    B.list = null;
    if (e.kind === 'item') { B.tool = 'item'; B.itemId = e.id; B.card(['{g}' + e.name + ': ' + (e.use.effect === 'damage' ? 'throw it at a foe within 20 ft.' : e.use.effect === 'revive' ? 'a fallen ally beside you.' : 'yourself, or an ally beside you.') + '{/}'], 240); return; }
    var g = e.g, n = (g.n || 1) + Math.max(0, e.slot - e.level);
    B.spell = { id: e.id, slot: e.slot, g: g, sp: e.sp, n: n, name: e.name };
    B.picks = [];
    if (g.shape === 'self') return UI.command(B, u, { do: 'cast', id: e.id, slot: e.slot, target: u });
    B.tool = 'spell';
    if (g.shape === 'allies' && e.id === 'bless' && (!u.conds.blessed)) B.picks = [u]; // Bless takes the caster by default; click him again to leave him out
    var how = { attack: 'a foe in sight within ' + g.range + ' ft', rays: n + ' rays: click a foe for each (the same foe again is fine)', darts: n + ' darts: click a foe for each (the same foe again is fine)', splash: 'a foe within ' + g.range + ' ft (one beside it is caught too)', single: (g.side === 'foe' ? 'a foe' : 'an ally') + ' within ' + g.range + ' ft', touch: 'yourself, or an ally beside you', allies: 'up to ' + n + ' allies within ' + g.range + ' ft (click to add or drop; CAST, or E off a target, casts with fewer)', sphere: 'a point within ' + g.range + ' ft (the ' + g.r + '-ft sphere shows)', cube: 'a point within ' + g.range + ' ft', cone: 'aim the ' + g.len + '-ft cone', line: 'aim the ' + g.len + '-ft line', teleport: 'a square you can see within 30 ft' }[g.shape] || '';
    B.clearCards(); B.card(['{y}' + e.name.toUpperCase() + (e.level ? ' (L' + e.slot + ')' : '') + '{/}: ' + how + '.  {g}X back{/}'], 100000);
  }
  UI.command = function (B, u, cmd) {
    B.clearCards();
    if (/^(dash|cdash|disengage|cdisengage)$/.test(cmd.do)) B.nextTool = 'move';
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
      if (foe) return B.canHit(u, foe) && (T.attacksLeft || T.action) ? 'ok' : 'no'; // a crossbow reaches out to its long range
      var rc = reachCache(B, u), k = x + ',' + y; // (the attack tool walks too: a step between swings is fair)
      if (rc.move[k] && rc.move[k].stand) return 'ok';
      if (rc.dash && rc.dash[k] && rc.dash[k].stand) return 'far';
      return 'no';
    }
    if (tool === 'help') return foe && G.dist(u, foe) <= 5 ? 'ok' : 'no';
    if (tool === 'lay') return w && w.side === u.side && !w.dead && (w === u || G.dist(u, w) <= 5) ? 'ok' : 'no';
    if (tool === 'item') return B.itemTargetOK(u, B.itemId, w) ? 'ok' : 'no';
    if (tool === 'torch') return UI.throwSq(u, x, y) ? 'ok' : 'no';
    if (tool === 'spell') {
      var g = B.spell.g, M = D.magic;
      if (g.shape === 'sphere' || g.shape === 'cube') return M.inRange(u, g, x, y) ? 'ok' : 'no';
      if (g.shape === 'cone' || g.shape === 'line' || g.shape === 'wave') return M.area(u, g, x, y).length ? 'ok' : 'no';
      if (g.shape === 'teleport') return B.mistyTargets(u).some(function (q) { return q[0] === x && q[1] === y; }) ? 'ok' : 'no';
      if (g.shape === 'allies' && B.picks.length && !(w && M.targetOK(B, u, g, w))) return 'self';
      if (w && M.targetOK(B, u, g, w)) return 'ok';
      return M.missileDark(B, u, g, x, y) ? 'ok' : 'no'; // (Magic Missile at the darkness: a square the caster cannot see into)
    }
    return 'no';
  };
  // a square a torch may be thrown to: open, within 20 ft, in line (not the thrower's own)
  UI.throwSq = function (u, x, y) { var s = G.map.at(x, y); return !!(s && s.open && !(x === u.x && y === u.y) && Math.max(Math.abs(x - u.x), Math.abs(y - u.y)) * 5 <= 20 && G.losPoint(u.x, u.y, x, y)); };
  function actAt(B, u, x, y, byKey) {
    var T = u.turn, tool = B.tool, w = G.occupant(x, y), foe = w && G.hostile(u, w) && !w.dead && w.hp > 0 ? w : null, v = UI.valid(B, u, x, y);
    if (tool === 'move' || tool === 'menu' || tool === 'attack') {
      if (x === u.x && y === u.y) { D.sfx('popup'); B.tool = 'menu'; return; }
      if (foe && v === 'ok') return UI.command(B, u, { do: 'attack', target: foe });
      if (foe) {
        D.sfx('error');
        if (B.canHit(u, foe)) return B.card(['{o}No attack left this turn: the action is spent.{/}'], 120);
        return B.card(['{o}The ' + B.shortName(foe) + ' is out of ' + (u.weapon && u.weapon.ranged ? 'range' : 'reach') + ' (' + G.dist(u, foe) + ' ft).{/}'], 120);
      }
      if (v === 'ok') return UI.command(B, u, { do: 'move', x: x, y: y });
      if (v === 'far') return UI.command(B, u, { do: 'dashmove', x: x, y: y });
      return;
    }
    if (tool === 'help') { if (v === 'ok') return UI.command(B, u, { do: 'help', target: foe }); return B.card(['{o}Help: pick a foe beside you.{/}'], 120); }
    if (tool === 'lay') { if (v === 'ok') return UI.command(B, u, { do: 'lay', target: w }); return B.card(['{o}Lay on Hands is touch: yourself or an ally beside you.{/}'], 120); }
    if (tool === 'item') { if (v === 'ok') return UI.command(B, u, { do: 'item', id: B.itemId, target: w }); return B.card(['{o}Not a target for that.{/}'], 120); }
    if (tool === 'torch') { if (v === 'ok') return UI.command(B, u, { do: 'throwtorch', x: x, y: y }); return B.card(['{o}Throw it to a square within 20 ft you can see.{/}'], 120); }
    if (tool === 'spell') {
      var S = B.spell, g = S.g, M = D.magic, cast = function (t) { UI.command(B, u, { do: 'cast', id: S.id, slot: S.slot, target: t }); };
      if (g.shape === 'rays' || g.shape === 'darts') {
        if (v !== 'ok') return;
        B.picks.push(w && M.targetOK(B, u, g, w) ? w : { x: x, y: y, size: 1, dark: true, name: 'the dark' }); // (a dart at the darkness)
        if (B.picks.length >= S.n) return cast({ units: B.picks.slice() });
        return B.card(['{y}' + S.name + '{/}: ' + B.picks.length + ' of ' + S.n + ' aimed.  {g}X takes the last back{/}'], 100000);
      }
      if (g.shape === 'allies') {
        if (v === 'ok') { var i = B.picks.indexOf(w); if (i >= 0) B.picks.splice(i, 1); else B.picks.push(w); }
        else if (byKey && B.picks.length) return cast({ units: B.picks.slice() });
        else return;
        if (B.picks.length >= S.n) return cast({ units: B.picks.slice() });
        return B.card(['{y}' + S.name + '{/}: ' + (B.picks.length ? B.picks.map(function (p) { return p.name; }).join(', ') : 'no one yet') + ' (' + B.picks.length + ' of ' + S.n + ').  {g}CAST below, or E off a target, casts with these{/}'], 100000);
      }
      if (v !== 'ok') return;
      if (g.shape === 'sphere' || g.shape === 'cube' || g.shape === 'cone' || g.shape === 'line' || g.shape === 'wave' || g.shape === 'teleport') return cast({ x: x, y: y });
      return cast(w);
    }
  }

  // ------------------------------------------------------------------ the X/Esc menu (and M, Tab): the party, the menu's style, and out
  UI.openMenu = function (B) { D.sfx('popup'); B.menu = { sel: 0, panel: null }; };
  // the volumes are the 8-bit game's own (shared: one player, one ear)
  function vol(k) { var A = window.DS.audio; return A ? A[k] : 0; }
  function pct(v) { return v > 0 ? Math.round(v * 100) + '%' : 'OFF'; }
  function setVol(k, v) { var A = window.DS.audio; if (!A) return; A[k] = Math.round(D.clamp(v, 0, 1) * 10) / 10; A.setVolumes(); }
  // the hero whose turn it is, for EQUIP (a guest's gear is its own)
  function gearHero(B) { var u = B && B.req && B.req.turn; return u && u.side === 'party' && !u.guest && u.src ? u : null; }
  function menuItems(B) {
    var g = gearHero(B), eq = g ? [['equip', 'EQUIP: ' + g.name.toUpperCase()]] : [], story = !!(B && B.o.embed);
    // inside the 8-bit game the fight is the story's: no restart, no ladder, no way round it (the party, the menu's style and
    // the volumes stay). THE GATE (the sprites) is gone from the menu (Griz 09-28); ?gate still opens it
    return [['resume', 'RESUME']].concat(eq, [['party', 'PARTY'], ['style', 'MENU: ' + UI.opts.style.toUpperCase() + '  < >'], ['auto', 'AUTO END TURN: ' + (UI.opts.autoEnd ? 'ON' : 'OFF')],
      ['music', 'MUSIC: ' + pct(vol('musicVol')) + '  < >'], ['sounds', 'SOUNDS: ' + pct(vol('sfxVol')) + '  < >']],
      story ? [] : [['restart', 'RESTART THE FIGHT']],
      story || (B && B.o.onDone) ? [] : [['ladder', 'THE LADDER']],
      story ? [] : [['out', UI.backLabel()]]);
  }
  // EQUIP's panel: the weapons in the pack this hero can use, and the shield off or on; each costs the action
  function gearInput(B) {
    var M = B.menu, u = gearHero(B), opts = u ? B.gearOptions(u) : [], n = opts.length;
    if (I.pressed('b') || I.pressed('menu') || !u) { D.sfx('cancel'); M.panel = null; return; }
    if (!n) { if (I.pressed('a') || I.mouse.click) { D.sfx('cancel'); M.panel = null; } return; }
    var s0 = M.gsel = D.clamp(M.gsel || 0, 0, n - 1);
    if (I.repeat('up')) M.gsel = (M.gsel + n - 1) % n;
    if (I.repeat('down')) M.gsel = (M.gsel + 1) % n;
    if (M.gsel !== s0) D.sfx('cursor');
    var pick = I.pressed('a') ? M.gsel : -1;
    if (I.mouse.click && B.gearRects) B.gearRects.forEach(function (r, i) { if (hit(r)) pick = i; });
    if (I.mouse.moved && B.gearRects) B.gearRects.forEach(function (r, i) { if (hit(r)) M.gsel = i; });
    if (pick < 0) return;
    M.gsel = pick;
    var o = opts[pick];
    if (!o.ok) { D.sfx('error'); B.card(['{o}' + o.label + ': ' + o.why + '.{/}'], 120); return; }
    B.swapGear(u, o);
    B.menu = null; // back to the turn
  }
  UI.backLabel = function () { var B = D.battle; return B && B.o.onDone ? (B.o.climb ? 'BACK TO THE CLIMB' : 'BACK TO THE LADDER') : 'RETURN TO SILVERTON'; };
  UI.menuInput = function (B) {
    var M = B.menu, items = menuItems(B), n = items.length, s0 = M.sel;
    if (M.panel === 'equip') return gearInput(B);
    if (M.panel) { if (I.pressed('a') || I.pressed('b') || I.pressed('menu') || I.mouse.click) { D.sfx('cancel'); M.panel = null; } return; }
    if (I.repeat('up')) M.sel = (M.sel + n - 1) % n;
    if (I.repeat('down')) M.sel = (M.sel + 1) % n;
    if (M.sel !== s0) D.sfx('cursor');
    var styles = ['ring', 'window'], si = styles.indexOf(UI.opts.style), here = items[M.sel][0], lr = I.repeat('left') ? -1 : I.repeat('right') ? 1 : 0;
    if (here === 'style' && lr) { UI.opts.style = styles[(si + 1) % 2]; UI.saveOpts(); restyle(B); D.sfx('cursor'); return; }
    if ((here === 'music' || here === 'sounds') && lr) { setVol(here === 'music' ? 'musicVol' : 'sfxVol', vol(here === 'music' ? 'musicVol' : 'sfxVol') + lr * 0.1); D.sfx('cursor'); return; }
    var pick = I.pressed('a') ? M.sel : -1;
    if (I.mouse.click && B.menuRects) B.menuRects.forEach(function (r, i) { if (hit(r)) pick = i; });
    if (I.pressed('b') || I.pressed('menu')) { D.sfx('cancel'); B.menu = null; return; }
    if (pick < 0) return;
    M.sel = pick;
    var id = items[pick][0];
    D.sfx('confirm');
    if (id === 'resume') B.menu = null;
    if (id === 'party') M.panel = 'party';
    if (id === 'equip') { M.panel = 'equip'; M.gsel = 0; }
    if (id === 'style') { UI.opts.style = styles[(si + 1) % 2]; UI.saveOpts(); restyle(B); }
    if (id === 'auto') { UI.opts.autoEnd = !UI.opts.autoEnd; UI.saveOpts(); }
    if (id === 'music') setVol('musicVol', vol('musicVol') > 0 ? 0 : 0.5); // E: off, or back on
    if (id === 'sounds') setVol('sfxVol', vol('sfxVol') > 0 ? 0 : 0.7);
    if (id === 'restart') { D.pop(); D.push(new D.Battle(B.o)); }
    if (id === 'ladder') location.search = '?ladder';
    if (id === 'out') { if (B.o.onDone) { D.pop(); B.o.onDone(null); } else location.href = '../'; } // the ladder, or back to the 8-bit game: nothing is written
  };
  function restyle(B) { if (B.req && B.req.turn && (B.tool === 'move' || B.tool === 'menu')) B.tool = rest(); }
  UI.resultInput = function (B) {
    UI.camera(B);
    if (I.pressed('a') || (I.mouse.click && !overUI(B))) {
      D.sfx('confirm');
      if (B.o.onDone) { D.pop(); B.o.onDone(B.result); return; } // back to the ladder with the result
      D.pop(); D.push(new D.Battle(B.o));
    }
  };

  // ------------------------------------------------------------------ drawing
  UI.drawBattle = function (ctx, B) {
    var req = B.req, hero = req && req.turn, objs = [];
    B.uiRects = []; B.buttons = [];
    // the world at 1:1 into its own canvas, W/zoom wide, then onto the screen at the zoom (crisp where the backing
    // scale times the zoom is whole); menus, cards and the floating numbers go on top at full size
    var z = D.iso.zoom, vw = Math.ceil(D.W / z), vh = Math.ceil(D.H / z), wc = worldCanvas(vw, vh), wx = wc.getContext('2d');
    wx.fillStyle = '#000'; wx.fillRect(0, 0, vw, vh);
    D.iso.inWorld = true; // (before the figures are placed: their positions are the world canvas's)
    try {
      B.units.forEach(function (u) { var o = unitObj(B, u); if (o) objs.push(o); });
      D.light.props(B).forEach(function (o) { objs.push(o); }); // a torch on the floor, dancing lights, a daylight set at a point
      // riders: a big one (a horse, foot [2, 1]) stands at the middle of its squares; a startle (r.anim) plays once, then idle
      (B.riders || []).forEach(function (r) {
        var f = r.foot || [1, 1], c = D.iso.center(r.x + (f[0] - 1) / 2, r.y + (f[1] - 1) / 2, r.gz), s = D.iso.toScreen(c.x, c.y);
        objs.push({ depth: r.x + r.y + (f[0] - 1) + (f[1] - 1) + 0.6, gz: r.gz, draw: function (ctx) {
          var a = r.anim && r.anim !== 'idle' && D.spr.anim(r.sheet, r.anim) && B.t - r.animT <= D.spr.duration(r.sheet, r.anim) + 6 ? r.anim : 'idle';
          if (f[0] > 1 || f[1] > 1) { ctx.fillStyle = 'rgba(10,8,16,.38)'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 20, 7, 0, 0, 7); ctx.fill(); }
          D.spr.draw(ctx, r.sheet, a, r.facing, a === 'idle' ? B.t + r.x * 7 + r.y * 13 : B.t - r.animT, s.x, s.y, a === 'idle' ? {} : { once: true });
        } });
      });
      FX.list.forEach(function (f) { if (!f.screen) objs.push({ depth: 1e6, gz: 0, draw: function (c) { f.draw(c); } }); });
      DEFER = objs; WCTX = wx;
      D.iso.draw(wx, objs, function (c) { overlay(c, B, hero); });
      if (B.dark) D.light.pass(wx, B, vw, vh); // torchdark: the light pass over the world (the player sees it all, dimmed where the four can't)
    } finally { D.iso.inWorld = false; DEFER = null; WCTX = null; }
    var dev = z * D.R;
    ctx.imageSmoothingEnabled = Math.abs(dev - Math.round(dev)) > 1e-6;
    var shk = B.shakeT > 0 && (B.shakeT % 10) < 4; // (the roost coming down: a shake every ten frames, as the 8-bit's swarm)
    ctx.drawImage(wc, 0, 0, vw, vh, shk ? Math.round((Math.random() - 0.5) * 6) : 0, shk ? Math.round((Math.random() - 0.5) * 4) : 0, vw * z, vh * z);
    ctx.imageSmoothingEnabled = false;
    FX.list.forEach(function (f) { if (f.screen) f.draw(ctx); });
    strip(ctx, B);
    cards(ctx, B);
    tooltip(ctx, B, hero);
    bar(ctx, B, hero);
    if (hero && UI.opts.style === 'window') cmdWindow(ctx, B, hero);
    if (hero && UI.opts.style === 'ring') cmdRing(ctx, B, hero);
    if (hero && B.tool === 'spell' && B.spell && B.spell.g.shape === 'allies' && B.picks.length) castButton(ctx, B);
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
    if (u.left) return null; // out of the fight, the way they came in
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
        if ((B.darks || []).length && D.magic.inDark(B, u)) o.alpha = u.side === 'foe' ? 0.2 : 0.5; // (inside the darkness: a shape, if that)
        // in the dark where no one of the party sees (torchdark 09-28): the player sees it still, grey and faint; by darkvision, grey
        if (B.dark && u.side === 'foe' && !down && !u.flash) { var ps = D.light.partySees(B, u); if (ps < 2) { o.alpha = Math.min(o.alpha == null ? 1 : o.alpha, ps === 1 ? 0.85 : 0.6); o.tint = R('stone', 3); o.tintAlpha = ps === 1 ? 0.3 : 0.5; } }
        if (u.flash > 0) { o.tint = R('bone', 2); o.tintAlpha = 0.85; }
        else if (u.conds.faerie && !down && !u.ethereal) { o.tint = R('violet', 5); o.tintAlpha = 0.25 + 0.15 * Math.sin(B.t / 7); }
        else if (u.conds.paralyzed || u.conds.stunned) { o.tint = R('violet', 4); o.tintAlpha = 0.35; }
        else if (u.conds.restrained) { o.tint = R('bone', 1); o.tintAlpha = 0.3; }
        if (!u.ethereal && !(u.dead && !has('hurt'))) {
          var s = u.size || 1;
          ctx.fillStyle = 'rgba(10,8,16,.38)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 10 * s + 1, 4 * s + 1, 0, 0, 7); ctx.fill();
        }
        // a rider's body (the drider's spider half) goes dark unless something else tints it; the rider on top
        var body = u.rider && !o.tint ? Object.assign({}, o, { tint: R('outline', 0), tintAlpha: 0.5 }) : o;
        D.spr.draw(ctx, u.sheet, anim === 'hurt' && !has('hurt') ? 'idle' : anim, u.facing || 0, t, p.x, p.y, body);
        if (u.rider && !down) D.spr.drawRider(ctx, u, anim, t, p.x, p.y, o);
        if (!u.dead && !u.ethereal) {
          var top = D.spr.unitTop(u), w = u.size > 1 ? 30 : 20, bx = p.x - w / 2, by = p.y - top - 5;
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
    else fn(WCTX || D.ctx);
  }
  function fillSq(ctx, x, y, color, alpha, inset) { onSq(x, y, function (c) { D.iso.rhombus(c, x, y, G.map.gz(x, y), inset || 1); c.globalAlpha = alpha; c.fillStyle = color; c.fill(); c.globalAlpha = 1; }); }
  function lineSq(ctx, x, y, color, alpha, inset) { onSq(x, y, function (c) { D.iso.rhombus(c, x, y, G.map.gz(x, y), inset == null ? 2 : inset); c.globalAlpha = alpha == null ? 1 : alpha; c.strokeStyle = color; c.lineWidth = 1; c.stroke(); c.globalAlpha = 1; }); }
  function dotSq(x, y, color) { onSq(x, y, function (c) { var p = D.iso.center(x, y, G.map.gz(x, y)), s = D.iso.toScreen(p.x, p.y); c.fillStyle = color; c.fillRect(s.x - 1, s.y - 1, 2, 2); }); }
  function overlay(ctx, B, u) {
    // the aura of protection round a standing paladin: a dashed gold circle, 10 ft (Griz, 09-27: "auras as circles centered
    // on him"). Its radius, 2.9 squares, takes in the centre of every square within 10 ft -- the 5x5 block the rules
    // count, corners too -- and none past it; the cursor inside says what it is
    B.units.forEach(function (p) {
      if (p.cls !== 'paladin' || p.lvl < 6 || !G.standing(p) || !RU.canAct(p)) return;
      var q = unitPos(B, p), r = 2.9 * Math.SQRT2;
      ctx.save(); ctx.beginPath(); ctx.ellipse(q.x, q.y, r * D.iso.TW / 2, r * D.iso.TH / 2, 0, 0, Math.PI * 2);
      ctx.globalAlpha = 0.06; ctx.fillStyle = R('gold', 3); ctx.fill();
      ctx.globalAlpha = 0.75; ctx.strokeStyle = R('gold', 3); ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.stroke();
      ctx.restore();
    });
    // a web on the floor
    (B.webs || []).forEach(function (wb) { wb.sq.forEach(function (q) { fillSq(ctx, q[0], q[1], R('bone', 1), 0.22, 3); }); });
    // magical darkness, and the clouds that are heavily obscured like it: fog (pale), a stinking cloud (yellow-green), sleet (cold)
    (B.darks || []).forEach(function (dk) {
      var k = dk.kind || 'darkness', col = k === 'fog' ? R('silver', 5) : k === 'stink' ? R('moss', 2) : k === 'sleet' ? R('glow', 1) : '#040308', a = k === 'darkness' ? 0.86 : k === 'sleet' ? 0.4 : 0.5;
      D.magic.darkSq(B, dk).forEach(function (q) { fillSq(ctx, q[0], q[1], col, a); });
    });
    // a torch's throw: the squares within 20 ft it may land on
    if (u && B.tool === 'torch') for (var ty = u.y - 4; ty <= u.y + 4; ty++) for (var tx = u.x - 4; tx <= u.x + 4; tx++) if (UI.throwSq(u, tx, ty)) lineSq(ctx, tx, ty, R('gold', 3), 0.5, 4);
    if (B.active && !B.active.ethereal) G.foot(B.active).forEach(function (q) { lineSq(ctx, q[0], q[1], R('gold', 4), 0.9, 3); });
    if (!u) return;
    var T = u.turn, tool = B.tool, cx = B.cursor.x, cy = B.cursor.y;
    if (tool === 'move' || tool === 'menu' || tool === 'attack') {
      var rc = reachCache(B, u);
      if (rc.dash) Object.keys(rc.dash).forEach(function (k) { var e = rc.dash[k]; if (e.stand && !rc.move[k]) fillSq(ctx, e.x, e.y, R('glow', 1), 0.07); });
      Object.keys(rc.move).forEach(function (k) { var e = rc.move[k]; if (e.stand && e.cost > 0) fillSq(ctx, e.x, e.y, R('glow', 1), 0.17); });
      // a rogue's places to try hiding (no foe she knows of sees her there plainly): always, as she moves (Griz, 09-27)
      // the ways out: a pale marker on each (set design, 09-27)
      (B.exits || []).forEach(function (q) { lineSq(ctx, q[0], q[1], R('moss', 2), 0.35); });
      if (u.cls === 'rogue') { var hs = hideSpots(B, u); Object.keys(hs).forEach(function (k) { if (!hs[k]) return; var q = k.split(','); fillSq(ctx, +q[0], +q[1], R('violet', 3), 0.42, 5); }); }
      if (T.attacksLeft || T.action) B.units.forEach(function (w) {
        if (!G.hostile(u, w) || !G.standing(w) || !B.canHit(u, w)) return;
        G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], R('red', 4), 0.9); });
      });
      // flanking: a gold gem on each square (her own included) where she'd flank a foe with an ally across it (Griz, 09-27)
      var fs = flankSpots(B, u);
      Object.keys(fs).forEach(function (k) { var q = k.split(','); fillSq(ctx, +q[0], +q[1], R('gold', 4), 0.8, 11); });
      var e2 = rc.move[cx + ',' + cy] || (rc.dash && rc.dash[cx + ',' + cy]);
      if (e2 && e2.stand && !G.occupant(cx, cy, u)) (G.path(rc.dash && rc.dash[cx + ',' + cy] && !rc.move[cx + ',' + cy] ? rc.dash : rc.move, cx, cy) || []).forEach(function (q) { dotSq(q[0], q[1], R('bone', 2)); });
      // on a gem: the ally across the foe lit hard, and the line through the foe between them
      (fs[cx + ',' + cy] || []).forEach(function (fe) {
        G.foot(fe.ally).forEach(function (q) { lineSq(ctx, q[0], q[1], R('gold', 4), 1, 1); });
        G.foot(fe.foe).forEach(function (q) { lineSq(ctx, q[0], q[1], R('gold', 3), 0.9, 4); });
        var p0 = D.iso.center(cx, cy, G.map.gz(cx, cy)), s0 = D.iso.toScreen(p0.x, p0.y), a1 = UI.unitPos(B, fe.ally);
        DEFER.push({ depth: 1e6, gz: 0, draw: function (c) { // over the figures, so the foe between doesn't hide it
          c.strokeStyle = R('gold', 4); c.globalAlpha = 0.85; c.setLineDash([3, 3]);
          c.beginPath(); c.moveTo(s0.x, s0.y - 2); c.lineTo(a1.x, a1.y - 2); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
        } });
      });
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
      if (g.shape === 'sphere' || g.shape === 'cube' || g.shape === 'cone' || g.shape === 'line' || g.shape === 'wave') {
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
        var bits = [d + ' ft' + (!sp && B.canHit(u, w) ? (u.weapon && u.weapon.ranged ? ' {n}in range{/}' : ' {n}in reach{/}') : '')];
        if (!l.clear) bits.push('{o}no line{/}');
        else if (l.cover && d > 5) bits.push('{c}half cover (+2): ' + l.why + '{/}');
        if (e.adv.length) bits.push('{n}adv: ' + e.adv.join(', ') + '{/}');
        if (e.dis.length) bits.push('{o}dis: ' + e.dis.join(', ') + '{/}');
        if (e.pen) bits.push('{o}' + e.penWhy + ' ' + e.pen + '{/}');
        lines.push(bits.join('  '));
        // who sees whom (torchdark): what the hero can't see, and what can't see him
        var s1 = D.magic.seeWhy(B, u, w), s2 = D.magic.seeWhy(B, w, u), sb = [];
        if (!s1.ok) sb.push('{o}unseen by ' + u.name + ': ' + s1.why + '{/}'); else if (s1.dv) sb.push('{c}seen by darkvision{/}');
        if (!s2.ok) sb.push('{n}it cannot see ' + u.name + ': ' + s2.why + '{/}');
        if (sb.length) lines.push(sb.join('  '));
      }
    } else if (u && (B.tool === 'move' || B.tool === 'menu' || B.tool === 'attack')) {
      var k = B.cursor.x + ',' + B.cursor.y;
      if (B.dark) { var lv = D.light.levelAt(B, B.cursor.x, B.cursor.y), ps = D.light.partySeesSq(B, B.cursor.x, B.cursor.y); lines.push('{g}' + D.light.name(lv) + ' here' + (lv === 0 ? (ps === 1 ? ' (one of yours sees it by darkvision)' : ' (no one of yours sees it)') : '') + '{/}'); }
      B.units.forEach(function (p) {
        if (p.cls !== 'paladin' || p.lvl < 6 || !G.standing(p) || !RU.canAct(p) || Math.max(Math.abs(B.cursor.x - p.x), Math.abs(B.cursor.y - p.y)) > 2) return;
        lines.push('{y}' + p.name + '\'s aura{/}: allies here add +' + Math.max(1, D.mod(p.abil.cha)) + ' to saving throws');
      });
      (flankSpots(B, u)[k] || []).forEach(function (fe) { lines.push('{y}flanking{/} the ' + B.shortName(fe.foe) + ' with ' + fe.ally.name + ': advantage in melee, both'); });
      if (u.cls === 'rogue') {
        var hs = hideSpots(B, u);
        if (hs[k] === true) lines.push('{p}a place to try hiding{/}: no foe she knows of sees it plainly');
        else if (hs[k] === false) lines.push('{g}in plain sight of a foe here{/}');
      }
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
    if (w.conds.blinded) c.push('{o}blinded{/}');
    if (w.conds.dodge) c.push('{c}dodging{/}');
    if (w.conds.ablaze) c.push('{o}blade ablaze{/}');
    if (w.torch) c.push('{o}torch in hand{/}');
    if (w.conds.light) c.push('{y}light{/}');
    if (w.conds.daylight) c.push('{y}daylight{/}');
    if (w.conds.continualFlame) c.push('{o}continual flame{/}');
    if (w.conds.darkvision) c.push('{c}darkvision{/}');
    if (w.conds.seeInvisible) c.push('{c}sees the invisible{/}');
    if (w.conds.truesight) c.push('{c}truesight{/}');
    if (w.conds.pwt) c.push('{c}veiled{/}');
    if (w.displacement) c.push(w.conds.displaceOff ? '{g}displacement (next turn){/}' : '{c}displaced{/}');
    if (w.conds.shield) c.push('{c}shield{/}');
    if (w.conds.shieldOfFaith) c.push('{c}faith +2{/}');
    if (w.conds.blessed) c.push('{y}blessed{/}');
    if (w.conds.stoneskin) c.push('{c}stoneskin{/}');
    if (w.conds.heroism) c.push('{y}heroism{/}');
    if (w.conds.divineFavor) c.push('{y}favor{/}');
    if (w.conds.sacred) c.push('{y}sacred +' + w.conds.sacred.atk + '{/}');
    if (w.conds.helped) c.push('{w}helped{/}');
    if (w.conds.restrained) c.push(w.conds.restrained.grapple ? '{w}held{/}' : '{w}webbed{/}');
    if (w.conds.stunned) c.push('{p}stunned{/}');
    if (w.conds.prone) c.push('{o}prone{/}');
    if (w.swarm) c.push('{g}swarm{/}');
    if (w.conds.paralyzed) c.push('{p}held{/}');
    if (w.conds.asleep) c.push('{p}asleep{/}');
    if (w.conc) c.push('{y}conc: ' + w.conc.name + '{/}');
    if (w.hp <= 0 && !w.dead) c.push('{r}down{/}');
    return c.length ? '  ' + c.join(' ') : '';
  }

  // ------------------------------------------------------------------ the bottom bar: portrait, HP, BARM, the keys, END TURN
  function bar(ctx, B, hero) {
    var u = hero || B.active, st = UI.opts.style;
    ctx.fillStyle = 'rgba(10,8,16,.9)'; ctx.fillRect(0, BAR_Y, D.W, D.H - BAR_Y);
    ctx.fillStyle = R('silver', 2); ctx.fillRect(0, BAR_Y, D.W, 1);
    if (!u) return;
    ctx.fillStyle = R('stone', 1); ctx.fillRect(4, BAR_Y + 4, 36, 38);
    ctx.save(); ctx.beginPath(); ctx.rect(4, BAR_Y + 4, 36, 38); ctx.clip();
    var face = u.rider || u.sheet, top = D.spr.top(face); // (a drider's portrait is its rider's face)
    D.spr.draw(ctx, face, 'idle', 0, B.t, 22, BAR_Y + 6 + Math.min(top, u.size > 1 && !u.rider ? 30 : 44), { alpha: u.ethereal ? 0.3 : 1 });
    ctx.restore();
    ctx.strokeStyle = u.side === 'foe' ? R('red', 3) : R('gold', 3); ctx.strokeRect(4.5, BAR_Y + 4.5, 35, 37);
    var cl = u.side === 'foe' ? 'foe' : (u.cls + ' ' + u.lvl), clx = 44 + D.textWidth(u.name) + 6;
    D.text(ctx, u.name, 44, BAR_Y + 4, u.side === 'foe' ? R('red', 4) : R('gold', 4));
    D.text(ctx, cl, clx, BAR_Y + 4, R('accent', 2));
    ctx.fillStyle = R('stone', 1); ctx.fillRect(44, BAR_Y + 15, 100, 4);
    ctx.fillStyle = u.side === 'foe' ? R('red', 3) : R('moss', 2); ctx.fillRect(44, BAR_Y + 15, Math.round(100 * Math.max(0, u.hp) / u.maxhp), 4);
    D.text(ctx, 'HP ' + u.hp + '/' + u.maxhp + (u.temp ? ' +' + u.temp : '') + '   AC ' + RU.ac(u), 44, BAR_Y + 21, R('bone', 1));
    ctx.save(); ctx.beginPath(); ctx.rect(44, BAR_Y + 29, BX - 48, 12); ctx.clip(); // a long line of conditions stops short of the keys
    D.text(ctx, conds(u).trim() || (u.slots && u.slots.length ? 'slots ' + u.slots.map(function (n, i) { return (i + 1) + ':' + n; }).join(' ') : ''), 44, BAR_Y + 31, R('accent', 2));
    ctx.restore();
    if (!hero) { D.text(ctx, u.ethereal ? 'moving unseen...' : 'its turn', BX, BAR_Y + 16, R('accent', 2)); return; }
    var T = u.turn, px = clx + D.textWidth(cl) + 6;
    // BARM: bonus, action, reaction, move (the feet left) -- lit while there's one to spend (Griz, 09-27: "BARM #" after the class)
    [['B', T.bonus > 0, R('glow', 2)], ['A', T.action > 0 || T.attacksLeft > 0, R('gold', 3)], ['R', u.reaction > 0, R('violet', 4)], ['M ' + T.move, T.move > 0, R('glow', 1)]]
      .forEach(function (p) { px += pip(ctx, px, BAR_Y + 2, p[0], p[1], p[2]) + 2; });
    // END TURN in the bottom-right corner
    var eb = { x: BX + 3 * BP, y: BAR_Y + 30, w: BP - 2, h: 11, end: true };
    B.buttons.push(eb);
    ctx.fillStyle = B.hoverBtn === B.buttons.length - 1 ? R('stone', 3) : R('stone', 1); ctx.fillRect(eb.x, eb.y, eb.w, eb.h);
    ctx.strokeStyle = R('silver', 3); ctx.strokeRect(eb.x + 0.5, eb.y + 0.5, eb.w - 1, eb.h - 1);
    D.text(ctx, 'END TURN', eb.x + eb.w / 2, eb.y + 2, R('bone', 1), 'center');
    var spellRing = B.list && B.list.kind === 'spells';
    D.text(ctx, st === 'window' ? (B.tool === 'menu' ? 'up/down, E: choose   X: menu' : 'E: here   X: back to the commands') : spellRing ? 'left/right turns the ring, up/down the slot, E: choose' : B.tool === 'menu' || B.list ? 'left/right turns the ring, E: choose   X: close' : B.tool === 'move' ? 'X, Q or E on yourself: the ring   M: menu' : 'E: here   X: back', BX, BAR_Y + 6, R('accent', 2));
    D.text(ctx, 'C recentre  M menu  wheel or -/= zoom', BX, BAR_Y + 18, R('stone', 5));
  }
  function pip(ctx, x, y, label, lit, col) { // a small lit box round a letter; gives back its width
    var w = D.textWidth(label) + 3;
    ctx.fillStyle = lit ? col : R('stone', 1); ctx.fillRect(x, y, w, 10);
    if (lit) window.DS.text(ctx, label, x + 2, y + 2, R('outline', 0)); // dark on a lit box: no drop shadow, it smears
    else D.text(ctx, label, x + 2, y + 2, R('stone', 4));
    return w;
  }
  function costTag(c) { return c === 'A' ? '{y}A{/}' : c === 'B' ? '{c}B{/}' : c === 'M' ? '{c}M{/}' : ''; }
  function slotText(e) { return e.kind !== 'spell' ? 'x' + e.n : e.level ? 'L' + e.slot + (e.levels.length > 1 ? ' <>' : '') : 'cantrip'; }

  // a list (spells, items) as a popup: the BAR style's, and the WINDOW style's second window
  function listPopup(ctx, B, u, x, yBottom, w, win) {
    var L = B.list, rows = L.items, vis = Math.min(rows.length, 10), start = D.clamp(L.sel - 5, 0, Math.max(0, rows.length - vis));
    var h = vis * 11 + 26, y = yBottom - h;   // the rows, then the summary line clear of the last one
    win ? winBox(ctx, x, y, w, h) : box(ctx, x, y, w, h, R('glow', 1));
    B.uiRects.push({ x: x, y: y, w: w, h: h });
    D.text(ctx, L.kind === 'spells' ? (L.title || 'SPELLS') + (u.slots.length ? '   slots ' + u.slots.map(function (n, i) { return (i + 1) + ':' + n; }).join(' ') : '') : L.kind === 'items' ? 'ITEMS (an action)' : (L.title || ''), x + 6, y + 4, R('gold', 4));
    for (var k = 0; k < vis; k++) {
      var i = start + k, e = rows[i], r = { x: x + 3, y: y + 14 + k * 11, w: w - 6, h: 11, list: i };
      B.buttons.push(r);
      if (i === L.sel) { ctx.fillStyle = win ? R('blue', 2) : R('stone', 3); ctx.fillRect(r.x, r.y, r.w, r.h); if (win) hand(ctx, r.x - 10, r.y + 1); }
      D.text(ctx, (k + 1) + ' ' + e.name, r.x + 3, r.y + 2, e.ok ? R('bone', 2) : R('stone', 4));
      D.text(ctx, e.kind === 'cmd' ? costTag(e.cost) : slotText(e) + (e.g ? '  ' + costTag(e.g.time) : ''), r.x + r.w - 3, r.y + 2, e.ok ? R('silver', 5) : R('stone', 4), 'right');
    }
    var cur = rows[L.sel];
    var sy = y + h - 10;
    if (cur && !cur.ok && cur.why) D.text(ctx, '{g}' + cur.why + '{/}', x + 6, sy, R('accent', 2));
    else if (cur && cur.sp) D.text(ctx, '{g}' + D.magic.summary(cur, u) + '{/}', x + 6, sy, R('accent', 2));
    else if (cur && cur.note) D.text(ctx, '{g}' + cur.note + '{/}', x + 6, sy, R('accent', 2));
    else if (cur && cur.use) D.text(ctx, '{g}' + ({ heal: cur.use.dice + ' healing, touch', revive: 'a fallen ally beside you, up on 1 HP', antitoxin: 'ends poison, touch', cure: 'ends poison, touch', damage: 'thrown, 20 ft: DEX DC ' + (cur.use.dc || 10) + ' or ' + cur.use.dice + ' fire', light: 'a torch, lit: bright 20 ft, dim 20 more; it takes a hand' }[cur.use.effect] || '') + '{/}', x + 6, sy, R('accent', 2));
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
  function castButton(ctx, B) {
    var S = B.spell, label = 'CAST ' + S.name.toUpperCase() + ': ' + B.picks.map(function (p) { return p.name; }).join(', ') + '  (E)', w = D.textWidth(label) + 14, r = { x: Math.round((D.W - w) / 2), y: BAR_Y - 20, w: w, h: 14, cast: true };
    B.buttons.push(r); B.uiRects.push(r);
    var hov = B.buttons[B.hoverBtn] === r || hit(r);
    ctx.fillStyle = hov ? R('gold', 2) : R('gold', 1); ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = R('gold', 4); ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    D.text(ctx, label, r.x + 7, r.y + 3, R('gold', 4));
  }
  function cmdRing(ctx, B, u) {
    if (B.tool !== 'menu' && !B.list) return;
    var cmds = B.list ? B.list.items : UI.cmds(B, u), n = cmds.length, sel = B.list ? B.list.sel : B.cmdSel;
    if (!n) return;
    // wider than it was (Griz, 09-27), and round the hero's middle at any zoom
    var p = UI.unitPos(B, u), cx = p.x, cy = Math.round(p.y - 26 * D.iso.zoom), rx = Math.max(52, n * 7), ry = Math.max(28, n * 3.5);
    // turn the ring smoothly toward the chosen icon (the chosen one sits at the front, at the bottom);
    // each ring keeps its own turn, so X from a level's spells comes back to the levels as they were
    var spells = B.list && B.list.kind === 'spells', target = -sel * (Math.PI * 2 / n), key = !B.list ? 'ringA' : spells ? 'ringC' : 'ringB';
    if (B[key] == null) B[key] = target;
    var dA = target - B[key]; while (dA > Math.PI) dA -= Math.PI * 2; while (dA < -Math.PI) dA += Math.PI * 2;
    if (!B.ringStill) B[key] += dA * 0.35; // (still while the mouse picks: it points where the icon is -- Griz, 09-27)
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
      if (o.c.kind === 'level') D.text(ctx, o.c.level ? String(o.c.level) : 'C', bx + 6 * s, by + 3 * s, R('outline', 0), 'center');
      // a level's stars share colours by element, so the ones behind wear their initials (Shield of Faith: SF);
      // the one at the front is named in full below the ring
      if (o.c.kind === 'spell' && !front) D.text(ctx, initials(o.c.name), bx + 6, by + 6, o.c.ok ? R('bone', 2) : R('stone', 4), 'center');
    });
    if (B.list && B.list.title) { var tt = B.list.title, tw2 = D.textWidth(tt) + 10; box(ctx, Math.round(cx - tw2 / 2), Math.round(cy - ry - 30), tw2, 12, R('glow', 1)); D.text(ctx, tt, cx, Math.round(cy - ry - 28), R('gold', 4), 'center'); }
    var cur = cmds[sel], label = (cur.label || cur.name) + (cur.kind === 'item' ? '  ' + slotText(cur) : cur.kind === 'spell' && cur.level ? '  L' + cur.slot + (cur.levels.length > 1 ? ' ^v' : '') : '') + (cur.cost ? '  ' + costTag(cur.cost) : cur.g ? '  ' + costTag(cur.g.time) : '');
    var lw = D.textWidth(label) + 10, ly = cy + ry + 16;
    box(ctx, Math.round(cx - lw / 2), ly, lw, 12, R('gold', 3));
    D.text(ctx, label, cx, ly + 2, cur.ok ? R('bone', 2) : R('stone', 4), 'center');
    var sub = !cur.ok && cur.why ? cur.why : cur.kind === 'spell' ? D.magic.summary(cur, u) : cur.note || '';
    if (sub) { var ww = D.textWidth(sub) + 8; box(ctx, Math.round(cx - ww / 2), ly + 13, ww, 11, R('stone', 3)); D.text(ctx, '{g}' + sub + '{/}', cx, ly + 15, R('accent', 2), 'center'); }
  }
  function initials(name) { var w = name.split(' ').filter(function (x) { return !/^(of|the)$/i.test(x); }); return w.length > 1 ? w.map(function (x) { return x[0]; }).join('').slice(0, 2) : name.slice(0, 2); }

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
    var F = B.fight;
    ctx.save(); ctx.translate(D.W / 2, 92); ctx.scale(2, 2); D.text(ctx, (F.name || B.map.def.name).toUpperCase(), 0, 0, R('gold', 4), 'center'); ctx.restore();
    D.text(ctx, F.sub || B.map.def.sub, D.W / 2, 116, R('silver', 5), 'center');
    if (from.from === 'the ladder') D.text(ctx, names.join(', ') + ' at level ' + F.level + ': the ladder.', D.W / 2, 136, R('bone', 1), 'center');
    else if (B.o.embed) D.text(ctx, names.join(', ') + (B.reserve.length ? ', alone in the yard. The others are on their way out of the inn.' : '.'), D.W / 2, 136, R('bone', 1), 'center');
    else D.text(ctx, names.join(', ') + ' come in from ' + (from.from === 'the fixture' ? (B.o.fixture ? 'the fixture' : 'the fixture (no 8-bit save found)') : from.from + (ago ? ', saved ' + (ago < 120 ? ago + ' min' : Math.round(ago / 60) + ' h') + ' ago' : '')) + '.', D.W / 2, 136, R('bone', 1), 'center');
    var lv = B.units.filter(function (u) { return u.side === 'party'; }).map(function (u) { return u.lvl; });
    D.text(ctx, 'Level ' + (Math.min.apply(null, lv) === Math.max.apply(null, lv) ? lv[0] : Math.min.apply(null, lv) + '-' + Math.max.apply(null, lv)) + '.  ' + (B.intro || ''), D.W / 2, 150, R('accent', 2), 'center');
    if (B.canSwap) D.text(ctx, B.o.fixture ? '2: walk in from the 8-bit save instead' : '2: walk in as the fixture instead (the four at level 9; the fight is built for them)', D.W / 2, 164, R('silver', 5), 'center');
    D.text(ctx, 'menu: ' + UI.opts.style.toUpperCase() + (UI.opts.style === 'ring' ? ' (M or Tab, then MENU)' : ' (M or X/Esc, then MENU)'), D.W / 2, 194, R('stone', 5), 'center');
    if (B.dark) D.text(ctx, 'DARK GROUND: the four see by their lights and darkvision. You see it all: what they cannot is grey.', D.W / 2, 208, R('fire', 1), 'center');
    if ((B.t >> 5) & 1) D.text(ctx, 'E to begin', D.W / 2, 180, R('glow', 2), 'center');
  }
  function inspect(ctx, u) {
    var lines = ['{' + (u.side === 'foe' ? 'r' : 'c') + '}' + u.name + '{/}' + (u.cls ? '  ' + u.cls + ' ' + u.lvl : ''), 'HP ' + u.hp + '/' + u.maxhp + '  AC ' + RU.ac(u) + '  speed ' + u.speed + ' ft' + (u.size > 1 ? '  Large' : '')];
    if (u.weapon) lines.push(u.weapon.name + ' ' + RU.sign(u.weapon.atk) + ', ' + u.weapon.dice + RU.sign(u.weapon.mod) + ' ' + u.weapon.type + (u.attacks > 1 ? ', x' + u.attacks : ''));
    if (u.attacks && !u.weapon) Object.keys(u.attacks).forEach(function (k) { var a = u.attacks[k]; lines.push(a.name + ' ' + RU.sign(a.atk) + ', ' + a.dice + RU.sign(a.mod) + ' ' + a.type + (a.range ? ', ' + a.range.join('/') + ' ft' : '') + (a.extra ? ' +' + a.extra + ' ' + a.extraType : '') + (a.save ? ', DC ' + a.save.dc + ' ' + a.save.ab.toUpperCase() + ' or ' + a.save.dice + ' ' + a.save.type : '') + (a.poison ? ', DC ' + a.poison.dc + ' CON or poisoned' : '') + (a.reach > 5 ? ', reach ' + a.reach + ' ft' : '') + (a.grapple ? ', grips (escape DC ' + a.grapple.dc + ')' : '')); });
    if (u.jaunt) lines.push('{p}Ethereal Jaunt{/} (bonus action): steps out of the world, and back.');
    if (u.multi > 2 && u.attacks && u.attacks.bite) lines.push('{p}Multiattack{/}: three, sword or bow; one of them may be the bite.');
    if (u.fey || u.webWalker) lines.push([u.fey ? '{p}Fey Ancestry{/}: no magical sleep' : '', u.webWalker ? '{p}Web Walker{/}: webs do not hold it' : ''].filter(Boolean).join('  '));
    if (u.faerie) lines.push('{p}Faerie Fire{/} once' + (u.faerie.used ? ' (spent)' : ''));
    // the bestiary's traits (09-27)
    if (u.web) lines.push('{p}Web{/} (recharge ' + u.web.recharge + '-6): ' + RU.sign(u.web.atk) + ', ' + u.web.range.join('/') + ' ft, restrained (escape DC ' + u.web.dc + ')' + (u.web.ready ? '' : ' {g}(spent){/}'));
    if (u.slam) lines.push('{p}Tentacle Slam{/}: what it holds, CON DC ' + u.slam.dc + ' or ' + u.slam.dice + ' and stunned');
    if (u.bound) lines.push('{p}Keeps to the water{/}: it will not leave its pool');
    if (u.packTactics) lines.push('{p}Pack Tactics{/}: advantage with an ally beside its target');
    if (u.martial) lines.push('{p}Martial Advantage{/}: +' + u.martial + ' once a turn with an ally beside its target');
    if (u.surprise) lines.push('{p}Surprise Attack{/}: +' + u.surprise + ' on the first round\'s hits');
    var dt = [u.immune ? 'immune ' + u.immune.join(', ') : '', u.resist ? 'resists ' + u.resist.join(', ') : '', u.vulnerable ? 'vulnerable ' + u.vulnerable.join(', ') : ''].filter(Boolean);
    if (dt.length) lines.push('{p}' + dt.join('  ·  ') + '{/}');
    // senses (torchdark): what it sees the dark by
    var sen = [];
    if (u.truesight) sen.push('truesight ' + u.truesight + ' ft');
    if (u.darkvision) sen.push('darkvision ' + u.darkvision + ' ft');
    if (u.blindsight) sen.push('blindsight ' + u.blindsight + ' ft' + (u.blind ? ' (blind past it)' : ''));
    if (u.devilSight) sen.push('sees through magical darkness');
    if (u.seeInvisible) sen.push('sees the invisible');
    lines.push(sen.length ? '{c}' + sen.join(', ') + '{/}' : '{g}no darkvision: it sees by light{/}');
    var c = conds(u).trim(); if (c) lines.push(c);
    var w = 0; lines.forEach(function (l) { w = Math.max(w, D.textWidth(l)); });
    box(ctx, 6, 40, w + 12, lines.length * 9 + 8, u.side === 'foe' ? R('red', 3) : R('glow', 1));
    lines.forEach(function (l, k) { D.text(ctx, l, 12, 44 + k * 9, R('bone', 1)); });
  }
  function menu(ctx, B) {
    var M = B.menu;
    if (M.panel === 'party') return party(ctx, B);
    if (M.panel === 'equip') return gear(ctx, B);
    var items = menuItems(B), w = 190, h = items.length * 13 + 12, x = (D.W - w) / 2, y = 60;
    UI.opts.style === 'window' ? winBox(ctx, x, y, w, h) : box(ctx, x, y, w, h);
    B.menuRects = [];
    items.forEach(function (it, i) {
      var r = { x: x + 6, y: y + 6 + i * 13, w: w - 12, h: 12 };
      B.menuRects.push(r);
      if (i === M.sel) { ctx.fillStyle = R('gold', 1); ctx.fillRect(r.x, r.y, r.w, r.h); }
      D.text(ctx, it[1], r.x + 6, r.y + 2, i === M.sel ? R('gold', 4) : R('bone', 1));
    });
  }
  // EQUIP: the hero's weapon and shield now, the pack's choices, each greyed with its reason when it can't be done
  function gear(ctx, B) {
    var M = B.menu, u = gearHero(B), opts = u ? B.gearOptions(u) : [], w = 300, rowH = 13, h = Math.max(1, opts.length) * rowH + 44, x = (D.W - w) / 2, y = 50;
    box(ctx, x, y, w, h, R('glow', 1));
    if (!u) return;
    D.text(ctx, 'EQUIP: ' + u.name.toUpperCase(), x + 8, y + 5, R('gold', 4));
    D.text(ctx, 'a swap costs the action  ·  X back', x + w - 8, y + 5, R('stone', 5), 'right');
    D.text(ctx, 'in hand: ' + u.weapon.name + ' ' + RU.sign(u.weapon.atk) + ', ' + u.weapon.dice + RU.sign(u.weapon.mod) + (u.weapon.ranged ? ', ' + u.weapon.range.join('/') + ' ft' : '') + '   AC ' + RU.ac(u), x + 8, y + 17, R('bone', 2));
    B.gearRects = [];
    if (!opts.length) { D.text(ctx, '{g}Nothing in the pack ' + u.name + ' can take up.{/}', x + 8, y + 31, R('bone', 1)); return; }
    opts.forEach(function (o, i) {
      var r = { x: x + 6, y: y + 29 + i * rowH, w: w - 12, h: rowH - 1 };
      B.gearRects.push(r);
      if (i === M.gsel) { ctx.fillStyle = R('gold', 1); ctx.fillRect(r.x, r.y, r.w, r.h); }
      var col = !o.ok ? R('stone', 5) : i === M.gsel ? R('gold', 4) : R('bone', 1);
      D.text(ctx, o.label, r.x + 6, r.y + 2, col);
      D.text(ctx, o.ok ? o.note : o.why, r.x + r.w - 6, r.y + 2, o.ok ? R('stone', 6) : R('stone', 5), 'right');
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
