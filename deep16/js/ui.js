/* DEEP16 — the fight's face and hands. The bottom bar: the active hero's portrait, HP, and four pips -- MOVE (ft left),
   ACTION, BONUS, REACTION -- lit while there, dim when spent; the commands beside them (1-9, or click). The grid
   overlay under the sprites: reachable squares (blue), reachable with a dash (paler), targets (red), an area template
   (orange), the paladin's aura (a faint gold ring), a flanking line. Cards for every roll; prompts for reactions.
   Keys: arrows/WASD move the cursor, E/Z confirm, X/Esc back, SPACE end turn, 1-9 commands, M the menu.
   Mouse: hover, click, right-click to inspect. */
'use strict';
(function () {
  var D = window.D16, I = D.input, G = D.grid, RU = D.rules, FX = D.fx;
  var UI = D.ui = {};
  var R = function (r, i) { return D.PAL.ramps[r][i]; };
  var BAR_Y = 226;

  // ------------------------------------------------------------------ requests
  UI.onRequest = function (B, req) {
    if (req.turn) { B.tool = B.tool === 'attack' && req.turn.turn.attacksLeft ? 'attack' : 'move'; B.cache = null; }
    if (req.prompt) B.sel = 0;
    if (req.entry) B.entryT = B.t;
  };
  function reachCache(B, u) {
    var T = u.turn, key = u.x + ',' + u.y + ',' + T.move + ',' + T.action + ',' + T.attacksLeft + ',' + B.units.map(function (w) { return w.x + ':' + w.y + ':' + (w.dead ? 0 : 1) + (w.ethereal ? 'e' : ''); }).join(';');
    if (B.cache && B.cache.key === key) return B.cache;
    var dash = T.action > 0 && !T.attacksLeft ? u.speed : 0;
    B.cache = { key: key, move: G.reach(u, T.move), dash: dash ? G.reach(u, T.move + dash) : null };
    return B.cache;
  }

  // ------------------------------------------------------------------ input
  UI.input = function (B, req) {
    if (req.entry) {
      if (I.pressed('a') || I.pressed('b') || I.pressed('end') || I.mouse.click || B.t - B.entryT > 240) B.answer();
      return;
    }
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
    if (I.mouse.click && B.promptRects) {
      for (var i = 0; i < B.promptRects.length; i++) { var r = B.promptRects[i]; if (hit(r)) return B.answer(p.opts[i].value); }
    }
  }
  function hit(r) { var m = I.mouse; return m.x >= r.x && m.y >= r.y && m.x < r.x + r.w && m.y < r.y + r.h; }
  function moveCursor(B, dx, dy) {
    var m = G.map;
    B.cursor.x = D.clamp(B.cursor.x + dx, 0, m.w - 1); B.cursor.y = D.clamp(B.cursor.y + dy, 0, m.h - 1);
    var c = D.iso.center(B.cursor.x, B.cursor.y, m.gz(B.cursor.x, B.cursor.y)), s = D.iso.toScreen(c.x, c.y);
    if (s.x < 60 || s.x > D.W - 60 || s.y < 50 || s.y > BAR_Y - 30) D.iso.lookAt(B.cursor.x, B.cursor.y, m.gz(B.cursor.x, B.cursor.y));
  }
  function turnInput(B, u) {
    var any = I.pressed('a') || I.pressed('b') || I.pressed('end') || I.mouse.click;
    if (B.inspect && (any || I.mouse.rclick)) { B.inspect = null; return; }
    if (I.repeat('up')) moveCursor(B, -1, -1);
    if (I.repeat('down')) moveCursor(B, 1, 1);
    if (I.repeat('left')) moveCursor(B, -1, 1);
    if (I.repeat('right')) moveCursor(B, 1, -1);
    B.hoverBtn = -1;
    if (I.mouse.inside) {
      if (I.mouse.y >= BAR_Y) { (B.buttons || []).forEach(function (b, i) { if (hit(b)) B.hoverBtn = i; }); }
      else if (I.mouse.moved) { var s = D.iso.pick(I.mouse.x, I.mouse.y); if (s) { B.cursor.x = s.x; B.cursor.y = s.y; } }
    }
    if (I.pressed('end')) return UI.command(B, u, { do: 'end' });
    var cmds = B.commands(u);
    for (var k = 1; k <= 9; k++) if (I.pressed('n' + k) && cmds[k - 1]) return pickCommand(B, u, cmds[k - 1]);
    if (I.pressed('b')) { B.tool = 'move'; return; }
    if (I.mouse.rclick && I.mouse.y < BAR_Y) { var w = G.occupant(B.cursor.x, B.cursor.y) || etherealAt(B, B.cursor.x, B.cursor.y); if (w) B.inspect = w; return; }
    if (I.mouse.click && I.mouse.y >= BAR_Y) {
      if (B.hoverBtn >= 0 && B.buttons[B.hoverBtn]) { var bt = B.buttons[B.hoverBtn]; if (bt.end) return UI.command(B, u, { do: 'end' }); return pickCommand(B, u, bt.cmd); }
      return;
    }
    if (I.pressed('a') || I.mouse.click) actAt(B, u, B.cursor.x, B.cursor.y);
  }
  function etherealAt(B, x, y) { return B.units.filter(function (w) { return w.ethereal && x >= w.x && y >= w.y && x < w.x + w.size && y < w.y + w.size; })[0]; }
  function pickCommand(B, u, c) {
    if (!c || !c.ok) return;
    if (c.tool) { B.tool = B.tool === c.tool ? 'move' : c.tool; return; }
    UI.command(B, u, { do: c.id });
  }
  UI.command = function (B, u, cmd) {
    B.clearCards();
    if (cmd.do !== 'attack' || !(u.turn.attacksLeft > 1)) B.tool = 'move';
    B.answer(cmd);
  };
  // the cursor's square, under the current tool
  function actAt(B, u, x, y) {
    var T = u.turn, w = G.occupant(x, y), tool = B.tool;
    var foe = w && G.hostile(u, w) && !w.dead && w.hp > 0 ? w : null;
    if (tool === 'move' || tool === 'attack') {
      if (foe && G.dist(u, foe) <= u.reach && (T.attacksLeft || T.action)) return UI.command(B, u, { do: 'attack', target: foe });
      if (tool === 'attack') { if (foe) B.card(['{o}The ' + B.shortName(foe) + ' is out of reach (' + G.dist(u, foe) + ' ft).{/}'], 120); return; }
      var rc = reachCache(B, u), e = rc.move[x + ',' + y];
      if (e && e.stand && (x !== u.x || y !== u.y)) return UI.command(B, u, { do: 'move', x: x, y: y });
      if (rc.dash && rc.dash[x + ',' + y] && rc.dash[x + ',' + y].stand && rc.dash[x + ',' + y].cost > 0) B.card(['{g}That far needs a DASH first (' + rc.dash[x + ',' + y].cost + ' ft).{/}'], 120);
      return;
    }
    if (tool === 'firebolt') {
      if (!foe) return;
      var l = G.los(u, foe);
      if (!l.clear) return B.card(['{o}No line to the ' + B.shortName(foe) + ': ' + l.why + '.{/}'], 120);
      if (G.dist(u, foe) > 120) return B.card(['{o}Out of range (120 ft).{/}'], 120);
      return UI.command(B, u, { do: 'firebolt', target: foe });
    }
    if (tool === 'fireball') {
      if (Math.max(Math.abs(x - u.x), Math.abs(y - u.y)) * 5 > 150 || !G.losPoint(u.x, u.y, x, y)) return B.card(['{o}Fireball needs a point you can see within 150 ft.{/}'], 120);
      return UI.command(B, u, { do: 'fireball', x: x, y: y });
    }
    if (tool === 'misty') {
      if (!B.mistyTargets(u).some(function (q) { return q[0] === x && q[1] === y; })) return B.card(['{o}Misty Step: an open square you can see within 30 ft.{/}'], 120);
      return UI.command(B, u, { do: 'misty', x: x, y: y });
    }
    if (tool === 'lay') {
      var a = w && w.side === u.side && !w.dead ? w : null;
      if (!a) return;
      if (a !== u && G.dist(u, a) > 5) return B.card(['{o}Lay on Hands is touch: ' + a.name + ' is ' + G.dist(u, a) + ' ft away.{/}'], 120);
      return UI.command(B, u, { do: 'lay', target: a });
    }
    if (tool === 'help') {
      if (!foe || G.dist(u, foe) > 5) return B.card(['{o}Help: pick a foe beside you.{/}'], 120);
      return UI.command(B, u, { do: 'help', target: foe });
    }
  }

  UI.openMenu = function (B) { B.menu = { sel: 0, items: ['RESUME', 'RESTART THE FIGHT', 'THE GATE (the sprites)', 'RETURN TO SILVERTON'] }; };
  UI.menuInput = function (B) {
    var M = B.menu, n = M.items.length;
    if (I.repeat('up')) M.sel = (M.sel + n - 1) % n;
    if (I.repeat('down')) M.sel = (M.sel + 1) % n;
    var pick = I.pressed('a') ? M.sel : -1;
    if (I.mouse.click && B.menuRects) B.menuRects.forEach(function (r, i) { if (hit(r)) pick = i; });
    if (I.pressed('b') || I.pressed('menu')) { B.menu = null; return; }
    if (pick < 0) return;
    B.menu = null;
    if (pick === 1) { D.pop(); D.push(new D.Battle()); }
    if (pick === 2) location.search = '?gate';
    if (pick === 3) location.href = '../';   // back to the 8-bit game: nothing is written
  };
  UI.resultInput = function (B) {
    if (I.pressed('a') || I.mouse.click) { D.pop(); D.push(new D.Battle()); }
  };

  // ------------------------------------------------------------------ drawing
  UI.drawBattle = function (ctx, B) {
    var req = B.req, hero = req && req.turn, objs = [];
    B.units.forEach(function (u) { var o = unitObj(B, u); if (o) objs.push(o); });
    FX.list.forEach(function (f) { objs.push({ depth: 1e6, gz: 0, draw: function (c) { f.draw(c); } }); });
    D.iso.draw(ctx, objs, function (c) { overlay(c, B, hero); });
    strip(ctx, B);
    cards(ctx, B);
    tooltip(ctx, B, hero);
    bar(ctx, B, hero);
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
        if (anim === 'idle' || anim === 'walk') t = B.t + (u.id ? u.id.length * 7 : 0);
        if (u.ethereal) { o.alpha = 0.16 + 0.06 * Math.sin(B.t / 9); o.tint = R('violet', 5); o.tintAlpha = 0.9; }
        if (u.conds.hidden && !down) o.alpha = 0.5;
        if (u.flash > 0) { o.tint = R('bone', 2); o.tintAlpha = 0.85; }
        else if (u.conds.faerie && !down && !u.ethereal) { o.tint = R('violet', 5); o.tintAlpha = 0.25 + 0.15 * Math.sin(B.t / 7); }
        // the shadow grounds it
        if (!u.ethereal && !(u.dead && !has('hurt'))) {
          var s = u.size || 1;
          ctx.fillStyle = 'rgba(10,8,16,.38)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 10 * s + 1, 4 * s + 1, 0, 0, 7); ctx.fill();
        }
        D.spr.draw(ctx, u.sheet, anim === 'hurt' && !has('hurt') ? 'idle' : anim, u.facing || 0, t, p.x, p.y, o);
        // a small HP bar over the head
        if (!u.dead && !u.ethereal) {
          var top = D.spr.top(u.sheet), w = u.size > 1 ? 30 : 20, bx = p.x - w / 2, by = p.y - top - 5;
          ctx.fillStyle = R('outline', 0); ctx.fillRect(bx - 1, by - 1, w + 2, 4);
          ctx.fillStyle = R('stone', 1); ctx.fillRect(bx, by, w, 2);
          ctx.fillStyle = u.side === 'foe' ? R('red', 3) : u.hp <= u.maxhp / 4 ? R('fire', 1) : R('moss', 2);
          ctx.fillRect(bx, by, Math.max(0, Math.round(w * u.hp / u.maxhp)), 2);
        }
      }
    };
  }

  // the grid overlay: drawn on the floor, under every sprite
  function fillSq(ctx, x, y, color, alpha, inset) { D.iso.rhombus(ctx, x, y, G.map.gz(x, y), inset || 1); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1; }
  function lineSq(ctx, x, y, color, alpha, inset) { D.iso.rhombus(ctx, x, y, G.map.gz(x, y), inset == null ? 2 : inset); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1; }
  function overlay(ctx, B, u) {
    // the aura of protection: a faint gold ring 10 ft round a standing paladin
    B.units.forEach(function (p) {
      if (p.cls !== 'paladin' || p.lvl < 6 || !G.standing(p) || !RU.canAct(p)) return;
      var inA = function (x, y) { return Math.max(Math.abs(x - p.x), Math.abs(y - p.y)) <= 2; };
      ctx.strokeStyle = R('gold', 3); ctx.globalAlpha = 0.75; ctx.lineWidth = 1;
      for (var y = p.y - 2; y <= p.y + 2; y++) for (var x = p.x - 2; x <= p.x + 2; x++) {
        var s = G.map.at(x, y); if (!s || !s.open) continue;
        var c = D.iso.center(x, y, s.gz), q = D.iso.toScreen(c.x, c.y);
        ctx.beginPath();
        if (!inA(x, y - 1)) { ctx.moveTo(q.x - 32, q.y); ctx.lineTo(q.x, q.y - 16); }
        if (!inA(x + 1, y)) { ctx.moveTo(q.x, q.y - 16); ctx.lineTo(q.x + 32, q.y); }
        if (!inA(x, y + 1)) { ctx.moveTo(q.x + 32, q.y); ctx.lineTo(q.x, q.y + 16); }
        if (!inA(x - 1, y)) { ctx.moveTo(q.x, q.y + 16); ctx.lineTo(q.x - 32, q.y); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
    // the active unit's square
    if (B.active && !B.active.ethereal) G.foot(B.active).forEach(function (q) { lineSq(ctx, q[0], q[1], R('gold', 4), 0.9, 3); });
    if (!u) return;
    var T = u.turn, tool = B.tool, cx = B.cursor.x, cy = B.cursor.y;
    if (tool === 'move' || tool === 'attack') {
      var rc = reachCache(B, u);
      if (rc.dash) Object.keys(rc.dash).forEach(function (k) { var e = rc.dash[k]; if (e.stand && !rc.move[k]) fillSq(ctx, e.x, e.y, R('glow', 1), 0.07); });
      Object.keys(rc.move).forEach(function (k) { var e = rc.move[k]; if (e.stand && e.cost > 0) fillSq(ctx, e.x, e.y, R('glow', 1), 0.17); });
      if (T.attacksLeft || T.action) B.units.forEach(function (w) {
        if (!G.hostile(u, w) || !G.standing(w) || G.dist(u, w) > u.reach) return;
        G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], R('red', 4), 0.9); });
      });
      // the path to the cursor
      var e2 = rc.move[cx + ',' + cy] || (rc.dash && rc.dash[cx + ',' + cy]);
      if (e2 && e2.stand && !G.occupant(cx, cy, u)) {
        var path = G.path(rc.dash && rc.dash[cx + ',' + cy] && !rc.move[cx + ',' + cy] ? rc.dash : rc.move, cx, cy) || [];
        path.forEach(function (q) { var c = D.iso.center(q[0], q[1], G.map.gz(q[0], q[1])), s = D.iso.toScreen(c.x, c.y); ctx.fillStyle = R('bone', 2); ctx.fillRect(s.x - 1, s.y - 1, 2, 2); });
      }
      // flanking: a faint gold line from the hero through the foe to the ally opposite
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
    if (tool === 'firebolt') B.units.forEach(function (w) {
      if (!G.hostile(u, w) || !G.standing(w)) return;
      var l = G.los(u, w); if (!l.clear || G.dist(u, w) > 120) return;
      G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], R('red', 4), 0.9); });
    });
    if (tool === 'fireball' && G.losPoint(u.x, u.y, cx, cy)) G.sphere(cx, cy, 20).forEach(function (q) { fillSq(ctx, q[0], q[1], R('fire', 1), 0.35); });
    if (tool === 'misty') B.mistyTargets(u).forEach(function (q) { lineSq(ctx, q[0], q[1], R('glow', 2), 0.6, 4); });
    if (tool === 'lay') B.units.forEach(function (w) { if (w.side === u.side && !w.dead && (w === u || G.dist(u, w) <= 5)) G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], R('gold', 4), 0.9); }); });
    if (tool === 'help') B.units.forEach(function (w) { if (G.hostile(u, w) && G.standing(w) && G.dist(u, w) <= 5) G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], R('bone', 2), 0.9); }); });
    // the cursor
    var s0 = G.map.at(cx, cy);
    if (s0 && s0.open) lineSq(ctx, cx, cy, R('bone', 2), 1, 1);
  }

  // ------------------------------------------------------------------ the initiative strip, top left
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

  // ------------------------------------------------------------------ the roll cards, top middle, oldest dimmest
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

  // ------------------------------------------------------------------ the tooltip: the unit under the cursor
  function tooltip(ctx, B, u) {
    if (B.inspect || (B.req && (B.req.prompt || B.req.entry))) return;
    var w = G.occupant(B.cursor.x, B.cursor.y);
    if (!w || w === B.active) return;
    var lines = [(w.side === 'foe' ? '{r}' : '{c}') + w.name + '{/}  HP ' + w.hp + '/' + w.maxhp + '  AC ' + RU.ac(w) + conds(w)];
    if (u && G.hostile(u, w) && !w.dead) {
      var d = G.dist(u, w), l = G.los(u, w), e = RU.edges(u, w, B.tool === 'firebolt' ? { spell: true, ranged: true, range: [120, 120] } : u.weapon);
      var bits = [d + ' ft' + (d <= u.reach ? ' {n}in reach{/}' : '')];
      if (!l.clear) bits.push('{o}no line{/}');
      else if (l.cover && d > 5) bits.push('{c}half cover (+2): ' + l.why + '{/}');
      if (e.adv.length) bits.push('{n}adv: ' + e.adv.join(', ') + '{/}');
      if (e.dis.length) bits.push('{o}dis: ' + e.dis.join(', ') + '{/}');
      lines.push(bits.join('  '));
    }
    var ww = 0; lines.forEach(function (l) { ww = Math.max(ww, D.textWidth(l)); });
    var x = D.W - ww - 12, y = BAR_Y - lines.length * 9 - 8;
    ctx.fillStyle = 'rgba(10,8,16,.82)'; ctx.fillRect(x, y, ww + 8, lines.length * 9 + 4);
    lines.forEach(function (l, k) { D.text(ctx, l, x + 4, y + 2 + k * 9, R('bone', 1)); });
  }
  function conds(w) {
    var c = [];
    if (w.ethereal) c.push('{p}ethereal{/}');
    if (w.conds.poisoned) c.push('{n}poisoned{/}');
    if (w.conds.faerie) c.push('{p}faerie fire{/}');
    if (w.conds.hidden) c.push('{c}hidden{/}');
    if (w.conds.dodge) c.push('{c}dodging{/}');
    if (w.conds.shield) c.push('{c}shield{/}');
    if (w.conds.helped) c.push('{w}helped{/}');
    if (w.hp <= 0 && !w.dead) c.push('{r}down{/}');
    return c.length ? '  ' + c.join(' ') : '';
  }

  // ------------------------------------------------------------------ the bottom bar
  function bar(ctx, B, hero) {
    var u = hero || B.active;
    ctx.fillStyle = 'rgba(10,8,16,.9)'; ctx.fillRect(0, BAR_Y, D.W, D.H - BAR_Y);
    ctx.fillStyle = R('silver', 2); ctx.fillRect(0, BAR_Y, D.W, 1);
    B.buttons = [];
    if (!u) { D.text(ctx, B.result ? '' : '...', 8, BAR_Y + 16, R('accent', 2)); return; }
    // portrait: the unit's own sprite, cropped to head and shoulders
    ctx.fillStyle = R('stone', 1); ctx.fillRect(4, BAR_Y + 4, 36, 38);
    ctx.save(); ctx.beginPath(); ctx.rect(4, BAR_Y + 4, 36, 38); ctx.clip();
    var top = D.spr.top(u.sheet);
    D.spr.draw(ctx, u.sheet, 'idle', 0, B.t, 22, BAR_Y + 6 + Math.min(top, u.size > 1 ? 30 : 44), { alpha: u.ethereal ? 0.3 : 1 });
    ctx.restore();
    ctx.strokeStyle = u.side === 'foe' ? R('red', 3) : R('gold', 3); ctx.strokeRect(4.5, BAR_Y + 4.5, 35, 37);
    // name, HP, AC, conditions
    D.text(ctx, u.name, 44, BAR_Y + 4, u.side === 'foe' ? R('red', 4) : R('gold', 4));
    D.text(ctx, u.side === 'foe' ? 'foe' : (u.cls + ' ' + u.lvl), 44 + D.textWidth(u.name) + 6, BAR_Y + 4, R('accent', 2));
    ctx.fillStyle = R('stone', 1); ctx.fillRect(44, BAR_Y + 15, 100, 4);
    ctx.fillStyle = u.side === 'foe' ? R('red', 3) : R('moss', 2); ctx.fillRect(44, BAR_Y + 15, Math.round(100 * Math.max(0, u.hp) / u.maxhp), 4);
    D.text(ctx, 'HP ' + u.hp + '/' + u.maxhp + '   AC ' + RU.ac(u), 44, BAR_Y + 21, R('bone', 1));
    D.text(ctx, conds(u).trim() || (u.slots && u.slots.length ? 'slots ' + u.slots.map(function (n, i) { return (i + 1) + ':' + n; }).join(' ') : ''), 44, BAR_Y + 31, R('accent', 2));
    if (!hero) { D.text(ctx, u.ethereal ? 'moving unseen...' : 'its turn', 160, BAR_Y + 16, R('accent', 2)); return; }
    // the four pips
    var T = u.turn;
    pip(ctx, 150, BAR_Y + 4, 'MOVE ' + T.move, T.move > 0, R('glow', 1));
    pip(ctx, 206, BAR_Y + 4, 'ACTION', T.action > 0 || T.attacksLeft > 0, R('gold', 3));
    pip(ctx, 150, BAR_Y + 17, 'BONUS', T.bonus > 0, R('glow', 2));
    pip(ctx, 206, BAR_Y + 17, 'REACTION', u.reaction > 0, R('violet', 4));
    var eb = { x: 150, y: BAR_Y + 30, w: 110, h: 11, end: true };
    B.buttons.push(eb);
    ctx.fillStyle = B.hoverBtn === B.buttons.length - 1 ? R('stone', 3) : R('stone', 1); ctx.fillRect(eb.x, eb.y, eb.w, eb.h);
    D.text(ctx, 'SPACE  END TURN', eb.x + 4, eb.y + 2, R('bone', 1));
    // the commands
    var cmds = B.commands(u);
    cmds.forEach(function (c, i) {
      var col = i % 3, row = Math.floor(i / 3), b = { x: 266 + col * 71, y: BAR_Y + 4 + row * 13, w: 69, h: 11, cmd: c };
      B.buttons.push(b);
      var hov = B.hoverBtn === B.buttons.length - 1, on = c.tool && B.tool === c.tool;
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
    D.text(ctx, names.join(', ') + ' come in from ' + (from.from === 'the fixture' ? 'the fixture (no 8-bit save on this origin)' : from.from + (ago ? ', saved ' + (ago < 120 ? ago + ' min' : Math.round(ago / 60) + ' h') + ' ago' : '')) + '.', D.W / 2, 136, R('bone', 1), 'center');
    D.text(ctx, 'Two drow on the ledge. Something in the stalagmites.', D.W / 2, 150, R('accent', 2), 'center');
    if ((B.t >> 5) & 1) D.text(ctx, 'E to begin', D.W / 2, 176, R('glow', 2), 'center');
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
    var M = B.menu, w = 170, h = M.items.length * 13 + 12, x = (D.W - w) / 2, y = 80;
    box(ctx, x, y, w, h);
    B.menuRects = [];
    M.items.forEach(function (it, i) {
      var r = { x: x + 6, y: y + 6 + i * 13, w: w - 12, h: 12 };
      B.menuRects.push(r);
      if (i === M.sel) { ctx.fillStyle = R('gold', 1); ctx.fillRect(r.x, r.y, r.w, r.h); }
      D.text(ctx, it, r.x + 6, r.y + 2, i === M.sel ? R('gold', 4) : R('bone', 1));
    });
  }
})();
