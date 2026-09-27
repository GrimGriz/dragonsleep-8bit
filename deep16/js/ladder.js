/* DEEP16 — the ladder (?ladder): the leveling simulator. Griz, 09-27: "win this fight, level up, and we slowly fill
   out the bestiary" -- DEEP16 as the combat engine for every fight, built here apart from the 8-bit game and slotted
   back into it later. One rung a level, 1 to 9: the four from the 8-bit game at that level (its own rules build them),
   against that level's fight. Win, and the level-up card says what each of them gains; the next rung is the next
   level. Rungs without a fight yet stand on the list, greyed. Progress is kept per browser (deep16.ladder). */
'use strict';
(function () {
  var D = window.D16, I = D.input, DS = window.DS;
  var P = function (r, i) { return D.PAL.ramps[r][i]; };
  var KEY = 'deep16.ladder';
  // the four start the 8-bit game at level 2, and its rules build them from there. The ladder has a rung 1 all the same
  // (Griz, 09-27: "might as well add level 1, we'll want it eventually"): till level-1 sheets are made, they fight it at 2
  function low() { return Math.max.apply(null, ['barley', 'aurdin', 'vivian', 'lymen'].map(function (id) { return DS.DATA.heroes[id].level || 1; })); }

  function Ladder() { this.t = 0; }
  D.Ladder = Ladder;
  Ladder.prototype.enter = function () {
    var st = D.store.get(KEY) || {};
    this.won = st.won || {};              // level -> true
    this.wonF = st.wonF || {};            // fight id -> true
    this.pick = st.pick || {};            // level -> which of the rung's fights (a rung may hold several: left/right)
    this.lo = 1; this.start = low();
    this.sel = Math.min(9, Math.max(this.lo, st.at || this.lo));
    this.card = null;                     // the level-up card, after a win
    D.music('title');
  };
  Ladder.prototype.save = function () { D.store.set(KEY, { won: this.won, wonF: this.wonF, pick: this.pick, at: this.sel }); };
  // the rung's chosen fight (the set piece first; the others by left/right)
  Ladder.prototype.cur = function (L) { var fs = D.fightsAt(L); return fs.length ? fs[((this.pick[L] || 0) % fs.length + fs.length) % fs.length] : null; };

  // what each of the four gains going from level L to L+1, in the 8-bit game's own words (R.levelUp's messages)
  function gains(L, F) {
    var R = DS.R;
    return ['barley', 'aurdin', 'vivian', 'lymen'].map(function (id) {
      var h = R.makeHero(id, L), look = D.save.look(id, F), hp0 = h.maxhp;
      var msgs = (R.levelUp(h) || []).map(function (m) { return window.DS.stripCodes ? window.DS.stripCodes(String(m)) : String(m); });
      return { name: look.name || h.name, cls: h.cls, lvl: h.lvl, hp: h.maxhp - hp0, msgs: msgs };
    });
  }

  Ladder.prototype.fight = function (L) {
    var F = this.cur(L), self = this;
    if (!F) { D.sfx('error'); return; }
    D.sfx('confirm');
    D.push(new D.Battle({ ladder: true, fight: F.id, onDone: function (res) { self.done(L, res, F); } }));
  };
  Ladder.prototype.done = function (L, res, F) {
    D.music('title');
    if (res !== 'won') return;
    this.won[L] = true; if (F) this.wonF[F.id] = true;
    if (L < 9) { this.card = { from: L, rows: gains(L, this.cur(L + 1)) }; this.sel = L + 1; D.sfx('levelup'); }
    else this.card = { top: true };
    this.save();
  };

  Ladder.prototype.update = function () {
    this.t++;
    if (this.card) {
      if (I.pressed('a') || I.pressed('b') || I.mouse.click) { D.sfx('confirm'); this.card = null; }
      return;
    }
    var s0 = this.sel;
    if (I.repeat('up')) this.sel = Math.min(9, this.sel + 1);
    if (I.repeat('down')) this.sel = Math.max(this.lo, this.sel - 1);
    var nf = D.fightsAt(this.sel).length;
    if (nf > 1 && (I.repeat('left') || I.repeat('right'))) { this.pick[this.sel] = ((this.pick[this.sel] || 0) + (I.repeat('left') ? -1 : 1) + nf) % nf; D.sfx('cursor'); this.save(); }
    for (var k = this.lo; k <= 9; k++) if (I.pressed('n' + k)) this.sel = k;
    if (I.mouse.moved && I.mouse.inside && this.rows) this.rows.forEach(function (r) { if (I.mouse.x >= r.x && I.mouse.x < r.x + r.w && I.mouse.y >= r.y && I.mouse.y < r.y + r.h) this.sel = r.L; }, this);
    if (this.sel !== s0) { D.sfx('cursor'); this.save(); }
    if (I.pressed('a') || (I.mouse.click && this.rows && this.rows.some(function (r) { return r.L === this.sel && I.mouse.x >= r.x && I.mouse.x < r.x + r.w && I.mouse.y >= r.y && I.mouse.y < r.y + r.h; }, this))) this.fight(this.sel);
    if (I.pressed('b') || I.pressed('menu')) { D.sfx('cancel'); location.href = './'; }
  };

  function box(ctx, x, y, w, h, edge) {
    ctx.fillStyle = 'rgba(10,8,16,.92)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = edge || P('gold', 3); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  Ladder.prototype.draw = function (ctx) {
    ctx.fillStyle = '#07060c'; ctx.fillRect(0, 0, D.W, D.H);
    // a faint rope of rungs up the left, for the look of it
    ctx.fillStyle = P('stone', 1); for (var y = 30; y < 250; y += 4) { ctx.fillRect(10, y, 1, 2); ctx.fillRect(22, y, 1, 2); }
    ctx.save(); ctx.translate(D.W / 2, 8); ctx.scale(2, 2); D.text(ctx, 'THE LADDER', 0, 0, P('gold', 4), 'center'); ctx.restore();
    D.text(ctx, 'win the fight, go up a level -- the four from the 8-bit game, built at each level by its own rules', D.W / 2, 26, P('silver', 5), 'center');
    this.rows = [];
    var x = 32, w = 250;
    for (var L = 9; L >= this.lo; L--) {
      var F = this.cur(L), nF = D.fightsAt(L).length, yy = 40 + (9 - L) * 24, on = L === this.sel, r = { x: x, y: yy, w: w, h: 21, L: L };
      this.rows.push(r);
      ctx.fillStyle = on ? P('gold', 1) : 'rgba(20,16,30,.9)'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = on ? P('gold', 4) : F ? P('stone', 3) : P('stone', 2); ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      ctx.fillStyle = this.won[L] ? P('gold', 3) : P('stone', 2); ctx.fillRect(8, yy + 8, 17, 3); // the rung
      D.text(ctx, 'L' + L, r.x + 5, r.y + 3, on ? P('gold', 4) : P('silver', 5));
      D.text(ctx, F ? F.name : '(a fight to build)', r.x + 24, r.y + 3, F ? (on ? P('bone', 2) : P('bone', 1)) : P('stone', 4));
      D.text(ctx, F ? F.sub : '', r.x + 24, r.y + 11, P('stone', 5));
      if (F && this.wonF[F.id]) D.text(ctx, 'WON', r.x + r.w - 5, r.y + 3, P('moss', 2), 'right');
      else if (this.won[L]) D.text(ctx, 'won', r.x + r.w - 5, r.y + 3, P('stone', 5), 'right');
      if (nF > 1) D.text(ctx, '< ' + (((this.pick[L] || 0) % nF + nF) % nF + 1) + '/' + nF + ' >', r.x + r.w - 5, r.y + 11, on ? P('gold', 4) : P('stone', 5), 'right');
    }
    // the chosen rung: its fight, and the four at that level
    var F2 = this.cur(this.sel), bx = 292, bw = D.W - bx - 6;
    box(ctx, bx, 40, bw, 196, F2 ? P('gold', 3) : P('stone', 3));
    D.text(ctx, 'LEVEL ' + this.sel, bx + 6, 45, P('gold', 4));
    var ty = 57; // the rung's words stack down the panel, each wrapped to it
    var put = function (txt, col) { D.wrap(txt, bw - 12).forEach(function (l) { D.text(ctx, l, bx + 6, ty, col); ty += 9; }); };
    if (F2) {
      put(F2.intro || '', P('bone', 1)); ty += 3;
      put('{g}' + (F2.from || '') + '{/}', P('accent', 2));
      var foes = (F2.foes || D.MAPS[F2.map].foes).map(function (f) { return D.FOES[f.kind] ? D.FOES[f.kind].name : f.kind; });
      var cnt = {}; foes.forEach(function (n) { cnt[n] = (cnt[n] || 0) + 1; });
      put('foes: ' + Object.keys(cnt).map(function (n) { return (cnt[n] > 1 ? cnt[n] + ' ' : '') + n; }).join(', '), P('red', 4));
    } else put('{g}no fight on this rung yet{/}', P('accent', 2));
    if (this.sel < this.start) put('{o}level-' + this.sel + ' sheets owed: they fight it at ' + this.start + '{/}', P('accent', 2));
    var party = this.partyAt(this.sel);
    var p0 = Math.max(112, ty + 4), ph = Math.min(28, Math.floor((232 - p0) / 4)); // the four close up when the rung's words run long
    party.forEach(function (h, i) {
      var yy = p0 + i * ph;
      D.text(ctx, '{y}' + h.name + '{/}  ' + h.cls + ' ' + h.lvl, bx + 6, yy, P('bone', 1));
      D.text(ctx, 'HP ' + h.hp + '  AC ' + h.ac + '  ' + h.weapon, bx + 6, yy + 9, P('silver', 5));
      if (h.slots) D.text(ctx, h.slots, bx + 6, yy + 18, P('accent', 2));
    });
    D.text(ctx, 'up/down or ' + this.lo + '-9 choose  ·  left/right: a rung with more fights  ·  E fight  ·  X back', D.W / 2, D.H - 12, P('stone', 5), 'center');
    if (this.card) this.drawCard(ctx);
  };
  // a light read of the four at a level (cached per level and fight: a fight may give them its own looks)
  Ladder.prototype.partyAt = function (L) {
    this.cache = this.cache || {};
    var F = this.cur(L), key = L + ':' + (F ? F.id : '');
    if (this.cache[key]) return this.cache[key];
    var R = DS.R, data = D.save.fixture(L);
    return (this.cache[key] = data.party.map(function (h) {
      var look = D.save.look(h.id, F), w = R.weaponOf(h);
      return { name: look.name || h.name, cls: h.cls, lvl: h.lvl, hp: h.maxhp, ac: R.ac(h), weapon: w ? w.name : '', slots: h.slotsMax && h.slotsMax.length ? 'slots ' + h.slotsMax.map(function (n, k) { return (k + 1) + ':' + n; }).join(' ') : '' };
    }));
  };
  Ladder.prototype.drawCard = function (ctx) {
    var c = this.card, w = 420, x = (D.W - w) / 2;
    if (c.top) {
      box(ctx, x, 90, w, 60);
      D.text(ctx, '{y}THE TOP OF THE LADDER{/}', D.W / 2, 100, P('gold', 4), 'center');
      D.text(ctx, 'Level 9 won. The ladder goes no higher -- yet.', D.W / 2, 116, P('bone', 1), 'center');
      D.text(ctx, '{g}E{/}', D.W / 2, 134, P('accent', 2), 'center');
      return;
    }
    var lines = [];
    c.rows.forEach(function (r) {
      lines.push('{y}' + r.name + '{/} is a ' + r.cls + ' of level ' + r.lvl + '  {n}+' + r.hp + ' HP{/}');
      r.msgs.filter(function (m) { return !/level \d|reaches level|HP/i.test(m); }).slice(0, 3).forEach(function (m) { D.wrap(m, w - 30).forEach(function (l) { lines.push('   ' + l); }); });
    });
    var h = lines.length * 9 + 34, y = Math.max(8, (D.H - h) / 2);
    box(ctx, x, y, w, h);
    D.text(ctx, '{y}LEVEL UP: ' + c.from + ' -> ' + (c.from + 1) + '{/}', D.W / 2, y + 6, P('gold', 4), 'center');
    lines.forEach(function (l, i) { D.text(ctx, l, x + 8, y + 20 + i * 9, P('bone', 1)); });
    D.text(ctx, '{g}E{/}', D.W / 2, y + h - 10, P('accent', 2), 'center');
  };
})();
