/* DEEP16 -- THE SECOND GAME's house (10-21, the lanes desk as the house seat; ..\handoff-2026-10-21-the-second-games-house.md). RULED 10-21, Griz, on the desk's
   eight leans: "2 sounds problematic - the rest sound good"; "we may have to make silverton before we finish the world map, but if we're calling from the pocket
   DM it'd overwrite the game ones". So: one save of its own in three slots (deep16.game.1..3), and nothing of the Pocket DM's read or written -- the four's sheets
   as the first game keeps them (the shape the grid takes a party in: a Battle's o.data, js/save.js SV.units), their pack, purse, flags and kill tally, THE
   WORLD's clock and hex, and where they stand. The title at deep16/ with no query: NEW GAME (the four as the first game starts them, at Silverton's west gate),
   CONTINUE, OPTIONS, the Pocket DM, the first game. A road fight takes the party and gives it back, wounds and all (H.afterFight); XP banks, and a level comes at
   the long rest (H.longRest: camp on THE WORLD, js/world.js W.camp). SAVE on THE WORLD (M: the party's menu) and in a town (the floor's M menu), never on a
   dungeon floor. Held till their floor is the second game's: the cradles, the drained stair's scenes. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, I = D.input, H = D.house = {};
  H.SLOTS = 3; H.V = 1; H.HEROES = ['barley', 'aurdin', 'vivian', 'lymen'];
  H.key = function (n) { return 'deep16.game.' + n; };
  H.cur = null; H.slot = 0; H.playing = false;
  H.read = function (n) { var d = D.store.get(H.key(n)); return d && d.v && Array.isArray(d.party) && d.party.length ? d : null; };
  function add(inv, id, n) { var s = inv.filter(function (x) { return x.id === id; })[0]; if (s) s.n += n; else if (n > 0) inv.push({ id: id, n: n }); for (var i = inv.length - 1; i >= 0; i--) if (inv[i].n <= 0) inv.splice(i, 1); }
  H.add = add;

  // NEW GAME: the four as the first game starts them (content/heroes.json: each at its own level and kit), the first game's purse and pack (content/config.json)
  // -- the first game starts one lead and hires the rest in Silverton; here the four walk in together (the story's own start is the second game's story pass)
  H.fresh = function () {
    var R = DS.R, C = DS.DATA.config || {};
    return { v: H.V, party: H.HEROES.map(function (id) { return R.makeHero(id); }), guests: [], inv: (C.startItems || []).map(function (s) { return { id: s[0], n: s[1] }; }),
      silver: C.startSilver || 10, flags: {}, kills: {}, world: null, at: { town: 'silverton', gate: 'west', sq: null, dir: null }, made: Date.now(), saved: 0 };
  };
  // a game begun or loaded: THE WORLD under it (its clock and hex the save's), and the town on top if that is where they stood
  H.begin = function (rec, slot) {
    H.cur = rec; H.slot = slot || 0; H.playing = true;
    DS.G = { flags: rec.flags }; // (the rules read the save's flags: js/rules.js R.cap)
    D.scenes.length = 0;
    D.push(D.world.make('?house'));
    if (rec.at && rec.at.town) H.toTown(rec.at.town, rec.at.gate || 'west', rec.at.sq, rec.at.dir);
  };
  H.siteOf = function (id) { var M = D.world.M(); return M ? M.sites.filter(function (s) { return s.id === id; })[0] || null : null; };
  // into a town by a gate (or onto the square it was saved on): the floor takes the save's party, pack and flags as the 8-bit's party walked in (js/roam.js R.make's emb)
  H.toTown = function (id, gate, sq, dir) {
    var W = D.world, dr = W.DOORS[id]; if (!dr) return;
    W.inDoor = { site: H.siteOf(id), gate: gate };
    H.cur.at = { town: id, gate: gate, sq: null, dir: null };
    D.push(D.roam.make('?roam=' + dr.roam + '&gate=' + gate, { save: H.cur, opts: sq ? { at8: sq.slice(), dir: dir || null } : {}, house: true }));
  };
  // the floor's party back into the save (js/roam.js R.handMsg: each sheet with its hurt, slots, uses and what lasts; the pack as the floor holds it, a lantern in hand
  // counted back; the flags, the kills, the purse)
  H.fromFloor = function (B) {
    if (!H.playing || !B || !B.roam || !D.roam.handMsg) return;
    var m = D.roam.handMsg(B, 'house', null, null), byId = {};
    m.party.forEach(function (p) { byId[p.id] = p.sheet; });
    H.cur.party = H.cur.party.map(function (h) { return byId[h.key || h.id] || h; });
    if (m.order && m.order.length) H.cur.party.sort(function (a, b) { return m.order.indexOf(a.key || a.id) - m.order.indexOf(b.key || b.id); });
    H.cur.inv = Object.keys(m.inv1 || {}).filter(function (id) { return m.inv1[id] > 0; }).map(function (id) { return { id: id, n: m.inv1[id] }; });
    H.cur.flags = m.flags || H.cur.flags; H.cur.kills = m.kills || H.cur.kills; if (m.silver != null) H.cur.silver = m.silver;
    DS.G = { flags: H.cur.flags };
  };
  // a fight's party back into the save: each hero's sheet as the fight left it (its hurt, slots, uses; what lasts -- js/roam.js R.LASTING), the pack as the fight left it
  H.takeBack = function (B) {
    var byId = {}, last = D.roam && D.roam.lasting ? D.roam.lasting : function () { return {}; };
    B.units.filter(function (u) { return u.side === 'party' && u.src && !u.summon && !u.familiar && !u.object; }).forEach(function (u) {
      var h = JSON.parse(JSON.stringify(u.src));
      h.hp = Math.max(0, Math.min(h.maxhp, u.hp)); h.ko = h.hp <= 0; h.slots = (u.slots || []).slice(); h.feats = JSON.parse(JSON.stringify(u.feats || {}));
      h.conds = Object.assign({}, h.conds || {}, last(u.conds)); if (!(u.conds && u.conds.mageArmor)) delete h.conds.mageArmor;
      byId[h.key || h.id] = h;
    });
    H.cur.party = H.cur.party.map(function (h) { return byId[h.key || h.id] || h; });
    var inv = JSON.parse(JSON.stringify(B.inv || [])).map(function (s) { return Array.isArray(s) ? { id: s[0], n: s[1] } : s; });
    (B.lights || []).forEach(function (l) { if (l.kind === 'lantern' && l.item && byId[l.by]) add(inv, l.item, 1); }); // (a lantern in a hand: the pack's still)
    H.cur.inv = inv.filter(function (s) { return s.n > 0; });
  };
  // the XP of the fallen, banked by those standing -- no level till the long rest (RULED 10-21, lean 3: "the rest sound good"); at the cap nothing banks (js/rules.js
  // R.gainXP's rule). Returns { each, line }
  H.bank = function (xp, standing) {
    var R = DS.R, cap = R.XP_LEVEL[R.cap()], each = standing.length ? Math.floor(xp / standing.length) : 0;
    standing.forEach(function (h) { h.xp = Math.min(cap, (h.xp || 0) + each); });
    return { each: each, line: each ? 'Each one standing gains ' + each + ' XP' + (standing.some(function (h) { return R.XP_LEVEL[h.lvl + 1] != null && h.xp >= R.XP_LEVEL[h.lvl + 1] && h.lvl < R.cap(); }) ? ' -- a level at the next long rest.' : '.') : '' };
  };
  H.xpOf = function (kind) {
    var id8 = D.id8 ? D.id8(kind) : kind, m = DS.DATA.monsters[id8], f = D.FOES && D.FOES[kind], cx = DS.R.CR_XP || {};
    return { m: m || null, xp: (m && m.xp) || (f && f.cr != null && cx[String(f.cr)]) || 0 };
  };
  // after a road fight (js/world.js World.fight): the party back, the fallen's XP banked, the spoils into the pack and the purse. A loss is the first game's game over:
  // the title, and the last save stands. Returns the lines to say, or null for a loss
  H.afterFight = function (B, res) {
    H.takeBack(B);
    if (res !== 'won' && res !== 'escaped' && res != null) { H.lost(); return null; }
    if (res !== 'won') return [];
    var R = DS.R, xp = 0, fell = [];
    B.units.forEach(function (u) { if (u.side !== 'foe' || u.summon || u.fled || u.left || !(u.dead || u.hp <= 0)) return; var x = H.xpOf(u.kind); xp += x.xp; if (x.m) { fell.push({ m: x.m, surrendered: !!(u.surrendered || u.yielded) }); R.tally(H.cur.kills, [D.id8 ? D.id8(u.kind) : u.kind]); } });
    var standing = H.cur.party.filter(function (h) { return h.hp > 0; }), lines = [], bk = H.bank(xp, standing);
    if (bk.line) lines.push(bk.line);
    if (fell.length) { var sp = R.spoils(fell, standing, { roll: function (e) { return D.roll(e).total; }, rng: D.rand }, function (id, n) { add(H.cur.inv, id, n); }); H.cur.silver += sp.silver; lines = lines.concat(sp.lines); }
    return lines;
  };
  H.lost = function () { H.playing = false; H.cur = null; D.scenes.length = 0; D.push(new Title({ lost: true })); };
  H.toTitle = function () { H.playing = false; H.cur = null; D.scenes.length = 0; D.push(new Title()); }; // (EXIT on a floor or in a fight: what is unsaved is left -- deep16/js/ui.js gridHost's exits)
  // the long rest (THE WORLD's camp; js/events.js EV.longRest, the first game's): Aid's and Mage Armor's hours over, each sheet whole again (js/rules.js R.refresh),
  // then the levels banked come (R.gainXP with nothing new: every level the XP reaches) and their choices on the one pick page over the scene
  H.longRest = function (scene) {
    if (!H.playing) return [];
    var R = DS.R, lines = [];
    DS.G = { flags: H.cur.flags };
    H.cur.party.forEach(function (h) { h.conds = h.conds || {}; if (h.conds.aid) { h.maxhp -= h.conds.aid; delete h.conds.aid; } delete h.conds.mageArmor; R.refresh(h, true); });
    H.cur.party.forEach(function (h) { lines = lines.concat(R.gainXP(h, 0)); });
    var who = H.cur.party.filter(function (h) { return R.picksDue(h); });
    if (who.length && scene) {
      if (DS.autoPicks || !D.ctx || !DS.MENU) who.forEach(R.autoPicks);
      else { D.sfx('levelup'); scene.pm = DS.MENU.openPicks({ party: function () { return who; }, close: function () { scene.pm = null; } }, who, { pages: true }, function () { scene.pm = null; }); }
    } else if (lines.length) D.sfx('levelup');
    return lines;
  };
  // SAVE: the game into a slot, from where they stand (the town's square, or the world's hex)
  H.saveTo = function (n) {
    if (!H.playing) return false;
    H.slot = n; H.cur.saved = Date.now(); H.cur.v = H.V;
    return D.store.set(H.key(n), H.cur);
  };
  H.where = function (rec) {
    var W = D.world, M = W.M(), at = rec.at || {}, s = at.town && H.siteOf(at.town);
    if (s) return s.name;
    var w = rec.world, e = M && w && w.at ? M.hex[W.K(w.at[0], w.at[1])] : null;
    return e ? M.terr[e.t].name : 'the road';
  };
  H.line = function (n, rec) {
    if (!rec) return { n: n, l: 'SLOT ' + n + '   -- empty --', r: '' };
    var lead = rec.party[0] || {}, d = rec.world && rec.world.t != null ? Math.floor(rec.world.t / 24) + 1 : 1, when = rec.saved ? new Date(rec.saved) : null;
    return { n: n, l: 'SLOT ' + n + '   ' + lead.name + ' L' + lead.lvl + '   ' + H.where(rec), r: 'day ' + d + (when ? '  ' + (when.getMonth() + 1) + '/' + when.getDate() + ' ' + ('0' + when.getHours()).slice(-2) + ':' + ('0' + when.getMinutes()).slice(-2) : '') };
  };

  // the party's menu on THE WORLD (M): the one menu over the save's own sheets and pack -- EQUIP, ITEMS, STATUS and SAVE (js/menu.js; the host as the Pocket DM's
  // camp hands one, its own state). A potion on the road; casting and skills out of a fight come with the field menu (the house lane's next piece)
  H.openMenu = function (scene) {
    var rec = H.cur, R = DS.R, figs = {};
    function figure(h, w, hh) { // (the grid's own figure in the panel and STATUS, as deep16/js/ui.js gridHost draws it; the sheet fetched the first time it is asked for)
      var lk = D.save.look ? D.save.look(h.id, null, h) : null, name = (lk && lk.sheet) || h.id + '_p0';
      if (!D.spr.has(name)) { if (D.spr.prefetch && !figs['?' + name]) { figs['?' + name] = 1; D.spr.prefetch([name]); } return null; }
      var k = name + ':' + w; if (figs[k]) return figs[k];
      var cv = document.createElement('canvas'); cv.width = w; cv.height = hh;
      D.spr.draw(cv.getContext('2d'), name, 'idle', 0, 0, w / 2, hh < 40 ? D.spr.drawnTop(name) + 2 : D.spr.portraitY(name, 0, hh), { frame: 0 });
      return (figs[k] = cv);
    }
    scene.pm = DS.MENU.open({
      party: function () { return rec.party; },
      walker: function (h) { return figure(h, 20, 32); }, portrait: function (h) { return figure(h, 32, 48); },
      guests: function () { return []; },
      pack: function () { return rec.inv.filter(function (s) { return s.n > 0 && DS.DATA.items[s.id]; }); },
      give: function (id, n) { add(rec.inv, id, n || 1); },
      take: function (id, n) { add(rec.inv, id, -(n || 1)); },
      info: function () { return { silver: rec.silver, place: H.where(rec), time: D.world.timeOfDay() }; },
      canSave: function () { return true; },
      run: function (kind, a, done) {
        var it = a && a.id ? DS.DATA.items[a.id] : null, h = a && a.h;
        if (kind === 'save') { scene.pm = null; D.push(new Slots('save')); }
        else if (kind === 'item' && it && it.use && it.use.effect === 'heal' && h) { if (h.hp <= 0) scene.say(h.name + ' is down: a kit first.'); else { var was = h.hp; h.hp = Math.min(h.maxhp, h.hp + D.roll(it.use.dice).total); add(rec.inv, a.id, -1); D.sfx('heal'); scene.say(h.name + ' drinks the ' + it.name + ': +' + (h.hp - was) + ' HP (' + h.hp + '/' + h.maxhp + ').'); } }
        else if (kind === 'item' && it && it.use && it.use.effect === 'revive' && h) { if (h.hp > 0) scene.say(h.name + ' is not down.'); else { h.hp = it.use.hp || 1; h.ko = false; add(rec.inv, a.id, -1); D.sfx('heal'); scene.say(h.name + ' is up (' + h.hp + ' HP).'); } }
        else scene.say('On the road that waits for the field menu (the house lane\'s next piece).');
        if (done) done();
      },
      close: function () { scene.pm = null; }
    });
  };

  // ---------------------------------------------------------------- SLOTS: three, to save into or load from
  function Slots(mode, done) { this.kind = 'houseslots'; this.mode = mode; this.done = done || null; this.i = Math.max(0, (H.slot || 1) - 1); this.msg = null; this.t = 0; this.opaque = false; }
  Slots.prototype.rows = function () { var out = []; for (var n = 1; n <= H.SLOTS; n++) out.push(H.line(n, H.read(n))); return out; };
  Slots.prototype.box = function () { var w = 300, h = 22 + H.SLOTS * 16 + 16, x = (D.W - w) / 2, y = (D.H - h) / 2; return { x: x, y: y, w: w, h: h }; };
  Slots.prototype.pick = function (i) {
    var n = i + 1, rec = H.read(n);
    if (this.mode === 'save') { var ok = H.saveTo(n); D.sfx(ok ? 'confirm' : 'error'); this.msg = ok ? 'Saved to slot ' + n + '.' : 'The save would not keep (the browser is full?).'; this.closeIn = ok ? 50 : 0; return; }
    if (!rec) { D.sfx('error'); this.msg = 'Slot ' + n + ' is empty.'; return; }
    D.sfx('confirm'); H.begin(rec, n);
  };
  Slots.prototype.update = function () {
    this.t++;
    if (this.closeIn) { if (--this.closeIn === 0) { D.pop(); if (this.done) this.done(); } return; }
    var m = I.mouse, b = this.box();
    if (I.repeat('up')) { this.i = (this.i + H.SLOTS - 1) % H.SLOTS; D.sfx('cursor'); }
    if (I.repeat('down')) { this.i = (this.i + 1) % H.SLOTS; D.sfx('cursor'); }
    if (m.inside) for (var k = 0; k < H.SLOTS; k++) { var ry = b.y + 20 + k * 16; if (m.x >= b.x && m.x < b.x + b.w && m.y >= ry - 2 && m.y < ry + 13) { if (m.moved) this.i = k; if (m.click) { this.i = k; this.pick(k); return; } } }
    if (I.pressed('a')) { this.pick(this.i); return; }
    if (I.pressed('b') || m.rclick) { D.sfx('cancel'); D.pop(); if (this.done) this.done(); }
  };
  Slots.prototype.draw = function (ctx) {
    var b = this.box(), rows = this.rows(), self = this;
    ctx.fillStyle = 'rgba(4,3,10,.55)'; ctx.fillRect(0, 0, D.W, D.H);
    D.win8(ctx, b.x, b.y, b.w, b.h);
    D.text(ctx, '{y}' + (this.mode === 'save' ? 'SAVE WHERE?' : 'CONTINUE FROM') + '{/}', b.x + 10, b.y + 7, D.WIN8.text);
    rows.forEach(function (r, k) {
      var y = b.y + 20 + k * 16, on = k === self.i;
      if (on) { ctx.fillStyle = D.WIN8.sel; ctx.fillRect(b.x + 4, y - 2, b.w - 8, 14); }
      D.text(ctx, (on ? '> ' : '  ') + r.l, b.x + 8, y, H.read(r.n) ? D.WIN8.text : '#9c9cb4');
      if (r.r) D.text(ctx, r.r, b.x + b.w - 8, y, '#c8d0e8', 'right');
    });
    if (this.msg) D.text(ctx, '{y}' + this.msg + '{/}', D.W / 2, b.y + b.h - 12, D.WIN8.text, 'center');
    D.hint(ctx, 'up/down choose · E ' + (this.mode === 'save' ? 'save here' : 'load') + ' · X back', D.W / 2, D.H - 12, '#9a96a8', 'center');
  };
  H.Slots = Slots;

  // ---------------------------------------------------------------- the title (deep16/ with no query: js/main.js)
  var ROWS = [['NEW GAME', 'new'], ['CONTINUE', 'load'], ['OPTIONS', 'options'], ['THE POCKET DM', 'pocket'], ['THE FIRST GAME', 'first']];
  function Title(o) { this.kind = 'housetitle'; this.opaque = true; this.t = 0; this.i = 0; this.pm = null; this.lost = !!(o && o.lost); this.stars = []; for (var k = 0; k < 90; k++) this.stars.push([D.rint(D.W), D.rint(150), D.rint(3)]); }
  Title.prototype.enter = function () { try { D.music('title'); } catch (e) { } H.playing = false; this.any = [1, 2, 3].some(function (n) { return !!H.read(n); }); if (!this.any && this.i === 1) this.i = 0; };
  Title.prototype.go = function (v) {
    var self = this;
    if (v === 'new') { D.sfx('confirm'); H.begin(H.fresh(), 0); }
    else if (v === 'load') { if (!this.any) { D.sfx('error'); return; } D.sfx('confirm'); D.push(new Slots('load')); }
    else if (v === 'options') { if (!DS.MENU || !DS.MENU.openOptions) return; D.sfx('confirm'); this.pm = DS.MENU.openOptions({ close: function () { self.pm = null; } }); }
    else if (v === 'pocket') location.href = '?pocket';
    else if (v === 'first') location.href = '../';
  };
  Title.prototype.update = function () {
    this.t++;
    if (this.pm) { this.pm.update(D.ui.menuKeys()); if (this.pm && this.pm.closed) this.pm = null; return; }
    var m = I.mouse;
    if (I.repeat('up')) { this.i = (this.i + ROWS.length - 1) % ROWS.length; D.sfx('cursor'); }
    if (I.repeat('down')) { this.i = (this.i + 1) % ROWS.length; D.sfx('cursor'); }
    if (m.inside) for (var k = 0; k < ROWS.length; k++) { var ry = 150 + k * 16; if (m.x >= D.W / 2 - 70 && m.x < D.W / 2 + 70 && m.y >= ry - 3 && m.y < ry + 12) { if (m.moved) this.i = k; if (m.click) { this.i = k; this.go(ROWS[k][1]); return; } } }
    if (I.pressed('a')) this.go(ROWS[this.i][1]);
  };
  Title.prototype.draw = function (ctx) {
    var g = ctx.createLinearGradient(0, 0, 0, D.H); g.addColorStop(0, '#05061a'); g.addColorStop(0.62, '#1b2240'); g.addColorStop(1, '#3a2a30'); ctx.fillStyle = g; ctx.fillRect(0, 0, D.W, D.H);
    var t = this.t; this.stars.forEach(function (s) { ctx.fillStyle = (t + s[0]) % (60 + s[2] * 20) < 4 ? '#ffffff' : s[2] ? '#8890c0' : '#c8d0f0'; ctx.fillRect(s[0], s[1], 1, 1); });
    ctx.fillStyle = '#0c0d18'; ctx.beginPath(); ctx.moveTo(0, D.H); ctx.lineTo(0, 205); ctx.lineTo(70, 182); ctx.lineTo(130, 198); ctx.lineTo(210, 170); ctx.lineTo(290, 192); ctx.lineTo(360, 176); ctx.lineTo(430, 196); ctx.lineTo(D.W, 186); ctx.lineTo(D.W, D.H); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(D.W / 2, 36); ctx.scale(4, 4); D.text(ctx, 'DRAGONSLEEP', 0, 0, '#f8d878', 'center'); ctx.restore();
    D.text(ctx, '16-BIT', D.W / 2, 82, '#c8d0e8', 'center');
    if (this.lost) D.text(ctx, '{r}The road took them. The last save stands.{/}', D.W / 2, 104, '#f8f8f8', 'center');
    var self = this;
    ROWS.forEach(function (r, k) {
      var y = 150 + k * 16, on = k === self.i, dim = r[1] === 'load' && !self.any;
      if (on) { ctx.fillStyle = 'rgba(38,32,106,.85)'; ctx.fillRect(D.W / 2 - 70, y - 3, 140, 14); }
      D.text(ctx, (on ? '> ' : '') + r[0], D.W / 2, y, dim ? '#6c6c84' : on ? '#f8d878' : '#f8f8f8', 'center');
    });
    D.hint(ctx, 'up/down choose · E go', D.W / 2, D.H - 12, '#9a96a8', 'center');
    if (this.pm) { ctx.fillStyle = 'rgba(4,3,10,.6)'; ctx.fillRect(0, 0, D.W, D.H); D.ui.drawMenu(ctx, this.pm); }
  };
  H.Title = Title;
})();
