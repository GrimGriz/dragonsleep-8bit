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
  D.initCanvas();
  D.initMouse();
  D.initTouch(); // a phone: the pad, and the canvas read for a finger (?touch forces it)
  window.addEventListener('error', function (e) { D.lastError = e.error || e.message; });
  D.canvas.focus();
  // (no sheet is fetched here: each scene asks for its own before it draws -- js/sprites.js S.gate, 10-03; the 135 used to come first, 36.8 MB)
  if (D.embed.on) D.embed.boot(); // inside the 8-bit game: the fight and the party come by postMessage (js/embed.js)
  else if (/[?&]pocket\b/.test(q)) D.push(new D.Pocket()); // the Pocket DM (alpha): a party, a map, a CR, a fight -- and the four-rung ladder (js/pocket.js, 10-02)
  else if (/[?&]climb\b/.test(q)) D.push(new D.Climb()); // the climb: one party, 1 to 9 (js/climb.js)
  else if (/[?&]show=/.test(q)) D.push(D.show.fight(q)); // the test ground: ?show=grick -- every row of a creature's sheet, twice, in bright, dim and dark (js/show.js)
  else if (/[?&]npc=/.test(q)) D.push(D.npcFight(q)); // the class floor: ?npc=cleric,wizard&lvl=5 (&vs=fighter,rogue: a band instead of the four) (js/classes.js)
  else if (/[?&]keeperfight\b/.test(q) && D.keeper) D.push(D.keeper.fight(q)); // the Keeper of the Flooded Stair (js/keeper.js)
  else if (/[?&]fight=[a-z0-9]+/.test(q)) { var fq = /[?&]fight=([a-z0-9]+)/.exec(q)[1], lq = /[?&]lvl=(\d+)/.exec(q); D.push(new D.Battle({ ladder: true, fight: fq, level: lq ? +lq[1] : undefined, measure: /[?&]full\b/.test(q) ? false : /[?&]held\b/.test(q) ? true : undefined })); } // a fight by its id, the four at its level (&lvl=N another; &full or &held: Pyro at full or taking the measure, whatever the fight says): ?fight=edifice, the Skylights (10-05)
  else if (/[?&]fxgallery\b/.test(q)) D.push(D.fxGallery(q)); // the spell gallery: every spell cast in turn (js/gallery.js)
  else if (/[?&]ladder\b/.test(q)) D.push(new D.Ladder({ party: /[?&]party=ours\b/.test(q) ? 'ours' : null, play: /[?&]play\b/.test(q) })); // (&party=ours: the tester ladder; &play: you run our four, recorded)
  else if (/[?&]gate\b/.test(q)) D.push(new D.Gate());
  else if (/[?&]view\b/.test(q)) D.push(new D.MapView('cavern'));
  else D.push(new D.Battle());
  D.start();
})();
