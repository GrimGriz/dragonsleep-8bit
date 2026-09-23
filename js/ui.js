/* DRAGONSLEEP — windows, menus, dialogue, prompts. The window style (silver frame on night
   blue) is this game's own. */
'use strict';
(function () {
  var DS = window.DS, I = DS.input;
  var BG = '#10123a', EDGE = '#e8e8f4', MID = '#6e6e98';
  DS.win = function (ctx, x, y, w, h, bg) {
    x = Math.round(x); y = Math.round(y);
    ctx.fillStyle = EDGE; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
    ctx.fillStyle = MID; ctx.fillRect(x + 2, y + 1, w - 4, h - 2); ctx.fillRect(x + 1, y + 2, w - 2, h - 4);
    ctx.fillStyle = bg || BG; ctx.fillRect(x + 3, y + 2, w - 6, h - 4); ctx.fillRect(x + 2, y + 3, w - 4, h - 6);
  };
  DS.bar = function (ctx, x, y, w, frac, col) {
    ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, 3);
    ctx.fillStyle = col; ctx.fillRect(x, y, Math.max(0, Math.round(w * DS.clamp(frac, 0, 1))), 3);
  };
  DS.cursor = function (ctx, x, y, blink) {
    if (blink && (DS.frame >> 4) & 1) return;
    DS.text(ctx, '▶', x, y, '#F8F8F8');
  };

  // ------------------------------------------------------------------ Menu
  function Menu(o) {
    this.items = o.items || [];
    this.x = o.x || 0; this.y = o.y || 0; this.w = o.w || 100;
    this.cols = o.cols || 1; this.rowH = o.rowH || 12; this.pad = o.pad != null ? o.pad : 8;
    this.visible = o.visible || Math.ceil(this.items.length / this.cols);
    this.i = DS.clamp(o.index || 0, 0, Math.max(0, this.items.length - 1));
    this.scroll = 0; this.title = o.title; this.frame = o.frame !== false;
    this.onSelect = o.onSelect; this.onCancel = o.onCancel; this.onMove = o.onMove;
    this.active = true; this.cancelable = o.cancelable !== false;
    this.h = o.h || (this.visible * this.rowH + this.pad * 2 - 2 + (this.title ? 12 : 0));
    this.colW = o.colW || Math.floor((this.w - this.pad * 2 - 6) / this.cols);
    this.fixScroll();
  }
  DS.Menu = Menu;
  Menu.prototype.fixScroll = function () {
    var row = Math.floor(this.i / this.cols);
    if (row < this.scroll) this.scroll = row;
    if (row >= this.scroll + this.visible) this.scroll = row - this.visible + 1;
  };
  Menu.prototype.current = function () { return this.items[this.i]; };
  Menu.prototype.update = function () {
    if (!this.active || !this.items.length) { if (this.active && I.pressed('b') && this.cancelable && this.onCancel) { DS.audio.sfx('cancel'); this.onCancel(); } return; }
    var n = this.items.length, old = this.i, c = this.cols;
    if (I.repeat('down')) { this.i += c; if (this.i >= n) this.i = this.i % c < n ? this.i % c : 0; }
    if (I.repeat('up')) { this.i -= c; if (this.i < 0) { var lastRow = Math.floor((n - 1) / c); this.i = Math.min(n - 1, lastRow * c + (old % c)); } }
    if (c > 1 && I.repeat('right')) { if (this.i % c < c - 1 && this.i + 1 < n) this.i++; }
    if (c > 1 && I.repeat('left')) { if (this.i % c > 0) this.i--; }
    if (this.i !== old) { DS.audio.sfx('cursor'); this.fixScroll(); if (this.onMove) this.onMove(this.current(), this.i); }
    if (I.pressed('a')) {
      var it = this.current();
      if (!it || it.disabled) { DS.audio.sfx('error'); return; }
      DS.audio.sfx('confirm');
      if (this.onSelect) this.onSelect(it, this.i);
    } else if (I.pressed('b') && this.cancelable) {
      DS.audio.sfx('cancel');
      if (this.onCancel) this.onCancel();
    }
  };
  Menu.prototype.draw = function (ctx) {
    if (this.frame) DS.win(ctx, this.x, this.y, this.w, this.h);
    var ty = this.y + this.pad + (this.title ? 12 : 0);
    if (this.title) DS.text(ctx, this.title, this.x + this.pad, this.y + this.pad - 1, '#F8D878');
    var start = this.scroll * this.cols, end = Math.min(this.items.length, start + this.visible * this.cols);
    for (var k = start; k < end; k++) {
      var it = this.items[k], r = Math.floor(k / this.cols) - this.scroll, c = k % this.cols;
      var x = this.x + this.pad + 8 + c * this.colW, y = ty + r * this.rowH;
      var col = it.disabled ? '#6C6C84' : (it.color || '#F8F8F8');
      if (it.icon) { ctx.drawImage(it.icon, x, y - 4); DS.text(ctx, it.label, x + 18, y, col); }
      else DS.text(ctx, it.label, x, y, col);
      if (it.right != null) DS.textRight(ctx, String(it.right), c === this.cols - 1 ? this.x + this.w - this.pad : x + this.colW - 10, y, it.disabled ? '#6C6C84' : (it.rightColor || '#C8D0E8'));
      if (k === this.i && this.active) DS.cursor(ctx, x - 8, y, false);
      else if (k === this.i) DS.cursor(ctx, x - 8, y, true);
    }
    if (this.scroll > 0) DS.text(ctx, '▲', this.x + this.w - 12, this.y + 3, '#C8D0E8');
    if ((this.scroll + this.visible) * this.cols < this.items.length) DS.text(ctx, '▼', this.x + this.w - 12, this.y + this.h - 10, '#C8D0E8');
  };

  // A menu as its own scene; result = chosen item's value (or the item), null on cancel
  function MenuScene(o) {
    var self = this;
    this.kind = 'menu';
    this.menu = new Menu(Object.assign({}, o, {
      onSelect: function (it) { self.result = it.value !== undefined ? it.value : it; DS.pop(self); },
      onCancel: function () { self.result = null; DS.pop(self); }
    }));
    this.extra = o.drawExtra;
  }
  MenuScene.prototype.update = function () { this.menu.update(); };
  MenuScene.prototype.draw = function (ctx) { this.menu.draw(ctx); if (this.extra) this.extra(ctx, this.menu); };
  DS.MenuScene = MenuScene;
  DS.choose = function (o) { return DS.W8.scene(new MenuScene(o)); };

  // ------------------------------------------------------------------ Dialogue
  var LINE_H = 11, BOX_Y = 162, BOX_H = 76, LINES = 5, WRAP = 234;
  function paginate(pages) {
    var out = [];
    (Array.isArray(pages) ? pages : [pages]).forEach(function (p) {
      var who = null, t = p;
      if (typeof p === 'object' && p) { who = p.who; t = p.t; }
      var lines = DS.wrap(t, WRAP);
      for (var i = 0; i < lines.length; i += LINES) out.push({ who: who, lines: lines.slice(i, i + LINES) });
    });
    return out;
  }
  function DialogScene(pages, o) {
    o = o || {};
    this.kind = 'dialog';
    this.pages = paginate(pages);
    this.p = 0; this.chars = 0; this.who = o.who;
    this.top = !!o.top; this.choices = o.choices; this.cancel = o.cancel;
    this.speed = o.speed || 2; this.menu = null; this.result = -1;
    this.auto = o.auto; this.timer = 0;
  }
  DS.DialogScene = DialogScene;
  DialogScene.prototype.pageLen = function () { return this.pages[this.p] ? DS.textLen(this.pages[this.p].lines.join('')) : 0; };
  DialogScene.prototype.update = function () {
    var self = this;
    if (this.menu) { this.menu.update(); return; }
    var len = this.pageLen();
    if (this.chars < len) {
      this.chars += (I.down('a') || I.down('b')) ? 6 : this.speed;
      if (I.pressed('a')) this.chars = len;
      return;
    }
    if (this.auto) { if (++this.timer > this.auto) { this.next(); } return; }
    if (I.pressed('a') || I.pressed('b')) this.next();
  };
  DialogScene.prototype.next = function () {
    var self = this;
    this.timer = 0;
    if (this.p < this.pages.length - 1) { this.p++; this.chars = 0; return; }
    if (this.choices) {
      var items = this.choices.map(function (c, i) { return { label: c, value: i }; });
      var w = 20; items.forEach(function (it) { w = Math.max(w, DS.textWidth(it.label) + 34); });
      this.menu = new Menu({
        items: items, x: 256 - w - 4, y: (this.top ? 82 : BOX_Y) - (items.length * 12 + 14) - 2, w: w,
        onSelect: function (it) { self.result = it.value; DS.pop(self); },
        onCancel: function () { self.result = self.cancel != null ? self.cancel : items.length - 1; DS.pop(self); }
      });
      return;
    }
    DS.pop(this);
  };
  DialogScene.prototype.draw = function (ctx) {
    var y = this.top ? 4 : BOX_Y, pg = this.pages[this.p];
    DS.win(ctx, 2, y, 252, BOX_H);
    if (!pg) return;
    var who = pg.who || this.who;
    if (who) {
      var w = DS.textWidth(who) + 12;
      DS.win(ctx, 8, y - 11, w, 14);
      DS.text(ctx, who, 14, y - 7, '#F8D878');
    }
    var left = this.chars;
    for (var i = 0; i < pg.lines.length; i++) {
      var ln = pg.lines[i], L = DS.textLen(ln);
      DS.text(ctx, ln, 11, y + 9 + i * LINE_H, '#F8F8F8', Math.max(0, left));
      left -= L;
    }
    if (this.chars >= this.pageLen() && !this.menu && !this.auto && ((DS.frame >> 4) & 1)) DS.text(ctx, '▼', 240, y + BOX_H - 11, '#F8F8F8');
    if (this.menu) this.menu.draw(ctx);
  };
  DS.say = function (pages, o) { return DS.W8.scene(new DialogScene(pages, o)); };
  DS.ask = function (text, choices, o) { return DS.W8.scene(new DialogScene(text, Object.assign({}, o || {}, { choices: choices }))); };

  // ------------------------------------------------------------------ Popup (the expansion walls, notices)
  function Popup(o) {
    var self = this;
    this.kind = 'popup';
    this.title = o.title; this.lines = DS.wrap(o.text || '', 196); this.result = -1;
    this.art = o.art;
    var items = (o.buttons || ['OK']).map(function (b, i) { return { label: b, value: i }; });
    var bw = 0; items.forEach(function (it) { bw += DS.textWidth(it.label) + 30; });
    this.foot = o.foot || null;
    var body = 23 + this.lines.length * 11 + (this.art ? 28 : 0) + (this.foot ? 11 : 0);
    this.h = body + 34;
    this.y = Math.max(8, Math.round((240 - this.h) / 2) - 8);
    this.menu = new Menu({
      items: items, cols: items.length, x: 128 - Math.round(bw / 2) - 8, y: this.y + body + 2, w: bw + 16, h: 26, frame: true, colW: Math.round(bw / items.length),
      onSelect: function (it) { self.result = it.value; if (o.onButton && o.onButton(it.value) === false) return; DS.pop(self); },
      onCancel: function () { self.result = -1; DS.pop(self); }
    });
    DS.audio.sfx('popup');
  }
  Popup.prototype.update = function () { this.menu.update(); };
  Popup.prototype.draw = function (ctx) {
    ctx.globalAlpha = 0.55; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 240); ctx.globalAlpha = 1;
    DS.win(ctx, 18, this.y, 220, this.h, '#1a1440');
    DS.textCenter(ctx, this.title, 128, this.y + 9, '#F8D878');
    var y = this.y + 23;
    if (this.art) { this.art(ctx, 128, y); y += 28; }
    for (var i = 0; i < this.lines.length; i++) DS.textCenter(ctx, this.lines[i], 128, y + i * 11, '#F8F8F8');
    if (this.foot) DS.textCenter(ctx, this.foot, 128, y + this.lines.length * 11, '#9C9C9C');
    this.menu.draw(ctx);
  };
  DS.Popup = Popup;
  DS.popup = function (o) { return DS.W8.scene(new Popup(o)); };

  // ------------------------------------------------------------------ quantity picker
  function Qty(o) {
    this.kind = 'qty'; this.n = 1; this.max = Math.max(1, o.max || 99); this.price = o.price || 0; this.label = o.label || '';
    this.result = 0;
  }
  Qty.prototype.update = function () {
    var old = this.n;
    if (I.repeat('up') || I.repeat('right')) this.n = Math.min(this.max, this.n + (I.repeat('right') ? 10 : 1));
    if (I.repeat('down') || I.repeat('left')) this.n = Math.max(1, this.n - (I.repeat('left') ? 10 : 1));
    if (old !== this.n) DS.audio.sfx('cursor');
    if (I.pressed('a')) { DS.audio.sfx('confirm'); this.result = this.n; DS.pop(this); }
    else if (I.pressed('b')) { DS.audio.sfx('cancel'); this.result = 0; DS.pop(this); }
  };
  Qty.prototype.draw = function (ctx) {
    DS.win(ctx, 120, 100, 132, 40);
    DS.text(ctx, this.label, 128, 108, '#F8D878');
    DS.text(ctx, 'x' + this.n, 128, 122);
    if (this.price) DS.textRight(ctx, (this.price * this.n) + ' sp', 244, 122, '#C8D0E8');
    DS.text(ctx, '▲', 152, 116 - 4, '#6C6C84');
  };
  DS.qty = function (o) { return DS.W8.scene(new Qty(o)); };

  // wait for any button (used by cutscenes)
  DS.waitKey = function () { return { update: function () { return I.pressed('a') || I.pressed('b'); } }; };
})();
