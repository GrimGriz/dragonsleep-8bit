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
  // PACE (10-01, Griz: "if adjustable, slow down the ai-turn and message display times by 25%"): D.PACE, read by battle.js (Battle.prototype.pace) --
  // 1.25 by default; the M menu's PACE row cycles 1 / 1.25 / 1.5 and keeps it here with the rest; ?pace=1.5 in the address overrides it for that page only
  UI.opts = { help: false, style: 'ring', autoEnd: true, pace: 1.25 };
  UI.PACES = [1, 1.25, 1.5];
  try { var o0 = JSON.parse(window.localStorage.getItem('deep16.opts') || 'null'); if (o0) { if (o0.style === 'window') UI.opts.style = 'window'; if (o0.autoEnd === false) UI.opts.autoEnd = false; if (UI.PACES.indexOf(o0.pace) >= 0) UI.opts.pace = o0.pace; } } catch (e) { }
  UI.saveOpts = function () { try { window.localStorage.setItem('deep16.opts', JSON.stringify(UI.opts)); } catch (e) { } };
  var qs = /[?&]menu=(window|ring)/.exec(location.search); if (qs) UI.opts.style = qs[1];
  D.PACE = UI.opts.pace;
  var pq = /[?&]pace=([0-9.]+)/.exec(location.search); if (pq && +pq[1] >= 0.5 && +pq[1] <= 3) D.PACE = +pq[1];
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
      // READY's trigger asked (battle.js exec 'ready'): the wheel of what can be held for it
      if (B.readying && B.readying.who === req.turn) { B.tool = 'menu'; B.list = readyRing(B, req.turn); B.ringB = null; B.ringStill = false; B.clearCards(); B.card([D.keys('{y}READY{/}: ' + readyWhenText(B.readying.trigger) + ' -- what do you hold for it?  {g}X back{/}')], 100000); }
      else B.readying = null;
    }
    B.readyAim = req.aim || null;
    if (req.aim) aimStart(B, req.aim);
    if (req.prompt) { B.sel = 0; D.sfx('popup'); if (req.prompt.pick && req.prompt.pick[0]) { var p0 = req.prompt.pick[0]; B.cursor = { x: p0.x, y: p0.y }; showCursor(B); } } // (a pick on the grid: the cursor on the first of them)
    if (req.entry) B.entryT = B.t;
    if (req.scene) { // a cutscene beat: its clip starts with it, and the beat holds at least as long as the clip runs
      var sc = req.scene; sc.t = 0;
      if (sc.clip) { var a = D.clip(sc.clip); if (a) a.addEventListener('loadedmetadata', function () { if (isFinite(a.duration)) sc.frames = Math.max(sc.frames || 0, Math.ceil(a.duration * 60) + 40); }); }
    }
  };
  function reachCache(B, u) {
    var T = u.turn, key = u.x + ',' + u.y + ',' + T.move + ',' + T.action + ',' + T.bonus + ',' + T.attacksLeft + ',' + B.units.map(function (w) { return w.x + ':' + w.y + ':' + (w.dead || w.hp <= 0 ? 0 : RU.canAct(w) ? 1 : 2) + (w.ethereal ? 'e' : ''); }).join(';') + (B.webs || []).length;
    if (B.cache && B.cache.key === key) return B.cache;
    var held = !!u.conds.restrained, dash = held ? 0 : u.speed * D.Battle.dashes(u).length; // (both dashes, where it has both: 10-04 -- the action's and a Cunning Action's)
    B.cache = { key: key + (held ? ',held' : ''), move: G.reach(u, held ? 0 : T.move), dash: dash ? G.reach(u, T.move + dash) : null, hide: null };
    return B.cache;
  }
  // a rogue's places to try hiding: squares she can reach where no foe sees her clearly -- cover, the dark, its eyes (battle.js seenBy, the
  // same question the HIDE roll asks: 10-01b, Griz: "I think I'm getting conflicting rogue-hiding hints")
  function hideSpots(B, u) {
    var rc = reachCache(B, u);
    if (rc.hide) return rc.hide;
    var foes = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && RU.canAct(w); });
    rc.hide = {};
    [rc.move, rc.dash || {}].forEach(function (m) {
      Object.keys(m).forEach(function (k) {
        var e = m[k]; if (!e.stand || rc.hide[k] != null) return;
        // (she, standing there: moved there for the look and back -- a stand-in left her real body on her own square as cover, so the squares behind her
        // tinted as hiding places a foe saw plainly; the rogue runner's find, 10-01c)
        var ox = u.x, oy = u.y; u.x = e.x; u.y = e.y;
        try { rc.hide[k] = foes.every(function (f) { var n = B.nearOf(f, u); return !n || !n.bonus; }); } finally { u.x = ox; u.y = oy; }
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
  var SKILLS = { lay: 1, sacred: 1, secondwind: 1, surge: 1, ignite: 1, douse: 1 }, ACTIONS = { search: 1, dash: 1, disengage: 1, cdash: 1, cdisengage: 1, dodge: 1, help: 1, ready: 1, leave: 1, droptorch: 1, throwtorch: 1, dousetorch: 1, pickuptorch: 1, hooddown: 1, hoodup: 1, putaway: 1, drawweapon: 1 }; // (putaway, drawweapon: the weapon put away and drawn, 10-05) // (ready: the Ready action, 10-02 -- battle.js exec 'ready')
  function group(id, label, list) {
    return { id: id, label: label, cost: '', ok: list.some(function (x) { return x.ok; }), why: 'nothing there to do now', sub: id, icon: id, items: list };
  }
  // the wizard's cantrip in the swing's place on the first ring, his staff among the ACTIONS (Griz, 09-28: "put Aurdin's attack
  // in with his 'dodge/dash' and the default wizard cantrip ... on the first ring where it was ... still keep it in [the] list")
  // the bread and butter on the first ring for the rest (10-01c, Griz: "For classes other than rogue (hide) and wizard (fire bolt) we should do like we did for them
  // and have the bread & butter go-to on the first ring ... warlocks probably their attack cantrip, etc) - test like warlock bugbear help reveal what should be on
  // the ring"): the ring survey (dev/bench16.js mode=ringsurvey: each class alone against a brute and a pack at 1, 3, 5 and 9, what its tactics reach for, by the share
  // of its turns) -- QUICK: the cantrip in the swing's place, its weapon among the ACTIONS, where the weapon goes unused (the warlock's Eldritch Blast 58-71% from 3 --
  // at 1, before Agonizing Blast, its crossbow 89%; the sorcerer's Fire Bolt 54-88% from 5; the druid's Produce Flame, the druid never swinging); BESIDE: by the swing,
  // where the weapon still earns its keep early (the cleric's Sacred Flame 42-57% from 5, the mace 47% at 1; the bard's Vicious Mockery 23-48% from 5, the rapier 71%
  // at 1; the ranger's Hunter's Mark, a bonus action, 67-73% from 5, the longbow its action); FRONT: the feature a martial opens or follows with, out of SKILLS
  // (the barbarian's RAGE; the monk's BONUS STRIKE / FLURRY OF BLOWS, its Unarmed Strike a third to two thirds of its turns). The fighter, the paladin and the rogue
  // swing first already (Greatsword 72-91%, Longsword 62-84%, Rapier 71-92%; the rogue's HIDE beside it)
  var QUICK = { wizard: 'firebolt', sorcerer: 'firebolt', warlock: 'eldritchblast' };
  var BESIDE = { cleric: 'sacredflame', bard: 'viciousmockery', ranger: 'huntersmark', druid: 'produceflame' }; // (the druid moved here from QUICK the same day: taught Shillelagh, it smacks with the staff on three turns in four at 1 -- the druid runner, 10-01c)
  var FRONT = { barbarian: 'rage', monk: 'flurry' };
  // AGAIN: a spell up and used again -- the Spiritual Weapon's swing, a beam moved, Heat Metal's flare, the next bolt (e.g.again: js/magic.js M.list) -- on the
  // first ring while it holds (10-01c, Griz: "how crowded is clerics first ring? it wouldn't appear until SW was cast but could be added on these grounds once it
  // was cast"): the survey's cleric swings its weapon on three turns in four from 3 (a bonus action), the bard's flare and the druid's beam are the same kind
  function againSpell(B, u) {
    if (u.guest) return null;
    var e = D.magic.list(B, u).filter(function (x) { return x.g && x.g.again; })[0];
    return e ? Object.assign(e, { kind: 'spell', label: e.name.toUpperCase(), quick: true }) : null;
  }
  function quickSpell(B, u, map) {
    var id = !u.guest && (map || QUICK)[u.cls], e = id && D.magic.list(B, u).filter(function (x) { return x.id === id; })[0];
    return e ? Object.assign(e, { kind: 'spell', label: e.name.toUpperCase(), quick: true }) : null;
  }
  // the Channel Divinity's options, one list of their own beside SPELLS (RULED 09-30, Griz: "should the channel divinity be a button similar to
  // spells?" -- "yes"): they draw on one use (u.feats.channel), and the list says how many are left
  var CHANNEL = { sacred: 1, turnundead: 1, turnunholy: 1, preservelife: 1, doubling: 1, showing: 1, holddoor: 1 };
  UI.cmds = function (B, u) {
    if (D.keeperPlay && D.keeperPlay.human(B, u)) return D.keeperPlay.ring(B, u); // (?keeperfight&play=keeper: the Keeper's own ring -- js/keeperplay.js)
    var c = B.commands(u), top = {}, sk = [], ac = [], cd = [], q = quickSpell(B, u), q2 = quickSpell(B, u, BESIDE), fr = !u.guest && FRONT[u.cls];
    // (x.skill: a class feature's button from js/features.js F.commands -- Rage, the Channel Divinities, the subclasses' own)
    c.forEach(function (x) { if (CHANNEL[x.id]) { cd.push(x); return; } if (fr && x.id === fr) { top.front = x; return; } if (SKILLS[x.id] || x.skill || (q && x.id === 'attack')) (SKILLS[x.id] || x.skill ? sk : ac).push(x); else if (ACTIONS[x.id]) ac.push(x); else top[x.id] = x; });
    if (q) top.attack = q;
    if (q2) top.beside = q2;
    var q3 = againSpell(B, u); if (q3 && !(q && q.id === q3.id) && !(q2 && q2.id === q3.id)) top.again = q3; // (Hunter's Mark moved: BESIDE has it already)
    var out = [{ id: 'move', label: 'MOVE', cost: 'M', ok: u.turn.move > 0 && !u.conds.restrained, tool: 'move', icon: 'move' }];
    ['attack', 'beside', 'again', 'front', 'hide', 'breakfree', 'detach', 'breaktendril', 'takerope', 'bucketrope', 'passage', 'spells'].forEach(function (k) { if (top[k]) out.push(top[k]); }); // (detach: PULL IT OFF, the darkmantle -- 10-01, Griz: "Didn't see a pull it off out there"; breaktendril: BREAK THE TENDRIL, the roper's -- 10-02; takerope, bucketrope: TAKE THE ROPE and TAKE A ROPE, 10-04 night -- the first sat under ACTIONS where nothing listed it, Griz: "never managed to take up the hook")
    if (cd.length) { var left = (u.feats && u.feats.channel) || 0; out.push({ id: 'channel', label: 'CHANNEL DIVINITY (' + left + ')', cost: 'A', ok: cd.some(function (x) { return x.ok; }), why: left ? 'nothing there to do now' : 'spent (a short rest brings it back)', sub: 'channel', icon: 'sacred', items: cd }); }
    if (sk.length) out.push(group('skills', 'SKILLS', sk));
    if (top.items) out.push(top.items);
    if (ac.length) out.push(group('actions', 'ACTIONS', ac));
    return out.concat([{ id: 'end', label: 'END TURN', cost: 'F', ok: true, icon: 'end' }]);
  };

  // ------------------------------------------------------------------ the camera: look where you like (the edge, a middle-drag), C comes back
  // the zoom steps: whole device pixels per art pixel at the backing scale (at 3x: 1, 2/3, 1/3), never under a third -- and on a floor too big to fit at that, the far steps
  // (10-04 night, Griz: "can we have huge maps and another zoom level when we do?"): whole art pixels to a device pixel (at 3x: 1/6, then 1/9), one after another down to the
  // first that shows the whole floor, capped where the world canvas (D.W/z by D.H/z, drawBattle) would pass FAR_PX. A small cave gets none; the Edifice one; a 60x46 two. Drawn smoothed
  var FAR_PX = 12e6;
  function zooms() {
    var R = D.R, L = []; for (var k = R; k >= 1; k--) if (k / R >= 0.33) L.push(k / R); if (L.length < 2) L.push(0.5);
    var bk = D.iso.map && D.iso.map.bake, lo = L[L.length - 1];
    if (bk) { var fit = Math.min(D.W / bk.canvas.width, D.H / bk.canvas.height); for (var n = 1; n <= 12 && lo > fit; n++) { var z = 1 / (R * n); if (z < lo - 1e-9 && (D.W / z) * (D.H / z) <= FAR_PX) { L.push(z); lo = z; } } }
    return L;
  }
  UI.zooms = zooms;
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
    var free = !m.drag && !B.menu && !(B.req && ((B.req.prompt && !B.req.prompt.pick) || B.req.entry)); // (a pick on the grid looks round as a turn does)
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
    if (req.aim) return aimInput(B, req.aim);
    if (req.turn) return turnInput(B, req.turn);
  };
  // ------------------------------------------------------------------ READY (battle.js exec 'ready', readySpring; 10-02): the wheel of what can be held, and the aim when it springs
  function readyWhenText(trig) { return trig === 'ally' ? 'when a foe attacks one of us in sight' : trig === 'down' ? 'when one of us goes down' : trig === 'cast' ? 'when a foe in sight casts a spell' : 'when a foe comes within reach (for a bow or a spell: into sight, or one in sight moves)'; }
  // only what can be readied is on it (Griz: "we'll just not have buttons they can't click (except the grayed out level tier buttons (i.e. willem)"): the weapon, the
  // other one, SPELLS (the spells that take an action, by level), MOVE
  function readiable(e) { return !!(e && e.ok && e.g && e.g.time === 'A'); }
  function readyRing(B, u) {
    var items = [];
    [['weapon', u.weapon], ['alt', u.alt]].forEach(function (p) { var wp = p[1]; if (wp && wp.name && !u.conds.disarmed) items.push({ kind: 'readypick', what: p[0], id: 'attack', icon: 'attack', name: wp.name.toUpperCase(), label: wp.name.toUpperCase(), ok: true, note: 'one ' + (wp.ranged ? 'shot' : 'swing') + ' at the one you pick when it springs' }); });
    if (D.magic.list(B, u, { anyTarget: true }).some(readiable)) items.push({ kind: 'readylevels', id: 'spells', icon: 'spells', name: 'SPELLS', label: 'SPELLS', ok: true, note: 'cast now and held: the slot spent, and concentration' });
    if (u.speed > 0 && !u.conds.restrained) items.push({ kind: 'readypick', what: 'move', id: 'move', icon: 'move', name: 'MOVE', label: 'MOVE', ok: true, note: 'up to your speed, to the square you pick when it springs (the Dash, on a reaction)' });
    // the features and plain actions that take the action (10-02, Griz: "1 - yes but not disengage ... you get to ready an action not store movement"): Lay on Hands, a
    // Channel Divinity, Help, Dodge, Hide ... -- not the swing (the weapon above), the spells, Dash (the MOVE is it), Disengage, nor what costs the bonus action
    var NOT = { attack: 1, spells: 1, ready: 1, end: 1, move: 1, dash: 1, disengage: 1, cdash: 1, cdisengage: 1, leave: 1, items: 1 };
    B.commands(u).forEach(function (c) { if (c.cost === 'A' && c.ok && !NOT[c.id] && !c.sub) items.push({ kind: 'readypick', what: 'cmd', cmd: c.id, id: c.id, icon: c.icon || c.id, name: c.label, label: c.label, ok: true, note: c.note }); });
    // and an item (Griz: "Add usable items beyond potions as well"): a potion for the one who falls, a flask for the foe who comes
    if (B.itemList(u).some(function (e) { return e.ok && e.id !== 'rope'; })) items.push({ kind: 'readyitems', id: 'items', icon: 'item', name: 'ITEM', label: 'ITEM', ok: true, note: 'a potion, a flask, a light: used when it springs' });
    return { kind: 'ready', items: items, sel: 0, title: 'READY' };
  }
  // the spell levels, as the SPELLS ring has them -- a tier with no slot (or nothing to ready) greyed, never hidden -- and in each only the spells that can be readied
  function readyLevels(B, u) {
    var all = D.magic.list(B, u, { anyTarget: true }), lv = {}, items = [];
    all.forEach(function (e) { (lv[e.level] = lv[e.level] || []).push(e); });
    Object.keys(lv).map(Number).sort(function (a, b) { return a - b; }).forEach(function (L) {
      var slots = L ? (u.slots[L - 1] || 0) : null, can = lv[L].filter(readiable);
      items.push({ kind: 'level', level: L, name: L ? 'LEVEL ' + L : 'CANTRIPS', label: L ? 'LEVEL ' + L + ' · ' + slots + ' slot' + (slots === 1 ? '' : 's') : 'CANTRIPS', ok: can.length > 0, why: can.length ? '' : L && !slots ? 'no level-' + L + ' slots left' : 'nothing there to ready', spells: can });
    });
    var first = 0; items.some(function (e, i) { if (e.ok) { first = i; return true; } return false; });
    return { kind: 'levels', items: items, sel: first, title: 'READY: SPELLS' };
  }
  // the readied thing sprung (req.aim): its tool up for the one holding it -- the blade's swing, the spell's aim, the move -- and the cursor on the one that set it off
  function aimStart(B, a) {
    var u = a.who, rd = a.rd, f = a.ctx.foe || a.ctx.ally, ef = a.ctx.effect;
    // (a spell seen by what it does: the cursor on that -- a Dispel readied goes at the effect, and an unseen caster gives nothing away)
    if (ef && ((rd.what === 'spell' && D.magic.geo(rd.id).effects) || (f && !D.magic.sees(B, u, f)))) { var e0 = (ef.sq || [])[0], u0 = (ef.units || []).filter(function (x) { return x === u || D.magic.sees(B, u, x); })[0]; f = e0 ? { x: e0[0], y: e0[1] } : u0 || f; }
    B.list = null; B.picks = []; B.spell = null; B.cache = null; B.inspect = null;
    if (f) { B.cursor = { x: f.x, y: f.y }; showCursor(B); }
    if (rd.what === 'weapon') B.tool = 'attack';
    else if (rd.what === 'move') B.tool = 'move';
    else if (rd.what === 'cmd') B.tool = rd.tool; // (Help, Lay on Hands: their own tool, as on a turn)
    else if (rd.what === 'item') { B.tool = 'item'; B.itemId = rd.item; }
    else {
      var e = D.magic.list(B, u, { anyTarget: true }).filter(function (x) { return x.id === rd.id; })[0], g = D.magic.geo(rd.id);
      B.spell = { id: rd.id, slot: rd.slot, g: g, sp: e && e.sp, n: (g.n || 1) + Math.max(0, (rd.slot || 0) - (rd.level || 0)), name: rd.name };
      B.tool = 'spell';
    }
    var how = rd.what === 'weapon' ? 'click the foe to strike' : rd.what === 'move' ? 'click the square to move to' : rd.what === 'item' ? 'click who it is for' : 'aim it as you would on your turn';
    D.sfx('popup'); B.clearCards();
    B.card([D.keys('{o}' + u.name + '{/}, the readied ' + (rd.what === 'move' ? 'move' : rd.name) + ': ' + a.ctx.why + '  ' + how + '.  {g}X or the right button holds it{/}')], 100000);
  }
  function holdAim(B) { D.sfx('cancel'); B.readyAim = null; B.tool = rest(); B.spell = null; B.picks = []; B.clearCards(); B.answer(null); }
  function aimInput(B, a) {
    var u = a.who, rd = a.rd;
    if (B.inspect && (I.pressed('a') || I.pressed('b') || I.mouse.click || I.mouse.rclick)) { B.inspect = null; return; }
    B.hoverBtn = -1;
    if (I.mouse.inside && !overUI(B) && I.mouse.moved) { var pu = UI.pickUnit(B, I.mouse.x, I.mouse.y, rd.what === 'weapon' ? foeWanted(B, u) : null), s = pu ? { x: pu.x, y: pu.y } : D.iso.pick(I.mouse.x, I.mouse.y, G.map.gz(B.cursor.x, B.cursor.y)); B.hoverUnit = pu; if (s) { B.cursor.x = s.x; B.cursor.y = s.y; } }
    if (I.mouse.inside) (B.buttons || []).forEach(function (b, i) { if (hit(b)) B.hoverBtn = i; });
    B.peek = B.tool === 'spell' && B.spell ? underCursor(B) || null : null;
    ['up', 'down', 'left', 'right'].forEach(function (k) { if (k !== I.stickWay && I.repeat(k)) moveCursor(B, k); });
    if (I.repeat('stick')) stickCursor(B);
    if (I.mouse.rbtn || I.pressed('b')) { if (B.picks && B.picks.length) { D.sfx('cancel'); B.picks.pop(); return; } return holdAim(B); }
    if (I.mouse.click && B.hoverBtn >= 0 && B.buttons[B.hoverBtn].cast) return castPicks(B, u); // (the allies' CAST button)
    var byKey = I.pressed('a'), go = byKey || (I.mouse.click && !overUI(B));
    if (!go) return;
    var x = B.cursor.x, y = B.cursor.y, w = occ(x, y);
    if (rd.what === 'weapon') {
      var foe = (w && G.hostile(u, w) && !w.dead && w.hp > 0 ? w : null) || D.Battle.riderOn(u, w, B.units) || D.Battle.tendrilOn(u, w, B.units);
      if (foe && B.canHit(u, foe)) return UI.command(B, u, { do: 'attack', target: foe });
      D.sfx('error'); return B.card(['{o}' + (foe ? 'The ' + B.shortName(foe) + ' is out of ' + (u.weapon && u.weapon.ranged ? 'range' : 'reach') + ' (' + G.dist(u, foe) + ' ft)' : 'Not a foe there') + '.  X holds it.{/}'], 120);
    }
    if (rd.what === 'move') {
      if (w && w !== u) { D.sfx('error'); return; }
      if (UI.valid(B, u, x, y) === 'ok') return UI.command(B, u, { do: 'move', x: x, y: y });
      D.sfx('error'); return;
    }
    return actAt(B, u, x, y, byKey); // (the spell's own aim -- or the item's, Help's, Lay on Hands': js/ui.js actAt, its command an answer like any)
  }
  // a cutscene beat runs its frames; after its first second E or a click moves it on
  function sceneInput(B, sc) {
    sc.t = (sc.t || 0) + 1;
    if (sc.tick) sc.tick(sc.t); // (a picture's sounds on its own frames: the landlord's clackers, js/wet.js W.SOUND)
    if (sc.t >= (sc.frames || 120) || (sc.t > 60 && (I.pressed('a') || I.pressed('end') || I.mouse.click))) B.answer();
  }
  // a prompt that picks one of its creatures (js/features.js pickOne): on the grid, not a row of numbered buttons -- the cursor (the arrows,
  // the stick, the mouse) on one of the gold squares, E or a click takes it; X is not now; 1-9 still take them in the prompt's order
  function pickAt(B, p) { return p.pick.filter(function (w) { return G.foot(w).some(function (q) { return q[0] === B.cursor.x && q[1] === B.cursor.y; }); })[0] || null; }
  function pickInput(B, p) {
    var n = p.opts.length, take = function (w) { var i = w ? p.pick.indexOf(w) : -1; if (i < 0) { D.sfx('error'); return; } D.sfx('confirm'); B.answer(p.opts[i].value); };
    if (I.pressed('b')) { D.sfx('cancel'); return B.answer(p.opts[n - 1].value); }
    for (var k = 1; k <= Math.min(9, p.pick.length); k++) if (I.pressed('n' + k)) return take(p.pick[k - 1]);
    var pickable = function (w) { return p.pick.indexOf(w) >= 0; }; // (one of the gold squares' creatures comes before a figure in front of it: UI.pickUnit's want)
    if (I.mouse.inside && !overUI(B) && I.mouse.moved) { var pu = UI.pickUnit(B, I.mouse.x, I.mouse.y, pickable), s = pu ? { x: pu.x, y: pu.y } : D.iso.pick(I.mouse.x, I.mouse.y, G.map.gz(B.cursor.x, B.cursor.y)); if (s) { B.cursor.x = s.x; B.cursor.y = s.y; } }
    ['up', 'down', 'left', 'right'].forEach(function (d) { if (d !== I.stickWay && I.repeat(d)) moveCursor(B, d); });
    if (I.repeat('stick')) stickCursor(B);
    if (I.mouse.click && !overUI(B)) { var pc = UI.pickUnit(B, I.mouse.x, I.mouse.y, pickable); return take(pc && p.pick.indexOf(pc) >= 0 ? pc : pickAt(B, p)); }
    if (I.pressed('a')) return take(pickAt(B, p));
  }
  function promptInput(B, p) {
    if (p.pick) return pickInput(B, p);
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
    B.hoverUnit = null; B.ropePick = null; // (the keys move the cursor: the mouse's figure is no longer the one meant -- hoveredRider; nor the rope's rung -- ropeRung)
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
    B.hoverUnit = null; // (the stick moves the cursor: as moveCursor)
    var d = OCT[I.stickOct], m = G.map;
    if (!d) return;
    var x = D.clamp(B.cursor.x + d[0], 0, m.w - 1), y = D.clamp(B.cursor.y + d[1], 0, m.h - 1);
    if (x === B.cursor.x && y === B.cursor.y) return;
    B.cursor.x = x; B.cursor.y = y;
    showCursor(B);
  }
  // the figure under the mouse (its whole sprite, front-most first): clicking a body selects its owner, not the floor behind
  // `want` (optional): of the figures under the mouse, one it wants comes before the front-most (10-01, RULED, Griz: "if they're targeting something that asks
  // for a foe, the picker should prefer over allies head at least" -- the darkmantle behind Vivian's head was hers to click, not the darkmantle's)
  // a square's creature, or the Keeper's Ice Wall there as something to strike (js/keeper.js K.wallAt): the four places a click or a key aims a blow
  function occ(x, y) { return G.occupant(x, y) || (D.keeper && D.keeper.wallAt ? D.keeper.wallAt(D.battle, x, y) || D.keeper.swirlAt(D.battle, x, y) : null); }
  UI.pickUnit = function (B, mx, my, want) {
    var best = null, bd = -1e9, pick = null, pd = -1e9, z = D.iso.zoom;
    B.units.forEach(function (u) {
      if (u.dead || u.ethereal || u.object) return;
      var p = u.riding && u.master ? perchPos(B, u, z) : unitPos(B, u), s = u.size || 1, top = (u.hp > 0 ? D.spr.unitTop(u) : 16) * z, hw = (s > 1 ? 30 : 11) * Math.max(1, D.spr.scaleOf(u)) * z; // (a rider where it is drawn: on the head, at the shoulder)
      var lf = !u.riding && lyingFrame(u), lm = lf && D.spr.frameMask(u.sheet, lf[0], u.facing || 0, lf[1]), lk = D.spr.scaleOf(u) * z; // (lying flat: the frame it lies at, its pixels as drawn -- sprites.js S.frameMask, 10-05)
      var onLie = !!lm && D.spr.frameHit(lm, (mx - p.x) / lk, (my - p.y) / lk, 2);
      if (!onLie && !(mx >= p.x - hw && mx <= p.x + hw && my >= p.y - top && my <= p.y + 5 * z)) return;
      if (p.depth > bd) { bd = p.depth; best = u; }
      if (want && want(u) && p.depth > pd) { pd = p.depth; pick = u; }
    });
    return pick || best;
  };
  // the frame a figure lies at, as unitObj draws it -- prone on a sheet with a fall frame, or down at 0 (its own prone row if it lay there already,
  // else its death row's last frame): [anim, frame], or null for one on its feet
  function lyingFrame(u) {
    if (u.dead) return null;
    var S = D.spr, pf = S.proneFrame(u.sheet), prow = S.proneRow(u.sheet);
    if (u.hp <= 0) { if (prow === 'prone' && u.proneLook) return ['prone', pf]; var h = S.anim(u.sheet, 'hurt'); return h ? ['hurt', h.frames - 1] : null; }
    return pf >= 0 && u.proneLook ? [prow, pf] : null;
  }
  // what the tool in hand asks for, when it is a foe: the attack cued, a spell aimed at one, a flask to throw (UI.pickUnit's `want`)
  function foeWanted(B, u) {
    var g = B.tool === 'spell' && B.spell && B.spell.g, it = B.tool === 'item' && window.DS.DATA.items[B.itemId];
    if (B.tool !== 'attack' && !(it && it.use && it.use.effect === 'damage') && !(g && (g.side === 'foe' || /^(attack|rays|darts|splash)$/.test(g.shape)))) return null;
    return function (w) { return G.hostile(u, w) && G.standing(w); };
  }
  UI.foeWanted = foeWanted; // (dev/bench16.js oil1005)
  function overUI(B) { // is the mouse over a menu, a list or the bar (so the grid doesn't take the click)?
    if (I.mouse.y >= BAR_Y) return true;
    return (B.uiRects || []).some(hit);
  }
  var AIMS = { rope: 1, torch: 1, item: 1, help: 1, lay: 1, detach: 1, breaktendril: 1 }; // (the aimed tools the right button puts away: turnInput)
  function turnInput(B, u) {
    if (B.readying && !B.list) { B.readying = null; B.clearCards(); } // (backed out of READY's wheel: nothing readied, nothing spent)
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
    if (I.mouse.inside && !overUI(B) && I.mouse.moved) { var pu = UI.pickUnit(B, I.mouse.x, I.mouse.y, foeWanted(B, u)), rg = pu ? null : ropeRung(B, u, I.mouse.x, I.mouse.y), s = pu ? { x: pu.x, y: pu.y } : rg ? { x: rg.rope.foot[0], y: rg.rope.foot[1] } : D.iso.pick(I.mouse.x, I.mouse.y, G.map.gz(B.cursor.x, B.cursor.y)); B.hoverUnit = pu; B.ropePick = rg; if (s) { B.cursor.x = s.x; B.cursor.y = s.y; } } // (hoverUnit: a rider on a head the mouse is on -- underCursor; ropePick: a rung of a rope the mouse is on, the cursor at the rope's foot -- ropeRung, 10-04)
    if (I.mouse.inside) (B.buttons || []).forEach(function (b, i) { if (hit(b)) B.hoverBtn = i; });
    // hovering picks an icon only when the mouse moves onto it: a ring turning under a resting mouse, or a twitch
    // on the same icon, leaves the arrows' choice alone (Griz, 09-27: the arrows stopped working over the wheel)
    var hb = B.buttons && B.buttons[B.hoverBtn], hk = !hb ? null : hb.list != null && B.list ? 'l' + hb.list : hb.idx != null ? 'c' + hb.idx : 'x';
    if (hb && I.mouse.moved && hk !== B.hoverKey) { B.ringStill = true; if (hb.list != null && B.list) { if (B.list.sel !== hb.list) D.sfx('cursor'); B.list.sel = hb.list; } else if (hb.idx != null && B.tool === 'menu') { if (B.cmdSel !== hb.idx) D.sfx('cursor'); B.cmdSel = hb.idx; } }
    B.hoverKey = hk;
    if (I.mouse.click && B.hoverBtn >= 0) { var bt = B.buttons[B.hoverBtn]; return bt.end ? UI.command(B, u, { do: 'end' }) : bt.cast ? castPicks(B, u) : bt.list != null ? pickListItem(B, u, B.list.items[bt.list], bt.list) : pickCommand(B, u, bt.cmd, bt.idx); }
    // the mouse's right button (10-01b, Griz: "Rightclick on the wheel when it's not on a button close wheel, and right-click while
    // targeting spell cancels cast (like x) - which means inspect should popup on mouseover during cast targeting so that if you're casting
    // hold person you can check the icon while looking for a target"): on the open wheel, off its buttons, it puts the wheel down; while a
    // spell is aimed it is X -- the last pick back, then the spell put away; and while aiming, the creature under the cursor shows its
    // inspect without a click (B.peek: drawn as the inspect, never held, so the click that picks the target is not spent closing it).
    // The pad's INFO and a long press still inspect (rclick without rbtn)
    B.peek = B.tool === 'spell' && B.spell ? underCursor(B) || etherealAt(B, B.cursor.x, B.cursor.y) || null : null;
    // (a ring deeper in -- a list on the wheel, a spell level's spells -- goes back one ring, as B does: 10-02, Griz: "should similarly up a level if you're on a deeper level of the ring")
    if (I.mouse.rbtn && B.list && B.hoverBtn < 0) { D.sfx('cancel'); B.list = B.list.back || null; return; }
    if (I.mouse.rbtn && B.tool === 'menu' && B.hoverBtn < 0) { D.sfx('cancel'); B.tool = rest() === 'menu' ? 'move' : rest(); B.spell = null; B.picks = []; B.clearCards(); return; }
    if (I.mouse.rbtn && B.tool === 'spell') {
      D.sfx('cancel');
      if (B.picks && B.picks.length) { B.picks.pop(); return; }
      B.tool = rest(); B.spell = null; B.peek = null; B.clearCards(); return;
    }
    // (an item or a feature aimed -- the Rope & Grapple, a torch to throw, a potion to give, Help, Lay on Hands, PULL IT OFF, BREAK THE TENDRIL: the right button puts it away, as X does --
    // 10-05, Griz: "Right-click cancel rope item use")
    if (I.mouse.rbtn && AIMS[B.tool]) { D.sfx('cancel'); B.tool = rest(); B.spell = null; B.clearCards(); return; }
    if (I.mouse.rclick && !overUI(B)) { var w0 = underCursor(B) || etherealAt(B, B.cursor.x, B.cursor.y); if (w0 && !w0.tendril) B.inspect = w0; return; } // (a tendril has no sheet to inspect: the tooltip says what it is)
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
    // hanging on a rope with the move for a rung up or down (10 ft a 5 ft rung, or an end in reach -- battle.js Battle.ropeSteps, 10-05): a step to take (exec 'ropeclimb'), though no square
    // is (10-05, Griz: "have viv move and end up on a rope with her bonus action left ... used bonus dash and it auto-ended her turn before i spent the bonus dash movement")
    var mvH = T.move + D.Battle.dashes(u).length * (u.speed || 30); // (a Dash still open -- the action's, or Cunning Action's bonus -- is more rope to climb: not spent; 10-05, Griz: "not if they have dash action or dash bonus action of course")
    if (mvH >= 5 && !u.conds.restrained && u.hang && u.hang.rope && G.hanging(u) && (D.Battle.ropeSteps(u.hang.rope, u.hang.z, true, mvH) > 0 || D.Battle.ropeSteps(u.hang.rope, u.hang.z, false, mvH) > 0)) return false;
    return !B.commands(u).some(function (c) { return c.ok && c.id !== 'putaway' && c.id !== 'drawweapon'; }); // (PUT AWAY and DRAW hold no turn open: free and nearly always there -- 10-05)
  }
  UI.spent = spent; // (the bench's: dev/bench16.js mode=edifice1004)
  function turnWheel() { return I.repeat('wheell') ? -1 : I.repeat('wheelr') ? 1 : 0; } // the pad's right stick or bumpers, on the wheel
  function castPicks(B, u) { var S = B.spell; if (S && B.picks.length) UI.command(B, u, { do: 'cast', id: S.id, slot: S.slot, target: { units: B.picks.slice() } }); }
  function etherealAt(B, x, y) { return B.units.filter(function (w) { return w.ethereal && !(w.under && w.earthGlide) && x >= w.x && y >= w.y && x < w.x + w.size && y < w.y + w.size; })[0]; }
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
    if (c.tool) { B.tool = c.tool; B.clearCards(); if (c.tool === 'help') B.card(['{g}HELP: a foe beside you -- the next ally to swing at it has advantage; or a friend beside you -- shake a sleeper awake, or a hand out of a web or a grip.{/}'], 200); if (c.tool === 'torch') B.card([D.keys('{g}THROW TORCH: a square within 20 ft you can see. It lands and burns there.  X back{/}')], 100000); if (c.tool === 'detach') B.card([D.keys('{g}PULL IT OFF: click the friend it rides -- a STR check, an action.  X back{/}')], 100000); if (c.tool === 'breaktendril') B.card([D.keys('{g}BREAK THE TENDRIL: click the one it holds -- yourself, or a friend beside you -- a STR check, an action.  X back{/}')], 100000); return; }
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
    // READY's wheel (readyRing): the pick goes back to battle.js exec 'ready' with the trigger asked before it
    if (B.readying && (e.kind === 'readypick' || e.kind === 'spell' || e.kind === 'readyitem')) { var trg = B.readying.trigger; B.readying = null; D.sfx('confirm'); return UI.command(B, u, e.kind === 'spell' ? { do: 'ready', trigger: trg, what: 'spell', id: e.id, slot: e.slot } : e.kind === 'readyitem' ? { do: 'ready', trigger: trg, what: 'item', item: e.id } : { do: 'ready', trigger: trg, what: e.what, cmd: e.cmd }); }
    if (e.kind === 'readyitems') { D.sfx('confirm'); var ri = B.itemList(u).filter(function (x) { return x.ok && x.id !== 'rope'; }).map(function (x) { return Object.assign({}, x, { kind: 'readyitem', label: x.name.toUpperCase() + (x.n > 1 ? ' x' + x.n : '') }); }); B.list = { kind: 'items', items: ri, sel: 0, back: B.list, title: 'READY: ITEM' }; B.ringB = null; return; }
    if (e.kind === 'readylevels') { D.sfx('confirm'); var rl = readyLevels(B, u); rl.back = B.list; B.list = rl; B.ringB = null; return; }
    if (e.kind === 'cmd') { B.list = null; return pickCommand(B, u, e.cmd); } // (it says its own confirm)
    D.sfx('confirm');
    if (e.kind === 'level') { var sp = e.spells.map(function (x) { x.kind = 'spell'; return x; }), f = 0; sp.some(function (x, k) { if (x.ok) { f = k; return true; } return false; }); B.list = { kind: 'spells', items: sp, sel: f, back: B.list, title: e.label }; B.ringC = null; return; }
    B.list = null;
    // (the bucket and a light are his own: used at once, no target to pick -- 09-30d, Griz: "bucket asks for self-or nearby target like a potion")
    if (e.kind === 'item' && (e.use.effect === 'bucket' || e.use.effect === 'light')) return UI.command(B, u, { do: 'item', id: e.id, target: u });
    // (the Rope & Grapple: the top of a face to pick -- battle.js Battle.ropeSq, exec 'rope'; 10-04)
    if (e.kind === 'item' && e.use.effect === 'rope') { B.tool = 'rope'; B.card(['{g}' + e.name.toUpperCase() + ': the top of a face -- tie it off from up there, or throw the grapple up from below, as far as the rope is long, 50 ft (DEX DC 10 to 30 ft, 2 more each 5 ft past).{/}'], 320); return; }
    if (e.kind === 'item') { B.tool = 'item'; B.itemId = e.id; B.card(['{g}' + e.name + ': ' + (e.id === 'oil' && D.oil ? 'at a foe or a square within 20 ft -- ' + (D.oil.lit(u) ? 'lit at your torch: a hit is 5 fire.' : 'a hit coats it, and the next fire on it burns 5 more; a square, oiled.') : e.use.effect === 'damage' ? 'throw it at a foe within 20 ft.' :e.use.effect === 'revive' ? 'a fallen ally beside you.' : 'yourself, or an ally beside you.') + '{/}'], 240); return; }
    var g = e.g, n = (g.n || 1) + Math.max(0, e.slot - e.level);
    B.spell = { id: e.id, slot: e.slot, g: g, sp: e.sp, n: n, name: e.name };
    B.picks = [];
    if (g.shape === 'self') return UI.command(B, u, { do: 'cast', id: e.id, slot: e.slot, target: u });
    B.tool = 'spell';
    if (g.shape === 'allies' && e.id === 'bless' && (!u.conds.blessed)) B.picks = [u]; // Bless takes the caster by default; click him again to leave him out
    var how = { attack: 'a foe in sight within ' + g.range + ' ft', rays: n + ' rays: click a foe for each (the same foe again is fine)', darts: n + ' darts: click a foe for each (the same foe again is fine)', splash: 'a foe within ' + g.range + ' ft (one beside it is caught too)', single: (g.side === 'foe' ? 'a foe' : 'an ally') + ' within ' + g.range + ' ft', touch: 'yourself, or an ally beside you', allies: 'up to ' + n + ' allies within ' + g.range + ' ft (click to add or drop; CAST, or E off a target, casts with fewer)', sphere: 'a point within ' + g.range + ' ft (the ' + g.r + '-ft sphere shows)', cube: 'a point within ' + g.range + ' ft', cone: 'aim the ' + g.len + '-ft cone', line: 'aim the ' + g.len + '-ft line', teleport: 'a square you can see within 30 ft' }[g.shape] || '';
    if (g.effects) how = 'a creature within ' + g.range + ' ft, or an empty square in the area of a spell (that spell)'; // (Dispel Magic: M.effectsAt, 10-02)
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
    var tool = B.tool, w = occ(x, y), foe = w && G.hostile(u, w) && !w.dead && w.hp > 0 ? w : null, T = u.turn, s = G.map.at(x, y);
    // the attack cued: a darkmantle riding a friend -- or riding you -- is struck at through that square (10-01, Griz: "attack cued looking for target, ally
    // square you normally can't attack"; battle.js mount)
    if (!foe && tool === 'attack') foe = D.Battle.riderOn(u, w, B.units) || D.Battle.tendrilOn(u, w, B.units); // (... or the roper's tendril on a friend, or on you -- 10-02)
    // ... and the mouse on it (its red outline: underCursor) is the click on it, as on any foe -- no ATTACK from the ring first (10-01, Griz: "Have to go into the
    // ring to do it for the first attack on the darkmantle")
    if (!foe && (tool === 'move' || tool === 'menu')) foe = hoveredRider(B, u, x, y);
    if (!s || !s.open) return 'no';
    if (tool === 'detach') return D.Battle.pullable(u, B.units).some(function (r) { return r.master === w; }) ? 'ok' : 'no'; // (PULL IT OFF: a friend beside you with one on)
    if (tool === 'breaktendril') return w && D.Battle.breakable(u, B.units).indexOf(w) >= 0 ? 'ok' : 'no'; // (BREAK THE TENDRIL: the one it holds -- you, or a friend beside you -- 10-02)
    if (tool === 'move' || tool === 'menu' || tool === 'attack') {
      // a rope's square (10-04 night, Griz: "if one clicks on a square where a grapple is they should be able to take it (unless someone is on it - in which case I think they'll
      // attack it if that's not an ally)"): a foe hanging on it within the weapon's reach -- the click cuts; nobody on it, the hero beside it -- the click takes it up (or steps
      // there, asked); the hero standing on it -- the self-click's ring has TAKE THE ROPE. An ally on it: the square is a square (battle.js Battle.canCutRope, canTakeRope)
      var rpA = !foe && D.Battle.ropeAt(B, x, y);
      if (rpA) { var cutA = D.Battle.canCutRope(B, u, rpA); if (cutA && cutA.ok) return 'cut'; if (!cutA && !(x === u.x && y === u.y) && D.Battle.canTakeRope(B, u, rpA).ok) return 'take'; }
      var ltA = !foe && !(x === u.x && y === u.y) && !G.occupant(x, y) && D.light.torchAt(B, x, y); // (a light on the floor beside the hero, nobody on it: the click takes it up, or steps there, asked -- as the grapple, 10-05)
      if (ltA && D.light.canTake(B, u, ltA).ok) return 'takelight';
      if (B.ropePick && x === B.ropePick.rope.foot[0] && y === B.ropePick.rope.foot[1] && !foe) return B.ropePick.ok ? 'rung' : 'no'; // (a rung of a rope the mouse is on: ropeRung, 10-04 night)
      if (x === u.x && y === u.y && !foe) return 'self';
      if (foe) return B.canHit(u, foe) && (T.attacksLeft || T.action || T.slamsLeft > 0) ? 'ok' : 'no'; // a crossbow reaches out to its long range (T.slamsLeft: the Keeper's second Slam out of the one action -- js/keeperplay.js)
      var rc = reachCache(B, u), k = x + ',' + y; // (the attack tool walks too: a step between swings is fair)
      if (rc.move[k] && rc.move[k].stand) return 'ok';
      if (rc.dash && rc.dash[k] && rc.dash[k].stand) return 'far';
      if (ropeEnd(B, u, x, y, rc)) return 'rope'; // (a rope's far end, past the move: climb part way and hang -- exec 'ropeclimb', 10-04)
      return 'no';
    }
    if (tool === 'rope') return D.Battle.ropeSq(B, u, x, y) ? 'ok' : 'no';
    if (tool === 'help') return (foe && G.dist(u, foe) <= 5) || D.Battle.helpable(u, w) ? 'ok' : 'no'; // (a friend beside you who needs a hand, too: 10-01c)
    if (tool === 'lay') return w && w.side === u.side && !w.dead && (w === u || G.dist(u, w) <= 5) ? 'ok' : 'no';
    if (tool === 'item') { if (B.itemId === 'oil' && !w && D.oil) return D.oil.squareOK(B, u, x, y) ? 'ok' : 'no'; return B.itemTargetOK(u, B.itemId, w) ? 'ok' : 'no'; } // (the flask at the ground: js/oil.js, 10-05)
    if (tool === 'torch') return UI.throwSq(u, x, y) ? 'ok' : 'no';
    if (tool === 'spell') {
      var g = B.spell.g, M = D.magic;
      if (g.shape === 'sphere' || g.shape === 'cube') return M.inRange(u, g, x, y) ? 'ok' : 'no';
      if (g.shape === 'wall') return M.area(u, g, x, y).length ? 'ok' : 'no';
      if (g.shape === 'cone' || g.shape === 'line' || g.shape === 'wave') return M.area(u, g, x, y).length ? 'ok' : 'no';
      if (g.shape === 'teleport') return B.mistyTargets(u, g.range, g.see).some(function (q) { return q[0] === x && q[1] === y; }) ? 'ok' : 'no';
      if (g.shape === 'allies' && B.picks.length && !(w && M.targetOK(B, u, g, w))) return 'self';
      if (spellTarget(B, u, g, x, y)) return 'ok';
      if (g.effects && !w && M.effectsAt(B, x, y).length && G.dist(u, { x: x, y: y, size: 1 }) <= g.range && G.losPoint(u.x, u.y, x, y)) return 'ok'; // (a spell's area, its square empty: Dispel Magic -- js/grimoire.js M.effectsAt, 10-02)
      return M.missileDark(B, u, g, x, y) || M.guessDark(B, u, g, x, y) ? 'ok' : 'no'; // (Magic Missile at the darkness: a square the caster cannot see into; a foe's square guessed in the dark, M.guessDark 10-02)
    }
    return 'no';
  };
  // the creature a spell aimed at (x, y) takes: a rider there the mouse is on, or the one standing there, or -- when the spell will not take that one -- a rider on
  // it (a darkmantle on a friend, or on the caster: 10-01, Griz, "check for other spell problems we might have created" -- a spell at it went to the friend's square
  // and found only the friend); null if none of them
  function spellTarget(B, u, g, x, y) {
    var M = D.magic, w = occ(x, y), hu = B.hoverUnit, ok = function (t) { return !!(t && M.targetOK(B, u, g, t)); };
    if (hu && hu.riding && hu.attached && G.standing(hu) && hu.x === x && hu.y === y && ok(hu)) return hu;
    if (ok(w)) return w;
    var r = D.Battle.riderOn(u, w, B.units); return ok(r) ? r : null;
  }
  UI.spellTarget = spellTarget;
  // a hostile rider on (x, y) the mouse is on (B.hoverUnit, set as the mouse moves): a darkmantle on a head, outlined red
  function hoveredRider(B, u, x, y) { var hu = B.hoverUnit; return hu && hu.riding && hu.attached && G.standing(hu) && hu.x === x && hu.y === y && G.hostile(u, hu) ? hu : null; }
  // the one under the cursor the tooltip, the inspect and a spell's peek speak of: a rider the mouse is on, or -- the attack cued -- the darkmantle on the square, else the one standing there
  function underCursor(B) {
    var x = B.cursor.x, y = B.cursor.y, w = G.occupant(x, y), hu = B.hoverUnit, a = (B.req && B.req.aim && B.req.aim.who) || B.active;
    if (hu && hu.hang && G.hanging(hu) && hu.x === x && hu.y === y) return hu; // (climbers on one column: the figure the mouse is on, not the square's first occupant -- the one above it. 10-05, Griz: "can't seem to highlight that troll and see how far up he is")
    if (hu && hu.riding && hu.attached && G.standing(hu) && hu.x === x && hu.y === y) return hu;
    if (B.tool === 'attack' && a) { var r = D.Battle.riderOn(a, w, B.units) || D.Battle.tendrilOn(a, w, B.units); if (r) return r; } // (or the roper's tendril on the one there: its AC and what is left of it, 10-02)
    if (B.tool === 'spell' && B.spell && a) { var st = spellTarget(B, a, B.spell.g, x, y); if (st) return st; }
    return w;
  }
  // a rope (B.ropes; grid.js G.ropeOn) whose one end is (x, y) and whose other the mover stands at, hangs on, or reaches with the move to spare for one 5 ft mark of it at the least
  // (10 ft of movement; battle.js Battle.ropeSteps -- 10-05, the climb by 5 ft): the click climbs part way (Griz, 10-04: "a roped face is gonna be a movement stopping point"); a rope
  // it can climb whole is an ordinary 'ok'
  function ropeEnd(B, u, x, y, rc) {
    if ((u.size || 1) > 1 || u.conds.restrained) return null;
    var rs = B.ropes || [];
    for (var i = 0; i < rs.length; i++) {
      var r = rs[i]; if (r.cut) continue;
      var other = x === r.at[0] && y === r.at[1] ? r.foot : x === r.foot[0] && y === r.foot[1] ? r.at : null; if (!other) continue;
      var k = other[0] + ',' + other[1], spent = u.x === other[0] && u.y === other[1] ? 0 : rc.move[k] && rc.move[k].stand ? rc.move[k].cost : null;
      if (spent == null) continue;
      var hz = other === r.foot && u.hang && u.hang.rope === r && G.hanging(u) ? u.hang.z : G.map.gz(other[0], other[1]);
      if (D.Battle.ropeSteps(r, hz, other === r.foot, u.turn.move - spent) > 0) return r;
    }
    return null;
  }
  // a rung of a rope (10-04 night, Griz: "I can't currently target half-way up the rope with a highlighted wall and choose that as my intentional move" -- "better than
  // half-way stop plz, these are 45 ft ropes i think"): the mouse on a roped face picks a height along the rope, a rung every 5 ft (two of the maps' 2.5 ft steps) up from the foot's
  // ground, never a half step (10-05, Griz: "any reason not to do the climb in 5 ft increments instead of 2.5?" -- "1 yes"), and the click climbs -- or lets
  // down -- to exactly there and hangs (battle.js exec 'ropeclimb' with z). From the foot or the top (standing there, or walked to with move to spare), or from where it hangs
  // already (any other rung, or the ground). The pick is a band 36 px wide down the rope's line, so the face itself is the target, as he asked. Returns
  // { rope, z, k, n, z0, steps, cost, spent, up, to, ok, ground, why } or null: `k` the rung in steps (even), `to` the end it climbs toward, `cost` 5 ft of movement a step (10 a rung),
  // `spent` the walk to the end first
  function ropeRung(B, u, mx, my) {
    if (!u || !u.turn || (u.size || 1) > 1 || u.conds.restrained || u.climbs || (u.flies && !u.conds.prone) || !(B.tool === 'move' || B.tool === 'menu' || B.tool === 'attack')) return null;
    var rs = B.ropes || [], iso = D.iso, st = G.map.def.step, z = iso.zoom, T = u.turn, rc = null, hang = u.hang && G.hanging(u) ? u.hang.rope : null;
    if (!st) return null;
    for (var i = 0; i < rs.length; i++) {
      var r = rs[i]; if (r.cut || (hang && r !== hang)) continue;
      var zt = G.map.gz(r.at[0], r.at[1]), zf = G.map.gz(r.foot[0], r.foot[1]), n = Math.round((zt - zf) / st); if (n < 2) continue;
      var ex = (r.at[0] + r.foot[0]) / 2, ey = (r.at[1] + r.foot[1]) / 2, a = iso.center(ex, ey, zt), b = iso.center(ex, ey, zf), p = iso.toScreen(a.x, a.y), q = iso.toScreen(b.x, b.y);
      if (Math.abs(mx - p.x) > 18 * z + 2 || my < p.y - 6 || my > q.y + 6) continue;
      var kMin = hang === r ? 0 : 2, kMax = Math.floor((n - 1) / 2) * 2; if (kMax < kMin) continue; // (a rung every 5 ft, two steps, above the foot's ground and short of the top; the ground for a hanger -- 10-05)
      var k = Math.round((q.y - my) / (2 * st * z)) * 2; k = Math.max(kMin, Math.min(kMax, k));
      // where it climbs from: its hang, the end it stands at, or an end it can walk to with move to spare (the cheaper)
      var from = [];
      if (hang === r) from.push({ z0: u.hang.z, spent: 0 });
      else if (u.x === r.foot[0] && u.y === r.foot[1]) from.push({ z0: zf, spent: 0 });
      else if (u.x === r.at[0] && u.y === r.at[1]) from.push({ z0: zt, spent: 0 });
      else { rc = rc || reachCache(B, u); [[r.foot, zf], [r.at, zt]].forEach(function (e) { var m = rc.move[e[0][0] + ',' + e[0][1]]; if (m && m.stand) from.push({ z0: e[1], spent: m.cost }); }); }
      if (!from.length) continue;
      var zH = zf + k * st, pick = null;
      from.forEach(function (f) { var steps = Math.round(Math.abs(zH - f.z0) / st); if (!steps) return; var c = { z0: f.z0, spent: f.spent, steps: steps, cost: steps * 5 }; if (!pick || c.spent + c.cost < pick.spent + pick.cost) pick = c; });
      if (!pick) continue;
      var ok = T.move - pick.spent >= pick.cost;
      return { rope: r, z: zH, k: k, n: n, z0: pick.z0, steps: pick.steps, cost: pick.cost, spent: pick.spent, up: zH > pick.z0, to: zH > pick.z0 ? r.at : r.foot, ok: ok, ground: k === 0,
        why: ok ? '' : (pick.spent + pick.cost) + ' ft of movement, ' + T.move + ' left' };
    }
    return null;
  }
  UI.ropeRung = ropeRung;
  // a figure clinging to a cliff face (no rope: battle.js u.hang = { face, foot, z }) that the mouse is on, or the cursor aims at (underCursor): drawn with the rope's own overlay -- the face,
  // the rung at its height, the rhombus where it hangs (10-05, Griz: "can targeting wall climbers highlight similar to rope climbing?" -- heights in 5 ft marks: "5 - ensure 5 foot")
  function clingOf(B) { var w = underCursor(B); return w && w !== B.active && w.hang && w.hang.face && G.hanging(w) ? w : null; }
  // the rung drawn (overlay): the face the rope hangs down, outlined, the rung across it at the height picked, and where the figure will hang -- a small rhombus at the foot's
  // square raised to the rung, the height and the cost beside it. Gold; red where the move will not take it. The face goes in the sort just after its own square's tile (as onSq
  // does), so the raised square's picture does not cover it; the rung's mark just after the rope, so it reads on top of it
  function drawRung(B, u, rg) {
    var r = rg.rope, iso = D.iso, HW = iso.TW / 2, HH = iso.TH / 2, st = G.map.def.step, zt = G.map.gz(r.at[0], r.at[1]), zf = G.map.gz(r.foot[0], r.foot[1]), col = rg.ok ? R('gold', 3) : R('red', 4);
    var dx = r.foot[0] - r.at[0], dy = r.foot[1] - r.at[1], square = (dx === 1 && dy === 0) || (dx === 0 && dy === 1); // (a face shows toward +gx or +gy; a corner-wise foot has no one face)
    var c = iso.center(r.at[0], r.at[1], 0), ex = (r.at[0] + r.foot[0]) / 2, ey = (r.at[1] + r.foot[1]) / 2;
    onSq(r.at[0], r.at[1], function (cx) {
      cx.save(); cx.strokeStyle = col; cx.fillStyle = col; cx.lineWidth = 1;
      if (square) {
        var e = dx === 1 ? [[0, HH], [HW, 0]] : [[-HW, 0], [0, HH]], hi = [], lo = []; // (the lip's edge: +gx the lower-right one, +gy the lower-left)
        e.forEach(function (v) { hi.push(iso.toScreen(c.x + v[0], c.y + v[1] - zt)); lo.push(iso.toScreen(c.x + v[0], c.y + v[1] - zf)); });
        cx.beginPath(); cx.moveTo(hi[0].x, hi[0].y); cx.lineTo(hi[1].x, hi[1].y); cx.lineTo(lo[1].x, lo[1].y); cx.lineTo(lo[0].x, lo[0].y); cx.closePath();
        cx.globalAlpha = 0.14; cx.fill(); cx.globalAlpha = 0.6; cx.stroke();
        var ra = iso.toScreen(c.x + e[0][0], c.y + e[0][1] - rg.z), rb = iso.toScreen(c.x + e[1][0], c.y + e[1][1] - rg.z);
        cx.globalAlpha = 1; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(ra.x, ra.y); cx.lineTo(rb.x, rb.y); cx.stroke();
      } else {
        var m0 = iso.center(ex, ey, rg.z), ms = iso.toScreen(m0.x, m0.y);
        cx.lineWidth = 2; cx.beginPath(); cx.moveTo(ms.x - 9, ms.y); cx.lineTo(ms.x + 9, ms.y); cx.stroke();
      }
      cx.restore();
    });
    DEFER.push({ depth: r.foot[0] + r.foot[1] + 0.35, gz: zf, layer: 1, draw: function (cx) {
      var Lr = rg.cling ? r.foot : ropeLine(r); cx.save(); iso.rhombus(cx, Lr[0], Lr[1], rg.z, 9); cx.globalAlpha = 0.9; cx.strokeStyle = col; cx.lineWidth = 1; cx.stroke(); cx.globalAlpha = 1; // (where the figure will hang: on the rope's line, as unitPos draws it -- 10-05)
      cx.restore();
    } });
    var hp = iso.center(r.foot[0], r.foot[1], rg.z), hs = iso.toScreen(hp.x, hp.y); // (the words after everything in the sort: a tile in front painted over them when they rode in it)
    LABELS.push({ x: hs.x + 18, y: hs.y - 4, text: rg.cling ? (Math.round((rg.z - zf) / st / 2) * 5) + ' ft up' : (rg.ground ? 'the ground' : (Math.round((rg.z - zf) / st / 2) * 5) + ' ft up') + '  ' + (rg.ok ? '{n}' : '{o}') + (rg.spent + rg.cost) + ' ft of move{/}', color: R('bone', 1) }); // (the rung's height in whole 5s: 10-05)
  }

  // what else is in the hands, after the weapon's name (10-05, Griz: "with torch showing in the weapon slot?"): the torch (or lantern) held, a two-handed weapon carried in one
  // hand beside it (it falls when it swings: battle.js attack), a weapon put away (u.sheathed)
  UI.handsNote = function (u, short) {
    var L = D.light, bits = [];
    if (short) return (u.sheathed ? ' (put away)' : '') + (u.torch && L ? ' + ' + L.word(u.torch) : ''); // (the bar's line: room for little)
    if (u.sheathed) bits.push(u.sheathed.name + ' put away');
    if (u.torch && L) { var h = L.handsUsed(u); if (h.carried) bits.push('carried -- the ' + L.word(u.torch) + ' falls when it swings'); bits.push('a ' + L.word(u.torch) + ' in hand'); }
    return bits.length ? ' (' + bits.join('; ') + ')' : '';
  };
  // a square a torch may be thrown to: open, within 20 ft, in line (not the thrower's own)
  UI.throwSq = function (u, x, y) { var s = G.map.at(x, y); return !!(s && s.open && !(x === u.x && y === u.y) && Math.max(Math.abs(x - u.x), Math.abs(y - u.y)) * 5 <= 20 && G.losPoint(u.x, u.y, x, y)); };
  function actAt(B, u, x, y, byKey) {
    var T = u.turn, tool = B.tool, w = occ(x, y), foe = w && G.hostile(u, w) && !w.dead && w.hp > 0 ? w : null, v = UI.valid(B, u, x, y);
    if (!foe && tool === 'attack') foe = D.Battle.riderOn(u, w, B.units) || D.Battle.tendrilOn(u, w, B.units); // (a darkmantle riding a friend, or you: struck at through the square -- UI.valid; the roper's tendril the same, 10-02)
    if (!foe && (tool === 'move' || tool === 'menu')) foe = hoveredRider(B, u, x, y); // (the mouse on it: the click is on it -- UI.valid)
    if (tool === 'detach') { if (v === 'ok') return UI.command(B, u, { do: 'detach', target: D.Battle.riderOn(u, w, B.units) }); return B.card(['{o}Pull it off: a friend beside you with a darkmantle on.{/}'], 120); }
    if (tool === 'breaktendril') { if (v === 'ok') return UI.command(B, u, { do: 'breaktendril', target: w }); return B.card(['{o}Break the tendril: the one it holds -- yourself, or a friend beside you.{/}'], 120); }
    if (tool === 'move' || tool === 'menu' || tool === 'attack') {
      if (v === 'cut') return UI.command(B, u, { do: 'cutrope', x: x, y: y }); // (a rope a foe hangs on: struck from its top -- 10-04 night)
      if (v === 'take') return UI.command(B, u, { do: 'takerope', x: x, y: y }); // (a rope's grapple, nobody on it: taken up, or the square stepped onto -- asked)
      if (v === 'takelight') return UI.command(B, u, { do: 'pickuptorch', x: x, y: y }); // (a torch on the floor beside: the same -- 10-05)
      if (v === 'rung') return UI.command(B, u, { do: 'ropeclimb', x: B.ropePick.to[0], y: B.ropePick.to[1], z: B.ropePick.z }); // (the rung picked: to exactly there, and hang -- before the self-click, since a hanger's square is the rope's foot)
      if (x === u.x && y === u.y && !foe) { // (the self-click: the ring -- or, standing on a rope's grapple, the question first: Griz, 10-04 night: "standing on it makes me select character?")
        if (u.conds.prone && RU.canRise(u) && T.move >= Math.floor(u.speed / 2)) return UI.command(B, u, { do: 'stand' }); // (prone, the half to stand: the click on yourself stands you -- 10-04 night, Griz)
        var rpSelf = D.Battle.ropeAt(B, x, y); if (rpSelf && D.Battle.canTakeRope(B, u, rpSelf).ok) return UI.command(B, u, { do: 'takerope', x: x, y: y, ask: true });
        var ltSelf = D.light.torchAt(B, x, y); if (ltSelf && D.light.canTake(B, u, ltSelf).ok) return UI.command(B, u, { do: 'pickuptorch', x: x, y: y, ask: true }); // (standing on a torch: the question first, as on the grapple -- 10-05)
        D.sfx('popup'); B.tool = 'menu'; return;
      }
      if (foe && v === 'ok') return UI.command(B, u, { do: 'attack', target: foe });
      if (foe) {
        D.sfx('error');
        if (D.rules.charmedBy(u, foe)) return B.card(['{o}' + u.name + ' is charmed: no raising a hand to the ' + B.shortName(foe) + '.{/}'], 160);
        if (B.canHit(u, foe)) return B.card(['{o}No attack left this turn: the action is spent.{/}'], 120);
        return B.card(['{o}The ' + B.shortName(foe) + ' is out of ' + (u.weapon && u.weapon.ranged ? 'range' : 'reach') + ' (' + G.dist(u, foe) + ' ft).{/}'], 120);
      }
      if (v === 'no' && (u.size || 1) > 1 && D.keeperPlay && D.keeperPlay.human(B, u)) { D.sfx('error'); return B.card(['{o}MOVE: ' + (D.keeperPlay.moveWhy(B, u, x, y) || 'not there') + '.{/}'], 160); } // (a big creature's refused pick says why)
      if (v === 'ok') return UI.command(B, u, { do: 'move', x: x, y: y });
      if (v === 'far') return UI.command(B, u, { do: 'dashmove', x: x, y: y });
      if (v === 'rope') return UI.command(B, u, { do: 'ropeclimb', x: x, y: y });
      return;
    }
    if (tool === 'rope') { if (v === 'ok') return UI.command(B, u, { do: 'rope', x: x, y: y }); return B.card(['{o}The top of a face: from beside it up there, or from below within the rope\'s 50 ft and in sight.{/}'], 140); }
    if (tool === 'help') { if (v === 'ok') return UI.command(B, u, { do: 'help', target: foe || w }); return B.card(['{o}Help: a foe beside you, or a friend beside you asleep or held fast.{/}'], 120); }
    if (tool === 'lay') { if (v === 'ok') return UI.command(B, u, { do: 'lay', target: w }); return B.card(['{o}Lay on Hands is touch: yourself or an ally beside you.{/}'], 120); }
    if (tool === 'item') { if (v === 'ok') return UI.command(B, u, { do: 'item', id: B.itemId, target: w, x: x, y: y }); // (x, y: the oil flask's square when no one stands there -- js/oil.js) // (the refusal says why when it is the reach: his play of 10-05, the flask at a troll 45 ft below the roof read as "oil flask at 0 hp trolls")
      var itR = window.DS.DATA.items[B.itemId], whyR = itR && itR.use.effect === 'damage' && w && G.hostile(u, w) ? (G.dist(u, w) > 20 ? 'the flask goes 20 ft, and ' + D.Battle.nm(w) + ' is ' + G.dist(u, w) + ' ft off (the height counts)' : !G.los(u, w).clear ? 'no line to ' + D.Battle.nm(w) : '') : '';
      return B.card(['{o}Not a target for that' + (whyR ? ': ' + whyR : '') + '.{/}'], whyR ? 200 : 120); }
    if (tool === 'torch') { if (v === 'ok') return UI.command(B, u, { do: 'throwtorch', x: x, y: y }); return B.card(['{o}Throw it to a square within 20 ft you can see.{/}'], 120); }
    if (tool === 'spell') {
      var S = B.spell, g = S.g, M = D.magic, cast = function (t) { UI.command(B, u, { do: 'cast', id: S.id, slot: S.slot, target: t }); };
      if (g.shape === 'rays' || g.shape === 'darts') {
        if (v !== 'ok') return;
        B.picks.push(spellTarget(B, u, g, x, y) || { x: x, y: y, size: 1, dark: true, name: 'the dark' }); // (a dart at the darkness; at a darkmantle on a friend, spellTarget)
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
      if (g.effects && !w) return cast({ x: x, y: y }); // (the spell on that empty square: Dispel Magic, M.effectsAt)
      if (g.shape === 'sphere' || g.shape === 'cube' || g.shape === 'cone' || g.shape === 'line' || g.shape === 'wave' || g.shape === 'wall' || g.shape === 'teleport') return cast({ x: x, y: y });
      return cast(spellTarget(B, u, g, x, y) || w || (M.guessDark(B, u, g, x, y) ? { x: x, y: y, size: 1, dark: true, name: 'the dark' } : null)); // (the guess: whoever stands there, or the dark itself)
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
      ['pace', 'AI + MESSAGE TIME: ' + D.PACE + 'x  < >'],
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
  UI.backLabel = function () { var B = D.battle; return B && B.o.onDone ? (B.o.climb ? 'BACK TO THE CLIMB' : B.o.pocket ? 'BACK TO THE POCKET DM' : 'BACK TO THE LADDER') : 'RETURN TO SILVERTON'; };
  UI.menuInput = function (B) {
    var M = B.menu, items = menuItems(B), n = items.length, s0 = M.sel;
    if (M.panel === 'equip') return gearInput(B);
    if (M.panel) { if (I.pressed('a') || I.pressed('b') || I.pressed('menu') || I.mouse.click) { D.sfx('cancel'); M.panel = null; } return; }
    if (I.repeat('up')) M.sel = (M.sel + n - 1) % n;
    if (I.repeat('down')) M.sel = (M.sel + 1) % n;
    if (M.sel !== s0) D.sfx('cursor');
    var styles = ['ring', 'window'], si = styles.indexOf(UI.opts.style), here = items[M.sel][0], lr = I.repeat('left') ? -1 : I.repeat('right') ? 1 : 0;
    if (here === 'style' && lr) { UI.opts.style = styles[(si + 1) % 2]; UI.saveOpts(); restyle(B); D.sfx('cursor'); return; }
    if (here === 'pace' && lr) { cyclePace(lr); D.sfx('cursor'); return; }
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
    if (id === 'pace') cyclePace(1);
    if (id === 'music') setVol('musicVol', vol('musicVol') > 0 ? 0 : 0.5); // E: off, or back on
    if (id === 'sounds') setVol('sfxVol', vol('sfxVol') > 0 ? 0 : 0.7);
    if (id === 'restart') { D.pop(); D.push(new D.Battle(B.o)); }
    if (id === 'ladder') location.search = '?ladder';
    if (id === 'out') { if (B.o.onDone) { D.pop(); B.o.onDone(null); } else location.href = '../'; } // the ladder, or back to the 8-bit game: nothing is written
  };
  function restyle(B) { if (B.req && B.req.turn && (B.tool === 'move' || B.tool === 'menu')) B.tool = rest(); }
  // the PACE row: 1x / 1.25x / 1.5x, kept with the other options (D.PACE is what battle.js reads: the AI's waits and every message's time)
  function cyclePace(lr) { var n = UI.PACES.length, i = UI.PACES.indexOf(D.PACE); i = i < 0 ? (lr > 0 ? 0 : n - 1) : (i + lr + n) % n; UI.opts.pace = D.PACE = UI.PACES[i]; UI.saveOpts(); }
  UI.resultInput = function (B) {
    UI.camera(B);
    if (I.pressed('a') || (I.mouse.click && !overUI(B))) {
      D.sfx('confirm');
      if (B.o.onDone) { D.pop(); B.o.onDone(B.result); return; } // back to the ladder with the result
      D.pop(); D.push(new D.Battle(B.o));
    }
  };

  // ------------------------------------------------------------------ drawing
  // the tall faces go nigh-translucent over whatever stands behind them (10-04, Griz: "nigh-translucent walls (that are invisible unless player trying to move cursor on them?)"): a square standing 10 ft or more above
  // a figure behind it, or the cursor square behind it, is drawn faint where it would hide them, and whole again while the cursor is on it (js/iso.js draws a tile prop at its `alpha`). Only on a map that rises 10 ft (G.tall)
  function fadeFaces(B) {
    var m = D.iso.map; if (!m || !G.tall()) return;
    var tall = 4 * G.map.def.step, HW = 32, HH = 16, pts = [];
    B.units.forEach(function (u) { if (G.standing(u)) pts.push({ x: u.x, y: u.y, z: G.gzAt(u, u.x, u.y), head: 44 }); });
    if (B.cursor) pts.push({ x: B.cursor.x, y: B.cursor.y, z: m.gz(B.cursor.x, B.cursor.y), head: 0 });
    m.props.forEach(function (p) {
      if (p.kind !== 'tile') return;
      p.alpha = 1;
      if (p.gz < tall || (B.cursor && B.cursor.x === p.sq.x && B.cursor.y === p.sq.y)) return;
      var ct = D.iso.center(p.sq.x, p.sq.y, p.gz), cb = D.iso.center(p.sq.x, p.sq.y, 0);
      for (var i = 0; i < pts.length; i++) {
        var q = pts[i]; if (q.x + q.y >= p.sq.x + p.sq.y || p.gz - q.z < tall) continue;
        var cu = D.iso.center(q.x, q.y, q.z);
        if (Math.abs(cu.x - ct.x) > HW + 8 || cu.y < ct.y - HH - q.head || cu.y > cb.y + HH) continue;
        p.alpha = 0.3; break;
      }
    });
  }
  UI.drawBattle = function (ctx, B) {
    var req = B.req, hero = req && (req.turn || (req.aim && req.aim.who)), objs = []; // (req.aim: the readied thing aimed on another's turn -- its holder's tool and reach, 10-02)
    B.uiRects = []; B.buttons = [];
    // whose eyes (10-01, Griz: "regardless of turn if you mouseover a party member/guest/ally it switches to their vision filter"): the
    // mouse on one of ours -- a hero, a guest, a summoned ally -- on a dark map shows the dark as that one sees it (js/light.js L.viewMap)
    var mo = I.mouse; B.viewAs = null;
    if (B.dark && mo.inside && mo.y < BAR_Y && !B.menu && !(req && (req.entry || req.scene))) { var vu = UI.pickUnit(B, mo.x, mo.y); if (vu && vu.side === 'party' && G.standing(vu)) B.viewAs = vu; }
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
      ropeObjs(B).forEach(function (o) { objs.push(o); }); // the ropes down the faces, a tiny grapple at each top (10-04)
      bucketObjs(B).forEach(function (o) { objs.push(o); }); // the rope bucket's coil (10-04 night)
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
      fadeFaces(B);
      D.iso.draw(wx, objs, function (c) { overlay(c, B, hero); });
      if (B.dark) D.light.pass(wx, B, vw, vh); // torchdark: the light pass over the world (the player sees it all, dimmed where the four can't)
      drawPathDots(wx);
      drawPathMarks(wx);
      drawLabels(wx);
      xray(wx, B, objs, hero || B.active); // a figure hidden behind another shows through as its outline
      // a rider the cursor means (a darkmantle on a head: underCursor) outlined, so the mouse shows it is on it (10-01, Griz: "I can't get any indication I'm mousing over the one on his head")
      var hr = hero && underCursor(B), ho = hr && hr.riding && objs.filter(function (o) { return o.unit === hr && o.shown; })[0];
      if (ho) D.spr.outline(wx, hr.sheet, ho.shown.anim === 'hurt' && !D.spr.anim(hr.sheet, 'hurt') ? 'idle' : ho.shown.anim, hr.facing || 0, ho.shown.t, ho.shown.x, ho.shown.y, G.hostile(hero, hr) ? R('red', 4) : R('glow', 2), { alpha: 0.95, once: ho.shown.once, frame: ho.shown.frame, scale: ho.shown.k });
    } finally { D.iso.inWorld = false; DEFER = null; WCTX = null; }
    var dev = z * D.R;
    ctx.imageSmoothingEnabled = Math.abs(dev - Math.round(dev)) > 1e-6;
    var shk = B.shakeT > 0 && (B.shakeT % 10) < 4; // (the roost coming down: a shake every ten frames, as the 8-bit's swarm)
    ctx.drawImage(wc, 0, 0, vw, vh, shk ? Math.round((Math.random() - 0.5) * 6) : 0, shk ? Math.round((Math.random() - 0.5) * 4) : 0, vw * z, vh * z);
    if (z * D.R < 1 - 1e-9) farMarks(ctx, B); // (a far step: the figures are a few pixels tall -- a mark on each, 10-04 night, Griz: "great idea")
    ctx.imageSmoothingEnabled = false;
    FX.list.forEach(function (f) { if (f.screen) f.draw(ctx); });
    strip(ctx, B);
    if (B.skylight) D.text(ctx, B.skylight.name.toUpperCase() + '  ' + (G.standing(B.skylight) ? B.skylight.hp + '/' + B.skylight.maxhp : 'BROKEN'), D.W / 2, 14, G.standing(B.skylight) ? R('glow', 2) : R('red', 4), 'center'); // (the defend fight's object, under the strip)
    cards(ctx, B);
    var ey = B.dark && B.eyes; // (the one under the mouse, or the hero whose turn it is on a map with no light: js/light.js L.pass)
    if (ey) { var vm = D.light.viewMap(B, ey); D.text(ctx, 'EYES: ' + ey.name + ' · ' + [vm.blind ? 'blinded' : vm.dv ? 'darkvision ' + vm.dv : 'no darkvision', vm.bs ? (ey.truesight ? 'truesight ' : 'blindsight ') + vm.bs : ''].filter(Boolean).join(', '), 5, BAR_Y - 22, R('glow', 2)); } // (whose eyes the dark is drawn by: a line above the tooltip's bottom one)
    tooltip(ctx, B, hero);
    // the square under the cursor, by the grid's own numbering, top right (Griz, 10-01: "Me getting better at pointing to the tile by
    // your numbering or some standardized tile referencing"): x counts from the far upper-left wall, y from the far upper-right, so
    // (0, 0) is the map's top corner; x grows down to the right, y down to the left -- he can say "4,1" and mean the seat's 4,1
    if (B.cursor && G.map.at(B.cursor.x, B.cursor.y)) D.text(ctx, B.cursor.x + ',' + B.cursor.y, D.W - 5, 3, R('silver', 5), 'right');
    bar(ctx, B, hero);
    if (hero && UI.opts.style === 'window') cmdWindow(ctx, B, hero);
    if (hero && UI.opts.style === 'ring') cmdRing(ctx, B, hero);
    if (hero && B.tool === 'spell' && B.spell && B.spell.g.shape === 'allies' && B.picks.length) castButton(ctx, B);
    var iw = B.inspect || (B.tool === 'spell' && B.spell && B.peek); if (iw) inspect(ctx, iw); // (B.peek: the one under the cursor while a spell is aimed)
    if (req && req.prompt) prompt(ctx, B, req.prompt);
    if (req && req.entry) entry(ctx, B);
    if (req && req.scene) scene(ctx, B, req.scene);
    if (B.menu) menu(ctx, B);
  };

  // the far steps' marks (10-04 night): a diamond on every standing figure in the side's colour -- ours glow-blue, a guest or an ally moss, a foe red -- the active one ringed gold
  function farMarks(ctx, B) {
    B.units.forEach(function (u) {
      if (!G.standing(u) || (u.riding && u.master) || u.object) return;
      var p = unitPos(B, u), col = u.side === 'foe' ? R('red', 4) : u.side === 'party' && !u.guest ? R('glow', 2) : R('moss', 3);
      var dia = function (r, h) { ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x + r, p.y); ctx.lineTo(p.x, p.y + h); ctx.lineTo(p.x - r, p.y); ctx.closePath(); };
      ctx.fillStyle = R('outline', 0); dia(7, 5); ctx.fill();
      ctx.fillStyle = col; dia(5, 3); ctx.fill();
      if (u === B.active) { ctx.strokeStyle = R('gold', 4); ctx.lineWidth = 1; dia(9, 7); ctx.stroke(); }
    });
  }
  // the rope bucket's coil (B.ropeBucket, 10-04 night): a few turns of hemp and the hook on the crate's top, in the sort just after the crate
  function bucketObjs(B) {
    var b = B.ropeBucket; if (!b) return [];
    return [{ depth: b[0] + b[1] + 0.55, gz: G.map.gz(b[0], b[1]), layer: 1, draw: function (ctx) {
      var c = D.iso.center(b[0], b[1], G.map.gz(b[0], b[1])), s = D.iso.toScreen(c.x, c.y), x = s.x, y = s.y - 14;
      ctx.save(); ctx.lineWidth = 2;
      [[9, 4, 3], [6, 3, 1], [3, 1.5, 3]].forEach(function (e) { ctx.strokeStyle = R('leather', e[2]); ctx.beginPath(); ctx.ellipse(x, y, e[0], e[1], 0, 0, Math.PI * 2); ctx.stroke(); });
      ctx.fillStyle = R('silver', 5); ctx.fillRect(x + 8, y - 4, 1, 4); ctx.fillRect(x + 7, y - 1, 3, 1); ctx.fillRect(x + 6, y - 2, 1, 1);
      ctx.restore();
    } }];
  }

  // ------------------------------------------------------------------ a cutscene beat (the gimmick, Griz 09-28: "a quick cutscene close-up of Aurdin
  // and then that mp3, then a close up of the cloaker showing it hit, then big close up cloaker face"): one figure blown up over
  // a vignette, a caption under it; `hit` flashes it and lands three darts up its body; `face` frames its head
  function scene(ctx, B, sc) {
    if (sc.draw) { sc.draw(ctx, sc.t || 0, D.W, D.H); if ((sc.t || 0) > 60 && ((sc.t >> 5) & 1)) D.hint(ctx, 'E', D.W - 16, D.H - 14, R('stone', 5)); return; } // (a picture drawn by its own hand: the landlord's, js/wet.js)
    var t = sc.t || 0, u = sc.who, k = sc.scale || 3, red = sc.tone === 'red', top = D.spr.top(u.sheet);
    // `outro` (10-02, Aurdin's joke: "then zoomed back out"): over the beat's last ticks the backdrop thins, the figure shrinks and fades, and the
    // fight comes up behind it
    var oq = sc.outro ? Math.max(0, Math.min(1, (t - ((sc.frames || 120) - sc.outro)) / sc.outro)) : 0;
    ctx.save(); ctx.globalAlpha = 1 - oq;
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
    var px0 = D.W / 2, py0 = foot, kk = k * (1 - 0.55 * oq);
    // (10-02, Aurdin's joke) `pan`: the camera tilts down onto the figure over its first `panDur` ticks (it rises into the frame from `pan` px below);
    // `bob`: shaking with laughter, a sprite's pixel up and down
    if (sc.pan) { var pq = Math.min(1, t / (sc.panDur || 50)); py0 += Math.round(sc.pan * (1 - pq * pq * (3 - 2 * pq))); }
    if (sc.bob) py0 -= Math.round(Math.abs(Math.sin(t / 3.4)) * kk);
    if (sc.swoop) { var pr = Math.min(1, t / Math.max(1, (sc.frames || 84) - 24)), ee = pr * pr * (3 - 2 * pr); px0 = D.W + 90 - (D.W + 90 - D.W * 0.24) * ee; py0 = foot - 46 + 72 * ee; kk = k * (0.75 + 0.95 * ee); }
    // `morph` { from, at, dur }: the figure starts as another of its animations (the cloaker hung as a cloak) and dissolves into its own
    // over `dur` ticks from `at`, trembling as it changes -- the unfurling
    var ma = sc.morph && D.spr.anim(u.sheet, sc.morph.from) ? Math.max(0, Math.min(1, (t - sc.morph.at) / sc.morph.dur)) : 1, shake = sc.morph && ma > 0 && ma < 1 ? Math.sin(t * 2.3) * 2.2 * Math.sin(Math.PI * ma) : 0;
    ctx.save(); ctx.translate(px0 + shake, py0); ctx.scale(kk, kk);
    // `morph.animAt`: the target plays from that tick; `morph.hold`: the figure it leaves is held on its last frame; `over` { anim, alpha }:
    // a faint second drawing laid over the figure, pulsing and swelling (the cloaker's Moan, the phantasm heads)
    var facing = sc.facing == null ? 0 : sc.facing, one = function (an, al, tt, once) { var oo = Object.assign({}, o); if (al < 1) oo.alpha = al; if (once) oo.once = true; if (sc.frame != null && an === anim) oo.frame = sc.frame; /* (`frame`: one pose held -- Aurdin down, the hyena's still face, the gnoll's yawn: 10-02) */ D.spr.draw(ctx, u.sheet, an, facing, an === 'attack' ? Math.min(tt, 60) : tt, 0, 0, oo); };
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
    ctx.restore(); // (the outro's fade)
    if (t > 60 && ((t >> 5) & 1)) D.hint(ctx, 'E', D.W - 16, D.H - 14, R('stone', 5));
  }

  // on a rope: drawn on its line -- the edge between its top and its foot, a little out from the face -- not in the middle of the foot's square (10-05, Griz: "climbing shows left of
  // rope, but when they get up they seem to step on tile right of rope first"); the sort keeps it in front of the rope
  function ropeLine(r) { return [r.at[0] + (r.foot[0] - r.at[0]) * 0.65, r.at[1] + (r.foot[1] - r.at[1]) * 0.65]; }
  function unitPos(B, u) {
    var s = u.size || 1, gx = u.drawAt ? u.drawAt.x : u.x, gy = u.drawAt ? u.drawAt.y : u.y, gz = G.gzAt(u, gx, gy); // (drawAt: where a caster stands while his floating weapon swings)
    var hangR = u.hang && u.hang.rope && G.hanging(u) ? u.hang.rope : null, onR = hangR;
    if (hangR && !u.tween) { var L0 = ropeLine(hangR); gx = L0[0]; gy = L0[1]; }
    if (u.tween) {
      // (a cliff, battle.js moveAlong, 10-04 -- Griz: "can we move them vertical": 'climb' goes up the face, then over the lip; 'drop' steps out over the edge, then falls, faster as it goes;
      // 'slip' gets part way up the face and comes back down where it started)
      var tw = u.tween, k = tw.t / tw.dur, kxy = k, kz = k, fx = tw.fx, fy = tw.fy, tx = u.x, ty = u.y;
      if (tw.mode === 'climb') { kz = Math.min(1, k / 0.75); kxy = Math.max(0, (k - 0.75) / 0.25); }
      else if (tw.mode === 'drop') { kxy = Math.min(1, k / 0.3); kz = Math.max(0, (k - 0.3) / 0.7); kz *= kz; }
      else if (tw.mode === 'ropedown') { kxy = Math.min(1, k / 0.25); kz = Math.max(0, (k - 0.25) / 0.75); } // (over the edge onto a rope, then down it hand over hand)
      if ((tw.mode === 'climb' || tw.mode === 'ropedown') && B) { // (up or down a rope: its foot's end on the rope's line)
        var isFoot = function (r, x, y) { return r.foot[0] === x && r.foot[1] === y; }, isTop = function (r, x, y) { return r.at[0] === x && r.at[1] === y; };
        onR = (B.ropes || []).filter(function (r) { return !r.cut && ((isFoot(r, tw.fx, tw.fy) && (isTop(r, u.x, u.y) || hangR === r)) || (isTop(r, tw.fx, tw.fy) && isFoot(r, u.x, u.y))); })[0] || hangR;
        if (onR) { var L1 = ropeLine(onR); if (isFoot(onR, fx, fy)) { fx = L1[0]; fy = L1[1]; } if (hangR === onR && isFoot(onR, tx, ty)) { tx = L1[0]; ty = L1[1]; } }
      }
      gx = fx + (tx - fx) * kxy; gy = fy + (ty - fy) * kxy;
      gz = tw.mode === 'slip' ? tw.fz + tw.peak * (k < 0.6 ? k / 0.6 : Math.pow(1 - (k - 0.6) / 0.4, 2)) : tw.fz + (gz - tw.fz) * kz;
    }
    var c = D.iso.center(gx + (s - 1) / 2, gy + (s - 1) / 2, gz), p = D.iso.toScreen(c.x, c.y), dep = gx + gy + (s - 1) + 0.6;
    if (onR) dep = Math.max(dep, onR.foot[0] + onR.foot[1] + 0.4); // (in front of the rope, ropeObjs: its foot's depth + 0.3)
    return { x: p.x, y: p.y, depth: dep, gz: gz };
  }
  UI.unitPos = unitPos;
  // where a rider sits on the one it rides -- drawn there (unitObj) and picked there by the mouse (UI.pickUnit; 10-01, Griz: "I can't get any indication I'm
  // mousing over the one on his head"). k: the pixels' scale (1 on the world canvas, the zoom on the screen). The one it rides drawn bigger (Enlarge) carries it higher
  function perchPos(B, u, k) {
    var m = u.master, mf = m.facing || 0, fore = mf === 0 || mf === 1 || mf === 2 || mf === 7, mp = unitPos(B, m), mt = D.spr.unitTop(m) * D.spr.scaleOf(m) * k;
    // (the bat flutters about his head -- Griz, 09-30: "have it flutter around his head" -- a slow loop, in front of him and behind)
    var ba = B.t / 13 + (u.id || '').length;
    // (a darkmantle over the head it engulfs -- battle.js mount: sat on the head, in front of it, its foot a little below the crown)
    return u.perch === 'over' ? { x: mp.x, y: mp.y - mt + 13 * k, depth: mp.depth + 0.03, gz: mp.gz }
      : u.perch === 'shoulder' ? { x: mp.x + (fore ? -9 : 9) * k, y: mp.y - Math.round(mt * 0.48), depth: mp.depth + 0.02, gz: mp.gz }
      : u.perch === 'head' ? { x: mp.x + Math.round(11 * k * Math.cos(ba)), y: mp.y - Math.round(mt * 0.92) + Math.round(3 * k * Math.sin(ba * 2)), depth: mp.depth + (Math.sin(ba) > 0 ? 0.02 : -0.02), gz: mp.gz }
      : { x: mp.x + (fore ? 9 : -9) * k, y: mp.y + 3 * k, depth: mp.depth + 0.03, gz: mp.gz };
  }
  // in the water (10-02, Griz: "make the stair a stair and them be drawn underwater - barley looks like he's walking on top"): a map's `wade` (px of a figure under the
  // line on its water, the Flooded Stair's 13; none, a hand's depth, 3) on a still-water square; one held by a creature of the water (bound to it: the Keeper's Constrict,
  // its Drag Under) is drawn down under it to the crown of the head. What lives in the water (bound to it, a swimmer) and what flies is drawn as it was
  UI.wading = function (B, u) {
    var s = G.map && G.map.at(u.x, u.y); if (D.keeper && D.keeper.iced && D.keeper.iced(B, u.x, u.y)) return null; // (on ice: on top of it, not in the water -- js/keeper.js)
    if (u.kind === 'keeper' && D.keeper && s && s.ch === '~' && !u.dead) return D.keeper.wade(B, u); // (the Keeper stands in its pool as the heroes do: js/keeper.js K.wade)
    var s = G.map && G.map.at(u.x, u.y); if (!s || !(s.ch === '~' || s.deep) || u.bound || u.swims || u.riding || u.ethereal || u.under) return null;
    var def = G.map.def || {}, cut = def.waterLevel != null ? Math.min(Math.max(2, def.waterLevel - G.map.gz(u.x, u.y)), Math.round(D.spr.unitTop(u) * 0.8)) : def.wade != null ? def.wade : 3, sink = 0, k = (u.size || 1); // (a map's `waterLevel`: one flat sheet, so the depth is the sheet less the floor under it -- the Flooded Stair's steps; a drawing only)
    var hold = u.conds && u.conds.restrained && B.units.filter(function (w) { return w.id === u.conds.restrained.by; })[0];
    if (hold && hold.bound && hold.kind !== 'keeper' && !hold.dead && hold.hp > 0) sink = Math.max(0, D.spr.unitTop(u) - cut - 6); // (the Keeper's held sit in its swirl, not sunk: js/keeper.js)
    return { cut: Math.round(cut * k), sink: Math.round(sink) };
  };
  function unitObj(B, u) {
    if (u.object) return null; // (the skylight: no figure -- the overlay rings it, the strip's line says its hit points; 10-04 night)
    var p = unitPos(B, u), has = function (a) { return !!D.spr.anim(u.sheet, a); };
    // a familiar riding its wizard (js/familiar.js): the owls perched on his shoulder, the rest at his feet, drawn just after him
    // (it faces as he does -- Griz, 09-29: "facing left when he's facing north" -- and sits on the shoulder, not above the ear; the shoulder
    // is the one on the viewer's left while he faces toward the viewer, on the right while he faces away)
    if (u.riding && u.master) { u.facing = u.master.facing || 0; p = perchPos(B, u, 1); }
    if (u.kind === 'keeper' && u.dead && B.t - (u.deadT || B.t) > 50) return null; // (a destroyed Keeper is gone from the water: only calm waves stay, js/keeper.js)
    if (u.left) return null; // out of the fight, the way they came in
    if (u.kind === 'keeper' && D.keeper && !u.dead && (!u.anim || u.anim === 'idle')) D.keeper.face(B, u); // (it faces the party, idle: js/keeper.js)
    if (u.unseen) return null; // (asleep under the water or in its puddle: the Settling's, js/wet.js)
    if (u.dead && !has('hurt') && B.t - u.deadT > 50) return null;
    var obj = {
      depth: p.depth, gz: p.gz, layer: 1, unit: u, draw: function (ctx) {
        var o = { color: u.side === 'foe' ? R('violet', 3) : R('silver', 4) }, anim = u.anim, t = B.t - (u.animT || 0);
        var down = u.dead || u.hp <= 0, sk = D.spr.scaleOf(u); // (sk: Enlarge and Reduce draw it bigger or smaller about its foot, sprites.js scaleOf)
        // the cloaker hangs as a cloak until something hurts it (Griz, 09-29)
        if (!down && u.sheet === 'cloaker_p2' && !u.woken && anim === 'idle' && has('roost')) anim = 'roost';
        // the stirge latched on (10-05, Griz: "making it look like the stinger went in"): its own row, drawn at the shoulder of the one it drains
        if (!down && u.riding && u.attached && (anim === 'idle' || anim === 'walk') && has('latched')) anim = 'latched';
        // the ettercap sits braiding on its stump till it has had a turn or been hurt ("It stops braiding when it sees you": Griz's
        // idle sheet, 09-30); a creature that charges has come 20 ft and more this turn, and runs (the giant boar's sprint row)
        if (!down && !u.woken && !u.acted && anim === 'idle' && has('braid')) anim = 'braid';
        // the roper stands as a stalagmite the same way till its first turn or a wound (its Still row; js/ai.js plays its Reveal then -- 10-01e)
        if (!down && !u.woken && !u.acted && anim === 'idle' && has('still')) anim = 'still';
        if (!down && anim === 'walk' && u.charge && u.turn && (u.turn.moved || 0) >= 20 && has('run')) anim = 'run';
        // climbing (10-04, Griz: "climbing poses - might use them as stand in for the edifice fight"): up a face, along a rope, or hanging on one part way,
        // a sheet with a climb row plays it (battle.js moveAlong's tween modes); one hanging still holds its first frame
        var climbing = !down && has('climb') && ((u.tween && (u.tween.mode === 'climb' || u.tween.mode === 'ropedown')) || (u.hang && G.hanging(u)));
        if (climbing) { anim = 'climb'; o.once = false; if (!u.tween) o.frame = 0; }
        // prone (10-01b; the frame is sprites.js S.proneFrame): a figure with a frame for it falls to it when it goes prone, lies there while
        // prone -- crawling, striking, whatever it does -- and gets up through the same frames backwards when the prone ends. Going down
        // from prone, the fall goes on from where it lies
        var pf = D.spr.proneFrame(u.sheet), prow = D.spr.proneRow(u.sheet); // (prow: its own `prone` row, or its death row -- sprites.js S.proneRow, 10-02)
        if (pf >= 0 && !down && !!u.conds.prone !== !!u.proneLook) { u.proneLook = !!u.conds.prone; u.proneT = B.t; }
        if (down) {
          if (prow === 'prone' && u.proneLook) { anim = 'prone'; o.frame = pf; } // (down while it lies: it stays as it lies)
          else if (has('hurt')) { anim = 'hurt'; o.once = true; if (pf >= 0 && u.proneLook) t += Math.ceil(pf * 60 / (D.spr.anim(u.sheet, 'hurt').fps || 8)); }
          else if (u.dead) { anim = 'idle'; o.alpha = Math.max(0, 1 - (B.t - u.deadT) / 50); o.tint = R('violet', 4); o.tintAlpha = 0.5; }
          else { anim = 'idle'; o.lie = true; }
        } else if (anim === 'attack' || anim === 'cast' || anim === 'flinch' || anim === 'clack' || anim === 'burrow' || anim === 'reveal' || anim === 'reel' || /^(claw|bite|tendril|tentacles|beak|greatclub|rock)\d?$/.test(anim)) { o.once = true; if (!has(anim) || t > D.spr.duration(u.sheet, anim) + 6) { anim = 'idle'; o.once = false; } } // (back to idle, and idle loops: the flinch's once held its last frame on anyone struck who then did not act -- the landlord, 09-30g)
        if (anim === 'idle' || anim === 'walk' || anim === 'slither' || anim === 'roost' || anim === 'braid' || anim === 'run' || anim === 'still' || anim === 'climb') t =u.conds.paralyzed || u.conds.asleep ? 0 : B.t + (u.id ? u.id.length * 7 : 0);
        // a hyena helpless with laughter rolls on the floor with it, for as long as it laughs (09-30; since 10-02 the hyenas caught by Aurdin's joke: js/grimoire.js M.hyena)
        if (!down && u.conds.laughing && has('rofl')) { anim = 'rofl'; o.once = false; t = B.t + (u.id ? u.id.length * 7 : 0); }
        // a gnoll's fit on its own row (10-02, Griz's order of its sheet's poses, beat by beat: js/grimoire.js M.LAUGH; the laughs fire there on the same beats)
        else if (!down && u.conds.laughing && has('laugh')) { anim = 'laugh'; o.frame = D.magic.laughFrame(B, u); }
        // one laughing with no fall frame and no rofl or laugh row: on its side (the gnolls stood there laughing, 10-02, before their sheet's own rows were cut)
        else if (!down && u.conds.laughing && pf < 0) { anim = 'idle'; o.lie = true; t = B.t + (u.id ? u.id.length * 7 : 0); o.rock = Math.sin(t / 3.5) * 0.14 * (Math.sin(t / 23) > -0.3 ? 1 : 0.3); } // (shaking with it, in fits)
        else if (pf >= 0 && !down && u.proneT != null) {
          var pk = Math.floor((B.t - u.proneT) * (D.spr.anim(u.sheet, prow).fps || 8) / 60);
          if (u.proneLook) { anim = prow; o.frame = Math.min(pk, pf); }
          else if (has('getup')) { var ga = D.spr.anim(u.sheet, 'getup'), gk = Math.floor((B.t - u.proneT) * (ga.fps || 8) / 60); if (gk < ga.frames) { anim = 'getup'; o.frame = gk; } } // (a sheet's own get-up, played forward: the gnolls', 10-02 -- off the back, over, onto its knees, up)
          else if (pk < pf) { anim = prow; o.frame = pf - 1 - pk; } // (getting up)
        }
        // under the ground (a burrower, js/ai.js, 10-01d): its mound, the Burrow row's last frame, sliding where it goes -- "like a fin through
        // water" (the 8-bit game's line for the bulette); a sheet with no Burrow row, the ethereal ghost below in earth's colour
        if (u.under && !down && has('burrow')) { // (going under: the row from where it began, then its last frame held -- 10-01d)
          var bf = D.spr.anim(u.sheet, 'burrow'), sinking = u.anim === 'burrow' ? Math.floor((B.t - (u.animT || 0)) * (bf.fps || 8) / 60) : bf.frames;
          anim = 'burrow'; o.frame = Math.min(bf.frames - 1, Math.max(0, sinking)); o.once = false;
        }
        else if (u.under && !down) { o.alpha = 0.3; o.tint = R('leather', 2); o.tintAlpha = 0.9; }
        else if (u.ethereal) { o.alpha = 0.16 + 0.06 * Math.sin(B.t / 9); o.tint = R('violet', 5); o.tintAlpha = 0.9; }
        if ((u.conds.hidden || u.conds.invisible) && !down) o.alpha = 0.5;
        if ((B.darks || []).length && D.magic.inDark(B, u)) o.alpha = u.side === 'foe' ? 0.33 : 0.5; // (inside the darkness: a shape, if that -- 0.33, not 0.2: 10-01, Griz, "if that's always true it's fine 20% - if not let's bump to 33%" -- the dashed ring that marks one the hero can't see shows only on a hero's own turn, and the darkmantle beside Aurdin looked dead)
        // in the dark where no one of the party sees (torchdark 09-28): the player sees it still, grey and faint; by darkvision, grey
        if (B.dark && u.side === 'foe' && !down && !u.flash) { var ps = D.light.partySees(B, u); if (ps < 2) { o.alpha = Math.min(o.alpha == null ? 1 : o.alpha, ps === 1 ? 0.85 : 0.6); o.tint = R('stone', 3); o.tintAlpha = ps === 1 ? 0.3 : 0.5; } }
        var lt = D.looks && !down && D.looks.tint(u, B); if (lt) { o.tint = lt[0]; o.tintAlpha = lt[1]; } // (stoneskin, barkskin, rage: js/looks.js)
        if (u.flash > 0) { var fe = u.flashEl && FX.EL && FX.EL[u.flashEl]; o.tint = fe ? fe.c[1] : R('bone', 2); o.tintAlpha = fe ? 0.55 : 0.85; } // (a blow of an element flashes its colour: js/looks.js)
        else if (u.conds.faerie && !down && !u.ethereal) { o.tint = R('violet', 5); o.tintAlpha = 0.25 + 0.15 * Math.sin(B.t / 7); }
        else if (u.conds.paralyzed || u.conds.stunned) { o.tint = R('violet', 4); o.tintAlpha = 0.35; }
        else if (u.conds.restrained) { o.tint = R('bone', 1); o.tintAlpha = 0.3; }
        if (!u.ethereal && !(u.dead && !has('hurt')) && !(u.riding && (u.perch === 'shoulder' || u.perch === 'head' || u.perch === 'over'))) {
          var s = u.size || 1;
          ctx.fillStyle = 'rgba(10,8,16,.38)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 10 * s * sk + 1, 4 * s * sk + 1, 0, 0, 7); ctx.fill();
        }
        // the party sees it, the one whose turn it is does not (10-01b, the bond -- Griz: "yes 3"): a quiet dashed ring at its feet, so the
        // player knows this hero's spells that want "a creature you can see" and its attacks are not for it from here (magic.js seeWhy)
        var ah = B.active;
        if (u.side === 'foe' && !down && !u.ethereal && ah && ah.side === 'party' && !ah.guest && G.standing(ah) && B.req && B.req.turn === ah && !D.magic.sees(B, ah, u)) {
          var rs = u.size || 1; ctx.save(); ctx.setLineDash([2, 2]); ctx.strokeStyle = 'rgba(150,160,205,0.75)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(p.x, p.y, 10 * rs * sk + 3, 4 * rs * sk + 2, 0, 0, 7); ctx.stroke(); ctx.restore();
        }
        // a rider's body (the drider's spider half) goes dark unless something else tints it; the rider on top
        var body = u.rider && !o.tint ? Object.assign({}, o, { tint: R('outline', 0), tintAlpha: 0.5 }) : o;
        if (sk !== 1) { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(sk, sk); ctx.translate(-p.x, -p.y); } // (the figure and what stands behind it, grown about the foot)
        if (D.looks && !down && !u.ethereal) D.looks.behind(ctx, B, u, p, anim === 'hurt' && !has('hurt') ? 'idle' : anim, t, o); // (false images, blur, haste: js/looks.js)
        // (a flier whose sheet walks on the ground -- the bat stand-in -- is drawn up in the air when out on the field, bobbing; its shadow stays below)
        var lift = u.lift && !u.riding && !down ? u.lift + Math.round(2 * Math.sin(B.t / 6)) : 0;
        var wet = !down && !lift ? UI.wading(B, u) : null, an0 = anim === 'hurt' && !has('hurt') ? 'idle' : anim;
        if (u.kind === 'keeper' && u.flooding) { /* it is the swirl about someone: drawn with the walls' props (js/keeper.js), no humanoid */ }
        else if (wet) { // (in the water: the figure above its line, the rest a ghost under it, a ripple on the line; held by the Keeper, drawn down under it -- 10-02)
          var wl = p.y - wet.cut, sy = p.y + wet.sink, tallW = D.spr.unitTop(u) * sk + 8;
          var cw = u.kind === 'keeper' ? 100 : 60; ctx.save(); ctx.beginPath(); ctx.rect(p.x - cw, sy - tallW - 20, cw * 2, wl - (sy - tallW - 20)); ctx.clip(); D.spr.draw(ctx, u.sheet, an0, u.facing || 0, t, p.x, sy, body); ctx.restore();
          ctx.save(); ctx.beginPath(); ctx.rect(p.x - cw, wl, cw * 2, 80); ctx.clip(); D.spr.draw(ctx, u.sheet, an0, u.facing || 0, t, p.x, sy, Object.assign({}, body, { alpha: 0.28, tint: R('glow', 1), tintAlpha: 0.6 })); ctx.restore();
          var rw = 9 * (u.size || 1) * sk + Math.sin(B.t / 9) * 1.5, rh = rw * 0.38; if (u.kind === 'keeper') { rw = 58 + Math.sin(B.t / 9) * 2; rh = 29 + Math.sin(B.t / 9); } /* (the Keeper's water line is the ellipse in its own 2x2: Griz 10-03, "the 2x2 centred on the circle around his thighs") */ ctx.save(); ctx.strokeStyle = 'rgba(170,200,230,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, wl, rw, rh, 0, 0, 7); ctx.stroke(); ctx.restore();
          if (wet.sink) for (var bi = 0; bi < 3; bi++) { var bp = ((B.t + bi * 17) % 40) / 40; ctx.fillStyle = 'rgba(200,225,245,' + (0.7 * (1 - bp)).toFixed(2) + ')'; ctx.fillRect(Math.round(p.x - 4 + bi * 4 + Math.sin((B.t + bi * 9) / 5) * 1.5), Math.round(wl - bp * 14), 1 + (bi % 2), 1 + (bi % 2)); } // (the breath going up)
        } else D.spr.draw(ctx, u.sheet, an0, u.facing || 0, t, p.x, p.y - lift, body);
        // ?footprint: the Keeper's mechanical squares (what the grid, the ice and the area spells ask), their centre, and its water line, over the drawing (Griz 10-03: check the 2x2 against the ring)
        if (D.footprintDebug && u.kind === 'keeper' && !u.dead) {
          ctx.save(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,60,60,0.9)';
          G.foot(u).forEach(function (q) { var c = D.iso.center(q[0], q[1], G.map.gz(q[0], q[1])), sc = D.iso.toScreen(c.x, c.y), hw = D.iso.TW / 2, hh = D.iso.TH / 2; ctx.beginPath(); ctx.moveTo(sc.x, sc.y - hh); ctx.lineTo(sc.x + hw, sc.y); ctx.lineTo(sc.x, sc.y + hh); ctx.lineTo(sc.x - hw, sc.y); ctx.closePath(); ctx.stroke(); });
          ctx.strokeStyle = 'rgba(60,255,60,0.9)'; ctx.beginPath(); ctx.moveTo(p.x - 6, p.y); ctx.lineTo(p.x + 6, p.y); ctx.moveTo(p.x, p.y - 6); ctx.lineTo(p.x, p.y + 6); ctx.stroke(); ctx.restore();
        }
        // what was drawn, for the x-ray after the world (a standing figure only: the fallen lie low)
        var hw = 10 * (u.size || 1) * sk, tall = D.spr.unitTop(u);
        obj.shown = down || u.ethereal ? null : { anim: anim, t: t, once: !!o.once, frame: o.frame, x: p.x, y: p.y, k: sk, box: [p.x - hw, p.y - tall, p.x + hw, p.y] };
        if (u.rider && !down) D.spr.drawRider(ctx, u, anim, t, p.x, p.y, o);
        if (sk !== 1) ctx.restore();
        if (D.looks && !down && !u.ethereal) D.looks.over(ctx, B, u, p); // (the marks of its conditions: js/looks.js)
        if (!u.dead && !u.ethereal && (!u.riding || u.attached)) { // (a darkmantle on someone keeps its bar, over it)
          var top = tall, w = u.size > 1 ? 30 : 20, bx = p.x - w / 2, by = p.y - top - 5;
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
      D.spr.outline(ctx, u.sheet, o.shown.anim === 'hurt' && !D.spr.anim(u.sheet, 'hurt') ? 'idle' : o.shown.anim, u.facing || 0, o.shown.t, o.shown.x, o.shown.y, col, { alpha: 0.9, once: o.shown.once, frame: o.shown.frame, scale: o.shown.k });
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
  // the squares of a web that are drawn: a web a spell cast from outside a Globe of Invulnerability has no strands on the squares inside it (SRD 5.1: "the area
  // within the barrier is excluded from the areas affected by such spells"; js/grimoire.js M.zoneGlobed; 10-01, Griz: "let's fix it now"). A map's own strung webs
  // (`ground`) were not cast from anywhere, and are drawn whole
  function webSq(B, wb) {
    var Mg = D.magic; if (!Mg || !Mg.zoneGlobed || !(B.globes || []).length || wb.ground) return wb.sq;
    return wb.sq.filter(function (q) { return !Mg.zoneGlobed(B, wb, { x: q[0], y: q[1] }); });
  }
  function webGeo(B) {
    var m = G.map, key = (B.webs || []).map(function (w) { return w.by + ':' + webSq(B, w).map(function (q) { return q[0] + ',' + q[1]; }).join(' '); }).join('|');
    if (B.webGeo && B.webGeo.key === key && B.webGeo.map === m) return B.webGeo;
    var pieces = [];
    (B.webs || []).forEach(function (wb) {
      var cube = !!wb.dc && !wb.ground, left = {}, mine = [], wsq = webSq(B, wb);
      wsq.forEach(function (q) { left[q[0] + ',' + q[1]] = q; });
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
  // a rope (B.ropes, 10-04): hung straight down the face from the edge between its top and its foot, in the sort just in front of the face, so a figure hanging on it is
  // drawn over it; and at the top the grapple -- tiny, for the look (Griz: "yeah, tiny was for appearance in game")
  var HOOK = [[0, -3], [0, -2], [0, -1], [-2, -2], [-1, -1], [2, -2], [1, -1]];
  function ropeObjs(B) {
    return (B.ropes || []).filter(function (r) { return !r.cut; }).map(function (r) {
      var ex = (r.at[0] + r.foot[0]) / 2, ey = (r.at[1] + r.foot[1]) / 2, zt = G.map.gz(r.at[0], r.at[1]), zf = G.map.gz(r.foot[0], r.foot[1]);
      return { depth: r.foot[0] + r.foot[1] + 0.3, gz: zf, layer: 1, draw: function (ctx) {
        var a = D.iso.center(ex, ey, zt), b = D.iso.center(ex, ey, zf), p = D.iso.toScreen(a.x, a.y), q = D.iso.toScreen(b.x, b.y);
        ctx.fillStyle = R('outline', 0); ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, Math.max(1, Math.round(q.y - p.y)));
        ctx.fillStyle = R('leather', 3); ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, Math.max(1, Math.round(q.y - p.y)));
        for (var k = 4; k < q.y - p.y; k += 5) { ctx.fillStyle = R('leather', 1); ctx.fillRect(Math.round(p.x), Math.round(p.y) + k, 1, 1); } // (the lay of the hemp)
        ctx.fillStyle = R('outline', 0); HOOK.forEach(function (h) { ctx.fillRect(Math.round(p.x) + h[0] - 1, Math.round(p.y) + h[1] - 1, 3, 3); });
        ctx.fillStyle = R('silver', 5); HOOK.forEach(function (h) { ctx.fillRect(Math.round(p.x) + h[0], Math.round(p.y) + h[1], 1, 1); });
      } };
    });
  }
  function webObjs(B) {
    if (!(B.webs || []).some(function (w) { return webSq(B, w).length; })) return [];
    return webGeo(B).pieces.map(function (p) { return { depth: p.depth, gz: p.gz, layer: 1, draw: function (ctx) { webPieceDraw(ctx, B, p); } }; });
  }
  // the floor under a web: the patch's outline, so where it holds reads at a glance (the overlay, under everything)
  function webFloor(B) {
    (B.webs || []).forEach(function (wb) {
      var has = {}, wsq = webSq(B, wb); wsq.forEach(function (q) { has[q[0] + ',' + q[1]] = 1; });
      wsq.forEach(function (q) {
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
  // the path's dots are queued and drawn after the light pass (10-04, Griz: brighter, or not dimmed by the room's light): the overlay runs before D.light.pass,
  // so a dark room dimmed them; each is a 3x3 dot on a dark 5x5 backing, so the white reads on pale floor too
  var PATHDOTS = [];
  function dotSq(x, y, color) { var p = D.iso.center(x, y, G.map.gz(x, y)), s = D.iso.toScreen(p.x, p.y); PATHDOTS.push({ x: s.x, y: s.y, color: color }); }
  var LABELS = []; // (a few words pinned to a world point, drawn after the sort: the rung's height and cost -- 10-04 night)
  function drawLabels(c) { LABELS.forEach(function (l) { D.text(c, l.text, l.x, l.y, l.color); }); LABELS = []; }
  function drawPathDots(c) { PATHDOTS.forEach(function (d) { c.fillStyle = R('outline', 0); c.fillRect(d.x - 2, d.y - 2, 5, 5); c.fillStyle = d.color; c.fillRect(d.x - 1, d.y - 1, 3, 3); }); PATHDOTS = []; }
  // difficult ground, marked while a move is being chosen (Griz, 10-04: "when a player's move is active, can there be markers on difficult terrain?"): a small gold X on each square the mover
  // could reach where a step in costs more than a plain one (rubble, water, web, ice, thorns); drawn with the dots, after the light pass
  // (10-04 again, Griz: "move the marker to the outside, use ^ instead of x... we could stack ^ for climbs"): a gold ^ toward the square's near edge, off the middle where the path's dots
  // run; and on a square a step into which climbs a cliff (grid.js G.climbsUp), cyan ^s stacked, one for every 5 ft of the climb (six at most)
  var PATHMARKS = [];
  function slowSquares(B, u, rc) {
    if (rc.slow) return rc.slow;
    var out = [], base = 5 + (G.prone(u) ? 5 : 0), seen = {};
    [rc.move, rc.dash || {}].forEach(function (m) { Object.keys(m).forEach(function (k) {
      var e = m[k]; if (!e.stand || seen[k]) return; seen[k] = 1;
      var c = G.stepCost(u, e.x, e.y, e.x, e.y), pv = e.prev && m[e.prev], cs = pv ? G.climbsUp(u, pv.x, pv.y, e.x, e.y) : 0;
      if (cs) out.push([e.x, e.y, 'climb', Math.min(6, Math.ceil(cs / 2))]);
      else if (c !== Infinity && c > base) out.push([e.x, e.y, 'slow', 1]);
    }); });
    return (rc.slow = out);
  }
  function markSq(x, y, kind, n) { var p = D.iso.center(x, y, G.map.gz(x, y)), s = D.iso.toScreen(p.x, p.y); PATHMARKS.push({ x: s.x, y: s.y + 9, kind: kind, n: n || 1 }); }
  var CARET = [[-2, 1], [-1, 0], [0, -1], [1, 0], [2, 1]];
  function drawPathMarks(c) {
    PATHMARKS.forEach(function (d) {
      for (var i = 0; i < d.n; i++) { var oy = d.y - 3 * i; c.fillStyle = R('outline', 0); CARET.forEach(function (q) { c.fillRect(d.x + q[0] - 1, oy + q[1] - 1, 3, 3); }); }
      c.fillStyle = d.kind === 'climb' ? R('glow', 2) : R('gold', 4);
      for (var j = 0; j < d.n; j++) { var oy2 = d.y - 3 * j; CARET.forEach(function (q) { c.fillRect(d.x + q[0], oy2 + q[1], 1, 1); }); }
    });
    PATHMARKS = [];
  }
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
    // magical darkness, and the clouds that are heavily obscured like it: fog (pale), a stinking cloud (sulphur yellow), Cloudkill (a paler, greener poison), sleet (cold)
    // (10-01: the two poison clouds were the same moss; their colours are js/looks.js LK.CLOUD's, the volume drawn over this wash is theirs too)
    var CK = (D.looks && D.looks.CLOUD) || {};
    (B.darks || []).forEach(function (dk) {
      var k = dk.kind || 'darkness', col = k === 'fog' ? R('silver', 5) : k === 'stink' ? (CK.stink ? CK.stink.floor : R('orc', 3)) : k === 'kill' ? (CK.kill ? CK.kill.floor : R('moss', 2)) : k === 'sleet' ? R('glow', 1) : '#040308', a = k === 'darkness' ? 0.86 : k === 'sleet' ? 0.4 : 0.5;
      D.magic.darkSq(B, dk).forEach(function (q) { fillSq(ctx, q[0], q[1], col, a); });
    });
    if (D.looks) D.looks.ground(ctx, B, onSq); // the spell ground, holy rings, the darkness's edge (js/looks.js)
    // a torch's throw: the squares within 20 ft it may land on
    // the Rope & Grapple's picks: the tops of faces it can be tied to or thrown up to (the rope's 50 ft: ten squares out -- 10-05)
    if (u && B.tool === 'rope') for (var ry = u.y - 10; ry <= u.y + 10; ry++) for (var rx = u.x - 10; rx <= u.x + 10; rx++) if (D.Battle.ropeSq(B, u, rx, ry)) lineSq(ctx, rx, ry, R('gold', 3), 0.6, 4);
    if (u && B.tool === 'torch') for (var ty = u.y - 4; ty <= u.y + 4; ty++) for (var tx = u.x - 4; tx <= u.x + 4; tx++) if (UI.throwSq(u, tx, ty)) lineSq(ctx, tx, ty, R('gold', 3), 0.5, 4);
    if (B.active && !B.active.ethereal) G.foot(B.active).forEach(function (q) { lineSq(ctx, q[0], q[1], R('gold', 4), 0.9, 3); });
    // a pick on the grid (pickInput): the ones it may go to in gold, brighter under the cursor
    var pk = B.req && B.req.prompt && B.req.prompt.pick;
    if (pk) {
      var on = pickAt(B, B.req.prompt);
      pk.forEach(function (w) { G.foot(w).forEach(function (q) { fillSq(ctx, q[0], q[1], R('gold', 3), w === on ? 0.34 : 0.13, 2); lineSq(ctx, q[0], q[1], R('gold', 4), w === on ? 1 : 0.65, 2); }); });
      if (!on) lineSq(ctx, B.cursor.x, B.cursor.y, R('bone', 1), 0.8, 1);
    }
    if (!u) return;
    var T = u.turn, tool = B.tool, cx = B.cursor.x, cy = B.cursor.y;
    if (tool === 'move' || tool === 'menu' || tool === 'attack') {
      var rc = reachCache(B, u);
      if (rc.dash) Object.keys(rc.dash).forEach(function (k) { var e = rc.dash[k]; if (e.stand && !rc.move[k]) fillSq(ctx, e.x, e.y, R('glow', 1), 0.07); });
      if (tool === 'move' && T.move > 0 && !u.conds.restrained) slowSquares(B, u, rc).forEach(function (q) { markSq(q[0], q[1], q[2], q[3]); }); // (difficult ground and the climbs, marked: 10-04)
      if ((u.size || 1) > 1 && tool !== 'attack' && !(cx === u.x && cy === u.y) && !occ(cx, cy)) { // (a big creature's pick: all of the squares of its body at the cursor, green where it may stand, red where not -- 10-03, the Keeper's 2x2)
        var vv = UI.valid(B, u, cx, cy), okk = vv === 'ok' || vv === 'far';
        G.foot(u, cx, cy).forEach(function (q) { if (G.map.at(q[0], q[1])) { fillSq(ctx, q[0], q[1], okk ? R('moss', 2) : R('red', 3), 0.3, 2); lineSq(ctx, q[0], q[1], okk ? R('moss', 3) : R('red', 4), 0.95, 2); } });
      }
      Object.keys(rc.move).forEach(function (k) { var e = rc.move[k]; if (e.stand && e.cost > 0) fillSq(ctx, e.x, e.y, R('glow', 1), 0.17); });
      // a rogue's places to try hiding (no foe she knows of sees her there plainly): always, as she moves (Griz, 09-27)
      // the ways out: a pale marker on each (set design, 09-27)
      (B.exits || []).forEach(function (q) { lineSq(ctx, q[0], q[1], R('moss', 2), 0.7); }); // (plainer, 10-04: Griz's "Keeper Fight lacks fight escape" and the Wet's "not on wheel")
      if (u.cls === 'rogue') { var hs = hideSpots(B, u); Object.keys(hs).forEach(function (k) { if (!hs[k]) return; var q = k.split(','); fillSq(ctx, +q[0], +q[1], R('violet', 3), 0.42, 5); }); }
      if (T.attacksLeft || T.action) B.units.forEach(function (w) {
        if (!G.hostile(u, w) || !G.standing(w) || !B.canHit(u, w)) return;
        G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], R('red', 4), 0.9); });
      });
      // flanking: a gold gem on each square (her own included) where she'd flank a foe with an ally across it (Griz, 09-27)
      var fs = flankSpots(B, u);
      Object.keys(fs).forEach(function (k) { var q = k.split(','); fillSq(ctx, +q[0], +q[1], R('gold', 4), 0.8, 11); });
      var e2 = rc.move[cx + ',' + cy] || (rc.dash && rc.dash[cx + ',' + cy]);
      // the path's dots (10-01b, Griz: "we have pathing dots when you're selecting a tile to move to that seem to be always white - how bout we
      // make those green for the bonus longstrider and yellow when you mouse into range that will ask you about your dash when you click"):
      // white within the move, green on the steps Longstrider's +10 ft pays for (the last 10 ft of the turn's move), yellow past the move
      if (e2 && e2.stand && !G.occupant(cx, cy, u)) {
        var pmap = rc.dash && rc.dash[cx + ',' + cy] && !rc.move[cx + ',' + cy] ? rc.dash : rc.move, walked = T.moved || 0, budget = T.move + walked, ls = u.conds.longstrider ? 10 : 0;
        (G.path(pmap, cx, cy) || []).forEach(function (q) { var st = pmap[q[0] + ',' + q[1]], c = st ? st.cost : 0; dotSq(q[0], q[1], c > T.move ? R('gold', 4) : ls && walked + c > budget - ls ? R('orc', 3) : R('bone', 2)); }); // (the leaf green: the moss ramp is too dark to read as a dot)
      }
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
    if (tool === 'help') B.units.forEach(function (w) { if ((G.hostile(u, w) && G.standing(w) && G.dist(u, w) <= 5) || D.Battle.helpable(u, w)) G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], G.hostile(u, w) ? R('bone', 2) : R('moss', 3), 0.9); }); }); // (a friend to help: green)
    if (tool === 'detach') D.Battle.pullable(u, B.units).forEach(function (r) { lineSq(ctx, r.master.x, r.master.y, R('moss', 3), 0.9); }); // (a friend with a darkmantle on: green)
    if (tool === 'lay') B.units.forEach(function (w) { if (w.side === u.side && !w.dead && (w === u || G.dist(u, w) <= 5)) G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], R('gold', 4), 0.9); }); });
    if (tool === 'item') B.units.forEach(function (w) { if (B.itemTargetOK(u, B.itemId, w)) G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], G.hostile(u, w) ? R('red', 4) : R('moss', 2), 0.9); }); });
    if (tool === 'spell') {
      var S = B.spell, g = S.g, M = D.magic, harm = S.sp.kind === 'save' || S.sp.kind === 'attack' || S.sp.kind === 'auto';
      if (g.shape === 'sphere' || g.shape === 'cube' || g.shape === 'cone' || g.shape === 'line' || g.shape === 'wave' || g.shape === 'wall') {
        var col = S.id === 'wallofstone' ? R('stone', 3) : S.id === 'wallofthorns' || S.id === 'conjureanimals' || S.id === 'conjurewoodlandbeings' ? R('moss', 2) : S.id === 'windwall' ? R('bone', 2) : S.id === 'web' ? R('bone', 1) : S.id === 'sleep' ? R('violet', 4) : S.sp.el === 'cold' || S.sp.el === 'lightning' ? R('glow', 1) : R('fire', 1);
        // (the Globe of Invulnerability, SRD 5.1: "the area within the barrier is excluded from the areas affected by such spells" -- a square the spell, cast now, could not reach is not tinted.
        // M.globed, js/grimoire.js, asks the globe against the spell's own level (S.sp.level, not the slot), from where the caster would cast it: where he stands, or, for a spell used again
        // (g.free: Moonbeam moved, the sphere rolled), where it was first cast, M.castOrigin -- as magic.js M.globeShuts does. 10-01, the fog-and-dark runner's find: the preview tinted them)
        var org = g.free && M.castOrigin ? M.castOrigin(B, u, g) : u, globes = (B.globes || []).length && M.globed;
        M.area(u, g, cx, cy).forEach(function (q) { if (globes && M.globed(B, org, { x: q[0], y: q[1] }, S.sp.level)) return; fillSq(ctx, q[0], q[1], col, 0.38); });
      } else if (g.shape === 'teleport') B.mistyTargets(u, g.range, g.see).forEach(function (q) { lineSq(ctx, q[0], q[1], R('glow', 2), 0.6, 4); });
      else B.units.forEach(function (w) {
        if (!M.targetOK(B, u, g, w)) return;
        var picked = B.picks.filter(function (p) { return p === w; }).length;
        G.foot(w).forEach(function (q) { lineSq(ctx, q[0], q[1], G.hostile(u, w) ? R('red', 4) : R('gold', 4), picked ? 1 : 0.7, picked ? 1 : 2); });
        if (picked) { var pp = UI.unitPos(B, w); DEFER.push({ depth: 1e6, gz: 0, draw: function (c) { D.text(c, picked > 1 ? 'x' + picked : 'v', pp.x + 10, pp.y - 8, harm ? R('fire', 2) : R('gold', 4)); } }); }
      });
    }
    // the skylight (a defend fight, 10-04 night): the glass over the hole ringed, and its hit points' share as a wash
    if (B.skylight && G.standing(B.skylight)) { var skq = B.skylight, skf = skq.hp / skq.maxhp; fillSq(ctx, skq.x, skq.y, skf > 0.5 ? R('glow', 2) : skf > 0.25 ? R('gold', 3) : R('red', 4), 0.18 + 0.1 * Math.sin(B.t / 8), 2); lineSq(ctx, skq.x, skq.y, R('glow', 2), 0.9, 2); }
    // the passages (Battle.passageAt, 10-04 night): both ends outlined, so the vault door and the roof's hatch read as a pair
    if (B.passagesOpen) (B.passages || []).forEach(function (p) { lineSq(ctx, p.at[0], p.at[1], R('gold', 3), 0.55, 4); lineSq(ctx, p.to[0], p.to[1], R('gold', 3), 0.55, 4); });
    // a rung of a rope the mouse is on (ropeRung, 10-04 night): the face, the rung at the height picked, and where the figure will hang
    if (B.ropePick && (tool === 'move' || tool === 'menu' || tool === 'attack')) drawRung(B, u, B.ropePick);
    var clW = clingOf(B); if (clW) drawRung(B, u, { rope: { at: clW.hang.face, foot: clW.hang.foot }, z: clW.hang.z, ok: true, cling: true }); // (a figure clinging to a face, the mouse on it: the face, its height, the same gold -- clingOf, 10-05)
    // the cursor: red where the current thing can't go
    var s0 = G.map.at(cx, cy);
    if (s0 && s0.open) { var v = UI.valid(B, u, cx, cy); lineSq(ctx, cx, cy, v === 'no' ? R('red', 4) : v === 'cut' ? R('fire', 2) : v === 'far' || v === 'rope' || v === 'rung' || v === 'take' || v === 'takelight' ? R('gold', 2) : v === 'self' ? R('gold', 4) : R('bone', 2), 1, 1); }
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
    if (B.inspect || B.list || (B.req && ((B.req.prompt && !B.req.prompt.pick) || B.req.entry))) return; // (a pick on the grid keeps the tooltip)
    var w = underCursor(B), lines = []; // (a darkmantle on a head the mouse is on, or the one the attack cued would strike)
    if (w && w !== B.active) {
      lines.push((w.side === 'foe' ? '{r}' : '{c}') + w.name + '{/}  HP ' + w.hp + '/' + w.maxhp + '  AC ' + RU.ac(w) + conds(w));
      if (w.hang && w.hang.face && G.hanging(w)) { var clZ = G.map.gz(w.hang.foot[0], w.hang.foot[1]), clS = G.map.def.step, clUp = Math.round((w.hang.z - clZ) / clS * 5) / 2, clTop = Math.round((G.map.gz(w.hang.face[0], w.hang.face[1]) - w.hang.z) / clS * 5) / 2; lines.push('{y}on the face{/}: ' + clUp + ' ft up, ' + clTop + ' ft to the top'); } // (a clinger: the rope's line for a face -- 10-05, Griz: "ensure 5 foot")
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
    } else if (u && B.tool === 'rope') { // (the Rope & Grapple's pick under the cursor: the throw and its DC -- 10-05, Griz: "go with +2 DC per 5 beyond 30")
      var rqT = D.Battle.ropeSq(B, u, B.cursor.x, B.cursor.y);
      lines.push(rqT ? (rqT.top ? '{y}tie the rope off here{/}: no roll' : '{y}throw the grapple up{/}: ' + rqT.ft + ' ft, {n}DEX DC ' + rqT.dc + '{/}  {g}(10 to 30 ft, 2 more each 5 ft past; 50 ft of rope){/}') : '{g}no top of a face the rope reaches from here{/}');
    } else if (u && B.tool === 'item' && B.itemId === 'oil' && D.oil) { // (the flask aimed: at whom, or at the ground -- js/oil.js, 10-05)
      var owT = G.occupant(B.cursor.x, B.cursor.y), lit0 = D.oil.lit(u);
      if (owT && B.itemTargetOK(u, 'oil', owT)) lines.push('{y}throw it at ' + D.Battle.nm(owT) + '{/}: an improvised ranged attack, ' + (lit0 ? 'lit -- {o}5 fire{/} on a hit' : 'a hit coats it (the next fire, 5 more)') + '; a miss oils its square');
      else if (!owT && D.oil.squareOK(B, u, B.cursor.x, B.cursor.y)) lines.push('{y}oil this square{/}' + (lit0 || (D.oil.at(B, B.cursor.x, B.cursor.y) || {}).lit != null || (B.lights || []).some(function (l) { return l.flame && Math.round(l.x) === B.cursor.x && Math.round(l.y) === B.cursor.y; }) ? ': {o}it catches{/} -- 2 rounds, 5 fire to enter it or end a turn in it' : ': no roll; a torch or any fire on it lights it'));
    } else if (u && (B.tool === 'move' || B.tool === 'menu' || B.tool === 'attack')) {
      var k = B.cursor.x + ',' + B.cursor.y;
      if (u.conds.prone && B.cursor.x === u.x && B.cursor.y === u.y) { var halfS = Math.floor(u.speed / 2); lines.push('{y}prone{/}: ' + (RU.canRise(u) && u.turn.move >= halfS ? '{n}click here to stand (half the speed: ' + halfS + ' ft of the move){/}' : '{o}' + (!RU.canRise(u) ? 'cannot stand' : 'no move left to stand: ' + halfS + ' ft needed') + '{/}')); } // (10-04 night)
      if (!B.passagesOpen && (B.passages || []).some(function (p) { return p.at[0] === B.cursor.x && p.at[1] === B.cursor.y; })) lines.push('{y}' + (B.passages.filter(function (p) { return p.at[0] === B.cursor.x && p.at[1] === B.cursor.y; })[0].name) + '{/}: shut'); // (the passages shut by default, 10-04 night)
      var pgT = D.Battle.passageAt(B, B.cursor.x, B.cursor.y); if (pgT) lines.push('{y}' + pgT.name + '{/}: ' + (pgT.inward ? 'GO IN -- through it and up the stair inside, out onto the roof' : 'COME OUT -- down the stair inside, out onto the street') + '  {g}(stand on it: the rest of the move, half the speed at least){/}'); // (a passage, 10-04 night)
      if (B.ropeBucket && B.cursor.x === B.ropeBucket[0] && B.cursor.y === B.ropeBucket[1]) lines.push('{y}the rope bucket{/}: a Rope & Grapple for anyone beside it -- {n}free, one a turn, and there is always another{/} (TAKE A ROPE on the ring)'); // (10-04 night)
      var rpT = !B.ropePick && D.Battle.ropeAt(B, B.cursor.x, B.cursor.y); // (a rope's grapple under the cursor: what the click does -- 10-04 night)
      if (rpT) {
        var cutT = D.Battle.canCutRope(B, u, rpT), hgT = D.Battle.ropeHanger(B, rpT), tkT = D.Battle.canTakeRope(B, u, rpT);
        if (cutT) lines.push('{y}the rope{/}: the ' + B.shortName(cutT.foe) + ' hangs on it, ' + cutT.ft + ' ft up  ' + (cutT.ok ? '{n}click: strike the rope (AC 11, 2 HP) -- cut, it drops the ' + B.shortName(cutT.foe) + ' ' + cutT.ft + ' ft{/}' : '{o}' + cutT.why + '{/}'));
        else if (hgT) lines.push('{y}the rope{/}: ' + hgT.name + ' hangs on it');
        else lines.push('{y}the rope\'s grapple{/}  ' + (tkT.ok ? '{n}click: take it up into the pack (the action)' + (B.cursor.x === u.x && B.cursor.y === u.y ? ' -- TAKE THE ROPE on the ring' : '') + '{/}' : '{g}' + tkT.why + '{/}'));
      }
      var ltT = D.light.torchAt(B, B.cursor.x, B.cursor.y); // (a light on the floor under the cursor: what the click does, as the grapple's line -- 10-05, Griz: "torch listed on bottom right?")
      var olT = D.oil && D.oil.lineAt(B, B.cursor.x, B.cursor.y); if (olT) lines.push(olT); // (oil on the ground, or burning: js/oil.js, 10-05)
      if (ltT) { var tkL = D.light.canTake(B, u, ltT), occL = G.occupant(B.cursor.x, B.cursor.y), selfL = B.cursor.x === u.x && B.cursor.y === u.y; lines.push('{y}a ' + D.light.word(ltT) + ' on the floor, burning{/}  ' + (tkL.ok && (selfL || !occL) ? '{n}click: take it up (free: the hand on an object)' + (selfL ? ' -- TAKE UP on the ring' : '') + '{/}' : '{g}' + (tkL.ok ? 'someone stands on it' : tkL.why) + '{/}')); }
      if (B.ropePick) { var rg = B.ropePick, rgFt = (rg.z - G.map.gz(rg.rope.foot[0], rg.rope.foot[1])) / G.map.def.step * 2.5; lines.push('{y}the rope{/}: ' + (rg.ground ? 'down to the ground' : (rg.up ? 'climb to ' : 'let down to ') + rgFt + ' ft up it and hang there') + '  ' + (rg.ok ? '{n}' : '{o}') + (rg.spent ? rg.spent + ' ft to its ' + (rg.up ? 'foot' : 'top') + ', then ' : '') + rg.cost + ' ft of movement' + (rg.ok ? '' : ' -- ' + rg.why) + '{/}'); } // (a rung of a rope the mouse is on: ropeRung, 10-04 night)
      if (B.dark) { var lv = D.light.levelAt(B, B.cursor.x, B.cursor.y), ps = D.light.partySeesSq(B, B.cursor.x, B.cursor.y); lines.push('{g}' + D.light.name(lv) + ' here' + (lv === 0 ? (ps === 1 ? ' (one of yours sees it by darkvision)' : ' (no one of yours sees it)') : '') + '{/}'); }
      B.units.forEach(function (p) {
        var au = RU.auraOf(p);
        if (!au || Math.max(Math.abs(B.cursor.x - p.x), Math.abs(B.cursor.y - p.y)) > 2) return;
        lines.push('{y}' + p.name + '\'s aura{/}: allies here add +' + au.protect + ' to saving throws' + (au.devotion ? ' and can\'t be charmed' : ''));
      });
      (flankSpots(B, u)[k] || []).forEach(function (fe) { lines.push('{y}flanking{/} the ' + B.shortName(fe.foe) + ' with ' + fe.ally.name + ': advantage in melee, both'); });
      if (u.cls === 'rogue') {
        var hs = hideSpots(B, u);
        if (hs[k] === true) lines.push('{p}a place to try hiding{/}: outside every foe\'s watch, or where it cannot see her');
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
    if (w.under) c.push('{o}under the ground{/}'); // (a burrower: out of reach till it comes up, js/ai.js)
    else if (w.ethereal && !(w.conds.stoning && w.conds.stoning.done)) c.push('{p}ethereal{/}'); // (a hero turned to stone is out of the world too, but says stone below)
    if (w.conds.poisoned) c.push('{n}poisoned{/}');
    if (w.conds.sickened) c.push('{n}sickened{/}'); // (Eyebite's: a WIS save at each turn's end)
    if (w.conds.contagion) c.push('{n}diseased{/}'); // (Contagion: poisoned too, the save at each turn's end)
    if (w.conds.faerie) c.push('{p}faerie fire{/}');
    if (w.conds.hidden) c.push('{c}hidden{/}');
    if (w.conds.invisible) c.push('{c}invisible{/}');
    if (w.conds.blinded) c.push('{o}blinded{/}');
    if (w.conds.deafened) c.push('{o}deafened{/}'); // (Divine Word's)
    if (w.conds.dodge) c.push('{c}dodging{/}');
    if (w.ready) c.push('{c}readied: ' + String(w.ready.name).toLowerCase() + '{/}'); // (the Ready action, 10-02)
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
    if (w.conds.restrained && !(w.conds.stoning && w.conds.restrained.kind === 'stone')) c.push(w.conds.restrained.grapple ? '{w}held{/}' + (w.conds.restrained.tendril ? '{g} (tendril ' + w.conds.restrained.tendril.hp + '/' + w.conds.restrained.tendril.max + '){/}' : '') : '{w}webbed{/}'); // (Flesh to Stone's hold says stone, below; the roper's tendril and what is left of it, 10-02)
    if (w.conds.stunned) c.push('{p}stunned{/}');
    if (w.conds.prone) c.push('{o}prone{/}');
    if (w.swarm) c.push('{g}swarm{/}');
    if (w.conds.paralyzed) c.push('{p}held{/}');
    if (w.conds.asleep) c.push('{p}asleep{/}');
    // what the spells and the features lay on it (10-01, the found-not-fixed list: deafened, dancing and sickened were missing, and these with them): the ones a
    // player acts on -- a debuff to cure or work round, a buff to keep up or to spend -- debuffs first, then the buffs. The flags only a spell's own code reads
    // stay out: noReact, metalEdge, recoiling, commanded, blindedBy, lethargic, frenzy (raging says it), turned and feared (frightened says it), killer, banished
    // (ethereal says it), the one-turn marks (acid, frosted, glassHand), guidance and resistance (a d4 on one roll), dangerSense (every barbarian's)
    var q = w.conds;
    if (q.stoning) c.push(q.stoning.done ? '{o}stone{/}' : '{o}turning to stone ' + q.stoning.bad + '/3{/}');
    if (q.frightened) c.push('{p}frightened{/}');
    if (q.hypnotized) c.push('{p}entranced{/}'); else if (q.charmed) c.push('{p}charmed{/}');
    if (q.laughing) c.push('{p}laughing{/}');
    if (q.confused) c.push('{p}confused{/}');
    if (q.dancing) c.push('{p}dancing{/}');
    if (q.incapacitated && !(q.paralyzed || q.stunned || q.asleep || q.laughing || q.hypnotized)) c.push('{p}incapacitated{/}'); // (the rule looks.js draws its badge by)
    if (q.surprised) c.push('{o}surprised{/}');
    if (q.slowed) c.push('{o}slowed{/}');
    if (q.enfeebled) c.push('{o}enfeebled{/}');
    if (q.feeble) c.push('{o}feebleminded{/}');
    if (q.cursed || (q.disAt && q.disAt.why === 'cursed')) c.push('{o}cursed{/}');
    if (q.baned) c.push('{o}baned{/}');
    if (q.noHeal) c.push('{o}no healing{/}');
    if (q.mocked) c.push('{o}mocked{/}');
    if (q.disarmed) c.push('{o}disarmed{/}');
    if (q.heated) c.push('{o}heated metal{/}');
    if (q.marked) c.push('{o}marked{/}');
    if (q.branded) c.push('{o}branded{/}');
    if (q.guided) c.push('{y}lit up{/}');
    if (q.reckless) c.push('{o}reckless{/}');
    if (q.raging) c.push('{r}raging{/}');
    if (q.inspired) c.push('{y}inspired{/}');
    if (q.countercharm) c.push('{y}countercharm{/}');
    if (q.hasted) c.push('{y}hasted{/}');
    if (q.enlarged) c.push(q.enlarged.down ? '{o}reduced{/}' : '{y}enlarged{/}');
    if (q.blur) c.push('{c}blurred{/}');
    if (q.sanctuary) c.push('{c}sanctuary{/}');
    if (q.trueStrike) c.push('{c}true strike{/}');
    if (q.retreat) c.push('{c}quick feet{/}');
    if (q.longstrider) c.push('{c}longstrider{/}');
    if (q.barkskin) c.push('{c}barkskin{/}');
    if (q.pfeg) c.push('{c}evil-ward{/}');
    if (q.energyWard) c.push('{c}ward: ' + q.energyWard.type + '{/}');
    if (q.fireShield) c.push('{o}' + q.fireShield.type + ' shield{/}');
    if (q.holyAura) c.push('{y}holy aura{/}');
    if (q.beacon) c.push('{y}beacon{/}');
    if (q.foresight) c.push('{y}foresight{/}');
    if (q.deathWard) c.push('{y}death ward{/}');
    if (q.poisonWard) c.push('{c}poison ward{/}');
    if (q.freeMove) c.push('{c}free movement{/}');
    if (q.mindBlank) c.push('{c}mind blank{/}');
    if (q.wardingBond) c.push('{c}warding bond{/}');
    if (q.keeperWard) c.push('{c}keeper ward{/}');
    if (q.regenerating) c.push('{n}regenerating{/}');
    if (q.enhanced) c.push('{c}enhanced{/}');
    if (q.blink) c.push('{p}blinking{/}');
    if (q.branding) c.push('{y}branding smite{/}');
    if (q.vampiric) c.push('{p}vampiric touch{/}');
    if (q.flameBlade) c.push('{o}flame blade{/}');
    if (q.magicWeapon) c.push('{c}magic weapon{/}');
    if (q.shillelagh) c.push('{c}shillelagh{/}');
    if (q.storm) c.push('{c}storm{/}');
    if (q.mageArmor) c.push('{c}mage armor{/}');
    if (q.aid) c.push('{y}aid +' + q.aid + '{/}');
    // what a Globe of Invulnerability holds off it (10-01c): set aside while it stands inside, back when it steps out -- at the front of the row, so the trimming
    // below never hides it
    var sv = D.magic && D.magic.shelved ? D.magic.shelved(w) : null;
    if (sv) { var idle = conds({ conds: sv, hp: 1 }).replace(/\{[a-z]*\}|\{\/\}/g, '').trim(); c.unshift('{c}idle in the globe:{/} {g}' + (idle || Object.keys(sv).join(' ')) + '{/}'); }
    var tail = [];
    if (w.conc) tail.push('{y}conc: ' + w.conc.name + '{/}');
    if (w.hp <= 0 && !w.dead) tail.push('{r}down{/}');
    // one row on a 480-px screen: what will not fit gives way to a count (the concentration and the down are kept)
    var left = 0;
    while (c.length > 1 && D.textWidth(c.concat(tail).join(' ')) > 300) { c.pop(); left++; }
    if (left) c.push('{g}+' + left + '{/}');
    c = c.concat(tail);
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
    var cl = u.side === 'foe' ? 'foe' : u.cls ? (u.cls + ' ' + u.lvl) : u.familiar ? 'familiar' : 'ally', clx = 44 + D.textWidth(u.name) + 6; // (a familiar has no class: it read "null 0", 10-02)
    D.text(ctx, u.name, 44, BAR_Y + 4, u.side === 'foe' ? R('red', 4) : R('gold', 4));
    D.text(ctx, cl, clx, BAR_Y + 4, R('accent', 2));
    ctx.fillStyle = R('stone', 1); ctx.fillRect(44, BAR_Y + 15, 100, 4);
    ctx.fillStyle = u.side === 'foe' ? R('red', 3) : R('moss', 2); ctx.fillRect(44, BAR_Y + 15, Math.round(100 * Math.max(0, u.hp) / u.maxhp), 4);
    D.text(ctx, 'HP ' + u.hp + '/' + u.maxhp + (u.temp ? ' +' + u.temp : '') + '   AC ' + RU.ac(u), 44, BAR_Y + 21, R('bone', 1));
    ctx.save(); ctx.beginPath(); ctx.rect(44, BAR_Y + 29, BX - 48, 12); ctx.clip(); // a long line of conditions stops short of the keys
    D.text(ctx, conds(u).trim() || (u.slots && u.slots.length ? 'slots ' + u.slots.map(function (n, i) { return (i + 1) + ':' + n; }).join(' ') : ''), 44, BAR_Y + 31, R('accent', 2));
    ctx.restore();
    if (!hero) { D.text(ctx, u.under ? 'under the ground...' : u.ethereal ? 'moving unseen...' : 'its turn', BX, BAR_Y + 16, R('accent', 2)); return; }
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
    // its words under it, wrapped (10-01, Griz: "Spell descriptions need a second line on wheel-button mouseover, see haste Lvl 3"): up to
    // three lines 300 px wide, the box as wide as the longest
    if (sub) {
      var sl = D.wrap(sub, 300).slice(0, 3), ww = Math.max.apply(null, sl.map(function (s) { return D.textWidth(s); })) + 8, sh = sl.length * 10 + 1;
      var sy = ly + 13 + sh > BAR_Y - 2 ? ly - sh - 1 : ly + 13; // (a ring low on the screen: the words above its label, clear of the bar)
      box(ctx, Math.round(cx - ww / 2), sy, ww, sh, R('stone', 3));
      sl.forEach(function (s, k) { D.text(ctx, '{g}' + s + '{/}', cx, sy + 2 + k * 10, R('accent', 2), 'center'); });
    }
  }
  function initials(name) { var w = name.split(' ').filter(function (x) { return !/^(of|the)$/i.test(x); }); return w.length > 1 ? w.map(function (x) { return x[0]; }).join('').slice(0, 2) : name.slice(0, 2); }

  // ------------------------------------------------------------------ prompts, the entry card, inspect, the menu
  function box(ctx, x, y, w, h, edge) {
    ctx.fillStyle = 'rgba(10,8,16,.94)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = edge || R('gold', 3); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  function prompt(ctx, B, p) {
    if (p.pick) { // a pick on the grid: its title, its line, and what's under the cursor -- no buttons (pickInput)
      var pl = p.lines || [], on = pickAt(B, p), pw = 300, ph = 22 + pl.length * 9 + 12, px = (D.W - pw) / 2, py = BAR_Y - ph - 4;
      D.win8(ctx, px, py, pw, ph);
      D.text(ctx, p.title, px + 8, py + 6, D.WIN8.gold);
      pl.forEach(function (l, k) { D.text(ctx, l, px + 8, py + 18 + k * 9, D.WIN8.text); });
      var lab = on ? p.opts[p.pick.indexOf(on)].label : null;
      D.text(ctx, D.keys(lab ? 'E: ' + lab + '   X: not now' : 'a gold square: E or a click   X: not now'), px + 8, py + ph - 11, lab ? R('gold', 3) : R('accent', 2));
      B.promptRects = [];
      return;
    }
    // in the 8-bit game's window, as the menus are (10-01, Griz: "Can you blue the dash confirmation call and still use that number choice
    // method (that's handy to click on) - check how long the rogues boxes get though"): the numbered buttons kept, the box as wide as its
    // words and buttons need (a rogue's CUNNING DASH, DASH and NOT THAT FAR ran past its edge), a second row of buttons when one won't fit
    var W8 = D.WIN8, lines = p.lines || [], maxW = D.W - 16;
    var bws = p.opts.map(function (o, i) { return D.textWidth((i + 1) + ' ' + o.label) + 10; });
    var need = Math.max(D.textWidth(p.title), Math.max.apply(null, lines.map(function (l) { return D.textWidth(l); }).concat([0])), bws.reduce(function (s, b) { return s + b + 6; }, -6)) + 18;
    var w = Math.min(maxW, Math.max(300, need)), inner = w - 16, rows = [[]], rx = 0;
    bws.forEach(function (bw, i) { if (rx && rx + bw > inner) { rows.push([]); rx = 0; } rows[rows.length - 1].push(i); rx += bw + 6; });
    var h = 26 + lines.length * 9 + rows.length * 15 + 1, x = Math.round((D.W - w) / 2), y = BAR_Y - h - 4;
    D.win8(ctx, x, y, w, h);
    D.text(ctx, p.title, x + 8, y + 6, W8.gold);
    lines.forEach(function (l, k) { D.text(ctx, l, x + 8, y + 18 + k * 9, W8.text); });
    B.promptRects = [];
    rows.forEach(function (row, ri) {
      var bx = x + 8, by = y + 22 + lines.length * 9 + ri * 15;
      row.forEach(function (i) {
        var o = p.opts[i], bw = bws[i], r = { x: bx, y: by, w: bw, h: 12 };
        B.promptRects[i] = r;
        ctx.fillStyle = i === B.sel ? W8.sel : '#0a0c24'; ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = i === B.sel ? W8.gold : W8.mid; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        D.text(ctx, (i + 1) + ' ' + o.label, r.x + 5, r.y + 2, i === B.sel ? W8.gold : W8.text);
        bx += bw + 6;
      });
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
    var own = u.kind === 'keeper' && D.keeper && D.keeper.inspectLines ? D.keeper.inspectLines(D.battle, u) : null; // (the Keeper's own lines in place of its Slam's and its water's: js/keeper.js, 10-03)
    if (own) own.forEach(function (l) { lines.push(l); });
    else if (u.weapon) lines.push(u.weapon.name + ' ' + RU.sign(u.weapon.atk) + ', ' + u.weapon.dice + RU.sign(u.weapon.mod) + ' ' + u.weapon.type + (u.attacks > 1 ? ', x' + u.attacks : '') + UI.handsNote(u));
    if (u.attacks && !u.weapon) Object.keys(u.attacks).forEach(function (k) { var a = u.attacks[k]; lines.push(a.name + ' ' + RU.sign(a.atk) + ', ' + a.dice + RU.sign(a.mod) + ' ' + a.type + (a.range ? ', ' + a.range.join('/') + ' ft' : '') + (a.extra ? ' +' + a.extra + ' ' + a.extraType : '') + (a.save ? ', DC ' + a.save.dc + ' ' + a.save.ab.toUpperCase() + ' or ' + a.save.dice + ' ' + a.save.type : '') + (a.poison ? ', DC ' + a.poison.dc + ' CON or poisoned' : '') + (a.reach > 5 ? ', reach ' + a.reach + ' ft' : '') + (a.grapple ? ', grips (escape DC ' + a.grapple.dc + ')' : '')); });
    if (u.jaunt) lines.push('{p}Ethereal Jaunt{/} (bonus action): steps out of the world, and back.');
    if (u.multi > 2 && u.attacks && u.attacks.bite) lines.push('{p}Multiattack{/}: three, sword or bow; one of them may be the bite.');
    if (u.fey || u.webWalker) lines.push([u.fey ? '{p}Fey Ancestry{/}: no magical sleep' : '', u.webWalker ? '{p}Web Walker{/}: webs do not hold it' : ''].filter(Boolean).join('  '));
    if (u.faerie) lines.push('{p}Faerie Fire{/} once' + (u.faerie.used ? ' (spent)' : ''));
    // the bestiary's traits (09-27)
    if (u.web) lines.push('{p}Web{/} (recharge ' + u.web.recharge + '-6): ' + RU.sign(u.web.atk) + ', ' + u.web.range.join('/') + ' ft, restrained (escape DC ' + u.web.dc + ')' + (u.web.ready ? '' : ' {g}(spent){/}'));
    if (u.slam) lines.push('{p}Tentacle Slam{/}: what it holds, CON DC ' + u.slam.dc + ' or ' + u.slam.dice + ' and stunned');
    if (u.bound && !own) lines.push('{p}Keeps to the water{/}: it will not leave its pool');
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
    // the one whose turn it is cannot see it (the dashed ring at its feet): say why -- the dark, the cloud, unseen (10-01b, the bond)
    var Bq = D.battle, ah = Bq && Bq.active;
    if (u.side === 'foe' && ah && ah.side === 'party' && !ah.guest && Bq.req && Bq.req.turn === ah) { var sw = D.magic.seeWhy(Bq, ah, u); if (!sw.ok) lines.push('{o}' + ah.name + ' cannot see it{/} {g}(' + (sw.why === 'dark' ? 'the dark' : sw.why) + '){/}'); }
    var w = 0; lines.forEach(function (l) { w = Math.max(w, D.textWidth(l)); });
    // the upper left -- or the upper right while the mouse is where the card would be, so it never sits over what is being aimed at (10-05, Griz: "we have the inspect card
    // coming up during spell selection, but I think I need it to shift to the right side of the screen when the mouse is in the up left corner")
    var bw = w + 28, bh = lines.length * 9 + 8, m0 = I.mouse, bx = m0 && m0.inside && m0.x <= 6 + bw + 12 && m0.y <= 40 + bh + 12 ? D.W - bw - 6 : 6;
    box(ctx, bx, 40, bw, bh, u.side === 'foe' ? R('red', 3) : R('glow', 1));
    lines.forEach(function (l, k) { D.text(ctx, l, bx + 6, 44 + k * 9, R('bone', 1)); });
    UI.drawGlyph(ctx, ty, bx + bw - 10, 50); // (its creature type: the glyphs above)
  }
  function menu(ctx, B) {
    var M = B.menu;
    if (M.panel === 'party') return party(ctx, B);
    if (M.panel === 'equip') return gear(ctx, B);
    var items = menuItems(B), w = 190, h = items.length * 13 + 12, x = (D.W - w) / 2, y = 60, W8 = D.WIN8;
    D.win8(ctx, x, y, w, h); // (the 8-bit game's window, its field menu's look: js/core.js D.win8, 10-01)
    B.menuRects = [];
    items.forEach(function (it, i) {
      var r = { x: x + 6, y: y + 6 + i * 13, w: w - 12, h: 12 };
      B.menuRects.push(r);
      if (i === M.sel) { ctx.fillStyle = W8.sel; ctx.fillRect(r.x, r.y, r.w, r.h); D.text(ctx, '>', r.x + 1, r.y + 2, W8.gold); }
      D.text(ctx, it[1], r.x + 8, r.y + 2, i === M.sel ? W8.gold : W8.text);
    });
  }
  // EQUIP: the hero's weapon and shield now, the pack's choices, each greyed with its reason when it can't be done
  function gear(ctx, B) {
    var M = B.menu, u = gearHero(B), opts = u ? B.gearOptions(u) : [], w = 300, rowH = 13, h = Math.max(1, opts.length) * rowH + 44, x = (D.W - w) / 2, y = 50;
    D.win8(ctx, x, y, w, h);
    if (!u) return;
    D.text(ctx, 'EQUIP: ' + u.name.toUpperCase(), x + 8, y + 5, R('gold', 4));
    D.hint(ctx, 'a swap costs the action  ·  X back', x + w - 8, y + 5, R('stone', 5), 'right');
    D.text(ctx, 'in hand: ' + u.weapon.name + ' ' + RU.sign(u.weapon.atk) + ', ' + u.weapon.dice + RU.sign(u.weapon.mod) + (u.weapon.ranged ? ', ' + u.weapon.range.join('/') + ' ft' : '') + UI.handsNote(u) + '   AC ' + RU.ac(u), x + 8, y + 17, R('bone', 2)); // (the torch, a two-hander carried, a weapon put away: 10-05)
    B.gearRects = [];
    if (!opts.length) { D.text(ctx, '{g}Nothing in the pack ' + u.name + ' can take up.{/}', x + 8, y + 31, R('bone', 1)); return; }
    opts.forEach(function (o, i) {
      var r = { x: x + 6, y: y + 29 + i * rowH, w: w - 12, h: rowH - 1 };
      B.gearRects.push(r);
      if (i === M.gsel) { ctx.fillStyle = D.WIN8.sel; ctx.fillRect(r.x, r.y, r.w, r.h); }
      var col = !o.ok ? R('stone', 5) : i === M.gsel ? D.WIN8.gold : D.WIN8.text;
      D.text(ctx, o.label, r.x + 6, r.y + 2, col);
      D.text(ctx, o.ok ? o.note : o.why, r.x + r.w - 6, r.y + 2, o.ok ? R('stone', 6) : R('stone', 5), 'right');
    });
  }
  // the party at a glance (the 8-bit game's status screen, in small)
  function party(ctx, B) {
    var ps = B.units.filter(function (u) { return u.side === 'party'; }), w = 440, rowH = 38, h = ps.length * rowH + 20, x = (D.W - w) / 2, y = Math.max(16, (BAR_Y - h) / 2);
    D.win8(ctx, x, y, w, h);
    D.text(ctx, 'THE PARTY', x + 8, y + 5, R('gold', 4));
    D.hint(ctx, 'X back', x + w - 8, y + 5, R('stone', 5), 'right');
    ps.forEach(function (u, i) {
      var ry = y + 17 + i * rowH, f = u.feats || {};
      ctx.save(); ctx.beginPath(); ctx.rect(x + 6, ry, 30, 34); ctx.clip();
      D.spr.draw(ctx, u.sheet, 'idle', 0, B.t, x + 21, ry + Math.min(D.spr.top(u.sheet), 44) + 2, {});
      ctx.restore();
      D.text(ctx, '{y}' + u.name + '{/}  ' + u.cls + ' ' + u.lvl + '   HP ' + u.hp + '/' + u.maxhp + (u.temp ? ' +' + u.temp : '') + '   AC ' + RU.ac(u) + '   ' + (u.weapon ? u.weapon.name + ' ' + RU.sign(u.weapon.atk) + UI.handsNote(u, true) : ''), x + 42, ry + 1, R('bone', 1));
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
