/* THE SNOOT -- the page (10-14, the Snoot mode seat): the title, the orders, the day's resolve played out on the map, the beats (the hunt,
   the Dominion, the head), the tally, the save. The player writes an order for every unit of ours (RULED 10-13); a click on one of ours
   selects it, a click on any other hex (or a right-click anywhere) sends it there; HOLD and CHARGE IF CHARGED are the panel's. The day
   is kept in this browser ('snoot.save.v1') at every dawn, so a closed tab comes back at the same morning (CONTINUE). */
'use strict';
(function () {
  var SN = window.SN, V = SN.V, UI = SN.UI = {}, st = null, frame = 0, busy = false, gen = null, shown = 0, KEY = 'snoot.save.v1';
  var Q = location.search, PROBE = /[?&]probe\b/.test(Q), WATCH = /[?&]watch\b/.test(Q);
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  UI.state = function () { return st; };
  UI.toast = function (t) { var el = $('toast'); el.textContent = t; el.style.display = 'block'; clearTimeout(UI._tt); UI._tt = setTimeout(function () { el.style.display = 'none'; }, 3200); };
  UI.focus = function () { try { $('map').focus(); } catch (e) { } };

  // ---------------------------------------------------------------- the cards
  UI.card = function (html, buttons) {
    $('card').innerHTML = html + '<div class="row">' + (buttons || [{ label: 'ON', go: true }]).map(function (b, i) { return '<button data-i="' + i + '"' + (b.go ? ' class="go"' : '') + '>' + b.label + '</button>'; }).join('') + '</div>';
    $('cardM').classList.add('open');
    [].forEach.call($('card').querySelectorAll('.row button'), function (el) { el.onclick = function () { var b = (buttons || [{}])[+el.getAttribute('data-i')]; UI.closeCard(); if (b && b.fn) b.fn(); }; });
    if (WATCH && !(st && st.over)) { var go = $('card').querySelector('.row button.go'); clearTimeout(UI._wt); UI._wt = setTimeout(function () { if (go && document.body.contains(go)) go.click(); }, 1200); } // (?watch: the cards turn themselves)
  };
  UI.closeCard = function () { $('cardM').classList.remove('open'); };
  UI.cardOpen = function () { return $('cardM').classList.contains('open'); };
  UI.title = function () {
    var saved = null; try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) { saved = null; }
    var b = [{ label: 'NEW BATTLE', go: true, fn: function () { UI.newGame(); } }];
    if (saved && saved.units && !saved.over && !/[?&]fresh\b/.test(Q)) b.unshift({ label: 'CONTINUE (Day ' + saved.day + ')', go: true, fn: function () { UI.load(saved); } });
    b.push({ label: 'HOW IT PLAYS', fn: function () { UI.help(true); } });
    UI.card('<h1>THE SNOOT</h1><p class="small">A playtest for the Chef &middot; Tarlyn\'s Pit, the autumn the gnoll king died</p>' +
      '<p><b>Chef:</b> Griz built this battle on the rules you cobbled together from CHAINMAIL and OD&amp;D -- the Combat Tables, post-melee morale, heroes and super-heroes, the wilderness day of five-mile hexes. It is a test, and your verdict is the point of it: what plays, what does not, what the old books would have done instead.</p>' +
      '<p>Two days after the giants came down, the four walk into Tarlyn\'s Pit. The gnoll tribes are <b>snooting</b>: their king is dead and the Mane goes to whoever wins the most glory -- and nothing is more glorious than a Lupine\'s head. GreyFang, who runs the Pit\'s fighting pit, is the walking jackpot. And something with mirrors for eyes is hunting him.</p>' +
      '<p>You command the four, GreyFang and his pit men, and Newland\'s soldiers; the plains tribes ride in on their own to smash the Snoot (the computer moves them). A day is a turn; you write every unit\'s orders, then the day plays out. The battle is fought by CHAINMAIL\'s rules and OD&amp;D\'s wilderness: a playtest build, riffed off the old books.</p>' +
      '<p><b>One battle</b> runs Day 14 to the fall of GreyFang\'s head and the Dominion after it: thirty to forty-five minutes. HOW IT PLAYS has the rules on one card; hover a march to see the odds before you send it.</p>' +
      '<p><b>Your notes</b> go to Griz: NOTES (top right, or N) any time -- it keeps what you write on this machine -- and it opens by itself when the battle ends. COPY FOR DISCORD, or SAVE FILE and send him the file (it carries every roll, so he can replay your battle).</p>', b);
  };
  UI.help = function (fromTitle) {
    UI.card('<h1>HOW IT PLAYS</h1>' +
      '<h2>The turn</h2><p>A turn is a day; a hex is about five miles (OD&amp;D Book III); a figure on a badge is twenty men (CHAINMAIL). Click one of your units (a <b>gold dot</b> on its badge means no order yet), then click where it should go: it marches as far as it can today, and the dotted line is the rest of the way. Or <b>HOLD</b>, or <b>CHARGE IF CHARGED</b> (it joins any fight next to it). Right-click sends a unit onto a hex where your own stand. When every unit has its orders, <b>RESOLVE THE DAY</b> (Enter).</p>' +
      '<h2>The day</h2><p>Everyone moves at once, the fast arriving first. Units that meet fight: up to three rounds on CHAINMAIL\'s Combat Tables, with morale after each round. The loser backs off, retreats, routs or surrenders; a rout spreads to friends it runs into. If three rounds leave both standing, night falls and the lower morale total backs off a hex: no one ends the day sharing a hex. A unit that fights three rounds in a day is fatigued till it rests a day.</p>' +
      '<p><b>Every fight plays as a show</b>: the two sides face off on that hex\'s ground, each side\'s dice roll on screen, the killed fall, the morale result goes up, witnesses run in. SPACE (or a click) skips a fight, Esc the rest of the day; the log on the right keeps every roll.</p>' +
      '<p><b>Before you send a unit</b>, hover where it would march: if it would meet an enemy (if they hold -- their orders are secret), a pop-up gives both sides\' dice and kill numbers off the tables, morale, the charge die, the shock, and the witnesses waiting to fill a gnoll win.</p>' +
      '<h2>The four</h2><p>The party are Super-heroes. Every fight they stand in is fought on the grid (DEEP16): you play it out there, and the result comes back to the map. What they spend stays spent; a day spent in the Pit without a fight is a long rest.</p>' +
      '<h2>The Snoot</h2><p><b>The witness:</b> a gnoll band that wins a fight is filled up from every gnoll band within two hexes. Glory draws followers.<br><b>The Harbinger</b> hunts GreyFang from Day 18 (sooner if GreyFang strays near him). Only a hero (a paladin), GreyFang or the four can hold him; anyone else he walks straight through. When he reaches GreyFang the head is taken: on the grid if the four are with GreyFang or next to the fight, on the map if not. Then every gnoll goes home.<br><b>The Dominion:</b> two days after the hunt begins, three wagons come along the west road. Mop them up and the battle is over.</p>' +
      '<h2>Who is who</h2><p>Newland\'s units carry a paladin (a Hero: +1 to the unit\'s dice) or a cleric (never surrenders, +1 morale, mends a figure a day) or both. The plains tribes are berserkers and their own masters: the computer moves them -- they charge any gnolls within two hexes, hunt the rest, and never check morale. Crossbows loose a volley before the melee. Horse charging over open ground adds a die a figure; standing horse defends a class down. Gnolls attack as Armored Foot and defend as Heavy Foot, morale +2 (OD&amp;D Book II).</p>' +
      '<h2>Keys</h2><p class="small">Tab the next unit without orders &middot; Enter resolve the day &middot; N notes &middot; H this card &middot; Esc deselect. The rules as read, with page numbers: <a href="rules-source.md" target="_blank" style="color:#ffe08a">rules-source.md</a>.</p>',
      [{ label: fromTitle ? 'BACK' : 'ON', go: true, fn: fromTitle ? UI.title : null }]);
  };

  // ---------------------------------------------------------------- a battle
  UI.newGame = function (seed) {
    var m = /[?&]seed=(\d+)/.exec(Q);
    seed = seed != null ? seed : m ? +m[1] : (Math.random() * 4294967295) >>> 0;
    st = SN.newGame(seed);
    if (SN.PARTY8) { st.party8 = JSON.parse(JSON.stringify(SN.PARTY8)); st.party80 = JSON.parse(JSON.stringify(SN.PARTY8)); }
    SN.dawn(st); shown = 0; $('log').innerHTML = ''; V.sel = null; V.preload(st); UI.save(); UI.render();
    UI.card('<h1>DAY 14</h1><p>The four stand in Tarlyn\'s Pit with GreyFang, his pit men and Newland\'s road patrol. The Skull-Gate\'s bands are already out of the hills, on the road above the Pit. The Gray Keeping holds the moot ground; the Wall-Laugh sits on its seat.</p><p>Write your orders. The plains tribes and Newland\'s battalions are on their way (Days 16 to 18).</p>', [{ label: 'TO THE MAP', go: true, fn: WATCH ? function () { setTimeout(UI.auto, 400); } : null }]);
  };
  UI.load = function (saved) { st = saved; shown = 0; $('log').innerHTML = ''; V.sel = null; V.preload(st); UI.render(); };
  UI.save = function () { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };

  // the day resolves: the moves play on the map, each fight the four stand in goes to the grid, the rest is on the tables in the log
  UI.resolve = function () {
    if (busy || !st || st.over || UI.cardOpen() || SN.Notes.isOpen()) return;
    busy = true; V.sel = null; UI.tip(null); UI.render(); SN.Show.skipDay = false;
    gen = SN.resolve(st); step();
  };
  function step(val) {
    var r;
    try { r = gen.next(val); } catch (e) { busy = false; UI.render(); UI.card('<h1>SOMETHING BROKE</h1><p>' + esc(e && e.message || e) + '</p><p class="small">Please tell Griz (NOTES): this is a bug.</p>', [{ label: 'ON', go: true }]); console.error(e); return; }
    UI.renderLog();
    if (r.done) return dayDone();
    var v = r.value;
    if (v.anim) {
      V.anim = { steps: v.anim, t0: frame, dur: 75 };
      return setTimeout(function () { V.anim = null; SN.contested(st).forEach(function (h) { V.flash.push({ at: h, t0: frame }); }); step(); }, 75 * 16.7 + 60);
    }
    if (v.show) { if (PROBE) return step(); return SN.Show.play(st, v.show.from, v.show.to, v.show.at, function () { UI.render(); step(); }); } // (the day's fights as a show: js/show.js)
    if (v.deep) {
      var d = v.deep, what = d.kind === 'greyfang' ? '<h1>GREYFANG\'S PIT</h1><p>The Harbinger has reached GreyFang, and the four are there. The fight goes to the grid.</p>' :
        d.kind === 'harbinger' ? '<h1>THE HARBINGER</h1><p>The four stand in the Harbinger\'s way. The fight goes to the grid.</p>' :
        '<h1>THE FOUR FIGHT</h1><p>At ' + esc(SN.placeName(d.at)) + ' the four meet ' + (d.dominion ? 'the Dominion\'s soldiers' : 'a war-band of the Snoot') + ' (' + (d.enemies || []).length + ' on the grid). The fight goes to the grid; the rest of the field waits.</p>';
      var go = function () { SN.Deep.fight(st, d, function (res) { UI.render(); step(res); }); };
      if (WATCH || !st.party8) return go();
      return UI.card(what + '<p class="small">On the grid: win it, and the band breaks on the map; get out of it (LEAVE THE FIGHT), and the four fall back a hex.</p>', [{ label: 'TO THE GRID', go: true, fn: go }]);
    }
    step();
  }
  function dayDone() {
    busy = false;
    if (st.over) { UI.save(); UI.render(); return UI.end(); }
    var head = st.events.some(function (e) { return e.kind === 'head'; }), hd = st.head;
    SN.dawn(st); UI.save(); UI.render();
    var beats = [];
    if (head) beats.push('<h1>THE HEAD</h1><p>' + (hd.witnessed ? 'In front of the four, the Harbinger takes GreyFang\'s head.' : 'No one of ours was near. The Harbinger takes GreyFang\'s head.') + ' <i>"The Mane is mine."</i></p><p>The Harbinger walks back to the moot ground, and every gnoll on the field turns for home. The Snoot has its head.' + (st.domIn ? ' The Dominion\'s wagons are still on the field.' : ' Something else is coming along the west road.') + '</p>');
    st.events.forEach(function (e) {
      if (e.kind === 'hunt') beats.push('<h1>THE HUNT</h1><p>On the crown of a hill a gnoll stands too still, and both its eyes are mirrors. The Harbinger is hunting GreyFang.</p><p class="small">Only a paladin, GreyFang or the four can hold him: he walks through anyone else. Keep the four with GreyFang, or next to him, to be there when it comes.</p>');
      if (e.kind === 'dominion') beats.push('<h1>THE DOMINION</h1><p>Three Dominion wagons come along the west road, soldiers walking beside them and a lady on each bench -- warlocks. They have come to watch how this burns.</p><p class="small">The battle ends when the head is taken and the Dominion is gone from the field.</p>');
    });
    (function next() { var b = beats.shift(); if (b) UI.card(b, [{ label: 'ON', go: true, fn: next }]); else if (WATCH) setTimeout(UI.auto, 500); })();
    var arr = st.events.filter(function (e) { return e.kind === 'arrive'; }).map(function (e) { return SN.unit(st, e.id).name; });
    if (arr.length) UI.toast(arr.join(', ') + ' arrive' + (arr.length === 1 ? 's' : '') + '.');
  }
  UI.auto = function () { if (!st || st.over || busy || UI.cardOpen()) return; SN.AI.ours(st); UI.resolve(); };
  UI.tallyLine = function (s) {
    var T = s.tally; if (!T) return '';
    return (T.head ? 'GreyFang\'s head taken on Day ' + T.head.day + (T.witnessed ? ', the four there (WITNESS HIM)' : ', the four not there') : 'GreyFang still stands') + '; the Pit ' + (T.pitHeld ? 'held' : 'fell') + '; score <b>' + T.score + '</b> (CHAINMAIL points).';
  };
  UI.end = function () {
    var T = st.tally;
    UI.card('<h1>THE SNOOT IS OVER</h1><p>Day ' + st.day + '. ' + UI.tallyLine(st) + '</p><table>' +
      '<tr><td>Gnolls killed</td><td>' + T.gnollKilled + ' points</td></tr><tr><td>Gnolls taken prisoner</td><td>' + T.gnollPrisoners + ' points</td></tr>' +
      '<tr><td>The Dominion killed and taken</td><td>' + (T.dominionKilled + T.dominionPrisoners) + ' points</td></tr><tr><td>Ours lost' + (T.head ? ' (GreyFang among them)' : '') + '</td><td>-' + T.oursLost + ' points</td></tr>' +
      '<tr><td>Figures the witness moved</td><td>' + T.witness + '</td></tr><tr><td>Times the Harbinger was put down</td><td>' + T.beaten + '</td></tr>' +
      '<tr><td><b>Score</b></td><td><b>' + T.score + '</b></td></tr></table>' +
      (T.witnessed ? '<p><b>WITNESS HIM.</b> The four were there when GreyFang died.</p>' : '') +
      '<p class="small">Points by CHAINMAIL p.27: a gnoll 2&frac12; (a hobgoblin), heavy foot 2, horse 3-4, a hero 20, a super-hero 50, a warlock 60.</p>',
      [{ label: 'NOTES FOR GRIZ', go: true, fn: function () { SN.Notes.open(st, true); } }, { label: 'NEW BATTLE', fn: function () { try { localStorage.removeItem(KEY); } catch (e) { } UI.newGame(); } }, { label: 'LOOK AT THE FIELD' }]);
    SN.Notes.open(st, true); // (his word: the notes box opens by itself at the end of the mini-game)
  };

  // ---------------------------------------------------------------- the panel, the log, the top bar
  UI.render = function () {
    if (!st) return;
    $('dayLabel').textContent = 'Day ' + st.day + (st.head ? ' -- the head taken' : st.huntDay != null ? ' -- the hunt is on' : '');
    var todo = st.units.filter(function (u) { return SN.canOrder(st, u) && u.order.type === 'hold' && !u.held; }).length;
    $('phase').textContent = busy ? 'the day plays out...' : st.over ? 'the battle is over' : todo ? todo + ' unit' + (todo > 1 ? 's' : '') + ' without orders' : 'every unit has its orders';
    $('bResolve').disabled = busy || st.over; $('bNext').disabled = busy || st.over;
    UI.panel(); UI.renderLog();
  };
  UI.renderLog = function () {
    if (!st) return; var el = $('log');
    if (shown > st.log.length) { el.innerHTML = ''; shown = 0; }
    var html = '';
    for (; shown < st.log.length; shown++) { var l = st.log[shown]; if (l.kind === 'day' && /^Day \d+\.$/.test(l.text)) html += '<div class="l day">' + esc(l.text) + '</div>'; else html += '<div class="l ' + esc(l.kind) + '">' + esc(l.text) + '</div>'; }
    if (html) { el.insertAdjacentHTML('beforeend', html); el.scrollTop = el.scrollHeight; }
  };
  UI.panel = function () {
    var el = $('panel'), u = V.sel && SN.unit(st, V.sel);
    if (!u || !SN.alive(u) && u.state !== 'home') { el.innerHTML = '<div class="who"><div class="nm">' + (busy ? 'The day plays out.' : 'Click one of your units.') + '</div><div class="tip">Gold dot: no orders yet. Tab finds the next. Then RESOLVE THE DAY.</div></div>'; return; }
    var hs = SN.heroesOf(u), mine = u.side === 'ours', cls = u.party ? 'four Super-heroes (8th level): every fight they stand in is on the grid' :
      (u.figs || 0) + ' figure' + (u.figs === 1 ? '' : 's') + ' (' + (u.figs || 0) * 20 + ' men) of ' + SN.CLASSNAME[u.cls] + (u.def !== u.cls ? ', defends as ' + SN.CLASSNAME[u.def] : '') + ' &middot; morale ' + SN.rating(u) + ' &middot; moves ' + SN.moveOf(u) + ' a day';
    var state = [u.fatigued ? 'fatigued' : '', u.state === 'rout' ? 'ROUTING' : '', u.state === 'withdraw' ? 'going home' : '', u.stand >= st.day ? 'rallying: no orders today' : '', u.berserkOrder ? 'charging the gnolls: will not be held back' : '', u.out ? 'down: carried to the Pit, back tomorrow' : ''].filter(Boolean).join(' &middot; ');
    var hp = u.party && st.party8 ? '<div class="cls">' + st.party8.party.map(function (h) { return esc(h.name || h.id) + ' ' + h.hp + '/' + h.maxhp; }).join(' &middot; ') + '</div>' : '';
    var html = '<div class="who"><div class="nm" style="color:' + (mine ? '#7fe0c8' : u.side === 'gnoll' ? '#f0a080' : '#c8a8f0') + '">' + esc(u.party ? 'The four' : u.name) + '</div><div class="cls">' + esc(u.kind) + ' &middot; ' + cls + '</div>' +
      (hs.length && !u.party ? '<div class="cls">with ' + hs.map(function (h) { return esc(h.name) + ' (' + h.type.replace('superhero', 'Super-hero').replace('hero', 'Hero').replace('wraith', 'Wraith').replace('wizard', 'Warlock') + ')'; }).join(', ') + '</div>' : '') + hp +
      (state ? '<div class="cls" style="color:#ff9a7a">' + state + '</div>' : '') + '</div>';
    if (mine && SN.canOrder(st, u) && !busy) {
      var o = u.order, now = o.type === 'move' ? 'march to ' + esc(SN.placeName(o.to)) + (o.full && o.full.length > o.path.length ? ' (' + o.path.length + ' hexes today)' : '') : o.type === 'support' ? 'charge if charged' : 'hold';
      html += '<div class="orders"><div class="cls">Orders: <b>' + now + '</b></div><div><button id="oHold"' + (o.type === 'hold' && u.held ? ' class="on"' : '') + '>HOLD</button><button id="oSup"' + (o.type === 'support' ? ' class="on"' : '') + '>CHARGE IF CHARGED</button></div><div class="tip">Click a hex to march there (right-click to stack with your own).</div></div>';
    } else if (mine && u.berserk && SN.alive(u)) html += '<div class="orders"><div class="cls">Today: <b>' + (u.order.type === 'move' ? 'march on ' + esc(SN.placeName(u.order.to)) : 'hold') + '</b></div><div class="tip">The plains tribes ride their own way: the computer writes their orders. They charge any gnolls within two hexes and hunt the rest.</div></div>';
    else if (!mine) html += '<div class="orders"><div class="tip">The computer\'s. Its orders are written in secret, as yours are.</div></div>';
    if (u.note) html += '<div class="note">' + esc(u.note) + '</div>';
    el.innerHTML = html;
    if ($('oHold')) $('oHold').onclick = function () { u.order = { type: 'hold' }; u.held = true; UI.render(); };
    if ($('oSup')) $('oSup').onclick = function () { u.order = { type: 'support' }; u.held = true; UI.render(); };
  };
  // the move's preview (his question 10-14 night; js/rules.js SN.preview): a selected unit of ours, the mouse on where it would march
  var tipKey = null;
  UI.tip = function (h, x, y) {
    var el = $('tip'), u = st && V.sel && SN.unit(st, V.sel);
    if (!h || !u || busy || !SN.canOrder(st, u) || SN.same(h, u.at) || UI.cardOpen() || SN.Notes.isOpen()) { el.style.display = 'none'; tipKey = null; return; }
    var key = V.sel + '@' + SN.key(h) + '#' + st.day;
    if (key !== tipKey) {
      tipKey = key; var info = SN.preview(st, u, h);
      if (!info) { el.style.display = 'none'; return; }
      el.innerHTML = '<div class="h">' + (info.hit ? 'Likely a fight at ' + esc(info.place) : 'Marching to ' + esc(info.place)) + '</div>' + info.lines.map(function (l) { return '<div>' + esc(l) + '</div>'; }).join('') + info.warn.map(function (l) { return '<div class="w">' + esc(l) + '</div>'; }).join('');
    }
    if (el.innerHTML) { el.style.display = 'block'; var r = $('app').getBoundingClientRect(), w = el.offsetWidth, hh = el.offsetHeight; el.style.left = Math.min(r.width - w - 8, x - r.left + 18) + 'px'; el.style.top = Math.min(r.height - hh - 8, y - r.top + 18) + 'px'; }
  };
  UI.next = function () {
    if (!st || busy) return;
    var mine = st.units.filter(function (u) { return SN.canOrder(st, u); }), open = mine.filter(function (u) { return u.order.type === 'hold' && !u.held; });
    var list = open.length ? open : mine; if (!list.length) return;
    var i = list.map(function (u) { return u.id; }).indexOf(V.sel); V.sel = list[(i + 1) % list.length].id; UI.render();
  };

  // ---------------------------------------------------------------- input
  function click(e, right) {
    if (!st || busy || UI.cardOpen() || SN.Notes.isOpen()) return;
    var r = $('map').getBoundingClientRect(), h = V.hexAt(e.clientX - r.left, e.clientY - r.top); if (!h) return;
    var here = SN.unitsAt(st, h), mineHere = here.filter(function (u) { return u.side === 'ours'; }), sel = V.sel && SN.unit(st, V.sel);
    if (!right && mineHere.length) { // (a click on our own selects them, round the stack)
      var ids = mineHere.map(function (u) { return u.id; }), i = ids.indexOf(V.sel); V.sel = ids[(i + 1) % ids.length]; UI.render(); return;
    }
    if (sel && SN.canOrder(st, sel)) {
      if (SN.same(sel.at, h)) { sel.order = { type: 'hold' }; sel.held = true; }
      else if (!SN.setOrder(st, sel, { type: 'move', to: h })) UI.toast('No way there.');
      else sel.held = true;
      UI.render(); return;
    }
    if (here.length) { V.sel = here[0].id; UI.render(); }
  }
  UI.bind = function () {
    var cv = $('map');
    cv.addEventListener('click', function (e) { click(e, false); });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); click(e, true); });
    cv.addEventListener('mousemove', function (e) { var r = cv.getBoundingClientRect(), h = V.hexAt(e.clientX - r.left, e.clientY - r.top); V.hover = h; UI.tip(h, e.clientX, e.clientY); });
    cv.addEventListener('mouseleave', function () { V.hover = null; UI.tip(null); });
    $('bResolve').onclick = UI.resolve; $('bNext').onclick = UI.next;
    $('bNotes').onclick = function () { SN.Notes.open(st, false); };
    $('bHelp').onclick = function () { UI.help(false); };
    document.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'TEXTAREA' || tag === 'INPUT') { if (e.key === 'Escape') SN.Notes.close(); return; }
      if (document.getElementById('d16')) return; // (the grid has the keys while it is up)
      if (e.key === 'Escape') { if (SN.Notes.isOpen()) SN.Notes.close(); else if (UI.cardOpen()) UI.closeCard(); else { V.sel = null; UI.render(); } }
      else if (e.key === 'Enter') { if (UI.cardOpen()) { var b = $('card').querySelector('.row button.go'); if (b) b.click(); } else UI.resolve(); e.preventDefault(); }
      else if (e.key === 'Tab') { UI.next(); e.preventDefault(); }
      else if (e.key === 'n' || e.key === 'N') { if (!SN.Notes.isOpen()) { SN.Notes.open(st, false); e.preventDefault(); } }
      else if (e.key === 'h' || e.key === 'H') { if (!UI.cardOpen()) UI.help(false); }
    });
    window.addEventListener('resize', fit);
  };
  function fit() { var w = window.innerWidth - ($('log').offsetWidth || 340), hh = window.innerHeight - 40 - ($('panel').offsetHeight || 128); $('panel').style.right = ($('log').offsetWidth || 340) + 'px'; V.fit(w, hh); }
  function loop() { frame++; if (st) V.draw(st, frame); requestAnimationFrame(loop); }
  UI.boot = function () { V.init($('map')); UI.bind(); fit(); loop(); if (WATCH) UI.newGame(); else UI.title(); };

  // ---------------------------------------------------------------- the probe's look at the page (dev/snoot-probe.py): a whole battle through the page's
  // own end, every party fight on the tables -- the notes box must be open at the end by itself, with COPY and SAVE in it
  UI.probeUI = function () {
    var out = [], bad = 0; function ok(c, w) { out.push((c ? 'ok   ' : 'FAIL ') + w); if (!c) bad++; }
    try {
      V.init($('map')); V.fit(800, 500);
      st = SN.newGame(4242); st.party8 = null; SN.dawn(st);
      V.sel = 'patrol'; UI.render(); V.draw(st, 1);
      ok(/Newland/.test($('panel').innerHTML) && !!$('oHold'), 'the panel shows a unit of ours with its orders');
      ok(SN.setOrder(st, SN.unit(st, 'patrol'), { type: 'move', to: [8, 5] }) && SN.unit(st, 'patrol').order.path.length >= 1, 'a click\'s order: the patrol marches up the road');
      var n = 0;
      while (!st.over && n++ < 40) { SN.AI.ours(st); var g = SN.resolve(st), r = g.next(); while (!r.done) { var v = r.value; r = g.next(v && v.deep ? SN.standIn(st, v.deep) : undefined); } V.draw(st, n); if (!st.over) SN.dawn(st); }
      ok(st.over, 'the battle ends (Day ' + st.day + ')');
      UI.render(); UI.end();
      ok($('notesM').classList.contains('open'), 'the notes box opens by itself at the end');
      ok(!!$('nCopy') && !!$('nSave') && !!$('nText'), 'the notes box has COPY FOR DISCORD, SAVE FILE and a place to write');
      ok(/THE SNOOT IS OVER/.test($('card').innerHTML) && /Score/.test($('card').innerHTML), 'the tally is on the card under it');
      var t = SN.Notes.text(st); ok(/THE SNOOT -- notes/.test(t) && /Result:/.test(t), 'COPY\'s text names the battle and its result');
      SN.Notes.close(); UI.help(false); ok(/HOW IT PLAYS/.test($('card').innerHTML) && /witness/i.test($('card').innerHTML) && /show/i.test($('card').innerHTML), 'the help card draws, the witness and the show in it');
      UI.closeCard(); UI.title(); ok(/Chef/.test($('card').innerHTML) && /NOTES/.test($('card').innerHTML), 'the door is the Chef\'s: the title card speaks to him and names the notes');
      // the show: every fight of the battle built and drawn at its start, its middle and its end, headless (nothing on screen waits for a frame)
      var B = st.beats || [], fights = [], cvS = document.createElement('canvas'); cvS.width = 960; cvS.height = 540;
      B.forEach(function (b, i) { if (b.t === 'fight' || b.t === 'head') fights.push(i); });
      var badShow = [], long = 0, kinds = {};
      var sumT = 0; fights.forEach(function (i, n) { var to = n + 1 < fights.length ? fights[n + 1] : B.length, sh = SN.Show.build(st, i, to, B[i].at); sumT += sh.total; if (sh.total > 10) long++; sh.segs.forEach(function (s) { kinds[s.b.t] = 1; });
        [0, sh.total / 2, sh.total].forEach(function (tt) { try { SN.Show.draw(cvS.getContext('2d'), 960, 540, sh, tt); } catch (e) { badShow.push(B[i].t + '@' + B[i].day + ': ' + e.message); } }); });
      var avg = fights.length ? sumT / fights.length : 0;
      if (/[?&]dump\b/.test(location.search)) fights.forEach(function (i, n) { var to = n + 1 < fights.length ? fights[n + 1] : B.length, sh = SN.Show.build(st, i, to, B[i].at); out.push('SHOW ' + Math.round(sh.total * 10) / 10 + ': ' + sh.segs.map(function (s) { return s.b.t + (s.list.length > 1 ? 'x' + s.list.length : '') + ':' + Math.round(s.d * 10) / 10; }).join(' ')); });
      ok(fights.length > 3 && !badShow.length, 'the show builds and draws every fight of the battle (' + fights.length + ')' + (badShow.length ? ': ' + badShow.slice(0, 3).join('; ') : ''));
      ok(kinds.atk && kinds.mor && kinds.cas, 'the show has the dice, the casualties and the morale in it (' + Object.keys(kinds).sort().join(' ') + ')');
      ok(long <= fights.length / 4 && avg <= 6.5, 'the shows run about five seconds a fight (average ' + Math.round(avg * 10) / 10 + ' s; ' + long + ' of ' + fights.length + ' over ten)');
      // the pop-up: a march into an enemy names the fight and both sides' dice
      var s2 = SN.newGame(99); SN.dawn(s2); var pu = SN.unit(s2, 'patrol'), gs = SN.unit(s2, 'sg3'), pv = SN.preview(s2, pu, gs.at);
      ok(pv && pv.hit && pv.lines.some(function (l) { return /dice, kill on \d\+/.test(l); }) && pv.lines.some(function (l) { return /Them:/.test(l); }), 'the pop-up: the patrol marching on the glory-seekers sees both sides\' dice');
      var pp = SN.preview(s2, SN.unit(s2, 'party'), gs.at);
      ok(pp && pp.lines.some(function (l) { return /grid/.test(l); }), 'the pop-up: the four marching on a band are told it goes to the grid');
      UI.closeCard();
    } catch (e) { ok(false, 'the page threw: ' + (e && e.stack || e)); }
    out.push('SNOOTPAGE ' + out.length + ' checks, ' + (bad ? bad + ' FAILED' : 'all ok'));
    return out;
  };
  // the probe's timed look (the page's #probe, after the checks above): a show must finish with no animation frames at all -- a window that is
  // not painting gives none, and the day stalled mid-show in the pane 10-14 night. The probe's browser runs its timers on virtual time
  UI.probeAsync = function (pre) {
    var line = 'FAIL the show finishes when the window paints no frames (it never finished)', raf = window.requestAnimationFrame;
    pre.textContent += '\n' + line;
    try {
      V.init($('map')); V.fit(800, 500);
      var s2 = SN.newGame(4242); s2.party8 = null; SN.dawn(s2); var n = 0;
      while (n++ < 6 && !(s2.beats || []).some(function (b) { return b.t === 'atk'; })) { SN.AI.ours(s2); var g = SN.resolve(s2), r = g.next(); while (!r.done) { var v = r.value; r = g.next(v && v.deep ? SN.standIn(s2, v.deep) : undefined); } SN.dawn(s2); }
      var B = s2.beats || [], i = B.map(function (b) { return b.t; }).indexOf('fight'), j = i + 1; while (j < B.length && B[j].t !== 'fight' && B[j].t !== 'head') j++;
      var t0 = performance.now();
      window.requestAnimationFrame = function () { return 0; };
      SN.Show.play(s2, i, j, B[i].at, function () { window.requestAnimationFrame = raf; pre.textContent = pre.textContent.replace(line, 'ok   the show finishes when the window paints no frames (' + Math.round((performance.now() - t0) / 100) / 10 + ' s)'); });
    } catch (e) { window.requestAnimationFrame = raf; pre.textContent = pre.textContent.replace(line, 'FAIL the timed show threw: ' + (e && e.message || e)); }
  };
  if (!PROBE) window.addEventListener('load', UI.boot);
})();
