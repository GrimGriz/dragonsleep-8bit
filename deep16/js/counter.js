/* DEEP16 -- THE COUNTER: a Silverton keeper's talking portrait, their words, and their shelves (10-21, the Winters seat, started by the lanes desk). Griz, to the
   desk: "There's a handful of vendor art in Fresh, start a seat to get Winters set up for giving the starter mission and doing sales"; of the sheets, 10-20: "Those
   are for the new silverton buy/sell etc. interfaces - can wait until 16 bit silverton map gets made" (it is made: js/town.js).

   The screen (C.Counter): the keeper's portrait on the left over a counter -- the art desk's waist-up sheets, cut by tools/portrait-sheet.py into deep16/art/pt_<id>
   (idle, the four dialogue stills, the work) -- their words on the right, and every choice a button: a click, or the arrows and E, X back (his aim for every second-
   game screen, 10-21: "playable by mouse only as well as our other options"). One screen for every keeper, driven by a script (a generator yielding sc.say, sc.ask,
   sc.shelves); a keeper whose sales come later gets the same screen with their words only.

   Ambrose Winters (C.winters): the first game's scene (js/events.js S.winters, S.wintersWork) on the grid -- WORK, THE SHELVES, LEAVE; Winters' Errands, the first
   game's opener (content/quests.json `errands`), its two errands walked to Androit and Casper Venn (their rooms) and to Mical and Brennan (their doors), each
   person's own first-game words (content/npcs.json) with what they do (set, take: C.effects); his shelves by the first game's shop rules (js/scenes.js Shop:
   content/shops.json `winters`, buysNoSell -- he buys what any shop buys and what a quest gave; open after the first errand, as his words say). Held: his Ring of
   Binding and the copper scraping (the first game's lake story -- the second game's story pass decides).

   The flags, the pack and the purse are the floor's (js/roam.js B.roam.flags, B.inv, B.roam.silver), which the house writes into its save (js/house.js H.fromFloor);
   the renown is the save's (H.cur.renown). C.journal is the house's JOURNAL (the one menu, js/menu.js JournalPage), C.paintPin the pinned step's marker on the floor. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, I = D.input, C = D.counter = {};
  // THE VENDORS, one shape for every keeper (RULED 10-21, Griz: "Winters should only buy magic items - art for all the vendors like this should come in at some
  // point"): by their door's name (js/town.js T.DOORS), each `sheet` its talking portrait (tools/portrait-sheet.py); `shop` the first game's shop it sells from
  // (content/shops.json: its stock, prices, greeting, thanks) -- a counter with no shop speaks only; `buys` what it takes in (default the first game's rule for that
  // shop, js/scenes.js Shop; 'magic' only magic items, C.magic); `script` a scene of its own (Winters'); `own` Griz's own, waiting on his word. A new vendor is a line
  C.VENDORS = {
    winters: { sheet: 'pt_winters', shop: 'winters', buys: 'magic', script: 'winters' }, // (his errands, then his shelves; he buys magic items only -- his word above)
    casper: { sheet: 'pt_casper' }, androit: { sheet: 'pt_androit' }, hessle: { sheet: 'pt_hessle' }, aldric: { sheet: 'pt_aldric' },
    kessler: { sheet: 'pt_kessler' }, calla: { sheet: 'pt_calla' }, // (their first-game shops, `shop: 'kessler'` / `'calla'`, on his word of who sells what)
    barber: { sheet: 'pt_barber' },
    sylvia: { sheet: 'pt_sylvia', own: true } // (Griz's own: her portrait at her booth, her particulars on his word -- js/town.js T.TRADE `own`)
  };
  C.PT = {}; C.OWN = {}; C.SHOPS = {};
  Object.keys(C.VENDORS).forEach(function (id) { var v = C.VENDORS[id]; if (v.sheet) C.PT[id] = v.sheet; if (v.own) C.OWN[id] = 1; if (v.shop) C.SHOPS[id] = v.shop; });
  C.takes = function (id) { var v = C.VENDORS[id]; return !!v && (!!v.script || !!v.shop || !!(v.sheet && D.SHEETS && D.SHEETS[v.sheet])); };
  // a magic item, by the SRD's: a weapon or armour +N, a thing that takes attunement or gives a resistance, an immunity or advantage (a ring, the boots, the
  // periapt), and the SRD's potions and elixir by name -- not the Charm (Lisbet's trinket), plain plate, antitoxin or a diamond
  C.MAGIC_USE = ['potion', 'greaterpotion', 'superiorpotion', 'elixir'];
  C.magic = function (id, it) {
    it = it || DS.DATA.items[id]; if (!it) return false;
    return ((it.weapon && it.weapon.bonus) || (it.armor && it.armor.bonus) || 0) > 0 || !!(it.attune || it.resist || it.immune || it.condImmune || it.adv || it.aura) || C.MAGIC_USE.indexOf(id) >= 0;
  };

  // the one new line (invented.json winters-journal-grid): the first game's winters.journalHint with the grid's menu key (RULED 10-21, Griz, on the JOURNAL and
  // its marker: "should function the same as the 8-bit unless we add a feature")
  C.LINES = { journalGrid: 'Winters\' errand is in your JOURNAL now (M, then JOURNAL), and pinned: the gold arrow marks who is next, and the NEXT line says it in words.' };
  function L(k, o) { var r = (DS.DATA.text || {})[k], s = r ? r.t : k; var sub = function (x) { Object.keys(o || {}).forEach(function (n) { x = x.split('{' + n + '}').join(o[n]); }); return x; }; return Array.isArray(s) ? s.map(sub) : sub(s); }
  C.L = L;
  function pick(a) { return a[Math.floor(D.rand() * a.length)]; }

  // ---------------------------------------------------------------- what the party holds: on a floor the floor's own (js/roam.js), else the house's save
  C.state = function (B) {
    var H = D.house, R0 = B && B.roam;
    if (R0) { B.inv = B.inv || []; return { B: B, flags: R0.flags, inv: B.inv, party: R0.members.map(function (u) { return u.src || u; }).filter(function (h) { return h && h.equip; }), silver: function (d) { if (d) R0.silver = (R0.silver || 0) + d; return R0.silver || 0; } }; }
    var rec = H && H.playing && H.cur; if (!rec) return null;
    return { B: null, flags: rec.flags, inv: rec.inv, party: rec.party, silver: function (d) { if (d) rec.silver += d; return rec.silver; } };
  };
  function count(st, id) { var s = st.inv.filter(function (x) { return x.id === id; })[0]; return s ? s.n : 0; }
  function give(st, id, n) { n = n || 1; var s = st.inv.filter(function (x) { return x.id === id; })[0]; if (s) s.n += n; else st.inv.push({ id: id, n: n }); }
  function take(st, id, n) { n = n || 1; var s = st.inv.filter(function (x) { return x.id === id; })[0]; if (!s) return false; s.n -= n; if (s.n <= 0) st.inv.splice(st.inv.indexOf(s), 1); return true; }
  C.count = count; C.give = give; C.take = take;
  // the 8-bit's conditions (flag:, has:, hired:, lead:, &, |, !) on what the party holds -- js/town.js T.cond's reading; in the house, hired: and lead: read its save
  // as the first game's do (G.hired, ever hired; G.lead, the one who leads -- js/house.js H.fresh)
  C.cond = function (c, st) {
    var names = st.party.map(function (h) { return h.key || h.id; }), rec = D.house && D.house.playing && D.house.cur, hired = rec && rec.hired || names, lead = rec && rec.lead || names[0];
    return D.town.cond(c, st.flags, function (k, v) { return k === 'has' ? count(st, v) > 0 || st.party.some(function (h) { return h.equip && Object.keys(h.equip).some(function (s) { return h.equip[s] === v; }); }) : k === 'hired' ? hired.indexOf(v) >= 0 : k === 'lead' ? lead === v : false; });
  };
  // renown (the first game's js/events.js EV.renown): a point on the save, and the milestone XP -- 250 a point to everyone standing -- banked for the long rest (the
  // house's way, js/house.js H.bank). Returns the lines
  C.renown = function (st, n, why) {
    var H = D.house, cfg = DS.DATA.config || {}, titles = cfg.renownTitles || ['a stranger'], r;
    if (H && H.playing && H.cur) r = H.cur.renown = (H.cur.renown || 0) + n; else r = C.testRenown = (C.testRenown || 0) + n; // (a test floor, no house: kept for the page's life)
    D.sfx('levelup');
    var lines = [L('g.renown', { n: n, why: why ? L(why) : '', title: titles[Math.min(r, titles.length - 1)] })];
    var standing = st.party.filter(function (h) { return h.hp > 0 && !h.dead; });
    if (H && H.bank && standing.length) { var bk = H.bank(250 * n * standing.length, standing); if (bk.line) lines.push(bk.line); }
    return lines;
  };
  C.renownOf = function () { var H = D.house; return H && H.playing && H.cur ? H.cur.renown || 0 : C.testRenown || 0; };
  // a talk entry's doing (js/events.js EV.dialog): its flags set, a rumour heard, an item taken or given, silver, renown. Returns the lines it adds
  C.effects = function (st, br) {
    var out = [];
    [].concat(br.set || []).forEach(function (f) { st.flags[f] = 1; });
    [].concat(br.rumor || []).forEach(function (rid) { st.flags['heard:' + rid] = 1; });
    if (br.take) take(st, br.take, 1);
    if (br.give) { give(st, br.give, 1); D.sfx('chest'); out.push(L('g.got', { item: DS.DATA.items[br.give].name })); }
    if (br.silver) { st.silver(br.silver); D.sfx('coin'); out.push(L('g.foundSilver', { n: br.silver })); }
    if (br.renown) out = out.concat(C.renown(st, br.renown, br.renownWhy));
    return out;
  };
  // a person's word: their first talk whose condition holds, done (js/town.js T.say's choice, with its doing -- the errands' seals and signatures)
  C.words = function (B, id) {
    var st = C.state(B), N = ((DS.DATA || {}).npcs || {})[id] || {};
    var t = st && (N.talk || []).filter(function (e) { return C.cond(e['if'], st); })[0];
    if (t && t.say) return t.say.slice().concat(C.effects(st, t));
    return D.town.say(B, id);
  };

  // ---------------------------------------------------------------- the portrait: the sheet's own rows (tools/portrait-sheet.py), drawn on its anchor -- the head's
  // middle over the hands' line, where the screen's counter is
  C.drawPortrait = function (ctx, name, anim, frame, x, y) {
    var sh = D.SHEETS && D.SHEETS[name]; if (!sh) return false;
    if (!D.spr.has(name)) { if (!D.spr.offline) D.spr.load(sh.image); return false; }
    var a = sh.anims[anim] || sh.anims.idle, im = D.images[sh.image];
    ctx.drawImage(im, (frame % a.frames) * sh.fw, a.y, sh.fw, sh.fh, Math.round(x - sh.ax), Math.round(y - sh.ay), sh.fw, sh.fh);
    return true;
  };
  // which frame plays: the idle -- its six once in two seconds, then the first held three -- or a still held a while, or the work once through
  C.IDLE = { fps: 3, rest: 180 }; C.HOLD = 150; C.WORK = { fps: 4, hold: 60 };
  C.frameAt = function (sh, face, t) {
    var a = sh && sh.anims;
    if (face && a && a[face.anim]) {
      var dt = t - face.t0, an = a[face.anim];
      if (face.anim === 'work' || face.anim === 'stretch') { var per = 60 / C.WORK.fps, f = Math.floor(dt / per); if (f < an.frames + C.WORK.hold / per) return { anim: face.anim, frame: Math.min(an.frames - 1, f) }; }
      else if (dt < (face.hold || C.HOLD)) return { anim: face.anim, frame: 0 };
    }
    var n = a && a.idle ? a.idle.frames : 1, run = n * 60 / C.IDLE.fps, c = t % (run + C.IDLE.rest);
    return { anim: 'idle', frame: c < run ? Math.floor(c / (60 / C.IDLE.fps)) : 0 };
  };

  // ---------------------------------------------------------------- the screen
  var PX = 8, PY = 8, PW = 190, PH = 214, CY = PY + PH - 26, RX = 206, RW = D.W - 206 - 8, WY = 34, WH = 100;
  function Counter(B, o) {
    this.kind = 'counter'; this.opaque = true; this.t = 0; this.B = B; this.o = o; this.st = C.state(B);
    this.id = o.id; this.sheet = C.PT[o.id] || null; this.face = null; this.wait = null; this.msg = ''; this.hov = -1; this.i = 0; this.done = false; this.regear = false;
    this.co = o.script(this);
    this.step();
  }
  C.Counter = Counter;
  Counter.prototype.say = function (lines, face) { return { say: [].concat(lines), face: face }; };
  Counter.prototype.ask = function (prompt, opts, face) { return { ask: [].concat(prompt), opts: opts, face: face }; };
  Counter.prototype.shelves = function (shop) { return { shelves: shop }; };
  Counter.prototype.setFace = function (f) { if (f) this.face = { anim: f, t0: this.t }; };
  Counter.prototype.step = function (v) {
    var r = this.co.next(v);
    if (r.done) { this.close(); return; }
    this.wait = r.value; this.i = 0; this.hov = this.wait.ask ? 0 : -1; this.page = 0;
    if (this.wait.face) this.setFace(this.wait.face);
    if (this.wait.say) this.pages = this.paginate(this.wait.say);
    if (this.wait.shelves) this.openShelves(this.wait.shelves);
  };
  Counter.prototype.close = function () { if (this.done) return; this.done = true; if (D.top() === this) D.pop(); };
  // the words in the box: each line wrapped, and as many boxes as they need (a page a box)
  Counter.prototype.paginate = function (lines) {
    var rows = [], per = Math.floor((WH - 26) / 10), out = [];
    lines.forEach(function (l, k) { if (k) rows.push(''); rows = rows.concat(D.wrap(l, RW - 18)); });
    for (var i = 0; i < rows.length; i += per) out.push(rows.slice(i, i + per));
    return out.length ? out : [[]];
  };
  // the buttons on the screen now: [{ x, y, w, h, label, go, off }]
  Counter.prototype.buttons = function () {
    var w = this.wait || {}, out = [], self = this;
    if (this.sub) return this.subButtons();
    if (w.say) { var last = this.page >= this.pages.length - 1; out.push({ x: RX + RW - 70, y: WY + WH - 20, w: 62, h: 15, label: last ? 'OK' : 'NEXT', go: 'next' }); }
    if (w.ask) w.opts.forEach(function (lb, k) { out.push({ x: RX + 8, y: WY + WH + 8 + k * 19, w: RW - 16, h: 16, label: lb, go: 'opt', k: k }); });
    if (w.shelves) {
      var tw = 76;
      out.push({ x: RX, y: 86, w: tw, h: 15, label: 'BUY', go: 'tab', tab: 'buy', on: this.tab === 'buy', off: !this.shop.items || !this.shop.items.length });
      out.push({ x: RX + tw + 6, y: 86, w: tw, h: 15, label: 'SELL', go: 'tab', tab: 'sell', on: this.tab === 'sell', off: this.shop.buys === false });
      out.push({ x: RX + RW - tw, y: 86, w: tw, h: 15, label: 'BACK', go: 'back' });
      var rows = this.rows(), vis = 7;
      this.scroll = Math.max(0, Math.min(this.scroll || 0, rows.length - vis));
      rows.slice(this.scroll, this.scroll + vis).forEach(function (r, k) { out.push({ x: RX, y: 106 + k * 13, w: RW - (rows.length > vis ? 14 : 0), h: 12, label: r.label, right: r.right, go: 'row', k: self.scroll + k, off: r.off, row: true }); });
      if (rows.length > vis) { out.push({ x: RX + RW - 12, y: 106, w: 12, h: 12, label: '▲', go: 'up', off: !this.scroll }); out.push({ x: RX + RW - 12, y: 106 + (vis - 1) * 13, w: 12, h: 12, label: '▼', go: 'down', off: this.scroll + vis >= rows.length }); }
    }
    return out;
  };
  // the shelves: the first game's js/scenes.js Shop -- its prices, what it buys and at what (the half, or the shop's own rate), the thanks
  Counter.prototype.openShelves = function (id) {
    this.shop = (DS.DATA.shops || {})[id] || { items: [] }; this.shopId = id; this.tab = this.shop.items && this.shop.items.length ? 'buy' : 'sell'; this.scroll = 0; this.cur = 0;
    this.msg = this.shop.greeting || 'Welcome.'; this.setFace('welcoming');
  };
  Counter.prototype.price = function (id) { var o = this.shop.prices && this.shop.prices[id]; return o != null ? o : DS.DATA.items[id].price; };
  Counter.prototype.offer = function (it) { return Math.max(1, Math.floor(it.price * (this.shop.buyRate || 0.5))); };
  C.sellable = function (shop, it) { return it.kind !== 'key' && it.price > 0 && (!it.noSell || shop.buysNoSell) && (shop.buysKind ? shop.buysKind.indexOf(it.kind) >= 0 : it.kind !== 'part'); };
  // what a vendor takes in: its own rule (`buys`), else the first game's for its shop -- a quest's magic weapon is magic, so Winters takes it (the first game's buysNoSell)
  C.buys = function (v, shop, id, it) { if (v && v.buys === 'magic') return it.kind !== 'key' && it.price > 0 && C.magic(id, it); return C.sellable(shop, it); };
  Counter.prototype.rows = function () {
    var self = this, st = this.st, d = this.shop, v = C.VENDORS[this.id];
    if (this.tab === 'buy') return (d.items || []).map(function (id) { var it = DS.DATA.items[id], p = self.price(id); return { id: id, label: it.name, right: p + ' sp', off: p > st.silver() }; });
    return st.inv.filter(function (s) { var it = DS.DATA.items[s.id]; return it && s.n > 0 && C.buys(v, d, s.id, it); }).map(function (s) { var it = DS.DATA.items[s.id]; return { id: s.id, label: it.name + ' x' + s.n, right: self.offer(it) + ' sp' }; });
  };
  function stacks(it) { return it.kind === 'use' || !!it.stack; }
  function gear(it) { return it.kind === 'weapon' || it.kind === 'armor' || it.kind === 'shield'; }
  Counter.prototype.buy = function (id, n) {
    var st = this.st, it = DS.DATA.items[id], p = this.price(id);
    if (p * n > st.silver()) { D.sfx('error'); this.msg = L('g.poor'); this.setFace('concerned'); return; }
    st.silver(-p * n); give(st, id, n); D.sfx('coin');
    this.msg = pick(this.shop.thanks || ['A fair trade.', 'Yours.', 'Mind how you carry it.']); this.setFace('welcoming');
    if (gear(it)) { var fits = st.party.filter(function (h) { return !h.dead && DS.R.canEquip(h, it); }); if (fits.length) this.sub = { kind: 'equip', id: id, fits: fits }; }
  };
  Counter.prototype.sell = function (id, k) {
    var st = this.st, it = DS.DATA.items[id];
    take(st, id, k); st.silver(this.offer(it) * k); D.sfx('coin');
    this.msg = pick(this.shop.boughtText || ['Done.']); this.setFace('work'); // (his acquisition: unwrapped, looked over, set on the counter)
  };
  // the first game's equip-it-now (js/scenes.js Shop.go): a two-hander takes the shield off, a shield will not go on beside one, what was worn goes to the pack
  Counter.prototype.equip = function (h, id) {
    var st = this.st, it = DS.DATA.items[id], R = DS.R;
    if (it.kind === 'shield') { var w = R.item(h.equip.weapon); if (w && w.weapon && (w.weapon.props || []).indexOf('two-handed') >= 0) { this.msg = h.name + '\'s weapon needs both hands.'; D.sfx('error'); return; } }
    if (it.kind === 'weapon' && (it.weapon.props || []).indexOf('two-handed') >= 0 && h.equip.shield) { give(st, h.equip.shield, 1); h.equip.shield = null; }
    if (h.equip[it.kind]) give(st, h.equip[it.kind], 1);
    take(st, id, 1); h.equip[it.kind] = id; D.sfx('confirm'); this.regear = true;
  };
  function avg(expr) { var m = /^(\d+)d(\d+)$/.exec(String(expr || '')); return m ? +m[1] * (+m[2] + 1) / 2 : 0; }
  // ▲ ▼ = beside each hero who can use it: the first game's better() -- a weapon's average blow and half its to-hit, or the armour class
  C.better = function (h, it) {
    var R = DS.R, slot = it.kind, save = h.equip[slot];
    var score = function () { if (slot === 'weapon') { var d = R.damageExpr(h); return avg(d.dice) + d.mod + R.attackBonus(h) * 0.5; } return R.ac(h); };
    var b = score(); h.equip[slot] = it.id || null; var a = score(); h.equip[slot] = save;
    return a > b ? 1 : a < b ? -1 : 0;
  };
  Counter.prototype.subButtons = function () {
    var s = this.sub, out = [], bx = RX + 8, self = this;
    if (s.kind === 'qty') {
      out.push({ x: bx, y: 160, w: 26, h: 16, label: '-', go: 'qminus', off: s.n <= 1 }, { x: bx + 90, y: 160, w: 26, h: 16, label: '+', go: 'qplus', off: s.n >= s.max });
      out.push({ x: bx + 124, y: 160, w: 30, h: 16, label: 'MAX', go: 'qmax', off: s.n >= s.max });
      out.push({ x: bx, y: 186, w: 110, h: 16, label: s.sell ? 'SELL' : 'BUY', go: 'qok' }, { x: bx + 120, y: 186, w: 90, h: 16, label: 'BACK', go: 'qback' });
    }
    if (s.kind === 'equip') {
      s.fits.forEach(function (h, k) { out.push({ x: bx, y: 132 + k * 19, w: RW - 16, h: 16, label: h.name, go: 'who', hero: h, cmp: C.better(h, DS.R.item(s.id) || {}) }); });
      out.push({ x: bx, y: 132 + s.fits.length * 19, w: RW - 16, h: 16, label: 'NOT NOW', go: 'notnow' });
    }
    return out;
  };
  Counter.prototype.press = function (b) {
    var w = this.wait || {}, s = this.sub, self = this;
    if (!b || b.off) { D.sfx('error'); return; }
    D.sfx(b.go === 'back' || b.go === 'qback' || b.go === 'notnow' ? 'cancel' : 'cursor');
    if (b.go === 'next') { if (this.page < this.pages.length - 1) this.page++; else this.step(); return; }
    if (b.go === 'opt') { this.step(b.k); return; }
    if (b.go === 'tab') { this.tab = b.tab; this.scroll = 0; this.cur = 0; if (b.tab === 'sell') { this.setFace('skeptical'); if (!this.rows().length) this.msg = this.shop.nothingText || 'You have nothing I want.'; } return; }
    if (b.go === 'back') { this.shop = null; this.step(); return; }
    if (b.go === 'up') { this.scroll = Math.max(0, this.scroll - 1); return; }
    if (b.go === 'down') { this.scroll++; return; }
    if (b.go === 'row') {
      var r = this.rows()[b.k]; if (!r) return; this.cur = b.k;
      var it = DS.DATA.items[r.id];
      if (this.tab === 'buy') { var p = this.price(r.id); if (stacks(it)) { var mx = Math.min(99, Math.floor(this.st.silver() / p)); if (mx > 1) { this.sub = { kind: 'qty', id: r.id, n: 1, max: mx, price: p }; return; } } this.buy(r.id, 1); }
      else { var cnt = count(this.st, r.id); if (cnt > 1) { this.sub = { kind: 'qty', id: r.id, n: 1, max: cnt, price: this.offer(it), sell: true }; this.setFace('skeptical'); return; } this.sell(r.id, 1); }
      return;
    }
    if (s && b.go === 'qminus') { s.n--; return; }
    if (s && b.go === 'qplus') { s.n++; return; }
    if (s && b.go === 'qmax') { s.n = s.max; return; }
    if (s && b.go === 'qok') { this.sub = null; if (s.sell) this.sell(s.id, s.n); else this.buy(s.id, s.n); return; }
    if (s && b.go === 'qback') { this.sub = null; return; }
    if (s && b.go === 'who') { this.sub = null; this.equip(b.hero, s.id); return; }
    if (s && b.go === 'notnow') { this.sub = null; return; }
  };
  Counter.prototype.update = function () {
    this.t++;
    var m = I.mouse, bs = this.buttons(), self = this;
    var hit = m.inside ? bs.filter(function (q) { return m.x >= q.x && m.x < q.x + q.w && m.y >= q.y && m.y < q.y + q.h; })[0] : null;
    if (m.moved || m.click) this.hov = hit ? bs.indexOf(hit) : -1;
    var w = this.wait || {};
    if (m.click && m.inside) {
      if (hit) { this.press(hit); return; }
      if (w.say && !this.sub && m.x >= RX && m.y >= WY && m.y < WY + WH) { this.press(bs[0]); return; } // (a click on the words goes on)
    }
    if (m.wheel && this.shop && !this.sub) { this.scroll = Math.max(0, (this.scroll || 0) + (m.wheel > 0 ? 1 : -1)); m.wheel = 0; }
    var live = bs.filter(function (q) { return !q.off; });
    if (I.repeat('down') || I.repeat('right')) { var k0 = live.indexOf(bs[this.hov]); this.hov = bs.indexOf(live[(k0 + 1) % live.length]); D.sfx('cursor'); }
    if (I.repeat('up') || I.repeat('left')) { var k1 = live.indexOf(bs[this.hov]); this.hov = bs.indexOf(live[(k1 < 0 ? live.length - 1 : k1 - 1 + live.length) % live.length]); D.sfx('cursor'); }
    if (I.pressed('a')) { this.press(bs[this.hov] || (w.say ? bs[0] : null)); return; }
    if (I.pressed('b') || m.rclick) { // back: the words go on, a question takes its last answer (LEAVE), the shelves go back
      var back = this.sub ? bs.filter(function (q) { return q.go === 'qback' || q.go === 'notnow'; })[0] : w.say ? bs[0] : w.ask ? bs[bs.length - 1] : bs.filter(function (q) { return q.go === 'back'; })[0];
      this.press(back);
    }
  };
  Counter.prototype.draw = function (ctx) {
    var self = this, W8 = D.WIN8, st = this.st, w = this.wait || {};
    var g = ctx.createLinearGradient(0, 0, 0, D.H); g.addColorStop(0, '#0a0c22'); g.addColorStop(1, '#1a1426'); ctx.fillStyle = g; ctx.fillRect(0, 0, D.W, D.H);
    // the portrait over its counter
    D.win8(ctx, PX, PY, PW, PH, '#0b1430');
    ctx.save(); ctx.beginPath(); ctx.rect(PX + 3, PY + 3, PW - 6, PH - 6); ctx.clip();
    var sh = this.sheet && D.SHEETS[this.sheet], fr = C.frameAt(sh, this.face, this.t);
    if (!sh || !C.drawPortrait(ctx, this.sheet, fr.anim, fr.frame, PX + PW / 2, CY + 1)) {
      ctx.fillStyle = '#1c2348'; ctx.beginPath(); ctx.arc(PX + PW / 2, CY - 92, 26, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(PX + PW / 2 - 48, CY - 60, 96, 60); // (no sheet yet, or a keeper with none: a shape)
    }
    ctx.fillStyle = '#4a2e1a'; ctx.fillRect(PX + 3, CY, PW - 6, PY + PH - 3 - CY); ctx.fillStyle = '#8a5e3a'; ctx.fillRect(PX + 3, CY, PW - 6, 2); ctx.fillStyle = '#2a1a10'; ctx.fillRect(PX + 3, CY + 2, PW - 6, 1);
    ctx.restore();
    D.text(ctx, '{y}' + this.o.name + '{/}', PX + PW / 2, CY + 9, W8.text, 'center');
    D.win8(ctx, PX, PY + PH + 4, PW, 22); D.text(ctx, '◆ ' + (st ? st.silver() : 0) + ' silver', PX + 10, PY + PH + 10, W8.text);
    // the words
    D.text(ctx, '{y}' + (this.o.place || this.o.name) + '{/}', RX, 10, W8.text);
    if (this.o.what) D.text(ctx, this.o.what, RX, 21, '#9c9cb4');
    if (this.shop) {
      D.win8(ctx, RX, WY, RW, 48);
      D.wrap(this.msg, RW - 18).slice(0, 4).forEach(function (l, i) { D.text(ctx, l, RX + 9, WY + 6 + i * 10, W8.text); });
    } else {
      D.win8(ctx, RX, WY, RW, WH);
      var rows = w.say ? this.pages[this.page] || [] : w.ask ? this.paginate(w.ask)[0] : [];
      rows.forEach(function (l, i) { D.text(ctx, l, RX + 9, WY + 6 + i * 10, W8.text); });
      if (w.say && this.pages.length > 1) D.text(ctx, (this.page + 1) + '/' + this.pages.length, RX + 10, WY + WH - 16, '#9c9cb4');
    }
    var bs = this.buttons();
    if (this.sub) {
      var s = this.sub, it = DS.DATA.items[s.id];
      D.win8(ctx, RX, 104, RW, 140);
      if (s.kind === 'qty') {
        D.text(ctx, '{y}' + (s.sell ? 'SELL' : 'BUY') + ' HOW MANY?{/}  ' + it.name, RX + 9, 112, W8.text);
        D.text(ctx, s.n + '', RX + 8 + 58, 164, W8.gold, 'center');
        D.text(ctx, s.n + ' x ' + s.price + ' = ' + (s.n * s.price) + ' sp', RX + 9, 132, W8.text);
      } else D.text(ctx, '{y}EQUIP IT NOW?{/}  ' + it.name + ' -- who takes it?', RX + 9, 112, W8.text);
    }
    bs.forEach(function (q, k) {
      var hov = k === self.hov, on = q.on;
      if (q.row) {
        if (hov || (self.cur === q.k && !self.sub && !(bs[self.hov] && bs[self.hov].row))) { ctx.fillStyle = W8.sel; ctx.fillRect(q.x, q.y - 1, q.w, q.h); } // (the row under the mouse, else the last one picked)
        D.text(ctx, q.label, q.x + 6, q.y + 1, q.off ? '#6c6c84' : hov ? W8.gold : W8.text);
        D.text(ctx, q.right, q.x + q.w - 6, q.y + 1, q.off ? '#6c6c84' : W8.text, 'right');
        return;
      }
      ctx.fillStyle = hov ? W8.sel : on ? '#2c2470' : 'rgba(16,18,58,.92)'; ctx.fillRect(q.x, q.y, q.w, q.h);
      ctx.strokeStyle = hov || on ? W8.gold : W8.mid; ctx.strokeRect(q.x + 0.5, q.y + 0.5, q.w - 1, q.h - 1);
      D.text(ctx, q.label, q.x + q.w / 2, q.y + 3, q.off ? '#6c6c84' : hov ? W8.gold : W8.text, 'center');
      if (q.cmp != null) D.text(ctx, q.cmp > 0 ? '▲' : q.cmp < 0 ? '▼' : '=', q.x + q.w - 12, q.y + 3, q.cmp > 0 ? '#58f898' : q.cmp < 0 ? '#f85838' : '#c8d0e8');
    });
    if (this.shop && !this.sub) { // what it is, and who could use it
      var rs = this.rows(), r = rs[Math.max(0, bs[this.hov] && bs[this.hov].row ? bs[this.hov].k : this.cur)], it2 = r && DS.DATA.items[r.id];
      D.win8(ctx, RX, 200, RW, 50);
      if (it2) {
        D.wrap(it2.desc || '', RW - 18).slice(0, 2).forEach(function (l, i) { D.text(ctx, l, RX + 9, 206 + i * 10, '#e0c8a0'); });
        if (gear(it2)) { var x = RX + 9; st.party.forEach(function (h) { var ok = !h.dead && DS.R.canEquip(h, it2), c = ok ? C.better(h, it2) : null, lb = h.name + (ok ? ' ' + (c > 0 ? '▲' : c < 0 ? '▼' : '=') : ''); D.text(ctx, lb, x, 228, !ok ? '#6c6c84' : c > 0 ? '#58f898' : c < 0 ? '#f85838' : '#c8d0e8'); x += D.textWidth(lb) + 10; }); }
        else if (!rs.length) D.text(ctx, this.tab === 'sell' ? (this.shop.nothingText || 'You have nothing I want.') : '', RX + 9, 206, '#9c9cb4');
      } else D.text(ctx, this.tab === 'sell' ? (this.shop.nothingText || 'You have nothing I want.') : 'The shelves are bare.', RX + 9, 206, '#9c9cb4');
    }
    ctx.fillStyle = 'rgba(4,3,10,.95)'; ctx.fillRect(0, D.H - 14, D.W, 14);
    D.hint(ctx, 'click a choice · arrows choose · E pick · X back', D.W / 2, D.H - 11, '#9a96a8', 'center');
  };

  // ---------------------------------------------------------------- at a counter or a door: the screen up, the floor waiting under it (js/town.js T.fire)
  C.talk = function* (B, id, door) {
    var N = ((DS.DATA || {}).npcs || {})[id] || {}, T = D.town, kp = B.roam && D.roam.def && D.roam.def.keeper && D.roam.def.keeper.id === id ? D.roam.def : null;
    var nm = (door && door.name) || T.KEEPER['shop:' + id] || T.KEEPER['warp:' + id] || T.KEEPER['keeper:' + id] || N.name || id;
    var v = C.VENDORS[id] || {}, shop = (DS.DATA.shops || {})[v.shop];
    var o = { id: id, name: nm, place: kp ? kp.name : (door && door.name) || nm, what: kp ? (kp.name !== nm ? nm + ' at the counter' : '') : (door && door.what) || '' };
    o.script = v.script === 'winters' ? function (sc) { return C.winters(sc); } : shop && !v.own ? function (sc) { return C.shopkeeper(sc, B, id); } : function (sc) { return C.keeper(sc, B, id); };
    if (shop) o.place = shop.name;
    var sc = new Counter(B, o); D.push(sc);
    while (!sc.done) yield 1;
    if (sc.regear && B.roam && D.roam.regear) D.roam.regear(B); // (bought and put on: the floor's figures wear it -- js/roam.js R.regear)
  };
  // a keeper whose sales are to come: their word (and its doing) -- a shopkeeper with no word of their own says their first-game shop's greeting -- then a line
  // for the counter (js/town.js T.fire's, as before the screen)
  C.keeper = function* (sc, B, id) {
    if (C.OWN[id]) { yield sc.say(['{g}Griz\'s own: the counter waits on his word.{/}'], 'welcoming'); return; }
    var said = C.words(B, id), wait = /^\{g\}\(Their scene/.test(said[0] || ''), shop = (DS.DATA.shops || {})[id];
    if (wait && shop && shop.greeting) { said = [shop.greeting]; wait = false; }
    yield sc.say((wait ? [] : said).concat([wait ? '{g}Their scene is the 8-bit\'s; on the grid it is to come.{/}' : '{g}The counter -- buying and selling -- is to come.{/}']), wait ? 'attentive' : 'welcoming');
  };

  // a vendor with a shop and no scene of its own (one line in C.VENDORS opens it): their word, then THE SHELVES / LEAVE -- the first game's shop on this screen
  C.shopkeeper = function* (sc, B, id) {
    var said = C.words(B, id), shop = (DS.DATA.shops || {})[C.VENDORS[id].shop];
    if (/^\{g\}\(Their scene/.test(said[0] || '')) said = [shop.greeting || 'Welcome.'];
    yield sc.say(said, 'welcoming');
    while ((yield sc.ask(said[said.length - 1], ['THE SHELVES', 'LEAVE'])) === 0) yield sc.shelves(C.VENDORS[id].shop);
  };

  // ---------------------------------------------------------------- Ambrose Winters (the first game's js/events.js S.winters and S.wintersWork, on the grid). His words
  // are the first game's (content/text.json winters.*); the one new line is the JOURNAL's hint, the grid's menu named (invented.json winters-journal-grid)
  C.winters = function* (sc) {
    var st = sc.st, f = st.flags;
    if (!f.wintersMet) {
      f.wintersMet = 1;
      yield sc.say(L('winters.first'), 'attentive');
      yield sc.say(L('winters.words'), 'welcoming');
      if (st.party.some(function (h) { return (h.key || h.id) === 'vivian' && !h.dead; })) yield sc.say(L('winters.vivian'), 'skeptical');
    }
    // (an errand brought back closes as soon as you walk in, and the next one comes with it -- the first game's playtest 09-25 round four)
    var back = (f.wErrA && !f.wErrADone && f.wValued) || (f.wErrB && !f.wErrBDone && f.wPaid);
    if (back) {
      yield* C.wintersWork(sc);
      if (f.wErrADone && !f.wErrB && (yield* C.wintersWork(sc)) === 'leave') return;
    }
    while (true) {
      var a = yield sc.ask(L('winters.menu'), ['WORK', 'THE SHELVES', 'LEAVE']);
      if (a === 0) { if ((yield* C.wintersWork(sc)) === 'leave') break; }
      else if (a === 1) {
        if (!f.wErrADone) { yield sc.say(L('winters.shelvesShut'), 'concerned'); continue; }
        yield sc.shelves('winters');
      } else break;
    }
  };
  C.wintersWork = function* (sc) {
    var st = sc.st, f = st.flags, items = DS.DATA.items;
    if (!f.wErrA) {
      yield sc.say(L('winters.errandA'), 'attentive');
      f.wErrA = 1; give(st, 'estatepapers', 1); D.sfx('chest');
      yield sc.say(L('g.got', { item: items.estatepapers.name }));
      if (!f.pin) f.pin = 'errands'; // (the first errand teaches the journal: the first game's playtest 09-25)
      yield sc.say(D.keys(C.LINES.journalGrid));
      return 'leave';
    }
    if (!f.wErrADone) {
      if (!f.wValued) { yield sc.say(L(f.wSealed ? 'winters.errandAtoCasper' : 'winters.errandAtoAndroit'), 'skeptical'); return; }
      take(st, 'estatepapers', 1); f.wErrADone = 1;
      yield sc.say(L('winters.errandAdone'), 'welcoming');
      st.silver(12); D.sfx('coin'); yield sc.say(L('g.foundSilver', { n: 12 }));
      return;
    }
    if (!f.wErrB) {
      yield sc.say(L('winters.errandB'), 'attentive');
      f.wErrB = 1; give(st, 'debtpurse', 1); D.sfx('chest');
      yield sc.say(L('g.got', { item: items.debtpurse.name }));
      return 'leave';
    }
    if (!f.wErrBDone) {
      if (!f.wPaid) { yield sc.say(L(f.wSigned ? 'winters.errandBtoBrennan' : 'winters.errandBtoMical'), 'skeptical'); return; }
      f.wErrBDone = 1;
      yield sc.say(L('winters.errandBdone'), 'welcoming');
      st.silver(20); give(st, 'potion', 1); D.sfx('coin');
      yield sc.say([L('g.foundSilver', { n: 20 }), L('g.got', { item: items.potion.name })]);
      yield sc.say(C.renown(st, 1, 'renown.errandB'), 'welcoming');
      return;
    }
    yield sc.say(L('winters.noWork'), 'concerned');
  };

  // ---------------------------------------------------------------- the house's JOURNAL (the one menu's JournalPage, js/menu.js): the quests the grid plays, by the
  // first game's own records (content/quests.json: show, done, steps' `if` and `where`), on what the party holds now. The rest of the first game's quests are its own
  C.QUESTS = ['errands'];
  C.quests = function (st) {
    return (DS.DATA.quests || []).filter(function (q) { return C.QUESTS.indexOf(q.id) >= 0 && C.cond(q.show, st); }).map(function (q) {
      var done = C.cond(q.done, st), step = !done && (q.steps || []).filter(function (s) { return C.cond(s['if'], st); })[0];
      return { id: q.id, name: q.name, text: q.text, doneText: q.doneText, done: done, where: step && step.where, step: step || null };
    });
  };
  C.journal = function (B) {
    var st = C.state(B); if (!st) return null;
    var titles = (DS.DATA.config || {}).renownTitles || ['a stranger'], r = C.renownOf(st);
    return {
      renown: r, title: titles[Math.min(r, titles.length - 1)], pin: st.flags.pin || null, quests: C.quests(st),
      rumors: (DS.DATA.rumors || []).filter(function (x) { return st.flags['heard:' + x.id]; }).map(function (x) { return x.t; }),
      setPin: function (id) { if (id) { st.flags.pin = id; D.sfx('confirm'); } else { delete st.flags.pin; D.sfx('cancel'); } }
    };
  };
  // the pinned quest's next step, as a door of the town (js/town.js T.DOORS) and the person behind it
  C.pinned = function (st) {
    var q = st && st.flags.pin && C.quests(st).filter(function (x) { return x.id === st.flags.pin && !x.done; })[0], s = q && q.step;
    if (!s) return null;
    var who = s.npc || s.door, door = D.town.DOORS.filter(function (d) { return d.id.split(':')[1] === who; })[0];
    return door ? { q: q, who: who, door: door.id } : null;
  };
  // on the town floor: a gold marker over the next door -- or, in a room, over the keeper it wants, else over the way out -- the first game's pinned marker (js/world.js
  // DS.pinnedQuest: "a marker bobs over whoever (or whatever) it wants next. On another map, the marker sits on the way there"), held at the screen's edge, pointing,
  // when the square is off it (the town is bigger than the screen); the step in words is the JOURNAL's NEXT line, as the first game's (RULED 10-21, Griz: "should
  // function the same as the 8-bit unless we add a feature")
  C.paintPin = function (ctx, B) {
    var R = D.roam, R0 = B && B.roam, def = R && R.def; if (!R0 || !def || !def.town || B.menu) return;
    var st = C.state(B), p = C.pinned(st); if (!p) return;
    var sq = null;
    if (def.room) sq = def.keeper && def.keeper.id === p.who ? def.keeper.at : (def.doors || [])[0];
    else sq = def.marks && def.marks.doors && def.marks.doors[p.door];
    if (!sq) return;
    var iso = D.iso, c = iso.center(sq[0], sq[1], (B.map && B.map.gz ? B.map.gz(sq[0], sq[1]) : 0) + 30), s = iso.toScreen(c.x, c.y);
    var m = 14, x = Math.max(m, Math.min(D.W - m, s.x)), y = Math.max(m + 14, Math.min(D.H - 40, s.y)), off = x !== s.x || y !== s.y, bob = Math.sin(B.t / 10) * 2;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y + (off ? 0 : bob)));
    if (off) ctx.rotate(Math.atan2(s.y - y, s.x - x) - Math.PI / 2);
    ctx.fillStyle = '#1a1206'; ctx.beginPath(); ctx.moveTo(-7, -9); ctx.lineTo(7, -9); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = D.WIN8.gold; ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(5, -8); ctx.lineTo(0, 1); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
})();
