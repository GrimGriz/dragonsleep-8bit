/* dev (gitignored): film an 8-bit battle spell frame by frame (the spell animation pass). Needs a game going (DS.G.party). In the page:
     var s = document.createElement('script'); s.src = '/dev/fx8film.js'; document.head.appendChild(s);
   then (dev/png_sink.py running): await FILM8('fireball', 'aurdin', ['goblin','goblin','goblin'], 14, 4) -> dev/shots/fx8_fireball.png */
(function () {
  var DS = window.DS;
  window.FILM8 = async function (id, who, enemies, n, every, first) {
    DS.paused = true;
    var b = new DS.Battle({ enemies: enemies || ['goblin', 'goblin', 'goblin'], bg: 'cavern' });
    b.intro = 0;
    var u = b.heroes.filter(function (x) { return x.h.id === (who || 'aurdin'); })[0] || b.heroes[0];
    u.h.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1];
    var sp = DS.DATA.spells[id]; if (!sp) return 'no spell ' + id;
    if (!sp.id) sp.id = id;
    b.active = u;
    b.pickFoe = function* () { return this.liveFoes()[0]; };
    b.pickAlly = function* (ok) { return this.heroes.filter(function (x) { return !ok || ok(x); })[0]; };
    var gen = b.castSpell(u, sp, {}), w = null, done = false, frames = [], tot = (first || 6) + (n || 12) * (every || 4);
    var cv = document.createElement('canvas'); cv.width = 256; cv.height = 240; var cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
    for (var f = 0; f < tot; f++) {
      if (!w && !done) { var r = gen.next(); if (r.done) done = true; else { w = r.value; if (w && w.start) { w.start({ resume: function () { } }); if (w.finished) w = null; } } }
      DS.frame++; b.tick();
      if (w && w.update && w.update()) w = null;
      if (f >= (first || 6) && (f - (first || 6)) % (every || 4) === 0) {
        b.draw(cx);
        var fr = document.createElement('canvas'); fr.width = 256; fr.height = 160; fr.getContext('2d').drawImage(cv, 0, 0, 256, 160, 0, 0, 256, 160); frames.push([fr, f]);
      }
    }
    var cols = 4, S = 3, g = document.createElement('canvas'); g.width = 256 * S * cols; g.height = 160 * S * Math.ceil(frames.length / cols);
    var gx = g.getContext('2d'); gx.imageSmoothingEnabled = false;
    frames.forEach(function (p, i) { gx.drawImage(p[0], (i % cols) * 256 * S, Math.floor(i / cols) * 160 * S, 256 * S, 160 * S); gx.fillStyle = '#ff0'; gx.font = '20px monospace'; gx.fillText('f' + p[1], (i % cols) * 256 * S + 6, Math.floor(i / cols) * 160 * S + 22); });
    var res = await fetch('http://127.0.0.1:8977/save?name=fx8_' + id, { method: 'POST', body: g.toDataURL('image/png') });
    return (await res.text()) + ' ' + frames.length + ' frames' + (DS.lastError ? ' ERR ' + DS.lastError : '');
  };
})();
