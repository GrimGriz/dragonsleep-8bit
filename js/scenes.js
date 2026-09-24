/* DRAGONSLEEP — title, lead select, field menu, shops, inn, save slots, game over, credits. */
'use strict';
(function () {
  var DS = window.DS, R = DS.R, I = DS.input, W8 = DS.W8;
  var SAVE_KEY = 'ds8-save-';

  // ------------------------------------------------------------------ saves
  DS.saveGame = function (slot) {
    var G = DS.G;
    var data = JSON.parse(JSON.stringify({ v: G.v, lead: G.lead, party: G.party, inv: G.inv, silver: G.silver, flags: G.flags, renown: G.renown, map: G.map, x: G.x, y: G.y, dir: G.dir, steps: G.steps, time: G.time, kills: G.kills, hired: G.hired }));
    data.saved = Date.now();
    return DS.store.set(SAVE_KEY + slot, data);
  };
  DS.loadSlot = function (slot) { return DS.store.get(SAVE_KEY + slot); };
  DS.startFrom = function (data) {
    DS.G = data; DS.bindState(DS.G);
    DS.G.party.forEach(R.migrate);
    DS.clearScenes();
    var F = DS.field = new DS.Field();
    DS.push(F);
    F.load(data.map, data.x, data.y, data.dir);
    F.banner = 90;
  };
  function fmtTime(frames) { var s = Math.floor(frames / 60), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return h + ':' + ('0' + m).slice(-2); }
  DS.fmtTime = fmtTime;
  function slotItems(saving) {
    var out = [];
    for (var i = 1; i <= 3; i++) {
      var d = DS.loadSlot(i);
      if (d) {
        var lead = d.party[0];
        out.push({ label: 'SLOT ' + i + '  ' + lead.name + ' L' + lead.lvl + '  ' + (DS.DATA.maps[d.map] ? DS.DATA.maps[d.map].name : ''), right: fmtTime(d.time), value: i });
      } else out.push({ label: 'SLOT ' + i + '  — empty —', value: i, disabled: !saving });
    }
    return out;
  }

  // ------------------------------------------------------------------ Title
  function Title() { this.kind = 'title'; this.opaque = true; this.t = 0; this.stars = []; for (var i = 0; i < 70; i++) this.stars.push([DS.rint(256), DS.rint(120), DS.rint(3)]); this.menu = null; }
  DS.Title = Title;
  Title.prototype.enter = function () { DS.audio.play('title'); DS.fadeLevel = 0; this.buildMenu(); };
  Title.prototype.buildMenu = function () {
    var self = this, any = [1, 2, 3].some(function (i) { return !!DS.loadSlot(i); });
    this.menu = new DS.Menu({
      items: [{ label: 'NEW GAME', value: 'new' }, { label: 'CONTINUE', value: 'load', disabled: !any }, { label: 'CREDITS', value: 'credits' }, { label: '♥ SUPPORT THE EXPANSION', value: 'kofi', color: '#F8A4C0' }],
      x: 44, y: 146, w: 168, rowH: 12, cancelable: false,
      onSelect: function (it) {
        if (it.value === 'new') DS.push(new LeadSelect());
        if (it.value === 'load') DS.push(new SlotScene(false));
        if (it.value === 'credits') DS.push(new Credits());
        if (it.value === 'kofi') DS.openKofi();
      }
    });
  };
  Title.prototype.update = function () { this.t++; this.menu.update(); };
  Title.prototype.draw = function (ctx) {
    drawNightScene(ctx, this.stars, this.t);
    DS.bigText(ctx, 'DRAGONSLEEP', 128, 34, 3);
    DS.textCenter(ctx, 'SILVERTON · THE WARRENS · THE ROAD', 128, 70, '#C8D0E8');
    this.menu.draw(ctx);
    DS.textCenter(ctx, 'a world by GrimGriz', 128, 218, '#9C9C9C');
    DS.textCenter(ctx, 'SRD 5.1 rules · CC BY 4.0', 128, 229, '#6C6C84');
  };
  function drawNightScene(ctx, stars, t) {
    var g = ctx.createLinearGradient(0, 0, 0, 240); g.addColorStop(0, '#04061a'); g.addColorStop(0.55, '#141a44'); g.addColorStop(1, '#1a1030');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 240);
    stars.forEach(function (s, i) { ctx.fillStyle = ((t >> 4) + i) % 7 === 0 ? '#F8F8F8' : ['#6C6C84', '#9C9C9C', '#C8D0E8'][s[2]]; ctx.fillRect(s[0], s[1], 1, 1); });
    // the chain
    ctx.fillStyle = '#0c0c1c';
    ctx.beginPath(); ctx.moveTo(0, 150);
    [[20, 118], [44, 132], [70, 96], [96, 124], [118, 88], [138, 112], [160, 84], [186, 120], [210, 100], [236, 126], [256, 110]].forEach(function (p) { ctx.lineTo(p[0], p[1]); });
    ctx.lineTo(256, 240); ctx.lineTo(0, 240); ctx.fill();
    ctx.fillStyle = '#e8e8f4'; [[118, 88], [160, 84], [70, 96]].forEach(function (p) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] - 5, p[1] + 7); ctx.lineTo(p[0] + 5, p[1] + 7); ctx.fill(); });
    // the Edifice facade and its falls
    ctx.fillStyle = '#20202e'; ctx.fillRect(92, 118, 72, 30);
    ctx.fillStyle = '#2c2c3e'; for (var x = 96; x < 160; x += 12) ctx.fillRect(x, 124, 6, 24);
    ctx.fillStyle = '#3CBCFC'; ctx.fillRect(126, 96, 4, 52);
    ctx.fillStyle = '#A4E4FC'; for (var k = 0; k < 6; k++) ctx.fillRect(127, 96 + ((t / 2 + k * 9) % 52), 1, 3);
    // town lights
    ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 148, 256, 92);
    for (var i = 0; i < 28; i++) { var lx = (i * 37) % 250 + 3, ly = 150 + (i * 13) % 8; ctx.fillStyle = (i + (t >> 5)) % 9 === 0 ? '#FCA044' : '#F8D878'; ctx.fillRect(lx, ly, 1, 1); }
  }
  // big title text: glyphs scaled with a silver sheen
  var bigCache = {};
  DS.bigText = function (ctx, str, xc, y, s) {
    var key = str + '|' + s, c = bigCache[key];
    if (!c) {
      var w = DS.textWidth(str), t = document.createElement('canvas');
      t.width = w + 1; t.height = 8;
      DS.text(t.getContext('2d'), str, 0, 0, '#F8F8F8');
      c = document.createElement('canvas'); c.width = (w + 1) * s + s; c.height = 8 * s + s;
      var x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      // silver: white crown, cool steel below, a dark drop shadow
      var body = document.createElement('canvas'); body.width = t.width * s; body.height = t.height * s;
      var bx = body.getContext('2d'); bx.imageSmoothingEnabled = false;
      bx.drawImage(t, 0, 0, body.width, body.height);
      bx.globalCompositeOperation = 'source-atop';
      bx.fillStyle = '#C8D0F0'; bx.fillRect(0, Math.round(body.height * 0.45), body.width, body.height);
      bx.fillStyle = '#8890C0'; bx.fillRect(0, Math.round(body.height * 0.75), body.width, body.height);
      var sh = document.createElement('canvas'); sh.width = body.width; sh.height = body.height;
      var sx = sh.getContext('2d'); sx.drawImage(body, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#101018'; sx.fillRect(0, 0, sh.width, sh.height);
      x.drawImage(sh, s, s); x.drawImage(body, 0, 0);
      c = bigCache[key] = c;
    }
    ctx.drawImage(c, Math.round(xc - c.width / 2), y);
  };
  DS.openKofi = function () {
    try { window.open(DS.DATA.config.kofi, '_blank', 'noopener'); } catch (e) { }
  };

  // ------------------------------------------------------------------ Lead select
  function LeadSelect() { this.kind = 'lead'; this.opaque = true; this.i = 0; this.ids = ['barley', 'aurdin', 'vivian', 'lymen']; }
  LeadSelect.prototype.update = function () {
    var self = this;
    if (I.repeat('right') || I.repeat('down')) { this.i = (this.i + 1) % 4; DS.audio.sfx('cursor'); }
    if (I.repeat('left') || I.repeat('up')) { this.i = (this.i + 3) % 4; DS.audio.sfx('cursor'); }
    if (I.pressed('b')) { DS.audio.sfx('cancel'); DS.pop(this); return; }
    if (I.pressed('a')) {
      DS.audio.sfx('confirm');
      var id = this.ids[this.i], d = DS.DATA.heroes[id];
      DS.run(function* () {
        var ok = yield DS.ask('Begin as ' + d.name + '? The other three can be found in play, and hired.', ['BEGIN', 'BACK']);
        if (ok !== 0) return;
        DS.newGame(id); DS.bindState(DS.G);
        yield DS.fade(1, 30);
        DS.clearScenes();
        var F = DS.field = new DS.Field();
        DS.push(F);
        var st = DS.DATA.config.start;
        F.load(st.map, st.x, st.y, st.dir);
        yield DS.fade(0, 30);
        yield* DS.EV.intro(id);
      });
    }
  };
  LeadSelect.prototype.draw = function (ctx) {
    ctx.fillStyle = '#0a0c24'; ctx.fillRect(0, 0, 256, 240);
    DS.textCenter(ctx, 'CHOOSE WHO YOU ARE', 128, 8, '#F8D878');
    var self = this;
    this.ids.forEach(function (id, i) {
      var d = DS.DATA.heroes[id], x = 8 + i * 62, sel = i === self.i;
      DS.win(ctx, x, 20, 58, 70, sel ? '#26206a' : null);
      var spr = DS.fighter(DS.LOOKS[d.look], d.weaponArt);
      ctx.drawImage(spr[sel && ((DS.frame >> 4) & 1) ? 'act' : 'stand'], x + 13, 28, 32, 48);
      DS.textCenter(ctx, d.name, x + 29, 78, sel ? '#F8D878' : '#F8F8F8');
    });
    var d = DS.DATA.heroes[this.ids[this.i]], h = R.makeHero(this.ids[this.i]);
    DS.win(ctx, 4, 94, 248, 132);
    DS.text(ctx, d.fullName || d.name, 12, 102, '#F8D878');
    DS.text(ctx, d.classLine, 12, 114, '#C8D0E8');
    var ab = R.ABIL.map(function (a) { return a.toUpperCase() + ' ' + h.abil[a]; });
    DS.text(ctx, ab.slice(0, 3).join('  '), 12, 128); DS.text(ctx, ab.slice(3).join('  '), 12, 139);
    DS.text(ctx, 'HP ' + h.maxhp + '   AC ' + R.ac(h) + '   ' + R.weaponOf(h).name, 12, 152, '#F8F8F8');
    var lines = DS.wrap(d.blurb, 232);
    for (var k = 0; k < Math.min(6, lines.length); k++) DS.text(ctx, lines[k], 12, 166 + k * 11, '#E0C8A0');
    DS.textCenter(ctx, '◀ ▶ choose   Z/ENTER confirm   X back', 128, 230, '#6C6C84');
  };

  // ------------------------------------------------------------------ save / load slots
  function SlotScene(saving) {
    var self = this;
    this.kind = 'slots'; this.saving = saving;
    this.menu = new DS.Menu({
      items: slotItems(saving), x: 16, y: 80, w: 224, rowH: 14, title: saving ? 'SAVE WHERE?' : 'CONTINUE FROM',
      onSelect: function (it) {
        if (saving) {
          var ok = DS.saveGame(it.value);
          DS.audio.sfx(ok ? 'save' : 'error');
          self.msg = ok ? 'Saved to slot ' + it.value + '.' : 'Could not save (storage blocked).';
          self.menu.items = slotItems(true); self.done = 50;
        } else {
          var d = DS.loadSlot(it.value);
          if (d) DS.startFrom(d);
        }
      },
      onCancel: function () { DS.pop(self); }
    });
  }
  SlotScene.prototype.update = function () { if (this.done > 0) { if (--this.done === 0) DS.pop(this); return; } this.menu.update(); };
  SlotScene.prototype.draw = function (ctx) { this.menu.draw(ctx); if (this.msg) { DS.win(ctx, 40, 150, 176, 20); DS.textCenter(ctx, this.msg, 128, 156, '#F8D878'); } };
  DS.SlotScene = SlotScene;

  // ------------------------------------------------------------------ Field menu
  function FieldMenu() {
    var self = this;
    this.kind = 'fieldmenu';
    var canSave = DS.field && DS.field.map && DS.field.map.src.save !== false;
    this.menu = new DS.Menu({
      items: [
        { label: 'ITEM', value: 'item' }, { label: 'MAGIC', value: 'magic' }, { label: 'SKILL', value: 'skill' }, { label: 'EQUIP', value: 'equip' },
        { label: 'STATUS', value: 'status' }, { label: 'ORDER', value: 'order', disabled: DS.G.party.length < 2 }, { label: 'JOURNAL', value: 'journal' },
        { label: 'SAVE', value: 'save', disabled: !canSave }, { label: 'OPTIONS', value: 'options' }, { label: 'QUIT', value: 'quit' }
      ],
      x: 184, y: 4, w: 70, rowH: 12, pad: 7,
      onSelect: function (it) { DS.run(function* () { self.menu.active = false; yield* self.pick(it.value); self.menu.active = true; }); },
      onCancel: function () { DS.pop(self); }
    });
  }
  DS.FieldMenu = FieldMenu;
  FieldMenu.prototype.update = function () { this.menu.update(); };
  FieldMenu.prototype.draw = function (ctx) {
    var G = DS.G;
    DS.win(ctx, 2, 4, 180, 170);
    G.party.forEach(function (h, i) {
      var y = 10 + i * 40, spr = DS.walker(DS.LOOKS[h.look]);
      ctx.drawImage(spr.down[0], 10, y + 4);
      DS.text(ctx, h.name, 32, y + 2, '#F8D878');
      DS.text(ctx, R.CLASSES[h.cls].name + ' ' + h.lvl, 96, y + 2, '#C8D0E8');
      var col = h.ko ? '#9C9C9C' : h.hp < h.maxhp / 4 ? '#F85838' : '#F8F8F8';
      DS.text(ctx, (h.ko ? 'KO  ' : 'HP ') + h.hp + '/' + h.maxhp, 32, y + 13, col);
      DS.bar(ctx, 32, y + 22, 80, h.hp / h.maxhp, h.ko ? '#9C9C9C' : '#58D854');
      if (h.slotsMax && h.slotsMax.length) DS.text(ctx, 'Slots ' + h.slots.map(function (n, k) { return n + '/' + h.slotsMax[k]; }).join(' '), 96, y + 13, '#B8B8F8');
      var nx = R.nextXP(h); DS.text(ctx, nx ? 'Next ' + (nx - h.xp) : 'MAX LEVEL', 120, y + 22, '#6C6C84');
    });
    DS.win(ctx, 2, 176, 180, 60);
    DS.text(ctx, '◆ ' + G.silver + ' sp', 12, 184, '#F8F8F8');
    DS.text(ctx, '★ Renown ' + G.renown, 96, 184, '#F8D878');
    DS.text(ctx, DS.field && DS.field.map ? DS.field.map.name : '', 12, 198, '#C8D0E8');
    DS.text(ctx, 'Time ' + fmtTime(G.time), 12, 210, '#9C9C9C');
    DS.text(ctx, 'Steps ' + G.steps, 96, 210, '#9C9C9C');
    var pq = DS.pinnedQuest && DS.pinnedQuest();
    DS.text(ctx, pq ? '◆ ' + pq.name : 'Pin a quest in JOURNAL', 12, 222, pq ? '#F8D878' : '#6C6C84');
    this.menu.draw(ctx);
  };
  function pickHero(title, filter) {
    var items = DS.G.party.map(function (h) { return { label: h.name, right: (h.ko ? 'KO ' : '') + h.hp + '/' + h.maxhp, value: h, disabled: filter ? !filter(h) : false }; });
    return DS.choose({ items: items, x: 60, y: 60, w: 136, title: title, rowH: 12 });
  }
  FieldMenu.prototype.pick = function* (what) {
    var G = DS.G;
    if (what === 'item') {
      while (true) {
        var items = G.inv.map(function (s) { var it = DS.DATA.items[s.id]; return { label: it.name, right: 'x' + s.n, value: s.id, color: it.kind === 'key' ? '#F8D878' : null }; });
        if (!items.length) { yield DS.say('The pack is empty.'); return; }
        var id = yield DS.choose({ items: items, x: 20, y: 20, w: 216, visible: 12, title: 'ITEMS', drawExtra: descBox });
        if (!id) return;
        var it = DS.DATA.items[id];
        if (it.use && it.use.field) {
          var tgtF = it.use.target === 'revive' ? function (h) { return h.ko; } : it.use.target === 'party' ? null : function (h) { return !h.ko; };
          if (it.use.target === 'party') { yield* DS.EV.useFieldItem(id, null); continue; }
          var h = yield pickHero('USE ON WHOM?', tgtF);
          if (!h) continue;
          yield* DS.EV.useFieldItem(id, h);
        } else if (it.kind === 'weapon' || it.kind === 'armor' || it.kind === 'shield' || it.kind === 'ring') {
          yield DS.say(it.name + ': ' + (it.desc || '') + ' Equip it from EQUIP.');
        } else yield DS.say(it.name + ': ' + (it.desc || 'Nothing to do with it here.'));
      }
    }
    if (what === 'magic') {
      var casters = G.party.filter(function (h) { return !h.ko && R.spellList(h, 'field').length; });
      if (!casters.length) { yield DS.say('No one can cast anything useful here.'); return; }
      var c = casters.length === 1 ? casters[0] : yield pickHero('WHO CASTS?', function (h) { return !h.ko && R.spellList(h, 'field').length; });
      if (!c) return;
      var list = R.spellList(c, 'field').map(function (sp) { var lv = sp.level ? R.lowestSlot(c, sp.level) : 0; return { label: sp.name, right: sp.level ? 'L' + (lv || sp.level) : '—', value: sp, disabled: sp.level > 0 && !lv }; });
      var sp = yield DS.choose({ items: list, x: 30, y: 40, w: 196, title: c.name + '  slots ' + (c.slots || []).join('/'), drawExtra: descBoxSpell });
      if (!sp) return;
      yield* DS.EV.fieldCast(c, sp);
    }
    if (what === 'skill') {
      var opts = [];
      G.party.forEach(function (h) {
        if (h.ko) return;
        if (h.cls === 'paladin' && h.feats.lay > 0) opts.push({ label: h.name + ': LAY ON HANDS', right: h.feats.lay, value: { h: h, s: 'lay' } });
        if (h.cls === 'wizard' && h.feats.arcaneRecovery) opts.push({ label: h.name + ': ARCANE RECOVERY', value: { h: h, s: 'arcane' } });
        if (h.cls === 'fighter' && h.feats.secondWind) opts.push({ label: h.name + ': SECOND WIND', value: { h: h, s: 'wind' } });
      });
      if (!opts.length) { yield DS.say('Nothing to use right now.'); return; }
      var s = yield DS.choose({ items: opts, x: 20, y: 60, w: 216, title: 'SKILLS' });
      if (!s) return;
      yield* DS.EV.fieldSkill(s.h, s.s);
    }
    if (what === 'equip') { var he = G.party.length === 1 ? G.party[0] : yield pickHero('EQUIP WHOM?'); if (he) yield* equipHero(he); }
    if (what === 'status') { var hs = G.party.length === 1 ? G.party[0] : yield pickHero('WHOSE STATUS?'); if (hs) yield W8.scene(new StatusScene(hs)); }
    if (what === 'order') {
      var a = yield pickHero('MOVE WHOM?'); if (!a) return;
      var b = yield pickHero('SWAP WITH?'); if (!b || a === b) return;
      var ia = G.party.indexOf(a), ib = G.party.indexOf(b); G.party[ia] = b; G.party[ib] = a;
      DS.audio.sfx('confirm');
    }
    if (what === 'journal') yield W8.scene(new Journal());
    if (what === 'save') yield W8.scene(new SlotScene(true));
    if (what === 'options') yield W8.scene(new Options());
    if (what === 'quit') {
      var q = yield DS.ask('Return to the title? Unsaved progress is lost.', ['STAY', 'QUIT']);
      if (q === 1) { DS.clearScenes(); DS.push(new Title()); }
    }
  };
  function descBox(ctx, menu) {
    var it = menu.current() && DS.DATA.items[menu.current().value];
    if (!it) return;
    DS.win(ctx, 4, 196, 248, 40);
    var ln = DS.wrap(it.desc || '', 236);
    for (var i = 0; i < Math.min(3, ln.length); i++) DS.text(ctx, ln[i], 10, 203 + i * 10, '#E0C8A0');
  }
  function descBoxSpell(ctx, menu) {
    var sp = menu.current() && menu.current().value;
    if (!sp) return;
    DS.win(ctx, 4, 196, 248, 40);
    var ln = DS.wrap(sp.desc || '', 236);
    for (var i = 0; i < Math.min(3, ln.length); i++) DS.text(ctx, ln[i], 10, 203 + i * 10, '#E0C8A0');
  }
  function* equipHero(h) {
    var G = DS.G;
    while (true) {
      var slots = [['weapon', 'WEAPON'], ['armor', 'ARMOR'], ['shield', 'SHIELD'], ['ring', 'RING']];
      var items = slots.map(function (s) { var it = R.item(h.equip[s[0]]); return { label: s[1], right: it ? it.name : '—', value: s[0] }; });
      var slot = yield DS.choose({
        items: items, x: 20, y: 30, w: 216, title: h.name + '   AC ' + R.ac(h) + '   ATK ' + DS.sgn(R.attackBonus(h)) + ' ' + dmgText(h),
        drawExtra: function (ctx) { DS.win(ctx, 20, 100, 216, 30); DS.text(ctx, 'Proficient: ' + R.CLASSES[h.cls].armor.join(', ') + (R.CLASSES[h.cls].armor.length ? '' : 'no armor'), 28, 108, '#9C9C9C'); DS.text(ctx, 'Weapons: ' + R.CLASSES[h.cls].weapons.join(', '), 28, 119, '#9C9C9C'); }
      });
      if (!slot) return;
      var cands = G.inv.filter(function (s) { var it = DS.DATA.items[s.id]; return it && it.kind === slot && R.canEquip(h, it); })
        .map(function (s) { var it = DS.DATA.items[s.id]; return { label: it.name, right: compare(h, slot, it), value: s.id }; });
      if (h.equip[slot]) cands.unshift({ label: '(remove)', value: '__none' });
      if (!cands.length) { yield DS.say('Nothing in the pack ' + h.name + ' can use there.'); continue; }
      var pick = yield DS.choose({ items: cands, x: 30, y: 60, w: 196, visible: 8, title: 'EQUIP ' + slot.toUpperCase(), drawExtra: descBox });
      if (!pick) continue;
      if (slot === 'shield' && pick !== '__none') {
        var w = R.item(h.equip.weapon);
        if (w && (w.weapon.props || []).indexOf('two-handed') >= 0) { yield DS.say(w.name + ' needs both hands. No shield with it.'); continue; }
      }
      if (slot === 'weapon' && pick !== '__none') {
        var nw = DS.DATA.items[pick];
        if ((nw.weapon.props || []).indexOf('two-handed') >= 0 && h.equip.shield) { G.give(h.equip.shield, 1); h.equip.shield = null; }
      }
      if (h.equip[slot]) G.give(h.equip[slot], 1);
      h.equip[slot] = null;
      if (pick !== '__none') { G.take(pick, 1); h.equip[slot] = pick; }
      DS.audio.sfx('confirm');
    }
  }
  function dmgText(h) { var d = R.damageExpr(h); return (d.dice === '0' ? '' : d.dice) + (d.mod ? DS.sgn(d.mod) : '') + ''; }
  function compare(h, slot, it) {
    if (slot === 'weapon') { var cur = R.item(h.equip.weapon); var save = h.equip.weapon; h.equip.weapon = it.id; var a = R.attackBonus(h), d = dmgText(h); h.equip.weapon = save; return DS.sgn(a) + ' ' + d; }
    if (slot === 'armor' || slot === 'shield' || slot === 'ring') { var s2 = h.equip[slot]; var before = R.ac(h); h.equip[slot] = it.id; var after = R.ac(h); h.equip[slot] = s2; return 'AC ' + after + (after > before ? ' ▲' : after < before ? ' ▼' : ''); }
    return '';
  }
  DS.equipCompare = compare;
  // +1 better, -1 worse, 0 same: average weapon damage, or AC
  function better(h, it) {
    var slot = it.kind, save = h.equip[slot], before, after;
    function score() {
      if (slot === 'weapon') { var d = R.damageExpr(h); return (d.dice === '0' ? 0 : DS.avgDice(d.dice)) + d.mod + R.attackBonus(h) * 0.5; }
      return R.ac(h);
    }
    before = score(); h.equip[slot] = it.id; after = score(); h.equip[slot] = save;
    return after > before ? 1 : after < before ? -1 : 0;
  }

  // ------------------------------------------------------------------ Status
  function StatusScene(h) { this.kind = 'status'; this.h = h; }
  StatusScene.prototype.update = function () { if (I.pressed('a') || I.pressed('b')) { DS.audio.sfx('cancel'); DS.pop(this); } };
  StatusScene.prototype.draw = function (ctx) {
    var h = this.h, c = R.CLASSES[h.cls], d = DS.DATA.heroes[h.id];
    DS.win(ctx, 2, 2, 252, 236);
    var spr = DS.fighter(DS.LOOKS[h.look], h.weapon);
    ctx.drawImage(spr.stand, 12, 12, 32, 48);
    DS.text(ctx, h.name, 52, 12, '#F8D878');
    DS.text(ctx, c.name + ' ' + h.lvl + (h.subclass ? ' · ' + h.subclass : ''), 52, 24, '#C8D0E8');
    DS.text(ctx, d.race + ' · ' + d.background, 52, 35, '#9C9C9C');
    var nx = R.nextXP(h);
    DS.text(ctx, 'XP ' + h.xp + (nx ? '  next ' + nx : '  (cap)'), 52, 47);
    DS.text(ctx, 'HP ' + h.hp + '/' + h.maxhp + '   AC ' + R.ac(h) + '   PROF +' + R.prof(h.lvl), 12, 66);
    R.ABIL.forEach(function (a, i) {
      var x = 12 + (i % 3) * 80, y = 80 + Math.floor(i / 3) * 12;
      var sv = h.saveProf.indexOf(a) >= 0;
      DS.text(ctx, a.toUpperCase() + ' ' + h.abil[a] + ' (' + DS.sgn(DS.mod(h.abil[a])) + ')' + (sv ? '*' : ''), x, y, sv ? '#F8F8F8' : '#C8D0E8');
    });
    var w = R.weaponOf(h), dx = R.damageExpr(h, w);
    DS.text(ctx, 'WEAPON ' + w.name + '  ' + DS.sgn(R.attackBonus(h, w)) + ' to hit, ' + (dx.dice === '0' ? '' : dx.dice) + DS.sgn(dx.mod) + ' ' + dx.type, 12, 108);
    ['armor', 'shield', 'ring'].forEach(function (s, i) { var it = R.item(h.equip[s]); DS.text(ctx, s.toUpperCase() + ' ' + (it ? it.name : '—'), 12 + (i % 3) * 80, 120, '#C8D0E8'); });
    var y = 134;
    if (c.cast) { DS.text(ctx, 'SPELL DC ' + R.spellDC(h) + '  ATTACK ' + DS.sgn(R.spellAtk(h)) + '  SLOTS ' + (h.slots || []).map(function (n, k) { return n + '/' + h.slotsMax[k]; }).join(' '), 12, y, '#B8B8F8'); y += 12; }
    var sp = h.known.map(function (id) { return DS.DATA.spells[id] ? DS.DATA.spells[id].name : id; });
    if (sp.length) { DS.wrap('Spells: ' + sp.join(', '), 234).slice(0, 3).forEach(function (l) { DS.text(ctx, l, 12, y, '#9C9C9C'); y += 10; }); y += 2; }
    var feats = (d.featText || []).filter(function (f) { return (!f.lvl || f.lvl <= h.lvl) && (!f.sub || f.sub === h.subclass); }).map(function (f) { return f.t; });
    if (h.cls === 'rogue') feats.unshift('Sneak Attack ' + R.sneakDice(h.lvl));
    if (h.cls === 'paladin') feats.push('Lay on Hands pool ' + (h.feats.lay || 0));
    DS.wrap('Features: ' + feats.join(' · '), 234).slice(0, 5).forEach(function (l) { DS.text(ctx, l, 12, y, '#E0C8A0'); y += 10; });
    if (d.note) DS.wrap(d.note, 234).slice(0, 3).forEach(function (l) { DS.text(ctx, l, 12, Math.max(y + 2, 200), '#6C6C84'); y += 10; });
  };

  // ------------------------------------------------------------------ Journal
  // Journal: the quests (pick one and pin it: a marker then shows the way), and the talk you've heard
  function Journal() {
    this.kind = 'journal'; this.page = 0; this.i = 0; this.scroll = 0;
    var pin = DS.G.flags.pin, list = this.quests();
    for (var k = 0; k < list.length; k++) if (list[k].id === pin) this.i = k;
  }
  Journal.prototype.quests = function () {
    // open quests first, finished ones after
    var all = (DS.DATA.quests || []).filter(function (q) { return DS.cond(q.show); });
    return all.filter(function (q) { return !DS.cond(q.done); }).concat(all.filter(function (q) { return DS.cond(q.done); }));
  };
  Journal.prototype.update = function () {
    var G = DS.G, list = this.quests();
    if (I.pressed('b')) { DS.audio.sfx('cancel'); DS.pop(this); return; }
    if (I.pressed('left') || I.pressed('right')) { this.page ^= 1; DS.audio.sfx('cursor'); }
    if (this.page || !list.length) { if (I.pressed('a')) { DS.audio.sfx('cancel'); DS.pop(this); } return; }
    if (I.repeat('down')) { this.i = (this.i + 1) % list.length; DS.audio.sfx('cursor'); }
    if (I.repeat('up')) { this.i = (this.i - 1 + list.length) % list.length; DS.audio.sfx('cursor'); }
    if (this.i < this.scroll) this.scroll = this.i;
    if (this.i >= this.scroll + 10) this.scroll = this.i - 9;
    if (I.pressed('a')) {
      var q = list[this.i];
      if (DS.cond(q.done)) { DS.audio.sfx('error'); return; }
      if (G.flags.pin === q.id) { delete G.flags.pin; DS.audio.sfx('cancel'); }
      else { G.flags.pin = q.id; DS.audio.sfx('confirm'); }
    }
  };
  Journal.prototype.draw = function (ctx) {
    var G = DS.G;
    DS.win(ctx, 2, 2, 252, 236);
    DS.text(ctx, this.page ? 'THE BOARD & THE TALK' : 'THE LOCAL HERO', 12, 10, '#F8D878');
    DS.textRight(ctx, '◀ ▶', 244, 10, '#6C6C84');
    var y = 26, self = this;
    if (!this.page) {
      DS.text(ctx, '★ Renown: ' + G.renown + '   ' + (DS.DATA.config.renownTitles[Math.min(G.renown, DS.DATA.config.renownTitles.length - 1)]), 12, y, '#F8F8F8'); y += 14;
      var list = this.quests();
      list.slice(this.scroll, this.scroll + 10).forEach(function (q, k) {
        var idx = k + self.scroll, done = DS.cond(q.done), pinned = G.flags.pin === q.id;
        if (idx === self.i) DS.cursor(ctx, 10, y, false);
        DS.text(ctx, (done ? '★ ' : pinned ? '◆ ' : '  ') + q.name, 18, y, done ? '#6C6C84' : pinned ? '#F8D878' : '#F8F8F8');
        if (pinned) DS.textRight(ctx, 'PINNED', 244, y, '#F8D878');
        y += 11;
      });
      if (list.length > 10) DS.textRight(ctx, (this.scroll > 0 ? '▲' : ' ') + (this.scroll + 10 < list.length ? '▼' : ' '), 244, 26, '#C8D0E8');
      var q = list[this.i];
      DS.win(ctx, 6, 150, 244, 84);
      if (q) {
        var done = DS.cond(q.done), step = !done && DS.questStep(q), yy = 157;
        DS.wrap(done ? (q.doneText || 'Done.') : q.text, 230).slice(0, 4).forEach(function (l) { DS.text(ctx, l, 12, yy, done ? '#9C9C9C' : '#E0C8A0'); yy += 10; });
        if (step && step.where) DS.wrap('NEXT: ' + step.where, 230).slice(0, 2).forEach(function (l) { DS.text(ctx, l, 12, yy + 2, '#B8F8B8'); yy += 10; });
        DS.textCenter(ctx, done ? 'X: close' : G.flags.pin === q.id ? 'Z: unpin   X: close' : 'Z: pin (a marker shows the way)  X: close', 128, 224, '#6C6C84');
      }
    } else {
      (DS.DATA.rumors || []).filter(function (r) { return G.flags['heard:' + r.id]; }).slice(-14).forEach(function (r) {
        DS.wrap('· ' + r.t, 232).forEach(function (l) { if (y < 228) DS.text(ctx, l, 12, y, '#E0C8A0'); y += 10; });
        y += 2;
      });
      if (y === 26) DS.text(ctx, 'Nothing heard yet. Talk to people.', 12, y, '#9C9C9C');
    }
  };

  // ------------------------------------------------------------------ Options
  function Options() {
    var self = this;
    this.kind = 'options';
    this.menu = new DS.Menu({ items: this.items(), x: 40, y: 70, w: 176, rowH: 14, title: 'OPTIONS', onSelect: function (it) { self.act(it.value, 1); }, onCancel: function () { DS.pop(self); } });
  }
  Options.prototype.items = function () {
    var A = DS.audio;
    return [{ label: 'MUSIC', right: Math.round(A.musicVol * 10), value: 'm' }, { label: 'SOUND', right: Math.round(A.sfxVol * 10), value: 's' }, { label: 'SUPPORT THE EXPANSION', value: 'kofi' }, { label: 'DONE', value: 'done' }];
  };
  Options.prototype.act = function (v, d) {
    var A = DS.audio;
    if (v === 'm') A.musicVol = DS.clamp(Math.round((A.musicVol + d * 0.1) * 10) / 10, 0, 1);
    if (v === 's') A.sfxVol = DS.clamp(Math.round((A.sfxVol + d * 0.1) * 10) / 10, 0, 1);
    if (v === 'm' || v === 's') { if ((v === 'm' && A.musicVol === 0 && d > 0) || (v === 's' && A.sfxVol === 0 && d > 0)) { } A.setVolumes(); if (d > 0 && ((v === 'm' && A.musicVol >= 1) || (v === 's' && A.sfxVol >= 1))) { } }
    if (v === 'kofi') DS.openKofi();
    if (v === 'done') DS.pop(this);
    this.menu.items = this.items();
  };
  Options.prototype.update = function () {
    var it = this.menu.current();
    if (it && (it.value === 'm' || it.value === 's')) {
      if (I.repeat('left')) { this.act(it.value, -1); DS.audio.sfx('cursor'); return; }
      if (I.repeat('right')) { this.act(it.value, 1); DS.audio.sfx('cursor'); return; }
      if (I.pressed('a')) { var A = DS.audio; if (it.value === 'm') A.musicVol = A.musicVol >= 1 ? 0 : A.musicVol; if (it.value === 's') A.sfxVol = A.sfxVol >= 1 ? 0 : A.sfxVol; }
    }
    this.menu.update();
  };
  Options.prototype.draw = function (ctx) { this.menu.draw(ctx); DS.textCenter(ctx, '◀ ▶ to adjust', 128, 150, '#9C9C9C'); };

  // ------------------------------------------------------------------ Shop
  function Shop(def) {
    this.kind = 'shop'; this.def = def; this.mode = null; this.msg = def.greeting || 'Welcome.';
    var self = this;
    this.menu = new DS.Menu({
      items: [{ label: 'BUY', value: 'buy', disabled: !def.items || !def.items.length }, { label: 'SELL', value: 'sell', disabled: def.buys === false }, { label: 'LEAVE', value: 'leave' }],
      x: 4, y: 58, w: 64, rowH: 12, pad: 7,
      onSelect: function (it) { DS.run(function* () { self.menu.active = false; yield* self.go(it.value); self.menu.active = true; }); },
      onCancel: function () { DS.pop(self); }
    });
  }
  DS.Shop = Shop;
  Shop.prototype.price = function (id) { var o = this.def.prices && this.def.prices[id]; return o != null ? o : DS.DATA.items[id].price; };
  Shop.prototype.go = function* (what) {
    var G = DS.G, self = this;
    if (what === 'leave') { DS.pop(this); return; }
    if (what === 'buy') {
      while (true) {
        var items = this.def.items.map(function (id) { var it = DS.DATA.items[id], p = self.price(id); return { label: it.name, right: p + ' sp', value: id, disabled: p > G.silver }; });
        var id = yield DS.choose({ items: items, x: 70, y: 58, w: 182, visible: 9, rowH: 12, drawExtra: function (ctx, m) { self.drawWho(ctx, m); } });
        if (!id) return;
        var it = DS.DATA.items[id], p = this.price(id), n = 1;
        if (it.kind === 'use' || it.stack) { n = yield DS.qty({ max: Math.min(99, Math.floor(G.silver / p)), price: p, label: it.name }); if (!n) continue; }
        G.silver -= p * n; G.give(id, n); DS.audio.sfx('coin');
        this.msg = DS.pick(this.def.thanks || ['A fair trade.', 'Yours.', 'Mind how you carry it.']);
        if (it.kind === 'weapon' || it.kind === 'armor' || it.kind === 'shield') {
          var fits = G.party.filter(function (h) { return R.canEquip(h, it); });
          if (fits.length) {
            var eq = yield DS.ask('Equip it now?', ['YES', 'NO']);
            if (eq === 0) {
              var h = fits.length === 1 ? fits[0] : yield pickHero('WHO TAKES IT?', function (x) { return R.canEquip(x, it); });
              if (h) {
                if (it.kind === 'shield') { var w = R.item(h.equip.weapon); if (w && (w.weapon.props || []).indexOf('two-handed') >= 0) { yield DS.say(h.name + "'s weapon needs both hands."); continue; } }
                if (it.kind === 'weapon' && (it.weapon.props || []).indexOf('two-handed') >= 0 && h.equip.shield) { G.give(h.equip.shield, 1); h.equip.shield = null; }
                if (h.equip[it.kind]) G.give(h.equip[it.kind], 1);
                G.take(id, 1); h.equip[it.kind] = id; DS.audio.sfx('confirm');
              }
            }
          }
        }
      }
    }
    if (what === 'sell') {
      while (true) {
        var inv = G.inv.filter(function (s) { var it = DS.DATA.items[s.id]; return it.kind !== 'key' && it.price > 0; })
          .map(function (s) { var it = DS.DATA.items[s.id]; return { label: it.name + ' x' + s.n, right: Math.floor(it.price / 2) + ' sp', value: s.id }; });
        if (!inv.length) { this.msg = 'You have nothing I want.'; return; }
        var sid = yield DS.choose({ items: inv, x: 70, y: 58, w: 182, visible: 9, rowH: 12 });
        if (!sid) return;
        var sit = DS.DATA.items[sid], cnt = G.count(sid), k = 1;
        if (cnt > 1) { k = yield DS.qty({ max: cnt, price: Math.floor(sit.price / 2), label: sit.name }); if (!k) continue; }
        G.take(sid, k); G.silver += Math.floor(sit.price / 2) * k; DS.audio.sfx('coin');
        this.msg = 'Done.';
      }
    }
  };
  Shop.prototype.drawWho = function (ctx, menu) {
    var id = menu.current() && menu.current().value, it = id && DS.DATA.items[id], G = DS.G;
    DS.win(ctx, 4, 196, 248, 40);
    if (!it) return;
    var ln = DS.wrap(it.desc || '', 150);
    for (var i = 0; i < Math.min(3, ln.length); i++) DS.text(ctx, ln[i], 10, 203 + i * 10, '#E0C8A0');
    if (it.kind === 'weapon' || it.kind === 'armor' || it.kind === 'shield') {
      G.party.forEach(function (h, k) {
        var ok = R.canEquip(h, it), spr = DS.walker(DS.LOOKS[h.look]);
        var x = 164 + k * 22;
        ctx.globalAlpha = ok ? 1 : 0.25; ctx.drawImage(spr.down[ok && ((DS.frame >> 4) & 1) ? 1 : 0], x, 200); ctx.globalAlpha = 1;
        if (ok) { var d = better(h, it); DS.textCenter(ctx, d > 0 ? '▲' : d < 0 ? '▼' : '=', x + 8, 219, d > 0 ? '#58F898' : d < 0 ? '#F85838' : '#C8D0E8'); }
      });
    }
  };
  Shop.prototype.update = function () { this.menu.update(); };
  Shop.prototype.draw = function (ctx) {
    var G = DS.G, d = this.def;
    DS.win(ctx, 4, 4, 248, 50);
    if (d.look) ctx.drawImage(DS.walker(DS.LOOKS[d.look]).down[(DS.frame >> 5) & 1], 12, 12, 32, 32);
    DS.text(ctx, d.name, 52, 10, '#F8D878');
    DS.text(ctx, d.keeper || '', 52, 21, '#9C9C9C');
    DS.wrap(this.msg, 190).slice(0, 2).forEach(function (l, i) { DS.text(ctx, l, 52, 32 + i * 10, '#F8F8F8'); });
    DS.win(ctx, 4, 170, 64, 22);
    DS.text(ctx, '◆' + G.silver, 10, 177, '#F8F8F8');
    this.menu.draw(ctx);
  };
  DS.shop = function (id) { return W8.scene(new Shop(DS.DATA.shops[id])); };

  // ------------------------------------------------------------------ Game over
  function GameOver() { this.kind = 'gameover'; this.opaque = true; this.t = 0; var self = this; this.menu = null; }
  DS.GameOver = GameOver;
  GameOver.prototype.update = function () {
    this.t++;
    if (this.t === 90) {
      var self = this, any = [1, 2, 3].some(function (i) { return !!DS.loadSlot(i); });
      this.menu = new DS.Menu({ items: [{ label: 'CONTINUE FROM A SAVE', value: 'load', disabled: !any }, { label: 'TITLE', value: 'title' }], x: 56, y: 150, w: 144, cancelable: false,
        onSelect: function (it) { if (it.value === 'load') DS.push(new SlotScene(false)); else { DS.clearScenes(); DS.push(new Title()); } } });
    }
    if (this.menu) this.menu.update();
  };
  GameOver.prototype.draw = function (ctx) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 240);
    ctx.globalAlpha = Math.min(1, this.t / 60);
    DS.bigText(ctx, 'THE PARTY FALLS', 128, 80, 2);
    DS.textCenter(ctx, 'The corridor keeps what it takes.', 128, 116, '#9C9C9C');
    ctx.globalAlpha = 1;
    if (this.menu) this.menu.draw(ctx);
  };

  // ------------------------------------------------------------------ the roost law broken (RULED 09-24, Griz)
  // Not a death: a failure of the other kind. You came to make a name. You made one.
  function RoostFail() {
    this.kind = 'gameover'; this.opaque = true; this.t = 0; this.menu = null; this.bats = [];
    for (var i = 0; i < 260; i++) this.bats.push(DS.newBat(false));
  }
  DS.RoostFail = RoostFail;
  RoostFail.prototype.update = function () {
    this.t++;
    if (this.t === 150) {
      var any = [1, 2, 3].some(function (i) { return !!DS.loadSlot(i); });
      this.menu = new DS.Menu({ items: [{ label: 'CONTINUE FROM A SAVE', value: 'load', disabled: !any }, { label: 'TITLE', value: 'title' }], x: 56, y: 176, w: 144, cancelable: false,
        onSelect: function (it) { if (it.value === 'load') DS.push(new SlotScene(false)); else { DS.clearScenes(); DS.push(new Title()); } } });
    }
    if (this.menu) this.menu.update();
  };
  RoostFail.prototype.draw = function (ctx) {
    ctx.fillStyle = '#060406'; ctx.fillRect(0, 0, 256, 240);
    var keep = Math.max(40, 260 - this.t * 2); // the swarm thins out as the words come up
    DS.drawBats(ctx, this.bats.slice(0, keep));
    ctx.globalAlpha = Math.min(1, Math.max(0, (this.t - 30) / 60));
    DS.bigText(ctx, 'NOT THIS KIND', 128, 44, 2);
    DS.bigText(ctx, 'OF NAME', 128, 66, 2);
    DS.wrap(DS.L('fail.roost'), 220).forEach(function (l, i) { DS.textCenter(ctx, l, 128, 104 + i * 11, '#C8D0E8'); });
    ctx.globalAlpha = 1;
    if (this.menu) this.menu.draw(ctx);
  };

  // ------------------------------------------------------------------ Credits
  function Credits(ending) { this.kind = 'credits'; this.opaque = true; this.y = 240; this.ending = ending; this.lines = DS.DATA.credits; }
  DS.Credits = Credits;
  Credits.prototype.enter = function () { if (this.ending) DS.audio.play('ending'); };
  Credits.prototype.update = function () {
    this.y -= I.down('a') ? 1.6 : 0.4;
    if (I.pressed('b') || this.y < -this.lines.length * 12 - 40) {
      if (this.ending) { DS.clearScenes(); DS.push(new Title()); }
      else DS.pop(this);
    }
    if (I.pressed('menu')) DS.openKofi();
  };
  Credits.prototype.draw = function (ctx) {
    ctx.fillStyle = '#04061a'; ctx.fillRect(0, 0, 256, 240);
    var y = this.y, self = this;
    this.lines.forEach(function (l) {
      if (y > -12 && y < 240) {
        if (l.big) DS.bigText(ctx, l.t, 128, y, 2);
        else DS.wrap(l.t, 232).forEach(function (s, i) { DS.textCenter(ctx, s, 128, y + i * 10, l.c || '#F8F8F8'); });
      }
      y += l.big ? 24 : (DS.wrap(l.t, 232).length * 10 + (l.gap || 4));
    });
    DS.win(ctx, 0, 222, 256, 18); DS.textCenter(ctx, 'B: back   M/SHIFT: open Ko-fi', 128, 227, '#9C9C9C');
  };
})();
