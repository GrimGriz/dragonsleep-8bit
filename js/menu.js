/* DRAGONSLEEP — the one menu (RULED 10-06, Griz: "ideal = identical menus"; one file for both games, "1 - lean"). The 8-bit's field
   menu and, next, DEEP16's M menu: the party panel on the left with the cursor kicked into it wherever a hero is chosen (ORDER keeps its
   own way, his word), the entries on the right, every page in the 8-bit's window style. It draws into a 256x240 context and reads its keys
   from its host, so either game can hold it: the 8-bit as a scene (js/scenes.js FieldMenu), the grid as a window over its own screen. The
   host hands it the party, the pack, and the actions that talk in the game's own voice (handoff-2026-10-06-the-menus.md §3).
   A host: { fight: null | { hero, acted }, party(), guests(), pack() [{id, n}], give(id, n), take(id, n), info() { silver, renown, place,
   time, steps, pin }, canSave(), walker(h), portrait(h), whyNot(id, h), light(h) -> { id, hooded } | null, journal() | null, exits(),
   run(kind, args, done) for 'item' { id, h }, 'cast' { h, sp, t }, 'skill' { h, s, t }, 'save', 'light-off' { h }, 'exit' { to },
   'kofi'; close() } */
'use strict';
(function () {
  var DS = window.DS = window.DS || {}, MN = DS.MENU = {};
  var C = { gold: '#F8D878', white: '#F8F8F8', pale: '#C8D0E8', grey: '#9C9C9C', dim: '#6C6C84', tan: '#E0C8A0', magic: '#B8B8F8', green: '#B8F8B8', hp: '#58D854', red: '#F85838', orange: '#F8B878', pink: '#F8A4C0', cyan: '#78D8F8' };
  function R() { return DS.R; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sgn(n) { return n >= 0 ? '+' + n : '' + n; }
  function mod(s) { return Math.floor((s - 10) / 2); }
  function sfx(n) { if (DS.audio && DS.audio.sfx) DS.audio.sfx(n); }
  function item(id) { return (id && typeof id === 'string' && DS.DATA.items[id]) || null; }
  function spell(id) { return DS.DATA.spells[id] || null; }
  function text(ctx, s, x, y, c) { return DS.text(ctx, String(s), x, y, c || C.white); }
  function right(ctx, s, xr, y, c) { return DS.textRight(ctx, String(s), xr, y, c || C.pale); }
  function wrap(s, w) { return DS.wrap(String(s || ''), w); }
  // cut a line to a width, a dot where it was cut (10-06: a long RING name ran off EQUIP's box)
  function fit(s, w) { s = String(s); if (DS.textWidth(s) <= w) return s; while (s.length > 1 && DS.textWidth(s + '.') > w) s = s.slice(0, -1); return s + '.'; }
  function clsName(h) { var c = R().CLASSES[h.cls]; return c ? c.name : h.cls === 'mpmon' ? 'Mascot' : (h.cls || ''); } // (the Mascot's class id is mpmon: 10-07, his "they show mpmon 5")

  // ------------------------------------------------------------------ the window (the 8-bit's: a silver frame on night blue)
  var BG = '#10123a', EDGE = '#e8e8f4', MID = '#6e6e98';
  function win(ctx, x, y, w, h, bg) {
    x = Math.round(x); y = Math.round(y);
    ctx.fillStyle = EDGE; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
    ctx.fillStyle = MID; ctx.fillRect(x + 2, y + 1, w - 4, h - 2); ctx.fillRect(x + 1, y + 2, w - 2, h - 4);
    ctx.fillStyle = bg || BG; ctx.fillRect(x + 3, y + 2, w - 6, h - 4); ctx.fillRect(x + 2, y + 3, w - 4, h - 6);
  }
  function bar(ctx, x, y, w, frac, col) { ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, 3); ctx.fillStyle = col; ctx.fillRect(x, y, Math.max(0, Math.round(w * clamp(frac, 0, 1))), 3); }
  MN.win = win;

  // ------------------------------------------------------------------ the glyphs: the tabs' labels (his "Heiroglyph labeled tabs"), 10x10
  var PX = { o: '#202028', w: '#F8F8F8', g: '#F8D878', y: '#F8B800', b: '#AC7C00', r: '#D83820', R: '#F87858', G: '#58D854', d: '#00A844', s: '#BCBCBC', S: '#7C7C88', l: '#A0622D', c: '#3CBCFC', p: '#9878F8', P: '#B8B8F8' };
  var GLYPH = {
    flask: ['....oo....', '...owwo...', '....oo....', '...orro...', '..orRRro..', '.orRRwRro.', '.orRRRRro.', '.orrRRRro.', '..orrrro..', '...oooo...'],
    torch: ['....oo....', '...oyyo...', '..oyRRyo..', '..oyRRyo..', '...oyyo...', '....ll....', '....ll....', '....ll....', '....ll....', '....oo....'],
    leaf: ['.......oo.', '.....ooGo.', '....oGGGo.', '...oGGdGo.', '..oGGdGGo.', '..oGdGGo..', '.oGdGGo...', '.odoooo...', 'od........', 'o.........'],
    key: ['..ooo.....', '.ogggo....', '.og.go....', '.ogggo....', '..ogo.....', '..ogo.....', '..oggo....', '..ogo.....', '..oggo....', '...o......'],
    sword: ['........oo', '.......osw', '......osw.', '.....osw..', '.o..osw...', '.boosw....', '..bbo.....', '..ob......', '.ob.b.....', 'ob........'],
    armor: ['.oo....oo.', 'osso..osso', 'osSSooSSso', '.osSSSSso.', '.osSSSSso.', '.osSssSso.', '.osSSSSso.', '.osSSSSso.', '..osSSso..', '...oooo...'],
    shield: ['.oooooooo.', 'osSSssSSso', 'osSSggSSso', 'osSggggSso', 'osSSggSSso', '.osSggSso.', '.osSSSSso.', '..osSSso..', '...osso...', '....oo....'],
    ring: ['....oo....', '...ocwo...', '....oo....', '..oggggo..', '.og....go.', '.og....go.', '.og....go.', '..oggggo..', '...oooo...', '..........'],
    cloak: ['...oooo...', '..opPpo...', '..opPPpo..', '.oppPPppo.', '.opppPppo.', 'opppppPppo', 'oppppppppo', 'opppppppo.', 'oppo.oppo.', 'ooo...ooo.'],
    boot: ['..oooo....', '..obbo....', '..obbo....', '..obbo....', '..obbo....', '..obbooo..', '..obbbbbo.', '.obbbbbbo.', '.oooooooo.', '..........'],
    arrow: ['........oo', '.......oso', '......oso.', '.....oso..', '....obo...', '...obo....', '..obo.....', '.wbo......', 'w.w.......', '.w........'],
    fight: ['......o', '.....ow', '....ow.', '.g.ow..', '..gw...', '.lg.g..', 'l......'] // (a row's mark: usable in a fight -- a sword with its guard)
  };
  var gcache = {};
  function glyph(name) {
    if (gcache[name]) return gcache[name];
    var map = GLYPH[name], cv = document.createElement('canvas'); cv.width = map[0].length; cv.height = map.length;
    var x = cv.getContext('2d');
    for (var r = 0; r < map.length; r++) for (var q = 0; q < map[r].length; q++) { var ch = map[r][q]; if (PX[ch]) { x.fillStyle = PX[ch]; x.fillRect(q, r, 1, 1); } }
    return (gcache[name] = cv);
  }
  MN.glyph = glyph;

  // ------------------------------------------------------------------ a list (the 8-bit's Menu, its keys from the host)
  function List(o) { o = o || {}; this.items = []; this.i = o.index || 0; this.scroll = 0; this.vis = o.visible || 10; this.set(o.items || []); }
  List.prototype.set = function (items) { this.items = items; this.i = clamp(this.i, 0, Math.max(0, items.length - 1)); this.fix(); };
  List.prototype.fix = function () {
    if (this.i < this.scroll) this.scroll = this.i;
    if (this.i >= this.scroll + this.vis) this.scroll = this.i - this.vis + 1;
    this.scroll = clamp(this.scroll, 0, Math.max(0, this.items.length - this.vis));
  };
  List.prototype.cur = function () { return this.items[this.i]; };
  // 'pick' | 'back' | null
  List.prototype.update = function (k) {
    var n = this.items.length, old = this.i;
    if (n) { if (k.repeat('down')) this.i = (this.i + 1) % n; if (k.repeat('up')) this.i = (this.i - 1 + n) % n; }
    if (this.i !== old) { sfx('cursor'); this.fix(); }
    if (k.pressed('a')) { var it = this.cur(); if (!it || it.disabled) { sfx('error'); return it && it.disabled ? 'refused' : null; } sfx('confirm'); return 'pick'; }
    if (k.pressed('b')) { sfx('cancel'); return 'back'; }
    return null;
  };
  // rows from (x, y), the right column ending at x + w; `t` blinks the cursor of a list that is not the one moving
  // (each row drawn is a place the mouse may point: the grid's players click -- HITS, gathered as the menu draws, read by Menu.update)
  var HITS = [], OWNER = null;
  List.prototype.draw = function (ctx, x, y, w, active, t, rowH, gutter) {
    rowH = rowH || 12;
    for (var r = 0; r < this.vis; r++) {
      var k = this.scroll + r, it = this.items[k]; if (!it) break;
      var yy = y + r * rowH, col = it.disabled ? C.dim : (it.color || C.white), lx = x + 8 + (gutter || 0);
      HITS.push({ list: this, k: k, owner: OWNER, x: x, y: yy - 2, w: w + 4, h: rowH });
      if (it.mark) ctx.drawImage(glyph(it.mark), x + 8, yy + 1);
      if (it.pre) text(ctx, it.pre, lx - 7, yy, it.preColor || C.gold);
      text(ctx, it.label, lx, yy, col);
      if (it.right != null) right(ctx, it.right, x + w, yy, it.disabled ? C.dim : (it.rightColor || C.pale));
      if (it.sub) text(ctx, it.sub, lx + 4, yy + 10, it.subColor || C.grey);
      if (k === this.i && (active || ((t >> 4) & 1) === 0)) text(ctx, '▶', x, yy, C.white);
    }
    if (this.scroll > 0) text(ctx, '▲', x + w - 5, y - 10, C.pale);
    if (this.scroll + this.vis < this.items.length) text(ctx, '▼', x + w - 5, y + this.vis * rowH - 4, C.pale);
  };
  // tabs: glyphs or words along a row; left/right steps them
  function tabStep(k, n, i) { if (n < 2) return i; if (k.repeat('right')) { sfx('cursor'); return (i + 1) % n; } if (k.repeat('left')) { sfx('cursor'); return (i - 1 + n) % n; } return i; }
  function drawTabs(ctx, tabs, i, x, y, w) {
    var each = Math.floor(w / tabs.length);
    tabs.forEach(function (t, k) {
      var tx = x + k * each, on = k === i;
      if (on) { ctx.fillStyle = '#2c3070'; ctx.fillRect(tx, y - 2, each - 2, 14); }
      var gx = tx + 2;
      if (t.glyph) { ctx.drawImage(glyph(t.glyph), gx, y); gx += 12; }
      if (t.label && (on || !t.glyph || each >= 40)) text(ctx, fit(t.label, each - (gx - tx) - 3), gx, y + 1, on ? C.gold : C.grey);
      if (t.count != null) right(ctx, t.count, tx + each - 4, y + 1, on ? C.pale : C.dim);
    });
  }
  function descBox(ctx, s, extra) {
    win(ctx, 4, 196, 248, 40);
    var ln = wrap(s, 236).concat(extra ? wrap(extra, 236) : []);
    for (var i = 0; i < Math.min(3, ln.length); i++) text(ctx, ln[i], 10, 203 + i * 10, i >= wrap(s, 236).length ? C.green : C.tan);
  }
  function footer(ctx, s, y) { DS.textCenter(ctx, DS.keys ? DS.keys(s) : s, 128, y || 228, C.dim); }

  // ------------------------------------------------------------------ the menu
  function Menu(host) { this.host = host; this.t = 0; this.pages = []; this.toast = null; this.busy = false; this.closed = false; this.hits = []; this.root = new Root(this); }
  MN.open = function (host) { return new Menu(host); };
  Menu.prototype.push = function (p) { this.pages.push(p); return p; };
  Menu.prototype.pop = function () { this.pages.pop(); var p = this.top(); if (p.refresh) p.refresh(); };
  Menu.prototype.top = function () { return this.pages.length ? this.pages[this.pages.length - 1] : this.root; };
  Menu.prototype.say = function (lines, then) { this.toast = { lines: [].concat(lines), then: then }; };
  Menu.prototype.close = function () { if (this.closed) return; this.closed = true; if (this.host.close) this.host.close(); };
  // an action that talks (a potion drunk, a spell cast): the host runs it in its own voice; the menu waits, then refreshes
  Menu.prototype.act = function (kind, args, then) {
    var self = this; this.busy = true;
    this.host.run(kind, args || {}, function (r) { self.busy = false; self.pages.forEach(function (p) { if (p.refresh) p.refresh(); }); if (then) then(r); });
  };
  Menu.prototype.update = function (k) {
    this.t++;
    if (this.busy || this.closed) return;
    // the mouse (a host that has one: k.mouse = { x, y, moved, click, rclick } in the menu's own 256x240): pointing at a row of the page on top moves the
    // cursor there, a click is E on it, a right click is X
    if (k.mouse && !this.toast) {
      var ms = k.mouse, top = this.root.mode === 'pick' ? null : this.top(), hit = null;
      if (top) for (var hi = this.hits.length - 1; hi >= 0; hi--) { var hh = this.hits[hi]; if (hh.owner === top && ms.x >= hh.x && ms.x < hh.x + hh.w && ms.y >= hh.y && ms.y < hh.y + hh.h) { hit = hh; break; } }
      if (hit && (ms.moved || ms.click) && hit.list.i !== hit.k) { hit.list.i = hit.k; hit.list.fix(); }
      if (ms.click && hit) k = MN.keyAlso(k, 'a');
      else if (ms.rclick) k = MN.keyAlso(k, 'b');
    }
    if (this.toast) { if (k.pressed('a') || k.pressed('b')) { sfx('confirm'); var th = this.toast.then; this.toast = null; if (th) th(); } return; }
    if (this.root.mode === 'pick') { this.root.update(k); return; } // (the cursor kicked into the panel, over whatever page asked)
    this.top().update(k);
  };
  // a key pressed as well as what the host's keys say (the mouse's click as E)
  MN.keyAlso = function (k, b) { return { pressed: function (x) { return x === b || k.pressed(x); }, repeat: function (x) { return x === b || k.repeat(x); } }; };
  Menu.prototype.draw = function (ctx) {
    var self = this;
    HITS = []; OWNER = this.root;
    this.root.draw(ctx);
    this.pages.forEach(function (p) { OWNER = p; p.draw(ctx, p === self.top() && self.root.mode !== 'pick'); });
    OWNER = null; this.hits = HITS;
    if (this.root.mode === 'pick' && this.pages.length) this.root.drawPick(ctx);
    if (this.toast) {
      var ls = []; this.toast.lines.forEach(function (l) { ls = ls.concat(wrap(l, 214)); }); ls = ls.slice(0, 7);
      var hh = 12 + ls.length * 11, y = 234 - hh;
      win(ctx, 12, y, 232, hh);
      ls.forEach(function (l, i) { text(ctx, l, 20, y + 7 + i * 11, C.white); });
    }
  };

  // ------------------------------------------------------------------ the party panel, and the root
  var ENTRIES = [['ITEMS', 'items'], ['GEAR', 'gear'], ['MAGIC', 'magic'], ['SKILLS', 'skills'], ['EQUIP', 'equip'], ['STATUS', 'status'], ['ORDER', 'order'], ['JOURNAL', 'journal'], ['SAVE', 'save'], ['OPTIONS', 'options'], ['CREDITS', 'credits'], ['EXIT', 'exit']];
  function Root(m) {
    this.m = m; this.mode = 'cmd'; this.pick = null; this.pi = 0; this.ps = 0;
    this.cmds = new List({ visible: ENTRIES.length, index: m.host.fight ? 4 : 0 }); // (in a fight the cursor starts on EQUIP)
    this.refresh();
  }
  // the ring's own list in a fight whose host has one (the grid's: deep16/js/ui.js gridHost fight.ring -- items, spells, skills for the hero whose turn it is), or null
  function ringOf(m, kind) { var f = m.host.fight; return f && f.ring ? f.ring(kind) : null; }
  // a lit row's colour in the grid's fight, by what it costs (10-07, Griz: "can we color the actions actually available by their cost, bonus blue, action yellow and say
  // something like that there?"): the action yellow, the bonus action the turn bar's blue (its B pip), what is free white
  var COSTC = { A: C.gold, B: '#3CBCFC' };
  function costCol(c) { return COSTC[c] || C.white; }
  function costKey(ctx, x, y) { x += text(ctx, 'action', x, y, COSTC.A) + 5; x += text(ctx, 'bonus', x, y, COSTC.B) + 5; text(ctx, 'free', x, y, C.white); } // (the legend)
  function ringPick(m, kind, e) { m.host.fight.pick(kind, e); m.close(); } // (the pick to the ring's own flow -- the aim, the tool, the command -- and back to the turn)
  Root.prototype.refresh = function () {
    var host = this.m.host, fight = !!host.fight, party = host.party(), ring = fight && !!host.fight.ring;
    this.cmds.set(ENTRIES.map(function (e) {
      var off = (e[1] === 'order' && (fight || party.length < 2)) || (e[1] === 'save' && (fight || !host.canSave())) || (e[1] === 'journal' && !host.journal) || ((e[1] === 'equip' || (ring && (e[1] === 'magic' || e[1] === 'skills'))) && fight && !host.fight.hero);
      return { label: e[0], value: e[1], disabled: off };
    }));
  };
  Root.prototype.rows = function (guests) { var host = this.m.host, rows = host.party().slice(); return guests && host.guests ? rows.concat(host.guests()) : rows; };
  // kick the cursor into the panel: o { title, sub, guests, ok(h) -> true | why, then(h), back() }. One hero, no asking
  Root.prototype.choose = function (o) {
    var rows = this.rows(o.guests), oks = rows.filter(function (h) { return o.ok(h) === true; });
    if (!oks.length) { var why = rows.length && o.ok(rows[0]); sfx('error'); this.m.say(typeof why === 'string' ? why : 'No one can.'); return; }
    if (rows.length === 1) { o.then(rows[0]); return; }
    this.pick = o; this.mode = 'pick'; this.pi = rows.indexOf(oks[0]); this.ps = clamp(this.pi - 3, 0, Math.max(0, rows.length - 4));
  };
  Root.prototype.update = function (k) {
    var m = this.m;
    if (this.mode === 'pick') {
      var rows = this.rows(this.pick.guests), n = rows.length, old = this.pi;
      if (k.repeat('down')) this.pi = (this.pi + 1) % n;
      if (k.repeat('up')) this.pi = (this.pi - 1 + n) % n;
      if (old !== this.pi) { sfx('cursor'); if (this.pi < this.ps) this.ps = this.pi; if (this.pi >= this.ps + 4) this.ps = this.pi - 3; }
      if (k.pressed('a')) {
        var h = rows[this.pi], ok = this.pick.ok(h);
        if (ok !== true) { sfx('error'); if (typeof ok === 'string') m.say(ok); return; }
        sfx('confirm'); var p = this.pick; this.mode = 'cmd'; this.pick = null; this.ps = 0; p.then(h);
      } else if (k.pressed('b')) { sfx('cancel'); var p2 = this.pick; this.mode = 'cmd'; this.pick = null; this.ps = 0; if (p2.back) p2.back(); }
      return;
    }
    if (k.pressed('menu')) { sfx('cancel'); m.close(); return; }
    var r = this.cmds.update(k);
    if (r === 'back') { m.close(); return; }
    if (r === 'pick') this.go(this.cmds.cur().value);
  };
  Root.prototype.go = function (v) {
    var m = this.m, host = m.host, self = this;
    if (v === 'items') m.push(new ItemsPage(m));
    if (v === 'gear') m.push(new GearPage(m));
    // (a fight with the ring's lists -- the grid's: MAGIC and SKILLS are the one whose turn it is, as EQUIP is; 10-07, his find: "doesn't work for items, skills, or magic")
    var ringH = host.fight && host.fight.ring ? host.fight.hero : null;
    if (v === 'magic' && ringH) { if (ringOf(m, 'spells').length) m.push(new MagicPage(m, ringH)); else { sfx('error'); m.say(ringH.name + ' casts no spells.'); } }
    else if (v === 'magic') this.choose({ title: 'WHO CASTS?', ok: function (h) { return bookOf(h).length ? true : h.name + ' casts no spells.'; }, then: function (h) { m.push(new MagicPage(m, h)); } });
    if (v === 'skills' && ringH) { if (ringOf(m, 'skills').length) m.push(new SkillsPage(m, ringH)); else { sfx('error'); m.say(ringH.name + ' has nothing to use here.'); } }
    else if (v === 'skills') this.choose({ title: 'WHOSE SKILLS?', ok: function (h) { return skillsOf(h).length ? true : h.name + ' has nothing to use here.'; }, then: function (h) { m.push(new SkillsPage(m, h)); } });
    if (v === 'equip') {
      // (a host whose fight equips its own way -- the grid's: the weapons in the pack and the shield, each costing the action, battle.js gearOptions /
      // swapGear -- lists those, each with what it costs or why not, and the change ends the menu: back to the turn)
      // (the same EQUIP page in both games -- Griz, 10-06, the two side by side: "why is not same?" -- the grid's choices behind its slot rows)
      if (host.fight) m.push(new EquipPage(m, host.fight.hero));
      else this.choose({ title: 'EQUIP WHOM?', ok: function () { return true; }, then: function (h) { m.push(new EquipPage(m, h)); } });
    }
    if (v === 'status') this.choose({ title: 'WHOSE STATUS?', guests: true, ok: function () { return true; }, then: function (h) { m.push(new StatusPage(m, h)); } });
    if (v === 'order') m.push(new OrderPage(m));
    if (v === 'journal') m.push(new JournalPage(m));
    if (v === 'save') m.act('save');
    if (v === 'options') m.push(new OptionsPage(m));
    if (v === 'credits') m.push(new CreditsPage(m));
    if (v === 'exit') m.push(new ExitPage(m));
    self.refresh();
  };
  Root.prototype.drawPanel = function (ctx) {
    var m = this.m, host = m.host, picking = this.mode === 'pick', rows = this.rows(picking ? this.pick.guests : false), ps = picking ? this.ps : 0, np = host.party().length, R0 = R();
    win(ctx, 2, 4, 180, 170);
    for (var r = 0; r < 4; r++) {
      var k = ps + r, h = rows[k]; if (!h) break;
      var y = 10 + r * 40, ok = !picking || this.pick.ok(h) === true, guest = k >= np;
      var spr = null; try { spr = host.walker && host.walker(h); } catch (e) { spr = null; }
      if (spr) ctx.drawImage(spr, 10, y + 4);
      text(ctx, h.name, 32, y + 2, ok ? C.gold : C.dim);
      text(ctx, clsName(h) + ' ' + h.lvl, 96, y + 2, ok ? C.pale : C.dim);
      var col = h.ko ? C.grey : h.hp < h.maxhp / 4 ? C.red : C.white;
      text(ctx, (h.ko ? 'KO  ' : 'HP ') + Math.max(0, h.hp) + '/' + h.maxhp, 32, y + 13, ok ? col : C.dim);
      bar(ctx, 32, y + 22, 80, h.hp / h.maxhp, h.ko ? C.grey : C.hp);
      if (h.slotsMax && h.slotsMax.length) { // (three levels of n/m ran past the panel: then the slots left alone)
        var sl = 'Slots ' + (h.slots || []).map(function (n, q) { return n + '/' + h.slotsMax[q]; }).join(' ');
        if (DS.textWidth(sl) > 80) sl = 'Slots ' + (h.slots || []).join(' ');
        text(ctx, fit(sl, 82), 96, y + 13, ok ? C.magic : C.dim);
      }
      if (guest) text(ctx, 'GUEST', 120, y + 22, C.cyan);
      else { var nx = R0.nextXP(h); text(ctx, nx ? 'Next ' + (nx - h.xp) : 'MAX LEVEL', 120, y + 22, C.dim); }
      if (picking && k === this.pi) text(ctx, '▶', 4, y + 8, ((m.t >> 3) & 1) ? C.white : C.gold);
    }
    var more = picking ? rows.length > ps + 4 : !!(host.guests && host.guests().length);
    if (more) text(ctx, picking ? '▼' : '▼ GUESTS', picking ? 170 : 128, 164, C.cyan);
    if (picking && ps > 0) text(ctx, '▲', 170, 6, C.cyan);
  };
  Root.prototype.drawPick = function (ctx) {
    this.drawPanel(ctx);
    var ls = wrap(this.pick.title || 'WHO?', 56).concat(this.pick.sub ? wrap(this.pick.sub, 56) : []);
    win(ctx, 184, 4, 70, 14 + ls.length * 10);
    ls.forEach(function (l, i) { text(ctx, l, 191, 11 + i * 10, i < 1 ? C.gold : C.pale); });
  };
  Root.prototype.draw = function (ctx) {
    var m = this.m, host = m.host;
    this.drawPanel(ctx);
    win(ctx, 184, 4, 70, 160);
    this.cmds.draw(ctx, 190, 11, 58, this.mode === 'cmd' && !m.pages.length, m.t, 12);
    if (this.mode === 'pick' && !m.pages.length) {
      var ls = wrap(this.pick.title || 'WHO?', 56); win(ctx, 184, 166, 70, 14 + ls.length * 10);
      ls.forEach(function (l, i) { text(ctx, l, 191, 173 + i * 10, C.gold); });
    }
    var inf = host.info ? host.info() : {};
    win(ctx, 2, 176, 180, 60);
    if (inf.silver != null) text(ctx, '◆ ' + inf.silver + ' sp', 12, 184, C.white);
    if (inf.renown != null) text(ctx, '★ Renown ' + inf.renown, 96, 184, C.gold);
    text(ctx, fit(inf.place || '', 160), 12, 198, C.pale);
    if (inf.time != null) text(ctx, 'Time ' + inf.time, 12, 210, C.grey);
    if (inf.steps != null) text(ctx, 'Steps ' + inf.steps, 96, 210, C.grey);
    if (host.journal) text(ctx, fit(inf.pin ? '◆ ' + inf.pin : 'Pin a quest in JOURNAL', 162), 12, 222, inf.pin ? C.gold : C.dim);
    if (host.fight) {
      win(ctx, 184, 196, 70, 40);
      // (the grid's: what can be done now is lit in its cost's colour, and the box says which is which -- 10-07, Griz: "bonus blue, action yellow and say something like that there")
      if (host.fight.ring && host.fight.hero) { text(ctx, 'Can do now:', 190, 203, C.pale); text(ctx, 'action', 190, 213, COSTC.A); text(ctx, 'free', 222, 213, C.white); text(ctx, 'bonus action', 190, 223, COSTC.B); }
      else wrap(host.fight.ring ? 'A look only: no hero\'s turn.' : host.fight.acted ? 'Action spent: look, no changes.' : 'In a fight: weapon and shield before acting.', 58).slice(0, 3).forEach(function (l, i) { text(ctx, l, 190, 203 + i * 10, C.gold); });
    }
  };

  // ------------------------------------------------------------------ ITEMS: tabs by kind (his: consumables, utility -- the gear a fight can use -- components, quest)
  var ITEM_TABS = [{ label: 'USE', glyph: 'flask' }, { label: 'TOOLS', glyph: 'torch' }, { label: 'PARTS', glyph: 'leaf' }, { label: 'QUEST', glyph: 'key' }];
  function itemTab(it) {
    if (!it) return -1;
    if (it.kind === 'key') return 3;
    if (it.kind === 'part') return 2;
    if (it.kind === 'tool') return 1;
    if (it.kind === 'use') return /^(light|damage|rest|ward)$/.test(it.use && it.use.effect) ? 1 : 0;
    return -1; // (what is worn or wielded, and the ammunition: GEAR)
  }
  MN.itemTab = itemTab;
  function ItemsPage(m) { this.m = m; this.list = new List({ visible: 13 }); this.tab = 0; var self = this, pack = m.host.pack(); for (var t = 0; t < 4; t++) if (pack.some(function (s) { return itemTab(item(s.id)) === t; })) { this.tab = t; break; } this.refresh(); }
  // the ring's entry for a thing in the pack (the grid's ITEM list: battle.js itemList -- its ok and its why), or null
  function ringItem(m, id) { var l = ringOf(m, 'items'); return l ? l.filter(function (e) { return e.id === id; })[0] || null : null; }
  ItemsPage.prototype.refresh = function () {
    var host = this.m.host, self = this, pack = host.pack(), ring = !!ringOf(this.m, 'items');
    this.counts = [0, 1, 2, 3].map(function (t) { return pack.filter(function (s) { return itemTab(item(s.id)) === t; }).length; });
    this.list.set(pack.filter(function (s) { return itemTab(item(s.id)) === self.tab; }).map(function (s) {
      var it = item(s.id), why = host.whyNot ? host.whyNot(s.id, null) : '', re = ring ? ringItem(self.m, s.id) : null, now = ring ? !!(re && re.ok) : null;
      // (in a fight on the grid, what the turn's action economy lets the hero use now is lit, the rest grey: Griz, 10-06, "colored or greyed out by action economy" --
      // lit as the ring's ITEM lights it since 10-07: a torch wants a free hand, the rope a face to climb)
      return { label: fit(it.name, 168), right: 'x' + s.n, value: s.id, color: ring ? (now ? costCol(re.cost) : C.dim) : it.kind === 'key' ? C.gold : why || now === false ? C.dim : null, rightColor: ring && now ? costCol(re.cost) : null, mark: (it.use && it.use.battle) || s.id === 'rope' ? 'fight' : null }; // (the rope: the grid's THE ROPE, in a fight) // (the grid: lit in its cost's colour, 10-07)
    }));
  };
  ItemsPage.prototype.update = function (k) {
    var t = tabStep(k, 4, this.tab); if (t !== this.tab) { this.tab = t; this.list.i = 0; this.refresh(); }
    var r = this.list.update(k);
    if (r === 'back') { this.m.pop(); return; }
    if (r === 'pick') this.use(this.list.cur().value);
  };
  ItemsPage.prototype.use = function (id) {
    var m = this.m, host = m.host, it = item(id), u = it.use, self = this;
    // (the grid: the pick goes to the ring's ITEM -- drunk, lit, or aimed on the floor as the ring aims it -- 10-07, the menus lane §2.1, Griz: "using items from there")
    if (host.fight && host.fight.ring) { var re = ringItem(m, id); if (re && re.ok) { ringPick(m, 'items', re); return; } sfx('error'); m.say([it.name + ': ' + (re ? (re.why || 'not now') + '.' : (it.desc || '') + (u && u.battle ? '' : ' Not for a fight.'))]); return; }
    if (host.fight) { m.say([it.name + ': ' + (it.desc || '')].concat(u && u.battle ? ['In a fight, use it from the fight\'s ITEM.'] : [])); return; }
    if (!u || !u.field) { m.say([it.name + ': ' + (it.desc || 'Nothing to do with it here.')].concat(u && u.battle ? ['It is for a fight.'] : [])); return; }
    if (u.target === 'party') { m.act('item', { id: id }); return; }
    if (u.effect === 'learn') { var lw = host.whyNot(id, null); if (lw) { m.say(lw); return; } }
    m.root.choose({ title: u.effect === 'learn' ? 'WHO COPIES IT?' : u.effect === 'light' ? 'WHO CARRIES IT?' : 'USE ON WHOM?', sub: it.name,
      ok: function (h) {
        if (u.effect === 'learn') { var w = host.whyNot(id, h); return w || true; }
        if (u.target === 'revive') return h.ko ? true : h.name + ' is not down.';
        if (u.effect === 'heal') return h.hp < h.maxhp ? true : h.name + ' is unhurt.';
        return h.ko ? h.name + ' is down.' : true;
      },
      then: function (h) { m.act('item', { id: id, h: h }, function () { self.refresh(); }); } });
  };
  ItemsPage.prototype.draw = function (ctx, active) {
    var self = this;
    win(ctx, 2, 2, 252, 192);
    drawTabs(ctx, ITEM_TABS.map(function (t, i) { return { label: t.label, glyph: t.glyph, count: self.counts[i] }; }), this.tab, 8, 9, 240);
    if (!this.list.items.length) text(ctx, 'Nothing of this kind.', 24, 32, C.grey);
    this.list.draw(ctx, 10, 30, 234, active, this.m.t, 12, 9);
    var cur = this.list.cur(), it = cur && item(cur.value);
    var ring = !!ringOf(this.m, 'items'), re = it && ring ? ringItem(this.m, cur.value) : null;
    if (it) { var why = this.m.host.whyNot ? this.m.host.whyNot(cur.value, null) : ''; descBox(ctx, it.desc || '', why || (re ? (re.ok ? 'E: use it now.' : 'Not now: ' + (re.why || 'not now') + '.') : it.use && it.use.battle ? 'Usable in a fight.' : '')); }
    else descBox(ctx, '◀ ▶ the kinds   ' + (this.m.host.fight && !ring ? 'a look only, in a fight' : 'E: use'));
  };

  // ------------------------------------------------------------------ GEAR: to look at, tabs by kind; equipping is EQUIP's
  var GEAR_TABS = [{ label: 'WEAPONS', glyph: 'sword', kinds: ['weapon'] }, { label: 'ARMOR', glyph: 'armor', kinds: ['armor'] }, { label: 'SHIELDS', glyph: 'shield', kinds: ['shield'] },
    { label: 'RINGS', glyph: 'ring', kinds: ['ring'] }, { label: 'CLOAKS', glyph: 'cloak', kinds: ['cloak'] }, { label: 'MISC', glyph: 'boot', kinds: ['worn'] }, { label: 'AMMO', glyph: 'arrow', kinds: ['ammo'] }];
  function GearPage(m) { this.m = m; this.tab = 0; this.list = new List({ visible: 13 }); this.refresh(); }
  GearPage.prototype.refresh = function () {
    var host = this.m.host, tab = GEAR_TABS[this.tab], rows = [];
    host.pack().forEach(function (s) { var it = item(s.id); if (it && tab.kinds.indexOf(it.kind) >= 0) rows.push({ label: fit(it.name, 150), right: 'x' + s.n, value: s.id }); });
    host.party().forEach(function (h) { Object.keys(h.equip || {}).forEach(function (sl) { var it = item(h.equip[sl]); if (sl !== 'torch' && it && tab.kinds.indexOf(it.kind) >= 0) rows.push({ label: fit(it.name, 150), right: 'on ' + h.name, value: h.equip[sl], who: h, slot: sl, color: C.pale, rightColor: C.gold }); }); });
    this.list.set(rows);
  };
  // E on a row, out of a fight (Griz, 10-06: "when I see the Quarterstaff is on Ly click doesn't kick me into the equip tab with lymen selected" -- "(when out
  // of combat)"): a thing worn opens EQUIP on its wearer at its place; a thing in the pack kicks the cursor into the panel for who wears it, then its place
  // and the list of what goes there, the thing under the cursor
  GearPage.prototype.update = function (k) {
    var t = tabStep(k, GEAR_TABS.length, this.tab); if (t !== this.tab) { this.tab = t; this.list.i = 0; this.refresh(); }
    var r = this.list.update(k), m = this.m, host = m.host;
    if (r === 'back') { m.pop(); return; }
    if (r !== 'pick') return;
    var row = this.list.cur(), it = item(row.value);
    if (host.fight) { m.say([it.name + ': ' + (it.desc || '')].concat(['In a fight, EQUIP is the one whose turn it is.'])); return; }
    if (row.who) { m.push(new EquipPage(m, row.who, row.slot)); return; }
    if (it.kind === 'ammo') { m.say(it.name + ': ' + (it.desc || '') + ' It goes with the bow or crossbow that shoots it.'); return; }
    m.root.choose({ title: 'WHO WEARS IT?', sub: it.name, ok: function (h) { return R().canEquip(h, it) ? true : h.name + ' can\'t use it.'; },
      then: function (h) { var slot = R().slotFor(h, it), ep = m.push(new EquipPage(m, h, slot)), cp = m.push(new CandPage(m, h, slot, ep)); cp.list.i = Math.max(0, cp.list.items.map(function (x) { return x.value; }).indexOf(row.value)); cp.list.fix(); } });
  };
  GearPage.prototype.draw = function (ctx, active) {
    var self = this, host = this.m.host;
    win(ctx, 2, 2, 252, 192);
    drawTabs(ctx, GEAR_TABS.map(function (t, i) { return { label: i === self.tab ? t.label : '', glyph: t.glyph }; }), this.tab, 8, 9, 240);
    if (!this.list.items.length) text(ctx, 'None in the pack, none worn.', 24, 32, C.grey);
    this.list.draw(ctx, 10, 30, 234, active, this.m.t);
    var cur = this.list.cur(), it = cur && item(cur.value);
    if (it) {
      var who = host.party().filter(function (h) { return R().canEquip(h, it); }).map(function (h) { return h.name; });
      descBox(ctx, it.desc || '', (it.attune ? 'Wants a bond (attunement). ' : '') + (who.length === host.party().length ? '' : who.length ? 'For ' + who.join(', ') + '.' : 'No one here can use it.'));
    } else descBox(ctx, '◀ ▶ the kinds.');
    if (it && !host.fight) footer(ctx, cur.who ? 'E: ' + cur.who.name + '\'s EQUIP' : 'E: who wears it', 186);
  };

  // ------------------------------------------------------------------ spells: what a hero has to cast from, and their colours
  // (his: "rituals/component spells and 'travel buffs' (mage armor, aid, etc?) colored differently - battle ones would be greyed out")
  function bookOf(h) {
    var R0 = R(), ids = (h.known || []).slice();
    if (h.cls === 'paladin' && R0.PALADIN_SPELLS && R0.maxSlotLevel(h) > 0) ids = ids.concat(R0.PALADIN_SPELLS.filter(function (id) { var sp = spell(id); return sp && sp.level <= R0.maxSlotLevel(h); }));
    if (R0.oathSpells) ids = ids.concat(R0.oathSpells(h));
    return ids.filter(function (id, i, a) { return spell(id) && a.indexOf(id) === i; });
  }
  function spellCat(sp) { if (sp.ritual) return 'ritual'; if (sp.kind === 'rest' || sp.component) return 'rest'; if (sp.field && sp.buff) return 'lasting'; if (sp.field) return 'field'; return 'battle'; }
  var CAT = { ritual: { c: C.green, w: 'ritual' }, rest: { c: C.orange, w: 'rest' }, lasting: { c: C.magic, w: 'lasting' }, field: { c: C.white, w: 'field' }, battle: { c: C.pale, w: 'fight' } };
  MN.spellCat = spellCat;
  // readied today: one who prepares, the day's and the always-ready; anyone else, all he knows
  function readied(h, id) { if (!h.prepared) return true; return R().castable(h, 'field').concat(R().castable(h, 'battle')).indexOf(id) >= 0; }
  function levelsOf(h) { var ls = []; bookOf(h).forEach(function (id) { var lv = spell(id).level || 0; if (ls.indexOf(lv) < 0) ls.push(lv); }); return ls.sort(function (a, b) { return a - b; }); }
  function lvWord(lv) { return lv === 0 ? 'CANTRIPS' : ['', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH'][lv] + ' LEVEL'; }
  function legend(ctx, y) { var x = 10; ['ritual', 'rest', 'lasting', 'field', 'battle'].forEach(function (k) { text(ctx, CAT[k].w, x, y, CAT[k].c); x += DS.textWidth(CAT[k].w) + 9; }); }

  // ------------------------------------------------------------------ MAGIC: the caster from the panel, a tab per level
  // (in a fight with the ring's lists -- the grid's -- the page is the ring's SPELLS for the one whose turn it is, a tab a level: each lit as the ring lights it, its why
  // when not, and E on it is the ring's own aim at the slot the ring starts at; 10-07, his find on the grid's menu, "doesn't work for ... magic")
  function MagicPage(m, h) {
    this.m = m; this.h = h; this.ring = ringOf(m, 'spells'); this.tab = 0; this.list = new List({ visible: 11 });
    this.levels = this.ring ? this.ring.map(function (e) { return e.level || 0; }).filter(function (lv, i, a) { return a.indexOf(lv) === i; }).sort(function (a, b) { return a - b; }) : levelsOf(h);
    if (this.ring) { var self = this; this.ring.some(function (e) { if (e.ok) { self.tab = self.levels.indexOf(e.level || 0); return true; } return false; }); } // (the first tab with something to cast)
    this.refresh();
    if (this.ring) { var f = 0; this.list.items.some(function (x, i) { if (!x.disabled) { f = i; return true; } return false; }); this.list.i = f; this.list.fix(); }
  }
  MagicPage.prototype.refresh = function () {
    if (this.ring) {
      var lvR = this.levels[this.tab]; this.ring = ringOf(this.m, 'spells');
      this.list.set(this.ring.filter(function (e) { return (e.level || 0) === lvR; }).map(function (e) {
        var sp8 = spell(e.id), cc = costCol((e.g && e.g.time) || 'A'), rt = !e.level ? 'at will' : e.levels && e.levels.length ? 'L' + e.slot : 'no slot'; // (lit by its cost: a bonus-action spell blue, 10-07)
        return { label: fit(e.name, 150), right: rt, value: e, id: e.id, ready: true, ring: true, color: cc, disabled: !e.ok, rightColor: cc, desc: (sp8 && sp8.desc) || (e.sp && e.sp.desc) || '' };
      }));
      return;
    }
    var h = this.h, R0 = R(), fight = !!this.m.host.fight, lv = this.levels[this.tab], field = R0.castable(h, 'field');
    this.list.set(bookOf(h).filter(function (id) { return (spell(id).level || 0) === lv; }).map(function (id) {
      var sp = spell(id), cat = spellCat(sp), ready = readied(h, id), slot = sp.level && !sp.ritual ? R0.lowestSlot(h, sp.level) : 0;
      var can = !fight && !h.ko && sp.field && field.indexOf(id) >= 0 && (!sp.level || sp.ritual || slot) && sp.level <= Math.max(0, R0.maxSlotLevel(h));
      var rt = !sp.field ? 'fight' : sp.ritual ? 'ritual' : !sp.level ? 'at will' : slot ? 'L' + slot : 'no slot';
      return { label: fit(sp.name, 150), pre: h.prepared && ready ? '*' : null, right: rt, value: sp, id: id, ready: ready, color: CAT[cat].c, disabled: !can, rightColor: CAT[cat].c };
    }));
  };
  MagicPage.prototype.update = function (k) {
    var t = tabStep(k, this.levels.length, this.tab); if (t !== this.tab) { this.tab = t; this.list.i = 0; this.refresh(); if (this.ring) { var f = 0; this.list.items.some(function (x, i) { if (!x.disabled) { f = i; return true; } return false; }); this.list.i = f; this.list.fix(); } } // (the ring's: the first that can be cast)
    var r = this.list.update(k), m = this.m, h = this.h, self = this;
    if (r === 'back') { m.pop(); return; }
    if (r === 'refused' && this.ring) { var cR = this.list.cur().value; m.say(cR.name + ': ' + (cR.why || 'not now') + '.'); return; }
    if (r === 'pick' && this.ring) { ringPick(m, 'spells', this.list.cur().value); return; }
    if (r === 'refused') { var c0 = this.list.cur(), sp0 = c0.value; m.say(m.host.fight ? 'In a fight, cast from the fight\'s MAGIC.' : !sp0.field ? sp0.name + ' is for a fight.' : !c0.ready ? sp0.name + ' is not prepared today.' : h.ko ? h.name + ' is down.' : sp0.level > R().maxSlotLevel(h) ? 'Not yet: no slot of its level.' : 'No slot left for it.'); return; }
    if (r === 'pick') {
      var sp = this.list.cur().value;
      // a spell on one of the party: the cursor to the panel (Mage Armor on the unarmoured, a heal on the hurt, the fallen too)
      if (sp.kind === 'heal' || sp.kind === 'cure' || sp.kind === 'revive' || (sp.kind === 'buff' && sp.target !== 'allies' && sp.buff !== 'aid')) {
        var ma = sp.buff === 'mageArmor';
        m.root.choose({ title: sp.kind === 'revive' ? 'WHO COMES BACK?' : 'ON WHOM?', sub: sp.name, ok: function (x) { if (sp.kind === 'revive') return x.ko ? true : x.name + ' is not down.'; if (ma && R().armored(x)) return x.name + ' wears armor.'; if (sp.kind === 'heal') return x.hp < x.maxhp ? true : x.name + ' is unhurt.'; return x.ko ? x.name + ' is down.' : true; },
          then: function (x) { m.act('cast', { h: h, sp: sp, t: x }, function () { self.refresh(); }); } });
        return;
      }
      m.act('cast', { h: h, sp: sp }, function () { self.refresh(); });
    }
  };
  MagicPage.prototype.draw = function (ctx, active) {
    var h = this.h, self = this;
    win(ctx, 2, 2, 252, 192);
    text(ctx, h.name, 10, 9, C.gold); right(ctx, h.slotsMax && h.slotsMax.length ? 'slots ' + (h.slots || []).map(function (n, q) { return n + '/' + h.slotsMax[q]; }).join(' ') : '', 246, 9, C.magic);
    drawTabs(ctx, this.levels.map(function (lv) { return { label: lv ? 'L' + lv : 'C' }; }), this.tab, 8, 22, Math.min(240, this.levels.length * 34));
    text(ctx, lvWord(this.levels[this.tab]), 10, 38, C.pale);
    this.list.draw(ctx, 10, 52, 234, active, this.m.t);
    if (this.ring) costKey(ctx, 10, 184); else legend(ctx, 184);
    var cur = this.list.cur();
    if (cur && cur.ring) descBox(ctx, cur.desc, cur.disabled ? 'Not now: ' + (cur.value.why || 'not now') + '.' : 'E: cast it -- aimed as the ring aims.');
    else descBox(ctx, cur ? (cur.value.desc || '') : '', cur && !cur.ready ? 'Not prepared today.' : '');
  };

  // ------------------------------------------------------------------ SKILLS: a hero's, each with its line (his: "popup available skill with description line")
  function skillsOf(h) {
    var out = [], f = h.feats || {};
    if (h.cls === 'paladin' && f.lay != null) out.push({ s: 'lay', name: 'LAY ON HANDS', right: f.lay, ok: f.lay > 0, ally: true, desc: 'Heal by touch from a pool of 5 a level; it wakes the fallen.' });
    if (h.cls === 'wizard') out.push({ s: 'arcane', name: 'ARCANE RECOVERY', right: f.arcaneRecovery ? 'ready' : 'spent', ok: !!f.arcaneRecovery, desc: 'Once a day: spent slots back, ' + Math.ceil(h.lvl / 2) + ' levels of them.' });
    if (h.cls === 'fighter') out.push({ s: 'wind', name: 'SECOND WIND', right: f.secondWind ? 'ready' : 'spent', ok: !!f.secondWind, desc: 'Once a rest: 1d10 + ' + h.lvl + ' HP back.' });
    return out;
  }
  MN.skillsOf = skillsOf;
  // (in a fight with the ring's lists -- the grid's -- the page is the ring's SKILLS for the one whose turn it is: the class's features that spend something, the
  // Channel Divinity's, a martial's first-ring feature; each with its cost, lit as the ring lights it, and E on it is the ring's own -- 10-07, his find: "doesn't work for ... skills")
  var COSTW = { A: 'action', B: 'bonus', F: 'free', M: 'move', R: 'reaction' };
  function SkillsPage(m, h) { this.m = m; this.h = h; this.ring = !!ringOf(m, 'skills'); this.list = new List({ visible: 5 }); this.refresh(); var f = 0; this.list.items.some(function (x, i) { if (!x.disabled) { f = i; return true; } return false; }); this.list.i = f; this.list.fix(); }
  SkillsPage.prototype.refresh = function () {
    var h = this.h, fight = !!this.m.host.fight;
    if (this.ring) { this.list.set(ringOf(this.m, 'skills').map(function (c) { return { label: fit(c.label, 150), right: COSTW[c.cost] || '', value: c, sub: fit(c.ok ? (c.note || '') : 'not now: ' + (c.why || 'not now'), 196), disabled: !c.ok, color: costCol(c.cost), rightColor: costCol(c.cost) }; })); return; } // (lit by its cost, 10-07)
    this.list.set(skillsOf(h).map(function (s) { return { label: s.name, right: s.right, value: s, sub: s.desc, disabled: fight || h.ko || !s.ok }; }));
  };
  SkillsPage.prototype.update = function (k) {
    var r = this.list.update(k), m = this.m, h = this.h, self = this;
    if (r === 'back') { m.pop(); return; }
    if (r === 'refused' && this.ring) { var cR = this.list.cur().value; m.say(cR.label + ': ' + (cR.why || 'not now') + '.'); return; }
    if (r === 'pick' && this.ring) { ringPick(m, 'skills', this.list.cur().value); return; }
    if (r === 'refused') { m.say(m.host.fight ? 'In a fight, from the fight\'s SKILL.' : h.ko ? h.name + ' is down.' : 'Spent till the rest.'); return; }
    if (r !== 'pick') return;
    var s = this.list.cur().value;
    if (s.ally) { m.root.choose({ title: s.name, sub: h.feats.lay + ' left', ok: function (x) { return x.hp < x.maxhp ? true : x.name + ' is unhurt.'; }, then: function (x) { m.act('skill', { h: h, s: s.s, t: x }, function () { self.refresh(); }); } }); return; }
    m.act('skill', { h: h, s: s.s }, function () { self.refresh(); });
  };
  SkillsPage.prototype.draw = function (ctx, active) {
    var n = Math.max(1, Math.min(this.list.vis, this.list.items.length)), hh = 26 + n * 24; // (the ring's SKILLS may run past five: the list scrolls)
    win(ctx, 16, 50, 224, hh);
    text(ctx, this.h.name + ': SKILLS', 24, 57, C.gold);
    this.list.draw(ctx, 22, 72, 208, active, this.m.t, 24);
  };

  // ------------------------------------------------------------------ EQUIP: the places a body wears things (RULED 10-06: CLOAK "definite"; the places as items come; two rings)
  var SLOTS = [['weapon', 'WEAPON'], ['armor', 'ARMOR'], ['shield', 'SHIELD'], ['ring', 'RING'], ['ring2', 'RING'], ['cloak', 'CLOAK'], ['feet', 'FEET'], ['neck', 'NECK']];
  function fitsSlot(it, slot) { if (!it) return false; if (slot === 'ring' || slot === 'ring2') return it.kind === 'ring'; if (slot === 'feet' || slot === 'neck') return it.kind === 'worn' && it.place === slot; return it.kind === slot; }
  // the bond's mark beside a worn thing: a gold diamond bonded, a dim one waiting for a rest (the font has no hollow diamond)
  function bondMark(h, id) { var b = R().bondState ? R().bondState(h, id) : ''; return b === 'bonded' ? '◆' : b === 'unbonded' ? '◆' : null; }
  function bondColor(h, id) { var b = R().bondState ? R().bondState(h, id) : ''; return b === 'unbonded' ? C.dim : b === 'bonded' ? C.gold : null; }
  function dmgText(h) { var d = R().damageExpr(h); return (d.dice === '0' ? '' : d.dice) + (d.mod ? sgn(d.mod) : ''); }
  function compare(h, slot, id) {
    var R0 = R(), save = h.equip[slot], out;
    if (slot === 'weapon') { h.equip.weapon = id; out = sgn(R0.attackBonus(h)) + ' ' + dmgText(h); h.equip.weapon = save; return out; }
    var it = item(id);
    if (it && it.attune && R0.bondState && (!h.attuned || h.attuned.indexOf(id) < 0) && h.attuned) return 'a rest to bond';
    var before = R0.ac(h); h.equip[slot] = id; var after = R0.ac(h); h.equip[slot] = save;
    if (slot === 'armor' || slot === 'shield' || after !== before) return 'AC ' + after + (after > before ? ' ▲' : after < before ? ' ▼' : '');
    return '';
  }
  function EquipPage(m, h, at) { this.m = m; this.h = h; this.list = new List({ visible: 9 }); this.refresh(); if (at) { this.list.i = Math.max(0, this.list.items.map(function (x) { return x.value; }).indexOf(at)); this.list.fix(); } }
  // a grid choice's place (deep16/js/battle.js gearOptions kinds; the free hand's -- PUT AWAY, DRAW, the light -- name theirs: deep16/js/ui.js gridHost fightEquip)
  function optSlot(o) { return o.slot || (o.kind === 'weapon' ? 'weapon' : /^shield/.test(o.kind) ? 'shield' : /^armor/.test(o.kind) ? 'armor' : null); }
  // a place with nothing to change it to: one wording wherever it is said (10-07, his find on the grid's menu: "\"nothing goes there in this fight\" vs \"no weapon barley
  // can swap to\"" -- the seat's pick)
  function emptyWhy(m, h) { return 'Nothing in the pack ' + h.name + ' can put there' + (m.host.fight ? ' in this fight.' : '.'); }
  function packLights(host) { return host.pack().filter(function (s) { var it = item(s.id); return s.n > 0 && it && it.use && it.use.effect === 'light'; }); }
  EquipPage.prototype.refresh = function () {
    var h = this.h, host = this.m.host, fight = !!host.fight, acted = fight && host.fight.acted, lt = host.light ? host.light(h) : null, lit = !!lt;
    var fo = this.fo = fight && host.fightEquip ? host.fightEquip() : null, away = host.wielding ? host.wielding(h) : ''; // (the grid: its own choices, each with what it costs or why not)
    var rows = SLOTS.map(function (s) {
      var id = h.equip[s[0]], it = item(id), mk = it ? bondMark(h, id) : null;
      var off = fo ? !fo.some(function (o) { return optSlot(o) === s[0]; }) : (fight && (acted || (s[0] !== 'weapon' && s[0] !== 'shield'))) || (s[0] === 'shield' && lit && !h.equip.shield);
      return { label: s[1], right: it ? fit((mk ? mk + ' ' : '') + it.name + (s[0] === 'weapon' && away ? ' (' + away + ')' : ''), 128) : (s[0] === 'shield' && lit ? 'a light in hand' : '—'), value: s[0], disabled: off, rightColor: it && bondColor(h, id) === C.dim ? C.dim : null };
    });
    // LIGHT: the one in hand, or -- with a light in the pack -- the place to take one up (10-07, his find on the grid's menu: "torches cannot be equipped"); in the
    // grid's fight its choices are the ring's (fo), out of one the light put away or lit from here, as ITEMS lights it
    var lights = fo ? fo.filter(function (o) { return optSlot(o) === 'light'; }) : null;
    if (lt || (fo ? lights.length : packLights(host).length)) rows.push({ label: 'LIGHT', right: lt ? fit(lt.name, 128) : '—', value: 'light', disabled: fo ? !lights.length : fight });
    this.list.set(rows);
  };
  EquipPage.prototype.update = function (k) {
    var r = this.list.update(k), m = this.m, h = this.h, self = this;
    if (r === 'back') { m.pop(); return; }
    // (ARMOR in a fight, either game: the SRD's minutes -- RULED 10-07, Griz: "SRD everywhere", "(not in a fight) is plenty")
    if (r === 'refused') { m.say(m.host.fight && this.list.cur().value === 'armor' ? 'Armour: not in a fight.' : this.fo ? emptyWhy(m, h) : m.host.fight ? (m.host.fight.acted ? 'The action is spent: no changes now.' : 'In a fight: the weapon and the shield only.') : 'A light in that hand: no shield.'); return; }
    if (r !== 'pick') return;
    var slot = this.list.cur().value;
    if (slot === 'light' && this.fo) { m.push(new CandPage(m, h, 'light', this, this.fo.filter(function (o) { return optSlot(o) === 'light'; }))); return; }
    if (slot === 'light' && !m.host.light(h)) { // (none in hand: the pack's lights, each lit in this hand as ITEMS lights it -- a free hand, one light for the party)
      m.push(new ChoicePage(m, 'TAKE UP A LIGHT', packLights(m.host).map(function (s) { return { label: fit(item(s.id).name, 120), right: 'x' + s.n, value: s.id }; }), function (id) { m.act('item', { id: id, h: h }, function () { self.refresh(); }); }));
      return;
    }
    if (slot === 'light') { // (a torch put out is spent; a lantern or the lamp goes back in the pack)
      var lt = m.host.light(h);
      m.push(new ChoicePage(m, 'EQUIP LIGHT', [{ label: lt.hooded ? '(put it away)' : '(put it out)', right: lt.hooded ? 'to the pack' : 'spent', value: 'off' }], function () { m.act('light-off', { h: h }, function () { self.refresh(); }); }));
      return;
    }
    m.push(new CandPage(m, h, slot, this, this.fo && this.fo.filter(function (o) { return optSlot(o) === slot; })));
  };
  // a small list over the page: one choice, then back
  function ChoicePage(m, title, rows, then, w) { this.m = m; this.title = title; this.then = then; this.w = w || 196; this.list = new List({ visible: Math.min(10, rows.length), items: rows }); }
  MN.ChoicePage = ChoicePage;
  ChoicePage.prototype.update = function (k) { var r = this.list.update(k); if (r === 'back') this.m.pop(); if (r === 'refused') { var c = this.list.cur(); if (c && typeof c.right === 'string') this.m.say(c.label + ': ' + c.right + '.'); } if (r === 'pick') { var v = this.list.cur().value; this.m.pop(); this.then(v); } };
  ChoicePage.prototype.draw = function (ctx, active) { var n = this.list.vis, x = Math.round((256 - this.w) / 2); win(ctx, x, 60, this.w, 24 + n * 12); text(ctx, this.title, x + 8, 67, C.gold); this.list.draw(ctx, x + 6, 81, this.w - 14, active, this.m.t); };
  EquipPage.prototype.draw = function (ctx, active) {
    var h = this.h, R0 = R(), fight = !!this.m.host.fight, n = this.list.items.length;
    win(ctx, 14, 16, 228, 22 + n * 12);
    text(ctx, h.name + '   AC ' + R0.ac(h) + '   ATK ' + sgn(R0.attackBonus(h)) + ' ' + dmgText(h), 22, 23, C.gold);
    this.list.draw(ctx, 22, 37, 210, active, this.m.t);
    var y = 42 + n * 12, c = R0.CLASSES[h.cls], nb = (h.attuned || []).length;
    win(ctx, 14, y, 228, 52);
    text(ctx, fit('Armor: ' + (c && c.armor.length ? c.armor.join(', ') : 'none'), 210), 22, y + 7, C.grey);
    text(ctx, fit('Weapons: ' + (c ? c.weapons.join(', ') : ''), 210), 22, y + 18, C.grey);
    var bx = 22 + text(ctx, 'BONDS ' + nb + '/' + (R0.ATTUNE_MAX || 3) + '   ', 22, y + 29, C.magic);
    bx += text(ctx, '◆ bonded   ', bx, y + 29, C.pale); text(ctx, '◆ bonds at a rest', bx, y + 29, C.dim);
    if (fight) text(ctx, this.fo ? 'In a fight: each change costs the action.' : 'In a fight: weapon, shield, before acting.', 22, y + 40, C.gold);
  };
  // the things in the pack that go in a place, the change compared
  // (fo: the grid's choices for this place -- shown as the 8-bit's are, each with its cost or why not; a pick is the grid's swap, and back to the turn)
  function CandPage(m, h, slot, back, fo) { this.m = m; this.h = h; this.slot = slot; this.back = back; this.fo = fo || null; this.list = new List({ visible: 8 }); this.refresh(); }
  CandPage.prototype.refresh = function () {
    var h = this.h, slot = this.slot, host = this.m.host, lit = !!h.equip.torch, R0 = R(), rows = [];
    if (this.fo) { this.list.set(this.fo.map(function (o) { return { label: fit(o.label.replace(/^(WEAR|SHIELD ON): /, ''), 104), right: fit(o.ok ? o.short || o.note : o.why, 96), value: o, disabled: !o.ok, color: o.ok ? costCol(o.cost) : null, rightColor: o.ok ? costCol(o.cost) : C.dim }; })); return; } // (lit by its cost, 10-07)
    host.pack().forEach(function (s) {
      var it = item(s.id); if (!fitsSlot(it, slot) || !R0.canEquip(h, it)) return;
      if ((slot === 'ring' || slot === 'ring2') && h.equip[slot === 'ring' ? 'ring2' : 'ring'] === s.id && s.n < 1) return;
      var two = !!(it.weapon && (it.weapon.props || []).indexOf('two-handed') >= 0);
      rows.push({ label: fit(it.name, 120), right: two && lit ? 'both hands' : compare(h, slot, s.id), value: s.id, disabled: two && lit });
    });
    if (h.equip[slot]) rows.unshift({ label: '(remove)', value: '__none' });
    this.list.set(rows);
  };
  CandPage.prototype.update = function (k) {
    var r = this.list.update(k), m = this.m;
    if (r === 'back') { m.pop(); return; }
    if (r === 'refused') { var c0 = this.list.cur(); m.say(this.fo ? c0.value.label.replace(/^\(|\)$/g, '') + ': ' + c0.value.why + '.' : 'Both hands on it, and a light in one: put the light away first.'); return; }
    if (r !== 'pick') return;
    var pick = this.list.cur().value;
    if (this.fo) { m.host.fightSwap(pick); m.close(); return; } // (the grid: the swap spends the action, back to the turn)
    if (MN.swap(m, this.h, this.slot, pick === '__none' ? null : pick)) m.pop();
  };
  // one change of gear: the pack gives and takes, two hands are two hands
  MN.swap = function (m, h, slot, pick) {
    var host = m.host, R0 = R();
    if (slot === 'shield' && pick) { var w = item(h.equip.weapon); if (w && (w.weapon.props || []).indexOf('two-handed') >= 0) { m.say(w.name + ' needs both hands. No shield with it.'); return false; } }
    if (slot === 'weapon' && pick) { var nw = item(pick); if ((nw.weapon.props || []).indexOf('two-handed') >= 0 && h.equip.shield) { host.give(h.equip.shield, 1); h.equip.shield = null; } }
    if (h.equip[slot]) host.give(h.equip[slot], 1);
    h.equip[slot] = null;
    if (pick) { host.take(pick, 1); h.equip[slot] = pick; if (R0.ward) R0.ward(h); } // (a thing put on that bars a condition ends it -- the Periapt and a poison: js/rules.js R.ward, 10-07)
    sfx('confirm');
    if (pick && R0.bondState && R0.bondState(h, pick) === 'unbonded') m.say(h.name + ' wears the ' + item(pick).name + '. It wants a bond: it works after the next rest' + ((h.attuned || []).length >= (R0.ATTUNE_MAX || 3) ? ', and three bonds are held already.' : '.'));
    return true;
  };
  CandPage.prototype.draw = function (ctx, active) {
    var n = Math.max(1, this.list.items.length), hh = 24 + Math.min(8, n) * 12;
    win(ctx, 30, 56, 196, hh);
    text(ctx, 'EQUIP ' + (SLOTS.filter(function (s) { return s[0] === this.slot; }, this)[0] || ['', this.slot.toUpperCase()])[1], 38, 63, C.gold);
    if (!this.list.items.length) wrap(emptyWhy(this.m, this.h), 172).slice(0, 2).forEach(function (l, i) { text(ctx, l, 44, 77 + i * 10, C.grey); });
    this.list.draw(ctx, 38, 77, 180, active, this.m.t);
    var cur = this.list.cur(), it = cur && item(cur.value);
    if (it) descBox(ctx, it.desc || '', it.attune ? 'Bonds at a rest (three at most).' : '');
    else if (cur && this.fo) descBox(ctx, cur.value.label.replace(/^\(|\)$/g, '') + ': ' + (cur.value.note || ''), cur.value.ok ? '' : 'Not now: ' + (cur.value.why || 'not now') + '.'); // (the grid's choice: what it does and what it costs, or why not)
  };

  // ------------------------------------------------------------------ STATUS: features, spells by level, what is worn; a guest's own page
  // (his: "pull features and spells into separate tabs (arrow right left) with active and passive color distinction on features and spells
  // multiple pages by level with color and * for readied"; the designer asides went to CREDITS, the lore stays)
  function featureLines(h) {
    var d = DS.DATA.heroes[h.id] || {}, R0 = R(), out = [];
    (d.featText || []).forEach(function (f) { if ((f.lvl && f.lvl > h.lvl) || (f.sub && f.sub !== h.subclass)) return; out.push({ t: f.t, use: !!f.use }); });
    out.forEach(function (f) { // (the class's numbers in the sheet's own line: STATUS listed Sneak Attack twice, 10-06)
      if (/^Sneak Attack/.test(f.t)) f.t = f.t.replace(/^Sneak Attack/, 'Sneak Attack ' + R0.sneakDice(h.lvl));
      if (/^Lay on Hands/.test(f.t) && h.feats) f.t += ', ' + (h.feats.lay || 0) + ' left';
    });
    var merged = []; // (a name's lines joined: Expertise at 1 and at 6 is one line)
    out.forEach(function (f) { var mm = /^(Expertise):\s*(.*)$/.exec(f.t), prev = mm && merged.filter(function (g) { return g.key === mm[1]; })[0]; if (prev) prev.t += ', ' + mm[2]; else merged.push({ t: f.t, use: f.use, key: mm ? mm[1] : null }); });
    return merged;
  }
  MN.featureLines = featureLines;
  function StatusPage(m, h) {
    this.m = m; this.h = h; this.scroll = 0;
    var guest = m.host.party().indexOf(h) < 0;
    this.pages = (guest ? [{ k: 'guest', g: 'GUEST' }] : []).concat([{ k: 'feat', g: 'FEATURES' }], levelsOf(h).map(function (lv) { return { k: 'spells', lv: lv, g: 'SPELLS' }; }), [{ k: 'gear', g: 'GEAR' }]);
    this.p = 0; this.guest = guest;
  }
  StatusPage.prototype.lines = function () { // [{ t, c }] for the page shown
    var h = this.h, pg = this.pages[this.p], out = [], d = DS.DATA.heroes[h.id] || {}, R0 = R();
    function add(s, c, ind) { wrap(s, 230 - (ind || 0)).forEach(function (l, i) { out.push({ t: (i && ind ? '' : '') + l, c: c, x: i ? (ind || 0) + 8 : (ind || 0) }); }); }
    if (pg.k === 'guest') { add(d.classLine || clsName(h) + ' ' + h.lvl, C.pale); add(d.blurb || '', C.tan); out.push({ t: '', c: C.dim }); add('A guest of the party: fights on its own; its gear is its own.', C.dim); }
    if (pg.k === 'feat') {
      var fs = featureLines(h);
      if (!fs.length) add('Nothing written on the sheet.', C.grey);
      fs.forEach(function (f) { add('· ' + f.t, f.use ? C.gold : C.pale); });
      if (d.note) { out.push({ t: '', c: C.dim }); add(d.note, C.dim); }
    }
    if (pg.k === 'spells') {
      var lv = pg.lv;
      bookOf(h).filter(function (id) { return (spell(id).level || 0) === lv; }).forEach(function (id) {
        var sp = spell(id), cat = spellCat(sp);
        out.push({ t: ((h.prepared && readied(h, id)) ? '* ' : '  ') + sp.name, c: CAT[cat].c, r: CAT[cat].w });
      });
    }
    if (pg.k === 'gear') {
      var w = R0.weaponOf(h), dx = R0.damageExpr(h, w);
      out.push({ t: 'WEAPON  ' + w.name, c: C.white, r: sgn(R0.attackBonus(h, w)) + ' ' + (dx.dice === '0' ? '' : dx.dice) + sgn(dx.mod) });
      SLOTS.slice(1).forEach(function (s) { var it = item(h.equip[s[0]]), mk = it ? bondMark(h, h.equip[s[0]]) : null; out.push({ t: s[1] + '  ' + (it ? fit((mk ? mk + ' ' : '') + it.name, 170) : '—'), c: it ? (bondColor(h, h.equip[s[0]]) === C.dim ? C.dim : C.pale) : C.dim, r: it && bondColor(h, h.equip[s[0]]) === C.dim ? 'at a rest' : null }); });
      out.push({ t: '', c: C.dim });
      add('BONDS ' + (h.attuned || []).length + '/' + (R0.ATTUNE_MAX || 3) + ((h.attuned || []).length ? ': ' + h.attuned.map(function (id) { return (item(id) || { name: id }).name; }).join(', ') : ''), C.magic);
    }
    return out;
  };
  StatusPage.prototype.update = function (k) {
    var p = tabStep(k, this.pages.length, this.p); if (p !== this.p) { this.p = p; this.scroll = 0; }
    var n = this.lines().length, room = 10;
    if (k.repeat('down') && this.scroll + room < n) { this.scroll++; sfx('cursor'); }
    if (k.repeat('up') && this.scroll > 0) { this.scroll--; sfx('cursor'); }
    if (k.pressed('a') || k.pressed('b')) { sfx('cancel'); this.m.pop(); }
  };
  StatusPage.prototype.draw = function (ctx) {
    var h = this.h, m = this.m, R0 = R(), d = DS.DATA.heroes[h.id] || {}, self = this;
    win(ctx, 2, 2, 252, 236);
    var spr = null; try { spr = m.host.portrait && m.host.portrait(h); } catch (e) { spr = null; }
    if (spr) ctx.drawImage(spr, 12, 10, 32, 48);
    text(ctx, h.name, 52, 10, C.gold);
    text(ctx, clsName(h) + ' ' + h.lvl + (h.subclass ? ' · ' + h.subclass : ''), 52, 21, C.pale);
    text(ctx, fit((d.race || h.race || '') + (d.background ? ' · ' + d.background : ''), 196), 52, 32, C.grey);
    var nx = R0.nextXP(h);
    text(ctx, this.guest ? 'GUEST' : 'XP ' + h.xp + (nx ? '  next ' + nx : '  (cap)'), 52, 43, this.guest ? C.cyan : C.white);
    text(ctx, 'HP ' + Math.max(0, h.hp) + '/' + h.maxhp + '   AC ' + R0.ac(h) + '   PROF +' + R0.prof(h.lvl) + (R0.CLASSES[h.cls] && R0.CLASSES[h.cls].cast ? '   DC ' + R0.spellDC(h) : ''), 12, 62);
    R0.ABIL.forEach(function (a, i) {
      var x = 12 + (i % 3) * 80, y = 74 + Math.floor(i / 3) * 11, sv = (h.saveProf || []).indexOf(a) >= 0;
      text(ctx, a.toUpperCase() + ' ' + h.abil[a] + ' (' + sgn(mod(h.abil[a])) + ')' + (sv ? '*' : ''), x, y, sv ? C.white : C.pale);
    });
    // the tabs: the page's group lit; a spell page names its level
    var groups = [], gi = 0;
    this.pages.forEach(function (pg, i) { if (!groups.length || groups[groups.length - 1].g !== pg.g) groups.push({ g: pg.g, first: i }); if (i === self.p) gi = groups.length - 1; });
    drawTabs(ctx, groups.map(function (g) { return { label: g.g }; }), gi, 8, 100, 240);
    var pg = this.pages[this.p];
    if (pg.k === 'spells') { text(ctx, lvWord(pg.lv), 12, 114, C.pale); if (pg.lv && h.slotsMax) right(ctx, 'slots ' + (h.slots[pg.lv - 1] || 0) + '/' + (h.slotsMax[pg.lv - 1] || 0), 244, 114, C.magic); }
    var ls = this.lines(), y0 = pg.k === 'spells' ? 126 : 116;
    ls.slice(this.scroll, this.scroll + 10).forEach(function (l, i) { text(ctx, l.t, 12 + (l.x || 0), y0 + i * 10, l.c); if (l.r) right(ctx, l.r, 244, y0 + i * 10, l.c); });
    if (this.scroll > 0) text(ctx, '▲', 238, y0 - 2, C.pale);
    if (this.scroll + 10 < ls.length) text(ctx, '▼', 238, y0 + 92, C.pale);
    if (pg.k === 'spells') legend(ctx, 218); else if (pg.k === 'feat') { text(ctx, 'used', 12, 218, C.gold); text(ctx, 'always on', 42, 218, C.pale); }
    footer(ctx, '◀ ▶ pages   X back', 228);
  };

  // ------------------------------------------------------------------ ORDER: its own way (his: "don't go to char window for 'order select' that one is better that way")
  function OrderPage(m) { this.m = m; this.a = null; this.list = new List({ visible: 6 }); this.refresh(); }
  OrderPage.prototype.refresh = function () { var a = this.a; this.list.set(this.m.host.party().map(function (h) { return { label: h.name, right: (h.ko ? 'KO ' : '') + Math.max(0, h.hp) + '/' + h.maxhp, value: h, color: h === a ? C.gold : null }; })); };
  OrderPage.prototype.update = function (k) {
    var r = this.list.update(k), m = this.m;
    if (r === 'back') { if (this.a) { this.a = null; this.refresh(); } else m.pop(); return; }
    if (r !== 'pick') return;
    var h = this.list.cur().value;
    if (!this.a) { this.a = h; this.refresh(); return; }
    var p = m.host.party(), ia = p.indexOf(this.a), ib = p.indexOf(h);
    if (ia >= 0 && ib >= 0 && ia !== ib) { p[ia] = h; p[ib] = this.a; }
    m.pop();
  };
  OrderPage.prototype.draw = function (ctx, active) {
    var n = this.list.items.length;
    win(ctx, 60, 50, 136, 24 + n * 12);
    text(ctx, this.a ? 'SWAP WITH?' : 'MOVE WHOM?', 68, 57, C.gold);
    this.list.draw(ctx, 66, 71, 122, active, this.m.t);
  };

  // ------------------------------------------------------------------ JOURNAL: open, done (his: "extra tab to stow completed"), the talk
  function JournalPage(m) { this.m = m; this.tab = 0; this.list = new List({ visible: 9 }); this.scroll = 0; this.refresh(); var j = m.host.journal(), self = this; (j.quests || []).forEach(function (q) { if (!q.done && q.id === j.pin) self.list.i = self.list.items.map(function (x) { return x.value; }).indexOf(q); }); this.list.fix(); }
  JournalPage.prototype.refresh = function () {
    var j = this.m.host.journal(), tab = this.tab;
    this.j = j;
    this.list.set((j.quests || []).filter(function (q) { return tab === 0 ? !q.done : tab === 1 ? q.done : false; }).map(function (q) {
      var pinned = j.pin === q.id;
      return { label: fit((q.done ? '★ ' : pinned ? '◆ ' : '') + q.name, 210), value: q, color: q.done ? C.grey : pinned ? C.gold : null, right: pinned ? 'PINNED' : null, rightColor: C.gold };
    }));
  };
  JournalPage.prototype.update = function (k) {
    var t = tabStep(k, 3, this.tab); if (t !== this.tab) { this.tab = t; this.list.i = 0; this.scroll = 0; this.refresh(); }
    if (this.tab === 2) {
      if (k.repeat('down')) this.scroll++; if (k.repeat('up') && this.scroll > 0) this.scroll--;
      if (k.pressed('a') || k.pressed('b')) { sfx('cancel'); this.m.pop(); }
      return;
    }
    var r = this.list.update(k);
    if (r === 'back') { this.m.pop(); return; }
    if (r === 'pick') { var q = this.list.cur().value; if (q.done) { sfx('error'); return; } this.j.setPin(this.j.pin === q.id ? null : q.id); this.refresh(); }
  };
  JournalPage.prototype.draw = function (ctx, active) {
    var j = this.j, self = this;
    win(ctx, 2, 2, 252, 236);
    var open = (j.quests || []).filter(function (q) { return !q.done; }).length, done = (j.quests || []).length - open;
    drawTabs(ctx, [{ label: 'OPEN', count: open }, { label: 'DONE', count: done }, { label: 'THE TALK' }], this.tab, 8, 9, 240);
    if (this.tab < 2) {
      text(ctx, '★ Renown ' + j.renown + '   ' + (j.title || ''), 12, 26, C.white);
      if (!this.list.items.length) text(ctx, this.tab ? 'Nothing finished yet.' : 'No open quests.', 24, 42, C.grey);
      this.list.draw(ctx, 10, 40, 234, active, this.m.t, 11);
      var cur = this.list.cur(), q = cur && cur.value;
      win(ctx, 6, 146, 244, 90);
      if (q) {
        var yy = 153;
        wrap(q.done ? (q.doneText || 'Done.') : q.text, 230).slice(0, 5).forEach(function (l) { text(ctx, l, 12, yy, q.done ? C.grey : C.tan); yy += 10; });
        if (!q.done && q.where) wrap('NEXT: ' + q.where, 230).slice(0, 2).forEach(function (l) { text(ctx, l, 12, yy + 2, C.green); yy += 10; });
        footer(ctx, q.done ? 'X: back' : j.pin === q.id ? 'E: unpin   X: back' : 'E: pin (a marker shows the way)   X: back', 226);
      }
    } else {
      var ls = []; (j.rumors || []).forEach(function (r) { ls = ls.concat(wrap('· ' + r, 232)); ls.push(''); });
      this.scroll = clamp(this.scroll, 0, Math.max(0, ls.length - 19));
      if (!ls.length) text(ctx, 'Nothing heard yet. Talk to people.', 12, 28, C.grey);
      ls.slice(this.scroll, this.scroll + 19).forEach(function (l, i) { text(ctx, l, 12, 28 + i * 10, C.tan); });
    }
  };

  // ------------------------------------------------------------------ OPTIONS (his: "Menu ring to sounds from the grid menu into options")
  // the grid's own rows (deep16/js/ui.js UI.opts; Griz, 10-06: "OPTIONS - doesn't include ai message speed or end turn asks (even if greyed for menu
  // uniformity)"): kept where the grid keeps them, localStorage deep16.opts, so a story fight reads them when it opens; a host holding the grid live
  // applies them at once (host.optsChanged). The volumes were one store already (js/audio.js ds8-audio)
  var OPT_KEY = 'deep16.opts', PACES = [1, 1.25, 1.5], ASKS = ['idle', 'always', 'never'], ASKW = { idle: 'IF IDLE', always: 'ALWAYS', never: 'NEVER' };
  function readOpts() { var o = { help: false, style: 'ring', autoEnd: true, pace: 1.25, confirmEnd: 'idle' }; try { var s = JSON.parse(window.localStorage.getItem(OPT_KEY) || 'null'); if (s) Object.keys(o).forEach(function (k) { if (k in s) o[k] = s[k]; }); } catch (e) { } return o; }
  function cyc(list, v, d) { var i = list.indexOf(v); return list[((i < 0 ? 0 : i) + d + list.length) % list.length]; }
  MN.gridRows = function (host) {
    var o = readOpts(), save = function () { try { window.localStorage.setItem(OPT_KEY, JSON.stringify(o)); } catch (e) { } if (host && host.optsChanged) host.optsChanged(o); };
    return [
      { label: 'MENU STYLE', get: function () { return o.style.toUpperCase(); }, step: function (d) { o.style = cyc(['ring', 'window'], o.style, d); save(); } },
      { label: 'AUTO END TURN', get: function () { return o.autoEnd ? 'ON' : 'OFF'; }, step: function () { o.autoEnd = !o.autoEnd; save(); } },
      { label: 'END TURN ASKS', get: function () { return ASKW[o.confirmEnd] || 'IF IDLE'; }, step: function (d) { o.confirmEnd = cyc(ASKS, o.confirmEnd, d); save(); } },
      { label: 'AI + MESSAGE TIME', get: function () { return o.pace + 'x'; }, step: function (d) { o.pace = cyc(PACES, o.pace, d); save(); } }
    ];
  };
  function OptionsPage(m) { this.m = m; this.grid = MN.gridRows(m.host); this.list = new List({ visible: 12 }); this.refresh(); }
  OptionsPage.prototype.rows = function () {
    var A = DS.audio || {}, extra = this.grid;
    return [{ label: 'MUSIC', right: Math.round((A.musicVol || 0) * 10), value: { k: 'music' } }, { label: 'SOUND', right: Math.round((A.sfxVol || 0) * 10), value: { k: 'sound' } }]
      .concat(extra.map(function (o) { return { label: o.label, right: o.get(), value: { k: 'opt', o: o } }; }))
      .concat([{ label: 'SUPPORT THE EXPANSION', value: { k: 'kofi' }, color: C.pink }, { label: 'DONE', value: { k: 'done' } }]);
  };
  OptionsPage.prototype.refresh = function () { this.list.set(this.rows()); };
  OptionsPage.prototype.step = function (v, d) {
    var A = DS.audio;
    if (v.k === 'music' && A) { A.musicVol = clamp(Math.round((A.musicVol + d * 0.1) * 10) / 10, 0, 1); if (A.setVolumes) A.setVolumes(); if (A.savePrefs) A.savePrefs(); }
    if (v.k === 'sound' && A) { A.sfxVol = clamp(Math.round((A.sfxVol + d * 0.1) * 10) / 10, 0, 1); if (A.setVolumes) A.setVolumes(); if (A.savePrefs) A.savePrefs(); }
    if (v.k === 'opt') v.o.step(d);
    this.refresh();
  };
  OptionsPage.prototype.update = function (k) {
    var cur = this.list.cur(), v = cur && cur.value;
    if (v && (v.k === 'music' || v.k === 'sound' || v.k === 'opt')) {
      if (k.repeat('left')) { this.step(v, -1); sfx('cursor'); return; }
      if (k.repeat('right')) { this.step(v, 1); sfx('cursor'); return; }
    }
    var r = this.list.update(k);
    if (r === 'back') { this.m.pop(); return; }
    if (r !== 'pick') return;
    if (v.k === 'kofi') this.m.act('kofi');
    else if (v.k === 'done') this.m.pop();
    else this.step(v, 1);
  };
  OptionsPage.prototype.draw = function (ctx, active) {
    var n = this.list.items.length;
    win(ctx, 28, 30, 200, 36 + n * 13);
    text(ctx, 'OPTIONS', 36, 37, C.gold);
    this.list.draw(ctx, 34, 51, 186, active, this.m.t, 13);
    footer(ctx, '◀ ▶ adjust  (rows 3-6: the 16-bit fights)', 52 + n * 13);
  };

  // ------------------------------------------------------------------ CREDITS: the game's, and the notes from the making that sat on STATUS (his "4 - I lean yes so hard")
  function CreditsPage(m) {
    this.m = m; this.y = 0;
    var lines = (DS.DATA.credits || []).slice(), notes = [];
    Object.keys(DS.DATA.heroes || {}).forEach(function (id) { var d = DS.DATA.heroes[id]; if (d && d.credit) notes.push({ t: d.name.toUpperCase(), c: C.gold }, { t: d.credit, c: C.grey, gap: 10 }); });
    if (notes.length) lines = lines.slice(0, Math.max(0, lines.length - 1)).concat([{ t: 'FROM THE MAKING', c: C.gold, gap: 8 }], notes, [{ t: '', gap: 8 }], lines.slice(-1));
    this.lines = lines;
  }
  CreditsPage.prototype.update = function (k) {
    if (k.repeat('down')) this.y += 6; if (k.repeat('up')) this.y = Math.max(0, this.y - 6);
    this.y += 0.25;
    if (k.pressed('b') || k.pressed('a')) { sfx('cancel'); this.m.pop(); }
    if (k.pressed('menu')) this.m.act('kofi');
  };
  CreditsPage.prototype.draw = function (ctx) {
    win(ctx, 2, 2, 252, 236);
    ctx.save(); ctx.beginPath(); ctx.rect(6, 6, 244, 210); ctx.clip();
    var y = 14 - this.y, total = 0;
    this.lines.forEach(function (l) {
      var ls = l.big ? [l.t] : wrap(l.t, 228);
      if (y > -24 && y < 220) ls.forEach(function (s, i) { if (l.big && DS.bigText) DS.bigText(ctx, s, 128, y, 2); else DS.textCenter(ctx, s, 128, y + i * 10, l.c || (l.big ? C.gold : C.white)); });
      var hh = l.big ? 24 : ls.length * 10 + (l.gap || 4); y += hh; total += hh;
    });
    ctx.restore();
    if (this.y > total) this.y = -200;
    footer(ctx, '▲▼ scroll   X back   M: Ko-fi', 224);
  };

  // ------------------------------------------------------------------ EXIT (his: "Exit 'to where' can happen where appropriate, or we can keep it just title")
  function ExitPage(m) { this.m = m; this.list = new List({ visible: 6 }); var ex = m.host.exits ? m.host.exits() : []; this.list.set(ex.map(function (e) { return { label: e.label, value: e }; }).concat([{ label: 'STAY', value: null }])); this.list.i = ex.length; }
  ExitPage.prototype.update = function (k) {
    var r = this.list.update(k), m = this.m;
    if (r === 'back') { m.pop(); return; }
    if (r !== 'pick') return;
    var e = this.list.cur().value;
    if (!e) { m.pop(); return; }
    m.act('exit', { to: e.value });
  };
  ExitPage.prototype.draw = function (ctx, active) {
    var n = this.list.items.length, cur = this.list.cur(), warn = cur && cur.value && cur.value.warn;
    win(ctx, 48, 60, 160, 26 + n * 12 + (warn ? 22 : 0));
    text(ctx, 'LEAVE FOR WHERE?', 56, 67, C.gold);
    this.list.draw(ctx, 54, 81, 146, active, this.m.t);
    if (warn) wrap(warn, 144).slice(0, 2).forEach(function (l, i) { text(ctx, l, 56, 85 + n * 12 + i * 10, C.red); });
  };
})();
