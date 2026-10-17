/* THE SNOOT -- the page (10-14, the Snoot mode seat): the title, the orders, the day's resolve played out on the map, the beats (the hunt,
   the Dominion, the head), the tally, the save. The player writes an order for every unit of ours (RULED 10-13); a click on one of ours
   selects it, a click on any other hex (or a right-click anywhere) sends it there; HOLD and CHARGE IF CHARGED are the panel's. The day
   is kept in this browser ('snoot.save.v1') at every dawn, so a closed tab comes back at the same morning (CONTINUE). */
'use strict';
(function () {
  var SN = window.SN, V = SN.V, UI = SN.UI = {}, st = null, frame = 0, busy = false, gen = null, shown = 0, KEY = 'snoot.save.v1';
  var Q = location.search, PROBE = /[?&]probe\b/.test(Q), WATCH = /[?&]watch\b/.test(Q), ROAD = /[?&]from=road\b/.test(Q); // (ROAD: come from the 8-bit game's Halfway Inn -- js/events.js S.snootCall)
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
    if (ROAD) b.push({ label: 'BACK TO THE ROAD', fn: function () { location.href = '../'; } });
    UI.card('<h1>THE SNOOT</h1><p class="small">A playtest for the Chef &middot; Tarlyn\'s Pit, the autumn the gnoll king died</p>' +
      '<p><b>Chef:</b> Griz built this battle on the rules you cobbled together from CHAINMAIL and OD&amp;D -- the Combat Tables, post-melee morale, heroes and super-heroes, the wilderness day of five-mile hexes. It is a test, and your verdict is the point of it: what plays, what does not, what the old books would have done instead.</p>' +
      '<p>Two days after the giants came down, the four are at the Halfway Inn, on the road down to Tarlyn\'s Pit. The gnoll tribes are <b>snooting</b>: their king is dead and the Mane goes to whoever wins the most glory -- and nothing is more glorious than a Lupine\'s head. GreyFang, who runs the Pit\'s fighting pit, is the walking jackpot. And something with mirrors for eyes is hunting him.</p>' +
      '<p>You command the four, GreyFang and his pit men, and Newland\'s soldiers; the plains tribes ride in on their own to smash the Snoot (the computer moves them). A day is a turn; you write every unit\'s orders, then the day plays out. The battle is fought by CHAINMAIL\'s rules and OD&amp;D\'s wilderness: a playtest build, riffed off the old books.</p>' +
      '<p><b>One battle</b> runs Day 14 to the fall of GreyFang\'s head and the Dominion after it: thirty to forty-five minutes. HOW IT PLAYS has the rules on one card; hover a march to see the odds before you send it.</p>' +
      '<p><b>Your notes</b> go to Griz: NOTES (top right, or N) any time -- it keeps what you write on this machine -- and it opens by itself when the battle ends. COPY FOR DISCORD, or SAVE FILE and send him the file (it carries every roll, so he can replay your battle).</p>', b);
  };
  UI.help = function (fromTitle) {
    UI.card('<h1>HOW IT PLAYS</h1>' +
      '<h2>The turn</h2><p>A turn is a day; a hex is about five miles (OD&amp;D Book III); the number on a badge is its men -- one man a figure, OD&amp;D Book III\'s basic system (CHAINMAIL\'s twenty to a figure is for battles far bigger than this one). Click one of your units (a <b>gold dot</b> on its badge means no order yet; once it has its order the next one is selected), then click where it should go: it marches as far as it can today, and the dotted line is the rest of the way. Or <b>HOLD</b>, or <b>CHARGE IF CHARGED</b> (it joins any fight next to it), or <b>AVOID</b> (it holds, and if anything comes at it, it tries to slip a hex away on OD&amp;D Book III\'s chances: the fewer it is and the stronger they are, the better; doubled if they were surprised, none if it was, unless it has magic; 25% for being twice as fast). The Dominion\'s wagons avoid. Right-click sends a unit onto a hex where your own stand. When every unit has its orders, <b>RESOLVE THE DAY</b> (Enter).</p>' +
      '<h2>The day</h2><p>Everyone moves at once, the fast arriving first. Units that meet fight: up to three rounds on CHAINMAIL\'s Combat Tables, with morale after each round. The loser backs off, retreats or routs: <b>no one surrenders</b> -- neither side would take the other (Griz\'s rule; the book\'s 100 and over is a rout too). <b>Men who rout</b>, yours or the Dominion\'s, run to the nearest steady unit of their own within two hexes and join it, or scatter for home and are gone (a hero cuts free and falls back alone); gnolls rout a move and a half, rout the friends they run into, and rally by the book\'s table. When a fight begins each side rolls a die for <b>surprise</b> (OD&amp;D Book III): on a 1 or 2 it is caught unready and taken in the flank in the first round -- in the rear if three or more units come at it; a side that has already fought that day is awake to it. If three rounds leave both standing, night falls and the lower morale total backs off a hex: no one ends the day sharing a hex. A unit that fights three rounds in a day is fatigued till it rests a day. <b>Holding ground:</b> a unit that stood its ground in Tarlyn\'s Pit or at the Halfway Inn (it did not march in that day) -- or gnolls on their tribes\' seats -- gets no charge die against it, takes half from the volleys at it (walls are cover, CHAINMAIL p.12), and adds 1 to its morale.</p>' +
      '<p><b>Every fight plays as a show</b>: the map flies down into that hex, the units stand in their formations on the sides they came in through, each side\'s dice roll on screen, the killed fall, the morale result goes up, witnesses run in, and the map flies back out. SPACE (or a click) skips a fight, Esc the rest of the day; the log on the right keeps every roll.</p>' +
      '<p><b>Before you send a unit</b>, hover where it would march: if it would meet an enemy (if they hold -- their orders are secret), a pop-up gives both sides\' dice and kill numbers off the tables, morale, the charge die, the shock, and the witnesses waiting to fill a gnoll win.</p>' +
      '<h2>Formation and facing</h2><p>Every unit stands in a <b>LINE</b>, a <b>COLUMN</b> or (foot only) a <b>SQUARE</b>, and faces one side of its hex (CHAINMAIL p.10). An enemy that comes in through a unit\'s <b>flank</b> fights a class up; through its <b>rear</b>, a class up and the unit strikes nothing back in the first round (p.16). A line\'s front is three sides; a column\'s one, but horse and wagons in column march further on the road (the book\'s road bonus: heavy horse a hex, medium and light horse and wagons two; foot none); a square is all front, moves a hex a day, and horse get no charge die against it. Set them free on Day 14 (and on a unit\'s arrival day); after that a change costs half the day\'s move, and a unit caught in a fight the day it changed counts as flanked. A unit that marches faces the way it went; turning in place is free (Q and E, or the panel).</p>' +
      '<h2>The four</h2><p>Every fight the four stand in is fought on the grid (DEEP16): you play it out there, up to six men of yours from their hex beside them (DEEP16\'s soldiers, on the computer\'s hand), and the result comes back to the map man for man. After every fight they take a short rest (the fallen stand, hit dice heal, Second Wind, Action Surge and Channel Divinity come back, a wizard\'s Arcane Recovery once a day); every dusk a long rest, wherever they stand.</p>' +
      '<h2>The Snoot</h2><p><b>The witness:</b> a gnoll band that wins a fight is filled up from every gnoll band within two hexes. Glory draws followers.<br><b>The Harbinger</b> hunts GreyFang from Day 18 (sooner if GreyFang strays near him). Only a hero (a paladin), GreyFang or the four can hold him; anyone else he walks straight through. When he reaches GreyFang the head is taken: on the grid if the four are with GreyFang or next to the fight, on the map if not. Then every gnoll goes home.<br><b>The Dominion:</b> two days after the hunt begins, three wagons come along the west road. Mop them up and the battle is over.</p>' +
      '<h2>Who is who</h2><p>Newland\'s units carry a paladin (a Hero, four men\'s worth: +1 to the unit\'s dice) or a cleric (+1 morale, mends a few men a day) or both; the road patrol is <b>mixed</b> -- twelve heavy foot and four horse with a supply wagon, each type rolling its own row (CHAINMAIL p.15) -- and two of your units in one hex can <b>COMBINE</b> (the ring) into one mixed unit, with no splitting back. Newland\'s forty heavy foot, forty crossbows and twenty horse come up the south road on Day 18; sixty of the plains tribes bring the horses in to the Pit before they join the fight. The plains tribes are berserkers and their own masters: the computer moves them -- they charge any gnolls within two hexes, hunt the rest, and never check morale. Crossbows loose a volley before the melee. Horse charging over open ground adds a die a figure; standing horse defends a class down. Gnolls attack as Armored Foot and defend as Heavy Foot, morale +2 (OD&amp;D Book II).</p>' +
      '<p>The Gray Keeping\'s women are its clerics, and they pray only where a relic is. The <b>death-watch</b> keeps the Mane on the moot ground and never leaves it: the Eldest is a Super-hero (OD&amp;D Book I\'s Patriarch), and once a day she prays <b>Insect Plague</b> into a fight on the moot or next to it -- the biggest unit of men there is driven off in rout, berserkers too; heroes stand -- and <b>Entangle</b> on the moot, which holds a unit where it stands for the day: no charge die, struck as from the flank, no falling back. A matriarch with the tribe\'s band, a Hero, <b>Blesses</b> it as it fights (+1 to its dice and morale), and the young blood have clerics with them.</p>' +
      '<h2>Keys</h2><p class="small">Tab the next unit without orders &middot; the ring round a selected unit: MOVE (then click where -- your own units\' hex too), HOLD, CHARGE? (charge if charged: join a fight next to it), AVOID, FORMATION (it tells you the cost first; BACK leaves it) and the turns &middot; Q / E turn the unit &middot; the wheel or + / - zoom, a drag or the arrows pan &middot; Enter resolve the day &middot; N notes &middot; H this card &middot; Esc deselect. The rules as read, with page numbers: <a href="rules-source.md" target="_blank" style="color:#ffe08a">rules-source.md</a>.</p>',
      [{ label: fromTitle ? 'BACK' : 'ON', go: true, fn: fromTitle ? UI.title : null }]);
  };

  // ---------------------------------------------------------------- a battle
  UI.newGame = function (seed) {
    var m = /[?&]seed=(\d+)/.exec(Q);
    seed = seed != null ? seed : m ? +m[1] : (Math.random() * 4294967295) >>> 0;
    st = SN.newGame(seed);
    if (SN.PARTY8) { st.party8 = JSON.parse(JSON.stringify(SN.PARTY8)); st.party80 = JSON.parse(JSON.stringify(SN.PARTY8)); }
    SN.dawn(st); shown = 0; $('log').innerHTML = ''; V.sel = null; V.preload(st); UI.save(); UI.render();
    UI.card('<h1>DAY 14</h1><p>The four are at the Halfway Inn; GreyFang, his pit men and Newland\'s road patrol hold Tarlyn\'s Pit. The Skull-Gate\'s bands are already out of the hills, on the road between them. The Gray Keeping holds the moot ground; the Wall-Laugh sits on its seat.</p><p>Write your orders. The plains tribes and Newland\'s battalions are on their way (Days 16 to 18).</p>', [{ label: 'TO THE MAP', go: true, fn: WATCH ? function () { setTimeout(UI.auto, 400); } : null }]);
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
      '<p class="small">Points by CHAINMAIL p.27, a man as a figure: a gnoll 2&frac12; (a hobgoblin), heavy foot 2, horse 3-4, a hero 20, a super-hero 50, a warlock 80.</p>',
      [{ label: 'NOTES FOR GRIZ', go: true, fn: function () { SN.Notes.open(st, true); } }, { label: 'NEW BATTLE', fn: function () { try { localStorage.removeItem(KEY); } catch (e) { } UI.newGame(); } }, { label: 'LOOK AT THE FIELD' }].concat(ROAD ? [{ label: 'BACK TO THE ROAD', fn: function () { location.href = '../'; } }] : []));
    SN.Notes.open(st, true); // (his word: the notes box opens by itself at the end of the mini-game)
  };

  // ---------------------------------------------------------------- the panel, the log, the top bar
  UI.render = function () {
    if (!st) return;
    $('dayLabel').textContent = 'Day ' + st.day + (st.head ? ' -- the head taken' : st.huntDay != null ? ' -- the hunt is on' : '');
    var todo = st.units.filter(function (u) { return SN.canOrder(st, u) && u.order.type === 'hold' && !u.held; }).length;
    $('phase').textContent = busy ? 'the day plays out...' : st.over ? 'the battle is over' : todo ? todo + ' unit' + (todo > 1 ? 's' : '') + ' without orders' : 'every unit has its orders';
    $('bResolve').disabled = busy || st.over; $('bNext').disabled = busy || st.over;
    UI.panel(); UI.renderLog(); UI.ring();
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
      (u.groups ? SN.parts(u).map(function (g) { return g.n + ' ' + SN.CLASSNAME[g.cls]; }).join(', ') + ' (' + (u.figs || 0) + ' men)' : (u.figs || 0) + ' ' + (u.figs === 1 ? 'man' : 'men') + ' of ' + SN.CLASSNAME[u.cls]) + (u.wagon && u.side === 'ours' ? ' and a supply wagon' : '') + (!u.groups && u.def !== u.cls ? ', defends as ' + SN.CLASSNAME[u.def] : '') + ' &middot; morale ' + SN.rating(u) + ' &middot; moves ' + SN.moveOf(u) + ' a day'; // (one man a figure, RULED 10-15)
    var state = [u.fatigued ? 'fatigued' : '', u.state === 'rout' ? 'ROUTING' : '', u.state === 'withdraw' ? 'going home' : '', u.stand >= st.day ? 'rallying: no orders today' : '', u.berserkOrder ? 'charging the gnolls: will not be held back' : '', u.out ? 'down: carried to the Pit, back tomorrow' : ''].filter(Boolean).join(' &middot; ');
    var hp = u.party && st.party8 ? '<div class="cls">' + st.party8.party.map(function (h) { return esc(h.name || h.id) + ' ' + h.hp + '/' + h.maxhp; }).join(' &middot; ') + '</div>' : '';
    var html = '<div class="who"><div class="nm" style="color:' + (mine ? '#7fe0c8' : u.side === 'gnoll' ? '#f0a080' : '#c8a8f0') + '">' + esc(u.party ? 'The four' : u.name) + '</div><div class="cls">' + esc(u.kind) + ' &middot; ' + cls + '</div>' +
      (hs.length && !u.party ? '<div class="cls">with ' + hs.map(function (h) { return esc(h.name) + ' (' + h.type.replace('superhero', 'Super-hero').replace('hero', 'Hero').replace('wraith', 'Wraith').replace('wizard', 'Warlock') + ')'; }).join(', ') + '</div>' : '') + hp +
      (state ? '<div class="cls" style="color:#ff9a7a">' + state + '</div>' : '') + '</div>';
    if (mine && SN.canOrder(st, u) && !busy) {
      var o = u.order, now = o.type === 'move' ? 'march to ' + esc(SN.placeName(o.to)) + (o.full && o.full.length > o.path.length ? ' (' + o.path.length + ' hexes today)' : '') : o.type === 'support' ? 'charge if charged' : o.type === 'avoid' ? 'avoid: slip away from anything that comes' : 'hold';
      html += '<div class="orders"><div class="cls">Orders: <b>' + now + '</b></div><div><button id="oHold"' + (o.type === 'hold' && u.held ? ' class="on"' : '') + '>HOLD</button><button id="oSup"' + (o.type === 'support' ? ' class="on"' : '') + '>CHARGE IF CHARGED</button><button id="oAvoid"' + (o.type === 'avoid' ? ' class="on"' : '') + ' title="Hold, and slip a hex away from anything that comes (OD&amp;D Book III)">AVOID</button></div><div class="tip">Click a hex to march there (right-click to stack with your own).</div></div>';
    } else if (mine && u.berserk && SN.alive(u)) html += '<div class="orders"><div class="cls">Today: <b>' + (u.order.type === 'move' ? 'march on ' + esc(SN.placeName(u.order.to)) : 'hold') + '</b></div><div class="tip">The plains tribes ride their own way: the computer writes their orders. They charge any gnolls within two hexes and hunt the rest.</div></div>';
    else if (!mine) html += '<div class="orders"><div class="tip">The computer\'s. Its orders are written in secret, as yours are.</div></div>';
    if (mine && SN.canOrder(st, u) && !busy && !u.party) {
      var FN = { line: 'LINE', column: 'COLUMN', square: 'SQUARE' }, cost = SN.formFree(st, u) ? 'set it free today' : u.reformed ? 'changed today: half the day\'s move, and flanked if caught in a fight' : 'a change costs half today\'s move';
      html += '<div class="orders"><div class="cls">Formation <b>' + FN[u.form] + '</b>, facing <b>' + SN.DIRS[u.face || 0] + '</b> &middot; ' + cost + '</div><div>' +
        '<button id="fLine"' + (u.form === 'line' ? ' class="on"' : '') + ' title="Front: three sides">LINE</button><button id="fCol"' + (u.form === 'column' ? ' class="on"' : '') + ' title="Front: one side; horse and wagons march further on the road">COLUMN</button>' +
        (SN.foot(u) ? '<button id="fSq"' + (u.form === 'square' ? ' class="on"' : '') + ' title="All front; a hex a day; no charge die for horse against it">SQUARE</button>' : '') +
        '<button id="fL" title="Turn left (Q)">&#10226;</button><button id="fR" title="Turn right (E)">&#10227;</button></div><div class="tip">From a flank the enemy fights a class up; from the rear, and you strike nothing back in the first round.</div></div>';
    }
    if (u.note) html += '<div class="note">' + esc(u.note) + '</div>';
    el.innerHTML = html;
    var form = function (f, face) { return function () { SN.setForm(st, u, f, face); UI.tip(null); UI.render(); }; };
    if ($('fLine')) { $('fLine').onclick = form('line'); $('fCol').onclick = form('column'); if ($('fSq')) $('fSq').onclick = form('square'); $('fL').onclick = function () { form(null, (u.face || 0) + 1)(); }; $('fR').onclick = function () { form(null, (u.face || 0) + 5)(); }; }
    if ($('oHold')) $('oHold').onclick = function () { UI.command(u, 'hold'); };
    if ($('oSup')) $('oSup').onclick = function () { UI.command(u, 'support'); };
    if ($('oAvoid')) $('oAvoid').onclick = function () { UI.command(u, 'avoid'); };
  };
  // ---------------------------------------------------------------- the ring (his ask 10-15: "a ring menu on the side for available commands for that unit"):
  // round the selected unit of ours, what it can be told -- HOLD, CHARGE IF CHARGED, AVOID, its formation (SQUARE for foot) and its turn; the four
  // their orders only. A march is still a click on a hex
  var ringKey = null, ringFor = null;
  UI.ringMode = 'main'; UI.moveMode = null;
  UI.ring = function () {
    var el = $('ring'); if (!el) return;
    var u = st && V.sel && SN.unit(st, V.sel), showing = $('show') && $('show').style.display === 'block';
    if (!u || busy || showing || !SN.canOrder(st, u) || UI.cardOpen() || SN.Notes.isOpen()) { el.style.display = 'none'; ringKey = null; return; }
    if (ringFor !== u.id) { ringFor = u.id; UI.ringMode = 'main'; if (UI.moveMode && UI.moveMode !== u.id) UI.moveMode = null; }
    var o = u.order, key = [u.id, st.day, o.type, u.held, u.form, u.face, u.reformed, UI.ringMode, UI.moveMode].join('|'), free = SN.formFree(st, u);
    if (key !== ringKey) {
      ringKey = key;
      var items, warn = '';
      if (UI.ringMode === 'form') { // (his ask 10-15: "line column square pop out of a 'formation' button that warns of half-day cost and allows backout")
        var dawn = function (f) { return !free && u.formDawn === f && u.form !== f ? ' -- back to the dawn\'s: free' : ''; };
        items = [{ k: 'line', t: 'LINE', on: u.form === 'line', tip: 'Line: its front three sides' + dawn('line') }, { k: 'column', t: 'COLUMN', on: u.form === 'column', tip: 'Column: its front one side; horse and wagons march further on the road' + dawn('column') },
          SN.foot(u) ? { k: 'square', t: 'SQUARE', on: u.form === 'square', tip: 'Square: all front, a hex a day' + dawn('square') } : null, { k: 'back', t: 'BACK', tip: 'Leave it as it is' }].filter(Boolean);
        warn = free ? 'Formation: free today' : u.reformed ? 'Changed today: half the day\'s move, and flanked if caught in a fight -- back to its dawn formation is free' : 'A change costs HALF TODAY\'S MOVE, and a unit caught in a fight the day it changes counts as flanked';
      } else {
        items = [{ k: 'move', t: 'MOVE', on: UI.moveMode === u.id, tip: 'March: then click the hex to go to -- your own units\' hex too (Esc cancels)' }, { k: 'hold', t: 'HOLD', on: o.type === 'hold' && u.held, tip: 'Hold this hex' + (SN.holdsGround(u, u.at) ? ' -- ' + SN.holdsGround(u, u.at) + ': no charge die against you, volleys at you halved, +1 morale' : '') },
          { k: 'support', t: 'CHARGE?', on: o.type === 'support', tip: 'CHARGE IF CHARGED (CHAINMAIL): join any fight next to it' }, { k: 'avoid', t: 'AVOID', on: o.type === 'avoid', tip: 'Hold, and slip a hex away from anything that comes (OD&D Book III)' }];
        var mate = UI.mateOf(u);
        if (!u.party) items = items.concat([{ k: 'form', t: 'FORMATION', tip: 'Line, column or square (now ' + u.form + ')' + (free ? ': free today' : ': a change costs half today\'s move') },
          mate ? { k: 'combine', t: 'COMBINE', tip: 'Join with ' + mate.name + ' in this hex: one mixed unit, the smaller joining the bigger, no splitting back' + (free ? '' : ' (a formation change: half today\'s move)') } : null,
          { k: 'left', t: '\u27F2', tip: 'Turn left (Q)' }, { k: 'right', t: '\u27F3', tip: 'Turn right (E)' }].filter(Boolean));
      }
      el.innerHTML = (warn ? '<div class="warn' + (free ? ' free' : '') + '">' + esc(warn) + '</div>' : '') + items.map(function (it, i) { var a = -Math.PI / 2 + i / items.length * Math.PI * 2; return '<button data-k="' + it.k + '" data-a="' + a + '"' + (it.on ? ' class="on"' : '') + ' title="' + esc(it.tip) + '">' + it.t + '</button>'; }).join('');
      [].forEach.call(el.querySelectorAll('button'), function (b) { b.onmousedown = function (e) { e.stopPropagation(); }; b.onclick = function (e) { e.stopPropagation(); UI.command(u, b.getAttribute('data-k')); }; });
    }
    var q = V.center(u.at), r = Math.max(64, V.size() * 1.2), m = $('map');
    el.style.display = 'block'; el.style.left = m.offsetLeft + 'px'; el.style.top = m.offsetTop + 'px';
    [].forEach.call(el.querySelectorAll('button'), function (b) { var a = +b.getAttribute('data-a'); b.style.left = Math.round(q[0] + Math.cos(a) * r * 1.45) + 'px'; b.style.top = Math.round(q[1] - V.size() * 0.35 + Math.sin(a) * r * 0.95) + 'px'; });
    var w = el.querySelector('.warn'); if (w) { w.style.left = Math.round(q[0]) + 'px'; w.style.top = Math.round(q[1] - V.size() * 0.35 - r * 0.95 - 18) + 'px'; } // (above the ring's top button)
  };
  // the one of ours in this hex a unit would COMBINE with (RULED 10-15): the biggest that can
  UI.mateOf = function (u) { return SN.unitsAt(st, u.at).filter(function (x) { return SN.canCombine(st, u, x); }).sort(function (a, b) { return SN.fightFigs(b) - SN.fightFigs(a); })[0] || null; };
  UI.command = function (u, k) {
    if (!st || busy || !SN.canOrder(st, u)) return;
    if (k === 'combine') { var mate = UI.mateOf(u), big = mate && SN.combine(st, u, mate); if (big) { V.sel = big.id; UI.toast(big.name + ': one unit of ' + big.figs + ' men.'); } UI.tip(null); UI.render(); return; }
    if (k === 'move') { UI.moveMode = UI.moveMode === u.id ? null : u.id; if (UI.moveMode) UI.toast('Click the hex it should march to -- your own units\' hex too. Esc cancels.'); }
    else if (k === 'hold' || k === 'support' || k === 'avoid') { u.order = { type: k }; u.held = true; UI.advance(u); }
    else if (k === 'form') UI.ringMode = 'form';
    else if (k === 'back') UI.ringMode = 'main';
    else if (k === 'line' || k === 'column' || k === 'square') { SN.setForm(st, u, k); UI.ringMode = 'main'; }
    else if (k === 'left' || k === 'right') SN.setForm(st, u, null, (u.face || 0) + (k === 'left' ? 1 : 5));
    $('map').style.cursor = UI.moveMode ? 'crosshair' : '';
    UI.tip(null); UI.render();
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
  // an order given (HOLD, CHARGE IF CHARGED, AVOID, a march), the next unit without orders is selected (his ask 10-15: "completing orders for a unit (hold,
  // charge, move) should select the next unit"); none left, the selection clears and RESOLVE THE DAY waits. A turn or a formation is not an order
  UI.advance = function (u) {
    var mine = st.units.filter(function (x) { return SN.canOrder(st, x); }), open = mine.filter(function (x) { return x !== u && x.order.type === 'hold' && !x.held; });
    UI.moveMode = null; UI.ringMode = 'main';
    if (!open.length) { V.sel = null; UI.toast('Every unit has its orders: RESOLVE THE DAY (Enter).'); return; }
    var i = mine.indexOf(u), nx = open.filter(function (x) { return mine.indexOf(x) > i; })[0] || open[0];
    V.sel = nx.id; if (V.ensureVisible) V.ensureVisible(nx.at);
  };
  UI.next = function () {
    if (!st || busy) return;
    var mine = st.units.filter(function (u) { return SN.canOrder(st, u); }), open = mine.filter(function (u) { return u.order.type === 'hold' && !u.held; });
    var list = open.length ? open : mine; if (!list.length) return;
    var i = list.map(function (u) { return u.id; }).indexOf(V.sel); V.sel = list[(i + 1) % list.length].id; UI.render();
  };

  // ---------------------------------------------------------------- input
  function click(e, right) {
    if (UI.dragged) { UI.dragged = false; return; } // (the end of a drag across the map, not a click on it)
    if (!st || busy || UI.cardOpen() || SN.Notes.isOpen()) return;
    var r = $('map').getBoundingClientRect(), h = V.hexAt(e.clientX - r.left, e.clientY - r.top); if (!h) return;
    UI.act(h, right);
  }
  UI.act = function (h, right) {
    var here = SN.unitsAt(st, h), mineHere = here.filter(function (u) { return u.side === 'ours'; }), sel = V.sel && SN.unit(st, V.sel);
    if (UI.moveMode && sel && sel.id === UI.moveMode && SN.canOrder(st, sel)) right = true; // (MOVE from the ring: the next hex clicked is the march's end, your own units' hex too)
    UI.moveMode = null; $('map').style.cursor = '';
    if (!right && mineHere.length) { // (a click on our own selects them, round the stack)
      var ids = mineHere.map(function (u) { return u.id; }), i = ids.indexOf(V.sel); V.sel = ids[(i + 1) % ids.length]; UI.render(); return;
    }
    if (sel && SN.canOrder(st, sel)) {
      if (SN.same(sel.at, h)) { sel.order = { type: 'hold' }; sel.held = true; UI.advance(sel); }
      else if (!SN.setOrder(st, sel, { type: 'move', to: h })) UI.toast('No way there.');
      else { sel.held = true; UI.advance(sel); }
      UI.render(); return;
    }
    if (here.length) { V.sel = here[0].id; UI.render(); }
  };
  UI.bind = function () {
    var cv = $('map');
    cv.addEventListener('click', function (e) { click(e, false); });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); click(e, true); });
    cv.addEventListener('mousemove', function (e) { var r = cv.getBoundingClientRect(), h = V.hexAt(e.clientX - r.left, e.clientY - r.top); V.hover = h; UI.tip(h, e.clientX, e.clientY); });
    cv.addEventListener('mouseleave', function () { V.hover = null; UI.tip(null); });
    // the camera (his "keep the default zoom out one step closer", 10-15): the wheel steps it about the mouse; a drag pans it
    cv.addEventListener('wheel', function (e) { e.preventDefault(); var r = cv.getBoundingClientRect(); if (V.zoomAt(e.deltaY < 0 ? 1 : -1, e.clientX - r.left, e.clientY - r.top)) UI.tip(null); }, { passive: false });
    var drag = null;
    cv.addEventListener('mousedown', function (e) { if (e.button === 0 || e.button === 1) drag = { x: e.clientX, y: e.clientY, moved: false }; if (e.button === 1) e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (!drag) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && dx * dx + dy * dy < 49) return; drag.moved = true; cv.style.cursor = 'grabbing'; V.panBy(dx, dy); drag.x = e.clientX; drag.y = e.clientY; UI.tip(null); });
    window.addEventListener('mouseup', function () { if (drag && drag.moved) { UI.dragged = true; setTimeout(function () { UI.dragged = false; }, 50); } drag = null; cv.style.cursor = ''; });
    $('bResolve').onclick = UI.resolve; $('bNext').onclick = UI.next;
    $('bNotes').onclick = function () { SN.Notes.open(st, false); };
    $('bHelp').onclick = function () { UI.help(false); };
    document.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'TEXTAREA' || tag === 'INPUT') { if (e.key === 'Escape') SN.Notes.close(); return; }
      if (document.getElementById('d16')) return; // (the grid has the keys while it is up)
      if (e.key === 'Escape') { if (SN.Notes.isOpen()) SN.Notes.close(); else if (UI.cardOpen()) UI.closeCard(); else if (UI.moveMode) { UI.moveMode = null; $('map').style.cursor = ''; UI.render(); } else if (UI.ringMode === 'form') { UI.ringMode = 'main'; UI.render(); } else { V.sel = null; UI.render(); } }
      else if (e.key === 'Enter') { if (UI.cardOpen()) { var b = $('card').querySelector('.row button.go'); if (b) b.click(); } else UI.resolve(); e.preventDefault(); }
      else if (e.key === 'Tab') { UI.next(); e.preventDefault(); }
      else if (e.key === 'n' || e.key === 'N') { if (!SN.Notes.isOpen()) { SN.Notes.open(st, false); e.preventDefault(); } }
      else if (e.key === 'h' || e.key === 'H') { if (!UI.cardOpen()) UI.help(false); }
      else if (/^Arrow/.test(e.key)) { var ps = V.size() * 1.6; V.panBy(e.key === 'ArrowLeft' ? ps : e.key === 'ArrowRight' ? -ps : 0, e.key === 'ArrowUp' ? ps : e.key === 'ArrowDown' ? -ps : 0); e.preventDefault(); }
      else if (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '_') { var mc = $('map'); V.zoomAt(e.key === '-' || e.key === '_' ? -1 : 1, mc.width / 2, mc.height / 2); }
      else if (/^[qQeE]$/.test(e.key)) { var su = st && V.sel && SN.unit(st, V.sel); if (su && !busy && SN.canOrder(st, su) && !su.party) { SN.setForm(st, su, null, (su.face || 0) + (/[qQ]/.test(e.key) ? 1 : 5)); UI.render(); } }
    });
    window.addEventListener('resize', fit);
  };
  function fit() { var w = window.innerWidth - ($('log').offsetWidth || 340), hh = window.innerHeight - 40 - ($('panel').offsetHeight || 128); $('panel').style.right = ($('log').offsetWidth || 340) + 'px'; V.fit(w, hh); }
  function loop() { frame++; if (st) { V.draw(st, frame); UI.ring(); } requestAnimationFrame(loop); }
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
      // a round's casualties one side at a time, the side that lost the more first (his ask 10-15)
      var TOLL = { cas: 1, gone: 1, herofall: 1, surrender: 1 }, pairs = 0, badPair = 0;
      fights.forEach(function (i, n) { var to = n + 1 < fights.length ? fights[n + 1] : B.length, sh = SN.Show.build(st, i, to, B[i].at), ou = {}; ((sh.first || {}).ours || []).forEach(function (u) { ou[u.id] = 1; });
        var lossOf = function (sg) { return sg.list.reduce(function (s, x) { return s + (x.t === 'cas' ? x.n : x.t === 'herofall' ? 4 : x.t === 'gone' || x.t === 'surrender' ? 1 : 0); }, 0); }, sideOf = function (sg) { return ou[sg.list[0].u] ? 'o' : 't'; };
        for (var k2 = 0; k2 + 1 < sh.segs.length; k2++) { var a1 = sh.segs[k2], a2 = sh.segs[k2 + 1]; if (TOLL[a1.b.t] && TOLL[a2.b.t] && sideOf(a1) !== sideOf(a2)) { pairs++; if (lossOf(a1) < lossOf(a2)) badPair++; } } });
      ok(pairs > 0 && !badPair, 'the zoom takes a round\'s casualties off one side at a time, the side that lost the more first (' + pairs + ' rounds split' + (badPair ? ', ' + badPair + ' out of order' : '') + ')');
      ok(kinds.atk && kinds.mor && kinds.cas, 'the show has the dice, the casualties and the morale in it (' + Object.keys(kinds).sort().join(' ') + ')');
      ok(long <= fights.length / 4 && avg <= 6.5, 'the shows run about five seconds a fight (average ' + Math.round(avg * 10) / 10 + ' s; ' + long + ' of ' + fights.length + ' over ten)');
      // the isometric map and the fight's zoom (his word 10-15: "isometric hex the main map and zoom in to animate the combat")
      var rt = 0; for (var r2 = 0; r2 < SN.H; r2++) for (var c2 = 0; c2 < SN.W; c2++) { var q2 = V.center([c2, r2]), hh = V.hexAt(q2[0], q2[1]); if (hh && hh[0] === c2 && hh[1] === r2) rt++; }
      ok(V.SQ < 0.8 && rt === SN.W * SN.H, 'the map is isometric (hexes squashed to ' + V.SQ + ' of their height) and every hex is found again under the mouse (' + rt + ' of ' + SN.W * SN.H + ')');
      var zb = [];
      try { fights.slice(0, 4).forEach(function (i, n) { var to = n + 1 < fights.length ? fights[n + 1] : B.length, sh = SN.Show.build(st, i, to, B[i].at), env = { st: st, cam0: V.fitCam(960, 540), t0: 0, frame: 1, out: null };
        [0, 0.35, 0.7, sh.total].forEach(function (tt) { SN.Show.draw(cvS.getContext('2d'), 960, 540, sh, tt, env); }); env.out = 0.5; SN.Show.draw(cvS.getContext('2d'), 960, 540, sh, sh.total, env); }); } catch (e) { zb.push(e.message); }
      ok(!zb.length && V.camTo(B[fights[0]].at, 960, 540).z > 6 * V.fitCam(960, 540).z, 'the show flies the map\'s camera down into the fight\'s hex and back out, drawn at every stage' + (zb.length ? ': ' + zb[0] : ''));
      var fb0 = B.filter(function (b) { return b.t === 'fight'; })[0];
      ok(fb0 && fb0.ours.concat(fb0.theirs).every(function (u) { return u.form && u.face != null && u.from != null; }), 'a fight\'s units carry their formation, facing and the side they came in through, for the show to stand them in');
      // the pop-up: a march into an enemy names the fight and both sides' dice
      var s2 = SN.newGame(99); SN.dawn(s2); var pu = SN.unit(s2, 'patrol'), gs = SN.unit(s2, 'sg3'), pv = SN.preview(s2, pu, gs.at);
      ok(pv && pv.hit && pv.lines.some(function (l) { return /dice, kill on \d\+/.test(l); }) && pv.lines.some(function (l) { return /Them:/.test(l); }), 'the pop-up: the patrol marching on the glory-seekers sees both sides\' dice');
      var pp = SN.preview(s2, SN.unit(s2, 'party'), gs.at);
      ok(pp && pp.lines.some(function (l) { return /grid/.test(l); }), 'the pop-up: the four marching on a band are told it goes to the grid');
      UI.closeCard();
      // his asks after the isometric map (10-15): the camera a step closer, the ground past the edge, the stacks in formation, the ring
      V.camSet = false; V.zk = 1; V.fit(800, 500); var fz = V.fitCam(800, 500).z, z1 = V.cam.z, zin = V.zoomAt(1, 400, 250) && Math.abs(V.cam.z - fz * 1.5625) < 0.01;
      for (var zi = 0; zi < 9; zi++) V.zoomAt(1, 400, 250); var zmax = V.cam.z; V.zk = 1; V.fit(800, 500);
      ok(Math.abs(z1 - fz * 1.25) < 0.01 && zin && Math.abs(zmax - fz * Math.pow(1.25, 4)) < 0.01, 'the map opens a step (1.25x) in from the whole map; the wheel steps it, to four steps in');
      var s3 = SN.newGame(4242); s3.party8 = null; SN.dawn(s3); V.draw(s3, 1); var oq = V.center([-2, 3]);
      ok(V.stats && V.stats.out > 20 && !V.hexAt(oq[0], oq[1]), 'the ground runs on past the map\'s edge (' + (V.stats ? V.stats.out : 0) + ' tiles drawn dim), and nothing there can be clicked');
      var spread = function (form, dir) { var p = V.layoutOf({ form: form }, 6, 40, 1, dir), xs = p.map(function (q) { return q[0]; }), ys = p.map(function (q) { return q[1]; }); return [Math.max.apply(null, xs) - Math.min.apply(null, xs), Math.max.apply(null, ys) - Math.min.apply(null, ys)]; };
      var le = spread('line', 0), ce = spread('column', 0);
      // the witness after the zoom-out (his ask 10-15), and the layout (found in his play: the plains came in behind a band, both stood on one side)
      var wsh = null; for (var ws = 1; ws < 80 && !wsh; ws++) { var sw = SN.newGame(ws); sw.party8 = null; sw.units.forEach(function (u) { u.on = false; }); sw.beats = [];
        var onu = function (id, at) { var u = SN.unit(sw, id); u.on = true; u.state = 'ok'; u.at = at.slice(); u.order = { type: 'hold' }; return u; };
        var b8 = onu('bat2', [8, 5]); b8.figs = b8.figs0 = 8; var a2 = onu('sg2', [7, 4]); onu('sg1', [7, 3]); a2.order = { type: 'move', to: [8, 5], path: [[8, 5]] };
        var gw = SN.resolve(sw), rw = gw.next(); while (!rw.done) { var vw = rw.value; rw = gw.next(vw && vw.deep ? SN.standIn(sw, vw.deep) : undefined); }
        var BW = sw.beats, iw = BW.map(function (b) { return b.t; }).indexOf('fight'); if (iw >= 0 && BW.some(function (b) { return b.t === 'wit'; })) wsh = { st: sw, sh: SN.Show.build(sw, iw, BW.length, BW[iw].at) }; }
      var wdraw = false; if (wsh) { try { SN.Show.drawWit(cvS.getContext('2d'), 960, 540, wsh.sh, 0.5, { st: wsh.st, cam0: V.fitCam(960, 540), frame: 1 }); wdraw = true; } catch (e) { wdraw = false; } }
      ok(wsh && wsh.sh.wit.length && !wsh.sh.segs.some(function (sg) { return sg.b.t === 'wit'; }) && wdraw, 'the witness plays after the fight, on the map with the camera back out -- not in the zoomed hex');
      var lsh = null; for (var ls = 1; ls < 40 && !lsh; ls++) { var sl2 = SN.newGame(ls); sl2.party8 = null; sl2.units.forEach(function (u) { u.on = false; }); sl2.beats = [];
        var g2 = SN.unit(sl2, 'sg1'); g2.on = true; g2.state = 'ok'; g2.at = [8, 5]; g2.face = 0; g2.order = { type: 'hold' }; var p2 = SN.unit(sl2, 'bb1'); p2.on = true; p2.state = 'ok'; p2.at = [7, 5]; p2.order = { type: 'move', to: [8, 5], path: [[8, 5]] };
        var gl = SN.resolve(sl2), rl = gl.next(); while (!rl.done) { var vl = rl.value; rl = gl.next(vl && vl.deep ? SN.standIn(sl2, vl.deep) : undefined); }
        var il = sl2.beats.map(function (b) { return b.t; }).indexOf('fight'); if (il >= 0) lsh = SN.Show.build(sl2, il, sl2.beats.length, sl2.beats[il].at); }
      var lo = lsh && SN.Show.layout(SN.Show.scene(lsh, 1.0));
      ok(lo && lo.sg1 && lo.bb1 && lo.sg1.ax > 0.1 && lo.bb1.ax < -0.1, 'in the zoom, a band taken from behind stands on the far side from the plains that came in at its back' + (lo && lo.sg1 ? ' (the band at ' + Math.round(lo.sg1.ax * 100) / 100 + ', the plains at ' + Math.round(lo.bb1.ax * 100) / 100 + ')' : ''));
      // an order selects the next unit without orders (his ask 10-15); none left, the selection clears
      var sn = SN.newGame(4242); sn.party8 = null; SN.dawn(sn); st = sn; V.sel = 'patrol'; UI.render(); UI.command(SN.unit(sn, 'patrol'), 'hold');
      var nx = V.sel && SN.unit(sn, V.sel), nxOk = !!nx && nx.id !== 'patrol' && nx.order.type === 'hold' && !nx.held, guard = 0;
      while (V.sel && guard++ < 20) UI.command(SN.unit(sn, V.sel), 'hold');
      ok(nxOk && !V.sel && sn.units.filter(function (x) { return SN.canOrder(sn, x); }).every(function (x) { return x.held; }), 'an order given selects the next unit without orders; the last one given, the selection clears (' + (nx ? nx.id : 'none') + ' after the patrol)');
      // the four's rests (RULED 10-15: "Heroes get a short rest between fights and a long rest between days")
      var sr = SN.newGame(77); sr.party8 = JSON.parse(JSON.stringify(SN.PARTY8)); sr.party80 = JSON.parse(JSON.stringify(SN.PARTY8));
      SN.partyBack(sr, { party: [{ id: 'barley', hp: 30, slots: [], feats: { secondWind: 0, actionSurge: 0, indomitable: 0 } }, { id: 'vivian', hp: 0 }] });
      var bar = sr.party8.party.filter(function (x) { return x.id === 'barley'; })[0], viv = sr.party8.party.filter(function (x) { return x.id === 'vivian'; })[0];
      var shortOk = bar.hp > 30 && bar.feats.secondWind === 1 && bar.feats.actionSurge === 1 && bar.hdLeft < 8 && viv.hp > 0;
      var Pr = SN.unit(sr, 'party'); Pr.at = [5, 6]; Pr.fought = true; bar.hp = 10; var hd0 = bar.hdLeft; SN.dusk(sr);
      ok(shortOk && bar.hp === bar.maxhp && bar.hdLeft > hd0, 'the four: a short rest after a fight (hit dice, Second Wind and Action Surge back, the fallen stand) and a long rest at dusk wherever they stand (Barley ' + bar.hp + '/' + bar.maxhp + ', hit dice ' + bar.hdLeft + ')');
      var sheetsAll = SN.FORCES.concat(SN.DOMINION).reduce(function (a, f) { return a.concat(f.sheets || [], (f.groups || []).reduce(function (g, x) { return g.concat(x.sheets || []); }, []), f.wagon ? [V.wagonOf(f)] : []); }, []), missing = sheetsAll.filter(function (n) { return !(window.D16 && D16.SHEETS && D16.SHEETS[n]); });
      ok(!missing.length && sheetsAll.indexOf('gloryseeker_p1') < 0 && V.faceOf('gnoll_p2', 1) === 5 && V.faceOf('graykeeping_p2', 1) === 5 && V.faceOf('trooper_p0', 1) === 5 && V.faceOf('npcfighter_p0', 1) === 5 && V.faceOf('npcpaladin_p0', 1) === 5 && V.faceOf('npcbarbarian_p0', 1) === 5 && V.faceOf('npccleric_p0', 1) === 5 && V.faceOf('npcranger_p0', 1) === 5 && V.faceOf('mirrorgnoll_p1', 1) === 5 && V.faceOf('gnollmatriarch_p1', 1) === 5 && V.faceOf('npcwarlock_p0', 1) === 5 && V.faceOf('barley_p1', 1) === 6, 'every sheet the mode draws is DEEP16\'s (the glory-seeker its eight-facing p2); on the map a sheet drawn in all eight faces NE truly (the trooper since ART-61, the fighter since ART-62, the paladin since ART-63, the barbarian since ART-66, the cleric since ART-64, the ranger since ART-65, the warlock since ART-67, the matriarch since ART-68), the rest turn to E (the main party, on his word)' + (missing.length ? ': missing ' + missing.join(', ') : ''));
      var tsP = V.troopSheets(SN.FORCES.filter(function (f) { return f.id === 'patrol'; })[0], 5, 1), wg = SN.FORCES.concat(SN.DOMINION).filter(function (f) { return f.wagon; }).map(V.wagonOf);
      ok(['newlandrider_p1', 'plainsrider_p1', 'wagon_p1', 'newlandwagon_p1'].every(function (n) { return V.faceOf(n, 1) === 5 && D16.SHEETS[n] && D16.SHEETS[n].anims.hurt; }) && D16.SHEETS.newlandrider_p1.anims.charge && D16.SHEETS.plainsrider_p1.anims.charge &&
        tsP.filter(function (n) { return n === 'newlandrider_p1'; }).length === 1 && tsP.length === 5 && wg.join() === 'newlandwagon_p1,wagon_p1,wagon_p1,wagon_p1',
        'the horse and the wagons (ART-69 to ART-71, 10-17): the mounted units ride their own sheets in all eight facings, a gallop for the charge; the road patrol\'s five figures ' + tsP.join(' ') + '; its wagon Newland\'s, the Dominion\'s three as drawn');
      ok(le[1] > le[0] && ce[0] > ce[1], 'the stacks stand in their formation with their sprites: a line facing east runs north and south, a column facing east east and west');
      var rkeys = function () { return [].map.call(document.querySelectorAll('#ring button'), function (b) { return b.getAttribute('data-k'); }).join(); }, rpress = function (k) { var b = document.querySelector('#ring button[data-k="' + k + '"]'); if (b) b.click(); UI.ring(); };
      st = s3; V.sel = 'patrol'; UI.render(); UI.ring(); var rk = rkeys(); rpress('avoid'); var pav = SN.unit(st, 'patrol').order.type;
      V.sel = 'patrol'; UI.render(); UI.ring(); rpress('form'); /* (AVOID given, the next unit was selected: back to the patrol) */ var rf = rkeys(), w14 = ($('ring').querySelector('.warn') || {}).textContent || ''; rpress('back'); var rb = rkeys();
      V.sel = 'party'; UI.render(); UI.ring(); var rp = rkeys();
      ok(rk === 'move,hold,support,avoid,form,combine,left,right' && pav === 'avoid' && rf === 'line,column,back' && /free today/.test(w14) && rb === rk && rp === 'move,hold,support,avoid',
        'the ring: MOVE, HOLD, CHARGE?, AVOID, FORMATION and the turns (the four: their orders); FORMATION pops out LINE / COLUMN (SQUARE for foot only: the patrol has horse) with its cost and BACK (' + rk + ' / ' + rf + ')');
      s3.day = 15; SN.dawn(s3); V.sel = 'patrol'; UI.ringMode = 'main'; UI.render(); UI.ring(); rpress('form'); var w15 = ($('ring').querySelector('.warn') || {}).textContent || ''; rpress('back');
      var gf = SN.unit(s3, 'greyfang'); gf.at = [8, 7]; rpress('move'); UI.act([8, 7], false); var po = SN.unit(s3, 'patrol').order; V.sel = null; UI.render();
      ok(/HALF TODAY/.test(w15) && po.type === 'move' && SN.same(po.to, [8, 7]), 'after Day 14 the formation warns of half the day\'s move; MOVE then a click on a hex of our own marches there (a plain click there would select)');
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
