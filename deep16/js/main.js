/* DEEP16 — boot. The fight by default; ?ladder = the ladder (the leveling simulator); ?gate = the stop-and-look gate; ?view = the cavern with a cursor; ?stats = the frame-rate overlay;
   ?scale=N forces an integer scale. */
'use strict';
(function () {
  var D = window.D16, q = location.search;
  var sc = /[?&]scale=(\d)/.exec(q);
  if (sc) D.forceScale = +sc[1];
  D.initCanvas();
  D.initMouse();
  window.addEventListener('error', function (e) { D.lastError = e.error || e.message; });
  D.canvas.focus();
  D.loadImages(D.spr.images(), function () {
    if (/[?&]ladder\b/.test(q)) D.push(new D.Ladder());
    else if (/[?&]gate\b/.test(q)) D.push(new D.Gate());
    else if (/[?&]view\b/.test(q)) D.push(new D.MapView('cavern'));
    else D.push(new D.Battle());
    D.start();
  });
})();
