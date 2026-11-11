/* DEEP16 -- SYLVIA SWANN'S TABLE: the eyes deck dealt, read and laid face up (11-11, the Swann tour seat, started by the lanes desk; RULED 11-11, Griz: "2 go"
   on the desk's plan; what a finished deck earns, "reduced frustration I imagine my dev team has given they've made all them eye rows"; PASS, "4 yes").
   The deck, the store and the bar over each card's door are ../../js/tour.js (DS.TOUR). Here:
   THE TABLE (S.Table; the door deep16/?cards, and her booth's READ THE CARDS): her portrait on the right as at her counter (js/counter.js C.LAYOUT), a draped
   cloth with the deck's six on it -- face down, or face up in his answer's colour, turned over one by one as he comes back having answered them -- her line,
   and the owl's count of the whole list. TURN THE NEXT CARD sends him to the next card face down; a click on a card, to that card's door; a deck all face up
   is her line from his words (T.endLine) and DEAL SIX MORE; SAVE writes his ear file as situations.html's Save does (js/onegallery.js OG.earFile). Nothing won.
   HER BOOTH (js/hours.js C.SCRIPTS.swann, the cup at 5 SP): with the tester switch on (T.tester: her table's door turns it on, &tester=0 off) she asks THE CUP
   or READ THE CARDS first; off, her booth is the story's alone. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, T = DS && DS.TOUR, C = D && D.counter, I = D && D.input; if (!D || !T || !C) return;
  var S = D.swann = {};
  var L = C.LAYOUT.portrait, PX = L[0], PY = L[1], PW = L[2], PH = L[3], CY = PY + PH - 26, RX = 8, RW = PX - 8 - RX;
  var WY = 32, WH = 46, CL = { y: 82, h: 82 }, CW = 36, CHH = 52, GAP = Math.floor((RW - 6 * CW) / 7), INFO = { y: 168, h: 42 }, BY = 216;
  var SHEET = 'pt_sylvia', FLIP = 16, STAGGER = 22;
  S.TOP = 'deep16/'; // (LEAVE from the door: the second game's title)
  function Table(o) {
    this.kind = 'swanntable'; this.opaque = true; this.t = 0; this.o = o || {}; this.hov = -1; this.cur = -1; this.flips = []; this.face = null; this.done = false; this.saved = null;
    this.open();
  }
  S.Table = Table;
  // what the table shows as he sits: a deck in hand (dealt now if none), its cards, her line
  Table.prototype.open = function () {
    var d = T.deck(), FB = T.fb();
    if (!d) { d = T.deal(); this.d = d; this.state = d ? 'deck' : 'empty'; this.line = d ? (d.no === 1 ? T.LINES.first : T.LINES.deal) : T.LINES.empty; this.setFace(d ? 'work' : 'welcoming'); }
    else {
      this.d = d; var cs = T.cards(d, null, FB), down = cs.filter(function (c) { return !c.up; }).length;
      if (!down) { this.state = 'end'; this.line = T.endLine(d.no); }
      else { this.state = 'deck'; this.line = down === cs.length ? (d.no === 1 ? T.LINES.first : T.LINES.deal) : T.LINES.back.replace('{n}', down === 1 ? 'One' : String(down)); }
      this.setFace('welcoming');
    }
    var c = T.count(); if ((this.state === 'end' || this.state === 'empty') && c.elsewhere) this.line += ' ' + T.LINES.elsewhere.replace('{n}', c.elsewhere);
    this.queueFlips();
  };
  // the cards answered since he last sat here turn over, one after another; the owl stretches when the last of a finished deck is up
  Table.prototype.queueFlips = function () {
    var d = this.d; this.flips = []; if (!d) return;
    var shown = d.shown || [], self = this, j = 0;
    T.cards(d).forEach(function (c) { if (c.up && shown.indexOf(c.id) < 0) self.flips.push({ k: c.k, t0: self.t + 10 + STAGGER * j++ }); });
  };
  Table.prototype.flipAt = function (k) { var f = this.flips.filter(function (q) { return q.k === k; })[0]; if (!f) return null; var p = (this.t - f.t0) / FLIP; return p < 0 ? 0 : p > 1 ? 1 : p; };
  Table.prototype.setFace = function (f) { this.face = f ? { anim: f, t0: this.t } : null; };
  // the cards and the buttons: [{ x, y, w, h, label, go, k }]
  Table.prototype.cards = function () {
    var out = []; if (!this.d) return out;
    for (var k = 0; k < this.d.ids.length; k++) out.push({ x: RX + GAP + k * (CW + GAP), y: CL.y + Math.round((CL.h - CHH) / 2), w: CW, h: CHH, go: 'card', k: k, card: true });
    return out;
  };
  Table.prototype.buttons = function () {
    var out = this.cards(), b = [];
    if (this.state === 'deck') b.push({ label: 'TURN THE NEXT CARD', go: 'next', w: 124 });
    if (this.state === 'end') b.push({ label: 'DEAL SIX MORE', go: 'deal', w: 124, off: !T.order().length });
    b.push({ label: 'SAVE', go: 'save', w: 58 }, { label: 'LEAVE', go: 'leave', w: 58 });
    var x = RX; b.forEach(function (q) { q.x = x; q.y = BY; q.h = 16; x += q.w + 6; out.push(q); });
    out.push({ x: RX + RW - 74, y: 7, w: 74, h: 12, label: 'BOOTH ' + (T.tester() ? 'ON' : 'OFF'), go: 'switch', small: true });
    return out;
  };
  Table.prototype.press = function (b) {
    if (!b || b.off) { D.sfx('error'); return; }
    D.sfx(b.go === 'leave' ? 'cancel' : 'confirm');
    if (b.go === 'card') { var r = (DS.EYES || {})[this.d.ids[b.k]]; if (!r) { D.sfx('error'); return; } T.nav(T.cardHref(r, b.k)); return; }
    if (b.go === 'next') { var nx = T.nextCard(this.d, -1); if (nx < 0) return; T.nav(T.cardHref((DS.EYES || {})[this.d.ids[nx]], nx)); return; }
    if (b.go === 'deal') { var d = T.deal(); this.d = d; this.state = d ? 'deck' : 'empty'; this.line = d ? T.LINES.deal : T.LINES.empty; this.setFace(d ? 'work' : 'welcoming'); this.flips = []; this.cur = -1; return; }
    if (b.go === 'save') { this.save(); return; }
    if (b.go === 'switch') { T.setTester(!T.tester()); return; }
    if (b.go === 'leave') { if (this.o.from === 'booth') { this.done = true; if (D.top() === this) D.pop(); } else T.nav(T.root + S.TOP); }
  };
  // SAVE: his ear file, situations.html's (js/onegallery.js OG.earFile: every noted row still on this device, the save before it, what is new since)
  Table.prototype.save = function () {
    var OG = D.oneGallery, now = new Date().toISOString(); if (!OG || !OG.earFile) { D.sfx('error'); return; }
    var out = OG.earFile(now); out._readme.saved_from = 'Sylvia Swann\'s table (deep16/?cards), its SAVE';
    if (!out.items.length) { D.sfx('error'); this.saved = { t: this.t, text: '{r}nothing noted yet{/}' }; return; }
    try {
      var a = document.createElement('a'), url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
      a.href = url; a.download = OG.earName(now); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      window.localStorage.setItem('dsl-situations-lastsave', now);
    } catch (e) { D.sfx('error'); this.saved = { t: this.t, text: '{r}not saved{/}: situations.html saves the same' }; return; }
    var nu = out.items.filter(function (i) { return i.new_since_last_save; }).length;
    this.saved = { t: this.t, text: '{y}SAVED{/} ' + out.items.length + ', ' + nu + ' new -- put it in play-records/' };
  };
  Table.prototype.update = function () {
    this.t++;
    var self = this, m = I.mouse, bs = this.buttons();
    // the turned cards kept once they are over; the owl's stretch when a finished deck's last is up
    if (this.flips.length && this.flips.every(function (f) { return self.t >= f.t0 + FLIP; })) {
      this.d.shown = T.cards(this.d).filter(function (c) { return c.up; }).map(function (c) { return c.id; }); T.keep(this.d); this.flips = [];
      this.setFace(this.state === 'end' ? 'stretch' : 'welcoming'); D.sfx('confirm');
    }
    var hit = m.inside ? bs.filter(function (q) { return m.x >= q.x && m.x < q.x + q.w && m.y >= q.y && m.y < q.y + q.h; })[0] : null;
    if (m.moved || m.click) this.hov = hit ? bs.indexOf(hit) : -1;
    if (m.click && m.inside && hit) { this.press(hit); return; }
    var live = bs.filter(function (q) { return !q.off && !q.small; });
    if (I.pressed('save')) { this.press(bs.filter(function (q) { return q.go === 'save'; })[0]); return; } // (S: SAVE, as the gallery's -- WASD's down rides with it)
    if (I.repeat('right') || I.repeat('down')) { var k0 = live.indexOf(bs[this.hov]); this.hov = bs.indexOf(live[(k0 + 1) % live.length]); D.sfx('cursor'); }
    if (I.repeat('left') || I.repeat('up')) { var k1 = live.indexOf(bs[this.hov]); this.hov = bs.indexOf(live[(k1 < 0 ? live.length - 1 : k1 - 1 + live.length) % live.length]); D.sfx('cursor'); }
    if (I.pressed('a')) { this.press(bs[this.hov] || live.filter(function (q) { return !q.card; })[0]); return; } // (E with nothing chosen: the first choice -- TURN THE NEXT CARD, or DEAL SIX MORE)
    if (I.pressed('b') || m.rclick) this.press(bs.filter(function (q) { return q.go === 'leave'; })[0]);
  };
  var VC = { works: '#58a8d8', broken: '#e05838', unclear: '#e89048', hard: '#e8c050', easy: '#e8c050' };
  function glyph(ctx, c, x, y) { // a card's answer, drawn: works a tick, broken a cross, unclear a ?, too hard / too easy an arrow, a pass a bar, a note alone lines
    var col = c.pass ? '#8a8098' : VC[c.v] || '#58b878';
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'square'; ctx.beginPath();
    if (c.v === 'works') { ctx.moveTo(x - 8, y); ctx.lineTo(x - 2, y + 6); ctx.lineTo(x + 9, y - 7); ctx.stroke(); }
    else if (c.v === 'broken') { ctx.moveTo(x - 7, y - 7); ctx.lineTo(x + 7, y + 7); ctx.moveTo(x + 7, y - 7); ctx.lineTo(x - 7, y + 7); ctx.stroke(); }
    else if (c.v === 'unclear') { ctx.arc(x, y - 5, 5, Math.PI * 1.1, Math.PI * 0.45, false); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 1, y); ctx.lineTo(x + 1, y + 2); ctx.stroke(); ctx.fillRect(x - 1, y + 6, 3, 3); }
    else if (c.v === 'hard' || c.v === 'easy') { var s = c.v === 'hard' ? -1 : 1; ctx.moveTo(x - 7, y - 3 * s); ctx.lineTo(x, y + 4 * s); ctx.lineTo(x + 7, y - 3 * s); ctx.stroke(); }
    else if (c.pass) { ctx.fillRect(x - 8, y - 1, 16, 3); }
    else { ctx.fillRect(x - 8, y - 5, 16, 2); ctx.fillRect(x - 8, y, 16, 2); ctx.fillRect(x - 8, y + 5, 10, 2); }
    ctx.lineWidth = 1;
  }
  function back(ctx, x, y) { // a card face down: her deck's back, an owl's two eyes
    ctx.fillStyle = '#2a1640'; ctx.fillRect(x, y, CW, CHH); ctx.strokeStyle = '#c8a040'; ctx.strokeRect(x + 1.5, y + 1.5, CW - 3, CHH - 3);
    ctx.strokeStyle = '#6a4a88'; ctx.strokeRect(x + 4.5, y + 4.5, CW - 9, CHH - 9);
    ctx.fillStyle = '#c8a040'; [-7, 7].forEach(function (dx) { ctx.beginPath(); ctx.arc(x + CW / 2 + dx, y + CHH / 2 - 2, 5, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#1a0c28'; [-7, 7].forEach(function (dx) { ctx.beginPath(); ctx.arc(x + CW / 2 + dx, y + CHH / 2 - 2, 2, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#c8a040'; ctx.beginPath(); ctx.moveTo(x + CW / 2 - 2, y + CHH / 2 + 4); ctx.lineTo(x + CW / 2 + 2, y + CHH / 2 + 4); ctx.lineTo(x + CW / 2, y + CHH / 2 + 8); ctx.fill();
  }
  function front(ctx, c, x, y) {
    ctx.fillStyle = c.gone ? '#8a8270' : '#e8dcc0'; ctx.fillRect(x, y, CW, CHH); ctx.strokeStyle = '#8a6a30'; ctx.strokeRect(x + 1.5, y + 1.5, CW - 3, CHH - 3);
    if (c.gone) { D.text(ctx, 'CUT', x + CW / 2, y + CHH / 2 - 4, '#3a3428', 'center'); return; }
    glyph(ctx, c, x + CW / 2, y + CHH / 2 - 2);
  }
  Table.prototype.draw = function (ctx) {
    var self = this, W8 = D.WIN8, d = this.d, cs = T.cards(d), bs = this.buttons(), hb = bs[this.hov];
    var g = ctx.createLinearGradient(0, 0, 0, D.H); g.addColorStop(0, '#120a24'); g.addColorStop(1, '#22122e'); ctx.fillStyle = g; ctx.fillRect(0, 0, D.W, D.H);
    // her, over her draped table
    D.win8(ctx, PX, PY, PW, PH, '#160c26');
    ctx.save(); ctx.beginPath(); ctx.rect(PX + 3, PY + 3, PW - 6, PH - 6); ctx.clip();
    var sh = D.SHEETS && D.SHEETS[SHEET], fr = C.frameAt(sh, this.face, this.t);
    if (!(sh && C.drawPortrait(ctx, SHEET, fr.anim, fr.frame, PX + PW / 2, CY + 1))) { ctx.fillStyle = '#2a1a40'; ctx.beginPath(); ctx.arc(PX + PW / 2, CY - 92, 26, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(PX + PW / 2 - 48, CY - 60, 96, 60); }
    ctx.fillStyle = '#4a2060'; ctx.fillRect(PX + 3, CY, PW - 6, PY + PH - 3 - CY); ctx.fillStyle = '#c8a040'; ctx.fillRect(PX + 3, CY, PW - 6, 1);
    for (var fx = PX + 6; fx < PX + PW - 6; fx += 6) { ctx.fillStyle = '#c8a040'; ctx.fillRect(fx, PY + PH - 6, 2, 3); }
    ctx.restore();
    D.text(ctx, '{y}Sylvia Swann{/}', PX + PW / 2, CY + 9, W8.text, 'center');
    var c = T.count(); D.win8(ctx, PX, PY + PH + 4, PW, 22); D.text(ctx, T.owl(c), PX + PW / 2, PY + PH + 10, W8.text, 'center');
    // the left: the table's name, her line, the cloth and the cards
    D.text(ctx, '{y}SYLVIA SWANN\'S TABLE{/}', RX, 9, W8.text);
    D.text(ctx, d ? 'deck ' + d.no + ' · ' + cs.filter(function (q) { return q.up; }).length + ' of ' + cs.length + ' face up · ' + c.left + ' still to deal' : c.left + ' to deal', RX, 20, '#9c90b4');
    D.win8(ctx, RX, WY, RW, WH, '#160c26');
    D.wrap(this.line || '', RW - 18).slice(0, 4).forEach(function (l, i) { D.text(ctx, l, RX + 9, WY + 6 + i * 10, W8.text); });
    ctx.fillStyle = '#4a2060'; ctx.fillRect(RX, CL.y, RW, CL.h); ctx.fillStyle = '#5a2a72'; ctx.fillRect(RX, CL.y, RW, 3); ctx.fillStyle = '#c8a040'; ctx.fillRect(RX, CL.y + CL.h - 2, RW, 1);
    for (var x2 = RX + 3; x2 < RX + RW - 3; x2 += 6) ctx.fillRect(x2, CL.y + CL.h, 2, 3); // (the cloth's fringe)
    var focus = hb && hb.card ? hb.k : -1;
    bs.forEach(function (q) {
      if (!q.card) return;
      var cd = cs[q.k], lift = q.k === focus ? 3 : 0, p = self.flipAt(q.k), up = cd.up && (p == null || p >= 0.5), sx = p == null ? 1 : Math.abs(1 - 2 * p);
      ctx.save(); ctx.translate(q.x + CW / 2, 0); ctx.scale(Math.max(0.06, sx), 1); ctx.translate(-(q.x + CW / 2), 0);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(q.x + 2, q.y + 3, CW, CHH);
      if (up) front(ctx, cd, q.x, q.y - lift); else back(ctx, q.x, q.y - lift);
      ctx.restore();
      D.text(ctx, String(q.k + 1), q.x + CW / 2, q.y + CHH + 2 - lift, q.k === focus ? W8.gold : '#c8b8e0', 'center');
    });
    // the card under the cursor: its title and his answer
    D.win8(ctx, RX, INFO.y, RW, INFO.h, '#160c26');
    var ci = focus >= 0 ? cs[focus] : null;
    if (ci) {
      var p2 = ci.row ? T.place(ci.row.url).name : '';
      D.wrap(ci.row ? ci.row.title : 'cut from the list since the deal', RW - 18).slice(0, 2).forEach(function (l, i) { D.text(ctx, l, RX + 9, INFO.y + 5 + i * 10, W8.text); });
      var ans = !ci.up ? '{g}face down{/} · ' + p2 : ci.pass ? '{g}passed{/}' : (ci.v ? '{y}' + (T.VERDICTS.filter(function (v) { return v[0] === ci.v; })[0] || [0, ci.v])[1] + '{/}' : '{y}noted{/}') + (ci.note && !ci.pass ? ': ' + ci.note : '');
      D.text(ctx, D.wrap(ans, RW - 18)[0] || '', RX + 9, INFO.y + 27, '#c8c0d8');
    } else D.text(ctx, d ? 'Point at a card to read it; click it to go in.' : 'Nothing in hand.', RX + 9, INFO.y + 6, '#9c90b4');
    bs.forEach(function (q, k) {
      if (q.card) return;
      var hov = k === self.hov;
      if (q.small) { D.text(ctx, q.label, q.x + q.w, q.y + 2, hov ? W8.gold : '#9c90b4', 'right'); return; }
      ctx.fillStyle = hov ? W8.sel : 'rgba(26,16,48,.95)'; ctx.fillRect(q.x, q.y, q.w, q.h);
      ctx.strokeStyle = hov ? W8.gold : W8.mid; ctx.strokeRect(q.x + 0.5, q.y + 0.5, q.w - 1, q.h - 1);
      D.text(ctx, q.label, q.x + q.w / 2, q.y + 3, q.off ? '#6c6c84' : hov ? W8.gold : W8.text, 'center');
    });
    ctx.fillStyle = 'rgba(4,3,10,.95)'; ctx.fillRect(0, D.H - 14, D.W, 14);
    if (this.saved && this.t - this.saved.t < 240) D.text(ctx, this.saved.text, D.W / 2, D.H - 11, W8.text, 'center'); // (what SAVE did, where the keys are named)
    else D.hint(ctx, 'click a card or a choice · arrows choose · E pick · S save · X leave', D.W / 2, D.H - 11, '#9a96a8', 'center');
  };
  // the door: deep16/?cards (her table; the booth's switch on with it -- she deals there too, for a tester)
  S.door = function (q) { T.setTester(true); return new Table({ from: 'door' }); };
  S.open = function (o) { var tb = new Table(o); D.push(tb); return tb; };
  S.tester = T.tester;

  // ------------------------------------------------------------------ her booth: THE CUP or READ THE CARDS, the tester switch on
  var cup = C.SCRIPTS && C.SCRIPTS.swann;
  if (cup) C.SCRIPTS.swann = function* (sc, B, id) {
    if (!T.tester()) { yield* cup(sc, B, id); return; }
    var a = yield sc.ask('The cup, or the cards?', ['THE CUP (5 SP)', 'READ THE CARDS', 'LEAVE'], 'attentive');
    if (a === 0) { yield* cup(sc, B, id); return; }
    if (a !== 1) return;
    yield sc.say([T.LINES.booth, '{g}' + T.LINES.leave + '{/}'], 'work');
    sc.next = function* () { var tb = S.open({ from: 'booth' }); while (!tb.done) yield 1; }; // (her table over the walk, once her counter is down: js/counter.js C.talk)
  };
})();
