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
    if (req.scene) { // a cutscene beat: its clip starts with it, and the beat holds at least as long as the clip runs
      var sc = req.scene; sc.t = 0;
      if (sc.clip) { var a = D.clip(sc.clip); if (a) a.addEventListener('loadedmetadata', function () { if (isFinite(a.duration)) sc.frames = Math.max(sc.frames || 0, Math.ceil(a.duration * 60) + 40); }); }
    }
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
  var SKILLS = { lay: 1, sacred: 1, secondwind: 1, surge: 1, ignite: 1, douse: 1 }, ACTIONS = { dash: 1, disengage: 1, cdash: 1, cdisengage: 1, dodge: 1, help: 1, leave: 1, droptorch: 1, throwtorch: 1, dousetorch: 1, pickuptorch: 1, hooddown: 1, hoodup: 1 };
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
  // the Channel Divinity's options, one list of their own beside SPELLS (RULED 09-30, Griz: "should the channel divinity be a button similar to
  // spells?" -- "yes"): they draw on one use (u.feats.channel), and the list says how many are left
  var CHANNEL = { sacred: 1, turnundead: 1, turnunholy: 1, preservelife: 1, doubling: 1, showing: 1, holddoor: 1 };
  UI.cmds = function (B, u) {
    var c = B.commands(u), top = {}, sk = [], ac = [], cd = [], q = quickSpell(B, u);
    // (x.skill: a class feature's button from js/features.js F.commands -- Rage, the Channel Divinities, the subclasses' own)
    c.forEach(function (x) { if (CHANNEL[x.id]) { cd.push(x); return; } if (SKILLS[x.id] || x.skill || (q && x.id === 'attack')) (SKILLS[x.id] || x.skill ? sk : ac).push(x); else if (ACTIONS[x.id]) ac.push(x); else top[x.id] = x; });
    if (q) top.attack = q;
    var out = [{ id: 'move', label: 'MOVE', cost: 'M', ok: u.turn.move > 0 && !u.conds.restrained, tool: 'move', icon: 'move' }];
    ['attack', 'hide', 'breakfree', 'spells'].forEach(function (k) { if (top[k]) out.push(top[k]); });
    if (cd.length) { var left = (u.feats && u.feats.channel) || 0; out.push({ id: 'channel', label: 'CHANNEL DIVINITY (' + left + ')', cost: 'A', ok: cd.some(function (x) { return x.ok; }), why: left ? 'nothing there to do now' : 'spent (a short rest brings it back)', sub: 'channel', icon: 'sacred', items: cd }); }
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
    if (req.scene) return sceneInput(B, req.scene);
    UI.camera(B);
    if (req.prompt) return promptInput(B, req.prompt);
    if (req.turn) return turnInput(B, req.turn);
  };
  // a cutscene beat runs its frames; after its first second E or a click moves it on
  function sceneInput(B, sc) {
    sc.t = (sc.t || 0) + 1;
    if (sc.tick) sc.tick(sc.t); // (a picture's sounds on its own frames: the landlord's clackers, js/wet.js W.SOUND)
    if (sc.t >= (sc.frames || 120) || (sc.t > 60 && (I.pressed('a') || I.pressed('end') || I.mouse.click))) B.answer();
  }
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
    if (D.iso.nudge(B.cursor, dir, G.map.w, G.map.h)) showCursor(B);
  }
  function showCursor(B) { // near the screen's edge (or off it), the view comes to the cursor
    var m = G.map, c = D.iso.center(B.cursor.x, B.cursor.y, m.gz(B.cursor.x, B.cursor.y)), s = D.iso.toScreen(c.x, c.y);
    if (s.x < 60 || s.x > D.W - 60 || s.y < 50 || s.y > BAR_Y - 30) D.iso.lookAt(B.cursor.x, B.cursor.y, m.gz(B.cursor.x, B.cursor.y));
  }
  // the pad's left stick on the grid (Griz 09-28): the cursor goes where the stick points on the screen, eight ways -- a slant
  // runs along one of the grid's axes, straight up is a diagonal step -- so a thumb needn't learn the diamond (the d-pad and
  // the arrows keep to the axes)
  var OCT = [[1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0]]; // E NE N NW W SW S SE on the screen
  function stickCursor(B) {
    var d = OCT[I.stickOct], m = G.map;
    if (!d) return;
    var x = D.clamp(B.cursor.x + d[0], 0, m.w - 1), y = D.clamp(B.cursor.y + d[1], 0, m.h - 1);
    if (x === B.cursor.x && y === B.cursor.y) return;
    B.cursor.x = x; B.cursor.y = y;
    showCursor(B);
  }
  // the figure under the mouse (its whole sprite, front-most first): clicking a body selects its owner, not the floor behind
  UI.pickUnit = function (B, mx, my) {
    var best = null, bd = -1e9, z = D.iso.zoom;
    B.units.forEach(function (u) {
      if (u.dead || u.ethereal) return;
      var p = unitPos(B, u), s = u.size || 1, top = (u.hp > 0 ? D.spr.unitTop(u) : 16) * z, hw = (s > 1 ? 30 : 11) * Math.max(1, D.spr.scaleOf(u)) * z;
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
      if (B.autoFor !== B.req) { B.autoFor = B.req; B.autoT = B.t; B.card([D.keys('{g}Nothing left to spend: the turn passes.  X holds it{/}')], 50); }
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
    // the pad (Griz 09-28): the left stick pressed in, before anything on the wheel is chosen, drops the wheel (and a list on
    // it) and the cursor is free on the grid; with no wheel up it recentres, as C does. The right stick's left/right (or a
    // bumper) calls the wheel up, and once it's up turns it (turnWheel)
    if (I.pressed('drop')) {
      if (B.list || B.tool === 'menu') { D.sfx('cancel'); B.list = null; B.tool = 'move'; B.spell = null; B.picks = []; B.clearCards(); showCursor(B); return; }
      B.focus(u);
    }
    if (!B.list && B.tool !== 'menu' && (I.pressed('wheell') || I.pressed('wheelr'))) { D.sfx('popup'); B.tool = 'menu'; B.spell = null; B.picks = []; B.clearCards(); B.ringStill = false; return; }
    // an open list (spells, items) takes the keys first
    if (B.list) return listInput(B, u);
    var cmds = UI.cmds(B, u);
    for (var k = 1; k <= 9; k++) if (I.pressed('n' + k) && cmds[k - 1]) return pickCommand(B, u, cmds[k - 1], k - 1);
    if (I.pressed('ring')) { D.sfx(B.tool === 'menu' ? 'cancel' : 'popup'); B.tool = B.tool === 'menu' ? rest() === 'menu' ? 'move' : rest() : 'menu'; B.spell = null; B.picks = []; B.clearCards(); return; }
    // the command menu at rest (window, ring)
    if (B.tool === 'menu') {
      var n = cmds.length, prev = B.cmdSel;
      if (st === 'window') { if (I.repeat('up') || turnWheel() < 0) B.cmdSel = (B.cmdSel + n - 1) % n; if (I.repeat('down') || turnWheel() > 0) B.cmdSel = (B.cmdSel + 1) % n; }
      else { if (I.repeat('left') || I.repeat('up') || turnWheel() < 0) B.cmdSel = (B.cmdSel + n - 1) % n; if (I.repeat('right') || I.repeat('down') || turnWheel() > 0) B.cmdSel = (B.cmdSel + 1) % n; }
      if (B.cmdSel !== prev) { B.clearCards(); D.sfx('cursor'); B.ringStill = false; }
      if (I.pressed('a')) return pickCommand(B, u, cmds[B.cmdSel], B.cmdSel);
      if (I.pressed('b')) { if (rest() !== 'menu') { D.sfx('cancel'); B.tool = rest(); return; } return UI.openMenu(B); } // the ring goes back down
      if (I.mouse.click && !overUI(B)) actAt(B, u, B.cursor.x, B.cursor.y);
      return;
    }
    // the grid (the left stick takes its own path, stickCursor)
    ['up', 'down', 'left', 'right'].forEach(function (k) { if (k !== I.stickWay && I.repeat(k)) moveCursor(B, k); });
    if (I.repeat('stick')) stickCursor(B);
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
  function turnWheel() { return I.repeat('wheell') ? -1 : I.repeat('wheelr') ? 1 : 0; } // the pad's right stick or bumpers, on the wheel
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
    if (c.tool) { B.tool = c.tool; B.clearCards(); if (c.tool === 'help') B.card(['{g}HELP: pick a foe beside you; the next ally to swing at it has advantage.{/}'], 200); if (c.tool === 'torch') B.card([D.keys('{g}THROW TORCH: a square within 20 ft you can see. It lands and burns there.  X back{/}')], 100000); return; }
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
    if (n && (I.repeat(nextKey[0]) || turnWheel() < 0)) L.sel = (L.sel + n - 1) % n;
    if (n && (I.repeat(nextKey[1]) || turnWheel() > 0)) L.sel = (L.sel + 1) % n;
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
    // (the bucket and a light are his own: used at once, no target to pick -- 09-30d, Griz: "bucket asks for self-or nearby target like a potion")
    if (e.kind === 'item' && (e.use.effect === 'bucket' || e.use.effect === 'light')) return UI.command(B, u, { do: 'item', id: e.id, target: u });
    if (e.kind === 'item') { B.tool = 'item'; B.itemId = e.id; B.card(['{g}' + e.name + ': ' + (e.use.effect === 'damage' ? 'throw it at a foe within 20 ft.' : e.use.effect === 'revive' ? 'a fallen ally beside you.' : 'yourself, or an ally beside you.') + '{/}'], 240); return; }
    var g = e.g, n = (g.n || 1) + Math.max(0, e.slot - e.level);
    B.spell = { id: e.id, slot: e.slot, g: g, sp: e.sp, n: n, name: e.name };
    B.picks = [];
    if (g.shape === 'self') return UI.command(B, u, { do: 'cast', id: e.id, slot: e.slot, target: u });
    B.tool = 'spell';
    if (g.shape === 'allies' && e.id === 'bless' && (!u.conds.blessed)) B.picks = [u]; // Bless takes the caster by default; click him again to leave him out
    var how = { attack: 'a foe in sight within ' + g.range + ' ft', rays: n + ' rays: click a foe for each (the same foe again is fine)', darts: n + ' darts: click a foe for each (the same foe again is fine)', splash: 'a foe within ' + g.range + ' ft (one beside it is caught too)', single: (g.side === 'foe' ? 'a foe' : 'an ally') + ' within ' + g.range + ' ft', touch: 'yourself, or an ally beside you', allies: 'up to ' + n + ' allies within ' + g.range + ' ft (click to add or drop; CAST, or E off a target, casts with fewer)', sphere: 'a point within ' + g.range + ' ft (the ' + g.r + '-ft sphere shows)', cube: 'a point within ' + g.range + ' ft', cone: 'aim the ' + g.len + '-ft cone', line: 'aim the ' + g.len + '-ft line', teleport: 'a square you can see within 30 ft' }[g.shape] || '';
    B.clearCards(); B.card(['{y}' + e.name.toUpperCase() + (e.level ? ' (L' + e.slot + ')' : '') + '{/}: ' + how + D.keys('.  {g}X back{/}')], 100000);
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
      if (g.shape === 'wall') return M.area(u, g, x, y).length ? 'ok' : 'no';
      if (g.shape === 'cone' || g.shape === 'line' || g.shape === 'wave') return M.area(u, g, x, y).length ? 'ok' : 'no';
      if (g.shape === 'teleport') return B.mistyTargets(u, g.range).some(function (q) { return q[0] === x && q[1] === y; }) ? 'ok' : 'no';
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
        if (D.rules.charmedBy(u, foe)) return B.card(['{o}' + u.name + ' is charmed: no raising a hand to the ' + B.shortName(foe) + '.{/}'], 160);
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
      if (v !== 'ok') { // (a target the spell itself turns away: Enlarge on one already enlarged -- say why, js/magic.js targetWhy)
        var refused = w && M.targetWhy(u, g, w);
        if (refused) { D.sfx('error'); B.card(['{o}' + S.name + ': ' + (w.side === 'foe' ? 'the ' + B.shortName(w) : w.name) + ' is ' + refused + '.{/}'], 120); }
        return;
      }
      if (g.shape === 'sphere' || g.shape === 'cube' || g.shape === 'cone' || g.shape === 'line' || g.shape === 'wave' || g.shape === 'wall' || g.shape === 'teleport') return cast({ x: x, y: y });
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
      if (D.looks) D.looks.props(B).forEach(function (o) { objs.push(o); });
      if (D.walls) D.walls.props(B).forEach(function (o) { objs.push(o); }); // the walls (js/walls.js) // the floating weapons, the guardian, the spirits' wheel (js/looks.js)
      wallWebs(B).forEach(function (o) { objs.push(o); }); // the silk up the walls behind a map's webs, and its corner webs
      webObjs(B).forEach(function (o) { objs.push(o); }); // the webs themselves, each piece in the round at its hub
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
      xray(wx, B, objs, hero || B.active); // a figure hidden behind another shows through as its outline
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
    if (req && req.scene) scene(ctx, B, req.scene);
    if (B.menu) menu(ctx, B);
  };

  // ------------------------------------------------------------------ a cutscene beat (the gimmick, Griz 09-28: "a quick cutscene close-up of Aurdin
  // and then that mp3, then a close up of the cloaker showing it hit, then big close up cloaker face"): one figure blown up over
  // a vignette, a caption under it; `hit` flashes it and lands three darts up its body; `face` frames its head
  function scene(ctx, B, sc) {
    if (sc.draw) { sc.draw(ctx, sc.t || 0, D.W, D.H); if ((sc.t || 0) > 60 && ((sc.t >> 5) & 1)) D.hint(ctx, 'E', D.W - 16, D.H - 14, R('stone', 5)); return; } // (a picture drawn by its own hand: the landlord's, js/wet.js)
    var t = sc.t || 0, u = sc.who, k = sc.scale || 3, red = sc.tone === 'red', top = D.spr.top(u.sheet);
    ctx.fillStyle = red ? 'rgba(34,4,8,0.94)' : 'rgba(5,5,12,0.94)'; ctx.fillRect(0, 0, D.W, D.H);
    var g = ctx.createRadialGradient(D.W / 2, D.H / 2 - 10, 10, D.W / 2, D.H / 2 - 10, 210);
    g.addColorStop(0, red ? 'rgba(150,26,36,0.55)' : 'rgba(70,84,140,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, D.W, D.H);
    // `zoomFrom` (Griz, 09-29: the change from the cloak to the monster "could be smoother"): the scene opens at that scale and eases
    // into its own over the first half second, the foot going with it, so a cut from the last scene's figure becomes a push-in
    var zf = sc.zoomFrom, ez = zf ? (function (x) { return x * x * (3 - 2 * x); })(Math.min(1, t / 34)) : 1;
    var footNow = sc.face ? Math.round(D.H / 2 + top * k * (sc.faceAt || 0.72)) : Math.round(D.H / 2 + top * k / 2 - 8);
    var foot = zf ? Math.round((D.H / 2 + top * zf / 2 - 8) + (footNow - (D.H / 2 + top * zf / 2 - 8)) * ez) : footNow;
    if (zf) k = zf + (k - zf) * ez;
    var o = {}; if (sc.hit && t < 44 && ((t >> 2) & 1)) { o.tint = R('bone', 2); o.tintAlpha = 0.85; }
    var anim = sc.anim && D.spr.anim(u.sheet, sc.anim) ? sc.anim : 'idle';
    if (anim === 'attack' || anim === 'reveal' || (sc.swoop && anim === 'fly')) { o.once = true; }
    var tA = Math.max(0, t - (sc.animAt || 0)); // (`animAt`: the tick its animation starts from -- the reveal plays from its own first frame)
    // `swoop` (Griz, 09-29: the sheet "looks like a sequence to play at the end of the easter egg"): the figure flies in from the right,
    // growing as it comes, through its flight's eight poses, the last held -- toward whoever it is coming for, at the left
    var px0 = D.W / 2, py0 = foot, kk = k;
    if (sc.swoop) { var pr = Math.min(1, t / Math.max(1, (sc.frames || 84) - 24)), ee = pr * pr * (3 - 2 * pr); px0 = D.W + 90 - (D.W + 90 - D.W * 0.24) * ee; py0 = foot - 46 + 72 * ee; kk = k * (0.75 + 0.95 * ee); }
    // `morph` { from, at, dur }: the figure starts as another of its animations (the cloaker hung as a cloak) and dissolves into its own
    // over `dur` ticks from `at`, trembling as it changes -- the unfurling
    var ma = sc.morph && D.spr.anim(u.sheet, sc.morph.from) ? Math.max(0, Math.min(1, (t - sc.morph.at) / sc.morph.dur)) : 1, shake = sc.morph && ma > 0 && ma < 1 ? Math.sin(t * 2.3) * 2.2 * Math.sin(Math.PI * ma) : 0;
    ctx.save(); ctx.translate(px0 + shake, py0); ctx.scale(kk, kk);
    // `morph.animAt`: the target plays from that tick; `morph.hold`: the figure it leaves is held on its last frame; `over` { anim, alpha }:
    // a faint second drawing laid over the figure, pulsing and swelling (the cloaker's Moan, the phantasm heads)
    var facing = sc.facing == null ? 0 : sc.facing, one = function (an, al, tt, once) { var oo = Object.assign({}, o); if (al < 1) oo.alpha = al; if (once) oo.once = true; D.spr.draw(ctx, u.sheet, an, facing, an === 'attack' ? Math.min(tt, 60) : tt, 0, 0, oo); };
    if (sc.morph && ma < 1) { one(sc.morph.from, 1 - ma * ma, sc.morph.hold ? 99999 : t, sc.morph.hold); if (ma > 0) one(anim, ma, tA); } else one(anim, 1, tA);
    if (sc.over && D.spr.anim(u.sheet, sc.over.anim)) {
      var pu = 0.5 + 0.5 * Math.sin(t / 5), fade = Math.min(1, t / 20);
      ctx.save(); ctx.scale(1.05 + 0.1 * pu, 1.05 + 0.1 * pu); ctx.globalAlpha = (sc.over.alpha || 0.65) * fade * (0.75 + 0.25 * pu);
      D.spr.draw(ctx, u.sheet, sc.over.anim, facing, t, 0, 0, {}); ctx.restore();
    }
    ctx.restore();
    if (sc.hit) for (var i = 0; i < 3; i++) { // the darts landing: three bursts up the body, in turn
      var tt = t - i * 9; if (tt < 0 || tt > 32) continue;
      var px = D.W / 2 + [-28, 24, 4][i], py = foot - top * k * [0.3, 0.55, 0.78][i];
      ctx.strokeStyle = R('violet', 4); ctx.globalAlpha = 1 - tt / 32; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 3 + tt * 1.7, 0, 7); ctx.stroke();
      ctx.fillStyle = R('bone', 2); ctx.fillRect(px - 1, py - 1, 3, 3); ctx.globalAlpha = 1;
    }
    if (sc.caption) {
      var w = D.textWidth(sc.caption) + 18, x = Math.round((D.W - w) / 2), y = D.H - 42;
      ctx.fillStyle = 'rgba(8,6,14,.92)'; ctx.fillRect(x, y, w, 17);
      ctx.strokeStyle = red ? R('red', 4) : R('gold', 3); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 16);
      D.text(ctx, sc.caption, D.W / 2, y + 5, red ? R('red', 4) : R('gold', 4), 'center');
    }
    if (t > 60 && ((t >> 5) & 1)) D.hint(ctx, 'E', D.W - 16, D.H - 14, R('stone', 5));
  }

  function unitPos(B, u) {
    var s = u.size || 1, gx = u.drawAt ? u.drawAt.x : u.x, gy = u.drawAt ? u.drawAt.y : u.y, gz = G.gzAt(u, gx, gy); // (drawAt: where a caster stands while his floating weapon swings)
    if (u.tween) { var k = u.tween.t / u.tween.dur; gx = u.tween.fx + (u.x - u.tween.fx) * k; gy = u.tween.fy + (u.y - u.tween.fy) * k; gz = u.tween.fz + (gz - u.tween.fz) * k; }
    var c = D.iso.center(gx + (s - 1) / 2, gy + (s - 1) / 2, gz), p = D.iso.toScreen(c.x, c.y);
    return { x: p.x, y: p.y, depth: gx + gy + (s - 1) + 0.6, gz: gz };
  }
  UI.unitPos = unitPos;
  function unitObj(B, u) {
    var p = unitPos(B, u), has = function (a) { return !!D.spr.anim(u.sheet, a); };
    // a familiar riding its wizard (js/familiar.js): the owls perched on his shoulder, the rest at his feet, drawn just after him
    // (it faces as he does -- Griz, 09-29: "facing left when he's facing north" -- and sits on the shoulder, not above the ear; the shoulder
    // is the one on the viewer's left while he faces toward the viewer, on the right while he faces away)
    if (u.riding && u.master) { var mf = u.master.facing || 0, fore = mf === 0 || mf === 1 || mf === 2 || mf === 7, mp = unitPos(B, u.master), mt = D.spr.unitTop(u.master); u.facing = mf;
      // (the bat flutters about his head -- Griz, 09-30: "have it flutter around his head" -- a slow loop, in front of him and behind)
      var ba = B.t / 13 + (u.id || '').length;
      p = u.perch === 'shoulder' ? { x: mp.x + (fore ? -9 : 9), y: mp.y - Math.round(mt * 0.48), depth: mp.depth + 0.02, gz: mp.gz }
        : u.perch === 'head' ? { x: mp.x + Math.round(11 * Math.cos(ba)), y: mp.y - Math.round(mt * 0.92) + Math.round(3 * Math.sin(ba * 2)), depth: mp.depth + (Math.sin(ba) > 0 ? 0.02 : -0.02), gz: mp.gz }
        : { x: mp.x + (fore ? 9 : -9), y: mp.y + 3, depth: mp.depth + 0.03, gz: mp.gz }; }
    if (u.left) return null; // out of the fight, the way they came in
    if (u.unseen) return null; // (asleep under the water or in its puddle: the Settling's, js/wet.js)
    if (u.dead && !has('hurt') && B.t - u.deadT > 50) return null;
    var obj = {
      depth: p.depth, gz: p.gz, layer: 1, unit: u, draw: function (ctx) {
        var o = { color: u.side === 'foe' ? R('violet', 3) : R('silver', 4) }, anim = u.anim, t = B.t - (u.animT || 0);
        var down = u.dead || u.hp <= 0, sk = D.spr.scaleOf(u); // (sk: Enlarge and Reduce draw it bigger or smaller about its foot, sprites.js scaleOf)
        // the cloaker hangs as a cloak until something hurts it (Griz, 09-29)
        if (!down && u.sheet === 'cloaker_p2' && !u.woken && anim === 'idle' && has('roost')) anim = 'roost';
        // the ettercap sits braiding on its stump till it has had a turn or been hurt ("It stops braiding when it sees you": Griz's
        // idle sheet, 09-30); a creature that charges has come 20 ft and more this turn, and runs (the giant boar's sprint row)
        if (!down && !u.woken && !u.acted && anim === 'idle' && has('braid')) anim = 'braid';
        if (!down && anim === 'walk' && u.charge && u.turn && (u.speed - u.turn.move) >= 20 && has('run')) anim = 'run';
        if (down) {
          if (has('hurt')) { anim = 'hurt'; o.once = true; }
          else if (u.dead) { anim = 'idle'; o.alpha = Math.max(0, 1 - (B.t - u.deadT) / 50); o.tint = R('violet', 4); o.tintAlpha = 0.5; }
          else { anim = 'idle'; o.lie = true; }
        } else if (anim === 'attack' || anim === 'cast' || anim === 'flinch') { o.once = true; if (!has(anim) || t > D.spr.duration(u.sheet, anim) + 6) { anim = 'idle'; o.once = false; } } // (back to idle, and idle loops: the flinch's once held its last frame on anyone struck who then did not act -- the landlord, 09-30g)
        if (anim === 'idle' || anim === 'walk' || anim === 'roost' || anim === 'braid' || anim === 'run') t =u.conds.paralyzed || u.conds.asleep ? 0 : B.t + (u.id ? u.id.length * 7 : 0);
        // a hyena helpless with laughter rolls on the floor with it, for as long as it laughs (Hideous Laughter's easter egg, 09-30: js/grimoire.js M.hyena)
        if (!down && u.conds.laughing && has('rofl')) { anim = 'rofl'; o.once = false; t = B.t + (u.id ? u.id.length * 7 : 0); }
        if (u.ethereal) { o.alpha = 0.16 + 0.06 * Math.sin(B.t / 9); o.tint = R('violet', 5); o.tintAlpha = 0.9; }
        if ((u.conds.hidden || u.conds.invisible) && !down) o.alpha = 0.5;
        if ((B.darks || []).length && D.magic.inDark(B, u)) o.alpha = u.side === 'foe' ? 0.2 : 0.5; // (inside the darkness: a shape, if that)
        // in the dark where no one of the party sees (torchdark 09-28): the player sees it still, grey and faint; by darkvision, grey
        if (B.dark && u.side === 'foe' && !down && !u.flash) { var ps = D.light.partySees(B, u); if (ps < 2) { o.alpha = Math.min(o.alpha == null ? 1 : o.alpha, ps === 1 ? 0.85 : 0.6); o.tint = R('stone', 3); o.tintAlpha = ps === 1 ? 0.3 : 0.5; } }
        var lt = D.looks && !down && D.looks.tint(u, B); if (lt) { o.tint = lt[0]; o.tintAlpha = lt[1]; } // (stoneskin, barkskin, rage: js/looks.js)
        if (u.flash > 0) { var fe = u.flashEl && FX.EL && FX.EL[u.flashEl]; o.tint = fe ? fe.c[1] : R('bone', 2); o.tintAlpha = fe ? 0.55 : 0.85; } // (a blow of an element flashes its colour: js/looks.js)
        else if (u.conds.faerie && !down && !u.ethereal) { o.tint = R('violet', 5); o.tintAlpha = 0.25 + 0.15 * Math.sin(B.t / 7); }
        else if (u.conds.paralyzed || u.conds.stunned) { o.tint = R('violet', 4); o.tintAlpha = 0.35; }
        else if (u.conds.restrained) { o.tint = R('bone', 1); o.tintAlpha = 0.3; }
        if (!u.ethereal && !(u.dead && !has('hurt')) && !(u.riding && (u.perch === 'shoulder' || u.perch === 'head'))) {
          var s = u.size || 1;
          ctx.fillStyle = 'rgba(10,8,16,.38)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 10 * s * sk + 1, 4 * s * sk + 1, 0, 0, 7); ctx.fill();
        }
        // a rider's body (the drider's spider half) goes dark unless something else tints it; the rider on top
        var body = u.rider && !o.tint ? Object.assign({}, o, { tint: R('outline', 0), tintAlpha: 0.5 }) : o;
        if (sk !== 1) { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(sk, sk); ctx.translate(-p.x, -p.y); } // (the figure and what stands behind it, grown about the foot)
        if (D.looks && !down && !u.ethereal) D.looks.behind(ctx, B, u, p, anim === 'hurt' && !has('hurt') ? 'idle' : anim, t, o); // (false images, blur, haste: js/looks.js)
        // (a flier whose sheet walks on the ground -- the bat stand-in -- is drawn up in the air when out on the field, bobbing; its shadow stays below)
        var lift = u.lift && !u.riding && !down ? u.lift + Math.round(2 * Math.sin(B.t / 6)) : 0;
        D.spr.draw(ctx, u.sheet, anim === 'hurt' && !has('hurt') ? 'idle' : anim, u.facing || 0, t, p.x, p.y - lift, body);
        // what was drawn, for the x-ray after the world (a standing figure only: the fallen lie low)
        var hw = 10 * (u.size || 1) * sk;
        obj.shown = down || u.ethereal ? null : { anim: anim, t: t, once: !!o.once, x: p.x, y: p.y, k: sk, box: [p.x - hw, p.y - D.spr.unitTop(u), p.x + hw, p.y] };
        if (u.rider && !down) D.spr.drawRider(ctx, u, anim, t, p.x, p.y, o);
        if (sk !== 1) ctx.restore();
        if (D.looks && !down && !u.ethereal) D.looks.over(ctx, B, u, p); // (the marks of its conditions: js/looks.js)
        if (!u.dead && !u.ethereal && !u.riding) {
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
    return obj;
  }

  // the x-ray (Griz, 09-28, the siphon stair: Vivian a step down behind a thug read as one square with him): a figure
  // mostly hidden behind what is drawn after it -- another figure, a stalagmite, a tree, a block, a raised square -- has
  // its outline drawn over everything, in its side's colour (gold for the one whose turn it is)
  var XRAY = 0.4; // how much of a figure must be hidden before it shows through
  function drawnAfter(a, b) { return (b.depth - a.depth || b.gz - a.gz || (b.layer || 0) - (a.layer || 0)) > 0; }
  function xray(ctx, B, objs, hero) {
    var iso = D.iso, HW = iso.TW / 2, HH = iso.TH / 2, shown = objs.filter(function (o) { return o.shown; }), cover = [];
    shown.forEach(function (o) { var b = o.shown.box; cover.push({ o: o, box: b, hit: function (x, y) { return x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]; } }); });
    (iso.map.props || []).forEach(function (p) {
      if (!p.sq || (p.alpha != null && p.alpha < 0.6)) return;
      if (p.kind === 'tile') { // a raised square: its top and the face below it, down to the floor
        var c = iso.center(p.sq.x, p.sq.y, p.gz), s = iso.toScreen(c.x, c.y);
        cover.push({ o: p, box: [s.x - HW, s.y - HH, s.x + HW, s.y + HH + p.gz], hit: function (x, y) { var k = 1 - Math.abs(x - s.x) / HW; return k >= 0 && y >= s.y - HH * k && y <= s.y + HH * k + p.gz; } });
        return;
      }
      if (!p.img || p.kind === 'stone') return;
      var cx = p.fx != null ? p.fx - 0.5 : p.sq.x, cy = p.fy != null ? p.fy - 0.5 : p.sq.y, c2 = iso.center(cx, cy, p.gz), s2 = iso.toScreen(c2.x, c2.y);
      var bx = [s2.x - p.img.ax, s2.y - p.img.ay, s2.x - p.img.ax + p.img.canvas.width, s2.y - p.img.ay + p.img.canvas.height];
      cover.push({ o: p, box: bx, hit: function (x, y) { return x >= bx[0] && x <= bx[2] && y >= bx[1] && y <= bx[3]; } });
    });
    shown.forEach(function (o) {
      var u = o.unit, b = o.shown.box, hid = 0;
      var over = cover.filter(function (c) { return c.o !== o && drawnAfter(o, c.o) && c.box[0] < b[2] && c.box[2] > b[0] && c.box[1] < b[3] && c.box[3] > b[1]; });
      if (!over.length) return;
      for (var i = 0; i < 5; i++) for (var j = 0; j < 8; j++) {
        var x = b[0] + (b[2] - b[0]) * (i + 0.5) / 5, y = b[1] + (b[3] - b[1]) * (j + 0.5) / 8;
        if (over.some(function (c) { return c.hit(x, y); })) hid++;
      }
      if (hid / 40 < XRAY) return;
      var col = u === hero ? R('gold', 4) : u.side === 'foe' ? R('red', 4) : R('glow', 2);
      D.spr.outline(ctx, u.sheet, o.shown.anim === 'hurt' && !D.spr.anim(u.sheet, 'hurt') ? 'idle' : o.shown.anim, u.facing || 0, o.shown.t, o.shown.x, o.shown.y, col, { alpha: 0.9, once: o.shown.once, scale: o.shown.k });
    });
  }
  UI.xray = xray;

  // ------------------------------------------------------------------ the creature types (Griz, 09-29: "emoji's for the creature classes ...
  // wait, emoji's didn't exist in 8 or 16bit..."; then, having watched them over the foes: "add it to the right-click inspect and don't do the
  // thing I said (protection spell)"): a 9x9 pixel glyph per SRD type on a dark chip, the 16-bit status icon's way, shown in the inspect panel
  // beside the creature's type
  var GLYPH = {
    aberration: ['...kkk...', '.kkwwwkk.', 'kwwvvvwwk', 'kwvvpvvwk', 'kwwvvvwwk', '.kkwwwkk.', '...kkk...'],
    beast: ['..ll.ll..', '..ll.ll..', 'll.....ll', 'll.....ll', '...lll...', '..lllll..', '.lllllll.', '.lllllll.', '..ll.ll..'],
    celestial: ['..ggggg..', '.g.....g.', '..ggggg..', '....y....', '...yyy...', '.yyyyyyy.', '...yyy...', '..yy.yy..', '.y.....y.'],
    construct: ['...s.s...', '..sssss..', '.ssdddss.', 'ssdd.ddss', '.sd...ds.', 'ssdd.ddss', '.ssdddss.', '..sssss..', '...s.s...'],
    dragon: ['r........', 'rr.......', 'rrr..r...', 'rrRr.rr..', 'rrRRrrrr.', '.rrRRRrrr', '..rrRRrr.', '...rrrr..', '.....rr..'],
    elemental: ['....f....', '...fFf...', '..fFFf...', '..fFFFf..', '.fFFFFf..', '.ffFFff..', 'bb.fff.bb', '.bbb.bbb.', '..b...b..'],
    fey: ['.aa...aa.', 'aaaa.aaaa', 'aaaamaaaa', '.aaamaaa.', '...mmm...', '.aaamaaa.', 'aaa.m.aaa', '.a..m..a.'],
    fiend: ['r.......r', 'rr.....rr', '.rr...rr.', '.rrrrrrr.', 'rrRrrrRrr', 'rrrrrrrrr', '.rr.r.rr.', '..rrrrr..', '...rrr...'],
    giant: ['...ttt...', '.ttTTTtt.', 'tTTTTTTTt', 'tTTtTTTTt', 'tTTTTTtTt', 'tTTTTTTTt', '.tTTTTTt.', '..ttttt..'],
    humanoid: ['...bbb...', '...bbb...', '....b....', '.bbbbbbb.', '...bbb...', '...bbb...', '..bb.bb..', '..b...b..', '..b...b..'],
    monstrosity: ['o..o..o..', 'o..o..o..', '.o..o..o.', '.o..o..o.', '..o..o..o', '..o..o..o', '...o..o..'],
    ooze: ['...ggg...', '..gGGGg..', '.gGGGGGg.', 'gGGGGGGGg', 'gGGGGGGGg', '.gGGgGGg.', '..g..g.g.', '..g....g.', '.......g.'],
    plant: ['.MM...MM.', 'MMMM.MMMM', '.MMMMMMM.', '...MmM...', '....m....', '....m....', '..lllll..', '.lllllll.'],
    undead: ['..wwwww..', '.wwwwwww.', 'wwwwwwwww', 'wkkwwwkkw', 'wkkwwwkkw', 'wwwwkwwww', '.wwwwwww.', '..wkwkw..', '..wwwww..']
  };
  var GCOL = {
    aberration: { k: ['outline', 0], w: ['bone', 0], v: ['violet', 4], p: ['violet', 1] }, beast: { l: ['leather', 3] },
    celestial: { g: ['gold', 4], y: ['gold', 3] }, construct: { s: ['silver', 5], d: ['silver', 3] }, dragon: { r: ['red', 3], R: ['gold', 3] },
    elemental: { f: ['fire', 0], F: ['fire', 2], b: ['glow', 1] }, fey: { a: ['accent', 0], m: ['orc', 3] }, fiend: { r: ['red', 3], R: ['fire', 2] },
    giant: { t: ['stone', 4], T: ['stone', 6] }, humanoid: { b: ['bone', 0] }, monstrosity: { o: ['red', 4] },
    ooze: { g: ['orc', 3], G: ['orc', 2] }, plant: { M: ['orc', 3], m: ['orc', 2], l: ['leather', 2] }, undead: { w: ['bone', 1], k: ['outline', 0] }
  };
  UI.typeOf = function (u) { return u.type || 'humanoid'; }; // (the class NPCs and the heroes are people)
  // one chip: 11x11, the glyph centred in it; edge 'gold' | 'grey'; cross: a red X over it; alpha for the faint ones
  UI.drawGlyph = function (ctx, type, x, y, o) {
    var rows = GLYPH[type], col = GCOL[type]; if (!rows) return;
    o = o || {}; ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (o.bare) { // (inline in a line of text, core.js D.text: the glyph alone over a one-pixel shadow)
      var by = y - 4 + Math.floor((9 - rows.length) / 2);
      ctx.fillStyle = '#05040a'; rows.forEach(function (row, j) { for (var i = 0; i < row.length; i++) if (col[row[i]]) ctx.fillRect(x - 3 + i, by + j + 1, 1, 1); });
      rows.forEach(function (row, j) { for (var i = 0; i < row.length; i++) { var cb = col[row[i]]; if (!cb) continue; ctx.fillStyle = R(cb[0], cb[1]); ctx.fillRect(x - 4 + i, by + j, 1, 1); } });
      ctx.restore(); return;
    }
    ctx.fillStyle = R('outline', 0); ctx.fillRect(x - 5, y - 5, 11, 11);
    ctx.fillStyle = o.edge === 'gold' ? R('gold', 3) : R('silver', 3);
    ctx.fillRect(x - 5, y - 6, 11, 1); ctx.fillRect(x - 5, y + 6, 11, 1); ctx.fillRect(x - 6, y - 5, 1, 11); ctx.fillRect(x + 6, y - 5, 1, 11);
    var oy = y - 4 + Math.floor((9 - rows.length) / 2);
    rows.forEach(function (row, j) { for (var i = 0; i < row.length; i++) { var c = col[row[i]]; if (!c) continue; ctx.fillStyle = R(c[0], c[1]); ctx.fillRect(x - 4 + i, oy + j, 1, 1); } });
    if (o.cross) { ctx.fillStyle = R('red', 4); for (var k = -5; k <= 5; k++) { ctx.fillRect(x + k, y + k, 1, 1); ctx.fillRect(x + k, y - k, 1, 1); } }
    ctx.restore();
  };

  // the overlay: squares on the ledge are drawn after the ledge's tiles (deferred into the sort), the rest at once
  function onSq(x, y, fn) {
    var z = G.map.gz(x, y);
    if (z > 0 && DEFER) DEFER.push({ depth: x + y + 0.05, gz: z, layer: 0, draw: fn });
    else fn(WCTX || D.ctx);
  }
  function fillSq(ctx, x, y, color, alpha, inset) { onSq(x, y, function (c) { D.iso.rhombus(c, x, y, G.map.gz(x, y), inset || 1); c.globalAlpha = alpha; c.fillStyle = color; c.fill(); c.globalAlpha = 1; }); }
  function lineSq(ctx, x, y, color, alpha, inset) { onSq(x, y, function (c) { D.iso.rhombus(c, x, y, G.map.gz(x, y), inset == null ? 2 : inset); c.globalAlpha = alpha == null ? 1 : alpha; c.strokeStyle = color; c.lineWidth = 1; c.stroke(); c.globalAlpha = 1; }); }
  // ------------------------------------------------------------------ the webs in the round (Griz, 09-30: "compare your zoomed shot of
  // the ettercap to the grid right now - I think we need a bunch of webbing in the room" -- "compare with what we're using for the web
  // spell also" -- "the ground tiles look like they should change display when they form tetris pieces" -- "please do volumetric math
  // ... so the spider webs look even cooler"). Each patch of web (its squares joined edge to edge) is cut into pieces of up to four
  // squares, and each piece is one web in the round: a hub lifted off the floor over the piece's middle; spokes down to the piece's
  // outline on the floor, up the wall or over the ledge's lip it backs onto, and -- a Web spell's 20-ft cube -- up to the cube's top;
  // rings that sag between the spokes; touching pieces tied hub to hub. The points are worked in the grid's own three dimensions (corner
  // coordinates and a height in px) and projected as iso.center does; each piece is drawn in the sort at its hub, so one standing
  // behind the hub is seen through the silk and one standing before it is in front of it. The outline stays on the floor (overlay)
  var N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function webProj(x, y, z) { return D.iso.toScreen((x - y) * D.iso.TW / 2, (x + y) * D.iso.TH / 2 - z); }
  function webPiece(m, sqs, cube) {
    var inP = {}, anchors = [], seen = {}, wall = 0, gzSum = 0, maxGz = 0, hx = 0, hy = 0;
    sqs.forEach(function (q) { inP[q[0] + ',' + q[1]] = 1; });
    var add = function (x, y, z, up) { var k = x + ',' + y + ',' + z; if (seen[k]) return; seen[k] = 1; anchors.push({ x: x, y: y, z: z, up: !!up }); };
    sqs.forEach(function (q) {
      var s = m.at(q[0], q[1]), z = s ? s.gz : 0, sd = (q[0] * 7 + q[1] * 13) % 5;
      gzSum += z; maxGz = Math.max(maxGz, z); hx += q[0] + 0.5; hy += q[1] + 0.5;
      // its four edges: [toward dx, dy, corner a, corner b] in corner coordinates (square (x, y) spans x..x+1, y..y+1)
      [[0, -1, [0, 0], [1, 0]], [1, 0, [1, 0], [1, 1]], [0, 1, [1, 1], [0, 1]], [-1, 0, [0, 1], [0, 0]]].forEach(function (e) {
        var nx = q[0] + e[0], ny = q[1] + e[1]; if (inP[nx + ',' + ny]) return;
        var ax = q[0] + e[2][0], ay = q[1] + e[2][1], bx = q[0] + e[3][0], by = q[1] + e[3][1], n = m.at(nx, ny);
        add(ax, ay, z); add((ax + bx) / 2, (ay + by) / 2, z); add(bx, by, z);
        if ((!n || !n.open) && (e[0] < 0 || e[1] < 0)) {   // a far wall behind it (the edges toward the walls you see): tied up the face
          wall++; add((ax + bx) / 2, (ay + by) / 2, z + 34 + sd * 5, true); add(ax * 0.7 + bx * 0.3, ay * 0.7 + by * 0.3, z + 20 + sd * 3, true);
        } else if (n && n.open && n.gz > z) add((ax + bx) / 2, (ay + by) / 2, n.gz + 3, true);   // over the lip of the ledge above it
      });
    });
    var n = sqs.length; hx /= n; hy /= n;
    if (cube) anchors.filter(function (a) { return !a.up; }).forEach(function (a) { add(a.x, a.y, a.z + 44, true); });   // the cube's top
    var hz = gzSum / n + (cube ? 26 : 8 + n * 2 + (wall ? 6 : 0));
    anchors.forEach(function (a) { a.ang = Math.atan2(a.y - hy, a.x - hx); });
    anchors.sort(function (a, b) { return a.ang - b.ang || a.z - b.z; });
    return { sq: sqs, inP: inP, hx: hx, hy: hy, hz: hz, anchors: anchors, depth: hx + hy - 1 + 0.65, gz: maxGz, cube: cube, seed: (sqs[0][0] * 31 + sqs[0][1] * 17) % 23, ties: [] };
  }
  function webGeo(B) {
    var m = G.map, key = (B.webs || []).map(function (w) { return w.by + ':' + w.sq.map(function (q) { return q[0] + ',' + q[1]; }).join(' '); }).join('|');
    if (B.webGeo && B.webGeo.key === key && B.webGeo.map === m) return B.webGeo;
    var pieces = [];
    (B.webs || []).forEach(function (wb) {
      var cube = !!wb.dc && !wb.ground, left = {}, mine = [];
      wb.sq.forEach(function (q) { left[q[0] + ',' + q[1]] = q; });
      for (var guard = 0; Object.keys(left).length && guard < 400; guard++) {
        // the back-most square left begins a piece, and takes up to three more, neighbours first (a tetromino, or less)
        var start = Object.keys(left).map(function (k) { return left[k]; }).sort(function (a, b) { return (a[0] + a[1]) - (b[0] + b[1]) || a[0] - b[0]; })[0];
        var piece = [start], open = [start]; delete left[start[0] + ',' + start[1]];
        while (open.length && piece.length < 4) {
          var cur = open.shift();
          for (var i = 0; i < 4 && piece.length < 4; i++) { var k = (cur[0] + N4[i][0]) + ',' + (cur[1] + N4[i][1]); if (left[k]) { piece.push(left[k]); open.push(left[k]); delete left[k]; } }
        }
        mine.push(webPiece(m, piece, cube));
      }
      // pieces of one patch that touch are tied hub to hub
      mine.forEach(function (p, i) { mine.slice(i + 1).forEach(function (o) { if (p.sq.some(function (q) { return N4.some(function (d) { return o.inP[(q[0] + d[0]) + ',' + (q[1] + d[1])]; }); })) p.ties.push(o); }); });
      pieces = pieces.concat(mine);
    });
    return (B.webGeo = { key: key, map: m, pieces: pieces });
  }
  function webPieceDraw(ctx, B, p) {
    var pul = 0.85 + 0.15 * Math.sin(B.t / 23 + p.seed), hub = { x: p.hx, y: p.hy, z: p.hz }, H = webProj(p.hx, p.hy, p.hz), A = p.anchors;
    var at = function (a, f, sag) { return { x: hub.x + (a.x - hub.x) * f, y: hub.y + (a.y - hub.y) * f, z: hub.z + (a.z - hub.z) * f - (sag || 0) }; };
    var P = function (q) { var s = webProj(q.x, q.y, q.z); return [s.x + 0.5, s.y + 0.5]; };
    ctx.save(); ctx.lineWidth = 1;
    // the spokes: floor strands brighter, the ones up a wall a little fainter
    ctx.strokeStyle = R('bone', 2);
    [false, true].forEach(function (up) {
      ctx.globalAlpha = (up ? 0.4 : 0.55) * pul; ctx.beginPath();
      A.forEach(function (a) { if (a.up !== up) return; var e = P(a); ctx.moveTo(H.x + 0.5, H.y + 0.5); ctx.lineTo(e[0], e[1]); });
      ctx.stroke();
    });
    // the rings: round the hub at each fraction of the way out, sagging between spokes (in height, so the sag is the world's)
    ctx.strokeStyle = R('bone', 1);
    [0.2, 0.42, 0.64, 0.86].forEach(function (f, j) {
      ctx.globalAlpha = (0.5 - j * 0.06) * pul; ctx.beginPath();
      for (var i = 0; i < A.length; i++) {
        var a = A[i], b = A[(i + 1) % A.length], gap = (b.ang - a.ang + Math.PI * 2) % (Math.PI * 2);
        if (A.length > 2 && gap > 2.2) continue;   // (a notch in an L: no thread across the open side)
        var r0 = at(a, f), r1 = at(b, f), mid = { x: (r0.x + r1.x) / 2, y: (r0.y + r1.y) / 2, z: (r0.z + r1.z) / 2 - (1.5 + 3.5 * f) };
        var s0 = P(r0), s1 = P(r1), sm = P(mid);
        ctx.moveTo(s0[0], s0[1]); ctx.quadraticCurveTo(2 * sm[0] - (s0[0] + s1[0]) / 2, 2 * sm[1] - (s0[1] + s1[1]) / 2, s1[0], s1[1]);
      }
      ctx.stroke();
    });
    // a few stray threads from the hub's neighbourhood to the floor, so a piece is not too neat
    ctx.globalAlpha = 0.3 * pul; ctx.strokeStyle = R('bone', 2); ctx.beginPath();
    for (var k = 0; k < 3; k++) { var a2 = A[(p.seed * (k + 3) + k * 5) % A.length], r2 = at(a2, 0.3 + k * 0.15), e2 = P({ x: a2.x + (k - 1) * 0.15, y: a2.y - (k - 1) * 0.1, z: a2.up ? a2.z - 10 : a2.z }), s2 = P(r2); ctx.moveTo(s2[0], s2[1]); ctx.lineTo(e2[0], e2[1]); }
    ctx.stroke();
    // tied to the next piece of the patch: two threads, hub to hub and a lower one, sagging
    p.ties.forEach(function (o) {
      var o0 = { x: o.hx, y: o.hy, z: o.hz }, mid = { x: (hub.x + o0.x) / 2, y: (hub.y + o0.y) / 2, z: (hub.z + o0.z) / 2 - 5 }, s0 = P(hub), s1 = P(o0), sm = P(mid);
      ctx.globalAlpha = 0.5 * pul; ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.quadraticCurveTo(2 * sm[0] - (s0[0] + s1[0]) / 2, 2 * sm[1] - (s0[1] + s1[1]) / 2, s1[0], s1[1]); ctx.stroke();
      var l0 = P({ x: hub.x, y: hub.y, z: hub.z * 0.5 }), l1 = P({ x: o0.x, y: o0.y, z: o0.z * 0.5 }), lm = P({ x: mid.x, y: mid.y, z: mid.z * 0.5 - 3 });
      ctx.globalAlpha = 0.32 * pul; ctx.beginPath(); ctx.moveTo(l0[0], l0[1]); ctx.quadraticCurveTo(2 * lm[0] - (l0[0] + l1[0]) / 2, 2 * lm[1] - (l0[1] + l1[1]) / 2, l1[0], l1[1]); ctx.stroke();
    });
    ctx.restore();
  }
  function webObjs(B) {
    if (!(B.webs || []).some(function (w) { return w.sq.length; })) return [];
    return webGeo(B).pieces.map(function (p) { return { depth: p.depth, gz: p.gz, layer: 1, draw: function (ctx) { webPieceDraw(ctx, B, p); } }; });
  }
  // the floor under a web: the patch's outline, so where it holds reads at a glance (the overlay, under everything)
  function webFloor(B) {
    (B.webs || []).forEach(function (wb) {
      var has = {}; wb.sq.forEach(function (q) { has[q[0] + ',' + q[1]] = 1; });
      wb.sq.forEach(function (q) {
        fillSq(null, q[0], q[1], R('bone', 1), 0.07, 3);
        onSq(q[0], q[1], function (c) {
          var z = G.map.gz(q[0], q[1]);
          c.save(); c.lineWidth = 1; c.strokeStyle = R('bone', 1); c.globalAlpha = 0.3; c.beginPath();
          [[0, -1, [0, 0], [1, 0]], [1, 0, [1, 0], [1, 1]], [0, 1, [1, 1], [0, 1]], [-1, 0, [0, 1], [0, 0]]].forEach(function (e) {
            if (has[(q[0] + e[0]) + ',' + (q[1] + e[1])]) return;
            var a = webProj(q[0] + e[2][0], q[1] + e[2][1], z), b = webProj(q[0] + e[3][0], q[1] + e[3][1], z);
            c.moveTo(a.x + 0.5, a.y + 0.5); c.lineTo(b.x + 0.5, b.y + 0.5);
          });
          c.stroke(); c.restore();
        });
      });
    });
  }
  // the walls behind a map's strung webs, dressed floor to dark (Griz, 09-30: "can we take it across the ceiling on the wall tiles
  // (looks like 3 high, web only on bottom 1) and fancy up ... where the floor and two walls make a corner? More back wall webbing
  // on the whole"): a sheet on every far-wall face within a square of the webs the map starts with -- anchor threads to the top,
  // a hub and its rings -- and threads draped from the top out over the room; on the map's `webCorners` (a floor square with a wall
  // on both its far edges) a corner web strung across the two walls, a cocoon hung in it. Drawn as sorted objects just after the
  // wall they lie on (the overlay goes under the walls). Scenery: fire burns the floor's webs, not these
  function wallWebs(B) {
    var m = G.map, def = m.def || {};
    if (!def.webs || !def.webs.length) return [];
    if (!B.wallWebFaces || B.wallWebFaces.map !== m) {
      var near = {}, faces = [];
      def.webs.forEach(function (q) { for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) near[(q[0] + dx) + ',' + (q[1] + dy)] = 1; });
      m.sq.forEach(function (s) {
        if (!s.open || !near[s.x + ',' + s.y]) return;
        [[s.x - 1, s.y, 'L'], [s.x, s.y - 1, 'R']].forEach(function (b) {   // L: the square's upper-left edge, R: its upper-right
          var r = m.at(b[0], b[1]); if (!r || r.rock !== 'far') return;
          var top = 0; [[r.x + 1, r.y], [r.x, r.y + 1]].forEach(function (f) { var n = m.at(f[0], f[1]); if (n && n.open) top = Math.max(top, n.gz); });
          faces.push({ q: s, edge: b[2], span: D.iso.WALL + top - s.gz, depth: r.x + r.y + 0.05, h: ((s.x * 37 + s.y * 91 + (b[2] === 'L' ? 13 : 0)) % 101) / 101 });
        });
      });
      B.wallWebFaces = { map: m, faces: faces };
    }
    var out = [];
    B.wallWebFaces.faces.forEach(function (f) { out.push({ depth: f.depth, gz: 0, layer: 1, draw: function (ctx) { wallFace(ctx, B, f); } }); });
    // (just after the square's own tile -- a ledge's is a prop at its depth -- and before anyone standing on it)
    (def.webCorners || []).forEach(function (q) { var s = m.at(q[0], q[1]); if (s && s.open) out.push({ depth: q[0] + q[1] + 0.05, gz: s.gz, layer: 2, draw: function (ctx) { cornerWeb(ctx, B, s); } }); });
    return out;
  }
  // a square's four rhombus corners on screen (at its floor): left, top, right, bottom
  function sqCorners(s) {
    var p = D.iso.center(s.x, s.y, s.gz), c = D.iso.toScreen(p.x, p.y), HW = D.iso.TW / 2, HH = D.iso.TH / 2;
    return { c: c, l: [c.x - HW, c.y], t: [c.x, c.y - HH], r: [c.x + HW, c.y], b: [c.x, c.y + HH] };
  }
  function wallFace(ctx, B, f) {
    var k = sqCorners(f.q), a = f.edge === 'L' ? k.l : k.t, b = f.edge === 'L' ? k.t : k.r, H = f.span, h = f.h;
    var P = function (u, v) { return [Math.round(a[0] + (b[0] - a[0]) * u) + 0.5, Math.round(a[1] + (b[1] - a[1]) * u - v * H) + 0.5]; };
    var pul = 0.85 + 0.15 * Math.sin(B.t / 29 + f.q.x * 1.7 + f.q.y);
    var rnd = function (i) { var v = Math.sin(h * 917 + i * 12.9898) * 43758.5453; return v - Math.floor(v); };   // this face's own dice
    var kind = h < 0.45 ? 'sheet' : h < 0.8 ? 'ties' : 'hammock';
    ctx.save(); ctx.lineWidth = 1; ctx.strokeStyle = R('bone', 2);
    // anchor threads from the floor up, some to the top, leaning; fainter as they climb into the dark
    var n = 2 + Math.floor(rnd(1) * 3);
    for (var i = 0; i < n; i++) {
      var u0 = 0.08 + (i + rnd(2 + i) * 0.8) / n * 0.84, u1 = u0 + (rnd(9 + i) - 0.5) * 0.25, v1 = 0.55 + rnd(14 + i) * 0.45, p0 = P(u0, 0), p1 = P(u1, v1), pm = P((u0 + u1) / 2, v1 / 2);
      ctx.globalAlpha = 0.3 * pul; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(pm[0], pm[1]); ctx.stroke();
      ctx.globalAlpha = 0.18 * pul; ctx.beginPath(); ctx.moveTo(pm[0], pm[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
    }
    if (kind === 'sheet') {
      // a sheet: a hub off-centre, five to seven spokes to the face's edges, rings that sag between them
      var hu0 = 0.25 + rnd(3) * 0.5, hv0 = 0.3 + rnd(4) * 0.4, hub = P(hu0, hv0), rim = [], ns = 5 + Math.floor(rnd(5) * 3);
      for (var s2 = 0; s2 < ns; s2++) {   // each spoke walks out from the hub at its own angle till it meets the face's edge
        var a2 = (s2 + rnd(20 + s2) * 0.6) / ns * Math.PI * 2, uu = hu0, vv = hv0, tt = 12;
        while (tt-- > 0 && uu >= 0 && uu <= 1 && vv >= 0 && vv <= 1) { uu += Math.cos(a2) * 0.12; vv += Math.sin(a2) * 0.12; }
        rim.push(P(Math.max(0, Math.min(1, uu)), Math.max(0, Math.min(1, vv))));
      }
      ctx.globalAlpha = 0.42 * pul; ctx.beginPath();
      rim.forEach(function (e) { ctx.moveTo(hub[0], hub[1]); ctx.lineTo(e[0], e[1]); });
      ctx.stroke();
      ctx.strokeStyle = R('bone', 1);
      [0.22, 0.45, 0.7].forEach(function (t, j) {
        ctx.globalAlpha = (0.38 - j * 0.07) * pul; ctx.beginPath();
        rim.concat([rim[0]]).forEach(function (e, i, all) {
          var x = hub[0] + (e[0] - hub[0]) * t, y = hub[1] + (e[1] - hub[1]) * t;
          if (!i) { ctx.moveTo(x, y); return; }
          var p = all[i - 1], px = hub[0] + (p[0] - hub[0]) * t, py = hub[1] + (p[1] - hub[1]) * t;
          ctx.quadraticCurveTo((x + px) / 2, (y + py) / 2 + 3, x, y);   // the silk sags between spokes
        });
        ctx.stroke();
      });
    } else if (kind === 'ties') {
      // loose threads tied across the face at odd angles
      ctx.globalAlpha = 0.3 * pul; ctx.beginPath();
      for (var j2 = 0; j2 < 3; j2++) { var q0 = P(0, 0.15 + rnd(30 + j2) * 0.6), q1 = P(1, 0.15 + rnd(40 + j2) * 0.6); ctx.moveTo(q0[0], q0[1]); ctx.quadraticCurveTo((q0[0] + q1[0]) / 2, (q0[1] + q1[1]) / 2 + 5, q1[0], q1[1]); }
      ctx.stroke();
    } else {
      // a hammock slung across the lower face, sagging toward the floor
      var lo = 0.2 + rnd(6) * 0.2;
      ctx.globalAlpha = 0.36 * pul; ctx.beginPath();
      for (var j3 = 0; j3 < 4; j3++) { var e0 = P(0, lo + j3 * 0.07), e1 = P(1, lo + j3 * 0.07 + (rnd(50) - 0.5) * 0.1); ctx.moveTo(e0[0], e0[1]); ctx.quadraticCurveTo((e0[0] + e1[0]) / 2, (e0[1] + e1[1]) / 2 + 10 - j3 * 2, e1[0], e1[1]); }
      for (var j4 = 1; j4 < 4; j4++) { var r0 = P(j4 / 4, lo), r1 = P(j4 / 4, lo + 0.21); ctx.moveTo(r0[0], r0[1] + 8); ctx.lineTo(r1[0], r1[1] + 6); }
      ctx.stroke();
    }
    // over the top and out across the room: threads from the top of the wall, sagging, ending in the air over the floor in front
    ctx.strokeStyle = R('bone', 2); ctx.globalAlpha = 0.26 * pul; ctx.beginPath();
    [0.25, 0.7].forEach(function (u, i) {
      var t0 = P(u, 1), end = [k.c.x + (i ? 10 : -10) + (h - 0.5) * 16, k.c.y - 38 - h * 18];
      ctx.moveTo(t0[0], t0[1]); ctx.quadraticCurveTo((t0[0] + end[0]) / 2, Math.max(t0[1], end[1]) + 14, end[0], end[1]);
    });
    ctx.stroke();
    ctx.restore();
  }
  function cornerWeb(ctx, B, s) {
    var k = sqCorners(s), H = D.iso.WALL, t = k.t, pul = 0.85 + 0.15 * Math.sin(B.t / 31 + s.x);
    var A = function (u, v) { return [k.l[0] + (t[0] - k.l[0]) * u, k.l[1] + (t[1] - k.l[1]) * u - v * H]; }; // the upper-left wall
    var Bw = function (u, v) { return [t[0] + (k.r[0] - t[0]) * u, t[1] + (k.r[1] - t[1]) * u - v * H]; }; // the upper-right wall
    var hub = [t[0] + 0.5, Math.round(t[1] - H * 0.5 + 12) + 0.5];   // out from the corner, a little into the room
    var ends = [A(0.08, 0.06), A(0.12, 0.4), A(0.3, 0.78), A(0.75, 1), [t[0], t[1] - H], Bw(0.25, 1), Bw(0.7, 0.78), Bw(0.88, 0.4), Bw(0.92, 0.06),
      [(k.r[0] + k.c.x) / 2, (k.r[1] + k.c.y) / 2], [k.c.x, k.c.y + 2], [(k.l[0] + k.c.x) / 2, (k.l[1] + k.c.y) / 2]];
    ctx.save(); ctx.lineWidth = 1;
    ctx.strokeStyle = R('bone', 2); ctx.globalAlpha = 0.9 * pul; ctx.beginPath();   // (brighter than the walls' silk, so the corner reads)
    ends.forEach(function (e) { ctx.moveTo(hub[0], hub[1]); ctx.lineTo(Math.round(e[0]) + 0.5, Math.round(e[1]) + 0.5); });
    ctx.stroke();
    ctx.strokeStyle = R('bone', 2);
    [0.12, 0.22, 0.33, 0.45, 0.58, 0.72, 0.86].forEach(function (f, j) {
      ctx.globalAlpha = (0.78 - j * 0.05) * pul; ctx.beginPath();
      ends.forEach(function (e, i) {
        var x = hub[0] + (e[0] - hub[0]) * f, y = hub[1] + (e[1] - hub[1]) * f;
        if (!i) { ctx.moveTo(x, y); return; }
        var p = ends[i - 1], px = hub[0] + (p[0] - hub[0]) * f, py = hub[1] + (p[1] - hub[1]) * f;
        ctx.quadraticCurveTo((x + px) / 2 + (hub[0] - (x + px) / 2) * 0.08, (y + py) / 2 + (hub[1] - (y + py) / 2) * 0.08, x, y);   // each ring sags toward the hub
      });
      ctx.stroke();
    });
    ctx.restore();
    // what it caught: a cocoon hung below the hub
    var ck = s.x + ',' + s.y; B.cornerCocoons = B.cornerCocoons || {};
    if (D.art && D.art.cocoon) { var cc = B.cornerCocoons[ck] || (B.cornerCocoons[ck] = D.art.cocoon(D.hash('corner' + ck))); ctx.drawImage(cc.canvas, Math.round(hub[0] - cc.ax), Math.round(hub[1] + 30 - cc.ay)); }
  }
  function dotSq(x, y, color) { onSq(x, y, function (c) { var p = D.iso.center(x, y, G.map.gz(x, y)), s = D.iso.toScreen(p.x, p.y); c.fillStyle = color; c.fillRect(s.x - 1, s.y - 1, 2, 2); }); }
  function overlay(ctx, B, u) {
    // the aura of protection round a standing paladin: a dashed gold circle, 10 ft (Griz, 09-27: "auras as circles centered
    // on him"). Its radius, 2.9 squares, takes in the centre of every square within 10 ft -- the 5x5 block the rules
    // count, corners too -- and none past it; the cursor inside says what it is
    B.units.forEach(function (p) {
      if (!RU.auraOf(p)) return; // (the one test: js/rules.js; Devotion's inner line is js/looks.js LK.ground's)
      var q = unitPos(B, p), r = 2.9 * Math.SQRT2;
      ctx.save(); ctx.beginPath(); ctx.ellipse(q.x, q.y, r * D.iso.TW / 2, r * D.iso.TH / 2, 0, 0, Math.PI * 2);
      ctx.globalAlpha = 0.06; ctx.fillStyle = R('gold', 3); ctx.fill();
      ctx.globalAlpha = 0.75; ctx.strokeStyle = R('gold', 3); ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.stroke();
      ctx.restore();
    });
    // a web's floor: its outline (the silk itself stands in the sort: webObjs)
    webFloor(B);
    // a web burning (magic.js burnWebs: out the round it caught in): embers on the square
    (B.webFire || []).forEach(function (e) { if (e.round < B.round) return; e.sq.forEach(function (q) { var fl = 0.5 + 0.5 * Math.sin(B.t / 4 + q[0] * 2 + q[1]); fillSq(ctx, q[0], q[1], R('fire', 2), 0.18 + 0.14 * fl, 2); dotSq(q[0], q[1], (B.t >> 2) % 2 ? R('fire', 2) : R('gold', 4)); }); });
    // magical darkness, and the clouds that are heavily obscured like it: fog (pale), a stinking cloud (yellow-green), sleet (cold)
    (B.darks || []).forEach(function (dk) {
      var k = dk.kind || 'darkness', col = k === 'fog' ? R('silver', 5) : k === 'stink' ? R('moss', 2) : k === 'kill' ? R('moss', 3) : k === 'sleet' ? R('glow', 1) : '#040308', a = k === 'darkness' ? 0.86 : k === 'sleet' ? 0.4 : 0.5;
      D.magic.darkSq(B, dk).forEach(function (q) { fillSq(ctx, q[0], q[1], col, a); });
    });
    if (D.looks) D.looks.ground(ctx, B, onSq); // the spell ground, holy rings, the darkness's edge (js/looks.js)
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
      if (g.shape === 'sphere' || g.shape === 'cube' || g.shape === 'cone' || g.shape === 'line' || g.shape === 'wave' || g.shape === 'wall') {
        var col = S.id === 'wallofstone' ? R('stone', 3) : S.id === 'wallofthorns' || S.id === 'conjureanimals' || S.id === 'conjurewoodlandbeings' ? R('moss', 2) : S.id === 'windwall' ? R('bone', 2) : S.id === 'web' ? R('bone', 1) : S.id === 'sleep' ? R('violet', 4) : S.sp.el === 'cold' || S.sp.el === 'lightning' ? R('glow', 1) : R('fire', 1);
        M.area(u, g, cx, cy).forEach(function (q) { fillSq(ctx, q[0], q[1], col, 0.38); });
      } else if (g.shape === 'teleport') B.mistyTargets(u, g.range).forEach(function (q) { lineSq(ctx, q[0], q[1], R('glow', 2), 0.6, 4); });
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
    var list = []; // (a familiar right after its caster: it has no initiative of its own, RULED 09-30)
    B.order.forEach(function (u) { list.push(u); var f = D.familiar && D.familiar.of(B, u); if (f && !f.away) list.push(f); });
    list.forEach(function (u) {
      var name = (u.familiar && D.familiar ? D.familiar.stripName(u) : B.shortName(u)) + (u.ethereal ? '~' : ''), w = D.textWidth(name) + 6;
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
      // a line wider than the screen wraps onto the next (Griz, 09-29: "spell can be complicated, add a line"), colour codes and glyphs kept
      var lines = [], w = 0;
      c.lines.filter(function (l) { return l; }).forEach(function (l) { (D.textWidth(l) > D.W - 18 ? D.wrap(l, D.W - 18) : [l]).forEach(function (x) { lines.push(x); }); });
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
        var au = RU.auraOf(p);
        if (!au || Math.max(Math.abs(B.cursor.x - p.x), Math.abs(B.cursor.y - p.y)) > 2) return;
        lines.push('{y}' + p.name + '\'s aura{/}: allies here add +' + au.protect + ' to saving throws' + (au.devotion ? ' and can\'t be charmed' : ''));
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
    if (w.torch) c.push('{o}' + (w.torch.kind === 'lantern' ? (w.torch.hood ? D.light.word(w.torch) + ' in hand, hooded' : D.light.word(w.torch) + ' in hand') : 'torch in hand') + '{/}');
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
    D.hint(ctx, st === 'window' ? (B.tool === 'menu' ? 'up/down, E: choose   X: menu' : 'E: here   X: back to the commands') : spellRing ? 'left/right turns the ring, up/down the slot, E: choose' : B.tool === 'menu' || B.list ? 'left/right turns the ring, E: choose   X: close' : B.tool === 'move' ? 'X, Q or E on yourself: the ring   M: menu' : 'E: here   X: back', BX, BAR_Y + 6, R('accent', 2));
    D.hint(ctx, 'C recentre  M menu  wheel or -/= zoom', BX, BAR_Y + 18, R('stone', 5));
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
    else if (cur && cur.sp) D.text(ctx, '{g}' + D.typeText(D.magic.summary(cur, u)) + '{/}', x + 6, sy, R('accent', 2));
    else if (cur && cur.note) D.text(ctx, '{g}' + D.typeText(cur.note, true) + '{/}', x + 6, sy, R('accent', 2));
    else if (cur && cur.use) D.text(ctx, '{g}' + ({ heal: cur.use.dice + ' healing, touch', revive: 'a fallen ally beside you, up on 1 HP', antitoxin: 'ends poison, touch', cure: 'ends poison, touch', damage: 'thrown, 20 ft: DEX DC ' + (cur.use.dc || 10) + ' or ' + cur.use.dice + ' fire', light: D.light.blurb(cur.id) }[cur.use.effect] || '') + '{/}', x + 6, sy, R('accent', 2));
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
    var sub = !cur.ok && cur.why ? cur.why : cur.kind === 'spell' ? D.typeText(D.magic.summary(cur, u)) : D.typeText(cur.note || '', true); // (the creature types as their glyphs)
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
    D.hint(ctx, 'menu: ' + UI.opts.style.toUpperCase() + (UI.opts.style === 'ring' ? ' (M or Tab, then MENU)' : ' (M or X/Esc, then MENU)'), D.W / 2, 194, R('stone', 5), 'center');
    if (B.dark) D.text(ctx, 'DARK GROUND: the four see by their lights and darkvision. You see it all: what they cannot is grey.', D.W / 2, 208, R('fire', 1), 'center');
    if ((B.t >> 5) & 1) D.hint(ctx, 'E to begin', D.W / 2, 180, R('glow', 2), 'center');
  }
  function inspect(ctx, u) {
    var ty = UI.typeOf(u);
    var lines = ['{' + (u.side === 'foe' ? 'r' : 'c') + '}' + u.name + '{/}' + (u.cls ? '  ' + u.cls + ' ' + u.lvl : '') + '  {g}' + ty + '{/}', 'HP ' + u.hp + '/' + u.maxhp + '  AC ' + RU.ac(u) + '  speed ' + u.speed + ' ft' + (u.size > 1 ? '  Large' : '')];
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
    box(ctx, 6, 40, w + 28, lines.length * 9 + 8, u.side === 'foe' ? R('red', 3) : R('glow', 1));
    lines.forEach(function (l, k) { D.text(ctx, l, 12, 44 + k * 9, R('bone', 1)); });
    UI.drawGlyph(ctx, ty, 6 + w + 28 - 10, 50); // (its creature type: the glyphs above)
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
    D.hint(ctx, 'a swap costs the action  ·  X back', x + w - 8, y + 5, R('stone', 5), 'right');
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
    D.hint(ctx, 'X back', x + w - 8, y + 5, R('stone', 5), 'right');
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
      if (D.features && D.features.classLine) { var fl = D.features.classLine(u); if (fl) res.push(fl); } // (the class features past those: js/features.js -- the monk's ki, the metamagic, the pact, the luck ...)
      D.text(ctx, res.join('   '), x + 42, ry + 11, R('silver', 5));
      D.text(ctx, conds(u).trim() || '{g}no conditions{/}', x + 42, ry + 21, R('accent', 2));
    });
    if (B.inv && B.inv.length) D.text(ctx, 'packs: ' + B.inv.filter(function (s) { return s.n > 0; }).map(function (s) { var it = window.DS.DATA.items[s.id]; return (it ? it.name : s.id) + ' x' + s.n; }).join(', '), x + 8, y + h - 10, R('accent', 2));
  }
})();
