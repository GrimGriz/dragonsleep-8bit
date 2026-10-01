"""dev/ (gitignored): the play record headless -- a tester-ladder fight you play (P), a few commands through the game's own path, then the
record's steps and transcript are printed.   python dev/rec-test.py [level]"""
import os, re, subprocess, sys, tempfile, json, html as H
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
lvl = sys.argv[1] if len(sys.argv) > 1 else '3'
html = open(os.path.join(ROOT, 'deep16', 'index.html'), encoding='utf-8').read()
tags = []
for m in re.finditer(r'<script(?: src="([^"]+)")?>(.*?)</script>', html, re.S):
    src, body = m.group(1), m.group(2)
    if src:
        if src.split('?')[0].endswith('js/main.js'): continue
        tags.append('<script src="%s"></script>' % src)
    else:
        tags.append('<script>%s</script>' % body)
test = """<script>
window.onerror = function (m, s, l) { var p = document.createElement('pre'); p.textContent = 'RECERR ' + m + ' @ ' + s + ':' + l; document.body.appendChild(p); };
var D = window.D16; D.initCanvas();
function out(t, v) { var p = document.createElement('pre'); p.textContent = 'RES ' + t + ' ' + v; document.body.appendChild(p); }
function tick(n) { for (var i = 0; i < n; i++) { D.update(); } D.draw(); }
D.loadImages(D.spr.images(), function () {
  var lad = new D.Ladder({ party: 'ours', play: true }); D.push(lad); lad.fight(%s);
  setTimeout(function () {
    try {
      D.top().fight(); tick(60);
      var b = D.battle; var n = 0;
      var loop = setInterval(function () {
        tick(30); n++;
        if (b.req && b.req.entry) { b.answer(); return; }
        var u = b.req && b.req.turn;
        if (u && u.side === 'party' && b.rec && b.rec.steps.length < 4) { D.input.mouse.click = true; D.input.mouse.x = 200; D.input.mouse.y = 100; D.ui.command(b, u, { do: 'end' }); D.input.mouse.click = false; }
        if (n > 220 || (b.rec && b.rec.steps.length >= 4)) {
          clearInterval(loop);
          var r = b.rec; D.rec.finish(b, 'test');
          out('via', JSON.stringify((r.steps || []).map(function (s) { return s.via; })));
          out('screen', JSON.stringify((r.steps[0] || {}).screen || null));
          out('transcript', JSON.stringify((r.transcript || []).slice(0, 14)));
          out('errors', JSON.stringify(r.errors || null));
        }
      }, 30);
    } catch (e) { out('EXC', String(e) + ' ' + (e.stack || '')); }
  }, 300);
});
</script>""" % lvl
page = os.path.join(ROOT, 'deep16', '_rec-test.html')
open(page, 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"></head><body>\n<canvas id="screen" width="480" height="270" tabindex="0"></canvas>\n' + '\n'.join(tags) + '\n' + test + '\n</body></html>')
prof = os.path.join(tempfile.gettempdir(), 'deep16-rectest-%d' % os.getpid())
cmd = [EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--virtual-time-budget=30000', '--dump-dom', 'file:///' + page.replace('\\', '/')]
dom = subprocess.run(cmd, capture_output=True, timeout=180).stdout.decode('utf-8', 'replace')
os.remove(page)
for m in re.findall(r'(?:RES|RECERR)[^<]*', dom): print(H.unescape(m)[:900])
