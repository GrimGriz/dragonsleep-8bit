"""Solskaft headless (the Solskaft build seat, 11-11, after dev/inn-shot.py): deep16/?solskaft at a beat, the canvas to dev/shots/solskaft-<beat>[-<tag>].png.
  python dev/solskaft-shot.py [beat] [tag] [cx,cy] [zoom]   (beat: doors by default; cx,cy: the square the camera looks at; zoom: a zoom step, 0 the closest)
For a worktree that can't be served (dev/bench16.py's browser, the page beside deep16/index.html so its art resolves; removed after)."""
import base64, os, re, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE); import bench16; EDGE = bench16.browser()
beat = sys.argv[1] if len(sys.argv) > 1 else 'doors'
tag = sys.argv[2] if len(sys.argv) > 2 else ''
at = sys.argv[3] if len(sys.argv) > 3 else ''
zs = sys.argv[4] if len(sys.argv) > 4 else ''
html = open(os.path.join(ROOT, 'deep16', 'index.html'), encoding='utf-8').read()
tags = []
for m in re.finditer(r'<script(?: src="([^"]+)")?>(.*?)</script>', html, re.S):
    src, body = m.group(1), m.group(2)
    if src:
        src = src.split('?')[0]
        if src.endswith('js/main.js'): continue
        tags.append('<script src="%s"></script>' % src)
    else:
        tags.append('<script>%s</script>' % body)
test = """<script>
window.onerror = function (m, s, l) { var p = document.createElement('pre'); p.textContent = 'LOADERR ' + m + ' @ ' + s + ':' + l; document.body.appendChild(p); };
var D = window.D16; D.initCanvas(); if (D.audio) D.audio.musicVol = 0;
var AT = '%s', ZS = '%s';
D.loadImages(D.spr.images(), function () {
  D.push(D.solskaft.show('?solskaft&beat=%s'));
  setTimeout(function () {
    for (var i = 0; i < 60; i++) D.update();
    if (ZS !== '' && D.ui && D.ui.zooms) { var Lz = D.ui.zooms(); D.iso.zoom = Lz[Math.min(+ZS, Lz.length - 1)]; }
    var look = function () { if (AT) { var q = AT.split(',').map(Number); D.iso.lookAt(q[0] - 1.5, q[1] - 1.5, 0); } }; // (the square a little under the middle: the floor's card over the top)
    look(); D.draw();
    setTimeout(function () { look(); D.draw(); var p = document.createElement('pre'); p.textContent = 'SHOT ' + D.canvas.toDataURL('image/png'); document.body.appendChild(p);
      var p2 = document.createElement('pre'); p2.textContent = 'DONE ' + (D.lastError || '') + ' said=' + JSON.stringify(D.solskaft.lastSaid || null); document.body.appendChild(p2); }, 600);
  }, 2500);
});
</script>""" % (at, zs, beat)
page = os.path.join(ROOT, 'deep16', '_solskaft-shot.html')
open(page, 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"></head><body>\n<canvas id="screen" width="480" height="270" tabindex="0"></canvas>\n' + '\n'.join(tags) + '\n' + test + '\n</body></html>')
prof = os.path.join(tempfile.gettempdir(), 'deep16-skshot-%d' % os.getpid())
cmd = [EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--user-data-dir=' + prof,
       '--virtual-time-budget=12000', '--window-size=1300,800', '--dump-dom', 'file:///' + page.replace('\\', '/')]
try:
    dom = subprocess.run(cmd, capture_output=True, timeout=180).stdout.decode('utf-8', 'replace')
finally:
    os.remove(page)
    import shutil; shutil.rmtree(prof, ignore_errors=True)
os.makedirs(os.path.join(HERE, 'shots'), exist_ok=True)
for b in re.findall(r'SHOT data:image/png;base64,([A-Za-z0-9+/=]+)', dom):
    out = os.path.join(HERE, 'shots', 'solskaft-%s%s.png' % (beat, '-' + tag if tag else ''))
    open(out, 'wb').write(base64.b64decode(b)); print('wrote', out)
print(re.findall(r'(?:LOADERR|DONE)[^<]*', dom))
