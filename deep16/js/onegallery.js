/* DEEP16 — THE ONE GALLERY (?gallery, 10-08; the lane `they live\handoff-2026-10-08-the-one-gallery.md`, Griz: "you spec sheet a gallery consolidation
   (into one tool) in service to 7 and we have a session build it"). The four galleries on one shelf-board, one screen and one key map:

     ?gallery                       the shelves: 1 SPELLS (js/gallery.js D.fxGallery), 2 FEATURES (D.fxFeatures), 3 MASCOTS (js/mpgallery.js), 4 CREATURES
                                    (js/show.js SH.rows); &shelf=spells|features|mascots|creatures, and each shelf's own start flag as before (spell=, feature=,
                                    ability= / who=, rows=), only=, lvl=, foe=, raw, keep, auto; &from=pocket: X goes back to the Pocket DM
     ?fxgallery, &features, &mascots, ?mpgallery, ?rows=   the old doors, every one landing on its shelf at its entry (&keeper stays the Keeper's own, js/keeper.js)

   The screen: the Mascot gallery's column down the left on every shelf (his 10-07 ruling, "hard to see moves") -- the shelves at its head (click one, or 1-4),
   the entry's card, the keys at its foot; the battle's own cards to its right. L swaps the card for the shelf's list (click to jump; on CREATURES the bestiary).
   The keys, the same on every shelf: LEFT/RIGHT the entry (SHIFT ten), UP/DOWN the level where the shelf has one (a spell's slot, a cantrip's caster, a
   Mascot's level), , and . turn the figure (CREATURES), E or a click on the floor again (SHIFT+E the row bare), SPACE pause and [ ] a frame while paused,
   F the dice (CREATURES: pinned to land, or as they fall), X back. A key during a demonstration is taken: it cuts it and goes (the shelf's loop is started
   over from its S.restart). The benches drive the shelves' own doors (dev/bench16.js), never this one. */
