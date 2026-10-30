/* DEEP16 -- THE COMPANY: the first game's opening on the second game (10-28, the opening seat, started by the lanes desk on Griz's "Start the seat"). His words,
   10-28: "Getting to the point we need to add the select character part to 'new game' and restore the 8 bit missions to form the party"; "Barley and Lyman should
   be restored during the restoration of the company mission from the first game"; and to the desk's offer to talk it through, "what part of cloning the 8 bit
   beginning mission need discuss?". So a clone, not a redesign.

   NEW GAME (js/house.js H.Title) picks one lead of the four as the first game's does (js/scenes.js LeadSelect: CHOOSE WHO YOU ARE, the four, the sheet and the
   blurb, "Begin as ...?"), says its opening's words (content/text.json intro.*, js/events.js EV.intro), and that one walks in alone at Silverton's west gate
   (H.fresh(lead)). The quest Company (content/quests.json `company`) is in the JOURNAL from the first step, and each of the other three stands where the first
   game puts them and is hired by its own scene and terms (js/events.js S.hireBarley, S.hireAurdin, S.hireVivian, S.hireLymen; EV.hire): Vivian selling candles
   on vice row and Aurdin outside Aldwin's chapel, on the town's floor (js/town.js T.PLACE, by the wiki's pins 23 and 30); Barley on the bench by Korvin's slate
   and Lymen in the Hex (js/hex.js HX.PEOPLE) -- Barley's five fronted and his bout on the Hex's sand at once (HX.bout), Lymen once the party has a name (the save's
   renown: js/counter.js C.renown). Each hire is had on the counter screen (js/counter.js C.Counter), the hero's own face where a keeper's portrait stands; the
   one hired joins the party on the floor where they stood (CO.join) and in the save. A save from before, its four hired, keeps its four (H.fill). */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, I = D.input, H = D.house, C = D.counter, T = D.town, HX = D.hex;
  if (!H || !C || !T) return;
  var CO = D.company = {};
  var L = function (k, o) { return C.L(k, o); };
  CO.IDS = H.HEROES.slice();
  CO.QUEST = 'company';
  // the first game's hire people by their ids (content/npcs.json; where they stand, content/maps/silverton.json and hex.json): the hero each one is, and the place
  // the screen names
  CO.HIRES = { barleyBench: 'barley', aurdinChapel: 'aurdin', vivian: 'vivian', lymenHex: 'lymen' };
  CO.PLACE = { barleyBench: 'The Hex', lymenHex: 'The Hex', aurdinChapel: 'Aldwin\'s mission chapel', vivian: 'Vice row' };
  CO.step = function (npc) { var q = (DS.DATA.quests || []).filter(function (x) { return x.id === CO.QUEST; })[0]; return (q && (q.steps || []).filter(function (s) { return s.npc === npc; })[0]) || null; };
  function idOf(h) { return h.key || h.id; }

  // ---------------------------------------------------------------- the hero as the first game hires them (EV.hire): at their own level, or one under the lead's, whichever
  // is more -- as the second game starts a hero (H.start: the pages the world gives later held back)
  CO.sheetFor = function (id, leadLvl) {
    var R = DS.R, d = DS.DATA.heroes[id], lvl = Math.max(d.level, Math.min(R.cap(), (leadLvl || d.level) - 1));
    return H.start(R.makeHero(id, lvl));
  };
  function leadOf(st) { var rec = H.playing && H.cur, id = rec ? rec.lead : null; return st.party.filter(function (h) { return idOf(h) === id; })[0] || st.party[0] || null; }
  // one hired joins the floor's party where the one standing for them stood (or beside the token), and the save: the sheet into the house's party and `hired`, and
  // into what the floor's own fights take in (js/roam.js R.pullIn0, js/hex.js HX.bout: R.emb.save). Returns the figure
  CO.join = function (B, h, npc) {
    var R = D.roam, R0 = B.roam, t = R0.token, id = idOf(h);
    var was = npc ? B.units.filter(function (u) { return u.npc === npc; })[0] : null, at = was ? [was.x, was.y] : CO.beside(B);
    if (was) B.units.splice(B.units.indexOf(was), 1);
    if (npc && R.def && R.def.src8) R.def.src8.triggers = R.def.src8.triggers.filter(function (tr) { return tr.npc !== npc; });
    var u = D.save.unitOf(h, false, B.fight);
    u.anim = 'idle'; u.animT = B.t || 0; u.flash = 0; u.reaction = 1; u.conds = u.conds || {}; u.x = at[0]; u.y = at[1]; u.facing = t.facing;
    u.wings = R.ringWings ? !!R.ringWings(u) : false; u.flies = false; u.fz = 0;
    B.units.push(u); R0.members.push(u); R0.rest = R0.members.slice(1);
    var stored = D.store.get(R.KEY) || {}, k = R0.members.length - 2; R0.form[u.id] = stored[u.id] || R.FORM0[k] || [-(k + 1), 0];
    // walking, the party is the token: the one hired walks inside it with the rest (10-28, his "Barley remains standing in the hex after joining the party" -- he was left on the
    // bench's square, the floor's figure for him gone and his own in its place; R.into, as the floor folds the rest at its start)
    if (R0.mode !== 'fight' && R.into) R.into(B, [u]);
    D.grid.setup(B.map, B.units); B.cache = null; if (R.regear) R.regear(B);
    if (H.playing && H.cur) { if (!H.cur.party.some(function (x) { return idOf(x) === id; })) H.cur.party.push(h); if (H.cur.hired.indexOf(id) < 0) H.cur.hired.push(id); }
    var es = R.emb && R.emb.save;
    if (es && Array.isArray(es.party) && !es.party.some(function (x) { return idOf(x) === id; })) es.party.push(h);
    if (es && Array.isArray(es.hired) && es.hired.indexOf(id) < 0) es.hired.push(id);
    return u;
  };
  CO.beside = function (B) { var t = B.roam.token, q = [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]].map(function (o) { return [t.x + o[0], t.y + o[1]]; }).filter(function (p) { return D.grid.canStand(t, p[0], p[1]); })[0]; return q || [t.x, t.y]; };

  // ---------------------------------------------------------------- the talk: the counter screen, the hero's face where a keeper's portrait stands -- Aurdin's portrait
  // (js/counter.js C.heroPortrait) at twice its size, the others their own figure at three times, turned to the talk (C.drawHeroFace, facing south-west)
  CO.face = function (ctx, h, x, y, w, hh, t) {
    var pt = C.heroPortrait(h);
    if (pt) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(x + w / 2), Math.round(y + hh + 1)); ctx.scale(2, 2); var ok = C.drawPortrait(ctx, pt, 'idle', 0, 0, 0); ctx.restore(); if (ok) return; }
    var F = C.HERO_FACE, f0 = F.facing; F.facing = D.spr.facingFor(-1, 1);
    try { C.drawHeroFace(ctx, h, x, y, w, hh, t); } finally { F.facing = f0; }
  };
  CO.talk = function* (B, npc, h, script) {
    var step = CO.step(npc), wh = step ? step.where : '', RW = C.LAYOUT.words[2];
    if (D.textWidth(wh) > RW) wh = wh.split('. ')[0].replace(/\.?$/, '.'); // (the JOURNAL's step, the first game's words: its first sentence where the whole will not fit the line)
    if (D.textWidth(wh) > RW) wh = '';
    var sc = new C.Counter(B, { id: npc, name: h.name, place: CO.PLACE[npc] || h.name, what: wh, script: script,
      pic: function (ctx, x, y, w, hh, t, cy) { CO.face(ctx, h, x, y, w, (cy || y + hh) - y, t); } });
    if (sc.done) return sc;
    D.push(sc); while (!sc.done) yield 1;
    return sc;
  };
  // a word with one of the four not yet hired (T.fire, below): their scene, then (Barley's) the bout
  CO.hire = function* (B, npc) {
    var id = CO.HIRES[npc], st = C.state(B); if (!id || !st || !CO.SCENES[id]) return;
    var R0 = B.roam, t = R0.token, was = B.units.filter(function (u) { return u.npc === npc; })[0];
    if (was && !was.holdFacing) was.facing = D.spr.facingFor(t.x - was.x, t.y - was.y);
    var ld = leadOf(st), h = CO.sheetFor(id, ld ? ld.lvl : 0), out = { npc: npc, u: null, bout: null };
    yield* CO.talk(B, npc, h, function (sc) { return CO.SCENES[id](sc, B, h, out); });
    if (out.bout && out.u) yield* CO.bout(B, h, out);
  };

  // ---------------------------------------------------------------- the four scenes: the first game's (js/events.js), line for line, in its words (content/text.json hire.*)
  function pay(st, n) { if (st.silver() < n) return false; st.silver(-n); D.sfx('coin'); return true; } // (EV.pay)
  function* joins(sc, B, h, out) { // (EV.hire: the party full, else the one hired in and the line)
    if (B.roam.members.filter(function (u) { return u.src; }).length >= 4) { yield sc.say(L('g.partyFull')); return false; }
    out.u = CO.join(B, h, out.npc); D.sfx('levelup');
    yield sc.say(L('g.joins', { name: h.name, lvl: h.lvl }));
    return true;
  }
  CO.SCENES = {
    barley: function* (sc, B, h, out) { // (S.hireBarley)
      yield sc.say(C.words(B, out.npc));
      if ((yield sc.ask(L('hire.barleyAsk'), ['FRONT 5 SP', 'NOT NOW'])) !== 0) return;
      if (!pay(sc.st, 5)) { yield sc.say(L('g.poor')); return; }
      yield sc.say(L('hire.barleyYes'));
      if (!(yield* joins(sc, B, h, out))) return;
      // your five puts him on the card tonight: his bout, straight away (RULED 09-24, Griz) -- on the Hex's sand as the card's bouts are, the simple screen or the
      // grid as Korvin's slate asks it (js/hex.js HX.card)
      var simple0 = !!D.simple && D.simple.on(), how = yield sc.ask(L('hire.barleyBout'), ['FIGHT', simple0 ? 'ON THE GRID' : 'SIMPLE']);
      out.bout = { simple: how === 1 ? !simple0 : simple0 };
    },
    aurdin: function* (sc, B, h, out) { // (S.hireAurdin)
      yield sc.say(C.words(B, out.npc));
      if ((yield sc.ask(L('hire.aurdinAsk'), ['PAY 20 SP', 'NOT NOW'])) !== 0) return;
      if (!pay(sc.st, 20)) { yield sc.say(L('g.poor')); return; }
      yield sc.say(L('hire.aurdinYes'));
      yield* joins(sc, B, h, out);
    },
    vivian: function* (sc, B, h, out) { // (S.hireVivian)
      yield sc.say(C.words(B, out.npc));
      if ((yield sc.ask(L('hire.vivianAsk'), ['BUY A CANDLE (1 SP)', 'NOT NOW'])) !== 0) return;
      if (!pay(sc.st, 1)) { yield sc.say(L('g.poor')); return; }
      C.give(sc.st, 'candle', 1);
      if ((yield sc.ask(L('hire.vivianAsk2'), ['COME ALONG?', 'JUST THE CANDLE'])) !== 0) { yield sc.say(L('hire.vivianNo')); return; }
      yield sc.say(L('hire.vivianYes'));
      yield* joins(sc, B, h, out);
    },
    lymen: function* (sc, B, h, out) { // (S.hireLymen: a name first -- renown 1)
      yield sc.say(C.words(B, out.npc));
      if (C.renownOf(sc.st) < 1) { yield sc.say(L('hire.lymenWait')); return; }
      if ((yield sc.ask(L('hire.lymenAsk'), ['STAND WITH US', 'NOT NOW'])) !== 0) return;
      yield sc.say(L('hire.lymenYes'));
      yield* joins(sc, B, h, out);
    }
  };
  // Barley's bout (the first game's: the card's bruiser, Barley alone, no running, up at 1 if he goes down): on the Hex's sand (HX.bout, the rest at the rail); won, the
  // fallen's XP and spoils as a bout's (HX.settle's way) and your five back -- "Five in, ten out"; lost, he gets up and walks it off with you
  CO.BOUT = { id: 'barleyhire', label: 'BARLEY, ON THE CARD TONIGHT', foe: 'cardbruiser', stake: 0, win: 5 };
  if (DS.DATA.text && DS.DATA.text['hire.barleyBout'] && !DS.DATA.text['hex.intro.barleyhire']) DS.DATA.text['hex.intro.barleyhire'] = DS.DATA.text['hire.barleyBout']; // (the bout's card opens on the first game's own line: HX.bout reads hex.intro.<the bout's id>)
  CO.bout = function* (B, h, out) {
    var u = out.u, R = D.roam, R0 = B.roam;
    var res = yield* HX.bout(B, { c: CO.BOUT, u: u, fronted: false, simple: out.bout.simple });
    var st = C.state(B), lines = [];
    if (res === 'won') {
      st.silver(CO.BOUT.win); D.sfx('coin');
      var m8 = R.mon8 ? R.mon8(CO.BOUT.foe) : null;
      if (m8) { DS.R.tally(R0.kills, [CO.BOUT.foe]); var p1 = HX.payOne(B, u, m8.xp || 0); if (p1.length) lines.push(p1.join(' ')); var sp = R.spoils(B, [{ m: m8, id: CO.BOUT.foe }]); if (sp && sp.length) lines.push(sp.join(' ')); }
      lines.push(L('hire.barleyWon'));
    } else lines.push(L('hire.barleyLost'));
    CO.boutRes = res;
    yield* CO.talk(B, out.npc, h, function (sc) { return (function* () { for (var i = 0; i < lines.length; i++) yield sc.say(lines[i]); })(); });
    if (res === 'lost' && HX && HX.toDavos) yield* HX.toDavos(B, u); // (down on the sand: out at Davos Kren's door, stitched -- js/hex.js HX.toDavos, his 10-28 "kick the party to krenn")
  };

  // ---------------------------------------------------------------- on the floor: a word with one of the four (the town's and the Hex's), and the four standing in their
  // own figures where the town stands them (the first game's look for each: js/save.js SV.look), not the street's stand-in
  var fire0 = T.fire;
  T.fire = function* (B, trig) {
    if (trig.town === 'talk' && CO.HIRES[trig.npc]) { yield* CO.hire(B, trig.npc); return; }
    yield* fire0.apply(this, arguments);
  };
  var people0 = T.people;
  T.people = function (B) {
    people0.apply(this, arguments);
    var want = [];
    (B.units || []).forEach(function (u) { var id = u.npc && CO.HIRES[u.npc], lk = id && D.save.look ? D.save.look(id, null, null) : null; if (lk && lk.sheet && D.SHEETS && D.SHEETS[lk.sheet]) { u.sheet = lk.sheet; want.push(lk.sheet); } });
    if (want.length && D.spr.prefetch) D.spr.prefetch(want);
  };

  // ---------------------------------------------------------------- the JOURNAL: Company first, as the first game lists it; its done is the first game's `party>=4`
  // (js/world.js DS.cond: the party's count -- the house's save in the house, else the floor's), and a pinned step's gold marker over the one it wants, or on the way there
  if (C.QUESTS.indexOf(CO.QUEST) < 0) C.QUESTS.unshift(CO.QUEST);
  var cond0 = C.cond;
  C.cond = function (c, st) {
    if (c && /party\s*(>=|<=|>|<|=)\s*\d/.test(c)) {
      var rec = H.playing && H.cur, n = rec ? rec.party.length : ((st && st.party) || []).length;
      c = String(c).replace(/party\s*(>=|<=|>|<|=)\s*(\d+)/g, function (m, op, k) { k = +k; var v = op === '>=' ? n >= k : op === '<=' ? n <= k : op === '>' ? n > k : op === '<' ? n < k : n === k; return v ? '' : 'flag:\u0000'; }); // ('' holds; a flag never set does not)
    }
    return cond0.call(this, c, st);
  };
  // the square a Company step marks (the first game's DS.pinnedQuest: "a marker bobs over whoever (or whatever) it wants next. On another map, the marker sits on the
  // way there"): the one it wants where they stand; from the town, the Hex's front doors for one inside it; from a room, its door; inside the Hex, its spiral down to
  // the ground floor or its front doors out
  CO.markAt = function (B, s) {
    var def = D.roam.def, M = def.marks || {}, folk = function () { var u = B.units.filter(function (x) { return x.npc === s.npc; })[0]; return u ? [u.x, u.y] : null; };
    if (def.hexIn) return s.map === 'hex' ? (def.hexIn === 1 ? folk() : HX.spiralSq()[0]) : (HX.DOORS.front || [])[0];
    if (def.room) return (def.doors || [])[0] || null;
    return s.map === 'hex' ? (M.hexFront || [])[0] || null : folk();
  };
  var paint0 = C.paintPin;
  C.paintPin = function (ctx, B) {
    var R = D.roam, R0 = B && B.roam, def = R && R.def; if (!R0 || !def || !def.town || B.menu) return paint0.apply(this, arguments);
    var st = C.state(B), q = st && st.flags.pin === CO.QUEST ? C.quests(st).filter(function (x) { return x.id === CO.QUEST && !x.done; })[0] : null, s = q && q.step;
    if (!s || !CO.HIRES[s.npc]) return paint0.apply(this, arguments);
    var sq = CO.markAt(B, s); if (!sq) return;
    CO.marked = sq.slice(); // (for the bench)
    var iso = D.iso, c = iso.center(sq[0], sq[1], (B.map && B.map.gz ? B.map.gz(sq[0], sq[1]) : 0) + 30), p = iso.toScreen(c.x, c.y); // (C.paintPin's marker, as it draws it)
    var m = 14, x = Math.max(m, Math.min(D.W - m, p.x)), y = Math.max(m + 14, Math.min(D.H - 40, p.y)), off = x !== p.x || y !== p.y, bob = Math.sin(B.t / 10) * 2;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y + (off ? 0 : bob)));
    if (off) ctx.rotate(Math.atan2(p.y - y, p.x - x) - Math.PI / 2);
    ctx.fillStyle = '#1a1206'; ctx.beginPath(); ctx.moveTo(-7, -9); ctx.lineTo(7, -9); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = D.WIN8.gold; ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(5, -8); ctx.lineTo(0, 1); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  // ---------------------------------------------------------------- CHOOSE WHO YOU ARE (the first game's lead select, js/scenes.js LeadSelect): the four in their own
  // figures, the one chosen walking; below, the sheet -- the name, the class line, the six scores, HP, AC and the weapon -- and the blurb (content/heroes.json). Arrows
  // and E, or a click on one; then the first game's "Begin as ...? The other three can be found in play, and hired." -- BEGIN or BACK. X back to the title
  var BX = 16, BW = 106, BG = 8, BY = 22, BH = 116, SY = 144, SH = 108;
  function Pick() {
    var self = this; this.kind = 'leadpick'; this.opaque = true; this.t = 0; this.ask = null; this.ah = 0;
    var pre = /[?&]lead=(barley|aurdin|vivian|lymen)\b/i.exec(location.search || ''); this.i = pre ? CO.IDS.indexOf(pre[1].toLowerCase()) : 0; // (&lead=: the cursor starts there, as the first game's)
    this.heroes = CO.IDS.map(function (id) { return H.start(DS.R.makeHero(id)); });
    this.sheets = this.heroes.map(function (h) { var lk = D.save.look ? D.save.look(h.id, null, h) : null; return (lk && lk.sheet) || h.id + '_p0'; });
    if (D.spr.prefetch) D.spr.prefetch(this.sheets);
    this.box = function (k) { return { x: BX + k * (BW + BG), y: BY, w: BW, h: BH }; };
  }
  Pick.prototype.enter = function () { try { D.music('title'); } catch (e) { } };
  Pick.prototype.prompt = function () { var d = DS.DATA.heroes[CO.IDS[this.i]]; return 'Begin as ' + d.name + '? The other three can be found in play, and hired.'; }; // (js/scenes.js LeadSelect, its own words)
  Pick.prototype.askBox = function () { var w = 300, ls = D.wrap(this.prompt(), w - 20), h = 20 + ls.length * 10 + 26, x = (D.W - w) / 2, y = (D.H - h) / 2; return { x: x, y: y, w: w, h: h, ls: ls, bs: [{ x: x + w / 2 - 96, y: y + h - 22, w: 88, h: 15, label: 'BEGIN', k: 0 }, { x: x + w / 2 + 8, y: y + h - 22, w: 88, h: 15, label: 'BACK', k: 1 }] }; };
  Pick.prototype.begin = function () { var id = CO.IDS[this.i]; D.sfx('confirm'); D.scenes.length = 0; D.push(new Opening(id)); };
  Pick.prototype.update = function () {
    this.t++; var m = I.mouse, self = this;
    if (this.ask) {
      var ab = this.askBox(), hit = m.inside ? ab.bs.filter(function (b) { return m.x >= b.x && m.x < b.x + b.w && m.y >= b.y && m.y < b.y + b.h; })[0] : null;
      if (hit && (m.moved || m.click)) this.ah = hit.k;
      if (I.repeat('left') || I.repeat('right') || I.repeat('up') || I.repeat('down')) { this.ah = 1 - this.ah; D.sfx('cursor'); }
      var go = (m.click && hit) ? hit.k : I.pressed('a') ? this.ah : I.pressed('b') || m.rclick ? 1 : -1;
      if (go === 0) { this.begin(); return; }
      if (go === 1) { D.sfx('cancel'); this.ask = null; }
      return;
    }
    if (I.repeat('right') || I.repeat('down')) { this.i = (this.i + 1) % 4; D.sfx('cursor'); }
    if (I.repeat('left') || I.repeat('up')) { this.i = (this.i + 3) % 4; D.sfx('cursor'); }
    if (m.inside) for (var k = 0; k < 4; k++) { var b = this.box(k); if (m.x >= b.x && m.x < b.x + b.w && m.y >= b.y && m.y < b.y + b.h) { if (m.moved && this.i !== k) { this.i = k; D.sfx('cursor'); } if (m.click) { this.i = k; this.choose(); return; } } }
    if (I.pressed('b') || m.rclick) { D.sfx('cancel'); D.scenes.length = 0; D.push(new H.Title()); return; }
    if (I.pressed('a')) this.choose();
  };
  Pick.prototype.choose = function () { D.sfx('confirm'); this.ask = true; this.ah = 0; };
  Pick.prototype.draw = function (ctx) {
    var self = this, W8 = D.WIN8, R = DS.R;
    var g = ctx.createLinearGradient(0, 0, 0, D.H); g.addColorStop(0, '#05061a'); g.addColorStop(1, '#1b2240'); ctx.fillStyle = g; ctx.fillRect(0, 0, D.W, D.H);
    D.text(ctx, '{y}CHOOSE WHO YOU ARE{/}', D.W / 2, 8, W8.text, 'center');
    this.heroes.forEach(function (h, k) {
      var b = self.box(k), sel = k === self.i, sh = self.sheets[k], an = sel && D.SHEETS[sh] && D.SHEETS[sh].anims.walk ? 'walk' : 'idle';
      D.win8(ctx, b.x, b.y, b.w, b.h, sel ? '#26206a' : '#0b1430');
      ctx.save(); ctx.beginPath(); ctx.rect(b.x + 3, b.y + 3, b.w - 6, b.h - 20); ctx.clip(); ctx.imageSmoothingEnabled = false;
      ctx.translate(Math.round(b.x + b.w / 2), b.y + b.h - 22); ctx.scale(2, 2); D.spr.draw(ctx, sh, an, 0, self.t, 0, 0, {});
      ctx.restore();
      D.text(ctx, sel ? '{y}' + h.name + '{/}' : h.name, b.x + b.w / 2, b.y + b.h - 14, W8.text, 'center');
    });
    var id = CO.IDS[this.i], d = DS.DATA.heroes[id], h = this.heroes[this.i];
    D.win8(ctx, BX, SY, D.W - 2 * BX, SH, '#0b1430');
    D.text(ctx, '{y}' + (d.fullName || d.name) + '{/}', BX + 9, SY + 7, W8.text);
    D.text(ctx, d.classLine || '', BX + 9, SY + 19, '#c8d0e8');
    D.text(ctx, R.ABIL.map(function (a) { return a.toUpperCase() + ' ' + h.abil[a]; }).join('   '), BX + 9, SY + 32, W8.text);
    D.text(ctx, 'HP ' + h.maxhp + '   AC ' + R.ac(h) + '   ' + R.weaponOf(h).name, BX + 9, SY + 44, W8.text);
    D.wrap(d.blurb || '', D.W - 2 * BX - 18).slice(0, 5).forEach(function (l, k) { D.text(ctx, l, BX + 9, SY + 58 + k * 10, '#e0c8a0'); });
    if (this.ask) {
      var ab = this.askBox(); ctx.fillStyle = 'rgba(4,3,10,.6)'; ctx.fillRect(0, 0, D.W, D.H);
      D.win8(ctx, ab.x, ab.y, ab.w, ab.h);
      ab.ls.forEach(function (l, k) { D.text(ctx, l, ab.x + 10, ab.y + 8 + k * 10, W8.text); });
      ab.bs.forEach(function (b) { var on = b.k === self.ah; ctx.fillStyle = on ? W8.sel : 'rgba(16,18,58,.92)'; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeStyle = on ? W8.gold : W8.mid; ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1); D.text(ctx, b.label, b.x + b.w / 2, b.y + 3, on ? W8.gold : W8.text, 'center'); });
    }
    ctx.fillStyle = 'rgba(4,3,10,.95)'; ctx.fillRect(0, D.H - 14, D.W, 14);
    D.hint(ctx, this.ask ? 'click a choice · arrows choose · E pick · X back' : 'click one · arrows choose · E confirm · X back', D.W / 2, D.H - 11, '#9a96a8', 'center');
  };
  CO.Pick = Pick;
  CO.pick = function () { return new Pick(); };

  // ---------------------------------------------------------------- the opening (EV.intro): Silverton, the lead's own page, the motive -- a page each, E or a click on,
  // X past them -- then the lead alone at the west gate. (Its fourth page, the 8-bit's keys, is the floor's own: its first card says the grid's.)
  CO.OPENING = function (lead) { return ['intro.world', 'intro.' + lead, 'intro.motive']; };
  function Opening(lead) {
    this.kind = 'opening'; this.opaque = true; this.t = 0; this.lead = lead; this.k = 0;
    this.pages = CO.OPENING(lead).map(function (key) { return [].concat(L(key)); });
    var lk = D.save.look ? D.save.look(lead, null, null) : null; this.sheet = (lk && lk.sheet) || lead + '_p0'; if (D.spr.prefetch) D.spr.prefetch([this.sheet]);
  }
  Opening.prototype.box = function () { var w = 340, x = (D.W - w) / 2; return { x: x, y: 56, w: w, h: 150 }; }; // (narrow enough that the lead stands whole in the margin on its own page)
  Opening.prototype.btn = function () { var b = this.box(); return { x: b.x + b.w - 78, y: b.y + b.h - 22, w: 70, h: 15 }; };
  Opening.prototype.go = function () { D.sfx('confirm'); var nr = CO.startAt(H.fresh(this.lead)); nr.newGame = 1; H.begin(nr, 0); }; // (NEW GAME's own: its SAVE writes his slots -- js/house.js H.begin's staged)
  // where the lead starts: where their page puts them, not the west gate (10-28, Griz: "Aurdin should start near where the story says he slept. Vivian should start near her
  // mom's stall. Lymen in front of Urtusk and Barley near kess."): Aurdin where he stands outside Aldwin's chapel ("Aldwin's chapel floor was free"), Vivian before Marta's
  // stall, Lymen before Papa Urtusk at the Hex's front, Barley at the door of Kess's flop-cellars on the Shaft Rows -- each facing them (CO.stage's way: rec.at.sq)
  CO.START = { aurdin: { on: 'aurdinChapel' }, vivian: { stall: 'marta' }, lymen: { near: 'papa' }, barley: { door: 'keeper:kess' } };
  CO.startAt = function (rec) {
    var R = D.roam, s = CO.START[rec.lead]; if (!s || !T.floor) return rec;
    var fl = T.floor('', rec.flags || {}), M = fl.marks || {}, open = function (q) { var r = q && fl.rows[q[1]]; return !!r && '.,='.indexOf(r.charAt(q[0])) >= 0; }, at = null, to = null;
    var taken = {}; fl.people.forEach(function (p) { taken[p.at[0] + ',' + p.at[1]] = 1; });
    var who = function (id) { return fl.people.filter(function (p) { return p.id === id; })[0] || null; };
    if (s.on) { var p0 = who(s.on); if (p0) { at = p0.at.slice(); to = [at[0] + p0.face[0], at[1] + p0.face[1]]; } } // (their own figure's square: no one stands there while they lead)
    else if (s.stall) { var st = M.stall && M.stall[s.stall]; if (st && open([st[0], st[1] + 1])) { at = [st[0], st[1] + 1]; to = st; } }
    else if (s.near) {
      var pn = who(s.near), o0 = pn && [[0, 1], [-1, 0], [1, 0], [0, -1], [1, 1], [-1, 1]].filter(function (o) { var q = [pn.at[0] + o[0], pn.at[1] + o[1]]; return open(q) && !taken[q[0] + ',' + q[1]]; })[0];
      if (o0) { at = [pn.at[0] + o0[0], pn.at[1] + o0[1]]; to = pn.at; }
    } else if (s.door) {
      var dq = (M.doors || {})[s.door], o1 = dq && [[0, 1], [-1, 0], [1, 0], [0, -1]].filter(function (o) { var q = [dq[0] + o[0], dq[1] + o[1]]; return open(q) && !taken[q[0] + ',' + q[1]]; })[0];
      if (o1) { at = [dq[0] + o1[0], dq[1] + o1[1]]; to = dq; }
    }
    if (!at) return rec;
    var dx = to ? Math.sign(to[0] - at[0]) : 0, dy = to ? Math.sign(to[1] - at[1]) : 0; // (a square's way: north or south first, as the 8-bit's four facings hold it -- R.DIR8)
    rec.at = { town: 'silverton', gate: 'west', sq: at, dir: dy ? R.DIR8['0,' + dy] : dx ? R.DIR8[dx + ',0'] : null };
    return rec;
  };
  Opening.prototype.update = function () {
    this.t++; var m = I.mouse, q = this.btn();
    var hit = m.inside && m.x >= q.x && m.x < q.x + q.w && m.y >= q.y && m.y < q.y + q.h;
    if (I.pressed('b') || m.rclick) { this.go(); return; }
    if (I.pressed('a') || (m.click && m.inside)) { if (++this.k >= this.pages.length) { this.go(); return; } D.sfx('cursor'); }
    this.hov = hit;
  };
  Opening.prototype.draw = function (ctx) {
    var W8 = D.WIN8, b = this.box(), q = this.btn(), last = this.k >= this.pages.length - 1, self = this;
    var g = ctx.createLinearGradient(0, 0, 0, D.H); g.addColorStop(0, '#05061a'); g.addColorStop(0.62, '#1b2240'); g.addColorStop(1, '#3a2a30'); ctx.fillStyle = g; ctx.fillRect(0, 0, D.W, D.H);
    ctx.save(); ctx.translate(D.W / 2, 22); ctx.scale(2, 2); D.text(ctx, 'DRAGONSLEEP', 0, 0, '#f8d878', 'center'); ctx.restore();
    D.win8(ctx, b.x, b.y, b.w, b.h);
    var rows = []; (this.pages[this.k] || []).forEach(function (l, i) { if (i) rows.push(''); rows = rows.concat(D.wrap(l, b.w - 20)); });
    rows.slice(0, 11).forEach(function (l, i) { D.text(ctx, l, b.x + 10, b.y + 8 + i * 10, W8.text); });
    if (this.k === 1) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(b.x / 2), b.y + b.h - 6); ctx.scale(2, 2); D.spr.draw(ctx, this.sheet, 'idle', 0, this.t, 0, 0, {}); ctx.restore(); } // (the lead, on the lead's own page)
    ctx.fillStyle = this.hov ? W8.sel : 'rgba(16,18,58,.92)'; ctx.fillRect(q.x, q.y, q.w, q.h); ctx.strokeStyle = this.hov ? W8.gold : W8.mid; ctx.strokeRect(q.x + 0.5, q.y + 0.5, q.w - 1, q.h - 1);
    D.text(ctx, last ? 'BEGIN' : 'NEXT', q.x + q.w / 2, q.y + 3, this.hov ? W8.gold : W8.text, 'center');
    D.text(ctx, (this.k + 1) + '/' + this.pages.length, b.x + 10, b.y + b.h - 18, '#9c9cb4');
    ctx.fillStyle = 'rgba(4,3,10,.95)'; ctx.fillRect(0, D.H - 14, D.W, 14);
    D.hint(ctx, 'E or a click on · X past it', D.W / 2, D.H - 11, '#9a96a8', 'center');
  };
  CO.Opening = Opening;

  // ---------------------------------------------------------------- the Company, shown (deep16/?company -- the eyes row's door): a NEW GAME staged at each of the three
  // hires, the lead and the purse as the beat says and the JOURNAL's Company pinned (its marker on), the rest in the player's hands -- a click on the one to hire (or
  // E beside them); the first beat is NEW GAME's own pick. &beat=<id> opens one; X back to the title
  CO.BEATS = [
    { id: 'new', label: 'NEW GAME: CHOOSE WHO YOU ARE', note: 'The title\'s NEW GAME: the four, the sheet and the blurb, Begin as ...? -- the opening\'s three pages, then the west gate, alone.' },
    { id: 'vivian', lead: 'barley', near: 'vivian', label: 'VIVIAN, SELLING CANDLES ON VICE ROW', note: 'Barley leads, 10 silver, beside her: BUY A CANDLE (1 SP), then COME ALONG? -- she joins.' },
    { id: 'aurdin', lead: 'lymen', near: 'aurdinChapel', silver: 25, label: 'AURDIN, OUTSIDE ALDWIN\'S CHAPEL', note: 'Lymen leads, 25 silver, beside him: PAY 20 SP -- he joins.' },
    { id: 'barley', lead: 'aurdin', hex: true, label: 'BARLEY, ON THE BENCH IN THE HEX', note: 'Aurdin leads, at the Hex\'s front doors: in, Barley by Korvin\'s slate -- FRONT 5 SP, he joins, and his bout on the sand at once.' },
    { id: 'lymenwait', lead: 'vivian', hex: true, label: 'LYMEN IN THE HEX, NO NAME YET', note: 'Vivian leads, renown 0, at the Hex\'s doors: his word, then Make a name first.' },
    { id: 'lymen', lead: 'vivian', hex: true, renown: 1, label: 'LYMEN IN THE HEX, A NAME MADE', note: 'Vivian leads, renown 1, at the Hex\'s doors: STAND WITH US -- he joins.' },
    { id: 'last', lead: 'lymen', with: ['barley', 'aurdin'], near: 'vivian', label: 'THE FOURTH: THE COMPANY DONE', note: 'Lymen, Barley and Aurdin; Vivian the last, beside her -- hired, the JOURNAL\'s Company: Four of you.' }
  ];
  CO.stage = function (bt) {
    var R = D.roam, rec = H.fresh(bt.lead), ld = rec.party[0];
    (bt.with || []).forEach(function (id) { rec.party.push(CO.sheetFor(id, ld.lvl)); rec.hired.push(id); });
    if (bt.silver != null) rec.silver = bt.silver;
    if (bt.renown) rec.renown = bt.renown;
    rec.flags.pin = CO.QUEST;
    var fl = T.floor('', rec.flags), at = null, dir = null;
    if (bt.hex) { at = (fl.marks.hexFront || [])[0]; dir = R.DIR8['0,-1']; } // (on the Hex's front doors, facing them)
    else if (bt.near) {
      var pp = fl.people.filter(function (p) { return p.id === bt.near; })[0], taken = {}; fl.people.forEach(function (p) { taken[p.at[0] + ',' + p.at[1]] = 1; });
      var o0 = pp && [[0, 1], [-1, 0], [1, 0], [0, -1], [1, 1], [-1, 1]].filter(function (o) { var x = pp.at[0] + o[0], y = pp.at[1] + o[1], r = fl.rows[y]; return r && '.,='.indexOf(r.charAt(x)) >= 0 && !taken[x + ',' + y]; })[0];
      if (o0) { at = [pp.at[0] + o0[0], pp.at[1] + o0[1]]; dir = R.DIR8[(-o0[0]) + ',' + (-o0[1])] || null; }
    }
    rec.at = { town: 'silverton', gate: 'west', sq: at, dir: dir };
    return rec;
  };
  CO.play = function (bt) { if (bt.id === 'new') { D.scenes.length = 0; D.push(CO.pick()); return; } H.begin(CO.stage(bt), 0); };
  function Show(q) {
    this.kind = 'companyshow'; this.opaque = true; this.t = 0; this.hov = 0;
    var b = /[?&]beat=([a-z0-9]+)/.exec(String(q || '')); if (b) this.pending = CO.BEATS.filter(function (x) { return x.id === b[1]; })[0] || null;
  }
  Show.prototype.buttons = function () { var st = Math.min(34, Math.floor((D.H - 46) / CO.BEATS.length)); return CO.BEATS.map(function (bt, k) { return { x: 12, y: 26 + k * st, w: D.W - 24, h: st - 3, bt: bt }; }); };
  Show.prototype.update = function () {
    this.t++; var m = I.mouse;
    if (this.pending) { var p0 = this.pending; this.pending = null; CO.play(p0); return; }
    var bs = this.buttons(), hit = m.inside ? bs.filter(function (q) { return m.x >= q.x && m.x < q.x + q.w && m.y >= q.y && m.y < q.y + q.h; })[0] : null;
    if (m.moved || m.click) this.hov = hit ? bs.indexOf(hit) : this.hov;
    if (I.repeat('down')) this.hov = (this.hov + 1) % bs.length; if (I.repeat('up')) this.hov = (this.hov - 1 + bs.length) % bs.length;
    if ((m.click && hit) || I.pressed('a')) { D.sfx('confirm'); CO.play((hit || bs[this.hov]).bt); return; }
    if (I.pressed('b') || m.rclick) { D.scenes.length = 0; D.push(new H.Title()); }
  };
  Show.prototype.draw = function (ctx) {
    var self = this, W8 = D.WIN8; ctx.fillStyle = '#0a0c22'; ctx.fillRect(0, 0, D.W, D.H);
    D.text(ctx, '{y}THE COMPANY{/} -- the first game\'s opening: a NEW GAME staged at each hire, the rest is yours (a show)', 10, 10, W8.text);
    this.buttons().forEach(function (q, k) {
      var on = k === self.hov; D.win8(ctx, q.x, q.y, q.w, q.h, on ? W8.sel : null);
      D.text(ctx, q.bt.label, q.x + 8, q.y + 3, on ? W8.gold : W8.text); D.wrap(q.bt.note, q.w - 16).slice(0, q.h > 26 ? 2 : 1).forEach(function (l, i) { D.text(ctx, l, q.x + 8, q.y + 13 + i * 9, '#9c9cb4'); });
    });
    D.hint(ctx, 'click a beat · arrows and E · X back to the title', D.W / 2, D.H - 12, '#9a96a8', 'center');
  };
  CO.show = function (q) { return new Show(q); };
})();
