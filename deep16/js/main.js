/* DEEP16 — boot. The fight by default; ?ladder = the ladder (the leveling simulator); ?gate = the stop-and-look gate; ?view = the cavern with a cursor; ?fxgallery = the spell gallery (&spell=<id>, &auto, &only=a,b); ?stats = the frame-rate overlay;
   ?scale=N forces an integer scale.
   ?ladder&party=ours = the tester ladder (09-28h, Griz: "a tester version of the ladder with them as the party"): Talmok, Willem,
   Katarina and Torvald at each rung's level, no camp, both sides run by the class AI -- you watch (js/ladder.js).
   ?npc=cleric,wizard&lvl=5 = the class floor (&vs=fighter,rogue a band instead of the four; talmok:7 names a level; &watch: your
   side run by the class AI too) (js/classes.js); a creature of the bestiary by its name too (?npc=hyena,hyena,hyena&vs=bard&lvl=3,
   09-30). ?fxgallery&foe=hyena: the gallery's three foes that creature instead. ?show=grick = the test ground: two of a creature
   against four watchers, every row of its sheet twice (js/show.js, 10-02). */
'use strict';
(function () {
  var D = window.D16, q = location.search;
  var sc = /[?&]scale=(\d)/.exec(q);
  if (sc) D.forceScale = +sc[1];
  // the default scale (10-09, Griz: "OPTIONS button on the front door with a slider for a default &scale= value - translated into resolution sizes"): the 8-bit
  // title's OPTIONS keeps it in deep16.opts (js/menu.js GRID SCALE); &scale= still wins, and a story fight inside the 8-bit (?embed) fits its frame as ever
  else if (!/[?&]embed\b/.test(q)) { try { var so = JSON.parse(window.localStorage.getItem('deep16.opts') || 'null'); if (so && so.scale >= 1 && so.scale <= 9) D.forceScale = so.scale | 0; } catch (e) { } }
  // heights drawn twice as tall by default (RULED 10-14, Griz: "we did discover height 2 on the edifice and now want that default across the board for grid
  // mappings"; the look was &hscale=N, 10-08: "not the fight but the map, try it on the ediface"). A map's `step` is the px a 2.5 ft step is drawn (10 in most
  // maps' own numbers: 5 ft is 20 px, a figure about 50); js/iso.js load draws it D.hscale times as tall, every map and every map made at runtime, in the
  // story fights inside the 8-bit too. &hscale=1 is the old look. (The benches' page runs no main.js: the rules are the same either way, and they bench at 1)
  var hsc = /[?&]hscale=([0-9.]+)/.exec(q);
  D.hscale = hsc && +hsc[1] > 0 ? +hsc[1] : 2;
  if (D.hscale !== 1) {
    if (D.iso.setWall) D.iso.setWall(Math.round(D.iso.WALL * D.hscale)); // (the far walls rise with them, and the Edifice's painted walls under the glass go as deep again: js/iso.js)
  }
  // the Harbinger's switches, the bench's own (dev/bench16.js; 10-08), so a bench's seed watched on the class floor plays as it was benched: &callN=read reads the party (his pack,
  // his toying, his mirror double -- js/traits.js TR.reads), &callN=N holds his pack at N; &dbl= the double forced at a share (0 none); &toy=1|0; &laugh=1|0 (the mirror hyenas' at a fall)
  var hq = function (k) { var m = new RegExp('[?&]' + k + '=([a-z0-9.]+)').exec(q); return m ? m[1] : null; };
  if (hq('callN') != null) D.CALL_N = hq('callN') === 'read' ? 'read' : +hq('callN');
  if (hq('dbl') != null) D.DOUBLE_FRAC = +hq('dbl');
  if (hq('toy') != null) D.TOY = hq('toy') === '1';
  if (hq('laugh') != null) D.LAUGH = hq('laugh') === '1';
  if (/[?&]rise\b/.test(q)) D.RISE_NOW = true; // (a show: he starts his first turn at his rise -- the pack, the double, at once)
  D.initCanvas();
  D.initMouse();
  D.initTouch(); // a phone: the pad, and the canvas read for a finger (?touch forces it)
  window.addEventListener('error', function (e) { D.lastError = e.error || e.message; });
  D.canvas.focus();
  // (no sheet is fetched here: each scene asks for its own before it draws -- js/sprites.js S.gate, 10-03; the 135 used to come first, 36.8 MB)
  // (the door's floor, 10-06, the 8-bit battle lane §2.5: a door that throws as it opens -- a name the bestiary hasn't got in ?npc=, a fight that will not set -- gets
  // the card and the way back to the 8-bit title, as one that breaks mid-way does in the loop: js/core.js D.loopStep, D.BrokeCard; inside the 8-bit game it goes on out)
  try {
  if (/[?&]broke\b/.test(q) && !D.embed.on) D.push(new D.BrokeCard(new Error('a sample -- the page that broke says its own error here'))); // (the card, shown: ?broke)
  else if (D.embed.on) D.embed.boot(); // inside the 8-bit game: the fight and the party come by postMessage (js/embed.js)
  else if (/[?&]pocket\b/.test(q)) D.push(new D.Pocket()); // the Pocket DM (alpha): a party, a map, a CR, a fight -- and the four-rung ladder (js/pocket.js, 10-02)
  else if (/[?&]climb\b/.test(q)) D.push(new D.Climb()); // the climb: one party, 1 to 9 (js/climb.js)
  else if (/[?&]rulesshow\b/.test(q) && D.rulesshow) D.push(D.rulesshow.make(q)); // the grid's rules, shown: the antitoxin, the pudding's acid, Heat Metal's end, the dice pinned, ENTER again (js/rulesshow.js, 10-21 night)
  else if (/[?&]barleyshow\b/.test(q) && D.barleyshow) D.push(D.barleyshow.make(q)); // Barley's new sheet, shown: its rows played where the engine plays them, slow, ENTER again (js/barleyshow.js, 10-20)
  else if (/[?&]skyshow\b/.test(q) && D.skyshow) D.push(D.skyshow.make(q)); // the Skylights, shown: today's beats of the Edifice fight, one after another (js/skyshow.js, 10-05 night)
  else if (/[?&]gameshow\b/.test(q) && D.gameshow) D.push(D.gameshow.make(q)); // the Monster Party Game Show: the lighthouse, the circles, Third Lamp (js/gameshow.js, 10-07)
  else if (/[?&]world\b/.test(q) && D.world) { if (D.house && D.house.worldDoor && !/[?&]bare\b/.test(q)) D.house.worldDoor(q); else D.push(D.world.make(q)); } // THE WORLD: the second game's world map, his hex map's 5-mile hexes walked as one token (js/world.js, 10-20); since 10-22 a NEW GAME's four on it (js/house.js H.worldDoor), &bare the door with no party
  else if (/[?&]keepers\b/.test(q) && D.counter) D.push(D.counter.keepersShow(q)); // Silverton's keepers standing, shown: their own figures facing south (js/counter.js, 10-21)
  else if (/[?&]portraits\b/.test(q) && D.counter) D.push(D.counter.portraitShow(q)); // the keepers' talking portraits, shown on their own counter screens, a face at a time (js/counter.js, 10-21 night)
  else if (/[?&]nedshow\b/.test(q) && D.counter) D.push(D.counter.nedShow(q)); // Ned Halloway and Find Familiar, a beat at a time, the Insight's die pinned (js/counter.js, 10-21 night)
  else if (/[?&]roam=/.test(q) && D.roam) D.push(D.roam.make(q)); // the party-token map's feasibility test: the whole Wet walked as one token, its fights made where they fall (js/roam.js, 10-13)
  else if (/[?&]gallery\b/.test(q) && D.oneGallery) D.push(D.oneGallery.door(q)); // THE ONE GALLERY: the spell, feature, Mascot and row galleries as shelves of one tool, one key map (js/onegallery.js, 10-08)
  else if (/[?&]mpgallery\b/.test(q) && D.fxMascots) D.push(D.oneGallery ? D.oneGallery.door(q) : D.fxMascots(q)); // the Mascot gallery: the four's abilities one at a time, up/down the level (js/mpgallery.js, 10-07; also ?fxgallery&mascots)
  else if (/[?&]mpshow\b/.test(q) && D.mpshow) D.push(D.mpshow.make(q)); // Denny and Beholda, shown: the MPMon's specials one beat at a time (js/mpshow.js, 10-06)
  else if (/[?&]rows=/.test(q)) D.push(D.oneGallery ? D.oneGallery.door(q) : D.show.rows(q)); // the row gallery: ?rows=cube -- every row of a sheet one at a time, left/right, up/down turns it, E again (js/show.js, 10-08)
  else if (/[?&]show=/.test(q)) D.push(D.show.fight(q)); // the test ground: ?show=grick -- every row of a creature's sheet, twice, in bright, dim and dark (js/show.js)
  else if (/[?&]npc=/.test(q)) D.push(D.npcFight(q, D.npcRecord(q))); // the class floor: ?npc=cleric,wizard&lvl=5 (&vs=fighter,rogue: a band instead of the four) (js/classes.js); recorded since 10-06
  else if (/[?&]keeperfight\b/.test(q) && D.keeper) D.push(D.keeper.fight(q)); // the Keeper of the Flooded Stair (js/keeper.js)
  else if (/[?&]fight=[a-z0-9]+/.test(q)) { var fq = /[?&]fight=([a-z0-9]+)/.exec(q)[1], lq = /[?&]lvl=(\d+)/.exec(q), fd = D.fight(fq), sq = /[?&]seed=(\d+)/.exec(q); if (sq) D.seed = +sq[1] | 0; D.push(new D.Battle({ ladder: true, fight: fq, level: lq ? +lq[1] : undefined, watch: /[?&]watch\b/.test(q), measure: /[?&]full\b/.test(q) ? false : /[?&]held\b/.test(q) ? true : undefined, record: { fight: fd.id, name: fd.name, level: lq ? +lq[1] : fd.level } })); } // a fight by its id, the four at its level (&seed=N: a bench fight of that seed, roll for roll -- dev/bench16.py x fight=<id> seed=s, fight i is s*7919 + i*104729; &watch: our four run by the class AI, 10-08; &lvl=N another; &full or &held: Pyro at full or taking the measure, whatever the fight says): ?fight=edifice, the Skylights (10-05). Every one played is kept in the play record (js/record.js, deep16.plays: each round, and as the tab goes -- 10-05, Griz: "I clicked, did I destroy my battle record or can you still access it?")
  else if (/[?&]fxgallery\b/.test(q)) D.push(D.oneGallery ? D.oneGallery.door(q) : D.fxGallery(q)); // the spell gallery: every spell cast in turn (js/gallery.js)
  else if (/[?&]ladder\b/.test(q)) D.push(new D.Ladder({ party: /[?&]party=ours\b/.test(q) ? 'ours' : null, play: /[?&]play\b/.test(q) })); // (&party=ours: the tester ladder; &play: you run our four, recorded)
  else if (/[?&]gate\b/.test(q)) D.push(new D.Gate());
  else if (/[?&]view\b/.test(q)) D.push(new D.MapView('cavern'));
  else if (D.house && D.house.Title) D.push(new D.house.Title()); // THE SECOND GAME's title (10-21, the house lane: his "the rest sound good" on the desk's lean 5): NEW GAME, CONTINUE, OPTIONS, the Pocket DM, the first game (js/house.js)
  else D.push(new D.Battle());
  } catch (e) {
    if (D.embed.on) throw e;
    if (window.console) console.error('DEEP16: the door would not open', e);
    D.lastError = e; D.scenes.length = 0; D.push(new D.BrokeCard(e, 'THE DOOR WOULD NOT OPEN.'));
  }
  D.start();
})();
