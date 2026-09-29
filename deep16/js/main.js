/* DEEP16 — boot. The fight by default; ?ladder = the ladder (the leveling simulator); ?gate = the stop-and-look gate; ?view = the cavern with a cursor; ?fxgallery = the spell gallery (&spell=<id>, &auto, &only=a,b); ?stats = the frame-rate overlay;
   ?scale=N forces an integer scale. */
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
  D.loadImages(D.spr.images(), function () {
    if (D.embed.on) D.embed.boot(); // inside the 8-bit game: the fight and the party come by postMessage (js/embed.js)
    else if (/[?&]climb\b/.test(q)) D.push(new D.Climb()); // the climb: one party, 1 to 9 (js/climb.js)
    else if (/[?&]npc=/.test(q)) D.push(D.npcFight(q)); // the class floor: ?npc=cleric,wizard&lvl=5 (&vs=fighter,rogue: a band instead of the four) (js/classes.js)
    else if (/[?&]fxgallery\b/.test(q)) D.push(D.fxGallery(q)); // the spell gallery: every spell cast in turn (js/gallery.js)
    else if (/[?&]ladder\b/.test(q)) D.push(new D.Ladder());
    else if (/[?&]gate\b/.test(q)) D.push(new D.Gate());
    else if (/[?&]view\b/.test(q)) D.push(new D.MapView('cavern'));
    else D.push(new D.Battle());
    D.start();
  });
})();
