/* DRAGONSLEEP -- SWANN'S READING: the eyes rows (js/eyes.js) as a deck Sylvia Swann deals, six cards at a time, each card a door with a bar over it
   (11-11, the Swann tour seat, started by the lanes desk). His words: 11-10, "I think I'm going to need the coordinating seat to try to string together a
   walkthrough of what's on the eyerows, some kind of gamification. Loading up the situations page doesn't seem a good way to get me to do it. we've discussed
   sylvia as mission-seat teleport for similar before."; 11-11, on the desk's plan, "2 go"; on what a finished deck earns, "reduced frustration I imagine my dev
   team has given they've made all them eye rows"; on the PASS key, "4 yes".

   THE STORE is situations.html's own (its FKEY, one { v, note, at } a row, this device, this address): a card answered here is a row noted there, so his Save
   there, the one gallery's SAVE (deep16/js/onegallery.js OG.earFile) and her table's SAVE (deep16/js/swann.js) carry it in his ear file, and the fold takes it as
   ever -- CLAUDE.md's close: a noted row is a `seen` line with his note verbatim and is cut, whatever the verdict. PASS ("don't need to see it") is the note
   "passed": a noted row, so a pass cuts the row at the fold.
   THE DECK: the rows not yet noted on this device whose door the bar can ride (a deep16/ page, or tools/sheet-play.html: T.dealable), most wanted first (pri),
   then by place within a priority -- the biggest place first, every row of a place together (T.place: the inn's, the gallery's, the class floor's) -- the newest
   first within a place (situations.html's dated()); six at a time. Held on this device (DKEY) once dealt, so a card's door is the same card till the deck is done.
   The rows whose door is elsewhere (snoot-mode/, the first game's index.html, none) wait on the situations page; her table says how many.
   THE BAR (T.mount, any page with &tour=<card> on its address, this file and js/eyes.js loaded): her face, the deck's six as small cards, the card's title. Its
   card is UP on arrival -- what should happen (the row's look) over the top of the page, and every key the card's: 1 works, 2 broken, 3 unclear, 4 too hard,
   5 too easy (situations.html's five), N a note, P PASS, the arrows the deck's other cards; Enter or Esc lays it down (a click on the game too) and the page's
   keys are the game's again; H brings it back up. 2 and 3 open the note at once (what broke, in his words, then and there: the gallery's rule). An answer
   goes on to the next card face down; the last sends him to her table (deep16/?cards). */