'use strict';
(function () {
  var D = window.D16, I = D.input;
  var OG = D.oneGallery = {};
  var COL = 150, LH = 9, STRIP = 3 * LH + 4, FOOT = 3 * LH + 5; // (the column's width and line: js/mpgallery.js's; the head: the shelves on two lines, the eyes waiting on the third)
  OG.COL = COL;
  OG.SHELVES = [
    { id: 'spells', name: 'SPELLS', req: 'gallery' }, { id: 'features', name: 'FEATURES', req: 'gallery' },
    { id: 'mascots', name: 'MASCOTS', req: 'mpgallery' }, { id: 'creatures', name: 'CREATURES', req: 'rows' }
  ];
  function shelfOf(q) {
    var m = /[?&]shelf=([a-z]+)/.exec(q);
    if (m && OG.SHELVES.some(function (s) { return s.id === m[1]; })) return m[1];
    if (/[?&]mpgallery\b/.test(q) || /[?&]mascots\b/.test(q)) return 'mascots';
    if (/[?&]rows=/.test(q)) return 'creatures';
    if (/[?&]features\b/.test(q)) return 'features';
    return 'spells';
  }
  // ------------------------------------------------------------------ the door
  OG.door = function (q) {
    q = q || '';
    if (/[?&]keeper\b/.test(q) && D.fxKeeper) return D.fxKeeper(q); // (the Keeper's scenes are not a shelf)
    var id = shelfOf(q), B;
    if (id === 'spells') B = D.fxGallery(q.replace(/[?&](features|mascots)\b/g, ''));
    else if (id === 'features') B = D.fxFeatures(q);
    else if (id === 'mascots') B = D.fxMascots(q);
    else B = D.show.rows(/[?&]rows=/.test(q) ? q : q + '&rows=' + (OG.lastRows || 'grick'));
    return OG.wrap(B, id, q);
  };
  OG.kinds = function () { // the bestiary with a sheet to show, by name (CREATURES' list)
    if (OG._kinds) return OG._kinds;
    var F = D.FOES || {};
    return (OG._kinds = Object.keys(F).filter(function (k) { var f = F[k]; return f && f.sheet && D.SHEETS && D.SHEETS[f.sheet]; })
      .sort(function (a, b) { var A = String(F[a].name || a), Bn = String(F[b].name || b); return A < Bn ? -1 : A > Bn ? 1 : 0; }));
  };

  // ------------------------------------------------------------------ the shelf's own state (each keeps its own: index, list, level)
  function st(B) { var s = B.one.shelf; return s === 'mascots' ? B.mpgallery : s === 'creatures' ? B.rowGallery : B.gallery; }
  function count(B) { var S = st(B); return S ? (S.ids || S.list || []).length : 0; }
  function restart(B) { // the shelf's loop over again from where its state now stands
    var S = st(B); if (!S || !S.restart) return;
    if (B.co && B.co.return) { try { B.co.return(); } catch (e) { /* (a demonstration cut mid-way: its own finally blocks have run) */ } }
    B.req = null; B.wait = 0; B.waitFx = false; B.active = null; B.one.paused = false;
    B.co = S.restart();
  }
  function step(B, d) {
    var S = st(B), n = count(B); if (!n) return;
    S.i = ((S.i + d) % n + n) % n;
    if (B.one.shelf === 'spells') { S.up = 0; S.cl = null; }
    if (B.one.shelf === 'features') S.add = 0;
    D.sfx('cursor'); restart(B);
  }
  var TIERS = [1, 5, 11, 17];
  function level(B, v) {
    var o = B.one, S = st(B);
    if (o.shelf === 'spells') {
      var sp = D.magic.data(S.ids[S.i]);
      if (sp && sp.level) { var up0 = S.up || 0; S.up = Math.max(0, up0 + v); if (S.up === up0) { D.sfx('error'); return; } }
      else { var cur = S.cl || 9, k = TIERS.filter(function (t) { return t <= cur; }).length - 1, k2 = Math.max(0, Math.min(3, k + v)); if (k2 === k && S.cl) { D.sfx('error'); return; } S.cl = TIERS[k2]; }
      D.sfx('cursor'); restart(B); return;
    }
    if (o.shelf === 'features') { // (the hero built that many levels above the feature's own, to its class's last: js/gallery.js specAt)
      var f = D.FEATURES && D.FEATURES[S.ids[S.i]]; if (!f) { D.sfx('error'); return; }
      var top = (D.npc.maxLvl ? D.npc.maxLvl(f.cls) : 9) - f.lvl, add0 = S.add || 0; S.add = Math.max(0, Math.min(top, add0 + v));
      if (S.add === add0) { D.sfx('error'); return; }
      D.sfx('cursor'); restart(B); return;
    }
    if (o.shelf === 'mascots' && S.rebuild) {
      var L2 = Math.max(1, Math.min(9, S.L + v)); if (L2 === S.L) { D.sfx('error'); return; }
      var old = ['denny', 'beholda', 'rascal', 'goose'].map(function (k3) { return S.M && S.M[k3]; }).filter(Boolean); // (the old level's four off the floor: js/mpgallery.js's own up/down)
      B.units = B.units.filter(function (u) { return old.indexOf(u) < 0; }); D.grid.setup(D.grid.map, B.units);
      S.L = L2; S.M = S.rebuild(S.L);
      D.sfx('cursor'); restart(B); return;
    }
    D.sfx('error'); // (no level on this shelf: the key line says so)
  }
  function turn(B, v) {
    if (B.one.shelf !== 'creatures') { D.sfx('error'); return; }
    var S = B.rowGallery; S.face = (S.face + (v > 0 ? 1 : 7)) % 8;
    D.sfx('cursor'); restart(B);
  }
  // a frame while paused: the figure whose row is playing, its clock moved a frame (the drawing reads B.t - animT: js/ui.js)
  function frameStep(B, v) {
    var u = null;
    if (B.one.shelf === 'creatures') { var R = B.rowGallery, it = R.list[R.i]; u = it && it.u; }
    if (!u || !u.anim || u.anim === 'idle') u = B.units.filter(function (w) { return w.anim && w.anim !== 'idle' && D.spr.anim(w.sheet, w.anim); }).sort(function (a, b) { return (b.animT || 0) - (a.animT || 0); })[0];
    var a = u && D.spr.anim(u.sheet, u.anim); if (!a) { D.sfx('error'); return; }
    var per = 60 / (a.fps || 8), dur = D.spr.duration(u.sheet, u.anim), el = B.t - (u.animT || 0);
    el = Math.max(0, Math.min(dur - 1, Math.floor(el / per) * per + v * per));
    u.animT = B.t - el; D.sfx('cursor');
  }
  function shelf(B, k) {
    var s = OG.SHELVES[k]; if (!s || s.id === B.one.shelf) { D.sfx('error'); return; }
    D.sfx('confirm'); OG.pending = '?gallery&shelf=' + s.id + (s.id === 'creatures' && OG.lastRows ? '&rows=' + OG.lastRows : '') + carry(B);
  }
  function carry(B) { var q = B.one.q, out = ''; ['lvl', 'from'].forEach(function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); if (m) out += '&' + k + '=' + m[1]; }); return out; }
  OG.go = function (q2) { // a shelf for another: the scene stack emptied, the new door pushed, the address kept in step (a reload lands where you are)
    var old = D.battle;
    if (old && old.mpgallery && old.mpgallery.teardown) old.mpgallery.teardown();
    while (D.scenes.length) D.pop();
    try { history.replaceState(null, '', location.pathname + q2); } catch (e) { /* (a page with no history: the shelf still changes) */ }
    D.push(OG.door(q2));
  };

  // what a script or a bench asks of a shelf, the keys' own moves (dev/bench16.js mode=gallery1008)
  OG.act = function (B, what, v) { if (what === 'step') step(B, v); else if (what === 'level') level(B, v); else if (what === 'turn') turn(B, v); else restart(B); };

  // ------------------------------------------------------------------ the eyes (the lane's §3.6; the eyes lane): a row of js/eyes.js whose door is this entry
  // shows on the card, and V marks it -- works, broken, unclear, too hard, too easy, none -- into situations.html's own store on this device (the same origin),
  // so its Save carries the verdict in his ear file; notes stay in situations
  var FKEY = 'dsl-situations-feedback:v1', VERDICTS = [['works', 'works'], ['broken', 'broken'], ['unclear', 'unclear'], ['hard', 'too hard'], ['easy', 'too easy']]; // (situations.html's)
  function fbGet() { try { return JSON.parse(localStorage.getItem(FKEY) || '{}') || {}; } catch (e) { return {}; } }
  function fbPut(FB) { try { localStorage.setItem(FKEY, JSON.stringify(FB)); } catch (e) { /* (no store here: the mark is lost, the gallery goes on) */ } }
  function entryKey(B) { var o = B.one, S = st(B); if (!S) return null; if (o.shelf === 'creatures') { var it = S.list[S.i]; return it && it.u.kind; } return S.ids[S.i]; }
  // every eyes row whose door opens a shelf at an entry: { id, q (its door's query), shelf, want (the entries it names) }, most wanted first
  OG.galleryRows = function () {
    var E = window.DS && window.DS.EYES; if (!E) return [];
    if (OG._rows && OG._rowsOf === E) return OG._rows;
    OG._rowsOf = E;
    return (OG._rows = Object.keys(E).map(function (id) {
      var u = String(E[id].url || ''), at = u.indexOf('deep16/?'); if (at < 0) return null;
      var q = u.slice(at + 7); if (!/[?&](gallery|fxgallery|mpgallery)\b|[?&]rows=/.test(q) || /[?&]keeper\b/.test(q)) return null;
      var sh = shelfOf(q), g = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
      var want = g({ spells: 'spell', features: 'feature', mascots: 'ability', creatures: 'rows' }[sh]) || g('only');
      return want ? { id: id, q: q, shelf: sh, want: want.split(','), pri: E[id].pri || 3 } : null;
    }).filter(Boolean).sort(function (a, b) { return a.pri - b.pri || (a.id < b.id ? -1 : 1); }));
  };
  OG.eyesFor = function (B) {
    var o = B.one, key = entryKey(B); if (!key) return [];
    if (o.eyesAt === key) return o.eyes;
    o.eyesAt = key; o.fb = null; // (the store read again for a new entry, not every frame)
    return (o.eyes = OG.galleryRows().filter(function (r) { return r.shelf === o.shelf && r.want.indexOf(key) >= 0; }).map(function (r) { return r.id; }));
  };
  function marked(FB, id) { var f = FB[id]; return !!(f && (f.v || f.note)); }
  function waiting(B) { var FB = B.one.fb || (B.one.fb = fbGet()); return OG.galleryRows().filter(function (r) { return !marked(FB, r.id); }); }
  // the eyes block at the head of the card (10-08, Griz: "so far only V i've noticed is 'more to scroll down'"): what this entry is waiting on his eye for, what
  // should happen (the row's look), and its verdict
  function eyesLines(B) {
    var rs = OG.eyesFor(B), E = window.DS && window.DS.EYES; if (!rs.length) return [];
    var FB = B.one.fb || (B.one.fb = fbGet()), out = [], k0 = (B.one.eyeK || 0) % rs.length;
    rs.forEach(function (id, k) {
      var f = FB[id] || {}, v = VERDICTS.filter(function (x) { return x[0] === f.v; })[0];
      D.wrap('{o}YOUR EYE' + (rs.length > 1 ? ' ' + (k + 1) + '/' + rs.length : '') + ':{/} ' + E[id].title, COL - 12).forEach(function (l) { out.push(l); });
      D.wrap(String(E[id].look || ''), COL - 12).forEach(function (l) { out.push('{g}' + l + '{/}'); });
      out.push((k === k0 ? '{y}V{/}: ' : '   ') + (v ? '{y}' + v[1] + '{/}' : 'no verdict yet') + (k === k0 && rs.length > 1 ? '  {g}SHIFT+V next{/}' : ''), '');
    });
    return out;
  }
  function nextEyes(B) { // N: the next entry waiting on his eye, whatever its shelf (the row's own door, so its own flags too)
    var all = OG.galleryRows(); if (!all.length) { D.sfx('error'); return; }
    var w = waiting(B), pool = w.length ? w : all, here = OG.eyesFor(B), at = -1;
    pool.forEach(function (r, i) { if (here.indexOf(r.id) >= 0) at = i; });
    var r = pool[(at + 1) % pool.length];
    D.sfx('confirm'); OG.pending = r.q + carry(B);
  }
  function verdict(B, next) {
    var rs = OG.eyesFor(B); if (!rs.length) { D.sfx('error'); return; }
    var o = B.one; if (next) { o.eyeK = ((o.eyeK || 0) + 1) % rs.length; D.sfx('cursor'); return; }
    var id = rs[(o.eyeK || 0) % rs.length], FB = fbGet(), f = FB[id] = FB[id] || {}, order = VERDICTS.map(function (x) { return x[0]; }).concat(['']);
    f.v = order[(order.indexOf(f.v || '') + 1) % order.length]; f.at = new Date().toISOString();
    fbPut(FB); o.fb = FB; D.sfx('confirm');
  }

  // ------------------------------------------------------------------ the list (L): the shelf's entries, or on CREATURES the bestiary
  function names(B) {
    var o = B.one, S = st(B);
    if (o.shelf === 'spells') return S.ids.map(function (id) { var sp = D.magic.data(id); return sp ? sp.name + (sp.level ? '  ' + sp.level : '  c') : id; });
    if (o.shelf === 'features') return S.ids.map(function (id) { var f = D.FEATURES && D.FEATURES[id]; return f ? f.name + '  ' + D.clsLabel(f.cls) + ' ' + f.lvl : id; });
    if (o.shelf === 'mascots') { var by = {}; ((D.mpgallery && D.mpgallery.ENTRIES) || []).forEach(function (e) { by[e.id] = e; }); return S.ids.map(function (id) { return by[id] ? by[id].name : id; }); }
    return OG.kinds().map(function (k) { return String(D.FOES[k].name || k); });
  }
  function current(B) {
    if (B.one.shelf !== 'creatures') return st(B).i;
    var f = B.rowGallery.foes && B.rowGallery.foes[0]; return f ? OG.kinds().indexOf(f.kind) : 0;
  }
  function openList(B) {
    var o = B.one, ns = names(B), cur = current(B);
    o.listP.lines = ns.map(function (n, k) { return (k === cur ? '{y}> ' : '  ') + (k + 1) + ' ' + n + (k === cur ? '{/}' : ''); });
    o.listP.scroll = Math.max(0, cur - 4); o.list = true; D.sfx('confirm');
  }
  function pick(B, row) {
    var o = B.one, n = o.listP.lines.length; if (row < 0 || row >= n) return;
    o.list = false; D.sfx('confirm');
    if (o.shelf === 'creatures') { OG.pending = '?gallery&shelf=creatures&rows=' + OG.kinds()[row] + carry(B); return; }
    var S = st(B); S.i = row; if (o.shelf === 'spells') { S.up = 0; S.cl = null; } if (o.shelf === 'features') S.add = 0;
    restart(B);
  }

  // ------------------------------------------------------------------ the keys, read every frame whether the shelf waits or plays (not under a prompt or the menu)
  function handle(B) {
    var o = B.one, m = I.mouse, over = !!(m.inside && m.x < COL), sh = o.shelf;
    if (over && m.click) {
      if (m.y < STRIP) { m.click = false; if (m.y >= 2 + 2 * LH) nextEyes(B); else shelf(B, (m.y < 2 + LH ? 0 : 2) + (m.x < COL / 2 ? 0 : 1)); return; }
      if (o.list && m.y < D.H - FOOT) { m.click = false; pick(B, Math.floor((m.y - STRIP - 2) / LH) + o.listP.scroll); return; }
      if (o.list || sh !== 'mascots') { var P = o.list ? o.listP : o.panel; P.scroll += (m.y < D.H / 2 ? -1 : 1) * Math.max(1, (P.rows || 10) - 2); m.click = false; D.sfx('cursor'); return; }
    }
    if (over && m.wheel && (o.list || sh !== 'mascots')) { var P2 = o.list ? o.listP : o.panel; P2.scroll += m.wheel > 0 ? 3 : -3; m.wheel = 0; }
    for (var n = 1; n <= OG.SHELVES.length; n++) if (I.pressed('n' + n)) { shelf(B, n - 1); return; }
    if (I.pressed('list')) { if (o.list) { o.list = false; D.sfx('cursor'); } else openList(B); return; }
    if (I.pressed('b')) { if (o.list) { o.list = false; D.sfx('cursor'); } else if (o.from === 'pocket') location.href = location.pathname + '?pocket'; return; }
    if (I.pressed('end')) { o.paused = !o.paused; D.sfx('cursor'); return; }
    if (o.paused) { if (I.repeat('bracketr')) frameStep(B, 1); else if (I.repeat('bracketl')) frameStep(B, -1); return; }
    if (I.pressed('verdict')) { verdict(B, !!I.held.shift); return; }
    if (I.pressed('eyesnext')) { nextEyes(B); return; }
    if (I.pressed('dice') && (sh === 'creatures' || sh === 'spells')) { var SD = st(B); SD.real = !SD.real; D.sfx('confirm'); restart(B); return; }
    var shift = !!I.held.shift, d = I.repeat('right') ? 1 : I.repeat('left') ? -1 : 0;
    if (d) { if (o.list) o.list = false; step(B, shift ? d * 10 : d); return; }
    var lv = I.repeat('up') ? 1 : I.repeat('down') ? -1 : 0;
    if (lv) { level(B, lv); return; }
    var tn = I.repeat('turnr') || I.pressed('bumpr') ? 1 : I.repeat('turnl') || I.pressed('bumpl') ? -1 : 0;
    if (tn) { turn(B, tn); return; }
    if (I.pressed('a') || (m.click && !over && B.req)) {
      m.click = false;
      if (sh === 'creatures' && shift) B.rowGallery.bare = true;
      D.sfx('confirm'); restart(B);
    }
  }

  // ------------------------------------------------------------------ the picture: the column, the shelf's cards to its right
  function cardsRight(ctx, B, cards) { // (js/mpgallery.js's, for the shelves that have no column of their own)
    var y = 15, X0 = COL + 4, Wd = D.W - COL - 8;
    cards.forEach(function (c, i) {
      var lines = [], w = 0;
      c.lines.filter(function (l) { return l; }).forEach(function (l) { (D.textWidth(l) > Wd - 10 ? D.wrap(l, Wd - 10) : [l]).forEach(function (x) { lines.push(x); }); });
      lines.forEach(function (l) { w = Math.max(w, D.textWidth(l)); });
      w = Math.min(Wd, w + 10);
      var x = Math.round(X0 + (Wd - w) / 2), h = lines.length * LH + 5;
      var age = B.t - c.t0, fade = c.life - age < 30 ? (c.life - age) / 30 : 1;
      ctx.globalAlpha = (i === cards.length - 1 ? 1 : 0.6) * Math.max(0, fade);
      ctx.fillStyle = 'rgba(10,8,16,.86)'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = D.PAL.ramps.silver[3]; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      lines.forEach(function (l, k) { D.text(ctx, l, x + 5, y + 3 + k * LH, D.PAL.ramps.bone[1]); });
      ctx.globalAlpha = 1;
      y += h + 2;
    });
  }
  function keyLines(B) {
    var o = B.one, S = st(B), sh = o.shelf;
    if (o.list) return ['Click one: there it is.', 'Wheel scrolls. L or X: back.', '1-4 a shelf'];
    var last = o.paused ? 'PAUSED  [ ] a frame  SPACE on' : 'L list  1-4 shelf  SPACE pause';
    if (sh === 'spells') { var sp = S && D.magic.data(S.ids[S.i]); return ['L/R spell  SHIFT ten  E again', (sp && !sp.level ? 'U/D caster level' : 'U/D the slot') + '  F dice: ' + (S && S.real ? 'fall' : 'pinned'), last]; }
    if (sh === 'features') return ['L/R feature  SHIFT ten  E again', "U/D the hero's level", last];
    if (sh === 'mascots') return ['L/R ability  SHIFT ten  E again', 'U/D the level (' + (S ? S.L : '') + ')', last];
    return ['L/R row  , . turn  E again', 'SHIFT+E bare  F dice: ' + (S && S.real ? 'as they fall' : 'pinned'), o.paused ? last : 'L creatures  1-4  SPACE pause'];
  }
  function column(ctx, B, P0) {
    var o = B.one, H = D.H, top = STRIP + 1, inner = H - top - FOOT - 2, rows = Math.max(1, Math.floor(inner / LH));
    var P = o.list ? o.listP : P0, lines = o.list ? P.lines : eyesLines(B).concat(P.lines), n = lines.length, maxS = Math.max(0, n - rows), bone = D.PAL.ramps.bone[1], rim = D.PAL.ramps.silver[3];
    P.scroll = Math.max(0, Math.min(maxS, P.scroll || 0)); P.rows = rows; P.maxS = maxS;
    ctx.save();
    ctx.fillStyle = 'rgba(10,8,16,.9)'; ctx.fillRect(0, 0, COL, H);
    ctx.strokeStyle = rim; ctx.strokeRect(0.5, 0.5, COL - 1, H - 1);
    OG.SHELVES.forEach(function (s, k) { D.text(ctx, (s.id === o.shelf ? '{y}' : '{g}') + (k + 1) + ' ' + s.name + '{/}', 5 + (k % 2) * (COL / 2), 2 + Math.floor(k / 2) * LH, bone); });
    var wt = waiting(B).length, all = OG.galleryRows().length;
    D.text(ctx, all ? (wt ? '{o}YOUR EYE{/}: ' + wt + ' waiting  {y}N{/} next' : '{g}YOUR EYE: all ' + all + ' marked  N{/}') : '{g}YOUR EYE: nothing waiting{/}', 5, 2 + 2 * LH, bone);
    ctx.beginPath(); ctx.moveTo(1, STRIP - 0.5); ctx.lineTo(COL - 1, STRIP - 0.5); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(0, top, COL, inner); ctx.clip();
    for (var k = 0; k < rows && P.scroll + k < n; k++) if (lines[P.scroll + k]) D.text(ctx, lines[P.scroll + k], 5, top + 2 + k * LH, bone);
    ctx.restore();
    // (more above or below: a small triangle, not a letter -- a 'v' read as the V key, 10-08)
    ctx.fillStyle = D.PAL.ramps.gold[3];
    if (P.scroll > 0) { ctx.beginPath(); ctx.moveTo(COL - 11, top + 7); ctx.lineTo(COL - 5, top + 7); ctx.lineTo(COL - 8, top + 3); ctx.fill(); }
    if (P.scroll < maxS) { var yb = H - FOOT - 4; ctx.beginPath(); ctx.moveTo(COL - 11, yb - 4); ctx.lineTo(COL - 5, yb - 4); ctx.lineTo(COL - 8, yb); ctx.fill(); }
    ctx.fillStyle = 'rgba(10,8,16,.96)'; ctx.fillRect(1, H - FOOT - 1, COL - 2, FOOT);
    ctx.strokeStyle = rim; ctx.beginPath(); ctx.moveTo(1, H - FOOT - 0.5); ctx.lineTo(COL - 1, H - FOOT - 0.5); ctx.stroke();
    keyLines(B).forEach(function (l, i) { D.text(ctx, '{g}' + D.keys(l) + '{/}', 4, H - FOOT + 1 + i * LH, bone); });
    ctx.restore();
    if (o.paused) D.text(ctx, '{y}PAUSED{/}', D.W - 40, 4, bone);
  }

  // ------------------------------------------------------------------ over a shelf's battle
  OG.wrap = function (B, id, q) {
    var o = B.one = { shelf: id, req: OG.SHELVES.filter(function (s) { return s.id === id; })[0].req, q: q, wrapAt: COL - 12, list: false, paused: false,
      from: /[?&]from=pocket\b/.test(q) ? 'pocket' : null, panel: { lines: [], scroll: 0 }, listP: { lines: [], scroll: 0 }, head: null };
    if (id === 'creatures') { var rk = /[?&]rows=([a-z0-9,]+)/.exec(q); if (rk) OG.lastRows = rk[1]; }
    var paint0 = B.paint, update0 = B.update;
    B.paint = function (ctx) {
      if (o.shelf === 'mascots') { paint0.apply(this, arguments); column(ctx, this, this.mpgallery.panel); return; } // (its own cards drawn right of the column already)
      var cs = this.cards, head = null, rest = [];
      cs.forEach(function (c) { if (c.id === 'gallery' || c.id === 'rows') head = c; else rest.push(c); });
      this.cards = [];
      try { paint0.apply(this, arguments); } finally { this.cards = cs; }
      cardsRight(ctx, this, rest);
      if (head !== o.head || (head && head.lines !== o.panel.lines)) { if (head !== o.head) o.panel.scroll = 0; o.head = head; o.panel.lines = head ? head.lines : []; }
      column(ctx, this, o.panel);
    };
    B.update = function () {
      if (this.baking) return update0.apply(this, arguments);
      if (OG.pending) { var q2 = OG.pending; OG.pending = null; OG.go(q2); return; }
      if (!this.menu && (!this.req || this.req[o.req])) handle(this);
      if (OG.pending) return;
      if (o.paused) { D.ui.camera(this); return; } // (frozen: B.t holds, so every row holds its frame)
      return update0.apply(this, arguments);
    };
    return B;
  };

  // the shelves' own waits are answered above (the update): here only the camera, and the row gallery's prone clock (its get-up, js/show.js)
  var input0 = D.ui.input;
  D.ui.input = function (B, req) {
    var o = B && B.one;
    if (!o || !req || !req[o.req]) return input0(B, req);
    var R = B.rowGallery; if (o.shelf === 'creatures' && R && R.upAt && B.t >= R.upAt) { R.upAt = null; delete R.list[R.i].u.conds.prone; }
    var m = I.mouse; if (!(m.inside && m.x < COL)) D.ui.camera(B);
  };
  // the camera on a shelf without a column of its own: what it looks at, in the clear to the right of the column (js/mpgallery.js shifts its own)
  var look0 = D.iso.lookAt;
  D.iso.lookAt = function () {
    var r = look0.apply(this, arguments), B = D.battle;
    if (B && B.one && B.one.shelf !== 'mascots' && D.top && D.top() === B) D.iso.cam.x -= Math.round(COL / 2 / (D.iso.zoom || 1));
    return r;
  };
})();
