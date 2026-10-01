/* dev (gitignored): film the spell gallery frame by frame while the pane is hidden. Load in the page:
     var s = document.createElement('script'); s.src = '/dev/fxfilm.js'; document.head.appendChild(s);
   then (dev/png_sink.py running): await FILMSPELL('firebolt'), and Read dev/shots/fx_firebolt.png */
(function () {
  var D = window.D16;
  D.paused = true;
  window.ST = function (n) { for (var i = 0; i < n; i++) D.update(); };
  window.FILM = async function (name, steps, cols, box) {
    cols = cols || 3;
    var c = D.canvas, R = D.R; box = box || [120, 50, 240, 160];
    var sx = box[0] * R, sy = box[1] * R, cw = box[2] * R, ch = box[3] * R;
    var rows = Math.ceil(steps.length / cols), W = cw, H = ch;
    var g = document.createElement('canvas'); g.width = W * cols; g.height = H * rows;
    var x = g.getContext('2d'); x.imageSmoothingEnabled = false;
    var acc = 0;
    for (var i = 0; i < steps.length; i++) {
      ST(steps[i]); acc += steps[i]; D.draw();
      x.drawImage(c, sx, sy, cw, ch, (i % cols) * W, Math.floor(i / cols) * H, W, H);
      x.fillStyle = '#ff0'; x.font = (8 * R) + 'px monospace'; x.fillText('t+' + acc, (i % cols) * W + 6, Math.floor(i / cols) * H + 9 * R);
    }
    var r = await fetch('http://127.0.0.1:8977/save?name=' + name, { method: 'POST', body: g.toDataURL('image/png') });
    return await r.text() + ' ' + g.width + 'x' + g.height;
  };
  // go to a spell in the gallery and cast it (the last cast finished first)
  window.CAST = function (id) {
    var B = D.top(), S = B.gallery; ST(360);
    var i = S.ids.indexOf(id); if (i < 0) return 'no ' + id;
    S.i = i; if (B.req && B.req.gallery) B.answer(0); return 'ok';
  };
  // film one spell: n frames every k updates, from its start, in a box round the stage
  window.FILMSPELL = async function (id, n, k, first, box) {
    var r = CAST(id); if (r !== 'ok') return r;
    var steps = [first || 20]; for (var i = 1; i < (n || 9); i++) steps.push(k || 7);
    return await FILM('fx_' + id, steps, 3, box);
  };
})();
