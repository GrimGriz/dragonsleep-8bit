/* DRAGONSLEEP — boot. */
'use strict';
(function () {
  var DS = window.DS;
  DS.DATA = window.DS_DATA;
  if (!DS.DATA) { document.body.innerHTML = '<p style="color:#ccc;padding:24px">data/data.js is missing. Run tools/compile.py.</p>'; return; }
  DS.initCanvas();
  DS.initTouch();
  document.getElementById('screen').focus();
  document.addEventListener('visibilitychange', function () {
    if (!DS.audio.ctx) return;
    if (document.hidden) DS.audio.ctx.suspend(); else DS.audio.ctx.resume();
  });
  window.addEventListener('error', function (e) { DS.lastError = e.error || e.message; });
  DS.push(new DS.Title());
  DS.start();
})();