'use strict';
(function () {
  var DS = window.DS = window.DS || {};
  var T = DS.TOUR = {};
  var FKEY = T.FKEY = 'dsl-situations-feedback:v1', DKEY = T.DKEY = 'dsl-swann-deck:v1', SWKEY = T.SWKEY = 'deep16.tester';
  T.PER = 6; T.PASS = 'passed';
  T.VERDICTS = [['works', 'works', '1'], ['broken', 'broken', '2'], ['unclear', 'unclear', '3'], ['hard', 'too hard', '4'], ['easy', 'too easy', '5']]; // (situations.html's five)
  T.COLORS = { works: '#2f6d8f', broken: '#8f2f1c', unclear: '#a8552a', hard: '#b8892a', easy: '#b8892a', pass: '#6a6478', note: '#4f7a5a' }; // (situations.html's chips)
  function get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch (e) { /* (no store here: the mark is lost, the page goes on) */ } }
  T.fb = function () { try { return JSON.parse(get(FKEY) || '{}') || {}; } catch (e) { return {}; } };
  T.fbPut = function (FB) { put(FKEY, JSON.stringify(FB)); };
  T.noted = function (FB, id) { var f = FB[id]; return !!(f && (f.v || String(f.note || '').trim())); }; // (situations.html's noted())
  T.passed = function (FB, id) { var f = FB[id]; return !!(f && !f.v && String(f.note || '').trim() === T.PASS); };
  var me = document.currentScript && document.currentScript.src || '';
  T.root = me.replace(/js\/tour\.js(\?.*)?$/, ''); // (the site's root: every eyes door is written from it)

  // ------------------------------------------------------------------ the tester switch: her booth's READ THE CARDS (deep16/js/swann.js), never in the story.
  // On by her table's own door (deep16/?cards), &tester=1 on any address; off by &tester=0 or the switch on her table
  T.tester = function () { return get(SWKEY) === '1'; };
  T.setTester = function (on) { put(SWKEY, on ? '1' : null); };
  (function () { var m = /[?&]tester=([01])\b/.exec(window.location.search || ''); if (m) T.setTester(m[1] === '1'); })();

  // ------------------------------------------------------------------ the deck
  T.isTable = function (u) { return /^deep16\/\?cards\b/.test(String(u || '')); };
  T.dealable = function (r) { var u = String(r && r.url || ''); return (/^deep16\/\?/.test(u) && !T.isTable(u)) || /^tools\/sheet-play\.html/.test(u); };
  var PLACES = { npc: 'the class floor', pocket: 'the Pocket DM', portraits: 'the keepers\' portraits', keepers: 'the keepers standing', gallery: 'the one gallery', rows: 'the one gallery',
    fxgallery: 'the one gallery', mpgallery: 'the one gallery', innshow: 'the Halfway Inn', fight: 'the fights', rulesshow: 'the rules, shown', hoursshow: 'Silverton\'s hours',
    restshow: 'the rests and the waits', world: 'the world map', at: 'the second game\'s situations', houseshow: 'the house\'s keepers', company: 'the Company', wetshow: 'the Wet', cradle: 'the Cradle',
    ladder: 'the ladders', runes: 'the runes', gameshow: 'the Game Show', nedshow: 'Ned\'s counter', services: 'Silverton\'s services', victoryshow: 'the victory panel', wagonshow: 'the wagon',
    skyshow: 'the Skylights', mpshow: 'the Mascots', broke: 'the broken card', keeperfight: 'the Keeper', isoshow: 'the floors on the diamonds', fresh: 'the title' };
  var GALLERY = { gallery: 1, rows: 1, fxgallery: 1, mpgallery: 1 };
  var ROAMS = { silverton: 'Silverton', warrens: 'the Warrens', glowseep: 'the Glowseep', galleries: 'the Guano Galleries', hex: 'the Hex', wet: 'the Wet' };
  T.place = function (url) {
    var u = String(url || '');
    if (/^tools\/sheet-play\.html/.test(u)) return { k: 'sheets', name: 'the sheet player' };
    var m = /^deep16\/\?([a-z0-9]+)(?:=([^&#]*))?/.exec(u); if (!m) return { k: 'elsewhere', name: 'off the grid' };
    var key = m[1], val = m[2] || '';
    if (key === 'roam') { var b = val.replace(/_.*$/, ''); return { k: 'roam:' + b, name: ROAMS[b] || b }; }
    if (key === 'show') return val === 'secondact' ? { k: 'secondact', name: 'the second act' } : { k: 'show', name: 'the test ground' };
    return { k: GALLERY[key] ? 'gallery' : key, name: PLACES[key] || key };
  };
  function dated(id) { var m = /-(\d{4})([a-z]?)$/.exec(id); return m ? +m[1] * 30 + (m[2] ? m[2].charCodeAt(0) - 96 : 0) : 0; } // (situations.html's)
  // the order she deals in: the rows not yet noted whose door the bar rides, pri first, then by place (the biggest first -- counted over the whole list, noted or
  // not, so a place's leftovers are dealt next and not sent to the back), the newest first in a place
  T.order = function (E, FB) {
    E = E || DS.EYES || {}; FB = FB || T.fb();
    var rows = [], n = 0, size = {};
    Object.keys(E).forEach(function (id) {
      var r = E[id]; if (!T.dealable(r)) { n++; return; }
      var p = T.place(r.url), k = (r.pri || 3) + '|' + p.k; size[k] = (size[k] || 0) + 1;
      if (!T.noted(FB, id)) rows.push({ id: id, pri: r.pri || 3, p: p, o: n }); n++;
    });
    rows.sort(function (a, b) {
      if (a.pri !== b.pri) return a.pri - b.pri;
      if (a.p.k !== b.p.k) return size[b.pri + '|' + b.p.k] - size[a.pri + '|' + a.p.k] || (a.p.k < b.p.k ? -1 : 1);
      return dated(b.id) - dated(a.id) || b.o - a.o;
    });
    return rows.map(function (r) { return r.id; });
  };
  T.deck = function () { try { var d = JSON.parse(get(DKEY) || 'null'); return d && d.ids && d.ids.length ? d : null; } catch (e) { return null; } };
  T.dealt = function () { try { var d = JSON.parse(get(DKEY) || 'null'); return (d && d.no) || 0; } catch (e) { return 0; } }; // (decks dealt on this device)
  T.deal = function (E, FB) {
    var ids = T.order(E, FB).slice(0, T.PER), d = { no: T.dealt() + 1, at: new Date().toISOString(), ids: ids, shown: [] };
    if (!ids.length) d.no--; // (nothing to deal: the count stands)
    put(DKEY, JSON.stringify(d)); return ids.length ? d : null;
  };
  T.keep = function (d) { put(DKEY, JSON.stringify(d)); }; // (her table's turned cards: d.shown)
  // each card: { id, k, row, gone (cut from js/eyes.js since the deal), up (answered: face up), v, note, pass }
  T.cards = function (d, E, FB) {
    E = E || DS.EYES || {}; FB = FB || T.fb();
    return (d ? d.ids : []).map(function (id, k) { var r = E[id], f = FB[id] || {}; return { id: id, k: k, row: r || null, gone: !r, up: !r || T.noted(FB, id), v: f.v || '', note: String(f.note || ''), pass: T.passed(FB, id) }; });
  };
  // the next card face down after card k (round the deck), or -1: every card is up
  T.nextCard = function (d, k, FB) {
    var cs = T.cards(d, null, FB), n = cs.length;
    for (var i = 1; i <= n; i++) { var c = cs[((k < 0 ? -1 : k) + i + n) % n]; if (!c.up) return c.k; }
    return -1;
  };
  T.done = function (d, FB) { return !!d && T.cards(d, null, FB).every(function (c) { return c.up; }); };
  // the owl's count: of every row in the list now, how many are noted on this device; and what is left to deal, and what waits on the situations page
  T.count = function (E, FB) {
    E = E || DS.EYES || {}; FB = FB || T.fb(); var ids = Object.keys(E);
    return { seen: ids.filter(function (id) { return T.noted(FB, id); }).length, all: ids.length, left: T.order(E, FB).length,
      elsewhere: ids.filter(function (id) { return !T.dealable(E[id]) && !T.isTable(E[id].url) && !T.noted(FB, id); }).length };
  };
  // ------------------------------------------------------------------ the answers, into situations.html's store
  function stamp(f) { f.at = new Date().toISOString(); }
  T.mark = function (id, v) { var FB = T.fb(), f = FB[id] = FB[id] || {}; f.v = v || ''; if (v && String(f.note || '').trim() === T.PASS) f.note = ''; stamp(f); T.fbPut(FB); return f; }; // (a verdict after a pass: he looked after all)
  T.note = function (id, text) { var FB = T.fb(), f = FB[id] = FB[id] || {}; f.note = String(text || '').trim(); stamp(f); T.fbPut(FB); return f; };
  T.pass = function (id) { var FB = T.fb(), f = FB[id] = FB[id] || {}; f.note = T.PASS; stamp(f); T.fbPut(FB); return f; };
  // ------------------------------------------------------------------ the doors
  T.cardHref = function (row, k) { var u = String(row && row.url || ''); return T.root + u + (u.indexOf('?') >= 0 ? '&' : '?') + 'tour=' + (k + 1); };
  T.tableHref = function () { return T.root + 'deep16/?cards'; };
  T.navDelay = 450; // (the answer shown in the bar a beat, then the door: 0 goes at once -- the bench)
  T.nav = function (href) { window.location.href = href; };
  function go(href) { if (T.navDelay) setTimeout(function () { T.nav(href); }, T.navDelay); else T.nav(href); }
  // after card k: the next face-down card's door, or her table
  T.onFrom = function (d, k) { var nx = T.nextCard(d, k); return nx < 0 ? T.tableHref() : T.cardHref((DS.EYES || {})[d.ids[nx]], nx); };

  // ------------------------------------------------------------------ her words (the seat's drafts, the no-stubs law; invented.json swann-cards-1111, fold `game`)
  T.LINES = {
    first: 'Six cards. Each one is a door your builders left open for you. Walk through, tell the owl what you saw, and come back to my table.',
    deal: 'Six more. A door each, and the owl wants to know.',
    back: 'Not done. {n} still face down.',
    // a deck's end: nothing won but this (11-11, Griz: "reduced frustration I imagine my dev team has given they've made all them eye rows")
    end: ['Six face up. Somewhere a builder who made one of these just stopped wondering whether anybody would look.',
      'That\'s the deck. Six fewer questions keeping your builders up at night.',
      'All read. The ones who built these were half sure nobody ever would. Now they know.',
      'Done. Every card made for you, turned over by you. That\'s a weight off a workshop.',
      'Six more answered. The workshop breathes a little easier every time you sit down here.'],
    empty: 'The deck\'s empty. The owl has seen every card I hold. Go and play something nobody built for you to check.',
    elsewhere: 'And {n} aren\'t mine to deal: their doors open off the grid. The situations page has them.',
    booth: 'Not the cup. The cards -- the ones your builders left for you.',
    leave: 'The cards open their own doors: this walk isn\'t kept when you go. Save first if you want it.',
    owl: 'The owl has seen {seen} of {all}.',
    card: ['First card.', 'Second card.', 'Third card.', 'Fourth card.', 'Fifth card.', 'Last card.'],
    none: 'No deck in hand. My table deals one.'
  };
  T.endLine = function (no) { var L = T.LINES.end; return L[((no || 1) - 1) % L.length]; };
  T.owl = function (c) { return T.LINES.owl.replace('{seen}', c.seen).replace('{all}', c.all); };

  // ------------------------------------------------------------------ THE BAR
  var CSS = '#swann-bar{position:fixed;top:0;left:0;right:0;z-index:40;height:40px;box-sizing:border-box;display:flex;align-items:center;gap:8px;padding:0 8px;' +
    'background:linear-gradient(#24143a,#160c26);border-bottom:1px solid #c8a040;font:13px/1.3 system-ui,sans-serif;color:#f0e8d8;-webkit-user-select:none;user-select:none}' +
    '#swann-bar canvas{width:50px;height:36px;flex:none;cursor:pointer}' +
    '#swann-bar .deck{display:flex;gap:3px;flex:none}' +
    '#swann-bar .deck i{display:block;width:10px;height:14px;border:1px solid #c8a040;border-radius:2px;background:#3a2058;cursor:pointer;box-sizing:border-box}' +
    '#swann-bar .deck i.here{outline:2px solid #f8d878;outline-offset:1px}' +
    '#swann-bar .t{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}' +
    '#swann-bar .t b{color:#f8d878;font-weight:600}' +
    '#swann-bar .t .pl{color:#b8a8d0}' +
    '#swann-bar button{background:#1c1230;border:1px solid #6a5488;color:#f0e8d8;border-radius:5px;padding:2px 7px;font:12px system-ui,sans-serif;cursor:pointer;flex:none}' +
    '#swann-bar button:hover{border-color:#f8d878}' +
    '#swann-bar button.on{background:#f0e8d8;color:#1c1230}' +
    '#swann-card{position:fixed;top:40px;left:0;right:0;z-index:39;max-height:56vh;overflow:auto;box-sizing:border-box;padding:8px 16px 10px 66px;' +
    'background:rgba(22,12,38,.97);border-bottom:1px solid #6a5488;font:14px/1.45 system-ui,sans-serif;color:#f0e8d8}' +
    '#swann-card .her{color:#f8d878;font-style:italic;margin:0 0 3px}' +
    '#swann-card h2{font:600 15px/1.35 system-ui,sans-serif;margin:0 0 4px}' +
    '#swann-card .look{margin:0 0 6px;max-width:62em}' +
    '#swann-card .pt{font-size:12px;color:#9a8eb0;margin:0 0 6px}' +
    '#swann-card .now{font-size:13px;margin:0 0 6px}' +
    '#swann-card .keys{font-size:12px;color:#b8a8d0}' +
    '#swann-card .keys kbd{font:600 11px ui-monospace,Consolas,monospace;background:#f0e8d8;color:#1c1230;border-radius:3px;padding:0 4px;margin:0 2px 0 6px}' +
    '#swann-card input{width:100%;max-width:56em;box-sizing:border-box;font:14px system-ui,sans-serif;padding:4px 7px;margin:2px 0 6px;border:1px solid #c8a040;border-radius:4px;background:#100a1c;color:#f0e8d8;outline:none}' +
    '#swann-card.down{display:none}';
  var ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'last'];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function vName(v) { var x = T.VERDICTS.filter(function (q) { return q[0] === v; })[0]; return x ? x[1] : ''; }
  // her face: the idle's first frame of her talking portrait (deep16/art/pt_sylvia.png), head and owl
  function face(cv) {
    var sh = window.D16 && window.D16.SHEETS && window.D16.SHEETS.pt_sylvia, src = T.root + 'deep16/' + (sh ? sh.image : 'art/pt_sylvia.png');
    var im = new Image(); im.onload = function () { var x = cv.getContext('2d'); x.imageSmoothingEnabled = true; x.clearRect(0, 0, cv.width, cv.height); x.drawImage(im, 38, 0, 112, 81, 0, 0, cv.width, cv.height); };
    im.src = src;
  }
  // T.mount(k): the bar for the dealt deck's card k (0-based) over this page; o.deck a deck to use in place of the one held (the bench)
  T.mount = function (k, o) {
    o = o || {};
    if (T.bar) T.unmount();
    var d = o.deck || T.deck(), E = DS.EYES || {}, B = { k: k, up: true, noting: null, d: d };
    T.bar = B;
    var st = document.createElement('style'); st.id = 'swann-css'; st.textContent = CSS; document.head.appendChild(st);
    var bar = B.el = document.createElement('div'); bar.id = 'swann-bar';
    var card = B.card = document.createElement('div'); card.id = 'swann-card';
    document.body.appendChild(bar); document.body.appendChild(card);
    // room for the bar: the page pushed down under it, and DEEP16's canvas fit to what is left (deep16/js/core.js D.fit: D.barH)
    B.pad0 = document.body.style.paddingTop; B.box0 = document.body.style.boxSizing;
    document.body.style.paddingTop = '40px'; document.body.style.boxSizing = 'border-box';
    var D = window.D16; if (D) { D.barH = 40; if (D.canvas && D.fit) D.fit(); }
    B.row = function () { var id = B.d && B.d.ids[B.k]; return id ? { id: id, r: E[id] || null } : null; };
    B.draw = function () { draw(B); };
    B.keyH = function (e) { keydown(B, e); };
    B.keyU = function (e) { if (!B.up || B.noting || e.target === (B.noting && B.noting.el)) return; e.stopImmediatePropagation(); };
    B.click = function (e) { if (B.up && D && D.canvas && e.target === D.canvas) lower(B); };
    window.addEventListener('keydown', B.keyH, true); window.addEventListener('keyup', B.keyU, true); window.addEventListener('mousedown', B.click, true);
    bar.addEventListener('click', function (e) { barClick(B, e); });
    card.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-k]'); if (b) act(B, b.getAttribute('data-k')); });
    draw(B);
    if (D && D.input) { D.input.held = {}; D.input.clear(); }
    return B;
  };
  T.unmount = function () {
    var B = T.bar; if (!B) return; T.bar = null;
    window.removeEventListener('keydown', B.keyH, true); window.removeEventListener('keyup', B.keyU, true); window.removeEventListener('mousedown', B.click, true);
    [B.el, B.card, document.getElementById('swann-css')].forEach(function (e) { if (e && e.parentNode) e.parentNode.removeChild(e); });
    document.body.style.paddingTop = B.pad0; document.body.style.boxSizing = B.box0;
    var D = window.D16; if (D) { D.barH = 0; if (D.canvas && D.fit) D.fit(); }
  };
  function draw(B) {
    var FB = T.fb(), cs = T.cards(B.d, null, FB), here = B.row(), r = here && here.r, f = (here && FB[here.id]) || {}, p = r ? T.place(r.url) : null, n = cs.length;
    var deck = cs.map(function (c, i) { var col = !c.up ? '' : c.pass ? T.COLORS.pass : c.v ? T.COLORS[c.v] : T.COLORS.note; return '<i data-card="' + i + '"' + (i === B.k ? ' class="here"' : '') + ' title="' + esc((c.row ? c.row.title : 'cut since the deal') + (c.up ? ' -- ' + (c.pass ? 'passed' : vName(c.v) || 'noted') : '')) + '"' + (col ? ' style="background:' + col + '"' : '') + '></i>'; }).join('');
    var title = !B.d ? esc(T.LINES.none) : !r ? 'This card was cut from the list since the deal.' : '<b>CARD ' + (B.k + 1) + '/' + n + '</b> <span class="pl">' + esc(p.name) + '</span> &middot; ' + esc(r.title);
    var keys = T.VERDICTS.slice(0, 3).map(function (v) { return '<button data-k="' + v[0] + '"' + (f.v === v[0] ? ' class="on"' : '') + ' title="' + v[1] + '">' + v[2] + ' ' + v[1] + '</button>'; }).join('') +
      '<button data-k="note" title="a note in your words">N note</button><button data-k="pass" title="don\'t need to see it"' + (T.passed(FB, here && here.id) ? ' class="on"' : '') + '>P pass</button>' +
      '<button data-k="card" title="H: the card up or down">' + (B.up ? '▴' : '▾ H') + '</button><button data-k="table" title="her table">table</button>';
    B.el.innerHTML = '<canvas width="100" height="72" title="Sylvia Swann"></canvas><span class="deck">' + deck + '</span><span class="t">' + title + '</span>' + (B.d && r ? keys : '<button data-k="table">her table</button>');
    face(B.el.querySelector('canvas'));
    B.card.className = B.up && B.d && r ? '' : 'down';
    if (!(B.up && B.d && r)) { B.card.innerHTML = ''; return; }
    var now = (f.v ? 'Marked: <b>' + esc(vName(f.v)) + '</b>' : '') + (String(f.note || '').trim() ? (f.v ? ' &middot; ' : '') + 'note: ' + esc(f.note) : '');
    B.card.innerHTML = '<p class="her">' + esc((T.LINES.card[B.k] || ('Card ' + (B.k + 1) + '.')) + ' ' + cap(p.name) + '.') + '</p><h2>' + esc(r.title) + '</h2><p class="look">' + esc(r.look || '') + '</p>' +
      '<p class="pt">' + esc(r.pt || '') + '</p>' + (now ? '<p class="now">' + now + '</p>' : '') +
      (B.noting ? '<input id="swann-note" type="text" maxlength="800" autocomplete="off" placeholder="what you saw -- Enter keeps it, Esc leaves it">' : '') +
      '<p class="keys">' + T.VERDICTS.map(function (v) { return '<kbd>' + v[2] + '</kbd>' + v[1]; }).join(' ') + ' <kbd>N</kbd>a note <kbd>P</kbd>pass (don\'t need to see it) <kbd>&larr;</kbd><kbd>&rarr;</kbd>the other cards' +
      ' <kbd>Enter</kbd>lay the card down and look (<kbd>H</kbd>brings it back)</p>';
    if (B.noting) noteField(B);
  }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function noteField(B) {
    var el = B.card.querySelector('#swann-note'), here = B.row(); if (!el || !here) return;
    var f = T.fb()[here.id] || {}; el.value = String(f.note || '').trim() === T.PASS ? '' : f.note || ''; B.noting.el = el;
    var done = function (keep) {
      if (!B.noting || B.noting.el !== el) return;
      var then = B.noting.then; B.noting = null;
      if (keep) T.note(here.id, el.value);
      if (keep && then) { answered(B, 'note'); return; }
      draw(B);
    };
    el.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); done(true); } else if (e.key === 'Escape') { e.preventDefault(); done(false); } });
    el.addEventListener('keyup', function (e) { e.stopPropagation(); });
    el.addEventListener('blur', function () { if (B.noting && B.noting.el === el && !B.noting.then) done(true); });
    B.noting.done = done;
    setTimeout(function () { try { el.focus(); } catch (e) { /* (no focus: Enter still keeps it) */ } }, 0);
  }
  function raise(B) { B.up = true; var D = window.D16; if (D && D.input) { D.input.held = {}; D.input.clear(); } draw(B); }
  function lower(B) { B.up = false; B.noting = null; draw(B); var D = window.D16; if (D && D.canvas) try { D.canvas.focus(); } catch (e) { /* (no focus) */ } }
  // an answer: a beat in the bar, then on to the next card face down, or her table
  function answered(B, what) {
    var FB = T.fb(), here = B.row(), f = FB[here.id] || {}, nx = T.nextCard(B.d, B.k, FB);
    B.el.querySelector('.t').innerHTML = '<b>' + esc(what === 'pass' ? 'passed' : f.v ? vName(f.v) : 'noted') + '</b> &middot; ' + (nx < 0 ? 'to her table' : 'on to the ' + ORD[Math.min(nx, 5)] + ' card');
    B.card.className = 'down'; B.leaving = true; // (no second answer in the beat before the door changes)
    go(T.onFrom(B.d, B.k));
  }
  function act(B, k) {
    if (B.leaving) return;
    var here = B.row(); if (!here || !here.r) { if (k === 'table') go(T.tableHref()); return; }
    if (k === 'works' || k === 'hard' || k === 'easy') { T.mark(here.id, k); answered(B, k); return; }
    if (k === 'broken' || k === 'unclear') { T.mark(here.id, k); B.up = true; B.noting = { then: true }; draw(B); return; } // (what broke, in his words, then and there)
    if (k === 'note') { B.up = true; B.noting = { then: false }; draw(B); return; }
    if (k === 'pass') { T.pass(here.id); answered(B, 'pass'); return; }
    if (k === 'card') { if (B.up) lower(B); else raise(B); return; }
    if (k === 'table') { go(T.tableHref()); return; }
    if (k === 'prev' || k === 'next') { var n = B.d.ids.length, to = (B.k + (k === 'next' ? 1 : -1) + n) % n, r = (DS.EYES || {})[B.d.ids[to]]; go(r ? T.cardHref(r, to) : T.tableHref()); }
  }
  function barClick(B, e) {
    var c = e.target.closest && e.target.closest('[data-card]'), b = e.target.closest && e.target.closest('[data-k]');
    if (c) { var i = +c.getAttribute('data-card'), r = (DS.EYES || {})[B.d.ids[i]]; if (i !== B.k && r) go(T.cardHref(r, i)); return; }
    if (b) { act(B, b.getAttribute('data-k')); return; }
    if (e.target.closest && e.target.closest('.t, canvas')) act(B, 'card');
  }
  var KEYS = { Digit1: 'works', Numpad1: 'works', Digit2: 'broken', Numpad2: 'broken', Digit3: 'unclear', Numpad3: 'unclear', Digit4: 'hard', Numpad4: 'hard', Digit5: 'easy', Numpad5: 'easy',
    KeyN: 'note', KeyP: 'pass', ArrowLeft: 'prev', ArrowRight: 'next', Enter: 'card', NumpadEnter: 'card', Escape: 'card', KeyH: 'card' };
  function keydown(B, e) {
    var t = e.target, D = window.D16;
    if (B.noting && t === B.noting.el) return; // (the note's own: its keys stop there)
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return; // (a field of the page's own -- the gallery's note, a name)
    if ((D && D.typing) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (B.leaving) { e.stopImmediatePropagation(); e.preventDefault(); return; } // (answered: the next door is opening)
    if (!B.up) { if (e.code === 'KeyH') { e.preventDefault(); e.stopImmediatePropagation(); raise(B); } return; } // (the card down: every key the game's but H)
    e.stopImmediatePropagation(); // (the card up: the game hears none of it -- immediate, as the game listens on window too: deep16/js/core.js)
    var k = KEYS[e.code]; if (!k) return;
    e.preventDefault(); if (e.repeat) return;
    if (!B.row() || !B.row().r) { if (k === 'card') lower(B); return; }
    act(B, k);
  }
  // on any page whose address carries &tour=<card>: the bar, once the page is there
  var tq = /[?&]tour=(\d+)/.exec(window.location.search || '');
  if (tq) { var k0 = Math.max(0, +tq[1] - 1); if (window.D16) window.D16.barH = 40; if (document.body) T.mount(k0); else document.addEventListener('DOMContentLoaded', function () { T.mount(k0); }); }
})();
