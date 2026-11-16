/* DEEP16 -- A BOOK READ ON ITS OWN PAGE (11-16, the book-hedge seat, started by the lanes desk; ..\handoff-2026-10-21-the-second-games-house.md, "2026-11-16 evening" item 4).
   Griz, 11-16: "Kat's book screen needs done." -- the same day, "the is to come lines is either removed or built, not reworded" (the grid's "no book screen yet" was removed, 9f2245e4).
   Katarina's Book (content/items.json katbook, its use 'read') read from the pack opens here, wherever it is read: a floor's M menu (js/roam.js R.menuAct, js/house.js
   FD.item), THE WORLD's (js/house.js H.openMenu), the Pocket DM's camp (js/pocket.js), a test floor's field (js/roam.js R.fieldLeft). Every page of content/text.json
   kat.book, paged as the first game's book scene pages it (first/js/scenes.js BookScene: the title over the page, the words, the page's number, E turns, X closes) and
   drawn at the grid's 480 x 270 as a book lying open, two pages a spread. E, RIGHT, a click on the right page or the wheel down: the next spread (E on the last closes);
   LEFT, a click on the left page or the wheel up: the one before; X or a right-click: closed. Its door, deep16/?at=book16 (js/situations16.js), opens it over THE WORLD.
   dev/bench16.js mode=book1116 checks it. */
'use strict';
(function () {
  var D = window.D16, I = D.input, BK = D.book = {};
  // what a 'read' item reads: its title over the pages, and its words in content/text.json
  BK.BOOKS = { katbook: { title: 'BOOK ONE', text: 'kat.book' } };
  // the spread: two pages on the leather, the spine between (x, y, w, h of each page), the words' measure and lines a page
  BK.PAGE = { y: 14, w: 214, h: 228, xl: 23, xr: 243, pad: 12, top: 34, lh: 10, lines: 19 };
  BK.paras = function (id) { var b = BK.BOOKS[id], T = window.DS.DATA.text || {}, t = b && T[b.text]; return t ? [].concat(t.t || t) : null; };
  BK.reads = function (id) { var it = window.DS.DATA.items[id]; return !!(it && it.use && it.use.effect === 'read' && BK.paras(id)); };
  // the pages: each paragraph wrapped to the page's measure, a blank line between, a page of BK.PAGE.lines (no page starts on the blank)
  BK.pages = function (paras) {
    var P = BK.PAGE, lines = [], out = [];
    paras.forEach(function (t, i) { if (i) lines.push(''); window.DS.wrap(t, P.w - 2 * P.pad).forEach(function (l) { lines.push(l); }); });
    var pg = [];
    lines.forEach(function (l) { if (!pg.length && l === '' && out.length) return; pg.push(l); if (pg.length === P.lines) { out.push(pg); pg = []; } });
    if (pg.length) out.push(pg);
    return out;
  };
  // open it (false if it is not a book) -- over whatever is in front, which waits under it and takes up again as it was when it is closed
  BK.open = function (id, done) {
    var paras = BK.paras(id); if (!paras) return false;
    D.push(new Book(BK.BOOKS[id].title, paras, done)); return true;
  };

  function Book(title, paras, done) {
    this.kind = 'book'; this.opaque = true; this.title = title; this.done = done || null; this.p = 0; this.t = 0;
    this.pages = BK.pages(paras); this.spreads = Math.max(1, Math.ceil(this.pages.length / 2));
  }
  BK.Book = Book;
  Book.prototype.last = function () { return this.p >= this.spreads - 1; };
  Book.prototype.turn = function (d, closeAtEnd) {
    if (d > 0 && this.last()) { if (closeAtEnd) this.close(); return; }
    if (d < 0 && this.p === 0) return;
    this.p += d; D.sfx('cursor');
  };
  Book.prototype.close = function () { D.sfx('cancel'); if (D.top() === this) D.pop(); if (this.done) this.done(); };
  Book.prototype.update = function () {
    var m = I.mouse; this.t++;
    if (I.pressed('b') || m.rclick) { this.close(); return; }
    if (I.pressed('a')) { this.turn(1, true); return; }
    if (I.repeat('right') || I.pressed('bumpr') || I.pressed('wheelr')) { this.turn(1, false); return; }
    if (I.repeat('left') || I.pressed('bumpl') || I.pressed('wheell')) { this.turn(-1, false); return; }
    if (m.wheel) { this.turn(m.wheel > 0 ? 1 : -1, false); return; }
    if (m.click && m.inside) this.turn(m.x >= D.W / 2 ? 1 : -1, true);
  };
  Book.prototype.draw = function (ctx) {
    var P = BK.PAGE, DS = window.DS, self = this, W = D.W, H = D.H;
    ctx.fillStyle = '#1a1210'; ctx.fillRect(0, 0, W, H);
    // the leather, its edge, and the pages' thickness under each side
    ctx.fillStyle = '#3e2614'; ctx.fillRect(13, 6, W - 26, 244);
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(15, 8, W - 30, 240);
    ctx.fillStyle = '#7a5834'; ctx.fillRect(15, 8, W - 30, 1);
    ctx.fillStyle = '#b8a47e'; ctx.fillRect(P.xl - 3, P.y + 3, 3, P.h - 2); ctx.fillRect(P.xr + P.w, P.y + 3, 3, P.h - 2);
    ctx.fillStyle = '#cdbb94'; ctx.fillRect(P.xl - 2, P.y + 2, 2, P.h - 1); ctx.fillRect(P.xr + P.w, P.y + 2, 2, P.h - 1);
    [P.xl, P.xr].forEach(function (x, side) {
      ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x, P.y, P.w, P.h);
      ctx.fillStyle = '#d8c8a0'; ctx.fillRect(x, P.y, P.w, 2); ctx.fillRect(x, P.y + P.h - 2, P.w, 2);
      // the fold toward the spine
      var gx = side ? x : x + P.w - 6;
      ctx.fillStyle = '#ddd0b0'; ctx.fillRect(gx, P.y, 6, P.h);
      ctx.fillStyle = '#cfbf9a'; ctx.fillRect(side ? x : x + P.w - 3, P.y, 3, P.h);
      var n = self.p * 2 + side, pg = self.pages[n];
      if (!pg) return;
      DS.textCenter(ctx, self.title, x + P.w / 2, P.y + 6, '#6a3a1a');
      for (var i = 0; i < pg.length; i++) DS.text(ctx, pg[i], x + P.pad, P.top + i * P.lh, '#2a1a10');
      DS.textCenter(ctx, String(n + 1), x + P.w / 2, P.y + P.h - 12, '#8a6a4a');
    });
    ctx.fillStyle = '#3e2614'; ctx.fillRect(P.xl + P.w, P.y - 2, P.xr - P.xl - P.w, P.h + 4); // (the spine)
    // the hint under the book, as the first game's foot line: the page, and E turns or closes
    var hint = (this.p * 2 + 1) + (this.pages[this.p * 2 + 1] ? '-' + (this.p * 2 + 2) : '') + ' / ' + this.pages.length + '   ' + (this.last() ? 'E close the book' : 'E turn the page') + (this.p > 0 ? '  ·  LEFT back' : '') + '  ·  X close';
    D.hint(ctx, hint, W / 2, 256, '#b8a07c', 'center');
  };
})();
