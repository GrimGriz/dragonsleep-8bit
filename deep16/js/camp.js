/* DEEP16 — the camp (Griz, 09-27: the camp screen; "spell prep should probably run before each fight"; "cost for mage
   armor"). Between a rung and its fight: the four as the 8-bit game builds them at that level, and the morning's three
   choices. EQUIP from the rung's armoury (free: nobody is fighting yet). PREPARE the day's spells (js/save.js: a wizard
   INT modifier + level from his book, a paladin CHA modifier + half his level from his list, the oath's always ready).
   CAST AHEAD the 8-hour spells, Mage Armor and Aid: they walk into the fight already on, and their slots are spent.
   The choices are kept per level (deep16.camp), so a rung fought again starts from the last morning. */
'use strict';
(function () {
  var D = window.D16, I = D.input, DS = window.DS, SV = D.save;
  var P = function (r, i) { return D.PAL.ramps[r][i]; };
  var KEY = 'deep16.camp';
  var SLOTS = [['weapon', 'WEAPON'], ['armor', 'ARMOUR'], ['shield', 'SHIELD'], ['ring', 'RING'], ['cloak', 'CLOAK']];

  // the armoury a rung offers: the 8-bit game's gear by then. Silverton's racks (the Show-Armorer, the Pawnbroker) from the
  // start; from 5, after the lake, its hoard given back and Winters' cases; from 6 what's behind the fountains; plate at 8
  var ARMOURY = [
    [1, ['longsword', 'battleaxe', 'warhammer', 'greatsword', 'greataxe', 'maul', 'mace', 'spear', 'handaxe', 'shortsword', 'rapier', 'shortbow',
         'leather', 'studded', 'hide', 'chainshirt', 'scalemail', 'ringmail', 'chainmail', 'splint', 'shield']],
    // and two that aren't a plus (Griz, 09-27: "create two of the 'magic other than a +' items"): Flame Tongue, the Cloak of Displacement
    [5, ['longsword1', 'maul1', 'dagger1', 'staff1', 'leather1', 'studded1', 'hide1', 'chainshirt1', 'scalemail1', 'chainmail1', 'splint1', 'robes1', 'ringofprotection',
         'flametongue', 'cloakdisplacement']],
    [6, ['doorshield', 'lighthammer']],
    [8, ['dwarfplate']]
  ];
  function armoury(L) {
    var out = [];
    ARMOURY.forEach(function (a) { if (L >= a[0]) out = out.concat(a[1]); });
    return out.filter(function (id) { return DS.DATA.items[id]; });
  }
  function item(id) { return id ? DS.DATA.items[id] : null; }
  // the 8-bit game has no cloak slot: anyone can wear a cloak
  function canWear(h, it) { return it.kind === 'cloak' || DS.R.canEquip(h, it); }
  function twoHanded(id) { var it = item(id); return !!(it && it.weapon && (it.weapon.props || []).indexOf('two-handed') >= 0); }
  // the lowest slot of a level or higher with one left (index), or -1
  function slotAt(h, lvl) { for (var i = lvl - 1; i < (h.slots || []).length; i++) if (h.slots[i] > 0) return i; return -1; }

  function Camp(L, F, done) { this.L = L; this.F = F; this.done = done; this.t = 0; }
  D.Camp = Camp;
  Camp.prototype.opaque = true;
  Camp.prototype.enter = function () {
    var all = D.store.get(KEY) || {};
    this.st = all[this.L] || this.fresh();
    this.base = SV.fixture(this.L, { bare: true });
    this.mode = 'menu'; this.sel = 0; this.top = 0; this.stack = []; this.msg = null;
    this.rebuild();
  };
  Camp.prototype.fresh = function () { return { equip: {}, prep: {}, cast: { mageArmor: { on: true, who: 'aurdin' }, aid: { on: false, out: 'lymen' } } }; };
  Camp.prototype.save = function () { var all = D.store.get(KEY) || {}; all[this.L] = this.st; D.store.set(KEY, all); };

  // ------------------------------------------------------------------ the morning, built from the choices
  Camp.prototype.build = function () {
    var R = DS.R, st = this.st, data = JSON.parse(JSON.stringify(this.base)), hs = data.party, by = {};
    hs.forEach(function (h) { by[h.id] = h; });
    // the armoury: one of each; what a hero sets down goes back in it, for anyone
    var avail = {}; armoury(this.L).forEach(function (id) { avail[id] = (avail[id] || 0) + 1; });
    var give = function (id) { if (id) avail[id] = (avail[id] || 0) + 1; };
    var take = function (id) { if (!id || !avail[id]) return false; avail[id]--; return true; };
    var want = {};
    hs.forEach(function (h) {
      var ch = st.equip[h.id] || {};
      Object.keys(ch).forEach(function (s) { if (ch[s] === h.equip[s]) return; (want[h.id] = want[h.id] || {})[s] = { id: ch[s], def: h.equip[s] }; give(h.equip[s]); h.equip[s] = null; });
    });
    hs.forEach(function (h) {
      var w = want[h.id] || {};
      Object.keys(w).forEach(function (s) { if (!w[s].id) return; if (take(w[s].id)) h.equip[s] = w[s].id; else if (take(w[s].def)) h.equip[s] = w[s].def; });
    });
    this.avail = avail;
    // the day's spells
    hs.forEach(function (h) {
      if (!SV.prepCount(h)) return;
      var pool = SV.prepPool(h);
      h.prepared = (st.prep[h.id] || SV.prepDefault(h)).filter(function (id) { return pool.indexOf(id) >= 0; }).slice(0, SV.prepCount(h));
    });
    // cast ahead: Mage Armor (a creature in no armour; robes aren't armour to it), Aid (three of the four, a 2nd-level slot)
    var az = by.aurdin, ly = by.lymen, info = {};
    var ma = st.cast.mageArmor, mt = by[ma.who] || az, mwhy = '';
    if (!az || !az.prepared || az.prepared.indexOf('mageArmor') < 0) mwhy = az && SV.prepPool(az).indexOf('mageArmor') >= 0 ? 'not prepared' : 'Aurdin learns it at level 3';
    else if (R.armored(mt)) mwhy = mt.name + ' wears armour';
    else if (slotAt(az, 1) < 0) mwhy = 'no slot left';
    if (ma.on && !mwhy) { az.slots[slotAt(az, 1)]--; mt.conds.mageArmor = 1; }
    info.mageArmor = { why: mwhy, target: mt, on: ma.on && !mwhy };
    var aid = st.cast.aid, at = hs.filter(function (h) { return h.id !== aid.out; }).slice(0, 3), awhy = '';
    if (!ly || !ly.prepared || ly.prepared.indexOf('aid') < 0) awhy = ly && SV.prepPool(ly).indexOf('aid') >= 0 ? 'not prepared' : 'Lymen has it from level 5';
    else if (slotAt(ly, 2) < 0) awhy = 'no 2nd-level slot left';
    if (aid.on && !awhy) { ly.slots[slotAt(ly, 2)]--; at.forEach(function (h) { h.maxhp += 5; h.hp += 5; h.conds.aid = (h.conds.aid || 0) + 5; }); }
    info.aid = { why: awhy, targets: at, on: aid.on && !awhy };
    this.info = info;
    return data;
  };
  Camp.prototype.rebuild = function () { this.data = this.build(); };
  Camp.prototype.hero = function (id) { return this.data.party.filter(function (h) { return h.id === id; })[0]; };

  // what a hero's numbers would be with one slot changed (for the lists' right-hand column)
  function withItem(h, slot, id) {
    var R = DS.R, h2 = JSON.parse(JSON.stringify(h));
    h2.equip[slot] = id;
    if (slot === 'weapon' && twoHanded(id)) h2.equip.shield = null;
    if (slot === 'armor' && R.armored(h2)) delete h2.conds.mageArmor;
    if (slot === 'weapon' && !id) return 'bare hands';
    if (slot === 'cloak') return id ? 'foes at disadvantage' : '';
    if (slot === 'weapon') { var w = R.weaponOf(h2), dm = R.damageExpr(h2, w); return D.rules.sign(R.attackBonus(h2, w)) + ' ' + dm.dice + (dm.mod ? D.rules.sign(dm.mod) : ''); }
    return 'AC ' + R.ac(h2);
  }

  // ------------------------------------------------------------------ the lists (the right-hand panel), one per mode
  Camp.prototype.list = function () {
    var self = this, R = DS.R, st = this.st, hs = this.data.party;
    var go = function (mode, extra) { return function () { self.stack.push({ mode: self.mode, sel: self.sel, top: self.top, pick: self.pick }); self.mode = mode; self.sel = 0; self.top = 0; if (extra) self.pick = Object.assign({}, self.pick, extra); }; };
    switch (this.mode) {
      case 'menu': return { title: 'THE CAMP', rows: [
        { label: 'EQUIP', right: armoury(this.L).length + ' in the armoury', act: go('hero'), desc: 'Weapons, armour, shields and rings from the armoury, free: nobody is fighting yet. What one hero sets down, another can take up.' },
        { label: 'PREPARE SPELLS', right: hs.filter(function (h) { return h.prepared; }).map(function (h) { return h.name + ' ' + h.prepared.length + '/' + SV.prepCount(h); }).join('  '), act: go('caster'), desc: 'The day\'s spells. Aurdin prepares INT + his level from his book; Lymen CHA + half his level from the paladin list. Cantrips, and Lymen\'s oath spells, are always ready.' },
        { label: 'CAST AHEAD', right: [this.info.mageArmor.on ? 'mage armor' : '', this.info.aid.on ? 'aid' : ''].filter(Boolean).join(', ') || 'nothing', act: go('cast'), desc: 'The 8-hour spells, cast this morning: they are on when the fight starts, and their slots are spent.' },
        { label: 'FIGHT', right: this.F.name, act: function () { self.fight(); }, desc: this.F.intro || '' },
        { label: 'THE BUILD\'S MORNING', right: 'reset', act: function () { self.st = self.fresh(); self.save(); self.rebuild(); D.sfx('confirm'); }, desc: 'Back to the 8-bit game\'s own picks: their own gear, the build\'s spells, Mage Armor on Aurdin.' },
        { label: 'BACK TO THE LADDER', right: '', act: function () { self.leave(null); }, desc: '' }
      ] };
      case 'hero': return { title: 'EQUIP WHOM?', rows: hs.map(function (h) { return { label: h.name.toUpperCase(), right: 'AC ' + R.ac(h) + '  ' + R.weaponOf(h).name, act: go('slot', { hero: h.id }), hero: h.id }; }) };
      case 'slot': {
        var h = this.hero(this.pick.hero);
        return { title: 'EQUIP ' + h.name.toUpperCase(), rows: SLOTS.map(function (s) {
          var it = item(h.equip[s[0]]);
          return { label: s[1], right: it ? it.name : '-', act: go('item', { slot: s[0] }), hero: h.id };
        }) };
      }
      case 'item': {
        var h2 = this.hero(this.pick.hero), slot = this.pick.slot, cur = h2.equip[slot], rows = [];
        if (cur) rows.push({ label: '(take it off)', right: withItem(h2, slot, null), act: function () { self.setEquip(h2, slot, null); }, hero: h2.id });
        if (cur) rows.push({ label: item(cur).name + '  (worn)', right: withItem(h2, slot, cur), ok: false, why: 'already worn', hero: h2.id, desc: item(cur).desc });
        Object.keys(this.avail).sort().forEach(function (id) {
          var it = item(id);
          if (!it || !self.avail[id] || it.kind !== slot || !canWear(h2, it)) return;
          var why = slot === 'shield' && twoHanded(h2.equip.weapon) ? R.weaponOf(h2).name + ' takes both hands' : '';
          rows.push({ label: it.name, right: withItem(h2, slot, id), ok: !why, why: why, act: function () { self.setEquip(h2, slot, id); }, hero: h2.id, desc: it.desc });
        });
        if (!rows.length) rows.push({ label: '(nothing here ' + h2.name + ' can use)', ok: false, why: 'the armoury has nothing for that slot' });
        return { title: h2.name.toUpperCase() + ': ' + slot.toUpperCase(), rows: rows };
      }
      case 'caster': return { title: 'PREPARE WHOSE SPELLS?', rows: hs.filter(function (h) { return h.cls === 'wizard' || h.cls === 'paladin'; }).map(function (h) {
        var n = SV.prepCount(h);
        return { label: h.name.toUpperCase(), right: n ? h.prepared.length + ' of ' + n + ' prepared' : 'no spells yet', ok: !!n, why: 'a paladin has no spells until level 2', act: go('spells', { hero: h.id }), hero: h.id };
      }) };
      case 'spells': {
        var c = this.hero(this.pick.hero), n2 = SV.prepCount(c), oath = SV.oath(c);
        var rows2 = SV.prepPool(c).map(function (id) {
          var sp = SV.spell(id), on = c.prepared.indexOf(id) >= 0;
          return { label: (on ? '[x] ' : '[ ] ') + sp.name, right: 'L' + sp.level + (D.SPELLS[id] && D.SPELLS[id].shape === 'none' ? '  no use in a fight' : ''), on: on, desc: sp.desc, hero: c.id,
            act: function () { self.togglePrep(c, id); } };
        });
        oath.forEach(function (id) { rows2.push({ label: '[*] ' + SV.spell(id).name, right: 'oath: always ready', ok: false, why: 'the Oath of Devotion keeps it ready', hero: c.id, desc: SV.spell(id).desc }); });
        return { title: c.name.toUpperCase() + ': ' + c.prepared.length + ' OF ' + n2 + ' PREPARED', rows: rows2 };
      }
      case 'cast': {
        var mi = this.info.mageArmor, ai = this.info.aid;
        return { title: 'CAST AHEAD (left/right: on whom)', rows: [
          { label: (mi.on ? '[x] ' : '[ ] ') + 'MAGE ARMOR on ' + mi.target.name, right: mi.why || '1st-level slot', ok: !mi.why || mi.on, why: mi.why, hero: mi.target.id,
            act: function () { st.cast.mageArmor.on = !st.cast.mageArmor.on; self.changed(); }, cycle: function (d) { self.cycleMage(d); },
            desc: 'Aurdin, on a creature in no armour: AC 13 + DEX for 8 hours. Robes are not armour to it. It ends if the wearer puts on armour.' },
          { label: (ai.on ? '[x] ' : '[ ] ') + 'AID on ' + ai.targets.map(function (h) { return h.name; }).join(', '), right: ai.why || '2nd-level slot, +5 HP', ok: !ai.why || ai.on, why: ai.why,
            act: function () { st.cast.aid.on = !st.cast.aid.on; self.changed(); }, cycle: function (d) { self.cycleAid(d); },
            desc: 'Lymen, on three of the four: +5 to their maximum and current HP for 8 hours.' }
        ] };
      }
    }
    return { title: '', rows: [] };
  };

  Camp.prototype.changed = function () { this.save(); this.rebuild(); D.sfx('confirm'); };
  Camp.prototype.setEquip = function (h, slot, id) {
    var e = this.st.equip[h.id] = this.st.equip[h.id] || {};
    e[slot] = id;
    if (slot === 'weapon' && twoHanded(id) && h.equip.shield) e.shield = null; // both hands: the shield goes back in the armoury
    this.changed();
    this.back();
  };
  Camp.prototype.togglePrep = function (h, id) {
    var cur = h.prepared.slice(), i = cur.indexOf(id);
    if (i >= 0) cur.splice(i, 1);
    else if (cur.length >= SV.prepCount(h)) { D.sfx('error'); this.say(h.name + ' can prepare ' + SV.prepCount(h) + ': take one off first.'); return; }
    else cur.push(id);
    this.st.prep[h.id] = cur;
    this.changed();
  };
  Camp.prototype.cycleMage = function (d) {
    var R = DS.R, hs = this.data.party, ok = hs.filter(function (h) { return !R.armored(h); });
    if (!ok.length) { D.sfx('error'); return; }
    var i = ok.map(function (h) { return h.id; }).indexOf(this.st.cast.mageArmor.who);
    this.st.cast.mageArmor.who = ok[((i < 0 ? 0 : i + d) % ok.length + ok.length) % ok.length].id;
    this.changed();
  };
  Camp.prototype.cycleAid = function (d) {
    var ids = this.data.party.map(function (h) { return h.id; }), i = ids.indexOf(this.st.cast.aid.out);
    this.st.cast.aid.out = ids[((i + d) % ids.length + ids.length) % ids.length];
    this.changed();
  };
  Camp.prototype.back = function () {
    var s = this.stack.pop();
    if (!s) return;
    this.mode = s.mode; this.sel = s.sel; this.top = s.top; this.pick = s.pick;
  };
  Camp.prototype.say = function (s) { this.msg = { text: s, t: this.t }; };

  Camp.prototype.fight = function () {
    var self = this;
    this.save();
    D.sfx('confirm');
    D.push(new D.Battle({ ladder: true, fight: this.F.id, data: this.build(), onDone: function (res) { self.leave(res); } }));
  };
  // back to the ladder (the fight has popped itself already)
  Camp.prototype.leave = function (res) { if (D.top() === this) D.pop(); this.done(res); };

  // ------------------------------------------------------------------ input
  var PX = 244, PY = 30, PW = D.W - 244 - 6, ROW = 11, VIS = 15;
  Camp.prototype.update = function () {
    this.t++;
    var L = this.list(), n = L.rows.length, s0 = this.sel;
    if (this.sel >= n) this.sel = Math.max(0, n - 1);
    if (n) {
      if (I.repeat('up')) this.sel = (this.sel + n - 1) % n;
      if (I.repeat('down')) this.sel = (this.sel + 1) % n;
    }
    var hitRow = -1, m = I.mouse;
    if (m.inside && this.rowRects) this.rowRects.forEach(function (r) { if (m.x >= r.x && m.x < r.x + r.w && m.y >= r.y && m.y < r.y + r.h) hitRow = r.i; });
    if (m.moved && hitRow >= 0) this.sel = hitRow;
    if (this.sel !== s0) D.sfx('cursor');
    if (this.sel < this.top) this.top = this.sel;
    if (this.sel >= this.top + VIS) this.top = this.sel - VIS + 1;
    var row = L.rows[this.sel];
    if (row && row.cycle && (I.repeat('left') || I.repeat('right'))) { row.cycle(I.repeat('left') ? -1 : 1); return; }
    if (I.pressed('a') || (m.click && hitRow >= 0)) {
      if (!row) return;
      if (row.ok === false || !row.act) { D.sfx('error'); if (row.why) this.say(row.why); return; }
      row.act(); return;
    }
    if (I.pressed('b') || I.pressed('menu')) { D.sfx('cancel'); if (this.stack.length) this.back(); else this.leave(null); }
  };

  // ------------------------------------------------------------------ drawing
  function box(ctx, x, y, w, h, edge) {
    ctx.fillStyle = 'rgba(10,8,16,.92)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = edge || P('gold', 3); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  Camp.prototype.draw = function (ctx) {
    var R = DS.R, self = this, hs = this.data.party, L = this.list(), row = L.rows[this.sel], focus = row && row.hero;
    ctx.fillStyle = '#07060c'; ctx.fillRect(0, 0, D.W, D.H);
    // a fire, low in the middle, for the look of it
    var fl = [P('red', 3), P('fire', 1), P('gold', 3), P('gold', 4)];
    for (var k = 0; k < 7; k++) { var hgt = 3 + ((this.t / 4 + k * 5) % 7); ctx.fillStyle = fl[k % 4]; ctx.fillRect(236 + k, 258 - hgt, 1, hgt); }
    ctx.save(); ctx.translate(6, 5); ctx.scale(2, 2); D.text(ctx, 'THE CAMP', 0, 0, P('gold', 4)); ctx.restore();
    D.text(ctx, 'level ' + this.L + '  ·  before {y}' + this.F.name + '{/}  ·  ' + (this.F.sub || ''), 98, 9, P('silver', 5));
    // the four
    hs.forEach(function (h, i) {
      var x = 6, y = PY + i * 56, w = 232, hh = 53, look = SV.look(h.id, self.F), on = focus === h.id;
      box(ctx, x, y, w, hh, on ? P('gold', 4) : P('stone', 3));
      ctx.save(); ctx.beginPath(); ctx.rect(x + 3, y + 3, 32, hh - 6); ctx.clip();
      var sheet = look.sheet || h.id + '_p0';
      D.spr.draw(ctx, sheet, 'idle', 0, self.t, x + 19, y + Math.min(D.spr.top(sheet), 46) + 3, {});
      ctx.restore();
      var w0 = R.weaponOf(h), dm = R.damageExpr(h, w0), gear = [item(h.equip.armor), item(h.equip.shield), item(h.equip.ring), item(h.equip.cloak)].filter(Boolean).map(function (it) { return it.name; });
      D.text(ctx, '{y}' + (look.name || h.name) + '{/}  ' + h.cls + ' ' + h.lvl + '   HP ' + h.maxhp + '   AC ' + R.ac(h), x + 40, y + 4, P('bone', 1));
      D.text(ctx, w0.name + ' ' + D.rules.sign(R.attackBonus(h, w0)) + ', ' + dm.dice + (dm.mod ? D.rules.sign(dm.mod) : ''), x + 40, y + 14, P('silver', 5));
      D.text(ctx, gear.join(', ') || 'no armour', x + 40, y + 23, P('silver', 5));
      // the slots left after the morning (by level), what's on them, and the day's spells
      var bits = [];
      if (h.slots && h.slots.length) bits.push('slots ' + h.slots.map(function (s, j) { return s + '/' + h.slotsMax[j]; }).join(' '));
      if (h.conds.mageArmor) bits.push('{c}mage armor{/}');
      if (h.conds.aid) bits.push('{n}aid +' + h.conds.aid + '{/}');
      D.text(ctx, bits.join('  '), x + 40, y + 34, P('accent', 2));
      if (h.prepared) D.text(ctx, D.wrap(h.prepared.length + '/' + SV.prepCount(h) + ': ' + h.prepared.map(function (id) { return SV.spell(id).name; }).join(', '), w - 46)[0], x + 40, y + 43, P('stone', 5));
    });
    // the list
    box(ctx, PX, PY, PW, 224, P('gold', 3));
    D.text(ctx, L.title, PX + 6, PY + 5, P('gold', 4));
    this.rowRects = [];
    L.rows.slice(this.top, this.top + VIS).forEach(function (r, j) {
      var i = self.top + j, ry = PY + 18 + j * ROW, rr = { x: PX + 3, y: ry - 1, w: PW - 6, h: ROW, i: i };
      self.rowRects.push(rr);
      if (i === self.sel) { ctx.fillStyle = P('gold', 1); ctx.fillRect(rr.x, rr.y, rr.w, rr.h); }
      var dim = r.ok === false;
      D.text(ctx, r.label, PX + 7, ry + 1, dim ? P('stone', 5) : i === self.sel ? P('gold', 4) : P('bone', 1));
      if (r.right) D.text(ctx, r.right, PX + PW - 7, ry + 1, dim ? P('stone', 4) : P('stone', 6), 'right');
    });
    if (L.rows.length > VIS) D.text(ctx, (this.top + 1) + '-' + Math.min(L.rows.length, this.top + VIS) + ' of ' + L.rows.length, PX + PW - 7, PY + 5, P('stone', 5), 'right');
    // the chosen row's words
    var desc = row ? (row.ok === false && row.why ? '{o}' + row.why + '{/}' + (row.desc ? '  ' + row.desc : '') : row.desc || '') : '';
    D.wrap(desc, PW - 12).slice(0, 4).forEach(function (l, j) { D.text(ctx, l, PX + 6, PY + 190 + j * 8, P('bone', 2)); });
    if (this.msg && this.t - this.msg.t < 150) D.text(ctx, '{o}' + this.msg.text + '{/}', PX + 6, PY + 180, P('bone', 1));
    D.text(ctx, 'up/down choose  ·  E pick  ·  X back' + (row && row.cycle ? '  ·  left/right: on whom' : ''), D.W / 2, D.H - 10, P('stone', 5), 'center');
  };
})();
